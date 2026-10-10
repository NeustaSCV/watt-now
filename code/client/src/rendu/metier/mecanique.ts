// ⚙️ Les modèles des Mécanistes (Book 25 §6 et §10.3, chantier 7 · 0.6) : l'arbalète et la lourde en main, le carreau
// en vol, les pièges posés (armés et déclenchés), le tour à perche, et les deux accessoires du pédalier.
//
// Style low poly du jeu (Assemblage : couleurs par sommet, facettes nuancées). Chaque modèle est en mètres, posé au
// sol en y = 0 ; une arme se tient par la poignée (l'origine) et pointe vers +z, comme dans personnage.ts ; un
// projectile pointe vers +z, comme la flèche de projectiles.ts.
//
// Les pièges ont deux visages : les morceaux marqués `userData.siArme = true` se voient quand le piège est armé, ceux
// marqués `false` quand il a pris (installations.ts les montre selon l'état du déclencheur). Les accessoires du pédalier
// portent `userData.siEtat` : le nom du drapeau de l'état qui les montre (« soufflet », « meuleFine », « alternateur »).
// Depuis la 0.8 (plan 0.8, chantier 7), le pédalier générateur : le petit alternateur de la station, monté contre la
// roue, sa courroie et sa poulie qui tournent quand on pédale (`userData.animer`), et la batterie de la ruine posée au
// pied du bâti, câblée à l'alternateur (`userData.majEtat` : elle se montre quand une batterie est posée).

import * as THREE from "three";
import type { EtatInstallation } from "../../../../commun/src/messages.ts";
import { ACIER, Assemblage, BOIS, CORDE, NOIR, ROUILLE_SOMBRE, V3, Y, bosseler, placer, touffe } from "../assemblage.ts";
import { PALETTE, aleatoire } from "../materiaux.ts";
import { batterieVoiture } from "../pieces.ts";
import type { FabriqueModele, UsageModele } from "./index.ts";

const ROUILLE = PALETTE.rouille;
const ACIER_BLEUI = 0x3e4148;
const TERRE = 0x5e4a36;
const TERRE_SOMBRE = 0x2e241b;
const BACHE = 0x2f6fa4;

/** Un groupe de morceaux, marqué pour être montré selon l'état (et laissé à part de la fusion statique). */
function marque(g: THREE.Group, cle: "siArme" | "siEtat", valeur: boolean | string): THREE.Group {
  g.userData[cle] = valeur;
  g.userData.intact = true;
  return g;
}

/** Deux assemblages dans un groupe : ce qui ne change pas, et les deux visages d'un piège. */
function piege(fixe: Assemblage, arme: Assemblage, pris: Assemblage): THREE.Group {
  const g = fixe.groupe();
  g.add(marque(arme.groupe(), "siArme", true), marque(pris.groupe(), "siArme", false));
  return g;
}

// ---------- L'arbalète ----------

/** L'arbalète en main : un arbrier de bois, l'arc en travers, la corde armée sur la noix, l'étrier devant. */
function arbalete(lourde: boolean): THREE.Group {
  const c = new Assemblage(lourde ? 91 : 90);
  const bois = lourde ? BOIS.sombre : BOIS.moyen;
  // L'arbrier : la crosse sous le bras, le fût jusqu'à l'étrier ; la rainure du carreau, sombre, sur le dessus.
  c.boite(bois, "mat", 0.05, 0.06, 0.62, 0, 0, 0.12, 0, 0, 0);
  c.boite(bois, "mat", 0.055, 0.1, 0.18, 0, -0.03, -0.24, 0.15, 0, 0);
  c.boite(0x2a2018, "mat", 0.012, 0.004, 0.44, 0, 0.031, 0.2);
  // La noix (un disque d'os clair) et la détente sous le fût.
  c.ajouter(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8).rotateZ(Math.PI / 2).translate(0, 0.035, -0.02), 0xe0d6bc, "mat");
  c.perche(new V3(0, -0.03, -0.01), new V3(0, -0.11, -0.06), 0.006, ACIER, "metal", 4);
  // L'arc : deux branches bridées en travers, un peu ramenées vers l'arrière ; doublé pour la lourde.
  const avant = 0.4;
  const portee = lourde ? 0.34 : 0.3;
  const couleurArc = lourde ? ACIER_BLEUI : 0x8a6a3e;
  for (const s of [-1, 1]) {
    c.perche(new V3(0, 0.02, avant), new V3(s * portee, 0.02, avant - 0.07), lourde ? 0.012 : 0.014, couleurArc, lourde ? "metal" : "mat", 5, lourde ? 0.008 : 0.009);
    if (lourde) c.perche(new V3(0, 0.0, avant + 0.01), new V3(s * portee * 0.8, 0.0, avant - 0.04), 0.011, ACIER_BLEUI, "metal", 5, 0.007);
    // La corde, tendue jusqu'à la noix (armée).
    c.perche(new V3(s * portee, 0.025, avant - 0.07), new V3(0, 0.04, -0.02), 0.003, 0xd8cfb8, "mat", 3);
  }
  c.ligature(new V3(0, 0.02, avant), new V3(0, 0, 1), 0.04, CORDE);
  // L'étrier : un arceau de fer pour le pied.
  const etrier = new THREE.TorusGeometry(0.06, 0.007, 4, 10, Math.PI).rotateX(Math.PI / 2).translate(0, 0.0, avant + 0.04);
  c.ajouter(etrier, NOIR, "metal");
  return c.groupe((m) => m);
}

/** Le carreau en vol : un trait court de bois dur, trois ailettes, une pointe (d'os, ou d'acier). */
function carreau(acier: boolean): THREE.Group {
  const c = new Assemblage(acier ? 93 : 92);
  c.perche(new V3(0, 0, -0.17), new V3(0, 0, 0.15), 0.008, 0xb08a5a, "mat", 5);
  c.ajouter(new THREE.ConeGeometry(0.014, 0.05, 4).rotateX(Math.PI / 2).translate(0, 0, 0.17), acier ? 0x55575a : 0xe0d6bc, acier ? "metal" : "mat");
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    c.boite(0xe8e0d0, "toile", 0.002, 0.024, 0.06, Math.sin(a) * 0.014, Math.cos(a) * 0.014, -0.14, 0, 0, a);
  }
  return c.groupe((m) => m);
}

// ---------- Les pièges ----------

/** L'assommoir : deux bûches sur un châssis ; armé, levées sur la détente en 4 ; déclenché, tombées à plat. */
function assommoir(): THREE.Group {
  const aleat = aleatoire(94);
  const fixe = new Assemblage(94);
  fixe.occlusion = 0.25;
  for (const x of [-0.45, 0.45]) fixe.perche(new V3(x, -0.04, -0.4), new V3(x, 0.08, 0.4), 0.03, BOIS.ecorce, "mat", 5);
  touffe(fixe, -0.6, 0.3, aleat, 3, 0.25);
  touffe(fixe, 0.55, -0.35, aleat, 3, 0.25);
  const arme = new Assemblage(95);
  // Les bûches inclinées, le bout arrière au sol, l'avant tenu à 0,5 m par la détente.
  for (const x of [-0.13, 0.13]) arme.perche(new V3(x, 0.08, -0.45), new V3(x, 0.5, 0.35), 0.1, BOIS.ecorce, "mat", 7);
  // La détente en 4 : un montant, un levier, un bâton d'appât.
  arme.perche(new V3(0, 0, 0.38), new V3(0, 0.42, 0.38), 0.015, BOIS.coupe, "mat", 4);
  arme.perche(new V3(-0.02, 0.4, 0.42), new V3(0.04, 0.34, 0.1), 0.012, BOIS.coupe, "mat", 4);
  arme.perche(new V3(-0.2, 0.06, 0.4), new V3(0.15, 0.2, 0.38), 0.011, BOIS.coupe, "mat", 4);
  const pris = new Assemblage(96);
  for (const x of [-0.13, 0.13]) pris.perche(new V3(x, 0.1, -0.45), new V3(x + 0.03, 0.12, 0.38), 0.1, BOIS.ecorce, "mat", 7);
  pris.perche(new V3(0.25, 0.01, 0.45), new V3(0.4, 0.02, 0.3), 0.012, BOIS.coupe, "mat", 4);
  return piege(fixe, arme, pris);
}

/** Les mâchoires : deux demi-cercles d'acier sur une plaque, un ressort de chaque côté ; armées à plat, fermées debout. */
function machoires(vraies: boolean): THREE.Group {
  const aleat = aleatoire(vraies ? 97 : 98);
  const metal = vraies ? ACIER_BLEUI : ROUILLE;
  const fixe = new Assemblage(vraies ? 97 : 98);
  fixe.occlusion = 0.2;
  // La plaque d'appui et les deux ressorts (lames de camionnette, ou retrempés, plus sombres).
  fixe.boite(vraies ? 0x4a4c50 : ROUILLE_SOMBRE, "metal", 0.12, 0.02, 0.12, 0, 0.012, 0);
  for (const s of [-1, 1]) fixe.boite(metal, "metal", 0.36, 0.014, 0.05, s * 0.28, 0.01, 0, 0, 0, s * 0.05);
  // L'ancrage : une chaîne de vélo (le vrai), une corde (celui de fortune), jusqu'au piquet.
  const piquet = new V3(0.05, 0, -0.55);
  fixe.perche(piquet.clone().add(new V3(0, -0.05, 0)), piquet.clone().add(new V3(0, 0.12, 0)), 0.02, BOIS.ecorce, "mat", 5);
  fixe.perche(new V3(0, 0.01, -0.06), piquet.clone().add(new V3(0, 0.08, 0)), vraies ? 0.008 : 0.01, vraies ? 0x3a3836 : CORDE, vraies ? "metal" : "mat", 3);
  touffe(fixe, 0.3, 0.3, aleat, 3, 0.2);
  const arme = new Assemblage(99);
  for (const s of [-1, 1]) arme.ajouter(new THREE.TorusGeometry(0.16, 0.012, 3, 12, Math.PI).rotateX(-Math.PI / 2).rotateY(s > 0 ? 0 : Math.PI).translate(0, 0.02, 0), metal, "metal");
  // Les dents, couchées.
  for (let i = 0; i < 7; i++) arme.boite(metal, "metal", 0.012, 0.008, 0.03, -0.12 + i * 0.04, 0.03, (i % 2 ? 1 : -1) * 0.15);
  const pris = new Assemblage(100);
  for (const s of [-1, 1]) pris.ajouter(new THREE.TorusGeometry(0.16, 0.012, 3, 12, Math.PI).rotateX(s * 0.15).translate(0, 0.02, s * 0.01), metal, "metal");
  return piege(fixe, arme, pris);
}

/** La fosse à pieux : armée, un couvert de branches et de feuilles ; déclenchée, le trou ouvert, les pieux au fond. */
function fosse(): THREE.Group {
  const aleat = aleatoire(101);
  const fixe = new Assemblage(101);
  fixe.occlusion = 0.3;
  // La terre remuée autour du trou.
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + aleat() * 0.3;
    fixe.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.12, 0), 0.03, aleat).scale(1.4, 0.35, 1), Math.cos(a) * 0.82, 0.02, Math.sin(a) * 0.82), TERRE, "mat", 0.08);
  }
  const arme = new Assemblage(102);
  // Le couvert : des branches posées en travers, d'autres par-dessus en croix, des herbes sèches jetées sur le tout.
  arme.ajouter(new THREE.CircleGeometry(0.72, 10).rotateX(-Math.PI / 2).translate(0, 0.035, 0), PALETTE.herbeSeche, "mat", 0.12);
  for (let i = 0; i < 7; i++) {
    const z = -0.6 + i * 0.2 + (aleat() - 0.5) * 0.05;
    const demi = Math.sqrt(Math.max(0.05, 0.8 * 0.8 - z * z));
    arme.perche(new V3(-demi, 0.05, z), new V3(demi, 0.05, z + (aleat() - 0.5) * 0.1), 0.017, BOIS.ecorce, "mat", 4);
  }
  for (const x of [-0.35, 0.05, 0.4]) arme.perche(new V3(x, 0.08, -0.65), new V3(x + (aleat() - 0.5) * 0.15, 0.08, 0.65), 0.014, BOIS.ecorce, "mat", 4);
  const pris = new Assemblage(103);
  pris.ajouter(new THREE.CircleGeometry(0.72, 10).rotateX(-Math.PI / 2).translate(0, 0.01, 0), TERRE_SOMBRE, "mat", 0.05);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pris.ajouter(new THREE.ConeGeometry(0.03, 0.22, 4).translate(Math.cos(a) * 0.35, 0.1, Math.sin(a) * 0.35), BOIS.coupe, "mat");
  }
  for (let i = 0; i < 3; i++) pris.perche(new V3(-0.8 + i * 0.1, 0.03, 0.6 - i * 0.5), new V3(-0.5 + i * 0.2, 0.03, 0.85 - i * 0.6), 0.018, BOIS.ecorce, "mat", 4);
  return piege(fixe, arme, pris);
}

// ---------- Le tour à perche ----------

/** Deux poupées sur un banc de bûches, la pièce entre les pointes, la corde enroulée qui monte à la perche de frêne. */
function tourPerche(): THREE.Group {
  const aleat = aleatoire(104);
  const c = new Assemblage(104);
  c.occlusion = 0.3;
  // Le banc : deux bûches couchées sur quatre pieds.
  for (const z of [-0.08, 0.08]) c.perche(new V3(-0.75, 0.55, z), new V3(0.75, 0.55, z), 0.07, BOIS.ecorce, "mat", 7);
  for (const [x, z] of [[-0.65, -0.15], [-0.65, 0.15], [0.65, -0.15], [0.65, 0.15]] as const) c.perche(new V3(x, -0.03, z * 1.6), new V3(x, 0.52, z), 0.04, BOIS.ecorce, "mat", 5);
  // Les poupées et la pièce de bois tournée (un manche) entre leurs pointes.
  for (const x of [-0.3, 0.3]) c.boite(BOIS.clair, "mat", 0.08, 0.26, 0.14, x, 0.72, 0);
  c.perche(new V3(-0.26, 0.8, 0), new V3(0.26, 0.8, 0), 0.028, BOIS.coupe, "mat", 8, 0.024);
  // La perche de frêne, plantée derrière, qui fait ressort au-dessus du banc ; la corde descend à la pédale.
  const pied = new V3(-1.1, -0.05, -0.4);
  const bout = new V3(0.1, 1.95, 0.0);
  c.perche(pied, bout, 0.04, 0x8c8172, "mat", 6, 0.018);
  c.perche(new V3(-1.1, -0.05, -0.4), new V3(-1.05, 1.0, -0.38), 0.05, BOIS.ecorce, "mat", 5);
  c.perche(bout, new V3(0.02, 0.83, 0.02), 0.006, CORDE, "mat", 3);
  c.ligature(new V3(0, 0.8, 0), new V3(1, 0, 0), 0.034, CORDE);
  c.perche(new V3(0.0, 0.77, 0.03), new V3(0.1, 0.08, 0.35), 0.006, CORDE, "mat", 3);
  // La pédale : une planche articulée au sol.
  c.boite(BOIS.moyen, "mat", 0.12, 0.03, 0.55, 0.1, 0.06, 0.45, 0.15, 0, 0);
  // Les copeaux au pied du tour.
  for (let i = 0; i < 8; i++) c.boite(BOIS.coupe, "mat", 0.04, 0.005, 0.015, (aleat() - 0.5) * 0.6, 0.004, (aleat() - 0.2) * 0.4, 0, aleat() * 3, 0);
  touffe(c, 0.9, -0.3, aleat, 3, 0.25);
  return c.groupe();
}

// ---------- Les accessoires du pédalier ----------

/** La meule fine : une pierre plus petite, plus claire, sur l'axe prolongé de la meule, et le chiffon de cuir. */
function meuleFine(): THREE.Group {
  const c = new Assemblage(105);
  const aleat = aleatoire(105);
  // Même axe que la meule de grès du pédalier (moyeu à x 0,45, y 0,95), un cran plus loin.
  c.ajouter(placer(bosseler(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 14, 1).rotateX(Math.PI / 2), 0.003, aleat), 0.45, 0.95, 0.44), 0xcfc6b0, "mat", 0.04);
  c.ajouter(placer(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 5).rotateX(Math.PI / 2), 0.45, 0.95, 0.42), ACIER, "metal");
  // Le cuir de l'affûteur, plié sur la traverse.
  c.boite(0x7a4e32, "toile", 0.18, 0.012, 0.12, 0.62, 0.15, 0.32, 0, 0.3, 0.1);
  return marque(c.groupe(), "siEtat", "meuleFine");
}

/** Le ventilateur à manivelle : une poche de bâche entre deux planches, sur un bâti de branches, entraînée par une courroie. */
function soufflet(): THREE.Group {
  const c = new Assemblage(106);
  c.occlusion = 0.25;
  const x = 1.15;
  // Le bâti de quatre branches.
  for (const [dx, dz] of [[-0.18, -0.2], [0.18, -0.2], [-0.18, 0.2], [0.18, 0.2]] as const) c.perche(new V3(x + dx, -0.03, dz), new V3(x + dx * 0.7, 0.42, dz * 0.7), 0.022, BOIS.ecorce, "mat", 5);
  // Les deux planches et la poche de bâche, gonflée entre elles.
  c.boite(BOIS.clair, "mat", 0.36, 0.025, 0.3, x, 0.42, 0, 0, 0, 0.05);
  c.boite(BOIS.clair, "mat", 0.36, 0.025, 0.3, x, 0.6, 0, 0, 0, -0.12);
  c.ajouter(placer(new THREE.SphereGeometry(0.17, 8, 4).scale(1.05, 0.45, 0.85), x, 0.51, 0), BACHE, "toile", 0.08);
  // La buse, qui file vers la forge.
  c.perche(new V3(x + 0.18, 0.5, 0), new V3(x + 0.55, 0.3, 0.05), 0.025, ACIER, "metal", 6, 0.015);
  // La bielle et la courroie, depuis la roue-volant du pédalier.
  c.perche(new V3(0.45, 0.95, 0.06), new V3(x - 0.12, 0.62, 0.0), 0.006, 0x3a3836, "metal", 3);
  c.perche(new V3(0.45, 0.62, 0.06), new V3(x - 0.15, 0.45, 0.0), 0.006, 0x3a3836, "metal", 3);
  c.ligature(new V3(x + 0.12, 0.25, 0.14), Y, 0.025, CORDE);
  return marque(c.groupe(), "siEtat", "soufflet");
}

// ---------- Le pédalier générateur (plan 0.8, chantier 7) ----------

/** Le moyeu de la roue-volant du pédalier (installations.ts), et l'axe prolongé où l'on cale la grande poulie. */
const MOYEU = new V3(0.45, 0.95, 0);
const Z_COURROIE = -0.14;
/** Le petit alternateur, sur son support, en contrebas et en arrière de la roue. */
const ALTERNATEUR = new V3(0.86, 0.5, -0.2);
const R_GRANDE = 0.1;
const R_PETITE = 0.034;
const ALU = 0xb9bcbc;
const CAOUTCHOUC = 0x1e1e1e;

/** Une poulie d'axe z, centrée sur l'origine : la jante, la gorge sombre, trois rayons (on la voit tourner). */
function poulie(c: Assemblage, r: number, metal: number): void {
  c.ajouter(new THREE.CylinderGeometry(r, r, 0.03, 14).rotateX(Math.PI / 2), metal, "metal");
  c.ajouter(new THREE.TorusGeometry(r * 0.96, 0.006, 3, 14).translate(0, 0, 0), 0x2a2826, "metal");
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    c.boite(0x3a3836, "metal", r * 1.4, 0.008, 0.034, Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35, 0, 0, 0, a);
  }
}

/** Une pièce qui tourne quand on pédale (installations.ts appelle `userData.animer`). */
function tournante(g: THREE.Group, vitesse: number): THREE.Group {
  g.userData.intact = true;
  g.userData.animer = (dt: number, enMarche: boolean) => {
    if (enMarche) g.rotation.z -= dt * vitesse;
  };
  return g;
}

/**
 * L'alternateur monté : le carter d'alu à ailettes d'une petite voiture, le ventilateur et la poulie devant, la borne
 * rouge derrière ; un support de bois et une bride d'acier sur le patin ; la grande poulie calée sur l'axe de la roue,
 * et la courroie qui les relie (le rapport fait tourner l'alternateur trois fois plus vite que la roue).
 */
function alternateur(): THREE.Group {
  const c = new Assemblage(107);
  c.occlusion = 0.25;
  const a = ALTERNATEUR;
  // Le support : un billot dressé sur le patin, la bride d'acier, deux tire-fond.
  c.perche(new V3(a.x, 0.04, -0.26), new V3(a.x, a.y - 0.08, -0.24), 0.055, BOIS.ecorce, "mat", 6, 0.05);
  c.boite(ACIER, "metal", 0.04, 0.13, 0.012, a.x - 0.075, a.y - 0.05, a.z - 0.01);
  c.boite(ACIER, "metal", 0.04, 0.13, 0.012, a.x + 0.075, a.y - 0.05, a.z - 0.01);
  for (const s of [-1, 1]) c.ajouter(placer(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 6).rotateX(Math.PI / 2), a.x + s * 0.075, a.y - 0.1, a.z), 0x8a8780, "metal");
  // Le carter : deux demi-coquilles d'alu, des ailettes sombres, quatre vis de serrage.
  c.ajouter(placer(new THREE.CylinderGeometry(0.072, 0.072, 0.12, 12).rotateX(Math.PI / 2), a.x, a.y, a.z - 0.02), ALU, "metal");
  for (let k = 0; k < 4; k++) c.ajouter(placer(new THREE.TorusGeometry(0.073, 0.004, 3, 12), a.x, a.y, a.z - 0.07 + k * 0.032), 0x6b6862, "metal");
  for (let k = 0; k < 4; k++) {
    const t = (k / 4) * Math.PI * 2 + 0.4;
    c.perche(new V3(a.x + Math.cos(t) * 0.07, a.y + Math.sin(t) * 0.07, a.z - 0.085), new V3(a.x + Math.cos(t) * 0.07, a.y + Math.sin(t) * 0.07, a.z + 0.045), 0.006, 0x8a8780, "metal", 4);
  }
  // Derrière : la borne B+ sous son capuchon rouge, et le connecteur du régulateur.
  c.ajouter(placer(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 6).rotateX(Math.PI / 2), a.x + 0.03, a.y + 0.02, a.z - 0.1), 0xc8362b, "mat");
  c.boite(0x2a2826, "mat", 0.03, 0.02, 0.02, a.x - 0.03, a.y - 0.01, a.z - 0.095);
  // La courroie : deux brins tendus, tangents aux deux poulies (la grande sur l'axe de la roue, la petite devant).
  const hub = new V3(MOYEU.x, MOYEU.y, Z_COURROIE);
  const pt = new V3(a.x, a.y, Z_COURROIE);
  const d = pt.clone().sub(hub).normalize();
  const n = new V3(-d.y, d.x, 0);
  for (const s of [-1, 1]) c.perche(hub.clone().addScaledVector(n, s * R_GRANDE), pt.clone().addScaledVector(n, s * R_PETITE), 0.006, CAOUTCHOUC, "mat", 4);
  // Le prolongement de l'axe de la roue, jusqu'à la grande poulie.
  c.perche(new V3(MOYEU.x, MOYEU.y, -0.05), new V3(MOYEU.x, MOYEU.y, Z_COURROIE - 0.02), 0.013, ACIER, "metal", 5);
  const g = c.groupe();

  // La grande poulie (sur l'axe de la roue) et la petite (l'alternateur, avec son ventilateur) : elles tournent.
  let p = new Assemblage(108);
  poulie(p, R_GRANDE, 0x55524d);
  const grande = tournante(p.groupe(), 9);
  grande.position.set(MOYEU.x, MOYEU.y, Z_COURROIE);
  p = new Assemblage(109);
  poulie(p, R_PETITE, ACIER);
  for (let k = 0; k < 6; k++) {
    const t = (k / 6) * Math.PI * 2;
    p.boite(0x3a3836, "metal", 0.05, 0.014, 0.004, Math.cos(t) * 0.04, Math.sin(t) * 0.04, -0.03, 0, 0, t + 0.5);
  }
  const petite = tournante(p.groupe(), 9 * (R_GRANDE / R_PETITE));
  petite.position.set(a.x, a.y, Z_COURROIE);
  g.add(grande, petite);
  return marque(g, "siEtat", "alternateur");
}

/**
 * La batterie posée sur le pédalier : celle de la ruine, au pied du bâti, ses deux câbles (rouge, noir) jusqu'à
 * l'alternateur. Elle se montre quand une batterie est posée (la petite batterie du kit : un boîtier bleu).
 */
function batteriePedalier(): THREE.Group {
  const g = new THREE.Group();
  g.userData.intact = true;
  let c = new Assemblage(110);
  batterieVoiture(c);
  const voiture = c.groupe();
  voiture.position.set(0.66, 0.0, -0.6);
  voiture.rotation.y = 0.35;
  c = new Assemblage(111);
  c.boite(PALETTE.bleuTravail, "tole", 0.16, 0.1, 0.1, 0, 0.05, 0);
  c.boite(0x2f4a74, "tole", 0.165, 0.02, 0.105, 0, 0.105, 0);
  const petite = c.groupe();
  petite.position.set(0.4, 0.0, -0.55);
  c = new Assemblage(112);
  for (const [dz, couleur] of [[0.0, 0xc8362b], [0.03, 0x2b2b2b]] as const) {
    const pts = [new V3(ALTERNATEUR.x + 0.03, ALTERNATEUR.y + 0.02, ALTERNATEUR.z - 0.11), new V3(0.9, 0.3, -0.36 - dz), new V3(0.8, 0.08, -0.5 - dz), new V3(0.66, 0.25, -0.62 + dz)];
    for (let k = 0; k < pts.length - 1; k++) c.perche(pts[k]!, pts[k + 1]!, 0.007, couleur, "mat", 4);
  }
  const cables = c.groupe();
  g.add(voiture, petite, cables);
  g.userData.majEtat = (etat: EtatInstallation) => {
    const v = (etat.batteries?.batterie_voiture ?? 0) > 0;
    const p = (etat.batteries?.petite_batterie ?? 0) > 0;
    voiture.visible = v;
    petite.visible = p && !v;
    cables.visible = v || p;
  };
  return g;
}

/** Les modèles des Mécanistes, à enregistrer au registre (metier/index.ts). */
export function modelesMecanique(): [objet: string, usage: UsageModele, fabrique: FabriqueModele][] {
  return [
    ["arbalete", "main", () => arbalete(false)],
    ["arbalete_lourde", "main", () => arbalete(true)],
    ["carreau", "vol", () => carreau(false)],
    ["carreau_acier", "vol", () => carreau(true)],
    ["assommoir", "sol", assommoir],
    ["machoires_fortune", "sol", () => machoires(false)],
    ["piege_machoires", "sol", () => machoires(true)],
    ["fosse_pieux", "sol", fosse],
    ["tour_perche", "sol", tourPerche],
    // Les accessoires, posés sur le pédalier : leurs coordonnées sont celles du modèle du pédalier (installations.ts).
    ["pedalier_meule_fine", "sol", meuleFine],
    ["pedalier_soufflet", "sol", soufflet],
    ["pedalier_alternateur", "sol", alternateur],
    ["pedalier_batterie", "sol", batteriePedalier],
  ];
}
