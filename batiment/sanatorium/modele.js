// Le sanatorium d'altitude des Hauts-Soleils (nouveau lieu, Montagne et forêt, lointain, danger ●●●).
//
// Un long paquebot blanc des années 1930 accroché à la pente, orienté plein sud vers la vallée : quatre niveaux en
// gradins, chacun bordé de sa galerie de cure, profonde terrasse couverte où les chaises longues de bois sont encore
// alignées face au vide sous leurs plaids moisis. Garde-corps tubulaires, enduit blanc qui tombe par plaques et laisse
// voir la brique, tour centrale au nom de bronze (le dernier S est tombé), cage d'escalier ronde au bout est.
// Autour : le parc en pente douce envahi de sapins et de mélèzes dorés, des plaques de neige à l'ombre, le kiosque à
// musique, la gare du téléphérique et sa cabine immobile au-dessus du vide, la chaufferie de brique et sa cheminée.
// L'Abondance : la « Cure Détox Digitale Premium » qui avait racheté le lieu juste avant la Grande Panne (kakemonos,
// « Ici, pas de réseau. Enfin. », casiers à téléphones, casques « Montagne apaisante » sur les chaises longues).
//
// Deux cartes (budget : ≤ 60 000 triangles, ≤ 40 appels de dessin chacune) :
// - « galeries » : la façade, la galerie de cure du rez-de-chaussée, le parc, le kiosque, la gare du téléphérique et
//   la chaufferie (le rez-de-chaussée y est fermé : portes-fenêtres condamnées, sauf la porte du hall) ;
// - « interieur » : le rez-de-chaussée (chambres-cellules, bibliothèque des malades, salon de musique, hall,
//   réfectoire, radiologie, pharmacie, couloir) et la galerie de cure devant.
// Les deux cartes partagent le même bâtiment, aux mêmes coordonnées « site » (S) ; chacune est recentrée sur son lot.
//
// Repère S : +x à l'est, +z au sud. Bâtiment de x = -30 à 30 ; mur nord à z = -11 ; façade du rez-de-chaussée à
// z = 0 ; galerie du rez-de-chaussée de z = 0 à 4,5. Les étages reculent vers le nord (gradins) ; la colline monte
// derrière, le parc descend doucement vers le belvédère (z = 39). On ne visite que le rez-de-chaussée : le haut des
// murs, les étages et les toits forment des couches qui s'effacent.

import * as THREE from "three";
import {
  Batiment, Chantier, mur, lierre as lierreA, touffes, semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA,
  mousse, raiDeLumiere as raiA, flaque, aleatoire,
} from "../commun/atelier.js";
import { COUL, R, matieres, panneau } from "./textures.js";
import {
  cylindre, plan, BOULE, chaiseLongue, gueridon, lanterne, buches, litFer, tableNuit, crachoir, armoire, chaise, fauteuil,
  rayonnage, livresAuSol, piano, gramophone, pupitre, tableLongue, banc, vaisselle, poele, appareilRX, pupitreRX, paravent,
  armoirePharmacie, balance, sapin, meleze, plaqueNeige,
} from "./mobilier.js";

// La végétation et le petit désordre coûtent cher en triangles : on les dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.15));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.2), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.4), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.3), t, y);
// Un seul matériau de lueur pour tous les rais de lumière
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.09);

const AIGUILLES = [0xc29a42, 0xb08a3c, 0x9c7a45, 0xd0ac55];

// ---------- Les cartes ----------

/** Centre de chaque carte dans le repère S (l'origine d'une carte est le centre de son lot). */
const CENTRES = { galeries: { x: 5, z: 8 }, interieur: { x: 1, z: -2 } };

function versCarte(id, points) {
  const o = CENTRES[id];
  return points.map((p) => ({ ...p, x: Math.round((p.x - o.x) * 10) / 10, z: Math.round((p.z - o.z) * 10) / 10 }));
}

export const FICHE = {
  id: "sanatorium",
  nom: "Le sanatorium des Hauts-Soleils",
  lieu: "Nouveau lieu · Montagne et forêt · lointain",
  environnement: "montagne",
  anneau: "lointain",
  danger: 3,
  recit:
    "On y montait guérir ses poumons avec du soleil, du silence et de l'air pur, allongé des heures sur les galeries face à la vallée. Juste avant la Grande Panne, la Cure Détox Digitale Premium avait racheté les lieux pour vendre aux citadins épuisés une semaine « sans réseau », casque de montagne apaisante sur les yeux. Le réseau a disparu partout ; certains curistes sont restés allongés sous leur plaid, raides de froid, toujours tournés vers la vallée.",
  inspiration:
    "Le sanatorium de Plateau d'Assy, Zonnestraal (modernisme blanc), Paimio d'Alvar Aalto (galeries de cure en gradins, cage d'escalier ronde), Beelitz-Heilstätten (brique), les grands sanatoriums Art déco des Alpes laissés à l'abandon ; les photographies d'urbex des galeries aux chaises longues alignées",
  reperes: [
    "La silhouette : un long bâtiment blanc en gradins orienté plein sud, quatre galeries de cure superposées, garde-corps tubulaires, tour centrale au nom de bronze (« LES HAUTS-SOLEIL », le S est tombé, un O pend)",
    "Les galeries : des dizaines de chaises longues de bois encore alignées face au vide, plaids moisis, casques de réalité virtuelle « Montagne apaisante » posés sur les dossiers",
    "L'enduit blanc qui tombe par plaques et laisse voir la brique, les coulures sous les dalles, un pan du toit-terrasse effondré sur la dernière galerie",
    "L'Abondance : kakemonos « Cure Détox Digitale Premium », panneau « Ici, pas de réseau. Enfin. », casier à téléphones, station de recharge des casques (Watty sourit, les batteries sont à 0 %)",
    "Le parc envahi de sapins et de mélèzes dorés, les plaques de neige à l'ombre, la colline qui monte derrière",
    "La gare du téléphérique et sa cabine bleu-vert immobile au-dessus du vide, un câble rompu ; le kiosque à musique et ses pupitres renversés ; le belvédère et sa longue-vue PANORAMA+",
    "La chaufferie de brique à la verrière effondrée, sa cheminée, la chaudière et le tas de charbon (les Charbonniers)",
    "À l'intérieur : chambres-cellules (lit de fer, crachoir émaillé), bibliothèque des malades, salon de musique et son piano droit, réfectoire et son poêle rallumé, radiologie (appareil à rayons X, paravent, négatoscope), pharmacie",
    "Le graffiti des survivants sur la galerie : « GELÉS SUR LES CHAISES — PAS DE FEU ICI ! »",
  ],
  cartes: [
    {
      id: "galeries",
      nom: "La façade et les galeries de cure",
      lot: { l: 94, p: 64 },
      depart: versCarte("galeries", [{ x: 0, z: 9 }])[0],
      description: "la galerie de cure, le parc, le kiosque à musique, la gare du téléphérique et la chaufferie",
      entrees: versCarte("galeries", [
        { x: 52, z: 12, nature: "le chemin forestier qui monte de la vallée, à l'est du parc" },
        { x: -42, z: -11.8, nature: "la route de service, derrière le sanatorium (à l'ouest)" },
        { x: -30, z: 33, nature: "le quai du téléphérique (la cabine pend à 1,6 m du sol : on y grimpe depuis un banc)" },
        { x: 0, z: 0, nature: "la porte du hall, sous la galerie (vers la carte « l'intérieur »)" },
        { x: 41, z: -3, nature: "la grande porte de la chaufferie" },
      ]),
      fouille: versCarte("galeries", [
        { x: -14, z: 2.6, quoi: "chaises longues de la galerie : bois sec, toile ; plaids et couvertures (à faire sécher : la chaleur vaut de l'or en montagne)" },
        { x: -12, z: 2.6, quoi: "casque de réalité virtuelle « Montagne apaisante » : batterie, lentilles, petit écran" },
        { x: -19.5, z: 0.7, quoi: "station de recharge Montagne Apaisante : batterie tampon, panneau solaire, câbles" },
        { x: 4, z: 0.7, quoi: "casier à téléphones : une quarantaine de téléphones morts (batteries, composants)" },
        { x: -8.2, z: 1.0, quoi: "campement de la galerie : lanterne, pétrole, couvertures, gamelle, bois sec" },
        { x: 39.8, z: -10.2, quoi: "tas de charbon de la chaufferie (les Charbonniers en donnent cher)" },
        { x: 41.2, z: -7, quoi: "chaudière : clés, manomètres, tuyaux de cuivre ; braises à entretenir" },
        { x: 38.8, z: -6.5, quoi: "bûcher de la chaufferie : réserve de bois sec" },
        { x: -32.2, z: 25, quoi: "guichet du téléphérique : caisse, trousse de secours du liftier, lampe tempête" },
        { x: -35.5, z: 24.5, quoi: "machinerie du téléphérique : câble d'acier, poulies, graisse" },
        { x: -33.9, z: 34.2, quoi: "cabine du téléphérique : vitres, sièges, extincteur, couverture de survie" },
        { x: 12, z: 24, quoi: "kiosque à musique : pupitres (métal), grosse caisse (peau, bois), chaises" },
        { x: 13.5, z: 38.1, quoi: "longue-vue PANORAMA+ : lentilles, batterie, lecteur de bracelet" },
      ]),
      eteints: versCarte("galeries", [
        { x: -16, z: 2.6, type: "gelé (sous un plaid, sur une chaise longue)" },
        { x: 17.2, z: 2.6, type: "gelé (sous un plaid, sur une chaise longue)" },
        { x: -27.2, z: 2.6, type: "gelé (casque sur les yeux, sur une chaise longue)" },
        { x: 6, z: 14, type: "errant" },
        { x: -14, z: 18, type: "errant" },
        { x: 28, z: 22, type: "errant" },
        { x: -27, z: 31, type: "rampant (dans les herbes, près de la gare)" },
        { x: 2, z: 6, type: "ancien habitant (coach détox en polaire, sifflet au cou)" },
        { x: -36.5, z: 27, type: "ancien habitant (liftier du téléphérique)" },
        { x: 44, z: -5, type: "errant (dans la chaufferie)" },
        { x: 13.2, z: 25, type: "gelé (assis dans le kiosque)" },
      ]),
    },
    {
      id: "interieur",
      nom: "L'intérieur",
      lot: { l: 70, p: 22 },
      depart: versCarte("interieur", [{ x: 0, z: 6 }])[0],
      description: "les chambres, la bibliothèque des malades, le salon de musique, le hall, le réfectoire, la radiologie, la pharmacie",
      entrees: versCarte("interieur", [
        { x: 0, z: 6, nature: "la galerie de cure, ouverte sur le parc (vers la carte « la façade »)" },
        { x: -30, z: -10, nature: "la porte ouest du couloir (route de service)" },
        { x: 30, z: -10, nature: "la porte est du couloir (vers la chaufferie, carte « la façade »)" },
        { x: 0, z: -11, nature: "la porte nord du hall (route de service)" },
      ]),
      fouille: versCarte("interieur", [
        { x: -29.3, z: -3, quoi: "lit de fer (ferraille, ressorts), matelas de crin, couvertures de laine" },
        { x: -28.4, z: -4.6, quoi: "table de nuit : crachoir émaillé, thermomètre, carnet de cure" },
        { x: -23.6, z: -3.2, quoi: "campement d'un survivant : duvet, bougies, conserves, sac à dos" },
        { x: -20.3, z: -7.8, quoi: "armoire renversée : draps, pyjamas de laine, couvertures" },
        { x: -15.3, z: -8.4, quoi: "bibliothèque des malades : livres (savoir), atlas, traités de botanique" },
        { x: -7.5, z: -8.3, quoi: "piano droit : bois, cordes d'acier, feutres" },
        { x: -5, z: -7.9, quoi: "gramophone et disques" },
        { x: 8, z: -2.6, quoi: "vaisselle émaillée, couverts, brocs" },
        { x: 11, z: -4.6, quoi: "poêle en fonte rallumé : chaleur, cuisine (attention aux gelés)" },
        { x: 12.6, z: -5.2, quoi: "réserve de bois du poêle" },
        { x: 20.3, z: -5.5, quoi: "appareil à rayons X : plomb, câbles, moteur de la colonne" },
        { x: 21, z: -8.5, quoi: "batterie de voiture qui alimente le négatoscope (encore quelques Wh)" },
        { x: 29.2, z: -5.5, quoi: "armoire de la pharmacie : sulfamides, teinture d'iode, alcool, bandes, seringues de verre" },
        { x: 25, z: -2.2, quoi: "balance médicale (laiton, poids)" },
        { x: 6, z: -10.5, quoi: "réserve de bois des survivants, dans le couloir" },
        { x: -2.9, z: -5, quoi: "comptoir d'accueil : registres des curistes, trousseau de clés, brochures Détox" },
        { x: -14, z: 2.6, quoi: "chaises longues et plaids de la galerie" },
      ]),
      eteints: versCarte("interieur", [
        { x: 14.5, z: -4.4, type: "errant (réfectoire)" },
        { x: -10, z: -10, type: "errant (couloir)" },
        { x: -17, z: -5, type: "errant (entre les rayonnages)" },
        { x: -7.5, z: -7.4, type: "gelé (assis sur le tabouret du piano)" },
        { x: -29.3, z: -3, type: "gelé (dans son lit)" },
        { x: 7, z: -6.6, type: "rampant (sous une table du réfectoire)" },
        { x: -1, z: -3, type: "ancien habitant (infirmière de cure, thermomètre en poche)" },
        { x: 22.5, z: -6, type: "ancien habitant (radiologue, tablier de plomb)" },
        { x: 27, z: -4, type: "putréfié (pharmacie)" },
        { x: -16, z: 2.6, type: "gelé (sous un plaid, galerie)" },
      ]),
    },
  ],
};

// ---------- Mesures ----------

const XO = -30; // pignon ouest
const XE = 30; // pignon est
const ZN = -11; // mur nord
const ZK = -9; // cloison du couloir
const NIV = [0, 3.4, 6.8, 10.2]; // sol de chaque niveau
const TOIT = 13.6;
const DAL = 0.3; // épaisseur des dalles
const HM = NIV[1] - DAL; // hauteur des murs d'un niveau (3,1 m)
const FACE = [0, -1.5, -4.5, -7.5]; // façade de chaque niveau (les gradins)
const BORD = [4.5, 4.5, 1.5, -1.5]; // garde-corps de la galerie de chaque niveau
const AV = [4.6, 1.6, -1.4, -4.4]; // la dalle au-dessus du niveau i s'avance jusqu'à z = AV[i]
const CUT = 0.9; // coupe des façades côté caméra (hauteur d'allège)
const CUTI = 1.2; // coupe des cloisons
const EP = 0.3;
const EPI = 0.16;
const MODULE = 3.75; // largeur d'une chambre des étages

// ---------- Outils ----------

function repereMur(a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return { L: Math.hypot(dx, dz), ry: -Math.atan2(dz, dx), dx, dz };
}

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

function tranche(ouvertures, p0, p1) {
  return ouvertures
    .filter((o) => o.haut > p0 + 0.01 && o.bas < p1 - 0.01)
    .map((o) => ({ u: o.u, l: o.l, type: "vide", bas: Math.max(0, o.bas - p0), haut: Math.min(p1 - p0 + 0.5, o.haut - p0) }));
}

/**
 * Un mur coupé : le bas (0 → `cut`) reste toujours visible (chantier `bas`), le haut va dans la couche `haut`. Les
 * fenêtres (`type: "fenetre"`) sont garnies d'un châssis d'acier ; les obstacles suivent les ouvertures qui descendent
 * au sol, sauf celles marquées `ferme`.
 */
function murCoupe(k, a, b, spec) {
  const { h, cut = CUT, y0 = 0, ouvertures = [], breches = [], obstacles = true, bas = k.c, haut = k.T, ep = EP, ...reste } = spec;
  if (cut > 0) mur(bas, a, b, { ...reste, ep, y0, h: Math.min(cut, h), ouvertures: tranche(ouvertures, 0, cut) });
  if (h > cut) mur(cut > 0 ? haut : bas, a, b, { ...reste, ep, y0: y0 + cut, h: h - cut, ouvertures: tranche(ouvertures, cut, h), breches });
  const { L, ry, dx, dz } = repereMur(a, b);
  for (const o of ouvertures) {
    if (o.type !== "fenetre") continue;
    const ch = cut > 0 && o.bas >= cut - 0.02 ? haut : bas;
    ch.repere({ x: a[0], y: y0, z: a[1], ry }, () => baie(ch, k.m, o, ep, o.bris ?? k.bris));
  }
  if (obstacles && y0 < 0.5) {
    const trous = ouvertures.filter((o) => o.bas < 0.5 && o.haut > 0.5 && !o.ferme).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
    for (const [u1, u2] of soustraire(0, L, trous)) k.b.obstacle(a[0] + (dx * u1) / L, a[1] + (dz * u1) / L, a[0] + (dx * u2) / L, a[1] + (dz * u2) / L);
  }
}

/** Une baie à châssis d'acier (repère du mur : +x le long du mur, +z dehors), en vrai relief : fenêtres basses. */
function baie(ch, m, o, ep, bris) {
  const { u, l, bas, haut } = o;
  const h = haut - bas;
  const f = 0.06;
  const col = o.cadre ?? COUL.cadre;
  const zc = ep / 2 - 0.1;
  ch.pave(u - l / 2, bas, zc - 0.03, u - l / 2 + f, haut, zc + 0.03, col, m.tole);
  ch.pave(u + l / 2 - f, bas, zc - 0.03, u + l / 2, haut, zc + 0.03, col, m.tole);
  ch.pave(u - l / 2, haut - f, zc - 0.03, u + l / 2, haut, zc + 0.03, col, m.tole);
  ch.pave(u - l / 2, bas, zc - 0.03, u + l / 2, bas + f, zc + 0.03, col, m.tole);
  const imp = bas + h * 0.7;
  ch.pave(u - l / 2, imp - 0.025, zc - 0.025, u + l / 2, imp + 0.025, zc + 0.025, col, m.tole);
  const nv = l > 1.25 ? 1 : 0;
  if (nv) ch.pave(u - 0.025, bas, zc - 0.025, u + 0.025, imp, zc + 0.025, col, m.tole);
  if (bas > 0.2) ch.pave(u - l / 2 - 0.06, bas - 0.06, -0.02, u + l / 2 + 0.06, bas, ep / 2 + 0.07, COUL.blancGris, m.enduit);
  const lc = l / (nv + 1);
  const vitres = [];
  for (let i = 0; i <= nv; i++) vitres.push([u - l / 2 + lc * (i + 0.5), lc, (bas + imp) / 2, imp - bas]);
  vitres.push([u, l, (imp + haut) / 2, haut - imp]);
  for (const [x, lw, y, hh] of vitres) {
    const r = ch.hasard();
    if (r > bris) ch.poser(plan(), m.verre, 0xffffff, { x, y, z: zc, e: [lw - 0.06, hh - 0.06, 1] }, { crasse: false, nuance: 0 });
    else if (r > bris * 0.5) ch.poser(plan(), m.verre, 0xffffff, { x, y: y - hh * 0.3, z: zc, e: [lw - 0.06, hh * 0.35, 1] }, { crasse: false, nuance: 0 });
  }
  if (o.rideau) ch.boite(l - 0.1, h - 0.1, 0.03, o.rideau, { x: u, y: (bas + haut) / 2, z: -ep / 2 + 0.03 }, m.toile, { crasse: false, nuance: 0.05 });
}

/** Une baie plate (étages, vus de loin) : le châssis vient de l'atlas, une vitre plane derrière. */
function baiePlate(ch, m, o, ep, bris) {
  const { u, l, bas, haut } = o;
  const h = haut - bas;
  const y = (bas + haut) / 2;
  const r = ch.hasard();
  if (r > bris * 0.7) ch.poser(plan(), m.verre, 0xffffff, { x: u, y, z: ep / 2 - 0.14, e: [l - 0.04, h - 0.04, 1] }, { crasse: false, nuance: 0 });
  panneau(ch, m.enseignes, r < bris * 0.22 ? R.chassisCasse : o.porte ? R.chassisP : R.chassisF, { x: u, y, z: ep / 2 - 0.12 }, l, h);
  if (!o.porte) ch.pave(u - l / 2 - 0.05, bas - 0.05, ep / 2 - 0.12, u + l / 2 + 0.05, bas, ep / 2 + 0.06, COUL.blancGris, m.enduit);
}

/** Un vantail de porte-fenêtre vitré, ouvert vers l'intérieur (repère du mur). */
function vantailVitre(ch, m, u, l, h, ep, angle) {
  ch.repere({ x: u - l / 2 + 0.03, z: -ep / 2 + 0.02, ry: angle }, () => {
    const lv = l - 0.06;
    ch.boite(0.05, h, 0.04, COUL.cadre, { x: 0.025, y: h / 2 }, m.tole);
    ch.boite(0.05, h, 0.04, COUL.cadre, { x: lv - 0.025, y: h / 2 }, m.tole);
    ch.boite(lv, 0.05, 0.04, COUL.cadre, { x: lv / 2, y: h - 0.025 }, m.tole);
    ch.boite(lv, 0.55, 0.04, COUL.cadre, { x: lv / 2, y: 0.275 }, m.tole);
    if (ch.hasard() < 0.5) ch.poser(plan(), m.verre, 0xffffff, { x: lv / 2, y: (h + 0.55) / 2, e: [lv - 0.1, h - 0.65, 1] }, { crasse: false, nuance: 0 });
  });
}

/** Une porte-fenêtre condamnée : contreplaqué et planches clouées en travers (repère du mur). */
function condamnee(ch, m, u, l, h, ep) {
  ch.boite(l - 0.04, h - 0.04, 0.03, 0x6e6658, { x: u, y: h / 2, z: ep / 2 - 0.06 }, m.mat, { nuance: 0.05 });
  for (let i = 0; i < 3; i++) ch.boite(l + 0.3, 0.16, 0.04, 0x8a8274, { x: u, y: 0.5 + i * 0.75, z: ep / 2 + 0.03, rz: (i % 2 ? 1 : -1) * 0.14 }, m.mat, { nuance: 0.1 });
}

/** Ajoute au chantier une géométrie déjà prête (position, normal, uv, color ; non indexée). */
function poserBrut(c, geo, mat) {
  let lot = c.lots.get(mat);
  if (!lot) c.lots.set(mat, (lot = []));
  lot.push(geo);
}

function distSeg(px, pz, [ax, az], [bx, bz]) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - ax - t * dx, pz - az - t * dz);
}

/** La colline qui monte derrière le sanatorium (au nord du mur de soutènement). */
function hauteurColline(x, z) {
  const t = Math.max(0, -12.5 - z);
  const f = Math.min(1, t / 2.5);
  return 1.6 + t * 0.62 + f * (0.55 * Math.sin(x * 0.19 + 1.3) + 0.4 * Math.sin(x * 0.071 - z * 0.33) + 0.25 * Math.sin(z * 0.9 + x * 0.05));
}

/** Ce point est-il dans le lot de la carte ? */
function dansLot(k, x, z, marge = 0) {
  const o = CENTRES[k.id];
  const lot = FICHE.cartes.find((q) => q.id === k.id).lot;
  return Math.abs(x - o.x) <= lot.l / 2 + marge && Math.abs(z - o.z) <= lot.p / 2 + marge;
}

// ---------- Le bâtiment ----------

export function creer({ usure = 0.7, carte } = {}) {
  const id = carte === "interieur" ? "interieur" : "galeries";
  const b = new Batiment(1936, usure);
  const m = matieres();
  // Les étages, le haut des murs du rez-de-chaussée, les tours : s'effacent quand on entre dans le bâtiment.
  const T = b.couche("étages", { x: 0, z: -5.5, l: 61, p: 11.4 }, CUT, 21);
  // La dalle au-dessus de la galerie de cure et ce qui est posé dessus (galerie du 1er étage).
  const G = b.couche("galerie", { x: 0, z: 2.35, l: 61, p: 4.9 }, NIV[1] - DAL, 5.4);
  const k = { b, c: b.c, T, G, m, usure, id, ext: id === "galeries", int: id === "interieur", bris: 0.2 + 0.65 * usure };
  if (k.ext) k.S = b.couche("gare", { x: -35.5, z: 26.9, l: 9.8, p: 11 }, CUT, 7.4);

  sols(k);
  rezDeChaussee(k);
  etages(k);
  tourCentrale(k);
  tourRonde(k);
  galerieRdc(k);
  arriere(k);
  poele(k.c, 11, -4.6, HM);
  if (k.int) {
    chambres(k);
    bibliotheque(k);
    salonMusique(k);
    hall(k);
    refectoire(k);
    radiologie(k);
    pharmacie(k);
    couloir(k);
    abordsInterieur(k);
  } else {
    colline(k);
    parc(k);
    chaufferie(k);
    gare(k);
    kiosque(k);
    belvedere(k);
  }

  // Les lumières de la nuit
  b.lumiere(-8.2, 1.0, 1.0, 0xffc070, 4, 8, "lanterne de survivants sur un guéridon de la galerie");
  b.lumiere(11, 0.7, -4.0, 0xff8a3a, 5, 9, "poêle en fonte rallumé dans le réfectoire");
  b.lumiere(-19.5, 1.5, 0.9, 0x8fe0ff, 2.5, 4, "station de recharge Montagne Apaisante (panneau solaire, une LED encore allumée)");
  if (k.ext) {
    b.lumiere(40.6, 0.9, -8.2, 0xff7a2a, 4, 7, "braises dans la porte de la chaudière");
    b.lumiere(-32.2, 1.3, 25.1, 0xffc070, 3, 6, "lampe tempête sur le guichet du téléphérique");
  } else {
    b.lumiere(-25.3, 0.85, -2.3, 0xffb050, 3, 5, "bougie sur la table de nuit d'une chambre");
    b.lumiere(21, 1.6, -8.4, 0xd8ecff, 3, 5, "négatoscope rebranché sur une batterie de voiture");
  }

  // Recentrer sur le lot de la carte : la géométrie, et les données de jeu.
  const o = CENTRES[id];
  const groupe = b.construire();
  for (const enfant of groupe.children) enfant.position.set(-o.x, 0, -o.z);
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

// ---------- Sols ----------

function sols(k) {
  const { c, m } = k;
  // La galerie de cure : granito ; son bord, une marche de béton à peine marquée
  c.pave(XO - 0.2, 0, 0, XE + 0.2, 0.04, 4.6, COUL.granito, m.carrelage, { crasse: false, nuance: 0 });
  c.pave(XO - 0.2, 0, 4.6, XE + 0.2, 0.07, 4.85, COUL.blancGris, m.enduit, { nuance: 0.02 });
  if (k.int) {
    const sol = (x1, x2, z1, z2, couleur, mat) => c.pave(x1, 0, z1, x2, 0.04, z2, couleur, mat, { crasse: false, nuance: 0 });
    sol(XO, -4, ZK, 0, COUL.parquet, m.parquet);
    sol(-4, XE, ZK, 0, COUL.granito, m.carrelage);
    sol(XO, XE, ZN, ZK, 0xcfc8b4, m.carrelage);
  } else c.pave(XO, 0, ZN, XE, 0.04, 0, COUL.granito, m.carrelage, { crasse: false, nuance: 0 });
}

// ---------- Le rez-de-chaussée : façades et cloisons ----------

/** Les ouvertures de la façade sud du rez-de-chaussée (u depuis le pignon ouest). */
function ouverturesSud(k) {
  const o = [];
  const fen = (x, l = 1.5, extra = {}) => o.push({ u: x + 30, l, bas: 0.9, haut: 2.7, type: "fenetre", x, ...extra });
  const pf = (x) => o.push({ u: x + 30, l: 1.3, bas: 0, haut: 2.6, type: "pf", x, ferme: k.ext });
  pf(-28.25);
  pf(-24.75);
  pf(-21.25);
  fen(-17.6);
  pf(-15.25);
  fen(-12.9);
  fen(-9.4);
  pf(-7.5);
  fen(-5.6);
  fen(-2.7, 1.0);
  o.push({ u: 30, l: 2.6, bas: 0, haut: 2.8, type: "hall", x: 0 });
  fen(2.7, 1.0);
  fen(5.6);
  fen(8.3);
  pf(11);
  fen(13.7);
  fen(16.4);
  fen(21, 1.6, { rideau: 0x1f1e1c, bris: 0.1 });
  fen(25.8);
  pf(28.2);
  return o;
}

function rezDeChaussee(k) {
  const { c, T, m } = k;
  const ext = { ep: EP, couleur: COUL.blanc, mat: m.enduit, interieur: { couleur: COUL.interieur, mat: m.enduit } };

  // Façade sud, sous la galerie
  const sud = ouverturesSud(k);
  murCoupe(k, [XO, 0], [XE, 0], { ...ext, h: HM, ouvertures: sud });
  c.repere({ x: XO, z: 0 }, () => {
    for (const o of sud) {
      if (o.type === "pf") {
        if (k.ext) condamnee(c, m, o.u, o.l, o.haut, EP);
        else vantailVitre(c, m, o.u, o.l, o.haut, EP, 0.9 + c.hasard() * 0.7);
      }
      if (o.type === "hall") {
        vantailVitre(c, m, o.u - 0.65, 1.3, 2.75, EP, 1.4);
        c.repere({ x: o.u + 1.3, z: -EP / 2 + 0.02, ry: Math.PI }, () => vantailVitre(c, m, 0.65, 1.3, 2.75, 0, 1.75 - Math.PI));
      }
    }
  });
  // Bandeau de soubassement gris sous la façade
  c.pave(XO, 0, EP / 2, XE, 0.35, EP / 2 + 0.04, COUL.blancGris, m.enduit, { nuance: 0.02 });

  // Pignon est (vers la cage d'escalier ronde et la chaufferie)
  murCoupe(k, [XE, 0], [XE, ZN], { ...ext, h: HM, ouvertures: [{ u: 2.2, l: 1.4, bas: 0.9, haut: 2.6, type: "fenetre" }, { u: 10, l: 1.2, bas: 0, haut: 2.3, type: "vide" }] });
  // Pignon ouest (route de service)
  murCoupe(k, [XO, ZN], [XO, 0], { ...ext, h: HM, ouvertures: [{ u: 1, l: 1.2, bas: 0, haut: 2.3, type: "vide" }, { u: 7, l: 1.4, bas: 0.9, haut: 2.6, type: "fenetre" }] });
  // Mur nord (côté colline) : fenêtres du couloir, porte du hall
  const nord = [];
  for (let x = -28; x <= 28; x += 4) if (x !== 0) nord.push({ u: 30 - x, l: 1.2, bas: 1.3, haut: 2.6, type: "fenetre", bris: k.bris * 0.6 });
  nord.push({ u: 30, l: 1.6, bas: 0, haut: 2.4, type: "vide" });
  murCoupe(k, [XE, ZN], [XO, ZN], { ...ext, h: HM, cut: 0, ouvertures: nord });

  // Les cloisons : le couloir au nord, les salles au sud
  const cloison = { ep: EPI, couleur: COUL.interieur, mat: m.enduit, cut: CUTI };
  const portes = [-28.6, -25, -21.6, -13, -9.5, 6, 16, 21, 26].map((x) => ({ u: x + 30, l: 1.1, bas: 0, haut: 2.25, type: "vide" }));
  portes.push({ u: 30, l: 4.4, bas: 0, haut: 2.6, type: "vide" });
  murCoupe(k, [XO, ZK], [XE, ZK], { ...cloison, h: HM, ouvertures: portes });
  for (const x of [-26.5, -23, -19.5, -11, -4, 4, 18, 24]) {
    const ouv = x === -11 ? [{ u: 7.6, l: 1.0, bas: 0, haut: 2.2, type: "vide" }] : x === 4 ? [{ u: 7, l: 1.6, bas: 0, haut: 2.4, type: "vide" }] : [];
    murCoupe(k, [x, ZK], [x, 0], { ...cloison, h: HM, ouvertures: ouv, couleur: x >= 4 ? COUL.interieurCreme : COUL.interieur });
  }
}

// ---------- Les étages en gradins (couches) ----------

function ouverturesEtage(x1, x2) {
  const o = [];
  for (let j = 0; j < 16; j++) {
    const x0 = XO + j * MODULE;
    for (const [dx, porte] of [[1.0, true], [2.55, false]]) {
      const x = x0 + dx;
      if (x < x1 + 0.8 || x > x2 - 0.8) continue;
      o.push(porte ? { u: x - x1, l: 1.2, bas: 0, haut: 2.45, porte: true } : { u: x - x1, l: 1.5, bas: 0.85, haut: 2.45 });
    }
  }
  return o;
}

/** Un garde-corps tubulaire le long de x, à z, au niveau y ; des travées manquent, une lisse pend. */
function gardeCorps(ch, m, z, y, x1, x2, r, usure) {
  const pas = 2;
  const n = Math.round((x2 - x1) / pas);
  const manque = [];
  for (let i = 0; i < n; i++) manque.push(r() < 0.04 + 0.14 * usure);
  for (let i = 0; i <= n; i++) {
    if (manque[i - 1] && manque[i]) continue;
    ch.boite(0.05, 1.08, 0.05, COUL.garde, { x: x1 + i * pas, y: y + 0.54, z }, m.tole, { nuance: 0.04 });
  }
  let debut = null;
  for (let i = 0; i <= n; i++) {
    const plein = i < n && !manque[i];
    if (plein && debut === null) debut = i;
    if (!plein && debut !== null) {
      const xa = x1 + debut * pas;
      const xb = x1 + i * pas;
      ch.tube([xa, y + 1.05, z], [xb, y + 1.05, z], 0.03, COUL.garde, m.tole, 5);
      for (const yy of [0.38, 0.7]) ch.tube([xa, y + yy, z], [xb, y + yy, z], 0.018, COUL.garde, m.tole, 4);
      debut = null;
    }
    if (i < n && manque[i] && r() < 0.5) {
      // la lisse arrachée pend dans le vide
      const xa = x1 + i * pas;
      ch.tube([xa, y + 1.05, z], [xa + 1.2, y - 0.6, z + 0.25], 0.03, COUL.garde, m.tole, 5);
    }
  }
}

function etages(k) {
  const { T, G, m, usure } = k;
  const r = aleatoire(311);
  const dalle = (ch, x1, z1, x2, z2, y) => ch.pave(x1, y - DAL, z1, x2, y, z2, COUL.blanc, m.enduit, { nuance: 0.02, crasse: false });
  // Les planchers et les auvents : chaque dalle s'avance au-dessus de la galerie du dessous
  dalle(T, XO - 0.2, ZN - 0.2, XE + 0.2, 0, NIV[1]);
  dalle(G, XO - 0.2, 0, XE + 0.2, AV[0], NIV[1]);
  dalle(T, XO - 0.2, ZN - 0.2, XE + 0.2, AV[1], NIV[2]);
  dalle(T, XO - 0.2, ZN - 0.2, XE + 0.2, AV[2], NIV[3]);
  const effondre = usure > 0.45;
  if (effondre) {
    dalle(T, XO - 0.2, ZN - 0.2, -25, AV[3], TOIT);
    dalle(T, -21, ZN - 0.2, XE + 0.2, AV[3], TOIT);
    dalle(T, -25, ZN - 0.2, -21, -9.6, TOIT);
    // le pan tombé sur la dernière galerie, ses fers tordus, les gravats
    T.boite(4.1, 0.3, 3.6, COUL.blanc, { x: -23, y: NIV[3] + 1.25, z: -6.2, rx: 0.62, rz: 0.08 }, m.enduit, { nuance: 0.03 });
    for (let i = 0; i < 5; i++) T.poutre([-24.6 + i * 0.8, TOIT - 0.15, -9.6], [-24.4 + i * 0.8 + r() * 0.3, TOIT - 0.9 - r() * 0.8, -8.6 - r() * 0.6], 0.03, 0x6e3a22, m.tole);
    gravats(T, -23, -3.6, 1.6, 16, [COUL.blanc, 0xd8d2c4, 0xa05a43], NIV[3]);
  } else dalle(T, XO - 0.2, ZN - 0.2, XE + 0.2, AV[3], TOIT);
  // L'acrotère du toit-terrasse
  for (const [x1, x2] of effondre ? [[XO - 0.2, -25], [-21, XE + 0.2]] : [[XO - 0.2, XE + 0.2]]) T.pave(x1, TOIT, AV[3] - 0.16, x2, TOIT + 0.5, AV[3], COUL.blanc, m.enduit, { nuance: 0.02, crasse: false });
  T.pave(XO - 0.2, TOIT, ZN - 0.2, XE + 0.2, TOIT + 0.5, ZN - 0.04, COUL.blanc, m.enduit, { crasse: false });
  // Le mur nord des étages, et le fond sombre des chambres vu par les fenêtres
  T.pave(XO, HM, ZN - 0.15, XE, TOIT - DAL, ZN + 0.15, COUL.blanc, m.enduit, { nuance: 0.02, crasse: false });
  for (let i = 1; i <= 3; i++) T.pave(XO, NIV[i], ZN + 0.15, XE, NIV[i] + HM, ZN + 0.17, COUL.sombre, m.enduit, { crasse: false });

  for (let i = 1; i <= 3; i++) {
    const y0 = NIV[i];
    const z = FACE[i];
    const ch = i === 1 ? G : T;
    // La façade de l'étage (coupée par la tour au dernier niveau)
    const segs = i === 3 ? [[XO, -4], [4, XE]] : [[XO, XE]];
    for (const [x1, x2] of segs) {
      const breches = i === 3 && x1 === XO && effondre ? [{ u: 7, l: 3.6, profondeur: 2.3 }] : [];
      const ouv = ouverturesEtage(x1, x2).filter((o) => !breches.some((bb) => Math.abs(o.u - bb.u) < bb.l / 2 + o.l / 2));
      mur(T, [x1, z], [x2, z], { h: HM, y0, ep: EP, couleur: COUL.blanc, mat: m.enduit, ouvertures: ouv.map((o) => ({ ...o, type: "vide" })), breches });
      T.repere({ x: x1, y: y0, z }, () => {
        for (const o of ouv) baiePlate(T, m, o, EP, k.bris);
      });
    }
    // Les cloisons des chambres
    for (let j = 1; j < 16; j++) {
      const x = XO + j * MODULE;
      if (i === 3 && Math.abs(x) < 4.3) continue;
      T.pave(x - 0.07, y0, ZN + 0.15, x + 0.07, y0 + HM, z - EP / 2, COUL.sombre, m.enduit, { crasse: false });
    }
    // Les pignons de l'étage (en gradins), une fenêtre chacun
    for (const [x, s] of [[XO, -1], [XE, 1]]) {
      T.pave(x - 0.15, y0, ZN, x + 0.15, y0 + HM, z - EP / 2, COUL.blanc, m.enduit, { nuance: 0.02 });
      const zm = (ZN + z) / 2;
      T.poser(plan(), m.verre, 0xffffff, { x: x + s * 0.16, y: y0 + 1.65, z: zm, ry: (s * Math.PI) / 2, e: [1.3, 1.5, 1] }, { crasse: false, nuance: 0 });
      panneau(T, m.enseignes, R.chassisF, { x: x + s * 0.17, y: y0 + 1.65, z: zm, ry: (s * Math.PI) / 2 }, 1.3, 1.5);
    }
    // Les ailerons qui coupent le vent : pleine hauteur sous l'auvent, puis parapet jusqu'au garde-corps
    const ailerons = i === 3 ? [XO, -15, -4.15, 4.15, 15, XE] : [XO, -15, 15, XE];
    for (const x of ailerons) {
      const z0 = i === 3 && Math.abs(x) < 5 ? -6.8 : z + EP / 2;
      ch.pave(x - 0.09, y0, z0, x + 0.09, y0 + HM, AV[i], COUL.blanc, m.enduit, { nuance: 0.02 });
      ch.pave(x - 0.09, y0, AV[i], x + 0.09, y0 + 1.1, BORD[i], COUL.blanc, m.enduit, { nuance: 0.02 });
    }
    // Le garde-corps tubulaire
    gardeCorps(ch, m, BORD[i] - 0.08, y0, XO, XE, r, usure);
    // Les chaises longues, face au vide
    const zc = (Math.min(AV[i], BORD[i] - 1.2) + BORD[i]) / 2 - 0.4;
    for (let x = XO + 0.9; x < XE - 0.6; x += 1.55) {
      if (ailerons.some((a) => Math.abs(a - x) < 0.6)) continue;
      const t = r();
      if (t < 0.12 + 0.2 * usure) continue;
      const renv = r() < 0.1 * usure;
      const plaid = r() < 0.35 ? COUL.plaids[Math.floor(r() * COUL.plaids.length)] : null;
      chaiseLongue(ch, x + (r() - 0.5) * 0.2, zc + (r() - 0.5) * 0.3, (r() - 0.5) * 0.2, { y: y0, simple: true, etat: renv ? "renversee" : "droite", plaid, casque: r() < 0.08 });
    }
  }

  // Les kakemonos de la Cure Détox, pendus au bord de l'auvent du 2e étage
  for (const [x, rz] of [[-20.6, 0.03], [-6.9, -0.02], [8.3, 0.02], [21.8, -0.04]]) panneau(T, m.enseignes, R.detox, { x, y: NIV[2] - DAL - 1.32, z: AV[1] + 0.03, rz }, 0.66, 2.64);
  // Les sapins qui ont pris racine dans les galeries et sur le toit
  if (usure > 0.25) {
    sapin(T, -26.3, -2.3, 1.7, NIV[2]);
    sapin(T, 18.6, -3.4, 1.3, NIV[3]);
    sapin(T, -10.5, -9.6, 2.2, TOIT);
    sapin(T, 24.5, -8.7, 1.5, TOIT);
  }
  if (usure > 0.6) {
    sapin(T, 7.4, 0.4, 1.0, NIV[2]);
    sapin(T, -2, -10, 1.2, TOIT);
  }
  mousse(T, -14, TOIT, -7.5, 2.2, Math.round(3 + 6 * usure));
  mousse(T, 12, TOIT, -6.5, 1.8, Math.round(3 + 5 * usure));
  mousse(T, 4, NIV[3], -3, 1.4, Math.round(2 + 4 * usure));
  touffes(T, [[-28, -5.2, NIV[3]], [27, -2, NIV[3]], [-12, -1, NIV[2]], [26, 2.6, NIV[2]], [8, -9.4, TOIT], [-27, -6, TOIT]], COUL.terre);
  // Une descente d'eau en zinc au pignon ouest
  T.tube([XO - 0.25, 0.2, -10.5], [XO - 0.25, TOIT, -10.5], 0.06, COUL.zinc, m.tole, 6);
  T.tube([XE + 0.25, 0.2, -10.5], [XE + 0.25, TOIT, -10.5], 0.06, COUL.zinc, m.tole, 6);
}

// ---------- La tour centrale et la cage d'escalier ronde ----------

function tourCentrale(k) {
  const { T, m } = k;
  const y0 = NIV[3];
  const y1 = 19.4;
  T.pave(-4, y0, ZN, 4, y1, -6.8, COUL.blanc, m.enduit, { nuance: 0.02, crasse: false });
  // Pilastres saillants et verrière de l'escalier (pavés de verre)
  for (const x of [-3.55, 3.55]) T.pave(x - 0.45, y0, -6.85, x + 0.45, y1 + 0.25, -6.5, COUL.blanc, m.enduit, { nuance: 0.02 });
  panneau(T, m.enseignes, R.verriere, { x: 0, y: (y0 + 0.4 + 16.6) / 2, z: -6.78 }, 2.4, 16.6 - y0 - 0.4);
  for (const y of [y0 + 0.3, 16.7]) T.pave(-1.4, y - 0.08, -6.95, 1.4, y + 0.08, -6.7, COUL.blancGris, m.enduit);
  // Le nom, les lettres de bronze ; le couronnement à redans et son soleil
  panneau(T, m.enseignes, R.titre, { x: 0, y: 17.95, z: -6.42 }, 8.6, 1.08);
  T.pave(-4.3, y1, ZN - 0.1, 4.3, y1 + 0.2, -6.4, COUL.blanc, m.enduit, { crasse: false });
  T.pave(-2.6, y1 + 0.2, -10.3, 2.6, y1 + 1.0, -7.3, COUL.blanc, m.enduit, { crasse: false });
  T.pave(-1.3, y1 + 1.0, -9.6, 1.3, y1 + 1.6, -8.0, COUL.blanc, m.enduit, { crasse: false });
  panneau(T, m.enseignes, R.soleil, { x: 0, y: y1 + 0.62, z: -7.27 }, 1.3, 1.3);
  T.tube([0, y1 + 1.6, -8.8], [0, y1 + 5.2, -8.8], 0.04, 0x8d8f8a, m.tole, 5);
  // Le grand kakemono déchiré sur la verrière
  panneau(T, m.enseignes, R.detox, { x: 0.25, y: 13.7, z: -6.66, rz: 0.035 }, 1.65, 6.6);
  // Une antenne-relais démontée par la Cure (pas de réseau, c'était promis), couchée sur le toit
  T.poutre([5.5, TOIT + 0.15, -9.5], [11.5, TOIT + 0.6, -8.6], 0.12, 0x9a9c98, m.tole);
  T.boite(0.5, 0.9, 0.12, 0xb9bbb6, { x: 9.5, y: TOIT + 0.55, z: -8.9, rx: -0.2, rz: 1.2 }, m.tole);
  T.boite(0.5, 0.9, 0.12, 0xb9bbb6, { x: 7.2, y: TOIT + 0.4, z: -9.1, rx: 0.1, rz: 1.35 }, m.tole);
}

function tourRonde(k) {
  const { c, T, m, b } = k;
  const cx = 31.8;
  const cz = -7;
  const r = 2.4;
  const h = 15.6;
  c.poser(cylindre(r, r, CUT, 12), m.enduit, COUL.blanc, { x: cx, y: CUT / 2, z: cz }, { nuance: 0.02 });
  T.poser(cylindre(r, r, h - CUT, 12), m.enduit, COUL.blanc, { x: cx, y: (CUT + h) / 2, z: cz }, { nuance: 0.02, crasse: false });
  // Les bandeaux vitrés en demi-anneau (côté sud-est), les nez de dalle
  for (let i = 0; i < 4; i++) {
    const y = NIV[i] + 1.9;
    T.poser(new THREE.CylinderGeometry(r + 0.02, r + 0.02, 1.0, 12, 1, true, -0.5, 2.6), m.verre, 0xffffff, { x: cx, y, z: cz }, { crasse: false, nuance: 0 });
    if (i > 0) T.poser(cylindre(r + 0.1, r + 0.1, 0.14, 12), m.enduit, COUL.blancGris, { x: cx, y: NIV[i] - 0.1, z: cz }, { crasse: false });
  }
  T.poser(cylindre(r + 0.35, r + 0.35, 0.25, 12), m.enduit, COUL.blanc, { x: cx, y: h + 0.12, z: cz }, { crasse: false });
  T.tube([cx + 1, h + 0.25, cz], [cx + 1, h + 1.6, cz], 0.03, 0x8d8f8a, m.tole, 4);
  lierre(c, cx + 1.6, 0, cz + 1.75, 0.75, 2.2, 5.5, Math.round(40 + 80 * k.usure));
  for (let i = 0; i < 10; i++) {
    const a1 = (i / 10) * Math.PI * 2;
    const a2 = ((i + 1) / 10) * Math.PI * 2;
    if (Math.cos(a1) < -0.6 && Math.cos(a2) < -0.6) continue; // collé au pignon
    b.obstacle(cx + Math.cos(a1) * r, cz + Math.sin(a1) * r, cx + Math.cos(a2) * r, cz + Math.sin(a2) * r);
  }
}

// ---------- La galerie de cure du rez-de-chaussée (les deux cartes) ----------

function galerieRdc(k) {
  const { c, T, G, m, usure, b } = k;
  const r = aleatoire(77);
  // Les colonnes rondes qui portent la dalle
  for (let x = -28; x <= 28; x += 4) {
    c.poser(cylindre(0.14, 0.14, HM, 8), m.enduit, COUL.blanc, { x, y: HM / 2, z: 4.32 }, { nuance: 0.02 });
    c.poser(cylindre(0.22, 0.2, 0.1, 8), m.enduit, COUL.blancGris, { x, y: HM - 0.05, z: 4.32 }, { crasse: false });
  }
  // Les ailerons des deux bouts
  for (const x of [XO, XE]) {
    G.pave(x - 0.09, 0, EP / 2, x + 0.09, HM, 2.4, COUL.blanc, m.enduit, { nuance: 0.02 });
    b.obstacle(x, EP / 2, x, 2.4);
  }

  // Les chaises longues alignées face au vide
  const X_VR = [-12, 9.15, 22.85, -25.15, -27.15];
  const X_GELE = [-16, 17.15, -27.15];
  const proche = (liste, x) => liste.some((v) => Math.abs(v - x) < 0.01);
  for (let bx = -28; bx <= 28; bx += 4) {
    for (const dx of [-1.15, 0, 1.15]) {
      const x = bx + dx;
      if (Math.abs(x) < 1.6) continue; // devant la porte du hall
      const vr = proche(X_VR, x);
      const gele = proche(X_GELE, x);
      const [t1, t2, t3, t4, j1, j2, j3] = [r(), r(), r(), r(), r(), r(), r()];
      if (!vr && !gele && t1 < 0.05 + 0.12 * usure) {
        if (t2 < 0.5) chaiseLongue(c, x + 0.2, 1.0, 0.3, { etat: "pliee" });
        continue;
      }
      const renv = !vr && !gele && t2 < 0.12 * usure;
      const plaid = gele || t3 < 0.42 ? COUL.plaids[Math.floor(t4 * COUL.plaids.length)] : null;
      chaiseLongue(c, x + (j1 - 0.5) * 0.15, 2.6 + (j2 - 0.5) * 0.3, (j3 - 0.5) * 0.18, { etat: renv ? "renversee" : "droite", plaid, casque: vr });
    }
    if (bx < 28 && Math.abs(bx + 2) > 1.5 && r() < 0.55) gueridon(c, bx + 2, 2.1, r() < 0.25 * usure);
  }
  // Des plaids tombés, roulés en boule au pied des chaises
  for (let i = 0; i < 8; i++) c.boite(r() * 0.4 + 0.5, 0.12, 0.45, COUL.plaids[i % COUL.plaids.length], { x: -27 + r() * 54, y: 0.07, z: 0.8 + r() * 3.4, ry: r() * 3 }, m.toile, { nuance: 0.1 });

  // Le campement de la galerie : lanterne, couvertures, bûches, gamelle
  gueridon(c, -8.2, 1.0);
  lanterne(c, -8.2, 0.62, 1.0);
  buches(c, -9.9, 0.55, 0, 1.4, 4);
  c.boite(0.9, 0.2, 1.4, 0x6b5a48, { x: -6.6, y: 0.1, z: 1.0, ry: 0.2 }, m.toile, { nuance: 0.08 });
  c.boite(0.8, 0.12, 1.2, 0x5f6f78, { x: -6.5, y: 0.25, z: 1.05, ry: -0.1 }, m.toile, { nuance: 0.08 });
  c.poser(cylindre(0.14, 0.12, 0.14, 7), m.tole, 0x5b5f5c, { x: -7.6, y: 0.07, z: 1.5 });

  // Contre la façade : la station de recharge Montagne Apaisante, le casier à téléphones
  c.boite(1.5, 1.6, 0.42, COUL.email, { x: -19.45, y: 0.8, z: EP / 2 + 0.22 }, m.satin, { nuance: 0.03 });
  panneau(c, m.enseignes, R.vr, { x: -19.45, y: 1.2, z: EP / 2 + 0.44 }, 1.36, 0.68);
  c.boite(1.3, 0.04, 0.6, 0x1f2a33, { x: -19.45, y: 1.75, z: EP / 2 + 0.25, rx: 0.4 }, m.lisse);
  for (const dx of [-0.45, 0, 0.45]) c.boite(0.2, 0.1, 0.12, COUL.noir, { x: -19.45 + dx, y: 0.67, z: EP / 2 + 0.47 }, m.lisse);
  c.boite(1.4, 1.75, 0.4, 0xb9b5a6, { x: 4, y: 0.875, z: EP / 2 + 0.21 }, m.tole, { nuance: 0.03 });
  panneau(c, m.enseignes, R.casiers, { x: 4, y: 1.0, z: EP / 2 + 0.415 }, 1.34, 1.34);
  for (let i = 0; i < 5; i++) c.boite(0.08, 0.01, 0.15, 0x121314, { x: 3.2 + r() * 1.8, y: 0.01, z: 0.9 + r() * 0.8, ry: r() * 3 }, m.lisse, { crasse: false });
  // Les panneaux sur la façade (dans la couche, avec le haut du mur)
  const zF = EP / 2 + 0.012;
  panneau(T, m.enseignes, R.reseau, { x: -4.03, y: 1.95, z: zF }, 1.4, 0.7);
  panneau(T, m.enseignes, R.deposez, { x: 4, y: 2.38, z: zF }, 1.1, 0.55);
  panneau(T, m.enseignes, R.silence, { x: 18.7, y: 2.1, z: zF }, 1.2, 0.6);
  panneau(T, m.enseignes, R.affiche, { x: 15.05, y: 1.75, z: zF }, 0.74, 1.11);
  panneau(T, m.enseignes, R.graffiti, { x: 23.4, y: 1.7, z: zF }, 2.8, 0.7);

  // Le temps : enduit tombé de la dalle, aiguilles de mélèze, flaques sous les fissures, lierre aux colonnes
  debris(c, XO, 0.3, XE, 4.4, Math.round(30 + 70 * usure), [COUL.blanc, 0xd9d2c4, 0xa05a43]);
  jonchee(c, XO, 0.2, XE, 4.7, Math.round(60 + 120 * usure), AIGUILLES);
  if (usure > 0.3) {
    flaque(c, 6.3, 3.6, 0.8);
    flaque(c, -22.5, 3.9, 0.6);
    gravats(c, 26.3, 3.6, 0.8, Math.round(6 + 10 * usure), [COUL.blanc, 0xd8d2c4, 0xa05a43]);
  }
  for (const x of [-28, -12, 20]) lierre(c, x, 0, 4.47, 0, 0.6, 3.0, Math.round(20 + 40 * usure));
  lierre(c, XO - 0.25, 0, -4, -Math.PI / 2, 6, 3.4, Math.round(40 + 90 * usure));
  semerTouffes(c, XO, 4.5, XE, 4.9, Math.round(20 + 40 * usure), COUL.terre);
}

// ---------- L'arrière : mur de soutènement, route de service ----------

function arriere(k) {
  const { c, m, usure, b } = k;
  const [x1, x2] = k.ext ? [-42, 52] : [-34, 36];
  c.pave(x1, 0, -12.85, x2, 1.6, -12.45, 0xa9a397, m.enduit, { nuance: 0.03 });
  c.pave(x1, 1.6, -12.95, x2, 1.74, -12.35, COUL.pierreSombre, m.enduit, { nuance: 0.03 });
  b.obstacle(x1, -12.45, x2, -12.45, "mur de soutènement");
  c.pave(x1, 0, -12.45, x2, 0.02, ZN - 0.15, COUL.gravier, m.mat, { crasse: false, nuance: 0 });
  // La neige qui ne fond jamais, à l'ombre du bâtiment
  const r = aleatoire(91);
  for (let i = 0; i < 14; i++) {
    const x = x1 + 2 + r() * (x2 - x1 - 4);
    if (x > 37.5 && x < 48.5) continue;
    plaqueNeige(c, x, -11.8, 0.4 + r() * 0.5);
  }
  for (const x of [-38, 6, 46]) if (x > x1 && x < x2) lierre(c, x, 0, -12.43, 0, 4, 1.6, Math.round(25 + 50 * usure));
  semerTouffes(c, x1, -12.4, x2, -11.2, Math.round(30 + 50 * usure), PALETTE_HERBE);
}

const PALETTE_HERBE = 0x9aa65e;

// ---------- Les pièces de la carte « intérieur » ----------

function chambres(k) {
  const { c, m, usure } = k;
  // Chambre 1 : le lit près de la porte-fenêtre, la feuille de température, l'armoire au fond
  litFer(c, -29.25, -3, 0, { couverture: 0x8a6a52 });
  tableNuit(c, -28.4, -4.6);
  crachoir(c, -28.4, 0.67, -4.6);
  chaise(c, -27.3, -2.1, -0.6);
  armoire(c, -27.1, -8.45);
  panneau(c, m.enseignes, R.temperature, { x: -29.83, y: 1.45, z: -3.9, ry: Math.PI / 2 }, 0.42, 0.42);
  // Chambre 2 : le campement d'un survivant (duvet, bougie, conserves)
  litFer(c, -23.65, -3.2, 0, { couverture: 0x4f6a48 });
  c.boite(0.8, 0.18, 1.7, 0x3f5a3c, { x: -23.65, y: 0.72, z: -3.1 }, m.toile, { nuance: 0.05 });
  tableNuit(c, -25.3, -2.3, 0);
  c.poser(cylindre(0.025, 0.025, 0.12, 6), m.lisse, 0xeee6cf, { x: -25.3, y: 0.74, z: -2.3 }, { crasse: false });
  crachoir(c, -25.6, 0, -4.8);
  c.boite(0.4, 0.5, 0.25, 0x5b5a3a, { x: -25.8, y: 0.25, z: -6.5, ry: 0.3 }, m.toile);
  for (let i = 0; i < 4; i++) c.poser(cylindre(0.045, 0.045, 0.11, 6), m.metal, 0xa0a2a0, { x: -25.1 + i * 0.12, y: 0.055, z: -5.4 + (i % 2) * 0.1 });
  armoire(c, -24.7, -8.45, 0);
  // Chambre 3 : le lit effondré, l'armoire renversée, le plâtre tombé du plafond
  litFer(c, -19.95 - 0.5, -2.9, 0, { effondre: true, couverture: 0x7c6070 });
  armoire(c, -21.3, -7.6, Math.PI / 2, true);
  crachoir(c, -22.4, 0, -1.2);
  chaise(c, -21.6, -4.8, 1.2, true);
  c.boite(0.21, 0.1, 0.12, COUL.noir, { x: -20.5, y: 0.6, z: -2.4, ry: 0.4 }, m.lisse);
  gravats(c, -21.5, -4.6, 0.9, Math.round(6 + 10 * usure), [COUL.blanc, COUL.interieur, 0xa05a43]);
  debris(c, -30, -8.8, -19.6, -0.3, Math.round(15 + 30 * usure), [COUL.blanc, COUL.interieur]);
  raiDeLumiere(c, [-24.75, 3.4, 3.2], [-24.4, 0, -2.0], 0.9);
}

function bibliotheque(k) {
  const { c, m, usure } = k;
  // Les rayonnages le long des murs ; l'un s'est couché sur les tables
  for (const x of [-18.2, -15.4, -12.6]) rayonnage(c, x, ZK + 0.3, 0, 2.6);
  rayonnage(c, -19.2, -6.6, Math.PI / 2, 2.6);
  rayonnage(c, -19.2, -3.8, Math.PI / 2, 2.6);
  rayonnage(c, -11.3, -6.3, -Math.PI / 2, 2.6);
  rayonnage(c, -13.6, -2.4, -0.25, 2.4, true);
  livresAuSol(c, -18.8, -8.4, -11.6, -1.4, Math.round(30 + 50 * usure));
  // Les tables de lecture, les chaises, les fauteuils de rotin près des fenêtres
  tableLongue(c, -16.4, -5.4, 2.6);
  chaise(c, -17.3, -4.6, Math.PI);
  chaise(c, -15.6, -6.3, 0.2, true);
  chaise(c, -16.2, -4.5, Math.PI + 0.3);
  fauteuil(c, -17.8, -1.3, 2.8);
  fauteuil(c, -12.4, -1.0, -2.6, true);
  c.boite(0.5, 0.03, 0.36, 0xe0d8c2, { x: -16.6, y: 0.8, z: -5.4, ry: 0.4 }, m.satin, { crasse: false });
  // L'échelle de bibliothécaire, appuyée
  c.repere({ x: -14.2, z: -8.2, rx: -0.25 }, () => {
    for (const s of [-1, 1]) c.boite(0.05, 2.6, 0.05, COUL.bois, { x: s * 0.22, y: 1.3 }, m.satin);
    for (let i = 0; i < 7; i++) c.boite(0.44, 0.04, 0.04, COUL.bois, { y: 0.3 + i * 0.35 }, m.satin);
  });
  raiDeLumiere(c, [-15.25, 3.4, 3.4], [-15.0, 0, -1.6], 1.0);
}

function salonMusique(k) {
  const { c, m, usure } = k;
  piano(c, -7.5, ZK + 0.62, 0);
  gramophone(c, -5.0, -7.9, -0.4);
  // Les chaises du dernier concert, tournées vers le piano
  for (const [x, z, ry, renv] of [[-9.2, -5.2, Math.PI, false], [-8.2, -5.0, Math.PI + 0.1, false], [-6.8, -5.1, Math.PI - 0.2, true], [-9.4, -3.8, Math.PI, false], [-7.9, -3.6, Math.PI + 0.3, false], [-6.4, -3.9, Math.PI, true]]) chaise(c, x, z, ry, renv);
  fauteuil(c, -10.2, -1.5, 2.6);
  fauteuil(c, -4.8, -1.4, -2.4);
  pupitre(c, -9.6, -7.2, 0.4);
  pupitre(c, -5.8, -6.2, -0.3, true);
  // Un tapis élimé, des partitions par terre
  c.boite(3.4, 0.015, 2.4, 0x7a3a34, { x: -7.5, y: 0.045, z: -4.4 }, m.toile, { crasse: false, nuance: 0.05 });
  jonchee(c, -10.4, -8, -4.6, -2.5, Math.round(16 + 30 * usure), [0xe6e0cc, 0xd8d0b8, 0xece6d2], 0.06);
  // La grosse caisse du kiosque, rapatriée ici
  c.poser(cylindre(0.38, 0.38, 0.34, 10), m.toile, 0xd8cfb4, { x: -10.2, y: 0.38, z: -7.9, rx: Math.PI / 2 }, { nuance: 0.03 });
  raiDeLumiere(c, [-7.5, 3.4, 3.4], [-7.3, 0, -1.8], 0.9);
}

function hall(k) {
  const { c, T, m, usure, b } = k;
  // Le comptoir d'accueil de la Cure
  c.pave(-3.65, 0, -7.4, -2.25, 1.05, -2.6, 0xb7ad97, m.satin, { nuance: 0.03 });
  c.pave(-3.75, 1.05, -7.5, -2.15, 1.11, -2.5, 0xd9d2c0, m.satin);
  panneau(T, m.enseignes, R.accueil, { x: -3.9 + EPI / 2 + 0.01, y: 2.3, z: -5, ry: Math.PI / 2 }, 1.8, 0.6);
  c.boite(0.36, 0.05, 0.26, 0xe6e0cc, { x: -2.9, y: 1.14, z: -5.4, ry: 0.3 }, m.satin, { crasse: false });
  b.obstacle(-2.25, -7.4, -2.25, -2.6, "comptoir");
  // Le grand escalier, effondré : il ne mène plus aux étages
  const xe = [1.5, 3.8];
  for (let i = 0; i < 7; i++) c.pave(xe[0], 0, -1.6 - i * 0.32, xe[1], 0.18 * (i + 1), -1.28 - i * 0.32, COUL.granito, m.enduit, { nuance: 0.02 });
  c.tube([xe[0], 1.0, -1.3], [xe[0], 2.2, -3.5], 0.025, COUL.garde, m.tole, 5);
  c.boite(2.3, 0.25, 2.6, COUL.granito, { x: 2.65, y: 0.55, z: -5.8, rx: -0.42, rz: 0.12 }, m.enduit, { nuance: 0.03 });
  gravats(c, 2.6, -6.6, 1.3, Math.round(12 + 14 * usure), [COUL.granito, COUL.blanc, 0xa05a43]);
  b.obstacle(xe[0], -1.3, xe[0], -7.4, "escalier effondré");
  b.obstacle(xe[0], -7.4, xe[1], -7.4, "escalier effondré");
  // Les fauteuils de rotin, le palmier mort de l'accueil, le tapis
  fauteuil(c, -1.4, -2.2, 2.8);
  fauteuil(c, 0.2, -2.6, -2.9, true);
  c.poser(cylindre(0.3, 0.22, 0.5, 8), m.lisse, 0x6f8b8a, { x: -3.2, y: 0.25, z: -1.0 });
  for (let i = 0; i < 5; i++) c.boite(0.05, 0.8, 0.12, 0x9c8a5a, { x: -3.2, y: 0.85, z: -1.0, ry: i * 1.25, rz: 0.5 }, m.mat, { crasse: false });
  c.boite(2.6, 0.015, 3.6, 0x6a3b3a, { x: -0.6, y: 0.045, z: -4.8, ry: 0.05 }, m.toile, { crasse: false, nuance: 0.04 });
  // « Déposez votre téléphone. Respirez. » au-dessus de la porte, côté intérieur
  panneau(T, m.enseignes, R.deposez, { x: 0, y: 2.95, z: -EP / 2 - 0.012, ry: Math.PI }, 0.9, 0.45);
  debris(c, -3.8, -8.6, 3.8, -0.4, Math.round(12 + 24 * usure));
}

function refectoire(k) {
  const { c, T, m, usure } = k;
  const r = aleatoire(55);
  // Deux longues rangées de tables, les bancs, la vaisselle émaillée
  for (const z of [-2.6, -6.6]) {
    for (const [x, l] of [[7.9, 5.6], [14.1, 5.6]]) {
      const renv = z === -6.6 && x > 10 && usure > 0.6;
      tableLongue(c, x, z, l, renv);
      if (!renv) vaisselle(c, x - l / 2 + 0.3, z - 0.35, x + l / 2 - 0.3, z + 0.35, Math.round(8 + 4 * r()));
      for (const s of [-1, 1]) banc(c, x, z + s * 0.65, l - 0.4, 0, r() < 0.25 * usure);
    }
  }
  // La vaisselle tombée et cassée
  debris(c, 5, -8.4, 17, -0.6, Math.round(14 + 20 * usure), [COUL.email, 0xd8d6cc, COUL.emailBleu]);
  // Le passe-plat et son comptoir
  c.pave(16.9, 0, -8.3, 17.7, 1.0, -3.2, 0xb7ad97, m.satin, { nuance: 0.03 });
  vaisselle(c, 17.0, -8.0, 17.6, -3.5, 6, 1.0);
  // Le coin des survivants autour du poêle : bois, couvertures, marmite
  buches(c, 12.6, -5.2, Math.PI / 2, 1.0, 4);
  c.poser(cylindre(0.2, 0.18, 0.22, 8), m.tole, 0x5b5f5c, { x: 11.05, y: 1.17, z: -4.55 });
  c.boite(1.2, 0.18, 1.8, 0x6b5a48, { x: 9.6, y: 0.09, z: -4.5, ry: 0.2 }, m.toile, { nuance: 0.08 });
  chaise(c, 10.1, -3.9, 2.4);
  // L'ardoise du menu détox
  panneau(c, m.enseignes, R.menu, { x: 8, y: 1.75, z: ZK + EPI / 2 + 0.012 }, 0.9, 0.9);
  raiDeLumiere(c, [11, 3.4, 3.4], [11.3, 0, -1.8], 1.0);
  raiDeLumiere(c, [16.4, 3.4, 3.2], [16.6, 0.9, -1.0], 1.0);
}

function radiologie(k) {
  const { c, T, m, usure, b } = k;
  appareilRX(c, 19.2, -5.2, 0);
  pupitreRX(c, 19.4, -8.25, 0);
  // La paroi plombée du pupitre, sa lucarne
  c.pave(18.3, 0, -7.55, 20.2, 2.0, -7.45, 0x8a8e88, m.tole, { nuance: 0.02 });
  c.poser(plan(), m.verre, 0xffffff, { x: 19.6, y: 1.55, z: -7.44, e: [0.6, 0.4, 1] }, { crasse: false, nuance: 0 });
  b.obstacle(18.3, -7.5, 20.2, -7.5, "paroi plombée");
  // Le statif mural, le négatoscope, le tablier de plomb
  c.boite(0.6, 1.6, 0.12, 0x4e5654, { x: 22.8, y: 1.2, z: -8.7 }, m.satin);
  c.boite(0.12, 2.2, 0.12, 0xd9d4c5, { x: 22.3, y: 1.1, z: -8.75 }, m.satin);
  c.boite(0.8, 0.8, 0.08, 0x6f7471, { x: 21, y: 1.6, z: ZK + 0.12 }, m.satin);
  panneau(c, m.enseignes, R.radio, { x: 21, y: 1.6, z: ZK + 0.165 }, 0.76, 0.76);
  c.boite(0.45, 0.3, 0.2, 0x2a2b2c, { x: 21.6, y: 0.15, z: -8.5 }, m.tole);
  c.tube([21.4, 0.3, -8.5], [21.2, 1.25, -8.85], 0.012, 0x1a1a1a, m.tole, 4);
  c.boite(0.5, 0.95, 0.04, 0x4c4f52, { x: 23.86, y: 1.45, z: -3.9, ry: -Math.PI / 2, rz: 0.06 }, m.toile);
  paravent(c, 22.4, -2.4, -0.4);
  paravent(c, 20.2, -1.6, 0.7, usure > 0.7);
  debris(c, 18.2, -8.8, 23.8, -0.4, Math.round(8 + 16 * usure));
}

function pharmacie(k) {
  const { c, m, usure } = k;
  armoirePharmacie(c, 29.6, -5.5, -Math.PI / 2, 4.0, k.bris);
  armoirePharmacie(c, 26.6, ZK + 0.3, 0, 2.4, k.bris);
  c.pave(24.6, 0, -5.9, 27.3, 1.0, -5.1, COUL.email, m.satin, { nuance: 0.03 });
  balance(c, 25, -2.2, 0.3);
  // Les flacons et les boîtes tombés
  const r = aleatoire(66);
  for (let i = 0; i < Math.round(10 + 16 * usure); i++) {
    if (r() < 0.5) c.boite(0.14, 0.06, 0.09, r() < 0.5 ? 0xe6e2d6 : 0x8fb1c9, { x: 24.5 + r() * 5, y: 0.05, z: -8.6 + r() * 7.6, ry: r() * 3 }, m.satin, { crasse: false });
    else c.poser(cylindre(0.035, 0.035, 0.15, 5), m.lisse, r() < 0.5 ? 0x6a4a2a : 0x3b5a7a, { x: 24.5 + r() * 5, y: 0.04, z: -8.6 + r() * 7.6, rz: Math.PI / 2, ry: r() * 3 });
  }
}

function couloir(k) {
  const { c, m, usure } = k;
  // La réserve de bois des survivants, contre le mur nord
  buches(c, 6, -10.55, 0, 2.6, 5);
  buches(c, -21, -10.55, 0, 1.4, 3);
  banc(c, -6, -10.6, 1.8);
  banc(c, 14, -10.6, 1.8, 0, true);
  for (const x of [-26, -16, 10, 22]) chaise(c, x, -9.6, Math.PI + (x % 3) * 0.3, x === 10);
  // La desserte du réfectoire abandonnée
  c.repere({ x: 18.5, z: -10, ry: 0.15 }, () => {
    c.boite(0.9, 0.03, 0.5, 0xc8c6bc, { y: 0.85 }, m.satin);
    c.boite(0.9, 0.03, 0.5, 0xc8c6bc, { y: 0.35 }, m.satin);
    for (const [dx, dz] of [[-0.42, -0.22], [0.42, -0.22], [-0.42, 0.22], [0.42, 0.22]]) c.boite(0.03, 0.85, 0.03, 0xa8a69c, { x: dx, y: 0.425, z: dz }, m.tole);
  });
  vaisselle(c, 18.2, -10.2, 18.8, -9.8, 4, 0.88);
  flaque(c, -12, -10, 0.6);
  flaque(c, 24, -10.2, 0.5);
  jonchee(c, XO, ZN + 0.2, XE, ZK - 0.2, Math.round(30 + 50 * usure), AIGUILLES);
  debris(c, XO, ZN + 0.2, XE, ZK - 0.2, Math.round(16 + 30 * usure));
}

function abordsInterieur(k) {
  const { c, usure } = k;
  // La bande de parc devant la galerie : herbes, jeunes sapins, l'amorce de l'allée
  c.pave(-1.1, 0, 4.85, 1.1, 0.02, 9, COUL.gravier, k.m.mat, { crasse: false, nuance: 0 });
  semerTouffes(c, -34, 4.9, 36, 9, Math.round(80 + 120 * usure), PALETTE_HERBE);
  jonchee(c, -34, 4.9, 36, 9, Math.round(40 + 60 * usure), AIGUILLES);
  for (const [x, z, h] of [[-33, 7.5, 7], [-26, 7.2, 1.6], [-14, 6.5, 1.2], [9.5, 7.8, 2.2], [22, 6.8, 1.4], [33.5, 6.5, 8]]) sapin(c, x, z, h);
  meleze(c, 30.5, 8.2, 6.5);
  meleze(c, -31, 4, 5.5);
}

// ---------- La carte « galeries » : la colline, le parc, la chaufferie, la gare, le kiosque, le belvédère ----------

function colline(k) {
  const { c, m } = k;
  const X1 = -42;
  const X2 = 52;
  const Z1 = -24;
  const Z2 = -12.45;
  const nx = 26;
  const nz = 7;
  const pos = [];
  const col = [];
  const cc = new THREE.Color();
  const tri = (p, q, s, teinte) => {
    pos.push(...p, ...q, ...s);
    cc.setHex(teinte);
    for (let i = 0; i < 3; i++) col.push(cc.r, cc.g, cc.b);
  };
  const r = aleatoire(404);
  const P = (x, z) => [x, hauteurColline(x, z), z];
  const teinte = (x, z) => {
    const v = r();
    if (z < -17 && Math.sin(x * 0.31) + Math.sin(z * 0.7 + x * 0.11) > 1.1) return COUL.neige;
    return v < 0.4 ? 0x5f7f45 : v < 0.7 ? 0x6e8a4c : v < 0.85 ? 0x7d8f55 : 0x8a7a58;
  };
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x0 = X1 + ((X2 - X1) * i) / nx;
      const x1 = X1 + ((X2 - X1) * (i + 1)) / nx;
      const z0 = Z1 + ((Z2 - Z1) * j) / nz;
      const z1 = Z1 + ((Z2 - Z1) * (j + 1)) / nz;
      tri(P(x0, z0), P(x0, z1), P(x1, z0), teinte((x0 + x1) / 2, z0));
      tri(P(x1, z0), P(x0, z1), P(x1, z1), teinte((x0 + x1) / 2, z1));
    }
  }
  // Les tranches de la colline aux deux bouts du lot
  for (let j = 0; j < nz; j++) {
    const z0 = Z1 + ((Z2 - Z1) * j) / nz;
    const z1 = Z1 + ((Z2 - Z1) * (j + 1)) / nz;
    const a = [X2, 0, z0], bb = [X2, 0, z1], h0 = P(X2, z0), h1 = P(X2, z1);
    tri(a, h0, bb, COUL.terre);
    tri(bb, h0, h1, COUL.terre);
    const a2 = [X1, 0, z0], b2 = [X1, 0, z1], g0 = P(X1, z0), g1 = P(X1, z1);
    tri(a2, b2, g0, COUL.terre);
    tri(b2, g1, g0, COUL.terre);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  poserBrut(c, g, m.mat);
  // La forêt qui monte : sapins sombres et mélèzes dorés
  const ra = aleatoire(405);
  for (let i = 0; i < 36; i++) {
    const x = X1 + 1 + ra() * (X2 - X1 - 2);
    const z = -14 - ra() * 9.5;
    const y = hauteurColline(x, z) - 0.1;
    const h = 7 + ra() * 6;
    if (ra() < 0.68) sapin(c, x, z, h, y);
    else meleze(c, x, z, h * 0.9, y);
  }
  for (let i = 0; i < 12; i++) {
    const x = X1 + 2 + ra() * (X2 - X1 - 4);
    const z = -14.5 - ra() * 8;
    plaqueNeige(c, x, z, 0.7 + ra() * 1.2, hauteurColline);
  }
}

/** Les allées du parc (segments). */
const ALLEES = [
  [[0, 4.85], [0, 12]],
  [[0, 12], [12, 20.6]],
  [[0, 12], [-29.6, 27]],
  [[12, 27.4], [12, 38.2]],
  [[30.5, 4.85], [41, -2.8]],
];

function parc(k) {
  const { c, m, usure } = k;
  const r = aleatoire(202);
  // Les allées de gravier que l'herbe reprend
  for (const [a, bb] of ALLEES) {
    const dx = bb[0] - a[0];
    const dz = bb[1] - a[1];
    const L = Math.hypot(dx, dz);
    c.boite(L + 1.6, 0.03, 2.2, COUL.gravier, { x: (a[0] + bb[0]) / 2, y: 0.015, z: (a[1] + bb[1]) / 2, ry: -Math.atan2(dz, dx) }, m.mat, { crasse: false, nuance: 0.02 });
    const pts = [];
    for (let i = 0; i < L * (0.25 + 0.4 * usure); i++) {
      const t = r();
      const s = (r() - 0.5) * 2.4;
      pts.push([a[0] + dx * t - (dz / L) * s, a[1] + dz * t + (dx / L) * s]);
    }
    touffes(c, pts, PALETTE_HERBE);
  }
  // Les arbres : là où il n'y a ni bâtiment, ni allée, ni kiosque, ni gare
  const libre = (x, z, marge) => {
    if (x > -31.5 - marge && x < 35 + marge && z < 6.2 + marge) return false;
    if (x > 36.5 - marge && x < 51 && z < -1.5 + marge) return false;
    if (x > -41 - marge && x < -29.5 + marge && z > 20.5 - marge && z < 41) return false;
    if (Math.hypot(x - 12, z - 24) < 5.2 + marge) return false;
    if (z > 36.8 - marge) return false;
    if (z < -11.2) return false;
    if (marge > 0 && x > -27 && x < 33 && z < 19) return false; // dégager la vue sur la façade
    for (const [a, bb] of ALLEES) if (distSeg(x, z, a, bb) < 1.9 + marge) return false;
    return true;
  };
  const arbres = [];
  let essais = 0;
  while (arbres.length < 34 && essais++ < 900) {
    const x = -41.5 + r() * 93;
    const z = -11 + r() * 48;
    if (!libre(x, z, 1.2)) continue;
    if (arbres.some(([ax, az]) => Math.hypot(ax - x, az - z) < 3.6)) continue;
    arbres.push([x, z]);
  }
  for (const [x, z] of arbres) {
    const h = 6 + r() * 6;
    if (r() < 0.62) sapin(c, x, z, h);
    else {
      meleze(c, x, z, h);
      jonchee(c, x - 2, z - 2, x + 2, z + 2, 18, AIGUILLES);
    }
    if (r() < 0.45) plaqueNeige(c, x + 0.4, z - 1.4, 0.6 + r() * 0.6);
  }
  // Les jeunes sapins qui avancent sur la pelouse, jusqu'au bord de la galerie
  for (let i = 0; i < 18; i++) {
    const x = -40 + r() * 90;
    const z = 5.4 + r() * 30;
    if (!libre(x, z, -0.8) && !(z > 5.2 && z < 7 && x > -29 && x < 29 && distSeg(x, z, ...ALLEES[0]) > 1.4)) continue;
    sapin(c, x, z, 0.9 + r() * 2.2);
  }
  // Herbes folles, aiguilles, neige à l'ombre des bâtiments
  semerTouffes(c, -41, 5, 51, 36.5, Math.round(140 + 220 * usure), PALETTE_HERBE);
  for (const [x, z, rr] of [[-35, 21.2, 1.2], [-37, 21, 0.9], [44, -12, 0.8], [12, 19.6, 0.6], [-41, 4, 1.0], [33, -10, 0.7]]) plaqueNeige(c, x, z, rr);
  // Les lampadaires à globe le long de l'allée centrale
  for (const [x, z, penche, globe] of [[1.4, 8.4, 0, true], [4.8, 15.3, 0.12, false], [-7.5, 15.4, 0, true], [-19.5, 21.2, -0.2, false], [13.5, 31.5, 0, true]]) {
    c.repere({ x, z, rz: penche }, () => {
      c.tube([0, 0, 0], [0, 3.3, 0], 0.06, COUL.fonte, m.tole, 6);
      c.poser(cylindre(0.14, 0.18, 0.4, 6), m.tole, COUL.fonte, { y: 0.2 });
      if (globe) c.poser(BOULE, m.lisse, 0xe9e4d4, { y: 3.55, e: 0.24 }, { crasse: false });
      else c.poser(cylindre(0.06, 0.1, 0.12, 6), m.tole, COUL.fonte, { y: 3.36 });
    });
  }
  // Les bancs du parc, face à la vallée
  for (const [x, z] of [[-6, 37.4], [26, 37.4], [-20, 37.2]]) bancParc(c, m, x, z, 0);
  bancParc(c, m, 3.4, 18.6, -Math.PI / 2 + 0.6, true);
  // L'Abondance jusque dans les allées : « Ici, pas de réseau. Enfin. » sur un poteau
  c.tube([-26.2, 0, 24.2], [-26.2, 2.2, 24.2], 0.04, COUL.fonte, m.tole, 5);
  panneau(c, m.enseignes, R.reseau, { x: -26.2, y: 2.15, z: 24.25, ry: 0.5 }, 1.2, 0.6);
}

function bancParc(c, m, x, z, ry, renverse = false) {
  c.repere(renverse ? { x, z, ry, y: 0.4, rx: -Math.PI / 2 + 0.1 } : { x, z, ry }, () => {
    const y0 = renverse ? -0.4 : 0;
    c.boite(1.8, 0.05, 0.45, COUL.boisClair, { y: y0 + 0.44 }, m.mat, { nuance: 0.05 });
    c.boite(1.8, 0.35, 0.04, COUL.boisClair, { y: y0 + 0.75, z: -0.22, rx: 0.15 }, m.mat, { nuance: 0.05 });
    for (const s of [-1, 1]) c.boite(0.06, 0.44, 0.45, COUL.fonte, { x: s * 0.75, y: y0 + 0.22 }, m.tole);
  });
}

function chaufferie(k) {
  const { c, m, usure, b } = k;
  const brique = { ep: 0.35, couleur: COUL.brique, mat: m.brique, h: 5.4, batiment: b };
  const fenB = (u, l = 1.6) => ({ u, l, bas: 1.5, haut: 4.3, type: "fenetre", croisillons: 1, traverses: 2, bris: k.bris, cadre: COUL.cadre });
  // Les murs de brique, éventrés côté vallée
  mur(c, [38, -3], [48, -3], { ...brique, ouvertures: [{ u: 3, l: 3.0, bas: 0, haut: 3.3, type: "vide" }, fenB(6.5), fenB(8.7, 1.2)], breches: [{ u: 7.6, l: 4.4, profondeur: 1.8 + 1.8 * usure }], arase: 0.2 });
  mur(c, [48, -3], [48, -12], { ...brique, ouvertures: [fenB(2.5), fenB(4.5, 1.2)], breches: [{ u: 7, l: 3.6, profondeur: 1.2 + 1.6 * usure }], arase: 0.2 });
  mur(c, [48, -12], [38, -12], { ...brique, ouvertures: [fenB(3), fenB(7)], arase: 0.15 });
  mur(c, [38, -12], [38, -3], { ...brique, ouvertures: [{ u: 7.5, l: 1.2, bas: 0, haut: 2.4, type: "vide" }], arase: 0.15 });
  // Linteaux de béton et soubassement
  for (const [a, bb] of [[[38, -3], [48, -3]], [[48, -3], [48, -12]]]) {
    const { ry } = repereMur(a, bb);
    c.repere({ x: a[0], z: a[1], ry }, () => c.pave(-0.2, 0, 0.17, 10.2 - (a[0] === 48 ? 1 : 0), 0.45, 0.24, COUL.pierreSombre, m.enduit));
  }
  // La grande porte de tôle, tombée
  c.boite(1.5, 0.05, 3.2, 0x5f6a66, { x: 40.2, y: 0.05, z: -1.2, ry: 0.2 }, m.tole, { nuance: 0.05 });
  c.boite(1.5, 3.2, 0.05, 0x5f6a66, { x: 42.1, y: 1.6, z: -2.6, ry: -0.9 }, m.tole, { nuance: 0.05 });
  // Le sol de béton
  c.pave(38.2, 0, -11.8, 47.8, 0.04, -3.2, 0x9a958b, m.enduit, { crasse: false, nuance: 0 });
  // La verrière en sheds : il ne reste que les fermes d'acier et quelques plaques de tôle
  for (const x of [39.6, 42, 44.4, 46.8]) {
    const casse = x === 44.4 && usure > 0.5;
    c.poutre([x, 5.4, -12], [x, 5.4, -3], 0.12, 0x5a4a3c, m.tole);
    c.poutre([x, 5.4, -12], [x, 7.3, -7.5], 0.1, 0x5a4a3c, m.tole);
    if (!casse) c.poutre([x, 7.3, -7.5], [x, 5.4, -3], 0.1, 0x5a4a3c, m.tole);
    else c.poutre([x, 7.3, -7.5], [x + 0.3, 2.8, -5.2], 0.1, 0x5a4a3c, m.tole);
    c.poutre([x, 5.4, -7.5], [x, 7.3, -7.5], 0.08, 0x5a4a3c, m.tole);
  }
  for (const z of [-10, -7.5, -5]) c.poutre([38, z === -7.5 ? 7.3 : 6.55, z], [48, z === -7.5 ? 7.3 : 6.55, z], 0.08, 0x5a4a3c, m.tole);
  for (const [x, rz] of [[40.8, 0], [43.2, 0.05], [45.6, -0.1]]) c.boite(2.3, 0.04, 4.6, COUL.zinc, { x, y: 6.45, z: -9.8, rx: 0.4, rz }, m.tole, { nuance: 0.08 });
  c.boite(2.3, 0.04, 3.4, 0x8a5a3a, { x: 46.3, y: 0.4, z: -5.4, rx: 0.15, rz: 0.2 }, m.tole, { nuance: 0.08 });
  // La chaudière : cylindre riveté sur son massif de brique, porte du foyer, carneau vers la cheminée
  c.pave(41.3, 0, -9.2, 45.5, 0.55, -7.2, COUL.brique, m.brique);
  c.poser(cylindre(1.0, 1.0, 3.8, 12), m.tole, 0x3f4744, { x: 43.4, y: 1.55, z: -8.2, rz: Math.PI / 2 });
  for (const x of [41.9, 43.4, 44.9]) c.poser(cylindre(1.04, 1.04, 0.1, 12), m.tole, 0x343a38, { x, y: 1.55, z: -8.2, rz: Math.PI / 2 });
  c.boite(0.08, 0.5, 0.62, 0x2a2d2c, { x: 41.47, y: 1.15, z: -8.2 }, m.tole);
  c.boite(0.04, 0.12, 0.4, 0xd9662a, { x: 41.43, y: 1.0, z: -8.2 }, m.lisse, { crasse: false });
  c.poser(cylindre(0.12, 0.12, 0.08, 8), m.lisse, 0xe6e2d4, { x: 42.2, y: 2.62, z: -8.2 }, { crasse: false });
  c.tube([45.2, 2.2, -8.2], [46.2, 3.7, -8.2], 0.3, 0x3a3634, m.tole, 8);
  c.tube([46.2, 3.7, -8.2], [48.6, 3.7, -7.4], 0.3, 0x3a3634, m.tole, 8);
  b.obstacle(41.3, -9.2, 45.5, -9.2, "chaudière");
  b.obstacle(41.3, -7.2, 45.5, -7.2, "chaudière");
  b.obstacle(41.3, -9.2, 41.3, -7.2, "chaudière");
  // Les tuyaux le long du mur nord, vers la passerelle du sanatorium
  for (const [y, rr] of [[3.6, 0.12], [3.9, 0.09]]) c.tube([38, y, -11.6], [43, y, -11.6], rr, COUL.calorifuge, m.tole, 6);
  // Le tas de charbon des Charbonniers, la brouette, la pelle
  gravats(c, 39.8, -10.2, 1.5, Math.round(20 + 6 * usure), [COUL.charbon, 0x3a3836, 0x232221]);
  debris(c, 38.6, -11.6, 42, -8.5, 16, [COUL.charbon, 0x3a3836]);
  c.repere({ x: 40.6, z: -6.4, ry: 0.5 }, () => {
    c.boite(0.6, 0.3, 0.9, 0x5a5e5a, { y: 0.45, rx: -0.1 }, m.tole);
    c.poser(cylindre(0.18, 0.18, 0.06, 8), m.tole, COUL.fonte, { y: 0.18, z: 0.55, rz: Math.PI / 2 });
    for (const s of [-1, 1]) c.poutre([s * 0.25, 0.4, 0.3], [s * 0.3, 0.7, -0.9], 0.04, COUL.bois, m.mat);
  });
  c.poutre([38.3, 0.05, -7.6], [38.25, 1.4, -7.9], 0.04, COUL.bois, m.mat);
  c.boite(0.25, 0.3, 0.03, 0x5a5e5a, { x: 38.31, y: 0.2, z: -7.58, ry: Math.PI / 2 }, m.tole);
  // Le bûcher : la réserve de bois sec
  buches(c, 38.8, -5.4, Math.PI / 2, 2.2, 6);
  // La cheminée de brique, hors œuvre à l'est
  c.pave(48.6, 0, -8.6, 50.8, 2.2, -6.4, COUL.brique, m.brique, { nuance: 0.02 });
  c.poser(cylindre(0.78, 1.08, 22, 10), m.brique, COUL.brique, { x: 49.7, y: 13.2, z: -7.5 }, { nuance: 0.02 });
  for (const y of [6, 12, 18, 23.6]) c.poser(cylindre(0.98 - (y / 22) * 0.28, 0.98 - (y / 22) * 0.28, 0.22, 10), m.tole, 0x3f3a36, { x: 49.7, y, z: -7.5 }, { crasse: false });
  b.obstacle(48.6, -8.6, 50.8, -8.6, "cheminée");
  b.obstacle(50.8, -8.6, 50.8, -6.4, "cheminée");
  b.obstacle(48.6, -6.4, 50.8, -6.4, "cheminée");
  // La passerelle de tuyaux entre le sanatorium et la chaufferie
  for (const [y, rr] of [[3.6, 0.12], [3.9, 0.09]]) c.tube([30.2, y, -11.6], [38, y, -11.6], rr, COUL.calorifuge, m.tole, 6);
  for (const x of [32.6, 35.4]) {
    c.tube([x, 0, -11.6], [x, 3.5, -11.6], 0.06, 0x5a5e5a, m.tole, 5);
    c.boite(0.1, 0.08, 0.7, 0x5a5e5a, { x, y: 3.48, z: -11.6 }, m.tole);
  }
  // Le temps : lierre sur la brique, herbes dans les gravats, neige au pied du mur nord
  lierre(c, 48.2, 0, -10, Math.PI / 2, 3, 4.5, Math.round(40 + 80 * usure));
  lierre(c, 44, 0, -2.83, 0, 3, 3, Math.round(30 + 60 * usure));
  gravats(c, 45.6, -2.2, 1.6, Math.round(12 + 18 * usure), [COUL.brique, 0x8a4a38, COUL.pierreSombre]);
  gravats(c, 48.9, -10.5, 1.2, Math.round(8 + 12 * usure), [COUL.brique, 0x8a4a38, COUL.pierreSombre]);
  semerTouffes(c, 38.5, -11.5, 47.5, -3.5, Math.round(16 + 30 * usure), PALETTE_HERBE);
  sapin(c, 46.6, -4.3, 1.4 + usure * 1.6);
}

function gare(k) {
  const { c, S, m, usure, b } = k;
  const X1 = -40;
  const X2 = -31;
  const Z1 = 22;
  const Z2 = 31.5;
  const H = 6.6;
  const beton = { ep: 0.3, couleur: 0xdedad0, mat: m.enduit };
  // Le quai
  c.pave(X1, 0, Z1, X2, 0.05, Z2 + 0.3, 0xb8b2a6, m.enduit, { crasse: false, nuance: 0 });
  // Murs nord et ouest (derrière, pleins)
  mur(c, [X2, Z1], [X1, Z1], { ...beton, h: H, ouvertures: [{ u: 4.5, l: 3.2, bas: 4.0, haut: 5.6, type: "vide" }], batiment: b });
  mur(c, [X1, Z1], [X1, Z2], { ...beton, h: H, ouvertures: [{ u: 3, l: 1.6, bas: 1.2, haut: 3.0, type: "vide" }, { u: 6.5, l: 1.6, bas: 1.2, haut: 3.0, type: "vide" }], batiment: b });
  // Mur est : l'entrée et deux grandes baies, coupé à hauteur d'allège
  const ouvE = [{ u: 1.9, l: 1.8, bas: 0.9, haut: 3.2, type: "fenetre", bris: 1 }, { u: 4.6, l: 2.4, bas: 0, haut: 2.8, type: "vide" }, { u: 7.4, l: 1.8, bas: 0.9, haut: 3.2, type: "fenetre", bris: 1 }];
  murCoupe(k, [X2, Z2], [X2, Z1], { ...beton, h: H, ouvertures: ouvE, haut: S });
  // Côté vallée : deux piles et un linteau, le quai ouvert sur le vide
  for (const x of [X1 + 0.3, X2 - 0.3]) {
    c.pave(x - 0.3, 0, Z2 - 0.3, x + 0.3, CUT, Z2 + 0.3, 0xdedad0, m.enduit);
    S.pave(x - 0.3, CUT, Z2 - 0.3, x + 0.3, H, Z2 + 0.3, 0xdedad0, m.enduit);
  }
  S.pave(X1, H - 0.9, Z2 - 0.3, X2, H, Z2 + 0.3, 0xdedad0, m.enduit);
  S.pave(X1 - 0.4, H, Z1 - 0.4, X2 + 0.4, H + 0.32, Z2 + 1.6, 0xdedad0, m.enduit, { crasse: false });
  S.pave(X1 - 0.4, H + 0.32, Z2 + 1.45, X2 + 0.4, H + 0.6, Z2 + 1.6, 0xdedad0, m.enduit, { crasse: false });
  // Le garde-corps du quai, ouvert là où partait la cabine
  for (const [xa, xb] of [[X1 + 0.6, -36.6], [-34.4, X2 - 0.6]]) {
    c.tube([xa, 1.0, Z2 + 0.1], [xb, 1.0, Z2 + 0.1], 0.03, 0x8d8f8a, m.tole, 5);
    for (const x of [xa, xb]) c.tube([x, 0, Z2 + 0.1], [x, 1.0, Z2 + 0.1], 0.03, 0x8d8f8a, m.tole, 5);
    b.obstacle(xa, Z2 + 0.1, xb, Z2 + 0.1, "garde-corps");
  }
  // La machinerie : la grande poulie horizontale, le moteur sur sa charpente
  for (const [x, z] of [[-36.7, 23.4], [-34.3, 23.4], [-36.7, 25.4], [-34.3, 25.4]]) c.tube([x, 0, z], [x, 3.9, z], 0.07, 0x5a5e5a, m.tole, 5);
  S.pave(-37, 3.9, 23.1, -34, 4.1, 25.7, 0x5a5e5a, m.tole);
  S.boite(2.1, 1.0, 1.5, 0x5f7a6e, { x: -35.5, y: 4.6, z: 24.4 }, m.tole);
  S.poser(cylindre(0.3, 0.3, 0.9, 8), m.tole, 0x4a4e4a, { x: -35.5, y: 4.7, z: 25.6, rx: Math.PI / 2 });
  S.boite(0.25, 0.25, 4.4, 0x4a4e4a, { x: -35.5, y: 4.95, z: 27.6 }, m.tole);
  S.poser(cylindre(1.65, 1.65, 0.14, 14), m.tole, 0x6a6e6a, { x: -35.5, y: 5.0, z: 29.8 });
  S.poser(cylindre(1.72, 1.72, 0.22, 14, true), m.tole, 0x4a4e4a, { x: -35.5, y: 5.0, z: 29.8 });
  S.poser(cylindre(0.25, 0.25, 0.5, 8), m.tole, 0x4a4e4a, { x: -35.5, y: 5.0, z: 29.8 });
  // Le guichet (et son offre premium), le tourniquet, le banc d'attente
  c.pave(-33.1, 0, 22.3, -31.35, 2.4, 24.6, 0xcfc9bb, m.enduit, { nuance: 0.03 });
  c.poser(plan(), m.verre, 0xffffff, { x: -32.2, y: 1.55, z: 24.61, e: [1.2, 0.7, 1] }, { crasse: false, nuance: 0 });
  c.pave(-33.2, 1.0, 24.6, -31.3, 1.06, 25.0, 0xb7ad97, m.satin);
  panneau(c, m.enseignes, R.coupefile, { x: -32.2, y: 2.12, z: 24.62 }, 1.5, 0.5);
  lanterne(c, -32.6, 1.06, 24.8);
  b.obstacle(-33.1, 24.6, -31.35, 24.6, "guichet");
  b.obstacle(-33.1, 22.3, -33.1, 24.6, "guichet");
  for (const z of [26.2, 27.8]) {
    c.tube([-32.6, 0, z], [-32.6, 0.95, z], 0.05, 0x8d8f8a, m.metal, 6);
    for (let i = 0; i < 3; i++) c.tube([-32.6, 0.9, z], [-32.6 + Math.cos(i * 2.1) * 0.45, 0.9, z + Math.sin(i * 2.1) * 0.45], 0.02, 0x8d8f8a, m.metal, 4);
  }
  banc(c, -39.3, 26.5, 2.4, Math.PI / 2);
  banc(c, -39.3, 29.4, 2.0, Math.PI / 2, true);
  // Le totem du téléphérique, devant l'entrée
  for (const z of [24.3, 26.0]) c.tube([-29.4, 0, z], [-29.4, 3.0, z], 0.05, 0x3f4b45, m.tole, 5);
  panneau(c, m.enseignes, R.teleph, { x: -29.33, y: 2.45, z: 25.15, ry: Math.PI / 2 }, 2.1, 0.7);
  panneau(c, m.enseignes, R.teleph, { x: -29.47, y: 2.45, z: 25.15, ry: -Math.PI / 2 }, 2.1, 0.7);
  // Le pylône, les câbles qui partent vers la vallée, un câble rompu
  const zp = 38.6;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.poutre([-35.5 + sx * 1.1, 0, zp + sz * 1.1], [-35.5 + sx * 0.3, 4.3, zp + sz * 0.3], 0.1, 0x6a6e6a, m.tole);
  for (const y of [1.2, 2.6]) {
    const d = 1.1 - (y / 4.3) * 0.8;
    for (const [a, bb] of [[[-d, -d], [d, -d]], [[-d, d], [d, d]], [[-d, -d], [-d, d]], [[d, -d], [d, d]]]) c.poutre([-35.5 + a[0], y, zp + a[1]], [-35.5 + bb[0], y, zp + bb[1]], 0.06, 0x6a6e6a, m.tole);
  }
  c.boite(3.9, 0.22, 0.4, 0x6a6e6a, { x: -35.5, y: 4.4, z: zp }, m.tole);
  for (const x of [-37.15, -33.85]) c.poser(cylindre(0.22, 0.22, 0.1, 8), m.tole, 0x3f3f3c, { x, y: 4.6, z: zp, rz: Math.PI / 2 });
  for (const x of [-37.15, -33.85]) {
    c.tube([x, 5.0, 29.8], [x, 4.65, zp], 0.025, 0x2e2e2c, m.metal, 4);
    if (x > -35) c.tube([x, 4.65, zp], [x, 3.7, 40], 0.025, 0x2e2e2c, m.metal, 4);
  }
  c.tube([-37.15, 4.65, zp], [-37.6, 2.2, 39.3], 0.025, 0x2e2e2c, m.metal, 4);
  c.tube([-37.6, 2.2, 39.3], [-38.6, 0.05, 37.4], 0.025, 0x2e2e2c, m.metal, 4);
  b.obstacle(-36.6, zp - 1.1, -34.4, zp - 1.1, "pylône");
  // La cabine, immobile au-dessus du vide, qui se balance doucement (objet animé à part)
  cabine(k, -33.85, 4.83, 34.2);
  // Le temps
  semerTouffes(c, X1, Z1, X2, Z2, Math.round(10 + 20 * usure), PALETTE_HERBE);
  jonchee(c, X1, Z1, X2, Z2, Math.round(20 + 40 * usure), AIGUILLES);
  debris(c, X1, Z1, X2, Z2, Math.round(10 + 20 * usure));
  lierre(c, X1 - 0.17, 0, 27, -Math.PI / 2, 5, 4.5, Math.round(30 + 60 * usure));
}

function cabine(k, x, y, z) {
  const m = matieres();
  const c = new Chantier(55);
  const coul = COUL.cabine;
  // Le chariot sur le câble, la suspente, la cabine
  c.boite(0.3, 0.25, 0.9, 0x3f3f3c, { y: 0.12 }, m.tole);
  for (const dz of [-0.3, 0.3]) c.poser(cylindre(0.12, 0.12, 0.08, 8), m.tole, 0x3f3f3c, { y: 0.02, z: dz, rz: Math.PI / 2 });
  c.tube([0, 0, 0], [0, -1.0, 0], 0.05, 0x4a4e4a, m.tole, 5);
  c.tube([0, -1.0, 0], [0.85, -1.05, 0], 0.04, 0x4a4e4a, m.tole, 5);
  c.boite(2.3, 0.14, 2.1, coul, { x: 0.85, y: -1.12 }, m.tole, { nuance: 0.03, crasse: false });
  c.boite(2.2, 0.75, 2.0, coul, { x: 0.85, y: -2.95 }, m.tole, { nuance: 0.03, crasse: false });
  for (const [px, pz] of [[-0.24, -0.98], [1.94, -0.98], [-0.24, 0.98], [1.94, 0.98]]) c.boite(0.1, 1.2, 0.1, coul, { x: px, y: -1.8, z: pz }, m.tole, { crasse: false });
  c.boite(2.2, 0.08, 2.0, 0x3f4b48, { x: 0.85, y: -3.3 }, m.tole, { crasse: false });
  // Les vitres (il en manque), une coulure de rouille, le numéro effacé
  for (const [px, pz, ry, l] of [[0.85, 1.0, 0, 2.0], [0.85, -1.0, 0, 2.0], [1.95, 0, Math.PI / 2, 1.9], [-0.25, 0, Math.PI / 2, 1.9]]) {
    if (c.hasard() < 0.3) continue;
    c.poser(plan(), m.verre, 0xffffff, { x: px, y: -1.8, z: pz, ry, e: [l, 1.15, 1] }, { crasse: false, nuance: 0 });
  }
  c.boite(0.25, 0.6, 0.01, 0x7a4a2e, { x: 1.4, y: -2.9, z: 1.005 }, m.tole, { crasse: false });
  const objet = c.construire();
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  objet.position.set(-0.85, 0, 0);
  pivot.add(objet);
  pivot.userData.animer = (t) => {
    pivot.rotation.x = 0.035 * Math.sin(t * 0.8);
    pivot.rotation.z = 0.015 * Math.sin(t * 0.53 + 1);
  };
  const porteur = new THREE.Group();
  porteur.add(pivot);
  k.b.ajouter(porteur);
}

function kiosque(k) {
  const { c, m, usure, b } = k;
  const cx = 12;
  const cz = 24;
  const R8 = 3.35;
  c.poser(cylindre(3.75, 3.85, 0.12, 8), m.enduit, 0xbfb8a8, { x: cx, y: 0.06, z: cz, ry: Math.PI / 8 }, { nuance: 0.02 });
  const coin = (i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [cx + Math.sin(a) * R8, cz + Math.cos(a) * R8];
  };
  // Les colonnettes de fonte, la balustrade (ouverte au nord, vers l'allée)
  for (let i = 0; i < 8; i++) {
    const [x, z] = coin(i);
    c.tube([x, 0.12, z], [x, 3.25, z], 0.06, 0x56645c, m.tole, 6);
    c.boite(0.22, 0.14, 0.22, 0x56645c, { x, y: 3.2, z }, m.tole);
    const [x2, z2] = coin(i + 1);
    const mz = (z + z2) / 2 - cz;
    if (mz < -2.5) continue; // l'entrée
    if (i === 2 && usure > 0.5) continue; // une travée arrachée
    c.tube([x, 0.95, z], [x2, 0.95, z2], 0.03, 0x56645c, m.tole, 5);
    c.tube([x, 0.25, z], [x2, 0.25, z2], 0.025, 0x56645c, m.tole, 4);
    for (const t of [0.25, 0.5, 0.75]) c.boite(0.03, 0.7, 0.03, 0x56645c, { x: x + (x2 - x) * t, y: 0.6, z: z + (z2 - z) * t }, m.tole);
    b.obstacle(x, z, x2, z2, "balustrade du kiosque");
  }
  // Le lambrequin de bois découpé, le toit de zinc vert-de-gris, l'épi
  c.poser(cylindre(3.55, 3.55, 0.38, 8, true), m.toile, 0xe3dcc8, { x: cx, y: 3.08, z: cz, ry: Math.PI / 8 }, { crasse: false });
  c.poser(cylindre(3.5, 3.5, 0.16, 8), m.mat, 0xd9d2c0, { x: cx, y: 3.3, z: cz, ry: Math.PI / 8 }, { crasse: false });
  c.poser(new THREE.ConeGeometry(4.1, 1.9, 8), m.tole, 0x7aa391, { x: cx, y: 3.38 + 0.95, z: cz, ry: Math.PI / 8 }, { crasse: false, nuance: 0.03 });
  c.tube([cx, 5.2, cz], [cx, 6.1, cz], 0.04, 0x56645c, m.tole, 5);
  c.poser(BOULE, m.metal, 0xb59048, { x: cx, y: 5.6, z: cz, e: 0.14 }, { crasse: false });
  mousse(c, cx + 1.5, 4.0, cz + 1.0, 0.8, Math.round(2 + 4 * usure), 0x6f8a45);
  // Le dernier concert : pupitres, chaises, une grosse caisse
  pupitre(c, cx - 1.2, cz + 0.6, Math.PI, false);
  pupitre(c, cx + 0.2, cz + 1.4, Math.PI + 0.3, true);
  pupitre(c, cx + 1.4, cz + 0.4, Math.PI - 0.4, false);
  for (const [dx, dz, ry, renv] of [[-1.6, -0.6, 0.4, false], [-0.2, -0.2, 0, false], [1.3, -0.8, -0.5, true], [0.8, 0.9, 2.6, false]]) chaise(c, cx + dx, cz + dz, ry, renv, COUL.boisClair);
  c.poser(cylindre(0.4, 0.4, 0.36, 10), m.toile, 0xd8cfb4, { x: cx - 1.8, y: 0.4, z: cz + 1.5, rx: Math.PI / 2, ry: 0.5 }, { nuance: 0.03 });
  c.poser(cylindre(0.41, 0.41, 0.06, 10), m.satin, 0x6a2f2c, { x: cx - 1.8, y: 0.4, z: cz + 1.5, rx: Math.PI / 2, ry: 0.5 });
  jonchee(c, cx - 3, cz - 3, cx + 3, cz + 3, Math.round(20 + 30 * usure), AIGUILLES, 0.13);
  plaqueNeige(c, cx - 1.5, cz - 4.2, 0.9);
}

function belvedere(k) {
  const { c, m, usure, b } = k;
  const z = 39;
  // Le parapet du belvédère : muret de pierre, main courante de tube ; au-delà, le vide et la vallée
  const segs = [[-28.6, -4], [-4, 20], [20, 51.8]];
  for (const [x1, x2] of segs) {
    c.pave(x1, 0, z - 0.2, x2, 0.55, z + 0.2, 0xa9a397, m.enduit, { nuance: 0.03 });
    c.pave(x1, 0.55, z - 0.26, x2, 0.63, z + 0.26, COUL.pierreSombre, m.enduit, { nuance: 0.03 });
    b.obstacle(x1, z, x2, z, "parapet du belvédère");
  }
  const r = aleatoire(39);
  for (let x = -28; x < 51.5; x += 2.4) {
    if (r() < 0.12 * usure) continue;
    c.tube([x, 0.63, z], [x, 1.1, z], 0.03, 0x8d8f8a, m.tole, 4);
  }
  for (const [x1, x2] of [[-28, -9], [-6.6, 18], [22.6, 51]]) c.tube([x1, 1.1, z], [x2, 1.1, z], 0.03, 0x8d8f8a, m.tole, 5);
  // La longue-vue PANORAMA+
  c.repere({ x: 13.5, z: 38.2 }, () => {
    c.poser(cylindre(0.16, 0.22, 0.12, 8), m.tole, COUL.fonte, { y: 0.06 });
    c.tube([0, 0, 0], [0, 1.15, 0], 0.07, 0x8d8f8a, m.metal, 6);
    c.boite(0.36, 0.3, 0.42, 0x8d8f8a, { y: 1.32 }, m.metal);
    c.poser(cylindre(0.1, 0.13, 0.55, 8), m.metal, 0x6f726e, { y: 1.4, z: 0.35, rx: Math.PI / 2 - 0.1 });
    panneau(c, m.enseignes, R.panorama, { y: 0.8, z: -0.08, ry: Math.PI }, 0.6, 0.15);
    panneau(c, m.enseignes, R.panorama, { x: 0.2, y: 1.32, z: 0, ry: Math.PI / 2 }, 0.4, 0.1);
  });
  // Un dernier curiste a traîné sa chaise longue jusqu'ici
  chaiseLongue(c, 5.5, 37.2, 0.1, { plaid: 0x6b7a5f });
  semerTouffes(c, -28, 37.2, 51, 38.7, Math.round(30 + 50 * usure), PALETTE_HERBE);
  lierre(c, 30, 0, z + 0.21, 0, 5, 0.6, Math.round(14 + 20 * usure));
}
