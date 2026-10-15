// Contrôle des messages du client (0.1.1, revue de sécurité) : un client modifié peut envoyer n'importe quoi.
// Avant d'atteindre la logique du jeu, chaque message est vérifié : un type connu, des nombres finis, de vrais objets
// (pas « toString »), des chaînes courtes. Ce qui ne passe pas est ignoré sans bruit (un client honnête n'envoie
// jamais ça). Les règles du jeu restent vérifiées plus loin (portée, inventaire, prix…).

import { estCleObjet, estObjet } from "../../commun/src/objets.ts";
import type { MessageClient } from "../../commun/src/messages.ts";
import { estOperationAdmin } from "../../commun/src/admin.ts";

type Champs = Record<string, unknown>;

const estTable = (v: unknown): v is Champs => typeof v === "object" && v !== null && !Array.isArray(v);
const nombre = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const nombreOuRien = (v: unknown) => v === undefined || nombre(v);
const chaine = (v: unknown, max = 64): v is string => typeof v === "string" && v.length <= max;
const booleen = (v: unknown): v is boolean => typeof v === "boolean";
/** Une quantité : un nombre fini, raisonnable (les règles du jeu vérifient le reste). */
const quantite = (v: unknown) => nombre(v) && v >= 0 && v <= 1e6;

/**
 * Les cibles qui se désignent par leur nom (le reste, par un numéro) : une porte, un leurre ; 0.10, chantier K : ce qu'on
 * touche au phare (l'escabeau, l'escalier, la cuve…).
 */
const CIBLES_NOMMEES = new Set(["porte", "leurre", "lieu", "phare"]);

/** Les gestes d'aménagement du Book 24 (améliorer, démonter, creuser, accessoires, couvrir). */
const VERBES_AMENAGEMENT = new Set(["ameliorer", "redescendre", "demonter_installation", "creuser_dakota", "combler", "monter_broche", "monter_marmite", "couvrir", "ranimer"]);

function offreValide(o: unknown): boolean {
  if (!estTable(o) || !nombre(o.wotts) || o.wotts < 0 || !estTable(o.objets)) return false;
  // Un exemplaire étoilé s'échange aussi (Book 25 §4.2, 0.6).
  return Object.entries(o.objets).every(([type, n]) => estCleObjet(type) &&Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 1e6);
}

function operationComptoirValide(op: unknown): boolean {
  if (!estTable(op)) return false;
  switch (op.genre) {
    case "vendre":
    case "acheter":
      // Un exemplaire étoilé aussi (Book 25 §4.2, 0.6), sous sa forme canonique.
      return estCleObjet(op.objet) && quantite(op.quantite);
    case "deposer":
    case "retirer":
      return op.batterie === "petite_batterie" || op.batterie === "batterie_voiture";
    case "verser":
    case "tirer":
      return nombre(op.montant) && op.montant >= 0;
    default:
      return false;
  }
}

function operationEchangeValide(op: unknown): boolean {
  if (!estTable(op)) return false;
  switch (op.genre) {
    case "proposer":
      return nombre(op.a);
    case "repondre":
      return booleen(op.accepte);
    case "offrir":
      return offreValide(op.offre);
    case "accord":
      return booleen(op.oui);
    case "annuler":
      return true;
    default:
      return false;
  }
}

/** La leçon (Book 25 §2.3) : un joueur désigné par son numéro, une recette par son identifiant (chaîne courte). */
function operationLeconValide(op: unknown): boolean {
  if (!estTable(op)) return false;
  switch (op.genre) {
    case "choisir":
      return nombre(op.a);
    case "proposer":
      return nombre(op.a) && chaine(op.recette);
    case "repondre":
      return booleen(op.accepte);
    case "annuler":
      return true;
    default:
      return false;
  }
}

/** La couche de déchets (0.7) : un carreau et une pièce par leurs numéros, un conteneur ou un point par une référence courte. */
function operationDechetsValide(op: unknown): boolean {
  if (!estTable(op)) return false;
  const entier = (v: unknown) => Number.isInteger(v) && Math.abs(v as number) <= 10_000;
  switch (op.genre) {
    case "ramasser":
      return entier(op.cx) && entier(op.cz) && entier(op.i);
    case "fouiller":
    case "demonter":
      return chaine(op.ref, 40);
    case "prendre":
      return chaine(op.ref, 40) && entier(op.i);
    case "fermer":
      return true;
    default:
      return false;
  }
}

/** Le message a-t-il la forme attendue ? (Sinon on l'ignore.) */
export function messageValide(m: unknown): m is MessageClient {
  if (!estTable(m) || typeof m.t !== "string") return false;
  switch (m.t) {
    case "intention":
      return nombre(m.dx) && nombre(m.dz) && nombre(m.seq) && chaine(m.allure);
    case "ping":
      return nombre(m.envoye);
    case "interagir":
      if (
        !(
          estTable(m.cible) &&
          chaine(m.cible.genre) &&
          // Une porte se désigne par son nom dans le plan ; tout le reste, par un numéro.
          (CIBLES_NOMMEES.has(m.cible.genre) ? chaine(m.cible.id) && m.cible.id.length <= 40 : nombreOuRien(m.cible.id)) &&
          chaine(m.verbe)
        )
      )
        return false;
      // Améliorer sa base (Book 24) : ces gestes ne visent qu'un feu ou une installation, désignés par leur numéro.
      if (VERBES_AMENAGEMENT.has(m.verbe)) return (m.cible.genre === "feu" || m.cible.genre === "installation") && Number.isInteger(m.cible.id);
      // Les gestes de la mécanique (Book 25 §6, 0.6) : un piège à réarmer, un accessoire du pédalier, sur une installation.
      if (m.verbe === "rearmer_piege" || m.verbe === "monter_soufflet" || m.verbe === "monter_meule_fine") return m.cible.genre === "installation" && Number.isInteger(m.cible.id);
      // La pièce de famille montée sur son meuble (plan 0.8, chantier 7) : le panneau, l'alternateur.
      if (m.verbe === "poser_panneau" || m.verbe === "monter_alternateur") return m.cible.genre === "installation" && Number.isInteger(m.cible.id);
      // Prendre la radio (0.5.1) : seulement elle.
      if (m.verbe === "prendre_radio") return m.cible.genre === "leurre" && m.cible.id === "radio";
      return true;
    case "manger":
      return estObjet(m.objet);
    case "construire_feu":
      return nombre(m.x) && nombre(m.z) && (m.dakota === undefined || booleen(m.dakota));
    case "fabriquer":
      return chaine(m.recette) && nombreOuRien(m.x) && nombreOuRien(m.z) && nombreOuRien(m.o);
    case "lumiere":
      return booleen(m.allumee);
    case "voyager":
      return chaine(m.vers);
    case "frapper":
      return booleen(m.appuye);
    case "esquiver":
      return nombre(m.dx) && nombre(m.dz);
    case "pause":
      return booleen(m.oui);
    // Le premier geste après l'arrivée (0.8.2, chantier G) : rien à vérifier.
    case "arrivee":
      return true;
    case "reparer":
      return estCleObjet(m.objet) && booleen(m.fortune);
    // Reprendre une arme sur son meuble (plan 0.8, chantier 9).
    case "reprendre_arme":
      return estCleObjet(m.objet) && (m.geste === "reparer" || m.geste === "monter");
    case "comptoir":
      return operationComptoirValide(m.op);
    case "echange":
      return operationEchangeValide(m.op);
    case "lecon":
      return operationLeconValide(m.op);
    case "lire":
      return estObjet(m.objet);
    case "dechets":
      return operationDechetsValide(m.op);
    // L'arbre de progression (0.7) : les cartes que le client a montrées, une liste courte d'identifiants courts.
    case "recettes_vues":
      return Array.isArray(m.recettes) && m.recettes.length <= 200 && m.recettes.every((r) => chaine(r));
    // Le compte admin : la forme seulement ; que ce soit bien l'admin, le joueur le vérifie à chaque fois (base).
    case "admin":
      return estOperationAdmin(m.op);
    case "coffre":
      return nombre(m.id) && (m.sens === "deposer" || m.sens === "prendre") && estCleObjet(m.objet) && quantite(m.quantite);
    case "jeter":
      return estCleObjet(m.objet) && quantite(m.quantite);
    case "equiper":
      return m.objet === null || estCleObjet(m.objet);
    case "demonter":
      return estObjet(m.objet);
    case "mesures":
      return nombre(m.ips) && nombre(m.ipsBas) && chaine(m.appareil, 200) && chaine(m.qualite);
    // Les constats de l'interface (plan 0.8, chantier 14) : la fiche bloquée (un type court), l'aide « Je suis coincé ».
    case "constat":
      return (m.quoi === "fiche_bloquee" || m.quoi === "aide_coince") && (m.construction === undefined || chaine(m.construction, 40));
    // Le lancer et le tir (0.6) : une direction finie, une cible désignée par son numéro, une distance raisonnable.
    case "preparer":
      return m.objet === null || estCleObjet(m.objet);
    case "lancer":
      return nombre(m.dx) && nombre(m.dz) && (m.cible === undefined || Number.isInteger(m.cible)) && (m.distance === undefined || (nombre(m.distance) && m.distance >= 0 && m.distance <= 100));
    // Le banc de recharge (0.8.2, chantier C) : un banc par son numéro ; charger une batterie ou une arme (sa clé),
    // échanger, tourner la manivelle (elle remplit la batterie du banc).
    case "banc":
      return Number.isInteger(m.id) && (m.op === "echanger" || m.op === "manivelle" || (m.op === "charger" && estCleObjet(m.cible)));
    // Le gué (plan 0.8, chantier 11) : haler le bac, sonner la cloche du passeur.
    case "gue":
      return m.op === "haler" || m.op === "cloche";
    // Le péage des survivants (plan 0.10 §3.6, chantier H) : le passage, et des objets comme dans une offre d'échange.
    case "payer_passage":
      return (m.passage === "pont" || m.passage === "tunnel") && estTable(m.objets) && Object.entries(m.objets).length <= 200 && Object.entries(m.objets).every(([cle, n]) => estCleObjet(cle) && Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 1e6);
    case "bander":
    case "rearmer":
    case "boire":
    case "boire_bouteille":
    case "annuler":
    case "poser":
    case "poser_radio":
    case "degager":
    case "repousser":
    case "panser":
    case "tutoriel_passer":
      return true;
    default:
      return false;
  }
}
