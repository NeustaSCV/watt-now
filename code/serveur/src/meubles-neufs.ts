// Les meubles nouveaux du niveau 2 côté serveur (plan 0.10, chantier D ; S-22 à S-30) : ce que la fabrication, le
// démontage et la base ordinaires (joueur.ts) ne savent pas faire, et que ces meubles ajoutent :
// - le cuiseur solaire : faire bouillir l'eau sans bois, et cuire les plats du foyer de pierres au soleil (deux fois plus
//   lentement ; quatre par temps voilé ; rien sous un ciel couvert, sous la pluie, ni la nuit) ;
// - les bacs de tri : démonter deux fois plus vite à 3 m, une matière de plus un démontage sur trois (tirée ici) ;
// - le creuset 🔥 : le poser sur la forge ventilée (ses deux recettes sont dans recettes/charbonniers.ts) ;
// - le moulin de jerricans ⚙️ : il remplit la batterie de la base au vent, au calendrier, même hors ligne ; la poulie
//   d'aluminium posée sur son axe : + 50 % ;
// - la rampe de LED ⚡ : elle tire 3 W sur la batterie de la base, la nuit seulement ; batterie vide, elle s'éteint ;
// - l'arbalète de garde ⚙️ : le premier Éteint qui passe le fil, à 1 m devant elle, reçoit un carreau (les dégâts de
//   l'arbalète posée) ; puis on la réarme (2 s au cranequin léger, 3 s sinon). Elle ne regarde que les Éteints : un
//   joueur qui passe le fil ne la déclenche pas (N2-Q5).
// Les règles pures sont dans commun/src/meubles-neufs.ts et commun/src/energie.ts. Ce module ne connaît pas le joueur :
// il passe par un `ContexteMeublesNeufs` ; joueur.ts n'ajoute que des appels d'une ligne (Book 25 §10.4).

import { debout, type Eteint } from "../../commun/src/eteints.ts";
import { cleExemplaire, etoilesDe, etoilesDeBase, exemplaires } from "../../commun/src/etoiles.ts";
import { meubleABatterieProche, msDeNuit, productionMoulin, stocker, whDePuissance, type Charges } from "../../commun/src/energie.ts";
import type { Zone } from "../../commun/src/lieux.ts";
import type { InstallationVue, Verbe } from "../../commun/src/messages.ts";
import { meteo } from "../../commun/src/meteo.ts";
import { ETAGERES_KG, POSER_ETAGERES_S } from "../../commun/src/meubles-niveau2.ts";
import {
  COUT_CREUSET,
  NIVEAU_FORGE_CREUSET,
  POSER_POULIE_S,
  QUALITES_CREUSET,
  RAMPE_LED,
  VITESSE_BACS_TRI,
  bacsTriProches,
  cuiseurProche,
  dureeRearmerGarde,
  lenteurCuiseur,
  matiereEnPlus,
  refusCuiseur,
  seCuitAuSoleil,
  surLeFil,
} from "../../commun/src/meubles-neufs.ts";
import { nommer, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { multiplicateurQualites, type Recette } from "../../commun/src/recettes.ts";
import { DUREES } from "../../commun/src/survie.ts";
import { estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import { armeTirDe, armeTirExemplaire } from "../../commun/src/tir.ts";
import { declencheurNeuf } from "./declencheurs.ts";
import { puiser } from "./electricite.ts";
import { toucher } from "./tir.ts";

/** Ce que le joueur prête aux meubles nouveaux. */
export interface ContexteMeublesNeufs {
  maintenant(): number;
  debutMonde(): number;
  /** Où il est (sur son terrain). */
  position(): { x: number; z: number };
  installations(): Iterable<InstallationVue>;
  inventaire(): Inventaire;
  /** Les outils à portée (le sac, le râtelier et l'établi à étau à 3 m) : pour juger les qualités, pas pour payer. */
  outils(): Inventaire;
  retirer(objets: Inventaire): void;
  /** La gourde : ce qu'elle contient. */
  gourde(): { contenu: "brute" | "potable"; litres: number };
  /** L'eau de la gourde a bouilli : elle est potable (le tutoriel, le fait « ebullition », les besoins). */
  eauBouillie(): void;
  /** Sauver l'état d'une installation et le montrer. */
  sauverInstallation(i: InstallationVue): void;
  /** Faire avancer la base jusqu'à maintenant (le soleil, le vent, la décharge) avant de changer un meuble qui produit. */
  majBase(): void;
  info(texte: string): void;
  noter(fait: string): void;
  commencer(libelle: string, dureeS: number, appliquer: () => void): void;
  alea(): number;
  /** Ce qui suit la destruction d'un Éteint (les mesures, le tutoriel) : l'arbalète de garde peut en abattre un. */
  apresDestruction(e: Eteint, comment: string): void;
}

/** Ce qu'un tour de la base a fait aux meubles nouveaux (pour le rapport d'absence et pour sauver). */
export interface BilanMeublesNeufs {
  /** Le moulin : ce qu'il a produit, ce qui est entré dans une batterie, ce qui s'est perdu (Wh). */
  produit: number;
  stocke: number;
  perdu: number;
  /** Les installations changées (à sauver). */
  changees: InstallationVue[];
  /** Les rampes qui viennent de s'éteindre ou de se rallumer (à montrer tout de suite). */
  bascules: InstallationVue[];
}

/** Le total d'une réserve de batteries. */
function total(c: Charges): number {
  return Object.values(c).reduce((s, v) => s + (v ?? 0), 0);
}

/** Les meubles nouveaux d'un joueur. */
export class MeublesNeufs {
  private readonly ctx: ContexteMeublesNeufs;

  constructor(ctx: ContexteMeublesNeufs) {
    this.ctx = ctx;
  }

  private temps(): { temps: ReturnType<typeof meteo>["temps"]; nuit: boolean } {
    const instant = this.ctx.maintenant();
    return { temps: meteo(instant, this.ctx.debutMonde()).temps, nuit: estNuit(heureDeJeu(instant, this.ctx.debutMonde())) };
  }

  /**
   * Un geste sur un meuble nouveau (ou le creuset sur la forge). Rend false si ce n'est pas un geste de ce module
   * (joueur.ts continue alors comme avant).
   */
  utiliser(i: InstallationVue, verbe: Verbe | string): boolean {
    if (i.type === "cuiseur_solaire" && verbe === "bouillir") {
      this.bouillir();
      return true;
    }
    if (i.type === "forge" && verbe === "poser_creuset") {
      this.poserCreuset(i);
      return true;
    }
    if (i.type === "moulin_jerricans" && verbe === "poser_poulie") {
      this.poserPoulie(i);
      return true;
    }
    if (i.type === "arbalete_garde" && verbe === "rearmer_piege") {
      this.rearmer(i);
      return true;
    }
    if (i.type === "coffre" && verbe === "poser_etageres") {
      this.poserEtageres(i);
      return true;
    }
    return false;
  }

  // ---------- Les étagères du coffre (plan 0.10, V1-04) ----------

  /** Poser les étagères de l'établi de menuisier dans le coffre (ou la réserve couverte) : 50 kg de plus. */
  private poserEtageres(coffre: InstallationVue): void {
    if (coffre.etat.etageres) return this.ctx.info("Ce coffre a déjà ses étagères.");
    if ((this.ctx.inventaire().etageres ?? 0) < 1) return this.ctx.info("Il faut un jeu d'étagères : des planches rabotées, à l'établi de menuisier.");
    this.ctx.commencer("Poser les étagères dans le coffre", POSER_ETAGERES_S, () => {
      if (coffre.etat.etageres || (this.ctx.inventaire().etageres ?? 0) < 1) return;
      this.ctx.retirer({ etageres: 1 });
      coffre.etat = { ...coffre.etat, etageres: true };
      this.ctx.sauverInstallation(coffre);
      this.ctx.noter("coffre:etageres");
      this.ctx.info(`Les étagères sont posées : le coffre tient ${ETAGERES_KG} kg de plus.`);
    });
  }

  // ---------- Le cuiseur solaire (S-22) ----------

  /** Faire bouillir l'eau de la gourde au soleil : sans bois, deux fois plus lentement qu'au foyer de pierres. */
  private bouillir(): void {
    const g = this.ctx.gourde();
    if (g.litres <= 0) return this.ctx.info("Ta gourde est vide : remplis-la à la mare, puis fais-la bouillir au soleil.");
    if (g.contenu === "potable") return this.ctx.info("L'eau de ta gourde est déjà potable.");
    const { temps, nuit } = this.temps();
    const lenteur = lenteurCuiseur(temps, nuit);
    if (lenteur === null) return this.ctx.info(refusCuiseur(temps, nuit)!);
    this.ctx.commencer("Faire bouillir l'eau au soleil", DUREES.bouillir * g.litres * lenteur, () => {
      this.ctx.eauBouillie();
      this.ctx.noter("cuiseur:eau");
      this.ctx.info("L'eau est potable, sans un bout de bois.");
    });
  }

  /**
   * Cuire une recette au cuiseur solaire (S-22) : un plat du foyer de pierres, sans feu à portée, un cuiseur à 2,5 m.
   * null : le cuiseur n'y est pour rien (la recette ou l'endroit) ; `refus` : il est là, mais il ne chauffe pas ;
   * `lenteur` : il cuit, tant de fois plus lentement qu'au feu, sans bois.
   */
  cuissonSolaire(r: Recette): { lenteur: number } | { refus: string } | null {
    if (!seCuitAuSoleil(r) || !cuiseurProche(this.ctx.position(), this.ctx.installations())) return null;
    const { temps, nuit } = this.temps();
    const lenteur = lenteurCuiseur(temps, nuit);
    return lenteur === null ? { refus: refusCuiseur(temps, nuit)! } : { lenteur };
  }

  // ---------- Les bacs de tri (S-23) ----------

  /** Démonter près des bacs de tri : combien de fois plus vite (1 : pas de bacs à 3 m). */
  vitesseDemontage(): number {
    return bacsTriProches(this.ctx.position(), this.ctx.installations()) ? VITESSE_BACS_TRI : 1;
  }

  /** La matière de plus d'un démontage fait aux bacs de tri, une fois sur trois (vide : rien cette fois, ou pas de bacs). */
  matiereEnPlus(donne: Inventaire): Inventaire {
    if (!bacsTriProches(this.ctx.position(), this.ctx.installations())) return {};
    return matiereEnPlus(donne, this.ctx.alea(), this.ctx.alea());
  }

  // ---------- Le creuset (S-24) ----------

  private poserCreuset(forge: InstallationVue): void {
    if (forge.etat.creuset) return this.ctx.info("Le creuset est déjà sur la forge.");
    if ((forge.niveau ?? 1) < NIVEAU_FORGE_CREUSET) return this.ctx.info("Le creuset ne va qu'à une forge ventilée : il faut fondre l'aluminium.");
    const manque = (Object.entries(COUT_CREUSET) as [TypeObjet, number][]).filter(([t, n]) => (this.ctx.inventaire()[t] ?? 0) < n);
    if (manque.length) return this.ctx.info(`Le creuset et ses moules sont de terre cuite : il manque ${manque.map(([t, n]) => nommer(t, n - (this.ctx.inventaire()[t] ?? 0))).join(", ")}.`);
    if (multiplicateurQualites(this.ctx.outils(), QUALITES_CREUSET) === null) return this.ctx.info("Il faut de quoi marteler (Marteler 1) : une pierre suffit.");
    this.ctx.commencer("Poser le creuset et ses moules", 20, () => {
      if (forge.etat.creuset || !(Object.entries(COUT_CREUSET) as [TypeObjet, number][]).every(([t, n]) => (this.ctx.inventaire()[t] ?? 0) >= n)) return;
      this.ctx.retirer(COUT_CREUSET);
      forge.etat = { ...forge.etat, creuset: true };
      this.ctx.sauverInstallation(forge);
      this.ctx.noter("forge:creuset");
      this.ctx.info("Le creuset est dans la braise, les moules à côté : quatre chutes d'aluminium font une poulie, ou un lingot.");
    });
  }

  // ---------- Le moulin de jerricans (S-28) ----------

  private poserPoulie(moulin: InstallationVue): void {
    if (moulin.etat.poulie) return this.ctx.info("La poulie est déjà sur l'axe du moulin.");
    if ((this.ctx.inventaire().poulie_aluminium ?? 0) < 1) return this.ctx.info("Il faut une poulie d'aluminium : les Charbonniers la coulent à leur forge.");
    this.ctx.commencer("Poser la poulie sur le moulin", POSER_POULIE_S, () => {
      if (moulin.etat.poulie || (this.ctx.inventaire().poulie_aluminium ?? 0) < 1) return;
      // Ce que le vent a donné jusqu'ici, sans la poulie.
      this.ctx.majBase();
      this.ctx.retirer({ poulie_aluminium: 1 });
      moulin.etat = { ...moulin.etat, poulie: true };
      this.ctx.sauverInstallation(moulin);
      this.ctx.noter("moulin:poulie");
      this.ctx.info("La poulie est sur l'axe : le moulin donne moitié plus de courant.");
    });
  }

  // ---------- La base qui produit et consomme seule (le moulin, la rampe) ----------

  /**
   * Faire avancer jusqu'à `instant` le moulin (il remplit la batterie de la base au vent) et la rampe de LED (elle la vide
   * la nuit, 3 W). Au calendrier, connecté ou non. Chaque meuble garde son instant (`etat.majLe`).
   */
  majBase(installations: InstallationVue[], instant: number): BilanMeublesNeufs {
    const bilan: BilanMeublesNeufs = { produit: 0, stocke: 0, perdu: 0, changees: [], bascules: [] };
    const debut = this.ctx.debutMonde();
    const changer = (i: InstallationVue) => {
      if (!bilan.changees.includes(i)) bilan.changees.push(i);
    };
    for (const m of installations) {
      if (m.type !== "moulin_jerricans") continue;
      const wh = productionMoulin(m.etat.majLe ?? instant, instant, debut, m.etat.poulie === true);
      m.etat = { ...m.etat, majLe: instant };
      changer(m);
      if (wh <= 0) continue;
      bilan.produit += wh;
      const base = meubleABatterieProche(m, installations);
      if (!base) {
        bilan.perdu += wh;
        continue;
      }
      const r = stocker({ batteries: base.etat.batteries ?? {}, charges: base.etat.charges ?? {} }, wh);
      base.etat = { ...base.etat, charges: r.stockage.charges };
      changer(base);
      bilan.stocke += r.stocke;
      bilan.perdu += r.perdu;
    }
    for (const rampe of installations) {
      if (rampe.type !== "rampe_led") continue;
      const besoin = whDePuissance(RAMPE_LED.watts, msDeNuit(rampe.etat.majLe ?? instant, instant, debut));
      const base = meubleABatterieProche(rampe, installations);
      let courant = false;
      if (base) {
        const { reste, pris } = puiser(base.etat.charges ?? {}, besoin);
        if (pris > 0) {
          base.etat = { ...base.etat, charges: reste };
          changer(base);
        }
        courant = pris >= besoin - 1e-9 && total(reste) > 0.01;
      }
      const avant = rampe.etat.courant === true;
      rampe.etat = { ...rampe.etat, majLe: instant, courant };
      changer(rampe);
      if (avant !== courant) bilan.bascules.push(rampe);
    }
    return bilan;
  }

  // ---------- L'arbalète de garde (S-29) ----------

  /**
   * Les arbalètes de garde armées tirent sur le premier Éteint debout qui passe leur fil : un carreau, aux dégâts de
   * l'arbalète posée (un tir plein à portée de tête : il abat un Errant). Seuls les Éteints passent ici : un joueur ne la
   * déclenche pas. Rend les arbalètes qui ont tiré (à sauver et à montrer).
   */
  verifierArbaletes(installations: Iterable<InstallationVue>, eteints: readonly Eteint[], zone: Zone): InstallationVue[] {
    const tirees: InstallationVue[] = [];
    const arme = armeTirDe("arbalete");
    for (const a of installations) {
      if (a.type !== "arbalete_garde") continue;
      const etat = a.etat.declencheur ?? declencheurNeuf();
      if (!etat.arme) continue;
      const cible = eteints.find((e) => debout(e) && e.etat !== "dormant" && surLeFil(a, e.x, e.z));
      if (!cible || !arme) continue;
      const tir = armeTirExemplaire(cleExemplaire("arbalete", a.etat.etoiles), arme);
      const distance = Math.hypot(cible.x - a.x, cible.z - a.z);
      const resultat = toucher(cible, { genre: "tir", degats: tir.degatsPlein, tete: distance <= tir.porteeTete }, a, zone);
      a.etat = { ...a.etat, declencheur: { ...etat, arme: false, prises: etat.prises + 1 } };
      tirees.push(a);
      this.ctx.noter("arbalete_garde:tir");
      if (resultat === "detruit") {
        this.ctx.apresDestruction(cible, "arbalete_garde");
        this.ctx.info("Ton arbalète de garde a tiré : un Éteint abattu. Réarme-la.");
      } else this.ctx.info("Ton arbalète de garde a tiré sur un Éteint. Réarme-la.");
    }
    return tirees;
  }

  private rearmer(a: InstallationVue): void {
    const etat = a.etat.declencheur ?? declencheurNeuf();
    if (etat.arme) return this.ctx.info("L'arbalète de garde est armée, le fil tendu.");
    const cranequin = (this.ctx.inventaire().cranequin_leger ?? 0) > 0;
    this.ctx.commencer(cranequin ? "Réarmer l'arbalète de garde (cranequin léger)" : "Réarmer l'arbalète de garde", dureeRearmerGarde(this.ctx.inventaire()), () => {
      const e = a.etat.declencheur ?? declencheurNeuf();
      a.etat = { ...a.etat, declencheur: { ...e, arme: true } };
      this.ctx.sauverInstallation(a);
    });
  }
}

/**
 * L'état d'une installation à sa pose (plan 0.10, chantier D) : l'arbalète de garde garde les étoiles de l'arbalète
 * qu'elle prend (celle du sac qui part, la moins bonne, comme toute recette) ; elle est armée. null : rien à garder.
 */
export function etatDePose(type: string, inventaire: Inventaire): InstallationVue["etat"] | null {
  if (type !== "arbalete_garde") return null;
  const moinsBonne = exemplaires(inventaire, "arbalete").at(-1);
  const etoiles = moinsBonne ? (etoilesDe(moinsBonne.cle) ?? etoilesDeBase("arbalete")) : etoilesDeBase("arbalete");
  return { etoiles, declencheur: declencheurNeuf() };
}

/** Ce que rend en plus un meuble nouveau qu'on démonte : le creuset de la forge, la poulie du moulin, les étagères du coffre. */
export function rendusMeublesNeufs(i: Pick<InstallationVue, "type" | "etat">): Inventaire {
  if (i.type === "forge" && i.etat.creuset) return { ...COUT_CREUSET };
  if (i.type === "moulin_jerricans" && i.etat.poulie) return { poulie_aluminium: 1 };
  if (i.type === "coffre" && i.etat.etageres) return { etageres: 1 };
  return {};
}

/** L'arbalète de garde démontée rend son arbalète à ses étoiles (la recette la nomme sans étoiles). */
export function rendDeLArbaleteGarde(i: Pick<InstallationVue, "type" | "etat">, rend: Inventaire): Inventaire {
  if (i.type !== "arbalete_garde" || i.etat.etoiles === undefined || !(rend.arbalete ?? 0)) return rend;
  const cle = cleExemplaire("arbalete", i.etat.etoiles);
  if (cle === "arbalete") return rend;
  const r: Inventaire = { ...rend };
  r.arbalete = (r.arbalete ?? 0) - 1;
  if (!r.arbalete) delete r.arbalete;
  (r as Record<string, number>)[cle] = ((r as Record<string, number>)[cle] ?? 0) + 1;
  return r;
}
