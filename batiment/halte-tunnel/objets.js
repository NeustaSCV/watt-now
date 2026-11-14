// Les objets de la halte du tunnel : épaves (voitures, camion), ventilateurs de voûte, mobilier de l'abri, barrage des
// pillards, glissières, sapins et rochers. Toutes les couleurs passent par T() : sous la voûte, elles s'éteignent.

import * as THREE from "three";
import { PALETTE } from "../commun/atelier.js";
import { M, T, en, PI, cylX, cylY, panneau } from "./outils.js";

const ROUE = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 8);
const JANTE = new THREE.CylinderGeometry(0.22, 0.22, 0.26, 6);
const CAILLOU = new THREE.DodecahedronGeometry(0.5, 0);
const BOULE = new THREE.IcosahedronGeometry(1, 0);

// ---------- Voitures ----------

/**
 * Une voiture abandonnée (repère : +x vers l'avant). Options : brule (incendiée : carcasse rouillée, plus de vitres ni
 * de pneus), porte (portière avant ouverte), coffre (ouvert), capot (ouvert), y, rx, rz (inclinaison), pneusCreves.
 */
export function voiture(c, x, z, ry, teinte, o = {}) {
  en(x, z, () => {
    const brule = !!o.brule;
    const corps = brule ? 0x5a3a2a : teinte;
    const t = (h) => T(h);
    const mc = brule ? M.mat() : M.satin();
    c.repere({ x, y: (o.y ?? 0) + (o.pneusCreves || brule ? -0.12 : 0), z, ry, rx: o.rx ?? 0, rz: o.rz ?? 0 }, () => {
      // Caisse, capot, coffre
      c.boite(4.2, 0.6, 1.8, t(corps), { y: 0.68 }, mc, { nuance: brule ? 0.12 : 0.03 });
      c.boite(1.0, 0.24, 1.76, t(corps), { x: 1.62, y: 1.03, rz: -0.1 }, mc);
      c.boite(0.8, 0.22, 1.76, t(corps), { x: -1.72, y: 1.02, rz: 0.08 }, mc);
      // Habitacle : montants et toit
      for (const sx of [-1.15, 0.05, 0.95]) for (const sz of [-0.82, 0.82]) c.boite(0.08, 0.66, 0.07, t(corps), { x: sx + (sx > 0.5 ? -0.12 : 0), y: 1.32, z: sz, rz: sx > 0.5 ? 0.45 : sx < -1 ? -0.3 : 0 }, mc);
      c.boite(2.1, 0.07, 1.68, t(brule ? 0x3a2a22 : corps), { x: -0.18, y: 1.66 }, mc);
      if (!brule) c.boite(2.3, 0.6, 1.64, t(0xffffff), { x: -0.1, y: 1.33 }, M.verre(), { crasse: false });
      else {
        // Sièges calcinés : il ne reste que les ressorts
        for (const sx of [0.3, -0.7]) c.boite(0.5, 0.5, 1.4, t(0x2a2622), { x: sx, y: 1.0 }, M.mat(), { nuance: 0.1 });
      }
      // Bas de caisse, pare-chocs, phares
      c.boite(4.26, 0.14, 1.84, t(0x2c2e30), { y: 0.42 }, M.mat());
      if (!brule) {
        c.boite(0.05, 0.12, 0.38, t(0xe8e4d0), { x: 2.12, y: 0.82, z: 0.62 }, M.lisse(), { crasse: false });
        c.boite(0.05, 0.12, 0.38, t(0xe8e4d0), { x: 2.12, y: 0.82, z: -0.62 }, M.lisse(), { crasse: false });
        c.boite(0.05, 0.1, 0.4, t(0x9b3b35), { x: -2.12, y: 0.86, z: 0.6 }, M.lisse(), { crasse: false });
        c.boite(0.05, 0.1, 0.4, t(0x9b3b35), { x: -2.12, y: 0.86, z: -0.6 }, M.lisse(), { crasse: false });
      }
      // Roues (ou jantes nues)
      for (const [wx, wz] of [[1.3, 0.84], [1.3, -0.84], [-1.3, 0.84], [-1.3, -0.84]]) {
        if (brule) c.poser(JANTE, M.tole(), t(0x4a3428), { x: wx, y: 0.24, z: wz, rx: PI / 2 });
        else c.poser(ROUE, M.mat(), t(0x242322), { x: wx, y: 0.34, z: wz, rx: PI / 2 });
      }
      if (o.porte) c.repere({ x: 0.75, y: 0.68, z: 0.9, ry: -1.0 }, () => c.boite(1.15, 1.0, 0.06, t(corps), { x: -0.58, y: 0.25 }, mc));
      if (o.coffre) c.repere({ x: -2.1, y: 1.12, z: 0 }, () => c.boite(0.8, 0.05, 1.7, t(corps), { x: 0.05, y: 0.32, rz: 1.25 }, mc));
      if (o.capot) c.repere({ x: 1.12, y: 1.1, z: 0 }, () => c.boite(1.05, 0.05, 1.7, t(corps), { x: 0.4, y: 0.42, rz: 1.0 }, mc));
    });
  });
}

/** Le camion : tracteur et semi-remorque plateau, chargement de palettes. La bâche et ses arceaux vont dans `couche`. */
export function camion(c, couche, x, z, ry, o = {}) {
  en(x, z, () => {
    const t = (h) => T(h);
    const cab = o.couleur ?? 0x8a3f33;
    c.repere({ x, z, ry }, () => {
      // Le tracteur (avant vers +x)
      c.repere({ x: 5.6 }, () => {
        c.boite(2.3, 2.1, 2.45, t(cab), { x: 0.2, y: 2.15 }, M.satin(), { nuance: 0.03 });
        c.boite(0.6, 1.0, 2.4, t(cab), { x: 1.4, y: 1.4 }, M.satin());
        c.boite(0.05, 0.9, 2.1, t(0xffffff), { x: 1.36, y: 2.45 }, M.verre(), { crasse: false });
        c.boite(2.0, 0.3, 2.3, t(0x2a2b2c), { x: 0.2, y: 3.3 }, M.satin()); // déflecteur
        c.boite(3.6, 0.4, 1.0, t(0x2c2e30), { x: -0.8, y: 0.85 }, M.tole());
        for (const sz of [-1.05, 1.05]) {
          c.poser(ROUE, M.mat(), t(0x222), { x: 0.9, y: 0.5, z: sz, rx: PI / 2, e: [1.45, 1.4, 1.45] });
          c.poser(ROUE, M.mat(), t(0x222), { x: -1.6, y: 0.5, z: sz, rx: PI / 2, e: [1.45, 1.4, 1.45] });
        }
        // Réservoir, échappement
        cylX(c, M.metal(), t(0x9aa0a2), -0.6, 0.4, 0.75, 1.2, 0.3, 8);
        cylY(c, M.metal(), t(0x6a6e70), -0.95, -1.15, 1.2, 3.6, 0.09, 0.09, 6);
        // Portière ouverte : le chauffeur est parti à pied
        c.repere({ x: 0.9, y: 1.2, z: 1.25, ry: -1.2 }, () => c.boite(1.2, 1.6, 0.06, t(cab), { x: -0.6, y: 0.8 }, M.satin()));
      });
      // La semi-remorque plateau
      c.boite(11.5, 0.35, 2.5, t(0x3a3d3e), { x: -1.4, y: 1.35 }, M.tole());
      c.boite(11.5, 0.2, 2.45, t(0x7a6a52), { x: -1.4, y: 1.6 }, M.mat()); // plancher de bois
      for (const sx of [-6.0, -5.0]) for (const sz of [-1.05, 1.05]) c.poser(ROUE, M.mat(), t(0x222), { x: sx, y: 0.5, z: sz, rx: PI / 2, e: [1.45, 1.4, 1.45] });
      c.boite(0.1, 1.0, 0.1, t(0x3a3d3e), { x: 2.2, y: 0.65, z: 0.9 }, M.tole()); // béquille
      c.boite(0.1, 1.0, 0.1, t(0x3a3d3e), { x: 2.2, y: 0.65, z: -0.9 }, M.tole());
      // Le chargement : palettes filmées, cartons crevés (côté +z, le film déchiré)
      for (let i = 0; i < 6; i++) {
        const px = -6.2 + i * 1.75;
        const n = i === 2 ? 0 : i === 4 ? 1 : 2;
        for (let k = 0; k < n; k++) {
          c.boite(1.2, 0.15, 1.0, t(0x9a8460), { x: px, y: 1.78 + k * 0.85, z: -0.6 }, M.mat());
          c.boite(1.15, 0.68, 0.98, t(k ? 0xb59c78 : 0xc9b490), { x: px, y: 2.2 + k * 0.85, z: -0.6, ry: c.entre(-0.05, 0.05) }, M.mat(), { nuance: 0.06 });
        }
        if (i !== 1 && i !== 3) {
          c.boite(1.2, 0.15, 1.0, t(0x9a8460), { x: px, y: 1.78, z: 0.6 }, M.mat());
          c.boite(1.15, 0.68, 0.98, t(0xc9b490), { x: px, y: 2.2, z: 0.6 }, M.mat(), { nuance: 0.06 });
        }
      }
      // Cartons tombés au sol, à côté
      for (let i = 0; i < 7; i++) c.boite(c.entre(0.4, 0.6), c.entre(0.3, 0.45), c.entre(0.35, 0.5), t(0xbca784), { x: c.entre(-6, 1), y: 0.2, z: c.entre(1.6, 2.6), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, M.mat(), { nuance: 0.08 });
    });
    // La bâche : arceaux et lambeaux de toile (couche qui s'efface)
    if (couche) {
      couche.repere({ x, z, ry }, () => {
        for (let i = 0; i < 7; i++) {
          const px = -7 + i * 1.9;
          for (const sz of [-1.2, 1.2]) couche.boite(0.07, 1.9, 0.07, t(0x4a4d4e), { x: px, y: 2.7, z: sz }, M.tole());
          if (i !== 4) couche.boite(0.07, 0.07, 2.45, t(0x4a4d4e), { x: px, y: 3.65 }, M.tole());
        }
        // Les lambeaux : le côté −z encore tendu par endroits, le dessus crevé
        for (let i = 0; i < 6; i++) {
          if (i === 2 || i === 3) continue;
          couche.boite(1.9, c.entre(1.0, 1.9), 0.04, t(0x5e6a4e), { x: -6 + i * 1.9, y: 3.6 - 0.5 - c.hasard() * 0.3, z: -1.24, rx: c.entre(-0.06, 0.06) }, M.mat(), { nuance: 0.06, crasse: false });
          if (i < 2 || i === 5) couche.boite(1.9, 0.04, 2.5, t(0x5e6a4e), { x: -6 + i * 1.9, y: 3.68, rz: c.entre(-0.05, 0.05) }, M.mat(), { nuance: 0.06, crasse: false });
        }
        couche.boite(1.7, 1.2, 0.04, t(0x5e6a4e), { x: -1.0, y: 2.6, z: 1.3, rx: 0.4 }, M.mat(), { crasse: false });
      });
    }
  });
}

// ---------- Le tunnel ----------

/** Un accélérateur (ventilateur de voûte) : un gros cylindre à silencieux, couché selon x. `tombe` : au sol, cabossé. */
export function ventilateur(c, x, y, z, o = {}) {
  en(x, z, () => {
    const t = (h) => T(h);
    c.repere({ x, y, z, ry: o.ry ?? 0, rz: o.rz ?? 0, rx: o.rx ?? 0 }, () => {
      cylX(c, M.tole(), t(0x8e9496), -2.2, 2.2, 0, 0, 0.62, 12);
      for (const sx of [-2.25, -1.4, 1.4, 2.25]) cylX(c, M.tole(), t(0x6f7476), sx - 0.06, sx + 0.06, 0, 0, 0.67, 12);
      // Les grilles (sombres) aux deux bouts
      for (const sx of [-2.21, 2.21]) cylX(c, M.metal(), t(0x2a2c2d), sx - 0.01, sx + 0.01, 0, 0, 0.58, 12);
      if (!o.tombe) {
        // Les attaches à la voûte
        for (const sx of [-1.0, 1.0]) {
          c.boite(0.12, 1.0, 0.12, t(0x55595a), { x: sx, y: 0.95 }, M.tole());
          c.boite(0.6, 0.08, 0.8, t(0x55595a), { x: sx, y: 1.45 }, M.tole());
        }
      }
    });
  });
}

/** Une niche de sécurité : téléphone d'urgence, extincteur, panneaux. Dans le repère de la niche (fond à z = 0, ouverte vers +z). */
export function equipementNiche(c, x, zFond, sansExtincteur = false) {
  en(x, zFond + 0.6, () => {
    const t = (h) => T(h);
    // La borne téléphone orange
    c.boite(0.55, 1.5, 0.35, t(0xd0742a), { x: x - 0.45, y: 0.75, z: zFond + 0.2 }, M.satin());
    c.boite(0.4, 0.4, 0.06, t(0x2a2c2d), { x: x - 0.45, y: 1.2, z: zFond + 0.39 }, M.satin());
    // Le combiné pend au bout de son fil
    c.boite(0.08, 0.28, 0.08, t(0x1f2122), { x: x - 0.3, y: 0.55, z: zFond + 0.45, rz: 0.3 }, M.satin());
    panneau(c, "sos", x - 0.45, 1.95, zFond + 0.05, 0.5, 0.62);
    // L'extincteur et son coffre (porte ouverte)
    c.boite(0.5, 0.8, 0.3, t(0xb33a2c), { x: x + 0.45, y: 1.0, z: zFond + 0.15 }, M.satin());
    if (!sansExtincteur) cylY(c, M.satin(), t(0xc8362b), x + 0.45, zFond + 0.25, 0.65, 1.2, 0.09, 0.09, 6);
    else c.boite(0.16, 0.5, 0.16, t(0x2a2422), { x: x + 0.7, y: 0.08, z: zFond + 0.7, rz: PI / 2 - 0.1 }, M.satin()); // tombé, vide
    c.repere({ x: x + 0.7, y: 1.0, z: zFond + 0.3, ry: -1.2 }, () => c.boite(0.5, 0.8, 0.03, t(0xb33a2c), { x: -0.25 }, M.satin()));
    panneau(c, "extincteur", x + 0.45, 1.75, zFond + 0.05, 0.36, 0.45);
  });
}

// ---------- Mobilier ----------

export function palette(c, x, y, z, ry = 0, teinte = 0x9a7f58) {
  c.repere({ x, y, z, ry }, () => {
    for (const dz of [-0.45, 0, 0.45]) c.boite(1.2, 0.1, 0.12, T(teinte), { y: 0.05, z: dz }, M.mat(), { nuance: 0.08 });
    for (let i = 0; i < 5; i++) c.boite(0.12, 0.03, 1.0, T(teinte), { x: -0.54 + i * 0.27, y: 0.12 }, M.mat(), { nuance: 0.1 });
  });
}

/** Un mur de palettes posées de chant, sanglées : le rempart des pillards. */
export function murPalettes(c, x, z, ry, n, hauteur = 2) {
  en(x, z, () => {
    c.repere({ x, z, ry }, () => {
      for (let i = 0; i < n; i++) {
        for (let k = 0; k < hauteur; k++) {
          c.repere({ x: (i - (n - 1) / 2) * 1.22, y: k * 1.02, rz: c.entre(-0.03, 0.03) }, () => {
            for (const dy of [0.1, 0.5, 0.9]) c.boite(1.2, 0.12, 0.1, T(0x8f7552), { y: dy, z: -0.06 }, M.mat(), { nuance: 0.1 });
            for (let j = 0; j < 5; j++) c.boite(0.11, 1.0, 0.025, T(0x9f8460), { x: -0.5 + j * 0.25, y: 0.5, z: 0.02 }, M.mat(), { nuance: 0.1 });
          });
        }
      }
      // Des tôles clouées par-dessus
      c.boite(n * 0.7, 1.1, 0.03, T(0x7f6a58), { x: c.entre(-0.4, 0.4), y: 0.9, z: 0.08, rz: c.entre(-0.08, 0.08) }, M.tole(), { nuance: 0.1 });
    });
  });
}

export function pneus(c, x, z, n, y = 0) {
  en(x, z, () => {
    for (let i = 0; i < n; i++) c.poser(ROUE, M.mat(), T(0x232221), { x: x + c.entre(-0.05, 0.05), y: y + 0.12 + i * 0.24, z: z + c.entre(-0.05, 0.05), e: [1.15, 0.95, 1.15] });
  });
}

export function fut(c, x, z, teinte = 0x3f5a6a, couche = false) {
  en(x, z, () => {
    if (couche) cylX(c, M.tole(), T(teinte), x - 0.45, x + 0.45, 0.3, z, 0.3, 8);
    else {
      cylY(c, M.tole(), T(teinte), x, z, 0, 0.9, 0.3, 0.3, 8);
      cylY(c, M.tole(), T(0x2a2c2d), x, z, 0.9, 0.92, 0.29, 0.29, 8);
    }
  });
}

/** Un brasero dans un fût coupé : braises (lueur) et quelques bûches. */
export function brasero(c, x, z) {
  en(x, z, () => {
    cylY(c, M.tole(), T(0x5a3a2a), x, z, 0, 0.65, 0.3, 0.32, 8);
    for (let i = 0; i < 6; i++) c.boite(0.06, 0.06, 0.3, T(0x1f1612), { x: x + c.entre(-0.18, 0.18), y: 0.6, z: z + c.entre(-0.18, 0.18), ry: c.hasard() * 3 }, M.mat());
    c.poser(BOULE, M.lueur(), 0xff8a3a, { x, y: 0.72, z, e: [0.26, 0.16, 0.26] }, { crasse: false, nuance: 0 });
    c.poser(BOULE, M.lueur(), 0x8a3a10, { x, y: 0.95, z, e: [0.18, 0.4, 0.18] }, { crasse: false, nuance: 0 });
    for (let i = 0; i < 3; i++) c.boite(0.5, 0.1, 0.1, T(0x6a4a30), { x: x + 0.5, y: 0.05 + i * 0.1, z: z + 0.3 + i * 0.05, ry: 0.3 * i }, M.mat());
  });
}

/** Un feu de camp au sol : un cercle de pierres, des braises, une marmite. */
export function feuDeCamp(c, x, z) {
  en(x, z, () => {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2;
      c.poser(CAILLOU, M.mat(), T(0x6a6560), { x: x + Math.cos(a) * 0.55, y: 0.08, z: z + Math.sin(a) * 0.55, ry: a, e: [0.35, 0.28, 0.3] });
    }
    for (let i = 0; i < 5; i++) c.boite(0.6, 0.09, 0.09, T(0x2a1e16), { x: x + c.entre(-0.1, 0.1), y: 0.09, z: z + c.entre(-0.1, 0.1), ry: (i / 5) * PI }, M.mat());
    c.poser(BOULE, M.lueur(), 0xff7a2a, { x, y: 0.15, z, e: [0.38, 0.12, 0.38] }, { crasse: false, nuance: 0 });
    c.poser(BOULE, M.lueur(), 0xa04a12, { x, y: 0.45, z, e: [0.22, 0.42, 0.22] }, { crasse: false, nuance: 0 });
    // Le trépied et la marmite
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * PI * 2;
      c.poutre([x + Math.cos(a) * 0.7, 0, z + Math.sin(a) * 0.7], [x, 1.2, z], 0.04, T(0x3a3430), M.metal());
    }
    cylY(c, M.metal(), T(0x2c2a28), x, z, 0.62, 0.9, 0.18, 0.2, 8);
  });
}

/** Un banc de l'abri (métal et lattes), le long d'un mur. */
export function banc(c, x, z, ry, L) {
  en(x, z, () => {
    c.repere({ x, z, ry }, () => {
      c.boite(L, 0.05, 0.42, T(0x8a7a5e), { y: 0.45 }, M.mat(), { nuance: 0.06 });
      c.boite(L, 0.35, 0.04, T(0x8a7a5e), { y: 0.78, z: -0.2, rx: -0.1 }, M.mat(), { nuance: 0.06 });
      for (let u = -L / 2 + 0.2; u <= L / 2 - 0.2 + 0.01; u += Math.max(0.6, (L - 0.4) / Math.max(1, Math.round((L - 0.4) / 1.5)))) c.boite(0.05, 0.45, 0.4, T(0x4a5050), { x: u, y: 0.22 }, M.tole());
    });
  });
}

/** Une couverture : pliée (pile) ou dépliée au sol / sur un banc. */
export function couverture(c, x, y, z, ry, teinte, pliee = true) {
  en(x, z, () => {
    if (pliee) c.boite(0.5, 0.08, 0.4, T(teinte), { x, y: y + 0.04, z, ry }, M.mat(), { nuance: 0.08, crasse: false });
    else c.boite(1.5, 0.03, 1.1, T(teinte), { x, y: y + 0.015, z, ry, rz: c.entre(-0.03, 0.03) }, M.mat(), { nuance: 0.06, crasse: false });
  });
}

/** Un pack de six bouteilles d'eau (bleu pâle, sous film). */
export function packEau(c, x, y, z, ry = 0) {
  c.boite(0.36, 0.32, 0.24, T(0xa9c6d4), { x, y: y + 0.16, z, ry }, M.lisse(), { crasse: false, nuance: 0.05 });
  c.boite(0.36, 0.05, 0.24, T(0x3a6fa0), { x, y: y + 0.2, z, ry }, M.lisse(), { crasse: false });
}

/** Un jerrican de 20 L. */
export function jerrican(c, x, z, ry, teinte = 0x4f6f3a) {
  en(x, z, () => {
    c.boite(0.36, 0.46, 0.17, T(teinte), { x, y: 0.23, z, ry }, M.satin());
    c.boite(0.12, 0.06, 0.06, T(0x2a2c2d), { x, y: 0.49, z, ry }, M.satin());
  });
}

/** La cabine de péage : une guérite vitrée sur son îlot (l'îlot court le long de la route, selon x). */
export function cabinePeage(c, x, z, usure) {
  en(x, z, () => {
    const t = (h) => T(h);
    c.boite(7, 0.18, 1.4, t(0xc9c4b6), { x, y: 0.09, z }, M.mat()); // l'îlot
    for (const sz of [-1, 1]) c.boite(6.9, 0.05, 0.05, t(0xd8b23a), { x, y: 0.2, z: z + sz * 0.68 }, M.mat(), { crasse: false });
    c.boite(0.6, 0.5, 1.2, t(0xd8b23a), { x: x - 3.3, y: 0.4, z }, M.satin()); // le nez de l'îlot, rayé
    c.repere({ x, y: 0.18, z }, () => {
      c.boite(2.2, 0.9, 1.3, t(0xe2ddd0), { y: 0.45 }, M.satin());
      c.boite(2.2, 0.12, 1.3, t(0x2f6f73), { y: 2.55 }, M.satin());
      c.boite(2.26, 0.1, 1.36, t(0x9aa0a2), { y: 2.66 }, M.tole());
      for (const [sx, sz] of [[-1.07, -0.62], [1.07, -0.62], [-1.07, 0.62], [1.07, 0.62]]) c.boite(0.07, 1.5, 0.07, t(0x9aa0a2), { x: sx, y: 1.65, z: sz }, M.tole());
      if (usure < 0.85) c.boite(2.0, 1.4, 0.02, t(0xffffff), { y: 1.65, z: 0.64 }, M.verre(), { crasse: false });
      c.boite(2.0, 1.4, 0.02, t(0xffffff), { y: 1.65, z: -0.64 }, M.verre(), { crasse: false });
      c.boite(0.02, 1.4, 1.2, t(0xffffff), { x: -1.09, y: 1.65 }, M.verre(), { crasse: false });
      // Le guichet et son tiroir, le pupitre, le tabouret
      c.boite(0.5, 0.06, 0.3, t(0x9aa0a2), { x: 0.3, y: 0.95, z: 0.8 }, M.metal());
      c.boite(0.5, 0.06, 0.3, t(0x9aa0a2), { x: 0.3, y: 0.95, z: -0.8 }, M.metal());
      c.boite(0.6, 0.05, 0.5, t(0x5a5e60), { x: -0.5, y: 0.95 }, M.satin());
      c.boite(0.4, 0.04, 0.4, t(0x3a3c3e), { x: 0.5, y: 0.5 }, M.satin());
    });
  });
}

/** Une barrière levante (rouge et blanche), cassée ou levée. */
export function barriere(c, x, z, ry, etat = "baissee") {
  en(x, z, () => {
    c.repere({ x, z, ry }, () => {
      c.boite(0.35, 1.0, 0.35, T(0xd8d2c4), { y: 0.5 }, M.satin());
      const ang = etat === "levee" ? 1.35 : etat === "cassee" ? 0.0 : 0;
      const L = etat === "cassee" ? 1.4 : 3.0;
      c.repere({ y: 0.95, rz: ang }, () => {
        for (let i = 0; i < L / 0.5; i++) c.boite(0.5, 0.09, 0.07, T(i % 2 ? 0xc8362b : 0xece6d8), { x: 0.3 + i * 0.5 }, M.satin(), { crasse: false });
      });
      if (etat === "cassee") c.boite(1.5, 0.09, 0.07, T(0xc8362b), { x: 2.6, y: 0.05, z: 0.6, ry: 0.5 }, M.satin());
    });
  });
}

// ---------- Bords de route ----------

/** Une glissière de sécurité le long d'une polyligne [[x, z], …] (lisse sur poteaux). `y` : hauteur du sol. */
export function glissiere(c, pts, y = 0, teinte = 0x9aa0a2, trous = []) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[i + 1];
    const L = Math.hypot(x2 - x1, z2 - z1);
    const xm = (x1 + x2) / 2;
    const zm = (z1 + z2) / 2;
    if (trous.some(([a, b]) => xm > a && xm < b)) continue;
    en(xm, zm, () => {
      const ry = -Math.atan2(z2 - z1, x2 - x1);
      c.boite(L + 0.05, 0.3, 0.06, T(teinte), { x: xm, y: y + 0.6, z: zm, ry }, M.tole(), { nuance: 0.05 });
      for (let k = 0; k < Math.max(1, Math.round(L / 2)); k++) {
        const t = (k + 0.5) / Math.max(1, Math.round(L / 2));
        c.boite(0.1, 0.75, 0.1, T(0x7a7f80), { x: x1 + (x2 - x1) * t, y: y + 0.37, z: z1 + (z2 - z1) * t, ry }, M.tole());
      }
    });
  }
}

/** Un sapin : tronc, trois étages de cônes à facettes. */
export function sapin(c, x, z, h, y = 0) {
  const tons = [0x2f5a3c, 0x3a6a45, 0x2a4f36, 0x35583f];
  c.tube([x, y - 0.3, z], [x, y + h * 0.3, z], h * 0.03, 0x4a3a2c, M.mat(), 5);
  for (let i = 0; i < 3; i++) {
    const r = h * (0.27 - i * 0.065);
    const hh = h * (0.42 - i * 0.06);
    const g = new THREE.ConeGeometry(r, hh, 6);
    c.poser(g, M.mat(), tons[(i + Math.floor(c.hasard() * 2)) % 4], { x, y: y + h * (0.2 + i * 0.24) + hh / 2, z, ry: c.hasard() }, { nuance: 0.06, crasse: false });
    g.dispose();
  }
}

/** Un rocher anguleux. */
export function rocher(c, x, z, s, y = 0, ton = 0x8a857c, allonge = 1) {
  c.poser(CAILLOU, M.mat(), ton, { x, y: y + s * 0.25, z, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s * 2 * allonge, s * 1.3, s * 1.6] }, { nuance: 0.07 });
}

/** Une lampe frontale tombée : boîtier, élastique, et le faisceau qui éclaire encore le sol (lueur). */
export function lampeFrontale(c, x, z, angle) {
  en(x, z, () => {
    c.boite(0.08, 0.05, 0.06, T(0x2a2c2e), { x, y: 0.03, z, ry: angle }, M.satin());
    c.poser(new THREE.TorusGeometry(0.1, 0.012, 3, 10), M.mat(), T(0x3a5070), { x: x - 0.08 * Math.cos(angle), y: 0.015, z: z + 0.08 * Math.sin(angle), rx: PI / 2 });
  });
  // Le faisceau : une nappe en éventail sur le sol, de plus en plus pâle
  for (let i = 0; i < 4; i++) {
    const d = 0.4 + i * 0.75;
    const l = 0.4 + i * 0.45;
    const g = new THREE.PlaneGeometry(0.8, l).rotateX(-PI / 2);
    const k = [0xbfc8d0, 0x8a9298, 0x5a6066, 0x30343a][i];
    c.poser(g, M.lueur(), k, { x: x + Math.cos(angle) * d, y: 0.02 + i * 0.002, z: z - Math.sin(angle) * d, ry: angle + PI / 2 }, { crasse: false, nuance: 0 });
    g.dispose();
  }
}

/** Un sac à dos tombé. */
export function sacADos(c, x, z, ry, teinte = 0x5a6a3a) {
  en(x, z, () => {
    c.boite(0.36, 0.22, 0.5, T(teinte), { x, y: 0.12, z, ry, rz: 0.2 }, M.mat(), { nuance: 0.05 });
    c.boite(0.3, 0.12, 0.2, T(teinte), { x: x + 0.1, y: 0.1, z: z + 0.2, ry }, M.mat());
  });
}

/** Des barbelés : quelques spires (tores) le long d'un segment. */
export function barbeles(c, x1, z1, x2, z2, y = 0) {
  const L = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.max(2, Math.round(L / 0.45));
  const ry = -Math.atan2(z2 - z1, x2 - x1);
  const g = new THREE.TorusGeometry(0.42, 0.012, 3, 9);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    c.poser(g, M.metal(), T(0x6a625a, x1, z1), { x: x1 + (x2 - x1) * t, y: y + 0.42, z: z1 + (z2 - z1) * t, ry: ry + PI / 2 + c.entre(-0.2, 0.2), rx: c.entre(-0.15, 0.15) }, { crasse: false, nuance: 0.05 });
  }
  g.dispose();
}

/** Une table et deux bancs (chalet). */
export function tableBancs(c, x, z, ry, renverse = false) {
  en(x, z, () => {
    c.repere({ x, z, ry }, () => {
      if (renverse) {
        c.boite(1.8, 0.06, 0.8, T(0x7a5a3c), { y: 0.4, z: 0.2, rx: 1.4 }, M.mat());
        c.boite(1.6, 0.7, 0.06, T(0x5a4130), { y: 0.35, z: -0.25 }, M.mat());
      } else {
        c.boite(1.8, 0.06, 0.8, T(0x7a5a3c), { y: 0.76 }, M.mat());
        for (const sx of [-0.75, 0.75]) c.boite(0.08, 0.73, 0.6, T(0x5a4130), { x: sx, y: 0.37 }, M.mat());
      }
      for (const sz of [-0.7, 0.7]) c.boite(1.7, 0.05, 0.3, T(0x7a5a3c), { y: 0.45, z: sz, rz: renverse && sz > 0 ? 0.3 : 0 }, M.mat());
    });
  });
}

export { CAILLOU, BOULE };
export const BLANC = PALETTE.enduitBlanc;
