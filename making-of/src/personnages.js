/* Watt Now? — making-of : le personnage, époque par époque. Toutes ses versions marchent du même pas (la même
   phase des mêmes gestes, temps.js), au même endroit : en traversant la vague, il change de corps sans broncher.
   0. le prototype : une capsule et un nez, qui glisse en se dandinant (refait : avant l'historique Git)
   1. le bonhomme en blocs : des pavés posés sur le squelette animé (refait)
   2. la pâte grise : le corps du jeu, sans couleurs ni cheveux
   3. la tenue voltaïque : bleu de travail et bande réfléchissante, sans accessoires
   4 à 7. le personnage du jeu, Voltaïque (lampe frontale, câble, batterie), qui change d'apparence ;
   7. et 8. les cheveux bleus. */

import { THREE, Personnage, PALETTE, APPARENCES_DE_REFERENCE, CARNATIONS } from '../vendor/rendu-jeu.js';
import { civil, Acteur } from '../intro-copie/acteurs.js';
import { CLIPS, ARRET, allure } from './temps.js';

/** Les apparences successives du Voltaïque (époques 4 à 7) ; la dernière a les cheveux bleus. */
export const APPARENCES = [
  APPARENCES_DE_REFERENCE.voltaiques,
  { silhouette: 'feminine', taille: 0.35, corpulence: 0.4, peau: 1, coiffure: 'raie', cheveux: 3, barbe: false },
  { silhouette: 'masculine', taille: 0.7, corpulence: 0.65, peau: 3, coiffure: 'courts', cheveux: 4, barbe: true },
  { silhouette: 'feminine', taille: 0.55, corpulence: 0.45, peau: 2, coiffure: 'longs', cheveux: 0, teinteCheveux: '#3d8bff', barbe: false },
];

const TENUE_VOLTAIQUE = { haut: PALETTE.bleuTravail, manche: PALETTE.bleuTravail, bas: 0x2f3b4f, pieds: 0x23262b, mains: null, bande: { couleur: PALETTE.jauneReflechissant, de: 0.62, a: 0.65 } };
const GRIS = 0xa7a39c;

/** Les gestes de déplacement d'un corps, prêts à être mélangés à la main (poids et instant fixés à chaque image). */
function gestes(corps, autres = []) {
  corps.mixer.stopAllAction();
  const a = {};
  for (const n of [...CLIPS, ...autres]) {
    const x = corps.action(n);
    if (!x) continue;
    x.play(); x.setEffectiveWeight(0); x.timeScale = 0;
    a[n] = x;
  }
  return a;
}
function poser(corps, actions, t, geste = null) {
  // un geste par-dessus l'allure (la fin : il sort son arme) prend sa part du poids
  const plus = geste ? geste(t) : [];
  const reste = 1 - Math.min(1, plus.reduce((a, g) => a + g.poids, 0));
  for (const { nom, poids, instant } of [...allure(t).map((g) => ({ ...g, poids: g.poids * reste })), ...plus]) {
    const x = actions[nom];
    if (!x) continue;
    x.enabled = poids > 1e-3;
    x.setEffectiveWeight(poids);
    const d = x.getClip().duration;
    x.time = ((instant % d) + d) % d;
  }
  corps.mixer.update(0);
}

/** Un corps animé (Humanoide ou Personnage), qui marche à l'allure du film (et fait un geste, s'il en a un). */
function anime(acteur, geste = null, autres = []) {
  const actions = gestes(acteur.corps, autres);
  return {
    objet: acteur.objet,
    corps: acteur.corps,
    maj(t) { poser(acteur.corps, actions, t, geste); },
  };
}

/* ---------------------------------------------------------------- 0. Le prototype */
function prototype() {
  const objet = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0x8aa4c8, flatShading: true });
  const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.0, 2, 7), mat);
  corps.position.y = 0.8;
  const nez = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.12), new THREE.MeshLambertMaterial({ color: 0xe0523a, flatShading: true }));
  nez.position.set(0, 1.42, 0.3);
  objet.add(corps, nez);
  objet.traverse((n) => { if (n.isMesh) n.castShadow = n.receiveShadow = true; });
  return {
    objet,
    maj(t) {
      // il glisse, sans jambes : un petit dandinement, de quoi voir qu'il avance
      const ph = allure(t)[1].instant * Math.PI * 2 / 1.07;
      corps.position.y = 0.8 + Math.abs(Math.sin(ph)) * 0.05;
      corps.rotation.z = Math.sin(ph) * 0.06;
      nez.position.y = 1.42 + Math.abs(Math.sin(ph)) * 0.05;
    },
  };
}

/* ---------------------------------------------------------------- 1. Le bonhomme en blocs */
const SEGMENTS = [
  // [os de départ, os d'arrivée, épaisseur (m)]
  ['pelvis', 'neck_01', 0.3], ['upperarm_l', 'lowerarm_l', 0.1], ['lowerarm_l', 'hand_l', 0.085], ['upperarm_r', 'lowerarm_r', 0.1],
  ['lowerarm_r', 'hand_r', 0.085], ['thigh_l', 'calf_l', 0.13], ['calf_l', 'foot_l', 0.11], ['thigh_r', 'calf_r', 0.13], ['calf_r', 'foot_r', 0.11],
  ['foot_l', 'ball_l', 0.1], ['foot_r', 'ball_r', 0.1],
];
function blocs() {
  const squelette = civil({ genre: 'homme', hauteur: 1.75, coiffure: null });
  squelette.objet.traverse((n) => { if (n.isMesh || n.isSkinnedMesh) n.visible = false; });
  const anim = anime(squelette);
  const objet = new THREE.Group();
  objet.add(squelette.objet);
  const mat = new THREE.MeshLambertMaterial({ color: 0xd9a066, flatShading: true });
  const matTete = new THREE.MeshLambertMaterial({ color: 0xe8b67c, flatShading: true });
  const pieces = SEGMENTS.filter(([a, b]) => squelette.os(a) && squelette.os(b)).map(([a, b, e]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(e, 1, e * (a === 'pelvis' ? 0.65 : 1)), mat);
    m.castShadow = m.receiveShadow = true;
    objet.add(m);
    return { a: squelette.os(a), b: squelette.os(b), m };
  });
  const tete = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.27, 0.25), matTete);
  tete.castShadow = true;
  objet.add(tete);
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0), inv = new THREE.Matrix4();
  const qOs = new THREE.Quaternion(), qObj = new THREE.Quaternion();
  return {
    objet,
    maj(t) {
      anim.maj(t);
      objet.updateMatrixWorld(true);
      inv.copy(objet.matrixWorld).invert();
      objet.getWorldQuaternion(qObj).invert();
      for (const p of pieces) {
        p.a.getWorldPosition(pa).applyMatrix4(inv);
        p.b.getWorldPosition(pb).applyMatrix4(inv);
        const l = pa.distanceTo(pb);
        p.m.position.copy(pa).add(pb).multiplyScalar(0.5);
        p.m.scale.set(1, Math.max(0.01, l + 0.02), 1);
        // l'axe du pavé suit l'os ; sa rotation propre suit celle de l'os (sinon les pavés tournoient)
        p.a.getWorldQuaternion(qOs).premultiply(qObj);
        p.m.quaternion.setFromUnitVectors(haut, pb.sub(pa).normalize());
        const avant = new THREE.Vector3(0, 0, 1).applyQuaternion(qOs);
        const tourne = new THREE.Vector3(0, 0, 1).applyQuaternion(p.m.quaternion);
        const axe = new THREE.Vector3(0, 1, 0).applyQuaternion(p.m.quaternion);
        avant.sub(axe.clone().multiplyScalar(avant.dot(axe)));
        if (avant.lengthSq() > 1e-6) p.m.rotateY(Math.atan2(tourne.clone().cross(avant).dot(axe), tourne.dot(avant.normalize())));
      }
      const os = squelette.os('Head');
      os.getWorldPosition(pa).applyMatrix4(inv);
      os.getWorldQuaternion(qOs).premultiply(qObj);
      tete.position.copy(pa).add(new THREE.Vector3(0, 0.11, 0.02));
      tete.quaternion.slerpQuaternions(new THREE.Quaternion(), qOs, 0.35);
    },
  };
}

/* ---------------------------------------------------------------- 2 et 3. Le corps du jeu, sans le personnage */
function pateGrise() {
  return anime(civil({ genre: 'homme', peau: GRIS, tenue: { haut: GRIS, manche: GRIS, bas: GRIS, pieds: GRIS, mains: null }, coiffure: null, hauteur: 1.78, graine: 4 }));
}
function tenueVoltaique() {
  return anime(civil({ genre: 'homme', peau: CARNATIONS[5], tenue: TENUE_VOLTAIQUE, coiffure: 'buzzedfemale', cheveux: 0x1c1714, hauteur: 1.77, graine: 5 }));
}

/* ---------------------------------------------------------------- 4 à 7. Le personnage du jeu */
function voltaique(apparence) {
  const p = new Personnage('voltaiques', apparence);
  return anime(new Acteur(p.objet, p.corps, p));
}

/* ---------------------------------------------------------------- La fin : il sort son arme */
/** Arrêté, tourné vers la mer, il va chercher derrière sa hanche la matraque électrique des Voltaïques (« la Raquette »,
 *  Book 25 §5.3) et la lève devant lui, en garde. Le bras est mené par cinématique inverse (Acteur.atteindre). */
export const DEGAINE = { debut: ARRET + 0.35, sortie: ARRET + 0.8, garde: ARRET + 1.25 };
const fondu = (t, a, b) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
function degainer(apparence) {
  const p = new Personnage('voltaiques', apparence);
  const acteur = new Acteur(p.objet, p.corps, p);
  const a = anime(acteur);
  const V = () => new THREE.Vector3();
  const q = new THREE.Quaternion();
  // l'arc bleu entre les électrodes, au bout de la matraque (Book 25 §5.1 : un arc bleu, sobre), qui grésille en garde
  const arc = new THREE.Group();
  const eclat = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 1), new THREE.MeshBasicMaterial({ color: 0x8fd4ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const lueur = new THREE.PointLight(0x8fd4ff, 0, 2.5, 2);
  arc.add(eclat, lueur);
  arc.position.set(0, 0, 0.57);
  return {
    ...a,
    maj(t) {
      // les retouches de l'image précédente sont défaites avant l'animation (sinon elles s'accumulent)
      for (const [os, rq] of acteur.retouches) os.quaternion.copy(rq);
      acteur.retouches.clear();
      p.tenir(t >= DEGAINE.sortie ? 'matraque_electrique' : null);
      const arme = p.main.children[0];
      if (arme && arc.parent !== arme) arme.add(arc);
      const grille = t < DEGAINE.garde ? 0 : Math.max(0, Math.sin(t * 47) * Math.sin(t * 31 + 1) * 0.6 + 0.5) * (1 + 1.5 * Math.exp(-(t - DEGAINE.garde) * 6));
      eclat.visible = grille > 0.05;
      eclat.scale.setScalar(0.6 + grille);
      eclat.material.opacity = Math.min(1, grille);
      lueur.intensity = grille * 3;
      a.maj(t);
      const w = fondu(t, DEGAINE.debut, DEGAINE.debut + 0.3);
      if (w <= 0) return;
      acteur.objet.updateMatrixWorld(true);
      const epaule = acteur.os('upperarm_r').getWorldPosition(V());
      const torse = acteur.os('spine_03').getWorldPosition(V());
      const devant = new THREE.Vector3(0, 0, 1).applyQuaternion(acteur.objet.getWorldQuaternion(q));
      const cote = epaule.clone().sub(torse).setY(0).normalize();
      const bas = new THREE.Vector3(0, -1, 0);
      const derriere = epaule.clone().addScaledVector(devant, -0.25).addScaledVector(cote, 0.14).addScaledVector(bas, 0.58);
      const enGarde = epaule.clone().addScaledVector(devant, 0.36).addScaledVector(cote, 0.3).addScaledVector(bas, 0.12);
      const k = fondu(t, DEGAINE.sortie - 0.05, DEGAINE.garde);
      const cible = derriere.lerp(enGarde, k);
      const pole = epaule.clone().addScaledVector(cote, 0.45).addScaledVector(bas, 0.5).addScaledVector(devant, -0.3 + 0.2 * k);
      acteur.atteindre('r', cible, pole, w);
      // en garde, le poignet relève la matraque : le bout vers le haut, un peu en avant et vers l'extérieur
      if (arme && k > 0) {
        arme.updateMatrixWorld(true);
        const axe = new THREE.Vector3(0, 0, 1).transformDirection(arme.matrixWorld);
        const voulu = new THREE.Vector3(0, 1, 0).addScaledVector(devant, 0.55).addScaledVector(cote, 0.3);
        acteur._orienter(acteur.os('hand_r'), axe, voulu, k);
      }
    },
  };
}

/** Toutes les versions, rangées par époque (la dernière sert aussi à l'époque 8). */
export function creerPersonnages() {
  return [prototype(), blocs(), pateGrise(), tenueVoltaique(), ...APPARENCES.slice(0, -1).map(voltaique), degainer(APPARENCES[APPARENCES.length - 1])];
}
