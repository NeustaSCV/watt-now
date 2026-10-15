// Les icônes des meubles nouveaux du niveau 2 (plan 0.10, chantier D) : les cinq installations (le cuiseur solaire, les
// bacs de tri, la rampe de LED, le moulin de jerricans, l'arbalète de garde) et les quatre objets (la batterie de
// cellules, la charrette à bras, la poulie et le lingot d'aluminium). Même charte que icones.ts (Book 18 §6.3, Book 21
// §5) : trait d'encre, aplats de la palette, carré 48 × 48 ; un objet se reconnaît à sa silhouette, même à 28 px.

const ENCRE = "#3b2a1e";
const T = `stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const F = `stroke="${ENCRE}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" fill="none"`;

// La palette (celle des icônes du niveau 2).
const ALU = "#d4d8dc";
const ALU_SOMBRE = "#9aa1a8";
const BOIS = "#8a6a48";
const BOIS_CLAIR = "#c9a77a";
const JERRICAN = "#c8462f";
const PLASTIQUE = "#3f6f8f";
const LED = "#f4f1c8";
const CUIVRE = "#c8743a";
const OMBRE = `<ellipse cx="24" cy="43" rx="17" ry="3" fill="${ENCRE}" opacity="0.14"/>`;

/** Les dessins, par identifiant d'objet ou d'installation. */
export const DESSINS_MEUBLES_NEUFS: Record<string, string> = {
  // ---------- Les installations ----------
  // Le cuiseur solaire : une boîte, sa vitre en biais, deux réflecteurs ouverts ; le soleil au-dessus.
  cuiseur_solaire: `
    ${OMBRE}
    <circle cx="38" cy="8" r="4" fill="#f2c94c" ${T} stroke-width="1.4"/>
    <path d="M10 26 L4 12 L22 20 Z" fill="${ALU}" ${T}/>
    <path d="M38 26 L44 12 L26 20 Z" fill="${ALU}" ${T}/>
    <path d="M8 26 H40 V40 H8 Z" fill="${BOIS_CLAIR}" ${T}/>
    <path d="M10 26 L14 20 H34 L38 26 Z" fill="#9fd0e0" ${T}/>
    <path d="M17 22 L15 25 M25 22 L23 25" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M8 31 H40" ${F}/>`,
  // Les bacs de tri : trois jerricans coupés, côte à côte ; un aimant en fer à cheval au-dessus.
  bacs_tri: `
    ${OMBRE}
    <path d="M5 24 H17 V41 H5 Z" fill="${JERRICAN}" ${T}/>
    <path d="M18 24 H30 V41 H18 Z" fill="#d6a23a" ${T}/>
    <path d="M31 24 H43 V41 H31 Z" fill="${PLASTIQUE}" ${T}/>
    <path d="M8 22 l2 -3 l2 3 M21 21 h6 M34 22 l2 -3 l2 3" ${F}/>
    <path d="M18 6 V12 A6 6 0 0 0 30 12 V6" fill="none" stroke="${ENCRE}" stroke-width="6.4" stroke-linecap="butt"/>
    <path d="M18 6 V12 A6 6 0 0 0 30 12 V6" fill="none" stroke="#c0392b" stroke-width="4" stroke-linecap="butt"/>
    <path d="M16 6 h4 M28 6 h4" stroke="${ALU}" stroke-width="3"/>`,
  // La rampe de LED : un tube d'aluminium sur deux pieds, dix points lumineux, leur halo.
  rampe_led: `
    ${OMBRE}
    <path d="M12 40 L16 22 M36 40 L32 22" stroke="${ALU_SOMBRE}" stroke-width="3" stroke-linecap="round"/>
    <path d="M12 40 L16 22 M36 40 L32 22" ${F}/>
    <rect x="5" y="17" width="38" height="6" rx="3" fill="${ALU}" ${T}/>
    ${[9, 12.5, 16, 19.5, 23, 26.5, 30, 33.5, 37, 40].map((x) => `<circle cx="${x - 0.5}" cy="20" r="1.3" fill="${LED}" stroke="${ENCRE}" stroke-width="0.6"/>`).join("")}
    <path d="M8 13 l-2 -4 M16 12 l-1 -4 M24 11 V7 M32 12 l1 -4 M40 13 l2 -4" stroke="#f2c94c" stroke-width="1.5" stroke-linecap="round"/>`,
  // Le moulin de jerricans : un mât de tube, deux demi-jerricans en godets décalés (une Savonius), le petit moteur au pied.
  moulin_jerricans: `
    ${OMBRE}
    <path d="M24 42 V14" stroke="${ALU_SOMBRE}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M24 42 V14" ${F}/>
    <path d="M24 6 C14 6 12 12 14 16 L24 16 Z" fill="${JERRICAN}" ${T}/>
    <path d="M24 26 C34 26 36 20 34 16 L24 16 Z" fill="${JERRICAN}" ${T}/>
    <path d="M17 9 q-2 3 0 5 M31 23 q2 -3 0 -5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
    <rect x="19" y="34" width="10" height="7" rx="1.5" fill="#5b5f63" ${T}/>
    <path d="M6 10 q4 -2 8 0 M4 20 q4 -2 8 0" stroke="${ALU_SOMBRE}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  // L'arbalète de garde : l'arbalète bridée sur un tube planté, le fil tendu devant.
  arbalete_garde: `
    ${OMBRE}
    <path d="M14 42 V24" stroke="${ALU_SOMBRE}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M14 42 V24" ${F}/>
    <path d="M6 22 L30 20" stroke="${ENCRE}" stroke-width="5.2" stroke-linecap="round"/>
    <path d="M6 22 L30 20" stroke="${BOIS}" stroke-width="3" stroke-linecap="round"/>
    <path d="M27 11 Q33 20 27 29" fill="none" stroke="${ENCRE}" stroke-width="4" stroke-linecap="round"/>
    <path d="M27 11 Q33 20 27 29" fill="none" stroke="#7a7f86" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M27 11 L20 20.6 L27 29" ${F}/>
    <path d="M30 20 L38 19.4" stroke="${ENCRE}" stroke-width="1.6"/>
    <path d="M38 17 L41 19.2 L38 21.4 Z" fill="${ALU}" stroke="${ENCRE}" stroke-width="1"/>
    <path d="M36 42 V32 M44 42 V32 M36 36 H44" stroke="${ENCRE}" stroke-width="1.4" stroke-dasharray="2 1.4"/>`,

  // ---------- Les objets ----------
  // La batterie de cellules : un bloc de plastique, douze cellules en rangs, deux cosses de cuivre.
  batterie_cellules: `
    ${OMBRE}
    <rect x="7" y="14" width="34" height="26" rx="3" fill="${PLASTIQUE}" ${T}/>
    ${[0, 1, 2]
      .map((r) => [0, 1, 2, 3].map((c) => `<rect x="${11 + c * 7}" y="${18 + r * 7}" width="5" height="5" rx="2.5" fill="#6db36f" stroke="${ENCRE}" stroke-width="0.8"/>`).join(""))
      .join("")}
    <rect x="12" y="9" width="5" height="5" fill="${CUIVRE}" ${T} stroke-width="1.4"/>
    <rect x="31" y="9" width="5" height="5" fill="${CUIVRE}" ${T} stroke-width="1.4"/>
    <path d="M13 11.5 h3 M32 11.5 h3 M33.5 10 v3" stroke="${ENCRE}" stroke-width="1"/>`,
  // La charrette à bras : un plateau de planches, deux grandes roues de vélo, les bras de tube.
  charrette_bras: `
    ${OMBRE}
    <path d="M4 22 L18 28 M4 26 L18 30" stroke="${ALU_SOMBRE}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M14 20 H42 V28 H14 Z" fill="${BOIS_CLAIR}" ${T}/>
    <path d="M23 20 V28 M32 20 V28" ${F}/>
    <circle cx="20" cy="34" r="8" fill="none" ${T} stroke-width="2.4"/>
    <circle cx="36" cy="34" r="8" fill="none" ${T} stroke-width="2.4"/>
    <path d="M20 26 V42 M12 34 H28 M36 26 V42 M28 34 H44" stroke="${ENCRE}" stroke-width="0.8" opacity="0.7"/>
    <circle cx="20" cy="34" r="1.8" fill="${ALU}" stroke="${ENCRE}" stroke-width="1"/>
    <circle cx="36" cy="34" r="1.8" fill="${ALU}" stroke="${ENCRE}" stroke-width="1"/>`,
  // La poulie d'aluminium : un disque, sa gorge, son moyeu percé.
  poulie_aluminium: `
    ${OMBRE}
    <circle cx="24" cy="23" r="16" fill="${ALU}" ${T}/>
    <circle cx="24" cy="23" r="12.5" fill="none" stroke="${ALU_SOMBRE}" stroke-width="3"/>
    <circle cx="24" cy="23" r="12.5" ${F}/>
    <circle cx="24" cy="23" r="5" fill="${ALU_SOMBRE}" ${T} stroke-width="1.4"/>
    <circle cx="24" cy="23" r="2" fill="${ENCRE}"/>
    <path d="M13 15 A13 13 0 0 1 20 10" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.85"/>`,
  // Le lingot d'aluminium : un pavé en tronc de pyramide, mat, son reflet.
  lingot_aluminium: `
    ${OMBRE}
    <path d="M6 34 L12 22 H36 L42 34 Z" fill="${ALU_SOMBRE}" ${T}/>
    <path d="M12 22 L16 14 H32 L36 22 Z" fill="${ALU}" ${T}/>
    <path d="M6 34 H42 V39 H6 Z" fill="#7d848b" ${T}/>
    <path d="M18 17 H29" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>`,
};
