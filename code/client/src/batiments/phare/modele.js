// Le phare du cap et ses dépendances (Book 20 §3.5, « Phare », Littoral, lointain, danger ●●), lieu L2B du niveau 2.
//
// Un phare de granit et d'enduit blanc au bout du cap, sa bande rouge délavée, sa galerie et sa lanterne vitrée où la
// lentille de Fresnel, fendue, attend son prisme. Au pied, accolées, les maisons basses des gardiens (granit et
// ardoise) ; sur la pointe, la salle de la corne de brume ; dans l'anse, le hangar du canot de sauvetage et sa rampe qui
// plonge dans la crique. Le phare a été automatisé, puis loué à la nuit : « Lighthouse Lodge, gîte insolite connecté ».
// Quand on rallume le feu, un porte-conteneurs perdu s'échoue dans la crique : le « Prime Abondance », éventré.
//
// Repère : origine au centre du lot (60 × 50 m), sol visitable à y = 0, +x à l'est, +z au sud (la mer est au sud).
// On visite : le rez-de-chaussée de la tour (pied de l'escalier coupé à 3 m, réserve de pétrole), la cuisine, la
// chambre et la salle des machines des gardiens, le hangar à bateau, la salle de la corne de brume, l'abri du douanier ;
// en bas de la rampe du canot, la grève de la crique (y ≈ −8,8) et, après l'échouage, l'épave et ses conteneurs.
// Le fût, la galerie et la lanterne sont une couche inaccessible qui s'efface ; la coque de l'épave aussi.
//
// Les objets nommés (T2, T3) : creer() les range dans groupe.userData.objets ; l'état de départ est visible
// (lanterne_eteinte…), l'autre caché (lanterne_allumee, prisme_manquant, epave_apres et tout ce qu'elle contient).

import * as THREE from "three";
import { Batiment, Chantier, aleatoire, PALETTE, matiere, matiereMonde, matiereVerre, matiereEau, matiereLueur, mur, lierre, touffes, gravats, debris, jonchee, mousse, arbuste, raiDeLumiere, toitDeuxPans, dessiner } from "../commun/atelier.js";

// Les Éteints dormeurs du chemin des douaniers (P9) : couchés le long du chemin, du sud-ouest jusqu'à la grille ; ils se
// lèvent quand la lanterne s'allume.
const DORMEURS = [[-27, 1.9], [-20.5, 2.6], [-15.6, 5.3], [-9.4, 7.9], [-4.2, 8.4], [2.9, 5.3], [6.4, 7.6], [11.4, 3.9], [18.6, 2.7]];

export const FICHE = {
  id: "phare",
  nom: "Le phare du cap",
  lieu: "Phare · Littoral (Côte des Flots) · lointain",
  environnement: "littoral",
  anneau: "lointain",
  danger: 2,
  recit:
    "Pendant un siècle, des gardiens ont veillé ici sur les marins ; puis on a automatisé le feu, et on a loué la tour à la nuit, « gîte insolite connecté », jacuzzi et Wi-Fi au bout du monde compris. Le réseau est tombé, la boîte à clés n'ouvre plus rien et la borne attend toujours ses cinq étoiles. Rallumer la lanterne, c'est guider le dernier cargo de la Livraison du Jour jusqu'à la côte… et les Éteints jusqu'à la seule lumière du cap.",
  inspiration:
    "les phares bretons abandonnés (Ar-Men, la Vieille, Kéréon et ses boiseries), les phares écossais et leurs maisons de gardiens, les photos urbex d'escaliers en colimaçon vus d'en bas et de lanternes aux vitres brisées ; les porte-conteneurs échoués et cassés en deux (le Rena, le MSC Napoli) et leurs conteneurs éventrés sur les plages",
  reperes: [
    "La tour de 31 m : granit au pied, enduit blanc, bande rouge délavée, coulures sous les fenêtres",
    "La galerie sur corbeaux, son garde-corps tordu, la lanterne à vitres brisées et à croisillons en hélice",
    "La lentille de Fresnel fendue : un prisme manque (prisme_manquant), un autre est tombé au pied de la tour (prisme_tombe)",
    "La lanterne éteinte (lanterne_eteinte) ; allumée (lanterne_allumee) : le verre chauffé à blanc et le halo, visibles de très loin",
    "Le pied de la tour : l'escalier en fonte coupé à 3 m (les marches basses gisent au sol), la marque à la craie où poser l'escabeau, la cuve à pompe et son bidon",
    "La cuisine du gardien : cuisinière à charbon, le harpon accroché au-dessus, vaisselier, carte marine, journal de bord ouvert",
    "La salle des machines : groupe électrogène, réservoirs de gazole, tableau à couteaux, l'autocollant de Watty",
    "Le hangar : le canot de sauvetage qui pourrit sur son ber, l'escabeau du gardien, le photophore solaire « Watty Glow »",
    "La rampe du canot qui plonge dans la crique sur ses chevalets : un tronçon effondré (on saute, on ne remonte pas)",
    "La corne de brume rouillée, ses deux pavillons tournés vers le large ; le compresseur et sa courroie cassée",
    "Le Lighthouse Lodge : panneau « Réservez votre nuit au bout du monde », boîte à clés connectée, jacuzzi dégonflé, borne « Notez votre séjour ★★★★★ »",
    "La falaise de granit à facettes qui plonge de 9 m, la crique et sa grève de galets, l'îlot et sa tourelle noire et rouge",
    "Après l'échouage : le « Prime Abondance » cassé en deux sur les rochers, la cale ouverte, l'échelle de coupée, la cloche sur la proue, les conteneurs de la Livraison du Jour éventrés sur la grève",
    "Le chemin des douaniers et ses bornes blanches, où dorment les Éteints",
  ],
  lot: { l: 60, p: 50 },
  solPropre: true, // la falaise et la mer descendent sous y = 0 : le lot fournit tout son sol
  depart: { x: 6, z: 7.5 },
  // Le bord du lot (T5) : le muret de l'enceinte et la falaise (arête notée en obstacle) ; à l'ouest, au nord et à l'est
  // le plateau s'ouvre sur la lande (affleurements, ajoncs) ; dans la crique, la falaise au nord et la mer au sud.
  bords: "falaise et mer au sud (arête, pied de falaise et bord de l'eau notés en obstacles) ; lande ouverte au nord, à l'ouest et à l'est ; la grève de la crique sort du lot à l'ouest",
  entrees: [
    { x: 2.3, z: 1.5, nature: "grille du sud de l'enceinte (depuis le chemin des douaniers)" },
    { x: -1.5, z: -16, nature: "grille du nord (la route d'accès)" },
    { x: -10, z: -1.9, nature: "porte de la tour (entrouverte)" },
    { x: -1.0, z: -3, nature: "porte de la cuisine des gardiens" },
    { x: 11, z: -3, nature: "grande porte de la salle des machines (vantail tombé)" },
    { x: -20, z: 7.5, nature: "porte latérale du hangar à bateau" },
    { x: -24, z: 12, nature: "grande porte du hangar, ouverte sur la rampe du canot (descente vers la crique)" },
    { x: 15, z: 7, nature: "porte de la salle de la corne de brume" },
    { x: -29.6, z: 20, y: -8.8, nature: "la grève de galets de la crique, vers l'ouest : on ressort par là" },
  ],
  // P4 : l'escalier de la tour reprend à 3 m ; la marque à la craie où poser l'escabeau, sous la première marche
  escabeau: { marque: { x: -12.01, z: -8.25 }, premiereMarche: { x: -12.01, z: -8.25, y: 3.04 } },
  // K2 : la hauteur du sol où l'on marche
  hauteurSol: "export hauteurSol(x, z, { epave }) : y du sol où l'on marche, dans le repère du lot (celui des obstacles et de la FICHE) ; 0 sur le plateau (tour, enclos, maisons, hangar), la pente de la rampe du canot (partie haute puis partie basse affaissée), les galets de la crique (≈ −8,7 à −9) ; avec epave: true (epave_apres montrée) en plus l'échelle de coupée, le pont du cargo et le conteneur d'outillage (≈ −4,1) et le plancher des deux conteneurs de la grève ; sans épave, à ces endroits, la grève ou le fond de l'eau",
  // La descente vers la crique (P8) : la rampe du canot, praticable du hangar (y = 0) jusqu'à la grève (y ≈ −8,8) ; un
  // tronçon effondré se saute vers le bas (≈ 1,5 m) et ne se remonte pas.
  sensUnique: [
    { id: "rampe_canot", de: { x: -24, z: 18.6, y: -4.9 }, vers: { x: -24, z: 20.3, y: -7.0 }, nature: "on saute du tronçon effondré de la rampe du canot sur la partie basse, affaissée (≈ 1,5 m) : on ne remonte pas" },
  ],
  // Les pièces et les portes (T6). `dehors` est la pièce par défaut. Les conteneurs n'existent qu'après l'échouage.
  pieces: {
    tour: { nom: "le pied de la tour", sombre: true, boites: [{ x: -10, z: -6, l: 7.4, p: 7.4 }] },
    cuisine: { nom: "la cuisine du gardien", sombre: false, boites: [{ x: -2.1, z: -7, l: 6.6, p: 7.6 }] },
    chambre: { nom: "la chambre", sombre: false, boites: [{ x: 3.9, z: -7, l: 4.8, p: 7.6 }] },
    machines: { nom: "la salle des machines", sombre: true, boites: [{ x: 9.9, z: -7, l: 6.8, p: 7.6 }] },
    hangar: { nom: "le hangar à bateau", sombre: true, boites: [{ x: -24, z: 7.5, l: 7.6, p: 8.6 }] },
    corne: { nom: "la salle de la corne de brume", sombre: false, boites: [{ x: 18.5, z: 7, l: 6.6, p: 5.6 }] },
    abri: { nom: "l'abri du douanier", sombre: false, boites: [{ x: -24, z: -7, l: 2.8, p: 3.2 }] },
    conteneur_livraison: { nom: "le conteneur de la Livraison du Jour", sombre: true, apresEpave: true, boites: [{ x: -19.4, z: 17.8, l: 5.9, p: 2.3 }] },
    conteneur_bord: { nom: "le conteneur des provisions du bord", sombre: true, apresEpave: true, boites: [{ x: -11.6, z: 17.45, l: 5.9, p: 2.4 }] },
    conteneur_outillage: { nom: "le conteneur d'outillage (sur le pont du cargo, y ≈ −4,1)", sombre: true, apresEpave: true, boites: [{ x: -2.5, z: 21.2, l: 2.7, p: 3.0 }] },
  },
  portes: [
    { id: "tour", x: -10, z: -2.08, largeur: 1.38, axe: "x", entre: ["dehors", "tour"] },
    { id: "cuisine", x: -1.0, z: -3, largeur: 1.6, axe: "x", entre: ["dehors", "cuisine"] },
    { id: "cuisine_chambre", x: 1.4, z: -5.6, largeur: 1.4, axe: "z", entre: ["cuisine", "chambre"] },
    { id: "chambre_machines", x: 6.4, z: -5.6, largeur: 1.4, axe: "z", entre: ["chambre", "machines"] },
    { id: "machines", x: 11.0, z: -3, largeur: 2.2, axe: "x", entre: ["dehors", "machines"] },
    { id: "hangar_cote", x: -20, z: 7.5, largeur: 1.6, axe: "z", entre: ["dehors", "hangar"] },
    { id: "hangar_rampe", x: -24, z: 12, largeur: 5.4, axe: "x", entre: ["hangar", "dehors"] },
    { id: "corne", x: 15, z: 7, largeur: 1.6, axe: "z", entre: ["dehors", "corne"] },
    { id: "abri", x: -23.6, z: -5.2, largeur: 1.6, axe: "x", entre: ["dehors", "abri"] },
    { id: "conteneur_livraison", x: -16.4, z: 17.85, largeur: 2.3, axe: "z", entre: ["dehors", "conteneur_livraison"], apresEpave: true },
    { id: "conteneur_bord", x: -14.6, z: 17.6, largeur: 2.3, axe: "z", entre: ["dehors", "conteneur_bord"], apresEpave: true },
    { id: "conteneur_outillage", x: -2.9, z: 19.8, y: -4.1, largeur: 2.3, axe: "x", entre: ["dehors", "conteneur_outillage"], apresEpave: true },
  ],
  // Les objets à part, nommés (T2, T3) : creer() les range dans groupe.userData.objets. Visibles au départ : tout sauf
  // lanterne_allumee, prisme_manquant et epave_apres (avec tout ce qu'elle contient).
  objets: {
    lanterne_eteinte: "la lanterne éteinte (le cœur de la lentille, verre sombre)",
    lanterne_allumee: "la lanterne allumée : le verre chauffé à blanc et le halo (cachée au départ)",
    prisme_manquant: "le prisme remis en place dans la lentille (caché au départ)",
    prisme_tombe: "le prisme tombé de la lentille, au pied de la tour (on le prend)",
    escabeau_phare: "l'escabeau du gardien, dans le hangar (on le prend, on le pose à la marque au pied de l'escalier)",
    bidon_petrole: "le bidon de pétrole, à côté de la cuve à pompe (on le prend)",
    courroie_compresseur: "la courroie cassée du compresseur de la corne (le jeu la remplace par une neuve)",
    harpon: "le harpon du gardien, accroché au-dessus de la cuisinière (on le prend)",
    epave_apres: "l'épave du cargo « Prime Abondance » et ses conteneurs (cachée au départ ; apparaît à l'échouage)",
    cloche_cargo: "la cloche du cargo, sur la proue (enfant de epave_apres ; on la prend)",
    porte_four: "la porte de four en fonte, dans le conteneur de la Livraison du Jour (enfant de epave_apres)",
    soufflet: "le soufflet de forge, dans le conteneur de la Livraison du Jour (enfant de epave_apres)",
    rabot: "le rabot, dans le conteneur d'outillage sur le pont (enfant de epave_apres)",
    jerrican: "le jerrican de 20 L, avec les bidons du bord dans le conteneur des provisions (enfant de epave_apres)",
  },
  // Les obstacles de l'épave (coque, conteneurs, échelle de coupée) n'existent qu'après l'échouage : ils sont à part,
  // dans groupe.userData.obstaclesEpave (comme obstaclesTraversee du gué), et non dans userData.obstacles.
  epave: {
    note: "le jeu ajoute groupe.userData.obstaclesEpave quand il montre epave_apres. On monte sur le pont par l'échelle de coupée (pente raide, de la grève y ≈ −8,8 au pont y ≈ −4,2) ; la cloche est sur la proue, le conteneur d'outillage sur le pont. La couche « coque de l'épave » s'efface quand elle cache le joueur sur la grève (hauteurs comptées depuis la grève), pas quand il est à bord (horsDe).",
    echelle: { bas: { x: -13.26, z: 21.74, y: -8.85 }, haut: { x: -7.27, z: 20.13, y: -4.06 } },
    cloche: { x: -5.14, z: 17.28, y: -3.5 },
  },
  fouille: [
    { x: -11.6, z: -4.1, quoi: "réserve de pétrole : cuve à pompe à main (pétrole lampant), entonnoir" },
    { x: -11.0, z: -4.9, quoi: "le bidon de pétrole (bidon_petrole), à remplir à la cuve" },
    { x: -8.0, z: -8.6, quoi: "bidons d'huile rangés contre le mur (huile, chiffons)" },
    { x: -12.0, z: -8.2, quoi: "sous l'escalier coupé : la marque à la craie où poser l'escabeau ; marches de fonte tombées" },
    { x: -12.8, z: -1.2, quoi: "le prisme tombé de la lentille (prisme_tombe), dans l'herbe au pied de la tour" },
    { x: -4.8, z: -7.9, quoi: "cuisinière à charbon : fonte, seau de charbon, bouilloire ; le harpon au-dessus (harpon)" },
    { x: 0, z: -10.4, quoi: "vaisselier : conserves, sel, bougies, allumettes" },
    { x: -2.2, z: -6.5, quoi: "table du gardien : longue-vue en laiton, journal de bord, carte marine" },
    { x: 3, z: -9.6, quoi: "chambre : lampe à huile, couverture polaire, coffre de marin (vêtements de mer)" },
    { x: 9.8, z: -7.9, quoi: "groupe électrogène : moteur, alternateur (cuivre), courroies" },
    { x: 12.6, z: -8.5, quoi: "réservoirs de gazole (un fond de carburant), filtres" },
    { x: 11.6, z: -10.5, quoi: "tableau électrique : interrupteurs à couteaux, fusibles, câbles ; batteries en verre" },
    { x: -24, z: 8, quoi: "canot de sauvetage : bois, cordages, gilets, fusées de détresse" },
    { x: -27.2, z: 6, quoi: "établi du hangar : photophore solaire « Watty Glow », filets, clés plates, bouées couronnes" },
    { x: -20.6, z: 10.3, quoi: "l'escabeau du gardien (escabeau_phare), contre le mur" },
    { x: 17.4, z: 7.8, quoi: "compresseur de la corne : pistons, volant ; la courroie cassée (courroie_compresseur) ; réservoirs d'air" },
    { x: 5.5, z: -0.9, quoi: "jacuzzi gonflable : toile PVC, pompe « connectée »" },
    { x: 0.2, z: -2.2, quoi: "boîte à clés connectée : batterie, clés du gîte" },
    { x: -17.5, z: 10.8, quoi: "bord de la falaise : sel des cuvettes de rochers, bouées, filets et cordages remontés" },
    { x: -24, z: -7, quoi: "abri du douanier : couverture polaire, boîte en fer, vieilles jumelles" },
    { x: -27.6, z: 18.6, y: -8.7, quoi: "la grève : bois flotté, bouées, cordages, bouteilles (et, après l'échouage, ce que la mer rejette)" },
    { x: -18.6, z: 17.8, y: -8.6, apresEpave: true, quoi: "conteneur de la Livraison du Jour : la porte de four en fonte (porte_four), le soufflet de forge (soufflet) ; cartons éventrés, palettes" },
    { x: -10.4, z: 17.3, y: -8.6, apresEpave: true, quoi: "conteneur des provisions du bord : le jerrican de 20 L (jerrican), fûts et bidons, conserves de l'équipage" },
    { x: -2.5, z: 21.6, y: -4.1, apresEpave: true, quoi: "conteneur d'outillage sur le pont : le rabot (rabot), caisses à outils, élingues" },
    { x: -5.1, z: 17.6, y: -3.9, apresEpave: true, quoi: "la proue : la cloche du cargo (cloche_cargo), le guindeau, les chaînes d'ancre" },
    { x: -15.5, z: 20.9, y: -8.8, apresEpave: true, quoi: "cartons de la Livraison du Jour éventrés sur la grève : « Livré avant d'être commandé »" },
  ],
  eteints: [
    { x: -2.6, z: -5.2, type: "ancien habitant (le dernier gardien, ciré jaune délavé)" },
    { x: -23.2, z: 6.5, type: "rampant (sous le canot)" },
    ...DORMEURS.map(([x, z], i) => ({ x, z, type: `dormeur (couché le long du chemin des douaniers, ${i + 1}/${DORMEURS.length} ; se lève quand la lanterne s'allume)` })),
    { x: -27.4, z: 22.0, y: -8.9, type: "Noyé (au bord de l'eau, sur la grève de la crique)" },
    { x: -19.8, z: 22.1, y: -8.9, type: "Noyé (au bord de l'eau, sur la grève de la crique)" },
    { x: -14.4, z: 22.4, y: -8.9, type: "Noyé (au pied de l'échelle de coupée, au bord de l'eau)" },
  ],
};

// ---------- Couleurs du lieu ----------

const GRANIT = 0x9b978d;
const GRANIT_SOMBRE = 0x7b776f;
const ROC = 0x86837b;
const BLANC = 0xe9e5db; // enduit blanc à la chaux, grisé par les embruns
const ROUGE = 0xa9564a; // la bande rouge, délavée
const ARDOISE = PALETTE.ardoise;
const FONTE = 0x3b3a38;
const BLEU = 0x5d7f93; // le bleu des volets et des portes, passé au sel
const VERT_EAU = 0x7d9389;
const CREME = 0xe2d9c3;
const HERBE = 0x8a9658;
const HERBE_SECHE = 0xa4a466;
const TERRE = 0xa8957a;
const LAITON = PALETTE.laiton;
const MER = 0x3e6c74;

const CUT = 1.05; // hauteur d'allège : les façades sud et est sont coupées là, le reste s'efface en couche

// La tour
const TX = -10;
const TZ = -6;
const R_MUR = 4.0; // axe du mur du rez-de-chaussée (16 pans)
const H_RDC = 3.2;
const H_FUT = 25.5; // haut du fût, sous la galerie

// ---------- Matières propres au lieu ----------

const AL = 1024;
const AH = 1024;
const R = {
  lodge: [0, 0, 512, 256],
  borne: [512, 0, 256, 256],
  cles: [768, 0, 128, 128],
  plaque: [896, 0, 128, 128],
  watty: [768, 128, 256, 128],
  carte: [0, 256, 384, 256],
  journal: [384, 256, 256, 256],
  avis: [640, 256, 384, 128],
  sentier: [640, 384, 192, 128],
  canot: [832, 384, 192, 128],
  // L'épave
  conteneur: [0, 512, 512, 256], // le flanc ondulé d'un conteneur « Abondance Express » (teinté par les sommets)
  coque: [512, 512, 512, 128], // le nom du cargo, sur la joue de la proue
  carton: [512, 640, 256, 128], // l'étiquette des cartons de la Livraison du Jour
  porteC: [768, 640, 256, 256], // les portes d'un conteneur, barres de fermeture
};

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("phare-atlas", AL, AH, dessinerAtlas, false);
  const panneaux = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
  const ecume = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, transparent: true, opacity: 0.75, depthWrite: false });
  ecume.userData.sansOmbre = true;
  MATS = {
    granit: matiereMonde("pierreTaille"),
    enduit: matiereMonde("enduit"),
    mat: matiere(0.95, 0),
    satine: matiere(0.6, 0.05),
    lisse: matiere(0.6, 0.05), // fondue avec le satiné : un appel de dessin de moins
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    mer: matiereEau(MER, 0.86),
    lueur: matiereLueur(0xfff0c8, 0.16),
    panneaux,
    ecume,
  };
  return MATS;
}

// ---------- Le phare ----------

export function creer({ usure = 0.7 } = {}) {
  const b = new Batiment(1883, usure);
  const c = b.c;
  const M = matieres();

  terrain(b, c, M, usure);
  enceinte(b, c, M, usure);
  tour(b, c, M, usure);
  piedDeTour(b, c, M, usure);
  maisons(b, c, M, usure);
  cuisine(b, c, M, usure);
  chambre(b, c, M, usure);
  machines(b, c, M, usure);
  lodge(b, c, M, usure);
  hangar(b, c, M, usure);
  corne(b, c, M, usure);
  abriDouanier(b, c, M, usure);
  rivage(b, c, M, usure);

  // Les objets nommés du phare (la lanterne et sa lentille, le prisme tombé, le bidon, l'escabeau, le harpon, la courroie)
  const lanternes = lanterne(M);
  const objetsLieu = objetsPhare(M);
  for (const o of [...lanternes, ...objetsLieu]) b.ajouter(o);
  // L'épave (cachée au départ), avec sa couche et ses obstacles à part
  const ep = epave(b, M, usure);

  // La nuit : la lanterne allumée (un signal visible de loin, qui attire les Éteints), le feu de la cuisinière, le
  // photophore du hangar, une bougie dans la chambre ; le feu de détresse du cargo (avec l'épave).
  b.lumiere(TX, 28.1, TZ, 0xffb45a, 40, 46, "lanterne du phare allumée (seulement quand lanterne_allumee est montrée ; signal : attire les Éteints)");
  b.lumiere(-4.5, 0.7, -7.9, 0xff8a3d, 10, 9, "feu de la cuisinière");
  b.lumiere(-27.1, 1.4, 6, 0xbfe6ff, 3, 6, "photophore solaire « Watty Glow » sur l'établi du hangar");
  b.lumiere(4.6, 0.95, -10.3, 0xffc070, 2.5, 5, "bougie");

  // Le faîtage de zinc des toits (atelier : une matière « tôle ») rejoint la matière mate de la couche des maisons : un
  // appel de dessin de moins
  const km = b.couches.find((q) => q.nom.startsWith("maisons")).c;
  const zinc = km.lots.get(M.tole);
  if (zinc && km.lots.has(M.mat)) {
    km.lots.get(M.mat).push(...zinc);
    km.lots.delete(M.tole);
  }

  const groupe = b.construire();
  // La lanterne s'efface avec le fût ; la cloche et le rabot avec la coque de l'épave
  fondreAvec(groupe, "tour du phare (fût, galerie, lanterne)", lanternes);
  fondreAvec(groupe, ep.nomCouche, ep.fondus);
  // La couche de la coque passe dans epave_apres : cacher l'épave cache tout
  const coque = groupe.children.find((o) => o.name === ep.nomCouche);
  if (coque) ep.groupe.add(coque);
  ep.groupe.visible = false;
  groupe.add(ep.groupe);
  groupe.userData.obstaclesEpave = ep.obstacles;
  // Les objets nommés (FICHE.objets) : { identifiant: Object3D }
  const objets = {};
  for (const id of Object.keys(FICHE.objets)) objets[id] = groupe.getObjectByName(id) ?? null;
  groupe.userData.objets = objets;
  return groupe;
}

/** Ajoute les matières des objets nommés à une couche qui s'efface (des copies : elles se fondent avec elle). */
function fondreAvec(groupe, nomCouche, liste) {
  const t = groupe.userData.toits.find((q) => q.nom === nomCouche);
  if (!t) return;
  for (const o of liste) {
    o.traverse((m) => {
      if (!m.isMesh) return;
      const avant = m.material;
      const fondu = avant.clone();
      fondu.transparent = true;
      fondu.userData = { ...avant.userData, opacite: avant.opacity };
      m.material = fondu;
      t.materiaux.push(fondu);
    });
  }
}

// ---------- Outils ----------

/** Une planche (boîte) de a à b, de largeur `larg` (dans le plan qui contient `haut`) et d'épaisseur `ep`. */
function planche(c, a, bb, larg, ep, couleur, mat, haut = [0, 1, 0], options = {}) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...bb);
  const d = B.clone().sub(A);
  const L = d.length();
  d.normalize();
  const z = new THREE.Vector3().crossVectors(d, new THREE.Vector3(...haut));
  if (z.lengthSq() < 1e-6) z.set(0, 0, 1);
  z.normalize();
  const y = new THREE.Vector3().crossVectors(z, d).normalize();
  const e = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, y, z));
  c.boite(L, larg, ep, couleur, { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, z: (A.z + B.z) / 2, rx: e.x, ry: e.y, rz: e.z }, mat, options);
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, M, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, M.panneaux, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un cylindre posé (axe vertical), à `cotes` pans. */
function cylindre(c, mat, couleur, x, y, z, rh, rb, h, cotes = 10, pose = {}, options = {}) {
  const g = new THREE.CylinderGeometry(rh, rb, h, cotes);
  c.poser(g, mat, couleur, { x, y: y + h / 2, z, ...pose }, options);
  g.dispose();
}

/** Un pignon triangulaire (plan x = cste), base de largeur `p` centrée en z, de hauteur `hf`. */
function pignon(c, mat, couleur, x, zc, p, y0, hf, ep = 0.3) {
  const s = new THREE.Shape();
  s.moveTo(-p / 2, 0);
  s.lineTo(p / 2, 0);
  s.lineTo(0, hf);
  s.lineTo(-p / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false });
  c.poser(g, mat, couleur, { x: x - ep / 2, y: y0, z: zc, ry: Math.PI / 2 }, { crasse: false, nuance: 0.02 });
  g.dispose();
}

const ROCHE = new THREE.DodecahedronGeometry(1, 0);
const BRIN = new THREE.ConeGeometry(0.07, 0.42, 3, 1, true).translate(0, 0.21, 0);
const BOULE = new THREE.IcosahedronGeometry(1, 0);

/** Un rocher de granit à facettes, avec un peu de lichen jaune sur le dessus. */
function rocher(c, x, z, s, y = 0, ton = ROC, elance = 1) {
  const ex = s * c.entre(1, 1.6);
  const ey = s * c.entre(0.45, 0.85) * elance;
  const ez = s * c.entre(0.9, 1.4);
  c.poser(ROCHE, matiere(0.95), ton, { x, y, z, rx: c.entre(-0.3, 0.3), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3), e: [ex, ey, ez] }, { nuance: 0.12 });
  if (c.hasard() < 0.55) {
    for (let i = 0; i < 2; i++) c.boite(s * c.entre(0.3, 0.6), 0.02, s * c.entre(0.25, 0.5), c.hasard() < 0.5 ? 0xc9a548 : 0xb7b48a, { x: x + c.entre(-0.3, 0.3) * s, y: y + ey * 0.92, z: z + c.entre(-0.3, 0.3) * s, ry: c.hasard() * 3 }, matiere(0.95), { crasse: false, nuance: 0.1 });
  }
}

/** Herbe rase couchée par le vent de suroît : les brins penchent tous vers le nord-est. */
function herbeCouchee(c, x, z, y = 0, n = 4) {
  const s = c.entre(0.6, 1.2);
  for (let k = 0; k < n; k++) {
    c.poser(BRIN, matiere(), c.hasard() < 0.55 ? HERBE_SECHE : PALETTE.herbe, { x: x + c.entre(-0.18, 0.18), y, z: z + c.entre(-0.18, 0.18), rx: -c.entre(0.45, 0.85), rz: -c.entre(0.45, 0.85), e: s }, { nuance: 0.12, crasse: false });
  }
}

/** Un coussin d'armérie maritime : un dôme vert sombre piqué de pompons roses. */
function armerie(c, x, z, y = 0) {
  const s = c.entre(0.22, 0.4);
  c.poser(BOULE, matiere(), 0x55703f, { x, y: y + s * 0.15, z, e: [s, s * 0.45, s], ry: c.hasard() * 3 }, { nuance: 0.08, crasse: false });
  const n = 2 + Math.floor(c.hasard() * 3);
  for (let i = 0; i < n; i++) {
    const a = c.hasard() * 6.3;
    const px = x + Math.cos(a) * s * 0.5;
    const pz = z + Math.sin(a) * s * 0.5;
    c.boite(0.09, 0.09, 0.09, 0xd590ab, { x: px, y: y + s * 0.42, z: pz, ry: a }, matiere(), { nuance: 0.1, crasse: false });
  }
}

/** Les emprises bâties, où rien ne pousse et où l'on ne pose pas de rochers. */
const EMPRISES = [
  [-5.9, 13.7, -11.3, -2.7], // maisons des gardiens
  [-28.4, -19.6, 2.6, 12.4], // hangar
  [-25.8, -22.2, 12, 21], // rampe
  [14.7, 22.3, 3.7, 10.3], // salle de la corne
  [16.8, 20.4, 10.2, 17], // la corne
  [1.6, 9.8, -2.9, 1.0], // terrasse du gîte
  [-26, -22, -9.2, -4.8], // abri du douanier
];

function libre(x, z, marge = 0.3) {
  if (Math.hypot(x - TX, z - TZ) < 4.8 + marge) return false;
  for (const [x1, x2, z1, z2] of EMPRISES) if (x > x1 - marge && x < x2 + marge && z > z1 - marge && z < z2 + marge) return false;
  return true;
}

/** La crique de l'ouest (0 à 1) : la falaise y tombe à pic sur une large grève de galets ; la rampe du hangar y
 * descend, l'épave du cargo s'y échoue. */
function crique(x) {
  const lisse = (a, b, v) => Math.min(1, Math.max(0, (v - a) / (b - a)));
  return lisse(-31, -29.5, x) * (1 - lisse(-3.5, -1, x));
}

/** La largeur de la grève (m), du pied de la falaise jusqu'à la laisse de basse mer, selon x. */
function largeurGreve(x) {
  if (x < -20) return 8;
  if (x < -12) return 8 + (0.6 * (x + 20)) / 8;
  return 8.6; // sous l'épave, le platier : la grève avance jusqu'aux rochers où le cargo s'est assis
}

/** Le bord du plateau : z de l'arête de la falaise pour un x donné (la pointe de la corne avance vers le large). */
function bordFalaise(x) {
  const t = Math.min(1, Math.max(0, (x - 10) / 4));
  const base = 12.6 + (16.6 - 12.6) * t * t * (3 - 2 * t);
  return base + 0.35 * Math.sin(0.9 * x + 1) + 0.2 * Math.sin(2.3 * x);
}

// Le profil de la falaise : distance à l'arête (m) → hauteur (m). La mer est à y = −9.
const MER_Y = -9;
const PROFIL_D = [0, 0.6, 1.3, 2.0, 2.8, 3.6, 5.0];
const PROFIL_Y = [0, -1.6, -4.2, -6.6, -8.4, -9.6, -10.4];

// Dans la crique : la falaise à pic (3 m pour 8,4 m de haut), puis la grève de galets en pente douce jusqu'à l'eau.
const CRIQUE_D = [0, 0.6, 1.5, 2.3, 3.0, 3.6];
const CRIQUE_Y = [0, -2.0, -5.0, -7.4, -8.4, -8.7];

function profil(x) {
  const k = crique(x);
  const Dc = [...CRIQUE_D, 3.6 + largeurGreve(x)];
  const Yc = [...CRIQUE_Y, -9.05];
  const D = PROFIL_D.map((d, i) => d * (1 - k) + Dc[i] * k);
  const Y = PROFIL_Y.map((y, i) => y * (1 - k) + Yc[i] * k);
  return { D, Y, k };
}

/** Le pied de la falaise (z) et le bord de l'eau (z) dans la crique, pour un x donné. */
function piedFalaise(x) {
  return bordFalaise(x) + profil(x).D[4] + 0.15;
}
function bordEau(x) {
  const { D, Y } = profil(x);
  for (let n = 1; n < D.length; n++) if (Y[n] <= MER_Y) return bordFalaise(x) + D[n - 1] + ((D[n] - D[n - 1]) * (Y[n - 1] - MER_Y)) / (Y[n - 1] - Y[n]);
  return bordFalaise(x) + D[D.length - 1];
}

/** La hauteur approchée du sol de la falaise en (x, z) (sans le bruit des facettes). */
function solFalaise(x, z) {
  const { D, Y } = profil(x);
  const d = z - bordFalaise(x);
  if (d <= 0) return 0;
  for (let i = 1; i < D.length; i++) if (d <= D[i]) return Y[i - 1] + ((Y[i] - Y[i - 1]) * (d - D[i - 1])) / (D[i] - D[i - 1]);
  return -10.8;
}

// ---------- Le terrain : le plateau du cap, la mer au sud, le chemin des douaniers ----------

const CHEMIN = [[-30, 1.2], [-19, 1.9], [-11, 7.2], [-1, 7.9], [8, 6.9], [13, 2.6], [22, 2.1], [30, 0.6]];

function terrain(b, c, M, usure) {
  // Le plateau : herbe rase (la bande du bord, jusqu'à l'arête, fait partie du maillage de la falaise) ; dessous, le
  // socle de roche, dont on voit la tranche sur les bords du lot
  c.pave(-30, -0.05, -25, 30, 0, 11.5, HERBE, matiere(1), { crasse: false, nuance: 0 });
  c.pave(-30, -12, -25, 30, -0.05, 11.5, 0x5a554c, matiere(1), { crasse: false, nuance: 0 });
  // Taches d'herbe plus sèche et de terre nue, là où le vent râpe
  for (let i = 0; i < 26; i++) {
    const x = c.entre(-29, 29);
    const z = c.entre(-24, 11);
    if (!libre(x, z, 1)) continue;
    c.boite(c.entre(1.5, 4), 0.012, c.entre(1, 2.5), c.hasard() < 0.6 ? HERBE_SECHE : 0x9c8f6e, { x, y: 0.006, z, ry: c.hasard() * 3 }, matiere(1), { crasse: false, nuance: 0.05 });
  }
  // La mer, neuf mètres plus bas : une tranche d'eau verte qui remplit le pied de la falaise
  c.pave(-30, -12, 11.5, 30, MER_Y, 25, 0xffffff, M.mer, { crasse: false, nuance: 0 });

  // Le chemin des douaniers : terre battue, cailloux, bornes blanchies
  for (let i = 0; i < CHEMIN.length - 1; i++) {
    const [x1, z1] = CHEMIN[i];
    const [x2, z2] = CHEMIN[i + 1];
    const L = Math.hypot(x2 - x1, z2 - z1);
    c.boite(L + 0.7, 0.02, 1.1, TERRE, { x: (x1 + x2) / 2, y: 0.011, z: (z1 + z2) / 2, ry: -Math.atan2(z2 - z1, x2 - x1) }, matiere(1), { crasse: false, nuance: 0.03 });
    for (let k = 0; k < L / 2; k++) {
      const t = c.hasard();
      c.boite(c.entre(0.08, 0.2), 0.04, c.entre(0.06, 0.16), 0xbdb5a4, { x: x1 + (x2 - x1) * t + c.entre(-0.5, 0.5), y: 0.03, z: z1 + (z2 - z1) * t + c.entre(-0.5, 0.5), ry: c.hasard() * 3 }, matiere(1), { crasse: false, nuance: 0.1 });
    }
  }
  // Les deux allées : de la grille sud au chemin, de la grille nord à la route
  c.boite(1.6, 0.02, 6.4, TERRE, { x: 2.3, y: 0.012, z: 4.4, ry: 0.06 }, matiere(1), { crasse: false, nuance: 0 });
  c.boite(2.6, 0.02, 9.4, 0x9a8b70, { x: -1.6, y: 0.012, z: -20.4, ry: 0.1 }, matiere(1), { crasse: false, nuance: 0 });
  for (const [x, z] of [[-6, 7.4], [10.8, 4.5], [24, 1.9], [-24, 1.4]]) {
    c.boite(0.35, 0.5, 0.3, 0xe2ddd0, { x, y: 0.25, z, ry: c.hasard() }, matiere(0.95), { nuance: 0.05 });
    c.boite(0.36, 0.08, 0.31, 0xc8362b, { x, y: 0.42, z }, matiere(0.95), { crasse: false, nuance: 0.1 });
  }
  // Le panneau du sentier
  c.boite(0.12, 1.5, 0.12, PALETTE.boisGris, { x: -17.5, y: 0.75, z: 2.9 }, matiere(0.9));
  panneau(c, M, R.sentier, { x: -17.5, y: 1.3, z: 2.97 }, 0.9, 0.6);

  // Rochers du plateau : affleurements en bancs, surtout au nord et sur la pointe
  const affleurements = [[-26, -20, 4], [-20, -22, 3], [18, -21, 4], [25, -14, 4], [24, -6, 3], [-27, -12, 3], [26, 6, 3], [9, -21, 2], [-12, -21, 2], [-28, 6.5, 2]];
  for (const [x, z, n] of affleurements) {
    for (let i = 0; i < n; i++) {
      const px = x + c.entre(-2.5, 2.5);
      const pz = z + c.entre(-2, 2);
      if (!libre(px, pz, 0.6)) continue;
      rocher(c, px, pz, c.entre(0.4, 1.3), -0.1);
    }
  }
  // Herbe couchée, armérie, ajoncs
  let n = 0;
  for (let i = 0; i < 520 && n < 150 + usure * 60; i++) {
    const x = c.entre(-29.5, 29.5);
    const z = c.entre(-24.5, 15.5);
    if (z > bordFalaise(x) - 0.3 || !libre(x, z)) continue;
    if (x > -18.4 && x < 16.4 && z > -16.4 && z < 1.9 && c.hasard() < 0.5) continue; // la cour est plus rase
    herbeCouchee(c, x, z, 0, c.hasard() < 0.3 ? 3 : 4);
    n++;
  }
  for (let i = 0; i < 34; i++) {
    const x = c.entre(-29.5, 29.5);
    const z = c.entre(-24.5, 15.5);
    if (z > bordFalaise(x) - 0.4 || !libre(x, z, 0.5)) continue;
    if (x > -18.4 && x < 16.4 && z > -16.4 && z < 1.9) continue;
    armerie(c, x, z);
  }
  const ajonc = [0x4d6338, 0x5a7040, 0x3f5530];
  for (const [x, z, t] of [[-22, -15, 1.1], [-26, -2, 0.9], [21, -17, 1.2], [27, -9, 1], [-15, -22, 0.9], [13, -20, 1], [25, 12.5, 0.8], [-29, 9.5, 0.8]]) {
    arbuste(c, x, z, t, 0, ajonc);
    for (let k = 0; k < 6; k++) c.poser(BOULE, matiere(), 0xd8b23a, { x: x + c.entre(-0.6, 0.6) * t, y: c.entre(0.5, 1.1) * t, z: z + c.entre(-0.6, 0.6) * t, e: 0.06 }, { crasse: false, nuance: 0.1 });
  }

  // Le bord de la falaise : on ne passe pas, sauf par la rampe du canot (x de −25,5 à −22,5), qui descend à la crique
  for (let x = -30; x < 30; x += 1.5) {
    const x2 = Math.min(30, x + 1.5);
    if (x >= -25.6 && x2 <= -22.4) continue;
    b.obstacle(x, bordFalaise(x) - 0.25, x2, bordFalaise(x2) - 0.25, "falaise");
  }
  // Les garde-fous de la rampe : de la grande porte du hangar jusqu'au bout de la rampe, posé sur les galets
  for (const x of [RAMPE_X1, RAMPE_X2]) b.obstacle(x, HZ2, x, RAMPE_FIN_COTES, "bord de la rampe du canot (le vide, les chevalets)");
  // Dans la crique (en bas, y ≈ −8,8) : le pied de la falaise au nord, le bord de l'eau au sud (sauf sous la rampe)
  const pas = 1.5;
  for (let x = -30; x < -1.6; x += pas) {
    const x2 = Math.min(-1.6, x + pas);
    if (!(x >= RAMPE_X1 - 0.1 && x2 <= RAMPE_X2 + 0.1)) b.obstacle(x, piedFalaise(x), x2, piedFalaise(x2), "pied de la falaise (crique)");
    b.obstacle(x, bordEau(x) - 0.3, x2, bordEau(x2) - 0.3, "la mer (bord de l'eau, crique)");
  }
  b.obstacle(-1.6, piedFalaise(-1.6), -1.6, bordEau(-1.6) - 0.3, "rochers au bout de la crique");
}

// ---------- Le muret d'enceinte ----------

function enceinte(b, c, M, usure) {
  const spec = (breches) => ({ h: 1.15, ep: 0.5, couleur: GRANIT, mat: M.granit, batiment: b, breches: usure > 0.4 ? breches : [] });
  mur(c, [-18, 1.5], [1, 1.5], spec([{ u: 6, l: 2.4, profondeur: 0.7 * usure }]));
  mur(c, [3.6, 1.5], [16, 1.5], spec([]));
  mur(c, [16, 1.5], [16, -16], spec([{ u: 9, l: 2, profondeur: 0.8 * usure }]));
  mur(c, [16, -16], [0, -16], spec([]));
  mur(c, [-3, -16], [-18, -16], spec([{ u: 10, l: 2.6, profondeur: 0.9 * usure }]));
  mur(c, [-18, -16], [-18, 1.5], spec([]));
  // Le chaperon : de grosses dalles posées sur le muret, quelques-unes tombées
  for (const [x1, z1, x2, z2] of [[-18, 1.5, 1, 1.5], [3.6, 1.5, 16, 1.5], [16, 1.5, 16, -16], [16, -16, 0, -16], [-3, -16, -18, -16], [-18, -16, -18, 1.5]]) {
    const L = Math.hypot(x2 - x1, z2 - z1);
    for (let u = 0.5; u < L; u += 1.1) {
      if (c.hasard() < 0.2 + usure * 0.25) {
        if (c.hasard() < 0.4) c.boite(1, 0.18, 0.62, GRANIT_SOMBRE, { x: x1 + ((x2 - x1) * u) / L + c.entre(-0.8, 0.8), y: 0.09, z: z1 + ((z2 - z1) * u) / L + c.entre(-0.8, 0.8), ry: c.hasard() * 3, rz: 0.2 }, M.granit, { nuance: 0.06 });
        continue;
      }
      c.boite(1.02, 0.14, 0.62, GRANIT_SOMBRE, { x: x1 + ((x2 - x1) * u) / L, y: 1.12, z: z1 + ((z2 - z1) * u) / L, ry: -Math.atan2(z2 - z1, x2 - x1) + c.entre(-0.05, 0.05) }, M.granit, { nuance: 0.06 });
    }
  }
  // Les piliers des deux grilles, la grille sud arrachée
  for (const [x, z] of [[0.7, 1.5], [3.9, 1.5], [0.3, -16], [-3.3, -16]]) {
    c.boite(0.7, 1.7, 0.7, GRANIT, { x, y: 0.85, z }, M.granit, { nuance: 0.03 });
    c.boite(0.86, 0.16, 0.86, GRANIT_SOMBRE, { x, y: 1.78, z }, M.granit, { nuance: 0.03 });
    c.poser(BOULE, matiere(0.95), GRANIT_SOMBRE, { x, y: 2.05, z, e: 0.2 }, { nuance: 0.03, crasse: false });
  }
  panneau(c, M, R.plaque, { x: 0.7, y: 1.15, z: 1.86 }, 0.5, 0.5);
  // Un vantail de fer forgé couché dans l'herbe
  c.repere({ x: 1.9, y: 0.05, z: 2.9, ry: 0.35 }, () => {
    c.boite(1.3, 0.04, 0.05, PALETTE.rouilleSombre, { z: -0.7 }, M.tole);
    c.boite(1.3, 0.04, 0.05, PALETTE.rouilleSombre, { z: 0.7 }, M.tole);
    for (let i = 0; i < 7; i++) c.boite(0.03, 0.03, 1.45, PALETTE.rouille, { x: -0.6 + i * 0.2 }, M.tole, { crasse: false });
  });
  // L'autre vantail, encore pendu, ouvert
  c.repere({ x: 3.5, y: 0, z: 1.6, ry: -1.9 }, () => {
    for (const y of [0.25, 1.35]) c.boite(1.3, 0.05, 0.04, PALETTE.rouilleSombre, { x: 0.65, y }, M.tole);
    for (let i = 0; i < 7; i++) c.boite(0.03, 1.3, 0.03, PALETTE.rouille, { x: 0.08 + i * 0.19, y: 0.8 }, M.tole, { crasse: false });
  });
  lierre(c, -12, 0, 1.78, 0, 3, 1, Math.round(25 * usure));
  lierre(c, 16.28, 0, -9, Math.PI / 2, 3, 1, Math.round(20 * usure));
}

// ---------- La tour : rez-de-chaussée (visitable), fût, galerie et lanterne (couche) ----------

function tour(b, c, M, usure) {
  const k = b.couche("tour du phare (fût, galerie, lanterne)", { x: TX, z: TZ, l: 9.2, p: 9.2 }, CUT, 32);
  const pt = (th, r = R_MUR) => [TX + Math.cos(th) * r, TZ + Math.sin(th) * r];

  // Le rez-de-chaussée : 16 pans de granit, enduit au-dessus de l'allège. La moitié sud-est est coupée à l'allège
  // (le haut va dans la couche), la moitié nord-ouest monte entière : on voit l'escalier contre elle.
  for (let i = 0; i < 16; i++) {
    const t1 = i * (Math.PI / 8) + Math.PI / 16;
    const t2 = t1 + Math.PI / 8;
    const tm = t1 + Math.PI / 16;
    let a = pt(t2);
    let bb = pt(t1);
    const dx = bb[0] - a[0];
    const dz = bb[1] - a[1];
    const L = Math.hypot(dx, dz);
    const ex = 0.1 / L;
    a = [a[0] - dx * ex, a[1] - dz * ex];
    bb = [bb[0] + dx * ex, bb[1] + dz * ex];
    const Lc = L + 0.2;
    const coupe = Math.cos(tm) + Math.sin(tm) > 0.5;
    const porte = i === 3; // plein sud
    mur(c, a, bb, { h: CUT, ep: 0.6, couleur: GRANIT, mat: M.granit, batiment: b, ouvertures: porte ? [{ u: Lc / 2, l: 1.4, bas: 0, haut: 2.25, type: "porte", vantail: "entrouvert", couleurPorte: BLEU, angle: 1.45 }] : [] });
    const ouv = porte ? [{ u: Lc / 2, l: 1.4, bas: 0, haut: 2.25 - CUT, type: "vide" }] : i === 7 ? [{ u: Lc / 2, l: 0.6, bas: 0.55, haut: 1.6, type: "fenetre", croisillons: 0, traverses: 2, bris: 0.9, appui: false, cadre: BLEU }] : [];
    mur(coupe ? k : c, a, bb, { h: H_RDC - CUT, y0: CUT, ep: 0.6, couleur: BLANC, mat: M.enduit, ouvertures: ouv });
  }
  // Le cordon de granit qui couronne le rez-de-chaussée
  const cordon = new THREE.CylinderGeometry(4.55, 4.5, 0.3, 16);
  k.poser(cordon, M.enduit, 0xb9b4a8, { x: TX, y: H_RDC + 0.15, z: TZ, ry: -Math.PI / 16 }, { crasse: false, nuance: 0 });
  cordon.dispose();
  // Le linteau de la porte et l'arc de décharge
  const [px, pz] = pt(Math.PI / 2, 4.32);
  k.boite(1.7, 0.35, 0.16, 0xb9b4a8, { x: px, y: 2.42, z: pz }, M.enduit);

  // Le fût : tronc de cône à 16 pans, enduit blanc, bande rouge délavée en tête
  const rAt = (y) => 4.38 + ((3.1 - 4.38) * (y - H_RDC)) / (H_FUT - H_RDC);
  const fut = new THREE.CylinderGeometry(3.1, 4.38, H_FUT - H_RDC - 0.3, 16, 1, true);
  k.poser(fut, M.enduit, BLANC, { x: TX, y: (H_FUT + H_RDC + 0.3) / 2, z: TZ, ry: -Math.PI / 16 }, { crasse: false, nuance: 0 });
  fut.dispose();
  const yb = 19;
  const bande = new THREE.CylinderGeometry(3.13, rAt(yb) + 0.03, H_FUT - yb, 16, 1, true);
  k.poser(bande, M.enduit, ROUGE, { x: TX, y: (H_FUT + yb) / 2, z: TZ, ry: -Math.PI / 16 }, { crasse: false, nuance: 0 });
  bande.dispose();
  // Le rouge s'écaille : plaques d'enduit nu, et les coulures de rouille sous les fenêtres
  for (let i = 0; i < 22; i++) {
    const y = c.entre(yb + 0.3, H_FUT - 0.4);
    const phi = c.entre(-0.6, 2.2); // surtout côté sud-est, vu de la caméra
    const r = rAt(y) + 0.05;
    k.boite(c.entre(0.3, 0.9), c.entre(0.2, 0.7), 0.04, 0xd9d2c4, { x: TX + Math.cos(phi) * r, y, z: TZ + Math.sin(phi) * r, ry: Math.PI / 2 - phi }, M.enduit, { crasse: false, nuance: 0.05 });
  }
  // Les fenêtres de l'escalier, en spirale ; encadrements de granit, coulures sous l'appui
  const fenetres = [[6.5, 0.7], [10, 2.2], [13.5, -0.6], [17, 1.0], [21, 0.1], [23.6, 1.9]];
  for (const [y, phi] of fenetres) {
    const r = rAt(y);
    k.repere({ x: TX + Math.cos(phi) * r, y, z: TZ + Math.sin(phi) * r, ry: Math.PI / 2 - phi }, () => {
      k.boite(1.0, 1.55, 0.18, 0xbab5aa, { z: -0.02 }, M.enduit, { crasse: false });
      k.boite(0.62, 1.15, 0.2, 0x26292b, { z: 0.01 }, M.enduit, { crasse: false });
      k.boite(1.15, 0.12, 0.3, 0xbab5aa, { y: -0.82, z: 0.05 }, M.enduit, { crasse: false });
      for (let q = 0; q < 3; q++) k.boite(c.entre(0.05, 0.14), c.entre(1.2, 3.4), 0.03, 0x8a7d68, { x: c.entre(-0.4, 0.4), y: -2.4, z: 0.02 }, M.enduit, { crasse: false, nuance: 0.1 });
    });
  }
  // De longues traînées grises descendent de la galerie
  for (let i = 0; i < 16; i++) {
    const phi = c.entre(-0.9, 2.4);
    const lg = c.entre(2, 7);
    const y = H_FUT - 0.3 - lg / 2;
    const r = rAt(y) + 0.04;
    k.boite(c.entre(0.08, 0.3), lg, 0.03, 0x8f8a80, { x: TX + Math.cos(phi) * r, y, z: TZ + Math.sin(phi) * r, ry: Math.PI / 2 - phi }, M.enduit, { crasse: false, nuance: 0.1 });
  }

  // La galerie : corbeaux, plancher de granit, garde-corps de fer tordu
  for (let i = 0; i < 16; i++) {
    const phi = (i * Math.PI) / 8 + Math.PI / 16;
    k.repere({ x: TX + Math.cos(phi) * 3.32, y: H_FUT - 0.45, z: TZ + Math.sin(phi) * 3.32, ry: Math.PI / 2 - phi }, () => {
      k.boite(0.32, 0.6, 0.55, 0xc9c3b6, { z: 0.12 }, M.enduit, { crasse: false });
      k.boite(0.32, 0.25, 0.3, 0xc9c3b6, { y: -0.4, z: 0.0 }, M.enduit, { crasse: false });
    });
  }
  const plancher = new THREE.CylinderGeometry(3.8, 3.65, 0.3, 16);
  k.poser(plancher, M.enduit, 0xb3ada0, { x: TX, y: H_FUT + 0.15, z: TZ, ry: -Math.PI / 16 }, { crasse: false, nuance: 0 });
  plancher.dispose();
  const yg = H_FUT + 0.3;
  const nP = 24;
  const casse = [7, 8, 9]; // côté sud-est, une section du garde-corps pend dans le vide
  for (let i = 0; i < nP; i++) {
    const phi = (i / nP) * Math.PI * 2;
    const x = TX + Math.cos(phi) * 3.62;
    const z = TZ + Math.sin(phi) * 3.62;
    if (usure > 0.4 && casse.includes(i)) continue;
    k.boite(0.05, 1.05, 0.05, 0x2f3533, { x, y: yg + 0.52, z }, M.metal, { crasse: false });
    const phi2 = ((i + 1) / nP) * Math.PI * 2;
    if (usure > 0.4 && (casse.includes(i + 1) || casse.includes(i))) continue;
    for (const h of [0.55, 1.05]) k.poutre([x, yg + h, z], [TX + Math.cos(phi2) * 3.62, yg + h, TZ + Math.sin(phi2) * 3.62], 0.045, 0x2f3533, M.metal);
  }
  if (usure > 0.4) {
    // La section arrachée pend le long du fût
    const phi = (8 / nP) * Math.PI * 2;
    const x = TX + Math.cos(phi) * 3.7;
    const z = TZ + Math.sin(phi) * 3.7;
    k.poutre([x, yg + 0.5, z], [x + 0.3, yg - 1.6, z + 0.5], 0.045, 0x2f3533, M.metal);
    k.poutre([x - 0.5, yg + 0.3, z - 0.4], [x - 0.2, yg - 1.4, z + 0.3], 0.045, 0x2f3533, M.metal);
  }

  // La lanterne : soubassement, vitrage à 10 pans, croisillons en hélice, coupole vert-de-gris
  const y0 = yg;
  const yv = y0 + 0.95;
  const hv = 2.5;
  const rl = 2.0;
  const soub = new THREE.CylinderGeometry(rl + 0.05, rl + 0.12, 0.95, 10);
  k.poser(soub, M.enduit, 0x9b4d42, { x: TX, y: y0 + 0.475, z: TZ }, { crasse: false, nuance: 0 });
  soub.dispose();
  const sommet = (j, r = rl) => {
    const phi = (j / 10) * Math.PI * 2;
    return [TX + Math.cos(phi) * r, TZ + Math.sin(phi) * r];
  };
  for (let j = 0; j < 10; j++) {
    const [x, z] = sommet(j);
    const [x2, z2] = sommet(j + 1);
    k.poutre([x, yv, z], [x, yv + hv, z], 0.09, 0x27302e, M.metal);
    for (const h of [0, hv / 2, hv]) k.poutre([x, yv + h, z], [x2, yv + h, z2], 0.07, 0x27302e, M.metal);
    k.poutre([x, yv, z], [x2, yv + hv / 2, z2], 0.035, 0x27302e, M.metal);
    k.poutre([x, yv + hv / 2, z], [x2, yv + hv, z2], 0.035, 0x27302e, M.metal);
    // Les vitres : entières, étoilées, ou disparues (le vent siffle dans la lanterne)
    const phi = ((j + 0.5) / 10) * Math.PI * 2;
    const ap = rl * Math.cos(Math.PI / 10);
    const lc = 2 * rl * Math.sin(Math.PI / 10) - 0.08;
    for (const r0 of [0, 1]) {
      if (c.hasard() < 0.15 + usure * 0.45) continue;
      k.boite(lc, hv / 2 - 0.08, 0.02, 0xd9e6e4, { x: TX + Math.cos(phi) * ap, y: yv + hv / 4 + (r0 * hv) / 2, z: TZ + Math.sin(phi) * ap, ry: Math.PI / 2 - phi }, M.verre, { crasse: false, nuance: 0 });
    }
  }
  const dome = new THREE.ConeGeometry(rl + 0.28, 1.25, 10);
  k.poser(dome, M.metal, 0x5f8f7c, { x: TX, y: yv + hv + 0.62, z: TZ }, { crasse: false, nuance: 0 });
  dome.dispose();
  const rebord = new THREE.CylinderGeometry(rl + 0.32, rl + 0.32, 0.12, 10);
  k.poser(rebord, M.metal, 0x4c6f62, { x: TX, y: yv + hv + 0.02, z: TZ }, { crasse: false, nuance: 0 });
  rebord.dispose();
  k.poser(BOULE, M.metal, 0x4c6f62, { x: TX, y: yv + hv + 1.45, z: TZ, e: 0.32 }, { crasse: false, nuance: 0 });
  k.poutre([TX, yv + hv + 1.6, TZ], [TX, yv + hv + 2.6, TZ], 0.05, 0x2f3533, M.metal);
  k.boite(0.7, 0.18, 0.02, 0x2f3533, { x: TX + 0.25, y: yv + hv + 2.3, z: TZ, ry: 0.6 }, M.metal, { crasse: false });

  // La lentille de Fresnel : anneaux de prismes empilés, cerclés de laiton. Fendue : un morceau d'anneau manque.
  const yL = yv + 0.25;
  cylindre(k, M.metal, FONTE, TX, yv - 0.6, TZ, 0.22, 0.3, 0.85, 8);
  const nA = 9;
  const hA = 0.2;
  for (let i = 0; i < nA; i++) {
    const t = (i + 0.5) / nA;
    const r = 0.42 + 0.38 * Math.sin(Math.PI * t);
    const rh = i < nA / 2 ? r + 0.07 : r - 0.06; // les dents de scie des prismes
    const rb = i < nA / 2 ? r - 0.06 : r + 0.07;
    const fendu = i === 3 || i === 4;
    const g = new THREE.CylinderGeometry(rh, rb, hA - 0.02, 12, 1, false, fendu ? 1.9 : 0, fendu ? Math.PI * 2 - 1.0 : Math.PI * 2);
    k.poser(g, M.verre, i % 2 ? 0xe4eedc : 0xd2e3d6, { x: TX, y: yL + i * hA + hA / 2, z: TZ }, { crasse: false, nuance: 0.02 });
    g.dispose();
  }
  for (let q = 0; q < 6; q++) {
    const phi = (q / 6) * Math.PI * 2 + 0.3;
    k.poutre([TX + Math.cos(phi) * 0.56, yL - 0.05, TZ + Math.sin(phi) * 0.56], [TX + Math.cos(phi) * 0.86, yL + (nA * hA) / 2, TZ + Math.sin(phi) * 0.86], 0.035, LAITON, M.metal);
    k.poutre([TX + Math.cos(phi) * 0.86, yL + (nA * hA) / 2, TZ + Math.sin(phi) * 0.86], [TX + Math.cos(phi) * 0.56, yL + nA * hA + 0.05, TZ + Math.sin(phi) * 0.56], 0.035, LAITON, M.metal);
  }
  for (const yy of [yL - 0.05, yL + nA * hA + 0.03]) cylindre(k, M.metal, LAITON, TX, yy, TZ, 0.58, 0.58, 0.06, 12);
  // La fente. Le cœur de la lentille (éteint ou allumé) et le prisme manquant sont des objets nommés : lanterne().
  k.poutre([TX + 0.55, yL + 0.3, TZ + 0.62], [TX + 0.75, yL + 1.5, TZ + 0.42], 0.025, 0x2a2a28, M.metal);
}

// La lentille : les mêmes cotes pour la tour et pour les objets nommés de la lanterne
const Y_LENTILLE = H_FUT + 0.3 + 0.95 + 0.25; // yL : le bas des anneaux de prismes
const N_ANNEAUX = 9;
const H_ANNEAU = 0.2;
const FENTE = [0.9, 1.0]; // le morceau d'anneau qui manque (début, longueur, en radians), anneaux 3 et 4 : côté est
function anneau(i) {
  const t = (i + 0.5) / N_ANNEAUX;
  const r = 0.42 + 0.38 * Math.sin(Math.PI * t);
  return i < N_ANNEAUX / 2 ? [r + 0.07, r - 0.06] : [r - 0.06, r + 0.07];
}

/** Un objet nommé (T2, T3) : un chantier à part, fusionné (une matière de préférence : un appel), nom et userData.nom. */
function nomme(nom, graine, batir) {
  const ch = new Chantier(graine);
  batir(ch);
  const g = ch.construire();
  g.name = nom;
  g.userData.nom = nom;
  return g;
}

/**
 * La lanterne et ses objets nommés : le cœur éteint (visible), le cœur allumé et son halo (caché), le prisme manquant
 * remis en place (caché). Ils s'effacent avec la couche de la tour : leurs matières sont ajoutées à cette couche.
 */
function lanterne(M) {
  const yc = Y_LENTILLE + (N_ANNEAUX * H_ANNEAU) / 2;
  const eteinte = nomme("lanterne_eteinte", 501, (ch) => {
    // Le cœur : le manchon de verre ambré, la mèche et le brûleur à pétrole, froids
    const g = new THREE.CylinderGeometry(0.42, 0.42, N_ANNEAUX * H_ANNEAU * 0.9, 10);
    ch.poser(g, M.satine, 0x6a5532, { x: TX, y: yc, z: TZ }, { crasse: false, nuance: 0 });
    g.dispose();
    ch.boite(0.3, 0.5, 0.3, 0x2c2b29, { x: TX, y: Y_LENTILLE + 0.25, z: TZ }, M.satine, { crasse: false });
  });
  const lueur = matiereLueur(0xffffff, 0.85);
  const allumee = nomme("lanterne_allumee", 502, (ch) => {
    // Le manchon chauffé à blanc, puis le halo : des coques de plus en plus grandes et de plus en plus sombres (la
    // matière est additive : leur somme fait un dégradé), et deux pinceaux vers le large
    const g = new THREE.CylinderGeometry(0.45, 0.45, N_ANNEAUX * H_ANNEAU * 0.92, 10);
    ch.poser(g, lueur, 0xfff3d0, { x: TX, y: yc, z: TZ }, { crasse: false, nuance: 0 });
    g.dispose();
    const coque = new THREE.IcosahedronGeometry(1, 1);
    for (const [r, coul] of [[1.25, 0x8a6a30], [2.1, 0x5a3e18], [3.3, 0x342410], [5.0, 0x1e150a]]) ch.poser(coque, lueur, coul, { x: TX, y: yc, z: TZ, e: [r, r * 0.8, r] }, { crasse: false, nuance: 0 });
    coque.dispose();
    // Les pinceaux : des cônes emboîtés de plus en plus longs, très sombres (additifs : plus clairs près de la source)
    for (const phi of [0.6, 0.6 + Math.PI]) {
      for (const [lg, r] of [[7, 0.9], [14, 1.6], [24, 2.6]]) {
        const pin = new THREE.ConeGeometry(r, lg, 8, 1, true).translate(0, -lg / 2, 0);
        ch.poser(pin, lueur, 0x1a1208, { x: TX, y: yc, z: TZ, rz: Math.PI / 2, ry: -phi }, { crasse: false, nuance: 0 });
        pin.dispose();
      }
    }
  });
  allumee.visible = false;
  const prisme = nomme("prisme_manquant", 503, (ch) => {
    for (const i of [3, 4]) {
      const [rh, rb] = anneau(i);
      const g = new THREE.CylinderGeometry(rh, rb, H_ANNEAU - 0.02, 3, 1, false, FENTE[0], FENTE[1]);
      ch.poser(g, M.verre, i % 2 ? 0xf2f8ea : 0xe0eee2, { x: TX, y: Y_LENTILLE + i * H_ANNEAU + H_ANNEAU / 2, z: TZ }, { crasse: false, nuance: 0 });
      g.dispose();
    }
  });
  prisme.visible = false;
  return [eteinte, allumee, prisme];
}

// ---------- Les objets nommés du phare (P4 à P7, P10) ----------

function objetsPhare(M) {
  const cx = TX + Math.cos(2.25) * 2.45; // la cuve à pompe
  const cz = TZ + Math.sin(2.25) * 2.45;
  // P5 : le prisme tombé de la lentille, dans l'herbe au pied de la tour (côté du garde-corps arraché)
  const prismeTombe = nomme("prisme_tombe", 511, (ch) => {
    ch.repere({ x: -12.8, y: 0.3, z: -1.2, ry: 0.7, rz: 0.35, rx: 0.2 }, () => {
      const g = new THREE.CylinderGeometry(0.62, 0.74, 0.18, 4, 1, false, 0, 0.9);
      ch.poser(g, M.satine, 0xd6ecdf, { x: -0.5 }, { crasse: false, nuance: 0 });
      g.dispose();
      ch.boite(0.5, 0.03, 0.05, LAITON, { x: -0.05, y: -0.1, z: 0.38, ry: 0.5 }, M.satine, { crasse: false });
    });
    for (let i = 0; i < 4; i++) ch.boite(0.08, 0.02, 0.06, 0xe6f2ea, { x: -12.8 + ch.entre(-0.6, 0.6), y: 0.02, z: -1.2 + ch.entre(-0.5, 0.5), ry: ch.hasard() * 3 }, M.satine, { crasse: false, nuance: 0 });
  });
  // P6 : le bidon de pétrole (20 L, rond, à anse et à bec), à côté de la cuve à pompe
  const bidon = nomme("bidon_petrole", 512, (ch) => {
    const x = cx + 0.5;
    const z = cz - 0.75;
    cylindre(ch, M.tole, 0xa53d2c, x, 0.04, z, 0.17, 0.18, 0.44, 10);
    cylindre(ch, M.tole, 0x7d2c20, x, 0.48, z, 0.15, 0.17, 0.05, 10);
    ch.tube([x + 0.08, 0.52, z], [x + 0.16, 0.62, z], 0.025, 0x55524c, M.tole, 5);
    ch.poutre([x - 0.1, 0.56, z], [x - 0.02, 0.66, z], 0.025, 0x2c2b29, M.tole);
    ch.poutre([x - 0.02, 0.66, z], [x + 0.06, 0.56, z], 0.025, 0x2c2b29, M.tole);
  });
  // P4 : l'escabeau du gardien, replié contre le mur est du hangar, près de la grande porte
  const escabeau = nomme("escabeau_phare", 513, (ch) => {
    ch.repere({ x: -20.5, y: 0, z: 10.3, rz: 0.2 }, () => {
      for (const dz of [-0.28, 0.28]) {
        ch.poutre([-0.02, 0, dz], [0.08, 2.35, dz * 0.85], 0.06, 0x8a6a48, M.mat);
        ch.poutre([0.12, 0, dz], [0.1, 2.3, dz * 0.85], 0.05, 0x7a5a3c, M.mat);
      }
      for (let i = 1; i <= 6; i++) ch.boite(0.12, 0.03, 0.5, 0x9a7a58, { x: 0.03 + i * 0.012, y: i * 0.36, z: 0 }, M.mat, { nuance: 0.05 });
      ch.boite(0.2, 0.05, 0.56, 0x6a4c32, { x: 0.08, y: 2.36 }, M.mat);
      ch.boite(0.04, 0.3, 0.3, 0xc8a24a, { x: -0.04, y: 1.6, z: 0.05 }, M.mat, { crasse: false }); // la vieille étiquette
    });
  });
  // P10 : le harpon du gardien, accroché au-dessus de la cuisinière (pignon ouest de la cuisine)
  const harpon = nomme("harpon", 514, (ch) => {
    const x = MX1 + 0.3;
    const y = 1.95;
    ch.tube([x, y, -9.1], [x, y, -6.9], 0.03, 0x6a4c32, M.satine, 6);
    ch.tube([x, y, -6.9], [x, y, -6.55], 0.018, 0x3b3a38, M.satine, 5);
    const pointe = new THREE.ConeGeometry(0.05, 0.22, 4);
    ch.poser(pointe, M.satine, 0x4a4844, { x, y, z: -6.45, rx: Math.PI / 2 }, { crasse: false });
    pointe.dispose();
    for (const s of [-1, 1]) ch.poutre([x, y, -6.52], [x, y + s * 0.09, -6.68], 0.02, 0x4a4844, M.satine);
    for (const z of [-8.6, -7.2]) ch.boite(0.12, 0.05, 0.04, 0x2c2b29, { x: MX1 + 0.24, y: y - 0.05, z }, M.satine, { crasse: false });
    for (let r = 0; r < 3; r++) ch.poser(new THREE.TorusGeometry(0.16 - r * 0.02, 0.018, 3, 9), M.satine, 0xb09a6a, { x: x + 0.02, y: y - 0.25 - r * 0.02, z: -9.0, ry: Math.PI / 2 }, { crasse: false, nuance: 0.04 });
  });
  // P7 : la courroie cassée du compresseur : un bout pend du volant, l'autre traîne au sol
  const courroie = nomme("courroie_compresseur", 515, (ch) => {
    ch.poutre([18.4, 1.52, 7.8], [18.45, 1.0, 7.7], 0.04, 0x1e1d1b, M.satine);
    ch.poutre([18.45, 1.0, 7.7], [18.55, 0.35, 7.55], 0.04, 0x1e1d1b, M.satine);
    const pts = [[18.6, 8.6], [19.0, 8.75], [19.25, 9.05], [19.05, 9.35], [18.7, 9.25], [18.6, 9.0]];
    for (let i = 0; i < pts.length - 1; i++) ch.poutre([pts[i][0], 0.06, pts[i][1]], [pts[i + 1][0], 0.06, pts[i + 1][1]], 0.05, 0x1e1d1b, M.satine);
  });
  return [prismeTombe, bidon, escabeau, harpon, courroie];
}

// ---------- Le pied de la tour (visitable) ----------

function piedDeTour(b, c, M, usure) {
  // Le dallage de granit
  const sol = new THREE.CylinderGeometry(3.75, 3.75, 0.04, 16);
  c.poser(sol, M.granit, 0xa29d92, { x: TX, y: 0.02, z: TZ, ry: -Math.PI / 16 }, { crasse: false, nuance: 0 });
  sol.dispose();
  // La colonne creuse des poids de l'horlogerie, au centre
  c.tube([TX, 0, TZ], [TX, H_RDC, TZ], 0.2, FONTE, M.tole, 8);
  cylindre(c, M.tole, FONTE, TX, 0.04, TZ, 0.32, 0.36, 0.3, 8);
  // L'escalier en colimaçon de fonte, accroché au mur : les marches basses sont tombées, il ne reprend qu'à 3 m (P4).
  // On voit les consoles arrachées dans le mur, les marches de fonte au sol ; la première marche restante est au
  // nord-ouest, au-dessus de la marque à la craie où l'on pose l'escabeau.
  const rIn = 2.35;
  const rOut = 3.68;
  const rm = (rIn + rOut) / 2;
  const dth = -0.36;
  const iPremiere = 15; // la première marche restante : y = 0,19 × 16 ≈ 3,04 m
  const thPremiere = -2.3; // au nord-ouest, face à la caméra
  const th0 = thPremiere - dth * iPremiere;
  const mains = [];
  for (let i = 0; i < 20; i++) {
    const th = th0 + dth * i;
    const y = 0.19 * (i + 1);
    const x = TX + Math.cos(th) * rm;
    const z = TZ + Math.sin(th) * rm;
    if (i < iPremiere) {
      // La console arrachée, restée scellée dans le mur
      if (i % 3 === 1) c.repere({ x: TX + Math.cos(th) * (rOut - 0.12), y: y - 0.1, z: TZ + Math.sin(th) * (rOut - 0.12), ry: Math.PI / 2 - th }, () => c.boite(0.12, 0.22, 0.32, FONTE, { rx: 0.3 }, M.tole, { crasse: false, nuance: 0.04 }));
      continue;
    }
    const penche = i === iPremiere ? 0.12 : 0;
    c.repere({ x, y, z, ry: Math.PI / 2 - th, rz: penche }, () => {
      c.boite(1.08, 0.05, rOut - rIn, FONTE, { y: -0.025 }, M.tole, { crasse: false, nuance: 0.03 });
      c.boite(0.9, 0.03, rOut - rIn - 0.2, 0x55524c, { y: 0.005 }, M.tole, { crasse: false, nuance: 0.05 });
      c.poutre([0, -0.05, (rOut - rIn) / 2 - 0.05], [0, -0.42, (rOut - rIn) / 2 - 0.05], 0.06, FONTE, M.tole);
      c.poutre([0, -0.05, -(rOut - rIn) / 2 + 0.1], [0, -0.35, (rOut - rIn) / 2 - 0.08], 0.05, FONTE, M.tole);
      c.boite(0.035, 0.95, 0.035, FONTE, { y: 0.475, z: -(rOut - rIn) / 2 + 0.06 }, M.tole, { crasse: false });
    });
    mains.push([TX + Math.cos(th) * (rIn + 0.06), y + 0.95, TZ + Math.sin(th) * (rIn + 0.06)]);
  }
  for (let i = 0; i < mains.length - 1; i++) c.poutre(mains[i], mains[i + 1], 0.05, 0x4a3a2c, M.satine);
  // La main courante arrachée qui pend sous la première marche
  const deb = mains[0];
  c.poutre(deb, [deb[0] + 0.3, deb[1] - 1.6, deb[2] + 0.4], 0.05, 0x4a3a2c, M.satine);
  // Les marches tombées, au sol, au milieu des gravats (au nord-est, loin de la marque)
  for (let k = 0; k < 6; k++) {
    c.boite(1.05, 0.05, 1.25, FONTE, { x: TX + 1.2 + c.entre(-0.8, 0.8), y: 0.08 + k * 0.035, z: TZ - 1.4 + c.entre(-0.8, 0.8), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, M.tole, { nuance: 0.05 });
  }
  gravats(c, TX + 1.4, TZ - 1.6, 1.1, Math.round(8 + 10 * usure), [BLANC, GRANIT, 0xcfc8b8], 0.04);
  // La marque à la craie (P4) : le rectangle des quatre pieds de l'escabeau, une croix, une flèche vers le haut
  const mx = TX + Math.cos(thPremiere) * rm;
  const mz = TZ + Math.sin(thPremiere) * rm;
  c.repere({ x: mx, y: 0.045, z: mz, ry: Math.PI / 2 - thPremiere }, () => {
    const craie = (l, p, pose) => c.boite(l, 0.006, p, 0xf0eee6, pose, M.satine, { crasse: false, nuance: 0.02 });
    craie(0.9, 0.05, { z: -0.4 });
    craie(0.9, 0.05, { z: 0.4 });
    craie(0.05, 0.85, { x: -0.43 });
    craie(0.05, 0.85, { x: 0.43 });
    craie(1.0, 0.05, { ry: 0.75 });
    craie(1.0, 0.05, { ry: -0.75 });
    craie(0.05, 0.6, { z: 0.85 });
    craie(0.3, 0.05, { z: 0.6, x: -0.1, ry: 0.7 });
    craie(0.3, 0.05, { z: 0.6, x: 0.1, ry: -0.7 });
  });
  // La réserve de pétrole : la cuve à pompe, au sud-ouest, près de la porte
  const cx = TX + Math.cos(2.25) * 2.45;
  const cz = TZ + Math.sin(2.25) * 2.45;
  cylindre(c, M.tole, 0x7a4a34, cx, 0, cz, 0.6, 0.62, 1.55, 10);
  for (const yy of [0.3, 0.8, 1.3]) cylindre(c, M.tole, 0x5e3a2a, cx, yy, cz, 0.63, 0.63, 0.05, 10);
  c.tube([cx, 1.55, cz], [cx, 2.15, cz], 0.05, FONTE, M.tole, 6);
  c.poutre([cx, 2.1, cz], [cx + 0.45, 2.35, cz + 0.1], 0.04, FONTE, M.tole);
  c.tube([cx + 0.1, 1.95, cz], [cx + 0.45, 1.75, cz + 0.2], 0.03, FONTE, M.tole, 5);
  b.obstacle(cx - 0.6, cz - 0.6, cx + 0.6, cz - 0.6, "cuve");
  b.obstacle(cx + 0.6, cz - 0.6, cx + 0.6, cz + 0.6, "cuve");
  // Les bidons d'huile ronds, rangés contre le mur au nord-est (pas de jerrican : T8)
  for (let i = 0; i < 6; i++) {
    const th = -0.55 - i * 0.16;
    const r = 3.0 + (i % 2) * 0.3;
    cylindre(c, M.tole, [0x7e3a2e, 0x5d6a4c, 0x8a6a3a][i % 3], TX + Math.cos(th) * r, 0.04, TZ + Math.sin(th) * r, 0.27, 0.27, i % 3 === 0 ? 0.85 : 0.6, 8, {}, { nuance: 0.06 });
  }
  cylindre(c, M.tole, 0x5d6a4c, TX + 0.4, 0.04, TZ - 1.9, 0.22, 0.22, 0.55, 8, { rz: Math.PI / 2, y: 0.26 }); // un bidon couché
  // Des éclats de prismes et une bague de laiton (les débris de la lentille ; le prisme entier est dehors)
  for (let i = 0; i < 5; i++) c.boite(c.entre(0.06, 0.14), 0.03, c.entre(0.05, 0.1), 0xdde9de, { x: TX - 0.6 + c.entre(-0.5, 0.5), y: 0.06, z: TZ + 1.2 + c.entre(-0.4, 0.4), ry: c.hasard() * 3, rz: c.entre(-0.4, 0.4) }, M.lisse, { crasse: false, nuance: 0.03 });
  c.poser(new THREE.TorusGeometry(0.4, 0.03, 3, 12), M.tole, LAITON, { x: TX - 0.3, y: 0.06, z: TZ + 1.5, rx: Math.PI / 2 + 0.15 }, { crasse: false, nuance: 0 });
  // Le rai de lumière qui tombe du fût, une flaque de pluie
  raiDeLumiere(c, [TX + 0.5, H_RDC, TZ - 0.4], [TX + 0.9, 0.05, TZ + 0.3], 1.5, 0.16);
  debris(c, TX - 3, TZ - 3, TX + 3, TZ + 3, Math.round(18 * usure), [BLANC, 0xcfc8b8, GRANIT], 0.04);

  // Dehors : la planche peinte des survivants, contre le mur, près de la porte
  c.repere({ x: TX + 2.3, y: 0, z: TZ + 3.95, ry: -0.55 }, () => {
    c.boite(1.6, 0.6, 0.04, 0x8a7a62, { y: 0.55, z: 0.15, rx: -0.15 }, matiere(0.9));
    panneau(c, M, R.avis, { y: 0.55, z: 0.18, rx: -0.15 }, 1.5, 0.5);
  });
  lierre(c, TX - 4.3, 0, TZ - 1.5, -Math.PI / 2 - 0.4, 3, 2.6, Math.round(30 * usure));
  lierre(c, TX - 2.4, 0, TZ - 3.6, Math.PI + 0.6, 3, 2.8, Math.round(25 * usure));
  mousse(c, TX + 1.5, 0.02, TZ + 4.8, 0.8, 4);
}

// ---------- Les maisons des gardiens : granit, ardoise, trois pièces ----------

const MX1 = -5.6;
const MX2 = 13.4;
const MZ1 = -11;
const MZ2 = -3;
const P1 = 1.4; // cloison cuisine | chambre
const P2 = 6.4; // cloison chambre | salle des machines
const HM = 3.0;

function maisons(b, c, M, usure) {
  const k = b.couche("maisons des gardiens (hauts des murs, toits)", { x: (MX1 + MX2) / 2, z: (MZ1 + MZ2) / 2, l: MX2 - MX1 + 0.8, p: MZ2 - MZ1 + 1 }, CUT, 6.2);
  const enduitInt = { couleur: CREME, mat: M.mat };
  const soubas = { couleur: VERT_EAU, mat: M.mat };
  const fen = (u, l = 1.0) => ({ u, l, bas: 0, haut: 1.4, type: "fenetre", croisillons: 1, traverses: 2, bris: 0.25 + usure * 0.5, volet: c.hasard() < 0.5 ? "ouvert" : "pendu", couleurVolet: BLEU, cadre: 0xe2ddd0, verre: M.verre });

  // Façade sud : bas (allège) dans le chantier, haut dans la couche
  const portes = [
    { u: 4.6, l: 1.6, haut: 2.2, vantail: "entrouvert", angle: 1.2 },
    { u: 16.6, l: 2.2, haut: 2.4, vantail: "tombe" },
  ];
  mur(c, [MX1, MZ2], [MX2, MZ2], { h: CUT, ep: 0.4, couleur: GRANIT, mat: M.granit, batiment: b, interieur: soubas, ouvertures: portes.map((p) => ({ u: p.u, l: p.l, bas: 0, haut: p.haut, type: "porte", vantail: p.vantail, angle: p.angle, couleurPorte: BLEU })) });
  mur(k, [MX1, MZ2], [MX2, MZ2], { h: HM - CUT, y0: CUT, ep: 0.4, couleur: GRANIT, mat: M.granit, interieur: enduitInt, ouvertures: [fen(1.9), ...portes.map((p) => ({ u: p.u, l: p.l, bas: 0, haut: p.haut - CUT, type: "vide" })), fen(9.5), fen(13.2, 1.4)] });
  // Façade est (salle des machines)
  mur(c, [MX2, MZ2], [MX2, MZ1], { h: CUT, ep: 0.4, couleur: GRANIT, mat: M.granit, batiment: b, interieur: soubas });
  mur(k, [MX2, MZ2], [MX2, MZ1], { h: HM - CUT, y0: CUT, ep: 0.4, couleur: GRANIT, mat: M.granit, interieur: enduitInt, ouvertures: [fen(4.2, 1.6)] });
  // Façade nord et pignon ouest (contre la tour) : entiers, dans le chantier
  mur(c, [MX2, MZ1], [MX1, MZ1], { h: HM, ep: 0.4, couleur: GRANIT, mat: M.granit, batiment: b, interieur: enduitInt, ouvertures: [{ u: 3.5, l: 1.6, bas: 1.7, haut: 2.6, type: "fenetre", croisillons: 2, traverses: 1, bris: 0.6, cadre: 0xe2ddd0, verre: M.verre }, { u: 9.4, l: 0.9, bas: 1.0, haut: 2.3, type: "fenetre", croisillons: 1, traverses: 2, bris: 0.5, cadre: 0xe2ddd0, verre: M.verre }] });
  mur(c, [MX1, MZ1], [MX1, MZ2], { h: HM, ep: 0.4, couleur: GRANIT, mat: M.granit, batiment: b, interieur: enduitInt });

  // Les cloisons : soubassement peint vert d'eau, plâtre crème au-dessus (dans la couche), une porte chacune
  for (const x of [P1, P2]) {
    const dz1 = -6.3;
    const dz2 = -4.9;
    for (const [z1, z2] of [[MZ1 + 0.2, dz1], [dz2, MZ2 - 0.2]]) {
      c.pave(x - 0.1, 0, z1, x + 0.1, CUT, z2, VERT_EAU, M.mat, { nuance: 0.02 });
      k.pave(x - 0.1, CUT, z1, x + 0.1, HM, z2, CREME, M.mat, { nuance: 0.02, crasse: false });
      b.obstacle(x, z1, x, z2, "cloison");
    }
    k.pave(x - 0.1, 2.15, dz1, x + 0.1, HM, dz2, CREME, M.mat, { crasse: false });
    // Le chambranle et une porte à panneaux, entrouverte
    c.boite(0.06, 2.1, 0.9, 0x6a5a48, { x: x + 0.12, y: 1.05, z: dz1 + 0.05, ry: 1.25 }, matiere(0.85), { nuance: 0.05 });
  }

  // Les toits d'ardoise : la maison (plus haute), la salle des machines (plus basse)
  const trous = usure > 0.4 ? [{ u: -2.6, v: 1, l: 2.6, p: 0.55 }] : [];
  toitDeuxPans(k, (MX1 + P2) / 2, (MZ1 + MZ2) / 2, P2 - MX1, MZ2 - MZ1, HM, 2.6, { trous });
  toitDeuxPans(k, (P2 + MX2) / 2, (MZ1 + MZ2) / 2, MX2 - P2, MZ2 - MZ1, HM, 2.0, { trous: usure > 0.6 ? [{ u: 1.5, v: -1, l: 1.8, p: 0.5 }] : [] });
  // Les pignons
  pignon(k, M.granit, GRANIT, MX1, (MZ1 + MZ2) / 2, MZ2 - MZ1, HM, 2.6);
  pignon(k, M.granit, GRANIT, P2, (MZ1 + MZ2) / 2, MZ2 - MZ1, HM, 2.6);
  pignon(k, M.granit, GRANIT, MX2, (MZ1 + MZ2) / 2, MZ2 - MZ1, HM, 2.0);
  // Les cheminées de granit et leurs pots
  for (const [x, hc] of [[MX1 + 0.3, 2.6], [P2, 2.6]]) {
    k.pave(x - 0.45, HM + hc - 0.6, -7.5, x + 0.45, HM + hc + 1.0, -6.5, GRANIT, M.granit, { crasse: false });
    k.pave(x - 0.52, HM + hc + 1.0, -7.57, x + 0.52, HM + hc + 1.12, -6.43, GRANIT_SOMBRE, M.granit, { crasse: false });
    for (const dz of [-0.22, 0.22]) {
      const g = new THREE.CylinderGeometry(0.11, 0.14, 0.4, 6);
      k.poser(g, M.mat, 0xa0624a, { x, y: HM + hc + 1.32, z: -7 + dz }, { crasse: false });
      g.dispose();
    }
  }
  // Les gouttières de zinc, une décrochée ; les descentes d'eau
  const yE = HM + 2.6 - 2.6 * ((4 + 0.35) / 4) - 0.06;
  k.tube([MX1 - 0.3, yE, MZ2 + 0.38], [P2, yE, MZ2 + 0.38], 0.07, 0x7f8689, M.mat, 6);
  const yE2 = HM + 2.0 - 2.0 * ((4 + 0.35) / 4) - 0.06;
  k.tube([P2, yE2, MZ2 + 0.38], [9.5, yE2, MZ2 + 0.38], 0.07, 0x7f8689, M.mat, 6);
  k.tube([9.5, yE2, MZ2 + 0.38], [MX2 + 0.3, yE2 - 1.1, MZ2 + 0.6], 0.07, 0x7f8689, M.mat, 6);
  for (const x of [MX1 + 0.6, P2 - 0.2]) c.tube([x, 0.15, MZ2 + 0.3], [x, yE, MZ2 + 0.36], 0.05, 0x7f8689, M.tole, 6);
  // Mousse et lichens sur les ardoises
  mousse(k, -2, HM + 1.3, -8.5, 2.2, Math.round(10 * usure));
  mousse(k, 3.5, HM + 1.4, -5.2, 1.8, Math.round(8 * usure));
  mousse(k, 10.5, HM + 1.0, -5.5, 1.5, Math.round(6 * usure));
  // Les sols : tomettes dans la cuisine, plancher dans la chambre, béton dans la salle des machines
  c.pave(MX1 + 0.2, 0, MZ1 + 0.2, P1 - 0.1, 0.04, MZ2 - 0.2, 0xb87458, M.mat, { crasse: false, nuance: 0 });
  c.pave(P1 + 0.1, 0, MZ1 + 0.2, P2 - 0.1, 0.04, MZ2 - 0.2, 0x8a6a4a, M.mat, { crasse: false, nuance: 0 });
  for (let z = MZ1 + 0.4; z < MZ2 - 0.2; z += 0.36) c.boite(P2 - P1 - 0.2, 0.005, 0.02, 0x5a4130, { x: (P1 + P2) / 2, y: 0.043, z }, M.mat, { crasse: false, nuance: 0 });
  c.pave(P2 + 0.1, 0, MZ1 + 0.2, MX2 - 0.2, 0.04, MZ2 - 0.2, 0x8f8b84, M.mat, { crasse: false, nuance: 0 });
  // Le seuil de granit des portes
  c.pave(-1.6, 0, MZ2 + 0.2, -0.4, 0.08, MZ2 + 0.7, GRANIT_SOMBRE, M.granit);
  c.pave(9.8, 0, MZ2 + 0.2, 12.2, 0.08, MZ2 + 0.7, GRANIT_SOMBRE, M.granit);
  // Lierre sur le pignon est et la façade nord
  lierre(c, MX2 + 0.22, 0, -8.5, Math.PI / 2, 3.5, 1.2, Math.round(30 * usure));
  lierre(c, 2, 0, MZ1 - 0.22, Math.PI, 5, 2.6, Math.round(30 * usure));
  touffes(c, Array.from({ length: Math.round(20 * usure) }, () => [c.entre(MX1, MX2), MZ2 + c.entre(0.3, 0.6), 0]), HERBE_SECHE);
}

// ---------- La cuisine du gardien ----------

function cuisine(b, c, M, usure) {
  const y = 0.04;
  // La cuisinière à charbon, contre le pignon ouest : fonte noire, barre de laiton, tuyau vers la cheminée
  c.pave(MX1 + 0.2, y, -8.7, MX1 + 1.0, y + 0.85, -7.1, 0x2c2b29, M.tole, { nuance: 0.02 });
  c.pave(MX1 + 0.18, y + 0.85, -8.75, MX1 + 1.05, y + 0.9, -7.05, 0x3a3936, M.tole, { crasse: false });
  c.poutre([MX1 + 1.12, y + 0.78, -8.6], [MX1 + 1.12, y + 0.78, -7.2], 0.03, LAITON, M.tole);
  c.pave(MX1 + 1.0, y + 0.3, -8.2, MX1 + 1.03, y + 0.6, -7.6, 0x46423c, M.tole, { crasse: false });
  c.pave(MX1 + 1.0, y + 0.36, -8.12, MX1 + 1.04, y + 0.54, -7.68, 0xffa04a, M.lueur, { crasse: false, nuance: 0 }); // les braises
  c.tube([MX1 + 0.5, y + 0.9, -7.9], [MX1 + 0.5, 2.5, -7.9], 0.08, 0x2c2b29, M.tole, 6);
  c.tube([MX1 + 0.5, 2.5, -7.9], [MX1 + 0.2, 2.55, -7.9], 0.08, 0x2c2b29, M.tole, 6);
  // La bouilloire, la poêle, le seau à charbon
  cylindre(c, M.tole, 0x5a5650, MX1 + 0.55, y + 0.9, -8.2, 0.1, 0.13, 0.2, 8);
  c.tube([MX1 + 0.66, y + 1.0, -8.2], [MX1 + 0.82, y + 1.05, -8.2], 0.02, 0x5a5650, M.tole, 4);
  cylindre(c, M.tole, 0x2c2b29, MX1 + 1.4, y, -8.8, 0.22, 0.18, 0.4, 8);
  for (let i = 0; i < 6; i++) c.poser(BOULE, M.mat, 0x1e1d1b, { x: MX1 + 1.4 + c.entre(-0.4, 0.4), y: y + 0.05, z: -8.6 + c.entre(-0.3, 0.5), e: c.entre(0.05, 0.09) }, { crasse: false });
  b.obstacle(MX1 + 1.0, -8.7, MX1 + 1.0, -7.1, "cuisinière");

  // La table du gardien : le journal de bord ouvert, la longue-vue de laiton, une tasse
  const tx = -2.2;
  const tz = -6.5;
  c.pave(tx - 0.95, y + 0.74, tz - 0.5, tx + 0.95, y + 0.8, tz + 0.5, 0x7a5a3c, M.mat);
  for (const [dx, dz] of [[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]]) c.pave(tx + dx - 0.04, y, tz + dz - 0.04, tx + dx + 0.04, y + 0.74, tz + dz + 0.04, 0x6a4c32, M.mat);
  panneau(c, M, R.journal, { x: tx - 0.25, y: y + 0.81, z: tz + 0.05, rx: -Math.PI / 2, rz: 0.15 }, 0.55, 0.42);
  c.tube([tx + 0.25, y + 0.85, tz - 0.15], [tx + 0.85, y + 0.85, tz + 0.15], 0.045, LAITON, M.tole, 8);
  c.tube([tx + 0.25, y + 0.85, tz - 0.15], [tx + 0.05, y + 0.85, tz - 0.25], 0.035, 0x5a4130, M.mat, 8);
  cylindre(c, M.lisse, 0xe9e5dc, tx - 0.7, y + 0.8, tz - 0.25, 0.05, 0.045, 0.09, 8);
  // Les chaises : deux debout, une renversée
  chaise(c, tx - 0.4, tz - 0.9, 0.1, false);
  chaise(c, tx + 0.6, tz + 0.9, Math.PI + 0.3, false);
  chaise(c, tx - 1.4, tz + 0.7, 1.2, true);
  b.obstacle(tx - 0.95, tz - 0.5, tx + 0.95, tz - 0.5, "table");
  b.obstacle(tx - 0.95, tz + 0.5, tx + 0.95, tz + 0.5, "table");

  // Le vaisselier contre le mur nord : buffet, étagères, assiettes, bocaux
  const vx = 0.0;
  const vz = MZ1 + 0.2;
  c.pave(vx - 0.95, y, vz, vx + 0.95, y + 0.9, vz + 0.5, 0x8a6a48, M.mat);
  c.pave(vx - 1.0, y + 0.9, vz - 0.02, vx + 1.0, y + 0.95, vz + 0.55, 0x7a5a3c, M.mat);
  c.pave(vx - 0.95, y + 0.95, vz, vx + 0.95, y + 2.2, vz + 0.06, 0x8a6a48, M.mat);
  for (const xx of [-0.95, 0.89]) c.pave(vx + xx, y + 0.95, vz, vx + xx + 0.06, y + 2.2, vz + 0.3, 0x8a6a48, M.mat);
  for (let s = 0; s < 3; s++) {
    const ys = y + 1.3 + s * 0.38;
    c.pave(vx - 0.95, ys - 0.02, vz, vx + 0.95, ys, vz + 0.3, 0x7a5a3c, M.mat, { crasse: false });
    for (let q = 0; q < 7; q++) {
      if (c.hasard() < 0.3 + usure * 0.3) continue;
      const g = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 8);
      c.poser(g, M.lisse, q % 3 === 0 ? 0x6f8fa8 : 0xece6d8, { x: vx - 0.78 + q * 0.26, y: ys + 0.12, z: vz + 0.12, rx: Math.PI / 2 - 0.2 }, { crasse: false, nuance: 0.03 });
      g.dispose();
    }
  }
  for (let q = 0; q < 4; q++) cylindre(c, M.verre, 0xc9d8c0, vx - 0.6 + q * 0.4, y + 0.95, vz + 0.35, 0.07, 0.07, 0.22, 6);
  // Les assiettes cassées au sol
  for (let i = 0; i < 12; i++) c.boite(c.entre(0.05, 0.14), 0.01, c.entre(0.04, 0.1), i % 3 ? 0xece6d8 : 0x6f8fa8, { x: vx + c.entre(-1, 1), y: y + 0.01, z: vz + c.entre(0.7, 1.6), ry: c.hasard() * 3 }, M.lisse, { crasse: false, nuance: 0.05 });
  b.obstacle(vx - 1, vz + 0.55, vx + 1, vz + 0.55, "vaisselier");

  // La carte marine encadrée au mur nord, le baromètre, le ciré jaune pendu à sa patère
  c.pave(-4.3, 1.15, MZ1 + 0.2, -2.5, 2.35, MZ1 + 0.24, 0x5a4130, M.mat, { crasse: false });
  panneau(c, M, R.carte, { x: -3.4, y: 1.75, z: MZ1 + 0.26 }, 1.68, 1.08);
  cylindre(c, M.tole, LAITON, -1.3, 1.45, MZ1 + 0.24, 0.17, 0.17, 0.05, 10, { rx: Math.PI / 2 });
  c.boite(0.26, 0.26, 0.01, 0xe9e1cc, { x: -1.3, y: 1.47, z: MZ1 + 0.3 }, M.mat, { crasse: false });
  c.boite(0.05, 0.05, 0.12, 0x5a4130, { x: -5.0, y: 1.9, z: MZ1 + 0.27 }, M.mat);
  c.boite(0.62, 1.0, 0.14, 0xc6a54a, { x: -5.0, y: 1.35, z: MZ1 + 0.32, rz: 0.08 }, M.satine, { nuance: 0.05 });
  c.boite(0.28, 0.22, 0.2, 0xc6a54a, { x: -5.0, y: 1.92, z: MZ1 + 0.36 }, M.satine);
  // Les bottes du gardien, l'une couchée
  c.boite(0.12, 0.42, 0.26, 0x2a2c2a, { x: -4.6, y: 0.25, z: MZ1 + 0.45 }, M.satine);
  c.boite(0.12, 0.42, 0.26, 0x2a2c2a, { x: -4.2, y: 0.1, z: MZ1 + 0.7, rx: Math.PI / 2, ry: 0.6 }, M.satine);
  // Le jour par le toit crevé, les ardoises tombées, les feuilles
  if (usure > 0.4) {
    raiDeLumiere(c, [-2.4, HM + 1.0, -4.4], [-2.9, 0.06, -5.9], 1.6, 0.16);
    for (let i = 0; i < 14; i++) c.boite(c.entre(0.15, 0.3), 0.012, c.entre(0.1, 0.2), ARDOISE, { x: -2.9 + c.entre(-1, 1), y: y + 0.012, z: -5.4 + c.entre(-0.9, 0.9), ry: c.hasard() * 3, rz: c.entre(-0.2, 0.2) }, M.lisse, { crasse: false, nuance: 0.06 });
  }
  jonchee(c, MX1 + 0.4, MZ1 + 0.6, P1 - 0.3, MZ2 - 0.3, Math.round(50 * usure), undefined, y + 0.005);
  debris(c, MX1 + 0.4, MZ1 + 0.6, P1 - 0.3, MZ2 - 0.3, Math.round(14 * usure), [CREME, 0xcfc8b8, GRANIT], y);
}

function chaise(c, x, z, ry, renversee) {
  const y = 0.04;
  c.repere({ x, y: renversee ? y + 0.24 : y, z, ry, rx: renversee ? -Math.PI / 2 : 0 }, () => {
    c.boite(0.44, 0.05, 0.42, 0x7a5a3c, { y: 0.46 }, matiere(0.9));
    c.boite(0.44, 0.45, 0.05, 0x7a5a3c, { y: 0.72, z: -0.19 }, matiere(0.9));
    for (const [a, d] of [[-0.19, -0.17], [0.19, -0.17], [-0.19, 0.17], [0.19, 0.17]]) c.boite(0.04, 0.44, 0.04, 0x5a4130, { x: a, y: 0.22, z: d }, matiere(0.9));
  });
}

// ---------- La chambre ----------

function chambre(b, c, M, usure) {
  const y = 0.04;
  // Le lit de fer contre le mur nord : matelas taché, couverture polaire tombée
  const bx1 = 1.8;
  const bx2 = 3.8;
  const bz1 = MZ1 + 0.25;
  const bz2 = MZ1 + 2.25;
  for (const [x, z, h] of [[bx1, bz1, 1.1], [bx2, bz1, 1.1], [bx1, bz2, 0.8], [bx2, bz2, 0.8]]) c.boite(0.05, h, 0.05, 0x2c2b29, { x, y: y + h / 2, z }, M.tole);
  for (const [z, h] of [[bz1, 1.05], [bz2, 0.75]]) {
    c.poutre([bx1, y + h, z], [bx2, y + h, z], 0.04, 0x2c2b29, M.tole);
    for (let i = 1; i < 6; i++) c.boite(0.02, h - 0.4, 0.02, 0x2c2b29, { x: bx1 + (i * (bx2 - bx1)) / 6, y: y + 0.4 + (h - 0.4) / 2, z }, M.tole, { crasse: false });
  }
  c.pave(bx1, y + 0.35, bz1, bx2, y + 0.4, bz2, 0x2c2b29, M.tole);
  c.boite(1.9, 0.2, 1.9, 0xc9bca0, { x: (bx1 + bx2) / 2, y: y + 0.5, z: (bz1 + bz2) / 2, rz: 0.03 }, M.mat, { nuance: 0.03 });
  c.boite(0.8, 0.02, 0.6, 0x9a8a6a, { x: 2.6, y: y + 0.61, z: bz1 + 0.9 }, matiere(), { crasse: false }); // tache
  c.boite(1.6, 0.04, 1.2, 0xd8457e, { x: 3.2, y: y + 0.03, z: bz2 + 0.4, ry: 0.4 }, matiere(), { crasse: false, nuance: 0.05 }); // la couverture polaire fuchsia, tombée
  c.boite(0.5, 0.15, 0.35, 0xe2d9c3, { x: 2.1, y: y + 0.66, z: bz1 + 0.35 }, matiere(), { crasse: false });
  b.obstacle(bx1, bz2, bx2, bz2, "lit");
  // La table de nuit, la bougie et la lampe à huile
  c.pave(4.2, y, MZ1 + 0.25, 4.8, y + 0.6, MZ1 + 0.75, 0x7a5a3c, M.mat);
  cylindre(c, M.lisse, 0xe9e5dc, 4.6, y + 0.6, MZ1 + 0.45, 0.03, 0.03, 0.12, 6);
  cylindre(c, M.tole, LAITON, 4.35, y + 0.6, MZ1 + 0.5, 0.08, 0.1, 0.12, 8);
  cylindre(c, M.verre, 0xe8efe8, 4.35, y + 0.72, MZ1 + 0.5, 0.05, 0.07, 0.2, 8);
  // L'armoire basculée en avant, portes ouvertes, linge répandu
  c.boite(1.2, 0.6, 2.0, 0x6a4c32, { x: 5.6, y: y + 0.42, z: -6.2, rx: -1.35 }, M.mat, { nuance: 0.04 });
  for (let i = 0; i < 5; i++) c.boite(c.entre(0.4, 0.7), 0.03, c.entre(0.3, 0.5), [0xe2d9c3, 0x5d7f93, 0x8a7a62][i % 3], { x: 5 + c.entre(-0.6, 0.6), y: y + 0.03 + i * 0.008, z: -4.6 + c.entre(-0.6, 0.6), ry: c.hasard() * 3 }, matiere(), { crasse: false, nuance: 0.05 });
  // Le coffre de marin au pied du lit, une chaise, le cadre tombé
  c.pave(2.2, y, bz2 + 0.4, 3.3, y + 0.5, bz2 + 1.0, 0x5d7f93, M.mat);
  c.boite(1.1, 0.06, 0.62, 0x4d6f83, { x: 2.75, y: y + 0.75, z: bz2 + 0.45, rx: -1.2 }, M.mat);
  chaise(c, 5.2, -9.3, -0.6, false);
  c.boite(0.35, 0.45, 0.03, 0x5a4130, { x: 1.9, y: 1.7, z: MZ1 + 0.24 }, M.mat, { crasse: false });
  c.boite(0.27, 0.36, 0.01, 0x9a9488, { x: 1.9, y: 1.7, z: MZ1 + 0.26 }, M.lisse, { crasse: false });
  jonchee(c, P1 + 0.3, MZ1 + 0.4, P2 - 0.3, MZ2 - 0.3, Math.round(35 * usure), undefined, y + 0.005);
  debris(c, P1 + 0.3, MZ1 + 0.4, P2 - 0.3, MZ2 - 0.3, Math.round(9 * usure), [CREME, 0xcfc8b8], y);
}

// ---------- La salle des machines ----------

function machines(b, c, M, usure) {
  const y = 0.04;
  // Le socle de béton, le groupe électrogène : moteur vert d'atelier, volant, alternateur, échappement
  c.pave(8.2, y, -8.7, 11.6, y + 0.25, -7.1, 0x8a867c, M.mat);
  c.pave(8.4, y + 0.25, -8.5, 10.1, y + 1.25, -7.3, 0x55695a, M.satine, { nuance: 0.03 });
  c.pave(8.5, y + 1.25, -8.4, 10.0, y + 1.5, -7.4, 0x4a5c4e, M.satine);
  for (let i = 0; i < 4; i++) cylindre(c, M.tole, 0x3f4b42, 8.7 + i * 0.38, y + 1.5, -7.9, 0.12, 0.12, 0.2, 6);
  cylindre(c, M.tole, 0x2c2b29, 10.35, y + 0.25, -7.9, 0.55, 0.55, 0.16, 12, { rz: Math.PI / 2, x: 10.25, y: y + 0.85 });
  c.pave(10.5, y + 0.25, -8.4, 11.5, y + 1.15, -7.4, 0x6a6f70, M.tole, { nuance: 0.03 });
  for (let i = 0; i < 5; i++) c.boite(0.03, 0.85, 1.02, 0x55595b, { x: 10.6 + i * 0.2, y: y + 0.7, z: -7.9 }, M.tole, { crasse: false });
  c.tube([9.0, y + 1.5, -7.9], [9.0, HM, -7.9], 0.09, PALETTE.rouilleSombre, M.tole, 6);
  // L'échappement traverse le toit (au-dessus, dans la couche des toits)
  const k = b.couches.find((q) => q.nom.startsWith("maisons")).c;
  k.tube([9.0, HM, -7.9], [9.0, HM + 2.6, -7.9], 0.09, PALETTE.rouilleSombre, M.mat, 6);
  k.boite(0.35, 0.05, 0.35, PALETTE.rouilleSombre, { x: 9.0, y: HM + 2.65, z: -7.9, rz: 0.2 }, M.mat);
  b.obstacle(8.2, -8.7, 11.6, -8.7, "groupe électrogène");
  b.obstacle(8.2, -7.1, 11.6, -7.1, "groupe électrogène");
  b.obstacle(8.2, -8.7, 8.2, -7.1, "groupe électrogène");
  b.obstacle(11.6, -8.7, 11.6, -7.1, "groupe électrogène");
  // Les réservoirs de gazole couchés sur leurs berceaux, contre le pignon est
  for (const z of [-10.0, -8.6]) {
    const g = new THREE.CylinderGeometry(0.5, 0.5, 1.9, 10);
    c.poser(g, M.tole, 0x7a5a40, { x: 12.6, y: y + 0.85, z, rx: Math.PI / 2, ry: Math.PI / 2 }, { nuance: 0.05 });
    g.dispose();
    for (const dx of [-0.6, 0.6]) c.pave(12.6 + dx - 0.08, y, z - 0.45, 12.6 + dx + 0.08, y + 0.5, z + 0.45, 0x55524c, M.tole);
  }
  c.tube([12.6, y + 1.35, -10], [12.6, y + 1.35, -8.6], 0.03, 0x55524c, M.tole, 5);
  c.tube([11.7, y + 0.6, -9.3], [10.4, y + 0.6, -8.5], 0.03, 0x55524c, M.tole, 5);
  b.obstacle(12.0, MZ1 + 0.2, 12.0, -8.0, "réservoirs");
  // Le tableau électrique de marbre, interrupteurs à couteaux, et l'autocollant de Watty
  c.pave(10.8, 0.9, MZ1 + 0.2, 12.2, 2.3, MZ1 + 0.26, 0x2e2c2b, M.lisse);
  for (let i = 0; i < 4; i++) {
    c.boite(0.08, 0.3, 0.05, 0xcfc8b8, { x: 11.05 + i * 0.32, y: 1.8, z: MZ1 + 0.3 }, M.lisse);
    c.boite(0.04, 0.32, 0.04, 0xa8a8a8, { x: 11.05 + i * 0.32, y: 1.9, z: MZ1 + 0.38, rx: i % 2 ? 0.2 : -0.9 }, M.tole);
  }
  for (let i = 0; i < 3; i++) cylindre(c, M.tole, 0x8d969a, 11.1 + i * 0.45, 1.3, MZ1 + 0.3, 0.1, 0.1, 0.05, 10, { rx: Math.PI / 2 });
  panneau(c, M, R.watty, { x: 11.5, y: 1.0, z: MZ1 + 0.28 }, 0.48, 0.24);
  // L'établi, l'étau, les outils ; les batteries de verre contre la cloison
  c.pave(6.8, y + 0.85, MZ1 + 0.2, 9.4, y + 0.92, MZ1 + 0.9, 0x6a4c32, M.mat);
  for (const x of [6.9, 9.3]) c.pave(x - 0.05, y, MZ1 + 0.25, x + 0.05, y + 0.85, MZ1 + 0.85, 0x5a4130, M.mat);
  c.pave(8.9, y + 0.92, MZ1 + 0.6, 9.2, y + 1.12, MZ1 + 0.8, 0x3f4b42, M.tole);
  c.pave(7.0, 1.3, MZ1 + 0.2, 9.2, 2.3, MZ1 + 0.24, 0x8a6a48, M.mat, { crasse: false });
  for (let i = 0; i < 6; i++) c.boite(0.05, c.entre(0.25, 0.45), 0.03, 0x55524c, { x: 7.2 + i * 0.35, y: 1.8, z: MZ1 + 0.28, rz: c.entre(-0.2, 0.2) }, M.tole, { crasse: false });
  for (let i = 0; i < 6; i++) {
    const x = P2 + 0.4 + (i % 3) * 0.32;
    const z = -10.1 + Math.floor(i / 3) * 0.32;
    c.pave(x - 0.13, y, z - 0.13, x + 0.13, y + 0.42, z + 0.13, 0x9fb7bc, M.verre, { crasse: false });
    c.pave(x - 0.1, y, z - 0.1, x + 0.1, y + 0.3, z + 0.1, 0x55524c, M.tole, { crasse: false });
  }
  // Fûts d'huile, taches au sol, outils épars
  cylindre(c, M.tole, 0x2f4b6a, 7.0, y, -4.2, 0.3, 0.3, 0.9, 10);
  c.poser(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 10), M.tole, 0x7e3a2e, { x: 7.7, y: y + 0.3, z: -4.0, rz: Math.PI / 2, ry: 0.4 }, {});
  for (let i = 0; i < 6; i++) {
    const g = new THREE.CylinderGeometry(c.entre(0.25, 0.6), c.entre(0.25, 0.6), 0.005, 9);
    c.poser(g, M.lisse, 0x2a2826, { x: c.entre(7, 12.5), y: y + 0.003, z: c.entre(-6.5, -3.6) }, { crasse: false, nuance: 0 });
    g.dispose();
  }
  debris(c, P2 + 0.3, MZ1 + 0.4, MX2 - 0.3, MZ2 - 0.3, Math.round(14 * usure), [0xcfc8b8, GRANIT, PALETTE.rouille], y);
  // La porte tombée de la salle des machines, devant (le battant de droite est resté)
  c.boite(1.05, 2.3, 0.06, BLEU, { x: 12.0, y: 1.2, z: MZ2 + 0.45, ry: -0.9 }, matiere(0.85), { nuance: 0.05 });
}

// ---------- Le Lighthouse Lodge : terrasse, jacuzzi, borne, boîte à clés ----------

function lodge(b, c, M, usure) {
  // La terrasse de bois, grisée par le sel, quelques lames soulevées
  for (let x = 2.05; x < 9.6; x += 0.15) {
    const leve = c.hasard() < 0.06 + usure * 0.08;
    c.boite(0.13, 0.05, 3.6, 0x9a9384, { x, y: leve ? 0.12 : 0.04, z: -1.05, rx: leve ? c.entre(-0.1, 0.1) : 0, ry: leve ? c.entre(-0.1, 0.1) : 0 }, M.mat, { crasse: false, nuance: 0.06 });
  }
  // Le jacuzzi gonflable dégonflé, affaissé sur lui-même, son eau de pluie croupie
  const jx = 5.5;
  const jz = -0.9;
  for (let j = 0; j < 14; j++) {
    const a = (j / 14) * Math.PI * 2;
    const h = c.entre(0.12, 0.45) * (1.1 - usure * 0.4);
    c.repere({ x: jx + Math.cos(a) * 1.0, y: 0.07, z: jz + Math.sin(a) * 1.0, ry: Math.PI / 2 - a }, () => {
      c.boite(0.5, h, 0.32, 0x5e5a70, { y: h / 2, rx: c.entre(0.1, 0.5), z: 0.05 }, M.satine, { nuance: 0.05, crasse: false });
    });
  }
  const fond = new THREE.CylinderGeometry(0.9, 0.9, 0.04, 14);
  c.poser(fond, M.satine, 0x4e4a5e, { x: jx, y: 0.09, z: jz }, { crasse: false });
  fond.dispose();
  const flaque = new THREE.CylinderGeometry(0.7, 0.7, 0.01, 9);
  c.poser(flaque, M.mer, 0x9ab07a, { x: jx + 0.1, y: 0.12, z: jz - 0.1 }, { crasse: false, nuance: 0 });
  flaque.dispose();
  c.boite(1.8, 0.03, 1.2, 0x55524c, { x: jx + 1.1, y: 0.35, z: jz + 0.4, rz: -0.35, ry: 0.3 }, M.mat, { crasse: false }); // la bâche, à moitié tombée
  c.pave(7.1, 0.06, -2.4, 7.6, 0.5, -2.0, 0xe9e5dc, M.satine); // la pompe « connectée »
  c.boite(0.04, 0.04, 0.01, 0x8a2a24, { x: 7.35, y: 0.42, z: -1.99 }, M.lisse, { crasse: false });
  b.obstacle(jx - 1.1, jz - 1.1, jx + 1.1, jz - 1.1, "jacuzzi");
  b.obstacle(jx - 1.1, jz + 1.1, jx + 1.1, jz + 1.1, "jacuzzi");
  // Deux transats de teck, la guirlande guinguette qui pend, ampoules cassées
  for (const [x, z, ry, r] of [[3.0, -2.0, 0.3, false], [8.6, 0.0, -0.4, true]]) {
    c.repere({ x, y: r ? 0.45 : 0.07, z, ry, rz: r ? Math.PI * 0.9 : 0 }, () => {
      c.boite(0.6, 0.05, 1.7, 0x9a9488, { y: 0.3 }, M.mat, { nuance: 0.05 });
      c.boite(0.6, 0.05, 0.7, 0x9a9488, { y: 0.5, z: -0.75, rx: 0.9 }, M.mat);
      for (const [a, d] of [[-0.26, -0.7], [0.26, -0.7], [-0.26, 0.7], [0.26, 0.7]]) c.boite(0.05, 0.28, 0.05, 0x8a8274, { x: a, y: 0.14, z: d }, M.mat);
    });
  }
  for (const [x, z] of [[2.2, 0.7], [9.4, 0.7], [9.4, -2.6]]) c.boite(0.1, 2.5, 0.1, PALETTE.boisGris, { x, y: 1.25, z }, M.mat);
  const fil = [[2.2, 2.4, 0.7], [5.8, 1.6, 0.7], [9.4, 2.4, 0.7], [9.4, 1.5, -1.0], [9.4, 2.4, -2.6]];
  for (let i = 0; i < fil.length - 1; i++) {
    c.poutre(fil[i], fil[i + 1], 0.015, 0x2a2a28, M.mat);
    for (let t = 0.2; t < 1; t += 0.25) {
      if (c.hasard() < 0.4) continue;
      const p = fil[i].map((v, q) => v + (fil[i + 1][q] - v) * t);
      c.poser(BOULE, M.verre, 0xf3e9c8, { x: p[0], y: p[1] - 0.08, z: p[2], e: 0.05 }, { crasse: false, nuance: 0 });
    }
  }
  // La boîte à clés connectée, sur son poteau près de la cuisine
  c.boite(0.1, 1.2, 0.1, 0x55524c, { x: 0.2, y: 0.6, z: -2.2 }, M.tole);
  c.pave(0.04, 1.05, -2.15, 0.36, 1.45, -1.98, 0x2d3236, M.satine);
  panneau(c, M, R.cles, { x: 0.2, y: 1.25, z: -1.97 }, 0.28, 0.28);
  // Dehors, à la grille sud : le grand panneau du gîte et la borne « Notez votre séjour »
  for (const x of [4.5, 7.3]) c.boite(0.14, 2.3, 0.14, 0x8a8274, { x, y: 1.15, z: 2.5 }, M.mat);
  c.boite(2.95, 1.45, 0.06, 0x2f4b4a, { x: 5.9, y: 1.55, z: 2.55, rz: usure > 0.6 ? -0.06 : 0 }, M.satine);
  panneau(c, M, R.lodge, { x: 5.9, y: 1.55, z: 2.59, rz: usure > 0.6 ? -0.06 : 0 }, 2.8, 1.4);
  c.boite(0.35, 1.1, 0.3, 0xe9e5dc, { x: -0.4, y: 0.55, z: 2.6 }, M.satine);
  c.boite(0.5, 0.42, 0.12, 0xe9e5dc, { x: -0.4, y: 1.25, z: 2.62, rx: -0.35 }, M.satine);
  panneau(c, M, R.borne, { x: -0.4, y: 1.25, z: 2.69, rx: -0.35 }, 0.42, 0.36);
  // La corde à linge de la cour du nord, draps en lambeaux ; le potager mort ; la citerne
  for (const x of [-3, 5]) c.boite(0.1, 2.0, 0.1, PALETTE.boisGris, { x, y: 1.0, z: -13.5 }, M.mat);
  c.poutre([-3, 1.9, -13.5], [5, 1.8, -13.5], 0.015, 0x6a6a64, M.mat);
  for (const [x, l, h] of [[-1.6, 1.1, 1.2], [0.6, 0.9, 0.7], [2.7, 1.3, 1.0]]) c.boite(l, h, 0.02, 0xd8d0c0, { x, y: 1.85 - h / 2, z: -13.48, rz: c.entre(-0.1, 0.1), rx: c.entre(-0.3, 0.1) }, matiere(), { crasse: false, nuance: 0.05 });
  c.pave(6.5, 0, -15.2, 11, 0.18, -12.6, 0x6e5a42, M.mat, { crasse: false });
  for (let i = 0; i < 18; i++) c.poutre([c.entre(6.7, 10.8), 0.18, c.entre(-15, -12.8)], [c.entre(6.7, 10.8), c.entre(0.4, 0.9), c.entre(-15, -12.8)], 0.02, 0x8a7a52, M.mat);
  cylindre(c, M.granit, GRANIT, 13.5, 0, -13.5, 0.9, 0.95, 0.9, 10);
  c.boite(2.0, 0.08, 1.2, 0x55524c, { x: 13.5, y: 0.92, z: -13.6, rz: 0.1 }, M.tole);
}

// ---------- Le hangar à bateau et le canot de sauvetage ----------

const HX1 = -28;
// La rampe du canot : de la grande porte (z = 12, y = 0) à la cassure, puis la partie basse affaissée jusqu'aux galets
const RAMPE_X1 = -25.5;
const RAMPE_X2 = -22.5;
const RAMPE_Z_COUPE = 18.95;
const RAMPE_Y_COUPE = -5.15;
const RAMPE_Z_REPRISE = 19.8;
const RAMPE_Y_REPRISE = -6.65;
const RAMPE_Z_BAS = 23.2;
const RAMPE_Y_BAS = -8.95;
const RAMPE_FIN_COTES = 22.0; // les garde-fous s'arrêtent là : on descend du bout de la rampe sur les galets
const HX2 = -20;
const HZ1 = 3;
const HZ2 = 12;

function hangar(b, c, M, usure) {
  const k = b.couche("hangar à bateau (hauts des murs, toit)", { x: (HX1 + HX2) / 2, z: (HZ1 + HZ2) / 2, l: HX2 - HX1 + 0.8, p: HZ2 - HZ1 + 0.8 }, CUT, 5);
  const H = 2.8;
  const L = HX2 - HX1;
  // Murs de granit : ouest et nord entiers ; est coupé à l'allège avec sa petite porte ; sud ouvert sur la rampe
  mur(c, [HX1, HZ1], [HX1, HZ2], { h: H, ep: 0.45, couleur: GRANIT, mat: M.granit, batiment: b, ouvertures: [{ u: 3, l: 0.8, bas: 1.3, haut: 2.1, type: "fenetre", croisillons: 1, traverses: 1, bris: 0.9, cadre: BLEU, verre: M.verre }] });
  mur(c, [HX2, HZ1], [HX1, HZ1], { h: H, ep: 0.45, couleur: GRANIT, mat: M.granit, batiment: b });
  const pe = { u: 4.5, l: 1.6, bas: 0, haut: 2.15 };
  mur(c, [HX2, HZ2], [HX2, HZ1], { h: CUT, ep: 0.45, couleur: GRANIT, mat: M.granit, batiment: b, ouvertures: [{ ...pe, type: "porte", vantail: "entrouvert", couleurPorte: BLEU, angle: 1.6 }] });
  mur(k, [HX2, HZ2], [HX2, HZ1], { h: H - CUT, y0: CUT, ep: 0.45, couleur: GRANIT, mat: M.granit, ouvertures: [{ ...pe, haut: pe.haut - CUT, type: "vide" }] });
  const gp = { u: L / 2, l: 5.4, bas: 0, haut: 2.6 };
  mur(c, [HX1, HZ2], [HX2, HZ2], { h: CUT, ep: 0.45, couleur: GRANIT, mat: M.granit, batiment: b, ouvertures: [{ ...gp, type: "vide" }] });
  mur(k, [HX1, HZ2], [HX2, HZ2], { h: H - CUT, y0: CUT, ep: 0.45, couleur: GRANIT, mat: M.granit, ouvertures: [{ ...gp, haut: gp.haut - CUT, type: "vide" }] });
  // Les pignons et le toit de tôle rouillée, percé
  for (const z of [HZ1, HZ2]) {
    const s = new THREE.Shape();
    s.moveTo(-L / 2, 0);
    s.lineTo(L / 2, 0);
    s.lineTo(0, 1.8);
    s.lineTo(-L / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.45, bevelEnabled: false });
    k.poser(g, M.granit, GRANIT, { x: (HX1 + HX2) / 2, y: H, z: z - 0.225 }, { crasse: false, nuance: 0.02 });
    g.dispose();
  }
  const trous = usure > 0.3 ? [{ u: -1.5, v: 1, l: 2.4, p: 0.7 }, { u: 2.5, v: -1, l: 1.6, p: 0.5 }] : [];
  toitDeuxPans(k, (HX1 + HX2) / 2, (HZ1 + HZ2) / 2, HZ2 - HZ1, L, H, 1.8, { couleur: 0x8a6650, mat: M.tole, trous, ry: Math.PI / 2 });
  // Les entraits de la charpente
  for (let z = HZ1 + 1.5; z < HZ2; z += 2.2) k.poutre([HX1 + 0.2, H - 0.05, z], [HX2 - 0.2, H - 0.05, z], 0.14, PALETTE.boisSombre, M.mat);

  // Le sol : la rampe de béton au milieu, ses rails, des planches de part et d'autre
  c.pave(HX1 + 0.25, 0, HZ1 + 0.25, HX2 - 0.25, 0.03, HZ2, 0x8f8b84, M.mat, { crasse: false, nuance: 0 });
  c.pave(-25.6, 0, HZ1 + 0.5, -22.4, 0.05, HZ2 + 0.1, 0x9a968c, M.mat, { crasse: false, nuance: 0 });
  // La rampe de lancement : elle quitte le hangar et descend dans la crique, neuf mètres plus bas, sur ses chevalets.
  // Un tronçon s'est effondré (P8) : la partie basse s'est affaissée d'un mètre et a glissé jusque sur les galets. On
  // saute de la partie haute sur la partie basse (≈ 1,5 m) ; on ne remonte pas.
  const zA = HZ2;
  const pente = Math.atan2(-RAMPE_Y_COUPE, RAMPE_Z_COUPE - zA);
  const zB = RAMPE_Z_BAS;
  const yB = RAMPE_Y_BAS;
  const pente2 = Math.atan2(RAMPE_Y_REPRISE - yB, zB - RAMPE_Z_REPRISE);
  const segs = [[zA, 0, RAMPE_Z_COUPE, RAMPE_Y_COUPE, pente], [RAMPE_Z_REPRISE, RAMPE_Y_REPRISE, zB, yB, pente2]];
  for (const [z1, y1, z2, y2, p] of segs) {
    const L = Math.hypot(z2 - z1, y2 - y1);
    c.boite(3.0, 0.22, L, 0x7f7a70, { x: -24, y: (y1 + y2) / 2 - 0.12, z: (z1 + z2) / 2, rx: p }, M.mat, { nuance: 0.02 });
    // Les traverses (des marches, en vérité), les rails
    for (let t = 0.04; t < 1; t += 0.8 / L) c.boite(3.3, 0.12, 0.22, 0x5a4a3a, { x: -24, y: y1 + (y2 - y1) * t + 0.02, z: z1 + (z2 - z1) * t, rx: p }, M.mat, { nuance: 0.06 });
    for (const x of [-24.6, -23.4]) c.poutre([x, y1 + 0.08, z1], [x, y2 + 0.08, z2], 0.07, PALETTE.rouilleSombre, M.tole);
  }
  for (const x of [-24.6, -23.4]) c.poutre([x, 0.08, HZ1 + 0.6], [x, 0.08, zA], 0.07, PALETTE.rouilleSombre, M.tole);
  // La cassure : le béton déchiqueté, les rails tordus qui pendent d'un tronçon à l'autre, le garde-corps de câble
  for (let i = 0; i < 5; i++) c.boite(c.entre(0.4, 0.9), 0.2, c.entre(0.3, 0.6), 0x77726a, { x: -25.2 + i * 0.6, y: RAMPE_Y_COUPE - 0.25 - c.entre(0, 0.3), z: RAMPE_Z_COUPE + c.entre(-0.1, 0.25), rx: c.entre(0.3, 0.9), ry: c.entre(-0.3, 0.3) }, M.mat, { nuance: 0.05 });
  for (const x of [-24.6, -23.4]) {
    c.poutre([x, RAMPE_Y_COUPE + 0.08, RAMPE_Z_COUPE], [x + 0.15, RAMPE_Y_COUPE - 1.0, RAMPE_Z_COUPE + 0.5], 0.07, PALETTE.rouilleSombre, M.tole);
    c.poutre([x + 0.15, RAMPE_Y_COUPE - 1.0, RAMPE_Z_COUPE + 0.5], [x, RAMPE_Y_REPRISE + 0.08, RAMPE_Z_REPRISE], 0.07, PALETTE.rouilleSombre, M.tole);
  }
  for (const x of [RAMPE_X1 + 0.05, RAMPE_X2 - 0.05]) {
    const yz = (z) => (z <= RAMPE_Z_COUPE ? (RAMPE_Y_COUPE * (z - zA)) / (RAMPE_Z_COUPE - zA) : RAMPE_Y_REPRISE + ((yB - RAMPE_Y_REPRISE) * (z - RAMPE_Z_REPRISE)) / (zB - RAMPE_Z_REPRISE));
    let prec = null;
    for (const z of [zA + 0.3, 14.5, 17, RAMPE_Z_COUPE - 0.1, null, RAMPE_Z_REPRISE + 0.2, 21.8]) {
      if (z === null) { prec = null; continue; }
      const p = [x, yz(z) + 0.9, z];
      c.tube([x, yz(z), z], p, 0.04, 0x55524c, M.tole, 4);
      if (prec) c.poutre(prec, p, 0.025, 0x2a2a28, M.tole);
      prec = p;
    }
  }
  // Les chevalets de bois, du flanc de la falaise jusque sous la rampe (ceux du tronçon effondré sont couchés)
  for (let z = zA + 1.6; z < RAMPE_Z_COUPE; z += 1.9) {
    const yd = (RAMPE_Y_COUPE * (z - zA)) / (RAMPE_Z_COUPE - zA) - 0.3;
    const pieds = [];
    for (const x of [-25.4, -22.6]) {
      const ys = solFalaise(x, z) - 0.4;
      if (ys > yd - 0.4) continue;
      c.tube([x, ys, z], [x, yd, z], 0.13, 0x4f4234, M.mat, 6);
      pieds.push([x, ys]);
    }
    if (pieds.length === 2) {
      c.poutre([-25.4, yd - 0.2, z], [-22.6, yd - 0.2, z], 0.12, 0x4f4234, M.mat);
      const ym = Math.max(pieds[0][1], pieds[1][1]);
      if (yd - ym > 2) c.poutre([-25.4, ym + 0.5, z], [-22.6, yd - 0.4, z], 0.1, 0x4f4234, M.mat);
    }
  }
  for (const [x, z, r] of [[-25.2, 19.6, 0.5], [-22.4, 20.4, -0.7], [-23.6, 18.4, 1.2]]) c.tube([x, solFalaise(x, z) + 0.15, z], [x + Math.sin(r) * 2.6, solFalaise(x, z) + 0.5, z + Math.cos(r) * 1.4], 0.13, 0x4f4234, M.mat, 6);
  for (const x of [-25.2, -22.8]) c.tube([x, solFalaise(x, 21) - 0.1, 21], [x, RAMPE_Y_REPRISE - 1.3, 21], 0.12, 0x4f4234, M.mat, 6);
  // Algues sur le bas de la rampe
  for (let i = 0; i < 10; i++) {
    const t = c.entre(0.4, 1);
    const z = RAMPE_Z_REPRISE + (zB - RAMPE_Z_REPRISE) * t;
    const y = RAMPE_Y_REPRISE + (yB - RAMPE_Y_REPRISE) * t;
    c.boite(c.entre(0.2, 0.6), 0.03, c.entre(0.15, 0.4), i % 2 ? 0x4f5f33 : 0x6b6a3a, { x: c.entre(-25.3, -22.7), y: y + 0.03, z, ry: c.hasard() * 0.3, rx: pente2 }, M.mat, { crasse: false, nuance: 0.1 });
  }
  // Le treuil, au fond du hangar : tambour, câble qui file vers la rampe
  for (const x of [-25.1, -22.9]) c.pave(x - 0.1, 0, HZ1 + 0.4, x + 0.1, 1.2, HZ1 + 1.1, 0x3f4b42, M.tole);
  c.poser(new THREE.CylinderGeometry(0.35, 0.35, 2.0, 10).rotateZ(Math.PI / 2), M.tole, 0x55524c, { x: -24, y: 0.85, z: HZ1 + 0.75 }, {});
  c.boite(0.1, 0.5, 0.06, 0x2c2b29, { x: -22.6, y: 1.0, z: HZ1 + 0.75, rx: 0.6 }, M.tole);
  c.poutre([-24, 0.55, HZ1 + 1.0], [-24, 0.12, zA], 0.03, 0x2a2a28, M.tole);

  // Le canot de sauvetage sur son ber
  canot(c, M, -24, 7.6, usure);
  b.obstacle(-25.3, 4.0, -25.3, 11.2, "canot");
  b.obstacle(-22.7, 4.0, -22.7, 11.2, "canot");
  // Les vantaux de la grande porte : l'un pend, l'autre est tombé sur la rampe
  c.repere({ x: HX1 + 1.3, y: 0, z: HZ2 + 0.25, ry: 1.25 }, () => {
    for (let i = 0; i < 5; i++) c.boite(0.5, 2.5, 0.05, i % 2 ? 0x6f8b9a : BLEU, { x: 0.25 + i * 0.52, y: 1.3, rz: i === 4 ? 0.06 : 0 }, M.mat, { nuance: 0.06 });
    c.boite(2.6, 0.12, 0.07, 0x5a4a3a, { x: 1.3, y: 0.6, z: 0.05 }, M.mat);
    c.boite(2.6, 0.12, 0.07, 0x5a4a3a, { x: 1.3, y: 2.1, z: 0.05 }, M.mat);
  });
  c.repere({ x: -22.3, y: 0.06, z: HZ2 - 3.2, ry: 0.25 }, () => {
    for (let i = 0; i < 5; i++) c.boite(0.5, 0.05, 2.5, BLEU, { x: i * 0.52 }, M.mat, { nuance: 0.06 });
  });

  // L'établi du hangar contre le mur ouest : le photophore solaire « Watty Glow » (il charge encore le jour, il luit la
  // nuit), les avirons, des clés plates
  c.pave(HX1 + 0.25, 0.85, 4.5, HX1 + 1.05, 0.92, 7.5, 0x6a4c32, M.mat);
  for (const z of [4.6, 7.4]) c.pave(HX1 + 0.3, 0, z - 0.05, HX1 + 1.0, 0.85, z + 0.05, 0x5a4130, M.mat);
  c.pave(-27.3, 0.92, 5.85, -26.9, 1.18, 6.15, 0xe9e5dc, M.satine);
  c.boite(0.36, 0.02, 0.26, 0x2a3d5a, { x: -27.1, y: 1.2, z: 6, rz: 0.15 }, M.satine, { crasse: false }); // le panneau solaire
  c.boite(0.2, 0.1, 0.02, 0xc79a3b, { x: -26.95, y: 1.05, z: 6, ry: Math.PI / 2 }, M.satine, { crasse: false }); // le sourire de Watty
  cylindre(c, M.lueur, 0xbfe6ff, -27.1, 1.18, 6, 0.06, 0.06, 0.06, 6);
  for (let i = 0; i < 4; i++) c.boite(0.03, 0.02, c.entre(0.15, 0.25), 0x8d969a, { x: -27.6 + i * 0.12, y: 0.93, z: 7.0, ry: c.entre(-0.3, 0.3) }, M.tole, { crasse: false });
  for (let i = 0; i < 3; i++) c.poutre([HX1 + 0.35, 0.1, 8.2 + i * 0.4], [HX1 + 0.4, 2.6, 8.6 + i * 0.4], 0.06, 0xb09a78, M.mat);
  // Les bouées couronnes au mur nord, les filets suspendus, les rouleaux de cordage
  for (const [x, c1] of [[-26.5, 0xd9d2c4], [-25.4, 0xc0503a], [-21.6, 0xd9d2c4]]) c.poser(new THREE.TorusGeometry(0.32, 0.09, 4, 10), M.satine, c1, { x, y: 1.7, z: HZ1 + 0.36 }, { crasse: false, nuance: 0.04 });
  for (let i = 0; i < 4; i++) c.boite(0.9, c.entre(1.4, 2.2), 0.03, 0x4f5a44, { x: -21.2 + c.entre(-0.3, 0.3), y: 1.5, z: 4.2 + i * 0.6, ry: Math.PI / 2 + c.entre(-0.3, 0.3), rz: c.entre(-0.1, 0.1) }, M.mat, { crasse: false, nuance: 0.08 });
  for (const [x, z] of [[-21.0, 9.8], [-21.4, 10.8], [-27.2, 10.6]]) {
    for (let r = 0; r < 3; r++) c.poser(new THREE.TorusGeometry(0.35 - r * 0.02, 0.05, 3, 10), M.mat, 0xb09a6a, { x, y: 0.06 + r * 0.09, z, rx: Math.PI / 2 }, { crasse: false, nuance: 0.05 });
  }
  jonchee(c, HX1 + 0.4, HZ1 + 0.4, HX2 - 0.4, HZ2 - 0.2, Math.round(30 * usure), [0x8a7a52, 0x6b6a3a, 0x9c8a6a], 0.04);
  gravats(c, -21.2, 4.0, 0.8, 6, [GRANIT, GRANIT_SOMBRE], 0.03);
  raiDeLumiere(c, [-23.3, H + 1.5, 8.6], [-24.0, 0.1, 9.6], 1.4, 0.16);
  lierre(c, HX1 - 0.25, 0, 9, -Math.PI / 2, 4, 2.2, Math.round(30 * usure));
}

/** Le canot de sauvetage : coque à clins blanche et bleue, bordages pourris tombés, membrures à nu. */
function canot(c, M, x, z, usure) {
  const Lc = 7.0;
  const Bc = 2.3;
  const Dc = 1.0;
  const nS = 10;
  const nK = 5;
  const P = (t, f, s) => {
    const w = (Bc / 2) * Math.pow(Math.max(0, 1 - t * t), 0.5);
    return [s * w * (0.22 + 0.78 * Math.sin((f * Math.PI) / 2)), Dc * f + 0.3 * t * t * f, (t * Lc) / 2];
  };
  // Le ber et ses roues sur les rails
  for (const dx of [-0.6, 0.6]) c.pave(x + dx - 0.08, 0.1, z - 3, x + dx + 0.08, 0.32, z + 3, 0x5a4a3a, M.mat);
  for (const dz of [-2.2, 0, 2.2]) c.pave(x - 0.9, 0.32, z + dz - 0.1, x + 0.9, 0.5, z + dz + 0.1, 0x5a4a3a, M.mat);
  for (const dz of [-2.5, 2.5]) for (const dx of [-0.6, 0.6]) cylindre(c, M.tole, PALETTE.rouilleSombre, x + dx, 0.1, z + dz, 0.12, 0.12, 0.08, 8, { rz: Math.PI / 2, y: 0.14 });
  c.repere({ x, y: 0.5, z, rz: 0.07, rx: 0.02 }, () => {
    // La quille et les étraves
    c.poutre(P(-1, 0, 1), P(1, 0, 1), 0.14, 0x4a3a2c, M.mat);
    for (const t of [-1, 1]) c.poutre([0, -0.05, (t * Lc) / 2], [0, Dc + 0.4, (t * Lc) / 2 + t * 0.15], 0.14, 0x4a3a2c, M.mat);
    // Les bordages à clins
    for (let kk = 0; kk < nK; kk++) {
      const f = (kk + 0.5) / nK;
      const teinte = kk === nK - 1 ? 0x5d7f93 : kk < 2 ? 0x8a4a3a : 0xd8d2c4;
      for (const s of [-1, 1]) {
        for (let i = 0; i < nS; i++) {
          const t1 = -1 + (2 * i) / nS;
          const t2 = -1 + (2 * (i + 1)) / nS;
          if (s === 1 && kk < 4 && c.hasard() < 0.12 + usure * 0.4) continue; // pourri, tombé
          if (s === -1 && c.hasard() < 0.05 + usure * 0.1) continue;
          planche(c, P(t1, f, s), P(t2, f, s), (Dc / nK) * 1.35, 0.04, c.hasard() < 0.2 ? 0x9a9488 : teinte, M.mat, [s * 0.3, 1, 0], { nuance: 0.06 });
        }
      }
    }
    // Les membrures, à nu là où les bordages sont tombés
    for (let i = 1; i < nS; i++) {
      const t = -1 + (2 * i) / nS;
      for (const s of [-1, 1]) {
        let prec = P(t, 0, s);
        for (const f of [0.35, 0.7, 1]) {
          const p = P(t, f, s);
          c.poutre(prec, p, 0.06, 0x5a4130, M.mat);
          prec = p;
        }
      }
    }
    // Le plat-bord, les bancs de nage
    for (const s of [-1, 1]) for (let i = 0; i < nS; i++) c.poutre(P(-1 + (2 * i) / nS, 1, s), P(-1 + (2 * (i + 1)) / nS, 1, s), 0.08, 0x3f5a6a, M.mat);
    for (const t of [-0.45, 0, 0.45]) {
      const w = P(t, 0.75, 1)[0];
      c.boite(w * 2, 0.05, 0.28, 0x8a7a62, { y: Dc * 0.72 + 0.3 * t * t * 0.75, z: (t * Lc) / 2, rz: t === 0 ? 0.25 : 0 }, M.mat, { nuance: 0.05 });
    }
    // Un aviron, une gaffe, l'eau de pluie au fond
    c.poutre([-0.5, 0.45, -2], [0.6, 0.6, 2.2], 0.06, 0xb09a78, M.mat);
    c.boite(1.2, 0.01, 2.6, 0x9ab07a, { y: 0.22 }, M.mer, { crasse: false, nuance: 0 });
  });
  // La plaque du canot
  panneau(c, M, R.canot, { x: x + 1.35, y: 1.25, z: z + 2.4, ry: Math.PI / 2 - 0.15 }, 0.6, 0.4);
}

// ---------- La salle de la corne de brume ----------

const CX1 = 15;
const CX2 = 22;
const CZ1 = 4;
const CZ2 = 10;

function corne(b, c, M, usure) {
  const k = b.couche("salle de la corne de brume (hauts des murs, toit)", { x: (CX1 + CX2) / 2, z: (CZ1 + CZ2) / 2, l: CX2 - CX1 + 0.8, p: CZ2 - CZ1 + 0.8 }, CUT, 4);
  const H = 3.2;
  // Murs enduits : nord et ouest entiers (porte à l'ouest, côté chemin), sud et est coupés à l'allège
  mur(c, [CX2, CZ1], [CX1, CZ1], { h: H, ep: 0.35, couleur: BLANC, mat: M.enduit, batiment: b, ouvertures: [{ u: 3.5, l: 1.2, bas: 1.4, haut: 2.5, type: "fenetre", croisillons: 1, traverses: 2, bris: 0.8, cadre: BLEU, verre: M.verre }] });
  mur(c, [CX1, CZ1], [CX1, CZ2], { h: H, ep: 0.35, couleur: BLANC, mat: M.enduit, batiment: b, ouvertures: [{ u: 3, l: 1.6, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", couleurPorte: BLEU, angle: 1.3 }] });
  const fs = { u: 2, l: 1.2, bas: 0.3, haut: 1.5, type: "vide" };
  mur(c, [CX1, CZ2], [CX2, CZ2], { h: CUT, ep: 0.35, couleur: BLANC, mat: M.enduit, batiment: b });
  mur(k, [CX1, CZ2], [CX2, CZ2], { h: H - CUT, y0: CUT, ep: 0.35, couleur: BLANC, mat: M.enduit, ouvertures: [fs, { ...fs, u: 5 }] });
  mur(c, [CX2, CZ2], [CX2, CZ1], { h: CUT, ep: 0.35, couleur: BLANC, mat: M.enduit, batiment: b });
  mur(k, [CX2, CZ2], [CX2, CZ1], { h: H - CUT, y0: CUT, ep: 0.35, couleur: BLANC, mat: M.enduit, ouvertures: [{ ...fs, u: 3 }] });
  // Les encadrements des fenêtres sans vitres, le toit-terrasse et son acrotère
  for (const [x, z, ry] of [[CX1 + 2, CZ2 + 0.18, 0], [CX1 + 5, CZ2 + 0.18, 0], [CX2 + 0.18, CZ2 - 3, Math.PI / 2]]) {
    k.repere({ x, y: CUT, z, ry }, () => {
      k.boite(1.4, 0.12, 0.12, 0xbab5aa, { y: 1.55 }, M.enduit, { crasse: false });
      k.boite(1.45, 0.08, 0.2, 0xbab5aa, { y: 0.26 }, M.enduit, { crasse: false });
      for (const s of [-1, 1]) k.boite(0.1, 1.25, 0.1, 0xbab5aa, { x: s * 0.65, y: 0.9 }, M.enduit, { crasse: false });
    });
  }
  k.pave(CX1 - 0.25, H, CZ1 - 0.25, CX2 + 0.25, H + 0.25, CZ2 + 0.25, 0xb9b4a8, M.enduit, { crasse: false, nuance: 0 });
  for (const [x1, z1, x2, z2] of [[CX1 - 0.25, CZ1 - 0.25, CX2 + 0.25, CZ1], [CX1 - 0.25, CZ2, CX2 + 0.25, CZ2 + 0.25], [CX1 - 0.25, CZ1, CX1, CZ2], [CX2, CZ1, CX2 + 0.25, CZ2]]) k.pave(x1, H + 0.25, z1, x2, H + 0.6, z2, BLANC, M.enduit, { crasse: false, nuance: 0 });
  for (let i = 0; i < 10; i++) {
    const x = c.entre(CX1, CX2);
    k.boite(c.entre(0.08, 0.2), c.entre(0.5, 1.6), 0.02, 0x8f8a80, { x, y: H - 0.5, z: CZ2 + 0.19 }, M.enduit, { crasse: false, nuance: 0.1 });
  }
  // Le sol de ciment ; le compresseur (deux cylindres, volant, moteur) ; les deux réservoirs d'air
  c.pave(CX1 + 0.18, 0, CZ1 + 0.18, CX2 - 0.18, 0.04, CZ2 - 0.18, 0x9a968e, M.mat, { crasse: false, nuance: 0 });
  c.pave(16.4, 0.04, 6.8, 19.0, 0.3, 8.8, 0x8a867c, M.mat);
  c.pave(16.6, 0.3, 7.2, 18.0, 0.9, 8.4, 0x55695a, M.satine);
  for (const dz of [-0.3, 0.3]) cylindre(c, M.satine, 0x4a5c4e, 17.3, 0.9, 7.8 + dz, 0.24, 0.26, 0.75, 8);
  c.pave(17.0, 1.65, 7.3, 17.6, 1.8, 8.3, 0x3f4b42, M.satine);
  const volant = new THREE.CylinderGeometry(0.6, 0.6, 0.12, 12);
  c.poser(volant, M.tole, 0x2c2b29, { x: 18.3, y: 0.95, z: 7.8, rz: Math.PI / 2 }, {});
  volant.dispose();
  c.pave(18.5, 0.3, 7.4, 18.95, 0.85, 8.2, 0x6a6f70, M.tole);
  // La courroie cassée est un objet nommé (courroie_compresseur) : objetsPhare()
  b.obstacle(16.4, 6.8, 19.0, 6.8, "compresseur");
  b.obstacle(16.4, 8.8, 19.0, 8.8, "compresseur");
  for (const [x, z] of [[20.8, 5.1], [20.8, 6.3]]) {
    cylindre(c, M.tole, 0x6f7a6a, x, 0.04, z, 0.45, 0.45, 2.0, 10);
    c.poser(BOULE, M.tole, 0x6f7a6a, { x, y: 2.04, z, e: [0.45, 0.25, 0.45] }, { crasse: false });
    for (const yy of [0.5, 1.5]) cylindre(c, M.tole, 0x55605a, x, yy, z, 0.46, 0.46, 0.05, 10);
  }
  b.obstacle(20.3, 4.6, 20.3, 6.8, "réservoirs d'air");
  // Les tuyaux : du compresseur aux réservoirs, des réservoirs à la corne à travers le mur sud
  c.tube([17.3, 1.8, 7.8], [17.3, 2.5, 7.8], 0.05, 0x55524c, M.tole, 6);
  c.tube([17.3, 2.5, 7.8], [20.8, 2.5, 6.3], 0.05, 0x55524c, M.tole, 6);
  c.tube([20.8, 2.0, 6.3], [20.8, 2.5, 6.3], 0.05, 0x55524c, M.tole, 6);
  c.tube([20.8, 0.8, 5.5], [20.8, 0.8, 9.7], 0.06, 0x55524c, M.tole, 6);
  c.tube([20.8, 0.8, 9.7], [18.5, 0.8, 11.0], 0.06, PALETTE.rouilleSombre, M.tole, 6);
  // Le pupitre et ses manomètres
  c.pave(CX1 + 0.2, 0.04, CZ1 + 0.3, CX1 + 0.7, 1.1, CZ1 + 1.6, 0x55605a, M.tole);
  for (let i = 0; i < 3; i++) cylindre(c, M.tole, 0xd9d2c0, CX1 + 0.72, 1.3, CZ1 + 0.5 + i * 0.4, 0.12, 0.12, 0.05, 10, { rz: Math.PI / 2 });
  debris(c, CX1 + 0.3, CZ1 + 0.3, CX2 - 0.3, CZ2 - 0.3, Math.round(12 * usure), [BLANC, 0xcfc8b8, PALETTE.rouille], 0.04);
  gravats(c, 21, 9, 0.7, 6, [BLANC, 0xcfc8b8], 0.04);

  // La corne de brume, sur son bâti au bord de la falaise : deux pavillons rouillés tournés vers le large
  const hx = 18.5;
  const hz = 14.7;
  for (const dx of [-0.9, 0.9]) {
    c.poutre([hx + dx, 0, hz - 0.8], [hx + dx * 0.6, 1.5, hz], 0.1, 0x55524c, M.tole);
    c.poutre([hx + dx, 0, hz + 0.8], [hx + dx * 0.6, 1.5, hz], 0.1, 0x55524c, M.tole);
  }
  c.pave(hx - 0.9, 1.45, hz - 0.3, hx + 0.9, 1.6, hz + 0.3, 0x55524c, M.tole);
  for (const dx of [-0.45, 0.45]) {
    const pav = new THREE.ConeGeometry(0.55, 2.4, 10, 1, true);
    c.poser(pav, M.tole, 0x9a4433, { x: hx + dx, y: 2.15, z: hz + 0.5, rx: -Math.PI / 2 }, { crasse: false, nuance: 0.05 });
    pav.dispose();
    const fondP = new THREE.CircleGeometry(0.5, 10);
    c.poser(fondP, M.tole, 0x1e1a18, { x: hx + dx, y: 2.15, z: hz + 1.3 }, { crasse: false, nuance: 0 });
    fondP.dispose();
    const levre = new THREE.TorusGeometry(0.55, 0.05, 3, 10);
    c.poser(levre, M.tole, PALETTE.rouilleSombre, { x: hx + dx, y: 2.15, z: hz + 1.7 }, { crasse: false, nuance: 0 });
    levre.dispose();
    c.tube([hx + dx, 2.15, hz - 0.7], [hx + dx, 2.15, hz - 1.1], 0.09, PALETTE.rouilleSombre, M.tole, 6);
  }
  c.pave(hx - 0.7, 1.6, hz - 1.5, hx + 0.7, 2.6, hz - 0.9, 0x6e3a22, M.tole);
  c.tube([hx, 1.0, hz - 1.4], [hx, 0.8, 11.0], 0.06, PALETTE.rouilleSombre, M.tole, 6);
  for (let i = 0; i < 6; i++) c.boite(c.entre(0.1, 0.3), 0.02, c.entre(0.1, 0.25), PALETTE.rouille, { x: hx + c.entre(-1, 1), y: 0.02, z: hz + c.entre(-1, 1), ry: c.hasard() * 3 }, M.tole, { crasse: false });
  b.obstacle(hx - 1, hz - 1.5, hx + 1, hz - 1.5, "corne de brume");
  b.obstacle(hx - 1, hz - 1.5, hx - 1, hz + 1, "corne de brume");
  b.obstacle(hx + 1, hz - 1.5, hx + 1, hz + 1, "corne de brume");
  lierre(c, CX1 - 0.2, 0, 8.5, -Math.PI / 2, 2, 1.8, Math.round(25 * usure));
}

// ---------- L'abri du douanier, en ruine ----------

function abriDouanier(b, c, M, usure) {
  const x1 = -25.6;
  const x2 = -22.4;
  const z1 = -8.8;
  const z2 = -5.2;
  const spec = (breches) => ({ h: 2.0, ep: 0.45, couleur: GRANIT_SOMBRE, mat: M.granit, batiment: b, arase: 0.3, breches });
  mur(c, [x2, z1], [x1, z1], spec([{ u: 1.2, l: 1.6, profondeur: 0.6 }]));
  mur(c, [x1, z1], [x1, z2], spec([]));
  mur(c, [x2, z2], [x2, z1], spec([{ u: 2.2, l: 2.2, profondeur: 1.1 * usure }]));
  mur(c, [x1, z2], [x2, z2], { ...spec([]), h: 1.1, ouvertures: [{ u: 2.0, l: 1.6, bas: 0, haut: 2.2, type: "vide" }] });
  // La petite cheminée, le banc de pierre, la couverture
  c.pave(x1 + 0.22, 0, z1 + 1.0, x1 + 0.7, 1.6, z1 + 2.2, GRANIT, M.granit);
  c.pave(x1 + 0.7, 0, z1 + 1.2, x1 + 0.9, 0.06, z1 + 2.0, 0x2c2926, M.mat, { crasse: false });
  c.pave(x2 - 1.4, 0, z1 + 0.25, x2 - 0.25, 0.45, z1 + 0.7, GRANIT_SOMBRE, M.granit);
  c.boite(0.9, 0.04, 0.6, 0x2fb3c4, { x: x2 - 0.8, y: 0.48, z: z1 + 0.5, ry: 0.2 }, matiere(), { crasse: false }); // couverture polaire turquoise
  gravats(c, x2 - 0.6, z1 + 2.2, 1.0, Math.round(10 * usure) + 4, [GRANIT, GRANIT_SOMBRE], 0);
  touffes(c, Array.from({ length: 10 }, () => [c.entre(x1 + 0.4, x2 - 0.4), c.entre(z1 + 0.4, z2 - 0.4), 0]), HERBE_SECHE);
}

// ---------- Le rivage : rochers à facettes, écume, bouées, filets, cordages, sel ----------

function rivage(b, c, M, usure) {
  falaise(c, M);
  const ilot = [9, 21.6];

  // Les blocs de granit qui saillent du flanc de la falaise
  for (let x = -29; x < 29.5; x += c.entre(1.6, 2.6)) {
    if (x > -26.4 && x < -21.6) continue; // la rampe
    const { D, Y } = profil(x);
    const bz = bordFalaise(x);
    const r = 2 + Math.floor(c.hasard() * 2);
    rocher(c, x, bz + D[r] + 0.3, c.entre(0.8, 1.4), Y[r] - 0.4, c.hasard() < 0.3 ? GRANIT_SOMBRE : ROC, 1.2);
    // Au pied, les éboulis que la mer roule (dans la crique : serrés contre la falaise, la grève reste libre)
    const kc = crique(x);
    if (kc > 0.5) {
      if (c.hasard() < 0.7) rocher(c, x + c.entre(-0.6, 0.6), bz + D[4] - 0.2, c.entre(0.5, 0.8), MER_Y + 0.2, 0x6a675f, 1.3);
    } else if (c.hasard() < 0.6) rocher(c, x + c.entre(-0.6, 0.6), bz + D[4] + c.entre(0.3, 1.2), c.entre(0.7, 1.5), MER_Y - 0.4, 0x6a675f, 1.4);
  }
  // Les rochers plats de la crique, où le cargo s'est échoué : sous la proue et autour de la coque
  for (const [x, z, s] of [[-5.6, 16.4, 1.6], [-4.2, 17.2, 1.3], [-7.0, 17.0, 1.0], [-1.2, 21.0, 1.4], [0.4, 23.8, 1.5], [-7.4, 24.6, 1.1], [-2.6, 24.8, 1.2]]) rocher(c, x, z, s, MER_Y - 0.5, c.hasard() < 0.5 ? GRANIT_SOMBRE : 0x6e6b63, 1.1);
  // Les blocs posés sur l'arête : on s'y assoit pour voir le large (pas devant le hangar ni sous la corne)
  const blocs = [];
  for (let x = -29; x < 29.5; x += c.entre(2.2, 4)) {
    if ((x > -28.8 && x < -19.5) || (x > 16.5 && x < 20.5)) continue;
    const z = bordFalaise(x) - c.entre(0.1, 0.4);
    rocher(c, x, z, c.entre(0.5, 1.0), -0.25);
    blocs.push([x, z]);
  }
  // Les écueils, et l'îlot de la tourelle
  const ecueils = [];
  for (let i = 0; i < 12; i++) {
    const x = c.entre(-29, 29);
    const z = c.entre(bordFalaise(x) + 5.5, 24.6);
    if (x < 1.5 || Math.hypot(x - ilot[0], z - ilot[1]) < 4) continue; // la crique (grève, épave) reste dégagée
    const s = c.entre(0.6, 1.8);
    rocher(c, x, z, s, MER_Y - 0.3, 0x6e6b63, 1.6);
    ecueils.push([x, z, s]);
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.3;
    const rr = c.entre(0.6, 2.2);
    rocher(c, ilot[0] + Math.cos(a) * rr, ilot[1] + Math.sin(a) * rr * 0.8, c.entre(1.0, 1.8), MER_Y + 0.6 + c.entre(0, 1), c.hasard() < 0.4 ? GRANIT_SOMBRE : ROC, 1.2);
  }
  // La tourelle de balisage sur l'îlot : bandes noire et rouge, voyant en double cône
  const yT = MER_Y + 2.3;
  cylindre(c, M.granit, GRANIT_SOMBRE, ilot[0], yT - 0.4, ilot[1], 0.95, 1.1, 0.8, 10);
  cylindre(c, M.mat, 0x26282a, ilot[0], yT + 0.4, ilot[1], 0.6, 0.75, 1.6, 10);
  cylindre(c, M.mat, 0x9a3f35, ilot[0], yT + 2.0, ilot[1], 0.48, 0.6, 1.3, 10);
  c.tube([ilot[0], yT + 3.3, ilot[1]], [ilot[0], yT + 4.4, ilot[1]], 0.06, 0x2a2a28, M.tole, 6);
  for (const [y, rx] of [[yT + 4.05, 0], [yT + 4.55, Math.PI]]) {
    const g = new THREE.ConeGeometry(0.32, 0.45, 8);
    c.poser(g, M.tole, 0x1e1e1e, { x: ilot[0], y, z: ilot[1], rx }, { crasse: false });
    g.dispose();
  }
  // Les cuvettes des blocs de l'arête où le sel cristallise
  for (const [x, z] of blocs.filter((q, n) => n % 3 === 1).slice(0, 3)) {
    const g = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 9);
    c.poser(g, M.mer, 0xb8d0c8, { x, y: 0.42, z }, { crasse: false, nuance: 0 });
    g.dispose();
    for (let i = 0; i < 4; i++) c.boite(c.entre(0.08, 0.2), 0.02, c.entre(0.06, 0.15), 0xf2efe8, { x: x + c.entre(-0.4, 0.4), y: 0.44, z: z + c.entre(-0.4, 0.4), ry: c.hasard() * 3 }, M.lisse, { crasse: false, nuance: 0.03 });
  }
  // La grève de la crique : bouées échouées, épave de barque, bois flotté
  const yG = MER_Y + 0.35;
  for (const [x, z, t] of [[-27.8, 18.0, 0], [-20.9, 21.6, 1], [-29.2, 21.2, 2]]) {
    if (t === 1) c.poser(BOULE, M.satine, 0xc0503a, { x, y: yG + 0.3, z, e: 0.32 }, { crasse: false, nuance: 0.05 });
    else if (t === 2) cylindre(c, M.satine, 0xc0503a, x, yG, z, 0.4, 0.5, 1.1, 8, { rz: 1.1, y: yG + 0.3 });
    else {
      cylindre(c, M.satine, 0xd9d2c4, x, yG, z, 0.25, 0.25, 0.7, 8, { rx: Math.PI / 2, y: yG + 0.25 });
      cylindre(c, M.satine, 0xc0503a, x, yG, z + 0.2, 0.26, 0.26, 0.2, 8, { rx: Math.PI / 2, y: yG + 0.25 });
    }
  }
  c.repere({ x: -28.0, y: yG + 0.35, z: 20.4, ry: 1.2, rz: Math.PI - 0.25 }, () => {
    for (let i = 0; i < 4; i++) c.boite(3.2 - i * 0.3, 0.05, 0.28, i % 2 ? 0x5d7f93 : 0xd8d2c4, { y: -0.1 - i * 0.12, z: -0.6 + i * 0.4, rx: 0.4 - i * 0.25 }, M.mat, { nuance: 0.06 });
  });
  for (let i = 0; i < 6; i++) {
    const x = c.entre(-29, -9);
    const z = c.entre(piedFalaise(x) + 0.5, bordEau(x) - 0.5);
    c.boite(c.entre(0.8, 2), 0.12, 0.14, 0xb5ab98, { x, y: solFalaise(x, z) + 0.06, z, ry: c.hasard() * 3 }, M.mat, { nuance: 0.08 });
  }
  // Les laisses de mer : algues noires et bouchons, le long du bord de l'eau
  for (let x = -29.5; x < -3; x += c.entre(0.6, 1.4)) {
    const z = bordEau(x) - c.entre(0.3, 0.9);
    c.boite(c.entre(0.3, 0.8), 0.03, c.entre(0.1, 0.3), c.hasard() < 0.6 ? 0x3e4630 : 0x5a5038, { x, y: solFalaise(x, z) + 0.03, z, ry: c.entre(-0.3, 0.3) }, M.mat, { crasse: false, nuance: 0.08 });
  }
  // Sur le plateau : bouées, filets et cordages remontés par les gardiens, près du hangar et de la corne
  for (const [x, z, t] of [[-19, 10.4, 0], [-17.4, 11.0, 1], [-29, 9, 0], [11, 10.5, 1]]) {
    if (t === 1) {
      c.poser(BOULE, M.satine, 0xc0503a, { x, y: 0.3, z, e: 0.32 }, { crasse: false, nuance: 0.05 });
      c.boite(0.04, 0.04, 0.6, 0x2a2a28, { x: x + 0.3, y: 0.05, z: z + 0.2, ry: 0.6 }, M.mat);
    } else {
      cylindre(c, M.satine, 0xd9d2c4, x, 0.12, z, 0.25, 0.25, 0.7, 8, { rx: Math.PI / 2, y: 0.25 });
      cylindre(c, M.satine, 0xc0503a, x, 0.12, z + 0.2, 0.26, 0.26, 0.2, 8, { rx: Math.PI / 2, y: 0.25 });
    }
  }
  for (const [x, z, ry] of [[-18.2, 10.6, 0.3], [-29.2, 10.6, -0.4], [7.0, 10.6, 0.8]]) {
    for (let i = 0; i < 5; i++) c.boite(c.entre(0.8, 1.5), 0.04, c.entre(0.6, 1.1), i % 2 ? 0x4f5a44 : 0x5f5a3e, { x: x + c.entre(-0.6, 0.6), y: 0.05 + i * 0.03, z: z + c.entre(-0.4, 0.4), ry: ry + c.entre(-0.5, 0.5), rx: c.entre(-0.2, 0.2) }, M.mat, { crasse: false, nuance: 0.08 });
    for (let i = 0; i < 4; i++) c.poser(BOULE, M.satine, 0xb09a6a, { x: x + c.entre(-0.8, 0.8), y: 0.12, z: z + c.entre(-0.5, 0.5), e: 0.08 }, { crasse: false });
  }
  for (const [x, z] of [[-16.6, 10.2], [-28.2, 2.2], [13.6, 12.6]]) {
    for (let r = 0; r < 4; r++) c.poser(new THREE.TorusGeometry(0.38 - r * 0.02, 0.05, 3, 10), M.mat, 0xa89470, { x, y: 0.05 + r * 0.08, z, rx: Math.PI / 2 }, { crasse: false, nuance: 0.05 });
  }

  // L'écume : des boîtes blanches au pied de la falaise et des écueils, qui respirent avec la houle (maillage animé)
  const e = new Chantier(77);
  const yE = MER_Y + 0.04;
  for (let x = -29.6; x < 29.6; x += e.entre(0.5, 1.1)) {
    const { D, Y, k } = profil(x);
    // là où le profil passe sous l'eau
    let d = D[5];
    for (let n = 1; n < D.length; n++) if (Y[n] <= MER_Y) { d = D[n - 1] + ((D[n] - D[n - 1]) * (Y[n - 1] - MER_Y)) / (Y[n - 1] - Y[n]); break; }
    const z = bordFalaise(x) + d + e.entre(0, 0.5) + (k > 0.5 ? 0.3 : 0);
    e.boite(e.entre(0.6, 1.6), 0.04, e.entre(0.3, 0.8), 0xffffff, { x, y: yE, z, ry: e.entre(-0.4, 0.4) }, M.ecume, { crasse: false, nuance: 0.05 });
    if (e.hasard() < 0.4) e.boite(e.entre(0.5, 1.2), 0.04, e.entre(0.2, 0.4), 0xffffff, { x: x + e.entre(-0.3, 0.3), y: yE, z: z + e.entre(0.8, 1.6), ry: e.entre(-0.4, 0.4) }, M.ecume, { crasse: false, nuance: 0.05 });
  }
  for (const [x, z, s] of [...ecueils, [ilot[0], ilot[1], 2.6]]) {
    const n = s > 2 ? 9 : 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.3 + e.hasard();
      e.boite(e.entre(0.5, 1.1) * Math.min(s, 1.4), 0.04, e.entre(0.15, 0.35), 0xffffff, { x: x + Math.cos(a) * s * 1.15, y: yE + 0.005, z: z + Math.sin(a) * s, ry: -a + Math.PI / 2 }, M.ecume, { crasse: false, nuance: 0.05 });
    }
  }
  // Au bout de la rampe, sur les galets mouillés
  e.boite(3.2, 0.04, 0.4, 0xffffff, { x: -24, y: yE, z: RAMPE_Z_BAS + 0.3 }, M.ecume, { crasse: false, nuance: 0 });
  // Les vagues : de longues crêtes blanches qui arrivent du large
  for (let i = 0; i < 8; i++) {
    const x = e.entre(-26, 26);
    const z = e.entre(19.5, 24.6);
    if (Math.hypot(x - ilot[0], z - ilot[1]) < 4 || (x < 1 && z < bordEau(x) + 0.8)) continue;
    e.boite(e.entre(3, 6), 0.05, 0.25, 0xf4f6f4, { x, y: yE + 0.01, z, ry: e.entre(-0.1, 0.1) }, M.ecume, { crasse: false, nuance: 0 });
  }
  const ecume = e.construire();
  ecume.name = "écume";
  ecume.userData.animer = (t) => {
    ecume.position.y = Math.sin(t * 0.9) * 0.06;
    ecume.position.z = Math.sin(t * 0.45) * 0.2;
    M.ecume.opacity = 0.55 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.9 + 1));
  };
  b.ajouter(ecume);
}

/**
 * La falaise : un seul maillage à facettes, de l'arête (herbe) jusqu'au fond de la mer, colorié triangle par triangle
 * (herbe, lichen jaune, granit, fientes, roche mouillée, algues, galets, fond). Ses tranches ferment les bords du lot.
 */
function falaise(c, M) {
  const al = aleatoire(908);
  const ent = (a, b2) => a + (b2 - a) * al();
  const X = [];
  for (let x = -30; x <= 30.001; x += 1) X.push(x);
  const ilot = [9, 21.6];
  // Les sommets : V[i][j], colonne i (x), rangée j (vers le large)
  const V = X.map((x0, i) => {
    const { D, Y } = profil(x0);
    const bz = bordFalaise(x0);
    const bord = i === 0 || i === X.length - 1;
    const rang = [[x0, 0, 11.5]];
    for (let n = 0; n < D.length; n++) {
      const cliff = n >= 1 && n <= 5;
      const x = bord ? x0 : x0 + (cliff ? ent(-0.35, 0.35) : 0);
      const kc = crique(x0);
      const bruit = n >= 4 ? 1 - 0.85 * kc : 1; // la grève est plus lisse que la falaise
      const y = Y[n] + (cliff ? ent(-0.6, 0.6) * bruit : n === 6 ? ent(-0.3, 0.3) * (1 - 0.8 * kc) : 0);
      rang.push([x, Math.min(0, y), bz + D[n] + (cliff ? ent(-0.25, 0.25) : 0)]);
    }
    const zDernier = bz + D[6];
    const reste = 4;
    for (let n = 1; n <= reste; n++) {
      const z = zDernier + ((25 - zDernier) * n) / reste;
      const x = bord || n === reste ? x0 : x0 + ent(-0.3, 0.3);
      const kc = crique(x0);
      let y = (-10.8 + ent(-0.4, 0.4)) * (1 - kc) + (-9.35 - 0.25 * n + ent(-0.15, 0.15)) * kc;
      const di = Math.hypot(x - ilot[0], (z - ilot[1]) * 1.2);
      y = Math.max(y, MER_Y + 1.6 - Math.pow(di, 1.25) * 1.1);
      rang.push([x, y, n === reste ? 25 : z]);
    }
    return rang;
  });
  const nJ = V[0].length;
  const pos = [];
  const tri = [];
  for (let i = 0; i < X.length - 1; i++) {
    for (let j = 0; j < nJ - 1; j++) {
      const a = V[i][j], b2 = V[i + 1][j], cc = V[i][j + 1], d = V[i + 1][j + 1];
      // (a, cc, b2) et (b2, cc, d) : normales vers le haut et le large
      for (const t of [[a, cc, b2], [b2, cc, d]]) {
        pos.push(...t[0], ...t[1], ...t[2]);
        tri.push({ t, k: crique((t[0][0] + t[1][0] + t[2][0]) / 3) });
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, M.mat, 0xffffff, {}, { crasse: false, nuance: 0 });
  g.dispose();
  // Les couleurs, triangle par triangle
  const lot = c.lots.get(M.mat);
  const geo = lot[lot.length - 1];
  const col = geo.attributes.color.array;
  const coul = new THREE.Color();
  tri.forEach(({ t, k }, n) => {
    const ys = t.map((p) => p[1]);
    const cy = (ys[0] + ys[1] + ys[2]) / 3;
    const r = al();
    let h;
    if (Math.min(...ys) > -0.05) h = r < 0.5 ? HERBE : 0x95a05e;
    else if (cy > -1.6) h = r < 0.4 ? 0xb59d52 : r < 0.55 ? 0x7f8a52 : 0x938e83;
    else if (cy > -7.4) h = r < 0.06 ? 0xd2cdc0 : r < 0.5 ? 0x8a867d : r < 0.8 ? 0x7b776f : 0x96918a;
    else if (k > 0.5 && cy > MER_Y - 0.5 && cy < MER_Y + 1.2) h = r < 0.5 ? 0xa39a88 : 0x8f8676;
    else if (cy > MER_Y - 0.4) h = r < 0.35 ? 0x4f5a3a : 0x55524b;
    else if (cy > -9.9) h = 0x48463f;
    else h = 0x3a4540;
    // L'îlot émerge : granit sombre
    if (cy > MER_Y - 0.4 && Math.hypot((t[0][0] + t[1][0] + t[2][0]) / 3 - ilot[0], (t[0][2] + t[1][2] + t[2][2]) / 3 - ilot[1]) < 4) h = r < 0.3 ? 0xd2cdc0 : 0x6e6b63;
    coul.setHex(h).offsetHSL(0, 0, (al() - 0.5) * 0.04);
    for (let q = 0; q < 3; q++) col.set([coul.r, coul.g, coul.b], (n * 3 + q) * 3);
  });
  // Les tranches du lot : x = ±30 et z = 25, du profil jusqu'à −12
  const tr = [];
  const quad = (p1, p2, sens) => {
    const q1 = [p1[0], -12, p1[2]];
    const q2 = [p2[0], -12, p2[2]];
    if (sens) tr.push(...p1, ...q1, ...p2, ...p2, ...q1, ...q2);
    else tr.push(...p1, ...p2, ...q1, ...p2, ...q2, ...q1);
  };
  for (let j = 0; j < nJ - 1; j++) {
    quad(V[0][j], V[0][j + 1], true);
    quad(V[X.length - 1][j], V[X.length - 1][j + 1], false);
  }
  for (let i = 0; i < X.length - 1; i++) quad(V[i][nJ - 1], V[i + 1][nJ - 1], true);
  const gt = new THREE.BufferGeometry();
  gt.setAttribute("position", new THREE.Float32BufferAttribute(tr, 3));
  gt.computeVertexNormals();
  c.poser(gt, M.mat, 0x4f4b44, {}, { crasse: false, nuance: 0 });
  gt.dispose();
}

// ---------- L'épave du cargo (P1 à P3), cachée au départ : epave_apres ----------
//
// Le « Prime Abondance », petit porte-conteneurs de la Livraison du Jour, perdu sans satellites, a suivi la seule
// lumière de la côte : il s'est cassé en deux sur les rochers de la crique. La partie avant est là, la proue contre la
// falaise, la cassure (la cale ouverte, les conteneurs qui pendent) tournée vers le large. Repère de la coque : origine
// au milieu de la cassure, +x local vers la grève (l'ouest), +z local vers la proue (le nord).

const EPAVE = { x: -3.4, z: 23.75, ry: Math.atan2(-0.26, -0.966) };
const COQUE_L = 8.6; // de la cassure à l'étrave
const COQUE_W = 3.2; // demi-largeur
const COQUE_FLOTTAISON = -8.2; // la ligne de peinture : rouge dessous, bleu nuit dessus
function largeurCoque(s) {
  if (s < 2.6) return COQUE_W;
  const t = Math.min(1, (s - 2.6) / (COQUE_L - 2.6));
  return Math.max(0.06, COQUE_W * (1 - t ** 1.7)); // une étrave fine : la largeur tombe en pointe
}
/** La largeur des fonds : l'avant est évasé (les fonds s'affinent plus tôt que le pont). */
function largeurFonds(s) {
  if (s < 1.5) return COQUE_W * 0.97;
  const t = Math.min(1, (s - 1.5) / (COQUE_L - 1.0 - 1.5));
  return Math.max(0.05, COQUE_W * 0.97 * (1 - t ** 1.5));
}
function quilleCoque(s) {
  return s < 3.5 ? -9.8 : -9.8 + 4.0 * Math.min(1, (s - 3.5) / (COQUE_L - 3.5)) ** 1.6;
}
function ponCoque(s) {
  return -4.2 + 0.5 * (s / COQUE_L) ** 2;
}
/** Du repère de la coque au repère du lieu. */
function versMonde(lx, lz) {
  const c = Math.cos(EPAVE.ry);
  const s = Math.sin(EPAVE.ry);
  return [EPAVE.x + lx * c + lz * s, EPAVE.z - lx * s + lz * c];
}
/** D'un repère local (conteneur) posé en (x, z, ry) au repère du lieu. */
function versLieu(o, lx, lz) {
  const c = Math.cos(o.ry);
  const s = Math.sin(o.ry);
  return [o.x + lx * c + lz * s, o.z - lx * s + lz * c];
}

// L'échelle de coupée : du pavois (côté grève, s = 4,5) jusqu'aux galets
const ECHELLE = { s: 4.5, x1: 0, x2: 9.0, demi: 0.65 };
// Les conteneurs : sur la grève (livraison, provisions du bord) et sur le pont (outillage, 10 pieds)
const C_LIVRAISON = { x: -19.4, z: 17.8, ry: 0.04, long: 6.06, ouvert: 1 };
const C_BORD = { x: -11.6, z: 17.45, ry: 0.06, long: 6.06, ouvert: -1 };
const C_OUTIL = { s: 2.2, lx: -1.5, long: 2.99 }; // dans le repère de la coque (long axe suivant +z local, portes vers la proue)
const S_GUINDEAU = 5.4;
const S_CLOCHE = 6.7;

/** Du repère du lieu à un repère local posé en (x, z, ry) : l'inverse de versLieu. */
function versLocal(o, x, z) {
  const c = Math.cos(o.ry);
  const s = Math.sin(o.ry);
  const dx = x - o.x;
  const dz = z - o.z;
  return [dx * c - dz * s, dx * s + dz * c];
}

/**
 * La hauteur du sol où l'on marche (K2), dans le repère du lot (celui des obstacles et de la FICHE) : 0 sur le plateau
 * (tour, enclos, maisons, hangar), la pente de la rampe du canot, les galets de la crique ; avec `epave` (epave_apres
 * montrée) : l'échelle de coupée, le pont du cargo, le plancher des conteneurs. Fonction pure, sans la scène.
 */
export function hauteurSol(x, z, { epave = false } = {}) {
  if (epave) {
    const [lx, s] = versLocal(EPAVE, x, z);
    // L'échelle de coupée : du pavois (pont) jusqu'aux galets
    const x1 = largeurCoque(ECHELLE.s) + 0.05;
    if (Math.abs(s - ECHELLE.s) <= ECHELLE.demi + 0.05 && lx >= x1 - 0.3 && lx <= ECHELLE.x2) {
      const yHaut = ponCoque(ECHELLE.s) + 0.05;
      const [gx, gz] = versMonde(ECHELLE.x2, ECHELLE.s);
      const yBas = solFalaise(gx, gz) + 0.12;
      const t = Math.min(1, Math.max(0, (lx - x1) / (ECHELLE.x2 - x1)));
      return yHaut + (yBas - yHaut) * t + 0.07;
    }
    // Le pont (et le plancher du conteneur d'outillage)
    if (s >= 0.3 && s <= COQUE_L && Math.abs(lx) <= largeurCoque(s)) {
      const cl = C_OUTIL.long / 2;
      if (Math.abs(s - C_OUTIL.s) <= cl && Math.abs(lx - C_OUTIL.lx) <= 1.22) return ponCoque(C_OUTIL.s) + 0.14;
      return ponCoque(s);
    }
    // Les conteneurs posés sur la grève : leur plancher
    for (const C of [C_LIVRAISON, C_BORD]) {
      const [cx, cz] = versLocal(C, x, z);
      if (Math.abs(cx) <= C.long / 2 && Math.abs(cz) <= 1.22) return solFalaise(C.x, C.z) + 0.07;
    }
  }
  // La rampe du canot : la partie haute, la cassure (on tombe), la partie basse affaissée jusqu'aux galets
  if (x >= RAMPE_X1 && x <= RAMPE_X2 && z >= HZ2 && z <= RAMPE_Z_BAS) {
    if (z <= RAMPE_Z_COUPE) return (RAMPE_Y_COUPE * (z - HZ2)) / (RAMPE_Z_COUPE - HZ2);
    const t = Math.max(0, (z - RAMPE_Z_REPRISE) / (RAMPE_Z_BAS - RAMPE_Z_REPRISE));
    return RAMPE_Y_REPRISE + (RAMPE_Y_BAS - RAMPE_Y_REPRISE) * t;
  }
  // Le plateau, puis la falaise et la grève de la crique (sous l'eau : le fond)
  return solFalaise(x, z);
}

/**
 * Un conteneur maritime (repère local : x le long, z en travers, y depuis le plancher), portes ouvertes rabattues contre
 * les flancs à l'extrémité `ouvert` (+1 : +x, −1 : −x). Renvoie ses segments d'obstacles en local.
 */
function conteneur(ch, M, couleur, long, ouvert, options = {}) {
  const l = long / 2;
  const w = 1.22;
  const h = 2.59;
  const fonce = new THREE.Color(couleur).multiplyScalar(0.7).getHex();
  ch.boite(long, 0.12, 2.44, 0x4a3e32, { y: 0.06 }, M.tole, { nuance: 0.03 }); // le plancher de contreplaqué
  if (!options.sansToit) ch.boite(long, 0.06, 2.44, couleur, { y: h - 0.03 }, M.tole, { nuance: 0.04 });
  for (const sz of [-1, 1]) {
    ch.boite(long, h - 0.2, 0.05, couleur, { y: h / 2, z: sz * (w - 0.025) }, M.tole, { nuance: 0.04 });
    // Le flanc ondulé et le logo « Abondance Express » (l'atlas, teinté par les sommets)
    panneau(ch, M, R.conteneur, { y: h / 2, z: sz * (w + 0.005), ry: sz > 0 ? 0 : Math.PI }, long - 0.3, h - 0.25);
    // Les longerons haut et bas
    for (const y of [0.1, h - 0.08]) ch.boite(long, 0.16, 0.1, fonce, { y, z: sz * (w - 0.05) }, M.tole, { crasse: false });
  }
  // Le fond fermé, les montants d'angle
  ch.boite(0.05, h - 0.2, 2.34, couleur, { x: -ouvert * (l - 0.03), y: h / 2 }, M.tole, { nuance: 0.04 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) ch.boite(0.16, h, 0.16, fonce, { x: sx * (l - 0.08), y: h / 2, z: sz * (w - 0.08) }, M.tole, { crasse: false });
  ch.boite(0.12, 0.2, 2.44, fonce, { x: ouvert * (l - 0.06), y: h - 0.1 }, M.tole, { crasse: false });
  // Les deux portes, ouvertes en grand, rabattues contre les flancs
  for (const sz of [-1, 1]) {
    ch.repere({ x: ouvert * l, y: 0.1, z: sz * (w + 0.06), ry: ouvert > 0 ? 0 : Math.PI }, () => {
      ch.boite(1.18, 2.38, 0.05, couleur, { x: -0.6, y: 1.19 }, M.tole, { nuance: 0.05 });
      panneau(ch, M, R.porteC, { x: -0.6, y: 1.19, z: sz * (ouvert > 0 ? 0.03 : -0.03), ry: sz * (ouvert > 0 ? 1 : -1) > 0 ? 0 : Math.PI }, 1.14, 2.3);
    });
  }
  return [
    [-l, -w - 0.12, l, -w - 0.12],
    [-l, w + 0.12, l, w + 0.12],
    [-ouvert * l, -w, -ouvert * l, w],
  ];
}

/** Un carton de la Livraison du Jour (éventré ou non), avec son étiquette. */
function carton(ch, M, x, y, z, l, h, p, ry, eventre) {
  ch.repere({ x, y, z, ry }, () => {
    ch.boite(l, h, p, eventre ? 0xa88a5c : 0xb8996a, { y: h / 2, rz: eventre ? 0.08 : 0 }, M.mat, { nuance: 0.08 });
    if (eventre) for (const s of [-1, 1]) ch.boite(l * 0.45, 0.02, p, 0xa88a5c, { x: s * l * 0.42, y: h + 0.08, rz: s * 0.9 }, M.mat, { crasse: false, nuance: 0.06 });
    if (!eventre || l > 0.5) panneau(ch, M, R.carton, { y: h * 0.55, z: p / 2 + 0.006 }, l * 0.8, Math.min(h * 0.5, l * 0.4));
  });
}

/** Une palette de bois. */
function palette(ch, M, x, y, z, ry, rz = 0) {
  ch.repere({ x, y, z, ry, rz }, () => {
    for (let i = 0; i < 5; i++) ch.boite(0.1, 0.022, 0.8, 0xb59a70, { x: -0.5 + i * 0.25, y: 0.13 }, M.mat, { nuance: 0.08 });
    for (const z of [-0.33, 0, 0.33]) ch.boite(1.2, 0.1, 0.1, 0x9a8058, { y: 0.06, z }, M.mat, { nuance: 0.06 });
  });
}

function epave(b, M, usure) {
  ECHELLE.x1 = largeurCoque(ECHELLE.s) + 0.05;
  const groupe = new THREE.Group();
  groupe.name = "epave_apres";
  groupe.userData.nom = "epave_apres";
  const obstacles = [];
  const obs = (a, bb, nature) => obstacles.push({ x1: r2(a[0]), z1: r2(a[1]), x2: r2(bb[0]), z2: r2(bb[1]), nature });
  const r2 = (v) => Math.round(v * 100) / 100;
  const ch = new Chantier(2207); // ce qui reste toujours visible de l'épave : le bas de la coque, la grève, les conteneurs
  const [bx, bz] = versMonde(0, 4);
  // La couche qui s'efface : la coque, le pont et tout ce qui est dessus. Hauteurs comptées depuis la grève (y ≈ −8,8) ;
  // rien ne s'efface tant que le joueur est à bord (horsDe).
  const nomCouche = "coque de l'épave (cargo « Prime Abondance »)";
  const k = b.couche(nomCouche, { x: -3.9, z: 20, l: 8.2, p: 9.4 }, 0.6, 6.2, { x: bx, z: bz, l: 4.2, p: 5.2 });
  const coque = { x: EPAVE.x, y: 0, z: EPAVE.z, ry: EPAVE.ry };

  // --- La coque : un maillage par bande (œuvres vives rouges, œuvres mortes bleu nuit), double face (on voit dedans
  // par la cassure). La cassure est déchiquetée : chaque point du profil s'arrête à une distance différente.
  const S = [0, 0.8, 1.6, 2.6, 3.4, 4.2, 5.0, 5.8, 6.5, 7.1, 7.6, 8.0, 8.3, COQUE_L];
  const al = aleatoire(77);
  const dechire = [0.05, 0.55, 0.2, 0.75, 0.35, 0.9];
  const profilCoque = (s, cote, n) => {
    const w = largeurCoque(s) * cote;
    const wf = largeurFonds(s) * cote;
    const yk = quilleCoque(s);
    const yd = ponCoque(s);
    const yb = Math.min(yk + 0.9, yd - 0.5);
    const yf = Math.max(COQUE_FLOTTAISON, yb);
    // La flottaison : on interpole la largeur entre le bouchain (fonds) et le pont (l'évasement de l'avant)
    const wFl = wf + ((w - wf) * (yf - yb)) / Math.max(0.01, yd - yb);
    const pts = [[0, yk], [wf * 0.72, yk], [wf, yb], [wFl, yf], [w, yd + 1.0]];
    return pts.map(([x, y], i) => [x, y, n === 0 ? s + dechire[i] + (cote > 0 ? 0 : 0.15) : s]);
  };
  const bande = (i0, i1, couleur, cible) => {
    const pos = [];
    for (const cote of [-1, 1]) {
      for (let n = 0; n < S.length - 1; n++) {
        const A = profilCoque(S[n], cote, n);
        const B = profilCoque(S[n + 1], cote, n + 1);
        for (let i = i0; i < i1; i++) {
          const q = [A[i], A[i + 1], B[i], B[i + 1]];
          const t1 = cote > 0 ? [q[0], q[2], q[1]] : [q[0], q[1], q[2]];
          const t2 = cote > 0 ? [q[1], q[2], q[3]] : [q[1], q[3], q[2]];
          for (const t of [t1, t2]) {
            pos.push(...t[0], ...t[1], ...t[2]);
            pos.push(...t[0], ...t[2], ...t[1]); // l'envers
          }
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    cible.poser(g, M.tole, couleur, coque, { crasse: false, nuance: 0 });
    g.dispose();
  };
  bande(0, 3, 0x7a3328, ch); // les œuvres vives, rouge antifouling, dans le sable
  bande(3, 4, 0x34506a, k); // les œuvres mortes, bleu marine passé
  // Le pont : des tôles vert-de-gris entre les pavois, de s = 0,4 (la cassure) à l'étrave
  {
    const pos = [];
    const P = (s, cote) => [largeurCoque(s) * cote * 0.98, ponCoque(s), s];
    const Sp = [0.4, ...S.slice(1)];
    for (let n = 0; n < Sp.length - 1; n++) {
      const q = [P(Sp[n], -1), P(Sp[n], 1), P(Sp[n + 1], -1), P(Sp[n + 1], 1)];
      for (const t of [[q[0], q[2], q[1]], [q[1], q[2], q[3]]]) {
        pos.push(...t[0], ...t[1], ...t[2]);
        pos.push(...t[0], ...t[2], ...t[1]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    k.poser(g, M.tole, 0x8a5646, coque, { crasse: false, nuance: 0 }); // le pont, rouge brique passé
    g.dispose();
  }
  k.repere(coque, () => {
    // La lisse du pavois, les chaumards, les traînées de rouille sous les dalots
    for (const cote of [-1, 1]) {
      for (let n = 1; n < S.length - 1; n++) {
        const a = [largeurCoque(S[n]) * cote, ponCoque(S[n]) + 1.02, S[n]];
        const bb = [largeurCoque(S[n + 1]) * cote, ponCoque(S[n + 1]) + 1.02, S[n + 1]];
        k.poutre(a, bb, 0.12, 0xd8d4c8, M.tole);
        // Le liston blanc au niveau du pont, la ligne rouge au-dessus de la flottaison
        k.poutre([a[0] * 1.004, a[1] - 1.15, a[2]], [bb[0] * 1.004, bb[1] - 1.15, bb[2]], 0.1, 0xd8d4c8, M.tole);
      }
      for (const s of [1.2, 2.6, 4.0, 5.6]) {
        const w = largeurCoque(s) * cote;
        k.boite(0.05, k.entre(1.2, 3.2), k.entre(0.12, 0.3), 0x8a4a2a, { x: w + cote * 0.03, y: ponCoque(s) - 1.4, z: s }, M.tole, { crasse: false, nuance: 0.12 });
      }
    }
    // L'ancre dans son écubier, sur la joue de la proue côté large
    {
      const sa = 7.0;
      const xa = -largeurCoque(sa) - 0.1;
      const ya = ponCoque(sa) - 1.1;
      k.poser(new THREE.TorusGeometry(0.28, 0.08, 4, 10), M.tole, 0x2c2b29, { x: xa + 0.05, y: ya + 0.15, z: sa, ry: Math.PI / 2 - 0.5 }, { crasse: false });
      k.boite(0.14, 1.2, 0.14, 0x2c2b29, { x: xa, y: ya - 0.45, z: sa }, M.tole, { crasse: false });
      for (const d of [-1, 1]) k.boite(0.12, 0.5, 0.14, 0x2c2b29, { x: xa, y: ya - 1.0, z: sa + d * 0.25, rx: d * 0.9 }, M.tole, { crasse: false });
      for (let i = 0; i < 4; i++) k.boite(0.06, k.entre(0.8, 1.6), 0.12, 0x8a4a2a, { x: xa + 0.06, y: ya - 1.2 - i * 0.2, z: sa - 0.3 + i * 0.18 }, M.tole, { crasse: false, nuance: 0.1 });
    }
    // Les marques de franc-bord et l'échelle de tirant d'eau sur l'étrave (blanches)
    for (let i = 0; i < 5; i++) k.boite(0.04, 0.08, 0.35, 0xe9e5db, { x: 0.05, y: -8.6 + i * 0.6, z: 7.92, ry: 0.4 }, M.tole, { crasse: false });
    // La cale ouverte par la cassure : le double-fond, la cloison d'abordage, les membrures, les conteneurs qui glissent
    k.boite(6.6, 0.1, 5.6, 0x3a3532, { y: -8.5, z: 2.8 }, M.tole, { crasse: false });
    k.boite(6.4, 4.2, 0.08, 0x4a4a46, { y: -6.4, z: 5.6 }, M.tole, { crasse: false });
    for (let s = 0.5; s < 5.6; s += 0.8) for (const cote of [-1, 1]) k.boite(0.14, 4.6, 0.12, 0x3a3a38, { x: cote * (COQUE_W - 0.12), y: -6.5, z: s }, M.tole, { crasse: false });
    for (const [x, y, z, rz, rx, coul] of [[-1.3, -7.15, 2.9, 0.05, 0, 0x2f5a7a], [1.3, -7.2, 2.4, -0.04, 0.03, 0x8a3a2a]]) {
      k.repere({ x, y, z, rz, rx }, () => {
        k.boite(2.44, 2.59, 6.06, coul, {}, M.tole, { nuance: 0.05 });
        panneau(k, M, R.porteC, { z: -3.04, ry: Math.PI }, 2.3, 2.45);
      });
    }
    // Les tôles arrachées de la cassure, tordues vers le large ; le pont qui pend
    for (let i = 0; i < 9; i++) {
      const cote = i % 2 ? 1 : -1;
      const y = k.entre(-8.3, -3.8);
      k.boite(0.05, k.entre(0.8, 1.8), k.entre(0.6, 1.4), i % 3 ? 0x26384a : 0x7a3328, { x: cote * (COQUE_W - k.entre(0, 0.2)), y, z: k.entre(-0.4, 0.3), ry: cote * k.entre(0.3, 0.9), rx: k.entre(-0.3, 0.3) }, M.tole, { nuance: 0.06 });
    }
    k.boite(3.0, 0.05, 1.4, 0x8a5646, { x: -1.4, y: -4.75, z: -0.25, rx: 0.65 }, M.tole, { nuance: 0.05 });
    k.boite(2.0, 0.05, 1.0, 0x8a5646, { x: 1.9, y: -4.6, z: -0.05, rx: 0.4, rz: 0.2 }, M.tole, { nuance: 0.05 });
    // Sur le pont, à l'avant : le guindeau, les écubiers, les chaînes d'ancre, le mât de la cloche
    const sG = S_GUINDEAU;
    const yG = ponCoque(sG);
    k.boite(1.5, 0.5, 0.7, 0x3d4a3e, { y: yG + 0.25, z: sG }, M.tole);
    for (const cote of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 10);
      k.poser(g, M.tole, 0x2c2b29, { x: cote * 0.62, y: yG + 0.55, z: sG, rz: Math.PI / 2 }, {});
      g.dispose();
      for (let i = 0; i < 5; i++) k.boite(0.1, 0.06, 0.24, 0x4a3a30, { x: cote * 0.62 * (1 - i * 0.06), y: yG + 0.05, z: sG + 0.4 + i * 0.22, ry: (i % 2) * 1.57 }, M.tole, { crasse: false });
    }
    const sC = S_CLOCHE;
    const yC = ponCoque(sC);
    for (const cote of [-1, 1]) k.poutre([cote * 0.55, yC, sC], [cote * 0.45, yC + 1.75, sC], 0.08, 0xc9c3b6, M.tole);
    k.poutre([-0.6, yC + 1.72, sC], [0.6, yC + 1.72, sC], 0.08, 0xc9c3b6, M.tole);
    k.tube([0, yC, sC + 0.3], [0, yC + 4.2, sC + 0.25], 0.07, 0xc9c3b6, M.tole, 6); // le mât de misaine, court
    k.boite(0.9, 0.06, 0.06, 0xc9c3b6, { y: yC + 3.6, z: sC + 0.25 }, M.tole, { crasse: false });
    // Le conteneur d'outillage de 10 pieds, sur le pont, portes vers la cassure
    k.repere({ x: C_OUTIL.lx, y: ponCoque(C_OUTIL.s) + 0.02, z: C_OUTIL.s, ry: -Math.PI / 2, rz: 0 }, () => {
      conteneur(k, M, 0x3f6a5a, C_OUTIL.long, 1);
      // Dedans : l'établi au fond, les caisses à outils, les outils pendus
      k.boite(0.6, 0.85, 2.2, 0x6a4c32, { x: -1.0, y: 0.55 }, M.tole, { nuance: 0.05 });
      for (let i = 0; i < 3; i++) k.boite(0.5, 0.25, 0.3, [0xb03a2a, 0x2f5a7a, 0xb0782a][i], { x: 0.2 - i * 0.25, y: 0.25 + (i === 2 ? 0.25 : 0), z: -0.9 + (i % 2) * 0.1 }, M.tole, { nuance: 0.05 });
      for (let i = 0; i < 4; i++) k.boite(0.04, k.entre(0.2, 0.4), 0.06, 0x8d969a, { x: -1.42, y: 1.4 + k.entre(0, 0.4), z: -0.8 + i * 0.4 }, M.tole, { crasse: false });
    });
    // La bouée couronne du bord, accrochée au pavois
    k.poser(new THREE.TorusGeometry(0.34, 0.09, 4, 10), M.tole, 0xd0562e, { x: -largeurCoque(3.4) + 0.06, y: ponCoque(3.4) + 0.5, z: 3.4, ry: Math.PI / 2 }, { crasse: false });
  });
  // Le nom du cargo sur la joue de la proue, côté large (tourné vers la caméra)
  {
    const sa = 4.5;
    const sb = 6.7;
    const wa = -largeurCoque(sa) - 0.14;
    const wb = -largeurCoque(sb) - 0.14;
    const ry = Math.atan2(-(sb - sa), wb - wa);
    k.repere(coque, () => panneau(k, M, R.coque, { x: (wa + wb) / 2, y: ponCoque(6) - 0.3, z: (sa + sb) / 2, ry }, Math.hypot(sb - sa, wb - wa) * 0.98, 0.55));
  }

  // --- L'échelle de coupée (passerelle praticable, 1,3 m de large) : du pavois jusqu'aux galets
  {
    const yHaut = ponCoque(ECHELLE.s) + 0.05;
    const [gx, gz] = versMonde(ECHELLE.x2, ECHELLE.s);
    const yBas = solFalaise(gx, gz) + 0.12;
    const L = Math.hypot(ECHELLE.x2 - ECHELLE.x1, yHaut - yBas);
    const p = Math.atan2(yHaut - yBas, ECHELLE.x2 - ECHELLE.x1);
    ch.repere(coque, () => {
      ch.repere({ x: (ECHELLE.x1 + ECHELLE.x2) / 2, y: (yHaut + yBas) / 2, z: ECHELLE.s, rz: -p }, () => {
        for (const sz of [-1, 1]) ch.boite(L, 0.22, 0.06, 0xb9b4a8, { z: sz * ECHELLE.demi }, M.tole, { nuance: 0.03 });
        for (let i = 0; i < 12; i++) ch.boite(0.24, 0.04, ECHELLE.demi * 2, 0x8d8a82, { x: -L / 2 + 0.3 + (i * (L - 0.6)) / 11, y: 0.05, rz: p }, M.tole, { crasse: false });
        for (const sz of [-1, 1]) {
          for (let i = 0; i <= 4; i++) ch.boite(0.04, 0.95, 0.04, 0xc9c3b6, { x: -L / 2 + 0.2 + (i * (L - 0.4)) / 4, y: 0.55, z: sz * ECHELLE.demi, rz: p }, M.tole, { crasse: false });
          ch.boite(L, 0.04, 0.04, 0xc9c3b6, { y: 1.0, z: sz * ECHELLE.demi }, M.tole, { crasse: false });
        }
      });
      // Le palier du bas, posé de travers sur les galets
      ch.boite(1.4, 0.08, 1.5, 0x8d8a82, { x: ECHELLE.x2 + 0.6, y: yBas + 0.02, z: ECHELLE.s, rz: 0.06 }, M.tole, { nuance: 0.05 });
    });
  }

  // --- Les conteneurs de la grève
  const posesSurGreve = [];
  for (const [C, couleur, nom] of [[C_LIVRAISON, 0x9a4a32, "livraison"], [C_BORD, 0x2f5a7a, "bord"]]) {
    const y = solFalaise(C.x, C.z) - 0.05;
    C.y = y;
    ch.repere({ x: C.x, y, z: C.z, ry: C.ry, rz: nom === "bord" ? 0.02 : -0.015 }, () => {
      const segs = conteneur(ch, M, couleur, C.long, C.ouvert);
      for (const [a1, b1, a2, b2] of segs) obs(versLieu(C, a1, b1), versLieu(C, a2, b2), `conteneur ${nom === "bord" ? "des provisions du bord" : "de la Livraison du Jour"} (paroi)`);
    });
    posesSurGreve.push(C);
  }
  // Dedans, la Livraison du Jour éventrée : cartons, palettes, paille
  ch.repere({ x: C_LIVRAISON.x, y: C_LIVRAISON.y + 0.12, z: C_LIVRAISON.z, ry: C_LIVRAISON.ry }, () => {
    palette(ch, M, -1.9, 0, -0.5, 0.1);
    palette(ch, M, -1.7, 0.14, -0.45, 0.25);
    for (const [x, y, z, l, h, p, r, ev] of [[-2.5, 0, 0.6, 0.6, 0.5, 0.5, 0.1, false], [-2.45, 0.5, 0.55, 0.5, 0.4, 0.45, 0.4, false], [-1.9, 0.3, -0.5, 0.7, 0.5, 0.6, 0.2, true], [-0.9, 0, 0.75, 0.55, 0.45, 0.5, -0.3, true], [-1.6, 0, 0.75, 0.5, 0.6, 0.5, 0.05, false], [0.2, 0, -0.8, 0.45, 0.35, 0.4, 0.8, true], [1.4, 0, 0.8, 0.5, 0.4, 0.4, -0.5, false]]) carton(ch, M, x, y, z, l, h, p, r, ev);
    for (let i = 0; i < 10; i++) ch.boite(ch.entre(0.2, 0.5), 0.02, ch.entre(0.05, 0.15), 0xd4b86a, { x: ch.entre(-2.6, 2.4), y: 0.01, z: ch.entre(-1, 1), ry: ch.hasard() * 3 }, M.mat, { crasse: false, nuance: 0.1 });
  });
  // Dedans, les provisions du bord : fûts, bidons, caisses de conserves
  ch.repere({ x: C_BORD.x, y: C_BORD.y + 0.12, z: C_BORD.z, ry: C_BORD.ry }, () => {
    for (const [x, z, coul, couche] of [[2.5, -0.7, 0x2f5a7a, false], [2.5, 0.0, 0x8a3a2a, false], [2.5, 0.7, 0x2f5a7a, false], [1.8, 0.75, 0x6a6a5a, false], [1.2, -0.6, 0x8a3a2a, true]]) {
      if (couche) cylindre(ch, M.tole, coul, x, 0, z, 0.29, 0.29, 0.88, 10, { rx: Math.PI / 2, y: 0.3, ry: 0.4 });
      else cylindre(ch, M.tole, coul, x, 0, z, 0.29, 0.29, 0.88, 10);
    }
    for (let i = 0; i < 5; i++) cylindre(ch, M.tole, [0x7e3a2e, 0x5d6a4c, 0x8a6a3a][i % 3], 0.2 + (i % 3) * 0.32, 0, 0.85 - Math.floor(i / 3) * 0.32, 0.12, 0.12, 0.32, 8);
    palette(ch, M, -0.3, 0, -0.55, 0.05);
    for (let i = 0; i < 3; i++) ch.boite(0.45, 0.28, 0.32, 0x8a7a52, { x: -0.5 + i * 0.4, y: 0.29, z: -0.55 }, M.mat, { nuance: 0.06 });
  });

  // --- La grève après l'échouage : cartons éventrés, palettes, tôles arrachées, ce que la mer rejette
  for (const [x, z, l, h, p, r, ev] of [[-15.7, 20.6, 0.55, 0.45, 0.5, 0.5, true], [-16.3, 21.3, 0.5, 0.4, 0.45, 1.1, false], [-14.6, 21.9, 0.6, 0.5, 0.5, 0.2, true], [-21.6, 20.6, 0.45, 0.4, 0.4, 0.7, true], [-18.0, 22.1, 0.5, 0.35, 0.45, 2.1, false], [-9.2, 22.3, 0.55, 0.45, 0.5, -0.4, true], [-26.5, 19.6, 0.5, 0.4, 0.4, 0.9, true]]) carton(ch, M, x, solFalaise(x, z), z, l, h, p, r, ev);
  palette(ch, M, -17.2, solFalaise(-17.2, 20.4), 20.4, 0.6, 0.06);
  palette(ch, M, -12.4, solFalaise(-12.4, 22.4), 22.4, -0.3, -0.1);
  for (const [x, z, r] of [[-10.6, 20.6, 0.4], [-8.4, 23.0, 1.2], [-20.0, 22.6, 2.2]]) ch.boite(1.6, 0.04, 0.9, 0x26384a, { x, y: solFalaise(x, z) + 0.12, z, ry: r, rz: 0.15, rx: 0.1 }, M.tole, { nuance: 0.06 });
  // Un conteneur écrasé, couché dans l'eau au pied de la cassure (décor : on n'y entre pas)
  ch.repere({ x: -9.8, y: MER_Y - 1.35, z: 24.1, ry: 0.55, rz: 0.12, rx: Math.PI / 2 - 0.25 }, () => {
    ch.boite(6.06, 2.44, 2.59, 0x8a5a3a, {}, M.tole, { nuance: 0.05 });
    panneau(ch, M, R.conteneur, { z: 1.305 }, 5.8, 2.3);
  });

  // --- Les objets-clés, enfants nommés de epave_apres (P3)
  const objets = [];
  const fondus = []; // ceux qui s'effacent avec la coque
  // La cloche du cargo, sous son portique, sur la proue
  const cloche = nomme("cloche_cargo", 521, (o) => {
    const sC = S_CLOCHE;
    o.repere({ x: coque.x, y: 0, z: coque.z, ry: coque.ry }, () => {
      const y = ponCoque(sC) + 1.2;
      const g = new THREE.CylinderGeometry(0.12, 0.25, 0.42, 10, 1, true);
      o.poser(g, M.satine, 0xa98238, { x: 0, y, z: sC }, { crasse: false, nuance: 0.03 });
      g.dispose();
      o.poser(BOULE, M.satine, 0x9a7430, { x: 0, y: y + 0.21, z: sC, e: [0.13, 0.07, 0.13] }, { crasse: false });
      const levre = new THREE.TorusGeometry(0.25, 0.03, 3, 10);
      o.poser(levre, M.satine, 0x8a6a2a, { x: 0, y: y - 0.21, z: sC, rx: Math.PI / 2 }, { crasse: false });
      levre.dispose();
      o.boite(0.04, 0.3, 0.04, 0x55524c, { x: 0, y: y + 0.38, z: sC }, M.satine, { crasse: false });
      o.poser(BOULE, M.satine, 0x55524c, { x: 0.02, y: y - 0.25, z: sC, e: 0.05 }, { crasse: false }); // le battant
      o.poutre([0.02, y - 0.3, sC], [0.12, y - 0.9, sC + 0.1], 0.03, 0xd8cfb8, M.satine); // la corde de la cloche
      o.boite(0.3, 0.12, 0.02, 0xd9c48a, { x: 0, y: y - 0.02, z: sC - 0.24 }, M.satine, { crasse: false }); // « PRIME ABONDANCE », gravé
    });
  });
  fondus.push(cloche);
  // Le rabot, sur l'établi du conteneur d'outillage
  const rabot = nomme("rabot", 522, (o) => {
    const [x, z] = versMonde(C_OUTIL.lx + 0.3, C_OUTIL.s - 1.0);
    const y = ponCoque(C_OUTIL.s) + 0.02 + 0.98;
    o.repere({ x, y, z, ry: EPAVE.ry + 0.3 }, () => {
      o.boite(0.08, 0.07, 0.32, 0xc39a5a, { y: 0.035 }, M.satine, { nuance: 0.04 });
      o.boite(0.05, 0.1, 0.03, 0x55524c, { y: 0.09, z: 0.02, rx: -0.6 }, M.satine, { crasse: false });
      o.poser(BOULE, M.satine, 0x8a5a2a, { y: 0.1, z: -0.1, e: 0.035 }, { crasse: false });
      o.boite(0.04, 0.09, 0.08, 0x8a5a2a, { y: 0.11, z: 0.1, rx: 0.3 }, M.satine, { crasse: false });
    });
  });
  fondus.push(rabot);
  // La porte de four en fonte, appuyée contre un carton, près des portes du conteneur de la Livraison du Jour
  const porteFour = nomme("porte_four", 523, (o) => {
    const [x, z] = versLieu(C_LIVRAISON, 1.9, -0.75);
    o.repere({ x, y: C_LIVRAISON.y + 0.14, z, ry: C_LIVRAISON.ry + 0.2, rx: -0.25 }, () => {
      o.boite(0.52, 0.42, 0.05, 0x2a2928, { y: 0.21 }, M.satine, { nuance: 0.02 });
      o.boite(0.42, 0.32, 0.03, 0x3a3836, { y: 0.21, z: 0.03 }, M.satine, { crasse: false });
      o.boite(0.3, 0.035, 0.035, 0xb59048, { y: 0.34, z: 0.07 }, M.satine, { crasse: false });
      for (const y of [0.08, 0.34]) o.boite(0.06, 0.06, 0.06, 0x2a2928, { x: -0.27, y }, M.satine, { crasse: false });
      o.boite(0.16, 0.06, 0.01, 0xb59048, { y: 0.15, z: 0.05 }, M.satine, { crasse: false }); // la plaque de la fonderie
    });
  });
  // Le soufflet de forge, sur une palette au milieu du conteneur
  const soufflet = nomme("soufflet", 524, (o) => {
    const [x, z] = versLieu(C_LIVRAISON, 0.1, 0.45);
    o.repere({ x, y: C_LIVRAISON.y + 0.14, z, ry: C_LIVRAISON.ry + 1.1 }, () => {
      for (const y of [0.06, 0.3]) o.boite(0.5, 0.04, 0.8, 0x7a5232, { y, rx: y > 0.1 ? -0.1 : 0 }, M.satine, { nuance: 0.05 });
      o.boite(0.46, 0.2, 0.72, 0x5a3a24, { y: 0.17, z: 0.02 }, M.satine, { nuance: 0.05 }); // le cuir
      for (const y of [0.12, 0.2]) o.boite(0.5, 0.025, 0.76, 0x4a2e1c, { y }, M.satine, { crasse: false });
      o.tube([0, 0.17, -0.4], [0, 0.17, -0.75], 0.05, 0x55524c, M.satine, 6); // la buse
      o.tube([0, 0.32, 0.38], [0, 0.34, 0.68], 0.03, 0x6a4c32, M.satine, 5); // la poignée
    });
  });
  // Le jerrican de 20 L (les bidons du bord), devant les fûts
  const jerrican = nomme("jerrican", 525, (o) => {
    const [x, z] = versLieu(C_BORD, 1.6, -0.2);
    o.repere({ x, y: C_BORD.y + 0.13, z, ry: C_BORD.ry + 0.3 }, () => {
      o.boite(0.47, 0.35, 0.17, 0x55633a, { y: 0.175 }, M.satine, { nuance: 0.04 });
      for (const sz of [-1, 1]) o.boite(0.4, 0.26, 0.01, 0x4a5632, { y: 0.17, z: sz * 0.09 }, M.satine, { crasse: false });
      for (const dx of [-0.12, 0, 0.12]) o.boite(0.035, 0.07, 0.035, 0x4a5632, { x: dx, y: 0.38 }, M.satine, { crasse: false });
      o.boite(0.3, 0.03, 0.035, 0x4a5632, { y: 0.42 }, M.satine, { crasse: false });
      o.tube([0.18, 0.35, 0], [0.22, 0.42, 0], 0.03, 0x2c2b29, M.satine, 6);
    });
  });
  objets.push(cloche, rabot, porteFour, soufflet, jerrican);

  // --- Les obstacles de l'épave (après l'échouage seulement) : la coque, l'échelle, le pont
  const Sg = [0.3, 1.5, 2.6, ECHELLE.s - ECHELLE.demi, ECHELLE.s + ECHELLE.demi, 5.6, 6.5, 7.3, 8.0, COQUE_L];
  for (const cote of [-1, 1]) {
    for (let n = 0; n < Sg.length - 1; n++) {
      if (cote > 0 && Sg[n] === ECHELLE.s - ECHELLE.demi) continue; // l'arrivée de l'échelle sur le pont
      obs(versMonde(largeurCoque(Sg[n]) * cote, Sg[n]), versMonde(largeurCoque(Sg[n + 1]) * cote, Sg[n + 1]), "coque du cargo (bordé, pavois)");
    }
  }
  obs(versMonde(-COQUE_W, 0.3), versMonde(COQUE_W, 0.3), "la cassure de la coque (le vide, la cale)");
  for (const sz of [-1, 1]) obs(versMonde(ECHELLE.x1, ECHELLE.s + sz * ECHELLE.demi), versMonde(ECHELLE.x2, ECHELLE.s + sz * ECHELLE.demi), "rambarde de l'échelle de coupée");
  // Sur le pont : le conteneur d'outillage (ouvert vers la cassure), le guindeau
  {
    const o = { x: C_OUTIL.lx, z: C_OUTIL.s, ry: -Math.PI / 2 };
    const l = C_OUTIL.long / 2;
    for (const [a1, b1, a2, b2] of [[-l, -1.34, l, -1.34], [-l, 1.34, l, 1.34], [-l, -1.22, -l, 1.22]]) {
      const p1 = versLieu(o, a1, b1);
      const p2 = versLieu(o, a2, b2);
      obs(versMonde(p1[0], p1[1]), versMonde(p2[0], p2[1]), "conteneur d'outillage sur le pont (paroi)");
    }
    obs(versMonde(-0.8, S_GUINDEAU - 0.4), versMonde(0.8, S_GUINDEAU - 0.4), "guindeau");
    obs(versMonde(-0.8, S_GUINDEAU + 0.4), versMonde(0.8, S_GUINDEAU + 0.4), "guindeau");
  }

  b.lumiere(...(() => { const [x, z] = versMonde(0, 7.4); return [x, ponCoque(7.4) + 4.0, z]; })(), 0xff3a2a, 3, 8, "feu de détresse du cargo, sur batterie (seulement avec epave_apres)");

  const base = ch.construire();
  base.name = "épave (bas de coque, grève, conteneurs)";
  groupe.add(base);
  for (const o of objets) groupe.add(o);
  return { groupe, obstacles, nomCouche, fondus, objets };
}

// ---------- L'atlas des panneaux ----------

function dessinerAtlas(g) {
  g.clearRect(0, 0, AL, AH);
  const texte = (t, x, y, police, couleur, align = "center") => {
    g.font = police;
    g.fillStyle = couleur;
    g.textAlign = align;
    g.fillText(t, x, y);
  };
  const salir = (x, y, l, h, n, couleur = "rgba(110,90,60,0.22)") => {
    for (let i = 0; i < n; i++) {
      const px = x + ((i * 97) % l);
      const py = y + ((i * 61) % h);
      const r = 8 + ((i * 13) % 30);
      const d = g.createRadialGradient(px, py, 0, px, py, r);
      d.addColorStop(0, couleur);
      d.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = d;
      g.fillRect(px - r, py - r, r * 2, r * 2);
    }
  };

  // Le panneau du gîte : bleu canard, lettres crème, étoiles dorées
  {
    const [x, y, l, h] = R.lodge;
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 6;
    g.strokeRect(x + 10, y + 10, l - 20, h - 20);
    // Un petit phare stylisé
    g.fillStyle = "#e9dfc6";
    g.beginPath();
    g.moveTo(x + 52, y + 200);
    g.lineTo(x + 66, y + 70);
    g.lineTo(x + 86, y + 70);
    g.lineTo(x + 100, y + 200);
    g.fill();
    g.fillStyle = "#c8362b";
    g.fillRect(x + 62, y + 105, 28, 22);
    g.fillStyle = "#c79a3b";
    g.fillRect(x + 64, y + 50, 24, 20);
    texte("LIGHTHOUSE LODGE", x + 300, y + 70, "bold 40px serif", "#e9dfc6");
    texte("gîte insolite connecté", x + 300, y + 105, "italic 26px serif", "#e9dfc6");
    texte("Réservez votre nuit", x + 300, y + 150, "bold 28px sans-serif", "#c79a3b");
    texte("au bout du monde", x + 300, y + 182, "bold 28px sans-serif", "#c79a3b");
    texte("★★★★★  Wi-Fi · jacuzzi · vue mer", x + 300, y + 222, "18px sans-serif", "#e9dfc6");
    g.fillStyle = "#e9dfc6";
    g.fillRect(x + 440, y + 18, 54, 54);
    g.fillStyle = "#1f2a2a";
    for (let i = 0; i < 25; i++) if ((i * 7) % 3) g.fillRect(x + 444 + (i % 5) * 9.5, y + 22 + Math.floor(i / 5) * 9.5, 8, 8);
    // Délavé par le sel, une affichette de survivant scotchée dessus
    g.fillStyle = "rgba(233,223,198,0.25)";
    g.fillRect(x, y, l, h);
    salir(x, y, l, h, 16, "rgba(240,240,230,0.35)");
    salir(x, y, l, h, 8);
    g.save();
    g.translate(x + 400, y + 200);
    g.rotate(-0.12);
    g.fillStyle = "#e6e0d0";
    g.fillRect(-60, -24, 120, 48);
    texte("COMPLET", 0, 10, "bold 26px sans-serif", "#2a2420");
    g.restore();
  }
  // La borne « Notez votre séjour »
  {
    const [x, y, l, h] = R.borne;
    g.fillStyle = "#14202a";
    g.fillRect(x, y, l, h);
    texte("Notez votre séjour", x + l / 2, y + 50, "bold 26px sans-serif", "#9fd8ff");
    texte("★★★★★", x + l / 2, y + 105, "bold 46px sans-serif", "#c79a3b");
    const smileys = [["#c8362b", -1], ["#c79a3b", 0], ["#5aa05a", 1]];
    smileys.forEach(([coul, m], i) => {
      const cx = x + 55 + i * 73;
      const cy = y + 175;
      g.fillStyle = coul;
      g.beginPath();
      g.arc(cx, cy, 28, 0, 7);
      g.fill();
      g.fillStyle = "#14202a";
      g.fillRect(cx - 12, cy - 10, 6, 6);
      g.fillRect(cx + 6, cy - 10, 6, 6);
      g.strokeStyle = "#14202a";
      g.lineWidth = 4;
      g.beginPath();
      g.arc(cx, cy + 20 - m * 10, 12, m >= 0 ? 0.2 * Math.PI : 1.2 * Math.PI, m >= 0 ? 0.8 * Math.PI : 1.8 * Math.PI);
      g.stroke();
    });
    texte("Merci de votre visite !", x + l / 2, y + 232, "16px sans-serif", "#9fd8ff");
    // L'écran est fendu, mort
    g.strokeStyle = "rgba(220,230,240,0.7)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 170, y + 20);
    g.lineTo(x + 120, y + 120);
    g.lineTo(x + 150, y + 160);
    g.lineTo(x + 90, y + 250);
    g.stroke();
    g.fillStyle = "rgba(10,14,18,0.45)";
    g.fillRect(x, y, l, h);
  }
  // La boîte à clés connectée
  {
    const [x, y, l, h] = R.cles;
    g.fillStyle = "#2d3236";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#101418";
    g.fillRect(x + 14, y + 12, l - 28, 26);
    texte("HORS LIGNE", x + l / 2, y + 31, "bold 13px sans-serif", "#c8362b");
    g.fillStyle = "#8d969a";
    for (let i = 0; i < 12; i++) g.fillRect(x + 22 + (i % 3) * 30, y + 46 + Math.floor(i / 3) * 19, 22, 14);
    texte("KeyBox+", x + l / 2, y + 124, "10px sans-serif", "#8d969a");
  }
  // La plaque du phare
  {
    const [x, y, l, h] = R.plaque;
    g.fillStyle = "#3b3a38";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#b59048";
    g.lineWidth = 4;
    g.strokeRect(x + 6, y + 6, l - 12, h - 12);
    texte("PHARE", x + l / 2, y + 42, "bold 22px serif", "#b59048");
    texte("DU CAP", x + l / 2, y + 68, "bold 22px serif", "#b59048");
    texte("allumé en 1883", x + l / 2, y + 98, "italic 14px serif", "#b59048");
    salir(x, y, l, h, 5, "rgba(90,140,110,0.4)");
  }
  // L'autocollant de Watty sur le tableau électrique
  {
    const [x, y, l, h] = R.watty;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c79a3b";
    g.fillRect(x + 20, y + 22, 50, 84);
    g.fillRect(x + 35, y + 12, 20, 12);
    g.fillStyle = "#2a2420";
    g.fillRect(x + 32, y + 50, 6, 8);
    g.fillRect(x + 52, y + 50, 6, 8);
    g.strokeStyle = "#2a2420";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x + 45, y + 70, 12, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
    texte("WATTY", x + 160, y + 48, "bold 30px sans-serif", "#c8362b");
    texte("Toujours plein,", x + 160, y + 78, "16px sans-serif", "#2a2420");
    texte("jamais à plat !", x + 160, y + 100, "16px sans-serif", "#2a2420");
    salir(x, y, l, h, 6);
  }
  // La carte marine : côtes, sondes, rose des vents
  {
    const [x, y, l, h] = R.carte;
    g.fillStyle = "#e6dcc0";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c9b98e";
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 220, y);
    g.bezierCurveTo(x + 200, y + 50, x + 150, y + 60, x + 160, y + 110);
    g.bezierCurveTo(x + 165, y + 140, x + 110, y + 150, x + 90, y + 120);
    g.bezierCurveTo(x + 60, y + 90, x + 30, y + 130, x, y + 120);
    g.fill();
    g.strokeStyle = "#7a9ab0";
    g.lineWidth = 1.2;
    for (let i = 1; i < 5; i++) {
      g.beginPath();
      g.moveTo(x, y + 120 + i * 18);
      g.bezierCurveTo(x + 80, y + 120 + i * 22, x + 150, y + 160 + i * 14, x + 230 + i * 10, y);
      g.stroke();
    }
    g.fillStyle = "#4a5a6a";
    g.font = "10px serif";
    for (let i = 0; i < 40; i++) g.fillText(String(3 + ((i * 7) % 40)), x + 30 + ((i * 53) % 330), y + 140 + ((i * 37) % 110));
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.arc(x + 158, y + 112, 5, 0, 7);
    g.fill();
    g.strokeStyle = "#c8362b";
    g.beginPath();
    g.arc(x + 158, y + 112, 14, 0, 7);
    g.stroke();
    // Rose des vents
    g.save();
    g.translate(x + 310, y + 70);
    g.fillStyle = "#3b3a38";
    for (let i = 0; i < 8; i++) {
      g.rotate(Math.PI / 4);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(5, -8);
      g.lineTo(0, i % 2 ? -26 : -46);
      g.lineTo(-5, -8);
      g.fill();
    }
    g.restore();
    texte("CHENAL DU CAP", x + 270, y + 230, "italic 16px serif", "#3b3a38");
    salir(x, y, l, h, 12, "rgba(120,95,55,0.25)");
  }
  // Le journal de bord, ouvert : deux pages manuscrites
  {
    const [x, y, l, h] = R.journal;
    g.fillStyle = "#ece2c8";
    g.fillRect(x, y, l, h);
    g.fillStyle = "rgba(90,70,40,0.35)";
    g.fillRect(x + l / 2 - 2, y, 4, h);
    g.strokeStyle = "rgba(90,110,140,0.35)";
    for (let r = 0; r < 14; r++) {
      g.beginPath();
      g.moveTo(x + 8, y + 40 + r * 15);
      g.lineTo(x + l - 8, y + 40 + r * 15);
      g.stroke();
    }
    texte("Journal de bord", x + 64, y + 26, "italic bold 14px serif", "#2f3a4c");
    const lignes = ["Vent SO 7, grains.", "Feu allumé 18 h 12.", "Rien à signaler.", "Plus de relève.", "Le réseau est tombé.", "Pétrole : 3 bidons.", "Ils viennent à", "la lumière."];
    lignes.forEach((t, i) => texte(t, i < 4 ? x + 12 : x + l / 2 + 10, y + 52 + (i % 4) * 30, "italic 13px serif", "#2f3a4c", "left"));
    texte("Rallumé quand même.", x + l / 2 + 10, y + 200, "italic bold 13px serif", "#8a2a24", "left");
    salir(x, y, l, h, 8, "rgba(120,95,55,0.3)");
  }
  // La planche des survivants : un avertissement peint à la main
  {
    const [x, y, l, h] = R.avis;
    g.fillStyle = "#8a7a62";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = "rgba(60,45,30,0.3)";
      g.fillRect(x, y + i * 32, l, 2);
    }
    g.save();
    g.translate(x + l / 2, y + h / 2);
    g.rotate(-0.04);
    texte("ÉTEINS LA LANTERNE !", 0, -12, "bold 36px sans-serif", "#a8302a");
    texte("ILS VOIENT LA LUMIÈRE", 0, 34, "bold 28px sans-serif", "#e6e0d0");
    g.restore();
  }
  // Le panneau du sentier
  {
    const [x, y, l, h] = R.sentier;
    g.fillStyle = "#6a5a48";
    g.fillRect(x, y, l, h);
    texte("Sentier côtier", x + l / 2, y + 40, "bold 22px serif", "#e6e0d0");
    texte("← Port · 6 km", x + l / 2, y + 74, "18px serif", "#e6e0d0");
    texte("Phare du Cap →", x + l / 2, y + 104, "18px serif", "#e6e0d0");
  }
  // La plaque du canot
  {
    const [x, y, l, h] = R.canot;
    g.fillStyle = "#d8d2c4";
    g.fillRect(x, y, l, h);
    texte("CANOT N° 2", x + l / 2, y + 50, "bold 26px serif", "#2f4b6a");
    texte("Sauvetage du Cap", x + l / 2, y + 88, "italic 18px serif", "#2f4b6a");
    salir(x, y, l, h, 6);
  }
  // Le flanc d'un conteneur : tôle ondulée gris clair (la couleur vient des sommets), logo, rouille, marquages
  {
    const [x, y, l, h] = R.conteneur;
    g.fillStyle = "#d8d8d4";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < l; i += 16) {
      const d = g.createLinearGradient(x + i, 0, x + i + 16, 0);
      d.addColorStop(0, "rgba(255,255,255,0.35)");
      d.addColorStop(0.5, "rgba(0,0,0,0.0)");
      d.addColorStop(1, "rgba(0,0,0,0.28)");
      g.fillStyle = d;
      g.fillRect(x + i, y, 16, h);
    }
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(x, y, l, 8);
    g.fillRect(x, y + h - 8, l, 8);
    texte("ABONDANCE", x + l / 2, y + 112, "bold 64px sans-serif", "rgba(255,255,255,0.92)");
    texte("EXPRESS", x + l / 2, y + 162, "bold 44px sans-serif", "rgba(255,255,255,0.92)");
    texte("Livré avant d'être commandé", x + l / 2, y + 196, "italic 20px sans-serif", "rgba(255,255,255,0.85)");
    texte("ABXU 220814 3   22G1", x + 120, y + 40, "bold 18px monospace", "rgba(255,255,255,0.8)");
    // La rouille qui coule des longerons, le sel
    for (let i = 0; i < 26; i++) {
      const px = x + ((i * 83) % l);
      const lg = 20 + ((i * 37) % 90);
      g.fillStyle = `rgba(${120 + (i % 3) * 20},60,30,${0.2 + (i % 4) * 0.08})`;
      g.fillRect(px, y + (i % 2 ? 8 : h - 8 - lg), 3 + (i % 3) * 2, lg);
    }
    salir(x, y, l, h, 14, "rgba(240,240,232,0.3)");
    salir(x, y, l, h, 10, "rgba(110,60,30,0.3)");
  }
  // Le nom du cargo, en lettres blanches sur la coque bleu nuit
  {
    const [x, y, l, h] = R.coque;
    g.fillStyle = "#26384a";
    g.fillRect(x, y, l, h);
    texte("PRIME ABONDANCE", x + l / 2, y + 74, "bold 62px serif", "#ece8de");
    texte("LIVRAISON DU JOUR · FLOTS", x + l / 2, y + 112, "bold 20px sans-serif", "#c9c3b6");
    for (let i = 0; i < 12; i++) {
      g.fillStyle = `rgba(150,75,40,${0.3 + (i % 3) * 0.12})`;
      g.fillRect(x + ((i * 47) % l), y + 80 + (i % 3) * 10, 4, 48);
    }
    salir(x, y, l, h, 6, "rgba(220,220,210,0.18)");
  }
  // L'étiquette des cartons
  {
    const [x, y, l, h] = R.carton;
    g.fillStyle = "#efe6cf";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 34);
    texte("LIVRAISON DU JOUR", x + l / 2, y + 25, "bold 22px sans-serif", "#fff6e0");
    texte("Abondance Express", x + l / 2, y + 62, "bold 20px sans-serif", "#2a2420");
    texte("Livré avant d'être commandé", x + l / 2, y + 86, "italic 15px sans-serif", "#2a2420");
    g.fillStyle = "#2a2420";
    for (let i = 0; i < 30; i++) g.fillRect(x + 40 + i * 6, y + 96, i % 3 ? 2 : 4, 24);
    salir(x, y, l, h, 5);
  }
  // Les portes d'un conteneur : les barres de fermeture, les crémones, la plaque CSC
  {
    const [x, y, l, h] = R.porteC;
    g.fillStyle = "#cfcfca";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < h; i += 22) {
      g.fillStyle = "rgba(0,0,0,0.12)";
      g.fillRect(x, y + i + 14, l, 8);
    }
    g.fillStyle = "#5a5a56";
    for (const px of [60, 180]) {
      g.fillRect(x + px, y + 6, 10, h - 12);
      g.fillRect(x + px - 8, y + 120, 26, 14);
    }
    g.fillStyle = "#e6e2d8";
    g.fillRect(x + 92, y + 30, 70, 44);
    texte("CSC", x + 127, y + 60, "bold 18px sans-serif", "#2a2420");
    salir(x, y, l, h, 8, "rgba(110,60,30,0.3)");
  }
}
