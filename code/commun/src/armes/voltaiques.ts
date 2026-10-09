// ⚡ Les armes des Voltaïques : l'électricité (Book 25 §5 et §8.2, chantier 6). Type « électrique » : rien au torse ;
// la courte (coup) fait lâcher et raidit, la longue (coupAppuye) met à terre un Éteint libre et détruit un Éteint
// raidi ou à terre, casque ou pas. Les valeurs sont données aux étoiles de base de chaque objet (OBJETS_DE_METIER,
// etoiles.ts) ; le raidissement et la durée de la longue suivent les étoiles de l'exemplaire (ETOILES).
//
// La consommation de Wh, le pack vide (un gourdin court) et la recharge sont dans serveur/src/electricite.ts.

import type { Arme } from "../combat.ts";

/** Ce que coûte une décharge (Book 25 §5.4) : 0,25 Wh la courte, 1 Wh la longue (une mise à mort : 1,25 Wh). */
export const WH_COURTE = 0.25;
export const WH_LONGUE = 1;
/** La petite batterie du kit, dans la matraque de fortune : 50 Wh (`CAPACITES.petite_batterie`, energie.ts). */
export const CAPACITE_MATRAQUE_FORTUNE_WH = 50;

export const ARMES_VOLTAIQUES: Arme[] = [
  // La Raquette (§5.3), l'arme de métier : ★★★ avec un module à bobine (la courte saute au voisin), ★★ à la raquette.
  {
    rang: 75,
    objet: "matraque_electrique",
    nom: "la matraque électrique",
    type: "electrique",
    solidite: 60,
    degatsTorse: 0,
    tueALaTete: true,
    allonge: 1.3,
    coup: 450,
    coupAppuye: 1000,
    metier: true,
    electrique: { raidi: 2.5, whCourte: WH_COURTE, whLongue: WH_LONGUE, saute: true },
  },
  // L'aiguillon (§5.3) : la même décharge au bout d'un épieu, à 2,3 m ; la longue prend 0,3 s de plus (on vise au bout
  // d'une perche), et elle ne saute pas.
  {
    rang: 78,
    objet: "aiguillon",
    nom: "l'aiguillon de défense",
    type: "electrique",
    solidite: 40,
    degatsTorse: 0,
    tueALaTete: true,
    allonge: 2.3,
    coup: 650,
    coupAppuye: 1300,
    metier: true,
    electrique: { raidi: 2.5, whCourte: WH_COURTE, whLongue: WH_LONGUE, saute: false },
  },
  // La matraque de fortune (§5.3, voie autonome) : un gourdin, le flash d'un appareil jetable, la petite batterie du
  // kit. Une arme ★ : elle raidit 1,5 s, la longue se tient 1,4 s, elle s'use vite ; mais 50 Wh dans le manche.
  {
    rang: 85,
    objet: "matraque_fortune",
    nom: "la matraque de fortune",
    type: "electrique",
    solidite: 30,
    degatsTorse: 0,
    tueALaTete: true,
    allonge: 1.3,
    coup: 450,
    coupAppuye: 1400,
    metier: true,
    electrique: { raidi: 1.5, whCourte: WH_COURTE, whLongue: WH_LONGUE, saute: false, capaciteWh: CAPACITE_MATRAQUE_FORTUNE_WH },
  },
];
