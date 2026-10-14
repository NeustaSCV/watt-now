// Les armes de tout le monde : les vestiges, le kit, la gamme bushcraft (Book 23 §4.6, P-002).
// `rang` : la place dans ARMES, de la meilleure à la moins bonne (sans arme équipée, on frappe avec la meilleure du sac).
// Les rangs vont de 10 en 10 : une arme nouvelle se glisse entre deux sans renuméroter (Book 25 §10.4).
//
// Plan 0.8 §2.4 (chantier 8) : les armes **fabriquées** suivent la bande de dégâts de leur étape (D1 à D4, K38, K39) ;
// la maison est à 0 – 1. Les armes **trouvées** (masse, pied-de-biche, machette de fortune, fourche) sont à part : on
// joue sur leur usure.

import type { Arme } from "../combat.ts";

export const ARMES_COMMUNES: Arme[] = [
  // ---- Les armes trouvées du niveau 2 (plan 0.10, chantier F ; N2-49, N2-62) ----
  // Au-dessus de la masse (2,5), une seule fois par personnage, sans étoiles ; elles ne se refont pas. Leur contrepartie
  // est l'usure (R31) : solidité 50. Les chantiers J et K les posent dans leur lieu (la terrasse de l'hôtel, la cuisine du
  // gardien du phare), comme la fourche au Moulin.
  // Le pied de guéridon en fonte (L2A) : lourd et lent (un coup ≈ 1 s) ; il passe le casque. La fonte casse net.
  { rang: 6, objet: "pied_gueridon", nom: "le pied de guéridon", type: "contondant", solidite: 50, degatsTorse: 3.2, tueALaTete: true, allonge: 1.5, coup: 1000, coupAppuye: 1300 },
  // Le harpon du gardien (L2B) : un fer barbelé au bout d'une hampe, tenu à 2,4 m, qui passe le casque comme la fourche.
  { rang: 8, objet: "harpon", nom: "le harpon du gardien", type: "percant", solidite: 50, degatsTorse: 3.2, tueALaTete: true, allonge: 2.4, coup: 700, coupAppuye: 950 },
  // La masse (Book 23 §4.6) : très forte, lente ; le casque n'y résiste pas.
  { rang: 10, objet: "masse", nom: "la masse", type: "contondant", solidite: 70, degatsTorse: 2.5, tueALaTete: true, allonge: 1.6, coup: 950, coupAppuye: 1250 },
  // La hache (tête trouvée, manche taillé) : 1,0, le haut de la bande de la maison (K39). C'est aussi l'outil Fendre.
  { rang: 20, objet: "hache", nom: "la hache", type: "tranchant", solidite: 60, degatsTorse: 1, tueALaTete: true, allonge: 1.7, coup: 700, coupAppuye: 950 },
  // Le pied-de-biche : le vestige devient une arme, la plus solide de toutes (Book 23 §4.6).
  { rang: 30, objet: "pied_de_biche", nom: "le pied-de-biche", type: "contondant", solidite: 120, degatsTorse: 1.5, tueALaTete: true, allonge: 1.5, coup: 600, coupAppuye: 880 },
  // La fourche à foin de l'étable du Moulin (L1B, I30) : trouvée, une fois par personnage. Ses dents percent, et passent
  // le casque ; l'allonge tient l'Éteint au bout. Pas d'étoiles, et ce n'est pas un outil. 2,3 depuis la 0.10 (N2-66) :
  // elle approche la masse de la route A (2,5).
  { rang: 35, objet: "fourche_foin", nom: "la fourche à foin", type: "percant", solidite: 80, degatsTorse: 2.3, tueALaTete: true, allonge: 2, coup: 650, coupAppuye: 900 },
  // La machette de fortune (Book 25 §0.2) : une tôle découpée, un manche ficelé. Une lame ★ : ses valeurs sont à ★.
  { rang: 40, objet: "machette", nom: "la machette de fortune", type: "tranchant", solidite: 40, degatsTorse: 1.2, tueALaTete: true, allonge: 1.6, coup: 500, coupAppuye: 750, metier: true },
  // Le marteau remmanché (D1, Q-A3) : 0,8, et il ne tue plus à la tête d'un coup ; il assomme et met à terre. Solidité
  // 40 : c'est le manche qui lâche, la tête ne s'use pas (R-ARMES-4).
  { rang: 50, objet: "marteau", nom: "le marteau", type: "contondant", solidite: 40, degatsTorse: 0.8, tueALaTete: false, allonge: 1.5, coup: 600, coupAppuye: 850 },
  // La barre de métal (0.8.4) : 1,0, le haut de la bande de la maison, comme la hache ; à 1,5, elle dépassait l'épieu et
  // la plupart des armes fabriquées.
  { rang: 60, objet: "barre_metal", nom: "la barre de métal", type: "contondant", solidite: 100, degatsTorse: 1, tueALaTete: true, allonge: 1.9, coup: 650, coupAppuye: 900 },
  // La lance (épieu + couteau, évolution P-002) : l'allonge, et cette fois la pointe tue à la tête. 0,7 (D2), mesurée
  // au test de jeu avant d'y toucher encore (Q-0.8-6).
  { rang: 70, objet: "lance", nom: "la lance", type: "percant", solidite: 40, degatsTorse: 0.7, tueALaTete: true, allonge: 2.6, coup: 650, coupAppuye: 900 },
  { rang: 90, objet: "gourdin", nom: "le gourdin", type: "contondant", solidite: 25, degatsTorse: 0.7, tueALaTete: false, allonge: 1.5, coup: 550, coupAppuye: 800 },
  // L'épieu (P-002) : peu de dégâts, mais l'allonge : on le tient à distance, il saisit avant de mordre.
  { rang: 100, objet: "epieu", nom: "l'épieu", type: "percant", solidite: 30, degatsTorse: 0.6, tueALaTete: false, allonge: 2.3, coup: 650, coupAppuye: 900 },
  { rang: 120, objet: "couteau", nom: "le couteau", type: "tranchant", solidite: 40, degatsTorse: 0.5, tueALaTete: false, allonge: 1.2, coup: 420, coupAppuye: 650 },
];
