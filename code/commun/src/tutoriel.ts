// Le tutoriel de la première session (Book 14 §4.2) : douze étapes, de l'arrivée sur son terrain à la première nuit.
// Le serveur suit la progression d'après ce que fait réellement le joueur ; le client l'affiche dans le carnet.
//
// Plan 0.8 (chantier 13) : « La carte » passe avant « La famille » (V5-2). La fin du tutoriel est la saisie, la carte, la
// famille, la nuit (Q-0.8-18) : on va à la station-service, on y trouve **sa** pièce de famille (le panneau, l'enclume et
// son sac de charbon, le petit alternateur), et on bâtit son meuble de famille au retour, la pièce posée dessus. La
// première nuit se passe avec ce premier meuble ; le tutoriel y conseille les branches au feu (B14).

import type { Famille } from "./regles.ts";
import type { TypeObjet } from "./objets.ts";
import { HEURE_FIN_NUIT, MS_PAR_HEURE_JEU, jourDeJeu } from "./temps.ts";

export interface EtapeTutoriel {
  titre: string;
  /**
   * Ce qu'il faut faire, en une ou deux phrases (le ton du carnet : direct, sans jargon).
   * Les touches s'écrivent {action} (ex. {agir}) : le client met la touche du joueur, ou le bouton sur téléphone.
   */
  consigne: string;
  /** Ce qu'on apprend, dit une fois l'étape réussie. */
  lecon: string;
}

/** Les étapes qui comptent ailleurs (le seuil du métier, les Éteints mis en scène, ce qu'elles font fabriquer). */
export const ETAPE_FEU = 2;
export const ETAPE_OUTIL = 5;
export const ETAPE_ABRI = 6;
export const ETAPE_PREMIER_ETEINT = 7;
export const ETAPE_SAISIE = 8;
export const ETAPE_CARTE = 9;
export const ETAPE_FAMILLE = 10;
export const ETAPE_NUIT = 11;

/** La pièce de chaque famille, à la station (plan 0.8 §1.1, chantier 10) : ce que l'étape « La carte » fait rapporter. */
export const PIECE_DE_FAMILLE: Readonly<Record<Famille, TypeObjet>> = {
  charbonniers: "enclume_depanneur",
  voltaiques: "panneau_solaire",
  mecanistes: "petit_alternateur",
};

/** « La carte » : où trouver sa pièce, à la station (les `familles` de la v5). */
const CARTE: Record<Famille, string> = {
  charbonniers: "Ouvre la carte ({carte}) au bout du chemin et va à la station-service. Sous l'établi du garage, une enclume de dépanneur et un sac de charbon t'attendent : rapporte-les.",
  voltaiques: "Ouvre la carte ({carte}) au bout du chemin et va à la station-service. Un petit panneau solaire est appuyé contre un pilier de l'auvent : rapporte-le.",
  mecanistes: "Ouvre la carte ({carte}) au bout du chemin et va à la station-service. Sur l'établi du garage, près de la voiture éventrée, un petit alternateur t'attend : rapporte-le.",
};

/** « La famille » : le premier meuble, et le premier geste avec sa pièce (les `familles` de la v5, les gestes du chantier 7). */
const FAMILLE: Record<Famille, string> = {
  charbonniers: "Bâtis un foyer de forge (8 pierres, la barre de métal, 2 branches). Cale l'enclume sur le billot de ta forge : le feu ne trahit pas.",
  voltaiques: "Bâtis un banc solaire (2 bûches, la barre de métal, 3 branches). Pose le panneau sur ton banc et regarde : le soleil se met en réserve.",
  mecanistes: "Bâtis le pédalier générateur : le cadre, la chaîne et une roue du vélo, 2 bûches. Monte l'alternateur sur le pédalier, et pédale : ce qui tourne ne meurt pas.",
};

export function etapesTutoriel(famille: Famille): EtapeTutoriel[] {
  return [
    {
      titre: "L'arrivée",
      consigne: "Va à la ruine, à l'est. Essaie les allures : discrète ({discret}), marche, course ({courir}).",
      lecon: "Le cercle, c'est jusqu'où porte le bruit que tu fais. Plus tu cours, plus on t'entend.",
    },
    { titre: "Ramasser", consigne: "Ramasse 3 branches et 5 pierres ({agir}).", lecon: "Tout pèse : ton sac porte 55 kg." },
    {
      titre: "Le feu",
      consigne: "Monte un feu de camp (5 pierres, 3 branches) via Fabriquer, ajoute du bois, allume-le.",
      lecon: "Un feu chauffe, cuit, fait bouillir… et fume. La fumée se sent de loin : c'est de la signature.",
    },
    {
      titre: "L'eau",
      consigne: "Remplis ta gourde à la mare, puis fais-la bouillir sur le feu.",
      lecon: "L'eau de la mare rend malade. Bouillir coûte du bois : rien n'est gratuit.",
    },
    {
      titre: "Le vestige",
      consigne: "Examine le vieux vélo ({examiner}), fouille la caisse à outils, puis démonte le vélo.",
      lecon: "Un vestige s'utilise tel quel ou se démonte en pièces. L'énergie de l'ancien monde est dedans.",
    },
    { titre: "L'outil", consigne: "Remmanche la tête de hache de la caisse : une branche, ton couteau, une pierre pour marteler.", lecon: "Un bon outil va plus vite, et frappe plus fort." },
    { titre: "L'abri", consigne: "Monte un abri de branches et de bâche (la bâche est dans la ruine).", lecon: "Un toit pour dormir : on y récupère deux fois plus vite." },
    {
      titre: "Le premier Éteint",
      consigne: "Un Éteint arrive ! Mode Combat ({combat}), vise la tête : maintiens {agir}, relâche.",
      lecon: "Seul, un Éteint est lent et fragile. Le danger, c'est le nombre et la surprise.",
    },
    {
      titre: "La saisie",
      consigne: "Il t'a attrapé ! Tape {examiner} très vite pour te dégager.",
      lecon: "Saisi, tu ralentis ; à deux, ils t'immobilisent ; à trois, c'est fini. Ne te laisse jamais encercler.",
    },
    {
      titre: "La carte",
      consigne: CARTE[famille],
      lecon: "Le monde est grand et la route coûte. Au-delà de la station, le Comptoir du Carrefour t'attend.",
    },
    { titre: "La famille", consigne: FAMILLE[famille], lecon: "Chaque famille produit son énergie à sa façon. Les autres auront besoin de ce que tu sais faire." },
    {
      titre: "La nuit",
      // B14 : les bûches du terrain ne repoussent pas ; les branches, si.
      consigne: "Dors dans l'abri ({agir} devant), près du feu. Nourris-le de branches : elles repoussent, les bûches non. La nuit, toute lumière se voit de loin.",
      lecon: "Se déconnecter dans son abri compte comme une nuit complète.",
    },
  ];
}

export const NOMBRE_ETAPES = 12;

/** L'état du tutoriel d'un joueur, gardé en base. */
export interface EtatTutoriel {
  /** Étape en cours, de 0 à 11 ; 12 : terminé. */
  etape: number;
  /** Compteurs et drapeaux utiles aux conditions (mètres parcourus, allures essayées, branches ramassées…). */
  marche: number;
  allures: string[];
  branches: number;
  pierres: number;
  bouilli: boolean;
  premierEteintDetruit: boolean;
  degage: boolean;
  dormiAbri: boolean;
  visiteStation: boolean;
}

export const TUTORIEL_NEUF: EtatTutoriel = {
  etape: 0,
  marche: 0,
  allures: [],
  branches: 0,
  pierres: 0,
  bouilli: false,
  premierEteintDetruit: false,
  degage: false,
  dormiAbri: false,
  visiteStation: false,
};

/** Ce que le client montre dans le carnet. */
export interface VueTutoriel {
  etape: number;
  total: number;
  titre: string;
  consigne: string;
  /** La leçon de l'étape qui vient d'être réussie, à montrer un moment. */
  lecon?: string;
  termine: boolean;
  /** Ce qu'il reste à faire, compté (« Branches 2/3 », « Pierres 1/5 ») : pour suivre l'étape en cours. */
  progres?: { libelle: string; fait: number; but: number }[];
}

// ---------- La première nuit : l'avertissement de la bûche (plan 0.8 §2.6, B14) ----------

/** Le texte du bandeau, dans la voix du carnet. */
export const TEXTE_AVERTISSEMENT_BUCHE = "Une bûche ne repousse pas : garde-la pour bâtir.";
/** Le bouton qui le ferme (jamais une croix : règle du porteur, §2.6). */
export const BOUTON_AVERTISSEMENT = "Compris";
/** En dessous de ce nombre de bûches restantes, une bûche au feu fait avertir. */
export const SEUIL_BUCHES = 6;

/**
 * Faut-il avertir ? Une bûche (pas une branche) mise au feu **du terrain** (jamais au feu d'une halte), alors qu'il en
 * reste moins de 6 (au sol du terrain, dans le sac et les coffres, celle qu'on brûle déjà retirée), et pas encore
 * cette nuit. `nuit` : le numéro de la nuit en cours (`nuitDuJeu`) ; `dejaAverti` : celui du dernier avertissement.
 */
export function avertirBuche(a: { lieu: string; bois: TypeObjet; restantes: number; nuit: number; dejaAverti: number | null }): boolean {
  return a.lieu === "terrain" && a.bois === "buche" && a.restantes < SEUIL_BUCHES && a.dejaAverti !== a.nuit;
}

/** Le numéro de la nuit en cours : une « nuit » court d'un matin (5 h 30) au suivant, le jour qui la précède compris. */
export function nuitDuJeu(instantMs: number, debutMondeMs: number): number {
  return jourDeJeu(instantMs - HEURE_FIN_NUIT * MS_PAR_HEURE_JEU, debutMondeMs);
}
