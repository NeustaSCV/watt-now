// Faire évoluer et réparer une arme sur son meuble, côté serveur (plan 0.8, chantier 9 ; R-ARMES-4 et R-ARMES-5).
//
// Deux gestes, jugés ici et nulle part ailleurs :
// - **rafistoler** (la réparation de fortune d'avant, Book 23 §4.3) : partout, une ficelle et des chiffons ; elle tient,
//   mais reste abîmée ;
// - **reprendre l'arme** sur son meuble : la **réparer** à son niveau (l'usure revient à neuf), ou la **monter d'une
//   étoile** (le même exemplaire : sa clé `type#n` change d'étoile, son usure revient à neuf ; la pièce qui fait
//   l'étoile est prise dans le sac). Les règles sont dans commun/src/evolution-armes.ts ; loin d'un meuble, le geste
//   est refusé.
//
// Ce module ne connaît pas le joueur : il passe par un `ContexteEvolution` (ce que le joueur lui prête). joueur.ts
// n'ajoute que des appels d'une ligne (plan 0.8 §4.2). Le `reparer` de joueur.ts d'avant la 0.8 est venu ici.

import { PLAFOND_FORTUNE, REPARATION_FORTUNE, armeDeCle, capaciteChargeArme } from "../../commun/src/combat.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";
import { etatExemplaire, nomArme, reprise, type GesteReprise, type Reprise } from "../../commun/src/evolution-armes.ts";
import type { Alentours } from "../../commun/src/lieu-recette.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { estCleObjet, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";

/** Ce que le joueur prête au module. */
export interface ContexteEvolution {
  inventaire(): Inventaire;
  /** L'usure des armes (coups qui restent, par exemplaire ; absente : neuve). Le module la modifie en place. */
  usure(): Partial<Record<CleObjet, number>>;
  /** La charge des armes électriques (Wh qui restent, par exemplaire ; absente : pleine). Modifiée en place. */
  chargeArmes(): Partial<Record<CleObjet, number>>;
  /** Ce qu'il y a autour (position, installations et feux de son terrain, sac) ; null : pas chez soi, ou en voyage. */
  alentours(): Alentours | null;
  /** En voyage, ou déjà à un geste : on ne reprend pas une arme. */
  occupe(): boolean;
  retirerPlusieurs(objets: Inventaire): void;
  /** Retirer et ajouter d'un coup (une seule mise à jour du sac). */
  echanger(retire: Inventaire, ajoute: Inventaire): void;
  /** Un geste qui prend du temps, avec sa pose (« outil » ou « lourd »). */
  commencer(libelle: string, dureeS: number, appliquer: () => void, pose: "leger" | "outil" | "lourd"): void;
  info(texte: string): void;
  envoyer(m: MessageServeur): void;
  /** Sauver l'usure et la charge des armes. */
  sauver(): void;
  /** L'arme équipée (P-005), et la changer sans rien dire (l'exemplaire a changé de clé). */
  armeEquipee(): CleObjet | null;
  changerArmeEquipee(cle: CleObjet): void;
  /** La meule fine d'un pédalier tout près : l'affûtage donne un fil de rasoir (Book 25 §6.4). */
  affuterFin(cle: CleObjet): void;
}

/** La reprise d'un joueur : ses deux gestes. */
export class EvolutionArmes {
  private readonly ctx: ContexteEvolution;

  constructor(ctx: ContexteEvolution) {
    this.ctx = ctx;
  }

  /** Ce que les meubles d'à côté proposent pour cet exemplaire (rien d'autour : ailleurs que chez soi). */
  private propositions(cle: CleObjet): Reprise {
    const a = this.ctx.alentours() ?? { x: 0, z: 0, feux: [], installations: [], inventaire: this.ctx.inventaire() };
    return reprise(cle, a, this.ctx.usure());
  }

  /**
   * Le message « reparer » d'avant la 0.8 : de fortune (Rafistoler), ou pour de bon, qui est le geste « Reprendre
   * l'arme » qui répare.
   */
  reparer(objet: CleObjet, fortune: boolean): void {
    if (fortune) return this.rafistoler(objet);
    this.reprendre(objet, "reparer");
  }

  /**
   * Rafistoler (Book 23 §4.3) : partout et pour toutes les familles, une ficelle et des chiffons. Elle remonte, mais
   * reste abîmée (`PLAFOND_FORTUNE`).
   */
  private rafistoler(objet: CleObjet): void {
    if (!estCleObjet(objet) || !(this.ctx.inventaire()[objet] ?? 0) || this.ctx.occupe()) return;
    const arme = armeDeCle(objet);
    if (!arme) return;
    const etat = etatExemplaire(objet, this.ctx.usure());
    if (etat >= PLAFOND_FORTUNE) return this.ctx.info("Une réparation de fortune n'y ferait rien : elle n'est pas assez abîmée pour ça.");
    const deQuoi = (Object.entries(REPARATION_FORTUNE) as [TypeObjet, number][]).every(([t, n]) => (this.ctx.inventaire()[t] ?? 0) >= n);
    if (!deQuoi) return this.ctx.info("Pour une réparation de fortune, il faut une ficelle et des chiffons.");
    this.ctx.commencer(`Réparer ${arme.nom} (de fortune)`, 6 / REGLAGES.gestes_vitesse, () => {
      this.ctx.retirerPlusieurs(REPARATION_FORTUNE);
      const usure = this.ctx.usure();
      usure[objet] = Math.max(usure[objet] ?? 0, Math.floor(arme.solidite * PLAFOND_FORTUNE));
      this.ctx.envoyer({ t: "usure", usure: { ...usure }, evenement: { objet, etat: "reparee" } });
      this.ctx.sauver();
    }, "leger");
  }

  /**
   * « Reprendre l'arme » sur son meuble (R-ARMES-5) : la réparer à son niveau, ou la monter d'une étoile. Loin de tout
   * meuble de cette arme (ou ailleurs que chez soi), le geste est refusé.
   */
  reprendre(objet: CleObjet, geste: GesteReprise): void {
    if (!estCleObjet(objet) || !(this.ctx.inventaire()[objet] ?? 0) || this.ctx.occupe()) return;
    const r = this.propositions(objet);
    if (!r.aPortee) return this.ctx.info(`Reprendre ${nomArme(objet)} se fait près de son meuble : ${r.ou}, chez toi.${geste === "reparer" ? " Sinon, une réparation de fortune." : ""}`);
    const p = geste === "reparer" ? r.reparer : r.monter;
    if (!p) return this.ctx.info(`${majuscule(nomArme(objet))} ne monte pas d'étoile sur un meuble.`);
    if (!p.possible) return this.ctx.info(p.raison ?? "Pas ici.");
    this.ctx.commencer(p.geste, p.dureeS / REGLAGES.gestes_vitesse, () => {
      // Le monde a pu changer pendant le geste : on rejuge.
      if (!(this.ctx.inventaire()[objet] ?? 0)) return;
      const encore = this.propositions(objet);
      const q = geste === "reparer" ? encore.reparer : encore.monter;
      if (!q?.possible) return this.ctx.info(q?.raison ?? "Ça n'a pas pris.");
      if (geste === "reparer") this.appliquerReparation(objet, encore);
      else this.appliquerMontee(objet, encore);
    }, p.pose);
  }

  /** L'usure revient à neuf ; à la meule fine, l'affûtage donne un fil de rasoir. */
  private appliquerReparation(objet: CleObjet, r: Reprise): void {
    if (Object.keys(r.reparer.cout).length) this.ctx.retirerPlusieurs(r.reparer.cout);
    const usure = this.ctx.usure();
    delete usure[objet];
    if (r.reparer.atelier?.accessoire === "meule") this.ctx.affuterFin(objet);
    this.ctx.envoyer({ t: "usure", usure: { ...usure }, evenement: { objet, etat: "reparee" } });
    this.ctx.envoyer({ t: "arme_reprise", avant: objet, apres: objet, geste: "reparer" });
    this.ctx.sauver();
  }

  /**
   * Le même exemplaire, une étoile de plus : il quitte sa pile et rejoint celle de ses nouvelles étoiles. Celui qu'on
   * reprend est l'exemplaire usé de sa pile (les autres sont neufs) ; il revient à neuf. L'arme équipée et la charge
   * électrique le suivent.
   */
  private appliquerMontee(avant: CleObjet, r: Reprise): void {
    const m = r.monter!;
    const apres = m.apres!;
    this.ctx.echanger({ ...m.cout, [avant]: (m.cout[avant] ?? 0) + 1 }, { [apres]: 1 });
    const reste = this.ctx.inventaire()[avant] ?? 0;
    const usure = this.ctx.usure();
    // L'usure d'une pile est celle de son premier exemplaire : c'est lui qu'on a repris, ceux qui restent sont neufs.
    delete usure[avant];
    // La charge : la source passe avec l'arme ; ce qui reste de la pile garde la sienne.
    const charges = this.ctx.chargeArmes();
    const wh = charges[avant];
    if (wh !== undefined && charges[apres] === undefined) {
      const a = armeDeCle(apres);
      if (a?.electrique && wh < capaciteChargeArme(a)) charges[apres] = wh;
    }
    if (reste <= 0) delete charges[avant];
    if (this.ctx.armeEquipee() === avant && reste <= 0) this.ctx.changerArmeEquipee(apres);
    this.ctx.envoyer({ t: "usure", usure: { ...usure }, evenement: { objet: apres, etat: "reparee" }, charge: { ...charges } });
    this.ctx.envoyer({ t: "arme_reprise", avant, apres, geste: "monter" });
    this.ctx.info(`${majuscule(nomArme(apres))} passe ${"★".repeat(m.cible ?? 1)}.`);
    this.ctx.sauver();
  }
}

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
