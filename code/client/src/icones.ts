// Icônes des objets, dessinées en vectoriel dans la charte du jeu : trait d'encre, aplats de la palette,
// sur fond papier (Book 18 §6.3). Provisoires : à terme, rendues automatiquement depuis les modèles 3D
// (Book 21 §5.2.7), mais au même format (carré 48 × 48).

import type { TypeObjet } from "../../commun/src/objets.ts";

const ENCRE = "#3b2a1e";
const T = `stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

export type Pictogramme = TypeObjet | "feu_de_camp" | "etabli" | "abri" | "coffre" | "charbonniere" | "forge" | "pedalier" | "banc_recharge" | "escabeau" | "poches" | "recuperateur_pluie" | "alarme_boites" | "lit_branchages";

const DESSINS: Record<Pictogramme, string> = {
  branche: `
    <path d="M7 36 L40 13" stroke-width="4.5" fill="none" stroke="#5a4130" ${T}/>
    <path d="M7 36 L40 13" stroke="#7a5a3c" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M22 25 L27 34 M30 19 L35 25 M15 31 L13 22" fill="none" ${T}/>`,
  buche: `
    <path d="M8 20 L33 12 L40 28 L15 36 Z" fill="#7a5a3c" ${T}/>
    <ellipse cx="36.5" cy="20" rx="5" ry="8.5" transform="rotate(-18 36.5 20)" fill="#c9a77a" ${T}/>
    <ellipse cx="36.5" cy="20" rx="2" ry="3.5" transform="rotate(-18 36.5 20)" fill="none" stroke-width="1.2" ${T}/>
    <path d="M13 26 L30 21" stroke-width="1.2" fill="none" ${T}/>`,
  pierre: `
    <path d="M8 31 L13 18 L25 12 L37 16 L41 28 L33 37 L16 38 Z" fill="#8f8a80" ${T}/>
    <path d="M13 18 L22 24 L25 12 M22 24 L33 37 M22 24 L41 28" stroke-width="1.2" fill="none" opacity="0.6" ${T}/>`,
  baies: `
    <path d="M24 9 Q26 14 22 18" fill="none" ${T}/>
    <path d="M24 10 Q32 6 35 12 Q29 14 24 10 Z" fill="#5d8a46" ${T}/>
    <circle cx="18" cy="26" r="6" fill="#b3243a" ${T}/><circle cx="29" cy="27" r="6" fill="#b3243a" ${T}/>
    <circle cx="23" cy="35" r="6" fill="#8e1c2e" ${T}/>
    <circle cx="16" cy="24" r="1.6" fill="#f4ecd8"/><circle cx="27" cy="25" r="1.6" fill="#f4ecd8"/>`,
  conserve: `
    <path d="M12 12 h24 v26 a12 4 0 0 1 -24 0 Z" fill="#b8b4ac" ${T}/>
    <ellipse cx="24" cy="12" rx="12" ry="4" fill="#d6d2ca" ${T}/>
    <path d="M12 19 h24 v13 h-24 Z" fill="#c8362b" ${T}/>
    <path d="M18 25.5 l3 -3 l3 3 l3 -3 l3 3" stroke="#f4ecd8" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  couteau: `
    <path d="M9 37 L27 19 L38 9 Q40 14 33 22 L19 33 Z" fill="#c9ccd0" ${T}/>
    <path d="M23 25 l2 2 M28 21 l1.6 1.6" stroke-width="1.2" ${T}/>
    <path d="M6 41 L15 32 L19 36 L10 45 Z" fill="#6b4a32" ${T}/>`,
  briquet: `
    <rect x="15" y="17" width="18" height="24" rx="3" fill="#2f5fa4" ${T}/>
    <rect x="15" y="12" width="12" height="7" fill="#c9ccd0" ${T}/>
    <circle cx="30" cy="14" r="3" fill="#8f8a80" ${T}/>
    <path d="M21 4 Q25 8 22 12 Q18 9 21 4 Z" fill="#ffa040" stroke-width="1.4" ${T}/>`,
  gourde: `
    <rect x="20" y="5" width="8" height="6" rx="1.5" fill="#3b2a1e"/>
    <path d="M17 11 h14 l3 6 v20 a4 4 0 0 1 -4 4 h-12 a4 4 0 0 1 -4 -4 v-20 Z" fill="#7f8f3a" ${T}/>
    <path d="M14 22 h20" stroke-width="1.4" ${T}/><path d="M14 30 h20" stroke-width="1.4" ${T}/>`,
  sac_a_dos: `
    <path d="M14 15 Q14 8 24 8 Q34 8 34 15 v22 a4 4 0 0 1 -4 4 h-12 a4 4 0 0 1 -4 -4 Z" fill="#a4552f" ${T}/>
    <path d="M17 26 h14 v9 h-14 Z" fill="#8a4426" ${T}/>
    <path d="M19 8 Q24 3 29 8" fill="none" ${T}/>`,
  pierre_a_feu: `
    <path d="M7 30 L14 17 L26 15 L30 26 L21 36 Z" fill="#5c5650" ${T}/>
    <path d="M27 31 L41 23 L43 27 L29 35 Z" fill="#c9ccd0" ${T}/>
    <path d="M30 14 l3 -5 M35 17 l5 -3 M33 21 l6 0" stroke="#ff8a3d" stroke-width="2.2" stroke-linecap="round"/>`,
  ficelle: `
    <path d="M10 30 C16 18 22 40 28 26 S38 16 40 22" fill="none" stroke="#c9b48a" stroke-width="3" stroke-linecap="round"/>
    <path d="M10 30 C16 18 22 40 28 26 S38 16 40 22" fill="none" ${T} stroke-width="1"/>
    <circle cx="24" cy="31" r="6" fill="#d8c69c" ${T}/><path d="M19 29 Q24 34 29 29 M20 33 Q24 28 28 33" fill="none" stroke-width="1" ${T}/>`,
  baton_fouir: `
    <path d="M12 40 L34 8" stroke="#6b4a32" stroke-width="5" stroke-linecap="round"/>
    <path d="M12 40 L34 8" fill="none" ${T} stroke-width="1.2"/>
    <path d="M30 14 L38 4 L36 15 Z" fill="#3b2a1e" ${T}/>
    <path d="M17 33 l3 1 M21 27 l3 1" stroke-width="1.2" ${T}/>`,
  epieu: `
    <path d="M7 43 L38 9" stroke="#7a5a3c" stroke-width="4" stroke-linecap="round"/>
    <path d="M7 43 L38 9" fill="none" ${T} stroke-width="1"/>
    <path d="M34 13 L44 4 L40 17 Z" fill="#2e2018" ${T}/>
    <path d="M33 12 l4 4" stroke="#ff8a3d" stroke-width="1.6"/>`,
  boite_vide: `
    <path d="M13 13 h22 v24 a11 4 0 0 1 -22 0 Z" fill="#c8c4bc" ${T}/>
    <ellipse cx="24" cy="13" rx="11" ry="4" fill="#5c5650" ${T}/>
    <path d="M30 10 L38 4 L36 12" fill="#d6d2ca" ${T}/>
    <path d="M14 22 h20 M14 29 h20" stroke-width="1" opacity="0.5" ${T}/>`,
  protege_bras: `
    <path d="M10 18 Q24 12 38 18 V32 Q24 38 10 32 Z" fill="#c9b48a" ${T}/>
    <path d="M15 16 V35 M22 14 V37 M29 14 V37 M35 16 V35" stroke-width="1" opacity="0.5" ${T}/>
    <path d="M10 22 Q24 17 38 22 M10 29 Q24 34 38 29" stroke="#8a6a3e" stroke-width="2" fill="none"/>`,
  travois: `
    <path d="M8 6 L30 42 M40 6 L34 42" stroke="#6b4a32" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M17 22 H38 M20 28 H37 M23 34 H36" stroke="#a07c48" stroke-width="3" stroke-linecap="round"/>
    <path d="M8 6 L30 42 M40 6 L34 42" fill="none" ${T} stroke-width="1"/>`,
  recuperateur_pluie: `
    <path d="M8 16 L40 16 L28 26 L20 26 Z" fill="#2f6fa4" ${T}/>
    <path d="M10 16 V40 M38 16 V40" stroke-width="2.5" ${T}/>
    <path d="M24 27 v4" stroke="#5f8fa8" stroke-width="2" stroke-dasharray="2 2"/>
    <path d="M17 34 h14 l-2 7 h-10 Z" fill="#8a8f94" ${T}/>
    <path d="M14 6 l-1 4 M24 4 l-1 4 M34 6 l-1 4" stroke="#5f8fa8" stroke-width="2" stroke-linecap="round"/>`,
  alarme_boites: `
    <path d="M8 40 V14 M40 40 V14" stroke="#6b4a32" stroke-width="3" stroke-linecap="round"/>
    <path d="M8 16 Q24 20 40 16" fill="none" stroke="#c9b48a" stroke-width="1.6"/>
    <path d="M18 18 v5 M30 18 v5" stroke-width="1" ${T}/>
    <rect x="14" y="23" width="8" height="10" rx="1.5" fill="#c8c4bc" ${T}/>
    <rect x="26" y="23" width="8" height="10" rx="1.5" fill="#c8c4bc" ${T}/>
    <path d="M12 30 l-4 2 M36 30 l4 2" stroke="#ffb347" stroke-width="1.6"/>`,
  lit_branchages: `
    <path d="M6 30 L42 30 L38 38 L10 38 Z" fill="#6b4a32" ${T}/>
    <path d="M8 30 Q14 20 20 30 Q26 18 32 30 Q38 21 42 30" fill="#56703d" ${T}/>
    <path d="M12 27 l4 -4 M24 25 l3 -5 M35 26 l3 -4" stroke="#3f5a2c" stroke-width="1.4"/>`,
  marteau: `
    <path d="M23 18 L27 18 L28 43 L22 43 Z" fill="#7a5a3c" ${T}/>
    <path d="M10 9 h26 a3 3 0 0 1 3 3 v6 h-29 Z" fill="#55524d" ${T}/>
    <path d="M10 9 v9 l-4 -2 v-5 Z" fill="#6e6a63" ${T}/>`,
  lampe_dynamo: `
    <path d="M12 17 h18 v18 h-18 Z" fill="#7f8f3a" ${T}/>
    <path d="M30 20 l9 -5 v22 l-9 -5 Z" fill="#d8c43a" ${T}/>
    <path d="M17 35 v6 h8" fill="none" ${T}/><circle cx="25" cy="41" r="2.5" fill="#3b2a1e"/>`,
  panneau_solaire: `
    <path d="M9 14 L39 10 L42 32 L12 37 Z" fill="#1f3550" ${T}/>
    <path d="M19 12.7 L22 35.4 M29 11.3 L32 33.7 M10.5 25.5 L40.5 21" stroke="#8fb3d6" stroke-width="1.3" fill="none"/>
    <path d="M14 15.5 L18 15" stroke="#e8f1fa" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <path d="M26 35 L27 41 M20 41 L34 39" fill="none" ${T}/>`,
  chiffons: `
    <path d="M9 30 C12 22 18 20 24 22 S36 18 40 24 L37 34 C30 36 22 33 16 37 Z" fill="#d8ccb0" ${T}/>
    <path d="M14 30 C20 27 26 29 32 26" fill="none" stroke="#a89878" stroke-width="1.5"/>
    <path d="M18 24 L22 31 M29 22 L31 30" fill="none" stroke="#a89878" stroke-width="1.2"/>`,
  pansement: `
    <rect x="10" y="17" width="28" height="14" rx="4" transform="rotate(-20 24 24)" fill="#f2ead6" ${T}/>
    <rect x="19" y="19" width="10" height="10" rx="1.5" transform="rotate(-20 24 24)" fill="#e6dabd" stroke="#c8362b" stroke-width="1.6"/>
    <path d="M24 21 v6 M21 24 h6" transform="rotate(-20 24 24)" stroke="#c8362b" stroke-width="2" stroke-linecap="round"/>`,
  petite_batterie: `
    <rect x="9" y="14" width="30" height="24" rx="2" fill="#2b2b2b" ${T}/>
    <rect x="13" y="9" width="6" height="5" fill="#c8362b" ${T}/><rect x="29" y="9" width="6" height="5" fill="#8f8a80" ${T}/>
    <path d="M24 19 l-4 8 h5 l-3 7" stroke="#d8c43a" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`,
  scie: `
    <path d="M8 30 L36 14 L41 22 L13 38 Z" fill="#c9ccd0" ${T}/>
    <path d="M13 38 l1 -4 l3 2 l1 -4 l3 2 l1 -4 l3 2 l1 -4 l3 2 l1 -4 l3 2 l1 -4 l3 2" stroke-width="1.3" fill="none" ${T}/>
    <path d="M3 33 L10 27 L15 34 L8 40 Z" fill="#7a5a3c" ${T}/>`,
  corde: `
    <ellipse cx="24" cy="25" rx="15" ry="13" fill="#c9a26a" ${T}/>
    <ellipse cx="24" cy="25" rx="9" ry="7.5" fill="none" ${T}/>
    <ellipse cx="24" cy="25" rx="4" ry="3" fill="#a07c48" ${T}/>
    <path d="M37 31 Q42 38 36 43" fill="none" stroke-width="2.5" ${T}/>`,
  torche: `
    <path d="M21 22 L27 22 L25 44 L23 44 Z" fill="#7a5a3c" ${T}/>
    <path d="M19 22 h10 v4 h-10 Z" fill="#5a4130" ${T}/>
    <path d="M24 4 Q33 13 29 21 h-10 Q15 13 24 4 Z" fill="#ff8a3d" ${T}/>
    <path d="M24 11 Q28 16 26 20 h-4 Q20 16 24 11 Z" fill="#ffe08a"/>`,
  lampe_frontale: `
    <path d="M8 26 Q24 14 40 26" fill="none" stroke-width="4" stroke="#222" ${T}/>
    <rect x="17" y="17" width="14" height="11" rx="2.5" fill="#d8c43a" ${T}/>
    <circle cx="24" cy="22.5" r="3.4" fill="#eef4ff" ${T}/>
    <path d="M24 31 l-6 10 M24 31 l0 11 M24 31 l6 10" stroke="#e6f0ff" stroke-width="1.6" opacity="0.8" stroke-linecap="round"/>`,
  lanterne: `
    <path d="M18 8 Q24 2 30 8" fill="none" ${T}/>
    <path d="M15 11 h18 l-2 5 h-14 Z" fill="#55524d" ${T}/>
    <path d="M17 16 h14 v19 h-14 Z" fill="#ffd27a" ${T}/>
    <path d="M24 16 v19 M17 25 h14" stroke-width="1.2" ${T}/>
    <path d="M14 35 h20 v5 h-20 Z" fill="#55524d" ${T}/>`,
  hache: `
    <path d="M14 42 L31 12" stroke-width="5" stroke="#7a5a3c" ${T}/>
    <path d="M14 42 L31 12" stroke="#9a7a52" stroke-width="2" stroke-linecap="round"/>
    <path d="M26 9 Q35 4 41 12 Q36 15 33 22 L27 18 Z" fill="#8a8a88" ${T}/>
    <path d="M38 9 Q41 12 40 16" stroke="#c9ccd0" stroke-width="1.6" fill="none"/>`,
  tete_hache: `
    <path d="M12 16 Q24 6 38 14 Q33 22 34 34 Q22 30 12 32 Z" fill="#8a6b52" ${T}/>
    <circle cx="21" cy="21" r="3.5" fill="#3b2a1e"/>
    <path d="M30 15 Q34 22 33 31" stroke="#c9ccd0" stroke-width="1.6" fill="none"/>`,
  cle_plate: `
    <path d="M13 37 L33 15" stroke-width="6" stroke="#8a8a88" ${T}/>
    <path d="M13 37 L33 15" stroke="#c9ccd0" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M30 10 a7 7 0 1 1 8 10 l-4 -4 l-4 1 l1 -4 Z" fill="#c9ccd0" ${T}/>
    <path d="M8 34 a5 5 0 1 0 7 7 l-3 -3 Z" fill="#c9ccd0" ${T}/>`,
  tournevis: `
    <path d="M7 41 L17 31 L22 36 L12 46 Z" fill="#c8362b" ${T}/>
    <path d="M19 33 L37 15" stroke-width="3.5" stroke="#8a8a88" ${T}/>
    <path d="M37 15 l4 -4" stroke-width="2.5" ${T}/>`,
  cadre_velo: `
    <path d="M12 34 L22 18 L36 18 L28 34 Z M22 18 L28 34 M36 18 L40 34 M20 14 h6 M34 13 l3 5" fill="none" stroke-width="2.6" stroke="#5f7f45" ${T}/>
    <circle cx="28" cy="34" r="2.5" fill="#3b2a1e"/>`,
  chaine_velo: `
    <path d="M8 26 Q8 16 18 16 h12 Q40 16 40 26 Q40 36 30 36 h-12 Q8 36 8 26 Z" fill="none" stroke="#55524d" stroke-width="4" stroke-dasharray="3 2"/>
    <circle cx="16" cy="26" r="5" fill="#8a8a88" ${T}/>`,
  roue_velo: `
    <circle cx="24" cy="24" r="17" fill="none" stroke="#2b2b2b" stroke-width="4"/>
    <circle cx="24" cy="24" r="14" fill="none" stroke-width="1.4" ${T}/>
    <path d="M24 10 V38 M10 24 H38 M14 14 L34 34 M34 14 L14 34" stroke-width="1" ${T}/>
    <circle cx="24" cy="24" r="3" fill="#8a8a88" ${T}/>`,
  dynamo_velo: `
    <rect x="16" y="12" width="14" height="26" rx="6" fill="#c9ccd0" ${T}/>
    <circle cx="23" cy="9" r="4" fill="#55524d" ${T}/>
    <path d="M30 26 h8 M30 32 h8" ${T}/>
    <path d="M23 20 l-3 6 h5 l-3 6" stroke="#d8c43a" stroke-width="2" fill="none"/>`,
  ressort_lames: `
    <path d="M6 22 Q24 12 42 22" fill="none" stroke="#55524d" stroke-width="5" stroke-linecap="round"/>
    <path d="M9 29 Q24 20 39 29" fill="none" stroke="#6e6a63" stroke-width="5" stroke-linecap="round"/>
    <path d="M13 35 Q24 28 35 35" fill="none" stroke="#8a8a88" stroke-width="5" stroke-linecap="round"/>`,
  bache: `
    <path d="M8 16 L36 10 L41 32 L13 38 Z" fill="#2f6fa4" ${T}/>
    <path d="M13 38 L18 30 L41 32" fill="#245a88" ${T}/>
    <circle cx="11" cy="18" r="1.6" fill="#f4ecd8"/><circle cx="35" cy="12" r="1.6" fill="#f4ecd8"/>`,
  barre_metal: `
    <path d="M7 38 L41 10" stroke="#3b2a1e" stroke-width="7" stroke-linecap="round"/>
    <path d="M7 38 L41 10" stroke="#8a8a88" stroke-width="4" stroke-linecap="round"/>
    <path d="M20 29 l2 -2 M29 21 l2 -2" stroke="#a4552f" stroke-width="2" stroke-linecap="round"/>`,
  batterie_voiture: `
    <rect x="7" y="15" width="34" height="24" rx="2" fill="#2b2b2b" ${T}/>
    <rect x="7" y="15" width="34" height="5" fill="#3a3a3a" ${T}/>
    <rect x="11" y="10" width="6" height="5" fill="#c8362b" ${T}/><rect x="31" y="10" width="6" height="5" fill="#8f8a80" ${T}/>
    <path d="M14 29 h6 M17 26 v6 M28 29 h6" stroke="#f4ecd8" stroke-width="2" stroke-linecap="round"/>`,
  etabli: `
    <path d="M6 20 h36 v5 h-36 Z" fill="#a07c48" ${T}/>
    <path d="M10 25 v15 M38 25 v15 M10 33 h28" stroke-width="3" stroke="#7a5a3c" ${T}/>
    <path d="M14 20 v-5 h6 v5 M30 14 l6 6" ${T}/>`,
  fibres: `
    <path d="M12 40 C14 28 18 18 24 8 M18 40 C19 30 22 20 30 10 M24 40 C24 30 27 22 36 14 M30 40 C30 32 33 26 40 20" stroke="#6f8b4e" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M10 34 Q24 30 38 36" stroke="#b59a6a" stroke-width="3" fill="none" ${T}/>`,
  pomme: `
    <path d="M24 16 Q14 10 9 20 Q6 32 15 39 Q20 42 24 39 Q28 42 33 39 Q42 32 39 20 Q34 10 24 16 Z" fill="#c8362b" ${T}/>
    <path d="M24 16 Q25 10 28 7" fill="none" stroke="#5a4130" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M27 11 Q35 6 38 12 Q31 15 27 11 Z" fill="#5d8a46" ${T}/>
    <path d="M14 22 Q13 27 15 31" stroke="#f4ecd8" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/>`,
  poire: `
    <path d="M24 10 Q19 11 19 19 Q19 23 15 28 Q10 36 17 41 Q24 45 31 41 Q38 36 33 28 Q29 23 29 19 Q29 11 24 10 Z" fill="#c9b84a" ${T}/>
    <path d="M24 10 Q24 6 27 4" fill="none" stroke="#5a4130" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M17 31 Q16 35 18 38" stroke="#f4ecd8" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/>`,
  prunes: `
    <ellipse cx="17" cy="29" rx="8" ry="10" fill="#4b2c5e" ${T}/>
    <ellipse cx="31" cy="27" rx="8" ry="10" fill="#5e3a74" ${T}/>
    <path d="M31 18 Q31 22 30 36 M17 20 Q18 25 17 38" stroke="#3b2a1e" stroke-width="1" fill="none" opacity="0.5"/>
    <path d="M24 9 L31 17 M24 9 L17 19" fill="none" stroke="#5a4130" stroke-width="2"/>
    <ellipse cx="14" cy="26" rx="1.6" ry="3" fill="#b8a8d0" opacity="0.6"/>`,
  cerises: `
    <path d="M30 6 Q22 14 16 28 M30 6 Q32 18 33 30" fill="none" stroke="#5a4130" stroke-width="2" stroke-linecap="round"/>
    <path d="M30 6 Q38 2 41 8 Q35 10 30 6 Z" fill="#5d8a46" ${T}/>
    <circle cx="15" cy="34" r="7" fill="#8e1c2e" ${T}/><circle cx="33" cy="36" r="7" fill="#a81f33" ${T}/>
    <circle cx="13" cy="32" r="1.8" fill="#f4ecd8" opacity="0.8"/><circle cx="31" cy="34" r="1.8" fill="#f4ecd8" opacity="0.8"/>`,
  noix: `
    <circle cx="24" cy="25" r="14" fill="#b88a5a" ${T}/>
    <path d="M24 11 Q20 25 24 39" fill="none" ${T}/>
    <path d="M14 18 Q18 21 17 26 Q16 31 19 34 M34 18 Q30 21 31 26 Q32 31 29 34" fill="none" stroke="#7a5a3c" stroke-width="1.6"/>`,
  cepe: `
    <path d="M17 26 Q14 34 16 40 Q24 44 32 40 Q34 34 31 26 Z" fill="#efe3c6" ${T}/>
    <path d="M18 34 Q24 36 30 34" stroke="#c9b998" stroke-width="1.4" fill="none"/>
    <path d="M6 26 Q8 8 24 8 Q40 8 42 26 Q24 30 6 26 Z" fill="#7a4a26" ${T}/>
    <path d="M8 26 Q24 31 40 26" stroke="#e6d6a8" stroke-width="2.4" fill="none"/>
    <path d="M14 14 Q19 10 24 11" stroke="#a87a50" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  amanite_tue_mouches: `
    <path d="M20 26 L19 41 h10 L28 26 Z" fill="#f4ecd8" ${T}/>
    <path d="M17 32 Q24 35 31 32 L30 30 Q24 32 18 30 Z" fill="#f4ecd8" ${T}/>
    <path d="M5 26 Q7 7 24 7 Q41 7 43 26 Z" fill="#d8261c" ${T}/>
    <circle cx="15" cy="16" r="2.2" fill="#fffaf0"/><circle cx="24" cy="12" r="2" fill="#fffaf0"/><circle cx="32" cy="17" r="2.4" fill="#fffaf0"/>
    <circle cx="20" cy="21" r="1.7" fill="#fffaf0"/><circle cx="36" cy="23" r="1.6" fill="#fffaf0"/><circle cx="11" cy="23" r="1.5" fill="#fffaf0"/>`,
  amanite_phalloide: `
    <path d="M14 42 Q15 35 21 34 L21 26 h6 L27 34 Q33 35 34 42 Z" fill="#f4ecd8" ${T}/>
    <path d="M18 31 Q24 34 30 31 L29 29 Q24 31 19 29 Z" fill="#f4ecd8" ${T}/>
    <path d="M7 26 Q9 10 24 10 Q39 10 41 26 Z" fill="#a8ad74" ${T}/>
    <path d="M12 18 Q18 13 24 13" stroke="#c9cc9a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  gourdin: `
    <path d="M9 41 L28 16 Q33 9 39 12 Q42 16 36 22 L13 44 Z" fill="#8a6a3e" ${T}/>
    <path d="M30 16 l3 3 M26 22 l2 2" stroke="#5a4130" stroke-width="1.6"/>
    <path d="M9 41 L13 44" stroke="#5a4130" stroke-width="3"/>`,
  poule: `
    <path d="M10 28 Q10 18 20 18 Q24 10 31 12 Q36 13 35 19 L39 21 L35 23 Q38 34 27 38 Q14 41 10 28 Z" fill="#b5562a" ${T}/>
    <path d="M31 12 Q32 8 34 10 Q35 7 37 10 Q36 13 33 13" fill="#c8362b" ${T}/>
    <path d="M10 28 Q5 22 8 16 Q12 22 14 22" fill="#7a3a1c" ${T}/>
    <path d="M18 28 Q24 24 30 29" fill="none" stroke="#7a3a1c" stroke-width="1.6"/>
    <circle cx="32" cy="17" r="1.2" fill="#3b2a1e"/>
    <path d="M22 38 v5 M27 38 v5" ${T}/>`,
  volaille_crue: `
    <path d="M12 30 Q10 18 22 15 Q34 13 36 24 Q37 34 26 36 Q16 38 12 30 Z" fill="#f0b9a8" ${T}/>
    <path d="M33 30 L40 38 Q43 41 40 43 Q37 43 37 40" fill="#f4ecd8" ${T}/>
    <path d="M17 24 Q23 21 29 25" fill="none" stroke="#d98a7a" stroke-width="1.6"/>`,
  volaille_cuite: `
    <path d="M12 30 Q10 18 22 15 Q34 13 36 24 Q37 34 26 36 Q16 38 12 30 Z" fill="#b8742e" ${T}/>
    <path d="M33 30 L40 38 Q43 41 40 43 Q37 43 37 40" fill="#f4ecd8" ${T}/>
    <path d="M17 24 Q23 21 29 25" fill="none" stroke="#7a4a1c" stroke-width="1.6"/>
    <path d="M18 10 q2 -3 0 -6 M25 10 q2 -3 0 -6" fill="none" stroke="#9a9a9a" stroke-width="1.4"/>`,
  volaille_cepes: `
    <path d="M5 30 Q24 44 43 30 Z" fill="#8a8478" ${T}/>
    <path d="M6 30 h36" ${T}/>
    <path d="M14 28 Q14 18 24 17 Q33 17 34 26 L30 29 Z" fill="#b8742e" ${T}/>
    <path d="M33 24 L39 18" stroke="#f4ecd8" stroke-width="3" stroke-linecap="round"/>
    <path d="M9 28 Q10 22 15 23 Q17 26 15 28 Z" fill="#7a4a26" ${T}/><path d="M35 29 Q36 23 41 24 Q42 27 40 29 Z" fill="#7a4a26" ${T}/>
    <path d="M18 12 q2 -3 0 -6 M25 12 q2 -3 0 -6" fill="none" stroke="#9a9a9a" stroke-width="1.4"/>`,
  cepes_poeles: `
    <ellipse cx="24" cy="30" rx="18" ry="7" fill="#8f8a80" ${T}/>
    <path d="M12 29 Q12 21 18 21 Q23 21 23 28 Z" fill="#7a4a26" ${T}/>
    <path d="M22 30 Q22 22 28 22 Q33 22 33 29 Z" fill="#8a5a2e" ${T}/>
    <path d="M28 27 Q29 21 34 21 Q38 22 37 28 Z" fill="#7a4a26" ${T}/>
    <path d="M18 14 q2 -3 0 -6 M27 14 q2 -3 0 -6" fill="none" stroke="#9a9a9a" stroke-width="1.4"/>`,
  pommes_cuites: `
    <path d="M6 34 Q24 44 42 34 Z" fill="#6a6a6a" ${T}/>
    <circle cx="16" cy="28" r="7" fill="#9a3a22" ${T}/><circle cx="30" cy="28" r="7" fill="#a8452a" ${T}/><circle cx="23" cy="22" r="6" fill="#8a3420" ${T}/>
    <path d="M15 12 q2 -3 0 -6 M28 12 q2 -3 0 -6" fill="none" stroke="#9a9a9a" stroke-width="1.4"/>`,
  sac_fortune: `
    <path d="M14 8 L12 42 M34 8 L36 42" stroke="#7a5a3c" stroke-width="3.4" fill="none" ${T}/>
    <path d="M13 16 L35 16 M12 28 L36 28 M12 38 L36 38" stroke="#5a4130" stroke-width="2.4"/>
    <path d="M13 16 L35 28 M35 16 L13 28" stroke="#b59a6a" stroke-width="1.6"/>
    <path d="M16 10 Q24 4 32 10" fill="none" stroke="#b59a6a" stroke-width="2.4"/>`,
  poches: `
    <path d="M10 10 h28 v18 Q38 40 24 42 Q10 40 10 28 Z" fill="#4a5a6a" ${T}/>
    <path d="M10 18 h28" stroke="#3b2a1e" stroke-width="1.6"/>
    <path d="M17 18 Q24 26 31 18" fill="none" ${T}/>`,
  escabeau: `
    <path d="M12 42 L21 7 M22 42 L27 7" stroke="#a07c48" stroke-width="3.4" fill="none" ${T}/>
    <path d="M15 32 L24 32 M17 22 L25 22 M19 13 L26 13" stroke="#5a4130" stroke-width="2.4"/>
    <path d="M36 42 L27 7" stroke="#a07c48" stroke-width="3.4" fill="none" ${T}/>
    <path d="M18 7 h12" stroke="#7a5a3c" stroke-width="3.4"/>`,
  coffre: `
    <path d="M7 20 h34 v18 h-34 Z" fill="#a07c48" ${T}/>
    <path d="M7 20 Q24 9 41 20 Z" fill="#8a6a3e" ${T}/>
    <path d="M7 28 h34 M16 20 v18 M32 20 v18" stroke="#6b4a2e" stroke-width="1.6"/>
    <rect x="21" y="22" width="6" height="7" rx="1" fill="#55524d" ${T}/>`,
  abri: `
    <path d="M6 38 L24 12 L42 38 Z" fill="#2f6fa4" ${T}/>
    <path d="M24 12 L24 38 M16 38 L24 24 L32 38" stroke-width="1.4" fill="none" ${T}/>
    <path d="M4 40 h40" stroke-width="3" stroke="#7a5a3c" ${T}/>`,
  charbon_bois: `
    <path d="M9 30 L16 19 L27 21 L24 33 Z" fill="#2b2b2b" ${T}/>
    <path d="M22 34 L29 20 L40 24 L36 37 Z" fill="#3a3a3a" ${T}/>
    <path d="M14 38 L20 31 L28 36 L22 42 Z" fill="#222" ${T}/>
    <path d="M30 24 l3 4 M18 22 l2 5" stroke="#6e6a63" stroke-width="1.2"/>`,
  lame_forgee: `
    <path d="M8 38 L30 16 L41 7 Q42 15 34 22 L16 40 Z" fill="#d6d9dd" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 36 L36 14" stroke="#8a8a88" stroke-width="1.2"/>
    <path d="M5 43 L10 38 L13 41 L8 46 Z" fill="#55524d" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>`,
  couteau_aiguise: `
    <path d="M9 37 L27 19 L38 9 Q40 14 33 22 L19 33 Z" fill="#e3e6ea" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 36 L36 12" stroke="#ffffff" stroke-width="1.4"/>
    <path d="M6 41 L15 32 L19 36 L10 45 Z" fill="#6b4a32" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M38 4 l2 3 M42 8 l3 1" stroke="#c98a2e" stroke-width="1.6" stroke-linecap="round"/>`,
  charbonniere: `
    <path d="M6 38 Q24 8 42 38 Z" fill="#6b5a44" ${T}/>
    <path d="M14 38 Q24 20 34 38" fill="none" stroke="#3b2a1e" stroke-width="1.2" stroke-dasharray="2 2"/>
    <path d="M24 13 Q20 8 24 4 Q28 1 25 -2" fill="none" stroke="#8f8a80" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>
    <path d="M4 40 h40" ${T} stroke-width="3"/>`,
  forge: `
    <path d="M6 24 h22 v16 h-22 Z" fill="#8f8a80" ${T}/>
    <path d="M10 24 Q17 17 24 24" fill="#ff8a3d" ${T}/>
    <path d="M30 30 h12 l-3 5 h-6 Z" fill="#55524d" ${T}/>
    <path d="M33 35 v5 h5 v-5" fill="#55524d" ${T}/>
    <path d="M28 18 l10 -6 l2 4 l-10 6 Z" fill="#7a5a3c" ${T}/>`,
  pedalier: `
    <circle cx="13" cy="30" r="9" fill="none" stroke="#2b2b2b" stroke-width="3"/>
    <path d="M13 30 L26 20 L38 22 M26 20 L28 33 M28 33 L13 30" fill="none" stroke="#5f7f45" stroke-width="2.6" stroke-linejoin="round"/>
    <circle cx="28" cy="33" r="3.5" fill="#55524d" ${T}/>
    <path d="M24 16 h6" ${T} stroke-width="3"/>
    <path d="M4 42 h40" ${T} stroke-width="3" stroke="#7a5a3c"/>`,
  banc_recharge: `
    <path d="M5 30 h38 v4 h-38 Z" fill="#a07c48" ${T}/>
    <path d="M9 34 v8 M39 34 v8" ${T} stroke-width="3" stroke="#7a5a3c"/>
    <rect x="9" y="18" width="16" height="12" rx="1.5" fill="#2b2b2b" ${T}/>
    <rect x="29" y="21" width="10" height="9" rx="1.5" fill="#d8c43a" ${T}/>
    <path d="M17 18 Q24 8 34 21" fill="none" stroke="#d2691e" stroke-width="2"/>`,
  feu_de_camp: `
    <path d="M8 40 L40 30 M8 30 L40 40" stroke-width="5" stroke="#5a4130" ${T}/>
    <path d="M24 8 Q34 18 30 30 h-12 Q14 18 24 8 Z" fill="#ff8a3d" ${T}/>
    <path d="M24 17 Q29 22 27 29 h-6 Q19 22 24 17 Z" fill="#ffe08a"/>
    <circle cx="9" cy="42" r="3" fill="#8f8a80" ${T}/><circle cx="39" cy="42" r="3" fill="#8f8a80" ${T}/>`,
};

export function icone(type: Pictogramme, taille = 40): string {
  return `<svg viewBox="0 0 48 48" width="${taille}" height="${taille}" aria-hidden="true">${DESSINS[type]}</svg>`;
}
