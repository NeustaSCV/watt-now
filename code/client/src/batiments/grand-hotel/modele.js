// Le Grand Hôtel des Flots (Book 20 §3.5, « Station balnéaire », Littoral, anneau moyen, danger ●●●) — L2A, « le check-in ».
//
// Un palace Belle Époque face à la mer : longue façade crème qui pèle, trois étages de balcons en fer forgé (l'un s'est
// effondré sur la dune), une rotonde d'angle coiffée d'une coupole de zinc vert-de-gris, une marquise de fer qui a perdu
// tous ses verres et, sur le toit, les grandes lettres rouillées « GRAND HÔTEL DES FLOTS » (le S est tombé).
// Devant : la terrasse et ses transats délavés, la piscine d'eau de mer devenue mare, la promenade, la plage. Le vent
// d'ouest a poussé le sable dans la salle à manger : des dunes entre les tables nappées.
//
// UN SEUL LOT (niveau 2, demande H1) : la façade, la terrasse, la piscine, la promenade et l'intérieur (réception,
// salle à manger, cuisines, grand salon, bar de la rotonde) sont assemblés. L'ÉTAGE (H2) est posé au sol, AU NORD de
// l'hôtel, derrière lui (la caméra du sud-est ne le voit pas depuis le rez-de-chaussée) : le jeu y téléporte le joueur
// par l'ascenseur (FICHE.teleports) et l'en fait redescendre par le saut du balcon effondré (FICHE.sensUnique).
// Le groupe renvoyé contient deux groupes nommés, `rez_de_chaussee` et `etage`, que le jeu peut cacher l'un ou l'autre.
//
// Repère H (celui de tout le code) : +x à l'est, +z au sud (la mer). Corps principal de x = -30 à 16, z = -12 à 2
// (façade sud) ; rotonde de rayon 5,5 m centrée en (17,6 ; 1). Terrasse jusqu'à z = 18, promenade jusqu'à z = 22, plage,
// mer au-delà de z = 33. L'étage : x = -20 à 6, z = -26,6 à -15,6. Le lot (64 × 66 m) est centré en H (-1 ; 5) : tout
// (géométrie et données de jeu) est recentré sur lui à la fin de creer().
//
// 0.10 (R52, « un lieu ne s'arrête jamais net ») : un troisième groupe, `alentours`, prolonge le décor de 45 m autour
// du lot (la côte, les dunes et leurs ganivelles, la promenade qui se perd dans le sable à l'est et à l'ouest, la mer,
// la rue de derrière et ses façades au nord). Le panneau de sortie de l'est (`panneau_sortie_est`) et sa lanterne ; la
// mer en bandes (l'eau claire où l'on marche, la ligne de brisants, le large), d'une seule matière dans le lot et autour.

import * as THREE from "three";
import {
  Batiment, Chantier, PALETTE, mur, lierre as lierreA, semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA, mousse,
  raiDeLumiere as raiA, aleatoire, matiereLueur,
} from "../commun/atelier.js";
import { COUL, R, matieres, panneau, uvAtlas } from "./textures.js";
import {
  cylindre, geoTriangle, chaise, tableRonde, gueridon, lustre, fauteuil, canape, piano, palmier, transat, parasol, cabine, barque, chariotBagages,
  presentoir, pouf, litBaldaquin, litFer, baignoire, lavabo, armoire, pianoCuisson, tableInox, etagere, conserves, linge, bouteilles,
  calandre, chariotLinge, lanterne, photophore, couchage, caisse, dune,
} from "./mobilier.js";

// La végétation et le petit désordre coûtent cher en triangles : on les dose (un seul lot pour tout l'hôtel).
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.14));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.18), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.25), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.22), t, y);
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.09);

// ---------- Mesures ----------

const X0 = -30; // pignon ouest
const X1 = 16; // mur est du corps principal
const Z0 = -12; // façade nord (rue de derrière)
const ZS = 2; // façade sud (la mer)
const ROT = { x: 17.6, z: 1, r: 5.5 }; // la rotonde d'angle
const XS1 = ROT.x - Math.sqrt(ROT.r ** 2 - (ZS - ROT.z) ** 2); // fin de la façade sud, départ de la rotonde (≈ 12,19)
const ZE1 = ROT.z - Math.sqrt(ROT.r ** 2 - (X1 - ROT.x) ** 2); // départ du mur est, au nord de la rotonde (≈ -4,26)
const A0 = Math.atan2(ZS - ROT.z, XS1 - ROT.x); // angle de départ de l'arc de la rotonde (côté façade sud)
const A1 = Math.atan2(ZE1 - ROT.z, X1 - ROT.x); // angle d'arrivée (côté mur est)
const NROT = 9; // pans de la rotonde
const RDC = 4.8; // rez-de-chaussée haut de plafond (Belle Époque)
const ET = 3.5; // hauteur d'un étage
const CORN = RDC + 3 * ET; // corniche (15,3)
const BRIS = CORN + 2.8; // haut du brisis du toit à la Mansart
const CUT = 0.85; // coupe des façades côté caméra (hauteur d'allège)
const CUTI = 1.3; // coupe des cloisons intérieures
const EP = 0.5; // murs de façade
const EPI = 0.2; // cloisons
/** Les travées de la façade sud (axes des fenêtres) ; la porte d'entrée est en x = 1. */
const BAIES = [-27.8, -24.6, -21.4, -18.2, -15, -11.8, -8.6, -5.4, -2.2, 1, 4.2, 7.4, 10.6];
const BALCON_TOMBE = -11.8; // le balcon du premier étage effondré sur la dune (celui de la chambre 8)

// L'ascenseur du hall (cabine au rez-de-chaussée, grille au sud)
const ASC = { x1: -3.5, x2: -1.5, z1: -11.7, z2: -9.7 };

// ---------- L'étage, posé au sol au nord de l'hôtel ----------

const EX0 = -20; // mur ouest de l'étage
const EX1 = 6; // mur est
const EZ0 = -26.6; // mur nord (côté rue)
const EZS = -15.6; // mur sud (côté mer)
const EC1 = -22.4; // le couloir, entre z = -22,4…
const EC2 = -20.2; // … et z = -20,2
const EH = 3.2; // hauteur des murs du fond (nord, ouest)
const ECUT = 1.0; // murs sud et est coupés à hauteur d'allège (la caméra regarde du sud-est)
/** La cabine de l'ascenseur à l'étage, sur le palier (grille à l'ouest). */
const ASC_H = { x1: 3.8, x2: 5.8, z1: -19.6, z2: -17.6 };
/** Le balcon effondré de la chambre 8 (porte-fenêtre dans le mur sud). */
const BALCON_E = { x: -4.5 };

/** La mer (repère H) : le bord de l'eau, la ligne de brisants où l'on perd pied (celle du jeu : 3,5 m plus loin). */
const MER = { bord: 33.2, brisants: 36.7 };
/** Ces limites dans le repère du lot (FICHE). */
const MER_LOT = { bord: 28.2, brisants: 31.7 };
/** Le panneau de sortie de l'est : au bout de la promenade, juste après la sortie, tourné vers la caméra (sud-est). */
const PANNEAU_EST = { x: 31.9, z: 17.2, ry: Math.PI / 4 };
const TEXTE_PANNEAU_EST = "Route du pont → · Ton terrain, par le pont · 5 km";
/** Le verre de la lanterne, dans le repère du panneau (u le long, v devant, y la hauteur). */
const LANTERNE_EST = { u: 0.25, v: 0.4, y: 2.86 };

/** Lot unique : 64 × 66 m, centré en H (-1 ; 5) : x de -33 à 31, z de -28 à 38. */
const CENTRE = { x: -1, z: 5 };
const LOT = { l: 64, p: 66 };

/** Des points du repère H vers le repère du lot. */
function vers(points) {
  return points.map((p) => ({ ...p, x: Math.round((p.x - CENTRE.x) * 100) / 100, z: Math.round((p.z - CENTRE.z) * 100) / 100 }));
}
/** Une boîte de pièce, donnée par ses coins dans le repère H, vers le repère du lot ({ x, z, l, p }, centrée). */
function boite(x1, z1, x2, z2) {
  return { x: Math.round(((x1 + x2) / 2 - CENTRE.x) * 100) / 100, z: Math.round(((z1 + z2) / 2 - CENTRE.z) * 100) / 100, l: Math.round(Math.abs(x2 - x1) * 100) / 100, p: Math.round(Math.abs(z2 - z1) * 100) / 100 };
}
const piece = (nom, sombre, ...boites) => ({ nom, sombre, boites: boites.map((b) => boite(...b)) });
const porteF = (id, x, z, largeur, axe, entre) => ({ id, ...vers([{ x, z }])[0], largeur, axe, entre });

/** Les portes-fenêtres de la rotonde sur la terrasse (pans 2 et 3) : leur milieu. */
function milieuPanRotonde(i) {
  const p = sommetsRotonde();
  return { x: (p[i][0] + p[i + 1][0]) / 2, z: (p[i][1] + p[i + 1][1]) / 2 };
}
const ROT2 = milieuPanRotonde(2);
const ROT3 = milieuPanRotonde(3);

export const FICHE = {
  id: "grand-hotel",
  nom: "Le Grand Hôtel des Flots",
  lieu: "Station balnéaire · Littoral · moyen",
  environnement: "littoral",
  anneau: "moyen",
  danger: 3,
  recit:
    "On y venait de toute l'Europe prendre les bains de mer, puis l'Abondance l'a racheté pour vendre le « Séjour Zéro-Effort » : repas mâchés, bronzage par abonnement, respiration assistée en option. Les clients ne se levaient plus de leurs transats ; quand le courant a manqué, beaucoup ne se sont jamais relevés. Le vent a rempli la salle à manger de sable, le S de l'enseigne est tombé sur la terrasse, et la borne de la réception attend toujours votre plus beau sourire pour vous rendre la clé de votre chambre.",
  inspiration:
    "les palaces Belle Époque de la Riviera et de la côte normande laissés à l'abandon, le Grand Hôtel Campo dei Fiori au-dessus de Varèse, les hôtels de bord de mer d'Europe de l'Est ; les photographies d'urbex : salles à manger aux lustres tombés, ascenseurs à grille, papiers peints décollés, rideaux qui battent au vent, chambres ouvertes sur la mer",
  reperes: [
    "La longue façade crème qui pèle face à la mer : pilastres, corniche à modillons, persiennes de travers, rideaux qui sortent des fenêtres et battent au vent",
    "La rotonde d'angle et sa coupole de zinc vert-de-gris, à lanternon ; son balcon circulaire en fer forgé",
    "Les lettres rouillées « GRAND HÔTEL DES FLOTS » sur le toit à la Mansart : le S est tombé et s'est planté dans le sable de la terrasse",
    "Le balcon de la chambre 8 effondré sur la dune devant la façade (c'est par là qu'on redescend de l'étage) ; la marquise de fer qui a perdu tous ses verres",
    "La terrasse : guéridons (l'un renversé, son pied de fonte se démonte), transats où dorment des clients, parasols délavés ; la piscine d'eau de mer devenue mare et ses Noyés",
    "Le panneau « Séjour Zéro-Effort » de la promenade, éclairé par son panneau solaire : sa batterie se dévisse",
    "Les dunes qui envahissent la salle à manger : tables nappées à demi ensevelies, lustres de cristal tombés, robot-serveur ensablé qui sourit encore (sa tête se dévisse)",
    "Le hall : comptoir de réception, tableau des clés, chariot à bagages en laiton, grand escalier effondré, l'ascenseur à grille (sa cabine attend en bas) et la borne « Check-in par sourire », éteinte",
    "Les cuisines (piano de cuisson, hotte, chambres froides), le grand salon (camp de survivants devant la cheminée, piano à queue), le bar de la rotonde barricadé",
    "À l'étage : le couloir, la suite et son lit à baldaquin, la chambre 7, la chambre 8 au balcon effondré (des tôles pour rapiécer le toit), la lingerie et ses draps qui pendent, la machinerie de l'ascenseur",
  ],
  lot: LOT,
  // Le lieu fournit tout son sol : la piscine est creusée sous y = 0 (son bord est noté comme obstacle).
  solPropre: true,
  depart: vers([{ x: 27, z: 20 }])[0],
  bords:
    "au sud, la mer : l'eau claire où l'on marche jusqu'aux genoux, puis la ligne de brisants où l'on perd pied ; à l'ouest, une ganivelle continue, en travers de la promenade et jusque dans l'eau ; à l'est, des ganivelles jusque dans l'eau, ouvertes sur la promenade (la sortie) ; au nord, l'hôtel et les murs de la cour de service ; l'étage est clos par ses murs",
  entrees: vers([{ x: 30.5, z: 20, nature: "la promenade, par l'est (l'arrivée, et la sortie vers la route du pont)" }]),
  // R0-1 : le panneau de sortie (objet nommé `panneau_sortie_est`), sa lanterne au-dessus (FICHE ↔ userData.lumieres).
  panneaux: vers([{ x: PANNEAU_EST.x, z: PANNEAU_EST.z, texte: TEXTE_PANNEAU_EST, sortie: "est : la promenade, vers la route du pont" }]),
  // R0-3 : la mer (repère du lot). Une seule matière (l'atlas) pour l'eau du lot et celle des alentours.
  mer: {
    peuProfonde: `l'eau claire, turquoise, où l'on marche jusqu'aux genoux : du bord de l'eau (z = ${MER_LOT.bord}) à la ligne de brisants (z = ${MER_LOT.brisants}), sur toute la largeur du lot (et au-delà, dans les alentours)`,
    profonde: `au-delà de la ligne de brisants (écume blanche, z = ${MER_LOT.brisants}) : l'eau sombre, on perd pied (obstacle « le large »)`,
    bord: MER_LOT.bord,
    brisants: MER_LOT.brisants,
  },
  // Les objets à part, nommés (groupe.userData.objets) : le jeu les montre, les cache ou les efface.
  objets: {
    grille_ascenseur_bas: "la grille de la cabine de l'ascenseur, dans le hall (fermée ; le jeu l'efface quand on l'ouvre)",
    grille_ascenseur_haut: "la grille de la cabine de l'ascenseur, sur le palier de l'étage (fermée)",
    borne_checkin: "la borne « Check-in par sourire » du hall (le meuble, sans son écran)",
    ecran_borne_eteint: "l'écran éteint de la borne (visible au départ)",
    ecran_borne_allume: "l'écran allumé de la borne, le sourire de Watty (caché au départ ; on le montre quand la batterie et la tête sont branchées)",
    tete_robot: "la tête du robot-serveur ensablé (on l'emporte à la borne)",
    sable_robot: "le monticule de sable sur le robot-serveur (le jeu l'efface quand on a creusé)",
    batterie_panneau: "la batterie du panneau « Zéro-Effort », au pied du panneau (on l'emporte à la borne)",
    pied_gueridon: "le pied de fonte du guéridon renversé de la terrasse (on le démonte)",
    couvertures_laine: "la pile de couvertures de laine, dans la lingerie de l'étage (objet-clé)",
    lanterne_tempete: "la lanterne-tempête, sur la table de la suite (objet-clé)",
    roulements: "la boîte de roulements, sur l'établi de la machinerie de l'ascenseur (objet-clé)",
    fer_a_souder: "le fer à souder, sur l'établi de la machinerie de l'ascenseur (objet-clé)",
    toles: "les tôles ondulées empilées dans la chambre 8, au balcon effondré (objet-clé)",
    panneau_sortie_est: "le panneau de sortie de l'est, au bout de la promenade : « Route du pont → · Ton terrain, par le pont · 5 km » (sa lanterne luit à part, dans le décor)",
    alentours: "le décor au-delà du lot (R52) : la côte, les dunes, la promenade qui se perd dans le sable, la mer, la rue de derrière ; vu du rez-de-chaussée (le jeu le cache à l'étage s'il veut)",
  },
  // L'ascenseur : la cabine du hall et celle du palier (pas de cabine qui bouge) ; le jeu fait le fondu au noir.
  teleports: [
    {
      id: "ascenseur",
      bas: vers([{ x: (ASC.x1 + ASC.x2) / 2, z: (ASC.z1 + ASC.z2) / 2 }])[0],
      haut: vers([{ x: (ASC_H.x1 + ASC_H.x2) / 2, z: (ASC_H.z1 + ASC_H.z2) / 2 }])[0],
      nature: "l'ascenseur à grille : la cabine du hall (rez-de-chaussée) et celle du palier (étage) ; il marche une fois la carte de la chambre 7 remise par la borne",
    },
  ],
  sensUnique: [
    {
      id: "balcon",
      de: vers([{ x: BALCON_E.x, z: EZS + 0.55 }])[0],
      vers: vers([{ x: BALCON_TOMBE + 1.4, z: 6.2 }])[0],
      nature: "on saute du balcon effondré de la chambre 8 (étage, côté mer : la dalle a cédé, le garde-corps est tordu) sur la dune devant la façade, à côté du balcon tombé ; on ne remonte pas",
    },
  ],
  pieces: {
    hall: piece("le hall de réception", false, [-3.8, Z0, 5.8, ZS]),
    salle_a_manger: piece("la salle à manger ensablée", false, [-16.6, -6, -3.8, ZS]),
    cuisines: piece("les cuisines", false, [-11, Z0, -3.8, -6], [-16.6, -9.5, -11, -6]),
    chambre_froide_1: piece("la chambre froide des conserves", true, [-16.6, Z0, -13.8, -9.5]),
    chambre_froide_2: piece("la chambre froide du poisson", true, [-13.8, Z0, -11, -9.5]),
    salon: piece("le grand salon (camp de survivants)", false, [5.8, Z0, X1, -4.3], [5.8, -4.3, 12.2, ZS]),
    bar: piece("le bar de la rotonde", false, [12.2, -4.3, 23.1, 6.5]),
    couloir: piece("le couloir de l'étage", false, [EX0, EC1, 2, EC2]),
    palier: piece("le palier de l'ascenseur", false, [2, EC1, EX1, EZS]),
    machinerie: piece("la machinerie de l'ascenseur", true, [2, EZ0, EX1, EC1]),
    suite: piece("la suite (lit à baldaquin)", false, [-17.6, EC2, -12, EZS]),
    salle_de_bain_suite: piece("la salle de bains de la suite", true, [EX0, EC2, -17.6, EZS]),
    chambre_7: piece("la chambre 7", false, [-12, EC2, -7, EZS]),
    salle_de_bain_7: piece("la salle de bains de la chambre 7", true, [-12, EC2, -9.6, -17.8]),
    chambre_8: piece("la chambre 8, au balcon effondré", false, [-7, EC2, -2, EZS]),
    chambre_9: piece("la chambre 9", false, [-2, EC2, 2, EZS]),
    lingerie: piece("la lingerie", false, [EX0, EZ0, -10, EC1]),
    chambre_11: piece("la chambre 11 (sur la cour)", false, [-10, EZ0, -2.5, EC1]),
    office: piece("l'office d'étage", true, [-2.5, EZ0, 2, EC1]),
  },
  portes: [
    porteF("entree", 1, ZS, 2.6, "x", ["dehors", "hall"]),
    porteF("salle_terrasse_1", -15, ZS, 1.7, "x", ["dehors", "salle_a_manger"]),
    porteF("salle_terrasse_2", -11.8, ZS, 1.7, "x", ["dehors", "salle_a_manger"]),
    porteF("hall_salle", -3.8, -0.2, 2.6, "z", ["hall", "salle_a_manger"]),
    porteF("hall_cuisines", -3.8, -8, 1.4, "z", ["hall", "cuisines"]),
    porteF("salle_cuisines", -10, -6, 1.4, "x", ["salle_a_manger", "cuisines"]),
    porteF("cuisines_froide_1", -15.2, -9.5, 1.3, "x", ["cuisines", "chambre_froide_1"]),
    porteF("cuisines_froide_2", -12.4, -9.5, 1.3, "x", ["cuisines", "chambre_froide_2"]),
    porteF("hall_salon_nord", 5.8, -9, 1.4, "z", ["hall", "salon"]),
    porteF("hall_salon_sud", 5.8, -2, 3.0, "z", ["hall", "salon"]),
    porteF("salon_bar", 14.1, -1.13, 1.5, "z", ["salon", "bar"]),
    porteF("bar_terrasse_1", Math.round(ROT2.x * 100) / 100, Math.round(ROT2.z * 100) / 100, 1.6, "x", ["bar", "dehors"]),
    porteF("bar_terrasse_2", Math.round(ROT3.x * 100) / 100, Math.round(ROT3.z * 100) / 100, 1.6, "x", ["bar", "dehors"]),
    porteF("couloir_palier", 2, -21.3, 2.2, "z", ["couloir", "palier"]),
    porteF("palier_machinerie", 4, EC1, 1.4, "x", ["palier", "machinerie"]),
    porteF("couloir_suite", -15.6, EC2, 1.4, "x", ["couloir", "suite"]),
    porteF("suite_bain", -17.6, -18.4, 1.3, "z", ["suite", "salle_de_bain_suite"]),
    porteF("couloir_chambre_7", -8.3, EC2, 1.4, "x", ["couloir", "chambre_7"]),
    porteF("chambre_7_bain", -9.6, -19.0, 1.3, "z", ["chambre_7", "salle_de_bain_7"]),
    porteF("couloir_chambre_8", -4.5, EC2, 1.4, "x", ["couloir", "chambre_8"]),
    porteF("couloir_chambre_9", -0.4, EC2, 1.4, "x", ["couloir", "chambre_9"]),
    porteF("couloir_lingerie", -15, EC1, 1.4, "x", ["couloir", "lingerie"]),
    porteF("couloir_chambre_11", -6, EC1, 1.4, "x", ["couloir", "chambre_11"]),
    porteF("couloir_office", -0.25, EC1, 1.4, "x", ["couloir", "office"]),
    porteF("balcon_chambre_8", BALCON_E.x, EZS, 1.4, "x", ["chambre_8", "dehors"]),
  ],
  fouille: vers([
    // Rez-de-chaussée
    { x: -2.9, z: -3.8, quoi: "comptoir de la réception : registre, passe-partout de l'hôtel, nécessaire de couture, stylos" },
    { x: -1.7, z: 0.4, quoi: "chariot à bagages : valises (vêtements, textiles, nécessaires de toilette), laiton" },
    { x: -7.6, z: -8.6, quoi: "cuisines : couteaux de chef, marmites, sauteuses, ustensiles, la bouteille de gaz du piano" },
    { x: -15.2, z: -10.9, quoi: "chambre froide : conserves (le trésor de l'hôtel), sacs de farine, sucre" },
    { x: -12.4, z: -10.9, quoi: "chambre froide : conserves de poisson, bocaux, un fût de vin" },
    { x: -10.3, z: -5.6, quoi: "desserte de la salle à manger : argenterie, nappes et serviettes (textiles), bougies" },
    { x: -11.2, z: -1.0, quoi: "robot-serveur ensablé : creuser (pelle ou mains), puis dévisser sa tête (tete_robot)" },
    { x: 11, z: -10.4, quoi: "camp de survivants : couvertures polaires, réchaud, bidon d'eau, un carnet (rumeurs)" },
    { x: 19.2, z: -0.8, quoi: "bar de la rotonde : bouteilles (alcool, désinfection), sucre, verres, siphons" },
    { x: -21, z: 19.4, quoi: "buvette : glacière (sodas éventés, sirops = sucre), sel en vrac, gobelets, la toile de l'auvent" },
    { x: 6, z: 28.6, quoi: "barque échouée : cordage, rame, bâche, petite ancre" },
    { x: 17, z: 27.5, quoi: "poste du maître-nageur : bouée, corde, trousse de secours, sifflet" },
    { x: 10, z: 16.4, quoi: "transats et parasols : toile rayée (textiles), bois, visserie" },
    { x: 26.3, z: 20.1, quoi: "panneau « Zéro-Effort » : la batterie au pied du panneau (batterie_panneau), la bâche imprimée" },
    { x: -6.2, z: 11.2, quoi: "guéridon renversé : son pied de fonte se démonte (pied_gueridon)" },
    { x: BALCON_TOMBE, z: 4.4, quoi: "balcon effondré : fer forgé (ferraille), moellons" },
    // Étage
    { x: -18.9, z: -17.0, quoi: "salle de bains de la suite : fil dentaire, savons, serviettes, peignoir, armoire à pharmacie" },
    { x: -10.8, z: -19.6, quoi: "salle de bains de la chambre 7 : savon, serviettes, fil dentaire, rasoir" },
    { x: 1.2, z: -16.5, quoi: "cabinet de toilette de la chambre 9 : savon, serviettes, brosse à dents (encore sous blister)" },
    { x: -3.4, z: -25.9, quoi: "chambre 11 : lavabo (savon, serviettes), valise oubliée (vêtements)" },
    { x: -14.6, z: -24.9, quoi: "lingerie : draps, serviettes, taies (textiles), fil et aiguilles ; LES COUVERTURES DE LAINE (couvertures_laine)" },
    { x: -15.6, z: -16.8, quoi: "suite : LA LANTERNE-TEMPÊTE sur le guéridon (lanterne_tempete), rideaux de velours, malle de voyage" },
    { x: 3.1, z: -24.4, quoi: "machinerie de l'ascenseur : LA BOÎTE DE ROULEMENTS et LE FER À SOUDER sur l'établi (roulements, fer_a_souder), câble, burettes d'huile" },
    { x: -3.0, z: -17.0, quoi: "chambre 8 : LES TÔLES ONDULÉES empilées (toles), on rapiéçait le toit ; outils, clous" },
    { x: 0, z: -25.6, quoi: "office d'étage : produits ménagers (chimie), chiffons, ampoules" },
  ]),
  eteints: vers([
    // Rez-de-chaussée et dehors
    { x: 9, z: 16.4, type: "dormeur (client du transat, devant la piscine)" },
    { x: 13, z: 16.4, type: "dormeur (cliente du transat, devant la piscine)" },
    { x: 18.6, z: 11.7, type: "dormeur (client du transat, au bord du bassin)" },
    { x: 9.5, z: 11.5, type: "Noyé (dans l'eau croupie de la piscine)" },
    { x: 13.8, z: 13.2, type: "Noyé (dans l'eau croupie de la piscine)" },
    { x: -13.6, z: -2.4, type: "Ensablé (à moitié sous la dune de la salle à manger, près du robot-serveur)" },
    { x: 2.6, z: 4.4, type: "ancien habitant (groom, calot rouge, sous la marquise)" },
    { x: 16.6, z: 28, type: "ancien habitant (maître-nageur, sifflet au cou)" },
    { x: -20.4, z: 19.8, type: "ancien habitant (marchand de glaces, dans la buvette)" },
    { x: -4, z: 9, type: "errant (entre les guéridons de la terrasse)" },
    { x: -3.3, z: -4.4, type: "ancien habitant (réceptionniste, derrière le comptoir)" },
    { x: -6.4, z: -10.2, type: "ancien habitant (cuisinier, toque et tablier)" },
    { x: 12.6, z: -3.6, type: "errant (dans le grand salon)" },
    { x: -6, z: 28, type: "errant (sur la plage)" },
    // Étage
    { x: -13.6, z: -17.6, type: "dormeur (le client de la suite, dans le lit à baldaquin)" },
    { x: -8.3, z: -16.8, type: "dormeur (chambre 7, dans son lit)" },
    { x: -8.0, z: -25.2, type: "dormeur (chambre 11, dans son lit)" },
    { x: -17.6, z: -24.2, type: "errant (la femme de chambre, entre les draps qui pendent)" },
  ]),
};

// ---------- Outils ----------

function repereMur(a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return { L: Math.hypot(dx, dz), ry: -Math.atan2(dz, dx), dx, dz };
}

/** [u1, u2] privé des intervalles `trous`. */
function soustraire(u1, u2, trous) {
  let res = [[u1, u2]];
  for (const [t1, t2] of trous) {
    res = res.flatMap(([p, q]) => {
      if (t2 <= p || t1 >= q) return [[p, q]];
      const o = [];
      if (t1 > p) o.push([p, t1]);
      if (t2 < q) o.push([t2, q]);
      return o;
    });
  }
  return res.filter(([p, q]) => q - p > 0.03);
}

/** Les ouvertures d'un mur ramenées à la tranche [p0, p1] (une fenêtre coupée devient un vide). */
function tranche(ouvertures, p0, p1) {
  return ouvertures
    .filter((o) => o.haut > p0 + 0.01 && o.bas < p1 - 0.01)
    .map((o) => {
      const entiere = o.bas >= p0 - 1e-6 && o.haut <= p1 + 1e-6;
      return { ...o, type: o.type === "fenetre" && entiere ? "fenetre" : "vide", bas: Math.max(0, o.bas - p0), haut: Math.min(p1 - p0 + 0.5, o.haut - p0) };
    });
}

/**
 * Un mur coupé : le bas (0 → `cut`) reste toujours visible, le haut va dans la couche `haut` (par défaut celle de
 * l'hôtel) qui s'efface. Les obstacles suivent les ouvertures qui descendent au sol (sauf `ferme`).
 */
function murCoupe(k, a, b, spec) {
  const { h, cut = CUT, ouvertures = [], breches = [], obstacles = true, haut = k.T, ...reste } = spec;
  if (cut > 0) mur(k.c, a, b, { ...reste, h: cut, ouvertures: tranche(ouvertures, 0, cut) });
  // Le haut d'un mur coupé s'efface avec sa couche : sans revêtement intérieur, et en enduit (les papiers peints et la
  // faïence restent dans le chantier du sol : autant d'appels de dessin en moins dans la couche).
  const enCouche = cut > 0 && haut !== k.c;
  const sansRevetement = enCouche ? { interieur: null, ...(reste.mat === k.m.papier || reste.mat === k.m.carrelage ? { mat: k.m.pele } : {}) } : {};
  if (h > cut) mur(cut > 0 ? haut : k.c, a, b, { ...reste, ...sansRevetement, y0: cut, h: h - cut, ouvertures: tranche(ouvertures, cut, h), breches });
  if (obstacles) {
    const { L, dx, dz } = repereMur(a, b);
    const trous = ouvertures.filter((o) => !o.ferme && o.bas < 0.5 && o.haut > 0.5).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
    for (const [u1, u2] of soustraire(0, L, trous)) k.b.obstacle(a[0] + (dx * u1) / L, a[1] + (dz * u1) / L, a[0] + (dx * u2) / L, a[1] + (dz * u2) / L);
  }
}

/** Des bandes en saillie sur la face extérieure (+z local) d'un mur : [{ y1, y2, s, couleur, mat, ch, trous, deborde }]. */
function bandes(a, b, ep, liste) {
  const { L, ry } = repereMur(a, b);
  for (const bd of liste) {
    const d = bd.deborde ?? 0;
    bd.ch.repere({ x: a[0], z: a[1], ry }, () => {
      for (const [u1, u2] of soustraire(-d, L + d, bd.trous ?? [])) bd.ch.pave(u1, bd.y1, ep / 2 - 0.02, u2, bd.y2, ep / 2 + bd.s, bd.couleur, bd.mat, { nuance: 0.03, crasse: bd.y1 < 1 });
    });
  }
}

/** Les sommets de l'arc de la rotonde (du côté de la façade sud vers le mur est, sens horaire vu du dessus). */
function sommetsRotonde(r = ROT.r) {
  const pts = [];
  for (let i = 0; i <= NROT; i++) {
    const t = A0 - ((A0 - A1 + Math.PI * 2) % (Math.PI * 2)) * (i / NROT);
    pts.push([ROT.x + Math.cos(t) * r, ROT.z + Math.sin(t) * r, t]);
  }
  return pts;
}

// ---------- Le bâtiment ----------

/** Le temps partagé par les matières animées (rideaux au vent). */
const uTemps = { value: 0 };

/** Les rideaux qui sortent des fenêtres et battent au vent : le bas de la toile ondule (déplacement dans le shader). */
function matiereRideau() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide, transparent: true, flatShading: true });
  m.userData.opacite = 1;
  m.userData.sansOmbre = true;
  m.onBeforeCompile = (s) => {
    s.uniforms.uTemps = uTemps;
    s.vertexShader = "uniform float uTemps;\n" + s.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      float souple = 1.0 - uv.y;
      souple *= souple;
      float ph = position.x * 1.7 + position.z * 1.3;
      vec3 dehors = normalize(normal);
      vec3 cote = normalize(cross(vec3(0.0, 1.0, 0.0), dehors) + vec3(1e-4));
      float rafale = 0.55 + 0.45 * sin(uTemps * 0.41 + ph * 0.13);
      transformed += dehors * souple * rafale * (0.6 + 0.4 * sin(uTemps * 1.9 + ph));
      transformed += cote * souple * rafale * 0.4 * sin(uTemps * 2.7 + ph * 1.4);
      transformed.y += souple * rafale * 0.35 * (0.5 + 0.5 * sin(uTemps * 1.9 + ph));`,
    );
  };
  m.customProgramCacheKey = () => "hotel-rideau-au-vent";
  return m;
}

export function creer({ usure = 0.7 } = {}) {
  const m = matieres();
  // Économie d'appels de dessin (un seul lot pour tout l'hôtel) : le marbre et la céramique prennent la finition
  // satinée, et depuis la 0.10 (R52 : de quoi poser les alentours et le panneau de sortie) le laiton, l'inox et la tôle
  // aussi. (matieres() est partagée : le mobilier suit.)
  m.lisse = m.satin;
  m.tole = m.satin;
  m.metal = m.satin;
  // 0.10 : au rez-de-chaussée, le bas des murs tapissés prend l'enduit qui pèle, comme leur haut (un appel de moins) ;
  // l'étage garde son papier peint.
  const papierPeint = m.papier;
  m.papier = m.pele;

  // ===== Le rez-de-chaussée et les dehors =====
  const b = new Batiment(1903, usure);
  // La couche qui s'efface : le haut des murs du rez-de-chaussée, les étages, le toit, l'enseigne, la rotonde.
  const T = b.couche("hotel", { x: (X0 + ROT.x + ROT.r) / 2, z: (Z0 + ROT.z + ROT.r) / 2, l: ROT.x + ROT.r - X0 + 0.6, p: ROT.z + ROT.r - Z0 + 0.6 }, CUT, 25.5);
  const k = {
    b, c: b.c, T, R: T, m, usure, bris: 0.3 + 0.6 * usure,
    rideaux: new Chantier(31), matRideau: matiereRideau(), objets: [],
  };

  sols(k);
  facadeSud(k);
  facadeEst(k);
  facadeNordOuest(k);
  rotonde(k);
  etages(k);
  toit(k);
  marquise(k);
  cloisons(k);
  terrasse(k);
  salleAManger(k);
  barRotonde(k);
  hall(k);
  piscine(k);
  promenade(k);
  buvette(k);
  plage(k);
  bords(k);
  salon(k);
  cuisines(k);
  aileOuest(k);
  panneauSortie(k);
  animations(k);

  // Les lumières de la nuit (8 au plus pour tout le lot : 6 en bas, 2 à l'étage)
  b.lumiere(1, 3.3, 4.3, 0xffc874, 4, 8, "photophore de survivants pendu sous la marquise");
  b.lumiere(-21, 1.3, 19.4, 0xffc070, 3, 6, "bougies dans un bocal, sur le comptoir de la buvette");
  b.lumiere(26.4, 3.2, 21.2, 0xfff0d8, 4, 9, "panneau « Zéro-Effort », rétroéclairé par son panneau solaire (s'éteint quand on prend sa batterie)");
  b.lumiere(11, 0.9, -11.1, 0xff8a3d, 12, 14, "feu de survivants dans la grande cheminée du salon");
  b.lumiere(4.4, 1.5, 0.9, 0x8fd8ff, 3, 5, "écran de la borne « Check-in par sourire » (seulement quand ecran_borne_allume est montré)");
  // 0.10 : le photophore des cuisines s'est éteint ; sa lumière va à la lanterne du panneau de sortie (8 au plus).
  const [lx, lz] = horsRepere(PANNEAU_EST, LANTERNE_EST.u, LANTERNE_EST.v);
  b.lumiere(lx, LANTERNE_EST.y, lz, 0xffcf8a, 6, 4.2, "lanterne du panneau de sortie");

  // Les rideaux au vent, fondus avec la couche de l'hôtel
  if (!k.rideaux.vide) b.ajouter(k.rideaux.construire());

  const rdc = b.construire();
  rdc.name = "rez_de_chaussee";
  const hotel = rdc.userData.toits.find((t) => t.nom === "hotel");
  hotel.materiaux.push(k.matRideau, ...k.fondusHotel);

  // ===== L'étage, posé au sol au nord de l'hôtel =====
  m.papier = papierPeint;
  const be = new Batiment(1907, usure);
  const ke = { b: be, c: be.c, m, usure, objets: [] };
  etage(ke);
  be.lumiere(-14.2, 1.0, -17.2, 0xffd8a0, 2.5, 6, "bougie sur le guéridon de la suite, près de la lanterne-tempête");
  be.lumiere(BALCON_E.x, 2.4, EZS + 0.2, 0xb8c8e0, 3, 8, "le clair de lune qui entre par le balcon effondré de la chambre 8");
  const et = be.construire();
  et.name = "etage";

  // ===== L'assemblage, recentré sur le lot =====
  const groupe = new THREE.Group();
  groupe.name = "grand-hotel";
  // ===== Les alentours (R52), rangés à part : ni dans le rez-de-chaussée, ni dans l'étage =====
  const autour = alentours(m, usure);
  autour.name = "alentours";

  for (const g of [rdc, et, autour]) {
    g.position.set(-CENTRE.x, 0, -CENTRE.z);
    g.userData.nom = g.name;
    groupe.add(g);
  }
  const deplacer = (s) => {
    s.x1 = Math.round((s.x1 - CENTRE.x) * 100) / 100;
    s.x2 = Math.round((s.x2 - CENTRE.x) * 100) / 100;
    s.z1 = Math.round((s.z1 - CENTRE.z) * 100) / 100;
    s.z2 = Math.round((s.z2 - CENTRE.z) * 100) / 100;
  };
  const toits = rdc.userData.toits;
  for (const t of toits) {
    t.boite = { ...t.boite, x: t.boite.x - CENTRE.x, z: t.boite.z - CENTRE.z };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - CENTRE.x, z: t.horsDe.z - CENTRE.z };
  }
  for (const [g, niveau] of [[rdc, "rez_de_chaussee"], [et, "etage"]]) {
    for (const s of g.userData.obstacles) {
      deplacer(s);
      s.niveau = niveau;
    }
    for (const l of g.userData.lumieres) {
      l.x = Math.round((l.x - CENTRE.x) * 100) / 100;
      l.z = Math.round((l.z - CENTRE.z) * 100) / 100;
      l.niveau = niveau;
    }
  }
  // Les toits ne sont décrits qu'une fois, sur le groupe du lieu (la règle d'effacement parcourt tout l'arbre).
  delete rdc.userData.toits;
  groupe.userData.toits = toits;
  groupe.userData.obstacles = [...rdc.userData.obstacles, ...et.userData.obstacles];
  groupe.userData.lumieres = [...rdc.userData.lumieres, ...et.userData.lumieres];

  // Les objets nommés (FICHE.objets) : l'état de départ est visible, l'autre caché.
  const objets = {};
  for (const o of [...k.objets, ...ke.objets]) objets[o.name] = o;
  objets.alentours = autour;
  for (const id of Object.keys(FICHE.objets)) if (!objets[id]) console.warn(`grand-hotel : l'objet « ${id} » manque`);
  objets.ecran_borne_allume.visible = false;
  groupe.userData.objets = objets;
  return groupe;
}

/** Un objet à part, nommé (une seule matière : un seul appel de dessin) : on le bâtit, puis on l'ajoute au niveau. */
function objetNomme(k, nom, graine, batir) {
  const ch = new Chantier(graine);
  batir(ch);
  const g = ch.construire();
  g.name = nom;
  g.userData.nom = nom;
  k.b.ajouter(g);
  k.objets.push(g);
  return g;
}

// ---------- Sols ----------

function sols(k) {
  const { c, m } = k;
  const sol = (x1, z1, x2, z2, mat, coul) => c.pave(x1, 0, z1, x2, 0.06, z2, coul, mat, { crasse: false, nuance: 0 });
  // Le rez-de-chaussée, pièce par pièce
  // hall : marbre noir et blanc. 0.10 : le damier est peint dans l'atlas (4 × 6 dalles de 2,4 m), sur une dalle de pierre
  // (un appel de dessin de moins que sa matière à part)
  sol(-3.8, Z0, 5.8, ZS, m.dalle, 0xd9d2c4);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) {
    panneau(c, m.enseignes, R.damier, { x: -3.8 + (i + 0.5) * 2.4, y: 0.062, z: Z0 + (j + 0.5) * (14 / 6), rx: -Math.PI / 2 }, 2.4, 14 / 6);
  }
  sol(5.8, Z0, X1, ZS, m.parquet, 0xb59a78); // grand salon
  sol(-16.6, -6, -3.8, ZS, m.parquet, 0xa98e6c); // salle à manger
  sol(X0, Z0, -16.6, ZS, m.parquet, 0x9a8466); // l'aile ouest effondrée
  sol(-16.6, Z0, -3.8, -6, m.carrelage, 0xd8d4c8); // cuisines
  // Le parquet de la rotonde (un disque)
  const disque = new THREE.CircleGeometry(ROT.r, 18).rotateX(-Math.PI / 2);
  c.poser(disque, m.parquet, 0xb59a78, { x: ROT.x, y: 0.062, z: ROT.z }, { crasse: false, nuance: 0 });
  disque.dispose();
  // Le soubassement de pierre du palace (socle qui dépasse un peu)
  c.pave(X0 - 0.35, 0, Z0 - 0.35, X1 + 0.35, 0.05, ZS + 0.35, COUL.dalleGrise, m.dalle, { crasse: false, nuance: 0 });

  // La terrasse dallée, percée de la piscine (x 4 → 16, z 9 → 15), et la cour de service à l'est de la rotonde
  const dalle = (x1, z1, x2, z2, coul = COUL.dalle) => c.pave(x1, -0.02, z1, x2, 0.04, z2, coul, m.dalle, { crasse: false, nuance: 0 });
  dalle(-33, ZS, 31, 9);
  dalle(X1, -4.6, 31, ZS, COUL.dalleGrise);
  dalle(-33, 9, 4, 15);
  dalle(16, 9, 31, 15);
  dalle(-33, 15, 31, 18);
  // La promenade, un ton plus gris
  dalle(-33, 18, 31, 22, COUL.dalleGrise);
  // La plage, et le sable mouillé au bord de l'eau
  c.pave(-33, -0.03, 22, 31, 0.02, 31, COUL.sable, m.sable, { crasse: false, nuance: 0 });
  c.pave(-33, -0.03, 31, 31, 0.015, MER.bord + 0.6, COUL.sableMouille, m.sable, { crasse: false, nuance: 0 });
  // Le fond du lot (solPropre) : les pavés sombres de la rue de derrière et des cours, sous tout le reste, percé à la
  // place de la piscine
  const fond = (x1, z1, x2, z2) => c.pave(x1, -0.09, z1, x2, -0.03, z2, 0x6a655c, m.dalle, { crasse: false, nuance: 0 });
  fond(-33, -28, 31, 8.6);
  fond(-33, 15.4, 31, 38);
  fond(-33, 8.6, 3.6, 15.4);
  fond(16.4, 8.6, 31, 15.4);
  // La mer (R0-3) : l'eau claire où l'on marche, la ligne de brisants, le large ; peinte dans l'atlas (la même matière
  // que celle des alentours), l'écume animée la fait vivre
  mer(c, m, -33, 31, 38);
}

/** Les bandes de la mer (repère H) : la couleur de chacune, de la plage vers le large. */
const BANDES_MER = [
  [MER.bord, MER.bord + 1.5, 0x8fcbbd], // l'eau claire, turquoise, sur le sable (jusqu'aux chevilles)
  [MER.bord + 1.5, MER.brisants - 0.3, 0x63aeab], // jusqu'aux genoux
  [MER.brisants - 0.3, MER.brisants + 0.3, 0xe6efe9], // la ligne de brisants, l'écume blanche
  [MER.brisants + 0.3, MER.brisants + 1.6, 0x3d7c84], // on perd pied
];

/**
 * La mer, de x1 à x2, du bord de l'eau jusqu'à `zFin` (les bandes, puis l'eau profonde) : des carreaux de l'atlas
 * (rides peintes, teintées par la couleur des sommets), une seule matière dans le lot et dans les alentours.
 */
function mer(ch, m, x1, x2, zFin) {
  const carreaux = (za, zb, coul, pas = 8) => {
    const n = Math.max(1, Math.round((x2 - x1) / pas));
    const l = (x2 - x1) / n;
    for (let i = 0; i < n; i++) panneau(ch, m.enseignes, R.mer, { x: x1 + (i + 0.5) * l, y: 0.04, z: (za + zb) / 2, rx: -Math.PI / 2 }, l + 0.01, zb - za + 0.01, coul);
  };
  for (const [za, zb, coul] of BANDES_MER) if (za < zFin) carreaux(za, Math.min(zb, zFin), coul);
  const z0 = BANDES_MER[BANDES_MER.length - 1][1];
  if (zFin > z0) carreaux(z0, zFin, 0x2f6874, 12);
}

// ---------- Les façades ----------

const optRdc = (k, ex = {}) => ({ croisillons: 1, traverses: 4, appui: false, cadre: 0xe9e1cd, matCadre: k.m.mat, verre: k.m.verre, bris: k.bris, ...ex });

function facadeSud(k) {
  const { c, T, m, usure } = k;
  const a = [X0, ZS];
  const bb = [XS1, ZS];
  const L = XS1 - X0;
  const u = (x) => x - X0;
  const fen = (x, ex = {}) => ({ u: u(x), l: 1.7, bas: 0.9, haut: 3.9, type: "fenetre", ...optRdc(k), ...ex });
  const vide = (x, l = 1.7) => ({ u: u(x), l, bas: 0, haut: 3.9, type: "vide" });
  const rdc = [
    fen(-27.8, { bris: 1 }), fen(-24.6, { bris: 1 }), fen(-21.4), fen(-18.2),
    vide(-15), vide(-11.8), fen(-8.6, { bas: CUT, bris: 1 }), fen(-5.4, { bas: CUT }),
    fen(-2.2), vide(1, 2.6), fen(4.2), fen(7.4, { bas: CUT }), fen(10.6, { bas: CUT }),
  ];
  murCoupe(k, a, bb, { h: RDC, ep: EP, couleur: COUL.creme, mat: m.pele, ouvertures: rdc, interieur: { couleur: COUL.papier, mat: m.papier } });

  // Les étages : trois rangs de hautes fenêtres
  for (let e = 0; e < 3; e++) {
    const y0 = RDC + e * ET;
    const bas = e === 1 ? 0.55 : 0.12;
    const ouv = BAIES.map((x) => ({ u: u(x), l: 1.4, bas, haut: 2.75, type: "vide" }));
    mur(T, a, bb, { h: ET, y0, ep: EP, couleur: COUL.creme, mat: m.pele, ouvertures: ouv });
    for (const x of BAIES) fenAtlas(k, T, { x, y: y0 + bas, z: ZS + EP / 2 }, 1.4, 2.75 - bas, e === 1);
  }

  // Modénature : soubassement, bandeaux, corniche à modillons, pilastres, clés d'arc
  const trousBas = [[u(-15) - 0.85, u(-15) + 0.85], [u(-11.8) - 0.85, u(-11.8) + 0.85], [u(1) - 1.3, u(1) + 1.3]];
  bandes(a, bb, EP, [
    { y1: 0, y2: 0.7, s: 0.08, couleur: COUL.soubassement, mat: m.pele, ch: c, trous: trousBas, deborde: 0.08 },
    { y1: RDC - 0.4, y2: RDC + 0.12, s: 0.24, couleur: COUL.modenature, mat: m.pele, ch: T, deborde: 0.2 },
    { y1: RDC + ET - 0.06, y2: RDC + ET + 0.1, s: 0.1, couleur: COUL.modenature, mat: m.pele, ch: T },
    { y1: RDC + 2 * ET - 0.06, y2: RDC + 2 * ET + 0.1, s: 0.1, couleur: COUL.modenature, mat: m.pele, ch: T },
    { y1: CORN - 0.6, y2: CORN - 0.25, s: 0.22, couleur: COUL.modenature, mat: m.pele, ch: T, deborde: 0.2 },
    { y1: CORN - 0.25, y2: CORN, s: 0.6, couleur: COUL.modenature, mat: m.pele, ch: T, deborde: 0.6 },
  ]);
  for (let x = X0 + 0.3; x < XS1; x += 1.25) T.boite(0.14, 0.3, 0.42, COUL.modenature, { x, y: CORN - 0.4, z: ZS + EP / 2 + 0.2 }, m.pele, { crasse: false });
  // Pilastres entre les travées, sur toute la hauteur
  const pil = [X0 + 0.35, ...BAIES.slice(0, -1).map((x) => x + 1.6)];
  for (const x of pil) {
    if (Math.abs(x - 2.6) < 0.1 || Math.abs(x + 0.6) < 0.1) continue; // la porte : pas de pilastre au droit de la marquise
    c.pave(x - 0.24, 0, ZS + EP / 2 - 0.02, x + 0.24, CUT, ZS + EP / 2 + 0.12, COUL.soubassement, m.pele, { nuance: 0.02 });
    T.pave(x - 0.24, CUT, ZS + EP / 2 - 0.02, x + 0.24, CORN - 0.6, ZS + EP / 2 + 0.12, COUL.modenature, m.pele, { nuance: 0.02, crasse: false });
  }
  // Clés d'arc au-dessus des fenêtres
  for (const x of BAIES) {
    T.boite(0.36, 0.5, 0.16, COUL.modenature, { x, y: 4.05, z: ZS + EP / 2 + 0.04 }, m.pele, { crasse: false });
    for (let e = 0; e < 3; e++) T.boite(0.26, 0.32, 0.12, COUL.modenature, { x, y: RDC + e * ET + 2.92, z: ZS + EP / 2 + 0.03 }, m.pele, { crasse: false });
  }
  // La frise gravée au-dessus de la porte
  panneau(T, m.enseignes, R.frise, { x: 1, y: 4.32, z: ZS + EP / 2 + 0.1 }, 3.6, 0.34);

  // Balcons du premier étage (un par travée) ; celui de la travée -11,8 s'est effondré
  for (const x of BAIES) {
    if (x === BALCON_TOMBE) continue;
    balcon(T, m, x, RDC + 0.12, ZS + EP / 2, x === 1 ? 3.2 : 2.0, 0.85, x === 4.2 && usure > 0.5);
  }
  {
    // Il reste une console et le départ de la dalle ; le reste est sur la dune
    T.pave(BALCON_TOMBE - 0.8, RDC - 0.5, ZS + EP / 2, BALCON_TOMBE - 0.6, RDC - 0.04, ZS + EP / 2 + 0.6, COUL.modenature, m.pele);
    T.boite(0.9, 0.16, 0.7, COUL.modenature, { x: BALCON_TOMBE - 0.6, y: RDC - 0.25, z: ZS + EP / 2 + 0.3, rz: 0.7, rx: 0.15 }, m.pele);
    panneau(T, m.enseignes, R.balconTordu, { x: BALCON_TOMBE - 0.9, y: RDC - 0.6, z: ZS + EP / 2 + 0.35, rz: 1.2, ry: 0.3 }, 1.4, 0.8, 0xffffff);
  }
  // Le balcon filant du troisième étage, sur les travées du centre
  balcon(T, m, -0.8, RDC + 2 * ET + 0.12, ZS + EP / 2, 19.6, 0.7, false);
  // Garde-corps bas des fenêtres du deuxième étage
  for (const x of BAIES) panneau(T, m.enseignes, R.balcon, { x, y: RDC + ET + 0.32, z: ZS + EP / 2 + 0.06 }, 1.4, 0.55);

  // Persiennes, rideaux au vent
  for (let e = 0; e < 3; e++) for (const x of BAIES) persiennes(k, x, RDC + e * ET + 0.12, ZS + EP / 2 + 0.035, 1.4, 2.6);
  const rng = aleatoire(19);
  for (let e = 0; e < 3; e++) for (const x of BAIES) {
    if (rng() > 0.2 + 0.15 * usure) continue;
    rideauDehors(k, x, RDC + e * ET + 2.6, ZS + EP / 2 + 0.06, 0, rng);
  }

  // Les fenêtres de l'aile ouest effondrée, condamnées par des planches : « FERMÉ POUR LA SAISON »
  for (const x of [-27.8, -24.6, -21.4, -18.2]) {
    for (let i = 0; i < 4; i++) c.boite(2.1, 0.22, 0.05, PALETTE.boisGris, { x, y: 1.25 + i * 0.6, z: ZS + EP / 2 + 0.06, rz: (i % 2 ? 1 : -1) * 0.05 }, m.mat, { nuance: 0.08 });
  }
  panneau(c, m.enseignes, R.graffiti, { x: -26.2, y: 2.4, z: ZS + EP / 2 + 0.1, rz: -0.03 }, 4.2, 1.3);

  // Coulures et lierre au pied, mousse sur la corniche
  lierre(c, X0 + 1.2, 0, ZS + EP / 2 + 0.05, 0, 2.4, 3.2, Math.round(60 + 80 * usure));
  lierre(T, 9.0, RDC, ZS + EP / 2 + 0.05, 0, 2.0, 4.0, Math.round(30 + 50 * usure));
  mousse(T, -6, CORN + 0.02, ZS + 0.4, 1.2, Math.round(3 + 5 * usure));
  void L;
}

/** Une fenêtre d'étage peinte (atlas) au fond de son tableau, avec son appui ; pose dans le repère du chantier. */
function fenAtlas(k, ch, pose, l, h, appui = true) {
  const r = ch.hasard();
  const casse = 0.15 + 0.5 * k.usure;
  const reg = r < casse * 0.55 ? R.fenB : r < casse * 0.8 ? R.fenD : r < casse ? R.fenC : R.fenA;
  ch.repere(pose, () => {
    panneau(ch, k.m.enseignes, reg, { y: h / 2, z: -0.15 }, l, h);
    if (appui) ch.boite(l + 0.24, 0.08, 0.32, COUL.modenature, { y: -0.04, z: 0.02 }, k.m.pele, { crasse: false });
  });
}

/** Un balcon sur consoles : dalle, consoles, garde-corps en fer forgé (atlas), main courante. */
function balcon(ch, m, x, y, z0, l, p, tordu = false) {
  ch.pave(x - l / 2, y - 0.16, z0 - 0.02, x + l / 2, y, z0 + p, COUL.modenature, m.pele, { nuance: 0.03, crasse: false });
  ch.pave(x - l / 2 - 0.04, y - 0.22, z0 + p - 0.06, x + l / 2 + 0.04, y - 0.16, z0 + p + 0.04, COUL.modenature, m.pele, { crasse: false });
  const nc = Math.max(2, Math.round(l / 2.2) + 1);
  for (let i = 0; i < nc; i++) {
    const cx = x - l / 2 + 0.25 + (i * (l - 0.5)) / (nc - 1);
    ch.pave(cx - 0.09, y - 0.62, z0, cx + 0.09, y - 0.16, z0 + p * 0.75, COUL.modenature, m.pele, { crasse: false });
  }
  const n = Math.max(1, Math.round(l / 2));
  for (let i = 0; i < n; i++) panneau(ch, m.enseignes, tordu && i === 0 ? R.balconTordu : R.balcon, { x: x - l / 2 + (i + 0.5) * (l / n), y: y + 0.47, z: z0 + p - 0.05 }, l / n, 0.92);
  for (const s of [-1, 1]) panneau(ch, m.enseignes, R.balcon, { x: x + s * (l / 2 - 0.03), y: y + 0.47, z: z0 + p / 2, ry: Math.PI / 2 }, p, 0.92);
  ch.pave(x - l / 2, y + 0.92, z0 + p - 0.08, x + l / 2, y + 0.97, z0 + p - 0.02, COUL.fer, m.tole, { crasse: false });
}

/**
 * Les persiennes d'une fenêtre de la façade sud (repère H : façade à z = `z`) : ouvertes à plat, fermées, l'une
 * pendue de travers, une manquante ; `battante` : la persienne de droite est animée (elle bat au vent).
 */
function persiennes(k, x, y0, z, l, h, battante = false) {
  const { T, m } = k;
  const r = T.hasard();
  const lv = l / 2 + 0.02;
  const reg = T.hasard() < 0.5 ? R.persienne : R.persienneB;
  const yc = y0 + h / 2;
  if (r < 0.14 && !battante) {
    // fermées (l'une entrebâillée)
    panneau(T, m.enseignes, reg, { x: x - lv / 2, y: yc, z: z + 0.03 }, lv, h);
    panneau(T, m.enseignes, reg, { x: x + lv / 2 + 0.05, y: yc, z: z + 0.12, ry: -0.35 }, lv, h);
    return;
  }
  for (const s of [-1, 1]) {
    if (battante && s === 1) {
      k.volet = { x: x + l / 2 + 0.02, y: yc, z: z + 0.02, lv, h, reg };
      continue;
    }
    const q = T.hasard();
    if (q < 0.12 + 0.12 * k.usure) continue; // tombée
    const pendue = q > 0.86 - 0.1 * k.usure;
    panneau(T, m.enseignes, reg, pendue ? { x: x + s * (l / 2 + lv / 2 + 0.05), y: yc - 0.3, z: z + 0.1, rz: s * 0.38, ry: s * 0.25 } : { x: x + s * (l / 2 + lv / 2 + 0.03), y: yc, z: z + 0.01 }, lv, h);
  }
}

/** Un rideau qui sort par la fenêtre et pend le long de la façade (le vent le soulève : voir matiereRideau). */
function rideauDehors(k, x, ytop, z, ry, rng) {
  const tons = [0xe8dcc0, 0xd7b5a5, 0xc3cfd3, 0xe1d3b8, 0xb98a7e];
  const n = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < n; i++) {
    const lg = 1.4 + rng() * 2.4;
    const w = 0.45 + rng() * 0.3;
    const g = new THREE.PlaneGeometry(w, lg, 1, 6);
    k.rideaux.poser(g, k.matRideau, tons[Math.floor(rng() * tons.length)], { x: x + (i ? 0.35 : -0.3) + (rng() - 0.5) * 0.2, y: ytop - lg / 2, z: z + i * 0.03, ry }, { crasse: false, nuance: 0.08 });
    g.dispose();
  }
}

function facadeEst(k) {
  const { T, m } = k;
  const a = [X1, ZE1];
  const bb = [X1, Z0];
  const L = ZE1 - Z0;
  const u = (z) => ZE1 - z;
  const baies = [-6.6, -9.9];
  murCoupe(k, a, bb, { h: RDC, ep: EP, couleur: COUL.creme, mat: m.pele, ouvertures: baies.map((z) => ({ u: u(z), l: 1.7, bas: 0.9, haut: 3.9, type: "fenetre", ...optRdc(k) })), interieur: { couleur: COUL.papier, mat: m.papier } });
  for (let e = 0; e < 3; e++) {
    const bas = e === 1 ? 0.55 : 0.12;
    mur(T, a, bb, { h: ET, y0: RDC + e * ET, ep: EP, couleur: COUL.creme, mat: m.pele, ouvertures: baies.map((z) => ({ u: u(z), l: 1.4, bas, haut: 2.75, type: "vide" })) });
    for (const z of baies) fenAtlas(k, T, { x: X1 + EP / 2, y: RDC + e * ET + bas, z, ry: Math.PI / 2 }, 1.4, 2.75 - bas, e === 1);
  }
  bandes(a, bb, EP, [
    { y1: 0, y2: 0.7, s: 0.08, couleur: COUL.soubassement, mat: m.pele, ch: k.c },
    { y1: RDC - 0.4, y2: RDC + 0.12, s: 0.24, couleur: COUL.modenature, mat: m.pele, ch: T, deborde: 0.2 },
    { y1: RDC + ET - 0.06, y2: RDC + ET + 0.1, s: 0.1, couleur: COUL.modenature, mat: m.pele, ch: T },
    { y1: RDC + 2 * ET - 0.06, y2: RDC + 2 * ET + 0.1, s: 0.1, couleur: COUL.modenature, mat: m.pele, ch: T },
    { y1: CORN - 0.6, y2: CORN - 0.25, s: 0.22, couleur: COUL.modenature, mat: m.pele, ch: T, deborde: 0.2 },
    { y1: CORN - 0.25, y2: CORN, s: 0.6, couleur: COUL.modenature, mat: m.pele, ch: T, deborde: 0.6 },
  ]);
  for (let z = ZE1 - 0.4; z > Z0; z -= 0.75) T.boite(0.42, 0.3, 0.14, COUL.modenature, { x: X1 + EP / 2 + 0.2, y: CORN - 0.4, z }, m.pele, { crasse: false });
  for (const z of [Z0 + 0.35, -8.25]) T.pave(X1 + EP / 2 - 0.02, CUT, z - 0.24, X1 + EP / 2 + 0.12, CORN - 0.6, z + 0.24, COUL.modenature, m.pele, { crasse: false });
  for (const z of baies) for (let e = 0; e < 3; e++) {
    persiennesEst(k, z, RDC + e * ET + 0.12);
  }
  // Une descente d'eau en zinc, cassée à mi-hauteur
  const zz = Z0 + 0.9;
  T.tube([X1 + EP / 2 + 0.12, CORN * 0.5, zz], [X1 + EP / 2 + 0.12, CORN, zz], 0.07, COUL.zinc, m.tole, 6);
  k.c.tube([X1 + EP / 2 + 0.12, 0.1, zz], [X1 + EP / 2 + 0.12, 0.7, zz], 0.07, COUL.zinc, m.tole, 6);
  void L;
}

/** Les persiennes du mur est (face +x). */
function persiennesEst(k, z, y0) {
  const { T, m } = k;
  const lv = 0.72;
  const h = 2.6;
  for (const s of [-1, 1]) {
    if (T.hasard() < 0.2) continue;
    panneau(T, m.enseignes, R.persienne, { x: X1 + EP / 2 + 0.04, y: y0 + h / 2, z: z + s * (0.7 + lv / 2 + 0.03), ry: Math.PI / 2 }, lv, h);
  }
}

function facadeNordOuest(k) {
  const { c, T, m } = k;
  // Façade nord (rue de derrière), de l'est vers l'ouest : pleine hauteur, elle ne cache rien vue du sud-est.
  const papier = { couleur: COUL.papier, mat: m.papier };
  const faience = { couleur: COUL.faience, mat: m.carrelage };
  const fenN = (x) => ({ u: X1 - x, l: 1.4, bas: 1.2, haut: 3.7, type: "vide", peinte: x });
  const morceaux = [
    [X1, 5.8, papier, [fenN(14), fenN(7.4)]],
    [5.8, -3.8, papier, [fenN(-2.2), fenN(4.2)]],
    [-3.8, -16.6, faience, [fenN(-5.4)]], // la porte de service des cuisines est murée
    [-16.6, -26.2, { couleur: COUL.cremeOmbre, mat: m.pele }, [fenN(-18.2), fenN(-21.4)]],
    [-26.2, X0, faience, [fenN(-28.1)]],
  ];
  for (const [, , , ouv] of morceaux) for (const o of ouv) if (o.peinte !== undefined) fenAtlas(k, c, { x: o.peinte, y: 1.2, z: Z0 - EP / 2, ry: Math.PI }, 1.4, 2.5);
  for (const [x1, x2, int, ouv] of morceaux) {
    murCoupe(k, [x1, Z0], [x2, Z0], { h: RDC, cut: 0, ep: EP, couleur: COUL.cremeOmbre, mat: m.pele, ouvertures: ouv.map((o) => ({ ...o, u: o.u - (X1 - x1) })), interieur: int });
  }
  // Pignon ouest
  const fenO = (z) => ({ u: z - Z0, l: 1.4, bas: 1.0, haut: 3.7, type: "vide" });
  for (const z of [-9, -2.5]) fenAtlas(k, c, { x: X0 - EP / 2, y: 1.0, z, ry: -Math.PI / 2 }, 1.4, 2.7);
  murCoupe(k, [X0, Z0], [X0, -6], { h: RDC, cut: 0, ep: EP, couleur: COUL.cremeOmbre, mat: m.pele, ouvertures: [fenO(-9)], interieur: faience });
  murCoupe(k, [X0, -6], [X0, ZS], { h: RDC, cut: 0, ep: EP, couleur: COUL.cremeOmbre, mat: m.pele, ouvertures: [{ ...fenO(-2.5), u: 3.5 }], interieur: papier });
  // Les étages (plus simples : on ne les voit pas de la caméra)
  for (let e = 0; e < 3; e++) {
    const y0 = RDC + e * ET;
    mur(T, [X1, Z0], [X0, Z0], { h: ET, y0, ep: EP, couleur: COUL.cremeOmbre, mat: m.pele, ouvertures: [] });
    mur(T, [X0, Z0], [X0, ZS], { h: ET, y0, ep: EP, couleur: COUL.cremeOmbre, mat: m.pele, ouvertures: [3, 7, 11].map((uu) => ({ u: uu, l: 1.3, bas: 0.3, haut: 2.6, type: "vide" })) });
    for (const uu of [3, 7, 11]) fenAtlas(k, T, { x: X0 - EP / 2, y: y0 + 0.3, z: Z0 + uu, ry: -Math.PI / 2 }, 1.3, 2.3);
  }
  bandes([X0, Z0], [X0, ZS], EP, [
    { y1: 0, y2: 0.7, s: 0.08, couleur: COUL.soubassement, mat: m.pele, ch: c },
    { y1: RDC - 0.4, y2: RDC + 0.12, s: 0.24, couleur: COUL.modenature, mat: m.pele, ch: T, deborde: 0.2 },
    { y1: CORN - 0.25, y2: CORN, s: 0.6, couleur: COUL.modenature, mat: m.pele, ch: T, deborde: 0.6 },
  ]);
  lierre(c, X0 - EP / 2 - 0.05, 0, -3, -Math.PI / 2, 5, 6, Math.round(70 + 100 * k.usure));
}

// ---------- La rotonde ----------

function rotonde(k) {
  const { c, R: Rc, m, usure } = k;
  const pts = sommetsRotonde();
  const papier = { couleur: COUL.papier, mat: m.papier };
  for (let i = 0; i < NROT; i++) {
    const a = [pts[i][0], pts[i][1]];
    const bb = [pts[i + 1][0], pts[i + 1][1]];
    const { L } = repereMur(a, bb);
    const mid = L / 2;
    // rez-de-chaussée : portes-fenêtres sur la terrasse, le mur du fond du bar (6, 7) est plein
    let ouv = [];
    if (i === 2) ouv = [{ u: mid, l: 1.6, bas: 0, haut: 3.7, type: "vide" }];
    else if (i === 3) ouv = [{ u: mid, l: 1.6, bas: 0, haut: 3.7, type: "vide" }];
    else if (i === 1 || i === 4) ouv = [{ u: mid, l: 1.6, bas: CUT, haut: 3.7, type: "fenetre", ...optRdc(k) }];
    else if (i === 0 || i === 5 || i === 8) ouv = [{ u: mid, l: 1.5, bas: 0.95, haut: 3.7, type: "fenetre", ...optRdc(k) }];
    murCoupe(k, a, bb, { h: RDC, ep: EP, couleur: COUL.creme, mat: m.pele, ouvertures: ouv, interieur: papier, haut: Rc });
    for (let e = 0; e < 3; e++) {
      const bas = e === 1 ? 0.55 : 0.12;
      mur(Rc, a, bb, { h: ET, y0: RDC + e * ET, ep: EP, couleur: COUL.creme, mat: m.pele, ouvertures: [{ u: mid, l: 1.3, bas, haut: 2.75, type: "vide" }] });
      const { ry: ryS } = repereMur(a, bb);
      Rc.repere({ x: a[0], z: a[1], ry: ryS }, () => fenAtlas({ ...k, T: Rc }, Rc, { x: mid, y: RDC + e * ET + bas, z: EP / 2 }, 1.3, 2.75 - bas, e === 1));
    }
    // Le balcon filant du premier étage, et les persiennes
    const { ry } = repereMur(a, bb);
    Rc.repere({ x: a[0], z: a[1], ry }, () => {
      Rc.pave(-0.02, RDC - 0.04, EP / 2 - 0.02, L + 0.02, RDC + 0.12, EP / 2 + 0.8, COUL.modenature, m.pele, { crasse: false });
      Rc.pave(mid - 0.09, RDC - 0.55, EP / 2, mid + 0.09, RDC - 0.04, EP / 2 + 0.6, COUL.modenature, m.pele, { crasse: false });
      panneau(Rc, m.enseignes, i === 4 && usure > 0.5 ? R.balconTordu : R.balcon, { x: mid, y: RDC + 0.58, z: EP / 2 + 0.76 }, L + 0.1, 0.92);
      for (let e = 0; e < 3; e++) {
        for (const s of [-1, 1]) {
          if (Rc.hasard() < 0.3) continue;
          panneau(Rc, m.enseignes, Rc.hasard() < 0.5 ? R.persienne : R.persienneB, { x: mid + s * 1.03, y: RDC + e * ET + 1.42, z: EP / 2 + 0.035 }, 0.66, 2.6);
        }
      }
      // pilastre à chaque sommet
      Rc.pave(-0.2, CUT, EP / 2 - 0.02, 0.2, CORN - 0.6, EP / 2 + 0.12, COUL.modenature, m.pele, { crasse: false });
      c.pave(-0.2, 0, EP / 2 - 0.02, 0.2, CUT, EP / 2 + 0.12, COUL.soubassement, m.pele);
      c.pave(0, 0, EP / 2 - 0.02, L, 0.7, EP / 2 + 0.08, COUL.soubassement, m.pele, { crasse: true });
    });
  }
  // Bandeaux et corniche en anneaux (le côté pris dans le corps principal est caché par ses murs)
  const anneau = (y, h, r1, r2, ch = Rc) => ch.poser(cylindre(r1, r2, h, 16, false), m.pele, COUL.modenature, { x: ROT.x, y: y + h / 2, z: ROT.z }, { crasse: false, nuance: 0 });
  anneau(RDC - 0.4, 0.52, ROT.r + EP / 2 + 0.24, ROT.r + EP / 2 + 0.24);
  anneau(RDC + ET - 0.06, 0.16, ROT.r + EP / 2 + 0.1, ROT.r + EP / 2 + 0.1);
  anneau(RDC + 2 * ET - 0.06, 0.16, ROT.r + EP / 2 + 0.1, ROT.r + EP / 2 + 0.1);
  anneau(CORN - 0.6, 0.35, ROT.r + EP / 2 + 0.22, ROT.r + EP / 2 + 0.22);
  anneau(CORN - 0.25, 0.25, ROT.r + EP / 2 + 0.6, ROT.r + EP / 2 + 0.6);
  // Le tambour de l'attique, percé d'oculi
  const ya = CORN;
  Rc.poser(cylindre(ROT.r - 0.1, ROT.r - 0.1, 2.4, 16, false), m.pele, COUL.creme, { x: ROT.x, y: ya + 1.2, z: ROT.z }, { crasse: false, nuance: 0 });
  Rc.poser(cylindre(ROT.r + 0.15, ROT.r + 0.15, 0.3, 16, false), m.pele, COUL.modenature, { x: ROT.x, y: ya + 2.4, z: ROT.z }, { crasse: false, nuance: 0 });
  for (let i = 0; i < 8; i++) {
    const t = -Math.PI / 2 + (i / 8) * Math.PI * 2 + 0.2;
    const ox = ROT.x + Math.cos(t) * (ROT.r - 0.05);
    const oz = ROT.z + Math.sin(t) * (ROT.r - 0.05);
    const g = new THREE.CircleGeometry(0.45, 8);
    Rc.poser(g, m.mat, COUL.sombre, { x: ox, y: ya + 1.2, z: oz, ry: Math.PI / 2 - t }, { crasse: false, nuance: 0 });
    g.dispose();
  }
  // La coupole impériale en zinc vert-de-gris, ses côtes, quelques feuilles de zinc arrachées
  const yd = ya + 2.55;
  const profil = [[5.25, 0], [5.25, 0.35], [5.0, 1.3], [4.4, 2.35], [3.4, 3.25], [2.1, 3.9], [1.0, 4.2], [0.62, 4.3]].map(([r, y]) => new THREE.Vector2(r, y));
  const coupole = new THREE.LatheGeometry(profil, 16);
  Rc.poser(coupole, m.tole, COUL.zincVert, { x: ROT.x, y: yd, z: ROT.z }, { crasse: false, nuance: 0 });
  coupole.dispose();
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2;
    for (let j = 0; j < profil.length - 1; j += 2) {
      const p = profil[j];
      const q = profil[Math.min(j + 2, profil.length - 1)];
      Rc.poutre([ROT.x + Math.cos(t) * (p.x + 0.05), yd + p.y, ROT.z + Math.sin(t) * (p.x + 0.05)], [ROT.x + Math.cos(t) * (q.x + 0.05), yd + q.y, ROT.z + Math.sin(t) * (q.x + 0.05)], 0.09, COUL.zincVertSombre, m.tole);
    }
  }
  // Le lanternon et son épi
  const yl = yd + 4.3;
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * Math.PI * 2;
    Rc.tube([ROT.x + Math.cos(t) * 0.55, yl, ROT.z + Math.sin(t) * 0.55], [ROT.x + Math.cos(t) * 0.55, yl + 1.1, ROT.z + Math.sin(t) * 0.55], 0.06, COUL.modenature, m.pele, 4);
  }
  Rc.poser(cylindre(0.4, 0.4, 1.0, 6), m.mat, COUL.sombre, { x: ROT.x, y: yl + 0.55, z: ROT.z }, { crasse: false });
  Rc.poser(cylindre(0.8, 0.8, 0.15, 10), m.tole, COUL.zincVertSombre, { x: ROT.x, y: yl + 1.15, z: ROT.z }, { crasse: false });
  Rc.poser(new THREE.ConeGeometry(0.75, 0.9, 10), m.tole, COUL.zincVert, { x: ROT.x, y: yl + 1.65, z: ROT.z }, { crasse: false });
  Rc.tube([ROT.x, yl + 2.0, ROT.z], [ROT.x + 0.15, yl + 3.2, ROT.z], 0.035, COUL.ferRouille, m.tole, 4);
  Rc.poser(new THREE.IcosahedronGeometry(0.12, 0), m.tole, COUL.laiton, { x: ROT.x + 0.08, y: yl + 2.6, z: ROT.z });
  mousse(Rc, ROT.x + 2, yd + 1.2, ROT.z + 3.5, 0.8, Math.round(2 + 4 * usure), 0x4f6a3a);
  // Les planchers et l'intérieur sombre des étages de la rotonde
  for (const y of [RDC, RDC + ET, RDC + 2 * ET, CORN]) Rc.poser(cylindre(ROT.r - 0.2, ROT.r - 0.2, 0.3, 14), m.mat, y === RDC ? COUL.cremeOmbre : COUL.sombre, { x: ROT.x, y: y + 0.15, z: ROT.z }, { crasse: false, nuance: 0 });
}

// ---------- Les étages (intérieur sombre vu par les fenêtres) ----------

function etages(k) {
  const { T, m } = k;
  const dalle = (x1, z1, x2, z2, y, coul = COUL.sombre) => T.pave(x1, y, z1, x2, y + 0.3, z2, coul, m.mat, { crasse: false, nuance: 0 });
  // Plafond du rez-de-chaussée (troué au-dessus de la chambre 9)
  dalle(X0, Z0, X1, -4.6, RDC, COUL.cremeOmbre);
  dalle(X0, -4.6, -21.6, ZS, RDC, COUL.cremeOmbre);
  dalle(-19, -4.6, X1, ZS, RDC, COUL.cremeOmbre);
  dalle(-21.6, -1.4, -19, ZS, RDC, COUL.cremeOmbre);
  for (const y of [RDC + ET, RDC + 2 * ET, CORN]) dalle(X0, Z0, X1, ZS, y);
  // Les cloisons des chambres des étages
  T.pave(X0, RDC + 0.3, -5.1, X1, CORN, -4.9, 0x4a4038, m.mat, { crasse: false, nuance: 0.04 });
  for (const x of [-23, -16.6, -10.2, -3.8, 2.6, 9]) T.pave(x - 0.1, RDC + 0.3, -4.9, x + 0.1, CORN, ZS - 0.3, 0x5a4e42, m.mat, { crasse: false, nuance: 0.06 });
  // Le trou du plafond de l'aile ouest : lattis et poutre qui pendent
  for (let i = 0; i < 5; i++) T.poutre([-21.4 + i * 0.55, RDC + 0.1, -4.5], [-21.2 + i * 0.5, RDC - 0.8 - T.hasard() * 1.2, -3.2 + T.hasard()], 0.07, PALETTE.boisGris, m.mat);
  T.poutre([-21.6, RDC + 0.15, -2.4], [-19.6, RDC - 1.8, -2.0], 0.22, PALETTE.boisSombre, m.mat);
}

// ---------- Le toit à la Mansart et ses lettres rouillées ----------

function toit(k) {
  const { T, m, usure } = k;
  const pente = Math.atan2(1.0, BRIS - CORN);
  const hb = Math.hypot(1.0, BRIS - CORN);
  const zr = (Z0 + ZS) / 2;
  const xr = (X0 + X1) / 2;
  // Le brisis d'ardoise sur les quatre côtés
  T.boite(X1 - X0 + 0.4, hb, 0.16, COUL.ardoise, { x: xr, y: (CORN + BRIS) / 2, z: ZS - 0.5, rx: -pente }, m.tole, { crasse: false, nuance: 0 });
  T.boite(X1 - X0 + 0.4, hb, 0.16, COUL.ardoise, { x: xr, y: (CORN + BRIS) / 2, z: Z0 + 0.5, rx: pente }, m.tole, { crasse: false, nuance: 0 });
  T.boite(0.16, hb, ZS - Z0 - 1.2, COUL.ardoise, { x: X0 + 0.5, y: (CORN + BRIS) / 2, z: zr, rz: -pente }, m.tole, { crasse: false, nuance: 0 });
  T.boite(0.16, hb, ZS - Z0 - 1.2, COUL.ardoise, { x: X1 - 0.5, y: (CORN + BRIS) / 2, z: zr, rz: pente }, m.tole, { crasse: false, nuance: 0 });
  // Le terrasson de zinc, à faible pente, et son faîtage
  // Le terrasson de zinc : deux grands pans (un trou côté mer, au-dessus de l'aile ouest, quand l'usure est forte)
  terrasson(T, m, xr, zr, X1 - X0 - 2, ZS - Z0 - 2, BRIS, 0.9, usure > 0.6 ? { u: -12, l: 2.4, p: 0.7 } : null);
  for (const s of [-1, 1]) T.poser(geoTriangle(ZS - Z0 - 2, 0.9, 0.1), m.tole, COUL.zinc, { x: s > 0 ? X1 - 1 : X0 + 1, y: BRIS, z: zr, ry: Math.PI / 2 }, { crasse: false });
  // Chéneau de zinc au pied du brisis
  T.pave(X0 - 0.1, CORN, ZS + EP / 2 + 0.3, XS1, CORN + 0.18, ZS + EP / 2 + 0.6, COUL.zinc, m.tole, { crasse: false });
  // Les lucarnes du brisis sud, l'une éventrée
  for (const x of [-24.6, -18.2, -11.8, -5.4, 1, 7.4]) {
    const yb = CORN + 0.35;
    const z = ZS - 0.2;
    const crevee = x === -18.2 && usure > 0.4;
    T.pave(x - 0.75, yb, z - 1.0, x + 0.75, yb + 1.9, z + 0.05, COUL.modenature, m.pele, { crasse: false });
    T.boite(0.85, 1.25, 0.04, crevee ? COUL.sombre : 0x34444a, { x, y: yb + 0.85, z: z + 0.06 }, crevee ? m.mat : m.verre, { crasse: false });
    T.boite(0.06, 1.25, 0.06, 0xe9e1cd, { x, y: yb + 0.85, z: z + 0.08 }, m.mat, { crasse: false });
    T.poser(geoTriangle(1.8, 0.62, 0.25), m.pele, COUL.modenature, { x, y: yb + 1.9, z: z - 0.08 }, { crasse: false });
    for (const s of [-1, 1]) T.boite(0.95, 0.06, 1.2, COUL.zinc, { x: x + s * 0.42, y: yb + 2.2, z: z - 0.55, rz: -s * 0.58 }, m.tole, { crasse: false });
  }
  // Souches de cheminée
  for (const x of [-22, -10, 4]) {
    T.pave(x - 0.7, BRIS - 0.2, zr - 0.4, x + 0.7, BRIS + 2.4, zr + 0.4, COUL.cremeOmbre, m.pele, { crasse: false });
    T.pave(x - 0.82, BRIS + 2.4, zr - 0.52, x + 0.82, BRIS + 2.56, zr + 0.52, COUL.modenature, m.pele, { crasse: false });
    for (const d of [-0.35, 0, 0.35]) T.poser(cylindre(0.11, 0.13, 0.45, 6), m.mat, 0xa0593d, { x: x + d, y: BRIS + 2.8, z: zr });
  }
  // Les lettres « GRAND HÔTEL DES FLOTS » sur leur ossature de fer, au faîtage, face à la mer
  const xl = -6.5;
  const yl = BRIS + 1.0;
  const ll = 17;
  const hl = 1.6;
  const zl = zr + 0.4;
  for (const y of [yl + 0.15, yl + hl - 0.15]) T.pave(xl - ll / 2, y - 0.05, zl - 0.12, xl + ll / 2, y + 0.05, zl - 0.04, COUL.ferRouille, m.tole, { crasse: false });
  for (let x = xl - ll / 2 + 0.3; x < xl + ll / 2; x += 1.7) {
    T.pave(x - 0.05, BRIS + 0.5, zl - 0.14, x + 0.05, yl + hl, zl - 0.04, COUL.ferRouille, m.tole, { crasse: false });
    T.poutre([x, yl + hl - 0.1, zl - 0.1], [x, BRIS + 0.6, zl - 1.6], 0.06, COUL.ferRouille, m.tole);
  }
  panneau(T, m.enseignes, R.lettres, { x: xl, y: yl + hl / 2, z: zl }, ll, hl);
  mousse(T, -16, BRIS + 0.3, zr + 2, 1.6, Math.round(3 + 6 * usure));
}

/** Le terrasson de zinc du toit à la Mansart : deux pans d'un seul tenant ; `trou` { u, l, p } côté mer. */
function terrasson(T, m, x, z, l, p, y0, hf, trou) {
  const pente = Math.atan2(hf, p / 2);
  const rampant = Math.hypot(p / 2 + 0.1, hf);
  T.repere({ x, y: y0, z }, () => {
    for (const s of [-1, 1]) {
      const pan = (u1, u2, v1, v2) => {
        const vm = (v1 + v2) / 2;
        T.boite(u2 - u1, 0.08, rampant * (v2 - v1), COUL.zinc, { x: (u1 + u2) / 2, y: hf - hf * vm, z: s * (p / 2) * vm, rx: s * pente }, m.tole, { nuance: 0.03, crasse: false });
      };
      if (s > 0 && trou) {
        pan(-l / 2 - 0.1, trou.u - trou.l / 2, 0, 1);
        pan(trou.u + trou.l / 2, l / 2 + 0.1, 0, 1);
        pan(trou.u - trou.l / 2, trou.u + trou.l / 2, 0, 1 - trou.p);
        for (let u = trou.u - trou.l / 2 + 0.3; u < trou.u + trou.l / 2; u += 0.6) T.poutre([u, hf - 0.1, 0], [u, -0.05, p / 2], 0.1, PALETTE.boisSombre, m.mat);
      } else pan(-l / 2 - 0.1, l / 2 + 0.1, 0, 1);
    }
  });
}

// ---------- La marquise de fer (ses verres sont tous tombés) ----------

function marquise(k) {
  const { c, m } = k;
  const x1 = -1.8;
  const x2 = 3.8;
  const zf = ZS + 3.6; // le bord avant
  const yA = 4.25; // contre la façade
  const yF = 3.95; // au bord avant
  const pente = Math.atan2(yA - yF, zf - ZS);
  const prof = Math.hypot(zf - ZS, yA - yF);
  const fer = COUL.fer;
  // Les fers : rive avant, chevrons tous les 0,7 m, deux pannes ; il ne reste que des éclats de verre sur le sol
  c.pave(x1, yF - 0.22, zf - 0.08, x2, yF + 0.05, zf + 0.04, fer, m.tole, { crasse: false });
  for (let x = x1; x <= x2 + 0.01; x += (x2 - x1) / 8) {
    c.boite(0.06, 0.1, prof, fer, { x, y: (yA + yF) / 2, z: (ZS + zf) / 2, rx: pente }, m.tole, { crasse: false });
  }
  for (const t of [0.35, 0.7]) c.boite(x2 - x1, 0.05, 0.05, fer, { x: (x1 + x2) / 2, y: yA - t * (yA - yF), z: ZS + t * (zf - ZS) }, m.tole, { crasse: false });
  // Le lambrequin de tôle découpée le long du bord avant (quelques dents arrachées)
  for (let x = x1 + 0.15; x < x2; x += 0.3) if (c.hasard() > 0.2) c.boite(0.18, 0.18, 0.02, fer, { x, y: yF - 0.3, z: zf + 0.02, rz: Math.PI / 4 }, m.tole, { crasse: false });
  // Les tirants accrochés à la façade
  for (const x of [x1 + 0.3, x2 - 0.3]) c.poutre([x, 6.6, ZS + EP / 2], [x, yF + 0.05, zf - 0.1], 0.04, fer, m.tole);
  // Les deux colonnes de fonte
  for (const x of [x1 + 0.2, x2 - 0.2]) {
    c.poser(cylindre(0.2, 0.24, 0.4, 8), m.tole, fer, { x, y: 0.2, z: zf - 0.15 });
    c.tube([x, 0.4, zf - 0.15], [x, yF - 0.2, zf - 0.15], 0.08, fer, m.tole, 8);
    c.poser(cylindre(0.2, 0.1, 0.25, 8), m.tole, fer, { x, y: yF - 0.32, z: zf - 0.15 });
    k.b.obstacle(x - 0.2, zf - 0.15, x + 0.2, zf - 0.15, "colonne");
  }
  // Le photophore de survivants pendu sous la marquise (des bougies dans un bocal)
  photophore(c, 1, 3.05, ZS + 2.3, 0.7);
  // Le paillasson « GRAND HÔTEL » mangé par le sable, deux palmiers morts de part et d'autre de la porte
  c.boite(2.2, 0.03, 1.2, 0x6f3a30, { x: 1, y: 0.05, z: ZS + 0.9 }, m.mat, { crasse: false });
  palmier(c, -1.0, ZS + 0.75, 2.4, true, 0.04, 0.7);
  palmier(c, 3.0, ZS + 0.75, 2.2, true, 0.04, 0.7);
}

// ---------- Les cloisons du rez-de-chaussée ----------

function cloisons(k) {
  const { m } = k;
  const papier = { ep: EPI, couleur: COUL.papier, mat: m.papier, cut: CUTI, h: RDC };
  const faience = { ep: EPI, couleur: COUL.faience, mat: m.carrelage, cut: CUTI, h: RDC };
  // Toutes les portes font 1,3 m au moins (passages ≥ 1,2 m entre les morceaux d'obstacle)
  const porte = (u, l = 1.4, haut = 2.6) => ({ u, l, bas: 0, haut, type: "vide" });
  // Salle à manger | cuisines (z = -6) ; la face nord est carrelée (cuisines)
  murCoupe(k, [-16.6, -6], [-3.8, -6], { ...papier, interieur: { couleur: COUL.faience, mat: m.carrelage }, ouvertures: [porte(6.6)] });
  // L'aile ouest effondrée est murée : ni porte ni passage (on la voit par les brèches du plafond)
  murCoupe(k, [-16.6, Z0], [-16.6, -6], { ...faience, ouvertures: [] });
  murCoupe(k, [-16.6, -6], [-16.6, ZS], { ...papier, ouvertures: [] });
  // Le hall : à l'ouest les cuisines et la salle à manger, à l'est le grand salon
  murCoupe(k, [-3.8, Z0], [-3.8, -6], { ...faience, interieur: { couleur: COUL.papier, mat: m.papier }, ouvertures: [porte(4)] });
  murCoupe(k, [-3.8, -6], [-3.8, ZS], { ...papier, interieur: { couleur: COUL.papier, mat: m.papier }, ouvertures: [porte(5.8, 2.6, 3.4)] });
  murCoupe(k, [5.8, Z0], [5.8, ZS], { ...papier, interieur: { couleur: COUL.papier, mat: m.papier }, ouvertures: [porte(3, 1.4, 2.8), porte(10, 3.0, 3.6)] });
  // Les chambres froides (panneaux isolants blancs, plafond bas)
  const froid = { ep: 0.18, couleur: 0xe6e6e0, mat: m.mat, cut: CUTI, h: 3.0 };
  murCoupe(k, [-16.6, -9.5], [-11, -9.5], { ...froid, ouvertures: [porte(1.4, 1.3, 2.1), porte(4.2, 1.3, 2.1)] });
  murCoupe(k, [-13.8, Z0], [-13.8, -9.5], { ...froid, ouvertures: [] });
  murCoupe(k, [-11, -9.5], [-11, Z0], { ...froid, ouvertures: [] });
  k.T.pave(-16.6, 3.0, Z0, -11, 3.15, -9.5, 0xe6e6e0, m.mat, { crasse: false });
}

// ---------- La terrasse (les deux cartes en voient une partie) ----------

function terrasse(k) {
  const { c, m, usure } = k;
  // Le sable a recouvert la moitié ouest de la terrasse, et s'est entassé contre la salle à manger
  c.pave(-33, 0.03, ZS + EP / 2, -8, 0.07, 17.6, COUL.sableClair, m.sable, { crasse: false, nuance: 0 });
  dune(c, -15.5, 3.6, 7, 4.4, 1.25, m.sable, COUL.sable);
  dune(c, -11.4, 4.0, 4.4, 3.2, 0.8, m.sable, COUL.sableClair);
  dune(c, -24, 6.5, 9, 6, 1.0, m.sable, COUL.sable, 0.3);
  dune(c, -8.6, 7.5, 3.4, 3.0, 0.45, m.sable, COUL.sableClair);
  dune(c, -27, 13, 8, 6, 0.9, m.sable, COUL.sable, -0.2);
  dune(c, -18, 14.5, 9, 5, 0.6, m.sable, COUL.sableClair);
  semerTouffes(c, -32, 3.5, -10, 17, Math.round(50 + 70 * usure), 0x9aa65e, 0.06);
  // Le balcon tombé de la chambre 8 (on retombe là quand on saute de l'étage) : dalle brisée plantée dans la dune,
  // garde-corps tordu, consoles et moellons
  c.boite(1.9, 0.18, 0.85, COUL.modenature, { x: BALCON_TOMBE + 0.2, y: 0.95, z: 4.6, rx: 0.35, rz: -0.2, ry: 0.3 }, m.pele);
  c.boite(0.9, 0.16, 0.7, COUL.modenature, { x: BALCON_TOMBE + 1.3, y: 0.5, z: 5.4, rx: -0.3, rz: 0.4, ry: -0.2 }, m.pele);
  panneau(c, m.enseignes, R.balconTordu, { x: BALCON_TOMBE - 0.4, y: 1.0, z: 5.6, rx: -1.0, ry: 0.5 }, 2.0, 0.92);
  panneau(c, m.enseignes, R.balconTordu, { x: BALCON_TOMBE + 0.9, y: 0.45, z: 6.6, rx: -1.35, ry: -0.6 }, 1.2, 0.92);
  gravats(c, BALCON_TOMBE, 3.6, 1.2, Math.round(5 + 5 * usure), [COUL.modenature, COUL.creme, PALETTE.pierre], 0.7);
  // Le S tombé de l'enseigne du toit, planté dans le sable
  panneau(c, m.enseignes, R.lettreS, { x: -6.6, y: 0.85, z: 4.4, rx: -0.35, ry: 0.4, rz: 0.15 }, 1.6, 1.6);
  panneau(c, m.enseignes, R.lettreS, { x: -6.62, y: 0.85, z: 4.38, rx: -0.35, ry: 0.4 + Math.PI, rz: -0.15 }, 1.6, 1.6);
  // Le café de la terrasse : guéridons de marbre, chaises bistrot, parasols
  const tables = [[-5.6, 7.2], [-3.0, 9.0], [-2.6, 12.6], [5.2, 6.4], [7.8, 7.6]];
  for (const [x, z] of tables) {
    gueridon(c, x, z, false);
    for (let i = 0; i < 3; i++) {
      if (c.hasard() < 0.3) continue;
      const t = (i / 3) * Math.PI * 2 + c.hasard();
      chaise(c, x + Math.cos(t) * 0.75, z + Math.sin(t) * 0.75, -t - Math.PI / 2, c.hasard() < usure * 0.4, 0.04);
    }
  }
  gueridonRenverse(k, -6.2, 11.2);
  parasol(c, -4.4, 10.2, false, R.rayuresR, 1.6);
  parasol(c, -1.0, 14.2, true, R.rayuresR, 1.5, 0.04);
  parasol(c, 6.6, 7.0, false, R.rayuresB, 1.4);
  // Jardinières et palmiers morts qui séparent la terrasse de la promenade
  for (const x of [-26, -14, -2, 10, 22]) {
    if (x === -14 || x === 10) {
      // la jardinière vide, son palmier abattu par une tempête
      c.poser(cylindre(0.42, 0.32, 0.8, 8), m.mat, 0x8f7d66, { x, y: 0.4, z: 17.2 });
      c.tube([x, 0.75, 17.2], [x + 2.2, 0.15, 17.9], 0.11, 0x6e5e4a, m.mat, 5);
    } else palmier(c, x, 17.2, 2.4 + c.hasard() * 1.2, true, 0.04, 0.8);
  }
  for (const x of [-26, -14, -2, 10, 22]) k.b.obstacle(x - 0.4, 17.2, x + 0.4, 17.2, "jardinière");
  // Des feuilles de palmier, des papiers, du sable qui court
  jonchee(c, -6, 4, 9, 16, Math.round(30 + 50 * usure), [0x9c7a45, 0x8a7450, 0xd8d0bb, 0xb08f55], 0.05);
  debris(c, -9, 3, 12, 9, Math.round(14 * usure), undefined, 0.05);
}

/** Le guéridon renversé (H9) : le plateau de marbre a roulé, le pied de fonte est à part (`pied_gueridon`). */
function gueridonRenverse(k, x, z) {
  const { c, m } = k;
  c.poser(cylindre(0.36, 0.36, 0.04, 10), m.satin, COUL.marbre, { x: x - 0.35, y: 0.34, z: z - 0.1, rz: Math.PI / 2 - 0.25, ry: 0.4 }, { nuance: 0.05 });
  objetNomme(k, "pied_gueridon", 91, (e) => {
    e.repere({ x: x + 0.2, y: 0.24, z: z + 0.15, ry: 0.35, rz: Math.PI / 2 - 0.08 }, () => {
      e.poser(cylindre(0.22, 0.26, 0.05, 8), m.tole, COUL.fonte, { y: -0.36 });
      e.tube([0, -0.36, 0], [0, 0.34, 0], 0.035, COUL.fonte, m.tole, 5);
      e.poser(cylindre(0.1, 0.06, 0.06, 6), m.tole, COUL.fonte, { y: 0.35 });
      // les trois pattes de fonte et leurs volutes
      for (let i = 0; i < 3; i++) e.boite(0.05, 0.04, 0.3, COUL.fonte, { y: -0.32, ry: (i * Math.PI * 2) / 3, z: 0 }, m.tole);
    });
  });
}

// ---------- La piscine d'eau de mer et ses bains ----------

function piscine(k) {
  const { c, m, usure } = k;
  const x1 = 4;
  const x2 = 16;
  const z1 = 9;
  const z2 = 15;
  const fond = (x) => -1.0 - ((x - x1) / (x2 - x1)) * 1.0;
  // Le fond en pente (petit bain à l'ouest), les parois carrelées
  const lf = Math.hypot(x2 - x1, 1.0);
  c.boite(lf, 0.1, z2 - z1, COUL.carreauPiscine, { x: (x1 + x2) / 2, y: (fond(x1) + fond(x2)) / 2, z: (z1 + z2) / 2, rz: -Math.atan2(1.0, x2 - x1) }, m.carrelage, { crasse: false, nuance: 0 });
  c.pave(x1 - 0.1, -2.1, z1 - 0.1, x2 + 0.1, 0, z1, COUL.carreauPiscine, m.carrelage, { crasse: false, nuance: 0 });
  c.pave(x1 - 0.1, -2.1, z2, x2 + 0.1, 0, z2 + 0.1, COUL.carreauPiscine, m.carrelage, { crasse: false, nuance: 0 });
  c.pave(x1 - 0.1, -2.1, z1, x1, 0, z2, COUL.carreauPiscine, m.carrelage, { crasse: false, nuance: 0 });
  c.pave(x2, -2.1, z1, x2 + 0.1, 0, z2, COUL.carreauPiscine, m.carrelage, { crasse: false, nuance: 0 });
  // La margelle de pierre blanche
  for (const [a, b2, cc, d] of [[x1 - 0.4, z1 - 0.4, x2 + 0.4, z1], [x1 - 0.4, z2, x2 + 0.4, z2 + 0.4], [x1 - 0.4, z1, x1, z2], [x2, z1, x2 + 0.4, z2]]) c.pave(a, 0, b2, cc, 0.12, d, 0xe6e0d2, m.dalle, { crasse: false });
  // L'eau croupie (verte, des feuilles, une algue en tapis) : la piscine est à moitié vide
  const niveau = -1.25 - 0.3 * usure;
  const xe = x1 + ((-1.0 - niveau) / 1.0) * (x2 - x1);
  c.pave(xe, niveau - 0.02, z1, x2, niveau, z2, COUL.eauPiscine, m.satin, { crasse: false, nuance: 0 });
  for (let i = 0; i < 9; i++) c.boite(c.entre(0.4, 1.4), 0.02, c.entre(0.3, 0.9), 0x5f7a3a, { x: c.entre(xe + 0.3, x2 - 0.4), y: niveau + 0.01, z: c.entre(z1 + 0.3, z2 - 0.3), ry: c.hasard() * 3 }, m.mat, { crasse: false });
  jonchee(c, x1 + 0.3, z1 + 0.3, xe, z2 - 0.3, 20, [0x7d6143, 0x9c7a45, 0x5a4a38], fond(x1 + 1) + 0.08);
  // Un transat tombé au fond, l'échelle de laiton, le plongeoir rouillé
  c.repere({ y: -1.12 }, () => transat(c, 6, 11.5, 0.9, R.rayuresR, true));
  for (const s of [-1, 1]) c.tube([14.6 + s * 0.25, -1.6, z1 + 0.06], [14.6 + s * 0.25, 0.9, z1 + 0.06], 0.03, COUL.laiton, m.metal, 5);
  for (let y = -1.3; y < 0; y += 0.3) c.boite(0.5, 0.03, 0.08, COUL.laiton, { x: 14.6, y, z: z1 + 0.1 }, m.metal);
  c.pave(16.4, 0, 11.2, 17.8, 0.6, 12.8, COUL.dalleGrise, m.dalle);
  c.boite(3.2, 0.08, 0.55, COUL.ferRouille, { x: 15.6, y: 0.7, z: 12, rz: 0.06 }, m.tole);
  // Le panneau « Baignade interdite aux chiens… et aux Éteints »
  c.tube([3.0, 0, 8.6], [3.0, 1.9, 8.6], 0.04, COUL.fonte, m.tole, 5);
  panneau(c, m.enseignes, R.piscine, { x: 3.0, y: 1.75, z: 8.65, ry: -0.5 }, 1.6, 0.4);
  // Les transats autour du bassin
  for (let i = 0; i < 6; i++) {
    const x = 5 + i * 2;
    transat(c, x, 16.4, c.entre(-0.1, 0.1), i % 2 ? R.rayuresB : R.rayuresR, (i === 0 || i === 5) && c.hasard() < usure * 0.6);
  }
  for (let i = 0; i < 3; i++) transat(c, 18.6, 9.8 + i * 1.9, -Math.PI / 2 + c.entre(-0.1, 0.1), R.rayuresR, i === 2 && usure > 0.5);
  parasol(c, 9.0, 17.2, false, R.rayuresB, 1.6);
  parasol(c, 13.4, 16.6, true, R.rayuresR, 1.5, 0.04);
  parasol(c, 18.8, 8.6, false, R.rayuresR, 1.4);
  // La margelle bloque (on ne saute pas dans la piscine), sauf au petit bain où l'on peut descendre par l'échelle
  k.b.obstacle(x1 - 0.2, z1 - 0.2, x2 + 0.2, z1 - 0.2, "bord de la piscine");
  k.b.obstacle(x1 - 0.2, z2 + 0.2, x2 + 0.2, z2 + 0.2, "bord de la piscine");
  k.b.obstacle(x1 - 0.2, z1 - 0.2, x1 - 0.2, z2 + 0.2, "bord de la piscine");
  k.b.obstacle(x2 + 0.2, z1 - 0.2, x2 + 0.2, z2 + 0.2, "bord de la piscine");
}

// ---------- La promenade, la buvette, la plage ----------

function promenade(k) {
  const { c, m, usure } = k;
  // La balustrade de béton blanc, ouverte sur deux escaliers de plage, effondrée par endroits
  const zb = 21.8;
  const trous = [[-13.5, -10.5], [10.5, 13.5]];
  const effondre = [-1.5, 2.5];
  const segments = soustraire(-33, 31, [...trous, effondre]);
  for (const [a, b2] of segments) {
    c.pave(a, 0.9, zb - 0.16, b2, 1.04, zb + 0.16, 0xe6dfcf, m.dalle, { crasse: false });
    c.pave(a, 0.04, zb - 0.14, b2, 0.18, zb + 0.14, 0xd6cfbf, m.dalle);
    // les balustres, peints (atlas) des deux côtés de la lisse
    for (let x = a; x < b2 - 0.05; x += 2.56) {
      const lx = Math.min(2.56, b2 - x);
      for (const s of [-1, 1]) panneau(c, m.enseignes, R.balustrade, { x: x + lx / 2, y: 0.54, z: zb + s * 0.03, ry: s > 0 ? 0 : Math.PI }, lx, 0.72);
    }
    for (let x = a; x <= b2 + 0.01; x += Math.max(1, (b2 - a) / Math.ceil((b2 - a) / 2.6))) c.pave(x - 0.18, 0.04, zb - 0.2, x + 0.18, 1.12, zb + 0.2, 0xe6dfcf, m.dalle);
    k.b.obstacle(a, zb, b2, zb, "balustrade");
  }
  // Les balustres tombés sur la plage
  for (let i = 0; i < 9; i++) c.boite(0.11, 0.72, 0.11, 0xe6dfcf, { x: c.entre(-1.6, 2.6), y: 0.08, z: zb + c.entre(0.4, 2.0), rz: Math.PI / 2, ry: c.hasard() * 3 }, m.dalle);
  c.boite(4, 0.14, 0.32, 0xe6dfcf, { x: 0.5, y: 0.12, z: zb + 1.0, ry: 0.15, rz: 0.05 }, m.dalle);
  // La bouée accrochée à un poteau
  c.poser(new THREE.TorusGeometry(0.32, 0.08, 5, 10), m.satin, 0xc0574a, { x: 10.3, y: 0.75, z: zb + 0.28 }, { crasse: false });
  // Les lampadaires de fonte (globes cassés), l'un plié par une tempête
  for (const x of [-26, -14, -2, 10, 22]) {
    const plie = x === -14;
    const top = plie ? [x + 1.4, 3.2, 21.0] : [x, 4.2, 21.0];
    c.poser(cylindre(0.2, 0.26, 0.6, 8), m.tole, COUL.fonte, { x, y: 0.3, z: 21.0 });
    c.tube([x, 0.6, 21.0], plie ? [x + 0.2, 2.4, 21.0] : top, 0.07, COUL.fonte, m.tole, 6);
    if (plie) c.tube([x + 0.2, 2.4, 21.0], top, 0.07, COUL.fonte, m.tole, 6);
    for (const s of [-1, 1]) {
      c.tube([top[0], top[1] - 0.2, top[2]], [top[0] + s * 0.55, top[1] - 0.05, top[2]], 0.035, COUL.fonte, m.tole, 4);
      if (c.hasard() < 0.6) c.poser(new THREE.IcosahedronGeometry(0.18, 0), m.lisse, 0xe8e6da, { x: top[0] + s * 0.55, y: top[1] + 0.12, z: top[2] }, { crasse: false });
    }
  }
  // Les bancs face à la mer
  for (const x of [-8, 4, 16]) {
    c.repere({ x, z: 20.6 }, () => {
      for (const s of [-1, 1]) c.boite(0.08, 0.45, 0.5, COUL.fonte, { x: s * 0.85, y: 0.25 }, m.tole);
      for (let i = 0; i < 3; i++) c.boite(1.9, 0.04, 0.12, COUL.boisClair, { y: 0.46, z: -0.15 + i * 0.15 }, m.mat, { nuance: 0.08 });
      for (let i = 0; i < 2; i++) c.boite(1.9, 0.12, 0.04, COUL.boisClair, { y: 0.65 + i * 0.16, z: -0.26, rx: -0.15 }, m.mat, { nuance: 0.08 });
    });
  }
  // Le panneau « Séjour Zéro-Effort », toujours éclairé par son panneau solaire
  c.repere({ x: 25.6, z: 20.4, ry: Math.PI / 4 }, () => {
    for (const s of [-1, 1]) c.tube([s * 1.1, 0, -0.1], [s * 1.1, 5.0, -0.1], 0.06, 0x8d969a, m.metal, 6);
    c.boite(2.7, 3.9, 0.12, 0xd9d2c0, { y: 3.0, z: -0.12 }, m.satin);
    panneau(c, m.enseignes, R.zeroEffort, { y: 3.0, z: -0.05 }, 2.5, 3.7);
    c.boite(1.4, 0.06, 0.8, 0x1f3550, { y: 5.15, z: -0.4, rx: -0.6 }, m.lisse);
    // le coffret vide au pied du poteau, et le câble qui monte au panneau
    c.boite(0.5, 0.42, 0.34, 0x5a5f58, { x: 0.75, y: 0.21, z: 0.3 }, m.tole);
    c.tube([1.0, 0.4, 0.25], [1.1, 1.2, -0.05], 0.015, 0x1c1c1a, m.tole, 3);
  });
  // H6 : la batterie, posée dans son coffret ouvert au pied du panneau (on la dévisse et on l'emporte)
  objetNomme(k, "batterie_panneau", 92, (e) => {
    e.repere({ x: 25.6, z: 20.4, ry: Math.PI / 4 }, () => {
      e.boite(0.4, 0.3, 0.26, 0x2c3a46, { x: 0.75, y: 0.57, z: 0.3 }, m.tole);
      e.boite(0.4, 0.04, 0.26, COUL.abondanceRouge, { x: 0.75, y: 0.74, z: 0.3 }, m.tole);
      for (const s2 of [-1, 1]) e.poser(cylindre(0.03, 0.03, 0.06, 6), m.tole, s2 > 0 ? COUL.abondanceRouge : 0x1c1c1a, { x: 0.75 + s2 * 0.12, y: 0.79, z: 0.3 });
    });
  });
  // Le sable qui court sur la promenade
  for (const [x, z, l] of [[-30, 20, 5], [-18, 21, 4], [-6, 19.6, 3], [20, 21.2, 3]]) dune(c, x, z, l, 1.6, 0.18, m.sable, COUL.sableClair);
}

function buvette(k) {
  const { c, m } = k;
  const cx = -21;
  const cz = 19.6;
  const r = 1.7;
  const pts = [];
  for (let i = 0; i < 8; i++) pts.push([cx + Math.cos((i / 8) * Math.PI * 2 + Math.PI / 8) * r, cz + Math.sin((i / 8) * Math.PI * 2 + Math.PI / 8) * r]);
  // Huit poteaux, un comptoir sur six côtés (on entre par le nord, côté terrasse)
  for (const [x, z] of pts) c.tube([x, 0, z], [x, 2.6, z], 0.06, 0xe9e2cf, m.satin, 5);
  for (let i = 0; i < 8; i++) {
    if (i === 5 || i === 6) continue; // l'ouverture
    const a = pts[i];
    const b2 = pts[(i + 1) % 8];
    const { L, ry } = repereMur(a, b2);
    c.boite(L, 1.05, 0.12, 0x2f6f73, { x: (a[0] + b2[0]) / 2, y: 0.55, z: (a[1] + b2[1]) / 2, ry }, m.satin, { nuance: 0.03 });
    c.boite(L + 0.1, 0.06, 0.4, 0xe9e2cf, { x: (a[0] + b2[0]) / 2, y: 1.1, z: (a[1] + b2[1]) / 2, ry }, m.satin);
    k.b.obstacle(a[0], a[1], b2[0], b2[1], "comptoir de la buvette");
  }
  // Le toit conique de zinc s'est envolé : il reste ses huit chevrons de fer, l'anneau, un lambeau de lambrequin
  for (const [x, z] of pts) c.poutre([x, 2.6, z], [cx, 3.9, cz], 0.05, COUL.ferRouille, m.tole);
  c.poser(cylindre(0.18, 0.18, 0.2, 6), m.tole, COUL.ferRouille, { x: cx, y: 3.9, z: cz });
  for (let i = 0; i < 3; i++) {
    const t = (i / 8) * Math.PI * 2 + Math.PI / 4;
    c.boite(1.3, 0.35, 0.03, 0xefe6cf, { x: cx + Math.cos(t) * 1.75, y: 2.45, z: cz + Math.sin(t) * 1.75, ry: Math.PI / 2 - t, rz: (i - 1) * 0.12 }, m.tole, { crasse: false });
  }
  panneau(c, m.enseignes, R.buvette, { x: cx, y: 2.3, z: cz + 1.78, rz: 0.06 }, 1.7, 0.42);
  // Dedans : glacière, étagère de bouteilles, des bougies dans un bocal
  c.boite(0.8, 0.6, 0.5, 0xd9d2c0, { x: cx + 0.4, y: 0.3, z: cz + 0.7 }, m.satin);
  c.boite(0.82, 0.06, 0.52, 0x2f6f73, { x: cx + 0.4, y: 0.62, z: cz + 0.7 }, m.satin);
  etagere(c, cx - 0.9, cz + 0.6, 1.0, Math.PI / 2 + 0.4, 3, COUL.boisClair, m.mat, bouteilles, 1.2, 0.3);
  photophore(c, cx + 0.2, 1.13, cz + 1.3);
  // La « glace à l'italienne » géante de l'enseigne, tombée
  c.poser(new THREE.ConeGeometry(0.35, 0.9, 6), m.satin, 0xd8b070, { x: cx + 1.8, y: 0.3, z: cz - 1.6, rz: 1.4, ry: 0.5 });
  c.poser(new THREE.IcosahedronGeometry(0.42, 0), m.satin, 0xe8d8d0, { x: cx + 2.3, y: 0.35, z: cz - 1.5 });
}

function plage(k) {
  const { c, m, usure } = k;
  // Les cabines de plage (l'une couchée par une tempête)
  const cab = [-29.2, -27.4, -25.6];
  cab.forEach((x, i) => {
    if (i === 2 && usure > 0.6) {
      c.repere({ x, z: 25.4, rz: 0.25, y: 0.1 }, () => cabine(c, 0, 0, 0, R.rayuresR));
    } else cabine(c, x, 25.4, c.entre(-0.05, 0.05), i % 2 ? R.rayuresR : R.rayuresB);
    k.b.obstacle(x - 0.75, 24.65, x + 0.75, 24.65, "cabine de plage");
  });
  // La barque échouée, une rame, un filet
  barque(c, 6, 28.6, 0.35);
  k.b.obstacle(4, 28, 8, 29.2, "barque");
  c.boite(2.2, 0.05, 0.12, COUL.boisClair, { x: 8.6, y: 0.05, z: 27.6, ry: 0.9 }, m.mat);
  c.boite(1.6, 0.04, 1.2, 0x5a6a5a, { x: 4.2, y: 0.04, z: 27.2, ry: 0.4 }, m.mat, { crasse: false });
  // La chaise haute du maître-nageur, penchée
  c.repere({ x: 17, z: 27, rz: 0.12 }, () => {
    for (const [sx, sz] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]]) c.boite(0.08, 2.4, 0.08, 0xe9e2cf, { x: sx * 0.7, y: 1.2, z: sz * 0.7, rz: -sx * 0.15, rx: sz * 0.15 }, m.mat);
    c.boite(0.8, 0.06, 0.7, 0xe9e2cf, { y: 2.3 }, m.mat);
    c.boite(0.8, 0.6, 0.06, 0xe9e2cf, { y: 2.6, z: -0.33 }, m.mat);
    for (let y = 0.4; y < 2.2; y += 0.45) c.boite(0.7, 0.05, 0.05, 0xe9e2cf, { y, z: 0.45 }, m.mat);
    c.boite(0.9, 0.5, 0.04, 0xc0574a, { y: 1.6, z: -0.42 }, m.mat);
  });
  // Parasol couché, une serviette, la laisse de mer (algues, bois flotté)
  parasol(c, -6, 27.4, true, R.rayuresB, 1.5, 0.02);
  c.boite(1.6, 0.02, 0.8, 0xc97a62, { x: -4.4, y: 0.03, z: 26.6, ry: 0.3 }, m.mat, { crasse: false });
  for (let i = 0; i < 16; i++) c.boite(c.entre(0.4, 1.2), 0.04, c.entre(0.1, 0.2), c.hasard() < 0.7 ? 0x3f5a35 : 0x5a4a38, { x: c.entre(-32, 30), y: 0.03, z: 31.6 + c.entre(-0.4, 0.4), ry: c.entre(-0.3, 0.3) }, m.mat, { crasse: false });
  for (const [x, z, l] of [[-18, 30.2, 2.4], [23, 29.8, 2.8]]) c.boite(l, 0.18, 0.18, 0x9a8a72, { x, y: 0.09, z, ry: c.hasard() * 3 }, m.mat);
  // Les dunes basses au pied de la promenade, les oyats
  for (const [x, l] of [[-28, 7], [-4, 4], [20, 6]]) dune(c, x, 23.4, l, 2.4, 0.5, m.sable, COUL.sable);
  semerTouffes(c, -32, 22.4, 30, 24.2, Math.round(30 + 40 * usure), 0x9aa65e, 0.15);
}

/**
 * Les bords du lot (T5, R52) : la mer au sud (le large, où l'on perd pied) ; des ganivelles plantées dans les dunes à
 * l'ouest et à l'est, jusque dans l'eau claire ; celle de l'ouest barre aussi la promenade (G-2) ; celle de l'est s'ouvre
 * sur la promenade (la sortie). Au nord, les murs de la cour de service, de part et d'autre de l'hôtel.
 */
function bords(k) {
  const { c, m } = k;
  const ganivelle = (a, b2, nature = "ganivelles (bord du lot)") => {
    ganivelleAtlas(c, m, a, b2);
    k.b.obstacle(a[0], a[1], b2[0], b2[1], nature);
  };
  // L'ouest : continue, de la cour jusque dans l'eau ; on bute sur elle au bout de la promenade (G-2)
  ganivelle([-32.6, -6], [-32.6, 17.8]);
  ganivelle([-32.6, 17.8], [-32.6, 22.2], "ganivelle en travers de la promenade (bord du lot)");
  ganivelle([-32.6, 22.2], [-32.6, MER.brisants + 0.5]);
  // L'est : ouverte sur la promenade, la sortie vers la route du pont
  ganivelle([30.6, -4.6], [30.6, 17.8]);
  ganivelle([30.6, 21.7], [30.6, MER.brisants + 0.5]); // jointive avec la balustrade (z = 21,8)
  dune(c, -31.4, 9, 3, 9, 0.9, m.sable, COUL.sable);
  dune(c, 29.6, 27, 3, 8, 0.7, m.sable, COUL.sable);
  dune(c, -31.2, 20, 2.2, 3.4, 0.35, m.sable, COUL.sableClair);
  // La mer : au-delà de la ligne de brisants, on perd pied (avant la 0.10 : le bord de l'eau)
  k.b.obstacle(-33, MER.brisants, 31, MER.brisants, "le large : on perd pied (bord du lot)");
  // Les murs de la cour de service (pierre, chaperon de tuile), de part et d'autre de l'hôtel
  const murCour = (a, b2) => {
    mur(c, a, b2, { h: 2.2, ep: 0.4, couleur: COUL.cremeOmbre, mat: m.pele });
    const { L, ry } = repereMur(a, b2);
    c.repere({ x: a[0], z: a[1], ry }, () => c.pave(-0.05, 2.2, -0.28, L + 0.05, 2.34, 0.28, 0x9a5a3c, m.mat, { crasse: false }));
    k.b.obstacle(a[0], a[1], b2[0], b2[1], "mur de la cour de service (bord du lot)");
  };
  murCour([-33, -6], [X0 - EP / 2, -6]);
  murCour([X1 + EP / 2, -4.6], [31, -4.6]);
  lierre(c, 24, 0, -4.35, 0, 4, 2.2, 80);
}

/** Une boîte dont toutes les faces prennent une région de l'atlas (un aplat : le bois, le fer, le blanc teinté). */
function boiteAtlas(ch, m, r, l, h, p, couleur, pose, options = {}) {
  const g = uvAtlas(new THREE.BoxGeometry(l, h, p), r);
  ch.poser(g, m.enseignes, couleur, pose, { crasse: false, ...options });
  g.dispose();
}

/**
 * Une ganivelle de a à b (repère du chantier), peinte dans l'atlas : des pans de 2,2 m environ, un peu de travers et
 * plus ou moins ensablés, un piquet tous les deux pans. Deux triangles par pan : on peut en planter partout.
 */
function ganivelleAtlas(ch, m, a, b, hauteur = 1.1) {
  const { L, ry, dx, dz } = repereMur(a, b);
  const n = Math.max(1, Math.round(L / 2.2));
  const pas = L / n;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * pas;
    const enfonce = ch.entre(0.02, 0.18);
    panneau(ch, m.enseignes, R.ganivelle, { x: a[0] + (dx * u) / L, y: hauteur / 2 - enfonce, z: a[1] + (dz * u) / L, ry, rz: ch.entre(-0.03, 0.03), rx: ch.entre(-0.05, 0.05) }, pas + 0.03, hauteur);
  }
  for (let i = 0; i <= n; i += 2) {
    const u = i * pas;
    boiteAtlas(ch, m, R.bois, 0.08, hauteur + 0.2, 0.08, 0xb8a58a, { x: a[0] + (dx * u) / L, y: (hauteur + 0.2) / 2 - 0.12, z: a[1] + (dz * u) / L, ry, rz: ch.entre(-0.06, 0.06) });
  }
}

/**
 * R0-1 : le panneau de sortie de l'est, au bout de la promenade (`panneau_sortie_est`) : deux poteaux de bois, la planche
 * peinte (2,2 × 1,1 m, tournée vers la caméra du sud-est), et au-dessus, au bout d'une potence de fer, une lanterne dont
 * le verre luit (la matière lueur partagée avec les rais de lumière) ; sa lumière est dans `lumieres`.
 */
function panneauSortie(k) {
  const { c, m } = k;
  const P = PANNEAU_EST;
  const L = LANTERNE_EST;
  objetNomme(k, "panneau_sortie_est", 93, (e) => {
    e.repere({ x: P.x, z: P.z, ry: P.ry }, () => {
      // les poteaux (celui de droite monte porter la potence), la planche, son chapeau
      boiteAtlas(e, m, R.bois, 0.13, 2.6, 0.13, 0xffffff, { x: -1.14, y: 1.3, z: -0.08, rz: 0.015 });
      boiteAtlas(e, m, R.bois, 0.13, 3.4, 0.13, 0xffffff, { x: 1.14, y: 1.7, z: -0.08 });
      boiteAtlas(e, m, R.bois, 2.3, 1.18, 0.05, 0xd9cdb8, { y: 1.85, z: -0.035 });
      boiteAtlas(e, m, R.bois, 2.44, 0.06, 0.16, 0xffffff, { y: 2.47, z: -0.03 });
      panneau(e, m.enseignes, R.panneauSortie, { y: 1.85, z: -0.005 }, 2.2, 1.1);
      // la potence de fer, sa jambe de force, la lanterne (chapeau, cadre, socle, montants)
      const yP = L.y + 0.36;
      boiteAtlas(e, m, R.fer, 1.14 - L.u + 0.04, 0.04, 0.04, 0xffffff, { x: (1.14 + L.u) / 2, y: yP, z: 0 });
      boiteAtlas(e, m, R.fer, 0.04, 0.04, L.v + 0.04, 0xffffff, { x: L.u, y: yP, z: L.v / 2 });
      boiteAtlas(e, m, R.fer, 0.03, 0.03, 0.5, 0xffffff, { x: 0.93, y: yP - 0.16, z: 0, ry: Math.PI / 2, rz: 0.6 });
      boiteAtlas(e, m, R.fer, 0.015, 0.1, 0.015, 0xffffff, { x: L.u, y: yP - 0.05, z: L.v });
      const chapeau = uvAtlas(new THREE.ConeGeometry(0.15, 0.13, 4).rotateY(Math.PI / 4), R.fer);
      e.poser(chapeau, m.enseignes, 0xffffff, { x: L.u, y: L.y + 0.2, z: L.v }, { crasse: false });
      chapeau.dispose();
      boiteAtlas(e, m, R.fer, 0.2, 0.03, 0.2, 0xffffff, { x: L.u, y: L.y + 0.13, z: L.v });
      boiteAtlas(e, m, R.fer, 0.19, 0.04, 0.19, 0xffffff, { x: L.u, y: L.y - 0.13, z: L.v });
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) boiteAtlas(e, m, R.fer, 0.02, 0.24, 0.02, 0xffffff, { x: L.u + sx * 0.085, y: L.y, z: L.v + sz * 0.085 });
    });
  });
  // Le verre de la lanterne : des boîtes de lueur emboîtées (additives : elles s'ajoutent), dans le chantier du lieu
  const lueur = matiereLueur(0xfff0c8, 0.09);
  c.repere({ x: P.x, z: P.z, ry: P.ry }, () => {
    for (let i = 0; i < 7; i++) {
      const s = 1 - i * 0.09;
      c.boite(0.15 * s, 0.22 * s, 0.15 * s, 0xffc46e, { x: L.u, y: L.y, z: L.v }, lueur, { crasse: false, nuance: 0 });
    }
  });
}

// ---------- Les alentours (R52) ----------

/**
 * Le décor au-delà du lot, en version légère (R0-2, G-1 à G-4) : trois matières seulement, celles du lot (le sable, la
 * pierre, l'atlas), et aucun obstacle (rien ne s'y foule). Repère H, comme tout le reste.
 *
 * - à l'est (G-1) : la promenade prolongée de 35 m (dalles, bordure, balustrade dont la lisse tient encore sur 12 m),
 *   que le sable recouvre peu à peu, puis une piste de sable tassé qui file vers la route du pont ;
 * - à l'ouest (G-2) : derrière la ganivelle qui barre la promenade, ses dalles se perdent sous la dune ;
 * - des deux côtés : les dunes, les oyats, des rangs de ganivelles, la plage, le sable mouillé ;
 * - au sud (G-3) : la mer, les mêmes bandes que dans le lot (l'eau claire, la ligne de brisants), puis le large ;
 * - au nord (G-4) : la rue de derrière, pavée, et en face de l'hôtel une rangée de maisons de bains de mer et de
 *   boutiques fermées ; une ruelle part vers le nord entre deux maisons. L'étage (posé au sol au nord de l'hôtel, dans
 *   le lot) reste à part : la rue commence au bord du lot (z = -28), ses façades à z = -32,5.
 */
function alentours(m, usure) {
  const ch = new Chantier(2026);
  const W = -78; // 45 m à l'ouest du lot
  const E = 76; // 45 m à l'est
  const N = -70;
  const S = 98; // 60 m de mer au sud
  const LX0 = -33;
  const LX1 = 31;
  const LZ0 = -28;
  const LZ1 = 38;
  const sol = (x1, z1, x2, z2, coul, mat, y = 0) => ch.pave(x1, y - 0.06, z1, x2, y, z2, coul, mat, { crasse: false, nuance: 0 });
  const pave = 0x6a655c; // les pavés sombres de la rue (ceux du fond du lot)

  // --- Le sol : la rue et les cours au nord, le sable des deux côtés, le sable mouillé
  sol(W, N, E, LZ0, pave, m.dalle, -0.03);
  sol(W, LZ0, LX0, -6, pave, m.dalle, -0.03);
  sol(LX1, LZ0, E, -4.6, pave, m.dalle, -0.03);
  sol(W, -32.5, E, -31, 0x8f877a, m.dalle, 0.1); // le trottoir, devant les façades
  sol(W, -6, LX0, 31, COUL.sable, m.sable);
  sol(LX1, -4.6, E, 31, COUL.sable, m.sable);
  for (const [x1, x2] of [[W, LX0], [LX1, E]]) sol(x1, 31, x2, MER.bord + 0.6, COUL.sableMouille, m.sable, -0.005);
  // les murs de la cour de service se prolongent un peu, puis s'écroulent dans le sable
  for (const [x1, x2, z] of [[-41, LX0, -6], [LX1, 38, -4.6]]) {
    ch.pave(x1, 0, z - 0.2, x2, 2.2, z + 0.2, COUL.cremeOmbre, m.dalle, { nuance: 0.03 });
    ch.pave(x1 - 0.05, 2.2, z - 0.28, x2 + 0.05, 2.34, z + 0.28, 0x9a5a3c, m.dalle, { crasse: false });
  }
  for (const [x, z] of [[-42.4, -6], [39.4, -4.6]]) ch.boite(2.2, 1.1, 0.4, COUL.cremeOmbre, { x, y: 0.4, z, rz: x < 0 ? 0.35 : -0.35 }, m.dalle);

  // --- La mer (G-3) : les bandes du lot prolongées à l'est et à l'ouest, puis le large jusqu'à l'horizon
  mer(ch, m, W, LX0, LZ1);
  mer(ch, m, LX1, E, LZ1);
  for (let z = LZ1, i = 0; z < S; z += 15, i++) {
    const coul = new THREE.Color(0x2f6874).lerp(new THREE.Color(0x24515f), Math.min(1, i / 3)).getHex();
    const n = 10;
    for (let j = 0; j < n; j++) panneau(ch, m.enseignes, R.mer, { x: W + (j + 0.5) * ((E - W) / n), y: 0.04, z: z + 7.5, rx: -Math.PI / 2 }, (E - W) / n + 0.01, 15.01, coul);
  }

  // --- La promenade prolongée à l'est (G-1) : 35 m, puis le sable la mange ; une piste continue vers la route du pont
  const PE = LX1 + 35;
  ch.pave(LX1, -0.02, 18, PE, 0.04, 22, COUL.dalleGrise, m.dalle, { crasse: false, nuance: 0 });
  ch.pave(LX1, 0.04, 17.95, PE - 4, 0.14, 18.2, 0xd6cfbf, m.dalle, { crasse: false }); // la bordure côté dunes
  ch.pave(LX1, 0.04, 21.66, PE - 2, 0.18, 21.94, 0xd6cfbf, m.dalle); // le pied de la balustrade
  const lisse = LX1 + 12;
  ch.pave(LX1, 0.9, 21.64, lisse, 1.04, 21.96, 0xe6dfcf, m.dalle, { crasse: false });
  for (let x = LX1; x < lisse - 0.05; x += 2.56) {
    const lx = Math.min(2.56, lisse - x);
    for (const sgn of [-1, 1]) panneau(ch, m.enseignes, R.balustrade, { x: x + lx / 2, y: 0.54, z: 21.8 + sgn * 0.03, ry: sgn > 0 ? 0 : Math.PI }, lx, 0.72);
  }
  for (let x = LX1 + 2.6; x < PE - 3; x += 2.6) {
    if (x > lisse && ch.hasard() < 0.6) continue;
    ch.pave(x - 0.18, 0.04, 21.6, x + 0.18, x < lisse ? 1.12 : ch.entre(0.4, 1.12), 22.0, 0xe6dfcf, m.dalle);
  }
  // des morceaux de lisse tombés sur la plage, des balustres
  for (let i = 0; i < 4; i++) ch.boite(ch.entre(1.6, 2.8), 0.14, 0.32, 0xe6dfcf, { x: lisse + 2 + i * 4.5 + ch.entre(-1, 1), y: 0.1, z: 22.6 + ch.entre(0, 1.6), ry: ch.entre(-0.4, 0.4), rz: 0.05 }, m.dalle);
  // le sable qui recouvre la promenade, de plus en plus vers l'est ; puis la piste de sable tassé
  for (let x = LX1 + 8, i = 0; x < PE + 2; x += ch.entre(3.5, 6), i++) {
    const t = (x - LX1) / 35;
    duneLegere(ch, m, x, 18.4 + ch.entre(0, 3), 2.5 + t * 5, 1.6 + t * 2.6, 0.12 + t * 0.45, t > 0.5 ? COUL.sable : COUL.sableClair, ch.entre(0, 3), t > 0.5);
  }
  ch.pave(PE - 6, 0.0, 18.3, PE, 0.07, 21.7, COUL.sableClair, m.sable, { crasse: false, nuance: 0 });
  ch.pave(PE, -0.02, 18.6, E, 0.035, 21.4, 0xc8b086, m.sable, { crasse: false, nuance: 0 }); // la piste
  for (const x of [PE + 3, PE + 7.5]) boiteAtlas(ch, m, R.bois, 0.12, 1.1, 0.12, 0xc8b79a, { x, y: 0.5, z: 18.2, rz: ch.entre(-0.1, 0.1) }); // des balises de bois

  // --- À l'ouest (G-2), derrière la ganivelle : la promenade se perd sous la dune
  const PO = LX0 - 13;
  ch.pave(PO, -0.02, 18, LX0, 0.04, 22, COUL.dalleGrise, m.dalle, { crasse: false, nuance: 0 });
  ch.pave(PO + 3, 0.04, 21.66, LX0, 0.18, 21.94, 0xd6cfbf, m.dalle);
  for (const x of [LX0 - 2.6, LX0 - 7.8]) ch.pave(x - 0.18, 0.04, 21.6, x + 0.18, x > LX0 - 4 ? 1.12 : 0.6, 22.0, 0xe6dfcf, m.dalle);
  duneLegere(ch, m, LX0 - 5, 19.5, 5, 3.2, 0.35, COUL.sableClair, 0.3, true);
  duneLegere(ch, m, LX0 - 11, 20, 9, 6, 0.8, COUL.sable, -0.2, true);

  // --- Les dunes, les oyats, les rangs de ganivelles, des deux côtés
  const dunes = [
    [-38, 4, 7, 6, 1.0], [-47, -1, 10, 7, 1.4], [-58, 8, 12, 9, 1.8], [-70, 0, 14, 10, 2.2], [-52, 14, 9, 5, 1.0],
    [-66, 16, 10, 7, 1.4], [-42, 27, 6, 3, 0.5], [-61, 26, 9, 4, 0.7], [-74, 24, 8, 6, 1.1],
    [36, 6, 6, 5, 0.9], [44, -1, 9, 6, 1.3], [54, 7, 12, 8, 1.7], [67, 1, 14, 10, 2.1], [48, 13, 8, 5, 0.9],
    [63, 14, 10, 6, 1.2], [40, 27, 6, 3, 0.5], [58, 26, 9, 4, 0.7], [72, 23, 8, 6, 1.0],
  ];
  for (const [x, z, l, p, h] of dunes) duneLegere(ch, m, x, z, l * 1.3, p * 1.1, h * 0.6, ch.hasard() < 0.5 ? COUL.sable : COUL.sableClair, ch.entre(-0.4, 0.4), l < 10);
  for (const [x1, z1, x2, z2] of [
    [LX1 + 0.4, 17.8, LX1 + 16, 17.8], [LX0 - 0.4, 17.8, LX0 - 16, 17.8], [LX0 - 0.4, 22.6, LX0 - 12, 22.6],
    [39, -2, 39, 12], [50, 3, 62, 0], [58, 10, 70, 12], [-40, -1, -40, 12], [-52, 4, -64, 1], [-60, 11, -72, 13],
  ]) ganivelleAtlas(ch, m, [x1, z1], [x2, z2]);
  const oyats = (x, z) => {
    const e = ch.entre(0.7, 1.2);
    const ry = ch.entre(0, Math.PI);
    for (const r of [0, Math.PI / 2]) panneau(ch, m.enseignes, R.oyats, { x, y: 0.42 * e, z, ry: ry + r }, 1.2 * e, 0.9 * e);
  };
  const nOyats = Math.round(36 + 24 * usure);
  for (let i = 0; i < nOyats; i++) {
    const ouest = i % 2 === 0;
    const x = ouest ? ch.entre(W + 2, LX0 - 1) : ch.entre(LX1 + 1, E - 2);
    const z = ch.entre(-4, 26);
    if (z > 16.5 && z < 23.5) continue; // pas sur la promenade
    oyats(x, z);
  }

  // --- La rue de derrière (G-4) : les façades d'en face, une ruelle vers le nord
  const maisons = [
    [-78, -69, 9.5, 0xe0d2b0], [-69, -60, 12, 0xd8b4a0], [-60, -52, 8.5, 0xb9c4c4], [-52, -42, 11, 0xe8e2d4],
    [-42, -33, 9, 0xd8b878], [-33, -24, 12.5, 0xe0d2b0], [-24, -14, 10, 0xc9b8a8], [-14, -7.5, 8, 0xb9c4c4],
    [-4.5, 4, 11.5, 0xd8b4a0], [4, 13, 9, 0xe8e2d4], [13, 22, 12, 0xd8b878], [22, 31, 8.5, 0xb9c4c4],
    [31, 40, 10.5, 0xe0d2b0], [40, 49, 9, 0xd8b4a0], [49, 58, 12, 0xe8e2d4], [58, 67, 8, 0xc9b8a8], [67, 76, 10, 0xd8b878],
  ];
  const ZF = -32.5; // le nu des façades
  const P = 9; // la profondeur des maisons
  maisons.forEach(([x1, x2, h, coul], i) => {
    const l = x2 - x1 - 0.2;
    const cx = (x1 + x2) / 2;
    ch.pave(x1 + 0.1, 0, ZF - P, x2 - 0.1, h, ZF, coul, m.dalle, { nuance: 0.03 });
    // la corniche, et le toit (une croupe d'ardoise ou de tuile)
    ch.pave(x1, h - 0.3, ZF - 0.25, x2, h, ZF + 0.25, COUL.modenature, m.dalle, { crasse: false });
    const toit = uvAtlas(new THREE.ConeGeometry(1, 1, 4, 1, true).rotateY(Math.PI / 4), R.blanc);
    ch.poser(toit, m.enseignes, i % 3 === 1 ? 0x9a5a3c : COUL.ardoise, { x: cx, y: h + 1.6, z: ZF - P / 2, e: [l * 0.72, 3.2, P * 0.72] }, { crasse: false });
    toit.dispose();
    // le rez-de-chaussée : une boutique fermée ; les étages : des fenêtres peintes, des persiennes
    const v = R.vitrines;
    const reg = [v[0] + (i % 4) * 128, v[1], 128, v[3]];
    panneau(ch, m.enseignes, reg, { x: cx, y: 1.7, z: ZF + 0.02 }, Math.min(l - 1, 4.6), 3.2);
    const n = Math.max(2, Math.floor(l / 2.6));
    for (let et = 0; 4.2 + et * 3.1 + 2 < h; et++) {
      for (let j = 0; j < n; j++) {
        const x = x1 + 0.1 + (l * (j + 0.5)) / n;
        const r = ch.hasard();
        const reg2 = r < 0.4 * usure ? R.fenB : r < 0.6 * usure ? R.fenD : r < 0.7 ? R.fenC : R.fenA;
        panneau(ch, m.enseignes, reg2, { x, y: 4.2 + et * 3.1 + 0.95, z: ZF + 0.02 }, 1.1, 1.9);
      }
    }
  });
  // les réverbères du trottoir, éteints (l'un est tombé)
  for (const x of [-64, -44, -24, -2, 18, 38, 58]) {
    const tombe = x === 18;
    boiteAtlas(ch, m, R.fer, 0.12, 4.2, 0.12, 0xffffff, tombe ? { x: x + 2, y: 0.18, z: -29.6, rz: Math.PI / 2 - 0.05, ry: 0.3 } : { x, y: 2.1, z: -31.4 });
    if (!tombe) boiteAtlas(ch, m, R.fer, 0.9, 0.08, 0.1, 0xffffff, { x: x + 0.4, y: 4.15, z: -31.4 });
  }
  // la ruelle vers le nord, entre deux maisons, qui continue au-delà
  ch.pave(-7.5, -0.02, N, -4.5, 0.02, ZF, 0x7a746a, m.dalle, { crasse: false, nuance: 0 });

  const g = ch.construire();
  g.userData.nature = "alentours (R52) : le décor au-delà du lot, sans obstacle";
  return g;
}

const DUNE1 = new THREE.IcosahedronGeometry(1, 1);
const DUNE0 = new THREE.IcosahedronGeometry(1, 0);

/** Une dune des alentours : une seule bosse, à facettes (80 triangles, ou 20 pour les petites). */
function duneLegere(ch, m, x, z, l, p, h, coul, ry = 0, petite = false) {
  ch.poser(petite ? DUNE0 : DUNE1, m.sable, coul, { x, y: -h * 0.35, z, ry, e: [l / 2, h, p / 2] }, { crasse: false, nuance: 0.02 });
}

// ---------- Les intérieurs ----------

/** Des lés de papier peint décollés qui pendent du haut d'un mur (dans la couche de l'hôtel). */
function lambeaux(k, x, z, ry, n, coul = COUL.papier) {
  const { T, m } = k;
  T.repere({ x, z, ry }, () => {
    for (let i = 0; i < n; i++) {
      const lg = T.entre(0.8, 2.2);
      T.boite(0.5, lg, 0.015, coul, { x: (i - n / 2) * 0.7 + T.entre(-0.2, 0.2), y: RDC - 0.2 - lg / 2, z: 0.05, rx: T.entre(0.05, 0.25), rz: T.entre(-0.1, 0.1) }, m.pele, { crasse: false, nuance: 0.05 });
    }
  });
}

/** Des rideaux de velours de part et d'autre d'une fenêtre de la façade sud (côté intérieur, dans la couche). */
function rideauxVelours(k, x, coul = COUL.velours) {
  const { T, m } = k;
  const z = ZS - EP / 2 - 0.1;
  T.pave(x - 1.3, 4.25, z - 0.1, x + 1.3, 4.5, z, coul, m.mat, { crasse: false });
  for (const s of [-1, 1]) {
    if (T.hasard() < 0.2) continue;
    const lg = T.entre(2.4, 3.9);
    T.pave(x + s * 1.0 - 0.22, 4.3 - lg, z - 0.12, x + s * 1.0 + 0.22, 4.3, z - 0.02, coul, m.mat, { crasse: false, nuance: 0.08 });
  }
}

function hall(k) {
  const { c, T, m, usure } = k;
  // Le comptoir de la réception (bois et marbre), son registre
  c.pave(-2.7, 0.06, -5.8, -2.2, 1.05, -1.9, COUL.boisSombre, m.satin, { nuance: 0.03 });
  for (let z = -5.5; z < -2; z += 0.75) c.pave(-2.2, 0.2, z - 0.28, -2.16, 0.9, z + 0.28, COUL.bois, m.satin);
  c.pave(-2.78, 1.05, -5.9, -2.1, 1.12, -1.8, COUL.marbre, m.lisse);
  c.boite(0.45, 0.04, 0.32, 0xe8e0c8, { x: -2.45, y: 1.14, z: -3.6, ry: 0.2 }, m.mat, { crasse: false });
  c.boite(0.3, 0.05, 0.22, 0x2a3a5a, { x: -2.4, y: 1.15, z: -2.5, ry: -0.3 }, m.mat, { crasse: false }); // le tampon encreur
  k.b.obstacle(-2.2, -5.8, -2.2, -1.9, "comptoir de la réception");
  // Derrière : le tableau des clés, l'enseigne RÉCEPTION
  c.pave(-3.69, 0.8, -5.2, -3.6, 3.25, -2.4, COUL.boisSombre, m.satin);
  panneau(c, m.enseignes, R.cles, { x: -3.58, y: 2.0, z: -3.8, ry: Math.PI / 2 }, 2.6, 2.3);
  panneau(T, m.enseignes, R.reception, { x: -3.58, y: 3.75, z: -3.8, ry: Math.PI / 2 }, 2.0, 0.75);
  // H3 : l'ascenseur à grille ; sa cabine attend en bas, la grille fermée (grille_ascenseur_bas)
  cabineAscenseur(k, { x: ASC.x1, z: ASC.z2, ry: 0 }, "grille_ascenseur_bas", RDC, "bas");
  // Le grand escalier de marbre, effondré à mi-volée : les étages sont inaccessibles
  escalier(k);
  // La banquette ronde, le tapis, les lustres
  c.pave(-1.6, 0.06, -6.0, 4.2, 0.075, 0.6, 0x6e2e34, m.mat, { crasse: false, nuance: 0 });
  pouf(c, 1.2, -2.6);
  lustre(c, 1.2, -2.6, "pendu", 3.6, RDC);
  // La borne « Check-in par sourire », les brochures, le chariot à bagages, un palmier mort
  borneCheckin(k, 4.4, 0.6, -0.45);
  presentoir(c, 5.2, -5.4, -1.0);
  chariotBagages(c, -1.7, 0.3, 0.3);
  palmier(c, 4.9, -9.6, 2.0, true, 0.06, 0.7);
  // Les affiches : « Les Flots, bains de mer » au mur est, le menu sur son chevalet
  panneau(c, m.enseignes, R.bainsDeMer, { x: 5.68, y: 2.1, z: -7.6, ry: -Math.PI / 2 }, 1.1, 1.65);
  c.repere({ x: -3.0, z: 1.4, ry: 0.6 }, () => {
    for (const s of [-1, 1]) c.boite(0.04, 1.5, 0.04, COUL.bois, { x: s * 0.32, y: 0.72, rx: -0.12 }, m.mat);
    panneau(c, m.enseignes, R.menu, { y: 1.0, z: 0.05, rx: -0.12 }, 0.75, 0.56);
  });
  // Le sable entré par la porte, les feuilles, les papiers
  dune(c, 1.0, 0.9, 3.4, 1.8, 0.28, m.sable, COUL.sableClair);
  jonchee(c, -2, -6, 5, 1.6, Math.round(20 + 40 * usure), [0xe6e1d2, 0xd8d0bb, 0x9c7a45, 0xb08f55], 0.08);
  debris(c, -3.5, -9, 5.5, 1.5, Math.round(20 * usure), undefined, 0.07);
  lambeaux(k, 5.65, -1, -Math.PI / 2, 3);
  raiDeLumiere(c, [1, 3.6, ZS + 1.2], [1.3, 0.07, -1.0], 2.0);
}

/** Passe un point du repère d'une pose { x, z, ry } au repère H. */
function horsRepere(pose, u, v) {
  const co = Math.cos(pose.ry);
  const si = Math.sin(pose.ry);
  return [pose.x + u * co + v * si, pose.z - u * si + v * co];
}

/**
 * La cabine de l'ascenseur à grille (H3), 2 × 2 m, dans le repère `pose` : la porte de 0 à 2 m sur l'axe local x,
 * la cabine vers -z. Lambris à hauteur d'appui, cage de fer ajourée au-dessus (la caméra voit dedans), miroir piqué,
 * main courante ; la grille à part et nommée (`nomGrille`). `hauteur` : le haut de la cage (plafond du niveau).
 */
function cabineAscenseur(k, pose, nomGrille, hauteur, niveau) {
  const { c, m } = k;
  c.repere(pose, () => {
    c.pave(0.05, 0.06, -1.95, 1.95, 0.1, -0.05, COUL.boisSombre, m.satin, { crasse: false, nuance: 0 });
    // lambris bas sur trois côtés, cage ajourée au-dessus
    c.pave(0.05, 0.1, -2.0, 1.95, 1.1, -1.92, COUL.bois, m.satin);
    c.pave(0.0, 0.1, -2.0, 0.08, 1.1, -0.05, COUL.bois, m.satin);
    c.pave(1.92, 0.1, -2.0, 2.0, 1.1, -0.05, COUL.bois, m.satin);
    panneau(c, m.enseignes, R.grille, { x: 1, y: 1.75, z: -1.96 }, 1.9, 1.3);
    panneau(c, m.enseignes, R.grille, { x: 0.04, y: 1.75, z: -1.0, ry: Math.PI / 2 }, 1.9, 1.3);
    panneau(c, m.enseignes, R.grille, { x: 1.96, y: 1.75, z: -1.0, ry: Math.PI / 2 }, 1.9, 1.3);
    panneau(c, m.enseignes, R.grille, { x: 1, y: 2.42, z: -1.0, rx: -Math.PI / 2 }, 2.0, 2.0);
    c.pave(0.1, 0.92, -1.9, 1.9, 0.97, -1.84, COUL.laiton, m.tole);
    panneau(c, m.enseignes, R.miroir, { x: 1, y: 1.6, z: -1.9 }, 0.9, 0.7);
    // la cage du puits : quatre montants de fer, le linteau de laiton, la grille du puits au-dessus de la cabine
    for (const [u, v] of [[0, 0], [2, 0], [0, -2], [2, -2]]) c.pave(u - 0.05, 0.06, v - 0.05, u + 0.05, hauteur, v + 0.05, COUL.fer, m.tole);
    c.pave(0, 2.4, -0.04, 2, 2.55, 0.04, COUL.laiton, m.tole);
    panneau(c, m.enseignes, R.grille, { x: 1, y: (2.55 + hauteur) / 2, z: 0 }, 2.0, hauteur - 2.55);
    // le bouton d'appel, le cadran des étages (l'aiguille sur « 1 »)
    c.boite(0.12, 0.2, 0.04, COUL.laiton, { x: 2.25, y: 1.3, z: 0.05 }, m.tole);
    c.poser(cylindre(0.2, 0.2, 0.03, 10), m.tole, COUL.laiton, { x: 1, y: 2.75, z: 0.06, rx: Math.PI / 2 });
  });
  // La grille fermée (deux vantaux en accordéon) : le jeu l'efface quand on l'ouvre
  objetNomme(k, nomGrille, niveau === "bas" ? 93 : 94, (e) => {
    e.repere(pose, () => {
      panneau(e, m.enseignes, R.grille, { x: 0.52, y: 1.21, z: 0.06 }, 1.02, 2.3);
      panneau(e, m.enseignes, R.grille, { x: 1.5, y: 1.21, z: 0.1 }, 1.0, 2.3);
    });
  });
  const ob = (u1, v1, u2, v2, nature) => {
    const [x1, z1] = horsRepere(pose, u1, v1);
    const [x2, z2] = horsRepere(pose, u2, v2);
    k.b.obstacle(x1, z1, x2, z2, nature);
  };
  ob(0, -2, 2, -2, "cabine de l'ascenseur");
  ob(0, 0, 0, -2, "cabine de l'ascenseur");
  ob(2, 0, 2, -2, "cabine de l'ascenseur");
  ob(0, 0.08, 2, 0.08, `${nomGrille} (grille fermée : à lever quand le jeu efface la grille)`);
}

/** H4 : la borne « Check-in par sourire » (le meuble), son écran éteint et son écran allumé, à part et nommés. */
function borneCheckin(k, x, z, ry) {
  const { c, m } = k;
  objetNomme(k, "borne_checkin", 95, (e) => {
    e.repere({ x, z, ry }, () => {
      e.boite(0.6, 0.1, 0.5, COUL.abondanceCreme, { y: 0.05 }, m.satin);
      e.boite(0.34, 1.1, 0.28, COUL.abondanceCreme, { y: 0.6 }, m.satin);
      e.boite(0.64, 0.6, 0.1, COUL.abondanceCreme, { y: 1.45, rx: -0.2 }, m.satin);
      e.boite(0.56, 0.06, 0.08, COUL.abondanceRouge, { y: 1.8, rx: -0.2, z: -0.03 }, m.satin);
      e.boite(0.12, 0.02, 0.1, 0x1c1c1a, { x: 0.12, y: 1.15, z: 0.12 }, m.satin); // la fente de la carte
      e.boite(0.2, 0.14, 0.06, 0x1c1c1a, { y: 0.35, z: 0.15 }, m.satin); // la trappe de la batterie, ouverte
    });
  });
  c.repere({ x, z, ry }, () => panneau(c, m.enseignes, R.watty, { x: 0.1, y: 0.75, z: 0.145 }, 0.22, 0.22));
  objetNomme(k, "ecran_borne_eteint", 96, (e) => {
    e.repere({ x, z, ry }, () => e.boite(0.52, 0.52, 0.01, 0x15191c, { y: 1.45, z: 0.056, rx: -0.2 }, m.satin, { crasse: false, nuance: 0 }));
  });
  objetNomme(k, "ecran_borne_allume", 97, (e) => {
    e.repere({ x, z, ry }, () => panneau(e, m.neon, R.sourire, { y: 1.45, z: 0.058, rx: -0.2 }, 0.52, 0.52));
  });
  k.b.obstacle(x - 0.3, z, x + 0.3, z, "borne « Check-in par sourire »");
}


function escalier(k) {
  const { c, m, usure } = k;
  const x1 = -0.6;
  const x2 = 3.4;
  const z0 = -6.6;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const y = (i + 1) * 0.16;
    const za = z0 - i * 0.34;
    if (i === n - 1 && usure > 0.4) continue;
    c.pave(x1, 0.06, za - 0.34, x2, y, za, COUL.marbre, m.lisse, { nuance: 0.02 });
    c.pave(x1 + 0.9, y, za - 0.34, x2 - 0.9, y + 0.015, za, 0x7a2630, m.mat, { crasse: false, nuance: 0 });
  }
  // La volée supérieure tombée : dalles de marbre, gravats, un tapis rouge qui pend
  gravats(c, 1.4, -10.4, 1.8, Math.round(8 + 6 * usure), [COUL.marbre, COUL.cremeOmbre, PALETTE.pierre]);
  c.boite(2.4, 0.25, 1.0, COUL.marbre, { x: 0.8, y: 0.5, z: -10.0, rx: 0.5, rz: 0.2 }, m.lisse);
  c.boite(1.8, 0.25, 0.9, COUL.marbre, { x: 2.4, y: 0.35, z: -11.1, rx: -0.4, rz: -0.25 }, m.lisse);
  c.boite(1.3, 0.02, 2.4, 0x7a2630, { x: 1.4, y: 2.6, z: -9.6, rx: 1.25 }, m.mat, { crasse: false });
  // Les rampes de fer forgé et laiton, les lampadaires de bronze au départ
  for (const x of [x1 + 0.05, x2 - 0.05]) {
    c.tube([x, 1.05, z0], [x, 1.05 + (n - 2) * 0.16, z0 - (n - 2) * 0.34], 0.04, COUL.laiton, m.metal, 5);
    for (let i = 0; i < n - 1; i += 2) c.boite(0.03, 0.9, 0.03, COUL.fer, { x, y: (i + 1) * 0.16 + 0.5, z: z0 - i * 0.34 - 0.17 }, m.tole);
    c.pave(x - 0.14, 0.06, z0 - 0.1, x + 0.14, 1.2, z0 + 0.18, COUL.fonte, m.tole);
    c.tube([x, 1.2, z0 + 0.04], [x, 2.1, z0 + 0.04], 0.04, COUL.laiton, m.metal, 5);
    c.poser(new THREE.IcosahedronGeometry(0.16, 1), m.lisse, 0xe8e2cf, { x, y: 2.2, z: z0 + 0.04 }, { crasse: false });
  }
  // Une barrière de planches posée par des survivants
  for (const y of [0.55, 1.05]) c.boite(4.2, 0.16, 0.04, PALETTE.boisGris, { x: 1.4, y, z: z0 + 0.3, rz: y > 0.8 ? 0.04 : -0.03 }, m.mat, { nuance: 0.06 });
  k.b.obstacle(x1, z0 + 0.3, x2, z0 + 0.3, "barrière devant le grand escalier");
  k.b.obstacle(x1, z0 + 0.3, x1, Z0, "grand escalier effondré");
  k.b.obstacle(x2, z0 + 0.3, x2, Z0, "grand escalier effondré");
}

function salleAManger(k) {
  const { c, m, usure } = k;
  // Les dunes, entrées par les portes-fenêtres béantes
  dune(c, -14.2, 0.6, 6.4, 4.6, 1.15, m.sable, COUL.sable, 0.2);
  dune(c, -10.8, -1.4, 4.6, 3.4, 0.75, m.sable, COUL.sableClair, -0.3);
  dune(c, -15.2, -3.6, 3.2, 3.0, 0.55, m.sable, COUL.sable);
  dune(c, -7.8, 1.0, 3.0, 1.8, 0.32, m.sable, COUL.sableClair);
  semerTouffes(c, -16, -1, -12, 1.6, Math.round(6 + 10 * usure), 0x9aa65e, 0.5);
  // Les tables nappées, certaines à demi ensevelies
  const tables = [[-14.6, -4.4, 0], [-11.8, -4.4, 0], [-8.6, -4.0, 0], [-5.6, -3.8, 0], [-5.4, 0.1, 0], [-8.0, 1.0, -0.35], [-14.4, -0.8, -0.85]];
  for (const [x, z, y] of tables) {
    if (y < 0) c.repere({ x, y, z, rx: 0.12, rz: -0.1 }, () => tableRonde(c, 0, 0, 0.6, true));
    else tableRonde(c, x, z, 0.6, true, c.hasard() < usure * 0.15);
    for (let i = 0; i < 3; i++) {
      const t = (i / 3) * Math.PI * 2 + 0.4;
      if (c.hasard() < 0.2) continue;
      const enseveli = y < 0;
      chaise(c, x + Math.cos(t) * 0.95, z + Math.sin(t) * 0.95, -t - Math.PI / 2, !enseveli && c.hasard() < usure * 0.35, enseveli ? y * 0.7 : 0.06);
    }
    // vaisselle sur les nappes
    if (y === 0) for (let i = 0; i < 2; i++) c.poser(cylindre(0.12, 0.1, 0.02, 8), m.lisse, 0xf0ece2, { x: x + c.entre(-0.3, 0.3), y: 0.78, z: z + c.entre(-0.3, 0.3) }, { crasse: false });
  }
  // Les lustres : l'un tombé sur une table, l'autre pendu de travers
  lustre(c, -8.6, -2.3, "tombe");
  lustre(c, -5.6, -1.8, "pendu", 3.4, RDC);
  // H5 : le robot-serveur ensablé, plateau à la main. Le corps est pris dans la dune ; la tête (tete_robot) dépasse
  // d'un petit monticule de sable (sable_robot) que le jeu efface quand on a creusé.
  const poseRobot = { x: -11.2, y: -0.38, z: -1.0, rx: 0.2, rz: -0.18, ry: 0.5 };
  c.repere(poseRobot, () => {
    c.poser(cylindre(0.32, 0.38, 1.0, 10), m.satin, COUL.abondanceCreme, { y: 0.5 });
    c.poser(cylindre(0.34, 0.34, 0.08, 10), m.satin, COUL.abondanceRouge, { y: 0.95 });
    c.poser(cylindre(0.1, 0.12, 0.12, 6), m.tole, 0x5a5f60, { y: 1.04 }); // le cou, et son pas de vis
    c.tube([0.3, 0.8, 0], [0.62, 1.25, 0.2], 0.05, 0xb9bdbd, m.metal, 5);
    c.poser(cylindre(0.3, 0.3, 0.02, 10), m.metal, COUL.inox, { x: 0.65, y: 1.28, z: 0.25 });
    c.poser(new THREE.SphereGeometry(0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), m.metal, COUL.inox, { x: 0.65, y: 1.29, z: 0.25 });
    c.tube([-0.3, 0.8, 0], [-0.5, 0.45, 0.25], 0.05, 0xb9bdbd, m.metal, 5);
  });
  objetNomme(k, "tete_robot", 98, (e) => {
    e.repere(poseRobot, () => {
      e.poser(new THREE.SphereGeometry(0.3, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), m.satin, COUL.abondanceCreme, { y: 1.06 });
      e.poser(cylindre(0.3, 0.3, 0.06, 10), m.satin, COUL.abondanceRouge, { y: 1.07 });
      // le visage : deux yeux ronds, le grand sourire, l'antenne
      for (const sx of [-0.1, 0.1]) e.boite(0.07, 0.07, 0.03, 0x1c2a33, { x: sx, y: 1.22, z: 0.255, rx: -0.5 }, m.satin, { crasse: false, nuance: 0 });
      e.boite(0.2, 0.035, 0.03, 0x1c2a33, { y: 1.13, z: 0.28, rx: -0.25 }, m.satin, { crasse: false, nuance: 0 });
      for (const sx of [-0.11, 0.11]) e.boite(0.04, 0.035, 0.03, 0x1c2a33, { x: sx, y: 1.15, z: 0.275, rx: -0.25, rz: sx > 0 ? -0.6 : 0.6 }, m.satin, { crasse: false, nuance: 0 });
      e.tube([0, 1.34, 0], [0.03, 1.5, 0], 0.012, 0x8a8e90, m.satin, 4);
      e.boite(0.05, 0.05, 0.05, COUL.abondanceRouge, { x: 0.03, y: 1.52 }, m.satin, { crasse: false });
    });
  });
  objetNomme(k, "sable_robot", 99, (e) => {
    e.repere({ x: -11.15, z: -0.95 }, () => {
      e.poser(new THREE.IcosahedronGeometry(1, 1), m.sable, COUL.sableClair, { y: 0.02, e: [1.0, 0.64, 0.9] }, { crasse: false, nuance: 0.02 });
      e.poser(new THREE.IcosahedronGeometry(1, 0), m.sable, COUL.sable, { x: 0.45, y: 0.1, z: 0.3, e: [0.6, 0.4, 0.5], ry: 0.7 }, { crasse: false, nuance: 0.02 });
    });
  });
  // La desserte et l'argenterie
  c.pave(-11.8, 0.06, -5.88, -8.8, 0.95, -5.35, COUL.boisSombre, m.satin);
  c.pave(-11.85, 0.95, -5.9, -8.75, 1.0, -5.3, COUL.marbre, m.lisse);
  for (let i = 0; i < 5; i++) c.poser(cylindre(0.13, 0.13, 0.12 + c.hasard() * 0.15, 8), m.lisse, 0xf0ece2, { x: -11.4 + i * 0.6, y: 1.07, z: -5.6 }, { crasse: false });
  c.boite(0.5, 0.06, 0.3, 0xb9bdbd, { x: -9.4, y: 1.03, z: -5.55 }, m.metal);
  // Rideaux de velours en lambeaux, papier peint qui tombe, rais de lumière
  for (const x of [-15, -11.8, -8.6, -5.4]) rideauxVelours(k, x);
  lambeaux(k, -10, -5.85, 0, 4, COUL.papierRose);
  debris(c, -16, -5.5, -4, 1.5, Math.round(30 * usure), [0xf0ece2, 0xe6e1d2, COUL.cremeOmbre], 0.07);
  raiDeLumiere(c, [-8.6, 3.8, ZS + 1.5], [-8.0, 0.07, -1.5], 1.4);
  raiDeLumiere(c, [-5.4, 3.8, ZS + 1.5], [-4.8, 0.07, -1.2], 1.4);
}

function barRotonde(k) {
  const { c, m, usure } = k;
  // Le comptoir en arc, face au centre de la rotonde
  const rc = 3.3;
  const t1 = 0.35;
  const t2 = -1.75;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const ta = t1 + ((t2 - t1) * i) / n;
    const tb = t1 + ((t2 - t1) * (i + 1)) / n;
    const a = [ROT.x + Math.cos(ta) * rc, ROT.z + Math.sin(ta) * rc];
    const b2 = [ROT.x + Math.cos(tb) * rc, ROT.z + Math.sin(tb) * rc];
    const { L, ry } = repereMur(a, b2);
    const mx = (a[0] + b2[0]) / 2;
    const mz = (a[1] + b2[1]) / 2;
    c.boite(L + 0.02, 1.05, 0.55, COUL.boisSombre, { x: mx, y: 0.585, z: mz, ry }, m.satin, { nuance: 0.03 });
    c.boite(L + 0.06, 0.06, 0.7, COUL.marbre, { x: mx, y: 1.14, z: mz, ry }, m.lisse);
    k.b.obstacle(a[0], a[1], b2[0], b2[1], "comptoir du bar");
  }
  // Le pied de laiton côté salle
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = t1 + ((t2 - t1) * i) / n;
    pts.push([ROT.x + Math.cos(t) * (rc - 0.4), 0.2, ROT.z + Math.sin(t) * (rc - 0.4)]);
  }
  for (let i = 0; i < n; i++) c.tube(pts[i], pts[i + 1], 0.03, COUL.laiton, m.metal, 4);
  // L'arrière-bar contre le mur plein de la rotonde : étagères de bouteilles, miroir, enseigne
  const pr = sommetsRotonde(ROT.r - EP / 2 - 0.3);
  for (const i of [6, 7]) {
    const a = pr[i];
    const b2 = pr[i + 1];
    const { L, ry } = repereMur([a[0], a[1]], [b2[0], b2[1]]);
    etagere(c, (a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2, L - 0.3, ry + Math.PI, 4, COUL.boisSombre, m.satin, bouteilles, 2.2, 0.35);
  }
  const t6 = (pr[6][2] + pr[7][2]) / 2;
  const t7 = (pr[7][2] + pr[8][2]) / 2;
  const rm = ROT.r - EP / 2 - 0.03;
  panneau(c, m.enseignes, R.miroir, { x: ROT.x + Math.cos(t7) * rm, y: 3.0, z: ROT.z + Math.sin(t7) * rm, ry: -Math.PI / 2 - t7 }, 2.0, 1.2);
  panneau(k.R, m.enseignes, R.bar, { x: ROT.x + Math.cos(t6) * rm, y: 3.4, z: ROT.z + Math.sin(t6) * rm, ry: -Math.PI / 2 - t6 }, 2.2, 0.75);
  // Les tabourets hauts, les bougies sur le comptoir
  for (let i = 0; i < 5; i++) {
    const t = t1 - 0.15 - i * 0.38;
    const x = ROT.x + Math.cos(t) * (rc - 0.85);
    const z = ROT.z + Math.sin(t) * (rc - 0.85);
    if (c.hasard() < usure * 0.35) {
      c.repere({ x, y: 0.25, z, rz: Math.PI / 2, ry: c.hasard() * 3 }, () => {
        c.tube([0, -0.2, 0], [0, 0.6, 0], 0.03, COUL.laiton, m.metal, 4);
        c.poser(cylindre(0.2, 0.2, 0.08, 8), m.satin, COUL.velours, { y: 0.62 });
      });
    } else {
      c.tube([x, 0.06, z], [x, 0.78, z], 0.035, COUL.laiton, m.metal, 4);
      c.poser(cylindre(0.2, 0.2, 0.09, 8), m.satin, COUL.velours, { x, y: 0.82, z });
    }
  }
  for (const d of [0, 0.15, 0.3]) c.poser(cylindre(0.035, 0.035, 0.18 - d * 0.3, 5), m.mat, 0xefe6d0, { x: 20.1 + d * 0.3, y: 1.24, z: -1.1 + d }, { crasse: false });
  // Le salon de la rotonde côté mer : guéridons, fauteuils, palmier
  for (const [t, r] of [[2.0, 3.6], [1.25, 3.8], [2.6, 2.6]]) {
    const x = ROT.x + Math.cos(t) * r;
    const z = ROT.z + Math.sin(t) * r;
    gueridon(c, x, z, c.hasard() < usure * 0.3);
    chaise(c, x + 0.7, z, -Math.PI / 2, c.hasard() < usure * 0.4, 0.06);
    chaise(c, x - 0.7, z + 0.1, Math.PI / 2, false, 0.06);
  }
  palmier(c, ROT.x - 3.9, ROT.z + 1.2, 2.2, true, 0.06, 0.7);
  lustre(c, ROT.x, ROT.z, "pendu", 3.5, RDC);
  // La barricade des survivants qui ferme le salon (un passage de 1,5 m au milieu)
  const a = [X1, ZE1];
  const bb = [XS1, ZS];
  const { L, ry, dx, dz } = repereMur(a, bb);
  c.repere({ x: a[0], z: a[1], ry }, () => {
    for (const [u1, u2] of [[0.2, L / 2 - 0.75], [L / 2 + 0.75, L - 0.2]]) {
      const uc = (u1 + u2) / 2;
      const lu = u2 - u1;
      c.boite(lu, 0.06, 1.0, COUL.boisSombre, { x: uc, y: 0.5, z: 0.3, rx: Math.PI / 2 - 0.1 }, m.satin);
      for (let i = 0; i < 3; i++) c.boite(lu + 0.3, 0.18, 0.04, PALETTE.boisGris, { x: uc, y: 0.6 + i * 0.5, z: -0.05, rz: (i % 2 ? 1 : -1) * 0.08 }, m.mat, { nuance: 0.08 });
      c.boite(0.9, 0.16, 1.9, 0xc9bfa6, { x: uc, y: 1.6, z: -0.25, rx: 0.2, rz: 1.35 }, m.mat, { nuance: 0.06 });
    }
  });
  chaise(c, a[0] + dx * 0.25 - 0.4, a[1] + dz * 0.25, 1.2, true, 0.06);
  chaise(c, a[0] + dx * 0.75 + 0.3, a[1] + dz * 0.75 + 0.3, 2.2, true, 0.06);
  const uA = L / 2 - 0.75;
  const uB = L / 2 + 0.75;
  k.b.obstacle(a[0], a[1], a[0] + (dx * uA) / L, a[1] + (dz * uA) / L, "barricade");
  k.b.obstacle(a[0] + (dx * uB) / L, a[1] + (dz * uB) / L, bb[0], bb[1], "barricade");
  jonchee(c, ROT.x - 3, ROT.z - 2, ROT.x + 2, ROT.z + 4, Math.round(16 + 20 * usure), [0x9c7a45, 0xd8d0bb, 0xb08f55], 0.08);
  dune(c, ROT.x - 1.2, ROT.z + 4.0, 2.6, 1.6, 0.3, m.sable, COUL.sableClair, -0.4);
}

function salon(k) {
  const { c, m, usure } = k;
  // La grande cheminée de marbre, son trumeau, le feu des survivants
  const xc = 11;
  const zc = Z0 + EP / 2;
  c.pave(xc - 1.6, 0.06, zc, xc - 1.15, 1.45, zc + 0.55, COUL.marbreRose, m.lisse);
  c.pave(xc + 1.15, 0.06, zc, xc + 1.6, 1.45, zc + 0.55, COUL.marbreRose, m.lisse);
  c.pave(xc - 1.8, 1.45, zc, xc + 1.8, 1.72, zc + 0.68, COUL.marbreRose, m.lisse);
  c.pave(xc - 1.15, 0.06, zc, xc + 1.15, 1.45, zc + 0.1, COUL.suie ?? 0x2c2926, m.mat);
  c.pave(xc - 1.15, 1.2, zc, xc + 1.15, 1.45, zc + 0.5, COUL.marbreRose, m.lisse);
  c.pave(xc - 1.8, 0.06, zc + 0.55, xc + 1.8, 0.1, zc + 1.4, COUL.marbreNoir, m.lisse, { crasse: false });
  c.pave(xc - 1.0, 0.06, zc + 0.1, xc + 1.0, 0.1, zc + 0.55, 0x2c2926, m.mat, { crasse: false });
  panneau(c, m.enseignes, R.miroir, { x: xc, y: 2.75, z: zc + 0.05 }, 2.4, 1.8);
  for (let i = 0; i < 4; i++) c.boite(0.9, 0.14, 0.14, i % 2 ? 0x5a3a26 : 0x3a2a1e, { x: xc + (i - 1.5) * 0.12, y: 0.17 + (i % 2) * 0.1, z: zc + 0.32, ry: (i - 1.5) * 0.5 }, m.mat);
  for (let i = 0; i < 8; i++) c.boite(0.12, 0.06, 0.1, i % 2 ? 0xff7a2a : 0xd2451c, { x: xc + c.entre(-0.4, 0.4), y: 0.13, z: zc + c.entre(0.2, 0.45), ry: c.hasard() * 3 }, m.mat, { crasse: false });
  k.feu = { x: xc, y: 0.15, z: zc + 0.32 };
  k.b.obstacle(xc - 1.8, zc + 0.7, xc + 1.8, zc + 0.7, "cheminée");
  // Le camp : matelas pris dans les chambres, couvertures polaires, caisses, marmite sur trépied, bidons, bâche tendue
  couchage(c, 8.6, -9.8, 0.35);
  couchage(c, 13.5, -9.7, -0.35);
  couchage(c, 10.2, -7.5, Math.PI / 2 - 0.1);
  caisse(c, 7.2, -11.2, 0.6, 0.2);
  caisse(c, 7.4, -10.5, 0.5, -0.3, 0);
  caisse(c, 15.0, -11.3, 0.6, 0.1);
  for (const s of [-1, 1]) c.poutre([11.8 + s * 0.3, 0.06, -10.6 + 0.2], [11.8, 1.0, -10.6], 0.03, 0x2a2826, m.tole);
  c.poser(cylindre(0.2, 0.17, 0.25, 8), m.tole, 0x2a2826, { x: 11.8, y: 0.7, z: -10.6 });
  for (const [x, z] of [[14.6, -10.4], [14.9, -10.0]]) c.poser(cylindre(0.15, 0.15, 0.45, 6), m.satin, 0x4f6e8a, { x, y: 0.28, z });
  c.tube([6.2, 2.0, -8.4], [15.6, 2.0, -8.0], 0.01, 0x8a7a60, m.mat, 3);
  c.boite(1.6, 1.3, 0.03, 0x6a5a48, { x: 14.2, y: 1.35, z: -8.06, rz: 0.04 }, m.mat, { crasse: false });
  // Le salon : fauteuils club, canapé, guéridon, piano à queue, colonnes de marbre, tableau, tapis
  c.pave(7.2, 0.06, -6.6, 14.8, 0.075, -1.6, 0x5a3438, m.mat, { crasse: false, nuance: 0 });
  fauteuil(c, 7.8, -4.6, 2.3);
  fauteuil(c, 13.8, -5.2, -2.3, 0x5e3a2c, usure > 0.6);
  fauteuil(c, 12.6, -2.4, -0.6);
  canape(c, 10.4, -5.6, 0, COUL.veloursVert, 2.3);
  gueridon(c, 10.4, -3.8);
  piano(c, 8.4, -1.0, 0.4, usure > 0.4);
  for (const x of [8.4, 13.4]) {
    c.pave(x - 0.4, 0.06, -7.3, x + 0.4, 0.4, -6.5, COUL.marbre, m.lisse);
    c.tube([x, 0.4, -6.9], [x, RDC - 0.45, -6.9], 0.27, COUL.marbre, m.lisse, 10);
    c.pave(x - 0.42, RDC - 0.45, -7.32, x + 0.42, RDC, -6.48, COUL.modenature, m.lisse);
    k.b.obstacle(x - 0.4, -6.9, x + 0.4, -6.9, "colonne");
  }
  panneau(c, m.enseignes, R.tableau, { x: 5.92, y: 2.4, z: -6.0, ry: Math.PI / 2 }, 1.6, 1.2);
  lustre(c, 10.4, -4.6, "pendu", 3.5, RDC);
  palmier(c, 6.6, 1.3, 2.2, true, 0.06, 0.7);
  for (const x of [7.4, 10.6]) rideauxVelours(k, x, COUL.veloursVert);
  lambeaux(k, 5.95, -9.5, Math.PI / 2, 3, COUL.papierVert);
  jonchee(c, 6, -11.5, 15.5, 1.5, Math.round(20 + 30 * usure), [0x9c7a45, 0xd8d0bb, 0xb08f55], 0.08);
  debris(c, 6, -11.5, 15.5, 1.5, Math.round(16 * usure), undefined, 0.07);
}

function cuisines(k) {
  const { c, T, m, usure } = k;
  pianoCuisson(c, -7.6, -8.6);
  k.b.obstacle(-9.4, -9.25, -5.8, -9.25, "piano de cuisson");
  k.b.obstacle(-9.4, -7.95, -5.8, -7.95, "piano de cuisson");
  // La plonge, les tables, les étagères de casseroles
  c.pave(-10.8, 0.06, -11.85, -8.4, 0.9, -11.15, COUL.inox, m.satin);
  for (const x of [-10.2, -9.0]) c.pave(x - 0.45, 0.6, -11.75, x + 0.45, 0.91, -11.25, 0x5a5e60, m.metal);
  c.tube([-9.6, 0.9, -11.8], [-9.6, 1.3, -11.8], 0.025, COUL.inox, m.metal, 4);
  tableInox(c, -5.2, -11.35, 1.8, 0.7);
  tableInox(c, -10.5, -6.9, 2.0, 0.8, 0.05);
  etagere(c, -4.25, -10.5, 2.2, -Math.PI / 2, 4, COUL.inox, m.satin, (ch, y, l) => {
    for (let x = -l / 2 + 0.25; x < l / 2; x += 0.6) if (ch.hasard() < 0.6) ch.poser(cylindre(0.18, 0.16, 0.22, 8), m.metal, ch.hasard() < 0.5 ? 0xb08060 : COUL.inox, { x, y: y + 0.11 });
  }, 2.0, 0.5);
  photophore(c, -5.2, 0.92, -11.35);
  // Casseroles par terre, assiettes brisées
  for (let i = 0; i < 4; i++) c.poser(cylindre(0.16, 0.14, 0.14, 8), m.metal, i % 2 ? 0xb08060 : COUL.inox, { x: c.entre(-11, -4.5), y: 0.12, z: c.entre(-9.5, -6.5), rz: c.hasard() < 0.5 ? Math.PI / 2 : 0, ry: c.hasard() * 3 });
  debris(c, -11, -11.5, -4.2, -6.4, Math.round(30 * usure), [0xf0ece2, 0xe6e1d2, COUL.inox], 0.07);
  // Les chambres froides : portes isolantes (grandes ouvertes), étagères de conserves
  for (const [x, ang] of [[-15.2, 1.7], [-12.4, 1.5]]) {
    c.repere({ x: x - 0.62, z: -9.41, ry: -ang }, () => {
      c.boite(1.2, 2.05, 0.14, 0xe6e6e0, { x: 0.6, y: 1.09 }, m.satin);
      c.boite(0.06, 0.3, 0.08, COUL.inox, { x: 1.05, y: 1.1, z: 0.1 }, m.metal);
    });
    panneau(c, m.enseignes, R.froid, { x: x + 0.9, y: 1.6, z: -9.38 }, 0.42, 0.42);
  }
  for (const [x, z, l, ry] of [[-15.2, -11.65, 2.4, 0], [-12.4, -11.65, 2.4, 0]]) etagere(c, x, z, l, ry, 4, COUL.inox, m.satin, conserves, 1.8, 0.45);
  for (let i = 0; i < 5; i++) c.poser(cylindre(0.09, 0.09, 0.18, 6), m.tole, [0xa8433a, 0x2f6f73, 0xc79a3b][i % 3], { x: c.entre(-15.8, -14.2), y: 0.15, z: c.entre(-10.8, -9.9), rz: Math.PI / 2, ry: c.hasard() * 3 }, { crasse: false });
  caisse(c, -12.8, -10.4, 0.5, 0.3, 0.06);
  c.poser(cylindre(0.3, 0.3, 0.8, 10), m.mat, PALETTE.bois, { x: -11.8, y: 0.46, z: -10.0 });
  panneau(T, m.enseignes, R.cuisine, { x: -3.92, y: 2.9, z: -8.0, ry: -Math.PI / 2 }, 1.6, 0.4);
}

/**
 * L'aile ouest (les anciennes chambres du rez-de-chaussée) : les planchers des étages ont cédé, on la voit par les
 * fenêtres condamnées et le plafond crevé, on n'y entre pas (murée côté salle à manger).
 */
function aileOuest(k) {
  const { c, m, usure } = k;
  gravats(c, -23.5, -4.5, 3.2, Math.round(10 + 8 * usure), [COUL.cremeOmbre, COUL.creme, PALETTE.pierre, PALETTE.boisGris]);
  gravats(c, -20.3, -1.5, 1.8, Math.round(5 + 5 * usure), [COUL.cremeOmbre, COUL.creme, PALETTE.pierre]);
  for (const [a, b2] of [[[-27, -9, 0.1], [-22, -4, 2.6]], [[-25, -1, 0.1], [-19.8, -6, 1.9]], [[-28.5, -3, 0.2], [-24, 0.6, 0.4]]]) c.poutre(a, b2, 0.24, PALETTE.boisSombre, m.mat);
  litFer(c, -27.4, -9.6, 0.4);
  c.boite(1.6, 0.08, 2.2, 0x6f5a48, { x: -21.2, y: 0.5, z: -8.6, rx: 0.3, rz: -0.2 }, m.mat); // un pan de plancher tombé
  raiDeLumiere(c, [-20.3, RDC + 2, -3.0], [-20.3, 0.07, -3.0], 1.8);
}

// ---------- L'étage (H2, H3, H7, H8, H11) ----------
//
// Posé au sol au nord de l'hôtel (x de -20 à 6, z de -26,6 à -15,6). Le couloir court d'ouest en est ; au sud (côté
// mer) : la suite et sa salle de bains, la chambre 7 et sa salle de bains, la chambre 8 au balcon effondré, la chambre 9,
// le palier de l'ascenseur ; au nord (côté rue) : la lingerie, la chambre 11, l'office d'étage, la machinerie de
// l'ascenseur. Les murs du fond (nord, ouest) montent à 3,2 m ; ceux qui sont du côté de la caméra (sud, est) et les
// cloisons sont coupés (1 m et 1,3 m), comme une maquette en coupe. Autour, la terrasse de zinc du premier étage.
// Cinq matières seulement (papier peint, parquet, mat, satiné, atlas) : la tôle, le métal et (depuis la 0.10) le
// carrelage y prennent la finition satinée.

function etage(k) {
  const { c, m, usure } = k;
  const sauve = { tole: m.tole, metal: m.metal };
  m.tole = m.satin;
  m.metal = m.satin;

  // Les sols : parquet des chambres et du couloir, carrelage des salles de bains et du palier, ciment de la machinerie
  const sol = (x1, z1, x2, z2, mat, coul) => c.pave(x1, 0, z1, x2, 0.06, z2, coul, mat, { crasse: false, nuance: 0 });
  sol(EX0, EC2, EX1, EZS, m.parquet, 0xb39878);
  sol(EX0, EC1, 2, EC2, m.parquet, 0xa98e6c);
  sol(EX0, EZ0, 2, EC1, m.parquet, 0xb59a78);
  // (0.10 : le carrelage des salles de bains et du palier en céramique unie, satinée : un appel de dessin de moins)
  sol(EX0, EC2, -17.6, EZS, m.satin, 0xdfe6df);
  sol(-12, EC2, -9.6, -17.8, m.satin, 0xd8e2df);
  sol(2, EC1, EX1, EZS, m.satin, 0xd9d2c4);
  sol(2, EZ0, EX1, EC1, m.mat, 0x8a8478);
  // La terrasse de zinc du premier étage, tout autour (avec son chéneau) : on est « en haut »
  const zinc = (x1, z1, x2, z2) => c.pave(x1, -0.02, z1, x2, 0.03, z2, COUL.zinc, m.mat, { crasse: false, nuance: 0.03 });
  zinc(EX0 - 1.8, EZ0 - 1.4, EX1 + 1.8, EZ0);
  zinc(EX0 - 1.8, EZS, EX1 + 1.8, EZS + 1.8);
  zinc(EX0 - 1.8, EZ0, EX0, EZS);
  zinc(EX1, EZ0, EX1 + 1.8, EZS);
  c.pave(EX0 - 1.9, 0.03, EZS + 1.75, EX1 + 1.9, 0.22, EZS + 1.9, COUL.zinc, m.mat, { crasse: false });
  for (const x of [-16, -8, 0]) c.pave(x - 0.12, 0.03, EZS + 0.3, x + 0.12, 0.09, EZS + 1.75, 0x7a8285, m.mat, { crasse: false });

  // ===== Les murs =====
  const papier = (coul = COUL.papier) => ({ couleur: COUL.cremeOmbre, mat: m.mat, interieur: { couleur: coul, mat: m.papier } });
  const cloison = (coul = COUL.papier) => ({ ep: 0.15, h: 1.3, cut: 0, couleur: coul, mat: m.papier });
  const porte = (u, l = 1.4, haut = 2.3) => ({ u, l, bas: 0, haut, type: "vide" });
  const fen = (u, l = 1.3) => ({ u, l, bas: 1.0, haut: 2.7, type: "vide" });
  // Nord (côté rue) et ouest : pleine hauteur, fenêtres peintes
  const fenNord = [-17.2, -12.6, -6.2, -0.25, 4];
  murCoupe(k, [EX1, EZ0], [EX0, EZ0], { h: EH, cut: 0, ep: 0.4, ...papier(COUL.papier), ouvertures: fenNord.map((x) => fen(EX1 - x)) });
  for (const x of fenNord) fenAtlas(k, c, { x, y: 1.0, z: EZ0, ry: 0 }, 1.3, 1.7, false);
  murCoupe(k, [EX0, EZ0], [EX0, EZS], { h: EH, cut: 0, ep: 0.4, ...papier(COUL.faience), ouvertures: [fen(-24.6 - EZ0), fen(-17.9 - EZ0, 1.1)] });
  for (const z of [-24.6, -17.9]) fenAtlas(k, c, { x: EX0, y: 1.0, z, ry: Math.PI / 2 }, z > -20 ? 1.1 : 1.3, 1.7, false);
  // Sud (côté mer) et est : coupés à hauteur d'allège ; la porte-fenêtre du balcon effondré
  murCoupe(k, [EX0, EZS], [EX1, EZS], { h: ECUT, cut: 0, ep: 0.4, couleur: COUL.cremeOmbre, mat: m.mat, interieur: { couleur: COUL.papier, mat: m.papier }, ouvertures: [porte(BALCON_E.x - EX0, 1.4, 2.4)] });
  murCoupe(k, [EX1, EZS], [EX1, EZ0], { h: ECUT, cut: 0, ep: 0.4, couleur: COUL.cremeOmbre, mat: m.mat, interieur: { couleur: COUL.papier, mat: m.papier }, ouvertures: [] });
  // les appuis des fenêtres côté mer (pierre), un tous les 2,5 m
  for (const x of [-18.8, -14.8, -10.6, -8.4, -1.2, 0.8]) c.pave(x - 0.75, ECUT, EZS - 0.22, x + 0.75, ECUT + 0.08, EZS + 0.28, COUL.modenature, m.mat, { crasse: false });
  // Le couloir : ses deux murs, les portes des chambres
  murCoupe(k, [EX0, EC2], [2, EC2], { ...cloison(COUL.papierRose), ouvertures: [porte(-15.6 - EX0), porte(-8.3 - EX0), porte(-4.5 - EX0), porte(-0.4 - EX0)] });
  murCoupe(k, [EX0, EC1], [EX1, EC1], { ...cloison(COUL.papierRose), ouvertures: [porte(-15 - EX0), porte(-6 - EX0), porte(-0.25 - EX0), porte(4 - EX0)] });
  // Les cloisons des chambres côté mer
  murCoupe(k, [-17.6, EC2], [-17.6, EZS], { ...cloison(COUL.faience), ouvertures: [porte(-18.4 - EC2, 1.3)] });
  for (const x of [-12, -7, -2, 2]) murCoupe(k, [x, EC2], [x, EZS], { ...cloison(x < -7 ? COUL.papierRose : COUL.papierVert), ouvertures: [] });
  // La salle de bains de la chambre 7, dans l'angle
  murCoupe(k, [-9.6, EC2], [-9.6, -17.8], { ...cloison(COUL.faience), ouvertures: [porte(-19.0 - EC2, 1.3)] });
  murCoupe(k, [-12, -17.8], [-9.6, -17.8], { ...cloison(COUL.faience), ouvertures: [] });
  // Les cloisons côté rue
  for (const x of [-10, -2.5, 2]) murCoupe(k, [x, EZ0], [x, EC1], { ...cloison(x === 2 ? COUL.cremeOmbre : COUL.papierVert), ouvertures: [] });

  // ===== Le couloir et le palier =====
  c.pave(EX0 + 0.3, 0.06, EC1 + 0.45, 1.6, 0.075, EC2 - 0.45, 0x7a2630, m.mat, { crasse: false, nuance: 0 }); // le tapis rouge
  c.pave(EX0 + 0.3, 0.075, EC1 + 0.5, 1.6, 0.08, EC1 + 0.56, COUL.laiton, m.satin, { crasse: false, nuance: 0 });
  c.pave(EX0 + 0.3, 0.075, EC2 - 0.56, 1.6, 0.08, EC2 - 0.5, COUL.laiton, m.satin, { crasse: false, nuance: 0 });
  // un plateau de room service renversé, une chaise, des papiers
  c.poser(cylindre(0.25, 0.25, 0.02, 10), m.satin, COUL.inox, { x: -10.6, y: 0.08, z: -21.0, rx: 0.1 });
  c.poser(new THREE.SphereGeometry(0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), m.satin, COUL.inox, { x: -10.0, y: 0.07, z: -21.5, rz: 1.6 });
  chaise(c, -2.4, -21.9, 2.2, true, 0.06);
  joncheeA(c, EX0 + 0.5, EC1 + 0.3, 1.5, EC2 - 0.3, Math.round(10 + 14 * usure), [0xe6e1d2, 0xd8d0bb, 0x9c7a45], 0.09);
  // Le palier : l'ascenseur à grille (H3), la banquette, le palmier mort, le numéro de l'étage
  cabineAscenseur(k, { x: ASC_H.x1, z: ASC_H.z1, ry: -Math.PI / 2 }, "grille_ascenseur_haut", EH, "haut");
  c.pave(2.25, 0.06, -17.2, 2.85, 0.45, -15.9, COUL.velours, m.mat);
  c.pave(2.2, 0.45, -17.25, 2.35, 0.95, -15.85, COUL.velours, m.mat);
  palmier(c, 3.0, -21.6, 1.8, true, 0.06, 0.6);
  // ===== La suite : salle de bains, lit à baldaquin, guéridon, malle =====
  baignoire(c, -19.3, -16.9, 0);
  k.b.obstacle(-19.7, -17.7, -19.7, -16.1, "baignoire");
  k.b.obstacle(-18.9, -17.7, -18.9, -16.1, "baignoire");
  lavabo(c, -19.3, -19.8, 0);
  c.boite(0.6, 0.03, 0.9, COUL.linge, { x: -18.4, y: 0.08, z: -16.8, ry: 0.5 }, m.mat, { crasse: false });
  c.pave(EX0 + 0.25, 1.4, -19.0, EX0 + 0.45, 2.2, -18.3, 0xf0ece2, m.satin); // l'armoire à pharmacie
  c.pave(-17.4, 0.06, -19.9, -12.2, 0.075, -15.9, 0x7a4a3a, m.mat, { crasse: false, nuance: 0 }); // le tapis
  litBaldaquin(c, -13.6, -17.6, 0);
  k.b.obstacle(-14.45, -18.7, -14.45, -16.5, "lit à baldaquin");
  k.b.obstacle(-12.75, -18.7, -12.75, -16.5, "lit à baldaquin");
  gueridon(c, -16.2, -16.6, false);
  armoire(c, -12.45, -19.5, -Math.PI / 2);
  fauteuil(c, -16.6, -18.4, 0.9, COUL.velours);
  c.repere({ x: -13.6, z: -15.95 }, () => {
    c.boite(1.0, 0.5, 0.55, 0x5e3f2a, { y: 0.31 }, m.satin);
    c.boite(1.02, 0.04, 0.57, COUL.laiton, { y: 0.45 }, m.satin);
  });
  photophoreEteint(c, -16.0, 0.74, -16.75);
  // H8 : la lanterne-tempête, sur le guéridon
  objetNomme(k, "lanterne_tempete", 101, (e) => lanterne(e, -16.35, 0.74, -16.5));
  // ===== La chambre 7 (H2 : la carte de la borne l'ouvre) =====
  baignoire(c, -11.5, -19.0, 0);
  k.b.obstacle(-11.9, -19.8, -11.9, -18.2, "baignoire");
  lavabo(c, -10.3, -18.15, Math.PI);
  litDouble(c, -8.3, -16.8, -Math.PI / 2, 0x8a6a7a);
  k.b.obstacle(-9.4, -17.65, -7.2, -17.65, "lit");
  c.pave(-7.6, 0.06, -19.9, -7.1, 0.6, -19.3, COUL.bois, m.satin); // la table de nuit
  c.boite(0.5, 0.06, 0.35, 0x2f2a28, { x: -11.0, y: 0.09, z: -16.4, ry: 0.3 }, m.mat); // la valise, ouverte
  c.boite(0.5, 0.35, 0.05, 0x2f2a28, { x: -11.1, y: 0.25, z: -16.6, ry: 0.3, rx: -0.4 }, m.mat);
  c.pave(-11.9, 1.0, -15.85, -11.0, 1.04, -15.7, 0xd9cdb8, m.mat, { crasse: false }); // un rideau tombé sur l'appui
  // la plaque « 7 » sur la porte
  c.boite(0.22, 0.22, 0.02, COUL.laiton, { x: -8.3 - 0.85, y: 1.15, z: EC2 - 0.09 }, m.satin, { crasse: false });
  // ===== La chambre 8 au balcon effondré (H7) : on rapiéçait le toit avec des tôles (H8) =====
  litFer(c, -6.0, -18.6, Math.PI / 2);
  k.b.obstacle(-6.95, -19.05, -5.05, -19.05, "lit");
  c.poser(cylindre(0.18, 0.15, 0.3, 8), m.satin, 0x6a7a80, { x: -5.4, y: 0.21, z: -16.5 }); // un seau sous la fuite
  c.pave(-6.6, 0.06, -17.2, -5.2, 0.075, -15.9, 0x5a6a6a, m.mat, { crasse: false }); // la flaque, le plâtre trempé
  gravats(c, -5.6, -16.4, 0.8, Math.round(3 + 4 * usure), [COUL.cremeOmbre, COUL.creme, PALETTE.pierre]);
  objetNomme(k, "toles", 102, (e) => {
    for (let i = 0; i < 4; i++) toleOndulee(e, -2.9 + e.entre(-0.06, 0.06), 0.07 + i * 0.06, -17.6 + e.entre(-0.08, 0.08), e.entre(-0.06, 0.06), i % 2 ? 0x9aa3a5 : 0x8a7a68);
    toleOndulee(e, -2.9, 0.33, -17.5, 0.25, 0x7a6a5a); // la dernière, de travers, rouillée
  });
  k.b.obstacle(-3.4, -18.6, -3.4, -16.6, "pile de tôles");
  balconEffondre(k);
  // ===== La chambre 9 : lit de fer, cabinet de toilette =====
  litFer(c, -1.2, -17.0, 0);
  k.b.obstacle(-1.7, -17.95, -1.7, -16.05, "lit");
  lavabo(c, 1.75, -16.6, -Math.PI / 2);
  c.boite(0.5, 0.03, 0.4, COUL.linge, { x: 1.2, y: 0.08, z: -17.8, ry: 0.2 }, m.mat, { crasse: false });
  // ===== La lingerie : draps qui pendent, étagères, calandre ; les couvertures de laine (H8) =====
  etagere(c, -17.4, -26.05, 4.4, 0, 4, COUL.boisClair, m.mat, linge, 2.2, 0.5);
  calandre(c, -18.2, -23.3);
  k.b.obstacle(-19.5, -23.3, -16.9, -23.3, "calandre");
  chariotLinge(c, -11.0, -23.2, 0.3);
  c.pave(-15.8, 0.06, -26.25, -13.8, 0.85, -25.25, COUL.boisClair, m.mat); // la grande table à plier
  k.b.obstacle(-15.8, -25.25, -13.8, -25.25, "table de la lingerie");
  for (const z of [-24.3, -23.4]) {
    c.tube([-19.8, 2.1, z], [-10.2, 2.1, z], 0.01, 0x8a7a60, m.mat, 3);
    for (let x = -13.0; x < -10.6; x += 1.25) {
      if (c.hasard() < 0.2) continue;
      const lg = c.entre(1.0, 1.4);
      c.boite(1.1, lg, 0.02, c.hasard() < 0.7 ? COUL.linge : 0xd8e0e2, { x: x + 0.55, y: 2.1 - lg / 2, z, rx: c.entre(-0.06, 0.06), rz: c.entre(-0.03, 0.03) }, m.mat, { crasse: false, nuance: 0.04 });
    }
  }
  panneau(c, m.enseignes, R.lingerie, { x: -15, y: 1.75, z: EC1 + 0.09 }, 1.2, 0.3);
  objetNomme(k, "couvertures_laine", 103, (e) => {
    const tons = [0xe8dcc0, 0x8a8478, 0x9a3a32, 0xc8b48c, 0x6e5a44];
    tons.forEach((t, i) => e.boite(0.85, 0.11, 0.6, t, { x: -14.6 + e.entre(-0.04, 0.04), y: 0.91 + i * 0.11, z: -25.75, ry: e.entre(-0.08, 0.08) }, m.mat, { nuance: 0.04, crasse: false }));
    e.boite(0.86, 0.02, 0.61, 0x9a3a32, { x: -14.6, y: 1.465, z: -25.75 }, m.mat, { crasse: false }); // la bande écossaise
  });
  // ===== La chambre 11 (sur la cour) =====
  litDouble(c, -8.0, -25.2, 0, 0x5a7a6a);
  k.b.obstacle(-9.1, -24.0, -6.9, -24.0, "lit");
  lavabo(c, -3.4, -26.1, 0);
  armoire(c, -9.55, -23.4, Math.PI / 2);
  c.boite(0.7, 0.3, 0.45, 0x6e4a32, { x: -4.4, y: 0.21, z: -23.2, ry: 0.4 }, m.satin);
  // ===== L'office d'étage : produits ménagers, chariot de ménage =====
  etagere(c, 0, -26.1, 3.4, 0, 4, 0xd8d0bc, m.mat, (ch, y, l) => {
    for (let x = -l / 2 + 0.15; x < l / 2 - 0.1; x += 0.22) if (ch.hasard() < 0.6) ch.boite(0.12, 0.26, 0.12, [0x3f8fc0, 0xe0c040, 0xd85a4a, 0xe8e6da][Math.floor(ch.hasard() * 4)], { x, y: y + 0.13 }, m.satin, { crasse: false });
  }, 1.9, 0.4);
  chariotLinge(c, -1.4, -23.6, -0.5, usure > 0.4);
  // ===== La machinerie de l'ascenseur : le treuil, l'établi ; les roulements et le fer à souder (H8) =====
  c.repere({ x: 4.6, z: -25.4 }, () => {
    c.pave(-1.0, 0.06, -0.6, 1.0, 0.3, 0.6, 0x3a4a44, m.satin); // le socle
    c.poser(cylindre(0.45, 0.45, 1.0, 12), m.satin, 0x5a6a62, { y: 0.8, rz: Math.PI / 2 }); // le tambour
    for (const s2 of [-1, 1]) c.pave(s2 * 0.6 - 0.06, 0.3, -0.35, s2 * 0.6 + 0.06, 1.3, 0.35, 0x3a4a44, m.satin);
    c.pave(-1.0, 0.3, 0.2, -0.6, 0.9, 0.6, 0x2f5a46, m.satin); // le moteur
    for (let i = 0; i < 6; i++) c.tube([-0.4 + i * 0.15, 0.8, 0.45], [-0.3 + i * 0.12, 3.0, 1.6], 0.012, 0x2a2826, m.satin, 3); // les câbles
  });
  k.b.obstacle(3.6, -24.8, 5.6, -24.8, "treuil de l'ascenseur");
  c.pave(2.12, 0.06, -25.8, 2.8, 0.88, -23.2, COUL.bois, m.satin); // l'établi
  c.pave(2.1, 0.88, -25.85, 2.85, 0.93, -23.15, 0x6a5038, m.satin);
  k.b.obstacle(2.8, -25.8, 2.8, -23.2, "établi");
  c.poser(cylindre(0.12, 0.12, 0.3, 8), m.satin, 0x8a7a40, { x: 2.45, y: 1.08, z: -23.4 }); // la burette
  objetNomme(k, "roulements", 104, (e) => {
    e.boite(0.4, 0.14, 0.3, 0x6a5038, { x: 2.48, y: 1.0, z: -24.9, ry: 0.1 }, m.satin);
    for (const [dx, dz] of [[-0.1, -0.06], [0.08, 0.05], [0.0, -0.02]]) e.poser(cylindre(0.06, 0.06, 0.04, 10), m.satin, COUL.inox, { x: 2.48 + dx, y: 1.09, z: -24.9 + dz });
  });
  objetNomme(k, "fer_a_souder", 105, (e) => {
    e.tube([2.45, 0.97, -24.2], [2.5, 0.97, -23.85], 0.025, 0x6e4a2e, m.satin, 6); // le manche
    e.tube([2.5, 0.97, -23.85], [2.55, 0.97, -23.6], 0.012, COUL.inox, m.satin, 4); // la panne
    e.boite(0.14, 0.03, 0.16, 0x3a3a38, { x: 2.5, y: 0.945, z: -23.75 }, m.satin); // le support
  });
  c.tube([2.4, 0.95, -24.25], [2.3, 0.0, -24.6], 0.008, 0x1c1c1a, m.satin, 3); // le cordon
  debris(c, 2.3, -26.2, 5.8, -22.8, Math.round(10 * usure), [0x6a6a66, 0x8a8478], 0.07);

  m.tole = sauve.tole;
  m.metal = sauve.metal;
}

/** Le balcon effondré de la chambre 8 (côté mer) : il reste le départ de la dalle, une console, le garde-corps tordu. */
function balconEffondre(k) {
  const { c, m } = k;
  const x = BALCON_E.x;
  const z0 = EZS + 0.2;
  // le départ de la dalle, cassé en dents de scie, et une console
  c.pave(x - 0.9, -0.02, z0, x + 0.9, 0.08, z0 + 0.45, COUL.modenature, m.mat);
  for (let i = 0; i < 5; i++) c.boite(0.36, 0.1, c.entre(0.1, 0.35), COUL.modenature, { x: x - 0.72 + i * 0.36, y: 0.03, z: z0 + 0.5, rx: c.entre(-0.2, 0.1) }, m.mat);
  c.pave(x + 0.6, -0.4, z0, x + 0.78, 0.0, z0 + 0.6, COUL.modenature, m.mat);
  // le garde-corps tordu, penché dans le vide, une barre arrachée
  panneau(c, m.enseignes, R.balconTordu, { x: x - 0.55, y: 0.45, z: z0 + 0.6, rx: 0.55, ry: 0.35, rz: -0.12 }, 1.2, 0.92);
  panneau(c, m.enseignes, R.balcon, { x: x + 0.9, y: 0.46, z: z0 + 0.25, ry: Math.PI / 2 + 0.2 }, 0.6, 0.92);
  c.tube([x - 1.0, 0.95, z0 + 0.2], [x + 0.2, 0.7, z0 + 1.2], 0.025, COUL.fer, m.satin, 4);
  // le linteau de la porte-fenêtre, ses vantaux arrachés
  c.repere({ x: x - 0.7, z: EZS - 0.2, ry: 1.9 }, () => c.boite(0.7, 2.2, 0.05, 0xe9e1cd, { x: 0.35, y: 1.15 }, m.satin, { nuance: 0.05 }));
  // les bords du balcon (on saute par le côté effondré : FICHE.sensUnique)
  k.b.obstacle(x - 0.95, EZS, x - 0.95, z0 + 0.7, "garde-corps tordu du balcon");
  k.b.obstacle(x + 0.95, EZS, x + 0.95, z0 + 0.7, "garde-corps du balcon");
}

/** Un lit double à tête de bois, couvre-lit passé ; tête au −z local. */
function litDouble(c, x, z, ry, couvreLit) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.5, 0.35, 2.0, COUL.bois, { y: 0.25 }, m.satin);
    c.boite(1.4, 0.2, 1.9, 0xd9d0bb, { y: 0.52 }, m.mat, { nuance: 0.05 });
    c.boite(1.46, 0.06, 1.3, couvreLit, { y: 0.64, z: 0.3, rx: 0.03 }, m.mat, { nuance: 0.06, crasse: false });
    for (const s of [-0.38, 0.38]) c.boite(0.55, 0.14, 0.38, 0xece6d6, { x: s, y: 0.68, z: -0.72 }, m.mat, { crasse: false });
    c.boite(1.5, 1.0, 0.08, COUL.boisSombre, { y: 0.75, z: -1.0 }, m.satin);
  });
}

/** Une tôle ondulée de 2 × 0,9 m (cinq ondes), à plat ; `ry` : son orientation. */
function toleOndulee(e, x, y, z, ry, teinte, rx = 0) {
  const m = matieres();
  e.repere({ x, y, z, ry: ry + Math.PI / 2, rx }, () => {
    e.boite(2.0, 0.015, 0.9, teinte, {}, m.tole, { nuance: 0.06, crasse: false });
    for (let i = 0; i < 5; i++) e.boite(2.0, 0.03, 0.06, teinte, { y: 0.02, z: -0.36 + i * 0.18 }, m.tole, { nuance: 0.04, crasse: false });
  });
}

/** Un photophore éteint (la bougie de la suite : elle n'est là que pour la lumière de nuit). */
function photophoreEteint(c, x, y, z) {
  photophore(c, x, y, z);
}


// ---------- Les animations : rideaux, écume, flammes ----------

function animations(k) {
  const { b, m } = k;
  const anime = new THREE.Object3D();
  const fondus = [];
  let ecume = null;
  {
    const ch = new Chantier(5);
    const mat = new THREE.MeshBasicMaterial({ color: 0xe8efea, transparent: true, opacity: 0.5, depthWrite: false });
    mat.userData.sansOmbre = true;
    // la frange d'écume qui lèche le sable, et une vague plus au large
    // la frange d'écume au bord de l'eau, et la ligne de brisants (0.10, R0-3), là où l'on perd pied
    for (const [z0, l, pas] of [[MER.bord + 0.05, 1, 4.2], [MER.brisants - 0.05, 1.1, 3.2]]) {
      for (let x = -33; x < 30; x += pas) {
        const lg = pas * (1.15 + 0.3 * c(x));
        ch.boite(lg, 0.02, (0.35 + 0.35 * c(x * 3.1)) * l, 0xffffff, { x: x + pas / 2, y: 0.06, z: z0 + Math.sin(x * 0.45) * 0.35 * l, ry: Math.cos(x * 0.7) * 0.06 }, mat, { crasse: false, nuance: 0 });
      }
    }
    ecume = ch.construire();
    anime.add(ecume);
  }
  let flammes = null;
  if (k.feu) {
    const ch = new Chantier(7);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
    mat.userData.sansOmbre = true;
    for (let i = 0; i < 6; i++) {
      const h = 0.35 + (i % 3) * 0.18;
      ch.poser(new THREE.ConeGeometry(0.12 + (i % 2) * 0.05, h, 5).translate(0, h / 2, 0), mat, i % 2 ? 0xffb050 : 0xff6a20, { x: (i - 2.5) * 0.13, z: (i % 2) * 0.08 - 0.04 }, { crasse: false, nuance: 0 });
    }
    flammes = new THREE.Group();
    flammes.position.set(k.feu.x, k.feu.y, k.feu.z);
    flammes.add(ch.construire());
    anime.add(flammes);
  }
  anime.userData.animer = (t) => {
    uTemps.value = t;
    if (ecume) {
      ecume.position.z = Math.sin(t * 0.55) * 0.7;
      ecume.children.forEach((o) => (o.material.opacity = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.55 + 1.2))));
    }
    if (flammes) {
      flammes.scale.set(1 + 0.08 * Math.sin(t * 17), 0.8 + 0.25 * Math.sin(t * 11) + 0.1 * Math.sin(t * 29), 1);
    }
  };
  b.ajouter(anime);
  k.fondusHotel = fondus;
  function c(x) {
    return 0.6 + 0.4 * Math.abs(Math.sin(x * 1.7));
  }
}
