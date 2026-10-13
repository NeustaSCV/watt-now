// L'électricité des Voltaïques (Book 25 §5, chantier 6 · 0.6) : ce que coûte une décharge, le pack vide, l'alerte
// « Plus de courant », la recharge au banc et à la manivelle ; la plaque de choc, les clôtures et l'alarme électrique,
// par le moteur des déclencheurs (declencheurs.ts) ; depuis la 0.8 (chantier 7), le banc solaire : le panneau de la
// station posé sur le banc, qui remplit au soleil les batteries posées dessus (80 Wh par jour de calendrier) ; depuis la
// 0.8.2 (chantier C, R17), le banc fait passer l'énergie de sa batterie (une seule, à demeure) vers ce qu'on porte :
// poser la batterie, l'échanger contre une du sac, charger une chose à la fois depuis la fiche du banc.
//
// La règle de la décharge elle-même (raidir, mettre à terre, éteindre) est dans `encaisserCoup` (eteints.ts, chantier 2).
// Ce module ne connaît pas le joueur : il passe par un `ContexteElectricite` (ce que le joueur lui prête), si bien que
// joueur.ts n'ajoute que des appels d'une ligne (Book 25 §10.4).

import { armeSansCharge, chargeArme, cleArme, armeDeCle, COUT_ENDURANCE, type Arme } from "../../commun/src/combat.ts";
import { chosesACharger, estBatterie, manque, pleine, type CibleCharge } from "../../commun/src/banc.ts";
import { BATTERIES_DE_BANC, MS_JOUR_CALENDRIER, RENDEMENT_BANC, WH_CHARGE_MAX, batterieDuBanc, dureeCharge, estBatterieDeBanc, productionPanneau, stocker, type Charges, type TypeBatterie } from "../../commun/src/energie.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";
import type { InstallationVue, Verbe } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { declencheurNeuf, enregistrerDeclencheur, rearmer as rearmerDeclencheur } from "./declencheurs.ts";

// ---------- Les chiffres (Book 25 §5.4 et §8.2) ----------

/** L'endurance d'une décharge : on tient, on ne frappe pas (5 la courte, 8 la longue). */
export const ENDURANCE_DECHARGE = { courte: 5, longue: 8 } as const;
/** La manivelle de la lampe à dynamo (voie autonome), au banc : 1 Wh par minute réelle dans sa batterie, 10 d'endurance par minute. */
export const MANIVELLE = { whParMinute: 1, enduranceParMinute: 10, minutesMax: 3, kcalParHeure: 150 } as const;
/** Réarmer la plaque de choc : une décharge à recharger dans son condensateur. */
export const WH_REARMER_PLAQUE = 0.5;
/** Ce que tirent les clôtures, en continu, de la batterie du banc (Book 01 §4 : 2 à 5 W). */
export const WATTS_CLOTURE: Record<"cloture_fortune" | "cloture_electrique", number> = { cloture_fortune: 2, cloture_electrique: 3 };
/** Une clôture se branche sur un banc à moins de 6 m (le fil n'est pas long). */
export const PORTEE_CLOTURE_BANC = 6;
/** On ne dit « Plus de courant » qu'une fois, jusqu'à la prochaine recharge (Book 25 §5.4). */
const TEXTE_PLUS_DE_COURANT = "Plus de courant : ce n'est plus qu'un gourdin court. Recharge-la au banc.";

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

// ---------- Le banc solaire (plan 0.8, chantier 7) ----------

/**
 * Le panneau posé sur le banc solaire produit au calendrier, connecté ou non (`productionPanneau` : 80 Wh par jour de
 * calendrier), dans les batteries posées sur le banc ; sans batterie, ou pleines, l'énergie est perdue. À appeler avant
 * la décharge spontanée, qui avance `majLe` : on part du même instant. Rend le bilan, comme le panneau posé à part.
 */
export function produireBancsSolaires(installations: Iterable<InstallationVue>, instant: number): { produit: number; stocke: number; perdu: number } {
  const bilan = { produit: 0, stocke: 0, perdu: 0 };
  for (const banc of installations) {
    if (banc.type !== "banc_recharge" || !banc.etat.panneau) continue;
    const wh = productionPanneau(instant - (banc.etat.majLe ?? instant));
    if (wh <= 0) continue;
    const r = stocker({ batteries: banc.etat.batteries ?? {}, charges: banc.etat.charges ?? {} }, wh);
    banc.etat = { ...banc.etat, charges: r.stockage.charges };
    bilan.produit += wh;
    bilan.stocke += r.stocke;
    bilan.perdu += r.perdu;
  }
  return bilan;
}

// ---------- Le banc de recharge (0.8.2, chantier C : R17) ----------

/**
 * Le banc ne garde qu'une batterie, à demeure. Une partie d'avant la 0.8.2 a pu en poser plusieurs (la petite batterie
 * du kit avec celle de la ruine) : on garde la préférée (une batterie de voiture), le reste revient au sac avec sa
 * charge, rien ne se perd. Rend ce qui revient (null : rien à rendre) ; l'état du banc est changé.
 */
export function batteriesEnTrop(banc: InstallationVue): { batteries: Partial<Record<TypeBatterie, number>>; charges: Charges } | null {
  if (banc.type !== "banc_recharge") return null;
  const garde = batterieDuBanc(banc.etat);
  const posees = banc.etat.batteries ?? {};
  const charges = banc.etat.charges ?? {};
  const rendues: Partial<Record<TypeBatterie, number>> = {};
  const chargesRendues: Charges = {};
  const reste: Partial<Record<TypeBatterie, number>> = {};
  const chargesReste: Charges = {};
  for (const [b, n] of Object.entries(posees) as [TypeBatterie, number][]) {
    if (!n || n <= 0) continue;
    const wh = charges[b] ?? 0;
    // On garde une batterie de banc ; une petite batterie retourne toujours à la frontale.
    const gardees = garde && garde.type === b && estBatterieDeBanc(b) ? 1 : 0;
    if (gardees) {
      reste[b] = 1;
      chargesReste[b] = wh / n;
    }
    if (n - gardees > 0) {
      rendues[b] = n - gardees;
      chargesRendues[b] = (wh * (n - gardees)) / n;
    }
  }
  if (!Object.keys(rendues).length) return null;
  banc.etat = { ...banc.etat, batteries: reste, charges: chargesReste };
  return { batteries: rendues, charges: chargesRendues };
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
  /** Retirer des objets du sac (déjà vérifiés). */
  retirer(objets: Inventaire): void;
  /** Un fait pour les quêtes et les mesures. */
  noter(fait: string): void;
  info(texte: string): void;
  indice(sorte: string, texte: string): void;
  /** Un geste, en secondes réelles ; `kcalParHeure` : l'effort en plus. */
  commencer(libelle: string, dureeS: number, appliquer: () => void, kcalParHeure?: number): void;
  /** Le banc (0.8.2, R17) : sortir une batterie du sac ; rend la charge qui part avec elle (au prorata). */
  prendreBatterie(b: TypeBatterie): number;
  /** Mettre une batterie dans le sac, avec sa charge. */
  rendreBatterie(b: TypeBatterie, wh: number): void;
  /** Ajoute des Wh aux batteries d'un type qu'on porte (sans dépasser) ; rend ce qui est entré. */
  chargerBatterie(b: TypeBatterie, wh: number): number;
  /** Faire avancer la base jusqu'à maintenant (le soleil, la décharge) avant de lire une batterie posée. */
  majBase(): void;
}

/** L'électricité d'un joueur : ses décharges, ses recharges, ses pièges électriques. */
export class Electricite {
  /** L'alerte « Plus de courant » est donnée (jusqu'à la prochaine recharge). */
  private alerteDonnee = false;

  private readonly ctx: ContexteElectricite;

  constructor(ctx: ContexteElectricite) {
    this.ctx = ctx;
  }

  /**
   * Un geste du banc solaire (plan 0.8, chantier 7) : poser le panneau de la station sur le banc. Rend false si ce n'est
   * pas un geste de ce module (joueur.ts continue alors comme avant).
   */
  utiliser(i: InstallationVue, verbe: Verbe): boolean {
    if (verbe !== "poser_panneau") return false;
    if (i.type !== "banc_recharge") return true;
    if (i.etat.panneau) {
      this.ctx.info("Le panneau est déjà sur le banc.");
      return true;
    }
    if ((this.ctx.inventaire().panneau_solaire ?? 0) < 1) {
      this.ctx.info("Il te faut le petit panneau solaire : celui de la station.");
      return true;
    }
    this.ctx.commencer("Poser le panneau sur le banc", 20, () => {
      if (i.etat.panneau || (this.ctx.inventaire().panneau_solaire ?? 0) < 1) return;
      this.ctx.retirer({ panneau_solaire: 1 });
      // La production part de maintenant (pas de soleil rétroactif).
      i.etat = { ...i.etat, panneau: true, majLe: this.ctx.maintenant() };
      this.ctx.sauverInstallation(i);
      this.ctx.noter("banc:panneau");
      const bat = batterieDuBanc(i.etat);
      this.ctx.info(bat ? `Le panneau est posé, plein sud : au soleil, il remplit ${bat.nom} (80 Wh par jour).` : "Le panneau est posé, plein sud. Branche la batterie de voiture de la ruine dans le banc : le soleil s'y mettra en réserve.");
    });
    return true;
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

  // ---------- Le banc de recharge (0.8.2, chantier C : R17) ----------

  /** La batterie de banc qu'on porte (la préférée), ou null. */
  private batterieDeBancDuSac(): TypeBatterie | null {
    return BATTERIES_DE_BANC.find((b) => (this.ctx.inventaire()[b] ?? 0) > 0) ?? null;
  }

  /**
   * Poser la batterie dans le banc, à demeure : une batterie de voiture (celle de la ruine, au départ), avec sa charge.
   * Le banc n'en tient qu'une ; pour en mettre une autre, on l'échange.
   */
  poserBatterie(banc: InstallationVue): void {
    const deja = batterieDuBanc(banc.etat);
    if (deja) return this.ctx.info(`Le banc a déjà sa batterie : ${deja.nom}. Pour en mettre une autre, échange-la.`);
    const b = this.batterieDeBancDuSac();
    if (!b) return this.ctx.info("Il faut une batterie de voiture : celle de la ruine fait l'affaire.");
    this.ctx.commencer("Brancher la batterie dans le banc", 4, () => {
      if (batterieDuBanc(banc.etat) || (this.ctx.inventaire()[b] ?? 0) < 1) return;
      const wh = this.ctx.prendreBatterie(b);
      const { batterieEchangee: _ancienne, ...etat } = banc.etat;
      banc.etat = { ...etat, batteries: { [b]: 1 }, charges: { [b]: wh }, majLe: this.ctx.maintenant() };
      this.ctx.sauverInstallation(banc);
      this.ctx.noter("banc:batterie");
      const pose = batterieDuBanc(banc.etat)!;
      const soleil = banc.etat.panneau ? "Le panneau la remplit au soleil." : "Pose le panneau sur le banc : le soleil la remplira.";
      this.ctx.info(`${majuscule(pose.nom)} est dans le banc, à demeure (${arrondi(pose.wh)} Wh sur ${pose.capacite}). ${soleil}`);
    });
  }

  /** Échanger la batterie du banc contre une batterie du sac (pour emporter une batterie pleine) : l'ancienne revient au sac. */
  echanger(banc: InstallationVue): void {
    const ancienne = batterieDuBanc(banc.etat);
    if (!ancienne) return this.poserBatterie(banc);
    const b = this.batterieDeBancDuSac();
    if (!b) return this.ctx.info("Pour échanger la batterie du banc, il t'en faut une autre dans ton sac : une batterie de voiture.");
    this.ctx.commencer("Échanger la batterie du banc", 6, () => {
      this.ctx.majBase();
      const avant = batterieDuBanc(banc.etat);
      if (!avant || (this.ctx.inventaire()[b] ?? 0) < 1) return;
      // D'abord sortir celle du sac (sa charge part avec elle), puis y mettre celle du banc.
      const wh = this.ctx.prendreBatterie(b);
      this.ctx.rendreBatterie(avant.type, avant.wh);
      banc.etat = { ...banc.etat, batteries: { [b]: 1 }, charges: { [b]: wh }, batterieEchangee: true, majLe: this.ctx.maintenant() };
      this.ctx.sauverInstallation(banc);
      this.ctx.noter("banc:echange");
      const nouvelle = batterieDuBanc(banc.etat)!;
      this.ctx.info(`Échangée : ${avant.nom} revient dans ton sac (${arrondi(avant.wh)} Wh) ; ${nouvelle.nom} est dans le banc (${arrondi(nouvelle.wh)} Wh).`);
    });
  }

  /**
   * Charger une chose qu'on porte depuis la batterie du banc (R17) : la petite batterie de la frontale, une arme
   * électrique, une batterie du sac. 30 Wh par heure de jeu (une minute réelle), 85 % de rendement ; deux minutes au
   * plus par geste. Si la batterie du banc est vide, on le dit et rien ne se charge.
   */
  charger(banc: InstallationVue, cible: CibleCharge): void {
    const bat = batterieDuBanc(banc.etat);
    if (!bat) return this.ctx.info("Le banc n'a pas de batterie : pose d'abord la batterie de voiture de la ruine.");
    const chose = chosesACharger(this.ctx.inventaire(), this.ctx.charges(), this.ctx.chargeArmes()).find((c) => c.cible === cible);
    if (!chose) return;
    const plusieurs = chose.nom.startsWith("Tes ");
    if (pleine(chose)) return this.ctx.info(`${chose.nom} ${plusieurs ? "sont déjà pleines" : "est déjà pleine"}.`);
    const dispo = bat.wh * RENDEMENT_BANC;
    if (dispo < 0.25) return this.ctx.info(`${majuscule(bat.nom)}, dans le banc, est vide : rien à charger. ${banc.etat.panneau ? "Le panneau la remplit au soleil." : "Le soleil ne la remplira qu'avec le panneau posé dessus."}`);
    const transfert = Math.min(manque(chose), dispo, WH_CHARGE_MAX);
    const nom = plusieurs ? chose.nom.replace(/^Tes /, "tes ") : chose.nom.charAt(0).toLowerCase() + chose.nom.slice(1);
    this.ctx.commencer(`Charger ${nom}`, dureeCharge(transfert), () => {
      this.ctx.majBase();
      const source = batterieDuBanc(banc.etat);
      const encore = chosesACharger(this.ctx.inventaire(), this.ctx.charges(), this.ctx.chargeArmes()).find((c) => c.cible === cible);
      if (!source || !encore) return;
      const voulu = Math.min(transfert, manque(encore), source.wh * RENDEMENT_BANC);
      if (voulu <= 0) return;
      const { reste, pris } = puiser(banc.etat.charges ?? {}, voulu / RENDEMENT_BANC);
      banc.etat = { ...banc.etat, charges: reste };
      this.ctx.sauverInstallation(banc);
      const mis = pris * RENDEMENT_BANC;
      if (estBatterie(cible)) this.ctx.chargerBatterie(cible, mis);
      else {
        this.ctx.majChargeArme(cible, chargeArme(cible, this.ctx.chargeArmes()) + mis);
        this.alerteDonnee = false;
      }
      this.ctx.noter("banc:charge");
      this.ctx.info(`+${arrondi(mis)} Wh dans ${nom}. Il reste ${arrondi(batterieDuBanc(banc.etat)?.wh ?? 0)} Wh dans ${source.nom}.`);
    });
  }

  /**
   * La manivelle de la lampe à dynamo (voie autonome, Book 25 §5.4 ; 0.8.2, R17) : au banc, elle remplit lentement la
   * batterie du banc, 1 Wh par minute réelle, 10 d'endurance par minute ; on charge ensuite ce qu'on porte, depuis la
   * fiche. Le secours lent, sans soleil et sans pédalier : un Voltaïque n'est jamais désarmé, même l'hiver gris.
   */
  manivelle(banc: InstallationVue): void {
    if (!(this.ctx.inventaire().lampe_dynamo ?? 0)) return this.ctx.info("Il faut la lampe à dynamo du kit : sa manivelle remplit la batterie du banc.");
    const bat = batterieDuBanc(banc.etat);
    if (!bat) return this.ctx.info("Le banc n'a pas de batterie : pose d'abord la batterie de voiture de la ruine.");
    const place = bat.capacite - bat.wh;
    if (place <= 0.05) return this.ctx.info(`${majuscule(bat.nom)} est pleine.`);
    const minutes = Math.min(MANIVELLE.minutesMax, Math.ceil(place / MANIVELLE.whParMinute));
    if (this.ctx.endurance() < MANIVELLE.enduranceParMinute) return this.ctx.info("Trop essoufflé pour tourner la manivelle : souffle un peu.");
    this.ctx.commencer(
      "Tourner la manivelle",
      minutes * 60,
      () => {
        this.ctx.majBase();
        const source = batterieDuBanc(banc.etat);
        if (!source) return;
        const r = stocker({ batteries: banc.etat.batteries ?? {}, charges: banc.etat.charges ?? {} }, minutes * MANIVELLE.whParMinute);
        if (r.stocke <= 0) return;
        banc.etat = { ...banc.etat, charges: r.stockage.charges };
        this.ctx.sauverInstallation(banc);
        this.ctx.depenser(minutes * MANIVELLE.enduranceParMinute);
        this.ctx.info(`+${arrondi(r.stocke)} Wh dans ${source.nom}, à la force du bras.`);
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
