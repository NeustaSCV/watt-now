/* Watt Now? — intro 3D : les programmes d'Abondance TV. Des plateaux et des extérieurs éclairés « télé »
   (lumière franche, couleurs saturées), avec l'habillage de la chaîne. On y voit des gens tout à fait ordinaires
   dépenser de l'énergie pour des gestes qui n'en demandent aucune. Chaque programme : creer(moteur) → { scene, camera, maj }. */

import { THREE, VueRessource } from '../vendor/rendu-jeu.js';
import { civil, cadrer, cles, epaule, TENUES_ABONDANCE, PEAUX, CHEVEUX } from './acteurs.js';
import { lisse, materiau, boite, cyl, boule, maille, ciel, sol, herbe, vapeur, jet, pluie, eclairage, aleatoire, pommierCinema } from './decors.js';
import { toile, police, ecranMeteo, etoilePrix, etiquette } from './textures.js';
import { habillageTele } from './moteur.js';
import { C } from '../src/dessins.js';

const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const doux = (k) => k * k * (3 - 2 * k);
const rebond = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

/* ------------------------------------------------------------------ L'habillage de la chaîne */

/**
 * Dessine l'habillage (1280 × 720) : la rubrique, le logo ATV, et un bandeau en bas qui glisse.
 * bandeau : { titre, texte, couleur, de, a } (secondes de plan).
 */
function habiller(moteur, t, rubrique, couleur, bandeaux = []) {
  const ctx = habillageTele(moteur);
  const l = 1280, h = 720;
  // la rubrique
  const entree = doux(seg(t, 0.1, 0.5));
  ctx.save();
  ctx.translate(-300 * (1 - entree), 0);
  ctx.font = police('titre', 30);
  const w = ctx.measureText(rubrique).width + 44;
  ctx.fillStyle = couleur; ctx.strokeStyle = C.encre; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(36, 34, w, 52, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.creme; ctx.textBaseline = 'middle'; ctx.fillText(rubrique, 58, 62);
  ctx.restore();
  // le logo de la chaîne, en filigrane
  ctx.save(); ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(l - 76, 66, 34, 0, Math.PI * 2); ctx.fillStyle = C.creme; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.encre; ctx.stroke();
  ctx.fillStyle = C.rouge; ctx.font = police('titre', 28); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ATV', l - 76, 68);
  ctx.restore();
  // les bandeaux
  for (const b of bandeaux) {
    const k = doux(seg(t, b.de, b.de + 0.35)) * (1 - doux(seg(t, b.a - 0.3, b.a)));
    if (k <= 0) continue;
    ctx.save();
    ctx.translate(-l * (1 - k), 0);
    const y = h - 290;
    ctx.fillStyle = b.couleur || C.rouge; ctx.fillRect(60, y, 120 + ctx.measureText(b.titre).width * 0 + 560, 58);
    ctx.fillStyle = C.creme; ctx.font = police('titre', 34); ctx.textBaseline = 'middle'; ctx.fillText(b.titre, 84, y + 30);
    if (b.texte) {
      ctx.fillStyle = C.creme; ctx.fillRect(60, y + 58, 760, 42);
      ctx.fillStyle = C.encre; ctx.font = 'italic ' + police('texte', 26); ctx.fillText(b.texte, 84, y + 80);
    }
    ctx.restore();
  }
}

/** Un plateau éclairé « télé » : lumière franche de face, contre-jour, ambiance haute. */
function plateau(scene, o = {}) {
  return eclairage(scene, { ambiance: 1.0, ciel: 0xfff4e6, sol: 0x8a6a5a, force: 2.6, position: o.position || [2.5, 5, 6], couleur: 0xfff2e0, ombre: 5, forceContre: 1.6, couleurContre: 0xffe0c0, positionContre: [-3, 4, -4], ...o });
}

/** Un drone de livraison : corps, quatre bras, quatre hélices (disques flous), une diode. */
export function drone(couleur = 0xf4f4f0) {
  const g = new THREE.Group();
  boite(g, 0.34, 0.1, 0.34, lisse(couleur, { rugosite: 0.3 }), 0, 0, 0);
  boite(g, 0.2, 0.06, 0.2, lisse(0x2a2d34, { rugosite: 0.4 }), 0, -0.07, 0);
  const helices = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const x = Math.cos(a) * 0.32, z = Math.sin(a) * 0.32;
    boite(g, 0.36, 0.03, 0.04, lisse(0x2a2d34), x / 2, 0.02, z / 2, 0, -a, 0);
    cyl(g, 0.025, 0.025, 0.06, lisse(0x2a2d34), x, 0.05, z, 0, 0, 0, 8);
    const h = maille(g, new THREE.CylinderGeometry(0.16, 0.16, 0.006, 24), new THREE.MeshBasicMaterial({ color: 0xcfd6dc, transparent: true, opacity: 0.35, depthWrite: false }), x, 0.085, z);
    const pale = boite(g, 0.3, 0.008, 0.03, lisse(0x2a2d34), x, 0.086, z);
    helices.push(pale);
  }
  boule(g, 0.02, new THREE.MeshBasicMaterial({ color: 0xff3a30 }), 0, 0, 0.175, 8);
  return { objet: g, maj(t) { helices.forEach((p, i) => (p.rotation.y = t * 70 + i)); } };
}

/** Un chien de quartier (bâti en blocs, comme les vestiges du jeu) qui trotte : maj(t, vitesse). */
export function chien(couleur = 0xc8873e) {
  const g = new THREE.Group();
  const robe = materiau(couleur), sombre = materiau(0x6b4a2a), noir = materiau(0x1a1410);
  boite(g, 0.62, 0.26, 0.24, robe, 0, 0.42, 0);
  const tete = new THREE.Group(); tete.position.set(0.36, 0.6, 0); g.add(tete);
  boite(tete, 0.22, 0.2, 0.2, robe, 0, 0, 0);
  boite(tete, 0.14, 0.1, 0.12, robe, 0.15, -0.05, 0);
  boite(tete, 0.04, 0.04, 0.05, noir, 0.23, -0.03, 0);
  for (const z of [-0.075, 0.075]) { boite(tete, 0.06, 0.14, 0.04, sombre, -0.04, 0.1, z, 0, 0, 0.3); boule(tete, 0.018, noir, 0.09, 0.03, z * 0.9, 6); }
  boite(g, 0.06, 0.04, 0.26, materiau(C.rouge), 0.27, 0.52, 0);
  const queue = new THREE.Group(); queue.position.set(-0.31, 0.5, 0); g.add(queue);
  boite(queue, 0.05, 0.22, 0.05, robe, -0.03, 0.1, 0, 0, 0, 0.5);
  const pattes = [[0.22, 0.09], [0.22, -0.09], [-0.22, 0.09], [-0.22, -0.09]].map(([x, z]) => {
    const p = new THREE.Group(); p.position.set(x, 0.34, z); g.add(p);
    boite(p, 0.07, 0.34, 0.07, robe, 0, -0.17, 0);
    boite(p, 0.09, 0.04, 0.09, sombre, 0.01, -0.33, 0);
    return p;
  });
  g.traverse((n) => { if (n.isMesh) n.castShadow = true; });
  return {
    objet: g, collier: () => new THREE.Vector3(0.27, 0.56, 0).applyMatrix4(g.matrixWorld),
    maj(t, v = 1) {
      pattes.forEach((p, i) => (p.rotation.z = Math.sin(t * 11 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 * v));
      queue.rotation.x = Math.sin(t * 15) * 0.5;
      tete.rotation.z = Math.sin(t * 11) * 0.04;
      g.position.y = Math.abs(Math.sin(t * 11)) * 0.02 * v;
    },
  };
}

/** Une cuillère (dans la main), un téléphone (dans la main). */
function cuillere() {
  const g = new THREE.Group();
  cyl(g, 0.006, 0.006, 0.16, lisse(0xd8dde4, { metal: 0.8, rugosite: 0.2 }), 0, 0.08, 0, 0, 0, 0, 6);
  maille(g, new THREE.SphereGeometry(0.025, 10, 6).scale(1, 0.4, 1.3), lisse(0xd8dde4, { metal: 0.8, rugosite: 0.2 }), 0, 0.17, 0);
  return g;
}
export function telephone(texture) {
  const g = new THREE.Group();
  boite(g, 0.075, 0.15, 0.012, lisse(0x1a1a1f, { rugosite: 0.3 }), 0, 0, 0);
  if (texture) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.135), new THREE.MeshBasicMaterial({ map: texture })); e.position.z = 0.0065; g.add(e); }
  else boite(g, 0.066, 0.135, 0.002, new THREE.MeshBasicMaterial({ color: 0x9fd3e0 }), 0, 0, 0.007);
  return g;
}

/* ====================================================================== 1. TÉLÉACHAT : le Souffle-Soupe 3000 */
export function teleachat(moteur) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6dfa6);
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 60);
  plateau(scene, { position: [1.5, 4, 5] });
  // le mur carrelé, le plan de travail du fond, les bocaux
  const carreaux = toile(512, 512, (ctx, t, l, h) => {
    ctx.fillStyle = '#f7e2ad'; ctx.fillRect(0, 0, l, h);
    ctx.strokeStyle = '#e6c27e'; ctx.lineWidth = 6;
    for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(l, i * 64); ctx.stroke(); }
    ctx.fillStyle = 'rgba(200,54,43,0.35)'; for (let i = 0; i < 8; i += 2) for (let j = 1; j < 8; j += 2) ctx.fillRect(i * 64 + 3, j * 64 + 3, 58, 58);
  }, { fixe: true, repeter: true });
  carreaux.maj(0); carreaux.texture.repeat.set(6, 3);
  maille(scene, new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ map: carreaux.texture, roughness: 0.4 }), 0, 2, -2.2);
  boite(scene, 6, 0.9, 0.6, lisse(0xf4f4f0), 0, 0.45, -1.9);
  boite(scene, 6, 0.05, 0.64, lisse(0x3fb0a8), 0, 0.92, -1.9);
  [[-2.2, 0xe46a4f], [-1.9, 0xf2c14e], [-1.6, 0x6fbf73], [1.7, 0xd77fa1], [2.0, 0x3fb0a8]].forEach(([x, c]) => cyl(scene, 0.09, 0.09, 0.26, lisse(c, { rugosite: 0.2 }), x, 1.08, -1.95));
  // une hotte chromée, une horloge
  boite(scene, 1.6, 0.5, 0.6, lisse(0xd8dde4, { metal: 0.7, rugosite: 0.25 }), 0.2, 2.6, -1.9);
  // la table
  boite(scene, 2.6, 0.08, 1.1, lisse(0xe8e2d4, { rugosite: 0.3 }), 0, 0.76, 0.05);
  boite(scene, 2.5, 0.7, 0.04, lisse(0x3fb0a8, { rugosite: 0.4 }), 0, 0.37, 0.58);
  // la cliente
  const cliente = civil({ genre: 'femme', coiffure: 'buns', peau: PEAUX[3], cheveux: CHEVEUX[0], tenue: { haut: 0xe46a4f, manche: 0xe46a4f, bas: 0x3d4a5c, pieds: 0xf0f0f0, mains: null }, graine: 2 });
  cliente.objet.position.set(-0.3, 0.2, -0.78);
  scene.add(cliente.objet);
  cliente.jouer([{ clip: 'Sitting_Idle_Loop', de: 0, vitesse: 0.8 }]);
  cliente.noterRepos();
  const cu = cliente.accrocher(cuillere(), 'hand_r', [0, 0.08, 0.02], [0.3, 0, 1.4]);
  void cu;
  // le bol de soupe
  const bol = new THREE.Group(); bol.position.set(0.05, 0.8, -0.2); bol.scale.setScalar(1.3); scene.add(bol);
  const profil = [[0, 0], [0.06, 0], [0.12, 0.02], [0.16, 0.08], [0.17, 0.12], [0.16, 0.12], [0.15, 0.08], [0.1, 0.03], [0, 0.03]].map(([x, y]) => new THREE.Vector2(x, y));
  maille(bol, new THREE.LatheGeometry(profil, 32), lisse(0xf4f4f0, { rugosite: 0.15 }), 0, 0, 0);
  maille(bol, new THREE.CircleGeometry(0.155, 32).rotateX(-Math.PI / 2), lisse(0xe0913f, { rugosite: 0.3 }), 0, 0.1, 0);
  maille(bol, new THREE.TorusGeometry(0.168, 0.006, 6, 32).rotateX(Math.PI / 2), lisse(C.rouge), 0, 0.105, 0);
  // le ventilateur : socle, pied, cage, pales
  const fan = new THREE.Group(); fan.position.set(0.85, 0.8, -0.05); fan.rotation.y = -Math.PI / 2 - 0.45; fan.scale.setScalar(1.15); scene.add(fan);
  const chrome = lisse(0xd8dde4, { metal: 0.85, rugosite: 0.2 });
  cyl(fan, 0.16, 0.18, 0.05, lisse(C.rouge, { rugosite: 0.3 }), 0, 0.025, 0, 0, 0, 0, 24);
  cyl(fan, 0.018, 0.018, 0.4, chrome, 0, 0.25, 0, 0, 0, 0, 8);
  const tete = new THREE.Group(); tete.position.set(0, 0.5, 0); fan.add(tete);
  maille(tete, new THREE.SphereGeometry(0.07, 16, 10).scale(1, 1, 1.4), lisse(C.rouge, { rugosite: 0.3 }), 0, 0, -0.06);
  maille(tete, new THREE.TorusGeometry(0.28, 0.008, 6, 40), chrome, 0, 0, 0.04);
  for (let i = 0; i < 12; i++) maille(tete, new THREE.CylinderGeometry(0.003, 0.003, 0.56, 4), chrome, 0, 0, 0.05, 0, 0, (i * Math.PI) / 12);
  const pales = new THREE.Group(); pales.position.z = 0.02; tete.add(pales);
  for (let i = 0; i < 3; i++) { const p = maille(pales, new THREE.CircleGeometry(0.14, 12, 0, 1.2), lisse(0x7fc1cf, { rugosite: 0.3, double: true }), 0, 0, 0, 0, 0.3, (i * 2 * Math.PI) / 3); p.position.set(Math.cos((i * 2 * Math.PI) / 3 + 0.6) * 0.1, Math.sin((i * 2 * Math.PI) / 3 + 0.6) * 0.1, 0); }
  boule(tete, 0.035, lisse(C.creme), 0, 0, 0.05, 12);
  const plaque = etiquette('SOUFFLE-SOUPE 3000', { taille: 96 }); plaque.maj(0);
  maille(fan, new THREE.PlaneGeometry(0.36, 0.09), new THREE.MeshStandardMaterial({ map: plaque.texture }), 0, 0.12, 0.17);
  // la vapeur, d'abord droite, puis couchée par le vent
  let marche = 0;
  const v = vapeur(bol, 0, 0.1, 0, () => marche * 1.6, 50);
  // l'étoile du prix
  const prix = etoilePrix(); prix.maj(0);
  const etoile = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: prix.texture, transparent: true }));
  etoile.position.set(-0.95, 1.5, 0.1); scene.add(etoile);

  return {
    scene, camera,
    maj(t, dt, T, m) {
      marche = seg(t, 1.3, 1.9);
      pales.rotation.z = -(t > 1.3 ? (t - 1.3) * 28 - Math.max(0, 1.9 - t) * 0 : 0) * marche;
      tete.rotation.y = Math.sin(t * 0.9) * 0.12 * marche;
      v.maj(t);
      // la cliente : penchée sur sa soupe trop chaude, la cuillère à la main ; puis pouce levé, sourire à la caméra
      cliente.maj(t);
      const content = seg(t, 2.5, 3.0);
      cliente.atteindre('r', [0.02 + content * 0.05, 0.98 + content * 0.36, -0.22 + content * 0.12], [0.6, 0.4, -1.4], 1);
      cliente.atteindre('l', [-0.55, 0.86, -0.25], [-1.2, 0.4, -1.0], 0.8);
      cliente.regarder(content > 0.5 ? [0, 1.25, 3] : [0.05, 0.85, -0.2], 0.9);
      cliente.serrer('r', 0.8, { pouce: 0.9 });
      cliente.serrer('l', 0.25);
      const k = rebond(seg(t, 3.2, 3.7));
      etoile.scale.setScalar(Math.max(0.001, k));
      etoile.rotation.z = Math.sin(t * 3) * 0.08;
      // la caméra : plan d'ensemble de plateau, puis le zoom « télé » sur le produit
      const z = doux(seg(t, 3.1, 3.9));
      cadrer(camera, [0.1 + z * 0.15, 1.28 - z * 0.08, 2.6 - z * 0.4], [0.1 + z * 0.4, 1.02, -0.3], 34 + z * 14);
      habiller(m, t, 'TÉLÉACHAT', C.rouge, [{ titre: 'SOUFFLE-SOUPE 3000', texte: 'Livré avec une télécommande pour l\'allumer.', de: 1.6, a: 6.2 }]);
      return { tube: 1, saturation: 1.18, contraste: 1.05, bloom: 0.3, bloomSeuil: 0.95, vignette: 0.5, grain: 0.06, aberration: 0.0025, teinte: [1.02, 1, 0.96] };
    },
  };
}

/* ====================================================================== 2. MÉTÉO : grand soleil, lancez vos sèche-linge */
export function meteo(moteur) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 500);
  // A. le plateau de la météo
  const studio = new THREE.Group(); scene.add(studio);
  const fond = toile(512, 256, (ctx, t, l, h) => { const g = ctx.createLinearGradient(0, 0, l, h); g.addColorStop(0, '#2f8f99'); g.addColorStop(1, '#174a52'); ctx.fillStyle = g; ctx.fillRect(0, 0, l, h); }, { fixe: true });
  fond.maj(0);
  maille(studio, new THREE.PlaneGeometry(14, 7), new THREE.MeshBasicMaterial({ map: fond.texture }), 0, 2.5, -2.5);
  const carte = ecranMeteo();
  const ecranCarte = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0), new THREE.MeshBasicMaterial({ map: carte.texture }));
  ecranCarte.material.color.setScalar(0.85);
  ecranCarte.position.set(0.7, 1.55, -1.5); studio.add(ecranCarte);
  boite(studio, 3.36, 2.16, 0.06, lisse(0x1a1a1f, { rugosite: 0.3 }), 0.7, 1.55, -1.55);
  maille(studio, new THREE.CircleGeometry(3, 40).rotateX(-Math.PI / 2), lisse(0x1f5e66, { rugosite: 0.6 }), 0, 0.005, 0);
  const presentatrice = civil({ genre: 'femme', coiffure: 'buns', peau: PEAUX[4], cheveux: CHEVEUX[0], tenue: { haut: C.rouge, manche: C.rouge, bas: C.rouge, pieds: 0x1a1a1a, mains: null }, graine: 3 });
  presentatrice.objet.position.set(-1.15, 0, -0.6); presentatrice.objet.rotation.y = 0.35;
  studio.add(presentatrice.objet);
  presentatrice.jouer([{ clip: 'Idle_Talking_Loop', de: 0 }]);
  presentatrice.noterRepos();
  const lum = plateau(studio, { position: [-1, 4, 6], ambiance: 1.7, force: 3.2 });
  void lum;
  // B. le jardin au soleil : le fil à linge vide, et le sèche-linge qui tourne derrière la fenêtre
  const jardin = new THREE.Group(); scene.add(jardin);
  const leCiel = ciel(jardin, 0x5fb3d9, 0xdff1f2, 0x7fa35a, { soleil: [-0.6, 0.45, -1], tailleSoleil: 0.004, couleurSoleil: 0xfff2c0, nuages: 0.55 });
  void leCiel;
  sol(jardin, 0x86b65a, 60);
  herbe(jardin, 900, 9, [0x7fa35a, 0x9aa65e, 0x6f9a4a], 5, [0, 0], 0.3);
  const soleilJ = new THREE.DirectionalLight(0xfff0d0, 3.2); soleilJ.position.set(-6, 9, 3); soleilJ.castShadow = true; soleilJ.shadow.mapSize.set(2048, 2048);
  Object.assign(soleilJ.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); jardin.add(soleilJ, new THREE.HemisphereLight(0xcfe8ff, 0x6a8a4a, 1.1));
  const bois = materiau(0xa8703f);
  for (const x of [-2.2, 1.0]) { cyl(jardin, 0.04, 0.05, 1.9, bois, x, 0.95, -0.5, 0, 0, 0, 6); boite(jardin, 0.6, 0.06, 0.06, bois, x, 1.85, -0.5); }
  const corde = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.2, 1.84, -0.5), new THREE.Vector3(-0.6, 1.72, -0.5), new THREE.Vector3(1.0, 1.84, -0.5)]);
  maille(jardin, new THREE.TubeGeometry(corde, 30, 0.006, 4), lisse(0xf4f4f0), 0, 0, 0);
  const pinces = [];
  for (let i = 0; i < 9; i++) { const p = corde.getPoint(0.06 + i * 0.11); const pi = boite(jardin, 0.02, 0.07, 0.015, materiau([0xe46a4f, 0xf2c14e, 0x3fb0a8][i % 3]), p.x, p.y - 0.03, p.z); pinces.push(pi); }
  // la maison : un pan de mur, une fenêtre, et le sèche-linge allumé derrière
  const maison = new THREE.Group(); maison.position.set(2.6, 0, -1.6); maison.rotation.y = -0.5; jardin.add(maison);
  const enduit = materiau(0xf0d9b5);
  // le mur, percé d'une fenêtre (on voit dedans)
  boite(maison, 1.15, 3.2, 0.2, enduit, -1.575, 1.6, 0);
  boite(maison, 2.05, 3.2, 0.2, enduit, 0.975, 1.6, 0);
  boite(maison, 1.3, 0.95, 0.2, enduit, -0.4, 0.475, 0);
  boite(maison, 1.3, 1.35, 0.2, enduit, -0.4, 2.525, 0);
  boite(maison, 4.2, 0.3, 0.6, materiau(C.rouge), 0, 3.3, 0.1);
  for (const [l, h, x, y] of [[1.5, 0.08, -0.4, 1.89], [1.5, 0.1, -0.4, 0.92], [0.08, 1.0, -1.11, 1.4], [0.08, 1.0, 0.31, 1.4], [0.05, 0.9, -0.4, 1.4]]) boite(maison, l, h, 0.24, lisse(0xf4f4f0), x, y, 0.02);
  const vitre = maille(maison, new THREE.PlaneGeometry(1.3, 0.9), lisse(0x9fc8d8, { rugosite: 0.05, metal: 0.1, transparent: true, opacite: 0.12 }), -0.4, 1.4, 0.15);
  void vitre;
  const piece = new THREE.Group(); piece.position.set(-0.4, 0.55, -0.55); maison.add(piece);
  boite(piece, 2.4, 2.4, 0.05, materiau(0xcfe3d6), 0, 0.8, -0.45);
  boite(piece, 2.4, 0.05, 1.0, materiau(0xb9a07e), 0, -0.02, 0);
  const seche = new THREE.Group(); seche.position.set(0, 0.42, 0.25); seche.scale.setScalar(1.15); piece.add(seche);
  boite(seche, 0.62, 0.8, 0.6, lisse(0xf4f4f0, { rugosite: 0.25 }), 0, 0, 0);
  maille(seche, new THREE.CircleGeometry(0.22, 32), new THREE.MeshBasicMaterial({ color: 0x3a5a7a }), 0, -0.02, 0.305);
  const tambour = new THREE.Group(); tambour.position.set(0, -0.02, 0.31); seche.add(tambour);
  [[0.1, 0.05, C.rouge], [-0.08, 0.09, C.jaune], [0.02, -0.11, 0x7fc1cf], [-0.1, -0.05, 0xd77fa1]].forEach(([x, y, c]) => boule(tambour, 0.075, new THREE.MeshBasicMaterial({ color: c }), x, y, 0.01, 10));
  maille(seche, new THREE.TorusGeometry(0.23, 0.025, 8, 32), lisse(0xd8dde4, { metal: 0.7, rugosite: 0.2 }), 0, -0.02, 0.31);
  boule(seche, 0.02, new THREE.MeshBasicMaterial({ color: 0x40ff90 }), 0.22, 0.32, 0.305, 8);
  // le gag : le sèche-linge tourne dehors, en plein soleil, sur la pelouse, à côté du fil à linge vide
  maison.visible = false;
  jardin.add(seche);
  seche.position.set(1.55, 0.4, -0.35); seche.rotation.y = -0.45; seche.scale.setScalar(1.25);
  const rallonge = new THREE.CatmullRomCurve3([new THREE.Vector3(1.75, 0.15, -0.65), new THREE.Vector3(2.4, 0.02, -1.2), new THREE.Vector3(3.6, 0.02, -1.0), new THREE.Vector3(6, 0.02, -3)]);
  maille(jardin, new THREE.TubeGeometry(rallonge, 30, 0.012, 5), lisse(0xf2a23a), 0, 0, 0);

  return {
    scene, camera,
    maj(t, dt, T, m) {
      const dehors = t >= 3.15;
      studio.visible = !dehors; jardin.visible = dehors;
      if (!dehors) {
        scene.background = null;
        carte.maj(t);
        presentatrice.maj(t);
        const montre = seg(t, 0.4, 0.8) * (1 - seg(t, 2.4, 2.9));
        presentatrice.atteindre('l', [0.1, 1.7 + Math.sin(t * 2) * 0.08, -1.3], [-1.6, 1.0, -1.4], montre);
        presentatrice.regarder([0, 1.5, 4], 0.7);
        const s = epaule(t, 0.4);
        cadrer(camera, [-0.1 + s[0], 1.5 + s[1], 4.6 - t * 0.12], [-0.2, 1.35, -0.6], 34);
        habiller(m, t, 'MÉTÉO', C.canard, [{ titre: 'DEMAIN · GRAND SOLEIL', texte: '32° à l\'ombre. Profitez-en !', de: 0.9, a: 3.3 }]);
      } else {
        const u = t - 3.15;
        tambour.rotation.z = -u * 7;
        pinces.forEach((p, i) => (p.rotation.z = Math.sin(u * 3 + i) * 0.15));
        const k = doux(seg(u, 0, 3.1));
        cadrer(camera, [-1.2 + k * 2.3, 1.5 - k * 0.3, 2.8 - k * 0.6], [-0.6 + k * 2.1, 1.6 - k * 1.0, -0.5 + k * 0.1], 32 + k * 4);
        habiller(m, t, 'MÉTÉO', C.canard, [{ titre: 'LE CONSEIL DU JOUR', texte: 'Grand soleil : lancez vos sèche-linge !', de: 3.3, a: 6.4 }]);
      }
      return { tube: 1, saturation: 1.2, contraste: 1.04, bloom: 0.3, bloomSeuil: 0.95, vignette: 0.5, grain: 0.06, aberration: 0.0025 };
    },
  };
}

/* ====================================================================== 3. TENDANCES : le perron mécanique, la laisse-drone */
export function tendances(moteur) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 500);
  // A. le perron mécanique
  const perron = new THREE.Group(); scene.add(perron);
  ciel(perron, 0x6fbde0, 0xe6f4f4, 0xb8b0a2, { nuages: 0.5 });
  eclairage(perron, { ambiance: 1.1, force: 3, position: [4, 8, 6], ombre: 7 });
  boite(perron, 30, 0.1, 30, materiau(0xcdbfa6), 0, -0.05, 0);
  maille(perron, new THREE.PlaneGeometry(30, 0.2).rotateX(-Math.PI / 2), materiau(0x86b65a), 0, 0.002, 2.5);
  const mur = materiau(0xf0d9b5);
  boite(perron, 9, 4.5, 0.3, mur, 0.5, 2.25, -1.6);
  boite(perron, 1.1, 2.1, 0.06, lisse(C.canard, { rugosite: 0.4 }), 1.8, 1.6, -1.42);
  boule(perron, 0.04, lisse(0xb59048, { metal: 0.8 }), 1.45, 1.55, -1.36, 8);
  boite(perron, 2.2, 0.54, 1.2, materiau(0xd9c9a8), 1.8, 0.27, -0.95);
  for (const x of [-2.4, -0.9, 3.4]) { boite(perron, 1.0, 1.2, 0.1, lisse(0x9fd3e0, { rugosite: 0.1 }), x, 2.4, -1.44); boite(perron, 1.1, 1.3, 0.06, lisse(0xf4f4f0), x, 2.4, -1.48); }
  // l'escalator : trois marches, carénage chromé, rampes noires, marches qui défilent
  const esc = new THREE.Group(); esc.position.set(0.15, 0, -0.95); perron.add(esc);
  const pente = Math.atan2(0.54, 1.1);
  const carenage = lisse(0xd8dde4, { metal: 0.75, rugosite: 0.25 });
  for (const z of [-0.42, 0.42]) {
    const flanc = new THREE.Shape([new THREE.Vector2(-0.3, 0), new THREE.Vector2(1.5, 0), new THREE.Vector2(1.5, 0.95), new THREE.Vector2(1.1, 0.95), new THREE.Vector2(-0.3, 0.25)]);
    const geo = new THREE.ExtrudeGeometry(flanc, { depth: 0.06, bevelEnabled: false }).translate(0, 0, -0.03);
    maille(esc, geo, carenage, 0, 0, z);
    const rampe = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.35, 1.1, z), new THREE.Vector3(0, 1.15, z), new THREE.Vector3(1.1, 1.7, z), new THREE.Vector3(1.55, 1.7, z)]);
    // la balustrade vitrée qui porte la rampe
    maille(esc, new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.3, 0.25), new THREE.Vector2(1.1, 0.95), new THREE.Vector2(1.5, 0.95), new THREE.Vector2(1.5, 1.66), new THREE.Vector2(1.1, 1.66), new THREE.Vector2(0, 1.11), new THREE.Vector2(-0.3, 1.07)]), { depth: 0.012, bevelEnabled: false }).translate(0, 0, -0.006), lisse(0xcfe8ef, { rugosite: 0.05, transparent: true, opacite: 0.25 }), 0, 0, z);
    maille(esc, new THREE.TubeGeometry(rampe, 24, 0.035, 6), lisse(0x1a1a1f, { rugosite: 0.6 }), 0, 0, 0);
  }
  const marches = [];
  for (let i = 0; i < 9; i++) { const m = boite(esc, 0.22, 0.04, 0.8, lisse(0x5f656b, { metal: 0.5, rugosite: 0.4 }), 0, 0, 0); marches.push(m); }
  const panneau = etiquette('PERRON\nMÉCANIQUE', { taille: 92, l: 768, h: 384 }); panneau.maj(0);
  const pano = maille(perron, new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshStandardMaterial({ map: panneau.texture }), -0.6, 1.35, -0.5, 0, 0.3, 0);
  cyl(perron, 0.02, 0.02, 1.1, lisse(0x5f656b, { metal: 0.6 }), -0.6, 0.55, -0.5, 0, 0, 0, 6);
  void pano;
  // la file d'attente, et celui qui monte (lentement)
  const file = [
    civil({ genre: 'femme', coiffure: 'long', peau: PEAUX[0], cheveux: CHEVEUX[3], tenue: TENUES_ABONDANCE[6], graine: 11 }),
    civil({ genre: 'homme', coiffure: 'buzzed', barbe: true, peau: PEAUX[4], tenue: TENUES_ABONDANCE[2], graine: 12 }),
    civil({ genre: 'homme', coiffure: null, peau: PEAUX[1], tenue: TENUES_ABONDANCE[5], graine: 13, hauteur: 1.68 }),
  ];
  file.forEach((p, i) => { p.objet.position.set(-0.6 - i * 0.75, 0, -0.95 + (i % 2) * 0.12); p.objet.rotation.y = Math.PI / 2; perron.add(p.objet); p.jouer([{ clip: i === 1 ? 'Idle_Loop' : 'Idle_FoldArms_Loop', de: 0, depuis: i * 0.7 }]); p.noterRepos(); });
  const telFile = file[1].accrocher(telephone(), 'hand_r', [0.02, 0.09, 0], [0, 0, 0]);
  void telFile;
  const monteur = civil({ genre: 'homme', coiffure: 'simpleparted', peau: PEAUX[2], cheveux: CHEVEUX[1], tenue: TENUES_ABONDANCE[0], graine: 14 });
  monteur.objet.rotation.y = Math.PI / 2; perron.add(monteur.objet);
  monteur.jouer([{ clip: 'Idle_Loop', de: 0 }]); monteur.noterRepos();

  // B. la rue : la laisse-drone
  const rue = new THREE.Group(); scene.add(rue);
  ciel(rue, 0x6fbde0, 0xe6f4f4, 0xb8b0a2, { nuages: 0.5 });
  eclairage(rue, { ambiance: 1.1, force: 3, position: [3, 8, 7], ombre: 9 });
  boite(rue, 60, 0.1, 6, materiau(0x9c9486), 0, -0.05, 2.5);
  boite(rue, 60, 0.14, 2.4, materiau(0xcdbfa6), 0, 0.02, -0.4);
  for (let i = -12; i < 12; i++) boite(rue, 1.2, 0.012, 0.12, materiau(0xf4f4f0), i * 2.6, 0.005, 3.2);
  const facades = [0xf0d9b5, 0xcfe3d6, 0xf1c6a8, 0xe6dabd];
  for (let i = -3; i < 4; i++) {
    const mat = materiau(facades[(i + 4) % 4]);
    if (i === 0) {
      // la maison du maître : la façade percée de la grande fenêtre du salon
      boite(rue, 1.7, 5, 0.3, mat, -1.45, 2.5, -1.8);
      boite(rue, 0.5, 5, 0.3, mat, 2.05, 2.5, -1.8);
      boite(rue, 2.4, 1.0, 0.3, mat, 0.6, 0.5, -1.8);
      boite(rue, 2.4, 2.5, 0.3, mat, 0.6, 3.75, -1.8);
    } else boite(rue, 4.6, 5, 0.3, mat, i * 4.8, 2.5, -1.8);
    boite(rue, 4.8, 0.3, 0.6, materiau(C.rouge), i * 4.8, 5.1, -1.6);
  }
  // la grande fenêtre du salon, le maître dans son canapé
  for (const [l, h, x, y] of [[2.6, 0.1, 0.6, 2.5], [2.6, 0.12, 0.6, 1.0], [0.1, 1.6, -0.6, 1.75], [0.1, 1.6, 1.8, 1.75], [0.06, 1.5, 0.6, 1.75]]) boite(rue, l, h, 0.12, lisse(0xf4f4f0), x, y, -1.62);
  const vitreRue = maille(rue, new THREE.PlaneGeometry(2.4, 1.5), lisse(0xbfe0ef, { rugosite: 0.05, metal: 0.1, transparent: true, opacite: 0.12 }), 0.6, 1.75, -1.62);
  void vitreRue;
  const salonRue = new THREE.Group(); salonRue.position.set(0.6, 0.55, -2.7); rue.add(salonRue);
  boite(salonRue, 3, 2.4, 0.1, materiau(0xe9d7c0), 0, 0.9, -0.6);
  boite(salonRue, 2.0, 0.45, 0.8, lisse(0x3f8f6a, { rugosite: 0.7 }), 0, 0.22, 0);
  boite(salonRue, 2.0, 0.6, 0.25, lisse(0x3f8f6a, { rugosite: 0.7 }), 0, 0.6, -0.35);
  const maitre = civil({ genre: 'homme', coiffure: 'buzzed', peau: PEAUX[1], cheveux: CHEVEUX[2], tenue: TENUES_ABONDANCE[2], graine: 15 });
  maitre.objet.position.set(0.1, 0.08, 0.15); salonRue.add(maitre.objet);
  maitre.jouer([{ clip: 'Sitting_Idle_Loop', de: 0 }]); maitre.noterRepos();
  const lumSalon = new THREE.PointLight(0xffe0b0, 14, 6, 1.6); lumSalon.position.set(0.4, 1.8, 0.9); salonRue.add(lumSalon);
  const toutou = chien(); rue.add(toutou.objet);
  const dr = drone(); rue.add(dr.objet);
  const laisse = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0, 1, 0)), 1, 0.006, 4), lisse(C.rouge));
  rue.add(laisse);

  return {
    scene, camera,
    maj(t, dt, T, m) {
      const dehors = t >= 3.05;
      perron.visible = !dehors; rue.visible = dehors;
      if (!dehors) {
        // les marches défilent ; le monteur glisse, immobile
        marches.forEach((mm, i) => {
          const k = ((t * 0.18 + i / 9) % 1);
          const x = -0.25 + k * 1.75;
          const y = x < 0 ? 0.25 : x > 1.1 ? 0.95 : 0.25 + (x / 1.1) * 0.7;
          mm.position.set(x, y - 0.02, 0); mm.rotation.z = 0;
        });
        const k = t / 3.05 * 0.45;
        monteur.objet.position.set(-0.05 + k * 1.1 + 0.15, 0.27 + k * 0.7, -0.95);
        monteur.maj(t);
        // les deux mains posées sur les rampes (il regarde vers +x : sa droite est côté +z), à la hauteur de la rampe
        const mx = monteur.objet.position.x + 0.12, lx = Math.min(1.1, Math.max(0, mx - 0.15));
        const yr = 1.17 + lx * 0.5;
        monteur.atteindre('r', [mx, yr, -0.95 + 0.4], [mx - 0.5, yr - 0.3, -0.95 + 0.9], 1);
        monteur.atteindre('l', [mx, yr, -0.95 - 0.4], [mx - 0.5, yr - 0.3, -0.95 - 0.9], 1);
        monteur.serrer('r', 0.75, { rond: 0.6 }); monteur.serrer('l', 0.75, { rond: 0.6 });
        monteur.regarder([3, 1.5, 4], 0.6);
        file.forEach((p, i) => { p.maj(t); if (i === 1) { p.atteindre('r', [p.objet.position.x + 0.3, 1.25, p.objet.position.z + 0.1], [p.objet.position.x, 0.8, p.objet.position.z + 0.6], 1); p.regarder([p.objet.position.x + 0.3, 1.2, p.objet.position.z + 0.1], 0.8); p.serrer('r', 0.7, { pouce: 0.5 }); } else p.regarder([0.4, 1.4, -0.95], 0.5); });
        const s = epaule(t, 0.5);
        cadrer(camera, [-1.0 + t * 0.1 + s[0], 1.4 + s[1], 4.4], [0.1, 0.95, -0.9], 32);
        habiller(m, t, 'TENDANCES', '#8a5aa8', [{ titre: 'LE PERRON MÉCANIQUE', texte: 'Temps de montée : 4 minutes. Zéro effort.', de: 0.4, a: 3.1 }]);
      } else {
        const u = t - 3.05;
        const x = -3.2 + u * 1.9;
        toutou.objet.position.set(x, 0.09, 0.6);
        toutou.maj(u, 1);
        dr.objet.position.set(x + 0.2 + Math.sin(u * 2) * 0.05, 2.1 + Math.sin(u * 3) * 0.06, 0.6);
        dr.objet.rotation.z = -0.12;
        dr.maj(u);
        rue.updateMatrixWorld(true);
        const a = toutou.collier(), b = dr.objet.position.clone().add(new THREE.Vector3(0, -0.08, 0));
        laisse.position.copy(a); laisse.scale.set(1, a.distanceTo(b), 1);
        laisse.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        maitre.maj(u);
        maitre.atteindre('r', [0.95, 1.95 + Math.sin(u * 7) * 0.08, -2.2], [1.6, 1.2, -2.8], doux(seg(u, 0.6, 1.0)));
        maitre.regarder([x, 0.4, 0.6], 0.8);
        cadrer(camera, [x - 1.2, 1.25, 4.2], [x + 0.3, 1.0, 0.0], 30);
        habiller(m, t, 'TENDANCES', '#8a5aa8', [{ titre: 'LA LAISSE-DRONE', texte: 'Votre chien se promène tout seul.', de: 3.3, a: 6.2 }]);
      }
      return { tube: 1, saturation: 1.2, contraste: 1.04, bloom: 0.3, vignette: 0.5, grain: 0.06, aberration: 0.0025 };
    },
  };
}

/* ====================================================================== 5. NATURE & VOUS : arroseurs sous la pluie, une pomme livrée */
export function nature(moteur) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 500);
  // A. la pelouse sous la pluie, les arroseurs qui tournent quand même
  const mouille = new THREE.Group(); scene.add(mouille);
  ciel(mouille, 0x7d8a96, 0xb9c2c6, 0x4a5a3a, { nuages: 0.95, couleurNuages: 0x9aa4ac });
  mouille.add(new THREE.HemisphereLight(0xb9c8d6, 0x3a4a2a, 1.4));
  const gris = new THREE.DirectionalLight(0xdfe8f0, 1.2); gris.position.set(2, 8, 4); gris.castShadow = true; mouille.add(gris);
  sol(mouille, 0x5f8a45, 40);
  herbe(mouille, 1400, 8, [0x5f8a45, 0x6f9a4a, 0x4f7a3a], 9, [0, 0], 0.18);
  const jets = [];
  [[-2.2, -0.5], [0, 0.6], [2.3, -0.3]].forEach(([x, z], i) => {
    cyl(mouille, 0.03, 0.03, 0.3, lisse(0x5f656b, { metal: 0.6 }), x, 0.15, z, 0, 0, 0, 8);
    boule(mouille, 0.05, lisse(C.jaune), x, 0.32, z, 10);
    jets.push(jet(mouille, x, 0.34, z, (t) => Math.PI / 2 + Math.sin(t * 1.4 + i * 2) * 1.1, 140));
  });
  const pancarte = etiquette('ARROSAGE\nAUTO 18:00', { police: 'machine', taille: 80, couleur: C.canard, l: 768, h: 384 }); pancarte.maj(0);
  maille(mouille, new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshStandardMaterial({ map: pancarte.texture }), 1.2, 0.9, 1.2, 0, -0.3, 0);
  cyl(mouille, 0.02, 0.02, 0.75, materiau(0xa8703f), 1.2, 0.38, 1.18, 0, 0, 0, 6);
  const averse = pluie(mouille, [0, 0, 2], 6, 2400, 10);
  // B. le verger au soleil : un pommier chargé, et le drone qui livre une pomme
  const verger = new THREE.Group(); scene.add(verger);
  ciel(verger, 0x5fb3d9, 0xdff1f2, 0x7fa35a, { soleil: [0.7, 0.5, -1], tailleSoleil: 0.004, nuages: 0.5 });
  const sv = new THREE.DirectionalLight(0xfff0d0, 3.2); sv.position.set(5, 9, 4); sv.castShadow = true; sv.shadow.mapSize.set(2048, 2048);
  Object.assign(sv.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); verger.add(sv, new THREE.HemisphereLight(0xcfe8ff, 0x6a8a4a, 1.6));
  const face = new THREE.DirectionalLight(0xffffff, 1.2); face.position.set(1, 2, 6); verger.add(face);
  sol(verger, 0x86b65a, 60);
  herbe(verger, 900, 8, [0x7fa35a, 0x9aa65e, 0x6f9a4a], 13, [0, 0], 0.3);
  const arbre = pommierCinema(7);
  arbre.objet.position.set(-0.6, 0, -0.9); arbre.objet.rotation.y = 0.6; arbre.objet.scale.setScalar(1.15);
  verger.add(arbre.objet);
  const client = civil({ genre: 'homme', coiffure: 'buzzed', peau: PEAUX[5], cheveux: CHEVEUX[6], tenue: TENUES_ABONDANCE[1], graine: 21 });
  client.objet.position.set(0.25, 0, 0.0); client.objet.rotation.y = 0.2;
  verger.add(client.objet);
  client.jouer([{ clip: 'Idle_Loop', de: 0, a: 4.75 }, { clip: 'Hit_Head', de: 4.65, a: 5.6, boucle: false, fondu: 0.08, vitesse: 1.2 }, { clip: 'Idle_Loop', de: 5.5 }]);
  client.noterRepos();
  client.accrocher(telephone(), 'hand_r', [0.02, 0.09, 0.0], [0, 0, 0]);
  const livreur = drone(); verger.add(livreur.objet);
  const colis = new THREE.Group(); livreur.objet.add(colis); colis.position.y = -0.36;
  cyl(colis, 0.004, 0.004, 0.24, lisse(0x1a1a1a), 0, 0.12, 0, 0, 0, 0, 4);
  boite(colis, 0.3, 0.22, 0.3, materiau(0xd9b98c), 0, -0.1, 0);
  boite(colis, 0.31, 0.05, 0.31, materiau(C.rouge), 0, -0.04, 0);
  const pomme = new THREE.Group(); verger.add(pomme);
  boule(pomme, 0.05, lisse(C.rouge, { rugosite: 0.3 }), 0, 0, 0, 12);
  cyl(pomme, 0.004, 0.004, 0.04, materiau(0x5a3a22), 0, 0.05, 0, 0, 0, 0.3, 4);

  return {
    scene, camera,
    maj(t, dt, T, m) {
      const soleil = t >= 3.0;
      mouille.visible = !soleil; verger.visible = soleil;
      if (!soleil) {
        jets.forEach((j) => j.maj(t));
        averse.maj(t);
        cadrer(camera, [-1.2 + t * 0.3, 1.1, 3.4], [0.1, 0.6, 0], 32);
        habiller(m, t, 'NATURE & VOUS', '#3f8f6a', [{ titre: 'L\'ARROSAGE CONNECTÉ', texte: 'Il pleut ? Il arrose quand même : c\'est programmé !', de: 0.3, a: 3.1 }]);
      } else {
        const u = t - 3.0;
        // le drone descend, se pose ; la pomme tombe de l'arbre sur la tête du client
        const d = doux(seg(u, 0, 1.8));
        livreur.objet.position.set(2.4 - d * 1.75, 3.2 - d * 2.0, 0.7 - d * 0.3);
        livreur.objet.rotation.z = (1 - d) * 0.18;
        livreur.maj(u);
        client.maj(u);
        client.atteindre('r', [0.42, 1.18, 0.32], [0.9, 0.8, -0.4], seg(u, 0, 0.1) * (1 - seg(u, 1.6, 1.75)) + seg(u, 2.8, 3.0));
        client.regarder(u < 1.7 ? [0.42, 1.15, 0.35] : [livreur.objet.position.x, livreur.objet.position.y, livreur.objet.position.z], 0.85);
        const chute = seg(u, 1.25, 1.65);
        const tete = client.ou('Head');
        pomme.visible = u < 2.6;
        if (u < 1.65) pomme.position.set(tete.x - 0.02, 3.0 - (3.0 - tete.y - 0.18) * chute * chute, tete.z);
        else { const r = seg(u, 1.65, 2.4); pomme.position.set(tete.x + 0.05 + r * 0.6, Math.max(0.05, tete.y + 0.18 + r * 0.4 - r * r * 2.2), tete.z + r * 0.3); }
        cadrer(camera, [1.2 - d * 0.3, 0.95, 3.0], [0.25, 1.25, 0], 32);
        habiller(m, t, 'NATURE & VOUS', '#3f8f6a', [{ titre: 'LIVRAISON EXPRESS', texte: 'Une pomme, livrée au pied de votre pommier.', de: 3.2, a: 6.2 }]);
      }
      return { tube: 1, saturation: soleil ? 1.2 : 1.05, contraste: 1.04, bloom: 0.3, vignette: 0.5, grain: 0.06, aberration: 0.0025 };
    },
  };
}
