// Les essences du métier (Book 25 §3.2, 0.6), en low poly comme les fruitiers : le frêne de la lisière (écorce grise
// et lisse, bourgeons noirs, des rejets droits au pied : les perches), l'if du fond du bois (sombre, large, l'écorce
// rougeâtre qui s'écaille), et la haie d'ifs taillés en boules devant les bureaux de la Coopérative.
//
// Chaque modèle rend aussi son « contenu » : ce qui disparaît quand on l'a coupé (les perches, la branche droite), et
// revient à la repousse (ressources.ts s'en charge).

import * as THREE from "three";
import { materiau } from "./materiaux.ts";

export interface ModeleEssence {
  groupe: THREE.Group;
  contenu: THREE.Group;
}

type Ombre = (m: THREE.Mesh) => THREE.Mesh;

const ECORCE_FRENE = 0x9a968c;
const FEUILLAGE_FRENE = 0x7a9a52;
const BOURGEON = 0x1e1c1a;
const ECORCE_IF = 0x6a3e34;
const FEUILLAGE_IF = 0x2f4a2a;

/** Une perche droite, d'un point à l'autre, à six pans. */
function perche(de: THREE.Vector3, a: THREE.Vector3, rayon: number, couleur: number): THREE.Mesh {
  const d = a.clone().sub(de);
  const g = new THREE.CylinderGeometry(rayon * 0.7, rayon, d.length(), 6).translate(0, d.length() / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())).translate(de.x, de.y, de.z);
  return new THREE.Mesh(g, materiau(couleur));
}

/** Des lobes de feuillage à facettes, autour d'un centre (comme le houppier des fruitiers). */
function houppier(groupe: THREE.Group, centre: THREE.Vector3, rayon: number, etirement: number, couleur: number, n: number, aleat: () => number, ombre: Ombre): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + aleat();
    const c = i === 0 ? centre.clone() : centre.clone().add(new THREE.Vector3(Math.cos(a) * rayon * 0.55, (aleat() - 0.35) * rayon * 0.6 * etirement, Math.sin(a) * rayon * 0.55));
    const r = rayon * (i === 0 ? 0.85 : 0.58 + aleat() * 0.15);
    const lobe = ombre(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), materiau(new THREE.Color(couleur).offsetHSL(0, 0, (aleat() - 0.5) * 0.06).getHex())));
    lobe.position.copy(c);
    lobe.scale.y = etirement;
    lobe.rotation.set(aleat(), aleat(), aleat());
    groupe.add(lobe);
  }
}

/**
 * Le frêne : un fût haut et droit, gris et lisse, un houppier léger et ovale, vert clair. À son pied, trois ou quatre
 * rejets droits, coiffés de leur bourgeon noir : ce sont les perches qu'on coupe.
 */
export function frene(aleat: () => number, ombre: Ombre): ModeleEssence {
  const groupe = new THREE.Group();
  groupe.scale.setScalar(1.35);
  const haut = 2.3;
  groupe.add(ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, haut, 6).translate(0, haut / 2, 0), materiau(ECORCE_FRENE))));
  // Deux maîtresses branches qui montent en V, sous le houppier.
  for (const s of [-1, 1]) groupe.add(ombre(perche(new THREE.Vector3(0, haut * 0.75, 0), new THREE.Vector3(s * 0.45, haut + 0.5, s * 0.1), 0.06, ECORCE_FRENE)));
  houppier(groupe, new THREE.Vector3(0, haut + 0.95, 0), 1.0, 1.35, FEUILLAGE_FRENE, 6, aleat, ombre);
  // Les rejets du pied (les perches) : droits, gris-vert, un bourgeon noir au bout.
  const contenu = new THREE.Group();
  const nombre = 3 + Math.floor(aleat() * 2);
  const geoBourgeon = new THREE.IcosahedronGeometry(0.035, 0);
  for (let i = 0; i < nombre; i++) {
    const a = (i / nombre) * Math.PI * 2 + aleat() * 0.6;
    const pied = new THREE.Vector3(Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28);
    const tete = pied.clone().add(new THREE.Vector3(Math.cos(a) * 0.18, 1.5 + aleat() * 0.5, Math.sin(a) * 0.18));
    contenu.add(ombre(perche(pied, tete, 0.025, 0x8f9a7c)));
    const b = new THREE.Mesh(geoBourgeon, materiau(BOURGEON, { rugosite: 0.6 }));
    b.position.copy(tete);
    contenu.add(b);
    // Deux feuilles composées, en petites facettes, à mi-hauteur.
    const f = ombre(new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), materiau(FEUILLAGE_FRENE)));
    f.position.copy(pied.clone().lerp(tete, 0.7));
    f.scale.set(1.4, 0.5, 0.8);
    contenu.add(f);
  }
  groupe.add(contenu);
  return { groupe, contenu };
}

/**
 * L'if du fond du bois : un tronc court, cannelé, à l'écorce rougeâtre ; une masse sombre et large, presque noire. Une
 * branche droite en sort sur le côté : le bâton qu'on taille.
 */
export function ifSombre(aleat: () => number, ombre: Ombre): ModeleEssence {
  const groupe = new THREE.Group();
  groupe.scale.setScalar(1.3);
  const haut = 1.1;
  groupe.add(ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, haut, 7).translate(0, haut / 2, 0), materiau(ECORCE_IF))));
  // La masse sombre : des lobes serrés, une silhouette en cloche.
  houppier(groupe, new THREE.Vector3(0, haut + 0.9, 0), 1.25, 1.05, FEUILLAGE_IF, 7, aleat, ombre);
  const pointe = ombre(new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 7).translate(0, haut + 2.2, 0), materiau(0x2a4226)));
  groupe.add(pointe);
  const contenu = new THREE.Group();
  const a = aleat() * Math.PI * 2;
  const de = new THREE.Vector3(Math.cos(a) * 0.2, 0.8, Math.sin(a) * 0.2);
  const vers = new THREE.Vector3(Math.cos(a) * 1.3, 1.5, Math.sin(a) * 1.3);
  contenu.add(ombre(perche(de, vers, 0.04, 0x8a4a34)));
  const touffe = ombre(new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), materiau(FEUILLAGE_IF)));
  touffe.position.copy(vers);
  contenu.add(touffe);
  groupe.add(contenu);
  return { groupe, contenu };
}

/**
 * La haie d'ifs taillés en boules (Book 25 §3.2) : cinq boules sombres sur de courts troncs, alignées sur 8 m, le
 * long de la façade des bureaux. On ne les taille plus depuis longtemps : une branche droite dépasse de celle du milieu.
 */
export function haieIfs(aleat: () => number, ombre: Ombre): ModeleEssence {
  const groupe = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 2;
    const r = 0.6 + aleat() * 0.12;
    groupe.add(ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 5).translate(x, 0.2, 0), materiau(ECORCE_IF))));
    const boule = ombre(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), materiau(new THREE.Color(FEUILLAGE_IF).offsetHSL(0, 0, (aleat() - 0.5) * 0.05).getHex())));
    boule.position.set(x, 0.35 + r, 0);
    boule.scale.y = 0.9;
    groupe.add(boule);
    // Ce qui a repoussé depuis la dernière taille : quelques touffes qui dépassent.
    for (let k = 0; k < 2; k++) {
      const t = ombre(new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), materiau(0x3a5a32)));
      const a = aleat() * Math.PI * 2;
      t.position.set(x + Math.cos(a) * r * 0.85, 0.35 + r * (1.2 + aleat() * 0.4), Math.sin(a) * r * 0.85);
      groupe.add(t);
    }
  }
  const contenu = new THREE.Group();
  contenu.add(ombre(perche(new THREE.Vector3(0.1, 0.9, 0), new THREE.Vector3(0.5, 2.1, 0.2), 0.035, 0x8a4a34)));
  groupe.add(contenu);
  return { groupe, contenu };
}
