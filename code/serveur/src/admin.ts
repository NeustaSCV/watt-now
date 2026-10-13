// Le compte admin « god » côté serveur (outil du porteur du projet, 0.7) : son terrain monté de toutes les
// constructions, ses coffres remplis, et ce qu'il voit de plus (toutes les recettes, des quatre familles).
// Tout se calcule depuis les catalogues (RECETTES, ARMES, ARMES_TIR, MUNITIONS, OBJETS, lignées) : un objet ou une
// recette ajoutés demain y entrent d'office. Utilisé par la commande (scripts/admin.ts) et par le jeu (menu ⚙).

import type { Base, Compte } from "./base.ts";
import { PSEUDO_ADMIN } from "../../commun/src/admin.ts";
import { APPARENCES_DE_REFERENCE, type Apparence } from "../../commun/src/apparence.ts";
import { ARMES } from "../../commun/src/combat.ts";
import { DECHARGE } from "../../commun/src/decharge.ts";
import { raisonEmplacement } from "../../commun/src/emplacement.ts";
import { capacite, type Charges, type TypeBatterie } from "../../commun/src/energie.ts";
import { cleExemplaire, estObjetDeMetier, typeDe } from "../../commun/src/etoiles.ts";
import { LIGNEES_INSTALLATIONS, VOIE_CREUSEE, VOIE_SURFACE, capaciteCoffre, effetsFeu, type Etape } from "../../commun/src/lignees.ts";
import type { InstallationVue } from "../../commun/src/messages.ts";
import { OBJETS, poidsInventaire, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import type { VueProgression } from "../../commun/src/progression.ts";
import { RECETTES, faconsRecette, type TypeInstallation } from "../../commun/src/recettes.ts";
import { FAMILLES, POINT_ARRIVEE, TERRAIN_TAILLE, type Famille } from "../../commun/src/regles.ts";
import { ARMES_TIR, MUNITIONS } from "../../commun/src/tir.ts";

/** La famille de god quand on le crée (il fabrique tout, de toutes les familles, sans surcoût). */
export const FAMILLE_ADMIN: Famille = "charbonniers";

/** Son apparence sous la toge : un grand barbu aux cheveux gris. La toge est ajoutée par le serveur (`toge`). */
export const APPARENCE_ADMIN: Apparence = { ...APPARENCES_DE_REFERENCE.charbonniers, silhouette: "masculine", taille: 0.75, corpulence: 0.5, peau: 1, coiffure: "longs", cheveux: 5, barbe: true };

/** Quelques exemplaires de chaque objet du catalogue. */
const EXEMPLAIRES_CATALOGUE = 3;
/** Les flèches et les carreaux : de quoi tirer longtemps. */
const MUNITIONS_PAR_SORTE = 60;
/** Les étoiles de chaque arme de métier : ★, ★★, ★★★. */
const ETOILES_ARMES = [1, 2, 3] as const;
/** Le pas de la grille de pose (m) : les constructions s'alignent en rangs, avec de quoi passer entre elles. */
const PAS_GRILLE = 4;

const BATTERIES: readonly TypeBatterie[] = ["petite_batterie", "batterie_voiture"];

// ---------- Ce que god voit ----------

/** Les recettes que god voit dans Fabriquer : toutes, et le feu de camp et le Dakota. */
export function toutesLesCartes(): string[] {
  return [...RECETTES.map((r) => r.id), "feu_de_camp", "foyer_dakota"];
}

/** La progression telle que god la voit : tout dévoilé, rien à découvrir, pas de pastille. */
export function vueProgressionAdmin(v: VueProgression): VueProgression {
  return { ...v, devoilees: [...new Set([...v.devoilees, ...toutesLesCartes()])], nonVues: [], silhouettes: [], autres: false, entrevues: [] };
}

/** Le savoir tel que god le voit : les manuels des quatre familles (toutes les recettes s'ouvrent dans Fabriquer). */
export function savoirAdmin(apprises: readonly string[]): { apprises: string[]; manuels: Famille[] } {
  return { apprises: [...apprises], manuels: [...FAMILLES] };
}

// ---------- Ce que contiennent ses coffres ----------

function ajouter(inv: Inventaire, cle: string, n: number): void {
  const c = cle as keyof Inventaire;
  inv[c] = (inv[c] ?? 0) + n;
}

/**
 * Le contenu des coffres de god : toutes les armes (de contact et de tir) en ★, ★★ et ★★★ ; toutes les flèches et tous
 * les carreaux ; de quoi fabriquer chaque recette et monter chaque niveau des lignées ; quelques exemplaires de chaque
 * objet du catalogue (vestiges compris).
 */
export function contenuAdmin(): Inventaire {
  const inv: Inventaire = {};
  // Les armes : celles de contact, celles de tir.
  const armes = new Set<TypeObjet>();
  for (const a of ARMES) if (a.objet) armes.add(a.objet);
  for (const a of ARMES_TIR) armes.add(a.objet);
  for (const t of armes) {
    if (estObjetDeMetier(t)) for (const e of ETOILES_ARMES) ajouter(inv, cleExemplaire(t, e), 1);
    else ajouter(inv, t, 2);
  }
  for (const m of MUNITIONS) ajouter(inv, m.objet, MUNITIONS_PAR_SORTE);
  // De quoi fabriquer chaque recette une fois (au prix de sa famille : god n'a pas de surcoût).
  // Une recette à choix (0.8.2) : de quoi la faire de chaque façon.
  for (const r of RECETTES) for (const f of faconsRecette(r)) for (const [t, n] of Object.entries(f)) ajouter(inv, t, n ?? 0);
  // Et de quoi monter chaque niveau (le premier choix de coût de chaque étape jouable).
  const etapes: Etape[] = [...VOIE_SURFACE, ...VOIE_CREUSEE, ...Object.values(LIGNEES_INSTALLATIONS).flat()];
  for (const e of etapes) if (!e.aVenir) for (const [t, n] of Object.entries(e.couts[0] ?? {})) ajouter(inv, t, n ?? 0);
  // Quelques exemplaires de chaque objet du catalogue.
  for (const t of Object.keys(OBJETS) as TypeObjet[]) ajouter(inv, t, EXEMPLAIRES_CATALOGUE);
  return inv;
}

/** Répartit un contenu dans des coffres de cette capacité (kg), dans l'ordre, en coupant les piles s'il le faut. */
export function repartir(contenu: Inventaire, capaciteKg: number): Inventaire[] {
  const coffres: Inventaire[] = [{}];
  let charge = 0;
  for (const [cle, total] of Object.entries(contenu) as [keyof Inventaire, number][]) {
    const poids = OBJETS[typeDe(cle)]?.poids ?? 0;
    // Un objet plus lourd que le coffre n'y entre pas (aucun aujourd'hui) : on le laisse de côté.
    if (poids > capaciteKg) continue;
    let reste = total;
    while (reste > 0) {
      const place = poids > 0 ? Math.floor((capaciteKg - charge + 1e-9) / poids) : reste;
      if (place <= 0) {
        coffres.push({});
        charge = 0;
        continue;
      }
      const n = Math.min(place, reste);
      const c = coffres.at(-1)!;
      c[cle] = (c[cle] ?? 0) + n;
      charge += n * poids;
      reste -= n;
    }
  }
  return coffres.filter((c) => Object.keys(c).length > 0);
}

/** La charge pleine des batteries rangées dans un coffre. */
function chargesPleines(contenu: Inventaire): Charges {
  const charges: Charges = {};
  for (const b of BATTERIES) {
    const n = contenu[b] ?? 0;
    if (n > 0) charges[b] = capacite(b, n);
  }
  return charges;
}

// ---------- Poser sur le terrain ----------

/** Le niveau le plus haut qu'on peut jouer aujourd'hui (sans les niveaux qui attendent la 0b). */
function niveauMax(etapes: readonly Etape[] | undefined): number {
  if (!etapes) return 1;
  let n = 1;
  for (const e of etapes) if (!e.aVenir) n = Math.max(n, e.niveau);
  return n;
}

/** Les types d'installation qu'une recette construit (une construction de chacun). */
export function installationsConstructibles(): TypeInstallation[] {
  const types = new Set<TypeInstallation>();
  for (const r of RECETTES) if ("installation" in r.produit) types.add(r.produit.installation);
  return [...types];
}

/**
 * Une place libre sur le terrain de god, selon les règles de pose du jeu (`raisonEmplacement` : bords, mare, ruine,
 * écarts avec les feux et les installations), sur une grille de 3 m autour du camp ; jamais sur son point d'arrivée,
 * la sortie, un arbre ou un tas de pierres. null : plus de place.
 */
function placeLibre(base: Base, compteId: number, genre: "feu" | "installation", type?: string): { x: number; z: number } | null {
  const feux = base.chargerFeux(compteId);
  const installations = base.chargerInstallations(compteId);
  const ressources = base.chargerRessources(compteId);
  const centre = { x: POINT_ARRIVEE.x, z: POINT_ARRIVEE.z - 4 };
  const points: { x: number; z: number; d: number }[] = [];
  for (let i = -8; i <= 8; i++) {
    for (let j = -8; j <= 8; j++) {
      const x = centre.x + i * PAS_GRILLE;
      const z = centre.z + j * PAS_GRILLE;
      if (x < 2 || z < 2 || x > TERRAIN_TAILLE - 2 || z > TERRAIN_TAILLE - 2) continue;
      points.push({ x, z, d: Math.hypot(x - centre.x, z - centre.z) });
    }
  }
  points.sort((a, b) => a.d - b.d);
  for (const p of points) {
    if (Math.hypot(p.x - POINT_ARRIVEE.x, p.z - POINT_ARRIVEE.z) < 2.5) continue;
    // Le chemin de la sortie (au sud du camp) reste dégagé.
    if (Math.abs(p.x - POINT_ARRIVEE.x) < 2 && p.z > POINT_ARRIVEE.z) continue;
    if (ressources.some((r) => Math.hypot(r.x - p.x, r.z - p.z) < 1.8)) continue;
    // L'escabeau ne gêne pas la pose dans le jeu (on le déplace) ; ici, on ne pose rien dessus.
    if (installations.some((i) => Math.hypot(i.x - p.x, i.z - p.z) < 2)) continue;
    if (raisonEmplacement(genre, p.x, p.z, p, feux, installations, type) === null) return p;
  }
  return null;
}

/** Pose une installation à la première place libre, à son niveau le plus haut. */
function poserInstallation(base: Base, compteId: number, type: TypeInstallation): InstallationVue | null {
  const p = placeLibre(base, compteId, "installation", type);
  if (!p) return null;
  const i = base.ajouterInstallation(compteId, type, p.x, p.z, 0);
  const niveau = niveauMax(LIGNEES_INSTALLATIONS[type]);
  if (niveau > 1) base.sauverNiveauInstallation(compteId, i.id, niveau);
  return { ...i, ...(niveau > 1 ? { niveau } : {}) };
}

/** Les accessoires montés d'office (pédalier, établi, forge) : pour tout tester sans les fabriquer. */
function accessoiresDe(type: TypeInstallation): Partial<InstallationVue["etat"]> {
  switch (type) {
    case "pedalier":
      return { meule: true, dynamo: true, soufflet: true, meuleFine: true };
    case "etabli":
      return { redresseur: true };
    case "forge":
      return { enclume: "rail", bac: true, huile: 10 };
    default:
      return {};
  }
}

export interface BilanTerrain {
  installations: number;
  feux: number;
  coffres: number;
  /** Ce qui n'a pas trouvé de place (rien, sauf terrain encombré). */
  sansPlace: string[];
}

/**
 * Monte le terrain de god : une construction de chaque recette constructible (à son niveau le plus haut), un foyer de
 * chaque forme jouable (feu de camp, foyer de pierres, foyer de cuisine, Dakota, poêle-fusée, allumés et garnis de
 * bois), puis remplit les coffres. Idempotent : ce qui est déjà là reste, ce qui manque est posé.
 */
export function monterTerrain(base: Base, compteId: number, instant = Date.now()): BilanTerrain {
  const sansPlace: string[] = [];
  let poses = 0;
  let feuxPoses = 0;
  base.transaction(() => {
    // La décharge du terrain (P-001) est posée au premier passage du joueur ; on la pose avant, pour ne rien mettre dessus.
    if (!base.chargerInstallations(compteId).some((i) => i.type === "decharge")) {
      const d = base.ajouterInstallation(compteId, "decharge", DECHARGE.x, DECHARGE.z, 0);
      base.sauverEtatInstallation(compteId, d.id, { contenu: {}, majLe: instant });
    }
    // Les foyers d'abord : ils veulent plus de place autour d'eux.
    const voulus = [...VOIE_SURFACE.filter((e) => !e.aVenir).map((e) => ({ dakota: false, niveau: e.niveau })), ...VOIE_CREUSEE.filter((e) => !e.aVenir).map((e) => ({ dakota: true, niveau: e.niveau }))];
    for (const v of voulus) {
      const deja = base.chargerFeux(compteId).some((f) => !!f.dakota === v.dakota && (f.niveau ?? 1) === v.niveau);
      if (deja) continue;
      const p = placeLibre(base, compteId, "feu");
      if (!p) {
        sansPlace.push(v.dakota ? `foyer creusé ${v.niveau}` : `foyer ${v.niveau}`);
        continue;
      }
      const id = Math.max(0, ...base.chargerFeux(compteId).map((f) => f.id)) + 1;
      const forme = { ...(v.dakota ? { dakota: true } : {}), ...(v.niveau > 1 ? { niveau: v.niveau } : {}) };
      // Le foyer de cuisine porte la broche et la marmite norvégienne (montées gratuitement : rien à rendre au démontage).
      const accessoires = !v.dakota && v.niveau === 3 ? { broche: {}, marmite: {} } : {};
      base.sauverFeu(compteId, { id, x: p.x, z: p.z, bois: effetsFeu(forme).boisMax, allume: true, majLe: instant, ...forme, accessoires });
      feuxPoses++;
    }
    for (const type of installationsConstructibles()) {
      const existantes = base.chargerInstallations(compteId).filter((i) => i.type === type);
      let i: InstallationVue | null | undefined = existantes[0];
      if (!i) {
        i = poserInstallation(base, compteId, type);
        if (!i) {
          sansPlace.push(type);
          continue;
        }
        poses++;
      }
      const acc = accessoiresDe(type);
      if (Object.keys(acc).length > 0) base.sauverEtatInstallation(compteId, i.id, { ...i.etat, ...acc });
    }
  });
  const coffres = remplirCoffres(base, compteId);
  if (coffres.sansPlace) sansPlace.push("coffre");
  return { installations: poses, feux: feuxPoses, coffres: coffres.coffres, sansPlace };
}

/**
 * Remplit les coffres de god (le contenu est remplacé, pas ajouté : on peut le refaire autant qu'on veut). Ils sont
 * montés à leur niveau le plus haut ; il en pose d'autres s'il en manque ; ceux de trop restent vides.
 */
export function remplirCoffres(base: Base, compteId: number): { coffres: number; sansPlace: boolean } {
  const niveau = niveauMax(LIGNEES_INSTALLATIONS.coffre);
  const parts = repartir(contenuAdmin(), capaciteCoffre({ type: "coffre", niveau }));
  let sansPlace = false;
  base.transaction(() => {
    let coffres = base.chargerInstallations(compteId).filter((i) => i.type === "coffre");
    while (coffres.length < parts.length) {
      const c = poserInstallation(base, compteId, "coffre");
      if (!c) {
        sansPlace = true;
        break;
      }
      coffres = [...coffres, c];
    }
    coffres.forEach((c, k) => {
      if ((c.niveau ?? 1) !== niveau) base.sauverNiveauInstallation(compteId, c.id, niveau);
      const contenu = parts[k] ?? {};
      base.sauverEtatInstallation(compteId, c.id, { ...c.etat, contenu, charges: chargesPleines(contenu) });
    });
  });
  return { coffres: Math.min(parts.length, base.chargerInstallations(compteId).filter((i) => i.type === "coffre").length), sansPlace };
}

/** Le poids total des coffres de god (pour le bilan de la commande). */
export function poidsContenuAdmin(): number {
  return Math.round(poidsInventaire(contenuAdmin()));
}

// ---------- La commande ----------

export interface ResultatPreparation {
  compte: Compte;
  cree: boolean;
  ecrase: boolean;
  terrain: BilanTerrain;
}

/**
 * Ce que fait `npm run admin -- god` : crée le compte « god » (ou l'écrase s'il existe déjà : nouveau mot de passe,
 * personnage neuf), le désigne admin (ce qui retire l'ancien), monte son terrain et remplit ses coffres.
 */
export function preparerGod(base: Base, motDePasse: string, famille?: Famille, instant = Date.now()): ResultatPreparation {
  const existant = base.compteParPseudo(PSEUDO_ADMIN);
  const compte = existant
    ? base.reinitialiserCompte(existant.id, motDePasse, famille ?? existant.famille, APPARENCE_ADMIN)
    : base.creerCompte(PSEUDO_ADMIN, motDePasse, famille ?? FAMILLE_ADMIN, false, APPARENCE_ADMIN, true);
  base.designerAdmin(compte.id);
  const terrain = monterTerrain(base, compte.id, instant);
  return { compte, cree: !existant, ecrase: !!existant, terrain };
}
