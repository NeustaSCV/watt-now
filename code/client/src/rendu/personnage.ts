// Le personnage du joueur (et des autres joueurs) : un corps riggé et animé (Book 18 §4.2, Book 21 §5.2.1),
// aux proportions du jeu (≈ 1,75 m, ≈ 4,8 têtes), habillé aux couleurs de sa famille et reconnaissable à sa
// silhouette (Book 18 §4.1) : 🔥 Nadia, tablier de cuir, bandana, lunettes de soudeur relevées ;
// ⚡ Malik, lampe frontale, câble en bandoulière, batterie dans le dos ; ⚙️ Rose, chapeau de paille, hotte en osier.

import { fusionnerStatique } from "./fusion.ts";
import * as THREE from "three";
import type { TypeObjet } from "../../../commun/src/objets.ts";
import type { Famille } from "../../../commun/src/regles.ts";
import { Humanoide, chargerHumanoides, humanoidesPrets, type Coiffure, type Tenue } from "./humanoides.ts";
import { APPARENCES_DE_REFERENCE, CARNATIONS, COULEURS_CHEVEUX, hauteurDe, type Apparence, type Coiffure as CoiffureChoisie } from "../../../commun/src/apparence.ts";
import { PALETTE, materiau } from "./materiaux.ts";
import { Mesure, bandeau, bandouliere, pan } from "./accessoires.ts";

/** La surface du corps, mesurée une fois par famille et par corps (elle ne dépend ni de la carnation ni des cheveux). */
const MESURES = new Map<string, Mesure>();

/** La tenue de chaque famille (Book 18 §4.1) : elle fait reconnaître la famille de loin, quelle que soit l'apparence. */
const TENUES: Record<Famille, Tenue> = {
  charbonniers: { haut: PALETTE.rouille, manche: null, bas: 0x4a3a2e, pieds: 0x2a211b, mains: 0x5a3f2a },
  voltaiques: { haut: PALETTE.bleuTravail, manche: PALETTE.bleuTravail, bas: 0x2f3b4f, pieds: 0x23262b, mains: null, bande: { couleur: PALETTE.jauneReflechissant, de: 0.62, a: 0.65 } },
  mecanistes: { haut: PALETTE.vertLaine, manche: PALETTE.vertLaine, bas: 0x6b5a3e, pieds: 0x3d5a3a, mains: null },
};

/** Les coiffures du pack, pour chaque coiffure proposée à la création. */
const FICHIERS_COIFFURE: Record<CoiffureChoisie, Coiffure | null> = {
  chignons: "buns",
  longs: "long",
  raie: "simpleparted",
  courts: "buzzed",
  ras: "buzzedfemale",
  rase: null,
};

/** La largeur du corps selon la corpulence (0 : mince, 1 : forte). */
export function largeurDe(a: Apparence): number {
  return 0.92 + 0.2 * a.corpulence;
}

/** Le geste joué pendant une action, d'après son libellé. */
export type GesteAction = "ramasser" | "cueillir" | "fouiller" | "bricoler" | "marteler" | "manger" | "pedaler" | "interagir";

export function gesteDAction(libelle: string): GesteAction {
  const l = libelle.toLowerCase();
  if (l.startsWith("ramasser") || l.startsWith("prendre la bâche") || l.startsWith("prendre la barre")) return "ramasser";
  if (l.startsWith("cueillir") || l.startsWith("couper des joncs")) return "cueillir";
  if (l.startsWith("fouiller") || l.startsWith("reprendre ton sac") || l.startsWith("défourner")) return "fouiller";
  if (l.startsWith("manger") || l.startsWith("boire")) return "manger";
  if (l.startsWith("pédaler") || l.startsWith("affûter")) return "pedaler";
  if (l.startsWith("forger") || l.startsWith("remmancher") || l.includes("foyer de forge")) return "marteler";
  if (l.startsWith("démonter") || l.startsWith("monter") || l.startsWith("brancher") || l.startsWith("reprendre les batteries") || l.startsWith("prendre")) return "bricoler";
  if (l.includes("établi") || l.includes("abri") || l.includes("pédalier") || l.includes("banc") || l.includes("charbonnière") || l.includes("panneau")) return "bricoler";
  return "interagir";
}

const ANIMATION_GESTE: Record<GesteAction, string> = {
  ramasser: "PickUp_Table",
  cueillir: "Farm_Harvest",
  fouiller: "Chest_Open",
  bricoler: "Fixing_Kneeling",
  marteler: "TreeChopping_Loop",
  manger: "Consume",
  pedaler: "Driving_Loop",
  interagir: "Interact",
};

/** Vitesse propre des animations de déplacement (m/s, mesurée sur la bibliothèque, ramenée à 1,75 m). */
const VITESSE_ANIM = { accroupi: 0.71, marche: 0.93, trot: 5.1 } as const;

/**
 * Une arme tenue en main, construite dans le repère du poing : le manche dans l'axe +z (du poing vers l'avant),
 * le poing à l'origine. Null si l'objet ne se tient pas comme une arme.
 */
export function creerArme(objet: TypeObjet): THREE.Group | null {
  const bois = materiau(PALETTE.bois);
  const fer = materiau(0x6e6a63, { metal: 0.6, rugosite: 0.45 });
  // Dans le poing, le manche part vers l'avant et vers le haut (repère du personnage au repos).
  const arme = new THREE.Group();
  const ajouter = (geo: THREE.BufferGeometry, mat: THREE.Material, z: number, y = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, y, z);
    m.castShadow = true;
    arme.add(m);
  };
  switch (objet) {
    case "hache":
      ajouter(new THREE.BoxGeometry(0.035, 0.035, 0.62), bois, 0.18);
      ajouter(new THREE.BoxGeometry(0.025, 0.18, 0.12), fer, 0.44, 0.06);
      break;
    case "marteau":
      ajouter(new THREE.BoxGeometry(0.03, 0.03, 0.34), bois, 0.1);
      ajouter(new THREE.BoxGeometry(0.05, 0.13, 0.05), fer, 0.26, 0.02);
      break;
    case "barre_metal":
      ajouter(new THREE.CylinderGeometry(0.016, 0.016, 0.9, 6).rotateX(Math.PI / 2), fer, 0.3);
      break;
    case "lame_forgee":
    case "couteau":
    case "couteau_aiguise":
      ajouter(new THREE.BoxGeometry(0.025, 0.025, 0.1), materiau(PALETTE.boisSombre), 0.02);
      ajouter(new THREE.BoxGeometry(0.008, 0.035, objet === "lame_forgee" ? 0.3 : 0.15), fer, objet === "lame_forgee" ? 0.22 : 0.14);
      break;
    case "gourdin":
      // Un bâton de bois dur, plus épais au bout.
      ajouter(new THREE.CylinderGeometry(0.045, 0.022, 0.62, 6).rotateX(Math.PI / 2), materiau(PALETTE.boisSombre), 0.2);
      break;
    case "epieu":
      // Une longue perche, la pointe noircie au feu (P-002) : on la tient au tiers.
      ajouter(new THREE.CylinderGeometry(0.02, 0.024, 1.7, 6).rotateX(Math.PI / 2), bois, 0.45);
      ajouter(new THREE.ConeGeometry(0.022, 0.16, 6).rotateX(Math.PI / 2), materiau(0x2e2018), 1.37);
      break;
    default:
      return null;
  }
  return arme;
}

export class Personnage {
  readonly objet = new THREE.Group();
  readonly famille: Famille;
  private readonly apparence: Apparence;
  private corps: Humanoide | null = null;
  private readonly main = new THREE.Group();
  private armeTenue: TypeObjet | null | undefined = undefined;
  private blessures = 0;
  private geste: GesteAction | null = null;
  private couche = false;
  private effondre = false;
  /** Une animation jouée une fois (frappe, roulade, coup reçu) : on attend sa fin. */
  private unique = 0;
  private charge = 0;
  private lumiere = false;

  /** `apparence` : celle choisie à la création (Book 14 §3) ; sinon, celle du personnage de référence de la famille. */
  constructor(famille: Famille, apparence: Apparence = APPARENCES_DE_REFERENCE[famille]) {
    this.famille = famille;
    this.apparence = apparence;
    if (humanoidesPrets()) this.construire();
    else void chargerHumanoides().then(() => this.construire());
  }

  private construire(): void {
    const a = this.apparence;
    const corps = new Humanoide({
      genre: a.silhouette === "feminine" ? "femme" : "homme",
      peau: CARNATIONS[a.peau] ?? CARNATIONS[2],
      tenue: TENUES[this.famille],
      coiffure: FICHIERS_COIFFURE[a.coiffure],
      couleurCheveux: COULEURS_CHEVEUX[a.cheveux] ?? COULEURS_CHEVEUX[0],
      barbe: a.barbe,
      tete: 1.32,
      hauteur: hauteurDe(a),
      largeur: largeurDe(a),
      graine: this.famille.length * 7,
    });
    this.corps = corps;
    this.habiller(corps);
    // L'arme se tient dans le poing, pas au poignet (2026-10-08) : l'os de la main a son origine au poignet. Dans son
    // repère (mesuré sur le modèle), +y va du poignet vers les doigts, +z de l'auriculaire vers l'index, et les doigts
    // se referment vers −x. On place donc le poing au creux des premières phalanges, et l'arme y est construite
    // directement : manche selon +z (il sort côté pouce), tête ou tranchant selon +y (devant les doigts).
    const main = corps.osNomme("hand_r");
    if (main) {
      const majeur = main.getObjectByName("middle_01_r");
      const poing = majeur ? majeur.position.clone().multiplyScalar(0.92) : new THREE.Vector3(0, 0.08, 0);
      this.main.position.set(poing.x - 0.032, poing.y, poing.z);
      // L'os est à l'échelle du corps : on garde l'arme en vraie grandeur.
      corps.objet.updateMatrixWorld(true);
      const echelle = main.getWorldScale(new THREE.Vector3());
      this.main.scale.set(1 / echelle.x, 1 / echelle.y, 1 / echelle.z);
      main.add(this.main);
    }
    this.objet.add(corps.objet);
    corps.tacher(this.blessures);
    const arme = this.armeTenue;
    this.armeTenue = null;
    this.tenir(arme);
    corps.jouer("Idle_Loop");
  }

  /** Les accessoires de silhouette de la famille (Book 18 §4.1), moulés sur le corps habillé. */
  private habiller(corps: Humanoide): void {
    // La coiffure compte : chapeau, bandana et lanière de lampe passent par-dessus les cheveux.
    const cle = `${this.famille}|${this.apparence.silhouette}|${this.apparence.taille}|${this.apparence.corpulence}|${this.apparence.coiffure}|${this.apparence.barbe}`;
    let m = MESURES.get(cle);
    if (!m) MESURES.set(cle, (m = new Mesure(corps.points())));
    const cou = corps.repere("neck_01");
    const torse = corps.repere("spine_03");
    const bassin = corps.repere("pelvis");
    const genou = corps.repere("calf_l");
    const hancheD = corps.repere("thigh_r");
    const teteY = corps.repere("Head").y;
    const sommet = m.sommet();
    // Les hauteurs du visage, en fraction de la tête (de la base du crâne au sommet).
    const tete = (f: number) => teteY + (sommet - teteY) * f;
    const ombre = <T extends THREE.Object3D>(o: T): T => {
      o.traverse((n) => ((n as THREE.Mesh).castShadow = true));
      return o;
    };
    // Les pièces sont construites dans le repère du personnage : on les accroche telles quelles à leur os.
    // Chaque accessoire est fondu en un minimum de maillages (même image, moins d'appels de dessin, 2026-10-08).
    const coller = (o: THREE.Object3D, os: string) => {
      ombre(o);
      if (o.children.length > 0) fusionnerStatique(o);
      corps.accrocher(o, os);
    };

    if (this.famille === "charbonniers") {
      // Le tablier de cuir : la bavette sur la poitrine, la jupe jusqu'aux genoux.
      const cuir = materiau(PALETTE.cuir, { rugosite: 0.65 });
      coller(pan(m, cou.y - 0.07, bassin.y + 0.02, 0.13, cuir, { courbure: 1.6, evase: 0.25 }), "spine_03");
      coller(pan(m, bassin.y + 0.04, genou.y - 0.02, 0.19, cuir, { courbure: 1.3, evase: 0.15, ecart: 0.018 }), "pelvis");
      // Le bandana rouille, noué derrière, et les lunettes de soudeur relevées sur le front.
      coller(bandeau(m, tete(0.66), 0.05, 0.03, materiau(0x8f3a22, { rugosite: 0.9 }), -0.12), "Head");
      const t = m.tranche(tete(0.66));
      const noeud = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), materiau(0x8f3a22));
      noeud.position.set(t.cx, tete(0.62), t.cz - t.rz - 0.035);
      coller(noeud, "Head");
      const verre = materiau(0x2f5d4a, { metal: 0.3, rugosite: 0.2, emission: 0x113322, intensiteEmission: 0.25 });
      const monture = materiau(0x3a3330, { metal: 0.5 });
      const yLunettes = tete(0.8);
      const zLunettes = m.devant(yLunettes, 0, 0.04) + 0.012;
      const lunettes = new THREE.Group();
      for (const dx of [-0.042, 0.042]) {
        const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12), verre);
        l.rotation.x = Math.PI / 2 - 0.5;
        l.position.set(dx, yLunettes, zLunettes);
        const cercle = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.008, 5, 14), monture);
        cercle.rotation.x = -0.5;
        cercle.position.set(dx, yLunettes + 0.006, zLunettes + 0.014);
        lunettes.add(l, cercle);
      }
      lunettes.add(bandeau(m, yLunettes, 0.014, 0.012, materiau(0x2a2420), -0.35));
      coller(lunettes, "Head");
      // Le marteau à la ceinture, sur la hanche droite.
      const marteau = new THREE.Group();
      const manche = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.28, 0.028), materiau(PALETTE.bois));
      const plomb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.045, 0.045), materiau(0x55524d, { metal: 0.6, rugosite: 0.5 }));
      plomb.position.y = 0.14;
      marteau.add(manche, plomb);
      marteau.position.set(hancheD.x * 2.1, bassin.y - 0.1, bassin.z + 0.02);
      coller(marteau, "pelvis");
    } else if (this.famille === "voltaiques") {
      // La lampe frontale : une lanière à la mesure de la tête, et le boîtier qui brille.
      const yLampe = tete(0.72);
      coller(bandeau(m, yLampe, 0.022, 0.006, materiau(0x1f1f1f), -0.1), "Head");
      const lampe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.042, 0.035), materiau(0xd8dde4, { metal: 0.4, rugosite: 0.4 }));
      lampe.position.set(0, yLampe, m.devant(yLampe, 0, 0.03) + 0.022);
      const verre = new THREE.Mesh(new THREE.CircleGeometry(0.016, 12), materiau(0xffffff, { emission: 0xe6f0ff, intensiteEmission: 1.4 }));
      verre.position.set(0, yLampe, lampe.position.z + 0.0185);
      coller(lampe, "Head");
      coller(verre, "Head");
      // La batterie dans le dos, avec sa borne rouge.
      const batterie = new THREE.Group();
      const boite = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.11), materiau(0x2b2b2b, { rugosite: 0.6 }));
      const etiquette = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.004), materiau(PALETTE.jauneReflechissant));
      etiquette.position.z = -0.057;
      const borne = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 8), materiau(0xc8362b));
      borne.position.set(0.06, 0.15, 0);
      batterie.add(boite, etiquette, borne);
      batterie.position.set(0, torse.y - 0.04, m.derriere(torse.y - 0.04, 0, 0.08) - 0.06);
      coller(batterie, "spine_03");
      // Le câble orange en bandoulière, de l'épaule gauche à la hanche droite.
      const epaule = new THREE.Vector3(0.13, cou.y - 0.04, 0);
      const hanche = new THREE.Vector3(-0.16, bassin.y + 0.02, 0);
      coller(bandouliere(m, epaule, hanche, 0.013, materiau(0xd2691e, { rugosite: 0.5 })), "spine_03");
    } else {
      // Le chapeau de paille : la calotte sur le crâne, un large bord, un ruban.
      const paille = materiau(PALETTE.paille, { rugosite: 0.9 });
      const yBord = tete(0.82);
      const t = m.tranche(tete(0.85));
      const chapeau = new THREE.Group();
      const bord = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.014, 24), paille);
      bord.scale.set(t.rx + 0.12, 1, t.rz + 0.12);
      bord.position.set(t.cx, yBord, t.cz);
      const calotte = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1, 1, 20), paille);
      // Un peu plus large que le crâne : l'épaisseur des cheveux, écrasés dessous.
      calotte.scale.set(t.rx + 0.022, sommet - yBord + 0.045, t.rz + 0.022);
      calotte.position.set(t.cx, (yBord + sommet + 0.04) / 2, t.cz);
      const ruban = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.022, 20, 1, true), materiau(0x6f3b2a));
      ruban.scale.set(t.rx + 0.016, 1, t.rz + 0.016);
      ruban.position.set(t.cx, yBord + 0.02, t.cz);
      chapeau.add(bord, calotte, ruban);
      coller(chapeau, "Head");
      // Les cheveux passent sous le chapeau : on ne dessine pas ce qui dépasserait au-dessus du bord.
      corps.masquerCheveuxAuDessus(yBord - 0.008);
      // La hotte en osier, dans le dos.
      const osier = materiau(0xa98a52, { rugosite: 0.95 });
      const hotte = new THREE.Group();
      const panier = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.48, 12, 4, true), osier);
      (panier.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      hotte.add(panier);
      for (const y of [-0.17, -0.06, 0.05, 0.16]) {
        const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.145 + y * 0.1, 0.007, 4, 16), materiau(0x7a5e34));
        anneau.rotation.x = Math.PI / 2;
        anneau.position.y = y;
        hotte.add(anneau);
      }
      const recolte = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), materiau(0x5f7a3a));
      recolte.position.y = 0.2;
      recolte.scale.y = 0.55;
      hotte.add(recolte);
      hotte.rotation.x = 0.1;
      hotte.position.set(0, torse.y - 0.06, m.derriere(torse.y - 0.06, 0, 0.08) - 0.16);
      coller(hotte, "spine_03");
      // Les bretelles de la hotte.
      for (const x of [0.08, -0.08]) coller(bandouliere(m, new THREE.Vector3(x, cou.y - 0.03, 0), new THREE.Vector3(x * 1.4, torse.y - 0.12, 0), 0.01, materiau(0x5a4630)), "spine_03");
      // Le tablier à graines, en toile, sur le devant.
      coller(pan(m, bassin.y + 0.06, bassin.y - 0.24, 0.17, materiau(0xc9b98f, { rugosite: 0.95 }), { courbure: 1.4, evase: 0.1, ecart: 0.016 }), "pelvis");
    }
  }

  /** L'arme en main (mode Combat), ou rien (`undefined` : pas en combat). */
  tenir(objet: TypeObjet | null | undefined): void {
    if (objet === this.armeTenue) return;
    this.armeTenue = objet;
    this.main.clear();
    if (objet === undefined || objet === null) return;
    const arme = creerArme(objet);
    if (!arme) return;
    // Le manche traverse la paume en diagonale, du talon de la main (côté auriculaire) vers la base de l'index :
    // il penche un peu vers les doigts.
    arme.rotation.x = -0.3;
    this.main.add(arme);
  }

  /**
   * Le geste du coup, joué tout de suite à l'écran (le serveur juge s'il porte). `duree` (s) : le geste de l'arme
   * (P-004) ; l'animation est jouée exactement sur cette durée.
   */
  frapper(appuye = false, duree?: number): void {
    if (!this.corps) return;
    const arme = this.armeTenue;
    const nom = !arme ? (appuye ? "Punch_Cross" : "Punch_Jab") : appuye ? "Sword_Regular_A" : "Sword_Attack";
    this.lancer(nom, appuye ? 1.25 : 1.6, duree);
  }

  /** L'esquive : une roulade. */
  esquiver(): void {
    this.lancer("Roll", 1.5);
  }

  /** Un coup reçu (morsure). */
  toucher(): void {
    this.lancer(Math.random() < 0.5 ? "Hit_Chest" : "Hit_Head", 1.2);
  }

  /** `duree` (s), si donnée, fixe la vitesse pour que le geste dure exactement ce temps. */
  private lancer(nom: string, vitesse: number, duree?: number): void {
    const a = this.corps?.jouer(nom, { boucle: false, fondu: 0.08, vitesse });
    if (a) {
      if (duree) {
        vitesse = a.getClip().duration / duree;
        a.timeScale = vitesse;
      }
      a.reset().play();
      this.unique = a.getClip().duration / vitesse;
    }
  }

  /** Bras levé pendant qu'on tient A (coup appuyé, Book 08 §3.3). */
  preparer(charge: number): void {
    this.charge = charge;
  }

  /** Le geste de l'action en cours (null : plus d'action). */
  agir(geste: GesteAction | null): void {
    this.geste = geste;
  }

  /** La nuit, lumière allumée : au repos, il la tient levée (torche 🔥, lanterne ⚙️). */
  porterLumiere(oui: boolean): void {
    this.lumiere = oui;
  }

  /** Endormi : couché au sol. */
  coucher(oui: boolean): void {
    this.couche = oui;
  }

  /** L'effondrement : il tombe et reste au sol jusqu'à son retour chez lui. */
  effondrer(oui = true): void {
    this.effondre = oui;
  }

  /** Les vêtements tachés de sang, une tache par blessure (aucune plaie visible, Book 21 §3.5). */
  blesser(nombre: number): void {
    this.blessures = Math.min(nombre, 6);
    this.corps?.tacher(this.blessures);
  }

  /** Anime le personnage selon sa vitesse réelle (m/s) et ce qu'il fait. */
  animer(dt: number, vitesse: number): void {
    const c = this.corps;
    if (!c) return;
    this.unique = Math.max(0, this.unique - dt);
    if (this.effondre) c.jouer("Death01", { boucle: false, fondu: 0.15 });
    else if (this.couche) c.poser("LayToIdle", 0, 0.8);
    else if (this.unique > 0) {
      // On laisse finir la frappe ou la roulade.
    } else if (vitesse > 0.15) {
      if (vitesse < 1.7) c.jouer("Crouch_Fwd_Loop", { vitesse: Math.min(1.8, vitesse / VITESSE_ANIM.accroupi) });
      else if (vitesse < 3.4) c.jouer("Walk_Loop", { vitesse: Math.min(2.2, vitesse / VITESSE_ANIM.marche) });
      else c.jouer("Jog_Fwd_Loop", { vitesse: Math.max(0.7, vitesse / VITESSE_ANIM.trot) });
    } else if (this.geste) c.jouer(ANIMATION_GESTE[this.geste], { fondu: 0.3, vitesse: 1 });
    else if (this.charge > 0.05) c.poser("Sword_Regular_A", 0.18 * this.charge, 0.15);
    else if (this.lumiere && this.armeTenue === undefined && this.famille !== "voltaiques")
      c.jouer(this.famille === "charbonniers" ? "Idle_Torch_Loop" : "Idle_Lantern_Loop", { fondu: 0.4 });
    else c.jouer("Idle_Loop", { fondu: 0.3, vitesse: 1 });
    c.mettreAJour(dt);
  }
}
