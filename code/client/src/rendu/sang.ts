// Le sang (Book 21 §3.5 et §5.2.6, validé) : un peu plus marqué que la moyenne — éclaboussures et traces
// ROUGES, au sol et sur les vêtements — mais AUCUNE plaie visible, aucun démembrement.

import * as THREE from "three";

const ROUGES = [0x8f1414, 0xa31a1a, 0x7a1010, 0xb22222];
/** Les traces au sol restent un moment, puis s'effacent. */
const DUREE_TRACE = 150;
const MAX_TRACES = 160;

interface Goutte {
  maillage: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
}

interface Trace {
  maillage: THREE.Mesh;
  age: number;
}

const geoGoutte = new THREE.SphereGeometry(0.035, 5, 4);
/** Une tache irrégulière : un disque aux bords cabossés. */
function geoTache(alea: () => number): THREE.BufferGeometry {
  const n = 11;
  const points: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 0.6 + alea() * 0.5;
    points.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  return new THREE.ShapeGeometry(new THREE.Shape(points)).rotateX(-Math.PI / 2);
}

export class Sang {
  private readonly groupe = new THREE.Group();
  private readonly gouttes: Goutte[] = [];
  private readonly traces: Trace[] = [];
  private readonly formes: THREE.BufferGeometry[];
  private readonly matGoutte = new THREE.MeshBasicMaterial({ color: 0x9a1515 });

  constructor(scene: THREE.Scene) {
    this.groupe.userData.poste = "sang";
    scene.add(this.groupe);
    let s = 17;
    const alea = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    this.formes = Array.from({ length: 6 }, () => geoTache(alea));
  }

  /** Un coup qui porte : une gerbe de gouttes, puis des taches au sol. `force` : 1 pour un coup, 2 pour une tête. */
  eclabousser(x: number, z: number, hauteur: number, force: number): void {
    const n = Math.round(10 * force);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geoGoutte, this.matGoutte);
      m.position.set(x, hauteur, z);
      const a = Math.random() * Math.PI * 2;
      const v = 1.2 + Math.random() * 2.2 * force;
      this.gouttes.push({ maillage: m, vx: Math.cos(a) * v, vy: 1 + Math.random() * 2.5, vz: Math.sin(a) * v });
      this.groupe.add(m);
    }
    this.tacher(x, z, 0.35 + 0.25 * force);
  }

  /** Une tache au sol (flaque sous un corps, gouttes d'un blessé). */
  tacher(x: number, z: number, taille: number): void {
    const mat = new THREE.MeshStandardMaterial({
      color: ROUGES[Math.floor(Math.random() * ROUGES.length)]!,
      roughness: 0.35,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const m = new THREE.Mesh(this.formes[Math.floor(Math.random() * this.formes.length)]!, mat);
    m.position.set(x, 0.045 + Math.random() * 0.01, z);
    m.rotation.y = Math.random() * Math.PI * 2;
    m.scale.setScalar(taille * (0.7 + Math.random() * 0.6));
    m.receiveShadow = true;
    this.groupe.add(m);
    this.traces.push({ maillage: m, age: 0 });
    while (this.traces.length > MAX_TRACES) this.retirer(this.traces.shift()!);
  }

  /** Effacer tout (changement de lieu). */
  vider(): void {
    for (const t of this.traces) this.retirer(t);
    this.traces.length = 0;
    for (const g of this.gouttes) this.groupe.remove(g.maillage);
    this.gouttes.length = 0;
  }

  animer(dt: number): void {
    for (let i = this.gouttes.length - 1; i >= 0; i--) {
      const g = this.gouttes[i]!;
      g.vy -= 9.8 * dt;
      g.maillage.position.x += g.vx * dt;
      g.maillage.position.y += g.vy * dt;
      g.maillage.position.z += g.vz * dt;
      if (g.maillage.position.y <= 0.05) {
        // La goutte touche le sol : une petite tache.
        if (Math.random() < 0.45) this.tacher(g.maillage.position.x, g.maillage.position.z, 0.09 + Math.random() * 0.08);
        this.groupe.remove(g.maillage);
        this.gouttes.splice(i, 1);
      }
    }
    for (let i = this.traces.length - 1; i >= 0; i--) {
      const t = this.traces[i]!;
      t.age += dt;
      // Le sang sèche et fonce, puis s'efface.
      const mat = t.maillage.material as THREE.MeshStandardMaterial;
      if (t.age > DUREE_TRACE * 0.7) mat.opacity = Math.max(0, 0.92 * (1 - (t.age - DUREE_TRACE * 0.7) / (DUREE_TRACE * 0.3)));
      if (t.age > 8 && mat.roughness < 0.8) mat.roughness = Math.min(0.85, mat.roughness + dt * 0.02);
      if (t.age >= DUREE_TRACE) {
        this.retirer(t);
        this.traces.splice(i, 1);
      }
    }
  }

  private retirer(t: Trace): void {
    this.groupe.remove(t.maillage);
    (t.maillage.material as THREE.Material).dispose();
  }
}

/** Le sac tombé à l'effondrement : couché dans l'herbe, une bretelle en l'air. */
export function creerSacTombe(aMoi: boolean): THREE.Group {
  const g = new THREE.Group();
  const toile = new THREE.MeshStandardMaterial({ color: 0x8a3b2a, roughness: 0.85, flatShading: true });
  const corps = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.55), toile);
  corps.position.y = 0.12;
  corps.rotation.y = 0.4;
  corps.castShadow = true;
  const poche = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.18), toile);
  poche.position.set(0.05, 0.12, 0.3);
  poche.rotation.y = 0.4;
  const bretelle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 4, 10, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2b2b2b }));
  bretelle.position.set(-0.1, 0.25, -0.05);
  bretelle.rotation.set(0.3, 0.4, 0);
  g.add(corps, poche, bretelle);
  // Le sien se repère de loin : un petit anneau au sol.
  if (aMoi) {
    const anneau = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.62, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xe8c547, transparent: true, opacity: 0.7, depthWrite: false }),
    );
    anneau.position.y = 0.04;
    g.add(anneau);
  }
  return g;
}

/** Des objets jetés par terre : un petit tas qui laisse deviner ce qu'il contient (bois, pierres, ferraille…). */
export function creerTas(contenu: Partial<Record<string, number>>): THREE.Group {
  const g = new THREE.Group();
  const mat = (couleur: number) => new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.9, flatShading: true });
  const types = Object.keys(contenu).slice(0, 5);
  types.forEach((type, i) => {
    const a = (i / Math.max(1, types.length)) * Math.PI * 2;
    const r = types.length > 1 ? 0.16 : 0;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    let m: THREE.Mesh;
    if (type === "buche" || type === "branche") {
      m = new THREE.Mesh(new THREE.CylinderGeometry(type === "buche" ? 0.06 : 0.025, type === "buche" ? 0.06 : 0.025, 0.45, 6).rotateZ(Math.PI / 2), mat(0x6b4a32));
      m.position.set(x, type === "buche" ? 0.06 : 0.03, z);
      m.rotation.y = a;
    } else if (type === "pierre" || type === "charbon_bois") {
      m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09), mat(type === "pierre" ? 0x8f8a80 : 0x2b2b2b));
      m.position.set(x, 0.07, z);
    } else if (/barre|cle|tournevis|marteau|hache|couteau|lame|ressort|cadre|roue|chaine/.test(type)) {
      m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.05), mat(0x6e6a63));
      m.position.set(x, 0.03, z);
      m.rotation.y = a + 0.6;
    } else if (/bache|chiffons|corde|pansement/.test(type)) {
      m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), mat(type === "bache" ? 0x2f6fa4 : 0xc9b98f));
      m.scale.y = 0.45;
      m.position.set(x, 0.05, z);
    } else {
      m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.12), mat(0xa07c48));
      m.position.set(x, 0.06, z);
      m.rotation.y = a;
    }
    m.castShadow = true;
    g.add(m);
  });
  return g;
}
