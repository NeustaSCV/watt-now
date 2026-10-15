// À terre ou détruit, au corps de l'Éteint (plan 0.9 §3.3 bis, chantier F). Pas de barre de vie ni de signe flottant
// (Book 05, principe 1) : on lit l'Éteint lui-même.
//
// - À terre, il n'est pas fini : il remue (soubresauts, une main qui griffe le sol, la tête qui se soulève) et, juste
//   avant de se relever, il prend appui sur les coudes, les genoux remontés.
// - Détruit, il est mort et fait partie du décor : plus un mouvement, les yeux mi-clos, la peau qui vire au gris cendre,
//   les vêtements aux teintes du sol, une matière mate ; les membres se relâchent à plat ; un peu de poussière à la
//   chute ; quelques brins d'herbe ou feuilles le recouvrent à moitié ; à la fin, il s'efface doucement.
//
// Tout se fait par-dessus l'animation de chute (Death01), os par os, dans le repère du corps couché. Rien de plus par
// Éteint qu'un maillage de couvert (géométrie et matériau partagés) : la teinte passe par des valeurs de son matériau.

import * as THREE from "three";
import type { EteintVu } from "../../../commun/src/eteints.ts";
import type { LieuJouable } from "../../../commun/src/lieux.ts";
import { Assemblage, placer } from "./assemblage.ts";
import { SuiviAuSol } from "./au-sol-etat.ts";
import type { Humanoide } from "./humanoides.ts";
import { aleatoire } from "./materiaux.ts";

// ---------- Les réglages du détruit (à choisir par le porteur : captures côte à côte) ----------

export interface ReglageCorps {
  /** Le gris cendre de la peau (et des yeux). */
  peau: number;
  /** La part des vêtements passée aux teintes du sol (0 : leurs couleurs ; 1 : le sol). */
  vetements: number;
  /** La matité (0 : la matière d'origine ; 1 : sans reflet, comme une pierre ou une souche). */
  matite: number;
  /** Le couvert d'herbe ou de feuilles (0 : aucun ; 1 : quelques brins ; 2 : à moitié recouvert). */
  couvert: number;
}

/** Trois réglages proposés ; `cendre` par défaut. */
export const REGLAGES_CORPS = {
  /** A · Cendre : la peau gris cendre clair, les vêtements bien ternis, mat, quelques brins. */
  cendre: { peau: 0x9b9a94, vetements: 0.7, matite: 1, couvert: 1 },
  /** B · Terre : une cendre plus sombre, les vêtements presque couleur du sol, plus de couvert : il se fond au décor. */
  terre: { peau: 0x85817a, vetements: 0.9, matite: 1, couvert: 1.7 },
  /** C · Pâle : une peau très pâle, les vêtements moins ternis, un peu de reflet, peu de couvert : le plus voyant. */
  pale: { peau: 0xb4b2aa, vetements: 0.45, matite: 0.7, couvert: 0.5 },
} satisfies Record<string, ReglageCorps>;
export type NomReglageCorps = keyof typeof REGLAGES_CORPS;
/** En développement, `?corps=terre` (ou `pale`) montre un autre réglage, pour les captures. */
const DEMANDE = (import.meta as { env?: { DEV?: boolean } }).env?.DEV ? new URLSearchParams(location.search).get("corps") : null;
const REGLAGE: ReglageCorps = REGLAGES_CORPS[(DEMANDE ?? "cendre") as NomReglageCorps] ?? REGLAGES_CORPS.cendre;

/** Le sol de chaque lieu : la teinte vers laquelle passent les vêtements, et ce qui pousse dessus. */
type Couvert = "herbe" | "feuilles" | "vase" | null;
const SOLS: Record<LieuJouable, { teinte: number; couvert: Couvert }> = {
  terrain: { teinte: 0x6f6a4e, couvert: "herbe" },
  station: { teinte: 0x736d58, couvert: "feuilles" },
  gue: { teinte: 0x5b5948, couvert: "vase" },
  moulin: { teinte: 0x6f6a4e, couvert: "herbe" },
  // La Coopérative et le Carrefour : du béton, des sols de magasin. De la poussière, rien qui pousse.
  cooperative: { teinte: 0x77736a, couvert: null },
  comptoir: { teinte: 0x77736a, couvert: null },
  // 0.10 (chantier A) : le niveau 2, branché vide ; le sol du terrain en attendant les modèles (chantiers H à K).
  route_pont: { teinte: 0x6f6a4e, couvert: "herbe" },
  grand_hotel: { teinte: 0x6f6a4e, couvert: "herbe" },
  corniche: { teinte: 0x6f6a4e, couvert: "herbe" },
  phare: { teinte: 0x6f6a4e, couvert: "herbe" },
};
let sol = SOLS.terrain;
/** Le lieu où l'on est (main.ts, à l'arrivée) : la teinte du sol des corps, et leur couvert. */
export function solDesCorps(lieu: LieuJouable): void {
  sol = SOLS[lieu] ?? SOLS.terrain;
}

// ---------- Les gestes au sol (radians, mètres, secondes) ----------

/** À terre : la tête qui se soulève, le buste, la main qui griffe, une jambe qui se replie, les soubresauts. */
const REMUE = { tete: 0.6, buste: 0.26, torsion: 0.08, griffe: 0.55, jambe: 0.5, sursaut: { entre: [0.5, 1.6], force: 0.22, amorti: 9 } };
/** Il prend appui : buste relevé, sur les coudes, genoux remontés. */
const APPUI = { buste: 0.4, tete: 0.35, cuisse: 0.55, mollet: 1.0 };
/** Détruit : bras à plat le long du corps, un peu écartés ; tête tournée ; jambes écartées ; pieds tombés en dehors. */
const RELACHE = { bras: 0.55, ecartBras: 0.3, tete: 0.8, jambes: 0.12, pieds: 0.6, doigts: 0.8 };
/** La poussière à la chute du détruit : quand (part de la chute), combien de temps, jusqu'où. */
const POUSSIERE = { quand: 0.5, duree: 1.3, rayon: 0.7 };
/** Le couvert pousse en quelques secondes une fois le corps posé. */
const POUSSE_S = 2.5;

// ---------- Les objets partagés ----------

const HAUT = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _d = new THREE.Vector3();
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _p = new THREE.Quaternion();
const _r = new THREE.Quaternion();
const _rp = new THREE.Quaternion();
const _rp2 = new THREE.Quaternion();
const _bassin = new THREE.Vector3();
const _axe = new THREE.Vector3();
const _travers = new THREE.Vector3();
const IDENTITE = new THREE.Quaternion();
const _cendre = new THREE.Color();
const _sol = new THREE.Color();

/** La poussière : sept petites mottes grises, une géométrie et un matériau pour tous. */
let poussiere: { geometrie: THREE.BufferGeometry; materiau: THREE.Material } | null = null;
function mottesDePoussiere(): { geometrie: THREE.BufferGeometry; materiau: THREE.Material } {
  if (poussiere) return poussiere;
  const a = aleatoire(77);
  const g: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + a() * 0.5;
    g.push(new THREE.IcosahedronGeometry(0.06 + a() * 0.04, 0).scale(1.4, 0.45, 1.4).translate(Math.cos(angle) * 0.5, 0.06, Math.sin(angle) * 0.5));
  }
  const c = new Assemblage(5);
  for (const x of g) c.ajouter(x, 0xc8bea8, "mat", 0.06);
  const m = c.maillages()[0]!;
  const materiau = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, transparent: true, opacity: 0.4, depthWrite: false });
  poussiere = { geometrie: m.geometry, materiau };
  return poussiere;
}

/**
 * Le couvert posé sur un corps (repère : x en travers, z vers la tête, le bassin à l'origine, au sol). Trois variantes
 * par genre de sol et par densité, partagées entre tous les corps.
 */
const couverts = new Map<string, THREE.Mesh>();
function couvert(genre: Exclude<Couvert, null>, densite: number, variante: number): THREE.Mesh | null {
  if (densite <= 0) return null;
  const cle = `${genre}|${densite}|${variante}`;
  const deja = couverts.get(cle);
  if (deja) return deja;
  const a = aleatoire(1009 + variante * 37 + Math.round(densite * 10));
  const c = new Assemblage(variante + 3);
  const herbes = genre === "vase" ? [0x5d6440, 0x6b6a45, 0x4e5636] : [0x7fa35a, 0x9aa65e, 0x6f8a48, 0xa9a06a];
  const feuilles = genre === "vase" ? [0x5a5038, 0x4a4632] : [0x9a6a38, 0xb08a48, 0x7a5a32, 0x8a8a4a, 0x6e5030];
  const au = <T>(l: readonly T[]): T => l[Math.floor(a() * l.length)]!;
  // Des touffes le long du corps, qui penchent vers lui : elles mangent sa silhouette.
  const bords: [number, number][] = [[0.24, -0.85], [-0.24, -0.75], [0.26, -0.45], [-0.25, -0.35], [0.3, 0.05], [-0.32, 0.12], [0.3, 0.45], [-0.28, 0.5], [0.05, 0.95], [-0.1, -1.05]];
  const nTouffes = genre === "feuilles" ? Math.round(4 * densite) : Math.round(7 * densite);
  for (let i = 0; i < Math.min(bords.length, nTouffes); i++) {
    const [x, z] = bords[(i * 3 + variante) % bords.length]!;
    for (let j = 0; j < 4; j++) {
      const h = 0.22 + a() * 0.2;
      const brin = new THREE.ConeGeometry(0.014 + a() * 0.01, h, 3, 1, true).translate(0, h / 2, 0);
      // Penché vers le corps (vers x = 0), de 20 à 50°.
      const penche = (0.35 + a() * 0.5) * -Math.sign(x || 1);
      c.ajouter(placer(brin, x + (a() - 0.5) * 0.12, 0, z + (a() - 0.5) * 0.14, (a() - 0.5) * 0.4, a() * 6, penche), au(herbes), "mat", 0.08);
    }
  }
  // Des brins et des feuilles tombés sur lui : à plat, sur le buste (≈ 0,2 m) et les jambes (≈ 0,13 m).
  const nPoses = Math.round((genre === "herbe" ? 6 : 12) * densite);
  for (let i = 0; i < nPoses; i++) {
    const surBuste = a() < 0.5;
    const z = surBuste ? 0.05 + a() * 0.4 : -0.85 + a() * 0.7;
    const x = (a() - 0.5) * (surBuste ? 0.26 : 0.3);
    const y = surBuste ? 0.19 + a() * 0.03 : 0.12 + a() * 0.03;
    const feuille = genre !== "herbe" && a() < 0.75;
    const g = feuille
      ? new THREE.CircleGeometry(0.035 + a() * 0.02, 5).scale(1, 1.6, 1).rotateX(-Math.PI / 2)
      : new THREE.BoxGeometry(0.012, 0.004, 0.16 + a() * 0.1);
    c.ajouter(placer(g, x, y, z, (a() - 0.5) * 0.3, a() * 6, (a() - 0.5) * 0.3), feuille ? au(feuilles) : au(herbes), "mat", 0.1);
  }
  // Et quelques-unes autour, au sol.
  if (genre !== "herbe") {
    for (let i = 0; i < Math.round(8 * densite); i++) {
      const g = new THREE.CircleGeometry(0.035 + a() * 0.02, 5).scale(1, 1.6, 1).rotateX(-Math.PI / 2);
      c.ajouter(placer(g, (a() - 0.5) * 1.2, 0.012, -1.1 + a() * 2.1, 0, a() * 6, 0), au(feuilles), "mat", 0.1);
    }
  }
  const m = c.maillages()[0] ?? null;
  if (!m) return null;
  m.castShadow = false;
  m.receiveShadow = true;
  couverts.set(cle, m);
  return m;
}

// ---------- Le corps au sol ----------

interface Os {
  bassin: THREE.Bone;
  tete: THREE.Bone;
  cou: THREE.Bone;
  colonne: THREE.Bone[];
  bras: { cote: "l" | "r"; haut: THREE.Bone; bas: THREE.Bone; main: THREE.Bone; doigt: THREE.Bone }[];
  jambes: { cote: "l" | "r"; cuisse: THREE.Bone; mollet: THREE.Bone; pied: THREE.Bone }[];
  /** Les doigts, et leur repos (mains ouvertes). */
  doigts: { os: THREE.Bone; repos: THREE.Quaternion }[];
  tous: THREE.Bone[];
}

export class CorpsAuSol {
  private readonly suivi = new SuiviAuSol();
  private readonly aleat: () => number;
  private os: Os | null | undefined;
  private t = 0;
  private sursaut = 0;
  private prochainSursaut = 0.4;
  /** Le côté de la main qui griffe, et celui où la tête du mort retombe (±1). */
  private readonly main: 1 | -1;
  private readonly versTete: 1 | -1;
  /** La pose du détruit, une fois posée pour de bon : on la remet à chaque image (l'animation la réécrirait). */
  private fige: THREE.Quaternion[] | null = null;
  /**
   * La pose de l'animation, os par os, et ce qu'on y a ajouté à l'image d'avant. Une animation finie (la chute) ne
   * réécrit plus les os : sans ça, nos gestes s'ajouteraient d'une image à l'autre.
   */
  private base: THREE.Quaternion[] = [];
  private applique: THREE.Quaternion[] = [];
  private poussiereVue: THREE.Mesh | null = null;
  private poussiereT = -1;
  private couvertVu: THREE.Mesh | null = null;
  private pousse = 0;
  private ombre = true;
  /** Il n'est encore jamais tombé : rien à faire. */
  private attente = true;

  constructor(graine: number) {
    this.aleat = aleatoire(graine * 53 + 11);
    this.main = this.aleat() < 0.5 ? 1 : -1;
    this.versTete = this.aleat() < 0.5 ? 1 : -1;
  }

  /** À appeler à chaque image, après l'animation du corps (Humanoide.mettreAJour). */
  animer(dt: number, c: Humanoide, objet: THREE.Object3D, vu: EteintVu, rampant: boolean): void {
    const etat = vu.etat;
    if (this.attente && etat !== "a_terre" && etat !== "detruit") {
      // Vu debout : il n'est pas encore tombé (sa chute ne sera pas une découverte).
      this.suivi.avancer(dt, etat, 0, false, false);
      return;
    }
    this.attente = false;
    const chuteAction = rampant ? null : c.action("Death01");
    const chute = chuteAction ? Math.min(1, chuteAction.time / chuteAction.getClip().duration) : 1;
    const s = this.suivi;
    const avant = s.poids.cendre;
    const decouvert = s.avancer(dt, etat, chute, !!vu.seReleve, !!vu.efface);
    const p = s.poids;
    if (decouvert && chuteAction) {
      // Un corps trouvé en arrivant : déjà à terre, sans chute.
      chuteAction.time = chuteAction.getClip().duration;
      c.mettreAJour(0);
    }
    if (etat !== "detruit" && etat !== "a_terre") {
      this.fige = null;
      if (!s.pose && avant === 0 && !this.couvertVu && !this.poussiereVue) return;
    }

    // La teinte : la peau au gris cendre, les vêtements au sol, la matière mate ; l'effacement de la fin.
    if (p.cendre > 0 || avant > 0) {
      _cendre.setHex(REGLAGE.peau);
      _sol.setHex(sol.teinte);
      c.ternir(p.cendre, p.cendre * REGLAGE.vetements, p.cendre * REGLAGE.matite, p.effacement, _cendre, _sol);
      // Les yeux mi-clos.
      if (etat === "detruit") c.fermerLesYeux(1 - 0.65 * p.cendre);
    }
    const ombre = p.effacement === 0;
    if (ombre !== this.ombre) {
      this.ombre = ombre;
      c.objet.traverse((n) => {
        if ((n as THREE.Mesh).isMesh) n.castShadow = ombre;
      });
    }

    this.t += dt;
    if (!rampant && this.osDe(c)) {
      if (this.fige) this.remettre();
      else if (s.pose) {
        this.poser(dt, c, p.remue, p.appui, p.relache);
        if (s.fige) this.fige = this.os!.tous.map((o) => o.quaternion.clone());
      }
    }

    // La poussière, à l'impact du détruit (pas pour un corps trouvé en arrivant).
    if (etat === "detruit" && !decouvert && this.poussiereT < 0 && chute >= POUSSIERE.quand && p.cendre < 1) this.poussiereT = 0;
    this.souffler(dt, objet);
    // Le couvert : quelques brins ou feuilles, une fois le corps posé.
    this.couvrir(dt, c, objet, etat === "detruit" && p.relache > 0.5, decouvert, p.effacement);
  }

  private osDe(c: Humanoide): Os | null {
    if (this.os !== undefined) return this.os;
    const o = (n: string) => c.osNomme(n);
    const bassin = o("pelvis");
    const tete = o("Head");
    const cou = o("neck_01");
    if (!bassin || !tete || !cou) return (this.os = null);
    const bras: Os["bras"] = [];
    const jambes: Os["jambes"] = [];
    for (const cote of ["l", "r"] as const) {
      const haut = o(`upperarm_${cote}`), bas = o(`lowerarm_${cote}`), main = o(`hand_${cote}`), doigt = o(`middle_01_${cote}`);
      if (haut && bas && main && doigt) bras.push({ cote, haut, bas, main, doigt });
      const cuisse = o(`thigh_${cote}`), mollet = o(`calf_${cote}`), pied = o(`foot_${cote}`);
      if (cuisse && mollet && pied) jambes.push({ cote, cuisse, mollet, pied });
    }
    // Le repos des doigts (mains ouvertes), d'après la liaison du squelette.
    const doigts: Os["doigts"] = [];
    const tous: THREE.Bone[] = [];
    c.objet.traverse((n) => {
      const m = n as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh || doigts.length > 0) return;
      const sq = m.skeleton;
      sq.bones.forEach((b, i) => {
        if (!/^(index|middle|ring|pinky|thumb)_0[123]_/.test(b.name)) return;
        const parent = sq.bones.indexOf(b.parent as THREE.Bone);
        if (parent < 0) return;
        const local = sq.boneInverses[parent]!.clone().multiply(sq.boneInverses[i]!.clone().invert());
        const repos = new THREE.Quaternion();
        local.decompose(_a, repos, _b);
        doigts.push({ os: b, repos });
      });
    });
    c.objet.traverse((n) => {
      if ((n as THREE.Bone).isBone) tous.push(n as THREE.Bone);
    });
    return (this.os = { bassin, tete, cou, colonne: ["spine_01", "spine_02", "spine_03"].map(o).filter((x): x is THREE.Bone => !!x), bras, jambes, doigts, tous });
  }

  private remettre(): void {
    const o = this.os!;
    for (let i = 0; i < o.tous.length; i++) o.tous[i]!.quaternion.copy(this.fige![i]!);
  }

  /**
   * La pose au sol, par-dessus la fin de la chute : `remue`, `appui` et `relache` (0 à 1) dosent chaque geste. Le
   * repère du corps couché : `axe` du bassin vers la tête, `cote` en travers, la verticale.
   */
  private poser(dt: number, c: Humanoide, remue: number, appui: number, relache: number): void {
    const o = this.os!;
    // On repart de la pose de l'animation : la nouvelle, si elle a réécrit l'os ; sinon celle qu'on avait gardée.
    if (this.base.length !== o.tous.length) {
      this.base = o.tous.map((b) => b.quaternion.clone());
      this.applique = o.tous.map((b) => b.quaternion.clone());
    }
    for (let i = 0; i < o.tous.length; i++) {
      const q = o.tous[i]!.quaternion;
      if (!q.equals(this.applique[i]!)) this.base[i]!.copy(q);
      else q.copy(this.base[i]!);
    }
    c.objet.updateMatrixWorld(true);
    const bassin = o.bassin.getWorldPosition(_bassin);
    const axe = o.tete.getWorldPosition(_axe).sub(bassin).setY(0);
    if (axe.lengthSq() < 1e-6) return;
    axe.normalize();
    const travers = _travers.crossVectors(HAUT, axe);
    // Le côté de chaque bras et de chaque jambe, d'après où il est.
    const signe = (b: THREE.Bone) => (b.getWorldPosition(_v).sub(bassin).dot(travers) >= 0 ? 1 : -1);
    const tourner = (b: THREE.Bone, autour: THREE.Vector3, angle: number) => {
      if (Math.abs(angle) < 1e-4) return;
      tournerMonde(b, _r.setFromAxisAngle(autour, angle));
    };
    const vivant = remue * (1 - appui);

    // 1. Le buste, le cou et la tête (avant les bras : ils en dépendent).
    // Soubresauts : une secousse brève, de loin en loin.
    this.sursaut *= Math.exp(-REMUE.sursaut.amorti * dt);
    if (vivant > 0 && this.t >= this.prochainSursaut) {
      this.sursaut = 1;
      const [a, b] = REMUE.sursaut.entre;
      this.prochainSursaut = this.t + a! + this.aleat() * (b! - a!);
    }
    // La tête se soulève, retombe à demi, se soulève encore.
    const leve = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(this.t * 1.7), 2);
    const secousse = this.sursaut * REMUE.sursaut.force;
    const [c1, c2] = o.colonne;
    if (c1) tourner(c1, travers, -(vivant * (REMUE.buste * leve * 0.5 + secousse) + appui * APPUI.buste * 0.6));
    if (c2) {
      tourner(c2, travers, -(vivant * REMUE.buste * leve * 0.5 + appui * APPUI.buste * 0.4));
      tourner(c2, axe, vivant * REMUE.torsion * Math.sin(this.t * 2.3));
    }
    tourner(o.cou, travers, -(vivant * (REMUE.tete * leve + secousse) + appui * APPUI.tete) * 0.55);
    tourner(o.tete, travers, -(vivant * (REMUE.tete * leve + secousse) + appui * APPUI.tete) * 0.45);
    if (relache > 0) {
      tourner(o.cou, axe, this.versTete * RELACHE.tete * 0.3 * relache);
      tourner(o.tete, axe, this.versTete * RELACHE.tete * 0.7 * relache);
    }

    // 2. Les bras.
    for (const b of o.bras) {
      const s = signe(b.haut);
      if (vivant > 0 && s === this.main) {
        // La main qui griffe : le bras balaie le sol, du dessus de la tête vers le côté, la main crochue.
        const phi = REMUE.griffe + 0.55 * (0.5 + 0.5 * Math.sin(this.t * 2.6));
        pointer(b.haut, b.bas, _d.copy(axe).multiplyScalar(Math.cos(phi)).addScaledVector(travers, s * Math.sin(phi)).addScaledVector(HAUT, -0.12), vivant);
        pointer(b.bas, b.main, _d.copy(axe).multiplyScalar(Math.cos(phi + 0.6)).addScaledVector(travers, s * Math.sin(phi + 0.6)).addScaledVector(HAUT, -0.3), vivant);
        b.bas.getWorldPosition(_a);
        b.main.getWorldPosition(_b);
        pointer(b.main, b.doigt, _d.subVectors(_b, _a).setY(0).normalize().multiplyScalar(0.6).addScaledVector(HAUT, -0.8), vivant);
      }
      if (appui > 0) {
        // Sur les coudes : le bras vers le sol, l'avant-bras à plat vers les pieds.
        pointer(b.haut, b.bas, _d.copy(HAUT).multiplyScalar(-0.75).addScaledVector(travers, s * 0.35).addScaledVector(axe, -0.45), appui);
        pointer(b.bas, b.main, _d.copy(axe).multiplyScalar(-0.85).addScaledVector(travers, s * 0.25).addScaledVector(HAUT, -0.25), appui);
        pointer(b.main, b.doigt, _d.copy(axe).multiplyScalar(-0.85).addScaledVector(travers, s * 0.25).addScaledVector(HAUT, -0.4), appui);
      }
      if (relache > 0) {
        // Le mort : les bras à plat le long du corps, un peu écartés, chacun à sa façon.
        const e = RELACHE.bras + (s > 0 ? 1 : -1) * this.versTete * RELACHE.ecartBras * 0.5;
        pointer(b.haut, b.bas, _d.copy(axe).multiplyScalar(-Math.cos(e)).addScaledVector(travers, s * Math.sin(e)).addScaledVector(HAUT, -0.05), relache);
        const e2 = e + 0.25;
        pointer(b.bas, b.main, _d.copy(axe).multiplyScalar(-Math.cos(e2)).addScaledVector(travers, s * Math.sin(e2)).addScaledVector(HAUT, -0.06), relache);
        pointer(b.main, b.doigt, _d.copy(axe).multiplyScalar(-Math.cos(e2)).addScaledVector(travers, s * Math.sin(e2)).addScaledVector(HAUT, -0.12), relache);
      }
    }
    // Les doigts se desserrent.
    if (relache > 0) for (const d of o.doigts) d.os.quaternion.slerp(d.repos, relache * RELACHE.doigts);
    this.garder();

    // 3. Les jambes.
    for (const j of o.jambes) {
      const s = signe(j.cuisse);
      if (vivant > 0) {
        // La jambe opposée à la main qui griffe se replie et glisse, comme pour se relever ; l'autre sursaute.
        const replie = s === this.main ? 0 : vivant * REMUE.jambe * (0.5 + 0.5 * Math.sin(this.t * 1.1 - 1));
        tourner(j.cuisse, travers, replie + secousse * 1.2 * (s === this.main ? 1 : 0.5));
        tourner(j.mollet, travers, -replie * 1.8);
      }
      if (appui > 0) {
        tourner(j.cuisse, travers, APPUI.cuisse * appui);
        tourner(j.mollet, travers, -APPUI.mollet * appui);
      }
      if (relache > 0) {
        tourner(j.cuisse, HAUT, -s * RELACHE.jambes * relache);
        tourner(j.pied, axe, -s * RELACHE.pieds * relache);
      }
    }
    this.garder();
  }

  /** Ce qu'on vient de poser, pour reconnaître à l'image suivante si l'animation a réécrit l'os. */
  private garder(): void {
    const o = this.os!;
    for (let i = 0; i < o.tous.length; i++) this.applique[i]!.copy(o.tous[i]!.quaternion);
  }

  /** La poussière de la chute : les mottes s'écartent en grossissant, puis retombent. */
  private souffler(dt: number, objet: THREE.Object3D): void {
    // -1 : pas encore ; +∞ : retombée.
    if (this.poussiereT < 0 || this.poussiereT === Number.POSITIVE_INFINITY) return;
    if (this.poussiereT === 0 && !this.poussiereVue) {
      const { geometrie, materiau } = mottesDePoussiere();
      this.poussiereVue = new THREE.Mesh(geometrie, materiau);
      this.poussiereVue.castShadow = false;
      this.poussiereVue.renderOrder = 1;
      const bassin = this.os?.bassin;
      if (bassin) {
        objet.updateMatrixWorld(true);
        objet.worldToLocal(bassin.getWorldPosition(_a));
        this.poussiereVue.position.set(_a.x, 0, _a.z);
      }
      objet.add(this.poussiereVue);
    }
    this.poussiereT += dt;
    const k = Math.min(1, this.poussiereT / POUSSIERE.duree);
    const m = this.poussiereVue!;
    const ecart = 0.6 + (POUSSIERE.rayon / 0.5 - 0.6) * (1 - Math.pow(1 - k, 3));
    const taille = Math.sin(Math.PI * Math.min(1, k * 1.15));
    m.scale.set(ecart, Math.max(0.01, taille), ecart);
    m.position.y = 0.04 * k;
    if (k >= 1) {
      objet.remove(m);
      this.poussiereVue = null;
      this.poussiereT = Number.POSITIVE_INFINITY;
    }
  }

  /** Le couvert : posé sur le corps une fois relâché, il pousse en quelques secondes ; il s'efface avec lui. */
  private couvrir(dt: number, c: Humanoide, objet: THREE.Object3D, voulu: boolean, decouvert: boolean, effacement: number): void {
    if (!voulu) {
      if (this.couvertVu) {
        objet.remove(this.couvertVu);
        this.couvertVu = null;
        this.pousse = 0;
      }
      return;
    }
    if (!this.couvertVu) {
      if (!sol.couvert) return;
      const modele = couvert(sol.couvert, REGLAGE.couvert, Math.floor(this.aleat() * 3));
      const o = this.osDe(c);
      if (!modele || !o) return;
      const m = new THREE.Mesh(modele.geometry, modele.material);
      m.castShadow = false;
      m.receiveShadow = true;
      // Dans le repère du corps couché : le bassin à l'origine, z vers la tête.
      c.objet.updateMatrixWorld(true);
      const bassin = o.bassin.getWorldPosition(new THREE.Vector3());
      const tete = o.tete.getWorldPosition(new THREE.Vector3());
      objet.updateMatrixWorld(true);
      objet.worldToLocal(bassin);
      objet.worldToLocal(tete);
      m.position.set(bassin.x, 0, bassin.z);
      m.rotation.y = Math.atan2(tete.x - bassin.x, tete.z - bassin.z);
      objet.add(m);
      this.couvertVu = m;
      this.pousse = decouvert ? 1 : 0;
    }
    this.pousse = Math.min(1, this.pousse + dt / POUSSE_S);
    const k = this.pousse * (1 - effacement);
    this.couvertVu.scale.set(1, Math.max(0.01, k), 1);
    this.couvertVu.visible = k > 0.01;
  }
}

/** Tourne un os de `r` dans le repère du monde (autour de son attache), puis met à jour ses enfants. */
function tournerMonde(os: THREE.Bone, r: THREE.Quaternion): void {
  const parent = os.parent;
  if (!parent) return;
  parent.getWorldQuaternion(_p);
  _q.copy(_p).invert().multiply(r).multiply(_p);
  os.quaternion.premultiply(_q);
  os.updateMatrixWorld(true);
}

/** Fait pointer l'os `os` (vers son enfant `bout`) dans la direction `dir` (monde), dosé par `poids` (0 à 1). */
function pointer(os: THREE.Bone, bout: THREE.Object3D, dir: THREE.Vector3, poids: number): void {
  if (poids <= 0) return;
  os.getWorldPosition(_a);
  bout.getWorldPosition(_b);
  const d = _b.sub(_a);
  if (d.lengthSq() < 1e-8) return;
  d.normalize();
  const voulu = _v.copy(dir).normalize();
  const r = _rp.setFromUnitVectors(d, voulu);
  tournerMonde(os, poids < 1 ? _rp2.slerpQuaternions(IDENTITE, r, poids) : r);
}
