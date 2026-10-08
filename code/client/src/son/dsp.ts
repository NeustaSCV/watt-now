// La boîte à outils des effets sonores synthétisés (Book 21 §6.3.1 : en 0a, les effets sont produits par Claude).
// Tout est calculé échantillon par échantillon, en TypeScript pur : pas besoin du navigateur, donc testable,
// et chaque variante est reproductible (le hasard est tiré d'une graine).

/** Fréquence d'échantillonnage des effets : 32 kHz suffit (contenu jusqu'à 16 kHz) et ménage la mémoire. */
export const FE = 32000;

/** Un générateur pseudo-aléatoire à graine (mulberry32) : même graine, même son. */
export function alea(graine: number): () => number {
  let a = graine >>> 0 || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Une graine à partir d'un texte (l'identifiant du son) et d'un numéro de variante. */
export function graine(texte: string, variante: number): number {
  let h = 2166136261 ^ variante;
  for (let i = 0; i < texte.length; i++) h = Math.imul(h ^ texte.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Une piste mono en cours de fabrication. */
export class Piste {
  readonly donnees: Float32Array;
  readonly hasard: () => number;

  constructor(dureeS: number, hasard: () => number) {
    this.donnees = new Float32Array(Math.max(1, Math.round(dureeS * FE)));
    this.hasard = hasard;
  }

  get longueur(): number {
    return this.donnees.length;
  }

  get duree(): number {
    return this.donnees.length / FE;
  }

  /** Un nombre au hasard entre a et b. */
  entre(a: number, b: number): number {
    return a + (b - a) * this.hasard();
  }

  /** Ajoute un signal (tableau) à partir de l'instant t (s), avec un gain. */
  ajouter(signal: Float32Array, t = 0, gain = 1): this {
    const debut = Math.round(t * FE);
    const d = this.donnees;
    for (let i = 0; i < signal.length; i++) {
      const j = debut + i;
      if (j < 0) continue;
      if (j >= d.length) break;
      d[j]! += signal[i]! * gain;
    }
    return this;
  }

  /** Ramène le pic à `pic` (0..1). Une piste muette reste muette. */
  normaliser(pic = 0.89): this {
    let max = 0;
    for (const v of this.donnees) max = Math.max(max, Math.abs(v));
    if (max > 1e-9) {
      const k = pic / max;
      for (let i = 0; i < this.donnees.length; i++) this.donnees[i]! *= k;
    }
    return this;
  }

  /**
   * Met le son à un niveau commun : la moyenne quadratique de sa partie audible vaut `efficace`,
   * puis les crêtes qui dépasseraient sont arrondies (pas d'écrêtage dur). Ainsi les gains du catalogue
   * règlent un vrai mélange, et non des différences de fabrication.
   */
  niveler(efficace = 0.14, plafond = 0.95): this {
    niveler(this.donnees, efficace, plafond);
    return this;
  }

  /** Fondus d'entrée et de sortie (en s), pour éviter les clics. */
  fondre(entree = 0.002, sortie = 0.01): this {
    const d = this.donnees;
    const ne = Math.min(d.length, Math.round(entree * FE));
    const ns = Math.min(d.length, Math.round(sortie * FE));
    for (let i = 0; i < ne; i++) d[i]! *= i / ne;
    for (let i = 0; i < ns; i++) d[d.length - 1 - i]! *= i / ns;
    return this;
  }

  /**
   * Rend la piste bouclable sans couture : la fin se fond dans le début (fondu enchaîné à puissance constante).
   * La piste raccourcit de `recouvrement` secondes.
   */
  boucler(recouvrement = 0.4): Float32Array {
    const d = this.donnees;
    const n = Math.min(Math.round(recouvrement * FE), Math.floor(d.length / 2));
    const sortie = new Float32Array(d.length - n);
    sortie.set(d.subarray(0, d.length - n));
    for (let i = 0; i < n; i++) {
      const x = i / n;
      // Le début de la boucle reçoit la queue de la piste, qui s'efface pendant que le début monte.
      sortie[i] = d[i]! * Math.sin((x * Math.PI) / 2) + d[d.length - n + i]! * Math.cos((x * Math.PI) / 2);
    }
    return sortie;
  }
}

// ---------- Sources ----------

export function bruitBlanc(n: number, hasard: () => number): Float32Array {
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = hasard() * 2 - 1;
  return s;
}

/** Bruit rose (filtre de Paul Kellet) : plus doux, plus « naturel ». */
export function bruitRose(n: number, hasard: () => number): Float32Array {
  const s = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = hasard() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    s[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return s;
}

/** Bruit brun (intégré) : grondements, vent, tonnerre. */
export function bruitBrun(n: number, hasard: () => number): Float32Array {
  const s = new Float32Array(n);
  let v = 0;
  for (let i = 0; i < n; i++) {
    v = (v + 0.02 * (hasard() * 2 - 1)) / 1.02;
    s[i] = v * 3.5;
  }
  return s;
}

/** Un oscillateur dont la fréquence (Hz) et l'amplitude peuvent varier dans le temps (fonctions de t en s). */
export function oscillateur(
  n: number,
  frequence: number | ((t: number) => number),
  forme: "sinus" | "triangle" | "scie" | "carre" = "sinus",
  phase = 0,
): Float32Array {
  const s = new Float32Array(n);
  let p = phase;
  const f = typeof frequence === "number" ? () => frequence : frequence;
  for (let i = 0; i < n; i++) {
    const x = p - Math.floor(p);
    s[i] =
      forme === "sinus"
        ? Math.sin(2 * Math.PI * x)
        : forme === "triangle"
          ? 1 - 4 * Math.abs(x - 0.5)
          : forme === "scie"
            ? 2 * x - 1
            : x < 0.5
              ? 1
              : -1;
    p += f(i / FE) / FE;
  }
  return s;
}

// ---------- Filtres (biquads de R. Bristow-Johnson) ----------

export type GenreFiltre = "passe-bas" | "passe-haut" | "passe-bande" | "pic";

/**
 * Filtre un signal sur place. La fréquence peut varier (fonction de t) : les coefficients sont recalculés
 * toutes les 32 échantillons. `gainDb` ne sert qu'au filtre « pic ».
 */
export function filtrer(s: Float32Array, genre: GenreFiltre, frequence: number | ((t: number) => number), q = 0.707, gainDb = 0): Float32Array {
  const f = typeof frequence === "number" ? () => frequence : frequence;
  let b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const calculer = (fc: number) => {
    const w = (2 * Math.PI * Math.min(Math.max(fc, 10), FE * 0.49)) / FE;
    const cw = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    let c0: number, c1: number, c2: number;
    let a0: number;
    if (genre === "passe-bas") {
      c0 = (1 - cw) / 2; c1 = 1 - cw; c2 = (1 - cw) / 2; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
    } else if (genre === "passe-haut") {
      c0 = (1 + cw) / 2; c1 = -(1 + cw); c2 = (1 + cw) / 2; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
    } else if (genre === "passe-bande") {
      c0 = al; c1 = 0; c2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
    } else {
      const A = Math.pow(10, gainDb / 40);
      c0 = 1 + al * A; c1 = -2 * cw; c2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A;
    }
    b0 = c0 / a0; b1 = c1 / a0; b2 = c2 / a0; a1 /= a0; a2 /= a0;
  };
  for (let i = 0; i < s.length; i++) {
    if (i % 32 === 0) calculer(f(i / FE));
    const x = s[i]!;
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    s[i] = y;
  }
  return s;
}

// ---------- Enveloppes ----------

/** Multiplie un signal par une enveloppe (fonction de t en s). */
export function enveloppe(s: Float32Array, env: (t: number) => number): Float32Array {
  for (let i = 0; i < s.length; i++) s[i]! *= env(i / FE);
  return s;
}

/** Attaque linéaire puis décroissance exponentielle (constante de temps `tau`, s). */
export function percussive(attaque: number, tau: number): (t: number) => number {
  return (t) => (t < attaque ? t / Math.max(attaque, 1e-6) : Math.exp(-(t - attaque) / tau));
}

/** Une cloche (montée puis descente en sinus), sur `duree` secondes. */
export function cloche(duree: number): (t: number) => number {
  return (t) => (t <= 0 || t >= duree ? 0 : Math.sin((Math.PI * t) / duree));
}

/** Enveloppe par points [t, valeur] reliés linéairement. */
export function points(...p: [number, number][]): (t: number) => number {
  return (t) => {
    if (t <= p[0]![0]) return p[0]![1];
    for (let i = 1; i < p.length; i++) {
      const [t1, v1] = p[i]!;
      const [t0, v0] = p[i - 1]!;
      if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / Math.max(t1 - t0, 1e-9);
    }
    return p[p.length - 1]![1];
  };
}

// ---------- Matières ----------

/**
 * Synthèse modale : une somme de partiels qui s'éteignent chacun à leur rythme.
 * Le métal a des partiels inharmoniques et longs ; le bois, peu de partiels très courts.
 */
export function modes(dureeS: number, partiels: { f: number; a: number; tau: number }[]): Float32Array {
  const n = Math.round(dureeS * FE);
  const s = new Float32Array(n);
  for (const p of partiels) {
    if (p.f >= FE / 2) continue;
    const w = (2 * Math.PI * p.f) / FE;
    const k = Math.exp(-1 / (p.tau * FE));
    let amp = p.a;
    for (let i = 0; i < n; i++) {
      s[i]! += amp * Math.sin(w * i);
      amp *= k;
      if (amp < 1e-5) break;
    }
  }
  return s;
}

/** Un choc métallique : partiels inharmoniques autour de `f`, plus un petit clic d'attaque. */
export function metal(hasard: () => number, f: number, tau: number, dureeS = tau * 5, brillance = 1): Float32Array {
  const rapports = [1, 2.32, 3.86, 5.41, 6.93, 8.6, 10.2];
  const partiels = rapports.map((r, i) => ({
    f: f * r * (1 + (hasard() - 0.5) * 0.02),
    a: (1 / (1 + i * 0.7)) * (i === 0 ? 1 : brillance),
    tau: tau / (1 + i * 0.35),
  }));
  const s = modes(dureeS, partiels);
  const clic = enveloppe(filtrer(bruitBlanc(Math.round(0.004 * FE), hasard), "passe-haut", 3000), percussive(0.0002, 0.0012));
  for (let i = 0; i < clic.length; i++) s[i]! += clic[i]! * 0.8;
  return s;
}

/** Un choc de bois : quelques partiels très amortis et un souffle bref. */
export function bois(hasard: () => number, f: number, dureeS = 0.18, sec = 1): Float32Array {
  const s = modes(dureeS, [
    { f, a: 1, tau: 0.035 / sec },
    { f: f * 2.57 * (1 + (hasard() - 0.5) * 0.04), a: 0.55, tau: 0.018 / sec },
    { f: f * 4.1 * (1 + (hasard() - 0.5) * 0.06), a: 0.3, tau: 0.01 / sec },
  ]);
  const souffle = enveloppe(filtrer(bruitBlanc(Math.round(0.03 * FE), hasard), "passe-bande", f * 3, 1.2), percussive(0.0005, 0.006));
  for (let i = 0; i < souffle.length; i++) s[i]! += souffle[i]! * 0.6;
  return s;
}

/** Un coup sourd : une basse qui plonge (corps, sol, poing). */
export function sourd(f0: number, f1: number, tau: number, dureeS = tau * 6): Float32Array {
  const n = Math.round(dureeS * FE);
  const s = oscillateur(n, (t) => f1 + (f0 - f1) * Math.exp(-t / (tau * 0.6)));
  return enveloppe(s, percussive(0.001, tau));
}

/**
 * Des grains : de petits clics posés au hasard (gravier, crépitement, pluie sur la tôle, chaîne de vélo…).
 * `densite` : grains par seconde (fonction de t possible) ; chaque grain est un bruit filtré très court.
 */
export function grains(
  dureeS: number,
  hasard: () => number,
  densite: number | ((t: number) => number),
  o: { f: [number, number]; q?: number; longueur?: [number, number]; amplitude?: [number, number] },
): Float32Array {
  const n = Math.round(dureeS * FE);
  const s = new Float32Array(n);
  const d = typeof densite === "number" ? () => densite : densite;
  const [lmin, lmax] = o.longueur ?? [0.001, 0.004];
  const [amin, amax] = o.amplitude ?? [0.3, 1];
  let t = 0;
  while (t < dureeS) {
    const dens = Math.max(0.01, d(t));
    t += (-Math.log(1 - hasard() * 0.999) / dens);
    if (t >= dureeS) break;
    const longueur = lmin + (lmax - lmin) * hasard();
    const f = o.f[0] * Math.pow(o.f[1] / o.f[0], hasard());
    const grain = enveloppe(filtrer(bruitBlanc(Math.round(longueur * FE) + 8, hasard), "passe-bande", f, o.q ?? 2), percussive(0.0002, longueur / 3));
    const amp = amin + (amax - amin) * Math.pow(hasard(), 2);
    const debut = Math.round(t * FE);
    for (let i = 0; i < grain.length && debut + i < n; i++) s[debut + i]! += grain[i]! * amp;
  }
  return s;
}

/** Du bruit filtré en un seul geste : genre de bruit, filtre, enveloppe. */
export function souffle(
  dureeS: number,
  hasard: () => number,
  o: { bruit?: "blanc" | "rose" | "brun"; filtre?: GenreFiltre; f?: number | ((t: number) => number); q?: number; env?: (t: number) => number },
): Float32Array {
  const n = Math.round(dureeS * FE);
  const s = o.bruit === "brun" ? bruitBrun(n, hasard) : o.bruit === "rose" ? bruitRose(n, hasard) : bruitBlanc(n, hasard);
  if (o.filtre) filtrer(s, o.filtre, o.f ?? 1000, o.q ?? 0.707);
  if (o.env) enveloppe(s, o.env);
  return s;
}

/**
 * Une voix gutturale (râles des Éteints) : une source rauque (dents de scie + bruit) passée dans des formants,
 * avec une hauteur qui tremble. Aucune parole : un souffle qui accroche.
 */
export function rale(
  dureeS: number,
  hasard: () => number,
  o: { f0: (t: number) => number; formants: [number, number, number]; rauque?: number; env: (t: number) => number },
): Float32Array {
  const n = Math.round(dureeS * FE);
  const source = new Float32Array(n);
  let p = 0;
  let gigue = 0;
  for (let i = 0; i < n; i++) {
    const t = i / FE;
    // La hauteur tremble et accroche (fry vocal) : petites irrégularités de période.
    if (i % 64 === 0) gigue = (hasard() - 0.5) * 0.25;
    p += (o.f0(t) * (1 + gigue)) / FE;
    if (p >= 1) p -= Math.floor(p);
    const impulsion = Math.pow(1 - p, 6);
    source[i] = impulsion * 1.6 + (hasard() * 2 - 1) * (o.rauque ?? 0.35);
  }
  const sortie = new Float32Array(n);
  const gains = [1, 0.7, 0.35];
  o.formants.forEach((f, k) => {
    const bande = filtrer(Float32Array.from(source), "passe-bande", f * (1 + (hasard() - 0.5) * 0.08), 5);
    for (let i = 0; i < n; i++) sortie[i]! += bande[i]! * gains[k]!;
  });
  return enveloppe(filtrer(sortie, "passe-haut", 70), o.env);
}

/** Une petite saturation douce (tanh), pour épaissir. */
export function saturer(s: Float32Array, entree = 2): Float32Array {
  const k = Math.tanh(entree);
  for (let i = 0; i < s.length; i++) s[i] = Math.tanh(s[i]! * entree) / k;
  return s;
}

/** Une réverbération courte et légère (quelques échos amortis) : pièce, sous-bois. */
export function piece(s: Float32Array, taille = 0.05, queue = 0.35, melange = 0.25): Float32Array {
  const sortie = Float32Array.from(s);
  const retards = [1, 1.37, 1.79, 2.21, 2.83].map((r) => Math.round(r * taille * FE));
  for (const [k, r] of retards.entries()) {
    const g = melange * Math.pow(queue, k + 1) * 2;
    for (let i = r; i < s.length; i++) sortie[i]! += sortie[i - r]! * g * 0.5;
  }
  return sortie;
}

/** Voir `Piste.niveler` : niveau commun, crêtes arrondies. Travaille sur place. */
export function niveler(s: Float32Array, efficace = 0.14, plafond = 0.95): Float32Array {
  let max = 0;
  for (const v of s) max = Math.max(max, Math.abs(v));
  if (max < 1e-9) return s;
  // On ne mesure que la partie audible (au-dessus de -30 dB sous la crête) : les silences ne comptent pas.
  const seuil = max * 0.03;
  let somme = 0;
  let nombre = 0;
  for (const v of s) {
    if (Math.abs(v) < seuil) continue;
    somme += v * v;
    nombre++;
  }
  const rms = Math.sqrt(somme / Math.max(1, nombre));
  const k = efficace / Math.max(rms, 1e-9);
  // Au-delà de 70 % du plafond, la crête est arrondie (tanh) au lieu d'être coupée.
  const genou = plafond * 0.7;
  for (let i = 0; i < s.length; i++) {
    const v = s[i]! * k;
    const a = Math.abs(v);
    s[i] = a <= genou ? v : Math.sign(v) * (genou + (plafond - genou) * Math.tanh((a - genou) / (plafond - genou)));
  }
  return s;
}
