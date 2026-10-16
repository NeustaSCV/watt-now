// Watty, la mascotte de la Compagnie (Book 18 §6.1, Book 21 §5.2.7) : une pile souriante à l'éclair,
// rétro publicitaire et ironique. Cinq poses : salut, clin d'œil, pouce levé, « en panne », barré au feutre.
// Dessiné en SVG (Book 21 §5.7), aux couleurs de l'affiche de l'Abondance.

export type PoseWatty = "salut" | "clin" | "pouce" | "panne" | "barre";

const ENCRE = "#3b2a1e";
const ROUGE = "#c8362b";
const CREME = "#f4ecd8";
const JAUNE = "#e8c547";

function bras(pose: PoseWatty): string {
  const trait = `stroke="${ENCRE}" stroke-width="5" stroke-linecap="round" fill="none"`;
  const gant = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="9" fill="${CREME}" stroke="${ENCRE}" stroke-width="3"/>`;
  switch (pose) {
    case "salut":
      // La main droite levée, qui salue
      return `<path d="M30 92 C14 96 10 110 12 122" ${trait}/>${gant(12, 124)}
        <path d="M110 86 C128 76 134 58 132 44" ${trait}/>${gant(132, 40)}
        <path d="M124 30 l6 -6 M134 28 l2 -8 M142 34 l7 -4" stroke="${ENCRE}" stroke-width="2.5" stroke-linecap="round"/>`;
    case "pouce":
      return `<path d="M30 92 C14 96 10 110 12 122" ${trait}/>${gant(12, 124)}
        <path d="M110 92 C126 92 134 84 136 74" ${trait}/>
        <rect x="126" y="62" width="20" height="18" rx="6" fill="${CREME}" stroke="${ENCRE}" stroke-width="3"/>
        <path d="M134 62 v-12 a4 4 0 0 1 8 0 v12" fill="${CREME}" stroke="${ENCRE}" stroke-width="3"/>`;
    case "panne":
      // Les bras ballants, découragés
      return `<path d="M30 96 C22 112 22 126 24 136" ${trait}/>${gant(24, 138)}
        <path d="M110 96 C118 112 118 126 116 136" ${trait}/>${gant(116, 138)}`;
    default:
      return `<path d="M30 92 C14 96 10 110 12 122" ${trait}/>${gant(12, 124)}
        <path d="M110 92 C126 96 130 110 128 122" ${trait}/>${gant(128, 124)}`;
  }
}

function visage(pose: PoseWatty): string {
  const oeil = (x: number) => `<ellipse cx="${x}" cy="62" rx="5" ry="7" fill="${ENCRE}"/><circle cx="${x + 1.5}" cy="59" r="1.8" fill="#fff"/>`;
  if (pose === "panne") {
    return `<path d="M50 60 l10 6 M50 66 l10 -6 M80 60 l10 6 M80 66 l10 -6" stroke="${ENCRE}" stroke-width="3" stroke-linecap="round"/>
      <path d="M56 86 q14 -8 28 0" stroke="${ENCRE}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  }
  const yeux = pose === "clin" ? `${oeil(55)}<path d="M80 62 q5 -5 10 0" stroke="${ENCRE}" stroke-width="3.5" fill="none" stroke-linecap="round"/>` : oeil(55) + oeil(85);
  return `${yeux}<path d="M50 78 q20 18 40 0" stroke="${ENCRE}" stroke-width="3.5" fill="#7a1f17" stroke-linejoin="round"/>
    <path d="M56 82 q14 8 28 0" fill="#e88" stroke="none"/>
    <ellipse cx="44" cy="76" rx="5" ry="3" fill="#f2a08a" opacity="0.8"/><ellipse cx="96" cy="76" rx="5" ry="3" fill="#f2a08a" opacity="0.8"/>`;
}

/** Watty en SVG ; `taille` en pixels (hauteur). */
export function watty(pose: PoseWatty = "salut", taille = 140): string {
  const largeur = Math.round((taille * 150) / 170);
  const panne = pose === "panne";
  return `<svg class="watty" width="${largeur}" height="${taille}" viewBox="0 0 150 170" role="img" aria-label="Watty">
    <!-- Le corps : une pile, le pôle + en haut -->
    <rect x="58" y="6" width="24" height="12" rx="3" fill="#b9b2a2" stroke="${ENCRE}" stroke-width="3"/>
    <rect x="30" y="16" width="80" height="128" rx="16" fill="${panne ? "#8a8f94" : JAUNE}" stroke="${ENCRE}" stroke-width="4"/>
    <rect x="30" y="104" width="80" height="40" rx="0" fill="${panne ? "#6e6a63" : ROUGE}" stroke="none"/>
    <rect x="30" y="16" width="80" height="128" rx="16" fill="none" stroke="${ENCRE}" stroke-width="4"/>
    <!-- L'éclair -->
    <path d="M74 106 L62 126 L72 126 L66 140 L82 118 L72 118 L78 106 Z" fill="${panne ? "#b9b2a2" : CREME}" stroke="${ENCRE}" stroke-width="2.5" stroke-linejoin="round"/>
    ${visage(pose)}
    ${bras(pose)}
    <!-- Les jambes -->
    <path d="M52 144 v16 M88 144 v16" stroke="${ENCRE}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="48" cy="162" rx="10" ry="5" fill="${ENCRE}"/><ellipse cx="92" cy="162" rx="10" ry="5" fill="${ENCRE}"/>
    ${panne ? `<path d="M112 30 q10 -8 6 -18 M120 40 q10 -4 10 -14" stroke="#8a8f94" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>` : ""}
    ${pose === "barre" ? `<path d="M10 30 L140 150 M140 30 L10 150" stroke="#1f2a44" stroke-width="7" stroke-linecap="round" opacity="0.85"/>` : ""}
  </svg>`;
}

/** Le logo *Watt Now?* : le titre en capitales de l'affiche sur un bandeau rouge penché, un éclair en coin. */
export function logo(largeur = 300): string {
  const hauteur = Math.round(largeur * 0.36);
  return `<svg class="logo" width="${largeur}" height="${hauteur}" viewBox="0 0 300 108" role="img" aria-label="Watt Now?">
    <g transform="rotate(-3 150 54)">
      <rect x="6" y="14" width="288" height="72" rx="4" fill="${ROUGE}"/>
      <rect x="6" y="14" width="288" height="72" rx="4" fill="none" stroke="${ENCRE}" stroke-width="3"/>
      <text x="150" y="67" text-anchor="middle" textLength="250" lengthAdjust="spacingAndGlyphs" font-family="Futura, 'Avenir Next Condensed', 'Arial Black', sans-serif" font-weight="900" font-size="42" fill="${CREME}">WATT NOW?</text>
    </g>
    <g transform="translate(262 0) rotate(12)">
      <path d="M14 0 L2 26 L12 26 L6 44 L22 18 L12 18 L18 0 Z" fill="${JAUNE}" stroke="${ENCRE}" stroke-width="2.5" stroke-linejoin="round"/>
    </g>
  </svg>`;
}

/** Les conseils des Compteurs, sur l'écran de chargement (le ton du Book 15 : pointilleux, honnêtes). */
export const CONSEILS = [
  "Un bon est un reçu. Il se décharge : dépensez-le.",
  "Seule l'électricité déposée crée des wotts. Le reste, c'est du commerce.",
  "La fumée se sent de loin. Les Éteints aussi la sentent.",
  "Une batterie de voiture pèse 18 kg. Le lithium, c'est autre chose.",
  "Dormir dans un abri récupère deux fois plus vite que par terre.",
  "La pluie couvre les bruits. Les Compteurs, eux, entendent tout.",
  "Ne vous laissez jamais encercler. Un couloir vaut mieux qu'une bonne arme.",
  "Watty ment. Les Compteurs comptent.",
];
