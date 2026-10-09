// Les armes de tout le monde : les vestiges, le kit, la gamme bushcraft (Book 23 §4.6, P-002).
// `rang` : la place dans ARMES, de la meilleure à la moins bonne (sans arme équipée, on frappe avec la meilleure du sac).
// Les rangs vont de 10 en 10 : une arme nouvelle se glisse entre deux sans renuméroter (Book 25 §10.4).

import type { Arme } from "../combat.ts";

export const ARMES_COMMUNES: Arme[] = [
  // La masse (Book 23 §4.6) : très forte, lente ; le casque n'y résiste pas.
  { rang: 10, objet: "masse", nom: "la masse", type: "contondant", solidite: 70, degatsTorse: 2.5, tueALaTete: true, allonge: 1.6, coup: 950, coupAppuye: 1250 },
  { rang: 20, objet: "hache", nom: "la hache", type: "tranchant", solidite: 60, degatsTorse: 2, tueALaTete: true, allonge: 1.7, coup: 700, coupAppuye: 950 },
  // Le pied-de-biche : le vestige devient une arme, la plus solide de toutes (Book 23 §4.6).
  { rang: 30, objet: "pied_de_biche", nom: "le pied-de-biche", type: "contondant", solidite: 120, degatsTorse: 1.5, tueALaTete: true, allonge: 1.5, coup: 600, coupAppuye: 880 },
  // La machette de fortune (Book 25 §0.2) : une tôle découpée, un manche ficelé. Une lame ★ : ses valeurs sont à ★.
  { rang: 40, objet: "machette", nom: "la machette de fortune", type: "tranchant", solidite: 40, degatsTorse: 1.2, tueALaTete: true, allonge: 1.6, coup: 500, coupAppuye: 750, metier: true },
  { rang: 50, objet: "marteau", nom: "le marteau", type: "contondant", solidite: 80, degatsTorse: 1.5, tueALaTete: true, allonge: 1.5, coup: 600, coupAppuye: 850 },
  { rang: 60, objet: "barre_metal", nom: "la barre de métal", type: "contondant", solidite: 100, degatsTorse: 1.5, tueALaTete: true, allonge: 1.9, coup: 650, coupAppuye: 900 },
  // La lance (épieu + couteau, évolution P-002) : l'allonge, et cette fois la pointe tue à la tête.
  { rang: 70, objet: "lance", nom: "la lance", type: "percant", solidite: 40, degatsTorse: 1.2, tueALaTete: true, allonge: 2.6, coup: 650, coupAppuye: 900 },
  { rang: 90, objet: "gourdin", nom: "le gourdin", type: "contondant", solidite: 25, degatsTorse: 1, tueALaTete: false, allonge: 1.5, coup: 550, coupAppuye: 800 },
  // L'épieu (P-002) : peu de dégâts, mais l'allonge : on le tient à distance, il saisit avant de mordre.
  { rang: 100, objet: "epieu", nom: "l'épieu", type: "percant", solidite: 30, degatsTorse: 0.8, tueALaTete: false, allonge: 2.3, coup: 650, coupAppuye: 900 },
  { rang: 120, objet: "couteau", nom: "le couteau", type: "tranchant", solidite: 40, degatsTorse: 0.5, tueALaTete: false, allonge: 1.2, coup: 420, coupAppuye: 650 },
];
