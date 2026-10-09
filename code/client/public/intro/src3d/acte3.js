/* Watt Now? — intro 3D, acte III : ceux qui savaient encore faire. Un bloc du thème principal par famille.
   Chaque scène répond à un gag de la télé : on souffle soi-même sur la braise (le Souffle-Soupe), on rebranche
   soi-même (le perron mécanique, le fauteuil), on fait tourner la roue soi-même sous la pluie (les arroseurs), on
   cueille sa pomme (la pomme livrée). Les personnages, la forge, le banc de recharge, le pédalier, le récupérateur
   de pluie et le feu sont ceux du jeu. Chaque famille a sa lumière (Book 18 §2). */

import { THREE, FeuDeCamp, VueInstallation, VueRessource, Panache } from '../vendor/rendu-jeu.js';
import { familial, cadrer, cles, epaule } from './acteurs.js';
import { kenney } from './kenney.js';
import { lisse, materiau, boite, cyl, boule, maille, ciel, sol, herbe, particules, etincelles, fumee, pluie, lumiereFeu, aleatoire, pommierCinema } from './decors.js';
import { MESURE, CHARBONNIERS, VOLTAIQUES, MECANISTES, ENSEMBLE } from '../src/temps.js';

const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const doux = (k) => k * k * (3 - 2 * k);

/** Une nuit de campagne : ciel étoilé, sol, herbe, brume légère. */
function nuitDehors(scene, o = {}) {
  ciel(scene, 0x060a14, o.horizon ?? 0x1a2236, 0x05070c, { etoiles: o.etoiles ?? 1.0 });
  scene.fog = new THREE.FogExp2(o.brume ?? 0x0d1322, o.densite ?? 0.045);
  scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x0a0806, o.ambiance ?? 0.35));
  const lune = new THREE.DirectionalLight(0x8fa8ff, o.lune ?? 0.45); lune.position.set(-6, 9, -5); lune.castShadow = true; lune.shadow.mapSize.set(1024, 1024); scene.add(lune);
  sol(scene, o.sol ?? 0x2f3a28, 60);
  herbe(scene, o.herbes ?? 1400, 9, [0x3f5530, 0x4a5a34, 0x33452a], 21, [0, 0], 0.28, o.exclure ?? 1.4);
}

/** Une enclume : table, corne, pied. */
function enclume() {
  const g = new THREE.Group();
  const acier = lisse(0x3a3d44, { metal: 0.7, rugosite: 0.45 });
  boite(g, 0.5, 0.12, 0.18, acier, 0, 0.6, 0);
  maille(g, new THREE.ConeGeometry(0.08, 0.3, 10).rotateZ(-Math.PI / 2), acier, 0.38, 0.62, 0);
  boite(g, 0.22, 0.24, 0.14, acier, 0, 0.42, 0);
  boite(g, 0.36, 0.1, 0.26, acier, 0, 0.26, 0);
  cyl(g, 0.22, 0.26, 0.24, materiau(0x5a4130), 0, 0.1, 0, 0, 0, 0, 10);
  return g;
}

/* ====================================================================== 🔥 1. La braise : on souffle soi-même */
const braise = {
  debut: CHARBONNIERS - 0.4, fin: CHARBONNIERS + 7.6, preparer: 2.5,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.03, 120);
    nuitDehors(scene, { ambiance: 0.12, lune: 0.15, etoiles: 0.6, densite: 0.06 });
    const feu = new FeuDeCamp({ id: 3, x: 0, z: 0, bois: 3, aspect: 'braises' });
    scene.add(feu.objet);
    const lum = lumiereFeu(scene, 0.05, 0.25, 0.05, 7, 5);
    const nadia = familial('charbonniers');
    nadia.objet.position.set(-0.05, 0, -0.62);
    scene.add(nadia.objet);
    nadia.jouer([{ clip: 'Crouch_Idle_Loop', de: 0, vitesse: 0.6 }]);
    nadia.noterRepos();
    const souffles = [1.6, 3.4, 5.1];
    // l'air qui sort des lèvres, les braises qui s'envolent
    let bouche = new THREE.Vector3();
    const air = particules(scene, 40, (i, t, [a, b, c]) => {
      const actif = souffles.find((s) => t > s && t < s + 0.9);
      if (!actif) return [0, -100, 0, 0, 0];
      const age = ((t - actif) * 1.6 + a) % 1;
      const vers = new THREE.Vector3(0, 0.12, 0).sub(bouche);
      return [bouche.x + vers.x * age + (b - 0.5) * 0.04, bouche.y + vers.y * age + (c - 0.5) * 0.04, bouche.z + vers.z * age, 0.015 + age * 0.03, (1 - age) * 0.35];
    }, { couleur: 0xffe7c4, echelle: 500 });
    let dernier = -10;
    const sp = particules(scene, 40, (i, t, [a, b, c, d]) => {
      const u = (t - dernier - 0.2) * (0.6 + d * 0.6);
      if (u < 0 || u > 1.6) return [0, -100, 0, 0, 0];
      return [(a - 0.5) * 0.3 + Math.sin(u * 4 + c * 6) * 0.05, 0.1 + u * (0.6 + b * 0.6), (c - 0.5) * 0.3, 0.012, 1 - u / 1.6];
    }, { couleur: 0xffb050, additif: true, echelle: 900, toneMapped: false });
    let aspect = 'braises';
    return {
      scene, camera,
      maj(t, dt) {
        let force = 0.25;
        souffles.forEach((s, i) => { const k = seg(t, s, s + 0.4) * (1 - seg(t, s + 0.9, s + 1.7)); force += k * (0.45 + i * 0.15); if (t >= s) dernier = s; });
        const prise = seg(t, 5.7, 6.6);
        force = Math.min(1.5, force + prise * 1.2);
        if (prise > 0.05 && aspect !== 'flammes') { aspect = 'flammes'; feu.mettreAJourEtat({ id: 3, x: 0, z: 0, bois: 3, aspect: 'flammes' }); }
        feu.animer(dt, 1);
        lum.maj(t, 0.25 + force * 0.9);
        nadia.maj(t);
        // elle se penche, approche les lèvres de la braise, souffle ; puis se redresse quand la flamme prend
        const penche = doux(seg(t, 0.6, 1.4)) * (1 - doux(seg(t, 6.0, 7.0)));
        const P = [30, 30, 20, 0.2];
        nadia.tourner('spine_01', penche * P[0], 0, 0);
        nadia.tourner('spine_02', penche * P[1], 0, 0);
        nadia.tourner('spine_03', penche * P[2], 0, 0);
        nadia.objet.position.y = -penche * P[3];
        nadia.regarder([0, 0.08, 0], 0.9);
        const tete = nadia.ou('Head');
        bouche = new THREE.Vector3(tete.x, tete.y - 0.06, tete.z + 0.12);
        air.maj(t); sp.maj(t);
        // la caméra : au ras du sol, de profil, le visage éclairé par en dessous
        const pos = cles([[0, [1.55, 0.42, 0.42]], [5.5, [1.2, 0.45, 0.2]], [8, [1.7, 0.78, 0.7]]], t);
        cadrer(camera, pos, [-0.02, cles([[0, 0.36], [5.5, 0.42], [8, 0.7]], t), -0.2], cles([[0, 42], [5.5, 52], [8, 35]], t));
        return { bloom: 0.5, bloomSeuil: 0.85, bloomRayon: 0.6, vignette: 0.6, grain: 0.07, exposition: 0.95, teinte: [1.08, 0.98, 0.9], noir: 1 - seg(t, 0.3, 1.4), nette: camera.position.distanceTo(tete), ouverture: 0.004 };
      },
    };
  },
};

/* ====================================================================== 🔥 2. La forge, la nuit : le marteau tombe sur le temps */
const forge = {
  debut: CHARBONNIERS + 7.6, fin: VOLTAIQUES, preparer: 2.5,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 160);
    nuitDehors(scene, { exclure: 3 });
    // le foyer du jeu, la forge du jeu, une enclume, un mur en ruine derrière
    const instal = new VueInstallation({ id: 9, type: 'forge', x: -1.3, z: -0.9, o: 0.5, etat: {} });
    scene.add(instal.objet);
    const feu = new FeuDeCamp({ id: 4, x: -1.25, z: -0.75, bois: 4, aspect: 'flammes' });
    feu.objet.scale.setScalar(0.8);
    scene.add(feu.objet);
    const lumFeu = lumiereFeu(scene, -1.0, 0.9, -0.4, 12, 10);
    const enc = enclume(); enc.position.set(0.15, 0, 0.0); enc.rotation.y = 0.3; scene.add(enc);
    // le tonneau de trempe, à portée de pince (Kenney, CC0)
    const tonneau = kenney('barrel-open', 0.78); tonneau.position.set(1.05, 0, -1.0); tonneau.rotation.y = 0.4; scene.add(tonneau);
    const fer = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.04), new THREE.MeshBasicMaterial({ color: 0xff8a3a }));
    fer.position.set(0.12, 0.675, 0.02); fer.rotation.y = 0.3; scene.add(fer);
    const lumFer = new THREE.PointLight(0xff8a3a, 2, 2, 2); lumFer.position.set(0.12, 0.75, 0.05); scene.add(lumFer);
    const pierre = materiau(0x6b6158);
    for (let i = 0; i < 6; i++) boite(scene, 0.9, 0.5 + (i % 3) * 0.6, 0.4, pierre, -3 + i * 0.85, 0.4 + (i % 3) * 0.3, -2.6, 0, 0.05 * i, 0);
    const nadia = familial('charbonniers');
    nadia.objet.position.set(0.14, 0, -0.33); nadia.objet.rotation.y = 0.1;
    scene.add(nadia.objet);
    nadia.tenir('marteau');
    nadia.jouer([{ clip: 'Idle_Loop', de: 0, vitesse: 0.5 }]);
    nadia.noterRepos();
    // la pince de forge, en main gauche : deux mors serrés sur le bout du fer, deux longues branches
    const pince = new THREE.Group();
    const acierNoir = lisse(0x24252a, { metal: 0.8, rugosite: 0.5 });
    for (const c of [-1, 1]) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.42, 12).rotateX(Math.PI / 2).translate(0, 0, -0.21), acierNoir);
      br.position.x = c * 0.008; br.rotation.y = -c * 0.03; br.castShadow = true; pince.add(br);
      const mors = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.07), acierNoir);
      mors.position.set(c * 0.012, 0, -0.44); pince.add(mors);
    }
    boule(pince, 0.012, acierNoir, 0, 0, -0.39, 16);
    scene.add(pince);
    const boutFer = new THREE.Vector3(0.27, 0.675, -0.03);   // le bout du fer côté gauche de Nadia (+x : elle regarde vers +z), dans la pince
    const periode = MESURE / 2;   // un coup toutes les deux pulsations, sur le temps
    const coup = (T) => ((T - CHARBONNIERS) % periode + periode) % periode;
    const sp = etincelles(scene, 0.12, 0.69, 0.02, (x) => x, 80);
    const smoke = fumee(scene, -1.35, 2.2, -1.0, { n: 36, hauteur: 7, taille: 3, opacite: 0.22, couleur: 0x6a6570 });
    let Tcourant = 0;
    sp.objet.onBeforeRender = () => {};
    return {
      scene, camera,
      maj(t, dt, T) {
        Tcourant = T;
        feu.animer(dt, 1);
        lumFeu.maj(t);
        nadia.maj(t);
        // le marteau : levé, tenu, puis abattu sur le fer, juste sur le temps ; le buste accompagne le geste
        const u = coup(T) / periode;           // 0 : l'impact
        const leve = u < 0.18 ? doux(u / 0.18) : u < 0.7 ? 1 : 1 - Math.pow((u - 0.7) / 0.3, 2.2);   // l'abattu accélère
        const rebond = u < 0.06 ? Math.sin(u / 0.06 * Math.PI) * 0.12 : 0;
        const h = Math.min(1, leve + rebond);
        const rien = (1 - h);
        nadia.tourner('spine_01', 6 * rien - 4 * h, 0, 0);
        nadia.tourner('spine_02', 10 * rien - 6 * h, -4 * h, 0);
        nadia.tourner('spine_03', 6 * rien, -6 * h, 0);
        // (elle regarde vers +z : sa droite est côté −x) le marteau à droite, au-dessus du milieu du fer ; le coude part en dehors
        nadia.atteindre('r', [0.07 - h * 0.05, 0.8 + h * 0.66, -0.12 - h * 0.3], [-0.7, 0.9, -1.0], 1);
        // la main gauche tient la pince ; elle tourne un peu le fer entre deux coups
        const main = new THREE.Vector3(0.46, 0.88, -0.2 + Math.sin(T * 1.1) * 0.01);
        nadia.atteindre('l', main.toArray(), [1.0, 0.6, -0.8], 1);
        nadia.serrer('r', 0.95, { pouce: 0.9 });
        nadia.serrer('l', 0.85, { pouce: 0.8 });
        const prise = nadia.ou('hand_l').add(new THREE.Vector3(-0.02, -0.02, 0.05));
        pince.position.copy(prise);
        pince.lookAt(prise.clone().add(prise.clone().sub(boutFer)));
        nadia.regarder([0.12, 0.68, 0.02], 0.85);
        const depuis = coup(T);
        sp.maj(depuis);
        smoke.maj(t);
        const eclat = 1 - seg(depuis, 0, 0.35);
        lumFer.intensity = 2 + eclat * 6;
        // la caméra : un lent travelling circulaire autour de la forge
        // la caméra : un lent travelling circulaire autour de l'enclume, à hauteur de poitrine
        const a = 0.95 - t * 0.045;
        cadrer(camera, [Math.sin(a) * 2.3 + 0.05, 1.3 + t * 0.012, Math.cos(a) * 2.3 - 0.3], [-0.05, 0.98, -0.35], 34);
        void Tcourant;
        return { bloom: 0.55, bloomSeuil: 0.85, vignette: 0.55, grain: 0.06, exposition: 1.0, teinte: [1.06, 0.98, 0.92], nette: camera.position.distanceTo(nadia.ou('Head')), ouverture: 0.0018 };
      },
    };
  },
};

/* ====================================================================== ⚡ 3. Le banc de recharge : on rebranche soi-même */
const recharge = {
  debut: VOLTAIQUES, fin: VOLTAIQUES + 11.4, preparer: 2.5,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.03, 160);
    nuitDehors(scene, { ambiance: 0.32, lune: 0.6, exclure: 2.2 });
    const banc = new VueInstallation({ id: 11, type: 'banc_recharge', x: 0, z: 0, o: 0, etat: { batteries: {} } });
    scene.add(banc.objet);
    const batterie = new VueRessource({ id: 12, type: 'batterie_voiture', x: 0.9, z: 0.35, disponible: true });
    scene.add(batterie.objet);
    // les bornes de la batterie (posée dans l'herbe, face avant vers +z) : rouge à gauche, noire à droite
    const borneRouge = new THREE.Vector3(0.78, 0.25, 0.3), borneNoire = new THREE.Vector3(1.02, 0.25, 0.3);
    const malik = familial('voltaiques');
    malik.objet.position.set(0.88, 0, 0.8); malik.objet.rotation.y = Math.PI + 0.12;
    scene.add(malik.objet);
    malik.jouer([{ clip: 'Fixing_Kneeling', de: 0, vitesse: 0.35, plage: [0.22, 0.62] }]);
    malik.noterRepos();
    // la pince crocodile rouge : manche gainé, mâchoires d'acier, ressort ; une noire est déjà mordue sur la borne −
    const pinceCroco = (couleur) => {
      const g = new THREE.Group();
      const gaine = lisse(couleur, { rugosite: 0.5 }), acier = lisse(0x9a9ca2, { metal: 0.9, rugosite: 0.3 });
      for (const c of [-1, 1]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.01, 0.06), gaine); m.position.set(0, c * 0.009, 0.03); m.rotation.x = c * 0.12; g.add(m);
        const j = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.004, 0.045), acier); j.position.set(0, c * 0.006, -0.02); j.rotation.x = -c * 0.1; g.add(j);
      }
      cyl(g, 0.006, 0.006, 0.026, acier, 0, 0, 0.005, 0, 0, Math.PI / 2, 16);
      g.traverse((n) => { if (n.isMesh) n.castShadow = true; });
      return g;
    };
    const croco = pinceCroco(0xc8362b); scene.add(croco);
    const crocoNoir = pinceCroco(0x2b2b2b); crocoNoir.position.copy(borneNoire).add(new THREE.Vector3(0, 0.03, 0.01)); crocoNoir.rotation.set(-1.1, 0.2, 0); scene.add(crocoNoir);
    // les câbles : du banc à la pince, en chaînette qui traîne dans l'herbe ; refaits à chaque image
    const depart = [new THREE.Vector3(0.45, 0.62, 0.08), new THREE.Vector3(0.47, 0.62, 0.1)];
    const gaines = [lisse(0xc8362b, { rugosite: 0.55 }), lisse(0x222222, { rugosite: 0.55 })];
    const cables = gaines.map((m) => { const c = new THREE.Mesh(new THREE.BufferGeometry(), m); c.castShadow = true; scene.add(c); return c; });
    const tirer = (c, a, b) => {
      const mi = a.clone().lerp(b, 0.5); mi.y = 0.015;
      const courbe = new THREE.CatmullRomCurve3([a, a.clone().lerp(mi, 0.45).setY(0.2), mi, b.clone().lerp(mi, 0.4).setY(0.04), b.clone().add(new THREE.Vector3(0, 0, 0.04))]);
      c.geometry.dispose(); c.geometry = new THREE.TubeGeometry(courbe, 48, 0.006, 8);
    };
    tirer(cables[1], depart[1], crocoNoir.position.clone());
    // la lampe frontale : un projecteur blanc froid accroché à la tête (les mains sont tout près : on la garde douce)
    const lampe = new THREE.SpotLight(0xeef6ff, 4.5, 7, 0.42, 0.7, 1.4);
    lampe.castShadow = true; lampe.shadow.mapSize.set(1024, 1024);
    scene.add(lampe, lampe.target);
    // la lumière que la batterie éclairée renvoie sur son visage
    const rebond = new THREE.PointLight(0xcfe0ff, 1.6, 2.5, 1.5); scene.add(rebond);
    const sp = etincelles(scene, borneRouge.x, borneRouge.y + 0.02, borneRouge.z, (x) => x, 70, { couleur: 0xcfe8ff });
    const eclair = new THREE.PointLight(0xcfe8ff, 0, 4, 1.6); eclair.position.copy(borneRouge).add(new THREE.Vector3(0, 0.06, 0.04)); scene.add(eclair);
    let branche = false;
    const CONTACT = 7.6;
    return {
      scene, camera,
      maj(t) {
        malik.maj(t);
        // la main gauche approche la pince de la borne rouge, hésite, mord ; puis la lâche et se retire
        const approche = doux(seg(t, 2.6, 7.2)), mord = seg(t, 7.2, CONTACT), retire = doux(seg(t, 8.4, 9.6));
        const loin = new THREE.Vector3(0.72, 0.48, 0.55), dessus = borneRouge.clone().add(new THREE.Vector3(0.01, 0.12, 0.08));
        const posePince = borneRouge.clone().add(new THREE.Vector3(0, 0.035, 0.012));
        const main = loin.clone().lerp(dessus, approche).lerp(posePince.clone().add(new THREE.Vector3(0.0, 0.05, 0.05)), mord);
        main.y += Math.sin(t * 2.3) * 0.006 * (1 - mord);
        if (t > CONTACT + 0.8) main.lerp(new THREE.Vector3(0.7, 0.45, 0.6), retire);
        malik.atteindre('l', main.toArray(), [0.1, 0.3, 1.1], 1);
        // la main droite tient la batterie par son coin
        malik.atteindre('r', [1.05, 0.23, 0.42], [1.6, 0.4, 1.1], 1);
        malik.serrer('l', t < CONTACT + 0.8 ? 0.9 : 0.35 * (1 - retire) + 0.2, { pouce: 0.9 });
        malik.serrer('r', 0.45, { rond: 0.5 });
        const tenue = t < CONTACT + 0.8;
        if (tenue) {
          const h = malik.ou('hand_l');
          croco.position.copy(h).lerp(posePince, t >= CONTACT ? 1 : 0.2 + 0.8 * mord * mord);
          croco.lookAt(croco.position.clone().add(croco.position.clone().sub(borneRouge).setY(0.12).normalize()));
        } else { croco.position.copy(posePince); croco.rotation.set(-1.15, -0.15, 0); }
        tirer(cables[0], depart[0], croco.position.clone());
        malik.regarder(borneRouge.toArray(), 0.85);
        // le faisceau suit la tête
        const tete = malik.ou('Head');
        lampe.position.copy(tete).add(new THREE.Vector3(0, 0.08, -0.05));
        lampe.target.position.copy(borneRouge);
        rebond.position.copy(tete).lerp(borneRouge, 0.6);
        // la connexion : un éclair, des étincelles bleues, et le voyant du banc passe au vert
        const u = t - CONTACT;
        sp.maj(u);
        eclair.intensity = u > 0 && u < 0.5 ? (1 - u / 0.5) * 5 * (0.6 + 0.4 * Math.sin(u * 90)) : 0;
        if (t > CONTACT + 0.1 && !branche) { branche = true; banc.majEtat({ id: 11, type: 'banc_recharge', x: 0, z: 0, o: 0, etat: { batteries: { petite_batterie: 1 } } }); }
        // la caméra : basse, de trois quarts face à lui, côté droit de la batterie ; on se rapproche des mains jusqu'au contact
        const s = epaule(t, 0.5);
        const pos = cles([[0, [2.3, 1.15, -0.85]], [6.5, [1.7, 0.8, -0.32]], [11.4, [1.55, 0.74, -0.22]]], t);
        const vise = cles([[0, [0.85, 0.58, 0.55]], [6.5, [0.84, 0.46, 0.45]], [11.4, [0.84, 0.56, 0.5]]], t);
        cadrer(camera, [pos[0] + s[0], pos[1] + s[1], pos[2] + s[2]], vise, cles([[0, 30], [11.4, 34]], t));
        return { bloom: 0.55, bloomSeuil: 0.8, vignette: 0.55, grain: 0.07, exposition: 1.5, teinte: [0.94, 0.98, 1.08], blanc: u > 0 && u < 0.1 ? 0.1 : 0, nette: camera.position.distanceTo(malik.ou('hand_l')), ouverture: 0.002 };
      },
    };
  },
};

/* ====================================================================== ⚡ 4. L'abri s'allume ; il éteint sa frontale ; le silence */
const ampoule = {
  debut: VOLTAIQUES + 11.4, fin: MECANISTES, preparer: 2.5,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 200);
    nuitDehors(scene, { ambiance: 0.2, lune: 0.3, exclure: 3.2, etoiles: 1.3 });
    const abri = new VueInstallation({ id: 13, type: 'abri', x: 0, z: -0.6, o: 0, etat: {} });
    scene.add(abri.objet);
    const panneau = new VueInstallation({ id: 14, type: 'panneau_solaire', x: 2.0, z: -0.4, o: 0, etat: {} });
    scene.add(panneau.objet);
    const banc = new VueInstallation({ id: 15, type: 'banc_recharge', x: 1.4, z: 0.6, o: -0.6, etat: { batteries: { petite_batterie: 1 } } });
    scene.add(banc.objet);
    // l'ampoule, suspendue sous l'abri : blanc froid (Book 18 §2)
    const fil = cyl(scene, 0.004, 0.004, 0.5, lisse(0x1a1a1a), 0, 1.55, -0.6, 0, 0, 0, 4);
    void fil;
    const verre = new THREE.MeshBasicMaterial({ color: 0x222222 });
    boule(scene, 0.05, verre, 0, 1.28, -0.6, 12);
    const lumAmp = new THREE.PointLight(0xeef6ff, 0, 12, 1.1); lumAmp.position.set(0, 1.25, -0.6); lumAmp.castShadow = true; lumAmp.shadow.mapSize.set(1024, 1024); scene.add(lumAmp);
    const malik = familial('voltaiques');
    malik.objet.position.set(0.6, 0, 1.4); malik.objet.rotation.y = Math.PI + 0.35;
    scene.add(malik.objet);
    malik.jouer([{ clip: 'Idle_Loop', de: 0, vitesse: 0.6 }]);
    malik.noterRepos();
    const lampe = new THREE.SpotLight(0xeef6ff, 9, 7, 0.38, 0.6, 1.4); scene.add(lampe, lampe.target);
    const faisceau = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.6, 24, 1, true).translate(0, -1.3, 0).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xdfeeff, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    faisceau.visible = false;   // le faisceau se lit par sa lumière et le halo de la lampe, pas par un cône
    scene.add(faisceau);
    return {
      scene, camera,
      maj(t) {
        malik.maj(t);
        // l'ampoule clignote, puis tient ; quelques secondes plus tard, il éteint sa frontale (on n'attire personne)
        const allume = t < 1.2 ? 0 : t < 1.7 ? (Math.sin(t * 60) > 0 ? 1 : 0.2) : 1;
        lumAmp.intensity = 7 * allume;
        verre.color.setScalar(0.15 + allume * 0.9);
        const frontale = t < 5.8 ? 1 : 0;
        lampe.intensity = 9 * frontale;
        if (t > 5.4 && t < 6.2) malik.atteindre('r', malik.ou('Head').add(new THREE.Vector3(0.06, 0.08, -0.08)).toArray(), [1.2, 1.4, 2.0], doux(seg(t, 5.4, 5.7)) * (1 - doux(seg(t, 5.9, 6.2))));
        malik.regarder(t < 7 ? [0, 1.25, -0.6] : [-6, 6, -20], 0.8);
        const tete = malik.ou('Head');
        lampe.position.copy(tete).add(new THREE.Vector3(0, 0.08, -0.06)); lampe.target.position.set(0, 1.0, -0.6);
        faisceau.position.copy(lampe.position); faisceau.lookAt(lampe.target.position);
        // la caméra : on recule, on s'élève : l'abri, seul point de lumière dans la nuit
        // de face : son visage dans la lumière blanche de l'ampoule ; puis on s'élève, l'abri seul allumé dans la nuit
        const pos = cles([[0, [1.9, 1.35, 0.05]], [6.0, [2.3, 1.7, -0.3]], [11.5, [4.8, 4.6, -5.5]]], t);
        const vise = cles([[0, [0.55, 1.45, 1.35]], [6.0, [0.4, 1.25, 0.6]], [11.5, [0.2, 0.8, 0.2]]], t);
        cadrer(camera, pos, vise, cles([[0, 42], [6.0, 32], [11.5, 26]], t));
        return { bloom: 0.45, bloomSeuil: 0.88, vignette: 0.55, grain: 0.06, exposition: 1.3, teinte: [0.93, 0.98, 1.1] };
      },
    };
  },
};

/* ====================================================================== ⚙️ 5. Avant l'aube, sous la pluie : le pédalier, la lanterne, le récupérateur */
const pedalier = {
  debut: MECANISTES, fin: MECANISTES + 11.4, preparer: 2.5,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 200);
    nuitDehors(scene, { horizon: 0x3a4058, brume: 0x2a3042, densite: 0.06, ambiance: 0.45, lune: 0.25, etoiles: 0, exclure: 2.6, sol: 0x34402c });
    const ped = new VueInstallation({ id: 21, type: 'pedalier', x: 0, z: 0, o: 0, etat: { dynamo: true } });
    scene.add(ped.objet);
    const recup = new VueInstallation({ id: 22, type: 'recuperateur_pluie', x: 1.5, z: -0.7, o: -0.4, etat: { litres: 0.2 } });
    scene.add(recup.objet);
    // Rose en selle (le vélo regarde vers −x) : le bassin sur la selle, les mains aux poignées, les pieds sur les pédales
    const rose = familial('mecanistes');
    rose.objet.rotation.y = -Math.PI / 2;
    scene.add(rose.objet);
    rose.jouer([{ clip: 'Driving_Loop', de: 0, vitesse: 0.3 }]);
    rose.noterRepos();
    rose.maj(0);
    const bassin = rose.ou('pelvis');
    const SELLE = new THREE.Vector3(-0.08, 1.46, 0);
    rose.objet.position.sub(bassin).add(SELLE);
    // la lampe de la dynamo : jaune doux, qui monte avec le pédalage (Book 18 §2)
    const lanterne = new THREE.Group(); lanterne.position.set(-1.0, 0, -0.75); lanterne.rotation.y = -0.6; scene.add(lanterne);
    cyl(lanterne, 0.02, 0.02, 1.4, materiau(0x5a4130), 0, 0.7, 0, 0, 0, 0, 6);
    boite(lanterne, 0.3, 0.03, 0.03, materiau(0x5a4130), 0.12, 1.38, 0);
    const verre = new THREE.MeshBasicMaterial({ color: 0x3a3020 });
    maille(lanterne, new THREE.CylinderGeometry(0.06, 0.07, 0.16, 8), verre, 0.25, 1.24, 0);
    const lumLant = new THREE.PointLight(0xffd98a, 0, 7, 1.6); lumLant.position.set(0.25, 1.22, 0); lumLant.castShadow = true; lanterne.add(lumLant);
    const averse = pluie(scene, [0, 0, 0], 8, 2200, 9);
    // un seau qui attend son tour sous la gouttière (Kenney, CC0)
    const seau = kenney('bucket', 0.32); seau.position.set(1.05, 0, -0.15); scene.add(seau);
    let litres = 0.2;
    return {
      scene, camera,
      maj(t, dt) {
        ped.animer(dt, 0, 1, true);
        rose.maj(t);
        // le pédalier du jeu tourne à l'envers pour qui regarde le guidon (−x) : on le fait tourner dans le bon sens, au temps du plan
        const th = t * 3.6;
        if (ped.manivelle) ped.manivelle.rotation.z = th;
        if (ped.roue) ped.roue.rotation.z = th * 2.6;
        ped.objet.updateMatrixWorld(true);
        // penchée sur le guidon, les épaules à bonne distance des poignées ; le buste roule un peu avec l'effort
        rose.pencher([-0.2 + Math.sin(th * 2) * 0.01, 1.7, Math.sin(th) * 0.025], 1);
        rose.regarder([-3, 1.4, 0.3], 0.8);
        // sa droite est côté −z : pied droit sur la pédale −z, main droite sur la poignée −z
        for (const [cote, sg] of [['r', -1], ['l', 1]]) {
          const pedale = ped.manivelle ? ped.manivelle.localToWorld(new THREE.Vector3(0, sg * 0.17, sg * 0.12)) : new THREE.Vector3();
          const poignee = ped.objet.localToWorld(new THREE.Vector3(-0.56, 1.34, sg * 0.225));
          rose.poser(cote, [pedale.x + 0.06, pedale.y + 0.08, pedale.z], [pedale.x - 0.8, 1.6, sg * 0.22], 1);
          rose.atteindre(cote, [poignee.x + 0.06, poignee.y + 0.03, poignee.z], [poignee.x + 0.3, poignee.y - 0.35, sg * 0.6], 1);   // le poignet juste derrière la poignée : la main se referme dessus
          rose.serrer(cote, 0.9, { pouce: 0.9 });
        }
        const lumiere = doux(seg(t, 0.5, 3.0));
        lumLant.intensity = 6 * lumiere * (0.92 + Math.sin(t * 9) * 0.08);
        verre.color.setRGB(0.25 + lumiere * 1.2, 0.2 + lumiere * 1.0, 0.1 + lumiere * 0.5);
        litres = 0.2 + t * 0.35;
        recup.majEtat({ id: 22, type: 'recuperateur_pluie', x: 1.5, z: -0.7, o: -0.4, etat: { litres } });
        averse.maj(t);
        // la caméra : de trois quarts face, la lanterne entre elle et nous ; on glisse lentement vers son visage
        const pos = cles([[0, [-2.2, 1.35, 2.3]], [11.4, [-1.5, 1.5, 1.5]]], t);
        cadrer(camera, pos, cles([[0, [-0.1, 1.15, 0]], [11.4, [-0.2, 1.55, 0]]], t), cles([[0, 30], [11.4, 40]], t));
        return { bloom: 0.6, bloomSeuil: 0.7, vignette: 0.55, grain: 0.07, exposition: 1.1, teinte: [0.96, 0.98, 1.05], saturation: 0.9 };
      },
    };
  },
};

/* ====================================================================== ⚙️ 6. L'aube : la pomme cueillie à la main */
const verger = {
  debut: MECANISTES + 11.4, fin: ENSEMBLE, preparer: 2.5,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 400);
    const leCiel = ciel(scene, 0x2a3656, 0xf2b07a, 0x3a4a2a, { soleil: [0.9, 0.04, -0.6], tailleSoleil: 0.006, couleurSoleil: 0xffd09a, nuages: 0.5, couleurNuages: 0xf2b490 });
    scene.fog = new THREE.FogExp2(0xe8b890, 0.03);
    const hemi = new THREE.HemisphereLight(0xffd6b0, 0x3a4a2a, 0.9); scene.add(hemi);
    const soleil = new THREE.DirectionalLight(0xffc890, 2.6); soleil.position.set(9, 1.6, -6); soleil.castShadow = true; soleil.shadow.mapSize.set(2048, 2048);
    Object.assign(soleil.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); scene.add(soleil);
    sol(scene, 0x6f8a46, 80);
    herbe(scene, 1600, 9, [0x7fa35a, 0x9aa65e, 0x6f9a4a], 31, [0, 0], 0.3, 1.0);
    const arbre = pommierCinema(31);
    arbre.objet.position.set(0, 0, -0.9); arbre.objet.rotation.y = 2.2; arbre.objet.scale.setScalar(1.1);
    scene.add(arbre.objet);
    const rose = familial('mecanistes');
    rose.objet.position.set(0.25, 0, 0.15); rose.objet.rotation.y = Math.PI - 0.3;
    scene.add(rose.objet);
    rose.jouer([{ clip: 'Idle_Loop', de: 0, vitesse: 0.7 }]);
    rose.noterRepos();
    // une branche basse, qui ploie sous sa pomme, à portée de main (bras tendu, un peu au-dessus de la tête)
    const devant0 = new THREE.Vector3(Math.sin(rose.objet.rotation.y), 0, Math.cos(rose.objet.rotation.y));
    rose.maj(0);
    const POMME = rose.ou('upperarm_r').addScaledVector(devant0, 0.26).add(new THREE.Vector3(0, 0.4, 0));
    const bois = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.95 });
    const rameau = new THREE.CatmullRomCurve3([new THREE.Vector3(0.02, 1.75, -0.85), new THREE.Vector3(0.1, 2.0, -0.62), POMME.clone().add(new THREE.Vector3(0.02, 0.1, 0)), POMME.clone().add(new THREE.Vector3(0.12, 0.08, 0.18))]);
    maille(scene, new THREE.TubeGeometry(rameau, 24, 0.018, 10), bois);
    const feuille = new THREE.MeshStandardMaterial({ color: 0x4f7a34, roughness: 0.7, side: THREE.DoubleSide });
    const fa = aleatoire(77);
    for (let i = 0; i < 26; i++) {
      const p = rameau.getPoint(0.35 + fa() * 0.65);
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10).scale(0.55, 1, 1), feuille);
      f.position.copy(p).add(new THREE.Vector3((fa() - 0.5) * 0.12, (fa() - 0.3) * 0.08, (fa() - 0.5) * 0.12));
      f.rotation.set(fa() * 3, fa() * 3, fa() * 3); f.castShadow = true; scene.add(f);
    }
    const pomme = new THREE.Group();
    maille(pomme, new THREE.SphereGeometry(0.038, 32, 24).scale(1, 0.9, 1), lisse(0xc0352a, { rugosite: 0.35 }));
    cyl(pomme, 0.003, 0.003, 0.03, bois, 0, 0.045, 0, 0.2, 0, 0, 8);
    pomme.position.copy(POMME); scene.add(pomme);
    const devant = new THREE.Vector3(Math.sin(rose.objet.rotation.y), 0, Math.cos(rose.objet.rotation.y));
    // des oiseaux au loin
    const oiseaux = particules(scene, 14, (i, t, [a, b, c]) => [-20 + ((t * (2 + a) + b * 40) % 50), 7 + c * 4 + Math.sin(t * 3 + i) * 0.3, -18 - a * 10, 0.18, 0.8], { couleur: 0x2a2633, echelle: 400 });
    return {
      scene, camera,
      maj(t) {
        const jour = doux(seg(t, 0, 11.4));
        soleil.position.set(9, 1.6 + jour * 2.2, -6);
        soleil.intensity = 2.0 + jour * 1.4;
        leCiel.material.uniforms.soleil.value.set(0.9, 0.04 + jour * 0.12, -0.6).normalize();
        rose.maj(t);
        // elle lève le bras, saisit, tourne et détache la pomme, la regarde, puis la passe par-dessus l'épaule dans sa hotte
        const tete = rose.ou('Head');
        const dos = tete.clone().addScaledVector(devant, -0.16).add(new THREE.Vector3(0, 0.1, 0)).addScaledVector(new THREE.Vector3(devant.z, 0, -devant.x), -0.12);
        const yeux = tete.clone().addScaledVector(devant, 0.4).add(new THREE.Vector3(0, -0.2, 0));
        const repos = rose.ou('thigh_r').addScaledVector(devant, 0.08);
        const droite = new THREE.Vector3(-devant.z, 0, devant.x);
        const cote = (k) => droite.clone().multiplyScalar(0.2 * Math.sin(Math.PI * k));   // la main passe par le côté, pas devant le visage
        let cible, poids = 1;
        if (t < 1.5) { cible = repos; poids = 0; }
        else if (t < 3.0) { const k = doux(seg(t, 1.5, 3.0)); cible = repos.clone().lerp(POMME.clone().add(new THREE.Vector3(0, -0.03, 0.0)), k).add(cote(k)); poids = doux(seg(t, 1.5, 2.2)); }
        else if (t < 3.6) cible = POMME.clone().add(new THREE.Vector3(0, -0.03 - seg(t, 3.25, 3.6) * 0.06, 0));
        else if (t < 5.2) { const k = doux(seg(t, 3.6, 4.5)); cible = POMME.clone().add(new THREE.Vector3(0, -0.09, 0)).lerp(yeux, k).add(cote(k)); }
        else if (t < 6.6) cible = yeux.clone().lerp(dos, doux(seg(t, 5.2, 6.3))).add(cote(seg(t, 5.2, 6.3)).multiplyScalar(0.5));
        else { cible = dos.clone().lerp(repos, doux(seg(t, 6.6, 7.8))); poids = 1 - doux(seg(t, 7.2, 7.9)); }
        rose.atteindre('r', cible.toArray(), rose.ou('upperarm_r').addScaledVector(droite, 0.7).add(new THREE.Vector3(0, -0.5, 0)).addScaledVector(devant, -0.2).toArray(), poids);
        const prise = seg(t, 2.7, 3.05) * (1 - seg(t, 6.3, 6.6));
        rose.serrer('r', 0.15 + prise * 0.55, { rond: 1, pouce: 0.8 });
        rose.serrer('l', 0.3, { rond: 0.5 });
        // la pomme : sur sa branche (qui frémit quand on la touche), puis dans la main, puis dans la hotte
        if (t < 3.45) pomme.position.copy(POMME).add(new THREE.Vector3(Math.sin(t * 40) * 0.004 * seg(t, 2.9, 3.0) * (1 - seg(t, 3.3, 3.45)), 0, 0));
        else if (t < 6.4) {
          const main = rose.ou('hand_r'), doigts = rose.ou('middle_01_r');
          pomme.position.copy(main.lerp(doigts, 0.75)).addScaledVector(devant, 0.015).add(new THREE.Vector3(0, -0.035, 0));
          pomme.rotation.y = t * 0.6;
        } else pomme.visible = false;
        rose.regarder(t < 1.0 ? [4, 1.6, -6] : t < 3.6 ? POMME.toArray() : t < 5.2 ? pomme.position.toArray() : t < 6.6 ? [2, 1.4, 2] : [4, 1.5, 6], 0.75);
        oiseaux.maj(t);
        // la caméra : côté arbre, face à elle, sous la branche ; on glisse lentement, le soleil levant derrière elle
        const pos = cles([[0, [2.0, 1.25, -1.1]], [11.4, [1.55, 1.45, -1.55]]], t);
        cadrer(camera, pos, cles([[0, [0.2, 1.6, -0.15]], [11.4, [0.2, 1.55, -0.1]]], t), cles([[0, 32], [11.4, 38]], t));
        return { bloom: 0.6, bloomSeuil: 0.75, vignette: 0.45, grain: 0.05, exposition: 1.05, teinte: [1.06, 1.0, 0.94] };
      },
    };
  },
};

export const PLANS_ACTE3 = [braise, forge, recharge, ampoule, pedalier, verger];

export const CARTONS_ACTE3 = [
  [CHARBONNIERS - 0.2, CHARBONNIERS + 3.6, 'Si vous entendez ceci… et si vous savez encore faire un feu…', 'radio'],
  [CHARBONNIERS + 4.2, CHARBONNIERS + 7.4, 'Certains avaient gardé un talent oublié : se servir de leurs mains.', 'recit'],
  [CHARBONNIERS + 10.5, CHARBONNIERS + 18, '', 'devise', '<strong>🔥 Les Charbonniers</strong><em>« Le feu ne trahit pas. »</em>'],
  [VOLTAIQUES + 1.2, VOLTAIQUES + 6.4, 'D\'autres savaient encore réparer, sans tutoriel ni service client.', 'recit'],
  [VOLTAIQUES + 12.5, VOLTAIQUES + 19.5, '', 'devise', '<strong>⚡ Les Voltaïques</strong><em>« Le silence est une arme. »</em>'],
  [MECANISTES + 1.2, MECANISTES + 6.6, 'Pédaler pour s\'éclairer, recueillir l\'eau de pluie. Révolutionnaire.', 'recit'],
  [MECANISTES + 12.5, MECANISTES + 19.5, '', 'devise', '<strong>⚙️ Les Mécanistes</strong><em>« Ce qui tourne ne meurt pas. »</em>'],
];
