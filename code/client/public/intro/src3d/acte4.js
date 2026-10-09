/* Watt Now? — intro 3D, acte IV : les trois ensemble. L'aube sur le Comptoir du Carrefour (le vrai, celui du jeu),
   où convergent un Charbonnier, une Voltaïque, une Mécaniste ; l'affiche de Watty, en ruine, corrigée au feutre ;
   puis le personnage du joueur, sur son terrain, au petit matin, à côté du vieux vélo. Et le titre. */

import { THREE, creerComptoir, animerComptoir, lumieresComptoir, VueRessource, APPARENCES_DE_REFERENCE } from '../vendor/rendu-jeu.js';
import { familial, cadrer, cles, epaule } from './acteurs.js';
import { lisse, materiau, boite, maille, ciel, sol, herbe, fumee, particules } from './decors.js';
import { toile, police, image, feutre } from './textures.js';
import { ENSEMBLE, TITRE } from '../src/temps.js';
import { C } from '../src/dessins.js';

const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const doux = (k) => k * k * (3 - 2 * k);
const rebond = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

/** Un ciel d'aube et sa lumière rasante. */
function aube(scene, o = {}) {
  const leCiel = ciel(scene, 0x34406a, 0xf2b07a, 0x6a6a5a, { soleil: o.soleil || [0.8, 0.05, -0.6], tailleSoleil: 0.006, couleurSoleil: 0xffd59a, etoiles: 0.15, nuages: 0.5, couleurNuages: 0xf7c4a0 });
  scene.fog = new THREE.FogExp2(0xe9c0a0, o.brume ?? 0.012);
  const hemi = new THREE.HemisphereLight(0xffd8c0, 0x4a5a3a, 0.9); scene.add(hemi);
  const soleil = new THREE.DirectionalLight(0xffc48a, 3.0);
  soleil.position.set(...(o.position || [40, 8, -30])); soleil.castShadow = true; soleil.shadow.mapSize.set(2048, 2048);
  const d = o.ombre || 30;
  Object.assign(soleil.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 1, far: 200 });
  soleil.shadow.bias = -0.0005; soleil.shadow.normalBias = 0.03;
  scene.add(soleil, soleil.target);
  return { leCiel, hemi, soleil };
}

/* ====================================================================== 1. L'aube sur le Comptoir : ils arrivent */
const comptoir = {
  debut: ENSEMBLE, fin: ENSEMBLE + 10.6, preparer: 3,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 900);
    const { soleil } = aube(scene, { brume: 0.0035, ombre: 40 });
    const carrefour = creerComptoir();
    scene.add(carrefour);
    const boite3 = new THREE.Box3().setFromObject(carrefour);
    const centre = boite3.getCenter(new THREE.Vector3());
    soleil.target.position.copy(centre);
    soleil.position.copy(centre).add(new THREE.Vector3(40, 9, -30));
    for (const l of lumieresComptoir()) { const p = new THREE.PointLight(l.couleur, l.intensite * 0.6, l.portee, 1.6); p.position.set(l.x, l.y, l.z); scene.add(p); }
    sol(scene, 0x5f7a44, 400).position.y = -0.05;
    // au loin : la fumée d'un hameau de Charbonniers, une lueur blanche chez les Voltaïques
    const fumeeLoin = fumee(scene, centre.x - 60, 2, centre.z - 70, { n: 40, hauteur: 30, taille: 14, derive: 8, opacite: 0.28, vie: 12, couleur: 0x8a8590 });
    // les trois qui arrivent, chacun de son côté
    const venants = ['charbonniers', 'voltaiques', 'mecanistes'].map((f, i) => {
      const a = familial(f);
      scene.add(a.objet);
      a.jouer([{ clip: 'Walk_Loop', de: 0, vitesse: 0.9, depuis: i * 0.4 }]);
      a.noterRepos();
      return a;
    });
    const arrivee = centre.clone().add(new THREE.Vector3(0, 0, 6));
    const departs = [new THREE.Vector3(-22, 0, 14), new THREE.Vector3(20, 0, 16), new THREE.Vector3(2, 0, 30)].map((v) => v.add(arrivee));
    return {
      scene, camera,
      maj(t, dt) {
        animerComptoir(dt);
        fumeeLoin.maj(t);
        venants.forEach((a, i) => {
          const k = Math.min(1, t / 12);
          const p = departs[i].clone().lerp(arrivee.clone().add(new THREE.Vector3((i - 1) * 1.4, 0, 2.5)), k);
          a.objet.position.copy(p);
          const dir = arrivee.clone().sub(departs[i]);
          a.objet.rotation.y = Math.atan2(dir.x, dir.z);
          a.maj(t);
        });
        // la caméra descend du ciel vers le carrefour, en tournant doucement
        const ang = -0.6 + t * 0.03;
        const r = cles([[0, 70], [10.6, 32]], t), h = cles([[0, 55], [10.6, 12]], t);
        cadrer(camera, [arrivee.x + Math.sin(ang) * r, h, arrivee.z + Math.cos(ang) * r], [arrivee.x, cles([[0, 0], [10.6, 2.5]], t), arrivee.z - 4], cles([[0, 28], [10.6, 34]], t));
        return { bloom: 0.45, bloomSeuil: 0.85, vignette: 0.45, grain: 0.045, exposition: 1.0, teinte: [1.06, 1.0, 0.94], noir: 1 - seg(t, 0, 0.6) };
      },
    };
  },
};

/** L'affiche de Watty, vieillie : délavée, tachée, déchirée. */
function afficheVieille() {
  return toile(1024, 1400, (ctx, t, l, h) => {
    ctx.fillStyle = '#e9dcbc'; ctx.fillRect(0, 0, l, h);
    ctx.fillStyle = '#b8564a'; ctx.fillRect(0, 0, l, 170);
    ctx.fillStyle = '#efe2c2'; ctx.font = police('titre', 96); ctx.textAlign = 'center'; ctx.fillText('LA COMPAGNIE', l / 2, 125);
    const w = image('wattyClin'); if (w) { ctx.globalAlpha = 0.85; ctx.drawImage(w, 70, 250, 470, 533); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#b8564a'; ctx.font = police('titre', 96); ctx.textAlign = 'left'; ctx.fillText('TOUJOURS', 480, 560, 500); ctx.fillText('PLEIN,', 520, 670);
    ctx.fillStyle = '#5a4a3a'; ctx.font = 'italic ' + police('texte', 76); ctx.fillText('jamais à plat !', 380, 880);
    // l'usure : taches, pluie, déchirures
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(110,90,60,${0.05 + (i % 5) * 0.02})`; ctx.beginPath(); ctx.arc((i * 397) % l, (i * 211) % h, 20 + (i * 37) % 90, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(90,70,50,0.08)'; ctx.fillRect((i * 151) % l, 0, 6 + (i % 4) * 4, h); }
    ctx.fillStyle = '#7a3e2e'; ctx.beginPath(); ctx.moveTo(l, 980); ctx.lineTo(l - 260, 1060); ctx.lineTo(l - 200, 1180); ctx.lineTo(l - 330, 1400); ctx.lineTo(l, 1400); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 1250); ctx.lineTo(160, 1300); ctx.lineTo(120, 1400); ctx.lineTo(0, 1400); ctx.closePath(); ctx.fill();
  }, { fixe: true });
}

/* ====================================================================== 2. L'affiche, corrigée au feutre */
const affiche = {
  debut: ENSEMBLE + 10.6, fin: ENSEMBLE + 16.6, preparer: 2,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 100);
    const { soleil } = aube(scene, { position: [6, 1.4, 3], brume: 0.02, ombre: 6 });
    soleil.intensity = 3.4;
    // un mur de briques, l'affiche collée dessus, le feutre par-dessus
    const briques = toile(1024, 1024, (ctx, t, l, h) => {
      ctx.fillStyle = '#5e3326'; ctx.fillRect(0, 0, l, h);
      for (let y = 0, r = 0; y < h; y += 64, r++) for (let x = -(r % 2) * 64; x < l; x += 128) { ctx.fillStyle = ['#9a5a44', '#8a4e3a', '#a3644c', '#93553f'][(x / 128 + r) & 3]; ctx.fillRect(x + 4, y + 4, 120, 56); }
    }, { fixe: true, repeter: true });
    briques.maj(0); briques.texture.repeat.set(3, 2);
    maille(scene, new THREE.PlaneGeometry(9, 6), new THREE.MeshStandardMaterial({ map: briques.texture, roughness: 0.95 }), 0, 2, 0);
    sol(scene, 0x6a6255, 30);
    const vieille = afficheVieille(); vieille.maj(0);
    const papier = maille(scene, new THREE.PlaneGeometry(1.7, 2.32, 8, 8), new THREE.MeshStandardMaterial({ map: vieille.texture, roughness: 0.85 }), 0.1, 1.9, 0.01, 0, 0, -0.03);
    const pe = papier.geometry.getAttribute('position');
    for (let i = 0; i < pe.count; i++) pe.setZ(i, Math.sin(pe.getX(i) * 6 + pe.getY(i) * 3) * 0.008);
    papier.geometry.computeVertexNormals();
    const graffiti = feutre();
    const calqueFeutre = maille(scene, new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshStandardMaterial({ map: graffiti.texture, transparent: true, roughness: 0.6 }), 0.15, 1.95, 0.02, 0, 0, -0.03);
    void calqueFeutre;
    return {
      scene, camera,
      maj(t) {
        graffiti.maj(t);
        cadrer(camera, [0.15 + t * 0.03, 1.95, 3.4 - t * 0.12], [0.15, 1.92, 0], 38);
        return { bloom: 0.3, bloomSeuil: 0.9, vignette: 0.55, grain: 0.05, exposition: 1.0, teinte: [1.06, 1.0, 0.93] };
      },
    };
  },
};

/* ====================================================================== 3. Toi, sur ton terrain, au petit matin ; le titre */
function terrain(famille, apparence) {
  return {
    debut: ENSEMBLE + 16.6, fin: TITRE + 100000, preparer: 2.5,
    creer() {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 900);
      const { soleil, leCiel } = aube(scene, { position: [30, 4, -25], brume: 0.02, ombre: 10 });
      sol(scene, 0x6f8a46, 200, { relief: 1.5, plat: 12 });
      herbe(scene, 2600, 12, [0x7fa35a, 0x9aa65e, 0x6f9a4a], 41, [0, 0], 0.32, 0.6);
      const velo = new VueRessource({ id: 51, type: 'velo', x: 1.6, z: 0.4, disponible: true });
      velo.objet.rotation.y = 1.1;
      scene.add(velo.objet);
      const toi = familial(famille, apparence || APPARENCES_DE_REFERENCE[famille]);
      toi.objet.position.set(0, 0, 0); toi.objet.rotation.y = 2.3;
      scene.add(toi.objet);
      toi.jouer([{ clip: 'Idle_Loop', de: 0, vitesse: 0.6 }]);
      toi.noterRepos();
      const brume = particules(scene, 30, (i, t, [a, b, c]) => [(a - 0.5) * 30 + Math.sin(t * 0.1 + i) * 2, 0.4 + b * 0.6, -6 - c * 14, 3 + b * 3, 0.12], { couleur: 0xfff0e0, echelle: 250 });
      return {
        scene, camera,
        maj(t, dt, T) {
          const jour = doux(seg(t, 0, 14));
          leCiel.material.uniforms.soleil.value.set(0.8, 0.05 + jour * 0.1, -0.6).normalize();
          soleil.intensity = 2.6 + jour * 0.8;
          toi.maj(t);
          toi.regarder([24, 2.2, -18], 0.7);
          brume.maj(t);
          const u = T - TITRE;   // < 0 avant le titre
          const a = 0.6 - t * 0.035;
          const r = cles([[0, 3.4], [6, 4.2], [12, 7.5]], t);
          cadrer(camera, [Math.sin(a) * r, cles([[0, 1.3], [6, 1.5], [12, 2.6]], t), Math.cos(a) * r], [0.4, cles([[0, 1.25], [12, 1.6]], t), -0.6], 34);
          return { bloom: 0.5, bloomSeuil: 0.82, vignette: 0.45, grain: 0.045, exposition: 1.05, teinte: [1.05, 1.0, 0.95], noir: u > 0 ? 0.25 * doux(seg(u, 0, 1.0)) : 0 };
        },
      };
    },
  };
}

export const plansActe4 = (famille, apparence) => [comptoir, affiche, terrain(famille, apparence)];

const PHRASES = {
  charbonniers: 'Toi, tu sais faire un feu. Tu es déjà plus utile que ton grille-pain.',
  voltaiques: 'Toi, tu sais faire du courant. Pas seulement en consommer.',
  mecanistes: 'Toi, tu sais qu\'une pomme pousse sur un arbre. Ça te met loin devant.',
};

export const cartonsActe4 = (famille) => [
  [ENSEMBLE + 0.8, ENSEMBLE + 4.8, 'Le réseau ne reviendra pas. Il n\'y a pas de mise à jour pour ça.', 'recit'],
  [ENSEMBLE + 5.0, ENSEMBLE + 10.3, 'Le monde s\'est éteint. Restent ceux qui pensent encore. C\'est déjà ça.', 'recit'],
  [ENSEMBLE + 17.2, TITRE - 0.3, PHRASES[famille] || PHRASES.charbonniers, 'toi'],
];

/** Le titre, dessiné dans le calque : WATT NOW? qui rebondit sur le premier temps de la boucle, puis « Et maintenant ? ». */
export function dessinerTitre(ctx, T, l, h) {
  const u = T - TITRE;
  if (u < 0) return false;
  const logo = image('logo');
  const k = rebond(seg(u, 0, 0.7));
  ctx.save();
  ctx.translate(l / 2, h * 0.3);
  ctx.rotate((1 - seg(u, 0, 0.7)) * -0.18);
  ctx.scale(Math.max(0.001, k), Math.max(0.001, k));
  const lw = l * 0.46, lh = lw * 0.36;
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  if (logo) ctx.drawImage(logo, -lw / 2, -lh / 2, lw, lh);
  ctx.restore();
  const s = seg(u, 1.2, 2.2);
  if (s > 0) {
    ctx.save();
    ctx.globalAlpha = s;
    ctx.font = 'italic ' + police('texte', Math.round(h * 0.05));
    ctx.textAlign = 'center';
    ctx.lineWidth = h * 0.008; ctx.strokeStyle = 'rgba(59,42,30,0.9)'; ctx.strokeText('Et maintenant ?', l / 2, h * 0.48 + (1 - s) * 10);
    ctx.fillStyle = '#fff6e0'; ctx.fillText('Et maintenant ?', l / 2, h * 0.48 + (1 - s) * 10);
    ctx.restore();
  }
  return true;
}
