// H2B, la corniche du Cap Rouge (plan 0.10, chantier I) : le modèle importé (ses obstacles, ses deux goulets, la
// barricade du tunnel fermée), le pin tombé (le tas de bois personnel : 10 bûches à chacun, qui reviennent en 6 h), la
// pierre et le bois sans glaise, le fil dentaire des chambres du Panoramique, les Éteints de la fiche, et le voyage
// terrain → corniche → phare.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BARRICADE, CAISSE_PEAGE, PIN_TOMBE, RUBAN, SORTIES_CORNICHE, ZONE_CORNICHE, accessibleCorniche, heurteCorniche, pieceCorniche, sombreCorniche, zoneCorniche } from "../../commun/src/corniche.ts";
import { BUTIN_CORNICHE, SEMIS_CORNICHE, eteintsCorniche, ressourcesCorniche } from "../../commun/src/corniche-contenu.ts";
import { ETEINTS_CORNICHE, OBSTACLES_BARRICADE, OBSTACLES_PIN } from "../../commun/src/corniche-modele.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, arriveeDans, etapeVers, sortiesDe, zoneDe, type LieuId } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { planDe, sombreDans } from "../../commun/src/registre-lieux.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import { USAGES, type RessourceSol } from "../../commun/src/terrain.ts";
import { LIEU_DE_FOUILLE, tirerVestiges } from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { LieuCorniche } from "./corniche.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { Moulins } from "./moulin.ts";

rendreSilencieux(true);

const HEURE = 3_600_000;

/** Un monde en mémoire, comme celui du serveur (le registre construit la corniche au premier passage). */
function monde(alea: () => number = Math.random) {
  const base = new Base(":memory:");
  let instant = base.debutMonde() + 1_000_000;
  const maintenant = () => instant;
  const halte = new Halte(base);
  const gue = new Gue(base);
  const cooperatives = new Cooperatives(base, Math.random, maintenant);
  const moulins = new Moulins(base, Math.random, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, alea, maintenant);
  const joueurs: Joueur[] = [];
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      for (const j of joueurs) j.tick(pas);
      lieux.tick(instant, pas);
    }
  };
  const nouveau = (pseudo: string) => {
    const compte = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverInventaire(compte.id, { sac_a_dos: 1 });
    const recus: MessageServeur[] = [];
    const joueur = new Joueur({ id: compte.id, pseudo, famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, alea, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
    joueurs.push(joueur);
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const inv = () => dernier("inventaire")?.inventaire ?? {};
    /** Se poster à la sortie qui mène vers `vers` (au terrain, n'importe où), prendre la route, et arriver. */
    const voyager = (vers: LieuId) => {
      const etape = etapeVers(joueur.lieu, vers);
      const s = joueur.lieu === "terrain" ? SORTIE_TERRAIN : sortiesDe(joueur.lieu).find((x) => x.vers === etape || x.aussi?.includes(etape))!;
      joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
      joueur.recevoir({ t: "voyager", vers });
      attendre(DUREE_VOYAGE_S + 0.5);
    };
    return { compte, joueur, recus, dernier, inv, voyager };
  };
  const corniche = () => lieux.vivant("corniche", 0)!;
  /** Prendre une ressource de la corniche : on s'y place, on agit, on attend le geste. */
  const prendre = (j: Joueur, r: RessourceSol | { id: number; type: RessourceSol["type"]; x: number; z: number }, secondes = 3) => {
    j.position = { x: r.x, z: r.z, o: 0 };
    j.recevoir({ t: "interagir", cible: { genre: "ressource", id: r.id }, verbe: USAGES[r.type].verbe });
    attendre(secondes);
  };
  return { base, lieux, corniche, nouveau, attendre, prendre, maintenant, sauter: (ms: number) => (instant += ms) };
}

test("les données tirées du modèle sont à jour (scripts/extraire-corniche.mjs)", async () => {
  // @ts-expect-error : le script est en JavaScript, sans types.
  const { extraire, ecrire } = (await import("../../scripts/extraire-corniche.mjs")) as { extraire(): Promise<unknown>; ecrire(d: unknown): string };
  const attendu = ecrire(await extraire());
  assert.equal(readFileSync(new URL("../../commun/src/corniche-modele.ts", import.meta.url), "utf8"), attendu, "relancer node scripts/extraire-corniche.mjs");
  assert.equal(OBSTACLES_PIN.length, 3, "le tronc, les branches et la tête du pin");
  assert.equal(OBSTACLES_BARRICADE.length, 1, "la porte de la barricade");
});

test("le modèle importé : on arrive libre aux deux bouts, la barricade du tunnel coupe la route tant qu'on n'a pas payé", () => {
  assert.equal(zoneDe("corniche"), ZONE_CORNICHE);
  assert.ok(ZONE_CORNICHE.obstacles.length > 1000, "les obstacles du modèle");
  for (const s of SORTIES_CORNICHE) {
    assert.ok(!heurteCorniche(s.arrivee.x, s.arrivee.z, 0.35), `${s.vers} : l'arrivée est libre`);
    assert.ok(accessibleCorniche(s.arrivee.x, s.arrivee.z));
  }
  assert.deepEqual(arriveeDans("corniche", "terrain"), SORTIES_CORNICHE[0]!.arrivee);
  // Dans le passage de 2 m de la barricade : la porte fermée bute, ouverte on passe.
  assert.ok(heurteCorniche(BARRICADE.x, BARRICADE.z, 0.35), "fermée");
  assert.ok(!heurteCorniche(BARRICADE.x, BARRICADE.z, 0.35, true), "ouverte");
  assert.notEqual(zoneCorniche(true), zoneCorniche(false));
  assert.ok(zoneCorniche(true).obstacles.length < ZONE_CORNICHE.obstacles.length);
  // La caisse est du côté ouest (on vient du terrain), à portée de main depuis la route.
  assert.ok(CAISSE_PEAGE.x < BARRICADE.x);
  assert.ok([0, 0.5, 1, 1.5].some((d) => accessibleCorniche(CAISSE_PEAGE.x - 0.8 - d, CAISSE_PEAGE.z)), "on touche la caisse");
});

test("les deux goulets : le tunnel est noir ; l'éboulement ne laisse qu'un ruban d'environ 2,5 m", () => {
  assert.equal(planDe("corniche")?.pieces.includes("tunnel"), true, "la vue par pièce");
  assert.equal(pieceCorniche(60, 35), "tunnel");
  assert.ok(sombreCorniche(60, 35) && sombreDans("corniche", 60, 35), "le tunnel est noir, même de jour");
  assert.ok(!sombreCorniche(90, 36), "le belvédère, en plein air");
  // Au milieu du ruban, la largeur où l'on marche (le centre d'un personnage, rayon 0,3 m, sur une grille de 0,5 m).
  const x = (RUBAN.x0 + RUBAN.x1) / 2;
  let marche = 0;
  for (let z = 20; z < 50; z += 0.1) if (!heurteCorniche(x, z, 0.3, true) && accessibleCorniche(x, z)) marche += 0.1;
  assert.ok(marche > 1.4 && marche < 2.4, `le ruban : ${marche.toFixed(1)} m de passage pour le centre d'un personnage`);
});

test("la pierre et le bois, sans glaise ; les fouilles aux points de la fiche ; le pin tombé à sa place", () => {
  const r = ressourcesCorniche();
  const n = (t: string) => r.filter((x) => x.type === t).length;
  assert.equal(n("pin_tombe"), 1);
  assert.deepEqual(r.find((x) => x.type === "pin_tombe"), { id: 1, type: "pin_tombe", ...PIN_TOMBE });
  assert.equal(n("gisement_glaise"), 0, "pas de glaise (elle est au gué)");
  assert.ok(n("pierre") >= 50 && n("buche") >= 20 && n("branche") >= 45, "la pierre et le bois, trois tournées de vrac");
  assert.deepEqual(BUTIN_CORNICHE.vrac, { pierre: 20, buche: 8, branche: 18 });
  assert.deepEqual(Object.keys(SEMIS_CORNICHE.repousse).sort(), ["branche", "buche", "pierre"]);
  assert.equal(n("corniche_chambre"), 3, "les trois chambres du Panoramique");
  // Tout se ramasse depuis là où l'on marche, rien sur la chaussée sauf les éboulis, rien dans l'eau ni dans la paroi.
  for (const x of r) {
    const atteint = [0, 0.5, 1, 1.5, 1.9].some((d) => [0, 1, 2, 3, 4, 5, 6, 7].some((k) => accessibleCorniche(x.x + Math.cos(k) * d, x.z + Math.sin(k) * d)));
    assert.ok(atteint, `${x.type} ${x.x} ${x.z} : à portée`);
  }
  // Chaque fouille a son usage et sa table (le bric-à-brac).
  for (const t of ["corniche_boutique", "corniche_cantonnier", "corniche_epave", "corniche_camp", "corniche_chambre", "corniche_cuisine", "corniche_villa", "corniche_cabanon"] as const) {
    assert.ok(n(t) >= 1, t);
    assert.ok(LIEU_DE_FOUILLE[t], `${t} : sa table`);
    assert.doesNotMatch(USAGES[t].examen, /laine/, `${t} : les couvertures sont polaires (N2-58)`);
  }
});

test("le fil dentaire est courant dans les chambres du Panoramique (N2-61), avec des chiffons ; les couvertures de laine n'y traînent pas", () => {
  assert.equal(USAGES.corniche_chambre.donne.chiffons, 1);
  let k = 7;
  const alea = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  let fil = 0;
  let laine = 0;
  for (let i = 0; i < 2000; i++) {
    const v = tirerVestiges("chambre_panoramique", alea, "H2B");
    if (v.fil_dentaire) fil++;
    if (v.couvertures_laine) laine++;
  }
  // Courant : ≈ une fouille de chambre sur sept (trois chambres par visite) ; ailleurs au niveau 1, il est rare.
  assert.ok(fil > 200, `${fil} fouilles sur 2 000 avec du fil dentaire`);
  let ailleurs = 0;
  for (let i = 0; i < 2000; i++) if (tirerVestiges("boutique", alea).fil_dentaire) ailleurs++;
  assert.ok(fil > ailleurs * 4, `bien plus que dans une boutique (${ailleurs})`);
  // Les couvertures de laine (un objet-clé de l'hôtel) ne sortent qu'au tirage rare d'un objet-clé (R-BUTIN), jamais de la table.
  assert.ok(laine < 20, `${laine} couvertures de laine en 2 000 fouilles`);
});

test("le pin tombé est personnel : 10 bûches à chacun ; celui de l'autre ne bouge pas ; il revient en 6 h", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  const malo = m.nouveau("Malo");
  rose.voyager("corniche");
  malo.voyager("corniche");
  m.corniche().eteints = [];
  const pin = rose.dernier("bienvenue")!.ressources.find((r) => r.type === "pin_tombe")!;
  assert.equal(pin.reste, REGLAGES.tas_bois_buches);
  assert.equal(pin.reste, 10);
  for (let i = 0; i < 11; i++) m.prendre(rose.joueur, pin);
  assert.equal(rose.inv().buche, 10, "dix, pas une de plus");
  assert.deepEqual(rose.dernier("ressource"), { t: "ressource", id: pin.id, disponible: false, reste: 0 });
  assert.equal(malo.recus.filter((x) => x.t === "ressource" && x.id === pin.id).length, 0, "le pin de Malo n'a pas bougé");
  assert.equal(m.corniche().vuePour(malo.compte.id, "mecanistes", m.maintenant()).find((r) => r.id === pin.id)!.reste, 10);
  m.prendre(malo.joueur, pin);
  assert.equal(malo.inv().buche, 1, "il a le sien");
  // 6 h réelles après la première bûche (le réglage du tas de bois de la station), tout est revenu pour Rose.
  m.sauter(6 * HEURE - 60_000);
  m.attendre(6);
  assert.ok(!m.corniche().disponiblePour(m.corniche().ressources.get(pin.id)!, rose.compte.id, m.maintenant()), "pas avant 6 h");
  m.sauter(60_000);
  m.attendre(6);
  assert.ok(rose.recus.some((x) => x.t === "ressource" && x.id === pin.id && x.reste === 10), "revenu en 6 h");
});

test("on fouille une chambre du Panoramique : des chiffons, et le bric-à-brac de la salle de bains", () => {
  let k = 3;
  const m = monde(() => ((k = (k * 16807) % 2147483647) / 2147483647));
  const rose = m.nouveau("Rose");
  rose.voyager("corniche");
  m.corniche().eteints = [];
  const chambres = rose.dernier("bienvenue")!.ressources.filter((r) => r.type === "corniche_chambre");
  assert.equal(chambres.length, 3);
  let fil = 0;
  let chiffons = 0;
  // Trois chambres, une visite toutes les 12 h, pendant une semaine ; on vide son sac entre deux fouilles.
  for (let jour = 0; jour < 14; jour++) {
    for (const c of chambres) {
      (rose.joueur as unknown as { inventaire: Record<string, number> }).inventaire = { sac_a_dos: 1 };
      m.prendre(rose.joueur, c, 6);
      fil += rose.inv().fil_dentaire ?? 0;
      chiffons += rose.inv().chiffons ?? 0;
    }
    m.sauter(12 * HEURE);
    m.attendre(1);
  }
  assert.equal(chiffons, 42, "des chiffons à chaque fouille");
  assert.ok(fil >= 1, `du fil dentaire (${fil} bobines en 42 fouilles)`);
});

test("les Éteints de la fiche (≈ 12, S-06) ; aucun au pied d'une arrivée", () => {
  const e = eteintsCorniche();
  assert.equal(e.length, ETEINTS_CORNICHE.length - 1);
  assert.ok(e.length >= 10 && e.length <= 14);
  for (const x of e) {
    assert.ok(accessibleCorniche(x.x, x.z), `l'Éteint ${x.id} est là où l'on marche`);
    for (const s of SORTIES_CORNICHE) assert.ok(Math.hypot(x.x - s.arrivee.x, x.z - s.arrivee.z) > 5, `l'Éteint ${x.id} loin de l'arrivée ${s.vers}`);
  }
  assert.ok(e.some((x) => x.variante === "rampant" && pieceCorniche(x.x, x.z) === "tunnel"), "le Rampant dans le noir du tunnel");
  assert.ok(e.some((x) => x.etat === "errant" && x.x > RUBAN.x0 && x.x < RUBAN.x1), "l'Errant sur le ruban de l'éboulement");
});

test("on voyage terrain → corniche → phare, et retour ; la corniche est une halte à elle, partagée, avec ses Éteints", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  rose.voyager("phare");
  assert.equal(rose.joueur.lieu, "corniche", "la route du phare passe par la corniche");
  assert.deepEqual(rose.dernier("bienvenue")!.position, arriveeDans("corniche", "terrain"));
  assert.ok(m.lieux.vivant("corniche", 0) instanceof LieuCorniche);
  assert.ok(rose.dernier("bienvenue")!.ressources.length > 100, "son contenu");
  assert.equal(m.corniche().eteints.length, eteintsCorniche().length);
  rose.voyager("phare");
  assert.equal(rose.joueur.lieu, "phare");
  rose.voyager("corniche");
  assert.equal(rose.joueur.lieu, "corniche");
  assert.deepEqual(rose.dernier("bienvenue")!.position, arriveeDans("corniche", "phare"), "on revient du côté du phare");
  rose.voyager("terrain");
  assert.equal(rose.joueur.lieu, "terrain");
});
