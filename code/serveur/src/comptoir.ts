// Le Comptoir du Carrefour, côté serveur (Book 07 §3 et §4, Book 21 §3.7) : un seul pour tout le serveur.
// Sa trésorerie paie ses achats et le pédalage ; ses ventes la remplissent. Il ne crée des wotts que
// contre de l'électricité déposée dans ses cellules.

import {
  CAPACITE_CELLULES,
  DOTATION_CARREFOUR,
  DOTATION_PAR_JOUEUR,
  RESERVE_ENERGIE_DEPART,
  STOCK_DE_BASE,
  prixAchat,
  reassortir,
  tresorerieBasse,
  type EtatComptoir,
} from "../../commun/src/economie.ts";
import type { MessageServeur, VueComptoir } from "../../commun/src/messages.ts";
import { OBJETS, type TypeObjet } from "../../commun/src/objets.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";
import type { Base } from "./base.ts";

interface EtatEnBase extends EtatComptoir {
  /** Combien de comptes ont déjà reçu leur dotation (Book 07 §3.6 : la trésorerie suit la population). */
  comptesDotes: number;
}

export class Comptoir {
  private etat: EtatEnBase;
  private readonly base: Base;
  private readonly presents = new Set<(m: MessageServeur) => void>();

  constructor(base: Base, instant = Date.now()) {
    this.base = base;
    this.etat = base.lireMonde<EtatEnBase>("comptoir") ?? {
      tresorerie: DOTATION_CARREFOUR,
      reserveWh: RESERVE_ENERGIE_DEPART,
      stock: { ...STOCK_DE_BASE },
      reassortLe: instant,
      comptesDotes: 0,
    };
    this.doter();
  }

  /** Chaque nouveau joueur ajoute sa dotation à la trésorerie. */
  doter(): void {
    const n = this.base.nombreComptes();
    if (n > this.etat.comptesDotes) {
      this.etat.tresorerie += (n - this.etat.comptesDotes) * DOTATION_PAR_JOUEUR;
      this.etat.comptesDotes = n;
      this.sauver();
    }
  }

  private dotationTotale(): number {
    return DOTATION_CARREFOUR + this.etat.comptesDotes * DOTATION_PAR_JOUEUR;
  }

  get basse(): boolean {
    return tresorerieBasse(this.etat, this.dotationTotale());
  }

  get tresorerie(): number {
    return this.etat.tresorerie;
  }

  get stock() {
    return this.etat.stock;
  }

  get reserveWh(): number {
    return this.etat.reserveWh;
  }

  entrer(envoyer: (m: MessageServeur) => void): void {
    this.presents.add(envoyer);
  }

  sortir(envoyer: (m: MessageServeur) => void): void {
    this.presents.delete(envoyer);
  }

  vue(instant: number): VueComptoir {
    this.etat = { ...reassortir(this.etat, instant), comptesDotes: this.etat.comptesDotes };
    const achats: VueComptoir["achats"] = {};
    for (const type of Object.keys(OBJETS) as TypeObjet[]) achats[type] = prixAchat(type, this.basse);
    return { stock: this.etat.stock, achats, tresorerieBasse: this.basse, reserveWh: Math.round(this.etat.reserveWh) };
  }

  // ---------- Opérations : chacune vérifie ce que le comptoir peut faire ----------

  /** Le comptoir paie (achat d'un objet, pédalage) : faux si sa trésorerie n'y suffit pas. */
  payer(montant: number): boolean {
    // Un montant qui n'est pas un nombre positif fini ne passe jamais (il rendrait la trésorerie commune NaN).
    if (!Number.isFinite(montant) || montant < 0 || montant > this.etat.tresorerie) return false;
    this.etat.tresorerie -= montant;
    return true;
  }

  encaisser(montant: number): void {
    if (!Number.isFinite(montant) || montant < 0) return;
    this.etat.tresorerie += montant;
  }

  entrerEnStock(type: CleObjet, n: number): void {
    this.etat.stock = { ...this.etat.stock, [type]: (this.etat.stock[type] ?? 0) + n };
  }

  sortirDuStock(type: CleObjet, n: number): boolean {
    if ((this.etat.stock[type] ?? 0) < n) return false;
    const stock = { ...this.etat.stock, [type]: (this.etat.stock[type] ?? 0) - n };
    if (!stock[type]) delete stock[type];
    this.etat.stock = stock;
    return true;
  }

  /** Place libre dans les cellules, en Wh_é (Book 07 §3.4 : capacité limitée). */
  placeCellules(): number {
    return Math.max(0, CAPACITE_CELLULES - this.etat.reserveWh);
  }

  stocker(wh: number): void {
    this.etat.reserveWh += wh;
  }

  destocker(wh: number): boolean {
    if (wh > this.etat.reserveWh) return false;
    this.etat.reserveWh -= wh;
    return true;
  }

  /** Après chaque opération : on enregistre, et tout le monde au comptoir voit le nouveau stock. */
  publier(instant: number): void {
    this.sauver();
    const m: MessageServeur = { t: "comptoir", comptoir: this.vue(instant) };
    for (const envoyer of this.presents) envoyer(m);
  }

  private sauver(): void {
    this.base.ecrireMonde("comptoir", this.etat);
  }
}
