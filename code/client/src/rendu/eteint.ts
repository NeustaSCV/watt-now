// L'Éteint (Book 18 §4.3) : le même squelette que les survivants, peau gris-vert, yeux blancs, vêtements
// délavés et déchirés, démarche traînante (Book 06 §2.1). Le dormant est couché au sol, les yeux fermés ;
// réveillé, il se relève. À terre, il tombe ; s'il n'est pas achevé, il se relève.
// Le serveur envoie les positions 5 fois par seconde : on glisse entre deux.

import * as THREE from "three";
import type { EteintVu } from "../../../commun/src/eteints.ts";
import { Humanoide, chargerHumanoides, humanoidesPrets, type Coiffure } from "./humanoides.ts";
import { aleatoire } from "./materiaux.ts";

const HAUTEUR = 1.72;
const PEAUX = [0x8a9a7a, 0x7f8f74, 0x95a088, 0x86907c];
// Les tenues civiles de l'Abondance, délavées (Book 18 §4.3) : des couleurs encore lisibles sur la peau grise.
const HAUTS = [0x8a5a52, 0x5a6f8c, 0xb09a6a, 0x7a4a5a, 0xc0b8a4, 0x4f6a72, 0x9a6a3a];
const BAS = [0x34405a, 0x4a3c30, 0x2e2e32, 0x5a5242, 0x3c4a5c];
const COIFFURES: (Coiffure | null)[] = ["buzzed", "simpleparted", "long", "buns", "buzzedfemale", null];
const CHEVEUX = [0x4a4038, 0x3a3330, 0x6b6258, 0x2e2925];

/** Vitesse propre de la marche d'Éteint (m/s, ramenée à sa taille). */
const VITESSE_MARCHE = 1.0;

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

  constructor(e: EteintVu) {
    this.cible = e;
    this.aleat = aleatoire(e.id * 131 + 7);
    this.objet.position.set(e.x, 0, e.z);
    this.objet.rotation.y = e.o;
    this.ouverture = e.etat === "dormant" ? 0 : 1;
    if (humanoidesPrets()) this.construire();
    else void chargerHumanoides().then(() => this.construire());
  }

  private construire(): void {
    const a = this.aleat;
    const choisir = <T>(l: readonly T[]): T => l[Math.floor(a() * l.length)]!;
    const genre = a() < 0.5 ? "femme" : "homme";
    const coiffure = choisir(COIFFURES);
    const corps = new Humanoide({
      genre,
      peau: choisir(PEAUX),
      tenue: {
        haut: choisir(HAUTS),
        // Manches arrachées, pieds nus : il a perdu ce qu'il pouvait perdre.
        manche: a() < 0.5 ? choisir(HAUTS) : null,
        bas: choisir(BAS),
        pieds: a() < 0.6 ? 0x2a2622 : 0x6b6a5a,
        mains: null,
        dechirures: 0.25 + a() * 0.25,
      },
      coiffure: coiffure === "buns" && genre === "homme" ? "buzzed" : coiffure,
      couleurCheveux: choisir(CHEVEUX),
      tete: 1.25,
      hauteur: HAUTEUR * (0.95 + a() * 0.08),
      yeuxBlancs: true,
      graine: this.cible.id,
    });
    this.corps = corps;
    corps.fermerLesYeux(this.ouverture);
    this.objet.add(corps.objet);
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
    const debout = this.cible.etat !== "a_terre" && this.cible.etat !== "detruit" && this.cible.etat !== "dormant";
    if (!debout) return;
    const a = c.jouer(this.aleat() < 0.5 ? "Hit_Head" : "Hit_Chest", { boucle: false, fondu: 0.06, vitesse: 1.3 });
    if (a) {
      a.reset().play();
      this.unique = a.getClip().duration / 1.3;
    }
  }

  get hauteurTete(): number {
    const e = this.cible.etat;
    return e === "a_terre" || e === "detruit" || e === "dormant" ? 0.25 : HAUTEUR * 0.92;
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

    const avantEtat = this.etatJoue;
    this.etatJoue = etat;
    const auSol = (x: EteintVu["etat"] | null) => x === "dormant" || x === "a_terre" || x === "detruit";
    this.unique = Math.max(0, this.unique - dt);

    if (etat === "dormant") c.poser("LayToIdle", 0, avantEtat === null ? 0 : 0.6);
    else if (etat === "a_terre" || etat === "detruit") {
      if (avantEtat !== etat) {
        c.jouer("Death01", { boucle: false, fondu: 0.12, vitesse: 1.4 });
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
}
