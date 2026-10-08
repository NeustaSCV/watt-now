// Étape 0.5a (Book 23 §8) : la Coopérative est un lieu vivant par joueur, au bout du chemin agricole qui part du
// Carrefour ; la route est une ligne (terrain → station → Carrefour → Coopérative).

import { test } from "node:test";
import assert from "node:assert/strict";
import { ARRIVEE_COOP, PORTES, portesInitiales } from "../../commun/src/cooperative.ts";
import { avancer } from "../../commun/src/deplacement.ts";
import { DUREE_VOYAGE_S, SORTIES_COMPTOIR, SORTIES_COOP, arriveeDans, dansBoite, etapeVers, heurte, sortiesDe, zoneCoop } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives, repeupler } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

test("la route est une ligne : du terrain à la Coopérative, on traverse la station puis le Carrefour", () => {
  assert.equal(etapeVers("terrain", "cooperative"), "station");
  assert.equal(etapeVers("station", "cooperative"), "comptoir");
  assert.equal(etapeVers("comptoir", "cooperative"), "cooperative");
  assert.equal(etapeVers("cooperative", "terrain"), "comptoir");
  assert.equal(etapeVers("comptoir", "terrain"), "station");
  // Au Carrefour, on arrive par l'est depuis la station, par le nord depuis la Coopérative.
  const depuisCoop = arriveeDans("comptoir", "cooperative");
  const depuisStation = arriveeDans("comptoir", "station");
  assert.ok(depuisCoop.z < 10 && depuisStation.x > 50);
  assert.deepEqual(arriveeDans("cooperative", "terrain"), { ...ARRIVEE_COOP });
  assert.equal(sortiesDe("cooperative")[0]!.vers, "comptoir");
});

function monter() {
  const base = new Base(":memory:");
  const halte = new Halte(base);
  const comptoir = new Comptoir(base);
  let instant = 1_000_000;
  const cooperatives = new Cooperatives(base, () => 0.5, () => instant);
  const joueurs: { joueur: Joueur; recus: MessageServeur[] }[] = [];
  const nouveau = (pseudo: string) => {
    const compte = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverInventaire(compte.id, { sac_a_dos: 1, hache: 1 });
    // Il attend au Carrefour, au pied du chemin agricole.
    base.sauverPosition(compte.id, arriveeDans("comptoir", "station"), "comptoir", instant);
    const recus: MessageServeur[] = [];
    const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5, comptoir, cooperatives);
    joueurs.push({ joueur, recus });
    return { compte, joueur, recus };
  };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      for (const j of joueurs) j.joueur.tick(pas);
      cooperatives.tick(instant, pas);
    }
  };
  const allerALaCoop = (j: Joueur) => {
    const sortie = SORTIES_COMPTOIR.find((s) => s.vers === "cooperative")!;
    j.position = { x: sortie.boite.x, z: sortie.boite.z, o: 0 };
    j.recevoir({ t: "voyager", vers: "cooperative" });
  };
  /** Déconnecté : le serveur ne l'anime plus. */
  const deconnecter = (j: Joueur) => {
    j.partir();
    joueurs.splice(joueurs.findIndex((x) => x.joueur === j), 1);
  };
  /** Le temps passe d'un coup (hors ligne). */
  const sauter = (ms: number) => (instant += ms);
  return { base, cooperatives, nouveau, attendre, allerALaCoop, deconnecter, sauter, halte, comptoir, maintenant: () => instant };
}

const derniere = (recus: MessageServeur[]) => recus.findLast((m) => m.t === "bienvenue") as Extract<MessageServeur, { t: "bienvenue" }> | undefined;

test("on prend le chemin agricole au nord du Carrefour, et l'on arrive au portail de sa Coopérative", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  t.allerALaCoop(a.joueur);
  assert.ok(a.recus.some((m) => m.t === "voyage" && m.vers === "cooperative"));
  t.attendre(DUREE_VOYAGE_S + 1);
  const b = derniere(a.recus)!;
  assert.equal(b.lieu, "cooperative");
  assert.deepEqual({ x: b.position.x, z: b.position.z }, { x: ARRIVEE_COOP.x, z: ARRIVEE_COOP.z });
  // Personne ne s'y montre : la Coopérative est privée.
  assert.equal(a.joueur.enLieuPublic, false);
  // Et l'on en repart par le portail, vers le Carrefour.
  a.joueur.position = { x: SORTIES_COOP[0]!.boite.x, z: SORTIES_COOP[0]!.boite.z, o: 0 };
  a.joueur.recevoir({ t: "voyager", vers: "comptoir" });
  t.attendre(DUREE_VOYAGE_S + 1);
  assert.equal(derniere(a.recus)!.lieu, "comptoir");
});

test("chacun sa Coopérative : deux joueurs ne voient pas les Éteints l'un de l'autre", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const b = t.nouveau("Basile");
  t.allerALaCoop(a.joueur);
  t.allerALaCoop(b.joueur);
  t.attendre(DUREE_VOYAGE_S + 1);
  const coopA = t.cooperatives.de(a.compte.id);
  const coopB = t.cooperatives.de(b.compte.id);
  assert.notEqual(coopA, coopB);
  assert.equal(t.cooperatives.nombre, 2);
  // Un Éteint détruit chez Rose reste debout chez Basile.
  coopA.eteints[0]!.etat = "detruit";
  assert.equal(coopB.eteints[0]!.etat, "errant");
  // Ce qui se passe chez Rose ne parvient pas à Basile.
  const avant = b.recus.length;
  coopA.diffuser({ t: "info", texte: "chez Rose" });
  assert.equal(b.recus.slice(avant).filter((m) => m.t === "info" && m.texte === "chez Rose").length, 0);
});

test("se reconnecter dans la Coopérative ramène au portail ; vide depuis 5 min, elle quitte la mémoire", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  t.allerALaCoop(a.joueur);
  t.attendre(DUREE_VOYAGE_S + 1);
  a.joueur.position = { x: 60, z: 25, o: 0 };
  a.joueur.sauvegarder();
  t.deconnecter(a.joueur);
  const revenu = new Joueur(a.compte, t.base, () => {}, () => 2_000_000, undefined, () => 0.5, undefined, t.cooperatives);
  assert.equal(revenu.lieu, "cooperative");
  assert.deepEqual({ x: revenu.position.x, z: revenu.position.z }, { x: ARRIVEE_COOP.x, z: ARRIVEE_COOP.z });
  revenu.partir();
  t.attendre(6 * 60, 5);
  assert.equal(t.cooperatives.nombre, 0);
});

// ---------- 0.5b : murs, portes, grille ----------

/** Marche tout droit pendant `secondes`, comme le serveur (pas de 50 ms). */
function marcher(depart: { x: number; z: number }, dx: number, dz: number, secondes: number, zone: ReturnType<typeof zoneCoop>) {
  let p = { ...depart, o: 0 };
  for (let t = 0; t < secondes; t += 0.05) p = avancer(p, { dx, dz, allure: "marche" }, 0.05, zone);
  return p;
}

test("0.5b : on ne traverse pas un mur, on passe une porte de 1,2 m ouverte, pas une porte fermée", () => {
  const fermees = zoneCoop(portesInitiales());
  // Dans le libre-service, face au mur du hangar (z = 32) : on s'y arrête.
  assert.ok(marcher({ x: 50, z: 35 }, 0, -1, 4, fermees).z > 32.2);
  // La porte des bureaux (1,2 m) est fermée au départ : on ne passe pas.
  const bureaux = PORTES.find((p) => p.id === "bureaux")!;
  assert.equal(bureaux.largeur, 1.2);
  assert.ok(marcher({ x: bureaux.x, z: 34.5 }, 0, -1, 4, fermees).z > 32.2);
  // Ouverte, on la franchit, du hangar au bureau et retour.
  const ouverte = zoneCoop({ ...portesInitiales(), bureaux: true });
  assert.ok(marcher({ x: bureaux.x, z: 34.5 }, 0, -1, 4, ouverte).z < 31);
  // (depuis l'allée du hangar, entre le dernier rayonnage et le mur)
  assert.ok(marcher({ x: bureaux.x, z: 30.6 }, 0, 1, 4, ouverte).z > 33);
});

test("0.5b : la grille donne les mêmes collisions que le calcul complet", () => {
  const zone = zoneCoop(portesInitiales());
  let graine = 7;
  const alea = () => ((graine = (graine * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 4000; i++) {
    const x = alea() * 80;
    const z = alea() * 60;
    const complet = zone.obstacles.some((b) => dansBoite(x, z, b, 0.35));
    assert.equal(heurte(zone, x, z, 0.35), complet, `(${x.toFixed(2)}, ${z.toFixed(2)})`);
  }
});

test("0.5b : on ouvre une porte, tout le monde le sait ; on ne la referme pas sur soi", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  t.allerALaCoop(a.joueur);
  t.attendre(DUREE_VOYAGE_S + 1);
  assert.equal(derniere(a.recus)!.portes?.bureaux, false);
  const coop = t.cooperatives.de(a.compte.id);
  // Trop loin : rien.
  a.joueur.recevoir({ t: "interagir", cible: { genre: "porte", id: "bureaux" }, verbe: "ouvrir_porte" });
  assert.equal(coop.portes.bureaux, false);
  // Devant la porte : elle s'ouvre, le message part, et ça fait un peu de bruit.
  a.joueur.position = { x: 61, z: 33.4, o: Math.PI };
  a.joueur.recevoir({ t: "interagir", cible: { genre: "porte", id: "bureaux" }, verbe: "ouvrir_porte" });
  assert.equal(coop.portes.bureaux, true);
  assert.deepEqual(a.recus.findLast((m) => m.t === "portes"), { t: "portes", portes: { ...coop.portes } });
  assert.ok(a.joueur.stimuli(false).some((s) => s.genre === "son" && s.x === 61 && s.z === 32));
  // Dans l'embrasure, on ne la referme pas.
  a.joueur.position = { x: 61, z: 32, o: 0 };
  a.joueur.recevoir({ t: "interagir", cible: { genre: "porte", id: "bureaux" }, verbe: "fermer_porte" });
  assert.equal(coop.portes.bureaux, true);
  // Un pas en arrière : elle se referme.
  a.joueur.position = { x: 61, z: 33.4, o: 0 };
  a.joueur.recevoir({ t: "interagir", cible: { genre: "porte", id: "bureaux" }, verbe: "fermer_porte" });
  assert.equal(coop.portes.bureaux, false);
  // Une porte qui n'existe pas : rien (le message est contrôlé, mais on vérifie quand même).
  a.joueur.recevoir({ t: "interagir", cible: { genre: "porte", id: "nulle_part" }, verbe: "ouvrir_porte" });
  assert.equal("nulle_part" in coop.portes, false);
});

test("0.5c : on ne reçoit pas les Éteints cachés derrière un mur (pas de triche en lisant les messages)", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  t.allerALaCoop(a.joueur);
  t.attendre(DUREE_VOYAGE_S + 1);
  const coop = t.cooperatives.de(a.compte.id);
  // Dans le hangar, contre le mur de la chambre froide (portes fermées) : les 6 dormants sont à 7 m, mais derrière le mur.
  a.joueur.position = { x: 64, z: 18.2, o: 0 };
  const vus = coop.eteintsVus(a.joueur.position).map((e) => e.id);
  const froide = coop.eteints.filter((e) => e.z < 16 && e.x > 52).map((e) => e.id);
  assert.equal(froide.length, 6);
  assert.ok(froide.every((id) => !vus.includes(id)));
  // Porte de la chambre froide ouverte, en face : on les voit par l'embrasure.
  coop.basculerPorte("froide_hangar", true);
  a.joueur.position = { x: 60, z: 18.5, o: 0 };
  assert.ok(coop.eteintsVus(a.joueur.position).some((e) => froide.includes(e.id)));
});

// ---------- 0.5d : persistance, repeuplement, butin ----------

test("0.5d : un Éteint détruit le reste, d'une visite à l'autre ; les portes aussi", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  t.allerALaCoop(a.joueur);
  t.attendre(DUREE_VOYAGE_S + 1);
  const coop = t.cooperatives.de(a.compte.id);
  coop.eteints.find((e) => e.id === 1)!.etat = "detruit";
  coop.basculerPorte("bureaux", true);
  t.attendre(1);
  t.deconnecter(a.joueur);
  t.attendre(6 * 60, 5);
  assert.equal(t.cooperatives.nombre, 0);
  // Une heure plus tard (moins que le délai de repeuplement), elle est rechargée telle quelle.
  t.sauter(3_600_000);
  const autre = new Cooperatives(t.base, () => 0.5, t.maintenant).de(a.compte.id);
  assert.ok(!autre.eteints.some((e) => e.id === 1 && e.etat !== "detruit"));
  assert.equal(autre.eteints.filter((e) => e.etat !== "detruit").length, 23);
  assert.equal(autre.portes.bureaux, true);
});

test("0.5d : le repeuplement — quelques Éteints reviennent toutes les 12 h, la chambre froide d'abord", () => {
  const debut = 5_000_000;
  const froide = [19, 20, 21, 22, 23, 24];
  const etat = { detruits: [1, 2, 5, ...froide], portes: portesInitiales(), repeupleLe: debut, klaxons: 4, piles: 600, radio: null };
  assert.deepEqual(repeupler(etat, debut + 11 * 3_600_000), etat, "rien avant 12 h");
  const apres12 = repeupler(etat, debut + 12.5 * 3_600_000);
  assert.equal(apres12.detruits.length, etat.detruits.length - 3);
  assert.ok([1, 2, 5].every((id) => apres12.detruits.includes(id)), "la chambre froide revient d'abord");
  const apres4j = repeupler(etat, debut + 4 * 24 * 3_600_000);
  assert.equal(apres4j.detruits.length, 0);
});

test("0.5d : le butin — un pied-de-biche garanti, le coffre à la clé du magasinier, le rare ne revient pas avant 4 jours", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  t.allerALaCoop(a.joueur);
  t.attendre(DUREE_VOYAGE_S + 1);
  const coop = t.cooperatives.de(a.compte.id);
  const r = (type: string) => [...coop.ressources.values()].find((x) => x.type === type)!;
  const fouiller = (type: string) => {
    const p = r(type);
    a.joueur.position = { x: p.x, z: p.z + 0.8, o: Math.PI };
    a.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: p.id }, verbe: "fouiller" });
    t.attendre(14);
  };
  const inv = () => (a.recus.findLast((m) => m.t === "inventaire") as Extract<MessageServeur, { t: "inventaire" }> | undefined)?.inventaire ?? {};
  // Les Éteints ne gênent pas ce test : on les couche tous, sauf le magasinier, à terre devant nous.
  const magasinier = coop.eteints.find((e) => e.variante === "magasinier")!;
  for (const e of coop.eteints) if (e !== magasinier) e.etat = "detruit";
  magasinier.etat = "a_terre";
  magasinier.aTerre = 60;
  fouiller("coop_caisse");
  assert.equal(inv().pied_de_biche, 1);
  // Le coffre : fermé sans la clé.
  fouiller("coop_coffre");
  assert.ok(!inv().semences_f1);
  assert.ok(a.recus.some((m) => m.t === "info" && /Fermé à clé/.test(m.texte)));
  // On achève le magasinier : sa clé tombe à ses pieds ; on la ramasse.
  a.joueur.position = { x: magasinier.x, z: magasinier.z - 1, o: 0 };
  a.joueur.recevoir({ t: "frapper", appuye: false });
  assert.equal(magasinier.etat, "detruit");
  const cle = coop.sacs.find((x) => x.contenu.inventaire.cle_coffre)!;
  assert.ok(cle, "la clé est au sol");
  t.attendre(1);
  a.joueur.recevoir({ t: "interagir", cible: { genre: "sac", id: cle.id }, verbe: "reprendre" });
  t.attendre(5);
  assert.equal(inv().cle_coffre, 1);
  fouiller("coop_coffre");
  assert.equal(inv().semences_f1, 1);
  // Les caisses de la chambre froide : prises, elles ne reviennent pas avant 4 jours, même après rechargement.
  fouiller("coop_caisse_froide");
  assert.equal(inv().roulements, 1);
  const caisse = r("coop_caisse_froide");
  t.deconnecter(a.joueur);
  t.attendre(6 * 60, 5);
  t.sauter(3 * 24 * 3_600_000);
  const plusTard = new Cooperatives(t.base, () => 0.5, t.maintenant).de(a.compte.id);
  assert.ok(plusTard.ressources.get(caisse.id)!.disponibleLe > t.maintenant());
  t.sauter(1.1 * 24 * 3_600_000);
  assert.ok(plusTard.ressources.get(caisse.id)!.disponibleLe <= t.maintenant());
});
