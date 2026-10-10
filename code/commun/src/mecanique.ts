// ⚙️ La mécanique des Mécanistes (Book 25 §6, chantier 7 · 0.6) : les règles pures que le serveur et le client
// partagent. L'arbalète et ses pièces (les étoiles de chaque facteur), le réarmement de l'arbalète lourde, les pièges
// (ce qu'ils font, ce que coûte leur réarmement), les accessoires du pédalier (ventilateur à manivelle, meule fine) ;
// depuis la 0.8 (chantier 7), le pédalier générateur : le petit alternateur de la station, monté sur la roue.
//
// Rien ici ne connaît le joueur : `serveur/src/mecanique.ts` applique, `commun/src/recettes/mecanistes.ts` fabrique.

import { exemplaires, etoilesDeBase, type Etoiles } from "./etoiles.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import type { EtatInstallation } from "./messages.ts";
import type { ArmeTir } from "./tir.ts";
import { REGLAGES } from "./reglages.ts";

// ---------- Les étoiles des pièces (Book 25 §6.1, règle du maillon faible) ----------

/**
 * Les étoiles de l'exemplaire qu'une recette prendra dans le sac : le moins bon (une recette ne prend jamais la
 * meilleure pièce, `retirerExemplaires`). Sans exemplaire, les étoiles de base de l'objet.
 */
export function etoilesDuMoinsBon(inventaire: Inventaire, type: TypeObjet): Etoiles {
  const piles = exemplaires(inventaire, type);
  return piles.at(-1)?.etoiles ?? etoilesDeBase(type);
}

/**
 * L'arbrier : la scie du kit suffit (★★★★) ; le ciseau à bois d'un Charbonnier (Tailler le bois 2) y taille une vraie
 * mortaise : une étoile de plus (Book 25 §2.5).
 */
export function etoilesArbrier(inventaire: Inventaire): Etoiles {
  return (inventaire.ciseau_bois ?? 0) > 0 ? 5 : 4;
}

/** Les étoiles de la noix selon sa matière (Book 25 §6.1) : bois ★★, os ★★★, acier forgé (rivets) ★★★★. */
export const ETOILES_NOIX = { bois: 2, os: 3, forgee: 4 } as const satisfies Record<string, Etoiles>;

/** Les étoiles de l'arc d'arbalète selon sa matière (Book 25 §6.1) : frêne ★, lame brute ★★, if ★★★, retrempé ★★★★. */
export const ETOILES_ARC_ARBALETE = { frene: 1, ressort: 2, if: 3, retrempe: 4 } as const satisfies Record<string, Etoiles>;

/** Monter une arbalète légère : le maillon faible de l'arbrier, de la noix et de l'arc pris dans le sac. */
export function facteursArbalete(inventaire: Inventaire): number[] {
  return [etoilesDuMoinsBon(inventaire, "arbrier"), etoilesDuMoinsBon(inventaire, "noix_detente"), etoilesDuMoinsBon(inventaire, "arc_arbalete")];
}

/** Monter une arbalète lourde : deux ressorts retrempés (★★★★), l'arbrier et la noix. */
export function facteursArbaleteLourde(inventaire: Inventaire): number[] {
  return [etoilesDuMoinsBon(inventaire, "arbrier"), etoilesDuMoinsBon(inventaire, "noix_detente"), ETOILES_ARC_ARBALETE.retrempe];
}

// ---------- Réarmer une arbalète (Book 25 §6.1 et §8.3) ----------

/** Comment on réarme : en combien de temps, et avec quel outil (null : à la main ou au pied, dans l'étrier). */
export interface Rearmement {
  ms: number;
  outil: TypeObjet | null;
}

/**
 * Comment réarmer cette arme avec ce qu'on a dans le sac : la légère, au pied ; la lourde, trop raide pour le pied,
 * au meilleur outil qu'on ait (le cranequin 4 s, le pied-de-biche 6 s). null : il manque l'outil.
 */
export function rearmement(arme: Pick<ArmeTir, "rechargeMs" | "rearmerAvec">, inventaire: Inventaire): Rearmement | null {
  // Le réglage d'équilibre du test (Book 25 §8.4, chantier 9) : à 1 par défaut.
  const k = REGLAGES.equilibre_arbalete_rearmer;
  if (!arme.rearmerAvec?.length) return { ms: Math.round(arme.rechargeMs * k), outil: null };
  let meilleur: Rearmement | null = null;
  for (const o of arme.rearmerAvec) {
    if ((inventaire[o.objet] ?? 0) > 0 && (!meilleur || o.ms < meilleur.ms)) meilleur = { ms: o.ms, outil: o.objet };
  }
  return meilleur && { ...meilleur, ms: Math.round(meilleur.ms * k) };
}

// ---------- Les pièges (Book 25 §6.3) ----------

/** Les pièges mécaniques : des installations à déclencheur (serveur/src/declencheurs.ts). */
export const PIEGES_MECANIQUES = ["assommoir", "machoires_fortune", "piege_machoires", "fosse_pieux"] as const;
export type PiegeMecanique = (typeof PIEGES_MECANIQUES)[number];

export function estPiegeMecanique(type: string): type is PiegeMecanique {
  return (PIEGES_MECANIQUES as readonly string[]).includes(type);
}

/** Réarmer un piège (A sur le piège) : la durée réelle (s) et l'endurance (Book 25 §6.3). */
export const REARMER_PIEGE: Record<PiegeMecanique, { secondes: number; endurance: number; geste: string }> = {
  assommoir: { secondes: 4, endurance: 6, geste: "Remonter les bûches de l'assommoir" },
  machoires_fortune: { secondes: 10, endurance: 15, geste: "Réarmer les mâchoires" },
  piege_machoires: { secondes: 8, endurance: 12, geste: "Réarmer les mâchoires" },
  // La fosse : on en sort le corps, on replace les pieux et le couvert de branches.
  fosse_pieux: { secondes: 6, endurance: 10, geste: "Dégager la fosse" },
};

// ---------- Les accessoires du pédalier (Book 25 §6.4) ----------

export type AccessoirePedalier = "soufflet" | "meule_fine";

export interface DefinitionAccessoirePedalier {
  nom: string;
  /** Ce qu'il coûte à monter (rendu au démontage du pédalier). */
  cout: Inventaire;
  /** Le geste, en secondes réelles. */
  secondes: number;
  /** Il faut d'abord la meule (la meule fine se pose sur elle). */
  apresMeule?: true;
  /** Il faut serrer les brides (la clé plate du kit). */
  serrer?: true;
}

export const ACCESSOIRES_PEDALIER: Record<AccessoirePedalier, DefinitionAccessoirePedalier> = {
  // Une roue de vélo en volant, une bâche en poche d'air, quatre branches de bâti : posé à moins de 3 m d'une forge,
  // il souffle tant qu'on pédale (l'autre voie que le ventilateur des Voltaïques).
  // Le ventilateur à manivelle (Q-0.8-13 : « soufflet » est réservé au soufflet de forge) ; l'identifiant ne change pas.
  soufflet: { nom: "le ventilateur à manivelle", cout: { roue_velo: 1, bache: 1, branche: 4 }, secondes: 30, serrer: true },
  // Une pierre fine et un chiffon (le cuir de l'affûteur) : l'affûtage donne un fil de rasoir.
  meule_fine: { nom: "la meule fine", cout: { pierre: 1, chiffons: 1 }, secondes: 15, apresMeule: true },
};

/** L'accessoire est-il monté sur ce pédalier ? */
export function accessoireMonte(etat: EtatInstallation, a: AccessoirePedalier): boolean {
  return a === "soufflet" ? etat.soufflet === true : etat.meuleFine === true;
}

/**
 * Ce que rendent, au démontage d'un meuble de famille, les pièces montées dessus : les accessoires mécanistes du
 * pédalier, et la pièce de la station (plan 0.8, chantier 7) : le petit alternateur ⚙️, le panneau du banc solaire ⚡.
 */
export function rendDesAccessoires(etat: EtatInstallation): Inventaire {
  const r: Inventaire = {};
  for (const a of Object.keys(ACCESSOIRES_PEDALIER) as AccessoirePedalier[]) {
    if (!accessoireMonte(etat, a)) continue;
    for (const [t, n] of Object.entries(ACCESSOIRES_PEDALIER[a].cout)) r[t as TypeObjet] = (r[t as TypeObjet] ?? 0) + (n ?? 0);
  }
  if (etat.alternateur) r.petit_alternateur = (r.petit_alternateur ?? 0) + 1;
  if (etat.panneau) r.panneau_solaire = (r.panneau_solaire ?? 0) + 1;
  return r;
}

// ---------- Le pédalier générateur (plan 0.8, chantier 7) ----------

/** Monter le petit alternateur : serrer ses brides (la clé plate du kit), tendre la courroie sur la roue. */
export const MONTER_ALTERNATEUR = { secondes: 20, qualites: { serrer: 1 } } as const;

/** Le ventilateur à manivelle souffle sur une forge à moins de 3 m (Book 25 §6.4). */
export const PORTEE_SOUFFLET = 3;

/**
 * Une forge est-elle ventilée par un pédalier à soufflet tout proche ? Pour le chantier 5 (la forge ventilée sans
 * pomper, Book 25 §9.3) : il suffit d'appeler cette fonction avec les installations du terrain.
 */
export function souffletSur(forge: { x: number; z: number }, installations: Iterable<{ type: string; x: number; z: number; etat: EtatInstallation }>): boolean {
  for (const i of installations) {
    if (i.type === "pedalier" && i.etat.soufflet && Math.hypot(i.x - forge.x, i.z - forge.z) <= PORTEE_SOUFFLET) return true;
  }
  return false;
}

/** La meule fine : l'affûtage donne +10 % de dégâts, jusqu'à ce que la lame casse (Book 25 §6.4). */
export const BONUS_FIL_DE_RASOIR = 1.1;

