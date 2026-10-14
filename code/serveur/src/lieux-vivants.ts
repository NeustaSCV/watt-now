// Les lieux vivants du serveur, rangés par le registre des lieux (plan 0.10, chantier A) : un seul endroit où l'on
// trouve, pour un lieu et un joueur, le lieu vivant où il est (la halte partagée, ou son lieu à soi). Le monde
// (monde.ts) les fait vivre ; le joueur (joueur.ts) y entre, en sort, s'y déplace, sans branche écrite par lieu.
//
// Chaque halte et chaque lieu à soi du registre a son « gardien » : celui qui donne le lieu vivant d'un joueur, le fait
// vivre à chaque tic et l'oublie quand le compte est supprimé. Les lieux du niveau 1 ont le leur, dans leur module (la
// halte, le gué, les Coopératives, les Moulins) ; les autres sont construits d'après leur nature (registre-lieux.ts) :
// une halte partagée, sur LieuVivant ; un lieu à soi qui revient à 24 h, sur LieuxPersonnels. Un lieu qui a ses propres
// règles déclare sa fabrique dans FABRIQUES (une ligne), et sa classe sur LieuVivant (ses points d'appel : `geste`,
// `accompagner`, plus ceux de LieuVivant).
//
// Les gardiens sont créés au premier besoin : un lieu où personne n'est jamais allé ne coûte rien.

import { TOUS_LES_LIEUX, estLieuJouable, type LieuId } from "../../commun/src/lieux.ts";
import { estHalte, estPersonnel } from "../../commun/src/registre-lieux.ts";
import type { Base } from "./base.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { LieuVivant, type Voyageur } from "./lieu-vivant.ts";
import { LieuxPersonnels, definitionDuRegistre } from "./lieux-personnels.ts";
import { Moulins } from "./moulin.ts";
import { Phares } from "./phare.ts";

/** Ce qui garde un lieu : le lieu vivant d'un joueur (le même pour tous dans une halte), sa vie à chaque tic. */
export interface GardienLieu {
  de(compteId: number): LieuVivant;
  tick(instant: number, dt: number): void;
  /** Le compte est supprimé : son lieu à soi quitte la mémoire sans être réécrit. */
  oublier?(compteId: number): void;
}

/** Une halte : un seul lieu vivant, partagé par tous. */
export function gardienPartage(lieu: LieuVivant): GardienLieu {
  return { de: () => lieu, tick: (instant, dt) => lieu.tick(instant, dt) };
}

type Fabrique = (base: Base, alea: () => number, maintenant: () => number) => GardienLieu;

/**
 * Les lieux qui ont leurs propres règles, et ce qui les construit. Les autres haltes et lieux à soi du registre sont
 * construits d'après leur nature (`fabriqueParNature`). Un nouveau lieu à règles ajoute ici sa ligne, par exemple :
 * `grand_hotel: (b, a, m) => new LieuxPersonnels(b, "grand_hotel", a, m, (b, d, a) => new LieuHotel(b, d, a))`.
 */
export const FABRIQUES: Partial<Record<LieuId, Fabrique>> = {
  station: (b, a) => gardienPartage(new Halte(b, a)),
  gue: (b, a) => gardienPartage(new Gue(b, a)),
  cooperative: (b, a, m) => new Cooperatives(b, a, m),
  moulin: (b, a, m) => new Moulins(b, a, m),
  // 0.10, chantier K : le phare du cap, « le feu et le cargo » (serveur/src/phare.ts).
  phare: (b, a, m) => new Phares(b, a, m),
};

/** Un lieu du registre sans fabrique : une halte partagée, ou un lieu à soi qui revient à 24 h. */
function fabriqueParNature(lieu: LieuId): Fabrique | null {
  if (estHalte(lieu)) return (b, a) => gardienPartage(new LieuVivant(b, definitionDuRegistre(lieu), a));
  if (estPersonnel(lieu)) return (b, a, m) => new LieuxPersonnels(b, lieu, a, m);
  return null;
}

/** Les gardiens déjà construits qu'on confie (le monde les partage avec ses joueurs ; les tests aussi). */
export interface GardiensDonnes {
  station?: Halte;
  cooperative?: Cooperatives;
  gue?: Gue;
  moulin?: Moulins;
}

export class LieuxVivants {
  private readonly gardiens = new Map<LieuId, GardienLieu>();
  private readonly base: Base;
  private readonly alea: () => number;
  private readonly maintenant: () => number;

  constructor(base: Base, donnes: GardiensDonnes = {}, alea: () => number = Math.random, maintenant: () => number = Date.now) {
    this.base = base;
    this.alea = alea;
    this.maintenant = maintenant;
    // Dans l'ordre où le monde les faisait vivre jusqu'en 0.9 : la halte, les Coopératives, le gué, les Moulins.
    if (donnes.station) this.gardiens.set("station", gardienPartage(donnes.station));
    if (donnes.cooperative) this.gardiens.set("cooperative", donnes.cooperative);
    if (donnes.gue) this.gardiens.set("gue", gardienPartage(donnes.gue));
    if (donnes.moulin) this.gardiens.set("moulin", donnes.moulin);
  }

  /** Le gardien d'un lieu (créé au premier besoin) ; null pour le terrain et le Comptoir, qui ne sont pas des lieux vivants. */
  gardien(lieu: LieuId): GardienLieu | null {
    const deja = this.gardiens.get(lieu);
    if (deja) return deja;
    const fabrique = FABRIQUES[lieu] ?? fabriqueParNature(lieu);
    if (!fabrique) return null;
    const g = fabrique(this.base, this.alea, this.maintenant);
    this.gardiens.set(lieu, g);
    return g;
  }

  /** Le lieu vivant de ce joueur dans ce lieu (la halte partagée, son lieu à soi) ; null sur le terrain et au Comptoir. */
  vivant(lieu: LieuId, compteId: number): LieuVivant | null {
    return this.gardien(lieu)?.de(compteId) ?? null;
  }

  /** Tous les lieux vivants en mémoire vivent un tic. */
  tick(instant: number, dt: number): void {
    for (const g of this.gardiens.values()) g.tick(instant, dt);
  }

  /** Le compte est supprimé : ses lieux à soi quittent la mémoire sans être réécrits. */
  oublier(compteId: number): void {
    for (const g of this.gardiens.values()) g.oublier?.(compteId);
  }

  /** Dans une halte, la vue passe-t-elle de a à b ? (ses murs : la boutique de la station, la cabane du gué) */
  voitEntre(lieu: string, a: { x: number; z: number }, b: { x: number; z: number }): boolean {
    const g = estLieuJouable(lieu) && estHalte(lieu) ? this.gardiens.get(lieu) : undefined;
    return g ? g.de(0).voitEntre(a, b) : true;
  }

  /** Le joueur se déconnecte : il quitte toutes les haltes (hors ligne, il est sur la carte, Book 01 §2 bis). */
  sortirDesHaltes(v: Voyageur): void {
    for (const lieu of TOUS_LES_LIEUX) if (estHalte(lieu)) this.gardiens.get(lieu)?.de(0).sortir(v);
  }
}
