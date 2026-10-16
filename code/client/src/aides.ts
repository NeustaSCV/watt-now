// L'aide contextuelle (Book 14 §4.3) : un conseil discret, la première fois qu'un système apparaît.
// Une seule fois par personnage (gardé dans le navigateur).

import { ecrire, lire } from "./stockage.ts";

export type Aide =
  | "pluie"
  | "eteint"
  | "saisie"
  | "saignement"
  | "faim"
  | "soif"
  | "fatigue"
  | "halte"
  | "comptoir"
  | "nuit"
  | "effondrement"
  | "partir"
  // Le duel (0.11, D-23) : des indices d'une ligne, une fois chacun (voir main.ts, indiceUneFois).
  | "combat_halte"
  | "halo_rouge";

export const TEXTES_AIDES: Record<Aide, string> = {
  pluie: "Il pleut : la pluie couvre les bruits et les odeurs. Bon moment pour travailler sans attirer les Éteints.",
  eteint: "Un Éteint ! Lent, presque aveugle, mais il entend tout. En allure discrète, il peut te manquer.",
  saisie: "Saisi : tape deux fois {agir} ou {examiner} pour te dégager. Plus ils sont nombreux, plus il en faut.",
  saignement: "Tu saignes : un pansement arrête le saignement. Les Éteints sentent le sang de loin.",
  faim: "Tu as faim : mange quelque chose (le sac, puis « Manger »). Affamé, tu ne peux plus courir.",
  soif: "Tu as soif : bois à ta gourde. L'eau de la mare doit bouillir avant.",
  fatigue: "Tu es épuisé : dors dans ton abri. Fatigué, tu travailles moins vite et tu ne cours plus.",
  halte: "Une halte : tout le monde y passe. Le butin est maigre, et des Éteints dorment près de la station.",
  comptoir: "Le Comptoir du Carrefour : on vend, on achète, et seule l'électricité déposée crée des wotts.",
  nuit: "La nuit tombe. Ta lumière se voit de loin : allume-la quand il le faut, pas plus.",
  partir: "Avant de quitter, dors dans ton abri : ça compte comme une nuit, et hors ligne faim et soif sont gelées.",
  effondrement: "Tu t'es effondré. Ton sac est resté là-bas : va le reprendre, il est marqué d'un anneau jaune.",
  // Mot pour mot (duel-entre-joueurs.md §10, D-23).
  combat_halte: "En Combat, les autres te voient en rouge.",
  halo_rouge: "Halo rouge : il peut te frapper.",
};

export class Aides {
  private deja = new Set<Aide>();
  private cle = "";

  /** Les aides déjà montrées à ce personnage. */
  charger(pseudo: string): void {
    this.cle = `watt.aides.${pseudo}`;
    this.deja = new Set((lire(this.cle) ?? "").split(",").filter(Boolean) as Aide[]);
  }

  /** Montre l'aide si c'est la première fois ; renvoie son texte, ou null. */
  premiereFois(aide: Aide): string | null {
    if (!this.cle || this.deja.has(aide)) return null;
    this.deja.add(aide);
    ecrire(this.cle, [...this.deja].join(","));
    return TEXTES_AIDES[aide];
  }
}
