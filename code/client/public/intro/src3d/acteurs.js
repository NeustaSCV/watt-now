/* Watt Now? — intro 3D : les acteurs. Ce sont les personnages du jeu (corps Quaternius retravaillés, tenues,
   accessoires de famille, bibliothèque d'animations), dirigés ici plan par plan, de façon déterministe :
   chaque acteur suit une « piste » de clips (quel geste, quand, à quelle vitesse, avec quels fondus). */

import { THREE, Personnage, Humanoide, chargerHumanoides, APPARENCES_DE_REFERENCE, GLTFLoader, MeshoptDecoder } from '../vendor/rendu-jeu.js';
import { chargerKenney, adresse } from './kenney.js';

/** Les personnages du jeu, plus les gestes que le jeu n'utilise pas encore (mêmes packs Quaternius,
 *  préparés par outils/preparer-animations.mjs) : téléphone, rambarde, arrosoir, semis, sort, frappe… */
let chargement = null;
/** o.gestes (vrai par défaut) : charger aussi les gestes de la cinématique (animations_intro_*.glb) ;
 *  l'accueil seul n'en a pas besoin, et le jeu ne sert pas ces fichiers. */
export const pret = (o = {}) => chargement || (chargement = (async () => {
  const [b] = await Promise.all([chargerHumanoides(), chargerKenney()]);
  if (o.gestes === false) return b;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const extras = await Promise.all([1, 2].map((i) => loader.loadAsync(adresse(`assets/personnages/animations_intro_${i}.glb`)).catch(() => null)));
  for (const g of extras) if (g) for (const c of g.animations) if (!b.clips.has(c.name)) b.clips.set(c.name, c);
  return b;
})());

/** Les tenues civiles de l'Âge de l'Abondance : couleurs vives de publicité, propres, neuves. */
export const TENUES_ABONDANCE = [
  { haut: 0xe46a4f, manche: 0xe46a4f, bas: 0x3d4a5c, pieds: 0xf0f0f0, mains: null },
  { haut: 0x3fb0a8, manche: null, bas: 0xe8d9b5, pieds: 0x8a5a3a, mains: null },
  { haut: 0xf2c14e, manche: 0xf2c14e, bas: 0x2f3b4f, pieds: 0xf0f0f0, mains: null },
  { haut: 0xd77fa1, manche: 0xd77fa1, bas: 0x5a6a7a, pieds: 0x2a2a2a, mains: null },
  { haut: 0xf4f4f0, manche: 0xf4f4f0, bas: 0x6a8fb0, pieds: 0xf0f0f0, mains: null },
  { haut: 0x8a5aa8, manche: null, bas: 0x3a3a46, pieds: 0xd8d8d8, mains: null },
  { haut: 0x6fbf73, manche: 0x6fbf73, bas: 0xc9b48a, pieds: 0x6b4a32, mains: null },
];
export const PEAUX = [0xf1c9a5, 0xe0ac84, 0xc68a5e, 0x9c6640, 0x7a4a2c, 0x5a3520];
export const CHEVEUX = [0x2a1d15, 0x5a3a22, 0xa8743e, 0xd9b46a, 0x8e8a85, 0xc9c4bd, 0x1a1a1a];

/** Un civil de l'Abondance (ou un Éteint, avec `eteint: true`). */
export function civil(o = {}) {
  const corps = new Humanoide({
    genre: o.genre || 'homme',
    peau: o.peau ?? PEAUX[1],
    tenue: o.tenue || TENUES_ABONDANCE[0],
    coiffure: o.coiffure === undefined ? (o.genre === 'femme' ? 'long' : 'buzzed') : o.coiffure,
    couleurCheveux: o.cheveux ?? CHEVEUX[0],
    barbe: !!o.barbe,
    tete: o.tete ?? 1.32,
    hauteur: o.hauteur ?? 1.75,
    largeur: o.largeur ?? 1,
    yeuxBlancs: !!o.eteint,
    graine: o.graine ?? 1,
  });
  return new Acteur(corps.objet, corps);
}

/** Un Éteint : peau gris-vert, yeux blancs, vêtements délavés et déchirés (Book 18 §4.3). */
export function eteint(o = {}) {
  const a = civil({
    peau: [0x8a9a7a, 0x7f8f74, 0x95a088, 0x86907c][(o.graine ?? 0) % 4],
    tenue: { haut: [0x8a5a52, 0x5a6f8c, 0xb09a6a, 0x7a4a5a, 0x4f6a72][(o.graine ?? 0) % 5], manche: null, bas: [0x34405a, 0x4a3c30, 0x2e2e32][(o.graine ?? 0) % 3], pieds: 0x2a2622, mains: null, dechirures: 0.4 },
    coiffure: ['buzzed', 'simpleparted', 'long', null][(o.graine ?? 0) % 4],
    cheveux: 0x3a3330,
    eteint: true,
    hauteur: 1.72,
    ...o,
  });
  a.lueur = a.corps.creerLueurYeux();
  if (a.lueur) { a.lueur.visible = true; a.lueur.material.opacity = 0.9; }
  return a;
}

/** Un personnage d'une famille, tel qu'il est dans le jeu (Nadia, Malik, Rose, ou l'apparence du joueur). */
export function familial(famille, apparence) {
  const p = new Personnage(famille, apparence || APPARENCES_DE_REFERENCE[famille]);
  return new Acteur(p.objet, p.corps, p);
}

export class Acteur {
  constructor(objet, corps, personnage = null) {
    this.objet = new THREE.Group();
    this.objet.add(objet);
    this.corps = corps;
    this.personnage = personnage;
    this.actions = new Map();
    this.piste = [];
    this.gestes = [];
    this.retouches = new Map();
    objet.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
  }

  /** Une arme ou un outil en main (objets du jeu : « marteau », « hache », « couteau »…). */
  tenir(objet) {
    if (this.personnage) this.personnage.tenir(objet);
    return this;
  }

  /** Un objet accroché à un os (main, tête…) : position et rotation dans le repère de l'os. */
  accrocher(objet, os, position = [0, 0, 0], rotation = [0, 0, 0], echelle = 1) {
    const b = this.corps.osNomme(os);
    if (!b) return objet;
    this.objet.updateMatrixWorld(true);
    const s = b.getWorldScale(new THREE.Vector3());
    const g = new THREE.Group();
    g.scale.set(echelle / s.x, echelle / s.y, echelle / s.z);
    g.add(objet);
    objet.position.set(...position);
    objet.rotation.set(...rotation);
    b.add(g);
    return objet;
  }

  os(nom) {
    return this.corps.osNomme(nom);
  }

  /** Position du monde d'un os (pour une lumière, une étincelle, la caméra). */
  ou(nom, cible = new THREE.Vector3()) {
    const b = this.corps.osNomme(nom);
    if (!b) return cible.copy(this.objet.position);
    b.updateWorldMatrix(true, false);
    return b.getWorldPosition(cible);
  }

  /**
   * La piste de jeu : une liste de segments { clip, de, a, vitesse = 1, depuis = 0, fondu = 0.3, boucle = true, fige }.
   * `de` et `a` en secondes de plan. Les segments peuvent se chevaucher : on fond de l'un à l'autre.
   */
  jouer(segments) {
    this.piste = segments.map((s) => ({ vitesse: 1, depuis: 0, fondu: 0.3, boucle: true, ...s }));
    // le personnage du jeu lance de lui-même son geste d'attente : on l'arrête, sinon il se mélange à la piste
    this.corps.mixer.stopAllAction();
    for (const a of this.actions.values()) { a.play(); a.setEffectiveWeight(0); a.timeScale = 0; }
    for (const s of this.piste) {
      if (this.actions.has(s.clip)) continue;
      const a = this.corps.action(s.clip);
      if (!a) { console.warn('Clip absent :', s.clip); continue; }
      a.play();
      a.setEffectiveWeight(0);
      a.timeScale = 0;
      this.actions.set(s.clip, a);
    }
    return this;
  }

  /** Applique la piste à l'instant t (secondes de plan). Un segment peut avoir `plage: [0.2, 0.7]`. */
  maj(t) {
    // le mélangeur de three.js ne réécrit un os que si sa valeur animée a changé : on rend d'abord aux os retouchés
    // leur pose animée, sinon les retouches s'accumuleraient d'une image à l'autre
    for (const [b, q] of this.retouches) b.quaternion.copy(q);
    this.retouches.clear();
    const poids = new Map();
    const temps = new Map();
    for (const s of this.piste) {
      const a = this.actions.get(s.clip);
      if (!a) continue;
      const entree = s.de <= 0 ? 1 : Math.min(1, Math.max(0, (t - s.de) / s.fondu + 1));
      const sortie = s.a === undefined ? 1 : Math.min(1, Math.max(0, (s.a - t) / s.fondu + 1));
      const w = Math.min(entree, sortie);
      if (w <= 0) continue;
      const d = a.getClip().duration;
      let x = s.depuis + Math.max(0, t - s.de) * s.vitesse;
      if (s.fige !== undefined) x = s.fige;
      if (s.plage) {   // va-et-vient dans une partie du geste (fractions de sa durée) : « rester à genoux à travailler »
        const [p0, p1] = s.plage, e = p1 - p0;
        let f = ((x / d) % (2 * e) + 2 * e) % (2 * e);
        if (f > e) f = 2 * e - f;
        x = d * (p0 + f);
      } else x = s.boucle ? ((x % d) + d) % d : Math.min(x, d - 1e-3);
      poids.set(s.clip, Math.max(poids.get(s.clip) || 0, w));
      temps.set(s.clip, x);
    }
    let total = 0;
    for (const w of poids.values()) total += w;
    for (const [clip, a] of this.actions) {
      const w = poids.get(clip) || 0;
      a.enabled = w > 0;
      a.setEffectiveWeight(total > 0 ? w / Math.max(1, total) : 0);
      if (w > 0) a.time = temps.get(clip);
    }
    this.corps.mixer.update(0);
    for (const g of this.gestes) g(t, this);
    return this;
  }

  /** Ajoute une retouche de pose, appliquée après l'animation : fn(t, acteur). */
  retoucher(fn) {
    this.gestes.push(fn);
    return this;
  }

  /** Tourne un os en plus de son animation (angles en degrés, dans son repère). */
  tourner(nom, x = 0, y = 0, z = 0) {
    const b = this.corps.osNomme(nom);
    if (!b) return;
    this._garder(b);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x * Math.PI / 180, y * Math.PI / 180, z * Math.PI / 180));
    b.quaternion.multiply(q);
  }

  /** Mémorise la retouche d'un os (pour la défaire à l'image suivante). */
  _garder(b) {
    if (!this.retouches.has(b)) this.retouches.set(b, b.quaternion.clone());
  }

  /** Tourne un os (dans le monde) pour que la direction `de` (monde) devienne `vers`, avec un poids de 0 à 1. */
  _orienter(b, de, vers, poids = 1) {
    if (!b || poids <= 0 || de.lengthSq() < 1e-10 || vers.lengthSq() < 1e-10) return;
    this._garder(b);
    const qMonde = b.getWorldQuaternion(new THREE.Quaternion());
    const delta = new THREE.Quaternion().setFromUnitVectors(de.clone().normalize(), vers.clone().normalize());
    const qParent = b.parent.getWorldQuaternion(new THREE.Quaternion());
    const voulu = qParent.invert().multiply(delta.multiply(qMonde));
    b.quaternion.slerp(voulu, Math.min(1, poids));
    b.updateMatrixWorld(true);
  }

  /** La tête (et un peu le cou) regarde un point du monde. */
  regarder(cible, poids = 1) {
    if (poids <= 0) return;
    this.objet.updateMatrixWorld(true);
    const c = new THREE.Vector3(...cible);
    for (const [nom, part] of [['neck_01', 0.4], ['Head', 1]]) {
      const b = this.corps.osNomme(nom);
      if (!b) continue;
      if (!this.avants) this.avants = new Map();
      if (!this.avants.has(nom)) continue;
      const avant = this.avants.get(nom).clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()));
      const p = b.getWorldPosition(new THREE.Vector3());
      this._orienter(b, avant, c.clone().sub(p), poids * part);
    }
  }

  /** Mémorise, au repos, l'axe « devant » de la tête et du cou (à appeler une fois, personnage construit). */
  noterRepos() {
    this.objet.updateMatrixWorld(true);
    this.avants = new Map();
    const devant = new THREE.Vector3(0, 0, 1).applyQuaternion(this.objet.getWorldQuaternion(new THREE.Quaternion()));
    for (const nom of ['neck_01', 'Head']) {
      const b = this.corps.osNomme(nom);
      if (b) this.avants.set(nom, devant.clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()));
    }
    return this;
  }

  /**
   * La main se referme (sur un manche, une poignée, une pomme…) : `force` de 0 (ouverte) à 1 (poing),
   * `pouce` de 0 à 1, `sauf` (doigts laissés tendus), `rond` (0 à 1) pour une prise en coupe (pomme, verre) plutôt qu'en poing.
   * Les phalanges sont dans l'axe Y de leur os ; elles se plient autour de leur axe X local.
   */
  serrer(cote, force = 1, o = {}) {
    if (force <= 0) return;
    const pouce = o.pouce ?? 0.7, rond = o.rond ?? 0;
    const sens = (o.sens ?? 1) * (this.sensDoigts ?? 1);
    const plis = [80 - 30 * rond, 95 - 45 * rond, 70 - 30 * rond];
    for (const [k, doigt] of ['index', 'middle', 'ring', 'pinky'].entries()) {
      if (o.sauf?.includes(doigt)) continue;   // { sauf: ['index'] } : l'index reste tendu (montrer, appuyer)
      const extra = 1 + k * 0.06;   // l'auriculaire se ferme un peu plus
      for (let i = 0; i < 3; i++) {
        const b = this.corps.osNomme(`${doigt}_0${i + 1}_${cote}`);
        if (!b) continue;
        this._garder(b);
        b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), sens * plis[i] * extra * force * Math.PI / 180));
      }
    }
    for (let i = 0; i < 3; i++) {
      const b = this.corps.osNomme(`thumb_0${i + 1}_${cote}`);
      if (!b) continue;
      this._garder(b);
      b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), sens * [25, 30, 35][i] * pouce * force * Math.PI / 180));
    }
  }

  /** Le buste se penche pour amener la base du cou vers un point du monde (réparti sur les trois vertèbres). */
  pencher(cible, poids = 1) {
    if (poids <= 0) return;
    const c = cible.isVector3 ? cible : new THREE.Vector3(...cible);
    const cou = this.corps.osNomme('neck_01');
    for (let passe = 0; passe < 3; passe++) {
      for (const [nom, part] of [['spine_01', 0.45], ['spine_02', 0.35], ['spine_03', 0.25]]) {
        const b = this.corps.osNomme(nom);
        if (!b || !cou) continue;
        this.objet.updateMatrixWorld(true);
        const o = b.getWorldPosition(new THREE.Vector3());
        this._orienter(b, cou.getWorldPosition(new THREE.Vector3()).sub(o), c.clone().sub(o), part * poids);
      }
    }
  }

  /** La jambe (cote : 'r' ou 'l') pose la cheville sur un point du monde ; le genou part vers `pole`. */
  poser(cote, cible, pole, poids = 1) {
    this._chaine(`thigh_${cote}`, `calf_${cote}`, `foot_${cote}`, cible, pole, poids);
  }

  /**
   * Le bras (cote : 'r' ou 'l') va chercher un point du monde ; le coude part vers `pole` (un point du monde).
   * Deux os, loi des cosinus, puis on oriente l'épaule et le coude.
   */
  atteindre(cote, cible, pole, poids = 1) {
    this._chaine(`upperarm_${cote}`, `lowerarm_${cote}`, `hand_${cote}`, cible, pole, poids);
  }

  /** Une chaîne de deux os (bras ou jambe), loi des cosinus. */
  _chaine(n1, n2, n3, cible, pole, poids = 1) {
    if (poids <= 0) return;
    const ep = this.corps.osNomme(n1), co = this.corps.osNomme(n2), ma = this.corps.osNomme(n3);
    if (!ep || !co || !ma) return;
    this.objet.updateMatrixWorld(true);
    const a = ep.getWorldPosition(new THREE.Vector3()), b = co.getWorldPosition(new THREE.Vector3()), c = ma.getWorldPosition(new THREE.Vector3());
    const L1 = a.distanceTo(b), L2 = b.distanceTo(c);
    const t = cible.isVector3 ? cible.clone() : new THREE.Vector3(...cible);
    let D = t.distanceTo(a);
    const dir = t.clone().sub(a).normalize();
    D = Math.min(D, (L1 + L2) * 0.999);
    const cosA = Math.min(1, Math.max(-1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)));
    const pv = (pole.isVector3 ? pole.clone() : new THREE.Vector3(...pole)).sub(a);
    const n = pv.sub(dir.clone().multiplyScalar(pv.dot(dir))).normalize();
    const coude = a.clone().add(dir.clone().multiplyScalar(L1 * cosA)).add(n.multiplyScalar(L1 * Math.sqrt(1 - cosA * cosA)));
    this._orienter(ep, b.clone().sub(a), coude.clone().sub(a), poids);
    const b2 = co.getWorldPosition(new THREE.Vector3()), c2 = ma.getWorldPosition(new THREE.Vector3());
    const fin = a.clone().add(dir.clone().multiplyScalar(D));
    this._orienter(co, c2.clone().sub(b2), fin.sub(b2), poids);
  }
}

/* ------------------------------------------------------------------ Caméra : courbes et cadrages */

/**
 * Interpolation d'un tableau de clés [t, valeur] (nombres ou tableaux) : courbe d'Hermite monotone
 * (pas de dépassement : une valeur tenue entre deux clés égales reste tenue), départ et arrivée en douceur.
 */
export function cles(liste, t) {
  const n = liste.length;
  if (t <= liste[0][0]) return liste[0][1];
  if (t >= liste[n - 1][0]) return liste[n - 1][1];
  let i = 0;
  while (t > liste[i + 1][0]) i++;
  const [t1, v1] = liste[i], [t2, v2] = liste[i + 1];
  const h = t2 - t1, k = (t - t1) / h;
  const pente = (a, b, j) => (b - a) / (liste[j + 1][0] - liste[j][0]);
  const tangente = (j, c) => {
    if (j === 0 || j === n - 1) return 0;
    const a = c(liste[j - 1][1]), b = c(liste[j][1]), d = c(liste[j + 1][1]);
    const s0 = pente(a, b, j - 1), s1 = pente(b, d, j);
    if (s0 * s1 <= 0) return 0;
    return (2 * s0 * s1) / (s0 + s1);   // moyenne harmonique : jamais de dépassement
  };
  const h00 = 2 * k * k * k - 3 * k * k + 1, h10 = k * k * k - 2 * k * k + k, h01 = -2 * k * k * k + 3 * k * k, h11 = k * k * k - k * k;
  const un = (c) => h00 * c(v1) + h10 * h * tangente(i, c) + h01 * c(v2) + h11 * h * tangente(i + 1, c);
  if (Array.isArray(v1)) return v1.map((_, j) => un((v) => v[j]));
  return un((v) => v);
}

/** Place une caméra : position, point visé, focale (mm, capteur 35 mm), roulis (degrés). */
export function cadrer(camera, pos, vise, focale = 35, roulis = 0) {
  camera.position.set(...pos);
  camera.up.set(0, 1, 0);
  camera.lookAt(...vise);
  if (roulis) camera.rotateZ(roulis * Math.PI / 180);
  const fov = 2 * Math.atan(24 / 2 / focale) * 180 / Math.PI;
  if (Math.abs(camera.fov - fov) > 1e-3) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

/** Un léger tremblé de caméra à l'épaule (déterministe). */
export function epaule(t, ampleur = 1) {
  const s = (a, b, c) => Math.sin(t * a + b) * c;
  return [
    (s(0.9, 0.3, 0.012) + s(2.3, 1.1, 0.005)) * ampleur,
    (s(1.1, 2.0, 0.01) + s(2.9, 0.7, 0.004)) * ampleur,
    (s(0.7, 4.0, 0.008)) * ampleur,
  ];
}
