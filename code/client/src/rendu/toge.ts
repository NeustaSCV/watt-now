// La toge blanche du compte admin « god » (outil du porteur, 0.7 ; commun/src/admin.ts) : un drapé sur l'épaule
// gauche, une jupe longue jusqu'au mollet, une ceinture de corde, des sandales de cuir, une couronne de laurier.
// Low poly comme les tenues des familles (personnage.ts) ; tenu à part pour ne pas toucher au reste du personnage.

import * as THREE from "three";
import type { Tenue } from "./humanoides.ts";
import type { Humanoide } from "./humanoides.ts";
import { materiau } from "./materiaux.ts";
import { bandeau, type Mesure } from "./accessoires.ts";

const BLANC = 0xf1ede2;
const PLI = 0xe2dfd6;
const CORDE = 0xb8955a;
const CUIR = 0x7a5534;
const LAURIER = 0x6f8a3a;

/** Le corps sous la toge : une tunique blanche, les bras nus, des sandales. */
export const TENUE_TOGE: Tenue = { haut: BLANC, manche: null, bas: BLANC, pieds: CUIR, mains: null };

/** Une écharpe large d'une épaule à la hanche opposée, devant puis derrière le torse (le drapé de la toge). */
function echarpe(m: Mesure, epaule: THREE.Vector3, hanche: THREE.Vector3, largeur: number, ecart: number, mat: THREE.Material): THREE.Mesh {
  const n = 10;
  // Le torse en ellipse, mesuré au bas des côtes : la profondeur sur l'axe du corps (là où ne passent ni les mains ni
  // les cheveux longs), la largeur sans les bras. Un peu élargi pour la poitrine.
  const y0 = hanche.y + 0.15;
  const zDevant = m.devant(y0, 0, 0.03);
  const zDos = m.derriere(y0, 0, 0.03);
  const torse = { cx: 0, cz: (zDevant + zDos) / 2, rx: m.tranche(y0, 0.02, 0.16).rx * 1.05, rz: ((zDevant - zDos) / 2) * 1.1 };
  const dir = new THREE.Vector2(hanche.x - epaule.x, hanche.y - epaule.y).normalize();
  const perp = new THREE.Vector2(-dir.y, dir.x);
  const rangs: [THREE.Vector3, THREE.Vector3][] = [];
  for (const face of ["devant", "derriere"] as const) {
    const ligne: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = epaule.x + (hanche.x - epaule.x) * t;
      const y = epaule.y + (hanche.y - epaule.y) * t;
      // Le drapé s'élargit en descendant, comme un tissu qui tombe.
      const l = (largeur * (0.7 + 0.5 * t)) / 2;
      const bords = [-1, 1].map((s) => {
        const by = y + perp.y * l * s;
        // Le tissu épouse le torse, pris à mi-hauteur (une ellipse) : ni les cheveux longs ni les bras ne le
        // décollent du dos, jamais de pan qui flotte.
        const tr = torse;
        const bx = Math.max(tr.cx - tr.rx * 0.97, Math.min(tr.cx + tr.rx * 0.97, x + perp.x * l * s));
        const u = (bx - tr.cx) / Math.max(0.01, tr.rx);
        const profondeur = tr.rz * Math.sqrt(Math.max(0, 1 - u * u)) + ecart;
        return new THREE.Vector3(bx, by, face === "devant" ? tr.cz + profondeur : tr.cz - profondeur);
      }) as [THREE.Vector3, THREE.Vector3];
      ligne.push(bords);
    }
    rangs.push(...(face === "devant" ? ligne : ligne.reverse()));
  }
  const positions: number[] = [];
  for (const [a, b] of rangs) positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const indices: number[] = [];
  // Une boucle fermée : par-dessus l'épaule, et sous le bras à la hanche.
  for (let i = 0; i < rangs.length; i++) {
    const j = (i + 1) % rangs.length;
    const a = i * 2;
    const b = j * 2;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const m2 = mat.clone();
  m2.side = THREE.DoubleSide;
  return new THREE.Mesh(geo, m2);
}

/**
 * Habille le corps de la toge. `coller(objet, os)` accroche une pièce à un os (personnage.ts : ombre et fusion
 * comprises). Les repères sont ceux du corps au repos.
 */
export function habillerToge(corps: Humanoide, m: Mesure, coller: (o: THREE.Object3D, os: string) => void, tete: (f: number) => number): void {
  const blanc = materiau(BLANC, { rugosite: 0.95 });
  const pli = materiau(PLI, { rugosite: 0.95 });
  const cou = corps.repere("neck_01");
  const bassin = corps.repere("pelvis");
  const genou = corps.repere("calf_l");

  // Le drapé : de l'épaule gauche à la hanche droite, large comme une main et demie.
  coller(echarpe(m, new THREE.Vector3(0.08, cou.y - 0.09, 0), new THREE.Vector3(-0.15, bassin.y + 0.02, 0), 0.15, 0.02, pli), "spine_03");

  // La jupe : du haut des hanches jusqu'au mollet, évasée, à facettes.
  const yHaut = bassin.y + 0.1;
  const yBas = genou.y - 0.2;
  const t = m.tranche(yHaut, 0.02, 0.22);
  const hauteur = yHaut - yBas;
  const jupe = new THREE.CylinderGeometry(1, 1.35, hauteur, 12, 2, true);
  jupe.scale(t.rx + 0.03, 1, t.rz + 0.035);
  jupe.translate(t.cx, (yHaut + yBas) / 2, t.cz);
  const matJupe = blanc.clone();
  matJupe.side = THREE.DoubleSide;
  coller(new THREE.Mesh(jupe, matJupe), "pelvis");

  // La ceinture de corde, nouée devant, ses deux bouts qui pendent.
  const corde = materiau(CORDE, { rugosite: 0.85 });
  const ceinture = new THREE.Group();
  ceinture.add(bandeau(m, yHaut - 0.01, 0.028, 0.04, corde, 0, 0.22));
  const devant = m.devant(yHaut - 0.01, 0.03, 0.05) + 0.045;
  for (const [dx, long] of [
    [0.02, 0.16],
    [0.045, 0.12],
  ] as const) {
    const bout = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, long, 5), corde);
    bout.position.set(dx, yHaut - 0.02 - long / 2, devant);
    ceinture.add(bout);
  }
  coller(ceinture, "pelvis");

  // Les sandales : une lanière croisée sur chaque cheville.
  const cuir = materiau(CUIR, { rugosite: 0.7 });
  for (const cote of ["l", "r"] as const) {
    const cheville = corps.repere(`foot_${cote}`);
    const laniere = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 4, 10), cuir);
    laniere.rotation.x = Math.PI / 2;
    laniere.position.set(cheville.x, cheville.y + 0.03, cheville.z);
    coller(laniere, `foot_${cote}`);
  }

  // La couronne de laurier : un fin cercle, des feuilles qui pointent vers l'avant.
  const yCouronne = tete(0.74);
  const tc = m.tranche(yCouronne);
  const laurier = materiau(LAURIER, { rugosite: 0.6 });
  const couronne = new THREE.Group();
  const cercle = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 4, 20), laurier);
  cercle.rotation.x = Math.PI / 2;
  cercle.scale.set(tc.rx + 0.02, tc.rz + 0.02, 1);
  cercle.position.set(tc.cx, yCouronne, tc.cz);
  couronne.add(cercle);
  for (let k = 0; k < 14; k++) {
    // Deux branches, de l'arrière vers le front, qui s'arrêtent avant de se toucher.
    const a = -Math.PI / 2 + (k < 7 ? -1 : 1) * (0.35 + (k % 7) * 0.38);
    const feuille = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 4), laurier);
    feuille.position.set(tc.cx + Math.cos(a) * (tc.rx + 0.025), yCouronne + 0.008, tc.cz - Math.sin(a) * (tc.rz + 0.025));
    feuille.rotation.set(0, -a, (k < 7 ? 1 : -1) * 1.2);
    couronne.add(feuille);
  }
  coller(couronne, "Head");
}
