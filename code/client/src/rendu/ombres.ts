// Moins d'appels dans la passe d'ombre, même image (2026-10-09). La carte d'ombre du soleil couvre 48 × 48 m autour
// du point regardé, bien plus que l'écran (≈ 20 × 16 m de sol en paysage) : three.js y dessinait chaque objet de
// cette zone, même ceux dont l'ombre tombe hors de l'écran. Sur le terrain, c'était 196 appels sur 326.
// Ici, un objet n'entre dans la passe d'ombre que si son ombre PEUT tomber dans le champ de la caméra : on fait glisser
// sa sphère englobante le long des rayons du soleil jusque sous le sol, et on l'écarte seulement si tout ce trajet est
// hors du champ (du même côté d'un des plans de la caméra). Rien ne change à l'image : la carte d'ombre garde sa taille
// et sa finesse ; seuls disparaissent des objets dont l'ombre n'aurait de toute façon pas été vue.

import * as THREE from "three";

const sphere = new THREE.Sphere();
const bas = new THREE.Vector3();
const matrice = new THREE.Matrix4();
/** Profondeur sous le sol jusqu'où l'on suit l'ombre (berges, mare un peu creusée). */
const SOUS_LE_SOL = 1;
/**
 * Marge autour de la sphère, en mètres : le filtrage de l'ombre (PCF) lit quelques texels voisins (≈ 5 cm chacun) et
 * le décalage normal déplace la lecture ; une ombre qui tombe juste au bord de l'écran compte donc encore.
 */
const MARGE = 0.5;

export class FrustumOmbre extends THREE.Frustum {
  /** Le champ de la caméra de l'image. */
  private readonly vue = new THREE.Frustum();
  /** La direction des rayons de la lumière (normée, vers le bas). */
  private readonly rayons = new THREE.Vector3(0, -1, 0);
  /** Faux : comportement d'origine de three.js (le mode mesure peut comparer). */
  actif = true;
  /** Le dernier préparé : les lots (lots.ts) s'en servent pour trier leurs objets un par un dans la passe d'ombre. */
  static courant: FrustumOmbre | null = null;

  /** À chaque image, avant le rendu : la caméra et la lumière du moment. */
  preparer(camera: THREE.Camera, lumiere: THREE.DirectionalLight): void {
    camera.updateMatrixWorld();
    matrice.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.vue.setFromProjectionMatrix(matrice);
    lumiere.updateMatrixWorld();
    lumiere.target.updateMatrixWorld();
    this.rayons.setFromMatrixPosition(lumiere.target.matrixWorld).sub(bas.setFromMatrixPosition(lumiere.matrixWorld)).normalize();
    this.cameraOmbre = lumiere.shadow.camera;
    FrustumOmbre.courant = this;
  }

  /** La caméra de la passe d'ombre du soleil (celle des lampes ne suit pas cette règle). */
  cameraOmbre: THREE.Camera | null = null;

  override intersectsObject(objet: THREE.Object3D): boolean {
    if (!super.intersectsObject(objet)) return false;
    // La même sphère que three.js (Frustum.intersectsObject).
    const o = objet as THREE.Mesh & { boundingSphere?: THREE.Sphere | null };
    if (o.boundingSphere) sphere.copy(o.boundingSphere).applyMatrix4(o.matrixWorld);
    else if (o.geometry?.boundingSphere) sphere.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
    else return true;
    return this.ombreDansLeChamp(sphere);
  }

  /** L'ombre de cette sphère (repère du monde) peut-elle tomber dans le champ de la caméra ? */
  ombreDansLeChamp(s: THREE.Sphere): boolean {
    if (!this.actif || this.rayons.y > -0.05) return true;
    // Le trajet de l'ombre : du centre de la sphère jusque sous le sol, le long des rayons.
    const t = (s.center.y + s.radius + SOUS_LE_SOL) / -this.rayons.y;
    if (t <= 0) return true;
    bas.copy(s.center).addScaledVector(this.rayons, t);
    const r = s.radius + MARGE;
    for (const plan of this.vue.planes) {
      if (plan.distanceToPoint(s.center) < -r && plan.distanceToPoint(bas) < -r) return false;
    }
    return true;
  }
}
