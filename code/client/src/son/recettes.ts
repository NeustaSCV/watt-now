// Les recettes des effets sonores de la 0a (Book 21 §6.3) : chaque recette fabrique une variante à partir du hasard
// qu'on lui donne. Les sons sont courts, secs, lisibles : ce sont des informations de jeu, pas de la décoration.

import {
  FE,
  Piste,
  bois,
  bruitBlanc,
  cloche,
  enveloppe,
  filtrer,
  grains,
  metal,
  modes,
  oscillateur,
  percussive,
  piece,
  points,
  rale,
  saturer,
  souffle,
  sourd,
} from "./dsp.ts";

export type Hasard = () => number;
export type Recette = (h: Hasard) => Float32Array;

const n = (s: number) => Math.round(s * FE);
const entre = (h: Hasard, a: number, b: number) => a + (b - a) * h();

// =====================================================================================
// Les pas du joueur : 4 sols × 3 allures (Book 21 §6.3)
// =====================================================================================

export type Sol = "herbe" | "terre" | "beton" | "gravats";
export type AllurePas = "discrete" | "marche" | "course";

const FORCE_PAS: Record<AllurePas, { force: number; duree: number; aigu: number }> = {
  discrete: { force: 0.45, duree: 0.85, aigu: 0.6 },
  marche: { force: 0.8, duree: 1, aigu: 1 },
  course: { force: 1, duree: 0.8, aigu: 1.25 },
};

export function pas(sol: Sol, allure: AllurePas): Recette {
  const a = FORCE_PAS[allure];
  return (h) => {
    const p = new Piste(0.32 * a.duree + 0.06, h);
    // Le talon puis la plante : deux contacts rapprochés.
    const ecart = entre(h, 0.035, 0.06) * a.duree;
    if (sol === "herbe") {
      p.ajouter(sourd(110, 60, 0.02), 0, 0.35 * a.force);
      for (const t of [0, ecart]) {
        p.ajouter(grains(0.14 * a.duree, h, (x) => 900 * Math.exp(-x * 18), { f: [1800 * a.aigu, 6500], q: 1.5, longueur: [0.002, 0.006], amplitude: [0.15, 0.6] }), t, a.force);
      }
      p.ajouter(souffle(0.12, h, { bruit: "rose", filtre: "passe-bande", f: 2600 * a.aigu, q: 0.8, env: percussive(0.01, 0.03) }), 0.005, 0.35 * a.force);
    } else if (sol === "terre") {
      p.ajouter(sourd(95, 50, 0.03), 0, 0.8 * a.force);
      p.ajouter(sourd(80, 45, 0.025), ecart, 0.5 * a.force);
      p.ajouter(souffle(0.16, h, { bruit: "rose", filtre: "passe-bas", f: 900 * a.aigu, env: percussive(0.006, 0.04) }), 0, 0.6 * a.force);
      p.ajouter(grains(0.1, h, 150, { f: [700, 2200], longueur: [0.002, 0.005], amplitude: [0.1, 0.35] }), ecart, 0.6 * a.force);
    } else if (sol === "beton") {
      // Le talon claque, la semelle frotte.
      p.ajouter(enveloppe(filtrer(bruitBlanc(n(0.03), h), "passe-bande", entre(h, 1400, 2200) * a.aigu, 1.6), percussive(0.0005, 0.006)), 0, a.force);
      p.ajouter(sourd(140, 70, 0.012), 0, 0.5 * a.force);
      p.ajouter(souffle(0.1 * a.duree, h, { filtre: "passe-bande", f: 3800 * a.aigu, q: 0.9, env: percussive(0.01, 0.025) }), ecart, 0.45 * a.force);
      return piece(p.donnees, 0.012, 0.3, 0.15);
    } else {
      // Gravats et verre : des éclats qui crissent, un tesson qui tinte parfois.
      p.ajouter(sourd(100, 55, 0.02), 0, 0.5 * a.force);
      for (const t of [0, ecart]) {
        p.ajouter(grains(0.16 * a.duree, h, (x) => 1400 * Math.exp(-x * 14), { f: [1200, 7000], q: 3, longueur: [0.001, 0.004], amplitude: [0.2, 1] }), t, a.force);
      }
      if (h() < 0.55) p.ajouter(metal(h, entre(h, 3200, 5200), 0.02, 0.12, 0.6), entre(h, 0.02, 0.08), 0.25 * a.force);
    }
    return p.donnees;
  };
}

// =====================================================================================
// Les Éteints (priorité 1) : respiration, râles, pas traînants, craquements
// =====================================================================================

/** Les voyelles fermées et sombres des râles (formants en Hz). */
const VOYELLES: [number, number, number][] = [
  [380, 820, 2400], // « o » fermé
  [520, 950, 2450], // « ɔ »
  [330, 700, 2300], // « ou »
  [460, 1250, 2500], // « eu »
  [600, 1100, 2550], // « a » sombre
  [420, 1000, 2350],
];

export const eteintSouffle: Recette = (h) => {
  // Le Dormant : une respiration lente, mouillée, qui accroche à l'expiration. Il faut tendre l'oreille.
  const d = entre(h, 2.4, 3.2);
  const p = new Piste(d, h);
  const inspi = entre(h, 0.8, 1.1);
  p.ajouter(souffle(inspi, h, { bruit: "rose", filtre: "passe-bande", f: (t) => 700 + 300 * (t / inspi), q: 1.3, env: cloche(inspi) }), 0, 0.5);
  const expi = entre(h, 1.1, 1.5);
  const debut = inspi + entre(h, 0.15, 0.3);
  p.ajouter(souffle(expi, h, { bruit: "rose", filtre: "passe-bande", f: (t) => 600 - 150 * (t / expi), q: 1.1, env: points([0, 0], [0.12, 1], [expi * 0.6, 0.6], [expi, 0]) }), debut, 0.6);
  p.ajouter(rale(expi, h, { f0: () => entre(h, 38, 48), formants: VOYELLES[2]!, rauque: 0.6, env: points([0, 0], [0.2, 0.5], [expi * 0.7, 0.3], [expi, 0]) }), debut, 0.35);
  return p.donnees;
};

export const eteintMachoire: Recette = (h) => {
  // Un craquement de mâchoire : deux ou trois claquements d'os, secs.
  const p = new Piste(0.3, h);
  const nb = 2 + Math.floor(h() * 2);
  for (let i = 0; i < nb; i++) p.ajouter(bois(h, entre(h, 700, 1100), 0.08, 2), i * entre(h, 0.03, 0.07), entre(h, 0.5, 1));
  return p.donnees;
};

/** Un râle d'Errant : long, traînant, la hauteur qui retombe. */
export const eteintRale: Recette = (h) => {
  const d = entre(h, 1.3, 2.3);
  const f0 = entre(h, 58, 78);
  const p = new Piste(d + 0.3, h);
  p.ajouter(
    rale(d, h, {
      f0: (t) => f0 * (1 + 0.15 * Math.sin(Math.PI * Math.min(1, t / (d * 0.4)))) * (1 - 0.25 * (t / d)),
      formants: VOYELLES[Math.floor(h() * VOYELLES.length)]!,
      rauque: entre(h, 0.3, 0.55),
      env: points([0, 0], [0.18, 0.8], [d * 0.35, 1], [d * 0.8, 0.55], [d, 0]),
    }),
    0,
  );
  // Un peu d'air autour : le souffle qui porte le râle.
  p.ajouter(souffle(d, h, { bruit: "rose", filtre: "passe-bande", f: 900, q: 0.8, env: cloche(d) }), 0, 0.12);
  return saturer(p.donnees, 1.6);
};

/** L'Attiré : le râle se coupe net. Puis plus rien… le pire. */
export const eteintRaleCoupe: Recette = (h) => {
  const d = entre(h, 0.35, 0.55);
  const f0 = entre(h, 62, 80);
  const p = new Piste(d + 0.25, h);
  p.ajouter(
    rale(d, h, {
      f0: (t) => f0 * (1 + 0.1 * (t / d)),
      formants: VOYELLES[Math.floor(h() * VOYELLES.length)]!,
      rauque: 0.4,
      // Coupure franche : 8 ms de chute, pas plus.
      env: points([0, 0], [0.08, 1], [d - 0.008, 1], [d, 0]),
    }),
    0,
  );
  // La glotte qui se ferme : un petit clic sec.
  p.ajouter(bois(h, entre(h, 900, 1300), 0.05, 3), d, 0.35);
  return saturer(p.donnees, 1.8);
};

/** La tête qui craque en se tournant vers le bruit. */
export const eteintTeteCraque: Recette = (h) => {
  const p = new Piste(0.45, h);
  const nb = 3 + Math.floor(h() * 3);
  let t = 0;
  for (let i = 0; i < nb; i++) {
    p.ajouter(enveloppe(filtrer(bruitBlanc(n(0.012), h), "passe-bande", entre(h, 1400, 3000), 4), percussive(0.0003, 0.002)), t, entre(h, 0.5, 1));
    t += entre(h, 0.02, 0.07);
  }
  p.ajouter(bois(h, entre(h, 500, 700), 0.1, 1.5), t, 0.4);
  return p.donnees;
};

/** Un pas d'Éteint qui traîne : le pied ne se lève pas, il racle. */
export const eteintPas: Recette = (h) => {
  const d = entre(h, 0.35, 0.5);
  const p = new Piste(d + 0.05, h);
  p.ajouter(sourd(85, 45, 0.035), 0, 0.7);
  p.ajouter(souffle(d, h, { bruit: "rose", filtre: "passe-bande", f: (t) => 1200 - 500 * (t / d), q: 0.9, env: points([0, 0], [0.03, 1], [d * 0.6, 0.5], [d, 0]) }), 0.01, 0.6);
  p.ajouter(grains(d * 0.8, h, 120, { f: [800, 3000], longueur: [0.002, 0.004], amplitude: [0.1, 0.4] }), 0.02, 0.5);
  return p.donnees;
};

/** Les pas pressés du Poursuivant : lourds, rapprochés, sans grâce. */
export const eteintPasPresse: Recette = (h) => {
  const p = new Piste(0.25, h);
  p.ajouter(sourd(100, 48, 0.03), 0, 1);
  p.ajouter(souffle(0.15, h, { bruit: "rose", filtre: "passe-bas", f: 1500, env: percussive(0.004, 0.035) }), 0, 0.6);
  p.ajouter(grains(0.1, h, 300, { f: [900, 3500], longueur: [0.001, 0.004], amplitude: [0.2, 0.6] }), 0.005, 0.5);
  return p.donnees;
};

/** Les râles rapprochés du Poursuivant : courts, plus hauts, plus rauques. */
export const eteintRaleRapide: Recette = (h) => {
  const d = entre(h, 0.45, 0.85);
  const f0 = entre(h, 80, 115);
  const p = new Piste(d + 0.15, h);
  p.ajouter(
    rale(d, h, {
      f0: (t) => f0 * (1 + 0.2 * Math.sin((Math.PI * t) / d)),
      formants: VOYELLES[Math.floor(h() * VOYELLES.length)]!,
      rauque: entre(h, 0.5, 0.8),
      env: points([0, 0], [0.05, 1], [d * 0.7, 0.8], [d, 0]),
    }),
    0,
  );
  return saturer(p.donnees, 2.2);
};

/** Le souffle court du Poursuivant (entre deux râles). */
export const eteintHalete: Recette = (h) => {
  const p = new Piste(0.9, h);
  for (let i = 0; i < 3; i++) {
    const d = entre(h, 0.12, 0.18);
    p.ajouter(souffle(d, h, { bruit: "rose", filtre: "passe-bande", f: entre(h, 700, 1100), q: 1.5, env: cloche(d) }), i * 0.28 + entre(h, 0, 0.03), i % 2 ? 0.6 : 1);
  }
  return p.donnees;
};

// =====================================================================================
// Le contact et le combat
// =====================================================================================

/** Tissu agrippé, tiré : un froissement serré, nerveux. */
function froissement(h: Hasard, d: number, f = 2500, densite = 500): Float32Array {
  const s = grains(d, h, (t) => densite * (0.4 + 0.6 * Math.abs(Math.sin(t * 23 + h() * 0.1))), { f: [f * 0.5, f * 2], q: 0.8, longueur: [0.003, 0.012], amplitude: [0.1, 0.8] });
  const lit = souffle(d, h, { bruit: "rose", filtre: "passe-bande", f, q: 0.6, env: cloche(d) });
  for (let i = 0; i < s.length; i++) s[i]! += lit[i]! * 0.3;
  return s;
}

export const saisie: Recette = (h) => {
  // Une main qui attrape : le choc mou, puis le tissu qui se tend.
  const p = new Piste(0.7, h);
  p.ajouter(sourd(120, 60, 0.03), 0, 0.9);
  p.ajouter(froissement(h, 0.45, 2000, 700), 0.01, 1);
  p.ajouter(souffle(0.3, h, { bruit: "rose", filtre: "passe-bande", f: 800, q: 1.2, env: percussive(0.02, 0.08) }), 0.05, 0.4);
  return p.donnees;
};

export const morsureManquee: Recette = (h) => {
  // Les dents qui claquent dans le vide, tout près.
  const p = new Piste(0.35, h);
  p.ajouter(souffle(0.15, h, { bruit: "rose", filtre: "passe-bande", f: 900, q: 1, env: cloche(0.15) }), 0, 0.4);
  p.ajouter(bois(h, entre(h, 1500, 2000), 0.06, 3), 0.13, 1);
  p.ajouter(bois(h, entre(h, 1700, 2200), 0.05, 3), 0.13 + entre(h, 0.01, 0.02), 0.6);
  return p.donnees;
};

export const morsure: Recette = (h) => {
  // Une morsure : le tissu qui cède, puis la chair. Court, sans complaisance.
  const p = new Piste(0.7, h);
  p.ajouter(froissement(h, 0.12, 2500, 900), 0, 0.6);
  p.ajouter(grains(0.2, h, (t) => 1500 * Math.exp(-t * 15), { f: [600, 2500], q: 1.2, longueur: [0.003, 0.01], amplitude: [0.3, 1] }), 0.08, 1);
  p.ajouter(souffle(0.25, h, { bruit: "brun", filtre: "passe-bas", f: 700, env: percussive(0.005, 0.06) }), 0.08, 0.8);
  p.ajouter(sourd(90, 50, 0.04), 0.08, 0.7);
  return saturer(p.donnees, 1.5);
};

/** Le coup porté à un Éteint : un choc sourd, épais. `force` > 1 : coup appuyé. */
export function impact(force: number): Recette {
  return (h) => {
    const p = new Piste(0.45, h);
    p.ajouter(sourd(entre(h, 110, 140), 50, 0.04 * force), 0, 1);
    p.ajouter(souffle(0.12, h, { bruit: "rose", filtre: "passe-bas", f: 1800, env: percussive(0.001, 0.02) }), 0, 0.7);
    p.ajouter(grains(0.08, h, 800, { f: [700, 2400], longueur: [0.002, 0.006], amplitude: [0.2, 0.7] }), 0.002, 0.4 * force);
    return saturer(p.donnees, 1.4 + force * 0.3);
  };
}

export const coupTete: Recette = (h) => {
  // Le coup qui détruit : l'os qui cède. Un craquement bref et un choc.
  const p = new Piste(0.6, h);
  p.ajouter(sourd(130, 45, 0.05), 0, 1);
  p.ajouter(grains(0.09, h, (t) => 3000 * Math.exp(-t * 30), { f: [900, 4000], q: 2.5, longueur: [0.001, 0.004], amplitude: [0.3, 1] }), 0.003, 0.9);
  p.ajouter(bois(h, entre(h, 380, 480), 0.15, 1.2), 0.004, 0.6);
  return saturer(p.donnees, 1.8);
};

export const chuteCorps: Recette = (h) => {
  // Un corps qui tombe : deux chocs mous (les genoux, puis le reste) et le tissu.
  const p = new Piste(0.9, h);
  p.ajouter(sourd(90, 40, 0.06), 0, 0.7);
  p.ajouter(sourd(75, 35, 0.09), entre(h, 0.12, 0.2), 1);
  p.ajouter(froissement(h, 0.3, 1600, 400), 0.1, 0.5);
  p.ajouter(grains(0.25, h, 150, { f: [700, 2500], longueur: [0.002, 0.005], amplitude: [0.1, 0.4] }), 0.2, 0.4);
  return p.donnees;
};

/** L'arme qui fend l'air. */
export function sifflement(lourd: boolean): Recette {
  return (h) => {
    const d = lourd ? entre(h, 0.3, 0.38) : entre(h, 0.18, 0.24);
    const p = new Piste(d + 0.05, h);
    const f0 = lourd ? 450 : 700;
    const f1 = lourd ? 1800 : 2800;
    p.ajouter(souffle(d, h, { bruit: "rose", filtre: "passe-bande", f: (t) => f0 + (f1 - f0) * Math.sin((Math.PI * t) / d), q: 2.2, env: cloche(d) }), 0);
    return p.donnees;
  };
}

export const esquive: Recette = (h) => {
  const p = new Piste(0.45, h);
  p.ajouter(sifflement(false)(h), 0, 0.6);
  p.ajouter(pas("terre", "course")(h), 0.05, 0.7);
  p.ajouter(pas("terre", "course")(h), 0.22, 0.5);
  return p.donnees;
};

export const degagement: Recette = (h) => {
  // On se débat : le tissu qui se déchire presque, un coup de coude.
  const p = new Piste(0.35, h);
  p.ajouter(froissement(h, 0.25, 2200, 900), 0, 1);
  p.ajouter(sourd(110, 55, 0.025), entre(h, 0.03, 0.1), 0.6);
  return p.donnees;
};

/** Le cœur, quand on s'effondre ou qu'on saigne fort. */
export const coeur: Recette = (h) => {
  const p = new Piste(0.9, h);
  p.ajouter(sourd(65, 38, 0.06), 0, 1);
  p.ajouter(sourd(58, 35, 0.05), entre(h, 0.2, 0.26), 0.7);
  for (let i = 0; i < p.donnees.length; i++) p.donnees[i] = p.donnees[i]!;
  return filtrer(p.donnees, "passe-bas", 180);
};

export const effondrement: Recette = (h) => {
  const p = new Piste(2.4, h);
  p.ajouter(chuteCorps(h), 0, 1);
  p.ajouter(coeur(h), 0.8, 0.8);
  p.ajouter(coeur(h), 1.6, 0.5);
  return p.donnees;
};

// =====================================================================================
// Les gestes et les outils (priorité 2)
// =====================================================================================

export const gesteBois: Recette = (h) => {
  // Ramasser du bois : deux branches qui s'entrechoquent, un peu de feuilles.
  const p = new Piste(0.5, h);
  p.ajouter(bois(h, entre(h, 280, 420), 0.2, 0.9), 0, 1);
  p.ajouter(bois(h, entre(h, 350, 520), 0.15, 1.2), entre(h, 0.07, 0.14), 0.6);
  p.ajouter(froissement(h, 0.3, 3500, 300), 0, 0.25);
  return p.donnees;
};

export const gestePierre: Recette = (h) => {
  // Deux pierres : un claquement dur, mat, très court.
  const p = new Piste(0.35, h);
  const choc = () =>
    modes(0.08, [
      { f: entre(h, 1700, 2600), a: 1, tau: 0.006 },
      { f: entre(h, 3200, 4600), a: 0.6, tau: 0.004 },
      { f: entre(h, 900, 1200), a: 0.5, tau: 0.008 },
    ]);
  p.ajouter(choc(), 0, 1);
  p.ajouter(grains(0.15, h, 120, { f: [800, 2500], amplitude: [0.1, 0.3] }), 0.01, 0.6);
  if (h() < 0.7) p.ajouter(choc(), entre(h, 0.08, 0.16), 0.5);
  return p.donnees;
};

export const gesteFeuillage: Recette = (h) => {
  const p = new Piste(0.8, h);
  p.ajouter(froissement(h, 0.6, 3800, 600), 0, 1);
  p.ajouter(bois(h, entre(h, 500, 800), 0.06, 2), entre(h, 0.2, 0.4), 0.2);
  return p.donnees;
};

export const fouille: Recette = (h) => {
  // Fouiller : on écarte, on soulève, une boîte de conserve qui roule.
  const p = new Piste(1.2, h);
  p.ajouter(froissement(h, 0.8, 1800, 250), 0, 0.7);
  let t = entre(h, 0.05, 0.2);
  for (let i = 0; i < 3; i++) {
    if (h() < 0.4) p.ajouter(metal(h, entre(h, 900, 1600), 0.03, 0.2, 0.5), t, entre(h, 0.2, 0.4));
    else p.ajouter(bois(h, entre(h, 250, 600), 0.12), t, entre(h, 0.3, 0.6));
    t += entre(h, 0.15, 0.35);
  }
  return piece(p.donnees, 0.02, 0.3, 0.15);
};

export const demonter: Recette = (h) => {
  // Une clé à cliquet : des clics serrés, puis l'écrou qui grince.
  const p = new Piste(1, h);
  const nb = 5 + Math.floor(h() * 4);
  const periode = entre(h, 0.05, 0.08);
  for (let i = 0; i < nb; i++) p.ajouter(metal(h, entre(h, 2600, 3200), 0.008, 0.05, 0.4), i * periode, 0.6);
  const d = entre(h, 0.25, 0.4);
  const grince = enveloppe(filtrer(oscillateur(n(d), (t) => entre(h, 900, 950) + 120 * Math.sin(t * 40), "scie"), "passe-bande", 1800, 3), cloche(d));
  p.ajouter(grince, nb * periode + 0.05, 0.12);
  p.ajouter(metal(h, entre(h, 600, 900), 0.06, 0.3, 0.5), nb * periode + d + 0.08, 0.4);
  return p.donnees;
};

export const visser: Recette = (h) => {
  const p = new Piste(0.9, h);
  for (let tour = 0; tour < 3; tour++) {
    const t0 = tour * 0.28;
    const d = 0.18;
    p.ajouter(enveloppe(filtrer(bruitBlanc(n(d), h), "passe-bande", (t) => 2500 + 800 * (t / d), 4), cloche(d)), t0, 0.5);
    p.ajouter(metal(h, entre(h, 2200, 2800), 0.006, 0.04, 0.3), t0 + d, 0.4);
  }
  return p.donnees;
};

/** Le marteau sur le bois (établi, abri) : un coup mat qui résonne dans la planche. */
export const marteauBois: Recette = (h) => {
  const p = new Piste(0.4, h);
  p.ajouter(bois(h, entre(h, 180, 260), 0.3, 0.6), 0, 1);
  p.ajouter(metal(h, entre(h, 1800, 2200), 0.01, 0.06, 0.3), 0, 0.25);
  p.ajouter(sourd(120, 60, 0.02), 0, 0.5);
  return piece(p.donnees, 0.015, 0.35, 0.2);
};

/** Le marteau sur le métal. */
export const marteauMetal: Recette = (h) => {
  const p = new Piste(0.8, h);
  p.ajouter(metal(h, entre(h, 700, 950), 0.12, 0.7, 0.7), 0, 1);
  p.ajouter(sourd(150, 80, 0.015), 0, 0.5);
  return p.donnees;
};

/** L'enclume (le ressort à lames) : un son clair, long, qui porte à 40 m. */
export const enclume: Recette = (h) => {
  const p = new Piste(1.6, h);
  p.ajouter(metal(h, entre(h, 1050, 1250), 0.45, 1.5, 0.9), 0, 1);
  p.ajouter(metal(h, entre(h, 2600, 2900), 0.2, 1, 0.5), 0, 0.35);
  p.ajouter(sourd(160, 90, 0.015), 0, 0.4);
  return p.donnees;
};

export const scie: Recette = (h) => {
  // Deux allers-retours de scie.
  const p = new Piste(1.2, h);
  for (let i = 0; i < 4; i++) {
    const d = entre(h, 0.24, 0.3);
    const aller = i % 2 === 0;
    p.ajouter(
      enveloppe(
        filtrer(grains(d, h, 1200, { f: [1800, 5000], q: 1.5, longueur: [0.001, 0.003] }), "passe-bande", aller ? 3200 : 2600, 0.8),
        cloche(d),
      ),
      i * 0.29,
      aller ? 1 : 0.7,
    );
  }
  return p.donnees;
};

export const hacheCoupe: Recette = (h) => {
  // La hache entre dans le bois : un choc, une fente qui craque.
  const p = new Piste(0.5, h);
  p.ajouter(sifflement(true)(h), 0, 0.3);
  p.ajouter(bois(h, entre(h, 220, 300), 0.3, 0.7), 0.18, 1);
  p.ajouter(sourd(110, 55, 0.03), 0.18, 0.6);
  p.ajouter(grains(0.12, h, (t) => 900 * Math.exp(-t * 20), { f: [1200, 4000], longueur: [0.001, 0.003] }), 0.19, 0.6);
  return p.donnees;
};

export const aiguiser: Recette = (h) => {
  // La lame sur la pierre : deux passes longues et sifflantes.
  const p = new Piste(1, h);
  for (let i = 0; i < 2; i++) {
    const d = entre(h, 0.32, 0.4);
    p.ajouter(souffle(d, h, { filtre: "passe-bande", f: (t) => 4200 + 1200 * (t / d), q: 3, env: cloche(d) }), i * 0.48, 1);
  }
  return p.donnees;
};

export const tissu: Recette = (h) => {
  // Du tissu qu'on déchire en bandes (pansements).
  const p = new Piste(0.8, h);
  const d = entre(h, 0.35, 0.5);
  p.ajouter(grains(d, h, 2500, { f: [1500, 5000], q: 1, longueur: [0.001, 0.003], amplitude: [0.2, 1] }), 0.05, 1);
  p.ajouter(froissement(h, 0.3, 2000, 300), d + 0.05, 0.5);
  return p.donnees;
};

export const bache: Recette = (h) => {
  // La bâche qu'on déplie et qui claque.
  const p = new Piste(1, h);
  const d = 0.8;
  p.ajouter(souffle(d, h, { bruit: "rose", filtre: "passe-bande", f: 900, q: 0.7, env: (t) => cloche(d)(t) * (0.5 + 0.5 * Math.abs(Math.sin(t * 28))) }), 0, 0.8);
  p.ajouter(souffle(0.08, h, { filtre: "passe-bande", f: 1600, q: 0.8, env: percussive(0.002, 0.02) }), entre(h, 0.5, 0.7), 1);
  return p.donnees;
};

export const remplirEau: Recette = (h) => {
  // La gourde qui se remplit : des glouglous qui montent.
  const p = new Piste(4, h);
  let t = 0;
  while (t < 3.8) {
    const d = entre(h, 0.02, 0.05);
    const f = entre(h, 300, 700) * (1 + t * 0.12);
    p.ajouter(enveloppe(oscillateur(n(d), (x) => f * (1 + 6 * x)), cloche(d)), t, entre(h, 0.3, 1));
    t += entre(h, 0.03, 0.12);
  }
  p.ajouter(souffle(4, h, { bruit: "rose", filtre: "passe-bande", f: 1200, q: 0.6 }), 0, 0.12);
  return p.boucler(0.5);
};

export const bouillir: Recette = (h) => {
  // L'eau qui frémit dans la gourde, sur le feu.
  const p = new Piste(4, h);
  p.ajouter(grains(4, h, 60, { f: [400, 1400], q: 6, longueur: [0.01, 0.03], amplitude: [0.2, 1] }), 0, 0.8);
  p.ajouter(souffle(4, h, { filtre: "passe-bande", f: 3000, q: 0.5 }), 0, 0.08);
  return p.boucler(0.5);
};

export const manger: Recette = (h) => {
  const p = new Piste(1.6, h);
  for (let i = 0; i < 4; i++) {
    p.ajouter(grains(0.12, h, 1500, { f: [700, 2500], q: 1.2, longueur: [0.002, 0.006], amplitude: [0.2, 0.8] }), i * entre(h, 0.32, 0.4), 0.7);
  }
  return filtrer(p.donnees, "passe-bas", 3500);
};

export const boire: Recette = (h) => {
  const p = new Piste(1.6, h);
  for (let i = 0; i < 3; i++) {
    const t = i * entre(h, 0.42, 0.5);
    p.ajouter(enveloppe(oscillateur(n(0.09), (x) => 180 + 500 * x), cloche(0.09)), t, 0.7);
    p.ajouter(souffle(0.07, h, { bruit: "rose", filtre: "passe-bas", f: 600, env: cloche(0.07) }), t + 0.02, 0.4);
  }
  return p.donnees;
};

export const briquet: Recette = (h) => {
  // La molette, l'étincelle, la flamme qui prend.
  const p = new Piste(1, h);
  p.ajouter(grains(0.06, h, 3000, { f: [3000, 8000], q: 2, longueur: [0.0005, 0.002] }), 0, 0.8);
  p.ajouter(metal(h, entre(h, 3000, 3600), 0.006, 0.04, 0.5), 0.06, 0.5);
  p.ajouter(souffle(0.6, h, { bruit: "rose", filtre: "passe-bande", f: (t) => 500 + 900 * t, q: 0.6, env: points([0, 0], [0.05, 1], [0.6, 0]) }), 0.08, 0.7);
  return p.donnees;
};

export const pierreAFeu: Recette = (h) => {
  // Le briquet de silex : des frottements secs, des étincelles qui grésillent.
  const p = new Piste(1.1, h);
  for (let i = 0; i < 3; i++) {
    const t = i * entre(h, 0.25, 0.32);
    p.ajouter(souffle(0.06, h, { filtre: "passe-bande", f: 5000, q: 1.5, env: percussive(0.002, 0.015) }), t, 0.8);
    p.ajouter(grains(0.1, h, 900, { f: [4000, 9000], q: 3, longueur: [0.0005, 0.0015] }), t + 0.01, 0.5);
  }
  return p.donnees;
};

export const bucheTombe: Recette = (h) => {
  // Une bûche qu'on pose sur le feu : le choc du bois, les braises qui crépitent.
  const p = new Piste(1, h);
  p.ajouter(bois(h, entre(h, 160, 230), 0.3, 0.6), 0, 1);
  p.ajouter(sourd(100, 50, 0.03), 0, 0.5);
  p.ajouter(grains(0.8, h, (t) => 120 * Math.exp(-t * 3), { f: [1500, 6000], q: 2, longueur: [0.0008, 0.003], amplitude: [0.2, 1] }), 0.03, 0.6);
  return p.donnees;
};

export const extinction: Recette = (h) => {
  // Le feu qui s'éteint : un dernier souffle, un sifflement de cendres.
  const p = new Piste(1.6, h);
  p.ajouter(souffle(1.5, h, { filtre: "passe-haut", f: 2500, env: points([0, 0], [0.05, 1], [1.5, 0]) }), 0, 0.6);
  p.ajouter(grains(1, h, (t) => 60 * Math.exp(-t * 2), { f: [1500, 5000], amplitude: [0.1, 0.5] }), 0, 0.5);
  return p.donnees;
};

/** Le feu qui crépite (en boucle) : craquements au hasard sur un lit de souffle. */
export const feuCrepite: Recette = (h) => {
  const d = 6;
  const p = new Piste(d, h);
  p.ajouter(souffle(d, h, { bruit: "brun", filtre: "passe-bas", f: 350 }), 0, 0.35);
  p.ajouter(souffle(d, h, { bruit: "rose", filtre: "passe-bande", f: 1200, q: 0.5, env: (t) => 0.6 + 0.4 * Math.sin(t * 2.3 + 1) * Math.sin(t * 0.7) }), 0, 0.12);
  p.ajouter(grains(d, h, 14, { f: [1200, 6000], q: 1.5, longueur: [0.0008, 0.004], amplitude: [0.2, 1] }), 0, 1);
  // De vrais « pops » de sève, plus rares.
  let t = entre(h, 0.3, 1);
  while (t < d - 0.2) {
    p.ajouter(bois(h, entre(h, 900, 1600), 0.05, 3), t, entre(h, 0.3, 0.7));
    t += entre(h, 0.6, 1.8);
  }
  return p.boucler(0.6);
};

/** Le soufflet de forge : une grande respiration de cuir, puis les braises qui ronflent. */
export const soufflet: Recette = (h) => {
  const p = new Piste(1.4, h);
  const d = entre(h, 0.7, 0.9);
  p.ajouter(souffle(d, h, { bruit: "rose", filtre: "passe-bas", f: (t) => 400 + 600 * Math.sin((Math.PI * t) / d), env: cloche(d) }), 0, 1);
  p.ajouter(bois(h, entre(h, 150, 220), 0.2, 0.7), 0, 0.3);
  p.ajouter(souffle(1, h, { bruit: "brun", filtre: "passe-bas", f: 250, env: points([0, 0], [0.3, 1], [1, 0]) }), 0.3, 0.6);
  return p.donnees;
};

/** Les braises de la forge (en boucle) : un ronflement grave. */
export const braises: Recette = (h) => {
  const d = 5;
  const p = new Piste(d, h);
  p.ajouter(souffle(d, h, { bruit: "brun", filtre: "passe-bas", f: (t) => 260 + 60 * Math.sin(t * 1.3) }), 0, 1);
  p.ajouter(grains(d, h, 8, { f: [2000, 6000], amplitude: [0.1, 0.4] }), 0, 0.5);
  return p.boucler(0.5);
};

export const trempe: Recette = (h) => {
  // Le fer chaud plongé dans l'eau : un sifflement violent, des bulles.
  const p = new Piste(1.6, h);
  p.ajouter(souffle(1.5, h, { filtre: "passe-haut", f: 3000, env: points([0, 0], [0.01, 1], [0.3, 0.6], [1.5, 0]) }), 0, 1);
  p.ajouter(grains(1.2, h, (t) => 200 * Math.exp(-t * 2), { f: [500, 1500], q: 5, longueur: [0.01, 0.03] }), 0.05, 0.6);
  return p.donnees;
};

/** La chaîne du pédalier et la roue libre (en boucle, pendant qu'on pédale). */
export const chaineVelo: Recette = (h) => {
  const d = 4;
  const p = new Piste(d, h);
  // Les maillons sur le pignon : un tic métallique régulier, très rapide.
  const cadence = entre(h, 26, 30);
  for (let t = 0; t < d; t += 1 / cadence) {
    p.ajouter(metal(h, entre(h, 3500, 4200), 0.004, 0.03, 0.3), t + entre(h, -0.002, 0.002), 0.25 + 0.1 * Math.sin(t * 6.3));
  }
  // Le pédalier qui tourne : un léger frottement cyclique (≈ 1 tour par seconde).
  p.ajouter(souffle(d, h, { bruit: "rose", filtre: "passe-bande", f: 900, q: 1, env: (t) => 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 1.1) }), 0, 0.25);
  return p.boucler(0.3);
};

export const roueLibre: Recette = (h) => {
  // On arrête de pédaler : la roue libre qui cliquette en ralentissant.
  const p = new Piste(2, h);
  let t = 0;
  let periode = 0.025;
  while (t < 1.9) {
    p.ajouter(metal(h, entre(h, 4200, 4800), 0.003, 0.02, 0.2), t, 0.5 * (1 - t / 2));
    t += periode;
    periode *= 1.06;
  }
  return p.donnees;
};

/** La meule sur le fer (en boucle) : un crissement qui tourne, des étincelles. */
export const meule: Recette = (h) => {
  const d = 4;
  const p = new Piste(d, h);
  p.ajouter(souffle(d, h, { filtre: "passe-bande", f: (t) => 3200 + 600 * Math.sin(t * 2 * Math.PI * 2.2), q: 2, env: (t) => 0.7 + 0.3 * Math.sin(t * 2 * Math.PI * 2.2) }), 0, 0.8);
  p.ajouter(grains(d, h, 250, { f: [4000, 10000], q: 3, longueur: [0.0005, 0.0015], amplitude: [0.1, 0.6] }), 0, 0.6);
  return p.boucler(0.4);
};

export const pinces: Recette = (h) => {
  // Les pinces crocodile qu'on accroche aux bornes.
  const p = new Piste(0.5, h);
  p.ajouter(metal(h, entre(h, 2400, 2900), 0.012, 0.08, 0.6), 0, 1);
  p.ajouter(metal(h, entre(h, 1800, 2100), 0.01, 0.06, 0.5), entre(h, 0.18, 0.26), 0.8);
  return p.donnees;
};

/** Le bourdonnement du banc de recharge (en boucle) : on ne l'entend qu'à deux pas. */
export const bourdonnement: Recette = (h) => {
  const d = 3;
  const p = new Piste(d, h);
  const base = 100;
  for (const [k, a] of [
    [1, 1],
    [2, 0.5],
    [3, 0.35],
    [5, 0.15],
  ] as const) {
    p.ajouter(oscillateur(n(d), base * k * (1 + (h() - 0.5) * 0.002)), 0, a * 0.3);
  }
  p.ajouter(souffle(d, h, { filtre: "passe-bande", f: 6000, q: 1 }), 0, 0.02);
  return p.boucler(0.5);
};

export const interrupteur: Recette = (h) => {
  const p = new Piste(0.15, h);
  p.ajouter(enveloppe(filtrer(bruitBlanc(n(0.01), h), "passe-bande", 3500, 3), percussive(0.0002, 0.0015)), 0, 1);
  p.ajouter(bois(h, 1800, 0.05, 3), 0.004, 0.4);
  return p.donnees;
};

export const charbon: Recette = (h) => {
  // Le charbon de bois qu'on défourne : des morceaux légers qui tintent presque.
  const p = new Piste(1.2, h);
  let t = 0;
  while (t < 1) {
    p.ajouter(modes(0.06, [{ f: entre(h, 2200, 3800), a: 1, tau: 0.008 }, { f: entre(h, 5000, 7000), a: 0.5, tau: 0.004 }]), t, entre(h, 0.2, 0.8));
    t += entre(h, 0.02, 0.1);
  }
  p.ajouter(souffle(1, h, { bruit: "rose", filtre: "passe-bande", f: 2000, q: 0.6, env: cloche(1) }), 0, 0.15);
  return p.donnees;
};

export const posePierres: Recette = (h) => {
  // On monte le cercle de pierres du feu.
  const p = new Piste(1.2, h);
  for (let i = 0; i < 3; i++) p.ajouter(gestePierre(h), i * entre(h, 0.3, 0.4), entre(h, 0.6, 1));
  return p.donnees;
};

// =====================================================================================
// La météo (priorité 3). Les ambiances de jour et de nuit, la halte et le Comptoir sont faits par le moteur de musique.
// =====================================================================================

/** La pluie (en boucle) : un rideau doux, des gouttes sur les feuilles. */
export const pluie: Recette = (h) => {
  const d = 6;
  const p = new Piste(d, h);
  p.ajouter(souffle(d, h, { bruit: "rose", filtre: "passe-haut", f: 600 }), 0, 0.5);
  p.ajouter(grains(d, h, 350, { f: [2000, 9000], q: 2, longueur: [0.0008, 0.003], amplitude: [0.05, 0.5] }), 0, 0.8);
  p.ajouter(grains(d, h, 25, { f: [500, 1500], q: 5, longueur: [0.005, 0.015], amplitude: [0.2, 0.6] }), 0, 0.4);
  return p.boucler(0.8);
};

/** Le tonnerre au loin : un roulement long, sourd. */
export const tonnerre: Recette = (h) => {
  const d = 6;
  const p = new Piste(d, h);
  const salves = 2 + Math.floor(h() * 3);
  for (let i = 0; i < salves; i++) {
    const t0 = entre(h, 0, 1.5) + i * 0.6;
    const longueur = entre(h, 2, 3.5);
    p.ajouter(souffle(longueur, h, { bruit: "brun", filtre: "passe-bas", f: entre(h, 120, 220), env: points([0, 0], [0.15, 1], [longueur, 0]) }), t0, entre(h, 0.5, 1));
  }
  return p.donnees;
};

// =====================================================================================
// L'interface : une palette par habillage de famille (Book 18 §3), jamais confondue avec un son du monde
// =====================================================================================

export type GesteInterface = "ouvrir" | "fermer" | "valider";

/** 🔥 Plaques rivetées : un rivet, une tôle. */
function interfaceCharbonniers(g: GesteInterface): Recette {
  return (h) => {
    const p = new Piste(0.35, h);
    if (g === "valider") {
      p.ajouter(metal(h, 1500, 0.04, 0.25, 0.6), 0, 0.8);
      p.ajouter(metal(h, 2250, 0.03, 0.2, 0.5), 0.06, 0.6);
    } else {
      p.ajouter(metal(h, g === "ouvrir" ? 1300 : 1000, 0.02, 0.15, 0.5), 0, 0.8);
      p.ajouter(sourd(200, 120, 0.01), 0, 0.4);
    }
    return p.donnees;
  };
}

/** ⚡ Terminal ambre : de petits bips carrés, adoucis. */
function interfaceVoltaiques(g: GesteInterface): Recette {
  return (h) => {
    const p = new Piste(0.3, h);
    const bip = (f: number, d: number) => enveloppe(filtrer(oscillateur(n(d), f, "carre"), "passe-bas", 3000), points([0, 0], [0.003, 1], [d - 0.005, 1], [d, 0]));
    if (g === "valider") {
      p.ajouter(bip(880, 0.05), 0, 0.5);
      p.ajouter(bip(1320, 0.07), 0.07, 0.5);
    } else p.ajouter(bip(g === "ouvrir" ? 1175 : 784, 0.045), 0, 0.5);
    return p.donnees;
  };
}

/** ⚙️ Carnet du bricoleur : le crayon qui gratte, la page qu'on tourne. */
function interfaceMecanistes(g: GesteInterface): Recette {
  return (h) => {
    const p = new Piste(0.45, h);
    if (g === "valider") {
      // Deux traits de crayon : une coche.
      p.ajouter(souffle(0.06, h, { filtre: "passe-bande", f: 4500, q: 1.5, env: cloche(0.06) }), 0, 0.8);
      p.ajouter(souffle(0.12, h, { filtre: "passe-bande", f: 5200, q: 1.5, env: cloche(0.12) }), 0.07, 1);
    } else {
      p.ajouter(souffle(0.25, h, { bruit: "rose", filtre: "passe-bande", f: (t) => (g === "ouvrir" ? 1200 + 5000 * t : 5000 - 4000 * t), q: 0.8, env: cloche(0.25) }), 0, 1);
    }
    return p.donnees;
  };
}

export function interfaceFamille(famille: "charbonniers" | "voltaiques" | "mecanistes", g: GesteInterface): Recette {
  return famille === "charbonniers" ? interfaceCharbonniers(g) : famille === "voltaiques" ? interfaceVoltaiques(g) : interfaceMecanistes(g);
}

// =====================================================================================
// La faune (2026-10-08) : poules, canards, envols
// =====================================================================================

export const envol: Recette = (h) => {
  // Un envol : des battements d'ailes rapides (souffles courts), qui s'espacent en s'éloignant.
  const p = new Piste(1.3, h);
  let t = 0;
  let ecart = entre(h, 0.07, 0.09);
  for (let i = 0; i < 12; i++) {
    const force = Math.max(0.2, 1 - i * 0.07);
    p.ajouter(souffle(0.07, h, { bruit: "rose", filtre: "passe-bande", f: entre(h, 700, 1100), q: 0.9, env: percussive(0.004, 0.025) }), t, force);
    p.ajouter(sourd(entre(h, 90, 130), 60, 0.012), t, 0.3 * force);
    t += ecart;
    ecart *= 1.06;
  }
  return p.donnees;
};

export const caquet: Recette = (h) => {
  // Une poule : « cot cot cot… codêêt », des notes nasales, brèves, puis une plus longue qui monte.
  const p = new Piste(1.1, h);
  const note = (duree: number, f0: number, f1: number) =>
    enveloppe(filtrer(oscillateur(n(duree), (t) => f0 + (f1 - f0) * (t / duree), "scie"), "passe-bande", 1400, 2.2), percussive(0.006, duree / 3));
  const brefs = 2 + Math.floor(h() * 3);
  let t = 0;
  for (let i = 0; i < brefs; i++) {
    p.ajouter(note(0.07, entre(h, 480, 560), entre(h, 430, 480)), t, 0.8);
    t += entre(h, 0.12, 0.16);
  }
  p.ajouter(note(0.32, entre(h, 520, 600), entre(h, 780, 900)), t + 0.05, 0.9);
  return p.donnees;
};

export const cancan: Recette = (h) => {
  // Un colvert : « coin coin », nasal et rauque, deux ou trois fois.
  const p = new Piste(1, h);
  const fois = 2 + Math.floor(h() * 2);
  let t = 0;
  for (let i = 0; i < fois; i++) {
    const duree = entre(h, 0.13, 0.18);
    const f = entre(h, 260, 320);
    const voix = filtrer(oscillateur(n(duree), (x) => f * (1 - 0.25 * (x / duree)), "scie"), "passe-bande", 1100, 3);
    const rauque = souffle(duree, h, { filtre: "passe-bande", f: 1200, q: 2 });
    p.ajouter(enveloppe(voix, points([0, 0], [0.015, 1], [duree * 0.7, 0.7], [duree, 0])), t, 0.8);
    p.ajouter(enveloppe(rauque, points([0, 0], [0.015, 1], [duree, 0])), t, 0.25);
    t += duree + entre(h, 0.08, 0.14);
  }
  return p.donnees;
};

/** Le klaxon du tracteur (Book 23 §4.7) : deux tons graves et rauques, une batterie fatiguée, 2,5 s. Un leurre : on l'entend de loin. */
export const klaxon: Recette = (h) => {
  const d = 2.5;
  const p = new Piste(d, h);
  // La batterie faiblit : le ton descend un peu en cours de route.
  const chute = (t: number) => 1 - 0.04 * (t / d);
  const env = (t: number) => Math.min(1, t / 0.03) * Math.min(1, (d - t) / 0.12);
  for (const [f, a] of [
    [392, 0.5],
    [494, 0.4],
  ] as const) {
    const ton = oscillateur(n(d), (t) => f * chute(t) * (1 + (h() - 0.5) * 0.002), "carre");
    p.ajouter(enveloppe(filtrer(ton, "passe-bas", 2200, 0.9), env), 0, a);
  }
  return saturer(p.donnees, 1.6);
};

/** La sonnette électrique du quai : le marteau bat le timbre vingt fois par seconde, 2,2 s. */
export const sonnette: Recette = (h) => {
  const p = new Piste(2.3, h);
  const partiels = [
    { f: 1870, a: 1, tau: 0.25 },
    { f: 2940, a: 0.5, tau: 0.15 },
    { f: 4310, a: 0.3, tau: 0.08 },
  ];
  for (let t = 0; t < 2.2; t += 0.05) p.ajouter(modes(0.3, partiels), t, 0.18 + h() * 0.05);
  return p.donnees;
};

/**
 * La corde de l'arc qui claque (Book 25 §3.4, chantier 4) : une corde pincée grave, qui s'éteint vite, le choc sourd
 * du bois dans la main, et le souffle bref de la flèche qui part. Discret : on l'entend à 3 m.
 */
export const cordeArc: Recette = (h) => {
  const p = new Piste(0.42, h);
  const f = entre(h, 105, 135);
  // La corde : des harmoniques presque justes, les aiguës meurent les premières.
  const partiels = [1, 2, 3, 4.02, 5.05].map((r, i) => ({ f: f * r * (1 + (h() - 0.5) * 0.01), a: 1 / (1 + i * 0.9), tau: 0.09 / (1 + i * 0.6) }));
  p.ajouter(modes(0.38, partiels), 0, 0.8);
  p.ajouter(sourd(150, 70, 0.015), 0, 0.5);
  p.ajouter(souffle(0.12, h, { filtre: "passe-bande", f: (t) => Math.max(600, 2400 - t * 9000), q: 1.6, env: points([0, 0], [0.01, 1], [0.12, 0]) }), 0.005, 0.35);
  return p.donnees;
};
