// Le guidage du joueur au niveau 2 (0.10 ; décision du porteur du 2026-10-14, .claude-travail/guidage-0.10.md) : les
// données, partagées par l'écran (client/src/guidage.ts, qui les déclenche) et par les tests.
//
// - G-1, la voix et les pensées à l'approche : pour chaque lieu, des déclencheurs (un ou plusieurs points et un rayon,
//   dans le repère du jeu, ou une pièce ; une condition sur l'état du lieu si besoin ; parfois une attente : rester là
//   tant de secondes) et leur texte. Chacun se dit **une seule fois par visite** du lieu ; rien n'est gardé en base : une
//   nouvelle visite les rejoue. La pensée du personnage s'affiche en italique ; une voix, entre guillemets.
// - G-2, les écriteaux lisibles : près de l'écriteau, B propose « Lire », et le texte peint dans le modèle s'affiche en
//   grand, dans un message (jamais une fenêtre, jamais une croix). Les places sont prises dans les modèles de la session
//   « bâtiments » (batiment/<lieu>/modele.js) ou dans les données déjà extraites (commun/src/*-modele.ts).
//
// Les textes sont ceux que le porteur a validés, mot pour mot. Les voix du péage sont dans commun/src/peage.ts
// (TEXTES_PEAGE : `approche`, `attente`, et `dejaPaye` pour le retour). L'échelle de marée du quai (E-03) se lisait
// déjà (« Lire l'échelle de marée », client/src/rendu/route-pont.ts) : elle n'est pas reprise ici.
//
// Ce fichier n'importe des autres modules du jeu que des positions, des états et des textes.

import { aLaCorniche, BARRICADE, PIN_TOMBE, RUBAN } from "./corniche.ts";
import { ASCENSEUR, BALCON, BORNE, CARTE, PANNEAU, borneAlimentee, jeuHotel, niveauHotel, pieceHotel, type EtatHotel, type PieceHotel } from "./hotel.ts";
import { destinations, entreesDe, type LieuId } from "./lieux.ts";
import type { Inventaire } from "./objets.ts";
import { TEXTES_PEAGE } from "./peage.ts";
import { ECRITEAU_SENTIER, ENDROITS_PHARE, jeu as auPhare, piecePhare, surLaGreve, type EtatPhareVu } from "./phare.ts";
import { auPont, ECHELLE_MAREE, PORTE_PEAGE, type EtatMaree } from "./route-pont.ts";

/** Une pensée du personnage (en italique) ou une voix (le texte porte ses guillemets). */
export type GenreGuidage = "pensee" | "voix";

/** Une ligne de guidage : son texte, et comment on l'affiche. */
export interface LigneGuidage {
  texte: string;
  genre: GenreGuidage;
}

/** Ce que les conditions voient : l'état du lieu tel que l'écran le connaît. */
export interface EtatGuidage {
  /** La marée de la route du pont (la même pour tous). */
  maree: EtatMaree;
  /** Le passage du péage de ce lieu est ouvert pour soi (payé dans l'heure, ou sur le retour). */
  ouvert: boolean;
  /** On est arrivé dans la halte du côté du lieu (le Grand Hôtel, le phare) : on rentre chez soi (V2-01). */
  retour: boolean;
  /** Le check-in de l'hôtel (null : pas encore reçu). */
  hotel: EtatHotel | null;
  /** Le phare (null : pas encore reçu). */
  phare: EtatPhareVu | null;
  /** Ce qu'on porte (la carte de la chambre 7). */
  inventaire: Readonly<Inventaire>;
}

/** Un point du jeu. */
export interface Point {
  x: number;
  z: number;
}

/** Ce qui arrive au phare, sans qu'on bouge : la lanterne qu'on allume, le cargo qui arrive. */
export type EvenementGuidage = "allumage" | "cargo";

/** Un déclencheur de G-1. */
export interface Declencheur {
  /** Le numéro de la décision (P-01…). */
  id: string;
  lieu: LieuId;
  /** Où : près d'un de ces points (à `rayon` mètres au plus)… */
  points?: readonly Point[];
  rayon?: number;
  /**
   * … et (ou seulement) dans cet endroit : une pièce, un niveau (pas à travers un mur) ; ni points ni endroit : partout
   * dans le lieu (« à l'arrivée »).
   */
  dans?: (x: number, z: number) => boolean;
  /** Ou sur un événement du lieu, où qu'on soit. */
  evenement?: EvenementGuidage;
  /** La condition sur l'état du lieu. */
  si?: (e: EtatGuidage) => boolean;
  /** Il faut y rester tant de millisecondes, sans interruption (P-02, P-08 : 20 s devant la porte fermée). */
  attente?: number;
  lignes: readonly LigneGuidage[];
}

/** Un écriteau de G-2 : B y propose « Lire ». */
export interface Ecriteau {
  /** Le numéro de la décision (E-01…). */
  id: string;
  lieu: LieuId;
  /** Les places de l'écriteau (un panneau routier peut être posé deux fois) et son rayon (sa demi-largeur). */
  points: readonly Point[];
  rayon: number;
  /** On le lit seulement d'ici (sa pièce : pas à travers un mur). */
  dans?: (x: number, z: number) => boolean;
  /** Ce qui s'affiche quand on le lit. */
  texte: string;
}

/** On lit un écriteau jusqu'à cette distance de son bord (comme l'on parle à la borne, PORTEE_HOTEL). */
export const PORTEE_ECRITEAU = 2;

/** Les péages : on dit l'approche à 8 m de la porte ; on attend 20 s, à 5 m au plus, avant la seconde voix. */
const APPROCHE_PEAGE = 8;
const DEVANT_PEAGE = 5;
const ATTENTE_PEAGE = 20_000;

const pensee = (texte: string): LigneGuidage => ({ texte, genre: "pensee" });
const voix = (texte: string): LigneGuidage => ({ texte, genre: "voix" });

/** La porte du péage du pont, et la barricade du tunnel (leur milieu, dans le repère du jeu). */
const CHICANE: Point = { x: PORTE_PEAGE.x, z: PORTE_PEAGE.z };
const BARRICADE_TUNNEL: Point = { x: BARRICADE.x, z: BARRICADE.z };

/** Dans telle pièce du phare, de l'hôtel (on ne pense pas à ce qu'on ne voit pas, à travers un mur). */
const auPhareDans = (piece: string) => (x: number, z: number) => piecePhare(x, z) === piece;
const aLHotelDans = (piece: PieceHotel) => (x: number, z: number) => pieceHotel(x, z) === piece;

/** La condition des voix du péage : à l'aller, sans avoir payé. */
const allerSansPayer = (e: EtatGuidage) => !e.ouvert && !e.retour;

export const DECLENCHEURS: readonly Declencheur[] = [
  // ---------- La route du pont ----------
  { id: "P-01", lieu: "route_pont", points: [CHICANE], rayon: APPROCHE_PEAGE, si: allerSansPayer, lignes: [voix(TEXTES_PEAGE.pont.approche)] },
  { id: "P-02", lieu: "route_pont", points: [CHICANE], rayon: DEVANT_PEAGE, si: allerSansPayer, attente: ATTENTE_PEAGE, lignes: [voix(TEXTES_PEAGE.pont.attente)] },
  { id: "P-03", lieu: "route_pont", points: [CHICANE], rayon: APPROCHE_PEAGE, si: (e) => e.retour, lignes: [voix(TEXTES_PEAGE.pont.dejaPaye)] },
  // Les deux bords de la brèche (FICHE.goulets : x = 5 ; les panneaux « UN À LA FOIS ! » à x = 1,6 et 8,4).
  { id: "P-04", lieu: "route_pont", points: [auPont(1.6, -4.75), auPont(8.4, -4.75)], rayon: 3, lignes: [pensee("Des planches au-dessus du vide. Allons-y doucement.")] },
  { id: "P-05", lieu: "route_pont", points: [ECHELLE_MAREE], rayon: 6, si: (e) => e.maree === "haute", lignes: [pensee("La mer est haute. À marée basse, la vase doit se découvrir.")] },
  { id: "P-06", lieu: "route_pont", points: [ECHELLE_MAREE], rayon: 6, si: (e) => e.maree === "basse", lignes: [pensee("La vase est découverte : des caddies, des trottinettes… de quoi récupérer.")] },

  // ---------- La corniche ----------
  { id: "P-07", lieu: "corniche", points: [BARRICADE_TUNNEL], rayon: APPROCHE_PEAGE, si: allerSansPayer, lignes: [voix(TEXTES_PEAGE.tunnel.approche)] },
  { id: "P-08", lieu: "corniche", points: [BARRICADE_TUNNEL], rayon: DEVANT_PEAGE, si: allerSansPayer, attente: ATTENTE_PEAGE, lignes: [voix(TEXTES_PEAGE.tunnel.attente)] },
  { id: "P-09", lieu: "corniche", points: [PIN_TOMBE], rayon: 10, lignes: [pensee("Un pin d'Alep couché en travers de la route. De quoi faire du bois.")] },
  // Les deux bouts du ruban (FICHE.goulets : z = − 3,6), d'où qu'on vienne.
  { id: "P-10", lieu: "corniche", points: [{ x: RUBAN.x0, z: aLaCorniche(0, -3.6).z }, { x: RUBAN.x1, z: aLaCorniche(0, -3.6).z }], rayon: 5, lignes: [pensee("La route s'est effondrée. Il reste un ruban le long de la paroi.")] },

  // ---------- Le Grand Hôtel ----------
  { id: "P-11", lieu: "grand_hotel", dans: aLHotelDans("hall"), lignes: [pensee("Le grand escalier s'est effondré. Il reste l'ascenseur à grille…")] },
  { id: "P-12", lieu: "grand_hotel", points: [ASCENSEUR.bas.grille], rayon: 2.5, dans: aLHotelDans("hall"), si: (e) => !((e.inventaire[CARTE] ?? 0) > 0), lignes: [pensee("Un lecteur de carte. Sans carte de chambre, il ne bougera pas.")] },
  { id: "P-13", lieu: "grand_hotel", points: [BORNE], rayon: 2.5, dans: aLHotelDans("hall"), si: (e) => e.hotel !== null && !borneAlimentee(e.hotel), lignes: [pensee("Une borne « Check-in par sourire ». Écran noir : pas de courant.")] },
  { id: "P-14", lieu: "grand_hotel", points: [PANNEAU], rayon: 4, si: (e) => e.hotel?.batterie === "panneau", lignes: [pensee("Une batterie au pied du panneau. Elle pèse, mais elle doit encore tenir la charge.")] },
  {
    id: "P-15",
    lieu: "grand_hotel",
    points: [BORNE],
    rayon: 2.5,
    dans: aLHotelDans("hall"),
    si: (e) => e.hotel !== null && borneAlimentee(e.hotel) && e.hotel.tete !== "borne" && e.hotel.tete !== "bras",
    lignes: [voix("La borne : « Sourire non reconnu. Veuillez sourire davantage. »"), pensee("Elle ne reconnaît que le personnel, on dirait.")],
  },
  { id: "P-16", lieu: "grand_hotel", dans: aLHotelDans("salle_a_manger"), lignes: [pensee("Un robot-serveur, enfoui jusqu'au cou dans le sable. Il sourit encore.")] },
  { id: "P-17", lieu: "grand_hotel", dans: (x, z) => niveauHotel(x, z) === "etage", lignes: [pensee("L'étage. Les chambres, la suite, la lingerie… et pas d'autre ascenseur pour redescendre que celui-là.")] },
  { id: "P-18", lieu: "grand_hotel", points: [{ x: BALCON.boite.x, z: BALCON.boite.z }], rayon: 2.5, lignes: [pensee("Le balcon s'est écroulé sur la dune. On pourrait sauter, mais pas remonter.")] },

  // ---------- Le phare ----------
  { id: "P-19", lieu: "phare", si: (e) => e.phare?.lanterne !== true, lignes: [pensee("Le phare du Cap. La lanterne est éteinte depuis longtemps.")] },
  // Au pied de l'escalier coupé (la marque à la craie), tant que l'escabeau n'y est pas (ni dans les bras).
  { id: "P-20", lieu: "phare", points: [ENDROITS_PHARE.marque], rayon: 2.5, dans: auPhareDans("tour"), si: (e) => e.phare !== null && e.phare.escabeau !== "marque" && e.phare.escabeau !== "bras", lignes: [pensee("L'escalier s'arrête net à trois mètres. Il faudrait de quoi grimper.")] },
  { id: "P-21", lieu: "phare", points: [ENDROITS_PHARE.prisme], rayon: 6, si: (e) => e.phare?.prisme === "tombe", lignes: [pensee("Quelque chose brille dans l'herbe, au pied de la tour.")] },
  { id: "P-22", lieu: "phare", points: [ENDROITS_PHARE.cuve], rayon: 3, dans: auPhareDans("tour"), lignes: [pensee("Une cuve de pétrole, avec sa pompe. Ça sent encore.")] },
  // P-23 (« Le feu ne sert qu'à la nuit tombée. ») est déjà en jeu : le message du serveur, fermé par son bouton.
  { id: "P-24", lieu: "phare", evenement: "allumage", lignes: [pensee("La lumière balaie la lande. Au loin, des silhouettes se mettent en marche.")] },
  { id: "P-25", lieu: "phare", points: [ENDROITS_PHARE.compresseur], rayon: 3, dans: auPhareDans("corne"), si: (e) => e.phare !== null && !e.phare.compresseur, lignes: [pensee("Le compresseur de la corne de brume. Il a l'air de pouvoir repartir.")] },
  { id: "P-26", lieu: "phare", evenement: "cargo", lignes: [pensee("Une corne grave, au large. Un cargo… droit sur les rochers !")] },
  // En haut de la rampe du canot, au sortir du hangar (la rampe descend de z = 12,6 ; le tronçon effondré est à 19).
  { id: "P-27", lieu: "phare", points: [auPhare(-24, 13.2)], rayon: 2.5, lignes: [pensee("La rampe s'est effondrée à mi-pente. En sautant, on atteint la grève, mais on ne remonte pas.")] },
  // En arrivant sur les galets de la crique (essai sur l'iPhone, 2026-10-15 : rien ne montrait par où l'on ressort).
  { id: "P-28", lieu: "phare", dans: surLaGreve, lignes: [pensee("Le sentier côtier remonte par les rochers, à l'ouest.")] },
];

/**
 * Les écriteaux lisibles. Les places, prises dans les modèles :
 * - E-01 : le panneau des survivants, sur les poteaux de la porte du péage (halte-route-pont, `barricade`) ;
 * - E-02 : l'écran du portique « connecté », au-dessus de la route (x = − 61,6) ;
 * - E-04 : le panneau routier à double face, aux deux bouts de la corniche (x = ± 96,5, au bord nord de la chaussée) ;
 * - E-05 : le grand panneau de la corniche, sur ses deux poteaux (x = − 68, z = − 5) ;
 * - E-06 : la borne du hall (BORNE) ; E-07 : le panneau « Séjour Zéro-Effort », devant sa face, à côté du coffret de la
 *   batterie (repère H du modèle : (25,6 ; 20,4), tourné de 45° ; le lot est centré en H (− 1 ; 5)) ; E-08 : le panneau
 *   de la piscine (H : (3 ; 8,65)) ;
 * - E-09 : le journal de bord, sur la table du gardien ; E-10 : la planche peinte des survivants, contre la tour, près
 *   de la porte ; E-11 : la plaque, sur le pilier de la grille sud ;
 * - E-12 : le panneau du sentier côtier (le texte de celui du modèle, qui est sur le plateau, au bord du chemin des
 *   douaniers), planté par le jeu à la sortie de la grève, à l'ouest (ECRITEAU_SENTIER ; client/src/rendu/phare.ts).
 */
export const ECRITEAUX: readonly Ecriteau[] = [
  { id: "E-01", lieu: "route_pont", points: [CHICANE], rayon: 0.9, texte: "« PÉAGE · 12 WOTTS / TÊTE · DANS LA CAISSE ↓ · UN À LA FOIS ! »" },
  { id: "E-02", lieu: "route_pont", points: [auPont(-61.6, 0)], rayon: 3, texte: "« PONT CONNECTÉ · votre passage est optimisé en temps réel · trafic : 0 véhicule · attente : 0 min »" },
  { id: "E-04", lieu: "corniche", points: [aLaCorniche(-96.5, 0.03), aLaCorniche(96.5, -2.76)], rayon: 1.5, texte: "« Cap du Phare · Port de pêche → »" },
  { id: "E-05", lieu: "corniche", points: [aLaCorniche(-68, -5)], rayon: 3.6, texte: "« CORNICHE PANORAMIQUE · VUE CERTIFIÉE 5 ÉTOILES · Selfie-points tous les 200 m »" },
  { id: "E-06", lieu: "grand_hotel", points: [BORNE], rayon: 0.6, dans: aLHotelDans("hall"), texte: "« CHECK-IN PAR SOURIRE »" },
  { id: "E-07", lieu: "grand_hotel", points: [jeuHotel(26.89, 16.53)], rayon: 0.8, texte: "« SÉJOUR ZÉRO-EFFORT · On respire pour vous. · Repas mâchés · Bronzage par abonnement »" },
  { id: "E-08", lieu: "grand_hotel", points: [jeuHotel(4.0, 3.65)], rayon: 0.6, texte: "« Baignade interdite aux chiens ET AUX ÉTEINTS »" },
  { id: "E-09", lieu: "phare", points: [auPhare(-2.45, -6.45)], rayon: 1, dans: auPhareDans("cuisine"), texte: "« Journal de bord · Rallumé quand même. »" },
  { id: "E-10", lieu: "phare", points: [auPhare(-7.78, -1.92)], rayon: 0.8, texte: "« ÉTEINS LA LANTERNE ! ILS VOIENT LA LUMIÈRE »" },
  { id: "E-11", lieu: "phare", points: [auPhare(0.7, 1.86)], rayon: 0.4, texte: "« PHARE DU CAP · allumé en 1883 »" },
  { id: "E-12", lieu: "phare", points: [ECRITEAU_SENTIER], rayon: 0.9, texte: "« Sentier côtier · ← Port · 6 km »" },
];

/**
 * Arrive-t-on dans cette halte du côté du lieu (le Grand Hôtel, le phare), c'est-à-dire sur le retour ? Comme le serveur
 * (serveur/src/peage.ts, `vientDuLieu`) : l'entrée la plus proche du point d'arrivée ne mène pas au terrain.
 */
export function arriveeDuCoteDuLieu(lieu: LieuId, x: number, z: number): boolean {
  if (lieu !== "route_pont" && lieu !== "corniche") return false;
  const entrees = entreesDe(lieu);
  if (entrees.length === 0) return false;
  const proche = entrees.reduce((a, b) => (Math.hypot(b.arrivee.x - x, b.arrivee.z - z) < Math.hypot(a.arrivee.x - x, a.arrivee.z - z) ? b : a));
  return !destinations(proche).includes("terrain");
}

/** Est-on à l'endroit de ce déclencheur (sans regarder la condition) ? */
export function aLEndroit(d: Declencheur, x: number, z: number): boolean {
  if (d.evenement) return false;
  if (d.points && !d.points.some((p) => Math.hypot(p.x - x, p.z - z) <= (d.rayon ?? 0))) return false;
  return d.dans ? d.dans(x, z) : true;
}

/** La distance au bord de l'écriteau le plus proche de ce lieu, et lequel (null : aucun à portée). */
export function ecriteauProche(lieu: LieuId, x: number, z: number): { ecriteau: Ecriteau; point: Point; distance: number } | null {
  let meilleur: { ecriteau: Ecriteau; point: Point; distance: number } | null = null;
  for (const e of ECRITEAUX) {
    if (e.lieu !== lieu || (e.dans && !e.dans(x, z))) continue;
    for (const p of e.points) {
      const d = Math.max(0, Math.hypot(p.x - x, p.z - z) - e.rayon);
      if (d <= PORTEE_ECRITEAU && (!meilleur || d < meilleur.distance)) meilleur = { ecriteau: e, point: p, distance: d };
    }
  }
  return meilleur;
}
