// Point d'entrée du serveur de jeu.

import { mkdirSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PORT_ADMIN, demarrerAdminWeb, type AdminWebDemarre } from "./admin-web.ts";
import { adresseClient } from "./adresse-client.ts";
import { journal } from "./journal.ts";
import { demarrerServeur } from "./serveur.ts";

const ici = dirname(fileURLToPath(import.meta.url));
const racine = join(ici, "..", "..");
const dossierDonnees = join(racine, "serveur", "donnees");
mkdirSync(dossierDonnees, { recursive: true });

const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? (production ? 8080 : 8787));
// En production sur le VPS (deploiement/prod/compose.yaml) : le jeu n'est joignable que par Traefik.
const derriereProxy = process.env.WATT_PROXY === "1";
// Combien de sauvegardes quotidiennes garder, sans hebdomadaire (VPS : 5) ; sans la variable, comme sur le Pi.
const garderQuotidiennes = Number(process.env.WATT_SAUVEGARDES_GARDER);

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
  garderSauvegardes: garderQuotidiennes > 0 ? { quotidiennes: garderQuotidiennes, hebdomadaires: 0 } : undefined,
  derriereProxy,
});

journal(`Serveur de jeu prêt sur le port ${serveur.port}${production ? " (production)" : ""}`);
if (production) {
  for (const adresses of Object.values(networkInterfaces())) {
    for (const a of adresses ?? []) {
      if (a.family === "IPv4" && !a.internal) journal(`  → http://${a.address}:${serveur.port}`);
    }
  }
}

// La page d'administration (P-014) : un second serveur web, sur son seul port (4321, réglable : WATT_ADMIN_PORT).
// Sur le Pi : sans mot de passe ni liste d'adresses (0.8.1), ce port n'est jamais publié sur la box. En production
// (WATT_ADMIN_CONNEXION=/admin) : sous ce chemin derrière Traefik, avec identifiant, mot de passe et code à usage
// unique (admin-connexion.ts). S'il ne peut pas s'ouvrir (port pris), le jeu tourne quand même.
const portAdmin = Number(process.env.WATT_ADMIN_PORT ?? PORT_ADMIN);
const cheminAdmin = process.env.WATT_ADMIN_CONNEXION;
let admin: AdminWebDemarre | null = null;
try {
  admin = await demarrerAdminWeb({
    port: portAdmin,
    hote: process.env.WATT_ADMIN_HOTE,
    base: serveur.base,
    monde: serveur.monde,
    adresseDe: (req) => adresseClient(req, derriereProxy),
    connexion: cheminAdmin ? { prefixe: cheminAdmin, cookieSecurise: true } : undefined,
  });
  journal(
    cheminAdmin
      ? `Page d'administration sur le port ${admin.port}, sous ${cheminAdmin}, connexion obligatoire${serveur.base.identifiantAdminWeb() ? "" : " (aucun compte : lancer admin-prod.sh)"}`
      : `Page d'administration sur le port ${admin.port} (à ne jamais publier sur la box)`,
  );
} catch (erreur) {
  journal(`⚠ Page d'administration : impossible d'ouvrir le port ${portAdmin} (${String(erreur)}) ; le jeu tourne sans elle.`);
}

let arretEnCours = false;
async function arreter(signal: string): Promise<void> {
  if (arretEnCours) return;
  arretEnCours = true;
  journal(`${signal} reçu : sauvegarde et arrêt`);
  await admin?.fermer();
  await serveur.fermer();
  process.exit(0);
}
process.on("SIGINT", () => void arreter("SIGINT"));
process.on("SIGTERM", () => void arreter("SIGTERM"));
