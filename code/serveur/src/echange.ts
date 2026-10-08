// L'échange entre joueurs (É4, lot 3 : Book 07 §5, Book 21 §3.2) : une fenêtre où chacun pose ses objets et
// ses wotts, puis dit s'il est d'accord. Pas de chat. Quand les deux sont d'accord, le serveur revérifie tout et
// fait l'échange d'un seul coup : personne ne peut tricher pendant l'échange lui-même.

import { type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import type { EchangeVu, OffreEchange, OperationEchange, Personne } from "../../commun/src/messages.ts";
import type { Joueur } from "./joueur.ts";

/** Pour proposer un échange, il faut être à portée de voix. */
export const DISTANCE_ECHANGE = 3;
/** Au-delà, l'échange en cours s'annule. */
const DISTANCE_RUPTURE = 7;

interface Echange {
  a: Joueur;
  b: Joueur;
  offres: Map<Joueur, OffreEchange>;
  accords: Set<Joueur>;
}

const OFFRE_VIDE: OffreEchange = { objets: {}, wotts: 0 };

function personne(j: Joueur): Personne {
  return { id: j.compte.id, pseudo: j.compte.pseudo, famille: j.compte.famille };
}

/** Une offre propre : quantités entières positives, wotts arrondis au dixième. */
function nettoyer(offre: OffreEchange): OffreEchange {
  const objets: Inventaire = {};
  for (const [type, n] of Object.entries(offre?.objets ?? {})) {
    const q = Math.floor(Number(n));
    if (q > 0) objets[type as TypeObjet] = q;
  }
  const wotts = Math.max(0, Math.floor(Number(offre?.wotts ?? 0) * 10) / 10);
  return { objets, wotts: Number.isFinite(wotts) ? wotts : 0 };
}

export class Echanges {
  /** Les demandes en attente : qui a été invité → par qui. */
  private readonly demandes = new Map<Joueur, Joueur>();
  private readonly enCours = new Map<Joueur, Echange>();
  private readonly trouver: (id: number) => Joueur | undefined;

  constructor(trouver: (id: number) => Joueur | undefined) {
    this.trouver = trouver;
  }

  traiter(j: Joueur, op: OperationEchange): void {
    switch (op?.genre) {
      case "proposer":
        return this.proposer(j, op.a);
      case "repondre":
        return this.repondre(j, op.accepte === true);
      case "offrir":
        return this.offrir(j, op.offre);
      case "accord":
        return this.accord(j, op.oui === true);
      case "annuler":
        return this.annuler(j, `${j.compte.pseudo} a annulé l'échange.`);
    }
  }

  private proches(a: Joueur, b: Joueur, distance: number): boolean {
    return a.enLieuPublic && b.enLieuPublic && a.lieu === b.lieu && Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z) <= distance;
  }

  private proposer(j: Joueur, id: number): void {
    const autre = this.trouver(id);
    if (!autre || autre === j) return;
    if (!this.proches(j, autre, DISTANCE_ECHANGE)) return j.envoyer({ t: "info", texte: "Approche-toi pour proposer un échange." });
    if (this.enCours.has(j) || this.enCours.has(autre)) return j.envoyer({ t: "info", texte: `${autre.compte.pseudo} est déjà en train d'échanger.` });
    this.demandes.set(autre, j);
    autre.envoyer({ t: "demande_echange", de: personne(j) });
    j.envoyer({ t: "info", texte: `Tu proposes un échange à ${autre.compte.pseudo}…` });
  }

  private repondre(j: Joueur, accepte: boolean): void {
    const demandeur = this.demandes.get(j);
    this.demandes.delete(j);
    if (!demandeur) return;
    if (!accepte) return demandeur.envoyer({ t: "info", texte: `${j.compte.pseudo} ne veut pas échanger.` });
    if (!this.proches(j, demandeur, DISTANCE_ECHANGE + 1) || this.enCours.has(j) || this.enCours.has(demandeur)) {
      return j.envoyer({ t: "info", texte: "L'échange n'est plus possible." });
    }
    const e: Echange = { a: demandeur, b: j, offres: new Map([[demandeur, OFFRE_VIDE], [j, OFFRE_VIDE]]), accords: new Set() };
    this.enCours.set(demandeur, e);
    this.enCours.set(j, e);
    this.publier(e);
  }

  private offrir(j: Joueur, offre: OffreEchange): void {
    const e = this.enCours.get(j);
    if (!e) return;
    const propre = nettoyer(offre);
    const manque = j.manqueA(propre);
    if (manque) return j.envoyer({ t: "info", texte: manque });
    e.offres.set(j, propre);
    // Toute modification remet les accords à zéro : on ne valide que ce qu'on a vu.
    e.accords.clear();
    this.publier(e);
  }

  private accord(j: Joueur, oui: boolean): void {
    const e = this.enCours.get(j);
    if (!e) return;
    if (oui) e.accords.add(j);
    else e.accords.delete(j);
    if (e.accords.size === 2) return this.conclure(e);
    this.publier(e);
  }

  /** Les deux sont d'accord : on revérifie tout, puis on échange d'un seul coup. */
  private conclure(e: Echange): void {
    const oa = e.offres.get(e.a)!;
    const ob = e.offres.get(e.b)!;
    const probleme =
      e.a.manqueA(oa) ??
      e.b.manqueA(ob) ??
      (e.a.poidsApres(oa, ob) > e.a.capaciteApres(oa, ob) ? `Le sac de ${e.a.compte.pseudo} serait trop lourd.` : null) ??
      (e.b.poidsApres(ob, oa) > e.b.capaciteApres(ob, oa) ? `Le sac de ${e.b.compte.pseudo} serait trop lourd.` : null);
    if (probleme) {
      e.accords.clear();
      for (const j of [e.a, e.b]) j.envoyer({ t: "info", texte: probleme });
      return this.publier(e);
    }
    // La charge des batteries part avec elles.
    const chargesDeA = e.a.chargesQuiPartent(oa.objets);
    const chargesDeB = e.b.chargesQuiPartent(ob.objets);
    // Les deux côtés dans une seule transaction : un plantage au milieu ne peut ni dupliquer ni perdre d'objets.
    e.a.enBloc(() => {
      e.a.appliquerEchange(oa, ob, chargesDeB);
      e.b.appliquerEchange(ob, oa, chargesDeA);
    });
    this.fermer(e);
    for (const j of [e.a, e.b]) j.envoyer({ t: "info", texte: "Échange conclu." });
  }

  annuler(j: Joueur, raison: string): void {
    this.demandes.delete(j);
    for (const [invite, demandeur] of this.demandes) if (demandeur === j) this.demandes.delete(invite);
    const e = this.enCours.get(j);
    if (!e) return;
    this.fermer(e);
    for (const x of [e.a, e.b]) x.envoyer({ t: "info", texte: raison });
  }

  /** À chaque pas : un échange dont les deux ne sont plus côte à côte s'annule. */
  verifier(): void {
    for (const e of new Set(this.enCours.values())) {
      if (!this.proches(e.a, e.b, DISTANCE_RUPTURE)) this.annuler(e.a, "Vous vous êtes éloignés : l'échange est annulé.");
    }
  }

  private fermer(e: Echange): void {
    this.enCours.delete(e.a);
    this.enCours.delete(e.b);
    for (const j of [e.a, e.b]) j.envoyer({ t: "echange", echange: null });
  }

  private publier(e: Echange): void {
    for (const [moi, lui] of [
      [e.a, e.b],
      [e.b, e.a],
    ] as const) {
      const vu: EchangeVu = {
        avec: personne(lui),
        moi: e.offres.get(moi)!,
        lui: e.offres.get(lui)!,
        accordMoi: e.accords.has(moi),
        accordLui: e.accords.has(lui),
      };
      moi.envoyer({ t: "echange", echange: vu });
    }
  }
}
