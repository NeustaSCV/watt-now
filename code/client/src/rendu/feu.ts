// Le feu de camp (moment-vitrine n° 1, Book 21 §5.1.2) : cercle de pierres, bûches, flammes, braises, fumée.
// Version É1 : tout est fait en code. La passe de finition (J2) affinera flammes et fumée.

import * as THREE from "three";
import type { FeuVu } from "../../../commun/src/messages.ts";
import { PALETTE, aleatoire, materiau } from "./materiaux.ts";
import type { SourceLumiere } from "./lumieres.ts";

const NB_FUMEE = 18;
/** Les étincelles qui montent du feu (moment-vitrine n° 1). */
const NB_ETINCELLES = 26;

function textureFumee(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const d = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  d.addColorStop(0, "rgba(255,255,255,0.55)");
  d.addColorStop(0.5, "rgba(255,255,255,0.22)");
  d.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = d;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let textureFumeePartagee: THREE.Texture | null = null;

export class FeuDeCamp {
  readonly objet = new THREE.Group();
  private etat: FeuVu;
  private readonly buches: THREE.Mesh[] = [];
  private readonly flammes: THREE.Mesh[] = [];
  private readonly braises: THREE.Mesh;
  private readonly cendres: THREE.Mesh;
  private readonly fumee: THREE.Sprite[] = [];
  private readonly matFlamme: THREE.MeshBasicMaterial;
  private temps = Math.random() * 10;
  private readonly etincelles: THREE.Points;
  private readonly vies: Float32Array;

  constructor(etat: FeuVu) {
    this.etat = etat;
    const aleat = aleatoire(etat.id * 31 + 7);
    this.objet.position.set(etat.x, 0, etat.z);

    // Le foyer Dakota (P-002) : pas de pierres, un trou dans le sol et son évent ; la flamme reste basse.
    if (etat.dakota) {
      const terre = materiau(0x4a3626);
      const bord = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.42, 14).rotateX(-Math.PI / 2), terre);
      bord.position.y = 0.025;
      const trou = new THREE.Mesh(new THREE.CircleGeometry(0.27, 14).rotateX(-Math.PI / 2), materiau(0x1d140e));
      trou.position.y = 0.012;
      const event = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10).rotateX(-Math.PI / 2), materiau(0x1d140e));
      event.position.set(0, 0.012, 0.55);
      this.objet.add(bord, trou, event);
    }
    // Cercle de pierres
    const pierre = new THREE.DodecahedronGeometry(0.16, 0);
    for (let i = 0; i < (etat.dakota ? 0 : 9); i++) {
      const a = (i / 9) * Math.PI * 2 + aleat() * 0.2;
      const m = new THREE.Mesh(pierre, materiau(aleat() < 0.5 ? PALETTE.pierre : PALETTE.pierreSombre));
      m.position.set(Math.cos(a) * 0.52, 0.06, Math.sin(a) * 0.52);
      m.scale.set(1 + aleat() * 0.4, 0.7 + aleat() * 0.3, 1 + aleat() * 0.3);
      m.rotation.set(aleat(), aleat() * 3, aleat());
      m.castShadow = true;
      this.objet.add(m);
    }

    // Bûches en tipi
    const buche = new THREE.CylinderGeometry(0.045, 0.06, 0.62, 6).translate(0, 0.31, 0);
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(buche, materiau(i % 2 ? PALETTE.bois : PALETTE.boisSombre));
      if (etat.dakota) m.scale.set(0.8, 0.45, 0.8);
      const a = (i / 4) * Math.PI * 2 + 0.4;
      m.position.set(Math.cos(a) * 0.2, 0.02, Math.sin(a) * 0.2);
      m.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
      m.castShadow = true;
      this.buches.push(m);
      this.objet.add(m);
    }

    // Flammes : cônes lumineux en mélange additif
    this.matFlamme = new THREE.MeshBasicMaterial({
      color: 0xffa040,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coeur = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 4; i++) {
      const g = new THREE.ConeGeometry(i === 0 ? 0.14 : 0.1, i === 0 ? 0.62 : 0.45, 6).translate(0, 0.25, 0);
      const m = new THREE.Mesh(g, i === 0 ? coeur : this.matFlamme);
      m.position.set(i === 0 ? 0 : Math.cos(i * 2.1) * 0.1, 0.05, i === 0 ? 0 : Math.sin(i * 2.1) * 0.1);
      this.flammes.push(m);
      this.objet.add(m);
    }

    // Braises et cendres
    this.braises = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 12).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff4a1c, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.braises.position.y = 0.03;
    this.objet.add(this.braises);
    this.cendres = new THREE.Mesh(new THREE.CircleGeometry(0.34, 12).rotateX(-Math.PI / 2), materiau(0x6b6660));
    this.cendres.position.y = 0.015;
    this.cendres.receiveShadow = true;
    this.objet.add(this.cendres);

    // Fumée : visible de loin, c'est la signature olfactive (Book 01 §2).
    textureFumeePartagee ??= textureFumee();
    for (let i = 0; i < NB_FUMEE; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: textureFumeePartagee, color: 0xb9b4ad, transparent: true, opacity: 0, depthWrite: false }),
      );
      s.userData.age = (i / NB_FUMEE) * 6;
      this.fumee.push(s);
      this.objet.add(s);
    }

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
    this.buches.forEach((b, i) => (b.visible = i < visiblesBuches));
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
      this.flammes.forEach((f, i) => {
        const s = 0.85 + Math.sin(this.temps * (9 + i * 2.3) + i) * 0.15 + Math.sin(this.temps * 17 + i * 4) * 0.08;
        const taille = Math.min(1.25, 0.6 + this.etat.bois / 5) * (this.etat.dakota ? 0.45 : 1);
        f.scale.set(1, s * taille, 1);
        f.rotation.y = this.temps * (0.6 + i * 0.3);
      });
      this.matFlamme.opacity = 0.75 + Math.sin(this.temps * 21) * 0.1;
    }
    const brule = this.etat.aspect === "flammes" || this.etat.aspect === "braises";
    (this.braises.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(this.temps * 3) * 0.2;

    // La fumée monte haut (on la voit de loin : c'est de la signature), s'élargit et se dissipe.
    // La nuit, le bas de la colonne est éclairé par les flammes, le haut se perd dans le noir.
    for (const s of this.fumee) {
      const age = ((s.userData.age as number) + dt) % 6;
      s.userData.age = age;
      const vie = age / 6;
      s.position.set(Math.sin(age * 1.2 + s.id) * 0.3 + vie * 1.6, 0.7 + vie * 7.5, Math.cos(age * 1.1 + s.id) * 0.25);
      s.scale.setScalar(0.5 + vie * 3);
      const m = s.material as THREE.SpriteMaterial;
      const lueur = this.etat.aspect === "flammes" ? Math.max(0, 1 - vie * 3) * nuit : 0;
      m.color.setRGB(0.73 - nuit * 0.42 + lueur * 0.55, 0.71 - nuit * 0.42 + lueur * 0.25, 0.68 - nuit * 0.4);
      m.opacity = brule ? (this.etat.aspect === "flammes" ? 0.55 : 0.28) * Math.sin(vie * Math.PI) * (1 - nuit * 0.35) * (this.etat.dakota ? 0.35 : 1) : 0;
    }

    // Les étincelles, seulement quand ça flambe.
    this.etincelles.visible = this.etat.aspect === "flammes";
    if (this.etincelles.visible) {
      const pos = this.etincelles.geometry.attributes.position as THREE.BufferAttribute;
      const p = pos.array as Float32Array;
      for (let i = 0; i < NB_ETINCELLES; i++) {
        let v = this.vies[i]! + dt * (0.6 + (i % 5) * 0.12);
        if (v > 1) v -= 1;
        this.vies[i] = v;
        const a = i * 2.4 + this.temps * (1.5 + (i % 3));
        const r = 0.08 + v * 0.35;
        p[i * 3] = Math.cos(a) * r + v * 0.25;
        p[i * 3 + 1] = 0.3 + v * 2.6;
        p[i * 3 + 2] = Math.sin(a) * r;
      }
      pos.needsUpdate = true;
      (this.etincelles.material as THREE.PointsMaterial).opacity = 0.55 + nuit * 0.4;
    }
  }
}
