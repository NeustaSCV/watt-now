// Le cargo de l'Abondance, entier, tel qu'il arrive : le « Prime Abondance », petit porte-conteneurs de la Livraison du
// Jour. Même repère et même avant que l'épave du phare (batiment/phare/modele.js, epave()) : origine au milieu de la
// future cassure, +z local vers la proue, +x local vers la grève (bâbord), y = hauteur du lieu (la mer est à −9).
// Deux moitiés (l'avant, l'arrière) qui se séparent au choc, et trois conteneurs qui basculent.

import * as THREE from "three";
import { Chantier } from "../../batiments/commun/atelier.js";
import { halo, geoCone, materiauFaisceau } from "./effets.js";

export const EPAVE = { x: -3.4, z: 23.75, ry: Math.atan2(-0.26, -0.966) };
const W = 3.2; // demi-largeur
const L_AV = 8.6; // de la cassure à l'étrave
const S_POUPE = -22; // le tableau arrière

// ---------- Les formes (l'avant reprend exactement celles de l'épave) ----------

export function largeur(s) {
  if (s >= 2.6) {
    const t = Math.min(1, (s - 2.6) / (L_AV - 2.6));
    return Math.max(0.06, W * (1 - t ** 1.7));
  }
  if (s >= -16) return W;
  const t = (-16 - s) / 6;
  return W * (1 - 0.16 * t * t);
}
function largeurFonds(s) {
  if (s >= 1.5) {
    const t = Math.min(1, (s - 1.5) / (L_AV - 1.0 - 1.5));
    return Math.max(0.05, W * 0.97 * (1 - t ** 1.5));
  }
  if (s >= -14) return W * 0.97;
  const t = Math.min(1, (-14 - s) / 8);
  return W * 0.97 * (1 - 0.78 * t ** 1.4);
}
function quille(s) {
  if (s >= 3.5) return -9.8 + 4.0 * Math.min(1, (s - 3.5) / (L_AV - 3.5)) ** 1.6;
  if (s >= -16) return -9.8;
  return -9.8 + 1.5 * ((-16 - s) / 6) ** 1.6;
}
export function pont(s) {
  return s >= 0 ? -4.2 + 0.5 * (s / L_AV) ** 2 : -4.2 + 0.35 * (s / 22) ** 2;
}
const FLOTTAISON = -8.2;

function profil(s, cote) {
  const w = largeur(s) * cote;
  const wf = largeurFonds(s) * cote;
  const yk = quille(s);
  const yd = pont(s);
  const yb = Math.min(yk + 0.9, yd - 0.5);
  const yf = Math.max(FLOTTAISON, yb);
  const wFl = wf + ((w - wf) * (yf - yb)) / Math.max(0.01, yd - yb);
  return [[0, yk, s], [wf * 0.72, yk, s], [wf, yb, s], [wFl, yf, s], [w, yd, s], [w, yd + 1.0, s]];
}

// ---------- Matières du cargo (les siennes : un léger « clair de lune » pour que la coque reste lisible) ----------

function matieres(atlas) {
  const base = { vertexColors: true, flatShading: true };
  const M = {
    tole: new THREE.MeshStandardMaterial({ ...base, roughness: 0.62, metalness: 0.25, emissive: 0x131b2b, emissiveIntensity: 1 }),
    peint: new THREE.MeshStandardMaterial({ ...base, roughness: 0.55, metalness: 0.05, emissive: 0x0d1422, emissiveIntensity: 1 }),
    panneaux: new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.7, metalness: 0.1, alphaTest: 0.35, transparent: false, side: THREE.DoubleSide, emissive: 0x0b1220 }),
    vitres: new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide }),
  };
  return M;
}

// ---------- L'atlas : flancs de conteneur, inscriptions, fenêtres ----------

const AL = 1024;
const R = {
  ondule: [0, 0, 256, 128], // tôle ondulée, grise (teintée par les sommets)
  logo: [256, 0, 512, 128], // « ABONDANCE EXPRESS », blanc sur transparent
  livraison: [0, 128, 1024, 128], // « LIVRAISON DU JOUR », blanc sur transparent
  nom: [0, 256, 768, 96], // « PRIME ABONDANCE »
  portes: [768, 256, 256, 256], // les portes d'un conteneur
  fenetres: [0, 352, 512, 64], // une rangée de hublots, allumés ou non (dans la matière « vitres »)
  passerelle: [0, 416, 512, 64], // les vitres de la passerelle, lueur verte des écrans
  cheminee: [512, 352, 256, 128], // le logo de la cheminée
  poupe: [0, 480, 512, 96], // « PRIME ABONDANCE / NASSAU »
  logoBleu: [0, 608, 512, 128], // « ABONDANCE EXPRESS », pour les conteneurs clairs (bleu nuit)
};

function dessinerAtlas() {
  const c = document.createElement("canvas");
  c.width = c.height = AL;
  const g = c.getContext("2d");
  g.clearRect(0, 0, AL, AL);
  const texte = (t, x, y, taille, coul, align = "center", poids = 800, espace = 0) => {
    g.font = `${poids} ${taille}px "Avenir Next Condensed", "Arial Narrow", "Helvetica Neue", Arial, sans-serif`;
    g.fillStyle = coul;
    g.textAlign = align;
    g.textBaseline = "middle";
    if ("letterSpacing" in g) g.letterSpacing = `${espace}px`;
    g.fillText(t, x, y);
    if ("letterSpacing" in g) g.letterSpacing = "0px";
  };
  // La tôle ondulée
  {
    const [x, y, l, h] = R.ondule;
    for (let i = 0; i < l; i += 8) {
      const v = 200 + 40 * Math.sin((i / 8) * Math.PI);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(x + i, y, 8, h);
    }
    // traînées de rouille et de sel
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(90,60,40,${0.05 + (i % 5) * 0.03})`;
      g.fillRect(x + ((i * 53) % l), y + ((i * 29) % 40), 2 + (i % 3), 20 + ((i * 17) % 60));
    }
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(x, y, l, 6);
    g.fillRect(x, y + h - 6, l, 6);
  }
  // Le logo des conteneurs : la flèche de l'Abondance et le nom
  for (const [r, coul] of [[R.logo, "#f4efe2"], [R.logoBleu, "#1d2c46"]]) {
    const [x, y, l, h] = r;
    g.save();
    g.translate(x, y);
    g.strokeStyle = coul;
    g.lineWidth = 9;
    g.beginPath();
    g.arc(52, h / 2, 30, Math.PI * 0.15, Math.PI * 1.75);
    g.stroke();
    g.fillStyle = coul;
    g.beginPath();
    g.moveTo(80, h / 2 - 34);
    g.lineTo(96, h / 2 - 8);
    g.lineTo(66, h / 2 - 10);
    g.fill();
    texte("ABONDANCE", 112, h / 2 - 16, 50, coul, "left", 800, 2);
    texte("EXPRESS", 114, h / 2 + 27, 30, coul, "left", 600, 9);
    g.restore();
  }
  // « LIVRAISON DU JOUR », sur le flanc
  {
    const [x, y, l, h] = R.livraison;
    texte("LIVRAISON DU JOUR", x + l / 2, y + h / 2 + 4, 104, "#f1ede4", "center", 800, 10);
  }
  // Le nom
  {
    const [x, y, l, h] = R.nom;
    texte("PRIME ABONDANCE", x + l / 2, y + h / 2 + 3, 80, "#f1ede4", "center", 800, 6);
  }
  {
    const [x, y, l, h] = R.poupe;
    texte("PRIME ABONDANCE", x + l / 2, y + 32, 52, "#f1ede4", "center", 800, 4);
    texte("NASSAU", x + l / 2, y + 74, 30, "#f1ede4", "center", 600, 8);
  }
  // Les portes d'un conteneur
  {
    const [x, y, l, h] = R.portes;
    for (let i = 0; i < l; i += 10) {
      const v = 205 + 30 * Math.sin((i / 10) * Math.PI);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(x + i, y, 10, h);
    }
    g.fillStyle = "rgba(0,0,0,0.5)";
    g.fillRect(x + l / 2 - 2, y, 4, h);
    g.fillStyle = "rgba(40,40,40,0.8)";
    for (const bx of [0.18, 0.36, 0.64, 0.82]) g.fillRect(x + bx * l - 3, y + 8, 6, h - 16);
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.fillRect(x + 14, y + 14, 70, 24);
  }
  // Les hublots : allumés (jaune chaud), éteints (bleu nuit), au hasard mais toujours les mêmes
  {
    const [x, y, l, h] = R.fenetres;
    const allumes = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];
    for (let i = 0; i < 12; i++) {
      const cx = x + 20 + i * 41;
      const on = allumes[i];
      const d = g.createRadialGradient(cx + 10, y + 30, 1, cx + 10, y + 30, 26);
      d.addColorStop(0, on ? "rgba(255,214,140,1)" : "rgba(60,80,110,0.9)");
      d.addColorStop(0.45, on ? "rgba(255,170,80,0.9)" : "rgba(30,40,60,0.9)");
      d.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = d;
      g.fillRect(cx - 14, y + 4, 48, 52);
      g.fillStyle = on ? "rgba(255,236,190,1)" : "rgba(40,55,80,1)";
      g.fillRect(cx, y + 18, 20, 24);
    }
  }
  // La passerelle : de grandes vitres, la lueur verte et bleue des écrans
  {
    const [x, y, l, h] = R.passerelle;
    for (let i = 0; i < 8; i++) {
      const cx = x + 8 + i * 63;
      g.fillStyle = "rgba(30,60,70,1)";
      g.fillRect(cx, y + 10, 56, 44);
      const d = g.createLinearGradient(0, y + 10, 0, y + 54);
      d.addColorStop(0, "rgba(40,90,90,1)");
      d.addColorStop(1, i % 3 === 1 ? "rgba(140,255,200,1)" : "rgba(80,190,170,1)");
      g.fillStyle = d;
      g.fillRect(cx + 2, y + 30, 52, 22);
    }
  }
  // Le logo de la cheminée : la flèche crème sur fond canard
  {
    const [x, y, l, h] = R.cheminee;
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y + 6, l, 16);
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 12;
    g.beginPath();
    g.arc(x + l / 2, y + h / 2 + 10, 34, Math.PI * 0.15, Math.PI * 1.75);
    g.stroke();
    g.fillStyle = "#e9dfc6";
    g.beginPath();
    g.moveTo(x + l / 2 + 30, y + h / 2 - 32);
    g.lineTo(x + l / 2 + 50, y + h / 2);
    g.lineTo(x + l / 2 + 12, y + h / 2 - 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Un panneau de l'atlas, face vers +z local. */
function panneau(ch, mat, r, pose, l, h, couleur = 0xffffff) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AL);
  ch.poser(g, mat, couleur, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

// ---------- Un conteneur (fermé) ----------

const CL = 6.06;
const CW = 2.44;
const CH = 2.59;
function conteneur(ch, M, couleur, long, pose, logo = 0) {
  ch.repere(pose, () => {
    const fonce = new THREE.Color(couleur).multiplyScalar(0.62).getHex();
    ch.boite(long, CH, CW, couleur, {}, M.tole, { crasse: false, nuance: 0.05 });
    for (const sz of [-1, 1]) {
      panneau(ch, M.panneaux, R.ondule, { z: sz * (CW / 2 + 0.006), ry: sz > 0 ? 0 : Math.PI }, long - 0.2, CH - 0.2, couleur);
      if (logo) panneau(ch, M.panneaux, logo > 0 ? R.logo : R.logoBleu, { z: sz * (CW / 2 + 0.012), ry: sz > 0 ? 0 : Math.PI, y: 0.25 }, Math.min(long - 0.6, 4.2), 1.05);
    }
    for (const sx of [-1, 1]) {
      panneau(ch, M.panneaux, R.portes, { x: sx * (long / 2 + 0.006), ry: sx * Math.PI / 2 }, CW - 0.1, CH - 0.1, couleur);
      for (const sz of [-1, 1]) ch.boite(0.14, CH + 0.02, 0.14, fonce, { x: sx * (long / 2 - 0.07), z: sz * (CW / 2 - 0.07) }, M.tole, { crasse: false });
    }
    for (const y of [-CH / 2 + 0.07, CH / 2 - 0.05]) for (const sz of [-1, 1]) ch.boite(long, 0.12, 0.08, fonce, { y, z: sz * (CW / 2 - 0.03) }, M.tole, { crasse: false });
  });
}

const COULEURS = [0x9a4a32, 0x2f5a7a, 0x3f6a5a, 0xc27a2e, 0x8a8d88, 0x2f6f73, 0xc8362b, 0xd8cfb8, 0x5a4a6a, 0x9a4a32, 0x2f5a7a];

// ---------- La coque d'une moitié ----------

function coque(ch, M, stations, capS, capCote) {
  const tri = (cible, pos, couleur) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    cible.poser(g, M.tole, couleur, {}, { crasse: false, nuance: 0 });
    g.dispose();
  };
  const bande = (i0, i1) => {
    const pos = [];
    for (const cote of [-1, 1]) {
      for (let n = 0; n < stations.length - 1; n++) {
        const A = profil(stations[n], cote);
        const B = profil(stations[n + 1], cote);
        for (let i = i0; i < i1; i++) {
          const q = [A[i], A[i + 1], B[i], B[i + 1]];
          for (const t of [[q[0], q[2], q[1]], [q[1], q[2], q[3]]]) {
            pos.push(...t[0], ...t[1], ...t[2]);
            pos.push(...t[0], ...t[2], ...t[1]);
          }
        }
      }
    }
    return pos;
  };
  tri(ch, bande(0, 3), 0x7a3328); // œuvres vives, rouge antifouling
  tri(ch, bande(3, 5), 0x36557a); // œuvres mortes, bleu nuit
  // le pont
  {
    const pos = [];
    const P = (s, cote) => [largeur(s) * cote * 0.98, pont(s), s];
    for (let n = 0; n < stations.length - 1; n++) {
      const q = [P(stations[n], -1), P(stations[n], 1), P(stations[n + 1], -1), P(stations[n + 1], 1)];
      for (const t of [[q[0], q[2], q[1]], [q[1], q[2], q[3]]]) {
        pos.push(...t[0], ...t[1], ...t[2]);
        pos.push(...t[0], ...t[2], ...t[1]);
      }
    }
    tri(ch, pos, 0x7e4f42);
  }
  // Le bouchon de la moitié (la cassure, ou le tableau arrière) : un éventail sur le profil
  for (const [s, couleur] of capS) {
    const pos = [];
    const pts = [...profil(s, 1).slice(0, 5)];
    const ptsG = [...profil(s, -1).slice(0, 5)];
    const c = [0, (quille(s) + pont(s)) / 2, s];
    for (const P of [pts, ptsG]) for (let i = 0; i < P.length - 1; i++) {
      pos.push(...c, ...P[i], ...P[i + 1]);
      pos.push(...c, ...P[i + 1], ...P[i]);
    }
    tri(ch, pos, couleur);
  }
  // Le liston blanc, la lisse du pavois
  for (const cote of [-1, 1]) {
    for (let n = 0; n < stations.length - 1; n++) {
      const a = [largeur(stations[n]) * cote, pont(stations[n]) + 1.02, stations[n]];
      const b = [largeur(stations[n + 1]) * cote, pont(stations[n + 1]) + 1.02, stations[n + 1]];
      ch.poutre(a, b, 0.12, 0xd8d4c8, M.peint, { crasse: false, nuance: 0 });
      ch.poutre([a[0] * 1.006, a[1] - 1.15, a[2]], [b[0] * 1.006, b[1] - 1.15, b[2]], 0.1, 0xd8d4c8, M.peint, { crasse: false, nuance: 0 });
      // la ligne de flottaison, un trait rouge vif
      const fa = profil(stations[n], cote)[3];
      const fb = profil(stations[n + 1], cote)[3];
      ch.poutre([fa[0] * 1.01, fa[1] + 0.06, fa[2]], [fb[0] * 1.01, fb[1] + 0.06, fb[2]], 0.12, 0xb2402f, M.peint, { crasse: false, nuance: 0 });
    }
  }
  // Traînées de rouille sous les dalots
  for (const cote of [-1, 1]) {
    for (const s of stations.filter((_, i) => i % 2)) {
      if (s > 7) continue;
      ch.boite(0.05, ch.entre(1.0, 2.8), ch.entre(0.12, 0.3), 0x7a4228, { x: largeur(s) * cote + cote * 0.03, y: pont(s) - 1.5, z: s }, M.tole, { crasse: false, nuance: 0.12 });
    }
  }
}

// ---------- Le cargo ----------

/**
 * Construit le cargo. Renvoie { racine, avant, arriere, chutes: [{ objet, pose }], feux: {...}, projecteur, materiaux }.
 * `racine` est posée sur la pose de l'épave ; `avant` et `arriere` sont des pivots qu'on anime (voir scene.js).
 */
export function creerCargo() {
  const atlas = dessinerAtlas();
  const M = matieres(atlas);
  const racine = new THREE.Group();
  racine.name = "cargo";
  racine.position.set(EPAVE.x, 0, EPAVE.z);
  racine.rotation.y = EPAVE.ry;

  // Les deux pivots : l'avant pivote sur le haut-fond (il se soulève), l'arrière sur le bas de la cassure
  const pivot = (x, y, z) => {
    const p = new THREE.Group();
    p.userData.base = new THREE.Vector3(x, y, z);
    p.position.set(x, y, z);
    const dedans = new THREE.Group();
    dedans.position.set(-x, -y, -z);
    p.add(dedans);
    p.userData.dedans = dedans;
    racine.add(p);
    return p;
  };
  const avant = pivot(0, -9.4, 1.5);
  const arriere = pivot(0, -8.6, 0);

  // --- L'avant
  const ca = new Chantier(31);
  coque(ca, M, [0, 0.8, 1.6, 2.6, 3.4, 4.2, 5.0, 5.8, 6.5, 7.1, 7.6, 8.0, 8.3, L_AV], [[0.02, 0x2a2420]], 1);
  // la proue : le guindeau, le mât de misaine et le portique de la cloche (comme l'épave)
  ca.boite(1.5, 0.5, 0.7, 0x3d4a3e, { y: pont(5.4) + 0.25, z: 5.4 }, M.tole);
  for (const cote of [-1, 1]) ca.tube([cote * 0.62, pont(5.4) + 0.55, 5.25], [cote * 0.62, pont(5.4) + 0.55, 5.55], 0.32, 0x2c2b29, M.tole, 10);
  {
    const sC = 6.7;
    const yC = pont(sC);
    for (const cote of [-1, 1]) ca.poutre([cote * 0.55, yC, sC], [cote * 0.45, yC + 1.75, sC], 0.08, 0xc9c3b6, M.peint);
    ca.poutre([-0.6, yC + 1.72, sC], [0.6, yC + 1.72, sC], 0.08, 0xc9c3b6, M.peint);
    ca.tube([0, yC + 1.0, sC + 0.25], [0, yC + 1.5, sC + 0.25], 0.18, 0xa98238, M.peint, 8);
    ca.tube([0, yC, sC + 0.3], [0, yC + 4.2, sC + 0.25], 0.07, 0xc9c3b6, M.peint, 6);
    ca.boite(0.9, 0.06, 0.06, 0xc9c3b6, { y: yC + 3.6, z: sC + 0.25 }, M.peint, { crasse: false });
  }
  // l'ancre dans son écubier, des deux bords
  for (const cote of [-1, 1]) {
    const sa = 7.0;
    const xa = cote * (largeur(sa) + 0.1);
    const ya = pont(sa) - 1.1;
    ca.boite(0.14, 1.2, 0.14, 0x2c2b29, { x: xa, y: ya - 0.45, z: sa }, M.tole, { crasse: false });
    for (const d of [-1, 1]) ca.boite(0.12, 0.5, 0.14, 0x2c2b29, { x: xa, y: ya - 1.0, z: sa + d * 0.25, rx: d * 0.9 }, M.tole, { crasse: false });
    for (let i = 0; i < 4; i++) ca.boite(0.06, ca.entre(0.8, 1.6), 0.12, 0x8a4a2a, { x: xa + cote * 0.06, y: ya - 1.2 - i * 0.2, z: sa - 0.3 + i * 0.18 }, M.tole, { crasse: false, nuance: 0.1 });
  }
  // Le nom, sur les deux joues de la proue
  for (const cote of [-1, 1]) {
    const sa = 4.4;
    const sb = 6.8;
    const wa = cote * (largeur(sa) + 0.08);
    const wb = cote * (largeur(sb) + 0.08);
    const u = cote > 0 ? [wa - wb, sa - sb] : [wb - wa, sb - sa];
    const ry = Math.atan2(-u[1], u[0]);
    panneau(ca, M.panneaux, R.nom, { x: (wa + wb) / 2, y: pont(6) - 0.35, z: (sa + sb) / 2, ry }, Math.hypot(sb - sa, wb - wa) * 0.98, 0.55);
  }
  // le panneau de cale de l'avant et un conteneur de 10 pieds (l'outillage, comme sur l'épave)
  ca.boite(5.0, 0.35, 4.6, 0x4a5a4c, { y: pont(1.6) + 0.17, z: 1.6 }, M.tole);
  conteneur(ca, M, 0x3f6a5a, 2.99, { x: -1.5, y: pont(2.2) + 0.37 + CH / 2, z: 2.2, ry: Math.PI / 2 }, 0);
  avant.userData.dedans.add(ca.construire());

  // --- L'arrière
  const cr = new Chantier(47);
  coque(cr, M, [S_POUPE, -21, -19.5, -18, -16, -13, -10, -7, -4, -2, 0], [[S_POUPE, 0x2c4560], [-0.02, 0x2a2420]], -1);
  // Le nom au tableau arrière
  panneau(cr, M.panneaux, R.poupe, { y: pont(S_POUPE) - 1.3, z: S_POUPE - 0.03, ry: Math.PI }, 4.6, 0.86);
  // « LIVRAISON DU JOUR » sur les deux flancs
  for (const cote of [-1, 1]) panneau(cr, M.panneaux, R.livraison, { x: cote * (W + 0.03), y: -6.15, z: -9.2, ry: cote * Math.PI / 2 }, 12.5, 1.55);
  // Les panneaux de cale
  for (const s of [-13.9, -7.8, -1.7]) cr.boite(5.9, 0.35, 5.2, 0x4a5a4c, { y: pont(s) + 0.17, z: s }, M.tole);

  // Le château : quatre étages blancs, la passerelle et ses ailerons, la cheminée, le mât
  const c0 = -18.9; // milieu du château
  const cLong = 4.4;
  const yb = pont(c0);
  const BLANC = 0xe4e0d6;
  const etages = [[yb, 2.4, 5.6], [yb + 2.4, 2.4, 5.4], [yb + 4.8, 2.4, 5.2]];
  for (const [y0, h, l] of etages) {
    cr.boite(l, h, cLong, BLANC, { y: y0 + h / 2, z: c0 }, M.peint, { nuance: 0.02, crasse: false });
    cr.boite(l + 0.12, 0.1, cLong + 0.12, 0xb9b4a8, { y: y0 + h, z: c0 }, M.peint, { crasse: false });
    // les hublots des quatre faces
    panneau(cr, M.vitres, R.fenetres, { y: y0 + h * 0.55, z: c0 + cLong / 2 + 0.02 }, l * 0.9, 0.62);
    panneau(cr, M.vitres, R.fenetres, { y: y0 + h * 0.55, z: c0 - cLong / 2 - 0.02, ry: Math.PI }, l * 0.9, 0.62);
    for (const cote of [-1, 1]) panneau(cr, M.vitres, R.fenetres, { x: cote * (l / 2 + 0.02), y: y0 + h * 0.55, z: c0, ry: cote * Math.PI / 2 }, cLong * 0.9, 0.62);
  }
  // la passerelle, plus large que la coque (les ailerons)
  const yP = yb + 7.2;
  cr.boite(4.0, 2.2, 3.4, BLANC, { y: yP + 1.1, z: c0 + 0.3 }, M.peint, { crasse: false, nuance: 0.02 });
  cr.boite(2 * W + 1.0, 0.25, 1.6, BLANC, { y: yP + 0.9, z: c0 + 1.2 }, M.peint, { crasse: false });
  for (const cote of [-1, 1]) {
    cr.boite(0.1, 1.0, 1.6, BLANC, { x: cote * (W + 0.5), y: yP + 1.5, z: c0 + 1.2 }, M.peint, { crasse: false });
    cr.boite(1.2, 1.0, 0.1, BLANC, { x: cote * (W - 0.1), y: yP + 1.5, z: c0 + 2.0 }, M.peint, { crasse: false });
  }
  panneau(cr, M.vitres, R.passerelle, { y: yP + 1.45, z: c0 + 2.02 }, 3.8, 0.85);
  for (const cote of [-1, 1]) panneau(cr, M.vitres, R.passerelle, { x: cote * 2.02, y: yP + 1.45, z: c0 + 0.3, ry: cote * Math.PI / 2 }, 3.0, 0.8);
  cr.boite(4.4, 0.18, 3.8, 0xc9c4b8, { y: yP + 2.29, z: c0 + 0.3 }, M.peint, { crasse: false });
  // le mât radar, sur le toit de la passerelle
  cr.tube([0, yP + 2.3, c0 + 0.2], [0, yP + 6.2, c0 + 0.2], 0.09, 0xd8d4c8, M.peint, 6);
  cr.boite(2.2, 0.08, 0.08, 0xd8d4c8, { y: yP + 5.0, z: c0 + 0.2 }, M.peint, { crasse: false });
  cr.boite(1.8, 0.12, 0.25, 0x2a2a2a, { y: yP + 3.4, z: c0 + 0.2, ry: 0.6 }, M.tole, { crasse: false });
  cr.tube([0, yP + 3.2, c0 + 0.2], [0, yP + 3.4, c0 + 0.2], 0.15, 0x2a2a2a, M.tole, 8);
  // le projecteur, à l'avant du toit
  cr.tube([0, yP + 2.38, c0 + 1.8], [0, yP + 2.62, c0 + 1.95], 0.26, 0x3a3a3a, M.tole, 10);
  // La cheminée, derrière la passerelle : canard, bande rouge, la flèche de l'Abondance
  {
    const zF = c0 - 1.4;
    const yF = yb + 7.2;
    cr.boite(1.6, 3.2, 1.3, 0x2f6f73, { y: yF + 1.6, z: zF }, M.peint, { crasse: false });
    cr.boite(1.66, 0.35, 1.36, 0xc8362b, { y: yF + 2.6, z: zF }, M.peint, { crasse: false });
    cr.boite(1.7, 0.2, 1.4, 0x1c1c1c, { y: yF + 3.25, z: zF }, M.tole, { crasse: false });
    for (const cote of [-1, 1]) panneau(cr, M.panneaux, R.cheminee, { x: cote * 0.81, y: yF + 1.5, z: zF, ry: cote * Math.PI / 2 }, 1.2, 0.6);
  }
  // les embarcations de sauvetage, orange, sur leurs bossoirs
  for (const cote of [-1, 1]) {
    const x = cote * (W - 0.1);
    cr.boite(0.9, 0.8, 3.4, 0xd8622a, { x, y: yb + 3.3, z: c0 - 0.2 }, M.peint, { crasse: false });
    cr.boite(0.92, 0.12, 3.42, 0xe9e5db, { x, y: yb + 3.0, z: c0 - 0.2 }, M.peint, { crasse: false });
    for (const dz of [-1.3, 0.9]) cr.poutre([cote * (W - 0.6), yb + 2.4, c0 + dz], [x, yb + 4.0, c0 + dz], 0.1, 0xd8d4c8, M.peint);
  }
  // le tableau arrière : le mât du pavillon
  cr.tube([0, pont(S_POUPE) + 1, S_POUPE + 0.4], [0, pont(S_POUPE) + 3.2, S_POUPE + 0.4], 0.04, 0xd8d4c8, M.peint, 5);

  // Les conteneurs en pontée (ceux qui tombent sont à part)
  let k = 0;
  const chutes = [];
  const baies = [
    { s: -13.9, etages: [3, 3] },
    { s: -7.8, etages: [3, 2] },
    { s: -1.7, etages: [2, 2] },
  ];
  for (const b of baies) {
    for (const [r, lx] of [[0, 1.27], [1, -1.27]]) {
      for (let e = 0; e < b.etages[r]; e++) {
        const couleur = COULEURS[(k * 7 + e * 3 + r) % COULEURS.length];
        const pose = { x: lx, y: pont(b.s) + 0.37 + CH / 2 + e * (CH + 0.02), z: b.s, ry: Math.PI / 2 };
        const logo = (k + e) % 3 === 0 ? (couleur === 0xd8cfb8 || couleur === 0x8a8d88 ? -1 : 1) : 0;
        // Les conteneurs du haut de la baie de la cassure basculent au choc
        const tombe = b.s === -1.7 && e === b.etages[r] - 1;
        if (tombe) chutes.push({ couleur: r === 0 ? 0x2f5a7a : 0xc27a2e, pose, logo: 1, cote: r === 0 ? 1 : -1 });
        else conteneur(cr, M, couleur, CL, pose, logo);
      }
      k++;
    }
  }
  arriere.userData.dedans.add(cr.construire());

  // --- Les conteneurs qui basculent : chacun son objet (on les anime à part)
  const objetsChute = chutes.map((c, i) => {
    const ch = new Chantier(70 + i);
    conteneur(ch, M, c.couleur, CL, {}, c.logo);
    const o = ch.construire();
    o.name = `conteneur_qui_tombe_${i}`;
    return { objet: o, pose: c.pose, cote: c.cote, couleur: c.couleur };
  });
  // Un troisième, tout en haut de la pile de la cassure, côté grève : projeté au choc, il finit dans l'eau
  {
    const ch = new Chantier(79);
    conteneur(ch, M, 0x8a5a3a, CL, {}, 1);
    const o = ch.construire();
    o.name = "conteneur_qui_tombe_2";
    objetsChute.push({ objet: o, pose: { x: 1.27, y: pont(-1.7) + 0.37 + CH / 2 + 2 * (CH + 0.02), z: -1.7, ry: Math.PI / 2 }, cote: 1, couleur: 0x8a5a3a });
  }

  // --- Les feux : de position (rouge à bâbord, vert à tribord), de tête de mât, de poupe ; le projecteur
  const feux = {};
  const poser = (parent, nom, couleur, taille, x, y, z) => {
    const h = halo(couleur, taille);
    h.position.set(x, y, z);
    h.name = nom;
    parent.userData.dedans.add(h);
    feux[nom] = h;
    return h;
  };
  poser(arriere, "babord", 0xff2a1a, 2.2, W + 0.5, yP + 1.6, c0 + 1.9);
  poser(arriere, "tribord", 0x28ff70, 2.2, -(W + 0.5), yP + 1.6, c0 + 1.9);
  poser(arriere, "mat", 0xfff4dc, 2.0, 0, yP + 6.3, c0 + 0.2);
  poser(arriere, "poupe", 0xfff4dc, 1.6, 0, pont(S_POUPE) + 1.3, S_POUPE - 0.1);
  poser(avant, "misaine", 0xfff4dc, 1.8, 0, pont(6.7) + 4.3, 6.95);
  poser(avant, "detresse", 0xff2a1a, 2.6, 0, pont(7.4) + 4.0, 7.4).visible = false;
  // la lueur générale du château (une seule tache chaude, pour les reflets)
  const lueur = halo(0xffb060, 9);
  lueur.position.set(0, yb + 4, c0 + 2.6);
  lueur.material.opacity = 0.35;
  arriere.userData.dedans.add(lueur);
  feux.chateau = lueur;
  // Le projecteur : une lumière qui balaie la côte, et son cône visible
  const projecteur = new THREE.SpotLight(0xe8f0ff, 0, 140, 0.22, 0.85, 1.0);
  projecteur.position.set(0, yP + 2.6, c0 + 2.1);
  projecteur.target.position.set(0, -7.5, 30);
  arriere.userData.dedans.add(projecteur, projecteur.target);
  const cone = new THREE.Mesh(geoCone(55, 5.0, 18), materiauFaisceau(0xcfdcff, 0.22, 55));
  cone.position.copy(projecteur.position);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -7.5, 30).sub(projecteur.position).normalize());
  cone.renderOrder = 6;
  arriere.userData.dedans.add(cone);
  const source = halo(0xeaf2ff, 3.5);
  source.position.set(0, yP + 2.55, c0 + 2.25);
  arriere.userData.dedans.add(source);

  return { racine, avant, arriere, chutes: objetsChute, feux, projecteur, cone, source, materiaux: M };
}
