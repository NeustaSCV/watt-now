// Le dévoilement des recettes côté serveur (l'arbre de progression, commun/src/progression.ts).
//
// Le serveur constate ce que vit le personnage (ce qui entre dans son sac, les faits comptés, ses installations, ses
// quêtes, son tutoriel), et dévoile les recettes auxquelles il pense. Pas de calcul continu : on ne réévalue que
// lorsque quelque chose a changé (un fait noté, le sac qui change, une quête, une étape du tutoriel, une échéance du
// filet du temps), au plus deux fois par seconde. Les constats d'état (sommeil bas, Éteint en vue, pluie…) sont
// regardés une fois par seconde, et seulement tant qu'ils n'ont jamais été vus.

import type { Inventaire } from "../../commun/src/objets.ts";
import { typeDe } from "../../commun/src/etoiles.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { RECETTES, type SavoirRecettes } from "../../commun/src/recettes.ts";
import {
  ECHEANCES_TEMPS,
  aDevoiler,
  autresAtteints,
  devoileesAuDepart,
  devoileesDEmblee,
  entrevues,
  prochainPalier,
  progressionValide,
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
/** Les constats d'état, une fois par seconde. */
const INTERVALLE_CONSTATS_MS = 1000;

/** Les constats d'état que le serveur note une fois, la première fois qu'ils sont vrais (§2.3). */
export const CONSTATS = ["sommeil_bas", "eteint_vu", "blessure", "saisi", "pluie", "sac_lourd"] as const;
export type Constat = (typeof CONSTATS)[number];

/** Ce que le suivi regarde chez le joueur (le joueur le remplit ; les tests aussi). */
export interface SourceDevoilement {
  famille: Famille;
  maintenant(): number;
  savoir(): SavoirRecettes;
  inventaire(): Inventaire;
  faits(): Readonly<Record<string, number>>;
  /** Les installations du terrain (type, niveau), et les feux sous le type « feu ». */
  installations(): Iterable<{ type: string; niveau?: number }>;
  /** Les quêtes en cours ou finies (aucune pendant le tutoriel). */
  quetes(): Iterable<string>;
  /** L'étape du tutoriel en cours ; null : pas de tutoriel en cours. */
  tuto(): number | null;
  sansSac(): boolean;
  /** Les constats vrais à cet instant (seulement ceux qu'on demande : ceux jamais encore notés). */
  constats(quels: readonly Constat[]): Constat[];
  noter(fait: string): void;
  envoyer(m: MessageServeur): void;
}

export class SuiviDevoilement {
  etat: EtatProgression;
  private readonly source: SourceDevoilement;
  private readonly devoilees: Set<string>;
  private readonly vus: Set<string>;
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
  /** Ce qu'on a envoyé des autres familles (pour ne renvoyer la liste que si elle change). */
  private cleAutres = "";
  private secondesSauvees = 0;

  constructor(etat: EtatProgression, source: SourceDevoilement) {
    this.etat = progressionValide(etat);
    this.source = source;
    this.devoilees = new Set(this.etat.devoilees);
    this.vus = new Set(this.etat.vus);
    this.tutoVu = source.tuto();
    this.secondesSauvees = this.etat.secondes;
  }

  // ---------- Les personnages d'avant la 0.7 ----------
  // (Un nouveau personnage reçoit son état à la création : base.ts, `creerCompte`.)

  /**
   * Un personnage d'avant la 0.7 (décision Q4) : il ne voit plus ce qu'il n'a pas encore validé, mais on ne détruit
   * rien. On évalue les déclencheurs sur son état actuel : son sac, ses coffres, ses installations, les recettes déjà
   * fabriquées (les faits `fabrique:`), ses quêtes. Tout ce qui se dévoile ainsi est marqué vu (pas de pastille « 40 »).
   */
  static migrer(source: SourceDevoilement, coffres: Iterable<Inventaire> = []): EtatProgression {
    const vus = new Set<string>();
    const ajouter = (inv: Inventaire) => {
      for (const [cle, n] of Object.entries(inv)) if ((n ?? 0) > 0) vus.add(typeDe(cle));
    };
    ajouter(source.inventaire());
    for (const c of coffres) ajouter(c);
    // Ce qu'il a déjà fabriqué est passé par son sac.
    for (const [cle, n] of Object.entries(source.faits())) {
      if (!cle.startsWith("fabrique:") || !(n > 0)) continue;
      const r = RECETTES.find((x) => x.id === cle.slice("fabrique:".length));
      if (r && "objet" in r.produit) vus.add(r.produit.objet);
    }
    const suivi = new SuiviDevoilement({ devoilees: devoileesAuDepart(), nonVues: [], vus: [...vus], secondes: 0 }, source);
    suivi.reevaluer(false);
    return { ...suivi.etat, nonVues: [] };
  }

  // ---------- Ce que le joueur demande ----------

  /**
   * L'état à sauver, s'il le faut (un dévoilement, une carte vue, un objet nouveau, ou une minute de jeu de plus) ;
   * null : rien de neuf. On considère qu'il est sauvé.
   */
  aEnregistrer(): EtatProgression | null {
    if (!this.aSauver && this.etat.secondes - this.secondesSauvees < 60) return null;
    this.aSauver = false;
    this.secondesSauvees = this.etat.secondes;
    return this.etat;
  }

  estDevoilee(id: string): boolean {
    return this.devoilees.has(id);
  }

  /** Quelque chose a changé (un fait, une quête, le savoir) : on réévaluera au prochain passage. */
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

  /** Le vétéran qui passe le tutoriel (Q8) : les paliers 1 et 2 d'un coup, annoncés sobrement. */
  devoilerDEmblee(): void {
    const neuves = devoileesDEmblee(this.source.famille).filter((id) => !this.devoilees.has(id));
    this.ajouter(neuves, false);
    if (neuves.length > 0) this.annoncer(neuves, true);
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

  /** Le sac a changé : ce qui y est entré pour la première fois rejoint les objets vus. */
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
  }

  private etatPour(): EtatPourDevoilement {
    const installations = new Map<string, number>();
    for (const i of this.source.installations()) installations.set(i.type, Math.max(installations.get(i.type) ?? 0, i.niveau ?? 1));
    const faits = this.source.faits();
    const tutoEnCours = this.source.tuto();
    return {
      famille: this.source.famille,
      savoir: this.source.savoir(),
      vus: this.vus,
      faits,
      installations,
      quetes: new Set(this.source.quetes()),
      tuto: tutoEnCours ?? ((faits.tutoriel_fini ?? 0) > 0 ? 12 : null),
      minutes: this.etat.secondes / 60,
      sansSac: this.source.sansSac(),
      devoilees: this.devoilees,
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
    // Rien de neuf à fabriquer, mais les cartes des autres familles ont pu se montrer (Comptoir, rencontre, vu faire).
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
      texte = "Tu y penses : les gestes de base te reviennent tous.";
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
    const v: VueProgression = {
      devoilees: [...this.etat.devoilees],
      nonVues: [...this.etat.nonVues],
      prochain: prochainPalier(this.source.famille, this.devoilees, e.quetes, e.savoir),
      autres: autresAtteints(e),
      entrevues: entrevues(e),
    };
    this.cleAutres = `${v.autres}|${v.entrevues.join(",")}`;
    return v;
  }
}
