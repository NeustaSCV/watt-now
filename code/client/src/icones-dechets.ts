// Icônes du lot 2 des vestiges (0.7) : les déchets de l'Abondance (proposition « objets et déchets » §3 et §5.1,
// chiffrage graphique §2.3, décision Q-G4 : toutes dessinées). Même charte que icones.ts : carré 48 × 48, trait
// d'encre, aplats de la palette, une silhouette franche qui se lit sur une case de 46 px (iPhone 13 mini).
//
// On y trouve aussi les retardataires du lot 1 (réveil, roulements, radio… ajoutés entre la 0.4 et la 0.6, restés à
// l'icône générique) et la décharge, pour qu'aucun objet ne garde l'icône de repli.

const ENCRE = "#3b2a1e";
const T = `stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

/** Un trait épais cerné d'encre (tubes, cadres, manches) : l'encre dessous, la couleur dessus. */
function trait(d: string, couleur: string, largeur = 2.6): string {
  return `<path d="${d}" fill="none" stroke="${ENCRE}" stroke-width="${largeur + 2.2}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${couleur}" stroke-width="${largeur}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Une couronne dentée (disque de scie) : `n` dents entre les rayons r1 et r2 ; les dents de `manquantes` sont cassées. */
function couronneDentee(cx: number, cy: number, r1: number, r2: number, n: number, manquantes: readonly number[]): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const b = ((i + 0.55) / n) * Math.PI * 2;
    const pointe = manquantes.includes(i) ? r1 : r2;
    pts.push(`${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)}`);
    pts.push(`${(cx + Math.cos(b) * pointe).toFixed(1)} ${(cy + Math.sin(b) * pointe).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/** Un cœur centré en (x, y), de demi-largeur `r`. */
function coeur(x: number, y: number, r: number): string {
  return `M${x} ${y + r * 1.1} L${x - r} ${y} A${r / 2} ${r / 2} 0 0 1 ${x} ${y - r * 0.4} A${r / 2} ${r / 2} 0 0 1 ${x + r} ${y} Z`;
}

/** Un spire d'un gros ressort vu de face : l'arrière sombre, l'avant clair (le ressort de suspension). */
function spires(ys: readonly number[], clair: string, sombre: string): string {
  const arriere = ys.map((y) => `M12 ${y} A12 3.6 0 0 1 36 ${y}`).join(" ");
  const avant = ys.map((y) => `M12 ${y} A12 3.6 0 0 0 36 ${y}`).join(" ");
  return `${trait(arriere, sombre, 2.4)}${trait(avant, clair, 3)}`;
}

/** Une pince à linge en bois, debout, centrée en x = 16 (deux mâchoires, une encoche, le ressort) ; COULEUR à remplacer. */
const PINCE = `
      <path d="M13.5 4 H16 V41 H13.5 Q12 41 12 39.5 V31 L13.4 27.5 L12 24 V5.5 Q12 4 13.5 4 Z" fill="COULEUR" ${T} stroke-width="1.6"/>
      <path d="M16 4 H18.5 Q20 4 20 5.5 V24 L18.6 27.5 L20 31 V39.5 Q20 41 18.5 41 H16 Z" fill="COULEUR" ${T} stroke-width="1.6"/>
      <rect x="10.5" y="14" width="11" height="5" rx="1.2" fill="#8a8f96" ${T} stroke-width="1.3"/>
      <path d="M13 14 v5 M15.5 14 v5 M18 14 v5" stroke="#c9ccd0" stroke-width="1"/>`;

export const DESSINS_DECHETS: Record<string, string> = {
  // ---- Emballages et ordures (famille déchet) ----
  canette: `
    <path d="M14 10 V17 L18 22 L13 27 L18 32 L14 36 V40 A10 3.5 0 0 0 34 40 V36 L30 32 L35 27 L30 22 L34 17 V10 Z" fill="#3f8fb0" ${T}/>
    <ellipse cx="24" cy="10" rx="10" ry="3.5" fill="#d6d8dc" ${T}/>
    <path d="M18 22 H30 M13 27 H35 M18 32 H30" stroke-width="1.2" fill="none" ${T}/>
    <path d="M15.5 14 H32.5" stroke="#c9ccd0" stroke-width="2.4"/>
    <path d="M22 9.5 h4" stroke="${ENCRE}" stroke-width="1.6" stroke-linecap="round"/>`,
  sac_canettes: `
    <rect x="13" y="24" width="8" height="12" rx="1.5" transform="rotate(-15 17 30)" fill="#3f8fb0" ${T} stroke-width="1.4"/>
    <rect x="25" y="22" width="8" height="12" rx="1.5" transform="rotate(12 29 28)" fill="#c8362b" ${T} stroke-width="1.4"/>
    <rect x="18" y="31" width="8" height="12" rx="1.5" transform="rotate(80 22 37)" fill="#c9ccd0" ${T} stroke-width="1.4"/>
    <path d="M10 18 Q7 40 14 43 H34 Q41 40 38 18 Q31 15 24 18 Q17 15 10 18 Z" fill="#dfe8ea" fill-opacity="0.55" ${T}/>
    <path d="M20 17 Q15 8 22 11 M28 17 Q33 8 26 11" fill="none" ${T}/>
    <circle cx="24" cy="15" r="2.4" fill="#dfe8ea" ${T} stroke-width="1.4"/>
    <path d="M12 22 Q14 30 13 38" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.8"/>`,
  bouteille_plastique: `
    <path d="M21 9 h6 v3 q6 3 6 9 v18 q0 4 -4 4 h-10 q-4 0 -4 -4 v-18 q0 -6 6 -9 Z" fill="#cfe3ec" ${T}/>
    <rect x="20.5" y="4" width="7" height="5" rx="1" fill="#2f6fa4" ${T}/>
    <path d="M15 23 h18 v7 h-18 Z" fill="#5f9fc8" ${T} stroke-width="1.4"/>
    <path d="M18 26.5 q3 -2 6 0 t6 0" stroke="#f4ecd8" stroke-width="1.4" fill="none"/>
    <path d="M16 34 h16 M16 38 h16" stroke-width="1" opacity="0.5" ${T}/>
    <path d="M18.5 15 q-1.6 2.5 -1.6 5" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  sac_plastique: `
    <path d="M14 17 Q13 6 19 6 Q24 6 22 17 M26 17 Q24 6 29 6 Q35 6 34 17" fill="none" ${T} stroke-width="2.2"/>
    <path d="M9 16 L39 16 L41 39 Q24 45 7 39 Z" fill="#f0ece2" ${T}/>
    <path d="M14 23 L20 29 M32 21 L29 33 M13 34 L19 37 M35 36 L31 39" stroke-width="1.2" opacity="0.5" fill="none" ${T}/>
    <path d="M18 27 Q24 33 30 27" stroke="#c8362b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <circle cx="20" cy="23" r="1.3" fill="#c8362b"/><circle cx="28" cy="23" r="1.3" fill="#c8362b"/>`,
  barquette: `
    <path d="M5 22 L7 31 L24 41 L41 31 L43 22 L24 32 Z" fill="#dedcd2" ${T}/>
    <path d="M5 22 L24 13 L43 22 L24 32 Z" fill="#f6f6f0" ${T}/>
    <path d="M12 22 L24 16.5 L36 22 L24 28 Z" fill="#ffffff" ${T} stroke-width="1.2"/>
    <ellipse cx="21" cy="22" rx="3.4" ry="1.6" fill="#e8a8b8"/>
    <path d="M26 21 l3 1.4 M27 23.5 l2 1" stroke="#7f8a7a" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M10 28 l1 3 M16 32 l1 3 M32 32 l-1 3 M38 28 l-1 3" stroke-width="1" opacity="0.5" ${T}/>`,
  gobelet: `
    <path d="M14 15 h20 l-3 28 h-14 Z" fill="#f4f0e6" ${T}/>
    <path d="M14.8 22 h18.4 l-0.9 10 h-16.6 Z" fill="#a07c48" ${T} stroke-width="1.6"/>
    <path d="M11 10 h26 l-1 5 h-24 Z" fill="#f4ecd8" ${T}/>
    <rect x="27" y="7" width="5" height="3" rx="1" fill="#f4ecd8" ${T} stroke-width="1.4"/>
    <path d="M19.5 37.5 h9" stroke-width="1.2" stroke-dasharray="2 1.6" ${T}/>
    <path d="M22 26 q2 3 4 0" stroke="#f4ecd8" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  boite_capsules: `
    <path d="M10 25 l1.6 -8 h5.2 l1.6 8 Z" fill="#c8362b" ${T} stroke-width="1.4"/>
    <path d="M17 24 l1.6 -9 h5.2 l1.6 9 Z" fill="#d8c43a" ${T} stroke-width="1.4"/>
    <path d="M24 24 l1.6 -8 h5.2 l1.6 8 Z" fill="#2f5fa4" ${T} stroke-width="1.4"/>
    <path d="M30 25 l1.6 -9 h5.2 l1.6 9 Z" fill="#5f7f45" ${T} stroke-width="1.4"/>
    <path d="M8 23 L3 17 L14 18 Z M40 23 L45 17 L34 18 Z" fill="#b8946a" ${T} stroke-width="1.6"/>
    <path d="M8 23 h32 v19 h-32 Z" fill="#c9a77a" ${T}/>
    <path d="M14 31 h20 M16 35 h16" stroke="#f4ecd8" stroke-width="2" stroke-linecap="round"/>`,
  paquet_chips: `
    <path d="M12 9 h24 q-3 15 0 30 h-24 q3 -15 0 -30 Z" fill="#d8c43a" ${T}/>
    <path d="M11 6 h26 v4 h-26 Z M11 38 h26 v4 h-26 Z" fill="#c8a83a" ${T} stroke-width="1.6"/>
    <path d="M14 6 v4 M18 6 v4 M22 6 v4 M26 6 v4 M30 6 v4 M34 6 v4 M14 38 v4 M18 38 v4 M22 38 v4 M26 38 v4 M30 38 v4 M34 38 v4" stroke-width="0.9" ${T}/>
    <circle cx="24" cy="24" r="7.5" fill="#c8362b" ${T} stroke-width="1.6"/>
    <path d="M19.5 25 Q21 19 26 20 Q30 22 28.5 26 Q25 29 19.5 25 Z" fill="#f0d070" ${T} stroke-width="1.2"/>
    <path d="M15 14 l4 4" stroke="#f4ecd8" stroke-width="1.6" stroke-linecap="round"/>`,
  brique_lait: `
    <path d="M28 17 l8 -3 v25 l-8 3 Z" fill="#c9ccd0" ${T}/>
    <path d="M12 17 L20 9 L28 17 Z" fill="#e8eef4" ${T}/>
    <path d="M20 9 L28 6 L36 14 L28 17 Z" fill="#b8bcc2" ${T}/>
    <path d="M18 9 l2 -3 h8 l-2 3" fill="#e8eef4" ${T} stroke-width="1.4"/>
    <path d="M12 17 h16 v25 h-16 Z" fill="#f4f4ee" ${T}/>
    <path d="M12 27 h16 v8 h-16 Z" fill="#2f6fa4" ${T} stroke-width="1.4"/>
    <ellipse cx="18" cy="31" rx="2.6" ry="1.8" fill="#f4f4ee"/><ellipse cx="23.5" cy="30" rx="1.8" ry="1.3" fill="#f4f4ee"/>`,
  boite_pizza: `
    <path d="M5 23 v6 L24 39 L43 29 v-6 L24 33 Z" fill="#a88458" ${T}/>
    <path d="M5 23 L24 13 L43 23 L24 33 Z" fill="#c9a77a" ${T}/>
    <ellipse cx="19" cy="23" rx="5.5" ry="2.8" fill="#8a6a3e" opacity="0.55"/>
    <ellipse cx="30" cy="25.5" rx="3.2" ry="1.7" fill="#8a6a3e" opacity="0.55"/>
    <path d="M24 17 L31 20.5 L24 22.5 Z" fill="#c8362b" ${T} stroke-width="1.2"/>
    <circle cx="26" cy="19.8" r="0.9" fill="#f4ecd8"/>
    <path d="M10 29 l3 1.6 M35 33 l3 -1.6" stroke-width="1" opacity="0.6" ${T}/>`,
  coque_plastique: `
    <rect x="9" y="7" width="30" height="36" rx="5" fill="#c8362b" ${T}/>
    <circle cx="24" cy="11" r="1.8" fill="#f4ecd8" ${T} stroke-width="1"/>
    <rect x="13" y="15" width="22" height="25" rx="6" fill="#e6f2f6" fill-opacity="0.85" ${T} stroke-width="1.4"/>
    ${trait("M20 18 L29 32 M28 18 L19 32", "#8a8f96", 1.8)}
    <circle cx="17.5" cy="35" r="3" fill="none" stroke="#2f5fa4" stroke-width="2.2"/>
    <circle cx="30.5" cy="35" r="3" fill="none" stroke="#2f5fa4" stroke-width="2.2"/>
    <path d="M16 18 L16 26" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>`,
  prospectus: `
    <rect x="10" y="9" width="23" height="30" rx="1" transform="rotate(-14 22 24)" fill="#d8c43a" ${T}/>
    <rect x="13" y="9" width="23" height="30" rx="1" transform="rotate(8 25 24)" fill="#f4ecd8" ${T}/>
    <rect x="12" y="9" width="23" height="30" rx="1" transform="rotate(-3 24 24)" fill="#e8a8b8" ${T}/>
    <g transform="rotate(-3 24 24)">
      <circle cx="19" cy="18" r="2.8" fill="none" stroke="#c8362b" stroke-width="2"/>
      <circle cx="28" cy="27" r="2.8" fill="none" stroke="#c8362b" stroke-width="2"/>
      <path d="M29 16 L18 29" stroke="#c8362b" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M16 34 h15" stroke="#f4ecd8" stroke-width="2" stroke-linecap="round"/>
    </g>`,
  carton: `
    <path d="M5 15 L34 9 L43 33 L14 39 Z" fill="#c9a26a" ${T}/>
    <path d="M19.5 12 L28.5 36" stroke-width="1.2" fill="none" ${T}/>
    <path d="M8.5 24.5 L39 18" stroke="#e8d8a8" stroke-width="4.4"/>
    <path d="M33 34 v-6 M30.6 30.2 l2.4 -2.4 l2.4 2.4" stroke-width="1.4" fill="none" ${T}/>
    <path d="M10 31 l6 -1.2 M11 34 l4 -0.8" stroke-width="1.2" opacity="0.6" ${T}/>`,
  ticket_caisse: `
    <path d="M22 18 h16 v24 l-2.7 -2.2 l-2.7 2.2 l-2.7 -2.2 l-2.7 2.2 l-2.7 -2.2 l-2.5 2.2 Z" fill="#ffffff" ${T}/>
    <path d="M26 26 h9 M26 29.5 h6 M26 33 h9 M30 37 h5" stroke-width="1.1" ${T}/>
    <circle cx="16" cy="18" r="10" fill="#f4f4ee" ${T}/>
    <circle cx="16" cy="18" r="6.5" fill="none" ${T} stroke-width="1"/>
    <circle cx="16" cy="18" r="3" fill="#c9ccd0" ${T} stroke-width="1.4"/>`,
  magazine: `
    <rect x="13" y="7" width="25" height="34" rx="1" transform="rotate(5 25 24)" fill="#f4ecd8" ${T}/>
    <g transform="rotate(-5 24 24)">
      <rect x="10" y="7" width="26" height="34" rx="1" fill="#e8a8b8" ${T}/>
      <rect x="10" y="7" width="26" height="8" fill="#c8362b" ${T} stroke-width="1.6"/>
      <path d="M14 11 h18" stroke="#f4ecd8" stroke-width="2" stroke-linecap="round"/>
      <path d="M23 34 Q16 30 17 23 Q21 25 23 30 Q25 25 29 23 Q30 30 23 34 Z" fill="#f4ecd8" ${T} stroke-width="1.4"/>
      <path d="M23 34 Q20 26 23 20 Q26 26 23 34 Z" fill="#f2c8d4" ${T} stroke-width="1.4"/>
      <path d="M14 37.5 h7" stroke="#c8362b" stroke-width="1.6" stroke-linecap="round"/>
    </g>`,
  billets: `
    <rect x="7" y="13" width="34" height="18" rx="1.5" transform="rotate(-9 24 22)" fill="#8fb38a" ${T}/>
    <rect x="7" y="18" width="34" height="18" rx="1.5" fill="#b4d0a8" ${T}/>
    <rect x="10" y="21" width="28" height="12" rx="1" fill="none" stroke="#5f8f5a" stroke-width="1.2"/>
    <circle cx="29" cy="27" r="4" fill="#8fb38a" stroke="#5f8f5a" stroke-width="1.2"/>
    <rect x="15" y="16.5" width="6" height="21" fill="#f4ecd8" ${T} stroke-width="1.4"/>
    <path d="M34 22 l1.6 0 M12 32 l1.6 0" stroke="#5f8f5a" stroke-width="1.6" stroke-linecap="round"/>`,
  carte_platine: `
    <g transform="rotate(-10 24 24)">
      <rect x="6" y="12" width="36" height="24" rx="3" fill="#d6d8dc" ${T}/>
      <rect x="11" y="18" width="8" height="6.5" rx="1.2" fill="#d8c43a" ${T} stroke-width="1.2"/>
      <path d="M11 21.2 h8 M15 18 v6.5" stroke="#a88a2a" stroke-width="0.8"/>
      <path d="M31 18 q2 3 0 6 M34 16 q3 5 0 10" fill="none" ${T} stroke-width="1.3"/>
      <path d="M11 30 h5 M18.5 30 h5 M26 30 h5" stroke="#55524d" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M9 14.5 L22 14.5" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>
    </g>`,
  cartes_fidelite: `
    <rect x="11" y="11" width="26" height="17" rx="2.5" transform="rotate(-28 24 40)" fill="#c8362b" ${T}/>
    <rect x="11" y="11" width="26" height="17" rx="2.5" transform="rotate(-9 24 40)" fill="#d8c43a" ${T}/>
    <rect x="11" y="11" width="26" height="17" rx="2.5" transform="rotate(10 24 40)" fill="#2f5fa4" ${T}/>
    <rect x="11" y="11" width="26" height="17" rx="2.5" transform="rotate(28 24 40)" fill="#5f9f55" ${T}/>
    <g transform="rotate(28 24 40)">
      <path d="M15 22 h12" stroke="#f4ecd8" stroke-width="2" stroke-linecap="round"/>
      <circle cx="31" cy="16" r="2.4" fill="#f4ecd8"/>
    </g>`,
  bouteille_verre: `
    <path d="M21 8 h6 v7 q7 4 7 11 v14 q0 3 -3 3 h-14 q-3 0 -3 -3 v-14 q0 -7 7 -11 Z" fill="#3f6a3a" ${T}/>
    <rect x="20.5" y="4" width="7" height="6" rx="1" fill="#8e1c2e" ${T} stroke-width="1.6"/>
    <rect x="15" y="27" width="18" height="10" rx="1" fill="#f4ecd8" ${T} stroke-width="1.4"/>
    <path d="M19 31 h10 M21 34 h6" stroke="#8e1c2e" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M17.5 21 v4" stroke="#9fc89a" stroke-width="1.8" stroke-linecap="round"/>`,
  briquet_vide: `
    <rect x="15" y="17" width="18" height="25" rx="3" fill="#f2cfae" fill-opacity="0.9" ${T}/>
    <path d="M17 38.5 h14" stroke="#c8743a" stroke-width="2" stroke-linecap="round"/>
    <path d="M15 17 h14 v-7 h-9 l-5 4 Z" fill="#c9ccd0" ${T}/>
    <circle cx="20.5" cy="11.5" r="3.2" fill="#8f8a80" ${T} stroke-width="1.6"/>
    <path d="M30.5 8 l2.5 -2.5 M33 11 l3.4 0 M31.5 5 l0 -2.6" stroke="#ff8a3d" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M18 22 v12" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>`,
  // La conserve bombée est un piège (Q9) : la même conserve que la bonne (étiquette rouge), le couvercle gonflé.
  conserve_bombee: `
    <path d="M12 12 Q9.5 25 12 38 Q24 48 36 38 Q38.5 25 36 12 Z" fill="#b8b4ac" ${T}/>
    <path d="M10.9 19 h26.2 v13 h-26.2 Z" fill="#c8362b" ${T}/>
    <path d="M18 25.5 l3 -3 l3 3 l3 -3 l3 3" stroke="#f4ecd8" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M12 12 Q24 0 36 12 Q24 17 12 12 Z" fill="#d6d2ca" ${T}/>
    <path d="M18 8 Q22 5.5 26 6" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M39 9 q3 -2.5 0 -5 q-3 -2.5 0 -5 M43 15 q3 -2.5 0 -5" stroke="#7f8f3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  bidon_lave_glace: `
    <path d="M27 14 V8 H36 Q39 8 39 12 V21 H34 V13 H31 V14 Z" fill="#8cc8e0" ${T}/>
    <path d="M9 14 h24 q6 0 6 7 v19 q0 3 -3 3 h-24 q-3 0 -3 -3 Z" fill="#8cc8e0" ${T}/>
    <rect x="11" y="8" width="8" height="6" rx="1" fill="#2f6fa4" ${T}/>
    <rect x="12" y="23" width="17" height="13" rx="1" fill="#f4ecd8" ${T} stroke-width="1.4"/>
    <path d="M20.5 25.5 q-3.6 4.6 0 7.4 q3.6 -2.8 0 -7.4 Z" fill="#2f6fa4"/>
    <path d="M36 26 v12" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`,
  pot_peinture: `
    <path d="M11 17 Q24 2 37 17" fill="none" ${T} stroke-width="1.8"/>
    <path d="M11 17 h26 v20 a13 4 0 0 1 -26 0 Z" fill="#c9ccd0" ${T}/>
    <path d="M11 24 h26 v9 h-26 Z" fill="#f4f0e6" ${T} stroke-width="1.4"/>
    <path d="M15 28.5 h18" stroke="#e8d8a8" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="24" cy="17" rx="13" ry="4" fill="#f4f0e6" ${T}/>
    <path d="M14.5 19 v7 a1.7 1.7 0 0 0 3.4 0 v-5.5" fill="#f4f0e6" ${T} stroke-width="1.2"/>`,
  // L'os en nylon, l'autre piège : un os, mais trop lisse et trop rose.
  os_nylon: `
    <g transform="rotate(-28 24 24)">
      <path d="M16 20 H32 A5 5 0 1 1 39 24 A5 5 0 1 1 32 28 H16 A5 5 0 1 1 9 24 A5 5 0 1 1 16 20 Z" fill="#f2a6bc" ${T}/>
      <path d="M17 22.2 H31" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="11" cy="20.5" r="1.3" fill="#ffffff"/><circle cx="35" cy="20.5" r="1.3" fill="#ffffff"/>
    </g>`,
  ballon_baudruche: `
    <path d="M24 37 q-4 4 0 7 q3 2 -1 4" stroke="#c8362b" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M24 7 Q35 6 38 14 Q42 23 35 30 Q30 36 24 37 Q16 37 11 30 Q6 21 11 13 Q16 7 24 7 Z" fill="#c9ccd0" ${T}/>
    <path d="M15 14 l5 3 M31 11 l-2 5 M33 28 l-5 -2 M14 27 l4 -1" stroke-width="1" opacity="0.55" fill="none" ${T}/>
    <path d="M19.5 17 L16 24.5 H22.5 M20.5 20 V29" stroke="#c8362b" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="28.5" cy="23" rx="3.2" ry="5.2" fill="none" stroke="#c8362b" stroke-width="2.2"/>
    <path d="M22 37 h4 l-2 3 Z" fill="#c9ccd0" ${T} stroke-width="1.2"/>
    <path d="M13 17 q1 -4 4 -6" stroke="#ffffff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  cone_chantier: `
    <path d="M7 39 h34 v5 h-34 Z" fill="#d85a1e" ${T}/>
    <path d="M20.5 5 h7 l9 34 h-25 Z" fill="#f07a2a" ${T}/>
    <path d="M18.4 15 h11.2 l1.5 5.5 h-14.2 Z M15.7 26 h16.6 l1.5 5.5 h-19.6 Z" fill="#f4f4ee"/>
    <path d="M20.5 5 h7 l9 34 h-25 Z" fill="none" ${T}/>`,

  // ---- Textile ----
  tshirt_promo: `
    <path d="M17 8 L7 14 L11.5 22 L16 20 V41 H32 V20 L36.5 22 L41 14 L31 8 Q24 14 17 8 Z" fill="#eeeae0" ${T}/>
    <path d="M19 8.5 Q24 15.5 29 8.5" fill="none" ${T} stroke-width="1.4"/>
    <circle cx="24" cy="25" r="5.5" fill="#c8362b" ${T} stroke-width="1.4"/>
    <path d="M21.5 25 l1.8 1.8 l3.4 -3.6" stroke="#f4ecd8" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M19 34 h10" stroke="#c8362b" stroke-width="1.8" stroke-linecap="round"/>`,
  jean_troue: `
    <path d="M13 7 h22 l3 36 h-10 l-4 -24 l-4 24 h-10 Z" fill="#4a6fa5" ${T}/>
    <path d="M13 7 h22 v4.5 h-22 Z" fill="#3d5f8f" ${T} stroke-width="1.6"/>
    <circle cx="24" cy="9.2" r="1.2" fill="#d8c43a"/>
    <path d="M24 11.5 v7 M15 11.5 q3 4.5 7 2.5 M33 11.5 q-3 4.5 -7 2.5" fill="none" stroke-width="1" ${T}/>
    <ellipse cx="16.3" cy="29" rx="2.8" ry="1.6" fill="#f4ecd8" ${T} stroke-width="1"/>
    <ellipse cx="32.2" cy="34" rx="2.6" ry="1.5" fill="#f4ecd8" ${T} stroke-width="1"/>
    <path d="M14 28 h4.6 M14.2 30 h4.2 M30 33 h4.4 M30.2 35 h4" stroke="#f4ecd8" stroke-width="0.8"/>`,
  basket_led: `
    <path d="M6 31 Q6 20 12 18 L20 15 Q24 22 30 22 L38 26 Q43 28 43 32 V35 H6 Z" fill="#f4f4ee" ${T}/>
    <path d="M13 29 Q24 24 36 29.5" stroke="#3f8fb0" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M18.5 18.5 l3.5 3 M22 17 l3 4" stroke-width="1.2" ${T}/>
    <path d="M5 35 H44 V38 Q44 41 41 41 H8 Q5 41 5 38 Z" fill="#2b2b2b" ${T}/>
    <circle cx="11" cy="38" r="1.5" fill="#ff5a8a"/><circle cx="17" cy="38" r="1.5" fill="#5fd0ff"/>
    <circle cx="23" cy="38" r="1.5" fill="#d8f040"/><circle cx="29" cy="38" r="1.5" fill="#ff5a8a"/>
    <circle cx="35" cy="38" r="1.5" fill="#5fd0ff"/><circle cx="40" cy="38" r="1.5" fill="#d8f040"/>`,
  doudoune: `
    <path d="M16 7 L10 13 Q11.5 28 10 41 H38 Q36.5 28 38 13 L32 7 Q28 12 24 12 Q20 12 16 7 Z" fill="#e0742e" ${T}/>
    <path d="M10.6 14 Q15.5 18 14 26 M37.4 14 Q32.5 18 34 26" fill="none" ${T} stroke-width="1.6"/>
    <path d="M11.3 21 H36.7 M10.9 28 H37.1 M10.5 35 H37.5" stroke="${ENCRE}" stroke-width="1.2" opacity="0.6"/>
    <path d="M24 12 V41" stroke="${ENCRE}" stroke-width="1.8"/>
    <path d="M24 16 v3" stroke="#c9ccd0" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M13 17 q2 1 2 4" stroke="#f4b484" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  rideau: `
    <path d="M9 9 H39 V42 Q34 39.5 31 43 Q27.5 39.5 24 43 Q20.5 39.5 17 43 Q13.5 39.5 9 42 Z" fill="#3a3f55" ${T}/>
    <path d="M15 11 V40 M21.5 11 V41 M28 11 V41 M34 11 V40" stroke="#5f6680" stroke-width="1.8"/>
    <path d="M4 8 H44" ${T} stroke-width="3"/>
    <circle cx="4.5" cy="8" r="2.2" fill="#a07c48" ${T} stroke-width="1.2"/><circle cx="43.5" cy="8" r="2.2" fill="#a07c48" ${T} stroke-width="1.2"/>
    <circle cx="12" cy="9" r="1.6" fill="#c9ccd0" ${T} stroke-width="1"/><circle cx="20" cy="9" r="1.6" fill="#c9ccd0" ${T} stroke-width="1"/>
    <circle cx="28" cy="9" r="1.6" fill="#c9ccd0" ${T} stroke-width="1"/><circle cx="36" cy="9" r="1.6" fill="#c9ccd0" ${T} stroke-width="1"/>`,
  oreiller_plumes: `
    <path d="M6 18 Q24 11 42 18 Q38.5 28 42 38 Q24 44 6 38 Q9.5 28 6 18 Z" fill="#f4f4ee" ${T}/>
    <path d="M10 21 Q24 16 38 21 Q35.5 28 38 35 Q24 40 10 35 Q12.5 28 10 21 Z" fill="none" stroke="#c9ccd0" stroke-width="1.4" stroke-dasharray="2.4 2"/>
    <path d="M28 21 Q29 10 41 4 Q41 16 28 21 Z" fill="#e8dcc4" ${T} stroke-width="1.4"/>
    <path d="M28 21 L41 4" stroke-width="1" ${T}/>
    <path d="M33 13 l2 2 M36 9.5 l2 1.6" stroke="#a89878" stroke-width="1"/>`,
  matelas: `
    <path d="M4 23 L30 29 V37 L4 31 Z" fill="#c9b48a" ${T}/>
    <path d="M30 29 L44 19 V27 L30 37 Z" fill="#b8a078" ${T}/>
    <path d="M4 23 L18 13 L44 19 L30 29 Z" fill="#e8dcc8" ${T}/>
    <path d="M9 19.5 L35 25.5 M13.5 16.3 L39.5 22.3" stroke="#8fb3d6" stroke-width="1.3"/>
    <ellipse cx="24" cy="21" rx="5.2" ry="2.4" fill="#6b5a44" ${T} stroke-width="1.2"/>
    <path d="M24 21 c-4 -1 4 -3 0 -4.2 c-4 -1 4 -3 0 -4.2 c-4 -1 4 -3 0 -4.2" stroke="${ENCRE}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M24 21 c-4 -1 4 -3 0 -4.2 c-4 -1 4 -3 0 -4.2 c-4 -1 4 -3 0 -4.2" stroke="#c9ccd0" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M8 27 l2 0.5 M14 28.4 l2 0.5 M20 29.8 l2 0.5" stroke-width="1.2" ${T}/>`,
  couverture_survie: `
    <path d="M7 14 L34 8 L41 34 L14 40 Z" fill="#d8b84a" ${T}/>
    <path d="M34 8 L41 34 L27 25 Z" fill="#d6d8dc" ${T}/>
    <path d="M12 18 l6 4 l-2 6 l5 5 M20 13 l2 5 l6 2 M18 34 l6 -3 l4 4" stroke="#a88a2a" stroke-width="1.1" fill="none" stroke-linejoin="round"/>
    <path d="M31 14 l3 6 M35 25 l-3 -1" stroke="#a8acb2" stroke-width="1.1"/>
    <path d="M10 16 l5 -1.2 M15 36 l4 -1" stroke="#fff6c8" stroke-width="1.6" stroke-linecap="round"/>`,
  cintres: `
    <g transform="rotate(-14 24 26)">
      <path d="M24 16 q0 -3 3 -3.6 q3 -0.4 3 -3.4 q0 -3.4 -3.6 -3.4 q-2.4 0 -3.2 2" fill="none" stroke="${ENCRE}" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M24 16 q0 -3 3 -3.6 q3 -0.4 3 -3.4 q0 -3.4 -3.6 -3.4 q-2.4 0 -3.2 2" fill="none" stroke="#c9ccd0" stroke-width="1.6" stroke-linecap="round"/>
      ${trait("M24 16 L7 32 H41 Z", "#c9ccd0", 1.6)}
    </g>
    <g transform="rotate(12 24 26) translate(0 6)">${trait("M24 16 L7 32 H41 Z M24 16 V11", "#a8acb2", 1.6)}</g>
    <path d="M14 36 q4 -6 9 -2 q5 4 10 -3" stroke="#8a8f96" stroke-width="1.2" fill="none"/>`,
  parapluie: `
    <path d="M24 26 V40 Q24 45 19.5 45 Q15 45 15 40" fill="none" stroke="${ENCRE}" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M24 26 V40 Q24 45 19.5 45 Q15 45 15 40" fill="none" stroke="#6b4a32" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M5 7 L17 14 L24 9 L31 14 L43 6 Q39 25 24 28 Q9 25 5 7 Z" fill="#2f5fa4" ${T}/>
    <path d="M24 28 L5 7 M24 28 L17 14 M24 28 L24 9 M24 28 L31 14 M24 28 L43 6" stroke-width="1.1" fill="none" ${T}/>
    <path d="M24 9 V3" ${T} stroke-width="2.2"/>
    <path d="M43 6 L46 3" ${T} stroke-width="1.4"/>`,

  // ---- Loisir ----
  tapis_yoga: `
    <path d="M12 14 H36 A6 10 0 0 1 36 34 H12 Z" fill="#5f9f8a" ${T}/>
    <path d="M36 34 H44 V38 H14" fill="#4f8a76" ${T}/>
    <ellipse cx="12" cy="24" rx="6" ry="10" fill="#7fbfa8" ${T}/>
    <path d="M12 24 m-1.2 0 a1.4 2.4 0 1 1 2.8 0 a2.9 5 0 1 1 -5.8 0 a4.4 7.4 0 1 1 8.8 0" stroke-width="1.2" fill="none" ${T}/>
    <path d="M23 14 V34" stroke="${ENCRE}" stroke-width="2.4"/>
    <path d="M17 17 H33" stroke="#9fd4c0" stroke-width="1.6" stroke-linecap="round"/>`,
  volants_badminton: `
    <rect x="27" y="4" width="13" height="34" rx="3" fill="#3f8fb0" ${T}/>
    <path d="M27 10 h13" stroke-width="1.4" ${T}/><path d="M30 16 v18" stroke="#8fc8e0" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M17 36 L8 11 H30 L23 36 Z" fill="#f4f4ee" ${T}/>
    <path d="M8 11 q1.8 -3 3.7 0 q1.8 -3 3.7 0 q1.8 -3 3.7 0 q1.8 -3 3.7 0 q1.8 -3 3.7 0 q1.8 -3 3.5 0" fill="#f4f4ee" ${T} stroke-width="1.4"/>
    <path d="M18 36 L13 11 M20 36 V11 M22 36 L26 11" stroke-width="0.9" ${T}/>
    <path d="M10.5 19 H27.5 M12.5 25 H25.6" stroke="#3f8fb0" stroke-width="1.6"/>
    <path d="M16 36 h8 v2.5 a4 4 0 0 1 -8 0 Z" fill="#f4ecd8" ${T}/>
    <path d="M16 36 h8" stroke="#c8362b" stroke-width="2.4"/>`,
  plumeau: `
    ${trait("M20 45 L26 25", "#6b4a32", 3)}
    <path d="M24.5 27 h4 l-0.6 3 h-3.4 Z" fill="#c9ccd0" ${T} stroke-width="1.4"/>
    <path d="M26 27 Q9 22 11 9 Q17 2 26 6 Q35 2 40 9 Q42 22 26 27 Z" fill="#e8a8b8" ${T}/>
    <path d="M26 27 L15 10 M26 27 L20 7 M26 27 L26 6 M26 27 L32 7 M26 27 L37 10" stroke="#c87890" stroke-width="1.2"/>
    <path d="M14 10 q3 -4 7 -4" stroke="#f8d4de" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  attrape_reves: `
    <path d="M16 28 V36 M24 30 V39 M32 28 V36" stroke-width="1" ${T}/>
    <ellipse cx="16" cy="39" rx="2.4" ry="5" fill="#e8a8b8" ${T} stroke-width="1.2"/>
    <ellipse cx="24" cy="42" rx="2.4" ry="5" fill="#d8c43a" ${T} stroke-width="1.2"/>
    <ellipse cx="32" cy="39" rx="2.4" ry="5" fill="#3f8fb0" ${T} stroke-width="1.2"/>
    <path d="M24 6 L34 23 H14 Z M14 12 H34 L24 29 Z" fill="none" stroke-width="0.9" ${T}/>
    <circle cx="24" cy="18" r="1.8" fill="#3f8fb0" ${T} stroke-width="0.8"/>
    ${trait("M24 6 A12 12 0 1 1 23.9 6 Z", "#a07c48", 2.6)}
    <path d="M24 2 V6" ${T} stroke-width="1.4"/>`,
  hamac: `
    <path d="M4 12 L12 17 M4 12 L12 22 M44 12 L36 17 M44 12 L36 22" stroke="#a07c48" stroke-width="1.4"/>
    <circle cx="4" cy="12" r="2" fill="none" ${T} stroke-width="1.4"/><circle cx="44" cy="12" r="2" fill="none" ${T} stroke-width="1.4"/>
    <path d="M12 17 Q24 25 36 17 L36 22 Q24 42 12 22 Z" fill="#d8743a" ${T}/>
    <path d="M14 23 Q24 34 34 23" stroke="#f4ecd8" stroke-width="2.2" fill="none"/>
    <path d="M17 28 Q24 36 31 28" stroke="#3f8fb0" stroke-width="2" fill="none"/>
    ${trait("M12 15 V24 M36 15 V24", "#6b4a32", 2)}`,
  tente_popup: `
    <path d="M2 39 H46" ${T}/>
    <path d="M4 39 Q7 11 24 9 Q41 11 44 39 Z" fill="#5f9f55" ${T}/>
    <path d="M24 9 Q15 22 13.5 39 M24 9 Q33 22 34.5 39" stroke-width="1.2" fill="none" ${T}/>
    <path d="M18 39 Q19.5 25 24 23 Q28.5 25 30 39 Z" fill="#3f6f3a" ${T}/>
    <path d="M11 17 q3 -3 6 -4" stroke="#8fc884" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M5 7 l3 3 M43 7 l-3 3 M24 1.5 v3.5" stroke-width="1.6" ${T}/>`,
  piscine_gonflable: `
    <path d="M5 25 Q5 15 24 15 Q43 15 43 25 Q43 31 37 34 L35 38 Q24 41 12 37 Q5 33 5 25 Z" fill="#3f8fb0" ${T}/>
    <path d="M7 27 Q9 36 24 37.5" stroke="#f4f4ee" stroke-width="2.4" fill="none"/>
    <ellipse cx="24" cy="24" rx="13" ry="5.5" fill="#bcdce6" ${T}/>
    <path d="M18 23 q3 -1.4 6 0 t6 0" stroke="#3f8fb0" stroke-width="1.2" fill="none" opacity="0.7"/>
    <path d="M37 34 l2 -2 l1 3 l2 -1" fill="none" ${T} stroke-width="1.4"/>
    <path d="M42 30 l3 -1.4 M43 35 h3" stroke-width="1.2" ${T}/>`,
  parasol: `
    ${trait("M24 8 V41", "#8a8f96", 2.2)}
    <path d="M24 7 L4 21 Q9 19 14 21 Z M24 7 L34 21 Q29 19 24 21 Z" fill="#c8362b"/>
    <path d="M24 7 L14 21 Q19 19 24 21 Z M24 7 L44 21 Q39 19 34 21 Z" fill="#f4ecd8"/>
    <path d="M4 21 Q9 19 14 21 Q19 19 24 21 Q29 19 34 21 Q39 19 44 21 L24 7 Z" fill="none" ${T}/>
    <path d="M24 7 L14 21 M24 7 L24 21 M24 7 L34 21" stroke-width="1" ${T}/>
    <circle cx="24" cy="6" r="1.8" fill="#8a8f96" ${T} stroke-width="1.2"/>
    <path d="M15 41 h18 l2 4 h-22 Z" fill="#55524d" ${T}/>`,
  barbecue: `
    <path d="M14 32 L10 44 M34 32 L38 44 M24 34 V44" stroke="${ENCRE}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M7 21 Q7 35 24 35 Q41 35 41 21 Z" fill="#2b2b2b" ${T}/>
    <ellipse cx="15" cy="28" rx="3.2" ry="2" fill="#a4552f"/><ellipse cx="31" cy="30" rx="2.6" ry="1.6" fill="#a4552f"/>
    <ellipse cx="22" cy="31.5" rx="1.8" ry="1.2" fill="#c8743a"/>
    <ellipse cx="24" cy="21" rx="17" ry="4.6" fill="#55524d" ${T}/>
    <path d="M13 18.3 V23.7 M18.5 16.9 V25.1 M24 16.4 V25.6 M29.5 16.9 V25.1 M35 18.3 V23.7" stroke="#a8acb2" stroke-width="1.2"/>
    <path d="M17 19.5 h8" stroke="#c87050" stroke-width="2.4" stroke-linecap="round"/>`,
  sac_charbon_bbq: `
    <path d="M10 11 Q9 7 13 7 H35 Q39 7 38 11 L39 38 Q39 42 35 42 H13 Q9 42 9 38 Z" fill="#2b2b2b" ${T}/>
    <path d="M13 7 L16 12 H32 L35 7" fill="#3a3a3a" ${T} stroke-width="1.2"/>
    <rect x="14" y="18" width="20" height="15" rx="1.5" fill="#c8362b" ${T} stroke-width="1.4"/>
    <path d="M24 20 Q31 26 27 31 H21 Q17 26 24 20 Z" fill="#ffb347" ${T} stroke-width="1.2"/>
    <path d="M24 25 Q26.5 28 25 30.5 H23 Q21.5 28 24 25 Z" fill="#ffe08a"/>
    <path d="M35 39 l3.6 -3 l4 1.6 l-0.6 4.8 h-6 Z" fill="#3a3a3a" ${T} stroke-width="1.2"/>
    <path d="M4 41 l3 -3.4 l4 1 l0.4 3.8 Z" fill="#3a3a3a" ${T} stroke-width="1.2"/>`,
  flamant_rose: `
    <path d="M28 28 V45" ${T} stroke-width="1.6"/>
    <path d="M30 28 L35 33 L29 34.5" fill="none" ${T} stroke-width="1.4"/>
    ${trait("M20 21 Q13 17 15.5 10 Q17.5 4.5 22 6", "#f08ab0", 3.4)}
    <ellipse cx="28" cy="22" rx="11" ry="6.5" fill="#f08ab0" ${T}/>
    <path d="M38 20 L44 16.5 L41.5 24 Z" fill="#e0709a" ${T} stroke-width="1.4"/>
    <path d="M24 20 Q29 17 34 21" stroke="#e0709a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <circle cx="22.5" cy="6.5" r="3.4" fill="#f08ab0" ${T} stroke-width="1.6"/>
    <path d="M25 5 L30 7.5 L26.5 10 Z" fill="#2b2b2b" ${T} stroke-width="1"/>
    <circle cx="22" cy="5.6" r="0.9" fill="${ENCRE}"/>`,
  balise_solaire: `
    <path d="M24 33 V45" ${T} stroke-width="2.6"/>
    <path d="M11 22 h-5 M37 22 h5 M13 13 l-3.5 -3.5 M35 13 l3.5 -3.5 M13 31 l-3.5 3 M35 31 l3.5 3" stroke="#ffb347" stroke-width="2" stroke-linecap="round"/>
    <rect x="17.5" y="15" width="13" height="15" rx="2" fill="#ffe08a" ${T}/>
    <path d="M24 15 v15" stroke="#f4c45a" stroke-width="1.4"/>
    <path d="M14.5 15 L17.5 8 H30.5 L33.5 15 Z" fill="#1f3550" ${T}/>
    <path d="M24 8 V15 M16 11.5 H32" stroke="#8fb3d6" stroke-width="1"/>
    <rect x="18.5" y="30" width="11" height="3.6" fill="#2b2b2b" ${T} stroke-width="1.4"/>`,
  ballon_foot: `
    <path d="M24 8 Q39 8 40 24 Q40 37 27 40 Q21 35 12 38 Q8 32 8 24 Q8 8 24 8 Z" fill="#f4f4ee" ${T}/>
    <path d="M24 17.5 L30.5 22 L28 29.5 H20 L17.5 22 Z" fill="#2b2b2b"/>
    <path d="M24 17.5 V9 M30.5 22 L39 19 M28 29.5 L32.5 37.5 M20 29.5 L15.5 37 M17.5 22 L9 19.5" stroke="#2b2b2b" stroke-width="1.2"/>
    <path d="M18 8.8 L24 12 L30 8.8 Q24 7.6 18 8.8 Z M39.5 15 L36 22 L39.8 27 Z M8.5 16 L12 22.5 L8.1 27.5 Z" fill="#2b2b2b"/>
    <path d="M24 8 Q39 8 40 24 Q40 37 27 40 Q21 35 12 38 Q8 32 8 24 Q8 8 24 8 Z" fill="none" ${T}/>
    <path d="M19.5 34 q1.6 -2 2.6 0 q1 2 2.6 0 q1 -2 2.6 0" stroke="#2f5fa4" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <path d="M7 41 l-3 2 M10 43 l-1 3" stroke-width="1.2" ${T}/>`,
  peluche_parlante: `
    <ellipse cx="24" cy="36" rx="10.5" ry="8.5" fill="#a07c48" ${T}/>
    <path d="${coeur(24, 36.5, 3.6)}" fill="#c8362b" ${T} stroke-width="1"/>
    <circle cx="14.5" cy="11.5" r="5" fill="#a07c48" ${T}/><circle cx="33.5" cy="11.5" r="5" fill="#a07c48" ${T}/>
    <circle cx="14.5" cy="11.5" r="2.4" fill="#e8d8a8"/><circle cx="33.5" cy="11.5" r="2.4" fill="#e8d8a8"/>
    <circle cx="24" cy="19" r="10" fill="#a07c48" ${T}/>
    <ellipse cx="24" cy="23" rx="4.6" ry="3.6" fill="#e8d8a8" ${T} stroke-width="1.2"/>
    <ellipse cx="24" cy="21.4" rx="1.7" ry="1.2" fill="${ENCRE}"/>
    <circle cx="20" cy="17" r="1.5" fill="${ENCRE}"/><circle cx="28" cy="17" r="1.5" fill="${ENCRE}"/>
    <path d="M38 31 q2 2.2 0 4.4 M41 29 q3.4 4.4 0 8.8" stroke-width="1.3" fill="none" ${T}/>`,
  toupie_main: `
    <g fill="#3f8fb0" stroke="${ENCRE}" stroke-width="4.4">
      <circle cx="24" cy="11" r="7.5"/><circle cx="12.7" cy="30.5" r="7.5"/><circle cx="35.3" cy="30.5" r="7.5"/><circle cx="24" cy="24" r="8"/>
    </g>
    <g fill="#3f8fb0">
      <circle cx="24" cy="11" r="7.5"/><circle cx="12.7" cy="30.5" r="7.5"/><circle cx="35.3" cy="30.5" r="7.5"/><circle cx="24" cy="24" r="8"/>
    </g>
    <circle cx="24" cy="11" r="3.6" fill="#c9ccd0" ${T} stroke-width="1.2"/><circle cx="12.7" cy="30.5" r="3.6" fill="#c9ccd0" ${T} stroke-width="1.2"/>
    <circle cx="35.3" cy="30.5" r="3.6" fill="#c9ccd0" ${T} stroke-width="1.2"/><circle cx="24" cy="24" r="4.2" fill="#d8c43a" ${T} stroke-width="1.2"/>
    <path d="M6 14 Q8 6 15 3.5 M42 40 Q37 45 30 45" stroke-width="1.2" fill="none" opacity="0.6" ${T}/>`,
  planche_roulettes: `
    <rect x="11" y="26" width="7" height="3" fill="#8a8f96" ${T} stroke-width="1.2"/>
    <rect x="30" y="26" width="7" height="3" fill="#8a8f96" ${T} stroke-width="1.2"/>
    ${trait("M4 18 Q6 25 12 25 H36 Q42 25 44 18", "#c8362b", 3.4)}
    <path d="M14 22.6 H34" stroke="#f4ecd8" stroke-width="1.2" stroke-dasharray="2 2"/>
    <circle cx="14.5" cy="33" r="4.2" fill="#d8c43a" ${T}/><circle cx="33.5" cy="33" r="4.2" fill="#d8c43a" ${T}/>
    <circle cx="14.5" cy="33" r="1.4" fill="${ENCRE}"/><circle cx="33.5" cy="33" r="1.4" fill="${ENCRE}"/>`,
  trottinette_enfant: `
    ${trait("M10 36 H33", "#e8789a", 3.2)}
    ${trait("M34 36 L30 9", "#e8789a", 2.6)}
    ${trait("M24 9 H36", "#f4ecd8", 2.4)}
    <path d="M22.5 9 l-2 4 M37.5 9 l2 4" stroke="#e8789a" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="10" cy="38.5" r="4.6" fill="#f4f4ee" ${T}/><circle cx="35.5" cy="38.5" r="4.6" fill="#f4f4ee" ${T}/>
    <circle cx="10" cy="38.5" r="1.5" fill="#e8789a"/><circle cx="35.5" cy="38.5" r="1.5" fill="#e8789a"/>`,

  // ---- Les ressorts et le petit bureau ----
  stylo_ressort: `
    ${trait("M10 39 L33 13", "#2f5fa4", 4.4)}
    <path d="M10 39 L6.5 43" stroke="${ENCRE}" stroke-width="2.2" stroke-linecap="round"/>
    ${trait("M33 13 L37.5 8", "#c9ccd0", 2.4)}
    <path d="M27 14 L33.5 21.5" fill="none" stroke="#c9ccd0" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M16 33.5 L25 23.3" stroke="#d8c43a" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M26 41 c1.5 -4 3.5 -4 3.5 0 c0 4 2 4 3.5 0 c1.5 -4 3.5 -4 3.5 0 c0 4 2 4 3.5 0" stroke="#8a8f96" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  pot_stylos: `
    <ellipse cx="24" cy="20" rx="11" ry="3.2" fill="#3a3a3a" ${T}/>
    ${trait("M17 20 L11 6", "#d8c43a", 2.4)}${trait("M21 20 L18.5 5", "#2b2b2b", 2.2)}${trait("M24.5 20 V4", "#2f5fa4", 2.2)}
    ${trait("M28 20 L31 6", "#5f9f55", 2.2)}${trait("M31 20 L37 7", "#c8362b", 2.2)}
    <path d="M10.4 5 l-1 -2.6 l2.6 1.6 Z" fill="${ENCRE}"/>
    <path d="M13 20 A11 3.2 0 0 0 35 20 L33 42 H15 Z" fill="#c9ccd0" ${T}/>
    <path d="M14 27 h20 M14.6 33 h18.8" stroke="#8a8f96" stroke-width="1.2" stroke-dasharray="1.6 1.6"/>`,
  pinces_linge: `
    <g transform="rotate(-18 16 24)">${PINCE.replaceAll("COULEUR", "#c9a77a")}</g>
    <g transform="translate(14 2) rotate(14 16 24)">${PINCE.replaceAll("COULEUR", "#e0c494")}</g>
    <path d="M4 44 Q24 38 44 44" stroke="#c9b48a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  agrafeuse: `
    <path d="M5 35 H41 Q43 35 43 37 V40 H5 Z" fill="#2b2b2b" ${T}/>
    <rect x="9" y="30" width="30" height="3.4" fill="#8a8f96" ${T} stroke-width="1.2"/>
    <path d="M7 31 Q7 23 13 23 H38 Q43 23 43 28 V30 H7 Z" fill="#c8362b" ${T}/>
    <path d="M14 26 H36" stroke="#e86a5a" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="9.5" cy="33" r="2.6" fill="#c9ccd0" ${T} stroke-width="1.4"/>
    <path d="M18 17 v-3 h7 v3 M29 15 v-3 h7 v3" stroke="#8a8f96" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`,
  laisse_enrouleur: `
    <path d="M31 14 Q39 14 41 26 Q42 34 39 38" stroke-width="1.6" fill="none" ${T}/>
    <path d="M37 38 h4.4 v4 a2.2 2.2 0 0 1 -4.4 0 Z" fill="#c9ccd0" ${T} stroke-width="1.2"/>
    ${trait("M14 27 Q11 41 20 43 Q29 41 26 27", "#c8362b", 2.6)}
    <circle cx="20" cy="18" r="11" fill="#c8362b" ${T}/>
    <circle cx="20" cy="18" r="5" fill="#f4ecd8" ${T} stroke-width="1.4"/>
    <circle cx="20" cy="18" r="1.6" fill="${ENCRE}"/>
    <rect x="27" y="23" width="6" height="4" rx="1" fill="#2b2b2b" ${T} stroke-width="1.2"/>`,
  chargeur_sans_fil: `
    <path d="M38 30 Q45 32 43 39 Q41 44 34 44" stroke-width="1.8" fill="none" ${T}/>
    <path d="M6 24 v5 a17 8 0 0 0 34 0 v-5" fill="#1f1f1f" ${T}/>
    <ellipse cx="23" cy="24" rx="17" ry="8" fill="#3a3a3a" ${T}/>
    <ellipse cx="23" cy="24" rx="9" ry="4.2" fill="none" stroke="#8fb3d6" stroke-width="1.3"/>
    <ellipse cx="23" cy="24" rx="4.4" ry="2" fill="none" stroke="#8fb3d6" stroke-width="1.3"/>
    <circle cx="23" cy="33" r="1.1" fill="#55606a"/>
    <path d="M11 19.5 q4 -3 9 -3.5" stroke="#6a6a6a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  ecouteur_seul: `
    <ellipse cx="35" cy="15" rx="6" ry="5.4" fill="none" stroke="${ENCRE}" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
    <path d="M23 19 L30 40 Q31 44 27.5 44 Q24.5 44 24.5 40.5 L18.5 21 Z" fill="#f4f4ee" ${T}/>
    <ellipse cx="19.5" cy="15" rx="8.5" ry="7.5" fill="#f4f4ee" ${T}/>
    <ellipse cx="14" cy="12" rx="3.8" ry="4.4" fill="#c9ccd0" ${T} stroke-width="1.6"/>
    <circle cx="27.6" cy="40.6" r="1.1" fill="#8a8f96"/>
    <path d="M18 10 q4 -1.6 7 1" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  perche_selfie: `
    ${trait("M16 36 L28.5 21.5", "#c9ccd0", 2.6)}
    ${trait("M28.5 21.5 L35 14", "#c9ccd0", 1.6)}
    ${trait("M9 43 L16 35.5", "#2b2b2b", 4.6)}
    <circle cx="14" cy="38" r="1.2" fill="#c8362b"/>
    <g transform="rotate(40 37 9)">
      <rect x="30.5" y="1.5" width="13" height="16" rx="2.2" fill="#2b2b2b" ${T}/>
      <rect x="32.5" y="3.5" width="9" height="12" rx="1" fill="#3f6f8f"/>
      <path d="M34 6 l3 -1.4" stroke="#8fb3d6" stroke-width="1.2" stroke-linecap="round"/>
    </g>`,
  casque_vr: `
    <path d="M6 22 H2 M42 22 H46" stroke="${ENCRE}" stroke-width="5" stroke-linecap="round"/>
    <path d="M6 22 H3 M42 22 H45" stroke="#55524d" stroke-width="3" stroke-linecap="round"/>
    <path d="M11 13 H37 Q43 13 43 19 V30 Q43 35 38 35 H29.5 Q27.5 29 24 29 Q20.5 29 18.5 35 H10 Q5 35 5 30 V19 Q5 13 11 13 Z" fill="#2b2b2b" ${T}/>
    <circle cx="15.5" cy="23" r="5.4" fill="#8fc8e8" ${T} stroke-width="1.6"/>
    <circle cx="32.5" cy="23" r="5.4" fill="#8fc8e8" ${T} stroke-width="1.6"/>
    <circle cx="14" cy="21.5" r="1.8" fill="#ffd27a"/><circle cx="31" cy="21.5" r="1.8" fill="#ffd27a"/>
    <path d="M13 26 q2.5 -1.6 5 0 M30 26 q2.5 -1.6 5 0" stroke="#5d8a46" stroke-width="1.4" fill="none"/>`,
  box_internet: `
    ${trait("M12.5 23 L8.5 6", "#2b2b2b", 2.2)}${trait("M35.5 23 L39.5 6", "#2b2b2b", 2.2)}
    <path d="M5 26 L10 21 H43 L38 26 Z" fill="#dcdcd4" ${T}/>
    <path d="M5 26 H38 V39 H5 Z" fill="#f4f4ee" ${T}/>
    <path d="M38 26 L43 21 V34 L38 39 Z" fill="#c9ccd0" ${T}/>
    <circle cx="11" cy="32.5" r="1.6" fill="#8a8f96"/><circle cx="16" cy="32.5" r="1.6" fill="#8a8f96"/>
    <circle cx="21" cy="32.5" r="1.6" fill="#8a8f96"/><circle cx="26" cy="32.5" r="1.6" fill="#8a8f96"/>
    <path d="M29.5 31 h6 M29.5 34 h6" stroke-width="1" ${T}/>`,
  imprimante: `
    <path d="M14 5 H34 V19 H14 Z" fill="#ffffff" ${T}/>
    <path d="M17 9 h14 M17 12.5 h10" stroke="#8fb3d6" stroke-width="1.2"/>
    <path d="M6 18 H42 V35 Q42 37 40 37 H8 Q6 37 6 35 Z" fill="#c9ccd0" ${T}/>
    <rect x="12" y="28" width="24" height="3.4" fill="#2b2b2b" ${T} stroke-width="1"/>
    <path d="M10 37 L7.5 43 H40.5 L38 37 Z" fill="#a8acb2" ${T}/>
    <circle cx="36" cy="22.5" r="1.8" fill="#00b8d8" ${T} stroke-width="1"/>
    <circle cx="31" cy="22.5" r="1.8" fill="#ffa040" ${T} stroke-width="1"/>
    <path d="M10 22.5 h10" stroke="#8a8f96" stroke-width="1.4" stroke-linecap="round"/>`,
  camera_surveillance: `
    <rect x="3" y="6" width="7" height="17" rx="1.4" fill="#c9ccd0" ${T}/>
    ${trait("M10 14.5 L19 19", "#c9ccd0", 2.6)}
    <g transform="rotate(22 27 22)">
      <rect x="15" y="15" width="25" height="13" rx="3.5" fill="#f4f4ee" ${T}/>
      <path d="M13 15 H40 V12.5 H15 Z" fill="#c9ccd0" ${T} stroke-width="1.4"/>
      <circle cx="40" cy="21.5" r="5" fill="#2b2b2b" ${T}/>
      <circle cx="40" cy="21.5" r="2.2" fill="#3f6f8f"/>
      <circle cx="39" cy="20.5" r="0.8" fill="#ffffff"/>
      <circle cx="20" cy="24" r="1.2" fill="#c8362b"/>
    </g>`,
  fontaine_chat: `
    <path d="M8 30 Q8 43 24 43 Q40 43 40 30 Z" fill="#f4f4ee" ${T}/>
    <ellipse cx="24" cy="30" rx="16" ry="5" fill="#8fc8e8" ${T}/>
    <path d="M17 30 Q17 21 24 21 Q31 21 31 30 Z" fill="#f4f4ee" ${T}/>
    <path d="M18.5 23.5 L18.5 16.5 L23 21 Z M29.5 23.5 L29.5 16.5 L25 21 Z" fill="#f4f4ee" ${T} stroke-width="1.6"/>
    <circle cx="21.5" cy="25.5" r="1" fill="${ENCRE}"/><circle cx="26.5" cy="25.5" r="1" fill="${ENCRE}"/>
    <path d="M24 21 Q24 12 30 13 Q34 15 33.5 27" stroke="#3f8fb0" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M37 13 q3.5 -3.4 7 0 M38.8 15.4 q1.7 -1.6 3.4 0" stroke-width="1.2" fill="none" ${T}/>
    <circle cx="40.5" cy="17.5" r="0.9" fill="${ENCRE}"/>`,
  radiateur: `
    <path d="M42 30 Q47 34 44 43" stroke-width="1.6" fill="none" ${T}/>
    <path d="M10 37 v5 M38 37 v5" stroke="${ENCRE}" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="5" y="9" width="37" height="28" rx="3" fill="#f4f4ee" ${T}/>
    <path d="M11 13 V33 M17 13 V33 M23 13 V33 M29 13 V33 M35 13 V33" stroke="#c9ccd0" stroke-width="3" stroke-linecap="round"/>
    <path d="M11 13 V33 M17 13 V33 M23 13 V33 M29 13 V33 M35 13 V33" stroke="${ENCRE}" stroke-width="0.8" opacity="0.5"/>
    <circle cx="38.5" cy="12.5" r="1.6" fill="#c8362b"/>`,
  tuyau_cuivre: `
    <path d="M7 39 L21 25 Q25 21 30 21 H42" fill="none" stroke="${ENCRE}" stroke-width="8.4" stroke-linecap="butt" stroke-linejoin="round"/>
    <path d="M7 39 L21 25 Q25 21 30 21 H42" fill="none" stroke="#c8743a" stroke-width="5.4" stroke-linejoin="round"/>
    <path d="M9 35.5 L20.5 24 Q24 20.5 29 20" fill="none" stroke="#f0b088" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse cx="42" cy="21" rx="1.8" ry="4.2" fill="#6b3a1a" ${T} stroke-width="1.2"/>
    <ellipse cx="7" cy="39" rx="1.8" ry="4.2" transform="rotate(45 7 39)" fill="#6b3a1a" ${T} stroke-width="1.2"/>
    <path d="M33 17 v8" stroke="${ENCRE}" stroke-width="1.2"/>`,
  bougie_parfumee: `
    <path d="M29 4 L44 9 L43 13 L28 8 Z" fill="#a07c48" ${T}/>
    <path d="M12 15 H36 V38 Q36 42 32 42 H16 Q12 42 12 38 Z" fill="#efe6d4" ${T}/>
    <path d="M13 22 H35 V38 Q35 41 32 41 H16 Q13 41 13 38 Z" fill="#d8a07a"/>
    <rect x="16" y="27" width="16" height="9" rx="1" fill="#f4ecd8" ${T} stroke-width="1.2"/>
    <path d="M20.5 34 Q23 27.5 28.5 29.5 Q26.5 34 20.5 34 Z" fill="#c8743a" ${T} stroke-width="0.9"/>
    <path d="M24 22 V17.5" stroke="${ENCRE}" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="24" cy="15" rx="12" ry="3" fill="none" ${T}/>
    <path d="M14.5 19 v15" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>`,
  livre_meilleur_soi: `
    <path d="M36 8 h3 v34 h-3 Z" fill="#f4f4ee" ${T}/>
    <rect x="10" y="6" width="27" height="37" rx="1.5" fill="#d8c43a" ${T}/>
    <path d="M14.5 6.5 V42.5" stroke="#b8a42a" stroke-width="2.4"/>
    <path d="M25 31 V16 M19.5 21.5 L25 16 L30.5 21.5" stroke="#c8362b" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M19 35.5 h12 M20.5 38.5 h9" stroke-width="1.3" ${T}/>
    <path d="M31 11 l1 -2 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 Z" fill="#f4ecd8"/>`,
  livre_cuisiner: `
    <path d="M36 8 h3 v34 h-3 Z" fill="#f4f4ee" ${T}/>
    <rect x="10" y="6" width="27" height="37" rx="1.5" fill="#5f9f8a" ${T}/>
    <path d="M14.5 6.5 V42.5" stroke="#4a8270" stroke-width="2.4"/>
    <rect x="17" y="14" width="17" height="12" rx="1.4" fill="#f4f4ee" ${T} stroke-width="1.4"/>
    <rect x="19" y="16" width="9.5" height="8" rx="0.8" fill="#3a3a3a"/>
    <circle cx="31.2" cy="18.5" r="1.3" fill="${ENCRE}"/><path d="M30 22.5 h2.4" stroke-width="1" ${T}/>
    <path d="M19 32 h12 M20.5 35 h9" stroke="#f4ecd8" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M30 43 v4 l2 -1.6 l2 1.6 v-4" fill="#c8362b" ${T} stroke-width="1"/>`,

  // ---- La route, le garage, la casse ----
  // Un pneu vu de trois quarts, sa bande de roulement en vue (la chambre à air, elle, est de face et lisse).
  pneu: `
    <path d="M19 6 H29 A13 18 0 0 1 29 42 H19 Z" fill="#3a3a3a" ${T}/>
    <path d="M33 9 l4 2 M37 13 l3.4 2.6 M39.6 18.5 l2.2 2.4 M41 24 l1.4 0 M40.4 29.5 l-2.4 2 M38 35 l-3.4 2.4 M34 39.4 l-4 1.4" stroke="#8a8f96" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M30 8 l3.4 4 M34 13 l3 4.6 M36.4 20 l1.6 4 M36.8 27 l-0.6 4 M35 33 l-2.4 3.6" stroke="#55524d" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="19" cy="24" rx="13" ry="18" fill="#2b2b2b" ${T}/>
    <ellipse cx="19" cy="24" rx="6.4" ry="9.4" fill="#55524d" ${T}/>
    <ellipse cx="19" cy="24" rx="9.6" ry="13.8" fill="none" stroke="#4a4a4a" stroke-width="1.2"/>
    <path d="M10 14 q2 -4 6 -6" stroke="#6a6a6a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  plaque_immat: `
    <g transform="rotate(-7 24 24)">
      <rect x="3.5" y="15" width="41" height="17" rx="2" fill="#f4f4ee" ${T}/>
      <path d="M5.5 15 H10.5 V32 H5.5 Q3.5 32 3.5 30 V17 Q3.5 15 5.5 15 Z" fill="#2f5fa4"/>
      <circle cx="7" cy="20" r="1.4" fill="none" stroke="#d8c43a" stroke-width="0.9"/>
      <path d="M13.5 28 L15.5 19 L17.5 28 M14.3 25 h2.4 M20 19 v9 h2.2 q2 0 2 -2.3 q0 -2.2 -2 -2.2 h-2.2 h2 q1.8 0 1.8 -2.2 q0 -2.3 -2 -2.3 Z M27 23.5 h2.4 M32 20.5 l1.6 -1.5 v9 M36.5 20.6 q1 -1.7 2.5 -1.6 q2 0.3 1.7 2.4 q-0.4 2 -4.2 6.6 h4.4" fill="none" stroke="${ENCRE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="3.5" y="15" width="41" height="17" rx="2" fill="none" ${T}/>
    </g>
    <path d="M38 10 l3 4" stroke-width="1.2" ${T}/>`,
  // Le jerrican percé (plan 0.8, I5) : un trou déchiré au flanc, une coulure, le plastique fendu.
  jerrican: `
    <path d="M10 14 L16 8 H38 V42 H10 Z" fill="#5f7f45" ${T}/>
    <rect x="14" y="17" width="20" height="21" fill="none" stroke="#4a6a35" stroke-width="1.6"/>
    <path d="M15 18 L33 37 M33 18 L15 37" stroke="#4a6a35" stroke-width="3" stroke-linecap="round"/>
    <path d="M22 8 V3.5 H37 V8 M27 3.5 v4.5 M32 3.5 v4.5" stroke-width="2" fill="none" ${T}/>
    <rect x="9.5" y="7" width="6" height="5" rx="1" transform="rotate(-45 12.5 9.5)" fill="#55524d" ${T}/>
    <path d="M36 12 v26" stroke="#8fa86a" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M23 28 L26 25 L28 28 L31 27 L29 31 L30 34 L26 32 L23 34 L24 31 Z" fill="#1f1c19" stroke="${ENCRE}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M28 33 Q29 38 28 42 M28 44.5 v.5" stroke="#c9a040" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M30 27 L34 23 M22 29 L18 27" stroke="${ENCRE}" stroke-width="1.1" stroke-linecap="round"/>`,
  panneau_routier: `
    ${trait("M24 30 Q22 38 29 45", "#8a8f96", 2.6)}
    <g transform="rotate(-12 24 18)">
      <path d="M24 3 L43 33 H5 Z" fill="#c8362b" ${T}/>
      <path d="M24 11 L36 29 H12 Z" fill="#f4f4ee"/>
      <path d="M24 16 v6.5" stroke="${ENCRE}" stroke-width="2.8" stroke-linecap="round"/>
      <circle cx="24" cy="26" r="1.5" fill="${ENCRE}"/>
    </g>
    <path d="M33 33 q3 1 5 -1" stroke-width="1.2" fill="none" ${T}/>`,
  caddie: `
    <path d="M14 30 L16 38 H38 V30" fill="none" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M10 12 H42 L38 30 H14 Z" fill="#c9ccd0" fill-opacity="0.55" ${T}/>
    <path d="M18 12 L19 30 M26 12 V30 M34 12 L33 30 M11.5 18 H40.7 M12.8 24 H39.4" stroke="${ENCRE}" stroke-width="1"/>
    <path d="M10 12 L4.5 7.5 H2.5" fill="none" ${T} stroke-width="2.2"/>
    <path d="M2 7.5 h4" stroke="#c8362b" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="17.5" cy="41" r="3" fill="#2b2b2b" ${T}/><circle cx="36" cy="41" r="3" fill="#2b2b2b" ${T}/>`,
  piquet_cloture: `
    <path d="M5 21 Q14 25 22 20 Q30 15 42 22" stroke="#8a8f96" stroke-width="1.4" fill="none"/>
    <path d="M10 21.5 l-1.4 -1.6 l2.8 3.2 M34 17.6 l-1.4 -1.6 l2.8 3.2" stroke="#8a8f96" stroke-width="1.2"/>
    ${trait("M16 44 L19.5 25 Q21.5 16 33 8", "#5f7f45", 3.6)}
    <path d="M17.2 38 h2.6 M18.3 32 h2.6 M19.6 26 h2.6" stroke="${ENCRE}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M11 39 L20 41 L19 46 L10 44 Z" fill="#5f7f45" ${T} stroke-width="1.6"/>`,
  ressort_suspension: `${spires([10, 17, 24, 31, 38], "#c8362b", "#8e1c2e")}`,
  ressort_garage: `
    <g transform="rotate(-24 24 24)">
      <path d="M8 24 Q2 24 2.5 19 Q3.5 15 7.5 16" fill="none" ${T} stroke-width="2.2"/>
      <path d="M40 24 Q46 24 45.5 29 Q44.5 33 40.5 32" fill="none" ${T} stroke-width="2.2"/>
      <rect x="8" y="18" width="32" height="12" rx="3" fill="#8a8f96" ${T}/>
      <path d="M11 18 l2 12 M14.5 18 l2 12 M18 18 l2 12 M21.5 18 l2 12 M25 18 l2 12 M28.5 18 l2 12 M32 18 l2 12 M35.5 18 l2 12" stroke="${ENCRE}" stroke-width="1.2"/>
      <path d="M10 20.5 H38" stroke="#d6d8dc" stroke-width="1.4" stroke-linecap="round"/>
    </g>`,
  disque_scie: `
    <path d="${couronneDentee(24, 24, 15.5, 19.5, 18, [3, 4, 11])}" fill="#c9ccd0" ${T} stroke-width="1.6"/>
    <circle cx="24" cy="24" r="12" fill="none" stroke="#a8acb2" stroke-width="1.2"/>
    <circle cx="24" cy="24" r="6" fill="#8a8f96" ${T} stroke-width="1.6"/>
    <circle cx="24" cy="24" r="2.4" fill="${ENCRE}"/>
    <path d="M14 17 A12 12 0 0 1 21 12.5" stroke="#ffffff" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  lame_tondeuse: `
    <g transform="rotate(-24 24 24)">
      <path d="M4 27 L8 21 L40 19 L44 23 L40 27 L8 29 Z" fill="#55606a" ${T}/>
      <path d="M36 19.2 L44 23 L39 23.4 Z M4 27 L13 27.8 L8 29 Z" fill="#c9ccd0" ${T} stroke-width="1.2"/>
      <path d="M10 21.4 L22 20.6 M26 26.6 L38 25.8" stroke="#e8ecee" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="24" cy="24" r="2.6" fill="#f4ecd8" ${T} stroke-width="1.4"/>
    </g>`,
  couteau_cuisine: `
    <path d="M14 30 L40 5 Q43 14 33 26 L20 37 Z" fill="#c9ccd0" ${T}/>
    <path d="M25.5 31.5 l1.5 -2.5 l1.3 1.3 M31 26.8 l1.4 -2.3 l1.1 1.2" fill="none" stroke-width="1.1" ${T}/>
    <path d="M18 27 L36 10" stroke="#e8ecee" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M14 30 L20 37 L11 46 Q7 47 5 44.5 Q3 42 6 38 Z" fill="#2b2b2b" ${T}/>
    <circle cx="9.5" cy="41.5" r="1.1" fill="#c9ccd0"/><circle cx="13.3" cy="37.6" r="1.1" fill="#c9ccd0"/>
    <path d="M14.6 30.6 L19.4 36.2" stroke="#8a8f96" stroke-width="2.2" stroke-linecap="round"/>`,
  fut_200: `
    <path d="M10 10 H38 V39 A14 4.2 0 0 1 10 39 Z" fill="#2f5fa4" ${T}/>
    <path d="M10 20 A14 4.2 0 0 0 38 20 M10 30 A14 4.2 0 0 0 38 30" stroke="#1f4a80" stroke-width="3" fill="none"/>
    <path d="M10 20 A14 4.2 0 0 0 38 20 M10 30 A14 4.2 0 0 0 38 30" stroke="${ENCRE}" stroke-width="1.1" fill="none"/>
    <ellipse cx="24" cy="10" rx="14" ry="4.2" fill="#5f8fc8" ${T}/>
    <circle cx="18" cy="10" r="1.4" fill="${ENCRE}"/><circle cx="30.5" cy="10" r="2" fill="#2b2b2b" ${T} stroke-width="1"/>
    <path d="M15 16 V38" stroke="#8fb3d6" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
    <ellipse cx="31" cy="34" rx="2.6" ry="1.6" fill="#a4552f"/>`,

  // ---- Vélos, trottinettes et les bonnes trouvailles ----
  velo_libre_service: `
    <circle cx="11" cy="33" r="8.6" fill="none" stroke="#2b2b2b" stroke-width="3"/>
    <circle cx="37" cy="33" r="8.6" fill="none" stroke="#2b2b2b" stroke-width="3"/>
    <circle cx="11" cy="33" r="1.8" fill="#8a8f96" ${T} stroke-width="1"/><circle cx="37" cy="33" r="1.8" fill="#8a8f96" ${T} stroke-width="1"/>
    ${trait("M11 33 L21 33 L18 18 M21 33 Q23 22 31 16 L37 33 M11 33 L18 18", "#7fb83a", 2.8)}
    <path d="M14 17 h8" stroke="${ENCRE}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M31 16 L29.5 10 h5" fill="none" ${T} stroke-width="2.2"/>
    <rect x="34" y="11" width="11" height="8" rx="1" fill="#55524d" ${T} stroke-width="1.6"/>
    <path d="M37.5 11 v8 M41.5 11 v8" stroke="#8a8f96" stroke-width="1"/>
    <path d="M2 30 A9.6 9.6 0 0 1 17 25" stroke="#7fb83a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  velo_enfant: `
    <path d="M13 33 L7.5 38.5" stroke="${ENCRE}" stroke-width="1.8"/>
    <circle cx="7" cy="39" r="3" fill="#f4ecd8" ${T} stroke-width="1.6"/>
    <circle cx="14" cy="33" r="7.4" fill="none" stroke="#2b2b2b" stroke-width="3.2"/>
    <circle cx="35" cy="33" r="7.4" fill="none" stroke="#2b2b2b" stroke-width="3.2"/>
    ${trait("M14 33 L23 33 L31 20 L35 33 M23 33 L19.5 21 L31 20 M14 33 L19.5 21", "#3f8fb0", 3)}
    <path d="M16 19.5 h7.5" stroke="${ENCRE}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M31 20 L29 12.5 h6.5" fill="none" ${T} stroke-width="2.4"/>
    <path d="M35.5 12.5 l3 3 M35.5 12.5 l3.4 0.6" stroke="#e8789a" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="23" cy="33" r="2.6" fill="#e8789a" ${T} stroke-width="1.2"/>`,
  velo_appartement: `
    <path d="M5 43 H43" stroke="${ENCRE}" stroke-width="3" stroke-linecap="round"/>
    ${trait("M14 43 L20 22 M20 31 L33 39 M37 43 L31 16", "#8a8f96", 3)}
    <circle cx="33" cy="35" r="7" fill="#55606a" ${T}/>
    <circle cx="33" cy="35" r="2.2" fill="#c9ccd0" ${T} stroke-width="1.2"/>
    <path d="M15 20 h10" stroke="${ENCRE}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M31 16 L34 9" ${T} stroke-width="2.4"/>
    <rect x="32" y="3" width="12" height="8" rx="1.6" fill="#3f8fb0" ${T} stroke-width="1.6"/>
    <path d="M34.5 8.5 l2.4 -2.4 l2 1.6 l2.6 -2.8" stroke="#d8f4ff" stroke-width="1.2" fill="none"/>
    <path d="M28 14 h6" stroke="${ENCRE}" stroke-width="2.4" stroke-linecap="round"/>`,
  trottinette_electrique: `
    ${trait("M8 36 H34", "#55606a", 3.4)}
    ${trait("M34 36 L31 7", "#55606a", 2.6)}
    ${trait("M24 7 H38", "#2b2b2b", 2.4)}
    <rect x="13" y="38" width="15" height="4" rx="1" fill="#2b2b2b" ${T} stroke-width="1.4"/>
    <path d="M21 38.6 l-1.6 1.8 h2.4 l-1.6 1.8" stroke="#d8c43a" stroke-width="1" fill="none"/>
    <rect x="28.6" y="10" width="5" height="5" rx="1" transform="rotate(-6 31 12.5)" fill="#3f8fb0" ${T} stroke-width="1.2"/>
    <circle cx="9" cy="39" r="5" fill="#2b2b2b" ${T}/><circle cx="35.5" cy="39" r="5" fill="#2b2b2b" ${T}/>
    <circle cx="9" cy="39" r="1.8" fill="#8a8f96"/><circle cx="35.5" cy="39" r="1.8" fill="#8a8f96"/>`,
  onduleur: `
    <rect x="12" y="5" width="24" height="38" rx="3" fill="#2b2b2b" ${T}/>
    <rect x="15" y="9" width="18" height="12" rx="2" fill="#3a3a3a" ${T} stroke-width="1.2"/>
    <rect x="18" y="12" width="10" height="6" rx="1" fill="none" stroke="#d8c43a" stroke-width="1.4"/>
    <rect x="28.2" y="13.8" width="1.6" height="2.4" fill="#d8c43a"/>
    <rect x="19.4" y="13.4" width="2.6" height="3.2" fill="#c8362b"/>
    <circle cx="24" cy="29" r="4.2" fill="#55606a" ${T} stroke-width="1.4"/>
    <path d="M24 26.6 v2.4 M22 27.6 a2.8 2.8 0 1 0 4 0" stroke="#8fd06a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M16 36 h16 M16 38.6 h16" stroke="#6a6a6a" stroke-width="1.2"/>`,
  appareils_mariage: `
    <path d="M34 18 L38 12 V34 L34 40 Z" fill="#d6cbb0" ${T}/>
    <path d="M6 18 L10 12 H38 L34 18 Z" fill="#e8dcc8" ${T}/>
    <path d="M6 18 H34 V40 H6 Z" fill="#f4ecd8" ${T}/>
    <path d="${coeur(14, 26, 4.4)}" fill="#e8a8b8" ${T} stroke-width="1.2"/>
    <rect x="21" y="26" width="22" height="15" rx="2" fill="#d8c43a" ${T}/>
    <rect x="24" y="23.5" width="5" height="2.6" fill="#55524d" ${T} stroke-width="1"/>
    <circle cx="34.5" cy="33.5" r="4.4" fill="#2b2b2b" ${T} stroke-width="1.4"/>
    <circle cx="34.5" cy="33.5" r="2" fill="#3f6f8f"/>
    <rect x="23.5" y="28.5" width="5" height="3" fill="#f4f4ee" ${T} stroke-width="1"/>`,
  tondeuse_robot: `
    <path d="M6 45 l1 -4 M10 45 l1 -4 M38 45 l1 -4 M42 45 l1 -4 M24 45 l1 -3" stroke="#5d8a46" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="12" cy="38" r="4" fill="#2b2b2b" ${T}/><circle cx="36" cy="38" r="4" fill="#2b2b2b" ${T}/>
    <path d="M4 34 H44 V36.5 Q44 38 42 38 H6 Q4 38 4 36.5 Z" fill="#3a3a3a" ${T}/>
    <path d="M4 34 Q6 19 24 17 Q42 19 44 34 Z" fill="#7fae5a" ${T}/>
    <ellipse cx="24" cy="23.5" rx="7" ry="3" fill="#2b2b2b" ${T} stroke-width="1.4"/>
    <circle cx="24" cy="23.5" r="1.8" fill="#c8362b"/>
    <path d="M10 28 Q14 22 20 20.5" stroke="#b8e09a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  debroussailleuse: `
    ${trait("M10 39 L36 13", "#c9ccd0", 2.4)}
    <path d="M22 25 Q15 18 21 13" fill="none" stroke="${ENCRE}" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M22 25 Q15 18 21 13" fill="none" stroke="#2b2b2b" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="31" y="4" width="13" height="11" rx="2.4" transform="rotate(45 37.5 9.5)" fill="#e8743a" ${T}/>
    <path d="M42 2 l2 -1.5 M44.5 5 l2.6 0 M41 0.5 l0 0" stroke="#ffd27a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M3 35 Q6 44 15 45 L11.5 40 Z" fill="#e8743a" ${T} stroke-width="1.6"/>
    <circle cx="9.5" cy="40.5" r="3.6" fill="#55524d" ${T} stroke-width="1.6"/>
    <path d="M6 40.5 h-4 M13 41.5 l3.6 1.2" stroke="#d8c43a" stroke-width="1.6" stroke-linecap="round"/>`,

  // ---- Les retardataires du lot 1 (0.4 à 0.6) ----
  reveil: `
    <path d="M13 41 l-3 4 M35 41 l3 4" stroke="${ENCRE}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M9 13 A7 7 0 0 1 19 6.5 Z" fill="#d8c43a" ${T}/>
    <path d="M39 13 A7 7 0 0 0 29 6.5 Z" fill="#d8c43a" ${T}/>
    <path d="M24 9 V5 M21 5 h6" ${T} stroke-width="2"/>
    <circle cx="24" cy="27" r="15" fill="#c8362b" ${T}/>
    <circle cx="24" cy="27" r="11" fill="#f4ecd8" ${T} stroke-width="1.6"/>
    <path d="M24 18 v1.8 M24 34.2 v1.8 M15 27 h1.8 M31.2 27 h1.8" stroke-width="1.4" ${T}/>
    <path d="M24 27 V20.5 M24 27 L29 30" ${T} stroke-width="2"/>`,
  roulements: `
    <path d="M6 30 L16 22 H42 L32 30 Z" fill="#e8d8a8" ${T}/>
    <path d="M6 30 H32 V42 H6 Z" fill="#c9a77a" ${T}/>
    <path d="M32 30 L42 22 V34 L32 42 Z" fill="#b8946a" ${T}/>
    <circle cx="25" cy="17" r="12" fill="#c9ccd0" ${T}/>
    <circle cx="25" cy="17" r="5" fill="#f4ecd8" ${T} stroke-width="1.6"/>
    <circle cx="25" cy="17" r="8.5" fill="none" stroke="#8a8f96" stroke-width="3.2"/>
    <g fill="#ffffff" ${T} stroke-width="1"><circle cx="25" cy="8.5" r="1.7"/><circle cx="33.5" cy="17" r="1.7"/><circle cx="25" cy="25.5" r="1.7"/><circle cx="16.5" cy="17" r="1.7"/><circle cx="31" cy="11" r="1.7"/><circle cx="19" cy="11" r="1.7"/><circle cx="31" cy="23" r="1.7"/><circle cx="19" cy="23" r="1.7"/></g>
    <path d="M10 35 h14" stroke="#8a6a3e" stroke-width="1.4" stroke-linecap="round"/>`,
  alternateur_tracteur: `
    <path d="M14 11 H34 Q40 11 40 17 V31 Q40 37 34 37 H14 Z" fill="#8a8f96" ${T}/>
    <path d="M18 13 V35 M23 13 V35 M28 13 V35 M33 13 V35" stroke="#55606a" stroke-width="2.2"/>
    <rect x="34" y="20" width="8" height="8" rx="1.4" fill="#2b2b2b" ${T} stroke-width="1.6"/>
    <ellipse cx="14" cy="24" rx="5" ry="13" fill="#a8acb2" ${T}/>
    <ellipse cx="9" cy="24" rx="3.6" ry="9" fill="#55524d" ${T}/>
    <ellipse cx="9" cy="24" rx="1.4" ry="3" fill="#c9ccd0" ${T} stroke-width="1"/>
    <path d="M37 13 l3 -4" stroke="#c8743a" stroke-width="2" stroke-linecap="round"/>`,
  semences_f1: `
    <path d="M10 8 H38 V42 H10 Z" fill="#f4ecd8" ${T}/>
    <path d="M10 8 H38 V13 H10 Z" fill="#5d8a46" ${T} stroke-width="1.6"/>
    <circle cx="24" cy="27" r="9" fill="#c8362b" ${T}/>
    <path d="M24 18 l-4 -2.4 M24 18 l4 -2.4 M24 18 v-3" stroke="#5d8a46" stroke-width="2" stroke-linecap="round"/>
    <path d="M19 23.5 q2 -2.5 5 -2.5" stroke="#f08a7a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M14 38.5 h20" stroke-width="1.3" ${T}/>
    <path d="M14 10.5 h7" stroke="#f4ecd8" stroke-width="1.4" stroke-linecap="round"/>`,
  cle_coffre: `
    <path d="M6 6 Q12 10 13 16" stroke="#8a8f96" stroke-width="1.8" stroke-dasharray="2.6 1.4" fill="none"/>
    <rect x="2" y="2" width="11" height="7" rx="1.4" transform="rotate(-12 7.5 5.5)" fill="#e8d8a8" ${T} stroke-width="1.4"/>
    <circle cx="17" cy="20" r="7" fill="#c9a24a" ${T}/>
    <circle cx="17" cy="20" r="2.6" fill="#f4ecd8" ${T} stroke-width="1.4"/>
    <path d="M22 25 L38 41" stroke="${ENCRE}" stroke-width="5.4" stroke-linecap="round"/>
    <path d="M22 25 L38 41" stroke="#d8b85a" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 33 l-3 3 l2 2 M35 38 l-3 3 l2 2 M32 31 l3 -3 l2 2" fill="none" ${T} stroke-width="1.8"/>`,
  radio_piles: `
    ${trait("M32 15 L40 3", "#c9ccd0", 1.6)}
    <rect x="5" y="15" width="38" height="25" rx="4" fill="#e8743a" ${T}/>
    <path d="M14 15 Q14 9 24 9 Q34 9 34 15" fill="none" ${T} stroke-width="2.4"/>
    <circle cx="16" cy="28" r="7.5" fill="#55524d" ${T} stroke-width="1.6"/>
    <path d="M11 25 h10 M10 28 h12 M11 31 h10" stroke="#8a8f96" stroke-width="1.2"/>
    <rect x="27" y="20" width="12" height="6" rx="1" fill="#f4ecd8" ${T} stroke-width="1.2"/>
    <path d="M32 20 v6" stroke="#c8362b" stroke-width="1.2"/>
    <circle cx="30" cy="33" r="2.6" fill="#2b2b2b" ${T} stroke-width="1.2"/><circle cx="37" cy="33" r="2.6" fill="#2b2b2b" ${T} stroke-width="1.2"/>`,
  manche_fendu: `
    <path d="M9 41 L35 9" stroke="${ENCRE}" stroke-width="7.4" stroke-linecap="round"/>
    <path d="M9 41 L35 9" stroke="#a07c48" stroke-width="5" stroke-linecap="round"/>
    <path d="M22 26 L31 15 Q35 12 39 6 Q37 13 33 16" fill="#a07c48" ${T} stroke-width="1.6"/>
    <path d="M14 35 L22 25.5 L20 31 L26 22" stroke="${ENCRE}" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
    <path d="M12 36 l4 -4.6" stroke="#c9a77a" stroke-width="1.4" stroke-linecap="round"/>`,
  ferraille_tordue: `
    <path d="M6 36 Q12 24 20 30 Q28 36 32 22 Q35 12 42 12" fill="none" stroke="${ENCRE}" stroke-width="7.4" stroke-linecap="round"/>
    <path d="M6 36 Q12 24 20 30 Q28 36 32 22 Q35 12 42 12" fill="none" stroke="#6e6a63" stroke-width="5" stroke-linecap="round"/>
    <path d="M8 33 Q12 27 18 29" stroke="#a8acb2" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M30 25 l3 2 l-1 3" fill="none" ${T} stroke-width="1.4"/>
    <path d="M21 31 l2 -1 M36 15 l1.6 1" stroke="#a4552f" stroke-width="2" stroke-linecap="round"/>`,
  // La décharge (P-001) : un tas d'ordures où l'on fouille.
  decharge: `
    <path d="M3 42 Q8 26 18 24 Q24 16 32 22 Q42 24 45 42 Z" fill="#9a958c" ${T}/>
    <circle cx="14" cy="34" r="5.4" fill="none" stroke="#2b2b2b" stroke-width="3.6"/>
    <path d="M24 22 L30 13 L36 22 Z" fill="#f07a2a" ${T} stroke-width="1.6"/>
    <path d="M26.2 19 h7.6" stroke="#f4f4ee" stroke-width="1.6"/>
    <rect x="28" y="31" width="7" height="9" rx="1.2" transform="rotate(-20 31.5 35.5)" fill="#3f8fb0" ${T} stroke-width="1.4"/>
    <path d="M20 29 l4 -3 l3 2 l-2 4 Z" fill="#dfe8ea" ${T} stroke-width="1.2"/>
    <path d="M38 33 l4 -2 M8 40 l3 -1" stroke-width="1.2" ${T}/>
    <path d="M3 42 H45" ${T}/>`,
};
