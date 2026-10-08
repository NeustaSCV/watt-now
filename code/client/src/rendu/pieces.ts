// Les pièces partagées entre installations et vestiges (2026-10-08) : la même roue de vélo sur le pédalier et sur
// le vieux vélo de la ferme, la même batterie posée sur le banc et trouvée dans l'herbe, le même panneau solaire
// sur son chevalet et tombé de l'auvent (Book 21 §5.2.5 : un seul modèle par objet).

import * as THREE from "three";
import { Assemblage, NOIR, V, V3, X, Y, Z, placer, surface } from "./assemblage.ts";

/** Une roue de vélo d'axe z, centrée sur l'origine : pneu, jante, rayons, moyeu. */
export function roueVelo(c: Assemblage, rayon: number, pneu = 0x2b2b2b, jante = 0x9a968c): void {
  c.ajouter(new THREE.TorusGeometry(rayon, 0.026, 5, 22), pneu, "mat", 0.03);
  c.ajouter(new THREE.TorusGeometry(rayon - 0.03, 0.01, 3, 22), jante, "metal");
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const s = i % 2 === 0 ? 1 : -1;
    c.perche(new V3(0, 0, s * 0.02), new V3(Math.cos(a) * (rayon - 0.035), Math.sin(a) * (rayon - 0.035), 0), 0.0035, 0xb0aca2, "metal", 3);
  }
  c.ajouter(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 6).rotateX(Math.PI / 2), 0x55524d, "metal");
}

/** Une batterie de voiture : bac noir, couvercle, bouchons des éléments, bornes, poignée, étiquette. */
export function batterieVoiture(c: Assemblage): void {
  c.boite(0x2b2b2b, "mat", 0.34, 0.18, 0.2, 0, 0.09, 0);
  c.boite(0x353535, "mat", 0.345, 0.03, 0.205, 0, 0.195, 0);
  for (let i = 0; i < 6; i++) c.ajouter(placer(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 6), -0.12 + i * 0.048, 0.215, 0.04), 0x4a4744, "mat");
  for (const [x, couleur] of [[-0.12, 0xc8362b], [0.12, 0x3a3836]] as const) {
    c.ajouter(placer(new THREE.CylinderGeometry(0.016, 0.018, 0.03, 6), x, 0.225, -0.05), 0x8f8a80, "metal");
    c.ajouter(placer(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 6), x, 0.24, -0.05), couleur, "mat");
  }
  c.plaque([V(-0.1, 0.05), V(0.1, 0.05), V(0.1, 0.14), V(-0.1, 0.14)], surface(new V3(0, 0, 0.1), X, Y, Z), 0xd8ccb0, "mat", 0.003);
  c.plaque([V(-0.1, 0.11), V(0.1, 0.11), V(0.1, 0.14), V(-0.1, 0.14)], surface(new V3(0, 0, 0.1), X, Y, Z), 0xa8645a, "mat", 0.005);
  c.ajouter(placer(new THREE.TorusGeometry(0.09, 0.008, 3, 8, Math.PI), 0, 0.21, 0), NOIR, "mat");
}

/** Le panneau photovoltaïque (cadre d'alu, cellules en damier, boîte de jonction), à plat, face vers +y. */
export function modulePanneau(c: Assemblage): void {
  c.boite(0xb9bcc0, "metal", 1.1, 0.04, 0.7, 0, 0, 0);
  const dessus = surface(new V3(0, 0.021, 0), X, Z, Y);
  c.plaque([V(-0.53, -0.33), V(0.53, -0.33), V(0.53, 0.33), V(-0.53, 0.33)], dessus, 0xd8dde4, "metal", 0.001);
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 4; j++) {
      const u = -0.44 + i * 0.176;
      const v = -0.24 + j * 0.16;
      c.plaque([V(u - 0.083, v - 0.075), V(u + 0.083, v - 0.075), V(u + 0.083, v + 0.075), V(u - 0.083, v + 0.075)], dessus, (i + j) % 3 === 0 ? 0x24405e : 0x1f3550, "verre", 0.003);
    }
  }
  c.boite(0x2b2b2b, "mat", 0.12, 0.04, 0.08, 0, -0.04, 0.2);
}
