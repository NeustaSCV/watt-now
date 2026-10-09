// Point d'entrée du serveur de jeu.

import { mkdirSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { journal } from "./journal.ts";
import { demarrerServeur } from "./serveur.ts";

const ici = dirname(fileURLToPath(import.meta.url));
const racine = join(ici, "..", "..");
const dossierDonnees = join(racine, "serveur", "donnees");
mkdirSync(dossierDonnees, { recursive: true });

const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? (production ? 8080 : 8787));

const serveur = await demarrerServeur({
  port,
  cheminBase: process.env.WATT_BASE ?? join(dossierDonnees, "watt.sqlite"),
  cheminReglages: process.env.WATT_REGLAGES ?? join(dossierDonnees, "reglages.json"),
  // Les sauvegardes quotidiennes : en production seulement (en développement, la base est jetable).
  // HTTPS si le certificat est là (déposé dans donnees/certificat/, ou ailleurs avec WATT_CERT et WATT_CLE).
  certificat: {
    cert: process.env.WATT_CERT ?? join(dossierDonnees, "certificat", "fullchain.pem"),
    cle: process.env.WATT_CLE ?? join(dossierDonnees, "certificat", "privkey.pem"),
  },
  dossierSauvegardes: production ? (process.env.WATT_SAUVEGARDES ?? join(dossierDonnees, "sauvegardes")) : undefined,
  // La copie des sauvegardes sur la clé USB du Pi (compose.yaml) ; sans la variable, pas de copie.
  dossierCle: process.env.WATT_CLE_USB || undefined,
  dossierClient: production ? join(racine, "client", "dist") : undefined,
});

journal(`Serveur de jeu prêt sur le port ${serveur.port}${production ? " (production)" : ""}`);
if (production) {
  for (const adresses of Object.values(networkInterfaces())) {
    for (const a of adresses ?? []) {
      if (a.family === "IPv4" && !a.internal) journal(`  → http://${a.address}:${serveur.port}`);
    }
  }
}

let arretEnCours = false;
async function arreter(signal: string): Promise<void> {
  if (arretEnCours) return;
  arretEnCours = true;
  journal(`${signal} reçu : sauvegarde et arrêt`);
  await serveur.fermer();
  process.exit(0);
}
process.on("SIGINT", () => void arreter("SIGINT"));
process.on("SIGTERM", () => void arreter("SIGTERM"));
