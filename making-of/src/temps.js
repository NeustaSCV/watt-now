/* Watt Now? — making-of : la ligne de temps. Tout est calé sur la musique (le thème principal, 84 BPM, 4/4) :
   une mesure = 20/7 s ≈ 2,857 s. La vague de l'époque j passe sous le personnage au premier temps de la mesure j.

   Mes.  Époque                       Allure            Musique (outils/bande-son.sh)
   0     0. le prototype              marche lente      la nappe seule
   1     1. le bonhomme en blocs      marche            + la basse
   2     2. la pâte grise             marche            + le rythme
   3     3. la tenue voltaïque        marche rapide     + la mélodie (les trois familles ensemble)
   4     4. le personnage du jeu      trot
   5     5. une autre apparence       trot
   6     6. encore une autre          course
   7     7. les cheveux bleus, sable  sprint
   8     8. l'hôtel des Flots         il ralentit, s'arrête (mesure 9), se tourne vers la mer
   9-11  le zoom arrière, le logo (mesure 10), le fondu                                                         */

export const MESURE = 240 / 84;
/** La fin du film : 11 mesures (la bande-son en fait autant). */
export const FIN = 11 * MESURE;
/** La dernière époque. */
export const DERNIERE = 8;
/** L'instant où la vague de l'époque j passe sous le personnage. */
export const T = (j) => j * MESURE;
/** L'arrêt du personnage, devant la mer. */
export const ARRET = T(9);
/** Le logo. */
export const LOGO = T(10) - 0.5;

/** La vitesse de marche (m/s) de chaque époque, avant le ralenti final. */
const VITESSES = [0.8, 1.0, 1.2, 1.55, 3.6, 4.2, 4.8, 6.5];
/** Le ralenti final, sur la plage : [instant, vitesse]. */
const RALENTI = [[T(8), 6.5], [T(8) + 0.8, 4.2], [T(8) + 1.8, 1.25], [ARRET - 0.05, 0]];

const doux = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const entre = (a, b, x) => doux((x - a) / (b - a));

/** La vitesse du personnage à l'instant t (m/s), lissée d'une époque à l'autre. */
export function vitesse(t) {
  if (t >= ARRET) return 0;
  if (t >= T(8)) {
    let i = 0;
    while (i < RALENTI.length - 2 && t > RALENTI[i + 1][0]) i++;
    const [t1, v1] = RALENTI[i], [t2, v2] = RALENTI[i + 1];
    return v1 + (v2 - v1) * entre(t1, t2, t);
  }
  const j = Math.max(0, Math.min(7, Math.floor(t / MESURE)));
  if (j === 0) return VITESSES[0];
  return VITESSES[j - 1] + (VITESSES[j] - VITESSES[j - 1]) * entre(T(j), T(j) + 0.55, t);
}

/** Les gestes de déplacement et leur cadence selon la vitesse (comme le jeu, interpolation.ts : VITESSE_ANIM). */
export const CLIPS = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop'];
function cadences(v) {
  return [1, Math.min(1.75, Math.max(0.6, v / 0.93)), Math.max(0.7, v / 5.1), Math.max(0.8, v / 6.5)];
}
function poidsBruts(v) {
  const sprint = entre(5.0, 5.9, v);
  const course = entre(2.2, 3.0, v) * (1 - sprint);
  const marche = entre(0.1, 0.5, v) * (1 - entre(2.2, 3.0, v));
  return [1 - entre(0.1, 0.5, v), marche, course, sprint];
}

/* Les tables, intégrées une fois : la distance parcourue et la phase de chaque geste. */
const PAS = 1 / 240;
const N = Math.ceil((FIN + 2) / PAS) + 1;
const DIST = new Float64Array(N);
const PHASES = CLIPS.map(() => new Float64Array(N));
for (let i = 1; i < N; i++) {
  const t = (i - 0.5) * PAS, v = vitesse(t), c = cadences(v);
  DIST[i] = DIST[i - 1] + v * PAS;
  for (let k = 0; k < CLIPS.length; k++) PHASES[k][i] = PHASES[k][i - 1] + c[k] * PAS;
}
function lire(table, t) {
  const x = Math.max(0, Math.min(N - 1.001, t / PAS)), i = Math.floor(x), f = x - i;
  return table[i] + (table[i + 1] - table[i]) * f;
}
/** La distance parcourue depuis le début (m). */
export const distance = (t) => lire(DIST, t);
/** La distance totale, jusqu'à l'arrêt. */
export const PARCOURS = distance(ARRET);
/** L'instant où le personnage a parcouru `d` mètres. */
export function instantA(d) {
  if (d <= 0) return 0;
  if (d >= PARCOURS) return ARRET;
  let a = 0, b = N - 1;
  while (b - a > 1) { const m = (a + b) >> 1; if (DIST[m] < d) a = m; else b = m; }
  return (a + (d - DIST[a]) / Math.max(1e-9, DIST[b] - DIST[a])) * PAS;
}
/** Le poids (0 → 1, somme 1) et l'instant dans le clip (s, à ramener à sa durée) de chaque geste de déplacement. */
export function allure(t) {
  const p = poidsBruts(vitesse(t));
  const somme = p.reduce((a, b) => a + b, 0) || 1;
  return CLIPS.map((nom, k) => ({ nom, poids: p[k] / somme, instant: lire(PHASES[k], t) }));
}

/** La vitesse de la vague d'une époque, par rapport au sol (m/s) : elle vient de devant, passe et file derrière. */
export const VITESSE_VAGUE = 15;
