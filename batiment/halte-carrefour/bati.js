// Petits outils de bâti de la halte du carrefour : murs coupés à hauteur d'allège (le haut part dans une couche),
// pignons, ouvertures types.

import * as THREE from "three";
import { mur } from "../commun/atelier.js";

/**
 * Un mur coupé à `coupe` m : le bas reste dans le chantier de base (il fait obstacle), le haut va dans la couche `haut`
 * (il s'efface quand il cache le personnage). Sens de parcours conseillé, pour que la face extérieure soit dehors :
 * sud ouest → est, est sud → nord, nord est → ouest, ouest nord → sud.
 */
export function murCoupe(ctx, haut, a, b2, spec, coupe) {
  const ouv = spec.ouvertures ?? [];
  if (coupe >= spec.h) {
    mur(ctx.c, a, b2, { ...spec, batiment: ctx.b });
    return;
  }
  mur(ctx.c, a, b2, { ...spec, h: coupe, ouvertures: ouv.map((o) => ({ ...o, type: o.bas < coupe ? "vide" : "vide", bas: Math.min(o.bas, coupe) })), breches: [], batiment: ctx.b });
  mur(haut, a, b2, { ...spec, h: spec.h - coupe, y0: coupe, interieur: spec.interieur, ouvertures: ouv.map((o) => ({ ...o, bas: Math.max(0, o.bas - coupe), haut: o.haut - coupe })), batiment: null });
}

/** Un pignon triangulaire plein (base `l`, hauteur `h`), posé à (x, y0, z), tourné de `ry` ; épaisseur `ep`. */
export function pignon(c, mat, couleur, x, y0, z, l, h, ry = 0, ep = 0.3) {
  const s = new THREE.Shape([new THREE.Vector2(-l / 2, 0), new THREE.Vector2(l / 2, 0), new THREE.Vector2(0, h)]);
  const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false }).translate(0, 0, -ep / 2);
  c.poser(g, mat, couleur, { x, y: y0, z, ry }, { nuance: 0.02, crasse: false });
  g.dispose();
}

export const ouv = {
  fenetre: (u, l = 1.4, bas = 0.9, haut = 2.3, o = {}) => ({ u, l, bas, haut, type: "fenetre", ...o }),
  porte: (u, l = 1.0, haut = 2.2) => ({ u, l, bas: 0, haut, type: "vide" }),
};
