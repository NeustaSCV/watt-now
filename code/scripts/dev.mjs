// Lance le serveur de jeu (rechargé à chaque modification) et le client Vite, ensemble.
// Ctrl+C arrête les deux. Rien ne s'exécute hors du dossier du projet.

import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";

const racine = fileURLToPath(new URL("..", import.meta.url));
const enfants = [];

function lancer(nom, commande, args) {
  const enfant = spawn(commande, args, { cwd: racine, stdio: ["ignore", "pipe", "pipe"], env: process.env });
  const prefixer = (flux, sortie) =>
    flux.on("data", (d) => {
      for (const ligne of String(d).split("\n")) if (ligne.trim()) sortie.write(`[${nom}] ${ligne}\n`);
    });
  prefixer(enfant.stdout, process.stdout);
  prefixer(enfant.stderr, process.stderr);
  enfant.on("exit", (code) => {
    if (code) console.error(`[${nom}] arrêté (code ${code})`);
  });
  enfants.push(enfant);
}

lancer("serveur", process.execPath, ["--watch", "--disable-warning=ExperimentalWarning", "serveur/src/index.ts"]);
lancer("client", process.execPath, ["node_modules/vite/bin/vite.js", "--config", "client/vite.config.ts"]);

const protocole = process.env.WATT_HTTPS === "1" ? "https" : "http";
const adresses = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4" && !a.internal && !a.address.startsWith("10.61."))
  .map((a) => `${protocole}://${a.address}:5173`);
console.log(`\nWatt Now? — sur ce Mac : ${protocole}://localhost:5173`);
for (const a of adresses) console.log(`            sur l'iPhone (même Wi-Fi) : ${a}`);
if (protocole === "https") {
  console.log("            (certificat de développement : Safari affiche un avertissement, touche « Afficher les détails » puis « visiter ce site web »)");
}
console.log("");

const arreter = () => {
  for (const e of enfants) e.kill("SIGINT");
  setTimeout(() => process.exit(0), 300);
};
process.on("SIGINT", arreter);
process.on("SIGTERM", arreter);
