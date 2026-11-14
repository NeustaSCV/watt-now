// Le château d'eau et la station de pompage (nouveau lieu, Campagne ou périphérie de la Ville, anneau proche ou moyen,
// danger ●●).
//
// Un repère qu'on voit de loin : la tour de béton à fût cannelé (années 1930) et sa cuve en calice, sa coursive, le nom
// de la commune effacé et le graffiti géant des survivants, « EAU ? NON. ». Au pied, l'intérieur du fût (l'escalier en
// colimaçon qui monte et s'interrompt, la colonne montante), la salle des vannes Art déco, la station de pompage en
// brique (1903) avec ses deux pompes bleues, son pont roulant et son tableau de marbre, le local du chlore, la maison
// du fontainier, le bassin de décantation envahi de roseaux, le réservoir semi-enterré et sa porte de fer.
// L'Abondance avait « connecté » le réseau : compteurs intelligents, eau pilotée par algorithme, borne d'eau premium
// aromatisée, et une dernière facture à payer en ligne.
//
// Repère : origine au centre du lot (56 × 46 m), sol visitable à y = 0, +x à l'est, +z au sud. Le bassin est creusé
// sous y = 0 : le modèle fournit tout son sol (`solPropre`).

import * as THREE from "three";
import { Batiment, PALETTE, aleatoire, matiere, matiereMonde, matiereTexture, matiereVerre, matiereEau, matiereLueur, mur, porte, lierre, touffes, gravats, debris, jonchee, mousse, arbuste, arbre, raiDeLumiere, toitDeuxPans, dessiner, taches } from "../commun/atelier.js";

export const FICHE = {
  id: "chateau-eau",
  nom: "Le château d'eau",
  lieu: "Château d'eau et station de pompage · Campagne (lisière de la Ville) · proche ou moyen",
  environnement: "campagne",
  anneau: "proche",
  danger: 2,
  solPropre: true,
  recit:
    "Pendant un siècle, la tour a donné l'eau à toute la commune sans rien demander. Puis l'Abondance l'a « connectée » : compteurs intelligents, eau pilotée par algorithme, eau premium aromatisée à la menthe glaciaire. Quand le réseau est tombé, l'algorithme a coupé l'eau pour impayé ; il reste un fond dans la cuve, et la dernière facture, au mur, attend toujours son paiement en ligne.",
  inspiration:
    "les châteaux d'eau en béton des années 1930–1960 (fût cannelé, cuve en calice, coursive), les châteaux d'eau Art déco à bas-reliefs, les usines élévatoires Belle Époque en brique et leurs salles des machines ; les photos urbex d'escaliers en colimaçon dans le fût creux, de cuves vides qui résonnent, de mousse et de concrétions de calcaire",
  reperes: [
    "La silhouette : la tour de 30 m à fût cannelé, la cuve en calice à côtes, la coursive (inaccessible) et son garde-corps arraché côté sud-est, le relais « AquaSmart » planté sur le toit",
    "Sur la cuve, le nom de la commune effacé (VILLEBRUNE-LES-SOURCES) et le graffiti géant des survivants : « EAU ? NON. »",
    "Le pied du fût : l'escalier de béton en colimaçon qui monte et s'interrompt, ses marches tombées, la colonne montante bleue, le robinet de vidange où l'on tire le fond de la cuve, les concrétions de calcaire",
    "La salle des vannes Art déco : bas-relief de la Source, volants de fonte, compteurs intelligents « hors ligne », armoire de télégestion",
    "La station de pompage en brique (1903) : deux groupes moto-pompes et leurs tuyauteries bleues, le pont roulant, le tableau de marbre (l'autocollant de Watty), le volant de l'ancienne machine à vapeur, le feu des survivants",
    "Le local du chlore : bouteilles enchaînées, masques à gaz, sacs d'hypochlorite, le panneau DANGER",
    "La maison du fontainier : cuisine, chambre, bureau avec les plans du réseau et la dernière facture « à régler en ligne »",
    "Le bassin de décantation creusé, envahi de roseaux et de nénuphars, ses grenouilles, la passerelle et sa vanne",
    "Le réservoir semi-enterré : tertre herbu, cheminées d'aération, porte de fer, trappe où les survivants descendent leur seau",
    "L'Abondance : panneau « Votre eau, pilotée par algorithme », borne « Eau premium aromatisée » dont l'écran luit encore, compteurs connectés, la camionnette de la Régie",
    "La nuit : la lampe à pétrole du fontainier, le feu des survivants dans la station, la lanterne au pied du fût",
  ],
  lot: { l: 56, p: 46 },
  depart: { x: -2, z: 18.5 },
  entrees: [
    { x: -2, z: 21.8, nature: "portail du sud (un vantail tombé)" },
    { x: -6, z: -7.6, nature: "porte du fût du château d'eau" },
    { x: 0.6, z: -8.5, nature: "porte de la salle des vannes" },
    { x: 15.5, z: -7, nature: "grande porte cintrée de la station de pompage" },
    { x: 23, z: -9, nature: "porte de service de la station, côté est" },
    { x: 6.3, z: -8, nature: "porte du local du chlore" },
    { x: -13, z: 5.3, nature: "porte d'entrée de la maison du fontainier (côté est)" },
    { x: -22.8, z: 12, nature: "porte de la cuisine (côté sud)" },
    { x: -20.2, z: -9.5, nature: "porte de fer du pavillon du réservoir (entrouverte)" },
    { x: 13.5, z: 15, nature: "passerelle du bassin de décantation" },
  ],
  fouille: [
    { x: -5.2, z: -10.2, quoi: "robinet de vidange de la colonne montante : le fond de la cuve (eau à purifier, Book 05), seaux" },
    { x: -0.8, z: -11.6, quoi: "salle des vannes : vannes en fonte, volants, clés de manœuvre" },
    { x: 1.4, z: -12.8, quoi: "compteurs d'eau intelligents : laiton, cartes électroniques, piles" },
    { x: 12.2, z: -13.6, quoi: "groupe moto-pompe n° 1 : pompe centrifuge, roue en bronze, garnitures" },
    { x: 17.4, z: -13.6, quoi: "groupe n° 2, capot ouvert : moteur électrique (cuivre du bobinage), roulements" },
    { x: 20, z: -18.2, quoi: "tableau électrique de marbre : câbles, interrupteurs à couteaux, cuivre" },
    { x: 15, z: -10.2, quoi: "camp des survivants : couvertures, réchaud, conserves, bouteilles vides" },
    { x: 6.3, z: -10.2, quoi: "local du chlore : chlore (chimie, purifier l'eau), masques à gaz" },
    { x: 4.4, z: -3.6, quoi: "pile de tuyaux en fonte : tuyaux, raccords, joints, colliers" },
    { x: -17.5, z: 4.2, quoi: "bureau du fontainier : plans du réseau d'eau (carte des canalisations), outillage de fontainier" },
    { x: -23.6, z: 4.4, quoi: "cuisine : jerricans d'eau, conserves, bouilloire" },
    { x: -15.2, z: 10.4, quoi: "chambre : couvertures, bleus de travail, bottes" },
    { x: -20.8, z: -11.4, quoi: "pavillon du réservoir : corde et seau des survivants, eau du réservoir (à purifier)" },
    { x: -7.6, z: 2.4, quoi: "camionnette de la Régie : batterie, câbles, boîte à outils, roues" },
    { x: 9.5, z: 13.5, quoi: "bassin : grenouilles (nourriture), roseaux (vannerie, torches)" },
  ],
  eteints: [
    { x: 2, z: 0.5, type: "errant (dans la cour)" },
    { x: -16.5, z: 5.6, type: "ancien habitant (le fontainier, bleu de travail et clé à béquille)" },
    { x: 5.6, z: 9.8, type: "rampant (dans les roseaux, au bord du bassin)" },
    { x: 19.5, z: -11, type: "errant (attiré par le feu, dans la station)" },
  ],
};

// ---------- Géométrie du lieu ----------

const CUT = 1.05; // hauteur d'allège : façades sud et est coupées là, le haut s'efface en couche

// Le château d'eau
const TX = -6;
const TZ = -11;
const RF = 3.6; // rayon du fût au sommet des pans (12 pans)
const H_RDC = 3.4;
const HF = 19; // haut du fût, naissance du calice
const RC = 8; // rayon de la cuve
// La salle des vannes, accolée au fût
const AX1 = -3.8;
const AX2 = 2.6;
const AZ1 = -13.5;
const AZ2 = -8.5;
const HA = 3.6;
// La station de pompage
const SX1 = 8;
const SX2 = 23;
const SZ1 = -19;
const SZ2 = -7;
const HS = 6.5;
// Le local du chlore, contre la station
const KX1 = 4.6;
const KX2 = 8;
const KZ1 = -12;
const KZ2 = -8;
const HK = 2.7;
// La maison du fontainier
const MX1 = -25;
const MX2 = -13;
const MZ1 = 3;
const MZ2 = 12;
const HM = 3.0;
const PX = -20.5; // cloison cuisine | bureau et chambre
const PZ = 7.6; // cloison bureau (nord) | chambre (sud)
// Le réservoir semi-enterré et son pavillon
const VX1 = -23;
const VX2 = -18.5;
const VZ1 = -13;
const VZ2 = -9.5;
const HV = 2.9;
// Le bassin de décantation
const BX1 = 6;
const BX2 = 21;
const BZ1 = 5;
const BZ2 = 15;
const BY = -1.6;
const PAS1 = 12.9; // la passerelle
const PAS2 = 14.1;

// ---------- Couleurs ----------

const BETON = 0xcfcabd; // béton des années 1930, grisé
const BETON_SALE = 0xa9a396;
const BETON_SOMBRE = 0x8a857a;
const BRIQUE = 0xa65f45;
const BRIQUE_CLAIRE = 0xc8a07a;
const PIERRE = 0xd2c6a6;
const ENDUIT = 0xdccaa2; // enduit ocre de la maison
const TUILE = 0xb06343;
const BLEU = 0x4d7896; // tuyauteries bleues passées
const VERT_MOTEUR = 0x5e7c6c;
const FONTE = 0x3b3a37;
const JAUNE = 0xb89a42;
const CALCAIRE = 0xe8e4d6;
const HERBE = 0x8a9858;
const HERBE_HAUTE = 0x9aa65e;
const GRAVIER = 0xb3aa96;
const BOIS = 0x7a5a3c;
const BOIS_GRIS = 0x8a8274;
const VERT_EAU = 0x8fae9e;
const CREME = 0xe2d8bf;

// ---------- Matières ----------

const AL = 1024;
const AH = 1152;
const R = {
  nom: [0, 0, 1024, 128],
  graffiti: [0, 128, 1024, 256],
  algo: [0, 384, 512, 256],
  premium: [512, 384, 256, 256],
  ecran: [768, 384, 256, 128],
  compteur: [768, 512, 128, 128],
  reservoir: [896, 512, 128, 128],
  facture: [0, 640, 256, 384],
  plan: [256, 640, 384, 256],
  usine: [640, 640, 384, 128],
  service: [640, 768, 384, 128],
  danger: [256, 896, 128, 128],
  watty: [384, 896, 128, 128],
  avis: [512, 896, 256, 128],
  basrelief: [768, 896, 256, 128],
  grillage: [0, 1024, 256, 128],
  regie: [256, 1024, 256, 128],
};

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("chateau-eau-atlas", AL, AH, dessinerAtlas, false);
  const panneaux = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const ecran = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.8, vertexColors: true, roughness: 0.4 });
  ecran.userData.sansOmbre = true;
  const tuile = matiereTexture(dessiner("chateau-eau-tuile", 128, 128, dessinerTuile), { roughness: 0.9 });
  tuile.userData.tuile = 2;
  MATS = {
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    beton: matiereMonde("beton"),
    brique: matiereMonde("brique"),
    enduit: matiereMonde("enduit"),
    carrelage: matiereMonde("carrelage"),
    tuile,
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0x55703f, 0.86),
    lueur: matiereLueur(0xfff0c8, 0.16),
    panneaux,
    ecran,
  };
  return MATS;
}

// ---------- Outils ----------

const GEO = {};
const BOULE = new THREE.IcosahedronGeometry(1, 0);
const ROSEAU = new THREE.ConeGeometry(0.035, 1, 3, 1, true).translate(0, 0.5, 0);
const BRIN = new THREE.ConeGeometry(0.05, 0.45, 3, 1, true).translate(0, 0.22, 0);

/** Des touffes d'herbes folles semées dans un rectangle (brins ouverts : moitié moins de triangles que l'atelier). */
function herbes(c, x1, z1, x2, z2, n, teinte = HERBE_HAUTE, y = 0) {
  for (let i = 0; i < n; i++) {
    const x = c.entre(x1, x2);
    const z = c.entre(z1, z2);
    const s = 0.7 + c.hasard() * 0.9;
    for (let q = 0; q < 4; q++) {
      const a = (q * Math.PI) / 2 + c.hasard();
      c.poser(BRIN, matiere(), c.hasard() < 0.5 ? teinte : PALETTE.herbe, { x: x + Math.cos(a) * 0.06, y, z: z + Math.sin(a) * 0.06, rz: 0.4 * Math.cos(a), rx: 0.4 * Math.sin(a), e: s }, { nuance: 0.1, crasse: false });
    }
  }
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, r, pose, l, h, mat = matieres().panneaux) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Une bande d'atlas enroulée sur un cylindre (inscription peinte sur la cuve), centrée sur l'angle `thetaC` (0 = sud). */
function bandeau(c, r, x, y0, z, rayon, h, thetaC, thetaL, segments = 12) {
  const g = new THREE.CylinderGeometry(rayon, rayon, h, segments, 1, true, thetaC - thetaL / 2, thetaL);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, matieres().panneaux, 0xffffff, { x, y: y0 + h / 2, z }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un cylindre vertical posé par sa base. */
function cyl(c, mat, couleur, x, y, z, rh, rb, h, cotes = 10, pose = {}, options = {}) {
  const g = new THREE.CylinderGeometry(rh, rb, h, cotes);
  c.poser(g, mat, couleur, { x, y: y + h / 2, z, ...pose }, options);
  g.dispose();
}

/** Un tronc de pyramide (tertre, socle) : base l × p, sommet lt × pt, hauteur h, posé au sol. */
function geoTronc(l, h, p, lt, pt) {
  const g = new THREE.BoxGeometry(l, h, p);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) pos.setXYZ(i, (pos.getX(i) * lt) / l, pos.getY(i), (pos.getZ(i) * pt) / p);
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}

function tore(r, t, cotes = 12, arc = Math.PI * 2) {
  const cle = `tore|${r}|${t}|${cotes}|${arc}`;
  if (!GEO[cle]) GEO[cle] = new THREE.TorusGeometry(r, t, 3, cotes, arc);
  return GEO[cle];
}

function repereMur(a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return { L: Math.hypot(dx, dz), ry: -Math.atan2(dz, dx), dx, dz };
}

/**
 * Un mur coupé à hauteur d'allège : le bas (0 → CUT) dans le chantier visible (avec ses obstacles), le haut dans la
 * couche `k`. Hauteurs des ouvertures absolues ; les fenêtres commencent à CUT au plus bas. Les vantaux des portes
 * sont posés dans le chantier visible.
 */
function murCoupe(b, k, a, bb, spec) {
  const { h, ouvertures = [], breches = [], ...reste } = spec;
  const bas = ouvertures.filter((o) => o.bas < CUT - 0.01).map((o) => ({ ...o, type: "vide", haut: CUT + 0.5 }));
  mur(b.c, a, bb, { ...reste, h: CUT, ouvertures: bas, batiment: b });
  const haut = ouvertures
    .filter((o) => o.haut > CUT + 0.01)
    .map((o) => ({ ...o, type: o.type === "fenetre" ? "fenetre" : "vide", bas: Math.max(0, o.bas - CUT), haut: o.haut - CUT }));
  mur(k, a, bb, { ...reste, y0: CUT, h: h - CUT, ouvertures: haut, breches });
  const { ry } = repereMur(a, bb);
  for (const o of ouvertures) {
    if (o.type === "porte" && o.vantail) b.c.repere({ x: a[0], z: a[1], ry }, () => porte(b.c, o.u, 0, o.haut, o.l, reste.ep ?? 0.3, o));
  }
}

/** Une baie cintrée (dans le repère du mur) : tympan sombre et arc de briques claires au-dessus de l'ouverture. */
function cintre(ch, a, bb, ep, u, haut, l, M, couleurArc = BRIQUE_CLAIRE, tympan = 0x2a3236) {
  const { ry } = repereMur(a, bb);
  ch.repere({ x: a[0], z: a[1], ry }, () => {
    const g = new THREE.CircleGeometry(l / 2, 8, 0, Math.PI);
    ch.poser(g, M.verre, tympan, { x: u, y: haut, z: ep / 2 + 0.01 }, { crasse: false, nuance: 0 });
    ch.poser(g, M.mat, 0x1e2426, { x: u, y: haut, z: -ep / 2 - 0.02, ry: Math.PI }, { crasse: false, nuance: 0 });
    g.dispose();
    ch.poser(tore(l / 2 + 0.13, 0.15, 8, Math.PI), M.mat, couleurArc, { x: u, y: haut, z: ep / 2 + 0.04 }, { crasse: false, nuance: 0.03 });
    // les rayons de la fenêtre en éventail
    for (const t of [0.25, 0.5, 0.75]) {
      const th = Math.PI * t;
      ch.poutre([u, haut, ep / 2 + 0.03], [u + Math.cos(th) * l * 0.48, haut + Math.sin(th) * l * 0.48, ep / 2 + 0.03], 0.035, 0x39413f, M.mat);
    }
    ch.boite(l + 0.1, 0.06, 0.06, 0x39413f, { x: u, y: haut, z: ep / 2 + 0.03 }, M.mat, { crasse: false });
  });
}

/** Un tuyau en ligne brisée, avec des brides aux coudes. */
function tuyau(c, M, pts, r, couleur, mat = M.tole, brides = true) {
  for (let i = 0; i < pts.length - 1; i++) c.tube(pts[i], pts[i + 1], r, couleur, mat, 8);
  if (!brides) return;
  for (let i = 0; i < pts.length; i++) {
    const p = new THREE.Vector3(...pts[i]);
    const q = new THREE.Vector3(...pts[i === pts.length - 1 ? i - 1 : i + 1]);
    const d = q.sub(p).normalize().multiplyScalar(0.06);
    c.tube([p.x - d.x, p.y - d.y, p.z - d.z], [p.x + d.x, p.y + d.y, p.z + d.z], r * 1.4, couleur, mat, 8);
  }
}

/** Un volant de manœuvre (couronne, croisillon, moyeu). `axe` : direction de la tige (« y », « x » ou « z »). */
function volant(c, M, x, y, z, r, axe = "y", couleur = 0x9a3b2c) {
  const rot = axe === "y" ? { rx: Math.PI / 2 } : axe === "x" ? { ry: Math.PI / 2 } : {};
  c.repere({ x, y, z, ...rot }, () => {
    c.poser(tore(r, 0.035, 10), M.tole, couleur, {}, { crasse: false, nuance: 0.04 });
    for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) c.boite(r * 2, 0.04, 0.03, couleur, { rz: a }, M.tole, { crasse: false });
    c.boite(0.1, 0.1, 0.1, FONTE, {}, M.tole, { crasse: false });
  });
}

/** Une vanne à opercule sur un tuyau horizontal le long de x (ou z) : corps, chapeau, tige et volant. */
function vanne(c, M, x, y, z, r, axe = "x", couleur = BLEU, hauteurVolant = 0.9) {
  const d = 0.22;
  const a = axe === "x" ? [x - d, y, z] : [x, y, z - d];
  const bb = axe === "x" ? [x + d, y, z] : [x, y, z + d];
  c.tube(a, bb, r * 1.55, couleur, M.tole, 8);
  c.boite(r * 2.1, r * 2.6, r * 2.1, FONTE, { x, y: y + r * 1.6, z }, M.tole, { nuance: 0.03 });
  c.tube([x, y + r * 2.8, z], [x, y + r * 2.8 + hauteurVolant, z], 0.03, 0x6a6a64, M.metal, 5);
  volant(c, M, x, y + r * 2.8 + hauteurVolant, z, 0.3, "y");
}

/** Une flaque (eau croupie), matière d'eau du lieu. */
function flaque(c, M, x, z, rayon, y = 0.02) {
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = rayon * c.entre(0.6, 1.1);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
  c.poser(g, M.eau, 0x8a9a8a, { x, y, z }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Des concrétions de calcaire qui pendent sous un bord (petits cônes blancs). */
function stalactites(c, M, x1, z1, x2, z2, y, n) {
  for (let i = 0; i < n; i++) {
    const t = c.hasard();
    const lg = c.entre(0.08, 0.35);
    const g = new THREE.ConeGeometry(c.entre(0.015, 0.04), lg, 4);
    c.poser(g, M.lisse, CALCAIRE, { x: x1 + (x2 - x1) * t, y: y - lg / 2, z: z1 + (z2 - z1) * t, rx: Math.PI }, { crasse: false, nuance: 0.05 });
    g.dispose();
  }
}

function chaise(c, M, x, z, ry, renversee, couleur = BOIS) {
  c.repere({ x, y: renversee ? 0.27 : 0.04, z, ry, rx: renversee ? -Math.PI / 2 : 0 }, () => {
    c.boite(0.42, 0.05, 0.42, couleur, { y: 0.45 }, M.mat);
    c.boite(0.42, 0.45, 0.04, couleur, { y: 0.7, z: -0.19 }, M.mat);
    for (const [a, d] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.boite(0.04, 0.44, 0.04, couleur, { x: a, y: 0.22, z: d }, M.mat);
  });
}

// ---------- Le lieu ----------

export function creer({ usure = 0.7 } = {}) {
  const b = new Batiment(1934, usure);
  const M = matieres();
  const k = {
    b,
    c: b.c,
    M,
    usure,
    bris: 0.25 + 0.6 * usure,
    // Les couches qui s'effacent
    // Le fût et la salle des vannes accolée partagent une couche (une seule boîte, de l'ouest du fût à l'est de la salle)
    T: b.couche("château d'eau et salle des vannes (fût, cuve, coursive, toit)", { x: (TX - RF + AX2 + 0.3) / 2, z: TZ, l: AX2 + 0.3 - (TX - RF), p: 2 * RF + 0.4 }, CUT, 35),
    S: b.couche("station de pompage (haut des murs, pont roulant, toit)", { x: (KX1 + SX2) / 2, z: (SZ1 + SZ2) / 2, l: SX2 - KX1 + 0.8, p: SZ2 - SZ1 + 0.8 }, CUT, HS + 3.6),
    H: b.couche("maison du fontainier (haut des murs, toit)", { x: (MX1 + MX2) / 2, z: (MZ1 + MZ2) / 2, l: MX2 - MX1 + 0.8, p: MZ2 - MZ1 + 1 }, CUT, HM + 3),
    V: b.couche("pavillon du réservoir (haut des murs, dalle)", { x: (VX1 + VX2) / 2, z: (VZ1 + VZ2) / 2, l: VX2 - VX1 + 0.6, p: VZ2 - VZ1 + 0.6 }, CUT, HV + 0.6),
  };

  k.A = k.T;
  terrain(k);
  bassin(k);
  tour(k);
  piedDuFut(k);
  salleDesVannes(k);
  station(k);
  salleDesPompes(k);
  localChlore(k);
  maison(k);
  interieurMaison(k);
  reservoir(k);
  cour(k);
  cloture(k);

  // La nuit : la lampe à pétrole du fontainier, le feu des survivants dans la station, la lanterne au pied du fût,
  // et l'écran de la borne premium qui luit encore sur sa batterie.
  b.lumiere(-17.2, 1.15, 3.95, 0xffc070, 4, 7, "lampe à pétrole (bureau du fontainier)");
  b.lumiere(15, 0.8, -10.4, 0xff8a3d, 12, 12, "feu de survivants (station de pompage)");
  b.lumiere(-4.4, 1.75, -7.2, 0xffd27a, 5, 8, "lanterne au pied du fût");
  b.lumiere(-2.5, 1.35, -5.4, 0x7fdcff, 2.5, 4, "écran de la borne « Eau premium » (batterie)");

  return b.construire();
}

// ---------- Le terrain : prairie, cour gravillonnée, trou du bassin ----------

function terrain(k) {
  const { c, M, usure } = k;
  // Le sol du lot, percé du bassin de décantation
  const sol = [
    [-28, -23, 28, BZ1],
    [-28, BZ2, 28, 23],
    [-28, BZ1, BX1, BZ2],
    [BX2, BZ1, 28, BZ2],
  ];
  for (const [x1, z1, x2, z2] of sol) c.pave(x1, -0.5, z1, x2, 0, z2, HERBE, M.mat, { crasse: false, nuance: 0 });
  // La cour gravillonnée, l'allée du portail, les chemins
  c.pave(-12, 0, -8, 24, 0.02, 4.4, GRAVIER, M.mat, { crasse: false, nuance: 0 });
  c.pave(-4.4, 0, 4.4, 0.4, 0.02, 22, GRAVIER, M.mat, { crasse: false, nuance: 0 });
  c.pave(-12.6, 0, 4.4, -4.4, 0.02, 6.2, GRAVIER, M.mat, { crasse: false, nuance: 0 });
  c.pave(-22, 0, -9.5, -12, 0.02, -7, GRAVIER, M.mat, { crasse: false, nuance: 0 });
  c.pave(-23.6, 0, 12, -21.6, 0.02, 14.5, 0xa49a85, M.mat, { crasse: false, nuance: 0 });
  // Plaques d'herbe sur le gravier, ornières de la camionnette
  for (let i = 0; i < 26; i++) {
    const s = c.entre(0.8, 2.6);
    c.boite(s, 0.012, s * c.entre(0.5, 1), c.hasard() < 0.5 ? HERBE : 0x9aa268, { x: c.entre(-11, 23), y: 0.022, z: c.entre(-7.5, 4), ry: c.hasard() * 3 }, M.mat, { crasse: false, nuance: 0.05 });
  }
  for (const dx of [-0.8, 0.8]) c.pave(-2 + dx - 0.2, 0.02, 6, -2 + dx + 0.2, 0.026, 21.5, 0x9a907c, M.mat, { crasse: false, nuance: 0 });
  // Herbes folles partout où l'on ne passe plus
  herbes(c, -12, -7.5, 24, 4, Math.round(40 * usure), HERBE_HAUTE, 0.02);
  herbes(c, -27.5, 13, -5, 21, Math.round(34 * usure), HERBE_HAUTE);
  herbes(c, 1, 16, 27.5, 21, Math.round(28 * usure), HERBE_HAUTE);
  herbes(c, 22, -6, 27.5, 15, Math.round(22 * usure), HERBE_HAUTE);
  herbes(c, -12, -22.5, 7, -15, Math.round(22 * usure), HERBE_HAUTE);
  jonchee(c, -12, -7.5, 8, 4, Math.round(70 * usure), undefined, 0.03);
  // Arbres et haies de la lisière
  arbre(c, -26, 18.5, 8, "feuillu");
  arbre(c, -19.5, 20, 6.5, "bouleau");
  arbre(c, 26.3, 21.6, 7, "feuillu");
  arbre(c, 25.5, 2, 7, "bouleau");
  arbre(c, 25.5, -16, 8, "feuillu");
  arbre(c, 4, -20.5, 6.5, "mort");
  arbre(c, -27.3, 0.5, 5.5, "bouleau");
  for (const [x, z, s] of [[-27, 9, 1.4], [-27, 15, 1.6], [26.5, 8, 1.5], [26.5, 12, 1.3], [26.8, -6, 1.6], [26.8, -10, 1.4], [-6, 20.5, 1.2], [6, 20.5, 1.4], [12, 20.7, 1.2], [18.5, 20.5, 1.5], [-11, -21.5, 1.4], [0, -21.5, 1.6], [10, -21.5, 1.3]]) arbuste(c, x, z, s);
}

// ---------- Le bassin de décantation (creusé) ----------

function bassin(k) {
  const { b, c, M, usure } = k;
  const ep = 0.3;
  // Les parois de béton et la margelle
  c.pave(BX1, BY - 0.1, BZ1, BX1 + ep, 0.18, BZ2, BETON, M.beton, { crasse: false, nuance: 0 });
  c.pave(BX2 - ep, BY - 0.1, BZ1, BX2, 0.18, BZ2, BETON, M.beton, { crasse: false, nuance: 0 });
  c.pave(BX1, BY - 0.1, BZ1, PAS1, 0.18, BZ1 + ep, BETON, M.beton, { crasse: false, nuance: 0 });
  c.pave(PAS2, BY - 0.1, BZ1, BX2, 0.18, BZ1 + ep, BETON, M.beton, { crasse: false, nuance: 0 });
  c.pave(BX1, BY - 0.1, BZ2 - ep, PAS1, 0.18, BZ2, BETON, M.beton, { crasse: false, nuance: 0 });
  c.pave(PAS2, BY - 0.1, BZ2 - ep, BX2, 0.18, BZ2, BETON, M.beton, { crasse: false, nuance: 0 });
  // Le fond de vase, la ligne d'eau d'autrefois, les coulures de calcaire
  c.pave(BX1, BY - 0.2, BZ1, BX2, BY, BZ2, 0x4f4a3a, M.mat, { crasse: false, nuance: 0 });
  const niveau = -0.85 - usure * 0.2;
  for (const [x1, z1, x2, z2] of [[BX1 + ep, BZ1 + ep - 0.01, BX2 - ep, BZ1 + ep], [BX1 + ep, BZ2 - ep, BX2 - ep, BZ2 - ep + 0.01]]) c.pave(x1, -0.35, z1, x2, -0.22, z2, 0x5d6650, M.mat, { crasse: false, nuance: 0 });
  c.pave(BX1 + ep, -0.35, BZ1 + ep, BX1 + ep + 0.01, -0.22, BZ2 - ep, 0x5d6650, M.mat, { crasse: false, nuance: 0 });
  for (let i = 0; i < 18; i++) {
    const x = c.entre(BX1 + 0.5, BX2 - 0.5);
    c.boite(c.entre(0.05, 0.2), c.entre(0.3, 1.0), 0.02, i % 3 ? 0x50553f : CALCAIRE, { x, y: -0.4, z: BZ1 + ep + 0.015 }, M.mat, { crasse: false, nuance: 0.08 });
  }
  // L'eau verte, à mi-hauteur
  c.pave(BX1 + ep, niveau - 0.05, BZ1 + ep, BX2 - ep, niveau, BZ2 - ep, 0xffffff, M.eau, { crasse: false, nuance: 0 });
  // Les roseaux : une roselière à l'ouest et à l'est, des touffes ailleurs ; quelques massettes
  const roselieres = [[BX1 + 0.4, BZ1 + 0.4, BX1 + 4.5, BZ2 - 0.4, 260], [BX2 - 3.5, BZ1 + 0.4, BX2 - 0.4, BZ1 + 4, 110], [BX2 - 2.5, BZ2 - 3, BX2 - 0.4, BZ2 - 0.4, 70], [PAS2 + 0.4, BZ2 - 1.6, PAS2 + 3, BZ2 - 0.4, 40]];
  for (const [x1, z1, x2, z2, n] of roselieres) {
    const nn = Math.round(n * (0.4 + usure * 0.8));
    for (let i = 0; i < nn; i++) {
      const x = c.entre(x1, x2);
      const z = c.entre(z1, z2);
      const h = c.entre(1.1, 2.3);
      c.poser(ROSEAU, M.mat, c.hasard() < 0.3 ? 0x9a9a58 : c.hasard() < 0.5 ? 0x6f8a45 : 0x7f9450, { x, y: BY, z, rx: c.entre(-0.15, 0.15), rz: c.entre(-0.15, 0.15), e: [1, h, 1] }, { crasse: false, nuance: 0.08 });
      if (c.hasard() < 0.08) c.boite(0.06, 0.22, 0.06, 0x5a3d26, { x, y: BY + h * 0.92, z }, M.mat, { crasse: false });
    }
  }
  // Nénuphars, lentilles, et les grenouilles
  const feuille = new THREE.CylinderGeometry(0.28, 0.28, 0.02, 7, 1, false, 0, Math.PI * 1.8);
  for (let i = 0; i < 40; i++) {
    const s = c.entre(0.5, 1.2);
    c.poser(feuille, M.mat, i % 4 ? 0x5f8a3e : 0x7a9a46, { x: c.entre(BX1 + 4.5, BX2 - 3.5), y: niveau + 0.01, z: c.entre(BZ1 + 0.5, BZ2 - 0.5), ry: c.hasard() * 6, e: [s, 1, s] }, { crasse: false, nuance: 0.06 });
  }
  feuille.dispose();
  for (let i = 0; i < 6; i++) c.boite(c.entre(1, 2.5), 0.01, c.entre(0.6, 1.5), 0x7f9a3a, { x: c.entre(BX1 + 5, BX2 - 4), y: niveau + 0.005, z: c.entre(BZ1 + 1, BZ2 - 1), ry: c.hasard() * 3 }, M.mat, { crasse: false, nuance: 0.08 });
  const grenouilles = [[9.5, niveau + 0.05, 8.2], [16.8, niveau + 0.05, 11.6], [11.2, niveau + 0.05, 13.1], [BX2 - 0.15, 0.22, 9.4], [8.4, 0.22, BZ1 + 0.15]];
  for (const [x, y, z] of grenouilles) {
    c.repere({ x, y, z, ry: c.hasard() * 6 }, () => {
      c.poser(BOULE, M.satin, 0x5f7f3a, { y: 0.05, e: [0.07, 0.045, 0.09] }, { crasse: false, nuance: 0.05 });
      c.poser(BOULE, M.satin, 0x6f8f45, { y: 0.08, z: 0.06, e: [0.05, 0.035, 0.05] }, { crasse: false, nuance: 0.05 });
      for (const s of [-1, 1]) c.boite(0.03, 0.03, 0.09, 0x5f7f3a, { x: s * 0.07, y: 0.03, z: -0.05 }, M.satin, { crasse: false });
    });
  }
  // La bouche du tuyau d'arrivée (paroi nord), sa coulure de rouille et de calcaire
  c.tube([10.5, -0.5, BZ1 - 0.3], [10.5, -0.5, BZ1 + 0.55], 0.3, BLEU, M.tole, 10);
  c.tube([10.5, -0.5, BZ1 + 0.5], [10.5, -0.5, BZ1 + 0.6], 0.38, FONTE, M.tole, 10);
  c.pave(10.2, niveau, BZ1 + ep, 10.8, -0.75, BZ1 + ep + 0.02, 0x8a5a3a, M.mat, { crasse: false });
  stalactites(c, M, 10.2, BZ1 + 0.62, 10.8, BZ1 + 0.62, -0.8, 6);

  // La passerelle de béton (au niveau du sol), son garde-corps et la vanne de décantation
  c.pave(PAS1, -0.18, BZ1, PAS2, 0, BZ2, BETON, M.beton, { crasse: false, nuance: 0 });
  for (const z of [BZ1 + 3.3, BZ1 + 6.7]) c.pave(PAS1 + 0.2, BY, z - 0.2, PAS2 - 0.2, -0.18, z + 0.2, BETON_SALE, M.beton, { nuance: 0 });
  for (const x of [PAS1 + 0.04, PAS2 - 0.04]) {
    for (let z = BZ1 + 0.1; z <= BZ2 - 0.05; z += 1.65) c.boite(0.05, 0.95, 0.05, 0x4a5654, { x, y: 0.475, z }, M.metal, { crasse: false });
    const casse = x > 13.5 && usure > 0.5;
    c.tube([x, 0.95, BZ1 + 0.1], [x, 0.95, casse ? 9.5 : BZ2 - 0.1], 0.03, 0x4a5654, M.metal, 5);
    if (casse) c.tube([x, 0.95, 9.5], [x + 0.6, 0.1, 11.8], 0.03, 0x4a5654, M.metal, 5);
    c.tube([x, 0.5, BZ1 + 0.1], [x, 0.5, BZ2 - 0.1], 0.025, 0x4a5654, M.metal, 5);
  }
  // La vanne de la décantation : cadre, vanne-plate qui plonge, volant à crémaillère
  c.pave(PAS2 - 0.08, -1.2, 9.6, PAS2 + 0.08, 1.6, 9.7, FONTE, M.tole);
  c.pave(PAS2 - 0.08, -1.2, 10.5, PAS2 + 0.08, 1.6, 10.6, FONTE, M.tole);
  c.pave(PAS2 - 0.06, 1.55, 9.6, PAS2 + 0.06, 1.7, 10.6, FONTE, M.tole);
  c.pave(PAS2 + 0.02, -1.2, 9.7, PAS2 + 0.06, 0.4, 10.5, 0x6e3a22, M.tole);
  c.tube([PAS2, 1.7, 10.1], [PAS2, 2.1, 10.1], 0.03, 0x6a6a64, M.metal, 5);
  volant(k.c, M, PAS2, 2.1, 10.1, 0.32, "y");

  // Le garde-corps du bassin : tubes sur poteaux, au nord et à l'ouest
  for (const [a, bb] of [[[BX1 + 0.15, BZ1 + 0.15], [PAS1 - 0.1, BZ1 + 0.15]], [[PAS2 + 0.1, BZ1 + 0.15], [BX2 - 0.15, BZ1 + 0.15]], [[BX1 + 0.15, BZ1 + 0.15], [BX1 + 0.15, BZ2 - 0.15]]]) {
    const L = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
    const n = Math.max(1, Math.round(L / 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = a[0] + (bb[0] - a[0]) * t;
      const z = a[1] + (bb[1] - a[1]) * t;
      if (c.hasard() < usure * 0.15) continue;
      c.boite(0.05, 1.0, 0.05, 0x4a5654, { x, y: 0.68, z }, M.metal, { crasse: false });
    }
    c.tube([a[0], 1.15, a[1]], [bb[0], 1.15, bb[1]], 0.03, 0x4a5654, M.metal, 5);
  }
  // Les obstacles : le bord du bassin, sauf les deux bouts de la passerelle, et les deux côtés de la passerelle
  b.obstacle(BX1, BZ1, PAS1, BZ1, "bassin");
  b.obstacle(PAS2, BZ1, BX2, BZ1, "bassin");
  b.obstacle(BX1, BZ2, PAS1, BZ2, "bassin");
  b.obstacle(PAS2, BZ2, BX2, BZ2, "bassin");
  b.obstacle(BX1, BZ1, BX1, BZ2, "bassin");
  b.obstacle(BX2, BZ1, BX2, BZ2, "bassin");
  b.obstacle(PAS1, BZ1, PAS1, BZ2, "garde-corps");
  b.obstacle(PAS2, BZ1, PAS2, BZ2, "garde-corps");
  // Herbes et mousse sur la margelle
  touffes(c, Array.from({ length: Math.round(30 * usure) }, () => (c.hasard() < 0.5 ? [c.entre(BX1, BX2), c.hasard() < 0.5 ? BZ1 + 0.15 : BZ2 - 0.15, 0.18] : [c.hasard() < 0.5 ? BX1 + 0.15 : BX2 - 0.15, c.entre(BZ1, BZ2), 0.18])), HERBE_HAUTE);
  mousse(c, BX2 - 0.15, 0.18, 12, 0.6, 4);
  mousse(c, BX1 + 0.15, 0.18, 7, 0.6, 4);
}

// ---------- Le château d'eau : fût cannelé, calice, cuve, coursive (couche inaccessible) ----------

const ptF = (th, r = RF) => [TX + Math.cos(th) * r, TZ + Math.sin(th) * r];

function tour(k) {
  const { b, c, T, M, usure } = k;
  const ep = 0.4;
  // Le rez-de-chaussée du fût : 12 pans de béton. La moitié sud-est est coupée à l'allège, la moitié nord-ouest monte
  // entière jusqu'à H_RDC (on voit l'escalier contre elle). Porte au sud (pan 2), porte vers la salle des vannes à l'est
  // (pan 11).
  for (let i = 0; i < 12; i++) {
    const t1 = (i * Math.PI) / 6 + Math.PI / 12;
    const t2 = t1 + Math.PI / 6;
    const tm = t1 + Math.PI / 12;
    let a = ptF(t2);
    let bb = ptF(t1);
    const dx = bb[0] - a[0];
    const dz = bb[1] - a[1];
    const L = Math.hypot(dx, dz);
    const ex = 0.1 / L;
    a = [a[0] - dx * ex, a[1] - dz * ex];
    bb = [bb[0] + dx * ex, bb[1] + dz * ex];
    const Lc = L + 0.2;
    const coupe = Math.cos(tm) + Math.sin(tm) > 0.3;
    const ouv = i === 2 ? [{ u: Lc / 2, l: 1.15, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", angle: 1.5, couleurPorte: 0x55707a }] : i === 11 ? [{ u: Lc / 2, l: 1.0, bas: 0, haut: 2.2, type: "vide" }] : i === 7 ? [{ u: Lc / 2, l: 0.5, bas: 1.6, haut: 2.6, type: "fenetre", croisillons: 0, traverses: 2, bris: 0.9, appui: false, cadre: 0x55707a }] : [];
    const interieur = { couleur: 0xc9c3b4, mat: M.enduit };
    if (coupe) murCoupe(b, T, a, bb, { h: H_RDC, ep, couleur: BETON, mat: M.enduit, interieur, ouvertures: ouv });
    else mur(c, a, bb, { h: H_RDC, ep, couleur: BETON, mat: M.enduit, batiment: b, interieur, ouvertures: ouv });
    // Le socle : un ressaut de béton plus sombre au pied de chaque pan (sauf aux portes)
    if (i !== 2 && i !== 11) {
      c.repere({ x: (a[0] + bb[0]) / 2, z: (a[1] + bb[1]) / 2, ry: Math.PI / 2 - tm }, () => c.boite(Lc - 0.2, 0.55, 0.16, BETON_SOMBRE, { y: 0.275, z: ep / 2 + 0.08 }, M.enduit, { nuance: 0.02 }));
    }
  }
  // Les cannelures : une côte saillante à chaque arête du fût, du socle au calice
  for (let i = 0; i < 12; i++) {
    const phi = (i * Math.PI) / 6 + Math.PI / 12;
    const r = RF * Math.cos(Math.PI / 12) + 0.32;
    const coupe = Math.cos(phi) + Math.sin(phi) > 0.3;
    const yb = coupe ? CUT : H_RDC;
    const pose = (y1, y2) => ({ x: TX + Math.cos(phi) * r, y: (y1 + y2) / 2, z: TZ + Math.sin(phi) * r, ry: Math.PI / 2 - phi });
    // la côte passe à l'aplomb d'une arête : on la recule un peu vers l'axe pour qu'elle s'y accroche
    c.boite(0.34, yb, 0.42, BETON, pose(0, yb), M.enduit, { nuance: 0.02 });
    T.boite(0.34, HF - 0.6 - yb, 0.42, BETON, pose(yb, HF - 0.6), M.enduit, { nuance: 0.02, crasse: false });
  }
  // Le fût au-dessus du rez-de-chaussée (12 pans), la bande Art déco sous le calice
  const fut = new THREE.CylinderGeometry(RF + 0.08, RF + 0.08, HF - H_RDC, 12, 1, true, Math.PI / 12, Math.PI * 2);
  T.poser(fut, M.enduit, BETON, { x: TX, y: (HF + H_RDC) / 2, z: TZ }, { crasse: false, nuance: 0 });
  fut.dispose();
  cyl(T, M.enduit, BETON_SALE, TX, H_RDC - 0.05, TZ, RF + 0.2, RF + 0.2, 0.25, 12, { ry: Math.PI / 12 }, { crasse: false, nuance: 0 });
  cyl(T, M.enduit, BETON_SALE, TX, HF - 0.9, TZ, RF + 0.42, RF + 0.42, 0.5, 12, { ry: Math.PI / 12 }, { crasse: false, nuance: 0 });
  cyl(T, M.enduit, BETON, TX, HF - 0.4, TZ, RF + 0.3, RF + 0.3, 0.4, 12, { ry: Math.PI / 12 }, { crasse: false, nuance: 0 });

  // La porte : linteau, plaque « Service des eaux », bas-relief au-dessus
  const sud = (r) => [TX, TZ + r];
  const ap = RF * Math.cos(Math.PI / 12);
  T.boite(1.7, 0.32, 0.2, BETON_SALE, { x: TX, y: 2.46, z: sud(ap + 0.22)[1] }, M.enduit);
  panneau(T, R.service, { x: TX, y: 2.95, z: TZ + ap + 0.22 }, 1.35, 0.45);
  T.boite(1.6, 0.85, 0.08, BETON_SALE, { x: TX, y: 4.45, z: TZ + ap + 0.12 }, M.enduit, { crasse: false });
  panneau(T, R.basrelief, { x: TX, y: 4.45, z: TZ + ap + 0.17 }, 1.5, 0.75);
  // La verrière verticale en pavés de verre, au-dessus du bas-relief (éclairait l'escalier)
  const yv1 = 5.4;
  const yv2 = 15.2;
  T.boite(0.62, yv2 - yv1, 0.06, 0x2c3436, { x: TX, y: (yv1 + yv2) / 2, z: TZ + ap + 0.1 }, M.mat, { crasse: false });
  for (let y = yv1; y <= yv2 + 0.01; y += 0.5) T.boite(0.7, 0.06, 0.1, BETON_SALE, { x: TX, y, z: TZ + ap + 0.12 }, M.enduit, { crasse: false });
  for (let y = yv1 + 0.25; y < yv2; y += 0.5) {
    if (T.hasard() < k.bris * 0.5) continue;
    T.boite(0.26, 0.4, 0.04, 0x9fb4b0, { x: TX - 0.14, y, z: TZ + ap + 0.14 }, M.mat, { crasse: false, nuance: 0.06 });
    if (T.hasard() > k.bris * 0.4) T.boite(0.26, 0.4, 0.04, 0x9fb4b0, { x: TX + 0.14, y, z: TZ + ap + 0.14 }, M.mat, { crasse: false, nuance: 0.06 });
  }
  // Petites fenêtres carrées de l'escalier, en spirale (pans est et ouest)
  for (const [phi, y] of [[Math.PI / 6 + 0.0, 7], [(5 * Math.PI) / 6, 9.5], [Math.PI / 6, 12], [(5 * Math.PI) / 6, 14.5], [-Math.PI / 6, 10.8]]) {
    T.repere({ x: TX + Math.cos(phi) * (ap + 0.09), y, z: TZ + Math.sin(phi) * (ap + 0.09), ry: Math.PI / 2 - phi }, () => {
      T.boite(0.7, 0.7, 0.06, 0x242a2c, {}, M.mat, { crasse: false });
      T.boite(0.85, 0.1, 0.16, BETON_SALE, { y: -0.4, z: 0.04 }, M.enduit, { crasse: false });
      for (let q = 0; q < 2; q++) T.boite(T.entre(0.05, 0.12), T.entre(0.8, 2.4), 0.02, 0x7d786c, { x: T.entre(-0.3, 0.3), y: -1.4, z: 0.02 }, M.mat, { crasse: false, nuance: 0.1 });
    });
  }
  // Coulures sombres et traînées de calcaire le long du fût
  for (let i = 0; i < 22; i++) {
    const phi = T.entre(-0.8, 2.4);
    const lg = T.entre(1.5, 6);
    const y = T.entre(H_RDC + lg / 2, HF - 0.9 - lg / 2);
    T.boite(T.entre(0.06, 0.25), lg, 0.02, i % 4 === 0 ? CALCAIRE : 0x7c776b, { x: TX + Math.cos(phi) * (ap + 0.1), y, z: TZ + Math.sin(phi) * (ap + 0.1), ry: Math.PI / 2 - phi }, M.mat, { crasse: false, nuance: 0.08 });
  }

  // Le calice : une coupe de béton qui s'évase jusqu'à la cuve, à côtes
  const profil = [[RF + 0.3, HF], [RF + 0.6, HF + 0.7], [4.9, HF + 1.9], [6.2, HF + 3.2], [7.4, HF + 4.4], [RC, HF + 5.0]];
  const lathe = new THREE.LatheGeometry(profil.map(([r, y]) => new THREE.Vector2(r, y)), 24);
  T.poser(lathe, M.enduit, BETON, { x: TX, y: 0, z: TZ }, { crasse: false, nuance: 0 });
  lathe.dispose();
  for (let i = 0; i < 12; i++) {
    const phi = (i * Math.PI) / 6 + Math.PI / 12;
    for (let j = 0; j < profil.length - 1; j++) {
      const [r1, y1] = profil[j];
      const [r2, y2] = profil[j + 1];
      T.poutre([TX + Math.cos(phi) * (r1 + 0.12), y1, TZ + Math.sin(phi) * (r1 + 0.12)], [TX + Math.cos(phi) * (r2 + 0.12), y2, TZ + Math.sin(phi) * (r2 + 0.12)], 0.3, BETON, M.enduit, { crasse: false, nuance: 0.02 });
    }
  }
  // Les traînées de calcaire sous la cuve, et les concrétions qui pendent sous la coursive
  for (let i = 0; i < 14; i++) {
    const phi = T.entre(-0.9, 2.5);
    const t = T.entre(0.2, 0.8);
    const r = RF + 0.6 + t * (RC - RF - 0.6);
    T.boite(T.entre(0.1, 0.4), T.entre(0.8, 2.2), 0.03, i % 3 ? CALCAIRE : 0x6f6b60, { x: TX + Math.cos(phi) * (r + 0.1), y: HF + 0.7 + t * 4.3, z: TZ + Math.sin(phi) * (r + 0.1), ry: Math.PI / 2 - phi, rx: -0.6 }, M.mat, { crasse: false, nuance: 0.06 });
  }
  const yC = HF + 5.0; // niveau de la coursive
  for (let i = 0; i < 16; i++) {
    const phi = T.entre(-1, 2.6);
    const g = new THREE.ConeGeometry(T.entre(0.04, 0.09), T.entre(0.3, 0.9), 4);
    T.poser(g, M.mat, CALCAIRE, { x: TX + Math.cos(phi) * T.entre(8.3, 8.9), y: yC - 0.45, z: TZ + Math.sin(phi) * T.entre(8.3, 8.9), rx: Math.PI }, { crasse: false, nuance: 0.05 });
    g.dispose();
  }

  // La cuve : virole de béton, corniche, toit conique, lanterneau
  const hV = 3.6;
  const virole = new THREE.CylinderGeometry(RC, RC, hV, 32, 1, true);
  T.poser(virole, M.enduit, BETON, { x: TX, y: yC + hV / 2, z: TZ }, { crasse: false, nuance: 0 });
  virole.dispose();
  cyl(T, M.enduit, BETON_SALE, TX, yC + 1.15, TZ, RC + 0.05, RC + 0.05, 0.12, 32, {}, { crasse: false, nuance: 0 });
  cyl(T, M.enduit, BETON, TX, yC + hV, TZ, RC + 0.4, RC + 0.3, 0.45, 32, {}, { crasse: false, nuance: 0 });
  const toit = new THREE.CylinderGeometry(1.4, RC + 0.25, 1.6, 32, 1, true);
  T.poser(toit, M.mat, 0x948f84, { x: TX, y: yC + hV + 0.45 + 0.8, z: TZ }, { crasse: false, nuance: 0 });
  toit.dispose();
  // les nervures rayonnantes du toit
  for (let i = 0; i < 16; i++) {
    const phi = (i * Math.PI) / 8 + 0.1;
    T.poutre([TX + Math.cos(phi) * (RC + 0.2), yC + hV + 0.5, TZ + Math.sin(phi) * (RC + 0.2)], [TX + Math.cos(phi) * 1.45, yC + hV + 2.05, TZ + Math.sin(phi) * 1.45], 0.16, 0xa8a397, M.mat, { crasse: false });
  }
  cyl(T, M.enduit, BETON, TX, yC + hV + 2.05, TZ, 1.3, 1.4, 1.1, 8, {}, { crasse: false, nuance: 0 });
  cyl(T, M.enduit, BETON_SALE, TX, yC + hV + 3.15, TZ, 0.2, 1.6, 0.6, 8, {}, { crasse: false, nuance: 0 });
  for (let i = 0; i < 4; i++) {
    const phi = (i * Math.PI) / 2 + Math.PI / 4;
    T.boite(0.5, 0.6, 0.05, 0x2a3032, { x: TX + Math.cos(phi) * 1.36, y: yC + hV + 2.6, z: TZ + Math.sin(phi) * 1.36, ry: Math.PI / 2 - phi }, M.mat, { crasse: false });
  }
  // Mousse et herbes sur le toit de la cuve
  mousse(T, TX + 3, yC + hV + 1.55, TZ + 2, 1.6, Math.round(6 * usure) + 2);
  mousse(T, TX - 2, yC + hV + 1.55, TZ - 3, 1.4, Math.round(4 * usure) + 2);
  // Coulures noires sous la corniche
  for (let i = 0; i < 14; i++) {
    const phi = T.entre(-1.2, 2.8);
    const lg = T.entre(0.6, 2.2);
    T.boite(T.entre(0.06, 0.2), lg, 0.03, 0x8a857a, { x: TX + Math.cos(phi) * (RC + 0.03), y: yC + hV - lg / 2, z: TZ + Math.sin(phi) * (RC + 0.03), ry: Math.PI / 2 - phi }, M.mat, { crasse: false, nuance: 0.1 });
  }
  // Le nom de la commune, effacé, et le graffiti géant des survivants
  bandeau(T, R.nom, TX, yC + 2.6, TZ, RC + 0.05, 0.8, 0.72, 0.82, 10);
  bandeau(T, R.graffiti, TX, yC + 0.25, TZ, RC + 0.06, 2.2, 0.8, 1.1, 12);

  // La coursive : plancher sur consoles, garde-corps (arraché et pendant côté sud-est)
  cyl(T, M.enduit, BETON_SALE, TX, yC - 0.2, TZ, RC + 1.0, RC + 1.0, 0.2, 32, {}, { crasse: false, nuance: 0 });
  for (let i = 0; i < 16; i++) {
    const phi = (i * Math.PI) / 8;
    T.poutre([TX + Math.cos(phi) * (RC - 0.4), yC - 0.9, TZ + Math.sin(phi) * (RC - 0.4)], [TX + Math.cos(phi) * (RC + 0.8), yC - 0.15, TZ + Math.sin(phi) * (RC + 0.8)], 0.22, BETON_SALE, M.enduit, { crasse: false });
  }
  const nP = 40;
  const rG = RC + 0.92;
  const arrache = (i) => usure > 0.4 && i >= 3 && i <= 6;
  for (let i = 0; i < nP; i++) {
    const phi = (i / nP) * Math.PI * 2;
    const phi2 = ((i + 1) / nP) * Math.PI * 2;
    if (arrache(i)) continue;
    T.boite(0.05, 1.05, 0.05, 0x3c4442, { x: TX + Math.cos(phi) * rG, y: yC + 0.52, z: TZ + Math.sin(phi) * rG }, M.metal, { crasse: false });
    if (arrache(i + 1)) continue;
    for (const h of [0.5, 1.02]) T.poutre([TX + Math.cos(phi) * rG, yC + h, TZ + Math.sin(phi) * rG], [TX + Math.cos(phi2) * rG, yC + h, TZ + Math.sin(phi2) * rG], 0.04, 0x3c4442, M.metal);
  }
  if (usure > 0.4) {
    // Le garde-corps arraché pend le long du calice
    const phi = (4.5 / nP) * Math.PI * 2;
    const x = TX + Math.cos(phi) * rG;
    const z = TZ + Math.sin(phi) * rG;
    T.poutre([x, yC, z], [x + 0.3, yC - 2.6, z + 0.2], 0.04, 0x3c4442, M.metal);
    T.poutre([x - 0.6, yC, z + 0.4], [x - 0.3, yC - 2.4, z + 0.6], 0.04, 0x3c4442, M.metal);
    T.poutre([x + 0.3, yC - 2.6, z + 0.2], [x - 0.3, yC - 2.4, z + 0.6], 0.04, 0x3c4442, M.metal);
  }
  // L'échelle à crinoline qui monte de la coursive au toit
  const phE = -0.9;
  const xe = TX + Math.cos(phE) * (RC + 0.25);
  const ze = TZ + Math.sin(phE) * (RC + 0.25);
  for (const s of [-0.22, 0.22]) T.poutre([xe - Math.sin(phE) * s, yC, ze + Math.cos(phE) * s], [xe - Math.sin(phE) * s, yC + hV + 0.6, ze + Math.cos(phE) * s], 0.04, 0x3c4442, M.metal);
  for (let y = yC + 0.3; y < yC + hV + 0.5; y += 0.6) T.poutre([xe - Math.sin(phE) * 0.22, y, ze + Math.cos(phE) * 0.22], [xe + Math.sin(phE) * 0.22, y, ze - Math.cos(phE) * 0.22], 0.03, 0x3c4442, M.metal);

  // Le relais « AquaSmart » planté sur le lanterneau : mât, antennes-panneaux, parabole, balise éteinte
  const yM = yC + hV + 3.75;
  T.tube([TX, yM - 0.2, TZ], [TX, yM + 4.2, TZ], 0.09, 0x9aa0a2, M.metal, 6);
  for (let i = 0; i < 3; i++) {
    const phi = (i * 2 * Math.PI) / 3 + 0.4;
    T.boite(0.3, 1.3, 0.12, 0xdcdad2, { x: TX + Math.cos(phi) * 0.32, y: yM + 3.2, z: TZ + Math.sin(phi) * 0.32, ry: Math.PI / 2 - phi, rx: i === 1 && usure > 0.5 ? 0.5 : 0 }, M.mat, { crasse: false });
  }
  T.poser(new THREE.SphereGeometry(0.45, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2.6), M.mat, 0xdcdad2, { x: TX + 0.35, y: yM + 1.8, z: TZ + 0.35, rx: -1.2, ry: Math.PI / 4 }, { crasse: false });
  T.boite(0.16, 0.2, 0.16, 0x8a2a24, { x: TX, y: yM + 4.3, z: TZ }, M.mat, { crasse: false });
  T.tube([TX, yM + 1.2, TZ], [TX + 1.0, yC + hV + 1.3, TZ + 1.2], 0.02, 0x222222, M.mat, 4);
}

// ---------- Le pied du fût (visitable) ----------

function piedDuFut(k) {
  const { b, c, M, usure } = k;
  const ri = RF * Math.cos(Math.PI / 12) - 0.2; // nu intérieur du mur
  // Le sol : dalle de béton, et la pente usée vers le siphon
  const sol = new THREE.CylinderGeometry(ri + 0.05, ri + 0.05, 0.04, 12, 1, false, Math.PI / 12);
  c.poser(sol, M.beton, 0xb3ad9f, { x: TX, y: 0.02, z: TZ }, { crasse: false, nuance: 0 });
  sol.dispose();
  // La colonne montante (bleue) et la conduite de distribution, au centre
  tuyau(c, M, [[TX, 0, TZ], [TX, H_RDC + 0.4, TZ]], 0.32, BLEU);
  for (const y of [1.2, 2.4]) c.tube([TX, y - 0.05, TZ], [TX, y + 0.05, TZ], 0.44, BLEU, M.tole, 8);
  tuyau(c, M, [[TX + 0.75, 0, TZ - 0.4], [TX + 0.75, H_RDC + 0.4, TZ - 0.4]], 0.18, 0x6f7f74);
  // Le tuyau d'arrivée qui vient de la salle des vannes (est), au ras du sol, et monte dans la colonne
  tuyau(c, M, [[TX + 3.3, 0.55, TZ - 1.9], [TX + 0.9, 0.55, TZ - 1.9], [TX + 0.3, 0.55, TZ - 0.5]], 0.2, BLEU);
  // Le robinet de vidange de la colonne : le fond de la cuve coule encore au goutte-à-goutte dans un seau
  c.tube([TX, 0.55, TZ], [TX + 0.65, 0.55, TZ + 0.45], 0.1, BLEU, M.tole, 6);
  vanne(c, M, TX + 0.45, 0.55, TZ + 0.3, 0.1, "x", BLEU, 0.3);
  c.tube([TX + 0.65, 0.55, TZ + 0.45], [TX + 0.65, 0.35, TZ + 0.45], 0.06, 0x9a8a5a, M.metal, 6);
  cyl(c, M.tole, 0x7d8a8a, TX + 0.68, 0.03, TZ + 0.5, 0.2, 0.16, 0.3, 8);
  cyl(c, M.eau, 0xa0b0a0, TX + 0.68, 0.28, TZ + 0.5, 0.18, 0.18, 0.02, 8);
  cyl(c, M.tole, 0x8a5a3a, TX + 1.2, 0.03, TZ + 0.9, 0.2, 0.16, 0.3, 8, { rz: Math.PI / 2 - 0.2 });
  flaque(c, M, TX + 1, TZ + 0.9, 0.7, 0.045);
  // L'indicateur de niveau de la cuve : un tube de verre, un flotteur, une réglette
  c.pave(TX - 0.35, 0.6, TZ + 0.3, TX - 0.25, 3.2, TZ + 0.36, 0xe1dccb, M.satin);
  for (let y = 0.8; y < 3.1; y += 0.25) c.boite(0.12, 0.015, 0.02, 0x2a2a2a, { x: TX - 0.3, y, z: TZ + 0.37 }, M.mat, { crasse: false });
  c.boite(0.14, 0.08, 0.06, 0xa33a2a, { x: TX - 0.3, y: 0.85, z: TZ + 0.38 }, M.satin, { crasse: false });

  // L'escalier de béton en colimaçon, contre le mur : il monte et s'interrompt vers 2,6 m
  const rIn = 1.65;
  const rOut = ri - 0.02;
  const rm = (rIn + rOut) / 2;
  const th0 = Math.PI / 2 + 0.75;
  const dth = 0.3;
  const mains = [];
  for (let i = 0; i < 14; i++) {
    const th = th0 + dth * i;
    const y = 0.2 * (i + 1);
    if (i === 12 || (i === 13 && usure > 0.8)) continue;
    const penche = i === 13 ? 0.5 : 0;
    c.repere({ x: TX + Math.cos(th) * rm, y, z: TZ + Math.sin(th) * rm, ry: Math.PI / 2 - th, rz: penche, rx: i === 13 ? 0.25 : 0 }, () => {
      c.boite(1.0, 0.2, rOut - rIn, BETON, { y: -0.1 }, M.beton, { nuance: 0.02, crasse: i < 3 });
      // la paillasse sous la marche
      c.boite(0.9, 0.18, rOut - rIn - 0.1, BETON_SALE, { y: -0.3 }, M.beton, { nuance: 0.03, crasse: false });
      if (i < 12) c.boite(0.035, 0.95, 0.035, FONTE, { y: 0.475, z: -(rOut - rIn) / 2 + 0.06 }, M.tole, { crasse: false });
    });
    if (i < 12) mains.push([TX + Math.cos(th) * (rIn + 0.06), y + 0.95, TZ + Math.sin(th) * (rIn + 0.06)]);
  }
  for (let i = 0; i < mains.length - 1; i++) c.poutre(mains[i], mains[i + 1], 0.045, 0x4a5654, M.metal);
  const fin = mains[mains.length - 1];
  c.poutre(fin, [fin[0] + 0.5, fin[1] - 1.4, fin[2] + 0.4], 0.045, 0x4a5654, M.metal);
  // Les concrétions de calcaire sous le bout cassé, les marches tombées au sol
  const thF = th0 + dth * 11.5;
  stalactites(c, M, TX + Math.cos(thF) * rIn, TZ + Math.sin(thF) * rIn, TX + Math.cos(thF) * rOut, TZ + Math.sin(thF) * rOut, 1.9, 9);
  for (let q = 0; q < 3; q++) c.boite(1.0, 0.2, rOut - rIn - 0.1, BETON, { x: TX + 1.2 + c.entre(-0.3, 0.4), y: 0.12 + q * 0.1, z: TZ - 1.9 + c.entre(-0.3, 0.3), ry: c.hasard() * 3, rz: c.entre(-0.25, 0.25) }, M.beton, { nuance: 0.04 });
  gravats(c, TX + 1.4, TZ - 1.7, 0.9, Math.round(6 + 8 * usure), [BETON, BETON_SALE, CALCAIRE], 0.04);
  // L'escalier bloque le passage tant qu'il est bas (marches 0 à 7)
  for (let i = 0; i < 8; i++) {
    const t1 = th0 - dth / 2 + dth * i;
    const t2 = t1 + dth;
    b.obstacle(TX + Math.cos(t1) * rIn, TZ + Math.sin(t1) * rIn, TX + Math.cos(t2) * rIn, TZ + Math.sin(t2) * rIn, "escalier");
  }
  b.obstacle(TX + Math.cos(th0 - dth / 2) * rIn, TZ + Math.sin(th0 - dth / 2) * rIn, TX + Math.cos(th0 - dth / 2) * rOut, TZ + Math.sin(th0 - dth / 2) * rOut, "escalier");
  // Le rai de lumière qui tombe des pavés de verre, mousse et calcaire au pied du mur
  raiDeLumiere(c, [TX + 0.2, H_RDC, TZ + 2.4], [TX + 0.6, 0.05, TZ + 1.1], 0.9, 0.16);
  debris(c, TX - 2.6, TZ - 2.6, TX + 2.6, TZ + 2.6, Math.round(7 * usure), [BETON, CALCAIRE, 0x9fb4b0], 0.04);
  mousse(c, TX - 2.2, 0.04, TZ - 1.4, 0.7, 4);

  // Dehors, près de la porte : la lanterne des survivants sur son crochet, la planche « Eau non potable »
  const zp = TZ + RF * Math.cos(Math.PI / 12) + 0.25;
  c.tube([TX + 1.6, 2.0, zp], [TX + 1.6, 2.0, zp + 0.35], 0.02, FONTE, M.metal, 4);
  c.repere({ x: TX + 1.6, y: 1.72, z: zp + 0.35 }, () => {
    c.boite(0.2, 0.03, 0.2, FONTE, { y: 0.15 }, M.metal, { crasse: false });
    c.boite(0.2, 0.03, 0.2, FONTE, { y: -0.15 }, M.metal, { crasse: false });
    for (const [x, z] of [[-0.09, -0.09], [0.09, -0.09], [-0.09, 0.09], [0.09, 0.09]]) c.boite(0.02, 0.3, 0.02, FONTE, { x, z }, M.metal, { crasse: false });
    cyl(c, M.lueur, 0xffc070, 0, -0.12, 0, 0.07, 0.07, 0.22, 6);
    c.tube([0, 0.16, 0], [0, 0.28, 0], 0.015, FONTE, M.metal, 4);
  });
  c.repere({ x: TX - 1.7, y: 0, z: zp + 0.35, ry: 0.35 }, () => {
    c.boite(1.5, 0.65, 0.04, 0x8a7a62, { y: 0.55, rx: -0.2 }, M.mat);
    panneau(c, R.avis, { y: 0.55, z: 0.03, rx: -0.2 }, 1.42, 0.6);
  });
  lierre(c, TX - 3.5, 0, TZ - 0.5, -Math.PI / 2 - 0.3, 3, 4.5, Math.round(30 * usure));
  lierre(c, TX - 2.4, 0, TZ - 2.8, Math.PI + 0.7, 2.5, 3.5, Math.round(18 * usure));
}

// ---------- La salle des vannes (Art déco, accolée au fût) ----------

function salleDesVannes(k) {
  const { b, c, A, M, usure } = k;
  const ep = 0.3;
  const interieur = { couleur: 0xd9d3c2, mat: M.beton };
  // Façade sud : porte, une fenêtre ; façade est : une fenêtre haute
  const fen = (u, l = 1.3) => ({ u, l, bas: 1.3, haut: 2.9, type: "fenetre", croisillons: 2, traverses: 3, bris: k.bris, appui: true, cadre: 0x55707a });
  murCoupe(b, A, [AX1, AZ2], [AX2, AZ2], { h: HA, ep, couleur: BETON, mat: M.beton, interieur, ouvertures: [{ u: 4.4, l: 1.2, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", angle: 1.2, couleurPorte: 0x55707a }, fen(2.2)] });
  murCoupe(b, A, [AX2, AZ2], [AX2, AZ1], { h: HA, ep, couleur: BETON, mat: M.beton, interieur, ouvertures: [fen(2.5, 1.6)] });
  mur(c, [AX2, AZ1], [AX1, AZ1], { h: HA, ep, couleur: BETON, mat: M.beton, batiment: b, interieur });
  // Le toit-terrasse, son acrotère à gradins Art déco
  A.pave(AX1 - 0.1, HA, AZ1 - 0.2, AX2 + 0.2, HA + 0.25, AZ2 + 0.2, BETON_SALE, M.beton, { crasse: false, nuance: 0 });
  A.pave(AX1, HA + 0.25, AZ2 + 0.05, AX2 + 0.2, HA + 0.55, AZ2 + 0.2, BETON, M.beton, { crasse: false, nuance: 0 });
  A.pave(AX2 + 0.05, HA + 0.25, AZ1 - 0.2, AX2 + 0.2, HA + 0.55, AZ2 + 0.2, BETON, M.beton, { crasse: false, nuance: 0 });
  A.pave(AX1 + 1.6, HA + 0.55, AZ2 + 0.05, AX2 - 1.0, HA + 0.8, AZ2 + 0.2, BETON, M.beton, { crasse: false, nuance: 0 });
  A.pave(AX1 + 2.4, HA + 0.8, AZ2 + 0.05, AX2 - 1.8, HA + 1.0, AZ2 + 0.2, BETON, M.beton, { crasse: false, nuance: 0 });
  mousse(A, -0.5, HA + 0.25, -11, 2, Math.round(4 * usure));
  herbes(A, AX1, AZ1, AX2, AZ2, Math.round(14 * usure), HERBE_HAUTE, HA + 0.25);
  // Les bandeaux horizontaux Art déco de la façade sud (trois filets)
  for (const y of [3.0, 3.15, 3.3]) A.pave(AX1, y, AZ2 + 0.15, AX2 + 0.15, y + 0.06, AZ2 + 0.22, BETON_SALE, M.beton, { crasse: false });
  // Le sol, carrelé
  c.pave(AX1 + 0.1, 0, AZ1 + 0.15, AX2 - 0.15, 0.04, AZ2 - 0.15, 0xc9c0a8, M.carrelage, { crasse: false, nuance: 0 });

  // Les conduites : l'arrivée de la station (bleue) descend du pont-tuyau et file vers le fût ; la distribution
  // (gris-vert) sort du fût et plonge dans le sol vers la commune.
  const zA = AZ1 + 0.55;
  const zD = AZ1 + 1.35;
  tuyau(c, M, [[AX2 + 0.2, 2.8, zA], [AX2 - 0.5, 2.8, zA], [AX2 - 0.5, 0.55, zA], [AX1 - 0.3, 0.55, zA]], 0.2, BLEU);
  tuyau(c, M, [[AX1 - 0.3, 0.55, zD], [AX2 - 1.4, 0.55, zD], [AX2 - 1.4, 0.0, zD]], 0.18, 0x6f7f74);
  for (const x of [-2.6, -0.5, 1.4]) c.pave(x - 0.15, 0, zA - 0.2, x + 0.15, 0.36, zD + 0.2, BETON_SALE, M.beton, { nuance: 0.02 });
  vanne(c, M, -1.6, 0.55, zA, 0.2, "x", BLEU, 0.55);
  vanne(c, M, 0.5, 0.55, zA, 0.2, "x", BLEU, 0.55);
  vanne(c, M, -1.0, 0.55, zD, 0.18, "x", 0x6f7f74, 0.6);
  // Une vanne démontée au sol, son volant à côté (fouille)
  c.boite(0.45, 0.5, 0.45, FONTE, { x: 1.2, y: 0.27, z: -10.0, ry: 0.4, rz: 0.15 }, M.tole);
  c.poser(tore(0.3, 0.035, 10), M.tole, 0x9a3b2c, { x: 0.4, y: 0.06, z: -9.5, rx: Math.PI / 2 }, { crasse: false });
  c.boite(1.1, 0.04, 0.04, 0x6a6a64, { x: -0.6, y: 0.06, z: -9.3, ry: 0.6 }, M.metal); // clé de manœuvre
  b.obstacle(AX1, zA - 0.25, AX2, zA - 0.25, "conduite");
  b.obstacle(AX1, zD + 0.25, AX2 - 1.4, zD + 0.25, "conduite");
  // Les compteurs intelligents « hors ligne », au mur nord, au-dessus des conduites
  for (let i = 0; i < 4; i++) {
    const x = -2.4 + i * 1.15;
    c.boite(0.4, 0.5, 0.14, 0xd9d6cc, { x, y: 1.75, z: AZ1 + 0.24 }, M.satin, { crasse: false });
    panneau(c, R.compteur, { x, y: 1.75, z: AZ1 + 0.32 }, 0.34, 0.34);
    c.tube([x, 1.5, AZ1 + 0.24], [x, 1.0, AZ1 + 0.24], 0.03, 0x222222, M.mat, 4);
  }
  // L'armoire de télégestion « AquaSmart Edge » : voyants morts, porte ouverte, câbles arrachés
  c.pave(AX2 - 0.9, 0, AZ1 + 2.3, AX2 - 0.2, 1.9, AZ1 + 3.3, 0xd9d6cc, M.satin);
  c.boite(0.04, 1.8, 0.95, 0xd9d6cc, { x: AX2 - 1.25, y: 0.95, z: AZ1 + 3.6, ry: 0.9 }, M.satin);
  for (let i = 0; i < 5; i++) c.boite(0.02, 0.05, 0.05, [0x3a5a3a, 0x5a3a3a, 0x3a3a5a][i % 3], { x: AX2 - 0.91, y: 1.5 - i * 0.12, z: AZ1 + 2.6 }, M.lisse, { crasse: false });
  c.tube([AX2 - 0.9, 0.5, AZ1 + 2.8], [AX2 - 1.4, 0.05, AZ1 + 3.4], 0.02, 0x1e1e1e, M.mat, 4);
  // Un vieux manomètre, une plaque de consignes, des seaux
  cyl(c, M.metal, 0xd8d0b8, AX1 + 0.8, 1.35, AZ1 + 0.28, 0.14, 0.14, 0.06, 10, { rx: Math.PI / 2 }, { crasse: false });
  debris(c, AX1 + 0.3, AZ1 + 2, AX2 - 0.3, AZ2 - 0.3, Math.round(8 * usure), [BETON, 0xd9d3c2, CALCAIRE], 0.04);
  flaque(c, M, -1.8, -9.6, 0.6, 0.05);

  // Dehors : le bas-relief Art déco au-dessus de la porte (la Source), la borne « Eau premium aromatisée »
  A.boite(1.7, 0.9, 0.1, BETON_SALE, { x: AX1 + 4.4, y: 3.05, z: AZ2 + 0.2 }, M.beton, { crasse: false });
  panneau(A, R.basrelief, { x: AX1 + 4.4, y: 3.05, z: AZ2 + 0.26 }, 1.6, 0.8);
  lierre(c, AX2 + 0.16, 0, -10, Math.PI / 2, 2.5, 3, Math.round(24 * usure));
}

// ---------- La station de pompage (brique, 1903) ----------

function station(k) {
  const { b, c, S, M, usure } = k;
  const ep = 0.45;
  const interieur = { couleur: 0xd6cdb6, mat: M.brique };
  const brique = { ep, couleur: BRIQUE, mat: M.brique, interieur };
  const fen = (u, l = 1.5, bas = 1.6, haut = 4.4) => ({ u, l, bas, haut, type: "fenetre", croisillons: 2, traverses: 4, bris: k.bris, appui: true, cadre: 0x3e4a48, matCadre: M.tole, couleurAppui: PIERRE });
  // Façade sud : quatre baies cintrées et la grande porte
  const sud = [fen(2.5), fen(4.9), { u: 7.5, l: 2.6, bas: 0, haut: 3.6, type: "porte" }, fen(10.1), fen(12.5)];
  murCoupe(b, S, [SX1, SZ2], [SX2, SZ2], { ...brique, h: HS, ouvertures: sud, breches: usure > 0.6 ? [{ u: 13.6, l: 2.4, profondeur: 1.2 * usure }] : [] });
  for (const o of sud) cintre(S, [SX1, SZ2], [SX2, SZ2], ep, o.u, o.haut, o.l, M);
  // La grande porte : un vantail ouvert, l'autre tombé dans la cour
  c.repere({ x: SX1 + 7.5 - 1.25, y: 0, z: SZ2 + ep / 2, ry: 1.7 }, () => c.boite(1.25, 3.5, 0.08, 0x4f6a5a, { x: 0.62, y: 1.75 }, M.mat, { nuance: 0.05 }));
  c.boite(1.25, 0.08, 3.5, 0x4f6a5a, { x: SX1 + 8.3, y: 0.06, z: SZ2 + 2.2, ry: 0.15 }, M.mat, { nuance: 0.05 });
  // Façade est (pignon) : grande baie cintrée, porte de service ; le pignon et son oculus
  const est = [{ u: 2, l: 1.15, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", angle: 1.1, couleurPorte: 0x4f6a5a }, fen(6, 2.4, 1.5, 4.6)];
  murCoupe(b, S, [SX2, SZ2], [SX2, SZ1], { ...brique, h: HS, ouvertures: est });
  cintre(S, [SX2, SZ2], [SX2, SZ1], ep, 6, 4.6, 2.4, M);
  // Façades nord et ouest : entières, dans le chantier visible
  const nord = [fen(3), fen(7.5), fen(12)];
  mur(c, [SX2, SZ1], [SX1, SZ1], { ...brique, h: HS, batiment: b, ouvertures: nord });
  for (const o of nord) cintre(c, [SX2, SZ1], [SX1, SZ1], ep, o.u, o.haut, o.l, M);
  const ouest = [fen(3.5, 1.5), { u: 9, l: 1.1, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", angle: 1.3, couleurPorte: 0x4f6a5a }];
  mur(c, [SX1, SZ1], [SX1, SZ2], { ...brique, h: HS, batiment: b, ouvertures: ouest });
  cintre(c, [SX1, SZ1], [SX1, SZ2], ep, 3.5, 4.4, 1.5, M);

  // Soubassement de pierre, chaînages d'angle, bandeau de briques claires, corniche
  const ext = ep / 2;
  c.pave(SX1 - ext - 0.08, 0, SZ2 + ext - 0.02, SX1 + 6.2, 0.6, SZ2 + ext + 0.08, PIERRE, M.mat, { nuance: 0.02 });
  c.pave(SX1 + 8.8, 0, SZ2 + ext - 0.02, SX2 + ext + 0.08, 0.6, SZ2 + ext + 0.08, PIERRE, M.mat, { nuance: 0.02 });
  c.pave(SX2 + ext - 0.02, 0, SZ1 - ext - 0.08, SX2 + ext + 0.08, 0.6, SZ2 - 2.6, PIERRE, M.mat, { nuance: 0.02 });
  c.pave(SX2 + ext - 0.02, 0, SZ2 - 1.4, SX2 + ext + 0.08, 0.6, SZ2 + ext + 0.08, PIERRE, M.mat, { nuance: 0.02 });
  c.pave(SX1 - ext - 0.08, 0, SZ1 - ext - 0.08, SX2 + ext + 0.08, 0.6, SZ1 - ext + 0.02, PIERRE, M.mat, { nuance: 0.02 });
  for (const [x, z] of [[SX1, SZ2], [SX2, SZ2], [SX2, SZ1], [SX1, SZ1]]) {
    for (let y = 0.6; y < HS - 0.4; y += 0.7) {
      const ch = (x === SX1 && z === SZ1) || y < CUT ? c : (x === SX2 || z === SZ2) ? S : c;
      ch.boite(0.75, 0.32, 0.75, PIERRE, { x: x + (x === SX1 ? -0.08 : 0.08), y: y + 0.16, z: z + (z === SZ1 ? -0.08 : 0.08) }, M.mat, { nuance: 0.03, crasse: false });
    }
  }
  // Lésènes entre les baies (façade sud), bandeau clair, corniche de pierre
  for (const u of [1.25, 3.7, 6.0, 9.0, 11.3, 13.75]) {
    c.pave(SX1 + u - 0.22, 0.6, SZ2 + ext - 0.02, SX1 + u + 0.22, CUT, SZ2 + ext + 0.12, BRIQUE, M.brique, { nuance: 0.03 });
    S.pave(SX1 + u - 0.22, CUT, SZ2 + ext - 0.02, SX1 + u + 0.22, HS - 0.3, SZ2 + ext + 0.12, BRIQUE, M.brique, { nuance: 0.03, crasse: false });
  }
  S.pave(SX1 - ext, 5.4, SZ2 + ext - 0.02, SX2 + ext, 5.6, SZ2 + ext + 0.06, BRIQUE_CLAIRE, M.brique, { crasse: false });
  S.pave(SX2 + ext - 0.02, 5.4, SZ1 - ext, SX2 + ext + 0.06, 5.6, SZ2 + ext, BRIQUE_CLAIRE, M.brique, { crasse: false });
  c.pave(SX1 - ext, 5.4, SZ1 - ext - 0.06, SX2 + ext, 5.6, SZ1 - ext + 0.02, BRIQUE_CLAIRE, M.brique, { crasse: false });
  S.pave(SX1 - ext - 0.2, HS - 0.3, SZ2 + ext - 0.1, SX2 + ext + 0.2, HS, SZ2 + ext + 0.25, PIERRE, M.mat, { crasse: false });
  c.pave(SX1 - ext - 0.2, HS - 0.3, SZ1 - ext - 0.25, SX2 + ext + 0.2, HS, SZ1 - ext + 0.1, PIERRE, M.mat, { crasse: false });

  // Les pignons de brique (est vers la caméra, ouest), l'oculus et le cartouche « Usine élévatoire 1903 »
  const hf = 3.2;
  for (const x of [SX1, SX2]) {
    const s = new THREE.Shape();
    const p = SZ2 - SZ1 + ep;
    s.moveTo(-p / 2, 0);
    s.lineTo(p / 2, 0);
    s.lineTo(0, hf);
    s.lineTo(-p / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false });
    S.poser(g, M.brique, BRIQUE, { x: x - ep / 2, y: HS, z: (SZ1 + SZ2) / 2, ry: Math.PI / 2 }, { crasse: false, nuance: 0.02 });
    g.dispose();
  }
  const zc = (SZ1 + SZ2) / 2;
  const disque = new THREE.CircleGeometry(0.5, 10);
  S.poser(disque, M.verre, 0x2a3236, { x: SX2 + ep / 2 + 0.02, y: HS + 1.85, z: zc, ry: Math.PI / 2 }, { crasse: false });
  disque.dispose();
  S.poser(tore(0.6, 0.13, 12), M.mat, PIERRE, { x: SX2 + ep / 2 + 0.04, y: HS + 1.85, z: zc, ry: Math.PI / 2 }, { crasse: false });
  S.boite(0.1, 0.8, 2.8, PIERRE, { x: SX2 + ep / 2 + 0.05, y: HS + 0.55, z: zc }, M.mat, { crasse: false });
  panneau(S, R.usine, { x: SX2 + ep / 2 + 0.11, y: HS + 0.55, z: zc, ry: Math.PI / 2 }, 2.6, 0.7);
  // Le toit de tuiles mécaniques, percé, et son épi de faîtage
  const trous = usure > 0.35 ? [{ u: 1.5, v: 1, l: 3.2, p: 0.55 }, { u: -4, v: -1, l: 2, p: 0.4 }] : [];
  toitDeuxPans(S, (SX1 + SX2) / 2, zc, SX2 - SX1 + ep, SZ2 - SZ1 + ep, HS, hf, { couleur: TUILE, mat: M.tuile, trous, debord: 0.45, charpente: BOIS });
  // Le lanterneau de ventilation sur le faîtage
  S.pave(13, HS + hf - 0.2, zc - 0.8, 18, HS + hf + 0.7, zc + 0.8, 0x6a5040, M.mat, { crasse: false });
  for (let x = 13.3; x < 18; x += 0.5) S.boite(0.06, 0.7, 1.7, 0x4a3a30, { x, y: HS + hf + 0.3, z: zc }, M.mat, { crasse: false });
  toitDeuxPans(S, 15.5, zc, 5.4, 2.0, HS + hf + 0.7, 0.6, { couleur: TUILE, mat: M.tuile, debord: 0.2 });
  // Le pont roulant : chemins de roulement sur corbeaux, poutre jaune, palan, chaîne et crochet
  for (const z of [SZ2 - 0.6, SZ1 + 0.6]) {
    S.pave(SX1 + 0.3, 5.0, z - 0.12, SX2 - 0.3, 5.25, z + 0.12, FONTE, M.tole, { crasse: false });
    for (let x = SX1 + 1.5; x < SX2; x += 3) S.pave(x - 0.2, 4.6, z - 0.2, x + 0.2, 5.0, z + 0.2, BRIQUE_CLAIRE, M.brique, { crasse: false });
  }
  const xP = 14.4;
  S.pave(xP - 0.25, 5.25, SZ1 + 0.4, xP + 0.25, 5.85, SZ2 - 0.4, JAUNE, M.tole, { crasse: false });
  for (const z of [SZ1 + 0.6, SZ2 - 0.6]) S.pave(xP - 0.6, 5.25, z - 0.25, xP + 0.6, 5.6, z + 0.25, JAUNE, M.tole, { crasse: false });
  S.pave(xP - 0.35, 4.85, -14.3, xP + 0.35, 5.25, -13.6, 0x4a4a46, M.tole, { crasse: false });
  for (let y = 4.85; y > 2.1; y -= 0.16) S.boite(0.05, 0.14, 0.03, 0x5a5a56, { x: xP, y: y - 0.07, z: -13.95, ry: (y * 7) % 2 > 1 ? Math.PI / 2 : 0 }, M.tole, { crasse: false });
  S.poser(tore(0.16, 0.04, 8, Math.PI * 1.4), M.tole, 0x5a5a56, { x: xP, y: 1.95, z: -13.95, rz: Math.PI * 0.8 }, { crasse: false });

  // La cheminée de brique de l'ancienne machine à vapeur, derrière
  const xc = 21.3;
  const zch = -20.6;
  c.pave(xc - 0.9, 0, zch - 0.9, xc + 0.9, 1.0, zch + 0.9, PIERRE, M.mat, { nuance: 0.02 });
  const fut = geoTronc(1.6, 14, 1.6, 1.1, 1.1);
  c.poser(fut, M.brique, BRIQUE, { x: xc, y: 1.0, z: zch }, { nuance: 0.02 });
  fut.dispose();
  c.pave(xc - 0.75, 14.6, zch - 0.75, xc + 0.75, 15.2, zch + 0.75, BRIQUE_CLAIRE, M.brique, { crasse: false });
  c.pave(xc - 0.6, 15.2, zch - 0.6, xc + 0.6, 15.4, zch + 0.6, 0x3a332e, M.mat, { crasse: false });
  for (const y of [5, 9, 12.5]) c.pave(xc - 0.82 + y * 0.012, y, zch - 0.82 + y * 0.012, xc + 0.82 - y * 0.012, y + 0.12, zch + 0.82 - y * 0.012, 0x3c3c3a, M.tole, { crasse: false });
  arbuste(c, xc + 0.1, zch - 0.1, 0.6, 15.3, [PALETTE.feuillage, PALETTE.feuillageSombre]);
  b.obstacle(xc - 0.9, zch + 0.9, xc + 0.9, zch + 0.9, "cheminée");

  // Le pont-tuyau qui porte la conduite de refoulement vers la salle des vannes
  tuyau(c, M, [[SX1 + 0.6, 2.8, -15], [SX1 + 0.6, 2.8, AZ1 + 0.55], [AX2 + 0.2, 2.8, AZ1 + 0.55]], 0.22, BLEU);
  for (const x of [3.6, 6.4]) {
    c.poutre([x - 0.3, 0, AZ1 + 0.55], [x - 0.05, 2.55, AZ1 + 0.55], 0.12, 0x4a4f4c, M.tole);
    c.poutre([x + 0.3, 0, AZ1 + 0.55], [x + 0.05, 2.55, AZ1 + 0.55], 0.12, 0x4a4f4c, M.tole);
    c.pave(x - 0.4, 2.5, AZ1 + 0.3, x + 0.4, 2.58, AZ1 + 0.8, 0x4a4f4c, M.tole, { crasse: false });
  }
  // Lierre, mousse sur la brique, descentes d'eau
  lierre(c, SX2 + 0.3, 0, -16.5, Math.PI / 2, 3.5, 4.5, Math.round(42 * usure));
  lierre(c, SX1 + 13.5, 0, SZ2 + 0.3, 0, 2.5, 3.5, Math.round(24 * usure));
  lierre(c, SX1 + 3, 0, SZ1 - 0.3, Math.PI, 4, 5, Math.round(24 * usure));
  for (const x of [SX1 + 0.6, SX2 - 0.6]) {
    S.tube([x, CUT, SZ2 + 0.38], [x, HS - 0.1, SZ2 + 0.38], 0.06, 0x7f8689, M.tole, 6);
    c.tube([x, 0.15, SZ2 + 0.38], [x, CUT, SZ2 + 0.38], 0.06, 0x7f8689, M.tole, 6);
  }
  touffes(c, Array.from({ length: Math.round(24 * usure) }, () => [c.entre(SX1, SX2), SZ2 + c.entre(0.35, 0.7), 0.02]), HERBE_HAUTE);
}

// ---------- La salle des pompes (intérieur de la station) ----------

function groupe(k, x, z, ouvert) {
  const { b, c, M } = k;
  // Le massif de béton
  c.pave(x - 2.0, 0, z - 0.75, x + 1.7, 0.35, z + 0.75, BETON_SALE, M.beton, { nuance: 0.02 });
  b.obstacle(x - 2.0, z - 0.75, x + 1.7, z - 0.75, "pompe");
  b.obstacle(x - 2.0, z + 0.75, x + 1.7, z + 0.75, "pompe");
  b.obstacle(x - 2.0, z - 0.75, x - 2.0, z + 0.75, "pompe");
  b.obstacle(x + 1.7, z - 0.75, x + 1.7, z + 0.75, "pompe");
  const y = 0.98;
  // Le moteur électrique : carcasse à ailettes, flasques, boîte à bornes, pattes
  if (ouvert) {
    // capot déposé : le bobinage de cuivre à nu, le rotor sorti
    c.tube([x - 1.75, y, z], [x - 0.3, y, z], 0.42, 0xb87333, M.metal, 10);
    for (const s of [-1.75, -0.3]) c.tube([x + s - 0.06, y, z], [x + s + 0.06, y, z], 0.58, VERT_MOTEUR, M.satin, 12);
    c.boite(1.4, 0.06, 1.1, VERT_MOTEUR, { x: x - 1.0, y: 0.06, z: z + 1.5, ry: 0.2, rz: 0.08 }, M.satin);
    c.tube([x - 1.9, 0.5, z + 1.3], [x - 0.6, 0.5, z + 1.6], 0.2, 0x8a8a84, M.metal, 8);
  } else {
    c.tube([x - 1.75, y, z], [x - 0.3, y, z], 0.55, VERT_MOTEUR, M.satin, 12);
    for (let t = -1.6; t < -0.35; t += 0.18) c.tube([x + t - 0.02, y, z], [x + t + 0.02, y, z], 0.6, VERT_MOTEUR, M.satin, 12);
  }
  c.boite(0.35, 0.3, 0.3, VERT_MOTEUR, { x: x - 1.0, y: y + 0.66, z }, M.satin);
  for (const s of [-1.6, -0.45]) c.boite(0.2, 0.45, 1.1, VERT_MOTEUR, { x: x + s, y: 0.55, z }, M.satin);
  // L'accouplement, la volute de la pompe, l'aspiration qui plonge dans le sol, le refoulement qui monte
  c.tube([x - 0.3, y, z], [x + 0.1, y, z], 0.18, 0x6a6a64, M.metal, 8);
  c.tube([x + 0.1, y, z], [x + 0.65, y, z], 0.62, BLEU, M.tole, 14);
  c.boite(0.5, 0.6, 0.9, BLEU, { x: x + 0.38, y: 0.65, z }, M.tole);
  tuyau(c, M, [[x + 0.65, y, z], [x + 1.4, y, z], [x + 1.4, 0.02, z]], 0.24, BLEU);
  tuyau(c, M, [[x + 0.38, y + 0.6, z], [x + 0.38, 2.8, z], [x + 0.38, 2.8, SZ1 + 1.4]], 0.22, BLEU);
  vanne(c, M, x + 0.38, 2.0, z, 0.16, "z", BLEU, 0.25);
  // Plaque du constructeur, manomètre
  c.boite(0.3, 0.18, 0.02, PALETTE.laiton, { x: x - 1.0, y: y + 0.2, z: z + 0.56 }, M.metal, { crasse: false });
  cyl(c, M.metal, 0xd8d0b8, x + 0.38, 1.85, z + 0.25, 0.1, 0.1, 0.05, 10, { rx: Math.PI / 2 }, { crasse: false });
}

function salleDesPompes(k) {
  const { b, c, M, usure } = k;
  // Le sol carrelé de grès ocre, la rigole d'écoulement
  c.pave(SX1 + 0.2, 0, SZ1 + 0.2, SX2 - 0.2, 0.04, SZ2 - 0.2, 0xdccbaa, M.carrelage, { crasse: false, nuance: 0 });
  c.pave(SX1 + 0.4, 0.04, -16.2, SX2 - 0.6, 0.045, -15.9, 0x5a5650, M.mat, { crasse: false, nuance: 0 });
  // Les deux groupes moto-pompes
  groupe(k, 12.2, -13.9, false);
  groupe(k, 18.0, -13.9, usure > 0.45);
  // Le collecteur de refoulement, le long du mur nord, qui ressort vers le pont-tuyau
  tuyau(c, M, [[19.0, 2.8, SZ1 + 1.4], [SX1 + 0.6, 2.8, SZ1 + 1.4], [SX1 + 0.6, 2.8, -15]], 0.3, BLEU);
  for (const x of [10, 15, 20]) c.poutre([x, 2.5, SZ1 + 1.4], [x, 2.5, SZ1 + 0.25], 0.1, FONTE, M.tole);
  // Le tableau électrique de marbre : interrupteurs à couteaux, cadrans, l'autocollant de Watty
  const zt = SZ1 + ep2();
  c.pave(17.6, 0.2, zt, 22.2, 2.6, zt + 0.08, 0xd9d4c8, M.lisse, { nuance: 0.02 });
  c.pave(17.5, 0.0, zt, 22.3, 0.2, zt + 0.5, 0x3a3836, M.tole);
  for (let i = 0; i < 6; i++) {
    const x = 18.0 + i * 0.75;
    cyl(c, M.metal, 0xe8e2d0, x, 2.05, zt + 0.1, 0.17, 0.17, 0.05, 10, { rx: Math.PI / 2 }, { crasse: false });
    c.boite(0.02, 0.12, 0.01, 0x2a2a2a, { x: x + 0.03, y: 2.08, z: zt + 0.13, rz: 0.4 + i * 0.3 }, M.mat, { crasse: false });
    c.boite(0.22, 0.3, 0.06, 0x2a2a2a, { x, y: 1.35, z: zt + 0.11 }, M.tole, { crasse: false });
    const ouvert = c.hasard() < 0.5;
    c.boite(0.04, 0.32, 0.04, 0xb87333, { x: x + 0.05, y: 1.35 + (ouvert ? 0.1 : 0), z: zt + 0.2 + (ouvert ? 0.12 : 0), rx: ouvert ? -0.9 : 0 }, M.metal, { crasse: false });
  }
  panneau(c, R.watty, { x: 21.6, y: 0.75, z: zt + 0.1 }, 0.4, 0.4);
  for (let i = 0; i < 5; i++) c.tube([18 + i * 0.9, 2.6, zt + 0.05], [18.2 + i * 0.9, HS - 0.5, zt + 0.05], 0.03, 0x2a2a2a, M.mat, 4);
  c.tube([19.5, 0.2, zt + 0.1], [19.2, 0.05, zt + 1.2], 0.03, 0x2a2a2a, M.mat, 4);
  c.tube([19.2, 0.05, zt + 1.2], [20.5, 0.05, zt + 1.6], 0.03, 0x2a2a2a, M.mat, 4);
  // Le volant de l'ancienne machine à vapeur (1903), gardé comme une relique, dans sa fosse
  c.pave(SX1 + 0.6, 0, -18.4, SX1 + 2.0, 0.3, -15.6, BETON_SALE, M.beton, { nuance: 0.02 });
  c.repere({ x: SX1 + 1.3, y: 1.55, z: -17.0, ry: Math.PI / 2 }, () => {
    c.poser(tore(1.35, 0.13, 16), M.tole, 0x2f2e2c, {}, { nuance: 0.03 });
    for (let i = 0; i < 6; i++) c.boite(2.6, 0.12, 0.08, 0x2f2e2c, { rz: (i * Math.PI) / 6 }, M.tole, { crasse: false });
    c.tube([0, 0, -0.5], [0, 0, 0.5], 0.14, 0x55524c, M.metal, 8);
  });
  for (const dz of [-0.6, 0.6]) c.pave(SX1 + 1.1, 0.3, -17.0 + dz - 0.15, SX1 + 1.5, 1.6, -17.0 + dz + 0.15, 0x3a3836, M.tole);
  b.obstacle(SX1 + 2.0, -18.4, SX1 + 2.0, -15.6, "volant");
  // Le camp des survivants : le feu dans un demi-fût, les paillasses, les caisses, le linge qui sèche
  const fx = 15;
  const fz = -10.4;
  cyl(c, M.tole, 0x6e3a22, fx, 0.04, fz, 0.32, 0.3, 0.45, 10);
  for (let i = 0; i < 4; i++) c.boite(0.6, 0.08, 0.08, 0x3a2a1e, { x: fx, y: 0.5, z: fz, ry: (i * Math.PI) / 4 }, M.mat, { crasse: false });
  for (let i = 0; i < 4; i++) {
    const g = new THREE.ConeGeometry(c.entre(0.1, 0.16), c.entre(0.35, 0.6), 4);
    c.poser(g, M.lueur, 0xff9a40, { x: fx + c.entre(-0.12, 0.12), y: 0.75, z: fz + c.entre(-0.12, 0.12) }, { crasse: false, nuance: 0 });
    g.dispose();
  }
  c.pave(fx - 0.4, 0.62, fz - 0.4, fx + 0.4, 0.64, fz + 0.4, 0x3a3a38, M.metal, { crasse: false });
  cyl(c, M.metal, 0x55524c, fx + 0.1, 0.64, fz, 0.16, 0.14, 0.2, 8);
  for (const [x, z, ry] of [[12.4, -9.4, 0.1], [17.4, -9.2, -0.15], [19.6, -10.6, 1.4]]) {
    c.boite(0.8, 0.12, 1.9, 0x7a7058, { x, y: 0.1, z, ry }, M.mat, { nuance: 0.05 });
    c.boite(0.75, 0.05, 1.0, [0x6a4a4a, 0x4a5a6a, 0x7a6a3a][Math.round(x) % 3], { x: x + 0.05, y: 0.19, z: z + 0.3, ry: ry + 0.1 }, M.mat, { nuance: 0.05 });
  }
  for (const [x, z] of [[10.3, -8.4], [10.9, -8.4], [10.6, -8.9]]) c.boite(0.55, 0.4, 0.4, BOIS_GRIS, { x, y: 0.24 + (z < -8.6 ? 0 : 0), z, ry: c.entre(-0.2, 0.2) }, M.mat, { nuance: 0.06 });
  for (let i = 0; i < 6; i++) cyl(c, M.lisse, 0x9fb4b0, 11 + c.entre(-0.4, 0.6), 0.04, -9.6 + c.entre(-0.3, 0.3), 0.04, 0.04, 0.3, 6, c.hasard() < 0.4 ? { rz: Math.PI / 2 } : {});
  c.tube([12.2, 1.9, -13.2], [18.0, 1.9, -13.2], 0.01, 0x3a3a38, M.mat, 3);
  for (let i = 0; i < 4; i++) c.boite(0.6, 0.7, 0.02, [0x8a8a7a, 0x6a5a4a, 0x9a8a6a, 0x5a6a7a][i], { x: 13.2 + i * 1.3, y: 1.55, z: -13.2, rz: c.entre(-0.05, 0.05) }, M.mat, { crasse: false, nuance: 0.05 });
  // Rais de lumière par les trous du toit, débris, flaques sous les trous
  if (usure > 0.35) {
    raiDeLumiere(c, [17, HS + 1.5, -10.8], [17.4, 0.05, -9.6], 2.2, 0.16);
    flaque(c, M, 17.2, -9.8, 1.0, 0.05);
  }
  debris(c, SX1 + 0.5, SZ1 + 0.5, SX2 - 0.5, SZ2 - 0.5, Math.round(22 * usure), [0xd6cdb6, BRIQUE, 0xc4ae8a], 0.04);
  gravats(c, 21.4, -8.2, 0.9, Math.round(8 + 12 * usure), [BRIQUE, BRIQUE_CLAIRE, PIERRE], 0.04);
  jonchee(c, SX1 + 0.5, -9, SX2 - 0.5, SZ2 - 0.3, Math.round(30 * usure), undefined, 0.05);
}

function ep2() {
  return 0.45 / 2 + 0.02;
}

// ---------- Le local du chlore ----------

function localChlore(k) {
  const { b, c, S, M, usure } = k;
  const ep = 0.3;
  const interieur = { couleur: 0xd6d3c4, mat: M.brique };
  murCoupe(b, S, [KX1, KZ2], [KX2 - ep2(), KZ2], { h: HK, ep, couleur: BRIQUE, mat: M.brique, interieur, ouvertures: [{ u: 1.7, l: 1.1, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", angle: 1.6, couleurPorte: 0x8a7a3a }] });
  mur(c, [KX2 - ep2(), KZ1], [KX1, KZ1], { h: HK, ep, couleur: BRIQUE, mat: M.brique, batiment: b, interieur });
  mur(c, [KX1, KZ1], [KX1, KZ2], { h: HK, ep, couleur: BRIQUE, mat: M.brique, batiment: b, interieur, ouvertures: [{ u: 2, l: 0.8, bas: 1.6, haut: 2.3, type: "fenetre", croisillons: 0, traverses: 1, bris: 0.9, appui: false }] });
  // Le toit en appentis (dans la couche de la station)
  S.repere({ x: (KX1 + KX2) / 2 - 0.1, y: HK + 0.15, z: (KZ1 + KZ2) / 2, rx: -0.08 }, () => S.boite(KX2 - KX1 + 0.4, 0.15, KZ2 - KZ1 + 0.6, 0x7a7d7a, {}, M.tole, { crasse: false }));
  // Le sol, les bouteilles de chlore enchaînées au mur, une tombée ; les masques à gaz ; les sacs d'hypochlorite
  c.pave(KX1 + 0.15, 0, KZ1 + 0.15, KX2 - 0.25, 0.04, KZ2 - 0.15, 0xb5b0a2, M.beton, { crasse: false, nuance: 0 });
  for (let i = 0; i < 4; i++) {
    const x = KX1 + 0.6 + i * 0.62;
    if (i === 2 && usure > 0.4) continue;
    cyl(c, M.tole, 0xb8a046, x, 0.04, KZ1 + 0.5, 0.25, 0.25, 1.35, 10);
    cyl(c, M.tole, 0x4a5654, x, 1.39, KZ1 + 0.5, 0.08, 0.2, 0.18, 8);
  }
  c.pave(KX1 + 0.3, 0.95, KZ1 + 0.18, KX2 - 0.5, 1.0, KZ1 + 0.22, 0x5a5a56, M.metal, { crasse: false });
  if (usure > 0.4) {
    cyl(c, M.tole, 0xb8a046, KX1 + 2.1, 0.0, KZ1 + 1.5, 0.25, 0.25, 1.35, 10, { rz: Math.PI / 2, ry: 0.6, y: 0.29 });
  }
  for (let i = 0; i < 3; i++) {
    c.repere({ x: KX1 + 0.18, y: 1.6, z: KZ1 + 1.6 + i * 0.5, ry: Math.PI / 2 }, () => {
      c.poser(BOULE, M.satin, 0x4a4f48, { e: [0.13, 0.16, 0.08] }, { crasse: false });
      c.tube([0, -0.05, 0.05], [0, -0.25, 0.15], 0.06, 0x3a3a38, M.satin, 6);
      for (const s of [-1, 1]) c.boite(0.07, 0.07, 0.02, 0x9fb4b0, { x: s * 0.06, y: 0.03, z: 0.08 }, M.lisse, { crasse: false });
    });
  }
  for (let i = 0; i < 4; i++) c.boite(0.6, 0.18, 0.4, 0xe0dccd, { x: KX2 - 0.9 + c.entre(-0.1, 0.1), y: 0.13 + i * 0.18, z: KZ2 - 0.8, ry: c.entre(-0.2, 0.2) }, M.mat, { nuance: 0.04 });
  c.boite(0.6, 0.08, 0.4, 0xe0dccd, { x: KX2 - 1.4, y: 0.08, z: KZ2 - 1.6, ry: 0.8 }, M.mat);
  debris(c, KX2 - 2, KZ2 - 2, KX2 - 0.6, KZ2 - 0.6, 10, [0xf0eee6, 0xe8e4d6], 0.04);
  // Le panneau DANGER sur la porte, une coulure jaunâtre
  panneau(c, R.danger, { x: KX1 + 3.0, y: 1.6, z: KZ2 + 0.17 }, 0.5, 0.5);
  panneau(c, R.danger, { x: KX1 + 3.0, y: 1.6, z: KZ2 + 0.16, ry: Math.PI }, 0.5, 0.5);
  c.pave(KX1 + 0.6, 0.6, KZ2 + 0.15, KX1 + 0.8, HK - 0.2, KZ2 + 0.16, 0xb8a85a, M.mat, { crasse: false });
}

// ---------- La maison du fontainier ----------

function maison(k) {
  const { b, c, H, M, usure } = k;
  const ep = 0.4;
  const interieur = { couleur: CREME, mat: M.mat };
  const murs = { ep, couleur: ENDUIT, mat: M.enduit, interieur };
  const fen = (u, l = 1.0) => ({ u, l, bas: CUT, haut: 2.35, type: "fenetre", croisillons: 1, traverses: 3, bris: k.bris, volet: c.hasard() < 0.5 ? "ouvert" : "pendu", couleurVolet: 0x6f8b9a, cadre: 0xe2ddd0 });
  // Façade sud : porte de la cuisine, fenêtres de la cuisine et de la chambre
  const sud = [fen(1.3), { u: 2.95, l: 1.0, bas: 0, haut: 2.2, type: "porte", vantail: "tombe", couleurPorte: 0x6f8b9a }, fen(7.6, 1.2), fen(10.4)];
  murCoupe(b, H, [MX1, MZ2], [MX2, MZ2], { ...murs, h: HM, ouvertures: sud });
  // Façade est : porte d'entrée (bureau), fenêtres du bureau et de la chambre
  const est = [fen(1.6), { u: 6.7, l: 1.05, bas: 0, haut: 2.25, type: "porte", vantail: "entrouvert", angle: 1.3, couleurPorte: 0x6f8b9a }, fen(4.6)];
  murCoupe(b, H, [MX2, MZ2], [MX2, MZ1], { ...murs, h: HM, ouvertures: est });
  // Façades nord et ouest, entières
  mur(c, [MX2, MZ1], [MX1, MZ1], { ...murs, h: HM, batiment: b, ouvertures: [{ ...fen(2.5, 1.2), volet: "ferme" }, { ...fen(9.3), bas: 1.3 }] });
  mur(c, [MX1, MZ1], [MX1, MZ2], { ...murs, h: HM, batiment: b });
  // Les cloisons : soubassement vert d'eau jusqu'à l'allège, enduit crème au-dessus (dans la couche)
  const cloison = (a, bb, porteU) => {
    const { L, dx, dz } = repereMur(a, bb);
    for (const [u1, u2] of [[0.2, porteU - 0.5], [porteU + 0.5, L - 0.2]]) {
      const p1 = [a[0] + (dx * u1) / L, a[1] + (dz * u1) / L];
      const p2 = [a[0] + (dx * u2) / L, a[1] + (dz * u2) / L];
      c.pave(Math.min(p1[0], p2[0]) - (dx ? 0 : 0.08), 0, Math.min(p1[1], p2[1]) - (dz ? 0 : 0.08), Math.max(p1[0], p2[0]) + (dx ? 0 : 0.08), CUT, Math.max(p1[1], p2[1]) + (dz ? 0 : 0.08), VERT_EAU, M.mat, { nuance: 0.02 });
      H.pave(Math.min(p1[0], p2[0]) - (dx ? 0 : 0.08), CUT, Math.min(p1[1], p2[1]) - (dz ? 0 : 0.08), Math.max(p1[0], p2[0]) + (dx ? 0 : 0.08), HM, Math.max(p1[1], p2[1]) + (dz ? 0 : 0.08), CREME, M.mat, { nuance: 0.02, crasse: false });
      b.obstacle(p1[0], p1[1], p2[0], p2[1], "cloison");
    }
    const pm = [a[0] + (dx * porteU) / L, a[1] + (dz * porteU) / L];
    H.pave(pm[0] - (dx ? 0.5 : 0.08), 2.15, pm[1] - (dz ? 0.5 : 0.08), pm[0] + (dx ? 0.5 : 0.08), HM, pm[1] + (dz ? 0.5 : 0.08), CREME, M.mat, { crasse: false });
  };
  cloison([PX, MZ1], [PX, MZ2], 2.0);
  cloison([PX, PZ], [MX2, PZ], 5.5);
  // Le toit de tuiles mécaniques (faîtage est-ouest), un trou au-dessus de la chambre, la cheminée, les pignons
  const hf = 2.6;
  const trous = usure > 0.45 ? [{ u: 3.5, v: 1, l: 2.4, p: 0.5 }] : [];
  toitDeuxPans(H, (MX1 + MX2) / 2, (MZ1 + MZ2) / 2, MX2 - MX1 + ep, MZ2 - MZ1 + ep, HM, hf, { couleur: TUILE, mat: M.tuile, trous, debord: 0.45, charpente: BOIS });
  for (const x of [MX1, MX2]) {
    const s = new THREE.Shape();
    const p = MZ2 - MZ1 + ep;
    s.moveTo(-p / 2, 0);
    s.lineTo(p / 2, 0);
    s.lineTo(0, hf);
    s.lineTo(-p / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false });
    H.poser(g, M.enduit, ENDUIT, { x: x - ep / 2, y: HM, z: (MZ1 + MZ2) / 2, ry: Math.PI / 2 }, { crasse: false, nuance: 0.02 });
    g.dispose();
  }
  H.pave(MX1 + 0.4, HM + 1.4, 6.4, MX1 + 1.3, HM + hf + 1.0, 7.3, BRIQUE, M.mat, { crasse: false });
  H.pave(MX1 + 0.33, HM + hf + 1.0, 6.33, MX1 + 1.37, HM + hf + 1.12, 7.37, BRIQUE_CLAIRE, M.mat, { crasse: false });
  // Chaînages de brique aux angles, encadrements de brique autour des baies, génoise
  for (const [x, z] of [[MX1, MZ2], [MX2, MZ2], [MX2, MZ1]]) {
    for (let y = 0.1; y < HM - 0.2; y += 0.5) {
      const ch = y < CUT - 0.2 ? c : H;
      const l = Math.round(y * 2) % 2 ? 0.6 : 0.4;
      ch.boite(x === MX2 ? 0.06 : l, 0.22, z === MZ2 ? 0.06 : l, BRIQUE, { x: x + (x === MX2 ? 0.22 : 0.2 - l / 2 + 0.02), y: y + 0.11, z: z + (z === MZ2 ? 0.22 : -0.2 + l / 2) }, M.mat, { nuance: 0.04, crasse: false });
      if (x === MX2 && z === MZ2) ch.boite(l, 0.22, 0.06, BRIQUE, { x: x - l / 2 + 0.2, y: y + 0.11, z: z + 0.22 }, M.mat, { nuance: 0.04, crasse: false });
    }
  }
  H.pave(MX1 - 0.25, HM - 0.18, MZ2 + 0.18, MX2 + 0.25, HM, MZ2 + 0.32, BRIQUE, M.mat, { crasse: false });
  H.pave(MX2 + 0.18, HM - 0.18, MZ1 - 0.25, MX2 + 0.32, HM, MZ2 + 0.25, BRIQUE, M.mat, { crasse: false });
  // La marquise de fer et de verre au-dessus de la porte d'entrée (est)
  H.repere({ x: MX2 + 0.65, y: 2.55, z: MZ2 - 6.7, rz: 0.25 }, () => {
    H.boite(1.1, 0.04, 1.6, 0x3e4a48, {}, M.mat, { crasse: false });
    for (const z of [-0.5, 0, 0.5]) if (H.hasard() > usure * 0.6) H.boite(1.0, 0.02, 0.45, 0xb9c8c4, { y: 0.03, z }, M.verre, { crasse: false });
  });
  for (const dz of [-0.75, 0.75]) H.poutre([MX2 + 0.2, 2.2, MZ2 - 6.7 + dz], [MX2 + 1.15, 2.42, MZ2 - 6.7 + dz], 0.04, 0x3e4a48, M.mat);
  // Le compteur intelligent sur la façade est, près de la porte
  c.boite(0.12, 0.4, 0.32, 0xd9d6cc, { x: MX2 + 0.27, y: 1.5, z: MZ2 - 7.8 }, M.satin, { crasse: false });
  panneau(c, R.compteur, { x: MX2 + 0.34, y: 1.5, z: MZ2 - 7.8, ry: Math.PI / 2 }, 0.28, 0.28);
  // Le perron, les seuils, le soupirail ; lierre, glycine morte, herbes
  c.pave(MX2 + 0.2, 0, MZ2 - 7.4, MX2 + 1.2, 0.08, MZ2 - 6.0, 0xb0a894, M.beton);
  lierre(c, MX1 - 0.22, 0, 8, -Math.PI / 2, 5, 3.4, Math.round(42 * usure));
  lierre(c, MX1 + 4, 0, MZ1 - 0.22, Math.PI, 4, 2.8, Math.round(24 * usure));
  lierre(c, MX2 + 0.22, 0, MZ2 - 1.0, Math.PI / 2, 1.6, 1.0, Math.round(12 * usure));
  mousse(H, -21, HM + 1.2, 5, 2, Math.round(4 * usure));
  mousse(H, -16, HM + 0.9, 10.5, 1.6, Math.round(4 * usure));
  touffes(c, Array.from({ length: Math.round(26 * usure) }, () => (c.hasard() < 0.6 ? [c.entre(MX1, MX2), MZ2 + c.entre(0.3, 0.6), 0] : [MX2 + c.entre(0.3, 0.6), c.entre(MZ1, MZ2), 0])), HERBE_HAUTE);
  // Le petit potager redevenu friche et le puits, devant la cuisine
  c.pave(-27, 0, 13.5, -23.8, 0.12, 17.5, 0x6f5a40, M.mat, { crasse: false, nuance: 0.02 });
  herbes(c, -26.8, 13.6, -24, 17.4, Math.round(25 * usure) + 6, 0x8a9a4a, 0.12);
  cyl(c, M.mat, PIERRE, -21.5, 0, 16.5, 0.65, 0.7, 0.8, 10, {}, { nuance: 0.03 });
  cyl(c, M.mat, 0x1e2426, -21.5, 0.8, 16.5, 0.5, 0.5, 0.02, 10, {}, { crasse: false });
  for (const s of [-1, 1]) c.boite(0.08, 1.4, 0.08, 0x3e4a48, { x: -21.5 + s * 0.6, y: 1.4, z: 16.5 }, M.metal);
  c.tube([-22.1, 2.05, 16.5], [-20.9, 2.05, 16.5], 0.04, 0x3e4a48, M.metal, 5);
  b.obstacle(-22.2, 15.8, -20.8, 15.8, "puits");
  b.obstacle(-22.2, 17.2, -20.8, 17.2, "puits");
}

function interieurMaison(k) {
  const { c, M, usure } = k;
  const y = 0.04;
  // Les sols : tomettes dans la cuisine, parquet dans la chambre, carreaux de ciment dans le bureau
  c.pave(MX1 + 0.2, 0, MZ1 + 0.2, PX - 0.08, y, MZ2 - 0.2, 0xb87458, M.carrelage, { crasse: false, nuance: 0 });
  c.pave(PX + 0.08, 0, PZ + 0.08, MX2 - 0.2, y, MZ2 - 0.2, 0x8a6a4a, M.mat, { crasse: false, nuance: 0 });
  for (let x = PX + 0.3; x < MX2 - 0.2; x += 0.36) c.boite(0.02, 0.005, MZ2 - PZ - 0.3, 0x5a4130, { x, y: y + 0.003, z: (PZ + MZ2) / 2 }, M.mat, { crasse: false, nuance: 0 });
  c.pave(PX + 0.08, 0, MZ1 + 0.2, MX2 - 0.2, y, PZ - 0.08, 0xa9a08a, M.carrelage, { crasse: false, nuance: 0 });

  // --- La cuisine ---
  // La cuisinière contre le pignon ouest, son tuyau ; l'évier de grès sous la fenêtre nord
  c.pave(MX1 + 0.25, y, 6.2, MX1 + 0.95, y + 0.85, 7.6, 0x2c2b29, M.tole, { nuance: 0.02 });
  c.pave(MX1 + 0.25, y + 0.85, 6.2, MX1 + 1.0, y + 0.9, 7.6, 0x55524c, M.metal, { crasse: false });
  c.tube([MX1 + 0.5, y + 0.9, 6.9], [MX1 + 0.5, 2.5, 6.9], 0.08, 0x2c2b29, M.tole, 6);
  c.tube([MX1 + 0.5, 2.5, 6.9], [MX1 + 0.85, 2.7, 6.9], 0.08, 0x2c2b29, M.tole, 6);
  cyl(c, M.metal, 0x8a8a84, MX1 + 0.7, y + 0.9, 7.2, 0.12, 0.14, 0.2, 8);
  c.pave(MX1 + 2.0, y, MZ1 + 0.25, MX1 + 3.0, y + 0.85, MZ1 + 0.85, 0xd8d0bc, M.satin);
  c.pave(MX1 + 2.1, y + 0.6, MZ1 + 0.3, MX1 + 2.9, y + 0.86, MZ1 + 0.8, 0xbfb7a2, M.lisse);
  c.tube([MX1 + 2.5, 1.0, MZ1 + 0.25], [MX1 + 2.5, 1.2, MZ1 + 0.55], 0.025, PALETTE.laiton, M.metal, 5);
  // La table, les chaises, le buffet ouvert, les jerricans d'eau
  c.pave(MX1 + 1.4, y + 0.72, 8.2, MX1 + 3.2, y + 0.78, 9.4, BOIS, M.mat);
  for (const [x, z] of [[MX1 + 1.5, 8.3], [MX1 + 3.1, 8.3], [MX1 + 1.5, 9.3], [MX1 + 3.1, 9.3]]) c.pave(x - 0.04, y, z - 0.04, x + 0.04, y + 0.72, z + 0.04, BOIS, M.mat);
  chaise(c, M, MX1 + 2.3, 7.6, 0.3, false);
  chaise(c, M, MX1 + 2.8, 10.2, 2.2, true);
  cyl(c, M.metal, 0x8a8a84, MX1 + 2.0, y + 0.78, 8.7, 0.1, 0.12, 0.18, 8);
  c.pave(MX1 + 0.25, y, 9.6, MX1 + 0.75, y + 1.9, 11.4, 0x6a5a48, M.mat);
  c.boite(0.04, 1.0, 0.85, 0x6a5a48, { x: MX1 + 1.05, y: y + 1.35, z: 9.9, ry: 0.9 }, M.mat);
  for (let i = 0; i < 5; i++) cyl(c, M.lisse, 0xe4ddc8, MX1 + 0.5, y + 1.0, 9.8 + i * 0.3, 0.06, 0.05, 0.12, 6);
  for (let i = 0; i < 3; i++) c.boite(0.35, 0.45, 0.18, [0x4a6a4a, 0x8a3a2e, 0x4a6a4a][i], { x: MX1 + 3.6 + i * 0.4, y: y + 0.23, z: MZ1 + 0.5 }, M.tole, { nuance: 0.05 });
  // --- Le bureau : plans du réseau, dernière facture, lampe à pétrole, outillage de fontainier ---
  const zN = MZ1 + 0.21; // nu intérieur du mur nord
  panneau(c, R.plan, { x: -17.6, y: 1.75, z: zN + 0.01 }, 1.9, 1.25);
  panneau(c, R.facture, { x: -15.2, y: 1.6, z: zN + 0.01 }, 0.5, 0.75);
  c.boite(0.08, 0.08, 0.04, 0xc8362b, { x: -15.2, y: 1.95, z: zN + 0.03 }, M.satin, { crasse: false });
  // le bureau, la chaise, les plans roulés, la lampe
  c.pave(-18.8, y + 0.74, MZ1 + 0.4, -16.6, y + 0.8, MZ1 + 1.3, 0x6a4a32, M.mat);
  c.pave(-18.7, y, MZ1 + 0.45, -18.1, y + 0.74, MZ1 + 1.25, 0x6a4a32, M.mat);
  c.pave(-17.1, y, MZ1 + 0.45, -16.7, y + 0.74, MZ1 + 1.25, 0x6a4a32, M.mat);
  chaise(c, M, -17.6, MZ1 + 1.8, Math.PI + 0.3, false, 0x5a4130);
  for (let i = 0; i < 4; i++) c.tube([-18.6 + i * 0.12, y + 0.86, MZ1 + 0.6 + i * 0.08], [-17.9 + i * 0.1, y + 0.86, MZ1 + 0.75 + i * 0.1], 0.05, 0xd9e0e6, M.mat, 6);
  c.boite(0.6, 0.01, 0.45, 0x8fa8c0, { x: -17.6, y: y + 0.81, z: MZ1 + 0.95, ry: 0.15 }, M.mat, { crasse: false });
  c.repere({ x: -17.15, y: y + 0.8, z: MZ1 + 0.75 }, () => {
    cyl(c, M.metal, PALETTE.laiton, 0, 0, 0, 0.08, 0.1, 0.12, 8);
    cyl(c, M.lueur, 0xffc070, 0, 0.12, 0, 0.06, 0.07, 0.18, 6);
    cyl(c, M.verre, 0xffffff, 0, 0.12, 0, 0.05, 0.08, 0.28, 8);
  });
  // le classeur métallique, un tiroir ouvert, des dossiers par terre
  c.pave(-14.4, y, MZ1 + 0.25, -13.6, y + 1.3, MZ1 + 0.85, 0x6a7a72, M.tole);
  c.pave(-14.35, y + 0.5, MZ1 + 0.85, -13.65, y + 0.8, MZ1 + 1.35, 0x6a7a72, M.tole);
  for (let i = 0; i < 9; i++) c.boite(c.entre(0.2, 0.32), 0.01, c.entre(0.25, 0.32), 0xe8e2d0, { x: c.entre(-16, -14), y: y + 0.01 + i * 0.002, z: c.entre(MZ1 + 1.2, MZ1 + 3), ry: c.hasard() * 3 }, M.mat, { crasse: false, nuance: 0.05 });
  // l'établi du fontainier : coffre, clé à béquille, raccords, tuyau souple enroulé
  c.pave(PX + 0.2, y, MZ1 + 2.6, PX + 0.8, y + 0.8, MZ1 + 4.2, BOIS_GRIS, M.mat);
  c.pave(PX + 0.25, y + 0.8, MZ1 + 2.8, PX + 0.75, y + 1.05, MZ1 + 3.4, 0x9a3a2e, M.tole);
  c.poutre([PX + 0.9, y + 0.05, MZ1 + 2.4], [PX + 1.0, y + 1.45, MZ1 + 2.5], 0.035, 0x5a5a56, M.metal);
  c.boite(0.5, 0.04, 0.04, 0x5a5a56, { x: PX + 1.0, y: y + 1.45, z: MZ1 + 2.5 }, M.metal);
  c.poser(tore(0.3, 0.05, 10), M.satin, 0x2a2a2a, { x: PX + 1.2, y: y + 0.05, z: MZ1 + 4.0, rx: Math.PI / 2 }, { crasse: false });
  for (let i = 0; i < 5; i++) cyl(c, M.metal, PALETTE.laiton, PX + 0.4 + c.entre(-0.1, 0.1), y + 0.8, MZ1 + 3.7 + c.entre(-0.2, 0.2), 0.04, 0.04, 0.1, 6);
  // --- La chambre : lit de fer, armoire ouverte, chaise, tapis ---
  const zl = MZ2 - 0.3;
  c.pave(-16.2, y + 0.4, zl - 2.0, -14.8, y + 0.58, zl, 0xd9cbb0, M.mat, { nuance: 0.04 });
  c.boite(1.3, 0.08, 1.1, 0x6a7a8a, { x: -15.5, y: y + 0.6, z: zl - 0.7, rz: 0.05 }, M.mat, { nuance: 0.05 });
  for (const [x, z, h] of [[-16.2, zl - 2.0, 0.9], [-14.8, zl - 2.0, 0.9], [-16.2, zl, 1.2], [-14.8, zl, 1.2]]) c.tube([x, y, z], [x, y + h, z], 0.025, 0x3e4a48, M.metal, 5);
  for (const [z, h] of [[zl - 2.0, 0.9], [zl, 1.2]]) c.tube([-16.2, y + h, z], [-14.8, y + h, z], 0.025, 0x3e4a48, M.metal, 5);
  c.pave(-19.9, y, MZ2 - 0.8, -18.6, y + 2.0, MZ2 - 0.25, 0x5a4130, M.mat);
  c.boite(0.62, 1.9, 0.04, 0x5a4130, { x: -18.4, y: y + 1.0, z: MZ2 - 1.15, ry: -1.0 }, M.mat);
  for (let i = 0; i < 3; i++) c.boite(0.4, 0.04, 0.3, [0x3a4a6a, 0x3a4a6a, 0x5a4a3a][i], { x: -19.2 + c.entre(-0.4, 0.4), y: y + 0.03 + i * 0.03, z: MZ2 - 1.6 + c.entre(-0.3, 0.3), ry: c.hasard() * 3 }, M.mat, { crasse: false });
  c.boite(0.28, 0.4, 0.12, 0x2a2a28, { x: -19.6, y: y + 0.2, z: MZ2 - 1.4 }, M.satin);
  c.boite(0.28, 0.4, 0.12, 0x2a2a28, { x: -19.25, y: y + 0.08, z: MZ2 - 1.6, rx: Math.PI / 2 }, M.satin);
  chaise(c, M, -17.0, 9.2, 0.8, usure > 0.5);
  c.pave(-18.8, y, 8.6, -16.8, y + 0.01, 10.6, 0x7a3a3a, M.mat, { crasse: false, nuance: 0 });
  // Le temps : feuilles, plâtre tombé du trou du toit, le rai de lumière
  if (usure > 0.45) {
    gravats(c, -16.2, 9.4, 0.9, Math.round(10 * usure), [TUILE, CREME, BOIS], y);
    raiDeLumiere(c, [-16.3, HM + 1.2, 10.0], [-16.4, 0.06, 9.6], 1.6, 0.16);
  }
  jonchee(c, MX1 + 0.4, MZ1 + 0.4, MX2 - 0.4, MZ2 - 0.4, Math.round(50 * usure), undefined, y + 0.005);
  debris(c, MX1 + 0.4, MZ1 + 0.4, MX2 - 0.4, MZ2 - 0.4, Math.round(15 * usure), [CREME, VERT_EAU, ENDUIT], y);
}

// ---------- Le réservoir semi-enterré et son pavillon ----------

function reservoir(k) {
  const { b, c, V, M, usure } = k;
  // Le tertre : un tronc de pyramide herbu
  const tertre = geoTronc(13, 2.8, 9, 9.5, 5.5);
  c.poser(tertre, M.mat, 0x7f8f52, { x: -20.5, y: 0, z: -17.5 }, { crasse: false, nuance: 0.02 });
  tertre.dispose();
  b.obstacle(-27, -13, -27, -22, "tertre");
  b.obstacle(-14, -13, -14, -22, "tertre");
  b.obstacle(-27, -22, -14, -22, "tertre");
  b.obstacle(-27, -13, VX1, -13, "tertre");
  b.obstacle(VX2, -13, -14, -13, "tertre");
  herbes(c, -24, -20, -17, -15, Math.round(18 * usure) + 4, 0x8a9a4a, 2.8);
  arbuste(c, -25, -20, 1.2, 0.4);
  arbuste(c, -16.5, -20.5, 1.0, 0.4);
  // Les cheminées d'aération en champignon
  for (const x of [-23, -18]) {
    cyl(c, M.beton, BETON_SALE, x, 2.7, -18, 0.25, 0.25, 0.9, 8);
    cyl(c, M.beton, BETON, x, 3.6, -18, 0.15, 0.55, 0.3, 8);
  }
  // Le mur de tête Art déco, à gradins
  c.pave(-24.6, 0, -13.3, -16.9, 3.1, -12.9, BETON, M.beton, { nuance: 0.02 });
  c.pave(-23.4, 3.1, -13.3, -18.1, 3.4, -12.9, BETON, M.beton, { nuance: 0.02 });
  c.pave(-22.2, 3.4, -13.3, -19.3, 3.65, -12.9, BETON, M.beton, { nuance: 0.02 });
  for (const x of [-24.6, -16.9]) c.pave(x - 0.2, 0, -13.4, x + 0.2, 3.3, -12.8, BETON_SALE, M.beton, { nuance: 0.02 });
  // Le pavillon d'entrée
  const ep = 0.3;
  const interieur = { couleur: 0xc9c3b4, mat: M.beton };
  murCoupe(b, V, [VX1, VZ2], [VX2, VZ2], { h: HV, ep, couleur: BETON, mat: M.beton, interieur, ouvertures: [{ u: 2.75, l: 1.2, bas: 0, haut: 2.2, type: "porte" }] });
  murCoupe(b, V, [VX2, VZ2], [VX2, VZ1], { h: HV, ep, couleur: BETON, mat: M.beton, interieur, ouvertures: [{ u: 1.75, l: 0.8, bas: 1.4, haut: 2.2, type: "fenetre", croisillons: 0, traverses: 1, bris: 0.8, appui: false, cadre: 0x55524c }] });
  mur(c, [VX1, VZ1], [VX1, VZ2], { h: HV, ep, couleur: BETON, mat: M.beton, batiment: b, interieur });
  V.pave(VX1 - 0.2, HV, VZ1 - 0.1, VX2 + 0.2, HV + 0.25, VZ2 + 0.2, BETON_SALE, M.beton, { crasse: false, nuance: 0 });
  mousse(V, -20.7, HV + 0.25, -11.3, 1.4, Math.round(4 * usure));
  herbes(V, VX1, VZ1, VX2, VZ2, Math.round(8 * usure), HERBE_HAUTE, HV + 0.25);
  // La porte de fer, entrouverte, rouillée ; la plaque « Réservoir n° 2 — accès interdit »
  c.repere({ x: VX1 + 2.75 - 0.6, y: 0, z: VZ2 + ep / 2, ry: 1.25 }, () => {
    c.boite(1.2, 2.15, 0.06, 0x6a4a34, { x: 0.6, y: 1.08 }, M.tole, { nuance: 0.04 });
    for (const yy of [0.5, 1.1, 1.7]) c.boite(1.15, 0.08, 0.04, 0x5a3a28, { x: 0.6, y: yy, z: 0.04 }, M.tole, { crasse: false });
  });
  panneau(c, R.reservoir, { x: VX1 + 1.4, y: 1.5, z: VZ2 + 0.17 }, 0.55, 0.55);
  c.pave(VX1 + 1.9, 0, VZ2 + 0.15, VX1 + 3.6, 0.08, VZ2 + 0.9, BETON_SALE, M.beton);
  // Dedans : la trappe ouverte sur l'eau noire, son garde-corps, l'échelle ; le trépied des survivants, corde et seau
  c.pave(VX1 + 0.15, 0, VZ1 + 0.15, VX2 - 0.15, 0.04, VZ2 - 0.15, 0xb5b0a2, M.beton, { crasse: false, nuance: 0 });
  const hx = -21.5;
  const hz = -11.9;
  c.pave(hx - 0.55, 0.041, hz - 0.45, hx + 0.55, 0.045, hz + 0.45, 0x0e1112, M.mat, { crasse: false, nuance: 0 });
  c.pave(hx - 0.55, 0.0, hz - 0.45, hx + 0.55, 0.1, hz - 0.4, FONTE, M.tole);
  c.boite(1.1, 0.04, 0.9, 0x5a4a3a, { x: hx + 0.95, y: 0.3, z: hz, rz: 1.25 }, M.tole); // le couvercle relevé
  for (const s of [-0.18, 0.18]) c.tube([hx + s, -0.4, hz - 0.4], [hx + s, 1.0, hz - 0.42], 0.025, 0x5a5a56, M.metal, 4);
  for (let yy = 0.0; yy < 1.0; yy += 0.3) c.tube([hx - 0.18, yy, hz - 0.41], [hx + 0.18, yy, hz - 0.41], 0.018, 0x5a5a56, M.metal, 4);
  for (const [x, z] of [[hx - 0.55, hz + 0.45], [hx + 0.55, hz + 0.45], [hx - 0.55, hz - 0.45]]) c.tube([x, 0, z], [x, 1.0, z], 0.025, 0xa33a2a, M.metal, 4);
  c.tube([hx - 0.55, 1.0, hz + 0.45], [hx + 0.55, 1.0, hz + 0.45], 0.025, 0xa33a2a, M.metal, 4);
  c.tube([hx - 0.55, 1.0, hz + 0.45], [hx - 0.55, 1.0, hz - 0.45], 0.025, 0xa33a2a, M.metal, 4);
  for (const a of [0.3, 2.4, 4.4]) c.poutre([hx + Math.cos(a) * 0.9, 0, hz + Math.sin(a) * 0.75], [hx, 2.3, hz], 0.06, BOIS, M.mat);
  c.tube([hx, 2.25, hz], [hx, 0.4, hz], 0.012, 0xc8b88a, M.mat, 3);
  cyl(c, M.tole, 0x8a8a84, hx, 0.15, hz, 0.15, 0.12, 0.25, 8);
  b.obstacle(hx - 0.55, hz + 0.45, hx + 0.55, hz + 0.45, "trappe");
  b.obstacle(hx - 0.55, hz - 0.45, hx - 0.55, hz + 0.45, "trappe");
  b.obstacle(hx + 0.55, hz - 0.45, hx + 0.55, hz + 0.45, "trappe");
  // La vanne murale et sa conduite, des seaux, des bidons remplis
  tuyau(c, M, [[VX2 - 0.4, 0.0, VZ1 + 0.4], [VX2 - 0.4, 0.6, VZ1 + 0.4], [VX2 - 0.4, 0.6, VZ1 - 0.3]], 0.15, 0x6f7f74);
  vanne(c, M, VX2 - 0.4, 0.6, VZ1 + 0.05, 0.13, "z", 0x6f7f74, 0.4);
  for (let i = 0; i < 3; i++) cyl(c, M.tole, [0x8a8a84, 0x7d8a8a, 0x8a5a3a][i], VX1 + 0.5 + i * 0.4, 0.04, VZ2 - 0.6, 0.15, 0.12, 0.28, 8);
  for (let i = 0; i < 2; i++) c.boite(0.35, 0.45, 0.2, 0x3e5a6a, { x: VX2 - 0.5, y: 0.27, z: VZ2 - 0.6 - i * 0.3 }, M.tole, { nuance: 0.05 });
  flaque(c, M, hx + 0.6, hz + 0.9, 0.5, 0.05);
  lierre(c, -24.8, 0, -12.6, 0, 2, 3, Math.round(18 * usure));
  lierre(c, -17, 0, -12.6, 0, 1.6, 3, Math.round(14 * usure));
}

// ---------- La cour : borne premium, panneau, camionnette, tuyaux, réverbère ----------

function cour(k) {
  const { b, c, M, usure } = k;
  // La borne « Eau premium aromatisée », tournée vers le chemin ; son écran luit encore (batterie)
  c.repere({ x: -2.6, y: 0, z: -5.6, ry: Math.PI / 4 }, () => {
    c.pave(-0.55, 0, -0.35, 0.55, 0.12, 0.35, 0x5a5a56, M.beton);
    c.pave(-0.45, 0.12, -0.25, 0.45, 1.95, 0.25, PALETTE.abondanceCreme, M.satin, { nuance: 0.02 });
    c.pave(-0.5, 1.95, -0.32, 0.5, 2.15, 0.32, PALETTE.abondanceCanard, M.satin, { crasse: false });
    panneau(c, R.premium, { y: 0.95, z: 0.26 }, 0.82, 0.82);
    panneau(c, R.ecran, { y: 1.62, z: 0.27 }, 0.62, 0.31, M.ecran);
    for (const x of [-0.25, 0, 0.25]) c.tube([x, 0.55, 0.26], [x, 0.45, 0.36], 0.025, 0xc0c4c4, M.metal, 5);
    c.pave(-0.4, 0.3, 0.25, 0.4, 0.34, 0.42, 0x8a8e8e, M.metal, { crasse: false });
    // gobelets jetables au pied, et un coup de pied dans la porte de maintenance
    for (let i = 0; i < 5; i++) cyl(c, M.satin, i % 2 ? PALETTE.abondanceCanard : 0xe9dfc6, c.entre(-0.8, 0.8), 0.04, c.entre(0.4, 1.0), 0.04, 0.03, 0.1, 6, { rz: Math.PI / 2, ry: c.hasard() * 3, y: 0.08 });
  });
  b.obstacle(-3.2, -5.3, -2.2, -6.2, "borne");
  // Le panneau « Votre eau, pilotée par algorithme », à l'entrée, barré d'une croix à la bombe
  c.repere({ x: 3.4, y: 0, z: 20.6, ry: -0.25 }, () => {
    for (const x of [-1.1, 1.1]) c.boite(0.1, 2.6, 0.1, 0x8d969a, { x, y: 1.3 }, M.metal);
    c.boite(2.5, 1.3, 0.05, 0xe0e0d8, { y: 1.95 }, M.satin, { crasse: false });
    panneau(c, R.algo, { y: 1.95, z: 0.03 }, 2.4, 1.2);
  });
  // La camionnette de la Régie des eaux, pneus à plat, portes ouvertes
  c.repere({ x: -7.6, y: -0.05, z: 1.6, ry: 0.35 }, () => {
    const blanc = 0xd8d4c6;
    c.pave(-2.4, 0.45, -0.95, 0.9, 2.3, 0.95, blanc, M.satin, { nuance: 0.02 });
    c.pave(0.9, 0.45, -0.95, 2.3, 1.5, 0.95, blanc, M.satin, { nuance: 0.02 });
    c.repere({ x: 1.3, y: 1.5, z: 0 }, () => c.boite(0.9, 0.9, 1.88, blanc, { x: -0.05, y: 0.35, rz: 0.35 }, M.satin));
    c.boite(0.04, 0.6, 1.7, 0x2a3236, { x: 1.82, y: 1.85, rz: 0.35 }, M.lisse, { crasse: false });
    for (const s of [-1, 1]) c.boite(0.9, 0.5, 0.04, 0x2a3236, { x: 1.2, y: 1.95, z: s * 0.96 }, M.lisse, { crasse: false });
    for (const s of [-1, 1]) panneau(c, R.regie, { x: -0.8, y: 1.5, z: s * 0.97, ry: s > 0 ? 0 : Math.PI }, 2.0, 0.9);
    c.boite(0.04, 1.8, 0.9, blanc, { x: -2.85, y: 1.35, z: 1.3, ry: -1.2 }, M.satin); // porte arrière ouverte
    c.pave(2.3, 0.5, -0.9, 2.4, 0.8, 0.9, 0x5a5a56, M.metal, { crasse: false });
    for (const [x, z] of [[-1.6, -0.95], [-1.6, 0.95], [1.6, -0.95], [1.6, 0.95]]) {
      c.poser(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 10).rotateX(Math.PI / 2), M.mat, 0x1e1e1e, { x, y: 0.33, z }, { crasse: false });
      c.boite(0.6, 0.18, 0.27, 0x1e1e1e, { x, y: 0.1, z }, M.mat, { crasse: false });
    }
    for (let i = 0; i < 8; i++) c.boite(c.entre(0.1, 0.4), 0.01, c.entre(0.1, 0.3), i % 2 ? PALETTE.rouille : 0xbfb9a8, { x: c.entre(-2.3, 0.8), y: 2.31, z: c.entre(-0.9, 0.9) }, M.mat, { crasse: false });
  });
  b.obstacle(-9.8, 0.0, -6.0, 1.3, "camionnette");
  b.obstacle(-10.3, 1.8, -6.4, 3.2, "camionnette");
  arbuste(c, -9.4, 0.4, 0.9, 0, [0x4f6a3a, 0x5d7a40, 0x3f5a32]);
  // La pile de tuyaux en fonte, calée par des cales de bois
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 4 - r; i++) {
      const z = -3.9 + i * 0.62 + r * 0.31;
      const y = 0.32 + r * 0.54;
      c.tube([2.6, y, z], [6.4, y, z], 0.3, [FONTE, 0x4a3a30, 0x55524c][(i + r) % 3], M.tole, 8);
      c.tube([2.55, y, z], [2.75, y, z], 0.37, FONTE, M.tole, 8);
    }
  }
  for (const x of [3.2, 5.8]) c.pave(x - 0.15, 0, -4.3, x + 0.15, 0.1, -1.5, BOIS_GRIS, M.mat);
  b.obstacle(2.4, -4.3, 6.6, -4.3, "tuyaux");
  b.obstacle(2.4, -1.6, 6.6, -1.6, "tuyaux");
  // Des tampons de regard, une bouche d'incendie, un réverbère tombé
  for (const [x, z] of [[-1.2, 2.5], [8.5, -2], [-10.5, -6.5]]) cyl(c, M.tole, FONTE, x, 0.0, z, 0.35, 0.35, 0.04, 10);
  cyl(c, M.tole, 0x8a3a2e, 22.5, 0, 3, 0.15, 0.17, 0.8, 8);
  cyl(c, M.tole, 0x8a3a2e, 22.5, 0.8, 3, 0.05, 0.18, 0.15, 8);
  c.tube([-12.2, 0.12, -1.5], [-8.6, 0.9, 0.6], 0.07, 0x4a5654, M.metal, 6);
  c.boite(0.6, 0.25, 0.3, 0x4a5654, { x: -12.3, y: 0.15, z: -1.6, ry: 0.5 }, M.metal);
  // Une palette de packs d'« eau premium » vides, film plastique déchiré
  c.pave(19.5, 0, -4.8, 20.7, 0.14, -3.6, BOIS_GRIS, M.mat);
  for (let i = 0; i < 5; i++) c.boite(0.5, 0.3, 0.35, i % 2 ? PALETTE.abondanceCanard : 0xd9dcd8, { x: 19.8 + (i % 2) * 0.55, y: 0.3 + Math.floor(i / 2) * 0.3, z: -4.4 + (i % 3) * 0.3, ry: c.entre(-0.3, 0.3) }, M.satin, { nuance: 0.05 });
}

// ---------- La clôture du sud et le portail ----------

function cloture(k) {
  const { b, c, M, usure } = k;
  const z = 21.8;
  // Les piliers de brique du portail, et ses vantaux (un tombé)
  for (const x of [-4.8, 0.8]) {
    c.pave(x - 0.3, 0, z - 0.3, x + 0.3, 2.2, z + 0.3, BRIQUE, M.brique, { nuance: 0.02 });
    c.pave(x - 0.36, 2.2, z - 0.36, x + 0.36, 2.35, z + 0.36, PIERRE, M.mat, { crasse: false });
    cyl(c, M.mat, PIERRE, x, 2.35, z, 0.15, 0.22, 0.25, 6);
  }
  c.repere({ x: 0.5, y: 0.05, z, ry: -1.9 }, () => {
    c.pave(0, 0, -0.03, 2.6, 0.06, 0.03, 0x3e4a48, M.metal);
    c.pave(0, 1.6, -0.03, 2.6, 1.66, 0.03, 0x3e4a48, M.metal);
    for (let x = 0.1; x < 2.6; x += 0.2) c.boite(0.03, 1.6, 0.03, 0x3e4a48, { x, y: 0.82 }, M.metal, { crasse: false });
  });
  c.repere({ x: -3.2, y: 0.08, z: z - 1.7, rx: -Math.PI / 2, ry: 0.25 }, () => {
    c.pave(-1.3, 0, -0.03, 1.3, 0.06, 0.03, 0x3e4a48, M.metal);
    c.pave(-1.3, 1.6, -0.03, 1.3, 1.66, 0.03, 0x3e4a48, M.metal);
    for (let x = -1.2; x < 1.3; x += 0.2) c.boite(0.03, 1.6, 0.03, 0x3e4a48, { x, y: 0.82 }, M.metal, { crasse: false });
  });
  // Le muret et le grillage, par travées ; certaines couchées
  for (const [x1, x2] of [[-27.6, -5.1], [1.1, 27.6]]) {
    c.pave(x1, 0, z - 0.12, x2, 0.45, z + 0.12, BETON_SALE, M.beton, { nuance: 0.02 });
    b.obstacle(x1, z, x2, z, "clôture");
    const n = Math.round((x2 - x1) / 2.5);
    const pas = (x2 - x1) / n;
    for (let i = 0; i < n; i++) {
      const xa = x1 + i * pas;
      const couche = c.hasard() < usure * 0.25;
      c.boite(0.08, 1.6, 0.08, 0x5a6462, { x: xa, y: 0.45 + 0.8, z }, M.metal, { crasse: false });
      if (couche) panneau(c, R.grillage, { x: xa + pas / 2, y: 0.5, z: z - 0.6, rx: -1.1 }, pas, 1.2);
      else panneau(c, R.grillage, { x: xa + pas / 2, y: 1.05, z }, pas, 1.2);
    }
  }
  lierre(c, -12, 0, z + 0.15, 0, 4, 1.6, Math.round(18 * usure));
  lierre(c, 15, 0, z + 0.15, 0, 4, 1.6, Math.round(15 * usure));
}

// ---------- Les textures ----------

function dessinerTuile(g) {
  const a = aleatoire(77);
  g.fillStyle = "#b9aa98";
  g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 8; r++) {
    const dec = r % 2 ? 8 : 0;
    for (let x = -16; x < 144; x += 16) {
      const v = 210 + Math.floor((a() - 0.5) * 50);
      const d = g.createLinearGradient(x + dec, 0, x + dec + 16, 0);
      d.addColorStop(0, `rgb(${v},${v - 6},${v - 12})`);
      d.addColorStop(1, `rgb(${v - 40},${v - 46},${v - 52})`);
      g.fillStyle = d;
      g.fillRect(x + dec + 1, r * 16 + 1, 14, 15);
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.fillRect(x + dec + 7, r * 16 + 2, 2, 13);
    }
  }
  taches(g, a, 8, "rgba(80, 110, 60, 0.35)", 6, 20, 128, 128);
  taches(g, a, 5, "rgba(40, 36, 30, 0.25)", 8, 24, 128, 128);
}

function texte(g, t, x, y, taille, couleur, police = "900", align = "center", rotation = 0, famille = '"Arial Black", "Helvetica Neue", Arial, sans-serif') {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.font = `${police} ${taille}px ${famille}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, 0, 0);
  g.restore();
}

function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < (l * h) / 260; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.05 * force})` : `rgba(255,255,255,${0.05 * force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 6 * force; i++) {
    const cx = x + a() * l;
    const lg = h * (0.3 + a() * 0.8);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(60,52,40,${0.2 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  g.restore();
}

/** La goutte « AquaSmart » qui sourit (mascotte du service des eaux connecté). */
function goutte(g, cx, cy, s, couleur = "#2f6f73") {
  g.save();
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(cx, cy - s);
  g.bezierCurveTo(cx + s * 0.9, cy - s * 0.1, cx + s * 0.7, cy + s * 0.75, cx, cy + s * 0.75);
  g.bezierCurveTo(cx - s * 0.7, cy + s * 0.75, cx - s * 0.9, cy - s * 0.1, cx, cy - s);
  g.fill();
  g.fillStyle = "#f3eee0";
  g.beginPath();
  g.arc(cx - s * 0.2, cy + s * 0.05, s * 0.09, 0, 7);
  g.arc(cx + s * 0.2, cy + s * 0.05, s * 0.09, 0, 7);
  g.fill();
  g.strokeStyle = "#f3eee0";
  g.lineWidth = Math.max(2, s * 0.08);
  g.beginPath();
  g.arc(cx, cy + s * 0.25, s * 0.25, 0.2, Math.PI - 0.2);
  g.stroke();
  g.restore();
}

function dessinerAtlas(g) {
  const a = aleatoire(1934);
  g.clearRect(0, 0, AL, AH);

  // Le nom de la commune, peint sur la cuve en capitales Art déco, effacé par endroits
  {
    const [x, y, l, h] = R.nom;
    g.save();
    texte(g, "VILLEBRUNE-LES-SOURCES", x + l / 2, y + h / 2 + 4, 84, "#3e4f58", "700", "center", 0, '"Futura", "Century Gothic", "Avenir Next", Arial, sans-serif');
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 70; i++) {
      const cx = x + a() * l;
      const cy = y + a() * h;
      const r = 6 + a() * 26;
      g.fillStyle = `rgba(0,0,0,${0.5 + a() * 0.5})`;
      g.beginPath();
      g.ellipse(cx, cy, r * (1 + a()), r * 0.6, a() * 3, 0, 7);
      g.fill();
    }
    // des lettres entières ont disparu (B, S)
    g.fillStyle = "#000";
    g.fillRect(x + 360, y, 60, h);
    g.fillRect(x + 760, y, 50, h);
    g.restore();
  }
  // Le graffiti géant des survivants : « EAU ? NON. » à la peinture blanche, coulures, souligné de rouge
  {
    const [x, y, l, h] = R.graffiti;
    g.save();
    g.translate(x + l / 2, y + h / 2 + 6);
    g.rotate(-0.03);
    g.font = '900 178px "Arial Black", "Helvetica Neue", Arial, sans-serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    g.strokeStyle = "#2a2624";
    g.lineWidth = 16;
    g.strokeText("EAU ? NON.", 0, 0);
    g.fillStyle = "#efeadc";
    g.fillText("EAU ? NON.", 0, 0);
    g.restore();
    // coulures de peinture
    for (let i = 0; i < 26; i++) {
      const cx = x + 90 + a() * (l - 180);
      const cy = y + 150 + a() * 40;
      g.fillStyle = "#e8e2d2";
      g.fillRect(cx, cy, 4 + a() * 4, 20 + a() * 60);
    }
    // le trait rouge sous NON
    g.strokeStyle = "#b0382c";
    g.lineWidth = 14;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x + 560, y + 222);
    g.quadraticCurveTo(x + 760, y + 238, x + 960, y + 214);
    g.stroke();
  }
  // Le panneau « Votre eau, pilotée par algorithme »
  {
    const [x, y, l, h] = R.algo;
    g.fillStyle = "#ece6d4";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 64);
    goutte(g, x + 50, y + 34, 26, "#e9dfc6");
    texte(g, "AQUA·SMART", x + 270, y + 34, 40, "#e9dfc6");
    texte(g, "Votre eau,", x + l / 2, y + 110, 40, "#2f6f73", "800");
    texte(g, "pilotée par algorithme", x + l / 2, y + 156, 38, "#2f6f73", "800");
    texte(g, "Réseau 100 % connecté · Villebrune-les-Sources", x + l / 2, y + 204, 18, "#4a4a44", "600", "center", 0, "Arial, sans-serif");
    texte(g, "Chaque goutte compte. Chaque goutte se compte.", x + l / 2, y + 230, 17, "#c8362b", "italic 600", "center", 0, "Arial, sans-serif");
    salir(g, a, x, y, l, h, 1.2);
    // la croix à la bombe noire des survivants
    g.strokeStyle = "rgba(30,28,26,0.85)";
    g.lineWidth = 16;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x + 70, y + 90);
    g.lineTo(x + l - 80, y + h - 40);
    g.moveTo(x + l - 70, y + 85);
    g.lineTo(x + 90, y + h - 30);
    g.stroke();
  }
  // La borne « Eau premium aromatisée »
  {
    const [x, y, l, h] = R.premium;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 56);
    texte(g, "EAU PREMIUM", x + l / 2, y + 30, 30, "#e9dfc6");
    texte(g, "aromatisée", x + l / 2, y + 78, 26, "#c8362b", "italic 800", "center", 0, "Georgia, serif");
    const saveurs = [["Menthe glaciaire", "#6fb3a0"], ["Fraise des cimes", "#c8362b"], ["Nature+ (abonnés)", "#c79a3b"]];
    saveurs.forEach(([t, coul], i) => {
      g.fillStyle = coul;
      g.beginPath();
      g.arc(x + 30, y + 120 + i * 36, 11, 0, 7);
      g.fill();
      texte(g, t, x + 50, y + 120 + i * 36, 19, "#3b2a1e", "700", "left", 0, "Arial, sans-serif");
    });
    texte(g, "1 gorgée = 1 crédit", x + l / 2, y + 234, 17, "#4a4a44", "italic 600", "center", 0, "Arial, sans-serif");
    salir(g, a, x, y, l, h, 1);
  }
  // L'écran de la borne, qui luit encore
  {
    const [x, y, l, h] = R.ecran;
    g.fillStyle = "#0c1a20";
    g.fillRect(x, y, l, h);
    texte(g, "SERVICE INDISPONIBLE", x + l / 2, y + 36, 22, "#8fe0ff", "800", "center", 0, "Arial, sans-serif");
    texte(g, "Veuillez mettre à jour", x + l / 2, y + 70, 19, "#8fe0ff", "600", "center", 0, "Arial, sans-serif");
    texte(g, "votre soif.", x + l / 2, y + 96, 19, "#8fe0ff", "600", "center", 0, "Arial, sans-serif");
    g.fillStyle = "rgba(143,224,255,0.5)";
    g.fillRect(x + 60, y + 114, 136 * 0.12, 5);
  }
  // Le compteur intelligent : cadran, écran mort
  {
    const [x, y, l, h] = R.compteur;
    g.fillStyle = "#dcd9cf";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#f1eee4";
    g.beginPath();
    g.arc(x + 64, y + 64, 56, 0, 7);
    g.fill();
    g.fillStyle = "#1c2a2a";
    g.fillRect(x + 22, y + 44, 84, 30);
    texte(g, "HORS LIGNE", x + 64, y + 60, 13, "#4a6a6a", "800", "center", 0, "Arial, sans-serif");
    texte(g, "AQUA·SMART", x + 64, y + 92, 12, "#2f6f73", "800", "center", 0, "Arial, sans-serif");
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i === 0 ? "#6a2a2a" : "#3a3a3a";
      g.beginPath();
      g.arc(x + 50 + i * 14, y + 108, 4, 0, 7);
      g.fill();
    }
    salir(g, a, x, y, l, h, 0.8);
  }
  // La plaque « Réservoir n° 2 — accès interdit »
  {
    const [x, y, l, h] = R.reservoir;
    g.fillStyle = "#e6e0cf";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#2a3a5a";
    g.lineWidth = 6;
    g.strokeRect(x + 6, y + 6, l - 12, h - 12);
    texte(g, "RÉSERVOIR", x + l / 2, y + 36, 18, "#2a3a5a");
    texte(g, "N° 2", x + l / 2, y + 62, 24, "#2a3a5a");
    texte(g, "ACCÈS", x + l / 2, y + 88, 15, "#a33a2a");
    texte(g, "INTERDIT", x + l / 2, y + 106, 15, "#a33a2a");
    salir(g, a, x, y, l, h, 1.4);
  }
  // La dernière facture, à payer en ligne
  {
    const [x, y, l, h] = R.facture;
    g.fillStyle = "#f1ece0";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 40);
    goutte(g, x + 22, y + 21, 13, "#e9dfc6");
    texte(g, "AQUA·SMART", x + 130, y + 21, 22, "#e9dfc6");
    texte(g, "DERNIER RAPPEL", x + l / 2, y + 66, 22, "#c8362b");
    const lignes = [
      ["Consommation", "0 m³"],
      ["(compteur hors ligne)", ""],
      ["Abonnement Eau+", "39,00"],
      ["Frais de connexion", "89,90"],
      ["Pénalité de", ""],
      ["sous-consommation", "120,00"],
      ["Option arôme menthe", "4,99"],
    ];
    lignes.forEach(([t, v], i) => {
      texte(g, t, x + 14, y + 104 + i * 24, 14, "#3b3a36", "600", "left", 0, "Arial, sans-serif");
      texte(g, v, x + l - 14, y + 104 + i * 24, 14, "#3b3a36", "700", "right", 0, "Arial, sans-serif");
    });
    g.fillStyle = "#3b3a36";
    g.fillRect(x + 14, y + 270, l - 28, 2);
    texte(g, "TOTAL DÛ", x + 14, y + 290, 17, "#3b3a36", "900", "left", 0, "Arial, sans-serif");
    texte(g, "253,89", x + l - 14, y + 290, 17, "#c8362b", "900", "right", 0, "Arial, sans-serif");
    texte(g, "Payez en ligne :", x + 14, y + 322, 14, "#3b3a36", "700", "left", 0, "Arial, sans-serif");
    texte(g, "scannez le code ➜", x + 14, y + 342, 13, "#3b3a36", "italic 600", "left", 0, "Arial, sans-serif");
    // le code à scanner
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
      if (a() < 0.5 || (i < 3 && j < 3)) {
        g.fillStyle = "#1e1e1e";
        g.fillRect(x + 176 + i * 7, y + 312 + j * 7, 7, 7);
      }
    }
    salir(g, a, x, y, l, h, 1.1);
    taches(g, a, 4, "rgba(120, 90, 40, 0.3)", 10, 30, l, h);
  }
  // Les plans du réseau d'eau (tirage bleu) annotés au crayon rouge par les survivants
  {
    const [x, y, l, h] = R.plan;
    g.fillStyle = "#2d4f78";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "rgba(220,232,245,0.25)";
    g.lineWidth = 1;
    for (let i = 0; i < l; i += 16) {
      g.beginPath();
      g.moveTo(x + i, y);
      g.lineTo(x + i, y + h);
      g.stroke();
    }
    for (let j = 0; j < h; j += 16) {
      g.beginPath();
      g.moveTo(x, y + j);
      g.lineTo(x + l, y + j);
      g.stroke();
    }
    g.strokeStyle = "#e4ecf4";
    g.lineWidth = 3;
    const noeuds = [[60, 60], [190, 70], [300, 50], [120, 150], [230, 160], [330, 180], [80, 220], [190, 225]];
    const liens = [[0, 1], [1, 2], [1, 4], [0, 3], [3, 4], [4, 5], [3, 6], [6, 7], [7, 4], [2, 5]];
    for (const [i, j] of liens) {
      g.beginPath();
      g.moveTo(x + noeuds[i][0], y + noeuds[i][1]);
      g.lineTo(x + noeuds[j][0], y + noeuds[j][1]);
      g.stroke();
    }
    g.fillStyle = "#e4ecf4";
    for (const [nx, ny] of noeuds) {
      g.beginPath();
      g.arc(x + nx, y + ny, 5, 0, 7);
      g.fill();
    }
    g.beginPath();
    g.arc(x + 190, y + 70, 12, 0, 7);
    g.fill();
    texte(g, "CHÂTEAU D'EAU", x + 190, y + 96, 12, "#e4ecf4", "700", "center", 0, "Arial, sans-serif");
    texte(g, "RÉSEAU DE DISTRIBUTION · VILLEBRUNE", x + l / 2, y + h - 14, 13, "#e4ecf4", "700", "center", 0, "Arial, sans-serif");
    g.strokeStyle = "#c8362b";
    g.lineWidth = 4;
    g.beginPath();
    g.ellipse(x + 330, y + 180, 26, 18, 0, 0, 7);
    g.stroke();
    texte(g, "SOURCE ?", x + 330, y + 214, 16, "#c8362b", "italic 800", "center", -0.1, "Arial, sans-serif");
    g.beginPath();
    g.moveTo(x + 70, y + 210);
    g.lineTo(x + 95, y + 235);
    g.moveTo(x + 95, y + 210);
    g.lineTo(x + 70, y + 235);
    g.stroke();
    salir(g, a, x, y, l, h, 0.8);
  }
  // Le cartouche de pierre de la station
  {
    const [x, y, l, h] = R.usine;
    g.fillStyle = "#d2c6a6";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#9a8e70";
    g.lineWidth = 5;
    g.strokeRect(x + 8, y + 8, l - 16, h - 16);
    texte(g, "USINE ÉLÉVATOIRE", x + l / 2, y + 48, 34, "#6a5e48", "700", "center", 0, "Georgia, serif");
    texte(g, "MCMIII", x + l / 2, y + 92, 28, "#6a5e48", "700", "center", 0, "Georgia, serif");
    salir(g, a, x, y, l, h, 1.3);
  }
  // La plaque Art déco « Service des eaux »
  {
    const [x, y, l, h] = R.service;
    g.fillStyle = "#c9c3b4";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#9a9486";
    for (let i = 0; i < 3; i++) g.fillRect(x + 10, y + 12 + i * 8, l - 20, 3);
    texte(g, "SERVICE DES EAUX", x + l / 2, y + 66, 38, "#4a4a44", "700", "center", 0, '"Futura", "Century Gothic", Arial, sans-serif');
    texte(g, "MCMXXXIV", x + l / 2, y + 104, 22, "#4a4a44", "700", "center", 0, '"Futura", "Century Gothic", Arial, sans-serif');
    salir(g, a, x, y, l, h, 1.4);
  }
  // DANGER — CHLORE
  {
    const [x, y, l, h] = R.danger;
    g.fillStyle = "#e0c63a";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#1e1e1e";
    g.beginPath();
    g.moveTo(x + 64, y + 10);
    g.lineTo(x + 118, y + 92);
    g.lineTo(x + 10, y + 92);
    g.closePath();
    g.fill();
    g.fillStyle = "#e0c63a";
    g.beginPath();
    g.moveTo(x + 64, y + 26);
    g.lineTo(x + 104, y + 86);
    g.lineTo(x + 24, y + 86);
    g.closePath();
    g.fill();
    texte(g, "!", x + 64, y + 62, 40, "#1e1e1e");
    texte(g, "CHLORE", x + 64, y + 112, 20, "#1e1e1e");
    salir(g, a, x, y, l, h, 1);
  }
  // L'autocollant de Watty sur le tableau électrique
  {
    const [x, y, l, h] = R.watty;
    g.fillStyle = "#e9dfc6";
    g.beginPath();
    g.arc(x + 64, y + 64, 60, 0, 7);
    g.fill();
    g.fillStyle = "#c79a3b";
    g.fillRect(x + 40, y + 24, 48, 72);
    g.fillStyle = "#2f6f73";
    g.fillRect(x + 54, y + 16, 20, 10);
    g.fillStyle = "#3b2a1e";
    g.beginPath();
    g.arc(x + 55, y + 50, 4, 0, 7);
    g.arc(x + 73, y + 50, 4, 0, 7);
    g.fill();
    g.strokeStyle = "#3b2a1e";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x + 64, y + 62, 11, 0.2, Math.PI - 0.2);
    g.stroke();
    texte(g, "WATTY", x + 64, y + 108, 14, "#c8362b");
  }
  // La planche des survivants : « Eau non potable — faire bouillir »
  {
    const [x, y, l, h] = R.avis;
    g.fillStyle = "#8a7a62";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = "rgba(40,30,20,0.25)";
      g.fillRect(x, y + i * 32 + 30, l, 2);
    }
    texte(g, "EAU NON POTABLE", x + l / 2, y + 34, 24, "#efeadc", "900", "center", -0.03);
    texte(g, "FAIRE BOUILLIR 10 MIN", x + l / 2, y + 70, 19, "#efeadc", "800", "center", 0.02);
    texte(g, "ou chlore : 2 gouttes / L", x + l / 2, y + 104, 16, "#e0c63a", "italic 700", "center", -0.02, "Arial, sans-serif");
  }
  // Le bas-relief Art déco de la Source : une porteuse d'eau, des ondes, des rayons
  {
    const [x, y, l, h] = R.basrelief;
    g.fillStyle = "#c2bcae";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#e0dbcf";
    g.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.moveTo(x + l / 2, y + 30);
      g.lineTo(x + l / 2 + Math.cos(Math.PI + (i * Math.PI) / 8) * 120, y + 30 + Math.sin(Math.PI + (i * Math.PI) / 8) * 120);
      g.stroke();
    }
    for (let j = 0; j < 3; j++) {
      g.strokeStyle = j % 2 ? "#8f897c" : "#e0dbcf";
      g.beginPath();
      for (let i = 0; i <= l; i += 8) g.lineTo(x + i, y + 92 + j * 11 + Math.sin(i / 14) * 5);
      g.stroke();
    }
    // la porteuse : silhouette stylisée, amphore inclinée, filet d'eau
    g.fillStyle = "#d8d3c6";
    g.beginPath();
    g.ellipse(x + 104, y + 28, 9, 11, 0, 0, 7);
    g.fill();
    g.beginPath();
    g.moveTo(x + 94, y + 40);
    g.lineTo(x + 114, y + 40);
    g.lineTo(x + 124, y + 96);
    g.lineTo(x + 84, y + 96);
    g.closePath();
    g.fill();
    g.save();
    g.translate(x + 140, y + 40);
    g.rotate(0.7);
    g.beginPath();
    g.ellipse(0, 0, 14, 20, 0, 0, 7);
    g.fill();
    g.restore();
    g.strokeStyle = "#e8e4da";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + 152, y + 50);
    g.quadraticCurveTo(x + 166, y + 70, x + 160, y + 92);
    g.stroke();
    g.strokeStyle = "rgba(70,64,54,0.5)";
    g.lineWidth = 2;
    g.strokeRect(x + 4, y + 4, l - 8, h - 8);
    salir(g, a, x, y, l, h, 1.5);
  }
  // Le grillage à mailles losanges (transparent entre les fils)
  {
    const [x, y, l, h] = R.grillage;
    g.save();
    g.beginPath();
    g.rect(x, y, l, h);
    g.clip();
    g.strokeStyle = "#5a6462";
    g.lineWidth = 3;
    for (let i = -h; i < l + h; i += 16) {
      g.beginPath();
      g.moveTo(x + i, y);
      g.lineTo(x + i + h, y + h);
      g.stroke();
      g.beginPath();
      g.moveTo(x + i + h, y);
      g.lineTo(x + i, y + h);
      g.stroke();
    }
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x, y + 3);
    g.lineTo(x + l, y + 3);
    g.moveTo(x, y + h - 3);
    g.lineTo(x + l, y + h - 3);
    g.stroke();
    g.restore();
  }
  // Le logo de la Régie sur la camionnette
  {
    const [x, y, l, h] = R.regie;
    g.fillStyle = "#d8d4c6";
    g.fillRect(x, y, l, h);
    goutte(g, x + 36, y + 62, 28);
    texte(g, "RÉGIE DES EAUX", x + 150, y + 46, 22, "#2f6f73");
    texte(g, "AquaSmart · 24/7 connecté", x + 150, y + 78, 14, "#4a4a44", "italic 700", "center", 0, "Arial, sans-serif");
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y + h - 14, l, 6);
    salir(g, a, x, y, l, h, 1.3);
  }
}
