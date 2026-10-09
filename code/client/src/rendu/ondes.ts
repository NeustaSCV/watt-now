// L'onde d'un bruit qu'on entend sans le voir (0.7.2, proposition « visibilité par pièce » §1.6) : trois arcs qui
// s'élargissent au sol, au point de passage du son (la porte, le mur), ouverts vers le personnage. Orangée pour un
// bruit, rouge pour ce qui alarme (des coups dans la porte, une présence toute proche). Elle dit d'où vient le bruit et
// quel bruit c'est, jamais qui le fait ni où il est exactement.
//
// Un seul appel de dessin pour toutes les ondes (un maillage instancié, en mélange additif : on l'éteint en noircissant
// sa couleur), et aucun quand il n'y en a pas.

import * as THREE from "three";

const MAX = 36;
/** Durée de vie d'un arc (s), et l'écart entre les trois arcs d'une onde. */
const VIE = 1.1;
const ECART = 0.2;
const ORANGE = new THREE.Color(0xffa040);
const ROUGE = new THREE.Color(0xff3a26);

interface Arc {
  x: number;
  z: number;
  /** L'angle vers lequel l'arc s'ouvre (vers le personnage). */
  angle: number;
  age: number;
  force: number;
  alarme: boolean;
}

export class Ondes {
  readonly objet: THREE.InstancedMesh;
  private arcs: Arc[] = [];
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly e = new THREE.Vector3();
  private readonly p = new THREE.Vector3();
  private readonly c = new THREE.Color();

  constructor() {
    // Un arc de 140°, centré sur +x, à plat ; rayon 1 (on l'agrandit avec l'échelle).
    const g = new THREE.RingGeometry(0.9, 1, 28, 1, -1.22, 2.44).rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    this.objet = new THREE.InstancedMesh(g, mat, MAX);
    this.objet.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.objet.setColorAt(0, new THREE.Color(0));
    this.objet.count = 0;
    this.objet.visible = false;
    this.objet.frustumCulled = false;
    this.objet.renderOrder = 3;
    this.objet.name = "ondes";
  }

  /** Une onde au point (x, z), ouverte vers `vers` (le personnage). `force` : de 0 à 1. */
  ajouter(x: number, z: number, vers: { x: number; z: number }, force: number, alarme: boolean): void {
    // RingGeometry tourne dans le sens trigonométrique en (x, -z) une fois couché : l'angle se prend en -z.
    const angle = Math.atan2(-(vers.z - z), vers.x - x);
    for (let i = 0; i < 3; i++) {
      if (this.arcs.length >= MAX) this.arcs.shift();
      this.arcs.push({ x, z, angle, age: -i * ECART, force, alarme });
    }
  }

  vider(): void {
    this.arcs = [];
    this.objet.count = 0;
    this.objet.visible = false;
  }

  animer(dt: number): void {
    if (this.arcs.length === 0) return;
    for (const a of this.arcs) a.age += dt;
    this.arcs = this.arcs.filter((a) => a.age < VIE);
    let n = 0;
    for (const a of this.arcs) {
      if (a.age < 0) continue;
      const k = a.age / VIE;
      const r = 0.3 + k * (0.9 + a.force * 0.6);
      this.q.setFromAxisAngle(this.e.set(0, 1, 0), a.angle);
      this.m.compose(this.p.set(a.x, 0.09, a.z), this.q, this.e.set(r, 1, r));
      this.objet.setMatrixAt(n, this.m);
      // Mélange additif : l'intensité, c'est la couleur.
      const i = (1 - k) * (0.35 + 0.65 * a.force) * (a.alarme ? 1.1 : 0.9);
      this.objet.setColorAt(n, this.c.copy(a.alarme ? ROUGE : ORANGE).multiplyScalar(i));
      n++;
    }
    this.objet.count = n;
    this.objet.visible = n > 0;
    this.objet.instanceMatrix.needsUpdate = true;
    if (this.objet.instanceColor) this.objet.instanceColor.needsUpdate = true;
  }
}
