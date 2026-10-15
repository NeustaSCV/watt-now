// H2A, la route du pont, côté serveur (plan 0.10, chantier H) : une halte partagée par tous les voyageurs, comme la
// station et le gué. Le contenu et la géographie sont dans commun/src/route-pont.ts ; ici, ce qui vit :
//
// - le péage (S-19 ; serveur/src/peage.ts) : la caisse au pied du poste de guet, la porte de la chicane ouverte pour qui
//   a payé, et pour lui seul (`zonePour`) ;
// - la marée (S-20) : elle se lit de l'heure du monde ; à marée haute, la cale basse est sous l'eau (son accès fermé,
//   ses bancs qu'on ne fouille plus), et qui y est resté est remis en haut de l'accès, sur le quai (K1), avec un message
//   qui passe (le fondu est à l'écran ; le bouton n'est plus montré).
//
// joueur.ts n'y touche que par les points d'appel de LieuVivant (`geste`, `accompagner`, `zonePour`, `payerPassage`).

import type { Cible } from "../../commun/src/messages.ts";
import type { Zone } from "../../commun/src/lieux.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import type { Passage } from "../../commun/src/peage.ts";
import { LIGNE_BANC_SOUS_L_EAU, LIGNE_MAREE_MONTE, RETOUR_MAREE, estBancDeLaCale, maree, prochePeage, surLaCale, zoneRoutePont } from "../../commun/src/route-pont.ts";
import type { Base } from "./base.ts";
import { LieuVivant, type ContexteLieu, type Voyageur } from "./lieu-vivant.ts";
import { definitionDuRegistre } from "./lieux-personnels.ts";
import { Peage, vientDuLieu, type ContextePeage } from "./peage.ts";

/** Le bouton du message de la marée (jamais une croix). */
export const BOUTON_MAREE = "Compris";

/** Ce que le péage demande au joueur, tiré de ce qu'il prête au lieu. */
function contextePeage(ctx: ContexteLieu): ContextePeage {
  return { id: ctx.id, maintenant: () => ctx.maintenant(), inventaire: () => ctx.inventaire(), donner: (o) => ctx.donner(o), info: (t) => ctx.info(t), envoyer: (m) => ctx.envoyer(m) };
}

export class RoutePont extends LieuVivant {
  readonly peage: Peage;
  private readonly debut: number;
  /** Le dernier instant connu (le tic) : la zone suit la marée à cet instant. */
  private instant = 0;

  constructor(base: Base, alea: () => number = Math.random) {
    super(base, definitionDuRegistre("route_pont"), alea);
    this.debut = base.debutMonde();
    this.peage = new Peage(base, "pont");
  }

  /** Marée haute, à cet instant ? */
  private haute(instant = this.instant): boolean {
    return maree(instant, this.debut) === "haute";
  }

  // ---------- Ce que voit le jeu ----------

  /** La zone des Éteints (et de qui n'a pas payé) : la porte du péage fermée, la cale fermée à marée haute. */
  override get zone(): Zone {
    return zoneRoutePont({ haute: this.haute(), ouverte: false });
  }

  /** La zone d'un joueur : la porte du péage ouverte s'il a payé (pour lui seul). */
  override zonePour(compteId: number): Zone {
    return zoneRoutePont({ haute: this.haute(), ouverte: this.peage.ouvertPour(compteId, this.instant) });
  }

  override entrer(v: Voyageur): void {
    super.entrer(v);
    // Arrivé du côté du lieu, on rentre chez soi : on passe sans payer (V2-01, « à l'aller seulement »).
    const h = v.humain();
    if (vientDuLieu("route_pont", h.x, h.z)) this.peage.retour(h.id);
    v.envoyer(this.peage.etat(h.id, this.instant || Date.now()));
  }

  override sortir(v: Voyageur): void {
    super.sortir(v);
    this.peage.sortir(v.humain().id);
  }

  // ---------- Les gestes ----------

  /** À marée haute, les bancs de la cale ne se fouillent pas (S-20). */
  override geste(ctx: ContexteLieu, cible: Cible, verbe: string): boolean {
    if (cible?.genre !== "ressource" || !(verbe === "ramasser" || verbe === "demonter" || verbe === "fouiller")) return false;
    const r = this.ressources.get(cible.id as number);
    if (!r || !estBancDeLaCale(r.type) || !this.haute(ctx.maintenant())) return false;
    ctx.info(LIGNE_BANC_SOUS_L_EAU);
    return true;
  }

  /** « Payer » à la caisse du péage (ou contre la porte) : le péage décide. */
  override payerPassage(ctx: ContexteLieu, passage: Passage, objets: Inventaire): void {
    if (passage !== "pont") return;
    const p = ctx.position();
    if (!prochePeage(p.x, p.z)) return ctx.info("Approche-toi de la caisse du péage, au pied du poste de guet.");
    this.peage.payer(contextePeage(ctx), objets);
  }

  // ---------- Ce qui suit le joueur, à chaque tic ----------

  /**
   * Le péage : l'heure passée, la porte se referme pour lui. La marée : à marée haute, qui est sur la cale remonte sur le
   * quai, en haut de l'accès (K1) ; l'écran fait le fondu et montre le message, qui passe.
   */
  override accompagner(ctx: ContexteLieu, _dt: number): void {
    const instant = ctx.maintenant();
    this.instant = instant;
    this.peage.suivre(contextePeage(ctx));
    if (!this.haute(instant)) return;
    const p = ctx.position();
    if (!surLaCale(p.x, p.z)) return;
    ctx.deplacer({ x: RETOUR_MAREE.x, z: RETOUR_MAREE.z, o: -Math.PI / 2 });
    ctx.envoyer({ t: "maree_remonte", texte: LIGNE_MAREE_MONTE, bouton: BOUTON_MAREE });
  }

  // ---------- Le temps qui passe ----------

  override tick(instant: number, dt: number): void {
    this.instant = instant;
    super.tick(instant, dt);
  }
}
