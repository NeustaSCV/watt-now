// Faire évoluer et réparer une arme sur son meuble (plan 0.8, chantier 9 ; `armes-par-niveau.md` R-ARMES-4 et R-ARMES-5).
//
// Le geste « Reprendre l'arme » : près de son meuble, on choisit l'arme qu'on porte, et le meuble propose
// - de la **réparer** à son niveau (l'usure revient à neuf) : l'atelier de sa matière (`ATELIER_REPARATION`, combat.ts :
//   le bois à l'établi, les lames à la meule ou à la forge, le métal à la forge, l'électrique au banc solaire, le manche
//   à l'établi à étau, sans forge, pour toutes les familles) ;
// - de la **monter d'une étoile**, si le meuble et les pièces le permettent (l'arbalète ★ → ★★ avec un arc d'arbalète
//   en lame de ressort). L'exemplaire garde son identité : son usure revient à neuf, sa clé `type#n` change d'étoile. On
//   ne fabrique plus une seconde arme pour une meilleure étoile.
//
// Les étoiles atteignables viennent de la grille (`PLAFONDS_NIVEAU_1`, armes/grille.ts, chantier 8) : un meuble ne monte
// jamais une arme au-delà de ce que sa recette donne au niveau 1 ; au-dessus, seule la maîtrise le fait (K-Q1). La forge
// sans enclume (sa pierre plate) ne donne que ★ (Q-0.8-1).
//
// Ce module n'a que des règles pures : le serveur les applique (serveur/src/evolution-armes.ts), le client s'en sert
// pour montrer le bouton « Reprendre » du sac près d'un meuble (client/src/hud.ts).

import { ATELIER_REPARATION, MATIERE_ARME, armeDeCle, lieuAtelier, nomsAteliers, type AtelierReparation } from "./combat.ts";
import { ETOILES_MAX, etoilesTexte, exemplaireUneEtoileDePlus, exemplaires, lireCle, type CleObjet, type Etoiles } from "./etoiles.ts";
import { etoilesForge } from "./forge.ts";
import { PLAFONDS_NIVEAU_1 } from "./armes/grille.ts";
import { refusLieu, type Alentours, type InstallationPourLieu } from "./lieu-recette.ts";
import { OBJETS, nommer, type Inventaire, type TypeObjet } from "./objets.ts";
import type { GesteRepriseArme } from "./messages.ts";
import type { LieuRecette, TypeInstallation } from "./recettes.ts";
import { aCote } from "./recettes/lieux.ts";
import { armeTirDe, armeTirExemplaire } from "./tir.ts";

/** Les deux propositions du meuble (le type du message, messages.ts). */
export type GesteReprise = GesteRepriseArme;

/** La durée du geste au meuble, en secondes réelles (avant `gestes_vitesse`) : remettre à neuf, monter d'une étoile. */
export const DUREE_REPARER_S = 15;
export const DUREE_MONTER_S = 30;

// ---------- Monter d'une étoile : le meuble de chaque arme ----------

/** Comment une arme monte d'une étoile sur son meuble. */
export interface MonteeArme {
  /** Le meuble (une construction de la base, à son niveau), et son nom avec l'article (« le foyer de forge »). */
  meuble: TypeInstallation;
  niveau?: number;
  nom: string;
  /**
   * La pièce qu'on change et qui fait l'étoile (le maillon faible de la recette) : il en faut un exemplaire d'au moins
   * l'étoile visée (l'arc d'arbalète, le module de décharge, la corde d'arc). Absente : c'est le meuble qui fait l'étoile
   * (la lame reprise sur l'enclume).
   */
  piece?: TypeObjet;
  /** Ce que le geste consomme en plus. */
  cout?: Inventaire;
  /** Le nom du geste : « Changer l'arc », « Reprendre la lame sur l'enclume ». */
  geste: string;
  /** La pose du personnage pendant le geste (les poses existantes). */
  pose: "outil" | "lourd";
}

/** La lame reprise sur l'enclume du foyer de forge : chauffer, redresser, retremper ; un kilo de charbon. */
const LAME_A_LA_FORGE: MonteeArme = { meuble: "forge", nom: "le foyer de forge", cout: { charbon_bois: 1 }, geste: "Reprendre la lame sur l'enclume", pose: "lourd" };

/**
 * Les armes qui montent sur un meuble, et comment (plan 0.8 §2.4 et §3, chantier 9) : la forge pour une lame, le banc
 * solaire pour une matraque, l'établi pour une arbalète ou un arc. Une arme absente ne monte que par la maîtrise (la
 * matraque de fortune, l'arc de fortune) ou pas du tout (les armes sans étoiles).
 */
export const MONTEES_ARMES: Partial<Record<TypeObjet, MonteeArme>> = {
  // 🔥 Les lames : le foyer de forge les mène à ★★ sur une enclume (ETOILES_FOYER), ★ sur sa pierre plate.
  machette_forgee: LAME_A_LA_FORGE,
  hachette: LAME_A_LA_FORGE,
  serpe: LAME_A_LA_FORGE,
  lame_forgee: LAME_A_LA_FORGE,
  // ⚡ La matraque électrique : on change le module de décharge (le flash ★, la raquette ★★).
  matraque_electrique: { meuble: "banc_recharge", nom: "le banc solaire", piece: "module_decharge", geste: "Changer le module", pose: "outil" },
  // ⚙️ L'arbalète : on change l'arc (le frêne ★, la lame de ressort ★★).
  arbalete: { meuble: "etabli", nom: "l'établi", piece: "arc_arbalete", geste: "Changer l'arc", pose: "outil" },
  // L'arc pour tous : la corde fait l'étoile (I13 : joncs ou ficelle ★★, fil dentaire ou boyau ★★★).
  arc_simple: { meuble: "etabli", nom: "l'établi", piece: "corde_arc", geste: "Changer la corde", pose: "outil" },
  arc_if: { meuble: "etabli", nom: "l'établi", piece: "corde_arc", geste: "Changer la corde", pose: "outil" },
};

/** Le lieu d'une montée, comme celui d'une recette. */
export function lieuMontee(m: MonteeArme): LieuRecette {
  return aCote(m.meuble, m.niveau ? { niveau: m.niveau } : {});
}

/**
 * Ce que le meuble lui-même permet, en étoiles (au-delà, il ne monte pas l'arme, quelles que soient les pièces) : la
 * forge, ce que donnent son enclume et son niveau (`etoilesForge` : ★★ au foyer sur une enclume, ★ sur la pierre
 * plate) ; les autres meubles laissent la pièce et la grille décider.
 */
export function etoilesDuMeuble(meuble: InstallationPourLieu, inventaire: Inventaire): number {
  if (meuble.type === "forge") return etoilesForge(inventaire, { type: "forge", ...(meuble.niveau ? { niveau: meuble.niveau } : {}), etat: meuble.etat });
  return ETOILES_MAX;
}

// ---------- Ce que le meuble propose ----------

/** L'état d'un exemplaire, de 0 à 1 (1 : neuf), pour une arme de contact comme pour une arme de tir. */
export function etatExemplaire(cle: string, usure: Partial<Record<string, number>>): number {
  const solidite = soliditeDe(cle);
  if (solidite === null || !Number.isFinite(solidite)) return 1;
  return Math.max(0, Math.min(1, (usure[cle] ?? solidite) / solidite));
}

/** La solidité d'un exemplaire (null : ce n'est pas une arme). */
export function soliditeDe(cle: string): number | null {
  const contact = armeDeCle(cle);
  if (contact) return contact.solidite;
  const tir = armeTirDe(lireCle(cle).type);
  return tir ? armeTirExemplaire(cle, tir).solidite : null;
}

/** Le nom d'une arme pour les messages : « l'arbalète », « la machette forgée ». */
export function nomArme(cle: string): string {
  const type = lireCle(cle).type;
  return armeDeCle(cle)?.nom ?? armeTirDe(type)?.nom ?? OBJETS[type]?.nom ?? type;
}

/** Une proposition du meuble : faisable, ou la phrase qui dit ce qui manque. */
export interface PropositionReprise {
  possible: boolean;
  /** Ce qui manque (absent quand c'est possible). */
  raison?: string;
  /** Ce que le geste consomme (la pièce comprise, pour une montée). */
  cout: Inventaire;
  /** Le libellé du geste (« Affûter : la machette forgée »). */
  geste: string;
  /** La pose du personnage pendant le geste. */
  pose: "outil" | "lourd";
  dureeS: number;
}

/** Réparer : l'atelier choisi (le premier à portée dont on a de quoi payer). */
export interface Reparation extends PropositionReprise {
  atelier?: AtelierReparation;
}

/** Monter d'une étoile : les étoiles visées, la clé d'après, la pièce prise dans le sac. */
export interface Montee extends PropositionReprise {
  cible?: Etoiles;
  apres?: CleObjet;
  piece?: CleObjet;
}

/** Tout ce que les meubles d'à côté proposent pour un exemplaire. */
export interface Reprise {
  cle: CleObjet;
  etoiles: Etoiles | null;
  etat: number;
  /** Un meuble de cette arme est-il à portée (3 m) ? Sinon, le geste est refusé, et le sac ne montre pas « Reprendre ». */
  aPortee: boolean;
  /** Où se reprend cette arme, en toutes lettres (« l'établi », « la forge »), pour le sac et les refus. */
  ou: string;
  reparer: Reparation;
  /** null : cette arme ne monte jamais sur un meuble (sans étoiles, ou seulement par la maîtrise et rien à proposer). */
  monter: Montee | null;
}

/** A-t-on tout cela dans le sac ? */
function aDeQuoi(inventaire: Inventaire, objets: Inventaire): boolean {
  return Object.entries(objets).every(([t, n]) => (inventaire[t as CleObjet] ?? 0) >= (n ?? 0));
}

/** « une branche, 1 kg de charbon de bois ». */
function liste(objets: Inventaire): string {
  return (Object.entries(objets) as [CleObjet, number][]).map(([t, n]) => nommer(t, n)).join(", ");
}

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Les installations d'une sorte, au niveau voulu, à portée (3 m). */
function meublesAPortee(lieu: LieuRecette, a: Alentours): InstallationPourLieu[] {
  if (lieu.genre !== "construction") return [];
  return [...a.installations].filter((i) => i.type === lieu.construction && refusLieu(lieu, { ...a, installations: [i] }) === null);
}

/** Réparer à son niveau : le premier atelier de sa matière, à portée, dont on a de quoi payer. */
function propositionReparer(cle: CleObjet, etat: number, a: Alentours): Reparation {
  const matiere = MATIERE_ARME[lireCle(cle).type];
  const nom = nomArme(cle);
  const neutre: Reparation = { possible: false, cout: {}, geste: `Remettre à neuf : ${nom}`, pose: "outil", dureeS: DUREE_REPARER_S };
  if (!matiere) return { ...neutre, raison: "Ça ne se répare pas." };
  if (etat >= 1) return { ...neutre, raison: "Elle est comme neuve." };
  const proches = ATELIER_REPARATION[matiere].filter((atelier) => refusLieu(lieuAtelier(atelier), a) === null);
  if (proches.length === 0) return { ...neutre, raison: `Pour la remettre à neuf, il faut ${nomsAteliers(matiere)}, chez toi.` };
  const atelier = proches.find((p) => !p.cout || aDeQuoi(a.inventaire, p.cout));
  const pose = (p: AtelierReparation) => (p.installation === "forge" ? "lourd" : "outil");
  if (!atelier) {
    const p = proches[0]!;
    return { ...neutre, atelier: p, pose: pose(p), cout: p.cout ?? {}, raison: `${majuscule(p.geste ?? "Remettre à neuf")} à ${p.nom} : il faut ${liste(p.cout ?? {})}.` };
  }
  return { possible: true, atelier, cout: atelier.cout ?? {}, geste: `${atelier.geste ?? "Remettre à neuf"} : ${nom}`, pose: pose(atelier), dureeS: DUREE_REPARER_S };
}

/**
 * Monter d'une étoile : la grille du niveau 1 d'abord (la recette ne monte jamais au-delà de son plafond), puis le
 * meuble à portée et ce qu'il permet, puis la pièce et le reste du coût. null : l'arme ne monte pas sur un meuble.
 */
function propositionMonter(cle: CleObjet, a: Alentours): Montee | null {
  const { type, etoiles } = lireCle(cle);
  const m = MONTEES_ARMES[type];
  const plafond = PLAFONDS_NIVEAU_1[type];
  if (etoiles === null || !plafond) return null;
  const nom = nomArme(cle);
  const apres = exemplaireUneEtoileDePlus(cle);
  const cible = (etoiles + 1) as Etoiles;
  const neutre: Montee = { possible: false, cout: { ...(m?.cout ?? {}) }, geste: `${m?.geste ?? "Monter"} : ${nom}`, pose: m?.pose ?? "outil", dureeS: DUREE_MONTER_S };
  if (!apres || etoiles >= ETOILES_MAX) return { ...neutre, raison: "Elle est au plus haut." };
  // La grille (chantier 8) : la recette du niveau 1 plafonne ; au-dessus, la maîtrise seule (K-Q1).
  if (!m || plafond.recette === null || cible > plafond.recette) {
    const parMaitrise = plafond.maitrise !== null && cible <= plafond.maitrise;
    const qui = m ? majuscule(m.nom) : "Aucun meuble";
    return {
      ...neutre,
      cible,
      raison: parMaitrise
        ? `${qui} ne la monte pas à ${etoilesTexte(cible)} : seule la maîtrise le fait (dix exemplaires fabriqués de la même sorte).`
        : `${qui} ne la monte pas à ${etoilesTexte(cible)} : ce sera pour plus tard.`,
    };
  }
  // Le meuble, à portée, à son niveau.
  const lieu = lieuMontee(m);
  const refus = refusLieu(lieu, a);
  if (refus) return { ...neutre, cible, raison: refus };
  // Ce que le meuble permet (la forge : son enclume).
  const capacite = Math.max(...meublesAPortee(lieu, a).map((i) => etoilesDuMeuble(i, a.inventaire)));
  if (capacite < cible) {
    const raison = m.meuble === "forge" && capacite <= 1
      ? `Sur la pierre plate du foyer, une lame ne passe pas ${etoilesTexte(1)} : pose une enclume.`
      : `${majuscule(m.nom)} ne la monte pas à ${etoilesTexte(cible)}.`;
    return { ...neutre, cible, raison };
  }
  // La pièce qui fait l'étoile : la moins bonne du sac qui l'atteint (on garde les meilleures).
  const cout: Inventaire = { ...(m.cout ?? {}) };
  let piece: CleObjet | undefined;
  if (m.piece) {
    piece = exemplaires(a.inventaire, m.piece).filter((e) => (e.etoiles ?? 0) >= cible).at(-1)?.cle;
    if (!piece) return { ...neutre, cible, apres, raison: `Pour ${etoilesTexte(cible)}, il te faut ${OBJETS[m.piece].nom} ${etoilesTexte(cible)} ou mieux.` };
    cout[piece] = (cout[piece] ?? 0) + 1;
  }
  if (!aDeQuoi(a.inventaire, cout)) return { ...neutre, cible, apres, cout, raison: `Pour ${etoilesTexte(cible)}, il te faut ${liste(cout)}.` };
  return { possible: true, cible, apres, ...(piece ? { piece } : {}), cout, geste: `${m.geste} : ${nom}`, pose: m.pose, dureeS: DUREE_MONTER_S };
}

/**
 * Ce que les meubles d'à côté proposent pour cet exemplaire : le réparer, le monter d'une étoile. `alentours` : la
 * position du joueur, les installations de son terrain (aucune ailleurs) et son sac.
 */
export function reprise(cle: CleObjet, alentours: Alentours, usure: Partial<Record<string, number>>): Reprise {
  // Les installations et les feux se relisent plusieurs fois : on les fige (le serveur prête des itérateurs).
  const a: Alentours = { ...alentours, installations: [...alentours.installations], feux: [...alentours.feux] };
  const { type, etoiles } = lireCle(cle);
  const etat = etatExemplaire(cle, usure);
  const matiere = MATIERE_ARME[type];
  const m = MONTEES_ARMES[type];
  const lieux = [...(matiere ? ATELIER_REPARATION[matiere].map(lieuAtelier) : []), ...(m ? [lieuMontee(m)] : [])];
  const aPortee = lieux.some((l) => refusLieu(l, a) === null);
  // Où elle se reprend : les ateliers de sa matière, et le meuble qui la monte s'il n'en est pas déjà un.
  const ateliers = matiere ? ATELIER_REPARATION[matiere] : [];
  const noms = [...ateliers.map((x) => x.nom), ...(m && !ateliers.some((x) => x.installation === m.meuble) ? [m.nom] : [])];
  const ou = noms.length > 1 ? `${noms.slice(0, -1).join(", ")} ou ${noms[noms.length - 1]}` : (noms[0] ?? "");
  return { cle, etoiles, etat, aPortee, ou, reparer: propositionReparer(cle, etat, a), monter: propositionMonter(cle, a) };
}

/** Peut-on reprendre cette arme sur un meuble (réparer, ou monter) ? Une arme qui n'a ni atelier ni montée : non. */
export function seReprend(cle: string): boolean {
  const type = lireCle(cle).type;
  return MATIERE_ARME[type] !== undefined || MONTEES_ARMES[type] !== undefined;
}
