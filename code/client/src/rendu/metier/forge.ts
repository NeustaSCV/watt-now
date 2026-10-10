// 🔥 Les modèles des Charbonniers (Book 25 §4 et §10.3, chantier 5 de la 0.6), en low poly comme le reste du jeu
// (Assemblage : couleurs par sommet, un appel de dessin par finition).
//
// - Les lames en main : couteau de forge (il garde son dessin de personnage.ts), hachette, serpe, machette forgée, hache
//   forgée, glaive de ressort, lance à pointe forgée. Repère du poing : le manche selon +z, le tranchant selon +y.
//   L'acier forgé est sombre et martelé, le fil clair et brillant (la trempe) : on les distingue des lames trouvées.
// - La forge ventilée (niveau 2) : la chemise d'argile, la tuyère, le grand soufflet double à bascule.
// - Les accessoires posés : l'enclume (la grosse pierre plate du foyer tant qu'aucune n'est posée ; l'enclume de
//   dépanneur de la station, la clé du foyer depuis la 0.8 ; l'étau sur son billot, la tête de masse, le tronçon de
//   rail), le bac de trempe (une auge de planches calfatée de glaise, et sa vapeur) et son huile ambrée, le
//   ventilateur 12 V des Voltaïques sur la tuyère.

import * as THREE from "three";
import type { Enclume } from "../../../../commun/src/forge.ts";
import { PALETTE, aleatoire } from "../materiaux.ts";
import { Panache } from "../panache.ts";
import { ACIER, Assemblage, BOIS, CORDE, NOIR, V3, bosseler, placer } from "../assemblage.ts";
import type { FabriqueModele, UsageModele } from "./index.ts";

/** L'acier forgé : sombre, un peu bleui par la trempe ; le fil clair. */
const FORGE = 0x3b3a3c;
const FIL = 0xd6d8d4;
const REVENU = 0x4a4f63;

/** Une lame plate : un profil (z, y) extrudé sur l'épaisseur x, le fil (y > `fil`) plus clair, une bande bleuie au dos. */
function fer(c: Assemblage, profil: [number, number][], epaisseur: number, fil: number, dos = -Infinity): void {
  const forme = new THREE.Shape(profil.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(forme, { depth: epaisseur, bevelEnabled: true, bevelThickness: epaisseur * 0.3, bevelSize: epaisseur * 0.4, bevelSegments: 1 });
  g.rotateY(-Math.PI / 2).translate(epaisseur / 2, 0, 0);
  c.ajouterDegrade(g, (p) => (p.y > fil ? FIL : p.y < dos ? REVENU : FORGE), "metal");
}

/** Un manche de bois le long de z, un peu renflé au bout. */
function manche(c: Assemblage, z0: number, z1: number, r: number, bois: number = BOIS.moyen): void {
  c.perche(new V3(0, 0, z0), new V3(0, 0, z1), r * 1.15, bois, "mat", 6, r * 0.95, 0.06);
  c.perche(new V3(0, 0, z0 - 0.012), new V3(0, 0, z0 + 0.02), r * 1.05, bois, "mat", 6, r * 1.35, 0.04);
}

/** Deux ou trois rivets de fer qui traversent la soie. */
function rivets(c: Assemblage, zs: number[], y = 0.002): void {
  for (const z of zs) c.ajouter(placer(new THREE.CylinderGeometry(0.0055, 0.0055, 0.034, 6).rotateZ(Math.PI / 2), 0, y, z), 0x9a9c98, "metal");
}

function enGroupe(c: Assemblage): THREE.Group {
  const g = new THREE.Group();
  for (const m of c.maillages()) {
    m.receiveShadow = false;
    g.add(m);
  }
  return g;
}

/** La hachette : une petite tête à joue, le tranchant d'acier soudé (plus clair), un manche court. */
function hachette(): THREE.Group {
  const c = new Assemblage(501);
  manche(c, -0.1, 0.36, 0.014, BOIS.clair);
  for (const z of [-0.06, -0.03, 0.0]) c.ligature(new V3(0, 0, z), new V3(0, 0, 1), 0.018, PALETTE.cuir);
  fer(c, [[0.29, -0.035], [0.37, -0.035], [0.37, 0.02], [0.42, 0.11], [0.39, 0.135], [0.32, 0.125], [0.27, 0.11], [0.3, 0.02]], 0.022, 0.1, 0.0);
  c.boite(NOIR, "metal", 0.03, 0.05, 0.08, 0, -0.015, 0.33);
  return enGroupe(c);
}

/** La serpe : la lame courbe des haies, le bec au bout, un manche rond gainé de cuir. */
function serpe(): THREE.Group {
  const c = new Assemblage(502);
  manche(c, -0.09, 0.08, 0.016, BOIS.sombre);
  c.perche(new V3(0, 0, -0.06), new V3(0, 0, 0.05), 0.02, PALETTE.cuir, "mat", 6, 0.019, 0.06);
  c.ajouter(placer(new THREE.CylinderGeometry(0.019, 0.017, 0.02, 6).rotateX(Math.PI / 2), 0, 0, 0.09), ACIER, "metal");
  fer(c, [[0.09, -0.012], [0.26, -0.02], [0.33, -0.005], [0.37, 0.03], [0.36, 0.075], [0.32, 0.09], [0.33, 0.06], [0.3, 0.035], [0.22, 0.03], [0.09, 0.022]], 0.005, 0.018, -0.008);
  return enGroupe(c);
}

/** La machette forgée : la lame longue tirée d'un ressort, rivetée sur un manche de bois clair, ficelé. */
function machetteForgee(): THREE.Group {
  const c = new Assemblage(503);
  c.boite(BOIS.clair, "mat", 0.026, 0.036, 0.16, 0, 0.003, 0.0);
  c.boite(BOIS.moyen, "mat", 0.03, 0.04, 0.022, 0, 0.004, -0.08);
  rivets(c, [-0.045, 0.0, 0.045]);
  for (const z of [0.065, 0.075]) c.ligature(new V3(0, 0.003, z), new V3(0, 0, 1), 0.026, CORDE);
  fer(c, [[0.08, -0.016], [0.32, -0.017], [0.52, -0.01], [0.6, 0.004], [0.63, 0.026], [0.6, 0.046], [0.5, 0.058], [0.33, 0.054], [0.17, 0.04], [0.08, 0.024]], 0.006, 0.042, -0.01);
  return enGroupe(c);
}

/** La hache forgée : la tête neuve, la mise d'acier au tranchant, un manche de bûche fendue, plus droit. */
function hacheForgee(): THREE.Group {
  const c = new Assemblage(504);
  manche(c, -0.16, 0.62, 0.017, BOIS.clair);
  c.perche(new V3(0, 0, -0.12), new V3(0, 0, 0.02), 0.021, PALETTE.cuir, "mat", 6, 0.02, 0.06);
  fer(c, [[0.47, -0.055], [0.57, -0.055], [0.575, 0.03], [0.64, 0.17], [0.61, 0.21], [0.51, 0.2], [0.44, 0.17], [0.48, 0.035]], 0.028, 0.16, 0.0);
  c.boite(NOIR, "metal", 0.034, 0.06, 0.1, 0, -0.03, 0.52);
  c.ajouter(placer(new THREE.CylinderGeometry(0.018, 0.018, 0.045, 6).rotateX(Math.PI / 2), 0, -0.012, 0.53), 0x4a4744, "metal");
  return enGroupe(c);
}

/** Le glaive de ressort : lame droite à double tranchant, une garde, un pommeau, la poignée ficelée sur ses rivets. */
function glaive(): THREE.Group {
  const c = new Assemblage(505);
  c.perche(new V3(0, 0, -0.08), new V3(0, 0, 0.07), 0.018, BOIS.sombre, "mat", 6, 0.017, 0.05);
  for (const z of [-0.05, -0.02, 0.01, 0.04]) c.ligature(new V3(0, 0, z), new V3(0, 0, 1), 0.02, PALETTE.cuir);
  c.ajouter(placer(new THREE.SphereGeometry(0.026, 6, 4), 0, 0, -0.1), FORGE, "metal");
  c.boite(FORGE, "metal", 0.03, 0.13, 0.026, 0, 0, 0.085);
  // La lame : pleine au talon, la gouttière sombre au milieu, deux fils clairs, la pointe en feuille.
  const profil: [number, number][] = [[0.1, -0.026], [0.5, -0.024], [0.62, -0.03], [0.7, 0.0], [0.62, 0.03], [0.5, 0.024], [0.1, 0.026]];
  const forme = new THREE.Shape(profil.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(forme, { depth: 0.007, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.003, bevelSegments: 1 });
  g.rotateY(-Math.PI / 2).translate(0.0035, 0, 0);
  c.ajouterDegrade(g, (p) => (Math.abs(p.y) > 0.017 ? FIL : Math.abs(p.y) < 0.005 && p.z < 0.48 ? REVENU : FORGE), "metal");
  return enGroupe(c);
}

/** La lance à pointe forgée : la perche de l'épieu, une vraie pointe d'acier à douille, clouée. */
function lanceForgee(): THREE.Group {
  const c = new Assemblage(506);
  const perche = new THREE.CylinderGeometry(0.017, 0.023, 1.82, 6, 8).rotateX(Math.PI / 2).translate(0, 0, 0.45);
  c.ajouterDegrade(perche, (p) => (Math.sin(p.z * 9) > 0.7 ? 0x8a6a48 : 0xa78a62));
  c.ajouter(placer(new THREE.CylinderGeometry(0.02, 0.017, 0.12, 6).rotateX(Math.PI / 2), 0, 0, 1.39), FORGE, "metal");
  const pointe = new THREE.ConeGeometry(0.03, 0.24, 4).scale(1, 1, 0.35).rotateX(Math.PI / 2).rotateZ(Math.PI / 4).translate(0, 0, 1.57);
  c.ajouterDegrade(pointe, (p) => (p.z > 1.6 ? FIL : FORGE), "metal");
  c.ajouter(placer(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 5).rotateZ(Math.PI / 2), 0, 0, 1.38), 0x9a9c98, "metal");
  for (const z of [-0.05, 0.08]) c.ligature(new V3(0, 0, z), new V3(0, 0, 1), 0.024);
  return enGroupe(c);
}

/** Les modèles des Charbonniers pour le registre (index.ts). */
export const MODELES_FORGE: readonly [string, UsageModele, FabriqueModele][] = [
  ["hachette", "main", hachette],
  ["serpe", "main", serpe],
  ["machette_forgee", "main", machetteForgee],
  ["hache_forgee", "main", hacheForgee],
  ["glaive", "main", glaive],
  ["lance_forgee", "main", lanceForgee],
];

// ---------- La forge ventilée et ses accessoires (posés sur le modèle de forge, installations.ts) ----------

/** Les pièces de la forge ventilée : la chemise d'argile, la hotte, la tuyère et le grand soufflet double à bascule. */
export function piecesForgeVentilee(): THREE.Group {
  const c = new Assemblage(520);
  c.occlusion = 0.3;
  const aleat = aleatoire(520);
  const argile = 0xa8825e;
  // La chemise d'argile sur le foyer : des murets lissés, roussis par le feu, et un petit dôme ouvert au-dessus.
  for (const s of [-1, 1]) c.ajouter(placer(bosseler(new THREE.BoxGeometry(1.0, 0.18, 0.1, 3, 1, 1), 0.02, aleat), 0, 0.64, s * 0.26), argile, "mat", 0.06);
  c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.1, 0.18, 0.5, 1, 1, 2), 0.02, aleat), 0.5, 0.64, 0), argile, "mat", 0.06);
  const hotte = new THREE.SphereGeometry(0.34, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2.6).scale(1.3, 0.8, 0.9);
  c.ajouterDegrade(placer(bosseler(hotte, 0.02, aleat), 0.1, 0.72, 0), (p) => (p.y > 0.92 ? 0x4a3a30 : p.y > 0.82 ? 0x7a5a40 : argile));
  c.perche(new V3(0.1, 0.95, 0), new V3(0.12, 1.25, 0), 0.07, 0x5a4434, "mat", 6, 0.06, 0.06);
  // La tuyère neuve : un tuyau de fer plus gros, qui plonge dans le charbon.
  c.perche(new V3(-1.0, 0.42, 0.3), new V3(-0.45, 0.48, 0.05), 0.04, ACIER, "metal", 6);
  // Le soufflet double : deux grandes planches en goutte, le cuir (ou la bâche) plissé, sur un chevalet ; un levier.
  const x0 = -1.35;
  const z0 = 0.55;
  for (const y of [0.32, 0.56]) c.boite(BOIS.moyen, "mat", 0.62, 0.03, 0.36, x0, y, z0);
  for (let k = 0; k < 4; k++) c.boite(k % 2 ? PALETTE.cuir : 0x5a3d2a, "mat", 0.58 - k * 0.02, 0.06, 0.34 - k * 0.02, x0 + 0.01, 0.37 + k * 0.055, z0);
  for (const s of [-1, 1]) c.perche(new V3(x0 + s * 0.25, 0, z0 + 0.15), new V3(x0 + s * 0.25, 0.32, z0 + 0.15), 0.025, BOIS.ecorce, "mat", 5);
  for (const s of [-1, 1]) c.perche(new V3(x0 + s * 0.25, 0, z0 - 0.15), new V3(x0 + s * 0.25, 0.32, z0 - 0.15), 0.025, BOIS.ecorce, "mat", 5);
  c.perche(new V3(x0 + 0.3, 0.45, z0), new V3(x0 + 0.45, 0.45, 0.32), 0.03, NOIR, "metal", 5);
  // Le levier à bascule, qu'on pompe d'une main.
  c.perche(new V3(x0, 0.6, z0), new V3(x0, 1.1, z0 + 0.05), 0.022, BOIS.clair, "mat", 5);
  c.perche(new V3(x0 - 0.4, 1.12, z0 + 0.05), new V3(x0 + 0.4, 1.08, z0 + 0.05), 0.02, BOIS.clair, "mat", 5);
  const g = new THREE.Group();
  for (const m of c.maillages()) g.add(m);
  return g;
}

/** Les accessoires de la forge, chacun montré ou caché selon l'état. */
export interface AccessoiresForge {
  groupe: THREE.Group;
  /** La grosse pierre plate sur son billot : l'enclume du foyer tant qu'aucune autre n'est posée (★). */
  pierrePlate: THREE.Object3D;
  enclumes: Record<Enclume, THREE.Object3D>;
  bac: THREE.Object3D;
  huile: THREE.Object3D;
  ventilateur: THREE.Object3D;
  /** L'hélice du ventilateur : elle tourne. */
  helice: THREE.Object3D;
  /** La vapeur de l'auge (créée à la première image : le panache a besoin du navigateur). */
  vapeur: { panache: Panache; ages: number[] } | null;
}

/** Où sont l'auge et le billot de l'enclume du foyer, dans le repère de la forge (installations.ts). */
const AUGE = new V3(0.5, 0, -0.74);
const BILLOT = new V3(1.3, 0, 0.1);
const VAPEUR = new THREE.Color(0xe9ece8);
const NB_VAPEUR = 7;

function morceau(c: Assemblage, nom: string): THREE.Group {
  const g = new THREE.Group();
  g.name = nom;
  for (const m of c.maillages()) g.add(m);
  g.userData.intact = true;
  return g;
}

export function accessoiresForge(): AccessoiresForge {
  const groupe = new THREE.Group();
  groupe.userData.intact = true;
  const billot = (c: Assemblage, x: number, z: number, h: number) => c.perche(new V3(x, -0.02, z), new V3(x, h, z), 0.19, BOIS.ecorce, "mat", 8, 0.18, 0.06);
  const aleat = aleatoire(530);
  /** Le gros billot du foyer, ses outils autour : le marteau couché dessus, les pinces contre lui. */
  const billotDuFoyer = (c: Assemblage, haut: number) => {
    c.perche(new V3(BILLOT.x, -0.02, BILLOT.z), new V3(BILLOT.x, 0.5, BILLOT.z), 0.23, BOIS.ecorce, "mat", 9, 0.22, 0.06);
    c.ajouter(placer(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 9), BILLOT.x, 0.502, BILLOT.z), BOIS.coupe, "mat", 0.05);
    c.perche(new V3(BILLOT.x - 0.1, haut + 0.02, BILLOT.z + 0.1), new V3(BILLOT.x + 0.12, haut + 0.02, BILLOT.z + 0.2), 0.012, BOIS.clair, "mat", 5);
    c.boite(0x45423f, "metal", 0.03, 0.03, 0.09, BILLOT.x - 0.1, haut + 0.02, BILLOT.z + 0.1, 0, 0.42, 0);
    for (const s of [-1, 1]) c.perche(new V3(BILLOT.x - 0.23, 0.02, BILLOT.z + 0.22 + s * 0.02), new V3(BILLOT.x - 0.15, 0.5, BILLOT.z + 0.1 + s * 0.01), 0.008, 0x45423f, "metal", 4);
  };

  // La grosse pierre plate (le repli, ★) : une dalle de grès dure, polie au milieu par les coups.
  let c = new Assemblage(538);
  billotDuFoyer(c, 0.61);
  c.ajouter(placer(bosseler(new THREE.CylinderGeometry(0.2, 0.22, 0.1, 7, 1), 0.02, aleat).scale(1.2, 1, 0.85), BILLOT.x, 0.555, BILLOT.z), PALETTE.pierreSombre, "mat", 0.06);
  c.ajouter(placer(new THREE.CylinderGeometry(0.11, 0.11, 0.006, 7).scale(1.3, 1, 0.8), BILLOT.x, 0.607, BILLOT.z), 0x9d988e, "mat", 0.03);
  const pierrePlate = morceau(c, "pierre_plate");

  // L'enclume de dépanneur (la clé du foyer) : une petite enclume de garage, table, bigorne et talon, boulonnée sur le
  // billot ; la peinture verte d'atelier écaillée, la table polie.
  c = new Assemblage(539);
  billotDuFoyer(c, 0.69);
  const vert = 0x3d5a46;
  c.boite(vert, "metal", 0.22, 0.05, 0.16, BILLOT.x, 0.525, BILLOT.z);
  c.boite(vert, "metal", 0.12, 0.08, 0.09, BILLOT.x, 0.59, BILLOT.z);
  c.boite(0x45423f, "metal", 0.3, 0.06, 0.11, BILLOT.x, 0.66, BILLOT.z);
  c.ajouter(placer(new THREE.ConeGeometry(0.045, 0.16, 6).rotateZ(Math.PI / 2), BILLOT.x + 0.23, 0.665, BILLOT.z), 0x45423f, "metal");
  c.boite(0x45423f, "metal", 0.05, 0.05, 0.09, BILLOT.x - 0.17, 0.66, BILLOT.z);
  c.boite(0xa9aaa6, "metal", 0.28, 0.005, 0.09, BILLOT.x, 0.692, BILLOT.z);
  for (const [dx, dz] of [[-0.08, -0.06], [0.08, 0.06], [-0.08, 0.06], [0.08, -0.06]] as const) c.ajouter(placer(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 5), BILLOT.x + dx, 0.555, BILLOT.z + dz), 0x8a8780, "metal");
  // Les écailles de peinture : la rouille dessous.
  for (const [dx, dy] of [[-0.05, 0.6], [0.04, 0.53], [0.09, 0.58]] as const) c.boite(PALETTE.rouille, "mat", 0.03, 0.02, 0.002, BILLOT.x + dx, dy, BILLOT.z + 0.081);
  const depanneur = morceau(c, "depanneur");

  // L'étau d'établi, serré sur son billot : neuf kilos de fonte verte, la vis et sa poignée.
  c = new Assemblage(531);
  billot(c, 1.05, 0.78, 0.45);
  const fonte = 0x3f5a48;
  c.boite(fonte, "metal", 0.26, 0.08, 0.12, 1.05, 0.5, 0.78);
  for (const dx of [-0.07, 0.07]) c.boite(fonte, "metal", 0.04, 0.12, 0.13, 1.05 + dx, 0.6, 0.78);
  c.boite(ACIER, "metal", 0.19, 0.02, 0.1, 1.05, 0.67, 0.78);
  c.perche(new V3(0.85, 0.58, 0.78), new V3(0.98, 0.58, 0.78), 0.01, ACIER, "metal", 5);
  c.perche(new V3(0.85, 0.58, 0.7), new V3(0.85, 0.58, 0.86), 0.008, ACIER, "metal", 5);
  const etau = morceau(c, "etau");

  // La tête de masse, emmanchée à l'envers dans le billot.
  c = new Assemblage(532);
  billot(c, 1.05, 0.78, 0.42);
  c.boite(0x4a4744, "metal", 0.11, 0.11, 0.24, 1.05, 0.5, 0.78);
  c.boite(0x77746e, "metal", 0.1, 0.01, 0.22, 1.05, 0.56, 0.78);
  const masse = morceau(c, "masse");

  // Le tronçon de rail, couché sur deux rondins : la meilleure enclume du pays.
  c = new Assemblage(533);
  for (const dx of [-0.25, 0.25]) c.perche(new V3(0.95 + dx, 0.12, 0.6), new V3(0.95 + dx, 0.12, 0.96), 0.12, BOIS.ecorce, "mat", 7);
  const profilRail = new THREE.Shape([[-0.07, 0], [0.07, 0], [0.07, 0.02], [0.018, 0.03], [0.018, 0.1], [0.04, 0.11], [0.04, 0.15], [-0.04, 0.15], [-0.04, 0.11], [-0.018, 0.1], [-0.018, 0.03], [-0.07, 0.02]].map(([x, y]) => new THREE.Vector2(x, y)));
  const rail = new THREE.ExtrudeGeometry(profilRail, { depth: 0.7, bevelEnabled: false }).rotateY(Math.PI / 2).translate(0.6, 0.24, 0.78);
  c.ajouterDegrade(rail, (p) => (p.y > 0.385 ? 0xa9aaa6 : Math.sin(p.x * 31) > 0.6 ? PALETTE.rouille : 0x55524d), "metal");
  const railObjet = morceau(c, "rail");

  // Le bac de trempe (plan 0.8) : une auge de planches refendues, à demi enterrée dans son assise creusée, les joints
  // et les coins calfatés de glaise grise du gué ; l'eau sombre dedans, une tenaille posée en travers.
  c = new Assemblage(534);
  c.occlusion = 0.3;
  const glaise = 0x8d8778;
  const glaiseSombre = 0x6f695c;
  const [lx, lz, h] = [0.74, 0.34, 0.22];
  // L'assise creusée : un anneau de terre retournée autour du pied de l'auge.
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    c.ajouter(placer(bosseler(new THREE.DodecahedronGeometry(0.07, 0).scale(1.4, 0.4, 1), 0.02, aleat), AUGE.x + Math.cos(a) * 0.46, 0.015, AUGE.z + Math.sin(a) * 0.25), 0x5e4a36, "mat", 0.08);
  }
  // Le fond et les quatre côtés : des planches de bûche refendue, de tons différents.
  c.boite(BOIS.sombre, "mat", lx, 0.03, lz, AUGE.x, 0.03, AUGE.z);
  for (const s of [-1, 1]) {
    c.boite(s < 0 ? BOIS.moyen : BOIS.gris, "mat", lx + 0.04, h, 0.035, AUGE.x, h / 2 + 0.02, AUGE.z + s * (lz / 2));
    c.boite(BOIS.clair, "mat", 0.035, h, lz, AUGE.x + s * (lx / 2), h / 2 + 0.02, AUGE.z);
    // Les joints et les coins, beurrés de glaise (des bourrelets irréguliers).
    for (const t of [-1, 1]) c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.06, h + 0.02, 0.06, 1, 2, 1), 0.012, aleat), AUGE.x + s * (lx / 2), h / 2 + 0.02, AUGE.z + t * (lz / 2)), glaise, "mat", 0.08);
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(lx * 0.95, 0.03, 0.05, 4, 1, 1), 0.01, aleat), AUGE.x, h + 0.035, AUGE.z + s * (lz / 2)), glaiseSombre, "mat", 0.06);
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(lx * 0.9, 0.035, 0.05, 4, 1, 1), 0.01, aleat), AUGE.x, 0.04, AUGE.z + s * (lz / 2 + 0.02)), glaise, "mat", 0.06);
  }
  // L'eau de trempe, sombre, un peu irisée.
  c.ajouter(placer(new THREE.PlaneGeometry(lx - 0.04, lz - 0.04).rotateX(-Math.PI / 2), AUGE.x, h - 0.02, AUGE.z), 0x2c3a40, "verre");
  // Une tenaille de forge posée en travers.
  c.perche(new V3(AUGE.x - 0.1, h + 0.05, AUGE.z - 0.18), new V3(AUGE.x + 0.12, h + 0.05, AUGE.z + 0.2), 0.009, NOIR, "metal", 4);
  c.perche(new V3(AUGE.x - 0.08, h + 0.05, AUGE.z - 0.18), new V3(AUGE.x + 0.15, h + 0.05, AUGE.z + 0.18), 0.009, NOIR, "metal", 4);
  const bac = morceau(c, "bac");
  c = new Assemblage(535);
  c.ajouter(placer(new THREE.PlaneGeometry(lx - 0.04, lz - 0.04).rotateX(-Math.PI / 2), AUGE.x, h - 0.012, AUGE.z), 0x8a5a14, "verre");
  const huile = morceau(c, "huile");

  // Le ventilateur 12 V sur la tuyère : un boîtier noir, une grille, un câble jusqu'au banc ; l'hélice tourne.
  c = new Assemblage(536);
  c.boite(0x2a2c30, "mat", 0.16, 0.16, 0.08, -1.0, 0.42, 0.3);
  c.perche(new V3(-1.0, 0.34, 0.25), new V3(-1.3, 0.02, -0.2), 0.008, 0xb33a2a, "mat", 4);
  const ventilateur = morceau(c, "ventilateur");
  c = new Assemblage(537);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    c.ajouter(new THREE.BoxGeometry(0.02, 0.065, 0.006).translate(0, 0.035, 0).rotateZ(a), 0xd9d6cc, "mat");
  }
  const helice = morceau(c, "helice");
  helice.position.set(-1.0, 0.42, 0.345);
  ventilateur.add(helice);

  groupe.add(pierrePlate, depanneur, etau, masse, railObjet, bac, huile, ventilateur);
  return { groupe, pierrePlate, enclumes: { depanneur, etau, masse, rail: railObjet }, bac, huile, ventilateur, helice, vapeur: null };
}

/** Montre les accessoires posés (l'état de la forge). La pierre plate cède la place à l'enclume qu'on pose. */
export function majAccessoiresForge(a: AccessoiresForge, etat: { enclume?: Enclume; bac?: boolean; huile?: number; ventilateur?: boolean }): void {
  for (const [nom, o] of Object.entries(a.enclumes)) o.visible = etat.enclume === nom;
  // L'étau, la masse et le rail ont leur propre billot ; l'enclume de dépanneur prend celui de la pierre plate.
  a.pierrePlate.visible = etat.enclume !== "depanneur";
  a.bac.visible = etat.bac === true;
  a.huile.visible = etat.bac === true && (etat.huile ?? 0) > 0;
  a.ventilateur.visible = etat.ventilateur === true;
}

/**
 * Anime les accessoires : l'hélice du ventilateur tourne ; l'auge, tiède à côté du foyer, fume d'une vapeur légère
 * (quelques bouffées en un appel de dessin, un peu plus visibles au froid de la nuit).
 */
export function animerAccessoiresForge(a: AccessoiresForge, dt: number, nuit: number): void {
  if (a.ventilateur.visible) a.helice.rotation.z -= dt * 25;
  if (!a.bac.visible) {
    if (a.vapeur) a.vapeur.panache.objet.visible = false;
    return;
  }
  if (!a.vapeur) {
    const panache = new Panache(NB_VAPEUR);
    a.groupe.add(panache.objet);
    a.vapeur = { panache, ages: Array.from({ length: NB_VAPEUR }, (_, i) => (i / NB_VAPEUR) * 3.2) };
  }
  const { panache, ages } = a.vapeur;
  panache.objet.visible = true;
  ages.forEach((age0, i) => {
    const age = (age0 + dt) % 3.2;
    ages[i] = age;
    const vie = age / 3.2;
    const x = AUGE.x + Math.sin(i * 2.1) * 0.22 + Math.sin(age * 1.3 + i) * 0.05;
    const z = AUGE.z + Math.cos(i * 1.7) * 0.08;
    panache.regler(i, x, 0.24 + vie * 0.75, z, 0.14 + vie * 0.42, VAPEUR, (0.2 + nuit * 0.1) * Math.sin(vie * Math.PI) * (1 - vie * 0.4));
  });
}
