// La visée du lancer et du tir (Book 23 §5, Book 25 §3.4, chantier 1 · 0.6).
//
// Tant qu'on tient Lancer, une ligne de points court au sol, du personnage à ce qu'on vise, et un cercle s'y pose :
// - une arme (pierre, hachette, flèche) s'accroche à l'Éteint le plus proche devant soi (sur ordinateur : la souris) ;
// - un leurre (le réveil) vise un point au sol à 8 m devant soi.
// Le cercle se referme à mesure que l'arc se bande ; il est blanc dans la portée utile, orange au-delà, rouge quand un
// tir plein détruirait (la tête est à portée). Pas de règle cachée : ce qu'on voit est ce que le serveur jugera.

import * as THREE from "three";
import { DISTANCE_LEURRE, armeTirExemplaire, couleurVisee, porteeDe, type Pret } from "../../commun/src/tir.ts";

/** Ce qu'on vise : un Éteint (son numéro), ou un point au sol. */
export interface Visee {
  x: number;
  z: number;
  cible: number | null;
  /** Direction (unitaire) et distance, à envoyer au serveur. */
  dx: number;
  dz: number;
  distance: number;
}

/** Un Éteint qu'on peut viser : sa place et son état. */
export interface Visable {
  id: number;
  x: number;
  z: number;
  debout: boolean;
}

/** On accroche l'Éteint le plus proche dans un cône de 30° devant soi (le serveur, lui, tolère 35° : le réseau). */
const DEMI_CONE = (30 * Math.PI) / 180;

/**
 * Ce qu'on vise, depuis `de` : un Éteint accroché (le plus proche, dans le cône, à portée), ou le point à la
 * distance voulue. `o` : la direction où l'on regarde (ou celle de la souris).
 */
export function viser(de: { x: number; z: number }, o: number, pret: Pret, eteints: Iterable<Visable>, pointSouris?: { x: number; z: number } | null): Visee {
  const portee = porteeDe(pret);
  const leurre = pret.genre === "lancer" && pret.def.genre === "leurre";
  // La souris donne la direction, et, pour un leurre, la distance.
  let ox = Math.sin(o);
  let oz = Math.cos(o);
  let voulu = leurre ? DISTANCE_LEURRE : portee;
  if (pointSouris) {
    const sx = pointSouris.x - de.x;
    const sz = pointSouris.z - de.z;
    const d = Math.hypot(sx, sz);
    if (d > 0.5) {
      ox = sx / d;
      oz = sz / d;
      if (leurre) voulu = d;
    }
  }
  voulu = Math.min(voulu, portee);
  if (!leurre) {
    let meilleur: Visable | null = null;
    let meilleure = Infinity;
    for (const e of eteints) {
      if (!e.debout) continue;
      const ex = e.x - de.x;
      const ez = e.z - de.z;
      const d = Math.hypot(ex, ez);
      if (d > portee || d < 0.3) continue;
      const ecart = Math.acos(Math.max(-1, Math.min(1, (ex * ox + ez * oz) / d)));
      if (ecart > DEMI_CONE) continue;
      if (d < meilleure) {
        meilleure = d;
        meilleur = e;
      }
    }
    if (meilleur) {
      return { x: meilleur.x, z: meilleur.z, cible: meilleur.id, dx: (meilleur.x - de.x) / meilleure, dz: (meilleur.z - de.z) / meilleure, distance: meilleure };
    }
  }
  return { x: de.x + ox * voulu, z: de.z + oz * voulu, cible: null, dx: ox, dz: oz, distance: voulu };
}

const COULEURS = { blanc: 0xf6f1e4, orange: 0xf0a030, rouge: 0xd8352a } as const;
const NB_POINTS = 14;

/** Le dessin de la visée : la ligne de points au sol, et le cercle qui se referme. */
export class DessinVisee {
  readonly objet = new THREE.Group();
  private readonly points: THREE.Mesh[] = [];
  private readonly anneau: THREE.Mesh;
  private readonly contour: THREE.Mesh;
  private readonly matiere = new THREE.MeshBasicMaterial({ color: COULEURS.blanc, transparent: true, opacity: 0.9, depthWrite: false, depthTest: false });
  private readonly sombre = new THREE.MeshBasicMaterial({ color: 0x1d1712, transparent: true, opacity: 0.45, depthWrite: false, depthTest: false });

  constructor() {
    const geoPoint = new THREE.CircleGeometry(0.06, 8).rotateX(-Math.PI / 2);
    for (let i = 0; i < NB_POINTS; i++) {
      const p = new THREE.Mesh(geoPoint, this.matiere);
      p.renderOrder = 22;
      this.points.push(p);
      this.objet.add(p);
    }
    // Un contour sombre sous le trait clair : lisible sur l'herbe comme sur le béton (comme l'anneau de visée de la 0.3).
    this.contour = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.06, 40).rotateX(-Math.PI / 2), this.sombre);
    this.contour.renderOrder = 22;
    this.anneau = new THREE.Mesh(new THREE.RingGeometry(0.93, 1.02, 40).rotateX(-Math.PI / 2), this.matiere);
    this.anneau.renderOrder = 23;
    this.objet.add(this.contour, this.anneau);
    this.objet.position.y = 0.04;
    this.objet.visible = false;
  }

  /**
   * Montre la visée de `de` vers `v`. `tenuMs` : depuis combien de temps on tient (l'arc se bande et le cercle se
   * referme). Rend la couleur du cercle (le client peut s'en servir pour le son).
   */
  montrer(de: { x: number; z: number }, v: Visee, pret: Pret, tenuMs: number): "blanc" | "orange" | "rouge" {
    this.objet.visible = true;
    let rayon = 0.5;
    let couleur: "blanc" | "orange" | "rouge" = "blanc";
    if (pret.genre === "tir") {
      const a = armeTirExemplaire(pret.cle, pret.arme);
      const part = a.degatsRapide === null ? 1 : Math.min(1, tenuMs / a.pleinMs);
      const plein = part >= 1;
      // Le cercle se referme : large au début (on tire au jugé), serré quand l'arc est bandé à fond.
      rayon = 1.3 - 0.85 * part;
      const tete = pret.munition?.tueALaTete ? a.porteeTete : null;
      couleur = v.cible === null ? (v.distance <= a.porteeUtile ? "blanc" : "orange") : couleurVisee(v.distance, a.porteeUtile, tete, plein);
    } else rayon = pret.def.genre === "leurre" ? 0.7 : 0.45;
    this.matiere.color.setHex(COULEURS[couleur]);
    this.anneau.scale.set(rayon, 1, rayon);
    this.contour.scale.set(rayon, 1, rayon);
    this.anneau.position.set(v.x, 0, v.z);
    this.contour.position.set(v.x, 0, v.z);
    // La ligne de points, du pied au cercle (elle s'arrête au bord du cercle).
    const dx = v.x - de.x;
    const dz = v.z - de.z;
    const d = Math.hypot(dx, dz);
    const utile = Math.max(0, d - rayon);
    for (let i = 0; i < NB_POINTS; i++) {
      const k = (i + 1) / (NB_POINTS + 1);
      const p = this.points[i]!;
      p.visible = utile > 0.4;
      const t = d > 0 ? (utile * k) / d : 0;
      p.position.set(de.x + dx * t, 0, de.z + dz * t);
      // Les points rapetissent vers la cible : on lit la direction d'un coup d'œil.
      const s = 1.15 - 0.5 * k;
      p.scale.set(s, 1, s);
    }
    return couleur;
  }

  cacher(): void {
    this.objet.visible = false;
  }
}
