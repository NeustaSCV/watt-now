// L2A, le Grand Hôtel des Flots, côté serveur (plan 0.10, chantier J) : un lieu à soi (LieuxPersonnels, comme tous les
// lieux à soi du registre), et ce qui lui est propre, « le check-in » (§3.3, S-07 à S-11).
//
// Le plan (zone, pièces, vue, points du scénario, butin, textes) est dans commun/src/hotel.ts, les Éteints dans
// eteints-hotel.ts, le milieu dans milieu-hotel.ts, les ressources dans ressources-hotel.ts.
//
// Le parcours :
// 1. la batterie du panneau de la promenade se porte dans les bras (S-08 : on ne court pas, on ne frappe pas, on peut
//    la poser) ; branchée à la borne du hall, elle y reste (S-07) : l'écran s'allume ;
// 2. le robot-serveur de la salle à manger se dégage du sable (Creuser 1 : 10 s ; à mains nues : 30 s, S-09) ; sa tête
//    se dévisse et se porte à deux mains (8 kg, Q-0.10-8) ;
// 3. présentée à la borne alimentée, elle y reste, et la borne remet la carte de la chambre 7 (un objet, S-10) ; sans
//    courant, la borne ne répond pas ; le joueur seul n'est pas reconnu ;
// 4. la carte en sac, on appelle l'ascenseur : un fondu au noir d'une seconde, et l'on est à l'étage (S-01, S-11) ; on
//    redescend par l'ascenseur tant qu'on est à l'étage ;
// 5. on sort de l'étage par le balcon effondré de la chambre 8 : on retombe sur la dune, on ne remonte pas (S-11) ;
// 6. la carte reste à l'hôtel quand on en part (S-10) ; au bout de 24 h, tout revient (S-04) : la batterie au pied du
//    panneau, le robot ensablé, sa tête sur ses épaules. Les objets-clés de 4 jours gardent leur délai.
//
// Ce qu'on garde entre deux visites : l'état du lieu (LieuxPersonnels), dont `propre.hotel` (EtatHotel). Une partie
// d'avant la 0.10 n'en a pas : l'hôtel neuf (lireEtatHotel).

import {
  ASCENSEUR,
  BALCON,
  BORNE,
  CARTE,
  DEGAGER,
  FONDU_MS,
  NOMS_PORTES,
  PORTEE_HOTEL,
  ROBOT,
  TEXTES_HOTEL,
  borneAlimentee,
  dansLesBrasHotel,
  etatHotelNeuf,
  lireEtatHotel,
  niveauHotel,
  ouEst,
  surLeBalcon,
  type EtatHotel,
  type ObjetPorte,
} from "../../commun/src/hotel.ts";
import type { Position } from "../../commun/src/deplacement.ts";
import type { Cible } from "../../commun/src/messages.ts";
import { niveauQualite } from "../../commun/src/recettes.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import { CLES_LENTES_HOTEL, type TypeRessourceHotel } from "../../commun/src/ressources-hotel.ts";
import type { Base } from "./base.ts";
import { JAMAIS, LieuVivant, type ContexteLieu, type DefinitionLieuVivant, type Voyageur } from "./lieu-vivant.ts";
import { LieuxPersonnels, type EtatLieuPersonnel } from "./lieux-personnels.ts";

/** Ce que l'hôtel demande à son gardien (LieuxPersonnels) : son état gardé, de quoi le sauver, l'heure. */
export interface AccesHotel {
  etat(): EtatLieuPersonnel | undefined;
  sauver(): void;
  maintenant(): number;
}

/** Un changement de place en cours (l'ascenseur, le saut du balcon) : où, et quand (au milieu du fondu). */
interface Passage {
  vers: Position;
  le: number;
}

/** L'hôtel d'un joueur : un lieu vivant, plus « le check-in ». */
export class LieuHotel extends LieuVivant {
  private readonly acces: AccesHotel;
  /** Ce que chaque joueur présent prête au lieu (pour lui reprendre la carte quand il s'en va). */
  private readonly contextes = new Map<number, ContexteLieu>();
  /** Ceux qui ont reçu l'état du check-in depuis leur entrée. */
  private readonly informes = new Set<number>();
  /** Les changements de place en cours, par joueur. */
  private readonly passages = new Map<number, Passage>();
  /** L'état gardé qu'on a relu (il change d'objet au retour à 24 h). */
  private relu: EtatLieuPersonnel | null = null;
  /** Avant que le gardien n'ait rangé l'état (pendant la construction) : l'hôtel neuf. */
  private provisoire: EtatHotel | null = null;

  constructor(base: Base, definition: DefinitionLieuVivant, alea: () => number, acces: AccesHotel) {
    super(base, definition, alea);
    this.acces = acces;
  }

  /** Où en est le check-in. */
  get checkIn(): EtatHotel {
    const e = this.acces.etat();
    if (!e) return (this.provisoire ??= etatHotelNeuf());
    if (this.relu !== e) {
      e.propre.hotel = lireEtatHotel(e.propre.hotel);
      this.relu = e;
    }
    return e.propre.hotel as EtatHotel;
  }

  /** Le check-in a changé : on le garde, et on le montre à ceux qui sont là. */
  private changer(): void {
    this.acces.sauver();
    this.diffuser({ t: "hotel", hotel: this.checkIn });
  }

  override entrer(v: Voyageur): void {
    super.entrer(v);
    this.informes.delete(v.humain().id);
  }

  /**
   * On s'en va (la route, une déconnexion) : ce qu'on portait reste là où on l'a lâché, et la carte de la chambre 7
   * reste à l'hôtel (S-10).
   */
  override sortir(v: Voyageur): void {
    super.sortir(v);
    const id = v.humain().id;
    const ctx = this.contextes.get(id);
    this.informes.delete(id);
    this.passages.delete(id);
    const porte = dansLesBrasHotel(this.checkIn);
    if (porte) {
      const h = v.humain();
      this.deposer(porte, { x: h.x, z: h.z });
      this.acces.sauver();
    }
    if (ctx) {
      const n = ctx.inventaire()[CARTE] ?? 0;
      if (n > 0 && ctx.retirer(CARTE, n)) ctx.info(TEXTES_HOTEL.carteLaissee);
    }
    this.contextes.delete(id);
  }

  /**
   * Tout revient (S-04 : à l'entrée, l'hôtel vide) ; le gardien a déjà remis l'état neuf. Les objets-clés de 4 jours
   * (S-03) ne reviennent pas avant leur délai.
   */
  override reinitialiser(): void {
    const instant = this.acces.maintenant();
    const lents = [...this.ressources.values()]
      .filter((r) => CLES_LENTES_HOTEL.includes(r.type as TypeRessourceHotel) && r.disponibleLe > instant && r.disponibleLe !== JAMAIS)
      .map((r) => [r, r.disponibleLe] as const);
    super.reinitialiser();
    for (const [r, le] of lents) this.prendre(r, le);
    this.passages.clear();
    this.provisoire = null;
  }

  override dansLesBras(_compteId: number): string | null {
    const porte = dansLesBrasHotel(this.checkIn);
    return porte ? NOMS_PORTES[porte] : null;
  }

  /** Poser devant soi ce qu'on porte (comme l'escabeau : à 0,9 m devant). */
  override poser(ctx: ContexteLieu): boolean {
    const porte = dansLesBrasHotel(this.checkIn);
    if (!porte) return false;
    const p = ctx.position();
    this.deposer(porte, { x: Math.round((p.x + Math.sin(p.o) * 0.9) * 100) / 100, z: Math.round((p.z + Math.cos(p.o) * 0.9) * 100) / 100 });
    this.changer();
    return true;
  }

  private deposer(objet: ObjetPorte, ou: { x: number; z: number }): void {
    if (objet === "batterie") this.checkIn.batterie = ou;
    else this.checkIn.tete = ou;
  }

  override accompagner(ctx: ContexteLieu, _dt: number): void {
    this.contextes.set(ctx.id, ctx);
    if (!this.informes.has(ctx.id)) {
      this.informes.add(ctx.id);
      ctx.envoyer({ t: "hotel", hotel: this.checkIn });
    }
    const instant = ctx.maintenant();
    const passage = this.passages.get(ctx.id);
    if (passage) {
      if (instant >= passage.le) {
        this.passages.delete(ctx.id);
        ctx.annuler();
        ctx.deplacer({ ...passage.vers });
      }
      return;
    }
    // Sur le balcon effondré : on saute sur la dune (S-11), on ne remonte pas.
    const p = ctx.position();
    if (surLeBalcon(p.x, p.z)) {
      this.passer(ctx, "balcon", "sauter", { ...BALCON.arrivee });
      ctx.info(TEXTES_HOTEL.balcon);
    }
  }

  /** Un fondu au noir d'une seconde (S-01) : le joueur change de place au milieu. */
  private passer(ctx: ContexteLieu, scene: "ascenseur" | "balcon", etape: string, vers: Position): void {
    const debut = ctx.maintenant();
    this.passages.set(ctx.id, { vers, le: debut + FONDU_MS / 2 });
    ctx.envoyer({ t: "scene", lieu: "grand_hotel", scene, etape, debut });
  }

  override geste(ctx: ContexteLieu, cible: Cible, verbe: string): boolean {
    if (cible?.genre !== "lieu") return false;
    this.contextes.set(ctx.id, ctx);
    if (this.passages.has(ctx.id)) return true;
    const p = ctx.position();
    const pres = (o: { x: number; z: number } | null, d = PORTEE_HOTEL) => o !== null && Math.hypot(o.x - p.x, o.z - p.z) <= d + 1;
    const h = this.checkIn;
    const bras = dansLesBrasHotel(h);
    switch (cible.id) {
      case "batterie":
      case "tete": {
        if (verbe !== "porter") return true;
        const objet: ObjetPorte = cible.id;
        if (bras) return this.dire(ctx, bras === objet ? null : "Tu portes déjà quelque chose : pose-le d'abord.");
        const place = objet === "batterie" ? h.batterie : h.tete;
        if (place === "borne") return this.dire(ctx, objet === "batterie" ? "Branchée à la borne, elle y reste." : "La tête reste sur la borne.");
        if (objet === "tete" && place === "robot" && !h.degage) return this.dire(ctx, TEXTES_HOTEL.robotEnsable);
        if (!pres(ouEst(h, objet))) return this.dire(ctx, "Approche-toi.");
        ctx.annuler();
        if (objet === "batterie") h.batterie = "bras";
        else h.tete = "bras";
        this.changer();
        return this.dire(ctx, objet === "batterie" && place === "panneau" ? TEXTES_HOTEL.prendreBatterie : objet === "tete" && place === "robot" ? TEXTES_HOTEL.prendreTete : null);
      }
      case "robot": {
        if (verbe !== "degager") return true;
        if (h.degage) return this.dire(ctx, TEXTES_HOTEL.robotDegage);
        if (bras) return this.dire(ctx, `Tu as les bras pris : pose d'abord ${NOMS_PORTES[bras]}.`);
        if (!pres(ROBOT)) return this.dire(ctx, "Approche-toi du robot.");
        const outil = niveauQualite(ctx.inventaire(), "creuser") >= 1;
        if (!outil) ctx.info(TEXTES_HOTEL.aMainsNues);
        ctx.commencer("Dégager le robot", (outil ? DEGAGER.avecOutil : DEGAGER.aMainsNues) / REGLAGES.gestes_vitesse, () => {
          if (this.checkIn.degage) return;
          this.checkIn.degage = true;
          this.changer();
          ctx.info(TEXTES_HOTEL.degage);
        });
        return true;
      }
      case "borne": {
        if (!pres(BORNE)) return this.dire(ctx, "Approche-toi de la borne.");
        if (verbe === "brancher") {
          if (bras !== "batterie") return true;
          h.batterie = "borne";
          this.changer();
          return this.dire(ctx, TEXTES_HOTEL.brancher);
        }
        if (verbe !== "presenter") return true;
        if (!borneAlimentee(h)) return this.dire(ctx, TEXTES_HOTEL.borneSansCourant);
        const aLaCarte = (ctx.inventaire()[CARTE] ?? 0) > 0;
        if (bras === "tete") {
          h.tete = "borne";
          this.changer();
          if (!aLaCarte) ctx.ajouter({ [CARTE]: 1 });
          return this.dire(ctx, TEXTES_HOTEL.carteRemise);
        }
        // La tête est déjà sur la borne (une deuxième visite le même jour) : la borne remet une autre carte.
        if (h.tete === "borne") {
          if (aLaCarte) return this.dire(ctx, TEXTES_HOTEL.dejaLaCarte);
          ctx.ajouter({ [CARTE]: 1 });
          return this.dire(ctx, TEXTES_HOTEL.carteRemise);
        }
        return this.dire(ctx, TEXTES_HOTEL.sourireNonReconnu);
      }
      case "ascenseur": {
        if (verbe !== "appeler_ascenseur") return true;
        const etage = niveauHotel(p.x, p.z) === "etage";
        const ici = etage ? ASCENSEUR.haut : ASCENSEUR.bas;
        if (!pres(ici.grille)) return this.dire(ctx, "Approche-toi de la grille.");
        if (bras) return this.dire(ctx, `Tu as les bras pris : pose d'abord ${NOMS_PORTES[bras]}.`);
        if (etage) {
          // On redescend tant qu'on est à l'étage (S-11), carte ou non.
          ctx.annuler();
          this.passer(ctx, "ascenseur", "descendre", { ...ASCENSEUR.bas.arrivee });
          return this.dire(ctx, TEXTES_HOTEL.descendre);
        }
        if ((ctx.inventaire()[CARTE] ?? 0) <= 0) return this.dire(ctx, TEXTES_HOTEL.sansCarte);
        ctx.annuler();
        this.passer(ctx, "ascenseur", "monter", { ...ASCENSEUR.haut.arrivee });
        return this.dire(ctx, TEXTES_HOTEL.monter);
      }
      default:
        return false;
    }
  }

  /** Un message au joueur (null : rien à dire) ; le geste est pris. */
  private dire(ctx: ContexteLieu, texte: string | null): true {
    if (texte) ctx.info(texte);
    return true;
  }
}

/** Les hôtels des joueurs (un par joueur, comme tout lieu à soi du registre), chacun avec son check-in. */
export function gardienHotel(base: Base, alea: () => number = Math.random, maintenant: () => number = Date.now): LieuxPersonnels {
  const g: LieuxPersonnels = new LieuxPersonnels(base, "grand_hotel", alea, maintenant, (b, d, a) => {
    const compteId = d.sacs.terrainDe;
    return new LieuHotel(b, d, a, { etat: () => g.etat(compteId), sauver: () => g.sauverEtat(compteId), maintenant });
  });
  return g;
}
