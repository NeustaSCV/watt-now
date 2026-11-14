/* Watt Now? — making-of : les poules, les lapins et les Éteints, époque par époque.
   Chaque bête a sa place le long du chemin et son comportement, calculé à partir du temps (elle s'écarte quand le
   personnage arrive) ; à cette place, il y a une bête par époque, et la vague les remplace l'une par l'autre.
   Poules et lapins : en blocs (2), en facettes (3), ceux du jeu (4 à 6).
   Éteints : la silhouette grise aux bras tendus (4), l'Errant du jeu (5), les variantes de la Coopérative (6). */

import { THREE, Volaille, VueEteint, creerLapin, poserLapin, aleatoire } from '../vendor/rendu-jeu.js';
import { T, distance, instantA } from './temps.js';

const lambert = (couleur, o = {}) => new THREE.MeshLambertMaterial({ color: couleur, flatShading: true, ...o });
const facettes = (couleur, o = {}) => new THREE.MeshStandardMaterial({ color: couleur, flatShading: true, roughness: 0.85, ...o });
function maille(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

/**
 * Une place le long du chemin. `d` : à quelle distance du départ ; `z` : de quel côté. La bête s'écarte (fuite) quand
 * le personnage arrive à `alerte` mètres, sur `loin` mètres, en `duree` secondes.
 */
function place(x0, ZP, d, z, o, alerte, loin, duree, rnd) {
  const tp = instantA(d - alerte);
  const cote = Math.sign(z - ZP) || 1;
  // côté caméra, elle file vers l'avant plutôt que vers l'objectif
  const dir = (cote > 0 ? new THREE.Vector2(1, 0.3 + rnd() * 0.2) : new THREE.Vector2(0.35 + rnd() * 0.4, -1)).normalize();
  const p = { x: x0 + d, z, o, fuit: false, depuis: -1, bond: 0 };
  p.maj = (t) => {
    const u = t - tp;
    const k = u <= 0 ? 0 : 1 - Math.exp(-u * 3 / duree);
    p.x = x0 + d + dir.x * loin * k;
    p.z = z + dir.y * loin * k;
    p.fuit = u > 0 && u < duree;
    p.depuis = u;
    p.o = u > 0 ? Math.atan2(dir.x, dir.y) : o;
    p.bond = u > 0 ? u * 9 : 0;
  };
  return p;
}

/* ---------------------------------------------------------------- Les poules */
function pouleBlocs() {
  const g = new THREE.Group(), blanc = lambert(0xf2eee4), rouge = lambert(0xd8402e), jaune = lambert(0xe8a23a);
  maille(g, new THREE.BoxGeometry(0.3, 0.24, 0.38), blanc, 0, 0.3, 0);
  const tete = new THREE.Group(); tete.position.set(0, 0.42, 0.17); g.add(tete);
  maille(tete, new THREE.BoxGeometry(0.15, 0.17, 0.15), blanc, 0, 0.06, 0.03);
  maille(tete, new THREE.BoxGeometry(0.04, 0.07, 0.11), rouge, 0, 0.17, 0.03);
  maille(tete, new THREE.BoxGeometry(0.06, 0.05, 0.07), jaune, 0, 0.06, 0.13);
  for (const s of [-1, 1]) maille(g, new THREE.BoxGeometry(0.035, 0.18, 0.035), jaune, s * 0.07, 0.09, 0);
  return { objet: g, tete };
}
function pouleFacettes() {
  const g = new THREE.Group(), robe = facettes(0xb5743e), clair = facettes(0xe9d6b4), rouge = facettes(0xc8342a), jaune = facettes(0xe0a030);
  const corps = maille(g, new THREE.IcosahedronGeometry(0.19, 0), robe, 0, 0.3, 0); corps.scale.set(1, 0.9, 1.3);
  const queue = maille(g, new THREE.ConeGeometry(0.1, 0.22, 4), robe, 0, 0.42, -0.22); queue.rotation.x = -0.7;
  const tete = new THREE.Group(); tete.position.set(0, 0.42, 0.17); g.add(tete);
  maille(tete, new THREE.IcosahedronGeometry(0.085, 0), clair, 0, 0.07, 0.03);
  const crete = maille(tete, new THREE.ConeGeometry(0.035, 0.08, 4), rouge, 0, 0.16, 0.03); crete.rotation.z = 0.1;
  const bec = maille(tete, new THREE.ConeGeometry(0.03, 0.08, 4), jaune, 0, 0.07, 0.13); bec.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) maille(g, new THREE.CylinderGeometry(0.015, 0.015, 0.18, 4), jaune, s * 0.07, 0.09, 0);
  return { objet: g, tete };
}
/** Pose commune des poules refaites : picorer, ou courir en se dandinant. */
function poserPoule(m, p, t, graine) {
  m.objet.position.set(p.x, 0, p.z);
  m.objet.rotation.y = p.o;
  if (p.fuit) {
    m.objet.position.y = Math.abs(Math.sin(t * 14 + graine)) * 0.06;
    m.objet.rotation.z = Math.sin(t * 14 + graine) * 0.12;
    m.tete.rotation.x = 0.3;
  } else {
    m.objet.position.y = 0; m.objet.rotation.z = 0;
    const picore = Math.sin(t * 2.3 + graine * 1.7) > 0.4;
    m.tete.rotation.x = picore ? 1.0 + Math.sin(t * 22) * 0.12 : Math.sin(t * 0.8 + graine) * 0.1;
  }
}

/* ---------------------------------------------------------------- Les lapins */
function lapinBlocs() {
  const g = new THREE.Group(), gris = lambert(0xa89880), blanc = lambert(0xf0ece2);
  const corps = new THREE.Group(); g.add(corps);
  maille(corps, new THREE.BoxGeometry(0.2, 0.18, 0.32), gris, 0, 0.13, 0);
  const tete = new THREE.Group(); tete.position.set(0, 0.24, 0.15); corps.add(tete);
  maille(tete, new THREE.BoxGeometry(0.14, 0.13, 0.15), gris, 0, 0, 0.03);
  for (const s of [-1, 1]) maille(tete, new THREE.BoxGeometry(0.04, 0.17, 0.03), gris, s * 0.035, 0.14, -0.01);
  maille(corps, new THREE.BoxGeometry(0.07, 0.07, 0.06), blanc, 0, 0.18, -0.17);
  return { objet: g, corps, tete };
}
function lapinFacettes() {
  const g = new THREE.Group(), gris = facettes(0x9c876c), blanc = facettes(0xeee6d6);
  const corps = new THREE.Group(); g.add(corps);
  const c = maille(corps, new THREE.IcosahedronGeometry(0.13, 0), gris, 0, 0.14, 0); c.scale.set(0.95, 0.9, 1.35);
  const tete = new THREE.Group(); tete.position.set(0, 0.23, 0.15); corps.add(tete);
  maille(tete, new THREE.IcosahedronGeometry(0.075, 0), gris, 0, 0, 0.03);
  for (const s of [-1, 1]) { const o = maille(tete, new THREE.ConeGeometry(0.03, 0.17, 4), gris, s * 0.035, 0.12, -0.01); o.rotation.z = -s * 0.15; }
  maille(corps, new THREE.IcosahedronGeometry(0.04, 0), blanc, 0, 0.18, -0.17);
  return { objet: g, corps, tete };
}
function poserLapinRefait(m, p, t, graine) {
  m.objet.position.set(p.x, 0, p.z);
  m.objet.rotation.y = p.o;
  if (p.fuit) {
    m.corps.position.y = Math.abs(Math.sin(p.bond)) * 0.22;
    m.corps.rotation.x = -Math.cos(p.bond) * 0.3;
    m.tete.rotation.x = -0.2;
  } else {
    m.corps.position.y = 0; m.corps.rotation.x = 0;
    m.tete.rotation.x = Math.sin(t * 0.5 + graine) > 0.7 ? -0.3 : 0.5 + Math.sin(t * 14) * 0.04;
  }
}

/* ---------------------------------------------------------------- Les Éteints */
function eteintSilhouette(graine) {
  const g = new THREE.Group(), peau = lambert([0x7f8f74, 0x8a9a7a, 0x86907c][graine % 3]);
  const yeux = new THREE.MeshBasicMaterial({ color: 0xf4ffe8 });
  const corps = maille(g, new THREE.CapsuleGeometry(0.26, 0.85, 2, 7), peau, 0, 0.72, 0);
  const tete = maille(g, new THREE.IcosahedronGeometry(0.16, 0), peau, 0, 1.48, 0.02);
  for (const s of [-1, 1]) {
    const bras = maille(g, new THREE.BoxGeometry(0.09, 0.09, 0.62), peau, s * 0.3, 1.18, 0.3);
    bras.rotation.x = -0.12;
    const oeil = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), yeux); oeil.position.set(s * 0.06, 1.5, 0.16); g.add(oeil);
  }
  return { objet: g, corps, tete };
}

/** Toutes les bêtes du film, rangées dans leurs époques. */
export function creerCreatures(scene, eres, x0, ZP) {
  const r = aleatoire(31);
  const poules = [], lapins = [], eteints = [];
  // --- poules : le long du chemin, des époques 2 à 6
  const volaille = new Volaille();
  const vues = [];
  for (let d = distance(T(2)) + 1.5, i = 0; d < distance(T(7)) + 4; d += 2.2 + r() * 3.2, i++) {
    const cote = r() < 0.55 ? -1 : 1;
    const p = place(x0, ZP, d, ZP + cote * (1.5 + r() * (cote > 0 ? 1.6 : 3.2)), r() * 6.28, 3.2, 3.5 + r() * 2, 1.8, r);
    const blocs = pouleBlocs(), fac = pouleFacettes();
    scene.add(blocs.objet, fac.objet);
    eres.ranger(blocs.objet, 2, 2, { x: () => p.x, marge: 0.4 });
    eres.ranger(fac.objet, 3, 3, { x: () => p.x, marge: 0.4 });
    vues.push({ id: 900 + i, espece: 'poule', x: p.x, z: p.z, o: p.o, etat: 'picore', robe: i });
    poules.push({ p, modeles: [blocs, fac], graine: i * 1.3 });
  }
  volaille.maj(vues);
  scene.add(volaille.groupe);
  volaille.groupe.traverse((n) => { if (n.isMesh) n.castShadow = n.receiveShadow = true; });
  eres.ranger(volaille.groupe, 4, 6);
  // --- lapins : un peu plus loin du chemin, ils détalent plus tôt
  for (let d = distance(T(2)) + 4, i = 0; d < distance(T(7)); d += 4 + r() * 5, i++) {
    const cote = r() < 0.5 ? -1 : 1;
    const p = place(x0, ZP, d, ZP + cote * (2.2 + r() * (cote > 0 ? 1.2 : 4)), r() * 6.28, 6, 5 + r() * 3, 1.6, r);
    const blocs = lapinBlocs(), fac = lapinFacettes(), jeu = creerLapin();
    jeu.objet.traverse((n) => { if (n.isMesh) n.castShadow = n.receiveShadow = true; });
    scene.add(blocs.objet, fac.objet, jeu.objet);
    eres.ranger(blocs.objet, 2, 2, { x: () => p.x, marge: 0.4 });
    eres.ranger(fac.objet, 3, 3, { x: () => p.x, marge: 0.4 });
    eres.ranger(jeu.objet, 4, 6, { x: () => p.x, marge: 0.4 });
    lapins.push({ p, blocs, fac, jeu, graine: i * 2.1 });
  }
  // --- Éteints : de la mesure 4 à la plage, en retrait du chemin ; ils viennent vers lui, trop lents
  const VARIANTES = ['equipe', 'rampant', 'magasinier', 'equipe', 'mecanicien', 'rampant'];
  for (let d = distance(T(4)) + 3, i = 0; d < distance(T(7)) + 6; d += 4.5 + r() * 4, i++) {
    const devant = i % 4 === 3;
    const z = devant ? ZP + 2.8 + r() * 0.8 : ZP - 2.8 - r() * 6;
    const e = { d, z, x: x0 + d, o: 0, vit: 0, vers: instantA(d - 16) };
    const sil = eteintSilhouette(i);
    scene.add(sil.objet);
    eres.ranger(sil.objet, 4, 4, { x: () => e.x, marge: 0.6 });
    const errant = new VueEteint({ id: 700 + i, x: e.x, z, o: 0, etat: 'errant' });
    const variante = new VueEteint({ id: 800 + i, x: e.x, z, o: 0, etat: 'errant', variante: VARIANTES[i % VARIANTES.length] });
    for (const v of [errant, variante]) { scene.add(v.objet); v.objet.traverse((n) => { if (n.isMesh) n.castShadow = n.receiveShadow = true; }); }
    eres.ranger(errant.objet, 5, 5, { x: () => e.x, marge: 0.8 });
    eres.ranger(variante.objet, 6, 6, { x: () => e.x, marge: 0.8 });
    e.variante = VARIANTES[i % VARIANTES.length];
    e.rampant = e.variante === 'rampant';
    eteints.push({ e, sil, errant, variante, graine: i });
  }

  return {
    /** Avant le tri des époques : où est chacun. */
    placer(t, sx) {
      for (const { p } of poules) p.maj(t);
      for (const { p } of lapins) p.maj(t);
      for (const { e } of eteints) {
        // ils se mettent en marche vers le chemin, au-devant de lui, et le suivent du regard
        const u = Math.max(0, t - e.vers);
        const pas = (e.rampant ? 0.35 : 0.55) * u;
        e.x = x0 + e.d + Math.min(pas * 0.4, 1.5);
        e.zc = e.z + Math.sign(ZP - e.z) * Math.min(pas, Math.abs(ZP - e.z) - 1.2);
        e.o = Math.atan2(sx - e.x, ZP - e.zc);
        e.vit = u > 0 ? (e.rampant ? 0.35 : 0.55) : 0;
      }
    },
    /** Après le tri : on n'anime que ce qui se voit. */
    animer(t, dt) {
      for (const { p, modeles, graine } of poules) {
        if (modeles[0].objet.visible) poserPoule(modeles[0], p, t, graine);
        if (modeles[1].objet.visible) poserPoule(modeles[1], p, t, graine);
      }
      if (volaille.groupe.visible) {
        volaille.maj(poules.map(({ p }, i) => ({ id: 900 + i, espece: 'poule', x: p.x, z: p.z, o: p.o, etat: p.fuit ? 'fuit' : p.depuis > 0 ? 'inquiete' : 'picore', robe: i })));
        volaille.animer(dt, () => {});
      }
      for (const l of lapins) {
        if (l.blocs.objet.visible) poserLapinRefait(l.blocs, l.p, t, l.graine);
        if (l.fac.objet.visible) poserLapinRefait(l.fac, l.p, t, l.graine);
        if (l.jeu.objet.visible) {
          l.jeu.objet.position.set(l.p.x, 0, l.p.z);
          l.jeu.objet.rotation.y = l.p.o;
          poserLapin(l.jeu, l.p.fuit ? 'fuit' : 'broute', l.p.bond, l.p.fuit, t + l.graine);
        }
      }
      for (const { e, sil, errant, variante, graine } of eteints) {
        if (sil.objet.visible) {
          sil.objet.position.set(e.x, 0, e.zc);
          sil.objet.rotation.y = e.o;
          sil.objet.rotation.z = Math.sin(t * 2.2 + graine) * 0.05;
          sil.tete.rotation.z = 0.25 + Math.sin(t * 1.3 + graine) * 0.1;
        }
        for (const v of [errant, variante]) {
          if (!v.objet.visible) continue;
          v.maj({ id: v === errant ? 700 + graine : 800 + graine, x: e.x, z: e.zc, o: e.o, etat: e.vit > 0 ? 'attire' : 'errant', ...(v === variante ? { variante: e.variante } : {}) });
          v.animer(dt);
        }
      }
    },
  };
}
