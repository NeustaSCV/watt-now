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
import { Assemblage, V3, placer } from "./assemblage.ts";
import { Mesure, bandeau, bandouliere, pan } from "./accessoires.ts";
import { modeleMetier } from "./metier/index.ts";
import { TENUE_TOGE, habillerToge } from "./toge.ts";

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

/** Une lame ou un fer plat : un profil (z, y) extrudé sur l'épaisseur x, le fil (y > `fil`) plus clair. */
function fer(c: Assemblage, profil: [number, number][], epaisseur: number, fil: number, acier = 0x55524d, brillant = 0xc9cbc8, decalage = 0): void {
  const forme = new THREE.Shape(profil.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(forme, { depth: epaisseur, bevelEnabled: true, bevelThickness: epaisseur * 0.3, bevelSize: epaisseur * 0.4, bevelSegments: 1 });
  g.rotateY(-Math.PI / 2).translate(epaisseur / 2 + decalage, 0, 0);
  c.ajouterDegrade(g, (p) => (p.y > fil ? brillant : acier), "metal");
}

/** Un manche le long de z (de `z0` à `z1`), un peu renflé au bout ; une poignée gainée autour du poing. */
function manche(c: Assemblage, z0: number, z1: number, r: number, bois: number = PALETTE.bois, gaine?: number): void {
  c.perche(new V3(0, 0, z0), new V3(0, 0, z1), r * 1.2, bois, "mat", 6, r * 0.95, 0.06);
  c.perche(new V3(0, 0, z0 - 0.012), new V3(0, 0, z0 + 0.02), r * 1.05, bois, "mat", 6, r * 1.35, 0.04);
  if (gaine !== undefined) c.perche(new V3(0, 0, -0.06), new V3(0, 0, 0.07), r * 1.32, gaine, "mat", 6, r * 1.3, 0.08);
}

/**
 * Une arme tenue en main, construite dans le repère du poing : le poing à l'origine, le manche selon +z (il sort du
 * poing côté pouce), la tête ou le tranchant selon +y (devant les doigts). Les outils sont un peu plus grands que
 * nature (+15 à 20 %, Book 21 §5.3.2) pour rester lisibles. Couleurs par sommet : un ou deux appels de dessin.
 * Null si l'objet ne se tient pas comme une arme.
 */
export function creerArme(objet: TypeObjet): THREE.Group | null {
  const c = new Assemblage(objet.length * 13);
  const boisClair = 0x9a7650;
  // Comparaison sur chaîne : les armes de la 0.5 (machette, masse, lance) arrivent dans les types de `commun/`.
  switch (objet as string) {
    case "hache":
      // Un manche de frêne légèrement galbé, un fer à joue large : talon sombre, tranchant affûté brillant.
      manche(c, -0.16, 0.6, 0.016, boisClair, PALETTE.cuir);
      fer(c, [[0.46, -0.05], [0.56, -0.05], [0.565, 0.03], [0.63, 0.16], [0.6, 0.2], [0.5, 0.19], [0.43, 0.165], [0.47, 0.035]], 0.026, 0.155);
      c.ajouter(placer(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 6).rotateX(Math.PI / 2), 0, -0.01, 0.51), 0x4a4744, "metal");
      break;
    case "marteau":
      // Un marteau de charpentier : la table de frappe ronde devant les doigts, l'arrache-clou fendu de l'autre côté.
      manche(c, -0.1, 0.34, 0.014, boisClair, 0x3a2c22);
      c.boite(0x4a4744, "metal", 0.034, 0.075, 0.04, 0, 0.0, 0.32);
      c.ajouter(placer(new THREE.CylinderGeometry(0.022, 0.019, 0.045, 8), 0, 0.058, 0.32), 0x8a8780, "metal");
      for (const x of [-0.009, 0.009]) fer(c, [[0.3, -0.03], [0.34, -0.03], [0.31, -0.08], [0.27, -0.105], [0.29, -0.07]], 0.008, 1, 0x4a4744, 0x4a4744, x);
      break;
    case "barre_metal": {
      // Une barre à mine (pied-de-biche) : tige à six pans piquée de rouille, le bout recourbé et fendu, l'autre en biseau.
      const tige = new THREE.CylinderGeometry(0.015, 0.015, 0.84, 6, 6).rotateX(Math.PI / 2).translate(0, 0, 0.18);
      c.ajouterDegrade(tige, (p) => (Math.sin(p.z * 23) + Math.sin(p.z * 61 + p.x * 90) > 1.1 ? PALETTE.rouille : 0x5c5953), "metal");
      c.perche(new V3(0, 0, 0.6), new V3(0, 0.05, 0.67), 0.015, 0x5c5953, "metal", 6);
      c.perche(new V3(0, 0.05, 0.67), new V3(0, 0.1, 0.665), 0.014, 0x6e3a22, "metal", 6, 0.009);
      c.ajouter(placer(new THREE.BoxGeometry(0.028, 0.008, 0.06), 0, 0.0, -0.26, 0.15, 0, 0), 0x6b6862, "metal");
      break;
    }
    case "lame_forgee":
      // Une lame forgée au foyer : fer sombre martelé, fil clair, soie gainée de corde.
      manche(c, -0.08, 0.08, 0.015, PALETTE.boisSombre);
      for (const z of [-0.05, -0.02, 0.01, 0.04, 0.07]) c.ligature(new V3(0, 0, z), new V3(0, 0, 1), 0.019);
      c.boite(0x3a3836, "metal", 0.03, 0.06, 0.015, 0, 0.0, 0.09);
      fer(c, [[0.09, -0.018], [0.4, -0.016], [0.47, 0.0], [0.42, 0.03], [0.25, 0.038], [0.09, 0.03]], 0.006, 0.024, 0x3d3a37, 0xb9bbb8);
      break;
    case "couteau":
    case "couteau_aiguise":
      // Un couteau de cuisine de l'Abondance : manche noir riveté, lame d'acier ; le fil brille quand il est aiguisé.
      c.boite(0x2b2826, "mat", 0.022, 0.032, 0.13, 0, 0.002, 0.0);
      for (const z of [-0.035, 0.025]) c.ajouter(placer(new THREE.CylinderGeometry(0.005, 0.005, 0.024, 5).rotateZ(Math.PI / 2), 0, 0.002, z), 0xb59048, "metal");
      fer(c, [[0.065, -0.014], [0.21, -0.012], [0.25, -0.002], [0.21, 0.014], [0.13, 0.022], [0.065, 0.02]], 0.004, objet === "couteau_aiguise" ? 0.012 : 0.02, 0x9a9c9a, objet === "couteau_aiguise" ? 0xeef0f0 : 0xb0b2b0);
      break;
    case "gourdin": {
      // Un gourdin de bois dur : la poignée gainée, la tête renflée, des nœuds.
      const profil = [new THREE.Vector2(0, -0.12), new THREE.Vector2(0.02, -0.12), new THREE.Vector2(0.022, 0.1), new THREE.Vector2(0.034, 0.36), new THREE.Vector2(0.05, 0.52), new THREE.Vector2(0.046, 0.6), new THREE.Vector2(0, 0.62)];
      const g = new THREE.LatheGeometry(profil, 7).rotateX(Math.PI / 2);
      c.ajouter(g, PALETTE.boisSombre, "mat", 0.07);
      for (const [z, a] of [[0.3, 0.5], [0.44, 2.6], [0.52, 4.4]] as const) c.perche(new V3(Math.cos(a) * 0.03, Math.sin(a) * 0.03, z), new V3(Math.cos(a) * 0.06, Math.sin(a) * 0.06, z + 0.02), 0.012, 0x4a3828, "mat", 4, 0.006);
      c.perche(new V3(0, 0, -0.07), new V3(0, 0, 0.08), 0.026, PALETTE.cuir, "mat", 6, 0.025, 0.08);
      break;
    }
    case "epieu": {
      // Une longue perche écorcée, tenue au tiers, la pointe durcie et noircie au feu (P-002).
      const perche = new THREE.CylinderGeometry(0.019, 0.023, 1.75, 6, 8).rotateX(Math.PI / 2).translate(0, 0, 0.42);
      const pointe = new THREE.ConeGeometry(0.019, 0.22, 6).rotateX(Math.PI / 2).translate(0, 0, 1.405);
      const couleur = (p: THREE.Vector3) => (p.z > 1.42 ? 0x1c1714 : p.z > 1.3 ? 0x2e2420 : p.z > 1.18 ? 0x5a4130 : Math.sin(p.z * 9) > 0.7 ? 0x8a6a48 : 0xa78a62);
      c.ajouterDegrade(perche, couleur);
      c.ajouterDegrade(pointe, couleur);
      for (const z of [-0.05, 0.08]) c.ligature(new V3(0, 0, z), new V3(0, 0, 1), 0.024);
      break;
    }
    case "pied_de_biche": {
      // Un pied-de-biche de 75 cm (≈ 86 avec l'agrandissement) : tige à six pans peinte en rouge, la peinture écaillée
      // de noir et de l'acier nu aux bouts ; le col de cygne et sa griffe fendue en haut, le biseau en bas.
      const ROUGE = 0x8e2a22;
      const ecaille = (p: THREE.Vector3) => {
        const n = Math.sin(p.z * 31 + p.x * 70) + Math.sin(p.z * 83 + p.y * 120);
        if (p.z < -0.17 || p.y > 0.11) return 0x6b6862; // les bouts usés jusqu'au métal
        return n > 1.15 ? 0x232120 : n < -1.4 ? 0x6b6862 : ROUGE;
      };
      c.ajouterDegrade(new THREE.CylinderGeometry(0.014, 0.014, 0.72, 6, 8).rotateX(Math.PI / 2).translate(0, 0, 0.16), ecaille, "metal");
      // Le col de cygne : un tube qui se recourbe vers l'avant des doigts.
      const col = new THREE.CatmullRomCurve3([new V3(0, 0, 0.5), new V3(0, 0.006, 0.57), new V3(0, 0.045, 0.635), new V3(0, 0.1, 0.655), new V3(0, 0.145, 0.63)]);
      c.ajouterDegrade(new THREE.TubeGeometry(col, 8, 0.0135, 6), ecaille, "metal");
      // La griffe : deux dents écartées, aplaties, qui pointent vers le bas (on y glisse une tête de clou).
      for (const x of [-0.0075, 0.0075]) c.ajouter(placer(new THREE.BoxGeometry(0.009, 0.012, 0.05), x, 0.155, 0.605, 0.5, 0, 0), 0x55524d, "metal");
      // Le biseau, à l'autre bout, un peu relevé.
      c.ajouterDegrade(placer(new THREE.CylinderGeometry(0.003, 0.014, 0.075, 6).scale(1.9, 1, 0.45).rotateX(-Math.PI / 2), 0, 0.004, -0.235, 0.12, 0, 0), () => 0x6b6862, "metal");
      break;
    }
    case "machette": {
      // Une machette : lame large de 45 cm (≈ 52 avec l'agrandissement), dos droit, ventre qui s'élargit vers la
      // pointe et remonte un peu (légère courbe) ; le manche noir rivé, comme un gros couteau.
      c.boite(0x1f1d1c, "mat", 0.026, 0.036, 0.15, 0, 0.003, 0.0);
      c.boite(0x1f1d1c, "mat", 0.03, 0.042, 0.02, 0, 0.004, -0.075);
      for (const z of [-0.045, 0.0, 0.045]) c.ajouter(placer(new THREE.CylinderGeometry(0.0055, 0.0055, 0.03, 6).rotateZ(Math.PI / 2), 0, 0.003, z), 0xa8aaa8, "metal");
      fer(
        c,
        [[0.07, -0.016], [0.3, -0.018], [0.5, -0.012], [0.58, 0.0], [0.615, 0.022], [0.6, 0.045], [0.52, 0.06], [0.36, 0.055], [0.18, 0.04], [0.07, 0.024]],
        0.005,
        0.044,
        0x6f716f,
        0xd2d4d0,
      );
      break;
    }
    case "masse": {
      // Une masse de 3 kg : tête d'acier carrée aux faces chanfreinées, manche de bois de 90 cm (≈ 1 m), tenue au bas
      // du manche. (Tenue à une main : les animations n'ont pas de prise à deux mains, le manche dépasse sous le poing.)
      manche(c, -0.14, 0.88, 0.017, boisClair, 0x3a2c22);
      c.boite(0x4a4744, "metal", 0.078, 0.2, 0.078, 0, 0.0, 0.9);
      for (const s of [-1, 1]) c.ajouter(placer(new THREE.CylinderGeometry(0.046, 0.052, 0.025, 4, 1).rotateY(Math.PI / 4), 0, s * 0.11, 0.9, s > 0 ? 0 : Math.PI, 0, 0), 0x77746e, "metal");
      // Le coin d'emmanchement, sur le dessus de la tête.
      c.boite(0x6b5a3e, "mat", 0.02, 0.04, 0.008, 0, 0.0, 0.942);
      break;
    }
    case "lance": {
      // Une lance : la perche de l'épieu (environ 2 m en tout), un couteau ligaturé au bout avec de la ficelle.
      const perche = new THREE.CylinderGeometry(0.017, 0.023, 1.82, 6, 8).rotateX(Math.PI / 2).translate(0, 0, 0.45);
      c.ajouterDegrade(perche, (p) => (Math.sin(p.z * 9) > 0.7 ? 0x8a6a48 : 0xa78a62));
      // Le couteau : son manche noir couché contre la perche, côté doigts, la lame qui la prolonge.
      c.boite(0x2b2826, "mat", 0.02, 0.026, 0.13, 0, 0.026, 1.3);
      fer(c, [[1.36, 0.006], [1.53, 0.008], [1.6, 0.022], [1.53, 0.038], [1.44, 0.044], [1.36, 0.042]], 0.004, 0.036, 0x9a9c9a, 0xd8dad8);
      // La ficelle : trois ligatures serrées autour de la perche et du manche.
      for (const z of [1.26, 1.3, 1.34]) c.ligature(new V3(0, 0.011, z), new V3(0, 0, 1), 0.034, 0xcfc3a0);
      for (const z of [-0.05, 0.08]) c.ligature(new V3(0, 0, z), new V3(0, 0, 1), 0.024);
      break;
    }
    case "fourche_foin": {
      // La fourche à foin de l'étable du Moulin (plan 0.8 §2.4, I30) : un long manche de frêne patiné par les mains,
      // une douille de fer, trois dents d'acier forgé un peu cintrées vers l'avant, la pointe usée claire. Tenue comme la
      // lance (≈ 1,9 m), à une main.
      const perche = new THREE.CylinderGeometry(0.016, 0.02, 1.62, 6, 8).rotateX(Math.PI / 2).translate(0, 0, 0.43);
      // Le bois blondi, plus sombre et lustré là où on le tient (le tiers bas et le bout).
      c.ajouterDegrade(perche, (p) => (p.z < 0.2 || p.z > 1.05 ? 0x6e5236 : Math.sin(p.z * 7) > 0.75 ? 0x9a7a52 : 0xb08e62));
      // La douille et sa bague : le fer qui enserre le bout du manche.
      c.perche(new V3(0, 0, 1.18), new V3(0, 0, 1.3), 0.021, 0x3c3a37, "metal", 6, 0.017);
      c.ajouter(placer(new THREE.CylinderGeometry(0.024, 0.024, 0.014, 8).rotateX(Math.PI / 2), 0, 0, 1.2), 0x55524d, "metal");
      // La traverse, d'où partent les trois dents.
      c.perche(new V3(-0.075, 0.004, 1.32), new V3(0.075, 0.004, 1.32), 0.011, 0x3c3a37, "metal", 5);
      c.perche(new V3(0, 0, 1.29), new V3(0, 0.004, 1.33), 0.014, 0x3c3a37, "metal", 5);
      for (const x of [-0.072, 0, 0.072]) {
        // Chaque dent : trois segments qui s'effilent, cintrés vers les doigts (+y), la pointe claire.
        const points = [new V3(x, 0.004, 1.32), new V3(x * 1.08, 0.012, 1.45), new V3(x * 1.12, 0.03, 1.57), new V3(x * 1.12, 0.058, 1.67)];
        // Un peu plus épaisses que nature (Book 21 §5.3.2) : à l'écran d'un iPhone, trois traits lisibles.
        const rayons = [0.0105, 0.0092, 0.0075, 0.0035];
        for (let i = 0; i < 3; i++) c.perche(points[i]!, points[i + 1]!, rayons[i]!, i === 2 ? 0xb4b6b2 : 0x5e5c58, "metal", 5, rayons[i + 1]!);
      }
      break;
    }
    default: {
      // Les armes de métier de la 0.6 (Book 25 §10.4) : leur modèle vient du registre (rendu/metier/).
      const modele = modeleMetier(objet, "main");
      if (!modele) return null;
      const groupe = new THREE.Group();
      groupe.add(modele);
      return groupe;
    }
  }
  const arme = new THREE.Group();
  for (const m of c.maillages()) {
    m.receiveShadow = false;
    arme.add(m);
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
  /** L'arme longue portée dans le dos hors du combat (la fourche à foin, plan 0.8 §2.4), accrochée au torse. */
  private readonly dos = new THREE.Group();
  private armeDansLeDos: TypeObjet | null = null;
  /** Où pend l'arme dans le dos, dans le repère du personnage (mesuré à l'habillage). */
  private poseDos: { y: number; z: number } | null = null;
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
      tenue: a.toge ? TENUE_TOGE : TENUES[this.famille],
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
    // L'arme dans le dos : un groupe accroché au torse, à part comme l'arme en main (on la montre ou la cache).
    corps.accrocher(this.dos, "spine_03");
    this.objet.add(corps.objet);
    // Un seul maillage pour tout le personnage (même image, un appel de dessin) ; l'arme en main reste à part.
    corps.fondre([this.main, this.dos]);
    corps.cadrer(2.5);
    corps.tacher(this.blessures);
    const arme = this.armeTenue;
    this.armeTenue = null;
    this.tenir(arme);
    const dos = this.armeDansLeDos;
    this.armeDansLeDos = null;
    this.porterDansLeDos(dos);
    corps.jouer("Idle_Loop");
  }

  /** Les accessoires de silhouette de la famille (Book 18 §4.1), moulés sur le corps habillé. */
  private habiller(corps: Humanoide): void {
    // La coiffure compte : chapeau, bandana et lanière de lampe passent par-dessus les cheveux.
    const cle = `${this.famille}|${this.apparence.silhouette}|${this.apparence.taille}|${this.apparence.corpulence}|${this.apparence.coiffure}|${this.apparence.barbe}|${this.apparence.toge === true}`;
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

    // L'arme dans le dos passe derrière ce que la famille y porte déjà : la batterie ⚡, la hotte ⚙️.
    const recul = this.apparence.toge ? 0.05 : { charbonniers: 0.05, voltaiques: 0.15, mecanistes: 0.32 }[this.famille];
    this.poseDos = { y: torse.y, z: m.derriere(torse.y, 0, 0.08) - recul };

    // Le compte admin « god » : la toge blanche à la place des accessoires de sa famille (rendu/toge.ts).
    if (this.apparence.toge) return habillerToge(corps, m, coller, tete);

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
    // Les armes de métier (l'arc, Book 25) viennent du registre des modèles de métier.
    const arme = creerArme(objet) ?? modeleMetier(objet, "main");
    if (!arme) return;
    // Le manche traverse la paume en diagonale, du talon de la main (côté auriculaire) vers la base de l'index :
    // il penche un peu vers les doigts.
    arme.rotation.x = -0.3;
    this.main.add(arme);
  }

  /**
   * L'arme portée dans le dos hors du combat (null : rien). Seule la fourche à foin s'y porte (plan 0.8 §2.4) : en travers
   * du dos, les dents en haut, derrière l'épaule gauche. En combat, elle passe en main (`tenir`).
   */
  porterDansLeDos(objet: TypeObjet | null): void {
    if (objet === this.armeDansLeDos) return;
    this.armeDansLeDos = objet;
    this.dos.clear();
    if (!objet || !this.poseDos) return;
    const arme = creerArme(objet);
    if (!arme) return;
    // Le modèle est construit dans le repère du poing (manche selon +z, dents vers +y) : on le redresse (manche vers le
    // haut, dents vers l'arrière), on le centre sur le dos, puis on l'incline en travers.
    arme.position.z = -0.72;
    const redresse = new THREE.Group();
    redresse.rotation.x = -Math.PI / 2;
    redresse.add(arme);
    const travers = new THREE.Group();
    travers.position.set(0, this.poseDos.y - 0.04, this.poseDos.z);
    travers.rotation.z = -0.5;
    travers.add(redresse);
    this.dos.add(travers);
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
