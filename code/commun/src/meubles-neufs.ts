// Les huit meubles nouveaux du niveau 2 (plan 0.10, chantier D ; N2-40, N2-41, N2-43 à N2-48 ; S-22 à S-30) : ce
// qu'ils font, en règles pures partagées par le serveur (qui juge, serveur/src/meubles-neufs.ts) et le client (qui
// montre). Chacun est ramené à un mécanisme qui existe déjà (§10.5 du plan) :
// - le cuiseur solaire = un foyer qui ne brûle rien : l'eau bouillie et les plats du foyer de pierres, deux fois plus
//   lents, au soleil et le jour seulement (moitié moins vite par temps voilé) ;
// - les bacs de tri = un bonus de proximité, comme le râtelier : démonter deux fois plus vite à 3 m, une matière de
//   plus un démontage sur trois ;
// - le creuset 🔥 = un accessoire de la forge ventilée et deux recettes (recettes/charbonniers.ts) ;
// - la rampe de LED ⚡ = une lumière posée, comme la lanterne fixe (20 m), qui tire 3 W sur la batterie de la base, la
//   nuit seulement ;
// - la batterie de cellules ⚡ = un type de batterie de 120 Wh (energie.ts) ;
// - la charrette à bras ⚙️ = la brouette avec + 100 kg (objets.ts) ;
// - le moulin de jerricans ⚙️ = un producteur comme le banc, au vent (energie.ts, `productionMoulin`) ;
// - l'arbalète de garde ⚙️ = un piège comme l'assommoir, qui tire un carreau (jamais sur un joueur).
// Le banc solaire qui suit le soleil (S-30) est dans energie.ts (`productionPanneau`).

import type { Temps } from "./meteo.ts";
import type { EtatInstallation } from "./messages.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import type { Recette } from "./recettes.ts";
import { LUMIERE_NUIT, type Stimulus } from "./signature.ts";

/** Une installation telle qu'on la regarde ici. */
export interface MeubleNeuf {
  type: string;
  x: number;
  z: number;
  o?: number;
  niveau?: number;
  etat: EtatInstallation;
}

// ---------- L'apparition (N2-Q3) ----------

/** Les lieux du niveau 2 : une première visite de l'un d'eux fait apparaître les deux meubles communs. */
export const LIEUX_NIVEAU_2 = ["route_pont", "grand_hotel", "corniche", "phare"] as const;

/** A-t-on déjà visité un lieu du niveau 2 (le fait `visite:<lieu>`) ? */
export function niveau2Visite(faits: Readonly<Record<string, number>>): boolean {
  return LIEUX_NIVEAU_2.some((l) => (faits[`visite:${l}`] ?? 0) > 0);
}

// ---------- Le cuiseur solaire (N2-40, S-22) ----------

/** Le cuiseur solaire sert à 2,5 m, comme un feu (lieu-recette.ts, PORTEE_FEU). */
export const PORTEE_CUISEUR = 2.5;

/**
 * Combien de fois plus lent que le foyer de pierres, selon le temps : deux fois au soleil, quatre fois par temps voilé
 * (à moitié) ; rien sous un ciel couvert, sous la pluie, ni la nuit (null).
 */
export function lenteurCuiseur(temps: Temps, nuit: boolean): number | null {
  if (nuit) return null;
  if (temps === "soleil") return 2;
  if (temps === "voile") return 4;
  return null;
}

/** Pourquoi le cuiseur ne chauffe pas (un message court), ou null s'il chauffe. */
export function refusCuiseur(temps: Temps, nuit: boolean): string | null {
  if (nuit) return "La nuit, le cuiseur solaire ne chauffe pas : il attend le soleil.";
  if (temps === "pluie") return "Sous la pluie, le cuiseur solaire ne chauffe pas.";
  if (temps === "couvert") return "Le ciel est couvert : le cuiseur solaire ne chauffe pas.";
  return null;
}

/**
 * Les recettes du cuiseur (S-22) : les plats du foyer de pierres, c'est-à-dire les recettes de cuisine (onglet Feu) qui
 * se font sur un foyer de pierres. Les mijotés de la crémaillère et le four n'y sont pas ; ce qui se durcit au feu non
 * plus (ce n'est pas un plat).
 */
export function seCuitAuSoleil(r: Pick<Recette, "lieu" | "categorie" | "produit">): boolean {
  return r.categorie === "feu" && "objet" in r.produit && r.lieu.genre === "construction" && r.lieu.construction === "feu" && (r.lieu.formes?.includes("foyer_pierres") ?? false);
}

/** Le cuiseur solaire le plus proche à portée (null : aucun). */
export function cuiseurProche<T extends MeubleNeuf>(de: { x: number; z: number }, installations: Iterable<T>): T | null {
  return plusProche(de, installations, (i) => i.type === "cuiseur_solaire", PORTEE_CUISEUR);
}

// ---------- Les bacs de tri (N2-41, S-23) ----------

/** Comme le râtelier : ils servent à 3 m (outils-a-portee.ts, PORTEE_OUTILS). */
export const PORTEE_BACS_TRI = 3;
/** Démonter va deux fois plus vite… */
export const VITESSE_BACS_TRI = 2;
/** … et rend une matière de plus, un démontage sur trois (tiré par le serveur). */
export const CHANCE_MATIERE_EN_PLUS = 1 / 3;

/** Des bacs de tri à moins de 3 m ? */
export function bacsTriProches(de: { x: number; z: number }, installations: Iterable<MeubleNeuf>): boolean {
  return plusProche(de, installations, (i) => i.type === "bacs_tri", PORTEE_BACS_TRI) !== null;
}

/**
 * La matière de plus d'un démontage aux bacs de tri : une fois sur trois (`alea` < 1/3), une unité de l'une des
 * matières qu'il donne (tirée au sort parmi elles, `alea2`). Rend ce qu'on ajoute (vide : rien cette fois).
 */
export function matiereEnPlus(donne: Inventaire, alea: number, alea2: number): Inventaire {
  if (alea >= CHANCE_MATIERE_EN_PLUS) return {};
  const matieres = (Object.entries(donne) as [TypeObjet, number][]).filter(([, n]) => (n ?? 0) > 0).map(([t]) => t);
  if (matieres.length === 0) return {};
  return { [matieres[Math.min(matieres.length - 1, Math.floor(alea2 * matieres.length))]!]: 1 };
}

// ---------- Le creuset et ses moules 🔥 (N2-43, S-24) ----------

/** Le creuset se pose sur la forge ventilée (le niveau 2 de la forge) : 4 glaises, 2 pierres, Marteler 1. */
export const COUT_CREUSET: Inventaire = { glaise: 4, pierre: 2 };
export const QUALITES_CREUSET = { marteler: 1 } as const;
export const NIVEAU_FORGE_CREUSET = 2;

// ---------- La rampe de LED ⚡ (N2-44, S-25) ----------

/** Elle éclaire 20 m (la lanterne fixe : 14) et tire 3 W sur la batterie de la base, la nuit seulement. */
export const RAMPE_LED = { portee: 20, watts: 3 } as const;

/** La rampe éclaire-t-elle ? La nuit, si la batterie de la base avait du courant (`etat.courant`, jugé par le serveur). */
export function rampeAllumee(i: Pick<MeubleNeuf, "type" | "etat">, nuit: boolean): boolean {
  return i.type === "rampe_led" && nuit && i.etat.courant === true;
}

/** Ce que les Éteints voient de loin : la rampe allumée, la nuit, comme une lanterne (LUMIERE_NUIT.lanterne). */
export function stimuliRampes(installations: Iterable<MeubleNeuf>, nuit: boolean): Stimulus[] {
  const s: Stimulus[] = [];
  for (const i of installations) if (rampeAllumee(i, nuit)) s.push({ genre: "lumiere", x: i.x, z: i.z, ...LUMIERE_NUIT.lanterne });
  return s;
}

// ---------- Le moulin de jerricans ⚙️ (N2-47, S-28) ----------

/** La poulie d'aluminium se pose sur son axe (un geste, comme le panneau sur le banc). */
export const POSER_POULIE_S = 8;

// ---------- L'arbalète de garde ⚙️ (N2-48, N2-Q5, S-29) ----------

/** Le fil tendu, à 1 m devant elle : 2 m de large. */
export const ARBALETE_GARDE = { devant: 1, largeur: 2, epaisseur: 0.35 } as const;
/** Réarmer : 2 s avec le cranequin léger dans le sac, 3 s sinon (comme l'arbalète à la main, tir.ts). */
export const REARMER_GARDE_S = { cranequin: 2, main: 3 } as const;

/** Le temps de réarmer l'arbalète de garde avec ce qu'on porte. */
export function dureeRearmerGarde(inventaire: Inventaire): number {
  return (inventaire.cranequin_leger ?? 0) > 0 ? REARMER_GARDE_S.cranequin : REARMER_GARDE_S.main;
}

/**
 * Un point est-il sur le fil de l'arbalète de garde ? Le fil passe à 1 m devant elle (selon son orientation `o`, vers
 * +z quand o = 0, comme une clôture), en travers, sur 2 m.
 */
export function surLeFil(a: Pick<MeubleNeuf, "x" | "z" | "o">, x: number, z: number): boolean {
  const o = a.o ?? 0;
  const ux = Math.sin(o);
  const uz = Math.cos(o);
  const dx = x - a.x;
  const dz = z - a.z;
  const long = dx * ux + dz * uz;
  const travers = dx * uz - dz * ux;
  return Math.abs(long - ARBALETE_GARDE.devant) <= ARBALETE_GARDE.epaisseur && Math.abs(travers) <= ARBALETE_GARDE.largeur / 2;
}

// ---------- Outils ----------

function plusProche<T extends MeubleNeuf>(de: { x: number; z: number }, installations: Iterable<T>, garder: (i: T) => boolean, portee: number): T | null {
  let meilleur: T | null = null;
  let d = portee + 1e-9;
  for (const i of installations) {
    if (!garder(i)) continue;
    const di = Math.hypot(i.x - de.x, i.z - de.z);
    if (di <= d) {
      d = di;
      meilleur = i;
    }
  }
  return meilleur;
}
