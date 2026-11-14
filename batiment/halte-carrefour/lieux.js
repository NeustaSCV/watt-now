// La liste des constructeurs de la halte, tronçon par tronçon (chacun ne bâtit que ce qui tombe dans son tronçon).

import { TRONCON1 } from "./relais.js";
import { TRONCON2 } from "./rondpoint.js";
import { TRONCON3 } from "./jardinerie.js";
import { TRONCON4 } from "./pontcadre.js";

export const CONSTRUCTEURS = [...TRONCON1, ...TRONCON2, ...TRONCON3, ...TRONCON4];
