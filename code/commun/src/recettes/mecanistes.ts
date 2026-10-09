// ⚙️ Les recettes des Mécanistes : vieux vélo → pédalier → meule et dynamo. Le chantier 7 (Book 25 §6) y ajoute
// l'arbalète et ses pièces, les carreaux, les pièges, le tour à perche, le soufflet à manivelle, la brouette.
// Les autres familles voient ces recettes grisées, « chez les Mécanistes » (savoir.ts).

import type { Recette } from "../recettes.ts";

export const RECETTES_MECANISTES: Recette[] = [
  {
    id: "pedalier",
    categorie: "ateliers",
    nom: "Pédalier universel",
    produit: { installation: "pedalier" },
    ingredients: { cadre_velo: 1, chaine_velo: 1, roue_velo: 1, buche: 2 },
    qualites: { serrer: 1, visser: 1, marteler: 1 },
    duree: 90,
    intensite: "moyenne",
    famille: "mecanistes",
  },
];
