// La décharge du terrain (P-001) : un tas d'ordures de l'Âge de l'Abondance. Sacs-poubelle crevés, une carcasse de
// frigo, des pneus, un cageot ; et, posés dessus, les petits objets qui ont remonté (leur nombre suit l'état).
// Passe de finition (2026-10-08) : le tout monté dans un assemblage à couleurs par sommet (assemblage.ts) — terre
// mêlée de gravats, sacs bosselés et noués, frigo couché porte ouverte, pneus à bande de roulement, cageot à claires-
// voies, un pan de bâche, des cartons, des bouteilles ; chaque trouvaille est un petit objet reconnaissable.

import * as THREE from "three";
import { aleatoire } from "../../../commun/src/terrain.ts";
import { PALETTE } from "./materiaux.ts";
import { Assemblage, BOIS, SOL_PLAT, V3, bosseler, placer, tache, touffe } from "./assemblage.ts";

const SAC_NOIR = 0x1f2124;
const SAC_VERT = 0x2a5a36;
const CARTON = 0xa88a5c;

/** Un sac-poubelle crevé : une panse bosselée, le nœud, des déchets répandus par l'accroc. */
function sac(c: Assemblage, x: number, y: number, z: number, r: number, couleur: number, aleat: () => number): void {
  const g = bosseler(new THREE.IcosahedronGeometry(r, 1), r * 0.14, aleat).scale(1.1, 0.72, 1);
  c.ajouter(placer(g, x, y, z, 0, aleat() * 6, (aleat() - 0.5) * 0.4), couleur, "verre", 0.04);
  c.ajouter(placer(new THREE.ConeGeometry(r * 0.25, r * 0.45, 5), x + r * 0.2, y + r * 0.72, z), couleur, "tole", 0.04);
  for (let i = 0; i < 3; i++) {
    const a = aleat() * Math.PI * 2;
    const d = r * (1 + aleat() * 0.5);
    c.ajouter(placer(new THREE.BoxGeometry(0.08 + aleat() * 0.08, 0.02, 0.06), x + Math.cos(a) * d, y - r * 0.45, z + Math.sin(a) * d, 0, aleat() * 3, (aleat() - 0.5) * 0.5), [0xd8d2b8, 0xc8362b, 0x7a8fa8][i]!, "mat");
  }
}

/** Une trouvaille posée sur le tas : chacune est un petit objet de l'Abondance, d'une seule finition. */
const TROUVAILLES: ((c: Assemblage, aleat: () => number) => void)[] = [
  // Une boîte de conserve à l'étiquette rouge.
  (c) => c.ajouterDegrade(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 8, 3), (p) => (Math.abs(p.y) > 0.045 ? 0xb8b4ac : 0xc8362b), "tole"),
  // Un téléphone à l'écran fêlé.
  (c) => {
    c.boite(0x2b2b2b, "tole", 0.09, 0.012, 0.17, 0, 0, 0);
    c.boite(0x3d4a5a, "tole", 0.075, 0.004, 0.14, 0, 0.007, 0);
  },
  // Une bouteille de plastique écrasée.
  (c) => c.ajouterDegrade(new THREE.CylinderGeometry(0.05, 0.06, 0.24, 7, 3).scale(1, 1, 0.6).rotateZ(Math.PI / 2), (p) => (p.x > 0.1 ? 0x2f6fa4 : 0x9cc8d8), "verre"),
  // Une batterie de perceuse.
  (c) => {
    c.boite(0xd8a83a, "tole", 0.12, 0.08, 0.09, 0, 0, 0);
    c.boite(0x2b2b2b, "tole", 0.12, 0.03, 0.09, 0, -0.05, 0);
  },
  // Un grille-pain cabossé.
  (c) => {
    c.boite(0xd6d2ca, "tole", 0.24, 0.16, 0.13, 0, 0, 0);
    for (const z of [-0.03, 0.03]) c.boite(0x2b2b2b, "tole", 0.16, 0.005, 0.02, 0, 0.081, z);
  },
  // Un seau de plastique jaune.
  (c) => c.ajouter(new THREE.CylinderGeometry(0.11, 0.08, 0.2, 9, 1), 0xe0b040, "tole", 0.03),
  // Une boîte de céréales décolorée.
  (c) => c.ajouterDegrade(new THREE.BoxGeometry(0.16, 0.24, 0.06), (p) => (p.y > 0.05 ? 0xe8c46a : 0xd8ccb0), "mat"),
  // Une télécommande.
  (c) => {
    c.boite(0x2b2b2b, "tole", 0.05, 0.02, 0.17, 0, 0, 0);
    c.boite(0xc8362b, "tole", 0.015, 0.006, 0.015, 0, 0.012, -0.06);
  },
  // Une bobine de câble orange.
  (c) => c.ajouter(new THREE.TorusGeometry(0.09, 0.03, 4, 10).rotateX(Math.PI / 2), 0xe8743a, "tole", 0.04),
  // Un pot de peinture.
  (c) => c.ajouterDegrade(new THREE.CylinderGeometry(0.08, 0.08, 0.13, 9, 2), (p) => (p.y > 0.05 ? 0x6b8f6a : 0xc9ccd0), "tole"),
  // Un nain de jardin renversé.
  (c) => {
    c.ajouterDegrade(new THREE.ConeGeometry(0.06, 0.24, 7).rotateZ(Math.PI / 2), (p) => (p.x > 0.04 ? 0xc8362b : p.x > -0.04 ? 0xf0c8a0 : 0x2f6fa4), "mat");
  },
  // Une chaussure de sport.
  (c) => {
    c.boite(0xe8e4dc, "mat", 0.26, 0.04, 0.1, 0, -0.03, 0);
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.22, 0.08, 0.09, 2, 1, 1), 0.01, aleatoire(9)), -0.02, 0.02, 0), 0x4a8ac2, "mat");
  },
];

export function decharge(): { groupe: THREE.Group; trouvailles: THREE.Group } {
  const aleat = aleatoire(404);
  const c = new Assemblage(404);
  c.occlusion = 0.5;
  c.forceOcclusion = 0.35;
  // Le tas de terre et de gravats, bas et large ; la terre est mêlée de débris clairs.
  const tas = bosseler(new THREE.SphereGeometry(1.9, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0.06, aleat).scale(1, 0.34, 1);
  c.ajouterDegrade(tas, (p) => {
    const b = Math.sin(p.x * 5.3 + p.z * 2.1) + Math.sin(p.z * 6.1 - p.x * 3.7);
    return b > 1.2 ? 0x8a8070 : b < -1.1 ? 0x55473a : p.y < 0.12 && b > 0.4 ? PALETTE.herbeSombre : 0x6b5a45;
  });
  c.plaque(tache(0, 0, 2.6, 2.3, aleat, 14), SOL_PLAT, 0x5a4e40, "sol", 0.01);
  // Des sacs-poubelle noirs et verts, crevés.
  for (let i = 0; i < 7; i++) {
    const a = aleat() * Math.PI * 2;
    const r = 0.4 + aleat() * 1.2;
    const h = Math.sqrt(Math.max(0, 1 - (r / 1.9) ** 2)) * 0.65;
    sac(c, Math.cos(a) * r, h + 0.12, Math.sin(a) * r, 0.26 + aleat() * 0.1, i % 3 === 0 ? SAC_VERT : SAC_NOIR, aleat);
  }
  // La carcasse d'un frigo couché sur le dos, porte arrachée à demi ouverte, l'intérieur jauni.
  const frigo = new THREE.Matrix4().compose(new V3(-0.85, 0.42, 0.3), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, 0.6, 0.06)), new V3(1, 1, 1));
  c.repere = frigo;
  c.boite(0xd8d4c8, "tole", 0.66, 0.5, 1.45, 0, 0, 0);
  c.boite(0xb8b098, "tole", 0.56, 0.02, 1.33, 0, 0.255, 0);
  c.boite(0x8a8070, "tole", 0.5, 0.02, 0.02, 0, 0.26, -0.2);
  c.boite(0xd8d4c8, "tole", 0.66, 0.06, 1.4, -0.42, 0.42, 0.02, 0, 0, 1.2);
  c.boite(0x9a9890, "metal", 0.03, 0.05, 0.3, -0.62, 0.62, 0.3, 0, 0, 1.2);
  c.plaque(tache(0.1, 0.3, 0.2, 0.15, aleat), { point: (u, v) => new V3(u, 0.252, v), dehors: new V3(0, -1, 0) }, PALETTE.rouille, "mat", 0.002);
  c.repere = null;
  // Des pneus empilés, de travers, à la bande de roulement marquée.
  for (let i = 0; i < 3; i++) {
    const pneu = new THREE.TorusGeometry(0.31, 0.12, 6, 14).rotateX(Math.PI / 2);
    c.ajouterDegrade(placer(pneu, 1.15 + (aleat() - 0.5) * 0.08, 0.12 + i * 0.23, -0.6 + i * 0.05, (aleat() - 0.5) * 0.12, 0, (aleat() - 0.5) * 0.12), (p) =>
      Math.round(Math.atan2(p.z + 0.6, p.x - 1.15) * 7) % 2 === 0 ? 0x232323 : 0x2e2e2e,
    );
  }
  // Un cageot à claires-voies, de travers sur le tas.
  c.repere = new THREE.Matrix4().compose(new V3(0.2, 0.62, 0.9), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0.4, -0.1)), new V3(1, 1, 1));
  for (const s of [-1, 1]) {
    for (const y of [-0.09, 0.03]) c.boite(BOIS.clair, "mat", 0.5, 0.07, 0.015, 0, y, s * 0.19);
    for (const y of [-0.09, 0.03]) c.boite(BOIS.moyen, "mat", 0.015, 0.07, 0.38, s * 0.25, y, 0);
    c.boite(BOIS.sombre, "mat", 0.04, 0.3, 0.04, s * 0.23, -0.03, 0.17);
    c.boite(BOIS.sombre, "mat", 0.04, 0.3, 0.04, s * 0.23, -0.03, -0.17);
  }
  c.boite(BOIS.gris, "mat", 0.5, 0.012, 0.38, 0, -0.17, 0);
  c.repere = null;
  // Un pan de bâche bleue pris sous les sacs, des cartons affaissés, des bouteilles.
  c.plaque([new THREE.Vector2(-0.3, -1.1), new THREE.Vector2(0.6, -1.25), new THREE.Vector2(0.75, -0.7), new THREE.Vector2(0.1, -0.55), new THREE.Vector2(-0.35, -0.75)], { point: (u, v) => new V3(u, 0.55 - Math.hypot(u, v) * 0.18, v), dehors: new V3(0, 1, 0) }, 0x2f6fa4, "toile", 0.02);
  for (let i = 0; i < 3; i++) {
    const a = 2 + i * 1.3 + aleat() * 0.5;
    const r = 1.2 + aleat() * 0.6;
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.4, 0.22, 0.32, 2, 1, 2), 0.03, aleat), Math.cos(a) * r, 0.12 + (1.9 - r) * 0.2, Math.sin(a) * r, 0, aleat() * 3, (aleat() - 0.5) * 0.4), i === 1 ? 0x9a7d52 : CARTON, "mat", 0.05);
  }
  for (let i = 0; i < 4; i++) {
    const a = aleat() * Math.PI * 2;
    const r = 1.6 + aleat() * 0.6;
    c.ajouter(placer(new THREE.CylinderGeometry(0.035, 0.04, 0.22, 6).rotateZ(Math.PI / 2), Math.cos(a) * r, 0.05, Math.sin(a) * r, 0, aleat() * 3, 0), i % 2 ? 0x3a7a4a : 0x9cc8d8, "verre", 0.03);
  }
  // L'herbe et les orties qui ont pris au pied du tas.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + aleat() * 0.4;
    touffe(c, Math.cos(a) * (1.9 + aleat() * 0.3), Math.sin(a) * (1.9 + aleat() * 0.3), aleat, 3, 0.45);
  }
  const g = c.groupe();

  // Les trouvailles : de petits objets reconnaissables, un par objet remonté (jusqu'à 12), posés sur le tas.
  const trouvailles = new THREE.Group();
  TROUVAILLES.forEach((construire, i) => {
    const t = new Assemblage(500 + i);
    construire(t, aleat);
    const objet = t.groupe();
    const a = (i / 12) * Math.PI * 2 + aleat() * 0.4;
    const r = 0.3 + aleat() * 1.0;
    const h = Math.sqrt(Math.max(0, 1 - (r / 1.9) ** 2)) * 0.65;
    objet.position.set(Math.cos(a) * r, h + 0.08, Math.sin(a) * r);
    objet.rotation.set((aleat() - 0.5) * 0.5, aleat() * 6, (aleat() - 0.5) * 0.5);
    objet.visible = false;
    trouvailles.add(objet);
  });
  g.add(trouvailles);
  return { groupe: g, trouvailles };
}

/** Montre autant de trouvailles que d'objets remontés. */
export function majTrouvailles(trouvailles: THREE.Group, nombre: number): void {
  trouvailles.children.forEach((m, i) => (m.visible = i < nombre));
}
