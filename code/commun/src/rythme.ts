// Le simulateur de rythme (0.7, chantier 6 ; décision Q5 de l'arbre de progression) : des parcours types, joués
// minute par minute de jeu connecté, pour chiffrer le temps entre deux recettes dévoilées et entre deux buts.
//
// « Rapide au début pour accrocher, puis un bon rythme qui donne régulièrement des choses nouvelles et des buts. »
// La cible : dans la première demi-heure, une nouveauté (une recette, ou un but nouveau) toutes les 3 minutes en
// moyenne, et jamais 5 minutes sans rien ; puis un but nouveau au moins toutes les 20 minutes tant que le carnet a
// quelque chose à proposer. Au pas du joueur : le prudent, plus lent, a d'autant plus de marge.
//
// Un parcours est une suite d'activités (le tutoriel, ou son équivalent pour qui le saute, puis les quêtes du carnet,
// une par ligne). Le monde fait le reste à heures fixes : un Éteint vu, la pluie, la fatigue, un sac lourd… Le
// dévoilement est calculé par la vraie fonction du jeu (`aDevoiler`), les ingrédients viennent des vraies tables
// (trouvables.ts) et les fouilles sont tirées dans les vraies tables de fouille et de déchets, avec une graine fixe :
// deux lancements donnent le même rapport. Les durées sont des estimations de joueur (à caler au test familial).
//
// Le simulateur relève aussi les **blocages** : une recette que le tutoriel ou une quête demande et qui n'est jamais
// dévoilée, ou un ingrédient introuvable. Calcul pur, sans état global ; il ne tourne jamais en jeu.

import { tirerVestiges, type LieuFouille } from "./vestiges.ts";
import { aleaDe, contenuConteneur, graineDe, piecesAmas, type TypeLieuDechets } from "./dechets.ts";
import { tableDecharge } from "./decharge.ts";
import type { TypeObjet } from "./objets.ts";
import { ATELIER, aDevoiler, devoileesAuDepart, devoileesDEmblee, nomDuLieu, recetteDeBase, recettesDeLEtape, type EtatPourDevoilement } from "./progression.ts";
import type { LieuRecette } from "./recettes.ts";
import { lieuPossede } from "./lieu-recette.ts";
import { lignee } from "./lignees.ts";
import { QUETES, queteSuivante, type Condition, type LigneQuete, type Quete } from "./quetes.ts";
import { RECETTES, recette, type Recette } from "./recettes.ts";
import type { Famille } from "./regles.ts";
import { trouvables, type Source } from "./trouvables.ts";
import { etapesTutoriel } from "./tutoriel.ts";

// ---------- Les parcours types ----------

export type Profil = "prudent" | "presse" | "sans_tuto";

export interface DefinitionProfil {
  nom: string;
  /** Le temps que prend chaque activité, par rapport à un joueur moyen. */
  facteur: number;
  tuto: boolean;
  /** L'ordre dans lequel il suit les lignes du carnet. */
  lignes: LigneQuete[];
  /** Fouilles par voyage (station, Comptoir). */
  fouilles: number;
  /** Il ramasse au passage (des joncs, un cèpe, une poule). */
  curieux: boolean;
  /** Il dort chaque nuit dans son abri ; sinon, une nuit sur deux. */
  dortChaqueNuit: boolean;
}

export const PROFILS: Readonly<Record<Profil, DefinitionProfil>> = {
  prudent: { nom: "Le joueur prudent", facteur: 1.3, tuto: true, lignes: ["installer", "metier", "autres"], fouilles: 4, curieux: true, dortChaqueNuit: true },
  presse: { nom: "Le joueur pressé", facteur: 0.75, tuto: true, lignes: ["metier", "installer", "autres"], fouilles: 1, curieux: false, dortChaqueNuit: false },
  sans_tuto: { nom: "Le joueur qui saute le tutoriel", facteur: 1, tuto: false, lignes: ["metier", "installer", "autres"], fouilles: 2, curieux: false, dortChaqueNuit: true },
};

/** La durée de jeu simulée (minutes de jeu connecté) : une première soirée, et un peu plus. */
export const HORIZON_MIN = 300;

/** La cible du rythme (décision Q5). */
export const CIBLE = {
  /** La première demi-heure : une nouveauté (recette ou but) toutes les 3 minutes en moyenne… */
  debutMin: 30,
  nouveautesDebutMin: 10,
  /** … et jamais plus de 5 minutes sans rien de neuf. */
  trouDebutMax: 5,
  /** Ensuite : un but nouveau au moins toutes les 20 minutes, tant que le carnet a de quoi proposer. */
  ecartButsMax: 20,
} as const;

/** Le tutoriel, pour un joueur moyen : la durée de chaque étape (≈ 45 min en tout, proposition §2.9). */
const DUREES_TUTO = [3, 3, 4, 4, 5, 2, 4, 3, 1, 6, 3, 7];

/**
 * Les quêtes, pour un joueur moyen : le travail (minutes de jeu), et le lieu s'il faut voyager (avec ses fouilles).
 * Les attentes (la meule qui cuit trois jours, le panneau qui charge) sont à part : on fait autre chose entre-temps.
 */
const DUREES_QUETES: Readonly<Record<string, { travail: number; lieu?: "station" | "comptoir" }>> = {
  repas: { travail: 6 },
  lit: { travail: 4 },
  eau_du_ciel: { travail: 10, lieu: "station" },
  coffre: { travail: 6 },
  dakota: { travail: 5 },
  defense: { travail: 3 },
  premier_arc: { travail: 6 },
  tir_plein: { travail: 8 },
  alarme: { travail: 6 },
  soins: { travail: 5 },
  protege_bras: { travail: 4 },
  travois: { travail: 6 },
  foyer_pierres: { travail: 5 },
  foyer_cuisine: { travail: 8 },
  comptoir: { travail: 10, lieu: "comptoir" },
  premiers_wotts: { travail: 8, lieu: "comptoir" },
  main_tendue: { travail: 10, lieu: "comptoir" },
  charbonniere: { travail: 8 },
  charbon: { travail: 3 },
  lame: { travail: 5 },
  vendre_lame: { travail: 10, lieu: "comptoir" },
  pinces: { travail: 4 },
  trempe: { travail: 6 },
  mise_acier: { travail: 6 },
  fournisseur: { travail: 10, lieu: "comptoir" },
  meule: { travail: 5 },
  affuter: { travail: 3 },
  dynamo: { travail: 5 },
  depot_meca: { travail: 15, lieu: "comptoir" },
  arbalete: { travail: 12 },
  carreau: { travail: 8 },
  machoires: { travail: 6 },
  carquois: { travail: 10, lieu: "comptoir" },
  panneau_trouve: { travail: 10, lieu: "station" },
  panneau_pose: { travail: 3 },
  charge: { travail: 3 },
  depot_volt: { travail: 10, lieu: "comptoir" },
  pack: { travail: 8, lieu: "station" },
  raquette: { travail: 10 },
  alarme_electrique: { travail: 8, lieu: "station" },
  courant_autres: { travail: 10, lieu: "comptoir" },
};

/** Les quêtes qui demandent un autre joueur : un joueur seul ne peut pas les finir (ce n'est pas un blocage). */
const QUETES_SOCIALES = new Set(["main_tendue"]);

/** Les attentes du monde, en minutes de jeu (Book 25 : la meule cuit trois jours de jeu, 72 min). */
const ATTENTE = { defourne: 72, wh_panneau: 25 } as const;

/**
 * Ce que le monde fait de lui-même (minutes de jeu, pour chaque profil) : un constat noté une fois (serveur :
 * `CONSTATS`), ou un fait. Le tutoriel apporte en plus le premier Éteint, la saisie, la première nuit.
 */
function agendaDuMonde(profil: Profil): { minute: number; fait: string }[] {
  const p = PROFILS[profil];
  // Pendant le tutoriel, les Éteints attendent l'étape « Le premier Éteint » : les coups viennent après.
  const combat = p.tuto ? DUREES_TUTO.reduce((s, d) => s + d, 0) * p.facteur : 10;
  const a: { minute: number; fait: string }[] = [
    { minute: combat + (profil === "prudent" ? 10 : 4), fait: "blessure" },
    { minute: 30, fait: "sommeil_bas" },
    { minute: profil === "prudent" ? 28 : profil === "presse" ? 40 : 32, fait: "sac_lourd" },
    { minute: 50, fait: "pluie" },
    { minute: profil === "prudent" ? 12 : profil === "presse" ? 45 : 18, fait: "arbre_haut" },
    { minute: combat + 20, fait: "morsure" },
    { minute: profil === "prudent" ? 55 : profil === "presse" ? 80 : 60, fait: "trop_lourd" },
  ];
  // Un Éteint détruit de temps en temps (la fumée, le bruit), l'eau bouillie, les nuits dans l'abri.
  for (let m = combat + 15; m < HORIZON_MIN; m += 20) a.push({ minute: m, fait: "detruit:contondant" });
  for (let m = 20; m < HORIZON_MIN; m += 15) a.push({ minute: m, fait: "ebullition" });
  const pas = p.dortChaqueNuit ? 24 : 48;
  for (let m = (p.tuto ? 45 : 22) + pas; m < HORIZON_MIN; m += pas) a.push({ minute: m, fait: "nuit" });
  if (!p.tuto) {
    a.push({ minute: 4, fait: "eteint_vu" }, { minute: 10, fait: "detruit:hache" }, { minute: 15, fait: "saisi" }, { minute: 22, fait: "nuit" });
  }
  return a.sort((x, y) => x.minute - y.minute);
}

/** Ce que le joueur curieux ramasse au passage sur son terrain. */
const CUEILLETTE_CURIEUSE: readonly { minute: number; objets: TypeObjet[] }[] = [
  { minute: 9, objets: ["fibres"] },
  { minute: 14, objets: ["cepe", "baies"] },
  { minute: 30, objets: ["poule"] },
  { minute: 40, objets: ["perche_frene"] },
];

/**
 * Le tutoriel, geste par geste : à quel moment de l'étape (de 0 à 1) le joueur fait quoi. Une étape longue donne ainsi
 * ses idées en chemin, comme en jeu (le serveur réévalue deux fois par seconde).
 */
type Geste = { voir: TypeObjet[] } | { fabriquer: string } | { noter: string } | { fouiller: LieuFouille } | { atelier: true } | { voyager: "station" };
const GESTES_TUTO: readonly (readonly [number, Geste][])[] = [
  [],
  [
    [0.3, { voir: ["branche"] }],
    [0.8, { voir: ["pierre"] }],
  ],
  [
    [0.6, { fabriquer: "feu_de_camp" }],
    [0.9, { noter: "feu_allume" }],
  ],
  [[0.9, { noter: "ebullition" }]],
  [
    [0.4, { voir: ["tete_hache", "cle_plate", "tournevis"] }],
    [0.45, { fouiller: "atelier" }],
    [0.9, { voir: ["cadre_velo", "chaine_velo", "roue_velo", "dynamo_velo"] }],
  ],
  [[0.9, { fabriquer: "hache" }]],
  [
    [0.4, { voir: ["bache", "buche"] }],
    [0.9, { fabriquer: "abri" }],
  ],
  [
    [0.1, { noter: "eteint_vu" }],
    [0.8, { noter: "detruit:hache" }],
  ],
  [[0.2, { noter: "saisi" }]],
  [
    [0.4, { voir: ["barre_metal", "ressort_lames", "batterie_voiture"] }],
    [0.9, { atelier: true }],
  ],
  [[0.9, { noter: "nuit" }]],
  [[0.5, { voyager: "station" }]],
];

/** Le vétéran qui saute le tutoriel s'installe seul, entre deux objectifs du carnet (minutes de jeu). */
const INSTALLATION_DU_VETERAN: readonly [number, Geste][] = [
  [1, { voir: ["branche", "pierre", "buche", "baies"] }],
  [2.5, { fabriquer: "feu_de_camp" }],
  [2.6, { noter: "feu_allume" }],
  [5, { voir: ["tete_hache", "cle_plate", "tournevis", "bache", "barre_metal", "ressort_lames"] }],
  [5.1, { fouiller: "atelier" }],
  [6, { voir: ["cadre_velo", "chaine_velo", "roue_velo", "dynamo_velo"] }],
  [7, { fabriquer: "hache" }],
  [9, { fabriquer: "abri" }],
];

// ---------- Ce que le simulateur rend ----------

export interface Evenement {
  minute: number;
  genre: "recette" | "but";
  /** Les recettes dévoilées, ou le but (« Tutoriel : Le feu », « Quête : Un coffre à soi »). */
  quoi: string[];
}

export interface Mesures {
  /** Nouveautés (recettes dévoilées ou buts) dans la première demi-heure, et le plus long écart entre deux. */
  nouveautesDebut: number;
  ecartNouveautesDebut: number;
  /** Recettes dévoilées dans la première demi-heure, et le plus long écart entre deux dévoilements. */
  recettesDebut: number;
  ecartRecettesDebut: number;
  /** Après la première demi-heure : le plus long écart entre deux buts nouveaux, jusqu'au dernier but. */
  ecartButsEnsuite: number;
  /** Le dernier but proposé (le carnet n'a plus rien après, sauf ce qui attend un autre joueur). */
  dernierBut: number;
  /** Recettes dévoilées en tout, à l'horizon. */
  recettes: number;
  /** Quêtes finies à l'horizon. */
  quetesFinies: number;
}

export interface ResultatParcours {
  profil: Profil;
  famille: Famille;
  evenements: Evenement[];
  /** Ce qui bloque (une recette demandée jamais dévoilée, un ingrédient introuvable). */
  blocages: string[];
  /** Ce qui a dû attendre un dévoilement (minutes), par quête : le rythme en souffre, sans bloquer. */
  attentes: Record<string, number>;
  mesures: Mesures;
}

// ---------- Le moteur ----------

/** Le résultat d'une tentative : fait, à reprendre plus tard (une attente du monde), ou bloqué faute de recette. */
type Issue = { ok: true } | { ok: false; attente?: number; raison: string };
const OK: Issue = { ok: true };

class Simulation {
  readonly famille: Famille;
  readonly profil: Profil;
  readonly def: DefinitionProfil;
  minute = 0;
  readonly vus = new Set<string>();
  readonly faits: Record<string, number> = {};
  readonly installations = new Map<string, number>();
  readonly finies: string[] = [];
  tuto: number | null = null;
  tutoFini = false;
  readonly devoilees: Set<string>;
  readonly evenements: Evenement[] = [];
  readonly blocages = new Set<string>();
  readonly attentes: Record<string, number> = {};
  /** La minute à partir de laquelle un fait du monde est possible (le charbon défourné, la batterie chargée). */
  readonly pret: Record<string, number> = {};
  /** Ce qui arrive à heure fixe (le monde, la cueillette, les gestes du tutoriel), trié par minute. */
  private readonly agenda: { minute: number; faire: () => void }[] = [];
  /** D'où vient chaque objet qu'on peut se procurer seul. */
  private readonly sources: ReadonlyMap<TypeObjet, Source>;
  private readonly alea: () => number;
  private readonly butsVus = new Set<string>();
  private derniereDecharge = 0;

  constructor(profil: Profil, famille: Famille) {
    this.profil = profil;
    this.famille = famille;
    this.def = PROFILS[profil];
    this.devoilees = new Set(devoileesAuDepart());
    this.sources = trouvables(famille, true).objets;
    this.alea = aleaDe(graineDe("rythme", profil, famille));
    for (const a of agendaDuMonde(profil)) this.planifier(a.minute, () => this.noter(a.fait));
    if (this.def.curieux) for (const c of CUEILLETTE_CURIEUSE) this.planifier(c.minute, () => this.voir(c.objets));
  }

  planifier(minute: number, faire: () => void): void {
    let i = this.agenda.length;
    while (i > 0 && this.agenda[i - 1]!.minute > minute) i--;
    this.agenda.splice(i, 0, { minute, faire });
  }

  /** Un geste du joueur (tutoriel, installation du vétéran). */
  geste(g: Geste, contexte: string): void {
    const faire = (id: string) => {
      const i = this.fabriquer(id);
      if (!i.ok) this.blocages.add(`${this.famille} : ${contexte}, ${id} : ${i.raison}`);
    };
    if ("voir" in g) this.voir(g.voir);
    else if ("noter" in g) this.noter(g.noter);
    else if ("fouiller" in g) this.voir(Object.keys(tirerVestiges(g.fouiller, this.alea)));
    else if ("voyager" in g) this.voyager(g.voyager);
    else if ("atelier" in g) faire(ATELIER[this.famille]);
    else {
      faire(g.fabriquer);
      if (g.fabriquer === "feu_de_camp") this.poserFeu("feu_camp", 1);
    }
  }

  // ----- L'état, tel que le serveur le voit -----

  quetesVues(): Set<string> {
    if (this.tuto !== null) return new Set();
    const enCours = this.def.lignes.map((l) => queteSuivante(l, this.famille, this.finies)).filter((q): q is Quete => q !== null);
    return new Set([...enCours.map((q) => q.id), ...this.finies]);
  }

  etat(): EtatPourDevoilement {
    return {
      famille: this.famille,
      vus: this.vus,
      faits: this.faits,
      installations: this.installations,
      quetes: this.quetesVues(),
      tuto: this.tuto ?? (this.tutoFini ? 12 : null),
      minutes: this.minute,
      sansSac: false,
      devoilees: this.devoilees,
    };
  }

  reevaluer(): void {
    const neuves = aDevoiler(this.etat());
    if (neuves.length === 0) return;
    for (const id of neuves) this.devoilees.add(id);
    this.evenements.push({ minute: this.minute, genre: "recette", quoi: neuves });
  }

  but(cle: string, libelle: string): void {
    if (this.butsVus.has(cle)) return;
    this.butsVus.add(cle);
    this.evenements.push({ minute: this.minute, genre: "but", quoi: [libelle] });
  }

  voir(objets: Iterable<string>): void {
    for (const o of objets) this.vus.add(o);
  }

  noter(fait: string, n = 1): void {
    this.faits[fait] = (this.faits[fait] ?? 0) + n;
  }

  // ----- Le temps qui passe, et le monde qui vit -----

  /** Avance de `dt` minutes : ce que le monde fait entre-temps est noté à sa minute, et le filet du temps joue. */
  avancer(dt: number): void {
    const fin = this.minute + dt;
    for (;;) {
      const prochain = Math.min(this.agenda[0]?.minute ?? Infinity, ...[20, 60, 120].filter((m) => m > this.minute));
      if (prochain > fin) break;
      this.minute = Math.max(this.minute, prochain);
      while (this.agenda.length > 0 && this.agenda[0]!.minute <= this.minute) this.agenda.shift()!.faire();
      this.reevaluer();
    }
    this.minute = fin;
    // La décharge du terrain remonte un objet toutes les deux heures : on y passe en rentrant.
    if (this.minute - this.derniereDecharge >= 120) {
      this.derniereDecharge = this.minute;
      const table = tableDecharge();
      const total = table.reduce((s, [, p]) => s + p, 0);
      let r = this.alea() * total;
      for (const [t, p] of table) {
        if (r < p) {
          this.voir([t]);
          break;
        }
        r -= p;
      }
    }
    this.reevaluer();
  }

  /** Un voyage : la route (ses amas et un conteneur), et quelques fouilles à la station. */
  voyager(lieu: "station" | "comptoir"): void {
    const n = this.def.fouilles;
    const lieux: LieuFouille[] = ["boutique", "atelier", "epave", "grange"];
    for (let i = 0; i < n; i++) this.voir(Object.keys(tirerVestiges(lieux[i % lieux.length]!, this.alea)));
    const routes: TypeLieuDechets[] = ["route", "parking"];
    for (let i = 0; i < n; i++) {
      const graine = Math.floor(this.alea() * 1e9);
      this.voir(piecesAmas(graine, routes[i % 2]!, 2));
      this.voir(Object.keys(contenuConteneur(graine + 1, routes[i % 2]!, "sac_poubelle")));
    }
    if (lieu === "comptoir") this.noter("visite:comptoir");
    this.reevaluer();
  }

  // ----- Fabriquer, ramasser -----

  /** Cet objet se ramasse, se fouille ou se démonte (pas besoin de recette) ? */
  brut(t: TypeObjet): boolean {
    const s = this.sources.get(t);
    return s !== undefined && s !== "fabrication" && s !== "autres" && !(t === "charbon_bois" || t === "ebauche_arc_seche" || t === "ebauche_if_seche");
  }

  /**
   * Fabrique une recette (ou pose une carte), ingrédients compris : on ramasse d'abord ce qui se ramasse (ce qui peut
   * faire y penser), puis on fabrique ce qui se fabrique, la voie de base.
   */
  fabriquer(id: string, profondeur = 0): Issue {
    if (profondeur > 6) return { ok: false, raison: `chaîne trop longue pour ${id}` };
    const r = recette(id);
    if (!r) {
      // Une carte (le foyer Dakota) : il suffit d'y avoir pensé.
      if (!this.devoilees.has(id)) return { ok: false, raison: `${id} pas dévoilé` };
      return OK;
    }
    // Plan 0.8 (chantier 2, en attendant le chantier 14) : une recette liée à une construction attend sa construction.
    const lieu = r.lieu;
    if (lieu.genre === "construction" && !lieuPossede(lieu, this.installations)) {
      const i = this.batirPour(lieu, profondeur);
      if (!i.ok) return i;
    }
    const aFabriquer: TypeObjet[] = [];
    for (const t of Object.keys(r.ingredients) as TypeObjet[]) {
      if (this.brut(t)) this.voir([t]);
      else aFabriquer.push(t);
    }
    this.reevaluer();
    for (const t of aFabriquer) {
      if (t === "charbon_bois") {
        const c = this.charbon();
        if (!c.ok) return c;
        continue;
      }
      if (t === "ebauche_arc_seche" || t === "ebauche_if_seche") return { ok: false, raison: "attend l'ébauche sèche" };
      const m = recetteDeBase(t);
      if (!m) {
        this.blocages.add(`${this.famille} : ${t} introuvable seul (pour ${id})`);
        return { ok: false, raison: `${t} introuvable` };
      }
      const i = this.fabriquer(m.id, profondeur + 1);
      if (!i.ok) return i;
    }
    if (!this.devoilees.has(id)) return { ok: false, raison: `${id} pas dévoilé` };
    this.produire(r);
    return OK;
  }

  /** Un foyer de cette forme : le niveau du feu, et sa forme (`feu:<forme>`), comme la carte des constructions du jeu. */
  poserFeu(forme: string, niveau: number): void {
    this.installations.set("feu", Math.max(niveau, this.installations.get("feu") ?? 0));
    this.installations.set(`feu:${forme}`, 1);
  }

  /**
   * Bâtir la construction qu'une recette demande, si la maison y suffit : la racine d'une lignée (la posée), ou le foyer
   * de pierres (des pierres et des bûches du terrain). Au-delà (une clé de dehors, un niveau plus tard), elle attend.
   * Une première approche, en attendant que le chantier 14 apprenne au simulateur les sorties et les clés.
   */
  batirPour(lieu: LieuRecette, profondeur: number): Issue {
    if (lieu.genre !== "construction") return OK;
    if (lieu.construction === "feu") {
      const avec = new Map(this.installations).set("feu", Math.max(2, this.installations.get("feu") ?? 0)).set("feu:foyer_pierres", 1);
      if (!lieuPossede(lieu, avec)) return { ok: false, raison: `attend : ${nomDuLieu(lieu)}` };
      this.voir(["pierre", "buche"]);
      this.poserFeu("foyer_pierres", 2);
      this.reevaluer();
      return OK;
    }
    if (!this.installations.has(lieu.construction)) {
      const ri = RECETTES.find((x) => "installation" in x.produit && x.produit.installation === lieu.construction);
      if (!ri) return { ok: false, raison: `installation ${lieu.construction} introuvable` };
      const i = this.fabriquer(ri.id, profondeur + 1);
      if (!i.ok) return i;
    }
    // Le niveau et l'accessoire (le bac de trempe, la forge ventilée) : le simulateur ne les a jamais comptés ; il les
    // suppose faits, comme avant la 0.8, jusqu'à ce que le chantier 14 lui apprenne leurs coûts.
    const niveau = Math.max(lieu.niveau ?? 1, this.installations.get(lieu.construction) ?? 1);
    this.installations.set(lieu.construction, niveau);
    if (lieu.accessoire) this.installations.set(`${lieu.construction}+${lieu.accessoire}`, niveau);
    this.reevaluer();
    return OK;
  }

  /**
   * Monter une installation à un niveau de la maison (plan 0.8, chantier 6 : l'abri garni remplace le lit posé à part) :
   * sans clé ni « plus tard », avec ce que donne le terrain. Au-delà (une clé de dehors), elle attend le chantier 14.
   */
  monterALaMaison(type: string, niveau: number): Issue {
    const etapes = lignee(type)?.slice(1, niveau) ?? [];
    if (etapes.length !== niveau - 1 || !etapes.every((e) => !e.cle && !e.aVenir && e.etapeLieu === "maison")) return { ok: false, raison: `${type} niveau ${niveau}` };
    if (!this.installations.has(type)) {
      const r = RECETTES.find((x) => "installation" in x.produit && x.produit.installation === type);
      const i = r ? this.fabriquer(r.id) : { ok: false, raison: `installation ${type}` };
      if (!i.ok) return i;
    }
    for (const e of etapes) this.voir(Object.keys(e.couts[0] ?? {}));
    this.installations.set(type, Math.max(niveau, this.installations.get(type) ?? 1));
    this.reevaluer();
    return OK;
  }

  /** Du charbon de bois : bâtir la meule s'il le faut, attendre qu'elle cuise, défourner. */
  charbon(): Issue {
    if ((this.faits.defourne ?? 0) > 0) return OK;
    if (this.pret.defourne === undefined) {
      const i = this.fabriquer("charbonniere");
      if (!i.ok) return i;
    }
    if (this.minute < this.pret.defourne!) return { ok: false, attente: this.pret.defourne, raison: "la meule cuit" };
    this.noter("defourne");
    this.voir(["charbon_bois"]);
    this.reevaluer();
    return OK;
  }

  produire(r: Recette): void {
    this.noter(`fabrique:${r.id}`);
    if ("objet" in r.produit) this.voir([r.produit.objet]);
    else this.installations.set(r.produit.installation, 1);
    if (r.sousProduits) this.voir(Object.keys(r.sousProduits));
    if (r.id === "charbonniere") this.pret.defourne = this.minute + ATTENTE.defourne;
    if (r.id === "panneau_solaire") this.pret.wh = this.minute + ATTENTE.wh_panneau;
    this.reevaluer();
  }

  /** La première qui réussit. */
  unDe(essais: (() => Issue)[]): Issue {
    let derniere: Issue = { ok: false, raison: "rien" };
    let attente: Issue | null = null;
    for (const e of essais) {
      derniere = e();
      if (derniere.ok) return derniere;
      if (derniere.attente !== undefined && !attente) attente = derniere;
    }
    // Une voie qui n'attend que le temps vaut mieux qu'une voie bloquée.
    return attente ?? derniere;
  }

  // ----- Les objectifs du carnet -----

  remplir(c: Condition): Issue {
    switch (c.a) {
      case "fait":
        return this.faireFait(c.fait, c.but);
      case "faits": {
        const f = c.faits.find((x) => x.startsWith("fabrique:")) ?? c.faits[0]!;
        return this.faireFait(f, c.but);
      }
      case "installation": {
        if (this.installations.has(c.type) && (c.niveau ?? 1) <= (this.installations.get(c.type) ?? 0)) {
          if (c.avec) this.noter(`monte:${c.avec}`);
          return OK;
        }
        if ((c.niveau ?? 1) > 1) return this.monterALaMaison(c.type, c.niveau!);
        const r = RECETTES.find((x) => "installation" in x.produit && x.produit.installation === c.type);
        if (!r) return { ok: false, raison: `installation ${c.type}` };
        const i = this.fabriquer(r.id);
        if (i.ok && c.avec) this.noter(`monte:${c.avec}`);
        return i;
      }
      case "objet": {
        if (c.n === 1 && !c.etoiles && c.types.some((t) => this.vus.has(t))) return OK;
        const t = c.types[0]!;
        if (t === "charbon_bois") return this.charbon();
        if (this.brut(t)) {
          this.voir([t]);
          return OK;
        }
        const r = recetteDeBase(t);
        return r ? this.fabriquer(r.id) : { ok: false, raison: `${t} sans recette` };
      }
      case "wh":
        if (this.pret.wh === undefined) return { ok: false, raison: "rien pour charger" };
        return this.minute >= this.pret.wh ? OK : { ok: false, attente: this.pret.wh, raison: "la batterie charge" };
      case "un_de":
        return this.unDe(c.conditions.map((x) => () => this.remplir(x)));
      default:
        return OK;
    }
  }

  faireFait(fait: string, but: number): Issue {
    const reussi = (): Issue => {
      this.noter(fait, Math.max(0, but - (this.faits[fait] ?? 0)));
      this.reevaluer();
      return OK;
    };
    if (fait.startsWith("fabrique:")) {
      const i = this.fabriquer(fait.slice("fabrique:".length));
      return i.ok ? reussi() : i;
    }
    switch (fait) {
      case "plat_mange": {
        const i = this.unDe(["cepes_poeles", "pommes_cuites", "volaille_cepes"].map((id) => () => this.fabriquer(id)));
        return i.ok ? reussi() : i;
      }
      case "foyer_dakota": {
        const i = this.fabriquer("baton_fouir");
        if (!i.ok) return i;
        const d = this.fabriquer("foyer_dakota");
        return d.ok ? reussi() : d;
      }
      case "tete:fleche": {
        const i = this.fabriquer("fleches_durcies");
        return i.ok ? reussi() : i;
      }
      case "tete:carreau": {
        const i = this.fabriquer("carreaux_os");
        return i.ok ? reussi() : i;
      }
      case "defourne": {
        const c = this.charbon();
        return c.ok ? OK : c;
      }
      case "depot_wh": {
        const w = this.remplir({ a: "wh", but: 1 });
        return w.ok ? reussi() : w;
      }
      case "foyer:foyer_pierres":
        this.poserFeu("foyer_pierres", 2);
        return reussi();
      case "foyer:foyer_cuisine":
        this.poserFeu("foyer_cuisine", 3);
        return reussi();
      default:
        // Les faits du voyage et du métier (vendre, affûter, détruire à la décharge…) : le travail suffit.
        if (fait === "echange") return { ok: false, raison: "attend un autre joueur" };
        return reussi();
    }
  }

  /** Tente une quête : son travail, son voyage, ses objectifs dans l'ordre. */
  faireQuete(q: Quete): Issue {
    if (QUETES_SOCIALES.has(q.id)) return { ok: false, raison: "attend un autre joueur" };
    const d = DUREES_QUETES[q.id] ?? { travail: 8 };
    for (const o of q.objectifs) {
      const i = this.remplir(o.condition);
      if (!i.ok) return i;
    }
    if (d.lieu) this.voyager(d.lieu);
    this.avancer(d.travail * this.def.facteur);
    if (q.id === "dynamo") this.pret.wh = this.minute;
    this.finies.push(q.id);
    this.reevaluer();
    return OK;
  }

  // ----- Le début : le tutoriel, ou son équivalent -----

  tutoriel(): void {
    const etapes = etapesTutoriel(this.famille);
    for (let etape = 0; etape < etapes.length; etape++) {
      this.tuto = etape;
      this.but(`tuto:${etape}`, `Tutoriel : ${etapes[etape]!.titre}`);
      this.reevaluer();
      for (const id of recettesDeLEtape(etape, this.famille)) {
        if (!this.devoilees.has(id)) this.blocages.add(`${this.famille} : le tutoriel (étape ${etape + 1}) demande ${id}, pas dévoilé`);
      }
      const duree = DUREES_TUTO[etape]! * this.def.facteur;
      for (const [part, g] of GESTES_TUTO[etape]!) this.planifier(this.minute + part * duree, () => this.geste(g, `tutoriel étape ${etape + 1}`));
      this.avancer(duree);
    }
    this.tuto = null;
    this.tutoFini = true;
    this.noter("tutoriel_fini");
    this.reevaluer();
  }

  /** Le vétéran : il passe le tutoriel, connaît d'emblée les paliers 1 et 2, et s'installe seul entre deux objectifs. */
  debutSansTutoriel(): void {
    this.avancer(0.5);
    const neuves = devoileesDEmblee(this.famille).filter((id) => !this.devoilees.has(id));
    for (const id of neuves) this.devoilees.add(id);
    this.evenements.push({ minute: this.minute, genre: "recette", quoi: neuves });
    this.reevaluer();
    for (const [minute, g] of INSTALLATION_DU_VETERAN) this.planifier(minute, () => this.geste(g, "sans tutoriel"));
  }

  // ----- Le carnet, ligne par ligne -----

  /**
   * Le carnet : une quête en cours par ligne. Le joueur commence par sa ligne préférée, puis passe à la suivante
   * après chaque objectif réussi (il alterne) ; ce qui attend le monde (la meule, la charge) est repris plus tard.
   */
  carnet(): void {
    const reprise = new Map<string, number>();
    const enSouffrance = new Map<string, { depuis: number; raison: string }>();
    const lignes = this.def.lignes;
    let debut = 0;
    while (this.minute < HORIZON_MIN) {
      const ordre = lignes.map((_, i) => lignes[(debut + i) % lignes.length]!);
      const actives = ordre.map((l) => queteSuivante(l, this.famille, this.finies)).filter((q): q is Quete => q !== null);
      for (const q of actives) if (!QUETES_SOCIALES.has(q.id)) this.but(`quete:${q.id}`, `Quête : ${q.titre}`);
      this.reevaluer();
      let avance = false;
      for (const q of actives) {
        if ((reprise.get(q.id) ?? 0) > this.minute) continue;
        const i = this.faireQuete(q);
        if (i.ok) {
          const s = enSouffrance.get(q.id);
          if (s) this.attentes[q.id] = (this.attentes[q.id] ?? 0) + (this.minute - s.depuis);
          enSouffrance.delete(q.id);
          debut = (lignes.indexOf(q.ligne) + 1) % lignes.length;
          avance = true;
          break;
        }
        if (i.attente !== undefined) reprise.set(q.id, i.attente);
        else if (i.raison !== "attend un autre joueur" && !enSouffrance.has(q.id)) enSouffrance.set(q.id, { depuis: this.minute, raison: i.raison });
      }
      if (avance) continue;
      // Rien à faire tout de suite : on explore, on ramasse, on attend que la meule cuise.
      const restantes = actives.filter((q) => !QUETES_SOCIALES.has(q.id));
      if (restantes.length === 0) break;
      const prochaine = Math.min(...restantes.map((q) => reprise.get(q.id) ?? Infinity));
      this.avancer(Number.isFinite(prochaine) ? Math.max(1, Math.min(5, prochaine - this.minute)) : 5);
    }
    for (const [id, s] of enSouffrance) this.blocages.add(`${this.famille} : la quête « ${id} » bloque depuis la minute ${Math.round(s.depuis)} (${s.raison})`);
  }

  jouer(): ResultatParcours {
    if (this.def.tuto) this.tutoriel();
    else this.debutSansTutoriel();
    this.carnet();
    return { profil: this.profil, famille: this.famille, evenements: this.evenements, blocages: [...this.blocages], attentes: this.attentes, mesures: mesurer(this.evenements, this.finies.length, this.devoilees.size) };
  }
}

/** Le plus long écart entre des instants triés, bornes comprises. */
function ecartMax(instants: number[], debut: number, fin: number): number {
  const t = [debut, ...instants.filter((x) => x >= debut && x <= fin).sort((a, b) => a - b), fin];
  let max = 0;
  for (let i = 1; i < t.length; i++) max = Math.max(max, t[i]! - t[i - 1]!);
  return max;
}

export function mesurer(evenements: readonly Evenement[], quetesFinies: number, recettes: number): Mesures {
  const D = CIBLE.debutMin;
  const tous = evenements.map((e) => e.minute);
  const rec = evenements.filter((e) => e.genre === "recette").map((e) => e.minute);
  const buts = evenements.filter((e) => e.genre === "but").map((e) => e.minute);
  const dernierBut = Math.max(0, ...buts);
  return {
    nouveautesDebut: tous.filter((m) => m <= D).length,
    ecartNouveautesDebut: ecartMax(tous, 0, D),
    recettesDebut: evenements.filter((e) => e.genre === "recette" && e.minute <= D).reduce((s, e) => s + e.quoi.length, 0),
    ecartRecettesDebut: ecartMax(rec, 0, D),
    ecartButsEnsuite: dernierBut > D ? ecartMax(buts, D, dernierBut) : 0,
    dernierBut,
    recettes,
    quetesFinies,
  };
}

/** Joue un parcours type. */
export function jouerParcours(profil: Profil, famille: Famille): ResultatParcours {
  return new Simulation(profil, famille).jouer();
}

/** Tous les parcours types : chaque profil, chaque famille. */
export function tousLesParcours(): ResultatParcours[] {
  const familles: Famille[] = ["charbonniers", "voltaiques", "mecanistes"];
  return (Object.keys(PROFILS) as Profil[]).flatMap((p) => familles.map((f) => jouerParcours(p, f)));
}

/** Ce qui ne tient pas la cible, parcours par parcours (vide : le rythme tient). */
export function ecartsALaCible(r: ResultatParcours): string[] {
  const m = r.mesures;
  const p = PROFILS[r.profil];
  const fautes: string[] = [];
  const qui = `${p.nom}, ${r.famille}`;
  const c = cibleDuProfil(r.profil);
  if (c.nouveautes !== null && m.nouveautesDebut < c.nouveautes) fautes.push(`${qui} : ${m.nouveautesDebut} nouveautés dans la première demi-heure (${c.nouveautes} au moins)`);
  if (c.trou !== null && m.ecartNouveautesDebut > c.trou + 1e-9) fautes.push(`${qui} : ${m.ecartNouveautesDebut.toFixed(1)} min sans nouveauté dans la première demi-heure`);
  if (m.ecartButsEnsuite > c.buts + 1e-9) fautes.push(`${qui} : ${m.ecartButsEnsuite.toFixed(1)} min sans but nouveau après la première demi-heure`);
  if (r.blocages.length > 0) fautes.push(`${qui} : ${r.blocages.length} blocage(s)`);
  return fautes;
}

/**
 * La cible, au pas du joueur : le prudent prend son temps (×1,3), on lui accorde d'autant plus ; le pressé n'en est
 * pas plus exigeant. Le vétéran qui saute le tutoriel a choisi de tout savoir d'un coup (les paliers 1 et 2 d'emblée) :
 * on ne lui doit que des buts réguliers (null : pas de cible).
 */
export function cibleDuProfil(profil: Profil): { nouveautes: number | null; trou: number | null; buts: number } {
  const p = PROFILS[profil];
  const pas = Math.max(1, p.facteur);
  return {
    nouveautes: p.tuto ? Math.floor(CIBLE.nouveautesDebutMin / pas) : null,
    trou: p.tuto ? CIBLE.trouDebutMax * pas : null,
    buts: CIBLE.ecartButsMax * pas,
  };
}

/** Les quêtes qu'une famille voit (pour vérifier que chacune dévoile ce qu'elle demande). */
export function quetesDeLaFamille(famille: Famille): Quete[] {
  return QUETES.filter((q) => !q.famille || q.famille === famille);
}
