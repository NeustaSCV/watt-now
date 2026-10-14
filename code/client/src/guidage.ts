// Le guidage du joueur au niveau 2, côté écran (0.10 ; les données et les textes : commun/src/guidage.ts).
//
// C'est l'écran qui déclenche : il sait où est le personnage, à chaque image, et tout l'état utile, tel que le serveur
// le lui a dit (la marée, qui est la même pour tous ; le passage du péage, message `passage` ; le check-in de l'hôtel,
// message `hotel` ; le phare, son allumage et le cargo, message `phare`). Rien n'est gardé en base : une visite commence
// au message `bienvenue` (on arrive dans un lieu), et chaque phrase s'y dit une seule fois.
//
// - `recevoir` : chaque message du serveur (main.ts, une ligne, avant tout le reste ; on ne prend rien à personne).
// - `suivre` : à chaque image (main.ts, une ligne) : les déclencheurs du lieu ; les lignes à dire attendent leur tour
//   (une toutes les 2,5 s, pour qu'on ait le temps de lire, deux messages au plus tenant sur un téléphone).
// - `proposer` : près d'un écriteau, B propose « Lire » (A reste ce qu'il était).
//
// Ce module ne touche ni au DOM ni au décor : il dit ses lignes par la fonction qu'on lui donne (hud.message).

import {
  DECLENCHEURS,
  aLEndroit,
  arriveeDuCoteDuLieu,
  ecriteauProche,
  type Declencheur,
  type EtatGuidage,
  type EvenementGuidage,
  type GenreGuidage,
} from "../../commun/src/guidage.ts";
import type { EtatHotel } from "../../commun/src/hotel.ts";
import type { LieuId } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import type { Passage } from "../../commun/src/peage.ts";
import type { EtatPhareVu } from "../../commun/src/phare.ts";
import { maree } from "../../commun/src/route-pont.ts";
import type { Propositions } from "./interaction.ts";

/** Entre deux lignes de guidage, au moins ce temps (ms) : on a le temps de lire la première. */
export const ECART_LIGNES_MS = 2500;

/** Le péage de chaque halte. */
const PASSAGE_DU_LIEU: Partial<Record<LieuId, Passage>> = { route_pont: "pont", corniche: "tunnel" };

/** Dire une ligne : une pensée (en italique) ou une voix. */
export type Dire = (texte: string, genre: GenreGuidage) => void;

export class Guidage {
  private readonly dire: Dire;
  /** Le lieu de la visite en cours (null : pas encore arrivé). */
  private lieu: LieuId | null = null;
  /** Les déclencheurs déjà joués pendant cette visite. */
  private readonly joues = new Set<string>();
  /** Depuis quand (ms) on est à l'endroit d'un déclencheur qui demande d'y rester (P-02, P-08). */
  private readonly depuis = new Map<string, number>();
  /** Les lignes qui attendent leur tour, et l'instant de la dernière dite. */
  private readonly file: { texte: string; genre: GenreGuidage }[] = [];
  private derniere = -Infinity;
  /** Arrivé du côté du lieu (le retour, V2-01). */
  private retour = false;
  /** Ce que le serveur a dit : le passage de chaque péage, l'hôtel, le phare. */
  private readonly ouvert: Record<Passage, boolean> = { pont: false, tunnel: false };
  private hotel: EtatHotel | null = null;
  private phare: EtatPhareVu | null = null;

  constructor(dire: Dire) {
    this.dire = dire;
  }

  // ---------- Ce que dit le serveur ----------

  /** Un message du serveur : on regarde, on ne prend rien (main.ts le traite ensuite comme avant). */
  recevoir(m: MessageServeur): void {
    switch (m.t) {
      case "bienvenue":
        // Une arrivée : une nouvelle visite, tout se rejoue.
        this.lieu = m.lieu;
        this.joues.clear();
        this.depuis.clear();
        this.file.length = 0;
        this.retour = arriveeDuCoteDuLieu(m.lieu, m.position.x, m.position.z);
        return;
      case "passage":
        this.ouvert[m.passage] = m.ouvert;
        return;
      case "hotel":
        this.hotel = m.hotel;
        return;
      case "phare": {
        const avant = this.phare;
        this.phare = m.etat;
        if (this.lieu !== "phare") return;
        // L'allumage : la lanterne s'allume pendant qu'on est là (pas une lanterne déjà allumée à l'arrivée).
        if (avant && !avant.lanterne && m.etat.lanterne) this.evenement("allumage");
        if (m.cargo) this.evenement("cargo");
        return;
      }
    }
  }

  /** Un événement du lieu (l'allumage, le cargo) : ses lignes, une fois par visite. */
  private evenement(e: EvenementGuidage): void {
    for (const d of DECLENCHEURS) if (d.lieu === this.lieu && d.evenement === e) this.jouer(d);
  }

  // ---------- À chaque image ----------

  /** Ce que voient les conditions, à cet instant. */
  private etat(instant: number, debutMonde: number, inventaire: Readonly<Inventaire>): EtatGuidage {
    const passage = this.lieu ? PASSAGE_DU_LIEU[this.lieu] : undefined;
    return {
      maree: maree(instant, debutMonde),
      ouvert: passage ? this.ouvert[passage] : false,
      retour: this.retour,
      hotel: this.hotel,
      phare: this.phare,
      inventaire,
    };
  }

  /**
   * Les déclencheurs du lieu où l'on est : à l'endroit, la condition vraie (et, s'il le faut, assez longtemps), on dit
   * leurs lignes, une fois par visite. `instant`, `debutMonde` : ms, à l'heure du serveur (la marée).
   */
  suivre(lieu: LieuId, p: { x: number; z: number } | null, instant: number, debutMonde: number, inventaire: Readonly<Inventaire>): void {
    if (p && lieu === this.lieu) {
      const e = this.etat(instant, debutMonde, inventaire);
      for (const d of DECLENCHEURS) {
        if (d.lieu !== lieu || this.joues.has(d.id) || d.evenement) continue;
        if (!aLEndroit(d, p.x, p.z) || (d.si && !d.si(e))) {
          this.depuis.delete(d.id);
          continue;
        }
        if (d.attente) {
          const debut = this.depuis.get(d.id) ?? instant;
          this.depuis.set(d.id, debut);
          if (instant - debut < d.attente) continue;
        }
        this.jouer(d);
      }
    }
    // Les lignes en attente, une à la fois.
    if (this.file.length > 0 && instant - this.derniere >= ECART_LIGNES_MS) {
      const l = this.file.shift()!;
      this.derniere = instant;
      this.dire(l.texte, l.genre);
    }
  }

  /** Les lignes d'un déclencheur partent dans la file ; il ne rejouera pas pendant cette visite. */
  private jouer(d: Declencheur): void {
    if (this.joues.has(d.id)) return;
    this.joues.add(d.id);
    this.file.push(...d.lignes);
  }

  // ---------- Agir ----------

  /**
   * Près d'un écriteau, B propose « Lire » : s'il est au moins aussi près que ce que le lieu propose déjà (comme la
   * caisse et la porte du péage). A reste ce qu'il était ; sans A, le cercle se pose sur l'écriteau.
   */
  proposer(lieu: LieuId, p: { x: number; z: number } | null, base: Propositions): Propositions {
    if (!p) return base;
    const e = ecriteauProche(lieu, p.x, p.z);
    if (!e) return base;
    const dBase = base.cible ? Math.max(0, Math.hypot(base.cible.x - p.x, base.cible.z - p.z) - (base.cible.rayon ?? 0.5)) : Infinity;
    if (e.distance > dBase + 0.3) return base;
    return {
      A: base.A,
      B: { libelle: "Lire", examiner: e.ecriteau.texte, lire: true },
      cible: base.A ? base.cible : { x: e.point.x, z: e.point.z, rayon: e.ecriteau.rayon },
    };
  }

  /** Pour les tests : les déclencheurs déjà joués pendant cette visite. */
  get dejaJoues(): ReadonlySet<string> {
    return this.joues;
  }
}
