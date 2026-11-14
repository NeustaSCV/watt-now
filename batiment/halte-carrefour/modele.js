// La halte du carrefour (route de la Campagne, Book 20 §4 « le carrefour »), danger ●●.
//
// La halte la plus proche du Comptoir du Carrefour (Book 07 §4.1) : une halte d'initiation. Une départementale traverse
// le bocage d'ouest en est et croise une autre route au milieu par un grand rond-point (goulet n° 1), orné d'une
// sculpture absurde : une pile Watty de 6 m en résine qui s'écaille, entourée d'éoliennes miniatures et de nains de
// jardin. Les branches nord et sud du rond-point sont barrées (carcasses, silo effondré) : on ne peut que continuer
// vers l'est, sous la voie rapide, par un pont-cadre de béton sombre (goulet n° 2). À l'écart : le relais « Les
// Routiers du Carrefour » et son parking à camions, la ferme isolée d'en face et sa grange, l'abribus, l'aire de
// covoiturage autonome, la chapelle et son calvaire, les silos de la coopérative, la jardinerie-animalerie et ses
// serres crevées, la concession aux trois tracteurs jamais livrés.
//
// Technique (comme le péage) : tout est bâti dans le « repère de la halte » (200 × 70 m, origine au centre, +x à l'est,
// +z au sud), puis chaque tronçon de 50 m ne garde que ce qui tombe dans sa bande de x et se recentre. Le sol est une
// grille de 2 m (raccords exacts aux frontières, multiples de 2) ; le hasard des éléments continus vient d'un bruit
// indexé sur la position.

import * as THREE from "three";
import { Batiment, PALETTE, mur, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre, flaque, lierre, toitDeuxPans } from "../commun/atelier.js";
import { R, AL, AH } from "./atlas.js";
import { lisse, mix, arr, bruit, bruitXZ, bruitLisse, teinte, matieres, coucheStricte, panneau, panneauDouble, barre, obstacleBoite, poserBrut, poserTriangles, recentrer } from "./outils.js";
import { COUL, COUL_AUTO, COUL_TOLE, GEO, voiture, fourgon, semiRemorque, porteurEncastre, tracteur, nain, eolienne, rotorAnime, botte, palette, pneus, cone, jersey, sacs, brasero, feuDeCamp, lanterne, bougie, caisse, conserves, tableNappee, haie, clotureElectrique, poteauTelephone, friche } from "./objets.js";

import { W, RP, VR, RELAIS, GRANGE, MAISON, CHAPELLE, CALVAIRE, COVOIT, SILOS, SILO_TOMBE, MAGASIN, SERRE, CONCESSION, BUREAU, ABRIBUS, FOSSES, remblai, hauteur, ZS, C } from "./plan.js";
import { CONSTRUCTEURS } from "./lieux.js";

// ---------- Le sol ----------

function dansRect(x, z, x0, x1, z0, z1) {
  return x >= x0 && x <= x1 && z >= z0 && z <= z1;
}

function couleurSol(x, z, y, n) {
  const r = Math.hypot(x - RP.x, z - RP.z);
  if (r < RP.ro + 1.5) return n < 0.5 ? 0x8f8a7c : 0x9a9484;
  const az = Math.abs(z);
  // la route et ses accotements de gravillons
  if (az < W + 1.1 && !(x > VR.a && x < VR.d && false)) return n < 0.5 ? 0x9a9484 : 0xa29c8e;
  // les fossés : herbe grasse, boue (une bande nette le long de chaque fossé)
  if (FOSSES.some(([zf, x0, x1]) => x > x0 + 1 && x < x1 - 1 && Math.abs(z - zf) < 1.4)) return n < 0.4 ? 0x5f7a45 : n < 0.8 ? 0x6a7a4a : 0x6a5a40;
  // le remblai de la voie rapide : herbe sèche, ronces
  if (remblai(x) > 0.3 && az > VR.couloir) return n < 0.35 ? 0x9aa65e : n < 0.7 ? 0x8a9a52 : n < 0.88 ? 0x7a8a4a : 0xa89a62;
  // le couloir du pont-cadre
  if (x > VR.a && x < VR.d && az <= VR.couloir) return 0x8a867c;
  // les parkings et les cours
  if (dansRect(x, z, -100, -81, -32, -9)) return n < 0.6 ? C.gravier : 0x8f8a7e; // parking des camions
  if (dansRect(x, z, -81, -56, -12.5, -8)) return n < 0.6 ? 0xa39c8c : C.gravier; // terrasse du relais
  if (dansRect(x, z, -76, -55, 9, 23)) return n < 0.5 ? C.terreBattue : n < 0.85 ? 0x8a7a58 : 0x7d8a4e; // cour de ferme
  if (dansRect(x, z, -68, -63, 4.6, 9)) return C.terreBattue; // le chemin de la ferme
  if (dansRect(x, z, COVOIT.x0, COVOIT.x1, COVOIT.z0, COVOIT.z1)) return 0x8f8a80;
  if (dansRect(x, z, 2, 48, -16, -4.6)) return n < 0.7 ? 0x8f8a80 : 0x9a9488; // parking de la jardinerie
  if (dansRect(x, z, 4, 32, 10, 31)) return n < 0.6 ? C.gravier : 0x8a9a5a; // aire de la concession
  if (dansRect(x, z, -50, -30, 20, 33)) return n < 0.5 ? 0x9a9078 : 0x8a8a62; // pied des silos
  if (dansRect(x, z, -48, -35, -32, -19)) return n < 0.6 ? 0x7f9a52 : 0x8aa05a; // enclos de la chapelle
  // les champs redevenus friches et les prés
  const friche = (z > 9 && ((x > 30 && x < 56) || (x > 88))) || (z > 26 && x < -96);
  if (friche) return n < 0.35 ? 0x9a9a5a : n < 0.7 ? 0xa8a466 : 0x8a8a52;
  return n < 0.3 ? PALETTE.herbeSombre : n < 0.72 ? 0x6d8d4c : n < 0.9 ? 0x89985a : 0x9aa65e;
}

/** Une grille de relief colorée (une matière), de x0 à x1, sur les lignes ZS ; `filtre(x, z)` garde ou non une case. */
function grille(c, M, x0, x1, hf, filtre, coul) {
  const pas = 2;
  const pos = [];
  const col = [];
  const tmp = new THREE.Color();
  const pousser = (t, hex, v) => {
    tmp.setHex(hex);
    tmp.offsetHSL(0, 0, v);
    for (const p of t) {
      pos.push(p[0], p[1], p[2]);
      col.push(tmp.r, tmp.g, tmp.b);
    }
  };
  const P = (x, z) => [x, hf(x, z), z];
  for (let x = x0; x < x1 - 1e-6; x += pas)
    for (let j = 0; j < ZS.length - 1; j++) {
      const z = ZS[j];
      const z2 = ZS[j + 1];
      if (!filtre(x + pas / 2, (z + z2) / 2)) continue;
      const a = P(x, z);
      const b2 = P(x + pas, z);
      const c2 = P(x + pas, z2);
      const d = P(x, z2);
      const diag = (Math.round(x / pas) + j) % 2 === 0;
      const tris = diag ? [[a, d, c2], [a, c2, b2]] : [[a, d, b2], [d, c2, b2]];
      tris.forEach((t, k) => {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
        const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
        const cz = (t[0][2] + t[1][2] + t[2][2]) / 3;
        const n = Math.min(0.999, Math.max(0, 0.78 * bruitLisse(cx, cz, 1, 7) + 0.22 * bruit(Math.round(x), Math.round(z * 10), k)));
        pousser(t, coul(cx, cz, cy, n), (bruit(Math.round(x), Math.round(z * 10), k + 7) - 0.5) * 0.035);
      });
    }
  poserBrut(c, pos, col, M.mat);
  return { pousser, P };
}

function sol(ctx) {
  const { c, X0, X1, M, b } = ctx;
  grille(c, M, X0, X1, (x, z) => hauteur(x, z, false), () => true, couleurSol);
  // Jupes sur le pourtour du tronçon : on ne voit jamais le vide sous le terrain
  const pos = [];
  const col = [];
  const terre = new THREE.Color(0x6f5a42);
  const tri = (A, B2, C2) => {
    pos.push(...A, ...B2, ...C2);
    col.push(terre.r, terre.g, terre.b, terre.r, terre.g, terre.b, terre.r, terre.g, terre.b);
  };
  const bas = -2;
  const P = (x, z) => [x, hauteur(x, z, false), z];
  for (let j = 0; j < ZS.length - 1; j++) {
    const z = ZS[j];
    const z2 = ZS[j + 1];
    for (const [x, s] of [[X0, 1], [X1, -1]]) {
      const A = P(x, z);
      const D = P(x, z2);
      const B2 = [x, bas, z];
      const C2 = [x, bas, z2];
      if (s > 0) tri(A, B2, C2), tri(A, C2, D);
      else tri(A, C2, B2), tri(A, D, C2);
    }
  }
  for (let x = X0; x < X1 - 1e-6; x += 2) {
    for (const [z, s] of [[-35, 1], [35, -1]]) {
      const A = P(x, z);
      const B2 = P(x + 2, z);
      const C2 = [x + 2, bas, z];
      const D = [x, bas, z];
      if (s > 0) tri(A, B2, C2), tri(A, C2, D);
      else tri(A, C2, B2), tri(A, D, C2);
    }
  }
  poserBrut(c, pos, col, M.mat);
  // La moitié sud du remblai : une couche qui s'efface quand on passe sous la voie rapide
  if (X1 > VR.a && X0 < VR.d) {
    const k = ctx.voieRapide;
    grille(k, M, Math.max(X0, VR.a - 2), Math.min(X1, VR.d + 2), (x, z) => hauteur(x, z, true), (x, z) => z > VR.couloir && remblai(x) > 0, couleurSol);
  }
  // Les obstacles du remblai : son pied, de part et d'autre du couloir
  if (ctx.ici(VR.a)) {
    b.obstacle(VR.a, -35, VR.a, -VR.couloir, "remblai de la voie rapide");
    b.obstacle(VR.a, VR.couloir, VR.a, 35, "remblai de la voie rapide");
  }
  if (ctx.ici(VR.d)) {
    b.obstacle(VR.d, -35, VR.d, -VR.couloir, "remblai de la voie rapide");
    b.obstacle(VR.d, VR.couloir, VR.d, 35, "remblai de la voie rapide");
  }
}

// ---------- La route ----------

/** Pousse un triangle dont la face regarde vers le haut (ordre des sommets corrigé au besoin). */
function triHaut(pos, A, B2, C2) {
  const ny = (B2[2] - A[2]) * (C2[0] - A[0]) - (B2[0] - A[0]) * (C2[2] - A[2]);
  if (ny >= 0) pos.push(...A, ...B2, ...C2);
  else pos.push(...A, ...C2, ...B2);
}

function bande(pos, xa, xb, za, zb, y) {
  pos.push(xa, y, za, xa, y, zb, xb, y, zb, xa, y, za, xb, y, zb, xb, y, za);
}

function chaussee(ctx) {
  const { c, X0, X1, M, u } = ctx;
  const pos = [];
  const y = 0.03;
  // la départementale, d'ouest en est (elle s'arrête sous l'anneau du rond-point)
  for (let x = X0; x < X1 - 1e-6; x += 2) {
    const xm = x + 1;
    if (xm > RP.x - RP.ro + 1.5 && xm < RP.x + RP.ro - 1.5) continue;
    bande(pos, x, x + 2, -W, W, y);
  }
  // les branches nord et sud, barrées
  if (ctx.ici(RP.x)) {
    bande(pos, RP.x - W, RP.x + W, -35, -RP.ro + 1.5, y);
    bande(pos, RP.x - W, RP.x + W, RP.ro - 1.5, 35, y);
    // l'anneau : un disque d'enrobé (l'îlot se pose dessus)
    const n = 48;
    for (let i = 0; i < n; i++) {
      const a1 = (i / n) * Math.PI * 2;
      const a2 = ((i + 1) / n) * Math.PI * 2;
      pos.push(RP.x, 0.045, RP.z, RP.x + Math.cos(a2) * RP.ro, 0.045, RP.z + Math.sin(a2) * RP.ro, RP.x + Math.cos(a1) * RP.ro, 0.045, RP.z + Math.sin(a1) * RP.ro);
    }
    // l'entrée évasée de chaque branche (deux triangles qui raccordent la route à l'anneau)
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const tx = -dz;
      const tz = dx;
      const d1 = RP.ro - 2;
      const d2 = RP.ro + 3;
      const p = (d, l) => [RP.x + dx * d + tx * l, 0.04, RP.z + dz * d + tz * l];
      for (const s of [-1, 1]) {
        const A = p(d1, s * (W + 2.5));
        const B2 = p(d2, s * W);
        const C2 = p(d1, s * W);
        triHaut(pos, A, B2, C2);
      }
    }
  }
  poserTriangles(c, pos, M.asphalte, COUL.asphalte);
  // Nids-de-poule, flaques, herbes dans les fissures (par cases de 6 m)
  for (let x = Math.ceil(X0 / 6) * 6; x < X1; x += 6)
    for (const z of [-2, 1.5]) {
      if (Math.hypot(x - RP.x, z) < RP.ro + 2) continue;
      if (x > VR.cadre0 && x < VR.cadre1) continue;
      const n = bruitXZ(x, z, 3);
      if (n < 0.06 + u * 0.08) flaque(c, x + n * 20 - 1, z, 0.6 + n * 5);
      else if (n > 0.8 - u * 0.25) touffes(c, [[x + (n - 0.5) * 4, z], [x + (n - 0.5) * 4 + 0.5, z + 0.3]]);
    }
}

/** Les marquages : axe en tirets, lignes de rive usées, cédez-le-passage, îlots séparateurs. */
function marquages(ctx) {
  const { c, X0, X1, M, u, b } = ctx;
  const blanc = [];
  const y = 0.05;
  for (let x = Math.ceil(X0 / 13) * 13; x < X1; x += 13) {
    if (x > RP.x - RP.ro - 13 && x < RP.x + RP.ro + 1) continue;
    if (bruitXZ(x, 0, 41) < u * 0.35) continue;
    bande(blanc, x, Math.min(x + 3, X1), -0.07, 0.07, y);
  }
  for (let x = Math.ceil(X0 / 4) * 4; x < X1; x += 4) {
    if (x > RP.x - RP.ro - 2 && x < RP.x + RP.ro + 2) continue;
    for (const s of [-1, 1]) {
      if (bruitXZ(x, s, 42) < 0.2 + u * 0.4) continue;
      bande(blanc, x, Math.min(x + 3.2, X1), s * (W - 0.25) - 0.06, s * (W - 0.25) + 0.06, y);
    }
  }
  if (ctx.ici(RP.x)) {
    // la ligne intérieure de l'anneau, les cédez-le-passage (tirets en travers des voies d'entrée)
    const n = 64;
    for (let i = 0; i < n; i += 2) {
      const a1 = (i / n) * Math.PI * 2;
      const a2 = ((i + 1) / n) * Math.PI * 2;
      const r1 = RP.ri + 0.5;
      const r2 = RP.ri + 0.65;
      const p = (a, r) => [RP.x + Math.cos(a) * r, 0.06, RP.z + Math.sin(a) * r];
      const A = p(a1, r1), B2 = p(a2, r1), C2 = p(a2, r2), D = p(a1, r2);
      triHaut(blanc, A, C2, B2);
      triHaut(blanc, A, D, C2);
    }
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const tx = -dz;
      const tz = dx;
      // voie entrante : à droite en arrivant (on roule à droite)
      for (let l = 0.3; l < W; l += 0.7) {
        const s = dx !== 0 ? -dx : -dz;
        const lc = s * (l + 0.15);
        const cx = RP.x + dx * (RP.ro + 0.2) + tx * lc;
        const cz = RP.z + dz * (RP.ro + 0.2) + tz * lc;
        const hx = dx !== 0 ? 0.15 : 0.25;
        const hz = dx !== 0 ? 0.25 : 0.15;
        bande(blanc, cx - hx, cx + hx, cz - hz, cz + hz, 0.065);
      }
      // l'îlot séparateur : un long triangle en bordure surélevée, peint
      const d0 = RP.ro + 0.8;
      const d1 = RP.ro + 11;
      c.repere({ x: RP.x + dx * d0, y: 0, z: RP.z + dz * d0, ry: -Math.atan2(dz, dx) }, () => {
        const g = new THREE.Shape([new THREE.Vector2(0, -1.1), new THREE.Vector2(d1 - d0, -0.05), new THREE.Vector2(d1 - d0, 0.05), new THREE.Vector2(0, 1.1)]);
        const geo = new THREE.ExtrudeGeometry(g, { depth: 0.16, bevelEnabled: false }).rotateX(-Math.PI / 2);
        c.poser(geo, M.satin, 0xd8d4c8, { y: 0.03 }, { crasse: false });
        geo.dispose();
        c.boite(0.5, 0.02, 1.6, 0xe6e2d4, { x: 0.6, y: 0.2 }, M.satin, { crasse: false });
        for (let k = 1; k < 4; k++) c.boite(0.25, 0.02, 1.8 - k * 0.45, k % 2 ? 0xc8362b : 0xe6e2d4, { x: 1 + k * 2.2, y: 0.2 }, M.satin, { crasse: false });
      });
      // le panneau « cédez le passage » sur l'îlot (triangle pointe en bas, bord rouge)
      const px = RP.x + dx * (d0 + 1.2);
      const pz = RP.z + dz * (d0 + 1.2);
      c.tube([px, 0, pz], [px, 2.2, pz], 0.04, 0x9a9a92, M.metal, 5);
      const tri = new THREE.Shape([new THREE.Vector2(-0.45, 0.35), new THREE.Vector2(0.45, 0.35), new THREE.Vector2(0, -0.42)]);
      const tg = new THREE.ShapeGeometry(tri);
      const penche = bruitXZ(px, pz, 2) < u * 0.5 ? 0.35 : 0;
      c.poser(tg, M.satin, 0xc8362b, { x: px, y: 2.15, z: pz, ry: Math.atan2(dx, dz), rz: penche }, { crasse: false });
      const tg2 = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.3, 0.26), new THREE.Vector2(0.3, 0.26), new THREE.Vector2(0, -0.26)]));
      c.poser(tg2, M.satin, 0xeeeae0, { x: px + dx * 0.01, y: 2.15, z: pz + dz * 0.01, ry: Math.atan2(dx, dz), rz: penche }, { crasse: false });
      tg.dispose();
      tg2.dispose();
    }
  }
  poserTriangles(c, blanc, M.satin, COUL.marquage);
}

// ---------- Les bords : haies, fossés, clôtures, poteaux ----------

function bords(ctx) {
  const { c, M, u, b } = ctx;
  // Les haies bocagères des deux lisières : on comprend tout de suite que la route est le seul passage
  for (const z of [-33.4, 33.4]) {
    haie(ctx, -100, z, VR.a - 1, z + (z > 0 ? -0.3 : 0.3), { ep: 3.2, h: 3.4 });
    haie(ctx, VR.d + 1, z, 100, z, { ep: 3.2, h: 3.4 });
  }
  // Les haies le long de la route (là où rien ne s'ouvre)
  const routieres = [
    [-56.5, -9.6, -48.5, -9.6],
    [44, -9.3, VR.a - 1, -9.3],
    [VR.d + 1, -9.3, 100, -9.3],
    [-100, 9.2, -92, 9.2],
    [-58, 9.2, -36, 9.2],
    [30, 9.2, VR.a - 1, 9.2],
    [VR.d + 1, 9.2, 100, 9.2],
  ];
  for (const [xa, za, xb, zb] of routieres) haie(ctx, xa, za, xb, zb, { ep: 2.2, h: 2.6 });
  // Les haies qui bordent les branches barrées du rond-point (on ne passe pas à côté des barricades)
  for (const s of [-1, 1]) {
    haie(ctx, RP.x - 7.5, s * 19, RP.x - 7.5, s * (s > 0 ? 21.5 : 33), { ep: 2.2, h: 2.8 });
    if (s > 0) haie(ctx, RP.x - 7.5, 27.5, RP.x - 7.5, 33, { ep: 2.2, h: 2.8 });
    haie(ctx, RP.x + 7.5, s * 19, RP.x + 7.5, s * 33, { ep: 2.2, h: 2.8 });
  }
  // La lisière nord du pré de la chapelle et des silos : une haie basse qui ferme l'arrière des lieux
  haie(ctx, -50, -19, -50, -32, { ep: 2, h: 2.4 });
  haie(ctx, -50, 19, -50, 32, { ep: 2, h: 2.4 });
  haie(ctx, 48, -9.3, 48, -32, { ep: 2, h: 2.6, arbres: false });
  // Les clôtures électriques mortes des prés et des champs
  clotureElectrique(ctx, 31, 11.5, 56, 11.5);
  clotureElectrique(ctx, 31, 11.5, 31, 31);
  clotureElectrique(ctx, VR.d + 2, 11.5, 100, 11.5);
  clotureElectrique(ctx, -100, 11.5, -95, 11.5);
  // Les poteaux téléphoniques du bord sud (tous les 25 m ; les fils pendent là où un poteau manque)
  const poteaux = [-87.5, -62.5, -37.5, 12.5, 37.5, 92.5];
  poteaux.forEach((x, i) => {
    if (!ctx.ici(x)) return;
    const z = 7.6;
    const pench = (bruitXZ(x, z, 8) - 0.5) * 0.5 + (i === 2 ? 0.9 : 0);
    poteauTelephone(ctx, x, z, null, { penche: pench });
    for (const s of [-1, 1]) {
      const voisin = poteaux.includes(x + s * 25);
      const xm = x + s * 12.5;
      for (const dz of [-0.4, 0.4]) {
        if (voisin) barre(c, [x + pench, 6.65, z + dz], [xm, 6.05, z + dz], 0.015, 0.015, 0x2a2a28, M.metal);
        else {
          barre(c, [x + pench, 6.65, z + dz], [x + s * 4, 2.5, z + dz + 0.6], 0.015, 0.015, 0x2a2a28, M.metal);
          barre(c, [x + s * 4, 2.5, z + dz + 0.6], [x + s * 5.5, 0.05, z + dz + 1.2], 0.015, 0.015, 0x2a2a28, M.metal);
        }
      }
    }
  });
  // Les buses sous les chemins (bouts de tuyaux de béton dans les fossés)
  for (const [x, z] of [[-70.6, 6], [-35.4, 6], [56.4, 6], [29.4, 6]]) if (ctx.ici(x)) c.tube([x - 0.4, -0.35, z - 0.9], [x - 0.4, -0.35, z + 0.9], 0.38, 0xa8a49a, M.mat, 8);
  // Herbes folles des accotements
  for (let x = Math.ceil(ctx.X0 / 3) * 3; x < ctx.X1; x += 3) {
    if (Math.hypot(x - RP.x, 0) < RP.ro + 2) continue;
    if (x > VR.a && x < VR.d) continue;
    for (const s of [-1, 1]) if (bruitXZ(x, s, 51) < 0.55 + u * 0.3) touffes(c, [[x + bruitXZ(x, s, 52) * 2, s * (W + 0.5 + bruitXZ(x, s, 53) * 0.8)]], bruitXZ(x, s, 54) < 0.5 ? PALETTE.herbeSeche : PALETTE.herbe);
  }
}

// ---------- Les panneaux des deux bouts ----------

function poteauxPanneau(ctx, x, z, h, l, k) {
  const { M } = ctx;
  const c = k ?? ctx.c;
  for (const s of [-1, 1]) c.tube([x + s * l * 0.35, 0, z - 0.06], [x + s * l * 0.35, h, z - 0.06], 0.05, 0x8a8e8a, M.metal, 6);
}

function panneauxExtremites(ctx) {
  const { c, M } = ctx;
  if (ctx.ici(-96)) {
    poteauxPanneau(ctx, -96, -6.2, 2.6, 3.2);
    panneauDouble(c, M.enseignes, R.panneauOuest, { x: -96, y: 2.2, z: -6.2 }, 3.2, 0.8);
  }
  if (ctx.ici(-84)) {
    // le panneau des Compteurs, planté là où commence la route : tamponné, propre, presque neuf
    poteauxPanneau(ctx, -84, 6.3, 2.7, 3.0);
    panneauDouble(c, M.enseignes, R.comptoir, { x: -84, y: 2.0, z: 6.3, ry: -0.12 }, 3.0, 1.5);
    c.boite(3.1, 0.08, 0.2, 0x2f4f7a, { x: -84, y: 2.8, z: 6.3, ry: -0.12 }, M.satin);
  }
  if (ctx.ici(96)) {
    poteauxPanneau(ctx, 96, 6.3, 2.6, 3.2);
    panneauDouble(c, M.enseignes, R.panneauEst, { x: 96, y: 2.2, z: 6.3 }, 3.2, 0.8);
  }
}

// ---------- La fiche ----------

const TRONCONS = [
  { id: "relais", nom: "1 · Le relais routier", x: -75, description: "l'entrée de la halte : le relais « Les Routiers du Carrefour » et son parking à camions, l'abribus, la ferme isolée d'en face et sa grange" },
  { id: "rond-point", nom: "2 · Le grand rond-point", x: -25, description: "le rond-point (goulet n° 1) et sa pile Watty géante, les branches barrées (carcasses au nord, silo effondré au sud), la chapelle et son calvaire, l'aire de covoiturage autonome, les silos de la coopérative" },
  { id: "jardinerie", nom: "3 · La jardinerie", x: 25, description: "la jardinerie-animalerie Jardi-Abondance et ses serres crevées, la concession aux trois tracteurs jamais livrés et son bureau préfabriqué, les champs de maïs en friche" },
  { id: "pont-cadre", nom: "4 · Le pont-cadre", x: 75, description: "la voie rapide en remblai, le pont-cadre de béton sombre (goulet n° 2) bouché par un camion encastré et des voitures coincées, le feu des survivants, la sortie vers la campagne" },
];

const FOUILLE = [
  // 1 · Le relais
  { x: -66, z: -24, quoi: "cuisine du relais : conserves, sel, huile, un couteau de chef, une marmite" },
  { x: -63.4, z: -17.5, quoi: "bar : bouteilles (alcool : désinfecter, troquer), sucre, un tire-bouchon" },
  { x: -77, z: -24, quoi: "couloir des douches : savons, serviettes, trousse de secours murale" },
  { x: -73.5, z: -14.5, quoi: "salle : nappes à carreaux (tissu), couverts, bougies" },
  { x: -81.4, z: -20.4, quoi: "remorque ouverte : cartons de boissons sucrées « Watty Fizz » (presque rien de nourrissant)" },
  { x: -88, z: -25.8, quoi: "semi bâché : palettes filmées de couches et de croquettes, sangles, bâche" },
  { x: -97.5, z: -18.8, quoi: "cabine du camion : couchette, couverture, lampe, carte routière" },
  { x: -52, z: -7.2, quoi: "abribus : un sac oublié sous le banc (vêtements, une gourde)" },
  { x: -88, z: 18, quoi: "grange : outils agricoles (fourche, faux, serpe), ficelle, un fût" },
  { x: -80, z: 22.5, quoi: "grange : sacs de grain (nourriture, semences), foin" },
  { x: -66.5, z: 16, quoi: "puits de la ferme : un seau, de la corde, une poulie" },
  // 2 · Le rond-point
  { x: -16, z: 2.4, quoi: "pied de la sculpture : nains de jardin (plâtre), une plaque de laiton, des éoliennes miniatures (petits moteurs, aimants)" },
  { x: -42, z: -27, quoi: "chapelle : cierges (cire), nappe d'autel (lin), un tronc à offrandes" },
  { x: -36.6, z: -10.6, quoi: "borne de covoiturage : écran, carte électronique, petite batterie qui tient encore" },
  { x: -42, z: 24.5, quoi: "pied des silos : grain gâté et grain sain mêlés, sacs de jute, une pelle" },
  { x: -18, z: -26, quoi: "barricade nord : coffre d'une épave (jerrican vide, triangle, câble de remorquage)" },
  // 3 · La jardinerie
  { x: 31, z: -22, quoi: "rayon graines : sachets de semences (tomates, haricots, courges), précieux pour les Mécanistes" },
  { x: 38, z: -29, quoi: "réserve : sacs d'engrais (salpêtre), terreau, arrosoirs" },
  { x: 41.5, z: -21.5, quoi: "animalerie : sacs de croquettes, pompes d'aquarium, cages (grillage)" },
  { x: 24.8, z: -22, quoi: "outils de jardin : bêche, sécateur, râteau, tuyau d'arrosage" },
  { x: 14, z: -13.5, quoi: "palettes de terreau et de paillage devant les serres" },
  { x: 36.5, z: 16, quoi: "bureau de la concession : clés des tracteurs, manuels, une calculatrice solaire" },
  { x: 17, z: 22, quoi: "tracteur neuf jamais livré : batterie, filtres, gasoil dans le réservoir (un peu)" },
  // 4 · Le pont-cadre
  { x: 57.6, z: 2.0, quoi: "camion encastré : caisse éventrée (cartons de vaisselle, bâches)" },
  { x: 76, z: -3.2, quoi: "camp des survivants : couvertures, réchaud, une marmite (on partage, on ne prend pas)" },
  { x: 72, z: 2.6, quoi: "voiture coincée sous le pont : boîte à gants, chargeur à manivelle" },
  { x: 92, z: -4.8, quoi: "épave poussée au bas-côté : roue de secours, cric" },
];
const ETEINTS = [
  { x: -68, z: -25.5, type: "ancien habitant : le cuisinier du relais, tablier et toque, dans la cuisine" },
  { x: -86, z: -23.8, type: "errant (entre les deux semi-remorques)" },
  { x: -91, z: 22.5, type: "rampant (dans le foin de la grange)" },
  { x: -6, z: 9, type: "errant (sur l'anneau du rond-point, entre les épaves)" },
  { x: -42, z: -29, type: "ancien habitant : le sacristain, assis au premier rang" },
  { x: 40.5, z: -24, type: "ancien habitant : le vendeur de l'animalerie, gilet vert" },
  { x: 12, z: -27, type: "errant (dans les serres)" },
  { x: 44, z: 26, type: "putréfié (couché dans le maïs)" },
  { x: 59, z: 4.2, type: "rampant (sous le camion encastré)" },
];
const ENTREES = [
  { x: -100, z: 0, nature: "entrée A : la départementale, depuis le Comptoir du Carrefour et ton terrain" },
  { x: -88, z: -9, nature: "le parking des camions (ouvert sur la route)" },
  { x: -70, z: -12, nature: "la porte du relais, par la terrasse" },
  { x: -60, z: -24, nature: "la porte de service de la cuisine (côté est)" },
  { x: -65.5, z: 8.6, nature: "le chemin de la ferme (buse sous le fossé)" },
  { x: -76, z: 19, nature: "les grands portails de la grange" },
  { x: -42, z: -21, nature: "la porte de la chapelle" },
  { x: 34, z: -16, nature: "l'entrée vitrée de la jardinerie (portes coulissantes forcées)" },
  { x: 21, z: -24, nature: "la porte des serres" },
  { x: 36.5, z: 18.5, nature: "le bureau préfabriqué de la concession" },
  { x: 100, z: 0, nature: "sortie B : la départementale vers le village, la coopérative et les Mécanistes" },
];

const CARTES = TRONCONS.map((t) => {
  const dans = (p) => p.x >= t.x - 25 && (p.x < t.x + 25 || (t.x === 75 && p.x <= 100));
  const local = (liste) => liste.filter(dans).map((p) => ({ ...p, x: arr(p.x - t.x), z: arr(p.z) }));
  const departs = { relais: { x: -97, z: 1.5 }, "rond-point": { x: -47, z: 1.5 }, jardinerie: { x: 3, z: 1.5 }, "pont-cadre": { x: 52, z: 1.5 } };
  const d = departs[t.id];
  return {
    id: t.id,
    nom: t.nom,
    lot: { l: 50, p: 70 },
    decalage: { x: t.x, z: 0 },
    depart: { x: arr(d.x - t.x), z: d.z },
    description: t.description,
    solPropre: true,
    entrees: local(ENTREES),
    fouille: local(FOUILLE),
    eteints: local(ETEINTS),
  };
});

export const FICHE = {
  id: "halte-carrefour",
  nom: "Halte · Le carrefour",
  lieu: "Halte · route de la Campagne · à deux kilomètres du Comptoir du Carrefour",
  environnement: "campagne (bocage, départementale, rond-point)",
  anneau: "proche",
  danger: 2,
  halte: true,
  solPropre: true,
  recit:
    "Le Département avait promis un rond-point intelligent, « fluidité garantie par IA » ; la Compagnie avait offert la sculpture, une pile de six mètres qui sourit encore à des voitures qui ne tourneront plus. Les deux autres routes sont barrées, alors tout le monde passe par ici : c'est la halte la plus proche du Comptoir, celle où l'on apprend à croiser un inconnu sans lâcher son sac. Le néon des Routiers clignote toujours la nuit, sur batterie : quelqu'un, quelque part, tient à ce que le relais ait l'air ouvert.",
  inspiration: "les ronds-points de la France périphérique et leurs sculptures improbables ; les relais routiers de nationale, nappes à carreaux et menu ouvrier ; le bocage normand et breton ; les ponts-cadres en béton sous les voies rapides",
  reperes: [
    "Le grand rond-point et sa pile Watty de 6 m en résine qui s'écaille, ses éoliennes miniatures (une tourne encore), ses nains de jardin, sa plaque « Offert par la Compagnie — L'énergie de nos territoires »",
    "Le panneau « Rond-point intelligent : fluidité garantie par IA », tagué « BOUCHÉ » ; les îlots séparateurs, les cédez-le-passage tordus",
    "Les deux branches barrées : la barricade de carcasses au nord (« ROUTE BARRÉE », « PAS PAR LÀ »), le silo de la coopérative tombé en travers au sud",
    "Le relais « Les Routiers du Carrefour » : néon rouge et bleu sur batterie, salle aux nappes à carreaux, bar et ses prix (« Wi-Fi Premium 9,99/h »), cuisine, escalier effondré vers les chambres",
    "Le parking à camions et ses deux semi-remorques, l'abribus de la ligne 12 (« prochain passage : JAMAIS »)",
    "La ferme d'en face : la grange de pierre visitable (foin, vieux tracteur, outils), la maison murée tamponnée « INVENTORIÉ — VIDE » par les Compteurs",
    "La chapelle de carrefour et son calvaire, une bougie toujours allumée ; l'aire de covoiturage autonome et sa borne (« votre conducteur arrive dans 1 284 jours »)",
    "La jardinerie-animalerie Jardi-Abondance : serres crevées, sacs de terreau, sachets de graines, aquariums vides, « kit potager connecté » dont l'écran luit encore",
    "La concession Agri-Connect et ses trois tracteurs autonomes neufs, sous leur film plastique, jamais livrés",
    "Le pont-cadre sous la voie rapide : le camion encastré sous le gabarit, les voitures coincées, le feu des survivants (« FEU = AMIS »)",
    "Le panneau des Compteurs à l'entrée : « Comptoir du Carrefour · 2 km », tampons « VU · CELLULE 7 » et « ROUTE SÛRE ? NON GARANTI »",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -97, z: 1.5 },
  cartes: CARTES,
  goulets: [
    { x: RP.x, z: RP.z, nature: "le grand rond-point : on tourne autour de la sculpture, à découvert, entre les épaves et les îlots (les deux autres branches sont barrées)" },
    { x: 73, z: 0, nature: "le pont-cadre sous la voie rapide : un couloir de béton de 10 m de large, à demi bouché par un camion encastré et des voitures" },
  ],
  panneaux: [
    { x: -96, z: -6.2, texte: "Village · Coopérative · Moulin des Mécanistes → (D 12)" },
    { x: -84, z: 6.3, texte: "← Comptoir du Carrefour · 2 km (panneau des Compteurs, tamponné)" },
    { x: 96, z: 6.3, texte: "← Comptoir du Carrefour 2 · Ton terrain" },
  ],
  notes: "Lumières : néon des Routiers (rouge et bleu) et lanterne du bar au tronçon 1 ; bougie du calvaire et écran de la borne au tronçon 2 ; écran du kit potager et lanterne du bureau au tronçon 3 ; feu et lanterne des survivants au tronçon 4.",
};

// ---------- Construction ----------

export function creer({ usure = 0.7, carte = "relais" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const X0 = def.decalage.x - 25;
  const X1 = def.decalage.x + 25;
  const b = new Batiment(5200 + CARTES.indexOf(def) * 31, usure);
  const M = matieres();
  const uvAtlas = (g, r) => {
    const uv = g.attributes.uv;
    const [px, py, pw, ph] = r;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  };
  const ctx = { b, c: b.c, u: usure, M, X0, X1, R, uvAtlas, ici: (x) => x >= X0 && (x < X1 || (X1 >= 100 && x <= X1)) };
  if (X1 > VR.a && X0 < VR.d) ctx.voieRapide = coucheStricte(b, "voie rapide (moitié sud)", { x: (VR.a + VR.d) / 2, z: 18, l: VR.d - VR.a + 2, p: 36 }, 1.2, VR.h + 2.2, [M.mat, M.beton, M.asphalte, M.tole, M.satin, M.enseignes]);

  sol(ctx);
  chaussee(ctx);
  marquages(ctx);
  bords(ctx);
  panneauxExtremites(ctx);
  for (const f of CONSTRUCTEURS) f(ctx);

  const groupe = b.construire();
  return recentrer(groupe, { x: def.decalage.x, z: 0 }, def.lot);
}

