// Les présences : dans un lieu public, chacun voit les autres joueurs proches (Book 01 §2 bis).
// Pour ménager le débit (Book 17 §5.2, mesuré le 2026-10-08) :
// - l'identité d'un joueur (pseudo, famille, apparence, lumière) n'est envoyée que quand elle change, ou quand il
//   entre dans le champ (message « autres ») ;
// - sa position part 10 fois par seconde, en quelques nombres (message « positions »), et seulement si elle a changé
//   depuis le dernier envoi à cet observateur (un joueur immobile ne coûte plus rien, 2026-10-08) ;
// - on ne voit que les joueurs à moins de RAYON_INTERET mètres (on les oublie au-delà de RAYON_OUBLI) ;
// - et, dans un lieu à murs, seulement ceux qu'on voit (0.7.2 : la boutique de la halte ; commun/src/vue.ts) : chacun
//   sa vue, on ne lit pas à travers les murs dans les messages.

import type { AutreVu, MessageServeur } from "../../commun/src/messages.ts";

export const RAYON_INTERET = 40;
export const RAYON_OUBLI = 45;

export interface Observateur {
  id: number;
  /** Le lieu public où il se trouve (null : sur son terrain ou en route : il ne voit personne). */
  lieu: string | null;
  vu: AutreVu;
  envoyer(m: MessageServeur): void;
}

/** Ce qu'on retient de ce que chacun a déjà reçu : pour chaque observateur, l'identité envoyée de chaque joueur vu. */
export type MemoirePresences = Map<number, Map<number, string>>;
/** Et la dernière position envoyée de chaque joueur vu (« x,z,o »). */
const positionsEnvoyees = new WeakMap<MemoirePresences, Map<number, Map<number, string>>>();

function cleIdentite(a: AutreVu): string {
  return `${a.pseudo}|${a.famille}|${a.lumiere ? 1 : 0}|${JSON.stringify(a.apparence)}`;
}

/** La vue passe-t-elle de a à b dans ce lieu ? (sans : à ciel ouvert) */
export type VueDuLieu = (lieu: string, a: { x: number; z: number }, b: { x: number; z: number }) => boolean;

/** Une diffusion : à appeler 10 fois par seconde. */
export function diffuserPresences(observateurs: Observateur[], memoire: MemoirePresences, vueDuLieu?: VueDuLieu): void {
  const parLieu = new Map<string, Observateur[]>();
  for (const o of observateurs) {
    if (!o.lieu) continue;
    const liste = parLieu.get(o.lieu) ?? [];
    liste.push(o);
    parLieu.set(o.lieu, liste);
  }
  const presents = new Set(observateurs.map((o) => o.id));
  for (const id of memoire.keys()) if (!presents.has(id)) memoire.delete(id);
  let positions = positionsEnvoyees.get(memoire);
  if (!positions) positionsEnvoyees.set(memoire, (positions = new Map()));
  for (const id of positions.keys()) if (!presents.has(id)) positions.delete(id);
  // L'identité de chacun, calculée une fois (et non une fois par voisin) : c'était le premier coût du serveur.
  const cles = new Map(observateurs.map((o) => [o.id, cleIdentite(o.vu)]));

  for (const moi of observateurs) {
    const avant = memoire.get(moi.id) ?? new Map<number, string>();
    const voisins = moi.lieu
      ? (parLieu.get(moi.lieu) ?? []).filter((o) => {
          if (o === moi) return false;
          const d = Math.hypot(o.vu.x - moi.vu.x, o.vu.z - moi.vu.z);
          // Une marge entre entrer et sortir du champ : pas de va-et-vient à la limite.
          if (d > (avant.has(o.id) ? RAYON_OUBLI : RAYON_INTERET)) return false;
          return !vueDuLieu || vueDuLieu(moi.lieu!, moi.vu, o.vu);
        })
      : [];
    // L'identité : seulement si quelqu'un entre ou sort du champ, ou si elle a changé.
    const maintenant = new Map(voisins.map((o) => [o.id, cles.get(o.id)!]));
    let change = maintenant.size !== avant.size;
    if (!change) for (const [id, cle] of maintenant) if (avant.get(id) !== cle) change = true;
    let dejaVues = positions.get(moi.id);
    if (!dejaVues) positions.set(moi.id, (dejaVues = new Map()));
    if (change) {
      moi.envoyer({ t: "autres", joueurs: voisins.map((o) => o.vu) });
      memoire.set(moi.id, maintenant);
      // « autres » porte déjà les positions : on repart de là.
      dejaVues.clear();
      for (const o of voisins) dejaVues.set(o.id, `${o.vu.x},${o.vu.z},${o.vu.o}`);
      // (0.7.2 : on passe à l'observateur suivant ; un « return » ici privait tous les suivants de leur envoi.)
      continue;
    }
    // Les positions : id, x, z, orientation, à la suite ; seulement celles qui ont changé.
    const p: number[] = [];
    for (const o of voisins) {
      const cle = `${o.vu.x},${o.vu.z},${o.vu.o}`;
      if (dejaVues.get(o.id) === cle) continue;
      dejaVues.set(o.id, cle);
      p.push(o.id, o.vu.x, o.vu.z, o.vu.o);
    }
    if (p.length > 0) moi.envoyer({ t: "positions", p });
  }
}
