// Le bilan des mesures du test familial (Book 17 §6), en français, prêt à coller dans une revue.
// Usage : npm run bilan [-- --depuis 2026-10-10] [-- --base chemin/vers/watt.sqlite]
// La base est ouverte en lecture seule : on peut lancer le bilan pendant que le serveur tourne.

import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { bilanMetier, type GenreMesure } from "../serveur/src/mesures.ts";
import { FICHIER_ETAT_CLE, resumeEtatCle, type EtatCle } from "../serveur/src/cle-sauvegardes.ts";

const args = process.argv.slice(2);
const option = (nom: string) => {
  const i = args.indexOf(`--${nom}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const chemin = option("base") ?? process.env.WATT_BASE ?? join(import.meta.dirname, "..", "serveur", "donnees", "watt.sqlite");
const depuis = option("depuis") ? Date.parse(option("depuis")!) : 0;

const db = new DatabaseSync(chemin, { readOnly: true });

interface Ligne {
  instant: number;
  compte_id: number;
  famille: string;
  genre: string;
  quoi: string;
  valeur: number;
  details: string | null;
}
const lignes = db.prepare("SELECT * FROM mesures WHERE instant >= ? ORDER BY instant").all(depuis) as unknown as Ligne[];
const de = (genre: string) => lignes.filter((l) => l.genre === genre);
const FAMILLES = ["charbonniers", "voltaiques", "mecanistes"];
const NOMS: Record<string, string> = { charbonniers: "🔥 Charbonniers", voltaiques: "⚡ Voltaïques", mecanistes: "⚙️ Mécanistes" };
const nombre = (v: number, d = 0) => v.toLocaleString("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d });
const heures = (s: number) => `${nombre(s / 3600, 1)} h`;
const date = (ms: number) => new Date(ms).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
const tableau = (entetes: string[], rangs: (string | number)[][]) =>
  [`| ${entetes.join(" | ")} |`, `|${entetes.map(() => "---").join("|")}|`, ...rangs.map((r) => `| ${r.join(" | ")} |`)].join("\n");

const sortie: string[] = [];
const titre = (t: string) => sortie.push("", `## ${t}`, "");

sortie.push("# Bilan des mesures du test familial");
// L'état de la copie des sauvegardes sur la clé USB (écrit par le serveur à côté de ses sauvegardes).
try {
  const dossierSauvegardes = process.env.WATT_SAUVEGARDES ?? join(dirname(chemin), "sauvegardes");
  const etatCle = JSON.parse(readFileSync(join(dossierSauvegardes, FICHIER_ETAT_CLE), "utf8")) as Partial<EtatCle>;
  sortie.push("", `Sauvegardes — ${resumeEtatCle(etatCle)}.`);
} catch {
  // pas de clé configurée : rien à dire
}
if (lignes.length === 0) {
  sortie.push("", "Aucune mesure pour l'instant.");
  console.log(sortie.join("\n"));
  process.exit(0);
}
sortie.push("", `Du ${date(lignes[0]!.instant)} au ${date(lignes.at(-1)!.instant)} · ${new Set(lignes.filter((l) => l.compte_id > 0).map((l) => l.compte_id)).size} joueurs.`);

// ---------- Séances ----------
titre("Séances");
{
  const s = de("session");
  sortie.push(
    tableau(
      ["Famille", "Joueurs", "Séances", "Temps de jeu", "Séance moyenne"],
      FAMILLES.map((f) => {
        const lf = s.filter((l) => l.famille === f);
        const total = lf.reduce((a, l) => a + l.valeur, 0);
        return [NOMS[f]!, new Set(lf.map((l) => l.compte_id)).size, lf.length, heures(total), lf.length ? `${nombre(total / lf.length / 60)} min` : "–"];
      }),
    ),
  );
}

// ---------- Temps par activité ----------
titre("Temps par activité (part du temps d'action)");
{
  const a = de("activite");
  const categories = [...new Set(a.map((l) => l.quoi))].sort();
  sortie.push(
    tableau(
      ["Activité", ...FAMILLES.map((f) => NOMS[f]!)],
      categories.map((c) => [
        c,
        ...FAMILLES.map((f) => {
          const tot = a.filter((l) => l.famille === f).reduce((s, l) => s + l.valeur, 0);
          const v = a.filter((l) => l.famille === f && l.quoi === c).reduce((s, l) => s + l.valeur, 0);
          return tot ? `${heures(v)} (${nombre((v / tot) * 100)} %)` : "–";
        }),
      ]),
    ),
  );
}

// ---------- Wotts ----------
titre("Flux de wotts");
{
  const w = de("wotts");
  const motifs = [...new Set(w.map((l) => l.quoi))].sort();
  sortie.push(
    tableau(
      ["Motif", ...FAMILLES.map((f) => NOMS[f]!), "Total"],
      motifs.map((m) => [
        m,
        ...FAMILLES.map((f) => nombre(w.filter((l) => l.famille === f && l.quoi === m).reduce((s, l) => s + l.valeur, 0))),
        nombre(w.filter((l) => l.quoi === m).reduce((s, l) => s + l.valeur, 0)),
      ]),
    ),
  );
}

// ---------- Effondrements ----------
titre("Causes d'effondrement");
{
  const e = de("effondrement");
  const causes = [...new Set(e.map((l) => l.quoi))];
  sortie.push(e.length ? tableau(["Cause", "Fois"], causes.map((c) => [c, e.filter((l) => l.quoi === c).length])) : "Aucun effondrement.");
}

// ---------- Progression ----------
titre("Progression par famille et par semaine");
{
  const p = de("progression");
  const debut = lignes[0]!.instant;
  const semaine = (ms: number) => Math.floor((ms - debut) / (7 * 24 * 3_600_000)) + 1;
  const semaines = [...new Set(p.map((l) => semaine(l.instant)))].sort((a, b) => a - b);
  sortie.push(
    tableau(
      ["Semaine", ...FAMILLES.map((f) => `${NOMS[f]} : recettes`)],
      semaines.map((s) => [s, ...FAMILLES.map((f) => p.filter((l) => l.famille === f && semaine(l.instant) === s && l.quoi.startsWith("recette:")).length)]),
    ),
  );
  const tuto = new Map<number, number>();
  for (const l of p.filter((x) => x.quoi.startsWith("tutoriel:"))) tuto.set(l.compte_id, Math.max(tuto.get(l.compte_id) ?? 0, Number(l.quoi.split(":")[1])));
  if (tuto.size) sortie.push("", `Tutoriel : étape atteinte par joueur → ${[...tuto.values()].sort((a, b) => a - b).join(", ")} (sur 12).`);
  const recettes = new Map<string, number>();
  for (const l of p.filter((x) => x.quoi.startsWith("recette:"))) recettes.set(l.quoi.slice(8), (recettes.get(l.quoi.slice(8)) ?? 0) + 1);
  if (recettes.size) sortie.push("", `Recettes les plus faites : ${[...recettes].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([r, n]) => `${r} (${n})`).join(", ")}.`);
}

// ---------- Le métier des familles (Book 25 §10.1, 0.6) ----------
titre("Le métier des familles : les critères de réussite de la 0.6");
{
  const b = bilanMetier(lignes.map((l) => ({ instant: l.instant, compteId: l.compte_id, famille: l.famille, genre: l.genre as GenreMesure, quoi: l.quoi, valeur: l.valeur })));
  const part = (v: number | null) => (v === null ? "–" : `${nombre(v * 100)} %`);
  const jours = (v: number | null) => (v === null ? "pas encore" : `${nombre(v, 1)} j`);
  sortie.push(
    tableau(
      ["Critère", "Mesure", "Objectif"],
      [
        ["Joueurs qui ont tiré une flèche ou un carreau", `${b.tireurs} sur ${b.joueurs} (${part(b.partTireurs)})`, "60 % ou plus"],
        ["Éteints détruits d'un tir plein à la tête", String(b.tirPlein), "au moins 1"],
        ...FAMILLES.map((f) => [`${NOMS[f]} : première arme de métier ★★`, jours(b.armeDeMetier[f as keyof typeof b.armeDeMetier] ?? null), "moins de 2 jours de calendrier"]),
        ["Échanges de métier entre joueurs", b.echangesParJoueurSemaine === null ? "–" : `${nombre(b.echangesParJoueurSemaine, 1)} par joueur et par semaine`, "1 ou plus, les trois familles là"],
        ["Temps à se défendre", FAMILLES.map((f) => `${NOMS[f]} ${part(b.defense[f as keyof typeof b.defense] ?? null)}`).join(" · "), `écart de 5 points au plus (${b.ecartDefense === null ? "–" : `${nombre(b.ecartDefense * 100, 1)} points`})`],
        ["Arbalètes lourdes faites", String(b.arbaletesLourdes), "au moins 1 par test"],
      ],
    ),
  );
  const d = Object.entries(b.destructions).sort((x, y) => y[1] - x[1]);
  if (d.length) sortie.push("", `Éteints détruits, par façon de faire : ${d.map(([c, n]) => `${c} (${n})`).join(", ")}.`);
  sortie.push("", "La clôture qui tient une nuit ne se mesure pas encore : à noter à la main pendant le test.");
}

// ---------- Serveur ----------
titre("Serveur");
{
  const s = de("serveur");
  const quoi = [...new Set(s.map((l) => l.quoi))];
  sortie.push(
    tableau(
      ["Mesure", "Moyenne", "Maximum"],
      quoi.map((q) => {
        const v = s.filter((l) => l.quoi === q).map((l) => l.valeur);
        return [q, nombre(v.reduce((a, b) => a + b, 0) / v.length, 1), nombre(Math.max(...v), 1)];
      }),
    ),
  );
}

// ---------- Appareils ----------
titre("Images par seconde des appareils (objectif : 30 sur iPhone 13)");
{
  const c = de("client");
  const appareils = [...new Set(c.map((l) => l.quoi))];
  sortie.push(
    c.length
      ? tableau(
          ["Appareil", "Minutes mesurées", "Images/s moyennes", "Creux (5 % des images les plus lentes)", "Qualité"],
          appareils.map((a) => {
            const la = c.filter((l) => l.quoi === a);
            const bas = la.map((l) => (JSON.parse(l.details ?? "{}") as { ipsBas?: number }).ipsBas ?? 0);
            const qualites = [...new Set(la.map((l) => (JSON.parse(l.details ?? "{}") as { qualite?: string }).qualite))].join(", ");
            return [a, la.length, nombre(la.reduce((s, l) => s + l.valeur, 0) / la.length, 1), nombre(bas.reduce((s, b) => s + b, 0) / bas.length, 1), qualites];
          }),
        )
      : "Aucune mesure d'appareil.",
  );
}

console.log(sortie.join("\n"));
