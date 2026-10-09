// L'électricité des Voltaïques (Book 25 §5, chantier 6 · 0.6) : ce que coûte une décharge, le pack vide, l'alerte
// « Plus de courant », la recharge au banc et à la manivelle ; la plaque de choc, les clôtures et l'alarme électrique,
// par le moteur des déclencheurs (declencheurs.ts).
//
// La règle de la décharge elle-même (raidir, mettre à terre, éteindre) est dans `encaisserCoup` (eteints.ts, chantier 2).
// Ce module ne connaît pas le joueur : il passe par un `ContexteElectricite` (ce que le joueur lui prête), si bien que
// joueur.ts n'ajoute que des appels d'une ligne (Book 25 §10.4).

import { armeSansCharge, capaciteChargeArme, chargeArme, cleArme, armeDeCle, COUT_ENDURANCE, type Arme } from "../../commun/src/combat.ts";
import { MS_JOUR_CALENDRIER, RENDEMENT_BANC, WH_RECHARGE_PAR_HEURE, type Charges, type TypeBatterie } from "../../commun/src/energie.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";
import type { InstallationVue } from "../../commun/src/messages.ts";
import { nommer, type Inventaire } from "../../commun/src/objets.ts";
import { declencheurNeuf, enregistrerDeclencheur, rearmer as rearmerDeclencheur } from "./declencheurs.ts";

// ---------- Les chiffres (Book 25 §5.4 et §8.2) ----------

/** L'endurance d'une décharge : on tient, on ne frappe pas (5 la courte, 8 la longue). */
export const ENDURANCE_DECHARGE = { courte: 5, longue: 8 } as const;
/** La manivelle de la lampe à dynamo (voie autonome) : 1 Wh par minute réelle, 10 d'endurance par minute. */
export const MANIVELLE = { whParMinute: 1, enduranceParMinute: 10, minutesMax: 3, kcalParHeure: 150 } as const;
/** Réarmer la plaque de choc : une décharge à recharger dans son condensateur. */
export const WH_REARMER_PLAQUE = 0.5;
/** Ce que tirent les clôtures, en continu, de la batterie du banc (Book 01 §4 : 2 à 5 W). */
export const WATTS_CLOTURE: Record<"cloture_fortune" | "cloture_electrique", number> = { cloture_fortune: 2, cloture_electrique: 3 };
/** Une clôture se branche sur un banc à moins de 6 m (le fil n'est pas long). */
export const PORTEE_CLOTURE_BANC = 6;
/** On ne dit « Plus de courant » qu'une fois, jusqu'à la prochaine recharge (Book 25 §5.4). */
const TEXTE_PLUS_DE_COURANT = "Plus de courant : ce n'est plus qu'un gourdin court. Recharge-la au banc, ou à la manivelle.";

const BATTERIES: TypeBatterie[] = ["petite_batterie", "batterie_voiture"];

// ---------- Les pièges électriques (Book 25 §5.3), au moteur des déclencheurs ----------

/** Les installations électriques à déclencheur. */
export const DECLENCHEURS_ELECTRIQUES = ["plaque_choc", "cloture_fortune", "cloture_electrique", "alarme_electrique"] as const;

// La plaque de choc : le premier qui marche dessus tombe à terre 4 s ; une décharge, puis il faut la réarmer.
enregistrerDeclencheur({
  type: "plaque_choc",
  nom: "la plaque de choc",
  forme: { genre: "cercle", rayon: 0.7 },
  effets: [{ genre: "mettre_a_terre", secondes: 4 }],
  prisesParArmement: 1,
  intervalle: 0,
  message: "La plaque de choc claque : un Éteint à terre. Achève-le, puis réarme-la.",
});
// La clôture de fortune : 4 m ; il se raidit 1 s et recule d'un pas. Trois qui poussent ensemble la couchent.
enregistrerDeclencheur({
  type: "cloture_fortune",
  nom: "la clôture de fortune",
  forme: { genre: "ligne", longueur: 4, epaisseur: 0.5 },
  effets: [{ genre: "raidir", secondes: 1 }, { genre: "repousser", metres: 1 }],
  prisesParArmement: Infinity,
  intervalle: 1.5,
  cede: 3,
});
// La clôture électrique : 6 m ; raidi 2 s, un pas en arrière ; il ne passe pas tant que le courant passe.
enregistrerDeclencheur({
  type: "cloture_electrique",
  nom: "la clôture électrique",
  forme: { genre: "ligne", longueur: 6, epaisseur: 0.5 },
  effets: [{ genre: "raidir", secondes: 2 }, { genre: "repousser", metres: 1 }],
  prisesParArmement: Infinity,
  intervalle: 2,
  cede: 3,
});
// L'alarme électrique : rien ne lui arrive, à lui ; la LED s'allume et l'alerte vibre, sans un bruit.
enregistrerDeclencheur({
  type: "alarme_electrique",
  nom: "l'alarme électrique",
  forme: { genre: "ligne", longueur: 5, epaisseur: 0.8 },
  effets: [],
  prisesParArmement: Infinity,
  intervalle: 20,
  message: "La LED de ton alarme s'allume : un Éteint passe le fil.",
});

// ---------- La décharge : courant, pack vide ----------

/** Ce qu'on frappe vraiment, selon la charge (Book 25 §8.2). */
export interface ArmeAlimentee {
  arme: Arme;
  appuye: boolean;
  /** Plus assez pour une décharge courte : le gourdin court. */
  vide: boolean;
  /** Maintenu, mais plus assez pour une longue : c'est une courte. */
  tropFaible: boolean;
}

/**
 * L'arme qui part, d'après la charge de l'exemplaire en main : sous 0,25 Wh, un gourdin court ; sous 1 Wh, la décharge
 * longue n'a pas de quoi tenir, elle part en courte. Une arme qui n'est pas électrique est rendue telle quelle.
 */
export function armeAlimentee(arme: Arme, appuye: boolean, charges: Partial<Record<string, number>>): ArmeAlimentee {
  const cle = cleArme(arme);
  if (arme.type !== "electrique" || !arme.electrique || !cle) return { arme, appuye, vide: false, tropFaible: false };
  const wh = chargeArme(cle, charges);
  if (wh < arme.electrique.whCourte - 1e-9) return { arme: armeSansCharge(arme), appuye, vide: true, tropFaible: false };
  if (appuye && wh < arme.electrique.whLongue - 1e-9) return { arme, appuye: false, vide: false, tropFaible: true };
  return { arme, appuye, vide: false, tropFaible: false };
}

/** L'endurance d'un coup : l'électrique se tient plus qu'il ne se frappe (Book 25 §8.2). */
export function coutEnduranceCoup(arme: Arme, appuye: boolean): number {
  if (arme.type === "electrique") return appuye ? ENDURANCE_DECHARGE.longue : ENDURANCE_DECHARGE.courte;
  return appuye ? COUT_ENDURANCE.coupAppuye : COUT_ENDURANCE.coup;
}

/** Les Wh que prend une décharge (0 pour une arme qui n'est pas électrique). */
export function whDecharge(arme: Arme, appuye: boolean): number {
  if (arme.type !== "electrique" || !arme.electrique) return 0;
  return appuye ? arme.electrique.whLongue : arme.electrique.whCourte;
}

// ---------- La recharge ----------

/** Les armes électriques du sac qui ne sont pas pleines : leur clé, ce qu'il leur manque. */
export function armesARecharger(inventaire: Inventaire, charges: Partial<Record<string, number>>): { cle: CleObjet; manque: number }[] {
  const r: { cle: CleObjet; manque: number }[] = [];
  for (const [cle, n] of Object.entries(inventaire)) {
    if (!n || n <= 0) continue;
    const a = armeDeCle(cle);
    if (!a?.electrique) continue;
    const manque = capaciteChargeArme(a) - chargeArme(cle, charges);
    if (manque > 0.05) r.push({ cle: cle as CleObjet, manque });
  }
  return r;
}

/** Le total d'une réserve de batteries. */
function total(c: Charges): number {
  return BATTERIES.reduce((s, b) => s + (c[b] ?? 0), 0);
}

/** Prend `wh` dans une réserve de batteries (la petite d'abord) ; rend ce qui a été pris. */
export function puiser(c: Charges, wh: number): { reste: Charges; pris: number } {
  const reste: Charges = { ...c };
  let besoin = wh;
  for (const b of BATTERIES) {
    if (besoin <= 0) break;
    const ici = reste[b] ?? 0;
    if (ici <= 0) continue;
    const k = Math.min(ici, besoin);
    reste[b] = ici - k;
    besoin -= k;
  }
  return { reste, pris: wh - besoin };
}

// ---------- Les clôtures et le banc ----------

/** Le banc le plus proche d'une clôture, à portée de fil (null : aucun). */
export function bancDeCloture(cloture: { x: number; z: number }, installations: Iterable<InstallationVue>): InstallationVue | null {
  let meilleur: InstallationVue | null = null;
  let d = PORTEE_CLOTURE_BANC;
  for (const i of installations) {
    if (i.type !== "banc_recharge") continue;
    const di = Math.hypot(i.x - cloture.x, i.z - cloture.z);
    if (di <= d) {
      d = di;
      meilleur = i;
    }
  }
  return meilleur;
}

function estCloture(type: string): type is keyof typeof WATTS_CLOTURE {
  return type === "cloture_fortune" || type === "cloture_electrique";
}

/**
 * Les clôtures tirent leur courant des batteries posées sur le banc, au calendrier, même hors ligne (≈ 3 W : 72 Wh par
 * jour de calendrier). Sans banc à portée, ou batteries vides, le courant ne passe plus : la clôture ne prend plus
 * personne (son déclencheur est désarmé) ; il repasse dès que le banc a de quoi. Une clôture couchée reste couchée.
 * Rend les installations changées (à sauver) ; `surBascule` est appelé quand le courant s'en va ou revient.
 */
export function alimenterClotures(installations: Iterable<InstallationVue>, instant: number, surBascule?: (i: InstallationVue) => void): InstallationVue[] {
  const toutes = [...installations];
  const changees: InstallationVue[] = [];
  for (const c of toutes) {
    if (!estCloture(c.type)) continue;
    const depuis = c.etat.majLe ?? instant;
    const banc = bancDeCloture(c, toutes);
    const besoin = (WATTS_CLOTURE[c.type] * 24 * Math.max(0, instant - depuis)) / MS_JOUR_CALENDRIER;
    let alimentee = false;
    if (banc) {
      const avant = banc.etat.charges ?? {};
      const { reste, pris } = puiser(avant, besoin);
      if (pris > 0) {
        banc.etat = { ...banc.etat, charges: reste };
        if (!changees.includes(banc)) changees.push(banc);
      }
      alimentee = pris >= besoin - 1e-9 && total(reste) > 0.01;
    }
    const etat = { ...(c.etat.declencheur ?? declencheurNeuf()) };
    const avant = etat.arme;
    if (!etat.couche) etat.arme = alimentee;
    c.etat = { ...c.etat, majLe: instant, declencheur: etat };
    changees.push(c);
    if (avant !== etat.arme) surBascule?.(c);
  }
  return changees;
}

// ---------- Le module ----------

/** Ce que le joueur prête au module de l'électricité. */
export interface ContexteElectricite {
  maintenant(): number;
  inventaire(): Inventaire;
  /** La charge de chaque exemplaire d'arme électrique (Wh qui restent ; absente : pleine). */
  chargeArmes(): Partial<Record<CleObjet, number>>;
  /** Fixer la charge d'un exemplaire (sauvé, montré dans le sac). */
  majChargeArme(cle: CleObjet, wh: number): void;
  /** Les batteries portées (petite batterie, batterie de voiture), et leur charge. */
  charges(): Charges;
  majCharges(charges: Charges): void;
  endurance(): number;
  depenser(endurance: number): void;
  /** Sauver l'état d'une installation et le montrer. */
  sauverInstallation(i: InstallationVue): void;
  info(texte: string): void;
  indice(sorte: string, texte: string): void;
  /** Un geste, en secondes réelles ; `kcalParHeure` : l'effort en plus. */
  commencer(libelle: string, dureeS: number, appliquer: () => void, kcalParHeure?: number): void;
}

/** L'électricité d'un joueur : ses décharges, ses recharges, ses pièges électriques. */
export class Electricite {
  /** L'alerte « Plus de courant » est donnée (jusqu'à la prochaine recharge). */
  private alerteDonnee = false;

  private readonly ctx: ContexteElectricite;

  constructor(ctx: ContexteElectricite) {
    this.ctx = ctx;
  }

  /** L'arme qui part vraiment (Book 25 §8.2) : un gourdin court si le pack est vide, une courte s'il est trop faible. */
  pourFrapper(arme: Arme, appuye: boolean): { arme: Arme; appuye: boolean } {
    const r = armeAlimentee(arme, appuye, this.ctx.chargeArmes());
    if (r.vide && !this.alerteDonnee) {
      this.alerteDonnee = true;
      this.ctx.info(TEXTE_PLUS_DE_COURANT);
    } else if (r.tropFaible) this.ctx.indice("decharge_faible", "Plus assez de courant pour une décharge longue : recharge.");
    return { arme: r.arme, appuye: r.appuye };
  }

  /** Une décharge qui a touché prend ses Wh au pack ; vide, on le dit une fois. */
  apresDecharge(arme: Arme, appuye: boolean): void {
    const wh = whDecharge(arme, appuye);
    const cle = cleArme(arme);
    if (wh <= 0 || !cle) return;
    const reste = Math.max(0, chargeArme(cle, this.ctx.chargeArmes()) - wh);
    this.ctx.majChargeArme(cle, reste);
    if (reste < (arme.electrique?.whCourte ?? 0) - 1e-9 && !this.alerteDonnee) {
      this.alerteDonnee = true;
      this.ctx.info(TEXTE_PLUS_DE_COURANT);
    }
  }

  /** Ajoute des Wh aux armes du sac qui en manquent, les plus vides d'abord ; rend ce qui a été mis. */
  private remplir(wh: number): number {
    let reste = wh;
    const charges = this.ctx.chargeArmes();
    for (const { cle, manque } of armesARecharger(this.ctx.inventaire(), charges).sort((a, b) => b.manque - a.manque)) {
      if (reste <= 0) break;
      const k = Math.min(manque, reste);
      this.ctx.majChargeArme(cle, chargeArme(cle, this.ctx.chargeArmes()) + k);
      reste -= k;
    }
    if (wh - reste > 0) this.alerteDonnee = false;
    return wh - reste;
  }

  /**
   * Recharger ses armes au banc (Book 25 §5.4) : le courant vient des batteries posées sur le banc, puis de celles qu'on
   * porte ; 30 Wh par heure de jeu (une minute réelle), 85 % de rendement. Un pack vide : ≈ 25 s.
   */
  rechargerAuBanc(banc: InstallationVue): void {
    const besoin = armesARecharger(this.ctx.inventaire(), this.ctx.chargeArmes()).reduce((s, a) => s + a.manque, 0);
    if (besoin <= 0) return this.ctx.info("Tes armes électriques sont pleines.");
    const dispo = (total(banc.etat.charges ?? {}) + total(this.ctx.charges())) * RENDEMENT_BANC;
    if (dispo < 0.25) return this.ctx.info("Pas de courant : pose des batteries chargées sur le banc (le panneau les charge).");
    const transfert = Math.min(besoin, dispo);
    const duree = Math.max(3, (transfert / WH_RECHARGE_PAR_HEURE) * 60);
    this.ctx.commencer("Recharger au banc", duree, () => {
      const encore = armesARecharger(this.ctx.inventaire(), this.ctx.chargeArmes()).reduce((s, a) => s + a.manque, 0);
      const voulu = Math.min(transfert, encore);
      if (voulu <= 0) return;
      // Au banc d'abord, puis dans le sac.
      const auBanc = puiser(banc.etat.charges ?? {}, voulu / RENDEMENT_BANC);
      banc.etat = { ...banc.etat, charges: auBanc.reste };
      this.ctx.sauverInstallation(banc);
      let pris = auBanc.pris;
      if (pris < voulu / RENDEMENT_BANC - 1e-9) {
        const porte = puiser(this.ctx.charges(), voulu / RENDEMENT_BANC - pris);
        this.ctx.majCharges(porte.reste);
        pris += porte.pris;
      }
      const mis = this.remplir(pris * RENDEMENT_BANC);
      this.ctx.info(`+${arrondi(mis)} Wh dans ${nomsArmes(this.ctx.inventaire())}.`);
    });
  }

  /**
   * La manivelle de la lampe à dynamo (voie autonome, Book 25 §5.4) : 1 Wh par minute réelle, 10 d'endurance par
   * minute. Lent, mais un Voltaïque n'est jamais désarmé, même l'hiver gris.
   */
  manivelle(cle: CleObjet): void {
    const inv = this.ctx.inventaire();
    if (!(inv.lampe_dynamo ?? 0)) return this.ctx.info("Il faut la lampe à dynamo du kit : sa manivelle recharge une arme.");
    const a = armeDeCle(cle);
    if (!a?.electrique || !(inv[cle] ?? 0)) return;
    const manque = capaciteChargeArme(a) - chargeArme(cle, this.ctx.chargeArmes());
    if (manque <= 0.05) return this.ctx.info(`${majuscule(a.nom)} est pleine.`);
    const minutes = Math.min(MANIVELLE.minutesMax, Math.ceil(manque / MANIVELLE.whParMinute));
    if (this.ctx.endurance() < MANIVELLE.enduranceParMinute) return this.ctx.info("Trop essoufflé pour tourner la manivelle : souffle un peu.");
    this.ctx.commencer(
      "Tourner la manivelle",
      minutes * 60,
      () => {
        const encore = capaciteChargeArme(a) - chargeArme(cle, this.ctx.chargeArmes());
        const wh = Math.min(encore, minutes * MANIVELLE.whParMinute);
        if (wh <= 0) return;
        this.ctx.majChargeArme(cle, chargeArme(cle, this.ctx.chargeArmes()) + wh);
        this.ctx.depenser(minutes * MANIVELLE.enduranceParMinute);
        this.alerteDonnee = false;
        this.ctx.info(`+${arrondi(wh)} Wh dans ${a.nom}, à la force du bras.`);
      },
      MANIVELLE.kcalParHeure,
    );
  }

  /**
   * Réarmer la plaque de choc (0,5 Wh pris aux batteries portées, sinon à une arme électrique) ; relever une clôture
   * couchée. Rend false si l'installation n'est pas électrique (un autre module s'en occupe).
   */
  rearmer(i: InstallationVue): boolean {
    if (i.type === "plaque_choc") {
      const etat = i.etat.declencheur ?? declencheurNeuf();
      if (etat.arme) {
        this.ctx.info("La plaque de choc est déjà armée.");
        return true;
      }
      if (!this.peutPayer(WH_REARMER_PLAQUE)) {
        this.ctx.info("Il faut un peu de courant (0,5 Wh) : une batterie ou une arme électrique chargée.");
        return true;
      }
      this.ctx.commencer("Réarmer la plaque de choc", 3, () => {
        const e = i.etat.declencheur ?? declencheurNeuf();
        if (e.arme || !this.payer(WH_REARMER_PLAQUE)) return;
        rearmerDeclencheur(e);
        i.etat = { ...i.etat, declencheur: e };
        this.ctx.sauverInstallation(i);
      });
      return true;
    }
    if (estCloture(i.type)) {
      const etat = i.etat.declencheur ?? declencheurNeuf();
      if (!etat.couche) {
        this.ctx.info(etat.arme ? "Le courant passe : elle tient." : "Le courant ne passe pas : un banc chargé à moins de 6 m la nourrit.");
        return true;
      }
      this.ctx.commencer("Relever la clôture", 5, () => {
        const e = i.etat.declencheur ?? declencheurNeuf();
        rearmerDeclencheur(e);
        i.etat = { ...i.etat, declencheur: e };
        this.ctx.sauverInstallation(i);
      });
      return true;
    }
    return false;
  }

  private peutPayer(wh: number): boolean {
    if (total(this.ctx.charges()) >= wh) return true;
    const charges = this.ctx.chargeArmes();
    return Object.keys(this.ctx.inventaire()).some((cle) => armeDeCle(cle)?.electrique && chargeArme(cle, charges) >= wh);
  }

  /** Prend `wh` aux batteries portées, sinon à une arme électrique du sac. */
  private payer(wh: number): boolean {
    if (total(this.ctx.charges()) >= wh) {
      this.ctx.majCharges(puiser(this.ctx.charges(), wh).reste);
      return true;
    }
    const charges = this.ctx.chargeArmes();
    for (const cle of Object.keys(this.ctx.inventaire()) as CleObjet[]) {
      if (!armeDeCle(cle)?.electrique) continue;
      const wh0 = chargeArme(cle, charges);
      if (wh0 < wh) continue;
      this.ctx.majChargeArme(cle, wh0 - wh);
      return true;
    }
    return false;
  }
}

function arrondi(wh: number): string {
  return (Math.round(wh * 10) / 10).toString().replace(".", ",");
}

function majuscule(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** « la matraque électrique », ou « tes armes électriques » s'il y en a plusieurs. */
function nomsArmes(inventaire: Inventaire): string {
  const armes = Object.keys(inventaire).filter((cle) => (inventaire[cle as CleObjet] ?? 0) > 0 && armeDeCle(cle)?.electrique);
  if (armes.length === 1) return armeDeCle(armes[0]!)?.nom ?? nommer(armes[0] as CleObjet, 1);
  return "tes armes électriques";
}
