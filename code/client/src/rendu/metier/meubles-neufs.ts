// Les modèles des meubles nouveaux du niveau 2 (plan 0.10, chantier D) : le cuiseur solaire, les bacs de tri, la rampe
// de LED, le moulin de jerricans et l'arbalète de garde, posés au sol.
//
// Style low poly du jeu (Assemblage : couleurs par sommet, facettes nuancées), en mètres, posés en y = 0 ; l'avant est
// vers +z (l'arbalète de garde tire vers +z, son fil passe à 1 m devant : commun/src/meubles-neufs.ts, `surLeFil`).
// Ce qui change selon l'état ou qui bouge, comme les modèles des Mécanistes (mecanique.ts) :
// - l'arbalète de garde a deux visages, `userData.siArme` (armée : l'arc bandé, le carreau ; tirée : l'arc détendu) ;
// - la poulie du moulin se montre posée (`userData.siEtat = "poulie"`) ; son rotor tourne au vent (`userData.animer`, la
//   force du vent donnée par main.ts : `regleVentDesMoulins`) ;
// - les LED de la rampe s'allument la nuit, si la batterie de la base a du courant (`userData.allumer`, appelé par
//   installations.ts).

import * as THREE from "three";
import type { Vent } from "../../../../commun/src/meteo.ts";
import { ACIER, Assemblage, BOIS, CORDE, NOIR, V3, touffe } from "../assemblage.ts";
import { PALETTE, aleatoire } from "../materiaux.ts";
import type { FabriqueModele, UsageModele } from "./index.ts";

const ALU = 0xc9ced3;
const ALU_SOMBRE = 0x8f969c;
const JERRICAN = 0xb8402c;
const JERRICAN_VERT = 0x4f6b3a;
const PLASTIQUE_BLEU = 0x3f6f8f;
const VITRE = 0x9fc7d4;

/** Un groupe de morceaux, marqué pour être montré selon l'état (et laissé à part de la fusion statique). */
function marque(g: THREE.Group, cle: "siArme" | "siEtat", valeur: boolean | string): THREE.Group {
  g.userData[cle] = valeur;
  g.userData.intact = true;
  return g;
}

// ---------- Le vent des moulins (donné par main.ts à chaque image) ----------

/** La vitesse du rotor (rad/s) selon le vent : rien au calme, lentement par temps voilé, vite quand il vente. */
const ROTATION_PAR_VENT: Record<Vent, number> = { calme: 0, faible: 1.6, fort: 4.5 };
let ventDesMoulins: Vent = "calme";

/** Le vent qu'il fait (main.ts, d'après la météo) : les rotors des moulins de jerricans le suivent. */
export function regleVentDesMoulins(v: Vent): void {
  ventDesMoulins = v;
}

// ---------- Le cuiseur solaire ----------

/**
 * Le cuiseur solaire : une caisse de planches calée sur des pierres, sa vitre inclinée vers le sud, deux réflecteurs de
 * chutes d'aluminium martelées ouverts de part et d'autre, une marmite noircie sous la vitre.
 */
function cuiseur(): THREE.Group {
  const aleat = aleatoire(201);
  const c = new Assemblage(201);
  c.occlusion = 0.2;
  // Les pierres de calage et la caisse.
  for (const [x, z] of [[-0.24, -0.18], [0.24, -0.18], [-0.24, 0.18], [0.24, 0.18]] as const) c.ajouter(new THREE.DodecahedronGeometry(0.07, 0).scale(1, 0.6, 1).translate(x, 0.04, z), PALETTE.pierre, "mat", 0.06);
  c.boite(BOIS.clair, "mat", 0.62, 0.26, 0.5, 0, 0.21, 0);
  // Les planches de la caisse (des joints sombres), le papier isolant qui dépasse au bord.
  for (const y of [0.15, 0.25]) c.boite(BOIS.sombre, "mat", 0.63, 0.008, 0.51, 0, y, 0);
  c.boite(0xe8e0cc, "mat", 0.56, 0.02, 0.44, 0, 0.345, 0);
  // La marmite noircie, sous la vitre.
  c.ajouter(new THREE.CylinderGeometry(0.09, 0.08, 0.1, 9).translate(0, 0.39, 0.02), NOIR, "metal", 0.04);
  // La vitre, inclinée vers +z (le sud), cadrée de bois.
  const vitre = new THREE.Group();
  const v = new Assemblage(202);
  v.boite(VITRE, "verre", 0.56, 0.008, 0.46, 0, 0, 0);
  for (const s of [-1, 1]) v.boite(BOIS.moyen, "mat", 0.6, 0.03, 0.03, 0, 0.01, s * 0.24);
  for (const s of [-1, 1]) v.boite(BOIS.moyen, "mat", 0.03, 0.03, 0.5, s * 0.29, 0.01, 0);
  const gv = v.groupe();
  gv.position.set(0, 0.42, 0);
  gv.rotation.x = 0.28;
  vitre.add(gv);
  // Les deux réflecteurs, ouverts en éventail, et celui du fond, relevé : des chutes martelées (facettes marquées).
  for (const s of [-1, 1]) c.ajouter(new THREE.BoxGeometry(0.02, 0.42, 0.5).translate(s * 0.02, 0.21, 0).rotateZ(-s * 0.55).translate(s * 0.31, 0.34, 0), ALU, "metal", 0.12);
  c.ajouter(new THREE.BoxGeometry(0.62, 0.45, 0.02).translate(0, 0.22, 0).rotateX(0.5).translate(0, 0.34, -0.26), ALU, "metal", 0.12);
  // Deux baguettes tiennent les réflecteurs ouverts.
  for (const s of [-1, 1]) c.perche(new V3(s * 0.3, 0.34, -0.2), new V3(s * 0.48, 0.62, -0.05), 0.008, BOIS.coupe, "mat", 4);
  touffe(c, 0.45, 0.35, aleat, 3, 0.2);
  touffe(c, -0.5, -0.3, aleat, 3, 0.18);
  const g = c.groupe();
  g.add(vitre);
  return g;
}

// ---------- Les bacs de tri ----------

/** Un jerrican coupé en bac : le corps, sa poignée moulée, le bord découpé ; un peu de ce qu'on y a trié. */
function bac(c: Assemblage, x: number, couleur: number, contenu: number, aleat: () => number): void {
  c.boite(couleur, "tole", 0.34, 0.3, 0.24, x, 0.17, 0);
  c.boite(couleur, "tole", 0.36, 0.02, 0.26, x, 0.325, 0);
  c.boite(0x2a2826, "mat", 0.3, 0.01, 0.2, x, 0.315, 0);
  c.boite(couleur, "tole", 0.12, 0.04, 0.04, x, 0.26, -0.13);
  for (let k = 0; k < 3; k++) c.ajouter(new THREE.DodecahedronGeometry(0.035, 0).translate(x - 0.08 + k * 0.08, 0.3 + aleat() * 0.02, (aleat() - 0.5) * 0.1), contenu, "metal", 0.1);
}

/** Les bacs de tri : trois jerricans coupés sur une planche, un aimant pendu à une potence au-dessus. */
function bacsTri(): THREE.Group {
  const aleat = aleatoire(211);
  const c = new Assemblage(211);
  c.occlusion = 0.2;
  c.boite(BOIS.sombre, "mat", 1.2, 0.04, 0.34, 0, 0.02, 0);
  bac(c, -0.4, JERRICAN, ALU, aleat);
  bac(c, 0, JERRICAN_VERT, PALETTE.rouille, aleat);
  bac(c, 0.4, PLASTIQUE_BLEU, 0xd8c8a0, aleat);
  // La potence de tube, et l'aimant en fer à cheval au bout de sa ficelle.
  c.perche(new V3(-0.66, 0, -0.1), new V3(-0.66, 0.95, -0.1), 0.018, ALU_SOMBRE, "metal", 6);
  c.perche(new V3(-0.66, 0.93, -0.1), new V3(0.05, 0.93, -0.05), 0.014, ALU_SOMBRE, "metal", 6);
  c.perche(new V3(0.02, 0.93, -0.05), new V3(0.02, 0.62, -0.05), 0.003, CORDE, "mat", 3);
  c.ajouter(new THREE.TorusGeometry(0.05, 0.016, 4, 10, Math.PI).rotateZ(Math.PI).translate(0.02, 0.6, -0.05), 0xb8302a, "metal");
  for (const s of [-1, 1]) c.boite(ALU, "metal", 0.034, 0.03, 0.034, 0.02 + s * 0.05, 0.6, -0.05);
  touffe(c, 0.7, 0.2, aleat, 3, 0.22);
  return c.groupe();
}

// ---------- La rampe de LED ----------

/** La rampe de LED : deux pieds de tube, une traverse à 1,9 m, dix LED dessous ; elles s'allument (`userData.allumer`). */
function rampe(): THREE.Group {
  const c = new Assemblage(221);
  c.occlusion = 0.2;
  for (const s of [-1, 1]) {
    c.perche(new V3(s * 0.75, 0, 0), new V3(s * 0.62, 1.92, 0), 0.02, ALU_SOMBRE, "metal", 6);
    // Le collier de pierres au pied, et la jambe de force.
    c.ajouter(new THREE.DodecahedronGeometry(0.08, 0).scale(1.2, 0.5, 1).translate(s * 0.75, 0.03, 0), PALETTE.pierreSombre, "mat", 0.06);
    c.perche(new V3(s * 0.75, 0, 0.35), new V3(s * 0.66, 1.2, 0), 0.012, ALU_SOMBRE, "metal", 5);
  }
  c.perche(new V3(-0.7, 1.92, 0), new V3(0.7, 1.92, 0), 0.025, ALU, "metal", 7);
  // Le fil de cuivre qui descend le long d'un pied, vers la batterie de la base.
  c.perche(new V3(0.62, 1.88, 0.03), new V3(0.75, 0.02, 0.06), 0.004, 0xc8743a, "metal", 3);
  const g = c.groupe();
  // Les dix LED : un seul maillage, à part, dont la couleur suit l'état.
  const geos: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 10; k++) geos.push(new THREE.BoxGeometry(0.05, 0.022, 0.05).translate(-0.6 + (k * 1.2) / 9, 1.895, 0));
  const leds = new THREE.Mesh(fusion(geos), new THREE.MeshBasicMaterial({ color: 0x5a5a50 }));
  leds.userData.intact = true;
  g.add(leds);
  g.userData.allumer = (allumee: boolean) => (leds.material as THREE.MeshBasicMaterial).color.setHex(allumee ? 0xfff6d8 : 0x5a5a50);
  return g;
}

/** Fond des boîtes en une géométrie (même matériau, un appel de dessin). */
function fusion(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  for (const g of geos) {
    const ng = g.toNonIndexed();
    positions.push(...(ng.getAttribute("position").array as Float32Array));
    ng.dispose();
    g.dispose();
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return r;
}

// ---------- Le moulin de jerricans ----------

/**
 * Le moulin de jerricans, une éolienne Savonius : un mât de trois tubes haubané, deux demi-jerricans en godets décalés
 * qui tournent sur un roulement en haut du mât, l'axe qui descend au petit moteur, au pied ; la poulie d'aluminium,
 * posée sur l'axe (selon l'état).
 */
function moulin(): THREE.Group {
  const aleat = aleatoire(231);
  const c = new Assemblage(231);
  c.occlusion = 0.25;
  // Le pied : un tas de pierres, le moteur sur sa planchette.
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    c.ajouter(new THREE.DodecahedronGeometry(0.09 + aleat() * 0.03, 0).scale(1, 0.6, 1).translate(Math.cos(a) * 0.22, 0.04, Math.sin(a) * 0.22), k % 2 ? PALETTE.pierre : PALETTE.pierreSombre, "mat", 0.06);
  }
  c.boite(BOIS.sombre, "mat", 0.26, 0.03, 0.2, 0, 0.1, 0.18);
  c.ajouter(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10).rotateX(Math.PI / 2).translate(0, 0.17, 0.18), 0x5b5f63, "metal", 0.05);
  c.perche(new V3(0, 0.17, 0.12), new V3(0, 0.17, 0.02), 0.008, ACIER, "metal", 4);
  // Le mât et ses trois haubans de fil de fer, piqués au sol.
  c.perche(new V3(0, 0, 0), new V3(0, 2.0, 0), 0.03, ALU_SOMBRE, "metal", 7);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4;
    c.perche(new V3(0, 1.55, 0), new V3(Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05), 0.003, ACIER, "metal", 3);
    c.perche(new V3(Math.cos(a) * 1.05, -0.05, Math.sin(a) * 1.05), new V3(Math.cos(a) * 1.05, 0.12, Math.sin(a) * 1.05), 0.012, BOIS.ecorce, "mat", 4);
  }
  touffe(c, 0.5, -0.4, aleat, 3, 0.25);
  const g = c.groupe();
  // Le rotor : deux demi-jerricans ouverts, décalés d'un demi-diamètre, entre deux flasques ; il tourne au vent.
  const r = new Assemblage(232);
  for (const s of [-1, 1]) {
    // Chaque godet : un demi-jerrican ouvert (sa face intérieure plus sombre), sa poignée moulée en haut.
    r.ajouter(new THREE.CylinderGeometry(0.22, 0.22, 0.66, 10, 1, true, s > 0 ? 0 : Math.PI, Math.PI).translate(s * 0.11, 0, 0), JERRICAN, "tole", 0.06);
    r.ajouter(new THREE.CylinderGeometry(0.205, 0.205, 0.64, 10, 1, true, s > 0 ? 0 : Math.PI, Math.PI).translate(s * 0.11, 0, 0), 0x7a2a1c, "tole");
    r.boite(JERRICAN, "tole", 0.12, 0.05, 0.04, s * 0.2, 0.28, s * 0.12);
  }
  // Deux flasques étroites, en croix de tube, qui tiennent les godets sans les cacher.
  for (const y of [-0.34, 0.34]) for (const a of [0, Math.PI / 2]) r.boite(ALU_SOMBRE, "metal", 0.62, 0.02, 0.04, 0, y, 0, 0, a, 0);
  r.perche(new V3(0, -0.45, 0), new V3(0, 0.42, 0), 0.012, ACIER, "metal", 5);
  const rotor = r.groupe();
  rotor.position.set(0, 2.38, 0);
  rotor.userData.intact = true;
  rotor.userData.animer = (dt: number) => {
    rotor.rotation.y += dt * ROTATION_PAR_VENT[ventDesMoulins];
  };
  g.add(rotor);
  // La poulie d'aluminium, posée sur l'axe au-dessus du moteur (selon l'état).
  const p = new Assemblage(233);
  p.ajouter(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 14).translate(0, 0.62, 0), ALU, "metal", 0.04);
  p.ajouter(new THREE.TorusGeometry(0.085, 0.01, 3, 14).rotateX(Math.PI / 2).translate(0, 0.62, 0), 0x2a2826, "metal");
  p.perche(new V3(0.08, 0.62, 0), new V3(0.02, 0.2, 0.17), 0.005, NOIR, "mat", 3);
  g.add(marque(p.groupe(), "siEtat", "poulie"));
  return g;
}

// ---------- L'arbalète de garde ----------

/** L'arbalète bridée sur son tube, tournée vers +z ; `bandee` : l'arc tiré et le carreau, sinon l'arc détendu. */
function arbaleteSurTube(c: Assemblage, bandee: boolean): void {
  const y = 0.82;
  const avant = 0.28;
  const recul = bandee ? 0.1 : 0.03;
  for (const s of [-1, 1]) {
    c.perche(new V3(0, y + 0.02, avant), new V3(s * 0.28, y + 0.02, avant - recul), 0.012, 0x8a6a3e, "mat", 5, 0.008);
    // La corde : armée, ramenée jusqu'à la noix ; détendue, droite d'une branche à l'autre.
    c.perche(new V3(s * 0.28, y + 0.03, avant - recul), bandee ? new V3(0, y + 0.04, -0.02) : new V3(0, y + 0.03, avant - recul), 0.003, CORDE, "mat", 3);
  }
  if (bandee) {
    // Le carreau, couché dans sa rainure.
    c.perche(new V3(0, y + 0.045, -0.02), new V3(0, y + 0.045, 0.36), 0.006, BOIS.coupe, "mat", 4);
    c.ajouter(new THREE.ConeGeometry(0.012, 0.04, 4).rotateX(Math.PI / 2).translate(0, y + 0.045, 0.38), ACIER, "metal");
  }
}

/**
 * L'arbalète de garde : un tube d'aluminium planté dans un collier de pierres, l'arbalète bridée en haut, la détente
 * reliée au fil de fer tendu à 1 m devant, entre deux piquets (2 m de large).
 */
function arbaleteGarde(): THREE.Group {
  const aleat = aleatoire(241);
  const fixe = new Assemblage(241);
  fixe.occlusion = 0.2;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    fixe.ajouter(new THREE.DodecahedronGeometry(0.07, 0).scale(1, 0.6, 1).translate(Math.cos(a) * 0.12, 0.03, Math.sin(a) * 0.12), PALETTE.pierre, "mat", 0.06);
  }
  fixe.perche(new V3(0, 0, 0), new V3(0, 0.8, 0), 0.022, ALU_SOMBRE, "metal", 6);
  // L'arbrier, bridé au fil de fer sur le haut du tube ; le petit ressort de la détente, dessous.
  fixe.boite(BOIS.moyen, "mat", 0.05, 0.05, 0.56, 0, 0.82, 0.04);
  fixe.ligature(new V3(0, 0.8, 0), new V3(1, 0, 0), 0.04, 0x8a8a8a);
  fixe.perche(new V3(0, 0.79, -0.06), new V3(0, 0.72, -0.1), 0.008, ACIER, "metal", 4);
  // Le fil tendu à 1 m devant, à 25 cm du sol, entre deux piquets ; il remonte à la détente.
  for (const s of [-1, 1]) fixe.perche(new V3(s * 1, -0.05, 1), new V3(s * 1, 0.32, 1), 0.016, BOIS.ecorce, "mat", 4);
  fixe.perche(new V3(-1, 0.25, 1), new V3(1, 0.25, 1), 0.0025, 0x9a9a9a, "metal", 3);
  fixe.perche(new V3(0.15, 0.25, 1), new V3(0, 0.72, -0.1), 0.0022, 0x9a9a9a, "metal", 3);
  touffe(fixe, 0.6, 0.4, aleat, 3, 0.22);
  touffe(fixe, -0.7, 1.2, aleat, 3, 0.2);
  const arme = new Assemblage(242);
  arbaleteSurTube(arme, true);
  const pris = new Assemblage(243);
  arbaleteSurTube(pris, false);
  const g = fixe.groupe();
  g.add(marque(arme.groupe(), "siArme", true), marque(pris.groupe(), "siArme", false));
  return g;
}

/** Les modèles de ce fichier, pour le registre (index.ts). */
export function modelesMeublesNeufs(): [objet: string, usage: UsageModele, fabrique: FabriqueModele][] {
  return [
    ["cuiseur_solaire", "sol", cuiseur],
    ["bacs_tri", "sol", bacsTri],
    ["rampe_led", "sol", rampe],
    ["moulin_jerricans", "sol", moulin],
    ["arbalete_garde", "sol", arbaleteGarde],
  ];
}
