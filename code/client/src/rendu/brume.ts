// La brume basse de l'aube (moment-vitrine n° 3, Book 21 §5.1.2) : des nappes pâles qui dérivent au ras de l'herbe,
// le matin seulement, et que le soleil rasant dore. Trois plans translucides qui suivent la caméra : très léger.

import * as THREE from "three";

function textureBrume(): THREE.DataTexture {
  // Une texture en niveaux d'alpha seulement, sur du blanc pur, calculée pixel par pixel (2026-10-09). Les dégradés
  // presque transparents d'un canevas, réduits en mipmaps, prenaient des reflets colorés sur iPhone (« brouillard
  // multicolore ») : ici, aucune couleur ne peut apparaître, et pas de mipmaps.
  const n = 128;
  const donnees = new Uint8Array(n * n * 4);
  let s = 7;
  const alea = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const taches = Array.from({ length: 40 }, () => ({ x: alea() * n, y: alea() * n, r: 15 + alea() * 35, a: 0.1 + alea() * 0.08 }));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let a = 0;
      for (const t of taches) {
        // Le motif se répète sans couture : on prend la distance la plus courte, d'un bord à l'autre.
        const dx = Math.min(Math.abs(x - t.x), n - Math.abs(x - t.x));
        const dy = Math.min(Math.abs(y - t.y), n - Math.abs(y - t.y));
        const d = Math.hypot(dx, dy) / t.r;
        if (d < 1) a += t.a * (1 - d * d);
      }
      const i = (y * n + x) * 4;
      donnees[i] = donnees[i + 1] = donnees[i + 2] = 255;
      donnees[i + 3] = Math.round(Math.min(1, a) * 255);
    }
  }
  const t = new THREE.DataTexture(donnees, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/** Épaisseur de la brume selon l'heure : elle naît avant l'aube, culmine vers 6 h 30, s'est levée à 9 h. */
export function epaisseurBrume(heure: number): number {
  if (heure < 4.5 || heure > 9.2) return 0;
  if (heure < 6) return (heure - 4.5) / 1.5;
  if (heure < 7) return 1;
  return Math.max(0, 1 - (heure - 7) / 2.2);
}

export class Brume {
  private readonly nappes: THREE.Mesh[] = [];
  /** La dérive propre de chaque nappe (le vent), en unités de texture. */
  private derive = 0;

  constructor(scene: THREE.Scene) {
    const texture = textureBrume();
    for (let i = 0; i < 3; i++) {
      const tex = texture.clone();
      tex.needsUpdate = true;
      tex.offset.set(i * 0.37, i * 0.21);
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(70, 70).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ map: tex, color: 0xf2ead8, transparent: true, opacity: 0, depthWrite: false, fog: false }),
      );
      // Au ras de l'herbe : la brume ne doit pas couper le personnage à mi-corps.
      m.position.y = 0.12 + i * 0.18;
      m.renderOrder = 2;
      m.visible = false;
      this.nappes.push(m);
      scene.add(m);
    }
  }

  animer(dt: number, heure: number, centre: THREE.Vector3, pluie: number): void {
    const e = epaisseurBrume(heure) * (1 - pluie * 0.6);
    this.derive += dt * 0.004;
    this.nappes.forEach((m, i) => {
      m.visible = e > 0.01;
      if (!m.visible) return;
      m.position.x = centre.x;
      m.position.z = centre.z;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = e * (0.5 - i * 0.12);
      // Le soleil rasant dore la brume à mesure qu'il monte.
      mat.color.setHex(heure < 6 ? 0xd8dde6 : 0xf6e3c4);
      // La nappe suit la caméra, mais sa texture reste posée sur le monde (et dérive avec le vent).
      const tex = mat.map!;
      tex.offset.x = i * 0.37 + this.derive * (1 + i * 0.5) + (centre.x / 70) * tex.repeat.x;
      tex.offset.y = i * 0.21 + this.derive * 0.4 - (centre.z / 70) * tex.repeat.y;
    });
  }
}
