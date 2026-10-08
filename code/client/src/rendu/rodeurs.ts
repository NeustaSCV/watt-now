// « Au loin, des silhouettes aux yeux blancs » (moment-vitrine n° 1, Book 21 §5.1.2) : la nuit, sur son terrain,
// quelques Éteints rôdent au-delà de la clôture, dans la lisière. Pur décor : ils n'entrent jamais (les vrais
// Éteints viennent du serveur, attirés par la signature).

import * as THREE from "three";
import { TERRAIN_TAILLE } from "../../../commun/src/regles.ts";
import { VueEteint } from "./eteint.ts";

const T = TERRAIN_TAILLE;

interface Rodeur {
  vue: VueEteint;
  /** Avancement le long du tour du terrain (0 à 1), et sens de la marche. */
  t: number;
  vitesse: number;
  ecart: number;
}

/** Un point sur un grand anneau autour du terrain, à `ecart` mètres au-delà de la clôture. */
function surLeTour(t: number, ecart: number): { x: number; z: number; o: number } {
  const a = t * Math.PI * 2;
  const r = T / 2 + ecart;
  const x = T / 2 + Math.cos(a) * r * 1.05;
  const z = T / 2 + Math.sin(a) * r * 1.05;
  return { x, z, o: Math.atan2(-Math.sin(a), Math.cos(a)) };
}

export class Rodeurs {
  readonly objet = new THREE.Group();
  private readonly rodeurs: Rodeur[] = [];

  constructor() {
    for (let i = 0; i < 3; i++) {
      const t = 0.15 + i * 0.29;
      const ecart = 7 + i * 3;
      const p = surLeTour(t, ecart);
      const vue = new VueEteint({ id: 900 + i, x: p.x, z: p.z, o: p.o, etat: "errant" });
      this.rodeurs.push({ vue, t, vitesse: (i % 2 ? -1 : 1) * (0.0016 + i * 0.0004), ecart });
      this.objet.add(vue.objet);
    }
    this.objet.visible = false;
  }

  /** `nuit` : de 0 à 1 ; ils n'apparaissent que dans le noir. */
  animer(dt: number, nuit: number, surSonTerrain: boolean): void {
    this.objet.visible = surSonTerrain && nuit > 0.6;
    if (!this.objet.visible) return;
    for (const r of this.rodeurs) {
      r.t = (r.t + r.vitesse * dt + 1) % 1;
      const p = surLeTour(r.t, r.ecart);
      r.vue.maj({ id: 0, x: p.x, z: p.z, o: r.vitesse > 0 ? p.o : p.o + Math.PI, etat: "errant" });
      r.vue.animer(dt);
    }
  }
}
