// Les icônes du métier des familles (Book 25, 0.6) : les matières, les vestiges nouveaux, et les objets que les chantiers
// 4 à 7 fabriqueront. Même charte que icones.ts : trait d'encre, aplats de la palette, carré 48 × 48.

const ENCRE = "#3b2a1e";
const T = `stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const F = `stroke="${ENCRE}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" fill="none"`;

// Quelques briques réutilisées.
const ACIER = "#c9ccd0";
const ACIER_SOMBRE = "#8a8f96";
const BOIS = "#8a6a48";
const BOIS_CLAIR = "#c9a77a";
const CORDE = "#d8c69c";

/** Une flèche en diagonale, sa pointe dessinée à part (couleur). */
function fleche(pointe: string, empenne = "#f4ecd8"): string {
  return `
    <path d="M9 39 L36 12" stroke="${BOIS_CLAIR}" stroke-width="3" stroke-linecap="round"/>
    <path d="M9 39 L36 12" ${F}/>
    <path d="M34 10 L42 6 L38 14 Z" fill="${pointe}" ${T}/>
    <path d="M9 39 L5 35 L11 33 Z M12 36 L8 32 L14 30 Z" fill="${empenne}" ${T} stroke-width="1.4"/>`;
}

/** Un livre fermé, couverture de couleur, un dessin sur la couverture. */
function livre(couverture: string, dessin: string): string {
  return `
    <path d="M11 8 h24 a3 3 0 0 1 3 3 v28 h-24 a3 3 0 0 1 -3 -3 Z" fill="${couverture}" ${T}/>
    <path d="M14 39 v3 h24 v-3" fill="#f4ecd8" ${T}/>
    <path d="M15 8 v28" stroke="${ENCRE}" stroke-width="1" opacity="0.5"/>
    ${dessin}`;
}

/** Une lame à manche, en diagonale : forme de lame (chemin), couleur du manche. */
function lameEmmanchee(lame: string, manche = "#6b4a32"): string {
  return `
    <path d="${lame}" fill="${ACIER}" ${T}/>
    <path d="M7 41 L15 33 L19 37 L11 45 Z" fill="${manche}" ${T}/>
    <circle cx="13" cy="39" r="1" fill="${ACIER_SOMBRE}"/>`;
}

export const DESSINS_METIER: Partial<Record<string, string>> = {
  // ---------- Les matières ----------
  perche_frene: `
    <path d="M8 42 L40 6" stroke="#9a968c" stroke-width="5" stroke-linecap="round"/>
    <path d="M8 42 L40 6" ${F}/>
    <path d="M24 24 l5 2 M30 17 l-2 -5" ${F}/>
    <circle cx="40.5" cy="5.5" r="2" fill="#2b2b2b"/><circle cx="29" cy="12" r="1.5" fill="#2b2b2b"/>`,
  baton_if: `
    <path d="M10 40 L38 8" stroke="#b3432a" stroke-width="6" stroke-linecap="round"/>
    <path d="M12 41 L39 10" stroke="#e8c89a" stroke-width="2" stroke-linecap="round"/>
    <path d="M10 40 L38 8" ${F}/>
    <path d="M30 20 q6 -2 8 2 M33 15 q5 -4 8 -1" stroke="#2f4a2a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  plumes: `
    <path d="M14 40 Q14 18 30 8 Q30 26 14 40 Z" fill="#f4ecd8" ${T}/>
    <path d="M14 40 Q22 22 30 8" ${F}/>
    <path d="M22 42 Q26 22 40 16 Q36 32 22 42 Z" fill="#a07c48" ${T}/>
    <path d="M22 42 Q30 28 40 16" ${F}/>`,
  os: `
    <path d="M14 34 L32 14" stroke="#efe6d2" stroke-width="6" stroke-linecap="round"/>
    <circle cx="11" cy="33" r="4" fill="#efe6d2" ${T}/><circle cx="15" cy="37" r="4" fill="#efe6d2" ${T}/>
    <circle cx="31" cy="11" r="4" fill="#efe6d2" ${T}/><circle cx="35" cy="15" r="4" fill="#efe6d2" ${T}/>
    <path d="M17 31 L29 17" stroke="#efe6d2" stroke-width="5"/>`,
  graisse: `
    <path d="M12 22 h24 v14 a5 5 0 0 1 -5 5 h-14 a5 5 0 0 1 -5 -5 Z" fill="#b8b4ac" ${T}/>
    <ellipse cx="24" cy="22" rx="12" ry="4" fill="#f2e6b8" ${T}/>
    <path d="M18 21 q6 -5 12 0" fill="#fff6d0" ${F}/>`,
  boyaux: `
    <path d="M10 30 C14 14 24 40 30 22 S40 14 40 26" fill="none" stroke="#c8a088" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M10 30 C14 14 24 40 30 22 S40 14 40 26" ${F}/>`,

  // ---------- Les vestiges nouveaux ----------
  fil_dentaire: `
    <rect x="12" y="14" width="24" height="22" rx="7" fill="#7fd0c8" ${T}/>
    <circle cx="24" cy="25" r="5" fill="#f4ecd8" ${T}/>
    <path d="M30 17 Q40 10 42 4" stroke="#f4ecd8" stroke-width="1.5" fill="none"/>`,
  appareil_photo_jetable: `
    <rect x="7" y="15" width="34" height="20" rx="2" fill="#d8a83a" ${T}/>
    <rect x="9" y="17" width="9" height="16" fill="#2f5fa4"/>
    <circle cx="27" cy="25" r="6" fill="#2b2b2b" ${T}/><circle cx="27" cy="25" r="2.5" fill="#6b7b8c"/>
    <rect x="33" y="17" width="6" height="4" fill="#f4ecd8" ${T} stroke-width="1"/>`,
  raquette_moustiques: `
    <ellipse cx="29" cy="17" rx="12" ry="10" fill="#f4ecd8" ${T}/>
    <path d="M20 17 h18 M29 8 v18 M22 11 l14 12 M36 11 l-14 12" stroke="#9a968c" stroke-width="0.9"/>
    <path d="M22 25 L10 40" stroke="#e0c040" stroke-width="5" stroke-linecap="round"/>
    <path d="M22 25 L10 40" ${F}/>
    <path d="M39 6 l3 -3 M43 11 l3 -1" stroke="#4aa3ff" stroke-width="1.6" stroke-linecap="round"/>`,
  bobine_allumage: `
    <rect x="15" y="12" width="18" height="26" rx="3" fill="#3a3a3a" ${T}/>
    <path d="M15 18 h18 M15 24 h18 M15 30 h18" stroke="#6b7b8c" stroke-width="1.2"/>
    <rect x="20" y="6" width="8" height="6" fill="#c8362b" ${T}/>
    <path d="M33 16 h5 M33 32 h5" ${T}/>
    <path d="M38 8 l3 4 l-3 0 l3 4" stroke="#4aa3ff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  lime_usee: `
    <path d="M12 38 L34 10 L38 13 L16 41 Z" fill="${ACIER_SOMBRE}" ${T}/>
    <path d="M18 31 l4 3 M21 27 l4 3 M24 23 l4 3 M27 19 l4 3 M30 15 l4 3" stroke="#55524d" stroke-width="1"/>
    <path d="M10 44 L14 39 L17 41 L13 46 Z" fill="#b3432a" ${T}/>`,
  soc_charrue: `
    <path d="M6 32 Q16 16 40 12 L42 20 Q24 26 14 38 Z" fill="#8a5a3a" ${T}/>
    <path d="M10 33 Q20 22 40 16" stroke="${ACIER}" stroke-width="2" fill="none"/>
    <circle cx="30" cy="20" r="1.4" fill="${ENCRE}"/><circle cx="22" cy="25" r="1.4" fill="${ENCRE}"/>`,
  bidon_huile: `
    <path d="M12 14 h22 l3 4 v22 h-25 Z" fill="#c8362b" ${T}/>
    <rect x="28" y="8" width="6" height="6" fill="#d8a83a" ${T}/>
    <path d="M15 14 Q24 8 26 14" fill="none" ${T}/>
    <path d="M16 24 h16 v8 h-16 Z" fill="#f4ecd8" ${T} stroke-width="1"/>
    <path d="M24 26 q-3 3 0 5 q3 -2 0 -5" fill="#d8a83a"/>`,
  troncon_rail: `
    <path d="M6 34 h36 v5 h-36 Z" fill="#55524d" ${T}/>
    <path d="M20 22 h8 v12 h-8 Z" fill="#6b6560" ${T}/>
    <path d="M14 16 h20 v6 h-20 Z" fill="#8a8f96" ${T}/>
    <path d="M14 16 h20" stroke="#c9ccd0" stroke-width="1.5"/>`,
  arc_sportif: `
    <path d="M30 4 Q14 24 30 44" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    <circle cx="30" cy="5" r="3" fill="${ACIER}" ${T} stroke-width="1"/><circle cx="30" cy="43" r="3" fill="${ACIER}" ${T} stroke-width="1"/>
    <path d="M30 5 L30 43" stroke="#f4ecd8" stroke-width="1"/>
    <path d="M20 24 h-12" stroke="#2f5fa4" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="21" y="18" width="4" height="4" fill="#c8362b"/>`,
  fleche_carbone: fleche("#55524d", "#c8362b"),
  manuel_forgeron: livre("#b3432a", `<path d="M20 28 h12 l-2 -4 h-8 Z M24 24 v-6 l6 -4" fill="#3b2a1e" stroke="#f4ecd8" stroke-width="1"/>`),
  manuel_electricien: livre("#2f5fa4", `<path d="M27 14 l-6 10 h5 l-3 9 l8 -12 h-5 l3 -7 Z" fill="#e8d84a" ${T} stroke-width="1"/>`),
  manuel_arbalete: livre("#d8c43a", `<path d="M17 24 h16 M25 16 v16 M18 18 Q25 26 32 18" fill="none" stroke="${ENCRE}" stroke-width="1.6"/>`),

  // ---------- Tous : l'arc (chantier 4) ----------
  arc_fortune: `
    <path d="M30 5 Q12 24 30 43" fill="none" stroke="#6f9a4a" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M30 5 Q12 24 30 43" ${F}/>
    <path d="M30 5 L30 43" stroke="${CORDE}" stroke-width="1"/>`,
  ebauche_arc: `
    <path d="M10 40 Q22 14 40 8" fill="none" stroke="#9a968c" stroke-width="5" stroke-linecap="round"/>
    <path d="M10 40 Q22 14 40 8" ${F}/>
    <path d="M18 26 l3 -1 M27 15 l3 1" stroke="#6f9a4a" stroke-width="1.6"/>`,
  ebauche_arc_seche: `
    <path d="M10 40 Q22 14 40 8" fill="none" stroke="${BOIS_CLAIR}" stroke-width="5" stroke-linecap="round"/>
    <path d="M10 40 Q22 14 40 8" ${F}/>`,
  ebauche_if: `
    <path d="M10 40 Q22 14 40 8" fill="none" stroke="#b3432a" stroke-width="5" stroke-linecap="round"/>
    <path d="M12 41 Q24 16 41 10" fill="none" stroke="#e8c89a" stroke-width="1.6"/>
    <path d="M18 26 l3 -1 M27 15 l3 1" stroke="#2f4a2a" stroke-width="1.6"/>`,
  ebauche_if_seche: `
    <path d="M10 40 Q22 14 40 8" fill="none" stroke="#9a3a26" stroke-width="5" stroke-linecap="round"/>
    <path d="M12 41 Q24 16 41 10" fill="none" stroke="#e8c89a" stroke-width="1.6"/>`,
  corde_arc: `
    <circle cx="24" cy="24" r="12" fill="none" stroke="${CORDE}" stroke-width="3"/>
    <circle cx="24" cy="24" r="12" ${F}/><circle cx="24" cy="24" r="7" ${F}/>
    <path d="M33 16 q6 -6 9 -2" ${F}/>`,
  arc_simple: `
    <path d="M30 4 Q10 24 30 44" fill="none" stroke="${BOIS_CLAIR}" stroke-width="4" stroke-linecap="round"/>
    <path d="M30 4 Q10 24 30 44" ${F}/>
    <path d="M30 4 L30 44" stroke="${CORDE}" stroke-width="1.2"/>
    <path d="M18 21 h3 v6 h-3" fill="#6b4a32"/>`,
  arc_if: `
    <path d="M30 4 Q10 24 30 44" fill="none" stroke="#9a3a26" stroke-width="4" stroke-linecap="round"/>
    <path d="M31 6 Q13 24 31 42" fill="none" stroke="#e8c89a" stroke-width="1.2"/>
    <path d="M30 4 L30 44" stroke="${CORDE}" stroke-width="1.2"/>
    <path d="M18 21 h3 v6 h-3" fill="#3b2a1e"/>`,
  fleche_durcie: fleche("#3b2a1e"),
  fleche_os: fleche("#efe6d2"),
  fleche_clou: fleche(ACIER_SOMBRE),
  fleche_acier: fleche(ACIER),

  // ---------- 🔥 Charbonniers (chantier 5) ----------
  pinces_forge: `
    <path d="M8 40 L28 18 L32 10" fill="none" stroke="#55524d" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 42 L30 20 L38 14" fill="none" stroke="#55524d" stroke-width="3" stroke-linecap="round"/>
    <circle cx="29" cy="19" r="2" fill="${ACIER_SOMBRE}" ${T} stroke-width="1"/>
    <rect x="32" y="6" width="8" height="5" fill="#ff8a3d" ${T} stroke-width="1"/>`,
  hachette: `
    <path d="M10 42 L32 14" stroke="#6b4a32" stroke-width="4" stroke-linecap="round"/>
    <path d="M24 10 L38 6 Q42 14 38 22 L30 20 Z" fill="${ACIER_SOMBRE}" ${T}/>
    <path d="M37 7 Q41 14 37 21" stroke="${ACIER}" stroke-width="2" fill="none"/>`,
  hache_forgee: `
    <path d="M8 44 L34 12" stroke="#6b4a32" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M24 8 L40 2 Q46 14 40 26 L30 20 Z" fill="${ACIER_SOMBRE}" ${T}/>
    <path d="M39 3 Q45 14 39 25" stroke="${ACIER}" stroke-width="2.4" fill="none"/>`,
  machette_forgee: lameEmmanchee("M17 33 L38 8 Q44 6 42 12 L21 37 Z"),
  serpe: `
    <path d="M17 33 L30 16 Q36 6 42 12 Q38 10 34 16 L21 37 Z" fill="${ACIER}" ${T}/>
    <path d="M7 41 L15 33 L19 37 L11 45 Z" fill="#6b4a32" ${T}/>`,
  glaive: lameEmmanchee("M17 33 L36 8 L42 6 L40 12 L21 37 Z M14 30 L24 40", "#3b2a1e"),
  pointe_lance: `
    <path d="M24 4 L32 22 L24 30 L16 22 Z" fill="${ACIER}" ${T}/>
    <path d="M20 30 h8 v12 h-8 Z" fill="${ACIER_SOMBRE}" ${T}/>
    <path d="M24 8 V27" ${F}/>`,
  lance_forgee: `
    <path d="M6 44 L36 12" stroke="#7a5a3c" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M34 8 L44 4 L40 14 L35 16 Z" fill="${ACIER}" ${T}/>`,
  pointe_acier: `
    <path d="M14 34 L30 12 L34 16 Z" fill="${ACIER}" ${T}/>
    <path d="M24 38 L36 22 L39 25 Z" fill="${ACIER}" ${T}/>
    <path d="M8 26 L22 10 L25 13 Z" fill="${ACIER}" ${T}/>`,
  rivet: `
    <ellipse cx="18" cy="16" rx="8" ry="4" fill="${ACIER_SOMBRE}" ${T}/><path d="M15 18 h6 v14 h-6 Z" fill="${ACIER_SOMBRE}" ${T}/>
    <ellipse cx="32" cy="24" rx="8" ry="4" fill="${ACIER_SOMBRE}" ${T}/><path d="M29 26 h6 v14 h-6 Z" fill="${ACIER_SOMBRE}" ${T}/>`,
  ciseau_bois: `
    <path d="M26 6 h6 v20 h-6 Z" fill="${ACIER}" ${T}/>
    <path d="M26 6 l3 -3 l3 3" fill="${ACIER}" ${T} stroke-width="1"/>
    <path d="M24 26 h10 l-1 16 h-8 Z" fill="#8a5a3a" ${T}/>`,
  burin: `
    <path d="M18 8 h10 v26 l-5 8 l-5 -8 Z" fill="${ACIER_SOMBRE}" ${T}/>
    <path d="M18 14 h10" stroke="${ACIER}" stroke-width="1.5"/>`,
  ressort_retrempe: `
    <path d="M6 30 Q24 18 42 30" fill="none" stroke="#3a3a3a" stroke-width="5" stroke-linecap="round"/>
    <path d="M6 30 Q24 18 42 30" ${F}/>
    <path d="M9 25 Q24 14 39 25" fill="none" stroke="#4a6fa8" stroke-width="1.6"/>
    <circle cx="6" cy="30" r="3" fill="none" ${T}/><circle cx="42" cy="30" r="3" fill="none" ${T}/>`,
  electrodes_forgees: `
    <path d="M16 42 L18 12 L20 6 L22 12 L22 42 Z" fill="${ACIER}" ${T}/>
    <path d="M28 42 L28 12 L30 6 L32 12 L34 42 Z" fill="${ACIER}" ${T}/>
    <path d="M22 9 l3 -3 l1 4 l3 -4" stroke="#4aa3ff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,

  // ---------- ⚡ Voltaïques (chantier 6) ----------
  pack_cellules: `
    <rect x="8" y="14" width="32" height="22" rx="3" fill="#7a8fa8" ${T}/>
    <circle cx="16" cy="25" r="5" fill="#3f8f6a" ${T} stroke-width="1"/><circle cx="24" cy="25" r="5" fill="#3f8f6a" ${T} stroke-width="1"/><circle cx="32" cy="25" r="5" fill="#3f8f6a" ${T} stroke-width="1"/>
    <path d="M8 20 h32" stroke="#c9ccd0" stroke-width="3" opacity="0.8"/>
    <path d="M40 22 h4 M42 20 v4" stroke="#c8362b" stroke-width="1.6"/>`,
  module_decharge: `
    <rect x="10" y="12" width="28" height="24" rx="2" fill="#2f5f3a" ${T}/>
    <rect x="15" y="17" width="8" height="12" rx="2" fill="#2b2b2b"/><circle cx="31" cy="22" r="4" fill="#d8a83a" ${T} stroke-width="1"/>
    <path d="M38 18 h6 M38 30 h6" stroke="#c8743a" stroke-width="1.6"/>
    <path d="M26 6 l-3 4 h4 l-3 4" stroke="#4aa3ff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  matraque_fortune: `
    <path d="M10 40 L32 14" stroke="#7a5a3c" stroke-width="7" stroke-linecap="round"/>
    <path d="M10 40 L32 14" ${F}/>
    <rect x="22" y="20" width="9" height="6" transform="rotate(-50 26 23)" fill="#d8a83a" ${T} stroke-width="1"/>
    <path d="M33 11 l5 -5 M35 15 l6 -2" stroke="#4aa3ff" stroke-width="1.8" stroke-linecap="round"/>`,
  matraque_electrique: `
    <path d="M10 40 L30 16" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/>
    <path d="M28 18 L36 9" stroke="#55606a" stroke-width="5" stroke-linecap="round"/>
    <path d="M35 8 l2 -4 M39 11 l4 -2" stroke="${ACIER}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M37 4 l3 4 l2 -3" stroke="#4aa3ff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  aiguillon: `
    <path d="M6 44 L36 12" stroke="#7a5a3c" stroke-width="3.5" stroke-linecap="round"/>
    <rect x="31" y="11" width="6" height="8" transform="rotate(-45 34 15)" fill="#2f5f3a" ${T} stroke-width="1"/>
    <path d="M37 9 l4 -5 M40 12 l5 -3" stroke="${ACIER}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M42 3 l2 3 l2 -2" stroke="#4aa3ff" stroke-width="1.4" fill="none"/>`,
  lampe_bricolee: `
    <path d="M10 18 h18 v14 h-18 Z" fill="#7a8fa8" ${T}/>
    <path d="M28 14 h8 l4 -4 v28 l-4 -4 h-8 Z" fill="#b8b4ac" ${T}/>
    <path d="M40 16 l6 -3 M40 24 h7 M40 32 l6 3" stroke="#f4e9a0" stroke-width="2" stroke-linecap="round"/>`,
  ventilateur_forge: `
    <circle cx="24" cy="24" r="15" fill="#55606a" ${T}/>
    <path d="M24 24 Q30 12 34 18 Z M24 24 Q36 30 30 34 Z M24 24 Q12 30 14 22 Z M24 24 Q18 12 24 10 Z" fill="#c9ccd0" ${T} stroke-width="1"/>
    <circle cx="24" cy="24" r="3" fill="#2b2b2b"/>`,
  electrificateur: `
    <rect x="10" y="12" width="28" height="26" rx="3" fill="#d8a83a" ${T}/>
    <path d="M27 16 l-6 10 h5 l-3 9 l8 -12 h-5 l3 -7 Z" fill="#2b2b2b"/>
    <path d="M38 20 h6 M38 30 h6" stroke="#c8743a" stroke-width="1.8"/>`,

  // ---------- ⚙️ Mécanistes (chantier 7) ----------
  arbrier: `
    <path d="M6 30 L40 18 L42 24 L10 36 Z" fill="${BOIS}" ${T}/>
    <path d="M14 30 L38 21" stroke="#5a4130" stroke-width="1.6"/>
    <rect x="22" y="24" width="5" height="5" fill="#3b2a1e"/>`,
  noix_detente: `
    <circle cx="20" cy="20" r="9" fill="#efe6d2" ${T}/><path d="M20 11 v6 M14 20 h-4" ${T}/>
    <path d="M24 28 L30 42 L34 40 L28 27 Z" fill="${ACIER_SOMBRE}" ${T}/>
    <path d="M34 12 q4 2 0 4 q-4 2 0 4 q4 2 0 4" ${F}/>`,
  arc_arbalete: `
    <path d="M4 30 Q24 14 44 30" fill="none" stroke="#3a3a3a" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M4 30 Q24 14 44 30" ${F}/>
    <rect x="20" y="18" width="8" height="6" fill="${ACIER_SOMBRE}" ${T} stroke-width="1"/>`,
  corde_arbalete: `
    <path d="M6 24 Q24 34 42 24" fill="none" stroke="${CORDE}" stroke-width="4"/>
    <path d="M6 24 Q24 34 42 24" ${F}/>
    <circle cx="6" cy="24" r="3" fill="none" ${T}/><circle cx="42" cy="24" r="3" fill="none" ${T}/>`,
  arbalete: `
    <path d="M10 42 L34 14" stroke="${BOIS}" stroke-width="6" stroke-linecap="round"/>
    <path d="M22 6 Q34 6 42 18" fill="none" stroke="${BOIS_CLAIR}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M22 6 L42 18" stroke="${CORDE}" stroke-width="1.2"/>
    <path d="M20 32 l-4 5" ${T}/>`,
  arbalete_lourde: `
    <path d="M10 42 L34 14" stroke="#5a4130" stroke-width="7" stroke-linecap="round"/>
    <path d="M20 5 Q34 4 43 19" fill="none" stroke="#3a3a3a" stroke-width="4" stroke-linecap="round"/>
    <path d="M22 8 Q33 8 40 19" fill="none" stroke="#3a3a3a" stroke-width="3" stroke-linecap="round"/>
    <path d="M20 5 L43 19" stroke="${CORDE}" stroke-width="1.4"/>
    <path d="M20 32 l-4 5" ${T}/>`,
  cranequin: `
    <circle cx="20" cy="26" r="11" fill="${ACIER_SOMBRE}" ${T}/>
    <circle cx="20" cy="26" r="4" fill="#55524d" ${T} stroke-width="1"/>
    <path d="M20 26 L36 12 L42 14" stroke="#55524d" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M30 34 h14 v4 h-14 Z" fill="${ACIER}" ${T}/>`,
  carreau: `
    <path d="M12 36 L34 14" stroke="${BOIS}" stroke-width="4" stroke-linecap="round"/>
    <path d="M32 12 L40 8 L36 16 Z" fill="#efe6d2" ${T}/>
    <path d="M12 36 L8 34 L12 30 Z" fill="#f4ecd8" ${T} stroke-width="1.2"/>`,
  carreau_acier: `
    <path d="M12 36 L34 14" stroke="${BOIS}" stroke-width="4" stroke-linecap="round"/>
    <path d="M32 12 L41 7 L36 16 Z" fill="${ACIER}" ${T}/>
    <path d="M12 36 L8 34 L12 30 Z" fill="#f4ecd8" ${T} stroke-width="1.2"/>`,
  manche_tourne: `
    <path d="M10 38 L36 12" stroke="${BOIS_CLAIR}" stroke-width="7" stroke-linecap="round"/>
    <path d="M14 30 l4 4 M20 24 l4 4 M26 18 l4 4" stroke="#8a6a48" stroke-width="1.5"/>
    <path d="M10 38 L36 12" ${F}/>`,
  brouette: `
    <path d="M8 16 h26 l-4 14 h-20 Z" fill="#7f8f3a" ${T}/>
    <circle cx="36" cy="34" r="7" fill="none" ${T} stroke-width="2.6"/><circle cx="36" cy="34" r="1.6" fill="${ENCRE}"/>
    <path d="M30 28 L36 34 M8 16 L4 12 M10 30 L8 40" ${T}/>`,

  // ---------- Les installations du métier (chantiers 6 et 7) ----------
  alarme_electrique: `
    <path d="M8 40 V20 M40 40 V20" ${T} stroke-width="2.6"/>
    <path d="M8 26 L40 26" stroke="${ACIER_SOMBRE}" stroke-width="1.4"/>
    <circle cx="24" cy="16" r="4" fill="#e8d84a" ${T} stroke-width="1"/>
    <path d="M24 9 v-3 M30 12 l2 -2 M18 12 l-2 -2" stroke="#e8d84a" stroke-width="1.5"/>`,
  cloture_fortune: `
    <path d="M8 42 V14 M24 42 V14 M40 42 V14" stroke="${BOIS}" stroke-width="3" stroke-linecap="round"/>
    <path d="M8 20 H40 M8 30 H40" stroke="${ACIER_SOMBRE}" stroke-width="1.4"/>
    <path d="M28 8 l-3 5 h4 l-3 5" stroke="#4aa3ff" stroke-width="1.6" fill="none"/>`,
  cloture_electrique: `
    <path d="M8 42 V12 M24 42 V12 M40 42 V12" stroke="${BOIS}" stroke-width="3" stroke-linecap="round"/>
    <path d="M8 18 H40 M8 26 H40 M8 34 H40" stroke="${ACIER_SOMBRE}" stroke-width="1.4"/>
    <rect x="6" y="16" width="4" height="4" fill="#e8d84a"/><rect x="22" y="16" width="4" height="4" fill="#e8d84a"/><rect x="38" y="16" width="4" height="4" fill="#e8d84a"/>`,
  plaque_choc: `
    <path d="M6 32 L24 24 L42 32 L24 40 Z" fill="${ACIER}" ${T}/>
    <path d="M22 10 l-4 8 h5 l-3 8" stroke="#4aa3ff" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  bain_derouillage: `
    <path d="M10 20 h28 v14 a6 6 0 0 1 -6 6 h-16 a6 6 0 0 1 -6 -6 Z" fill="#c9ccd0" ${T}/>
    <ellipse cx="24" cy="20" rx="14" ry="3.5" fill="#7fb0c8" ${T}/>
    <path d="M30 6 V24" stroke="#8a5a3a" stroke-width="3"/>
    <circle cx="20" cy="18" r="1" fill="#f4ecd8"/><circle cx="26" cy="16" r="1" fill="#f4ecd8"/>`,
  collet: `
    <path d="M24 40 V8" stroke="${BOIS}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="24" cy="30" rx="9" ry="6" fill="none" stroke="${CORDE}" stroke-width="2"/>
    <ellipse cx="24" cy="30" rx="9" ry="6" ${F}/>`,
  assommoir: `
    <path d="M8 18 L40 10 L42 16 L10 24 Z" fill="${BOIS}" ${T}/>
    <path d="M12 42 L18 22 M36 42 L32 16" ${T} stroke-width="2.6"/>
    <path d="M18 34 h12" ${T}/>`,
  machoires_fortune: `
    <path d="M6 30 Q14 14 24 28 Q34 14 42 30" fill="none" stroke="#3a3a3a" stroke-width="4" stroke-linecap="round"/>
    <path d="M10 24 l2 3 M16 20 l1 4 M32 20 l-1 4 M38 24 l-2 3" ${T} stroke-width="1.6"/>
    <path d="M6 34 H42" stroke="#55524d" stroke-width="3"/>`,
  piege_machoires: `
    <path d="M6 30 Q14 12 24 28 Q34 12 42 30" fill="none" stroke="#4a6fa8" stroke-width="4" stroke-linecap="round"/>
    <path d="M10 23 l2 3 M16 18 l1 4 M32 18 l-1 4 M38 23 l-2 3" ${T} stroke-width="1.6"/>
    <path d="M6 34 H42" stroke="#55524d" stroke-width="3"/>
    <path d="M24 34 v8 M21 42 h6" stroke="${ACIER_SOMBRE}" stroke-width="2"/>`,
  fosse_pieux: `
    <path d="M4 24 Q24 18 44 24 L40 42 H8 Z" fill="#6b5440" ${T}/>
    <path d="M14 40 L16 28 L18 40 M23 40 L25 26 L27 40 M32 40 L34 28 L36 40" fill="${BOIS_CLAIR}" ${T} stroke-width="1.2"/>`,
  tour_perche: `
    <path d="M6 40 H42 M10 40 V24 M38 40 V24" ${T} stroke-width="2.6"/>
    <path d="M10 26 H38" stroke="${BOIS_CLAIR}" stroke-width="5" stroke-linecap="round"/>
    <path d="M24 26 V6 Q30 4 40 4" fill="none" stroke="#9a968c" stroke-width="2.4"/>
    <path d="M24 22 v-2 M24 30 v8" stroke="${CORDE}" stroke-width="1.6"/>`,
};
