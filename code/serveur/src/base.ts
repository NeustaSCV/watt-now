// Base de données SQLite (Book 17 §3) : comptes, jetons, personnages, inventaires, terrains, feux.
// Serveur sans état caché : tout ce qui doit survivre à un redémarrage est ici.

import type { Mesure } from "./mesures.ts";
import type { SacVu } from "../../commun/src/messages.ts";
import { apparenceAncienne, apparenceValide, type Apparence } from "../../commun/src/apparence.ts";
import { DatabaseSync } from "node:sqlite";
import type { Position } from "../../commun/src/deplacement.ts";
import { estCleObjet, estObjet, kitDeDepart, type Inventaire } from "../../commun/src/objets.ts";
import { canoniser, cleExemplaire, lireCle, type CleObjet } from "../../commun/src/etoiles.ts";
import { POINT_ARRIVEE, type Famille } from "../../commun/src/regles.ts";
import { savoirValide, type Savoir } from "../../commun/src/savoir.ts";
import { sechageValide, type EtatSechage } from "../../commun/src/arc.ts";
import { PROGRESSION_VIDE, devoileesAuDepart, devoileesDEmblee, progressionValide, type EtatProgression } from "../../commun/src/progression.ts";
import { BESOINS_DEPART, GOURDE_DEPART, type Besoins, type EtatFeu, type Gourde } from "../../commun/src/survie.ts";
import type { Charges } from "../../commun/src/energie.ts";
import { SANTE_DEPART, type Sante } from "../../commun/src/combat.ts";
import type { Wotts } from "../../commun/src/economie.ts";
import { TUTORIEL_NEUF, type EtatTutoriel } from "../../commun/src/tutoriel.ts";
import type { EtatQuetes } from "../../commun/src/quetes.ts";
import { estArme } from "../../commun/src/combat.ts";
import type { EtatInstallation, InstallationVue } from "../../commun/src/messages.ts";
import type { TypeInstallation } from "../../commun/src/recettes.ts";
import type { AccessoireFeu } from "../../commun/src/lignees.ts";
import { genererEssences, genererJoncs, genererRessources, genererVergerEtSousBois, genererVestiges, type TypeRessource } from "../../commun/src/terrain.ts";
import { VERSION_HALTE, genererHalte } from "../../commun/src/halte.ts";
import type { RessourceSol } from "../../commun/src/terrain.ts";
import { estLieuJouable, type LieuJouable } from "../../commun/src/lieux.ts";
import { empreinteMotDePasse, nouveauJeton, verifierMotDePasse } from "./motdepasse.ts";
import { pseudoReserve } from "../../commun/src/admin.ts";

/** La forme canonique d'une clé lue en base (« lame_forgee#3 » → « lame_forgee »), Book 25 §9.6. */
function cleCanonique(cle: string): string {
  const { type, etoiles } = lireCle(cle);
  return estObjet(type) ? cleExemplaire(type, etoiles ?? undefined) : cle;
}

export interface Compte {
  id: number;
  pseudo: string;
  famille: Famille;
}

export interface Personnage {
  compteId: number;
  famille: Famille;
  lieu: LieuJouable;
  position: Position;
  /** Dernière sauvegarde de la position : le moment où on l'a vu pour la dernière fois (ms). */
  vuLe: number;
  besoins: Besoins;
  gourde: Gourde;
}

export interface RessourceEnBase {
  id: number;
  type: TypeRessource;
  x: number;
  z: number;
  /** Instant réel (ms) à partir duquel la ressource est de nouveau là. 0 : disponible. */
  disponibleLe: number;
}

export interface FeuEnBase extends EtatFeu {
  id: number;
  x: number;
  z: number;
  /** Instant réel (ms) du dernier calcul de combustion. */
  majLe: number;
  /** Les accessoires montés (Book 24 §3.1), avec ce qu'ils ont coûté (pour le démontage). */
  accessoires?: Partial<Record<AccessoireFeu, Inventaire>>;
  /** Ce qui a été payé, niveau après niveau (pour redescendre ou démonter). Absent : le coût de base de sa voie. */
  payes?: Inventaire[];
  /** L'orientation du muret réflecteur (radians), choisie à la maçonnerie. */
  o?: number;
}

export interface ContenuSac {
  inventaire: Inventaire;
  charges: Charges;
  /** Les bons de wotts qu'il avait en poche (valeur au moment de la chute). */
  wotts?: number;
  /** Des objets jetés par terre (et non un sac perdu) : ramassables par tous. */
  jete?: boolean;
}

/** Ce qu'un joueur voit d'un sac au sol : un sac perdu reste fermé, un tas d'objets jetés se voit. */
export function vueDuSac(s: SacEnBase, pour: number): SacVu {
  const v: SacVu = { id: s.id, x: s.x, z: s.z, aMoi: s.proprietaire === pour };
  if (s.contenu.jete) {
    v.jete = true;
    v.contenu = s.contenu.inventaire;
  }
  return v;
}

export interface SacEnBase {
  id: number;
  lieu: string;
  terrainDe: number;
  proprietaire: number;
  x: number;
  z: number;
  contenu: ContenuSac;
  creeLe: number;
}

export class PseudoPris extends Error {
  constructor(message = "Ce pseudo est déjà pris.") {
    super(message);
  }
}

/** Le pseudo admin et ses variantes (commun/src/admin.ts) : jamais par l'inscription. */
export class PseudoReserve extends PseudoPris {
  constructor() {
    super("Ce pseudo est réservé.");
  }
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS comptes (
    id         INTEGER PRIMARY KEY,
    pseudo     TEXT NOT NULL UNIQUE COLLATE NOCASE,
    sel        TEXT NOT NULL,
    empreinte  TEXT NOT NULL,
    cree_le    TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS jetons (
    jeton      TEXT PRIMARY KEY,
    compte_id  INTEGER NOT NULL REFERENCES comptes(id) ON DELETE CASCADE,
    cree_le    TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS personnages (
    compte_id   INTEGER PRIMARY KEY REFERENCES comptes(id) ON DELETE CASCADE,
    famille     TEXT NOT NULL,
    x           REAL NOT NULL,
    z           REAL NOT NULL,
    orientation REAL NOT NULL,
    maj_le      TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS inventaires (
    compte_id  INTEGER NOT NULL REFERENCES comptes(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    quantite   INTEGER NOT NULL,
    PRIMARY KEY (compte_id, type)
  );
  CREATE TABLE IF NOT EXISTS ressources (
    compte_id     INTEGER NOT NULL REFERENCES comptes(id) ON DELETE CASCADE,
    id            INTEGER NOT NULL,
    type          TEXT NOT NULL,
    x             REAL NOT NULL,
    z             REAL NOT NULL,
    disponible_le INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (compte_id, id)
  );
  CREATE TABLE IF NOT EXISTS feux (
    compte_id  INTEGER NOT NULL REFERENCES comptes(id) ON DELETE CASCADE,
    id         INTEGER NOT NULL,
    x          REAL NOT NULL,
    z          REAL NOT NULL,
    bois       REAL NOT NULL,
    allume     INTEGER NOT NULL,
    maj_le     INTEGER NOT NULL,
    PRIMARY KEY (compte_id, id)
  );
  CREATE TABLE IF NOT EXISTS installations (
    compte_id  INTEGER NOT NULL REFERENCES comptes(id) ON DELETE CASCADE,
    id         INTEGER NOT NULL,
    type       TEXT NOT NULL,
    x          REAL NOT NULL,
    z          REAL NOT NULL,
    o          REAL NOT NULL,
    PRIMARY KEY (compte_id, id)
  );
  CREATE TABLE IF NOT EXISTS ressources_lieux (
    lieu          TEXT NOT NULL,
    id            INTEGER NOT NULL,
    type          TEXT NOT NULL,
    x             REAL NOT NULL,
    z             REAL NOT NULL,
    disponible_le INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (lieu, id)
  );
  CREATE TABLE IF NOT EXISTS sacs (
    id          INTEGER PRIMARY KEY,
    lieu        TEXT NOT NULL,
    terrain_de  INTEGER NOT NULL DEFAULT 0,
    proprietaire INTEGER NOT NULL,
    x           REAL NOT NULL,
    z           REAL NOT NULL,
    contenu     TEXT NOT NULL,
    cree_le     INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS instances (
    cle    TEXT PRIMARY KEY,
    etat   TEXT NOT NULL,
    maj_le INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS monde (
    cle    TEXT PRIMARY KEY,
    valeur TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mesures (
    instant    INTEGER NOT NULL,
    compte_id  INTEGER NOT NULL,
    famille    TEXT NOT NULL,
    genre      TEXT NOT NULL,
    quoi       TEXT NOT NULL,
    valeur     REAL NOT NULL,
    details    TEXT
  );
  CREATE INDEX IF NOT EXISTS mesures_genre ON mesures (genre, instant);
  -- La couche de déchets (0.7) : une ligne par carreau entamé (ou par point du monde, « p:velo »), jamais par objet.
  -- Le contenu se recalcule d'une graine ; on ne garde que le remplissage, les pièces prises et le renouvellement.
  CREATE TABLE IF NOT EXISTS dechets (
    lieu          TEXT NOT NULL,
    carreau       TEXT NOT NULL,
    remplissage   INTEGER NOT NULL DEFAULT 0,
    pris          TEXT NOT NULL DEFAULT '[]',
    renouvele_le  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (lieu, carreau)
  );
  -- Le compte admin (outil du porteur, 0.7) : une seule ligne possible (seul = 1), donc un seul admin.
  CREATE TABLE IF NOT EXISTS admin (
    seul       INTEGER PRIMARY KEY CHECK (seul = 1),
    compte_id  INTEGER NOT NULL UNIQUE REFERENCES comptes(id) ON DELETE CASCADE,
    invincible INTEGER NOT NULL DEFAULT 1
  );
`;

/** Colonnes ajoutées après la première version (É0) : ajoutées si elles manquent. */
const COLONNES_AJOUTEES: [table: string, colonne: string, definition: string][] = [
  ["personnages", "kcal", `REAL NOT NULL DEFAULT ${BESOINS_DEPART.kcal}`],
  ["personnages", "eau", `REAL NOT NULL DEFAULT ${BESOINS_DEPART.eau}`],
  ["personnages", "gourde_contenu", `TEXT NOT NULL DEFAULT '${GOURDE_DEPART.contenu}'`],
  ["personnages", "gourde_litres", `REAL NOT NULL DEFAULT ${GOURDE_DEPART.litres}`],
  ["personnages", "equipe", "INTEGER NOT NULL DEFAULT 0"],
  ["personnages", "contenu", "INTEGER NOT NULL DEFAULT 1"],
  ["personnages", "charges", "TEXT NOT NULL DEFAULT '{}'"],
  ["personnages", "charges_maj_le", "INTEGER NOT NULL DEFAULT 0"],
  ["installations", "etat", "TEXT NOT NULL DEFAULT '{}'"],
  ["personnages", "lieu", "TEXT NOT NULL DEFAULT 'terrain'"],
  ["personnages", "sante", "TEXT NOT NULL DEFAULT ''"],
  ["personnages", "endurance", "REAL NOT NULL DEFAULT 100"],
  ["personnages", "repos", "REAL NOT NULL DEFAULT 1"],
  // Les personnages d'avant le tutoriel l'ont « déjà fait » ; les nouveaux le commencent (inscription).
  ["personnages", "tutoriel", "TEXT NOT NULL DEFAULT 'termine'"],
  // Les quêtes après le tutoriel (Book 22), en JSON : faits comptés, quêtes finies, primes en attente.
  ["personnages", "quetes", "TEXT NOT NULL DEFAULT ''"],
  // Ancienne carnation (de 0 à 2 ; −1 : celle de la famille), avant le menu d'apparence.
  ["personnages", "peau", "INTEGER NOT NULL DEFAULT -1"],
  // L'apparence choisie à la création (Book 14 §3), en JSON ; vide : un compte d'avant le menu d'apparence.
  ["personnages", "apparence", "TEXT NOT NULL DEFAULT ''"],
  // L'arme équipée pour le combat (P-005) ; vide : la meilleure du sac.
  ["personnages", "arme", "TEXT NOT NULL DEFAULT ''"],
  // L'usure des armes en main (Book 23 §4.3) : coups qui restent, par type d'arme.
  ["personnages", "usure_armes", "TEXT NOT NULL DEFAULT '{}'"],
  // La charge des armes électriques, par exemplaire (Book 25 §5.4) : Wh qui restent ; absente : pleine.
  ["personnages", "charge_armes", "TEXT NOT NULL DEFAULT '{}'"],
  // Le foyer Dakota (P-002).
  ["feux", "dakota", "INTEGER NOT NULL DEFAULT 0"],
  ["personnages", "watts", "TEXT NOT NULL DEFAULT ''"],
  ["personnages", "compte_watts", "TEXT NOT NULL DEFAULT ''"],
  // La faune du terrain (2026-10-08) : quand on a pris des poules (elles reviennent au bout de 2 h).
  ["personnages", "faune", "TEXT NOT NULL DEFAULT '{}'"],
  // Améliorer sa base (Book 24 §7) : le niveau dans la lignée ; tout ce qui est déjà posé est au niveau 1.
  ["feux", "niveau", "INTEGER NOT NULL DEFAULT 1"],
  ["feux", "accessoires", "TEXT NOT NULL DEFAULT '{}'"],
  // Le reste de l'état d'un feu (couvert, ce qui a été payé à chaque niveau, orientation du muret), en JSON.
  ["feux", "etat", "TEXT NOT NULL DEFAULT '{}'"],
  ["installations", "niveau", "INTEGER NOT NULL DEFAULT 1"],
  // Le savoir hors de sa famille (Book 25 §2.3) : recettes apprises, manuels lus, leçons données, en JSON.
  ["personnages", "savoir", "TEXT NOT NULL DEFAULT '{}'"],
  // L'arc pour tous (Book 25 §3.3) : les ébauches d'arc qui sèchent, et depuis quand, en JSON.
  ["personnages", "sechage", "TEXT NOT NULL DEFAULT '{}'"],
  // L'arbre de progression (0.7) : recettes dévoilées et vues, objets vus, temps de jeu, en JSON ; vide : à migrer.
  ["personnages", "progression", "TEXT NOT NULL DEFAULT ''"],
];

function maintenant(): string {
  return new Date().toISOString();
}

export class Base {
  private readonly db: DatabaseSync;

  constructor(chemin: string) {
    this.db = new DatabaseSync(chemin);
    // WAL + synchronous NORMAL : plus d'écriture forcée sur le disque à chaque validation (la carte du Pi s'use
    // moins, plus d'à-coups). En cas de coupure de courant, on peut perdre les dernières secondes, jamais la cohérence.
    // busy_timeout : la commande admin écrit pendant que le serveur tourne ; chacun attend son tour au lieu d'échouer.
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    this.db.exec(SCHEMA);
    this.migrer();
  }

  private migrer(): void {
    for (const [table, colonne, definition] of COLONNES_AJOUTEES) {
      const colonnes = this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      if (!colonnes.some((c) => c.name === colonne)) this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${colonne} ${definition}`);
    }
  }

  /** Plusieurs écritures en une seule transaction : bien plus rapide qu'une à une (sauvegardes groupées). */
  transaction(f: () => void): void {
    this.db.exec("BEGIN");
    try {
      f();
      this.db.exec("COMMIT");
    } catch (erreur) {
      this.db.exec("ROLLBACK");
      throw erreur;
    }
  }

  /** Instant réel du début du monde : fixe l'heure de jeu pour tout le serveur. */
  debutMonde(): number {
    const ligne = this.db.prepare("SELECT valeur FROM monde WHERE cle = 'debut'").get() as { valeur: string } | undefined;
    if (ligne) return Number(ligne.valeur);
    const debut = Date.now();
    this.db.prepare("INSERT INTO monde (cle, valeur) VALUES ('debut', ?)").run(String(debut));
    return debut;
  }

  /**
   * `tutoriel` : un nouveau joueur commence par le tutoriel (Book 14 §4.2) ; les comptes de test, non.
   * Le pseudo admin (« god » et ses variantes) est refusé : seule la commande admin le crée (`reserveAutorise`).
   */
  creerCompte(pseudo: string, motDePasse: string, famille: Famille, tutoriel = false, apparence: Apparence | null = null, reserveAutorise = false): Compte {
    if (!reserveAutorise && pseudoReserve(pseudo)) throw new PseudoReserve();
    const existe = this.db.prepare("SELECT 1 FROM comptes WHERE pseudo = ?").get(pseudo);
    if (existe) throw new PseudoPris();

    const { sel, empreinte } = empreinteMotDePasse(motDePasse);
    const date = maintenant();
    const resultat = this.db
      .prepare("INSERT INTO comptes (pseudo, sel, empreinte, cree_le) VALUES (?, ?, ?, ?)")
      .run(pseudo, sel, empreinte, date);
    const id = Number(resultat.lastInsertRowid);
    this.initialiserPersonnage(id, famille, tutoriel, apparence, date);
    return { id, pseudo, famille };
  }

  /** Le personnage d'un compte neuf (ou remis à neuf) : le kit, le terrain, la progression, l'apparence. */
  private initialiserPersonnage(id: number, famille: Famille, tutoriel: boolean, apparence: Apparence | null, date: string): void {
    this.db
      .prepare("INSERT INTO personnages (compte_id, famille, x, z, orientation, maj_le) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, famille, POINT_ARRIVEE.x, POINT_ARRIVEE.z, Math.PI, date);
    this.equiper(id, famille);
    if (tutoriel) this.sauverTutoriel(id, { ...TUTORIEL_NEUF });
    // L'arbre de progression (0.7) : le tutoriel commence au feu et à l'abri ; sans tutoriel (le vétéran, les comptes
    // de test), les paliers 1 et 2 d'emblée (Q8).
    const devoilees = tutoriel ? devoileesAuDepart() : [...new Set([...devoileesAuDepart(), ...devoileesDEmblee(famille)])];
    this.sauverProgression(id, { ...PROGRESSION_VIDE, devoilees, nonVues: [], vus: [] });
    if (apparence) this.db.prepare("UPDATE personnages SET apparence = ? WHERE compte_id = ?").run(JSON.stringify(apparenceValide(apparence, famille)), id);
  }

  // ---------- Le compte admin (commun/src/admin.ts, scripts/admin.ts) ----------

  /** Le compte qui porte ce pseudo (insensible à la casse), ou null. */
  compteParPseudo(pseudo: string): Compte | null {
    const l = this.db.prepare("SELECT c.id, c.pseudo, p.famille FROM comptes c JOIN personnages p ON p.compte_id = c.id WHERE c.pseudo = ?").get(pseudo) as
      | { id: number; pseudo: string; famille: Famille }
      | undefined;
    return l ? { id: l.id, pseudo: l.pseudo, famille: l.famille } : null;
  }

  /**
   * Remet un compte à neuf (la commande admin, quand « god » existe déjà) : nouveau mot de passe, jetons effacés (il faut
   * se reconnecter), et un personnage neuf, sans tutoriel : terrain, sac, coffres, quêtes, progression, sacs perdus.
   */
  reinitialiserCompte(id: number, motDePasse: string, famille: Famille, apparence: Apparence | null = null): Compte {
    const compte = this.db.prepare("SELECT pseudo FROM comptes WHERE id = ?").get(id) as { pseudo: string } | undefined;
    if (!compte) throw new Error(`Compte ${id} introuvable`);
    this.transaction(() => {
      const { sel, empreinte } = empreinteMotDePasse(motDePasse);
      this.db.prepare("UPDATE comptes SET sel = ?, empreinte = ? WHERE id = ?").run(sel, empreinte, id);
      for (const table of ["jetons", "inventaires", "ressources", "feux", "installations", "personnages"]) this.db.prepare(`DELETE FROM ${table} WHERE compte_id = ?`).run(id);
      this.db.prepare("DELETE FROM sacs WHERE proprietaire = ? OR terrain_de = ?").run(id, id);
      this.db.prepare("DELETE FROM instances WHERE cle = ?").run(`cooperative:${id}`);
      // Les déchets de sa Coopérative et ceux de son terrain (les 12 de départ, qui ne se renouvellent pas) : à neuf.
      this.db.prepare("DELETE FROM dechets WHERE lieu IN (?, ?)").run(`cooperative:${id}`, `terrain:${id}`);
      this.initialiserPersonnage(id, famille, false, apparence, maintenant());
    });
    return { id, pseudo: compte.pseudo, famille };
  }

  /**
   * Désigne l'admin. La table n'a qu'une ligne possible (`seul` = 1) : en désigner un autre retire l'ancien.
   * Il commence invincible.
   */
  designerAdmin(compteId: number): void {
    this.db
      .prepare("INSERT INTO admin (seul, compte_id, invincible) VALUES (1, ?, 1) ON CONFLICT (seul) DO UPDATE SET compte_id = excluded.compte_id, invincible = 1")
      .run(compteId);
  }

  /** Le compte admin, ou null. */
  admin(): number | null {
    const l = this.db.prepare("SELECT compte_id FROM admin").get() as { compte_id: number } | undefined;
    return l ? l.compte_id : null;
  }

  estAdmin(compteId: number): boolean {
    return this.db.prepare("SELECT 1 FROM admin WHERE compte_id = ?").get(compteId) !== undefined;
  }

  /** L'admin est-il invincible ? (false pour tout autre compte) */
  adminInvincible(compteId: number): boolean {
    const l = this.db.prepare("SELECT invincible FROM admin WHERE compte_id = ?").get(compteId) as { invincible: number } | undefined;
    return l?.invincible === 1;
  }

  reglerInvincible(compteId: number, oui: boolean): void {
    this.db.prepare("UPDATE admin SET invincible = ? WHERE compte_id = ?").run(oui ? 1 : 0, compteId);
  }

  /** Ce pseudo est-il déjà pris ? (vérifié avant l'étape d'apparence, pour ne pas la faire pour rien) */
  pseudoPris(pseudo: string): boolean {
    return this.db.prepare("SELECT 1 FROM comptes WHERE pseudo = ?").get(pseudo) !== undefined;
  }

  /** L'apparence du personnage ; pour un compte d'avant le menu d'apparence, celle de sa famille. */
  chargerApparence(compteId: number, famille: Famille): Apparence {
    const l = this.db.prepare("SELECT peau, apparence FROM personnages WHERE compte_id = ?").get(compteId) as { peau: number; apparence: string } | undefined;
    if (l?.apparence) {
      try {
        return apparenceValide(JSON.parse(l.apparence), famille);
      } catch {
        // Une apparence illisible : on retombe sur celle de la famille.
      }
    }
    return apparenceAncienne(famille, l?.peau ?? -1);
  }

  /** null : tutoriel terminé (ou passé). */
  chargerTutoriel(compteId: number): EtatTutoriel | null {
    const l = this.db.prepare("SELECT tutoriel FROM personnages WHERE compte_id = ?").get(compteId) as { tutoriel: string } | undefined;
    if (!l || l.tutoriel === "termine" || !l.tutoriel) return null;
    return { ...TUTORIEL_NEUF, ...(JSON.parse(l.tutoriel) as EtatTutoriel) };
  }

  sauverTutoriel(compteId: number, etat: EtatTutoriel | null): void {
    this.db.prepare("UPDATE personnages SET tutoriel = ? WHERE compte_id = ?").run(etat ? JSON.stringify(etat) : "termine", compteId);
  }

  /** L'arme équipée : un type, ou un exemplaire étoilé (« lame_forgee#4 », Book 25 §9.6). */
  chargerArme(compteId: number): CleObjet | null {
    const l = this.db.prepare("SELECT arme FROM personnages WHERE compte_id = ?").get(compteId) as { arme: string } | undefined;
    const cle = l?.arme ? cleCanonique(l.arme) : null;
    return cle && estCleObjet(cle) && estArme(cle) ? cle : null;
  }

  sauverArme(compteId: number, arme: CleObjet | null): void {
    this.db.prepare("UPDATE personnages SET arme = ? WHERE compte_id = ?").run(arme ?? "", compteId);
  }

  /** Le savoir hors de sa famille (Book 25 §2.3) ; illisible ou absent : rien d'appris. */
  chargerSavoir(compteId: number): Savoir {
    const l = this.db.prepare("SELECT savoir FROM personnages WHERE compte_id = ?").get(compteId) as { savoir: string } | undefined;
    try {
      return savoirValide(JSON.parse(l?.savoir || "{}"));
    } catch {
      return savoirValide(null);
    }
  }

  sauverSavoir(compteId: number, savoir: Savoir): void {
    this.db.prepare("UPDATE personnages SET savoir = ? WHERE compte_id = ?").run(JSON.stringify(savoir), compteId);
  }

  /**
   * Les recettes dévoilées (l'arbre de progression, 0.7) ; null : un personnage d'avant la 0.7, à migrer (Q4).
   * Illisible : comme un personnage d'avant (on réévalue sur son état, rien n'est détruit).
   */
  chargerProgression(compteId: number): EtatProgression | null {
    const l = this.db.prepare("SELECT progression FROM personnages WHERE compte_id = ?").get(compteId) as { progression: string } | undefined;
    if (!l?.progression) return null;
    try {
      return progressionValide(JSON.parse(l.progression));
    } catch {
      return null;
    }
  }

  sauverProgression(compteId: number, etat: EtatProgression): void {
    this.db.prepare("UPDATE personnages SET progression = ? WHERE compte_id = ?").run(JSON.stringify(etat), compteId);
  }

  /**
   * L'usure de chaque exemplaire d'arme : les coups qui lui restent (absente : neuf). Les sauvegardes d'avant la 0.6
   * (clés par type) se lisent telles quelles : la clé nue est l'exemplaire de base.
   */
  chargerUsure(compteId: number): Partial<Record<CleObjet, number>> {
    const l = this.db.prepare("SELECT usure_armes FROM personnages WHERE compte_id = ?").get(compteId) as { usure_armes: string } | undefined;
    try {
      const brut = JSON.parse(l?.usure_armes ?? "{}") as Record<string, unknown>;
      const usure: Partial<Record<CleObjet, number>> = {};
      for (const [t, n] of Object.entries(brut)) {
        const cle = cleCanonique(t);
        if (estCleObjet(cle) && estArme(cle) && typeof n === "number" && n >= 0) usure[cle] = n;
      }
      return usure;
    } catch {
      return {};
    }
  }

  /** La charge des armes électriques, par exemplaire (Wh qui restent ; absente : pleine), Book 25 §5.4. */
  chargerChargeArmes(compteId: number): Partial<Record<CleObjet, number>> {
    const l = this.db.prepare("SELECT charge_armes FROM personnages WHERE compte_id = ?").get(compteId) as { charge_armes: string } | undefined;
    try {
      const brut = JSON.parse(l?.charge_armes ?? "{}") as Record<string, unknown>;
      const charge: Partial<Record<CleObjet, number>> = {};
      for (const [t, n] of Object.entries(brut)) {
        const cle = cleCanonique(t);
        if (estCleObjet(cle) && estArme(cle) && typeof n === "number" && Number.isFinite(n) && n >= 0) charge[cle] = n;
      }
      return charge;
    } catch {
      return {};
    }
  }

  sauverChargeArmes(compteId: number, charge: Partial<Record<CleObjet, number>>): void {
    this.db.prepare("UPDATE personnages SET charge_armes = ? WHERE compte_id = ?").run(JSON.stringify(charge), compteId);
  }

  sauverUsure(compteId: number, usure: Partial<Record<CleObjet, number>>): void {
    this.db.prepare("UPDATE personnages SET usure_armes = ? WHERE compte_id = ?").run(JSON.stringify(usure), compteId);
  }

  chargerQuetes(compteId: number): EtatQuetes {
    const l = this.db.prepare("SELECT quetes FROM personnages WHERE compte_id = ?").get(compteId) as { quetes: string } | undefined;
    const neuf = { faits: {}, finies: [], primes: 0 };
    if (!l?.quetes) return neuf;
    try {
      return { ...neuf, ...(JSON.parse(l.quetes) as EtatQuetes) };
    } catch {
      return neuf;
    }
  }

  sauverQuetes(compteId: number, etat: EtatQuetes): void {
    this.db.prepare("UPDATE personnages SET quetes = ? WHERE compte_id = ?").run(JSON.stringify(etat), compteId);
  }

  /** Donne le kit de départ et génère le terrain, une seule fois par personnage. */
  private equiper(compteId: number, famille: Famille): void {
    const ligne = this.db.prepare("SELECT equipe FROM personnages WHERE compte_id = ?").get(compteId) as { equipe: number } | undefined;
    if (!ligne || ligne.equipe) return;
    this.sauverInventaire(compteId, kitDeDepart(famille));
    const inserer = this.db.prepare("INSERT OR IGNORE INTO ressources (compte_id, id, type, x, z) VALUES (?, ?, ?, ?, ?)");
    for (const r of genererRessources(compteId)) inserer.run(compteId, r.id, r.type, r.x, r.z);
    this.db.prepare("UPDATE personnages SET equipe = 1 WHERE compte_id = ?").run(compteId);
  }

  /** Version du contenu du terrain : la 2 ajoute la ruine de ferme et ses vestiges (É2). */
  private mettreAJourContenu(compteId: number): void {
    const ligne = this.db.prepare("SELECT contenu FROM personnages WHERE compte_id = ?").get(compteId) as { contenu: number } | undefined;
    if (!ligne || ligne.contenu >= 2) return;
    const max = this.db.prepare("SELECT COALESCE(MAX(id), 0) AS m FROM ressources WHERE compte_id = ?").get(compteId) as { m: number };
    const inserer = this.db.prepare("INSERT OR IGNORE INTO ressources (compte_id, id, type, x, z) VALUES (?, ?, ?, ?, ?)");
    for (const r of genererVestiges(max.m + 1)) inserer.run(compteId, r.id, r.type, r.x, r.z);
    this.db.prepare("UPDATE personnages SET contenu = 2 WHERE compte_id = ?").run(compteId);
  }

  /** Renvoie le compte si le mot de passe est bon, sinon null. */
  verifierIdentifiants(pseudo: string, motDePasse: string): Compte | null {
    const ligne = this.db
      .prepare(
        `SELECT c.id, c.pseudo, c.sel, c.empreinte, p.famille
         FROM comptes c JOIN personnages p ON p.compte_id = c.id
         WHERE c.pseudo = ?`,
      )
      .get(pseudo) as { id: number; pseudo: string; sel: string; empreinte: string; famille: Famille } | undefined;
    if (!ligne || !verifierMotDePasse(motDePasse, ligne.sel, ligne.empreinte)) return null;
    return { id: ligne.id, pseudo: ligne.pseudo, famille: ligne.famille };
  }

  creerJeton(compteId: number): string {
    const jeton = nouveauJeton();
    this.db.prepare("INSERT INTO jetons (jeton, compte_id, cree_le) VALUES (?, ?, ?)").run(jeton, compteId, maintenant());
    return jeton;
  }

  compteParJeton(jeton: string): Compte | null {
    const ligne = this.db
      .prepare(
        `SELECT c.id, c.pseudo, p.famille
         FROM jetons j JOIN comptes c ON c.id = j.compte_id JOIN personnages p ON p.compte_id = c.id
         WHERE j.jeton = ?`,
      )
      .get(jeton) as { id: number; pseudo: string; famille: Famille } | undefined;
    return ligne ? { id: ligne.id, pseudo: ligne.pseudo, famille: ligne.famille } : null;
  }

  chargerPersonnage(compteId: number): Personnage | null {
    const ligne = this.db
      .prepare("SELECT famille, lieu, x, z, orientation, maj_le, kcal, eau, repos, gourde_contenu, gourde_litres FROM personnages WHERE compte_id = ?")
      .get(compteId) as
      | { famille: Famille; lieu: string; x: number; z: number; orientation: number; maj_le: string; kcal: number; eau: number; repos: number; gourde_contenu: string; gourde_litres: number }
      | undefined;
    if (!ligne) return null;
    // Les personnages créés avant l'É1 reçoivent leur kit et leur terrain à la première connexion.
    this.equiper(compteId, ligne.famille);
    this.mettreAJourContenu(compteId);
    return {
      compteId,
      famille: ligne.famille,
      lieu: estLieuJouable(ligne.lieu) ? ligne.lieu : "terrain",
      position: { x: ligne.x, z: ligne.z, o: ligne.orientation },
      vuLe: Date.parse(ligne.maj_le) || 0,
      besoins: { kcal: ligne.kcal, eau: ligne.eau, repos: ligne.repos },
      gourde: { contenu: ligne.gourde_contenu === "brute" ? "brute" : "potable", litres: ligne.gourde_litres },
    };
  }

  sauverPosition(compteId: number, position: Position, lieu: LieuJouable = "terrain", quand = Date.now()): void {
    this.db
      .prepare("UPDATE personnages SET lieu = ?, x = ?, z = ?, orientation = ?, maj_le = ? WHERE compte_id = ?")
      .run(lieu, position.x, position.z, position.o, new Date(quand).toISOString(), compteId);
  }

  chargerWotts(compteId: number): { poche: Wotts; compte: Wotts } {
    const l = this.db.prepare("SELECT watts, compte_watts FROM personnages WHERE compte_id = ?").get(compteId) as { watts: string; compte_watts: string } | undefined;
    const lire = (s: string | undefined): Wotts => (s ? (JSON.parse(s) as Wotts) : { valeur: 0, majLe: 0 });
    return { poche: lire(l?.watts), compte: lire(l?.compte_watts) };
  }

  sauverWotts(compteId: number, poche: Wotts, compte: Wotts): void {
    this.db.prepare("UPDATE personnages SET watts = ?, compte_watts = ? WHERE compte_id = ?").run(JSON.stringify(poche), JSON.stringify(compte), compteId);
  }

  nombreComptes(): number {
    return (this.db.prepare("SELECT COUNT(*) AS n FROM comptes").get() as { n: number }).n;
  }

  /** Un état du monde gardé en JSON (le comptoir, par exemple). */
  lireMonde<T>(cle: string): T | null {
    const l = this.db.prepare("SELECT valeur FROM monde WHERE cle = ?").get(cle) as { valeur: string } | undefined;
    return l ? (JSON.parse(l.valeur) as T) : null;
  }

  ecrireMonde(cle: string, valeur: unknown): void {
    this.db.prepare("INSERT INTO monde (cle, valeur) VALUES (?, ?) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur").run(cle, JSON.stringify(valeur));
  }

  chargerSante(compteId: number): { sante: Sante; endurance: number } {
    const l = this.db.prepare("SELECT sante, endurance FROM personnages WHERE compte_id = ?").get(compteId) as { sante: string; endurance: number } | undefined;
    const sante = l?.sante ? (JSON.parse(l.sante) as Sante) : { ...SANTE_DEPART };
    return { sante, endurance: l?.endurance ?? 100 };
  }

  sauverSante(compteId: number, sante: Sante, endurance: number): void {
    this.db.prepare("UPDATE personnages SET sante = ?, endurance = ? WHERE compte_id = ?").run(JSON.stringify(sante), endurance, compteId);
  }

  /** Un sac tombé à l'effondrement (Book 05 §10.3) : il reste là où le personnage est tombé. */
  poserSac(sac: Omit<SacEnBase, "id">): SacEnBase {
    const r = this.db
      .prepare("INSERT INTO sacs (lieu, terrain_de, proprietaire, x, z, contenu, cree_le) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(sac.lieu, sac.terrainDe, sac.proprietaire, sac.x, sac.z, JSON.stringify(sac.contenu), sac.creeLe);
    return { ...sac, id: Number(r.lastInsertRowid) };
  }

  /** Les sacs d'un lieu : la halte (`terrainDe` = 0) ou le terrain d'un joueur. */
  chargerSacs(lieu: string, terrainDe = 0): SacEnBase[] {
    const lignes = this.db
      .prepare("SELECT id, lieu, terrain_de, proprietaire, x, z, contenu, cree_le FROM sacs WHERE lieu = ? AND terrain_de = ?")
      .all(lieu, terrainDe) as { id: number; lieu: string; terrain_de: number; proprietaire: number; x: number; z: number; contenu: string; cree_le: number }[];
    return lignes.map((l) => ({
      id: l.id,
      lieu: l.lieu,
      terrainDe: l.terrain_de,
      proprietaire: l.proprietaire,
      x: l.x,
      z: l.z,
      contenu: JSON.parse(l.contenu) as ContenuSac,
      creeLe: l.cree_le,
    }));
  }

  retirerSac(id: number): void {
    this.db.prepare("DELETE FROM sacs WHERE id = ?").run(id);
  }

  /**
   * Les ressources d'un lieu vivant (la halte, partagée ; la Coopérative d'un joueur), créées au premier chargement
   * par `generer` ; si `version` change, on repart de la nouvelle génération.
   */
  chargerRessourcesLieu(lieu: string, generer: () => Omit<RessourceSol, "disponible">[] = genererHalte, version = VERSION_HALTE): RessourceEnBase[] {
    const lire = () =>
      this.db.prepare("SELECT id, type, x, z, disponible_le FROM ressources_lieux WHERE lieu = ? ORDER BY id").all(lieu) as {
        id: number;
        type: TypeRessource;
        x: number;
        z: number;
        disponible_le: number;
      }[];
    // Le contenu de la halte a changé depuis la dernière génération : on repart de la nouvelle version.
    const cle = `version_${lieu}`;
    const enregistree = this.db.prepare("SELECT valeur FROM monde WHERE cle = ?").get(cle) as { valeur: string } | undefined;
    if (Number(enregistree?.valeur ?? 0) !== version) {
      this.db.prepare("DELETE FROM ressources_lieux WHERE lieu = ?").run(lieu);
      this.db.prepare("INSERT INTO monde (cle, valeur) VALUES (?, ?) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur").run(cle, String(version));
    }
    let lignes = lire();
    // Un point nouveau, ajouté au contenu sans en changer la version (0.5.1 : la batterie du tracteur), s'ajoute seul :
    // le reste (le butin déjà pris) ne bouge pas.
    const connus = new Set(lignes.map((l) => l.id));
    const manquants = generer().filter((r) => !connus.has(r.id));
    if (manquants.length > 0) {
      const inserer = this.db.prepare("INSERT INTO ressources_lieux (lieu, id, type, x, z) VALUES (?, ?, ?, ?, ?)");
      for (const r of manquants) inserer.run(lieu, r.id, r.type, r.x, r.z);
      lignes = lire();
    }
    return lignes.map((l) => ({ id: l.id, type: l.type, x: l.x, z: l.z, disponibleLe: l.disponible_le }));
  }

  /** L'état gardé d'une instance de lieu (la Coopérative d'un joueur), en JSON ; null si elle n'a jamais été visitée. */
  chargerInstance(cle: string): unknown {
    const l = this.db.prepare("SELECT etat FROM instances WHERE cle = ?").get(cle) as { etat: string } | undefined;
    return l ? (JSON.parse(l.etat) as unknown) : null;
  }

  sauverInstance(cle: string, etat: unknown, majLe: number): void {
    this.db
      .prepare("INSERT INTO instances (cle, etat, maj_le) VALUES (?, ?, ?) ON CONFLICT (cle) DO UPDATE SET etat = excluded.etat, maj_le = excluded.maj_le")
      .run(cle, JSON.stringify(etat), majLe);
  }

  sauverRessourceLieu(lieu: string, id: number, disponibleLe: number): void {
    this.db.prepare("UPDATE ressources_lieux SET disponible_le = ? WHERE lieu = ? AND id = ?").run(disponibleLe, lieu, id);
  }

  sauverEtat(compteId: number, besoins: Besoins, gourde: Gourde): void {
    this.db
      .prepare("UPDATE personnages SET kcal = ?, eau = ?, repos = ?, gourde_contenu = ?, gourde_litres = ? WHERE compte_id = ?")
      .run(besoins.kcal, besoins.eau, besoins.repos ?? 1, gourde.contenu, gourde.litres, compteId);
  }

  /**
   * L'inventaire, sous sa forme canonique (Book 25 §9.6) : la colonne `type` tient aussi les exemplaires étoilés
   * (« lame_forgee#4 »). Une sauvegarde d'avant la 0.6 se relit sans changement : ses objets sont aux étoiles de base.
   */
  chargerInventaire(compteId: number): Inventaire {
    const lignes = this.db.prepare("SELECT type, quantite FROM inventaires WHERE compte_id = ?").all(compteId) as {
      type: string;
      quantite: number;
    }[];
    const brut: Record<string, number> = {};
    for (const l of lignes) if (l.quantite > 0) brut[l.type] = (brut[l.type] ?? 0) + l.quantite;
    return canoniser(brut);
  }

  sauverInventaire(compteId: number, inventaire: Inventaire): void {
    this.db.prepare("DELETE FROM inventaires WHERE compte_id = ?").run(compteId);
    const inserer = this.db.prepare("INSERT INTO inventaires (compte_id, type, quantite) VALUES (?, ?, ?)");
    for (const [type, quantite] of Object.entries(inventaire)) if (quantite && quantite > 0) inserer.run(compteId, type, quantite);
  }

  chargerRessources(compteId: number): RessourceEnBase[] {
    // Les terrains créés avant les joncs : on les plante au bord de la mare.
    const joncs = this.db.prepare("SELECT 1 FROM ressources WHERE compte_id = ? AND type = 'joncs'").get(compteId);
    const max = this.db.prepare("SELECT MAX(id) AS m FROM ressources WHERE compte_id = ?").get(compteId) as { m: number | null };
    if (!joncs && max.m !== null) {
      const inserer = this.db.prepare("INSERT INTO ressources (compte_id, id, type, x, z) VALUES (?, ?, ?, ?, ?)");
      for (const r of genererJoncs(compteId, max.m + 1)) inserer.run(compteId, r.id, r.type, r.x, r.z);
    }
    // La mare a pris une forme naturelle (2026-10-08) : les joncs suivent son nouveau bord (mêmes tirages, même ordre).
    const touffes = this.db.prepare("SELECT id FROM ressources WHERE compte_id = ? AND type = 'joncs' ORDER BY id").all(compteId) as { id: number }[];
    if (touffes.length > 0) {
      const places = genererJoncs(compteId, touffes[0]!.id);
      const deplacer = this.db.prepare("UPDATE ressources SET x = ?, z = ? WHERE compte_id = ? AND id = ?");
      touffes.forEach((t, i) => {
        const p = places[i];
        if (p) deplacer.run(p.x, p.z, compteId, t.id);
      });
    }
    // Les terrains créés avant le verger et le sous-bois (2026-10-08) : on plante les fruitiers et les champignons.
    const verger = this.db.prepare("SELECT 1 FROM ressources WHERE compte_id = ? AND type = 'pommier'").get(compteId);
    if (!verger && max.m !== null) {
      const occupees = this.db.prepare("SELECT x, z FROM ressources WHERE compte_id = ?").all(compteId) as { x: number; z: number }[];
      const suivant = (this.db.prepare("SELECT MAX(id) AS m FROM ressources WHERE compte_id = ?").get(compteId) as { m: number }).m + 1;
      const inserer = this.db.prepare("INSERT INTO ressources (compte_id, id, type, x, z) VALUES (?, ?, ?, ?, ?)");
      for (const r of genererVergerEtSousBois(compteId, suivant, occupees)) inserer.run(compteId, r.id, r.type, r.x, r.z);
    }
    // Les terrains créés avant la 0.6 (Book 25 §3.2) : on plante les deux frênes de la lisière et l'if du fond du bois.
    const essences = this.db.prepare("SELECT 1 FROM ressources WHERE compte_id = ? AND type = 'frene'").get(compteId);
    if (!essences && max.m !== null) {
      const occupees = this.db.prepare("SELECT x, z FROM ressources WHERE compte_id = ?").all(compteId) as { x: number; z: number }[];
      const suivant = (this.db.prepare("SELECT MAX(id) AS m FROM ressources WHERE compte_id = ?").get(compteId) as { m: number }).m + 1;
      const inserer = this.db.prepare("INSERT INTO ressources (compte_id, id, type, x, z) VALUES (?, ?, ?, ?, ?)");
      for (const r of genererEssences(compteId, suivant, occupees)) inserer.run(compteId, r.id, r.type, r.x, r.z);
    }
    const lignes = this.db
      .prepare("SELECT id, type, x, z, disponible_le FROM ressources WHERE compte_id = ? ORDER BY id")
      .all(compteId) as { id: number; type: TypeRessource; x: number; z: number; disponible_le: number }[];
    return lignes.map((l) => ({ id: l.id, type: l.type, x: l.x, z: l.z, disponibleLe: l.disponible_le }));
  }

  sauverRessource(compteId: number, id: number, disponibleLe: number): void {
    this.db.prepare("UPDATE ressources SET disponible_le = ? WHERE compte_id = ? AND id = ?").run(disponibleLe, compteId, id);
  }

  chargerFeux(compteId: number): FeuEnBase[] {
    const lignes = this.db.prepare("SELECT id, x, z, bois, allume, maj_le, dakota, niveau, accessoires, etat FROM feux WHERE compte_id = ? ORDER BY id").all(compteId) as {
      dakota: number;
      id: number;
      x: number;
      z: number;
      bois: number;
      allume: number;
      maj_le: number;
      niveau: number;
      accessoires: string;
      etat: string;
    }[];
    return lignes.map((l) => {
      const accessoires = JSON.parse(l.accessoires || "{}") as FeuEnBase["accessoires"];
      const etat = JSON.parse(l.etat || "{}") as { couvert?: boolean; payes?: Inventaire[]; o?: number };
      return {
        id: l.id,
        x: l.x,
        z: l.z,
        bois: l.bois,
        allume: l.allume === 1,
        majLe: l.maj_le,
        ...(l.dakota ? { dakota: true } : {}),
        ...(l.niveau > 1 ? { niveau: l.niveau } : {}),
        ...(accessoires && Object.keys(accessoires).length ? { accessoires } : {}),
        ...(etat.couvert ? { couvert: true } : {}),
        ...(etat.payes ? { payes: etat.payes } : {}),
        ...(etat.o !== undefined ? { o: etat.o } : {}),
      };
    });
  }

  sauverFeu(compteId: number, feu: FeuEnBase): void {
    const etat = JSON.stringify({ ...(feu.couvert ? { couvert: true } : {}), ...(feu.payes ? { payes: feu.payes } : {}), ...(feu.o !== undefined ? { o: feu.o } : {}) });
    this.db
      .prepare(
        `INSERT INTO feux (compte_id, id, x, z, bois, allume, maj_le, dakota, niveau, accessoires, etat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (compte_id, id) DO UPDATE SET bois = excluded.bois, allume = excluded.allume, maj_le = excluded.maj_le,
           dakota = excluded.dakota, niveau = excluded.niveau, accessoires = excluded.accessoires, etat = excluded.etat`,
      )
      .run(compteId, feu.id, feu.x, feu.z, feu.bois, feu.allume ? 1 : 0, feu.majLe, feu.dakota ? 1 : 0, feu.niveau ?? 1, JSON.stringify(feu.accessoires ?? {}), etat);
  }

  /** Un feu démonté (Book 24 §2.4) : il quitte le terrain. */
  retirerFeu(compteId: number, id: number): void {
    this.db.prepare("DELETE FROM feux WHERE compte_id = ? AND id = ?").run(compteId, id);
  }

  chargerInstallations(compteId: number): InstallationVue[] {
    const lignes = this.db.prepare("SELECT id, type, x, z, o, etat, niveau FROM installations WHERE compte_id = ? ORDER BY id").all(compteId) as {
      id: number;
      type: TypeInstallation;
      x: number;
      z: number;
      o: number;
      etat: string;
      niveau: number;
    }[];
    return lignes.map((l) => ({ id: l.id, type: l.type, x: l.x, z: l.z, o: l.o, etat: JSON.parse(l.etat) as EtatInstallation, ...(l.niveau > 1 ? { niveau: l.niveau } : {}) }));
  }

  /** Une installation améliorée ou redescendue sur place (Book 24) : même identifiant, même place. */
  sauverNiveauInstallation(compteId: number, id: number, niveau: number): void {
    this.db.prepare("UPDATE installations SET niveau = ? WHERE compte_id = ? AND id = ?").run(niveau, compteId, id);
  }

  sauverEtatInstallation(compteId: number, id: number, etat: EtatInstallation): void {
    this.db.prepare("UPDATE installations SET etat = ? WHERE compte_id = ? AND id = ?").run(JSON.stringify(etat), compteId, id);
  }

  retirerInstallation(compteId: number, id: number): void {
    this.db.prepare("DELETE FROM installations WHERE compte_id = ? AND id = ?").run(compteId, id);
  }

  /** Charges des batteries et instant de la dernière mise à jour (pour la décharge spontanée). */
  chargerCharges(compteId: number): { charges: Charges; majLe: number } {
    const l = this.db.prepare("SELECT charges, charges_maj_le FROM personnages WHERE compte_id = ?").get(compteId) as
      | { charges: string; charges_maj_le: number }
      | undefined;
    return l ? { charges: JSON.parse(l.charges) as Charges, majLe: l.charges_maj_le } : { charges: {}, majLe: 0 };
  }

  sauverCharges(compteId: number, charges: Charges, majLe: number): void {
    this.db.prepare("UPDATE personnages SET charges = ?, charges_maj_le = ? WHERE compte_id = ?").run(JSON.stringify(charges), majLe, compteId);
  }

  ajouterInstallation(compteId: number, type: TypeInstallation, x: number, z: number, o: number): InstallationVue {
    const max = this.db.prepare("SELECT COALESCE(MAX(id), 0) AS m FROM installations WHERE compte_id = ?").get(compteId) as { m: number };
    const id = max.m + 1;
    this.db.prepare("INSERT INTO installations (compte_id, id, type, x, z, o, etat) VALUES (?, ?, ?, ?, ?, ?, '{}')").run(compteId, id, type, x, z, o);
    return { id, type, x, z, o, etat: {} };
  }

  chargerFaune(compteId: number): { prises: number[] } {
    const l = this.db.prepare("SELECT faune FROM personnages WHERE compte_id = ?").get(compteId) as { faune: string } | undefined;
    const f = l?.faune ? (JSON.parse(l.faune) as { prises?: number[] }) : {};
    return { prises: f.prises ?? [] };
  }

  sauverFaune(compteId: number, faune: { prises: number[] }): void {
    this.db.prepare("UPDATE personnages SET faune = ? WHERE compte_id = ?").run(JSON.stringify(faune), compteId);
  }

  /** Les ébauches d'arc qui sèchent (Book 25 §3.3) ; illisible ou absent : rien ne sèche. */
  chargerSechage(compteId: number): EtatSechage {
    const l = this.db.prepare("SELECT sechage FROM personnages WHERE compte_id = ?").get(compteId) as { sechage: string } | undefined;
    try {
      return sechageValide(JSON.parse(l?.sechage || "{}"));
    } catch {
      return {};
    }
  }

  sauverSechage(compteId: number, etat: EtatSechage): void {
    this.db.prepare("UPDATE personnages SET sechage = ? WHERE compte_id = ?").run(JSON.stringify(etat), compteId);
  }

  /** Une copie cohérente et compacte de toute la base, même pendant que le jeu tourne (Book 17 §5.4). */
  sauvegarderVers(chemin: string): void {
    this.db.prepare("VACUUM INTO ?").run(chemin);
  }

  /** Une mesure du test familial (Book 17 §6). */
  mesurer(m: Mesure): void {
    this.db
      .prepare("INSERT INTO mesures (instant, compte_id, famille, genre, quoi, valeur, details) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(m.instant, m.compteId, m.famille, m.genre, m.quoi, m.valeur, m.details ? JSON.stringify(m.details) : null);
  }

  /** Les mesures d'un genre (pour les tests et le bilan). */
  lireMesures(genre: string): { famille: string; quoi: string; valeur: number }[] {
    return this.db.prepare("SELECT famille, quoi, valeur FROM mesures WHERE genre = ? ORDER BY instant").all(genre) as { famille: string; quoi: string; valeur: number }[];
  }

  /** Un objet lourd déplacé (l'escabeau) : sa nouvelle place. */
  // ---------- La couche de déchets (0.7, serveur/src/couche-dechets.ts) ----------

  /** Les carreaux entamés et les points d'une couche de déchets (« station », « cooperative:12 »…). */
  chargerDechets(lieu: string): { carreau: string; remplissage: number; pris: number[]; renouveleLe: number }[] {
    const lignes = this.db.prepare("SELECT carreau, remplissage, pris, renouvele_le FROM dechets WHERE lieu = ?").all(lieu) as {
      carreau: string;
      remplissage: number;
      pris: string;
      renouvele_le: number;
    }[];
    return lignes.map((l) => {
      const pris = JSON.parse(l.pris) as unknown;
      return {
        carreau: l.carreau,
        remplissage: l.remplissage,
        pris: Array.isArray(pris) ? pris.filter((i): i is number => Number.isInteger(i)) : [],
        renouveleLe: l.renouvele_le,
      };
    });
  }

  sauverDechets(lieu: string, carreau: string, remplissage: number, pris: readonly number[], renouveleLe: number): void {
    this.db
      .prepare(
        "INSERT INTO dechets (lieu, carreau, remplissage, pris, renouvele_le) VALUES (?, ?, ?, ?, ?) ON CONFLICT (lieu, carreau) DO UPDATE SET remplissage = excluded.remplissage, pris = excluded.pris, renouvele_le = excluded.renouvele_le",
      )
      .run(lieu, carreau, remplissage, JSON.stringify(pris), renouveleLe);
  }

  /**
   * Efface les sacs et tas posés ailleurs que sur un terrain personnel avant `avant` (ms) que `aEffacer` désigne (les
   * ordures jetées depuis plus de 24 h, Q10). Renvoie leurs ids.
   */
  purgerSacsHorsTerrain(avant: number, aEffacer: (contenu: ContenuSac, creeLe: number) => boolean): number[] {
    const lignes = this.db.prepare("SELECT id, contenu, cree_le FROM sacs WHERE lieu != 'terrain' AND cree_le <= ?").all(avant) as { id: number; contenu: string; cree_le: number }[];
    const effaces: number[] = [];
    for (const l of lignes) {
      if (!aEffacer(JSON.parse(l.contenu) as ContenuSac, l.cree_le)) continue;
      this.retirerSac(l.id);
      effaces.push(l.id);
    }
    return effaces;
  }

  deplacerInstallation(compteId: number, id: number, x: number, z: number, o: number): void {
    this.db.prepare("UPDATE installations SET x = ?, z = ?, o = ? WHERE compte_id = ? AND id = ?").run(x, z, o, compteId, id);
  }

  fermer(): void {
    this.db.close();
  }
}
