// L'anneau de progression d'un geste (fouiller, ramasser, couper, fabriquer…) : il se remplit autour de la cible
// (Book 08 §3). En 0.8.2 (chantier H, R23), on ne le voyait pas bien se remplir, surtout en basse qualité : il était
// jaune pâle, posé sur le trait blanc de la visée, au même rayon, et caché par le conteneur qu'on fouille.
// Maintenant : une piste sombre, et un remplissage **bleu vif**, plus large que la visée (il l'entoure), dessiné
// par-dessus le décor (comme la visée) et sans effet de lumière (le même bleu en haute et en basse qualité).

import * as THREE from "three";

/** Le bleu du remplissage : franc sur l'herbe, le béton, la terre et la nuit. */
export const BLEU_PROGRES = 0x2f8cff;
/** L'anneau, en mètres : il entoure la visée d'un geste (rayon 0,5 m) sans la recouvrir. */
export const RAYON_INTERIEUR = 0.56;
export const RAYON_EXTERIEUR = 0.74;
/** Le nombre de pas du remplissage : on ne refait la géométrie qu'à chaque pas. */
const PAS = 60;

export class AnneauProgres extends THREE.Group {
  private readonly remplissage: THREE.Mesh;
  private progresDessine = -1;

  constructor() {
    super();
    const matiere = (couleur: number, opacite: number) =>
      new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: opacite, depthWrite: false, depthTest: false, side: THREE.DoubleSide, toneMapped: false });
    // La piste : tout le tour, sombre, pour que le bleu se lise même sur un sol clair.
    const piste = new THREE.Mesh(new THREE.RingGeometry(RAYON_INTERIEUR - 0.03, RAYON_EXTERIEUR + 0.03, 48).rotateX(-Math.PI / 2), matiere(0x0b1320, 0.55));
    piste.renderOrder = 24;
    this.remplissage = new THREE.Mesh(new THREE.BufferGeometry(), matiere(BLEU_PROGRES, 1));
    this.remplissage.renderOrder = 25;
    this.add(piste, this.remplissage);
    this.position.y = 0.035;
    this.visible = false;
  }

  /** Un geste neuf (ou repris) : le prochain remplissage refait l'anneau, même à la même part. */
  repartir(): void {
    this.progresDessine = -1;
  }

  /** Remplit l'anneau (0 à 1), dans le sens des aiguilles d'une montre depuis le haut de l'écran. */
  remplir(progres: number): void {
    const p = Math.min(1, Math.max(0, progres));
    const pas = Math.round(p * PAS) / PAS;
    if (pas === this.progresDessine) return;
    this.progresDessine = pas;
    this.remplissage.geometry.dispose();
    this.remplissage.geometry = new THREE.RingGeometry(RAYON_INTERIEUR, RAYON_EXTERIEUR, 48, 1, Math.PI / 2, -Math.PI * 2 * Math.max(0.001, pas)).rotateX(-Math.PI / 2);
  }
}
