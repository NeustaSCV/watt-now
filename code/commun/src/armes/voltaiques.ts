// ⚡ Les armes des Voltaïques : l'électricité (Book 25 §5 et §8.2, chantier 6). Type « électrique » : la courte (coup)
// fait lâcher, raidit, et ajoute ses dégâts au torse (plan 0.8 §2.4, `degats-electriques.md`) ; la longue (coupAppuye)
// met à terre un Éteint libre et détruit un Éteint raidi ou à terre, casque ou pas. Les valeurs sont données aux étoiles
// de base de chaque objet (OBJETS_DE_METIER, etoiles.ts) ; les autres étoiles ont leurs dégâts et leur solidité décidés
// (`parEtoiles`, K26 à K36) ; le raidissement et la durée de la longue suivent `ETOILES` (★★ : 2,5 s et 1,0 s, P6).
//
// Les dégâts sont ceux du **coup** (C11) : pack vide, l'arme frappe à la moitié (`armeSansCharge`, combat.ts). La
// consommation de Wh et la recharge sont dans serveur/src/electricite.ts.

import type { Arme } from "../combat.ts";

/** Ce que coûte une décharge (Book 25 §5.4) : 0,25 Wh la courte, 1 Wh la longue (une mise à mort : 1,25 Wh). */
export const WH_COURTE = 0.25;
export const WH_LONGUE = 1;
/**
 * La petite batterie du kit, dans la matraque de fortune, ou source de la matraque ★★ (Q-A5) : 50 Wh
 * (`CAPACITES.petite_batterie`, energie.ts). Elle est unique : elle va à l'une **ou** à l'autre (Q-B6).
 */
export const CAPACITE_MATRAQUE_FORTUNE_WH = 50;

export const ARMES_VOLTAIQUES: Arme[] = [
  // La Raquette (§5.3), l'arme de métier : ★ au flash, ★★ à la raquette (H1), ★★★ au module à bobine (L2). Juste sous
  // la lame à étoiles égales (elle raidit en plus) : 1,0 · 1,1 · 2,25 · 3,15 · 4,05. La ★★ prend la petite batterie du
  // kit pour source sûre (Q-A5) : 50 Wh au lieu d'un pack de 12.
  {
    rang: 75,
    objet: "matraque_electrique",
    nom: "la matraque électrique",
    type: "electrique",
    solidite: 80,
    degatsTorse: 2.25,
    tueALaTete: true,
    allonge: 1.3,
    coup: 450,
    coupAppuye: 1000,
    metier: true,
    electrique: { raidi: 2.5, whCourte: WH_COURTE, whLongue: WH_LONGUE, saute: true },
    parEtoiles: {
      1: { degats: 1, solidite: 60, etape: "H1" },
      2: { degats: 1.1, solidite: 60, etape: "H1", capaciteWh: CAPACITE_MATRAQUE_FORTUNE_WH },
      3: { degats: 2.25, solidite: 80, etape: "L2" },
      4: { degats: 3.15, solidite: 110, etape: "L3" },
      // C3 : la solidité de la ★★★★★ est retenue, à revoir plus tard.
      5: { degats: 4.05, solidite: 150, etape: "plus_tard" },
    },
  },
  // L'aiguillon (§5.3) : la même décharge au bout d'un épieu, à 2,3 m. Au niveau 2 (grisé en 0.8) : 2,0 à 3,0 (K33 à
  // K36) ; un manche de perche, un peu sous la matraque (C5) ; la longue se tient 1,0 s comme la matraque (C6) ; à ★★★,
  // la courte saute au voisin (C7).
  {
    rang: 78,
    objet: "aiguillon",
    nom: "l'aiguillon de défense",
    type: "electrique",
    solidite: 60,
    degatsTorse: 2.1,
    tueALaTete: true,
    allonge: 2.3,
    coup: 650,
    coupAppuye: 1000,
    metier: true,
    electrique: { raidi: 2.5, whCourte: WH_COURTE, whLongue: WH_LONGUE, saute: true },
    parEtoiles: {
      1: { degats: 2, solidite: 40, etape: "L2", longueMs: 1000 },
      2: { degats: 2.05, solidite: 50, etape: "L2", longueMs: 1000 },
      3: { degats: 2.1, solidite: 60, etape: "L2", longueMs: 1000 },
      4: { degats: 3, solidite: 80, etape: "L3", longueMs: 1000 },
    },
  },
  // La matraque de fortune (§5.3, voie autonome) : un gourdin, le flash d'un appareil jetable, la petite batterie du
  // kit. Une arme ★ (0,9), ★★ par la maîtrise seulement (1,0) ; solidité 60 (P5). Elle raidit 1,5 s, la longue se
  // tient 1,4 s ; mais 50 Wh dans le manche. Son relais : la matraque électrique.
  {
    rang: 85,
    objet: "matraque_fortune",
    nom: "la matraque de fortune",
    type: "electrique",
    solidite: 60,
    degatsTorse: 0.9,
    tueALaTete: true,
    allonge: 1.3,
    coup: 450,
    coupAppuye: 1400,
    metier: true,
    electrique: { raidi: 1.5, whCourte: WH_COURTE, whLongue: WH_LONGUE, saute: false, capaciteWh: CAPACITE_MATRAQUE_FORTUNE_WH },
    parEtoiles: { 1: { degats: 0.9, solidite: 60, etape: "H1" }, 2: { degats: 1, solidite: 60, etape: "H1" } },
  },
];
