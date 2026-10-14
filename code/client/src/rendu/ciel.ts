// Le cycle du jour et de la nuit (Book 18 §2, Book 21 §5.3.3) : une seule lumière directionnelle,
// le soleil le jour, la lune la nuit. La nuit est « américaine » : bleutée mais lisible.

import * as THREE from "three";

interface Etape {
  heure: number;
  ciel: number;
  hemiCiel: number;
  hemiSol: number;
  hemiIntensite: number;
  astre: number;
  astreIntensite: number;
  exposition: number;
}

// Le script de couleur du cycle de 24 minutes (Book 21 §5.4.1). Valeurs à caler sur planche.
const ETAPES: Etape[] = [
  { heure: 0, ciel: 0x22304e, hemiCiel: 0x6680b8, hemiSol: 0x262e40, hemiIntensite: 1.35, astre: 0xaec4ea, astreIntensite: 1.15, exposition: 1.1 },
  { heure: 4.8, ciel: 0x22304e, hemiCiel: 0x6680b8, hemiSol: 0x262e40, hemiIntensite: 1.35, astre: 0xaec4ea, astreIntensite: 1.15, exposition: 1.1 },
  { heure: 5.8, ciel: 0x6c6f8e, hemiCiel: 0x8a8fb0, hemiSol: 0x3a3a40, hemiIntensite: 1.1, astre: 0xff9e7a, astreIntensite: 0.9, exposition: 1.05 },
  { heure: 6.6, ciel: 0xe8bc98, hemiCiel: 0xf0d2b8, hemiSol: 0x4d5a3a, hemiIntensite: 1.0, astre: 0xffb27a, astreIntensite: 1.7, exposition: 1.05 },
  { heure: 8.5, ciel: 0xc9d8e4, hemiCiel: 0xdfe8f0, hemiSol: 0x4d5a3a, hemiIntensite: 1.15, astre: 0xffdcae, astreIntensite: 2.6, exposition: 1.05 },
  { heure: 12.5, ciel: 0xcfe0ec, hemiCiel: 0xe6eef4, hemiSol: 0x55633f, hemiIntensite: 1.2, astre: 0xfff3e0, astreIntensite: 3.0, exposition: 1.0 },
  { heure: 17.5, ciel: 0xd2dae0, hemiCiel: 0xe4e6e0, hemiSol: 0x4d5a3a, hemiIntensite: 1.1, astre: 0xffe0b0, astreIntensite: 2.5, exposition: 1.05 },
  { heure: 19.6, ciel: 0xe2a07c, hemiCiel: 0xe8b090, hemiSol: 0x40402e, hemiIntensite: 0.95, astre: 0xff8f52, astreIntensite: 1.4, exposition: 1.05 },
  { heure: 20.6, ciel: 0x4f5880, hemiCiel: 0x7480aa, hemiSol: 0x2a3038, hemiIntensite: 1.15, astre: 0x9aa6d0, astreIntensite: 0.9, exposition: 1.05 },
  { heure: 21.6, ciel: 0x22304e, hemiCiel: 0x6680b8, hemiSol: 0x262e40, hemiIntensite: 1.35, astre: 0xaec4ea, astreIntensite: 1.15, exposition: 1.1 },
  { heure: 24, ciel: 0x22304e, hemiCiel: 0x6680b8, hemiSol: 0x262e40, hemiIntensite: 1.35, astre: 0xaec4ea, astreIntensite: 1.15, exposition: 1.1 },
];

const GRIS = new THREE.Color(0x9aa3ab);
/** La teinte de l'ambiance d'une pièce noire (Book 23 §4.5) : un reste de jour froid, par les portes et les fentes. */
const NOIR_INTERIEUR = new THREE.Color(0x56658a);
const NOIR_SOL = new THREE.Color(0x1c1f26);
/** Ce que l'obscurité locale retire : la part de lumière ambiante et de soleil éteinte, la part de teinte froide. */
export const OBSCURITE = { ambiance: 0.6, astre: 0.88, teinte: 0.8 };

/**
 * Ce que les autres modules du rendu ont besoin de savoir de la lumière de l'image (les yeux des Éteints) :
 * `noir` de 0 (plein jour dehors) à 1 (la nuit, ou une pièce noire), et le point regardé.
 */
export const AMBIANCE = { noir: 0, x: 0, z: 0 };
const a = new THREE.Color();
const b = new THREE.Color();
function melanger(c1: number, c2: number, t: number, cible: THREE.Color): THREE.Color {
  return cible.copy(a.setHex(c1)).lerp(b.setHex(c2), t);
}

export class Ciel {
  private readonly hemi: THREE.HemisphereLight;
  private readonly astre: THREE.DirectionalLight;
  private readonly scene: THREE.Scene;
  private readonly rendu: THREE.WebGLRenderer;
  /** Part de nuit (0 le jour, 1 en pleine nuit) : sert aux lumières artificielles. */
  nuit = 0;
  /**
   * L'obscurité locale (0 dehors, 1 dans une pièce noire : hangar, bureaux, chambre froide, atelier de la
   * Coopérative). Elle se pose par-dessus l'heure, sans toucher au cycle du jour : soleil et ciel presque éteints.
   */
  obscurite = 0;

  constructor(scene: THREE.Scene, rendu: THREE.WebGLRenderer, hemi: THREE.HemisphereLight, astre: THREE.DirectionalLight) {
    this.scene = scene;
    this.rendu = rendu;
    this.hemi = hemi;
    this.astre = astre;
  }

  /** Applique l'heure de jeu (0 à 24) ; `cible` est le point que regarde la caméra. */
  appliquer(heure: number, cible: THREE.Vector3, nuages = 0): void {
    let i = 0;
    while (i < ETAPES.length - 2 && ETAPES[i + 1]!.heure <= heure) i++;
    const e1 = ETAPES[i]!;
    const e2 = ETAPES[i + 1]!;
    const t = Math.min(1, Math.max(0, (heure - e1.heure) / (e2.heure - e1.heure)));
    const lisse = t * t * (3 - 2 * t);

    const ciel = melanger(e1.ciel, e2.ciel, lisse, new THREE.Color());
    // Un ciel couvert ou pluvieux : gris, plus bas, la brume se rapproche (Book 13).
    if (nuages > 0) {
      // Le gris suit la clarté du moment : clair le jour, sombre la nuit.
      const clarte = ciel.getHSL({ h: 0, s: 0, l: 0 }).l;
      ciel.lerp(GRIS.clone().multiplyScalar(Math.min(1, clarte * 1.4)), nuages * 0.75);
    }
    (this.scene.background as THREE.Color).copy(ciel);
    if (this.scene.fog) {
      const brume = this.scene.fog as THREE.Fog;
      brume.color.copy(ciel);
      brume.near = 80 - nuages * 38;
      brume.far = 135 - nuages * 45;
    }
    melanger(e1.hemiCiel, e2.hemiCiel, lisse, this.hemi.color);
    melanger(e1.hemiSol, e2.hemiSol, lisse, this.hemi.groundColor);
    this.hemi.intensity = e1.hemiIntensite + (e2.hemiIntensite - e1.hemiIntensite) * lisse;
    melanger(e1.astre, e2.astre, lisse, this.astre.color);
    this.astre.intensity = (e1.astreIntensite + (e2.astreIntensite - e1.astreIntensite) * lisse) * (1 - 0.72 * nuages);
    this.hemi.intensity *= 1 - 0.18 * nuages;
    this.rendu.toneMappingExposure = e1.exposition + (e2.exposition - e1.exposition) * lisse;
    if (this.obscurite > 0) {
      // Une pièce noire : il ne reste qu'un fond de lumière froide, qui découpe à peine les volumes.
      const o = this.obscurite;
      this.hemi.color.lerp(NOIR_INTERIEUR, o * OBSCURITE.teinte);
      this.hemi.groundColor.lerp(NOIR_SOL, o * OBSCURITE.teinte);
      this.hemi.intensity *= 1 - OBSCURITE.ambiance * o;
      this.astre.intensity *= 1 - OBSCURITE.astre * o;
    }

    // Le soleil se lève à l'est (−x) et se couche à l'ouest (+x). La nuit, la lune est haute. Au-dessus du point regardé
    // (0.10 : sur la grève du phare, il est 9 m plus bas ; la carte d'ombre le suit).
    const jour = heure >= 5.5 && heure <= 20.8;
    if (jour) {
      const f = Math.min(1, Math.max(0, (heure - 5.5) / 15.3));
      const angle = Math.PI * f;
      this.astre.position.set(cible.x - Math.cos(angle) * 32, cible.y + 6 + Math.sin(angle) * 30, cible.z - 14);
    } else {
      this.astre.position.set(cible.x + 12, cible.y + 30, cible.z - 18);
    }
    this.astre.target.position.copy(cible);

    this.nuit = heure >= 21 || heure < 5 ? 1 : heure >= 19.5 ? (heure - 19.5) / 1.5 : heure < 6.5 ? (6.5 - heure) / 1.5 : 0;
    AMBIANCE.noir = Math.max(this.nuit, this.obscurite);
    AMBIANCE.x = cible.x;
    AMBIANCE.z = cible.z;
  }
}
