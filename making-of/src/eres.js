/* Watt Now? — making-of : les époques. Le monde est une longue bande ; la vague de l'époque j arrive de devant le
   personnage, passe sous ses pieds au premier temps de la mesure j, puis file derrière lui. Ce qu'elle a balayé est
   passé à l'époque j. Un même endroit a donc un objet par époque, et chacun n'est dessiné que dans sa tranche de la
   bande, entre deux vagues, par deux plans de coupe (le personnage aussi : il change de corps en traversant la vague).

   Tranche de l'époque e : x > vague(e) (si e > 0) et x < vague(e + 1) (si e < DERNIERE). */

import { THREE } from '../vendor/rendu-jeu.js';
import { DERNIERE, T, VITESSE_VAGUE, distance } from './temps.js';

export class Eres {
  /** x0 : l'abscisse du départ du personnage (il avance vers +x). */
  constructor(x0) {
    this.x0 = x0;
    // gauche[e] : garde x > vague(e) ; droite[e] : garde x < vague(e + 1)
    this.gauche = [], this.droite = [];
    for (let e = 0; e <= DERNIERE; e++) {
      this.gauche.push(e > 0 ? new THREE.Plane(new THREE.Vector3(1, 0, 0), 0) : null);
      this.droite.push(e < DERNIERE ? new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0) : null);
    }
    this.objets = [];
    this.t = 0;
  }

  /** L'abscisse de la vague j (1 ≤ j ≤ DERNIERE) à l'instant t. */
  vague(j, t = this.t) {
    return this.x0 + distance(T(j)) - VITESSE_VAGUE * (t - T(j));
  }

  /** L'époque d'un point de la bande à l'instant t. */
  ereEn(x, t = this.t) {
    let e = 0;
    for (let j = 1; j <= DERNIERE; j++) if (x > this.vague(j, t)) e = j;
    return e;
  }

  /** Les bornes de la tranche des époques a à b. */
  bornes(a, b = a, t = this.t) {
    return [a > 0 ? this.vague(a, t) : -Infinity, b < DERNIERE ? this.vague(b + 1, t) : Infinity];
  }

  plans(a, b = a) {
    return [this.gauche[a], this.droite[b]].filter(Boolean);
  }

  /**
   * Range un objet dans les époques a à b : ses matériaux sont copiés (ceux du jeu sont partagés) et coupés aux
   * bornes de la tranche. o.surPlace : couper les matériaux d'origine (l'herbe : son vent ne survit pas à une copie).
   * o.x : pour un objet qui se déplace, une fonction qui donne son abscisse (son étendue : ± o.marge).
   */
  ranger(objet, a, b = a, o = {}) {
    const plans = this.plans(a, b);
    const copies = new Map();
    const couper = (m) => {
      if (o.surPlace) { m.clippingPlanes = plans; m.clipShadows = true; m.needsUpdate = true; return m; }
      if (!copies.has(m)) {
        const c = m.clone();
        c.onBeforeCompile = m.onBeforeCompile;
        if (m.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey) c.customProgramCacheKey = m.customProgramCacheKey;
        c.clippingPlanes = plans; c.clipShadows = true;
        copies.set(m, c);
      }
      return copies.get(m);
    };
    objet.traverse((n) => {
      if (!n.material) return;
      n.material = Array.isArray(n.material) ? n.material.map(couper) : couper(n.material);
    });
    const fiche = { objet, a, b, ou: o.x || null, marge: o.marge ?? 1, x: null };
    if (!fiche.ou) fiche.x = etendue(objet, fiche.marge);
    this.objets.push(fiche);
    return objet;
  }

  /** À chaque image : les vagues avancent, on ne dessine que ce qui est dans sa tranche. */
  maj(t) {
    this.t = t;
    for (let e = 0; e <= DERNIERE; e++) {
      if (this.gauche[e]) this.gauche[e].constant = -this.vague(e, t);
      if (this.droite[e]) this.droite[e].constant = this.vague(e + 1, t);
    }
    for (const f of this.objets) {
      const [g, d] = this.bornes(f.a, f.b, t);
      const [x0, x1] = f.ou ? [f.ou() - f.marge, f.ou() + f.marge] : f.x;
      f.objet.visible = x1 > g && x0 < d;
    }
  }
}

const boite = new THREE.Box3();
function etendue(objet, marge) {
  const v = objet.visible;
  objet.visible = true;
  objet.updateMatrixWorld(true);
  boite.setFromObject(objet);
  objet.visible = v;
  if (boite.isEmpty()) { const p = objet.getWorldPosition(new THREE.Vector3()); return [p.x - marge, p.x + marge]; }
  return [boite.min.x - marge, boite.max.x + marge];
}
