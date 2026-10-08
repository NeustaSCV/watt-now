// La décharge du terrain (P-001) : un tas d'ordures de l'Âge de l'Abondance. Sacs-poubelle crevés, une carcasse de
// frigo, des pneus, un cageot ; et, posés dessus, les petits objets qui ont remonté (leur nombre suit l'état).

import * as THREE from "three";
import { aleatoire } from "../../../commun/src/terrain.ts";
import { materiau, PALETTE } from "./materiaux.ts";

function ombre<T extends THREE.Object3D>(o: T): T {
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}

export function decharge(): { groupe: THREE.Group; trouvailles: THREE.Group } {
  const g = new THREE.Group();
  const aleat = aleatoire(404);
  // Le tas de terre et de gravats, bas et large.
  const tas = new THREE.SphereGeometry(1.9, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = tas.attributes.position!;
  for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) * 0.32 + (aleat() - 0.5) * 0.08);
  tas.computeVertexNormals();
  g.add(ombre(new THREE.Mesh(tas, materiau(0x6b5a45))));
  // Des sacs-poubelle noirs, crevés.
  const sac = new THREE.DodecahedronGeometry(0.32, 0);
  for (let i = 0; i < 6; i++) {
    const a = aleat() * Math.PI * 2;
    const r = 0.4 + aleat() * 1.2;
    const m = ombre(new THREE.Mesh(sac, materiau(i % 3 === 0 ? 0x2a6b3a : 0x1f2124)));
    m.position.set(Math.cos(a) * r, 0.35 + aleat() * 0.15, Math.sin(a) * r);
    m.scale.set(1, 0.75, 1.1);
    m.rotation.set(aleat(), aleat() * 3, aleat());
    g.add(m);
  }
  // La carcasse d'un frigo couché, porte ouverte.
  const frigo = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 1.45), materiau(0xd8d4c8)));
  frigo.position.set(-0.8, 0.45, 0.3);
  frigo.rotation.set(0.15, 0.6, 0.08);
  g.add(frigo);
  // Des pneus empilés.
  const pneu = new THREE.TorusGeometry(0.32, 0.12, 6, 12).rotateX(Math.PI / 2);
  for (let i = 0; i < 3; i++) {
    const p = ombre(new THREE.Mesh(pneu, materiau(0x232323)));
    p.position.set(1.1, 0.12 + i * 0.22, -0.6 + i * 0.05);
    g.add(p);
  }
  // Un cageot de bois.
  const cageot = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.38), materiau(PALETTE.bois)));
  cageot.position.set(0.2, 0.62, 0.9);
  cageot.rotation.y = 0.4;
  g.add(cageot);
  // Les trouvailles : de petits objets de couleur, un par objet remonté (jusqu'à 12).
  const trouvailles = new THREE.Group();
  const couleurs = [0xc8362b, 0x2f6fa4, 0xe0b040, 0x8a8f94, 0xb8b4ac, 0x6b7f45];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + aleat() * 0.4;
    const r = 0.3 + aleat() * 0.9;
    const geo = i % 3 === 0 ? new THREE.CylinderGeometry(0.07, 0.07, 0.16, 8) : i % 3 === 1 ? new THREE.BoxGeometry(0.2, 0.12, 0.14) : new THREE.SphereGeometry(0.09, 8, 6);
    const m = ombre(new THREE.Mesh(geo, materiau(couleurs[i % couleurs.length]!)));
    m.position.set(Math.cos(a) * r, 0.62 - r * 0.12, Math.sin(a) * r);
    m.rotation.set(aleat(), aleat() * 3, aleat());
    m.visible = false;
    trouvailles.add(m);
  }
  g.add(trouvailles);
  return { groupe: g, trouvailles };
}

/** Montre autant de trouvailles que d'objets remontés. */
export function majTrouvailles(trouvailles: THREE.Group, nombre: number): void {
  trouvailles.children.forEach((m, i) => (m.visible = i < nombre));
}
