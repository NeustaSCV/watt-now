// Le feu de camp (moment-vitrine n° 1, Book 21 §5.1.2) : cercle de pierres, bûches, flammes, braises, fumée.
// Passe de finition (2026-10-08) : pierres bosselées noircies de suie côté feu, bûches à écorce (fraîches quand le
// bois est juste empilé, calcinées au bout une fois le feu pris), langues de flamme vrillées, lit de cendres
// et de tisons, fumée en un seul appel de dessin (panache.ts). Le foyer Dakota : un trou dans un bourrelet de terre
// remuée, son évent à côté, le feu au fond.
// Le fantôme de pose (pose.ts) reprend le même foyer et les mêmes bûches : un seul modèle (Book 21 §5.2.5).

import * as THREE from "three";
import type { FeuVu } from "../../../commun/src/messages.ts";
import { Assemblage, BOIS, V, V3, X, Y, Z, bosseler, materiauSommets, placer, surface, tache } from "./assemblage.ts";
import { PALETTE, aleatoire } from "./materiaux.ts";
import type { SourceLumiere } from "./lumieres.ts";
import { Panache } from "./panache.ts";

const NB_FUMEE = 18;
/** Les étincelles qui montent du feu (moment-vitrine n° 1). */
const NB_ETINCELLES = 26;
const SUIE = 0x3b3632;
const TERRE = 0x6b5440;
const TROU = 0x1a120c;

/** Le profil d'un trou creusé (rayon intérieur `r`) : bourrelet de terre remuée, paroi, fond noir. */
function trou(c: Assemblage, x: number, z: number, r: number, aleat: () => number): void {
  const profil = [V(r * 2.1, 0), V(r * 1.6, 0.04), V(r * 1.25, 0.07), V(r * 1.05, 0.06), V(r * 0.98, 0.02), V(r * 0.9, 0.006), V(0, 0.004)];
  const g = bosseler(new THREE.LatheGeometry(profil, 14), r * 0.05, aleat);
  c.ajouterDegrade(g.translate(x, 0, z), (p) => {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < r * 0.95) return TROU;
    if (d < r * 1.1) return 0x2e2118;
    return p.y > 0.05 ? 0x7a6048 : (Math.round(p.x * 37 + p.z * 23) % 3 === 0 ? 0x5a4632 : TERRE);
  });
  // Des mottes et des cailloux sortis du trou.
  for (let i = 0; i < 5; i++) {
    const a = aleat() * Math.PI * 2;
    const d = r * (1.8 + aleat() * 0.8);
    c.ajouter(placer(bosseler(new THREE.DodecahedronGeometry(0.03 + aleat() * 0.03, 0), 0.008, aleat), x + Math.cos(a) * d, 0.02, z + Math.sin(a) * d, 0, aleat() * 3, 0), i % 2 ? TERRE : 0x5a4632, "mat", 0.05);
  }
}

/** Le foyer, sans bois : le cercle de pierres noircies (ou, pour un foyer Dakota, le trou et son évent). */
export function creerFoyer(dakota: boolean, graine: number): THREE.Group {
  const c = new Assemblage(graine);
  c.occlusion = 0.12;
  c.forceOcclusion = 0.3;
  const aleat = aleatoire(graine);
  if (dakota) {
    trou(c, 0, 0, 0.26, aleat);
    trou(c, 0, 0.55, 0.11, aleat);
  } else {
    // Dix pierres de la rivière, bosselées, posées en couronne ; la suie monte sur leur face tournée vers le feu.
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + aleat() * 0.25;
      const r = 0.11 + aleat() * 0.05;
      const teinte = [PALETTE.pierre, PALETTE.pierreSombre, 0x9a958a][Math.floor(aleat() * 3)]!;
      const g = bosseler(new THREE.IcosahedronGeometry(r, 0), r * 0.2, aleat).scale(1.25 + aleat() * 0.3, 0.75 + aleat() * 0.25, 1);
      const cx = Math.cos(a) * 0.52;
      const cz = Math.sin(a) * 0.52;
      placer(g, cx, r * 0.45, cz, 0, -a + (aleat() - 0.5) * 0.4, 0);
      c.ajouterDegrade(g, (p) => {
        const versFeu = (p.x - cx) * -Math.cos(a) + (p.z - cz) * -Math.sin(a);
        return versFeu > r * 0.25 && p.y > r * 0.3 ? SUIE : versFeu > -r * 0.1 && p.y > r * 0.7 ? 0x6e6a63 : teinte;
      });
    }
    // De petites pierres calées entre les grosses.
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      c.ajouter(placer(bosseler(new THREE.DodecahedronGeometry(0.05, 0), 0.01, aleat), Math.cos(a) * 0.62, 0.03, Math.sin(a) * 0.62), PALETTE.pierreSombre, "mat", 0.06);
    }
  }
  return c.groupe();
}

/** Une bûche du tipi (repère : pied à l'origine, montant vers +y), fraîche ou calcinée au bout. */
function geometrieBuche(dakota: boolean, i: number, calcinee: boolean): THREE.BufferGeometry {
  const c = new Assemblage(70 + i);
  const aleat = aleatoire(70 + i);
  const l = dakota ? 0.3 : 0.64;
  const r = dakota ? 0.035 : 0.05 + aleat() * 0.012;
  const g = bosseler(new THREE.CylinderGeometry(r * 0.8, r, l, 7, 3), r * 0.08, aleat).translate(0, l / 2, 0);
  const ecorce = i % 2 ? BOIS.sombre : BOIS.ecorce;
  c.ajouterDegrade(g, (p) => {
    const h = p.y / l;
    if (h > 0.985) return calcinee ? 0x1c1714 : BOIS.coupe;
    if (calcinee && h > 0.62) return h > 0.8 ? 0x1c1714 : 0x3a2c22;
    return Math.round(Math.atan2(p.z, p.x) * 3 + h * 5) % 3 === 0 ? 0x6b4e36 : ecorce;
  });
  // Un moignon de branche sur le côté.
  c.perche(new V3(r * 0.8, l * 0.35, 0), new V3(r * 2.4, l * 0.48, 0.01), r * 0.3, ecorce, "mat", 4, r * 0.2);
  return c.maillages()[0]!.geometry;
}

/** Les quatre bûches du tipi (chacune à part : on en montre plus ou moins selon le bois). */
function bucheMaillages(dakota: boolean): { maillages: THREE.Mesh[]; fraiches: THREE.BufferGeometry[]; calcinees: THREE.BufferGeometry[] } {
  const maillages: THREE.Mesh[] = [];
  const fraiches: THREE.BufferGeometry[] = [];
  const calcinees: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    fraiches.push(geometrieBuche(dakota, i, false));
    calcinees.push(geometrieBuche(dakota, i, true));
    const m = new THREE.Mesh(fraiches[i]!, materiauSommets("mat"));
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const ecart = dakota ? 0.13 : 0.22;
    m.position.set(Math.cos(a) * ecart, dakota ? 0.0 : 0.02, Math.sin(a) * ecart);
    m.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
    m.castShadow = true;
    m.receiveShadow = true;
    maillages.push(m);
  }
  return { maillages, fraiches, calcinees };
}

/** Le lit de cendres et de tisons (après le feu, et sous les braises). */
function lit(dakota: boolean, graine: number): THREE.Mesh {
  const c = new Assemblage(graine);
  const aleat = aleatoire(graine);
  const sol = surface(new V3(0, 0, 0), X, Z, Y);
  const r = dakota ? 0.2 : 0.4;
  c.plaque(tache(0, 0, r * 1.1, r, aleat, 11), sol, 0x4a4540, "mat", 0.012);
  c.plaque(tache(0, 0, r * 0.75, r * 0.7, aleat, 9), sol, 0x8a8580, "mat", 0.016);
  c.plaque(tache(0.05, -0.03, r * 0.4, r * 0.35, aleat, 7), sol, 0xa8a49e, "mat", 0.019);
  // Des tisons et des bouts de charbon dans la cendre.
  for (let i = 0; i < (dakota ? 4 : 9); i++) {
    const a = aleat() * Math.PI * 2;
    const d = aleat() * r * 0.75;
    c.ajouter(placer(new THREE.BoxGeometry(0.1 + aleat() * 0.08, 0.025, 0.03), Math.cos(a) * d, 0.03, Math.sin(a) * d, 0, aleat() * 3, 0), 0x221c18, "mat", 0.06);
  }
  return c.maillages()[0]!;
}

/** Une langue de flamme : un fuseau vrillé, penché, plus large en bas (repère : base à l'origine). */
function langue(hauteur: number, largeur: number, vrille: number, graine: number): THREE.BufferGeometry {
  const aleat = aleatoire(graine);
  const profil = [V(0, 0), V(largeur * 0.8, hauteur * 0.06), V(largeur, hauteur * 0.2), V(largeur * 0.75, hauteur * 0.45), V(largeur * 0.35, hauteur * 0.75), V(0, hauteur)];
  const g = new THREE.LatheGeometry(profil, 6);
  const p = g.getAttribute("position");
  const penche = (aleat() - 0.5) * 0.3;
  for (let i = 0; i < p.count; i++) {
    const h = p.getY(i) / hauteur;
    const a = vrille * h;
    const x = p.getX(i);
    const z = p.getZ(i);
    p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a) + penche * h * hauteur, p.getY(i), x * Math.sin(a) + z * Math.cos(a));
  }
  g.computeVertexNormals();
  return g;
}

export class FeuDeCamp {
  readonly objet = new THREE.Group();
  private etat: FeuVu;
  private readonly buches: THREE.Mesh[];
  private readonly bucheFraiche: THREE.BufferGeometry[];
  private readonly bucheCalcinee: THREE.BufferGeometry[];
  private readonly flammes: THREE.Mesh[] = [];
  private readonly braises: THREE.Mesh;
  private readonly cendres: THREE.Mesh;
  private readonly fumee: Panache;
  private readonly ages: Float32Array;
  private readonly matFlamme: THREE.MeshBasicMaterial;
  private temps = Math.random() * 10;
  private readonly etincelles: THREE.Points;
  private readonly vies: Float32Array;

  constructor(etat: FeuVu) {
    this.etat = etat;
    const graine = etat.id * 31 + 7;
    this.objet.position.set(etat.x, 0, etat.z);
    const dakota = etat.dakota === true;

    // Le foyer (pierres ou trou), fondu en un maillage.
    this.objet.add(creerFoyer(dakota, graine));

    // Les bûches en tipi (au fond du trou pour un Dakota).
    const b = bucheMaillages(dakota);
    this.buches = b.maillages;
    this.bucheFraiche = b.fraiches;
    this.bucheCalcinee = b.calcinees;
    for (const m of this.buches) this.objet.add(m);

    // Flammes : langues lumineuses en mélange additif, un cœur jaune pâle et des langues orangées autour.
    this.matFlamme = new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const coeur = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const rouge = new THREE.MeshBasicMaterial({ color: 0xc8401a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    const LANGUES: [number, number, number, THREE.Material, number, number][] = [
      [0.7, 0.13, 1.2, coeur, 0, 0],
      [0.55, 0.11, -1.4, this.matFlamme, 0.09, 0.4],
      [0.5, 0.1, 1.6, this.matFlamme, 0.1, 2.5],
      [0.45, 0.1, -1.1, this.matFlamme, 0.09, 4.4],
      [0.85, 0.2, 0.8, rouge, 0, 0],
    ];
    LANGUES.forEach(([h, l, v, mat, r, a], i) => {
      const m = new THREE.Mesh(langue(h, l, v, graine + i), mat);
      m.position.set(Math.cos(a) * r, dakota ? 0.0 : 0.05, Math.sin(a) * r);
      m.renderOrder = 3;
      this.flammes.push(m);
      this.objet.add(m);
    });

    // Braises (sous le bois, qui palpitent) et cendres.
    this.braises = new THREE.Mesh(
      new THREE.CircleGeometry(dakota ? 0.2 : 0.3, 12).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff4a1c, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.braises.position.y = 0.035;
    this.objet.add(this.braises);
    this.cendres = lit(dakota, graine + 5);
    this.objet.add(this.cendres);

    // Fumée : visible de loin, c'est la signature olfactive (Book 01 §2). Une seule colonne, un seul appel.
    this.fumee = new Panache(NB_FUMEE);
    this.ages = new Float32Array(NB_FUMEE);
    for (let i = 0; i < NB_FUMEE; i++) this.ages[i] = (i / NB_FUMEE) * 6;
    this.objet.add(this.fumee.objet);

    // Les étincelles : de petits points orange qui montent en tourbillonnant et s'éteignent.
    const positions = new Float32Array(NB_ETINCELLES * 3);
    this.vies = new Float32Array(NB_ETINCELLES);
    for (let i = 0; i < NB_ETINCELLES; i++) this.vies[i] = Math.random();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.etincelles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xffb05a, size: 0.07, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.etincelles.frustumCulled = false;
    this.objet.add(this.etincelles);
    this.appliquer();
  }

  get id(): number {
    return this.etat.id;
  }

  get x(): number {
    return this.etat.x;
  }

  get z(): number {
    return this.etat.z;
  }

  get aspect(): FeuVu["aspect"] {
    return this.etat.aspect;
  }

  get bois(): number {
    return this.etat.bois;
  }

  mettreAJourEtat(etat: FeuVu): void {
    this.etat = etat;
    this.appliquer();
  }

  private appliquer(): void {
    const { aspect, bois } = this.etat;
    const visiblesBuches = aspect === "cendres" ? 0 : Math.max(1, Math.min(4, Math.ceil(bois / 1.2)));
    // Le bois tout juste empilé est frais ; une fois le feu pris, le haut des bûches est calciné.
    this.buches.forEach((b, i) => {
      b.visible = i < visiblesBuches;
      b.geometry = aspect === "eteint" ? this.bucheFraiche[i]! : this.bucheCalcinee[i]!;
    });
    for (const f of this.flammes) f.visible = aspect === "flammes";
    this.braises.visible = aspect === "flammes" || aspect === "braises";
    this.cendres.visible = aspect !== "eteint";
  }

  /** La lumière que ce feu demande à la réserve, ou null s'il n'éclaire pas. */
  source(): SourceLumiere | null {
    if (this.etat.aspect === "flammes") {
      const force = Math.min(1, 0.55 + this.etat.bois / 6);
      // Le foyer Dakota éclaire à peine : la flamme est dans le sol.
      if (this.etat.dakota) return { x: this.etat.x, y: 0.5, z: this.etat.z, couleur: 0xff7a30, intensite: 3 * force, portee: 5, vacillement: 0.8 };
      return { x: this.etat.x, y: 1.1, z: this.etat.z, couleur: 0xff8a3d, intensite: 9 * force, portee: 13, vacillement: 1 };
    }
    if (this.etat.aspect === "braises") return { x: this.etat.x, y: 0.5, z: this.etat.z, couleur: 0xff4a1c, intensite: 2.2, portee: 4, vacillement: 0.6 };
    return null;
  }

  animer(dt: number, nuit: number): void {
    this.temps += dt;
    if (this.etat.aspect === "flammes") {
      const taille = Math.min(1.25, 0.6 + this.etat.bois / 5) * (this.etat.dakota ? 0.45 : 1);
      this.flammes.forEach((f, i) => {
        const s = 0.85 + Math.sin(this.temps * (9 + i * 2.3) + i) * 0.15 + Math.sin(this.temps * 17 + i * 4) * 0.08;
        const l = 1 + Math.sin(this.temps * (6 + i) + i * 2) * 0.12;
        f.scale.set(l, s * taille, l);
        f.rotation.y = this.temps * (0.6 + i * 0.3) * (i % 2 ? -1 : 1);
      });
      this.matFlamme.opacity = 0.75 + Math.sin(this.temps * 21) * 0.1;
    }
    const brule = this.etat.aspect === "flammes" || this.etat.aspect === "braises";
    (this.braises.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(this.temps * 3) * 0.2;

    // La fumée monte haut (on la voit de loin : c'est de la signature), s'élargit et se dissipe.
    // La nuit, le bas de la colonne est éclairé par les flammes, le haut se perd dans le noir.
    const couleur = new THREE.Color();
    for (let i = 0; i < NB_FUMEE; i++) {
      const age = (this.ages[i]! + dt) % 6;
      this.ages[i] = age;
      const vie = age / 6;
      const lueur = this.etat.aspect === "flammes" ? Math.max(0, 1 - vie * 3) * nuit : 0;
      couleur.setRGB(0.73 - nuit * 0.42 + lueur * 0.55, 0.71 - nuit * 0.42 + lueur * 0.25, 0.68 - nuit * 0.4);
      const opacite = brule ? (this.etat.aspect === "flammes" ? 0.55 : 0.28) * Math.sin(vie * Math.PI) * (1 - nuit * 0.35) * (this.etat.dakota ? 0.35 : 1) : 0;
      this.fumee.regler(i, Math.sin(age * 1.2 + i * 1.7) * 0.3 + vie * 1.6, 0.7 + vie * 7.5, Math.cos(age * 1.1 + i * 1.7) * 0.25, 0.5 + vie * 3, couleur, opacite);
    }
    this.fumee.objet.visible = brule;

    // Les étincelles, seulement quand ça flambe.
    this.etincelles.visible = this.etat.aspect === "flammes";
    if (this.etincelles.visible) {
      const pos = this.etincelles.geometry.attributes.position as THREE.BufferAttribute;
      const p = pos.array as Float32Array;
      const haut = this.etat.dakota ? 1.4 : 2.6;
      for (let i = 0; i < NB_ETINCELLES; i++) {
        let v = this.vies[i]! + dt * (0.6 + (i % 5) * 0.12);
        if (v > 1) v -= 1;
        this.vies[i] = v;
        const a = i * 2.4 + this.temps * (1.5 + (i % 3));
        const r = 0.08 + v * 0.35;
        p[i * 3] = Math.cos(a) * r + v * 0.25;
        p[i * 3 + 1] = 0.3 + v * haut;
        p[i * 3 + 2] = Math.sin(a) * r;
      }
      pos.needsUpdate = true;
      (this.etincelles.material as THREE.PointsMaterial).opacity = 0.55 + nuit * 0.4;
    }
  }
}

/** Le feu en devenir, pour le fantôme de pose : le même foyer et les mêmes bûches, sans flamme ni fumée. */
export function modeleFoyer(dakota: boolean): THREE.Group {
  const g = creerFoyer(dakota, 7);
  for (const m of bucheMaillages(dakota).maillages) g.add(m);
  return g;
}
