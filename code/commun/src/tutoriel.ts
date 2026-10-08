// Le tutoriel de la première session (Book 14 §4.2) : douze étapes, de l'arrivée sur son terrain au premier voyage.
// Le serveur suit la progression d'après ce que fait réellement le joueur ; le client l'affiche dans le carnet.

import type { Famille } from "./regles.ts";

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

const FAMILLE: Record<Famille, string> = {
  charbonniers: "Bâtis un foyer de forge (8 pierres, la barre de métal de la ruine, 2 branches). Le feu ne trahit pas.",
  voltaiques: "Bâtis un banc de recharge (2 bûches, la barre de métal de la ruine). Le silence est une arme.",
  mecanistes: "Bâtis le pédalier avec le cadre, la chaîne et une roue du vélo. Ce qui tourne ne meurt pas.",
};

export function etapesTutoriel(famille: Famille): EtapeTutoriel[] {
  return [
    {
      titre: "L'arrivée",
      consigne: "Cours jusqu'à la ruine de ferme, à droite de l'écran (vers l'est). Essaie les trois allures : discrète ({discret}), marche, course ({courir}). Regarde le cercle au sol.",
      lecon: "Le cercle, c'est jusqu'où porte le bruit que tu fais. Plus tu cours, plus on t'entend.",
    },
    { titre: "Ramasser", consigne: "Ramasse 3 branches et 5 pierres ({agir}).", lecon: "Tout pèse : ton sac porte 55 kg." },
    {
      titre: "Le feu",
      consigne: "Monte un feu de camp (5 pierres, 3 branches) depuis Fabriquer, ajoute du bois et allume-le au briquet.",
      lecon: "Un feu chauffe, cuit, fait bouillir… et fume. La fumée se sent de loin : c'est de la signature.",
    },
    {
      titre: "L'eau",
      consigne: "Remplis ta gourde à la mare, puis fais-la bouillir sur le feu.",
      lecon: "L'eau de la mare rend malade. Bouillir coûte du bois : rien n'est gratuit.",
    },
    {
      titre: "Le vestige",
      consigne: "Examine le vieux vélo ({examiner}), fouille la caisse à outils de la ruine, puis démonte le vélo.",
      lecon: "Un vestige s'utilise tel quel ou se démonte en pièces. L'énergie de l'ancien monde est dedans.",
    },
    { titre: "L'outil", consigne: "Remmanche la tête de hache trouvée dans la caisse : une branche pour le manche, ton couteau pour couper, et une pierre (ou un marteau) pour marteler.", lecon: "Un bon outil va plus vite, et frappe plus fort." },
    { titre: "L'abri", consigne: "Monte un abri de branches et de bâche (la bâche est dans la ruine).", lecon: "Un toit pour dormir : on y récupère deux fois plus vite." },
    {
      titre: "Le premier Éteint",
      consigne: "Un Éteint arrive, attiré par la fumée. Passe en mode Combat ({combat}) et vise la tête : maintiens {agir}, puis relâche.",
      lecon: "Seul, un Éteint est lent et fragile. Le danger, c'est le nombre et la surprise.",
    },
    {
      titre: "La saisie",
      consigne: "Il t'a attrapé ! Tape {examiner} très vite pour te dégager.",
      lecon: "Saisi, tu ralentis ; à deux, ils t'immobilisent ; à trois, c'est fini. Ne te laisse jamais encercler.",
    },
    { titre: "La famille", consigne: FAMILLE[famille], lecon: "Chaque famille produit son énergie à sa façon. Les autres auront besoin de ce que tu sais faire." },
    {
      titre: "La nuit",
      consigne: "Dors dans l'abri, près du feu ({agir} devant l'abri). La nuit, toute lumière se voit de loin.",
      lecon: "Se déconnecter dans son abri compte comme une nuit complète.",
    },
    {
      titre: "La carte",
      consigne: "Ouvre la carte ({carte}) au bout du chemin, va jusqu'à la station-service, puis reviens chez toi.",
      lecon: "Le monde est grand et la route coûte. Au-delà de la station, le Comptoir du Carrefour t'attend.",
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
