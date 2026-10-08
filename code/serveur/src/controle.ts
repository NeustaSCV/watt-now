// Contrôle des messages du client (0.1.1, revue de sécurité) : un client modifié peut envoyer n'importe quoi.
// Avant d'atteindre la logique du jeu, chaque message est vérifié : un type connu, des nombres finis, de vrais objets
// (pas « toString »), des chaînes courtes. Ce qui ne passe pas est ignoré sans bruit (un client honnête n'envoie
// jamais ça). Les règles du jeu restent vérifiées plus loin (portée, inventaire, prix…).

import { estObjet } from "../../commun/src/objets.ts";
import type { MessageClient } from "../../commun/src/messages.ts";

type Champs = Record<string, unknown>;

const estTable = (v: unknown): v is Champs => typeof v === "object" && v !== null && !Array.isArray(v);
const nombre = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const nombreOuRien = (v: unknown) => v === undefined || nombre(v);
const chaine = (v: unknown, max = 64): v is string => typeof v === "string" && v.length <= max;
const booleen = (v: unknown): v is boolean => typeof v === "boolean";
/** Une quantité : un nombre fini, raisonnable (les règles du jeu vérifient le reste). */
const quantite = (v: unknown) => nombre(v) && v >= 0 && v <= 1e6;

function offreValide(o: unknown): boolean {
  if (!estTable(o) || !nombre(o.wotts) || o.wotts < 0 || !estTable(o.objets)) return false;
  return Object.entries(o.objets).every(([type, n]) => estObjet(type) && Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 1e6);
}

function operationComptoirValide(op: unknown): boolean {
  if (!estTable(op)) return false;
  switch (op.genre) {
    case "vendre":
    case "acheter":
      return estObjet(op.objet) && quantite(op.quantite);
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

/** Le message a-t-il la forme attendue ? (Sinon on l'ignore.) */
export function messageValide(m: unknown): m is MessageClient {
  if (!estTable(m) || typeof m.t !== "string") return false;
  switch (m.t) {
    case "intention":
      return nombre(m.dx) && nombre(m.dz) && nombre(m.seq) && chaine(m.allure);
    case "ping":
      return nombre(m.envoye);
    case "interagir":
      return estTable(m.cible) && chaine(m.cible.genre) && nombreOuRien(m.cible.id) && chaine(m.verbe);
    case "manger":
      return estObjet(m.objet);
    case "construire_feu":
      return nombre(m.x) && nombre(m.z);
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
    case "comptoir":
      return operationComptoirValide(m.op);
    case "echange":
      return operationEchangeValide(m.op);
    case "coffre":
      return nombre(m.id) && (m.sens === "deposer" || m.sens === "prendre") && estObjet(m.objet) && quantite(m.quantite);
    case "jeter":
      return estObjet(m.objet) && quantite(m.quantite);
    case "mesures":
      return nombre(m.ips) && nombre(m.ipsBas) && chaine(m.appareil, 200) && chaine(m.qualite);
    case "boire":
    case "annuler":
    case "poser":
    case "degager":
    case "panser":
    case "tutoriel_passer":
      return true;
    default:
      return false;
  }
}
