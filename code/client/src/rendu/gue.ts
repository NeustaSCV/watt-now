// Le Gué-aux-Saules à l'écran (plan 0.8, chantier 11) : le modèle de la session « bâtiments » (batiment/halte-gue/,
// copié dans client/src/batiments/ par `npm run batiments:importer`, jamais modifié ici), retourné pour suivre la carte
// (le terrain à l'est, commun/src/gue.ts), et ce qui y vit : le radeau du bac, la nappe du radier qui monte avec la
// crue, les toits qui s'effacent, les lumières de la nuit (la guirlande de Chez Lulu), le clapot et le câble.
//
// Quatre tronçons de 50 × 70 m : seuls celui du joueur et ses voisins sont construits ; celui du radeau (la rive côté
// terrain) reste construit tant que le radeau n'est pas à la cale. main.ts n'appelle que ce module (une ligne par point
// d'appel).

import * as THREE from "three";
import {
  BAC,
  BALISES,
  CLOCHE,
  OUIE_RADIER,
  PORTEE_EMBARCADERE,
  RADEAU_AU_REPOS,
  RADIER,
  aBord,
  accostage,
  auGue,
  crue,
  placeRadeau,
  surLeRadier,
  texteBalise,
  zoneGue,
  type MouvementRadeau,
} from "../../../commun/src/gue.ts";
import { LUMIERES_MODELE } from "../../../commun/src/gue-modele.ts";
import type { Position } from "../../../commun/src/deplacement.ts";
import type { Boite, Zone } from "../../../commun/src/lieux.ts";
import type { MessageServeurGue, ProjectileVu } from "../../../commun/src/messages.ts";
import type { ActionProposee, Propositions } from "../interaction.ts";
import type { IdSon } from "../son/catalogue.ts";
import { brouillerTout } from "./carte-vue.ts";
import { estomperToits } from "./halte.ts";
import type { SourceLumiere } from "./lumieres.ts";
// @ts-expect-error : le modèle du gué est en JavaScript, sans types (client/src/batiments/ ne se modifie pas) : typé ici.
import * as modeleJs from "../batiments/halte-gue/modele.js";
// @ts-expect-error : idem (les matières partagées du modèle, dont la texture des enseignes).
import * as outilsJs from "../batiments/halte-gue/outils.js";
// @ts-expect-error : idem (les régions de l'atlas des enseignes).
import * as atlasJs from "../batiments/halte-gue/atlas.js";

/** Ce que le jeu prend du modèle. */
interface ModeleGue {
  creer(o: { usure?: number; carte: string }): THREE.Group;
  FICHE: { cartes: { id: string; decalage: { x: number; z: number } }[] };
}
const modele = modeleJs as unknown as ModeleGue;
const outils = outilsJs as unknown as {
  matieres(): Record<string, THREE.Material & { map?: THREE.Texture | null }>;
  bruit(x: number, z: number): number;
  interp(table: readonly (readonly [number, number])[], x: number): number;
};
const atlas = atlasJs as unknown as { R: Record<string, [number, number, number, number]>; AL: number; AH: number };

/** Un toit, une façade qui s'efface (le format de rendu/halte.ts : estomperToits), dans le repère du jeu. */
interface ToitJeu {
  nom: string;
  boite: Boite;
  materiaux: THREE.Material[];
  bas?: number;
  haut?: number;
  horsDe?: Boite;
  efface?: boolean;
}

interface Troncon {
  id: string;
  /** Le tronçon retourné et posé à sa place (miroir en x). */
  groupe: THREE.Group;
  modele: THREE.Group;
}

/** Les tronçons d'ouest en est dans le jeu (retourné) : la remontée vers le Moulin, le gué, la rive, le chemin creux. */
const ORDRE = ["sortie", "gue", "rive", "chemin"] as const;
/** Le tronçon où se trouve un point du jeu. */
function tronconDe(x: number): (typeof ORDRE)[number] {
  return ORDRE[Math.max(0, Math.min(3, Math.floor(x / 50)))]!;
}

/** Le tronçon du radeau du bac. */
const TRONCON_RADEAU = "rive";

/**
 * Le texte des enseignes, retourné avec le gué, se lirait à l'envers : on retourne chaque enseigne dans sa région de
 * l'atlas (les coordonnées de texture u d'un triangle, d'un bord à l'autre de sa région).
 */
function remettreLesTextesALEndroit(g: THREE.Object3D, carte: THREE.Texture): void {
  const regions = Object.values(atlas.R).map(([x, y, l, h]) => ({ u0: x / atlas.AL, u1: (x + l) / atlas.AL, v0: 1 - (y + h) / atlas.AH, v1: 1 - y / atlas.AH }));
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    if (!mats.some((x) => (x as THREE.MeshStandardMaterial).map === carte)) return;
    const uv = m.geometry.getAttribute("uv") as THREE.BufferAttribute | undefined;
    if (!uv) return;
    const index = m.geometry.getIndex();
    const nb = index ? index.count : uv.count;
    const fait = new Uint8Array(uv.count);
    for (let t = 0; t < nb; t += 3) {
      const ids = [0, 1, 2].map((k) => (index ? index.getX(t + k) : t + k));
      const cu = ids.reduce((s, i) => s + uv.getX(i), 0) / 3;
      const cv = ids.reduce((s, i) => s + uv.getY(i), 0) / 3;
      const r = regions.find((q) => cu > q.u0 && cu < q.u1 && cv > q.v0 && cv < q.v1);
      if (!r) continue;
      for (const i of ids) {
        if (fait[i]) continue;
        fait[i] = 1;
        uv.setX(i, r.u0 + r.u1 - uv.getX(i));
      }
    }
    uv.needsUpdate = true;
  });
}

/**
 * Les panneaux de direction disaient « ← Ton terrain » : retourné, le terrain est à droite. On repeint leurs flèches
 * dans l'atlas (même fond, même police), en attendant que le modèle les donne pour le gué retourné.
 */
function repeindreLesDirections(carte: THREE.Texture): void {
  const canvas = carte.image as HTMLCanvasElement | undefined;
  const g = canvas?.getContext?.("2d");
  if (!g || carte.userData.directionsRepeintes) return;
  carte.userData.directionsRepeintes = true;
  const fonte = "'Avenir Next Condensed', 'Futura', 'Helvetica Neue', sans-serif";
  const ligne = (r: [number, number, number, number], y: number, h: number, texte: string, taille: number, gras: boolean, fond: string) => {
    const [x0, y0, l] = r;
    g.save();
    g.fillStyle = fond;
    g.fillRect(x0 + 12, y0 + y - h / 2, l - 24, h);
    g.font = `${gras ? "bold " : ""}${taille}px ${fonte}`;
    g.fillStyle = "#2b2b29";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(texte, x0 + l / 2, y0 + y, l - 30);
    g.restore();
  };
  const R = atlas.R;
  ligne(R.dirOuest!, 34, 36, "Ton terrain · La Campagne →", 30, true, "#f1ece0");
  ligne(R.dirEst!, 34, 36, "← Le Moulin du Gué · 2 km", 30, true, "#f1ece0");
  ligne(R.dirEst!, 70, 28, "Le Gué · Ton terrain →", 21, false, "#f1ece0");
  ligne(R.deviation!, 104, 30, "←", 30, true, "#e8b04a");
  carte.needsUpdate = true;
}

/** La guirlande de la guinguette, sur batterie solaire fatiguée : le même rythme que ses ampoules dans le modèle. */
function eclatGuirlande(t: number): number {
  const cycle = t % 6.5;
  if (cycle > 5.4) return 0.12;
  if (cycle > 4.2) return Math.sin(t * 31) > 0 ? 1 : 0.25;
  return 0.86 + 0.14 * Math.sin(t * 9);
}

// ---------- Les alentours : la vallée continue au-delà du lot ----------

/**
 * Le relief du modèle (sa fonction `hauteur`, reprise ici : le modèle ne l'exporte pas), dans son repère, prolongé
 * au-delà du lot : la route file entre ses talus, la rivière dans son lit. Sans rivière ni banc, que les bords.
 */
const VN: readonly (readonly [number, number])[] = [[-101, 1.8], [-86, 1.4], [-84, -26], [-65, -26], [-62, -1.2], [-56, -2.6], [-46, -31], [44, -31], [54, -7.5], [66, -7.5], [68, -21.5], [86, -21.5], [88, -8.8], [101, -9.2]];
const VS: readonly (readonly [number, number])[] = [[-101, 11.2], [-72, 10.4], [-69.5, 14], [-59, 14], [-56.5, 8.2], [-47, 33], [44, 33], [54, 4], [101, 0.6]];
const ZR: readonly (readonly [number, number])[] = [[-101, 7], [-85, 6.5], [-65, 4], [-48, 1], [-36, 0], [30, 0], [50, -1], [70, -3], [101, -5]];
const XC = (z: number) => 2 + 1.2 * Math.sin(z * 0.08);
function hauteurModele(x: number, z: number): number {
  const t = 11.5 - Math.abs(x - XC(z));
  if (t > 0) return Math.max(-3.2 + 0.3 * (outils.bruit(x * 0.4, z * 0.4) - 0.5), -t * 1.25);
  const xb = Math.max(-101, Math.min(101, x));
  const dt = Math.max(outils.interp(VN, xb) - z, z - outils.interp(VS, xb));
  if (dt <= 0) return 0;
  return Math.min(8.5, dt * 0.95 * (0.8 + 0.4 * outils.bruit(x * 0.13, z * 0.13)));
}

/**
 * Autour du lot (200 × 70 m), le pays continue : les talus boisés, la route qui file vers le terrain et vers le Moulin,
 * la rivière qui vient du nord et repart au sud. Sans cela, on verrait le vide aux deux bouts de la route et la coupe
 * du terrain sur les bords. Un seul relief (deux appels), de l'eau, des arbres instanciés.
 */
function creerAlentours(eau: THREE.Material | undefined, terre: THREE.Material | undefined): THREE.Group {
  const groupe = new THREE.Group();
  groupe.name = "gue:alentours";
  const PAS = 2.5;
  const x0 = -70;
  const x1 = 270;
  const z0 = -50;
  const z1 = 120;
  const nx = (x1 - x0) / PAS;
  const nz = (z1 - z0) / PAS;
  const h = (x: number, z: number) => hauteurModele(100 - x, z - 35);
  const pos: number[] = [];
  const couleurs: number[] = [];
  // Les coordonnées de texture du modèle (une tuile de terre par 6 m, dans son repère) : la terre se raccorde au lot.
  const uvs: number[] = [];
  const c = new THREE.Color();
  const dans = (x: number, z: number) => x > 0.01 && x < 199.99 && z > 0.01 && z < 69.99;
  const sommet = (x: number, z: number) => {
    const y = h(x, z);
    const mx = 100 - x;
    const mz = z - 35;
    const route = Math.abs(mz - outils.interp(ZR, Math.max(-101, Math.min(101, mx)))) < 3.4 && (x < 0 || x > 200);
    const b = outils.bruit(x * 0.17 + 3, z * 0.17);
    if (route) c.setHex(Math.abs(mz - outils.interp(ZR, Math.max(-101, Math.min(101, mx)))) < 2.8 ? 0x5d5f5c : 0x8b8468);
    else if (y < -0.05) c.setHex(0x6a5d47);
    else if (y > 4.5) c.setHex(b > 0.5 ? 0x4c5e34 : 0x56693a);
    else if (y > 0.3) c.setHex(b > 0.55 ? 0x4f6236 : 0x5d6e3c);
    else c.setHex(b > 0.6 ? 0x86a356 : 0x7c9a50);
    pos.push(x, y, z);
    couleurs.push(c.r, c.g, c.b);
    uvs.push(mx / 6, mz / 6);
  };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const xa = x0 + i * PAS;
      const za = z0 + j * PAS;
      // Le lot a son propre sol : on n'y pose rien (ses bords tombent pile sur la grille).
      if (dans(xa + PAS / 2, za + PAS / 2)) continue;
      for (const [x, z] of [[xa, za], [xa, za + PAS], [xa + PAS, za + PAS], [xa, za], [xa + PAS, za + PAS], [xa + PAS, za]] as const) sommet(x, z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  const sol = new THREE.Mesh(g, terre ?? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  sol.receiveShadow = true;
  groupe.add(sol);

  // La rivière qui entre au nord et sort au sud : la même eau que le modèle (sa matière court avec lui).
  if (eau) {
    const bande = (za: number, zb: number, y: number) => {
      const P: number[] = [];
      const UV: number[] = [];
      const C: number[] = [];
      for (let z = za; z < zb; z += 5) {
        const coins = [[XC(z - 35) - 11.3, z], [XC(z + 5 - 35) - 11.3, z + 5], [XC(z + 5 - 35) + 11.3, z + 5], [XC(z - 35) + 11.3, z]] as const;
        for (const k of [0, 1, 2, 0, 2, 3]) {
          const [mx, zz] = coins[k]!;
          P.push(100 - mx, y, zz);
          UV.push(mx / 6, -(zz - 35) / 6);
          C.push(0.44, 0.55, 0.48);
        }
      }
      const ge = new THREE.BufferGeometry();
      ge.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
      ge.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
      ge.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
      ge.computeVertexNormals();
      groupe.add(new THREE.Mesh(ge, eau));
    };
    bande(z0, 0, -0.6);
    bande(70, z1, -1.5);
  }

  // Les arbres des talus : aulnes et frênes sur les pentes, jamais sur la route ni dans l'eau.
  const aleat = (() => {
    let a = 2207;
    return () => ((a = (a * 16807) % 2147483647) / 2147483647);
  })();
  const places: { x: number; y: number; z: number; e: number }[] = [];
  for (let k = 0; k < 2600 && places.length < 560; k++) {
    const x = x0 + aleat() * (x1 - x0);
    const z = z0 + aleat() * (z1 - z0);
    if (x > -1 && x < 201 && z > -1 && z < 71) continue;
    const y = h(x, z);
    if (y < 0.6) continue;
    // Côté caméra (au sud du lot, et au sud de la route aux deux bouts), des arbres bas : on doit voir le personnage.
    const route = 35 + outils.interp(ZR, Math.max(-101, Math.min(101, 100 - x)));
    const sud = (z > 70 && z < 90) || ((x < 0 || x > 200) && z > route && z < route + 26);
    places.push({ x, y, z, e: sud ? 0.45 + aleat() * 0.2 : 0.9 + aleat() * 0.8 });
  }
  const tronc = new THREE.CylinderGeometry(0.16, 0.24, 1.6, 5, 1, true).translate(0, 0.8, 0);
  const feuillage = new THREE.IcosahedronGeometry(1.25, 0).translate(0, 2.55, 0);
  const troncs = new THREE.InstancedMesh(tronc, new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 1 }), places.length);
  const feuilles = new THREE.InstancedMesh(feuillage, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), places.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const tons = [0x4f6a3a, 0x3f5b33, 0x5d7a44, 0x6a7f48];
  places.forEach((p, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), aleat() * Math.PI * 2);
    m.compose(new THREE.Vector3(p.x, p.y - 0.2, p.z), q, new THREE.Vector3(p.e, p.e * (1.2 + aleat() * 0.6), p.e));
    troncs.setMatrixAt(i, m);
    feuilles.setMatrixAt(i, m);
    feuilles.setColorAt(i, c.setHex(tons[i % tons.length]!));
  });
  for (const im of [troncs, feuilles]) {
    im.castShadow = true;
    im.receiveShadow = true;
    groupe.add(im);
  }
  return groupe;
}

/** Les lumières du modèle, dans le repère du jeu. */
const LUMIERES = LUMIERES_MODELE.map((l) => ({ ...l, ...auGue(l.x, l.z) }));

export class RenduGue {
  /** Le décor du gué (les tronçons construits s'y ajoutent). */
  readonly groupe = new THREE.Group();
  private readonly troncons = new Map<string, Troncon>();
  private mouvement: MouvementRadeau = { ...RADEAU_AU_REPOS };
  /** La place du radeau quand on a porté le joueur la dernière fois (le radeau l'emporte). */
  private radeauPorte: number | null = null;
  private nappe = 0;
  private readonly jouer: (id: IdSon, ou?: { x: number; z: number }) => void;

  constructor(jouer: (id: IdSon, ou?: { x: number; z: number }) => void) {
    this.jouer = jouer;
    this.groupe.name = "gue";
  }

  /** Le décor : les alentours tout de suite ; les tronçons se construisent autour du joueur (animer). */
  creer(): THREE.Group {
    if (this.groupe.children.length === 0) this.groupe.add(creerAlentours(outils.matieres().eau, outils.matieres().terrain));
    return this.groupe;
  }

  // ---------- Ce que dit le serveur ----------

  recevoir(m: MessageServeurGue): void {
    this.mouvement = m.radeau;
    if (m.cloche) this.jouer("cloche_bac", CLOCHE);
  }

  /** La place du radeau à cet instant (heure du serveur). */
  radeau(instant: number): number {
    return placeRadeau(this.mouvement, instant);
  }

  // ---------- Se déplacer ----------

  /** La zone où l'on marche : comme le serveur, avec le radeau à sa place et le radier noyé par la crue. */
  zone(instant: number, debutMonde: number): Zone {
    return zoneGue({ radeau: this.radeau(instant), noye: crue(instant, debutMonde).niveau === "noye" });
  }

  /** À bord, le radeau nous emporte (le serveur fait de même). */
  porter(p: Position, instant: number): Position {
    const xr = this.radeau(instant);
    const avant = this.radeauPorte;
    this.radeauPorte = xr;
    if (avant === null || avant === xr || !aBord(p.x, p.z, avant, 0.05)) return p;
    return { ...p, x: p.x + (xr - avant) };
  }

  /** Sur le radier, on marche, on n'y court pas. */
  surLeRadier(p: { x: number; z: number }): boolean {
    return surLeRadier(p.x, p.z);
  }

  /** Jusqu'où l'on entend les Éteints : sur le radier, l'eau couvre tout au-delà de 3 m (G1). */
  ouie(p: { x: number; z: number } | null): number {
    return p && surLeRadier(p.x, p.z) ? OUIE_RADIER : Infinity;
  }

  // ---------- Agir ----------

  /** Ce qu'on peut faire ici en plus : la cloche, haler ou rappeler le bac, examiner une balise. */
  proposer(p: Position, base: Propositions, instant: number, debutMonde: number): Propositions {
    const dBase = base.cible ? Math.max(0, Math.hypot(base.cible.x - p.x, base.cible.z - p.z) - (base.cible.rayon ?? 0.5)) : base.A ? 0 : Infinity;
    let meilleure: { d: number; prop: Propositions } | null = null;
    const garder = (d: number, prop: Propositions) => {
      if (d <= 2 && d < dBase && (!meilleure || d < meilleure.d)) meilleure = { d, prop };
    };
    const xr = this.radeau(instant);
    const ou = accostage(xr);
    const haler: ActionProposee = { libelle: "Haler le bac", message: { t: "gue", op: "haler" } };
    const examenBac = "Le radeau du passeur, sur ses bidons, glisse le long du câble. On tire la corde : un quart de minute jusqu'à l'autre rive, de jour comme de nuit. On peut lâcher pour se battre.";
    if (aBord(p.x, p.z, xr, 0.1)) garder(0, { A: haler, B: { libelle: "Examiner", examiner: examenBac }, cible: null });
    for (const quai of [{ nom: "cale" as const, ...BAC.cale }, { nom: "ponton" as const, ...BAC.ponton }]) {
      const d = Math.hypot(quai.embarquement.x - p.x, quai.embarquement.z - p.z);
      if (d > PORTEE_EMBARCADERE || ou === quai.nom) continue;
      garder(Math.max(0, d - 0.6), {
        A: { libelle: "Rappeler le radeau", message: { t: "gue", op: "haler" } },
        B: { libelle: "Examiner", examiner: "Le radeau est de l'autre côté. La corde du câble passe ici : on peut le haler à vide jusqu'à soi." },
        cible: { x: quai.embarquement.x, z: quai.embarquement.z },
      });
    }
    garder(Math.max(0, Math.hypot(CLOCHE.x - p.x, CLOCHE.z - p.z) - 0.6), {
      A: { libelle: "Sonner la cloche (attire les Éteints)", message: { t: "gue", op: "cloche" } },
      B: { libelle: "Examiner", examiner: "La cloche du passeur : on la sonnait pour appeler le bac. Elle s'entend à quarante mètres, sur les deux rives." },
      cible: { x: CLOCHE.x, z: CLOCHE.z },
    });
    let balise: { x: number; z: number } | null = null;
    let dBalise = Infinity;
    for (const b of BALISES) {
      const d = Math.hypot(b.x - p.x, b.z - p.z);
      if (d < dBalise) [balise, dBalise] = [b, d];
    }
    if (balise && dBalise < 1.6) garder(Math.max(0, dBalise - 0.4), { A: null, B: { libelle: "Examiner la balise", examiner: texteBalise(crue(instant, debutMonde).niveau) }, cible: { x: balise.x, z: balise.z, rayon: 0.3 } });
    return meilleure ? (meilleure as { prop: Propositions }).prop : base;
  }

  // ---------- Les ricochets (G8) ----------

  /**
   * Un galet bien lancé : il vole jusqu'à l'eau, puis rebondit de point en point jusqu'à l'autre rive. Chaque contact
   * fait « plouf » et une gerbe d'eau ; le dernier bond retombe sur les galets.
   */
  ricocher(p: ProjectileVu, lancer: (q: ProjectileVu, arrivee: () => void) => void, fin: () => void): void {
    const points = [{ x: p.x0, z: p.z0 }, ...(p.ricochets ?? []), { x: p.x1, z: p.z1 }];
    const etape = (i: number) => {
      if (i >= points.length - 1) return fin();
      const a = points[i]!;
      const b = points[i + 1]!;
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      const dernier = i === points.length - 2;
      const q: ProjectileVu = { de: p.de, objet: p.objet, x0: a.x, z0: a.z, x1: b.x, z1: b.z, duree: Math.round((d / (i === 0 ? 14 : 11)) * 1000), impact: dernier ? "sol" : "eau" };
      lancer(q, () => {
        if (!dernier) this.jouer("plouf", b);
        etape(i + 1);
      });
    };
    etape(0);
  }

  // ---------- Le son ----------

  /** Les sons continus du gué : le clapot du radier (au plus près du joueur), le câble du bac quand le radeau avance. */
  sons(p: { x: number; z: number } | null, instant: number, debutMonde: number): { cle: string; id: IdSon; ou?: { x: number; z: number }; gain?: number }[] {
    if (!p) return [];
    const sons: { cle: string; id: IdSon; ou?: { x: number; z: number }; gain?: number }[] = [];
    const ou = { x: Math.max(RADIER.x0, Math.min(RADIER.x1, p.x)), z: Math.max(RADIER.z0, Math.min(RADIER.z1, p.z)) };
    sons.push({ cle: "gue_clapot", id: "clapot_radier", ou, gain: crue(instant, debutMonde).niveau === "noye" ? 1.4 : 1 });
    if (this.mouvement.sens !== 0 && accostage(this.radeau(instant)) === null) sons.push({ cle: "gue_cable", id: "cable_bac", ou: { x: this.radeau(instant), z: BAC.z } });
    return sons;
  }

  // ---------- La lumière ----------

  /** Les lumières du gué, la nuit : la guirlande de Chez Lulu qui clignote, la lanterne du passeur, le feu du banc… */
  lumieres(nuit: boolean, p: { x: number; z: number } | null): SourceLumiere[] {
    if (!nuit) return [];
    const t = performance.now() / 1000;
    const g = eclatGuirlande(t);
    const sources: SourceLumiere[] = [];
    for (const l of LUMIERES) {
      // Le lampadaire « à détection de présence » ne s'allume qu'au passage.
      if (l.nature.startsWith("lampadaire") && (!p || Math.hypot(l.x - p.x, l.z - p.z) > 9)) continue;
      const guirlande = l.nature.startsWith("guirlande");
      const feu = l.nature.startsWith("feu") || l.nature.startsWith("lanterne") || l.nature.startsWith("bougies");
      sources.push({ x: l.x, y: l.y, z: l.z, couleur: l.couleur, intensite: l.intensite * (guirlande ? g : 1), portee: l.portee, vacillement: feu ? 0.8 : 0 });
    }
    return sources;
  }

  // ---------- À chaque image ----------

  /** Les tronçons autour du joueur, le radeau, la nappe du radier, les toits qui s'effacent, l'eau qui court. */
  animer(p: { x: number; z: number }, dt: number, lacet: number, instant: number, debutMonde: number): void {
    const xr = this.radeau(instant);
    const ici = ORDRE.indexOf(tronconDe(p.x));
    const voulus = new Set<string>([ORDRE[ici]!, ...(ici > 0 ? [ORDRE[ici - 1]!] : []), ...(ici < 3 ? [ORDRE[ici + 1]!] : [])]);
    // Le radeau est dans le tronçon de la rive : on le garde tant qu'il n'est pas rentré à la cale.
    if (accostage(xr) !== "cale" && Math.abs(ORDRE.indexOf(TRONCON_RADEAU) - ici) <= 2) voulus.add(TRONCON_RADEAU);
    for (const id of voulus) if (!this.troncons.has(id)) this.construire(id);
    for (const [id, t] of this.troncons) if (!voulus.has(id)) this.defaire(id, t);

    // La nappe du radier monte avec la crue (G4), doucement.
    const voulu = crue(instant, debutMonde).montee;
    this.nappe += (voulu - this.nappe) * Math.min(1, dt * 0.6);
    for (const t of this.troncons.values()) {
      const nappe = t.modele.userData.nappeRadier as THREE.Object3D | null;
      if (nappe) nappe.position.y = this.nappe;
      const radeau = t.modele.userData.radeau as THREE.Object3D | null;
      // Dans le repère du tronçon (le modèle, recentré) : x = x du modèle − décalage du tronçon.
      if (radeau) radeau.position.x = 100 - xr - this.decalage(t.id);
    }
    estomperToits(this.groupe, p.x, p.z, dt, lacet);
    // L'eau qui court, la guirlande et les flammes (les matières du modèle sont partagées : une fois suffit).
    for (const t of this.troncons.values()) {
      const anime = t.modele.children.find((o) => typeof o.userData.animer === "function");
      if (anime) {
        (anime.userData.animer as (t: number) => void)(performance.now() / 1000);
        break;
      }
    }
  }

  private decalage(id: string): number {
    return modele.FICHE.cartes.find((c) => c.id === id)!.decalage.x;
  }

  /** Construit un tronçon : le modèle, retourné, posé à sa place ; ses toits dans le repère du jeu. */
  private construire(id: string): void {
    const x0 = this.decalage(id);
    const m = modele.creer({ carte: id });
    const carte = outils.matieres().panneaux?.map ?? null;
    if (carte) {
      repeindreLesDirections(carte);
      remettreLesTextesALEndroit(m, carte);
    }
    const g = new THREE.Group();
    g.name = `gue:${id}`;
    g.scale.x = -1;
    g.position.set(100 - x0, 0, 35);
    g.add(m);
    // Les toits : du repère du tronçon (recentré, avant le miroir) au repère du jeu.
    const versJeu = (b: Boite): Boite => ({ x: 100 - x0 - b.x, z: b.z + 35, l: b.l, p: b.p });
    const toits = ((m.userData.toits ?? []) as ToitJeu[]).map((t) => ({ ...t, boite: versJeu(t.boite), ...(t.horsDe ? { horsDe: versJeu(t.horsDe) } : {}) }));
    m.userData.toits = undefined;
    g.userData.toits = toits;
    // La vue par pièce (0.7.2) : ce que le personnage ne voit pas est dessiné « en souvenir ».
    brouillerTout([g]);
    this.groupe.add(g);
    this.troncons.set(id, { id, groupe: g, modele: m });
  }

  /** Défait un tronçon trop loin : ses géométries s'en vont (les matières du modèle sont partagées, elles restent). */
  private defaire(id: string, t: Troncon): void {
    this.groupe.remove(t.groupe);
    t.groupe.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    this.troncons.delete(id);
  }

  /** Les tronçons construits (pour les mesures). */
  get construits(): string[] {
    return [...this.troncons.keys()];
  }
}
