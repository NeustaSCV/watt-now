// H2B, la corniche du Cap Rouge, côté serveur (plan 0.10, chantier I) : une halte partagée, construite d'après le
// registre des lieux (sa zone, son plan de vue et son contenu : commun/src/corniche.ts, corniche-contenu.ts,
// contenu-lieux.ts). Le pin tombé (le tas de bois personnel), la pierre et le bois, les fouilles, les Éteints passent
// par le moteur commun des lieux vivants (serveur/src/lieu-vivant.ts) : rien à écrire ici pour eux.
//
// Ce qui lui est propre : **le péage du tunnel** (§3.4, S-19 ; N2-Q11 : la même règle que le pont) : 12 wotts d'objets
// dans la caisse au pied de la barricade, et la porte s'ouvre pour le payeur seul, une heure (serveur/src/peage.ts,
// `Peage(base, "tunnel")`). On paie à la caisse ou contre la porte, de l'un ou l'autre côté, comme à la chicane du pont
// (serveur/src/route-pont.ts) ; les Éteints restent derrière la porte fermée.
//
// joueur.ts n'y touche que par les points d'appel de LieuVivant (`zonePour`, `payerPassage`, `accompagner`).

import { procheBarricade, zoneCorniche } from "../../commun/src/corniche.ts";
import type { Zone } from "../../commun/src/lieux.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import type { Passage } from "../../commun/src/peage.ts";
import type { Base } from "./base.ts";
import { LieuVivant, type ContexteLieu, type Voyageur } from "./lieu-vivant.ts";
import { definitionDuRegistre } from "./lieux-personnels.ts";
import { Peage, vientDuLieu, type ContextePeage } from "./peage.ts";

/** Ce que le péage demande au joueur, tiré de ce qu'il prête au lieu. */
function contextePeage(ctx: ContexteLieu): ContextePeage {
  return { id: ctx.id, maintenant: () => ctx.maintenant(), inventaire: () => ctx.inventaire(), donner: (o) => ctx.donner(o), info: (t) => ctx.info(t), envoyer: (m) => ctx.envoyer(m) };
}

export class LieuCorniche extends LieuVivant {
  readonly peage: Peage;
  /** Le dernier instant connu (le tic) : la porte se lit à cet instant. */
  private instant = 0;

  constructor(base: Base, alea: () => number = Math.random) {
    super(base, definitionDuRegistre("corniche"), alea);
    this.peage = new Peage(base, "tunnel");
  }

  /** La zone d'un joueur : la porte de la barricade ouverte s'il a payé (pour lui seul). Les Éteints gardent `zone`. */
  override zonePour(compteId: number): Zone {
    return zoneCorniche(this.peage.ouvertPour(compteId, this.instant || Date.now()));
  }

  override entrer(v: Voyageur): void {
    super.entrer(v);
    // Arrivé du côté du lieu, on rentre chez soi : on passe sans payer (V2-01, « à l'aller seulement »).
    const h = v.humain();
    if (vientDuLieu("corniche", h.x, h.z)) this.peage.retour(h.id);
    v.envoyer(this.peage.etat(h.id, this.instant || Date.now()));
  }

  override sortir(v: Voyageur): void {
    super.sortir(v);
    this.peage.sortir(v.humain().id);
  }

  /** « Payer » à la caisse (ou contre la porte de la barricade) : le péage décide. */
  override payerPassage(ctx: ContexteLieu, passage: Passage, objets: Inventaire): void {
    if (passage !== "tunnel") return;
    const p = ctx.position();
    if (!procheBarricade(p.x, p.z)) return ctx.info("Approche-toi de la caisse, au pied de la barricade du tunnel.");
    this.peage.payer(contextePeage(ctx), objets);
  }

  /** L'heure passée, la porte se referme pour lui (on le lui dit). */
  override accompagner(ctx: ContexteLieu, _dt: number): void {
    this.instant = ctx.maintenant();
    this.peage.suivre(contextePeage(ctx));
  }

  override tick(instant: number, dt: number): void {
    this.instant = instant;
    super.tick(instant, dt);
  }
}
