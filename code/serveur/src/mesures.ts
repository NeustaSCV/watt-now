// Les mesures du test familial (Book 17 §6) : de quoi équilibrer le jeu après coup.
// Chaque mesure est une ligne de la table `mesures` : quand, qui (compte, famille), quoi, combien.
// Rien de personnel n'y est noté : pas de pseudo, pas de position, pas de message.

import { MS_JOUR_CALENDRIER } from "../../commun/src/energie.ts";
import { estObjetDeMetier, etoilesDe, typeDe } from "../../commun/src/etoiles.ts";
import { ETAPES_LIEUX } from "../../commun/src/lieux.ts";
import { LIGNEES_INSTALLATIONS, VOIE_CREUSEE, VOIE_SURFACE, type EtapeMonde } from "../../commun/src/lignees.ts";
import { etapeAvecCle } from "../../commun/src/progression.ts";
import type { TypeObjet } from "../../commun/src/objets.ts";
import { RECETTES } from "../../commun/src/recettes.ts";
import { FAMILLES, type Famille } from "../../commun/src/regles.ts";

export type GenreMesure =
  /** Temps passé par activité (secondes réelles). */
  | "activite"
  /** Flux de wotts : créés (dépôt d'électricité), gagnés, dépensés, détruits. */
  | "wotts"
  /** Causes d'effondrement (Book 06 §12). */
  | "effondrement"
  /** Progression : recettes réussies, étapes du tutoriel. */
  | "progression"
  /** Connexions et durée des séances. */
  | "session"
  /** Charge du serveur, chaque minute. */
  | "serveur"
  /** Images par seconde des appareils, chaque minute. */
  | "client"
  /** Le métier des familles (Book 25 §10.1) : tirs, destructions par arme, objets de métier faits et échangés. */
  | "metier";

/**
 * Le rythme de progression (décision du porteur, 2026-10-10) : `progression` / `atteint:<étape>` (maison, H1A, L1A…),
 * la valeur en minutes de jeu depuis la création du personnage. Ce sont les seules mesures gardées quand on supprime un
 * compte, rendues anonymes (compte 0, sans détails) : « en combien de temps de jeu il est arrivé à L1, à L2 ».
 */
export const PREFIXE_ATTEINT = "atteint:";
/** Le compte des mesures rendues anonymes (aucun compte réel n'a le numéro 0). */
export const COMPTE_ANONYME = 0;

export interface Mesure {
  instant: number;
  compteId: number;
  famille: string;
  genre: GenreMesure;
  quoi: string;
  valeur: number;
  /** Détails, en JSON (facultatif). */
  details?: Record<string, unknown>;
}

/** Les grandes activités du Book 17 §6 : collecte, fabrication, expédition, soins, et le reste de la survie. */
export function categorieAction(libelle: string): string {
  const l = libelle.toLowerCase();
  if (/^(ramasser|cueillir|gauler|couper des joncs|prendre|fouiller|démonter|reprendre ton sac)/.test(l)) return "collecte";
  if (/pansement|panser/.test(l)) return "soins";
  if (/^(manger|boire|faire bouillir|remplir la gourde|faire rôtir)/.test(l)) return "nourriture et eau";
  if (/feu|meule|charbon/.test(l)) return "feu et charbon";
  if (/pédaler|recharger|batteries|affûter/.test(l)) return "énergie";
  return "fabrication";
}

// ---------- Le métier des familles (Book 25 §10.1, chantier 9 · 0.6) ----------
//
// Ce qu'on note, genre « metier » :
// - `tir:<arme>` à chaque flèche ou carreau tiré ;
// - `detruit:<comment>` à chaque Éteint détruit : le type de l'arme de contact (tranchant, electrique…), `tir_plein`
//   (un tir plein à la tête), `tir` (au torse, ou achevé à terre), `lancer` ;
// - `fabrique:<objet>` pour un objet de métier fabriqué, ses étoiles en valeur ;
// - `echange` quand un joueur donne des objets de métier à un autre (leur nombre en valeur).

/** Les armes de métier de chaque famille (Book 25 §8.4) : la machette et sa gamme, la matraque, l'arbalète. */
export const ARMES_DE_METIER_DES_FAMILLES: Record<Famille, readonly TypeObjet[]> = {
  charbonniers: ["machette_forgee", "lame_forgee", "hachette", "serpe", "hache_forgee", "glaive"],
  voltaiques: ["matraque_fortune", "matraque_electrique", "aiguillon"],
  mecanistes: ["arbalete", "arbalete_lourde"],
};

/** Les objets de métier qui sortent d'une fabrication : `fabrique:<objet>`, ses étoiles en valeur. */
export function mesuresFabrication(sortie: Partial<Record<string, number>>): { quoi: string; valeur: number }[] {
  const r: { quoi: string; valeur: number }[] = [];
  for (const [cle, n] of Object.entries(sortie)) {
    const etoiles = etoilesDe(cle);
    if (!n || etoiles === null) continue;
    for (let i = 0; i < n; i++) r.push({ quoi: `fabrique:${typeDe(cle)}`, valeur: etoiles });
  }
  return r;
}

/** Ce qui sort d'une recette de famille, ou un objet de métier : ce qui fait un échange de métier. */
const OBJETS_DE_FAMILLE = new Set<string>(RECETTES.flatMap((r) => (r.famille !== "tous" && "objet" in r.produit ? [r.produit.objet] : [])));
export function estObjetDeCommerce(cle: string): boolean {
  const type = typeDe(cle);
  return estObjetDeMetier(type) || OBJETS_DE_FAMILLE.has(type);
}

/** Un échange entre joueurs : combien d'objets de métier on donne (0 : rien à noter). */
export function objetsDeMetierDonnes(objets: Partial<Record<string, number>>): number {
  return Object.entries(objets).reduce((s, [cle, n]) => s + (estObjetDeCommerce(cle) ? (n ?? 0) : 0), 0);
}

/** Ce que mesurent les critères de réussite de la 0.6 (Book 25 §10.1). */
export interface BilanMetier {
  joueurs: number;
  /** Joueurs qui ont tiré au moins une flèche ou un carreau (objectif : 60 % ou plus). */
  tireurs: number;
  partTireurs: number | null;
  /** Éteints détruits d'un tir plein à la tête (on ne tire pas saisi : chacun est « sans saisie »). */
  tirPlein: number;
  /** Éteints détruits, par façon de faire. */
  destructions: Record<string, number>;
  /**
   * Par famille : le plus court délai (en jours de calendrier) entre la première mesure d'un joueur et sa première arme
   * de métier ★★ ou mieux (objectif : moins de 2). null : pas encore.
   */
  armeDeMetier: Record<Famille, number | null>;
  /** Échanges de métier entre joueurs, par joueur et par semaine (objectif : au moins 1 quand les trois familles sont là). */
  echangesParJoueurSemaine: number | null;
  /** Part du temps d'action passée à se défendre, par famille (objectif : ±5 % entre familles). */
  defense: Record<Famille, number | null>;
  ecartDefense: number | null;
  /** Arbalètes lourdes faites (objectif : une par test, à deux familles). */
  arbaletesLourdes: number;
}

const SEMAINE_MS = 7 * 24 * 3_600_000;

/** Le bilan du métier des familles, à partir des mesures (`npm run bilan`). */
export function bilanMetier(mesures: readonly Pick<Mesure, "instant" | "compteId" | "famille" | "genre" | "quoi" | "valeur">[]): BilanMetier {
  const joueurs = new Set(mesures.filter((m) => m.compteId > 0).map((m) => m.compteId));
  const metier = mesures.filter((m) => m.genre === "metier");
  const tireurs = new Set(metier.filter((m) => m.quoi.startsWith("tir:")).map((m) => m.compteId));
  const destructions: Record<string, number> = {};
  for (const m of metier) if (m.quoi.startsWith("detruit:")) destructions[m.quoi.slice(8)] = (destructions[m.quoi.slice(8)] ?? 0) + 1;

  // La première mesure de chaque joueur : son arrivée sur le serveur.
  const debut = new Map<number, number>();
  for (const m of mesures) if (m.compteId > 0) debut.set(m.compteId, Math.min(debut.get(m.compteId) ?? Infinity, m.instant));
  const armeDeMetier = {} as Record<Famille, number | null>;
  const defense = {} as Record<Famille, number | null>;
  for (const f of FAMILLES) {
    const faites = metier.filter((m) => m.famille === f && m.valeur >= 2 && ARMES_DE_METIER_DES_FAMILLES[f].some((o) => m.quoi === `fabrique:${o}`));
    const delais = faites.map((m) => (m.instant - (debut.get(m.compteId) ?? m.instant)) / MS_JOUR_CALENDRIER);
    armeDeMetier[f] = delais.length ? Math.min(...delais) : null;
    const activite = mesures.filter((m) => m.genre === "activite" && m.famille === f);
    const total = activite.reduce((s, m) => s + m.valeur, 0);
    defense[f] = total > 0 ? activite.filter((m) => m.quoi === "combat").reduce((s, m) => s + m.valeur, 0) / total : null;
  }
  const parts = Object.values(defense).filter((v): v is number => v !== null);
  const instants = mesures.map((m) => m.instant);
  const semaines = instants.length ? Math.max(1, (Math.max(...instants) - Math.min(...instants)) / SEMAINE_MS) : 1;
  const echanges = metier.filter((m) => m.quoi === "echange").length;
  return {
    joueurs: joueurs.size,
    tireurs: tireurs.size,
    partTireurs: joueurs.size ? tireurs.size / joueurs.size : null,
    tirPlein: destructions.tir_plein ?? 0,
    destructions,
    armeDeMetier,
    echangesParJoueurSemaine: joueurs.size ? echanges / joueurs.size / semaines : null,
    defense,
    ecartDefense: parts.length >= 2 ? Math.max(...parts) - Math.min(...parts) : null,
    arbaletesLourdes: metier.filter((m) => m.quoi === "fabrique:arbalete_lourde").length,
  };
}

// ---------- Les faits du niveau 1 (plan 0.8, chantier 14 ; avis-game-designer.md §5.2, point 4) ----------
//
// Ce qu'on note, genre « progression », la valeur en minutes de jeu depuis la création du personnage (le temps joué,
// celui du dévoilement), sauf pour un niveau :
// - `visite:<lieu>` à chaque arrivée dans un lieu ;
// - `atteint:<étape>` (maison, H1A, H1B, L1A, L1B) à la **première** arrivée : la vitesse de progression décidée par le
//   porteur, la seule mesure gardée (anonyme) quand on supprime un compte. « maison » : la naissance du personnage ;
// - `vu:<clé>` la première fois qu'une clé entre dans le sac (l'idée « Tu y penses », `idee:<étape>`) ;
// - `niveau:<lignée>` quand une construction monte d'un niveau (la valeur : le niveau atteint ; les minutes en détail) ;
// - `fiche_bloquee:<construction>` : la fiche d'une construction ouverte sans pouvoir l'améliorer ;
// - `aide_coince` : l'aide « Je suis coincé » ouverte.

/** Les étapes du rythme de progression, dans l'ordre du parcours (§1.1). */
export const ETAPES_ATTEINTES: readonly EtapeMonde[] = ["maison", "H1A", "H1B", "L1A", "L1B"];

/** Les constats de l'interface que le client signale (chantier 13 : la fiche, l'aide), notés en faits. */
export const CONSTATS_INTERFACE = ["fiche_bloquee", "aide_coince"] as const;
export type ConstatInterface = (typeof CONSTATS_INTERFACE)[number];

export interface MesureDuFait {
  quoi: string;
  valeur: number;
  details?: Record<string, unknown>;
}

/** L'étape du monde d'un lieu (H1A pour la station ; maison pour le terrain), ou null. */
export function etapeDuLieu(lieu: string): EtapeMonde | null {
  for (const [etape, l] of Object.entries(ETAPES_LIEUX)) if (l === lieu) return etape as EtapeMonde;
  return null;
}

/** La lignée d'une étape (« feu », « abri », « coffre »…) et son niveau, ou null. */
export function ligneeDeLEtape(id: string): { lignee: string; niveau: number } | null {
  for (const e of [...VOIE_SURFACE, ...VOIE_CREUSEE]) if (e.id === id) return { lignee: "feu", niveau: e.niveau };
  for (const [type, etapes] of Object.entries(LIGNEES_INSTALLATIONS)) for (const e of etapes ?? []) if (e.id === id) return { lignee: type, niveau: e.niveau };
  return null;
}

/**
 * Les mesures qu'un fait fait écrire, et les faits à noter en plus (`atteint:<étape>`, pour ne l'écrire qu'une fois).
 * `faits` : les faits déjà comptés, avant celui-ci ; `minutes` : les minutes de jeu depuis la création du personnage.
 */
export function mesuresDuFait(fait: string, faits: Readonly<Record<string, number>>, minutes: number): { mesures: MesureDuFait[]; faits: string[] } {
  const m = Math.round(minutes * 10) / 10;
  const deux = fait.indexOf(":");
  const genre = deux < 0 ? fait : fait.slice(0, deux);
  const quoi = deux < 0 ? "" : fait.slice(deux + 1);
  switch (genre) {
    case "visite": {
      const mesures: MesureDuFait[] = [{ quoi: fait, valeur: m }];
      const etape = etapeDuLieu(quoi);
      const atteint = `${PREFIXE_ATTEINT}${etape}`;
      if (!etape || (faits[atteint] ?? 0) > 0) return { mesures, faits: [] };
      return { mesures: [...mesures, { quoi: atteint, valeur: m }], faits: [atteint] };
    }
    case "idee": {
      // L'idée naît au premier ramassage de la clé (ou en tenant l'outil clé) : `vu:<objet>`, ou `vu:<qualité>`.
      const cle = etapeAvecCle(quoi)?.etape.cle;
      const objet = cle?.objet ?? cle?.qualite?.qualite ?? quoi;
      return { mesures: [{ quoi: `vu:${objet}`, valeur: m, details: { etape: quoi } }], faits: [] };
    }
    case "niveau":
    case "foyer": {
      const l = ligneeDeLEtape(quoi);
      if (!l) return { mesures: [], faits: [] };
      return { mesures: [{ quoi: `niveau:${l.lignee}`, valeur: l.niveau, details: { etape: quoi, minutes: m } }], faits: [] };
    }
    case "fiche_bloquee": {
      // Rien de personnel dans une mesure : seulement un type de construction connu (sinon « ? »).
      const type = quoi === "feu" || Object.hasOwn(LIGNEES_INSTALLATIONS, quoi) ? quoi : "?";
      return { mesures: [{ quoi: `fiche_bloquee:${type}`, valeur: m }], faits: [] };
    }
    case "aide_coince":
      return { mesures: [{ quoi: fait, valeur: m }], faits: [] };
    default:
      return { mesures: [], faits: [] };
  }
}

/**
 * La naissance d'un personnage : `atteint:maison` (une fois), et `visite:terrain`. À appeler à chaque connexion ; il
 * ne se passe rien si l'étape est déjà notée.
 */
export function mesuresNaissance(faits: Readonly<Record<string, number>>, minutes: number): { mesures: MesureDuFait[]; faits: string[] } {
  if ((faits[`${PREFIXE_ATTEINT}maison`] ?? 0) > 0) return { mesures: [], faits: [] };
  return mesuresDuFait("visite:terrain", faits, minutes);
}
