// Icônes des objets, dessinées en vectoriel dans la charte du jeu : trait d'encre, aplats de la palette,
// sur fond papier (Book 18 §6.3). Provisoires : à terme, rendues automatiquement depuis les modèles 3D
// (Book 21 §5.2.7), mais au même format (carré 48 × 48).

import type { TypeObjet } from "../../commun/src/objets.ts";
import { definitionVestige, type FamilleVestige } from "../../commun/src/vestiges.ts";

const ENCRE = "#3b2a1e";
const T = `stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

export type Pictogramme = TypeObjet | "feu_de_camp" | "etabli" | "abri" | "coffre" | "charbonniere" | "forge" | "pedalier" | "banc_recharge" | "escabeau" | "poches" | "recuperateur_pluie" | "alarme_boites" | "lit_branchages" | "decharge";

// Les vestiges (lot 1, 0.3) sont trop nombreux pour un dessin chacun : une icône générique par famille
// (un pictogramme simple et une teinte), avec repli automatique. Depuis le 2026-10-08, tous les vestiges et
// composants du lot 1 ont leur dessin à la main (l'icône générique reste en repli pour les prochains).
const DESSINS: Partial<Record<Pictogramme, string>> = {
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
    <path d="M10 4 L24 44 M38 4 L28 44" stroke="#3b2a1e" stroke-width="5" stroke-linecap="round"/>
    <path d="M10 4 L24 44 M38 4 L28 44" stroke="#7a5a3c" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M14 16 H35 M17 24 H33" stroke="#3b2a1e" stroke-width="4" stroke-linecap="round"/>
    <path d="M14 16 H35 M17 24 H33" stroke="#a07c48" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M15 25 Q14 33 20 35 H32 Q36 33 34 25 Z" fill="#6b8b4e" ${T}/>
    <path d="M18 29 h13" stroke="#b59a6a" stroke-width="1.6"/>`,
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
    <path d="M7 34 Q6 28 12 27 H38 Q43 28 41 34 Q40 39 34 39 H13 Q8 39 7 34 Z" fill="#c9b48a" ${T}/>
    <path d="M9 25 Q9 19 15 19 H35 Q40 20 39 25 Q38 29 33 29 H14 Q9 29 9 25 Z" fill="#d8ccb0" ${T}/>
    <path d="M12 17 Q13 11 19 11 H31 Q36 12 35 17 Q34 21 29 21 H17 Q12 21 12 17 Z" fill="#a4552f" ${T}/>
    <path d="M16 13 v6 M21 12 v8 M26 12 v8" stroke="#c8743a" stroke-width="1.4"/>
    <path d="M14 24 h22 M12 33 h26" stroke="#a89878" stroke-width="1.3" stroke-dasharray="3 2"/>`,
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
    <path d="M7 12 h13 v13 h-13 Z" fill="#55524d" ${T}/>
    <path d="M20 12 L39 9 Q44 24 37 41 Q33 30 20 25 Z" fill="#6b6862" ${T}/>
    <path d="M39 11 Q43 25 37 38" fill="none" stroke="#e8ecee" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="13.5" cy="18.5" rx="3.5" ry="4.5" fill="#2b2620" ${T} stroke-width="1"/>
    <path d="M24 16 l5 -1 M25 21 l3 1" stroke="#a4552f" stroke-width="1.6" stroke-linecap="round"/>`,
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
    <path d="M26 30 L39 41" stroke="#3b2a1e" stroke-width="6" stroke-linecap="round"/>
    <path d="M26 30 L39 41" stroke="#f4ecd8" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="40" cy="39" r="3" fill="#f4ecd8" ${T}/><circle cx="37" cy="43" r="3" fill="#f4ecd8" ${T}/>
    <path d="M28 31 Q34 22 26 12 Q16 4 9 13 Q4 22 13 29 Q20 34 28 31 Z" fill="#f0b9a8" ${T}/>
    <path d="M12 16 Q17 11 23 14" fill="none" stroke="#fbe0d6" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M15 24 q4 2 8 0" fill="none" stroke="#d98a7a" stroke-width="1.4"/>`,
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
  // Les mijotés du foyer de cuisine (Book 24) : un bol fumant.
  soupe_cepes: `
    <path d="M7 24 Q24 44 41 24 Z" fill="#8f8a80" ${T}/>
    <ellipse cx="24" cy="24" rx="17" ry="4.5" fill="#b8874a" ${T}/>
    <path d="M15 24 Q16 20.5 19.5 21 Q21 23 19.5 24.5 Z" fill="#7a4a26" ${T}/><path d="M27 23.5 Q28 20 31.5 20.5 Q33 22.5 31.5 24 Z" fill="#7a4a26" ${T}/>
    <path d="M17 15 q2 -3 0 -6 M24 15 q2 -3 0 -6 M31 15 q2 -3 0 -6" fill="none" stroke="#9a9a9a" stroke-width="1.4"/>`,
  pot_au_feu: `
    <path d="M7 24 Q24 44 41 24 Z" fill="#3a3632" ${T}/>
    <ellipse cx="24" cy="24" rx="17" ry="4.5" fill="#c99a52" ${T}/>
    <path d="M14 24 Q15 18 22 18.5 Q27 19.5 25 24 Z" fill="#b8742e" ${T}/><path d="M28 23.5 Q29 20 32.5 20.5 Q34 22.5 32.5 24 Z" fill="#7a4a26" ${T}/>
    <path d="M17 15 q2 -3 0 -6 M24 15 q2 -3 0 -6 M31 15 q2 -3 0 -6" fill="none" stroke="#9a9a9a" stroke-width="1.4"/>`,
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

/** Les dessins à la main des vestiges marquants (lot 1). */
const DESSINS_VESTIGES: Partial<Record<Pictogramme, string>> = {
  casserole: `
    <path d="M9 20 h26 v13 a6 6 0 0 1 -6 6 h-14 a6 6 0 0 1 -6 -6 Z" fill="#c9ccd0" ${T}/>
    <path d="M35 22 L45 19" stroke-width="4" stroke="#3b2a1e" stroke-linecap="round"/>
    <ellipse cx="22" cy="20" rx="13" ry="3" fill="#e3e6ea" ${T}/>
    <path d="M14 29 q3 -3 6 0" fill="none" stroke-width="1.2" opacity="0.6" ${T}/>
    <path d="M27 33 l3 -2" stroke-width="1.2" opacity="0.6" ${T}/>`,
  tele_85: `
    <rect x="3" y="9" width="42" height="26" rx="1.5" fill="#1f1f22" ${T}/>
    <path d="M8 14 L18 14 M8 18 L13 18" stroke="#55606a" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M30 26 L36 18 M33 29 L40 21" stroke="#3a4048" stroke-width="1.2"/>
    <path d="M18 35 L15 41 M30 35 L33 41 M12 41 h24" ${T}/>`,
  nain_jardin: `
    <path d="M24 3 L33 20 H15 Z" fill="#c8362b" ${T}/>
    <circle cx="24" cy="23" r="5" fill="#f0c8a0" ${T}/>
    <path d="M18 25 Q24 38 30 25 Q24 30 18 25 Z" fill="#f4ecd8" ${T}/>
    <path d="M15 31 h18 v9 h-18 Z" fill="#2f6fa4" ${T}/>
    <path d="M14 44 h20 M17 40 v4 M31 40 v4" ${T}/>
    <circle cx="22" cy="22" r="0.9" fill="#3b2a1e"/><circle cx="26" cy="22" r="0.9" fill="#3b2a1e"/>`,
  smartphone_fele: `
    <rect x="14" y="5" width="20" height="38" rx="3.5" fill="#2b2b2b" ${T}/>
    <rect x="16.5" y="9" width="15" height="28" fill="#3d4a5a"/>
    <path d="M18 12 L25 20 L22 26 L30 34 M25 20 L31 16" stroke="#e8f1fa" stroke-width="1" fill="none"/>
    <rect x="17.5" y="30" width="4" height="5" fill="#c8362b"/>
    <circle cx="24" cy="40" r="1.4" fill="#55524d"/>`,
  pyramide_papier_toilette: `
    <g fill="#f4ecd8" ${T}>
      <circle cx="12" cy="38" r="5"/><circle cx="24" cy="38" r="5"/><circle cx="36" cy="38" r="5"/>
      <circle cx="18" cy="28" r="5"/><circle cx="30" cy="28" r="5"/>
      <circle cx="24" cy="18" r="5"/>
    </g>
    <g fill="#c9b48a"><circle cx="12" cy="38" r="1.6"/><circle cx="24" cy="38" r="1.6"/><circle cx="36" cy="38" r="1.6"/><circle cx="18" cy="28" r="1.6"/><circle cx="30" cy="28" r="1.6"/><circle cx="24" cy="18" r="1.6"/></g>
    <path d="M24 5 l1.5 3 3 .4 -2.2 2 .6 3 -2.9 -1.5 -2.9 1.5 .6 -3 -2.2 -2 3 -.4 Z" fill="#e8c43a" ${T} stroke-width="1"/>`,
  sac_ciment: `
    <path d="M9 14 Q8 10 12 10 H36 Q40 10 39 14 L41 38 Q41 42 37 42 H11 Q7 42 7 38 Z" fill="#a8a296" ${T}/>
    <path d="M12 10 Q14 14 12 18 M36 10 Q34 14 36 18" fill="none" stroke-width="1.2" ${T}/>
    <rect x="15" y="21" width="18" height="9" fill="#d6d2ca" ${T} stroke-width="1.2"/>
    <path d="M17 25.5 h14" stroke="#8f8a80" stroke-width="1.6"/>
    <path d="M10 34 L18 38 L26 33 L34 37" fill="none" stroke="#6e6a63" stroke-width="1.4"/>`,
  grille_pain_facial: `
    <path d="M8 18 Q8 12 14 12 H34 Q40 12 40 18 V38 H8 Z" fill="#d6d2ca" ${T}/>
    <path d="M15 12 V20 M24 12 V20 M33 12 V20" stroke-width="2.4" ${T}/>
    <circle cx="24" cy="29" r="5" fill="#1f3550" ${T}/>
    <circle cx="24" cy="29" r="2" fill="#c8362b"/>
    <path d="M40 24 h3 v6" fill="none" ${T}/>
    <path d="M10 41 h28" ${T}/>`,
  aspirateur_robot: `
    <ellipse cx="24" cy="28" rx="19" ry="11" fill="#55524d" ${T}/>
    <ellipse cx="24" cy="25" rx="19" ry="10" fill="#c9ccd0" ${T}/>
    <circle cx="24" cy="23" r="4" fill="#2b2b2b" ${T}/>
    <circle cx="24" cy="23" r="1.4" fill="#5d8a46"/>
    <path d="M9 18 Q4 14 6 9" fill="none" stroke-dasharray="2 2" ${T} stroke-width="1.4"/>`,
  chambre_air: `
    <circle cx="24" cy="24" r="17" fill="#2b2b2b" ${T}/>
    <circle cx="24" cy="24" r="9" fill="#f4ecd8" ${T}/>
    <path d="M24 7 v-3 h3" fill="none" stroke="#c9ccd0" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M33 33 l5 4 M35 30 l5 2" stroke="#8f8a80" stroke-width="1.4"/>`,
  pied_de_biche: `
    <path d="M12 42 L35 9" stroke="#2f5fa4" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M12 42 L35 9" fill="none" ${T} stroke-width="1"/>
    <path d="M35 9 Q38 4 42 7 L40 11" fill="none" stroke="#2f5fa4" stroke-width="4" stroke-linecap="round"/>
    <path d="M12 42 L6 40 M12 42 L9 45" stroke="#3b2a1e" stroke-width="2.4" stroke-linecap="round"/>`,
  fil_cuivre: `
    <ellipse cx="24" cy="24" rx="15" ry="13" fill="#c8743a" ${T}/>
    <ellipse cx="24" cy="24" rx="6" ry="5" fill="#f4ecd8" ${T}/>
    <path d="M12 18 Q24 12 36 18 M10 25 Q24 19 38 25 M12 31 Q24 26 36 31" fill="none" stroke="#8a4a1e" stroke-width="1.1"/>
    <path d="M37 30 Q42 34 44 42" fill="none" stroke="#c8743a" stroke-width="2.2" stroke-linecap="round"/>`,
  petit_moteur: `
    <rect x="10" y="15" width="22" height="18" rx="9" fill="#9aa4ae" ${T}/>
    <path d="M32 21 h4 v6 h-4" fill="#c8743a" ${T}/>
    <path d="M36 24 h7" ${T} stroke-width="2.4"/>
    <path d="M14 33 v5 M20 33 v5" stroke="#c8362b" stroke-width="2"/>
    <path d="M16 20 h10" stroke="#e8f1fa" stroke-width="1.4" stroke-linecap="round"/>`,
  // ---- Les composants (2026-10-08) : on les reconnaît d'un coup d'œil, on les assemble ----
  pile: `
    <rect x="17" y="10" width="14" height="32" rx="2" fill="#d8a83a" ${T}/>
    <path d="M17 33 h14 v7 a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2 Z" fill="#2b2b2b" ${T}/>
    <rect x="21" y="6" width="6" height="4" fill="#c9ccd0" ${T}/>
    <path d="M24 16 v8 M20 20 h8" stroke="#3b2a1e" stroke-width="2.2" stroke-linecap="round"/>`,
  cellule_lithium: `
    <path d="M15 13 v24 a9 3.5 0 0 0 18 0 v-24" fill="#3f8f6a" ${T}/>
    <ellipse cx="24" cy="13" rx="9" ry="3.5" fill="#c9ccd0" ${T}/>
    <circle cx="24" cy="12.5" r="2.4" fill="#8a8f96" ${T} stroke-width="1"/>
    <path d="M15 32 a9 3.5 0 0 0 18 0" fill="none" stroke="#f4ecd8" stroke-width="1.4"/>
    <path d="M19 21 h10 M19 25 h6" stroke="#f4ecd8" stroke-width="1.6" stroke-linecap="round"/>`,
  aimant: `
    <path d="M11 9 V25 A13 13 0 0 0 37 25 V9 H28 V25 A4 4 0 0 1 20 25 V9 Z" fill="#b3243a" ${T}/>
    <path d="M11 9 h9 v6 h-9 Z M28 9 h9 v6 h-9 Z" fill="#c9ccd0" ${T}/>
    <path d="M7 5 l3 3 M41 5 l-3 3 M24 4 v3" stroke="#3b2a1e" stroke-width="1.4" stroke-linecap="round"/>`,
  led: `
    <path d="M10 13 l4 3 M38 13 l-4 3 M24 3 v4 M14 5 l3 4 M34 5 l-3 4" stroke="#e8b83a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M17 27 V18 a7 7 0 0 1 14 0 V27 Z" fill="#e8d84a" ${T}/>
    <rect x="15" y="27" width="18" height="4" rx="1" fill="#d8c43a" ${T}/>
    <path d="M21 31 V44 M27 31 V40" stroke="#8a8f96" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M20 17 a4 4 0 0 1 4 -4" fill="none" stroke="#fff8d0" stroke-width="1.6" stroke-linecap="round"/>`,
  resistance: `
    <path d="M5 24 h7 l3 -8 l4 16 l4 -16 l4 16 l4 -16 l4 16 l3 -8 h5" fill="none" stroke="#3b2a1e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5 24 h7 l3 -8 l4 16 l4 -16 l4 16 l4 -16 l4 16 l3 -8 h5" fill="none" stroke="#e8743a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 40 q2 -3 0 -5 M28 40 q2 -3 0 -5" fill="none" stroke="#d2691e" stroke-width="1.4" opacity="0.7"/>`,
  verre: `
    <path d="M9 12 L33 7 L41 20 L35 41 L22 34 L13 38 Z" fill="#bfe0ec" ${T}/>
    <path d="M22 34 L27 21 L41 20 M27 21 L33 7" fill="none" stroke-width="1.2" opacity="0.6" ${T}/>
    <path d="M15 15 L22 13 M14 20 L17 19" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`,
  aluminium: `
    <path d="M7 18 L18 12 L27 16 L40 11 L42 27 L33 35 L21 32 L9 37 Z" fill="#c9ccd0" ${T}/>
    <path d="M18 12 L21 32 M27 16 L33 35 M9 26 L42 22" fill="none" stroke-width="1.1" opacity="0.5" ${T}/>
    <path d="M12 21 L17 19" stroke="#f4f6f8" stroke-width="2" stroke-linecap="round"/>`,
  plastique: `
    <path d="M8 14 H34 Q40 14 40 20 V30 L33 36 L26 31 L19 38 L8 38 Z" fill="#4a8ac2" ${T}/>
    <circle cx="17" cy="22" r="4" fill="#2f5f8c" ${T}/><rect x="26" y="19" width="8" height="5" rx="1" fill="#2f5f8c" ${T}/>
    <path d="M11 17 h12" stroke="#a8d0f0" stroke-width="1.8" stroke-linecap="round"/>`,
  papier: `
    <path d="M12 12 L36 9 L38 39 L14 42 Z" fill="#e6dcc0" ${T}/>
    <path d="M9 9 L33 7 L35 36 L11 38 Z" fill="#efe6cf" ${T}/>
    <path d="M14 15 h15 M14 20 h17 M15 25 h13 M15 30 h16" stroke="#8a7a62" stroke-width="1.4" stroke-linecap="round"/>`,
  petit_ressort: `
    <path d="M15 8 h18 M15 40 h18" stroke="#3b2a1e" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M33 8 L15 13 L33 18 L15 23 L33 28 L15 33 L33 38 L15 40" fill="none" stroke="#3b2a1e" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M33 8 L15 13 L33 18 L15 23 L33 28 L15 33 L33 38 L15 40" fill="none" stroke="#b0b4b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  caoutchouc: `
    <path d="M8 30 C8 16 40 14 40 24 C40 32 20 26 16 34 C13 40 26 42 30 38" fill="none" stroke="#3b2a1e" stroke-width="7" stroke-linecap="round"/>
    <path d="M8 30 C8 16 40 14 40 24 C40 32 20 26 16 34 C13 40 26 42 30 38" fill="none" stroke="#4a4a4a" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M13 22 Q20 18 28 18" fill="none" stroke="#7a7a7a" stroke-width="1.2" stroke-linecap="round"/>`,
  // ---- La cuisine ----
  cocotte_fonte: `
    <path d="M9 21 h30 v12 a7 7 0 0 1 -7 7 h-16 a7 7 0 0 1 -7 -7 Z" fill="#b3402b" ${T}/>
    <path d="M9 24 h-4 M39 24 h4" ${T} stroke-width="3.4"/>
    <path d="M8 21 Q24 11 40 21 Z" fill="#9a3524" ${T}/>
    <rect x="20" y="11" width="8" height="4" rx="1.5" fill="#2b2b2b" ${T}/>
    <path d="M13 28 q2 -2 4 0" fill="none" stroke="#e08a6a" stroke-width="1.4"/>`,
  autocuiseur: `
    <path d="M10 20 h28 v14 a6 6 0 0 1 -6 6 h-16 a6 6 0 0 1 -6 -6 Z" fill="#c9ccd0" ${T}/>
    <path d="M9 20 Q24 13 39 20 Z" fill="#b0b4b8" ${T}/>
    <path d="M24 16 L44 12" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/>
    <rect x="21" y="9" width="5" height="6" rx="1" fill="#c8362b" ${T}/>
    <path d="M19 5 q2 -2 0 -4 M27 5 q2 -2 0 -4" fill="none" stroke="#9aa4ae" stroke-width="1.4"/>`,
  bocal: `
    <rect x="15" y="6" width="18" height="6" rx="1.5" fill="#c9a03a" ${T}/>
    <path d="M14 12 h20 q3 0 3 4 v20 q0 6 -6 6 h-14 q-6 0 -6 -6 v-20 q0 -4 3 -4 Z" fill="#cfe4ea" ${T}/>
    <path d="M16 18 v16" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M14 14 h20" stroke-width="1.2" ${T}/>`,
  micro_ondes: `
    <rect x="4" y="11" width="40" height="27" rx="2" fill="#d6d2ca" ${T}/>
    <rect x="8" y="15" width="24" height="19" rx="1" fill="#3d4a5a" ${T}/>
    <path d="M11 18 L18 18" stroke="#8fb3d6" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="35" y="15" width="6" height="5" fill="#2b3440"/><circle cx="38" cy="26" r="1.6" fill="#55524d"/><circle cx="38" cy="31" r="1.6" fill="#55524d"/>`,
  machine_capsules: `
    <path d="M14 6 h20 v32 h-20 Z" fill="#2b2b2b" ${T}/>
    <path d="M14 6 h20 v8 h-20 Z" fill="#c8362b" ${T}/>
    <path d="M20 18 h8 v4 h-8 Z" fill="#c9ccd0" ${T}/>
    <path d="M19 30 h10 v5 a5 3 0 0 1 -10 0 Z" fill="#f4ecd8" ${T}/>
    <path d="M10 38 h28 v4 h-28 Z" fill="#55524d" ${T}/>`,
  aimant_frigo: `
    <path d="M8 28 Q24 22 40 28 V40 H8 Z" fill="#e8c46a" ${T}/>
    <circle cx="33" cy="15" r="6" fill="#e8743a" ${T}/>
    <path d="M18 38 Q19 26 22 18" fill="none" stroke="#7a5a3c" stroke-width="3" stroke-linecap="round"/>
    <path d="M22 18 Q14 14 10 19 M22 18 Q18 10 12 11 M22 18 Q26 10 31 12 M22 18 Q30 16 32 22" fill="none" stroke="#3f7a3a" stroke-width="3" stroke-linecap="round"/>`,
  // ---- La salle de bain ----
  brosse_dents_connectee: `
    <path d="M18 18 h12 v22 a6 6 0 0 1 -12 0 Z" fill="#f4ecd8" ${T}/>
    <path d="M21 18 L22 8 h4 L27 18" fill="#f4ecd8" ${T}/>
    <path d="M21 5 h6 v4 h-6 Z" fill="#7fb3d0" ${T}/>
    <circle cx="24" cy="27" r="2.6" fill="#5d8a46" ${T} stroke-width="1"/>
    <path d="M22 34 h4" stroke="#9cc8d8" stroke-width="2" stroke-linecap="round"/>`,
  seche_cheveux: `
    <path d="M8 13 h22 a8 8 0 0 1 0 16 h-22 Z" fill="#e8a8b8" ${T}/>
    <path d="M8 13 v16 h-3 v-16 Z" fill="#c88898" ${T}/>
    <path d="M22 29 L26 43 h6 L30 29" fill="#e8a8b8" ${T}/>
    <circle cx="31" cy="21" r="3.5" fill="#c88898" ${T}/>
    <path d="M3 17 h-1 M3 21 h-1 M3 25 h-1" stroke="#3b2a1e" stroke-width="1.6" stroke-linecap="round"/>`,
  miroir_salle_bain: `
    <rect x="9" y="5" width="30" height="38" rx="3" fill="#c9ccd0" ${T}/>
    <rect x="12" y="8" width="24" height="32" rx="1" fill="#a8d0e0"/>
    <path d="M15 20 L24 11 M15 28 L31 12 M24 36 L33 27" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>`,
  rouleau_papier_toilette: `
    <ellipse cx="24" cy="15" rx="12" ry="5" fill="#f4ecd8" ${T}/>
    <path d="M12 15 v20 a12 5 0 0 0 24 0 v-20" fill="#f4ecd8" ${T}/>
    <ellipse cx="24" cy="15" rx="4" ry="1.8" fill="#c9b48a" ${T} stroke-width="1"/>
    <path d="M36 28 h6 v12 h-6" fill="#f4ecd8" ${T}/>
    <path d="M16 24 v8 M20 26 v8" stroke="#e0d4b8" stroke-width="1.4"/>`,
  balance_connectee: `
    <rect x="6" y="14" width="36" height="24" rx="4" fill="#f4ecd8" ${T}/>
    <rect x="16" y="18" width="16" height="7" rx="1" fill="#2b3440" ${T} stroke-width="1"/>
    <path d="M19 21.5 h3 M24 21.5 h2 M28 21.5 h1" stroke="#e8743a" stroke-width="1.6"/>
    <path d="M11 31 h7 M30 31 h7" stroke="#c9b48a" stroke-width="2.4" stroke-linecap="round"/>`,
  parfum_luxe: `
    <path d="M14 18 h20 l3 4 v14 a5 5 0 0 1 -5 5 h-16 a5 5 0 0 1 -5 -5 v-14 Z" fill="#e8b8d0" ${T}/>
    <rect x="20" y="12" width="8" height="6" fill="#d8b04a" ${T}/>
    <path d="M18 6 h12 l-2 6 h-8 Z" fill="#d8b04a" ${T}/>
    <rect x="17" y="26" width="14" height="7" fill="#f4ecd8" ${T} stroke-width="1"/>
    <path d="M15 22 v12" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>`,
  // ---- Le salon ----
  telecommande: `
    <rect x="16" y="4" width="16" height="40" rx="5" fill="#2b2b2b" ${T}/>
    <circle cx="24" cy="11" r="2.6" fill="#c8362b"/>
    <g fill="#8a8f96"><circle cx="20" cy="19" r="1.6"/><circle cx="24" cy="19" r="1.6"/><circle cx="28" cy="19" r="1.6"/><circle cx="20" cy="24" r="1.6"/><circle cx="24" cy="24" r="1.6"/><circle cx="28" cy="24" r="1.6"/></g>
    <rect x="20" y="30" width="8" height="8" rx="2" fill="#55606a"/>`,
  guirlande: `
    <path d="M4 12 Q14 26 24 14 Q34 26 44 12" fill="none" ${T}/>
    <g ${T} stroke-width="1.4"><path d="M8 17 l-2 6 h5 Z" fill="#e8d84a"/><path d="M16 21 l-2 6 h5 Z" fill="#c8362b"/><path d="M24 15 l-2 6 h5 Z" fill="#5d8a46"/><path d="M32 21 l-2 6 h5 Z" fill="#4a8ac2"/><path d="M40 17 l-2 6 h5 Z" fill="#e8d84a"/></g>
    <path d="M10 30 Q20 42 30 32" fill="none" stroke-width="1.4" ${T}/>`,
  tableau_vivre_rire: `
    <rect x="5" y="9" width="38" height="30" fill="#c9a77a" ${T}/>
    <rect x="9" y="13" width="30" height="22" fill="#f4ecd8" ${T} stroke-width="1"/>
    <path d="M13 19 h12 M15 24 h18 M13 29 h14" stroke="#c9a03a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M31 28 l2 -2 l2 2 l-2 3 Z" fill="#c8362b"/>`,
  ventilateur: `
    <circle cx="24" cy="18" r="13" fill="#e8f1fa" ${T}/>
    <path d="M24 18 Q20 8 26 7 Q29 13 24 18 Q34 16 34 22 Q28 24 24 18 Q18 27 14 23 Q17 18 24 18 Z" fill="#7a8fa8" ${T} stroke-width="1.2"/>
    <circle cx="24" cy="18" r="2.4" fill="#3b2a1e"/>
    <path d="M24 31 v10 M15 43 h18" ${T} stroke-width="2.6"/>`,
  coussin_peteur: `
    <ellipse cx="22" cy="28" rx="16" ry="11" fill="#d84a6a" ${T}/>
    <path d="M36 25 L44 22 L44 30 Z" fill="#d84a6a" ${T}/>
    <path d="M12 24 Q20 20 28 22" fill="none" stroke="#f0a0b0" stroke-width="2" stroke-linecap="round"/>
    <path d="M38 14 q3 -2 5 0 M34 10 q2 -3 5 -2" fill="none" stroke="#8a8f96" stroke-width="1.6" stroke-linecap="round"/>`,
  encyclopedie: `
    <g ${T}><rect x="6" y="10" width="8" height="32" fill="#2f5f8c"/><rect x="14" y="10" width="8" height="32" fill="#8a2f2a"/><rect x="22" y="10" width="8" height="32" fill="#2f5f8c"/><path d="M30 12 l8 -3 l8 31 l-8 3 Z" fill="#8a2f2a"/></g>
    <path d="M8 16 h4 M16 16 h4 M24 16 h4 M8 36 h4 M16 36 h4 M24 36 h4" stroke="#d8b04a" stroke-width="1.6"/>`,
  // ---- Les gadgets ----
  batterie_externe: `
    <rect x="10" y="7" width="28" height="35" rx="5" fill="#2b2b2b" ${T}/>
    <g><rect x="15" y="12" width="4" height="3" fill="#5d8a46"/><rect x="21" y="12" width="4" height="3" fill="#5d8a46"/><rect x="27" y="12" width="4" height="3" fill="#3a3a3a"/></g>
    <path d="M22 22 L19 30 h5 L22 37 L29 27 h-5 L27 22 Z" fill="#e8d84a" ${T} stroke-width="1"/>`,
  ordinateur_portable: `
    <path d="M10 8 h28 v22 h-28 Z" fill="#55606a" ${T}/>
    <rect x="13" y="11" width="22" height="16" fill="#2b3440"/>
    <path d="M17 16 h9 M17 20 h6" stroke="#8fb3d6" stroke-width="1.4"/>
    <path d="M5 34 L10 30 h28 l5 4 v3 h-38 Z" fill="#9aa4ae" ${T}/>
    <path d="M20 34 h8" stroke="#55606a" stroke-width="1.6"/>`,
  enceinte_intelligente: `
    <path d="M14 12 Q14 7 24 7 Q34 7 34 12 V38 Q34 43 24 43 Q14 43 14 38 Z" fill="#55606a" ${T}/>
    <ellipse cx="24" cy="10" rx="9" ry="2.4" fill="#4ac2e8" ${T} stroke-width="1"/>
    <g fill="#3a4048"><circle cx="20" cy="20" r="1.2"/><circle cx="24" cy="20" r="1.2"/><circle cx="28" cy="20" r="1.2"/><circle cx="20" cy="25" r="1.2"/><circle cx="24" cy="25" r="1.2"/><circle cx="28" cy="25" r="1.2"/><circle cx="20" cy="30" r="1.2"/><circle cx="24" cy="30" r="1.2"/><circle cx="28" cy="30" r="1.2"/></g>
    <path d="M38 14 q3 4 0 8 M41 11 q5 7 0 14" fill="none" stroke="#3b2a1e" stroke-width="1.4" stroke-linecap="round"/>`,
  montre_connectee: `
    <path d="M18 3 h12 l1 10 h-14 Z M17 35 h14 l-1 10 h-12 Z" fill="#3a3a3a" ${T}/>
    <rect x="13" y="12" width="22" height="24" rx="5" fill="#2b2b2b" ${T}/>
    <rect x="16" y="15" width="16" height="18" rx="2" fill="#2b3440"/>
    <path d="M18 25 h3 l2 -4 l2 7 l2 -3 h3" fill="none" stroke="#e85a5a" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M35 21 h2 v5 h-2" fill="#8a8f96"/>`,
  sac_cables: `
    <path d="M10 18 Q8 40 14 42 H34 Q40 40 38 18 Z" fill="#c9b48a" ${T}/>
    <path d="M10 18 Q24 22 38 18" fill="none" ${T}/>
    <path d="M16 18 C10 8 22 6 20 14 M24 18 C26 6 36 8 30 16 M30 18 C40 10 44 18 38 20" fill="none" stroke="#f4ecd8" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M18 12 h3 v4 h-3 Z M33 9 h3 v4 h-3 Z" fill="#8a8f96" ${T} stroke-width="1"/>`,
  calculatrice_solaire: `
    <rect x="12" y="5" width="24" height="38" rx="3" fill="#55524d" ${T}/>
    <rect x="15" y="8" width="18" height="4" fill="#5a4a2a" ${T} stroke-width="1"/><path d="M16 10 h16" stroke="#8a6a3a" stroke-width="1"/>
    <rect x="15" y="14" width="18" height="7" fill="#b8c8a0" ${T} stroke-width="1"/>
    <g fill="#d6d2ca"><rect x="15" y="24" width="4" height="3"/><rect x="22" y="24" width="4" height="3"/><rect x="29" y="24" width="4" height="3"/><rect x="15" y="30" width="4" height="3"/><rect x="22" y="30" width="4" height="3"/><rect x="29" y="30" width="4" height="3" fill="#e8743a"/><rect x="15" y="36" width="4" height="3"/><rect x="22" y="36" width="4" height="3"/><rect x="29" y="36" width="4" height="3"/></g>`,
  vapoteuse: `
    <path d="M20 13 h8 v29 a4 4 0 0 1 -8 0 Z" fill="#7a5ab8" ${T}/>
    <path d="M21 5 h6 v8 h-6 Z" fill="#cfe4ea" ${T}/>
    <path d="M22 3 h4 v2 h-4 Z" fill="#2b2b2b"/>
    <circle cx="24" cy="22" r="2" fill="#4ac2e8" ${T} stroke-width="1"/>
    <path d="M31 6 q4 -2 3 -5 M34 10 q5 -1 6 -5" fill="none" stroke="#c9ccd0" stroke-width="1.6" stroke-linecap="round"/>`,
  robot_domestique: `
    <rect x="13" y="6" width="22" height="16" rx="5" fill="#e8f1fa" ${T}/>
    <rect x="16" y="10" width="16" height="7" rx="3" fill="#2b3440"/>
    <circle cx="20" cy="13.5" r="1.6" fill="#4ac2e8"/><circle cx="28" cy="13.5" r="1.6" fill="#4ac2e8"/>
    <path d="M15 24 h18 v13 h-18 Z" fill="#c9ccd0" ${T}/>
    <path d="M15 27 l-6 7 M33 27 l6 7" ${T} stroke-width="2.6"/>
    <path d="M18 37 v6 M30 37 v6" ${T} stroke-width="3"/><path d="M24 6 v-3" ${T}/>`,
  // ---- Le garage ----
  perceuse_visseuse: `
    <path d="M6 11 h26 a6 6 0 0 1 0 12 h-26 Z" fill="#d8a83a" ${T}/>
    <path d="M32 15 h6 v4 h-6 Z" fill="#2b2b2b" ${T}/><path d="M38 17 h6" ${T} stroke-width="2"/>
    <path d="M14 23 h9 l3 13 h-10 Z" fill="#2b2b2b" ${T}/>
    <rect x="12" y="36" width="16" height="7" rx="1.5" fill="#55524d" ${T}/>
    <path d="M23 26 h2" stroke="#c8362b" stroke-width="2.4"/>`,
  bocal_clous: `
    <rect x="15" y="6" width="18" height="5" rx="1.5" fill="#c8362b" ${T}/>
    <path d="M13 11 h22 v27 q0 5 -5 5 h-12 q-5 0 -5 -5 Z" fill="#cfe4ea" ${T}/>
    <path d="M14 26 h20 v12 q0 4 -4 4 h-12 q-4 0 -4 -4 Z" fill="#8a8780"/>
    <path d="M17 30 l5 4 M24 29 l-2 7 M28 31 l3 5 M19 37 l6 -2" stroke="#3b2a1e" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M17 14 v10" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`,
  rouleau_fil_fer: `
    <circle cx="24" cy="24" r="16" fill="#8a8f96" ${T}/>
    <circle cx="24" cy="24" r="7" fill="#e9e0c8" ${T}/>
    <path d="M10 20 a15 15 0 0 1 28 0 M9 26 a15 15 0 0 0 30 0 M12 15 a14 14 0 0 1 24 0" fill="none" stroke="#5c5953" stroke-width="1.1"/>
    <path d="M38 30 Q44 36 42 44" fill="none" stroke="#3b2a1e" stroke-width="1.6" stroke-linecap="round"/>`,
  ruban_adhesif: `
    <circle cx="24" cy="24" r="16" fill="#9a9c9a" ${T}/>
    <circle cx="24" cy="24" r="8" fill="#c9a77a" ${T}/>
    <circle cx="24" cy="24" r="5.5" fill="#e9e0c8" ${T} stroke-width="1"/>
    <path d="M38 31 L44 42 L38 44 L33 34" fill="#9a9c9a" ${T}/>
    <path d="M14 15 a13 13 0 0 1 8 -4" fill="none" stroke="#c9ccd0" stroke-width="2" stroke-linecap="round"/>`,
  etau: `
    <path d="M8 34 h32 v6 h-32 Z" fill="#2f5fa4" ${T}/>
    <path d="M12 16 h9 v18 h-9 Z M27 16 h9 v18 h-9 Z" fill="#2f5fa4" ${T}/>
    <path d="M12 16 h9 v3 h-9 Z M27 16 h9 v3 h-9 Z" fill="#8a8f96" ${T} stroke-width="1"/>
    <path d="M36 27 h8 M44 22 v10" stroke="#3b2a1e" stroke-width="2.4" stroke-linecap="round"/>`,
  groupe_electrogene: `
    <path d="M6 14 h36 v24 h-36 Z" fill="none" stroke="#3b2a1e" stroke-width="2.6"/>
    <rect x="9" y="18" width="16" height="17" rx="3" fill="#c8362b" ${T}/>
    <rect x="26" y="20" width="13" height="15" rx="2" fill="#55524d" ${T}/>
    <rect x="11" y="10" width="14" height="6" rx="2" fill="#c8362b" ${T}/>
    <path d="M29 24 h7 M29 28 h7" stroke="#8a8f96" stroke-width="1.6"/><path d="M8 42 v-4 M40 42 v-4" ${T}/>`,
  rallonge: `
    <circle cx="22" cy="25" r="15" fill="#e8743a" ${T}/>
    <circle cx="22" cy="25" r="6" fill="#e9e0c8" ${T}/>
    <path d="M9 20 Q22 12 35 20 M8 28 Q22 20 36 28 M11 34 Q22 28 33 34" fill="none" stroke="#b8541e" stroke-width="1.4"/>
    <path d="M36 30 Q40 34 38 40" fill="none" stroke="#e8743a" stroke-width="3" stroke-linecap="round"/>
    <rect x="34" y="39" width="8" height="6" rx="1.5" fill="#f4ecd8" ${T}/>`,
  // ---- La voiture ----
  enjoliveur: `
    <circle cx="24" cy="24" r="18" fill="#c9ccd0" ${T}/>
    <circle cx="24" cy="24" r="6" fill="#8a8f96" ${T}/>
    <path d="M24 8 v10 M24 30 v10 M8 24 h10 M30 24 h10 M13 13 l7 7 M28 28 l7 7 M35 13 l-7 7 M20 28 l-7 7" stroke="#8a8f96" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M12 17 a14 14 0 0 1 6 -6" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`,
  retroviseur: `
    <path d="M6 14 Q6 8 14 8 H38 Q44 8 42 16 L40 28 Q39 33 33 33 H12 Q6 33 6 27 Z" fill="#2b2b2b" ${T}/>
    <path d="M10 14 Q10 11 14 11 H37 Q40 11 39 15 L37 26 Q36 29 32 29 H13 Q10 29 10 26 Z" fill="#a8d0e0"/>
    <path d="M14 24 L22 14 M20 26 L28 16" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M22 33 v9 h8" fill="none" ${T} stroke-width="3"/>`,
  ceinture_securite: `
    <path d="M6 10 L30 34" stroke="#3b2a1e" stroke-width="9" stroke-linecap="round"/>
    <path d="M6 10 L30 34" stroke="#55606a" stroke-width="6" stroke-linecap="round"/>
    <rect x="28" y="30" width="12" height="9" rx="2" transform="rotate(45 34 34.5)" fill="#c9ccd0" ${T}/>
    <rect x="36" y="38" width="8" height="6" rx="1.5" fill="#c8362b" ${T}/>`,
  cables_demarrage: `
    <path d="M8 40 C8 22 24 30 22 14" fill="none" stroke="#3b2a1e" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M8 40 C8 22 24 30 22 14" fill="none" stroke="#c8362b" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 40 C40 24 28 30 30 14" fill="none" stroke="#3b2a1e" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M40 40 C40 24 28 30 30 14" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 14 l4 -10 l4 10 Z" fill="#c8362b" ${T}/><path d="M26 14 l4 -10 l4 10 Z" fill="#55524d" ${T}/>`,
  cric: `
    <path d="M6 40 h36" ${T} stroke-width="3"/>
    <path d="M10 40 L24 20 L38 40 M10 40 L24 30 L38 40" fill="none" stroke="#3b2a1e" stroke-width="4.6" stroke-linejoin="round"/>
    <path d="M10 40 L24 20 L38 40 M10 40 L24 30 L38 40" fill="none" stroke="#c8362b" stroke-width="2.2" stroke-linejoin="round"/>
    <rect x="17" y="13" width="14" height="7" fill="#55524d" ${T}/>
    <path d="M38 33 h6" ${T} stroke-width="2.4"/>`,
  sapin_desodorisant: `
    <path d="M24 3 v6" ${T}/><circle cx="24" cy="3" r="1.5" fill="none" ${T} stroke-width="1"/>
    <path d="M24 9 L32 19 H28 L35 28 H30 L38 38 H10 L18 28 H13 L20 19 H16 Z" fill="#3f8f4a" ${T}/>
    <rect x="21" y="38" width="6" height="5" fill="#3f8f4a" ${T}/>
    <path d="M18 31 h12" stroke="#f4ecd8" stroke-width="1.6" stroke-linecap="round"/>`,
  boite_gants_pv: `
    <path d="M5 14 h38 v24 h-38 Z" fill="#3a3a3a" ${T}/>
    <path d="M9 18 h30 v16 h-30 Z" fill="#1f1f1f"/>
    <g ${T} stroke-width="1.2"><path d="M12 30 l5 -14 l10 3 l-3 13 Z" fill="#f4ecd8"/><path d="M22 32 l3 -15 l11 2 l-2 14 Z" fill="#e8f0d8"/></g>
    <path d="M26 22 h7 M25 26 h7" stroke="#c8362b" stroke-width="1.4"/>`,
  // ---- La ferme ----
  beche: `
    <path d="M24 4 v28" stroke="#3b2a1e" stroke-width="5" stroke-linecap="round"/>
    <path d="M24 4 v28" stroke="#a07c48" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M18 4 h12" ${T} stroke-width="3"/>
    <path d="M15 28 h18 v10 q-1 6 -9 7 q-8 -1 -9 -7 Z" fill="#8a8f96" ${T}/>
    <path d="M18 33 h12" stroke="#c9ccd0" stroke-width="1.4"/>`,
  secateur: `
    <path d="M24 22 L12 42" stroke="#3b2a1e" stroke-width="6" stroke-linecap="round"/><path d="M24 22 L12 42" stroke="#c8362b" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M24 22 L36 42" stroke="#3b2a1e" stroke-width="6" stroke-linecap="round"/><path d="M24 22 L36 42" stroke="#c8362b" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M24 22 Q14 14 20 4 Q26 12 24 22 Z" fill="#c9ccd0" ${T}/>
    <path d="M24 22 Q34 14 28 5 Q24 12 24 22 Z" fill="#8a8f96" ${T}/>
    <circle cx="24" cy="22" r="2" fill="#3b2a1e"/>`,
  tuyau_arrosage: `
    <circle cx="22" cy="24" r="15" fill="none" stroke="#3b2a1e" stroke-width="9"/>
    <circle cx="22" cy="24" r="15" fill="none" stroke="#5d9a46" stroke-width="5.6"/>
    <circle cx="22" cy="24" r="8" fill="none" stroke="#3b2a1e" stroke-width="7"/>
    <circle cx="22" cy="24" r="8" fill="none" stroke="#4a8a3a" stroke-width="3.6"/>
    <path d="M36 30 l7 6" stroke="#3b2a1e" stroke-width="5" stroke-linecap="round"/><path d="M41 34 l3 3" stroke="#e8c43a" stroke-width="3" stroke-linecap="round"/>`,
  sac_engrais: `
    <path d="M10 12 Q9 8 13 8 H35 Q39 8 38 12 L40 39 Q40 43 36 43 H12 Q8 43 8 39 Z" fill="#e8e0c0" ${T}/>
    <path d="M12 8 Q14 12 12 15 M36 8 Q34 12 36 15" fill="none" stroke-width="1.2" ${T}/>
    <path d="M16 24 Q24 14 32 24 Q24 22 16 24 Z" fill="#5d8a46" ${T} stroke-width="1"/>
    <path d="M24 22 v10" stroke="#5d8a46" stroke-width="2"/>
    <rect x="14" y="33" width="20" height="5" fill="#c8362b"/>`,
  grillage_rouleau: `
    <ellipse cx="13" cy="24" rx="7" ry="15" fill="#d6d2ca" ${T}/>
    <path d="M13 9 H38 M13 39 H38" ${T}/>
    <path d="M38 9 a7 15 0 0 1 0 30" fill="none" ${T}/>
    <path d="M18 12 l5 5 l5 -5 l5 5 M18 22 l5 5 l5 -5 l5 5 M18 32 l5 5 l5 -5 l5 5 M23 17 v5 M33 17 v5 M23 27 v5 M33 27 v5" fill="none" stroke="#8a8f96" stroke-width="1.4"/>
    <ellipse cx="13" cy="24" rx="3" ry="8" fill="#e9e0c8" ${T} stroke-width="1"/>`,
};

/** Les teintes de chaque famille de vestiges, pour l'icône générique : chaque objet en prend une, toujours la même. */
const TEINTES_FAMILLES: Record<FamilleVestige, string[]> = {
  cuisine: ["#c9ccd0", "#c8362b", "#e8d8a8", "#5f7f45"],
  salle_de_bain: ["#9cc8d8", "#e8a8b8", "#f4ecd8", "#7fb3a0"],
  salon: ["#c9a77a", "#a4552f", "#d8c43a", "#7a8fa8"],
  gadget: ["#55606a", "#2b2b2b", "#c9ccd0", "#3f6f8f"],
  garage: ["#c8362b", "#2f5fa4", "#d8a83a", "#5f7f45"],
  voiture: ["#3a3a3a", "#55524d", "#6b7b8c"],
  ferme: ["#7f8f3a", "#a07c48", "#c9b48a", "#5d8a46"],
  composant: ["#8a8f96"],
};

/** Une teinte stable pour un objet (d'après son nom de code), parmi celles de sa famille. */
function teinteDe(type: string, famille: FamilleVestige): string {
  const teintes = TEINTES_FAMILLES[famille];
  let h = 0;
  for (const c of type) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return teintes[h % teintes.length]!;
}

/** Le pictogramme générique d'une famille, dans sa teinte. */
function dessinGenerique(famille: FamilleVestige, teinte: string): string {
  switch (famille) {
    case "cuisine":
      return `
    <path d="M10 18 h28 v16 a6 6 0 0 1 -6 6 h-16 a6 6 0 0 1 -6 -6 Z" fill="${teinte}" ${T}/>
    <path d="M10 22 h-4 M38 22 h4" ${T} stroke-width="3"/>
    <path d="M12 14 h24 l-3 4 h-18 Z" fill="${teinte}" ${T}/><path d="M22 10 h4 v4 h-4 Z" fill="#3b2a1e"/>`;
    case "salle_de_bain":
      return `
    <path d="M17 16 h14 v22 a4 4 0 0 1 -4 4 h-6 a4 4 0 0 1 -4 -4 Z" fill="${teinte}" ${T}/>
    <path d="M20 10 h8 v6 h-8 Z" fill="#f4ecd8" ${T}/><path d="M28 12 h6 l2 3" fill="none" ${T}/>
    <path d="M20 26 h8" stroke="#f4ecd8" stroke-width="3" stroke-linecap="round"/>`;
    case "salon":
      return `
    <path d="M14 8 h20 l5 14 h-30 Z" fill="${teinte}" ${T}/>
    <path d="M24 22 v16" ${T} stroke-width="3"/>
    <path d="M15 42 Q24 36 33 42 Z" fill="#55524d" ${T}/>`;
    case "gadget":
      return `
    <rect x="8" y="12" width="32" height="22" rx="3" fill="${teinte}" ${T}/>
    <rect x="12" y="16" width="24" height="14" fill="#2b3440"/>
    <path d="M15 19 L22 26 L27 22 L33 28" stroke="#8fb3d6" stroke-width="1" fill="none"/>
    <path d="M20 38 h8 M24 34 v4" ${T}/>`;
    case "garage":
      return `
    <path d="M6 20 h36 v18 h-36 Z" fill="${teinte}" ${T}/>
    <path d="M17 20 v-5 h14 v5" fill="none" ${T} stroke-width="2.6"/>
    <path d="M6 27 h36" ${T}/><rect x="21" y="25" width="6" height="5" fill="#c9ccd0" ${T}/>`;
    case "voiture":
      return `
    <circle cx="24" cy="24" r="16" fill="${teinte}" ${T}/>
    <circle cx="24" cy="24" r="8" fill="#c9ccd0" ${T}/>
    <path d="M24 16 v16 M16 24 h16 M18.5 18.5 l11 11 M29.5 18.5 l-11 11" stroke="#8f8a80" stroke-width="1.4"/>
    <circle cx="24" cy="24" r="2.5" fill="#55524d" ${T}/>`;
    case "ferme":
      return `
    <path d="M14 14 Q12 10 16 9 Q24 12 32 9 Q36 10 34 14 L38 38 Q38 42 34 42 H14 Q10 42 10 38 Z" fill="${teinte}" ${T}/>
    <path d="M16 9 Q24 4 32 9" fill="none" ${T} stroke-width="1.4"/>
    <path d="M18 24 Q24 20 30 24 M24 21 V33" fill="none" stroke="#f4ecd8" stroke-width="2" stroke-linecap="round"/>`;
    case "composant":
      return `
    <path d="M24 7 L39 15.5 V32.5 L24 41 L9 32.5 V15.5 Z" fill="${teinte}" ${T}/>
    <circle cx="24" cy="24" r="6.5" fill="#f4ecd8" ${T}/>
    <path d="M16 13 L22 10" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`;
  }
}

/** Le dessin d'un pictogramme : le sien s'il en a un, sinon celui de sa famille de vestiges, sinon un « ? ». */
function dessinDe(type: Pictogramme): string {
  const propre = DESSINS[type] ?? DESSINS_VESTIGES[type];
  if (propre) return propre;
  const v = definitionVestige(type);
  if (v) return dessinGenerique(v.famille, v.teinte ?? teinteDe(type, v.famille));
  return `<rect x="8" y="8" width="32" height="32" rx="5" fill="#d6d2ca" ${T}/><path d="M19 19 Q19 13 24 13 Q29 13 29 18 Q29 22 24 24 V28 M24 33 v1" fill="none" ${T} stroke-width="2.6"/>`;
}

/** Vrai si l'objet a son propre dessin (et pas l'icône générique de sa famille). */
export function estDessinee(type: Pictogramme): boolean {
  return (DESSINS[type] ?? DESSINS_VESTIGES[type]) !== undefined;
}

export function icone(type: Pictogramme, taille = 40): string {
  return `<svg viewBox="0 0 48 48" width="${taille}" height="${taille}" aria-hidden="true">${dessinDe(type)}</svg>`;
}
