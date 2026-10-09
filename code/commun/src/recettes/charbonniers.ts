// 🔥 Les recettes des Charbonniers : bois → charbonnière → forge → lame (Book 21 §3.4). Le chantier 5 (Book 25 §4.3)
// y ajoute la gamme : pinces, couteau de forge, hachette, hache, machette forgée, serpe, glaive, pointes, rivets,
// ciseau et burin, ressort retrempé, électrodes ; la trempe, reprendre une lame, reforger la lame ébréchée.
// Les autres familles voient ces recettes grisées, « chez les Charbonniers » (savoir.ts).

import type { Recette } from "../recettes.ts";

export const RECETTES_CHARBONNIERS: Recette[] = [
  {
    id: "charbonniere",
    categorie: "ateliers",
    nom: "Meule de charbonnière",
    produit: { installation: "charbonniere" },
    ingredients: { buche: 10, branche: 4 },
    qualites: {},
    duree: 60,
    intensite: "lourde",
    famille: "charbonniers",
  },
  {
    id: "forge",
    categorie: "ateliers",
    nom: "Foyer de forge à soufflet",
    produit: { installation: "forge" },
    ingredients: { pierre: 8, barre_metal: 1, branche: 2 },
    qualites: { marteler: 1 },
    duree: 90,
    intensite: "lourde",
    famille: "charbonniers",
  },
  {
    id: "lame_forgee",
    categorie: "outils",
    nom: "Forger une lame",
    produit: { objet: "lame_forgee", quantite: 1 },
    ingredients: { ressort_lames: 1, charbon_bois: 1 },
    qualites: { marteler: 2 },
    installation: "forge",
    duree: 90,
    intensite: "lourde",
    famille: "charbonniers",
  },
];
