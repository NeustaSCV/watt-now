// Les installations posées sur le terrain (É2) : établi, abri, et les installations de famille.

import { fusionnerStatique } from "./fusion.ts";
import * as THREE from "three";
import type { InstallationVue } from "../../../commun/src/messages.ts";
import { PALETTE, aleatoire, materiau } from "./materiaux.ts";

function ombre<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Le coffre de rangement : des planches, un couvercle bombé, deux liens de corde et un moraillon. */
function coffre(): THREE.Group {
  const g = new THREE.Group();
  const bois = materiau(0xa07c48);
  const sombre = materiau(0x7a5a3c);
  const caisse = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.55), bois));
  caisse.position.y = 0.25;
  g.add(caisse);
  // Les joints entre les planches.
  for (const y of [0.17, 0.32]) {
    const joint = new THREE.Mesh(new THREE.BoxGeometry(0.91, 0.012, 0.56), sombre);
    joint.position.y = y;
    g.add(joint);
  }
  const couvercle = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.92, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2), materiau(0x8a6a3e)));
  couvercle.scale.set(1, 0.5, 1);
  couvercle.position.y = 0.47;
  g.add(couvercle);
  for (const x of [-0.28, 0.28]) {
    const lien = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 4, 16), materiau(0xb59a6a));
    lien.rotation.y = Math.PI / 2;
    lien.scale.set(1, 0.95, 1.05);
    lien.position.set(x, 0.33, 0);
    g.add(lien);
  }
  const moraillon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.02), materiau(0x55524d, { metal: 0.6, rugosite: 0.5 }));
  moraillon.position.set(0, 0.42, 0.285);
  g.add(moraillon);
  return g;
}

/**
 * L'escabeau de bois : deux montants de bûche refendue et leurs barreaux de branche à l'avant, deux pieds à l'arrière,
 * une petite marche au sommet, les assemblages ligaturés de corde. Il se porte (Book 10).
 */
export function creerEscabeau(): THREE.Group {
  const g = new THREE.Group();
  const bois = materiau(0xa07c48);
  const branche = materiau(PALETTE.boisSombre);
  const corde = materiau(0xb59a6a);
  const hauteur = 1.25;
  const inclinaison = 0.28;
  // L'avant : l'échelle, penchée vers l'arrière.
  const avant = new THREE.Group();
  for (const x of [-0.24, 0.24]) {
    const montant = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.06, hauteur, 0.05), bois));
    montant.position.set(x, hauteur / 2, 0);
    avant.add(montant);
  }
  for (let i = 1; i <= 3; i++) {
    const y = (i * hauteur) / 4;
    const barreau = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.54, 5).rotateZ(Math.PI / 2), branche));
    barreau.position.set(0, y, 0);
    avant.add(barreau);
    for (const x of [-0.24, 0.24]) {
      const lien = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 3, 8), corde);
      lien.rotation.y = Math.PI / 2;
      lien.position.set(x, y, 0);
      avant.add(lien);
    }
  }
  avant.position.z = 0.3;
  avant.rotation.x = -inclinaison;
  // L'arrière : deux pieds et une traverse, penchés vers l'avant.
  const arriere = new THREE.Group();
  for (const x of [-0.22, 0.22]) {
    const pied = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.05, hauteur, 0.05), bois));
    pied.position.set(x, hauteur / 2, 0);
    arriere.add(pied);
  }
  const traverse = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 5).rotateZ(Math.PI / 2), branche));
  traverse.position.y = hauteur * 0.4;
  arriere.add(traverse);
  arriere.position.z = -0.3;
  arriere.rotation.x = inclinaison;
  // La marche du haut, où les deux moitiés se rejoignent.
  const marche = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.2), bois));
  marche.position.y = hauteur * Math.cos(inclinaison) + 0.01;
  g.add(avant, arriere, marche);
  return g;
}

function etabli(): THREE.Group {
  const g = new THREE.Group();
  const plateau = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.7), materiau(0xa07c48)));
  plateau.position.y = 0.85;
  g.add(plateau);
  for (const [x, z] of [[-0.65, -0.28], [0.65, -0.28], [-0.65, 0.28], [0.65, 0.28]] as const) {
    const pied = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.82, 0.1), materiau(PALETTE.bois)));
    pied.position.set(x, 0.41, z);
    g.add(pied);
  }
  const traverse = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.06), materiau(PALETTE.bois)));
  traverse.position.set(0, 0.3, 0.28);
  g.add(traverse);
  // Quelques outils posés
  const manche = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 5).rotateZ(Math.PI / 2), materiau(PALETTE.bois)));
  manche.position.set(-0.3, 0.93, 0.1);
  manche.rotation.y = 0.5;
  const tete = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.16), materiau(0x55524d, { metal: 0.5 })));
  tete.position.set(-0.13, 0.94, 0.0);
  tete.rotation.y = 0.5;
  const planche = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.18), materiau(0xc9a77a)));
  planche.position.set(0.35, 0.92, -0.1);
  planche.rotation.y = -0.2;
  g.add(manche, tete, planche);
  return g;
}

function abri(): THREE.Group {
  const g = new THREE.Group();
  const aleat = aleatoire(91);
  // Deux poteaux et une perche faîtière
  for (const x of [-1.1, 1.1]) {
    const poteau = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.45, 5), materiau(PALETTE.boisSombre)));
    poteau.position.set(x, 0.72, -0.45);
    g.add(poteau);
  }
  const faite = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.5, 5).rotateZ(Math.PI / 2), materiau(PALETTE.boisSombre)));
  faite.position.set(0, 1.42, -0.45);
  g.add(faite);
  // La bâche bleue, tendue en pente jusqu'au sol (un appentis)
  const bache = ombre(new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.75, 4, 3), new THREE.MeshStandardMaterial({ color: 0x2f6fa4, roughness: 0.7, side: THREE.DoubleSide, flatShading: true })));
  const pos = bache.geometry.attributes.position!;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + Math.sin(pos.getX(i) * 2.3) * 0.04);
  bache.geometry.computeVertexNormals();
  bache.position.set(0, 0.72, 0.25);
  bache.rotation.x = -Math.PI / 2 + 0.95;
  g.add(bache);
  // Des branches posées sur la bâche pour la tenir
  for (let i = 0; i < 7; i++) {
    const b = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.9, 4), materiau(PALETTE.boisSombre)));
    b.position.set(-1 + i * 0.33 + (aleat() - 0.5) * 0.1, 0.78, 0.25);
    b.rotation.x = -0.62;
    b.rotation.z = (aleat() - 0.5) * 0.2;
    g.add(b);
  }
  // Un lit de feuilles à l'abri
  const lit = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9).rotateX(-Math.PI / 2), materiau(0x8a7a3a));
  lit.position.set(0, 0.02, 0.05);
  lit.receiveShadow = true;
  g.add(lit);
  return g;
}

function charbonniere(): { groupe: THREE.Group; braise: THREE.Mesh } {
  const g = new THREE.Group();
  // Une meule ronde : bois empilé couvert de terre et de mottes
  const dome = ombre(new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), materiau(0x857057)));
  dome.scale.set(1.1, 0.75, 1.1);
  g.add(dome);
  const aleat = aleatoire(23);
  for (let i = 0; i < 12; i++) {
    const a = aleat() * Math.PI * 2;
    const motte = ombre(new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), materiau(PALETTE.terreSombre)));
    motte.position.set(Math.cos(a) * 0.9, 0.12 + aleat() * 0.25, Math.sin(a) * 0.9);
    g.add(motte);
  }
  // Bouts de bûches qui dépassent à la base
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const b = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 6).rotateZ(Math.PI / 2), materiau(PALETTE.bois)));
    b.position.set(Math.cos(a) * 1.05, 0.1, Math.sin(a) * 1.05);
    b.rotation.y = -a;
    g.add(b);
  }
  // La lueur rouge qui filtre au pied, quand elle cuit
  const braise = new THREE.Mesh(
    new THREE.RingGeometry(1.02, 1.12, 20).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xff4a1c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  braise.position.y = 0.03;
  g.add(braise);
  return { groupe: g, braise };
}

function forge(): THREE.Group {
  const g = new THREE.Group();
  const aleat = aleatoire(57);
  // Foyer de pierres maçonnées
  for (let i = 0; i < 16; i++) {
    const p = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.28), materiau(aleat() < 0.5 ? PALETTE.pierre : PALETTE.pierreSombre)));
    const cote = i % 4;
    const k = Math.floor(i / 4);
    p.position.set(cote < 2 ? -0.55 + k * 0.35 : cote === 2 ? -0.7 : 0.6, 0.1 + (i % 2) * 0.2, cote === 0 ? -0.35 : cote === 1 ? 0.35 : (k - 1.5) * 0.22);
    p.rotation.y = (aleat() - 0.5) * 0.2;
    g.add(p);
  }
  const charbon = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.5), materiau(0x2b2b2b));
  charbon.position.y = 0.32;
  g.add(charbon);
  // Le soufflet de cuir et de bois
  const soufflet = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.28, 0.7, 4).rotateZ(Math.PI / 2), materiau(PALETTE.cuir)));
  soufflet.position.set(-1.15, 0.35, 0);
  g.add(soufflet);
  // L'enclume : une grosse pierre plate sur un billot
  const billot = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.5, 8), materiau(PALETTE.bois)));
  billot.position.set(1.25, 0.25, 0.1);
  const enclume = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.3), materiau(0x55524d, { metal: 0.4, rugosite: 0.5 })));
  enclume.position.set(1.25, 0.57, 0.1);
  g.add(billot, enclume);
  return g;
}

function pedalier(): { groupe: THREE.Group; meule: THREE.Object3D; dynamo: THREE.Object3D; roue: THREE.Object3D } {
  const g = new THREE.Group();
  // Bâti de bois
  for (const [x, z] of [[-0.6, -0.25], [0.6, -0.25], [-0.6, 0.25], [0.6, 0.25]] as const) {
    const pied = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), materiau(PALETTE.bois)));
    pied.position.set(x, 0.25, z);
    g.add(pied);
  }
  const longeron = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.6), materiau(0xa07c48)));
  longeron.position.y = 0.52;
  g.add(longeron);
  // Le cadre de vélo, la selle, le pédalier
  const cadre = materiau(PALETTE.rouille, { rugosite: 0.7, metal: 0.3 });
  const tube = (l: number) => new THREE.CylinderGeometry(0.03, 0.03, l, 5);
  const t1 = ombre(new THREE.Mesh(tube(0.75), cadre));
  t1.position.set(-0.1, 0.9, 0);
  t1.rotation.z = 0.5;
  const t2 = ombre(new THREE.Mesh(tube(0.6), cadre));
  t2.position.set(-0.32, 0.8, 0);
  t2.rotation.z = -0.25;
  const selle = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.12), materiau(0x2b2b2b)));
  selle.position.set(-0.45, 1.12, 0);
  g.add(t1, t2, selle);
  // La roue-volant à l'avant, qui tourne quand on pédale
  const roue = ombre(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 5, 18), materiau(0x2b2b2b)));
  roue.position.set(0.45, 0.95, 0);
  g.add(roue);
  // La meule de pierre (montée plus tard)
  const meule = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14).rotateX(Math.PI / 2), materiau(0x9a9488)));
  meule.position.set(0.45, 0.95, 0.28);
  // La dynamo (montée plus tard), contre la roue, avec un fil
  const dynamo = new THREE.Group();
  const corps = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8), materiau(0xc9ccd0, { metal: 0.6, rugosite: 0.4 })));
  corps.position.set(0.8, 0.95, -0.08);
  const fil = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.008, 3, 10, Math.PI), materiau(0xd2691e));
  fil.position.set(0.8, 0.7, -0.08);
  fil.rotation.x = Math.PI / 2;
  dynamo.add(corps, fil);
  g.add(meule, dynamo);
  return { groupe: g, meule, dynamo, roue };
}

/** Le banc, et les batteries qu'on y a posées (elles ne sont visibles que si elles y sont). */
function banc(): { groupe: THREE.Group; posees: THREE.Group } {
  const g = new THREE.Group();
  const plateau = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.55), materiau(0xa07c48)));
  plateau.position.y = 0.6;
  g.add(plateau);
  for (const x of [-0.55, 0.55]) {
    const pied = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.5), materiau(PALETTE.bois)));
    pied.position.set(x, 0.3, 0);
    g.add(pied);
  }
  const support = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.2), materiau(0x2b2b2b, { rugosite: 0.5 })));
  support.position.set(-0.3, 0.75, 0);
  const regulateur = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.12), materiau(0xd8c43a, { rugosite: 0.5 })));
  regulateur.position.set(0.25, 0.69, 0.05);
  const voyant = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshBasicMaterial({ color: 0x5aff7a }));
  voyant.position.set(0.25, 0.75, 0.12);
  const cable1 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.01, 3, 10, Math.PI), materiau(0xc8362b));
  cable1.position.set(-0.03, 0.85, 0);
  const cable2 = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.01, 3, 10, Math.PI), materiau(0x2b2b2b));
  cable2.position.set(-0.03, 0.85, 0.06);
  g.add(support, regulateur, voyant, cable1, cable2);
  // Les batteries posées : une batterie de voiture au bout du banc, une petite batterie à côté
  const posees = new THREE.Group();
  const voiture = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.2), materiau(0x2b2b2b, { rugosite: 0.5 })));
  voiture.position.set(0.45, 0.75, -0.08);
  voiture.name = "batterie_voiture";
  const petite = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.1), materiau(0x3b5a8c, { rugosite: 0.5 })));
  petite.position.set(0.5, 0.69, 0.16);
  petite.name = "petite_batterie";
  for (const b of [voiture, petite]) {
    const borne = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 6), materiau(0xc8362b));
    borne.position.set(-0.05, b === voiture ? 0.12 : 0.06, 0);
    b.add(borne);
  }
  posees.add(voiture, petite);
  g.add(posees);
  return { groupe: g, posees };
}

/** Le petit panneau de la station, sur un chevalet de branches, incliné plein sud (vers +z). */
function panneauSolaire(): THREE.Group {
  const g = new THREE.Group();
  const bois = materiau(PALETTE.bois);
  for (const x of [-0.45, 0.45]) {
    const avant = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.75, 5), bois));
    avant.position.set(x, 0.36, 0.22);
    avant.rotation.x = 0.25;
    const arriere = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.05, 5), bois));
    arriere.position.set(x, 0.5, -0.22);
    arriere.rotation.x = -0.3;
    g.add(avant, arriere);
  }
  const panneau = new THREE.Group();
  const cadre = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.7), materiau(0xc9ccd0, { metal: 0.6, rugosite: 0.4 })));
  const cellules = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.62).rotateX(-Math.PI / 2), materiau(0x1f3550, { rugosite: 0.15, metal: 0.45 }));
  cellules.position.y = 0.03;
  // Le quadrillage des cellules
  for (let i = 1; i < 4; i++) {
    const ligne = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.62).rotateX(-Math.PI / 2), materiau(0x8fb3d6));
    ligne.position.set(-0.51 + i * 0.255, 0.032, 0);
    panneau.add(ligne);
  }
  panneau.add(cadre, cellules);
  panneau.position.set(0, 0.82, 0);
  // Incliné vers le sud : le haut du panneau au nord
  panneau.rotation.x = 0.6;
  g.add(panneau);
  return g;
}

const FUMEE_JOUR = new THREE.Color(0xa49e95);
const FUMEE_NUIT = new THREE.Color(0x2e333c);
let textureFumee: THREE.Texture | null = null;
function fumee(): THREE.Texture {
  if (textureFumee) return textureFumee;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const d = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  d.addColorStop(0, "rgba(255,255,255,0.6)");
  d.addColorStop(0.5, "rgba(255,255,255,0.25)");
  d.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = d;
  g.fillRect(0, 0, 64, 64);
  textureFumee = new THREE.CanvasTexture(c);
  textureFumee.colorSpace = THREE.SRGBColorSpace;
  return textureFumee;
}

// ---------- La gamme bushcraft, lot 1 (P-002, 2026-10-08) ----------

/** Une branche droite entre deux points (piquets, perches, lit). */
function perche(a: THREE.Vector3, b: THREE.Vector3, rayon: number, couleur: number = PALETTE.boisSombre): THREE.Mesh {
  const d = b.clone().sub(a);
  const m = ombre(new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon * 1.15, d.length(), 5), materiau(couleur)));
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

/** Le récupérateur de pluie : une bâche tendue en entonnoir sur quatre piquets, qui goutte dans une bassine. */
function recuperateur(): { groupe: THREE.Group; eau: THREE.Mesh } {
  const g = new THREE.Group();
  for (const [x, z, h] of [[-0.7, -0.7, 1.25], [0.7, -0.7, 1.25], [-0.7, 0.7, 1.05], [0.7, 0.7, 1.05]] as const) {
    g.add(perche(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, h, z), 0.035));
  }
  // La bâche : un carré qui creuse vers le centre (l'eau y coule).
  const bache = new THREE.PlaneGeometry(1.5, 1.5, 6, 6).rotateX(-Math.PI / 2);
  const pos = bache.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, 1.15 - 0.1 * z - 0.32 * Math.max(0, 1 - Math.hypot(x, z) / 0.75));
  }
  bache.computeVertexNormals();
  g.add(ombre(new THREE.Mesh(bache, new THREE.MeshStandardMaterial({ color: 0x2f6fa4, roughness: 0.7, side: THREE.DoubleSide, flatShading: true }))));
  // La bassine sous le trou, et l'eau dedans (son niveau suit l'état).
  const bassine = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.28, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a8f94, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide })));
  bassine.position.y = 0.14;
  g.add(bassine);
  const eau = new THREE.Mesh(new THREE.CircleGeometry(0.23, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5f8fa8, roughness: 0.15 }));
  eau.position.y = 0.02;
  g.add(eau);
  return { groupe: g, eau };
}

/** L'alarme : deux piquets, une ficelle tendue, des boîtes de conserve qui pendent. */
function alarme(): THREE.Group {
  const g = new THREE.Group();
  for (const x of [-0.6, 0.6]) g.add(perche(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, 0.55, 0), 0.025));
  g.add(perche(new THREE.Vector3(-0.6, 0.5, 0), new THREE.Vector3(0.6, 0.47, 0), 0.006, 0xd8cfb8));
  const boite = new THREE.CylinderGeometry(0.045, 0.045, 0.11, 10);
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8b4ac, metalness: 0.7, roughness: 0.35 });
  for (const x of [-0.2, 0.15]) {
    const b = ombre(new THREE.Mesh(boite, metal));
    b.position.set(x, 0.36, 0);
    b.rotation.z = x * 0.6;
    g.add(b);
    g.add(perche(new THREE.Vector3(x, 0.48, 0), new THREE.Vector3(x, 0.42, 0), 0.004, 0xd8cfb8));
  }
  return g;
}

/** Le lit de branchages : un cadre de branches, une épaisse couche de rameaux. */
function lit(): THREE.Group {
  const g = new THREE.Group();
  const aleat = aleatoire(57);
  for (const x of [-0.42, 0.42]) g.add(perche(new THREE.Vector3(x, 0.06, -0.95), new THREE.Vector3(x, 0.06, 0.95), 0.05));
  for (const z of [-0.95, 0.95]) g.add(perche(new THREE.Vector3(-0.45, 0.06, z), new THREE.Vector3(0.45, 0.06, z), 0.045));
  const vert = materiau(0x56703d);
  for (let i = 0; i < 26; i++) {
    const rameau = ombre(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 4), i % 3 === 0 ? materiau(0x6b7f45) : vert));
    rameau.rotation.set(Math.PI / 2, 0, (aleat() - 0.5) * 0.8);
    rameau.position.set((aleat() - 0.5) * 0.7, 0.1 + aleat() * 0.05, -0.8 + (i / 25) * 1.6);
    g.add(rameau);
  }
  return g;
}

/** Une installation affichée, avec son état (accessoires montés, meule qui fume). */
export class VueInstallation {
  readonly objet: THREE.Group;
  private donnees: InstallationVue;
  private readonly fumees: THREE.Sprite[] = [];
  private braise: THREE.Mesh | null = null;
  private meule: THREE.Object3D | null = null;
  private dynamo: THREE.Object3D | null = null;
  private roue: THREE.Object3D | null = null;
  private posees: THREE.Group | null = null;
  /** L'eau dans la bassine du récupérateur de pluie. */
  private eau: THREE.Mesh | null = null;
  private temps = 0;

  constructor(donnees: InstallationVue) {
    this.donnees = donnees;
    switch (donnees.type) {
      case "etabli":
        this.objet = etabli();
        break;
      case "abri":
        this.objet = abri();
        break;
      case "coffre":
        this.objet = coffre();
        break;
      case "charbonniere": {
        const c = charbonniere();
        this.objet = c.groupe;
        this.braise = c.braise;
        // La fumée de la charbonnière : épaisse et haute, visible de très loin (Book 02 §8 : 150 m).
        for (let i = 0; i < 22; i++) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fumee(), color: 0xa49e95, transparent: true, opacity: 0, depthWrite: false }));
          s.userData.age = (i / 22) * 7;
          this.fumees.push(s);
          this.objet.add(s);
        }
        break;
      }
      case "forge":
        this.objet = forge();
        break;
      case "pedalier": {
        const p = pedalier();
        this.objet = p.groupe;
        this.meule = p.meule;
        this.dynamo = p.dynamo;
        this.roue = p.roue;
        break;
      }
      case "banc_recharge": {
        const b = banc();
        this.objet = b.groupe;
        this.posees = b.posees;
        break;
      }
      case "panneau_solaire":
        this.objet = panneauSolaire();
        break;
      case "escabeau":
        this.objet = creerEscabeau();
        break;
      case "recuperateur_pluie": {
        const r = recuperateur();
        this.objet = r.groupe;
        this.eau = r.eau;
        break;
      }
      case "alarme_boites":
        this.objet = alarme();
        break;
      case "lit_branchages":
        this.objet = lit();
        break;
    }
    this.objet.position.set(donnees.x, 0, donnees.z);
    // Le panneau regarde toujours le sud, quelle que soit la façon dont on l'a posé.
    this.objet.rotation.y = donnees.type === "panneau_solaire" ? 0 : donnees.o;
    // Même image, moins d'appels de dessin : on fond les morceaux de même matériau, sauf les pièces qui bougent,
    // s'allument ou se montrent une à une (2026-10-08).
    for (const o of [this.braise, this.meule, this.dynamo, this.roue, this.posees, this.eau, ...this.fumees]) if (o) o.userData.intact = true;
    fusionnerStatique(this.objet);
    this.majEtat(donnees);
  }

  get id(): number {
    return this.donnees.id;
  }

  get vue(): InstallationVue {
    return this.donnees;
  }

  majEtat(donnees: InstallationVue): void {
    this.donnees = donnees;
    // Un objet lourd se déplace : sa place change, et dans les bras il n'est plus au sol.
    this.objet.position.set(donnees.x, 0, donnees.z);
    if (donnees.type !== "panneau_solaire") this.objet.rotation.y = donnees.o;
    this.objet.visible = !donnees.etat.portee;
    if (this.meule) this.meule.visible = donnees.etat.meule === true;
    if (this.dynamo) this.dynamo.visible = donnees.etat.dynamo === true;
    if (this.posees) for (const b of this.posees.children) b.visible = (donnees.etat.batteries?.[b.name as "petite_batterie"] ?? 0) > 0;
    // La bassine se remplit avec la pluie (jusqu'à 5 L : le bord).
    if (this.eau) {
      const l = donnees.etat.litres ?? 0;
      this.eau.visible = l > 0.05;
      this.eau.position.y = 0.02 + Math.min(1, l / 5) * 0.24;
    }
  }

  /** `maintenantServeur` : heure du serveur, pour savoir si la meule cuit encore. */
  animer(dt: number, maintenantServeur: number, nuit: number, enMarche: boolean): void {
    this.temps += dt;
    const cuit = this.donnees.type === "charbonniere" && this.donnees.etat.pretLe !== undefined && maintenantServeur < this.donnees.etat.pretLe;
    if (this.braise) (this.braise.material as THREE.MeshBasicMaterial).opacity = cuit ? (0.12 + Math.sin(this.temps * 1.7) * 0.05) * (0.4 + nuit) : 0;
    for (const s of this.fumees) {
      const age = ((s.userData.age as number) + dt) % 7;
      s.userData.age = age;
      const vie = age / 7;
      s.position.set(Math.sin(age * 0.9 + s.id) * 0.4 + vie * 1.2, 0.9 + vie * 8, Math.cos(age * 0.7 + s.id) * 0.3);
      s.scale.setScalar(0.9 + vie * 4);
      // Les sprites ne sont pas éclairés : la fumée s'assombrit d'elle-même la nuit.
      const m = s.material as THREE.SpriteMaterial;
      m.color.copy(FUMEE_JOUR).lerp(FUMEE_NUIT, nuit);
      m.opacity = cuit ? 0.5 * Math.sin(vie * Math.PI) * (1 - nuit * 0.45) : 0;
    }
    if (this.roue && enMarche) this.roue.rotation.z -= dt * 9;
  }
}
