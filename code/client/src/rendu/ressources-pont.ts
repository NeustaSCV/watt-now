// Le vrac de la route du pont à l'écran (plan 0.10, chantier H ; commun/src/ressources-pont.ts) : ce qu'on ramasse par
// terre et que le modèle ne dessine pas (il dessine les points de fouille, le moteur, les bancs de la cale) : un câble
// de cuivre dénudé, une carte électronique tombée de l'armoire, un bloc de cellules éventré, un bidon d'huile. Petits,
// dans les teintes de l'estuaire (sel, rouille), un maillage par finition (rendu/ressources.ts les pose).

import * as THREE from "three";
import { Assemblage, V3, placer, touffe } from "./assemblage.ts";

/** Les maillages d'un point de vrac de la route du pont (vide pour un autre type). */
export function vracPont(type: string, id: number, aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): THREE.Mesh[] {
  const c = new Assemblage(id);
  c.occlusion = 0.12;
  switch (type) {
    case "pont_cuivre": {
      // Deux bouts de câble gainé, arrachés, le cuivre qui brille aux bouts.
      for (let i = 0; i < 2; i++) {
        const a = new V3(-0.42 + i * 0.1, 0.02, -0.12 + i * 0.2);
        const m = new V3(0, 0.03, 0.05 - i * 0.12);
        const b = new V3(0.4 - i * 0.05, 0.02, 0.14 - i * 0.2);
        const gaine = i === 0 ? 0x2a2a2a : 0x3f5f8a;
        c.perche(a, m, 0.016, gaine, "mat", 5);
        c.perche(m, b, 0.016, gaine, "mat", 5);
        c.perche(b, new V3(b.x + 0.07, 0.02, b.z + 0.02), 0.011, 0xc8783a, "metal", 4);
      }
      touffe(c, 0.15, -0.15, aleat, 2, 0.2);
      break;
    }
    case "pont_resistances": {
      // Une carte verte, ses composants en relief, un nappe de fils.
      c.boite(0x2f6a3a, "mat", 0.22, 0.012, 0.15, 0, 0.008, 0, 0, aleat() * 3, 0);
      for (let i = 0; i < 6; i++) c.boite(i % 2 ? 0xd8b46a : 0x6a4a3a, "mat", 0.03, 0.012, 0.012, -0.07 + (i % 3) * 0.06, 0.02, -0.04 + Math.floor(i / 3) * 0.06);
      c.perche(new V3(0.1, 0.012, 0.05), new V3(0.26, 0.01, 0.12), 0.006, 0xc8783a, "metal", 3);
      break;
    }
    case "pont_cellules": {
      // Le boîtier éventré d'une batterie « connectée », ses cellules cylindriques qui roulent à côté.
      c.boite(0xd8d4c8, "mat", 0.2, 0.05, 0.12, 0, 0.025, 0, 0, 0.4, 0);
      for (let i = 0; i < 3; i++) c.ajouter(placer(new THREE.CylinderGeometry(0.018, 0.018, 0.065, 8).rotateZ(Math.PI / 2), 0.08 + i * 0.04, 0.018, 0.1 + i * 0.03, 0, i * 0.5, 0), i === 1 ? 0x3a6ab8 : 0x2a8a5a, "metal");
      break;
    }
    case "pont_huile": {
      // Un bidon d'huile rond, vert, au bouchon jaune, et sa flaque.
      c.ajouter(placer(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 10), 0, 0.15, 0), 0x2f4a3a, "tole");
      c.ajouter(placer(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 6), 0.04, 0.315, 0), 0xc8a030, "mat");
      c.boite(0x1e1c18, "verre", 0.4, 0.004, 0.28, -0.05, 0.003, 0.12, 0, 0.4, 0);
      break;
    }
    default:
      return [];
  }
  return c.maillages(ombre);
}
