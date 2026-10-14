// Les icônes du niveau 1 (plan 0.8, chantier 3) : les objets nouveaux de la 0.8, et les deux installations nouvelles
// (râtelier à outils, torche plantée). Même charte que icones.ts (Book 18 §6.3, Book 21 §5) : trait d'encre, aplats de
// la palette, sur fond papier, carré 48 × 48 ; un objet se reconnaît à sa silhouette, même à 28 px.

const ENCRE = "#3b2a1e";
const T = `stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const F = `stroke="${ENCRE}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" fill="none"`;

// La palette (celle des icônes du métier).
const ACIER = "#c9ccd0";
const ACIER_SOMBRE = "#8a8f96";
const FER = "#5c5650";
const BOIS = "#8a6a48";
const BOIS_CLAIR = "#c9a77a";
const CORDE = "#d8c69c";
const PAPIER = "#f4ecd8";

/** Un trait épais cerné d'encre (un manche, une barre, un clou), comme dans icones-dechets.ts. */
function trait(d: string, couleur: string, largeur = 2.6): string {
  return `
    <path d="${d}" fill="none" stroke="${ENCRE}" stroke-width="${largeur + 2.2}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${couleur}" stroke-width="${largeur}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Un clou de (x1, y1) (la tête) à (x2, y2) (la pointe). */
function clou(x1: number, y1: number, x2: number, y2: number): string {
  const l = Math.hypot(x2 - x1, y2 - y1);
  // La tête : un petit trait perpendiculaire au clou.
  const px = (-(y2 - y1) / l) * 2.6;
  const py = ((x2 - x1) / l) * 2.6;
  const r = (n: number) => Math.round(n * 10) / 10;
  return `${trait(`M${x1} ${y1} L${x2} ${y2}`, ACIER_SOMBRE, 1.6)}
    ${trait(`M${r(x1 - px)} ${r(y1 - py)} L${r(x1 + px)} ${r(y1 + py)}`, ACIER, 1.8)}`;
}

/** Les dessins, par identifiant d'objet ou d'installation. */
export const DESSINS_NIVEAU1: Record<string, string> = {
  // ---------- La maison : la ruine et sa caisse ----------
  // Le bidon de 5 L : un bidon de plastique blanc, sa poignée moulée, son bouchon bleu ; une goutte sur l'étiquette.
  bidon_5l: `
    <path d="M11 17 Q11 13 15 13 H33 Q37 13 37 17 V40 Q37 43 34 43 H14 Q11 43 11 40 Z" fill="#ece8dc" ${T}/>
    <path d="M14 13 V8.5 Q14 6 16.5 6 H24 Q26.5 6 26.5 8.5 V13" fill="#ece8dc" ${T}/>
    <path d="M17.5 13 V9.5 H23 V13 Z" fill="${PAPIER}" stroke-width="1.2" ${T}/>
    <rect x="29" y="7.5" width="6" height="5.5" rx="1.2" fill="#2f5fa4" ${T}/>
    <path d="M14 23 H34 V35 H14 Z" fill="#9cc8d8" stroke-width="1.2" ${T}/>
    <path d="M24 25.5 Q20 30 21 31.5 Q24 34.5 27 31.5 Q28 30 24 25.5 Z" fill="#2f6fa4" stroke-width="1" ${T}/>
    <path d="M15 16 V38" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>`,
  // La tête de marteau : vue de côté, la panne ronde, le col, le pied-de-biche recourbé ; l'œil vide, des miettes du
  // vieux manche.
  tete_marteau: `
    <path d="M5 13 H12 V27 H5 Z" fill="#6e6a63" ${T}/>
    <path d="M12 15 H30 Q36 15 40 19 Q45 25 44 34 Q40 29 35 26 Q32 24 28 24 H12 Z" fill="#55524d" ${T}/>
    <path d="M44 34 L40.5 31" stroke="${ENCRE}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M18.5 15.5 H25.5 V23.5 H18.5 Z" fill="#1a1612" stroke="#8a8f96" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M6.5 15.5 V24.5" stroke="${ACIER}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M28 17.5 Q34 17.5 38 21" stroke="#8a8f96" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M18 31 l2 1 M22 34 l1.5 -1.5 M25 30.5 l2 1.2 M20 37 l1.6 .8" stroke="${BOIS}" stroke-width="2" stroke-linecap="round"/>`,
  // ---------- H1A : les pièces de famille ----------
  // L'enclume de dépanneur : la silhouette de l'enclume, sa bigorne, son trou carré, la table polie, un billot.
  enclume_depanneur: `
    <path d="M6 13 H33 Q39 13 45 10 Q43 18 34 20 H31 L29 27 H33 V31 H13 V27 H17 L15 20 Q8 19 6 13 Z" fill="#4a4844" ${T}/>
    <path d="M8 14.5 H33" stroke="#b8bcc0" stroke-width="1.8" stroke-linecap="round"/>
    <rect x="24" y="15.5" width="3" height="2.6" fill="#1f1c19"/>
    <path d="M9 31 H37 L40 40 H6 Z" fill="${BOIS}" ${T}/>
    <path d="M12 35 H34 M14 38 H32" stroke="${ENCRE}" stroke-width="1" opacity="0.45"/>
    <path d="M38 6 l2 2 M42 6 l-1 2.5" stroke="#ffb347" stroke-width="1.6" stroke-linecap="round"/>`,
  // Le petit alternateur : le carter d'aluminium ajouré (le cuivre derrière), la poulie à gorges, les pattes de fixation.
  petit_alternateur: `
    <path d="M9 8 Q5 8 5 12 Q5 15 9 16 L14 15 L13 9 Z M9 40 Q5 40 5 36 Q5 33 9 32 L14 33 L13 39 Z" fill="#9aa3a8" ${T}/>
    <circle cx="8" cy="12" r="1.5" fill="${ENCRE}"/><circle cx="8" cy="36" r="1.5" fill="${ENCRE}"/>
    <circle cx="21" cy="24" r="14" fill="#b8bcc0" ${T}/>
    <path d="M14 16 h5 M13 21 h6 M13 27 h6 M14 32 h5 M23 15 h5 M24 33 h5" stroke="#c8743a" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="21" cy="24" r="4.5" fill="#8a8f96" ${T}/>
    <path d="M33 19 H39 V29 H33 Z" fill="#6b7b8c" ${T}/>
    <path d="M39 16 H44 V32 H39 Z" fill="${ACIER}" ${T}/>
    <path d="M39 20 h5 M39 24 h5 M39 28 h5" stroke="${ENCRE}" stroke-width="1"/>
    <path d="M13 14 Q16 11 20 11" stroke="#ffffff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.8"/>`,
  // La poignée de clous : cinq clous en vrac, couchés à peu près dans le même sens, têtes bien visibles.
  poignee_clous: `
    <ellipse cx="24" cy="37" rx="18" ry="5" fill="#3b2a1e" opacity="0.16"/>
    ${clou(8, 14, 36, 22)}
    ${clou(6, 25, 34, 30)}
    ${clou(12, 36, 40, 33)}
    ${clou(40, 12, 14, 26)}
    ${clou(42, 25, 17, 40)}`,
  // ---------- L1A : la laiterie ----------
  // Le seau galvanisé de 10 L : tôle grise et ses reflets, deux cerclages, l'anse de fil.
  seau_10l: `
    <path d="M10 18 Q24 1 38 18" fill="none" stroke="${ENCRE}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M10 18 H38 L34 42 H14 Z" fill="#b8bcc0" ${T}/>
    <ellipse cx="24" cy="18" rx="14" ry="3.6" fill="#6b7076" ${T}/>
    <path d="M11.5 26 H36.5 M13 35 H35" stroke="${ENCRE}" stroke-width="1.6" opacity="0.55"/>
    <path d="M15 22 L17 39" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.75"/>
    <path d="M27 29 l2 1 l-1 2 M30 37 l1.5 .5" stroke="#e8ecee" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="10" cy="18" r="1.6" fill="${FER}"/><circle cx="38" cy="18" r="1.6" fill="${FER}"/>`,
  // ---------- L1B : le Moulin ----------
  // La toile de jute : un sac à farine mis à plat, sa trame, sa couture, l'épi de blé imprimé.
  toile_jute: `
    <path d="M9 9 H39 L37 41 Q24 44 11 41 Z" fill="#c4a670" ${T}/>
    <path d="M10 15 H38 M10 21 H38 M10.5 27 H37.5 M11 33 H37" stroke="#9a7f4e" stroke-width="0.9" opacity="0.8"/>
    <path d="M15 9.5 V41 M21 9.5 V42 M27 9.5 V42 M33 9.5 V41.5" stroke="#9a7f4e" stroke-width="0.9" opacity="0.8"/>
    <path d="M11 12 H37" stroke="${ENCRE}" stroke-width="1.2" stroke-dasharray="2 2"/>
    <path d="M24 37 V20" stroke="#7a4a2a" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M24 21 q-4 1 -4 4 q4 0 4 -4 M24 21 q4 1 4 4 q-4 0 -4 -4 M24 26 q-4 1 -4 4 q4 0 4 -4 M24 26 q4 1 4 4 q-4 0 -4 -4" fill="#7a4a2a"/>
    <path d="M24 17 v3" stroke="#7a4a2a" stroke-width="1.6" stroke-linecap="round"/>`,
  // Les feuillards : trois cercles de fer de baril, liés en botte, leurs rivets ; un peu de rouille.
  feuillards: `
    ${trait("M7 30 A17 7 0 1 0 41 30 A17 7 0 1 0 7 30", "#6b6560", 3.2)}
    ${trait("M7 23 A17 7 0 1 0 41 23 A17 7 0 1 0 7 23", "#7d756d", 3.2)}
    ${trait("M7 16 A17 7 0 1 0 41 16 A17 7 0 1 0 7 16", "#8a8279", 3.2)}
    <path d="M24 9 V37" stroke="${CORDE}" stroke-width="1.8"/>
    <path d="M24 9 V37" ${F}/>
    <circle cx="11" cy="20" r="1.1" fill="${ACIER}"/><circle cx="37" cy="27" r="1.1" fill="${ACIER}"/><circle cx="14" cy="35" r="1.1" fill="${ACIER}"/>
    <path d="M33 21 l2 .5 M17 28 l2 -.5 M30 35 l2 .4" stroke="#a0522d" stroke-width="1.4" stroke-linecap="round"/>`,
  // La fourche à foin : un long manche de frêne, la douille, trois dents d'acier recourbées.
  fourche_foin: `
    ${trait("M5 45 L28 20", BOIS_CLAIR, 3.4)}
    ${trait("M26 16 L32 22", ACIER_SOMBRE, 3)}
    ${trait("M25 17 Q27 8 35 4", ACIER, 1.8)}
    ${trait("M29 19 Q34 12 41 9", ACIER, 1.8)}
    ${trait("M31 23 Q38 18 44 16", ACIER, 1.8)}
    <path d="M9 39 l3 1 M14 33 l3 1" stroke="${BOIS}" stroke-width="1.2" stroke-linecap="round"/>`,
  // La grosse clé du Moulin : un anneau, une longue tige, le panneton ; l'étiquette de bois à sa ficelle.
  cle_moulin: `
    ${trait("M16 18 L37 39", FER, 3.2)}
    <circle cx="12" cy="14" r="7" fill="none" stroke="${ENCRE}" stroke-width="5.4"/>
    <circle cx="12" cy="14" r="7" fill="none" stroke="${FER}" stroke-width="3"/>
    <path d="M31 33 L35 29 L38 32 L36 34 L38 36 L35 39 Z" fill="${FER}" ${T}/>
    <path d="M7 19 Q5 26 9 30" fill="none" stroke="${CORDE}" stroke-width="1.6"/>
    <path d="M5 29 L15 31 L13 41 L3 39 Z" fill="${BOIS_CLAIR}" ${T}/>
    <path d="M6 34 L12 35.2 M5.6 36.6 L10.6 37.6" stroke="${ENCRE}" stroke-width="1" opacity="0.6"/>
    <path d="M8.5 9.5 Q10 8 12 8" stroke="#b8bcc0" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  // ---------- H1B : le gué ----------
  // La motte de glaise : une motte grasse, tranchée net d'un côté (on voit les coups du bâton), le luisant de la vase.
  glaise: `
    <path d="M6 30 Q5 18 16 14 Q24 10 32 13 L36 14 L40 34 Q34 40 24 40 H16 Q7 39 6 30 Z" fill="#a8977a" ${T}/>
    <path d="M32 13 Q40 12 43 18 Q45 27 40 34 Z" fill="#c4b18e" ${T}/>
    <path d="M36 17 L41 21 M36.5 22 L42 25.5 M37.5 27 L41.5 30" stroke="#8e7d60" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M9 31 Q17 36 27 35 Q33 34 37 31" fill="none" stroke="#7d6c52" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="21" cy="24" rx="4.6" ry="3.2" fill="#958568" stroke-width="1.2" ${T}/>
    <path d="M12 20 Q15 16 20 16" stroke="#f4f4ee" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path d="M27 18 l2 0" stroke="#f4f4ee" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`,
  // ---------- Les outils de fortune ----------
  // Le serre-joint de fortune : deux branches qui pincent une planchette, liées d'une corde tordue au garrot.
  serre_joint_fortune: `
    <path d="M9 18 H21 V30 H9 Z" fill="${BOIS_CLAIR}" ${T}/>
    <path d="M11 21 H19 M11 25 H19" stroke="${BOIS}" stroke-width="1" opacity="0.7"/>
    ${trait("M4 15 Q22 12 40 15", BOIS, 3.2)}
    ${trait("M4 33 Q22 36 40 33", BOIS, 3.2)}
    <path d="M30 13 Q36 18 30 24 Q24 30 30 35 M34 13 Q28 18 34 24 Q40 30 34 35" fill="none" stroke="${CORDE}" stroke-width="2.6"/>
    <path d="M30 13 Q36 18 30 24 Q24 30 30 35 M34 13 Q28 18 34 24 Q40 30 34 35" ${F}/>
    ${trait("M24 26 L44 21", BOIS_CLAIR, 2)}
    <path d="M7 13 l-2 -3 M38 36 l3 2" stroke="#5a4130" stroke-width="1.6" stroke-linecap="round"/>`,
  // La scie de fortune : une latte de bois, deux lames ébréchées ligaturées dessous, des dents de travers.
  scie_fortune: `
    <path d="M9 28 L37 12 L40 17 L13 33 Z" fill="${ACIER_SOMBRE}" ${T}/>
    <path d="M13 33 l0.5 -3.5 l3 1.5 l0 -4 l3 2 l0.5 -3.5 l2.5 2.2 l1 -4 l2.5 2 l0.5 -3.6 l3 1.8 l0 -3.6 l3 2" stroke-width="1.3" fill="none" ${T}/>
    <path d="M23 21 L26 26" stroke="${ENCRE}" stroke-width="1.4"/>
    ${trait("M4 26 L38 7", BOIS_CLAIR, 3.2)}
    <path d="M13 19 l2 4 M16 17.3 l2 4 M30 9.6 l2 4 M33 8 l2 4" stroke="${CORDE}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M4 26 L9 34 L14 31" fill="none" stroke-width="1.6" ${T}/>`,
  // Le marteau de fortune : une barre de métal repliée sur elle-même, la tête serrée de fil de fer.
  marteau_fortune: `
    ${trait("M16 44 L24 14", "#6b6862", 3.4)}
    <path d="M13 10 Q16 4 24 6 L37 9 Q41 10 39 15 L36 18 Q33 19 30 17 L23 15 Q17 17 13 10 Z" fill="#6b6862" ${T}/>
    <path d="M17 8 L34 12" stroke="${ACIER}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M21 6.5 L19.5 15 M24 6.6 L22.5 15.2 M27 7.3 L25.7 15.7" stroke="${CORDE}" stroke-width="1.4"/>
    <path d="M21 6.5 L19.5 15 M24 6.6 L22.5 15.2 M27 7.3 L25.7 15.7" stroke-width="0.6" ${F}/>
    <path d="M15 40 l3 1 M17 35 l3 1" stroke="${ENCRE}" stroke-width="1" opacity="0.5"/>`,
  // Le coin de bois : un coin trapu de bois dur, le fil du bois, la tête écrasée par les coups de pierre.
  coin_bois: `
    <path d="M6 40 L26 8 L42 20 Z" fill="${BOIS_CLAIR}" ${T}/>
    <path d="M26 8 L42 20 L44 16 L29 5 Z" fill="#a08058" ${T}/>
    <path d="M12 36 L28 13 M16 35 L32 16 M21 32 L36 19" stroke="${BOIS}" stroke-width="1" opacity="0.8"/>
    <path d="M30 7.5 l1.5 2 M34 10.5 l1.5 1.6 M38.5 13.8 l1.4 1.5" stroke="${ENCRE}" stroke-width="1" stroke-linecap="round"/>
    <path d="M27 7 Q28 4 30.5 5 M41 18 Q44 18 44 15.5" fill="none" stroke="${ENCRE}" stroke-width="1" stroke-linecap="round"/>`,
  // Le bâton à fouir durci : la pointe passée au feu, noire, quelques braises encore.
  baton_fouir_durci: `
    <path d="M12 40 L34 8" stroke="#6b4a32" stroke-width="5" stroke-linecap="round"/>
    <path d="M12 40 L34 8" fill="none" stroke-width="1.2" ${T}/>
    <path d="M25.5 20.5 L34 8 L33 10" stroke="#2b2018" stroke-width="5" stroke-linecap="round"/>
    <path d="M30 14 L38 4 L36 15 Z" fill="#1f1712" ${T}/>
    <circle cx="33" cy="12" r="1" fill="#ff8a3d"/><circle cx="29" cy="17.5" r="0.9" fill="#ffb347"/><circle cx="36" cy="9" r="0.8" fill="#ff8a3d"/>
    <path d="M39 9 Q42 6 40 2 M42 12 Q45 9 43 6" fill="none" stroke="#9a958c" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
    <path d="M17 33 l3 1 M21 27 l3 1" stroke-width="1.2" ${T}/>`,
  // ---------- L'établi à étau ----------
  // Le maillet : une tête de bois dur en tonnelet, ses cernes au bout, le manche de branche.
  maillet: `
    ${trait("M24 44 L24 19", BOIS, 3.2)}
    <path d="M8 9 H40 V21 H8 Z" fill="${BOIS_CLAIR}" ${T}/>
    <ellipse cx="8" cy="15" rx="3" ry="6" fill="#d8bc8e" ${T}/>
    <ellipse cx="40" cy="15" rx="3" ry="6" fill="#d8bc8e" ${T}/>
    <ellipse cx="40" cy="15" rx="1.4" ry="3" fill="none" stroke-width="0.8" ${F}/>
    <path d="M13 12 H35 M13 18 H35" stroke="${BOIS}" stroke-width="1" opacity="0.7"/>
    <path d="M24 9 V21" stroke="${ENCRE}" stroke-width="1" opacity="0.4"/>`,
  // La planche fendue : une planche de bois fendu, les bords irréguliers, le fil qui court, le bout éclaté.
  planche_fendue: `
    <path d="M5 33 L35 9 Q38 8 40 10 L43 15 L13 40 Q10 41 8 38 Z" fill="${BOIS_CLAIR}" ${T}/>
    <path d="M9 34 L37 12 M12 36 L40 14 M15 38 L41 17" stroke="${BOIS}" stroke-width="1" opacity="0.75"/>
    <path d="M35 9 L37 6 L39 9 L41 7 L42 11 L44 11 L43 15" fill="#a08058" stroke-width="1.4" ${T}/>
    <path d="M5 33 L3 36 L7 37 L6 39 L8 38" fill="none" stroke-width="1.4" ${T}/>
    <path d="M20 26 l4 -3" stroke="${ENCRE}" stroke-width="1" opacity="0.5"/>`,
  // ---------- ⚡ Les condensateurs (0.8.2, R14) ----------
  // Le petit condensateur (celui d'un flash) : un petit cylindre bleu debout, sa bande claire marquée « − », le dessus
  // d'aluminium et sa croix, deux pattes tordues.
  petit_condensateur: `
    <ellipse cx="24" cy="41" rx="12" ry="3" fill="#3b2a1e" opacity="0.16"/>
    <path d="M20.5 32 Q20 36 17 37.5 Q14.5 39 14 42" fill="none" stroke="${ACIER_SOMBRE}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M27.5 32 Q28.5 37 32 38 Q35 39 35.5 42" fill="none" stroke="${ACIER_SOMBRE}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M16 12 Q16 9 24 9 Q32 9 32 12 V30 Q32 33 24 33 Q16 33 16 30 Z" fill="#3a6fb0" ${T}/>
    <path d="M27 10.5 Q30.5 11 31 12.5 V30 Q30.5 31.5 27 32 Z" fill="#c9d8ea" stroke="none"/>
    <path d="M29 16 V18 M29 21 V23 M29 26 V28" stroke="#3a6fb0" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="24" cy="12" rx="8" ry="3" fill="${ACIER}" ${T}/>
    <path d="M21.5 11 L26.5 13 M26.5 11 L21.5 13" stroke="${ENCRE}" stroke-width="0.9" stroke-linecap="round"/>
    <path d="M18.5 15 V29" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>`,
  // Le condensateur moyen (celui d'une raquette à moustiques) : un gros cylindre vert couché sur sa petite carte, la
  // bobine cuivrée de l'étage haute tension à côté, deux fils qui en sortent.
  condensateur_moyen: `
    <ellipse cx="24" cy="42" rx="19" ry="3" fill="#3b2a1e" opacity="0.16"/>
    <path d="M4 30 H44 V39 H4 Z" fill="#3f7a4a" ${T}/>
    <circle cx="8" cy="36" r="1" fill="${ACIER}"/><circle cx="40" cy="36" r="1" fill="${ACIER}"/>
    <path d="M10 37 H18 M30 37 H38" stroke="#c9b25a" stroke-width="1" opacity="0.8"/>
    <path d="M7 15 Q7 11 11 11 H31 Q35 11 35 15 V25 Q35 29 31 29 H11 Q7 29 7 25 Z" fill="#2f7a5a" ${T}/>
    <path d="M9 12.5 H31 Q33 12.5 33.5 14.5 H8.5 Q8.5 12.5 9 12.5 Z" fill="#cfe3d6" stroke="none"/>
    <path d="M13 13.5 H15 M18 13.5 H20 M23 13.5 H25" stroke="#2f7a5a" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse cx="35" cy="20" rx="2.6" ry="9" fill="${ACIER}" ${T}/>
    <path d="M10 19 H32" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>
    <path d="M37 22 H41 V24 H37 Z M37 25.5 H41 V27.5 H37 Z" fill="#c8743a" stroke-width="1" ${T}/>
    <path d="M37.5 17 L40 17 L42 11 M37.5 19 L42 19 L45 14" fill="none" stroke="#b3243a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  // ---------- Les installations nouvelles (plan 0.8, chantier 6) ----------
  // Le râtelier à outils : deux montants, une traverse à chevilles, une hache, un marteau et une scie pendus.
  ratelier_outils: `
    ${trait("M8 44 V8 M40 44 V8", BOIS, 3)}
    ${trait("M6 12 H42", BOIS_CLAIR, 3)}
    <path d="M15 12 V16 M24 12 V16 M33 12 V16" stroke="${ENCRE}" stroke-width="2.2" stroke-linecap="round"/>
    ${trait("M15 16 V38", "#7a5a3c", 2)}
    <path d="M12 18 Q9 23 12 27 L15 25 V19 Z" fill="${ACIER_SOMBRE}" stroke-width="1.4" ${T}/>
    ${trait("M24 16 V36", "#7a5a3c", 2)}
    <path d="M19 33 H29 V38 H19 Z" fill="#55524d" stroke-width="1.4" ${T}/>
    <path d="M31 16 L36 16 L36 37 L31 35 Z" fill="${ACIER}" stroke-width="1.4" ${T}/>
    <path d="M31 19 l-1.5 1 l1.5 1 l-1.5 1 l1.5 1 l-1.5 1 l1.5 1 l-1.5 1 l1.5 1 l-1.5 1 l1.5 1 l-1.5 1 l1.5 1" fill="none" stroke="${ENCRE}" stroke-width="0.9"/>
    <path d="M4 44 H44" stroke="${ENCRE}" stroke-width="2" stroke-linecap="round"/>`,
  // La torche plantée : une branche fichée en terre, le chiffon gras en tête, la flamme et son halo.
  torche_plantee: `
    <circle cx="24" cy="12" r="10" fill="#ffd27a" opacity="0.35"/>
    <path d="M14 42 Q24 37 34 42 Z" fill="#7d6f56" ${T}/>
    ${trait("M24 41 L24 17", BOIS, 3)}
    <path d="M20 15 H28 V22 H20 Z" fill="#9a8a6a" ${T}/>
    <path d="M20 18 H28" stroke="${ENCRE}" stroke-width="1" opacity="0.6"/>
    <path d="M24 3 Q30 9 28 14 Q26 16 24 15 Q21 16 20 14 Q18 9 24 3 Z" fill="#ff8a3d" stroke-width="1.4" ${T}/>
    <path d="M24 8 Q26.5 11 25.5 13.5 Q24 14.5 22.5 13.5 Q22 11 24 8 Z" fill="#ffd27a"/>`,
  // ---------- Les armes du niveau 2 (plan 0.10, chantier F) ----------
  // Le pied de guéridon : une colonne de fonte en balustre, noire, écaillée de rouille ; la volute du pied, en bas.
  pied_gueridon: `
    ${trait("M34 6 L22 30", "#2a2826", 3.2)}
    <path d="M24 24 Q15 27 14 35 Q14 40 19 41 Q25 41 25 36 Q25 32 21 33" fill="none" stroke="${ENCRE}" stroke-width="6.4" stroke-linecap="round"/>
    <path d="M24 24 Q15 27 14 35 Q14 40 19 41 Q25 41 25 36 Q25 32 21 33" fill="none" stroke="#3a3633" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="27" cy="20" rx="4.2" ry="3" transform="rotate(-62 27 20)" fill="#3a3633" ${T}/>
    <path d="M31 12 l3 1.6 M29 15.6 l3 1.6" stroke="${ENCRE}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M27 19 l1.6 .6 M18 36 l1.4 -.8 M33 9 l1 .6" stroke="#a0522d" stroke-width="1.6" stroke-linecap="round"/>`,
  // Le harpon du gardien : une longue hampe brunie, la douille, la tige de fer, le fer barbelé ; deux tours de corde.
  harpon: `
    ${trait("M4 46 L27 23", "#6e5236", 3.2)}
    ${trait("M26 24 L30 20", ACIER_SOMBRE, 3.2)}
    ${trait("M30 20 L38 12", "#5a4636", 1.8)}
    <path d="M37 9 L44 4 L39 13 Z" fill="${ACIER}" ${T}/>
    <path d="M38 11 L37 16" stroke="${ENCRE}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M38 11 L37 16" stroke="${ACIER}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M22 26 l3 3 M20 28 l3 3" stroke="${CORDE}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M21 30 Q19 36 22 40" fill="none" stroke="${CORDE}" stroke-width="1.6" stroke-linecap="round"/>`,
  // Le cranequin léger : un petit pignon sur son roulement, une courte crémaillère de maillons de chaîne, la manivelle.
  cranequin_leger: `
    <circle cx="18" cy="28" r="9" fill="${ACIER_SOMBRE}" ${T}/>
    <circle cx="18" cy="28" r="5" fill="${ACIER}" ${T} stroke-width="1.2"/>
    <circle cx="18" cy="28" r="2" fill="#55524d"/>
    <path d="M18 28 L32 16 L38 18" stroke="${ENCRE}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M18 28 L32 16 L38 18" stroke="#55524d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M28 36 h14 v4 h-14 Z" fill="${ACIER}" ${T}/>
    <path d="M30 36 v4 M33.5 36 v4 M37 36 v4 M40.5 36 v4" stroke="${ENCRE}" stroke-width="1" opacity="0.7"/>`,
  // ---------- PROVISOIRE (plan 0.10, chantier F) : l'icône du pack soudé du chantier C, à retirer à l'intégration de C ----------
  pack_soude: `
    <path d="M8 16 H40 V34 H8 Z" fill="#2f7a5a" ${T}/>
    <circle cx="34" cy="21" r="2.2" fill="#7fe07a" ${T} stroke-width="1"/>`,
};
