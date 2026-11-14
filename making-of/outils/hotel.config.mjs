// L'hôtel des Flots à part (batiment/grand-hotel/, lu sans être modifié), sans three.js : la page lui donne celui de
// vendor/rendu-jeu.js par une carte d'import (vendor/three.js). Ainsi on suit le modèle de l'hôtel sans réempaqueter
// le rendu du jeu (dont le code évolue d'une version à l'autre).
import { fileURLToPath } from "node:url";
const ici = (p) => fileURLToPath(new URL(p, import.meta.url));
export default {
  input: ici("../../batiment/grand-hotel/modele.js"),
  external: ["three"],
  output: { file: ici("../vendor/hotel.js"), format: "esm", minify: true },
};
