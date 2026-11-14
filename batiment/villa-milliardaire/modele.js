// La villa du milliardaire (Book 20 §3.1, « Manoir du milliardaire », lieu spécial, Campagne, lointain).
//
// Une villa d'architecte des dernières années de l'Abondance, posée sur sa colline boisée : un rez-de-chaussée vitré
// et, en porte-à-faux au-dessus de la terrasse, un long volume de béton blanc à fenêtre en bandeau. Tout était
// automatique : la maison s'est éteinte avec le réseau, le personnel est parti, le propriétaire aussi.
// Ce qu'on vient y voir : la piscine à débordement devenue mare, le salon de verre éclaté où un bouleau pousse à
// travers la dalle, l'hélicoptère affaissé sur son aire, la supercar mangée par les ronces, et la porte blindée du
// « Refuge Premium », entrouverte sur un bunker en panne.

import * as THREE from "three";
import { Batiment, PALETTE, MAT, matiere, matiereMonde, matiereVerre, matiereEau, mur, lierre, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre, raiDeLumiere, flaque, dessiner } from "../commun/atelier.js";

export const FICHE = {
  id: "villa-milliardaire",
  nom: "La villa du milliardaire",
  lieu: "Manoir du milliardaire · Campagne · lointain",
  environnement: "campagne",
  anneau: "lointain",
  danger: 4,
  recit:
    "La maison savait tout faire : ouvrir les volets, remplir la piscine, commander le champagne. Quand le réseau est tombé, elle a cessé de savoir, et son propriétaire n'avait jamais appris. Il reste un salon de verre où pousse un bouleau, un hélicoptère qui n'a jamais décollé, et un bunker « autonome dix ans », sous réserve d'abonnement.",
  inspiration: "les villas modernistes abandonnées (béton blanc, porte-à-faux, piscine à débordement), les demeures de luxe saisies et laissées à l'abandon",
  reperes: [
    "La piscine à débordement, eau verte, flamant gonflable dégonflé, transats renversés",
    "Le salon de verre : baies éclatées (on entre par les carreaux manquants), bouleau qui traverse la dalle, rai de soleil",
    "Le porte-à-faux de l'étage, un pilier tordu, étayé par des survivants avec des troncs",
    "La cuisine : îlot de marbre, frigo connecté dont l'écran luit encore la nuit (« Mise à jour requise »)",
    "La cave à vin vitrée, l'escalier flottant dont les marches du haut sont tombées (étage inaccessible)",
    "L'hélicoptère affaissé sur son aire, pales qui pendent ; la supercar jaune sous l'abri, ronces dans le capot",
    "Le « Refuge Premium » : porte de coffre-fort entrouverte dans un tertre, borne d'abonnement éteinte",
    "Le buste doré du propriétaire, renversé dans l'entrée ; palmiers morts en pots ; robot-tondeuse perdu dans l'herbe haute",
  ],
  lot: { l: 60, p: 48 },
  depart: { x: 4, z: 21 },
  entrees: [
    { x: -3, z: 0.2, nature: "baie vitrée brisée (plusieurs carreaux manquants)" },
    { x: 10.2, z: -6, nature: "porte de service, côté est" },
    { x: -14.2, z: -6, nature: "porte du garage" },
    { x: 18, z: -14.6, nature: "porte blindée du bunker (entrouverte, intérieur : future carte)" },
  ],
  fouille: [
    { x: -9.5, z: -8.6, quoi: "frigo connecté : compresseur, tubes de cuivre, isolant" },
    { x: -2.5, z: -8.2, quoi: "cave à vin : bouteilles (alcool, désinfection), casiers" },
    { x: -11.5, z: -5, quoi: "îlot de cuisine : couteaux de chef, robot ménager « intelligent »" },
    { x: 4.5, z: -3, quoi: "salon : télé de 85 pouces, enceinte « intelligente », plaids" },
    { x: -18.5, z: -6.5, quoi: "supercar : batterie, câbles, roues ; borne de recharge (cuivre)" },
    { x: -17, z: 13, quoi: "hélicoptère : carburant au fond du réservoir, trousse de secours, tôle d'alu" },
    { x: 14, z: 11.4, quoi: "local technique de la piscine : pompe, chlore (chimie), tuyaux" },
    { x: 18, z: -16.5, quoi: "entrée du bunker : rations « gourmet » périmées, coffret « Kit de survie premium »" },
    { x: 12, z: -5.5, quoi: "dressing de l'étage effondré : vêtements de luxe tombés au rez-de-chaussée" },
  ],
  eteints: [
    { x: 2, z: -6, type: "errant" },
    { x: -8, z: -3, type: "ancien habitant (majordome, plateau d'argent)" },
    { x: 11, z: 7.5, type: "rampant (dans les herbes au bord de la piscine)" },
    { x: -19, z: -7, type: "errant (coincé derrière la supercar)" },
    { x: 17, z: -12.5, type: "putréfié (devant le bunker)" },
  ],
};

// ---------- Couleurs du lieu ----------

const BETON = 0xd9d5cb; // béton blanc des années de l'Abondance, grisé par la pluie
const BETON_SALE = 0xb9b4a8;
const ALU = 0x2b2d30; // menuiseries alu noires
const TECK = 0x9a9488; // teck grisé par les années
const DALLE = 0xc8c2b4; // dallage de pierre claire
const HERBE_HAUTE = 0x9aa65e;

// ---------- La villa ----------

export function creer({ usure = 0.7 } = {}) {
  const b = new Batiment(2027, usure);
  const c = b.c;
  const beton = matiereMonde("beton");

  sols(b, c, usure);
  rezDeChaussee(b, c, beton, usure);
  interieur(b, c, usure);
  etage(b, beton, usure);
  piscine(b, c, usure);
  garage(b, c, beton, usure);
  helicoptere(b, c, usure);
  bunker(b, c, beton, usure);
  jardin(b, c, usure);

  // La nuit : un feu de survivants dans le barbecue de la terrasse, l'écran du frigo, une lanterne au bunker.
  b.lumiere(-11.6, 1.1, 2.6, 0xff8a3d, 14, 13, "feu");
  b.lumiere(-9.5, 1.6, -8.2, 0x9fd8ff, 3, 5, "écran");
  b.lumiere(16.4, 1.2, -13.6, 0xffd27a, 5, 8, "lanterne");

  return b.construire();
}

// ---------- Sols : pelouse redevenue prairie, allée, terrasse ----------

function sols(b, c, usure) {
  // La pelouse du lot (sol aménagé, à peine surélevé) : un vert jauni, ourlé de prairie
  c.pave(-30, -0.02, -24, 30, 0.0, 24, 0x8e9a5c, matiere(1), { crasse: false, nuance: 0 });
  // L'allée de gravier, depuis le portail à l'ouest
  c.pave(-30, 0, -2, -14, 0.02, 3, 0xb7ae9c, matiere(1), { crasse: false, nuance: 0 });
  // La terrasse de dalles de pierre sous le salon et autour de la piscine
  c.pave(-14, 0, 0, 22, 0.08, 3.6, DALLE, matiere(0.9), { crasse: false, nuance: 0.02 });
  c.pave(-1, 0, 3.6, 22, 0.08, 10.8, DALLE, matiere(0.9), { crasse: false, nuance: 0.02 });
  // Joints des dalles où l'herbe a pris
  const pts = [];
  for (let i = 0; i < 70 * usure; i++) pts.push([c.entre(-13.5, 21.5), c.hasard() < 0.5 ? c.entre(0.3, 3.4) : c.entre(9.5, 10.6), 0.08]);
  touffes(c, pts, HERBE_HAUTE);
  // Feuilles mortes poussées par le vent dans les angles
  jonchee(c, -13.8, 0.1, -6, 3.4, Math.round(60 * usure), undefined, 0.09);
  jonchee(c, 17, 0.1, 21.8, 10.5, Math.round(40 * usure), undefined, 0.09);
}

// ---------- Le rez-de-chaussée : un plateau de verre entre deux murs de béton ----------

/** Une paroi de grands vitrages toute hauteur (axe x ou z), menuiseries noires ; carreaux entiers, étoilés ou manquants. */
function vitrage(b, c, a, fin, y0, h, pas, usure, graine) {
  const [x1, z1] = a;
  const [x2, z2] = fin;
  const L = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.round(L / pas);
  const ux = (x2 - x1) / L;
  const uz = (z2 - z1) / L;
  const verre = matiereVerre(0x41606a, 0.38);
  const ry = Math.atan2(-uz, ux);
  for (let i = 0; i <= n; i++) {
    const x = x1 + ux * (i * pas);
    const z = z1 + uz * (i * pas);
    c.boite(0.08, h, 0.14, ALU, { x, y: y0 + h / 2, z, ry }, matiere(0.5, 0.4), { crasse: false });
  }
  c.repere({ x: x1, y: y0, z: z1, ry }, () => {
    c.pave(0, 0, -0.08, L, 0.08, 0.08, ALU, matiere(0.5, 0.4), { crasse: false });
    c.pave(0, h - 0.1, -0.08, L, h, 0.08, ALU, matiere(0.5, 0.4), { crasse: false });
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) * pas;
      const r = c.hasard();
      const bris = 0.15 + usure * 0.6;
      if (graine.includes(i) || r < bris * 0.45) {
        // Carreau tombé : un tapis d'éclats devant, et l'on passe
        for (let k = 0; k < 7; k++) c.boite(c.entre(0.1, 0.35), 0.01, c.entre(0.1, 0.3), 0xbfd3d6, { x: u + c.entre(-0.8, 0.8), y: 0.1, z: c.entre(-0.6, 1.2), ry: c.hasard() * 3 }, verre, { crasse: false, nuance: 0 });
        // un éclat resté en haut du cadre
        const g = new THREE.BufferGeometry();
        const l = pas - 0.1;
        g.setAttribute("position", new THREE.Float32BufferAttribute([u - l / 2, h - 0.1, 0, u - l / 2 + l * c.entre(0.3, 0.7), h - 0.1, 0, u - l / 2, h - 0.1 - h * c.entre(0.15, 0.4), 0], 3));
        g.computeVertexNormals();
        c.poser(g, verre, 0xffffff, {}, { crasse: false, nuance: 0 });
      } else {
        c.boite(pas - 0.1, h - 0.18, 0.02, 0xffffff, { x: u, y: h / 2, z: 0 }, verre, { crasse: false, nuance: 0 });
        if (r < bris) {
          // Verre feuilleté étoilé : il tient, mais blanchi d'un impact
          c.boite(c.entre(0.5, 0.9), c.entre(0.5, 0.9), 0.03, 0xe8eef0, { x: u + c.entre(-0.3, 0.3), y: c.entre(0.6, 2), z: 0, rz: c.hasard() * 3 }, matiereVerre(0xdfe8ea, 0.5), { crasse: false, nuance: 0 });
        }
        b.obstacle(x1 + ux * (u - pas / 2), z1 + uz * (u - pas / 2), x1 + ux * (u + pas / 2), z1 + uz * (u + pas / 2), "vitre");
      }
    }
  });
}

function rezDeChaussee(b, c, beton, usure) {
  const H = 3.4;
  // Dalle de sol intérieure : béton ciré clair
  c.pave(-14, 0, -10, 10, 0.1, 0, 0xcfc9bd, matiere(0.55), { crasse: false, nuance: 0 });
  // Mur nord, plein, avec une bande de jour haute
  mur(c, [10, -10], [-14, -10], { h: H, ep: 0.35, couleur: BETON, mat: beton, batiment: b, ouvertures: [{ u: 16, l: 10, bas: 2.5, haut: 3.1, type: "fenetre", croisillons: 5, traverses: 1, cadre: ALU, appui: false, bris: 0.5 * usure + 0.1 }] });
  // Mur ouest (entre la maison et le garage), une porte
  mur(c, [-14, -10], [-14, 0], { h: H, ep: 0.35, couleur: BETON, mat: beton, batiment: b, ouvertures: [{ u: 4, l: 1.1, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", couleurPorte: 0x6b5a48, angle: 1.3 }] });
  // Mur est : une grande fenêtre carrée sur la terrasse, une porte de service
  mur(c, [10, 0], [10, -10], { h: H, ep: 0.35, couleur: BETON, mat: beton, batiment: b, breches: usure > 0.5 ? [{ u: 1.2, l: 2.2, profondeur: 1.1 * usure }] : [], ouvertures: [{ u: 4, l: 1.1, bas: 0, haut: 2.3, type: "porte", vantail: "tombe", couleurPorte: 0x6b5a48 }, { u: 7.5, l: 2.6, bas: 0.5, haut: 2.9, type: "fenetre", croisillons: 1, traverses: 1, cadre: ALU, appui: false, bris: 0.8 }] });
  // La façade sud : 24 m de verre (on entre par les carreaux tombés)
  vitrage(b, c, [-14, 0], [10, 0], 0.1, H - 0.1, 2, usure, [5, 6]);
  // Cloison vitrée de la cave à vin
  vitrage(b, c, [-6, -10], [-6, -5.5], 0.1, H - 0.1, 1.5, usure * 0.6, []);
  vitrage(b, c, [-6, -5.5], [-0.5, -5.5], 0.1, H - 0.1, 1.5, usure * 0.6, []);

  // La dalle du toit (couche qui s'efface) : percée au-dessus du salon, un bouleau passe au travers
  const dalle = b.couche("dalle du rez-de-chaussée", { x: -2, z: -5, l: 24.8, p: 10.8 }, H, H + 0.45);
  const trou = { x1: 3, x2: 6.5, z1: -4.2, z2: -1.2 };
  const morceaux = [
    [-14.4, trou.x1, -10.4, 0.4],
    [trou.x2, 10.4, -10.4, 0.4],
    [trou.x1, trou.x2, -10.4, trou.z1],
    [trou.x1, trou.x2, trou.z2, 0.4],
  ];
  const lisse = matiereMonde("enduit");
  for (const [x1, x2, z1, z2] of morceaux) dalle.pave(x1, H, z1, x2, H + 0.4, z2, BETON, lisse, { crasse: false, nuance: 0 });
  // Fers à béton tordus au bord du trou, et l'acrotère
  for (let i = 0; i < 9; i++) {
    const x = trou.x1 + c.entre(0, trou.x2 - trou.x1);
    const z = c.hasard() < 0.5 ? trou.z1 : trou.z2;
    dalle.poutre([x, H + 0.15, z], [x + c.entre(-0.3, 0.3), H - c.entre(0.3, 0.9), z + c.entre(-0.5, 0.5) * (z === trou.z1 ? -1 : 1)], 0.03, PALETTE.rouille, matiere(0.9, 0.3));
  }
  dalle.pave(-14.4, H + 0.4, 0.15, 10.4, H + 0.8, 0.4, BETON, beton, { crasse: false, nuance: 0 });
  dalle.pave(-14.4, H + 0.4, -10.4, -14.15, H + 0.8, 0.4, BETON, beton, { crasse: false, nuance: 0 });
  mousse(dalle, -10, H + 0.4, -6, 2.5, Math.round(10 * usure));
  mousse(dalle, 8, H + 0.4, -1, 1.5, Math.round(6 * usure));
  semerTouffes(dalle, -14, -10, -6.5, 0, Math.round(25 * usure), HERBE_HAUTE, H + 0.4);
  // Les gravats tombés du trou, et ce qui y pousse
  gravats(c, 4.6, -2.8, 1.5, Math.round(10 + 20 * usure), [BETON, BETON_SALE, PALETTE.pierre], 0.1);
  arbre(c, 4.4, -2.6, 7.5, "bouleau", 0.1);
  raiDeLumiere(c, [4.6, H + 0.4, -2.4], [3.6, 0.12, -1.6], 2.6, 0.13);
  flaque(c, 5.8, -3.4, 1.1, 0.115);
  // L'eau a coulé le long des murs : mousse et lierre
  lierre(c, -12, 0, 0.12, 0, 3.5, 3, Math.round(70 * usure));
  lierre(c, 10.2, 0, -8, Math.PI / 2, 3, 3.2, Math.round(60 * usure));
  lierre(c, -4, 0, -10.2, Math.PI, 5, 3, Math.round(80 * usure));
}

// ---------- L'intérieur visitable ----------

function interieur(b, c, usure) {
  const y = 0.1;
  const blanc = 0xe9e5dc;
  const marbre = matiere(0.3, 0.05);
  // --- La cuisine, côté ouest : linéaire contre le mur nord, îlot de marbre, frigo connecté ---
  c.pave(-13.6, y, -9.8, -6.4, y + 0.9, -9.1, 0xd8d2c4, matiere(0.6), { nuance: 0.01 });
  c.pave(-13.6, y + 0.9, -9.85, -6.4, y + 0.95, -9.0, PALETTE.marbre, marbre, { crasse: false });
  c.pave(-13.6, y + 1.6, -9.8, -10.5, y + 2.4, -9.4, 0xd8d2c4, matiere(0.6));
  // un placard ouvert qui pend
  c.boite(0.7, 0.75, 0.03, 0xd8d2c4, { x: -12.2, y: y + 1.75, z: -9.1, ry: 0.9, rz: 0.2 }, matiere(0.6));
  // Le frigo connecté, double porte, son écran
  c.pave(-10.3, y, -9.8, -8.7, y + 2.1, -9.0, 0xb9bcbd, matiere(0.35, 0.5), { nuance: 0 });
  c.pave(-9.52, y + 0.05, -9.0, -9.48, y + 2.05, -8.97, 0x55595b, matiere(0.4, 0.5), { crasse: false });
  ecran(c, -9.9, y + 1.45, -8.98, 0.45, 0.3, "MISE À JOUR", "REQUISE");
  // L'îlot central, plateau de marbre fendu, tabourets renversés
  c.pave(-12.8, y, -6.2, -8.6, y + 0.88, -5.0, 0x4a4844, matiere(0.7));
  c.pave(-13, y + 0.88, -6.35, -10.9, y + 0.94, -4.85, PALETTE.marbre, marbre, { crasse: false });
  c.boite(2.05, 0.06, 1.5, PALETTE.marbre, { x: -9.55, y: y + 0.75, z: -5.55, rz: -0.22 }, marbre, { crasse: false });
  for (let i = 0; i < 4; i++) tabouret(c, -12.5 + i * 1.2 + c.entre(-0.2, 0.2), -4.3 + c.entre(-0.3, 0.6), i % 2 === 1);
  // --- La cave à vin vitrée ---
  for (let k = 0; k < 3; k++) {
    const x = -5.6 + k * 1.6;
    c.pave(x, y, -9.8, x + 1.3, y + 2.6, -9.4, 0x3a2f26, matiere(0.85));
    for (let r = 0; r < 7; r++) for (let q = 0; q < 4; q++) {
      if (c.hasard() < 0.25 + usure * 0.3) continue; // bouteilles bues, cassées ou emportées
      c.boite(0.09, 0.09, 0.2, c.hasard() < 0.3 ? 0x5a2430 : 0x23402c, { x: x + 0.2 + q * 0.3, y: y + 0.3 + r * 0.33, z: -9.35 }, matiere(0.25, 0.1), { crasse: false, nuance: 0.05 });
    }
  }
  for (let k = 0; k < 10; k++) c.boite(0.08, 0.08, 0.28, 0x23402c, { x: c.entre(-5.5, -1), y: y + 0.05, z: c.entre(-9, -6), ry: c.hasard() * 3, rx: Math.PI / 2 }, matiere(0.25, 0.1), { crasse: false });
  flaque(c, -3.5, -7.4, 0.9, y + 0.012);
  // --- L'escalier flottant vers l'étage : les marches du haut sont tombées ---
  for (let k = 0; k < 12; k++) {
    const x = 0.4 + k * 0.32;
    const yy = y + 0.25 + k * 0.27;
    if (k > 6 && c.hasard() < 0.55 + usure * 0.4) continue;
    c.pave(x, yy - 0.12, -9.8, x + 0.32, yy, -8.6, BETON, matiereMonde("beton"), { nuance: 0.02 });
  }
  gravats(c, 3.4, -8.3, 0.9, 8, [BETON, BETON_SALE], y);
  // --- La salle à manger : grande table, chaises dispersées, lustre tombé ---
  c.pave(-4.8, y + 0.72, -3.7, 0.2, y + 0.8, -2.3, 0x2f2a26, matiere(0.4));
  for (const x of [-4.4, -0.2]) c.pave(x, y, -3.3, x + 0.2, y + 0.72, -2.7, 0x2f2a26, matiere(0.4));
  for (let i = 0; i < 8; i++) chaise(c, -4.4 + (i % 4) * 1.4 + c.entre(-0.4, 0.4), i < 4 ? -4.4 + c.entre(-0.6, 0.3) : -1.6 + c.entre(-0.3, 0.8), c.hasard() * 6, c.hasard() < 0.35 + usure * 0.3);
  lustre(c, -2.3, -3.0, y);
  // --- Le salon : canapé d'angle en cuir crème moisi, télé géante tombée, tapis ---
  c.pave(1, y, -4.6, 9.2, y + 0.01, 0, 0x7d7266, matiere(1), { crasse: false, nuance: 0 });
  canape(c, usure);
  c.boite(1.9, 1.1, 0.07, 0x111214, { x: 7.6, y: y + 0.04, z: -4.9, rx: -Math.PI / 2, ry: 0.2 }, matiere(0.3, 0.2), { crasse: false });
  c.boite(1.3, 0.5, 0.5, 0x3a3836, { x: 8.2, y: y + 0.25, z: -6.2 }, matiere(0.6));
  // L'enceinte « intelligente », un cylindre tombé
  c.tube([6.2, y + 0.1, -0.8], [6.5, y + 0.1, -0.5], 0.09, 0x2a2a2c, matiere(0.6), 8);
  // Le buste doré du propriétaire, renversé près de l'entrée
  c.pave(-2.4, y, -1.4, -1.8, y + 1.1, -0.8, 0x2e2c2b, matiere(0.3));
  c.boite(0.36, 0.5, 0.3, PALETTE.dore, { x: -1.4, y: y + 0.18, z: -0.6, rz: Math.PI / 2, ry: 0.6 }, matiere(0.35, 0.8), { crasse: false });
  c.poser(new THREE.IcosahedronGeometry(0.2, 1), matiere(0.35, 0.8), PALETTE.dore, { x: -0.95, y: y + 0.2, z: -0.4 }, { crasse: false });
  // Feuilles, plâtre, verre : le vent entre par la baie
  jonchee(c, -13, -4.5, 9.5, -0.2, Math.round(110 * usure), undefined, y + 0.01);
  debris(c, -13, -9.5, 9.5, -0.2, Math.round(60 * usure), [0xd8d2c4, BETON, 0x9fb7bc], y);
  // Le dressing de l'étage s'est vidé par la dalle crevée : vêtements tombés
  for (let i = 0; i < 6; i++) c.boite(c.entre(0.4, 0.8), 0.04, c.entre(0.3, 0.6), [0x8b6f8f, 0xd9cbb0, 0x2f3a4c, 0x7a2630][i % 4], { x: 4.8 + c.entre(-1, 1.2), y: y + 0.05 + i * 0.01, z: -3 + c.entre(-1, 1), ry: c.hasard() * 3 }, MAT.toile(), { crasse: false, nuance: 0.05 });
}

/** Un petit écran qui luit (frigo, borne) : texte de l'Abondance. */
function ecran(c, x, y, z, l, h, ligne1, ligne2, ry = 0) {
  const tex = dessiner(`ecran-${ligne1}-${ligne2}`, 128, 80, (g) => {
    g.fillStyle = "#0e1a22";
    g.fillRect(0, 0, 128, 80);
    g.fillStyle = "#9fd8ff";
    g.font = "bold 15px sans-serif";
    g.textAlign = "center";
    g.fillText(ligne1, 64, 34);
    g.fillText(ligne2, 64, 54);
    g.fillStyle = "rgba(159,216,255,0.5)";
    g.fillRect(24, 62, 80 * 0.3, 4);
  }, false);
  const m = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.3 });
  const geo = new THREE.PlaneGeometry(l, h);
  c.poser(geo, m, 0xffffff, { x, y, z, ry }, { crasse: false, nuance: 0 });
  geo.dispose();
}

function tabouret(c, x, z, couche) {
  const y = 0.1;
  c.repere({ x, y, z, rx: couche ? Math.PI / 2 : 0, ry: c.hasard() * 3 }, () => {
    c.tube([0, couche ? 0.2 : 0, 0], [0, 0.75 + (couche ? 0.2 : 0), 0], 0.025, 0x8d969a, matiere(0.4, 0.6), 5);
    c.boite(0.4, 0.06, 0.4, 0x6b4a32, { y: 0.78 + (couche ? 0.2 : 0) }, matiere(0.7));
  });
}

function chaise(c, x, z, ry, renversee) {
  const y = 0.1;
  c.repere({ x, y: renversee ? y + 0.24 : y, z, ry, rx: renversee ? -Math.PI / 2 : 0 }, () => {
    c.boite(0.46, 0.06, 0.46, 0xd9cbb0, { y: 0.46 }, matiere(0.9));
    c.boite(0.46, 0.5, 0.05, 0xd9cbb0, { y: 0.72, z: -0.2 }, matiere(0.9));
    for (const [a, d] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) c.boite(0.04, 0.44, 0.04, 0x2f2a26, { x: a, y: 0.22, z: d }, matiere(0.5));
  });
}

function lustre(c, x, z, y) {
  // Un lustre de designer : couronne de tiges de laiton et de globes, tombé et écrasé
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const r = 0.7 + c.entre(-0.1, 0.25);
    c.poutre([x, y + 0.15, z], [x + Math.cos(a) * r, y + 0.05 + c.hasard() * 0.25, z + Math.sin(a) * r], 0.025, PALETTE.laiton, matiere(0.35, 0.8));
    if (c.hasard() < 0.6) c.poser(new THREE.IcosahedronGeometry(0.09, 0), matiereVerre(0xf1ead8, 0.7), 0xffffff, { x: x + Math.cos(a) * r, y: y + 0.1, z: z + Math.sin(a) * r });
  }
  for (let k = 0; k < 8; k++) c.boite(0.08, 0.01, 0.06, 0xf1ead8, { x: x + c.entre(-1.4, 1.4), y: y + 0.01, z: z + c.entre(-1.2, 1.2), ry: c.hasard() * 3 }, matiere(0.2), { crasse: false });
}

function canape(c, usure) {
  const y = 0.1;
  const cuir = 0xd8ccb0;
  const moisi = 0x9aa07a;
  // Long canapé d'angle face à la vallée
  c.pave(1.4, y, -4.4, 7.4, y + 0.42, -3.4, cuir, matiere(0.75));
  c.pave(1.4, y + 0.42, -4.4, 7.4, y + 0.85, -4.05, cuir, matiere(0.75));
  c.pave(1.4, y, -3.4, 2.4, y + 0.42, -0.9, cuir, matiere(0.75));
  c.pave(1.4, y + 0.42, -3.4, 1.75, y + 0.85, -0.9, cuir, matiere(0.75));
  // Coussins affaissés, taches de moisissure
  for (let i = 0; i < 6; i++) c.boite(0.9, 0.18, 0.75, i % 3 === 0 ? moisi : cuir, { x: 2.1 + i * 0.95, y: y + 0.5, z: -3.85, rz: c.entre(-0.12, 0.12), ry: c.entre(-0.1, 0.1) }, matiere(0.85), { nuance: 0.06 });
  c.boite(0.8, 0.18, 0.9, cuir, { x: 3.6, y: y + 0.09, z: -2.4, ry: 0.7, rz: 0.2 }, matiere(0.85));
  // La table basse en verre, le plateau en miettes
  c.pave(3.2, y, -2.6, 5.6, y + 0.32, -1.6, 0x2b2d30, matiere(0.4, 0.4));
  debris(c, 3, -2.8, 5.8, -1.4, Math.round(20 * usure), [0xbfd3d6, 0x9fb7bc], y + 0.32);
}

// ---------- L'étage en porte-à-faux (inaccessible) ----------

function etage(b, beton, usure) {
  const y0 = 3.4;
  const h = 3.1;
  const x1 = -6;
  const x2 = 18;
  const z1 = -9;
  const z2 = -1.6;
  const e = b.couche("étage en porte-à-faux", { x: (x1 + x2) / 2, z: (z1 + z2) / 2, l: x2 - x1, p: z2 - z1 }, y0, y0 + h + 0.5);
  // Plancher et toit
  const lisse = matiereMonde("enduit");
  e.pave(x1, y0, z1, x2, y0 + 0.35, z2, BETON, lisse, { crasse: false, nuance: 0 });
  e.pave(x1 - 0.1, y0 + h, z1 - 0.1, x2 + 0.1, y0 + h + 0.35, z2 + 0.1, BETON, lisse, { crasse: false, nuance: 0 });
  // La fenêtre en bandeau, sur toute la façade sud
  mur(e, [x1, z2], [x2, z2], { h: h - 0.35, ep: 0.3, y0: y0 + 0.35, couleur: BETON, mat: beton, ouvertures: [{ u: 12, l: 21, bas: 0.8, haut: 2.25, type: "fenetre", croisillons: 13, traverses: 1, cadre: ALU, appui: false, bris: 0.25 + usure * 0.6, rideau: 0xd9cbb0 }] });
  mur(e, [x2, z2], [x2, z1], { h: h - 0.35, ep: 0.3, y0: y0 + 0.35, couleur: BETON, mat: beton, ouvertures: [{ u: 3.7, l: 5.5, bas: 0.2, haut: 2.5, type: "fenetre", croisillons: 2, traverses: 1, cadre: ALU, appui: false, bris: 0.7 }] });
  mur(e, [x2, z1], [x1, z1], { h: h - 0.35, ep: 0.3, y0: y0 + 0.35, couleur: BETON, mat: beton, ouvertures: [{ u: 8, l: 6, bas: 1.5, haut: 2.2, type: "fenetre", croisillons: 3, traverses: 1, cadre: ALU, appui: false, bris: 0.5 }] });
  mur(e, [x1, z1], [x1, z2], { h: h - 0.35, ep: 0.3, y0: y0 + 0.35, couleur: BETON, mat: beton });
  // Coulures noires sous l'acrotère : de longues traînées verticales
  for (let i = 0; i < 26; i++) {
    const x = e.entre(x1 + 0.3, x2 - 0.3);
    const lg = e.entre(0.6, 2.2);
    e.pave(x, y0 + h - lg, z2 + 0.15, x + e.entre(0.05, 0.25), y0 + h, z2 + 0.17, 0x6f6c64, matiere(1), { crasse: false, nuance: 0.1 });
  }
  // Un rideau qui s'échappe par un carreau brisé et pend le long de la façade
  e.boite(0.7, 2.4, 0.03, 0xd9cbb0, { x: 13.3, y: y0 + 1.3, z: z2 + 0.22, rz: 0.06, rx: 0.08 }, MAT.toile(), { crasse: false, nuance: 0.08 });
  // Le toit-terrasse : jardinières mortes, panneaux solaires fendus, un palmier sec, un drone de livraison écrasé
  for (let k = 0; k < 5; k++) {
    const x = x1 + 1 + k * 4.6;
    e.pave(x, y0 + h + 0.35, z2 - 1.3, x + 2.2, y0 + h + 0.95, z2 - 0.3, 0x5a5650, matiere(0.9));
    for (let j = 0; j < 4; j++) e.poutre([x + 0.3 + j * 0.5, y0 + h + 0.95, z2 - 0.8], [x + 0.3 + j * 0.5 + e.entre(-0.3, 0.3), y0 + h + 1.5, z2 - 0.8 + e.entre(-0.3, 0.3)], 0.03, 0x7d6143, matiere(0.9));
  }
  for (let k = 0; k < 6; k++) {
    const x = x1 + 3 + k * 2.1;
    e.repere({ x, y: y0 + h + 0.7, z: z1 + 2.2, rx: -0.45 }, () => {
      e.boite(1.9, 0.05, 1.1, 0x1f2c44, {}, matiere(0.3, 0.4), { crasse: false });
      if (e.hasard() < 0.5) e.boite(1.2, 0.01, 0.04, 0xd0d8e0, { y: 0.03, ry: e.hasard() * 3 }, matiere(0.3), { crasse: false });
    });
    e.pave(x - 0.8, y0 + h + 0.35, z1 + 2.5, x - 0.75, y0 + h + 0.75, z1 + 2.55, 0x8d969a, matiere(0.4, 0.6));
  }
  palmier(e, x2 - 2, y0 + h + 0.35, z1 + 1.5, 2.8, true);
  // Le drone de livraison, écrasé, son colis éventré
  e.boite(0.7, 0.18, 0.7, 0xe9dfc6, { x: 6, y: y0 + h + 0.48, z: z1 + 4.5, rz: 0.3, ry: 0.4 }, matiere(0.5), { crasse: false });
  for (const [dx, dz] of [[-0.45, -0.45], [0.45, 0.45], [0.5, -0.4]]) e.boite(0.5, 0.03, 0.05, 0x2b2d30, { x: 6 + dx, y: y0 + h + 0.4, z: z1 + 4.5 + dz, ry: e.hasard() * 3 }, matiere(0.4));
  e.boite(0.4, 0.3, 0.3, 0xb08f55, { x: 6.9, y: y0 + h + 0.5, z: z1 + 3.8, ry: 0.5 }, matiere(0.95));
  mousse(e, 0, y0 + h + 0.35, -5, 3, Math.round(14 * usure));
  semerTouffes(e, x1, z1, x2, z2 - 1.5, Math.round(30 * usure), HERBE_HAUTE, y0 + h + 0.35);
  // Les pilotis du porte-à-faux : l'un a flambé ; les survivants ont étayé avec des troncs
  const c = b.c;
  c.tube([17.4, 0, -8.4], [17.4, y0, -8.4], 0.14, 0x8d969a, matiere(0.45, 0.6), 8);
  c.tube([17.4, 0, -2.2], [17.0, 1.6, -2.3], 0.14, 0x8d969a, matiere(0.45, 0.6), 8);
  c.tube([17.0, 1.6, -2.3], [17.4, y0, -2.2], 0.14, 0x8d969a, matiere(0.45, 0.6), 8);
  c.tube([17.0, 1.55, -2.3], [17.0, 1.75, -2.3], 0.2, PALETTE.rouille, matiere(0.9, 0.3), 8);
  for (const [x, z, a] of [[15.5, -2.4, 0.12], [16.2, -1.9, -0.1], [14.2, -8.2, 0.05]]) {
    c.tube([x, 0, z], [x + a * 3, y0, z], 0.13, 0x6a5a48, matiere(0.95), 6);
    c.boite(0.5, 0.25, 0.5, 0x5a4130, { x, y: 0.12, z }, matiere(0.95));
  }
  gravats(c, 16.6, -3.2, 1.1, 10, [BETON, BETON_SALE], 0.08);
}

function palmier(c, x, y, z, h, mort) {
  c.pave(x - 0.6, y, z - 0.6, x + 0.6, y + 0.8, z + 0.6, 0x3a3836, matiere(0.6));
  const sommet = [x + 0.35, y + 0.8 + h, z + 0.15];
  for (let k = 0; k < 6; k++) {
    const t0 = k / 6;
    const t1 = (k + 1) / 6;
    c.tube([x + 0.35 * t0, y + 0.8 + h * t0, z + 0.15 * t0], [x + 0.35 * t1, y + 0.8 + h * t1, z + 0.15 * t1], 0.13 - k * 0.01, 0x8a7a62, matiere(0.95), 6);
  }
  const tons = mort ? [0x9a8458, 0x7d6143, 0xb08f55] : [PALETTE.feuillage, PALETTE.feuillageSombre];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const tombe = mort ? c.entre(0.9, 1.5) : 0.4;
    c.repere({ x: sommet[0], y: sommet[1], z: sommet[2], ry: -a }, () => {
      c.boite(1.5, 0.03, 0.32, tons[i % tons.length], { x: 0.75, y: -0.75 * Math.sin(tombe * 0.6), rz: -tombe * 0.6 }, matiere(0.9), { crasse: false, nuance: 0.08 });
    });
  }
}

// ---------- La piscine à débordement ----------

function piscine(b, c, usure) {
  const x1 = 2;
  const x2 = 20;
  const z1 = 4.2;
  const z2 = 9.4;
  const hb = 0.95; // le bassin est hors sol, sur la pente, avec son débordement côté vallée
  const beton = matiereMonde("beton");
  // Margelles et parois
  c.pave(x1 - 0.4, 0, z1 - 0.4, x2 + 0.4, hb, z1, DALLE, beton, { nuance: 0 });
  c.pave(x1 - 0.4, 0, z1, x1, hb, z2, DALLE, beton, { nuance: 0 });
  c.pave(x2, 0, z1, x2 + 0.4, hb, z2, DALLE, beton, { nuance: 0 });
  // Le bord à débordement, plus bas, et sa goulotte
  c.pave(x1 - 0.4, 0, z2, x2 + 0.4, hb - 0.12, z2 + 0.3, 0x9ab0a8, beton, { nuance: 0 });
  c.pave(x1 - 0.4, 0, z2 + 0.3, x2 + 0.4, 0.35, z2 + 1.0, 0x8a9a92, beton, { nuance: 0 });
  // Le fond carrelé bleu, devenu vert, et l'eau croupie à mi-hauteur
  c.pave(x1, 0, z1, x2, 0.2, z2, 0x5f8c86, matiere(0.6), { crasse: false, nuance: 0 });
  c.pave(x1, 0.2, z1, x2, 0.25, z2, 0x4d6a4a, matiere(0.9), { crasse: false, nuance: 0 });
  const eau = matiereEau(0x4f6b3a, 0.82);
  const niveau = 0.62 - usure * 0.15;
  c.pave(x1 + 0.02, niveau - 0.02, z1 + 0.02, x2 - 0.02, niveau, z2 - 0.02, 0xffffff, eau, { crasse: false, nuance: 0 });
  // La ligne d'eau d'autrefois, une bande sombre sur la paroi
  c.pave(x1, hb - 0.2, z1 + 0.01, x2, hb - 0.12, z1 + 0.03, 0x5a6e5c, matiere(1), { crasse: false, nuance: 0 });
  // Lentilles d'eau, feuilles flottantes, algues
  for (let i = 0; i < 90 * usure + 20; i++) {
    const s = c.entre(0.08, 0.35);
    c.boite(s, 0.01, s, [0x7a9a3a, 0x9c7a45, 0x5f7a3a][i % 3], { x: c.entre(x1 + 0.2, x2 - 0.2), y: niveau + 0.005, z: c.entre(z1 + 0.2, z2 - 0.2), ry: c.hasard() * 3 }, matiere(0.9), { crasse: false, nuance: 0.1 });
  }
  // Roseaux qui ont pris dans un angle
  touffes(c, Array.from({ length: Math.round(10 * usure) + 2 }, () => [c.entre(x2 - 2.5, x2 - 0.3), c.entre(z1 + 0.2, z1 + 1.5), niveau]), 0x7f8f4a);
  // Le flamant gonflable, dégonflé, échoué contre la paroi
  c.repere({ x: 8.5, y: niveau, z: z1 + 0.8, ry: 0.4 }, () => {
    c.boite(1.3, 0.12, 0.8, 0xe39aa6, { y: 0.03, rz: 0.08 }, matiere(0.5), { crasse: false, nuance: 0.03 });
    c.poutre([0.5, 0.05, 0], [0.75, 0.5, 0.1], 0.12, 0xe39aa6, matiere(0.5));
    c.poutre([0.75, 0.5, 0.1], [0.95, 0.42, 0.25], 0.1, 0xe39aa6, matiere(0.5));
    c.boite(0.12, 0.06, 0.1, 0x2b2d30, { x: 1.0, y: 0.38, z: 0.3 }, matiere(0.5));
  });
  // L'échelle de piscine, rouillée
  for (const dz of [0, 0.5]) c.tube([x1 + 3, hb + 0.6, z1 + 0.25 + dz], [x1 + 3, 0.2, z1 + 0.6 + dz], 0.025, 0x9aa0a2, matiere(0.4, 0.7), 6);
  // Transats renversés, parasol couché, toile déchirée
  for (let i = 0; i < 4; i++) transat(c, x1 + 2 + i * 3.6 + c.entre(-0.3, 0.3), z1 - 2.2 + c.entre(-0.4, 0.4), c.entre(-0.4, 0.4), i === 1 || (i === 3 && usure > 0.5));
  c.tube([15.5, 0.12, 2], [18.5, 0.15, 3.1], 0.035, 0xd8d0c0, matiere(0.6), 5);
  c.boite(2.6, 0.03, 2.2, 0xe9dfc6, { x: 18.9, y: 0.6, z: 3.3, rz: 1.2, ry: -0.35 }, MAT.toile(), { crasse: false, nuance: 0.05 });
  // Le local technique (pompe, chlore) sous la terrasse, porte arrachée
  c.pave(12.5, 0, 5.2 + 5.2, 15.5, 1.8, 7.2 + 5.2, BETON_SALE, beton);
  b.obstacle(x1 - 0.4, z1 - 0.4, x2 + 0.4, z1 - 0.4, "piscine");
  b.obstacle(x1 - 0.4, z1 - 0.4, x1 - 0.4, z2 + 1, "piscine");
  b.obstacle(x2 + 0.4, z1 - 0.4, x2 + 0.4, z2 + 1, "piscine");
  b.obstacle(x1 - 0.4, z2 + 1, x2 + 0.4, z2 + 1, "piscine");
  lierre(c, x2 + 0.45, 0, 6.5, Math.PI / 2, 3, 1, Math.round(30 * usure));
}

function transat(c, x, z, ry, renverse) {
  c.repere({ x, y: renverse ? 0.5 : 0.08, z, ry, rz: renverse ? Math.PI * 0.92 : 0 }, () => {
    c.boite(0.7, 0.06, 1.9, TECK, { y: 0.32 }, matiere(0.9), { nuance: 0.05 });
    c.boite(0.7, 0.06, 0.8, TECK, { y: 0.55, z: -0.85, rx: 0.9 }, matiere(0.9), { nuance: 0.05 });
    for (const [a, d] of [[-0.3, -0.8], [0.3, -0.8], [-0.3, 0.8], [0.3, 0.8]]) c.boite(0.06, 0.3, 0.06, TECK, { x: a, y: 0.15, z: d }, matiere(0.9));
    c.boite(0.62, 0.1, 1.2, 0xc7bba0, { y: 0.4, z: 0.25 }, MAT.toile(), { nuance: 0.06 });
  });
}

// ---------- Le garage ouvert et la supercar ----------

function garage(b, c, beton, usure) {
  const x1 = -23.5;
  const x2 = -14.2;
  const z1 = -10;
  const z2 = -2.5;
  c.pave(x1, 0, z1, x2, 0.06, z2, 0x9a958a, matiere(0.9), { crasse: false, nuance: 0 });
  mur(c, [x2, z1], [x1, z1], { h: 2.9, ep: 0.3, couleur: BETON, mat: beton, batiment: b });
  mur(c, [x1, z1], [x1, z2], { h: 2.9, ep: 0.3, couleur: BETON, mat: beton, batiment: b, breches: [{ u: 5.5, l: 2, profondeur: 0.9 * usure }] });
  const t = b.couche("abri de la voiture", { x: (x1 + x2) / 2, z: (z1 + z2) / 2 + 0.4, l: x2 - x1 + 0.6, p: z2 - z1 + 1 }, 2.9, 3.3);
  t.pave(x1 - 0.3, 2.9, z1 - 0.3, x2 + 0.1, 3.2, z2 + 0.8, BETON, matiereMonde("enduit"), { crasse: false, nuance: 0 });
  // Le bord du toit plat est ébréché, un fer pend
  t.poutre([-20, 2.95, z2 + 0.8], [-20.2, 2.2, z2 + 1.0], 0.03, PALETTE.rouille, matiere(0.9, 0.3));
  mousse(t, -18, 3.2, -6, 2.5, Math.round(10 * usure));
  semerTouffes(t, x1, z1, x2, z2, Math.round(16 * usure), HERBE_HAUTE, 3.2);
  supercar(c, -18.6, -6.2, -0.08, usure);
  // La borne de recharge « Premium », câble arraché
  c.pave(-15.2, 0, -9.7, -14.8, 1.5, -9.3, 0xe9dfc6, matiere(0.5));
  c.pave(-15.15, 1.0, -9.31, -14.85, 1.35, -9.29, 0x1b2a33, matiere(0.3));
  c.tube([-15.0, 0.9, -9.25], [-15.6, 0.05, -8.4], 0.03, 0x1e1e1e, matiere(0.7), 5);
  c.tube([-15.6, 0.05, -8.4], [-16.9, 0.05, -8.1], 0.03, 0x1e1e1e, matiere(0.7), 5);
  // Sur le mur, le panneau des abonnements, délavé
  affiche(c, -22.4, 1.6, -9.82, 1.2, 0.8, ["RECHARGE", "PREMIUM", "abonnement requis"], 0);
  lierre(c, -23.7, 0, -6, -Math.PI / 2, 4, 2.9, Math.round(70 * usure));
  gravats(c, -23.2, -4.5, 1, 10, [BETON, BETON_SALE], 0.06);
}

/** La supercar : coin bas et large, jaune passé, pneus à plat, ronces qui sortent du capot ouvert. */
function supercar(c, x, z, ry, usure) {
  const jaune = 0xc9a640;
  const forme = new THREE.Shape();
  // Profil latéral (x : longueur, y : hauteur)
  forme.moveTo(-2.25, 0.32);
  forme.lineTo(2.2, 0.32);
  forme.lineTo(2.3, 0.62);
  forme.lineTo(1.0, 0.85);
  forme.lineTo(0.2, 1.18);
  forme.lineTo(-0.9, 1.15);
  forme.lineTo(-2.2, 0.92);
  forme.lineTo(-2.3, 0.55);
  const carrosserie = new THREE.ExtrudeGeometry(forme, { depth: 1.9, bevelEnabled: false }).translate(0, 0, -0.95);
  // La voiture s'est affaissée : pneus crevés, elle penche à l'avant gauche
  c.repere({ x, y: -0.06, z, ry: ry + Math.PI / 2, rz: -0.03, rx: 0.025 }, () => {
    c.poser(carrosserie, matiere(0.55, 0.35), jaune, {}, { nuance: 0.02 });
    // Vitres fumées (une étoilée), toit
    c.boite(1.0, 0.36, 1.6, 0x1c2328, { x: -0.35, y: 1.0, rz: -0.12 }, matiere(0.15, 0.5), { crasse: false });
    c.boite(0.62, 0.02, 1.5, 0x1c2328, { x: 0.62, y: 1.0, rz: 0.4 }, matiere(0.15, 0.5), { crasse: false });
    // Taches de rouille et de fiente, mousse sur le capot
    for (let i = 0; i < 8; i++) c.boite(c.entre(0.1, 0.4), 0.01, c.entre(0.1, 0.3), i % 2 ? PALETTE.rouille : 0xd9d2c0, { x: c.entre(-2, 2), y: c.entre(0.86, 1.19), z: c.entre(-0.8, 0.8) }, matiere(1), { crasse: false });
    // Les roues : jantes, pneus aplatis
    for (const [rx, rz] of [[-1.45, -0.95], [-1.45, 0.95], [1.4, -0.95], [1.4, 0.95]]) {
      c.boite(0.78, 0.22, 0.32, 0x1e1e1e, { x: rx, y: 0.12, z: rz }, matiere(0.9));
      c.poser(new THREE.CylinderGeometry(0.33, 0.33, 0.3, 10).rotateX(Math.PI / 2), matiere(0.9), 0x1e1e1e, { x: rx, y: 0.3, z: rz }, { crasse: false });
      c.poser(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 6).rotateX(Math.PI / 2), matiere(0.4, 0.7), 0x8d969a, { x: rx, y: 0.3, z: rz }, { crasse: false });
    }
    // Phares, capot avant entrouvert
    c.boite(0.05, 0.08, 0.5, 0xcfd6d8, { x: 2.28, y: 0.6, z: -0.6 }, matiere(0.2));
    c.boite(0.05, 0.08, 0.5, 0xcfd6d8, { x: 2.28, y: 0.6, z: 0.6 }, matiere(0.2));
    c.boite(1.1, 0.04, 1.7, jaune, { x: 1.5, y: 0.98, rz: 0.5 }, matiere(0.55, 0.35));
  });
  // Les ronces qui sortent du coffre avant
  arbuste(c, x - 0.1, z - 1.6, 0.8 + usure * 0.5, 0.4, [0x4f6a3a, 0x5d7a40, 0x3f5a32]);
}

/** Une affiche ou un panneau de l'Abondance (texte), délavé. */
function affiche(c, x, y, z, l, h, lignes, ry, fond = "#e9dfc6", encre = "#c8362b") {
  const tex = dessiner(`affiche-${lignes.join("|")}`, 160, 110, (g) => {
    g.fillStyle = fond;
    g.fillRect(0, 0, 160, 110);
    g.fillStyle = encre;
    g.fillRect(0, 0, 160, 8);
    g.textAlign = "center";
    g.font = "bold 22px sans-serif";
    g.fillText(lignes[0] ?? "", 80, 40);
    g.font = "bold 18px sans-serif";
    g.fillStyle = "#3b2a1e";
    g.fillText(lignes[1] ?? "", 80, 66);
    g.font = "italic 12px sans-serif";
    g.fillText(lignes[2] ?? "", 80, 92);
    // Délavé, taché
    g.fillStyle = "rgba(233,223,198,0.35)";
    g.fillRect(0, 0, 160, 110);
    g.fillStyle = "rgba(110,90,60,0.25)";
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.arc((i * 53) % 160, (i * 37) % 110, 8 + (i % 3) * 6, 0, 7);
      g.fill();
    }
  }, false);
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const geo = new THREE.PlaneGeometry(l, h);
  c.poser(geo, m, 0xffffff, { x, y, z, ry }, { crasse: false, nuance: 0 });
  geo.dispose();
}

// ---------- L'hélicoptère sur son aire ----------

function helicoptere(b, c, usure) {
  const cx = -17;
  const cz = 13;
  // L'aire : un disque de béton fissuré, le H délavé, l'herbe qui reprend dans les joints
  c.poser(new THREE.CylinderGeometry(5.2, 5.2, 0.1, 20), matiere(0.95), 0xa9a59c, { x: cx, y: 0.03, z: cz }, { crasse: false, nuance: 0 });
  c.poser(new THREE.TorusGeometry(4.6, 0.12, 3, 20).rotateX(Math.PI / 2), matiere(0.9), 0xd8cfa0, { x: cx, y: 0.09, z: cz }, { crasse: false, nuance: 0 });
  for (const [l, p, dx, dz] of [[0.5, 3.4, -1.1, 0], [0.5, 3.4, 1.1, 0], [1.7, 0.45, 0, 0]]) c.boite(l, 0.02, p, 0xd8cfa0, { x: cx + dx + 2.4, y: 0.09, z: cz + dz + 1.8 }, matiere(0.9), { crasse: false });
  touffes(c, Array.from({ length: Math.round(22 * usure) }, () => {
    const a = c.hasard() * Math.PI * 2;
    const r = c.entre(1, 5);
    return [cx + Math.cos(a) * r, cz + Math.sin(a) * r, 0.08];
  }), HERBE_HAUTE);
  // L'appareil : il a basculé quand un patin a cédé
  const blanc = 0xe6e2d8;
  const bande = 0x2f6f73;
  c.repere({ x: cx - 0.3, y: 0, z: cz - 0.6, ry: 0.5, rz: 0.12 }, () => {
    // La cabine : un œuf à facettes
    c.poser(new THREE.IcosahedronGeometry(1, 1), matiere(0.45, 0.2), blanc, { x: 0, y: 1.35, z: 0, e: [2.1, 1.05, 1.0] }, { nuance: 0.02 });
    c.poser(new THREE.IcosahedronGeometry(1, 1), matiere(0.15, 0.5), 0x1c2328, { x: 1.05, y: 1.5, z: 0, e: [1.1, 0.75, 0.82] }, { crasse: false });
    c.boite(3.2, 0.12, 2.06, bande, { x: -0.1, y: 1.12 }, matiere(0.5, 0.2), { crasse: false });
    // La poutre de queue, la dérive, le rotor de queue
    c.tube([-1.8, 1.55, 0], [-6.2, 1.95, 0], 0.2, blanc, matiere(0.45, 0.2), 7);
    c.boite(0.9, 1.3, 0.08, blanc, { x: -6.1, y: 2.4, rz: -0.3 }, matiere(0.45, 0.2));
    c.boite(0.08, 1.2, 0.1, 0x2b2d30, { x: -6.15, y: 2.35, z: 0.15, rz: 0.9 }, matiere(0.5, 0.4));
    // Les patins, l'un tordu
    c.tube([-1.4, 0.08, -0.85], [1.6, 0.08, -0.85], 0.05, 0x8d969a, matiere(0.45, 0.6), 5);
    c.tube([-1.4, 0.4, 0.85], [1.6, 0.0, 0.95], 0.05, 0x8d969a, matiere(0.45, 0.6), 5);
    for (const x of [-0.8, 0.9]) {
      c.tube([x, 0.08, -0.85], [x, 0.75, -0.6], 0.04, 0x8d969a, matiere(0.45, 0.6), 5);
      c.tube([x, 0.25, 0.9], [x, 0.75, 0.6], 0.04, 0x8d969a, matiere(0.45, 0.6), 5);
    }
    // Le mât et les pales qui pendent jusqu'au sol
    c.tube([0, 2.35, 0], [0, 2.8, 0], 0.12, 0x2b2d30, matiere(0.5, 0.4), 6);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      const chute = [0.08, 0.32, 0.2, 0.42][k];
      c.repere({ x: 0, y: 2.8, z: 0, ry: a }, () => {
        c.boite(5.4, 0.04, 0.32, 0x3a3c40, { x: 2.7, y: -2.7 * Math.sin(chute), rz: -chute }, matiere(0.5, 0.4), { crasse: false });
      });
    }
    // La porte coulissante restée ouverte, une couverture qui pend
    c.boite(1.0, 0.9, 0.05, blanc, { x: -0.2, y: 1.4, z: 1.18, ry: 0.15 }, matiere(0.45, 0.2));
    c.boite(0.6, 0.7, 0.03, 0x7a2630, { x: 0.3, y: 0.9, z: 1.02, rz: 0.1 }, MAT.toile(), { crasse: false });
  });
  lierre(c, cx - 2.5, 0, cz + 0.4, 0.5, 1.6, 1.4, Math.round(25 * usure));
  b.obstacle(cx - 2.2, cz - 1.8, cx + 1.8, cz + 0.6, "hélicoptère");
  b.obstacle(cx - 2.2, cz - 1.8, cx - 6.4, cz + 1.2, "hélicoptère");
}

// ---------- Le « Refuge Premium » : l'entrée du bunker ----------

function bunker(b, c, beton, usure) {
  const x = 18;
  const z = -16;
  // Le tertre engazonné qui cache l'abri
  c.poser(new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), matiere(1), 0x7d8f50, { x, y: 0, z: z - 3.2, e: [6.5, 2.6, 5] }, { nuance: 0.05, crasse: false });
  // La façade de béton, le sas, la porte de coffre-fort entrouverte
  c.pave(x - 3.2, 0, z - 1.2, x + 3.2, 3.0, z, BETON_SALE, beton);
  c.pave(x - 3.6, 3.0, z - 1.6, x + 3.6, 3.35, z + 0.4, BETON_SALE, beton);
  c.pave(x - 1.3, 0.06, z - 1.21, x + 1.3, 2.5, z - 1.2, 0x15171a, matiere(1), { crasse: false });
  c.repere({ x: x + 1.25, y: 1.3, z: z + 0.05, ry: -1.15 }, () => {
    c.poser(new THREE.CylinderGeometry(1.15, 1.15, 0.45, 18).rotateX(Math.PI / 2), matiere(0.35, 0.75), 0xa9b0b2, { x: -1.2, z: 0.25 }, { nuance: 0 });
    c.poser(new THREE.TorusGeometry(0.35, 0.05, 4, 10), matiere(0.35, 0.8), PALETTE.laiton, { x: -1.2, z: 0.5 }, { crasse: false });
    for (let k = 0; k < 3; k++) c.boite(0.08, 0.5, 0.08, PALETTE.laiton, { x: -1.2, z: 0.52, rz: (k * Math.PI) / 3 }, matiere(0.35, 0.8), { crasse: false });
  });
  // La borne d'abonnement, éteinte, et le panneau
  c.pave(x - 2.6, 0, z + 0.3, x - 2.2, 1.3, z + 0.7, 0x2b2d30, matiere(0.5, 0.4));
  affiche(c, x - 1.6, 2.65, z + 0.02, 2.4, 0.55, ["REFUGE PREMIUM", "autonomie garantie 10 ans*", "*sous réserve d'abonnement actif"], 0, "#d9d2c0", "#2f6f73");
  // Les survivants ont fouillé : caisses éventrées, rations, une lanterne
  for (let i = 0; i < 4; i++) c.boite(0.6, 0.4, 0.45, i % 2 ? 0xe9dfc6 : 0x5a5650, { x: x + 1.8 + c.entre(-0.6, 0.8), y: 0.2 + (i === 3 ? 0.4 : 0), z: z + 1.2 + c.entre(-0.3, 0.6), ry: c.hasard() * 3 }, matiere(0.8));
  c.tube([x - 1.6, 0, z + 2.3], [x - 1.6, 0.3, z + 2.3], 0.1, 0x2b2d30, matiere(0.5, 0.4), 6);
  lierre(c, x - 3.2, 0, z + 0.05, 0, 2, 3, Math.round(40 * usure));
  lierre(c, x + 3.0, 0, z + 0.05, 0, 1.4, 2.6, Math.round(30 * usure));
  b.obstacle(x - 3.2, z, x - 1.3, z, "mur");
  b.obstacle(x + 1.3, z, x + 3.2, z, "mur");
}

// ---------- Le jardin : prairie, bosquets de la colline, palmiers morts, robot-tondeuse ----------

function jardin(b, c, usure) {
  // La colline boisée tout autour, plus dense au nord et à l'ouest
  const arbres = [
    [-27, -21, 9], [-21, -22, 8], [-12, -21.5, 10], [-4, -22, 8.5], [5, -21, 9.5], [27, -20, 8], [-27, -12, 9], [-27.5, -2, 7.5],
    [-26.5, 21, 8], [26, 20, 7], [27, 8, 8.5], [27.5, -6, 9], [-6, 21.5, 6.5], [10, 21.8, 7],
  ];
  for (const [x, z, h] of arbres) arbre(c, x, z, h, c.hasard() < 0.25 ? "bouleau" : "feuillu");
  arbre(c, 22, -21, 7, "mort");
  for (let i = 0; i < 16; i++) arbuste(c, c.entre(-28, 28), c.hasard() < 0.5 ? c.entre(-23, -18) : c.entre(18, 23), c.entre(0.8, 1.6));
  for (let i = 0; i < 8; i++) arbuste(c, c.hasard() < 0.5 ? c.entre(-28, -25) : c.entre(25, 28), c.entre(-15, 15), c.entre(0.8, 1.5));
  // L'herbe haute : la pelouse redevenue prairie
  semerTouffes(c, -28, -23, 28, 23, Math.round(260 * usure + 60), HERBE_HAUTE, 0);
  semerTouffes(c, -12, 11, 2, 22, Math.round(80 * usure), 0xa8a86a, 0);
  // Palmiers en pots, morts de froid, le long de la terrasse
  palmier(c, -12.8, 0.08, 2.4, 3.2, true);
  palmier(c, 21, 0.08, 1.6, 3.6, true);
  // Le barbecue de la terrasse, où des survivants ont fait un feu
  c.pave(-12.4, 0.08, 1.9, -10.8, 0.95, 3.1, 0x5a5650, matiereMonde("beton"));
  c.pave(-12.2, 0.95, 2.1, -11.0, 1.0, 2.9, 0x2c2926, matiere(1), { crasse: false });
  for (let k = 0; k < 4; k++) c.boite(0.6, 0.08, 0.08, 0x3a2a1e, { x: -11.6, y: 1.05, z: 2.5, ry: k * 0.8 }, matiere(1), { crasse: false });
  // Le robot-tondeuse, perdu dans l'herbe haute, son petit drapeau
  c.repere({ x: -3, y: 0, z: 15, ry: 0.7 }, () => {
    c.poser(new THREE.CylinderGeometry(0.35, 0.4, 0.22, 8), matiere(0.5), 0x5f6a3a, { y: 0.14 }, { nuance: 0.02 });
    c.boite(0.25, 0.04, 0.15, 0x1b2a33, { y: 0.27, z: 0.1 }, matiere(0.3), { crasse: false });
  });
  touffes(c, [[-3.4, 15.2], [-2.6, 14.7], [-3, 15.5]], HERBE_HAUTE);
  // La clôture du domaine, au sud : verre de garde-corps brisé, poteaux d'inox
  const verre = matiereVerre(0x6f8f96, 0.3);
  for (let x = -27; x < 27; x += 2) {
    c.boite(0.08, 1.1, 0.08, 0x9aa0a2, { x, y: 0.55, z: 23.2 }, matiere(0.4, 0.6), { crasse: false });
    if (c.hasard() < 0.75 - usure * 0.4) c.boite(1.9, 0.95, 0.02, 0xffffff, { x: x + 1, y: 0.55, z: 23.2 }, verre, { crasse: false, nuance: 0 });
  }
  b.obstacle(-27, 23.2, 27, 23.2, "garde-corps");
  // Les vieux massifs du jardin, des rochers décoratifs
  for (const [x, z, s] of [[-6, 6, 1.1], [-8, 7.5, 0.7], [23.5, -3, 0.9]]) c.poser(new THREE.DodecahedronGeometry(s, 0), matiere(0.95), PALETTE.pierre, { x, y: s * 0.4, z, ry: c.hasard() * 3 }, { nuance: 0.05 });
  arbuste(c, -7, 7, 1.4);
}
