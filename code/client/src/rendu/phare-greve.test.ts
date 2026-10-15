// 0.10, la grève et l'épave du phare à l'écran, après l'essai sur l'iPhone du 2026-10-15 : ce qui suit le personnage (sa
// lampe, les cercles, la visée) se pose sur le vrai sol, et dans l'eau de la crique il enfonce jusqu'aux genoux ; les
// conteneurs s'ouvrent (toits et parois : la couche du modèle, P-7) quand on entre dans l'un d'eux ; la partie de l'épave
// où l'on se tient ne s'efface jamais ; un Éteint d'un autre étage ne menace pas ; le pavois est ouvert au haut de
// l'échelle (P-5) ; le panneau du sentier (celui du modèle) se lit, et sa lanterne l'éclaire la nuit.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

// Une toile de dessin factice (comme rendu/phare.test.ts).
const contexte2d: unknown = new Proxy(
  {},
  {
    get: (_cible, nom) => {
      if (nom === "measureText") return () => ({ width: 10 });
      if (nom === "createLinearGradient" || nom === "createRadialGradient" || nom === "createPattern") return () => ({ addColorStop() {} });
      if (nom === "getImageData") return (_x: number, _y: number, l: number, h: number) => ({ data: new Uint8ClampedArray(l * h * 4) });
      return () => {};
    },
    set: () => true,
  },
);
if (!(globalThis as { document?: unknown }).document) Object.assign(globalThis, { document: { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => contexte2d }) } });

const { ECRITEAU_SENTIER, NIVEAU_MER, auModele, dansLEauPhare, etageDuPhare, jeu } = await import("../../../commun/src/phare.ts");
const { COUCHES_MODELE, EPAVE_MODELE, PANNEAUX_MODELE } = await import("../../../commun/src/phare-modele.ts");
const { ecriteauProche } = await import("../../../commun/src/guidage.ts");
const { animerPhare, creerPhare, lumieresPhare, solPhare, ENFONCE_EAU } = await import("./phare.ts");
const { avancer } = await import("../../../commun/src/deplacement.ts");
const { zonePhare } = await import("../../../commun/src/phare.ts");
const { hauteurPiedsLieu, hauteurSolLieu, hauteurSurfaceLieu } = await import("../sol-lieu.ts");
const { PhareClient } = await import("../phare.ts");

const VU = { etat: { escabeau: "marque" as const, bidon: "verse" as const, prisme: "remis" as const, lanterne: true, compresseur: false, corneSonnee: false }, epave: true, nuit: true };
/** Un point de l'eau peu profonde, au sud de la grève de l'ouest (repère du modèle : x − 18, z 24,5). */
const EAU = jeu(-18, 24.5);
/** Sur la grève, entre les deux conteneurs. */
const GREVE = jeu(-15.5, 20.5);
/** Le milieu des conteneurs (les couches de leurs toits et parois, dans le modèle), dans le repère du jeu. */
const CONTENEURS = Object.fromEntries(
  COUCHES_MODELE.filter((c) => c.nom.startsWith("conteneur") && !c.nom.includes("avec la coque")).map((c) => [c.nom.startsWith("conteneurs de l'épave") ? "conteneur de la Livraison du Jour" : c.nom.replace(/ \(toit et parois\)$/, ""), jeu(c.boite.x, c.boite.z)]),
);

test("A : au phare, la lampe, les cercles et la visée suivent le vrai sol ; dans l'eau, les pieds sont aux genoux sous la surface ; ailleurs, rien ne bouge", () => {
  const portes = { epave: true };
  // Sur la grève : les pieds et la surface au sol des galets (≈ − 8,8).
  const g = hauteurSolLieu("phare", GREVE.x, GREVE.z, portes);
  assert.ok(g < -8.5 && g > -9.2, `la grève à ${g.toFixed(2)}`);
  assert.equal(hauteurPiedsLieu("phare", GREVE.x, GREVE.z, portes), g);
  assert.equal(hauteurSurfaceLieu("phare", GREVE.x, GREVE.z, portes), g);
  // Sur le pont de l'épave (≈ − 4) et dans le conteneur d'outillage.
  const pont = jeu(-4.5, 21);
  assert.ok(hauteurPiedsLieu("phare", pont.x, pont.z, portes) > -4.5);
  // Dans l'eau : les pieds à 45 cm sous la surface, les cercles à la surface.
  assert.ok(dansLEauPhare(EAU.x, EAU.z, true));
  assert.ok(Math.abs(hauteurPiedsLieu("phare", EAU.x, EAU.z, portes) - (NIVEAU_MER - ENFONCE_EAU)) < 1e-6);
  assert.equal(hauteurSurfaceLieu("phare", EAU.x, EAU.z, portes), NIVEAU_MER);
  // Ailleurs, à plat.
  for (const lieu of ["terrain", "station", "moulin", "corniche"]) {
    assert.equal(hauteurPiedsLieu(lieu, GREVE.x, GREVE.z, portes), 0);
    assert.equal(hauteurSurfaceLieu(lieu, GREVE.x, GREVE.z, portes), 0);
  }
});

test("A et F : le personnage est posé dans l'eau jusqu'aux genoux, avec un remous à la surface ; les Éteints aussi ; les cercles à la surface", () => {
  const client = new PhareClient(() => {}, () => ({}) as HTMLElement);
  const scene3d = new THREE.Scene();
  const personnage = new THREE.Object3D();
  scene3d.add(personnage);
  const eteint = { objet: new THREE.Object3D() };
  const cercle = new THREE.Object3D();
  personnage.position.set(EAU.x, 0, EAU.z);
  eteint.objet.position.set(EAU.x + 1, 0, EAU.z);
  cercle.position.set(EAU.x, 0, EAU.z);
  client.poser(true, { epave: true }, 1, { personnage, eteints: [eteint], cercles: [cercle], scene: { hauteurSuivie: 0 } });
  assert.ok(Math.abs(personnage.position.y - (NIVEAU_MER - ENFONCE_EAU)) < 0.01, `le personnage à ${personnage.position.y.toFixed(2)}`);
  assert.ok(Math.abs(eteint.objet.position.y - (NIVEAU_MER - ENFONCE_EAU)) < 0.01);
  assert.ok(Math.abs(cercle.position.y - (NIVEAU_MER + 0.03)) < 0.01, "la visée sur l'eau");
  const remous = scene3d.getObjectByName("remous")!;
  assert.ok(remous?.visible, "un remous aux jambes");
  assert.ok(Math.abs(remous.position.y - NIVEAU_MER) < 0.05);
  // Sorti de l'eau, sur les galets : plus de remous.
  personnage.position.set(GREVE.x, 0, GREVE.z);
  client.poser(true, { epave: true }, 1, { personnage, eteints: [], cercles: [], scene: { hauteurSuivie: 0 } });
  assert.ok(!remous.visible);
});

test("B : les conteneurs de l'épave s'ouvrent (toits et parois) quand on entre dans l'un d'eux, et se referment quand on en sort ; la coque, elle, reste", () => {
  const decor = creerPhare();
  const toits = decor.userData.toits as { nom?: string; efface?: boolean; materiaux: THREE.Material[] }[];
  const couche = (debut: string) => toits.find((t) => t.nom?.startsWith(debut))!;
  for (const nom of ["conteneurs de l'épave (toits et parois)", "conteneur des provisions du bord", "conteneur d'outillage sur le pont"]) assert.ok(couche(nom), nom);
  assert.equal(Object.keys(CONTENEURS).length, 3);
  // La couche des toits et parois (une seule pour les trois : le modèle reste à 39 appels) se voit-elle ?
  const parois = couche("conteneurs de l'épave (toits et parois)").materiaux;
  const ouverts = () => parois.every((m) => (m.userData.fondu ?? 1) < 0.5);
  const fermes = () => parois.every((m) => (m.userData.fondu ?? 1) === 1);
  const loin = jeu(-27, 18);
  for (let i = 0; i < 20; i++) animerPhare(decor, loin.x, loin.z, 0.5, Math.PI / 4, VU, []);
  assert.ok(fermes(), "de loin, fermés");
  // Dans le conteneur des provisions du bord (sur la grève) : ils s'ouvrent.
  const bord = CONTENEURS["conteneur des provisions du bord"]!;
  for (let i = 0; i < 20; i++) animerPhare(decor, bord.x, bord.z, 0.5, Math.PI / 4, VU, []);
  assert.ok(couche("conteneur des provisions du bord").efface, "dedans, il s'ouvre");
  assert.ok(ouverts(), "toits et parois effacés");
  // Loin de lui, sur la grève de l'ouest : ils se referment.
  for (let i = 0; i < 20; i++) animerPhare(decor, loin.x, loin.z, 0.5, Math.PI / 4, VU, []);
  assert.ok(!couche("conteneur des provisions du bord").efface);
  assert.ok(fermes());
  // Dans le conteneur d'outillage, sur le pont : il s'ouvre, la coque (sous les pieds) reste.
  const outil = CONTENEURS["conteneur d'outillage sur le pont"]!;
  assert.equal(etageDuPhare(outil.x, outil.z, true), "pont");
  for (let quart = 0; quart < 4; quart++) {
    for (let i = 0; i < 20; i++) animerPhare(decor, outil.x, outil.z, 0.5, Math.PI / 4 + (quart * Math.PI) / 2, VU, []);
    assert.ok(couche("conteneur d'outillage").efface, "l'outillage s'ouvre");
    assert.ok(!couche("coque de l'épave").efface, "la coque reste sous les pieds");
    assert.ok(ouverts());
  }
});

test("C : sur le pont de l'épave, à l'avant comme à l'arrière, la coque ne s'efface jamais, quel que soit l'angle de la caméra", () => {
  const decor = creerPhare();
  const coque = (decor.userData.toits as { nom?: string; efface?: boolean }[]).find((t) => t.nom?.startsWith("coque de l'épave"))!;
  // L'avant (la cloche, la proue), le milieu, près de la cassure, et le haut de l'échelle.
  const points = [jeu(EPAVE_MODELE.cloche.x, EPAVE_MODELE.cloche.z + 0.3), jeu(-5.5, 16.2), jeu(-4.5, 19.5), jeu(-3, 22), jeu(-6.6, 20.3)];
  for (const p of points) {
    assert.equal(etageDuPhare(p.x, p.z, true), "pont", `sur le pont (${auModele(p.x, p.z).x}, ${auModele(p.x, p.z).z})`);
    for (let quart = 0; quart < 4; quart++) {
      animerPhare(decor, p.x, p.z, 0.5, Math.PI / 4 + (quart * Math.PI) / 2, VU, []);
      assert.ok(!coque.efface, "la coque reste");
    }
  }
  // De la grève, derrière la coque (vue du sud-est), elle s'efface toujours.
  const derriere = jeu(-13, 16);
  animerPhare(decor, derriere.x, derriere.z, 0.5, Math.PI / 4, VU, []);
  assert.ok(coque.efface);
});

test("D : un Éteint d'un autre étage ne menace pas (ni mode Combat, ni « Frapper » à la place de « Prendre ») : le pont n'est pas la grève, l'échelle touche les deux", () => {
  const client = new PhareClient(() => {}, () => ({}) as HTMLElement);
  const bord = CONTENEURS["conteneur des provisions du bord"]!;
  const proue = jeu(EPAVE_MODELE.cloche.x, EPAVE_MODELE.cloche.z + 0.3);
  const echelle = jeu((EPAVE_MODELE.echelle.bas.x + EPAVE_MODELE.echelle.haut.x) / 2, (EPAVE_MODELE.echelle.bas.z + EPAVE_MODELE.echelle.haut.z) / 2);
  // L'épave là : l'Éteint de l'avant ne menace pas qui est dans le deuxième conteneur.
  assert.ok(!client.menace(proue, bord, true));
  assert.ok(client.menace(echelle, bord, true), "descendu sur l'échelle, si");
  assert.ok(client.menace(echelle, proue, true), "l'échelle touche le pont");
  // L'étage gardé par la pose (à chaque image) : main.ts appelle `menace` sans le dire.
  client.poser(true, { epave: true }, 0.016, { personnage: null, eteints: [], cercles: [], scene: { hauteurSuivie: 0 } });
  assert.ok(!client.menace(proue, bord));
  // Les Noyés de la grève ne menacent pas qui est au bord du tronçon effondré, ni qui est sur le pont.
  const noye = jeu(-19.8, 22.1);
  assert.ok(!client.menace(noye, jeu(-24, 18.4)));
  assert.ok(!client.menace(noye, jeu(-4.5, 19.5)));
  assert.ok(client.menace(noye, jeu(-24, 20.6)), "sauté sur la partie basse, on est à leur étage");
});

test("H : le pavois est ouvert au haut de l'échelle de coupée (P-5) : du pont, on descend l'échelle jusqu'aux galets, et l'on remonte", () => {
  const zone = zonePhare({ epave: true });
  const { bas, haut } = EPAVE_MODELE.echelle;
  const l = Math.hypot(haut.x - bas.x, haut.z - bas.z);
  const ux = (bas.x - haut.x) / l;
  const uz = (bas.z - haut.z) / l;
  // Du pont, un mètre avant le haut de l'échelle, on marche vers le bas.
  let p = { ...jeu(haut.x - ux, haut.z - uz), o: 0 };
  assert.equal(etageDuPhare(p.x, p.z, true), "pont");
  for (let t = 0; t < l / 1.2 + 4; t += 0.05) p = avancer(p, { dx: ux, dz: uz, allure: "marche" }, 0.05, zone);
  assert.equal(etageDuPhare(p.x, p.z, true), "bas", `arrivé en ${auModele(p.x, p.z).x.toFixed(2)}, ${auModele(p.x, p.z).z.toFixed(2)}`);
  for (let t = 0; t < l / 1.2 + 4; t += 0.05) p = avancer(p, { dx: -ux, dz: -uz, allure: "marche" }, 0.05, zone);
  assert.equal(etageDuPhare(p.x, p.z, true), "pont", "remonté sur le pont");
});

test("G : le panneau du sentier côtier (celui du modèle) est près de l'eau, au départ du sentier ; on le lit ; sa lanterne l'éclaire la nuit, pas le jour", () => {
  const modele = PANNEAUX_MODELE.find((p) => p.id === "panneau_sortie_greve")!;
  assert.match(modele.texte, /Sentier côtier · ← Port · 6 km/);
  assert.deepEqual(ECRITEAU_SENTIER, jeu(modele.x, modele.z), "l'écriteau « Lire » est au panneau du modèle");
  // Près de l'eau (le bord de l'eau du modèle est à z 23,3 à cet endroit), à quelques pas du bas de la rampe.
  const m = auModele(ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z);
  assert.ok(m.z > 21.5 && m.z < 23, `à ${m.z} du nord du lot`);
  assert.equal(etageDuPhare(ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z, false), "bas");
  assert.ok(!dansLEauPhare(ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z, false), "sur les galets");
  const basRampe = jeu(-24, 22.3);
  assert.ok(Math.hypot(basRampe.x - ECRITEAU_SENTIER.x, basRampe.z - ECRITEAU_SENTIER.z) < 3, "à trois pas du bas de la rampe");
  // On le lit (« Lire »), devant lui comme depuis le bas de la rampe.
  for (const [dx, dz] of [[0.6, 0.6], [1.2, 0.3], [-0.5, 1.0]]) {
    const e = ecriteauProche("phare", ECRITEAU_SENTIER.x + dx!, ECRITEAU_SENTIER.z + dz!);
    assert.equal(e?.ecriteau.id, "E-12");
    assert.match(e!.ecriteau.texte, /Sentier côtier · ← Port · 6 km/);
  }
  // Le jeu ne pose plus de panneau ni de lanterne à lui (le modèle a les siens).
  const decor = creerPhare();
  assert.equal(decor.getObjectByName("panneau du sentier côtier"), undefined);
  assert.equal(decor.getObjectByName("lanterne de panneau"), undefined);
  assert.ok(decor.getObjectByName("panneau_sortie_greve"), "le panneau du modèle");
  // La nuit, la lumière de sa lanterne (celle du modèle, au-dessus de la planche) est une source du phare ; le jour, non.
  const sol = solPhare(ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z, false);
  const lanterne = lumieresPhare({ etat: null, epave: false }, true).find((s) => Math.hypot(s.x - ECRITEAU_SENTIER.x, s.z - ECRITEAU_SENTIER.z) < 1.5);
  assert.ok(lanterne && lanterne.y > sol + 1.8 && lanterne.y < sol + 3, `la lanterne éclaire le panneau, la nuit (${lanterne?.y.toFixed(2)})`);
  assert.equal(lumieresPhare({ etat: null, epave: false }, false).length, 0);
  // Sa lumière ne porte pas jusqu'à son reflet sur la mer, vu par la caméra du jeu (35° au-dessus de l'horizon).
  const h = lanterne.y - NIVEAU_MER;
  const reflet = Math.hypot(h, h / Math.tan(Math.atan(1 / Math.SQRT2)));
  assert.ok(lanterne.portee < reflet, `portée ${lanterne.portee} m, reflet à ${reflet.toFixed(1)} m`);
});

test("G2 : la lanterne du panneau de la route du nord s'allume aussi la nuit, au-dessus de son panneau (« ← La corniche · Ton terrain »)", async () => {
  const { ECRITEAU_ROUTE } = await import("../../../commun/src/phare.ts");
  const nord = PANNEAUX_MODELE.find((p) => p.id === "panneau_sortie_nord")!;
  assert.deepEqual(ECRITEAU_ROUTE, jeu(nord.x, nord.z));
  assert.equal(ecriteauProche("phare", ECRITEAU_ROUTE.x + 0.5, ECRITEAU_ROUTE.z + 0.5)?.ecriteau.id, "E-17");
  const nuit = lumieresPhare({ etat: null, epave: false }, true).filter((s) => Math.hypot(s.x - ECRITEAU_ROUTE.x, s.z - ECRITEAU_ROUTE.z) < 1.5);
  assert.equal(nuit.length, 1);
  assert.ok(nuit[0]!.y > 1.8 && nuit[0]!.y < 3);
});
