// Le duel entre joueurs (0.11) : les règles pures, sans serveur (book/plans/duel-entre-joueurs.md, plan-duel.md §3 B et C).
// Le serveur (serveur/src/duel.ts) s'en sert pour juger ; les tests les essaient seules.
//
// - La jauge (D-5, D-6, D-14) : 100 points. Frapper sans arrêt en retire 4 par seconde avec la plus faible arme (les
//   poings) et 6 avec la plus forte : l'écart (× 1,5 au plus) se juge par seconde de combat ; la part d'un coup suit
//   donc la durée du coup (un couteau vif retire moins par coup qu'une masse lente) ; le coup appuyé retire plus, à
//   proportion de sa lenteur (pas d'avantage). Une morsure d'Éteint retire 18 points ; la saisie à trois vide la jauge.
// - La fin (§5, D-12) : un objet tiré au hasard dans le sac du perdant, une chance par unité, hors objets-clés des lieux,
//   clefs de porte, pièces de famille, sacs et ce qui roule.
// - Les phrases du serveur (D-9, D-23), mot pour mot.

import { estObjetCle } from "./economie.ts";
import { typeDe, type CleObjet } from "./etoiles.ts";
import { nommer, type Inventaire, type TypeObjet } from "./objets.ts";
import { ARMES, POINGS, type Arme } from "./combat.ts";

/** La jauge de duel, pleine (D-14). */
export const JAUGE_DUEL = 100;
/** Points retirés par seconde de coups ininterrompus : avec la plus faible arme, avec la plus forte (D-14 : × 1,5). */
export const TAUX_DUEL_MIN = 4;
export const TAUX_DUEL_MAX = 6;
/** Une morsure d'Éteint sur un duelliste (D-14 : sa part de la santé aujourd'hui). */
export const MORSURE_DUEL = 18;
/** Le perdant ne peut plus être provoqué pendant ce temps (§5, ms). */
export const PROTECTION_DUEL_MS = 45_000;
/** La fuite (D-4) : à plus de tant de mètres l'un de l'autre, pendant tant de temps, le duel est annulé. */
export const FUITE_DISTANCE = 25;
export const FUITE_MS = 10_000;

// ---------- Juger d'après ce que voyait celui qui frappe (chantier C) ----------

/** L'affichage des autres a ce retard chez le client (0.9 : l'affichage différé, ms). */
export const RECUL_AFFICHAGE_MS = 150;
/** Le rembobinage ne remonte jamais plus loin (ms). */
export const RECUL_MAX_MS = 300;
/** Chaque joueur garde ses positions de la dernière seconde (ms). */
export const TAMPON_POSITIONS_MS = 1000;

/** De combien remonter dans le temps pour juger la cible : 150 ms, plus la moitié du ping du frappeur, 300 ms au plus. */
export function reculDuCoup(pingMs: number): number {
  const ping = Number.isFinite(pingMs) && pingMs > 0 ? pingMs : 0;
  return Math.min(RECUL_MAX_MS, RECUL_AFFICHAGE_MS + ping / 2);
}

// ---------- La jauge ----------

/** Les dégâts par seconde d'une arme (coups simples ininterrompus) : ce qui range les armes entre elles. */
function parSeconde(a: Arme): number {
  return a.coup > 0 ? a.degatsTorse / (a.coup / 1000) : 0;
}

/** La plus faible et la plus forte arme de corps à corps, à leurs étoiles de base (les poings compris). */
const BORNES = (() => {
  const valeurs = [POINGS, ...ARMES].filter((a) => a.coup > 0).map(parSeconde);
  return { min: Math.min(...valeurs), max: Math.max(...valeurs) };
})();

/** Les points retirés par seconde de coups ininterrompus avec cette arme : de 4 (la plus faible) à 6 (la plus forte). */
export function tauxDuel(a: Arme): number {
  const t = BORNES.max > BORNES.min ? (parSeconde(a) - BORNES.min) / (BORNES.max - BORNES.min) : 0;
  return TAUX_DUEL_MIN + (TAUX_DUEL_MAX - TAUX_DUEL_MIN) * Math.max(0, Math.min(1, t));
}

/** La part de jauge que retire un coup qui touche : le taux de l'arme × la durée du coup (appuyé : plus long, plus fort). */
export function partDuCoup(a: Arme, appuye: boolean): number {
  return (tauxDuel(a) * (appuye ? a.coupAppuye : a.coup)) / 1000;
}

// ---------- Le tirage (§5, D-12) ----------

/**
 * Ce qui ne se gagne jamais en duel, en plus des objets-clés des lieux (`estObjetCle`) : les clefs de porte, les pièces
 * de famille, les sacs et ce qui roule (le perdant ne doit pas se retrouver avec un sac qui déborde).
 */
export const EXCLUS_DU_TIRAGE: readonly TypeObjet[] = [
  "cle_coffre",
  "cle_moulin",
  "panneau_solaire",
  "enclume_depanneur",
  "petit_alternateur",
  "sac_a_dos",
  "sac_fortune",
  "travois",
  "brouette",
  "charrette_bras",
];

/** Cet objet (ou cet exemplaire) peut-il être gagné en duel ? */
export function seGagneEnDuel(cle: CleObjet): boolean {
  const type = typeDe(cle);
  return !estObjetCle(type) && !EXCLUS_DU_TIRAGE.includes(type);
}

/** Le nombre d'unités qui peuvent être tirées dans ce sac. */
export function unitesTirables(inventaire: Inventaire): number {
  let n = 0;
  for (const [cle, k] of Object.entries(inventaire) as [CleObjet, number][]) if (k > 0 && seGagneEnDuel(cle)) n += Math.floor(k);
  return n;
}

/** L'objet tiré au hasard dans le sac du perdant, une chance par unité (`alea` dans [0, 1[) ; null : rien à prendre. */
export function tirerObjet(inventaire: Inventaire, alea: number): CleObjet | null {
  const total = unitesTirables(inventaire);
  if (total === 0) return null;
  let rang = Math.min(total - 1, Math.floor(Math.max(0, alea) * total));
  // Un ordre fixe (celui des clés triées) : le même tirage donne le même objet, quel que soit l'ordre du sac.
  for (const cle of (Object.keys(inventaire) as CleObjet[]).sort()) {
    const k = inventaire[cle] ?? 0;
    if (k <= 0 || !seGagneEnDuel(cle)) continue;
    if (rang < Math.floor(k)) return cle;
    rang -= Math.floor(k);
  }
  return null;
}

// ---------- Les phrases (D-9, D-23 : mot pour mot ; « Paul » et « machette » sont le pseudo et le nom de l'objet) ----------

/** Sans accents : la liste se compare ainsi (et « cle » n'est pas un mot montré au joueur). */
const sansAccents = (mot: string) => mot.normalize("NFD").replace(/\p{Diacritic}/gu, "");

/** Les premiers mots des noms d'objets au féminin (« sa machette », « son marteau »), sans accents. */
const FEMININS = new Set([
  "agrafeuse", "amanite", "balance", "balise", "bande", "barquette", "barre", "batterie", "bobine", "botte", "bougie",
  "bouteille", "boîte", "branche", "brique", "brosse", "brouette", "bâche", "bêche", "bûche", "calculatrice", "caméra",
  "canette", "carte", "casserole", "ceinture", "cellule", "chaise", "chambre", "charrette", "chaîne", "chute", "cle",
  "cocotte", "conserve", "corde", "couverture", "doudoune", "débroussailleuse", "ferraille", "ficelle", "flèche",
  "fontaine", "fourche", "gourde", "grille", "grosse", "guirlande", "hache", "hachette", "laisse", "lame", "lampe",
  "lance", "lanterne", "liasse", "lime", "machette", "machine", "masse", "matraque", "montre", "motte", "noix", "paire",
  "peluche", "perceuse", "perche", "petite", "pierre", "pile", "pinces", "piscine", "planche", "plaque", "poignée",
  "pointe", "poire", "pomme", "pommes", "porte", "portion", "poule", "poulie", "poêlée", "pyramide", "radio", "rallonge",
  "raquette", "résistance", "roue", "scie", "serpe", "serre", "soupe", "tente", "toile", "torche", "toupie", "télé",
  "télécommande", "tête", "trottinette", "vapoteuse", "volaille",
].map(sansAccents));

/** « sa machette », « son marteau », « son épieu » (`ta`/`ton` à la deuxième personne). */
export function avecPossessif(cle: CleObjet, personne: "sa" | "ta"): string {
  const nom = nommer(cle, 1).replace(/^l'/, "");
  const premier = nom.split(/[ -]/)[0]!.toLowerCase();
  const feminin = FEMININS.has(sansAccents(premier)) && !/^[aeiouyàâéèêëîïôûü]/.test(premier);
  const masculin = personne === "sa" ? "son" : "ton";
  return `${feminin ? personne : masculin} ${nom}`;
}

export const PHRASES_DUEL = {
  debut: (pseudo: string) => `Duel avec ${pseudo} !`,
  gagne: (cle: CleObjet) => `Duel gagné : tu prends ${avecPossessif(cle, "sa")}.`,
  gagneAuSol: (cle: CleObjet) => `Duel gagné : ${avecPossessif(cle, "sa")} est à tes pieds.`,
  gagneSacVide: "Duel gagné, mais son sac est vide.",
  perdu: (pseudo: string, cle: CleObjet) => `Duel perdu : ${pseudo} prend ${avecPossessif(cle, "ta")}.`,
  perduSacVide: "Duel perdu. Ton sac était vide.",
  fuite: "Trop loin : duel annulé.",
  partir: "Pas pendant un duel.",
  enDuel: "Ils sont en duel.",
  protege: "Il vient de perdre : laisse-le.",
  dieu: "On ne se bat pas avec Dieu.",
} as const;
