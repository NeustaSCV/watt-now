// 0.10, la grève et l'épave du phare, après l'essai sur l'iPhone du 2026-10-15 : les étages du relief valent pour les
// coups et les saisies ; l'Éteint resté sur le pont redescend par l'échelle de coupée ; à l'échouage, un Éteint pris sous
// l'épave est remis sur les galets ; on quitte la rampe du canot sur les galets dès sa partie basse ; dans l'eau de la
// crique, on avance plus lentement et l'on ne court pas, au-delà la mer arrête ; la sortie de la grève reste atteignable.

import { test } from "node:test";
import assert from "node:assert/strict";
import { avancer, type Position } from "../../commun/src/deplacement.ts";
import { nouvelEteint, penser, type Eteint } from "../../commun/src/eteints.ts";
import { entreesDe, heurte, sortiesDe, type Zone } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { ENDROITS_PHARE, FIN_BORDS_RAMPE, FREIN_EAU, auModele, dansLEauPhare, dansLaCoque, etageDuPhare, jeu, memeEtagePhare, zonePhare } from "../../commun/src/phare.ts";
import { EPAVE_MODELE } from "../../commun/src/phare-modele.ts";
import { milieuPhare, remettreSurLaGreve } from "../../commun/src/phare-vivant.ts";
import { ALLURES } from "../../commun/src/regles.ts";
import { MS_PAR_HEURE_JEU } from "../../commun/src/temps.ts";
import { Base } from "./base.ts";
import { rendreSilencieux } from "./journal.ts";
import type { LieuPhare } from "./phare.ts";

rendreSilencieux(true);

const EAU = jeu(-18, 24.5);
const GREVE = jeu(-15.5, 20.5);
const PROUE = jeu(EPAVE_MODELE.cloche.x, EPAVE_MODELE.cloche.z + 0.3);

/** Marcher tout droit `secondes` (pas de 50 ms) ; rend la position d'arrivée. */
function marcher(depart: { x: number; z: number }, dx: number, dz: number, secondes: number, zone: Zone, allure: "marche" | "course" = "marche"): Position {
  let p: Position = { x: depart.x, z: depart.z, o: 0 };
  for (let t = 0; t < secondes; t += 0.05) p = avancer(p, { dx, dz, allure }, 0.05, zone);
  return p;
}

/** Les points libres (rayon 0,35) qu'on rejoint à pied depuis `depart`, sur une grille de 20 cm. */
function rejoints(zone: Zone, depart: { x: number; z: number }): (x: number, z: number) => boolean {
  const pas = 0.2;
  const nx = Math.ceil((zone.xMax - zone.xMin) / pas) + 1;
  const nz = Math.ceil((zone.zMax - zone.zMin) / pas) + 1;
  const vu = new Uint8Array(nx * nz);
  const libre = (i: number, k: number) => i >= 0 && k >= 0 && i < nx && k < nz && !heurte(zone, zone.xMin + i * pas, zone.zMin + k * pas, 0.35);
  const i0 = Math.round((depart.x - zone.xMin) / pas);
  const k0 = Math.round((depart.z - zone.zMin) / pas);
  const file = [[i0, k0]];
  vu[i0 * nz + k0] = 1;
  while (file.length) {
    const [i, k] = file.pop()!;
    for (const [a, b] of [[i + 1, k], [i - 1, k], [i, k + 1], [i, k - 1]]) {
      if (!libre(a!, b!) || vu[a! * nz + b!]) continue;
      vu[a! * nz + b!] = 1;
      file.push([a!, b!]);
    }
  }
  return (x, z) => vu[Math.round((x - zone.xMin) / pas) * nz + Math.round((z - zone.zMin) / pas)] === 1;
}

test("les étages du phare : le plateau et la rampe haute, la grève et la rampe basse, le pont ; l'échelle touche la grève et le pont", () => {
  assert.equal(etageDuPhare(ENDROITS_PHARE.marque.x, ENDROITS_PHARE.marque.z, true), "haut");
  assert.equal(etageDuPhare(ENDROITS_PHARE.sautDe.x, ENDROITS_PHARE.sautDe.z, true), "haut");
  assert.equal(etageDuPhare(ENDROITS_PHARE.sautVers.x, ENDROITS_PHARE.sautVers.z, true), "bas");
  assert.equal(etageDuPhare(GREVE.x, GREVE.z, true), "bas");
  assert.equal(etageDuPhare(EAU.x, EAU.z, true), "bas");
  assert.equal(etageDuPhare(PROUE.x, PROUE.z, true), "pont");
  // Sans l'épave, là où elle sera : l'eau (en bas).
  assert.equal(etageDuPhare(PROUE.x, PROUE.z, false), "bas");
  const milieuEchelle = jeu((EPAVE_MODELE.echelle.bas.x + EPAVE_MODELE.echelle.haut.x) / 2, (EPAVE_MODELE.echelle.bas.z + EPAVE_MODELE.echelle.haut.z) / 2);
  assert.equal(etageDuPhare(milieuEchelle.x, milieuEchelle.z, true), "echelle");
  assert.ok(memeEtagePhare(milieuEchelle, GREVE, true) && memeEtagePhare(milieuEchelle, PROUE, true));
  assert.ok(!memeEtagePhare(PROUE, GREVE, true));
  assert.ok(!memeEtagePhare(ENDROITS_PHARE.sautDe, ENDROITS_PHARE.sautVers, true));
});

test("E : on quitte la rampe du canot sur les galets, à gauche et à droite, dès le haut de sa partie basse ; la partie haute reste fermée", () => {
  const zone = zonePhare({ epave: true });
  const rampe = (z: number) => jeu(-24, z);
  // À z 20,55 du modèle (avant : il fallait descendre jusqu'au bout des garde-fous, à z 21 et plus), on sort d'un côté
  // comme de l'autre.
  for (const sens of [-1, 1]) {
    const p = marcher(rampe(FIN_BORDS_RAMPE + 0.45), sens, 0, 3, zone);
    const m = auModele(p.x, p.z);
    assert.ok(sens < 0 ? m.x < -26 : m.x > -22, `sorti du côté ${sens < 0 ? "ouest" : "est"} (x ${m.x.toFixed(2)})`);
    assert.ok(FIN_BORDS_RAMPE < 21, "plus haut qu'avant");
  }
  // On va aussi jusqu'en bas de la rampe, et dans l'eau.
  const bas = marcher(ENDROITS_PHARE.sautVers, 0, 1, 4, zone);
  assert.ok(auModele(bas.x, bas.z).z > 23, "jusqu'en bas");
  // La partie haute, au-dessus du tronçon effondré : fermée des deux côtés (on ne contourne pas le trou par les galets).
  for (const sens of [-1, 1]) {
    const p = marcher(rampe(18.4), sens, 0, 3, zone);
    assert.ok(Math.abs(auModele(p.x, p.z).x + 24) < 1.3, "les bords arrêtent");
  }
  // Et d'en bas, on ne remonte toujours pas.
  const remonte = rejoints(zone, ENDROITS_PHARE.sautVers);
  assert.ok(!remonte(ENDROITS_PHARE.sautDe.x, ENDROITS_PHARE.sautDe.z));
  assert.ok(!remonte(ENDROITS_PHARE.marque.x, ENDROITS_PHARE.marque.z));
});

test("F : dans l'eau de la crique, on avance à 60 % et l'on n'y court pas ; au-delà de 3,5 m, la mer arrête ; les Éteints y vont, ralentis de même", () => {
  for (const epave of [false, true]) {
    const zone = zonePhare({ epave });
    assert.equal(zone.frein?.(EAU.x, EAU.z), FREIN_EAU);
    assert.equal(zone.frein?.(GREVE.x, GREVE.z), 1);
    // Marcher vers l'ouest, dans l'eau : 60 % de la marche ; courir : pareil.
    const depart = jeu(-16, 24.5);
    const m = marcher(depart, -1, 0, 1, zone);
    const c = marcher(depart, -1, 0, 1, zone, "course");
    assert.ok(Math.abs(depart.x - m.x - ALLURES.marche * FREIN_EAU) < 0.05, `${(depart.x - m.x).toFixed(2)} m en 1 s`);
    assert.ok(Math.abs(depart.x - c.x - (depart.x - m.x)) < 1e-9, "on n'y court pas");
    // Vers le large : arrêté à 3,5 m du bord de l'eau.
    const large = marcher(GREVE, 0, 1, 10, zone);
    assert.ok(dansLEauPhare(large.x, large.z, epave), "dans l'eau");
    assert.ok(auModele(large.x, large.z).z < 27.2, "la mer arrête");
  }
  // Un Éteint qui poursuit dans l'eau : 60 % de sa vitesse.
  const zone = zonePhare({ epave: false });
  const e = nouvelEteint(1, EAU.x, EAU.z, "poursuivant");
  const h = { id: 1, x: EAU.x - 6, z: EAU.z, discret: false, eclaire: true };
  penser(e, 0.5, [], [h], [], false, zone, () => 0.5, milieuPhare({}));
  const fait = EAU.x - e.x;
  const libre = nouvelEteint(2, GREVE.x, GREVE.z, "poursuivant");
  penser(libre, 0.5, [], [{ ...h, x: GREVE.x - 6, z: GREVE.z }], [], false, zone, () => 0.5, milieuPhare({}));
  assert.ok(fait > 0 && Math.abs(fait / (GREVE.x - libre.x) - FREIN_EAU) < 0.02, `${fait.toFixed(3)} contre ${(GREVE.x - libre.x).toFixed(3)}`);
});

test("la sortie de la grève reste atteignable du bas de la rampe, avec ou sans l'épave ; tous les objets-clés aussi", () => {
  const greve = sortiesDe("phare").find((s) => s.sansArrivee)!;
  for (const epave of [false, true]) {
    const zone = zonePhare({ epave });
    const va = rejoints(zone, ENDROITS_PHARE.sautVers);
    let ok = false;
    for (let x = greve.boite.x - greve.boite.l / 2; x <= greve.boite.x + greve.boite.l / 2 && !ok; x += 0.2)
      for (let z = greve.boite.z - greve.boite.p / 2; z <= greve.boite.z + greve.boite.p / 2 && !ok; z += 0.2) ok = va(x, z);
    assert.ok(ok, `la sortie, ${epave ? "l'épave là" : "sans l'épave"}`);
    if (!epave) continue;
    // Le pont (par l'échelle) et le dedans des trois conteneurs.
    for (const [nom, p] of [["la cloche", PROUE], ["les provisions", jeu(-11, 17.45)], ["la Livraison", jeu(-19, 17.8)], ["l'outillage", jeu(-2.5, 21.6)]] as const) assert.ok(va(p.x, p.z), nom);
  }
});

test("D : l'Éteint resté sur l'avant du pont redescend par l'échelle de coupée et vient au joueur sur la grève", () => {
  const zone = zonePhare({ epave: true });
  const milieu = milieuPhare({ epave: true });
  const e = nouvelEteint(103, PROUE.x, PROUE.z, "poursuivant");
  const joueur = { id: 1, x: GREVE.x, z: GREVE.z, discret: false, eclaire: true };
  let surLaGreve = -1;
  for (let t = 0; t < 90; t += 0.1) {
    penser(e, 0.1, [], [joueur], [], true, zone, () => 0.5, milieu);
    if (surLaGreve < 0 && etageDuPhare(e.x, e.z, true) === "bas") surLaGreve = t;
  }
  assert.ok(surLaGreve > 0, "descendu sur la grève");
  assert.ok(Math.hypot(e.x - joueur.x, e.z - joueur.z) < 1.2, `au contact du joueur (${Math.hypot(e.x - joueur.x, e.z - joueur.z).toFixed(2)} m)`);
  // Et l'inverse : de la grève, il monte au pont par l'échelle, vers qui est sur le pont (derrière le guindeau, il
  // resterait bloqué : un Éteint ne contourne rien, Book 06 §2.1).
  const montant = nouvelEteint(104, GREVE.x, GREVE.z, "poursuivant");
  const surLePont = { ...joueur, ...jeu(-5, 21) };
  for (let t = 0; t < 90; t += 0.1) penser(montant, 0.1, [], [surLePont], [], true, zone, () => 0.5, milieu);
  assert.equal(etageDuPhare(montant.x, montant.z, true), "pont");
  assert.ok(Math.hypot(montant.x - surLePont.x, montant.z - surLePont.z) < 1.2, "sur le pont, au contact");
});

test("D : un Éteint ne saisit pas d'un étage à l'autre (du pont, par-dessus la coque, qui est sur la grève contre le flanc)", () => {
  const zone = zonePhare({ epave: true });
  const milieu = milieuPhare({ epave: true });
  // Le flanc ouest de la coque, côté grève (repère du modèle : x ≈ − 7,1 à z 19) : l'Éteint dedans, le joueur dehors.
  const dedans = jeu(-6.3, 18.5);
  const dehors = jeu(-7.3, 18.5);
  assert.ok(dansLaCoque(auModele(dedans.x, dedans.z).x, auModele(dedans.x, dedans.z).z) && !heurte(zone, dedans.x, dedans.z, 0.3));
  const e = nouvelEteint(1, dedans.x, dedans.z, "poursuivant");
  const h = { id: 9, x: dehors.x, z: dehors.z, discret: false, eclaire: true };
  for (let t = 0; t < 3; t += 0.1) penser(e, 0.1, [], [h], [], true, zone, () => 0.5, milieu);
  assert.equal(e.saisit, null);
  // Sans l'étage (le milieu de la crique, l'épave là quand même) : au contact, il aurait saisi… si la coque laissait passer
  // les coups : elle ne les laisse plus (commun/src/phare.ts, arreteLesCoupsPhare).
  assert.equal(milieu.atteint?.(dedans.x, dedans.z, dehors.x, dehors.z), false);
});

test("à l'échouage, un Éteint qui était dans l'eau sous l'épave est remis sur les galets (ni dans la coque, ni sur le pont)", () => {
  const sous: Eteint = nouvelEteint(1, PROUE.x, PROUE.z, "errant");
  const pris: Eteint = nouvelEteint(2, jeu(-11.6, 17.45).x + 1.2, jeu(-11.6, 17.45).z - 1.24, "errant"); // dans la paroi d'un conteneur
  const loin: Eteint = nouvelEteint(3, GREVE.x, GREVE.z, "errant");
  const haut: Eteint = nouvelEteint(4, ENDROITS_PHARE.marque.x, ENDROITS_PHARE.marque.z, "errant");
  const bouges = remettreSurLaGreve([sous, pris, loin, haut]);
  assert.deepEqual(bouges.map((e) => e.id).sort(), [1, 2]);
  const zone = zonePhare({ epave: true });
  for (const e of [sous, pris]) {
    assert.equal(etageDuPhare(e.x, e.z, true), "bas");
    assert.ok(!heurte(zone, e.x, e.z, 0.35));
  }
  assert.deepEqual([loin.x, loin.z], [GREVE.x, GREVE.z]);
});

test("D : au serveur, on ne frappe pas un Éteint d'un autre étage (du haut de la rampe vers la partie basse) ; du même étage, si ; dans l'eau, on ne court pas", async () => {
  const { DUREE_VOYAGE_S, SORTIE_TERRAIN, etapeVers } = await import("../../commun/src/lieux.ts");
  const { Comptoir } = await import("./comptoir.ts");
  const { Cooperatives } = await import("./cooperative.ts");
  const { Gue } = await import("./gue.ts");
  const { Halte } = await import("./halte.ts");
  const { Joueur } = await import("./joueur.ts");
  const { LieuxVivants } = await import("./lieux-vivants.ts");
  const { Moulins } = await import("./moulin.ts");
  const base = new Base(":memory:");
  let instant = base.debutMonde() + 2 * MS_PAR_HEURE_JEU;
  const maintenant = () => instant;
  const halte = new Halte(base);
  const gue = new Gue(base);
  const cooperatives = new Cooperatives(base, Math.random, maintenant);
  const moulins = new Moulins(base, Math.random, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, Math.random, maintenant);
  const c = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(c.id, { sac_a_dos: 1 });
  const recus: MessageServeur[] = [];
  const joueur = new Joueur({ id: c.id, pseudo: "Rose", famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, Math.random, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
  const attendre = (secondes: number, pas = 0.5) => {
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
    attendre(DUREE_VOYAGE_S + 0.5);
  };
  voyager("corniche");
  voyager("phare");
  assert.equal(joueur.lieu, "phare");
  assert.deepEqual(joueur.position, entreesDe("phare")[0]!.arrivee);
  joueur.recevoir({ t: "arrivee" });
  const lieu = lieux.vivant("phare", c.id) as LieuPhare;
  // Au bord du tronçon effondré, face au sud ; un Éteint juste en dessous, sur la partie basse (1,1 m plus loin, à plat).
  const haut = jeu(-24, 18.85);
  const dessous = nouvelEteint(201, jeu(-24, 19.95).x, jeu(-24, 19.95).z, "errant");
  lieu.eteints = [dessous];
  joueur.position = { ...haut, o: 0 };
  recus.length = 0;
  joueur.recevoir({ t: "frapper", appuye: false });
  assert.ok(!recus.some((m) => m.t === "coup"), "pas de coup d'un étage à l'autre");
  // Sauté sur la partie basse, face au nord : le même Éteint, à la même distance, se frappe.
  attendre(1);
  joueur.position = { ...jeu(-24, 21.05), o: Math.PI };
  recus.length = 0;
  joueur.recevoir({ t: "frapper", appuye: false });
  assert.ok(recus.some((m) => m.t === "coup"), "du même étage, le coup porte");
  // Dans l'eau de la crique, on veut courir : on marche, à 60 %.
  lieu.eteints = [];
  joueur.position = { ...jeu(-16, 24.5), o: 0 };
  const avant = { ...joueur.position };
  joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "course", seq: 9 });
  attendre(1, 0.1);
  const parcouru = avant.x - joueur.position.x;
  assert.ok(Math.abs(parcouru - ALLURES.marche * FREIN_EAU) < 0.25, `${parcouru.toFixed(2)} m en 1 s`);
});
