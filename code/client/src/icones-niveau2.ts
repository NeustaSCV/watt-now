// Les icônes du niveau 2 (plan 0.10, chantier B) : le tube d'aluminium et l'échelle qui en donne, et les objets-clés du
// Grand Hôtel et du phare (la boîte de roulements a déjà la sienne, icones-dechets.ts ; la chaise de camping, un déchet
// de l'Abondance, aussi). Même charte que icones.ts (Book 18 §6.3, Book 21 §5) : trait d'encre, aplats de la palette,
// sur fond papier, carré 48 × 48 ; un objet se reconnaît à sa silhouette, même à 28 px.

const ENCRE = "#3b2a1e";
const T = `stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const F = `stroke="${ENCRE}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" fill="none"`;

// La palette (celle des icônes du niveau 1).
const ALU = "#d4d8dc";
const ALU_SOMBRE = "#9aa1a8";
const FONTE = "#3a3633";
const BOIS = "#8a6a48";
const BOIS_CLAIR = "#c9a77a";
const CUIR = "#6b4a2e";
const BRONZE = "#b8863b";
const CUIVRE = "#c8743a";

/** Un trait épais cerné d'encre (un tube, un montant, un manche), comme dans icones-niveau1.ts. */
function trait(d: string, couleur: string, largeur = 2.6): string {
  return `
    <path d="${d}" fill="none" stroke="${ENCRE}" stroke-width="${largeur + 2.2}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${couleur}" stroke-width="${largeur}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Les dessins, par identifiant d'objet. */
export const DESSINS_NIVEAU2: Record<string, string> = {
  // ---------- La récupération ----------
  // Le tube d'aluminium : deux tubes couchés en biais, leurs bouts creux bien visibles (la différence avec la chute).
  tube_aluminium: `
    <ellipse cx="24" cy="40" rx="17" ry="3.5" fill="${ENCRE}" opacity="0.14"/>
    <path d="M8 31 L36 9 L41 15 L13 37 Z" fill="${ALU}" ${T}/>
    <ellipse cx="38.5" cy="12" rx="2.4" ry="3.9" transform="rotate(-38 38.5 12)" fill="${ALU_SOMBRE}" ${T}/>
    <ellipse cx="38.5" cy="12" rx="1.1" ry="2" transform="rotate(-38 38.5 12)" fill="${ENCRE}"/>
    <path d="M11 33 L37 12.5" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>
    <path d="M14 42 L38 23 L42 28 L18 46 Z" fill="${ALU}" ${T}/>
    <ellipse cx="40" cy="25.5" rx="2" ry="3.3" transform="rotate(-38 40 25.5)" fill="${ALU_SOMBRE}" ${T}/>
    <ellipse cx="40" cy="25.5" rx="0.9" ry="1.6" transform="rotate(-38 40 25.5)" fill="${ENCRE}"/>`,
  // L'échelle en aluminium : deux montants, cinq barreaux, un barreau tordu ; les rivets.
  echelle_aluminium: `
    ${trait("M14 5 L10 44", ALU, 3.2)}
    ${trait("M34 5 L38 44", ALU, 3.2)}
    ${trait("M13.3 11 H34.7", ALU_SOMBRE, 2)}
    ${trait("M12.5 18.5 H35.5", ALU_SOMBRE, 2)}
    ${trait("M11.8 26 Q24 30 36.2 26", ALU_SOMBRE, 2)}
    ${trait("M11 33.5 H37", ALU_SOMBRE, 2)}
    ${trait("M10.3 41 H37.7", ALU_SOMBRE, 2)}
    <circle cx="13.3" cy="11" r="1.1" fill="${ENCRE}"/><circle cx="34.7" cy="11" r="1.1" fill="${ENCRE}"/>
    <circle cx="11" cy="33.5" r="1.1" fill="${ENCRE}"/><circle cx="37" cy="33.5" r="1.1" fill="${ENCRE}"/>
    <path d="M15 8 L13 20" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>`,
  // Un roulement à billes (V1-01), tiré de sa boîte : la bague extérieure, la bague intérieure, les billes entre les deux.
  roulement: `
    <ellipse cx="24" cy="41" rx="15" ry="3" fill="${ENCRE}" opacity="0.14"/>
    <circle cx="24" cy="23" r="16" fill="${ALU}" ${T}/>
    <circle cx="24" cy="23" r="11.5" fill="${FONTE}" ${T}/>
    <circle cx="24" cy="12.8" r="2.2" fill="${ALU}"/><circle cx="31.2" cy="15.8" r="2.2" fill="${ALU}"/>
    <circle cx="34.2" cy="23" r="2.2" fill="${ALU}"/><circle cx="31.2" cy="30.2" r="2.2" fill="${ALU}"/>
    <circle cx="24" cy="33.2" r="2.2" fill="${ALU}"/><circle cx="16.8" cy="30.2" r="2.2" fill="${ALU}"/>
    <circle cx="13.8" cy="23" r="2.2" fill="${ALU}"/><circle cx="16.8" cy="15.8" r="2.2" fill="${ALU}"/>
    <circle cx="24" cy="23" r="7.5" fill="${ALU_SOMBRE}" ${T}/>
    <circle cx="24" cy="23" r="3.6" fill="#f4ecd8" ${T}/>
    <path d="M13 13 Q17 9 22 8" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.8"/>`,
  // Le jeu d'étagères (V1-04) : deux planches lisses, claires, sur leurs tasseaux, quelques têtes de clous.
  etageres: `
    <ellipse cx="24" cy="42" rx="18" ry="3" fill="${ENCRE}" opacity="0.14"/>
    <path d="M9 10 V40 M39 10 V40" ${T} stroke-width="3.4" stroke="${BOIS}"/>
    <path d="M9 10 V40 M39 10 V40" fill="none" stroke="${ENCRE}" stroke-width="1" opacity="0.35"/>
    <path d="M5 16 H43 V21 H5 Z" fill="${BOIS_CLAIR}" ${T}/>
    <path d="M5 30 H43 V35 H5 Z" fill="${BOIS_CLAIR}" ${T}/>
    <path d="M8 17.5 H40 M8 31.5 H40" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
    <circle cx="9" cy="18.5" r="0.9" fill="${ENCRE}"/><circle cx="39" cy="18.5" r="0.9" fill="${ENCRE}"/>
    <circle cx="9" cy="32.5" r="0.9" fill="${ENCRE}"/><circle cx="39" cy="32.5" r="0.9" fill="${ENCRE}"/>`,
  // ---------- L2A : le Grand Hôtel ----------
  // Les tôles ondulées : trois tôles empilées, de biais, leurs ondes ; quelques trous de clous.
  toles_ondulees: `
    <path d="M4 34 L30 42 L44 30 L18 22 Z" fill="#8f979d" ${T}/>
    <path d="M4 28 L30 36 L44 24 L18 16 Z" fill="#a9b0b5" ${T}/>
    <path d="M4 22 L30 30 L44 18 L18 10 Z" fill="#c4cace" ${T}/>
    <path d="M7.5 23 L21 11 M12 24.5 L25.5 12.5 M16.5 26 L30 14 M21 27.5 L34.5 15.5 M25.5 29 L39 17" ${F}/>
    <path d="M9 25 L22.5 13 M18 28 L31.5 16" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
    <circle cx="10" cy="22.5" r="0.9" fill="${ENCRE}"/><circle cx="36" cy="22.5" r="0.9" fill="${ENCRE}"/>
    <path d="M33 39 l2 -1 M38 35 l2 -1.2" stroke="#a0522d" stroke-width="1.4" stroke-linecap="round"/>`,
  // Les couvertures de laine : deux couvertures pliées au carré, l'une sur l'autre, leurs bandes et leur ourlet.
  couvertures_laine: `
    <path d="M6 30 H42 V41 Q24 44 6 41 Z" fill="#5a6e8a" ${T}/>
    <path d="M6 34 H42 M6 37.5 H42" stroke="#e8dcc0" stroke-width="1.4" opacity="0.9"/>
    <path d="M8 15 H40 Q42 15 42 18 V30 H6 V18 Q6 15 8 15 Z" fill="#8c3b2e" ${T}/>
    <path d="M6 20 H42 M6 25 H42" stroke="#e8dcc0" stroke-width="1.6" opacity="0.9"/>
    <path d="M10 15 V30 M38 15 V30" stroke="${ENCRE}" stroke-width="1" stroke-dasharray="1.6 1.6" opacity="0.7"/>
    <path d="M12 9 q2 2 0 4 M24 7 q2 2 0 4 M36 9 q2 2 0 4" fill="none" stroke="#b5a6d6" stroke-width="1.4" stroke-linecap="round"/>`,
  // La lanterne-tempête : le réservoir, le verre bombé dans sa cage de fil, le chapeau, l'anse ; la flamme.
  lanterne_tempete: `
    <path d="M17 8 Q24 0 31 8" fill="none" stroke="${ENCRE}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M15 12 Q24 6 33 12 V14 H15 Z" fill="#b5442e" ${T}/>
    <path d="M16 14 H32 Q36 24 32 33 H16 Q12 24 16 14 Z" fill="#f4e6b8" ${T}/>
    <path d="M24 30 Q20 25 24 19 Q28 25 24 30 Z" fill="#ffb347" stroke="#d2691e" stroke-width="1"/>
    <path d="M14.5 22 Q24 25 33.5 22 M15 28 Q24 31 33 28" ${F}/>
    <path d="M18 14 V33 M30 14 V33" ${F}/>
    <path d="M12 33 H36 L34 42 H14 Z" fill="#b5442e" ${T}/>
    <circle cx="35.5" cy="37" r="1.8" fill="${ALU_SOMBRE}" ${T} stroke-width="1"/>
    <path d="M18 17 Q16.5 23 18 30" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.85"/>`,
  // Le fer à souder : le manche isolé, le tube, la panne de cuivre ; le fil d'étain enroulé autour, le cordon.
  fer_souder: `
    ${trait("M6 42 Q4 34 10 30", "#2f2f2f", 1.6)}
    <path d="M9 31 L19 21 L24 26 L14 36 Z" fill="#3f5f7a" ${T}/>
    <path d="M12 30 L18 24 M14.5 32.5 L20.5 26.5" stroke="#6f8fa8" stroke-width="1.2"/>
    ${trait("M21.5 23.5 L35 10", ALU, 2.6)}
    ${trait("M35 10 L41 4", CUIVRE, 2)}
    <path d="M25 22 q3 1 2 -3 q3 1 2 -3 q3 1 2 -3" fill="none" stroke="#d6d8da" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M38 6 l2 -3 M42 8 l3 -1" stroke="#ffb347" stroke-width="1.4" stroke-linecap="round"/>`,
  // ---------- L2B : le phare ----------
  // La porte de four en fonte : le cadre, la porte bombée, sa poignée et son loquet ; la bouche noircie.
  porte_four: `
    <path d="M7 12 H41 V42 H7 Z" fill="#55524d" ${T}/>
    <path d="M11 16 Q24 11 37 16 V38 H11 Z" fill="${FONTE}" ${T}/>
    <path d="M14 33 H34" stroke="#1a1612" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 20 Q24 17 34 20" fill="none" stroke="#8a8f96" stroke-width="1.2" stroke-linecap="round"/>
    ${trait("M19 26 H29", "#8a8f96", 2)}
    <path d="M36 24 H43 V29 H36 Z" fill="#8a8f96" ${T}/>
    <circle cx="9.5" cy="15" r="1" fill="#8a8f96"/><circle cx="38.5" cy="15" r="1" fill="#8a8f96"/>
    <circle cx="9.5" cy="39" r="1" fill="#8a8f96"/><circle cx="38.5" cy="39" r="1" fill="#8a8f96"/>`,
  // Le jerrican de 20 L : le bidon vert, ses trois poignées, ses nervures en X, le bec verseur ; intact.
  jerrican_20l: `
    <path d="M9 12 Q9 9 12 9 H34 L40 15 V42 Q40 44 38 44 H11 Q9 44 9 42 Z" fill="#3f7a3a" ${T}/>
    <path d="M13 9 V5 H31 V9" fill="none" ${T}/>
    <path d="M19 9 V6 M25 9 V6" ${F}/>
    <path d="M34 9 L40 3 L44 7 L40 11" fill="#2f5a2c" ${T}/>
    <path d="M13 18 L36 39 M36 18 L13 39" stroke="#2f5a2c" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M13 18 H36 V39 H13 Z" ${F}/>
    <path d="M11.5 14 V40" stroke="#8fc08a" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>`,
  // Le rabot : le corps de fonte, la poignée arrière, le pommeau avant de bois, le fer qui dépasse ; un copeau.
  rabot: `
    <path d="M5 34 H41 L43 40 H3 Z" fill="#7a5a3a" ${T}/>
    <path d="M7 34 Q8 26 16 26 H33 Q39 26 40 34 Z" fill="#4a5a6a" ${T}/>
    <path d="M27 26 Q28 16 34 14 Q37 16 35 20 Q32 22 32 26" fill="${BOIS_CLAIR}" ${T}/>
    <ellipse cx="12" cy="24" rx="3.6" ry="4" fill="${BOIS_CLAIR}" ${T}/>
    <path d="M20 26 L24 38" stroke="#c9ccd0" stroke-width="3" stroke-linecap="round"/>
    <path d="M20 26 L24 38" ${F}/>
    <path d="M30 40 Q36 46 44 42 Q38 44 34 41" fill="${BOIS_CLAIR}" stroke="${BOIS}" stroke-width="1"/>`,
  // La cloche de bronze : la robe, la lèvre, la couronne et son anneau, le battant ; un bout de cordage.
  cloche_bronze: `
    <path d="M21 5 H27 V9 H21 Z" fill="${BRONZE}" ${T}/>
    <path d="M15 12 Q15 9 24 9 Q33 9 33 12 Q35 26 40 34 Q24 37 8 34 Q13 26 15 12 Z" fill="${BRONZE}" ${T}/>
    <path d="M7 34 Q24 39 41 34 L41 37 Q24 42 7 37 Z" fill="#9a6e2e" ${T}/>
    <path d="M14 22 Q24 24 34 22" ${F}/>
    <path d="M19 13 Q17 22 16 30" stroke="#f0d08a" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path d="M24 37 V43" stroke="${ENCRE}" stroke-width="1.6"/>
    <circle cx="24" cy="43.5" r="2.4" fill="#6b5a3a" ${T} stroke-width="1.4"/>
    <path d="M27 6 Q34 3 38 7 Q41 10 38 14" fill="none" stroke="#d8c69c" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M27 6 Q34 3 38 7 Q41 10 38 14" ${F}/>`,
  // Le soufflet de forge : deux flasques de bois en poire, le cuir plissé entre elles, la buse de fer, le levier.
  soufflet_forge: `
    <path d="M10 12 Q4 24 10 36 L34 27 L34 21 Z" fill="${CUIR}" ${T}/>
    <path d="M9 16 L32 22 M7 24 L33 24 M9 32 L32 26" ${F} opacity="0.8"/>
    <path d="M12 9 Q2 24 12 39 L33 28 Q36 24 33 20 Z" fill="none" ${T}/>
    <path d="M12 9 Q20 13 33 20" stroke="${BOIS}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M12 39 Q20 35 33 28" stroke="${BOIS}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    ${trait("M33 24 L44 24", "#5c5650", 2.6)}
    ${trait("M12 9 L6 3", BOIS_CLAIR, 2.2)}
    <circle cx="22" cy="24" r="2" fill="${BOIS_CLAIR}" ${T} stroke-width="1"/>`,
};
