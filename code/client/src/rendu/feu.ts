// Le feu de camp (moment-vitrine n° 1, Book 21 §5.1.2) : cercle de pierres, bûches, flammes, braises, fumée.
// Passe de finition (2026-10-08) : pierres bosselées noircies de suie côté feu, bûches à écorce (fraîches quand le
// bois est juste empilé, calcinées au bout une fois le feu pris), langues de flamme vrillées, lit de cendres
// et de tisons, fumée en un seul appel de dessin (panache.ts). Le foyer Dakota : un trou dans un bourrelet de terre
// remuée, son évent à côté, le feu au fond.
// Améliorer sa base (Book 24 §2.5) : chaque niveau a son modèle, lisible de loin — le foyer de pierres maçonné et son
// muret, le trépied et la crémaillère du foyer de cuisine, les boîtes de conserve du poêle-fusée ; broche et marmite
// norvégienne en accessoires.
// Le fantôme de pose (pose.ts) reprend le même foyer et les mêmes bûches : un seul modèle (Book 21 §5.2.5).

import * as THREE from "three";
import type { FeuVu } from "../../../commun/src/messages.ts";
import { formeFeu, type FormeFeu } from "../../../commun/src/lignees.ts";
import { Assemblage, BOIS, ROUILLE_SOMBRE, V, V3, X, Y, Z, bosseler, materiauSommets, placer, surface, tache } from "./assemblage.ts";
import { PALETTE, aleatoire } from "./materiaux.ts";
import type { SourceLumiere } from "./lumieres.ts";
import { Panache } from "./panache.ts";

const NB_FUMEE = 18;
/** Les étincelles qui montent du feu (moment-vitrine n° 1). */
const NB_ETINCELLES = 26;
const SUIE = 0x3b3632;
const TERRE = 0x6b5440;
const TROU = 0x1a120c;

/** Le profil d'un trou creusé (rayon intérieur `r`) : bourrelet de terre remuée, paroi, fond noir. */
function trou(c: Assemblage, x: number, z: number, r: number, aleat: () => number): void {
  const profil = [V(r * 2.1, 0), V(r * 1.6, 0.04), V(r * 1.25, 0.07), V(r * 1.05, 0.06), V(r * 0.98, 0.02), V(r * 0.9, 0.006), V(0, 0.004)];
  const g = bosseler(new THREE.LatheGeometry(profil, 14), r * 0.05, aleat);
  c.ajouterDegrade(g.translate(x, 0, z), (p) => {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < r * 0.95) return TROU;
    if (d < r * 1.1) return 0x2e2118;
    return p.y > 0.05 ? 0x7a6048 : (Math.round(p.x * 37 + p.z * 23) % 3 === 0 ? 0x5a4632 : TERRE);
  });
  // Des mottes et des cailloux sortis du trou.
  for (let i = 0; i < 5; i++) {
    const a = aleat() * Math.PI * 2;
    const d = r * (1.8 + aleat() * 0.8);
    c.ajouter(placer(bosseler(new THREE.DodecahedronGeometry(0.03 + aleat() * 0.03, 0), 0.008, aleat), x + Math.cos(a) * d, 0.02, z + Math.sin(a) * d, 0, aleat() * 3, 0), i % 2 ? TERRE : 0x5a4632, "mat", 0.05);
  }
}

/**
 * Où brûle le feu selon la forme du foyer (Book 24 §2.5 : on lit le niveau de loin) : hauteur du feu, bûches petites
 * ou grandes, taille des flammes, éclairage.
 */
interface Disposition {
  /** Hauteur où posent les bûches et naissent les flammes. */
  y: number;
  petit: boolean;
  flamme: number;
  fumee: number;
  /** La lumière portée la nuit : intensité et portée (le foyer de pierres éclaire moins vers l'extérieur). */
  lumiere: [number, number];
}
const DISPOSITIONS: Record<FormeFeu, Disposition> = {
  feu_camp: { y: 0.05, petit: false, flamme: 1, fumee: 1, lumiere: [9, 13] },
  foyer_pierres: { y: 0.05, petit: false, flamme: 1, fumee: 1, lumiere: [8, 11] },
  foyer_cuisine: { y: 0.05, petit: false, flamme: 1, fumee: 1, lumiere: [8, 11] },
  four_terre: { y: 0.05, petit: false, flamme: 0.6, fumee: 0.8, lumiere: [3, 5] },
  poele: { y: 0.05, petit: false, flamme: 0.6, fumee: 0.8, lumiere: [3, 5] },
  dakota: { y: 0, petit: true, flamme: 0.45, fumee: 0.35, lumiere: [3, 5] },
  poele_fusee: { y: 0.3, petit: true, flamme: 0.32, fumee: 0.25, lumiere: [2.2, 4] },
};

/** La forme d'un feu vu (Book 24) : niveau et voie. */
export function formeDuFeu(f: Pick<FeuVu, "dakota" | "niveau">): FormeFeu {
  return formeFeu(f);
}

/** Le cercle de pierres brutes du feu de camp : dix pierres de la rivière, bosselées, la suie côté feu. */
function cercleBrut(c: Assemblage, aleat: () => number): void {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + aleat() * 0.25;
    const r = 0.11 + aleat() * 0.05;
    const teinte = [PALETTE.pierre, PALETTE.pierreSombre, 0x9a958a][Math.floor(aleat() * 3)]!;
    const g = bosseler(new THREE.IcosahedronGeometry(r, 0), r * 0.2, aleat).scale(1.25 + aleat() * 0.3, 0.75 + aleat() * 0.25, 1);
    const cx = Math.cos(a) * 0.52;
    const cz = Math.sin(a) * 0.52;
    placer(g, cx, r * 0.45, cz, 0, -a + (aleat() - 0.5) * 0.4, 0);
    c.ajouterDegrade(g, (p) => {
      const versFeu = (p.x - cx) * -Math.cos(a) + (p.z - cz) * -Math.sin(a);
      return versFeu > r * 0.25 && p.y > r * 0.3 ? SUIE : versFeu > -r * 0.1 && p.y > r * 0.7 ? 0x6e6a63 : teinte;
    });
  }
  // De petites pierres calées entre les grosses.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    c.ajouter(placer(bosseler(new THREE.DodecahedronGeometry(0.05, 0), 0.01, aleat), Math.cos(a) * 0.62, 0.03, Math.sin(a) * 0.62), PALETTE.pierreSombre, "mat", 0.06);
  }
}

/**
 * Le foyer de pierres (niveau 2) : un cercle maçonné à sec, deux assises de pierres équarries, plus haut et plus
 * régulier que le cercle de cailloux ; noirci dedans.
 */
function cercleMaconne(c: Assemblage, aleat: () => number): void {
  for (let assise = 0; assise < 2; assise++) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = ((i + assise * 0.5) / n) * Math.PI * 2;
      const cx = Math.cos(a) * 0.55;
      const cz = Math.sin(a) * 0.55;
      const h = 0.11;
      const g = bosseler(new THREE.BoxGeometry(0.26, h, 0.17, 2, 1, 1), 0.012, aleat);
      placer(g, cx, h / 2 + assise * h, cz, 0, -a + Math.PI / 2 + (aleat() - 0.5) * 0.08, 0);
      const teinte = [PALETTE.pierre, 0x9a958a, PALETTE.pierreSombre][(i + assise) % 3]!;
      c.ajouterDegrade(g, (p) => {
        const versFeu = (p.x - cx) * -Math.cos(a) + (p.z - cz) * -Math.sin(a);
        return versFeu > 0.03 ? SUIE : p.y > h * (assise + 0.85) && versFeu > -0.04 ? 0x6e6a63 : teinte;
      });
    }
  }
  // Une pierre plate au fond du foyer : la sole.
  c.ajouter(placer(bosseler(new THREE.CylinderGeometry(0.4, 0.42, 0.03, 9), 0.01, aleat), 0, 0.012, 0), 0x4a4540, "mat", 0.05);
}

/**
 * Le muret réflecteur (niveau 2 et au-delà) : un arc de pierres plates, trois assises, derrière le feu. Repère local :
 * l'abri (ou le maçon) est vers +z ; le muret est de l'autre côté.
 */
function muret(c: Assemblage, aleat: () => number): void {
  const r = 1.05;
  for (let assise = 0; assise < 3; assise++) {
    const n = 7 - (assise === 2 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n - 0.5;
      const a = Math.PI + t * 2 + (assise % 2) * 0.08;
      const cx = Math.sin(a) * r;
      const cz = Math.cos(a) * r;
      const h = 0.1;
      const g = bosseler(new THREE.BoxGeometry(0.3, h, 0.16, 2, 1, 1), 0.012, aleat);
      placer(g, cx, h / 2 + assise * h, cz, 0, a, 0);
      c.ajouterDegrade(g, (p) => (p.x * cx + p.z * cz < r * r - 0.04 && p.y > 0.12 ? SUIE : [PALETTE.pierre, 0x9a958a, PALETTE.pierreSombre][(i + assise) % 3]!));
    }
  }
  // Un chaperon : trois grandes dalles posées à plat sur le haut.
  for (let i = -1; i <= 1; i++) {
    const a = Math.PI + i * 0.6;
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.62, 0.05, 0.2, 2, 1, 1), 0.01, aleat), Math.sin(a) * r, 0.325, Math.cos(a) * r, 0, a, 0), 0x8a857b, "mat", 0.06);
  }
}

/**
 * Le foyer de cuisine (niveau 3) : un trépied de perches ligaturé au sommet, la crémaillère de fer à crans qui pend
 * au-dessus du feu, sa marmite noircie ; une grille posée sur le cercle, côté droit. La crémaillère dépasse : on
 * reconnaît la cuisine de loin.
 */
function cuisine(c: Assemblage, aleat: () => number): void {
  const sommet = new V3(0, 1.62, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const pied = new V3(Math.cos(a) * 0.88, -0.03, Math.sin(a) * 0.88);
    c.perche(pied, sommet.clone().add(new V3(Math.cos(a) * -0.12, 0.12, Math.sin(a) * -0.12)), 0.035, BOIS.ecorce, "mat", 6, 0.026);
  }
  c.ligature(sommet.clone().add(new V3(0, 0.03, 0)), Y, 0.06);
  // La crémaillère : une barre plate à crans, son crochet, la marmite.
  const FER = 0x2e2c2a;
  c.boite(FER, "metal", 0.025, 0.62, 0.008, 0, sommet.y - 0.33, 0);
  for (let k = 0; k < 6; k++) c.boite(FER, "metal", 0.045, 0.012, 0.01, 0.012, sommet.y - 0.12 - k * 0.09, 0);
  c.perche(new V3(0, sommet.y - 0.64, 0), new V3(0.03, sommet.y - 0.76, 0), 0.007, FER, "metal", 4);
  const yMarmite = 0.58;
  const profil = [V(0, 0), V(0.13, 0.005), V(0.16, 0.05), V(0.165, 0.16), V(0.15, 0.175), V(0.155, 0.185)];
  c.ajouterDegrade(placer(bosseler(new THREE.LatheGeometry(profil, 12), 0.003, aleat), 0, yMarmite, 0), (p) => (p.y < yMarmite + 0.06 ? 0x1c1a18 : 0x34312e), "metal");
  c.ajouter(placer(new THREE.TorusGeometry(0.15, 0.006, 3, 10, Math.PI), 0, yMarmite + 0.19, 0), FER, "metal");
  c.perche(new V3(0, yMarmite + 0.34, 0), new V3(0, sommet.y - 0.76, 0), 0.006, FER, "metal", 4);
  grille(c, 0.3, 0.235, 0, aleat);
}

/**
 * La grille du foyer de cuisine (plan 0.8, chantier 5) : un rouleau de grillage de poulailler replié en double sur un
 * cadre de fil, posé à plat sur les pierres du cercle, à côté de la crémaillère. Les mailles en losange se lisent de près ;
 * de loin, une trame grise et rouillée au-dessus des braises. Quelques ligatures de fil la tiennent au cadre.
 */
function grille(c: Assemblage, gx: number, gy: number, gz: number, aleat: () => number): void {
  const FIL = 0x7d7a74;
  const demiX = 0.21;
  const demiZ = 0.19;
  // Le cadre : quatre fils plus gros, aux coins tordus ensemble.
  for (const s of [-1, 1]) {
    c.perche(new V3(gx - demiX, gy, gz + s * demiZ), new V3(gx + demiX, gy, gz + s * demiZ), 0.006, 0x4a4744, "metal", 4);
    c.perche(new V3(gx + s * demiX, gy, gz - demiZ), new V3(gx + s * demiX, gy, gz + demiZ), 0.006, 0x4a4744, "metal", 4);
  }
  // Les mailles : deux nappes de fils en diagonale, coupées au cadre (le grillage replié en double tient mieux).
  const pas = 0.042;
  for (const sens of [-1, 1]) {
    for (let k = -14; k <= 14; k++) {
      // La droite z = sens · x + k · pas, dans le repère du cadre, coupée au rectangle.
      const bouts: THREE.Vector3[] = [];
      for (const x of [-demiX, demiX]) {
        const z = sens * x + k * pas;
        if (Math.abs(z) <= demiZ) bouts.push(new V3(x, 0, z));
      }
      for (const z of [-demiZ, demiZ]) {
        const x = (z - k * pas) * sens;
        if (Math.abs(x) < demiX) bouts.push(new V3(x, 0, z));
      }
      if (bouts.length < 2) continue;
      const [a, b] = bouts;
      const rouille = (k * 5 + sens * 3 + 40) % 7 === 0;
      c.perche(a!.add(new V3(gx, gy + 0.004 * sens, gz)), b!.add(new V3(gx, gy + 0.004 * sens, gz)), 0.0028, rouille ? ROUILLE_SOMBRE : FIL, "metal", 3);
    }
  }
  // Les ligatures de fil qui tiennent le grillage au cadre, et une tache de suie au milieu (les marmites y sont posées).
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]] as const) c.ligature(new V3(gx + x * demiX * 0.98, gy, gz + z * demiZ), X, 0.009, 0x55524d);
  c.plaque(tache(0, 0, 0.09, 0.07, aleat, 7), surface(new V3(gx, gy + 0.008, gz), X, Z, Y), 0x2a2522, "metal", 0);
}

/**
 * Le poêle-fusée des Abondants (Dakota, niveau 2) : quatre boîtes de conserve en L dans un lit de pierres — deux
 * couchées (l'entrée du bois), deux debout (la cheminée).
 */
function poeleFusee(c: Assemblage, aleat: () => number): void {
  const BOITE = 0xa8a49c;
  const ETIQUETTES = [0xa8645a, 0xc9b56a, null, 0xd8ccb0];
  const boite = (x: number, y: number, z: number, couchee: boolean, i: number) => {
    const g = bosseler(new THREE.CylinderGeometry(0.062, 0.062, 0.13, 10, 2, true), 0.002, aleat);
    const rz = couchee ? Math.PI / 2 : 0;
    c.ajouterDegrade(placer(g, x, y, z, 0, 0, rz), (p) => (p.y > 0.22 || (couchee && p.x < 0.05) ? 0x2a2624 : BOITE), "metal");
    const e = ETIQUETTES[i];
    if (e) c.ajouter(placer(new THREE.CylinderGeometry(0.0635, 0.0635, 0.07, 10, 1, true), x, y, z, 0, 0, rz), e, "mat", 0.05);
    for (const d of [-0.064, 0.064]) c.ajouter(placer(new THREE.TorusGeometry(0.063, 0.004, 3, 10).rotateX(Math.PI / 2).translate(0, d, 0), x, y, z, 0, 0, rz), 0x8f8a82, "metal");
  };
  boite(0, 0.12, 0, false, 0);
  boite(0, 0.25, 0, false, 1);
  boite(0.13, 0.065, 0, true, 2);
  boite(0.26, 0.065, 0, true, 3);
  // Le lit de pierres qui tient le tout et garde la chaleur.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + aleat() * 0.2;
    const r = 0.17 + (i % 2) * 0.07;
    const x = Math.cos(a) * r + 0.06;
    const z = Math.sin(a) * r * 0.9;
    if (x > 0.2 && Math.abs(z) < 0.1) continue;
    const t = 0.045 + aleat() * 0.025;
    c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(t, 0), t * 0.2, aleat).scale(1.2, 0.8, 1), x, t * 0.6 + (i % 2 ? 0 : 0.07), z), [PALETTE.pierre, PALETTE.pierreSombre][i % 2]!, "mat", 0.06);
  }
  // La bouche noire de l'entrée, la cheminée qui fume.
  c.ajouter(placer(new THREE.CircleGeometry(0.055, 10).rotateY(Math.PI / 2), 0.326, 0.065, 0), TROU, "mat");
  c.ajouter(placer(new THREE.CircleGeometry(0.055, 10).rotateX(-Math.PI / 2), 0, 0.316, 0), TROU, "mat");
}

/** La broche (accessoire) : deux fourches plantées de part et d'autre, une broche en travers. */
function broche(c: Assemblage, ecart: number, aleat: () => number): void {
  for (const s of [-1, 1]) {
    const x = s * ecart;
    c.perche(new V3(x, -0.05, 0), new V3(x + s * 0.02, 0.62, 0), 0.022, BOIS.ecorce, "mat", 5, 0.018);
    c.perche(new V3(x + s * 0.01, 0.52, 0), new V3(x + s * 0.09, 0.66, 0.02), 0.012, BOIS.ecorce, "mat", 4, 0.008);
    c.perche(new V3(x - s * 0.005, 0.5, 0), new V3(x - s * 0.07, 0.65, -0.02), 0.012, BOIS.ecorce, "mat", 4, 0.008);
  }
  c.perche(new V3(-ecart - 0.12, 0.58, 0), new V3(ecart + 0.08, 0.585, 0), 0.012, BOIS.coupe, "mat", 5);
  // La manivelle de la broche : une branche coudée au bout.
  c.perche(new V3(ecart + 0.08, 0.585, 0), new V3(ecart + 0.1, 0.5, 0.06), 0.01, BOIS.ecorce, "mat", 4);
  void aleat;
}

/**
 * La marmite norvégienne (accessoire, plan 0.8 : sa clé est la cocotte en fonte) : une caisse de planches bourrée de
 * chiffons de toutes les couleurs, la cocotte noire enfoncée au milieu, son couvercle à bouton ; le couvercle de la caisse
 * appuyé contre son flanc, le temps de sortir la soupe. Un chiffon pend par-dessus le bord.
 */
function marmiteNorvegienne(c: Assemblage, aleat: () => number): void {
  const x = -0.95;
  const z = 0.75;
  const tons = [BOIS.clair, BOIS.moyen, BOIS.gris];
  for (let k = 0; k < 3; k++) {
    for (const s of [-1, 1]) {
      c.boite(tons[(k + 1) % 3]!, "mat", 0.46, 0.1, 0.02, x, 0.06 + k * 0.105, z + s * 0.18);
      c.boite(tons[k % 3]!, "mat", 0.02, 0.1, 0.36, x + s * 0.22, 0.06 + k * 0.105, z);
    }
  }
  c.boite(BOIS.sombre, "mat", 0.44, 0.02, 0.34, x, 0.012, z);
  // Les coins cloués : quatre tasseaux debout.
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) c.boite(BOIS.sombre, "mat", 0.03, 0.31, 0.03, x + sx * 0.205, 0.165, z + sz * 0.165);
  // Le lit de chiffons, de toutes les couleurs, tassé autour de la cocotte.
  const CHIFFONS = [PALETTE.toileEcrue, 0x8f3a22, 0x5a6f8a, PALETTE.vertLaine, 0xb8a27a, 0x7a4f6a];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + aleat() * 0.3;
    const cx = x + Math.cos(a) * (0.16 + aleat() * 0.02);
    const cz = z + Math.sin(a) * (0.115 + aleat() * 0.015);
    c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.065, 1), 0.018, aleat).scale(1.15, 0.6, 1), cx, 0.29 + aleat() * 0.02, cz, 0, a, 0), CHIFFONS[i % CHIFFONS.length]!, "toile", 0.08);
  }
  // Un chiffon rouge qui pend par-dessus le bord, côté feu.
  c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.16, 0.012, 0.13, 3, 1, 3), 0.008, aleat), x + 0.13, 0.3, z - 0.2, -1.2, 0.1, 0), 0x8f3a22, "toile", 0.06);
  // La cocotte en fonte : noire, le bord usé plus clair, deux oreilles ; son couvercle bombé et son bouton.
  const FONTE = 0x232120;
  const y0 = 0.27;
  const corps = [V(0, 0), V(0.1, 0), V(0.118, 0.015), V(0.124, 0.1), V(0.12, 0.118), V(0.112, 0.118)];
  c.ajouterDegrade(placer(bosseler(new THREE.LatheGeometry(corps, 14), 0.002, aleat), x, y0, z), (p) => (p.y > y0 + 0.11 ? 0x4a4642 : FONTE), "metal");
  // (Du bord vers le bouton : les faces regardent vers le haut.)
  const couvercle = [V(0.12, 0.114), V(0.124, 0.12), V(0.1, 0.133), V(0.05, 0.15), V(0, 0.155)];
  // Le couvercle : la fonte patinée, plus claire là où la main le soulève (le bouton, le bord).
  c.ajouterDegrade(placer(new THREE.LatheGeometry(couvercle, 14), x, y0, z), (p) => (p.y < y0 + 0.122 ? 0x5a5550 : Math.hypot(p.x - x, p.z - z) < 0.05 ? 0x4a4642 : 0x34312e), "metal");
  c.ajouter(placer(new THREE.CylinderGeometry(0.016, 0.022, 0.022, 8), x, y0 + 0.165, z), 0x1a1918, "metal");
  for (const s of [-1, 1]) c.ajouter(placer(new THREE.TorusGeometry(0.022, 0.007, 4, 8, Math.PI).rotateZ(-Math.PI / 2 * s), x + s * 0.128, y0 + 0.095, z), FONTE, "metal");
  // Le couvercle de la caisse, appuyé contre son flanc arrière (côté feu).
  c.boite(BOIS.moyen, "mat", 0.48, 0.36, 0.025, x, 0.17, z - 0.25, 0.3, 0, 0);
  c.boite(BOIS.sombre, "mat", 0.48, 0.04, 0.03, x, 0.29, z - 0.215, 0.3, 0, 0);
}

/** Le foyer, sans bois : sa structure selon sa forme (Book 24 §2.5), ses accessoires, son muret tourné vers l'abri. */
export function creerFoyer(dakota: boolean | FormeFeu, graine: number, o = 0, accessoires: readonly string[] = []): THREE.Group {
  const forme: FormeFeu = typeof dakota === "string" ? dakota : dakota ? "dakota" : "feu_camp";
  const c = new Assemblage(graine);
  c.occlusion = 0.12;
  c.forceOcclusion = 0.3;
  const aleat = aleatoire(graine);
  if (forme === "dakota") {
    trou(c, 0, 0, 0.26, aleat);
    trou(c, 0, 0.55, 0.11, aleat);
  } else if (forme === "poele_fusee") {
    poeleFusee(c, aleat);
  } else if (forme === "feu_camp") {
    cercleBrut(c, aleat);
  } else {
    cercleMaconne(c, aleat);
    muret(c, aleat);
    if (forme !== "foyer_pierres") cuisine(c, aleat);
  }
  if (accessoires.includes("broche") && forme !== "poele_fusee") broche(c, forme === "dakota" ? 0.42 : 0.72, aleat);
  if (accessoires.includes("marmite")) marmiteNorvegienne(c, aleat);
  const g = c.groupe();
  // Le foyer maçonné tourne son muret à l'opposé de l'abri : tout le foyer suit (le cercle est rond, la grille suit).
  if (forme !== "feu_camp" && forme !== "dakota" && forme !== "poele_fusee") g.rotation.y = o;
  return g;
}

/** Une bûche du tipi (repère : pied à l'origine, montant vers +y), fraîche ou calcinée au bout. */
function geometrieBuche(dakota: boolean, i: number, calcinee: boolean): THREE.BufferGeometry {
  const c = new Assemblage(70 + i);
  const aleat = aleatoire(70 + i);
  const l = dakota ? 0.3 : 0.64;
  const r = dakota ? 0.035 : 0.05 + aleat() * 0.012;
  const g = bosseler(new THREE.CylinderGeometry(r * 0.8, r, l, 7, 3), r * 0.08, aleat).translate(0, l / 2, 0);
  const ecorce = i % 2 ? BOIS.sombre : BOIS.ecorce;
  c.ajouterDegrade(g, (p) => {
    const h = p.y / l;
    if (h > 0.985) return calcinee ? 0x1c1714 : BOIS.coupe;
    if (calcinee && h > 0.62) return h > 0.8 ? 0x1c1714 : 0x3a2c22;
    return Math.round(Math.atan2(p.z, p.x) * 3 + h * 5) % 3 === 0 ? 0x6b4e36 : ecorce;
  });
  // Un moignon de branche sur le côté.
  c.perche(new V3(r * 0.8, l * 0.35, 0), new V3(r * 2.4, l * 0.48, 0.01), r * 0.3, ecorce, "mat", 4, r * 0.2);
  return c.maillages()[0]!.geometry;
}

/** Les quatre bûches du tipi (chacune à part : on en montre plus ou moins selon le bois). */
function bucheMaillages(forme: FormeFeu): { maillages: THREE.Mesh[]; fraiches: THREE.BufferGeometry[]; calcinees: THREE.BufferGeometry[] } {
  const dakota = DISPOSITIONS[forme].petit;
  const maillages: THREE.Mesh[] = [];
  const fraiches: THREE.BufferGeometry[] = [];
  const calcinees: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    fraiches.push(geometrieBuche(dakota, i, false));
    calcinees.push(geometrieBuche(dakota, i, true));
    const m = new THREE.Mesh(fraiches[i]!, materiauSommets("mat"));
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const ecart = dakota ? 0.13 : 0.22;
    m.position.set(Math.cos(a) * ecart, dakota ? 0.0 : 0.02, Math.sin(a) * ecart);
    m.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
    // Le poêle-fusée : les bâtons sont couchés dans l'entrée, on les pousse au fur et à mesure.
    if (forme === "poele_fusee") {
      m.position.set(0.56 + i * 0.03, 0.05 + (i % 2) * 0.03, (i - 1.5) * 0.022);
      m.rotation.set(0, 0, Math.PI / 2 - 0.08);
    }
    m.castShadow = true;
    m.receiveShadow = true;
    maillages.push(m);
  }
  return { maillages, fraiches, calcinees };
}

/** Le lit de cendres et de tisons (après le feu, et sous les braises). */
function lit(dakota: boolean, graine: number): THREE.Mesh {
  const c = new Assemblage(graine);
  const aleat = aleatoire(graine);
  const sol = surface(new V3(0, 0, 0), X, Z, Y);
  const r = dakota ? 0.2 : 0.4;
  c.plaque(tache(0, 0, r * 1.1, r, aleat, 11), sol, 0x4a4540, "mat", 0.012);
  c.plaque(tache(0, 0, r * 0.75, r * 0.7, aleat, 9), sol, 0x8a8580, "mat", 0.016);
  c.plaque(tache(0.05, -0.03, r * 0.4, r * 0.35, aleat, 7), sol, 0xa8a49e, "mat", 0.019);
  // Des tisons et des bouts de charbon dans la cendre.
  for (let i = 0; i < (dakota ? 4 : 9); i++) {
    const a = aleat() * Math.PI * 2;
    const d = aleat() * r * 0.75;
    c.ajouter(placer(new THREE.BoxGeometry(0.1 + aleat() * 0.08, 0.025, 0.03), Math.cos(a) * d, 0.03, Math.sin(a) * d, 0, aleat() * 3, 0), 0x221c18, "mat", 0.06);
  }
  return c.maillages()[0]!;
}

/** Une langue de flamme : un fuseau vrillé, penché, plus large en bas (repère : base à l'origine). */
function langue(hauteur: number, largeur: number, vrille: number, graine: number): THREE.BufferGeometry {
  const aleat = aleatoire(graine);
  const profil = [V(0, 0), V(largeur * 0.8, hauteur * 0.06), V(largeur, hauteur * 0.2), V(largeur * 0.75, hauteur * 0.45), V(largeur * 0.35, hauteur * 0.75), V(0, hauteur)];
  const g = new THREE.LatheGeometry(profil, 6);
  const p = g.getAttribute("position");
  const penche = (aleat() - 0.5) * 0.3;
  for (let i = 0; i < p.count; i++) {
    const h = p.getY(i) / hauteur;
    const a = vrille * h;
    const x = p.getX(i);
    const z = p.getZ(i);
    p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a) + penche * h * hauteur, p.getY(i), x * Math.sin(a) + z * Math.cos(a));
  }
  g.computeVertexNormals();
  return g;
}

export class FeuDeCamp {
  readonly objet = new THREE.Group();
  private etat: FeuVu;
  /** La forme du foyer (Book 24) : elle fixe le modèle. */
  readonly forme: FormeFeu;
  private readonly buches: THREE.Mesh[];
  private readonly bucheFraiche: THREE.BufferGeometry[];
  private readonly bucheCalcinee: THREE.BufferGeometry[];
  private readonly flammes: THREE.Mesh[] = [];
  private readonly braises: THREE.Mesh;
  private readonly cendres: THREE.Mesh;
  private readonly fumee: Panache;
  private readonly ages: Float32Array;
  private readonly matFlamme: THREE.MeshBasicMaterial;
  private temps = Math.random() * 10;
  private readonly etincelles: THREE.Points;
  private readonly vies: Float32Array;

  constructor(etat: FeuVu) {
    this.etat = etat;
    const graine = etat.id * 31 + 7;
    this.objet.position.set(etat.x, 0, etat.z);
    this.forme = formeFeu(etat);
    const disp = DISPOSITIONS[this.forme];
    const dakota = disp.petit;

    // Le foyer (pierres, trou, boîtes de conserve), fondu en un maillage, avec ses accessoires.
    this.objet.add(creerFoyer(this.forme, graine, etat.o ?? 0, etat.accessoires ?? []));

    // Les bûches en tipi (au fond du trou pour un Dakota, dans l'entrée du poêle-fusée).
    const b = bucheMaillages(this.forme);
    this.buches = b.maillages;
    this.bucheFraiche = b.fraiches;
    this.bucheCalcinee = b.calcinees;
    for (const m of this.buches) this.objet.add(m);

    // Flammes : langues lumineuses en mélange additif, un cœur jaune pâle et des langues orangées autour.
    this.matFlamme = new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const coeur = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const rouge = new THREE.MeshBasicMaterial({ color: 0xc8401a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    const LANGUES: [number, number, number, THREE.Material, number, number][] = [
      [0.7, 0.13, 1.2, coeur, 0, 0],
      [0.55, 0.11, -1.4, this.matFlamme, 0.09, 0.4],
      [0.5, 0.1, 1.6, this.matFlamme, 0.1, 2.5],
      [0.45, 0.1, -1.1, this.matFlamme, 0.09, 4.4],
      [0.85, 0.2, 0.8, rouge, 0, 0],
    ];
    LANGUES.forEach(([h, l, v, mat, r, a], i) => {
      const m = new THREE.Mesh(langue(h, l, v, graine + i), mat);
      m.position.set(Math.cos(a) * r, disp.y, Math.sin(a) * r);
      m.renderOrder = 3;
      this.flammes.push(m);
      this.objet.add(m);
    });

    // Braises (sous le bois, qui palpitent) et cendres.
    this.braises = new THREE.Mesh(
      new THREE.CircleGeometry(dakota ? 0.2 : 0.3, 12).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff4a1c, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.braises.position.y = this.forme === "poele_fusee" ? 0.318 : 0.035;
    this.objet.add(this.braises);
    this.cendres = lit(dakota, graine + 5);
    this.objet.add(this.cendres);

    // Fumée : visible de loin, c'est la signature olfactive (Book 01 §2). Une seule colonne, un seul appel.
    this.fumee = new Panache(NB_FUMEE);
    this.ages = new Float32Array(NB_FUMEE);
    for (let i = 0; i < NB_FUMEE; i++) this.ages[i] = (i / NB_FUMEE) * 6;
    this.objet.add(this.fumee.objet);

    // Les étincelles : de petits points orange qui montent en tourbillonnant et s'éteignent.
    const positions = new Float32Array(NB_ETINCELLES * 3);
    this.vies = new Float32Array(NB_ETINCELLES);
    for (let i = 0; i < NB_ETINCELLES; i++) this.vies[i] = Math.random();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.etincelles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xffb05a, size: 0.07, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.etincelles.frustumCulled = false;
    this.objet.add(this.etincelles);
    this.appliquer();
  }

  get id(): number {
    return this.etat.id;
  }

  /**
   * Ce qui change le modèle (Book 24) : niveau, voie, accessoires, orientation du muret. Quand ça change, on le refait
   * (le reste de l'état, bois et flammes, se met à jour sur place).
   */
  static cle(f: FeuVu): string {
    return `${formeFeu(f)}|${(f.accessoires ?? []).join(",")}|${f.o ?? 0}`;
  }

  get cle(): string {
    return FeuDeCamp.cle(this.etat);
  }

  /** L'état reçu du serveur (pour la fiche du feu). */
  get vue(): FeuVu {
    return this.etat;
  }

  get x(): number {
    return this.etat.x;
  }

  get z(): number {
    return this.etat.z;
  }

  get aspect(): FeuVu["aspect"] {
    return this.etat.aspect;
  }

  get bois(): number {
    return this.etat.bois;
  }

  mettreAJourEtat(etat: FeuVu): void {
    this.etat = etat;
    this.appliquer();
  }

  private appliquer(): void {
    const { aspect, bois } = this.etat;
    const visiblesBuches = aspect === "cendres" ? 0 : Math.max(1, Math.min(4, Math.ceil(bois / 1.2)));
    // Le bois tout juste empilé est frais ; une fois le feu pris, le haut des bûches est calciné.
    this.buches.forEach((b, i) => {
      b.visible = i < visiblesBuches;
      b.geometry = aspect === "eteint" ? this.bucheFraiche[i]! : this.bucheCalcinee[i]!;
    });
    for (const f of this.flammes) f.visible = aspect === "flammes";
    this.braises.visible = aspect === "flammes" || aspect === "braises";
    this.cendres.visible = aspect !== "eteint";
  }

  /** La lumière que ce feu demande à la réserve, ou null s'il n'éclaire pas. */
  source(): SourceLumiere | null {
    if (this.etat.aspect === "flammes") {
      const force = Math.min(1, 0.55 + this.etat.bois / 6);
      // Le foyer Dakota et le poêle-fusée éclairent à peine : la flamme est dans le sol, ou dans la boîte.
      const [intensite, portee] = DISPOSITIONS[this.forme].lumiere;
      if (DISPOSITIONS[this.forme].petit) return { x: this.etat.x, y: 0.5, z: this.etat.z, couleur: 0xff7a30, intensite: intensite * force, portee, vacillement: 0.8 };
      return { x: this.etat.x, y: 1.1, z: this.etat.z, couleur: 0xff8a3d, intensite: intensite * force, portee, vacillement: 1 };
    }
    if (this.etat.aspect === "braises") return { x: this.etat.x, y: 0.5, z: this.etat.z, couleur: 0xff4a1c, intensite: 2.2, portee: 4, vacillement: 0.6 };
    return null;
  }

  animer(dt: number, nuit: number): void {
    this.temps += dt;
    if (this.etat.aspect === "flammes") {
      const taille = Math.min(1.25, 0.6 + this.etat.bois / 5) * DISPOSITIONS[this.forme].flamme;
      this.flammes.forEach((f, i) => {
        const s = 0.85 + Math.sin(this.temps * (9 + i * 2.3) + i) * 0.15 + Math.sin(this.temps * 17 + i * 4) * 0.08;
        const l = 1 + Math.sin(this.temps * (6 + i) + i * 2) * 0.12;
        // Le poêle-fusée : une flamme fine qui sort de la boîte, pas un feu de camp.
        const large = this.forme === "poele_fusee" ? 0.4 : 1;
        f.scale.set(l * large, s * taille, l * large);
        f.rotation.y = this.temps * (0.6 + i * 0.3) * (i % 2 ? -1 : 1);
      });
      this.matFlamme.opacity = 0.75 + Math.sin(this.temps * 21) * 0.1;
    }
    const brule = this.etat.aspect === "flammes" || this.etat.aspect === "braises";
    (this.braises.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(this.temps * 3) * 0.2;

    // La fumée monte haut (on la voit de loin : c'est de la signature), s'élargit et se dissipe.
    // La nuit, le bas de la colonne est éclairé par les flammes, le haut se perd dans le noir.
    const couleur = new THREE.Color();
    for (let i = 0; i < NB_FUMEE; i++) {
      const age = (this.ages[i]! + dt) % 6;
      this.ages[i] = age;
      const vie = age / 6;
      const lueur = this.etat.aspect === "flammes" ? Math.max(0, 1 - vie * 3) * nuit : 0;
      couleur.setRGB(0.73 - nuit * 0.42 + lueur * 0.55, 0.71 - nuit * 0.42 + lueur * 0.25, 0.68 - nuit * 0.4);
      const opacite = brule ? (this.etat.aspect === "flammes" ? 0.55 : 0.28) * Math.sin(vie * Math.PI) * (1 - nuit * 0.35) * DISPOSITIONS[this.forme].fumee * (this.etat.couvert ? 0.4 : 1) : 0;
      this.fumee.regler(i, Math.sin(age * 1.2 + i * 1.7) * 0.3 + vie * 1.6, 0.7 + vie * 7.5, Math.cos(age * 1.1 + i * 1.7) * 0.25, 0.5 + vie * 3, couleur, opacite);
    }
    this.fumee.objet.visible = brule;

    // Les étincelles, seulement quand ça flambe.
    this.etincelles.visible = this.etat.aspect === "flammes";
    if (this.etincelles.visible) {
      const pos = this.etincelles.geometry.attributes.position as THREE.BufferAttribute;
      const p = pos.array as Float32Array;
      const haut = DISPOSITIONS[this.forme].petit ? 1.4 : 2.6;
      for (let i = 0; i < NB_ETINCELLES; i++) {
        let v = this.vies[i]! + dt * (0.6 + (i % 5) * 0.12);
        if (v > 1) v -= 1;
        this.vies[i] = v;
        const a = i * 2.4 + this.temps * (1.5 + (i % 3));
        const r = 0.08 + v * 0.35;
        p[i * 3] = Math.cos(a) * r + v * 0.25;
        p[i * 3 + 1] = 0.3 + v * haut;
        p[i * 3 + 2] = Math.sin(a) * r;
      }
      pos.needsUpdate = true;
      (this.etincelles.material as THREE.PointsMaterial).opacity = 0.55 + nuit * 0.4;
    }
  }
}

/** Le feu en devenir, pour le fantôme de pose : le même foyer et les mêmes bûches, sans flamme ni fumée. */
export function modeleFoyer(dakota: boolean | FormeFeu, o = 0): THREE.Group {
  const forme: FormeFeu = typeof dakota === "string" ? dakota : dakota ? "dakota" : "feu_camp";
  const g = creerFoyer(forme, 7, o);
  const disp = DISPOSITIONS[forme];
  for (const m of bucheMaillages(forme).maillages) {
    if (forme !== "poele_fusee") m.position.y = disp.y;
    g.add(m);
  }
  return g;
}
