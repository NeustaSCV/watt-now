// Plan 0.8, chantier 4 : la carte à deux routes. Le gué et le Moulin, branchés vides : on y voyage, on en revient, ils
// coûtent ce que coûte la route A ; on arrive toujours au Moulin par le pont ; god y va d'un coup.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ETAPES_LIEUX, LIEUX, DUREE_VOYAGE_S, SORTIES_GUE, SORTIES_MOULIN, SORTIE_TERRAIN, arriveeDans, distanceKm, entreesDe, etapeVers, lieuDeLEtape, ORDRE_ROUTE } from "../../commun/src/lieux.ts";
import { lieuxAdmin } from "../../commun/src/admin.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { preparerGod } from "./admin.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { Moulins } from "./moulin.ts";

rendreSilencieux(true);

/** Un monde en mémoire : la halte, le gué et les Moulins partagés entre les joueurs qu'on y ouvre. */
function monde() {
  const base = new Base(":memory:");
  const lieux = { halte: new Halte(base), gue: new Gue(base), moulins: new Moulins(base), cooperatives: new Cooperatives(base) };
  let instant = 1_000_000;
  const ouvrir = (compteId: number, pseudo: string) => {
    const recus: MessageServeur[] = [];
    const joueur = new Joueur(
      { id: compteId, pseudo, famille: "voltaiques" },
      base,
      (m) => recus.push(m),
      () => instant,
      lieux.halte,
      Math.random,
      new Comptoir(base, instant),
      lieux.cooperatives,
      lieux.gue,
      lieux.moulins,
    );
    const attendre = (secondes: number, pas = 0.5) => {
      for (let s = 0; s < secondes; s += pas) {
        instant += pas * 1000;
        joueur.tick(pas);
      }
    };
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    /** Se poster dans la boîte d'une sortie, prendre la route, et arriver. */
    const voyager = (boite: { x: number; z: number }, vers: Parameters<typeof distanceKm>[1]) => {
      joueur.position = { x: boite.x, z: boite.z, o: 0 };
      const avant = joueur.bienvenue(0).besoins;
      joueur.recevoir({ t: "voyager", vers });
      const apres = joueur.bienvenue(0).besoins;
      attendre(DUREE_VOYAGE_S + 0.5);
      return { kcal: avant.kcal - apres.kcal, eau: avant.eau - apres.eau };
    };
    return { joueur, recus, attendre, dernier, infos, voyager };
  };
  const nouveau = (pseudo: string) => {
    const c = base.creerCompte(pseudo, "potager42", "voltaiques");
    base.sauverInventaire(c.id, { sac_a_dos: 1 });
    return ouvrir(c.id, pseudo);
  };
  return { base, lieux, ouvrir, nouveau };
}

const sortieVers = (sorties: typeof SORTIES_GUE, vers: string, sansArrivee = false) => sorties.find((s) => s.vers === vers && !!s.sansArrivee === sansArrivee)!.boite;

test("la route B à la même distance que la route A (B16) : terrain → gué 3 km, gué → Moulin 2 km", () => {
  assert.equal(distanceKm("terrain", "gue"), 3);
  assert.equal(distanceKm("terrain", "gue"), distanceKm("terrain", "station"));
  assert.equal(distanceKm("gue", "moulin"), 2);
  assert.equal(distanceKm("gue", "moulin"), distanceKm("station", "cooperative"));
  assert.equal(distanceKm("terrain", "moulin"), distanceKm("terrain", "cooperative"));
  // On passe par le gué pour aller au Moulin, comme par la station pour la Coopérative ; et d'une route à l'autre, par chez soi.
  assert.equal(etapeVers("terrain", "moulin"), "gue");
  assert.equal(etapeVers("terrain", "cooperative"), "station");
  assert.equal(etapeVers("station", "gue"), "terrain");
  assert.equal(etapeVers("moulin", "terrain"), "gue");
});

test("les étapes du monde ont leur lieu, et l'affichage leur nom (Q-0.8-25)", () => {
  assert.equal(ETAPES_LIEUX.H1A, "station");
  assert.equal(ETAPES_LIEUX.H1B, "gue");
  assert.equal(ETAPES_LIEUX.L1A, "cooperative");
  assert.equal(ETAPES_LIEUX.L1B, "moulin");
  // 0.10 (chantier A) : le niveau 2 a ses lieux (avant : undefined).
  assert.equal(lieuDeLEtape("H2A"), "route_pont");
  assert.equal(LIEUX[lieuDeLEtape("H1B")!].nom, "Le Gué-aux-Saules");
  assert.equal(LIEUX[lieuDeLEtape("L1B")!].nom, "Le Moulin du Gué");
  // 0.8.2 (R18) : la carte ne promet plus rien (chantier K, client/src/textes-du-jeu.test.ts).
  assert.ok(Object.values(LIEUX).every((l) => !("promesse" in l)));
  assert.deepEqual(ORDRE_ROUTE.slice(-3), ["gue", "cooperative", "moulin"]);
});

test("on voyage du terrain au gué, du gué au Moulin, et retour ; la route B coûte ce que coûte la route A", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  const malo = m.nouveau("Malo");

  // Terrain → gué, et terrain → station : le même prix.
  const versGue = rose.voyager(SORTIE_TERRAIN.boite, "gue");
  const versStation = malo.voyager(SORTIE_TERRAIN.boite, "station");
  assert.deepEqual(versGue, versStation);
  assert.ok(versGue.kcal >= 180);
  let b = rose.dernier("bienvenue")!;
  assert.equal(b.lieu, "gue");
  // On arrive du terrain par le bout est de la route (l'entrée A du modèle, retourné pour suivre la carte).
  assert.deepEqual(b.position, SORTIES_GUE[0]!.arrivee);
  assert.ok(b.position.x > 150, "le terrain est à l'est du gué, comme sur la carte");
  // Rempli par le chantier 11 : des pierres, de la glaise, des joncs.
  assert.ok(b.ressources.some((r) => r.type === "gisement_glaise"));

  // Gué → Moulin, et station → Coopérative : le même prix.
  const versMoulin = rose.voyager(sortieVers(SORTIES_GUE, "moulin"), "moulin");
  const versCoop = malo.voyager({ x: 72, z: 10.5 }, "cooperative");
  assert.equal(malo.dernier("bienvenue")!.lieu, "cooperative");
  assert.deepEqual(versMoulin, versCoop);
  b = rose.dernier("bienvenue")!;
  assert.equal(b.lieu, "moulin");
  assert.deepEqual(b.position, SORTIES_MOULIN[0]!.arrivee, "on arrive au pont");

  // Retour par la route : on arrive au gué par le bout ouest, côté Moulin.
  rose.voyager(sortieVers(SORTIES_MOULIN, "gue"), "gue");
  b = rose.dernier("bienvenue")!;
  assert.equal(b.lieu, "gue");
  assert.deepEqual(b.position, SORTIES_GUE[1]!.arrivee);

  // Re-Moulin, puis le halage : une sortie qui mène aussi au gué.
  rose.voyager(sortieVers(SORTIES_GUE, "moulin"), "moulin");
  assert.equal(rose.joueur.lieu, "moulin");
  rose.voyager(sortieVers(SORTIES_MOULIN, "gue", true), "gue");
  assert.equal(rose.joueur.lieu, "gue");

  // Et l'on rentre chez soi, par le chemin de terre.
  rose.voyager(sortieVers(SORTIES_GUE, "terrain"), "terrain");
  b = rose.dernier("bienvenue")!;
  assert.equal(b.lieu, "terrain");
  assert.deepEqual(b.position, SORTIE_TERRAIN.arrivee);
});

test("du terrain, la route du Moulin passe par le gué : on s'y arrête", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  rose.voyager(SORTIE_TERRAIN.boite, "moulin");
  assert.equal(rose.joueur.lieu, "gue");
  assert.ok(rose.infos().some((t) => /La route du Moulin du Gué passe par le Gué-aux-Saules : il faudra le traverser à pied/.test(t)));
});

test("au Moulin, on arrive toujours par le pont ; le halage est une sortie sans arrivée", () => {
  const halage = SORTIES_MOULIN.find((s) => s.sansArrivee)!;
  assert.ok(halage, "le Moulin a une sortie sans arrivée");
  assert.equal(halage.vers, "gue");
  assert.ok(!entreesDe("moulin").includes(halage));
  for (const depuis of ORDRE_ROUTE) assert.deepEqual(arriveeDans("moulin", depuis), SORTIES_MOULIN[0]!.arrivee, depuis);
  // La brèche de la Coopérative, de même : on part par là, on n'y arrive pas.
  assert.ok(entreesDe("cooperative").every((s) => !s.sansArrivee));

  // Une reconnexion dans le Moulin ramène au pont (M19).
  const m = monde();
  const rose = m.nouveau("Rose");
  rose.voyager(SORTIE_TERRAIN.boite, "gue");
  rose.voyager(sortieVers(SORTIES_GUE, "moulin"), "moulin");
  rose.joueur.position = { x: halage.boite.x, z: halage.boite.z + 4, o: 0 };
  rose.joueur.sauvegarder();
  rose.joueur.partir();
  const retour = m.ouvrir(rose.joueur.compte.id, "Rose");
  assert.equal(retour.joueur.lieu, "moulin");
  assert.deepEqual(retour.joueur.position, SORTIES_MOULIN[0]!.arrivee);
});

test("le gué est partagé, comme la station ; le Moulin est à chacun, comme la Coopérative", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  const malo = m.nouveau("Malo");
  rose.voyager(SORTIE_TERRAIN.boite, "gue");
  malo.voyager(SORTIE_TERRAIN.boite, "gue");
  assert.equal(m.lieux.gue.nombrePresents, 2);
  assert.ok(rose.joueur.enLieuPublic);
  rose.voyager(sortieVers(SORTIES_GUE, "moulin"), "moulin");
  malo.voyager(sortieVers(SORTIES_GUE, "moulin"), "moulin");
  assert.equal(m.lieux.gue.nombrePresents, 0);
  assert.ok(!rose.joueur.enLieuPublic);
  assert.equal(m.lieux.moulins.nombre, 2);
  assert.notEqual(m.lieux.moulins.de(rose.joueur.compte.id), m.lieux.moulins.de(malo.joueur.compte.id));
  assert.equal(m.lieux.moulins.de(rose.joueur.compte.id).nombrePresents, 1);
  // Au Moulin, on est seul : la pause est permise ; au gué, non.
  rose.joueur.recevoir({ t: "pause", oui: true });
  assert.ok(rose.joueur.enPause());
});

test("god va au gué et au Moulin d'un coup (menu « Aller à… »)", () => {
  assert.deepEqual(
    lieuxAdmin().map((l) => l.id),
    // 0.10 (chantier A, décision du porteur) : et les quatre lieux du niveau 2.
    ["terrain", "station", "comptoir", "gue", "cooperative", "moulin", "route_pont", "grand_hotel", "corniche", "phare"],
  );
  const m = monde();
  const god = preparerGod(m.base, "olympe42", undefined, 1000).compte;
  const t = m.ouvrir(god.id, "god");
  t.joueur.recevoir({ t: "admin", op: { genre: "aller", vers: "gue" } });
  assert.equal(t.joueur.lieu, "gue");
  assert.equal(t.dernier("bienvenue")?.lieu, "gue");
  assert.equal(m.lieux.gue.nombrePresents, 1);
  t.joueur.recevoir({ t: "admin", op: { genre: "aller", vers: "moulin" } });
  assert.equal(t.joueur.lieu, "moulin");
  assert.deepEqual(t.joueur.position, SORTIES_MOULIN[0]!.arrivee);
  assert.equal(m.lieux.gue.nombrePresents, 0);
  t.joueur.recevoir({ t: "admin", op: { genre: "aller", vers: "terrain" } });
  assert.equal(t.joueur.lieu, "terrain");
  assert.equal(m.lieux.moulins.de(god.id).nombrePresents, 0);
});
