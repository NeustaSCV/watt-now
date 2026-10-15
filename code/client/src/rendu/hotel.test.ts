// Plan 0.10, chantier J : le Grand Hôtel des Flots à l'écran. Les données du jeu (commun/src/hotel.ts) suivent le modèle
// de la session « bâtiments » (batiments/grand-hotel/modele.js) : ses obstacles, sa fiche (pièces, portes, fouilles,
// Éteints, ascenseur, balcon) ; le décor se construit sans navigateur (une toile de dessin factice), tient le budget de
// l'iPhone, et cache le niveau où le personnage n'est pas (L-2).

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

// Une toile de dessin factice : les textures des enseignes et des avis se « dessinent » dans le vide.
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
Object.assign(globalThis, { document: { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => contexte2d }) } });

interface Fiche {
  lot: { l: number; p: number };
  mer: { bord: number; brisants: number };
  panneaux: { x: number; z: number; texte: string; sortie?: string }[];
  depart: { x: number; z: number };
  objets: Record<string, string>;
  teleports: { id: string; bas: { x: number; z: number }; haut: { x: number; z: number } }[];
  sensUnique: { id: string; de: { x: number; z: number }; vers: { x: number; z: number } }[];
  pieces: Record<string, { nom: string; sombre: boolean; boites: { x: number; z: number; l: number; p: number }[] }>;
  portes: { id: string; x: number; z: number; largeur: number; axe: "x" | "z"; entre: [string, string] }[];
  fouille: { x: number; z: number; quoi: string }[];
  eteints: { x: number; z: number; type: string }[];
}
// @ts-ignore — le modèle est en JavaScript (session « bâtiments »), sans déclaration de types.
const modele = (await import("../batiments/grand-hotel/modele.js")) as { FICHE: Fiche; creer(o: { usure: number }): THREE.Group };
const { MER_HOTEL, PANNEAU_SORTIE_HOTEL, SEGMENTS_HOTEL, HOTEL, PIECES_HOTEL, PORTES_HOTEL, ASCENSEUR, BALCON, BORNE, ROBOT, PANNEAU, butinHotel, jeuHotel, niveauHotel, pieceHotel } = await import("../../../commun/src/hotel.ts");
const { eteintsHotel } = await import("../../../commun/src/eteints-hotel.ts");
const { arriveeDans } = await import("../../../commun/src/lieux.ts");
const { animerHotel, creerHotel, lumieresHotel } = await import("./hotel.ts");

test("les obstacles relevés dans commun/src/hotel.ts sont ceux du modèle importé, avec leur niveau (sinon : les recopier)", () => {
  const obstacles = modele.creer({ usure: 0.7 }).userData.obstacles as { x1: number; z1: number; x2: number; z2: number; nature: string; niveau: string }[];
  assert.deepEqual(
    SEGMENTS_HOTEL.map(([x1, z1, x2, z2, nature, n]) => ({ x1, z1, x2, z2, nature, niveau: n === "E" ? "etage" : "rez_de_chaussee" })),
    obstacles.map(({ x1, z1, x2, z2, nature, niveau }) => ({ x1, z1, x2, z2, nature, niveau })),
  );
});

test("la fiche du modèle : le lot, l'arrivée, les pièces et les portes, l'ascenseur, le balcon, la borne, le robot, la batterie", () => {
  const f = modele.FICHE;
  assert.deepEqual([f.lot.l, f.lot.p], [HOTEL.largeur, HOTEL.profondeur]);
  const arrivee = arriveeDans("grand_hotel", "route_pont");
  assert.deepEqual({ x: arrivee.x, z: arrivee.z }, jeuHotel(f.depart.x, f.depart.z));
  for (const [id, p] of Object.entries(f.pieces)) assert.deepEqual(PIECES_HOTEL[id as keyof typeof PIECES_HOTEL], p, id);
  for (const p of f.portes) {
    const nous = PORTES_HOTEL.find((q) => q.id === p.id)!;
    assert.deepEqual({ ...jeuHotel(p.x, p.z), largeur: p.largeur, sens: p.axe }, { x: nous.x, z: nous.z, largeur: nous.largeur, sens: nous.sens }, p.id);
  }
  const asc = f.teleports.find((t) => t.id === "ascenseur")!;
  assert.ok(Math.hypot(jeuHotel(asc.bas.x, asc.bas.z).x - ASCENSEUR.bas.grille.x, jeuHotel(asc.bas.x, asc.bas.z).z - ASCENSEUR.bas.grille.z) < 1.2, "la grille du hall, devant la cabine");
  assert.ok(Math.hypot(jeuHotel(asc.haut.x, asc.haut.z).x - ASCENSEUR.haut.grille.x, jeuHotel(asc.haut.x, asc.haut.z).z - ASCENSEUR.haut.grille.z) < 1.2, "la grille du palier, devant la cabine");
  const balcon = f.sensUnique.find((s) => s.id === "balcon")!;
  assert.deepEqual({ x: BALCON.arrivee.x, z: BALCON.arrivee.z }, jeuHotel(balcon.vers.x, balcon.vers.z));
  assert.ok(Math.hypot(jeuHotel(balcon.de.x, balcon.de.z).x - BALCON.boite.x, jeuHotel(balcon.de.x, balcon.de.z).z - BALCON.boite.z) < 0.2);
  // La borne, le robot, la batterie : là où le modèle dessine leurs objets.
  const g = modele.creer({ usure: 0.7 });
  g.updateMatrixWorld(true);
  const centre = (id: string) => new THREE.Box3().setFromObject(g.userData.objets[id]).getCenter(new THREE.Vector3());
  for (const [id, nous] of [["borne_checkin", BORNE], ["tete_robot", ROBOT], ["batterie_panneau", PANNEAU]] as const) {
    const c = centre(id);
    assert.ok(Math.hypot(c.x + HOTEL.origineModele.x - nous.x, c.z + HOTEL.origineModele.z - nous.z) < 0.3, id);
  }
  // Les objets-clés : leur point de butin est là où le modèle les dessine.
  const butin = butinHotel();
  for (const [type, id] of [["hotel_couvertures", "couvertures_laine"], ["hotel_lanterne", "lanterne_tempete"], ["hotel_roulements", "roulements"], ["hotel_fer", "fer_a_souder"], ["hotel_toles", "toles"]] as const) {
    const c = centre(id);
    const r = butin.find((x) => x.type === type)!;
    assert.ok(Math.hypot(c.x + HOTEL.origineModele.x - r.x, c.z + HOTEL.origineModele.z - r.z) < 0.3, type);
  }
});

test("la mer et le panneau de sortie (0.10, G-1, G-3) : là où le modèle les met ; on perd pied à la ligne de brisants du modèle", () => {
  const f = modele.FICHE;
  assert.deepEqual(MER_HOTEL, { bord: f.mer.bord, brisants: f.mer.brisants });
  const large = SEGMENTS_HOTEL.find((s) => s[4].startsWith("le large"))!;
  assert.ok(large && large[1] === f.mer.brisants && large[3] === f.mer.brisants, "l'obstacle du large, aux brisants");
  assert.ok(!SEGMENTS_HOTEL.some((s) => s[4] === "la mer (bord du lot)"), "le bord de l'eau n'arrête plus");
  const sortie = f.panneaux.find((p) => p.sortie?.startsWith("est"))!;
  assert.deepEqual(PANNEAU_SORTIE_HOTEL, jeuHotel(sortie.x, sortie.z));
  assert.match(sortie.texte, /Route du pont → · Ton terrain, par le pont · 5 km/);
});

test("les 18 Éteints sont aux places de la fiche, et les fouilles aussi", () => {
  const f = modele.FICHE;
  const nos = eteintsHotel();
  assert.equal(nos.length, f.eteints.length);
  f.eteints.forEach((e, i) => {
    assert.deepEqual({ x: nos[i]!.x, z: nos[i]!.z }, jeuHotel(e.x, e.z), e.type);
    if (e.type.startsWith("Noyé")) assert.equal(nos[i]!.variante, "noye");
    if (e.type.startsWith("Ensablé")) assert.equal(nos[i]!.variante, "ensable");
    if (e.type.startsWith("dormeur")) assert.equal(nos[i]!.etat, "dormant");
  });
  // Les fouilles de la fiche (sans le robot ni la batterie, qui sont du check-in) ont chacune leur point.
  const points = butinHotel();
  for (const fo of f.fouille) {
    if (/robot-serveur|panneau « Zéro-Effort »/.test(fo.quoi)) continue;
    const p = jeuHotel(fo.x, fo.z);
    assert.ok(points.some((r) => Math.hypot(r.x - p.x, r.z - p.z) < 0.01), fo.quoi);
  }
});

/** Ce que l'écran dessine : les maillages visibles qui écrivent la couleur (pas ceux qui ne portent qu'une ombre). */
function compter(decor: THREE.Object3D): { triangles: number; appels: number } {
  let triangles = 0;
  let appels = 0;
  decor.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m.material as THREE.Material).colorWrite === false) return;
    const g = m.geometry;
    triangles += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
    appels++;
  });
  return { triangles, appels };
}

test("l'étage ne se voit pas du rez-de-chaussée (le jeu cache le groupe où l'on n'est pas), ni l'inverse ; le budget de l'iPhone tient", () => {
  const decor = creerHotel();
  const rdc = decor.getObjectByName("rez_de_chaussee")!;
  const etage = decor.getObjectByName("etage")!;
  const tout = compter(decor);
  const hall = ASCENSEUR.bas.arrivee;
  animerHotel(decor, hall.x, hall.z, 0, 0.016, Math.PI / 4, null, []);
  assert.equal(niveauHotel(hall.x, hall.z), "rez_de_chaussee");
  assert.equal(rdc.visible, true);
  assert.equal(etage.visible, false, "du hall, l'étage est caché");
  const enBas = compter(decor);
  const palier = ASCENSEUR.haut.arrivee;
  animerHotel(decor, palier.x, palier.z, 0, 0.016, Math.PI / 4, null, []);
  assert.equal(rdc.visible, false, "du palier, le rez-de-chaussée est caché");
  assert.equal(etage.visible, true);
  const enHaut = compter(decor);
  assert.ok(enBas.appels < tout.appels && enHaut.appels < tout.appels, `cacher le niveau absent fait baisser le compte (${tout.appels} → ${enBas.appels} en bas, ${enHaut.appels} en haut)`);
  for (const c of [enBas, enHaut]) {
    assert.ok(c.triangles <= 60_000, `${c.triangles} triangles`);
    assert.ok(c.appels <= 40, `${c.appels} appels`);
  }
  // Les lumières : celles du niveau où l'on est ; l'écran de la borne, seulement allumé.
  const nuitEnBas = lumieresHotel(decor, true, { batterie: "panneau", tete: "robot", degage: false }, hall);
  assert.ok(nuitEnBas.length > 0 && nuitEnBas.length <= 8);
  assert.ok(!nuitEnBas.some((l) => niveauHotel(l.x, l.z) === "etage"));
  assert.equal(lumieresHotel(decor, false, { batterie: "panneau", tete: "robot", degage: false }, hall).length, 0, "de jour, la borne éteinte : rien");
  assert.equal(lumieresHotel(decor, false, { batterie: "borne", tete: "robot", degage: false }, hall).length, 1, "de jour, l'écran allumé de la borne");
  assert.ok(lumieresHotel(decor, true, null, palier).every((l) => niveauHotel(l.x, l.z) === "etage"));
  assert.equal(pieceHotel(palier.x, palier.z), "palier");
});

test("le check-in à l'écran : le sable du robot s'efface une fois dégagé ; la batterie suit l'état ; l'écran de la borne s'allume", () => {
  const decor = creerHotel();
  const objets = decor.children[0]!.userData.objets as Record<string, THREE.Object3D>;
  const hall = ASCENSEUR.bas.arrivee;
  animerHotel(decor, hall.x, hall.z, 0, 0.016, Math.PI / 4, { batterie: "panneau", tete: "robot", degage: false }, []);
  assert.equal(objets.sable_robot!.visible, true);
  assert.equal(objets.ecran_borne_allume!.visible, false);
  assert.equal(objets.ecran_borne_eteint!.visible, true);
  animerHotel(decor, hall.x, hall.z, 0, 0.016, Math.PI / 4, { batterie: "borne", tete: "bras", degage: true }, []);
  assert.equal(objets.sable_robot!.visible, false);
  assert.equal(objets.ecran_borne_allume!.visible, true);
  assert.equal(objets.ecran_borne_eteint!.visible, false);
  decor.updateMatrixWorld(true);
  const c = new THREE.Box3().setFromObject(objets.batterie_panneau!).getCenter(new THREE.Vector3());
  assert.ok(Math.hypot(c.x - BORNE.x, c.z - BORNE.z) < 1.2, "la batterie, au pied de la borne");
  const t = new THREE.Box3().setFromObject(objets.tete_robot!).getCenter(new THREE.Vector3());
  assert.ok(Math.hypot(t.x - hall.x, t.z - hall.z) < 0.8 && t.y > 0.7, "la tête, dans les bras, devant le personnage");
  // Ce qu'on a pris se cache : la lanterne-tempête prise, revenue.
  animerHotel(decor, hall.x, hall.z, 0, 0.016, Math.PI / 4, null, [{ donnees: { type: "hotel_lanterne", disponible: false } }]);
  assert.equal(objets.lanterne_tempete!.visible, false);
});
