/* Watt Now? — intro 3D : le salon de l'Âge de l'Abondance, le soir de la Grande Panne.
   Tout y est branché : la télé, le fauteuil qui nourrit (un bras robot), la lampe connectée, l'enceinte « intelligente »
   à l'anneau bleu, l'aspirateur robot qui tourne en rond, l'horloge numérique. À la coupure, tout s'éteint d'un coup. */

import { THREE } from '../vendor/rendu-jeu.js';
import { civil, TENUES_ABONDANCE, PEAUX, CHEVEUX } from './acteurs.js';
import { lisse, materiau, boite, cyl, boule, maille, ecran } from './decors.js';
import { toile, police } from './textures.js';
import { C } from '../src/dessins.js';

/** La ville la nuit, vue par la fenêtre (peinte). `eteinte` : 0 → 1. */
function vueVille() {
  const fenetres = [];
  let k = 7;
  const r = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 26; i++) {
    const x = i * 42 - 20, w = 30 + r() * 40, hh = 120 + r() * 300;
    fenetres.push({ x, w, hh, lum: Array.from({ length: 40 }, () => r() < 0.55) });
  }
  return toile(1024, 512, (ctx, eteinte, l, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1020'); g.addColorStop(1, '#2a2f4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, l, h);
    ctx.fillStyle = `rgba(255,170,90,${0.25 * (1 - eteinte)})`; ctx.fillRect(0, h * 0.55, l, h * 0.45);
    fenetres.forEach((b, i) => {
      ctx.fillStyle = '#141a2c'; ctx.fillRect(b.x, h - b.hh, b.w, b.hh);
      let n = 0;
      for (let y = h - b.hh + 10; y < h - 10; y += 16) for (let x = b.x + 5; x < b.x + b.w - 8; x += 10) {
        if (b.lum[n++ % 40] && (1 - eteinte) * 26 > i * 0.6 + (n % 5)) { ctx.fillStyle = n % 7 ? '#ffd98a' : '#bfe3ff'; ctx.fillRect(x, y, 5, 8); }
      }
    });
    ctx.fillStyle = '#f1ead2'; ctx.beginPath(); ctx.arc(840, 90, 26, 0, Math.PI * 2); ctx.fill();
  });
}

/** L'horloge numérique connectée. */
function horloge() {
  return toile(256, 96, (ctx, eteinte, l, h) => {
    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, l, h);
    if (eteinte >= 1) return;
    ctx.fillStyle = '#3cf0ff'; ctx.font = police('machine', 64); ctx.textAlign = 'center'; ctx.fillText('21:47', l / 2, 72);
  });
}

/**
 * Construit le salon. Repère : la télé au fond (z ≈ −2,3), le fauteuil face à elle (z ≈ +1,2).
 * Renvoie { groupe, spectateur, ecranTele (mesh), maj(t, o) } ; o = { ecran: texture, eteint: 0..1, tvLumiere: couleur, bras: 0..1 }.
 */
export function salon(o = {}) {
  const g = new THREE.Group();
  // la pièce
  const papier = toile(512, 512, (ctx, t, l, h) => {
    ctx.fillStyle = '#e9d7c0'; ctx.fillRect(0, 0, l, h);
    ctx.strokeStyle = 'rgba(200,120,90,0.25)'; ctx.lineWidth = 18;
    for (let x = 0; x < l; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.fillStyle = 'rgba(200,54,43,0.12)';
    for (let y = 32; y < h; y += 64) for (let x = 32; x < l; x += 64) { ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); }
  }, { fixe: true, repeter: true });
  papier.maj(0);
  papier.texture.repeat.set(4, 2);
  const murMat = new THREE.MeshStandardMaterial({ map: papier.texture, roughness: 0.95 });
  const parquet = toile(512, 512, (ctx, t, l, h) => {
    for (let i = 0; i < 8; i++) { ctx.fillStyle = ['#8a5a36', '#7d5232', '#93603a', '#80542f'][i % 4]; ctx.fillRect(0, i * 64, l, 64); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, i * 64, l, 3); ctx.fillRect(((i * 197) % l), i * 64, 3, 64); }
  }, { fixe: true, repeter: true });
  parquet.maj(0);
  parquet.texture.repeat.set(3, 3);
  boite(g, 7, 0.1, 6, new THREE.MeshStandardMaterial({ map: parquet.texture, roughness: 0.6 }), 0, -0.05, 0);
  boite(g, 7, 3, 0.1, murMat, 0, 1.5, -2.9);                 // mur du fond
  boite(g, 0.1, 3, 6, murMat, -3.5, 1.5, 0);                  // mur de gauche (avec la fenêtre)
  boite(g, 0.1, 3, 6, murMat, 3.5, 1.5, 0);
  boite(g, 7, 0.1, 6, lisse(0xf2ece0), 0, 3.05, 0);
  // la fenêtre (mur de gauche) : la ville la nuit
  const ville = vueVille();
  ville.maj(0);
  const vitre = new THREE.MeshBasicMaterial({ map: ville.texture });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), vitre);
  f.position.set(-3.44, 1.6, -0.6); f.rotation.y = Math.PI / 2; g.add(f);
  boite(g, 0.14, 0.08, 2.4, lisse(0xf4f4f0), -3.42, 0.86, -0.6);
  boite(g, 0.14, 1.5, 0.06, lisse(0xf4f4f0), -3.42, 1.6, -0.6);
  boite(g, 0.14, 0.06, 2.3, lisse(0xf4f4f0), -3.42, 1.6, -0.6);
  // le tapis
  maille(g, new THREE.CircleGeometry(1.6, 40).rotateX(-Math.PI / 2), lisse(0x1f5e66, { rugosite: 1 }), 0, 0.006, -0.3);
  maille(g, new THREE.RingGeometry(1.35, 1.45, 40).rotateX(-Math.PI / 2), lisse(0xe8c547, { rugosite: 1 }), 0, 0.008, -0.3);

  // la télé : un grand écran bombé façon rétro-futur, sur un meuble bas
  const meuble = new THREE.Group(); meuble.position.set(0, 0, -2.4); g.add(meuble);
  boite(meuble, 2.4, 0.5, 0.5, lisse(0x7a4a2c, { rugosite: 0.5 }), 0, 0.25, 0);
  boite(meuble, 2.3, 0.04, 0.46, lisse(0x2a1a10), 0, 0.33, 0.03);
  for (const x of [-1.05, 1.05]) cyl(meuble, 0.03, 0.02, 0.18, lisse(0xb59048, { metal: 0.8, rugosite: 0.3 }), x, -0.02, 0, 0, 0, 0, 8);
  const tv = new THREE.Group(); tv.position.set(0, 1.12, 0); meuble.add(tv);
  const corpsTV = boite(tv, 1.62, 1.22, 0.32, lisse(0xe8e2d4, { rugosite: 0.35 }), 0, 0, -0.06);
  corpsTV.geometry = new THREE.BoxGeometry(1.62, 1.22, 0.32, 4, 4, 1);
  boite(tv, 1.5, 1.1, 0.05, lisse(0x15171c, { rugosite: 0.25 }), 0, 0, 0.12);
  const ecranMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const geoEcran = new THREE.PlaneGeometry(1.4, 1.05, 12, 12);
  const pe = geoEcran.getAttribute('position');
  for (let i = 0; i < pe.count; i++) { const x = pe.getX(i), y = pe.getY(i); pe.setZ(i, 0.035 * (1 - (x * x) / 0.49) * (1 - (y * y) / 0.2757)); }   // bombé, mais les bords restent devant le cadre : l'image remplit tout le rectangle
  const ecranTele = new THREE.Mesh(geoEcran, ecranMat);
  ecranTele.position.set(0, 0, 0.148); tv.add(ecranTele);
  boite(tv, 0.5, 0.06, 0.2, lisse(0xb59048, { metal: 0.8, rugosite: 0.3 }), 0, -0.64, 0);
  const voyant = boule(tv, 0.012, new THREE.MeshBasicMaterial({ color: 0xff3020 }), 0.68, -0.58, 0.15, 8);
  // l'enceinte « intelligente », son anneau bleu
  const enceinte = new THREE.Group(); enceinte.position.set(-0.95, 0.52, -2.3); g.add(enceinte);
  cyl(enceinte, 0.08, 0.09, 0.24, lisse(0x2a2d34, { rugosite: 0.9 }), 0, 0.12, 0, 0, 0, 0, 20);
  const anneauMat = new THREE.MeshBasicMaterial({ color: 0x3ab0ff });
  maille(enceinte, new THREE.TorusGeometry(0.075, 0.008, 6, 24).rotateX(Math.PI / 2), anneauMat, 0, 0.245, 0);
  // l'horloge connectée
  const hor = horloge();
  ecran(g, hor.texture, 0.3, 0.11, 0.95, 0.5, -2.14, 0, 1.3);
  // la lampe connectée (abat-jour, lumière chaude)
  const lampe = new THREE.Group(); lampe.position.set(2.3, 0, -1.2); g.add(lampe);
  cyl(lampe, 0.18, 0.2, 0.03, lisse(0xb59048, { metal: 0.7, rugosite: 0.35 }), 0, 0.015, 0);
  cyl(lampe, 0.015, 0.015, 1.4, lisse(0xb59048, { metal: 0.7, rugosite: 0.35 }), 0, 0.72, 0, 0, 0, 0, 8);
  const abatMat = lisse(0xf4e2b8, { emission: 0xffc070, intensite: 1.5, double: true });
  maille(lampe, new THREE.CylinderGeometry(0.18, 0.3, 0.32, 24, 1, true), abatMat, 0, 1.45, 0);
  const lumLampe = new THREE.PointLight(0xffb870, 4, 6, 2); lumLampe.position.set(0, 1.35, 0); lampe.add(lumLampe);
  // l'aspirateur robot
  const robot = new THREE.Group(); g.add(robot);
  cyl(robot, 0.17, 0.17, 0.08, lisse(0xf4f4f0, { rugosite: 0.3 }), 0, 0.045, 0, 0, 0, 0, 24);
  const ledRobot = boule(robot, 0.015, new THREE.MeshBasicMaterial({ color: 0x40ff90 }), 0, 0.09, 0.12, 8);
  // une plante en plastique (elle aussi a un capteur)
  const plante = new THREE.Group(); plante.position.set(-2.6, 0, -2.2); g.add(plante);
  cyl(plante, 0.16, 0.12, 0.34, lisse(0xe46a4f), 0, 0.17, 0);
  for (let i = 0; i < 7; i++) maille(plante, new THREE.ConeGeometry(0.06, 0.6, 4), materiau(0x4f9a52), Math.cos(i) * 0.08, 0.6, Math.sin(i * 2) * 0.08, Math.cos(i * 1.7) * 0.4, 0, Math.sin(i * 1.3) * 0.4);
  // une affiche de Watty au mur (neuve)
  const affiche = toile(512, 720, (ctx, t, l, h) => {
    ctx.fillStyle = C.creme; ctx.fillRect(0, 0, l, h); ctx.fillStyle = C.rouge; ctx.fillRect(0, 0, l, 110);
    ctx.fillStyle = C.creme; ctx.font = police('titre', 58); ctx.textAlign = 'center'; ctx.fillText('WATTY', l / 2, 80);
    ctx.fillStyle = C.encre; ctx.font = 'italic ' + police('texte', 34); ctx.fillText('Toujours plein,', l / 2, h - 90); ctx.fillText('jamais à plat !', l / 2, h - 45);
  }, { fixe: true });
  affiche.maj(0);
  maille(g, new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshStandardMaterial({ map: affiche.texture, roughness: 0.8 }), 2.2, 1.75, -2.84);

  // le fauteuil : gros, rond, rouge, motorisé
  const fauteuil = new THREE.Group(); fauteuil.position.set(0, 0, 1.25); fauteuil.rotation.y = Math.PI; g.add(fauteuil);
  const cuir = lisse(0xa82a20, { rugosite: 0.55 });
  boite(fauteuil, 1.0, 0.42, 0.9, cuir, 0, 0.21, 0);
  boite(fauteuil, 1.0, 0.95, 0.24, cuir, 0, 0.62, -0.36, -0.12, 0, 0);
  for (const x of [-0.56, 0.56]) boite(fauteuil, 0.2, 0.62, 0.9, cuir, x, 0.31, 0);
  boite(fauteuil, 0.9, 0.12, 0.7, lisse(0xb83a2e, { rugosite: 0.5 }), 0, 0.47, 0.06);
  // la petite table et l'assiette (où le bras va chercher)
  boite(fauteuil, 0.36, 0.04, 0.36, lisse(0xf4f4f0), 0.92, 0.62, 0.15);
  cyl(fauteuil, 0.02, 0.02, 0.6, lisse(0xb59048, { metal: 0.8 }), 0.92, 0.31, 0.15, 0, 0, 0, 8);
  cyl(fauteuil, 0.13, 0.11, 0.025, lisse(0xffffff, { rugosite: 0.2 }), 0.92, 0.655, 0.15, 0, 0, 0, 24);
  for (let i = 0; i < 5; i++) boule(fauteuil, 0.025, materiau(0xe0913f), 0.92 + Math.cos(i * 1.3) * 0.05, 0.68, 0.15 + Math.sin(i * 1.3) * 0.05, 8);
  // le bras robot (trois segments), fixé à l'accoudoir droit du fauteuil
  const metal = lisse(0xd8dde4, { metal: 0.6, rugosite: 0.3 });
  const articulation = lisse(0x2a2d34, { rugosite: 0.4 });
  const base = new THREE.Group(); base.position.set(0.56, 0.62, -0.1); fauteuil.add(base);
  cyl(base, 0.06, 0.07, 0.08, articulation, 0, 0.04, 0);
  const s1 = new THREE.Group(); s1.position.y = 0.08; base.add(s1);
  cyl(s1, 0.03, 0.03, 0.42, metal, 0, 0.21, 0, 0, 0, 0, 10);
  const s2 = new THREE.Group(); s2.position.y = 0.42; s1.add(s2);
  boule(s2, 0.045, articulation, 0, 0, 0, 12);
  cyl(s2, 0.025, 0.025, 0.36, metal, 0, 0.18, 0, 0, 0, 0, 10);
  const s3 = new THREE.Group(); s3.position.y = 0.36; s2.add(s3);
  boule(s3, 0.035, articulation, 0, 0, 0, 12);
  cyl(s3, 0.008, 0.008, 0.18, metal, 0, 0.09, 0, 0, 0, 0, 6);
  for (const dx of [-0.012, 0, 0.012]) cyl(s3, 0.003, 0.003, 0.05, metal, dx, 0.2, 0, 0, 0, 0, 4);
  const bouchee = boule(s3, 0.022, materiau(0xe0913f), 0, 0.2, 0.012, 8);
  const voyantBras = boule(s1, 0.012, new THREE.MeshBasicMaterial({ color: 0x40ff90 }), 0, 0.1, 0.03, 8);
  /** Le bras robot va chercher un point du monde (deux segments, loi des cosinus ; l'outil prolonge l'avant-bras). */
  function bras(cible) {
    const local = fauteuil.worldToLocal(cible.clone());
    const v = local.sub(new THREE.Vector3(base.position.x, base.position.y + 0.08, base.position.z));
    base.rotation.y = Math.atan2(v.x, v.z);
    const d = Math.hypot(v.x, v.z), h = v.y;
    const L1 = 0.42, L2 = 0.36 + 0.22;
    const D = Math.min(Math.hypot(d, h), L1 + L2 - 1e-3);
    const phi = Math.atan2(d, h);
    const alpha = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))));
    const beta = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2))));
    s1.rotation.set(phi - alpha, 0, 0);
    s2.rotation.set(Math.PI - beta, 0, 0);
    s3.rotation.set(0, 0, 0);
  }

  // le spectateur, au fond du fauteuil, la montre au poignet
  const spectateur = civil({ genre: 'homme', peau: o.peau ?? PEAUX[2], tenue: o.tenue ?? { ...TENUES_ABONDANCE[4], haut: 0xf2c14e, manche: 0xf2c14e }, coiffure: 'simpleparted', cheveux: CHEVEUX[1], barbe: false, largeur: 1.06, graine: 5 });
  spectateur.objet.position.set(0, 0.18, 1.18);
  spectateur.objet.rotation.y = Math.PI;
  g.add(spectateur.objet);
  spectateur.jouer([{ clip: 'Sitting_Idle_Loop', de: 0, vitesse: 0.6 }]);
  const montreTex = o.montre;
  let ecranMontre = null, montre = null;
  if (montreTex) {
    // la montre est reposée à chaque image sur le poignet gauche, l'écran tourné vers le ciel
    montre = new THREE.Group(); g.add(montre);
    boite(montre, 0.052, 0.014, 0.06, lisse(0x1a1a1a, { rugosite: 0.3 }), 0, 0, 0);
    boite(montre, 0.03, 0.006, 0.09, lisse(0x2a2d34, { rugosite: 0.7 }), 0, -0.004, 0);
    ecranMontre = new THREE.Mesh(new THREE.PlaneGeometry(0.044, 0.05), new THREE.MeshBasicMaterial({ map: montreTex }));
    ecranMontre.rotation.set(-Math.PI / 2, 0, Math.PI); ecranMontre.position.y = 0.0075; montre.add(ecranMontre);
  }

  // les lumières
  const lune = new THREE.DirectionalLight(0x6f86c8, 0.35); lune.position.set(-8, 4, -1); lune.target.position.set(0, 0, 0); g.add(lune, lune.target);
  const lumTele = new THREE.SpotLight(0xbfd8ff, 18, 9, 0.9, 0.8, 1.6); lumTele.position.set(0, 1.12, -2.1); lumTele.target.position.set(0, 0.8, 1.3); lumTele.castShadow = true; lumTele.shadow.mapSize.set(1024, 1024); lumTele.shadow.bias = -0.0008; g.add(lumTele, lumTele.target);
  const ambiance = new THREE.HemisphereLight(0x5a6a9a, 0x2a1a10, 0.35); g.add(ambiance);
  // la lueur de la ville, par la fenêtre : on ne la remarque que quand tout s'éteint dans la pièce
  const lueurVille = new THREE.SpotLight(0xffc890, 0, 9, 0.7, 0.9, 1.4); lueurVille.position.set(-3.3, 1.7, -0.6); lueurVille.target.position.set(0.2, 1.0, 1.1); g.add(lueurVille, lueurVille.target);

  let couleurTele = new THREE.Color(0xbfd8ff);
  return {
    groupe: g, spectateur, ecranTele, ecranMat, lumTele, robot, base, fauteuil, get montre() { return montre; },
    teteSpectateur: () => spectateur.ou('Head'),
    /** o : { ecran, eteint (0 tout allumé → 1 tout éteint), teleAllumee (0..1), couleurTele, bras (phase), brasFige } */
    maj(t, e = {}) {
      const eteint = e.eteint ?? 0;
      // l'écran de la télé
      if (e.ecran) { ecranMat.map = e.ecran; ecranMat.color.setScalar(0.72 * (e.teleAllumee ?? 1)); ecranMat.needsUpdate = ecranMat.map !== e.ecran; }
      else { ecranMat.map = null; ecranMat.color.setScalar(0.02); }
      ecranMat.needsUpdate = true;
      if (e.couleurTele) couleurTele.set(e.couleurTele);
      lumTele.color.copy(couleurTele);
      lumTele.intensity = 18 * (e.teleAllumee ?? 1) * (1 + Math.sin(t * 9) * 0.04 + Math.sin(t * 2.3) * 0.06);
      // tout ce qui est branché
      const vivant = 1 - eteint;
      abatMat.emissiveIntensity = 1.5 * vivant; lumLampe.intensity = 4 * vivant;
      anneauMat.color.setRGB(0.23 * vivant, 0.69 * vivant * (0.7 + 0.3 * Math.sin(t * 3)), 1 * vivant);
      voyant.material.color.setRGB(vivant, 0.19 * vivant, 0.12 * vivant);
      ledRobot.material.color.setRGB(0.25 * vivant, vivant, 0.56 * vivant);
      voyantBras.material.color.setRGB(0.25 * vivant, vivant, 0.56 * vivant);
      hor.maj(eteint); ville.maj(e.ville ?? 0);
      ambiance.intensity = 0.35 * (0.4 + 0.6 * vivant) + 0.1 * eteint;
      lueurVille.intensity = 20 * eteint * (1 - (e.ville ?? 0));
      lune.intensity = 0.35 + 1.0 * eteint;
      // l'aspirateur robot : il tourne en rond, puis s'arrête net
      const tr = e.robotFige ?? t;
      robot.position.set(1.4 + Math.cos(tr * 0.5) * 0.9, 0, 0.1 + Math.sin(tr * 0.5) * 0.7);
      robot.rotation.y = -tr * 0.5;
      // le bras robot : de l'assiette à la bouche, en boucle (ou figé)
      const ph = e.brasFige ?? (t * 0.42) % 1;
      const k = ph < 0.35 ? 0 : ph < 0.55 ? (ph - 0.35) / 0.2 : ph < 0.8 ? 1 : 1 - (ph - 0.8) / 0.2;
      const v = k * k * (3 - 2 * k);
      spectateur.maj(t);
      // à la coupure, la tête se tourne vers la fenêtre
      if (e.teteVersFenetre) spectateur.regarder([-3.4, 1.5, -0.6], e.teteVersFenetre * 0.9);
      g.updateMatrixWorld(true);
      const tete = spectateur.ou('Head');
      const bouche = new THREE.Vector3(tete.x, tete.y - 0.02, tete.z - 0.2);
      const assiette = new THREE.Vector3(0.92, 0.72, 0.15).applyMatrix4(fauteuil.matrixWorld);
      const cible = assiette.clone().lerp(bouche, v);
      cible.y += Math.sin(v * Math.PI) * 0.18;
      bras(cible);
      bouchee.visible = ph > 0.3 && ph < 0.72;
      if (montre) {
        const poignet = spectateur.ou('hand_l'), coude = spectateur.ou('lowerarm_l');
        const axe = coude.clone().sub(poignet).normalize();
        montre.position.copy(poignet).addScaledVector(axe, 0.02).add(new THREE.Vector3(0, 0.05, 0));
        montre.scale.setScalar(1.3);
        // le long du poignet, l'écran un peu tourné vers l'avant (vers qui le regarde)
        const long = new THREE.Vector3(axe.x, 0, axe.z).normalize();
        const haut = new THREE.Vector3(0, 1, -0.5).normalize();
        const cote = new THREE.Vector3().crossVectors(haut, long).normalize();
        const avant = new THREE.Vector3().crossVectors(cote, haut).normalize();
        montre.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(cote, haut, avant));
      }
      if (e.montre !== undefined && ecranMontre) ecranMontre.material.color.setScalar(e.montre);
    },
  };
}
