// Le budget des matières du niveau 2 (plan 0.10, chantier M ; notice-nouveau-niveau.md §3.i) : ce que demandent les
// évolutions, les meubles nouveaux et les armes ★★★ de chaque famille, ce que rapporte une visite de chacun des quatre
// lieux de la côte, et l'énergie des ⚡ et des ⚙️ (le banc qui suit le soleil, compensé : V1-19 ; le moulin de
// jerricans). Le parcours, lui (les sorties, les péages, le bois, la nuit du phare), est joué par le simulateur de
// rythme (rythme.ts, `jouerParcoursN2`).
//
// Les quatre tableaux de la notice (§3.i, étape 1 à 4), refaits pour le niveau 2 :
// - **la demande** : chaque poste du niveau 2 de la famille (rythme.ts, `postesNiveau2`), ses coûts et ses recettes,
//   déroulés jusqu'à ce qui se trouve (ce qui se fabrique est remplacé par ses ingrédients ; le charbon par les bûches
//   de sa meule) ; et **la charge par route** : les matériaux des cinq évolutions de chaque lieu (objet-clé compris),
//   à comparer aux ≈ 45 kg libres d'un sac à dos (« une charge de sac par route », notice §6.2) ;
// - **l'offre** : une visite de chaque lieu, tout fouillé une fois, au hasard des vraies tables (une moyenne sur
//   plusieurs centaines de visites, graine fixe), ce qui se démonte démonté ; le vrac pour un voyageur seul ;
// - **le bilan** : ce qui manque après une visite de chaque lieu de la côte (le parcours en fait au moins une).
//
// Calcul pur, sans état ; il ne tourne jamais en jeu.

import { contenuDe } from "./contenu-lieux.ts";
import { aleaDe, graineDe } from "./dechets.ts";
import { CHARBON_PRODUIT, MS_JOUR_CALENDRIER, WATTS_MOULIN, BONUS_POULIE, productionMoulin, productionPanneau, whDePuissance, msDeNuit, whParBeauJour } from "./energie.ts";
import { VOIE_SURFACE, lignee } from "./lignees.ts";
import type { LieuId } from "./lieux.ts";
import { COUT_CREUSET, RAMPE_LED } from "./meubles-neufs.ts";
import { OBJETS, type Inventaire, type TypeObjet } from "./objets.ts";
import { valeurPeage } from "./peage.ts";
import { recetteDeBase } from "./progression.ts";
import { faconsRecette, recette } from "./recettes.ts";
import type { Famille } from "./regles.ts";
import { CLES_NIVEAU_2, OUTILS_NIVEAU_2, postesNiveau2, type Poste } from "./rythme.ts";
import { USAGES, type TypeRessource } from "./terrain.ts";
import { trouvables, type Source } from "./trouvables.ts";
import { DEMONTAGE, FAMILLES_PAR_LIEU, LIEU_DE_FOUILLE, tirerVestiges, type LieuFouille } from "./vestiges.ts";
import { MS_PAR_HEURE_JEU } from "./temps.ts";

/** Ce que porte un sac à dos, une fois le kit, la gourde et les outils dedans (notice §3.i : ≈ 45 kg libres). */
export const SAC_LIBRE_KG = 45;

/** Le poids d'un inventaire (kg). */
export function poids(inv: Partial<Record<TypeObjet, number>>): number {
  let kg = 0;
  for (const [t, n] of Object.entries(inv) as [TypeObjet, number][]) kg += (OBJETS[t]?.poids ?? 0) * (n ?? 0);
  return Math.round(kg * 10) / 10;
}

function ajouter(acc: Partial<Record<TypeObjet, number>>, t: TypeObjet, n: number): void {
  if (n) acc[t] = (acc[t] ?? 0) + n;
}

// ---------- La demande ----------

/** Ce que coûte un poste du niveau 2, tel quel (ses matériaux, son objet-clé, le premier choix qui se trouve). */
export function coutDuPoste(p: Poste, sources: ReadonlyMap<TypeObjet, Source>): Inventaire {
  switch (p.genre) {
    case "niveau":
      return { ...(lignee(p.type)?.[p.niveau - 1]?.couts[0] ?? {}) };
    case "feu":
      return { ...(VOIE_SURFACE.find((e) => e.id === p.forme)?.couts[0] ?? {}) };
    case "objet2":
    case "recette": {
      const r = recette(p.recette);
      if (!r) return {};
      const facons = faconsRecette(r);
      return { ...(facons.find((f) => (Object.keys(f) as TypeObjet[]).every((t) => sources.has(t))) ?? facons[0]!) };
    }
    case "accessoire2":
      return { ...COUT_CREUSET };
    default:
      return {};
  }
}

/**
 * Déroule un inventaire jusqu'à ce qui se trouve (se ramasse, se fouille, se démonte, s'achète) : ce qui se fabrique
 * est remplacé par les ingrédients de sa recette de base (divisés par ce qu'elle produit) ; le charbon de bois par les
 * bûches de sa meule (10 pour 4). Les objets-clés restent tels quels.
 */
export function derouler(inv: Inventaire, sources: ReadonlyMap<TypeObjet, Source>, acc: Partial<Record<TypeObjet, number>> = {}, profondeur = 0): Partial<Record<TypeObjet, number>> {
  for (const [t, n] of Object.entries(inv) as [TypeObjet, number][]) {
    if (!n) continue;
    if (t === "charbon_bois") {
      ajouter(acc, "buche", (n * 10) / CHARBON_PRODUIT);
      continue;
    }
    const s = sources.get(t);
    const r = recetteDeBase(t);
    if (CLES_NIVEAU_2.has(t) || profondeur > 6 || !r || (s !== undefined && s !== "fabrication" && s !== "autres")) {
      ajouter(acc, t, n);
      continue;
    }
    const q = "objet" in r.produit ? (r.produit.quantite ?? 1) : 1;
    const facons = faconsRecette(r);
    const f = facons.find((x) => (Object.keys(x) as TypeObjet[]).every((o) => sources.has(o))) ?? facons[0]!;
    const part: Inventaire = {};
    for (const [o, k] of Object.entries(f) as [TypeObjet, number][]) part[o] = (k * n) / q;
    derouler(part, sources, acc, profondeur + 1);
  }
  return acc;
}

/** Les outils du niveau 2 qu'un poste demande (le rabot, le fer à souder). */
function outilsDuPoste(p: Poste): TypeObjet[] {
  const q = p.genre === "niveau" ? lignee(p.type)?.[p.niveau - 1]?.qualites : p.genre === "objet2" ? recette(p.recette)?.qualites : undefined;
  return Object.keys(q ?? {}).flatMap((k) => (OUTILS_NIVEAU_2[k as keyof typeof OUTILS_NIVEAU_2] ? [OUTILS_NIVEAU_2[k as keyof typeof OUTILS_NIVEAU_2]!] : []));
}

export interface DemandeNiveau2 {
  famille: Famille;
  /** Les matériaux des évolutions de l'hôtel (route A) et du phare (route B), objets-clés compris. */
  routeA: Partial<Record<TypeObjet, number>>;
  routeB: Partial<Record<TypeObjet, number>>;
  /** Leur poids (kg) : les matériaux seuls (à réunir chez soi), et les objets-clés (à rapporter du lieu). */
  kgA: number;
  kgB: number;
  kgClesA: number;
  kgClesB: number;
  /** Les meubles nouveaux et le métier (armes ★★★), déroulés jusqu'à ce qui se trouve. */
  metier: Partial<Record<TypeObjet, number>>;
  kgMetier: number;
  /** Tout le niveau 2, déroulé. */
  tout: Partial<Record<TypeObjet, number>>;
  /** Les outils du niveau 2 qu'il faut avoir rapportés (le rabot, le fer à souder). */
  outils: TypeObjet[];
}

/**
 * La demande du niveau 2 d'une famille (notice §3.i, étape 1). « Route A » : les évolutions dont l'objet-clé est à
 * l'hôtel (l'abri doublé, la lanterne fixe, la réserve couverte, et ⚡ ⚙️ leur meuble de famille) ; « route B » : celles
 * du phare (le four de terre, le récupérateur à jerrican, l'établi de menuisier, la cloche, et 🔥 la forge ventilée).
 */
export function demandeNiveau2(famille: Famille): DemandeNiveau2 {
  const sources = trouvables(famille, true).objets;
  const routeA: Partial<Record<TypeObjet, number>> = {};
  const routeB: Partial<Record<TypeObjet, number>> = {};
  const metier: Partial<Record<TypeObjet, number>> = {};
  const outils = new Set<TypeObjet>();
  for (const p of postesNiveau2(famille, "A")) {
    const cout = coutDuPoste(p, sources);
    for (const o of outilsDuPoste(p)) outils.add(o);
    const cle = Object.keys(cout).find((t) => CLES_NIVEAU_2.has(t as TypeObjet)) as TypeObjet | undefined;
    const lieu = cle ? CLES_NIVEAU_2.get(cle) : p.genre === "niveau" && outilsDuPoste(p).length ? CLES_NIVEAU_2.get(outilsDuPoste(p)[0]!) : undefined;
    if (p.genre === "niveau" || p.genre === "feu") derouler(cout, sources, lieu === "phare" ? routeB : routeA);
    else derouler(cout, sources, metier);
  }
  const tout: Partial<Record<TypeObjet, number>> = {};
  for (const inv of [routeA, routeB, metier]) for (const [t, n] of Object.entries(inv) as [TypeObjet, number][]) ajouter(tout, t, n);
  const cles = (inv: Partial<Record<TypeObjet, number>>, lieu: LieuId) => {
    const c: Partial<Record<TypeObjet, number>> = {};
    for (const [t, k] of Object.entries(inv) as [TypeObjet, number][]) if (CLES_NIVEAU_2.has(t)) c[t] = k;
    // Les outils (le rabot, le fer à souder) se rapportent aussi.
    for (const o of outils) if (CLES_NIVEAU_2.get(o) === lieu) c[o] = 1;
    return poids(c);
  };
  const sansCles = (inv: Partial<Record<TypeObjet, number>>) => poids(Object.fromEntries(Object.entries(inv).filter(([t]) => !CLES_NIVEAU_2.has(t as TypeObjet))));
  return { famille, routeA, routeB, kgA: sansCles(routeA), kgB: sansCles(routeB), kgClesA: cles(routeA, "grand_hotel"), kgClesB: cles(routeB, "phare"), metier, kgMetier: poids(metier), tout, outils: [...outils] };
}

/** Le poids des objets-clés d'un lieu, s'il les rapporte tous d'un coup (le parcours les prend tous). */
export function poidsDesCles(lieu: "grand_hotel" | "phare"): number {
  const c: Partial<Record<TypeObjet, number>> = {};
  for (const [t, l] of CLES_NIVEAU_2) if (l === lieu) c[t] = 1;
  // La machinerie de l'hôtel donne plusieurs boîtes de roulements (ressources-hotel.ts).
  if (lieu === "grand_hotel") c.roulements = USAGES.hotel_roulements.donne.roulements ?? 1;
  return poids(c);
}

// ---------- L'offre : une visite de chaque lieu de la côte ----------

export interface OffreVisite {
  lieu: LieuId;
  /**
   * Ce qu'une visite rapporte en moyenne, tout fouillé une fois (objets-clés à part) : chaque objet compté entier, et
   * aussi ce qu'il donnerait démonté (au mieux : le tube d'une trottinette, le verre d'une bouteille).
   */
  matieres: Partial<Record<TypeObjet, number>>;
  /** Les objets-clés à leur place. */
  cles: TypeObjet[];
  /** Le vrac pour un voyageur seul et les tas personnels (le pin tombé), déjà comptés dans `matieres`. */
  vrac: Partial<Record<TypeObjet, number>>;
  /** Ce que valent au Comptoir les objets trouvés (le péage en demande 12), en moyenne. */
  wotts: number;
  /** Les points fouillés ou ramassés. */
  points: number;
}

/**
 * Ce qu'une visite d'un lieu de la côte rapporte (notice §3.i, étape 3) : chaque point à place fixe pris une fois (sa
 * donnée, et le tirage de sa table de fouille), le vrac pour un voyageur seul (la première tournée), le tas personnel
 * (le pin tombé). Les bancs de la cale du pont ne se fouillent qu'à marée basse (la moitié du temps) : comptés à moitié.
 * Une moyenne sur `visites` tirages (graine fixe).
 */
export function offreVisite(lieu: "route_pont" | "corniche" | "grand_hotel" | "phare", visites = 400): OffreVisite {
  const contenu = contenuDe(lieu);
  const vracDuLieu = contenu.butin?.vrac ?? {};
  const personnel = contenu.butin?.personnel ?? {};
  const fixes = contenu.ressources().filter((r) => vracDuLieu[r.type] === undefined && personnel[r.type as keyof typeof personnel] === undefined);
  const matieres: Partial<Record<TypeObjet, number>> = {};
  const vrac: Partial<Record<TypeObjet, number>> = {};
  const cles = new Set<TypeObjet>();
  let wotts = 0;
  // Le vrac (B8) et le tas personnel : ce qu'ils donnent, une fois.
  for (const [type, n] of Object.entries(vracDuLieu) as [TypeRessource, number][]) for (const [o, k] of Object.entries(USAGES[type]?.donne ?? {}) as [TypeObjet, number][]) ajouter(vrac, o, k * n);
  for (const [type, n] of Object.entries(personnel) as [TypeRessource, number][]) for (const [o, k] of Object.entries(USAGES[type]?.donne ?? {}) as [TypeObjet, number][]) ajouter(vrac, o, k * (n ?? 1));
  const alea = aleaDe(graineDe("offre-niveau-2", lieu));
  for (let v = 0; v < visites; v++) {
    const trouve: Partial<Record<TypeObjet, number>> = {};
    for (const r of fixes) {
      const u = USAGES[r.type];
      if (!u) continue;
      const part = r.type.startsWith("banc_") ? 0.5 : 1;
      for (const [o, k] of Object.entries(u.donne) as [TypeObjet, number][]) {
        if (CLES_NIVEAU_2.has(o)) cles.add(o);
        else ajouter(trouve, o, k * part);
      }
      const table = LIEU_DE_FOUILLE[r.type];
      if (table) for (const [o, k] of Object.entries(tirerVestiges(table, alea)) as [TypeObjet, number][]) ajouter(trouve, o, k);
    }
    for (const [o, k] of Object.entries(trouve) as [TypeObjet, number][]) wotts += valeurPeage(o) * k;
    for (const [o, k] of Object.entries(trouve) as [TypeObjet, number][]) demonterTout(o, k / visites, matieres);
  }
  for (const [o, k] of Object.entries(vrac) as [TypeObjet, number][]) demonterTout(o, k, matieres);
  for (const t of Object.keys(matieres) as TypeObjet[]) matieres[t] = Math.round(matieres[t]! * 100) / 100;
  return { lieu, matieres, cles: [...cles], vrac, wotts: Math.round(wotts / visites), points: fixes.length };
}

/** Une visite de chacun des quatre lieux de la côte, additionnée. */
export function offreDeLaCote(visites = 400): { parLieu: OffreVisite[]; total: Partial<Record<TypeObjet, number>> } {
  const parLieu = (["route_pont", "grand_hotel", "corniche", "phare"] as const).map((l) => offreVisite(l, visites));
  const total: Partial<Record<TypeObjet, number>> = {};
  for (const o of parLieu) for (const [t, n] of Object.entries(o.matieres) as [TypeObjet, number][]) ajouter(total, t, n);
  return { parLieu, total };
}

// ---------- Le bilan ----------

export interface LigneBilan {
  objet: TypeObjet;
  /** D'où il vient d'abord pour cette famille (trouvables.ts : sol, fouille, déchets, démontage, fabrication…). */
  source: Source | "boîte" | undefined;
  /** Ce que demande tout le niveau 2 de la famille. */
  demande: number;
  /** Ce qu'une visite de chaque lieu de la côte rapporte (en moyenne). */
  offre: number;
  /** Combien de passages de chaque lieu il faudrait pour l'avoir (1 : une visite suffit). */
  passages: number;
}

/**
 * Le bilan (notice §3.i, étape 4) : pour chaque matière que le niveau 2 demande, et qui n'est ni du bois, ni de la pierre,
 * ni de la glaise (le parcours les compte : rythme.ts), ni un objet-clé : la demande, l'offre d'une visite de chaque
 * lieu de la côte, et le nombre de passages qu'il faudrait (la terre ferme du niveau 1, le terrain et le Comptoir en
 * donnent aussi : ce chiffre est un plafond).
 */
export function bilanNiveau2(famille: Famille, offre = offreDeLaCote().total): LigneBilan[] {
  const d = demandeNiveau2(famille).tout;
  const sources = trouvables(famille, true).objets;
  const lignes: LigneBilan[] = [];
  for (const [t, n] of Object.entries(d) as [TypeObjet, number][]) {
    if (["buche", "pierre", "branche", "glaise"].includes(t) || CLES_NIVEAU_2.has(t)) continue;
    const o = offre[t] ?? 0;
    // Les roulements sortent de la boîte de l'hôtel (V1-01) : le parcours les compte (rythme.ts).
    lignes.push({ objet: t, source: t === "roulement" ? "boîte" : sources.get(t), demande: Math.round(n * 100) / 100, offre: o, passages: o > 0 ? Math.ceil(n / o - 1e-9) : Infinity });
  }
  return lignes.sort((a, b) => b.passages - a.passages || b.demande - a.demande);
}

/**
 * Combien une fouille rapporte d'un objet, table par table (tout ce qui se trouve démonté jusqu'à ses matières, en
 * moyenne sur `tirages`), du meilleur au moins bon : pour dire où chercher ce qui manque (le tube d'aluminium : les
 * échelles et les chaises de camping des ateliers et des berges du niveau 1, N2-05).
 */
export function rendementParFouille(objet: TypeObjet, tirages = 2000): { table: LieuFouille; parFouille: number }[] {
  const lignes: { table: LieuFouille; parFouille: number }[] = [];
  for (const table of Object.keys(FAMILLES_PAR_LIEU) as LieuFouille[]) {
    const alea = aleaDe(graineDe("rendement", table, objet));
    const acc: Partial<Record<TypeObjet, number>> = {};
    for (let i = 0; i < tirages; i++) for (const [o, k] of Object.entries(tirerVestiges(table, alea)) as [TypeObjet, number][]) demonterTout(o, k, acc);
    const n = (acc[objet] ?? 0) / tirages;
    if (n > 0) lignes.push({ table, parFouille: Math.round(n * 1000) / 1000 });
  }
  return lignes.sort((a, b) => b.parFouille - a.parFouille);
}

/** Un objet, compté entier et démonté jusqu'au bout (DEMONTAGE ; l'outil supposé à portée au niveau 2). */
function demonterTout(t: TypeObjet, n: number, acc: Partial<Record<TypeObjet, number>>, profondeur = 0): void {
  const d = DEMONTAGE[t];
  ajouter(acc, t, n);
  if (!d || profondeur > 3) return;
  for (const [o, k] of Object.entries(d.donne) as [TypeObjet, number][]) demonterTout(o, (k ?? 0) * n, acc, profondeur + 1);
}

// ---------- L'énergie : le banc compensé (V1-19), le moulin de jerricans (V1-03), la rampe de LED ----------

export interface BudgetEnergie {
  /** Ce que donnent en moyenne, par jour de jeu (24 min réelles), le banc solaire et le moulin (Wh). */
  bancParJour: number;
  bancParBeauJour: number;
  moulinParJour: number;
  moulinPoulieParJour: number;
  /** Ce que tire la rampe de LED par nuit de jeu (3 W, de 21 h à 5 h 30). */
  rampeParNuit: number;
  /** Les jours de jeu pour remplir la batterie de cellules (120 Wh) au banc seul, au banc et au moulin. */
  joursCellulesBanc: number;
  joursCellulesBancMoulin: number;
}

/**
 * L'énergie du niveau 2 sur un mois de calendrier du monde (la vraie météo, au calendrier) : le banc qui suit le soleil
 * (80 Wh par jour de calendrier en moyenne, ≈ 162 par beau jour : V1-19), le moulin de jerricans à la même moyenne
 * (V1-03), sa poulie (+ 50 %), la rampe de LED (3 W la nuit, S-25).
 */
export function budgetEnergie(): BudgetEnergie {
  const duree = 30 * MS_JOUR_CALENDRIER;
  const joursDeJeu = duree / (24 * MS_PAR_HEURE_JEU);
  const banc = productionPanneau(0, duree, 0) / joursDeJeu;
  const moulin = productionMoulin(0, duree, 0) / joursDeJeu;
  const moulinPoulie = productionMoulin(0, duree, 0, true) / joursDeJeu;
  const rampe = whDePuissance(RAMPE_LED.watts, msDeNuit(0, 24 * MS_PAR_HEURE_JEU, 0));
  const arrondi = (x: number) => Math.round(x * 10) / 10;
  return {
    bancParJour: arrondi(banc),
    bancParBeauJour: arrondi((whParBeauJour() * 24 * MS_PAR_HEURE_JEU) / MS_JOUR_CALENDRIER),
    moulinParJour: arrondi(moulin),
    moulinPoulieParJour: arrondi(moulinPoulie),
    rampeParNuit: arrondi(rampe),
    joursCellulesBanc: arrondi(120 / banc),
    joursCellulesBancMoulin: arrondi(120 / (banc + moulin)),
  };
}

/** Le moulin, pour mémoire (W) : par vent fort, faible, au calme ; et la poulie. */
export const MOULIN_RESUME = { ...WATTS_MOULIN, poulie: BONUS_POULIE } as const;
