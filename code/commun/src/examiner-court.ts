// La fiche « Examiner » courte (0.10.1, chantier E, D1 ; maquette `examiner-court`, variante V3 choisie par le porteur
// le 2026-10-16). Trois lignes au plus, seulement quand il y a quelque chose à dire :
// - « Sert à » : les fabrications **dévoilées** où l'objet entre (jamais une recette cachée), au plus 4, puis « et N
//   autres » ; « Rien que tu saches faire, pour l'instant. » pour un objet qui n'est pas une ordure et dont toutes les
//   recettes sont cachées ;
// - « Se monte sur » : une pièce qui ne sert qu'à se monter sur une installation (l'alternateur, le panneau solaire…) ;
// - « Outil » : ce que l'objet permet de faire, en verbes (« couper, visser »).
// Et, pour une installation, pourquoi elle ne marche pas (`raisonArret`) : seulement des phrases déjà dites dans le jeu,
// ou validées par le porteur. Calculs purs, sans le DOM : le dessin est dans client/src/hud.ts.

import { CAPACITES, bancDuPedalier, batterieDuBanc, type TypeBatterie } from "./energie.ts";
import { ENCLUMES } from "./forge.ts";
import { RAISON_PEDALIER_SANS_ORGANE } from "./mecanique.ts";
import { LIGNEES_INSTALLATIONS } from "./lignees.ts";
import type { EtatInstallation } from "./messages.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import type { VueProgression } from "./progression.ts";
import { NOMS_INSTALLATIONS, NOMS_QUALITES, QUALITES_OBJETS, RECETTES, recettesConnues, type Qualite, type Recette, type SavoirRecettes, type TypeInstallation } from "./recettes.ts";
import type { Famille } from "./regles.ts";
import { RECETTE_FEU } from "./survie.ts";
import { estOrdure } from "./vestiges.ts";

/** « Sert à » : au plus 4 fabrications nommées, puis « et 2 autres ». */
export const MAX_SERT_A = 4;

/** La phrase d'attente (validée par le porteur) : l'objet sert, mais à rien que l'on sache encore faire. */
export const RIEN_POUR_L_INSTANT = "Rien que tu saches faire, pour l'instant.";

/** Une ligne de la fiche : son titre (montré en petites capitales) et son texte. */
export interface LigneExamen {
  titre: "Sert à" | "Se monte sur" | "Outil";
  texte: string;
}

/** Ce que le joueur voit dans Fabriquer (null : un serveur d'avant la 0.7, tout ce qu'on connaît se montre). */
type Vue = Pick<VueProgression, "devoilees"> | null;

const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Le nom d'une recette sans sa parenthèse de variante : « Corde d'arc », pas trois fois. */
const nomCourt = (nom: string) => nom.replace(/\s*\(.*\)\s*$/, "");

/** Cette recette prend-elle cet objet (dans ses ingrédients, ou dans l'une de ses façons au choix) ? */
function prend(r: Recette, type: TypeObjet): boolean {
  return (r.ingredients[type] ?? 0) > 0 || (r.auChoix ?? []).some((c) => (c[type] ?? 0) > 0);
}

/** Les recettes que le joueur voit dans Fabriquer, comme le panneau (client/src/fabrication-arbre.ts) : connues, dévoilées, pas « plus tard ». */
function recettesVisibles(famille: Famille, savoir: SavoirRecettes, vue: Vue): Recette[] {
  const devoilees = vue ? new Set(vue.devoilees) : null;
  return recettesConnues(famille, savoir).filter((r) => !r.aVenir && (!devoilees || devoilees.has(r.id)));
}

/** La carte du feu de camp est-elle dans Fabriquer ? */
function feuVisible(vue: Vue): boolean {
  return !vue || vue.devoilees.includes("feu_de_camp");
}

/**
 * Les fabrications dévoilées où l'objet entre, sans doublon de variante (le feu de camp d'abord : il est dans Fabriquer
 * comme les autres). Jamais une recette cachée, ni d'une autre famille qu'on n'a pas apprise.
 */
export function fabricationsDe(type: TypeObjet, famille: Famille, savoir: SavoirRecettes, vue: Vue): string[] {
  const noms: string[] = [];
  if ((RECETTE_FEU[type] ?? 0) > 0 && feuVisible(vue)) noms.push("Feu de camp");
  for (const r of recettesVisibles(famille, savoir, vue)) {
    if (!prend(r, type)) continue;
    const nom = nomCourt(r.nom);
    if (!noms.includes(nom)) noms.push(nom);
  }
  return noms;
}

/** L'objet entre-t-il dans au moins une recette du jeu, cachée ou non (le feu de camp compte) ? */
function entreDansUneRecette(type: TypeObjet): boolean {
  return (RECETTE_FEU[type] ?? 0) > 0 || RECETTES.some((r) => prend(r, type));
}

/** « feu de camp, établi et coffre de rangement. » ; « a, b, c, d et 3 autres. » */
function liste(noms: readonly string[]): string {
  const vus = noms.slice(0, MAX_SERT_A).map(minuscule);
  const reste = noms.length - vus.length;
  if (reste > 0) return `${vus.join(", ")} et ${reste} autre${reste > 1 ? "s" : ""}.`;
  if (vus.length === 1) return `${vus[0]}.`;
  return `${vus.slice(0, -1).join(", ")} et ${vus.at(-1)}.`;
}

/**
 * La ligne « Sert à » (null : pas de ligne). Les fabrications dévoilées ; sinon, pour un objet qui n'est pas une
 * ordure et qui entre dans au moins une recette (toutes cachées), la phrase d'attente ; sinon rien.
 */
export function sertA(type: TypeObjet, famille: Famille, savoir: SavoirRecettes, vue: Vue): string | null {
  const noms = fabricationsDe(type, famille, savoir, vue);
  if (noms.length > 0) return liste(noms);
  if (!estOrdure(type) && entreDansUneRecette(type)) return RIEN_POUR_L_INSTANT;
  return null;
}

/** La ligne « Outil » : les qualités d'outil de l'objet, en verbes (« couper, visser ») ; null s'il n'en a pas. */
export function verbesOutil(type: TypeObjet): string | null {
  const q = Object.keys(QUALITES_OBJETS[type] ?? {}) as Qualite[];
  return q.length > 0 ? `${q.map((x) => NOMS_QUALITES[x].toLowerCase()).join(", ")}.` : null;
}

// ---------- « Se monte sur » ----------

/**
 * Les pièces qui se montent sur une installation sans être la clé d'une lignée (interaction.ts : « Installer la dynamo »,
 * « Monter le ventilateur », « Poser la poulie », « Poser les étagères », « Poser l'enclume »). Les clés des lignées
 * (l'alternateur, le panneau solaire, les roulements…) se lisent dans `LIGNEES_INSTALLATIONS`.
 */
const ACCESSOIRES: Partial<Record<TypeObjet, readonly TypeInstallation[]>> = {
  dynamo_velo: ["pedalier"],
  ventilateur_forge: ["forge"],
  poulie_aluminium: ["moulin_jerricans"],
  etageres: ["coffre"],
  ...Object.fromEntries(Object.values(ENCLUMES).map((e) => [e.objet, ["forge"] as const])),
};

/** Les installations sur lesquelles une pièce se monte (clé d'une étape jouable, ou accessoire). */
function installationsDeLaPiece(type: TypeObjet): TypeInstallation[] {
  const ou = new Set<TypeInstallation>(ACCESSOIRES[type] ?? []);
  for (const [inst, etapes] of Object.entries(LIGNEES_INSTALLATIONS) as [TypeInstallation, readonly { cle?: { objet?: TypeObjet }; aVenir?: unknown }[]][]) {
    if (etapes.some((e) => e.cle?.objet === type && !e.aVenir)) ou.add(inst);
  }
  return [...ou];
}

/** « le pédalier générateur », « l'établi », « la torche plantée ». */
function avecArticle(inst: TypeInstallation): string {
  const nom = NOMS_INSTALLATIONS[inst];
  if (/^[aeéèêiîoôuh]/i.test(nom)) return `l'${nom}`;
  const feminin: readonly TypeInstallation[] = ["torche_plantee", "charbonniere", "cloture_fortune", "cloture_electrique", "plaque_choc", "fosse_pieux", "rampe_led", "arbalete_garde", "decharge", "tour_perche"];
  return `${feminin.includes(inst) ? "la" : "le"} ${nom}`;
}

/**
 * La ligne « Se monte sur » (null : pas de ligne). Seulement pour une pièce qui ne sert qu'à se monter : ni ingrédient
 * d'une recette, ni outil ; et seulement sur une installation que le joueur sait bâtir (sa recette est dévoilée).
 */
export function seMonteSur(type: TypeObjet, famille: Famille, savoir: SavoirRecettes, vue: Vue): string | null {
  if (entreDansUneRecette(type) || QUALITES_OBJETS[type]) return null;
  const visibles = recettesVisibles(famille, savoir, vue);
  const connues = installationsDeLaPiece(type).filter((inst) => visibles.some((r) => "installation" in r.produit && r.produit.installation === inst));
  if (connues.length === 0) return null;
  return liste(connues.map(avecArticle));
}

/** Les lignes courtes d'un objet du sac, dans l'ordre de la fiche (vide : rien à dire). */
export function lignesObjet(type: TypeObjet, famille: Famille, savoir: SavoirRecettes, vue: Vue): LigneExamen[] {
  const lignes: LigneExamen[] = [];
  const monte = seMonteSur(type, famille, savoir, vue);
  const sert = sertA(type, famille, savoir, vue);
  // Une pièce à monter ne dit pas en plus « Rien que tu saches faire » : elle sert, sur son installation.
  if (sert && !(monte && sert === RIEN_POUR_L_INSTANT)) lignes.push({ titre: "Sert à", texte: sert });
  if (monte) lignes.push({ titre: "Se monte sur", texte: monte });
  const outil = verbesOutil(type);
  if (outil) lignes.push({ titre: "Outil", texte: outil });
  return lignes;
}

// ---------- Pourquoi une installation ne marche pas ----------

/**
 * La raison du pédalier sans batterie (validée par le porteur, 2026-10-16). Dans toutes les raisons, une espace
 * insécable avant « m » : la distance ne se coupe pas en fin de ligne (« 6 / m. » sur l'iPhone en paysage).
 */
export const RAISON_PEDALIER_SANS_BATTERIE = "Il lui faut une batterie : dans ton sac, ou un banc à moins de 3 m.";

/** Le pédalier est à moins de 3 m d'un banc dont la batterie a encore de la place (0.8.2, R17). */
export function pedalierChargeLeBanc(pedalier: { x: number; z: number }, installations: Iterable<{ type: string; x: number; z: number; etat: EtatInstallation }>): boolean {
  const banc = bancDuPedalier(pedalier, installations);
  const bat = banc ? batterieDuBanc(banc.etat) : null;
  return !!bat && bat.capacite - bat.wh > 0.5;
}

/**
 * Pourquoi cette installation ne marche pas, en une phrase (null : elle marche, ou rien à en dire). Les phrases sont
 * celles que le jeu disait déjà à l'examen (la clôture, la rampe de LED, la plaque, les mâchoires) ou en pédalant (le
 * pédalier qui n'entraîne rien) ; celle du pédalier sans batterie a été validée par le porteur. `bancARemplir` : pour le pédalier, un banc à moins de 3 m dont la batterie a de la place.
 */
export function raisonArret(i: { type: TypeInstallation; etat: EtatInstallation }, inventaire: Inventaire, bancARemplir = false): string | null {
  const d = i.etat.declencheur;
  switch (i.type) {
    case "pedalier": {
      // Rien de monté : la phrase que le serveur dit quand on pédale (R-06, une seule source). Avec la meule (ou la meule
      // fine), il sert à affûter : il marche (R-12).
      if (!i.etat.alternateur && !i.etat.dynamo) return i.etat.meule || i.etat.meuleFine ? null : RAISON_PEDALIER_SANS_ORGANE;
      // Comme le bouton A (interaction.ts) : il entraîne l'alternateur ou la dynamo, mais n'a rien à charger.
      const surPedalier = Object.values(i.etat.batteries ?? {}).some((n) => (n ?? 0) > 0);
      const enPoche = (Object.keys(CAPACITES) as TypeBatterie[]).some((b) => (inventaire[b] ?? 0) > 0);
      return bancARemplir || surPedalier || enPoche ? null : RAISON_PEDALIER_SANS_BATTERIE;
    }
    case "cloture_fortune":
    case "cloture_electrique":
      if (d?.couche) return "Couchée : trois Éteints ont poussé ensemble. Relève-la.";
      return d?.arme === false ? "Le courant ne passe pas : il lui faut un banc chargé à moins de 6 m." : null;
    case "plaque_choc":
      return d && !(d.arme ?? true) ? "Elle a servi : réarme-la." : null;
    case "assommoir":
    case "machoires_fortune":
    case "piege_machoires":
    case "fosse_pieux":
      return d?.fausse ? "Faussées : elles ne se réarment plus. Démonte-les, refais-en." : null;
    case "rampe_led":
      return i.etat.courant === false ? "Pas de batterie chargée à moins de 15 m : elle reste éteinte." : null;
    default:
      return null;
  }
}

/** Le bandeau d'une fiche : « Ne marche pas : il lui faut une batterie… » (la raison, en minuscule initiale). */
export function texteNeMarchePas(raison: string): string {
  return minuscule(raison);
}
