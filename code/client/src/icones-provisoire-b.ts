// ============================================================================================================
// PROVISOIRE, CHANTIER B (0.10) : à retirer à l'intégration (le chantier B dessine les vraies icônes).
// ============================================================================================================
// Des silhouettes simples des objets que `commun/src/provisoire-chantier-b.ts` déclare, pour que le chantier C compile
// et que le test des icônes passe. Même charte que les autres (trait d'encre, 48 × 48).

const ENCRE = "#3b2a1e";
const T = `stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

export const DESSINS_PROVISOIRES_B: Readonly<Record<string, string>> = {
  tube_aluminium: `<rect x="8" y="21" width="32" height="6" rx="3" fill="#d4d8dc" ${T}/><ellipse cx="38" cy="24" rx="2" ry="3" fill="#8a8f96" ${T}/>`,
  toles_ondulees: `<path d="M6 30 Q10 22 14 30 Q18 22 22 30 Q26 22 30 30 Q34 22 38 30 Q42 22 42 30 V36 H6 Z" fill="#a9b0b5" ${T}/>`,
  couvertures_laine: `<rect x="8" y="14" width="32" height="10" rx="2" fill="#8c3b2e" ${T}/><rect x="8" y="24" width="32" height="10" rx="2" fill="#a8574a" ${T}/>`,
  lanterne_tempete: `<path d="M18 14 H30 L32 34 H16 Z" fill="#f2d68a" ${T}/><path d="M20 10 Q24 4 28 10" fill="none" ${T}/><rect x="15" y="34" width="18" height="5" fill="#b5442e" ${T}/>`,
  fer_souder: `<rect x="8" y="21" width="18" height="7" rx="3" fill="#3f5f7a" ${T}/><path d="M26 24.5 H40" ${T} stroke-width="3"/>`,
  porte_four: `<path d="M10 36 V20 Q24 6 38 20 V36 Z" fill="#3a3633" ${T}/><circle cx="31" cy="28" r="2" fill="#8a8f96" ${T}/>`,
  jerrican_20l: `<rect x="12" y="12" width="24" height="28" rx="3" fill="#3f7a3a" ${T}/><rect x="16" y="8" width="8" height="5" fill="#2b5a28" ${T}/>`,
  rabot: `<path d="M8 32 L12 24 H36 L40 32 Z" fill="#7a5a3a" ${T}/><path d="M20 24 Q22 14 30 16" fill="none" ${T}/>`,
  cloche_bronze: `<path d="M14 34 Q14 14 24 12 Q34 14 34 34 Z" fill="#b8863b" ${T}/><circle cx="24" cy="37" r="2.5" fill="#5c5650" ${T}/>`,
  soufflet_forge: `<path d="M8 24 L30 12 L30 36 Z" fill="#6b4a2e" ${T}/><path d="M30 22 H40 V26 H30" fill="#8a8f96" ${T}/>`,
};
