// La brume basse de l'aube (moment-vitrine n° 3, Book 21 §5.1.2) : des nappes pâles qui dérivent au ras de l'herbe,
// le matin seulement, et que le soleil rasant dore. Trois plans translucides qui suivent la caméra : très léger.

import * as THREE from "three";

function textureBrume(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 256, 256);
  // Des taches douces qui se recouvrent : une brume en lambeaux, jamais un mur uniforme.
  let s = 7;
  const alea = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 60; i++) {
    const x = alea() * 256;
    const y = alea() * 256;
    const r = 30 + alea() * 70;
    for (const [dx, dy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]] as const) {
      const d = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      d.addColorStop(0, `rgba(255,255,255,${0.10 + alea() * 0.08})`);
      d.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = d;
      g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
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
      m.position.y = 0.25 + i * 0.45;
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
      mat.opacity = e * (0.75 - i * 0.18);
      // Le soleil rasant dore la brume à mesure qu'il monte.
      mat.color.setHex(heure < 6 ? 0xd8dde6 : 0xf6e3c4);
      // La nappe suit la caméra, mais sa texture reste posée sur le monde (et dérive avec le vent).
      const tex = mat.map!;
      tex.offset.x = i * 0.37 + this.derive * (1 + i * 0.5) + (centre.x / 70) * tex.repeat.x;
      tex.offset.y = i * 0.21 + this.derive * 0.4 - (centre.z / 70) * tex.repeat.y;
    });
  }
}
