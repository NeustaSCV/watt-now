// Le duel entre joueurs, côté serveur (0.11 ; book/plans/duel-entre-joueurs.md, plan-duel.md §3 B et C).
// Le monde (monde.ts) tient un seul registre des duels ; chaque joueur y est vu comme un `Duelliste` (joueur.ts lui prête
// des accès, aucune règle). Les règles pures sont dans commun/src/duel.ts.
//
// - Viser (§2, D-11) : en mode Combat, dans un lieu où le duel est permis, le plus proche devant soi, joueur ou Éteint ;
//   la position du joueur visé est rembobinée (chantier C : là où l'écran du frappeur le montrait). Jamais à travers un
//   mur ni un autre étage. Un duelliste ne vise que son adversaire ; ses coups ne font rien aux Éteints (§4).
// - Les refus (D-9, D-23) : un joueur en duel avec un autre, un perdant protégé, god : le coup part dans le vide, avec
//   une phrase courte. God ne provoque pas non plus : ses coups vont aux Éteints, comme avant.
// - Toucher (§3) : le premier coup lance le duel et retire déjà sa part ; pas d'étourdissement ni de recul, le geste
//   « tressaille » ; l'esquive protège. Un joueur vert frappé passe en Combat (D-20). L'échange et la leçon en cours
//   s'annulent, une action de travail s'arrête.
// - Les Éteints (§4, D-2, D-3) : la morsure va à la jauge, la saisie à trois la vide ; l'Éteint qui vide la jauge fait
//   perdre.
// - La fin (§5) : un objet tiré au hasard, avec sa charge ; trop lourd, aux pieds du gagnant ; une seule transaction ;
//   le perdant protégé 45 s. La fuite (D-4) : à plus de 25 m pendant 10 s, le duel est annulé. Partir est refusé ; le
//   joueur qui se déconnecte (ou s'effondre) perd tout de suite (`abandonner`).
// - La diffusion : `duels` à chacun quand ce qu'il voit change (les deux duellistes et ceux qui voient l'un d'eux, comme
//   les présences), `duel_fin` une fois aux mêmes témoins.

import { ANGLE_CIBLAGE, type Arme } from "../../commun/src/combat.ts";
import type { Position } from "../../commun/src/deplacement.ts";
import {
  FUITE_DISTANCE,
  FUITE_MS,
  JAUGE_DUEL,
  MORSURE_DUEL,
  PHRASES_DUEL,
  PROTECTION_DUEL_MS,
  TAMPON_POSITIONS_MS,
  partDuCoup,
  reculDuCoup,
  tirerObjet,
} from "../../commun/src/duel.ts";
import type { Charges } from "../../commun/src/energie.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";
import type { LieuId } from "../../commun/src/lieux.ts";
import type { DuelVu, MessageServeur } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { duelPermis } from "../../commun/src/registre-lieux.ts";

/** Ce que le joueur prête au duel : rien que des accès, aucune règle. */
export interface Duelliste {
  readonly id: number;
  readonly pseudo: string;
  /** Le lieu partagé où il se trouve ; null : chez lui, dans un lieu à soi, en route. */
  lieu(): LieuId | null;
  position(): Position;
  /** Il a choisi le mode Combat (halo rouge). */
  combat(): boolean;
  /** Le compte god (D-9) : on ne le provoque pas, il ne provoque pas. */
  dieu(): boolean;
  /** En pleine esquive : un coup ne le touche pas. */
  esquive(): boolean;
  /** Rien entre lui et ce point : ni mur, ni un autre étage du relief (comme pour les Éteints). */
  atteint(p: { x: number; z: number }): boolean;
  /** Un joueur vert frappé passe en Combat tout seul (D-20). */
  passerEnCombat(): void;
  /** Le coup reçu d'un joueur : le geste « tressaille », vu des autres. */
  tressaillir(): void;
  /** Une action de travail s'arrête ; endormi, il se réveille. */
  interrompre(): void;
  info(texte: string): void;
  envoyer(m: MessageServeur): void;
  /** Son sac. */
  sac(): Inventaire;
  /** Il cède une unité de cet objet : elle part de son sac, avec sa charge (renvoyée). */
  ceder(cle: CleObjet): Charges;
  /** Il reçoit cet objet et sa charge : dans son sac (true), ou à ses pieds si son sac est trop lourd (false). */
  recevoir(cle: CleObjet, charges: Charges): boolean;
  /** Des écritures qui vont ensemble : toutes enregistrées, ou aucune. */
  enBloc(f: () => void): void;
}

/** Ce que le monde prête au registre des duels. */
export interface ContexteDuels {
  trouver(id: number): Duelliste | undefined;
  /** Tous les joueurs connectés. */
  tous(): Iterable<Duelliste>;
  maintenant(): number;
  alea(): number;
  /** Au premier coup : l'échange et la leçon en cours de l'un et de l'autre s'annulent. */
  auPremierCoup?(a: Duelliste, b: Duelliste): void;
}

/** Un duel en cours : les deux duellistes et leurs jauges (points, de 0 à JAUGE_DUEL). */
interface Duel {
  a: number;
  b: number;
  ja: number;
  jb: number;
  /** Depuis cette heure (ms), ils sont à plus de 25 m l'un de l'autre ; null : assez près. */
  loinDepuis: number | null;
}

/** Ce que vise un coup, quand le duel s'en mêle : un joueur, ou rien (avec la phrase du refus). */
export interface Visee {
  cible?: { id: number; x: number; z: number };
  refus?: string;
}

/** Une position datée (l'heure du serveur, ms). */
interface Releve {
  h: number;
  x: number;
  z: number;
}

/**
 * Les positions d'un joueur pendant la dernière seconde (chantier C), une par tour de serveur (20 par seconde), pour
 * juger un coup là où l'écran du frappeur montrait la cible.
 */
export class TamponPositions {
  private readonly releves: Releve[] = [];

  ajouter(h: number, x: number, z: number): void {
    this.releves.push({ h, x, z });
    // Un peu plus d'une seconde : le rembobinage plafonne à 300 ms, la marge sert aux tours en retard.
    while (this.releves.length > 2 && this.releves[0]!.h < h - TAMPON_POSITIONS_MS) this.releves.shift();
  }

  /** La position à cette heure : entre les deux relevés qui l'encadrent ; avant le premier, le premier ; null : vide. */
  positionA(h: number): { x: number; z: number } | null {
    const r = this.releves;
    if (r.length === 0) return null;
    if (h <= r[0]!.h) return { x: r[0]!.x, z: r[0]!.z };
    for (let i = 1; i < r.length; i++) {
      const b = r[i]!;
      if (h > b.h) continue;
      const a = r[i - 1]!;
      const t = b.h > a.h ? (h - a.h) / (b.h - a.h) : 1;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    const dernier = r[r.length - 1]!;
    return { x: dernier.x, z: dernier.z };
  }
}

export class Duels {
  private readonly ctx: ContexteDuels;
  private readonly enCours: Duel[] = [];
  /** Les perdants protégés : jusqu'à quelle heure (ms). */
  private readonly protections = new Map<number, number>();
  /** Le ping de chacun (aller-retour, ms), mesuré par le monde. */
  private readonly pings = new Map<number, number>();
  private readonly tampons = new Map<number, TamponPositions>();
  /** Le dernier `duels` envoyé à chacun (sa forme écrite) : on ne renvoie que ce qui change. */
  private readonly envoyes = new Map<number, string>();
  /** Qui voit qui, au dernier tour des présences (les témoins). */
  private voisins: ReadonlyMap<number, ReadonlySet<number>> = new Map();

  constructor(ctx: ContexteDuels) {
    this.ctx = ctx;
  }

  noterPing(id: number, ms: number): void {
    if (Number.isFinite(ms) && ms >= 0) this.pings.set(id, ms);
  }

  private duelDe(id: number): Duel | undefined {
    return this.enCours.find((d) => d.a === id || d.b === id);
  }

  /** Est-il en duel ? (ses tirs et ses coups ne font alors rien aux Éteints, §4, D-8) */
  enDuel(id: number): boolean {
    return this.duelDe(id) !== undefined;
  }

  /** Perdant d'un duel il y a moins de 45 s : jusqu'à quelle heure on ne peut pas le provoquer (D-24) ; sinon undefined. */
  protegeJusqua(id: number): number | undefined {
    const jusqua = this.protections.get(id);
    return jusqua !== undefined && jusqua > this.ctx.maintenant() ? jusqua : undefined;
  }

  /** Partir de la halte (§6) : refusé pendant un duel. */
  refusDepart(id: number): string | null {
    return this.enDuel(id) ? PHRASES_DUEL.partir : null;
  }

  /** La phrase qui refuse de provoquer ce joueur (D-9, D-23), ou null. */
  private refus(cible: Duelliste): string | null {
    if (cible.dieu()) return PHRASES_DUEL.dieu;
    if (this.enDuel(cible.id)) return PHRASES_DUEL.enDuel;
    if (this.protegeJusqua(cible.id) !== undefined) return PHRASES_DUEL.protege;
    return null;
  }

  /**
   * Ce que vise un coup (D-11) : `dEteint` est la distance de l'Éteint que le coup viserait sans le duel (Infinity :
   * aucun). Renvoie null quand le duel ne s'en mêle pas (le coup va à l'Éteint, ou dans le vide comme avant) ; sinon
   * le joueur touché, ou rien, avec la phrase d'un refus.
   */
  viser(f: Duelliste, allonge: number, dEteint: number): Visee | null {
    const lieu = f.lieu();
    if (!lieu || !duelPermis(lieu) || f.dieu()) return null;
    const duel = this.duelDe(f.id);
    const adversaire = duel ? (duel.a === f.id ? duel.b : duel.a) : null;
    const instant = this.ctx.maintenant();
    const recul = reculDuCoup(this.pings.get(f.id) ?? 0);
    const moi = f.position();
    let cible: Visee["cible"];
    // Un duelliste ne touche pas les Éteints (§4) : seul son adversaire compte.
    let dCible = duel ? Infinity : dEteint;
    let refus: { texte: string; d: number } | null = null;
    // En vert, on ne frappe jamais un joueur (§2).
    if (f.combat())
      for (const c of this.ctx.tous()) {
        if (c.id === f.id || c.lieu() !== lieu) continue;
        if (adversaire !== null && c.id !== adversaire) continue;
        // Là où l'écran du frappeur le montrait (chantier C).
        const p = this.tampons.get(c.id)?.positionA(instant - recul) ?? c.position();
        const dx = p.x - moi.x;
        const dz = p.z - moi.z;
        const d = Math.hypot(dx, dz);
        if (d > allonge + 0.35) continue;
        const angle = Math.atan2(dx, dz) - moi.o;
        if (Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) > ANGLE_CIBLAGE) continue;
        if (!f.atteint(p)) continue;
        const r = adversaire === null ? this.refus(c) : null;
        if (r) {
          if (!refus || d < refus.d) refus = { texte: r, d };
          continue;
        }
        if (d < dCible) {
          cible = { id: c.id, x: p.x, z: p.z };
          dCible = d;
        }
      }
    if (cible) return { cible };
    if (duel) return refus ? { refus: refus.texte } : {};
    if (dEteint < Infinity) return null;
    return refus ? { refus: refus.texte } : null;
  }

  /**
   * Le coup d'un joueur sur un autre (visé par `viser`) : lance le duel au premier coup, retire sa part de la jauge.
   * Renvoie true s'il a touché (l'esquive protège).
   */
  toucher(f: Duelliste, cibleId: number, arme: Arme, appuye: boolean): boolean {
    const c = this.ctx.trouver(cibleId);
    if (!c || c.esquive()) return false;
    let duel = this.duelDe(f.id);
    if (!duel) {
      duel = { a: f.id, b: c.id, ja: JAUGE_DUEL, jb: JAUGE_DUEL, loinDepuis: null };
      this.enCours.push(duel);
      this.ctx.auPremierCoup?.(f, c);
      for (const [x, y] of [[f, c], [c, f]] as const) {
        x.interrompre();
        x.info(PHRASES_DUEL.debut(y.pseudo));
      }
    }
    if (!c.combat()) c.passerEnCombat();
    c.tressaillir();
    c.interrompre();
    this.retirer(duel, c.id, partDuCoup(arme, appuye));
    return true;
  }

  /** Une morsure d'Éteint sur un duelliste (§4) : sa jauge encaisse, pas sa santé. Renvoie false hors duel. */
  morsure(id: number): boolean {
    const duel = this.duelDe(id);
    if (!duel) return false;
    this.retirer(duel, id, MORSURE_DUEL);
    return true;
  }

  /** La saisie par trois Éteints pendant un duel (D-3) : elle vide la jauge d'un coup. Renvoie false hors duel. */
  saisieATrois(id: number): boolean {
    const duel = this.duelDe(id);
    if (!duel) return false;
    this.retirer(duel, id, JAUGE_DUEL);
    return true;
  }

  /** Le joueur se déconnecte, ou s'effondre, pendant un duel : il le perd tout de suite (§6, D-13). */
  abandonner(id: number): void {
    const duel = this.duelDe(id);
    if (duel) this.finir(duel, duel.a === id ? duel.b : duel.a, id);
  }

  private retirer(duel: Duel, id: number, points: number): void {
    if (duel.a === id) duel.ja = Math.max(0, duel.ja - points);
    else duel.jb = Math.max(0, duel.jb - points);
    // Si c'est un Éteint qui la vide, le duelliste perd aussi (D-2).
    if ((duel.a === id ? duel.ja : duel.jb) <= 0) this.finir(duel, duel.a === id ? duel.b : duel.a, id);
  }

  private retirerDuel(duel: Duel): void {
    const i = this.enCours.indexOf(duel);
    if (i >= 0) this.enCours.splice(i, 1);
  }

  /** La fin (§5) : un objet du perdant tiré au hasard passe au gagnant (ou à ses pieds) ; le perdant est protégé 45 s. */
  private finir(duel: Duel, gagnantId: number, perdantId: number): void {
    this.retirerDuel(duel);
    const g = this.ctx.trouver(gagnantId);
    const p = this.ctx.trouver(perdantId);
    let objet: CleObjet | null = null;
    let auSol = false;
    if (g && p) {
      objet = tirerObjet(p.sac(), this.ctx.alea());
      const pris = objet;
      // Les deux côtés, en une seule transaction.
      if (pris) p.enBloc(() => (auSol = !g.recevoir(pris, p.ceder(pris))));
    }
    this.protections.set(perdantId, this.ctx.maintenant() + PROTECTION_DUEL_MS);
    g?.info(objet ? (auSol ? PHRASES_DUEL.gagneAuSol(objet) : PHRASES_DUEL.gagne(objet)) : PHRASES_DUEL.gagneSacVide);
    if (g) p?.info(objet ? PHRASES_DUEL.perdu(g.pseudo, objet) : PHRASES_DUEL.perduSacVide);
    this.auxTemoins(duel, {
      t: "duel_fin",
      a: duel.a,
      b: duel.b,
      issue: "gagne",
      gagnant: gagnantId,
      ...(objet ? { objet } : { sacVide: true as const }),
      ...(auSol ? { auSol: true as const } : {}),
    });
  }

  /** La fuite (D-4) : sans gagnant ni objet. */
  private annuler(duel: Duel): void {
    this.retirerDuel(duel);
    for (const id of [duel.a, duel.b]) this.ctx.trouver(id)?.info(PHRASES_DUEL.fuite);
    this.auxTemoins(duel, { t: "duel_fin", a: duel.a, b: duel.b, issue: "annule" });
  }

  /** Aux deux duellistes et à ceux qui voyaient l'un d'eux au dernier tour des présences, une fois chacun. */
  private auxTemoins(duel: Duel, m: MessageServeur): void {
    const ids = new Set([duel.a, duel.b]);
    for (const [obs, vus] of this.voisins) if (vus.has(duel.a) || vus.has(duel.b)) ids.add(obs);
    for (const id of ids) this.ctx.trouver(id)?.envoyer(m);
  }

  /** À chaque tour du serveur : les positions de la dernière seconde, la fuite, les duellistes partis. */
  tick(): void {
    const instant = this.ctx.maintenant();
    const vus = new Set<number>();
    for (const j of this.ctx.tous()) {
      const lieu = j.lieu();
      if (!lieu || !duelPermis(lieu)) continue;
      vus.add(j.id);
      let t = this.tampons.get(j.id);
      if (!t) this.tampons.set(j.id, (t = new TamponPositions()));
      const p = j.position();
      t.ajouter(instant, p.x, p.z);
    }
    for (const id of this.tampons.keys()) if (!vus.has(id)) this.tampons.delete(id);
    for (const [id, jusqua] of this.protections) if (jusqua <= instant) this.protections.delete(id);

    for (const duel of [...this.enCours]) {
      const a = this.ctx.trouver(duel.a);
      const b = this.ctx.trouver(duel.b);
      const lieuA = a?.lieu() ?? null;
      const lieuB = b?.lieu() ?? null;
      // Celui qui n'est plus dans la halte (parti sans `abandonner`) perd, comme à une déconnexion.
      if (!a || !b || lieuA === null || lieuB === null || lieuA !== lieuB) {
        const perdant = !a || lieuA === null || (lieuB !== null && lieuA !== lieuB) ? duel.a : duel.b;
        this.finir(duel, perdant === duel.a ? duel.b : duel.a, perdant);
        continue;
      }
      const pa = a.position();
      const pb = b.position();
      if (Math.hypot(pa.x - pb.x, pa.z - pb.z) > FUITE_DISTANCE) {
        if (duel.loinDepuis === null) duel.loinDepuis = instant;
        else if (instant - duel.loinDepuis >= FUITE_MS) this.annuler(duel);
      } else duel.loinDepuis = null;
    }
  }

  /**
   * Au tour des présences : à chacun, la liste complète des duels qu'il voit (le sien, et ceux dont il voit l'un des
   * deux duellistes), seulement si elle a changé depuis le dernier envoi ; une liste vide efface. `voisins` : qui voit
   * qui (le même calcul que les présences : même rayon, mêmes murs).
   */
  diffuser(voisins: ReadonlyMap<number, ReadonlySet<number>>): void {
    this.voisins = voisins;
    if (this.enCours.length === 0 && this.envoyes.size === 0) return;
    const presents = new Set<number>();
    for (const j of this.ctx.tous()) {
      presents.add(j.id);
      const vus = voisins.get(j.id);
      const liste: DuelVu[] = [];
      for (const d of this.enCours) {
        if (d.a !== j.id && d.b !== j.id && !vus?.has(d.a) && !vus?.has(d.b)) continue;
        liste.push({
          a: d.a,
          b: d.b,
          ja: Math.round((d.ja / JAUGE_DUEL) * 100) / 100,
          jb: Math.round((d.jb / JAUGE_DUEL) * 100) / 100,
          ...(d.loinDepuis !== null ? { loinDepuis: d.loinDepuis } : {}),
        });
      }
      const cle = JSON.stringify(liste);
      if (cle === (this.envoyes.get(j.id) ?? "[]")) continue;
      if (liste.length > 0) this.envoyes.set(j.id, cle);
      else this.envoyes.delete(j.id);
      j.envoyer({ t: "duels", d: liste });
    }
    for (const id of this.envoyes.keys()) if (!presents.has(id)) this.envoyes.delete(id);
  }
}
