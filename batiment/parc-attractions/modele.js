// Le parc d'attractions « Wattyland » (lieu proposé au Book 20 §6, périphérie de la Ville ou Littoral, lointain,
// danger ●●●●).
//
// Le parc de la Compagnie d'électricité, à la gloire de Watty : tout y était « 100 % électrique », tout se payait par
// abonnement (le Pass Watty Illimité, à reconnaissance faciale). On entre par la bouche d'une tête de Watty haute de
// dix mètres (un œil luit encore). Dedans : le carrousel aux chevaux de bois écaillés sous son chapiteau crevé, la
// grande roue rouillée dont une nacelle est tombée, les stands, la boutique pleine de peluches, puis, au fond, les
// montagnes russes du « Court-Circuit » avec leur wagon arrêté au sommet, le train fantôme, les autos tamponneuses,
// la rivière des bûches à sec et l'atelier de maintenance, trésor des Mécanistes.
//
// Inspiration : le Spreepark de Berlin (dinosaures renversés, grande roue rouillée), Okpo Land, Nara Dreamland, Six
// Flags New Orleans après l'ouragan.
//
// Deux cartes (≤ 60 000 triangles, ≤ 40 appels de dessin chacune), qui partagent le même plan (plan.js) :
// - « entree » : la tête de Watty, la billetterie, le carrousel, la grande roue, les stands, la boutique ;
// - « maneges » : les montagnes russes, le train fantôme, les autos tamponneuses, les bûches, l'atelier.
//
// Fichiers : plan.js (le plan), textures.js (l'atlas des enseignes), outils.js (matières, géométrie), mobilier.js
// (ce qui revient partout), entree.js et maneges.js (les deux cartes).

import { Batiment } from "../commun/atelier.js";
import { ORIGINES } from "./plan.js";
import { ampoulesVivantes } from "./mobilier.js";
import { carteEntree } from "./entree.js";
import { carteManeges } from "./maneges.js";

function arr(v) {
  return Math.round(v * 10) / 10;
}
function vers(carte, liste) {
  const o = ORIGINES[carte];
  return liste.map((p) => ({ ...p, x: arr(p.x - o.x), z: arr(p.z - o.z) }));
}

const CARTES = [
  {
    id: "entree",
    nom: "L'entrée, la grande roue et le carrousel",
    lot: { l: 66, p: 60 },
    depart: vers("entree", [{ x: -28.8, z: 28.5 }])[0],
    description: "la tête de Watty et la billetterie, le carrousel des survivants, la grande roue, les stands, la boutique de souvenirs, le poste de secours",
    entrees: vers("entree", [
      { x: -30, z: 23.5, nature: "la bouche de Watty : le porche d'entrée, ses tourniquets à reconnaissance faciale" },
      { x: -28.8, z: 30, nature: "le parvis, depuis la route (le coupe-file premium mène droit à la bouche)" },
      { x: -55, z: 22, nature: "un panneau de clôture tombé, à l'ouest du parvis" },
      { x: 0, z: 14.5, nature: "l'allée des stands, vers l'est (carte « les manèges »)" },
      { x: -66, z: -5, nature: "le bois, à l'ouest : il n'y a plus de clôture" },
    ]),
    fouille: vers("entree", [
      { x: -43, z: 27, quoi: "billetterie : caisse vide, rouleaux de billets, terminaux de reconnaissance faciale (petites caméras, cartes électroniques), le coffre (fermé)" },
      { x: -30.6, z: 22, quoi: "tourniquets de l'entrée : petits moteurs électriques, lecteurs, câbles" },
      { x: -23.2, z: 17.8, quoi: "le Watty animatronique : panneau solaire qui marche, batterie encore chargée, moteur du bras" },
      { x: -42.6, z: 6.6, quoi: "carrousel : moteur électrique central (trappe sous le plancher), couronne dentée, roulements (Mécanistes)" },
      { x: -42.4, z: 7.2, quoi: "orgue de Barbarie : tuyaux de laiton, soufflets en cuir, cylindre à picots" },
      { x: -45.8, z: 9.9, quoi: "camp des survivants : couvertures, réserve de bois sec, une casserole" },
      { x: -46.2, z: -18.4, quoi: "cabine du forain de la grande roue : armoire électrique, contacteurs, câbles, une lampe" },
      { x: -44.5, z: -15.4, quoi: "nacelle tombée : tôle peinte, boulonnerie, plexiglas" },
      { x: -20.7, z: 8.5, quoi: "stand de tir : carabines à plombs (pièces), plombs, peluches (rembourrage)" },
      { x: -12.6, z: 8.2, quoi: "pêche aux canards : canards en plastique, cannes en bambou, lots (petits jouets)" },
      { x: -4.5, z: 8.4, quoi: "barbe à papa : sacs de sucre, conserves de fruits au sirop, moteur de la centrifugeuse" },
      { x: -19.5, z: -5, quoi: "boutique Watty : peluches par dizaines (rembourrage, isolation), piles de démonstration, tee-shirts" },
      { x: -5.5, z: -7.6, quoi: "poste de secours : trousses, bandages, désinfectant, brancard, fauteuil roulant" },
      { x: -30, z: 10, quoi: "guirlandes : câble électrique, ampoules, douilles (Voltaïques)" },
    ]),
    eteints: vers("entree", [
      { x: -28, z: 26.5, type: "errant (sur le parvis)" },
      { x: -36, z: 27.2, type: "errant (pris dans la file d'attente)" },
      { x: -31, z: 12, type: "errant (allée principale)" },
      { x: -40.6, z: 9.8, type: "rampant (sous les chevaux du carrousel)" },
      { x: -49, z: 3, type: "errant (entre les chevaux)" },
      { x: -50.5, z: -17.5, type: "ancien habitant (forain de la grande roue, blouse rouge)" },
      { x: -56, z: -13, type: "errant (herbes hautes)" },
      { x: -20.5, z: 8, type: "ancien habitant (forain du stand de tir)" },
      { x: -11, z: 15, type: "errant (allée des stands)" },
      { x: -18.6, z: -3.6, type: "putréfié (dans la boutique, parmi les peluches)" },
      { x: -4.6, z: -5.2, type: "rampant (sous le brancard du poste de secours)" },
      { x: -27.5, z: 3, type: "ancien habitant (employé en costume de Watty, la tête de mascotte de travers)" },
      { x: -60, z: 4, type: "errant (herbes hautes)" },
      { x: -37, z: -12.5, type: "équipé (casque de chantier, gilet de la Compagnie)" },
    ]),
  },
  {
    id: "maneges",
    nom: "Les montagnes russes, le train fantôme et l'atelier",
    lot: { l: 66, p: 56 },
    depart: vers("maneges", [{ x: 2, z: 14.5 }])[0],
    description: "les montagnes russes du Court-Circuit, le train fantôme, les autos tamponneuses, la rivière des bûches à sec, l'atelier de maintenance",
    entrees: vers("maneges", [
      { x: 0, z: 14.5, nature: "l'allée des stands, vers l'ouest (carte « l'entrée »)" },
      { x: 31.3, z: 22, nature: "une brèche dans la clôture, au sud" },
      { x: 10, z: 6, nature: "l'entrée du train fantôme (portes battantes)" },
      { x: 20, z: 6, nature: "la sortie du train fantôme" },
      { x: 57, z: -19, nature: "la porte coulissante de l'atelier, poussée de côté" },
      { x: 53, z: -26.5, nature: "la porte de service de l'atelier, à l'ouest" },
      { x: 66, z: 15, nature: "le bois, à l'est" },
    ]),
    fouille: vers("maneges", [
      { x: 56.5, z: -21.4, quoi: "atelier : trois moteurs électriques de manèges (lourds), câbles, contacteurs" },
      { x: 64.2, z: -27, quoi: "étagères de l'atelier : engrenages, roulements, courroies, boulonnerie (le trésor des Mécanistes)" },
      { x: 56, z: -27.8, quoi: "établi : clés, étau, caisse à outils, burettes d'huile" },
      { x: 62.4, z: -20.4, quoi: "auto tamponneuse démontée : batteries de kart, moteur de traction" },
      { x: 61.2, z: -27.8, quoi: "le coin des Mécanistes : lit de camp, lampe sur batterie, réserve" },
      { x: 37, z: 3, quoi: "autos tamponneuses : batteries des karts, moteurs, volants, perches en cuivre" },
      { x: 29.2, z: 6.5, quoi: "borne de recharge par abonnement : électronique, câble, un voyant qui marche encore" },
      { x: 8, z: -10.6, quoi: "gare du Court-Circuit : roulements et freins des wagons, chaîne de la montée" },
      { x: 24, z: -24.5, quoi: "tronçon effondré : rails, tubes d'acier, boulonnerie (ferraille)" },
      { x: 12, z: 8.6, quoi: "wagonnets du train fantôme : petits moteurs, batteries" },
      { x: 13.4, z: -5.2, quoi: "décors du train fantôme : draps (tissu), cordes, la pile de la veilleuse" },
      { x: 59, z: 7.6, quoi: "bassin des bûches : bois des bûches, pompe du canal (moteur)" },
      { x: 38, z: 1, quoi: "plafond grillagé des tamponneuses : grillage, câbles d'alimentation" },
    ]),
    eteints: vers("maneges", [
      { x: 14, z: 14, type: "errant (allée des stands)" },
      { x: 31, z: 15.5, type: "errant (allée des stands)" },
      { x: 16, z: -0.4, type: "rampant (sous le wagonnet déraillé, dans le noir)" },
      { x: 21, z: -2.5, type: "putréfié (dans le noir du train fantôme)" },
      { x: 11, z: 0, type: "errant (sur les rails du train fantôme)" },
      { x: 38.5, z: 3.5, type: "ancien habitant (forain des tamponneuses, gilet jaune)" },
      { x: 34, z: 6.5, type: "errant (entre les autos)" },
      { x: 26, z: -22.5, type: "errant (sous les montagnes russes, dans les herbes)" },
      { x: 9, z: -10.1, type: "ancien habitant (opérateur du Court-Circuit, casquette)" },
      { x: 40, z: -20, type: "errant (herbes hautes)" },
      { x: 55.2, z: 4, type: "rampant (dans le canal à sec)" },
      { x: 58, z: -16.5, type: "équipé (bleu de travail, clé à molette)" },
      { x: 16, z: -20, type: "errant (herbes hautes)" },
    ]),
  },
];

export const FICHE = {
  id: "parc-attractions",
  nom: "Le parc d'attractions « Wattyland »",
  lieu: "Parc d'attractions · périphérie de la Ville · lointain",
  environnement: "ville",
  anneau: "lointain",
  danger: 4,
  recit:
    "Le parc de la Compagnie d'électricité, à la gloire de Watty : on y entrait par sa bouche, on payait d'un sourire, et le Pass Watty Illimité prélevait le reste. Depuis la Grande Panne, la grande roue rouille au-dessus des herbes, des survivants dorment entre les chevaux de bois, et un Watty animatronique, nourri par son panneau solaire, souhaite encore la bienvenue en bégayant. Ici, même les sourires sont rechargeables, disait l'affiche : les moteurs des manèges, eux, se démontent.",
  inspiration:
    "Le Spreepark de Berlin (dinosaures renversés, grande roue rouillée), Okpo Land (Corée), Nara Dreamland (Japon), Six Flags New Orleans après l'ouragan ; photographies d'urbex : chevaux de bois écaillés, visages de mascottes géantes délavés, montagnes russes envahies de végétation",
  reperes: [
    "La tête géante de Watty à l'entrée : on passe par sa bouche (tourniquets à reconnaissance faciale), peinture écaillée, un œil éteint, l'autre luit encore la nuit ; son bras droit est tombé sur le parvis",
    "La billetterie, la file d'attente en zigzag et le « Coupe-file Premium » au tapis rouge, parfaitement vide",
    "Le carrousel : chevaux de bois écaillés, miroirs ternis, orgue de Barbarie, chapiteau rayé crevé ; un bouleau a poussé à travers ; des survivants y ont fait leur feu",
    "La grande roue rouillée (près de 30 m) : seize nacelles qui pendent, une tombée dans l'herbe, une autre de travers",
    "Les stands : tir à la carabine (peluches), pêche aux canards à sec, barbe à papa coiffée d'une barbe à papa géante",
    "La boutique Watty pleine de peluches (rembourrage, isolation) et son grand Watty sur le toit ; le poste de secours",
    "Le Watty animatronique sur son panneau solaire, qui salue par à-coups ; le panneau « Ici, même les sourires sont rechargeables ! »",
    "Les guirlandes d'ampoules au-dessus des allées : quelques ampoules s'allument encore par intermittence",
    "Les montagnes russes du Court-Circuit en treillis, le wagon arrêté au sommet, un tronçon effondré",
    "Le train fantôme (façade peinte, rails dans le noir, wagonnets), les autos tamponneuses sous leur plafond grillagé, la rivière des bûches asséchée",
    "L'atelier de maintenance : moteurs, engrenages, roulements, outils (le trésor des Mécanistes)",
  ],
  cartes: CARTES,
};

/** Recentre une carte sur son lot : géométries, couches, obstacles, lumières. */
function recentrer(groupe, o, lot) {
  const vues = new Set();
  for (const enfant of groupe.children) {
    if (!enfant.userData.deplacer) continue;
    enfant.position.x -= o.x;
    enfant.position.z -= o.z;
    enfant.traverse((obj) => obj.geometry && vues.add(obj.geometry));
  }
  groupe.traverse((obj) => {
    if (obj.geometry && !vues.has(obj.geometry)) {
      vues.add(obj.geometry);
      obj.geometry.translate(-o.x, 0, -o.z);
    }
  });
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - o.x), z: arr(t.boite.z - o.z) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - o.x, z: t.horsDe.z - o.z };
  }
  const dedans = (x, z) => Math.abs(x) <= lot.l / 2 + 1 && Math.abs(z) <= lot.p / 2 + 1;
  ud.obstacles = ud.obstacles
    .map((s) => ({ ...s, x1: arr(s.x1 - o.x), z1: arr(s.z1 - o.z), x2: arr(s.x2 - o.x), z2: arr(s.z2 - o.z) }))
    .filter((s) => dedans(s.x1, s.z1) || dedans(s.x2, s.z2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - o.x), z: arr(l.z - o.z) })).filter((l) => dedans(l.x, l.z));
  return groupe;
}

export function creer({ usure = 0.7, carte = "entree" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const o = ORIGINES[def.id];
  const b = new Batiment(def.id === "entree" ? 1994 : 1995, usure);
  const ctx = { b, c: b.c, u: usure, carte: def.id, amp: [] };
  if (def.id === "entree") carteEntree(ctx);
  else carteManeges(ctx);
  const amp = ampoulesVivantes(ctx.amp);
  if (amp) b.ajouter(amp);
  return recentrer(b.construire(), o, def.lot);
}
