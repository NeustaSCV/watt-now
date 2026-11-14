// Le catalogue de la banque de bâtiments urbex. Chaque bâtiment est un dossier `batiment/<id>/` avec un `modele.js`
// qui exporte `FICHE` (les données de jeu et de récit) et `creer({ usure, carte })` (le modèle 3D, un THREE.Group).
// Voir README.md. Un bâtiment sans dossier s'affiche « En préparation » dans la visionneuse.

export const CATALOGUE = [
  { id: "villa-milliardaire", nom: "La villa du milliardaire", statut: "à valider" },
  { id: "chateau", nom: "Le château abandonné", statut: "à valider" },
  { id: "hopital", nom: "L'hôpital pavillonnaire", statut: "à valider" },
  { id: "centrale-thermique", nom: "La centrale thermique", statut: "à valider" },
  // Vague 2
  { id: "gare", nom: "La gare à verrière", statut: "à valider" },
  { id: "siege-compagnie", nom: "Le siège de la Compagnie", statut: "à valider" },
  { id: "theatre", nom: "Le théâtre à l'italienne", statut: "à valider" },
  { id: "grand-hotel", nom: "Le Grand Hôtel des Flots", statut: "à valider" },
  { id: "eglise", nom: "L'église du bourg", statut: "à valider" },
  { id: "mine", nom: "Le chevalement de la mine", statut: "à valider" },
  // Vague 3
  { id: "sanatorium", nom: "Le sanatorium d'altitude", statut: "à valider" },
  { id: "mediatheque", nom: "La médiathèque à coupole", statut: "à valider" },
  { id: "acierie", nom: "L'aciérie et son haut fourneau", statut: "à valider" },
  { id: "phare", nom: "Le phare", statut: "à valider" },
  { id: "galerie-abondance", nom: "La Galerie de l'Abondance", statut: "à valider" },
  { id: "parc-attractions", nom: "Le parc d'attractions", statut: "à valider" },
  // Vague 4
  { id: "usine-chimique", nom: "L'usine chimique", statut: "à valider" },
  { id: "chateau-eau", nom: "Le château d'eau", statut: "à valider" },
  { id: "moulin", nom: "Le moulin à eau", statut: "à valider" },
  { id: "sanatorium-marin", nom: "Le sanatorium marin", statut: "à valider" },
  { id: "piscine-art-deco", nom: "La piscine Art déco", statut: "à valider" },
  // Les haltes (Book 01 §2 bis, Book 20 §4) : des maps à traverser, en tronçons. Vague 1
  { id: "halte-aire-autoroute", nom: "Halte · L'aire d'autoroute", statut: "à valider", type: "halte" },
  { id: "halte-bois-joli", nom: "Halte · L'aire du Bois-Joli", statut: "à valider", type: "halte" },
  { id: "halte-grand-bouchon", nom: "Halte · Le grand bouchon", statut: "à valider", type: "halte" },
  { id: "halte-tunnel", nom: "Halte · Le tunnel", statut: "à valider", type: "halte" },
  // Haltes, vague 2
  { id: "halte-peage", nom: "Halte · Le péage", statut: "à valider", type: "halte" },
  { id: "halte-col", nom: "Halte · Le col", statut: "à valider", type: "halte" },
  { id: "halte-passage-niveau", nom: "Halte · Le passage à niveau", statut: "à valider", type: "halte" },
  { id: "halte-avenue-barricadee", nom: "Halte · L'avenue barricadée", statut: "à valider", type: "halte" },
  { id: "halte-route-pont", nom: "Halte · La route du pont", statut: "à valider", type: "halte" },
  { id: "halte-corniche", nom: "Halte · La corniche", statut: "à valider", type: "halte" },
  { id: "halte-digue", nom: "Halte · La digue", statut: "à valider", type: "halte" },
  { id: "halte-gue", nom: "Halte · Le gué", statut: "à valider", type: "halte" },
  { id: "halte-carrefour", nom: "Halte · Le carrefour", statut: "à valider", type: "halte" },
  { id: "halte-superchargeurs", nom: "Halte · Les Superchargeurs Watty", statut: "à valider", type: "halte" },
];
