// Banc de charge du serveur : N joueurs simulés (faux sockets) dans le vrai Monde, pendant quelques secondes.
// Mesure : CPU (part d'un cœur), retard de la boucle d'événements, mémoire, débit envoyé par joueur.
// Usage : node scripts/banc-charge.ts <terrain|halte|cooperative> <joueurs> <secondes> [--detail] [--dechets]  (dans le conteneur : docker compose exec jeu node scripts/banc-charge.ts halte 50 30)
// « cooperative » (0.5g, Book 23 §7) : chacun dans sa Coopérative (24 Éteints chacune), une hache à la main ; il
// bouge et frappe sans arrêt : le pire cas pour l'IA. Cible : retard p99 < 25 ms à 10 joueurs sur le Pi.
// La base du banc est jetable : serveur/donnees/banc.sqlite, effacée à chaque lancement.

import { monitorEventLoopDelay } from "node:perf_hooks";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Base } from "../serveur/src/base.ts";
import { Monde } from "../serveur/src/monde.ts";

const scenario = process.argv[2] ?? "terrain";
const N = Number(process.argv[3] ?? 20);
const secondes = Number(process.argv[4] ?? 15);

const chemin = join(import.meta.dirname, "..", "serveur", "donnees", "banc.sqlite");
mkdirSync(join(chemin, ".."), { recursive: true });
for (const s of ["", "-wal", "-shm"]) rmSync(chemin + s, { force: true });
const base = new Base(chemin);
const monde = new Monde(base);

interface FauxClient {
  envoyer(m: unknown): void;
  octets: number;
  messages: number;
  x: number;
  z: number;
  /** Le dernier lieu annoncé par le serveur (un effondrement ramène au terrain). */
  lieu: string;
}
const clients: FauxClient[] = [];
const parType = new Map<string, number>();

for (let i = 0; i < N; i++) {
  const compte = base.creerCompte(`Joueur ${i}`, "motdepasse1", (["charbonniers", "voltaiques", "mecanistes"] as const)[i % 3]);
  if (scenario === "halte") base.sauverPosition(compte.id, { x: 20 + (i % 20) * 8, z: 33 + (i % 3), o: 0 }, "station", Date.now());
  if (scenario === "cooperative") {
    base.sauverInventaire(compte.id, { sac_a_dos: 1, hache: 1, lampe_frontale: 1 });
    base.sauverPosition(compte.id, { x: 43, z: 56, o: Math.PI }, "cooperative", Date.now());
  }
  const ecouteurs: Record<string, (d: Buffer) => void> = {};
  const c: FauxClient = {
    octets: 0,
    messages: 0,
    x: 0,
    z: 0,
    lieu: "",
    envoyer: (m) => ecouteurs.message?.(Buffer.from(JSON.stringify(m))),
  };
  const socket = {
    readyState: 1,
    OPEN: 1,
    send(s: string) {
      const octets = Buffer.byteLength(s);
      c.octets += octets;
      c.messages += 1;
      // Ce qui pèse, par type de message (pour savoir quoi alléger).
      const t = /"t":"([a-z_]+)"/.exec(s)?.[1] ?? "?";
      if (t === "bienvenue") c.lieu = /"lieu":"([a-z_]+)"/.exec(s)?.[1] ?? c.lieu;
      parType.set(t, (parType.get(t) ?? 0) + octets);
    },
    on(ev: string, f: (d: Buffer) => void) {
      ecouteurs[ev] = f;
    },
    close() {},
  };
  monde.rejoindre(compte, socket as never);
  clients.push(c);
}

// La phase d'arrivée (bienvenue) n'est pas comptée.
for (const c of clients) {
  c.octets = 0;
  c.messages = 0;
}
parType.clear();

// Chaque client change de direction ~4 fois par seconde (comme un joystick qu'on manie), et renvoie son intention.
let seq = 0;
const pilote = setInterval(() => {
  for (const c of clients) {
    const a = Math.random() * Math.PI * 2;
    c.envoyer({ t: "intention", dx: Math.cos(a), dz: Math.sin(a), allure: Math.random() < 0.2 ? "course" : "marche", seq: ++seq });
  }
}, 250);
// En Coopérative, on se bat : un coup toutes les 0,8 s (le serveur refuse ceux qui arrivent trop tôt).
const coups = setInterval(() => {
  if (scenario !== "cooperative") return;
  for (const c of clients) c.envoyer({ t: "frapper", appuye: Math.random() < 0.3 });
}, 800);
// La couche de déchets (0.7) : avec --dechets, chacun tente de ramasser une pièce au hasard deux fois par seconde
// (le serveur calcule le carreau, la distance, et refuse le plus souvent : « trop loin »).
const dechets = setInterval(() => {
  if (!process.argv.includes("--dechets")) return;
  for (const c of clients) c.envoyer({ t: "dechets", op: { genre: "ramasser", cx: Math.floor(Math.random() * 10), cz: Math.floor(Math.random() * 3), i: Math.floor(Math.random() * 12) } });
}, 500);
const pings = setInterval(() => {
  for (const c of clients) c.envoyer({ t: "ping", envoye: Date.now() });
}, 2000);

const retard = monitorEventLoopDelay({ resolution: 5 });
retard.enable();
const cpu0 = process.cpuUsage();
const t0 = performance.now();
monde.demarrer();

setTimeout(() => {
  monde.arreter();
  clearInterval(pilote);
  clearInterval(pings);
  clearInterval(coups);
  clearInterval(dechets);
  retard.disable();
  const duree = (performance.now() - t0) / 1000;
  const cpu = process.cpuUsage(cpu0);
  const partCoeur = (cpu.user + cpu.system) / 1e6 / duree;
  const octets = clients.reduce((s, c) => s + c.octets, 0);
  const messages = clients.reduce((s, c) => s + c.messages, 0);
  const mem = process.memoryUsage();
  console.log(
    JSON.stringify({
      scenario,
      joueurs: N,
      duree_s: Math.round(duree),
      cpu_part_coeur: +partCoeur.toFixed(3),
      cpu_ms_par_joueur_par_s: +((partCoeur * 1000) / N).toFixed(2),
      retard_boucle_p99_ms: +(retard.percentile(99) / 1e6).toFixed(1),
      retard_boucle_max_ms: +(retard.max / 1e6).toFixed(1),
      debit_ko_s_par_joueur: +(octets / 1024 / duree / N).toFixed(2),
      messages_s_par_joueur: +(messages / duree / N).toFixed(1),
      memoire_rss_mo: Math.round(mem.rss / 1048576),
      encore_sur_place: clients.filter((c) => c.lieu === (scenario === "halte" ? "station" : scenario)).length,
      tas_mo: Math.round(mem.heapUsed / 1048576),
    }),
  );
  if (process.argv.includes("--detail")) {
    for (const [t, o] of [...parType].sort((x, y) => y[1] - x[1])) console.log(`  ${t.padEnd(14)} ${(o / 1024 / duree / N).toFixed(2)} Ko/s par joueur`);
  }
  base.fermer();
  for (const s of ["", "-wal", "-shm"]) rmSync(chemin + s, { force: true });
  process.exit(0);
}, secondes * 1000);
