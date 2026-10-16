// Le compte de la page d'administration en production (« godfather », décision du porteur du 2026-10-16) : le crée,
// ou le remplace (nouveau mot de passe, nouveau secret). Ce n'est pas un compte de jeu : il n'a pas de personnage et
// ne sert qu'à se connecter à https://jeu.example.org/admin.
//
// Le mot de passe se tape au clavier, sans écho. Puis la commande affiche UNE SEULE FOIS la clé de configuration du
// code à usage unique, à saisir dans l'application d'authentification du téléphone (« Ajouter un compte » → « Saisir
// une clé ») ; on tape ensuite le code à 6 chiffres que l'application affiche, pour vérifier : rien n'est enregistré
// tant que ce code n'est pas bon.
//
// Usage (dans le conteneur, par code/deploiement/admin-prod.sh) :
//   docker exec -it watt-now node --disable-warning=ExperimentalWarning scripts/admin-web.ts godfather
// La base : WATT_BASE, sinon serveur/donnees/watt.sqlite.

import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { Base } from "../serveur/src/base.ts";
import { lienOtpauth, nouveauSecretTotp, verifierTotp } from "../serveur/src/totp.ts";
import { arreter, lireSecret } from "./clavier.ts";

/** Plus long que pour un joueur : la page est sur Internet. */
const MOT_DE_PASSE_MIN = 12;
const ESSAIS_CODE = 3;

const identifiant = process.argv[2]?.trim() ?? "";
if (!/^[a-z0-9_-]{3,32}$/i.test(identifiant)) arreter("Usage : node scripts/admin-web.ts <identifiant>   (par exemple : godfather)");

const chemin = process.env.WATT_BASE ?? join(import.meta.dirname, "..", "serveur", "donnees", "watt.sqlite");
const base = new Base(chemin);
console.log(`Base : ${chemin}`);
const existant = base.identifiantAdminWeb();
if (existant) console.log(`Le compte d'administration « ${existant} » existe : il sera remplacé (nouveau mot de passe, nouvelle clé).`);

const motDePasse = await lireSecret(`Mot de passe de ${identifiant} (au moins ${MOT_DE_PASSE_MIN} caractères) : `);
if (motDePasse.length < MOT_DE_PASSE_MIN) arreter(`Au moins ${MOT_DE_PASSE_MIN} caractères : rien n'a changé.`);
const encore = await lireSecret("Encore une fois : ");
if (encore !== motDePasse) arreter("Les deux saisies ne sont pas pareilles : rien n'a changé.");

const secret = nouveauSecretTotp();
console.log(`
Dans l'application d'authentification du téléphone : « Ajouter un compte » → « Saisir une clé de configuration ».
  Nom du compte : Watt Now (${identifiant})
  Clé           : ${secret.match(/.{1,4}/g)!.join(" ")}
  Type          : basé sur l'heure (TOTP), 6 chiffres, 30 secondes
Ou ce lien, si l'application sait l'ouvrir :
  ${lienOtpauth(identifiant, secret)}
Cette clé ne sera plus jamais affichée.
`);

const clavier = createInterface({ input: process.stdin, output: process.stdout });
let bon = false;
for (let essai = 1; essai <= ESSAIS_CODE && !bon; essai++) {
  const code = await clavier.question("Le code à 6 chiffres affiché par l'application : ");
  bon = verifierTotp(secret, code, Date.now()) !== null;
  if (!bon) console.log(essai < ESSAIS_CODE ? "✗ Ce code ne correspond pas (l'heure du téléphone est-elle juste ?). Encore :" : "");
}
clavier.close();
if (!bon) arreter("Code jamais bon : rien n'a changé. Relancer la commande (une nouvelle clé sera tirée).");

base.definirAdminWeb(identifiant, motDePasse, secret);
base.fermer();
console.log(`✓ Compte d'administration « ${identifiant} » ${existant ? "remplacé" : "créé"}. Les sessions déjà ouvertes restent valables jusqu'à leur fin (au plus 8 h) ; « docker compose restart » les ferme toutes.`);
process.exit(0);
