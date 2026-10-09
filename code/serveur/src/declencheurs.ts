// Le moteur des déclencheurs (Book 25 §5.3, §6.3 et §10.3, chantier 2) : les pièges, la plaque de choc, la clôture.
//
// Une installation à déclencheur agit sur ce qui existe déjà, le corps des Éteints (Book 06 §2.2) : elle les raidit,
// les met à terre, leur brise la jambe (ils deviennent des Rampants), les tient sur place ou les fait reculer. Elle ne
// détruit jamais : il faut quelqu'un pour achever (Book 25 §5.1).
//
// Les chantiers 6 (plaque de choc, clôtures) et 7 (assommoir, mâchoires, fosse) déclarent leurs pièges ici, par
// `enregistrerDeclencheur`, sans toucher à eteints.ts ni à base.ts (Book 25 §10.4). Le joueur appelle `declencher`
// à chaque pas de calcul des Éteints de son terrain.

import { debout, mettreATerre, raidir, repousser, type Eteint } from "../../commun/src/eteints.ts";
import type { Zone } from "../../commun/src/lieux.ts";
import type { EtatDeclencheur } from "../../commun/src/messages.ts";

/** Ce qu'un déclencheur fait à l'Éteint qu'il prend. */
export type EffetDeclencheur =
  /** Une décharge (plaque, clôture) : il lâche et ne bouge plus. */
  | { genre: "raidir"; secondes: number }
  /** Un poids qui tombe, une décharge longue : à terre, il se relèvera. */
  | { genre: "mettre_a_terre"; secondes: number }
  /** Les mâchoires lui brisent la jambe : il devient un Rampant, pour de bon (Book 06 §2.2). */
  | { genre: "briser_jambe" }
  /** Tenu sur place : il se débat, n'avance plus. */
  | { genre: "tenir"; secondes: number }
  /** Il recule d'un pas (la clôture). */
  | { genre: "repousser"; metres: number };

/** Où il prend : autour d'un point, ou le long d'une ligne (une clôture, posée selon l'orientation `o`). */
export type FormeDeclencheur = { genre: "cercle"; rayon: number } | { genre: "ligne"; longueur: number; epaisseur: number };

export interface DefinitionDeclencheur {
  /** L'identifiant de l'installation (son `type`). */
  type: string;
  /** Pour les messages : « la plaque de choc », « les mâchoires ». */
  nom: string;
  forme: FormeDeclencheur;
  effets: EffetDeclencheur[];
  /** Combien de prises avant d'être désarmé (1 : un piège à réarmer) ; Infinity : toujours armé (la clôture). */
  prisesParArmement: number;
  /** Secondes avant de reprendre le même Éteint (une clôture qui raidit encore et encore). */
  intervalle: number;
  /** Il se fausse au bout de tant de prises (les mâchoires de fortune : 5) : il faut le refaire. */
  usure?: number;
  /** Tant d'Éteints à la fois dans sa zone le couchent (la clôture : trois qui poussent ensemble). */
  cede?: number;
  /** Ce que lit le joueur quand il prend quelqu'un (court : ≈ 60 caractères). */
  message?: string;
}

const REGISTRE = new Map<string, DefinitionDeclencheur>();

/** Déclarer un déclencheur (chantiers 6 et 7). Une seconde déclaration du même type remplace la première. */
export function enregistrerDeclencheur(def: DefinitionDeclencheur): void {
  REGISTRE.set(def.type, def);
}

export function definitionDeclencheur(type: string): DefinitionDeclencheur | undefined {
  return REGISTRE.get(type);
}

export function estDeclencheur(type: string): boolean {
  return REGISTRE.has(type);
}

/** L'état d'un déclencheur neuf : armé, aucune prise. */
export function declencheurNeuf(): EtatDeclencheur {
  return { arme: true, prises: 0 };
}

/** Une installation à déclencheur, telle que le moteur la voit. */
export interface DeclencheurPose {
  id: number;
  type: string;
  x: number;
  z: number;
  /** Orientation (radians) : le sens d'une ligne. */
  o: number;
  etat: EtatDeclencheur;
}

/** Ce qui s'est passé à un pas de calcul : à qui, quoi, et ce que devient le déclencheur. */
export interface Declenchement {
  declencheur: number;
  type: string;
  eteint: number;
  /** Il est désarmé (à réarmer), faussé (à refaire), ou couché (à relever). */
  desarme: boolean;
  fausse: boolean;
  couche: boolean;
}

/** Un point est-il dans la zone d'un déclencheur ? */
export function dansLaZone(forme: FormeDeclencheur, d: { x: number; z: number; o: number }, x: number, z: number): boolean {
  const dx = x - d.x;
  const dz = z - d.z;
  if (forme.genre === "cercle") return Math.hypot(dx, dz) <= forme.rayon;
  // La ligne part du centre dans les deux sens, selon l'orientation (comme une clôture posée).
  const ux = Math.sin(d.o);
  const uz = Math.cos(d.o);
  const long = dx * ux + dz * uz;
  const travers = Math.abs(dx * uz - dz * ux);
  return Math.abs(long) <= forme.longueur / 2 && travers <= forme.epaisseur;
}

/** Ce que fait un effet à un Éteint. */
export function appliquerEffet(e: Eteint, effet: EffetDeclencheur, de: { x: number; z: number }, zone: Zone): void {
  switch (effet.genre) {
    case "raidir":
      raidir(e, effet.secondes);
      return;
    case "mettre_a_terre":
      if (e.variante === "rampant") raidir(e, effet.secondes);
      else mettreATerre(e, effet.secondes);
      return;
    case "briser_jambe":
      // Un Rampant ne se relève plus (Book 06 §2.2) ; un piège ne détruit pas : il reste à l'achever.
      e.variante = "rampant";
      if (e.etat === "a_terre") e.etat = "poursuivant";
      e.saisit = null;
      e.tenue = 0;
      e.contact = 0;
      return;
    case "tenir":
      e.retenu = Math.max(e.retenu ?? 0, effet.secondes);
      return;
    case "repousser":
      repousser(e, de, effet.metres, 0.3, zone);
      return;
  }
}

/**
 * Un pas de calcul : chaque déclencheur armé prend les Éteints debout qui entrent dans sa zone. Modifie les Éteints et
 * l'état des déclencheurs ; rend ce qui s'est passé (le joueur sauve, prévient, fait entendre). `derniers` garde, par
 * déclencheur et par Éteint, l'instant (ms) de la dernière prise : on ne reprend pas le même avant `intervalle`.
 */
export function declencher(
  poses: readonly DeclencheurPose[],
  eteints: readonly Eteint[],
  instant: number,
  zone: Zone,
  derniers: Map<string, number> = new Map(),
): Declenchement[] {
  const faits: Declenchement[] = [];
  for (const d of poses) {
    const def = REGISTRE.get(d.type);
    const etat = d.etat;
    if (!def || !etat.arme || etat.fausse || etat.couche) continue;
    const dedans = eteints.filter((e) => debout(e) && e.etat !== "dormant" && dansLaZone(def.forme, d, e.x, e.z));
    // Trop nombreux à pousser ensemble : la clôture se couche (Book 06 §9.2), sans prendre personne.
    if (def.cede !== undefined && dedans.length >= def.cede) {
      etat.couche = true;
      etat.arme = false;
      faits.push({ declencheur: d.id, type: d.type, eteint: dedans[0]!.id, desarme: true, fausse: false, couche: true });
      continue;
    }
    for (const e of dedans) {
      const cle = `${d.id}:${e.id}`;
      if (instant - (derniers.get(cle) ?? -Infinity) < def.intervalle * 1000) continue;
      derniers.set(cle, instant);
      for (const effet of def.effets) appliquerEffet(e, effet, d, zone);
      etat.prises += 1;
      const fausse = def.usure !== undefined && etat.prises >= def.usure;
      const desarme = fausse || (Number.isFinite(def.prisesParArmement) && etat.prises % def.prisesParArmement === 0);
      if (fausse) etat.fausse = true;
      if (desarme) etat.arme = false;
      faits.push({ declencheur: d.id, type: d.type, eteint: e.id, desarme, fausse, couche: false });
      if (desarme) break;
    }
  }
  return faits;
}

/** Réarmer un déclencheur (A sur le piège) ; relever une clôture couchée. Faussé, il ne se réarme plus. */
export function rearmer(etat: EtatDeclencheur): boolean {
  if (etat.fausse) return false;
  etat.arme = true;
  etat.couche = false;
  return true;
}
