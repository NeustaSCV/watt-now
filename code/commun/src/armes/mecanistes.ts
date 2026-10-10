// ⚙️ Les armes de contact des Mécanistes (Book 25 §6). L'arbalète est une arme de tir : elle va dans `ARMES_TIR`
// (tir.ts), pas ici, sinon `meilleureArme` la choisirait au contact. Le couteau aiguisé sort de leur meule.

import type { Arme } from "../combat.ts";

export const ARMES_MECANISTES: Arme[] = [
  // Le couteau aiguisé (D11, K37) : 0,85, un outil ; il ne monte pas d'étoiles.
  { rang: 110, objet: "couteau_aiguise", nom: "le couteau aiguisé", type: "tranchant", solidite: 40, degatsTorse: 0.85, tueALaTete: false, allonge: 1.25, coup: 420, coupAppuye: 650 },
];
