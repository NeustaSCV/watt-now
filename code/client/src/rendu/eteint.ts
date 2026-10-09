// L'Éteint (Book 18 §4.3) : le même squelette que les survivants, peau gris-vert, yeux blancs, vêtements
// délavés et déchirés, démarche traînante (Book 06 §2.1). Le dormant est couché au sol, les yeux fermés ;
// réveillé, il se relève. À terre, il tombe ; s'il n'est pas achevé, il se relève.
// Le serveur envoie les positions 5 fois par seconde : on glisse entre deux.

import * as THREE from "three";
import type { EteintVu } from "../../../commun/src/eteints.ts";
import { Humanoide, chargerHumanoides, humanoidesPrets, type Coiffure, type Tenue } from "./humanoides.ts";
import { AMBIANCE } from "./ciel.ts";
import { aleatoire } from "./materiaux.ts";
import { Rampement, habillerVariante, herbeDuRampant, tenueDeVariante } from "./variantes-eteints.ts";

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

/** Vitesse propre de la marche d'Éteint (m/s, ramenée à sa taille). */
const VITESSE_MARCHE = 1.0;
/** Le Rampant, couché sur le ventre : le corps est basculé vers l'avant, relevé de l'épaisseur du torse, recentré. */
const RAMPANT = { levee: 0.14, recul: -0.8 };

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
  /** Le Rampant (Book 23 §3) : au sol, sur le ventre, l'herbe qui frémit autour de lui. */
  private readonly rampant: boolean;
  private herbe: ReturnType<typeof herbeDuRampant> | null = null;
  private rampement: Rampement | null = null;
  private lueur: THREE.Mesh | null = null;
  /** Les petits arcs bleus d'un Éteint raidi (créés à la première décharge). */
  private arcs: THREE.LineSegments | null = null;
  private arcsMinuterie = 0;
  /** L'anneau bleu au sol d'un Éteint raidi (créé à la première décharge). */
  private halo: THREE.Mesh | null = null;

  constructor(e: EteintVu) {
    this.cible = e;
    this.aleat = aleatoire(e.id * 131 + 7);
    this.objet.position.set(e.x, 0, e.z);
    this.objet.rotation.y = e.o;
    this.ouverture = e.etat === "dormant" ? 0 : 1;
    this.rampant = e.variante === "rampant";
    if (humanoidesPrets()) this.construire();
    else void chargerHumanoides().then(() => this.construire());
  }

  private construire(): void {
    const a = this.aleat;
    const choisir = <T>(l: readonly T[]): T => l[Math.floor(a() * l.length)]!;
    const genre = a() < 0.5 ? "femme" : "homme";
    const coiffure = choisir(COIFFURES);
    const v = this.cible.variante;
    const peau = choisir(PEAUX);
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
      // Sous le casque de l'Équipé, pas de cheveux.
      coiffure: v === "equipe" ? null : coiffure === "buns" && genre === "homme" ? "buzzed" : coiffure,
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
      this.herbe = herbeDuRampant(this.cible.id * 31 + 5);
      this.objet.add(this.herbe.objet);
    }
    // Chacun traîne à son rythme.
    corps.mixer.timeScale = 0.9 + a() * 0.2;
  }

  get etat(): EteintVu["etat"] {
    return this.cible.etat;
  }

  maj(e: EteintVu): void {
    this.cible = e;
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
    const ouvert = etat === "dormant" ? 0 : 1;
    this.ouverture += (ouvert - this.ouverture) * Math.min(1, dt * (ouvert ? 6 : 1));
    c.fermerLesYeux(this.ouverture);
    this.luire();

    const raidi = !!this.cible.raidi && etat !== "a_terre" && etat !== "detruit";
    this.electriser(dt, raidi);

    if (this.rampant) {
      this.ramper(dt, raidi ? 0 : vitesse);
      return;
    }

    const avantEtat = this.etatJoue;
    this.etatJoue = etat;
    const auSol = (x: EteintVu["etat"] | null) => x === "dormant" || x === "a_terre" || x === "detruit";
    this.unique = Math.max(0, this.unique - dt);

    // Raidi : la pose se fige là où la décharge l'a pris (on ne fait plus avancer l'animation).
    if (raidi) return;

    if (etat === "dormant") c.poser("LayToIdle", 0, avantEtat === null ? 0 : 0.6);
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
    this.rampement?.animer(dt, bouge ? Math.min(1.6, 0.4 + vitesse) : 0, !inerte && !!this.cible.saisit);
    this.herbe?.animer(dt, inerte ? 0 : bouge ? Math.min(1, 0.45 + vitesse * 0.6) : 0.12);
  }

  /** Raidi : le corps tremble, de petits arcs bleus courent sur le torse ; sinon, tout revient en place. */
  private electriser(dt: number, raidi: boolean): void {
    const c = this.corps;
    if (!c) return;
    if (!raidi) {
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
    if (!this.arcs) {
      const n = ARCS.nombre * ARCS.segments * 2;
      const geometrie = new THREE.BufferGeometry();
      geometrie.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      this.arcs = new THREE.LineSegments(geometrie, MATIERE_ARCS);
      this.arcs.frustumCulled = false;
      this.arcs.renderOrder = 2;
      this.objet.add(this.arcs);
      this.arcsMinuterie = 0;
    }
    this.arcs.visible = true;
    this.arcsMinuterie -= dt;
    if (this.arcsMinuterie > 0) return;
    this.arcsMinuterie = ARCS.periode;
    // Couché (le Rampant), les arcs courent au ras du sol, le long du dos.
    const bas = this.rampant ? 0.1 : ARCS.bas;
    const haut = this.rampant ? 0.35 : ARCS.haut;
    const pos = this.arcs.geometry.getAttribute("position") as THREE.BufferAttribute;
    let i = 0;
    for (let a = 0; a < ARCS.nombre; a++) {
      const angle = Math.random() * Math.PI * 2;
      let x = Math.cos(angle) * ARCS.rayon;
      let z = Math.sin(angle) * ARCS.rayon + (this.rampant ? RAMPANT.recul * 0.5 : 0);
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
}
