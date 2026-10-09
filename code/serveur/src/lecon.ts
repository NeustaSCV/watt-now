// La leçon entre joueurs (Book 25 §2.3, Book 03 §5.4) : un joueur enseigne une recette de son métier à un joueur d'une
// autre famille. Ils restent ensemble, au même endroit, pendant deux minutes ; l'élève connaît alors la recette (à ×1,5
// et ★★ au plus, comme tout ce qui sort de sa famille) ; l'enseignant gagne du rayonnement, une seule fois par élève
// et par recette. Et les manuels : lus, ils ouvrent toutes les recettes d'une famille.
//
// Comme l'échange (echange.ts), la leçon se passe dans un lieu public (la halte, le Comptoir) : c'est là qu'on se voit.
// Le serveur vérifie tout ; le client ne fait que proposer.

import type { MessageServeur, OperationLecon, Personne } from "../../commun/src/messages.ts";
import { OBJETS, type TypeObjet } from "../../commun/src/objets.ts";
import { recette, recettesConnues, type Recette } from "../../commun/src/recettes.ts";
import { NOMS_FAMILLES, type Famille } from "../../commun/src/regles.ts";
import {
  DELAI_REPONSE_LECON,
  DISTANCE_LECON,
  DISTANCE_RUPTURE_LECON,
  DUREE_LECON_S,
  MANUELS,
  RAYONNEMENT_LECON,
  chezLaFamille,
  leconsPossibles,
  refusLecon,
  type Savoir,
} from "../../commun/src/savoir.ts";

/** Ce que la leçon demande d'un joueur (le Joueur le fournit ; les tests, un double). */
export interface ParticipantLecon {
  readonly compte: { id: number; pseudo: string; famille: Famille };
  readonly position: { x: number; z: number };
  readonly lieu: string;
  readonly enLieuPublic: boolean;
  readonly savoir: Savoir;
  envoyer(m: MessageServeur): void;
  /** Le savoir a changé : le garder (base) et le dire au client. `fait` : un fait pour les quêtes et les mesures. */
  majSavoir(savoir: Savoir, fait?: string): void;
}

interface Lecon {
  maitre: ParticipantLecon;
  eleve: ParticipantLecon;
  recette: Recette;
  debut: number;
  fin: number;
}

function personne(j: ParticipantLecon): Personne {
  return { id: j.compte.id, pseudo: j.compte.pseudo, famille: j.compte.famille };
}

// ---------- Ce qui change dans le savoir (fonctions pures, testées seules) ----------

/** L'élève apprend une recette. */
export function apprendre(savoir: Savoir, idRecette: string): Savoir {
  return savoir.apprises.includes(idRecette) ? savoir : { ...savoir, apprises: [...savoir.apprises, idRecette] };
}

/** L'enseignant a donné une leçon : du rayonnement, une seule fois par élève et par recette. */
export function enseigner(savoir: Savoir, eleveId: number, idRecette: string): { savoir: Savoir; gagne: boolean } {
  const cle = `${eleveId}:${idRecette}`;
  if (savoir.enseignees.includes(cle)) return { savoir, gagne: false };
  return { savoir: { ...savoir, enseignees: [...savoir.enseignees, cle], rayonnement: savoir.rayonnement + RAYONNEMENT_LECON }, gagne: true };
}

/**
 * Lire un manuel (Book 25 §2.3) : il ouvre toutes les recettes de sa famille. Le livre reste dans le sac (il se
 * vend, se prête, se donne). Dans sa propre famille, il n'apprend rien.
 */
export function lireManuel(savoir: Savoir, famille: Famille, objet: TypeObjet): { savoir: Savoir; message: string } | { refus: string } {
  const de = MANUELS[objet];
  if (!de) return { refus: "Ça ne se lit pas." };
  const titre = OBJETS[objet].nom;
  if (de === famille) return { refus: `${titre} : rien que tu ne saches déjà. Il se vendra bien.` };
  if (savoir.manuels.includes(de)) return { refus: `Tu as déjà lu ${titre}.` };
  const avant = recettesConnues(famille, savoir).length;
  const apres = { ...savoir, manuels: [...savoir.manuels, de] };
  const n = recettesConnues(famille, apres).length - avant;
  return { savoir: apres, message: `${titre} : ${n} recette${n > 1 ? "s" : ""} ${chezLaFamille(de)} s'ouvre${n > 1 ? "nt" : ""} (×1,5, ★★ au plus).` };
}

// ---------- Les leçons en cours ----------

export class Lecons {
  /** Les propositions en attente : l'élève invité → la leçon proposée, et quand elle tombe. */
  private readonly demandes = new Map<ParticipantLecon, { maitre: ParticipantLecon; recette: Recette; jusqua: number }>();
  private readonly enCours = new Map<ParticipantLecon, Lecon>();
  private readonly trouver: (id: number) => ParticipantLecon | undefined;
  private readonly maintenant: () => number;

  constructor(trouver: (id: number) => ParticipantLecon | undefined, maintenant: () => number = Date.now) {
    this.trouver = trouver;
    this.maintenant = maintenant;
  }

  traiter(j: ParticipantLecon, op: OperationLecon): void {
    switch (op?.genre) {
      case "choisir":
        return this.choisir(j, op.a);
      case "proposer":
        return this.proposer(j, op.a, op.recette);
      case "repondre":
        return this.repondre(j, op.accepte === true);
      case "annuler":
        return this.annuler(j, `${j.compte.pseudo} a arrêté la leçon.`);
    }
  }

  /** Un joueur est-il en pleine leçon (comme maître ou comme élève) ? */
  enLecon(j: ParticipantLecon): boolean {
    return this.enCours.has(j);
  }

  private proches(a: ParticipantLecon, b: ParticipantLecon, distance: number): boolean {
    return a.enLieuPublic && b.enLieuPublic && a.lieu === b.lieu && Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z) <= distance;
  }

  /** Le maître veut enseigner à `id` : on lui dit ce qu'il peut lui apprendre (l'élève, lui, sait ce qu'il sait). */
  private choisir(j: ParticipantLecon, id: number): void {
    const eleve = this.trouver(id);
    if (!eleve || eleve === j) return;
    if (!this.proches(j, eleve, DISTANCE_LECON)) return j.envoyer({ t: "info", texte: "Approche-toi pour lui proposer une leçon." });
    if (eleve.compte.famille === j.compte.famille) return j.envoyer({ t: "info", texte: `${eleve.compte.pseudo} est de ta famille : il sait déjà tout ça.` });
    const recettes = leconsPossibles(j.compte.famille, eleve.compte.famille, eleve.savoir).map((r) => r.id);
    if (recettes.length === 0) return j.envoyer({ t: "info", texte: `${eleve.compte.pseudo} connaît déjà tout ton métier.` });
    j.envoyer({ t: "lecons_possibles", a: personne(eleve), recettes });
  }

  private proposer(j: ParticipantLecon, id: number, idRecette: string): void {
    const eleve = this.trouver(id);
    if (!eleve || eleve === j) return;
    if (!this.proches(j, eleve, DISTANCE_LECON)) return j.envoyer({ t: "info", texte: "Approche-toi pour lui proposer une leçon." });
    const refus = refusLecon(j.compte.famille, idRecette, eleve.compte.famille, eleve.savoir);
    if (refus) return j.envoyer({ t: "info", texte: refus });
    if (this.enCours.has(j) || this.enCours.has(eleve)) return j.envoyer({ t: "info", texte: `${eleve.compte.pseudo} est déjà pris par une leçon.` });
    const r = recette(idRecette)!;
    this.demandes.set(eleve, { maitre: j, recette: r, jusqua: this.maintenant() + DELAI_REPONSE_LECON });
    eleve.envoyer({ t: "demande_lecon", de: personne(j), recette: r.id });
    j.envoyer({ t: "info", texte: `Tu proposes à ${eleve.compte.pseudo} de lui apprendre « ${r.nom} »…` });
  }

  private repondre(j: ParticipantLecon, accepte: boolean): void {
    const demande = this.demandes.get(j);
    this.demandes.delete(j);
    if (!demande) return;
    const { maitre, recette: r } = demande;
    if (!accepte) return maitre.envoyer({ t: "info", texte: `${j.compte.pseudo} ne veut pas de leçon.` });
    if (demande.jusqua < this.maintenant() || !this.proches(j, maitre, DISTANCE_LECON + 1) || this.enCours.has(j) || this.enCours.has(maitre)) {
      return j.envoyer({ t: "info", texte: "La leçon n'est plus possible." });
    }
    // Revérifié au dernier moment : il a pu l'apprendre ailleurs entre-temps.
    const refus = refusLecon(maitre.compte.famille, r.id, j.compte.famille, j.savoir);
    if (refus) return j.envoyer({ t: "info", texte: refus });
    const debut = this.maintenant();
    const l: Lecon = { maitre, eleve: j, recette: r, debut, fin: debut + DUREE_LECON_S * 1000 };
    this.enCours.set(maitre, l);
    this.enCours.set(j, l);
    this.publier(l);
    maitre.envoyer({ t: "info", texte: `Tu montres à ${j.compte.pseudo} : « ${r.nom} ». Restez côte à côte deux minutes.` });
    j.envoyer({ t: "info", texte: `${maitre.compte.pseudo} te montre : « ${r.nom} ». Reste à côté deux minutes.` });
  }

  annuler(j: ParticipantLecon, raison: string): void {
    this.demandes.delete(j);
    for (const [invite, d] of this.demandes) if (d.maitre === j) this.demandes.delete(invite);
    const l = this.enCours.get(j);
    if (!l) return;
    this.fermer(l);
    for (const x of [l.maitre, l.eleve]) x.envoyer({ t: "info", texte: raison });
  }

  /** À chaque pas : une leçon dont les deux se sont éloignés s'interrompt ; une leçon finie s'apprend. */
  verifier(): void {
    const instant = this.maintenant();
    for (const [invite, d] of this.demandes) if (d.jusqua < instant) this.demandes.delete(invite);
    for (const l of new Set(this.enCours.values())) {
      if (!this.proches(l.maitre, l.eleve, DISTANCE_RUPTURE_LECON)) {
        this.annuler(l.maitre, "Vous vous êtes éloignés : la leçon est interrompue.");
        continue;
      }
      if (instant >= l.fin) this.conclure(l);
    }
  }

  private conclure(l: Lecon): void {
    this.fermer(l);
    const { maitre, eleve, recette: r } = l;
    eleve.majSavoir(apprendre(eleve.savoir, r.id), `lecon_recue:${r.id}`);
    const e = enseigner(maitre.savoir, eleve.compte.id, r.id);
    if (e.gagne) maitre.majSavoir(e.savoir, "lecon_donnee");
    eleve.envoyer({ t: "info", texte: `Tu sais faire « ${r.nom} » (×1,5, ★★ au plus), comme ${chezLaFamille(r.famille as Famille)}.` });
    maitre.envoyer({
      t: "info",
      texte: e.gagne ? `${eleve.compte.pseudo} sait faire « ${r.nom} ». Ton nom circule chez les ${NOMS_FAMILLES[eleve.compte.famille]}.` : `${eleve.compte.pseudo} sait faire « ${r.nom} ».`,
    });
  }

  private fermer(l: Lecon): void {
    this.enCours.delete(l.maitre);
    this.enCours.delete(l.eleve);
    for (const j of [l.maitre, l.eleve]) j.envoyer({ t: "lecon", lecon: null });
  }

  private publier(l: Lecon): void {
    const duree = (l.fin - l.debut) / 1000;
    l.maitre.envoyer({ t: "lecon", lecon: { avec: personne(l.eleve), recette: l.recette.id, role: "maitre", duree } });
    l.eleve.envoyer({ t: "lecon", lecon: { avec: personne(l.maitre), recette: l.recette.id, role: "eleve", duree } });
  }
}
