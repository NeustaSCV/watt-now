// La base et les gestes (plan 0.8.2, chantier I) : ramasser deux fois plus vite (R20), la gourde au milieu de la mare
// (R21), dormir dans sa couche (R12), le feu qui prend d'abord les branches (plan 0.8 §9.3).

import { test } from "node:test";
import assert from "node:assert/strict";
import { avancer, type Position } from "../../commun/src/deplacement.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { ALLURES } from "../../commun/src/regles.ts";
import { cheminVersLaCouche, placeDeLaCouche } from "../../commun/src/sommeil-abri.ts";
import { FREIN_MARE, MARE, USAGES, auMilieuDeLaMare, distanceMare, profondeurMare, type TypeRessource } from "../../commun/src/terrain.ts";
import { appliquerReglages } from "../../commun/src/reglages.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

appliquerReglages({ faim_rythme: 1, soif_rythme: 1, sommeil_rythme: 1, gestes_vitesse: 1 });

function monter(inventaire: Record<string, number> = {}) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1);
  const attendre = (secondes: number, pas = 0.05) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  return { base, compte, joueur, attendre, dernier, infos, recus };
}

// ---------- R20 : ramasser deux fois plus vite ----------

/** Les durées de la 0.8.1 (secondes) : la 0.8.2 les divise par deux. */
const DUREES_0_8_1: Partial<Record<TypeRessource, number>> = { buisson: 2.5, branche: 1.2, pierre: 1.8, buche: 2.5, tas_bois: 2, poutres_chene: 4, banc_galets: 1.8 };

test("R20 : les baies, les branches, les pierres et les bûches se ramassent deux fois plus vite", () => {
  for (const [type, avant] of Object.entries(DUREES_0_8_1) as [TypeRessource, number][]) assert.equal(USAGES[type].duree, avant / 2, type);
  // Et c'est bien la durée du geste, au terrain.
  const t = monter();
  for (const type of ["buisson", "branche", "pierre", "buche"] as const) {
    const r = t.joueur.bienvenue(0).ressources.find((x) => x.type === type && x.disponible)!;
    t.joueur.position = { x: r.x + 0.4, z: r.z, o: 0 };
    t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: r.id }, verbe: "ramasser" });
    assert.equal(t.dernier("action")?.etat, "debut");
    assert.equal((t.dernier("action") as { duree: number }).duree, DUREES_0_8_1[type]! / 2, type);
    t.attendre(DUREES_0_8_1[type]! / 2 + 0.1);
    assert.equal(t.dernier("action")?.etat, "fin", type);
  }
  assert.deepEqual([t.dernier("inventaire")!.inventaire.baies, t.dernier("inventaire")!.inventaire.branche], [1, 1]);
});

// ---------- R21 : la gourde au milieu de la mare ----------

test("R21 : on entre dans la mare, lentement ; l'eau monte aux genoux au milieu", () => {
  assert.ok(auMilieuDeLaMare(MARE.x, MARE.z));
  assert.ok(!auMilieuDeLaMare(MARE.x - MARE.rayon + 0.2, MARE.z), "le bord n'est pas le milieu");
  assert.equal(profondeurMare(MARE.x - MARE.rayon - 0.5, MARE.z), 0, "hors de l'eau, on a les pieds au sec");
  assert.ok(profondeurMare(MARE.x, MARE.z) >= 0.35, "au milieu, l'eau aux genoux");
  // La mare se traverse (aucun obstacle), à mi-allure au milieu.
  const marche = { dx: 1, dz: 0, allure: "marche" as const };
  const dehors = avancer({ x: 20, z: 20, o: 0 }, marche, 1);
  const dedans = avancer({ x: MARE.x - 0.5, z: MARE.z, o: 0 }, marche, 1);
  assert.ok(Math.abs(dehors.x - 20 - ALLURES.marche) < 1e-9);
  assert.ok(Math.abs(dedans.x - (MARE.x - 0.5) - ALLURES.marche * FREIN_MARE) < 1e-9, "dans l'eau, la marche est deux fois plus lente");
  // Du bord jusqu'au milieu : on y arrive.
  let p: Position = { x: MARE.x - MARE.rayon - 1, z: MARE.z, o: 0 };
  for (let i = 0; i < 60 && !auMilieuDeLaMare(p.x, p.z); i++) p = avancer(p, marche, 0.1);
  assert.ok(auMilieuDeLaMare(p.x, p.z), "on atteint le milieu à pied");
});

test("R21 : la gourde se remplit au milieu de la mare, pas au bord", () => {
  const t = monter({ gourde: 1 });
  t.joueur.position = { x: MARE.x - MARE.rayon - 0.3, z: MARE.z, o: 0 };
  assert.ok(distanceMare(t.joueur.position.x, t.joueur.position.z) > 0);
  t.joueur.recevoir({ t: "interagir", cible: { genre: "mare" }, verbe: "remplir" });
  t.attendre(3);
  assert.match(t.infos().at(-1)!, /jusqu'au milieu/);
  assert.equal(t.dernier("action"), undefined, "rien ne se lance au bord");
  t.joueur.position = { x: MARE.x + 0.4, z: MARE.z - 0.3, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "mare" }, verbe: "remplir" });
  t.attendre(3);
  assert.deepEqual(t.dernier("besoins")?.gourde, { contenu: "brute", litres: 1 });
});

// ---------- R12 : dormir dans sa couche ----------

/** Un abri bâti, à la place et l'orientation voulues. */
function avecAbri(o: number) {
  const t = monter({ branche: 8, bache: 1, couteau: 1 });
  t.joueur.position = { x: 20, z: 20, o: 0 };
  t.joueur.recevoir({ t: "fabriquer", recette: "abri", x: 20, z: 21.8, o });
  t.attendre(61, 0.5);
  const abri = t.dernier("installation")!.installation;
  assert.equal(abri.type, "abri");
  (t.joueur as unknown as { besoins: { repos: number } }).besoins.repos = 0.3;
  return { ...t, abri };
}

test("R12 : on se rend accroupi jusqu'à sa couche, et l'on y dort, à la même place d'où qu'on vienne", () => {
  for (const o of [0, 1.2, Math.PI]) {
    const places = new Set<string>();
    for (const [dx, dz] of [[0, -1.6], [1.7, 0.2], [-0.4, 1.6], [-1.8, -0.3]] as const) {
      const t = avecAbri(o);
      const c = Math.cos(o);
      const s = Math.sin(o);
      // Le départ, dans le repère de l'abri : derrière, sur le côté de l'entrée, devant la bâche, côté toile.
      t.joueur.position = { x: t.abri.x + dx * c + dz * s, z: t.abri.z - dx * s + dz * c, o: 0 };
      t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: t.abri.id }, verbe: "dormir" });
      const trajet = t.dernier("vers_couche")!;
      assert.ok(trajet.chemin && trajet.chemin.length >= 1, "le trajet est annoncé au client");
      assert.equal(t.dernier("sommeil"), undefined, "on ne dort pas encore : on se rend à sa couche");
      const depart = { ...t.joueur.position };
      t.attendre(0.5);
      const pas = t.dernier("etat")!.position;
      const fait = Math.hypot(pas.x - depart.x, pas.z - depart.z);
      // Il avance (un trajet peut tourner : la ligne droite est plus courte que le pas), jamais plus vite qu'accroupi.
      assert.ok(fait > 0.1 && fait < ALLURES.discrete * 0.5 + 0.01, `à l'allure accroupie (${fait} m en 0,5 s)`);
      t.attendre(6);
      assert.deepEqual(t.dernier("sommeil"), { t: "sommeil", dort: true, dansUnAbri: true });
      const couche = placeDeLaCouche(t.abri);
      const p = t.joueur.position;
      assert.ok(Math.hypot(p.x - couche.x, p.z - couche.z) < 1e-6, "couché à la place de la couche");
      assert.equal(p.o, couche.o);
      places.add(`${p.x.toFixed(3)},${p.z.toFixed(3)}`);
    }
    assert.equal(places.size, 1, "une seule place, d'où qu'on vienne");
  }
});

test("R12 : le trajet passe par une ouverture, jamais à travers la bâche ; bouger l'interrompt", () => {
  const abri = { x: 10, z: 10, o: 0 };
  // Devant la bâche (z > 0,95 dans le repère de l'abri) : on contourne par le bout de l'entrée (+x).
  const devant = cheminVersLaCouche(abri, { x: 10, z: 11.6 });
  assert.ok(devant.length === 3 && devant[0]!.x > 11.5 && devant[1]!.x > 11.5, JSON.stringify(devant));
  // Derrière, côté ouvert : sous la faîtière, puis la couche.
  const derriere = cheminVersLaCouche(abri, { x: 10.3, z: 8.4 });
  assert.equal(derriere.length, 2);
  assert.ok(derriere[0]!.z < 10 - 0.6);

  const t = avecAbri(0);
  t.joueur.position = { x: t.abri.x, z: t.abri.z - 2, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: t.abri.id }, verbe: "dormir" });
  t.attendre(0.3);
  t.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 1 });
  t.attendre(3);
  assert.deepEqual(t.dernier("vers_couche"), { t: "vers_couche", chemin: null, o: placeDeLaCouche(t.abri).o });
  assert.equal(t.dernier("sommeil"), undefined, "interrompu, on ne s'endort pas");
});

// ---------- Plan 0.8 §9.3 : le feu prend d'abord les branches ----------

test("« Ajouter du bois » avec des branches et des bûches dans le sac : une branche part au feu", () => {
  const t = monter({ pierre: 5, branche: 5, buche: 2, briquet: 1 });
  t.joueur.position = { x: 20, z: 20, o: 0 };
  t.joueur.recevoir({ t: "construire_feu", x: 21, z: 20 });
  t.attendre(4.1);
  assert.equal(t.dernier("inventaire")!.inventaire.branche, 2);
  t.joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: t.dernier("feu")!.feu.id }, verbe: "ajouter_bois" });
  assert.deepEqual([t.dernier("inventaire")!.inventaire.branche, t.dernier("inventaire")!.inventaire.buche], [1, 2]);
  t.joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: t.dernier("feu")!.feu.id }, verbe: "ajouter_bois" });
  t.joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: t.dernier("feu")!.feu.id }, verbe: "ajouter_bois" });
  // Plus de branches : la bûche vient ensuite.
  assert.deepEqual([t.dernier("inventaire")!.inventaire.branche, t.dernier("inventaire")!.inventaire.buche], [undefined, 1]);
});
