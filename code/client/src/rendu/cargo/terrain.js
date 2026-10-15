// Le cap au-delà du lot du phare (60 × 50 m) : la lande et la falaise qui continuent à l'ouest et à l'est, puis la côte
// qui s'en va vers le nord, pour que les plans larges ne montrent pas le bord du lot. Mêmes profils de falaise que le
// modèle du phare (batiment/phare/modele.js), reproduits ici.

import * as THREE from "three";
import { Chantier, matiere, aleatoire } from "../../batiments/commun/atelier.js";

const PROFIL_D = [0, 0.6, 1.3, 2.0, 2.8, 3.6, 5.0];
const PROFIL_Y = [0, -1.6, -4.2, -6.6, -8.4, -9.6, -10.4];
const CRIQUE_D = [0, 0.6, 1.5, 2.3, 3.0, 3.6];
const CRIQUE_Y = [0, -2.0, -5.0, -7.4, -8.4, -8.7];

function bordFalaise(x) {
  const t = Math.min(1, Math.max(0, (x - 10) / 4));
  let base = 12.6 + (16.6 - 12.6) * t * t * (3 - 2 * t);
  // au loin, la côte tourne vers le nord : le cap s'avance seul dans la mer
  if (x < -55) base -= (-55 - x) ** 2 * 0.0035 + (-55 - x) * 0.05;
  if (x > 55) base -= (x - 55) ** 2 * 0.003 + (x - 55) * 0.04;
  return base + 0.35 * Math.sin(0.9 * x + 1) + 0.2 * Math.sin(2.3 * x) + (Math.abs(x) > 34 ? 1.2 * Math.sin(0.21 * x) : 0);
}

/** La grève de la crique qui sort du lot à l'ouest, et se resserre jusqu'à disparaître. */
function crique(x) {
  if (x > -30) return 0;
  return 0.67 * Math.min(1, Math.max(0, (x + 52) / 22));
}

function profil(x) {
  const k = crique(x);
  const Dc = [...CRIQUE_D, 3.6 + 8];
  const Yc = [...CRIQUE_Y, -9.05];
  return { D: PROFIL_D.map((d, i) => d * (1 - k) + Dc[i] * k), Y: PROFIL_Y.map((y, i) => y * (1 - k) + Yc[i] * k), k };
}

const HERBE = 0x7d8a50;
const HERBE_SOMBRE = 0x66713f;
const LICHEN = 0x9c9566;
const GRANITS = [0x8a867c, 0x7b776f, 0x6e6b63, 0x958f80];
const MOUILLE = 0x4c4943;
const GALETS = 0x8c8475;

export function prolongerTerrain() {
  const c = new Chantier(4242);
  const al = aleatoire(515);
  const ent = (a, b) => a + (b - a) * al();
  const mat = matiere(1);

  // Les deux côtés : un maillage à facettes, du fond de la lande jusqu'au pied de la falaise
  for (const sens of [-1, 1]) {
    const X = [];
    for (let x = 30; x <= 240; x += x < 60 ? 1.0 : x < 110 ? 2.5 : 6) X.push(sens * x);
    if (sens < 0) X.reverse();
    const V = X.map((x0) => {
      const { D, Y } = profil(x0);
      const bz = bordFalaise(x0);
      const bord = Math.abs(Math.abs(x0) - 30) < 0.01;
      const rang = [[x0, 0, -320], [x0, 0, Math.min(11.5, bz - 1.1)]];
      for (let n = 0; n < D.length; n++) {
        const falaise = n >= 1 && n <= 5;
        const x = bord ? x0 : x0 + (falaise ? ent(-0.35, 0.35) : 0);
        const y = Y[n] + (falaise && !bord ? ent(-0.4, 0.4) : 0);
        rang.push([x, y, bz + D[n] + (falaise && !bord ? ent(-0.3, 0.3) : 0)]);
      }
      rang.push([x0, -12.5, bz + D[D.length - 1] + 6]);
      return rang;
    });
    const pos = [];
    const couleurs = [];
    const coul = new THREE.Color();
    const herbe = new THREE.Color(HERBE);
    const loin = new THREE.Color(0x323a26);
    const teinteLande = (p) => herbe.clone().lerp(loin, Math.min(1, Math.max(0, (Math.hypot(p[0], p[2]) - 45) / 160)));
    const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
    for (let i = 0; i < X.length - 1; i++) {
      for (let j = 0; j < V[i].length - 1; j++) {
        const a = V[i][j], b = V[i + 1][j], cc = V[i][j + 1], d = V[i + 1][j + 1];
        for (let t of [[a, cc, b], [b, cc, d]]) {
          // face vers le haut et vers le large
          A.fromArray(t[0]); B.fromArray(t[1]); C.fromArray(t[2]);
          const n = B.sub(A).cross(C.sub(A));
          if (n.y + n.z * 0.6 < 0) t = [t[0], t[2], t[1]];
          const ym = (t[0][1] + t[1][1] + t[2][1]) / 3;
          const kc = crique((t[0][0] + t[1][0]) / 2);
          if (ym > -0.25) {
            // la lande : un dégradé qui s'assombrit au loin (pas de facettes tirées au hasard : elles feraient des rayures)
            for (const p of t) {
              const h = teinteLande(p);
              pos.push(...p);
              couleurs.push(h.r, h.g, h.b);
            }
            continue;
          }
          let h;
          if (ym > -1.6) h = al() < 0.5 ? LICHEN : GRANITS[0];
          else if (ym > -7.6) h = GRANITS[Math.floor(al() * GRANITS.length)];
          else h = kc > 0.25 ? GALETS : MOUILLE;
          coul.setHex(h).offsetHSL(0, 0, (al() - 0.5) * 0.05);
          for (const p of t) {
            pos.push(...p);
            couleurs.push(coul.r, coul.g, coul.b);
          }
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    c.poser(g, mat, 0xffffff, {}, { crasse: false, nuance: 0 });
    // poser() reteint : on remet nos couleurs de facettes
    const lot = c.lots.get(mat);
    lot[lot.length - 1].setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
    g.dispose();
  }
  // Le nord du lot : la lande qui continue derrière le phare
  {
    const pos = [];
    const couleurs = [];
    const herbe = new THREE.Color(HERBE);
    const loin = new THREE.Color(0x323a26);
    const Z = [-25, -35, -50, -75, -110, -160, -230, -320];
    const teinte = (x, z) => herbe.clone().lerp(loin, Math.min(1, Math.max(0, (Math.hypot(x, z) - 45) / 160)));
    for (let j = 0; j < Z.length - 1; j++) {
      for (let x = -30; x < 30; x += 10) {
        const q = [[x, -0.01, Z[j]], [x + 10, -0.01, Z[j]], [x, -0.01, Z[j + 1]], [x + 10, -0.01, Z[j + 1]]];
        for (const t of [[q[0], q[1], q[2]], [q[1], q[3], q[2]]]) for (const p of t) {
          pos.push(...p);
          const h = teinte(p[0], p[2]);
          couleurs.push(h.r, h.g, h.b);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    c.poser(g, mat, 0xffffff, {}, { crasse: false, nuance: 0 });
    const lot = c.lots.get(mat);
    lot[lot.length - 1].setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
    g.dispose();
  }

  // Des rochers et des ajoncs, pour que la lande hors du lot ne soit pas un tapis
  const ROCHE = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 90; i++) {
    const sens = al() < 0.5 ? -1 : 1;
    const x = sens * ent(31, 75);
    const z = ent(-40, bordFalaise(x) - 1.5);
    const s = ent(0.4, 1.4);
    c.poser(ROCHE, mat, GRANITS[i % 4], { x, y: -0.15, z, e: [s * ent(1, 1.6), s * ent(0.4, 0.8), s * ent(0.9, 1.4)], ry: al() * 3 }, { nuance: 0.1 });
  }
  for (let i = 0; i < 70; i++) {
    const x = ent(-28, 28);
    const z = ent(-60, -26);
    const s = ent(0.3, 1.1);
    c.poser(ROCHE, mat, i % 3 ? 0x4f5a34 : GRANITS[1], { x, y: -0.1, z, e: [s * 1.3, s * 0.6, s], ry: al() * 3 }, { nuance: 0.12 });
  }
  // Les écueils au large de la pointe
  for (const [x, z, s] of [[24, 30, 2.2], [31, 27, 1.4], [-38, 30, 1.8], [-46, 26, 1.2], [15, 42, 1.0]]) {
    c.poser(ROCHE, mat, GRANITS[2], { x, y: -9.6, z, e: [s * 1.5, s * 0.9, s * 1.2], ry: al() * 3 }, { nuance: 0.1 });
  }
  const o = c.construire();
  o.name = "le cap, hors du lot";
  return o;
}

/** Des collines lointaines, en silhouette sur l'horizon (une seule matière, sans détail). */
export function collinesLointaines() {
  const c = new Chantier(77);
  const mat = matiere(1);
  const al = aleatoire(91);
  const X = [];
  for (let a = -1.25; a <= 1.25; a += 0.05) X.push(a);
  const pos = [];
  for (const cote of [-1, 1]) {
    for (let i = 0; i < X.length - 1; i++) {
      const r = 430;
      const a1 = Math.PI / 2 * cote + X[i] * 0.6;
      const a2 = Math.PI / 2 * cote + X[i + 1] * 0.6;
      const h1 = 6 + 10 * Math.abs(Math.sin(i * 0.7)) + al() * 4;
      const h2 = 6 + 10 * Math.abs(Math.sin((i + 1) * 0.7)) + al() * 4;
      const p1 = [Math.sin(a1) * r, -10, -Math.cos(a1) * r * 0.4 - 60];
      const p2 = [Math.sin(a2) * r, -10, -Math.cos(a2) * r * 0.4 - 60];
      pos.push(...p1, p2[0], h2 - 10, p2[2], p2[0], p2[1], p2[2]);
      pos.push(...p1, p1[0], h1 - 10, p1[2], p2[0], h2 - 10, p2[2]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, 0x232a35, {}, { crasse: false, nuance: 0 });
  return c.construire();
}
