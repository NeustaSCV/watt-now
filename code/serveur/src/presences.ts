// Les présences : dans un lieu public, chacun voit les autres joueurs proches (Book 01 §2 bis).
// Pour ménager le débit (Book 17 §5.2, mesuré le 2026-10-08) :
// - l'identité d'un joueur (pseudo, famille, apparence, lumière) n'est envoyée que quand elle change, ou quand il
//   entre dans le champ (message « autres ») ;
// - sa position part 10 fois par seconde, en quelques nombres (message « positions »), et seulement si elle a changé
//   depuis le dernier envoi à cet observateur (un joueur immobile ne coûte plus rien, 2026-10-08) ;
// - 0.9 (plan 0.9 §3.4) : la position part avec l'heure du serveur et l'allure, à cadence fixe (un tour sur deux), pour
//   que le client montre l'autre avec un léger retard, en ligne droite entre deux positions reçues ; ses gestes (frappe,
//   esquive, action…) partent au même tour, aux mêmes observateurs (message « gestes »), chacun une fois ;
// - on ne voit que les joueurs à moins de RAYON_INTERET mètres (on les oublie au-delà de RAYON_OUBLI) ;
// - et, dans un lieu à murs, seulement ceux qu'on voit (0.7.2 : la boutique de la halte ; commun/src/vue.ts) : chacun
//   sa vue, on ne lit pas à travers les murs dans les messages.

import type { AllureVue, AutreVu, GesteVu, MessageServeur } from "../../commun/src/messages.ts";

export const RAYON_INTERET = 40;
export const RAYON_OUBLI = 45;
/**
 * Les présences partent un tour de serveur sur deux (20 tours par seconde : toutes les 100 ms exactement). Avant la 0.9,
 * elles partaient au premier tour où 100 ms étaient écoulées : 100 ou 150 ms selon les tours, d'où les à-coups.
 */
export const TOURS_PRESENCES = 2;
/** Au plus tant de gestes gardés par joueur entre deux envois (un client qui martèle n'inonde pas ses voisins). */
export const GESTES_MAX = 8;

/** Ce tour de serveur (compté depuis le démarrage) envoie-t-il les présences ? */
export function tourDePresences(tour: number): boolean {
  return tour % TOURS_PRESENCES === 0;
}

export interface Observateur {
  id: number;
  /** Le lieu public où il se trouve (null : sur son terrain ou en route : il ne voit personne). */
  lieu: string | null;
  vu: AutreVu;
  /** Son allure, envoyée avec sa position (absente : immobile). */
  allure?: AllureVue;
  /** Ses gestes depuis l'envoi précédent (absente : aucun) : la diffusion les envoie, puis vide la file. */
  gestes?: GesteVu[];
  envoyer(m: MessageServeur): void;
}

/** Ce qu'on retient de ce que chacun a déjà reçu : pour chaque observateur, l'identité envoyée de chaque joueur vu. */
export type MemoirePresences = Map<number, Map<number, string>>;
/** Et la dernière position envoyée de chaque joueur vu (« x,z,o,allure »). */
const positionsEnvoyees = new WeakMap<MemoirePresences, Map<number, Map<number, string>>>();

function cleIdentite(a: AutreVu): string {
  return `${a.pseudo}|${a.famille}|${a.lumiere ? 1 : 0}|${a.dos ?? ""}|${JSON.stringify(a.apparence)}`;
}

const clePosition = (o: Observateur, allure: AllureVue = o.allure ?? 0) => `${o.vu.x},${o.vu.z},${o.vu.o},${allure}`;

/** La vue passe-t-elle de a à b dans ce lieu ? (sans : à ciel ouvert) */
export type VueDuLieu = (lieu: string, a: { x: number; z: number }, b: { x: number; z: number }) => boolean;

/** Une diffusion : à appeler 10 fois par seconde (`tourDePresences`). `heure` : l'heure du serveur (ms) de cet envoi. */
export function diffuserPresences(observateurs: Observateur[], memoire: MemoirePresences, vueDuLieu?: VueDuLieu, heure = Date.now()): void {
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
  const parId = new Map(observateurs.map((o) => [o.id, o]));

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
    // Celui qui vient de quitter le lieu (effondré, parti en route) : ses derniers gestes partent à ceux qui le voyaient,
    // avant la liste qui le retire (on le voit tomber).
    const partis: GesteVu[] = [];
    if (moi.lieu)
      for (const id of avant.keys()) {
        const o = parId.get(id);
        if (o && o.lieu !== moi.lieu && o.gestes?.length) partis.push(...o.gestes);
      }
    if (partis.length > 0) moi.envoyer({ t: "gestes", g: partis });
    if (change) {
      moi.envoyer({ t: "autres", joueurs: voisins.map((o) => o.vu) });
      memoire.set(moi.id, maintenant);
      // « autres » porte déjà les positions : on repart de là, l'allure à 0 tant qu'un « positions » ne l'a pas dite.
      dejaVues.clear();
      for (const o of voisins) dejaVues.set(o.id, clePosition(o, 0));
    }
    // Les positions : id, x, z, orientation, allure, à la suite ; seulement celles qui ont changé.
    const p: number[] = [];
    for (const o of voisins) {
      const cle = clePosition(o);
      if (dejaVues.get(o.id) === cle) continue;
      dejaVues.set(o.id, cle);
      p.push(o.id, o.vu.x, o.vu.z, o.vu.o, o.allure ?? 0);
    }
    if (p.length > 0) moi.envoyer({ t: "positions", h: heure, p });
    // Les gestes de ceux qu'il voit, après leurs positions (et leur identité s'ils entrent dans le champ).
    const g: GesteVu[] = [];
    for (const o of voisins) if (o.gestes?.length) g.push(...o.gestes);
    if (g.length > 0) moi.envoyer({ t: "gestes", g });
  }
  // Chaque geste ne part qu'une fois : la file est vidée, même si personne ne l'a vu.
  for (const o of observateurs) if (o.gestes?.length) o.gestes.length = 0;
}
