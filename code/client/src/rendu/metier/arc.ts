// L'arc pour tous (Book 25 §3, chantier 4 · 0.6) : les arcs en main, les flèches en vol, le redresseur de l'établi.
//
// Style low poly du jeu (Assemblage : couleurs par sommet, facettes nuancées, un ou deux appels de dessin par objet).
// Un arc en main est construit dans le repère du poing (personnage.ts) : la poignée au poing, les branches selon ±z,
// le dos de l'arc vers +y (vers la cible), la corde tendue côté −y (vers le tireur). Un peu plus grand que nature
// (+15 %, Book 21 §5.3.2), pour rester lisible sur un téléphone.
// Une flèche en vol est construite pointe vers +z : le moteur des projectiles l'oriente avec `lookAt`.

import * as THREE from "three";
import { Assemblage, V3 } from "../assemblage.ts";
import { PALETTE } from "../materiaux.ts";
import type { FabriqueModele, UsageModele } from "./index.ts";

// ---------- Les arcs ----------

interface FormeArc {
  /** Longueur d'une pointe à l'autre (m). */
  longueur: number;
  /** Rayon des branches au ras de la poignée. */
  rayon: number;
  /** De combien les pointes reculent vers le tireur (la courbe de l'arc au repos, bandé à peine). */
  recul: number;
  /** Le bois : le dos (vers la cible) et le ventre (vers la corde). Une seule couleur : un bois uni. */
  dos: number;
  ventre?: number;
  /** La poignée gainée (cuir, ficelle). */
  poignee: number;
  corde: number;
  graine: number;
}

/** La ligne médiane de l'arc : une parabole, les pointes en arrière. */
function point(f: FormeArc, t: number): THREE.Vector3 {
  const z = (t * f.longueur) / 2;
  return new V3(0, -f.recul * t * t, z);
}

/** Les branches, en tronçons qui s'amincissent vers les pointes ; le ventre d'une autre couleur si le bois en a deux. */
function branches(c: Assemblage, f: FormeArc): void {
  const N = 6;
  for (const s of [-1, 1]) {
    for (let i = 0; i < N; i++) {
      const t0 = (s * i) / N;
      const t1 = (s * (i + 1)) / N;
      const a = point(f, t0);
      const b = point(f, t1);
      const r0 = f.rayon * (1 - 0.6 * (i / N));
      const r1 = f.rayon * (1 - 0.6 * ((i + 1) / N));
      if (f.ventre === undefined) c.perche(a, b, r0, f.dos, "mat", 5, r1, 0.06);
      else {
        // L'if : l'aubier clair au dos, le cœur rouge au ventre (l'arc anglais).
        const d = new V3(0, r0 * 0.38, 0);
        c.perche(a.clone().add(d), b.clone().add(d), r0 * 0.72, f.dos, "mat", 5, r1 * 0.72, 0.05);
        c.perche(a.clone().sub(d), b.clone().sub(d), r0 * 0.72, f.ventre, "mat", 5, r1 * 0.72, 0.05);
      }
    }
  }
  // Les pointes : un petit renflement où la corde s'accroche.
  for (const s of [-1, 1]) {
    const p = point(f, s);
    c.ajouter(new THREE.SphereGeometry(f.rayon * 0.55, 5, 3).translate(p.x, p.y, p.z), f.ventre ?? f.dos, "mat", 0.05);
  }
}

/** La poignée gainée, et la corde tendue d'une pointe à l'autre. */
function poigneeEtCorde(c: Assemblage, f: FormeArc): void {
  c.perche(new V3(0, 0, -0.075), new V3(0, 0, 0.075), f.rayon * 1.3, f.poignee, "mat", 6, f.rayon * 1.3, 0.08);
  const haut = point(f, 1);
  const bas = point(f, -1);
  c.perche(bas, haut, 0.0028, f.corde, "mat", 3, 0.0028, 0);
}

function finir(c: Assemblage): THREE.Group {
  const g = new THREE.Group();
  for (const m of c.maillages()) {
    m.receiveShadow = false;
    g.add(m);
  }
  return g;
}

const FICELLE = 0xcfc3a0;

/** L'arc de fortune : une perche verte encore écorcée, un nœud de rameau, une ficelle. */
function arcFortune(): THREE.Object3D {
  const f: FormeArc = { longueur: 1.3, rayon: 0.017, recul: 0.06, dos: 0x6f7a46, poignee: FICELLE, corde: FICELLE, graine: 31 };
  const c = new Assemblage(f.graine);
  branches(c, f);
  poigneeEtCorde(c, f);
  // Un moignon de rameau, et deux taches d'écorce brune : on voit que c'est du bois vert, coupé du matin.
  c.perche(new V3(0, 0.005, 0.3), new V3(0, 0.05, 0.36), 0.006, 0x6f7a46, "mat", 4, 0.003);
  c.perche(new V3(0, -0.004, -0.36), new V3(0, -0.006, -0.28), 0.0185, PALETTE.boisSombre, "mat", 5, 0.017);
  for (const z of [-0.04, 0.04]) c.ligature(new V3(0, 0, z), new V3(0, 0, 1), 0.022, FICELLE);
  return finir(c);
}

/** L'arc de frêne : un bois clair et lisse, une poignée de cuir, une corde retordue. */
function arcFrene(): THREE.Object3D {
  const f: FormeArc = { longueur: 1.45, rayon: 0.016, recul: 0.075, dos: 0xc9a774, poignee: PALETTE.cuir, corde: 0xe6dcc0, graine: 37 };
  const c = new Assemblage(f.graine);
  branches(c, f);
  poigneeEtCorde(c, f);
  // Le repose-flèche : une petite cale au-dessus de la poignée.
  c.boite(0x8a6a3e, "mat", 0.012, 0.014, 0.02, 0, 0.012, 0.085);
  return finir(c);
}

/** L'arc d'if : plus long, l'aubier crème au dos, le cœur rouge au ventre ; une poignée de cuir sombre. */
function arcIf(): THREE.Object3D {
  const f: FormeArc = { longueur: 1.6, rayon: 0.017, recul: 0.08, dos: 0xe2cc9a, ventre: 0x9a4a2a, poignee: 0x3e2a1e, corde: 0xeee6d0, graine: 41 };
  const c = new Assemblage(f.graine);
  branches(c, f);
  poigneeEtCorde(c, f);
  // Les poupées de corne aux pointes.
  for (const s of [-1, 1]) {
    const p = point(f, s);
    c.perche(p.clone().add(new V3(0, 0, -s * 0.04)), p, 0.009, 0x2a2622, "mat", 5, 0.006);
  }
  return finir(c);
}

/** L'arc de tir sportif : poignée d'alu noir, branches courtes, deux poulies, un viseur et un stabilisateur. */
function arcSportif(): THREE.Object3D {
  const c = new Assemblage(43);
  const noir = 0x2b2b2b;
  const gris = 0x55585c;
  // La poignée (le corps) : une pièce usinée, plus longue que la main.
  c.boite(noir, "metal", 0.03, 0.045, 0.36, 0, 0.01, 0);
  c.boite(0x3a3a3a, "mat", 0.034, 0.05, 0.1, 0, 0.005, 0);
  // Les branches, courtes et épaisses, et leurs poulies.
  const f: FormeArc = { longueur: 0.95, rayon: 0.014, recul: 0.11, dos: gris, poignee: noir, corde: 0x9a2a2a, graine: 43 };
  for (const s of [-1, 1]) {
    const a = new V3(0, 0.0, s * 0.17);
    const b = point(f, s);
    c.perche(a, b, 0.016, gris, "metal", 4, 0.012, 0.03);
    c.ajouter(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 10).rotateZ(Math.PI / 2).translate(b.x, b.y, b.z), 0x8a8d90, "metal");
  }
  // Les câbles (deux brins rouges) d'une poulie à l'autre.
  const haut = point(f, 1);
  const bas = point(f, -1);
  for (const dx of [-0.004, 0.004]) c.perche(bas.clone().add(new V3(dx, 0, 0)), haut.clone().add(new V3(dx, 0, 0)), 0.0022, f.corde, "mat", 3, 0.0022, 0);
  // Le viseur (une petite boîte et sa broche) et le stabilisateur, une tige vers la cible.
  c.boite(noir, "metal", 0.008, 0.05, 0.03, 0.02, 0.04, 0.09);
  c.perche(new V3(0.02, 0.06, 0.09), new V3(0.02, 0.07, 0.09), 0.003, 0xe0c040, "metal", 4);
  c.perche(new V3(0, 0.03, -0.02), new V3(0, 0.3, -0.02), 0.008, noir, "metal", 6, 0.007);
  c.ajouter(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8).translate(0, 0.31, -0.02), noir, "metal");
  return finir(c);
}

// ---------- Les flèches en vol ----------

interface FormeFleche {
  fut: number;
  pointe: (c: Assemblage) => void;
  plumes: number;
  rayon?: number;
}

/** Une flèche : le fût, trois plumes, et sa pointe, vers +z. */
function fleche({ fut, pointe, plumes, rayon = 0.005 }: FormeFleche): THREE.Object3D {
  const c = new Assemblage(13);
  c.perche(new V3(0, 0, -0.36), new V3(0, 0, 0.32), rayon, fut, "mat", 5);
  pointe(c);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    c.boite(i === 0 ? 0xc84a2a : plumes, "toile", 0.002, 0.03, 0.09, Math.sin(a) * 0.015, Math.cos(a) * 0.015, -0.3, 0, 0, a);
  }
  // L'encoche, au talon.
  c.perche(new V3(0, 0, -0.38), new V3(0, 0, -0.36), rayon * 1.2, 0x3a3632, "mat", 5);
  // La ligature de la pointe.
  c.perche(new V3(0, 0, 0.29), new V3(0, 0, 0.33), rayon * 1.5, FICELLE, "mat", 5);
  return c.groupe((m) => m);
}

const FUT = 0xc8a878;
const PLUMES = 0xe8e0d0;

const FLECHES: Record<string, () => THREE.Object3D> = {
  // Le bout du fût taillé en pointe et noirci au feu.
  fleche_durcie: () => fleche({ fut: FUT, plumes: PLUMES, pointe: (c) => c.ajouter(new THREE.ConeGeometry(0.006, 0.07, 5).rotateX(Math.PI / 2).translate(0, 0, 0.355), 0x2a2018, "mat") }),
  // Une pointe d'os, crème, en feuille.
  fleche_os: () => fleche({ fut: FUT, plumes: 0xd8cfc0, pointe: (c) => c.ajouter(new THREE.ConeGeometry(0.011, 0.065, 4).scale(1, 0.45, 1).rotateX(Math.PI / 2).translate(0, 0, 0.355), 0xe8dcc0, "mat", 0.05) }),
  // Un clou aplati : gris, fin, une tête de clou visible sous la ligature.
  fleche_clou: () =>
    fleche({
      fut: FUT,
      plumes: 0xb8b0a0,
      pointe: (c) => {
        c.ajouter(new THREE.ConeGeometry(0.007, 0.075, 4).scale(1, 0.4, 1).rotateX(Math.PI / 2).translate(0, 0, 0.36), 0x7a7874, "metal");
        c.ajouter(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 6).rotateX(Math.PI / 2).translate(0, 0, 0.325), 0x5c5a56, "metal");
      },
    }),
  // La pointe forgée : sombre, large, le fil clair.
  fleche_acier: () =>
    fleche({
      fut: 0xb89868,
      plumes: PLUMES,
      pointe: (c) => {
        c.ajouter(new THREE.ConeGeometry(0.013, 0.07, 4).scale(1, 0.35, 1).rotateX(Math.PI / 2).translate(0, 0, 0.36), 0x3d3a37, "metal");
        c.ajouter(new THREE.ConeGeometry(0.005, 0.03, 4).rotateX(Math.PI / 2).translate(0, 0, 0.385), 0xc9cbc8, "metal");
      },
    }),
  // La flèche de compétition : fût noir, plumes jaune fluo, pointe d'acier poli.
  fleche_carbone: () => fleche({ fut: 0x1e1e1e, plumes: 0xe8e040, rayon: 0.0042, pointe: (c) => c.ajouter(new THREE.ConeGeometry(0.006, 0.045, 6).rotateX(Math.PI / 2).translate(0, 0, 0.345), 0xd0d2d4, "metal") }),
};

// ---------- Le redresseur de fûts (accessoire de l'établi) ----------

/**
 * Le redresseur de fûts (Book 25 §9.3) : un chevalet de deux branches croisées au bout de l'établi, une pierre plate
 * rougie par la chaleur dans un lit de braises éteintes, et trois fûts posés en travers, à redresser.
 */
function redresseur(): THREE.Object3D {
  const c = new Assemblage(53);
  const branche = PALETTE.boisSombre;
  // Le chevalet : deux branches croisées, ligaturées au croisement.
  for (const s of [-1, 1]) c.perche(new V3(s * 0.16, 0, -0.05), new V3(-s * 0.1, 0.62, 0.02), 0.017, branche, "mat", 5, 0.014, 0.08);
  c.ligature(new V3(0.03, 0.4, 0), new V3(0, 0, 1), 0.024);
  // Au sol, la pierre chauffée dans les cendres.
  c.ajouter(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 7).translate(0, 0.025, 0.22), 0x4a4642, "mat", 0.08);
  c.ajouter(new THREE.DodecahedronGeometry(0.09, 0).scale(1.3, 0.45, 1).translate(0, 0.07, 0.22), 0x8a6250, "mat", 0.08);
  c.ajouter(new THREE.CircleGeometry(0.05, 6).rotateX(-Math.PI / 2).translate(0.02, 0.112, 0.22), 0xc06a3a, "mat");
  // Trois fûts en travers du chevalet, et deux qui attendent contre lui.
  for (let i = 0; i < 3; i++) c.perche(new V3(-0.3, 0.44 + i * 0.012, -0.02 + i * 0.018), new V3(0.34, 0.47 + i * 0.008, 0.01 + i * 0.018), 0.006, 0xc8a878, "mat", 4);
  for (const x of [0.2, 0.24]) c.perche(new V3(x, 0, -0.12), new V3(x - 0.05, 0.6, -0.06), 0.006, 0xc8a878, "mat", 4);
  return c.groupe();
}

// ---------- L'inscription au registre (metier/index.ts) ----------

/** Inscrit les modèles de l'arc dans le registre (appelé une fois, par metier/index.ts). */
export function enregistrerArc(enregistrer: (objet: string, usage: UsageModele, fabrique: FabriqueModele) => void): void {
  enregistrer("arc_fortune", "main", arcFortune);
  enregistrer("arc_simple", "main", arcFrene);
  enregistrer("arc_if", "main", arcIf);
  enregistrer("arc_sportif", "main", arcSportif);
  for (const [objet, f] of Object.entries(FLECHES)) enregistrer(objet, "vol", f);
  enregistrer("redresseur_futs", "sol", redresseur);
}
