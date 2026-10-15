// 0.10, la grève et l'épave du phare à l'écran, après l'essai sur l'iPhone du 2026-10-15 : ce qui suit le personnage (sa
// lampe, les cercles, la visée) se pose sur le vrai sol, et dans l'eau de la crique il enfonce jusqu'aux genoux ; un
// conteneur s'ouvre (toit et parois) quand on y entre ; la partie de l'épave où l'on se tient ne s'efface jamais ; un
// Éteint d'un autre étage ne menace pas ; le pavois s'ouvre au haut de l'échelle ; le panneau du sentier se lit.

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
const { EPAVE_MODELE } = await import("../../../commun/src/phare-modele.ts");
const { ecriteauProche } = await import("../../../commun/src/guidage.ts");
const { animerPhare, creerPhare, lumieresPhare, solPhare, ENFONCE_EAU } = await import("./phare.ts");
const { conteneursEpave, ouvrirLaCoupee } = await import("./phare-epave.ts");
const { hauteurPiedsLieu, hauteurSolLieu, hauteurSurfaceLieu } = await import("../sol-lieu.ts");
const { PhareClient } = await import("../phare.ts");
// @ts-ignore — le modèle est en JavaScript (session « bâtiments »), sans déclaration de types.
const { creer: creerModele } = await import("../batiments/phare/modele.js");

const VU = { etat: { escabeau: "marque" as const, bidon: "verse" as const, prisme: "remis" as const, lanterne: true, compresseur: false, corneSonnee: false }, epave: true, nuit: true };
/** Un point de l'eau peu profonde, au sud de la grève de l'ouest (repère du modèle : x − 18, z 24,5). */
const EAU = jeu(-18, 24.5);
/** Sur la grève, entre les deux conteneurs. */
const GREVE = jeu(-15.5, 20.5);
/** Le milieu des conteneurs (d'après leurs parois), dans le repère du jeu. */
const CONTENEURS = Object.fromEntries(conteneursEpave().map((c) => [c.nom, jeu(c.x, c.z)]));

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

test("B : un conteneur de l'épave s'ouvre (toit et parois) quand on y est, et se referme quand on en sort ; la coque, elle, reste", () => {
  const decor = creerPhare();
  const toits = decor.userData.toits as { nom?: string; efface?: boolean }[];
  const couche = (debut: string) => toits.find((t) => t.nom?.startsWith(debut))!;
  for (const nom of ["conteneur de la Livraison du Jour", "conteneur des provisions du bord", "conteneur d'outillage sur le pont"]) assert.ok(couche(nom), nom);
  // Ce que dessinent les maillages de l'épave (les tranches dessinées : drawRange).
  const epave = decor.getObjectByName("epave_apres")!;
  const dessines = () => {
    let n = 0;
    epave.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !m.geometry.index) n += Math.min(m.geometry.drawRange.count, m.geometry.getAttribute("position").count - m.geometry.drawRange.start);
    });
    return n;
  };
  const loin = jeu(-27, 18);
  animerPhare(decor, loin.x, loin.z, 0.5, Math.PI / 4, VU, []);
  const tout = dessines();
  // Dans le conteneur des provisions du bord (sur la grève) : il s'ouvre, l'autre non.
  const bord = CONTENEURS["conteneur des provisions du bord"]!;
  animerPhare(decor, bord.x, bord.z, 0.5, Math.PI / 4, VU, []);
  assert.ok(couche("conteneur des provisions du bord").efface, "dedans, il s'ouvre");
  assert.ok(!couche("conteneur de la Livraison du Jour").efface, "l'autre reste fermé");
  const ouvert = dessines();
  assert.ok(ouvert < tout - 100, `des triangles en moins (${(tout - ouvert) / 3})`);
  // Loin de lui, sur la grève de l'ouest : il se referme.
  animerPhare(decor, loin.x, loin.z, 0.5, Math.PI / 4, VU, []);
  assert.ok(!couche("conteneur des provisions du bord").efface);
  assert.equal(dessines(), tout);
  // Dans le conteneur d'outillage, sur le pont : il s'ouvre, la coque (sous les pieds) reste.
  const outil = CONTENEURS["conteneur d'outillage sur le pont"]!;
  assert.equal(etageDuPhare(outil.x, outil.z, true), "pont");
  for (let quart = 0; quart < 4; quart++) {
    animerPhare(decor, outil.x, outil.z, 0.5, Math.PI / 4 + (quart * Math.PI) / 2, VU, []);
    assert.ok(couche("conteneur d'outillage").efface, "l'outillage s'ouvre");
    assert.ok(!couche("coque de l'épave").efface, "la coque reste sous les pieds");
  }
  assert.ok(dessines() < tout);
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

test("H : le pavois s'ouvre au haut de l'échelle de coupée (la tôle abaissée au ras du pont, la lisse ôtée)", () => {
  const modele = creerModele({ usure: 0.7 }) as THREE.Group;
  const epave = modele.getObjectByName("epave_apres")!;
  const abaisses = ouvrirLaCoupee(epave);
  assert.ok(abaisses >= 4, `${abaisses} sommets abaissés`);
  assert.equal(ouvrirLaCoupee(epave), 0, "déjà ouvert");
});

test("G : le panneau du sentier côtier se lit à son nouvel endroit, près de l'eau, au départ du sentier ; une lanterne l'éclaire la nuit", () => {
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
  // Sa planche et sa lanterne sont là, au-dessus des galets, à cet endroit.
  const decor = creerPhare();
  const panneau = decor.getObjectByName("panneau du sentier côtier")!;
  assert.ok(panneau, "le panneau");
  const b = new THREE.Box3().setFromObject(panneau);
  const sol = solPhare(ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z, false);
  assert.ok(b.min.y > sol - 0.1 && b.max.y > sol + 2.4 && b.max.y < sol + 3.1, `de ${b.min.y} à ${b.max.y}`);
  // (Le décor est posé dans le repère du jeu.)
  assert.ok(Math.abs((b.min.x + b.max.x) / 2 - ECRITEAU_SENTIER.x) < 1 && Math.abs((b.min.z + b.max.z) / 2 - ECRITEAU_SENTIER.z) < 1);
  assert.ok(decor.getObjectByName("lanterne de panneau"), "la lanterne");
  // La nuit, sa lumière est une source du phare ; le jour, non. Le verre luit la nuit.
  const lanterne = lumieresPhare({ etat: null, epave: false }, true).find((s) => Math.hypot(s.x - ECRITEAU_SENTIER.x, s.z - ECRITEAU_SENTIER.z) < 1.5);
  assert.ok(lanterne && lanterne.y > sol + 1.8, "la lanterne éclaire le panneau, la nuit");
  assert.equal(lumieresPhare({ etat: null, epave: false }, false).length, 0);
  animerPhare(decor, ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z + 1, 0.016, Math.PI / 4, { ...VU, nuit: true }, []);
  const verre = (decor.getObjectByName("lanterne de panneau") as THREE.Mesh).material as THREE.MeshStandardMaterial;
  assert.ok(verre.emissiveIntensity > 1);
  animerPhare(decor, ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z + 1, 0.016, Math.PI / 4, { ...VU, nuit: false }, []);
  assert.equal(verre.emissiveIntensity, 0);
});

test("G2 : la lanterne du panneau, son verre et sa lumière sont à la hauteur réelle du panneau (le sol de la grève à son pied + la potence), pas à celle du plateau ; sa lumière ne porte pas jusqu'à son reflet sur la mer", async () => {
  const { PANNEAU_SENTIER, lampePanneau } = await import("./phare-bords.ts");
  const { VERRE_SOUS_POTENCE } = await import("./lanterne-panneau.ts");
  const sol = solPhare(ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z, false);
  assert.ok(sol < -8.5, `le pied du panneau sur la grève (${sol.toFixed(2)})`);
  const attendu = sol + PANNEAU_SENTIER.poteau - VERRE_SOUS_POTENCE;
  // La source donnée à la réserve de lumières (lumieresPhare, la nuit).
  const source = lumieresPhare({ etat: null, epave: true }, true).find((s) => Math.hypot(s.x - ECRITEAU_SENTIER.x, s.z - ECRITEAU_SENTIER.z) < 1.5)!;
  assert.equal(source, lampePanneau());
  assert.ok(Math.abs(source.y - attendu) < 0.02, `la lumière à ${source.y.toFixed(2)}, attendue à ${attendu.toFixed(2)}`);
  assert.ok(Math.hypot(source.x - ECRITEAU_SENTIER.x, source.z - ECRITEAU_SENTIER.z) < 0.6, "juste devant la planche");
  // Le verre de la lanterne (ce qui luit), dans le décor : au même endroit que la lumière.
  const decor = creerPhare();
  decor.updateMatrixWorld(true);
  const lanterne = decor.getObjectByName("lanterne de panneau") as THREE.Mesh;
  const b = new THREE.Box3().setFromObject(lanterne);
  assert.ok(b.min.y > sol + 2 && b.max.y < sol + PANNEAU_SENTIER.poteau + 0.05, `la lanterne de ${b.min.y.toFixed(2)} à ${b.max.y.toFixed(2)}`);
  assert.ok(source.y > b.min.y && source.y < b.max.y, "la lumière est dans la lanterne");
  // Son reflet sur la mer, vu par la caméra du jeu (35° au-dessus de l'horizon), est hors de sa portée.
  const h = source.y - NIVEAU_MER;
  const reflet = Math.hypot(h, h / Math.tan(Math.atan(1 / Math.SQRT2)));
  assert.ok(source.portee < reflet, `portée ${source.portee} m, reflet à ${reflet.toFixed(1)} m`);
});
