// L'Éteint (Book 18 §4.3) : le même squelette que les survivants, peau gris-vert, yeux blancs, vêtements
// délavés et déchirés, démarche traînante (Book 06 §2.1). Le dormant est couché au sol, les yeux fermés ;
// réveillé, il se relève. À terre, il tombe ; s'il n'est pas achevé, il se relève.
// Le serveur envoie les positions 5 fois par seconde : on glisse entre deux.

import * as THREE from "three";
import type { EteintVu } from "../../../commun/src/eteints.ts";
import { Humanoide, chargerHumanoides, humanoidesPrets, type Coiffure, type Tenue } from "./humanoides.ts";
import { AMBIANCE } from "./ciel.ts";
import { aleatoire } from "./materiaux.ts";
import {
  ENFOUI,
  GONFLE,
  LUISANCE_NOYE,
  PEAU_ENSABLE,
  PEAU_NOYE,
  Rampement,
  bouffeeDeSable,
  butteDeSable,
  crevaison,
  gonfler,
  habillerVariante,
  herbeDuRampant,
  tenueDeVariante,
} from "./variantes-eteints.ts";
import { CorpsAuSol } from "./eteint-au-sol.ts";

const HAUTEUR = 1.72;
const PEAUX = [0x8a9a7a, 0x7f8f74, 0x95a088, 0x86907c];
// Les tenues civiles de l'Abondance, délavées (Book 18 §4.3) : des couleurs encore lisibles sur la peau grise.
const HAUTS = [0x8a5a52, 0x5a6f8c, 0xb09a6a, 0x7a4a5a, 0xc0b8a4, 0x4f6a72, 0x9a6a3a];
const BAS = [0x34405a, 0x4a3c30, 0x2e2e32, 0x5a5242, 0x3c4a5c];
const COIFFURES: (Coiffure | null)[] = ["buzzed", "simpleparted", "long", "buns", "buzzedfemale", null];
const CHEVEUX = [0x4a4038, 0x3a3330, 0x6b6258, 0x2e2925];

/**
 * Les yeux dans le noir (Book 23 §4.5) : la lueur se voit jusqu'à ≈ 6 m du point regardé (le joueur), puis s'éteint
 * vers 9 m ; elle n'apparaît que dans le noir (nuit ou pièce noire). Un dormant a les yeux mi-clos : lueur plus faible.
 */
const LUEUR = { pleine: 6, eteinte: 9, dormant: 0.7 };
/** Un dormant qui remue : jusqu'où il avance dans son relevé (secondes de l'animation LayToIdle) avant de se réveiller. */
const REMUE_S = 0.5;

/** Vitesse propre de la marche d'Éteint (m/s, ramenée à sa taille). */
const VITESSE_MARCHE = 1.0;
/** Le Rampant, couché sur le ventre : le corps est basculé vers l'avant, relevé de l'épaisseur du torse, recentré. */
const RAMPANT = { levee: 0.14, recul: -0.8, remue: 0.25 };

/**
 * L'Éteint raidi par une décharge (Book 25 §5.1) : la pose se fige, le corps tremble, et de petits arcs bleus courent
 * sur le torse. Sobre : pas d'éclair, pas de fumée. Quatre arcs brisés de quatre segments, retirés au hasard
 * toutes les 70 ms.
 */
const ARCS = { nombre: 4, segments: 4, periode: 0.07, rayon: 0.24, bas: 0.85, haut: 1.5, tremblement: 0.035 };
const MATIERE_ARCS = new THREE.LineBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
/**
 * Le halo du raidi (chantier 9, passe de lisibilité) : un trait de ligne ne fait qu'un pixel, à peine visible sur
 * l'iPhone 13 mini ; un anneau bleu pâle au sol, qui palpite, dit « raidi » d'un coup d'œil, de jour comme de nuit.
 * Il palpite au rythme de tous les raidis ensemble (une seule matière).
 */
const HALO_RAIDI = { interieur: 0.38, exterieur: 0.52, rampant: 0.7, opacite: 0.55, battement: 9 };
const MATIERE_HALO = new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: HALO_RAIDI.opacite, depthWrite: false, blending: THREE.AdditiveBlending });
/**
 * L'éclat d'une courte qui porte (plan 0.8 §2.4 : la décharge ajoute ses dégâts au torse) : un instant, les arcs sont
 * plus nombreux, plus clairs, et courent plus large ; l'anneau s'élargit. Sobre : un dixième de seconde de plus, pas un
 * éclair.
 */
const ECLAT = { duree: 0.2, nombre: 7, rayon: 1.35, halo: 1.3 };
const MATIERE_ARCS_ECLAT = new THREE.LineBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending });
const MATIERE_HALO_ECLAT = new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending });

/** Le sursaut d'un coup encaissé (plan 0.9 §3.3) : 0,25 s, ≈ 5° en arrière, une petite secousse des épaules. */
const SURSAUT = { duree: 0.25, bascule: 0.09, secousse: 0.035 };

export class VueEteint {
  readonly objet = new THREE.Group();
  private corps: Humanoide | null = null;
  private cible: EteintVu;
  private etatJoue: EteintVu["etat"] | null = null;
  /** Une animation jouée une fois (se relever, coup reçu) : on attend sa fin. */
  private unique = 0;
  private ouverture: number;
  private taches = 0;
  private readonly aleat: () => number;
  /**
   * Le Rampant (Book 23 §3) : au sol, sur le ventre, l'herbe qui frémit autour de lui. L'Ensablé aussi, et le Noyé à la
   * jambe brisée (0.10) : celui qui change en cours de route (un piège) est redessiné (`maj`).
   */
  private rampant: boolean;
  private herbe: ReturnType<typeof herbeDuRampant> | null = null;
  private rampement: Rampement | null = null;
  private lueur: THREE.Mesh | null = null;
  /** Les petits arcs bleus d'un Éteint raidi (créés à la première décharge). */
  private arcs: THREE.LineSegments | null = null;
  private arcsMinuterie = 0;
  /** Où en est le dormant qui remue (0 : il dort ; suit `eveil`, en douceur). */
  private remue = 0;
  /** L'anneau bleu au sol d'un Éteint raidi (créé à la première décharge). */
  private halo: THREE.Mesh | null = null;
  /** Ce qui reste de l'éclat d'une courte qui porte (s). */
  private eclat = 0;
  /** À terre ou détruit, au corps (chantier F) : créé à sa première chute. */
  private sol: CorpsAuSol | null = null;

  constructor(e: EteintVu) {
    this.cible = e;
    this.aleat = aleatoire(e.id * 131 + 7);
    this.objet.position.set(e.x, 0, e.z);
    this.objet.rotation.y = e.o;
    this.ouverture = e.etat === "dormant" ? 0 : 1;
    this.rampant = rampantDe(e);
    if (humanoidesPrets()) this.construire();
    else void chargerHumanoides().then(() => this.construire());
  }

  private construire(): void {
    const a = this.aleat;
    const choisir = <T>(l: readonly T[]): T => l[Math.floor(a() * l.length)]!;
    const genre = a() < 0.5 ? "femme" : "homme";
    const coiffure = choisir(COIFFURES);
    const v = this.cible.variante;
    const tiree = choisir(PEAUX);
    // Le Noyé, blême ; l'Ensablé, poudré de sable (0.10) : le même tirage pour le reste.
    const peau = v === "noye" ? PEAU_NOYE : v === "ensable" ? PEAU_ENSABLE : tiree;
    const tenueTiree: Tenue = {
      haut: choisir(HAUTS),
      // Manches arrachées, pieds nus : il a perdu ce qu'il pouvait perdre.
      manche: a() < 0.5 ? choisir(HAUTS) : null,
      bas: choisir(BAS),
      pieds: a() < 0.6 ? 0x2a2622 : 0x6b6a5a,
      mains: null,
      dechirures: 0.25 + a() * 0.25,
    };
    const corps = new Humanoide({
      genre,
      peau,
      // Les variantes gardent le même tirage (même corps, même taille) et changent seulement d'habits.
      tenue: v ? tenueDeVariante(v, tenueTiree) : tenueTiree,
      // Sous le casque de l'Équipé, pas de cheveux ; le Noyé les a perdus dans l'eau (son crâne blême se voit de haut).
      coiffure: v === "equipe" || v === "noye" ? null : coiffure === "buns" && genre === "homme" ? "buzzed" : coiffure,
      couleurCheveux: choisir(CHEVEUX),
      tete: 1.25,
      hauteur: HAUTEUR * (0.95 + a() * 0.08),
      yeuxBlancs: true,
      graine: this.cible.id,
    });
    this.corps = corps;
    if (v) habillerVariante(corps, v, this.cible.id * 17 + 3);
    this.lueur = corps.creerLueurYeux();
    // Un seul maillage pour tout l'Éteint, habits de variante compris (même image, un appel de dessin).
    corps.fondre();
    // Le corps et ses vêtements ne se dessinent que s'ils sont dans le champ (de la caméra, ou d'une ombre) : une
    // sphère mesurée au repos, élargie pour les gestes. Sans ça, les 24 Éteints de la Coopérative se dessinaient
    // tous, toujours, et six fois de plus dans l'ombre de la lampe (2026-10-08).
    corps.objet.updateMatrixWorld(true);
    corps.objet.traverse((n) => {
      const m = n as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh) return;
      m.computeBoundingSphere();
      if (!m.boundingSphere) return;
      m.boundingSphere.radius *= 1.5;
      m.frustumCulled = true;
    });
    corps.fermerLesYeux(this.ouverture);
    this.objet.add(corps.objet);
    if (this.rampant) {
      this.rampement = new Rampement(corps);
      corps.objet.rotation.x = Math.PI / 2;
      corps.objet.position.set(0, RAMPANT.levee, RAMPANT.recul);
      // Sur le sable, pas d'herbe (l'Ensablé a sa butte, plus bas).
      if (v !== "ensable") {
        this.herbe = herbeDuRampant(this.cible.id * 31 + 5);
        this.objet.add(this.herbe.objet);
      }
    }
    this.construireCote(corps);
    // Chacun traîne à son rythme.
    corps.mixer.timeScale = 0.9 + a() * 0.2;
  }

  get etat(): EteintVu["etat"] {
    return this.cible.etat;
  }

  get variante(): EteintVu["variante"] {
    return this.cible.variante;
  }

  maj(e: EteintVu): void {
    this.cible = e;
    // Il rampe désormais (la jambe brisée par un piège) : on le redessine, couché.
    if (rampantDe(e) !== this.rampant && this.corps) this.reconstruire();
  }

  /** Il vient d'être frappé : il encaisse, et ses vêtements se tachent de sang (sans plaie visible). */
  toucher(): void {
    const c = this.corps;
    if (!c) return;
    this.taches = Math.min(4, this.taches + 1);
    c.tacher(this.taches);
    const debout = !this.rampant && this.cible.etat !== "a_terre" && this.cible.etat !== "detruit" && this.cible.etat !== "dormant";
    if (!debout) return;
    const a = c.jouer(this.aleat() < 0.5 ? "Hit_Head" : "Hit_Chest", { boucle: false, fondu: 0.06, vitesse: 1.3 });
    if (a) {
      a.reset().play();
      this.unique = a.getClip().duration / 1.3;
    }
  }

  // ---------- L'Équipé encaisse (plan 0.9 §3.3, chantier D) ----------

  /** Ce qui reste du sursaut d'un coup encaissé (s). */
  private sursaut = 0;

  /**
   * Il encaisse sans vaciller (l'Équipé, deux coups sur trois) : un léger sursaut du corps, sans recul ni geste de coup
   * reçu. Il continue d'avancer, de griffer : le joueur doit lire « celui-là encaisse ». Pas de tache de plus.
   */
  encaisser(): void {
    const debout = this.cible.etat !== "a_terre" && this.cible.etat !== "detruit" && this.cible.etat !== "dormant";
    if (this.corps && !this.rampant && debout) this.sursaut = SURSAUT.duree;
  }

  /** Le sursaut : le corps bascule un instant en arrière depuis les pieds, les épaules secouées, puis revient. */
  private sursauter(dt: number): void {
    if (this.sursaut <= 0 || !this.corps) return;
    this.sursaut = Math.max(0, this.sursaut - dt);
    const t = 1 - this.sursaut / SURSAUT.duree;
    const o = this.corps.objet.rotation;
    o.x = -SURSAUT.bascule * Math.sin(Math.PI * t);
    o.z = SURSAUT.secousse * Math.sin(t * Math.PI * 6) * (1 - t);
  }

  get hauteurTete(): number {
    const e = this.cible.etat;
    return this.rampant || e === "a_terre" || e === "detruit" || e === "dormant" ? 0.25 : HAUTEUR * 0.92;
  }

  /** `vitesseImposee` : pour la planche des personnages (marche sur place) ; sinon, d'après le déplacement. */
  animer(dt: number, vitesseImposee?: number): void {
    const p = this.objet.position;
    const avant = p.clone();
    const k = Math.min(1, dt * 7);
    p.x += (this.cible.x - p.x) * k;
    p.z += (this.cible.z - p.z) * k;
    const vitesse = vitesseImposee ?? Math.hypot(p.x - avant.x, p.z - avant.z) / Math.max(dt, 1e-3);
    const dO = Math.atan2(Math.sin(this.cible.o - this.objet.rotation.y), Math.cos(this.cible.o - this.objet.rotation.y));
    this.objet.rotation.y += dO * Math.min(1, dt * 5);

    const c = this.corps;
    if (!c) return;
    const etat = this.cible.etat;
    // Les yeux s'ouvrent d'un coup quand il se réveille ; un détruit les garde ouverts, éteints.
    // Un dormant que la signature atteint entrouvre les yeux, de plus en plus (eveil : 1, il se réveille).
    const ouvert = etat === "dormant" ? (this.cible.eveil ?? 0) * 0.6 : 1;
    this.ouverture += (ouvert - this.ouverture) * Math.min(1, dt * (ouvert ? 6 : 1));
    c.fermerLesYeux(this.ouverture);
    this.luire();

    const raidi = !!this.cible.raidi && etat !== "a_terre" && etat !== "detruit";
    this.electriser(dt, raidi);
    this.sursauter(dt);
    this.animerCote(dt);

    if (this.rampant) {
      this.ramper(dt, raidi ? 0 : vitesse);
      this.auSol(dt);
      return;
    }

    const avantEtat = this.etatJoue;
    this.etatJoue = etat;
    const auSol = (x: EteintVu["etat"] | null) => x === "dormant" || x === "a_terre" || x === "detruit";
    this.unique = Math.max(0, this.unique - dt);

    // Raidi : la pose se fige là où la décharge l'a pris (on ne fait plus avancer l'animation).
    if (raidi) return;

    if (etat === "dormant") {
      // Il remue : le corps commence à se soulever, d'autant plus que le réveil approche.
      this.remue += ((this.cible.eveil ?? 0) - this.remue) * Math.min(1, dt * 3);
      c.poser("LayToIdle", this.remue * REMUE_S, avantEtat === null ? 0 : 0.6);
    }
    else if (etat === "a_terre" || etat === "detruit") {
      if (avantEtat !== etat) {
        // Éteint par le courant, il s'affaisse plus lentement, sans être projeté.
        c.jouer("Death01", { boucle: false, fondu: 0.12, vitesse: this.cible.eteintParLeCourant ? 0.8 : 1.4 });
        this.unique = 0;
      }
    } else if (auSol(avantEtat)) {
      // Il se relève : lentement, en prenant appui (moment-vitrine du réveil).
      const a = c.jouer("LayToIdle", { boucle: false, fondu: 0.3, vitesse: avantEtat === "dormant" ? 1 : 1.4 });
      if (a) this.unique = a.getClip().duration / a.timeScale;
    } else if (this.unique > 0) {
      // On laisse finir.
    } else if (this.cible.saisit) c.jouer("Zombie_Scratch", { fondu: 0.15 });
    else if (vitesse > 0.1) {
      const presse = etat === "poursuivant";
      c.jouer("Zombie_Walk_Fwd_Loop", { fondu: 0.3, vitesse: Math.min(presse ? 2 : 1.5, Math.max(0.5, vitesse / VITESSE_MARCHE)) });
    } else c.jouer("Zombie_Idle_Loop", { fondu: 0.4 });
    c.mettreAJour(dt);
    this.auSol(dt);
  }

  /**
   * À terre ou détruit, au corps (plan 0.9 §3.3 bis, chantier F) : à terre, il remue et prend appui avant de se
   * relever ; détruit, il se relâche, pâlit, se couvre un peu, et s'efface à la fin (eteint-au-sol.ts).
   */
  private auSol(dt: number): void {
    if (this.corps) (this.sol ??= new CorpsAuSol(this.cible.id)).animer(dt, this.corps, this.objet, this.cible, this.rampant);
  }

  /**
   * Le Rampant : il ne se relève jamais. Couché sur le ventre, il rampe (Rampement : les bras tirent le corps chacun
   * son tour, les jambes traînent) ; il griffe quand il saisit une cheville. L'herbe frémit autour de lui quand il
   * bouge, à peine quand il guette, pas du tout quand il dort.
   */
  private ramper(dt: number, vitesse: number): void {
    const etat = this.cible.etat;
    const inerte = etat === "dormant" || etat === "a_terre" || etat === "detruit";
    const bouge = !inerte && vitesse > 0.05;
    // À terre (chantier F), ses bras tirent encore un peu, sans avancer ; détruit, plus rien.
    const remue = etat === "a_terre" ? RAMPANT.remue : 0;
    this.rampement?.animer(dt, bouge ? Math.min(1.6, 0.4 + vitesse) : remue, !inerte && !!this.cible.saisit);
    this.herbe?.animer(dt, inerte ? remue * 0.3 : bouge ? Math.min(1, 0.45 + vitesse * 0.6) : 0.12);
  }

  /** Une décharge courte vient de porter (ses dégâts au torse) : l'éclat d'arc bleu, plus vif, un instant. */
  eclatDecharge(): void {
    this.eclat = ECLAT.duree;
    this.arcsMinuterie = 0;
  }

  /** Raidi : le corps tremble, de petits arcs bleus courent sur le torse ; sinon, tout revient en place. */
  private electriser(dt: number, raidi: boolean): void {
    const c = this.corps;
    if (!c) return;
    const eclat = this.eclat > 0;
    this.eclat = Math.max(0, this.eclat - dt);
    if (!raidi && !eclat) {
      if (this.arcs) this.arcs.visible = false;
      if (this.halo) this.halo.visible = false;
      if (!this.rampant) c.objet.rotation.z = 0;
      return;
    }
    if (!this.rampant) c.objet.rotation.z = (Math.random() - 0.5) * ARCS.tremblement;
    if (!this.halo) {
      const k = this.rampant ? HALO_RAIDI.rampant / HALO_RAIDI.exterieur : 1;
      this.halo = new THREE.Mesh(new THREE.RingGeometry(HALO_RAIDI.interieur * k, HALO_RAIDI.exterieur * k, 24).rotateX(-Math.PI / 2), MATIERE_HALO);
      this.halo.position.set(0, 0.03, this.rampant ? RAMPANT.recul * 0.5 : 0);
      this.halo.renderOrder = 2;
      this.objet.add(this.halo);
    }
    this.halo.visible = true;
    MATIERE_HALO.opacity = HALO_RAIDI.opacite * (0.65 + 0.35 * Math.sin((performance.now() / 1000) * HALO_RAIDI.battement));
    this.halo.material = eclat ? MATIERE_HALO_ECLAT : MATIERE_HALO;
    this.halo.scale.setScalar(eclat ? ECLAT.halo : 1);
    if (!this.arcs) {
      // Assez de place pour les arcs de l'éclat ; hors éclat, on n'en dessine que `ARCS.nombre`.
      const n = ECLAT.nombre * ARCS.segments * 2;
      const geometrie = new THREE.BufferGeometry();
      geometrie.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      this.arcs = new THREE.LineSegments(geometrie, MATIERE_ARCS);
      this.arcs.frustumCulled = false;
      this.arcs.renderOrder = 2;
      this.objet.add(this.arcs);
      this.arcsMinuterie = 0;
    }
    this.arcs.visible = true;
    this.arcs.material = eclat ? MATIERE_ARCS_ECLAT : MATIERE_ARCS;
    this.arcsMinuterie -= dt;
    if (this.arcsMinuterie > 0) return;
    // Pendant l'éclat, les arcs se redessinent deux fois plus souvent.
    this.arcsMinuterie = eclat ? ARCS.periode / 2 : ARCS.periode;
    const nombre = eclat ? ECLAT.nombre : ARCS.nombre;
    const rayon = ARCS.rayon * (eclat ? ECLAT.rayon : 1);
    this.arcs.geometry.setDrawRange(0, nombre * ARCS.segments * 2);
    // Couché (le Rampant), les arcs courent au ras du sol, le long du dos.
    const bas = this.rampant ? 0.1 : ARCS.bas;
    const haut = this.rampant ? 0.35 : ARCS.haut;
    const pos = this.arcs.geometry.getAttribute("position") as THREE.BufferAttribute;
    let i = 0;
    for (let a = 0; a < nombre; a++) {
      const angle = Math.random() * Math.PI * 2;
      let x = Math.cos(angle) * rayon;
      let z = Math.sin(angle) * rayon + (this.rampant ? RAMPANT.recul * 0.5 : 0);
      let y = bas + Math.random() * (haut - bas);
      for (let s = 0; s < ARCS.segments; s++) {
        const nx = x + (Math.random() - 0.5) * 0.14;
        const ny = Math.min(haut + 0.1, y + (Math.random() - 0.3) * 0.16);
        const nz = z + (Math.random() - 0.5) * 0.14;
        pos.setXYZ(i++, x, y, z);
        pos.setXYZ(i++, nx, ny, nz);
        x = nx;
        y = ny;
        z = nz;
      }
    }
    pos.needsUpdate = true;
  }

  /** La lueur des yeux : nette dans le noir et de près, absente de jour ; éteinte chez un Éteint détruit. */
  private luire(): void {
    const l = this.lueur;
    if (!l) return;
    const p = this.objet.position;
    const d = Math.hypot(p.x - AMBIANCE.x, p.z - AMBIANCE.z);
    const pres = Math.min(1, Math.max(0, (LUEUR.eteinte - d) / (LUEUR.eteinte - LUEUR.pleine)));
    const n = Math.min(1, Math.max(0, (AMBIANCE.noir - 0.2) / 0.6));
    const yeux = this.cible.etat === "detruit" ? 0 : LUEUR.dormant + (1 - LUEUR.dormant) * this.ouverture;
    const opacite = pres * n * n * (3 - 2 * n) * yeux;
    l.visible = opacite > 0.02;
    (l.material as THREE.MeshBasicMaterial).opacity = opacite;
  }

  // ---------- Le Noyé et l'Ensablé (0.10, chantier G ; S-31 à S-33) ----------

  /** Le Noyé : déjà crevé, ou en train (s) ; -1 : pas encore. */
  private crevee = -1;
  private fluides: ReturnType<typeof crevaison> | null = null;
  /** L'Ensablé : sa butte de sable (tant qu'il dort), et la bouffée quand il surgit. */
  private butte: THREE.Mesh | null = null;
  private bouffee: ((dt: number) => boolean) | null = null;
  /** Où en est l'Ensablé qui sort du sable (0 : enfoui ; 1 : dehors). */
  private sorti = 1;
  /** On l'a vu debout (ou éveillé) : sa mort se joue ; sinon, c'est un corps trouvé en arrivant. */
  private vuVivant = false;

  /** À la construction : la carrure gonflée et luisante du Noyé, la butte de l'Ensablé qui dort. */
  private construireCote(corps: Humanoide): void {
    const v = this.cible.variante;
    if (v === "noye") {
      const mort = this.cible.etat === "detruit";
      corps.objet.scale.set(mort ? GONFLE.apres.large : GONFLE.large, 1, mort ? GONFLE.apres.epais : GONFLE.epais);
      gonfler(corps, mort ? 0 : 1);
      if (mort) this.crevee = Infinity;
      else corps.ternir(0, 0, -LUISANCE_NOYE, 0, CENDRE_NEUTRE, CENDRE_NEUTRE);
    } else if (v === "ensable") {
      this.sorti = this.cible.etat === "dormant" ? 0 : 1;
      this.poserButte(this.sorti === 0);
      corps.objet.position.y = RAMPANT.levee - ENFOUI * (1 - this.sorti);
    }
  }

  private poserButte(oui: boolean): void {
    if (oui && !this.butte) {
      this.butte = butteDeSable(this.cible.id);
      this.objet.add(this.butte);
    } else if (!oui && this.butte) {
      this.objet.remove(this.butte);
      this.butte = null;
    }
  }

  /**
   * À chaque image : le Noyé qui meurt crève (il se dégonfle d'un coup, ses fluides giclent, la flaque s'étale) ;
   * l'Ensablé qui se réveille sort du sable (la butte s'efface dans une bouffée), et s'y renfonce s'il se rendort.
   */
  private animerCote(dt: number): void {
    const c = this.corps;
    if (!c) return;
    const etat = this.cible.etat;
    if (etat !== "detruit" && etat !== "dormant") this.vuVivant = true;
    const v = this.cible.variante;
    if (v === "noye") {
      if (etat === "detruit" && this.crevee < 0) {
        this.crevee = 0;
        if (this.vuVivant) this.fluides = crevaison(this.objet, 0, this.rampant ? RAMPANT.recul * 0.4 : 0);
        else this.crevee = GONFLE.crevaison;
      }
      if (this.crevee >= 0 && this.crevee !== Infinity) {
        this.crevee += dt;
        // Un instant, il gonfle encore ; puis la peau crève et il retombe, vidé.
        const k = Math.min(1, this.crevee / GONFLE.crevaison);
        const enflure = k < 0.2 ? 1 + GONFLE.gonflement * (k / 0.2) : 1;
        const vide = k < 0.2 ? 0 : (k - 0.2) / 0.8;
        const doux = 1 - Math.pow(1 - vide, 3);
        c.objet.scale.set(
          (GONFLE.large + (GONFLE.apres.large - GONFLE.large) * doux) * enflure,
          1,
          (GONFLE.epais + (GONFLE.apres.epais - GONFLE.epais) * doux) * enflure,
        );
        gonfler(c, (1 - doux) * enflure);
        if (k >= 1 && !this.fluides) this.crevee = Infinity;
      }
      this.fluides?.animer(dt);
      return;
    }
    if (v !== "ensable") return;
    const dort = etat === "dormant";
    if (!dort && this.butte) {
      this.poserButte(false);
      this.bouffee = bouffeeDeSable(this.objet, 0, -0.2);
    } else if (dort && !this.butte && this.sorti >= 1) this.poserButte(true);
    this.sorti += ((dort ? 0 : 1) - this.sorti) * Math.min(1, dt * (dort ? 0.8 : 6));
    c.objet.position.y = RAMPANT.levee - ENFOUI * (1 - this.sorti);
    if (this.bouffee && !this.bouffee(dt)) this.bouffee = null;
  }

  /** Redessiné de neuf (le Noyé dont un piège a brisé la jambe : il rampe), à la même place. */
  private reconstruire(): void {
    this.objet.clear();
    this.corps = null;
    this.herbe = null;
    this.rampement = null;
    this.lueur = null;
    this.arcs = null;
    this.halo = null;
    this.sol = null;
    this.butte = null;
    this.bouffee = null;
    this.fluides = null;
    this.etatJoue = null;
    this.rampant = rampantDe(this.cible);
    this.construire();
  }
}

/** Au sol pour de bon (commun/src/eteints.ts, `rampe`) : le Rampant, l'Ensablé, le Noyé à la jambe brisée. */
function rampantDe(e: EteintVu): boolean {
  return e.variante === "rampant" || e.variante === "ensable" || e.rampe === true;
}

/** Les couleurs de « ternir » pour la luisance du Noyé vivant : sans effet (rien n'est encore viré au gris). */
const CENDRE_NEUTRE = new THREE.Color(0xffffff);
