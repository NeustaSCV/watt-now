// Halte · L'aire du Bois-Joli (route de la Zone industrielle ou de la Campagne, danger ●●●).
//
// Une petite aire de repos sans services, au fond d'un bois de pins, sur une départementale. Sous l'Abondance, c'était
// l'aire glauque où l'on venait assouvir ses fantasmes : rendez-vous sadomaso, échangistes, voyeurs. Ton validé par le
// porteur du projet : adulte, suggestif, absurde et cru — mais le cru passe par les OBJETS, les ÉCRITS et les LIEUX :
// aucun acte représenté, aucune nudité détaillée, strictement entre adultes, aucun groupe réel visé, ni sang ni plaie.
//
// Le plan (repère de la halte entière : origine au centre, +x à l'est, +z au sud, 200 × 70 m) :
// - la départementale traverse d'ouest (entrée A) en est (sortie B), à z = 14, bordée de fossés et d'une forêt dense de
//   pins et de ronces : la route est le seul passage ;
// - goulet 1 : le pont de bois à une voie sur le ruisseau (x ≈ −29) ;
// - goulet 2 : un pin couché barre la route (x ≈ 16 à 34) : on passe par l'aire, sous la barrière à moitié levée entre
//   deux gros blocs de pierre, et l'on ressort à l'est du parking ;
// - à l'écart : le sex-shop routier « Love Center 24/24 », la cabane de chasse devenue « cabane d'observation », les
//   toilettes en préfabriqué, le fourgon-donjon, la caravane « Le Nid Coquin », la clairière des rendez-vous.
//
// Quatre tronçons de 50 × 70 m (« lisiere », « pont », « aire », « clairiere ») : tout est bâti dans le repère de la
// halte, chaque tronçon ne garde que ce dont le centre tombe dans sa bande de x, puis il est recentré (voir `recentrer`).
// Le sol est fourni par la halte (`solPropre`) : fossés et lit du ruisseau sont creusés.

import * as THREE from "three";
import { Batiment, PALETTE, MAT, matiere, matiereTexture, matiereVerre, matiereEau, dessiner, aleatoire, taches, mur, touffes, gravats, debris, jonchee, mousse, flaque } from "../commun/atelier.js";

// ---------- Le plan de la halte ----------

const ROUTE = { z: 14, demi: 3.2 }; // chaussée de z 10,8 à 17,2
const FOSSES = [9, 19]; // axes des fossés nord et sud
const xRuisseau = (z) => -30 + 1.8 * Math.sin(z * 0.11) + 0.8 * Math.sin(z * 0.31 + 1);
const XB = xRuisseau(ROUTE.z);
const PONT = { x0: XB - 4.6, x1: XB + 4.6, z0: 11.8, z1: 16.2 };
const CLAIRIERE = { x: 75, z: -19, rx: 11, rz: 8 };

// Bâtiments et objets majeurs (repère de la halte)
const LOVE = { x0: -80, x1: -64, z0: -6, z1: 2, h: 3.4, front: 4.4 };
const CABANE = { x0: -21, x1: -15.5, z0: -8.5, z1: -4 };
const TOIL = { x0: 29, x1: 35, z0: -17, z1: -13.6, h: 2.6 };
const FOURGON = { x0: 38, x1: 44.2, z0: -6.1, z1: -3.9, sol: 0.15, h: 2.45, cab: 42.4 };
const CARAVANE = { x0: 12, x1: 19.5, z0: -16.6, z1: -14.2, sol: 0.12, h: 2.35 };
const PIN_COUCHE = { racine: [15.2, 0.9, 21.8], voiture: [21.5, 1.3, 16.4], cime: [33.5, 0.5, 6.4] };

const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const ovale = (cx, cz, rx, rz, n = 18) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cz + Math.sin((i / n) * Math.PI * 2) * rz]);

/** Les busages : là où un passage franchit le fossé (le fossé est comblé). */
const BUSAGES_N = [[-76, -62], [-12, -6], [2.5, 10.5], [41, 49], [77, 92]];
const BUSAGES_S = [[-92, -87], [-44, -38], [-22, -17], [60, 66]];

const PARKING = [[1.5, 7.6], [1.5, -2], [5, -10], [11, -19], [24, -20.5], [36, -19.5], [45, -13], [50, -4], [50.5, 7.6]];

/** Les zones où l'on marche (tout le reste est forêt dense, fossé ou ruisseau). */
const MARCHABLE = [
  rect(-100, 10.1, PONT.x0, 17.9),
  rect(PONT.x1, 10.1, 100, 17.9),
  rect(PONT.x0 - 0.2, PONT.z0, PONT.x1 + 0.2, PONT.z1),
  ...BUSAGES_N.map(([a, b]) => rect(a, 7.4, b, 10.4)),
  ...BUSAGES_S.map(([a, b]) => rect(a, 17.6, b, 20.6)),
  // Le Love Center, sa cour gravillonnée et le sentier derrière (le coin des routiers)
  rect(-84, -9, -56, 7.6),
  [[-78.5, -9], [-75.5, -9], [-72, -17], [-70.5, -23], [-77, -26], [-79.5, -19]],
  // La clairière de la cabane d'observation et son sentier depuis la route
  [[-12, 7.6], [-6, 7.6], [-6, -2], [-9, -11], [-20, -12], [-25.5, -6], [-25, 1], [-14, 1]],
  // Les poches au sud de la route (embuscades)
  rect(-93, 20.6, -86, 26),
  rect(-46, 20.6, -37, 27),
  rect(-24, 20.6, -15, 26),
  rect(59, 20.6, 68, 27),
  // L'aire, le sentier de l'ouest (cul-de-sac) et celui de la clairière
  PARKING,
  [[5, -11], [7.5, -13.5], [0, -18.5], [-3, -23], [-7.5, -22], [-6.5, -17], [-1, -15.5]],
  [[43, -10], [46, -16], [65, -21.5], [65, -15]],
  ovale(CLAIRIERE.x, CLAIRIERE.z, CLAIRIERE.rx, CLAIRIERE.rz),
  [[78.5, -12.5], [83, -14], [86, 5], [82, 5]],
  rect(77, 4.5, 92, 7.6),
];

/** Les îlots de pins et de ronces au milieu du parking : des recoins, des couverts. */
const ILOTS = [ovale(28, -5.5, 4.5, 3, 10), ovale(35.5, 2.2, 3, 2.2, 9), ovale(24, -10.8, 2.6, 1.8, 8)];
/** Les pins isolés plantés dans le parking (on tourne autour). */
const PINS_PARKING = [[16.5, 1.5], [45.5, -8.5], [3.5, 1.0], [11.5, -12.5]];

function dansPoly(x, z, p) {
  let dedans = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i];
    const [xj, zj] = p[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dedans = !dedans;
  }
  return dedans;
}
function marchable(x, z) {
  for (const p of ILOTS) if (dansPoly(x, z, p)) return false;
  for (const p of MARCHABLE) if (dansPoly(x, z, p)) return true;
  return false;
}
const surBusage = (liste, x) => liste.some(([a, b]) => x > a && x < b);

/** La hauteur du sol (seuls les fossés et le lit du ruisseau descendent sous y = 0). */
function hauteurSol(x, z) {
  let y = 0;
  for (const [i, zc] of FOSSES.entries()) {
    const d = Math.abs(z - zc);
    if (d < 1.2 && !surBusage(i === 0 ? BUSAGES_N : BUSAGES_S, x)) y = Math.min(y, -0.6 * (1 - (d / 1.2) ** 2));
  }
  const d = Math.abs(x - xRuisseau(z));
  if (d < 3.4) {
    const t = d < 1.3 ? 1 : 1 - (d - 1.3) / 2.1;
    y = Math.min(y, -1.4 * t * t * (3 - 2 * t));
  }
  return y;
}

function bruit(x, z) {
  const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  const n = 0.5 + 0.28 * Math.sin(x * 0.31 + z * 0.17) + 0.18 * Math.sin(x * 0.13 - z * 0.41 + 2) + 0.12 * (h - Math.floor(h) - 0.5);
  return Math.min(1, Math.max(0, n));
}

// ---------- Les arbres (liste globale, déterministe : les raccords entre tronçons sont exacts) ----------

/**
 * Un pin dont la cime peut cacher un endroit où l'on marche, vu de la caméra (sud-est), va dans une couche qui
 * s'efface : un point à la hauteur y masque le sol en (x − y, z − y).
 */
function cacheUnPassage(x, z, h, rc) {
  for (let t = Math.max(0, h * 0.42 - 1.8); t <= h; t += 1) {
    const px = x - t;
    const pz = z - t;
    for (const [dx, dz] of [[0, 0], [rc, 0], [-rc, 0], [0, rc], [0, -rc]]) if (marchable(px + dx, pz + dz)) return true;
  }
  return false;
}

const ARBRES = (() => {
  const a = aleatoire(4206);
  const liste = [];
  const libre = (x, z) => {
    if (Math.abs(x) > 99.5 || Math.abs(z) > 34.5) return false;
    if (Math.abs(z - FOSSES[0]) < 1.6 || Math.abs(z - FOSSES[1]) < 1.6) return false;
    if (Math.abs(x - xRuisseau(z)) < 3.8) return false;
    for (const [dx, dz] of [[0, 0], [1.4, 0], [-1.4, 0], [0, 1.4], [0, -1.4]]) if (marchable(x + dx, z + dz)) return false;
    return true;
  };
  for (let gx = -98.5; gx < 100; gx += 3.05) {
    for (let gz = -33.5; gz < 35; gz += 3.05) {
      const x = gx + (a() - 0.5) * 2.4;
      const z = gz + (a() - 0.5) * 2.4;
      if (!libre(x, z)) continue;
      const lisiere = z > 20 && z < 24.5;
      const h = lisiere ? 5 + a() * 3 : 8.5 + a() * 6;
      liste.push({ x, z, h, mort: a() < 0.07, s: 0.85 + a() * 0.35, ton: Math.floor(a() * 3), ry: a() * 6 });
    }
  }
  // Les pins de la guirlande, autour de la clairière (un arc au nord, derrière le canapé)
  for (const ang of [160, 200, 240, 280, 320, 0]) {
    const r = (ang * Math.PI) / 180;
    liste.push({ x: CLAIRIERE.x + Math.cos(r) * CLAIRIERE.rx * 1.1, z: CLAIRIERE.z + Math.sin(r) * CLAIRIERE.rz * 1.12, h: 12, mort: false, s: 1, ton: 1, ry: ang, guirlande: true });
  }
  // Le pin mort où pend la poupée, le pin à l'écriteau
  liste.push({ x: 86.2, z: -22.5, h: 9, mort: true, s: 1, ton: 0, ry: 1, poupee: true });
  // Les îlots du parking et les pins isolés
  for (const [cx, cz, n] of [[28, -5.5, 3], [35.5, 2.2, 2], [24, -10.8, 1]]) {
    for (let i = 0; i < n; i++) liste.push({ x: cx + (i - (n - 1) / 2) * 2.4, z: cz + (i % 2 ? 0.8 : -0.5), h: 9 + i * 1.5, mort: false, s: 0.9, ton: i % 3, ry: i * 2 });
  }
  for (const [x, z] of PINS_PARKING) liste.push({ x, z, h: 13, mort: false, s: 0.85, ton: 1, ry: x });
  liste.push({ x: 61.6, z: -12.4, h: 11, mort: false, s: 1, ton: 2, ry: 2 });
  for (const t of liste) t.cache = !t.mort && cacheUnPassage(t.x, t.z, t.h, 1.6 * t.s);
  return liste;
})();

/** Des points de remplissage du sous-bois (fougères, souches, branches). */
const SOUS_BOIS = (() => {
  const a = aleatoire(77);
  const liste = [];
  for (let i = 0; i < 1100; i++) {
    const x = -99.5 + a() * 199;
    const z = -34.5 + a() * 69;
    if (marchable(x, z) || Math.abs(x - xRuisseau(z)) < 3.6 || hauteurSol(x, z) < -0.05) continue;
    liste.push({ x, z, k: a(), s: a() });
  }
  return liste;
})();

/** Les bords des zones marchables : segments infranchissables (forêt, fossé, ruisseau) et lisières à ronces. */
const BORDS = (() => {
  const runs = [];
  for (const poly of [...MARCHABLE, ...ILOTS]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const dx = q[0] - p[0];
      const dz = q[1] - p[1];
      const lg = Math.hypot(dx, dz);
      const nx = dz / lg;
      const nz = -dx / lg;
      const n = Math.max(1, Math.ceil(lg / 0.8));
      let courant = null;
      for (let k = 0; k < n; k++) {
        const t1 = k / n;
        const t2 = (k + 1) / n;
        const cx = p[0] + dx * (t1 + t2) / 2;
        const cz = p[1] + dz * (t1 + t2) / 2;
        // Un bord n'existe que là où l'on passe d'une zone marchable à une zone qui ne l'est pas.
        const a = marchable(cx + nx * 0.5, cz + nz * 0.5);
        const b = marchable(cx - nx * 0.5, cz - nz * 0.5);
        const bloque = Math.abs(cx) < 99.6 && a !== b;
        const sens = a ? -1 : 1;
        const nature = Math.abs(cx - xRuisseau(cz)) < 4.6 ? "ruisseau" : Math.abs(cz - FOSSES[0]) < 1.9 || Math.abs(cz - FOSSES[1]) < 1.9 ? "fossé" : "forêt dense";
        const bande = Math.floor((cx + 100) / 50);
        if (bloque && courant && courant.nature === nature && courant.bande === bande && courant.sens === sens) {
          courant.x2 = p[0] + dx * t2;
          courant.z2 = p[1] + dz * t2;
        } else {
          if (courant) runs.push(courant);
          courant = bloque ? { x1: p[0] + dx * t1, z1: p[1] + dz * t1, x2: p[0] + dx * t2, z2: p[1] + dz * t2, nature, bande, sens, nx: nx * sens, nz: nz * sens } : null;
        }
      }
      if (courant) runs.push(courant);
    }
  }
  return runs;
})();

// ---------- La fiche ----------

function arr(v) {
  return Math.round(v * 10) / 10;
}

const FOUILLE = [
  // Le Love Center
  { x: -76.5, z: -1.1, quoi: "rayon « accessoires » : menottes (entraves), cordes de bondage (corde solide)" },
  { x: -73.2, z: -4.6, quoi: "rayon « bien-être » : lubrifiant (graisse pour les mécanismes), piles encore emballées" },
  { x: -70.6, z: -1, quoi: "comptoir-caisse : piles bouton, carte de fidélité « Client Platine », bonbons" },
  { x: -79.2, z: -1.2, quoi: "portant de lingerie : dentelle, satin, cuir verni (tissu, lanières)" },
  { x: -77.6, z: -4.6, quoi: "réserve : cartons de gants en latex (gants), préservatifs (poches étanches, garrots)" },
  { x: -65.5, z: -4.7, quoi: "cabine vidéo : écran et monnayeur (électronique), boîte de mouchoirs" },
  { x: -75, z: -21.5, quoi: "le coin des routiers : matelas en mousse, glacière, canettes (aluminium)" },
  { x: -89.5, z: 23.5, quoi: "épave brûlée dans la poche sud : jantes, ressorts (ferraille)" },
  // Le pont et la cabane d'observation
  { x: -16.4, z: -7.8, quoi: "étagère de la cabane : jumelles (longue-vue), thermos, carnet d'observation (papier)" },
  { x: -16.6, z: -5.8, quoi: "lit de camp : couverture de camouflage, réchaud et cartouche de gaz" },
  { x: -42.5, z: 25.4, quoi: "stère de bois coupé (bois sec, prêt à brûler)" },
  { x: -20, z: 23.4, quoi: "coin barbecue : grille, charbon de bois, bâche" },
  { x: -42.5, z: 8.9, quoi: "épave dans le fossé : batterie à plat, câbles, roue de secours" },
  { x: XB + 3.2, z: 10.9, quoi: "sacs de sable et palettes du vieux barrage (planches)" },
  // L'aire
  { x: 41.2, z: -5.6, quoi: "fourgon-donjon : chaînes et cadenas (ferraille), menottes à fourrure rose (entraves)" },
  { x: 39.2, z: -5.4, quoi: "fourgon-donjon : matelas en simili cuir (cuir synthétique), fouets (lanières de cuir)" },
  { x: 38.6, z: -4.4, quoi: "fourgon-donjon : bougies (cire, éclairage), lampe-tempête et pétrole" },
  { x: 18.2, z: -15.4, quoi: "caravane du Nid Coquin : draps de satin (tissu), coussins (mousse), bonbonne de gaz" },
  { x: 13.4, z: -15.3, quoi: "kitchenette de la caravane : bouteilles de mousseux vides, trousse « soirée » (lubrifiant, gants)" },
  { x: 30.5, z: -16.3, quoi: "toilettes : rouleaux de papier, savon, flotteur et tuyau de cuivre de la chasse" },
  { x: 24.5, z: 4.2, quoi: "borne « Rencontres premium » : écran tactile, carte électronique" },
  { x: 22.2, z: -1.2, quoi: "poubelle débordante : canettes (aluminium), sacs" },
  { x: -4, z: -20, quoi: "cul-de-sac de l'ouest : matelas, magazines (papier, allume-feu)" },
  // La clairière
  { x: 61.8, z: -21.8, quoi: "batterie solaire de la guirlande (électricité !) et câble" },
  { x: 73.5, z: -22.5, quoi: "canapé Chesterfield éventré : cuir à découper, mousse, ressorts" },
  { x: 74.5, z: -19.5, quoi: "touret-table : bouteilles, bougies, magazines gondolés (papier)" },
  { x: 80.5, z: -23.5, quoi: "matelas sur palettes et bâche bleue" },
  { x: 63.5, z: 24, quoi: "dépôt sauvage : frigo couché (grille, gaz), pneus, machine à laver (tambour inox)" },
  { x: 81, z: 5.6, quoi: "abri de bus : plaques de plexiglas, banc métallique" },
];
const ETEINTS = [
  { x: -66, z: -2, type: "ancien habitant : monsieur en costume avec sa mallette (cabine vidéo n° 2)" },
  { x: -61, z: 4, type: "errant (cour du Love Center)" },
  { x: -90, z: 8.9, type: "rampant (fossé nord, sous les ronces)" },
  { x: XB + 2.6, z: 12.4, type: "rampant (berge, sous le pont)" },
  { x: XB - 1, z: 14.8, type: "errant (sur le pont)" },
  { x: -18, z: -6.4, type: "errant (cabane d'observation)" },
  { x: 40.2, z: -4.8, type: "équipé : combinaison de latex et cagoule de cuir (résiste aux lames à la tête) — dans le fourgon" },
  { x: 16.4, z: -15.4, type: "ancien habitant : en peignoir et chaussettes (caravane du Nid Coquin)" },
  { x: 33.5, z: -15.4, type: "errant (toilettes, côté « Messieurs »)" },
  { x: 24, z: 12.6, type: "rampant (sous le pin couché, près de la voiture écrasée)" },
  { x: 76.5, z: -20.5, type: "ancien habitant : en harnais de cuir clouté (la clairière)" },
  { x: 81, z: 6, type: "errant (abri de bus)" },
  { x: 63, z: 24.5, type: "rampant (dépôt sauvage, derrière le frigo)" },
];
const ENTREES = [
  { x: -100, z: 14, nature: "entrée A : la départementale, depuis le Carrefour" },
  { x: -71.5, z: 2.2, nature: "porte du Love Center (rideau de fer forcé)" },
  { x: -77, z: -6.2, nature: "porte de service du Love Center (vers le coin des routiers)" },
  { x: PONT.x0, z: 14, nature: "le pont de bois, côté ouest (goulet)" },
  { x: PONT.x1, z: 14, nature: "le pont de bois, côté est (goulet)" },
  { x: -15.4, z: -5.2, nature: "porte de la cabane d'observation" },
  { x: 6.5, z: 8.9, nature: "la barrière à moitié levée de l'aire (goulet : le pin couché barre la route)" },
  { x: 45, z: 8.9, nature: "sortie est de l'aire, vers la route" },
  { x: 30.5, z: -13.5, nature: "toilettes « Dames »" },
  { x: 33.5, z: -13.5, nature: "toilettes « Messieurs »" },
  { x: 39.6, z: -3.8, nature: "porte latérale du fourgon" },
  { x: 13.6, z: -14.1, nature: "porte de la caravane du Nid Coquin" },
  { x: 54, z: -16.5, nature: "le sentier de la clairière" },
  { x: 84, z: 7.5, nature: "le sentier de l'abri de bus vers la clairière" },
  { x: 100, z: 14, nature: "sortie B : la départementale, vers la Zone industrielle" },
];

const TRONCONS = [
  { id: "lisiere", nom: "La lisière et le Love Center", x: -75, depart: { x: -96, z: 14 }, description: "l'entrée A, la départementale dans les pins, le sex-shop routier « Love Center 24/24 » et son néon rose, le coin des routiers" },
  { id: "pont", nom: "Le pont de bois", x: -25, depart: { x: -48, z: 14 }, description: "le goulet du pont à une voie sur le ruisseau, la cabane de chasse devenue « cabane d'observation », deux poches d'embuscade au sud" },
  { id: "aire", nom: "L'aire", x: 25, depart: { x: 1, z: 14 }, description: "le pin couché qui barre la route, la barrière à moitié levée, le parking en terre battue : toilettes, fourgon-donjon, caravane « Le Nid Coquin »" },
  { id: "clairiere", nom: "La clairière", x: 75, depart: { x: 52, z: 14 }, description: "la clairière des rendez-vous (canapé, guirlande rouge, poupée dans l'arbre), l'abri de bus de la ligne 69, la sortie B" },
];

const CARTES = TRONCONS.map((t) => {
  const dans = (p) => p.x >= t.x - 25 && p.x < t.x + 25;
  const vers = (l) => l.filter(dans).map((p) => ({ ...p, x: arr(p.x - t.x), z: arr(p.z) }));
  return {
    id: t.id,
    nom: t.nom,
    lot: { l: 50, p: 70 },
    decalage: { x: t.x, z: 0 },
    depart: { x: arr(t.depart.x - t.x), z: t.depart.z },
    description: t.description,
    solPropre: true,
    entrees: vers(ENTREES.map((e) => (e.x === 100 ? { ...e, x: 99.9 } : e))),
    fouille: vers(FOUILLE),
    eteints: vers(ETEINTS),
  };
});

export const FICHE = {
  id: "halte-bois-joli",
  nom: "Halte · L'aire du Bois-Joli",
  lieu: "Halte · départementale de la Zone industrielle (ou de la Campagne) · entre le proche et le moyen",
  environnement: "forêt de pins (départementale)",
  anneau: "moyen",
  danger: 3,
  halte: true,
  solPropre: true,
  recit:
    "Sur la départementale, l'Abondance avait son petit secret : une aire sans services au fond des pins, où l'on garait sa berline de fonction à côté des fourgons aux vitres teintées pour « prendre l'air ». L'appli des aires lui donnait cinq étoiles — « ambiance chaleureuse » — et la borne promettait des rencontres premium géolocalisées. Depuis la Grande Panne, le néon rose du Love Center grésille encore sur sa batterie, et les habitués n'ont pas tous retrouvé la sortie.",
  inspiration: "les aires de repos forestières des départementales, leurs toilettes taguées et leurs parkings du soir ; les sex-shops routiers fermés en bord de nationale ; les guides d'urbex de la « France des aires »",
  reperes: [
    "Le pin couché en travers de la route sur une voiture écrasée : on passe par l'aire, sous la barrière à moitié levée entre deux gros blocs",
    "Le pont de bois à une voie sur le ruisseau, son garde-corps arraché, les sacs de sable du vieux barrage",
    "Le Love Center 24/24 : néon rose qui grésille (le V est mort), rideaux de fer, vitrine de lingerie sur bustes, rayons, cabines vidéo",
    "La cabane de chasse devenue « cabane d'observation » : meurtrières tournées vers le pont, chaises de jardin, jumelles, « Charte du bon observateur »",
    "Les toilettes en préfabriqué : annonces griffonnées (« Mardi 22 h, fouet fourni »), un trou dans la cloison",
    "Le fourgon « Plomberie Dédé » aux vitres teintées : croix de Saint-André, matelas en simili cuir, chaînes, menottes à fourrure rose, fouets, bougies",
    "La caravane « Le Nid Coquin » : lit rond, miroir au plafond, flamant rose en plastique",
    "La clairière : canapé Chesterfield sous les pins, guirlande rouge sur batterie solaire, poupée gonflable crevée dans un arbre, magazines gondolés, « Ici, on se respecte »",
    "L'Abondance : borne « Rencontres premium géolocalisées — 0 personne autour de vous », panneau « discrétion garantie par algorithme », note ★★★★★ « ambiance chaleureuse »",
    "L'abri de bus de la ligne 69, « navette autonome à la demande — service suspendu »",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -96, z: 14 },
  goulets: [
    { x: arr(XB), z: 14, nature: "le pont de bois à une voie (4,4 m de large) sur le ruisseau" },
    { x: 6.5, z: 8.9, nature: "la barrière à moitié levée entre deux blocs : le pin couché barre la route, on traverse l'aire" },
  ],
  panneaux: [
    { x: -96, z: 10.45, texte: "← Le Carrefour · Comptoir 3 km" },
    { x: -84, z: 17.55, texte: "Aire du Bois-Joli · 500 m" },
    { x: 0.5, z: 10.45, texte: "PIN COUCHÉ ! PASSEZ PAR L'AIRE →" },
    { x: 96, z: 10.45, texte: "Zone industrielle · 6 km →" },
  ],
  cartes: CARTES,
};

// ---------- Matières et atlas ----------

const AL = 1024;
const AH = 2048;
const R = {
  loveNeon: [0, 0, 1024, 200],
  loveBandeau: [0, 200, 1024, 120],
  vitrine: [0, 320, 256, 384],
  jouets: [256, 320, 256, 384],
  borne: [512, 320, 256, 384],
  cabines: [768, 320, 256, 128],
  notation: [768, 448, 256, 256],
  panneauAire: [0, 704, 512, 256],
  graffitiA: [512, 704, 512, 256],
  graffitiB: [0, 960, 512, 256],
  graffitiC: [512, 960, 512, 256],
  nid: [0, 1216, 512, 128],
  cabane: [512, 1216, 512, 128],
  mag0: [0, 1344, 128, 176],
  mag1: [128, 1344, 128, 176],
  mag2: [256, 1344, 128, 176],
  mag3: [384, 1344, 128, 176],
  charte: [512, 1344, 256, 176],
  respect: [768, 1344, 256, 176],
  ouest: [0, 1520, 512, 112],
  est: [512, 1520, 512, 112],
  aire500: [0, 1632, 512, 112],
  deviation: [512, 1632, 512, 112],
  plomberie: [0, 1744, 512, 112],
  bus: [512, 1744, 512, 112],
  pont: [0, 1856, 128, 128],
  watty: [128, 1856, 128, 128],
  wc: [256, 1856, 256, 128],
  distrib: [512, 1856, 128, 192],
  coeur: [640, 1856, 128, 128],
};

let MATS = null;
function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("boisjoli-atlas", AL, AH, dessinerAtlas, false);
  const asphalte = matiereTexture(dessiner("boisjoli-asphalte", 256, 256, dessinerAsphalte), { roughness: 0.95 });
  asphalte.userData.tuile = 4;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.4, vertexColors: true, roughness: 0.5, alphaTest: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  const ecran = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.75, vertexColors: true, roughness: 0.3, side: THREE.DoubleSide });
  ecran.userData.sansOmbre = true;
  const ampoules = new THREE.MeshBasicMaterial({ vertexColors: true });
  ampoules.userData.sansOmbre = true;
  MATS = {
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0x3c4a44, 0.7),
    asphalte,
    enseignes,
    neon,
    ecran,
    ampoules,
  };
  return MATS;
}

function dessinerAsphalte(g) {
  const a = aleatoire(31);
  g.fillStyle = "#cfcdc8";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    const v = 150 + Math.floor(a() * 90);
    g.fillStyle = `rgba(${v},${v},${v - 4},0.5)`;
    g.fillRect(a() * 256, a() * 256, 1 + a() * 2, 1 + a() * 2);
  }
  taches(g, a, 10, "rgba(60,58,52,0.22)", 12, 50, 256, 256);
  // Rustines et fissures
  g.fillStyle = "rgba(70,68,62,0.25)";
  g.fillRect(40, 150, 70, 40);
  g.strokeStyle = "rgba(40,38,34,0.6)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      x += (a() - 0.5) * 30;
      y += (a() - 0.5) * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

/** Écrit un texte centré, réduit pour tenir dans `largeur`. */
function texte(g, s, x, y, taille, couleur, o = {}) {
  let t = taille;
  const police = o.police ?? "Helvetica, Arial, sans-serif";
  do {
    g.font = `${o.style ?? ""} ${o.poids ?? "bold"} ${t}px ${police}`;
    t -= 1;
  } while (o.largeur && g.measureText(s).width > o.largeur && t > 6);
  g.fillStyle = couleur;
  g.textAlign = o.align ?? "center";
  g.textBaseline = "middle";
  if (o.contour) {
    g.lineWidth = o.contour;
    g.strokeStyle = o.couleurContour ?? "#000";
    g.strokeText(s, x, y);
  }
  g.fillText(s, x, y);
}
const MAIN = '"Marker Felt", "Comic Sans MS", "Chalkboard", cursive';
const SERIF = 'Georgia, "Times New Roman", serif';

function coeur(g, x, y, s, couleur, plein = true) {
  g.beginPath();
  g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.45, y - s, x, y - s * 0.45);
  g.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
  if (plein) {
    g.fillStyle = couleur;
    g.fill();
  } else {
    g.strokeStyle = couleur;
    g.stroke();
  }
}

function salir(g, a, x, y, l, h, n = 6, force = 0.18) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < n; i++) {
    const cx = x + a() * l;
    const cy = y + a() * h;
    const r = 10 + a() * 40;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    d.addColorStop(0, `rgba(60,50,35,${force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  g.restore();
}

function dessinerAtlas(g) {
  const a = aleatoire(69);
  g.clearRect(0, 0, AL, AH);

  // Le néon « LOVE CENTER 24/24 » : des tubes sur fond transparent ; le V est mort.
  {
    const [x, y, l, h] = R.loveNeon;
    g.save();
    g.lineJoin = "round";
    const lettres = [["L", 0], ["O", 0], ["V", 1], ["E", 0], [" ", 0], ["C", 0], ["E", 0], ["N", 0], ["T", 0], ["E", 0], ["R", 0]];
    g.font = `italic bold 120px ${SERIF}`;
    let cx = x + 60;
    for (const [c, mort] of lettres) {
      const w = g.measureText(c).width;
      g.lineWidth = 16;
      g.strokeStyle = mort ? "#5a2440" : "#ff4fa8";
      g.strokeText(c, cx, y + 110);
      g.lineWidth = 6;
      g.strokeStyle = mort ? "#7a3a58" : "#ffd6ef";
      g.strokeText(c, cx, y + 110);
      cx += w + 4;
    }
    g.font = `bold 64px Helvetica, Arial, sans-serif`;
    g.lineWidth = 10;
    g.strokeStyle = "#ff4fa8";
    g.strokeText("24/24", x + 740, y + 172);
    g.lineWidth = 4;
    g.strokeStyle = "#ffe0f2";
    g.strokeText("24/24", x + 740, y + 172);
    g.lineWidth = 10;
    coeur(g, x + 940, y + 120, 60, "#ff2a5a", false);
    g.lineWidth = 4;
    coeur(g, x + 940, y + 120, 60, "#ffd0dc", false);
    g.restore();
  }
  // Le bandeau peint du flanc
  {
    const [x, y, l, h] = R.loveBandeau;
    g.fillStyle = "#3a1a30";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c79a3b";
    g.fillRect(x, y + 6, l, 4);
    g.fillRect(x, y + h - 10, l, 4);
    texte(g, "LOVE CENTER · LINGERIE · ACCESSOIRES · CABINES VIDÉO", x + l / 2, y + 48, 46, "#f1c7dc", { largeur: l - 40 });
    texte(g, "Ouvert 24 h/24, 7 j/7 — Discrétion assurée — Parking privé", x + l / 2, y + 92, 28, "#e9dfc6", { largeur: l - 60, poids: "normal" });
    salir(g, a, x, y, l, h, 10, 0.3);
  }
  // L'affiche de vitrine
  {
    const [x, y, l, h] = R.vitrine;
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, h);
    texte(g, "SOLDES", x + l / 2, y + 48, 54, "#fff3e6", { largeur: l - 20 });
    texte(g, "COQUINES", x + l / 2, y + 100, 40, "#ffd0e4", { largeur: l - 20 });
    texte(g, "-70 %", x + l / 2, y + 160, 64, "#fff", { largeur: l - 20 });
    // Une guêpière stylisée (rien de plus)
    g.fillStyle = "#1b1418";
    g.beginPath();
    g.moveTo(x + 78, y + 210);
    g.lineTo(x + 178, y + 210);
    g.lineTo(x + 166, y + 290);
    g.lineTo(x + 90, y + 290);
    g.closePath();
    g.fill();
    g.strokeStyle = "#ffd0e4";
    g.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.arc(x + 88 + i * 20, y + 290, 10, 0, Math.PI);
      g.stroke();
    }
    texte(g, "Collection Abondance", x + l / 2, y + 325, 22, "#fff3e6", { largeur: l - 20 });
    texte(g, "dentelle connectée", x + l / 2, y + 352, 20, "#ffd0e4", { largeur: l - 20, poids: "normal" });
    salir(g, a, x, y, l, h, 8, 0.25);
  }
  // Les jouets « pour grands » en boîtes (seulement des boîtes)
  {
    const [x, y, l, h] = R.jouets;
    g.fillStyle = "#2a1824";
    g.fillRect(x, y, l, h);
    texte(g, "JOUETS POUR GRANDS", x + l / 2, y + 24, 22, "#ffd0e4", { largeur: l - 16 });
    const tons = ["#e88fb8", "#7a5a90", "#c8362b", "#2f6f73", "#e9dfc6", "#c79a3b"];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const bx = x + 14 + c * 80;
      const by = y + 50 + r * 104;
      g.fillStyle = tons[(r * 3 + c) % tons.length];
      g.fillRect(bx, by, 68, 86);
      coeur(g, bx + 34, by + 36, 16, "rgba(255,255,255,0.75)");
      g.fillStyle = "rgba(0,0,0,0.45)";
      g.fillRect(bx, by + 64, 68, 22);
      texte(g, ["Bluetooth 6.0", "Appli requise", "Abonnement", "Premium", "Mode Éco", "Édition Watty"][(r + c * 2) % 6], bx + 34, by + 75, 11, "#fff", { largeur: 64 });
    }
    texte(g, "Abonnement expiré", x + l / 2, y + h - 18, 18, "#ff6f6f", { largeur: l - 20 });
  }
  // L'écran de la borne de rencontres
  {
    const [x, y, l, h] = R.borne;
    const d = g.createLinearGradient(0, y, 0, y + h);
    d.addColorStop(0, "#14203a");
    d.addColorStop(1, "#2a1238");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    coeur(g, x + 34, y + 34, 18, "#ff5fa8");
    texte(g, "RENCONTRES", x + 140, y + 28, 26, "#ffd0e4", { largeur: 170 });
    texte(g, "PREMIUM", x + 140, y + 54, 22, "#ff5fa8", { largeur: 170 });
    texte(g, "géolocalisées", x + l / 2, y + 84, 20, "#cfe0ff", { poids: "normal" });
    g.strokeStyle = "rgba(120,200,255,0.55)";
    g.lineWidth = 2;
    for (const r of [26, 52, 78]) {
      g.beginPath();
      g.arc(x + l / 2, y + 190, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(x + l / 2, y + 190);
    g.lineTo(x + l / 2 + 70, y + 150);
    g.stroke();
    g.fillStyle = "#7fd0ff";
    g.beginPath();
    g.arc(x + l / 2, y + 190, 6, 0, 7);
    g.fill();
    texte(g, "0 personne", x + l / 2, y + 296, 34, "#ffffff", { largeur: l - 20 });
    texte(g, "autour de vous", x + l / 2, y + 326, 22, "#cfe0ff", { poids: "normal" });
    g.fillStyle = "#ff5fa8";
    g.fillRect(x + 24, y + 344, l - 48, 30);
    texte(g, "Élargir le rayon : 4,99 €", x + l / 2, y + 359, 16, "#fff", { largeur: l - 60 });
  }
  // « CABINES VIDÉO »
  {
    const [x, y, l, h] = R.cabines;
    g.fillStyle = "#120c10";
    g.fillRect(x, y, l, h);
    texte(g, "CABINES VIDÉO", x + l / 2, y + 44, 34, "#ff3a4a", { largeur: l - 16 });
    texte(g, "Réalité virtuelle 8K", x + l / 2, y + 82, 20, "#f1c7dc", { largeur: l - 16, poids: "normal" });
    texte(g, "Forfait Premium Passion", x + l / 2, y + 106, 18, "#c79a3b", { largeur: l - 16, poids: "normal" });
  }
  // La note de l'appli des aires
  {
    const [x, y, l, h] = R.notation;
    g.fillStyle = "#f4f1ea";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 44);
    texte(g, "AiresNote", x + l / 2, y + 23, 26, "#fff");
    texte(g, "Aire du Bois-Joli", x + l / 2, y + 66, 22, "#222", { largeur: l - 20 });
    texte(g, "★★★★★ 4,9", x + l / 2, y + 100, 30, "#c79a3b", { largeur: l - 20 });
    texte(g, "« Ambiance chaleureuse »", x + l / 2, y + 136, 18, "#333", { largeur: l - 16, style: "italic", poids: "normal" });
    texte(g, "« Personnel très accueillant »", x + l / 2, y + 160, 16, "#333", { largeur: l - 16, style: "italic", poids: "normal" });
    texte(g, "4 812 avis", x + 70, y + 222, 18, "#666", { poids: "normal" });
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) if (a() < 0.55 || i % 6 === 0 || j % 6 === 0) {
      g.fillStyle = "#111";
      g.fillRect(x + 160 + i * 11, y + 186 + j * 9, 10, 8);
    }
    salir(g, a, x, y, l, h, 5, 0.18);
  }
  // Le panneau de l'aire (bois)
  {
    const [x, y, l, h] = R.panneauAire;
    g.fillStyle = "#6b4a2e";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(30,18,8,${0.15 + a() * 0.15})`;
      g.fillRect(x, y + i * 43, l, 2);
    }
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 6;
    g.strokeRect(x + 12, y + 12, l - 24, h - 24);
    texte(g, "AIRE DU BOIS-JOLI", x + l / 2, y + 62, 56, "#efe6cf", { largeur: l - 60, police: SERIF });
    texte(g, "Discrétion garantie par algorithme", x + l / 2, y + 116, 30, "#ffd0e4", { largeur: l - 60, style: "italic", poids: "normal", police: SERIF });
    // Pictogrammes : table, toilettes, œil barré
    g.fillStyle = "#efe6cf";
    g.fillRect(x + 110, y + 160, 60, 8);
    g.fillRect(x + 118, y + 168, 6, 28);
    g.fillRect(x + 156, y + 168, 6, 28);
    texte(g, "WC", x + 256, y + 180, 38, "#efe6cf");
    g.strokeStyle = "#efe6cf";
    g.lineWidth = 5;
    g.beginPath();
    g.ellipse(x + 370, y + 180, 34, 18, 0, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(x + 370, y + 180, 8, 0, 7);
    g.fillStyle = "#efe6cf";
    g.fill();
    g.strokeStyle = "#c8362b";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(x + 330, y + 210);
    g.lineTo(x + 410, y + 150);
    g.stroke();
    texte(g, "Caméras désactivées pour votre confort", x + l / 2, y + 226, 20, "#e9dfc6", { largeur: l - 60, poids: "normal" });
    salir(g, a, x, y, l, h, 10, 0.3);
  }
  // Les murs des toilettes : annonces griffonnées
  const murSale = (x, y, l, h, fond) => {
    g.fillStyle = fond;
    g.fillRect(x, y, l, h);
    salir(g, a, x, y, l, h, 14, 0.22);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(30,30,30,${0.15 + a() * 0.2})`;
      g.lineWidth = 1;
      g.beginPath();
      const px = x + a() * l;
      const py = y + a() * h;
      g.moveTo(px, py);
      g.lineTo(px + (a() - 0.5) * 30, py + (a() - 0.5) * 20);
      g.stroke();
    }
  };
  const griffe = (s, x, y, t, c, rot = 0) => {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    texte(g, s, 0, 0, t, c, { police: MAIN, poids: "normal" });
    g.restore();
  };
  {
    const [x, y, l, h] = R.graffitiA;
    murSale(x, y, l, h, "#d8d0b4");
    griffe("Mardi 22 h, fouet fourni", x + 170, y + 40, 30, "#1c1c1c", -0.05);
    griffe("Couple cherche spectateur discret", x + 250, y + 92, 26, "#1f3b8a", 0.03);
    griffe("Ne pas déranger, je suis en réunion", x + 240, y + 140, 24, "#8a1f1f", -0.02);
    griffe("06 ·· ·· ·· 69", x + 120, y + 190, 30, "#1c1c1c", 0.06);
    griffe("ICI →", x + 410, y + 200, 38, "#c8362b", -0.1);
    coeur(g, x + 300, y + 205, 18, "#c8362b", false);
    griffe("soir seulement", x + 300, y + 236, 18, "#333", 0.02);
  }
  {
    const [x, y, l, h] = R.graffitiB;
    murSale(x, y, l, h, "#cfc8ae");
    griffe("Échangisme jeudi : apportez les chips", x + 250, y + 40, 26, "#1c1c1c", 0.02);
    griffe("Maître cherche esclave", x + 160, y + 92, 28, "#5a1f6a", -0.04);
    griffe("sachant faire la vaisselle", x + 200, y + 124, 22, "#5a1f6a", -0.04);
    griffe("Jeanne + Gégé = ♥ (et Michel)", x + 300, y + 176, 24, "#1f3b8a", 0.05);
    griffe("Discrétion garantie… par qui ?", x + 230, y + 226, 22, "#8a1f1f", -0.02);
  }
  {
    const [x, y, l, h] = R.graffitiC;
    murSale(x, y, l, h, "#c9c2a6");
    texte(g, "BOIS-JOLI LOVE", x + 170, y + 52, 52, "#c8362b", { contour: 4, couleurContour: "#222", police: "Impact, 'Arial Black', sans-serif" });
    griffe("RDV 23 h canapé", x + 400, y + 50, 28, "#1c1c1c", 0.1);
    // Un Watty griffonné qui fait un clin d'œil
    g.strokeStyle = "#1f3b8a";
    g.lineWidth = 4;
    g.strokeRect(x + 40, y + 110, 70, 110);
    g.strokeRect(x + 62, y + 98, 26, 12);
    g.beginPath();
    g.arc(x + 62, y + 150, 6, 0, 7);
    g.stroke();
    g.beginPath();
    g.moveTo(x + 80, y + 150);
    g.lineTo(x + 96, y + 150);
    g.stroke();
    g.beginPath();
    g.arc(x + 75, y + 178, 16, 0.2, Math.PI - 0.2);
    g.stroke();
    griffe("Toujours plein, jamais à plat !", x + 300, y + 140, 28, "#1f3b8a", -0.03);
    griffe("La Grande Panne a tué l'ambiance", x + 300, y + 200, 24, "#1c1c1c", 0.02);
  }
  // Le lettrage de la caravane
  {
    const [x, y, l, h] = R.nid;
    texte(g, "Le Nid Coquin", x + l / 2 - 20, y + 54, 66, "#d6407e", { style: "italic", police: SERIF, contour: 3, couleurContour: "#fff" });
    coeur(g, x + 470, y + 50, 26, "#d6407e");
    texte(g, "location à l'heure — draps fournis", x + l / 2, y + 106, 22, "#8a5a3a", { style: "italic", poids: "normal", police: SERIF });
  }
  // L'écriteau de la cabane
  {
    const [x, y, l, h] = R.cabane;
    g.fillStyle = "#8a6a46";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = "rgba(40,24,10,0.35)";
      g.fillRect(x, y + i * 43, l, 3);
    }
    texte(g, "CABANE D'OBSERVATION", x + l / 2, y + 50, 46, "#2a1a0c", { largeur: l - 30, police: "Impact, 'Arial Black', sans-serif" });
    texte(g, "Silence, on regarde", x + l / 2, y + 98, 28, "#2a1a0c", { style: "italic", poids: "normal", police: SERIF });
  }
  // Les magazines (couvertures suggestives, rien de détaillé)
  const titres = [["COQUINES", "DES BOIS", "#7a2630"], ["ROND-POINT", "HOT", "#2f2a52"], ["PNEUS &", "DENTELLE", "#1d3a3a"], ["SOLAIRE", "ET CHAUDE", "#8a4a12"]];
  titres.forEach(([t1, t2, fond], i) => {
    const [x, y, l, h] = R["mag" + i];
    g.fillStyle = fond;
    g.fillRect(x, y, l, h);
    texte(g, t1, x + l / 2, y + 20, 24, "#ffe14a", { largeur: l - 8, police: "Impact, 'Arial Black', sans-serif" });
    texte(g, t2, x + l / 2, y + 44, 20, "#ffffff", { largeur: l - 8, police: "Impact, 'Arial Black', sans-serif" });
    if (i % 2 === 0) {
      // Des lèvres rouges
      g.fillStyle = "#e0303a";
      g.beginPath();
      g.ellipse(x + l / 2, y + 108, 34, 16, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#5a0a10";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + l / 2 - 32, y + 108);
      g.quadraticCurveTo(x + l / 2, y + 116, x + l / 2 + 32, y + 108);
      g.stroke();
    } else {
      coeur(g, x + l / 2, y + 110, 34, "#ff5fa8");
    }
    texte(g, ["Spécial aires de repos", "Nos lectrices racontent", "Le guide 2031 des parkings"][i % 3], x + l / 2, y + 152, 12, "#fff", { largeur: l - 8, poids: "normal" });
    salir(g, a, x, y, l, h, 6, 0.35);
  });
  // La charte du bon observateur
  {
    const [x, y, l, h] = R.charte;
    g.fillStyle = "#ece6d4";
    g.fillRect(x, y, l, h);
    texte(g, "CHARTE DU BON OBSERVATEUR", x + l / 2, y + 20, 18, "#2a1a0c", { largeur: l - 12 });
    ["1. On regarde.", "2. On ne touche pas.", "3. On note l'heure.", "4. On ne juge pas.", "5. On repart sans bruit."].forEach((s, i) => texte(g, s, x + 18, y + 50 + i * 24, 17, "#333", { align: "left", poids: "normal" }));
    salir(g, a, x, y, l, h, 6, 0.25);
  }
  // L'écriteau de la clairière
  {
    const [x, y, l, h] = R.respect;
    g.fillStyle = "#7a5a3c";
    g.fillRect(x, y, l, h);
    texte(g, "Ici, on se respecte", x + l / 2, y + 40, 28, "#f4ead2", { largeur: l - 16, police: MAIN, poids: "normal" });
    coeur(g, x + l / 2, y + 88, 24, "#d6407e");
    texte(g, "Consentement obligatoire", x + l / 2, y + 130, 20, "#f4ead2", { largeur: l - 16, police: MAIN, poids: "normal" });
    texte(g, "(même pour les Éteints)", x + l / 2, y + 156, 15, "#e9c8a0", { largeur: l - 16, police: MAIN, poids: "normal" });
  }
  // Les panneaux routiers
  const routier = (r, l1, l2, fond = "#f4f1ea", encre = "#111") => {
    const [x, y, l, h] = r;
    g.fillStyle = fond;
    g.fillRect(x, y, l, h);
    g.strokeStyle = encre;
    g.lineWidth = 6;
    g.strokeRect(x + 8, y + 8, l - 16, h - 16);
    texte(g, l1, x + l / 2, y + h * 0.36, 38, encre, { largeur: l - 40 });
    texte(g, l2, x + l / 2, y + h * 0.72, 28, encre, { largeur: l - 40, poids: "normal" });
    salir(g, a, x, y, l, h, 6, 0.2);
  };
  routier(R.ouest, "← Le Carrefour", "Comptoir · 3 km");
  routier(R.est, "Zone industrielle →", "6 km · Le péage");
  routier(R.aire500, "Aire du Bois-Joli", "500 m · sans services", "#2b4f86", "#f4f1ea");
  {
    const [x, y, l, h] = R.deviation;
    g.fillStyle = "#b9a888";
    g.fillRect(x, y, l, h);
    salir(g, a, x, y, l, h, 8, 0.3);
    texte(g, "PIN COUCHÉ !", x + l / 2, y + 36, 40, "#b0201a", { police: MAIN, poids: "normal", largeur: l - 20 });
    texte(g, "PASSEZ PAR L'AIRE →", x + l / 2, y + 82, 34, "#b0201a", { police: MAIN, poids: "normal", largeur: l - 20 });
  }
  {
    const [x, y, l, h] = R.plomberie;
    texte(g, "PLOMBERIE DÉDÉ", x + l / 2, y + 40, 52, "#1f4f8a", { largeur: l - 20, police: "Impact, 'Arial Black', sans-serif", contour: 3, couleurContour: "#fff" });
    texte(g, "Débouchage express · 7 j/7 · Discrétion assurée", x + l / 2, y + 86, 22, "#c8362b", { largeur: l - 20 });
  }
  routier(R.bus, "LIGNE 69 · Bois-Joli", "Navette autonome à la demande — service suspendu", "#e9dfc6", "#2f6f73");
  // Pont étroit (triangle)
  {
    const [x, y, l, h] = R.pont;
    g.fillStyle = "#f4f1ea";
    g.strokeStyle = "#c8362b";
    g.lineWidth = 12;
    g.beginPath();
    g.moveTo(x + 64, y + 10);
    g.lineTo(x + 120, y + 112);
    g.lineTo(x + 8, y + 112);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = "#111";
    g.beginPath();
    g.moveTo(x + 48, y + 100);
    g.lineTo(x + 56, y + 50);
    g.lineTo(x + 60, y + 100);
    g.moveTo(x + 80, y + 100);
    g.lineTo(x + 72, y + 50);
    g.lineTo(x + 68, y + 100);
    g.fill();
  }
  // Watty (autocollant)
  {
    const [x, y] = R.watty;
    g.fillStyle = "#c79a3b";
    g.fillRect(x + 34, y + 24, 60, 92);
    g.fillRect(x + 52, y + 12, 24, 14);
    g.fillStyle = "#111";
    g.beginPath();
    g.arc(x + 52, y + 58, 6, 0, 7);
    g.arc(x + 76, y + 58, 6, 0, 7);
    g.fill();
    g.strokeStyle = "#111";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(x + 64, y + 76, 16, 0.3, Math.PI - 0.3);
    g.stroke();
    texte(g, "Watty", x + 64, y + 104, 16, "#111");
  }
  {
    const [x, y, l, h] = R.wc;
    g.fillStyle = "#e9e6dc";
    g.fillRect(x, y, l, h);
    texte(g, "WC", x + l / 2, y + 44, 56, "#2f6f73");
    texte(g, "Hors service depuis la Grande Panne", x + l / 2, y + 98, 16, "#8a1f1f", { largeur: l - 12 });
    salir(g, a, x, y, l, h, 6, 0.25);
  }
  {
    const [x, y, l, h] = R.distrib;
    g.fillStyle = "#1c1820";
    g.fillRect(x, y, l, h);
    texte(g, "DISTRIBUTEUR", x + l / 2, y + 14, 14, "#ff5fa8", { largeur: l - 8 });
    texte(g, "DISCRET 24/24", x + l / 2, y + 30, 13, "#ff5fa8", { largeur: l - 8 });
    const tons = ["#e88fb8", "#c79a3b", "#2f6f73", "#c8362b"];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      g.fillStyle = tons[(r + c) % 4];
      g.fillRect(x + 10 + c * 38, y + 44 + r * 30, 30, 22);
    }
    texte(g, "Sans contact uniquement", x + l / 2, y + 176, 10, "#e9dfc6", { largeur: l - 8, poids: "normal" });
  }
  {
    const [x, y] = R.coeur;
    coeur(g, x + 64, y + 70, 56, "#d6407e");
  }
}

// ---------- Outils de pose ----------

const G = {
  cyl5: new THREE.CylinderGeometry(1, 1, 1, 5),
  cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone5: new THREE.ConeGeometry(1, 1, 5),
  ico: new THREE.IcosahedronGeometry(1, 0),
  sph: new THREE.SphereGeometry(1, 7, 5),
  tore: new THREE.TorusGeometry(1, 0.35, 4, 8),
};

function cyl(c, couleur, mat, x, y, z, r, h, pose = {}, geo = G.cyl5) {
  c.poser(geo, mat, couleur, { x, y, z, ...pose, e: [r, h, pose.ep ?? r] });
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function affiche(c, mat, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Pose une géométrie brute (couleurs par sommet) dans le lot d'une matière : aucun appel de dessin de plus. */
function poserBrut(c, pos, col, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.computeVertexNormals();
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(col), 3));
  let lot = c.lots.get(mat);
  if (!lot) c.lots.set(mat, (lot = []));
  lot.push(g);
}

/** Un rectangle d'obstacles (centre, taille, rotation). */
function obstacleBoite(b, x, z, l, p, ry, nature) {
  const co = Math.cos(ry);
  const si = Math.sin(ry);
  const pt = (u, v) => [x + u * co + v * si, z - u * si + v * co];
  const c = [pt(-l / 2, -p / 2), pt(l / 2, -p / 2), pt(l / 2, p / 2), pt(-l / 2, p / 2)];
  for (let i = 0; i < 4; i++) b.obstacle(c[i][0], c[i][1], c[(i + 1) % 4][0], c[(i + 1) % 4][1], nature);
}

/** Un mur coupé à hauteur d'allège : le bas reste, le haut va dans la couche `k` (il s'efface). */
function murCoupe(ctx, k, a, bb, spec, coupe = 1.15) {
  const ouv = spec.ouvertures ?? [];
  mur(ctx.c, a, bb, { ...spec, h: coupe, breches: [], batiment: ctx.b, ouvertures: ouv.filter((o) => o.bas < coupe).map((o) => ({ ...o, type: "vide", haut: Math.min(o.haut, coupe + 0.5) })) });
  mur(k, a, bb, { ...spec, y0: coupe, h: spec.h - coupe, batiment: null, ouvertures: ouv.filter((o) => o.haut > coupe).map((o) => ({ ...o, type: "vide", bas: Math.max(0, o.bas - coupe), haut: o.haut - coupe })) });
}

/** Un battant de porte (charnière en x, z ; ouvert d'un angle). */
function battant(c, x, z, ry, l, h, couleur, mat) {
  c.repere({ x, y: 0, z, ry }, () => {
    c.pave(0, 0.02, -0.025, l, h, 0.025, couleur, mat, { nuance: 0.05 });
    c.pave(l - 0.12, h * 0.48, 0.025, l - 0.06, h * 0.52, 0.06, 0x9a9a92, MATS.metal);
  });
}

function chaisePlastique(c, x, z, ry, couleur = 0xe6e2d8, renversee = false) {
  const M = MATS;
  c.repere({ x, y: renversee ? 0.22 : 0, z, ry, rz: renversee ? 1.45 : 0 }, () => {
    c.pave(-0.23, 0.42, -0.21, 0.23, 0.46, 0.21, couleur, M.satin);
    c.boite(0.46, 0.42, 0.04, couleur, { y: 0.68, z: -0.22, rx: -0.15 }, M.satin);
    for (const [sx, sz] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) c.poutre([sx, 0, sz * 1.2], [sx, 0.43, sz], 0.035, couleur, M.satin);
  });
}

function matelas(c, x, z, ry, l, p, couleur, y = 0, rz = 0) {
  c.boite(l, 0.18, p, couleur, { x, y: y + 0.09, z, ry, rz }, MATS.toile, { nuance: 0.05 });
  for (let i = 0; i < 2; i++) c.boite(l * 0.3, 0.005, p * 0.25, 0x8a7a5a, { x: x + (i - 0.5) * l * 0.3, y: y + 0.185, z: z + (i ? 0.1 : -0.15), ry }, MATS.toile, { crasse: false });
}

/** Une épave de voiture. Options : ecrase (toit aplati), brule, vitresCachees, portiere. */
function epave(c, x, z, ry, teinte, o = {}) {
  const M = MATS;
  const brule = !!o.brule;
  const t = brule ? 0x4a3a30 : teinte;
  c.repere({ x, y: o.y ?? 0, z, ry, rx: o.rx ?? 0, rz: o.rz ?? 0 }, () => {
    c.pave(-2.15, 0.3, -0.86, 2.15, 0.82, 0.86, t, M.satin);
    c.pave(1.3, 0.82, -0.84, 2.1, 0.92, 0.84, t, M.satin);
    c.pave(-2.1, 0.82, -0.84, -1.6, 0.95, 0.84, t, M.satin);
    const hh = o.ecrase ? 0.2 : 0.58;
    c.pave(-1.5, 0.82, -0.78, 0.6, 0.86 + hh, 0.78, t, M.satin);
    // Vitres : pare-brise incliné, vitres latérales
    if (!brule) {
      c.boite(0.04, hh * 0.9, 1.4, o.vitresCachees ? 0xc8ccd0 : 0xffffff, { x: 0.85, y: 0.86 + hh * 0.45, rz: 0.55 }, o.vitresCachees ? M.toile : M.verre, { crasse: false });
      for (const s of [-1, 1]) c.pave(-1.4, 0.92, s * 0.785, 0.5, 0.8 + hh, s * 0.8, o.vitresCachees ? 0xd8dde2 : 0xffffff, o.vitresCachees ? M.toile : M.verre, { crasse: false });
    } else {
      c.pave(0.62, 0.86, -0.7, 0.7, 0.86 + hh, 0.7, 0x2a2420, M.tole);
    }
    // Roues (ou jantes nues), pare-chocs, phares
    for (const sx of [-1.35, 1.35]) for (const sz of [-0.82, 0.82]) {
      c.poser(G.cyl8, M.mat, brule ? 0x5a3a2a : 0x2a2826, { x: sx, y: brule ? 0.22 : 0.3, z: sz, rx: Math.PI / 2, e: [brule ? 0.24 : 0.31, 0.2, brule ? 0.24 : 0.31] });
    }
    c.pave(2.12, 0.3, -0.84, 2.24, 0.48, 0.84, brule ? 0x3a2a22 : 0x8d969a, M.metal);
    c.pave(-2.24, 0.3, -0.84, -2.12, 0.48, 0.84, brule ? 0x3a2a22 : 0x8d969a, M.metal);
    if (!brule) for (const s of [-1, 1]) c.pave(2.14, 0.6, s * 0.62 - 0.14, 2.17, 0.72, s * 0.62 + 0.14, 0xe8e4d0, M.lisse, { crasse: false });
    // Rouille
    for (let i = 0; i < 4; i++) c.boite(c.entre(0.3, 0.8), c.entre(0.1, 0.25), 0.02, PALETTE.rouille, { x: c.entre(-1.8, 1.8), y: c.entre(0.4, 0.7), z: (c.hasard() < 0.5 ? -1 : 1) * 0.865 }, M.mat, { crasse: false, nuance: 0.1 });
    if (o.portiere) c.repere({ x: 0.4, y: 0, z: 0.86, ry: -0.9 }, () => c.pave(-1.0, 0.35, -0.03, 0, 1.3, 0.03, t, M.satin));
  });
}

// ---------- Le sol, la route, la forêt ----------

function grille(a, b, pas, raffinements = []) {
  const v = new Set();
  for (let x = a; x < b - 1e-6; x += pas) v.add(Math.round(x * 1000) / 1000);
  v.add(b);
  for (const [r0, r1, p] of raffinements) for (let x = Math.max(a, r0); x <= Math.min(b, r1); x += p) v.add(Math.round(x * 1000) / 1000);
  return [...v].sort((p, q) => p - q);
}

function melange(c1, c2, t) {
  const a = new THREE.Color(c1);
  return a.lerp(new THREE.Color(c2), t);
}

function couleurSol(x, z, y) {
  const n = bruit(x, z);
  if (y < -0.85) return melange(0x4a4535, 0x3a4636, n);
  if (y < -0.06) return melange(0x4f6436, 0x6a5a3c, n);
  const surRoute = Math.abs(z - ROUTE.z) < 3.95 && !(x > PONT.x0 - 0.3 && x < PONT.x1 + 0.3);
  if (surRoute) return melange(0x9a917f, 0x847c6a, n);
  if (marchable(x, z)) {
    if (x < -55 && x > -85 && z < 8 && z > -9.5) return melange(0x9b9384, 0x7f786a, n);
    return melange(0xa08462, 0x7c6346, n);
  }
  const m = bruit(z * 1.7 + 3, x * 1.3);
  return m > 0.62 ? melange(0x4e6034, 0x5c7040, n) : melange(0x6e563a, 0x5a4a34, n);
}

function sol(ctx) {
  const { c, x0, x1 } = ctx;
  const M = MATS;
  const xs = grille(x0, x1, 1, [[-36, -22, 0.5]]);
  const zs = grille(-35, 35, 1, [[7, 11, 0.4], [17, 21, 0.4]]);
  const H = [];
  const C = [];
  for (let i = 0; i < xs.length; i++) {
    H.push([]);
    C.push([]);
    for (let j = 0; j < zs.length; j++) {
      const y = hauteurSol(xs[i], zs[j]);
      H[i].push(y);
      C[i].push(couleurSol(xs[i], zs[j], y));
    }
  }
  const pos = [];
  const col = [];
  const pt = (i, j) => {
    pos.push(xs[i], H[i][j], zs[j]);
    col.push(C[i][j].r, C[i][j].g, C[i][j].b);
  };
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < zs.length - 1; j++) {
      pt(i, j);
      pt(i, j + 1);
      pt(i + 1, j);
      pt(i + 1, j);
      pt(i, j + 1);
      pt(i + 1, j + 1);
    }
  }
  poserBrut(c, pos, col, M.mat);
  // Bords du lot : une tranche de terre sous le sol (rien ne flotte quand on regarde le bout de la halte)
  for (const zb of [-35, 35]) c.pave(x0, -1.6, zb - 0.05, x1, 0, zb + 0.05, 0x4a3c2c, M.mat, { crasse: false });

  // Le ruisseau : un ruban d'eau croupie qui suit le lit
  if (ctx.dans(-30)) {
    const pe = [];
    const ce = [];
    const w = new THREE.Color(0xffffff);
    for (let z = -35; z < 35; z += 1) {
      const a = xRuisseau(z);
      const b = xRuisseau(z + 1);
      const q = [[a - 1.75, z], [a + 1.75, z], [b - 1.75, z + 1], [b + 1.75, z + 1]];
      for (const k of [0, 2, 1, 1, 2, 3]) {
        pe.push(q[k][0], -0.95, q[k][1]);
        ce.push(w.r, w.g, w.b);
      }
    }
    poserBrut(c, pe, ce, matiereEau(0x6a8c84, 0.78));
    // Remous clairs autour des pierres
    for (let z = -33; z < 34; z += 2.3) {
      const xr = xRuisseau(z) + Math.sin(z * 3.1) * 0.9;
      c.boite(c.entre(0.4, 0.9), 0.01, 0.12, 0xdfe8e2, { x: xr, y: -0.93, z, ry: c.entre(-0.3, 0.3) }, M.lisse, { crasse: false });
      c.poser(G.ico, M.mat, PALETTE.pierre, { x: xr + 0.3, y: -0.98, z: z + 0.1, ry: z, e: [0.3, 0.16, 0.25] }, { nuance: 0.1 });
    }
    // Galets et roseaux
    for (let z = -34; z < 34; z += 1.6) {
      const xr = xRuisseau(z);
      if (c.hasard() < 0.6) gravats(c, xr + c.entre(-1.4, 1.4), z, 0.6, 4, [PALETTE.pierre, PALETTE.pierreSombre, 0x8a8478], -1.2);
      if (c.hasard() < 0.7) touffes(c, [[xr + (c.hasard() < 0.5 ? -1 : 1) * c.entre(1.6, 2.6), z, -0.7]], 0x6f8a3a);
    }
  }
}

function route(ctx) {
  const { c, x0, x1, u } = ctx;
  const M = MATS;
  const zn = ROUTE.z - ROUTE.demi;
  const zs = ROUTE.z + ROUTE.demi;
  const morceaux = [];
  if (x1 <= PONT.x0 || x0 >= PONT.x1) morceaux.push([x0, x1]);
  else {
    if (x0 < PONT.x0) morceaux.push([x0, PONT.x0]);
    if (x1 > PONT.x1) morceaux.push([PONT.x1, x1]);
  }
  const blanc = new THREE.Color(0xe8e4d8).lerp(new THREE.Color(0x8a8880), u * 0.55).getHex();
  for (const [a, b] of morceaux) {
    c.pave(a, -0.12, zn, b, 0.03, zs, 0x8f8c86, M.asphalte, { crasse: false, nuance: 0.01 });
    // Lignes de rive continues, ligne médiane en tirets (continue près du pont)
    for (const z of [zn + 0.3, zs - 0.3]) c.pave(a, 0.03, z - 0.06, b, 0.036, z + 0.06, blanc, M.mat, { crasse: false, nuance: 0.03 });
    for (let x = Math.ceil(a / 6) * 6; x < b; x += 6) {
      const pres = x > PONT.x0 - 30 && x < PONT.x1 + 30;
      const h = Math.abs(Math.sin(x * 7.1));
      if (!pres && h < u * 0.35) continue;
      c.pave(x, 0.03, ROUTE.z - 0.06, Math.min(b, x + (pres ? 6 : 3)), 0.036, ROUTE.z + 0.06, blanc, M.mat, { crasse: false, nuance: 0.03 });
    }
    // Nids-de-poule, rustines, herbes dans les fissures du bord
    for (let x = a + 2; x < b - 2; x += 7) {
      const h = Math.abs(Math.sin(x * 3.7 + 1));
      if (h < 0.35 + (1 - u) * 0.3) continue;
      flaque(c, x + h * 3, ROUTE.z + (h - 0.5) * 5, 0.4 + h * 0.6, 0.04);
    }
    for (let x = a + 1; x < b - 1; x += 1.3) {
      if (c.hasard() < 0.35 + u * 0.4) touffes(c, [[x + c.entre(-0.4, 0.4), c.hasard() < 0.5 ? zn + 0.1 : zs - 0.1, 0.03]], PALETTE.herbeSeche);
    }
  }
  // Balises de bord de route (poteaux blancs à bande noire), quelques-unes couchées
  for (let x = Math.ceil((x0 - 12.5) / 25) * 25 + 12.5; x < x1; x += 25) {
    if (x > PONT.x0 - 2 && x < PONT.x1 + 2) continue;
    for (const z of [10.4, 17.6]) {
      if (surBusage(z < ROUTE.z ? BUSAGES_N : BUSAGES_S, x)) continue;
      if (x > 14 && x < 35) continue;
      const couche = Math.abs(Math.sin(x * 1.3 + z)) < u * 0.4;
      c.repere({ x, y: couche ? 0.08 : 0, z, rz: couche ? 1.45 : 0, ry: couche ? 0.4 : 0 }, () => {
        c.pave(-0.06, 0, -0.06, 0.06, 1.0, 0.06, 0xe6e2d8, M.satin);
        c.pave(-0.065, 0.62, -0.065, 0.065, 0.8, 0.065, 0x1e1e1e, M.satin);
        c.pave(-0.07, 0.66, z < ROUTE.z ? 0.06 : -0.075, 0.07, 0.76, z < ROUTE.z ? 0.075 : -0.06, 0xd8862a, M.lisse, { crasse: false });
      });
    }
  }
  // Busages : une buse de béton qui affleure à chaque bout
  for (const [liste, zc] of [[BUSAGES_N, FOSSES[0]], [BUSAGES_S, FOSSES[1]]]) {
    for (const [a, b] of liste) {
      for (const x of [a, b]) {
        if (!ctx.dans(x)) continue;
        cyl(c, PALETTE.beton, M.mat, x, -0.25, zc, 0.36, 0.5, { rz: Math.PI / 2, ep: 0.36 }, G.cyl8);
        cyl(c, 0x2a2622, M.mat, x + (x === a ? -0.26 : 0.26), -0.25, zc, 0.26, 0.04, { rz: Math.PI / 2, ep: 0.26 }, G.cyl8);
      }
    }
  }
  // Roseaux et eau dormante dans les fossés
  for (let x = x0 + 0.5; x < x1; x += 2.2) {
    for (const [i, zc] of FOSSES.entries()) {
      if (surBusage(i === 0 ? BUSAGES_N : BUSAGES_S, x) || Math.abs(x - XB) < 5) continue;
      if (c.hasard() < 0.5) touffes(c, [[x + c.entre(-0.8, 0.8), zc + c.entre(-0.5, 0.5), -0.45]], c.hasard() < 0.5 ? 0x6f8a3a : PALETTE.herbeSeche);
      if (c.hasard() < 0.08 + u * 0.12) flaque(c, x, zc, 0.7, -0.5);
    }
  }
}

/** Un pin : fût droit, houppier de trois cônes ; la partie haute va dans une couche s'il cache un passage. */
function pin(ctx, t) {
  const { c } = ctx;
  const M = MATS;
  const { x, z, h, s } = t;
  const r = (0.12 + h * 0.017) * s;
  const coupe = Math.min(3, h * 0.4);
  const tronc = t.mort ? 0x7c746a : [0x5b4434, 0x664c38, 0x54402f][t.ton];
  cyl(c, tronc, M.mat, x, coupe / 2 - 0.2, z, r, coupe + 0.4, { ry: t.ry });
  if (t.mort) {
    const haut = h * 0.8;
    cyl(c, tronc, M.mat, x, (coupe + haut) / 2, z, r * 0.75, haut - coupe, { ry: t.ry });
    for (let i = 0; i < 4; i++) {
      const a = t.ry + i * 1.7;
      const y = h * (0.35 + i * 0.12);
      c.poutre([x, y, z], [x + Math.cos(a) * 1.3, y + 0.6, z + Math.sin(a) * 1.3], 0.07, tronc, M.mat);
    }
    return;
  }
  const k = t.cache ? ctx.canopee(z > ROUTE.z) : c;
  const haut = h * 0.85;
  cyl(k, tronc, M.mat, x, (coupe + haut) / 2, z, r * 0.8, haut - coupe, { ry: t.ry });
  const tons = [[0x2f4a33, 0x37553a, 0x41603f], [0x34502f, 0x3e5a36, 0x4a6a40], [0x2c4636, 0x355241, 0x3f5e45]][t.ton];
  const base = h * 0.45;
  for (let i = 0; i < 3; i++) {
    const rr = (2.0 - i * 0.55) * (0.65 + h / 30) * s;
    const hh = h * 0.27;
    k.poser(G.cone5, M.mat, tons[i], { x: x + Math.sin(t.ry + i) * 0.2, y: base + i * h * 0.16 + hh / 2, z: z + Math.cos(t.ry + i) * 0.2, ry: t.ry + i, e: [rr, hh, rr] }, { nuance: 0.06, crasse: false });
  }
}

function ronce(c, x, z, s) {
  const tons = [0x3e5230, 0x4b5e34, 0x55603a, 0x4a3e34];
  for (let i = 0; i < 2; i++) {
    c.poser(G.ico, MATS.mat, tons[Math.floor(c.hasard() * 4)], { x: x + c.entre(-0.4, 0.4) * s, y: s * 0.32, z: z + c.entre(-0.4, 0.4) * s, ry: c.hasard() * 3, e: [s * c.entre(0.7, 1.0), s * c.entre(0.4, 0.6), s * c.entre(0.6, 0.9)] }, { nuance: 0.08, crasse: false });
  }
}

function foret(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  for (const t of ARBRES) if (ctx.dans(t.x)) pin(ctx, t);
  // Le sous-bois : fougères, jeunes pins, souches, branches tombées
  for (const p of SOUS_BOIS) {
    if (!ctx.dans(p.x)) continue;
    if (p.k < 0.55) {
      const s = 0.45 + p.s * 0.5;
      c.poser(G.ico, M.mat, p.s < 0.5 ? 0x5f7036 : 0x7a7038, { x: p.x, y: s * 0.25, z: p.z, ry: p.s * 6, e: [s, s * 0.45, s * 0.9] }, { nuance: 0.1, crasse: false });
    } else if (p.k < 0.75) {
      ronce(c, p.x, p.z, 0.7 + p.s * 0.6);
    } else if (p.k < 0.85) {
      cyl(c, 0x6a5440, M.mat, p.x, 0.2, p.z, 0.22 + p.s * 0.12, 0.4);
    } else if (p.k < 0.93) {
      c.poutre([p.x, 0.08, p.z], [p.x + Math.cos(p.s * 6) * 2.2, 0.12, p.z + Math.sin(p.s * 6) * 2.2], 0.1, 0x6a5a48, M.mat);
    } else {
      c.poser(G.cone5, M.mat, 0x3e5a36, { x: p.x, y: 0.9, z: p.z, ry: p.s * 5, e: [0.7, 1.8, 0.7] }, { nuance: 0.06, crasse: false });
    }
  }
  // Les lisières : ronces serrées le long des bords, obstacles pour le jeu
  for (const s of BORDS) {
    const mx = (s.x1 + s.x2) / 2;
    if (!ctx.dans(mx)) continue;
    b.obstacle(s.x1, s.z1, s.x2, s.z2, s.nature);
    if (s.nature !== "forêt dense") continue;
    const lg = Math.hypot(s.x2 - s.x1, s.z2 - s.z1);
    for (let d = 0.5; d < lg; d += 1.3) {
      if (c.hasard() > 0.5 + u * 0.45) continue;
      const t = d / lg;
      const off = c.entre(0.6, 1.9);
      ronce(c, s.x1 + (s.x2 - s.x1) * t + s.nx * off, s.z1 + (s.z2 - s.z1) * t + s.nz * off, c.entre(0.6, 1.2));
    }
  }
}

// ---------- Tronçon 1 : la lisière et le Love Center ----------

function panneauRoute(ctx, r, x, z, ry, l = 1.6, h = 0.35, haut = 2.0) {
  const { c } = ctx;
  const M = MATS;
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) c.pave(s * l * 0.35 - 0.04, 0, -0.04, s * l * 0.35 + 0.04, haut + h / 2, 0.04, 0x8d969a, M.metal);
    c.pave(-l / 2 - 0.03, haut - h / 2 - 0.03, -0.05, l / 2 + 0.03, haut + h / 2 + 0.03, -0.02, 0xd8d8d0, M.tole);
    affiche(c, M.enseignes, r, { y: haut, z: 0.001 }, l, h);
  });
}

function loveCenter(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  const { x0: X0, x1: X1, z0: Z0, z1: Z1, h: H, front: HF } = LOVE;
  const k = b.couche("love-center", { x: (X0 + X1) / 2, z: (Z0 + Z1) / 2, l: X1 - X0 + 0.8, p: Z1 - Z0 + 1.2 }, 1.15, HF + 0.3);
  const facade = 0x4a2f3d;
  const cote = 0xb9ad98;
  const dedans = { couleur: 0x94707e, mat: M.mat };
  // Sol : lino rose sale
  c.pave(X0, 0, Z0, X1, 0.03, Z1, 0xb08e94, M.satin, { crasse: false, nuance: 0.02 });
  for (let i = 0; i < 10; i++) c.boite(c.entre(0.5, 1.6), 0.005, c.entre(0.4, 1.2), 0x5e4a44, { x: c.entre(X0 + 1, X1 - 1), y: 0.033, z: c.entre(Z0 + 1, Z1 - 1), ry: c.hasard() * 3 }, M.mat, { crasse: false });
  // Façade sud (fausse façade haute), coupée à hauteur d'allège
  murCoupe(ctx, k, [X0, Z1], [X1, Z1], {
    h: HF,
    ep: 0.25,
    couleur: facade,
    interieur: dedans,
    ouvertures: [
      { u: 3.4, l: 5, bas: 0.45, haut: 2.6 },
      { u: 8.5, l: 1.6, bas: 0, haut: 2.3 },
      { u: 12.6, l: 4.4, bas: 0.45, haut: 2.6 },
    ],
  });
  b.obstacle(X0 + 0.9, Z1, X0 + 5.9, Z1, "vitrine");
  b.obstacle(X0 + 10.4, Z1, X0 + 14.8, Z1, "vitrine");
  // Couronnement de la fausse façade
  k.pave(X0 - 0.15, HF, Z1 - 0.2, X1 + 0.15, HF + 0.18, Z1 + 0.25, 0x2c1c26, M.satin);
  // Flanc est (bardage), coupé lui aussi ; le bandeau peint en haut
  murCoupe(ctx, k, [X1, Z1], [X1, Z0], { h: H, ep: 0.2, couleur: cote, interieur: dedans });
  affiche(k, M.enseignes, R.loveBandeau, { x: X1 + 0.11, y: 2.55, z: (Z0 + Z1) / 2, ry: Math.PI / 2 }, 7.2, 0.84);
  // Nord et ouest : pleins
  mur(c, [X1, Z0], [X0, Z0], { h: H, ep: 0.2, couleur: cote, batiment: b, interieur: dedans, ouvertures: [{ u: 13, l: 1.0, bas: 0, haut: 2.1, type: "vide" }] });
  battant(c, X0 + 3.5, Z0 - 0.1, 2.2, 0.95, 2.05, 0x6a6a64, M.tole);
  mur(c, [X0, Z0], [X0, Z1], { h: H, ep: 0.2, couleur: cote, batiment: b, interieur: dedans });
  // Toit plat et acrotère
  k.pave(X0 - 0.1, H, Z0 - 0.1, X1 + 0.1, H + 0.2, Z1, 0x6e6a63, M.tole);
  k.pave(X0 - 0.1, H + 0.2, Z0 - 0.1, X1 + 0.1, H + 0.45, Z0 + 0.1, 0xb0a490, M.mat);
  mousse(k, X0 + 4, H + 0.2, Z0 + 3, 1.6, 6 + Math.round(u * 6));
  cyl(k, 0x8d969a, M.metal, X0 + 12, H + 0.6, Z0 + 2, 0.25, 0.8);
  // Le néon de façade (s'efface avec la façade)
  affiche(k, M.neon, R.loveNeon, { x: (X0 + X1) / 2, y: 3.55, z: Z1 + 0.16 }, 6.6, 1.29);
  // Vitres des vitrines : la gauche brisée, la droite fêlée
  k.pave(X0 + 1.0, 1.15, Z1 - 0.01, X0 + 5.8, 2.6, Z1 + 0.01, 0xffffff, M.verre, { crasse: false });
  c.pave(X0 + 10.5, 0.45, Z1 - 0.01, X0 + 14.7, 1.15, Z1 + 0.01, 0x3a2a34, M.verre, { crasse: false });
  k.pave(X0 + 10.5, 1.15, Z1 - 0.01, X0 + 14.7, 2.6, Z1 + 0.01, 0x3a2a34, M.verre, { crasse: false });
  for (let i = 0; i < 4; i++) c.boite(c.entre(0.1, 0.3), 0.01, c.entre(0.1, 0.2), 0xb8c8cc, { x: c.entre(X0 + 1, X0 + 5.8), y: 0.04, z: Z1 + c.entre(0.2, 1.4), ry: c.hasard() * 3 }, M.lisse, { crasse: false });
  // Rideaux de fer : coffres ; la gauche levée, la droite descendue jusqu'à 0,9 m et tordue, la porte forcée
  for (const [a, l] of [[X0 + 0.9, 5.2], [X0 + 7.7, 1.6], [X0 + 10.4, 4.6]]) k.pave(a - 0.05, 2.62, Z1 + 0.1, a + l + 0.05, 2.95, Z1 + 0.42, 0x8d969a, M.tole);
  for (let y = 0.95; y < 2.62; y += 0.24) {
    const y2 = Math.min(y + 0.22, 2.62);
    if (y < 1.15) c.pave(X0 + 10.45, y, Z1 + 0.22, X0 + 14.95, Math.min(y2, 1.15), Z1 + 0.26, 0x9aa0a2, M.tole, { nuance: 0.05 });
    if (y2 > 1.15) k.pave(X0 + 10.45, Math.max(y, 1.15), Z1 + 0.22, X0 + 14.95, y2, Z1 + 0.26, 0x9aa0a2, M.tole, { nuance: 0.05 });
  }
  c.boite(1.3, 0.5, 0.04, 0x9aa0a2, { x: X0 + 11.2, y: 0.75, z: Z1 + 0.45, rx: -0.7 }, M.tole);
  c.pave(X0 + 7.75, 0, Z1 + 0.2, X0 + 9.25, 0.25, Z1 + 0.25, 0x8a8f90, M.tole);
  battant(c, X0 + 7.75, Z1 - 0.12, -1.2, 1.5, 2.25, 0x2a2228, M.satin);
  // La vitrine gauche : bustes de couture en lingerie sur un podium, l'affiche des soldes
  c.pave(X0 + 0.4, 0, Z1 - 1.1, X0 + 6.4, 0.42, Z1 - 0.15, 0x2a1824, M.satin);
  for (const [bx, rot, haut] of [[X0 + 1.8, 0.3, 1], [X0 + 3.4, -0.2, 0], [X0 + 5.0, 0.1, 1]]) {
    c.repere({ x: bx, y: 0.42, z: Z1 - 0.6, ry: rot }, () => {
      c.pave(-0.15, 0, -0.15, 0.15, 0.04, 0.15, 0x1a1a1a, M.metal);
      cyl(c, 0x1a1a1a, M.metal, 0, 0.5, 0, 0.025, 1.0);
      c.poser(G.sph, M.satin, 0xe2d6c6, { y: 1.35, e: [0.2, 0.34, 0.14] });
      c.poser(G.sph, M.satin, 0xe2d6c6, { y: 1.02, e: [0.19, 0.16, 0.13] });
      // Lingerie : guêpière ou ensemble (des pièces de tissu, rien d'autre)
      if (haut) c.poser(G.sph, M.toile, [0x7a1a2a, 0x1a1418][bx > X0 + 4 ? 1 : 0], { y: 1.33, e: [0.207, 0.22, 0.147] });
      else {
        c.boite(0.36, 0.09, 0.05, 0x1a1418, { y: 1.47, z: 0.11 }, M.toile);
        c.boite(0.3, 0.1, 0.05, 0x1a1418, { y: 1.0, z: 0.12 }, M.toile);
      }
      c.boite(0.02, 0.22, 0.02, 0x1a1418, { x: -0.1, y: 1.6, z: 0.08 }, M.toile);
      c.boite(0.02, 0.22, 0.02, 0x1a1418, { x: 0.1, y: 1.6, z: 0.08 }, M.toile);
    });
  }
  affiche(k, M.enseignes, R.vitrine, { x: X0 + 5.3, y: 1.75, z: Z1 - 0.05 }, 0.7, 1.05);
  // La vitrine droite : étagères de boîtes (on les devine sous le rideau)
  affiche(c, M.enseignes, R.jouets, { x: X0 + 12.6, y: 0.95, z: Z1 - 0.6 }, 0.85, 1.28);
  c.pave(X0 + 10.6, 0, Z1 - 0.8, X0 + 14.6, 0.35, Z1 - 0.2, 0x2a1824, M.satin);
  for (let i = 0; i < 9; i++) c.boite(0.25, 0.32, 0.12, [0xe88fb8, 0x7a5a90, 0xc8362b, 0x2f6f73][i % 4], { x: X0 + 10.9 + i * 0.42, y: 0.51, z: Z1 - 0.45, ry: c.entre(-0.2, 0.2) }, M.satin, { crasse: false });
  // Le distributeur discret, contre la façade
  c.repere({ x: X0 + 10.0, y: 0, z: Z1 + 0.5, ry: 0 }, () => {
    c.pave(-0.42, 0, -0.32, 0.42, 1.85, 0.32, 0x3a3238, M.tole);
    affiche(c, M.enseignes, R.distrib, { y: 1.2, z: 0.325 }, 0.7, 1.05);
    c.pave(-0.3, 0.25, 0.32, 0.3, 0.45, 0.36, 0x1a1a1a, M.metal);
  });
  obstacleBoite(b, X0 + 10, Z1 + 0.5, 0.84, 0.64, 0, "distributeur");

  // Dedans : gondoles, portant de lingerie, comptoir-caisse
  gondole(ctx, X0 + 1.4, X0 + 5.6, -1.1, 0.7);
  gondole(ctx, X0 + 5.4, X0 + 8.2, -4.6, 0.6);
  // Portant
  c.poutre([X0 + 0.7, 1.6, -2.9], [X0 + 0.7, 1.6, 0.7], 0.04, 0x9a9a92, M.metal);
  for (const z of [-2.9, 0.7]) c.poutre([X0 + 0.7, 0, z], [X0 + 0.7, 1.6, z], 0.04, 0x9a9a92, M.metal);
  for (let z = -2.7; z < 0.6; z += 0.32) {
    if (c.hasard() < 0.2) continue;
    const coul = [0x7a1a2a, 0x1a1418, 0xd6407e, 0xc79a3b, 0xe9dfc6][Math.floor(c.hasard() * 5)];
    c.boite(0.04, c.entre(0.5, 0.9), 0.36, coul, { x: X0 + 0.7, y: 1.58 - 0.35, z, ry: c.entre(-0.3, 0.3) }, M.toile, { nuance: 0.06, crasse: false });
  }
  // Quelques pièces tombées
  for (let i = 0; i < 4; i++) c.boite(0.4, 0.02, 0.3, [0x7a1a2a, 0x1a1418, 0xd6407e][i % 3], { x: X0 + 1.4 + c.hasard(), y: 0.04, z: c.entre(-2.4, 0.2), ry: c.hasard() * 3 }, M.toile, { crasse: false });
  // Comptoir
  c.pave(X1 - 6.9, 0, -2.6, X1 - 6.25, 1.0, 0.4, 0x2a1824, M.satin);
  c.pave(X1 - 7.0, 1.0, -2.7, X1 - 6.15, 1.06, 0.5, 0xb8963e, M.lisse);
  c.boite(0.4, 0.22, 0.35, 0x3a3a3a, { x: X1 - 6.55, y: 1.17, z: -1.4, ry: 0.3 }, M.satin);
  cyl(c, 0xe88fb8, M.lisse, X1 - 6.55, 1.1, -0.2, 0.12, 0.08);
  // Réserve (cartons, palette)
  mur(c, [X0 + 5, Z0], [X0 + 5, -3], { h: 2.4, ep: 0.12, couleur: 0xa89c88, batiment: b });
  mur(c, [X0, -3], [X0 + 5, -3], { h: 2.4, ep: 0.12, couleur: 0xa89c88, batiment: b, ouvertures: [{ u: 3.5, l: 0.9, bas: 0, haut: 2.05, type: "vide" }] });
  c.pave(X0 + 0.4, 0, Z0 + 0.4, X0 + 1.6, 0.14, Z0 + 1.6, PALETTE.bois, M.mat);
  for (let i = 0; i < 9; i++) {
    const s = c.entre(0.35, 0.6);
    c.boite(s, s * 0.8, s, 0xb08f62, { x: X0 + 0.6 + (i % 3) * 0.55 + c.entre(-0.1, 0.1), y: 0.14 + Math.floor(i / 3) * 0.42 + s * 0.4, z: Z0 + 0.7 + c.entre(-0.1, 0.4), ry: c.entre(-0.3, 0.3) }, M.mat, { nuance: 0.06 });
  }
  for (let i = 0; i < 4; i++) c.boite(0.5, 0.35, 0.4, 0xb08f62, { x: X0 + 2.6 + i * 0.6, y: 0.18, z: Z0 + 1.2 + c.hasard(), ry: c.hasard() }, M.mat);
  // Cloison des cabines vidéo et cabines
  mur(c, [X1 - 6, Z1], [X1 - 6, Z0], { h: 2.4, ep: 0.12, couleur: 0x3a2a34, batiment: b, ouvertures: [{ u: 6.6, l: 1.0, bas: 0, haut: 2.1, type: "vide" }] });
  affiche(c, M.enseignes, R.cabines, { x: X1 - 6.07, y: 2.12, z: -4.6, ry: -Math.PI / 2 }, 0.9, 0.45);
  mur(c, [X1 - 4.6, 1.8], [X1 - 4.6, Z0], { h: 2.3, ep: 0.1, couleur: 0x2a1e26, batiment: b, ouvertures: [{ u: 1.3, l: 0.8, bas: 0, haut: 2.0, type: "vide" }, { u: 3.9, l: 0.8, bas: 0, haut: 2.0, type: "vide" }, { u: 6.5, l: 0.8, bas: 0, haut: 2.0, type: "vide" }] });
  for (const z of [-3.4, -0.8]) mur(c, [X1 - 4.6, z], [X1 - 0.1, z], { h: 2.3, ep: 0.08, couleur: 0x2a1e26, batiment: b });
  for (const [i, zc] of [[0, -4.7], [1, -2.1], [2, 0.5]]) {
    // Tabouret, écran, monnayeur, boîte de mouchoirs, rideau
    cyl(c, 0x1a1a1a, M.metal, X1 - 2.6, 0.25, zc, 0.04, 0.5);
    cyl(c, 0x7a2630, M.satin, X1 - 2.6, 0.52, zc, 0.2, 0.08, {}, G.cyl8);
    c.pave(X1 - 0.6, 0.8, zc - 0.45, X1 - 0.3, 1.0, zc + 0.45, 0x2a2a2a, M.satin);
    c.pave(X1 - 0.38, 1.05, zc - 0.4, X1 - 0.3, 1.6, zc + 0.4, 0x101418, M.lisse);
    c.pave(X1 - 0.5, 1.0, zc + 0.5, X1 - 0.3, 1.25, zc + 0.65, 0x8a8a84, M.metal);
    c.boite(0.22, 0.1, 0.12, 0xe9e6dc, { x: X1 - 0.45, y: 1.05, z: zc - 0.25 }, M.mat, { crasse: false });
    for (let j = 0; j < 3; j++) c.poser(G.ico, M.mat, 0xe9e6dc, { x: X1 - c.entre(1.2, 2.6), y: 0.05, z: zc + c.entre(-0.7, 0.7), e: [0.06, 0.04, 0.05] }, { crasse: false });
    if (i !== 1) c.boite(0.03, 1.8, 0.75, 0x7a1a2a, { x: X1 - 4.68, y: 1.05, z: zc + 0.1, rz: 0.04 }, M.toile, { crasse: false });
  }
  // La veilleuse rouge du couloir
  c.boite(0.18, 0.1, 0.1, 0xff3030, { x: X1 - 5.3, y: 2.25, z: -1.5 }, M.ampoules, { crasse: false, nuance: 0 });
  // DVD et boîtes épars, gravats du faux plafond
  for (let i = 0; i < 18; i++) c.boite(0.14, 0.015, 0.19, [0x1a1418, 0xd6407e, 0x2f2a52, 0xe9dfc6][i % 4], { x: c.entre(X0 + 1, X1 - 7), y: 0.04, z: c.entre(Z0 + 1, Z1 - 1.3), ry: c.hasard() * 3 }, M.satin, { crasse: false });
  debris(c, X0 + 1, Z0 + 3.2, X1 - 7, Z1 - 1.3, Math.round(10 + u * 20));

  // Le totem au bord de la route
  c.repere({ x: -58.2, y: 0, z: 6.4, ry: 0.6 }, () => {
    for (const s of [-1, 1]) c.pave(s * 1.0 - 0.1, 0, -0.1, s * 1.0 + 0.1, 5.0, 0.1, 0x3a3238, M.tole);
    c.pave(-1.7, 4.3, -0.18, 1.7, 5.75, 0.18, 0x2c1c26, M.satin);
    affiche(c, M.neon, R.loveNeon, { y: 5.05, z: 0.19 }, 3.2, 0.62);
    affiche(c, M.neon, R.loveNeon, { y: 5.05, z: -0.19, ry: Math.PI }, 3.2, 0.62);
    c.pave(-0.6, 3.4, -0.08, 0.6, 4.1, 0.08, 0xe9dfc6, M.tole);
    affiche(c, M.enseignes, R.coeur, { y: 3.75, z: 0.09 }, 0.6, 0.6);
    c.boite(0.6, 0.6, 0.3, 0x3a3a3a, { y: 0.3 }, M.tole);
  });
  // La cour : voiture rose de la gérante, chariot renversé
  epave(c, -61.5, 3.6, 0.25, 0xc77a9a, { portiere: true });
  obstacleBoite(b, -61.5, 3.6, 4.4, 1.8, 0.25, "épave");
  c.repere({ x: -66, y: 0.3, z: 5.5, rz: 1.4, ry: 0.5 }, () => {
    c.pave(-0.45, 0, -0.3, 0.45, 0.6, 0.3, 0x9aa0a2, M.metal);
  });
  // Les bouts de lisière : sacs, canettes, emballages
  emballages(c, -66, 4.5, 3.5, 10);
  // Le coin des routiers (derrière)
  matelas(c, -75, -21.5, 0.4, 1.9, 1.4, 0xb8ad8c);
  chaisePlastique(c, -73.2, -19.8, 2.3);
  chaisePlastique(c, -76.6, -19.4, -2.4, 0xe6e2d8, true);
  c.pave(-74.2, 0, -23.6, -73.6, 0.4, -23.1, 0x2f6f73, M.satin);
  canettes(c, -74.6, -20.6, 1.6, 8);
  jonchee(c, -78, -24, -71, -17, Math.round(20 + u * 30));
}

function gondole(ctx, x0, x1, z, prof) {
  const { c } = ctx;
  const M = MATS;
  c.pave(x0, 0, z - prof / 2, x1, 0.12, z + prof / 2, 0x2a1e26, M.satin);
  c.pave(x0, 0.12, z - 0.03, x1, 1.5, z + 0.03, 0xd8d2cc, M.tole);
  for (const y of [0.5, 0.9, 1.3]) for (const s of [-1, 1]) c.pave(x0, y - 0.02, z + s * 0.03, x1, y, z + (s * prof) / 2, 0xcfc9c2, M.tole);
  const tons = [0xc8362b, 0xe88fb8, 0x2a2a2a, 0x7a5a90, 0xe9dfc6, 0x2f6f73, 0xd8c040];
  for (let i = 0; i < 26; i++) {
    if (c.hasard() < 0.3) continue;
    const s = c.hasard() < 0.5 ? -1 : 1;
    const y = [0.5, 0.9, 1.3][Math.floor(c.hasard() * 3)];
    const x = c.entre(x0 + 0.1, x1 - 0.1);
    const zz = z + s * c.entre(0.08, prof / 2 - 0.06);
    if (c.hasard() < 0.35) cyl(c, tons[Math.floor(c.hasard() * 7)], M.lisse, x, y + 0.09, zz, 0.035, 0.18);
    else c.boite(c.entre(0.08, 0.2), c.entre(0.08, 0.22), 0.06, tons[Math.floor(c.hasard() * 7)], { x, y: y + 0.07, z: zz, ry: c.entre(-0.3, 0.3) }, M.satin, { crasse: false });
  }
  for (let i = 0; i < 6; i++) c.boite(0.14, 0.1, 0.06, tons[i % 7], { x: c.entre(x0, x1), y: 0.05, z: z + (c.hasard() < 0.5 ? -1 : 1) * c.entre(0.5, 1.0), ry: c.hasard() * 3 }, M.satin, { crasse: false });
}

/** Préservatifs et emballages éparpillés (des carrés de papier métallisé, des anneaux pâles). */
function emballages(c, x, z, r, n) {
  const M = MATS;
  for (let i = 0; i < n; i++) {
    const a = c.hasard() * 6.28;
    const d = Math.sqrt(c.hasard()) * r;
    const px = x + Math.cos(a) * d;
    const pz = z + Math.sin(a) * d;
    if (c.hasard() < 0.6) c.boite(0.07, 0.006, 0.07, [0xc8362b, 0xc79a3b, 0x2f4f8a, 0x1a1a1a, 0xd6407e][Math.floor(c.hasard() * 5)], { x: px, y: 0.012, z: pz, ry: c.hasard() * 3 }, M.metal, { crasse: false, nuance: 0.05 });
    else c.poser(G.tore, M.satin, 0xd8cfa8, { x: px, y: 0.012, z: pz, rx: Math.PI / 2, e: [0.025, 0.025, 0.012] }, { crasse: false });
  }
}

function canettes(c, x, z, r, n) {
  for (let i = 0; i < n; i++) cyl(c, [0xc8362b, 0x2f6f73, 0xc0c4c6, 0xc79a3b][i % 4], MATS.metal, x + c.entre(-r, r), 0.035, z + c.entre(-r, r), 0.035, 0.12, { rz: Math.PI / 2, ry: c.hasard() * 3 });
}

function lisiere(ctx) {
  const { c, b } = ctx;
  const M = MATS;
  panneauRoute(ctx, R.ouest, -96, 10.45, 0.6);
  panneauRoute(ctx, R.aire500, -84, 17.55, 0.6);
  loveCenter(ctx);
  // La poche sud-ouest : une voiture brûlée poussée dans les pins, des pneus
  epave(c, -89.5, 23.5, 1.2, 0x000000, { brule: true });
  obstacleBoite(b, -89.5, 23.5, 4.4, 1.8, 1.2, "épave");
  for (let i = 0; i < 3; i++) cyl(c, 0x222222, M.mat, -91.8, 0.12 + i * 0.24, 21.6, 0.36, 0.22, {}, G.cyl8);
  jonchee(c, -93, 20.6, -86, 26, 30);
}

// ---------- Tronçon 2 : le pont et la cabane d'observation ----------

function pontDeBois(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  const { x0: xa, x1: xb, z0: za, z1: zb } = PONT;
  const bois = 0x7a6450;
  // Culées en pierre
  for (const [p, q] of [[xa - 0.2, xa + 1.1], [xb - 1.1, xb + 0.2]]) {
    c.pave(p, -1.5, za - 0.6, q, -0.05, zb + 0.6, PALETTE.pierre, M.mat, { nuance: 0.05 });
    for (let i = 0; i < 6; i++) c.boite(c.entre(0.3, 0.7), 0.3, 0.05, PALETTE.pierreSombre, { x: c.entre(p + 0.2, q - 0.2), y: c.entre(-1.3, -0.4), z: za - 0.62 }, M.mat, { crasse: false });
    mousse(c, (p + q) / 2, -0.06, za - 0.3, 0.6, 4);
  }
  // Longerons, pile et chevêtre
  for (const z of [12.3, 14, 15.7]) c.pave(xa + 0.6, -0.45, z - 0.16, xb - 0.6, -0.1, z + 0.16, PALETTE.boisSombre, M.mat);
  for (const z of [12.3, 15.7]) cyl(c, PALETTE.boisSombre, M.mat, XB, -1.0, z, 0.16, 1.1);
  c.pave(XB - 0.2, -0.65, za + 0.1, XB + 0.2, -0.45, zb - 0.1, PALETTE.boisSombre, M.mat);
  c.poutre([XB, -1.4, 12.3], [XB, -0.5, 15.7], 0.1, PALETTE.boisSombre, M.mat);
  // Tablier en planches (quelques-unes manquent)
  for (let x = xa + 0.15; x < xb - 0.1; x += 0.3) {
    const h = Math.abs(Math.sin(x * 9.7));
    if (x > xa + 1.5 && x < xb - 1.5 && h < u * 0.07) continue;
    c.pave(x - 0.135, -0.09, za + 0.05, x + 0.135, 0.03, zb - 0.05, [bois, 0x8a7a64, 0x6e5a46][Math.floor(h * 3)], M.mat, { nuance: 0.04, crasse: false });
  }
  // Chasse-roues et garde-corps (une travée arrachée côté sud)
  for (const z of [za + 0.2, zb - 0.2]) c.pave(xa + 0.3, 0.03, z - 0.1, xb - 0.3, 0.22, z + 0.1, PALETTE.boisSombre, M.mat);
  for (const z of [za + 0.05, zb - 0.05]) {
    const sud = z > ROUTE.z;
    const n = 6;
    const pas = (xb - xa - 0.6) / n;
    for (let i = 0; i <= n; i++) {
      const x = xa + 0.3 + i * pas;
      if (sud && u > 0.45 && i === 3) continue;
      c.pave(x - 0.07, 0, z - 0.07, x + 0.07, 1.1, z + 0.07, bois, M.mat);
    }
    for (let i = 0; i < n; i++) {
      const p = xa + 0.3 + i * pas;
      const q = p + pas;
      if (sud && u > 0.45 && (i === 2 || i === 3)) continue;
      c.pave(p, 1.0, z - 0.06, q, 1.12, z + 0.06, bois, M.mat, { nuance: 0.05 });
      c.pave(p, 0.55, z - 0.04, q, 0.63, z + 0.04, bois, M.mat, { nuance: 0.05 });
      c.poutre([p + 0.08, 0.2, z], [q - 0.08, 0.98, z], 0.06, bois, M.mat);
    }
    if (sud && u > 0.45) {
      // La lisse arrachée pend vers le ruisseau
      c.poutre([xa + 0.3 + 2 * pas, 1.0, z], [xa + 0.3 + 3.2 * pas, -0.8, z + 0.6], 0.1, bois, M.mat);
      c.poutre([xa + 0.3 + 3 * pas, 0.4, z + 0.3], [xa + 0.3 + 3.6 * pas, -0.9, z + 1.0], 0.12, bois, M.mat);
    }
  }
  // Panneaux « pont étroit »
  for (const [x, z] of [[xa - 2.5, 17.6], [xb + 2.5, 10.4]]) {
    c.pave(x - 0.04, 0, z - 0.04, x + 0.04, 2.2, z + 0.04, 0x8d969a, M.metal);
    affiche(c, M.enseignes, R.pont, { x, y: 2.25, z: z + 0.05, ry: 0.6 }, 0.7, 0.7);
  }
  // Le vieux barrage : sacs de sable et palettes au bout est
  for (let i = 0; i < 9; i++) {
    const rang = Math.floor(i / 5);
    c.poser(G.ico, M.toile, 0xb0a07a, { x: xb + 0.7 + (i % 5) * 0.55 + rang * 0.27, y: 0.17 + rang * 0.28, z: 10.95, ry: c.hasard(), e: [0.3, 0.16, 0.22] }, { nuance: 0.06 });
  }
  b.obstacle(xb + 0.5, 10.95, xb + 3.3, 10.95, "sacs de sable");
  for (let i = 0; i < 2; i++) c.repere({ x: xb + 1.4 + i * 0.3, y: 0.6, z: 16.9, rx: 1.35 - i * 0.1, ry: 0.2 }, () => {
    for (let k = 0; k < 5; k++) c.pave(-0.6, -0.4 + k * 0.2, -0.02, 0.6, -0.3 + k * 0.2, 0.02, 0xa08a62, M.mat);
  });
}

function cabaneObservation(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = CABANE;
  const planche = 0x7d6a52;
  const k = b.couche("cabane", { x: (X0 + X1) / 2, z: (Z0 + Z1) / 2, l: X1 - X0 + 1, p: Z1 - Z0 + 1 }, 1.15, 3.2);
  c.pave(X0, 0, Z0, X1, 0.06, Z1, 0x6e5a46, M.mat, { crasse: false });
  murCoupe(ctx, k, [X0, Z1], [X1, Z1], { h: 2.35, ep: 0.12, couleur: planche, ouvertures: [{ u: 2.75, l: 3.2, bas: 1.3, haut: 1.55 }] });
  murCoupe(ctx, k, [X1, Z1], [X1, Z0], { h: 2.4, ep: 0.12, couleur: planche, ouvertures: [{ u: 1.2, l: 0.9, bas: 0, haut: 2.05 }] });
  mur(c, [X1, Z0], [X0, Z0], { h: 2.85, ep: 0.12, couleur: planche, batiment: b });
  mur(c, [X0, Z0], [X0, Z1], { h: 2.6, ep: 0.12, couleur: planche, batiment: b, ouvertures: [{ u: 2.25, l: 3.2, bas: 1.3, haut: 1.55, type: "vide" }] });
  // Couvre-joints verticaux (bas et haut séparés pour les faces qui s'effacent)
  for (let x = X0 + 0.25; x < X1; x += 0.5) {
    c.pave(x - 0.03, 0, Z1 + 0.06, x + 0.03, 1.15, Z1 + 0.09, 0x6a5a46, M.mat);
    k.pave(x - 0.03, 1.15, Z1 + 0.06, x + 0.03, 2.3, Z1 + 0.09, 0x6a5a46, M.mat);
    c.pave(x - 0.03, 0, Z0 - 0.09, x + 0.03, 2.8, Z0 - 0.06, 0x6a5a46, M.mat);
  }
  for (let z = Z0 + 0.25; z < Z1; z += 0.5) {
    c.pave(X0 - 0.09, 0, z - 0.03, X0 - 0.06, 2.55, z + 0.03, 0x6a5a46, M.mat);
    if (Math.abs(z - (Z1 - 1.2)) > 0.5) {
      c.pave(X1 + 0.06, 0, z - 0.03, X1 + 0.09, 1.15, z + 0.03, 0x6a5a46, M.mat);
      k.pave(X1 + 0.06, 1.15, z - 0.03, X1 + 0.09, 2.35, z + 0.03, 0x6a5a46, M.mat);
    }
  }
  battant(c, X1 + 0.06, Z1 - 0.75, -1.9, 0.88, 2.0, 0x6a5a46, M.mat);
  // Toit monopente en tôle ondulée et filet de camouflage
  const pente = Math.atan2(0.6, Z1 - Z0 + 0.6);
  k.boite(X1 - X0 + 0.6, 0.06, Z1 - Z0 + 0.9, 0x8a7a68, { x: (X0 + X1) / 2, y: 2.6, z: (Z0 + Z1) / 2, rx: pente }, M.tole);
  for (let i = 0; i < 5; i++) k.boite(c.entre(0.6, 1.4), 0.07, c.entre(0.6, 1.4), 0x7a5440, { x: c.entre(X0 + 0.5, X1 - 0.5), y: 2.62, z: c.entre(Z0 + 0.5, Z1 - 0.5), rx: pente }, M.mat, { crasse: false, nuance: 0.1 });
  for (let i = 0; i < 6; i++) k.boite(c.entre(1, 2), 0.03, c.entre(1, 2.2), [0x4a5a34, 0x5a5a3a, 0x3e4a2c][i % 3], { x: c.entre(X0, X1), y: 2.7, z: c.entre(Z0, Z1), rx: pente + c.entre(-0.1, 0.1), ry: c.hasard() }, M.toile, { crasse: false });
  // Dedans : banc sous la meurtrière, chaises de jardin tournées vers le pont, étagère, lit de camp, lanterne
  c.pave(X0 + 0.15, 0.42, Z0 + 0.4, X0 + 0.6, 0.48, Z1 - 0.4, PALETTE.bois, M.mat);
  for (const z of [Z0 + 0.6, Z1 - 0.6]) c.pave(X0 + 0.3, 0, z - 0.04, X0 + 0.45, 0.42, z + 0.04, PALETTE.bois, M.mat);
  chaisePlastique(c, X0 + 1.5, -6.9, -Math.PI / 2 - 0.3);
  chaisePlastique(c, X0 + 2.6, Z1 - 0.9, Math.PI - 0.5, 0x5a6a46);
  c.pave(X0 + 1, 1.3, Z0 + 0.12, X0 + 3.6, 1.34, Z0 + 0.45, PALETTE.bois, M.mat);
  cyl(c, 0x2f6f3a, M.satin, X0 + 1.3, 1.5, Z0 + 0.3, 0.06, 0.32);
  for (const s of [-1, 1]) cyl(c, 0x1a1a1a, M.satin, X0 + 2.1 + s * 0.06, 1.41, Z0 + 0.3, 0.04, 0.14, { rx: Math.PI / 2 });
  c.boite(0.2, 0.03, 0.28, 0x8a3a2a, { x: X0 + 2.8, y: 1.36, z: Z0 + 0.3, ry: 0.2 }, M.mat);
  affiche(c, M.enseignes, R.charte, { x: X0 + 2.4, y: 1.95, z: Z0 + 0.075 }, 0.95, 0.65);
  c.pave(X1 - 2.0, 0.35, Z0 + 0.15, X1 - 0.2, 0.42, Z0 + 0.85, 0x4a5a34, M.toile);
  for (const x of [X1 - 1.9, X1 - 0.3]) c.pave(x - 0.03, 0, Z0 + 0.15, x + 0.03, 0.35, Z0 + 0.85, 0x3a3a3a, M.metal);
  c.pave(X1 - 1.4, 0.42, Z0 + 0.2, X1 - 0.6, 0.5, Z0 + 0.8, 0x5a6a46, M.toile);
  // Lanterne au crochet
  c.pave(X1 - 2.3, 1.62, Z0 + 0.12, X1 - 2.2, 1.66, Z0 + 0.3, 0x3a3a3a, M.metal);
  cyl(c, 0x3a3a3a, M.metal, X1 - 2.25, 1.5, Z0 + 0.32, 0.08, 0.04);
  cyl(c, 0xffc070, M.ampoules, X1 - 2.25, 1.38, Z0 + 0.32, 0.06, 0.18);
  cyl(c, 0x3a3a3a, M.metal, X1 - 2.25, 1.26, Z0 + 0.32, 0.08, 0.05);
  // L'écriteau sur poteaux, près de la porte
  c.repere({ x: X1 + 1.2, y: 0, z: Z1 + 0.6, ry: 0.7 }, () => {
    for (const s of [-1, 1]) c.pave(s * 0.8 - 0.05, 0, -0.05, s * 0.8 + 0.05, 2.0, 0.05, PALETTE.boisSombre, M.mat);
    affiche(c, M.enseignes, R.cabane, { y: 1.7, z: 0.06 }, 2.0, 0.5);
  });
  // Le mirador (point de vue, échelle cassée : inaccessible)
  c.repere({ x: -24.2, y: 0, z: -1.6, ry: 0.4 }, () => {
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.poutre([sx * 0.9, 0, sz * 0.9], [sx * 0.55, 3.2, sz * 0.55], 0.12, PALETTE.boisSombre, M.mat);
    c.pave(-0.7, 3.2, -0.7, 0.7, 3.3, 0.7, PALETTE.bois, M.mat);
    for (const [p, q] of [[[-0.7, -0.7], [0.7, -0.7]], [[0.7, -0.7], [0.7, 0.7]], [[-0.7, -0.7], [-0.7, 0.7]]]) c.poutre([p[0], 4.0, p[1]], [q[0], 4.0, q[1]], 0.06, PALETTE.bois, M.mat);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.poutre([sx * 0.68, 3.3, sz * 0.68], [sx * 0.68, 4.0, sz * 0.68], 0.06, PALETTE.bois, M.mat);
    c.pave(-0.6, 3.3, -0.65, 0.6, 3.7, -0.55, 0x4a5a34, M.toile);
    // Échelle : il manque les barreaux du bas
    for (const s of [-1, 1]) c.poutre([s * 0.25, 0, 2.0], [s * 0.25, 3.2, 0.7], 0.07, PALETTE.bois, M.mat);
    for (let i = 4; i < 9; i++) if (i !== 6) c.poutre([-0.25, i * 0.36, 2.0 - i * 0.145], [0.25, i * 0.36, 2.0 - i * 0.145], 0.04, PALETTE.bois, M.mat);
  });
  // Balises solaires le long du sentier (l'Abondance : « balisage connecté »)
  for (const [x, z] of [[-9.2, 5.5], [-10.5, 2.5], [-12.2, -0.3], [-13.6, -2.4]]) {
    cyl(c, 0x2a2a2a, M.metal, x, 0.25, z, 0.025, 0.5);
    cyl(c, 0xcfe6ff, M.ampoules, x, 0.55, z, 0.06, 0.1);
  }
  debris(c, X0 + 0.5, Z0 + 0.5, X1 - 0.5, Z1 - 0.5, Math.round(6 + u * 10), [0x9c7a45, 0x7d6143, 0xe9dfc6]);
  jonchee(c, -24, -11, -8, 1, Math.round(30 + u * 40));
}

function pont(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  pontDeBois(ctx);
  cabaneObservation(ctx);
  // L'épave dans le fossé nord (couvert à l'ouest du pont)
  epave(c, -42.5, 8.9, 0.15, 0x6a7a62, { y: -0.25, rx: 0.12, rz: -0.08, portiere: true });
  obstacleBoite(b, -42.5, 8.9, 4.4, 1.8, 0.15, "épave");
  // Poche sud-ouest : le stère de bois et une grume
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
    cyl(c, i % 3 ? 0x8a6a48 : 0x7a5e40, M.mat, -44.6 + i * 0.44 + (r % 2) * 0.22, 0.2 + r * 0.36, 25.6, 0.19, 1.0, { rx: Math.PI / 2, ry: 0 });
  }
  c.pave(-44.9, 0, 25.0, -44.8, 1.2, 26.2, PALETTE.boisSombre, M.mat);
  c.pave(-40.6, 0, 25.0, -40.5, 1.2, 26.2, PALETTE.boisSombre, M.mat);
  obstacleBoite(b, -42.7, 25.6, 4.3, 1.2, 0, "stère de bois");
  c.tube([-44.5, 0.35, 22.4], [-38.5, 0.3, 23.6], 0.35, 0x6a5440, M.mat, 7);
  b.obstacle(-44.5, 22.4, -38.5, 23.6, "grume");
  // Poche sud-est : le coin barbecue
  c.repere({ x: -20.2, y: 0, z: 23.2 }, () => {
    for (const s of [-1, 1]) c.poutre([s * 0.4, 0, -0.25], [s * 0.35, 0.75, 0], 0.04, 0x2a2a2a, M.metal);
    cyl(c, 0x2a2622, M.tole, 0, 0.85, 0, 0.42, 0.9, { rz: Math.PI / 2, ep: 0.42 }, G.cyl8);
    c.pave(-0.45, 1.05, -0.3, 0.45, 1.08, 0.3, 0x5a5a5a, M.metal);
  });
  chaisePlastique(c, -22.2, 22.4, 0.9);
  chaisePlastique(c, -18.4, 24.6, -2.5, 0xe6e2d8, true);
  for (let i = 0; i < 3; i++) c.boite(0.4, 0.3, 0.3, 0x2f6f3a, { x: -17.8 + i * 0.1, y: 0.15 + i * 0.3, z: 22.0, ry: i * 0.3 }, M.satin);
  c.boite(2.2, 0.04, 1.8, 0x3a6aa0, { x: -22, y: 0.05, z: 24.8, ry: 0.4, rz: 0.06 }, M.toile, { crasse: false });
  canettes(c, -20, 23.5, 1.4, 6);
  jonchee(c, -46, 20.6, -37, 27, 30);
  jonchee(c, -24, 20.6, -15, 26, 25);
  // Branches tombées, roseaux : de quoi s'embusquer sous le pont
  gravats(c, XB - 2.2, 18.2, 0.8, 6, [PALETTE.pierre, PALETTE.pierreSombre], -1.2);
  gravats(c, XB + 2, 10.2, 0.8, 6, [PALETTE.pierre, PALETTE.pierreSombre], -1.2);
  if (u > 0.3) c.tube([XB - 3, -0.6, 20], [XB + 1.5, -1.1, 22], 0.18, 0x6a5a48, M.mat, 6);
}

// ---------- Tronçon 3 : l'aire ----------

function bloc(c, x, z, s, ry) {
  c.poser(G.ico, MATS.mat, PALETTE.pierre, { x, y: 0.55 * s, z, ry, rx: 0.3, e: [1.0 * s, 0.75 * s, 0.85 * s] }, { nuance: 0.06 });
  c.poser(G.ico, MATS.mat, PALETTE.pierreSombre, { x: x + 0.2 * s, y: 0.35 * s, z: z - 0.1, ry: ry + 1, e: [0.8 * s, 0.5 * s, 0.75 * s] }, { nuance: 0.06 });
  mousse(c, x, 0.95 * s, z, 0.4 * s, 3);
}

function pinCouche(ctx) {
  const { c, b } = ctx;
  const M = MATS;
  const { racine: A, voiture: B, cime: C } = PIN_COUCHE;
  // La galette de racines dressée, au sud de la route
  c.poser(G.cyl8, M.mat, 0x5a4632, { x: A[0] - 0.6, y: 1.6, z: A[2] + 0.5, rx: Math.PI / 2 - 0.15, ry: -0.7, e: [2.0, 0.7, 2.0] }, { nuance: 0.06 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    c.poutre([A[0] - 0.6, 1.6, A[2] + 0.5], [A[0] - 0.6 + Math.cos(a) * 1.4 * 0.7, 1.6 + Math.sin(a) * 2.2, A[2] + 0.5 + Math.cos(a) * 1.4 * 0.7 + 0.6], 0.1, 0x4a3a2a, M.mat);
  }
  gravats(c, A[0] - 0.3, A[2] + 1.6, 1.4, 10, [0x5a4632, 0x6e5a3a, PALETTE.pierre]);
  // Le tronc, posé sur la voiture écrasée
  c.tube(A, B, 0.42, 0x5b4434, M.mat, 7);
  c.tube(B, C, 0.34, 0x5b4434, M.mat, 7);
  epave(c, B[0], 15.5, -0.15, 0x2f4f6a, { ecrase: true });
  // Les branches et la cime aux aiguilles roussies
  for (let i = 0; i < 16; i++) {
    const t = 0.35 + (i / 16) * 0.65;
    const p = [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t, B[2] + (C[2] - B[2]) * t];
    const a = i * 2.1;
    const q = [p[0] + Math.cos(a) * 1.8, p[1] + Math.abs(Math.sin(a)) * 1.2 + 0.2, p[2] + Math.sin(a) * 1.8];
    c.poutre(p, q, 0.08, 0x5b4434, M.mat);
    for (let j = 0; j < 2; j++) c.poser(G.ico, M.mat, [0x6a5a36, 0x5a5a32, 0x7a6038][(i + j) % 3], { x: q[0] + c.entre(-0.4, 0.4), y: q[1] + c.entre(-0.2, 0.3), z: q[2] + c.entre(-0.4, 0.4), ry: c.hasard() * 3, e: [c.entre(0.6, 1.0), c.entre(0.3, 0.5), c.entre(0.5, 0.8)] }, { nuance: 0.08, crasse: false });
  }
  // Pour le jeu : on ne passe ni par-dessus, ni par-dessous
  b.obstacle(A[0] - 2, A[2] + 0.5, B[0], B[2], "pin couché");
  b.obstacle(B[0], B[2], C[0], C[2], "pin couché");
  obstacleBoite(b, B[0], 15.5, 4.4, 1.8, -0.15, "voiture écrasée");
  b.obstacle(C[0] - 4, C[2] + 4, C[0] + 1.5, C[2] - 1, "cime du pin couché");
}

function barriere(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  bloc(c, 3.2, 8.9, 1.05, 0.4);
  bloc(c, 9.8, 8.9, 1.0, 1.9);
  obstacleBoite(b, 3.2, 8.9, 1.8, 1.6, 0.4, "bloc de pierre");
  obstacleBoite(b, 9.8, 8.9, 1.8, 1.6, 1.9, "bloc de pierre");
  // Le poteau, le contrepoids et la lisse rayée à moitié levée
  c.pave(4.25, 0, 8.6, 4.65, 1.15, 9.0, 0xc8c4b8, M.tole);
  c.repere({ x: 4.45, y: 1.05, z: 8.8, rz: 0.5 + (1 - u) * 0.1 }, () => {
    c.pave(-0.9, -0.12, -0.1, -0.1, 0.12, 0.1, 0x3a3a3a, M.metal);
    for (let i = 0; i < 6; i++) c.pave(i * 0.95, -0.06, -0.05, (i + 1) * 0.95, 0.06, 0.05, i % 2 ? 0xe6e2d8 : 0xc8362b, M.satin, { nuance: 0.04 });
  });
  // Une chaîne qui pend, le cadenas arraché
  for (let i = 0; i < 5; i++) c.poutre([4.65, 0.95 - i * 0.15, 8.8], [4.7, 0.85 - i * 0.15, 8.85], 0.03, 0x6a6a64, M.metal);
  // La pancarte des survivants et le grand panneau de l'aire
  c.repere({ x: 0.5, y: 0.6, z: 10.45, ry: 0.5, rx: -0.15 }, () => {
    c.pave(-0.9, -0.6, -0.03, 0.9, 0.6, 0.0, 0xa89070, M.mat);
    affiche(c, M.enseignes, R.deviation, { y: 0, z: 0.005 }, 1.75, 0.38);
  });
  c.repere({ x: 12.8, y: 0, z: 6.6, ry: 0.45 }, () => {
    for (const s of [-1, 1]) c.pave(s * 1.3 - 0.08, 0, -0.08, s * 1.3 + 0.08, 2.6, 0.08, PALETTE.boisSombre, M.mat);
    c.pave(-1.6, 1.05, -0.06, 1.6, 2.65, -0.01, 0x5a3e26, M.mat);
    affiche(c, M.enseignes, R.panneauAire, { y: 1.85, z: 0.0 }, 3.0, 1.5);
    c.pave(-1.7, 2.65, -0.25, 1.7, 2.75, 0.25, PALETTE.boisSombre, M.mat);
  });
  // Sortie est : deux blocs, la barrière cassée dans le fossé
  bloc(c, 40.4, 8.9, 0.9, 2.5);
  bloc(c, 49.6, 8.9, 0.95, 0.9);
  obstacleBoite(b, 40.4, 8.9, 1.6, 1.5, 2.5, "bloc de pierre");
  obstacleBoite(b, 49.6, 8.9, 1.6, 1.5, 0.9, "bloc de pierre");
  for (let i = 0; i < 5; i++) c.pave(42 + i * 0.95, 0.04, 7.0, 42.95 + i * 0.95, 0.14, 7.12, i % 2 ? 0xe6e2d8 : 0xc8362b, M.satin);
}

function toilettes(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  const { x0: X0, x1: X1, z0: Z0, z1: Z1, h: H } = TOIL;
  const k = b.couche("toilettes", { x: (X0 + X1) / 2, z: (Z0 + Z1) / 2, l: X1 - X0 + 0.8, p: Z1 - Z0 + 0.8 }, 1.15, H + 0.4);
  const paroi = 0xcfc6a8;
  const dedans = { couleur: 0xd8d0b4, mat: M.mat };
  c.pave(X0 - 0.3, 0, Z0 - 0.2, X1 + 0.3, 0.08, Z1 + 0.5, PALETTE.beton, M.mat, { crasse: false });
  murCoupe(ctx, k, [X0, Z1], [X1, Z1], { h: H, ep: 0.12, couleur: paroi, interieur: dedans, ouvertures: [{ u: 1.5, l: 0.9, bas: 0, haut: 2.0 }, { u: 4.5, l: 0.9, bas: 0, haut: 2.0 }] });
  murCoupe(ctx, k, [X1, Z1], [X1, Z0], { h: H, ep: 0.12, couleur: paroi, interieur: dedans, ouvertures: [{ u: 1.7, l: 0.8, bas: 1.8, haut: 2.2 }] });
  mur(c, [X1, Z0], [X0, Z0], { h: H, ep: 0.12, couleur: paroi, batiment: b, interieur: dedans });
  mur(c, [X0, Z0], [X0, Z1], { h: H, ep: 0.12, couleur: paroi, batiment: b, interieur: dedans });
  // La cloison et son trou
  mur(c, [32, Z1], [32, Z0], { h: 2.3, ep: 0.08, couleur: 0xd8d0b4, batiment: b, ouvertures: [{ u: 1.7, l: 0.3, bas: 0.95, haut: 1.2, type: "vide" }] });
  // Joints des panneaux préfabriqués
  for (let x = X0 + 1; x < X1; x += 1) c.pave(x - 0.03, 0, Z0 - 0.09, x + 0.03, H, Z0 - 0.06, 0xa8a08a, M.mat);
  // Toit (s'efface), aérateur, enseigne et pictos
  k.pave(X0 - 0.25, H, Z0 - 0.25, X1 + 0.25, H + 0.14, Z1 + 0.35, 0x9a968c, M.tole);
  cyl(k, 0x8d969a, M.metal, X1 - 1, H + 0.35, Z0 + 0.8, 0.12, 0.5);
  mousse(k, X0 + 2, H + 0.14, Z0 + 1.6, 1.0, 4 + Math.round(u * 6));
  affiche(k, M.enseignes, R.wc, { x: 32, y: 2.3, z: Z1 + 0.07 }, 1.2, 0.6);
  // Portes : celle des Dames entrouverte, celle des Messieurs arrachée
  battant(c, X0 + 1.05, Z1 + 0.06, -1.0, 0.88, 1.98, 0x5f7a6a, M.satin);
  c.boite(0.88, 0.05, 1.98, 0x5f7a6a, { x: 34, y: 0.11, z: Z1 + 1.4, ry: 0.3 }, M.satin);
  // Dedans : cuvettes inox, lavabos, rouleaux, miroirs cassés, annonces griffonnées
  for (const xc of [30.5, 33.5]) {
    cyl(c, 0xb8bcbe, M.metal, xc, 0.2, Z0 + 0.45, 0.17, 0.4, {}, G.cyl8);
    cyl(c, 0xb8bcbe, M.metal, xc, 0.42, Z0 + 0.5, 0.21, 0.05, {}, G.cyl8);
    c.pave(xc - 0.18, 0.4, Z0 + 0.07, xc + 0.18, 0.9, Z0 + 0.2, 0xb8bcbe, M.metal);
    c.pave(xc + 0.7, 0.75, Z0 + 0.07, xc + 1.15, 0.85, Z0 + 0.4, 0xe9e6dc, M.lisse);
    c.pave(xc + 0.72, 1.2, Z0 + 0.07, xc + 1.12, 1.6, Z0 + 0.09, 0xc8d0d4, M.lisse, { crasse: false });
    cyl(c, 0xf0eee6, M.mat, xc - 0.45, 0.8, Z0 + 0.12, 0.06, 0.1, { rz: Math.PI / 2 });
    for (let i = 0; i < 3; i++) c.boite(c.entre(0.2, 0.4), 0.005, c.entre(0.15, 0.3), 0xf0eee6, { x: xc + c.entre(-0.8, 0.8), y: 0.09, z: c.entre(Z0 + 0.6, Z1 - 0.4), ry: c.hasard() * 3 }, M.mat, { crasse: false });
  }
  affiche(c, M.enseignes, R.graffitiA, { x: 30.5, y: 1.55, z: Z0 + 0.075 }, 2.6, 1.3);
  affiche(c, M.enseignes, R.graffitiB, { x: 33.5, y: 1.55, z: Z0 + 0.075 }, 2.6, 1.3);
  affiche(c, M.enseignes, R.graffitiB, { x: 31.95, y: 1.55, z: (Z0 + Z1) / 2 - 0.3, ry: -Math.PI / 2 }, 2.2, 1.1);
  // Façade est : les tags (visibles depuis le parking)
  affiche(c, M.enseignes, R.graffitiC, { x: X1 + 0.075, y: 0.65, z: (Z0 + Z1) / 2, ry: Math.PI / 2 }, 2.8, 1.0);
  affiche(k, M.enseignes, R.graffitiC, { x: X1 + 0.075, y: 1.75, z: (Z0 + Z1) / 2 + 0.2, ry: Math.PI / 2 }, 2.4, 0.86);
  emballages(c, 32, Z1 + 1.6, 2.2, 14);
  lierreSimple(c, X0 - 0.07, Z0 + 0.4, Z1 - 0.4, 0.6 + u * 1.4);
}

/** Du lierre plaqué sur une face ouest (−x). */
function lierreSimple(c, x, z1, z2, h) {
  for (let i = 0; i < 14 + h * 8; i++) {
    const t = Math.pow(c.hasard(), 1.5);
    c.poser(G.ico, MATS.mat, [PALETTE.feuillageSombre, PALETTE.feuillage, 0x4f7a3c][i % 3], { x, y: t * h, z: c.entre(z1, z2), e: [0.06, 0.2, 0.2] }, { nuance: 0.08, crasse: false });
  }
}

function fourgon(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  const { x0: X0, x1: X1, z0: Z0, z1: Z1, sol: S, h: H, cab: XC } = FOURGON;
  const k = b.couche("fourgon", { x: (X0 + X1) / 2, z: (Z0 + Z1) / 2, l: X1 - X0 + 1.2, p: Z1 - Z0 + 1 }, 1.15, H + 0.3);
  const carross = 0xd4d0c6;
  const cuir = 0x221c20;
  // Plancher (enfoncé dans la boue : roues dégonflées, jantes à moitié dans la terre)
  c.pave(X0, 0, Z0, XC, S, Z1, 0x4a4038, M.mat);
  for (const x of [X0 + 0.9, X1 - 1.0]) for (const z of [Z0 - 0.02, Z1 + 0.02]) c.poser(G.cyl8, M.mat, 0x2a2826, { x, y: 0.2, z, rx: Math.PI / 2, e: [0.36, 0.22, 0.36] });
  c.pave(X0 - 0.6, 0, Z1 + 0.2, X0 + 0.6, 0.12, Z1 + 1.0, PALETTE.bois, M.mat);
  // Flanc nord (plein, vitre teintée)
  c.pave(X0, S, Z0, X1 - 0.6, H, Z0 + 0.06, carross, M.satin);
  c.pave(XC + 0.1, 1.35, Z0 - 0.01, X1 - 0.7, 1.9, Z0 + 0.07, 0x080808, M.verre, { crasse: false });
  // Flanc sud : porte coulissante ouverte ; bas dans le chantier, haut dans la couche
  for (const [p, q] of [[X0, X0 + 0.8], [X0 + 2.4, X1 - 0.6]]) {
    c.pave(p, S, Z1 - 0.06, q, 1.15, Z1, carross, M.satin);
    k.pave(p, 1.15, Z1 - 0.06, q, H, Z1, carross, M.satin);
  }
  k.pave(X0 + 0.8, 2.15, Z1 - 0.06, X0 + 2.4, H, Z1, carross, M.satin);
  k.pave(XC + 0.1, 1.35, Z1 - 0.07, X1 - 0.7, 1.9, Z1 + 0.01, 0x080808, M.verre, { crasse: false });
  // La porte coulissante, tirée vers l'avant
  c.pave(X0 + 2.4, S + 0.05, Z1 + 0.02, X0 + 4.0, 1.15, Z1 + 0.08, carross, M.satin);
  k.pave(X0 + 2.4, 1.15, Z1 + 0.02, X0 + 4.0, 2.1, Z1 + 0.08, carross, M.satin);
  k.pave(X0 + 2.5, 1.35, Z1 + 0.075, X0 + 3.9, 1.9, Z1 + 0.09, 0x080808, M.verre, { crasse: false });
  affiche(c, M.enseignes, R.plomberie, { x: X0 + 3.6, y: 0.68, z: Z1 + 0.1 }, 2.4, 0.52);
  // Portes arrière ouvertes en grand
  for (const s of [-1, 1]) {
    const zc = s < 0 ? Z0 + 0.03 : Z1 - 0.03;
    c.repere({ x: X0 - 0.02, y: 0, z: zc, ry: s < 0 ? -1.9 : 1.9 }, () => {
      c.pave(0, S, -0.03, 1.08, H - 0.05, 0.03, carross, M.satin);
      c.pave(0.15, 1.4, s < 0 ? -0.04 : 0.03, 0.95, 1.95, s < 0 ? -0.03 : 0.04, 0x080808, M.verre, { crasse: false });
    });
  }
  // Cabine : capot, pare-brise, sièges
  c.pave(X1 - 0.6, 0.35, Z0, X1, 1.2, Z1, carross, M.satin);
  c.boite(0.05, 0.75, Z1 - Z0 - 0.1, 0x101418, { x: X1 - 0.75, y: 1.6, z: (Z0 + Z1) / 2, rz: 0.35 }, M.verre, { crasse: false });
  c.pave(X1 + 0.0, 0.35, Z0 + 0.05, X1 + 0.08, 0.55, Z1 - 0.05, 0x8d969a, M.metal);
  for (const z of [Z0 + 0.55, Z1 - 0.55]) c.pave(XC + 0.3, S, z - 0.25, XC + 0.9, 1.0, z + 0.25, 0x2a2a2a, M.satin);
  c.pave(XC, S, Z0 + 0.06, XC + 0.06, H - 0.05, Z1 - 0.06, carross, M.satin);
  // Toit : il s'efface
  k.pave(X0 - 0.02, H, Z0 - 0.02, X1 - 0.6, H + 0.08, Z1 + 0.02, carross, M.satin);
  for (let i = 0; i < 3; i++) k.pave(X0 + 0.4 + i * 1.6, H + 0.08, Z0 + 0.2, X0 + 0.5 + i * 1.6, H + 0.14, Z1 - 0.2, 0x8d969a, M.metal);
  for (let i = 0; i < 4; i++) c.boite(c.entre(0.3, 0.6), c.entre(0.1, 0.3), 0.02, PALETTE.rouille, { x: c.entre(X0 + 0.3, X1 - 0.8), y: c.entre(S + 0.1, 0.5), z: Z1 + 0.01 }, M.mat, { crasse: false });
  // Dedans : capitonnage noir, croix de Saint-André, matelas en simili cuir, chaînes, menottes roses, fouets, bougies
  c.pave(X0 + 0.05, S, Z0 + 0.06, XC, H - 0.05, Z0 + 0.1, cuir, M.satin);
  for (let x = X0 + 0.3; x < XC; x += 0.4) for (let y = S + 0.3; y < H - 0.1; y += 0.4) c.poser(G.ico, M.satin, 0x2a2226, { x, y, z: Z0 + 0.11, e: [0.04, 0.04, 0.015] }, { crasse: false, nuance: 0 });
  c.pave(X0 + 0.05, S, Z1 - 0.1, X0 + 0.8, 1.15, Z1 - 0.06, cuir, M.satin);
  c.pave(X0 + 2.4, S, Z1 - 0.1, XC, 1.15, Z1 - 0.06, cuir, M.satin);
  c.pave(XC - 0.06, S, Z0 + 0.1, XC, H - 0.05, Z1 - 0.1, cuir, M.satin);
  // La croix (rembourrage de velours, attaches à fourrure rose)
  const xcr = XC - 0.18;
  c.poutre([xcr, S + 0.15, Z0 + 0.35], [xcr, H - 0.2, Z1 - 0.35], 0.16, PALETTE.velours, M.satin);
  c.poutre([xcr, S + 0.15, Z1 - 0.35], [xcr, H - 0.2, Z0 + 0.35], 0.16, PALETTE.velours, M.satin);
  for (const [y, z] of [[S + 0.3, Z0 + 0.45], [S + 0.3, Z1 - 0.45], [H - 0.35, Z0 + 0.45], [H - 0.35, Z1 - 0.45]]) c.poser(G.tore, M.toile, 0xe88fb8, { x: xcr - 0.1, y, z, ry: Math.PI / 2, e: [0.07, 0.07, 0.07] }, { crasse: false, nuance: 0.04 });
  // Le matelas
  c.pave(X0 + 0.2, S, Z0 + 0.12, XC - 0.4, S + 0.22, Z0 + 1.05, 0x1a1418, M.satin);
  c.pave(X0 + 0.3, S + 0.22, Z0 + 0.15, X0 + 0.8, S + 0.32, Z0 + 0.95, 0x7a1a2a, M.satin);
  c.poser(G.tore, M.toile, 0xe88fb8, { x: X0 + 1.9, y: S + 0.25, z: Z0 + 0.6, rx: Math.PI / 2, e: [0.07, 0.07, 0.07] }, { crasse: false });
  c.poser(G.tore, M.toile, 0xe88fb8, { x: X0 + 2.05, y: S + 0.25, z: Z0 + 0.66, rx: Math.PI / 2, e: [0.07, 0.07, 0.07] }, { crasse: false });
  // Chaînes pendues au toit
  for (const [x, z, n] of [[X0 + 1.2, Z0 + 0.6, 9], [X0 + 2.0, Z0 + 0.5, 7], [X0 + 3.4, (Z0 + Z1) / 2, 10]]) {
    for (let i = 0; i < n; i++) c.boite(0.03, 0.09, 0.05, 0x8a8a84, { x, y: H - 0.08 - i * 0.085, z, ry: i % 2 ? Math.PI / 2 : 0 }, M.metal, { crasse: false, nuance: 0.05 });
  }
  // Fouets au râtelier (flanc sud, côté arrière)
  for (let i = 0; i < 3; i++) {
    const x = X0 + 0.25 + i * 0.2;
    c.poutre([x, 1.05, Z1 - 0.15], [x, 0.75, Z1 - 0.15], 0.04, 0x2a1a14, M.satin);
    for (let j = 0; j < 4; j++) c.poutre([x, 0.75, Z1 - 0.15], [x + (j - 1.5) * 0.04, 0.2, Z1 - 0.17], 0.012, 0x1a1210, M.satin);
  }
  // Bougies et coulures de cire, lampe-tempête au crochet de la cloison
  for (let i = 0; i < 6; i++) cyl(c, i % 2 ? 0xe9e6dc : 0x9a1a2a, M.satin, X0 + 0.3 + (i % 3) * 0.12, S + 0.08 + (i < 3 ? 0 : 0) + c.entre(0, 0.06), Z1 - 0.4 - Math.floor(i / 3) * 0.14, 0.03, 0.16 + c.hasard() * 0.1);
  for (let i = 0; i < 5; i++) c.boite(c.entre(0.05, 0.15), 0.006, c.entre(0.05, 0.12), 0xe9e6dc, { x: X0 + 0.3 + c.hasard() * 0.5, y: S + 0.005, z: Z1 - 0.5 + c.hasard() * 0.3 }, M.satin, { crasse: false });
  c.pave(XC - 0.4, 1.95, (Z0 + Z1) / 2 + 0.6, XC - 0.06, 1.98, (Z0 + Z1) / 2 + 0.66, 0x3a3a3a, M.metal);
  cyl(c, 0x3a3a3a, M.metal, XC - 0.38, 1.82, (Z0 + Z1) / 2 + 0.63, 0.09, 0.05);
  cyl(c, 0xffb060, M.ampoules, XC - 0.38, 1.7, (Z0 + Z1) / 2 + 0.63, 0.07, 0.2);
  cyl(c, 0x3a3a3a, M.metal, XC - 0.38, 1.57, (Z0 + Z1) / 2 + 0.63, 0.1, 0.06);
  obstacleBoite(b, (X0 + X1) / 2 + 0.3, Z0 + 0.05, X1 - X0, 0.1, 0, "fourgon");
  b.obstacle(X0 + 2.4, Z1, X1, Z1, "fourgon");
  b.obstacle(X0, Z1, X0 + 0.8, Z1, "fourgon");
  b.obstacle(XC, Z0, XC, Z1, "fourgon");
  b.obstacle(XC, Z0, X1, Z0, "fourgon");
  b.obstacle(X1, Z0, X1, Z1, "fourgon");
  emballages(c, X0 - 0.8, Z1 + 0.8, 1.5, 8);
}

function caravane(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  const { x0: X0, x1: X1, z0: Z0, z1: Z1, sol: S, h: H } = CARAVANE;
  const k = b.couche("caravane", { x: (X0 + X1) / 2, z: (Z0 + Z1) / 2 + 0.5, l: X1 - X0 + 1, p: Z1 - Z0 + 2.2 }, 1.15, H + 0.3);
  const creme = 0xe2d8c2;
  const brun = 0x8a5a3a;
  c.pave(X0, 0, Z0, X1, S, Z1, 0x5a4a3a, M.mat);
  // Parois : nord pleine (fenêtre), sud coupée à l'allège avec porte et fenêtre à rideaux roses
  c.pave(X0, S, Z0, X1, H, Z0 + 0.06, creme, M.satin);
  c.pave(X0, 0.9, Z0 - 0.01, X1, 1.05, Z0 + 0.07, brun, M.satin);
  for (const [p, q] of [[X0, X0 + 1.2], [X0 + 2.0, X1]]) {
    c.pave(p, S, Z1 - 0.06, q, 1.15, Z1, creme, M.satin);
    k.pave(p, 1.15, Z1 - 0.06, q, H, Z1, creme, M.satin);
    c.pave(p, 0.9, Z1 - 0.07, q, 1.05, Z1 + 0.01, brun, M.satin);
  }
  k.pave(X0 + 1.2, 2.05, Z1 - 0.06, X0 + 2.0, H, Z1, creme, M.satin);
  k.pave(X0 + 3.2, 1.3, Z1 - 0.07, X0 + 5.6, 1.85, Z1 + 0.01, 0x2a2228, M.verre, { crasse: false });
  for (let i = 0; i < 3; i++) k.boite(0.75, 0.5, 0.02, 0xe88fb8, { x: X0 + 3.6 + i * 0.8, y: 1.6, z: Z1 - 0.12, rz: c.entre(-0.05, 0.05) }, M.toile, { crasse: false });
  affiche(c, M.enseignes, R.nid, { x: X0 + 4.6, y: 0.62, z: Z1 + 0.02 }, 2.8, 0.7);
  battant(c, X0 + 1.2, Z1 + 0.04, -1.3, 0.78, 1.92, creme, M.satin);
  // Pignons arrondis (est plat, ouest en pointe pour l'aérodynamisme des années folles)
  c.pave(X1 - 0.06, S, Z0, X1, H - 0.1, Z1, creme, M.satin);
  c.boite(0.06, H - S - 0.3, Z1 - Z0, creme, { x: X0 - 0.2, y: (H + S) / 2 - 0.1, z: (Z0 + Z1) / 2, rz: -0.18 }, M.satin);
  c.boite(0.04, 0.6, Z1 - Z0 - 0.6, 0x2a2228, { x: X0 - 0.27, y: 1.6, z: (Z0 + Z1) / 2, rz: -0.18 }, M.verre, { crasse: false });
  // Toit bombé et miroir au plafond (dans la couche : on le voit d'en haut quand le toit est là)
  k.pave(X0 - 0.1, H, Z0 - 0.04, X1 + 0.04, H + 0.12, Z1 + 0.04, 0xd8d0bc, M.satin);
  k.pave(X0 + 0.3, H + 0.12, Z0 + 0.2, X1 - 0.3, H + 0.2, Z1 - 0.2, 0xcfc6b0, M.satin);
  k.pave(X0 + 2.5, H + 0.2, Z0 + 0.8, X0 + 3.3, H + 0.32, Z1 - 0.8, 0xe8e4d8, M.lisse);
  cyl(k, 0xd8dde2, M.metal, X1 - 1.25, H - 0.03, (Z0 + Z1) / 2, 0.95, 0.04, {}, G.cyl8);
  // L'auvent rayé, les chaises longues, le flamant rose
  for (let i = 0; i < 6; i++) k.boite(0.6, 0.03, 1.9, i % 2 ? 0xe9dfc6 : 0xd6407e, { x: X0 + 2.4 + i * 0.6, y: 2.15, z: Z1 + 0.95, rx: 0.15 }, M.toile, { crasse: false, nuance: 0.04 });
  for (const x of [X0 + 2.15, X0 + 5.85]) c.pave(x - 0.03, 0, Z1 + 1.85, x + 0.03, 2.0, Z1 + 1.9, 0x9a9a92, M.metal);
  for (const [x, r] of [[X0 + 3.4, 0.3], [X0 + 5, -0.4]]) c.repere({ x, y: 0, z: Z1 + 1.5, ry: r }, () => {
    c.boite(0.55, 0.04, 1.2, 0xd6407e, { y: 0.32, rx: 0.1 }, M.toile);
    c.boite(0.55, 0.04, 0.6, 0xd6407e, { y: 0.55, z: -0.75, rx: -0.9 }, M.toile);
    for (const s of [-1, 1]) c.poutre([s * 0.27, 0, 0.5], [s * 0.27, 0.32, -0.4], 0.02, 0xc0c0c0, M.metal);
  });
  c.repere({ x: X1 + 0.8, y: 0, z: Z1 + 0.9, ry: -0.6 }, () => {
    c.poutre([0, 0, 0], [0, 0.55, 0], 0.015, 0x2a2a2a, M.metal);
    c.poser(G.sph, M.satin, 0xf08aa8, { y: 0.68, e: [0.2, 0.13, 0.11] });
    c.poutre([0.12, 0.72, 0], [0.18, 1.05, 0], 0.035, 0xf08aa8, M.satin);
    c.poser(G.sph, M.satin, 0xf08aa8, { x: 0.2, y: 1.08, e: [0.06, 0.05, 0.05] });
  });
  // Le timon sur sa béquille, la bonbonne, la roue démontée
  c.poutre([X0 - 0.3, 0.45, (Z0 + Z1) / 2 - 0.5], [X0 - 1.4, 0.4, (Z0 + Z1) / 2], 0.08, 0x3a3a3a, M.metal);
  c.poutre([X0 - 0.3, 0.45, (Z0 + Z1) / 2 + 0.5], [X0 - 1.4, 0.4, (Z0 + Z1) / 2], 0.08, 0x3a3a3a, M.metal);
  cyl(c, 0x3a3a3a, M.metal, X0 - 1.35, 0.2, (Z0 + Z1) / 2, 0.04, 0.4);
  cyl(c, 0xd8862a, M.satin, X0 - 0.75, 0.32, (Z0 + Z1) / 2 + 0.4, 0.15, 0.6);
  c.poser(G.cyl8, M.mat, 0x2a2826, { x: X1 + 0.4, y: 0.1, z: Z0 - 0.3, e: [0.3, 0.18, 0.3] });
  // Dedans : le lit rond, coussins en cœur, tapis de fourrure, kitchenette, bouteilles
  const xl = X1 - 1.25;
  const zl = (Z0 + Z1) / 2;
  cyl(c, 0x3a2228, M.satin, xl, S + 0.18, zl, 1.0, 0.36, {}, G.cyl8);
  cyl(c, 0x9a1a2a, M.satin, xl, S + 0.42, zl, 0.97, 0.14, {}, G.cyl8);
  for (const [dx, dz] of [[0.55, -0.35], [0.55, 0.35]]) c.poser(G.sph, M.satin, 0xe88fb8, { x: xl + dx, y: S + 0.6, z: zl + dz, ry: 0.5, e: [0.15, 0.13, 0.22] });
  c.boite(1.2, 0.02, 0.8, 0xd8c8a0, { x: xl - 1.6, y: S + 0.01, z: zl, ry: 0.3 }, M.toile, { crasse: false });
  c.pave(X0 + 0.1, S, Z0 + 0.08, X0 + 1.6, S + 0.85, Z0 + 0.65, 0xc8b89a, M.satin);
  c.pave(X0 + 0.5, S + 0.85, Z0 + 0.15, X0 + 0.95, S + 0.88, Z0 + 0.5, 0xb8bcbe, M.metal);
  for (let i = 0; i < 4; i++) cyl(c, 0x2a5a2a, M.verre, X0 + 1.1 + i * 0.12, S + 0.98, Z0 + 0.4, 0.04, 0.26);
  for (let i = 0; i < 3; i++) cyl(c, 0x2a5a2a, M.verre, X0 + 2 + i * 0.5, S + 0.04, zl + c.entre(-0.4, 0.4), 0.04, 0.26, { rz: Math.PI / 2, ry: c.hasard() * 3 });
  // Le paillasson en cœur
  affiche(c, M.enseignes, R.coeur, { x: X0 + 1.6, y: 0.02, z: Z1 + 0.6, rx: -Math.PI / 2 }, 0.7, 0.7);
  obstacleBoite(b, (X0 + X1) / 2, (Z0 + Z1) / 2, X1 - X0, Z1 - Z0, 0, "caravane");
}

function borne(ctx) {
  const { c, b } = ctx;
  const M = MATS;
  c.repere({ x: 24.5, y: 0, z: 4.2, ry: 0.5 }, () => {
    c.pave(-0.4, 0, -0.25, 0.4, 0.12, 0.25, PALETTE.beton, M.mat);
    c.pave(-0.3, 0.12, -0.15, 0.3, 2.0, 0.15, 0xe8e6ea, M.satin);
    c.pave(-0.31, 0.12, 0.1, -0.27, 2.0, 0.16, 0xd6407e, M.satin);
    c.pave(0.27, 0.12, 0.1, 0.31, 2.0, 0.16, 0xd6407e, M.satin);
    c.boite(0.62, 0.1, 0.34, 0xd6407e, { y: 2.05 }, M.satin);
    affiche(c, M.ecran, R.borne, { y: 1.3, z: 0.155 }, 0.5, 0.75);
    affiche(c, M.enseignes, R.watty, { y: 0.55, z: 0.155 }, 0.3, 0.3);
    // Le câble coupé
    c.poutre([0.1, 0.05, -0.2], [0.5, 0.03, -0.9], 0.04, 0x1a1a1a, M.satin);
  });
  obstacleBoite(b, 24.5, 4.2, 0.8, 0.5, 0.5, "borne");
}

function aire(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  pinCouche(ctx);
  barriere(ctx);
  toilettes(ctx);
  fourgon(ctx);
  caravane(ctx);
  borne(ctx);
  // Ornières et flaques du parking en terre battue
  for (const [x, z, ry, l] of [[12, 3, 0.2, 14], [12, 4.6, 0.2, 14], [30, -2, -0.3, 16], [30, -0.4, -0.3, 16], [42, -9, 0.9, 8]]) c.boite(l, 0.01, 0.35, 0x6e5a40, { x, y: 0.005, z, ry }, M.mat, { crasse: false, nuance: 0.05 });
  for (let i = 0; i < 2 + Math.round(u * 6); i++) flaque(c, c.entre(6, 46), c.entre(-10, 5), c.entre(0.6, 1.5));
  // Table de pique-nique en béton et poubelle débordante
  c.repere({ x: 20, y: 0, z: -2.5, ry: 0.25 }, () => {
    c.pave(-1.0, 0.72, -0.4, 1.0, 0.8, 0.4, PALETTE.beton, M.mat);
    for (const s of [-1, 1]) {
      c.pave(-1.0, 0.42, s * 0.75 - 0.14, 1.0, 0.48, s * 0.75 + 0.14, PALETTE.beton, M.mat);
      c.pave(s * 0.7 - 0.08, 0, -0.85, s * 0.7 + 0.08, 0.72, 0.85, PALETTE.betonSombre, M.mat);
    }
  });
  obstacleBoite(b, 20, -2.5, 2.0, 1.8, 0.25, "table");
  cyl(c, 0x5a6a46, M.tole, 22.2, 0.5, -1.2, 0.3, 0.8);
  cyl(c, 0x3a3a3a, M.metal, 22.2, 0.45, -1.55, 0.04, 0.9);
  for (let i = 0; i < 5; i++) c.poser(G.ico, M.satin, 0x1e1e1e, { x: 22.2 + c.entre(-0.9, 0.9), y: 0.2, z: -1.2 + c.entre(-0.9, 0.9), ry: c.hasard() * 3, e: [0.3, 0.22, 0.25] });
  canettes(c, 21.6, -0.6, 1.4, 8);
  // Le panneau d'information : la note de l'appli, sous un petit toit
  c.repere({ x: 14.5, y: 0, z: -7.5, ry: 0.5 }, () => {
    for (const s of [-1, 1]) c.pave(s * 0.8 - 0.06, 0, -0.06, s * 0.8 + 0.06, 2.2, 0.06, PALETTE.boisSombre, M.mat);
    c.pave(-0.85, 0.9, -0.08, 0.85, 2.0, 0.0, 0x6b4a2e, M.mat);
    affiche(c, M.enseignes, R.notation, { x: -0.38, y: 1.45, z: 0.01 }, 0.75, 0.75);
    affiche(c, M.enseignes, R.graffitiB, { x: 0.42, y: 1.45, z: 0.01 }, 0.75, 0.37);
    c.boite(1.9, 0.05, 0.45, PALETTE.boisSombre, { y: 2.2, z: 0.05, rx: 0.3 }, M.mat);
  });
  for (const [x, z] of PINS_PARKING) obstacleBoite(b, x, z, 0.6, 0.6, 0, "pin");
  // La voiture aux vitres cachées (pare-soleil, serviette)
  epave(c, 8.5, -2, 0.35, 0x8a8f90, { vitresCachees: true });
  obstacleBoite(b, 8.5, -2, 4.4, 1.8, 0.35, "épave");
  // La berline de fonction, noire, portière ouverte : son propriétaire est resté dans le coin
  epave(c, 39.2, -12.2, -0.6, 0x1e2226, { portiere: true });
  obstacleBoite(b, 39.2, -12.2, 4.4, 1.8, -0.6, "épave");
  // Le panneau « sentier découverte » à l'est du parking
  c.repere({ x: 46.2, y: 0, z: -14.2, ry: -0.4 }, () => {
    c.pave(-0.05, 0, -0.05, 0.05, 1.7, 0.05, PALETTE.boisSombre, M.mat);
    c.boite(0.9, 0.18, 0.04, PALETTE.bois, { x: 0.35, y: 1.5, z: 0.06 }, M.mat);
    c.boite(0.8, 0.16, 0.04, PALETTE.bois, { x: -0.3, y: 1.2, z: 0.06, rz: 0.25 }, M.mat);
  });
  // Le cul-de-sac de l'ouest : matelas, magazines
  matelas(c, -4.2, -20.2, 0.8, 1.9, 1.3, 0xa89c7c);
  magazines(c, -3, -19, 1.2, 4);
  emballages(c, -4, -20, 2, 10);
  // Jonchée d'aiguilles, papiers
  jonchee(c, 3, -14, 48, 6, Math.round(40 + u * 60), [0x9c7a45, 0x7d6143, 0xe9e6dc, 0xb08f55]);
  emballages(c, 10, -10, 4, 10);
}

function magazines(c, x, z, r, n) {
  const M = MATS;
  for (let i = 0; i < n; i++) {
    const px = x + c.entre(-r, r);
    const pz = z + c.entre(-r, r);
    const ry = c.hasard() * 6;
    const gondole = c.entre(0.1, 0.35);
    c.repere({ x: px, y: 0.02, z: pz, ry }, () => {
      affiche(c, M.enseignes, R["mag" + (i % 4)], { x: 0.105, y: 0.02, rx: -Math.PI / 2 + gondole, }, 0.21, 0.29);
      c.boite(0.21, 0.01, 0.29, 0xe9e6dc, { x: -0.105, y: 0.02, rz: gondole }, M.mat, { crasse: false });
    });
  }
}

// ---------- Tronçon 4 : la clairière ----------

function guirlande(ctx, pts, y, fleche) {
  const { c } = ctx;
  const M = MATS;
  let idx = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.45);
    let prec = [ax, y, az];
    for (let j = 1; j <= n; j++) {
      const t = j / n;
      const p = [ax + (bx - ax) * t, y - fleche * 4 * t * (1 - t), az + (bz - az) * t];
      c.poutre(prec, p, 0.015, 0x1a1a1a, M.satin);
      prec = p;
      if (j < n && j % 2 === 0) {
        idx++;
        const morte = Math.abs(Math.sin(idx * 7.3)) < 0.18;
        c.poser(G.ico, M.ampoules, morte ? 0x3a1414 : 0xff3a2a, { x: p[0], y: p[1] - 0.09, z: p[2], e: [0.08, 0.11, 0.08] }, { crasse: false, nuance: 0 });
      }
    }
  }
}

function clairiere(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  const { x: CX, z: CZ } = CLAIRIERE;
  // La guirlande sur les pins du nord de la clairière
  const pins = ARBRES.filter((t) => t.guirlande).map((t) => [t.x, t.z]);
  guirlande(ctx, pins, 2.7, 0.6);
  // Batterie solaire au pied du premier pin (la guirlande tient grâce à elle)
  const [bx, bz] = pins[1];
  c.repere({ x: bx + 0.5, y: 0, z: bz + 0.9, ry: 0.4 }, () => {
    c.pave(-0.25, 0, -0.18, 0.25, 0.3, 0.18, 0x2a2a2a, M.satin);
    c.boite(0.12, 0.04, 0.08, 0x9fe08a, { y: 0.31, x: 0.12 }, M.ampoules, { crasse: false, nuance: 0 });
    c.poutre([0.5, 0, 0.3], [0.5, 0.7, 0.3], 0.04, 0x8d969a, M.metal);
    c.boite(0.8, 0.03, 0.55, 0x1c2a44, { x: 0.5, y: 0.8, z: 0.3, rx: 0.6 }, M.lisse);
    c.poutre([0, 0.3, 0], [0, 2.6, -0.8], 0.02, 0x1a1a1a, M.satin);
  });
  // Le canapé Chesterfield éventré
  c.repere({ x: 73.5, y: 0, z: -22.5, ry: 0.5 }, () => {
    const cuir = 0x5a3a28;
    c.pave(-1.1, 0.1, -0.45, 1.1, 0.45, 0.45, cuir, M.satin);
    c.pave(-1.1, 0.45, -0.45, 1.1, 0.95, -0.2, cuir, M.satin);
    for (const s of [-1, 1]) cyl(c, cuir, M.satin, s * 1.12, 0.55, 0, 0.2, 0.92, { rx: Math.PI / 2, ep: 0.2 }, G.cyl8);
    for (let i = 0; i < 3; i++) c.pave(-1.0 + i * 0.68, 0.45, -0.2, -0.36 + i * 0.68, 0.58, 0.42, 0x6a4430, M.satin, { nuance: 0.06 });
    for (let i = 0; i < 4; i++) c.poser(G.ico, M.mat, 0xd8c070, { x: c.entre(-0.8, 0.8), y: 0.6, z: c.entre(-0.1, 0.3), e: [0.12, 0.08, 0.1] }, { crasse: false });
    for (const s of [-1, 1]) for (const t of [-1, 1]) cyl(c, 0x2a1a10, M.satin, s * 1.0, 0.05, t * 0.35, 0.05, 0.1);
  });
  obstacleBoite(b, 73.5, -22.5, 2.5, 1.0, 0.5, "canapé");
  // Le fauteuil club et le touret-table
  c.repere({ x: 69.6, y: 0, z: -19.2, ry: 1.3 }, () => {
    c.pave(-0.45, 0.1, -0.4, 0.45, 0.45, 0.4, 0x4a3022, M.satin);
    c.pave(-0.45, 0.45, -0.4, 0.45, 0.9, -0.2, 0x4a3022, M.satin);
    for (const s of [-1, 1]) c.pave(s * 0.45 - 0.1, 0.1, -0.4, s * 0.45 + 0.1, 0.65, 0.4, 0x4a3022, M.satin);
  });
  cyl(c, 0x8a6a48, M.mat, 74.6, 0.04, -19.5, 0.62, 0.08, {}, G.cyl8);
  cyl(c, 0x7a5e40, M.mat, 74.6, 0.3, -19.5, 0.22, 0.5, {}, G.cyl8);
  cyl(c, 0x8a6a48, M.mat, 74.6, 0.58, -19.5, 0.62, 0.08, {}, G.cyl8);
  for (let i = 0; i < 4; i++) cyl(c, [0x2a5a2a, 0x6a3a1a][i % 2], M.verre, 74.4 + i * 0.13, 0.78, -19.4 + (i % 2) * 0.2, 0.04, 0.3);
  for (let i = 0; i < 3; i++) cyl(c, 0xe9e6dc, M.satin, 74.9, 0.68, -19.8 + i * 0.1, 0.03, 0.12 + i * 0.03);
  // Matelas sur palettes, bâche bleue
  c.repere({ x: 80.5, y: 0, z: -23.5, ry: -0.3 }, () => {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) c.pave(-1.0 + i * 1.0, 0, -0.6 + j * 0.5, -0.05 + i * 1.0, 0.13, -0.5 + j * 0.5, 0xa08a62, M.mat);
    c.pave(-1.0, 0.13, -0.7, 0.95, 0.15, 0.6, 0xa08a62, M.mat);
  });
  matelas(c, 80.5, -23.5, -0.3, 1.9, 1.35, 0xb0a07c, 0.15);
  c.boite(2.4, 0.05, 1.6, 0x2f5f9a, { x: 82.2, y: 0.06, z: -20.6, ry: 1.0, rz: 0.08 }, M.toile, { crasse: false });
  c.poser(G.ico, M.toile, 0x2f5f9a, { x: 82.8, y: 0.2, z: -21.2, e: [0.6, 0.25, 0.5] });
  // Feu de camp éteint : pierres en rond, cendres
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    c.poser(G.ico, M.mat, PALETTE.pierre, { x: 78.5 + Math.cos(a) * 0.6, y: 0.1, z: -15.5 + Math.sin(a) * 0.6, ry: a, e: [0.18, 0.13, 0.15] }, { nuance: 0.08 });
  }
  cyl(c, 0x3a3532, M.mat, 78.5, 0.02, -15.5, 0.5, 0.04, {}, G.cyl8);
  for (let i = 0; i < 3; i++) c.poutre([78.5 + c.entre(-0.3, 0.3), 0.05, -15.5 + c.entre(-0.3, 0.3)], [78.5 + c.entre(-0.4, 0.4), 0.15, -15.5 + c.entre(-0.4, 0.4)], 0.06, 0x2a2420, M.mat);
  // Chaises, magazines, préservatifs et emballages (le sol de la clairière raconte tout)
  chaisePlastique(c, 71.5, -16.5, 2.4);
  chaisePlastique(c, 77.5, -24.5, 0.5, 0xe6e2d8, true);
  magazines(c, 74, -20.5, 3, 7);
  emballages(c, 75, -21, 4.5, 36);
  canettes(c, 76, -18, 3, 10);
  // La poupée gonflable crevée, prise dans les branches du pin mort
  const poupee = ARBRES.find((t) => t.poupee);
  c.repere({ x: poupee.x - 0.5, y: 3.1, z: poupee.z + 0.4, ry: -0.6, rz: 0.5 }, () => {
    const rose = 0xf0a8b8;
    c.poser(G.sph, M.satin, rose, { y: 0, e: [0.24, 0.36, 0.07], rz: 0.15 });
    c.poser(G.ico, M.satin, 0xe898a8, { x: 0.08, y: -0.15, z: 0.04, e: [0.12, 0.1, 0.05] });
    c.poser(G.sph, M.satin, rose, { y: 0.48, e: [0.14, 0.15, 0.12] });
    c.poser(G.tore, M.satin, 0x7a2a3a, { y: 0.45, z: 0.115, e: [0.035, 0.035, 0.03] });
    c.poser(G.sph, M.satin, 0xd8c060, { y: 0.58, z: -0.02, e: [0.16, 0.08, 0.13] });
    c.boite(0.5, 0.08, 0.03, rose, { x: 0.35, y: 0.22, rz: 0.6 }, M.satin);
    c.boite(0.5, 0.08, 0.03, rose, { x: -0.33, y: 0.15, rz: -0.9 }, M.satin);
    c.boite(0.09, 0.6, 0.03, rose, { x: 0.1, y: -0.62, rz: 0.15 }, M.satin);
    c.boite(0.08, 0.55, 0.02, 0xe898a8, { x: -0.12, y: -0.58, z: 0.03, rz: -0.35, rx: 0.4 }, M.satin);
    c.boite(0.16, 0.05, 0.005, 0xc8c4b8, { x: 0.05, y: 0.05, z: 0.071, rz: 0.4 }, M.satin);
    c.poutre([0, 0.62, 0], [0.45, 1.2, -0.3], 0.02, 0xc8b890, M.mat);
  });
  // La voiture des habitués, portières ouvertes, un matelas dans le coffre
  epave(c, 67.6, -21.6, 1.0, 0x5a2a3a, { portiere: true });
  obstacleBoite(b, 67.6, -21.6, 4.4, 1.8, 1.0, "épave");
  // Le fauteuil en rotin à dossier en éventail, trône kitsch de la clairière
  c.repere({ x: 79.2, y: 0, z: -17.6, ry: 0.9 }, () => {
    const rotin = 0xc8a46a;
    cyl(c, rotin, M.mat, 0, 0.2, 0, 0.3, 0.4, {}, G.cyl8);
    cyl(c, rotin, M.mat, 0, 0.45, 0.05, 0.42, 0.1, {}, G.cyl8);
    c.poser(G.cyl8, M.mat, rotin, { y: 1.2, z: -0.35, rx: Math.PI / 2 - 0.15, e: [0.75, 0.06, 0.75] }, { nuance: 0.04 });
    c.poser(G.cyl8, M.satin, 0x9a1a2a, { y: 0.52, z: 0.05, e: [0.36, 0.06, 0.36] });
  });
  obstacleBoite(b, 79.2, -17.6, 1.2, 1.0, 0.9, "fauteuil en rotin");
  // Le paravent de palettes (un cœur peint dessus) : de quoi se cacher
  c.repere({ x: 70.5, y: 0, z: -14.6, ry: -0.35 }, () => {
    for (let i = 0; i < 3; i++) for (let k = 0; k < 5; k++) c.pave(-1.8 + i * 1.2, 0.1 + k * 0.28, -0.04, -0.65 + i * 1.2, 0.3 + k * 0.28, 0.04, 0xa08a62, M.mat, { nuance: 0.06 });
    for (let i = 0; i < 4; i++) c.pave(-1.85 + i * 1.18, 0, -0.07, -1.75 + i * 1.18, 1.5, 0.07, 0x8a7350, M.mat);
    affiche(c, M.enseignes, R.coeur, { y: 0.85, z: 0.05 }, 0.9, 0.9);
  });
  obstacleBoite(b, 70.5, -14.6, 3.7, 0.2, -0.35, "paravent de palettes");
  // La bâche tendue au-dessus du matelas (elle s'efface quand on passe dessous)
  const k = b.couche("bache", { x: 80.5, z: -23.5, l: 4.4, p: 3.6 }, 1.9, 2.6);
  for (const [x, z] of [[78.6, -25], [82.4, -25], [78.6, -22], [82.4, -22]]) c.poutre([x, 0, z], [x, 2.15, z], 0.07, 0x7a6a50, M.mat);
  k.boite(4.2, 0.04, 3.4, 0x2f5f9a, { x: 80.5, y: 2.2, z: -23.5, rx: 0.12 }, M.toile, { crasse: false });
  k.boite(0.6, 0.6, 0.02, 0x2f5f9a, { x: 82.2, y: 1.85, z: -21.85, rz: 0.2 }, M.toile, { crasse: false });
  // L'écriteau « Ici, on se respecte »
  c.repere({ x: 61.6 + 0.35, y: 1.6, z: -12.4 + 0.35, ry: 0.7 }, () => affiche(c, M.enseignes, R.respect, {}, 0.8, 0.55));
  jonchee(c, CX - 11, CZ - 8, CX + 11, CZ + 8, Math.round(40 + u * 60));
}

function abriBus(ctx) {
  const { c, b, u } = ctx;
  const M = MATS;
  const k = b.couche("abri-bus", { x: 81.3, z: 5.8, l: 6.6, p: 3 }, 2.2, 2.7);
  c.pave(78, 0, 4.6, 84.6, 0.06, 7.4, PALETTE.beton, M.mat, { crasse: false });
  for (const x of [78.6, 81.3, 84]) c.pave(x - 0.05, 0, 4.75, x + 0.05, 2.4, 4.85, 0x8d969a, M.metal);
  for (const x of [78.6, 84]) c.pave(x - 0.05, 0, 6.55, x + 0.05, 2.4, 6.65, 0x8d969a, M.metal);
  c.pave(78.65, 0.15, 4.77, 81.25, 2.2, 4.83, 0xd0dadf, M.verre, { crasse: false });
  if (u < 0.6) c.pave(81.35, 0.15, 4.77, 83.95, 2.2, 4.83, 0xd0dadf, M.verre, { crasse: false });
  else for (let i = 0; i < 5; i++) c.boite(c.entre(0.1, 0.4), 0.01, c.entre(0.1, 0.3), 0xd0dadf, { x: c.entre(81.4, 84), y: 0.07, z: c.entre(5, 6.5), ry: c.hasard() * 3 }, M.lisse, { crasse: false });
  c.pave(83.97, 0.15, 4.85, 84.03, 2.2, 6.55, 0xd0dadf, M.verre, { crasse: false });
  affiche(c, M.enseignes, R.bus, { x: 84.06, y: 1.5, z: 5.7, ry: Math.PI / 2 }, 1.6, 0.35);
  c.pave(79, 0.45, 4.9, 83.6, 0.52, 5.3, 0x8d969a, M.metal);
  for (const x of [79.3, 83.3]) c.pave(x - 0.04, 0, 5.05, x + 0.04, 0.45, 5.15, 0x8d969a, M.metal);
  k.pave(78.3, 2.4, 4.5, 84.3, 2.5, 7.0, 0x9a968c, M.tole);
  b.obstacle(78.6, 4.8, 84, 4.8, "abri de bus");
  b.obstacle(84, 4.8, 84, 6.6, "abri de bus");
  b.obstacle(78.6, 4.8, 78.6, 6.6, "abri de bus");
  // Le poteau « 69 »
  c.pave(85.2, 0, 7.0, 85.3, 2.6, 7.1, 0x8d969a, M.metal);
  c.pave(85.0, 2.2, 7.1, 85.5, 2.7, 7.13, 0x2f6f73, M.satin);
}

function depotSauvage(ctx) {
  const { c, b } = ctx;
  const M = MATS;
  // Le frigo couché, la machine à laver, les pneus, les sacs
  c.boite(0.7, 0.7, 1.7, 0xe6e2d8, { x: 63.5, y: 0.35, z: 24.4, ry: 0.4 }, M.satin);
  c.boite(0.6, 0.05, 1.5, 0x8a8a84, { x: 63.5, y: 0.71, z: 24.4, ry: 0.4 }, M.metal);
  obstacleBoite(b, 63.5, 24.4, 0.7, 1.7, 0.4, "frigo");
  c.boite(0.6, 0.85, 0.6, 0xe6e2d8, { x: 65.6, y: 0.42, z: 23.2, ry: 0.2, rz: 0.1 }, M.satin);
  cyl(c, 0x3a3a3a, M.metal, 65.62, 0.45, 23.52, 0.2, 0.03, { rx: Math.PI / 2 }, G.cyl8);
  for (let i = 0; i < 4; i++) cyl(c, 0x222222, M.mat, 61 + (i % 2) * 0.1, 0.12 + Math.floor(i / 1) * 0.0 + i * 0.22, 22.4, 0.36, 0.22, {}, G.cyl8);
  matelas(c, 66.5, 25.6, 1.2, 1.9, 1.3, 0xa89c7c, 0, 0.2);
  for (let i = 0; i < 6; i++) c.poser(G.ico, M.satin, 0x1e1e1e, { x: 60 + c.entre(0, 7), y: 0.2, z: 21.5 + c.entre(0, 5), ry: c.hasard() * 3, e: [0.35, 0.25, 0.3] });
  jonchee(c, 59, 20.6, 68, 27, 30, [0x9c7a45, 0x7d6143, 0xe9e6dc]);
}

function clairiereTroncon(ctx) {
  const { c, b } = ctx;
  clairiere(ctx);
  abriBus(ctx);
  depotSauvage(ctx);
  // Une épave en travers au bord de la route, couvert près du sentier
  epave(c, 58.5, 12.6, 0.35, 0x7a6a4a, { portiere: true });
  obstacleBoite(b, 58.5, 12.6, 4.4, 1.8, 0.35, "épave");
  panneauRoute(ctx, R.est, 96, 10.45, 0.6);
}

// ---------- Construction d'un tronçon ----------

function recentrer(groupe, dx) {
  const vues = new Set();
  groupe.traverse((o) => {
    if (o.geometry && !vues.has(o.geometry)) {
      vues.add(o.geometry);
      o.geometry.translate(-dx, 0, 0);
    }
  });
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - dx) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - dx };
  }
  const dedans = (x) => Math.abs(x) <= 26;
  ud.obstacles = ud.obstacles.map((s) => ({ ...s, x1: arr(s.x1 - dx), x2: arr(s.x2 - dx), z1: arr(s.z1), z2: arr(s.z2) })).filter((s) => dedans(s.x1) || dedans(s.x2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - dx) })).filter((l) => dedans(l.x));
  return groupe;
}

export function creer({ usure = 0.7, carte = "lisiere" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const M = matieres();
  const dx = def.decalage.x;
  const b = new Batiment(6900 + Math.round(dx), usure);
  const x0 = dx - 25;
  const x1 = dx + 25;
  // Les cimes qui cachent un passage vont dans deux couches (au sud et au nord de la route), bornées au plus juste.
  const canopees = {};
  const canopee = (sud) => {
    const cle = sud ? "sud" : "nord";
    if (!canopees[cle]) {
      const liste = ARBRES.filter((t) => t.cache && t.x >= x0 && t.x < x1 && t.z > ROUTE.z === sud);
      let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
      for (const t of liste) {
        const r = 2.4 * t.s;
        bx0 = Math.min(bx0, t.x - r);
        bx1 = Math.max(bx1, t.x + r);
        bz0 = Math.min(bz0, t.z - r);
        bz1 = Math.max(bz1, t.z + r);
      }
      canopees[cle] = b.couche("cimes-" + cle, { x: arr((bx0 + bx1) / 2), z: arr((bz0 + bz1) / 2), l: arr(bx1 - bx0), p: arr(bz1 - bz0) }, 3, 15);
    }
    return canopees[cle];
  };
  const ctx = { b, c: b.c, u: usure, x0, x1, dans: (x) => x >= x0 && x < x1, canopee };

  sol(ctx);
  route(ctx);
  foret(ctx);
  if (def.id === "lisiere") {
    lisiere(ctx);
    b.lumiere(-58.2, 5.0, 6.4, 0xff5fb0, 8, 16, "néon rose du totem, sur batterie (il grésille)");
    b.lumiere(-72, 3.4, 2.8, 0xff5fb0, 4, 9, "néon de façade du Love Center");
    b.lumiere(-66.7, 2.2, -1.5, 0xff3030, 2.5, 6, "veilleuse rouge des cabines vidéo");
  } else if (def.id === "pont") {
    pont(ctx);
    b.lumiere(-17.75, 1.5, -8.1, 0xffc070, 4, 8, "lanterne de la cabane d'observation");
    b.lumiere(-11, 0.6, 1.5, 0xcfe6ff, 1.5, 5, "balises solaires du sentier");
  } else if (def.id === "aire") {
    aire(ctx);
    b.lumiere(42.0, 1.75, -4.4, 0xffb060, 5, 8, "lampe-tempête du fourgon");
    b.lumiere(24.6, 1.4, 4.6, 0x9fc8ff, 2.5, 6, "écran de la borne de rencontres (il luit encore)");
    b.lumiere(17.6, 1.8, -15.4, 0xff8fc0, 3, 6, "veilleuse rose du Nid Coquin");
  } else {
    clairiereTroncon(ctx);
    b.lumiere(66, 2.5, -27.5, 0xff2a2a, 6, 12, "guirlande rouge sur batterie solaire");
    b.lumiere(80, 2.5, -28.5, 0xff2a2a, 6, 12, "guirlande rouge sur batterie solaire");
  }
  const groupe = b.construire();
  // Le néon grésille : il s'éteint par à-coups
  groupe.traverse((o) => {
    if (o.isMesh && o.material === M.neon) {
      o.userData.animer = (t) => {
        const s = Math.sin(t * 2.3) + Math.sin(t * 5.7 + 1);
        M.neon.emissiveIntensity = s > 1.55 ? (Math.sin(t * 60) > 0 ? 0.2 : 1.0) : 1.4 + 0.08 * Math.sin(t * 90);
      };
    }
  });
  return recentrer(groupe, dx);
}
