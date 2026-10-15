// La nuit du phare (décision du porteur, 2026-10-15) : quand on allume la lanterne, on a déjà tué les Éteints du lieu ;
// 2 ou 3 Éteints arrivent alors de la lande, hors de la vue du joueur, et marchent jusqu'à lui, qu'il reste dans la tour
// au pied de l'escalier ou qu'il attende dehors devant la porte. Une fois par nuit ; pas gardés en base.
//
// De bout en bout, avec les vraies classes : le joueur (Joueur), le registre des lieux (LieuxVivants) et son phare
// (Phares, LieuPhare). Le joueur arrive par la route, prépare la lanterne par ses gestes (qui durent), allume de nuit.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, etapeVers, heurte, sortiesDe } from "../../commun/src/lieux.ts";
import type { MessageServeur, Verbe } from "../../commun/src/messages.ts";
import { DUREES_PHARE, ENDROITS_PHARE, PORTES_PHARE, TEXTES_PHARE, piecePhare, zonePhare, type ElementPhare } from "../../commun/src/phare.ts";
import { LANDE } from "../../commun/src/phare-vivant.ts";
import { REINITIALISATION_LIEU_MS } from "../../commun/src/registre-lieux.ts";
import { MS_PAR_HEURE_JEU, estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { Moulins } from "./moulin.ts";
import type { LieuPhare } from "./phare.ts";

rendreSilencieux(true);

/** Devant la porte de la tour, dehors (la porte donne au sud, sur le chemin des douaniers). */
const PORTE_TOUR = PORTES_PHARE.find((p) => p.id === "tour")!;
const DEVANT_LA_PORTE = { x: PORTE_TOUR.x, z: PORTE_TOUR.z + 1.6 };

/** Un monde en mémoire, un joueur qui arrive au phare par la route, à la nuit tombée (22 h), Éteints du lieu tous morts. */
function auPhare(graine = 0.3) {
  const base = new Base(":memory:");
  let instant = base.debutMonde() + 16 * MS_PAR_HEURE_JEU;
  const maintenant = () => instant;
  let k = graine;
  const alea = () => (k = (k * 9301 + 0.4929) % 1);
  const halte = new Halte(base);
  const gue = new Gue(base);
  const cooperatives = new Cooperatives(base, alea, maintenant);
  const moulins = new Moulins(base, alea, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, alea, maintenant);
  const c = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(c.id, { sac_a_dos: 1 });
  const recus: MessageServeur[] = [];
  const joueur = new Joueur({ id: c.id, pseudo: "Rose", famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, alea, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
  const attendre = (secondes: number, pas = 0.1) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
      lieux.tick(instant, pas);
    }
  };
  const voyager = (vers: "corniche" | "phare") => {
    const etape = etapeVers(joueur.lieu, vers);
    const s = joueur.lieu === "terrain" ? SORTIE_TERRAIN : sortiesDe(joueur.lieu).find((x) => x.vers === etape || x.aussi?.includes(etape))!;
    joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers });
    attendre(DUREE_VOYAGE_S + 0.5, 0.5);
  };
  voyager("corniche");
  voyager("phare");
  assert.equal(joueur.lieu, "phare");
  joueur.recevoir({ t: "arrivee" });
  const lieu = () => lieux.vivant("phare", c.id) as LieuPhare;
  // Les Éteints du lieu : tous tués avant l'allumage (ce qu'a fait le porteur).
  for (const e of lieu().eteints) e.etat = "detruit";
  attendre(1);
  const aller = (o: { x: number; z: number }) => (joueur.position = { x: o.x, z: o.z, o: 0 });
  const faire = (id: ElementPhare, verbe: Verbe, duree = 0) => {
    joueur.recevoir({ t: "interagir", cible: { genre: "phare", id }, verbe });
    attendre(duree + 0.5);
  };
  const preparer = () => {
    aller(ENDROITS_PHARE.hangar);
    faire("escabeau", "porter");
    aller(ENDROITS_PHARE.marque);
    joueur.recevoir({ t: "poser" });
    aller(ENDROITS_PHARE.cuve);
    faire("cuve", "remplir", DUREES_PHARE.cuve);
    aller(ENDROITS_PHARE.prisme);
    faire("prisme", "ramasser", DUREES_PHARE.prisme);
    aller(ENDROITS_PHARE.marque);
    faire("escalier", "remplir", DUREES_PHARE.verser);
    faire("escalier", "remettre", DUREES_PHARE.remettre);
    const e = lieu().etat;
    assert.equal(e.escabeau, "marque");
    assert.equal(e.bidon, "verse");
    assert.equal(e.prisme, "remis");
  };
  const allumer = () => faire("escalier", "allumer", DUREES_PHARE.allumer);
  const arrivants = () => lieu().eteints.filter((e) => e.id >= LANDE.premierNumero);
  /** Pendant `secondes`, le plus grand nombre d'arrivants debout à moins de 3 m du joueur (le joueur ne bouge pas). */
  const suivre = (secondes: number) => {
    let max = 0;
    for (let s = 0; s < secondes && max < 2; s += 0.5) {
      attendre(0.5);
      const p = joueur.position;
      max = Math.max(max, arrivants().filter((e) => e.etat !== "detruit" && Math.hypot(e.x - p.x, e.z - p.z) < 3).length);
    }
    return max;
  };
  return { base, lieux, joueur, lieu, attendre, aller, preparer, allumer, arrivants, suivre, recus, instant: () => instant, avancer: (ms: number) => (instant += ms), debut: base.debutMonde(), compte: c.id };
}

test("la nuit du phare : allumé depuis le pied de l'escalier, 2 ou 3 Éteints arrivent de la lande, hors de vue, et viennent jusqu'au joueur dans la tour", () => {
  for (const graine of [0.3, 0.71, 0.05, 0.52]) {
    const p = auPhare(graine);
    p.preparer();
    assert.ok(estNuit(heureDeJeu(p.instant(), p.debut)));
    assert.equal(p.lieu().eteints.filter((e) => e.etat !== "detruit").length, 0, "tous les Éteints du lieu sont morts");
    p.aller(ENDROITS_PHARE.marque);
    p.allumer();
    assert.notEqual(p.lieu().etat.allumeLe, null);
    const venus = p.arrivants();
    assert.ok(venus.length >= LANDE.nombre[0] && venus.length <= LANDE.nombre[1], `${venus.length} arrivants`);
    const joueur = p.joueur.position;
    for (const e of venus) {
      // (Ils ont fait un demi-pas depuis : le geste a fini de se jouer.)
      assert.ok(Math.hypot(e.x - joueur.x, e.z - joueur.z) >= LANDE.distanceMin - 1, "loin du joueur");
      assert.ok(!p.lieu().voitEntre(joueur, e), "hors de sa vue");
      assert.equal(piecePhare(e.x, e.z), "dehors");
      assert.ok(e.x < 2 || e.x > 58 || e.z < 2, `au bord du lot côté lande (${e.x.toFixed(1)}, ${e.z.toFixed(1)})`);
      assert.equal(e.variante, undefined, "un Errant ordinaire");
    }
    const max = p.suivre(60);
    assert.ok(max >= 2, `graine ${graine} : ${max} arrivant(s) à moins de 3 m du joueur, dans la tour, en 60 s`);
  }
});

test("la nuit du phare : le joueur sort et attend devant la porte de la tour, ils viennent jusqu'à lui", () => {
  for (const graine of [0.3, 0.71, 0.05, 0.52]) {
    const p = auPhare(graine);
    assert.ok(!heurte(zonePhare({}), DEVANT_LA_PORTE.x, DEVANT_LA_PORTE.z, 0.3));
    p.preparer();
    p.aller(ENDROITS_PHARE.marque);
    p.allumer();
    assert.ok(p.arrivants().length >= 2);
    p.aller(DEVANT_LA_PORTE);
    assert.equal(piecePhare(DEVANT_LA_PORTE.x, DEVANT_LA_PORTE.z), "dehors");
    const max = p.suivre(60);
    assert.ok(max >= 2, `graine ${graine} : ${max} arrivant(s) à moins de 3 m du joueur, devant la porte, en 60 s`);
  }
});

test("la nuit du phare : une fois par nuit ; pas gardés en base ; partis au retour du phare à 24 h", () => {
  const p = auPhare();
  p.preparer();
  p.aller(ENDROITS_PHARE.marque);
  p.allumer();
  const n = p.arrivants().length;
  assert.ok(n >= 2);
  // Une seconde fois, la même nuit : la lanterne brûle déjà, personne d'autre ne vient.
  p.recus.length = 0;
  p.allumer();
  assert.ok(p.recus.some((m) => m.t === "info" && m.texte === TEXTES_PHARE.dejaAllume));
  assert.equal(p.arrivants().length, n);
  // Tués, ils ne comptent pas parmi les détruits du lieu (la fiche ne les connaît pas).
  for (const e of p.arrivants()) e.etat = "detruit";
  p.attendre(1);
  (p.lieux.gardien("phare") as unknown as { sauverEtat(id: number): void }).sauverEtat(p.compte);
  const garde = p.base.chargerInstance(`phare:${p.compte}`) as { detruits: number[] };
  assert.ok(garde.detruits.length > 0 && garde.detruits.every((id) => id < LANDE.premierNumero), `détruits gardés : ${garde.detruits}`);
  // Le retour du phare (24 h, le joueur parti) : ni arrivants ni lanterne.
  const greve = sortiesDe("phare").find((s) => s.sansArrivee)!;
  p.joueur.position = { x: greve.boite.x, z: greve.boite.z, o: 0 };
  p.joueur.recevoir({ t: "voyager", vers: "corniche" });
  p.attendre(DUREE_VOYAGE_S + 0.5, 0.5);
  p.avancer(REINITIALISATION_LIEU_MS);
  const s = sortiesDe("corniche").find((x) => x.vers === "phare" || x.aussi?.includes("phare"))!;
  p.joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
  p.joueur.recevoir({ t: "voyager", vers: "phare" });
  p.attendre(DUREE_VOYAGE_S + 0.5, 0.5);
  assert.equal(p.joueur.lieu, "phare");
  assert.equal(p.arrivants().length, 0);
  assert.equal(p.lieu().etat.allumeLe, null);
});
