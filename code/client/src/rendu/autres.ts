// Les autres joueurs croisés à la halte et au comptoir (É4, lot 3) : leur personnage de famille (la silhouette se
// reconnaît de loin, Book 18 §4), leur nom au-dessus de la tête, et leur lampe la nuit.

import * as THREE from "three";
import type { AutreVu } from "../../../commun/src/messages.ts";
import type { Famille } from "../../../commun/src/regles.ts";
import { Personnage } from "./personnage.ts";

const COULEURS: Record<Famille, string> = { charbonniers: "#a4552f", voltaiques: "#2f5fa4", mecanistes: "#7f8f3a" };

function etiquette(pseudo: string, famille: Famille): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.font = "bold 26px 'Avenir Next', 'Helvetica Neue', sans-serif";
  const largeur = Math.min(240, g.measureText(pseudo).width + 44);
  const x0 = (256 - largeur) / 2;
  g.fillStyle = "rgba(20, 24, 32, 0.72)";
  // Une pastille arrondie (tracée à la main : roundRect manque sur les vieux Safari)
  g.beginPath();
  g.moveTo(x0 + 20, 12);
  g.lineTo(x0 + largeur - 20, 12);
  g.arc(x0 + largeur - 20, 32, 20, -Math.PI / 2, Math.PI / 2);
  g.lineTo(x0 + 20, 52);
  g.arc(x0 + 20, 32, 20, Math.PI / 2, -Math.PI / 2);
  g.fill();
  g.fillStyle = COULEURS[famille];
  g.beginPath();
  g.arc(x0 + 20, 32, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f2efe6";
  g.textBaseline = "middle";
  g.fillText(pseudo, x0 + 34, 33, largeur - 42);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(2, 0.5, 1);
  s.position.y = 2.25;
  s.renderOrder = 10;
  return s;
}

export class VueAutre {
  readonly personnage: Personnage;
  private cible: AutreVu;

  constructor(a: AutreVu) {
    this.cible = a;
    this.personnage = new Personnage(a.famille, a.apparence);
    this.personnage.objet.add(etiquette(a.pseudo, a.famille));
    this.personnage.objet.position.set(a.x, 0, a.z);
    this.personnage.objet.rotation.y = a.o;
  }

  get objet(): THREE.Group {
    return this.personnage.objet;
  }

  get donnees(): AutreVu {
    return this.cible;
  }

  maj(a: AutreVu): void {
    // L'identité arrive sans changer la dernière position connue (elle vient du message « positions »).
    this.cible = { ...a, x: this.cible.x, z: this.cible.z, o: this.cible.o };
  }

  /** Sa nouvelle position (message « positions », 10 fois par seconde). */
  deplacer(x: number, z: number, o: number): void {
    this.cible = { ...this.cible, x, z, o };
  }

  /** Glisse vers la dernière position reçue (10 fois par seconde), et anime la marche. */
  animer(dt: number): void {
    const p = this.objet.position;
    const avant = p.clone();
    const k = Math.min(1, dt * 10);
    p.x += (this.cible.x - p.x) * k;
    p.z += (this.cible.z - p.z) * k;
    const dO = Math.atan2(Math.sin(this.cible.o - this.objet.rotation.y), Math.cos(this.cible.o - this.objet.rotation.y));
    this.objet.rotation.y += dO * Math.min(1, dt * 12);
    this.personnage.animer(dt, Math.hypot(p.x - avant.x, p.z - avant.z) / Math.max(dt, 1e-3));
  }
}
