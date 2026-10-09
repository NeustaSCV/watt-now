// Le compte admin « god » (outil du porteur du projet, 0.7) : le crée (ou l'écrase), le désigne admin, monte son
// terrain de toutes les constructions et remplit ses coffres de tout le catalogue. Un seul admin : en désigner un
// autre retire l'ancien. Le mot de passe se tape au clavier, sans écho (jamais en argument ni dans un fichier).
//
// Usage :
//   npm run admin -- god                 crée god (ou l'écrase s'il existe : nouveau mot de passe, personnage neuf)
//   npm run admin -- god --remplir       re-remplit seulement ses coffres (rien d'autre ne change)
//   npm run admin -- god --famille voltaiques   (à la création ou à l'écrasement ; sinon charbonniers / la sienne)
// Dans le conteneur du Pi :
//   docker exec -it watt-now node --disable-warning=ExperimentalWarning scripts/admin.ts god
// La base : WATT_BASE, sinon serveur/donnees/watt.sqlite. Mieux vaut que god soit déconnecté pendant la commande
// (connecté, son personnage en mémoire réécrirait par-dessus) ; en jeu, ⚙ → « Remplir mes coffres » fait la même chose.

import { join } from "node:path";
import { Base } from "../serveur/src/base.ts";
import { PSEUDO_ADMIN } from "../commun/src/admin.ts";
import { poidsContenuAdmin, preparerGod, remplirCoffres } from "../serveur/src/admin.ts";
import { MOT_DE_PASSE_MIN, estFamille, type Famille } from "../commun/src/regles.ts";

function arreter(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

/** Lit une ligne au clavier sans l'afficher (une étoile par caractère). Ctrl-C annule. */
function lireSecret(invite: string): Promise<string> {
  const entree = process.stdin;
  if (!entree.isTTY) arreter("Il faut un terminal pour taper le mot de passe (avec docker : « docker exec -it »).");
  process.stdout.write(invite);
  entree.setRawMode(true);
  entree.resume();
  entree.setEncoding("utf8");
  return new Promise((resoudre) => {
    let saisi = "";
    const finir = () => {
      entree.setRawMode(false);
      entree.pause();
      entree.removeListener("data", lire);
      process.stdout.write("\n");
    };
    const lire = (morceau: string) => {
      for (const c of morceau) {
        if (c === "\u0003") {
          finir();
          arreter("Annulé.");
        } else if (c === "\r" || c === "\n" || c === "\u0004") {
          finir();
          return resoudre(saisi);
        } else if (c === "\u007f" || c === "\b") {
          if (saisi.length > 0) {
            saisi = saisi.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else if (c >= " ") {
          saisi += c;
          process.stdout.write("*");
        }
      }
    };
    entree.on("data", lire);
  });
}

const args = process.argv.slice(2);
const pseudo = args.find((a) => !a.startsWith("--"));
if (pseudo?.toLowerCase() !== PSEUDO_ADMIN) arreter(`Usage : npm run admin -- ${PSEUDO_ADMIN} [--remplir] [--famille charbonniers|voltaiques|mecanistes]`);
const seulementRemplir = args.includes("--remplir");
const iFamille = args.indexOf("--famille");
let famille: Famille | undefined;
if (iFamille >= 0) {
  const f = args[iFamille + 1];
  if (!estFamille(f)) arreter("Famille inconnue : charbonniers, voltaiques ou mecanistes.");
  famille = f;
}

const chemin = process.env.WATT_BASE ?? join(import.meta.dirname, "..", "serveur", "donnees", "watt.sqlite");
const base = new Base(chemin);
console.log(`Base : ${chemin}`);

if (seulementRemplir) {
  const compte = base.compteParPseudo(PSEUDO_ADMIN);
  if (!compte || !base.estAdmin(compte.id)) arreter(`Pas de compte admin « ${PSEUDO_ADMIN} » : lance d'abord « npm run admin -- ${PSEUDO_ADMIN} ».`);
  const { coffres, sansPlace } = remplirCoffres(base, compte.id);
  console.log(`✓ ${coffres} coffres remplis (≈ ${poidsContenuAdmin()} kg)${sansPlace ? " ; plus de place pour en poser d'autres" : ""}.`);
  base.fermer();
  process.exit(0);
}

const existant = base.compteParPseudo(PSEUDO_ADMIN);
if (existant) console.log(`Compte « ${existant.pseudo} » existant : il sera écrasé (nouveau mot de passe, personnage neuf).`);
const motDePasse = await lireSecret(`Mot de passe de ${PSEUDO_ADMIN} : `);
if (motDePasse.length < MOT_DE_PASSE_MIN) arreter(`Au moins ${MOT_DE_PASSE_MIN} caractères.`);
const encore = await lireSecret("Encore une fois : ");
if (encore !== motDePasse) arreter("Les deux saisies ne sont pas pareilles : rien n'a changé.");

const r = preparerGod(base, motDePasse, famille);
const t = r.terrain;
console.log(r.ecrase ? `✓ Compte ${PSEUDO_ADMIN} existant : écrasé.` : `✓ Compte ${PSEUDO_ADMIN} créé.`);
console.log(`✓ ${PSEUDO_ADMIN} est l'admin (famille : ${r.compte.famille}).`);
console.log(`✓ Terrain : ${t.installations} constructions et ${t.feux} foyers posés, ${t.coffres} coffres remplis (≈ ${poidsContenuAdmin()} kg).`);
if (t.sansPlace.length > 0) console.log(`⚠ Sans place : ${t.sansPlace.join(", ")}.`);
base.fermer();
