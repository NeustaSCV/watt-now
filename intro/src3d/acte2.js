/* Watt Now? — intro 3D, acte II : la Grande Panne, racontée par la radio. Le thème principal naît sous les flashs.
   La ville s'éteint par quartiers ; en plein jour, les volets électriques restent fermés ; le frigo demande une mise
   à jour ; la nuit, sur un banc, un écran de téléphone attire ceux qui ne pensent plus : les Éteints. */

import { THREE } from '../vendor/rendu-jeu.js';
import { civil, eteint, cadrer, cles, epaule, TENUES_ABONDANCE, PEAUX, CHEVEUX } from './acteurs.js';
import { lisse, materiau, boite, cyl, boule, maille, ciel, sol, herbe, particules, aleatoire, eclairage } from './decors.js';
import { ecranFrigo, ecranTelephone } from './textures.js';
import { telephone, drone } from './programmes.js';
import { COUPURE, NAISSANCE, CHARBONNIERS } from '../src/temps.js';

const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const doux = (k) => k * k * (3 - 2 * k);

/* ---------------------------------------------------------------------- 1. La ville s'éteint, quartier par quartier */
const ville = {
  debut: NAISSANCE - 1.2, fin: NAISSANCE + 7.4, preparer: 2,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.5, 2000);
    const leCiel = ciel(scene, 0x070b16, 0x1c2238, 0x05070c, { etoiles: 0 });
    scene.fog = new THREE.FogExp2(0x0b1020, 0.0028);
    scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x05060a, 0.4));
    const lune = new THREE.DirectionalLight(0x8fa8ff, 0.5); lune.position.set(-200, 160, -300); scene.add(lune);
    boite(scene, 2000, 1, 2000, materiau(0x0d111c), 0, -0.5, 0);
    // la ville : des immeubles, et leurs fenêtres (une instance par fenêtre), rangées par quartier
    const a = aleatoire(5);
    const quartiers = 6;
    const matsFen = Array.from({ length: quartiers }, () => new THREE.MeshBasicMaterial({ color: 0xffd98a }));
    const matsFenFroid = Array.from({ length: quartiers }, () => new THREE.MeshBasicMaterial({ color: 0xbfe3ff }));
    const fenetres = Array.from({ length: quartiers }, () => ({ chaud: [], froid: [] }));
    const lampadaires = Array.from({ length: quartiers }, () => []);
    const immeuble = new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.9, flatShading: true });
    const geoImm = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const imm = [];
    for (let gx = -14; gx <= 14; gx++) {
      for (let gz = -16; gz <= 2; gz++) {
        if (a() < 0.18) continue;
        const x = gx * 22 + (a() - 0.5) * 6, z = gz * 22 + (a() - 0.5) * 6 - 80;
        const w = 9 + a() * 9, d = 9 + a() * 9;
        const centre = Math.max(0, 1 - Math.hypot(gx, gz + 7) / 12);
        const h = 8 + a() * 18 + centre * centre * 70 * a();
        imm.push([x, z, w, d, h]);
        const q = Math.min(quartiers - 1, Math.max(0, Math.floor(((gx + 14) / 29) * quartiers)));
        for (const face of [0, 1, 2, 3]) {
          const larg = face % 2 ? d : w;
          for (let fy = 3; fy < h - 2; fy += 3.2) for (let fx = -larg / 2 + 1.5; fx < larg / 2 - 1; fx += 2.6) {
            if (a() < 0.45) continue;
            const m = new THREE.Matrix4();
            const r = (face * Math.PI) / 2;
            const off = new THREE.Vector3(fx, fy, (face % 2 ? w : d) / 2 + 0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), r);
            m.compose(new THREE.Vector3(x + off.x, off.y, z + off.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r), new THREE.Vector3(1, 1, 1));
            (a() < 0.25 ? fenetres[q].froid : fenetres[q].chaud).push(m);
          }
        }
        if (a() < 0.4) lampadaires[q].push([x + w / 2 + 2, z]);
      }
    }
    const im = new THREE.InstancedMesh(geoImm, immeuble, imm.length);
    imm.forEach(([x, z, w, d, h], i) => im.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d))));
    scene.add(im);
    const geoFen = new THREE.PlaneGeometry(1.2, 1.6);
    fenetres.forEach((f, q) => {
      for (const [liste, mat] of [[f.chaud, matsFen[q]], [f.froid, matsFenFroid[q]]]) {
        if (!liste.length) continue;
        const inst = new THREE.InstancedMesh(geoFen, mat, liste.length);
        liste.forEach((m, i) => inst.setMatrixAt(i, m));
        scene.add(inst);
      }
    });
    // les lampadaires (points lumineux) et la lueur orange de la ville sur la brume
    const lamp = lampadaires.map((liste, q) => {
      const geo = new THREE.BufferGeometry().setFromPoints(liste.map(([x, z]) => new THREE.Vector3(x, 6, z)));
      const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffb86a, size: 2.4, sizeAttenuation: true }));
      scene.add(p);
      return p;
    });
    const lueur = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff9a50, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false, fog: false }));
    lueur.scale.y = 0.08; scene.add(lueur);
    const ordre = [3, 0, 5, 2, 1, 4];   // l'ordre dans lequel les quartiers tombent (en désordre, par plaques)
    return {
      scene, camera,
      maj(t) {
        const u = t - 1.2;   // 0 : début de la naissance du thème
        let allume = 0;
        ordre.forEach((q, i) => {
          const at = 1.0 + i * 0.85;
          const k = u < at ? 1 : u < at + 0.4 ? (Math.sin(u * 70 + i) > 0 ? 0.7 : 0.08) : 0;
          matsFen[q].color.setRGB(1 * k, 0.85 * k, 0.54 * k);
          matsFenFroid[q].color.setRGB(0.75 * k, 0.89 * k, 1 * k);
          lamp[q].visible = k > 0.3;
          allume += k;
        });
        const vie = allume / quartiers;
        lueur.material.opacity = 0.12 * vie;
        leCiel.material.uniforms.etoiles.value = 1.2 * (1 - vie);
        leCiel.material.uniforms.horizon.value.setRGB(0.11 * vie + 0.04, 0.13 * vie + 0.05, 0.22 * vie + 0.09);
        // la caméra : on sort par la fenêtre, on s'élève au-dessus des toits, lentement
        const pos = cles([[0, [-60, 70, 190]], [8.6, [10, 150, 140]]], t);
        cadrer(camera, pos, [0, 0, -150], 30);
        return { bloom: 0.9, bloomRayon: 0.8, bloomSeuil: 0.6, vignette: 0.55, grain: 0.06, exposition: 1.1, teinte: [0.95, 0.98, 1.08], noir: 1 - seg(t, 0, 1.0) };
      },
    };
  },
};

/* ---------------------------------------------------------------------- 2. En plein jour, les volets électriques restent fermés */
const volets = {
  debut: NAISSANCE + 7.4, fin: NAISSANCE + 12.6, preparer: 2,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 500);
    ciel(scene, 0x6fbde0, 0xe6f4f4, 0xb8b0a2, { soleil: [-0.5, 0.6, 0.6], tailleSoleil: 0.004, nuages: 0.5 });
    eclairage(scene, { ambiance: 1.0, force: 3.2, position: [-6, 9, 6], ombre: 10 });
    boite(scene, 80, 0.1, 30, materiau(0xcdbfa6), 0, -0.05, 0);
    boite(scene, 80, 0.02, 4, materiau(0x9c9486), 0, 0.01, 4.5);
    const lames = [];
    const couleurs = [0xf0d9b5, 0xcfe3d6, 0xf1c6a8, 0xe6dabd];
    for (let i = -2; i <= 2; i++) {
      const x = i * 5.2;
      const mur = materiau(couleurs[(i + 4) % 4]);
      boite(scene, 5, 5.2, 0.3, mur, x, 2.6, -1.8);
      maille(scene, new THREE.ConeGeometry(3.8, 1.6, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.55), materiau(0xb84a3a), x, 5.95, -1.8);
      boite(scene, 1.0, 2.1, 0.06, lisse(C2(i)), x - 1.5, 1.05, -1.62);
      for (const [fx, fy] of [[0.6, 1.6], [0.6, 3.9], [-1.5, 3.9]]) {
        // la fenêtre, son coffre de volet roulant, et le volet : des lames grises
        boite(scene, 1.5, 0.3, 0.32, lisse(0xd8dde4), x + fx, fy + 0.85, -1.55);
        boite(scene, 1.5, 1.5, 0.05, lisse(0x202630), x + fx, fy, -1.64);
        const v = new THREE.Group(); v.position.set(x + fx, fy + 0.7, -1.58); scene.add(v);
        for (let k = 0; k < 9; k++) boite(v, 1.42, 0.15, 0.03, lisse(0xc9cfd3, { rugosite: 0.6 }), 0, -k * 0.162 - 0.08, 0);
        lames.push({ v, i, fx, fy });
      }
    }
    // derrière le volet coincé, deux yeux qui regardent par la fente
    const yeux = new THREE.Group(); scene.add(yeux);
    for (const dx of [-0.07, 0.07]) { boule(yeux, 0.035, new THREE.MeshBasicMaterial({ color: 0xffffff }), dx, 0, 0, 10); boule(yeux, 0.016, new THREE.MeshBasicMaterial({ color: 0x2a1d15 }), dx, -0.005, 0.03, 8); }
    yeux.position.set(0.6, 1.0, -1.66);
    // un passant secoue son téléphone éteint
    const passant = civil({ genre: 'homme', coiffure: 'buzzed', peau: PEAUX[3], tenue: TENUES_ABONDANCE[4], graine: 31 });
    passant.objet.rotation.y = -Math.PI / 2;
    scene.add(passant.objet);
    passant.jouer([{ clip: 'Walk_Loop', de: 0, vitesse: 0.75 }]);
    passant.noterRepos();
    passant.accrocher(telephone(), 'hand_r', [0.02, 0.09, 0], [0, 0, 0]);
    passant.retoucher((t, a) => a.serrer('r', 0.7, { pouce: 0.5 }));
    return {
      scene, camera,
      maj(t) {
        // le volet du milieu essaie de remonter : il hoquette de quelques centimètres, puis retombe
        lames.forEach((l) => {
          if (l.i === 0 && l.fx === 0.6 && l.fy === 1.6) {
            const essai = seg(t, 1.0, 1.9) - seg(t, 2.2, 2.4);
            l.v.position.y = l.fy + 0.7 + essai * 0.16 + (t > 1.0 && t < 2.2 ? Math.sin(t * 60) * 0.008 : 0);
            yeux.visible = essai > 0.6;
          }
        });
        passant.objet.position.set(4.5 - t * 0.85, 0, 1.6);
        passant.maj(t);
        passant.atteindre('r', [passant.objet.position.x - 0.32, 1.25 + Math.sin(t * 9) * 0.05, 1.85], [passant.objet.position.x, 0.8, 2.4], 1);
        passant.regarder([passant.objet.position.x - 0.32, 1.22, 1.85], 0.7);
        const k = doux(seg(t, 0, 5.2));
        cadrer(camera, [2.4 - k * 1.6, 1.5, 6.5], [0.6 - k * 0.3, 1.8, -1.6], 30 + k * 6);
        return { bloom: 0.25, vignette: 0.45, grain: 0.05, saturation: 0.82, contraste: 1.05, teinte: [1.02, 1.0, 0.97] };
      },
    };
  },
};
function C2(i) { return [0x1f5e66, 0xc8362b, 0x3f8f6a, 0x8a5aa8, 0xc98a2e][(i + 5) % 5]; }

/* ---------------------------------------------------------------------- 3. Le frigo connecté demande une mise à jour */
const frigo = {
  debut: NAISSANCE + 12.6, fin: NAISSANCE + 17.1, preparer: 2,
  creer() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020306);
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 50);
    const tMort = 3.0;
    const ecran = ecranFrigo(tMort);
    boite(scene, 8, 0.1, 8, materiau(0x3a3f4a), 0, -0.05, 0);
    boite(scene, 8, 3, 0.1, materiau(0x4a5060), 0, 1.5, -1.2);
    boite(scene, 3, 0.9, 0.6, lisse(0xe8e2d4), -2.2, 0.45, -0.85);
    // le frigo connecté
    const f = new THREE.Group(); f.position.set(0, 0, -0.75); scene.add(f);
    boite(f, 0.85, 1.95, 0.7, lisse(0xd8dde4, { metal: 0.4, rugosite: 0.3 }), 0, 0.975, 0);
    boite(f, 0.86, 0.01, 0.71, lisse(0x2a2d34), 0, 1.3, 0);
    for (const y of [1.55, 0.75]) boite(f, 0.03, 0.4, 0.05, lisse(0x9aa0a6, { metal: 0.8 }), 0.36, y, 0.37);
    const plan = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.28), new THREE.MeshBasicMaterial({ map: ecran.texture }));
    plan.position.set(-0.05, 1.05, 0.352); f.add(plan);
    const lumEcran = new THREE.PointLight(0x5fa8ff, 4, 4, 1.6); lumEcran.position.set(-0.05, 1.05, 0.7); f.add(lumEcran);
    // le drone de livraison, tombé, éteint
    const d = drone(0xe8e2d4); d.objet.position.set(-1.2, 0.08, 0.6); d.objet.rotation.set(0.3, 0.6, 0.9); scene.add(d.objet);
    // elle, devant le frigo, un verre vide à la main
    const elle = civil({ genre: 'femme', coiffure: 'long', peau: PEAUX[0], cheveux: CHEVEUX[2], tenue: TENUES_ABONDANCE[5], graine: 41 });
    elle.objet.position.set(0.4, 0, 0.12); elle.objet.rotation.y = Math.PI + 0.7;
    scene.add(elle.objet);
    elle.jouer([{ clip: 'Idle_Loop', de: 0 }]);
    elle.noterRepos();
    const verre = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.11, 12, 1, true), lisse(0xcfe9f2, { transparent: true, opacite: 0.4, rugosite: 0.05, double: true }));
    elle.accrocher(verre, 'hand_l', [0.02, 0.07, 0.035], [Math.PI / 2, 0, 0]);   // debout dans la main (l'axe du verre suit la paume)
    const lune = new THREE.DirectionalLight(0x6f86c8, 0.25); lune.position.set(3, 4, 3); scene.add(lune);
    scene.add(new THREE.HemisphereLight(0x2a3450, 0x050608, 0.25));
    return {
      scene, camera,
      maj(t) {
        ecran.maj(t);
        const k = t < tMort - 0.4 ? 1 : t < tMort ? (Math.sin(t * 70) > 0 ? 1 : 0.15) : 0;
        lumEcran.intensity = 4 * k;
        elle.maj(t);
        elle.atteindre('r', [-0.02, 1.08, -0.33], [0.9, 1.0, 0.4], doux(seg(t, 0.3, 1.2)) * (1 - doux(seg(t, 3.3, 4.0))));   // elle tapote l'écran
        elle.atteindre('l', [0.1, 1.0, 0.06], [-0.2, 0.7, 0.75], 0.9);
        elle.regarder([-0.05, 1.05, -0.4], 0.9);
        elle.serrer('l', 0.75, { rond: 1, pouce: 0.8 });   // le verre vide
        elle.serrer('r', 0.85, { sauf: ['index'], pouce: 0.6 });   // l'index tapote l'écran
        const s = epaule(t, 0.5);
        cadrer(camera, [-1.15 + s[0] + t * 0.06, 1.42 + s[1], 1.45 - t * 0.08], [0.25, 1.1, -0.3], 30);
        return { bloom: 0.7, bloomSeuil: 0.7, vignette: 0.55, grain: 0.07, exposition: 1.15, teinte: [0.92, 0.97, 1.1], noir: seg(t, 3.2, 4.4) * 0.6 };
      },
    };
  },
};

/* ---------------------------------------------------------------------- 4. Le banc, la nuit : un écran allumé, et ceux qui viennent */
const banc = {
  debut: NAISSANCE + 17.1, fin: CHARBONNIERS, preparer: 2,
  creer() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070d);
    scene.fog = new THREE.FogExp2(0x101828, 0.085);
    scene.background = new THREE.Color(0x101828);
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 80);
    const tFaible = 7.0, tMort = 8.2;
    const ecran = ecranTelephone(tFaible, tMort);
    boite(scene, 60, 0.1, 60, materiau(0x1a1f2a), 0, -0.05, 0);
    boite(scene, 60, 0.12, 2.4, materiau(0x2a303c), 0, 0.01, -0.6);
    // le banc, le lampadaire mort, une poubelle connectée
    const b = new THREE.Group(); b.position.set(0, 0, -0.9); scene.add(b);
    const bois = materiau(0x5a4130), fonte = lisse(0x1a1d22, { rugosite: 0.6 });
    for (let k = 0; k < 3; k++) boite(b, 1.7, 0.04, 0.12, bois, 0, 0.45, -0.14 + k * 0.14);
    for (let k = 0; k < 2; k++) boite(b, 1.7, 0.1, 0.03, bois, 0, 0.62 + k * 0.16, -0.26, -0.2, 0, 0);
    for (const x of [-0.75, 0.75]) { boite(b, 0.05, 0.45, 0.4, fonte, x, 0.22, -0.05); boite(b, 0.05, 0.45, 0.05, fonte, x, 0.68, -0.27, -0.2, 0, 0); }
    cyl(scene, 0.06, 0.08, 4.2, fonte, 1.6, 2.1, -1.4, 0, 0, 0, 8);
    boite(scene, 0.6, 0.12, 0.25, fonte, 1.35, 4.15, -1.4);
    boite(scene, 0.4, 0.04, 0.2, lisse(0x2a2d34, { emission: 0x000000 }), 1.25, 4.08, -1.4);
    cyl(scene, 0.22, 0.2, 0.8, lisse(0x3f8f6a, { rugosite: 0.4 }), -1.4, 0.4, -1.2, 0, 0, 0, 16);
    // lui, sur le banc, le visage éclairé par son téléphone
    const lui = civil({ genre: 'homme', coiffure: 'simpleparted', peau: PEAUX[2], cheveux: CHEVEUX[0], tenue: TENUES_ABONDANCE[3], graine: 51 });
    lui.objet.position.set(0.1, 0.0, -0.78);
    scene.add(lui.objet);
    lui.jouer([{ clip: 'Sitting_Idle_Loop', de: 0, vitesse: 0.7 }]);
    lui.noterRepos();
    const tel = lui.accrocher(telephone(ecran.texture), 'hand_r', [0.02, 0.09, 0.0], [0, 0, 0]);
    void tel;
    const lumTel = new THREE.PointLight(0x9fd0ff, 3.5, 3.5, 1.6); scene.add(lumTel);
    // les Éteints, dans la brume, qui viennent vers la lumière
    const ombres = [];
    const departs = [[-4.8, -6.0], [-2.4, -8.0], [3.6, -6.8], [5.6, -3.6], [0.8, -9.5], [-6.6, -2.8]];
    departs.forEach(([x, z], i) => {
      const e = eteint({ graine: i + 3 });
      e.objet.position.set(x, 0, z);
      scene.add(e.objet);
      e.jouer([{ clip: 'Zombie_Walk_Fwd_Loop', de: 0, depuis: i * 0.37, vitesse: 0.85 }]);
      e.noterRepos();
      ombres.push({ e, x, z, debut: 0.4 + i * 0.55 });
    });
    scene.add(new THREE.HemisphereLight(0x2a3a5a, 0x050608, 0.3));
    const lune = new THREE.DirectionalLight(0x7f94c8, 0.35); lune.position.set(-4, 6, 2); scene.add(lune);
    return {
      scene, camera,
      maj(t) {
        ecran.maj(t);
        const mort = t >= tMort;
        const clign = t > tFaible && !mort ? (Math.sin(t * 30) > 0 ? 1 : 0.35) : mort ? 0 : 1;
        lui.maj(t);
        lui.atteindre('r', [0.12, 0.95, -0.42], [0.6, 0.55, -0.6], 1);
        lui.atteindre('l', [0.04, 0.9, -0.44], [-0.5, 0.55, -0.6], 0.6);
        lui.serrer('r', 0.7, { pouce: 0.4 });
        lui.serrer('l', 0.45, { sauf: ['index'] });
        lui.regarder(t < 5.6 ? [0.12, 0.95, -0.42] : [-2.5, 1.5, -4], t < 5.6 ? 0.9 : 0.8 * doux(seg(t, 5.6, 6.3)));
        lui.objet.updateMatrixWorld(true);
        const pTel = lui.ou('hand_r');
        lumTel.position.set(pTel.x, pTel.y + 0.1, pTel.z + 0.15);
        lumTel.intensity = 3.5 * clign;
        ombres.forEach(({ e, x, z, debut }) => {
          const dist = Math.hypot(0.1 - x, -0.9 - z);
          const k = Math.min(dist - 1.6, Math.max(0, t - debut) * 0.5);
          const dir = new THREE.Vector2(0.1 - x, -0.9 - z).normalize();
          e.objet.position.set(x + dir.x * k, 0, z + dir.y * k);
          e.objet.rotation.y = Math.atan2(dir.x, dir.y);
          e.maj(t);
          // la tête tendue vers la lumière
          e.regarder([pTel.x, pTel.y, pTel.z], 0.6);
          if (e.lueur) e.lueur.material.opacity = 0.9;
        });
        const pos = cles([[0, [1.3, 1.15, 2.6]], [5.0, [0.75, 1.05, 1.5]], [9.6, [0.45, 1.0, 0.75]]], t);
        cadrer(camera, pos, [0.0, 0.95, -1.4], cles([[0, 30], [9.6, 40]], t));
        return { bloom: 0.55, bloomSeuil: 0.75, vignette: 0.6, grain: 0.08, exposition: 1.25, teinte: [0.9, 0.97, 1.12], noir: seg(t, tMort + 0.05, tMort + 0.12) * 0.92 + seg(t, tMort + 0.6, tMort + 1.4) * 0.08 };
      },
    };
  },
};

export const PLANS_ACTE2 = [ville, volets, frigo, banc];

export const CARTONS_ACTE2 = [
  [COUPURE + 1.6, NAISSANCE - 0.3, 'Ce soir-là, l\'écran s\'est éteint. Pour la première fois, personne n\'a su quoi faire.', 'recit'],
  [NAISSANCE + 0.6, NAISSANCE + 3.8, 'Flash spécial : coupure de courant. Gardez votre calme et filmez avec vos téléphones.', 'radio'],
  [NAISSANCE + 3.9, NAISSANCE + 7.1, 'Le réseau sera rétabli très vite. Une notification vous préviendra.', 'radio'],
  [NAISSANCE + 7.6, NAISSANCE + 12.3, 'N\'ouvrez pas vos volets à la main. Attendez la mise à jour.', 'radio'],
  [NAISSANCE + 12.9, NAISSANCE + 16.8, 'Votre réfrigérateur ne commandera plus le lait. Il va falloir le traire vous-même.', 'radio'],
  [NAISSANCE + 17.5, NAISSANCE + 20.6, 'Fièvre grise : évitez les malades. Ils sont attirés par le bruit et la lumière. Éteignez vos écrans. (Si vous savez comment.)', 'radio'],
  [NAISSANCE + 20.8, NAISSANCE + 22.7, 'On les appelle les Éteints. Comme leurs téléphones. Comme eux, avant.', 'radio'],
];
