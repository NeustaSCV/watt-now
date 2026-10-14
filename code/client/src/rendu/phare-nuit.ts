// Le phare la nuit, à l'écran (0.10, K2, choisi par le porteur après l'essai sur l'iPhone) : ce qui montre la lanterne
// allumée et le cargo qui approche, là où la caméra regarde (la lanterne, à 28 m, est bien au-dessus du cadre).
//
// - Le balayage : la trace du faisceau au sol, deux longs coins de lumière qui partent du pied de la tour et tournent avec
//   la lentille (un tour en 10 s : elle passe sur le joueur toutes les 5 s). Posée sur le relief (`solPhare` : le plateau,
//   la falaise, la mer, le pont de l'épave), recalculée à chaque image (une soixantaine de points). Seulement lanterne
//   allumée, la nuit. Un appel de dessin, sans lumière de plus (additif, sans éclairage).
// - Les feux du cargo : rouge à bâbord, vert à tribord, deux blancs (le mât, la poupe), en points de taille fixe à l'écran,
//   et leur reflet sur la mer, tourné vers la caméra. Seulement pendant l'approche (client/src/phare-scene.ts). Deux appels.

import * as THREE from "three";
import { jeu } from "../../../commun/src/phare.ts";
import { LUMIERES_MODELE } from "../../../commun/src/phare-modele.ts";
import type { FeuxCargo } from "../phare-scene.ts";
import { solPhare } from "./phare.ts";

/** Le pied de la tour, d'où part le balayage (sous la lanterne du modèle), dans le repère du jeu. */
const LANTERNE = LUMIERES_MODELE.find((l) => l.nature.startsWith("lanterne"))!;
const PIED = jeu(LANTERNE.x, LANTERNE.z);
/** Le balayage : un tour en `tourS` secondes ; chaque coin de `r0` à `long` m, large de `w0` à `w1` m de part et d'autre. */
export const BALAYAGE = { tourS: 10, r0: 2.5, long: 46, w0: 1.2, w1: 9, rangs: 10 } as const;
/** La surface de la mer (le balayage ne descend pas au fond de l'eau). */
const MER = -9;
/** La mer sous les feux du cargo. */
const Y_FEUX = -9;

const N = BALAYAGE.rangs + 1;

function texture(dessiner: (g: CanvasRenderingContext2D, l: number, h: number) => void, l: number, h: number): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  const g = c.getContext("2d");
  if (g) dessiner(g, l, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const additif = (o: THREE.MeshBasicMaterialParameters) =>
  new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, ...o });

/** Le balayage : deux coins dans un seul maillage (positions recalculées à chaque image). */
function creerBalayage(): THREE.Mesh {
  // La trace : forte près de la tour, qui s'éteint au bout ; douce sur les bords.
  const carte = texture(
    (g, l, h) => {
      const long = g.createLinearGradient(0, 0, 0, h);
      long.addColorStop(0, "rgba(255,255,255,0)");
      long.addColorStop(0.08, "rgba(255,255,255,0.6)");
      long.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = long;
      g.fillRect(0, 0, l, h);
      g.globalCompositeOperation = "destination-in";
      const large = g.createLinearGradient(0, 0, l, 0);
      large.addColorStop(0, "rgba(0,0,0,0)");
      large.addColorStop(0.5, "rgba(0,0,0,1)");
      large.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = large;
      g.fillRect(0, 0, l, h);
    },
    32,
    128,
  );
  const geo = new THREE.BufferGeometry();
  const uv: number[] = [];
  const index: number[] = [];
  for (let c = 0; c < 2; c++) {
    const base = c * N * 3;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < 3; j++) uv.push(j / 2, 1 - i / BALAYAGE.rangs);
      if (i === 0) continue;
      for (let j = 0; j < 2; j++) {
        const a = base + (i - 1) * 3 + j;
        const b = base + i * 3 + j;
        index.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(2 * N * 3 * 3), 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  const m = new THREE.Mesh(geo, additif({ map: carte, color: 0xffd98a, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.name = "balayage du phare";
  m.frustumCulled = false;
  m.renderOrder = 2;
  m.visible = false;
  m.userData.angle = 0;
  return m;
}

/** Pose les deux coins du balayage à l'angle `angle`, sur le relief (avec ou sans l'épave). */
export function poserBalayage(m: THREE.Mesh, angle: number, epave: boolean): void {
  const pos = m.geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let c = 0; c < 2; c++) {
    const a = angle + c * Math.PI;
    const dx = Math.sin(a);
    const dz = Math.cos(a);
    for (let i = 0; i < N; i++) {
      const r = BALAYAGE.r0 + ((BALAYAGE.long - BALAYAGE.r0) * i) / BALAYAGE.rangs;
      const w = BALAYAGE.w0 + ((BALAYAGE.w1 - BALAYAGE.w0) * r) / BALAYAGE.long;
      for (let j = 0; j < 3; j++) {
        const s = (j - 1) * w;
        const x = PIED.x + dx * r + dz * s;
        const z = PIED.z + dz * r - dx * s;
        pos.setXYZ(c * N * 3 + i * 3 + j, x, Math.max(solPhare(x, z, epave), MER) + 0.08, z);
      }
    }
  }
  pos.needsUpdate = true;
}

/** Les feux du cargo (un nuage de quatre points) et leur reflet sur la mer. */
function creerFeux(): THREE.Group {
  const groupe = new THREE.Group();
  groupe.name = "feux du cargo";
  groupe.visible = false;
  const disque = texture(
    (g, l) => {
      const r = g.createRadialGradient(l / 2, l / 2, 0, l / 2, l / 2, l / 2);
      r.addColorStop(0, "rgba(255,255,255,1)");
      r.addColorStop(0.25, "rgba(255,255,255,0.85)");
      r.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, l, l);
    },
    64,
    64,
  );
  // Dans le repère du cargo (cap vers + z, vu d'en haut) : bâbord (rouge) en + x, tribord (vert) en − x, le mât, la poupe.
  const points = new THREE.BufferGeometry();
  points.setAttribute("position", new THREE.Float32BufferAttribute([3.6, 4, 12, -3.6, 4, 12, 0, 11, 13, 0, 6, -16], 3));
  points.setAttribute("color", new THREE.Float32BufferAttribute([1, 0.2, 0.15, 0.2, 1, 0.45, 1, 0.97, 0.88, 1, 0.97, 0.88], 3));
  const feux = new THREE.Points(
    points,
    new THREE.PointsMaterial({ size: 30, sizeAttenuation: false, vertexColors: true, map: disque, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
  );
  feux.name = "feux";
  feux.frustumCulled = false;
  const reflet = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 18).rotateX(-Math.PI / 2).translate(0, 0, 9),
    additif({
      map: texture(
        (g, l, h) => {
          const r = g.createLinearGradient(0, 0, 0, h);
          r.addColorStop(0, "rgba(255,240,210,0.55)");
          r.addColorStop(1, "rgba(255,240,210,0)");
          g.fillStyle = r;
          g.fillRect(0, 0, l, h);
        },
        8,
        64,
      ),
    }),
  );
  reflet.name = "reflet";
  reflet.frustumCulled = false;
  groupe.add(feux, reflet);
  return groupe;
}

const nuits = new WeakMap<THREE.Object3D, { balayage: THREE.Mesh; feux: THREE.Group }>();

/** Ce que le phare montre la nuit (dans le groupe du décor : rendu/phare.ts, creerPhare). */
export function creerNuitPhare(groupe: THREE.Group): void {
  const balayage = creerBalayage();
  const feux = creerFeux();
  groupe.add(balayage, feux);
  nuits.set(groupe, { balayage, feux });
}

/** Ce que la nuit montre à cette image (rendu/phare.ts, animerPhare). */
export interface NuitPhare {
  nuit: boolean;
  lanterne: boolean;
  epave: boolean;
  feux: FeuxCargo | null;
}

/** À chaque image : le balayage tourne (lanterne allumée, la nuit) ; les feux du cargo avancent ; leur reflet regarde la caméra. */
export function animerNuitPhare(groupe: THREE.Object3D, dt: number, lacet: number, n: NuitPhare): void {
  const o = nuits.get(groupe);
  if (!o) return;
  const b = o.balayage;
  b.visible = n.nuit && n.lanterne;
  if (b.visible) {
    b.userData.angle = ((b.userData.angle as number) + (dt * Math.PI * 2) / BALAYAGE.tourS) % (Math.PI * 2);
    poserBalayage(b, b.userData.angle as number, n.epave);
  }
  const f = o.feux;
  f.visible = n.feux !== null;
  if (!n.feux) return;
  f.position.set(n.feux.x, Y_FEUX, n.feux.z);
  const feux = f.getObjectByName("feux")!;
  feux.rotation.y = n.feux.cap;
  // Le reflet s'étire du cargo vers la caméra (au sud-est par défaut : `lacet`).
  const reflet = f.getObjectByName("reflet")!;
  reflet.position.y = 0.05;
  reflet.rotation.y = Math.atan2(Math.cos(lacet), Math.sin(lacet));
}

/** Pour les tests : ce que montre la nuit d'un décor. */
export function nuitDe(groupe: THREE.Object3D): { balayage: THREE.Mesh; feux: THREE.Group } | undefined {
  return nuits.get(groupe);
}
