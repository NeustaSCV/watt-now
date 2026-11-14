// Configuration de l'empaquetage du rendu du jeu (voir preparer.sh).
import { fileURLToPath } from "node:url";
const ici = (p) => fileURLToPath(new URL(p, import.meta.url));
export default {
  input: ici("./rendu-jeu.ts"),
  resolve: { alias: { three: ici("../../code/node_modules/three") } },
  output: { file: ici("../vendor/rendu-jeu.js"), format: "esm", minify: true },
};
