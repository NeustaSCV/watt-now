// Le temps qu'il fait (Book 13, Book 21 §3.6) : en 0a, beau temps et pluie seulement, à l'horloge d'action.
// Une météo commune à tout le serveur : client et serveur la calculent pareil à partir de l'heure du monde.
// Une chaîne d'états avec de la persistance (une averse a des chances de durer), tirée de façon déterministe.

import type { GenreStimulus } from "./signature.ts";

export type Temps = "soleil" | "voile" | "couvert" | "pluie";

/** Le temps change par tranches de 3 heures de jeu (3 minutes réelles). */
export const DUREE_TRANCHE_MS = 3 * 60_000;

/**
 * Printemps (Book 13 §3 : pluie fréquente, giboulées) : probabilités de passer d'un temps à l'autre.
 * Lignes : temps actuel ; colonnes : soleil, voilé, couvert, pluie.
 */
const TRANSITIONS: Record<Temps, [number, number, number, number]> = {
  soleil: [0.6, 0.25, 0.1, 0.05],
  voile: [0.3, 0.35, 0.25, 0.1],
  couvert: [0.1, 0.25, 0.35, 0.3],
  pluie: [0.05, 0.1, 0.35, 0.5],
};
const ORDRE: Temps[] = ["soleil", "voile", "couvert", "pluie"];

/**
 * La part de chaque temps sur la durée (plan 0.10, V1-02) : la distribution stationnaire de la chaîne ci-dessus (≈ 27 %
 * de soleil, 24 % de voilé, 26 % de couvert, 23 % de pluie). Le banc solaire et le moulin de jerricans s'y calent, pour
 * donner en moyenne ce qu'on a voulu.
 */
export const PARTS_DU_TEMPS: Readonly<Record<Temps, number>> = (() => {
  let p = [1, 0, 0, 0];
  for (let k = 0; k < 500; k++) {
    const q = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) q[j] = q[j]! + p[i]! * TRANSITIONS[ORDRE[i]!][j]!;
    p = q;
  }
  return { soleil: p[0]!, voile: p[1]!, couvert: p[2]!, pluie: p[3]! };
})();

/** Un tirage stable pour une tranche donnée. */
function tirage(tranche: number): number {
  let x = (tranche * 2654435761) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x45d9f3b) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

const memoire: Temps[] = ["soleil"];

/** Le temps d'une tranche (la tranche 0 commence au début du monde). */
export function tempsDeLaTranche(tranche: number): Temps {
  if (tranche < 0) return "soleil";
  while (memoire.length <= tranche) {
    const avant = memoire[memoire.length - 1]!;
    const r = tirage(memoire.length);
    const p = TRANSITIONS[avant];
    let cumul = 0;
    let suivant: Temps = avant;
    for (let i = 0; i < 4; i++) {
      cumul += p[i]!;
      if (r < cumul) {
        suivant = ORDRE[i]!;
        break;
      }
    }
    memoire.push(suivant);
  }
  return memoire[tranche]!;
}

export interface Meteo {
  temps: Temps;
  /** Force de la pluie, de 0 à 1, avec un fondu aux changements de tranche (pour l'image et le son). */
  pluie: number;
  /** Assombrissement du ciel, de 0 à 1. */
  nuages: number;
}

const NUAGES: Record<Temps, number> = { soleil: 0, voile: 0.3, couvert: 0.65, pluie: 0.85 };

export function meteo(instant: number, debutMonde: number): Meteo {
  const t = Math.max(0, instant - debutMonde) / DUREE_TRANCHE_MS;
  const tranche = Math.floor(t);
  const actuel = tempsDeLaTranche(tranche);
  const suivant = tempsDeLaTranche(tranche + 1);
  // Les 15 dernières % de la tranche glissent vers la suivante.
  const f = Math.max(0, (t - tranche - 0.85) / 0.15);
  const pluie = (actuel === "pluie" ? 1 : 0) * (1 - f) + (suivant === "pluie" ? 1 : 0) * f;
  const nuages = NUAGES[actuel] * (1 - f) + NUAGES[suivant] * f;
  return { temps: actuel, pluie, nuages };
}

/** Ce que recueille un récupérateur de pluie (P-002) : ≈ 0,5 L par minute réelle de pluie, jusqu'à 5 L. */
export const PLUIE_LITRES_PAR_MINUTE = 0.5;
export const RECUPERATEUR_MAX_L = 5;

/** Les litres recueillis entre deux instants (au plus `max`) : on suit la météo, minute après minute. */
export function pluieRecueillie(depuis: number, jusqua: number, debutMonde: number, max = RECUPERATEUR_MAX_L): number {
  // Une très longue absence : la bassine est pleine bien avant ; on ne regarde que la dernière semaine.
  const debut = Math.max(depuis, jusqua - 7 * 86_400_000);
  const pas = 20_000;
  let litres = 0;
  for (let t = debut; t < jusqua && litres < max; t += pas) {
    const d = Math.min(pas, jusqua - t);
    litres += (meteo(t + d / 2, debutMonde).pluie * PLUIE_LITRES_PAR_MINUTE * d) / 60_000;
  }
  return Math.min(max, litres);
}

/** La pluie est une alliée (Book 06 §3.2, Book 13 §4) : bruits −30 %, odeurs −50 %. */
export function attenuationMeteo(m: Meteo, genre: GenreStimulus): number {
  if (genre === "son") return 1 - 0.3 * m.pluie;
  if (genre === "odeur") return 1 - 0.5 * m.pluie;
  return 1;
}

export const NOMS_TEMPS: Record<Temps, string> = { soleil: "Ensoleillé", voile: "Voilé", couvert: "Couvert", pluie: "Pluie" };

// ---------- Le vent (plan 0.10, chantier D ; N2-Q4) ----------
// Il n'est pas dans la météo : on le déduit du temps. Couvert et pluie : il vente ; voilé : un peu ; soleil : calme.

export type Vent = "calme" | "faible" | "fort";

const VENTS: Record<Temps, Vent> = { soleil: "calme", voile: "faible", couvert: "fort", pluie: "fort" };

/** Le vent qu'il fait, déduit du temps (la météo d'un instant, ou un temps). */
export function vent(m: Meteo | Temps): Vent {
  return VENTS[typeof m === "string" ? m : m.temps];
}
