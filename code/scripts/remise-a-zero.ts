// Remettre le monde à zéro en production (deployer-prod.sh --remise-a-zero, demande du porteur du 2026-10-16) : avant
// l'ouverture au public, on repart d'une base neuve. Tous les comptes de jeu, les personnages, les terrains et le début
// du monde repartent de zéro. Le compte de la page d'administration (« godfather ») est gardé, avec sa clé : pas
// besoin de refaire l'application d'authentification. Les réglages (reglages.json) et les sauvegardes ne bougent pas.
//
// Rien n'est effacé : l'ancienne base (et ses fichiers -wal, -shm) est rangée dans donnees/avant-remise-<date>/.
// Le jeu doit être ARRÊTÉ (deployer-prod.sh l'arrête avant, et le relance après) : sinon il réécrirait par-dessus.
//
// Usage (dans le conteneur, jeu arrêté) :
//   docker compose run --rm --no-deps jeu node --disable-warning=ExperimentalWarning scripts/remise-a-zero.ts

import { existsSync, mkdirSync, renameSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Base } from "../serveur/src/base.ts";

const chemin = process.env.WATT_BASE ?? join(import.meta.dirname, "..", "serveur", "donnees", "watt.sqlite");
const dossier = dirname(chemin);

if (!existsSync(chemin)) {
  console.log(`Pas de base à ${chemin} : le jeu partira d'une base neuve, rien à faire.`);
  process.exit(0);
}

// 1. Ranger l'ancienne base (avec ses fichiers -wal et -shm, sinon elle ne serait plus cohérente).
const date = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const rangement = join(dossier, `avant-remise-${date}`);
mkdirSync(rangement, { recursive: true });
for (const suffixe of ["", "-wal", "-shm"]) {
  if (existsSync(chemin + suffixe)) renameSync(chemin + suffixe, join(rangement, basename(chemin) + suffixe));
}
const ancienne = join(rangement, basename(chemin));
console.log(`✓ Ancienne base rangée dans ${rangement}`);

// 2. La base neuve, et le compte d'administration recopié de l'ancienne (s'il existait).
new Base(chemin).fermer();
const db = new DatabaseSync(chemin);
try {
  db.exec(`ATTACH DATABASE '${ancienne.replaceAll("'", "''")}' AS ancienne`);
  const existe = db.prepare("SELECT 1 FROM ancienne.sqlite_master WHERE type = 'table' AND name = 'admin_web'").get();
  const ligne = existe ? (db.prepare("SELECT identifiant FROM ancienne.admin_web").get() as { identifiant: string } | undefined) : undefined;
  if (ligne) {
    db.exec("INSERT INTO admin_web SELECT * FROM ancienne.admin_web");
    console.log(`✓ Compte d'administration « ${ligne.identifiant} » gardé (même mot de passe, même clé).`);
  } else {
    console.log("⚠ Pas de compte d'administration dans l'ancienne base : le créer avec admin-prod.sh.");
  }
  db.exec("DETACH DATABASE ancienne");
} finally {
  db.close();
}
console.log("✓ Monde remis à zéro : au prochain démarrage, le jeu part d'une base neuve.");
