// Les projectiles en vol (Book 23 §5, Book 25 §10.3, chantier 1 · 0.6) : la pierre, le réveil et la hachette lancés en
// cloche, la flèche et le carreau tendus ; puis l'impact (un peu de poussière, une gerbe d'eau dans la mare).
// Le serveur a déjà tout jugé : le client dessine le vol sur sa durée, et prévient à l'arrivée (sang, son).
//
// Style low poly du jeu (Assemblage : couleurs par sommet, facettes nuancées, 1 ou 2 appels de dessin par objet).
// Les modèles de métier (flèches, carreaux…) viennent du registre `metier/index.ts` quand un chantier les y inscrit.

import * as THREE from "three";
import { Assemblage, V3 } from "./assemblage.ts";
import { PALETTE } from "./materiaux.ts";
import { creerArme } from "./personnage.ts";
import { modeleMetier } from "./metier/index.ts";
import type { ProjectileVu } from "../../../commun/src/messages.ts";
import type { TypeObjet } from "../../../commun/src/objets.ts";

/** La pierre : un caillou à facettes, gris, un peu de lichen. */
function pierre(): THREE.Object3D {
  const c = new Assemblage(7);
  c.ajouter(new THREE.IcosahedronGeometry(0.075, 0).scale(1, 0.8, 0.9), PALETTE.pierre, "mat", 0.1);
  c.ajouter(new THREE.IcosahedronGeometry(0.03, 0).translate(0.03, 0.035, 0.01), 0x8f9a6a, "mat", 0.05);
  return c.groupe((m) => m);
}

/** Le réveil : un boîtier rouge, un cadran crème, deux cloches et leur marteau, deux petits pieds. */
function reveil(): THREE.Object3D {
  const c = new Assemblage(11);
  c.ajouter(new THREE.CylinderGeometry(0.07, 0.07, 0.045, 12).rotateX(Math.PI / 2), 0xb8322a, "tole", 0.04);
  c.ajouter(new THREE.CylinderGeometry(0.056, 0.056, 0.006, 12).rotateX(Math.PI / 2).translate(0, 0, 0.025), 0xeee3c8, "mat");
  // Les aiguilles.
  c.boite(0x2a2622, "mat", 0.006, 0.04, 0.003, 0, 0.015, 0.03);
  c.boite(0x2a2622, "mat", 0.03, 0.005, 0.003, 0.012, 0, 0.031);
  for (const x of [-0.045, 0.045]) {
    c.ajouter(new THREE.SphereGeometry(0.03, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, 0.075, 0), 0xd8b048, "metal");
    c.perche(new V3(x * 0.6, -0.06, 0), new V3(x * 0.9, -0.09, 0), 0.008, 0x3a3632, "metal", 5);
  }
  c.perche(new V3(0, 0.07, 0), new V3(0, 0.1, 0), 0.006, 0x3a3632, "metal", 5);
  return c.groupe((m) => m);
}

/** La flèche (en attendant le dessin du chantier 4) : un fût clair, une pointe sombre, trois plumes. */
function fleche(): THREE.Object3D {
  const c = new Assemblage(13);
  c.perche(new V3(0, 0, -0.36), new V3(0, 0, 0.32), 0.006, 0xc8a878, "mat", 5);
  c.ajouter(new THREE.ConeGeometry(0.014, 0.06, 5).rotateX(Math.PI / 2).translate(0, 0, 0.35), 0x4a4744, "metal");
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    c.boite(0xe8e0d0, "toile", 0.002, 0.03, 0.09, Math.sin(a) * 0.016, Math.cos(a) * 0.016, -0.31, 0, 0, a);
  }
  return c.groupe((m) => m);
}

/** Le modèle qui vole : celui du registre des métiers, l'arme de la main (la hachette), ou un dessin d'ici. */
function modeleEnVol(objet: TypeObjet, tir: boolean): THREE.Object3D {
  const enregistre = modeleMetier(objet, "vol");
  if (enregistre) return enregistre;
  if (objet === "pierre") return pierre();
  if (objet === ("reveil" as TypeObjet)) return reveil();
  if (tir) return fleche();
  return creerArme(objet) ?? pierre();
}

interface EnVol {
  p: ProjectileVu;
  modele: THREE.Object3D;
  age: number;
  /** La hauteur de la cloche (0 : tendu). */
  fleche: number;
  /** Rotation par seconde (une pierre roule, une hachette tournoie). */
  tour: number;
  arrivee: () => void;
}

interface Poussiere {
  maillage: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  age: number;
}

const GEO_POUSSIERE = new THREE.IcosahedronGeometry(0.05, 0);
const MAT_POUSSIERE = new THREE.MeshBasicMaterial({ color: 0xb9a888, transparent: true, opacity: 0.8, depthWrite: false });
const MAT_EAU = new THREE.MeshBasicMaterial({ color: 0xd8e8ee, transparent: true, opacity: 0.85, depthWrite: false });
const MAT_ECLATS = new THREE.MeshBasicMaterial({ color: 0x8a8378, transparent: true, opacity: 0.9, depthWrite: false });

/** Hauteur de la main qui lance, et de ce qu'on touche. */
const HAUTEUR_MAIN = 1.35;
const HAUTEUR_CORPS = 1.25;

export class Projectiles {
  readonly objet = new THREE.Group();
  private readonly enVol: EnVol[] = [];
  private readonly poussieres: Poussiere[] = [];

  /** Un projectile part ; `arrivee` est appelée à l'impact (le sang, le son). */
  lancer(p: ProjectileVu, arrivee: () => void): void {
    const modele = modeleEnVol(p.objet, p.tir === true);
    modele.position.set(p.x0, HAUTEUR_MAIN, p.z0);
    this.objet.add(modele);
    const d = Math.hypot(p.x1 - p.x0, p.z1 - p.z0);
    const enCloche = !p.tir;
    this.enVol.push({
      p,
      modele,
      age: 0,
      fleche: enCloche ? Math.min(2.4, 0.18 * d + 0.3) : 0.05 * d,
      tour: p.objet === "pierre" ? 9 : enCloche ? 14 : 0,
      arrivee,
    });
  }

  animer(dt: number): void {
    for (let i = this.enVol.length - 1; i >= 0; i--) {
      const v = this.enVol[i]!;
      v.age += dt;
      const duree = Math.max(0.12, v.p.duree / 1000);
      const t = Math.min(1, v.age / duree);
      const yFin = v.p.impact === "eteint" ? HAUTEUR_CORPS : v.p.impact === "mur" ? 1.1 : 0.08;
      const x = v.p.x0 + (v.p.x1 - v.p.x0) * t;
      const z = v.p.z0 + (v.p.z1 - v.p.z0) * t;
      const y = HAUTEUR_MAIN + (yFin - HAUTEUR_MAIN) * t + 4 * v.fleche * t * (1 - t);
      const avant = v.modele.position.clone();
      v.modele.position.set(x, y, z);
      if (v.tour > 0) v.modele.rotateX(v.tour * dt);
      else {
        // La flèche suit sa course : la pointe devant.
        const devant = v.modele.position.clone().add(v.modele.position.clone().sub(avant));
        v.modele.lookAt(devant);
      }
      if (t >= 1) {
        this.objet.remove(v.modele);
        this.enVol.splice(i, 1);
        this.impact(v.p, x, y, z);
        v.arrivee();
      }
    }
    for (let i = this.poussieres.length - 1; i >= 0; i--) {
      const g = this.poussieres[i]!;
      g.age += dt;
      g.vy -= 9 * dt;
      g.maillage.position.x += g.vx * dt;
      g.maillage.position.y = Math.max(0.02, g.maillage.position.y + g.vy * dt);
      g.maillage.position.z += g.vz * dt;
      const s = 1 + g.age * 1.5;
      g.maillage.scale.set(s, s, s);
      if (g.age > 0.6) {
        this.objet.remove(g.maillage);
        this.poussieres.splice(i, 1);
      }
    }
  }

  /** L'impact : de la poussière au sol, des éclats contre un mur, une gerbe dans l'eau (le sang vient d'ailleurs). */
  private impact(p: ProjectileVu, x: number, y: number, z: number): void {
    if (p.impact === "eteint") return;
    const mat = p.impact === "eau" ? MAT_EAU : p.impact === "mur" ? MAT_ECLATS : MAT_POUSSIERE;
    const n = p.impact === "eau" ? 9 : 6;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.random() * 0.5;
      const m = new THREE.Mesh(GEO_POUSSIERE, mat);
      m.position.set(x, Math.max(0.05, y), z);
      this.objet.add(m);
      const force = p.impact === "eau" ? 1.4 : 0.8;
      this.poussieres.push({ maillage: m, vx: Math.cos(a) * force, vy: p.impact === "eau" ? 2.6 : 1.4, vz: Math.sin(a) * force, age: 0 });
    }
  }

  /** On change de lieu : ce qui volait disparaît. */
  vider(): void {
    for (const v of this.enVol) this.objet.remove(v.modele);
    for (const g of this.poussieres) this.objet.remove(g.maillage);
    this.enVol.length = 0;
    this.poussieres.length = 0;
  }
}
