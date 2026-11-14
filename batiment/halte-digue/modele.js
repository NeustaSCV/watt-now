// La halte de la digue des Roselières (Book 20 §4 « la digue », route des Marais ; Book 01 §2 bis : les haltes).
//
// Une route étroite, à une voie et demie, posée sur une digue de terre et d'enrochements, d'ouest en est. De l'eau des
// deux côtés : au nord l'étang des Roselières et son marais (y = −1), au sud le canal (y = −1,5). Le seul passage est
// la digue, et la digue a deux goulets : la brèche, où l'étang se vide dans le canal et qu'on franchit sur une porte de
// grange couchée en travers, puis l'écluse, qu'on traverse sur l'étroite passerelle de ses portes, au-dessus de la
// chambre vide.
//
// Repère de la halte entière : 200 × 70 m, origine au centre, +x à l'est, +z au sud, crête de la digue à y = 0. Tout est
// bâti dans ce repère, puis chaque tronçon (50 × 70 m) ne garde que ce qui tombe dans sa bande de x et se recentre.
// Les pièces continues (route, terrain, eau, fils électriques) sont découpées par morceaux attribués au tronçon qui
// contient leur milieu ; le terrain est une grille alignée sur le repère global : les raccords sont exacts.
//
// On visite : l'abri à tourbe et l'observatoire ornithologique (entrée), les deux huttes de chasse sur leurs pontons
// (brèche), l'écluse et la maison de l'éclusier (cuisine, chambre, atelier, jardin), la station de pompage (salle des
// pompes, salle de commande) et la cabane du pêcheur avec son carrelet (sortie). Toits et hauts de façades s'effacent.
//
// Fichiers : outils.js (relief, couleurs, matières, petits outils), lieux.js (ce qui se visite), atlas.js (textures).

import * as THREE from "three";
import { Batiment, aleatoire, touffes, flaque, debris, arbre } from "../commun/atelier.js";
import {
  PI, COUL, M, matieres, hache, bruit, arr, zc, HD, HL, Y_ETANG, Y_CANAL, XB, WB, CH, Z_AMONT, Z_AVAL,
  hauteur, praticable, occupe, zRoseliere, zRive, quad, roseaux, roseliere, sauleTetard, peuplier, nid, ROCHE, BOULE,
  geoCyl, cylindre,
} from "./outils.js";
import { entree, breche, huttes, ecluse, maisonEclusier, pompage, cabane, borneVelos, fourgon, sortie } from "./lieux.js";

// ---------- Les tronçons ----------

const X0 = { entree: -75, breche: -25, ecluse: 25, carrelet: 75 };

/** Le filtre d'un tronçon : un objet appartient au tronçon qui contient son centre (les bouts de la halte débordent). */
function bande(x0) {
  const xa = x0 - 25;
  const xb = x0 + 25;
  return (x) => (x >= xa || xa <= -100) && (x < xb || xb >= 100);
}

const versTroncon = (liste, id) => liste.filter((o) => bande(X0[id])(o.x)).map((o) => ({ ...o, x: arr(o.x - X0[id]) }));

// Les données de jeu, dans le repère de la halte entière (elles sont recentrées par tronçon plus bas).
const ENTREES = [
  { x: -100, z: arr(zc(-100)), nature: "entrée A : la route arrive de l'étang des Saules sur la digue" },
  { x: -87, z: -8, nature: "façade ouverte de l'abri à tourbe" },
  { x: -66, z: -4, nature: "ponton de l'observatoire ornithologique (départ sur la digue)" },
  { x: -66, z: -18.2, nature: "porte de l'observatoire" },
  { x: -42, z: -4.6, nature: "ponton de la première hutte de chasse" },
  { x: -42, z: -17.6, nature: "porte basse de la première hutte" },
  { x: -27.9, z: arr(zc(-24)), nature: "passerelle de la brèche, côté ouest (goulet)" },
  { x: -20.1, z: arr(zc(-24)), nature: "passerelle de la brèche, côté est" },
  { x: -14, z: -4.5, nature: "ponton de la seconde hutte" },
  { x: -7.8, z: -21.4, nature: "porte de la seconde hutte" },
  { x: 18.9, z: 0, nature: "passerelle des portes amont de l'écluse, côté ouest (goulet)" },
  { x: 25.1, z: 0, nature: "passerelle des portes amont de l'écluse, côté est" },
  { x: 32, z: 6, nature: "porte de la cuisine de l'éclusier, côté digue" },
  { x: 31.6, z: 12.5, nature: "porte du jardin de l'éclusier" },
  { x: 43.5, z: 9.7, nature: "porte de l'atelier (tombée)" },
  { x: 60.7, z: -8, nature: "grande porte de la station de pompage" },
  { x: 67.5, z: -9.2, nature: "porte de la salle de commande" },
  { x: 81, z: 4.6, nature: "ponton de la cabane du pêcheur" },
  { x: 81, z: 11.5, nature: "porte de la cabane du pêcheur" },
  { x: 100, z: arr(zc(100)), nature: "sortie B : la route quitte la digue vers le gué" },
];

const FOUILLE = [
  // L'entrée des marais
  { x: -87.2, z: -10.8, quoi: "abri à tourbe : piles de briquettes de tourbe sèche (combustible des Charbonniers)" },
  { x: -84.6, z: -9.6, quoi: "brouette, louchet à tourbe, sacs de jute (outils, fibres)" },
  { x: -81.6, z: -10.4, quoi: "chandelles de tourbe qui sèchent au vent (tourbe humide)" },
  { x: -72, z: -3.4, quoi: "roselière au pied du talus : roseaux et massettes (fibres, chaume)" },
  { x: -66, z: -20.6, quoi: "observatoire : écrans morts (verre, petite électronique), jumelles oubliées" },
  { x: -62.8, z: -17.6, quoi: "longue-vue connectée : lentilles, petite batterie" },
  { x: -56.5, z: 4.4, quoi: "barque échouée : rame, écope, corde, nasse" },
  // La brèche et les huttes
  { x: -42.6, z: -19.6, quoi: "première hutte : lits de camp (toile), couvertures, réchaud et cartouche de gaz" },
  { x: -41.2, z: -20.2, quoi: "première hutte : appelants en bois, lanterne, sifflets à canard" },
  { x: -17.2, z: -3.6, quoi: "poste de guet des survivants : bâche, jerrican d'eau, sacs de sable" },
  { x: -20.4, z: 2.4, quoi: "lèvre de la brèche : argile grise mise à nu (argile)" },
  { x: -35.5, z: 1.6, quoi: "épave de voiture : coffre (couverture, cric, câbles)" },
  { x: -5.9, z: -21.9, quoi: "seconde hutte : réchaud aux braises, gamelles, conserves, gibecière" },
  { x: -9.4, z: -22.6, quoi: "seconde hutte : la tablette « Canard+ » (petite batterie), cordes, leurres" },
  // L'écluse et la maison de l'éclusier
  { x: 27.5, z: -1.8, quoi: "treuil des vannes : engrenages, manivelle, chaîne (mécanique)" },
  { x: 14.8, z: 0, quoi: "chicane des survivants : palettes (bois), sacs de sable" },
  { x: 33.1, z: 6.9, quoi: "cuisine : buffet (conserves, sel, bocaux), lampe à pétrole" },
  { x: 30.9, z: 7.7, quoi: "cuisinière à bois : fonte, tisonnier, bûches" },
  { x: 37.4, z: 10.4, quoi: "chambre : édredon, couvertures, armoire (vêtements, toile)" },
  { x: 41.2, z: 8.2, quoi: "atelier : étau, outils, engrenages de rechange, fûts d'huile (mécanique)" },
  { x: 36.4, z: 16.1, quoi: "feu des survivants : marmite, poisson fumé, bois sec" },
  { x: 42.3, z: 15.1, quoi: "potager : choux montés, oignons, pommes de terre" },
  // La station de pompage, le carrelet, la borne
  { x: 61, z: -10.4, quoi: "salle des pompes : courroies, huile, câbles de cuivre (mécanique)" },
  { x: 65.7, z: -12.8, quoi: "salle de commande : fusibles, cadrans, registre, tablette WattyPompe" },
  { x: 62.5, z: -16.1, quoi: "grille d'aspiration : minerai de fer des marais, boue rouille (fer)" },
  { x: 80.6, z: 13.6, quoi: "cabane du pêcheur : filets (fibres), flotteurs, hameçons, couchette" },
  { x: 80, z: 16.2, quoi: "séchoir : poisson séché" },
  { x: 85, z: 15.2, quoi: "carrelet : grand filet carré, treuil, corde, lampe-tempête" },
  { x: 73.2, z: 1.9, quoi: "fourgon Watty Services : outils, câbles, batteries vides" },
  { x: 91.2, z: 3.0, quoi: "borne WattyVélo : batteries de vélos électriques noyées (Wh), câbles" },
];

const ETEINTS = [
  { x: -82, z: 0.6, type: "errant (sur la digue, sous le panneau de la réserve)" },
  { x: -70.5, z: -6.8, type: "rampant (dans les roseaux, au pied du ponton de l'observatoire)" },
  { x: -37, z: -6.5, type: "rampant (dans les roseaux, entre la digue et la première hutte)" },
  { x: -24.3, z: 1.6, type: "noyé (il sort de l'eau au pied de la brèche, ruisselant de vase)" },
  { x: -7.4, z: -22.8, type: "ancien habitant (un chasseur en ciré, dans la seconde hutte)" },
  { x: 9, z: -1.6, type: "errant (à l'approche de l'écluse)" },
  { x: 22, z: 6.2, type: "noyé (au fond de l'écluse vide : il ne peut plus remonter, il gémit sous la passerelle)" },
  { x: 41.6, z: 10.6, type: "ancien habitant (l'éclusier, dans son atelier)" },
  { x: 69.6, z: -4.2, type: "rampant (dans les roseaux, derrière la station de pompage)" },
  { x: 76.6, z: -0.6, type: "errant (contre le fourgon Watty Services)" },
  { x: 89.6, z: 4.6, type: "noyé (il sort du canal près de la borne des vélos)" },
];

const TRONCONS = [
  {
    id: "entree",
    nom: "L'entrée des marais",
    depart: { x: -98, z: zc(-98) },
    description: "la digue s'avance entre l'étang et le canal : la barrière ouverte, le panneau de la réserve connectée, l'abri à tourbe des Charbonniers, l'observatoire ornithologique sur son ponton, la barque échouée",
  },
  {
    id: "breche",
    nom: "La brèche",
    depart: { x: -48, z: zc(-48) },
    description: "les deux huttes de chasse à demi immergées au bout de leurs pontons, et la brèche où l'étang se vide dans le canal, franchie sur une porte de grange (goulet), sous l'œil du poste de guet",
  },
  {
    id: "ecluse",
    nom: "L'écluse",
    depart: { x: 2, z: zc(2) },
    description: "la chicane des survivants, la passerelle étroite des portes amont au-dessus de la chambre vide (goulet), la maison de l'éclusier, son atelier, son jardin et le feu des survivants",
  },
  {
    id: "carrelet",
    nom: "La station et le carrelet",
    depart: { x: 52, z: zc(52) },
    description: "la station de pompage de brique et sa grille rouillée, le fourgon Watty Services, la cabane du pêcheur et son carrelet sur le canal, la borne de vélos engloutie dans le talus effondré",
  },
];

export const FICHE = {
  id: "halte-digue",
  nom: "La digue des Roselières",
  lieu: "Halte · route des Marais · entre l'anneau proche et le moyen",
  environnement: "marais et rivière",
  anneau: "proche → moyen",
  danger: 2,
  halte: true,
  solPropre: true, // l'étang et le canal sont sous y = 0 : chaque tronçon fournit tout son sol
  recit:
    "La digue des Roselières tient l'étang au nord et le canal au sud ; l'Abondance y avait ouvert une « réserve naturelle connectée » où l'on observait, contre abonnement, des hérons en réalité augmentée. Les vrais sont partis, il reste leurs nids, des huttes de chasse « réservables sur l'appli » et une digue qui a cédé en son milieu. Pour passer, on traverse la brèche sur une porte de grange, puis l'écluse sur la passerelle de ses portes : deux endroits où l'on ne marche qu'un par un, sous le regard de ceux qui attendent dans les roseaux.",
  inspiration:
    "les digues du Marais poitevin et de la Brière, les écluses à portes busquées des canaux du Nord et leurs maisons d'éclusier aux volets bleus, les huttes de chasse de la baie de Somme, les carrelets de l'estuaire de la Gironde, les stations de pompage (gemalen) de brique des polders, et les photos urbex de réserves ornithologiques abandonnées",
  reperes: [
    "La digue : une route à une voie et demie, de l'eau des deux côtés, talus en pente, enrochements côté canal, herbe au milieu de la chaussée",
    "Les poteaux électriques en bois, penchés ; l'un est tombé dans le marais et ses fils trempent dans l'eau",
    "Les saules têtards, les roseaux et leurs massettes, les nénuphars et les lentilles d'eau, la brume basse au ras de l'eau",
    "Le panneau « Réserve naturelle connectée — Observez les oiseaux en réalité augmentée » (appli Plume+)",
    "L'abri à tourbe des Charbonniers : briquettes empilées, chandelles qui sèchent, brasero, pancarte « 1 pile = 3 clous » 🔥",
    "L'observatoire ornithologique sur pilotis : écrans morts, un seul luit encore (« Aucun oiseau détecté »), frise des oiseaux absents, longue-vue connectée",
    "Les nids de hérons vides sur les arbres morts et les balises",
    "Les deux huttes de chasse à demi immergées, leur toit de chaume, l'affût, les appelants qui flottent encore, la « Hutte connectée — résa sur l'appli »",
    "La brèche : l'étang se vide dans le canal en cascade ; la passerelle de fortune faite d'une porte de grange et de planches, la corde, le tronc échoué (goulet)",
    "Le poste de guet des survivants (sacs de sable, palettes) et l'épave de voiture : les couverts de l'embuscade",
    "L'écluse n° 7 : portes busquées, chambre vide en contrebas où l'eau fuit en filets, bras de manœuvre, treuil des vannes ; on passe sur la passerelle des portes amont, à garde-corps (goulet)",
    "La maison de l'éclusier aux volets bleus : cuisine (cuisinière, calendrier Watty), chambre, atelier ⚙️, jardin, feu des survivants",
    "La station de pompage des Bas-Prés (1931) : deux pompes, pont roulant, tableau à cadrans, tablette « WattyPompe — votre marais piloté depuis votre canapé », grille rouillée et minerai de fer des marais",
    "Le fourgon « Watty Services — intervention garantie en 30 min », échoué sur la digue",
    "La cabane du pêcheur sur pilotis et son carrelet, le grand filet carré suspendu au-dessus du canal, la lampe-tempête",
    "La borne de recharge WattyVélo « 100 % en 3 minutes », à demi engloutie avec ses vélos dans le talus effondré",
    "La nuit : le brasero des Charbonniers, la lanterne de la hutte, le feu devant la maison de l'éclusier, la lampe-tempête du carrelet, le voyant de la borne",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -98, z: arr(zc(-98)) },
  goulets: [
    { x: XB, z: arr(zc(XB)), nature: "la brèche : l'étang se vide dans le canal ; on passe un par un sur la porte de grange et les planches" },
    { x: 22, z: 0, nature: "l'écluse : la passerelle des portes amont, large d'un mètre, au-dessus de la chambre vide ; chicane de sacs de sable à l'ouest" },
  ],
  panneaux: [
    { x: -96.5, z: 4.4, texte: "Le Gué · Moulin à eau — par la digue, 6 km →" },
    { x: -96.5, z: 4.4, texte: "← Étang des Saules · Ton terrain — 9 km" },
    { x: -78.5, z: 4.0, texte: "Réserve naturelle connectée — Observez les oiseaux en réalité augmentée" },
    { x: 13.6, z: 3.7, texte: "Écluse n° 7 · des Roselières" },
    { x: 96.5, z: -3.4, texte: "Le Gué · Écluse et péniche · Station d'épuration — 4 km →" },
    { x: 96.5, z: -3.4, texte: "← Digue des Roselières · Étang des Saules" },
  ],
  cartes: TRONCONS.map((t) => ({
    id: t.id,
    nom: t.nom,
    lot: { l: 50, p: 70 },
    decalage: { x: X0[t.id], z: 0 },
    solPropre: true,
    depart: { x: arr(t.depart.x - X0[t.id]), z: arr(t.depart.z) },
    description: t.description,
    entrees: versTroncon(ENTREES, t.id),
    fouille: versTroncon(FOUILLE, t.id),
    eteints: versTroncon(ETEINTS, t.id),
  })),
};

// ---------- Le terrain ----------

const dansChambre = (x, z) => x > CH.x1 && x < CH.x2 && z > CH.z1 && z < CH.z2;

/** La teinte d'un triangle : crête, accotements, talus, enrochements, vase, rive d'en face. */
function classe(x, y, z, ny) {
  const b = bruit(x * 0.2, z * 0.2);
  const b2 = bruit(x * 0.6 + 9, z * 0.6);
  const zr = z - zc(x);
  if (y > -0.04 && ny > 0.97) {
    if (z > 20) return b > 0.5 ? COUL.herbe : COUL.herbeSombre;
    if (Math.abs(zr) < HL + 0.5 && x < 100) return b2 > 0.5 ? COUL.terre : COUL.gravier;
    return b > 0.62 ? COUL.herbeSeche : b < 0.3 ? COUL.herbeSombre : COUL.herbe;
  }
  if (y > 0.04) return b > 0.5 ? COUL.herbe : COUL.herbeSombre;
  const niveau = zr < 0 ? Y_ETANG : Y_CANAL;
  if (y > niveau + 0.04) {
    if (zr < 0) return ny > 0.9 ? COUL.vase : b2 > 0.5 ? COUL.herbeSombre : COUL.terre;
    if (z > 20) return ny > 0.9 ? COUL.vase : COUL.terre;
    return b2 > 0.4 ? COUL.enrochement : COUL.terre;
  }
  return b > 0.5 ? COUL.boue : COUL.boueSombre;
}

function terrain(ctx) {
  const { c, xa, xb } = ctx;
  const x1 = Math.max(-100, xa);
  const x2 = Math.min(100, xb);
  const nx = Math.round(x2 - x1);
  const nz = 70;
  const V = [];
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      let x = x1 + i;
      let z = -35 + j;
      const gi = Math.round(x + 100);
      // Un léger désordre des sommets (déterministe : les tronçons voisins tombent d'accord sur leur bord commun)
      if (!(x > 8 && x < 50)) {
        if (i > 0 && i < nx) x += (hache(gi, j + 7) - 0.5) * 0.4;
        if (j > 0 && j < nz) z += (hache(gi + 3, j) - 0.5) * 0.4;
      }
      V.push([x, hauteur(x, z), z]);
    }
  }
  const classes = new Map();
  const ajouter = (coul, ...pts) => {
    let t = classes.get(coul);
    if (!t) classes.set(coul, (t = []));
    for (const p of pts) t.push(p[0], p[1], p[2]);
  };
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const tri = (a, b2, c2) => {
    const x = (a[0] + b2[0] + c2[0]) / 3;
    const y = (a[1] + b2[1] + c2[1]) / 3;
    const z = (a[2] + b2[2] + c2[2]) / 3;
    if (dansChambre(x, z)) return;
    va.set(b2[0] - a[0], b2[1] - a[1], b2[2] - a[2]);
    vb.set(c2[0] - a[0], c2[1] - a[1], c2[2] - a[2]);
    const n = va.cross(vb).normalize();
    ajouter(classe(x, y, z, n.y), a, b2, c2);
  };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const v00 = V[j * (nx + 1) + i];
      const v10 = V[j * (nx + 1) + i + 1];
      const v01 = V[(j + 1) * (nx + 1) + i];
      const v11 = V[(j + 1) * (nx + 1) + i + 1];
      if ((i + j) % 2) {
        tri(v00, v01, v10);
        tri(v10, v01, v11);
      } else {
        tri(v00, v01, v11);
        tri(v00, v11, v10);
      }
    }
  }
  // Les tranches du lot (nord, sud, et les bouts de la halte) : une coupe de terre jusqu'à y = −4
  const tranche = (p, q) => {
    const a = [p[0], p[1], p[2]];
    const b2 = [q[0], q[1], q[2]];
    const a2 = [p[0], -4, p[2]];
    const b3 = [q[0], -4, q[2]];
    ajouter(0x4a4434, a, a2, b2, b2, a2, b3, a, b2, a2, b2, b3, a2);
  };
  for (let i = 0; i < nx; i++) {
    tranche(V[i], V[i + 1]);
    tranche(V[nz * (nx + 1) + i], V[nz * (nx + 1) + i + 1]);
  }
  if (xa <= -100 || xb >= 100) {
    const col = xa <= -100 ? 0 : nx;
    for (let j = 0; j < nz; j++) tranche(V[j * (nx + 1) + col], V[(j + 1) * (nx + 1) + col]);
  }
  for (const [coul, pos] of classes) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    c.poser(g, M.mat, coul, {}, { crasse: false, nuance: 0 });
    g.dispose();
  }
}

// ---------- L'eau, la brume, les plantes d'eau ----------

function poserBuffer(c, mat, pos, uv, couleur) {
  if (!pos.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un quadrilatère horizontal (x1, za1..za2) → (x2, zb1..zb2), normale vers le haut. */
function bandeH(pos, uv, x1, x2, za1, za2, zb1, zb2, y, fu, fv) {
  const A = [x1, y, za1];
  const B = [x1, y, za2];
  const C = [x2, y, zb1];
  const D = [x2, y, zb2];
  for (const p of [A, B, C, C, B, D]) {
    pos.push(...p);
    uv.push(fu(p), fv(p));
  }
}

const zPorteAmont = (x) => 0.28 - 0.6 * (1 - Math.abs(x - 22) / 3) - 0.18;
const zPorteAval = (x) => 13.25 - 0.6 * (1 - Math.abs(x - 22) / 3) + 0.18;

function eaux(ctx) {
  const { c, xa, xb, x0 } = ctx;
  const x1 = Math.max(-100, xa);
  const x2 = Math.min(100, xb);
  const nord = { pos: [], uv: [] };
  const sud = { pos: [], uv: [] };
  const T = 7;
  const fu = (p) => p[0] / T;
  const fv = (p) => -p[2] / T;
  for (let x = x1; x < x2 - 1e-6; x += 1) {
    const ecl = x + 0.5 > CH.x1 && x + 0.5 < CH.x2;
    const zn = (xx) => (ecl ? zPorteAmont(xx) : zc(xx));
    const zs = (xx) => (ecl ? zPorteAval(xx) : zc(xx));
    bandeH(nord.pos, nord.uv, x, x + 1, -35, zn(x), -35, zn(x + 1), Y_ETANG, fu, fv);
    bandeH(sud.pos, sud.uv, x, x + 1, zs(x), 35, zs(x + 1), 35, Y_CANAL, fu, fv);
  }
  poserBuffer(c, M.eau, nord.pos, nord.uv, COUL.etang);
  poserBuffer(c, M.eau, sud.pos, sud.uv, COUL.canal);
  // La brume basse au ras de l'eau : des voiles additifs, légers, qui dérivent
  const brume = { pos: [], uv: [] };
  for (const [z1, z2, y, d] of [[-31, -19, Y_ETANG + 0.45, 0], [-17.5, -8, Y_ETANG + 0.38, 0.37], [8.5, 17.5, Y_CANAL + 0.42, 0.61], [18.5, 27.5, Y_CANAL + 0.5, 0.13]]) {
    bandeH(brume.pos, brume.uv, x1, x2, z1, z2, z1, z2, y, (p) => p[0] / 46 + d, (p) => (p[2] - z1) / (z2 - z1));
  }
  poserBuffer(c, M.brume, brume.pos, brume.uv, 0xbcc4c0);
  // Les nénuphars et les lentilles d'eau
  for (const [x, z, n] of PLACES.nenuphars) {
    if (!ctx.ici(x)) continue;
    for (let i = 0; i < n; i++) {
      const r = c.entre(0.16, 0.34);
      const px = x + c.entre(-1, 1);
      const pz = z + c.entre(-0.8, 0.8);
      const y = (pz - zc(px) < 0 ? Y_ETANG : Y_CANAL) + 0.012;
      c.poser(FEUILLE_NENUPHAR, M.satin, c.hasard() < 0.3 ? 0x7a9a48 : COUL.nenuphar, { x: px, y, z: pz, ry: c.hasard() * 6.3, e: [r, 1, r] }, { crasse: false, nuance: 0.06 });
      if (c.hasard() < 0.12) c.poser(BOULE_FLEUR, M.satin, c.hasard() < 0.5 ? 0xf2eee4 : 0xe8c0c8, { x: px + 0.05, y: y + 0.06, z: pz, e: [0.09, 0.06, 0.09] }, { crasse: false, nuance: 0.04 });
    }
  }
  for (const [x, z, r] of PLACES.lentilles) {
    if (!ctx.ici(x)) continue;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2;
      const rr = r * c.entre(0.55, 1.1);
      pts.push(new THREE.Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
    }
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-PI / 2);
    const y = (z - zc(x) < 0 || (x > CH.x1 && x < CH.x2 && z < 0) ? Y_ETANG : Y_CANAL) + 0.008;
    c.poser(g, M.mat, COUL.lentilles, { x, y, z, ry: c.hasard() * 3 }, { crasse: false, nuance: 0.05 });
    g.dispose();
  }
  void x0;
}

const FEUILLE_NENUPHAR = new THREE.CircleGeometry(1, 7, 0.35, PI * 2 - 0.7).rotateX(-PI / 2);
const BOULE_FLEUR = new THREE.IcosahedronGeometry(1, 0);

// ---------- La route ----------

/** Un ruban qui suit l'axe de la digue (décalages o1 → o2), mètre par mètre, attribué par milieu. */
function bandeRoute(ctx, o1, o2, y, couleur, garder) {
  const pos = [];
  const x1 = Math.max(-100, ctx.xa);
  const x2 = Math.min(100, ctx.xb);
  for (let x = x1; x < x2 - 1e-6; x += 1) {
    if (!garder(x + 0.5)) continue;
    const za = zc(x);
    const zb = zc(x + 1);
    const A = [x, y, za + o1], B = [x, y, za + o2], C = [x + 1, y, zb + o1], D = [x + 1, y, zb + o2];
    pos.push(...A, ...B, ...C, ...C, ...B, ...D);
  }
  if (!pos.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  ctx.c.poser(g, M.mat, couleur, {}, { crasse: false, nuance: 0 });
  g.dispose();
}

function route(ctx) {
  const { c, u } = ctx;
  const libre = (x) => Math.abs(x - XB) > WB + 0.25 && !(x > 12.6 && x < 31);
  bandeRoute(ctx, -HL, HL, 0.03, COUL.asphalte, libre);
  bandeRoute(ctx, -HL + 0.15, -HL + 0.27, 0.04, COUL.ligne, (x) => libre(x) && hache(Math.floor(x), 1) > 0.4);
  bandeRoute(ctx, HL - 0.27, HL - 0.15, 0.04, COUL.ligne, (x) => libre(x) && hache(Math.floor(x), 2) > 0.4);
  // L'herbe qui pousse au milieu de la chaussée, comme sur les chemins de digue
  const H = aleatoire(911);
  const brins = [];
  for (let k = 0; k < 260; k++) {
    const x = -100 + H() * 200;
    if (ctx.ici(x) && libre(x) && bruit(x * 0.08, 2) > 0.4) brins.push([x, zc(x) + (H() - 0.5) * 0.5, 0.03]);
  }
  touffes(c, brins, COUL.herbe);
  // Rapiéçages, nids-de-poule, flaques, bords grignotés
  const A = aleatoire(431);
  for (let k = 0; k < 110; k++) {
    const x = -100 + A() * 200;
    const off = (A() - 0.5) * 2 * (HL - 0.3);
    const l = 0.6 + A() * 2.4;
    const p = 0.4 + A() * 1.4;
    const r = A();
    if (!ctx.ici(x) || !libre(x)) continue;
    const ry = -Math.atan2(zc(x + 0.5) - zc(x - 0.5), 1) + (A() - 0.5) * 0.3;
    if (r < 0.55) c.boite(l, 0.01, p, A() < 0.7 ? COUL.asphalteR : 0x5c5e5e, { x, y: 0.037, z: zc(x) + off, ry }, M.mat, { crasse: false, nuance: 0.04 });
    else if (r < 0.75) flaque(c, x, zc(x) + off, 0.4 + A() * 0.7, 0.045);
    else c.boite(l * 0.5, 0.012, p * 0.5, 0x6d6447, { x, y: 0.038, z: zc(x) + off, ry }, M.mat, { crasse: false, nuance: 0.05 });
  }
  const B = aleatoire(77);
  for (let k = 0; k < 160; k++) {
    const x = -100 + B() * 200;
    const s = B() < 0.5 ? -1 : 1;
    if (!ctx.ici(x) || !libre(x)) continue;
    const z = zc(x) + s * (HL - 0.05 + B() * 0.3);
    const t = 0.15 + B() * 0.35;
    c.boite(t * 1.6, 0.06, t, COUL.asphalte, { x, y: 0.02, z, ry: B() * 3 }, M.mat, { nuance: 0.05 });
  }
  debris(c, ctx.xa, -1, ctx.xb, 1, Math.round(30 * u), [COUL.gravier, 0x7a7468]);
}

// ---------- Les bords, pour le jeu : la limite de ce qui est praticable (marches de carrés, simplifiées) ----------

function distSeg(p, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz;
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
}

function simplifier(p, tol) {
  if (p.length < 3) return p;
  const garde = new Uint8Array(p.length);
  garde[0] = garde[p.length - 1] = 1;
  const pile = [[0, p.length - 1]];
  while (pile.length) {
    const [a, z] = pile.pop();
    let dmax = 0;
    let im = -1;
    for (let i = a + 1; i < z; i++) {
      const d = distSeg(p[i], p[a], p[z]);
      if (d > dmax) {
        dmax = d;
        im = i;
      }
    }
    if (dmax > tol) {
      garde[im] = 1;
      pile.push([a, im], [im, z]);
    }
  }
  return p.filter((_, i) => garde[i]);
}

function bordsEau(ctx) {
  const { b, xa, xb } = ctx;
  const P = 0.5;
  const x1 = Math.max(-100, xa);
  const x2 = Math.min(100, xb);
  const nx = Math.round((x2 - x1) / P);
  const nz = Math.round(70 / P);
  const W = nx + 1;
  const v = new Uint8Array(W * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) v[j * W + i] = praticable(x1 + i * P, -35 + j * P) ? 1 : 0;
  const pts = new Map();
  const adj = new Map();
  const lien = (k1, k2) => {
    if (!adj.has(k1)) adj.set(k1, []);
    if (!adj.has(k2)) adj.set(k2, []);
    adj.get(k1).push(k2);
    adj.get(k2).push(k1);
  };
  const eh = (i, j) => {
    const k = j * W + i;
    if (!pts.has(k)) pts.set(k, [x1 + (i + 0.5) * P, -35 + j * P]);
    return k;
  };
  const ev = (i, j) => {
    const k = 1e7 + j * W + i;
    if (!pts.has(k)) pts.set(k, [x1 + i * P, -35 + (j + 0.5) * P]);
    return k;
  };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = v[j * W + i];
      const bq = v[j * W + i + 1];
      const cq = v[(j + 1) * W + i + 1];
      const d = v[(j + 1) * W + i];
      const e = [];
      if (a !== bq) e.push(eh(i, j));
      if (bq !== cq) e.push(ev(i + 1, j));
      if (d !== cq) e.push(eh(i, j + 1));
      if (a !== d) e.push(ev(i, j));
      if (e.length === 2) lien(e[0], e[1]);
      else if (e.length === 4) {
        lien(e[0], e[1]);
        lien(e[2], e[3]);
      }
    }
  }
  const vus = new Set();
  const parcourir = (depart) => {
    const ch = [depart];
    vus.add(depart);
    let cur = depart;
    for (;;) {
      const nxt = adj.get(cur).find((k) => !vus.has(k));
      if (nxt === undefined) break;
      vus.add(nxt);
      ch.push(nxt);
      cur = nxt;
    }
    return ch;
  };
  const chaines = [];
  for (const [k, l] of adj) if (l.length === 1 && !vus.has(k)) chaines.push(parcourir(k));
  for (const k of adj.keys()) {
    if (vus.has(k)) continue;
    const ch = parcourir(k);
    ch.push(ch[0]);
    chaines.push(ch);
  }
  for (const ch of chaines) {
    const p = simplifier(ch.map((k) => pts.get(k)), 0.3);
    for (let i = 0; i < p.length - 1; i++) b.obstacle(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], "bord de l'eau");
  }
}

// ---------- La végétation, les enrochements, les balises ----------

/** Les places des plantes et des pierres, tirées une fois pour toute la halte, puis filtrées par tronçon. */
const PLACES = (() => {
  const A = aleatoire(1931);
  const P = { roseaux: [], masses: [], rochers: [], tetards: [], peupliers: [], nenuphars: [], lentilles: [], touffes: [] };
  for (let k = 0; k < 17000; k++) {
    const x = -100 + A() * 200;
    const z = -35 + A() * 70;
    if (occupe(x, z, 0.8)) continue;
    if (x > 16 && x < 28 && z > -16 && z < 20) continue; // le chenal et la chambre de l'écluse
    if (Math.abs(x - XB) < 3 && Math.abs(z - zc(x)) < 4.5) continue; // le courant de la brèche
    if (x > 86 && x < 93.5 && z > 16.5 && z < 23.5) continue; // sous le carrelet
    const h = hauteur(x, z);
    const zr = z - zc(x);
    const r = A();
    if (zr < 0) {
      if (z < zRoseliere(x) - 1.2) {
        if (r < 0.09) P.masses.push([x, z, h]);
        else if (r < 0.15) P.roseaux.push([x, z, h]);
        continue;
      }
      if (h > -1.35 && h < -0.4 && r < 0.8) P.roseaux.push([x, z, h]);
      else if (h <= -1.4 && r < 0.03 && bruit(x * 0.15, z * 0.15) > 0.45) P.nenuphars.push([x, z, 3 + Math.floor(A() * 5)]);
    } else {
      if (z > zRive(x) + 0.2 && h > -1.3) {
        if (r < 0.3) P.roseaux.push([x, z, h]);
        continue;
      }
      if (h > -1.8 && h < -1.05 && r < 0.45) P.roseaux.push([x, z, h]);
      else if (h < -2.2 && r < 0.008) P.nenuphars.push([x, z, 2 + Math.floor(A() * 4)]);
    }
  }
  // Les enrochements du talus sud (et quelques blocs au nord)
  for (let k = 0; k < 760; k++) {
    const x = -100 + A() * 200;
    const nord = A() < 0.15;
    const z = zc(x) + (nord ? -1 : 1) * (HD + 0.4 + A() * 2.3);
    if (occupe(x, z, 0.5) || Math.abs(x - XB) < 4.6 || (x > 11 && x < 47)) continue;
    const h = hauteur(x, z);
    if (h > -0.15 || h < -2.3) continue;
    P.rochers.push([x, z, h, 0.25 + A() * 0.4]);
  }
  // Les saules têtards : une rangée le long de l'accotement sud, quelques-uns au nord, d'autres sur la rive d'en face
  const evite = (x, zones) => zones.some(([a, b]) => x > a && x < b);
  for (let x = -97; x < 99; x += 9 + A() * 6) {
    if (evite(x, [[-31, -17], [8, 48], [-61, -52], [-81, -76], [76, 88], [86, 97], [70, 77]])) continue;
    P.tetards.push([x, zc(x) + HD - 0.5 - affaisse(x), 1.8 + A() * 0.9]);
  }
  for (let x = -94; x < 99; x += 14 + A() * 8) {
    if (evite(x, [[-93, -79], [-69, -63], [-45, -39], [-31, -17], [-17, -5], [8, 48], [53, 72], [94, 100], [-98, -94]])) continue;
    P.tetards.push([x, zc(x) - HD + 0.5, 1.7 + A() * 0.8]);
  }
  for (let x = -98; x < 100; x += 7 + A() * 6) P.tetards.push([x, zRive(x) + 2.6 + A() * 1.5, 1.8 + A() * 1.0]);
  for (let x = -96; x < 100; x += 9 + A() * 7) P.peupliers.push([x, 31 + A() * 3, 11 + A() * 5]);
  // Des touffes d'herbe sur les accotements de la crête
  for (let k = 0; k < 560; k++) {
    const x = -100 + A() * 200;
    const s = A() < 0.5 ? -1 : 1;
    const z = zc(x) + s * (HL + 0.25 + A() * (HD - HL - 0.4));
    if (occupe(x, z, 0.3) || (x > 11 && x < 47) || Math.abs(x - XB) < WB + 0.5) continue;
    if (hauteur(x, z) < -0.05) continue;
    P.touffes.push([x, z, 0]);
  }
  // Les lentilles d'eau, dans les recoins calmes
  for (let k = 0; k < 900 && P.lentilles.length < 34; k++) {
    const x = -100 + A() * 200;
    const nord = A() < 0.75;
    const z = zc(x) + (nord ? -1 : 1) * (HD + 2 + A() * 7);
    if (occupe(x, z, 1) || (x > 16 && x < 28) || Math.abs(x - XB) < 5) continue;
    if (hauteur(x, z) > -1.2) continue;
    P.lentilles.push([x, z, 0.35 + A() * 0.7]);
  }
  P.lentilles.push([21.4, -6, 0.8], [23, -8.8, 0.6], [20.4, -3.2, 0.5], [23.6, -4.4, 0.4]);
  return P;
})();

function affaisse(x) {
  const t = 1 - Math.abs(x - 91.5) / 4.5;
  return t > 0 ? 1.4 * t * t * (3 - 2 * t) : 0;
}

function nature(ctx) {
  const { c, u } = ctx;
  for (const [x, z, h] of PLACES.roseaux) if (ctx.ici(x)) roseaux(c, x, z, h - 0.05, 1.6 + c.hasard() * 1.0, 4 + Math.floor(c.hasard() * 3));
  for (const [x, z, h] of PLACES.masses) if (ctx.ici(x)) roseliere(c, x, z, h - 0.2, 0.9 + c.hasard() * 0.9);
  for (const [x, z, h, s] of PLACES.rochers) {
    if (!ctx.ici(x)) continue;
    c.poser(ROCHE, M.mat, c.hasard() < 0.5 ? COUL.roc : COUL.rocSombre, { x, y: h + s * 0.2, z, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s * c.entre(1, 1.5), s * 0.7, s] }, { nuance: 0.08 });
  }
  for (const [x, z, h] of PLACES.tetards) if (ctx.ici(x)) sauleTetard(c, x, z, hauteur(x, z), h);
  for (const [x, z, h] of PLACES.peupliers) if (ctx.ici(x)) peuplier(c, x, z, hauteur(x, z), h);
  touffes(c, PLACES.touffes.filter(([x]) => ctx.ici(x)), COUL.herbeSeche);
  // Les arbres morts du marais et leurs nids de hérons, vides
  for (const [x, z, hh] of [[-92, -24, 6.5], [-30, -23.5, 8], [52, -22.5, 7]]) {
    if (!ctx.ici(x)) continue;
    const y = hauteur(x, z);
    arbre(c, x, z, hh, "mort", y - 0.3);
    nid(c, x + 0.1, y + hh * 0.72, z + 0.1, 1.0);
  }
  // Les balises de chenal, peintes, délavées (certaines portent un nid)
  for (const [x, z, couleur, avecNid] of [[-80, 15.5, 0x9a4a3c, false], [-47, 14.5, 0x4f7a5a, true], [8, 17.5, 0x9a4a3c, false], [53, 13.8, 0x4f7a5a, false], [96, 15, 0x9a4a3c, true], [-52, -14, 0x9a4a3c, false], [36, -12, 0x4f7a5a, true]]) {
    if (!ctx.ici(x)) continue;
    const penche = (hache(Math.round(x), 5) - 0.5) * 0.25 * (0.5 + u);
    c.repere({ x, y: -2.6, z, rz: penche, rx: penche * 0.6 }, () => {
      c.poser(geoCyl(0.12, 0.14, 4.4, 6), M.mat, 0x5a4a3a, { y: 2.2 });
      c.poser(geoCyl(0.15, 0.15, 0.9, 6), M.satin, couleur, { y: 3.9 }, { crasse: false });
      c.poser(geoCyl(0.02, 0.3, 0.4, 4), M.satin, couleur, { y: 4.6 }, { crasse: false });
    });
    if (avecNid) nid(c, x + penche * 4.5, 2.2, z, 0.8);
  }
}

// ---------- Les poteaux électriques et leurs fils ----------

const POTEAUX = (() => {
  const A = aleatoire(311);
  return [-96, -68, -40, -4, 16, 44, 70, 97].map((x) => {
    const z = zc(x) - 3.3;
    if (x === -4) {
      // Tombé dans le marais : la tête dans l'eau, les isolateurs noyés
      const haut = [-2.0, Y_ETANG + 0.12, -11.4];
      return { x, z, base: [x, -0.25, z], haut, tombe: true, isol: [-0.7, 0, 0.7].map((o) => [haut[0] + o, Y_ETANG - 0.08, haut[2] + 0.4]) };
    }
    const H = 8;
    const lx = (A() - 0.5) * 0.1;
    const lz = -0.025 - A() * 0.07 - (x === -40 ? 0.09 : 0);
    const haut = [x + lx * H, H, z + lz * H];
    return { x, z, base: [x, -0.6, z], haut, isol: [-0.75, 0, 0.75].map((o, i) => [haut[0], H - 0.32 + (i === 1 ? 0.22 : 0), haut[2] + o]) };
  });
})();

function poteaux(ctx) {
  const { c } = ctx;
  for (const p of POTEAUX) {
    if (!ctx.ici(p.x)) continue;
    c.tube(p.base, p.haut, 0.13, COUL.poteau, M.mat, 6);
    if (p.tombe) {
      c.boite(0.12, 0.12, 1.8, 0x4a3e32, { x: p.haut[0] + 0.3, y: Y_ETANG + 0.05, z: p.haut[2] + 0.4, ry: 1.3 }, M.mat);
      // La souche arrachée, la terre retournée au bord du talus
      c.poser(BOULE, M.mat, COUL.terre, { x: p.x, y: -0.2, z: p.z, e: [0.7, 0.35, 0.6] }, { crasse: false });
    } else {
      c.boite(0.12, 0.12, 1.9, 0x4a3e32, { x: p.haut[0], y: p.haut[1] - 0.45, z: p.haut[2] }, M.mat);
      c.poutre([p.haut[0], p.haut[1] - 1.1, p.haut[2]], [p.haut[0], p.haut[1] - 0.5, p.haut[2] + 0.7], 0.05, 0x4a3e32, M.mat);
    }
    for (const q of p.isol) c.poser(geoCyl(0.05, 0.07, 0.18, 5), M.lisse, 0x7a9a8a, { x: q[0], y: q[1] + 0.02, z: q[2] }, { crasse: false });
    // Le transformateur de la station de pompage
    if (p.x === 70) {
      c.boite(0.6, 0.9, 0.5, 0x7d8689, { x: p.haut[0], y: 5.4, z: p.haut[2] - 0.35 }, M.tole);
      c.boite(0.5, 0.06, 0.3, 0x5a5f5a, { x: p.haut[0], y: 5.9, z: p.haut[2] - 0.35 }, M.metal);
      c.tube([p.haut[0], 5.0, p.haut[2] - 0.35], [p.haut[0] - 3, 3.6, -8.4], 0.025, 0x2b2b29, M.metal, 3);
    }
    // Un hauban, sur les poteaux qui penchent le plus
    if (p.x === -40 || p.x === 44) c.tube([p.haut[0], p.haut[1] - 1.5, p.haut[2]], [p.x, 0.05, p.z + 3.0], 0.015, 0x5a5a56, M.metal, 3);
  }
  // Les fils : des chaînettes de petits segments, chacun attribué au tronçon de son milieu, qui trempent dans l'eau
  // quand ils descendent jusqu'à elle
  const seg = (a, b) => {
    if (ctx.ici((a[0] + b[0]) / 2)) c.poutre(a, b, 0.028, 0x2b2b29, M.metal, { crasse: false, nuance: 0 });
  };
  const sol = (x, z) => Math.max(hauteur(x, z) + 0.05, (z - zc(x) < 0 ? Y_ETANG : Y_CANAL) - 0.1);
  for (let i = 0; i < POTEAUX.length - 1; i++) {
    for (let k = 0; k < 3; k++) {
      const P = POTEAUX[i].isol[k];
      const casse = i === 0 && k === 2;
      const Q = casse ? [-80.5, Y_ETANG - 0.1, -5.6] : POTEAUX[i + 1].isol[k];
      const fleche = casse ? 2.5 : 0.9 + hache(i, k) * 0.7;
      const N = casse ? 8 : 14;
      let prec = P;
      for (let s = 1; s <= N; s++) {
        const t = s / N;
        const p = [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t - fleche * 4 * t * (1 - t), P[2] + (Q[2] - P[2]) * t];
        p[1] = Math.max(p[1], sol(p[0], p[2]));
        seg(prec, p);
        prec = p;
      }
    }
  }
}

// ---------- La halte : un tronçon à la fois ----------

function recentrer(groupe, x0) {
  const vues = new Set();
  groupe.traverse((obj) => {
    if (obj.geometry && !vues.has(obj.geometry)) {
      vues.add(obj.geometry);
      obj.geometry.translate(-x0, 0, 0);
    }
  });
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - x0) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - x0 };
  }
  ud.obstacles = ud.obstacles.map((s) => ({ ...s, x1: arr(s.x1 - x0), x2: arr(s.x2 - x0) }));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - x0) }));
  return groupe;
}

export function creer({ usure = 0.7, carte = "entree" } = {}) {
  const def = FICHE.cartes.find((k) => k.id === carte) ?? FICHE.cartes[0];
  const x0 = def.decalage.x;
  matieres();
  const b = new Batiment(1931 + Math.round(x0), usure);
  const ctx = { b, c: b.c, u: usure, x0, xa: x0 - 25, xb: x0 + 25, ici: bande(x0), bris: 0.15 + 0.75 * usure };
  terrain(ctx);
  eaux(ctx);
  route(ctx);
  bordsEau(ctx);
  nature(ctx);
  poteaux(ctx);
  entree(ctx);
  breche(ctx);
  huttes(ctx);
  ecluse(ctx);
  maisonEclusier(ctx);
  pompage(ctx);
  fourgon(ctx);
  cabane(ctx);
  borneVelos(ctx);
  sortie(ctx);
  // L'eau qui dérive, les chutes qui coulent, la brume qui glisse, les flammes qui dansent, le voyant qui clignote
  const anime = new THREE.Object3D();
  anime.userData.animer = (t) => {
    M.eau.map.offset.set((t * 0.012) % 1, (t * 0.004) % 1);
    M.chute.map.offset.y = (t * 0.45) % 1;
    M.ecume.map.offset.y = (t * 0.25) % 1;
    M.ecume.opacity = 0.7 + 0.12 * Math.sin(t * 1.9);
    M.brume.map.offset.x = (t * 0.005) % 1;
    M.flamme.opacity = 0.7 + 0.15 * Math.sin(t * 13.1) * Math.sin(t * 7.3);
    M.voyant.opacity = Math.sin(t * 3.2) > 0.2 ? 0.95 : 0.12;
    M.lumineux.emissiveIntensity = 0.85 + 0.1 * Math.sin(t * 23.0) * Math.sin(t * 3.1);
  };
  b.ajouter(anime);
  return recentrer(b.construire(), x0);
}

void [Z_AMONT, Z_AVAL, cylindre, BOULE_FLEUR];
