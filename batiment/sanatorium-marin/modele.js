// Le sanatorium marin des Courlis (nouveau lieu, Littoral, anneau moyen, danger ●●●).
//
// Un hôpital d'enfants de la fin du XIXe siècle, posé sur la dune face à la Manche : on y soignait au grand air, au
// soleil et au sel les enfants des villes. Deux longs pavillons de brique claire à bandeaux d'enduit et toits de tuiles,
// reliés par une galerie couverte face à la mer (colonnes de fonte, lambrequins de bois) où l'on poussait les lits
// roulants ; entre les deux, la chapelle à clocheton ; au sud-est, la piscine d'eau de mer couverte sous sa verrière
// crevée ; à l'ouest, la dune qui a avancé et noyé à demi le bout du pavillon des Enfants. En contrebas de la digue,
// la plage, l'épi de bois, la mer.
// L'Abondance : le lieu était devenu « ThalassoLuxe Connect » (soins pilotés par application, iode en réalité
// virtuelle, bornes d'enregistrement, peignoirs brodés sous plastique) ; ses panneaux neufs sont collés par-dessus
// les fresques naïves peintes pour les enfants.
//
// Deux cartes (budget : ≤ 60 000 triangles, ≤ 40 appels de dessin chacune) :
// - « front » : le front de mer : la galerie et ses lits roulants, la chapelle, la piscine d'eau de mer et ses cabines,
//   le jardin, la dune, la digue, la plage et l'épi (les pavillons y sont fermés : on y entre par la carte voisine) ;
// - « pavillons » : l'intérieur des deux pavillons (dortoir, salle de rééducation, réfectoire, cuisine collective,
//   infirmerie, lingerie), la galerie et la chapelle.
// Les deux cartes partagent le même site, aux mêmes coordonnées « site » (S) ; chacune est recentrée sur son lot.
//
// Repère S : +x à l'est, +z au sud (la mer). Pavillons de z = −17 à −6 (A, les Enfants : x −36 → −5 ; B, les
// Services : x 5 → 36) ; galerie de z = −6 à −2,5 ; chapelle x ±3,5, z −23 → −8,5 ; piscine x 10 → 34, z 3 → 17 ;
// digue à z = 18 ; la plage descend jusqu'à la mer (z ≈ 27). On ne visite que le rez-de-chaussée : le haut des murs
// côté caméra (sud et est), les étages et les toits forment des couches qui s'effacent.

import * as THREE from "three";
import {
  Batiment, Chantier, mur, toitDeuxPans, touffes, gravats, debris as debrisA, jonchee as joncheeA, mousse,
  raiDeLumiere as raiA, aleatoire,
} from "../commun/atelier.js";
import { COUL, R, matieres, panneau } from "./textures.js";
import {
  cylindre, tronc, boule, litEnfant, litRoulant, chevet, casiers, ours, seau, voilier, cerceau, chevalBascule, espalier,
  poulies, barresParalleles, ballon, plinthe, tapis, tableEnfants, chaiseEnfant, marmite, fourneau, etagereConserves,
  evier, brasero, couchage, lanterne, caisse, armoirePharmacie, peseBebe, paravent, etagereLinge, portantPeignoirs,
  lessiveuse, panier, bancEnfants, exVoto, statue, cierges, oyats, congere, boisFlotte,
} from "./mobilier.js";

// Le petit désordre coûte cher en triangles : on le dose.
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.5), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.5), t, y);
// Un seul matériau de lueur pour tous les rais de lumière
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.09);

// ---------- Mesures du site (repère S) ----------

const RDC = 4.2; // hauteur du rez-de-chaussée (bâtisse ancienne, plafonds hauts : l'air circulait)
const ETG = 7.6; // haut de l'étage
const HF = 3.3; // hauteur des toits
const CUT = 0.9; // coupe des façades côté caméra (hauteur d'allège)
const CUTI = 1.25; // coupe des cloisons
const EP = 0.4;
const EPI = 0.2;
const ZS = -6; // façade sud des pavillons (fond de la galerie)
const ZN = -17; // façade nord
const ZG = -2.5; // bord de la galerie
const PA = { x1: -36, x2: -5 };
const PB = { x1: 5, x2: 36 };
const XA = -17.4; // cloison dortoir | rééducation
const XB1 = 20.5; // réfectoire | cuisine
const XB2 = 26.7; // cuisine | infirmerie et lingerie
const ZB = -11.5; // infirmerie (nord) | lingerie (sud)
const CH = { x1: -3.5, x2: 3.5, z1: -23, z2: -8.5, h: 6.2 };
const PIS = { x1: 10, x2: 34, z1: 3, z2: 17, h: 4.8 };
const BAS = { x1: 14, x2: 30, z1: 6, z2: 14, fond: -1.8 };
const PAS = { x1: 15, x2: 18 }; // le passage couvert vers la piscine
const Z_DIGUE = 18;
const Y_PLAGE = -1.6;
const Y_MER = -1.95;

// ---------- Les cartes ----------

const CENTRES = { front: { x: -4, z: 7 }, pavillons: { x: 0, z: -11 } };
const LOTS = { front: { l: 92, p: 70 }, pavillons: { l: 76, p: 28 } };

function versCarte(id, points) {
  const o = CENTRES[id];
  return points.map((p) => ({ ...p, x: Math.round((p.x - o.x) * 10) / 10, z: Math.round((p.z - o.z) * 10) / 10 }));
}

export const FICHE = {
  id: "sanatorium-marin",
  nom: "Le sanatorium marin des Courlis",
  lieu: "Nouveau lieu · Littoral · moyen",
  environnement: "littoral",
  anneau: "moyen",
  danger: 3,
  recit:
    "Pendant un siècle, on a poussé ici des lits d'enfants jusqu'au bord de la mer, pour que le vent et le sel les guérissent. Puis le lieu est devenu « ThalassoLuxe Connect », où l'on respirait l'iode en réalité virtuelle, le dos tourné à la vraie mer. La dune, elle, n'avait pas d'abonnement : elle est entrée par les fenêtres du dortoir, et elle reste.",
  inspiration:
    "les hôpitaux et sanatoriums marins de la côte d'Opale (Berck-sur-Mer et ses lits roulants poussés jusque sur la plage), les préventoriums et colonies de vacances abandonnés du littoral, photographies d'urbex : longues galeries face à la mer, piscines d'eau de mer carrelées, lits d'enfants en fer, fresques marines naïves écaillées, sable qui envahit tout",
  reperes: [
    "La silhouette : deux longs pavillons de brique claire à bandeaux d'enduit, toits de tuiles orangées tachées de lichen, la chapelle et son clocheton entre les deux",
    "La galerie couverte face à la mer : colonnes de fonte, lambrequins de bois découpé, lits roulants de cure tournés vers le large (casques de réalité virtuelle sur les oreillers), marelle à la craie",
    "Les fresques naïves (baleine, voilier, phare, frise de poissons), écaillées par le sel, recouvertes à moitié par les panneaux neufs de « ThalassoLuxe Connect »",
    "La dune qui a avancé : elle noie le bout ouest du pavillon des Enfants, entre par les fenêtres, ensevelit les lits ; oyats couchés par le vent d'ouest",
    "La piscine d'eau de mer couverte : verrière crevée, bassin de mosaïque vide et à moitié ensablé, flaque d'eau verte au grand fond, cabines de bain, bornes d'enregistrement qui luisent la nuit",
    "Le dortoir d'enfants (rangées de petits lits de fer, casiers, jouets, lanterne de survivant), la salle de rééducation (espaliers, poulies, barres parallèles, ballons)",
    "Le réfectoire aux petites tables et le feu des survivants, la cuisine collective (fourneau de fonte, grandes marmites, conserves), l'infirmerie (armoire à pharmacie, pèse-bébé), la lingerie (piles de couvertures, peignoirs brodés sous plastique)",
    "La chapelle : petits bancs, ex-voto de trois-mâts pendu à la voûte, bougie qui brûle encore",
    "La digue, la cale en pente douce où l'on descendait les lits sur le sable, un lit roulant échoué sur la plage, l'épi de bois qui s'avance dans la mer",
  ],
  cartes: [
    {
      id: "front",
      nom: "Le front de mer",
      lot: LOTS.front,
      solPropre: true,
      depart: versCarte("front", [{ x: 2, z: 13 }])[0],
      description: "la galerie et ses lits roulants, la chapelle, la piscine d'eau de mer, le jardin, la dune, la digue, la plage et l'épi",
      entrees: versCarte("front", [
        { x: -4, z: 13, nature: "l'allée du jardin, depuis la route de la corniche (au sud-ouest, par la digue)" },
        { x: 40, z: 10, nature: "la grille de l'entrée de service, à l'est (un vantail tombé)" },
        { x: -14, z: 21, nature: "l'escalier de la digue, depuis la plage" },
        { x: 36, z: 24, nature: "la cale des lits roulants, depuis la plage" },
        { x: 16.5, z: 2.6, nature: "le passage couvert de la galerie à la piscine" },
        { x: 34, z: 14.5, nature: "la porte de la réception ThalassoLuxe, à l'est de la piscine" },
        { x: 22, z: 17, nature: "la verrière effondrée de la façade sud de la piscine (on enjambe le sable)" },
        { x: 0, z: -8.5, nature: "le portail de la chapelle" },
        { x: -22, z: -6, nature: "les portes-fenêtres du dortoir et de la rééducation (vers la carte « les pavillons »)" },
        { x: 9.6, z: -6, nature: "les portes-fenêtres du réfectoire (vers la carte « les pavillons »)" },
      ]),
      fouille: versCarte("front", [
        { x: -27, z: -4.2, quoi: "lits roulants de la galerie : roues, essieux, ressorts, couvertures de laine" },
        { x: 11, z: 6, quoi: "cabines de bain : serviettes, maillots, sandales, un sac de plage oublié" },
        { x: 31.4, z: 15.2, quoi: "comptoir ThalassoLuxe : peignoirs brodés sous plastique, bracelets connectés (électronique), pots de « sel marin premium »" },
        { x: 32.8, z: 4.2, quoi: "local de la pompe à eau de mer : vannes de laiton, tuyaux, moteur" },
        { x: 0, z: -21.6, quoi: "chapelle : cierges (cire), nappe d'autel, tronc des offrandes" },
        { x: -10, z: 28, quoi: "l'épi effondré : planches et pieux de chêne, bois flotté" },
        { x: 36, z: 25.6, quoi: "au pied de la cale : sel cristallisé dans les flaques, bouée et cordage" },
        { x: -22, z: 9, quoi: "la balançoire : chaînes, tubes d'acier" },
        { x: 25.5, z: 10, quoi: "au grand fond du bassin : une échelle d'inox démontable, des plombs de lignes d'eau" },
      ]),
      eteints: versCarte("front", [
        { x: -18, z: -3.6, type: "ancien habitant (infirmière à la coiffe, poussant un lit roulant vide)" },
        { x: 6, z: -4, type: "errant (dans la galerie)" },
        { x: -10, z: 8, type: "errant (dans le jardin)" },
        { x: 24, z: 4.8, type: "errant (curiste en peignoir ThalassoLuxe, bracelet au poignet)" },
        { x: 29, z: 15.5, type: "errant (curiste en peignoir ThalassoLuxe)" },
        { x: 17, z: 9, type: "rampant (dans le sable du bassin)" },
        { x: 11, z: 13, type: "putréfié (enfermé dans une cabine de bain)" },
        { x: -10, z: 31, type: "errant (au bout de l'épi, de l'eau jusqu'aux genoux)" },
        { x: -33, z: 4, type: "rampant (dans les oyats de la dune)" },
      ]),
    },
    {
      id: "pavillons",
      nom: "Les pavillons",
      lot: LOTS.pavillons,
      depart: versCarte("pavillons", [{ x: 0, z: 1 }])[0],
      description: "le dortoir d'enfants, la salle de rééducation, le réfectoire, la cuisine collective, l'infirmerie, la lingerie, la galerie et la chapelle",
      entrees: versCarte("pavillons", [
        { x: 16.5, z: 2.6, nature: "le passage couvert vers la piscine (vers la carte « le front de mer »)" },
        { x: 0, z: -2.5, nature: "la galerie, depuis le jardin (vers la carte « le front de mer »)" },
        { x: -25.2, z: -6, nature: "les portes-fenêtres du dortoir, sur la galerie" },
        { x: -12.8, z: -6, nature: "les portes-fenêtres de la salle de rééducation" },
        { x: 9.6, z: -6, nature: "les portes-fenêtres du réfectoire" },
        { x: 28.3, z: -6, nature: "la porte-fenêtre de la lingerie" },
        { x: -5, z: -11.5, nature: "la porte latérale de la rééducation, dans la ruelle de la chapelle" },
        { x: 25.2, z: -17, nature: "la porte de service de la cuisine, au nord" },
        { x: 0, z: -8.5, nature: "le portail de la chapelle" },
      ]),
      fouille: versCarte("pavillons", [
        { x: -24, z: -15.6, quoi: "lits d'enfants : couvertures de laine, draps, ressorts de sommier, tubes de fer" },
        { x: -18, z: -12, quoi: "casiers du dortoir : vêtements d'enfants, jouets, un livre d'images" },
        { x: -10, z: -16.4, quoi: "salle de rééducation : poulies, cordes, poids de fonte, barres de bois" },
        { x: -14, z: -9, quoi: "ballons de cuir et tapis de gymnastique (cuir, crin)" },
        { x: 12, z: -11.6, quoi: "camp de survivants du réfectoire : couvertures, gamelle, bois flotté sec" },
        { x: 23.6, z: -16.2, quoi: "cuisine collective : conserves, grandes marmites, couteaux, louches" },
        { x: 31, z: -16.4, quoi: "armoire à pharmacie de l'infirmerie : pansements, désinfectant, sirops (fermée à clé)" },
        { x: 34.6, z: -14, quoi: "infirmerie : pèse-bébé (laiton), instruments, thermomètres" },
        { x: 30.4, z: -10.6, quoi: "lingerie : piles de couvertures et de draps, peignoirs ThalassoLuxe sous plastique" },
        { x: 0, z: -21.6, quoi: "chapelle : cierges (cire), nappe d'autel" },
      ]),
      eteints: versCarte("pavillons", [
        { x: -22, z: -13, type: "ancien habitant (surveillante de nuit, trousseau de clés à la ceinture)" },
        { x: -27, z: -9.8, type: "rampant (sous une rangée de lits)" },
        { x: -11, z: -12.5, type: "ancien habitant (kinésithérapeute en blouse)" },
        { x: -8, z: -8, type: "errant (pris dans les cordes des poulies)" },
        { x: 8, z: -14, type: "errant (réfectoire)" },
        { x: 16, z: -8.5, type: "errant (réfectoire)" },
        { x: 23, z: -12.5, type: "ancien habitant (cuisinier, tablier et louche)" },
        { x: 31, z: -8.5, type: "errant (curiste en peignoir ThalassoLuxe, dans la lingerie)" },
        { x: 33, z: -14.6, type: "putréfié (allongé sur le lit de l'infirmerie)" },
        { x: -1.5, z: -15, type: "errant (agenouillé entre les bancs de la chapelle)" },
      ]),
    },
  ],
};

// ---------- Outils de construction ----------

const GEO = {};

/** Un prisme triangulaire (pignon) : base `l` centrée en x, sommet à `h`, épaisseur `ep` en z. */
function geoTriangle(l, h, ep) {
  const cle = `tri|${l}|${h}|${ep}`;
  if (!GEO[cle]) {
    const s = new THREE.Shape([new THREE.Vector2(-l / 2, 0), new THREE.Vector2(l / 2, 0), new THREE.Vector2(0, h)]);
    GEO[cle] = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false }).translate(0, 0, -ep / 2);
  }
  return GEO[cle];
}

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
 * Un mur coupé : le bas (0 → `cut`) reste toujours visible, le haut va dans la couche `haut` (par défaut celle des
 * pavillons). Avec `cut` = 0, tout reste visible (murs nord et ouest, opposés à la caméra), mais la peinture intérieure
 * change quand même de ton à 1,2 m. `peint` : [ton du soubassement, ton du haut] de la face intérieure (−z local) ;
 * `cloison` : les deux faces peintes (soubassement vert d'eau). Les obstacles suivent les ouvertures qui touchent le sol.
 */
function murCoupe(k, a, b, spec) {
  const { h, cut = CUT, ouvertures = [], breches = [], obstacles = true, haut: H = k.T, cloison = false, peint = null, ...reste } = spec;
  const ySplit = cut > 0 ? cut : peint || cloison ? 1.2 : 0;
  const parts = ySplit > 0 ? [[0, ySplit, k.c, "bas"], [ySplit, h, cut > 0 ? H : k.c, "haut"]] : [[0, h, k.c, "haut"]];
  for (const [p0, p1, ch, t] of parts) {
    if (p1 - p0 < 0.02) continue;
    const s = { ...reste, y0: p0, h: p1 - p0, ouvertures: tranche(ouvertures, p0, p1), breches: t === "haut" ? breches : [] };
    if (cloison) s.couleur = t === "bas" ? COUL.interieurBas : COUL.interieur;
    if (peint) s.interieur = { couleur: t === "bas" ? peint[0] : peint[1], mat: k.M.enduit };
    mur(ch, a, b, s);
  }
  if (obstacles) {
    const { L, dx, dz } = repereMur(a, b);
    const trous = ouvertures.filter((o) => o.bas < 0.5 && o.haut > 0.5 && !o.ferme).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
    for (const [u1, u2] of soustraire(0, L, trous)) k.b.obstacle(a[0] + (dx * u1) / L, a[1] + (dz * u1) / L, a[0] + (dx * u2) / L, a[1] + (dz * u2) / L);
  }
}

/** Des bandes horizontales en saillie sur la face extérieure (+z local) d'un mur : [{ y1, y2, s, couleur, mat, ch, trous }]. */
function bandes(a, b, ep, liste) {
  const { L, ry } = repereMur(a, b);
  for (const bd of liste) {
    const d = bd.deborde ?? bd.s;
    bd.ch.repere({ x: a[0], z: a[1], ry }, () => {
      for (const [u1, u2] of soustraire(-d, L + d, bd.trous ?? [])) bd.ch.pave(u1, bd.y1, ep / 2 - 0.02, u2, bd.y2, ep / 2 + bd.s, bd.couleur, bd.mat, { nuance: 0.03, crasse: bd.y1 < 1 });
    });
  }
}

/** Une pièce posée dans le repère d'un mur (u le long du mur, y, v vers l'extérieur). */
function surMur(ch, a, b, f) {
  const { ry } = repereMur(a, b);
  ch.repere({ x: a[0], z: a[1], ry }, f);
}

/** Une descente d'eau en zinc, du chéneau jusqu'au sol (à `u` le long du mur). */
function descente(ch, a, b, ep, u, haut, cassee = false) {
  const M = matieres();
  surMur(ch, a, b, () => {
    const z = ep / 2 + 0.14;
    const bas = cassee ? haut * 0.5 : 0.15;
    ch.tube([u, bas, z], [u, haut, z], 0.055, COUL.zinc, M.tole, 6);
    ch.boite(0.24, 0.14, 0.3, COUL.zinc, { x: u, y: haut + 0.05, z: z - 0.05 }, M.tole);
    if (cassee) ch.tube([u, bas, z], [u + 0.4, bas - 0.8, z + 0.4], 0.055, COUL.zinc, M.tole, 6);
  });
}

/** Deux battants de porte-fenêtre (repère monde : centre x, face z, orientation ry) : « ouverts », « tombe », « barricade ». */
function battants(c, x, z, ry, l, h, etat) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    const lv = l / 2 - 0.03;
    const vantail = (sx, ang) => {
      c.repere({ x: sx * (l / 2 - 0.02), y: 0, z: 0.05, ry: -sx * ang }, () => {
        const u = (-sx * lv) / 2;
        c.boite(lv, 0.08, 0.05, COUL.menuiserie, { x: u, y: h - 0.04 }, M.mat);
        c.boite(lv, 0.5, 0.05, COUL.menuiserie, { x: u, y: 0.3 }, M.mat, { nuance: 0.05 });
        for (const s of [-1, 1]) c.boite(0.07, h, 0.05, COUL.menuiserie, { x: u + (s * (lv - 0.07)) / 2, y: h / 2 }, M.mat);
        c.boite(0.04, h - 0.6, 0.04, COUL.menuiserie, { x: u, y: (h + 0.55) / 2 }, M.mat);
        if (c.hasard() < 0.5) c.boite(lv - 0.12, h - 0.65, 0.01, 0xffffff, { x: u, y: (h + 0.55) / 2 }, M.verre, { crasse: false });
      });
    };
    if (etat === "ouverts") {
      vantail(-1, 1.5);
      vantail(1, 1.25);
    } else if (etat === "entrouverts") {
      vantail(-1, 0.5);
      vantail(1, 0.1);
    } else if (etat === "tombe") {
      vantail(-1, 1.4);
      c.repere({ x: 0.5, y: 0.06, z: 1.4, ry: 0.3, rx: -Math.PI / 2 }, () => {
        c.boite(lv, h, 0.05, COUL.menuiserie, { y: h / 2 - 0.2 }, M.mat, { nuance: 0.05 });
      });
    } else if (etat === "barricade") {
      vantail(-1, 0.02);
      vantail(1, 0.02);
      for (let i = 0; i < 5; i++) c.boite(l + 0.5, 0.2, 0.04, COUL.boisGris, { y: 0.4 + i * 0.55, z: 0.12, rz: (i % 2 ? 1 : -1) * 0.1 }, M.mat, { nuance: 0.08 });
    }
  });
}

const OPT_FEN = () => ({ croisillons: 1, traverses: 3, appui: true, cadre: COUL.menuiserie, matCadre: matieres().tole, couleurAppui: COUL.enduit });

// ---------- Le bâtiment ----------

export function creer({ usure = 0.7, carte } = {}) {
  const id = carte === "pavillons" ? "pavillons" : "front";
  const b = new Batiment(1896, usure);
  const M = matieres();
  // La couche des pavillons et de la chapelle : haut des murs côté caméra, cloisons, étages, toits, clocheton.
  const T = b.couche("pavillons et chapelle", { x: 0, z: -14.7, l: 72.8, p: 17.2 }, CUT, 14);
  // Le toit de la galerie, le toit du passage
  const G = b.couche("galerie", { x: 0, z: -4.2, l: 72.8, p: 3.9 }, 3.2, 4.4);
  const P = b.couche("passage couvert", { x: (PAS.x1 + PAS.x2) / 2, z: (ZG + PIS.z1) / 2, l: PAS.x2 - PAS.x1 + 0.6, p: PIS.z1 - ZG }, 2.8, 3.4);
  const k = { b, c: b.c, T, G, P, M, usure, id, front: id === "front", pav: id === "pavillons", bris: 0.25 + 0.65 * usure, rng: aleatoire(1896 + Math.round(usure * 100)) };
  if (k.front) k.V = b.couche("piscine", { x: (PIS.x1 + PIS.x2) / 2, z: (PIS.z1 + PIS.z2) / 2, l: PIS.x2 - PIS.x1 + 0.6, p: PIS.z2 - PIS.z1 + 0.6 }, CUT, 9);

  terrain(k);
  pavillon(k, PA, "A");
  pavillon(k, PB, "B");
  cloisons(k);
  chapelle(k);
  galerie(k);
  passage(k);
  if (k.pav) {
    dortoir(k);
    reeducation(k);
    refectoire(k);
    cuisine(k);
    infirmerie(k);
    lingerie(k);
    ruelle(k);
  } else {
    entrevues(k);
    piscine(k);
    jardin(k);
    plage(k);
  }

  // Lumières de nuit
  b.lumiere(0, 1.25, -21.7, 0xffb466, 4, 7, "bougie de l'autel");
  b.lumiere(17.4, 1.4, -3.4, 0x8fd8e6, 3, 5, "écran de la borne ThalassoLuxe");
  if (k.pav) {
    b.lumiere(12, 1.0, -11.6, 0xff8a3d, 14, 13, "feu des survivants (réfectoire)");
    b.lumiere(-23.2, 0.9, -12.4, 0xffd27a, 6, 9, "lanterne-tempête (dortoir)");
  } else {
    b.lumiere(12, 1.0, -11.6, 0xff8a3d, 10, 12, "feu des survivants (vu par les fenêtres du réfectoire)");
    b.lumiere(19, 1.4, 3.7, 0x8fd8e6, 3, 5, "bornes d'enregistrement de la piscine");
    b.lumiere(-10.2, -0.6, 25.5, 0xffd27a, 5, 8, "lanterne d'un pêcheur, au pied de l'épi");
  }

  // L'écume respire avec la houle ; la borne clignote doucement
  const anime = new THREE.Object3D();
  anime.userData.animer = (t) => {
    M.ecran.emissiveIntensity = 0.75 + 0.2 * Math.sin(t * 1.7);
  };
  b.ajouter(anime);

  // Recentrer sur le lot de la carte : la géométrie (dans un groupe intérieur), et les données de jeu.
  const o = CENTRES[id];
  const interne = b.construire();
  const groupe = new THREE.Group();
  interne.position.set(-o.x, 0, -o.z);
  groupe.add(interne);
  groupe.userData = interne.userData;
  interne.userData = {};
  for (const t of groupe.userData.toits) {
    t.boite = { ...t.boite, x: t.boite.x - o.x, z: t.boite.z - o.z };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - o.x, z: t.horsDe.z - o.z };
  }
  for (const s of groupe.userData.obstacles) {
    s.x1 = Math.round((s.x1 - o.x) * 100) / 100;
    s.x2 = Math.round((s.x2 - o.x) * 100) / 100;
    s.z1 = Math.round((s.z1 - o.z) * 100) / 100;
    s.z2 = Math.round((s.z2 - o.z) * 100) / 100;
  }
  for (const l of groupe.userData.lumieres) {
    l.x -= o.x;
    l.z -= o.z;
  }
  return groupe;
}

function dansLot(k, x, z, marge = 0) {
  const o = CENTRES[k.id];
  const lot = LOTS[k.id];
  return Math.abs(x - o.x) <= lot.l / 2 + marge && Math.abs(z - o.z) <= lot.p / 2 + marge;
}

// ---------- Le terrain : la dune, le jardin, la plage (un seul maillage colorié triangle par triangle) ----------

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** La dune : crête au nord-ouest, pente douce au vent (ouest), versant d'avalanche à l'est qui a noyé le pavillon. */
function dune(x, z) {
  const xr = -41 + z * 0.1;
  let h = x < xr ? 6 * Math.max(0, 1 - (xr - x) / 10) : 6 * Math.pow(Math.max(0, 1 - (x - xr) / 16), 1.3);
  h *= clamp01((24 - z) / 12) * clamp01((z + 34) / 8);
  if (h > 0.3) h += 0.1 * Math.sin(x * 1.1 + z * 0.5);
  return Math.max(0, h);
}

function hauteur(x, z) {
  if (z < Z_DIGUE) return dune(x, z);
  return Y_PLAGE - (z - Z_DIGUE) * 0.04 + dune(x, z) * 0.9;
}

function dansBassin(x, z) {
  return x >= BAS.x1 - 1e-6 && x <= BAS.x2 + 1e-6 && z >= BAS.z1 - 1e-6 && z <= BAS.z2 + 1e-6;
}

function terrain(k) {
  const { c, M } = k;
  const o = CENTRES[k.id];
  const lot = LOTS[k.id];
  const x0 = o.x - lot.l / 2;
  const z0 = o.z - lot.p / 2;
  const pas = 2;
  const nx = Math.round(lot.l / pas);
  const nz = Math.round(lot.p / pas);
  const pos = [];
  const teintes = [];
  const rng = aleatoire(404);
  const bruit = (x, z) => Math.sin(x * 0.37 + 1.3) * Math.cos(z * 0.41) + 0.6 * Math.sin(x * 0.13 + z * 0.21);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const xa = x0 + i * pas;
      const za = z0 + j * pas;
      if (k.front && dansBassin(xa, za) && dansBassin(xa + pas, za + pas)) continue;
      const plage = za >= Z_DIGUE - 1e-6;
      const h = (x, z) => (plage ? hauteur(x, z) : dune(x, z));
      // un léger jeu sur les sommets du sable, pour les facettes (pas sur les bords du lot)
      const p = (x, z) => [x, h(x, z), z];
      const A = p(xa, za);
      const B = p(xa + pas, za);
      const C = p(xa + pas, za + pas);
      const D = p(xa, za + pas);
      for (const t of [[A, D, B], [B, D, C]]) {
        pos.push(...t[0], ...t[1], ...t[2]);
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
        const cz = (t[0][2] + t[1][2] + t[2][2]) / 3;
        const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
        const r = rng();
        let teinte;
        if (plage) {
          // la pente est très douce : on colore selon la distance à la digue (sable sec, laisse de mer, sable mouillé)
          if (cy < Y_MER - 0.05) teinte = 0x9c9479;
          else if (cz > 25.6 + r * 0.8) teinte = r < 0.5 ? COUL.sableHumide : 0xa6956f;
          else if (cz > 23.4 && cz < 25.2 && r < 0.3) teinte = r < 0.15 ? 0x8a805f : 0xa49770; // la laisse de mer
          else teinte = r < 0.5 ? COUL.sableSec : COUL.sable;
        } else if (cy > 0.12) teinte = r < 0.15 ? 0xcdbd95 : r < 0.5 ? COUL.sableSec : COUL.sable;
        else {
          const n = bruit(cx, cz);
          teinte = n > 0.35 ? (r < 0.5 ? COUL.herbe : 0x8f9a5f) : n > -0.1 ? (r < 0.5 ? 0xb9b48a : 0xa9a77a) : r < 0.5 ? COUL.sable : 0xcfc09a;
        }
        teintes.push(teinte);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, M.sable, 0xffffff, {}, { crasse: false, nuance: 0 });
  g.dispose();
  const lotGeo = c.lots.get(M.sable);
  const geo = lotGeo[lotGeo.length - 1];
  const col = geo.attributes.color.array;
  const coul = new THREE.Color();
  teintes.forEach((t, n) => {
    coul.setHex(t).offsetHSL(0, 0, (rng() - 0.5) * 0.03);
    for (let q = 0; q < 3; q++) col.set([coul.r, coul.g, coul.b], (n * 3 + q) * 3);
  });
  // Les tranches du lot : on ferme les bords (sable et plage) jusqu'à −3
  const tr = [];
  const bord = (xa, za, xb, zb) => {
    const ya = hauteur(xa, za);
    const yb = hauteur(xb, zb);
    tr.push(xa, ya, za, xa, -3, za, xb, yb, zb, xb, yb, zb, xa, -3, za, xb, -3, zb);
  };
  const x1 = x0 + lot.l;
  const z1 = z0 + lot.p;
  for (let i = 0; i < nx; i++) {
    bord(x0 + (i + 1) * pas, z1 - 0.001, x0 + i * pas, z1 - 0.001);
    bord(x0 + i * pas, z0, x0 + (i + 1) * pas, z0);
  }
  // la marche entre le plateau et la plage, là où la digue ne la cache pas (sous la dune)
  if (z1 > Z_DIGUE) {
    for (let i = 0; i < nx; i++) {
      const xa = x0 + i * pas;
      const xb = xa + pas;
      const ha = dune(xa, Z_DIGUE);
      const hb = dune(xb, Z_DIGUE);
      tr.push(xa, ha, Z_DIGUE, xa, hauteur(xa, Z_DIGUE), Z_DIGUE, xb, hb, Z_DIGUE, xb, hb, Z_DIGUE, xa, hauteur(xa, Z_DIGUE), Z_DIGUE, xb, hauteur(xb, Z_DIGUE), Z_DIGUE);
    }
  }
  for (let j = 0; j < nz; j++) {
    bord(x0, z0 + (j + 1) * pas, x0, z0 + j * pas);
    bord(x1, z0 + j * pas, x1, z0 + (j + 1) * pas);
  }
  const gt = new THREE.BufferGeometry();
  gt.setAttribute("position", new THREE.Float32BufferAttribute(tr, 3));
  gt.computeVertexNormals();
  c.poser(gt, M.mat, 0x8f8268, {}, { crasse: false, nuance: 0 });
  gt.dispose();

  // Les oyats sur la dune, couchés vers l'est
  const nOyats = k.front ? 150 : 60;
  for (let i = 0; i < nOyats * 3 && i < 900; i++) {
    const x = x0 + rng() * lot.l;
    const z = z0 + rng() * lot.p;
    const h = hauteur(x, z);
    if (z > Z_DIGUE - 0.5 && z < Z_DIGUE + 2) continue;
    if (h < 0.25 || (x > PA.x1 - 0.5 && x < PA.x2 && z > ZN - 0.5 && z < ZS + 0.5)) continue;
    if (rng() < 0.6) oyats(c, x, z, h, 0.8 + rng() * 0.6);
  }
  // Le sable soufflé sur le jardin : quelques langues de sable au pied des murs et dans les allées
  if (k.front) {
    for (const [x, z, rx, rz, h] of [[-30, -1, 3.5, 1.6, 0.35], [-24, 4, 2.6, 1.4, 0.25], [-8, 14, 2, 1, 0.18], [8, 16.6, 2.4, 0.8, 0.2]]) congere(c, x, z, rx, rz, h, 0, 0.3);
  }
  // Sur la plage seulement : la mer et son écume
  if (k.front) mer(k, x0, x1, z1);
}

// ---------- Les pavillons ----------

function pavillon(k, P, nom) {
  const { c, T, M, usure } = k;
  const A = nom === "A";
  const brique = { couleur: COUL.brique, mat: M.brique, ep: EP };
  const peint = [COUL.interieurBas, COUL.interieur];
  const L = P.x2 - P.x1;
  const n = 10;
  const pas = L / n;
  const xc = (P.x1 + P.x2) / 2;
  const zc = (ZN + ZS) / 2;
  const prof = ZS - ZN;
  // Les travées de la façade sud : portes-fenêtres sur la galerie, fenêtres, trumeaux pleins (fresques)
  const portes = A ? { 3: "ouverts", 5: "entrouverts", 7: "ouverts", 9: "tombe" } : { 1: "ouverts", 3: "tombe", 5: "barricade", 8: "ouverts" };
  const pleins = A ? [4] : [2];
  const ensablees = A ? [0, 1] : [];
  const rdcS = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * pas;
    if (pleins.includes(i)) continue;
    if (portes[i]) rdcS.push({ u, l: 1.5, bas: 0, haut: 3.2, type: "vide", ferme: portes[i] === "barricade" });
    else rdcS.push({ u, l: 1.5, bas: 0.95, haut: 3.2, type: "fenetre", ...OPT_FEN(), bris: ensablees.includes(i) ? 1 : k.bris, rideau: i % 3 === 0 ? 0xd9d5c6 : undefined });
  }
  const aS = [P.x1, ZS];
  const bS = [P.x2, ZS];
  murCoupe(k, aS, bS, { ...brique, h: RDC, ouvertures: rdcS, peint });
  for (const [i, etat] of Object.entries(portes)) battants(c, P.x1 + (Number(i) + 0.5) * pas, ZS + EP / 2, 0, 1.5, 3.2, etat);
  // Le nord : des fenêtres hautes ; la porte de service de la cuisine
  const rdcN = [];
  for (let i = 0; i < n; i++) {
    const x = P.x1 + (i + 0.5) * pas;
    const u = P.x2 - x;
    if (!A && i === 6) rdcN.push({ u, l: 1.2, bas: 0, haut: 2.4, type: "vide" });
    else rdcN.push({ u, l: 1.3, bas: 1.3, haut: 3.2, type: "fenetre", ...OPT_FEN(), traverses: 2, bris: A && i < 2 ? 1 : k.bris });
  }
  const aN = [P.x2, ZN];
  const bN = [P.x1, ZN];
  murCoupe(k, aN, bN, { ...brique, h: RDC, cut: 0, ouvertures: rdcN, peint });
  // Les pignons : ouest (opposé à la caméra : entier) et est (coupé)
  const gO = [{ u: 2.6, l: 1.4, bas: 1.3, haut: 3.2, type: "fenetre", ...OPT_FEN(), bris: A ? 1 : k.bris }, { u: 8.4, l: 1.4, bas: 1.3, haut: 3.2, type: "fenetre", ...OPT_FEN(), bris: A ? 1 : k.bris }];
  const gE = A ? [{ u: 2.6, l: 1.4, bas: 0.95, haut: 3.2, type: "fenetre", ...OPT_FEN(), bris: k.bris }, { u: 5.5, l: 1.3, bas: 0, haut: 2.5, type: "vide" }, { u: 8.4, l: 1.4, bas: 0.95, haut: 3.2, type: "fenetre", ...OPT_FEN(), bris: k.bris }]
    : [{ u: 2.6, l: 1.4, bas: 0.95, haut: 3.2, type: "fenetre", ...OPT_FEN(), bris: k.bris }, { u: 8.4, l: 1.4, bas: 0.95, haut: 3.2, type: "fenetre", ...OPT_FEN(), bris: k.bris }];
  murCoupe(k, [P.x1, ZN], [P.x1, ZS], { ...brique, h: RDC, cut: 0, ouvertures: gO, peint, breches: [] });
  murCoupe(k, [P.x2, ZS], [P.x2, ZN], { ...brique, h: RDC, ouvertures: gE, peint, breches: !A && usure > 0.5 ? [{ u: 5.5, l: 2.5, profondeur: 1.2 * usure }] : [] });
  if (A) battants(c, P.x2 + EP / 2, ZS - 5.5, -Math.PI / 2, 1.3, 2.5, "ouverts");

  // Les sols intérieurs (carreaux de ciment)
  c.pave(P.x1 + 0.2, 0, ZN + 0.2, P.x2 - 0.2, 0.05, ZS - 0.2, COUL.ciment, M.ciment, { crasse: false, nuance: 0 });

  // L'étage (couche) : murs à fenêtres, persiennes, la dalle
  T.pave(P.x1, RDC - 0.25, ZN, P.x2, RDC, ZS, COUL.plafond, M.enduit, { crasse: false, nuance: 0 });
  const etS = [];
  const etN = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * pas;
    const volet = i % 3 === 1 ? (i === 7 ? "pendu" : "ouvert") : undefined;
    etS.push({ u, l: 1.3, bas: 0.8, haut: 2.6, type: "fenetre", ...OPT_FEN(), traverses: 2, bris: k.bris, volet, couleurVolet: COUL.menuiserie });
    etN.push({ u: L - u, l: 1.3, bas: 0.8, haut: 2.6, type: "fenetre", ...OPT_FEN(), croisillons: 0, traverses: 2, bris: k.bris });
  }
  const hE = ETG - RDC;
  mur(T, aS, bS, { ...brique, y0: RDC, h: hE, ouvertures: etS });
  mur(T, aN, bN, { ...brique, y0: RDC, h: hE, ouvertures: etN });
  mur(T, [P.x1, ZN], [P.x1, ZS], { ...brique, y0: RDC, h: hE, ouvertures: [{ u: 5.5, l: 1.3, bas: 0.8, haut: 2.6, type: "fenetre", ...OPT_FEN(), traverses: 2, bris: k.bris }] });
  mur(T, [P.x2, ZS], [P.x2, ZN], { ...brique, y0: RDC, h: hE, ouvertures: [{ u: 5.5, l: 1.3, bas: 0.8, haut: 2.6, type: "fenetre", ...OPT_FEN(), traverses: 2, bris: k.bris }] });
  // L'intérieur de l'étage, sombre, vu par les fenêtres
  T.pave(P.x1 + 0.3, RDC, zc - 0.1, P.x2 - 0.3, ETG - 0.3, zc + 0.1, 0x8f948a, M.enduit, { nuance: 0.06 });

  // Bandeaux d'enduit, chaînages d'angle, linteaux
  const enduit = { couleur: COUL.enduit, mat: M.enduit };
  const trousS = rdcS.filter((o) => o.bas < 0.5).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
  bandes(aS, bS, EP, [
    { y1: 0, y2: 0.55, s: 0.05, couleur: COUL.enduitGris, mat: M.enduit, ch: c, trous: trousS },
    { y1: RDC - 0.15, y2: RDC + 0.2, s: 0.08, ...enduit, ch: T },
    { y1: ETG - 0.3, y2: ETG, s: 0.08, ...enduit, ch: T },
    { y1: ETG, y2: ETG + 0.22, s: 0.32, ...enduit, ch: T },
  ]);
  for (const [a, bb, ch] of [[aN, bN, c], [[P.x1, ZN], [P.x1, ZS], c], [[P.x2, ZS], [P.x2, ZN], c]]) {
    bandes(a, bb, EP, [
      { y1: 0, y2: 0.55, s: 0.05, couleur: COUL.enduitGris, mat: M.enduit, ch, trous: a === aN && !A ? [[P.x2 - (P.x1 + 6.5 * pas) - 0.6, P.x2 - (P.x1 + 6.5 * pas) + 0.6]] : a[0] === P.x2 && a[1] === ZS && A ? [[4.85, 6.15]] : [] },
      { y1: RDC - 0.15, y2: RDC + 0.2, s: 0.08, ...enduit, ch: T },
      { y1: ETG - 0.3, y2: ETG, s: 0.08, ...enduit, ch: T },
      { y1: ETG, y2: ETG + 0.22, s: 0.32, ...enduit, ch: T },
    ]);
  }
  // Chaînages d'angle en enduit (harpes) : bas toujours visible, haut dans la couche
  for (const [x, z] of [[P.x1, ZS], [P.x2, ZS], [P.x1, ZN], [P.x2, ZN]]) {
    const sx = x === P.x1 ? 1 : -1;
    const sz = z === ZS ? -1 : 1;
    for (let y = 0.6; y < ETG; y += 0.9) {
      const ch = y + 0.3 <= CUT || (x === P.x1 && z === ZN) ? c : T;
      const large = Math.round(y / 0.9) % 2 === 0 ? 0.6 : 0.4;
      ch.pave(x - sx * 0.04, y, z - sz * 0.04, x + sx * large, y + 0.3, z + sz * 0.04, COUL.enduit, M.enduit, { nuance: 0.02, crasse: false });
      ch.pave(x - sx * 0.04, y, z - sz * 0.04, x + sx * 0.04, y + 0.3, z + sz * large, COUL.enduit, M.enduit, { nuance: 0.02, crasse: false });
    }
  }
  // Linteaux d'enduit au-dessus des baies (façades sud et est, nord)
  for (let i = 0; i < n; i++) {
    const x = P.x1 + (i + 0.5) * pas;
    if (!pleins.includes(i)) T.pave(x - 0.95, 3.2, ZS + 0.15, x + 0.95, 3.5, ZS + 0.26, COUL.enduit, M.enduit, { nuance: 0.02, crasse: false });
    T.pave(x - 0.85, RDC + 2.6, ZS + 0.15, x + 0.85, RDC + 2.88, ZS + 0.26, COUL.enduit, M.enduit, { nuance: 0.02, crasse: false });
    T.pave(x - 0.85, 3.2, ZN - 0.26, x + 0.85, 3.45, ZN - 0.15, COUL.enduit, M.enduit, { nuance: 0.02, crasse: false });
  }

  // Le toit de tuiles : percé au-dessus du dortoir (A) et du réfectoire (B), chevrons à nu
  const trous = A ? [{ u: -3, v: 1, l: 2.4, p: 0.6 }, { u: 9, v: -1, l: 1.8, p: 0.45 }] : [{ u: -8, v: 1, l: 3.2, p: 0.75 }, { u: 6, v: 1, l: 1.2, p: 0.35 }];
  toitDeuxPans(T, xc, zc, L, prof, ETG + 0.22, HF, { couleur: COUL.tuile, mat: M.tuiles, debord: 0.45, trous: usure > 0.3 ? trous : trous.slice(0, 1), charpente: COUL.boisSombre });
  for (const x of [P.x1, P.x2]) T.poser(geoTriangle(prof, HF, EP), M.brique, COUL.brique, { x, y: ETG + 0.22, z: zc, ry: Math.PI / 2 }, { nuance: 0.02, crasse: false });
  // Un œil-de-bœuf d'enduit dans chaque pignon
  for (const x of [P.x1, P.x2]) {
    T.poser(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12), M.enduit, COUL.enduit, { x: x + (x === P.x2 ? 0.21 : -0.21), y: ETG + 1.3, z: zc, rz: Math.PI / 2 }, { crasse: false });
    T.poser(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 12), M.verre, 0xffffff, { x: x + (x === P.x2 ? 0.23 : -0.23), y: ETG + 1.3, z: zc, rz: Math.PI / 2 }, { crasse: false });
  }
  // Souches de cheminée en brique, chapeau d'enduit
  for (const f of [0.22, 0.62]) {
    const x = P.x1 + L * f;
    T.pave(x - 0.45, ETG + 1.5, zc - 1.3, x + 0.45, ETG + HF + 1.1, zc - 0.7, COUL.brique, M.brique, { crasse: false });
    T.pave(x - 0.55, ETG + HF + 1.1, zc - 1.4, x + 0.55, ETG + HF + 1.25, zc - 0.6, COUL.enduit, M.enduit, { crasse: false });
  }
  mousse(T, xc - L * 0.25, ETG + 1.4, zc + 2.2, 1.6, Math.round(2 + 5 * usure), 0xc9b85a);
  mousse(T, xc + L * 0.2, ETG + 1.6, zc - 2.4, 1.4, Math.round(2 + 4 * usure), 0xc9b85a);
  // Descentes d'eau
  descente(c, aN, bN, EP, 0.3, ETG - 0.1);
  descente(c, aN, bN, EP, L - 0.3, ETG - 0.1, !A);
  if (!A) descente(c, [P.x2, ZS], [P.x2, ZN], EP, 0.3, ETG - 0.1, usure > 0.6);

  // Le sable : la dune a noyé le bout ouest du pavillon des Enfants ; il entre partout ailleurs par les portes
  if (A) {
    k.b.obstacle(-31, ZN + 0.3, -31, ZS - 0.3, "sable (versant de la dune entré dans le dortoir)");
  } else {
    congere(c, P.x1 + 1.5 * pas, ZS - 0.8, 1.2, 0.7, 0.18);
  }
}

/** Les cloisons intérieures (coupées à 1,25 m : le haut dans la couche). */
function cloisons(k) {
  const cl = { ep: EPI, mat: k.M.enduit, cut: CUTI, cloison: true };
  murCoupe(k, [XA, ZS], [XA, ZN], { ...cl, h: RDC, ouvertures: [{ u: 2.2, l: 1.4, bas: 0, haut: 2.6, type: "vide" }] });
  murCoupe(k, [XB1, ZS], [XB1, ZN], { ...cl, h: RDC, ouvertures: [{ u: 2.0, l: 1.4, bas: 0, haut: 2.6, type: "vide" }, { u: 7.5, l: 2.2, bas: 1.0, haut: 1.9, type: "vide" }] });
  murCoupe(k, [XB2, ZS], [XB2, ZN], { ...cl, h: RDC, ouvertures: [{ u: 8.6, l: 1.2, bas: 0, haut: 2.4, type: "vide" }], breches: k.usure > 0.6 ? [{ u: 3, l: 2, profondeur: 1.5 }] : [] });
  murCoupe(k, [XB2, ZB], [PB.x2, ZB], { ...cl, h: RDC, ouvertures: [{ u: 6.2, l: 1.2, bas: 0, haut: 2.4, type: "vide" }] });
}

// ---------- La chapelle ----------

function chapelle(k) {
  const { c, T, M, usure } = k;
  const enduit = { couleur: COUL.enduitChapelle, mat: M.enduit, ep: 0.5 };
  const { x1, x2, z1, z2, h } = CH;
  const vitraux = (n0) => [0, 1, 2].map((i) => ({ u: n0 + i * 4.2, l: 1.0, bas: 2.0, haut: 4.6, type: "vide" }));
  // Façade sud (portail), coupée ; côté est coupé ; nord et ouest entiers
  murCoupe(k, [x1, z2], [x2, z2], { ...enduit, h, ouvertures: [{ u: 3.5, l: 1.8, bas: 0, haut: 3.3, type: "vide" }] });
  murCoupe(k, [x2, z2], [x2, z1], { ...enduit, h, ouvertures: vitraux(3.0) });
  murCoupe(k, [x2, z1], [x1, z1], { ...enduit, h, cut: 0, ouvertures: [{ u: 3.5, l: 1.0, bas: 2.4, haut: 4.8, type: "vide" }] });
  murCoupe(k, [x1, z1], [x1, z2], { ...enduit, h, cut: 0, ouvertures: vitraux(3.0) });
  // Les vitraux (plaques de l'atlas dans les baies, à double face)
  for (let i = 0; i < 3; i++) {
    const z = z2 - (3.0 + i * 4.2);
    panneau(T, M.enseignes, R.vitrail, { x: x2, y: 3.3, z, ry: Math.PI / 2 }, 1.0, 2.6);
    panneau(c, M.enseignes, R.vitrail, { x: x1, y: 3.3, z: z1 + 3.0 + i * 4.2, ry: -Math.PI / 2 }, 1.0, 2.6);
  }
  panneau(c, M.enseignes, R.vitrail, { x: 0, y: 3.6, z: z1, ry: Math.PI }, 1.0, 2.6);
  // Chaînages de brique aux angles, soubassement, corniche
  for (const [x, z] of [[x1, z1], [x2, z1], [x1, z2], [x2, z2]]) {
    const sx = x === x1 ? 1 : -1;
    const sz = z === z2 ? -1 : 1;
    const ch = (z === z2 || x === x2) ? T : c;
    ch.pave(x - sx * 0.05, ch === T ? CUT : 0, z - sz * 0.05, x + sx * 0.55, h, z + sz * 0.05, COUL.brique, M.brique, { nuance: 0.03 });
    ch.pave(x - sx * 0.05, ch === T ? CUT : 0, z - sz * 0.05, x + sx * 0.05, h, z + sz * 0.55, COUL.brique, M.brique, { nuance: 0.03 });
    if (ch === T) {
      c.pave(x - sx * 0.05, 0, z - sz * 0.05, x + sx * 0.55, CUT, z + sz * 0.05, COUL.brique, M.brique, { nuance: 0.03 });
      c.pave(x - sx * 0.05, 0, z - sz * 0.05, x + sx * 0.05, CUT, z + sz * 0.55, COUL.brique, M.brique, { nuance: 0.03 });
    }
  }
  bandes([x1, z2], [x2, z2], 0.5, [{ y1: 0, y2: 0.5, s: 0.05, couleur: COUL.brique, mat: M.brique, ch: c, trous: [[2.6, 4.4]] }]);
  bandes([x2, z2], [x2, z1], 0.5, [{ y1: 0, y2: 0.5, s: 0.05, couleur: COUL.brique, mat: M.brique, ch: c }, { y1: h - 0.25, y2: h, s: 0.2, couleur: COUL.enduit, mat: M.enduit, ch: T }]);
  bandes([x1, z1], [x1, z2], 0.5, [{ y1: 0, y2: 0.5, s: 0.05, couleur: COUL.brique, mat: M.brique, ch: c }, { y1: h - 0.25, y2: h, s: 0.2, couleur: COUL.enduit, mat: M.enduit, ch: T }]);
  // Arc de brique au-dessus du portail, oculus
  T.pave(-1.25, 3.3, z2 + 0.2, 1.25, 3.75, z2 + 0.34, COUL.brique, M.brique, { crasse: false });
  T.poser(new THREE.CylinderGeometry(0.85, 0.85, 0.14, 14), M.brique, COUL.brique, { x: 0, y: 4.85, z: z2 + 0.27, rx: Math.PI / 2 }, { crasse: false });
  panneau(T, M.enseignes, R.oculus, { x: 0, y: 4.85, z: z2 + 0.36 }, 1.3, 1.3);
  // Pignons, toit
  const lg = z2 - z1;
  for (const z of [z1, z2]) T.poser(geoTriangle(x2 - x1 + 0.5, 3.5, 0.5), M.enduit, COUL.enduitChapelle, { x: 0, y: h, z }, { nuance: 0.02, crasse: false });
  T.pave(-0.35, h + 2.6, z2 + 0.2, 0.35, h + 3.05, z2 + 0.35, COUL.brique, M.brique, { crasse: false });
  toitDeuxPans(T, 0, (z1 + z2) / 2, lg, x2 - x1, h, 3.5, { couleur: COUL.tuileSombre, mat: M.tuiles, debord: 0.4, ry: Math.PI / 2, trous: usure > 0.5 ? [{ u: 2.5, v: 1, l: 1.6, p: 0.5 }] : [] });
  // Le clocheton, à cheval sur le faîtage côté portail : souche d'enduit, beffroi ajouré, flèche de zinc, cloche
  const yb = h + 3.9;
  const zb = z2 - 0.9;
  T.pave(-0.75, h + 2.6, zb - 0.75, 0.75, yb + 0.3, zb + 0.75, COUL.enduit, M.enduit, { crasse: false });
  for (const [px, pz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) T.pave(px - 0.1, yb + 0.3, zb + pz - 0.1, px + 0.1, yb + 1.9, zb + pz + 0.1, COUL.boisGris, M.mat, { crasse: false });
  T.pave(-0.85, yb + 1.9, zb - 0.85, 0.85, yb + 2.05, zb + 0.85, COUL.zinc, M.tole, { crasse: false });
  T.poser(new THREE.ConeGeometry(1.05, 2.4, 4).rotateY(Math.PI / 4), M.tole, 0x7f8c8a, { x: 0, y: yb + 3.25, z: zb }, { crasse: false });
  T.tube([0, yb + 4.4, zb], [0, yb + 5.3, zb], 0.03, 0x3a3d3c, M.tole, 4);
  T.boite(0.4, 0.04, 0.04, 0x3a3d3c, { y: yb + 5.0, z: zb }, M.tole);
  T.poser(new THREE.CylinderGeometry(0.18, 0.34, 0.55, 8), M.tole, 0x7a6a3a, { x: 0, y: yb + 1.2, z: zb }, { crasse: false });
  T.boite(0.9, 0.06, 0.06, COUL.boisSombre, { y: yb + 1.55, z: zb }, M.mat);
  // Le sol, le portail
  c.pave(x1 + 0.25, 0, z1 + 0.25, x2 - 0.25, 0.05, z2 - 0.25, 0xcfc5b0, M.ciment, { crasse: false, nuance: 0 });
  c.pave(-1.6, 0, z2, 1.6, 0.12, z2 + 1.0, COUL.beton, M.mat, { nuance: 0.02 });
  battants(c, 0, z2 + 0.25, 0, 1.8, 3.3, "entrouverts");
  // Le parvis entre les pavillons : dallage, sable
  c.pave(-4.8, 0, z2 + 0.2, 4.8, 0.04, ZS, 0xc8bfa8, M.ciment, { crasse: false, nuance: 0 });
  congere(c, 0, z2 - 1.0, 1.4, 0.9, 0.16);
  // L'intérieur : petits bancs, autel, statue, ex-voto, cierges
  for (let r = 0; r < 6; r++) {
    for (const s of [-1, 1]) {
      const tombe = (r === 2 && s === 1) || (r === 4 && s === -1 && usure > 0.5);
      bancEnfants(c, s * 1.55, z2 - 2.6 - r * 1.35, 2.1, 0, tombe);
    }
  }
  c.pave(-2.5, 0.05, z1 + 0.3, 2.5, 0.3, z1 + 2.6, 0xd8cfba, M.ciment, { nuance: 0.02 });
  c.pave(-1.1, 0.3, z1 + 0.9, 1.1, 1.15, z1 + 1.7, 0xe6e0d0, M.lisse, { nuance: 0.02 });
  c.pave(-1.2, 1.15, z1 + 0.85, 1.2, 1.19, z1 + 1.75, 0xece6d6, M.toile, { crasse: false });
  c.boite(0.45, 0.9, 0.02, 0xece6d6, { x: 0.6, y: 0.75, z: z1 + 1.76 }, M.toile, { crasse: false });
  cierges(c, -0.1, 1.19, z1 + 1.2, 5);
  lanterne(c, 0.65, 1.19, z1 + 1.3);
  statue(c, 2.6, 0.3, z1 + 1.2, -0.4);
  c.pave(2.3, 0, z1 + 0.6, 2.9, 0.3, z1 + 1.8, 0xd8cfba, M.ciment);
  exVoto(c, 0, 4.3, -15.5, 0.2);
  // Le tronc des offrandes, un prie-Dieu renversé, les bouquets séchés
  c.pave(-3.0, 0, z2 - 1.4, -2.6, 1.0, z2 - 1.0, 0x5c4936, M.mat);
  for (let i = 0; i < 3; i++) c.boite(0.06, 0.4, 0.06, 0x9a8a5a, { x: -2 + i * 0.12, y: 1.4, z: z1 + 1.1, rz: (i - 1) * 0.3 }, M.mat, { crasse: false });
  congere(c, 0, z2 - 0.8, 1.2, 1.4, 0.22);
  jonchee(c, x1 + 0.4, z1 + 3, x2 - 0.4, z2 - 0.5, Math.round(40 * usure), [0xb5a888, 0x9c8a66, 0xd8cdb0], 0.06);
  if (usure > 0.4) raiDeLumiere(c, [1.2, h + 1.2, -10], [0.6, 0.06, -11.2], 1.4);
}

// ---------- La galerie face à la mer ----------

function galerie(k) {
  const { c, G, T, M, usure } = k;
  // Le sol de carreaux de ciment, la marelle à la craie
  c.pave(-36, 0, ZS, 36, 0.06, ZG, COUL.ciment, M.ciment, { crasse: false, nuance: 0 });
  c.pave(-36, 0, ZG, 36, 0.1, ZG + 0.3, COUL.beton, M.mat, { nuance: 0.02 });
  panneau(c, M.enseignes, R.marelle, { x: -2, y: 0.07, z: -4.2, rx: -Math.PI / 2, rz: 0.1 }, 2.4, 2.4);
  // Les colonnes de fonte, leurs consoles ; la sablière et le chéneau (couche)
  for (let i = 0; i <= 24; i++) {
    const x = -36 + i * 3;
    const z = ZG + 0.15;
    if (k.front && i === 17 && usure > 0.55) {
      // une colonne arrachée par une tempête, couchée dans le jardin
      cylindre(c, M.tole, COUL.fonte, x + 1.4, 0.12, z + 1.6, 0.08, 3.2, 8, { rz: Math.PI / 2, ry: -0.5 });
      continue;
    }
    c.pave(x - 0.16, 0, z - 0.16, x + 0.16, 0.35, z + 0.16, COUL.fonte, M.tole, { nuance: 0.02 });
    cylindre(c, M.tole, COUL.fonte, x, 1.85, z, 0.075, 3.0, 8);
    c.pave(x - 0.14, 3.3, z - 0.14, x + 0.14, 3.42, z + 0.14, COUL.fonte, M.tole);
    G.poutre([x, 3.42, z], [x, 3.75, z - 0.6], 0.05, COUL.fonte, M.tole);
  }
  // Devant la chapelle, la galerie n'est adossée à rien : une seconde rangée de colonnes la porte
  for (const x of [-2.4, 2.4]) {
    cylindre(c, M.tole, COUL.fonte, x, 2.0, ZS + 0.2, 0.075, 4.0, 8);
  }
  G.pave(-5, 3.95, ZS + 0.05, 5, 4.1, ZS + 0.3, COUL.bois, M.mat);
  G.pave(-36.2, 3.3, ZG - 0.05, 36.2, 3.45, ZG + 0.3, COUL.bois, M.mat, { crasse: false });
  // Le toit en appentis de tuiles, lé par lé (des lés manquent : chevrons à nu)
  const run = ZG + 0.45 - ZS;
  const drop = 0.75;
  const ang = Math.atan2(drop, run);
  const rampant = Math.hypot(run, drop);
  for (let i = 0; i < 24; i++) {
    const x = -36 + i * 3 + 1.5;
    const troue = (i === 5 && usure > 0.3) || (i === 14 && usure > 0.6) || (i === 20 && usure > 0.8);
    if (troue) {
      for (let u = -1.2; u <= 1.2; u += 0.6) G.poutre([x + u, 4.12, ZS], [x + u, 3.45, ZG + 0.3], 0.08, COUL.boisSombre, M.mat);
      G.pave(x - 1.5, 4.0, ZS - 0.05, x + 1.5, 4.15, ZS + 0.4, COUL.tuile, M.tuiles, { crasse: false });
      // les tuiles tombées sur le carrelage
      debris(c, x - 1.4, -5.2, x + 1.4, -3.0, 18, [COUL.tuile, COUL.tuileSombre, 0xc98a6a], 0.06);
      raiDeLumiere(c, [x, 4.1, -4.4], [x + 0.9, 0.07, -3.6], 1.8);
      continue;
    }
    G.boite(3.02, 0.08, rampant, COUL.tuile, { x, y: 4.15 - drop / 2, z: (ZS + ZG + 0.45) / 2, rx: ang }, M.tuiles, { crasse: false, nuance: 0.03 });
  }
  // Le chéneau de zinc et les lambrequins (dentelle de bois, atlas)
  G.tube([-36.2, 3.36, ZG + 0.42], [36.2, 3.36, ZG + 0.42], 0.07, COUL.zinc, M.tole, 6);
  for (let i = 0; i < 48; i++) {
    const x = -36 + (i + 0.5) * 1.5;
    if (k.rng() < 0.08 * usure) continue;
    panneau(G, M.enseignes, R.lambrequin, { x, y: 3.1, z: ZG + 0.32 }, 1.5, 0.38);
  }
  // Le nom du sanatorium, sur l'attique de la galerie, dans l'axe de la chapelle
  G.pave(-4.4, 3.42, ZG + 0.12, 4.4, 4.5, ZG + 0.3, COUL.enduit, M.enduit, { crasse: false });
  G.pave(-4.6, 4.5, ZG + 0.05, 4.6, 4.62, ZG + 0.38, COUL.enduit, M.enduit, { crasse: false });
  panneau(G, M.enseignes, R.titre, { x: 0, y: 3.95, z: ZG + 0.31 }, 8.4, 1.05);

  // Les fresques sur les trumeaux pleins de la galerie, et les panneaux ThalassoLuxe collés par-dessus (couche)
  const xA = PA.x1 + 4.5 * 3.1;
  const xB = PB.x1 + 2.5 * 3.1;
  panneau(T, M.enseignes, R.baleine, { x: xA, y: 1.95, z: ZS + 0.22 }, 2.8, 1.4);
  panneau(T, M.enseignes, R.thalasso, { x: xA + 0.2, y: 2.45, z: ZS + 0.24, rz: -0.03 }, 2.6, 0.49);
  panneau(T, M.enseignes, R.bateau, { x: xB, y: 1.95, z: ZS + 0.22 }, 2.8, 1.4);
  panneau(T, M.enseignes, R.vr, { x: xB + 0.75, y: 1.8, z: ZS + 0.24, rz: 0.02 }, 0.8, 1.2);
  panneau(T, M.enseignes, R.coquillages, { x: xA, y: 1.1, z: ZS + 0.23 }, 2.6, 0.5);
  // Plaques émaillées au-dessus des portes
  panneau(T, M.enseignes, R.refectoire, { x: PB.x1 + 1.5 * 3.1, y: 3.62, z: ZS + 0.28 }, 1.2, 0.3);
  panneau(T, M.enseignes, R.lingerie, { x: PB.x1 + 8.5 * 3.1, y: 3.62, z: ZS + 0.28 }, 1.2, 0.3);
  panneau(T, M.enseignes, R.gym, { x: PA.x1 + 7.5 * 3.1, y: 3.62, z: ZS + 0.28 }, 1.6, 0.3);
  panneau(T, M.enseignes, R.graffiti, { x: PA.x2 + 0.21, y: 1.6, z: ZS - 2.6, ry: Math.PI / 2 }, 2.4, 0.6);
  // La borne d'enregistrement ThalassoLuxe, devant le passage
  borne(c, 17.4, -3.2, 0);

  // Les lits roulants, tournés vers la mer ; certains portent encore un casque de « réalité virtuelle »
  const lits = [
    [-33.2, -4.3, 0.04, {}], [-29.6, -4.2, -0.05, { casque: true }], [-25.4, -4.25, 0, {}], [-21.4, -4.3, 0.1, { casque: true }],
    [-13.6, -4.3, -0.08, {}], [-9.4, -4.2, 0.02, { casque: true }], [8.6, -4.25, 0.05, { casque: true }], [12.4, -4.3, -0.03, {}],
    [23.4, -4.3, 0.06, { casque: true }], [30.6, -4.2, -0.1, {}],
  ];
  for (const [x, z, ry, o] of lits) {
    const ens = dune(x, z);
    if (ens < 0.7) litRoulant(c, x, z, ry, { ...o, ensable: ens * 0.8 });
  }
  // un lit renversé, roues en l'air
  c.repere({ x: 26.8, y: 1.05, z: -4.1, rz: Math.PI }, () => litRoulant(c, 0, 0, 0.3, { couverture: false }));
  // Le sable entré sous la galerie, des feuilles, une couverture tombée
  congere(c, -34.6, -4.3, 1.8, 1.6, 0.5);
  congere(c, -30.8, -3.4, 1.4, 1.0, 0.22);
  congere(c, 20, -3, 1.6, 0.6, 0.12);
  jonchee(c, -35.5, -5.8, 35.5, -2.7, Math.round(90 * usure), [0xb5a888, 0x9c8a66, 0xd8cdb0, 0x8a7a5a], 0.07);
  seau(c, -27.3, -3.1, COUL.jouets[0], true);
  cerceau(c, 4.2, -3.6, COUL.jouets[1]);
  ballon(c, 1.4, -5.3, 0.16, COUL.jouets[2]);
}

/** La borne d'enregistrement ThalassoLuxe : un totem blanc, écran qui luit encore. */
function borne(c, x, z, ry) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.pave(-0.28, 0, -0.18, 0.28, 1.55, 0.18, 0xf0ece2, M.lisse, { nuance: 0.01 });
    c.pave(-0.3, 1.55, -0.2, 0.3, 1.62, 0.2, COUL.canard, M.lisse, { crasse: false });
    panneau(c, M.ecran, R.borne, { y: 1.25, z: 0.19, rx: -0.15 }, 0.46, 0.29);
    c.pave(-0.12, 0.85, 0.18, 0.12, 0.92, 0.24, COUL.noir, M.lisse, { crasse: false });
  });
}

/** Le passage couvert qui mène de la galerie à la piscine. */
function passage(k) {
  const { c, P, M } = k;
  const z2 = k.front ? PIS.z1 : 3;
  c.pave(PAS.x1, 0, ZG + 0.3, PAS.x2, 0.06, z2, COUL.ciment, M.ciment, { crasse: false, nuance: 0 });
  for (const x of [PAS.x1 + 0.1, PAS.x2 - 0.1]) for (const z of [ZG + 2.2, z2 - 0.3]) cylindre(c, M.tole, COUL.fonte, x, 1.5, z, 0.07, 3.0, 8);
  P.pave(PAS.x1 - 0.3, 3.0, ZG + 0.3, PAS.x2 + 0.3, 3.12, z2, COUL.zinc, M.tole, { crasse: false });
  for (const x of [PAS.x1 - 0.3, PAS.x2 + 0.3]) P.pave(x - 0.05, 2.8, ZG + 0.3, x + 0.05, 3.1, z2, COUL.bois, M.mat, { crasse: false });
  if (k.usure > 0.5) P.boite(1.2, 0.04, 1.4, COUL.zinc, { x: PAS.x2 + 0.3, y: 2.4, z: 1.2, rz: -0.9 }, M.tole);
}

// ---------- Les intérieurs des pavillons (carte « pavillons ») ----------

function dortoir(k) {
  const { c, M, usure } = k;
  // Deux rangées de petits lits de fer, tête au mur nord et au milieu ; à l'ouest, la dune les noie
  for (let i = 0; i < 9; i++) {
    const x = -34.6 + i * 1.75;
    const ens = Math.max(0, dune(x, -15.8) - 0.05);
    if (ens > 0.75) continue;
    litEnfant(c, x, -15.85, 0, i === 4 ? "defait" : ens > 0.2 ? "nu" : "fait", { ensable: ens * 0.6 });
    if (i % 2 === 0 && ens < 0.2) chevet(c, x + 0.85, -16.55);
  }
  for (let i = 0; i < 8; i++) {
    const x = -33.8 + i * 1.75;
    const ens = Math.max(0, dune(x, -10.6) - 0.05);
    if (ens > 0.75) continue;
    const etat = i === 5 ? "renverse" : i === 2 ? "defait" : ens > 0.2 ? "nu" : "fait";
    litEnfant(c, x, -10.6, 0.04 * (i % 3 - 1), etat, { ensable: ens * 0.6 });
  }
  // Les casiers contre la cloison, des dessins d'enfants punaisés au-dessus
  casiers(c, XA - 0.35, -14, -Math.PI / 2, 7);
  panneau(c, M.enseignes, R.dessins, { x: XA - 0.12, y: 2.2, z: -14, ry: -Math.PI / 2 }, 1.4, 1.4);
  // Les fresques sur le mur nord, au-dessus des lits
  panneau(c, M.enseignes, R.phare, { x: -31.5, y: 2.3, z: ZN + 0.22 }, 1.6, 1.6);
  panneau(c, M.enseignes, R.baleine, { x: -26, y: 2.35, z: ZN + 0.22 }, 3.4, 1.7);
  panneau(c, M.enseignes, R.poissons, { x: -20.8, y: 2.4, z: ZN + 0.22 }, 3.6, 0.9);
  // Jouets abandonnés : ours, voilier, seau et pelle, cheval à bascule, cerceau, ballon
  ours(c, -24.4, 0.55, -15.5, 0.3);
  ours(c, -20.5, 0.05, -8.4, -0.6, 0xc9b49a);
  voilier(c, -22.6, 0.06, -12.8, 1.2);
  seau(c, -27.8, -8.6, COUL.jouets[3]);
  chevalBascule(c, -19.6, -12.4, 0.5);
  cerceau(c, -25.2, -12.9, COUL.jouets[0]);
  ballon(c, -21.8, -7.6, 0.14, COUL.jouets[1]);
  // Le coin des survivants : couchage entre deux lits, la lanterne
  couchage(c, -23.4, -13.2, Math.PI / 2, COUL.plaids[1]);
  lanterne(c, -23.2, 0.05, -12.4);
  caisse(c, -22.6, -12, 0.3, 0.05, 0.4);
  // Le sable de la dune : versant qui entre par les fenêtres ouest, langues sur le carrelage
  congere(c, -30.2, -12.5, 1.6, 4.2, 0.45, 0, 0.1);
  congere(c, -28.4, -8.2, 1.4, 0.9, 0.18);
  congere(c, -25.2, -7.1, 1.1, 0.7, 0.12);
  for (let i = 0; i < 10; i++) {
    const x = -34.5 + k.rng() * 3.2;
    const z = -16 + k.rng() * 9;
    oyats(c, x, z, dune(x, z), 0.6);
  }
  debris(c, -30, -16.4, -18, -6.6, Math.round(60 * usure), [0xd8d2c0, 0xb9b3a5, COUL.tuile], 0.05);
  // Le trou du toit au-dessus du dortoir : rai de soleil
  if (usure > 0.3) raiDeLumiere(c, [-23.5, ETG, -7.2], [-22.5, 0.06, -8.6], 2.0);
  flaqueMer(c, -22.8, -8.4, 0.8, 0.06);
}

function reeducation(k) {
  const { c, M, usure } = k;
  // Espaliers le long du mur nord, poulies sur le pignon est, barres parallèles au milieu
  for (let i = 0; i < 6; i++) espalier(c, -16.2 + i * 1.05, ZN + 0.2, 0, 0.9, i === 3);
  poulies(c, PA.x2 - 0.3, -14.2, -Math.PI / 2);
  barresParalleles(c, -11.5, -11.2, 0, 3.2);
  plinthe(c, -8.2, -9.2, 0.1);
  plinthe(c, -15.6, -9.4, -0.05);
  // Ballons de cuir et grands ballons, tapis, banc de gymnastique
  ballon(c, -13.2, -8.4, 0.18, COUL.cuir);
  ballon(c, -12.6, -8.1, 0.16, 0x8a5a3a);
  ballon(c, -9.8, -13.6, 0.4, 0x7f9fb0);
  ballon(c, -7.6, -15.6, 0.35, 0xc9a85a);
  tapis(c, -14.6, -14.4, 0.05);
  tapis(c, -6.4, -12.8, Math.PI / 2, true);
  tapis(c, -6.4, -13.4, Math.PI / 2, true);
  c.pave(-16.6, 0, -7.0, -12.2, 0.45, -6.65, COUL.bois, M.mat, { nuance: 0.04 });
  // La rangée de casques de « réalité virtuelle » de ThalassoLuxe, et son affiche
  c.pave(-10.9, 0, -7.2, -8.3, 0.9, -6.75, 0xf0ece2, M.lisse);
  for (let i = 0; i < 5; i++) c.boite(0.22, 0.1, 0.14, COUL.noir, { x: -10.6 + i * 0.5, y: 0.96, z: -6.95, ry: k.rng() - 0.5 }, M.lisse, { crasse: false });
  panneau(c, M.enseignes, R.vr, { x: -16.9, y: 2.1, z: -9.8, ry: Math.PI / 2 }, 0.9, 1.35);
  // Un miroir de gymnastique fendu, sur la cloison
  c.pave(-17.28, 0.4, -16, -17.24, 2.4, -13.2, 0xc9d4d4, M.lisse, { crasse: false });
  c.boite(0.02, 1.9, 0.02, 0x3a3d3c, { x: -17.22, y: 1.4, z: -14.4, rx: 0.5 }, M.lisse, { crasse: false });
  // Sable et débris
  congere(c, -12.8, -7.0, 1.3, 0.8, 0.16);
  congere(c, PA.x2 - 0.9, -11.5, 0.8, 1.0, 0.14);
  debris(c, -17, -16.5, -5.6, -6.6, Math.round(40 * usure), [0xd8d2c0, 0xb9b3a5], 0.05);
}

function refectoire(k) {
  const { c, M, usure } = k;
  // Trois longues tables basses, des dizaines de petites chaises
  for (const [z, renv] of [[-15.0, false], [-12.4, false], [-9.5, usure > 0.5]]) {
    tableEnfants(c, 9.4, z, 6.4, renv);
    for (let i = 0; i < 8; i++) {
      for (const s of [-1, 1]) {
        if (k.rng() < 0.18 * usure) continue;
        const tombe = k.rng() < 0.2;
        chaiseEnfant(c, 6.8 + i * 0.75 + k.rng() * 0.1, z + s * 0.62, s > 0 ? Math.PI + k.rng() * 0.3 : k.rng() * 0.3, tombe);
      }
    }
  }
  tableEnfants(c, 16.8, -15.2, 2.4, true);
  // La frise de poissons et le voilier sur le mur nord
  panneau(c, M.enseignes, R.poissons, { x: 9.5, y: 2.5, z: ZN + 0.22 }, 5.2, 1.3);
  panneau(c, M.enseignes, R.bateau, { x: 16.8, y: 2.3, z: ZN + 0.22 }, 3.0, 1.5);
  // Le feu des survivants : brasero entre les tables poussées, couchages, caisses
  brasero(c, 12, -11.6);
  couchage(c, 14.4, -10.6, 0.3, COUL.plaids[0]);
  couchage(c, 13.8, -13.4, -0.2, COUL.plaids[4]);
  couchage(c, 10.0, -10.4, -0.4, COUL.plaids[2]);
  caisse(c, 15.2, -12.2, 0.2);
  caisse(c, 15.3, -12.2, 0.3, 0.4, 0.4);
  for (let i = 0; i < 4; i++) tronc(c, M.tole, 0x8a7a5a, 11.2 + i * 0.25, 0.06, -12.4, 0.05, 0.05, 0.11, 6);
  // Le passe-plat vers la cuisine, des piles d'assiettes
  for (let i = 0; i < 4; i++) cylindre(c, M.lisse, 0xe9e6dc, 19.9, 0.95 + i * 0.03, -13.5 + i * 0.4, 0.11, 0.03, 8);
  congere(c, 9.6, -6.9, 1.3, 0.8, 0.16);
  jonchee(c, 5.4, -16.6, 20, -6.6, Math.round(60 * usure), [0xb5a888, 0x9c8a66, 0xd8cdb0], 0.06);
  if (usure > 0.3) raiDeLumiere(c, [8.8, ETG, -7.6], [9.6, 0.06, -8.4], 2.4);
}

function cuisine(k) {
  const { c, M, usure } = k;
  fourneau(c, 23.6, -13.4, 0, 2.6);
  marmite(c, 22.8, 0.9, -13.5, 0.34, 0.5);
  marmite(c, 24.3, 0.9, -13.3, 0.3, 0.42, false);
  marmite(c, 21.6, 0.0, -10.2, 0.42, 0.62);
  marmite(c, 25.6, 0.0, -9.0, 0.26, 0.36, false);
  etagereConserves(c, 23.6, ZN + 0.45, 0, 4.4, 0.35 + 0.3 * (1 - usure));
  evier(c, XB2 - 0.5, -9.6, -Math.PI / 2, 1.8);
  c.pave(21.4, 0, -8.4, 23.8, 0.9, -7.4, 0x8a7a62, M.mat, { nuance: 0.04 });
  for (let i = 0; i < 3; i++) c.boite(0.04, 0.02, 0.3, 0xb7b2a4, { x: 22 + i * 0.4, y: 0.92, z: -7.9, ry: k.rng() }, M.tole, { crasse: false });
  // Les conserves tombées, une louche
  for (let i = 0; i < 9; i++) tronc(c, M.tole, [0xb5573f, 0xc9b68a, 0x8a9a6a][i % 3], 22 + k.rng() * 3.5, 0.06, -15.4 + k.rng() * 2.4, 0.045, 0.045, 0.11, 6, { rz: Math.PI / 2, ry: k.rng() * 3 });
  debris(c, 20.8, -16.6, 26.4, -6.6, Math.round(30 * usure), [0xd8d2c0, 0x9a9488], 0.05);
}

function infirmerie(k) {
  const { c, M, usure } = k;
  armoirePharmacie(c, 31, ZN + 0.45, 0, 1.4, 0.4 + 0.4 * usure);
  armoirePharmacie(c, 32.6, ZN + 0.45, 0, 1.2, 0.5 + 0.4 * usure);
  peseBebe(c, 35.2, -14, -Math.PI / 2);
  litEnfant(c, 33.2, -13.9, Math.PI / 2, "defait");
  paravent(c, 29.2, -13.4, 0.4, usure > 0.6);
  c.pave(27.6, 0, -15.2, 28.6, 0.8, -12.6, 0xe4e0d4, M.satin);
  for (let i = 0; i < 6; i++) tronc(c, M.verre, 0xd9e8e0, 29.5 + k.rng() * 4, 0.06, -15.8 + k.rng() * 3.6, 0.05, 0.05, 0.14, 6, { rz: Math.PI / 2, ry: k.rng() * 3 }, { crasse: false });
  panneau(c, M.enseignes, R.pharmacie, { x: XB2 + 0.12, y: 2.8, z: -14.6, ry: Math.PI / 2 }, 1.2, 0.3);
  debris(c, 27, -16.6, 35.6, -11.8, Math.round(30 * usure), [0xe4e0d4, 0xd8d2c0, 0xbfd3d6], 0.05);
}

function lingerie(k) {
  const { c, M, usure } = k;
  etagereLinge(c, 33.6, ZB + 0.5, 0, 3.6, 0.85 - 0.4 * usure);
  etagereLinge(c, PB.x2 - 0.5, -8.6, -Math.PI / 2, 2.6, 0.75 - 0.3 * usure);
  portantPeignoirs(c, 29.6, -10.3, 0, 6, usure > 0.5 ? 2 : 1);
  lessiveuse(c, 27.6, -10.6, Math.PI / 2);
  panier(c, 30.6, -7.4);
  panier(c, 32.2, -7.6, true);
  // Le grand plan de pliage, une pile de couvertures, un fer
  c.pave(31.2, 0.85, -9.2, 33.6, 0.92, -8.2, 0xc9bfa8, M.mat);
  for (const x of [31.4, 33.4]) for (const z of [-9.0, -8.4]) c.pave(x - 0.04, 0, z - 0.04, x + 0.04, 0.85, z + 0.04, COUL.bois, M.mat);
  for (let i = 0; i < 4; i++) c.boite(0.8, 0.07, 0.6, COUL.plaids[i], { x: 32.2, y: 0.96 + i * 0.07, z: -8.7, ry: k.rng() * 0.2 }, M.toile);
  c.boite(0.22, 0.12, 0.12, 0x3a3d3c, { x: 33.1, y: 0.98, z: -8.5 }, M.tole);
  congere(c, 28.3, -6.9, 1.0, 0.7, 0.14);
}

/** La ruelle entre le pavillon des Enfants et la chapelle (carte « pavillons » : un peu de sable, des oyats). */
function ruelle(k) {
  const { c } = k;
  congere(c, -4.3, -20, 0.8, 2.6, 0.3);
  for (let i = 0; i < 6; i++) oyats(c, -4.6 + k.rng() * 0.6, -22 + k.rng() * 5, 0.1, 0.7);
  for (let i = 0; i < 8; i++) oyats(c, 4.2 + k.rng() * 0.6, -22.5 + k.rng() * 4, 0.1, 0.6);
}

/** Carte « front » : ce qu'on aperçoit des pavillons fermés par les fenêtres (quelques lits, le feu, les tables). */
function entrevues(k) {
  const { c } = k;
  for (let i = 4; i < 9; i++) litEnfant(c, -34.6 + i * 1.75, -15.85, 0, "fait");
  for (let i = 4; i < 8; i++) litEnfant(c, -33.8 + i * 1.75, -10.6, 0, i === 5 ? "renverse" : "fait");
  for (const z of [-15.0, -12.4, -9.5]) tableEnfants(c, 9.4, z, 6.4);
  brasero(c, 12, -11.6);
  espalier(c, -14, ZN + 0.2, 0, 0.9);
  barresParalleles(c, -11.5, -11.2, 0, 3.2);
  congere(c, -30.2, -12.5, 1.6, 4.2, 0.45, 0, 0.1);
}

/** Une flaque d'eau de pluie (même matière que la mer : un appel de dessin de moins). */
function flaqueMer(c, x, z, rayon, y = 0.015) {
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = rayon * c.entre(0.6, 1.1);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
  c.poser(g, matieres().mer, 0x6f7f78, { x, y, z }, { crasse: false, nuance: 0 });
  g.dispose();
}

// ---------- La piscine d'eau de mer (carte « front ») ----------

function piscine(k) {
  const { c, V, M, usure } = k;
  const brique = { couleur: COUL.brique, mat: M.brique, ep: 0.35 };
  const { x1, x2, z1, z2, h } = PIS;
  // Les murs : bas de brique ; grandes baies vitrées sur la mer ; le haut dans la couche de la verrière
  const baiesS = [];
  for (let i = 0; i < 8; i++) {
    const u = 1.5 + i * 3;
    if (i === 4) baiesS.push({ u, l: 2.6, bas: 0, haut: 4.0, type: "vide" }); // la baie effondrée, ensablée
    else baiesS.push({ u, l: 2.4, bas: 1.0, haut: 4.2, type: "fenetre", ...OPT_FEN(), croisillons: 2, traverses: 3, bris: k.bris });
  }
  murCoupe(k, [x1, z2], [x2, z2], { ...brique, h, haut: V, ouvertures: baiesS, breches: [{ u: 13.5, l: 4, profondeur: 1.6 * usure + 0.4 }] });
  const baiesE = [{ u: 2.5, l: 1.6, bas: 0, haut: 2.6, type: "vide" }, { u: 6.5, l: 2.4, bas: 1.0, haut: 4.2, type: "fenetre", ...OPT_FEN(), croisillons: 2, bris: k.bris }, { u: 10.5, l: 2.4, bas: 1.0, haut: 4.2, type: "fenetre", ...OPT_FEN(), croisillons: 2, bris: k.bris }, { u: 13, l: 1.0, bas: 0, haut: 2.3, type: "vide" }];
  murCoupe(k, [x2, z2], [x2, z1], { ...brique, h, haut: V, ouvertures: baiesE });
  const hautes = (n0, n) => Array.from({ length: n }, (_, i) => ({ u: n0 + i * 3, l: 2.0, bas: 2.4, haut: 4.2, type: "fenetre", ...OPT_FEN(), croisillons: 2, traverses: 2, bris: k.bris }));
  murCoupe(k, [x2, z1], [x1, z1], { ...brique, h, cut: 0, ouvertures: [...hautes(1.5, 4), { u: x2 - (PAS.x1 + PAS.x2) / 2, l: 2.8, bas: 0, haut: 2.8, type: "vide" }, ...hautes(20.5, 2)] });
  murCoupe(k, [x1, z1], [x1, z2], { ...brique, h, cut: 0, ouvertures: hautes(2, 4) });
  battants(c, x2 + 0.18, z2 - 2.5, Math.PI / 2, 1.6, 2.6, "tombe");
  // Pilastres de brique (bas visible, haut dans la couche), soubassement d'enduit
  for (let i = 0; i <= 8; i++) {
    const x = x1 + i * 3;
    c.pave(x - 0.25, 0, z2 + 0.1, x + 0.25, CUT, z2 + 0.32, COUL.brique, M.brique, { nuance: 0.03 });
    V.pave(x - 0.25, CUT, z2 + 0.1, x + 0.25, h + 0.3, z2 + 0.32, COUL.brique, M.brique, { nuance: 0.03 });
    V.pave(x - 0.32, h + 0.3, z2 + 0.05, x + 0.32, h + 0.45, z2 + 0.38, COUL.enduit, M.enduit, { crasse: false });
  }
  bandes([x1, z2], [x2, z2], 0.35, [{ y1: 0, y2: 0.5, s: 0.05, couleur: COUL.enduitGris, mat: M.enduit, ch: c, trous: [[12.2, 14.8]] }, { y1: h - 0.25, y2: h, s: 0.12, couleur: COUL.enduit, mat: M.enduit, ch: V }]);
  bandes([x2, z2], [x2, z1], 0.35, [{ y1: 0, y2: 0.5, s: 0.05, couleur: COUL.enduitGris, mat: M.enduit, ch: c, trous: [[1.7, 3.3], [12.5, 13.5]] }, { y1: h - 0.25, y2: h, s: 0.12, couleur: COUL.enduit, mat: M.enduit, ch: V }]);
  // La plaque BAINS DE MER, recouverte du bandeau ThalassoLuxe (au-dessus de l'entrée nord, côté passage)
  panneau(c, M.enseignes, R.bains, { x: 16.5, y: 3.3, z: z1 - 0.2, ry: Math.PI }, 1.6, 0.4);
  // Le totem ThalassoLuxe devant l'entrée est, sur deux poteaux laqués
  for (const z of [11.2, 13.6]) c.pave(x2 + 1.55, 0, z - 0.06, x2 + 1.67, 2.6, z + 0.06, 0xf0ece2, M.lisse);
  panneau(c, M.enseignes, R.thalasso, { x: x2 + 1.7, y: 2.2, z: 12.4, ry: Math.PI / 2 }, 3.2, 0.6);

  // La verrière : fermes de fer, vitres (beaucoup manquent), faîtage
  const yE = h + 0.45;
  const hv = 2.8;
  const zc = (z1 + z2) / 2;
  const demi = (z2 - z1) / 2;
  const ang = Math.atan2(hv, demi);
  const ramp = Math.hypot(hv, demi);
  for (let i = 0; i <= 8; i++) {
    const x = x1 + i * 3;
    for (const s of [-1, 1]) {
      V.poutre([x, yE, zc + s * demi], [x, yE + hv, zc], 0.12, COUL.fonte, M.tole);
      V.poutre([x, yE + hv * 0.45, zc + s * demi * 0.55], [x, yE, zc], 0.05, COUL.fonte, M.tole);
    }
    V.poutre([x, yE, z1], [x, yE, z2], 0.06, COUL.fonte, M.tole);
  }
  V.pave(x1, yE + hv - 0.05, zc - 0.12, x2, yE + hv + 0.12, zc + 0.12, COUL.zinc, M.tole, { crasse: false });
  const casse = 0.25 + 0.6 * usure;
  for (let i = 0; i < 8; i++) {
    const x = x1 + 1.5 + i * 3;
    for (const s of [-1, 1]) {
      for (let j = 0; j < 4; j++) {
        const t = (j + 0.5) / 4;
        const y = yE + hv * (1 - t);
        const z = zc + s * demi * t;
        // les pannes
        if (i === 0) V.boite(x2 - x1, 0.05, 0.05, COUL.fonte, { x: (x1 + x2) / 2, y: y - 0.02 + hv / 8, z: z - (s * demi) / 8 }, M.tole);
        if (k.rng() < casse) continue;
        V.boite(2.9, 0.02, ramp / 4 - 0.06, 0xffffff, { x, y, z, rx: s * ang }, M.verre, { crasse: false });
      }
    }
  }
  // Les éclats de verrière au fond du bassin et sur les plages
  debris(c, BAS.x1, BAS.z1, BAS.x2, BAS.z2, Math.round(50 * usure), [0xbfd3d6, 0x9fb7bc, 0xdfe8ea], -1.75);

  // Le bassin : parois et fond de mosaïque, margelle, sable soufflé à l'ouest, flaque verte au grand fond
  const fd = BAS.fond;
  c.pave(BAS.x1, fd - 0.1, BAS.z1, BAS.x2, fd, BAS.z2, COUL.mosaique, M.mosaique, { crasse: false, nuance: 0 });
  c.pave(BAS.x1 - 0.3, fd - 0.1, BAS.z1 - 0.3, BAS.x2 + 0.3, 0, BAS.z1, COUL.mosaique, M.mosaique, { crasse: false, nuance: 0 });
  c.pave(BAS.x1 - 0.3, fd - 0.1, BAS.z2, BAS.x2 + 0.3, 0, BAS.z2 + 0.3, COUL.mosaique, M.mosaique, { crasse: false, nuance: 0 });
  c.pave(BAS.x1 - 0.3, fd - 0.1, BAS.z1, BAS.x1, 0, BAS.z2, COUL.mosaique, M.mosaique, { crasse: false, nuance: 0 });
  c.pave(BAS.x2, fd - 0.1, BAS.z1, BAS.x2 + 0.3, 0, BAS.z2, COUL.mosaique, M.mosaique, { crasse: false, nuance: 0 });
  // Les lignes de nage, carreaux bleu sombre sur le fond
  for (const z of [8, 10, 12]) c.pave(BAS.x1 + 1, fd, z - 0.12, BAS.x2 - 1, fd + 0.012, z + 0.12, 0x34587a, M.lisse, { crasse: false, nuance: 0 });
  // La ligne d'eau d'autrefois, une frise de carreaux bleus sous la margelle
  for (const [a, bb, cc, d] of [[BAS.x1, BAS.z1 + 0.01, BAS.x2, BAS.z1 + 0.02], [BAS.x1, BAS.z2 - 0.02, BAS.x2, BAS.z2 - 0.01]]) c.pave(a, -0.35, bb, cc, -0.2, d, 0x4f7fa0, M.lisse, { crasse: false });
  // Margelle et plages autour du bassin (dalles claires)
  const ym = 0.08;
  c.pave(BAS.x1 - 0.5, 0, BAS.z1 - 0.5, BAS.x2 + 0.5, ym, BAS.z1 - 0.3, 0xd9d2c0, M.lisse, { nuance: 0.02 });
  c.pave(BAS.x1 - 0.5, 0, BAS.z2 + 0.3, BAS.x2 + 0.5, ym, BAS.z2 + 0.5, 0xd9d2c0, M.lisse, { nuance: 0.02 });
  c.pave(BAS.x1 - 0.5, 0, BAS.z1 - 0.3, BAS.x1 - 0.3, ym, BAS.z2 + 0.3, 0xd9d2c0, M.lisse, { nuance: 0.02 });
  c.pave(BAS.x2 + 0.3, 0, BAS.z1 - 0.3, BAS.x2 + 0.5, ym, BAS.z2 + 0.3, 0xd9d2c0, M.lisse, { nuance: 0.02 });
  for (const [a, bb, cc, d] of [[x1 + 0.2, z1 + 0.2, x2 - 0.2, BAS.z1 - 0.5], [x1 + 0.2, BAS.z2 + 0.5, x2 - 0.2, z2 - 0.2], [x1 + 0.2, BAS.z1 - 0.5, BAS.x1 - 0.5, BAS.z2 + 0.5], [BAS.x2 + 0.5, BAS.z1 - 0.5, x2 - 0.2, BAS.z2 + 0.5]]) {
    c.pave(a, 0, bb, cc, 0.05, d, 0xcfd6cf, M.ciment, { crasse: false, nuance: 0 });
  }
  for (const [ax, az, bx, bz] of [[BAS.x1 - 0.3, BAS.z1 - 0.3, BAS.x2 + 0.3, BAS.z1 - 0.3], [BAS.x1 - 0.3, BAS.z2 + 0.3, BAS.x2 + 0.3, BAS.z2 + 0.3], [BAS.x1 - 0.3, BAS.z1 - 0.3, BAS.x1 - 0.3, BAS.z2 + 0.3], [BAS.x2 + 0.3, BAS.z1 - 0.3, BAS.x2 + 0.3, BAS.z2 + 0.3]]) k.b.obstacle(ax, az, bx, bz, "bassin vide (chute de 1,8 m)");
  // Le sable : versant soufflé par la baie effondrée, qui descend dans le bassin depuis le sud-ouest
  const sab = [];
  const tons = [];
  const hs = (x, z) => {
    const d = Math.hypot((x - 22) * 0.55, z - 15.5);
    return Math.min(-0.3, fd + 2.2 - d * 0.42) + 0.07 * Math.sin(x * 2 + z);
  };
  for (let x = BAS.x1; x < BAS.x2 - 1e-6; x += 1) for (let z = BAS.z1; z < BAS.z2 - 1e-6; z += 1) {
    const pts = [[x, z], [x, z + 1], [x + 1, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].map(([px, pz]) => [px, Math.max(fd + 0.02, hs(px, pz)), pz]);
    for (let t = 0; t < 2; t++) {
      const tri = pts.slice(t * 3, t * 3 + 3);
      if (tri.every((p) => p[1] <= fd + 0.025)) continue;
      sab.push(...tri.flat());
      tons.push(COUL.sable);
    }
  }
  if (sab.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(sab, 3));
    g.computeVertexNormals();
    c.poser(g, M.sable, COUL.sable, {}, { crasse: false, nuance: 0 });
    g.dispose();
  }
  congere(c, 22, 16.5, 3.4, 2.0, 0.6);
  congere(c, 22.5, 18.6, 3.8, 1.6, 0.45);
  for (let i = 0; i < 14; i++) {
    const x = 19 + k.rng() * 6;
    const z = 15 + k.rng() * 2.6;
    oyats(c, x, z, 0.2, 0.7);
  }
  // L'eau verte et les algues au grand fond
  c.pave(25.4, fd + 0.05, BAS.z1 + 0.05, BAS.x2 - 0.05, fd + 0.28, BAS.z2 - 0.05, 0x4f6b3a, M.mer, { crasse: false, nuance: 0 });
  for (let i = 0; i < 16; i++) c.boite(k.rng() * 0.3 + 0.1, 0.01, k.rng() * 0.3 + 0.1, [0x6f8a3a, 0x8a9a4a, 0x5f7a3a][i % 3], { x: 25.6 + k.rng() * 4.2, y: fd + 0.285, z: BAS.z1 + 0.3 + k.rng() * 7.4, ry: k.rng() * 3 }, M.mat, { crasse: false });
  // Les échelles d'inox, le plongeoir
  for (const z of [BAS.z1 + 1.2, BAS.z2 - 1.2]) for (const dz of [-0.25, 0.25]) {
    c.tube([BAS.x2 + 0.15, 0.9, z + dz], [BAS.x2 + 0.15, 0.08, z + dz], 0.025, 0xc9cfd0, M.tole, 5);
    c.tube([BAS.x2 + 0.15, 0.08, z + dz], [BAS.x2 - 0.15, -1.3, z + dz], 0.025, 0xc9cfd0, M.tole, 5);
  }
  c.pave(BAS.x2 + 0.6, 0, 9.6, BAS.x2 + 1.2, 0.6, 10.4, 0xd9d2c0, M.lisse);
  c.boite(2.6, 0.08, 0.5, 0xc9b98f, { x: BAS.x2 - 0.2, y: 0.66, z: 10, rz: 0.06 }, M.satin);
  panneau(c, M.enseignes, R.plongee, { x: BAS.x2 + 2.2, y: 1.2, z: 9.0, ry: -Math.PI / 2 + 0.3 }, 0.5, 0.75);
  c.tube([BAS.x2 + 2.2, 0, 9.0], [BAS.x2 + 2.2, 0.85, 9.0], 0.025, 0xb7b2a4, M.tole, 4);

  // Les cabines de bain, le long du mur ouest : cloisons peintes à rayures, portes battantes, numéros
  for (let i = 0; i <= 8; i++) {
    const z = z1 + 1.2 + i * 1.5;
    c.pave(x1 + 0.2, 0, z - 0.03, x1 + 1.9, 2.2, z + 0.03, i % 2 ? COUL.menuiserieClaire : 0xe9e4d6, M.mat, { nuance: 0.03 });
    if (i === 8) continue;
    const zc2 = z + 0.75;
    const ouverte = (i * 7) % 3 !== 0;
    c.repere({ x: x1 + 1.9, z: zc2 - 0.65, ry: ouverte ? -1.2 - k.rng() * 0.4 : 0 }, () => {
      c.boite(0.04, 1.6, 1.25, i % 2 ? 0xe9e4d6 : COUL.menuiserieClaire, { y: 1.1, z: 0.62 }, M.mat, { nuance: 0.05 });
    });
    if (i === 3) panneau(c, M.enseignes, R.cabine, { x: x1 + 1.94, y: 1.75, z: zc2, ry: Math.PI / 2 }, 0.26, 0.26);
    c.pave(x1 + 0.25, 0.42, z + 0.1, x1 + 0.7, 0.47, z + 1.4, COUL.bois, M.mat);
    if (k.rng() < 0.5) c.boite(0.5, 0.04, 0.35, COUL.plaids[i % COUL.plaids.length], { x: x1 + 0.5, y: 0.5, z: zc2, ry: k.rng() }, M.toile, { crasse: false });
  }
  c.pave(x1 + 0.2, 2.2, z1 + 1.2, x1 + 1.95, 2.26, z1 + 13.2, COUL.bois, M.mat, { nuance: 0.03 });
  // Une bouée sur le mur, les bancs de bois, des sandales
  c.poser(new THREE.TorusGeometry(0.32, 0.08, 4, 10), M.satin, 0xc65a46, { x: 25, y: 2.1, z: z1 + 0.25 }, { crasse: false });
  for (const x of [20, 23]) c.pave(x, 0, z1 + 0.5, x + 1.8, 0.45, z1 + 0.85, COUL.bois, M.mat, { nuance: 0.03 });
  // La réception ThalassoLuxe : comptoir laqué, bornes, peignoirs, transats de plastique tournés vers la mer
  c.pave(30.2, 0, 15.6, 32.4, 1.05, 16.4, 0xf0ece2, M.lisse, { nuance: 0.01 });
  c.pave(30.1, 1.05, 15.5, 32.5, 1.1, 16.5, COUL.canard, M.lisse, { crasse: false });
  c.pave(30.2, 0, 12.8, 30.6, 1.05, 15.6, 0xf0ece2, M.lisse, { nuance: 0.01 });
  borne(c, 18.6, 3.7, Math.PI);
  borne(c, 19.6, 3.7, Math.PI);
  portantPeignoirs(c, 32.6, 11.6, -Math.PI / 2, 5, 2);
  for (let i = 0; i < 4; i++) {
    const x = [14.6, 16.8, 26.4, 28.6][i];
    c.repere({ x, z: 15.6, ry: Math.PI + (k.rng() - 0.5) * 0.4 }, () => {
      c.boite(0.62, 0.06, 1.6, 0xeeeae0, { y: 0.32, z: 0.15 }, M.lisse);
      c.boite(0.62, 0.06, 0.7, 0xeeeae0, { y: 0.55, z: -0.75, rx: 0.8 }, M.lisse);
      for (const [px, pz] of [[-0.28, -0.6], [0.28, -0.6], [-0.28, 0.85], [0.28, 0.85]]) c.boite(0.05, 0.3, 0.05, 0xeeeae0, { x: px, y: 0.15, z: pz }, M.lisse);
    });
  }
  // Le local de la pompe à eau de mer (angle nord-est), tuyaux qui plongent au bassin
  c.pave(31.6, 0, z1 + 0.3, 33.7, 1.4, z1 + 1.7, 0x6f7472, M.tole, { nuance: 0.04 });
  c.tube([31.6, 0.6, z1 + 1.0], [BAS.x2 + 0.4, 0.15, BAS.z1 + 0.4], 0.1, COUL.rouille, M.tole, 6);
  c.tube([33.7, 0.9, z1 + 1.0], [x2 + 1.5, 0.9, z1 + 1.0], 0.1, COUL.rouille, M.tole, 6);
  c.tube([x2 + 1.5, 0.9, z1 + 1.0], [x2 + 1.5, 0.9, Z_DIGUE - 0.3], 0.1, COUL.rouille, M.tole, 6);
  // Rais de soleil par la verrière crevée, feuilles et débris
  raiDeLumiere(c, [18, yE + hv * 0.6, 7], [17, fd + 0.1, 8.5], 2.4);
  if (usure > 0.4) raiDeLumiere(c, [26, yE + hv * 0.4, 13], [25.4, 0.06, 14.8], 2.0);
  jonchee(c, x1 + 2.2, z1 + 0.4, x2 - 0.4, BAS.z1 - 0.6, Math.round(40 * usure), [0xb5a888, 0x9c8a66, 0xd8cdb0], 0.06);
}

// ---------- Le jardin (carte « front ») ----------

function jardin(k) {
  const { c, M, usure } = k;
  // Les allées de béton : le long de la galerie, dans l'axe de la chapelle, vers l'escalier, la promenade de la digue
  const allee = (x1, z1, x2, z2) => c.pave(x1, 0, z1, x2, 0.04, z2, 0xc6bea9, M.ciment, { crasse: false, nuance: 0 });
  allee(-1.4, ZG + 0.3, 1.4, Z_DIGUE - 2.4);
  allee(-15.2, ZG + 0.3, -12.8, Z_DIGUE - 2.4);
  allee(-34, Z_DIGUE - 2.4, 42, Z_DIGUE);
  allee(PIS.x2, PIS.z1 + 1.5, 42, PIS.z1 + 3.5);
  // Bancs face à la mer
  for (const x of [-26, -8, 5]) {
    c.repere({ x, z: Z_DIGUE - 1.8 }, () => {
      c.boite(1.8, 0.05, 0.45, COUL.boisGris, { y: 0.45 }, M.mat, { nuance: 0.05 });
      c.boite(1.8, 0.4, 0.04, COUL.boisGris, { y: 0.75, z: -0.22, rx: -0.15 }, M.mat, { nuance: 0.05 });
      for (const s of [-1, 1]) c.boite(0.06, 0.8, 0.5, COUL.fonte, { x: s * 0.8, y: 0.4 }, M.tole);
    });
  }
  // Les réverbères de fonte (l'un tordu)
  for (const [x, tordu] of [[-20, false], [-4, false], [9, usure > 0.5]]) {
    c.tube([x, 0, Z_DIGUE - 0.6], tordu ? [x + 0.9, 3.0, Z_DIGUE - 0.2] : [x, 3.4, Z_DIGUE - 0.6], 0.06, COUL.fonte, M.tole, 6);
    const tx = tordu ? x + 0.9 : x;
    tronc(c, M.tole, COUL.fonte, tx, tordu ? 3.15 : 3.55, Z_DIGUE - (tordu ? 0.2 : 0.6), 0.12, 0.22, 0.32, 6);
  }
  // Le mât de pavillon, la drisse qui claque
  c.tube([-1.8, 0, 4], [-1.8, 7.5, 4], 0.06, 0xc9cfd0, M.tole, 6);
  c.boite(0.01, 6.5, 0.01, 0xd8d0c0, { x: -1.7, y: 3.7, z: 4.02, rz: 0.03 }, M.mat, { crasse: false });
  // La balançoire, une seule balancelle restée ; le toboggan rouillé, le bac à sable (ironie de la dune voisine)
  c.repere({ x: -22, z: 9, ry: 0.2 }, () => {
    for (const s of [-1, 1]) {
      c.poutre([s * 1.4, 0, -0.9], [s * 1.2, 2.4, 0], 0.07, COUL.rouille, M.tole);
      c.poutre([s * 1.4, 0, 0.9], [s * 1.2, 2.4, 0], 0.07, COUL.rouille, M.tole);
    }
    c.boite(2.5, 0.08, 0.08, COUL.rouille, { y: 2.4 }, M.tole);
    for (const s of [-0.24, 0.24]) c.boite(0.015, 1.9, 0.015, 0x6a6a64, { x: -0.5 + s, y: 1.45, z: 0.1, rx: 0.08 }, M.tole, { crasse: false });
    c.boite(0.55, 0.04, 0.22, COUL.bois, { x: -0.5, y: 0.48, z: 0.25 }, M.mat);
    c.boite(0.015, 1.6, 0.015, 0x6a6a64, { x: 0.5, y: 1.6 }, M.tole, { crasse: false });
  });
  c.repere({ x: -14.2, z: 7.6, ry: -0.4 }, () => {
    c.boite(0.7, 0.04, 2.8, 0xa4552f, { y: 0.85, rx: -0.6 }, M.tole);
    for (const s of [-1, 1]) c.boite(0.04, 0.2, 2.8, 0xa4552f, { x: s * 0.35, y: 0.95, rx: -0.6 }, M.tole);
    for (const s of [-1, 1]) c.poutre([s * 0.35, 0, -1.6], [s * 0.35, 1.75, -1.15], 0.05, COUL.rouille, M.tole);
    for (let i = 0; i < 5; i++) c.boite(0.7, 0.03, 0.06, COUL.rouille, { y: 0.3 + i * 0.3, z: -1.55 + i * 0.09 }, M.tole);
  });
  c.pave(-11.2, 0, 10.4, -8.2, 0.25, 10.6, COUL.bois, M.mat);
  c.pave(-11.2, 0, 12.8, -8.2, 0.25, 13.0, COUL.bois, M.mat);
  c.pave(-11.2, 0, 10.4, -11.0, 0.25, 13.0, COUL.bois, M.mat);
  c.pave(-8.4, 0, 10.4, -8.2, 0.25, 13.0, COUL.bois, M.mat);
  c.pave(-11.0, 0, 10.6, -8.4, 0.2, 12.8, COUL.sableSec, M.sable, { crasse: false });
  seau(c, -9.4, 11.6, COUL.jouets[2], true);
  // Les tamaris couchés par le vent, des haies de troènes rongées par le sel
  for (const [x, z, s] of [[-29, 11, 1.1], [-17, 15.4, 0.9], [7, 10, 1.0], [37, 13.5, 1.2], [39, 4, 0.9]]) tamaris(c, x, z, s);
  for (let i = 0; i < 40; i++) {
    const x = -34 + k.rng() * 76;
    const z = ZG + 1 + k.rng() * (Z_DIGUE - ZG - 3);
    if (x > PIS.x1 - 1 && x < PIS.x2 + 1 && z > PIS.z1 - 1) continue;
    touffes(c, [[x, z, 0.02]], COUL.oyat);
  }
  // Le sable et les feuilles sur les allées
  jonchee(c, -34, ZG + 0.5, 9, Z_DIGUE - 0.4, Math.round(60 * usure), [0xb5a888, 0x9c8a66, 0xd8cdb0], 0.05);
  // La grille de l'entrée de service, à l'est (un vantail tombé)
  c.pave(40.6, 0, 3.5, 41.2, 2.2, 4.1, COUL.brique, M.brique);
  c.pave(40.6, 0, 6.9, 41.2, 2.2, 7.5, COUL.brique, M.brique);
  for (let i = 0; i < 8; i++) c.boite(0.03, 1.9, 0.03, COUL.fonte, { x: 41, y: 1.0, z: 4.3 + i * 0.18 }, M.tole);
  c.boite(0.05, 0.05, 1.5, COUL.fonte, { x: 41, y: 1.85, z: 4.95 }, M.tole);
  c.boite(1.5, 0.05, 1.6, COUL.fonte, { x: 39.6, y: 0.05, z: 6.2, ry: 0.4 }, M.tole);
  k.b.obstacle(41, 3.5, 41, 5.6, "grille");
}

/** Un tamaris : troncs tordus couchés vers l'est, feuillage plumeux vert-gris. */
function tamaris(c, x, z, s) {
  const M = matieres();
  const tons = [0x8a9a72, 0x9aa680, 0x7a8a68];
  for (let k = 0; k < 3; k++) {
    const a = k * 2.1 + c.hasard();
    const b0 = [x + Math.cos(a) * 0.2, 0, z + Math.sin(a) * 0.2];
    const b1 = [x + 1.0 * s + Math.cos(a) * 0.4, 1.6 * s, z + Math.sin(a) * 0.6];
    const b2 = [x + 2.1 * s + Math.cos(a) * 0.8, 2.5 * s, z + Math.sin(a) * 1.0];
    c.tube(b0, b1, 0.1 * s, 0x5e5044, M.mat, 5);
    c.tube(b1, b2, 0.07 * s, 0x5e5044, M.mat, 5);
    for (let j = 0; j < 2; j++) boule(c, M.mat, tons[(k + j) % 3], b2[0] + c.entre(-0.5, 0.5), b2[1] + c.entre(-0.1, 0.4), b2[2] + c.entre(-0.5, 0.5), s * c.entre(0.8, 1.2), 0, { nuance: 0.08 });
  }
}

// ---------- La digue, la plage, l'épi, la mer (carte « front ») ----------

function plage(k) {
  const { c, M, usure } = k;
  const zD = Z_DIGUE;
  // Le mur de la digue (béton), sa lisse ; la dune l'a recouvert à l'ouest
  const xEsc = -14;
  const xCale = 36;
  c.pave(-36, Y_PLAGE - 0.9, zD - 0.1, 42, 0.12, zD + 0.35, COUL.beton, M.mat, { nuance: 0.02 });
  for (let x = -34; x < 42; x += 2.5) {
    if (Math.abs(x - xEsc) < 1.6 || Math.abs(x - xCale) < 2.4) continue;
    c.pave(x - 0.12, 0.12, zD - 0.02, x + 0.12, 0.9, zD + 0.22, COUL.beton, M.mat, { nuance: 0.03 });
    if (x + 2.5 < 42 && !(Math.abs(x + 1.25 - xEsc) < 2.6) && !(Math.abs(x + 1.25 - xCale) < 3.6)) c.pave(x, 0.8, zD + 0.02, x + 2.5, 0.9, zD + 0.18, 0x9aa0a0, M.tole, { nuance: 0.02 });
  }
  for (const [x1, x2] of [[-36, xEsc - 1], [xEsc + 1, xCale - 2], [xCale + 2, 42]]) k.b.obstacle(x1, zD + 0.1, x2, zD + 0.1, "digue (chute sur la plage)");
  // L'escalier de la digue : des marches de béton jusqu'au sable
  for (let i = 0; i < 6; i++) {
    const y = -(i + 1) * 0.28;
    c.pave(xEsc - 0.9, Y_PLAGE - 0.5, zD + 0.35 + i * 0.45, xEsc + 0.9, y + 0.02, zD + 0.8 + i * 0.45, COUL.beton, M.mat, { nuance: 0.03 });
  }
  // La cale des lits roulants : une longue rampe douce de béton, des rails de bois
  const lgCale = 10;
  const pente = Math.atan2(-Y_MER, lgCale);
  c.repere({ x: xCale, y: -0.98, z: zD + lgCale / 2, rx: pente }, () => {
    c.boite(3.6, 0.3, lgCale + 0.4, 0xa8a294, {}, M.mat, { nuance: 0.03 });
    for (const s of [-1, 1]) c.boite(0.15, 0.08, lgCale, COUL.boisGris, { x: s * 0.9, y: 0.18 }, M.mat);
  });
  for (const s of [-1, 1]) c.pave(xCale + s * 1.8 - 0.15, Y_PLAGE - 0.4, zD, xCale + s * 1.8 + 0.15, 0.4, zD + 3, COUL.beton, M.mat);
  // Le lit roulant échoué au pied de la cale, à demi enfoui ; une bouée, un cordage
  litRoulant(c, xCale - 4.2, zD + 7.4, 0.7, { ensable: 0.35, penche: 0.12, roule: 0.08, plaid: COUL.plaids[0] });
  c.poser(new THREE.TorusGeometry(0.34, 0.09, 4, 10), M.satin, 0xd9d2c4, { x: xCale + 1.4, y: hauteur(xCale + 1.4, zD + 8) + 0.08, z: zD + 8, rx: Math.PI / 2 }, { crasse: false });
  // Le sel qui cristallise dans les flaques au pied de la cale
  for (let i = 0; i < 6; i++) c.boite(0.3 + k.rng() * 0.4, 0.02, 0.2 + k.rng() * 0.3, 0xf2efe8, { x: xCale + k.rng() * 3 - 1.5, y: hauteur(xCale, zD + 10) + 0.02, z: zD + 9 + k.rng() * 2, ry: k.rng() * 3 }, M.lisse, { crasse: false });

  // L'épi de bois : deux rangs de pieux de chêne usés par la mer, des planches qui tiennent encore
  const xE = -10;
  for (let z = zD + 1.0; z < 41.5; z += 0.42) {
    for (const s of [-1, 1]) {
      if (k.rng() < 0.12 + 0.2 * usure * ((z - zD) / 24)) continue;
      const y0 = hauteur(xE, z) - 0.3;
      const hp = 0.8 + 0.6 * k.rng() - Math.max(0, (z - 30) * 0.03);
      c.boite(0.26, hp + 0.3, 0.26, z > 27 ? 0x6a6252 : COUL.boisGris, { x: xE + s * 0.2, y: y0 + (hp + 0.3) / 2, z, rz: (k.rng() - 0.5) * 0.12, rx: (k.rng() - 0.5) * 0.1 }, M.mat, { nuance: 0.08 });
    }
  }
  for (let z = zD + 1.0; z < 34; z += 2.4) {
    if (k.rng() < 0.3 * usure) continue;
    c.boite(0.62, 0.08, 2.3, COUL.boisGris, { x: xE, y: hauteur(xE, z) + 0.75, z: z + 1.1, rz: (k.rng() - 0.5) * 0.2 }, M.mat, { nuance: 0.06 });
  }
  // La lanterne et le seau du pêcheur, au pied de l'épi
  lanterne(c, xE - 0.3, hauteur(xE - 0.3, 25.5), 25.5);
  seau(c, xE - 0.8, 25.2, COUL.jouets[1]);

  // Le bois flotté, la laisse de mer (algues sèches), quelques coquillages
  for (let i = 0; i < 16; i++) {
    const x = -34 + k.rng() * 74;
    const z = 23.6 + k.rng() * 2.6;
    boisFlotte(c, x, hauteur(x, z), z, 0.6 + k.rng() * 1.6, k.rng() * 3);
  }
  for (let i = 0; i < 40; i++) {
    const x = -34 + k.rng() * 74;
    const z = 25.2 + k.rng() * 1.0;
    c.boite(0.3 + k.rng() * 0.6, 0.03, 0.15 + k.rng() * 0.2, k.rng() < 0.5 ? 0x4a4a32 : 0x5f5a3a, { x, y: hauteur(x, z) + 0.01, z, ry: k.rng() * 3 }, M.mat, { crasse: false });
  }
  // Les oyats en pied de digue, à l'ouest
  for (let i = 0; i < 18; i++) {
    const x = -34 + k.rng() * 20;
    const z = zD + 0.6 + k.rng() * 3;
    oyats(c, x, z, hauteur(x, z), 0.8);
  }
}

/** La mer : une nappe d'eau verte qui laisse voir le sable, l'écume qui respire au bord. */
function mer(k, x0, x1, z1) {
  const { b, c, M } = k;
  const zM = 26.6;
  c.pave(x0, Y_MER - 0.02, zM, x1, Y_MER, z1, 0xffffff, M.mer, { crasse: false, nuance: 0 });
  const e = new Chantier(77);
  // le bord de l'eau
  for (let x = x0 + 0.5; x < x1 - 0.5; x += e.entre(1.2, 2.2)) {
    let zz = zM;
    for (let z = Z_DIGUE; z < z1; z += 0.2) if (hauteur(x, z) <= Y_MER) {
      zz = z;
      break;
    }
    e.boite(e.entre(0.8, 1.8), 0.03, e.entre(0.3, 0.7), 0xffffff, { x, y: Y_MER + 0.02, z: Math.max(zM, zz) + e.entre(-0.1, 0.4), ry: e.entre(-0.3, 0.3) }, M.ecume, { crasse: false, nuance: 0.05 });
  }
  // les rouleaux qui arrivent du large
  for (let i = 0; i < 14; i++) {
    const x = e.entre(x0 + 3, x1 - 3);
    const z = e.entre(zM + 2, z1 - 1);
    e.boite(e.entre(3, 7), 0.04, 0.22, 0xf4f6f4, { x, y: Y_MER + 0.025, z, ry: e.entre(-0.08, 0.08) }, M.ecume, { crasse: false, nuance: 0 });
  }
  // autour des pieux de l'épi
  for (let z = zM; z < z1 - 0.5; z += 1.2) e.boite(0.9, 0.03, 0.3, 0xffffff, { x: -10, y: Y_MER + 0.02, z }, M.ecume, { crasse: false, nuance: 0 });
  const ecume = e.construire();
  ecume.name = "écume";
  ecume.userData.animer = (t) => {
    ecume.position.y = Math.sin(t * 0.9) * 0.04;
    ecume.position.z = Math.sin(t * 0.45) * 0.35;
    M.ecume.opacity = 0.5 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.9 + 1));
  };
  b.ajouter(ecume);
}
