// Le Comptoir du Carrefour (Book 21 §5.2.4, moment-vitrine n° 5) : « le seul endroit du monde où brille une
// lumière électrique blanche en continu ». L'ancienne agence de la Compagnie, son guichet grillagé, ses sacs de
// sable, ses cellules numérotées, et Watty — la mascotte de la Compagnie — au-dessus du guichet des Compteurs.
// Ici, rien n'est en ruine : les Compteurs entretiennent. Fenêtres allumées, panneaux solaires propres, éolienne
// qui tourne, drapeau, file d'attente tenue par une corde : l'ordre et l'énergie, au milieu d'un monde éteint.

import * as THREE from "three";
import { Compteur } from "./compteur.ts";
import { CARREFOUR, CHEMIN_COOP, COMPTOIR, ROUTE_CARREFOUR } from "../../../commun/src/lieux.ts";
import type { SourceLumiere } from "./lumieres.ts";
import { PALETTE, aleatoire, materiau } from "./materiaux.ts";
import { Chantier, dessiner, geoToleOndulee, matiere, matiereTexture, textureAffiche, textureEnduit, textureToitPlat } from "./ruine.ts";
import { bruit, creerArbres, creerPanneauRoute, type PlaceArbre } from "./terrain.ts";

const L = CARREFOUR.largeur;
const P = CARREFOUR.profondeur;
const BLANC_ELECTRIQUE = 0xf4f8ff;

function ombre<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function boite(l: number, h: number, p: number, couleur: number | THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = ombre(new THREE.Mesh(new THREE.BoxGeometry(l, h, p), typeof couleur === "number" ? materiau(couleur) : couleur));
  m.position.set(x, y, z);
  return m;
}

function texture(largeur: number, hauteur: number, dessiner: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = largeur;
  c.height = hauteur;
  dessiner(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Les lumières électriques du Carrefour : allumées jour et nuit (la nuit, elles se voient de loin). */
export function lumieresComptoir(): SourceLumiere[] {
  return [
    { x: COMPTOIR.guichet.x, y: 3.2, z: COMPTOIR.guichet.z + 0.6, couleur: BLANC_ELECTRIQUE, intensite: 7, portee: 13, vacillement: 0 },
    { x: ROUTE_CARREFOUR.x - 7, y: 4.6, z: ROUTE_CARREFOUR.z - 4.4, couleur: BLANC_ELECTRIQUE, intensite: 5, portee: 12, vacillement: 0.03 },
    { x: COMPTOIR.cellules.x, y: 2.6, z: COMPTOIR.cellules.z + 3.2, couleur: 0xdfe9ff, intensite: 3, portee: 8, vacillement: 0 },
  ];
}

const COMPTEURS: Compteur[] = [];

/** Les Compteurs respirent, croisent les bras, changent d'appui (à appeler à chaque image, au Comptoir). */
export function animerComptoir(dt: number): void {
  for (const c of COMPTEURS) c.animer(dt);
  if (rotor) rotor.rotation.z += dt * 2.4;
}

export function creerComptoir(): THREE.Group {
  const g = new THREE.Group();
  const aleat = aleatoire(1789);
  const n = bruit(aleat, 64);
  g.add(creerSol(n), creerRoutes(aleat), creerAgence(aleat), creerCellules(), creerPedalier(), creerCloture(aleat), creerForet(aleat));
  g.add(creerLampadaire(ROUTE_CARREFOUR.x - 7, ROUTE_CARREFOUR.z - 4.4));
  // Les deux gardes du guichet, animés (voir animerComptoir).
  COMPTEURS.push(new Compteur(COMPTOIR.guichet.x - 3.2, COMPTOIR.guichet.z + 0.6, 0.3, false, "homme"));
  COMPTEURS.push(new Compteur(COMPTOIR.guichet.x + 3.4, COMPTOIR.guichet.z + 0.8, -0.4, true, "femme"));
  for (const c of COMPTEURS) g.add(c.objet);
  // P-006 : la station est à l'est (à droite), la Ville à l'ouest (à gauche), comme sur la carte.
  g.add(creerPanneauRoute("Station-service", "2 km · ton terrain 5 km →", L - 9, ROUTE_CARREFOUR.z + ROUTE_CARREFOUR.demiLargeur + 1.6, 0));
  g.add(creerBarrage(4.5, ROUTE_CARREFOUR.z, Math.PI / 2, "Route de la Ville : fermée"));
  g.add(creerBarrage(ROUTE_CARREFOUR.x, P - 2.5, 0, "Route de la Côte : fermée"));
  // Le chemin agricole de la Coopérative, au nord (0.5) : ouvert, lui.
  g.add(creerPanneauRoute("Coopérative du Plateau", "↑ 3 km · chemin agricole", CHEMIN_COOP.x + 3.4, 6.5, 0));
  return g;
}

// ---------- Le sol : gravier tassé autour de l'agence, herbe au-delà ----------

function creerSol(n: (x: number, z: number) => number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(L + 60, P + 60, (L + 60) / 2, (P + 60) / 2).rotateX(-Math.PI / 2).translate(L / 2, 0, P / 2);
  const pos = geo.attributes.position!;
  const couleurs = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const gravier = new THREE.Color(0xa69d8b);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const v = n(x / 8, z / 8);
    c.setHex(PALETTE.herbe).lerp(new THREE.Color(PALETTE.herbeSeche), Math.max(0, v - 0.4));
    // L'esplanade de gravier devant l'agence, entretenue par les Compteurs
    const d = Math.hypot((x - COMPTOIR.guichet.x) / 17, (z - 19) / 9);
    if (d < 1) c.lerp(gravier, Math.min(1, (1 - d) * 2.2));
    c.offsetHSL(0, 0, (n(x / 2 + 30, z / 2) - 0.5) * 0.06);
    c.toArray(couleurs, i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  m.receiveShadow = true;
  return m;
}

function creerRoutes(aleat: () => number): THREE.Group {
  const g = new THREE.Group();
  const asphalte = materiau(0x58595d, { rugosite: 0.95 });
  const route = (x: number, z: number, l: number, p: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, p).rotateX(-Math.PI / 2), asphalte);
    m.position.set(x, 0.02, z);
    m.receiveShadow = true;
    g.add(m);
  };
  const w = ROUTE_CARREFOUR.demiLargeur * 2;
  // La route barrée vers la Ville, à l'ouest, et la route de la station, à l'est (P-006)
  route((ROUTE_CARREFOUR.x - 30) / 2, ROUTE_CARREFOUR.z, ROUTE_CARREFOUR.x + 30, w);
  route((ROUTE_CARREFOUR.x + L + 30) / 2, ROUTE_CARREFOUR.z, L + 30 - ROUTE_CARREFOUR.x, w);
  // La route de la Côte, au sud, et l'allée de l'agence, au nord
  route(ROUTE_CARREFOUR.x, (ROUTE_CARREFOUR.z + P + 30) / 2, w, P + 30 - ROUTE_CARREFOUR.z);
  // Le chemin agricole de la Coopérative : deux ornières de terre qui montent vers le nord, à travers la clôture.
  const terre = materiau(0x8a6a48, { rugosite: 1 });
  const zFin = ROUTE_CARREFOUR.z - ROUTE_CARREFOUR.demiLargeur;
  const longueur = zFin + 40;
  for (const dx of [-0.75, 0.75]) {
    const orniere = new THREE.Mesh(new THREE.PlaneGeometry(0.9, longueur).rotateX(-Math.PI / 2), terre);
    orniere.position.set(CHEMIN_COOP.x + dx, 0.015, zFin - longueur / 2);
    orniere.receiveShadow = true;
    g.add(orniere);
  }
  // Marquages : un stop effacé, des passages piétons
  const blanc = materiau(0xd9d2b8);
  for (let i = 0; i < 5; i++) {
    const bande = new THREE.Mesh(new THREE.PlaneGeometry(0.45, w * 0.8).rotateX(-Math.PI / 2), blanc);
    bande.position.set(ROUTE_CARREFOUR.x + 5.5 + i * 0.9, 0.03, ROUTE_CARREFOUR.z);
    if (aleat() > 0.25) g.add(bande);
  }
  for (let x = ROUTE_CARREFOUR.x + 10; x < L + 20; x += 7) {
    const tiret = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.14).rotateX(-Math.PI / 2), blanc);
    tiret.position.set(x, 0.03, ROUTE_CARREFOUR.z);
    g.add(tiret);
  }
  return g;
}

// ---------- L'agence de la Compagnie : le guichet des Compteurs ----------

function textureEnseigne(): THREE.CanvasTexture {
  return texture(512, 64, (c) => {
    c.fillStyle = "#f4f8ff";
    c.fillRect(0, 0, 512, 64);
    c.fillStyle = "#1c2333";
    c.font = "900 30px 'Futura', 'Avenir Next Condensed', 'Arial Black', sans-serif";
    c.textAlign = "center";
    c.fillText("COMPTOIR DU CARREFOUR", 256, 34);
    c.fillStyle = "#1f7a6d";
    c.font = "bold 15px 'Courier New', monospace";
    c.fillText("LES COMPTEURS · ÉNERGIE · CHANGE · DÉPÔT", 256, 56);
  });
}

function textureBareme(): THREE.CanvasTexture {
  return texture(192, 256, (c) => {
    c.fillStyle = "#f2ead6";
    c.fillRect(0, 0, 192, 256);
    c.fillStyle = "#1c2333";
    c.font = "bold 16px 'Courier New', monospace";
    c.textAlign = "center";
    c.fillText("BARÈME DE DÉCHARGE", 96, 26);
    c.font = "13px 'Courier New', monospace";
    c.textAlign = "left";
    const lignes = ["Âge du bon   Valeur", "1 saison      98 %", "2 saisons     96 %", "3 saisons     94 %", "1 an          92 %", "", "Dépôt : 0,85 wott/Wh", "Retrait : 1 wott/Wh", "", "« Un bon est un reçu."];
    lignes.forEach((l, i) => c.fillText(l, 14, 56 + i * 18));
    c.fillText("  Il se décharge. »", 14, 56 + lignes.length * 18);
    c.strokeStyle = "#1f7a6d";
    c.lineWidth = 3;
    c.save();
    c.translate(130, 228);
    c.rotate(-0.2);
    c.strokeRect(-46, -14, 92, 28);
    c.fillStyle = "#1f7a6d";
    c.font = "bold 13px 'Courier New', monospace";
    c.textAlign = "center";
    c.fillText("VÉRIFIÉ", 0, 5);
    c.restore();
  });
}

function textureAvis(): THREE.CanvasTexture {
  const aleat = aleatoire(1790);
  return texture(256, 160, (c) => {
    c.fillStyle = "#6b4a32";
    c.fillRect(0, 0, 256, 160);
    c.fillStyle = "#5a4130";
    c.fillRect(6, 6, 244, 148);
    // Des avis punaisés : bons, échanges, recherches de personnes
    const avis = [
      ["ÉCHANGE", "batterie 12 V", "contre graines"],
      ["CHERCHE", "ma sœur Lina", "vue à la Côte"],
      ["BON DE", "DÉPÔT n° 4471", "— VÉRIFIÉ —"],
      ["COUVRE-FEU", "à la nuit :", "lumières éteintes"],
      ["VENDS", "vélo, 2 roues", "presque"],
    ];
    avis.forEach((lignes, i) => {
      const x = 14 + (i % 3) * 80 + aleat() * 6;
      const y = 14 + Math.floor(i / 3) * 72 + aleat() * 6;
      c.save();
      c.translate(x + 34, y + 30);
      c.rotate((aleat() - 0.5) * 0.12);
      c.fillStyle = i === 2 ? "#e8e2c6" : "#f2ead6";
      c.fillRect(-34, -30, 68, 60);
      c.fillStyle = "#1c2333";
      c.font = "bold 10px 'Courier New', monospace";
      c.textAlign = "center";
      lignes.forEach((l, k) => c.fillText(l, 0, -12 + k * 14));
      c.fillStyle = "#c8362b";
      c.beginPath();
      c.arc(0, -26, 3, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });
  });
}

function textureDrapeau(): THREE.CanvasTexture {
  return texture(128, 80, (c) => {
    c.fillStyle = "#1f7a6d";
    c.fillRect(0, 0, 128, 80);
    c.strokeStyle = "#f2ead6";
    c.lineWidth = 5;
    c.beginPath();
    c.arc(64, 40, 24, 0, Math.PI * 2);
    c.stroke();
    // La balance des Compteurs
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(64, 26);
    c.lineTo(64, 54);
    c.moveTo(50, 32);
    c.lineTo(78, 32);
    c.moveTo(50, 32);
    c.lineTo(46, 44);
    c.lineTo(54, 44);
    c.closePath();
    c.moveTo(78, 32);
    c.lineTo(74, 44);
    c.lineTo(82, 44);
    c.closePath();
    c.stroke();
  });
}

/** La lumière d'une fenêtre allumée : le blanc électrique, de jour comme de nuit. */
const matFenetreAllumee = new THREE.MeshStandardMaterial({ color: 0xf6f8ff, emissive: 0xeef4ff, emissiveIntensity: 0.9, roughness: 0.4, vertexColors: true });

/** Le rotor de l'éolienne, sur le toit (il tourne, voir animerComptoir). */
let rotor: THREE.Object3D | null = null;

function creerAgence(aleat: () => number): THREE.Group {
  const g = new THREE.Group();
  const b = COMPTOIR.batiment;
  const xa = b.x - b.l / 2;
  const xb = b.x + b.l / 2;
  const za = b.z - b.p / 2;
  const face = b.z + b.p / 2;
  const hauteur = 4.4;
  const SOCLE = 0.9;
  const c = new Chantier(1801);
  // Ce qui pourrait cacher le personnage (le haut des murs, le toit) : à part, pour s'effacer si on passe derrière.
  const t = new Chantier(1802);
  const enduit = matiereTexture(textureEnduit(1803, "#e3dccb", "rgba(59, 90, 140, 0.25)"));
  const fer = matiere(0.45, 0.6);
  const bleu = 0x3b5a8c;
  const sarcelle = 0x1f7a6d;

  // Le soubassement bleu de la Compagnie (il reste), les murs crème au-dessus
  c.pave(xa, 0, za, xb, SOCLE, face, bleu, matiere(0.7, 0.1));
  c.pave(xa - 0.05, SOCLE - 0.06, za - 0.05, xb + 0.05, SOCLE, face + 0.05, 0xd9d4c8);
  t.pave(xa, SOCLE, za, xb, hauteur, face, 0xffffff, enduit, { nuance: 0 });
  // L'acrotère et le toit
  t.pave(xa - 0.3, hauteur, za - 0.3, xb + 0.3, hauteur + 0.2, face + 0.3, 0x55524d);
  const membrane = textureToitPlat(1804, "#6f6c66");
  membrane.wrapS = membrane.wrapT = THREE.RepeatWrapping;
  membrane.repeat.set(2, 1);
  t.poser(new THREE.PlaneGeometry(b.l + 0.2, b.p + 0.2).rotateX(-Math.PI / 2), matiereTexture(membrane, { roughness: 0.95 }), 0xffffff, { x: b.x, y: hauteur + 0.205, z: b.z }, { nuance: 0, crasse: false });
  for (const [x1, z1, x2, z2] of [
    [xa - 0.3, za - 0.3, xb + 0.3, za - 0.05],
    [xa - 0.3, face + 0.05, xb + 0.3, face + 0.3],
    [xa - 0.3, za - 0.05, xa - 0.05, face + 0.05],
    [xb + 0.05, za - 0.05, xb + 0.3, face + 0.05],
  ] as const) t.pave(x1, hauteur + 0.2, z1, x2, hauteur + 0.55, z2, 0xd9d4c8);

  // Sur le toit : l'énergie des Compteurs se voit. Panneaux solaires bien tenus, batterie, éolienne, antenne.
  const panneau = matiereTexture(dessiner(96, 64, (x) => {
    x.fillStyle = "#c9ccd0";
    x.fillRect(0, 0, 96, 64);
    x.fillStyle = "#1f3550";
    x.fillRect(3, 3, 90, 58);
    x.strokeStyle = "#4d6a8a";
    for (let i = 3; i <= 93; i += 15) x.strokeRect(i, 3, 15, 58);
    for (let j = 3; j <= 61; j += 14.5) x.strokeRect(3, j, 90, 14.5);
  }), { roughness: 0.3, metalness: 0.3 });
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 4; i++) {
      t.repere({ x: xa + 2.2 + i * 2.3, y: hauteur + 0.6, z: za + 1.6 + r * 2.2, rx: -0.5 }, () => {
        t.boite(2, 0.06, 1.25, 0xc9ccd0, {}, fer);
        t.poser(new THREE.PlaneGeometry(1.94, 1.19).rotateX(-Math.PI / 2), panneau, 0xffffff, { y: 0.035 }, { nuance: 0, crasse: false });
      });
      for (const dx of [-0.85, 0.85]) t.pave(xa + 2.2 + i * 2.3 + dx - 0.03, hauteur + 0.2, za + 1.95 + r * 2.2 - 0.03, xa + 2.2 + i * 2.3 + dx + 0.03, hauteur + 0.6, za + 1.95 + r * 2.2 + 0.03, 0x8a8f94, fer);
    }
  }
  // L'armoire des batteries et la cuve d'eau de pluie
  t.pave(xb - 3, hauteur + 0.2, za + 0.5, xb - 1.4, hauteur + 1.4, za + 1.4, 0xd9d4c8, matiere(0.6, 0.2));
  t.pave(xb - 2.9, hauteur + 1.0, za + 1.41, xb - 1.5, hauteur + 1.2, za + 1.43, 0xd8c43a);
  t.poser(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 10), matiere(0.7, 0.1), 0x3e6b4a, { x: xb - 1.6, y: hauteur + 0.9, z: face - 1.5 });
  // L'antenne, haubanée
  t.pave(xa + 0.9, hauteur + 0.2, face - 1.0, xa + 1.0, hauteur + 4.2, face - 0.9, 0x3a3d42, fer);
  for (const [dx, dz] of [
    [-0.6, 0.6],
    [0.8, 0.5],
    [0.2, -0.9],
  ] as const) t.poutre(new THREE.Vector3(xa + 0.95, hauteur + 3.6, face - 0.95), new THREE.Vector3(xa + 0.95 + dx, hauteur + 0.25, face - 0.95 + dz), 0.02, 0x1f1f1f);
  // Le mât de l'éolienne
  const xe = xb - 0.9;
  const ze = za + 0.9;
  t.pave(xe - 0.07, hauteur + 0.2, ze - 0.07, xe + 0.07, hauteur + 3.6, ze + 0.07, 0xd9d4c8, fer);
  t.boite(0.3, 0.26, 0.6, 0xd9d4c8, { x: xe, y: hauteur + 3.7, z: ze }, fer);
  t.boite(0.04, 0.5, 0.5, sarcelle, { x: xe, y: hauteur + 3.8, z: ze - 0.5 });

  // Les câbles qui descendent du toit, le long de la façade est, vers les cellules
  t.pave(xb + 0.02, 0.9, face - 0.8, xb + 0.12, hauteur + 0.4, face - 0.7, 0x1f1f1f);
  t.pave(xb + 0.02, 0.9, face - 0.6, xb + 0.1, hauteur + 0.4, face - 0.52, 0x1f1f1f);

  // L'enseigne lumineuse : du blanc électrique, le seul du monde
  const enseigne = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 1.1),
    new THREE.MeshStandardMaterial({ map: textureEnseigne(), emissive: 0xffffff, emissiveMap: textureEnseigne(), emissiveIntensity: 0.9, roughness: 0.6, transparent: true }),
  );
  enseigne.position.set(b.x, hauteur - 0.75, face + 0.03);
  g.add(enseigne);
  t.pave(b.x - 4.65, hauteur - 1.4, face, b.x + 4.65, hauteur - 0.1, face + 0.02, 0x3a3d42, fer);

  // Les fenêtres allumées, à barreaux (façade et pignon est), et l'auvent sarcelle au-dessus du guichet
  const fenetre = (x: number, z: number, ry: number, l: number) => {
    t.repere({ x, y: 1.9, z, ry }, () => {
      t.pave(-l / 2 - 0.1, -0.7, 0, l / 2 + 0.1, 0.7, 0.04, 0x55524d, fer);
      t.poser(new THREE.PlaneGeometry(l, 1.2), matFenetreAllumee, 0xffffff, { z: 0.045 }, { nuance: 0, crasse: false });
      for (let k = 0; k <= Math.round(l / 0.22); k++) t.pave(-l / 2 + k * 0.22 - 0.015, -0.6, 0.06, -l / 2 + k * 0.22 + 0.015, 0.6, 0.09, 0x3a3d42, fer);
      t.pave(-l / 2 - 0.15, -0.76, 0, l / 2 + 0.15, -0.68, 0.18, 0xd9d4c8);
    });
  };
  fenetre(xa + 2, face, 0, 1.6);
  fenetre(xb, b.z - 1.5, Math.PI / 2, 1.4);
  fenetre(xb, b.z + 1.8, Math.PI / 2, 1.4);
  const { x: gx } = COMPTOIR.guichet;
  t.repere({ x: gx, y: 2.75, z: face }, () => {
    t.boite(3.6, 0.06, 0.9, sarcelle, { z: 0.45, rx: 0.22 }, matiere(0.5, 0.3));
    t.boite(3.6, 0.18, 0.05, 0xf2ead6, { y: -0.1, z: 0.88 });
    for (const s of [-1, 1]) t.poutre(new THREE.Vector3(s * 1.7, 0, 0.85), new THREE.Vector3(s * 1.7, 0.6, 0.02), 0.04, 0x3a3d42, fer);
  });

  // Le guichet grillagé, éclairé de l'intérieur
  const vitre = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xfff2cc, emissiveIntensity: 0.85 }));
  vitre.position.set(gx, 1.75, face + 0.02);
  g.add(vitre);
  for (let i = 0; i <= 10; i++) c.boite(0.035, 1.35, 0.035, 0x3a3d42, { x: gx - 1.3 + i * 0.26, y: 1.75, z: face + 0.06 }, fer);
  for (const y of [1.15, 2.38]) c.boite(2.7, 0.06, 0.06, 0x3a3d42, { x: gx, y, z: face + 0.06 }, fer);
  // La tablette du guichet, le registre, le tampon, la sonnette
  c.boite(3, 0.08, 0.6, 0x7a5a3c, { x: gx, y: 1.05, z: face + 0.3 });
  c.boite(0.5, 0.06, 0.36, 0x6b2f2a, { x: gx - 0.6, y: 1.12, z: face + 0.32 });
  c.boite(0.12, 0.12, 0.12, 0x2b2b2b, { x: gx + 0.5, y: 1.15, z: face + 0.3 });
  c.poser(new THREE.SphereGeometry(0.06, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), matiere(0.3, 0.7), 0xb59048, { x: gx + 0.9, y: 1.09, z: face + 0.35 });
  c.pave(gx - 1.5, 0.1, face + 0.05, gx + 1.5, 1.01, face + 0.55, 0x5a4130);
  // Watty au-dessus du guichet : l'ironie de la Compagnie (Book 18 §6) ; le barème des Compteurs à côté
  const watty = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), new THREE.MeshStandardMaterial({ map: textureAffiche(), roughness: 0.9 }));
  watty.position.set(gx + 3.3, 2.2, face + 0.02);
  g.add(watty);
  const bareme = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.27), new THREE.MeshStandardMaterial({ map: textureBareme(), roughness: 0.9 }));
  bareme.position.set(gx - 3.4, 1.75, face + 0.02);
  g.add(bareme);
  // La porte de service, blindée, ses rivets, une lampe au-dessus
  c.pave(b.x + 5, 0.05, face, b.x + 6.2, 2.35, face + 0.1, 0x55524d, fer);
  for (let k = 0; k < 5; k++) c.boite(1.1, 0.04, 0.03, 0x3a3d42, { x: b.x + 5.6, y: 0.4 + k * 0.45, z: face + 0.12 }, fer);
  c.boite(0.3, 0.18, 0.2, 0x3a3d42, { x: b.x + 5.6, y: 2.65, z: face + 0.12 }, fer);
  c.boite(0.22, 0.06, 0.14, 0xf4f8ff, { x: b.x + 5.6, y: 2.55, z: face + 0.15 }, matFenetreAllumee);
  // Le compteur électrique de la Compagnie, au pignon est : l'aiguille, les scellés
  c.pave(xb, 1.2, b.z + 0.3, xb + 0.25, 2, b.z + 0.9, 0xd9d4c8, matiere(0.6, 0.2));
  c.pave(xb + 0.25, 1.5, b.z + 0.4, xb + 0.27, 1.8, b.z + 0.8, 0x151a22);

  // Sacs de sable en chicane devant l'agence
  const sac = new THREE.SphereGeometry(0.42, 7, 4).scale(1.3, 0.48, 0.75);
  for (const [cx, rangs] of [
    [b.x - 6.6, 3],
    [b.x + 6.8, 3],
  ] as const) {
    for (let r = 0; r < rangs; r++) {
      for (let k = 0; k < 3 - (r === 2 ? 1 : 0); k++) {
        c.poser(sac, matiere(), aleat() < 0.5 ? 0xb8a77f : 0xa8986f, { x: cx + (k - 1) * 0.95 + (r % 2) * 0.45, y: 0.2 + r * 0.38, z: face + 1.6 + (aleat() - 0.5) * 0.1, ry: (aleat() - 0.5) * 0.3 }, { nuance: 0.06 });
      }
    }
  }
  // Le sol de l'agence (on le verrait si elle s'effaçait) : propre, des étagères de batteries contre les murs
  c.pave(xa, 0, za, xb, 0.06, face, 0x8e8b84);
  for (let i = 0; i < 6; i++) c.pave(xa + 0.6 + i * 1.3, 0.06, za + 0.25, xa + 1.7 + i * 1.3, 2.2, za + 0.85, 0x3a3d42, fer);

  // Le panneau d'affichage, le banc de la file d'attente, les poteaux et la corde, le drapeau des Compteurs
  c.repere({ x: b.x - 9.4, z: face + 2.6, ry: 0.35 }, () => {
    for (const s of [-1, 1]) c.boite(0.1, 2.1, 0.1, 0x5a4130, { x: s * 0.75, y: 1.05 });
    c.boite(1.7, 0.12, 0.35, 0x5a4130, { y: 2.12 });
    c.poser(new THREE.PlaneGeometry(1.45, 0.9), matiereTexture(textureAvis()), 0xffffff, { y: 1.45, z: 0.06 }, { nuance: 0, crasse: false });
  });
  c.repere({ x: gx - 5.4, z: face + 3.6, ry: 0.1 }, () => {
    c.boite(1.8, 0.07, 0.45, 0x7a5a3c, { y: 0.45 });
    c.boite(1.8, 0.4, 0.06, 0x7a5a3c, { y: 0.75, z: -0.22 });
    for (const s of [-1, 1]) c.boite(0.08, 0.45, 0.4, 0x3a3d42, { x: s * 0.8, y: 0.22 }, fer);
  });
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const x = gx + s * (1.8 + k * 0.35);
      const z = face + 2.2 + k * 1.1;
      c.poser(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 6), fer, 0xb59048, { x, y: 0.48, z });
      c.poser(new THREE.CylinderGeometry(0.15, 0.17, 0.05, 8), fer, 0x3a3d42, { x, y: 0.03, z });
      if (k < 2) c.poutre(new THREE.Vector3(x, 0.88, z), new THREE.Vector3(gx + s * (1.8 + (k + 1) * 0.35), 0.88, z + 1.1), 0.03, 0x8a3b2a);
    }
  }
  const xd = xb + 3.2;
  const zd = face + 2.4;
  c.poser(new THREE.CylinderGeometry(0.05, 0.07, 6.5, 6), fer, 0xd9d4c8, { x: xd, y: 3.25, z: zd });
  c.poser(new THREE.CylinderGeometry(0.3, 0.38, 0.3, 8), matiere(), 0x8e8b84, { x: xd, y: 0.15, z: zd });
  const drapeau = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95, 6, 1), new THREE.MeshStandardMaterial({ map: textureDrapeau(), side: THREE.DoubleSide, roughness: 0.9 }));
  const pos = drapeau.geometry.attributes.position!;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) + 0.75) * 3) * 0.08 * (pos.getX(i) + 0.75));
  drapeau.geometry.computeVertexNormals();
  drapeau.position.set(xd + 0.78, 5.9, zd);
  drapeau.rotation.y = -0.4;
  drapeau.castShadow = true;
  g.add(drapeau);
  // Un récupérateur d'eau de pluie, contre le pignon ouest
  c.poser(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 10), matiere(0.7, 0.1), 0x2f6fa4, { x: xa - 0.6, y: 0.55, z: face - 1.2 });
  c.pave(xa - 0.12, 1.1, face - 1.25, xa - 0.04, hauteur, face - 1.15, 0x8a8f94, fer);
  // Des bacs de légumes : les Compteurs cultivent aussi
  for (const x of [xa + 1.2, xa + 3.4]) {
    c.pave(x - 0.9, 0, face + 0.5, x + 0.9, 0.4, face + 1.1, 0x7a5a3c);
    for (let k = 0; k < 5; k++) c.poser(new THREE.IcosahedronGeometry(0.18, 0), matiere(), k % 2 ? 0x5d8a46 : 0x7da150, { x: x - 0.7 + k * 0.35, y: 0.52, z: face + 0.8, e: [1, 0.7, 1] }, { crasse: false });
  }

  g.add(c.construire());
  const fondu = t.construireFondu();
  g.add(fondu.objet);
  // Le haut de l'agence s'efface quand on passe derrière (halte.ts, estomperToits).
  g.userData.toits = [{ boite: b, materiaux: fondu.materiaux, bas: SOCLE, haut: hauteur + 0.6 }];

  // Le rotor de l'éolienne : trois pales, il tourne au vent
  const r = new Chantier(1805);
  for (let k = 0; k < 3; k++) {
    r.repere({ rz: (k * Math.PI * 2) / 3 }, () => r.boite(0.12, 1.3, 0.03, 0xf2ead6, { y: 0.7 }, matiere(0.5, 0.1)));
  }
  r.poser(new THREE.ConeGeometry(0.1, 0.25, 6).rotateX(Math.PI / 2), matiere(0.5, 0.1), sarcelle, { z: 0.08 });
  const objetRotor = r.construire();
  objetRotor.position.set(xe, hauteur + 3.72, ze + 0.34);
  g.add(objetRotor);
  rotor = objetRotor;
  return g;
}

/** Les cellules de batteries numérotées (Book 07 §3.3 : « Cellule 7 »), le compteur à aiguille. */
function creerCellules(): THREE.Group {
  const g = new THREE.Group();
  const cl = COMPTOIR.cellules;
  const c = new Chantier(1810);
  const fer = matiere(0.5, 0.5);
  c.pave(cl.x - cl.l / 2, 0, cl.z - cl.p / 2, cl.x + cl.l / 2, 0.25, cl.z + cl.p / 2, 0x6e6a63);
  // Un abri de tôle ondulée sur une structure d'acier, un mur de parpaings au fond
  c.pave(cl.x - cl.l / 2, 0.25, cl.z - cl.p / 2, cl.x + cl.l / 2, 2.3, cl.z - cl.p / 2 + 0.25, 0xbdb5a2);
  for (const dx of [-cl.l / 2, cl.l / 2]) {
    c.pave(cl.x + dx - 0.08, 0.25, cl.z + cl.p / 2 - 0.15, cl.x + dx + 0.08, 2.45, cl.z + cl.p / 2 + 0.01, 0x55524d, fer);
    c.pave(cl.x + dx - 0.08, 0.25, cl.z - cl.p / 2 + 0.25, cl.x + dx + 0.08, 2.35, cl.z - cl.p / 2 + 0.4, 0x55524d, fer);
  }
  const tole = geoToleOndulee(1, cl.p + 0.9, 0.2, 0.04);
  for (let x = cl.x - cl.l / 2 - 0.3; x < cl.x + cl.l / 2 + 0.3; x += 0.97) {
    c.poser(tole, matiere(0.55, 0.4), c.hasard() < 0.8 ? 0x9aa0a6 : 0x8d9396, { x: x + 0.5, y: 2.48, z: cl.z, rx: -0.08 }, { nuance: 0.05, crasse: false });
  }
  const etiquette = (numero: number) =>
    new THREE.MeshStandardMaterial({
      map: texture(64, 32, (x) => {
        x.fillStyle = "#e8c547";
        x.fillRect(0, 0, 64, 32);
        x.fillStyle = "#1c2333";
        x.font = "bold 14px 'Courier New', monospace";
        x.textAlign = "center";
        x.fillText(`CELL. ${numero}`, 32, 21);
      }),
    });
  let numero = 1;
  for (let rangee = 0; rangee < 2; rangee++) {
    for (let i = 0; i < 4; i++) {
      const x = cl.x - cl.l / 2 + 0.9 + i * 1.7;
      const y = 0.25 + rangee * 0.95;
      c.boite(1.35, 0.8, 1.2, 0x2b2b2b, { x, y: y + 0.4, z: cl.z + 0.4 }, matiere(0.6, 0.2));
      // Les bornes, le voyant de charge (vert : plein)
      c.boite(0.12, 0.08, 0.12, 0x8a3b2a, { x: x - 0.4, y: y + 0.84, z: cl.z + 0.2 }, fer);
      c.boite(0.12, 0.08, 0.12, 0x2b2b2b, { x: x + 0.4, y: y + 0.84, z: cl.z + 0.2 }, fer);
      c.boite(0.08, 0.08, 0.02, numero % 3 ? 0x7dd87a : 0xe8c547, { x: x + 0.45, y: y + 0.6, z: cl.z + 1.01 }, matFenetreAllumee);
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.28), etiquette(numero++));
      plaque.position.set(x, y + 0.55, cl.z + 1.01);
      g.add(plaque);
    }
  }
  // La grille de devant, cadenassée : on ne touche pas aux cellules des autres
  const grillage = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, transparent: true, opacity: 0.35, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.3, depthWrite: false });
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(cl.l - 0.2, 1.95), grillage);
  grille.position.set(cl.x, 1.25, cl.z + cl.p / 2 - 0.08);
  g.add(grille);
  c.pave(cl.x - cl.l / 2, 2.2, cl.z + cl.p / 2 - 0.12, cl.x + cl.l / 2, 2.28, cl.z + cl.p / 2 - 0.04, 0x55524d, fer);
  c.pave(cl.x - cl.l / 2, 0.25, cl.z + cl.p / 2 - 0.12, cl.x + cl.l / 2, 0.32, cl.z + cl.p / 2 - 0.04, 0x55524d, fer);
  c.boite(0.12, 0.16, 0.06, 0xb59048, { x: cl.x + 0.1, y: 1.1, z: cl.z + cl.p / 2 }, fer);
  // Les câbles vers l'agence
  c.poser(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(cl.x - cl.l / 2, 2, cl.z), new THREE.Vector3(cl.x - 5, 1.2, cl.z + 0.5), new THREE.Vector3(COMPTOIR.batiment.x + COMPTOIR.batiment.l / 2, 2.6, cl.z)]), 12, 0.04, 5),
    matiere(0.6),
    0x1f1f1f,
  );
  // Le compteur à aiguille, sur un poteau
  const cadran = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 24),
    new THREE.MeshStandardMaterial({
      map: texture(128, 128, (x) => {
        x.fillStyle = "#f2ead6";
        x.beginPath();
        x.arc(64, 64, 62, 0, Math.PI * 2);
        x.fill();
        x.strokeStyle = "#1c2333";
        x.lineWidth = 3;
        x.stroke();
        for (let i = 0; i <= 10; i++) {
          const a = Math.PI * (0.8 + i * 0.14);
          x.beginPath();
          x.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50);
          x.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58);
          x.stroke();
        }
        x.fillStyle = "#1c2333";
        x.font = "bold 14px 'Courier New', monospace";
        x.textAlign = "center";
        x.fillText("kWh", 64, 92);
        x.strokeStyle = "#c8362b";
        x.lineWidth = 3;
        x.beginPath();
        x.moveTo(64, 64);
        x.lineTo(64 + Math.cos(Math.PI * 1.55) * 48, 64 + Math.sin(Math.PI * 1.55) * 48);
        x.stroke();
      }),
    }),
  );
  cadran.position.set(cl.x + cl.l / 2 + 0.6, 1.7, cl.z + 1.52);
  g.add(cadran);
  c.boite(0.1, 1.5, 0.1, 0x55524d, { x: cl.x + cl.l / 2 + 0.6, y: 0.75, z: cl.z + 1.45 }, fer);
  c.boite(0.95, 0.95, 0.08, 0x3a3d42, { x: cl.x + cl.l / 2 + 0.6, y: 1.7, z: cl.z + 1.46 }, fer);
  g.add(c.construire());
  return g;
}

/** Le pédalier des Compteurs : on y pédale contre des wotts payés comptant. */
function creerPedalier(): THREE.Group {
  const g = new THREE.Group();
  const { x, z } = COMPTOIR.pedalier;
  g.position.set(x, 0, z - 0.6);
  g.add(boite(1.6, 0.12, 0.7, 0x7a5a3c, 0, 0.45, 0));
  for (const dx of [-0.7, 0.7]) g.add(boite(0.1, 0.45, 0.6, 0x5a4130, dx, 0.22, 0));
  const cadre = materiau(0x3b5a8c, { metal: 0.3, rugosite: 0.6 });
  const tube = (l: number) => new THREE.CylinderGeometry(0.03, 0.03, l, 5);
  const t1 = ombre(new THREE.Mesh(tube(0.75), cadre));
  t1.position.set(-0.1, 0.85, 0);
  t1.rotation.z = 0.5;
  const selle = boite(0.25, 0.05, 0.12, 0x2b2b2b, -0.45, 1.08, 0);
  const roue = ombre(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 5, 18), materiau(0x2b2b2b)));
  roue.position.set(0.45, 0.9, 0);
  g.add(t1, selle, roue);
  // L'écriteau des Compteurs
  const ecriteau = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.5),
    new THREE.MeshStandardMaterial({
      map: texture(220, 100, (c) => {
        c.fillStyle = "#f2ead6";
        c.fillRect(0, 0, 220, 100);
        c.fillStyle = "#1c2333";
        c.font = "bold 18px 'Courier New', monospace";
        c.textAlign = "center";
        c.fillText("PÉDALEZ.", 110, 36);
        c.font = "14px 'Courier New', monospace";
        c.fillText("Payé comptant :", 110, 60);
        c.fillText("60 wotts l'heure.", 110, 80);
      }),
    }),
  );
  ecriteau.position.set(0, 1.55, -0.35);
  g.add(ecriteau, boite(0.06, 1.3, 0.06, 0x5a4130, 0, 0.9, -0.4));
  return g;
}

/** Un lampadaire de la Compagnie, allumé : la lumière blanche électrique, rare et précieuse. */
function creerLampadaire(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(boite(0.14, 4.6, 0.14, 0x3a3d42, 0, 2.3, 0));
  g.add(boite(0.9, 0.08, 0.14, 0x3a3d42, 0.4, 4.6, 0));
  const lampe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.24), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: BLANC_ELECTRIQUE, emissiveIntensity: 2 }));
  lampe.position.set(0.75, 4.52, 0);
  g.add(lampe);
  return g;
}

function creerCloture(aleat: () => number): THREE.Group {
  const g = new THREE.Group();
  const poteau = materiau(0x8a8f94, { metal: 0.4, rugosite: 0.6 });
  const grillage = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, transparent: true, opacity: 0.35, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.3 });
  const segment = (x1: number, z1: number, x2: number, z2: number) => {
    const l = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.ceil(l / 3);
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const xa = x1 + (x2 - x1) * t0;
      const za = z1 + (z2 - z1) * t0;
      const xb = x1 + (x2 - x1) * t1;
      const zb = z1 + (z2 - z1) * t1;
      g.add(boite(0.08, 1.9, 0.08, poteau, xa, 0.95, za));
      if (aleat() < 0.12) continue; // un pan arraché
      const pan = new THREE.Mesh(new THREE.PlaneGeometry(Math.hypot(xb - xa, zb - za), 1.7), grillage);
      pan.position.set((xa + xb) / 2, 0.95, (za + zb) / 2);
      pan.rotation.y = -Math.atan2(zb - za, xb - xa);
      g.add(pan);
    }
  };
  // Autour de l'esplanade, avec des passages pour les routes
  // Une trouée au nord, pour le chemin de la Coopérative.
  segment(6, 3, CHEMIN_COOP.x - 3, 3);
  segment(CHEMIN_COOP.x + 3, 3, L - 6, 3);
  segment(6, 3, 6, ROUTE_CARREFOUR.z - 4);
  segment(L - 6, 3, L - 6, ROUTE_CARREFOUR.z - 4);
  return g;
}

function creerForet(aleat: () => number): THREE.Group {
  const places: PlaceArbre[] = [];
  for (let i = 0; i < 520; i++) {
    const x = -25 + aleat() * (L + 50);
    const z = -25 + aleat() * (P + 50);
    const dansLieu = x > 3 && x < L - 3 && z > 1 && z < P - 2;
    const surRoute =
      Math.abs(z - ROUTE_CARREFOUR.z) < ROUTE_CARREFOUR.demiLargeur + 1.5 ||
      (Math.abs(x - ROUTE_CARREFOUR.x) < ROUTE_CARREFOUR.demiLargeur + 1.5 && z > ROUTE_CARREFOUR.z) ||
      (Math.abs(x - CHEMIN_COOP.x) < CHEMIN_COOP.demiLargeur + 2 && z < ROUTE_CARREFOUR.z);
    if (dansLieu || surRoute) continue;
    // Au sud (côté caméra), de jeunes arbres bas.
    places.push({ x, z, e: z > P - 2 && z < P + 6 ? 0.5 : 0.8 + aleat() * 0.7 });
  }
  return creerArbres(places, aleat);
}

/** Une route barrée par les Compteurs : le reste de la région n'est pas encore ouvert. */
function creerBarrage(x: number, z: number, o: number, texte: string): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = o;
  for (const dx of [-2.6, 2.6]) g.add(boite(0.1, 1.1, 0.5, 0x5a4130, dx, 0.55, 0));
  const planche = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 0.45, 0.08),
    new THREE.MeshStandardMaterial({
      map: texture(512, 40, (c) => {
        for (let i = 0; i < 16; i++) {
          c.fillStyle = i % 2 ? "#c8362b" : "#e9dfc6";
          c.beginPath();
          c.moveTo(i * 32, 40);
          c.lineTo(i * 32 + 20, 0);
          c.lineTo(i * 32 + 52, 0);
          c.lineTo(i * 32 + 32, 40);
          c.fill();
        }
      }),
    }),
  );
  planche.position.y = 1;
  planche.castShadow = true;
  const avis = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.5),
    new THREE.MeshStandardMaterial({
      map: texture(280, 100, (c) => {
        c.fillStyle = "#f2ead6";
        c.fillRect(0, 0, 280, 100);
        c.fillStyle = "#1c2333";
        c.font = "bold 18px 'Courier New', monospace";
        c.textAlign = "center";
        c.fillText(texte, 140, 44, 260);
        c.font = "14px 'Courier New', monospace";
        c.fillText("— Les Compteurs", 140, 76);
      }),
    }),
  );
  avis.position.set(0, 1.55, 0.06);
  g.add(planche, avis);
  return g;
}

