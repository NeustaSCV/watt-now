/* Watt Now? — intro 3D : les écrans d'accueil (après la cinématique, le joueur clique sur « Suivant »).
   Trois tableaux vivants, dans le monde du jeu :
   1. Ton terrain : chez toi, au crépuscule, ton campement ; à la lisière, deux Éteints attirés par la lueur du feu.
   2. Les lieux lointains : le Grand Hôtel des Flots (bibliothèque batiment/), à l'heure dorée.
   3. Le Comptoir : terrain neutre ; on y troque, on y apprend, on y enseigne.
   Chaque plan donne aussi ses « repères » : des points du monde où s'accrochent les étiquettes de l'écran. */

import { THREE, creerArbres, aleatoire, FeuDeCamp, VueInstallation, VueRessource, creerComptoir, animerComptoir, lumieresComptoir, creerGrandHotel, APPARENCES_DE_REFERENCE } from '../vendor/rendu-jeu.js';
import { familial, eteint, cadrer, cles } from './acteurs.js';
import { lisse, materiau, cyl, boite, ciel, sol, herbe, fumee, lumiereFeu, particules } from './decors.js';
import { kenney } from './kenney.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const doux = (k) => k * k * (3 - 2 * k);

/* ====================================================================== 1. Ton terrain, au crépuscule */
function terrain(famille, apparence, base) {
  return {
    debut: base, fin: base + 1000, preparer: 3,
    creer() {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 400);
      ciel(scene, 0x1a2140, 0xd98a5a, 0x2a2a30, { soleil: [-0.8, 0.02, -0.5], tailleSoleil: 0.008, couleurSoleil: 0xff9a5a, etoiles: 0.6, nuages: 0.4, couleurNuages: 0xc07a6a });
      scene.fog = new THREE.FogExp2(0x6a6070, 0.014);
      scene.add(new THREE.HemisphereLight(0x9aa4d0, 0x3a3020, 1.25));
      const couchant = new THREE.DirectionalLight(0xffa070, 2.2); couchant.position.set(-40, 6, -25); couchant.castShadow = true; couchant.shadow.mapSize.set(2048, 2048);
      Object.assign(couchant.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 }); scene.add(couchant);
      sol(scene, 0x5a6e3c, 200);
      // la lisière : un bois tout autour, au-delà des bornes (les arbres du jeu)
      const al = aleatoire(23), places = [];
      for (let i = 0; i < 120; i++) { const a = al() * Math.PI * 2, r = 15 + al() * 26; places.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, e: 1.1 + al() * 1.4 }); }
      scene.add(creerArbres(places.filter((p) => !(p.x > 8 && p.z > -4 && p.z < 9 && Math.hypot(p.x, p.z) < 22)), aleatoire(7)));
      herbe(scene, 2600, 30, [0x4f6a36, 0x5d7040, 0x44592e], 17, [0, 0], 0.32, 3.2);
      // les bornes du terrain : des piquets et une ficelle, qui disent « ici, c'est chez moi »
      const bois = lisse(0x6b4a32, { rugosite: 0.9 });
      const ficelle = lisse(0xd8cfb0, { rugosite: 1 });
      const bord = 9;
      for (const [x, z] of [[-bord, -bord], [bord, -bord], [bord, bord], [-bord, bord]]) cyl(scene, 0.04, 0.05, 0.9, bois, x, 0.45, z, 0, 0, 0, 12);
      for (let i = -bord; i <= bord; i += 3) for (const [x, z] of [[i, -bord], [i, bord], [-bord, i], [bord, i]]) cyl(scene, 0.03, 0.04, 0.7, bois, x, 0.35, z, 0, 0, 0, 10);
      for (const [a, b] of [[[-bord, -bord], [bord, -bord]], [[bord, -bord], [bord, bord]], [[bord, bord], [-bord, bord]], [[-bord, bord], [-bord, -bord]]]) {
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const f = boite(scene, l, 0.012, 0.012, ficelle, (a[0] + b[0]) / 2, 0.62, (a[1] + b[1]) / 2);
        f.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      }
      // le campement : l'abri, le feu, l'installation de la famille, les réserves
      const abri = new VueInstallation({ id: 101, type: 'abri', x: -2.6, z: -3.2, o: 0.3, etat: {} }); scene.add(abri.objet);
      const feu = new FeuDeCamp({ id: 102, x: 0.6, z: 0.2, bois: 4, aspect: 'flammes' }); scene.add(feu.objet);
      const lumFeu = lumiereFeu(scene, 0.6, 0.6, 0.2, 9, 12);
      const recup = new VueInstallation({ id: 103, type: 'recuperateur_pluie', x: -5.2, z: -1.0, o: 0.6, etat: { litres: 30 } }); scene.add(recup.objet);
      const propre = {
        charbonniers: [{ type: 'forge', x: 3.6, z: -2.6, o: -0.5 }],
        voltaiques: [{ type: 'panneau_solaire', x: 3.8, z: -3.4, o: 0 }, { type: 'banc_recharge', x: 3.6, z: -0.6, o: -0.8, etat: { batteries: { petite_batterie: 1 } } }],
        mecanistes: [{ type: 'pedalier', x: 3.6, z: -2.4, o: -0.6, etat: { dynamo: true } }],
      }[famille] || [];
      const installations = propre.map((p, i) => { const v = new VueInstallation({ id: 110 + i, etat: {}, ...p }); scene.add(v.objet); return v; });
      const velo = new VueRessource({ id: 104, type: 'velo', x: -1.2, z: 3.4, disponible: true }); velo.objet.rotation.y = 1.1; scene.add(velo.objet);
      for (const [nom, t, x, z, r] of [['resource-wood', 0.9, 2.0, 2.4, 0.4], ['barrel', 0.85, -4.6, -3.6, 0], ['box-large', 0.7, -0.6, -5.2, 0.3], ['box', 0.45, -0.2, -5.0, 0.8], ['bucket', 0.3, -4.4, 0.2, 0], ['workbench', 1.3, 5.0, -4.6, 0.4]]) {
        const o = kenney(nom, t); o.position.set(x, 0, z); o.rotation.y = r; scene.add(o);
      }
      // toi, près du feu
      const toi = familial(famille, apparence);
      toi.objet.position.set(-0.9, 0, 2.3); toi.objet.rotation.y = 2.4;   // à droite du feu, dans l'image
      scene.add(toi.objet);
      toi.jouer([{ clip: famille === 'charbonniers' ? 'Idle_Torch_Loop' : 'Idle_Loop', de: 0, vitesse: 0.6 }]);
      toi.noterRepos();
      // à la lisière, dans la brume : deux Éteints, attirés par la lueur
      // au fond à gauche de l'image, à la lisière
      const errants = [[14, 3.5, 0.4], [16.2, 1.2, 0.9]].map(([x, z, d], i) => {
        const e = eteint({ graine: 3 + i });
        e.objet.position.set(x, 0, z); e.objet.rotation.y = Math.atan2(0.6 - x, 0.2 - z);
        scene.add(e.objet);
        e.jouer([{ clip: 'Zombie_Walk_Fwd_Loop', de: 0, vitesse: 0.5, depuis: d }]);
        return { e, x, z };
      });
      const lucioles = particules(scene, 30, (i, t, [a, b, c]) => [(a - 0.5) * 18, 0.6 + b * 1.6 + Math.sin(t * 0.8 + i) * 0.2, (c - 0.5) * 18, 0.03, 0.5 + 0.5 * Math.sin(t * 3 + i * 2)], { couleur: 0xfff0a0, additif: true, echelle: 600, toneMapped: false });
      const fum = fumee(scene, 0.6, 1.2, 0.2, { n: 30, hauteur: 6, taille: 2, opacite: 0.18, couleur: 0x8a8590 });
      return {
        scene, camera,
        reperes: () => ({ toi: toi.ou('Head').add(V(0, 0.35, 0)), feu: V(0.6, 0.9, 0.2), eteints: errants[0].e.ou('Head').add(V(0, 0.4, 0)), bornes: V(bord, 0.9, bord) }),
        maj(t, dt) {
          feu.animer(dt, 1); lumFeu.maj(t); abri.animer?.(dt, 0, 1, false); installations.forEach((v) => v.animer?.(dt, 0, 1, true));
          toi.maj(t); toi.regarder([0.6, 0.5, 0.2], 0.6);
          // les Éteints avancent, très lentement, vers la lueur
          errants.forEach(({ e, x, z }) => { const k = Math.min(0.25, t * 0.008); e.objet.position.set(x + (0.6 - x) * k, 0, z + (0.2 - z) * k); e.maj(t); });
          lucioles.maj(t); fum.maj(t);
          // le couchant dans le dos : la caméra regarde le campement, et au-delà, la lisière où rôdent les Éteints
          const a = -2.35 + Math.sin(t * 0.05) * 0.1;
          cadrer(camera, [Math.sin(a) * 12, 4.2 + Math.sin(t * 0.07) * 0.3, Math.cos(a) * 12], [3.0, 1.1, 1.6], 32);
          return { bloom: 0.55, bloomSeuil: 0.8, vignette: 0.45, grain: 0.04, exposition: 1.45, teinte: [1.04, 0.98, 0.98] };
        },
      };
    },
  };
}

/* ====================================================================== 2. Les lieux lointains : le Grand Hôtel des Flots */
const lieux = (base) => ({
  debut: base + 1000, fin: base + 2000, preparer: 4,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 1500);
    const leCiel = ciel(scene, 0x3a5a8a, 0xf6c08a, 0x5a6a7a, { soleil: [-0.85, 0.12, 0.5], tailleSoleil: 0.01, couleurSoleil: 0xffd59a, nuages: 0.55, couleurNuages: 0xf4c8a8 });
    void leCiel;
    scene.fog = new THREE.FogExp2(0xe8c8a8, 0.006);
    scene.add(new THREE.HemisphereLight(0xffe2c0, 0x6a6050, 1.0));
    const soleil = new THREE.DirectionalLight(0xffc890, 3.2); soleil.position.set(-70, 22, 45); soleil.castShadow = true; soleil.shadow.mapSize.set(4096, 4096);
    Object.assign(soleil.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 }); soleil.shadow.bias = -0.0004; soleil.shadow.normalBias = 0.04;
    scene.add(soleil, soleil.target);
    const hotel = creerGrandHotel({ usure: 0.7, carte: 'facade' });
    hotel.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(hotel);
    // la mer, au-delà de la plage, et un sol de sable sous tout le reste
    const mer = new THREE.Mesh(new THREE.PlaneGeometry(1400, 700).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8cc0cc, emissive: 0x2f5560, roughness: 0.25, metalness: 0.05 }));
    mer.position.set(0, -0.15, 372);
    // l'écume au bord de l'eau, en deux bandes
    for (const [z, o] of [[22.4, 0.85], [23.6, 0.4]]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(1400, 0.7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfffaf0, transparent: true, opacity: o, depthWrite: false })); e.position.set(0, -0.12, z); scene.add(e); } scene.add(mer);
    const sable = new THREE.Mesh(new THREE.PlaneGeometry(1400, 400).rotateX(-Math.PI / 2), materiau(0xd9c49a)); sable.position.set(0, -0.2, -150); sable.receiveShadow = true; scene.add(sable);
    // toi, sur la promenade
    const toi = familial('charbonniers'); toi.objet.position.set(2, 0, 12); toi.objet.rotation.y = Math.PI - 0.3; scene.add(toi.objet);
    toi.jouer([{ clip: 'Walk_Loop', de: 0, vitesse: 0.8 }]); toi.noterRepos();
    const mouettes = particules(scene, 10, (i, t, [a, b, c]) => [-40 + ((t * (2 + a * 2) + b * 80) % 90), 14 + c * 8 + Math.sin(t * 2 + i) * 0.6, 10 + a * 30, 0.25, 0.9], { couleur: 0xf4f0e8, echelle: 500 });
    return {
      scene, camera,
      reperes: () => ({ hotel: V(-8, 12.5, -10), terrasse: V(3, 2.6, -1), toi: toi.ou('Head').add(V(0, 0.4, 0)) }),
      maj(t, dt) {
        hotel.traverse((o) => o.userData.animer?.(t, dt));
        const zt = 12 - Math.min(t * 0.6, 5);
        toi.objet.position.set(2 - Math.min(t * 0.18, 1.5), 0, zt);
        toi.maj(t);
        mouettes.maj(t);
        const k = doux(Math.min(1, t / 40));
        cadrer(camera, [cles([[0, 17], [1, 13]], k), 2.6 + k * 0.6, cles([[0, 19.5], [1, 18]], k)], [-5, 8.5, -9], 26);
        return { bloom: 0.5, bloomSeuil: 0.85, vignette: 0.42, grain: 0.035, exposition: 1.05, teinte: [1.05, 1.0, 0.95] };
      },
    };
  },
});

/* ====================================================================== 3. Le Comptoir : troquer, apprendre, enseigner */
const comptoir = (base) => ({
  debut: base + 2000, fin: base + 3000, preparer: 3,
  creer() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 900);
    ciel(scene, 0x34406a, 0xf2b07a, 0x6a6a5a, { soleil: [0.8, 0.05, -0.6], tailleSoleil: 0.006, couleurSoleil: 0xffd59a, etoiles: 0.1, nuages: 0.5, couleurNuages: 0xf7c4a0 });
    scene.fog = new THREE.FogExp2(0xe9c0a0, 0.0035);
    scene.add(new THREE.HemisphereLight(0xffd8c0, 0x4a5a3a, 0.9));
    const carrefour = creerComptoir(); scene.add(carrefour);
    const centre = new THREE.Box3().setFromObject(carrefour).getCenter(V(0, 0, 0));
    const soleil = new THREE.DirectionalLight(0xffc48a, 3.0); soleil.position.copy(centre).add(V(40, 9, -30)); soleil.target.position.copy(centre);
    soleil.castShadow = true; soleil.shadow.mapSize.set(2048, 2048); Object.assign(soleil.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 }); soleil.shadow.normalBias = 0.03;
    scene.add(soleil, soleil.target);
    for (const l of lumieresComptoir()) { const p = new THREE.PointLight(l.couleur, l.intensite * 0.6, l.portee, 1.6); p.position.set(l.x, l.y, l.z); scene.add(p); }
    sol(scene, 0x5f7a44, 400).position.y = -0.05;
    // devant le guichet : deux joueurs troquent ; plus loin, une Mécaniste montre à un Voltaïque comment on fait
    const place = V(centre.x, 0, centre.z + 6.5);
    const gens = [
      ['charbonniers', 1.2, 0.6, -2.4, 'Idle_Talking_Loop'], ['voltaiques', -0.4, 1.3, 2.2, 'Idle_Loop'],
      ['mecanistes', 4.6, 2.4, -1.8, 'Idle_Talking_Loop'], ['voltaiques', 3.6, 3.6, 2.8, 'Idle_Loop'],
    ].map(([f, x, z, r, clip], i) => {
      const a = familial(f, i === 3 ? { ...APPARENCES_DE_REFERENCE.voltaiques, genre: 'homme' } : undefined);
      a.objet.position.copy(place).add(V(x, 0, z)); a.objet.rotation.y = r; scene.add(a.objet);
      a.jouer([{ clip, de: 0, depuis: i * 0.7 }]); a.noterRepos(); return a;
    });
    // ce qui s'échange : une caisse posée entre eux, une batterie sur le banc
    const caisse = kenney('box', 0.45); caisse.position.copy(place).add(V(0.4, 0, 0.9)); scene.add(caisse);
    return {
      scene, camera,
      reperes: () => ({ guichet: V(32, 1.6, 17.8), troc: gens[0].ou('Head').add(V(0, 0.45, 0)), lecon: gens[2].ou('Head').add(V(0, 0.45, 0)) }),
      maj(t, dt) {
        animerComptoir(dt);
        gens.forEach((a, i) => { a.maj(t); a.regarder(gens[i ^ 1].ou('Head').toArray(), 0.7); });
        const k = doux(Math.min(1, t / 40));
        cadrer(camera, [centre.x + 6.5 - k * 1.2, 2.3, centre.z + 15 - k * 2], [centre.x + 0.5, 2.2, centre.z + 1], 30);
        return { bloom: 0.45, bloomSeuil: 0.85, vignette: 0.45, grain: 0.04, exposition: 1.0, teinte: [1.06, 1.0, 0.94] };
      },
    };
  },
});

/** Les trois tableaux, pour une famille (et l'apparence du joueur, s'il l'a choisie), à partir de l'instant `base`. */
export function plansAccueil(famille = 'charbonniers', apparence, base = 0) {
  return [terrain(famille, apparence, base), lieux(base), comptoir(base)];
}
