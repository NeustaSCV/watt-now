// ⚡ Les modèles des Voltaïques (Book 25 §5.3, chantier 6 · 0.6), dans le style low poly du jeu (assemblage à couleurs
// par sommet, un ou deux appels de dessin par objet) :
// - en main : la matraque de fortune (gourdin, appareil jetable et petite batterie scotchés), la matraque électrique
//   « la Raquette » (poignée de caoutchouc, pack de cellules, deux électrodes), l'aiguillon (un épieu câblé) ;
// - au sol : l'alarme électrique (un fil bas, une LED), la clôture de fortune et la clôture électrique (piquets, fils,
//   isolateurs de plastique blanc), la plaque de choc (une casserole aplatie), le bain de dérouillage.
//
// Bricolé, pas industriel (Book 15) : du ruban gris, des ligatures, du cuivre nu, des couleurs de l'Abondance passées.
// Chaque modèle est construit dans son repère : en main, le poing à l'origine et le manche selon +z (comme
// `creerArme`, personnage.ts) ; au sol, une ligne (clôture, alarme) court selon +z, comme son déclencheur
// (serveur/src/declencheurs.ts : la ligne suit l'orientation de l'installation).

import * as THREE from "three";
import { CAPACITES, type TypeBatterie } from "../../../../commun/src/energie.ts";
import type { EtatInstallation } from "../../../../commun/src/messages.ts";
import { Assemblage, BOIS, CORDE, V3, Z, bosseler, placer, touffe } from "../assemblage.ts";
import { PALETTE, aleatoire } from "../materiaux.ts";
import { modulePanneau } from "../pieces.ts";
import { enregistrerModele } from "./index.ts";

const RUBAN = 0x8e8f8c;
const CUIVRE = 0xc27a3e;
const CAOUTCHOUC = 0x2a2a2c;
const PLASTIQUE_BLANC = 0xe6e2d6;
const FIL_FER = 0x8a8780;
const ALU = 0xb9bcbc;
/** Le bleu de l'arc électrique (Book 25 §5.1 : un arc bleu, sobre). */
export const BLEU_ARC = 0x8fd4ff;

/** La LED des alarmes : un seul matériau pour toutes, qu'on allume quand l'une d'elles est franchie. */
const LED_ETEINTE = 0x4a1a16;
const LED_ALLUMEE = 0xff3b2a;
const materiauLed = new THREE.MeshBasicMaterial({ color: LED_ETEINTE });
let finLed = 0;
let minuterieLed: ReturnType<typeof setInterval> | null = null;

/** La LED des alarmes : allumée en ce moment ? (pour les tests). */
export function ledAllumee(): boolean {
  return performance.now() < finLed;
}

/** La LED des alarmes électriques s'allume et clignote quelques secondes (sans un bruit). */
export function allumerLed(secondes = 8): void {
  finLed = performance.now() + secondes * 1000;
  if (minuterieLed) return;
  minuterieLed = setInterval(() => {
    const reste = finLed - performance.now();
    if (reste <= 0) {
      materiauLed.color.setHex(LED_ETEINTE);
      if (minuterieLed) clearInterval(minuterieLed);
      minuterieLed = null;
      return;
    }
    materiauLed.color.setHex(Math.floor(reste / 250) % 2 === 0 ? LED_ALLUMEE : LED_ETEINTE);
  }, 125);
  // Hors du navigateur (les tests), la minuterie ne retient pas le programme.
  (minuterieLed as unknown as { unref?: () => void }).unref?.();
}

function groupe(...assemblages: Assemblage[]): THREE.Group {
  const g = new THREE.Group();
  for (const a of assemblages) for (const m of a.maillages()) g.add(m);
  return g;
}

/** Une arme en main : ses maillages ne reçoivent pas d'ombre (comme `creerArme`). */
function enMain(c: Assemblage, ...autres: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  for (const m of c.maillages()) {
    m.receiveShadow = false;
    g.add(m);
  }
  for (const o of autres) g.add(o);
  return g;
}

/** Deux électrodes au bout d'une arme, et la petite lueur bleue entre elles (le condensateur chargé). */
function electrodes(c: Assemblage, z: number, ecart: number, couleur: number = 0x9a9c9a): THREE.Mesh {
  for (const x of [-ecart, ecart]) c.perche(new V3(x, 0, z - 0.03), new V3(x, 0, z + 0.045), 0.0045, couleur, "metal", 4, 0.003);
  const lueur = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshBasicMaterial({ color: BLEU_ARC, transparent: true, opacity: 0.75 }));
  lueur.position.set(0, 0, z + 0.05);
  lueur.userData.intact = true;
  return lueur;
}

/** Un bout de ruban adhésif enroulé autour du manche. */
function ruban(c: Assemblage, z: number, rayon: number): void {
  c.ajouter(placer(new THREE.CylinderGeometry(rayon, rayon, 0.035, 7).rotateX(Math.PI / 2), 0, 0, z), RUBAN, "mat", 0.04);
}

// ---------- En main ----------

/** La matraque de fortune : un gourdin, l'appareil photo jetable (jaune) au bout, la petite batterie (bleue) scotchée. */
function matraqueFortune(): THREE.Group {
  const c = new Assemblage(601);
  const profil = [new THREE.Vector2(0, -0.12), new THREE.Vector2(0.02, -0.12), new THREE.Vector2(0.022, 0.1), new THREE.Vector2(0.032, 0.34), new THREE.Vector2(0.042, 0.5), new THREE.Vector2(0.038, 0.56), new THREE.Vector2(0, 0.57)];
  c.ajouter(new THREE.LatheGeometry(profil, 7).rotateX(Math.PI / 2), PALETTE.boisSombre, "mat", 0.07);
  c.perche(new V3(0, 0, -0.07), new V3(0, 0, 0.08), 0.026, PALETTE.cuir, "mat", 6, 0.025, 0.08);
  // La petite batterie du kit : lourde, scotchée au tiers du manche.
  c.boite(PALETTE.bleuTravail, "tole", 0.07, 0.09, 0.15, 0, 0.065, 0.2);
  c.boite(0x2f4a74, "tole", 0.072, 0.012, 0.152, 0, 0.115, 0.2);
  // L'appareil jetable, son flash tourné vers l'avant, contre la tête du gourdin.
  c.boite(0xd8a83a, "mat", 0.05, 0.06, 0.1, 0, 0.065, 0.44);
  c.boite(0xeeeae0, "verre", 0.03, 0.02, 0.005, 0, 0.075, 0.493);
  for (const z of [0.16, 0.25, 0.42, 0.47]) ruban(c, z, z < 0.3 ? 0.045 : 0.05);
  // Les fils de cuivre qui courent de la batterie au flash, puis aux deux bouts dénudés.
  c.perche(new V3(0.03, 0.04, 0.27), new V3(0.03, 0.05, 0.4), 0.003, CUIVRE, "metal", 3);
  const lueur = electrodes(c, 0.58, 0.018, CUIVRE);
  return enMain(c, lueur);
}

/** La matraque électrique, « la Raquette » : poignée de caoutchouc, pack de trois cellules, module, deux électrodes. */
function matraqueElectrique(): THREE.Group {
  const c = new Assemblage(602);
  // Un gourdin court, raboté, la poignée gainée de caoutchouc noir.
  c.perche(new V3(0, 0, -0.11), new V3(0, 0, 0.5), 0.022, PALETTE.bois, "mat", 7, 0.028, 0.06);
  c.perche(new V3(0, 0, -0.1), new V3(0, 0, 0.11), 0.027, CAOUTCHOUC, "mat", 7, 0.027, 0.03);
  for (const z of [-0.09, 0.0, 0.09]) c.ajouter(placer(new THREE.TorusGeometry(0.028, 0.004, 3, 8), 0, 0, z), 0x1a1a1c, "mat");
  // Le pack : trois cellules côte à côte, scotchées.
  for (const x of [-0.016, 0, 0.016]) c.ajouter(placer(new THREE.CylinderGeometry(0.009, 0.009, 0.065, 6).rotateX(Math.PI / 2), x, 0.034, 0.2), x === 0 ? 0x3d7a4a : 0x2f5d8a, "tole");
  ruban(c, 0.185, 0.04);
  // Le module de décharge : un boîtier vert de la raquette, un bouton rouge sous le pouce.
  c.boite(0x6f8f3a, "mat", 0.04, 0.035, 0.09, 0, 0.03, 0.34);
  c.ajouter(placer(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 6), 0, 0.052, 0.31), 0xc8362b, "mat");
  ruban(c, 0.36, 0.036);
  c.perche(new V3(0.02, 0.02, 0.23), new V3(0.012, 0.02, 0.3), 0.003, CUIVRE, "metal", 3);
  // Le bout : une tête de caoutchouc, deux électrodes d'acier.
  c.perche(new V3(0, 0, 0.48), new V3(0, 0, 0.52), 0.03, CAOUTCHOUC, "mat", 7, 0.024);
  const lueur = electrodes(c, 0.55, 0.014);
  return enMain(c, lueur);
}

/** L'aiguillon : un épieu, le pack et le module ligaturés près de la main, deux fils jusqu'aux électrodes du bout. */
function aiguillon(): THREE.Group {
  const c = new Assemblage(603);
  const perche = new THREE.CylinderGeometry(0.019, 0.023, 1.75, 6, 8).rotateX(Math.PI / 2).translate(0, 0, 0.42);
  c.ajouterDegrade(perche, (p) => (Math.sin(p.z * 9) > 0.7 ? 0x8a6a48 : 0xa78a62));
  c.boite(0x2f5d8a, "tole", 0.05, 0.03, 0.08, 0, 0.034, 0.2);
  c.boite(0x6f8f3a, "mat", 0.04, 0.03, 0.07, 0, 0.032, 0.3);
  for (const z of [0.17, 0.24, 0.33]) c.ligature(new V3(0, 0.01, z), Z, 0.03, CORDE);
  // Les deux fils de cuivre, spiralés autour de la perche jusqu'au bout.
  for (const s of [-1, 1]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const z = 0.34 + i * 0.096;
      const a = i * 0.7 + (s > 0 ? Math.PI : 0);
      pts.push(new V3(Math.cos(a) * 0.024, Math.sin(a) * 0.024, z));
    }
    c.ajouter(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.0025, 3, false), CUIVRE, "metal");
  }
  c.perche(new V3(0, 0, 1.28), new V3(0, 0, 1.31), 0.026, CAOUTCHOUC, "mat", 6, 0.02);
  const lueur = electrodes(c, 1.34, 0.013);
  return enMain(c, lueur);
}

// ---------- Au sol ----------

/** Un piquet de branche planté, droit. */
function piquet(c: Assemblage, z: number, h: number, aleat: () => number, x = 0): void {
  c.perche(new V3(x, -0.05, z), new V3(x + (aleat() - 0.5) * 0.03, h, z), 0.024, BOIS.ecorce, "mat", 5, 0.019);
  c.ajouter(placer(new THREE.ConeGeometry(0.022, 0.045, 5), x, h + 0.02, z), BOIS.coupe, "mat");
}

/** Un fil tendu d'un bout à l'autre, qui pend à peine. */
function fil(c: Assemblage, a: THREE.Vector3, b: THREE.Vector3, couleur = FIL_FER, fleche = 0.02, rayon = 0.0035): void {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push(a.clone().lerp(b, t).add(new V3(0, -fleche * 4 * t * (1 - t), 0)));
  }
  c.ajouter(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, rayon, 3, false), couleur, "metal");
}

/** L'alarme électrique : cinq mètres de fil de fer tendus bas, un boîtier (pile, ressort, LED) au premier piquet. */
function alarmeElectrique(): THREE.Group {
  const c = new Assemblage(611);
  c.occlusion = 0.2;
  const aleat = aleatoire(611);
  for (const z of [-2.5, 2.5]) {
    piquet(c, z, 0.32, aleat);
    touffe(c, 0, z, aleat, 3, 0.25);
  }
  fil(c, new V3(0, 0.2, -2.48), new V3(0, 0.2, 2.48), FIL_FER, 0.03, 0.0025);
  // Le boîtier : une boîte de conserve couchée, la pile dedans, le petit ressort de contact.
  c.ajouter(placer(new THREE.CylinderGeometry(0.04, 0.04, 0.09, 8).rotateZ(Math.PI / 2), 0.07, 0.25, -2.5), 0xb8b4ac, "metal", 0.04);
  c.ajouter(placer(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 6).rotateZ(Math.PI / 2), 0.07, 0.25, -2.45), 0x2b2b2b, "mat");
  c.ajouter(placer(new THREE.TorusGeometry(0.01, 0.002, 3, 6), 0.03, 0.21, -2.47, 0, Math.PI / 2, 0), FIL_FER, "metal");
  const g = groupe(c);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), materiauLed);
  led.position.set(0.07, 0.295, -2.5);
  led.userData.intact = true;
  g.add(led);
  return g;
}

/** Une clôture : des piquets, des fils sur isolateurs de plastique blanc, et sa source au premier piquet. */
function cloture(longueur: number, brins: number, graine: number, source: (c: Assemblage, z: number) => void): THREE.Group {
  const c = new Assemblage(graine);
  c.occlusion = 0.25;
  const aleat = aleatoire(graine);
  const n = Math.round(longueur / 2) + 1;
  const hauteurs = brins === 2 ? [0.4, 0.78] : [0.3, 0.6, 0.9];
  const zs = Array.from({ length: n }, (_, i) => -longueur / 2 + (i * longueur) / (n - 1));
  for (const z of zs) {
    piquet(c, z, hauteurs.at(-1)! + 0.12, aleat);
    touffe(c, 0, z, aleat, 2, 0.28);
    // Les isolateurs : des morceaux de plastique (bouchons, poignées de bidon) cloués au piquet.
    for (const h of hauteurs) c.boite(PLASTIQUE_BLANC, "mat", 0.03, 0.035, 0.03, 0.026, h, z);
  }
  for (const h of hauteurs) fil(c, new V3(0.032, h, -longueur / 2), new V3(0.032, h, longueur / 2), FIL_FER, 0.025);
  source(c, -longueur / 2);
  return groupe(c);
}

/** La clôture de fortune : 4 m, deux fils ; la raquette anti-moustiques ligaturée au premier piquet. */
function clotureFortune(): THREE.Group {
  return cloture(4, 2, 621, (c, z) => {
    c.boite(0xd8c43a, "mat", 0.05, 0.22, 0.03, -0.05, 0.6, z, 0, 0, 0.1);
    c.ajouter(placer(new THREE.TorusGeometry(0.09, 0.012, 4, 10), -0.06, 0.82, z, 0, Math.PI / 2, 0), 0xd8c43a, "mat");
    fil(c, new V3(-0.04, 0.5, z), new V3(0.03, 0.4, z + 0.05), CUIVRE, 0.01, 0.003);
    // Le câble vers le banc, qui court dans l'herbe.
    fil(c, new V3(-0.04, 0.5, z), new V3(-0.6, 0.02, z - 0.6), 0x2b2b2b, 0.15, 0.005);
  });
}

/** La clôture électrique : 6 m, trois fils ; l'électrificateur (boîtier gris, voyant rouge) au premier piquet. */
function clotureElectrique(): THREE.Group {
  return cloture(6, 3, 622, (c, z) => {
    c.boite(0x6b6862, "tole", 0.12, 0.16, 0.08, -0.08, 0.55, z);
    c.boite(0xc8362b, "mat", 0.02, 0.02, 0.01, -0.08, 0.6, z + 0.042);
    c.boite(PLASTIQUE_BLANC, "mat", 0.13, 0.015, 0.09, -0.08, 0.635, z);
    for (const h of [0.3, 0.6, 0.9]) fil(c, new V3(-0.04, 0.55, z), new V3(0.03, h, z + 0.03), CUIVRE, 0.01, 0.003);
    fil(c, new V3(-0.1, 0.48, z), new V3(-0.7, 0.02, z - 0.7), 0x2b2b2b, 0.15, 0.006);
  });
}

/** La plaque de choc : une casserole aplatie à plat dans le passage, le pack et le module à côté, le fil caché. */
function plaqueChoc(): THREE.Group {
  const c = new Assemblage(631);
  c.occlusion = 0.1;
  const aleat = aleatoire(631);
  const plaque = bosseler(new THREE.CylinderGeometry(0.34, 0.36, 0.02, 12, 1), 0.012, aleat);
  c.ajouter(placer(plaque, 0, 0.012, 0), ALU, "metal", 0.06);
  // Le manche de la casserole, replié, et des coups de marteau sombres.
  c.boite(0x3a3836, "mat", 0.03, 0.015, 0.16, 0, 0.012, 0.42, 0, 0.3, 0);
  for (let i = 0; i < 6; i++) {
    const a = aleat() * Math.PI * 2;
    const r = aleat() * 0.26;
    c.ajouter(placer(new THREE.CircleGeometry(0.03 + aleat() * 0.02, 6).rotateX(-Math.PI / 2), Math.cos(a) * r, 0.024, Math.sin(a) * r), 0x8a8d8d, "metal");
  }
  c.boite(0x2f5d8a, "tole", 0.07, 0.04, 0.1, 0.46, 0.02, -0.1);
  c.boite(0x6f8f3a, "mat", 0.06, 0.035, 0.08, 0.46, 0.02, 0.04);
  fil(c, new V3(0.42, 0.03, 0.0), new V3(0.3, 0.02, 0.0), CUIVRE, 0.0, 0.003);
  touffe(c, 0.5, 0.25, aleat, 3, 0.2);
  return groupe(c);
}

/** Le bain de dérouillage : une casserole d'eau trouble sur trois pierres, la barre sacrificielle, deux pinces. */
function bainDerouillage(): THREE.Group {
  const c = new Assemblage(641);
  c.occlusion = 0.2;
  const aleat = aleatoire(641);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.07, 0), 0.012, aleat).scale(1, 0.6, 1), Math.cos(a) * 0.15, 0.04, Math.sin(a) * 0.15), PALETTE.pierre, "mat", 0.06);
  }
  c.ajouter(placer(new THREE.CylinderGeometry(0.17, 0.15, 0.16, 12, 1, true), 0, 0.16, 0), ALU, "metal", 0.04);
  c.ajouter(placer(new THREE.CircleGeometry(0.15, 12).rotateX(-Math.PI / 2), 0, 0.075, 0), ALU, "metal");
  c.ajouter(placer(new THREE.CircleGeometry(0.162, 12).rotateX(-Math.PI / 2), 0, 0.21, 0), 0x6f6a4e, "verre");
  c.boite(0x3a3836, "mat", 0.2, 0.02, 0.03, 0.26, 0.23, 0);
  // La barre sacrificielle, rouillée, plongée de biais ; les pinces rouge et noire, leurs câbles vers le banc.
  c.perche(new V3(-0.06, 0.1, -0.05), new V3(-0.1, 0.42, -0.08), 0.012, PALETTE.rouille, "metal", 6);
  c.boite(0xc8362b, "mat", 0.04, 0.02, 0.02, -0.1, 0.4, -0.08);
  c.boite(0x2b2b2b, "mat", 0.04, 0.02, 0.02, 0.1, 0.25, 0.1);
  fil(c, new V3(-0.1, 0.4, -0.08), new V3(-0.5, 0.02, -0.6), 0xc8362b, 0.1, 0.005);
  fil(c, new V3(0.1, 0.25, 0.1), new V3(-0.45, 0.02, -0.65), 0x2b2b2b, 0.1, 0.005);
  return groupe(c);
}

// ---------- Le banc solaire (plan 0.8, chantier 7) ----------

/** La part de charge des batteries posées (0 à 1) : ce que montre la jauge. */
export function partDeCharge(etat: Pick<EtatInstallation, "batteries" | "charges">): number {
  let cap = 0;
  let wh = 0;
  for (const [b, n] of Object.entries(etat.batteries ?? {}) as [TypeBatterie, number][]) {
    cap += CAPACITES[b] * (n ?? 0);
    wh += etat.charges?.[b] ?? 0;
  }
  return cap > 0 ? Math.max(0, Math.min(1, wh / cap)) : 0;
}

/**
 * Le panneau posé sur le banc (les coordonnées sont celles du banc, installations.ts) : le petit panneau de la station
 * sur un cadre de branches dressé à l'arrière du plateau, incliné vers l'avant ; son câble descend au régulateur ; et
 * la jauge, une réglette posée devant le régulateur, dont la barre lumineuse dit la charge des batteries du banc (verte
 * pleine, ambre à mi-course, rouge presque vide).
 */
function bancPanneau(): THREE.Group {
  const c = new Assemblage(650);
  c.occlusion = 0.25;
  const aleat = aleatoire(650);
  // Le cadre : deux montants à l'arrière, deux jambes de force posées sur le plateau, des traverses ligaturées.
  for (const x of [-0.52, 0.52]) {
    c.perche(new V3(x, -0.03, -0.66), new V3(x, 1.3, -0.64), 0.03, BOIS.ecorce, "mat", 5, 0.025);
    c.perche(new V3(x, 0.63, -0.24), new V3(x, 0.92, -0.14), 0.025, BOIS.ecorce, "mat", 5, 0.022);
    c.ligature(new V3(x, 0.63, -0.24), Z, 0.03);
    c.ligature(new V3(x, 1.27, -0.64), Z, 0.032);
    c.ajouter(placer(bosseler(new THREE.DodecahedronGeometry(0.07, 0).scale(1, 0.6, 1), 0.015, aleat), x, 0.03, -0.66), PALETTE.pierreSombre, "mat", 0.06);
  }
  c.perche(new V3(-0.56, 1.28, -0.64), new V3(0.56, 1.28, -0.64), 0.022, BOIS.ecorce, "mat", 5);
  c.perche(new V3(-0.56, 0.9, -0.14), new V3(0.56, 0.9, -0.14), 0.02, BOIS.ecorce, "mat", 5);
  // Le câble : de la boîte de jonction, sous le panneau, jusqu'au régulateur jaune du banc.
  for (const [p0, p1] of [
    [new V3(0, 1.0, -0.42), new V3(-0.1, 0.8, -0.3)],
    [new V3(-0.1, 0.8, -0.3), new V3(-0.3, 0.7, -0.12)],
    [new V3(-0.3, 0.7, -0.12), new V3(-0.32, 0.7, -0.04)],
  ] as const)
    c.perche(p0, p1, 0.007, 0x1f1f1f, "mat", 4);
  // La jauge : une réglette noire sur deux pieds, devant le régulateur ; son fond éteint.
  c.boite(0x232323, "mat", 0.22, 0.06, 0.04, -0.02, 0.69, 0.2);
  for (const x of [-0.1, 0.06]) c.boite(0x232323, "mat", 0.02, 0.05, 0.02, x, 0.645, 0.2);
  c.boite(0x1f3324, "mat", 0.18, 0.026, 0.004, -0.02, 0.69, 0.222);
  for (let k = 1; k < 5; k++) c.boite(0x0e0e0e, "mat", 0.003, 0.03, 0.006, -0.11 + k * 0.036, 0.69, 0.224);
  const g = c.groupe();
  // Le panneau, incliné de 35° vers l'avant (le haut en arrière).
  const p = new Assemblage(651);
  modulePanneau(p);
  const panneau = p.groupe();
  panneau.position.set(0, 1.1, -0.4);
  panneau.rotation.x = 0.6;
  g.add(panneau);
  // La barre de la jauge : elle s'allonge avec la charge (l'origine à son bord gauche).
  const materiau = new THREE.MeshBasicMaterial({ color: 0x5aff7a });
  const barre = new THREE.Mesh(new THREE.BoxGeometry(0.176, 0.022, 0.004).translate(0.088, 0, 0), materiau);
  barre.position.set(-0.108, 0.69, 0.225);
  barre.userData.intact = true;
  barre.userData.majEtat = (etat: EtatInstallation) => {
    const f = partDeCharge(etat);
    barre.visible = f > 0.005;
    barre.scale.x = Math.max(0.03, f);
    materiau.color.setHex(f > 0.5 ? 0x5aff7a : f > 0.2 ? 0xffb23a : 0xff4a2a);
  };
  g.add(barre);
  g.userData.siEtat = "panneau";
  g.userData.intact = true;
  return g;
}

// ---------- L'enregistrement (Book 25 §10.4 : une ligne d'import dans metier/index.ts) ----------

enregistrerModele("matraque_fortune", "main", matraqueFortune);
enregistrerModele("matraque_electrique", "main", matraqueElectrique);
enregistrerModele("aiguillon", "main", aiguillon);
enregistrerModele("alarme_electrique", "sol", alarmeElectrique);
enregistrerModele("cloture_fortune", "sol", clotureFortune);
enregistrerModele("cloture_electrique", "sol", clotureElectrique);
enregistrerModele("plaque_choc", "sol", plaqueChoc);
enregistrerModele("bain_derouillage", "sol", bainDerouillage);
enregistrerModele("banc_panneau", "sol", bancPanneau);

/** Pour la planche de contrôle (planche-objets.ts) et les tests : les modèles de ce fichier. */
export const MODELES_ELECTRICITE = {
  main: { matraque_fortune: matraqueFortune, matraque_electrique: matraqueElectrique, aiguillon },
  sol: { alarme_electrique: alarmeElectrique, cloture_fortune: clotureFortune, cloture_electrique: clotureElectrique, plaque_choc: plaqueChoc, bain_derouillage: bainDerouillage, banc_panneau: bancPanneau },
} as const;
