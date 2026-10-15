// Les sons du phare du cap (plan 0.10, chantier K), synthétisés comme les autres effets (recettes.ts) : la corne de brume
// (S-16, un leurre qu'on entend de tout le cap), et l'arrivée du cargo (S-17) : sa corne grave, puis le choc de la coque
// sur les rochers de la crique. Aucun effet CC0 livré n'y ressemble : on les fabrique.

import type { DefSon } from "./catalogue.ts";
import { FE, Piste, enveloppe, filtrer, metal, oscillateur, points, saturer, souffle } from "./dsp.ts";
import type { Recette } from "./recettes.ts";

const n = (s: number) => Math.round(s * FE);

/**
 * La corne de brume : un diaphone, deux tons graves et rauques (le « bee-oh » des phares), l'air qui siffle au départ,
 * 4,5 s. On l'entend de très loin.
 */
const corneBrume: Recette = (h) => {
  const d = 4.5;
  const p = new Piste(d, h);
  const ton = (f0: number, f1: number, debut: number, duree: number, gain: number) => {
    const s = oscillateur(n(duree), (t) => (t < duree * 0.75 ? f0 : f0 + (f1 - f0) * ((t - duree * 0.75) / (duree * 0.25))) * (1 + (h() - 0.5) * 0.003), "scie");
    const grave = filtrer(s, "passe-bas", 700, 0.9);
    p.ajouter(enveloppe(grave, points([0, 0], [0.12, 1], [duree - 0.35, 0.9], [duree, 0])), debut, gain);
  };
  ton(185, 185, 0, 2.6, 0.55);
  ton(150, 120, 2.4, 2.0, 0.6);
  // Le souffle de l'air comprimé, au départ de chaque ton.
  p.ajouter(souffle(0.5, h, { filtre: "passe-bande", f: 1600, q: 1.5, env: points([0, 0], [0.05, 1], [0.5, 0]) }), 0, 0.12);
  p.ajouter(souffle(0.5, h, { filtre: "passe-bande", f: 1400, q: 1.5, env: points([0, 0], [0.05, 1], [0.5, 0]) }), 2.4, 0.1);
  return saturer(p.donnees, 1.4);
};

/** La corne du cargo : un seul ton, très grave et très long (un porte-conteneurs perdu dans la nuit), 5 s. */
const corneCargo: Recette = (h) => {
  const d = 5.2;
  const p = new Piste(d, h);
  for (const [f, a] of [
    [73, 0.55],
    [146, 0.3],
    [219, 0.12],
  ] as const) {
    const s = oscillateur(n(5), (t) => f * (1 - 0.01 * (t / 5)) * (1 + (h() - 0.5) * 0.002), "scie");
    p.ajouter(enveloppe(filtrer(s, "passe-bas", 500, 0.8), points([0, 0], [0.4, 1], [4.3, 0.85], [5, 0])), 0.1, a);
  }
  return saturer(p.donnees, 1.2);
};

/** Le cargo touche : la coque d'acier qui racle et cède sur les rochers, un grondement sourd, 3,5 s. */
const chocCargo: Recette = (h) => {
  const d = 3.6;
  const p = new Piste(d, h);
  // Le grondement de la coque qui s'échoue.
  p.ajouter(souffle(3.4, h, { bruit: "brun", filtre: "passe-bas", f: 140, env: points([0, 0], [0.08, 1], [1.2, 0.7], [3.4, 0]) }), 0, 1);
  // Les tôles qui se froissent : des chocs métalliques graves, de plus en plus espacés.
  let t = 0.05;
  for (let i = 0; i < 7; i++) {
    p.ajouter(metal(h, 180 + h() * 160, 0.18 + h() * 0.2, 1.2, 0.4), t, 0.5 - i * 0.05);
    t += 0.12 + i * 0.08 + h() * 0.1;
  }
  return saturer(p.donnees, 1.6);
};

/** Les sons du phare, ajoutés au catalogue (catalogue.ts). */
export const SONS_PHARE = {
  corne_brume: { recette: corneBrume, bus: "environnement", priorite: 2, variantes: 1, gain: 0.75, portee: 60 },
  // La corne grave du cargo : un vrai paquebot (Kinoton, CC0) quand son fichier est là (son/audio.ts, EFFETS_DU_JEU) ; sinon, celle-ci.
  corne_cargo: { recette: corneCargo, bus: "environnement", priorite: 2, variantes: 1, gain: 0.8, portee: 0 },
  choc_cargo: { recette: chocCargo, bus: "environnement", priorite: 2, variantes: 1, gain: 0.8, portee: 0 },
} satisfies Record<string, DefSon>;
