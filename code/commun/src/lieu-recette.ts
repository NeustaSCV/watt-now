// Le lieu d'une recette, vérifié (plan 0.8, chantier 1 ; `recettes-par-construction.md` §1.1). Une recette se fait à la
// main, se pose, ou se fait à côté d'une construction : au bon niveau de sa lignée, avec son accessoire, à 3 m (2,5 m et
// allumé pour un feu, de la bonne forme). Le serveur juge avec `refusLieu` ; le refus nomme ce qui manque (« Il te faut
// un foyer de pierres »). Le client s'en sert pour dire où se fait une recette (`texteLieu`).
//
// La carte des installations du dévoilement (`carteInstallations`) distingue les formes du feu (« feu:dakota »,
// « feu:foyer_pierres »…) et les accessoires montés (« forge+bac »), en plus du meilleur niveau de chaque type ;
// `lieuPossede` dit si cette carte suffit au lieu d'une recette (la recette est alors à portée, sinon grisée).

import type { EtatInstallation } from "./messages.ts";
import type { Inventaire } from "./objets.ts";
import { NOMS_INSTALLATIONS, type LieuRecette, type Recette, type TypeInstallation } from "./recettes.ts";
import { VOIE_CREUSEE, VOIE_SURFACE, formeFeu, lignee, niveauFeu, niveauInstallation, type FeuDansLignee, type FormeFeu } from "./lignees.ts";
import { accessoireDeNiveau } from "./meubles-niveau2.ts";

/** À quelle distance d'un feu on cuisine, on durcit (m). */
export const PORTEE_FEU = 2.5;
/** À quelle distance d'une construction on s'en sert (m). */
export const PORTEE_CONSTRUCTION = 3;

/** Les accessoires qu'un lieu peut demander, avec leur nom (et son article). */
export const NOMS_ACCESSOIRES: Readonly<Record<string, string>> = {
  // La forge (serveur/src/forge.ts) : l'huile est celle du bac, ou la graisse du sac.
  bac: "un bac de trempe",
  huile: "de l'huile",
  enclume: "une enclume",
  ventilateur: "un ventilateur",
  // Le pédalier : ses accessoires montés.
  meule: "une meule",
  meuleFine: "une meule fine",
  dynamo: "une dynamo",
  soufflet: "un ventilateur à manivelle",
  // L'établi.
  redresseur: "un redresseur de fûts",
  // Le niveau 2 (plan 0.10, chantier C) : les niveaux 2 du banc solaire et du pédalier (meubles-niveau2.ts).
  poste_montage: "un poste de montage",
  roulements: "des roulements montés",
  // Le feu.
  broche: "une broche",
  marmite: "une marmite norvégienne",
};

/** Les noms féminins des constructions et des accessoires (pour l'article). */
const FEMININS = ["forge", "meule", "alarme", "clôture", "plaque", "fosse", "torche", "réserve", "citerne", "hutte", "marmite", "broche", "enclume", "dynamo"];

function feminin(nom: string): boolean {
  return FEMININS.includes(nom.split(/[ -]/)[0]!.toLowerCase());
}

function minuscule(nom: string): string {
  return nom.charAt(0).toLowerCase() + nom.slice(1);
}

/** « un établi », « une forge ventilée ». */
function unNom(nom: string): string {
  return `${feminin(nom) ? "une" : "un"} ${nom}`;
}

/** « ton établi », « ta forge ventilée ». */
function tonNom(nom: string): string {
  return `${feminin(nom) ? "ta" : "ton"} ${nom}`;
}

/** Le nom d'une construction à ce niveau de sa lignée (« forge ventilée »), sinon son nom d'installation. */
export function nomConstruction(type: TypeInstallation, niveau = 1): string {
  const etape = niveau > 1 ? lignee(type)?.[niveau - 1] : undefined;
  return etape ? minuscule(etape.nom) : NOMS_INSTALLATIONS[type];
}

/** Le nom d'une forme de feu (« foyer de pierres »). */
export function nomFormeFeu(forme: FormeFeu): string {
  const etape = [...VOIE_SURFACE, ...VOIE_CREUSEE].find((e) => e.id === forme);
  return etape ? minuscule(etape.nom) : forme;
}

/** Les feux qui conviennent, nommés au plus simple : la plus basse forme de chaque voie (« un foyer de pierres ou un foyer Dakota »). */
export function nomFeuxDuLieu(formes: readonly FormeFeu[] | undefined): string {
  if (!formes || formes.length === 0) return "un feu";
  const premiers = [VOIE_SURFACE, VOIE_CREUSEE].map((voie) => voie.find((e) => formes.includes(e.id as FormeFeu))).filter((e) => e !== undefined);
  return premiers.map((e) => unNom(minuscule(e.nom))).join(" ou ");
}

/**
 * Où elle se fait, en quelques mots (« sur un foyer de pierres ou un foyer Dakota, allumé », « près d'un foyer de forge,
 * avec un bac de trempe ») ; vide à la main et pour ce qui se pose.
 */
export function ouSeFait(lieu: LieuRecette): string {
  if (lieu.genre !== "construction") return "";
  if (lieu.construction === "feu") return `sur ${nomFeuxDuLieu(lieu.formes)}, allumé${lieu.accessoire ? `, avec ${NOMS_ACCESSOIRES[lieu.accessoire] ?? lieu.accessoire}` : ""}`;
  const avec = lieu.accessoire ? (lieu.accessoire === "huile" ? ", à l'huile (graisse, ou huile dans le bac)" : `, avec ${NOMS_ACCESSOIRES[lieu.accessoire] ?? lieu.accessoire}`) : "";
  return `près d'${unNom(nomConstruction(lieu.construction, lieu.niveau))}${avec}`;
}

/** La même chose pour la carte d'une recette (« Près d'un établi. », « Sur un foyer de pierres, allumé. »), ou rien. */
export function texteLieu(r: Pick<Recette, "lieu">): string {
  const o = ouSeFait(r.lieu);
  return o ? `${o.charAt(0).toUpperCase()}${o.slice(1)}. ` : "";
}

// ---------- Ce qu'on a autour de soi ----------

/** Un feu tel que le lieu le regarde : sa forme, son état, ses accessoires. */
export interface FeuPourLieu extends FeuDansLignee {
  x: number;
  z: number;
  allume: boolean;
  bois: number;
  couvert?: boolean;
  /** Les accessoires montés : la table du serveur, ou la liste vue par le client. */
  accessoires?: Partial<Record<string, unknown>> | readonly string[];
}

/** Une construction telle que le lieu la regarde. */
export interface InstallationPourLieu {
  type: string;
  x: number;
  z: number;
  niveau?: number;
  etat: EtatInstallation;
}

/** Ce qu'il y a autour : la position du joueur, les feux et les installations de son terrain, son sac. */
export interface Alentours<F extends FeuPourLieu = FeuPourLieu> {
  x: number;
  z: number;
  feux: Iterable<F>;
  installations: Iterable<InstallationPourLieu>;
  inventaire: Inventaire;
}

function pres(a: { x: number; z: number }, b: { x: number; z: number }, d: number): boolean {
  return Math.hypot(a.x - b.x, a.z - b.z) <= d;
}

/** Un feu flambe-t-il (allumé, du bois, pas couvert) ? */
export function feuVif(f: FeuPourLieu): boolean {
  return f.allume && f.bois > 0 && !f.couvert;
}

/** Ce feu est-il de la forme (ou du niveau) que le lieu demande ? */
export function feuConvient(lieu: LieuRecette, f: FeuDansLignee): boolean {
  if (lieu.genre !== "construction" || lieu.construction !== "feu") return false;
  return lieu.formes ? lieu.formes.includes(formeFeu(f)) : niveauFeu(f) >= (lieu.niveau ?? 1);
}

/** Un accessoire est-il monté (l'huile : celle du bac, ou la graisse du sac) ? */
export function accessoireMonte(etat: EtatInstallation | Partial<Record<string, unknown>> | readonly string[] | undefined, accessoire: string, inventaire: Inventaire = {}): boolean {
  if (accessoire === "huile" && (inventaire.graisse ?? 0) > 0) return true;
  if (!etat) return false;
  if (Array.isArray(etat)) return etat.includes(accessoire);
  const v = (etat as Record<string, unknown>)[accessoire];
  return v === true || (typeof v === "number" && v > 0) || (typeof v === "string" && v !== "") || (typeof v === "object" && v !== null);
}

/** Les feux allumés tout près qui conviennent à ce lieu (le serveur y prend le foyer de la cuisine). */
export function feuxDuLieu<F extends FeuPourLieu>(lieu: LieuRecette, a: Alentours<F>): F[] {
  return [...a.feux].filter((f) => feuVif(f) && pres(f, a, PORTEE_FEU) && feuConvient(lieu, f));
}

/**
 * Ce qui empêche de faire la recette ici (une phrase qui nomme ce qui manque), ou null. Le lieu seulement : les
 * ingrédients, les outils et le terrain se jugent à part.
 */
export function refusLieu(lieu: LieuRecette, a: Alentours): string | null {
  if (lieu.genre !== "construction") return null;
  if (lieu.construction === "feu") {
    const feux = [...a.feux].filter((f) => feuConvient(lieu, f));
    if (feux.length === 0) return `Il te faut ${nomFeuxDuLieu(lieu.formes)}.`;
    const proches = feux.filter((f) => pres(f, a, PORTEE_FEU));
    const nom = nomFormeFeu(formeFeu((proches[0] ?? feux[0])!));
    if (proches.length === 0) return `Approche-toi de ${tonNom(nom)} : ça se fait tout près du feu.`;
    if (!proches.some(feuVif)) return `Ça se fait sur un feu allumé : allume ${tonNom(nom)}${proches.some((f) => f.couvert) ? " (ou ranime-le)" : ""}.`;
    if (lieu.accessoire && !proches.some((f) => feuVif(f) && accessoireMonte(f.accessoires, lieu.accessoire!, a.inventaire))) {
      return `Il te faut ${NOMS_ACCESSOIRES[lieu.accessoire] ?? lieu.accessoire} sur ${tonNom(nom)}.`;
    }
    return null;
  }
  const type = lieu.construction;
  const niveau = lieu.niveau ?? 1;
  const nom = nomConstruction(type, niveau);
  const memes = [...a.installations].filter((i) => i.type === type);
  if (memes.length === 0) return `Il te faut ${unNom(nom)}.`;
  const auNiveau = memes.filter((i) => niveauInstallation(i) >= niveau);
  if (auNiveau.length === 0) return `Il te faut ${unNom(nom)} : améliore ${tonNom(NOMS_INSTALLATIONS[type])} (Examiner).`;
  const proches = auNiveau.filter((i) => pres(i, a, PORTEE_CONSTRUCTION));
  if (proches.length === 0) return `Approche-toi de ${tonNom(nom)}.`;
  if (lieu.accessoire && !proches.some((i) => accessoireDeNiveau(i, lieu.accessoire!) || accessoireMonte(i.etat, lieu.accessoire!, a.inventaire))) {
    if (lieu.accessoire === "huile") return "Ça se trempe à l'huile : de la graisse dans ton sac, ou de l'huile dans le bac de trempe.";
    return `Il te faut ${NOMS_ACCESSOIRES[lieu.accessoire] ?? lieu.accessoire} à ${tonNom(nom)}.`;
  }
  return null;
}

// ---------- La carte des installations (le dévoilement) ----------

/** Les accessoires d'installation que la carte retient (« forge+bac »). */
// « panneau » et « alternateur » : les pièces du banc solaire et du pédalier générateur (le dévoilement les lit, §9.2).
const ACCESSOIRES_CARTE = ["bac", "huile", "enclume", "ventilateur", "meule", "meuleFine", "dynamo", "soufflet", "redresseur", "poste_montage", "roulements", "panneau", "alternateur"];

/**
 * La carte des installations d'un terrain, pour le dévoilement : chaque type à son niveau ; « feu » au meilleur niveau
 * (comme avant la 0.8), et chaque forme de feu à part (« feu:foyer_pierres », « feu:dakota ») ; les accessoires montés
 * (« forge+bac », « feu+marmite »). Le dévoilement garde le meilleur niveau par clé.
 */
export function carteInstallations(installations: Iterable<{ type: string; niveau?: number; etat?: EtatInstallation }>, feux: Iterable<FeuDansLignee & { accessoires?: FeuPourLieu["accessoires"] }>): { type: string; niveau: number }[] {
  const carte: { type: string; niveau: number }[] = [];
  for (const i of installations) {
    const niveau = i.niveau ?? 1;
    carte.push({ type: i.type, niveau });
    for (const acc of ACCESSOIRES_CARTE) if (accessoireDeNiveau(i, acc) || accessoireMonte(i.etat, acc)) carte.push({ type: `${i.type}+${acc}`, niveau });
  }
  for (const f of feux) {
    carte.push({ type: "feu", niveau: niveauFeu(f) }, { type: `feu:${formeFeu(f)}`, niveau: 1 });
    for (const acc of ["broche", "marmite"]) if (accessoireMonte(f.accessoires, acc)) carte.push({ type: `feu+${acc}`, niveau: 1 });
  }
  return carte;
}

/**
 * Cette carte (clé → meilleur niveau, voir `carteInstallations`) suffit-elle au lieu de la recette ? À la main et
 * posée : oui. L'huile se contente de la forge (la graisse du sac suffit à tremper).
 */
export function lieuPossede(lieu: LieuRecette, carte: ReadonlyMap<string, number>): boolean {
  if (lieu.genre !== "construction") return true;
  if (lieu.construction === "feu") {
    if (lieu.formes) return lieu.formes.some((f) => carte.has(`feu:${f}`)) && (!lieu.accessoire || carte.has(`feu+${lieu.accessoire}`));
    return (carte.get("feu") ?? 0) >= (lieu.niveau ?? 1);
  }
  const cle = lieu.accessoire && lieu.accessoire !== "huile" ? `${lieu.construction}+${lieu.accessoire}` : lieu.construction;
  return (carte.get(cle) ?? 0) >= (lieu.niveau ?? 1);
}
