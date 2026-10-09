// ⚡ Les recettes des Voltaïques : batterie → banc de recharge → panneau. Le chantier 6 (Book 25 §5) y ajoute les
// packs et les modules, les matraques, l'aiguillon, la lampe bricolée, l'alarme, les clôtures, la plaque de choc.
// Les autres familles voient ces recettes grisées, « chez les Voltaïques » (savoir.ts).

import type { Recette } from "../recettes.ts";

export const RECETTES_VOLTAIQUES: Recette[] = [
  {
    id: "banc_recharge",
    categorie: "ateliers",
    nom: "Banc de recharge",
    produit: { installation: "banc_recharge" },
    ingredients: { buche: 2, barre_metal: 1 },
    qualites: { visser: 1, serrer: 1 },
    duree: 60,
    intensite: "moyenne",
    famille: "voltaiques",
  },
  {
    // Le panneau de la station-service, posé sur un support de branches, plein sud, câblé au banc (É4).
    id: "panneau_solaire",
    categorie: "ateliers",
    nom: "Poser le panneau solaire",
    produit: { installation: "panneau_solaire" },
    ingredients: { panneau_solaire: 1, branche: 3 },
    qualites: { visser: 1 },
    duree: 30,
    intensite: "legere",
    famille: "voltaiques",
  },
];
