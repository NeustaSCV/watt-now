// Le simulateur d'équilibre des armes de métier (Book 25 §8.4 et §10.3, chantier 9 · 0.6).
//
// Il rejoue le tableau du §8.4 avec les **vraies règles** du jeu : les Éteints pensent et marchent par `penser`, les
// coups passent par `encaisserCoup` (eteints.ts), les armes sont celles des tables (`ARMES`, `ARMES_TIR`), corrigées
// par les étoiles de l'exemplaire (`armeDeCle`, `armeTirExemplaire`). Rien n'est recopié : si une valeur change dans
// `armes/*.ts`, `tir.ts`, `combat.ts` ou `eteints.ts`, le simulateur le voit, et le test du garde-fou aussi
// (equilibre.test.ts). `npm run equilibre` imprime le tableau.
//
// Le modèle, en clair :
// - le joueur reste sur place, au milieu d'un terrain vide ; les Éteints surgissent à une distance donnée, déjà en
//   poursuite, et viennent à lui à leur vitesse réelle (`VITESSES.poursuivant`) ;
// - un geste compte **à la fin** de sa durée (`coup`, `coupAppuye` ; pour la décharge longue, sa durée à tenir ; pour
//   l'arc, bander 1,5 s ; pour l'arbalète armée, viser 0,3 s) : c'est la convention du §8.4 ;
// - le joueur suit une conduite simple, la même pour tous : frapper d'abord celui qui le tient, achever celui qui est à
//   terre, viser la tête ; à l'arme électrique, raidir avant d'éteindre ; au tir, tirer dès que la tête est à portée
//   (la moitié contre un casqué, de face), et ne réarmer que s'il en a le temps ;
// - saisi, il ne tire pas : il frappe celui qui le tient (arme de contact) ou se dégage (6 appuis rapides par Éteint
//   qui le tient, ≈ 0,12 s l'appui) ; une morsure arrive après 3 s de prise ; trois qui le tiennent : il s'effondre.
//
// Ce que vaut une rencontre : le **temps équivalent**, c'est-à-dire le temps jusqu'au dernier Éteint détruit, plus le
// temps de se panser après chaque morsure (6 s, le geste « Faire un pansement »). Une rencontre perdue (effondrement,
// ou pas fini au bout d'une minute) ou impossible (la lame seule contre l'Équipé) vaut l'infini.

import { ARMES, APPUIS_DEGAGEMENT, COUT_ENDURANCE, DELAI_MORSURE, ENDURANCE_MAX, ENDURANCE_RECUPERATION, REPOUSSER, SEUIL_EPUISE, armeDeCle, capaciteChargeArme, type Arme } from "./combat.ts";
import { CONTACT, VITESSES, debout, encaisser, encaisserCoup, lacher, nouvelEteint, penser, repousser, type Eteint, type Humain } from "./eteints.ts";
import { ARMES_TIR, MUNITIONS, PART_TETE_EQUIPE, armeTirDe, armeTirExemplaire, deFace, type ArmeTir, type Munition } from "./tir.ts";
import { etoilesDe, typeDe, type Etoiles } from "./etoiles.ts";
import { rearmement } from "./mecanique.ts";
import { energieGrise } from "./recettes.ts";
import { REGLAGES } from "./reglages.ts";
import type { Zone } from "./lieux.ts";
import type { TypeObjet } from "./objets.ts";

// ---------- Les armes comparées (Book 25 §8.4) ----------

/** Les trois armes de métier, et l'arc commun pour repère. */
export type FamilleArme = "lame" | "electrique" | "arbalete" | "arc";
export const FAMILLES_ARMES: readonly FamilleArme[] = ["lame", "electrique", "arbalete", "arc"];
/** Les armes de métier : le garde-fou porte sur elles ; l'arc commun est un repère. */
export type ArmeDeMetier = "lame" | "electrique" | "arbalete";
export const ARMES_DE_METIER: readonly ArmeDeMetier[] = ["lame", "electrique", "arbalete"];

export const NOMS_FAMILLES_ARMES: Record<FamilleArme, string> = {
  lame: "🔥 Lame",
  electrique: "⚡ Électrique",
  arbalete: "⚙️ Arbalète",
  arc: "Arc (commun)",
};

export type Niveau = 1 | 2 | 3;
export const NIVEAUX: readonly Niveau[] = [1, 2, 3];

/**
 * L'exemplaire de chaque niveau, tel que le §8.4 le décrit : ★ et ★★ se font seul, ★★★ seul en s'y mettant.
 * La clé est celle du sac (« machette_forgee#2 ») ; la munition, celle qu'une famille fait seule (l'os ou le clou).
 */
export const EXEMPLAIRES: Record<FamilleArme, Record<Niveau, string>> = {
  // La machette de fortune (★), la machette forgée ressort et trempe à l'eau (★★), avec pinces et étau (★★★).
  lame: { 1: "machette", 2: "machette_forgee#2", 3: "machette_forgee" },
  // La matraque de fortune (★, le flash et la petite batterie), à la raquette (★★), à bobine (★★★).
  electrique: { 1: "matraque_fortune", 2: "matraque_electrique#2", 3: "matraque_electrique" },
  // L'arbalète à arc de frêne (★), à lame de ressort brute (★★), à arc d'if (★★★).
  arbalete: { 1: "arbalete#1", 2: "arbalete#2", 3: "arbalete" },
  // L'arc de fortune (★), l'arc simple à corde de ficelle (★★), l'arc de frêne à bonne corde (★★★).
  arc: { 1: "arc_fortune", 2: "arc_simple#2", 3: "arc_simple" },
};
const MUNITION_DE: Partial<Record<FamilleArme, TypeObjet>> = { arbalete: "carreau", arc: "fleche_os" };

/**
 * La seconde arme que le §8.4 donne à celles qui en demandent une : le **marteau** du kit des Charbonniers contre un
 * casqué (la lame glisse sur le casque) ; la **lance**, l'arme de contact que les Mécanistes font seuls (§7.1), pour
 * le tireur rattrapé au contact. L'arme électrique n'en a pas besoin.
 */
export const SECONDE_ARME: Partial<Record<FamilleArme, TypeObjet>> = { lame: "marteau", arbalete: "lance", arc: "lance" };

/** L'arme d'une famille à un niveau : de contact (lame, électrique) ou de tir (arbalète, arc). */
export interface ArmeComparee {
  famille: FamilleArme;
  niveau: Niveau;
  cle: string;
  nom: string;
  contact: Arme | null;
  tir: (ArmeTir & { etoiles: Etoiles | null }) | null;
  munition: Munition | null;
}

export function armeComparee(famille: FamilleArme, niveau: Niveau): ArmeComparee {
  return armeCompareeDe(famille, EXEMPLAIRES[famille][niveau], niveau);
}

/** L'arme d'une famille donnée par la clé d'un exemplaire (« machette_forgee#2 », « marteau »). */
export function armeCompareeDe(famille: FamilleArme, cle: string, niveau: Niveau): ArmeComparee {
  const base = armeTirDe(typeDe(cle), ARMES_TIR);
  if (base) {
    const tir = armeTirExemplaire(cle, base);
    const munition = MUNITIONS.find((m) => m.objet === MUNITION_DE[famille]) ?? null;
    return { famille, niveau, cle, nom: tir.nom, contact: null, tir, munition };
  }
  const contact = armeDeCle(cle);
  if (!contact) throw new Error(`equilibre : « ${cle} » n'est pas une arme`);
  return { famille, niveau, cle, nom: contact.nom, contact, tir: null, munition: null };
}

/** Une arme de contact ordinaire (sans étoiles), par son objet. */
export function armeDeContact(objet: TypeObjet): Arme {
  const a = ARMES.find((x) => x.objet === objet);
  if (!a) throw new Error(`equilibre : « ${objet} » n'est pas une arme`);
  return a;
}

// ---------- Les rencontres (Book 25 §8.4, §10.3) ----------

/** Un Éteint qui surgit : à quelle distance, sous quel angle (radians, 0 : droit devant), et quand. */
export interface Surgi {
  distance: number;
  angle: number;
  equipe?: boolean;
  /** Secondes après le début de la rencontre (la visite : ils arrivent l'un après l'autre). */
  apres?: number;
}

export type NomScenario = "errant" | "equipe" | "groupe5" | "groupe15" | "serre" | "visite" | "cascade";

export interface Scenario {
  nom: NomScenario;
  titre: string;
  surgis: readonly Surgi[];
}

/** Trois Éteints côte à côte, à `d` mètres, à 20° les uns des autres. */
function trois(d: number): Surgi[] {
  return [
    { distance: d, angle: -0.35 },
    { distance: d, angle: 0 },
    { distance: d, angle: 0.35 },
  ];
}

export const SCENARIOS: Record<NomScenario, Scenario> = {
  errant: { nom: "errant", titre: "Un Errant à 5 m", surgis: [{ distance: 5, angle: 0 }] },
  equipe: { nom: "equipe", titre: "Un Équipé à 5 m", surgis: [{ distance: 5, angle: 0, equipe: true }] },
  groupe5: { nom: "groupe5", titre: "Trois Errants à 5 m", surgis: trois(5) },
  groupe15: { nom: "groupe15", titre: "Trois Errants à 15 m", surgis: trois(15) },
  // Le groupe serré au coin d'un rayonnage, un casqué parmi eux : le terrain de l'électrique (§8.4).
  serre: {
    nom: "serre",
    titre: "Un Équipé et deux Errants à 2,5 m",
    surgis: [
      { distance: 2.5, angle: -0.4 },
      { distance: 2.5, angle: 0, equipe: true },
      { distance: 2.5, angle: 0.4 },
    ],
  },
  // La visite longue, l'Éteint après l'Éteint : huit Errants qui sortent des allées, un toutes les 2 s, à 3 m.
  visite: { nom: "visite", titre: "La visite : huit Errants, un toutes les 2 s, à 3 m", surgis: suite(8, 2) },
  // La cascade des dormants qui se réveillent ensemble : les mêmes, un toutes les 1,2 s. Un repère, le terrain de personne.
  cascade: { nom: "cascade", titre: "La cascade : huit Errants, un toutes les 1,2 s, à 3 m", surgis: suite(8, 1.2) },
};

/** `n` Errants à 3 m, l'un après l'autre, toutes les `ecart` secondes, de face puis de côté. */
function suite(n: number, ecart: number): Surgi[] {
  return Array.from({ length: n }, (_, i) => ({ distance: 3, angle: [0, 0.5, -0.5][i % 3]!, apres: i * ecart }));
}

// ---------- Ce que coûtent les gestes ----------

/** L'endurance d'une décharge (serveur/src/electricite.ts, `ENDURANCE_DECHARGE` ; un test serveur vérifie l'accord). */
export const ENDURANCE_DECHARGE_SIM = { courte: 5, longue: 8 } as const;
/** Un appui rapide pour se dégager (≈ 8 appuis par seconde). */
export const DUREE_APPUI_DEGAGEMENT = 0.12;
/** Le geste « Repousser » (B) : un instant. */
export const DUREE_REPOUSSER = 0.3;
/** Se panser après une morsure : le geste « Faire un pansement » (6 s). */
export const PENALITE_MORSURE = 6;
/** Au-delà, la rencontre est perdue. */
export const DUREE_MAX = 60;
/** « Avant le contact » : avant que le premier Éteint ne soit à 2 m, à portée de bras. */
export const DISTANCE_CONTACT = 2;
const PAS = 0.02;

// ---------- La rencontre ----------

export interface Resultat {
  /** Tous détruits, sans effondrement. */
  reussi: boolean;
  /** Personne ne peut les achever avec ce qu'il a (la lame seule contre l'Équipé, §8.4). */
  impossible: boolean;
  /** Temps jusqu'au dernier détruit (s ; l'infini si la rencontre est perdue). */
  duree: number;
  /** Combien détruits avant que le premier ne soit à 2 m. */
  avantContact: number;
  saisies: number;
  morsures: number;
  effondre: boolean;
  /** Ce qu'il en coûte : coups portés (décharges comprises), Wh, tirs, endurance. */
  coups: number;
  wh: number;
  tirs: number;
  endurance: number;
  /** Le temps équivalent : la durée, plus 6 s par morsure ; l'infini si la rencontre est perdue. */
  temps: number;
}

type Geste =
  | { genre: "frappe"; arme: Arme; cible: Eteint; appuye: boolean }
  | { genre: "tir"; cible: Eteint }
  | { genre: "rearmer" }
  | { genre: "degager" }
  | { genre: "repousser" };

const ZONE_VIDE: Zone = { xMin: -60, xMax: 60, zMin: -60, zMax: 60, obstacles: [] };

/** Un tirage reproductible (Park-Miller) : le simulateur rend toujours les mêmes chiffres. */
function aleaFixe(graine = 7): () => number {
  let s = graine;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * Réarmer (l'arbalète, au pied ; la lourde, au cranequin) ou encocher (l'arc), en secondes : la règle du serveur
 * (`rearmement`, mecanique.ts), réglage d'équilibre compris.
 */
function dureeRecharge(w: ArmeTir): number {
  if (!w.armeeDAvance) return w.rechargeMs / 1000;
  return (rearmement(w, { cranequin: 1, pied_de_biche: 1 })?.ms ?? w.rechargeMs) / 1000;
}

/** Cette arme peut-elle l'achever (le tranchant n'achève pas un casqué, Book 23 §4.2) ? */
function finissable(a: Arme, e: Eteint): boolean {
  return !(a.type === "tranchant" && e.variante === "equipe");
}

/** Une rencontre : l'arme (et, s'il le faut, sa seconde arme) contre ce qui surgit. */
export function simuler(arme: ArmeComparee, scenario: Scenario, options: { seconde?: Arme | null } = {}): Resultat {
  const alea = aleaFixe();
  const joueur: Humain = { id: 1, x: 0, z: 0, discret: false, eclaire: false };
  const prevus = scenario.surgis.map((s, i) => ({ s, e: null as Eteint | null, id: i + 1 }));
  const eteints: Eteint[] = [];
  const contact = arme.contact;
  const tir = arme.tir;
  const seconde = options.seconde ?? null;
  const armesContact: Arme[] = contact ? (seconde ? [contact, seconde] : [contact]) : seconde ? [seconde] : [];
  let t = 0;
  let geste: Geste | null = null;
  let finGeste = 0;
  let dernierGeste = -10;
  let endurance = ENDURANCE_MAX;
  // L'arbalète se porte armée ; l'arc, flèche encochée.
  let armee = true;
  let saisies = 0;
  let morsures = 0;
  let coups = 0;
  let wh = 0;
  let tirs = 0;
  let enduranceDepensee = 0;
  let avantContact = 0;
  let premierContact = false;
  let derniereDestruction = 0;
  let effondre = false;
  let impossible = false;
  let appuis = 0;
  const tenaient = new Set<number>();
  const vitesse = VITESSES.poursuivant;

  const depenser = (n: number) => {
    endurance = Math.max(0, endurance - n);
    enduranceDepensee += n;
  };
  const vivants = () => eteints.filter((e) => e.etat !== "detruit");
  const dist = (e: Eteint) => Math.hypot(e.x - joueur.x, e.z - joueur.z);
  const tenu = () => eteints.filter((e) => e.saisit === joueur.id);
  /** Le temps avant qu'il ne puisse saisir : qu'il se relève ou reprenne ses esprits, revienne au contact, et tienne. */
  const avantSaisie = (e: Eteint) => {
    const attente = e.etat === "a_terre" ? e.aTerre : Math.max(e.etourdi, e.raidi ?? 0);
    return attente + Math.max(0, dist(e) - CONTACT) / vitesse + 0.6;
  };
  const noter = (resultat: string) => {
    if (resultat !== "detruit") return;
    derniereDestruction = t;
    if (!premierContact) avantContact++;
  };

  /**
   * Ce que fait une arme de contact, selon la conduite décrite en tête. `armes` : l'arme de métier d'abord, puis la
   * seconde ; pour chaque Éteint, on prend celle qui le détruit le plus vite.
   */
  const choisirFrappe = (armes: readonly Arme[]): Geste | null => {
    const a = armes[0];
    if (!a) return null;
    const aPortee = (e: Eteint, x: Arme, duree: number) => {
      const approche = debout(e) && e.etourdi <= 0 && (e.raidi ?? 0) <= 0 ? vitesse * duree : 0;
      return dist(e) - approche <= x.allonge + 0.35;
    };
    const tiennent = tenu();
    const proches = vivants().sort((x, y) => dist(x) - dist(y));
    if (a.electrique) {
      const courte = a.coup / 1000;
      const longue = a.coupAppuye / 1000;
      if (tiennent[0]) return { genre: "frappe", arme: a, cible: tiennent[0], appuye: false };
      const auSol = proches.find((e) => e.etat === "a_terre" && aPortee(e, a, courte));
      if (auSol) return { genre: "frappe", arme: a, cible: auSol, appuye: false };
      const libre = proches.find((e) => debout(e) && e.etourdi <= 0 && aPortee(e, a, courte));
      if (libre) return { genre: "frappe", arme: a, cible: libre, appuye: false };
      const pris = proches.find((e) => debout(e) && e.etourdi > longue + PAS && aPortee(e, a, longue));
      if (pris) return { genre: "frappe", arme: a, cible: pris, appuye: true };
      const bientotLibre = proches.find((e) => debout(e) && e.etourdi > 0 && aPortee(e, a, courte));
      if (bientotLibre) return { genre: "frappe", arme: a, cible: bientotLibre, appuye: false };
      return null;
    }
    // L'arme qui le détruit d'un appuyé à la tête, la plus vive ; sinon l'arme de métier, pour le mettre à terre.
    const tueuse = (e: Eteint) => armes.filter((x) => x.tueALaTete && finissable(x, e)).sort((x, y) => x.coupAppuye - y.coupAppuye)[0] ?? null;
    const achevable = (e: Eteint) => armes.filter((x) => finissable(x, e)).sort((x, y) => x.coup - y.coup)[0] ?? null;
    if (tiennent.length) {
      const cible = tiennent.find((e) => tueuse(e)) ?? tiennent[0]!;
      return { genre: "frappe", arme: tueuse(cible) ?? a, cible, appuye: true };
    }
    for (const e of proches) {
      if (e.etat !== "a_terre") continue;
      const x = achevable(e);
      if (x && aPortee(e, x, x.coup / 1000)) return { genre: "frappe", arme: x, cible: e, appuye: false };
    }
    for (const e of proches) {
      const x = debout(e) ? tueuse(e) : null;
      if (x && aPortee(e, x, x.coupAppuye / 1000)) return { genre: "frappe", arme: x, cible: e, appuye: true };
    }
    // Un casqué devant une lame seule : on le met à terre, pour souffler.
    const autre = proches.find((e) => debout(e) && aPortee(e, a, a.coupAppuye / 1000));
    return autre ? { genre: "frappe", arme: a, cible: autre, appuye: true } : null;
  };

  /** Ce que fait un tireur. */
  const choisirTir = (w: ArmeTir): Geste | null => {
    const tiennent = tenu();
    if (tiennent.length) return seconde ? choisirFrappe([seconde]) : { genre: "degager" };
    const viser = w.pleinMs / 1000;
    const recharge = dureeRecharge(w);
    const proches = vivants().sort((x, y) => dist(x) - dist(y));
    const menace = Math.min(Infinity, ...proches.map(avantSaisie));
    if (!armee) {
      if (menace > recharge) return { genre: "rearmer" };
      const f = seconde ? choisirFrappe([seconde]) : null;
      if (f) return f;
      if (!seconde && proches.some((e) => debout(e) && e.etourdi <= 0 && dist(e) <= REPOUSSER.portee)) return { genre: "repousser" };
      return seconde ? null : { genre: "rearmer" };
    }
    // L'arc qu'on n'aurait pas le temps de bander : la seconde arme, s'il y en a une.
    if (seconde && menace < viser) {
      const f = choisirFrappe([seconde]);
      if (f) return f;
    }
    // La tête à portée (la moitié contre un casqué, de face) ; ou un Éteint à terre, qu'une flèche achève.
    const aTete = (e: Eteint) => {
      const approche = debout(e) && e.etourdi <= 0 ? vitesse * viser : 0;
      const porteeTete = w.porteeTete * (e.variante === "equipe" ? PART_TETE_EQUIPE : 1);
      return dist(e) - approche <= porteeTete && (e.variante !== "equipe" || deFace(e, joueur));
    };
    const cible = proches.find((e) => e.etat === "a_terre" && dist(e) <= w.porteeUtile) ?? proches.find((e) => debout(e) && aTete(e));
    return cible ? { genre: "tir", cible } : null;
  };

  /** Le geste qui s'achève : ses effets. */
  const achever = (g: Geste) => {
    if (g.genre === "frappe") {
      const a = g.arme;
      if (g.cible.etat === "detruit" || dist(g.cible) > a.allonge + 0.35) return;
      const force = endurance < SEUIL_EPUISE ? 0.5 : 1;
      noter(encaisserCoup(g.cible, a, g.appuye, force, joueur, ZONE_VIDE, eteints).resultat);
    } else if (g.genre === "tir" && tir) {
      const e = g.cible;
      armee = false;
      if (e.etat === "detruit") return;
      tirs++;
      const d = dist(e);
      if (d > tir.porteeMax) return;
      // La règle du serveur (serveur/src/tir.ts, `toucher`) : un tir plein à portée de tête détruit ; sinon le torse.
      const porteeTete = tir.porteeTete * (e.variante === "equipe" ? PART_TETE_EQUIPE : 1);
      const tete = (arme.munition?.tueALaTete ?? true) && d <= porteeTete && (e.variante !== "equipe" || deFace(e, joueur));
      const impact: Arme = { objet: null, nom: tir.nom, type: "percant", solidite: Infinity, degatsTorse: tir.degatsPlein, tueALaTete: true, allonge: 0, coup: 0, coupAppuye: 0 };
      noter(encaisser(e, impact, tete, 1, joueur, ZONE_VIDE));
    } else if (g.genre === "rearmer") {
      armee = true;
    } else if (g.genre === "repousser") {
      const proches = vivants()
        .filter((e) => debout(e) && dist(e) <= REPOUSSER.portee + 0.3)
        .sort((x, y) => dist(x) - dist(y))
        .slice(0, REPOUSSER.max);
      for (const e of proches) repousser(e, joueur, REPOUSSER.recul, REPOUSSER.etourdi, ZONE_VIDE);
    } else if (g.genre === "degager") {
      const tiennent = tenu();
      appuis++;
      if (tiennent.length && appuis >= APPUIS_DEGAGEMENT * tiennent.length * (endurance < SEUIL_EPUISE ? 1.5 : 1)) {
        appuis = 0;
        for (const e of tiennent) lacher(e, joueur, ZONE_VIDE);
      }
    }
  };

  /** Commencer un geste : son endurance se paie tout de suite, il compte à la fin. */
  const commencer = (g: Geste) => {
    let duree = 0;
    if (g.genre === "frappe") {
      duree = (g.appuye ? g.arme.coupAppuye : g.arme.coup) / 1000;
      coups++;
      if (g.arme.electrique) {
        depenser(g.appuye ? ENDURANCE_DECHARGE_SIM.longue : ENDURANCE_DECHARGE_SIM.courte);
        wh += g.appuye ? g.arme.electrique.whLongue : g.arme.electrique.whCourte;
      } else depenser(g.appuye ? COUT_ENDURANCE.coupAppuye : COUT_ENDURANCE.coup);
    } else if (g.genre === "tir" && tir) {
      duree = tir.pleinMs / 1000;
      // L'arc se bande (l'endurance au début) ; l'arbalète armée se vise.
      if (!tir.armeeDAvance) depenser(tir.endurance);
    } else if (g.genre === "rearmer" && tir) {
      duree = dureeRecharge(tir);
      if (tir.armeeDAvance) depenser(tir.endurance);
    } else if (g.genre === "degager") {
      duree = DUREE_APPUI_DEGAGEMENT;
      depenser(COUT_ENDURANCE.degagement);
    } else if (g.genre === "repousser") {
      duree = DUREE_REPOUSSER;
      depenser(REPOUSSER.cout);
    }
    geste = g;
    finGeste = t + duree;
  };

  while (t < DUREE_MAX) {
    // Ceux qui surgissent maintenant, déjà en poursuite.
    for (const p of prevus) {
      if (p.e || (p.s.apres ?? 0) > t + 1e-9) continue;
      const e = nouvelEteint(p.id, Math.sin(p.s.angle) * p.s.distance, Math.cos(p.s.angle) * p.s.distance, "poursuivant", p.s.angle + Math.PI);
      if (p.s.equipe) e.variante = "equipe";
      e.attention = 5;
      e.but = { x: joueur.x, z: joueur.z };
      p.e = e;
      eteints.push(e);
    }
    if (prevus.every((p) => p.e) && vivants().length === 0) break;

    // Le geste en cours s'achève.
    if (geste && t >= finGeste - 1e-9) {
      const g: Geste = geste;
      geste = null;
      dernierGeste = t;
      achever(g);
    }
    if (!tenu().length) appuis = 0;

    // Le geste suivant.
    if (!geste) {
      const g = tir ? choisirTir(tir) : choisirFrappe(armesContact);
      if (g) commencer(g);
    }

    // Les Éteints pensent et marchent (la vraie conduite, eteints.ts) ; on compte prises et morsures.
    for (const e of eteints) penser(e, PAS, [], [joueur], eteints, false, ZONE_VIDE, alea);
    for (const e of eteints) {
      if (!premierContact && debout(e) && dist(e) <= DISTANCE_CONTACT) premierContact = true;
      const tient = e.saisit === joueur.id;
      if (tient && !tenaient.has(e.id)) saisies++;
      if (tient) tenaient.add(e.id);
      else tenaient.delete(e.id);
      if (tient && e.tenue >= DELAI_MORSURE) {
        e.tenue = 0;
        morsures++;
      }
    }
    if (tenu().length >= 3) {
      effondre = true;
      break;
    }
    // L'endurance remonte quand on souffle.
    if (!geste && t - dernierGeste > 0.6) endurance = Math.min(ENDURANCE_MAX, endurance + ENDURANCE_RECUPERATION * PAS);

    // Tous là, et plus aucun qu'on puisse achever : la lame seule devant un casqué (§8.4).
    if (!tir && prevus.every((p) => p.e) && vivants().length > 0 && vivants().every((e) => !armesContact.some((x) => finissable(x, e)))) {
      impossible = true;
      break;
    }
    t += PAS;
  }

  const reussi = !effondre && !impossible && prevus.every((p) => p.e) && vivants().length === 0;
  return {
    reussi,
    impossible,
    duree: reussi ? derniereDestruction : Infinity,
    avantContact,
    saisies,
    morsures,
    effondre,
    coups,
    wh,
    tirs,
    endurance: enduranceDepensee,
    temps: reussi ? derniereDestruction + PENALITE_MORSURE * morsures : Infinity,
  };
}

// ---------- Le coût d'usage (Book 25 §8.4, colonne « Coût d'usage par Errant ») ----------

export interface CoutUsage {
  /** Wotts par Errant détruit : l'usure de l'arme, le courant, les munitions cassées. */
  wotts: number;
  /** Errants détruits avant qu'il ne faille réparer, recharger, ou refaire des munitions. */
  autonomie: number;
}

/** Les munitions qu'on emporte pour une visite (trois recettes de carreaux, quatre de flèches). */
export const MUNITIONS_EMPORTEES = 12;

/**
 * Le coût d'un Errant détruit, mesuré sur « un Errant à 5 m » : la part de l'arme usée (son énergie grise sur sa
 * solidité), les Wh (au prix du dépôt au Comptoir), les munitions cassées (leur énergie grise × la casse).
 */
export function coutUsage(arme: ArmeComparee): CoutUsage {
  const r = simuler(arme, SCENARIOS.errant);
  const valeur = energieGrise(typeDe(arme.cle));
  if (arme.contact) {
    const a = arme.contact;
    const usure = (r.coups * valeur) / a.solidite;
    const courant = r.wh * REGLAGES.depot_wotts_par_wh;
    const parSolidite = a.solidite / Math.max(1, r.coups);
    const parCharge = a.electrique ? capaciteChargeArme(a) / Math.max(r.wh, 1e-9) : Infinity;
    return { wotts: usure + courant, autonomie: Math.floor(Math.min(parSolidite, parCharge)) };
  }
  const w = arme.tir!;
  const m = arme.munition!;
  const casse = r.tirs * m.casse * energieGrise(m.objet);
  const usure = (r.tirs * valeur) / w.solidite;
  const parMunitions = m.casse > 0 ? MUNITIONS_EMPORTEES / (r.tirs * m.casse) : Infinity;
  return { wotts: casse + usure, autonomie: Math.floor(Math.min(w.solidite / Math.max(1, r.tirs), parMunitions)) };
}

// ---------- Le tableau ----------

export interface Ligne {
  famille: FamilleArme;
  niveau: Niveau;
  /** L'exemplaire comparé (« machette_forgee#2 »). */
  cle: string;
  nom: string;
  /** L'arme seule. */
  seule: Record<NomScenario, Resultat>;
  /** Avec sa seconde arme (§8.4), pour celles qui en ont une ; sinon, la même chose que seule. */
  avecSeconde: Record<NomScenario, Resultat>;
  cout: CoutUsage;
}

/** Le tableau du §8.4, rejoué : chaque arme, chaque niveau, chaque rencontre, seule et avec sa seconde arme. */
export function tableau(): Ligne[] {
  const lignes: Ligne[] = [];
  for (const famille of FAMILLES_ARMES) {
    for (const niveau of NIVEAUX) lignes.push(ligneDe(armeComparee(famille, niveau)));
  }
  return lignes;
}

/** Une ligne du tableau : l'arme, seule et avec sa seconde arme, dans chaque rencontre ; et son coût. */
function ligneDe(arme: ArmeComparee): Ligne {
  const objetSeconde = SECONDE_ARME[arme.famille];
  const seconde = objetSeconde ? armeDeContact(objetSeconde) : null;
  const seule = {} as Record<NomScenario, Resultat>;
  const avecSeconde = {} as Record<NomScenario, Resultat>;
  for (const s of Object.values(SCENARIOS)) {
    seule[s.nom] = simuler(arme, s);
    avecSeconde[s.nom] = seconde ? simuler(arme, s, { seconde }) : seule[s.nom];
  }
  return { famille: arme.famille, niveau: arme.niveau, cle: arme.cle, nom: arme.nom, seule, avecSeconde, cout: coutUsage(arme) };
}

// ---------- Le garde-fou (Book 25 §8.4) ----------

/** Le terrain de chaque arme de métier : les rencontres où elle doit être la meilleure des trois (§8.4). */
export const TERRAINS: Record<ArmeDeMetier, readonly NomScenario[]> = {
  // Le corps à corps durable : la visite longue, l'Éteint après l'Éteint, le groupe au contact.
  lame: ["visite", "groupe5"],
  // Le contrôle et l'Équipé : le groupe serré, le casqué.
  electrique: ["serre"],
  // La distance : l'espace ouvert, le premier coup.
  arbalete: ["groupe15"],
};

/**
 * Les armes qui, **seules**, ne tiennent pas un terrain, et le disent (§8.4, « Faiblesses ») : la lame ne détruit pas
 * un casqué ; l'arbalète, une fois rattrapée, se réarme trop lentement (« il faut une seconde arme au contact »). Pour
 * elles, le garde-fou juge l'arme **avec sa seconde arme** (`SECONDE_ARME`).
 */
export const DEMANDE_UNE_SECONDE_ARME: readonly { famille: ArmeDeMetier; scenario: NomScenario }[] = [
  { famille: "lame", scenario: "serre" },
  { famille: "arbalete", scenario: "groupe5" },
  { famille: "arbalete", scenario: "visite" },
  { famille: "arbalete", scenario: "serre" },
];
/** Hors de son terrain, à ★★★, jamais plus de 2 fois moins bonne que la meilleure (§8.4). */
export const ECART_MAX = 2;
/** Au coût, personne ne paie plus de 3 fois la voie la moins chère (Book 02 §15, Book 25 §2.4). */
export const ECART_COUT_MAX = 3;

export interface Rapport {
  famille: ArmeDeMetier;
  scenario: NomScenario;
  /** Combien de fois moins bonne que la meilleure des armes seules (1 : c'est elle ; l'infini : elle n'y arrive pas). */
  rapport: number;
  /** Jugée avec sa seconde arme (§8.4). */
  avecSeconde: boolean;
}

/** Ce que rend le garde-fou : les fautes (vide : il tient), les rapports, le pire rapport hors terrain, l'écart de coût. */
export interface Verdict {
  fautes: string[];
  rapports: Rapport[];
  /** Le plus mauvais rapport d'une arme hors de son terrain (≤ 2 : ça tient). */
  pireRapport: number;
  /** Le coût par Errant le plus cher sur le moins cher (≤ 3 : ça tient). */
  ecartCout: number;
}

/**
 * Le garde-fou du §8.4, à ★★★ : sur chaque terrain, l'arme qui le possède est la meilleure des trois armes de métier,
 * seules ; les deux autres n'y sont jamais plus de 2 fois moins bonnes (avec leur seconde arme quand elles en
 * demandent une) ; et le coût par Errant ne varie pas de plus de 3 fois. Rend les fautes (vide : le garde-fou tient)
 * et les rapports.
 */
export function gardeFou(lignes: Ligne[] = tableau()): Verdict {
  return juger((f) => lignes.find((l) => l.niveau === 3 && l.famille === f)!);
}

/** Le garde-fou sur trois armes de métier, une par famille (à ★★★, ou celles d'une étape). */
function juger(arme: (f: ArmeDeMetier) => Ligne): Verdict {
  const fautes: string[] = [];
  const rapports: Rapport[] = [];
  let pireRapport = 0;
  for (const proprietaire of ARMES_DE_METIER) {
    for (const s of TERRAINS[proprietaire]) {
      const meilleurTemps = Math.min(...ARMES_DE_METIER.map((f) => arme(f).seule[s].temps));
      if (arme(proprietaire).seule[s].temps > meilleurTemps + 1e-9) fautes.push(`${SCENARIOS[s].titre} : ${NOMS_FAMILLES_ARMES[proprietaire]} n'y est pas la meilleure`);
      for (const f of ARMES_DE_METIER) {
        const seconde = DEMANDE_UNE_SECONDE_ARME.some((x) => x.famille === f && x.scenario === s);
        const rapport = (seconde ? arme(f).avecSeconde : arme(f).seule)[s].temps / meilleurTemps;
        rapports.push({ famille: f, scenario: s, rapport, avecSeconde: seconde });
        if (f === proprietaire) continue;
        pireRapport = Math.max(pireRapport, rapport);
        if (!(rapport <= ECART_MAX)) {
          fautes.push(`${SCENARIOS[s].titre} : ${NOMS_FAMILLES_ARMES[f]}${seconde ? " (avec sa seconde arme)" : ""} y est ${Number.isFinite(rapport) ? `${rapport.toFixed(2)} fois` : "infiniment"} moins bonne`);
        }
      }
    }
  }
  const couts = ARMES_DE_METIER.map((f) => arme(f).cout.wotts);
  const ecartCout = Math.max(...couts) / Math.min(...couts);
  if (!(ecartCout <= ECART_COUT_MAX)) fautes.push(`Coût par Errant : de ${Math.min(...couts).toFixed(1)} à ${Math.max(...couts).toFixed(1)} wotts, plus de 3 fois d'écart`);
  return { fautes, rapports, pireRapport, ecartCout };
}

// ---------- Le garde-fou rejoué par étape (plan 0.8 §2.4, P11 ; chantier 8) ----------

/** Les étapes que la 0.8 met en jeu : la maison, puis H1 (la station, le gué) et L1 (la Coopérative, le Moulin). */
export type EtapeEquilibre = "maison" | "H1" | "L1";
export const ETAPES_EQUILIBRE: readonly EtapeEquilibre[] = ["maison", "H1", "L1"];

/**
 * Les armes de chaque famille à chaque étape, **seul**, selon la grille (plan 0.8 §2.4 ; `armes-par-niveau.md` §6.2 et
 * §10.1) : l'arme qui défend chaque terrain, avec ce qu'une famille fait seule à cette étape.
 * - à la maison, rien de métier : le marteau remmanché pour tous (la tête de la caisse, I10), l'arc simple ★★ (corde
 *   de ficelle) et la lance pour qui tient la distance ; l'arc de fortune pour repère ;
 * - à H1 : la machette forgée ★★ (l'enclume de dépanneur), la matraque ★★ (la petite batterie, Q-A5), l'arbalète ★★
 *   (le ressort) ; l'arc simple ★★★ (fil dentaire) pour repère ;
 * - à L1 : les armes de la station (K-Q2, pas d'étoile intermédiaire) ; l'arc d'if ★★ pour repère.
 * La seconde arme reste celle du §8.4 (`SECONDE_ARME`) : le marteau pour la lame, la lance pour le tireur.
 */
export const ARMES_DES_ETAPES: Record<EtapeEquilibre, Record<FamilleArme, string>> = {
  maison: { lame: "marteau", electrique: "marteau", arbalete: "arc_simple#2", arc: "arc_fortune" },
  H1: { lame: "machette_forgee#2", electrique: "matraque_electrique#2", arbalete: "arbalete#2", arc: "arc_simple" },
  L1: { lame: "machette_forgee#2", electrique: "matraque_electrique#2", arbalete: "arbalete#2", arc: "arc_if#2" },
};

/** Les étoiles d'une clé, pour la colonne « Niv. » (1 pour une arme sans étoiles). */
function niveauDe(cle: string): Niveau {
  const n = etoilesDe(cle) ?? 1;
  return (n >= 3 ? 3 : n) as Niveau;
}

/** Le tableau d'une étape : une ligne par famille, avec les armes de l'étape. */
export function tableauEtape(etape: EtapeEquilibre): Ligne[] {
  return FAMILLES_ARMES.map((f) => {
    const cle = ARMES_DES_ETAPES[etape][f];
    return ligneDe(armeCompareeDe(f, cle, niveauDe(cle)));
  });
}

/**
 * Le garde-fou d'une étape (P11) : à chaque étape, l'arme qui possède un terrain y est la meilleure ; les autres au plus
 * 2 fois moins bonnes ; au coût, au plus 3 fois d'écart. À la maison, il n'y a pas d'arme de métier : personne ne
 * possède de terrain (les armes communes), on ne juge que les écarts.
 */
export function gardeFouEtape(etape: EtapeEquilibre, lignes: Ligne[] = tableauEtape(etape)): Verdict {
  const v = juger((f) => lignes.find((l) => l.famille === f)!);
  if (etape !== "maison") return v;
  return { ...v, fautes: v.fautes.filter((f) => !f.endsWith("n'y est pas la meilleure")) };
}

// ---------- En texte ----------

const virgule = (x: number, d: number) => (Number.isFinite(x) ? x.toFixed(d).replace(".", ",") : "—");

/** Une case du tableau : « 3,5 s (1 saisie) », « impossible seule », « effondré ». */
export function caseResultat(r: Resultat): string {
  if (r.impossible) return "impossible seule";
  if (!r.reussi) return r.effondre ? "effondré" : "échec";
  const extra = [r.saisies ? `${r.saisies} saisie${r.saisies > 1 ? "s" : ""}` : "", r.morsures ? `${r.morsures} morsure${r.morsures > 1 ? "s" : ""}` : ""].filter(Boolean).join(", ");
  return `${virgule(r.temps, 1)} s${extra ? ` (${extra})` : ""}`;
}

/** Le tableau en Markdown (pour le Book 25 §8.4 ; `npm run equilibre`). `avecSeconde` : la variante avec la seconde arme. */
export function tableauTexte(lignes: Ligne[] = tableau(), avecSeconde = false): string {
  const entetes = ["Arme", "Niv.", ...Object.values(SCENARIOS).map((x) => x.titre), "Détruits avant le contact (à 15 m)", "Wotts par Errant", "Autonomie (Errants)"];
  const rangs = lignes.map((l) => {
    const r = avecSeconde ? l.avecSeconde : l.seule;
    return [
      (l.cle === EXEMPLAIRES[l.famille][l.niveau] ? NOMS_FAMILLES_ARMES[l.famille] : `${NOMS_FAMILLES_ARMES[l.famille]} : ${l.nom}`) + (avecSeconde && SECONDE_ARME[l.famille] ? ` + ${armeDeContact(SECONDE_ARME[l.famille]!).nom}` : ""),
      etoilesDe(l.cle) === null ? "—" : "★".repeat(etoilesDe(l.cle)!),
      ...Object.values(SCENARIOS).map((x) => caseResultat(r[x.nom])),
      String(r.groupe15.avantContact),
      virgule(l.cout.wotts, 1),
      String(l.cout.autonomie),
    ];
  });
  return [`| ${entetes.join(" | ")} |`, `|${entetes.map(() => "---").join("|")}|`, ...rangs.map((r) => `| ${r.join(" | ")} |`)].join("\n");
}
