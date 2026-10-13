// Le dévoilement des recettes côté serveur (l'arbre de progression, commun/src/progression.ts ; plan 0.8, chantier 2).
//
// Le serveur constate ce que vit le personnage (ce qui entre dans son sac, les faits comptés, ses constructions, ses
// quêtes, son tutoriel, les lieux qu'il quitte), et dévoile les recettes auxquelles il pense. Pas de calcul continu : on
// ne réévalue que lorsque quelque chose a changé (un fait noté, le sac qui change, une quête, une étape du tutoriel, une
// échéance du filet du temps), au plus deux fois par seconde. Les constats d'état (sommeil bas, Éteint en vue, pluie…)
// et les indices des clés sont regardés une fois par seconde.
//
// Depuis la 0.8 : l'idée au ramassage d'une clé (« Tu y penses », gardée si c'est trop tôt, jamais redite) et l'indice
// « où chercher » en deux temps (le type de lieu, puis le coin, après une visite du bon lieu sans la clé ou 45 min).

import type { Inventaire } from "../../commun/src/objets.ts";
import { typeDe } from "../../commun/src/etoiles.ts";
import { FAMILLES, type Famille } from "../../commun/src/regles.ts";
import type { SavoirRecettes } from "../../commun/src/recettes.ts";
import { lieuDeLEtape } from "../../commun/src/lieux.ts";
import {
  ECHEANCES_TEMPS,
  INDICE_SECOND_TEMPS_MIN,
  PROGRESSION_VIDE,
  TEXTE_VETERAN,
  aDevoiler,
  armeEnAttente,
  autresAtteints,
  devoileesAuDepart,
  devoileesDEmblee,
  entrevues,
  etapeAvecCle,
  indicesOuverts,
  meubleComplet,
  nouvellesIdees,
  progressionValide,
  silhouettes,
  texteDevoilement,
  type EtatPourDevoilement,
  type EtatProgression,
  type VueProgression,
} from "../../commun/src/progression.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";

/** Au plus un message « Tu y penses » toutes les 10 s : les idées d'une même fouille sont regroupées (§4.1). */
export const INTERVALLE_MESSAGE_MS = 10_000;
/** On regarde s'il y a du neuf au plus deux fois par seconde. */
const INTERVALLE_VERIF_MS = 500;
/** Les constats d'état et les indices, une fois par seconde. */
const INTERVALLE_CONSTATS_MS = 1000;

/** Les constats d'état que le serveur note une fois, la première fois qu'ils sont vrais (§2.3). */
export const CONSTATS = ["sommeil_bas", "eteint_vu", "blessure", "saisi", "pluie", "sac_lourd"] as const;
export type Constat = (typeof CONSTATS)[number];

/**
 * Une entrée de la carte des constructions (`carteInstallations` de lieu-recette.ts) : un type d'installation à son
 * niveau, « feu » au niveau du foyer, `feu:<forme>` pour chaque forme, `<type>+<accessoire>` pour un accessoire monté.
 */
export interface ConstructionVue {
  type: string;
  niveau?: number;
}

/** Ce que le suivi regarde chez le joueur (le joueur le remplit ; les tests aussi). */
export interface SourceDevoilement {
  famille: Famille;
  maintenant(): number;
  savoir(): SavoirRecettes;
  inventaire(): Inventaire;
  faits(): Readonly<Record<string, number>>;
  /** La carte des constructions du terrain (`carteInstallations`) : types, formes du feu, accessoires. */
  installations(): Iterable<ConstructionVue>;
  /** Les quêtes en cours ou finies (aucune pendant le tutoriel). */
  quetes(): Iterable<string>;
  /** L'étape du tutoriel en cours ; null : pas de tutoriel en cours. */
  tuto(): number | null;
  sansSac(): boolean;
  /** Le lieu où l'on est (« terrain », « station »…) ; null : en route. */
  lieu(): string | null;
  /** Les constats vrais à cet instant (seulement ceux qu'on demande : ceux jamais encore notés). */
  constats(quels: readonly Constat[]): Constat[];
  noter(fait: string): void;
  envoyer(m: MessageServeur): void;
}

/** La carte des constructions du dévoilement : chaque clé à son meilleur niveau (`lieuPossede` la lit). */
export function carteConstructions(liste: Iterable<ConstructionVue>): Map<string, number> {
  const carte = new Map<string, number>();
  for (const i of liste) carte.set(i.type, Math.max(carte.get(i.type) ?? 0, i.niveau ?? 1));
  return carte;
}

export class SuiviDevoilement {
  etat: EtatProgression;
  private readonly source: SourceDevoilement;
  private readonly devoilees: Set<string>;
  private readonly vus: Set<string>;
  private readonly idees: Set<string>;
  /** Quelque chose a changé : il faut réévaluer. */
  private sale = true;
  /** L'état a changé depuis la dernière sauvegarde. */
  aSauver = false;
  private derniereVerif = -Infinity;
  private derniersConstats = -Infinity;
  private inventaireVu: Inventaire | null = null;
  private dernierMessage = -Infinity;
  /** Les idées pas encore annoncées (regroupées). */
  private enAttente: string[] = [];
  private cleQuetes = "";
  private tutoVu: number | null = null;
  private lieuVu: string | null;
  /** Ce qu'on a envoyé des autres familles (pour ne renvoyer la liste que si elle change). */
  private cleAutres = "";
  /** Les meubles de famille complets au dernier regard (R26 : la pièce posée ouvre les armes de son métier). */
  private meubleVu: string | null = null;
  private secondesSauvees = 0;

  /** `etat` null : un personnage neuf (la base démarre neuve en 0.8, §9.1) : le feu et l'abri. */
  constructor(etat: EtatProgression | null, source: SourceDevoilement) {
    this.etat = progressionValide(etat ?? { ...PROGRESSION_VIDE, devoilees: devoileesAuDepart() });
    this.source = source;
    this.devoilees = new Set(this.etat.devoilees);
    this.vus = new Set(this.etat.vus);
    this.idees = new Set(this.etat.idees);
    this.tutoVu = source.tuto();
    this.lieuVu = source.lieu();
    this.secondesSauvees = this.etat.secondes;
  }

  // ---------- Ce que le joueur demande ----------

  /**
   * L'état à sauver, s'il le faut (un dévoilement, une carte vue, un objet nouveau, une idée, un indice, ou une minute
   * de jeu de plus) ; null : rien de neuf. On considère qu'il est sauvé.
   */
  aEnregistrer(): EtatProgression | null {
    if (!this.aSauver && this.etat.secondes - this.secondesSauvees < 60) return null;
    this.aSauver = false;
    this.secondesSauvees = this.etat.secondes;
    return this.etat;
  }

  /** Dévoilée, et pas en attente du meuble complet (R26 : une arme de métier gardée d'une partie 0.8.1 attend sa pièce). */
  estDevoilee(id: string): boolean {
    return this.devoilees.has(id) && !armeEnAttente(id, this.constructions());
  }

  /** Quelque chose a changé (un fait, une quête, le savoir, une construction) : on réévaluera au prochain passage. */
  aRevoir(): void {
    this.sale = true;
  }

  /** Le client a montré ces cartes : plus de pastille ni de « Nouveau » pour elles. */
  marquerVues(ids: readonly string[]): void {
    const avant = this.etat.nonVues.length;
    const lues = new Set(ids);
    this.etat.nonVues = this.etat.nonVues.filter((id) => !lues.has(id));
    if (this.etat.nonVues.length !== avant) this.aSauver = true;
  }

  /**
   * Le vétéran qui passe le tutoriel (Q8, plan 0.8 §3) : les recettes communes à la main d'un coup, annoncées sobrement ;
   * le carnet lui dit que sa famille l'attend à la station (Q-0.8-15).
   */
  devoilerDEmblee(): void {
    const neuves = devoileesDEmblee(this.source.famille).filter((id) => !this.devoilees.has(id));
    this.ajouter(neuves, false);
    this.annoncer(neuves, true);
  }

  // ---------- Le passage régulier ----------

  /** À chaque tic du joueur (en jeu, hors pause) : compte le temps, et réévalue seulement si quelque chose a changé. */
  tick(dt: number): void {
    const avant = this.etat.secondes / 60;
    this.etat.secondes += dt;
    const apres = this.etat.secondes / 60;
    if (ECHEANCES_TEMPS.some((m) => avant < m && apres >= m)) this.sale = true;
    const instant = this.source.maintenant();
    if (instant - this.derniereVerif < INTERVALLE_VERIF_MS) return;
    this.derniereVerif = instant;
    if (instant - this.derniersConstats >= INTERVALLE_CONSTATS_MS) {
      this.derniersConstats = instant;
      this.constater();
      this.suivreMeuble();
      this.suivreLieu();
      this.suivreIndices();
    }
    this.regarderSac();
    const tuto = this.source.tuto();
    if (tuto !== this.tutoVu) {
      this.tutoVu = tuto;
      this.sale = true;
    }
    const cle = [...this.source.quetes()].join(",");
    if (cle !== this.cleQuetes) {
      this.cleQuetes = cle;
      this.sale = true;
    }
    if (this.sale) this.reevaluer(true);
    if (this.enAttente.length > 0 && instant - this.dernierMessage >= INTERVALLE_MESSAGE_MS) this.annoncer([], false);
  }

  /** Les constats jamais encore notés, regardés une fois par seconde. */
  private constater(): void {
    const faits = this.source.faits();
    const manquent = CONSTATS.filter((c) => !(faits[c]! > 0));
    if (manquent.length === 0) return;
    for (const c of this.source.constats(manquent)) this.source.noter(c);
  }

  /** Le sac a changé : ce qui y est entré pour la première fois rejoint les objets vus ; une clé fait naître son idée. */
  private regarderSac(): void {
    const inv = this.source.inventaire();
    if (inv === this.inventaireVu) return;
    this.inventaireVu = inv;
    let neuf = false;
    for (const [cle, n] of Object.entries(inv)) {
      if (!((n ?? 0) > 0)) continue;
      const t = typeDe(cle);
      if (this.vus.has(t)) continue;
      this.vus.add(t);
      this.etat.vus.push(t);
      neuf = true;
    }
    if (neuf) {
      this.aSauver = true;
      this.sale = true;
    }
    this.penser(inv);
  }

  /**
   * L'idée au ramassage (plan 0.8 §2.2) : la première fois qu'une clé entre dans le sac (ou l'outil clé en main), le
   * message `idee` (ou « un jour », si le niveau d'avant n'est pas posé). L'idée est gardée : jamais redite.
   */
  private penser(inv: Inventaire): void {
    const idees = nouvellesIdees({ vus: this.vus, installations: this.constructions(), idees: this.idees, inventaire: inv });
    if (idees.length === 0) return;
    for (const i of idees) {
      this.idees.add(i.etape);
      this.etat.idees.push(i.etape);
      this.source.noter(`idee:${i.etape}`);
      if (i.texte) this.source.envoyer({ t: "idee", etape: i.etape, texte: i.texte, plusTard: i.plusTard, ...(i.objet ? { objet: i.objet } : {}) });
    }
    this.aSauver = true;
    this.sale = true;
    // La fiche montre la clé « déjà en poche » : la vue suit tout de suite.
    this.source.envoyer({ t: "devoilement", progression: this.vue(), nouvelles: [] });
  }

  /**
   * Les indices « où chercher » (plan 0.8 §2.2, Q-0.8-16) : un indice s'ouvre au premier temps (le type de lieu) quand
   * son étape devient le niveau suivant d'une construction qu'on a ; il passe au second (le coin) après 45 min de jeu.
   * Chaque passage est noté en fait `indice:<étape>` (1, puis 2).
   */
  private suivreIndices(): void {
    let change = false;
    const ouverts = indicesOuverts({ installations: this.constructions(), devoilees: this.devoilees, idees: this.idees });
    for (const x of ouverts) {
      const id = x.etape.id;
      const i = this.etat.indices[id];
      if (!i) {
        this.etat.indices[id] = { depuis: this.etat.secondes, temps: 1 };
        this.source.noter(`indice:${id}`);
        change = true;
      } else if (i.temps === 1 && this.etat.secondes - i.depuis >= INDICE_SECOND_TEMPS_MIN * 60) change = this.secondTemps(id) || change;
    }
    if (change) this.indicesChanges();
  }

  /**
   * R26 : la pièce posée sur un meuble de famille (l'enclume, le panneau, l'alternateur) ne note pas toujours de fait ;
   * on regarde les trois meubles une fois par seconde (un meuble appris compte, §7.3), et une pièce posée fait
   * réévaluer (les armes de son métier se dévoilent alors).
   */
  private suivreMeuble(): void {
    const carte = this.constructions();
    const complet = FAMILLES.filter((f) => meubleComplet(f, carte)).join(",");
    if (complet !== this.meubleVu) {
      if (this.meubleVu !== null) this.sale = true;
      this.meubleVu = complet;
    }
  }

  /** On quitte un lieu : un indice ouvert de ce lieu, dont on n'a pas trouvé la clé, passe au second temps. */
  private suivreLieu(): void {
    const lieu = this.source.lieu();
    if (lieu === this.lieuVu) return;
    const quitte = this.lieuVu;
    this.lieuVu = lieu;
    if (quitte === null) return;
    let change = false;
    for (const [id, i] of Object.entries(this.etat.indices)) {
      if (i.temps !== 1 || this.idees.has(id)) continue;
      const cle = etapeAvecCle(id)?.etape.cle;
      if (cle && lieuDeLEtape(cle.ou) === quitte && !(cle.objet && this.vus.has(cle.objet))) change = this.secondTemps(id) || change;
    }
    if (change) this.indicesChanges();
  }

  private secondTemps(id: string): boolean {
    const i = this.etat.indices[id];
    if (!i || i.temps === 2) return false;
    i.temps = 2;
    this.source.noter(`indice:${id}`);
    return true;
  }

  private indicesChanges(): void {
    this.aSauver = true;
    this.source.envoyer({ t: "devoilement", progression: this.vue(), nouvelles: [] });
  }

  private constructions(): Map<string, number> {
    return carteConstructions(this.source.installations());
  }

  private etatPour(): EtatPourDevoilement {
    const faits = this.source.faits();
    const tutoEnCours = this.source.tuto();
    return {
      famille: this.source.famille,
      savoir: this.source.savoir(),
      vus: this.vus,
      faits,
      installations: this.constructions(),
      quetes: new Set(this.source.quetes()),
      tuto: tutoEnCours ?? ((faits.tutoriel_fini ?? 0) > 0 ? 12 : null),
      minutes: this.etat.secondes / 60,
      sansSac: this.source.sansSac(),
      devoilees: this.devoilees,
      idees: this.idees,
    };
  }

  /** Réévalue tout de suite (le serveur l'appelle aussi après une leçon, un manuel). */
  reevaluer(annoncer: boolean): void {
    this.sale = false;
    this.regarderSac();
    const neuves = aDevoiler(this.etatPour());
    if (neuves.length > 0) {
      this.ajouter(neuves, annoncer);
      if (annoncer) this.annoncer(neuves, false);
      return;
    }
    // Rien de neuf à fabriquer, mais les cartes des autres familles, ou les silhouettes, ont pu changer.
    if (!annoncer) return;
    const avant = this.cleAutres;
    const v = this.vue();
    if (this.cleAutres !== avant) this.source.envoyer({ t: "devoilement", progression: v, nouvelles: [] });
  }

  private ajouter(ids: readonly string[], nonVues: boolean): void {
    for (const id of ids) {
      if (this.devoilees.has(id)) continue;
      this.devoilees.add(id);
      this.etat.devoilees.push(id);
      if (nonVues) this.etat.nonVues.push(id);
    }
    this.aSauver = true;
  }

  /**
   * Le message au client : la liste à jour part tout de suite (la pastille), le texte au plus une fois toutes les
   * 10 s (les idées d'entre-temps sont regroupées en « 3 idées nouvelles »).
   */
  private annoncer(neuves: readonly string[], sobre: boolean): void {
    const instant = this.source.maintenant();
    this.enAttente.push(...neuves);
    let texte: string | null = null;
    if (sobre) {
      texte = TEXTE_VETERAN;
      this.enAttente = [];
      this.dernierMessage = instant;
    } else if (this.enAttente.length > 0 && instant - this.dernierMessage >= INTERVALLE_MESSAGE_MS) {
      texte = texteDevoilement(this.enAttente, this.source.famille);
      this.enAttente = [];
      this.dernierMessage = instant;
    }
    this.source.envoyer({ t: "devoilement", progression: this.vue(), nouvelles: [...neuves], ...(texte ? { texte } : {}) });
  }

  /** Ce que le client reçoit (bienvenue, et chaque dévoilement). */
  vue(): VueProgression {
    const e = this.etatPour();
    const indices: Record<string, 1 | 2> = {};
    for (const [id, i] of Object.entries(this.etat.indices)) if (!this.idees.has(id)) indices[id] = i.temps;
    // R26 : ce qui attend le meuble complet ne part pas (gardé en base, il revient avec la pièce posée).
    const attend = (id: string) => armeEnAttente(id, e.installations);
    const v: VueProgression = {
      devoilees: this.etat.devoilees.filter((id) => !attend(id)),
      nonVues: this.etat.nonVues.filter((id) => !attend(id)),
      silhouettes: silhouettes(e),
      autres: autresAtteints(e),
      entrevues: entrevues(e),
      idees: [...this.etat.idees],
      indices,
    };
    // Les cartes gardées qui attendaient le meuble complet (R26) reviennent sans rien dévoiler de neuf : la liste compte.
    this.cleAutres = `${v.autres}|${v.entrevues.join(",")}|${v.silhouettes.map((s) => s.id).join(",")}|${v.devoilees.length}`;
    return v;
  }
}
