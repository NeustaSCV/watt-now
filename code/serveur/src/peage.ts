// Le péage des survivants, côté serveur (plan 0.10 §3.4, S-19 ; la règle est dans commun/src/peage.ts) : qui a payé,
// jusqu'à quand, et ce qu'on lui dit. Générique : la chicane du pont (H2A, serveur/src/route-pont.ts) et la barricade du
// tunnel (H2B, chantier I) s'en servent de la même façon, chacune avec son `passage`.
//
// - `payer` : le message `payer_passage` ; refusé (rien n'est pris) si la valeur est sous 12 wotts, si l'on n'a pas les
//   objets, ou si l'on a déjà payé dans l'heure ; accepté, les objets quittent le sac (pas de monnaie rendue) et le
//   passage est libre une heure réelle, pour ce joueur seul.
// - `ouvertPour` : la porte est-elle ouverte pour ce joueur (sa zone : serveur/src/route-pont.ts, `zonePour`) ?
// - `suivre` : à chaque tic, pour chaque joueur présent ; quand son heure est passée, on le lui dit, et sa porte se
//   referme.
// - Qui a payé est gardé en base (l'instance `peage:<passage>`) : un serveur qui redémarre ne fait pas repayer.
// - **À l'aller seulement** (N2-60 ; plan 0.10, V2-01) : qui entre dans la halte du côté du lieu (il revient de l'hôtel
//   ou du phare, vers chez lui) passe librement tant qu'il y est, même l'heure passée (`retour`, `vientDuLieu`). Rien
//   n'est gardé en base pour lui : une reconnexion le replace à l'entrée la plus proche, et l'on refait le calcul.
//
// Ce module ne connaît pas le joueur : il passe par un `ContextePeage` (ce que le joueur lui prête).

import { DUREE_PASSAGE_MS, TEXTES_PEAGE, passageLibre, resteAPayer, verifierPaiement, type Passage } from "../../commun/src/peage.ts";
import { destinations, entreesDe, type LieuJouable } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import type { Base } from "./base.ts";

/** Ce que le joueur prête au péage : rien que des accès, aucune règle. */
export interface ContextePeage {
  readonly id: number;
  maintenant(): number;
  inventaire(): Readonly<Inventaire>;
  /** Retire ces objets du sac (ils sont dans la caisse). */
  donner(objets: Inventaire): void;
  info(texte: string): void;
  envoyer(m: MessageServeur): void;
}

/**
 * Arrive-t-on dans cette halte du côté du lieu (le Grand Hôtel, le phare), c'est-à-dire sur le retour, vers chez soi ?
 * Le serveur place toujours l'arrivée à l'entrée qui mène d'où l'on vient (`arriveeDans`, lieux.ts) : l'entrée la plus
 * proche de (x, z) le dit. Vrai si elle ne mène pas au terrain.
 */
export function vientDuLieu(halte: LieuJouable, x: number, z: number): boolean {
  const entrees = entreesDe(halte);
  if (entrees.length === 0) return false;
  const proche = entrees.reduce((a, b) => (Math.hypot(b.arrivee.x - x, b.arrivee.z - z) < Math.hypot(a.arrivee.x - x, a.arrivee.z - z) ? b : a));
  return !destinations(proche).includes("terrain");
}

export class Peage {
  readonly passage: Passage;
  private readonly base: Base;
  /** Compte → fin de son passage payé (ms, heure réelle). */
  private readonly payes = new Map<number, number>();
  /** Ceux à qui l'on a dit que la porte est ouverte (pour leur dire quand elle se referme). */
  private readonly ouverts = new Set<number>();
  /** Ceux qui sont arrivés du côté du lieu, sur le retour : ils passent librement tant qu'ils sont là (V2-01). */
  private readonly retours = new Set<number>();

  constructor(base: Base, passage: Passage) {
    this.base = base;
    this.passage = passage;
    const garde = base.chargerInstance(this.cle) as Record<string, number> | null;
    for (const [id, jusqua] of Object.entries(garde ?? {})) if (Number.isFinite(jusqua)) this.payes.set(Number(id), jusqua);
  }

  private get cle(): string {
    return `peage:${this.passage}`;
  }

  /** La fin du passage payé de ce joueur (0 : rien de payé). */
  jusqua(compteId: number): number {
    return this.payes.get(compteId) ?? 0;
  }

  /** La porte est-elle ouverte pour ce joueur à cet instant (payé dans l'heure, ou sur le retour) ? */
  ouvertPour(compteId: number, instant: number): boolean {
    return this.retours.has(compteId) || passageLibre(this.payes.get(compteId), instant);
  }

  /**
   * Le joueur arrive dans la halte du côté du lieu (`vientDuLieu`) : il rentre chez lui, on ne lui demande rien, tant
   * qu'il est là (V2-01 : « à l'aller seulement »). À appeler à l'entrée, avant d'envoyer l'état.
   */
  retour(compteId: number): void {
    this.retours.add(compteId);
  }

  /** Ce que l'écran doit savoir du passage de ce joueur. */
  etat(compteId: number, instant: number): MessageServeur {
    const ouvert = this.ouvertPour(compteId, instant);
    return { t: "passage", passage: this.passage, ouvert, du: ouvert ? 0 : resteAPayer({}) };
  }

  /** Le joueur arrive : on lui dit où en est son passage. */
  entrer(ctx: ContextePeage): void {
    const instant = ctx.maintenant();
    if (this.ouvertPour(ctx.id, instant)) this.ouverts.add(ctx.id);
    else this.ouverts.delete(ctx.id);
    ctx.envoyer(this.etat(ctx.id, instant));
  }

  /** « Payer » à la caisse : true si le passage vient d'être payé. */
  payer(ctx: ContextePeage, objets: Readonly<Inventaire>): boolean {
    const instant = ctx.maintenant();
    const textes = TEXTES_PEAGE[this.passage];
    // Sur le retour, on ne paie pas : la voix le dit, rien n'est pris (V2-01).
    if (this.retours.has(ctx.id)) {
      ctx.info(textes.dejaPaye);
      ctx.envoyer(this.etat(ctx.id, instant));
      return false;
    }
    const r = verifierPaiement(objets, ctx.inventaire(), this.payes.get(ctx.id), instant);
    if (!r.accepte) {
      if (r.raison === "deja_paye") ctx.info(textes.dejaPaye);
      else if (r.raison === "trop_peu") ctx.info(textes.tropPeu(r.du));
      // Pas assez : l'écran garde ce qu'on avait choisi et montre ce qui manque encore.
      ctx.envoyer(r.raison === "trop_peu" ? { t: "passage", passage: this.passage, ouvert: false, du: r.du } : this.etat(ctx.id, instant));
      return false;
    }
    ctx.donner(r.objets);
    this.payes.set(ctx.id, instant + DUREE_PASSAGE_MS);
    this.ouverts.add(ctx.id);
    this.sauver(instant);
    ctx.info(textes.paye);
    ctx.envoyer(this.etat(ctx.id, instant));
    return true;
  }

  /** À chaque tic, pour un joueur présent : son heure passée, la porte se referme (et on le lui dit, une fois). */
  suivre(ctx: ContextePeage): void {
    if (!this.ouverts.has(ctx.id)) return;
    const instant = ctx.maintenant();
    if (this.ouvertPour(ctx.id, instant)) return;
    this.ouverts.delete(ctx.id);
    ctx.info(TEXTES_PEAGE[this.passage].referme);
    ctx.envoyer(this.etat(ctx.id, instant));
  }

  /** Le joueur s'en va : on ne le suit plus (son passage payé reste, jusqu'à son heure ; son retour est fini). */
  sortir(compteId: number): void {
    this.ouverts.delete(compteId);
    this.retours.delete(compteId);
  }

  /** On garde les passages encore valables (les autres sont oubliés). */
  private sauver(instant: number): void {
    const garde: Record<string, number> = {};
    for (const [id, jusqua] of this.payes) {
      if (jusqua > instant) garde[id] = jusqua;
      else this.payes.delete(id);
    }
    this.base.sauverInstance(this.cle, garde, instant);
  }
}
