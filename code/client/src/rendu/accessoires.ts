// Mouler les accessoires sur le corps (Book 18 §4.1) : à partir de la surface du corps habillé au repos,
// on taille un tablier qui épouse le buste, un bandana à la mesure du crâne, une bandoulière qui passe
// devant et derrière le torse. Tout est en mètres, dans le repère du personnage (y en haut, z devant).

import * as THREE from "three";

export class Mesure {
  private readonly points: THREE.Vector3[];

  constructor(points: THREE.Vector3[]) {
    this.points = points;
  }

  private proches(y: number, dy: number, filtre: (p: THREE.Vector3) => boolean = () => true): THREE.Vector3[] {
    return this.points.filter((p) => Math.abs(p.y - y) <= dy && filtre(p));
  }

  /** Le point le plus en avant du corps à cette hauteur, autour de x. */
  devant(y: number, x = 0, dx = 0.03, dy = 0.02): number {
    let z = -Infinity;
    for (const p of this.proches(y, dy, (q) => Math.abs(q.x - x) <= dx)) z = Math.max(z, p.z);
    return Number.isFinite(z) ? z : 0;
  }

  /** Le point le plus en arrière du corps à cette hauteur, autour de x. */
  derriere(y: number, x = 0, dx = 0.03, dy = 0.02): number {
    let z = Infinity;
    for (const p of this.proches(y, dy, (q) => Math.abs(q.x - x) <= dx)) z = Math.min(z, p.z);
    return Number.isFinite(z) ? z : 0;
  }

  /** Le haut du crâne. */
  sommet(): number {
    let y = -Infinity;
    for (const p of this.points) y = Math.max(y, p.y);
    return y;
  }

  /** La tranche horizontale du corps à cette hauteur (près de l'axe) : centre et demi-axes. */
  tranche(y: number, dy = 0.012, xMax = 0.2): { cx: number; cz: number; rx: number; rz: number } {
    const b = new THREE.Box3();
    for (const p of this.proches(y, dy, (q) => Math.abs(q.x) <= xMax)) b.expandByPoint(p);
    if (b.isEmpty()) return { cx: 0, cz: 0, rx: 0.1, rz: 0.1 };
    return { cx: (b.min.x + b.max.x) / 2, cz: (b.min.z + b.max.z) / 2, rx: (b.max.x - b.min.x) / 2, rz: (b.max.z - b.min.z) / 2 };
  }
}

/** Un bandeau (bandana, lanière de lampe, ruban) : une bande à la mesure de la tête, à cette hauteur. */
export function bandeau(m: Mesure, y: number, hauteur: number, ecart: number, materiau: THREE.Material, inclinaison = 0, xMax = 0.2): THREE.Mesh {
  const t = m.tranche(y, 0.012, xMax);
  const geo = new THREE.CylinderGeometry(1, 1, hauteur, 28, 1, true);
  geo.scale(t.rx + ecart, 1, t.rz + ecart);
  geo.rotateX(inclinaison);
  geo.translate(t.cx, y, t.cz);
  return new THREE.Mesh(geo, doubleFace(materiau));
}

/**
 * Un pan de tissu ou de cuir qui épouse le devant du corps, de y0 (haut) à y1 (bas), sur une demi-largeur
 * donnée ; `courbure` arrondit le pan sur les côtés. `ecart` : son épaisseur au-dessus du corps.
 */
export function pan(m: Mesure, y0: number, y1: number, demiLargeur: number, materiau: THREE.Material, o: { courbure?: number; ecart?: number; evase?: number; lignes?: number; colonnes?: number } = {}): THREE.Mesh {
  const lignes = o.lignes ?? 10;
  const colonnes = o.colonnes ?? 8;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= lignes; i++) {
    const v = i / lignes;
    const y = y0 + (y1 - y0) * v;
    // Le pan tombe droit : il suit le point le plus en avant sur toute sa largeur.
    const largeur = demiLargeur * (1 + (o.evase ?? 0) * v);
    const z0 = m.devant(y, 0, largeur * 0.8) + (o.ecart ?? 0.012);
    for (let j = 0; j <= colonnes; j++) {
      const x = -largeur + (2 * largeur * j) / colonnes;
      positions.push(x, y, z0 - (o.courbure ?? 1) * x * x);
    }
  }
  for (let i = 0; i < lignes; i++) {
    for (let j = 0; j < colonnes; j++) {
      const a = i * (colonnes + 1) + j;
      const b = a + colonnes + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, doubleFace(materiau));
}

/** Une bandoulière : d'une épaule à la hanche opposée, devant puis derrière le torse. */
export function bandouliere(m: Mesure, epaule: THREE.Vector3, hanche: THREE.Vector3, rayon: number, materiau: THREE.Material): THREE.Mesh {
  const devant: THREE.Vector3[] = [];
  const derriere: THREE.Vector3[] = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = epaule.x + (hanche.x - epaule.x) * t;
    const y = epaule.y + (hanche.y - epaule.y) * t;
    devant.push(new THREE.Vector3(x, y, m.devant(y, x, 0.04) + rayon * 1.5));
    derriere.push(new THREE.Vector3(x, y, m.derriere(y, x, 0.04) - rayon * 1.5));
  }
  // Par-dessus l'épaule, puis sous le bras : la boucle se referme.
  const chemin = new THREE.CatmullRomCurve3([...devant, ...derriere.reverse()], true, "centripetal");
  return new THREE.Mesh(new THREE.TubeGeometry(chemin, 64, rayon, 6, true), materiau);
}

function doubleFace(m: THREE.Material): THREE.Material {
  const c = m.clone();
  c.side = THREE.DoubleSide;
  return c;
}
