// Les variantes d'Éteints de la Coopérative (Book 23 §3, Book 06 §5) : pas de mutants, des corps différents.
// - l'Équipé : un casque de moto intégral, la visière arrachée (on voit les yeux blancs), un blouson de cuir ; la
//   tête protégée doit se lire du premier coup d'œil ;
// - le Rampant : couché sur le ventre, il se traîne ; l'herbe frémit autour de lui (Book 23 : « signalé par l'herbe
//   qui bouge ») ;
// - le magasinier : la blouse grise du magasin, son badge, la chaînette des clés à la ceinture (la clé du coffre) ;
// - le mécanicien : la combinaison bleue tachée d'huile, un chiffon rouge à la poche.
// Les accessoires sont moulés sur le corps au repos (Mesure) et fondus par os (Assemblage) : un ou deux appels de
// dessin par os, quelques centaines de triangles par variante. Sans variante, c'est l'Errant, inchangé.
// Ceux de la côte (0.10, chantier G), plus bas : le Noyé, gonflé, pâle et luisant ; l'Ensablé, à moitié sous le sable.

import * as THREE from "three";
import type { VarianteEteint } from "../../../commun/src/eteints.ts";
import { Mesure, pan } from "./accessoires.ts";
import { Assemblage, V3, materiauSommets, placer } from "./assemblage.ts";
import { aleatoire } from "./materiaux.ts";
import type { Humanoide, Tenue } from "./humanoides.ts";

/** Le gris de la blouse du magasinier (la veste ; ses pans sont un peu plus clairs, ils n'ont pas le grain du tissu). */
const GRIS_BLOUSE = 0x5f6569;

/** La tenue d'une variante, à partir de celle qu'on aurait tirée pour un Errant (même tirage, couleurs remplacées). */
export function tenueDeVariante(v: VarianteEteint, base: Tenue): Tenue {
  switch (v) {
    case "equipe":
      // Le blouson de cuir brun-noir, le jean, les bottes. (Pas de gants : la pièce des mains coûte trop de triangles.)
      return { ...base, haut: 0x3a2a22, manche: 0x3a2a22, bas: 0x3c4f6e, pieds: 0x1d1b19, mains: null, dechirures: 0.16 };
    case "magasinier":
      return { ...base, haut: GRIS_BLOUSE, manche: GRIS_BLOUSE, bas: 0x3a4658, pieds: 0x2a2622, dechirures: 0.2 };
    case "mecanicien":
      // La combinaison : haut et bas du même bleu de travail.
      return { ...base, haut: 0x2c4f86, manche: 0x2c4f86, bas: 0x2a4a7e, pieds: 0x1d1b19, mains: null, dechirures: 0.2 };
    case "rampant":
      // Il a traîné sur le sol : plus déchiré, pieds nus.
      return { ...base, pieds: 0x6b6a5a, dechirures: 0.55 };
    case "noye":
      // Trempé depuis des semaines : les couleurs délavées, passées au gris-vert de vase ; les manches parties, les
      // habits craqués de partout sur la peau tendue (la chair blême déborde), pieds nus.
      return { ...base, haut: detrempe(base.haut), manche: null, bas: detrempe(base.bas), pieds: PEAU_NOYE, dechirures: 0.8 };
    case "ensable":
      // Le sable s'est collé partout : les couleurs ternies, tirées vers le sable ; pieds nus.
      return { ...base, haut: ensable(base.haut), manche: base.manche === null ? null : ensable(base.manche), bas: ensable(base.bas), pieds: 0x9c8f72, dechirures: 0.55 };
  }
}

/** Les mesures du corps, pour mouler les accessoires (à prendre au repos, avant la première animation). */
function mesurer(corps: Humanoide): Mesure {
  return new Mesure(corps.points());
}

/** Les accessoires d'une variante, accrochés aux os du corps. */
export function habillerVariante(corps: Humanoide, v: VarianteEteint, graine: number): void {
  // Le Noyé et l'Ensablé n'ont pas d'accessoire : leur corps suffit (eteint.ts : la carrure, la peau, la butte).
  if (v === "rampant" || v === "noye" || v === "ensable") return;
  const m = mesurer(corps);
  const coller = (a: Assemblage, os: string) => corps.accrocher(a.groupe(), os);
  const bassin = corps.repere("pelvis");
  const torse = corps.repere("spine_03");
  const cou = corps.repere("neck_01");
  const genou = corps.repere("calf_l");
  const hancheD = corps.repere("thigh_r");
  const cote = Math.sign(hancheD.x) || -1;

  if (v === "equipe") {
    coller(casque(m, corps.repere("Head").y, graine), "Head");
  } else if (v === "magasinier") {
    // La blouse : la veste grise, et ses pans qui descendent à mi-cuisse, devant et derrière.
    const a = new Assemblage(graine);
    const gris = 0x6d7377;
    const y0 = bassin.y + 0.13;
    const y1 = (bassin.y + genou.y) / 2 - 0.02;
    const o = { courbure: 1.2, evase: 0.3, ecart: 0.022, lignes: 4, colonnes: 6 };
    const tmp = new THREE.MeshBasicMaterial();
    a.ajouter(pan(m, y0, y1, 0.165, tmp, o).geometry, gris, "toile", 0.03);
    // Derrière : le même pan, taillé sur le corps vu de dos, puis retourné.
    const dos = new Mesure(corps.points().map((p) => new THREE.Vector3(p.x, p.y, -p.z)));
    a.ajouter(pan(dos, y0, y1, 0.165, tmp, o).geometry.scale(1, 1, -1), gris, "toile", 0.03);
    // La chaînette des clés : de la ceinture à la hanche, en boucle ; le trousseau pend au plus bas.
    // Par-dessus le pan de la blouse (même calcul que pan() : le point le plus en avant sur sa largeur, puis l'arrondi).
    const zDe = (y: number, x: number) => Math.max(m.devant(y, x, 0.045, 0.03), m.devant(y, 0, 0.165 * 1.1 * 0.8) - 1.2 * x * x) + 0.045;
    const accroche = new V3(cote * 0.05, bassin.y + 0.05, zDe(bassin.y + 0.05, cote * 0.05));
    const bas = new V3(cote * 0.105, bassin.y - 0.1, zDe(bassin.y - 0.1, cote * 0.1) + 0.01);
    const hanche = new V3(cote * 0.16, bassin.y + 0.03, zDe(bassin.y + 0.03, cote * 0.14) - 0.03);
    const chaine = new THREE.CatmullRomCurve3([accroche, new V3((accroche.x + bas.x) / 2, bassin.y - 0.05, (accroche.z + bas.z) / 2 + 0.005), bas, new V3((bas.x + hanche.x) / 2, bassin.y - 0.04, (bas.z + hanche.z) / 2), hanche]);
    a.ajouter(new THREE.TubeGeometry(chaine, 12, 0.0045, 4), 0xc9ccd0, "metal");
    a.ajouter(placer(new THREE.TorusGeometry(0.022, 0.0045, 3, 8), bas.x, bas.y - 0.02, bas.z), 0xc9ccd0, "metal");
    // Le trousseau : la grosse clé de laiton du coffre, et une autre.
    a.ajouter(placer(new THREE.BoxGeometry(0.016, 0.07, 0.005), bas.x - 0.006, bas.y - 0.075, bas.z + 0.004, 0, 0, 0.18), 0xd8ae3c, "metal");
    a.ajouter(placer(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 8).rotateX(Math.PI / 2), bas.x - 0.001, bas.y - 0.042, bas.z + 0.004), 0xd8ae3c, "metal");
    a.ajouter(placer(new THREE.BoxGeometry(0.012, 0.05, 0.004), bas.x + 0.012, bas.y - 0.06, bas.z - 0.002, 0, 0, -0.3), 0xb8bcc0, "metal");
    coller(a, "pelvis");
    // Le badge du magasin sur la poitrine : blanc, bandeau vert de la coopérative.
    const b = new Assemblage(graine + 1);
    const yb = cou.y - 0.06;
    const xb = -cote * 0.09;
    const zb = m.devant(yb, xb, 0.03, 0.02) + 0.03;
    b.ajouter(placer(new THREE.BoxGeometry(0.085, 0.05, 0.008), xb, yb, zb, -0.45, 0, 0), 0xeeebe2, "mat");
    b.ajouter(placer(new THREE.BoxGeometry(0.087, 0.016, 0.009), xb, yb + 0.018, zb + 0.002, -0.45, 0, 0), 0x2f6b3a, "mat");
    coller(b, "spine_03");
  } else {
    // Le mécanicien : des taches d'huile sur la combinaison (cuisses, ventre, poitrine), un chiffon rouge.
    const huile = [0x15171b, 0x24211c];
    const cuisseD = new Assemblage(graine);
    tacheHuile(cuisseD, m, hancheD.x * 0.95, bassin.y - 0.2, 0.06, graine, huile[0]!);
    tacheHuile(cuisseD, m, hancheD.x * 1.05, genou.y + 0.12, 0.035, graine + 1, huile[1]!);
    coller(cuisseD, "thigh_r");
    const cuisseG = new Assemblage(graine + 2);
    tacheHuile(cuisseG, m, -hancheD.x, bassin.y - 0.3, 0.045, graine + 3, huile[0]!);
    coller(cuisseG, "thigh_l");
    const buste = new Assemblage(graine + 4);
    tacheHuile(buste, m, cote * 0.05, bassin.y + 0.14, 0.065, graine + 5, huile[1]!);
    tacheHuile(buste, m, -cote * 0.08, torse.y + 0.02, 0.04, graine + 6, huile[0]!);
    coller(buste, "spine_03");
    // Le chiffon rouge, qui pend de la poche arrière.
    const ch = new Assemblage(graine + 7);
    const yc = bassin.y - 0.04;
    const zc = m.derriere(yc, cote * 0.09, 0.04, 0.03) - 0.018;
    const chiffon = new THREE.PlaneGeometry(0.09, 0.17, 1, 2);
    const p = chiffon.getAttribute("position");
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.abs(p.getY(i) + 0.085) < 0.01 ? -0.02 : 0);
    ch.ajouter(placer(chiffon, cote * 0.09, yc - 0.06, zc, 0.12, 0, cote * 0.15), 0xb0372a, "toile");
    coller(ch, "pelvis");
  }
}

/**
 * Le casque intégral : une coque rouge à bande claire, la visière arrachée (un éclat fumé reste relevé sur le front),
 * la mousse sombre à l'intérieur. La face est ouverte : les yeux blancs restent visibles.
 */
function casque(m: Mesure, teteY: number, graine: number): Assemblage {
  const a = new Assemblage(graine);
  const h = m.sommet() - teteY;
  const t = m.tranche(teteY + h * 0.45, 0.02);
  const rx = t.rx + 0.05;
  const rz = t.rz + 0.05;
  const ry = h * 0.62;
  const cy = teteY + h * 0.46;
  const ROUGE = 0x9a2422;
  const coque = new THREE.SphereGeometry(1, 14, 10).toNonIndexed();
  const p = coque.getAttribute("position");
  const dehors: number[] = [];
  const dedans: number[] = [];
  const c = new V3();
  for (let i = 0; i < p.count; i += 3) {
    c.set(0, 0, 0);
    for (let j = 0; j < 3; j++) c.add(new V3(p.getX(i + j), p.getY(i + j), p.getZ(i + j)));
    c.divideScalar(3);
    // La face (la visière a sauté), et le passage du cou.
    if ((c.z > 0.4 && c.y > -0.45 && c.y < 0.36) || c.y < -0.8) continue;
    for (let j = 0; j < 3; j++) dehors.push(p.getX(i + j) * rx + t.cx, p.getY(i + j) * ry + cy, p.getZ(i + j) * rz + t.cz);
    // La mousse, dessous : les mêmes facettes un peu en retrait, retournées (on la voit par l'ouverture).
    for (const j of [0, 2, 1]) dedans.push(p.getX(i + j) * rx * 0.96 + t.cx, p.getY(i + j) * ry * 0.96 + cy, p.getZ(i + j) * rz * 0.96 + t.cz);
  }
  coque.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(dehors, 3));
  a.ajouter(g, ROUGE, "tole", 0.03);
  // Une bande claire sur le dessus, du front à la nuque, posée sur la coque.
  for (const [phi, theta0, theta1] of [[Math.PI / 2, 0, 0.75], [(3 * Math.PI) / 2, 0, 1.9]] as const) {
    const bande = new THREE.SphereGeometry(1, 2, 8, phi - 0.13, 0.26, theta0, theta1 - theta0);
    bande.scale(rx * 1.012, ry * 1.012, rz * 1.012).translate(t.cx, cy, t.cz);
    a.ajouter(bande, 0xe2ddcf, "tole");
  }
  a.triangles(dedans, 0x1e1c1b, "mat");
  // L'éclat de visière fumée, resté relevé sur le front.
  const eclat = new THREE.SphereGeometry(1, 6, 2, Math.PI / 2 - 0.85, 1.25, 0.42, 0.42);
  eclat.scale(rx * 1.05, ry * 1.05, rz * 1.05).translate(t.cx, cy, t.cz);
  a.ajouter(eclat, 0x1f2a33, "verre");
  return a;
}

/** Une tache d'huile irrégulière posée sur le devant du corps, autour de (x, y). */
function tacheHuile(a: Assemblage, m: Mesure, x: number, y: number, r: number, graine: number, couleur: number): void {
  let s = graine * 9301 + 49297;
  const hasard = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const z = (xx: number, yy: number) => m.devant(yy, xx, 0.035, 0.025) + 0.03;
  const centre = new V3(x, y, z(x, y));
  const n = 8;
  const bord: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const k = r * (0.6 + 0.5 * hasard());
    const xx = x + Math.cos(ang) * k;
    const yy = y + Math.sin(ang) * k * 1.2;
    bord.push(new V3(xx, yy, Math.min(z(xx, yy), centre.z + 0.02)));
  }
  const pos: number[] = [];
  for (let i = 0; i < n; i++) {
    const p1 = bord[i]!;
    const p2 = bord[(i + 1) % n]!;
    pos.push(centre.x, centre.y, centre.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
  }
  a.triangles(pos, couleur, "toile");
}

/**
 * L'herbe qui frémit autour du Rampant : quelques touffes, un seul maillage ; le frémissement est fait dans le
 * nuanceur (chaque brin plie selon sa hauteur), réglé à chaque image par `animer` (ampleur 0 : immobile).
 */
export function herbeDuRampant(graine: number): { objet: THREE.Mesh; animer: (dt: number, ampleur: number) => void } {
  const a = new Assemblage(graine);
  let s = graine;
  const hasard = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const HERBES = [0x7fa35a, 0x9aa65e, 0x5f7f45];
  for (const [x, z] of [[0.36, 0.5], [-0.34, 0.2], [0.32, -0.3], [-0.3, -0.6], [0.05, 1.05], [-0.12, -0.98], [0.42, 0.05]] as const) {
    // Une touffe : quelques brins fins, verts et secs mêlés, qui penchent un peu.
    for (let i = 0; i < 5; i++) {
      const h = 0.18 + hasard() * 0.16;
      const brin = new THREE.ConeGeometry(0.012 + hasard() * 0.01, h, 3, 1, true).translate(0, h / 2, 0);
      a.ajouter(placer(brin, x + (hasard() - 0.5) * 0.16, 0, z + (hasard() - 0.5) * 0.16, (hasard() - 0.5) * 0.6, hasard() * 6, (hasard() - 0.5) * 0.6), HERBES[i % 3]!);
    }
  }
  const [maillage] = a.maillages();
  const m = maillage!;
  const temps = { value: 0 };
  const ampleur = { value: 0 };
  const mat = materiauSommets("mat").clone();
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTemps = temps;
    shader.uniforms.uAmpleur = ampleur;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTemps;\nuniform float uAmpleur;").replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      float plie = uAmpleur * max(position.y, 0.0) / 0.3;
      transformed.x += sin(uTemps * 11.0 + position.z * 13.0 + position.x * 5.0) * plie * 0.12;
      transformed.z += cos(uTemps * 8.0 + position.x * 17.0) * plie * 0.1;`,
    );
  };
  mat.customProgramCacheKey = () => "herbe-rampant";
  m.material = mat;
  m.castShadow = false;
  let actuelle = 0;
  return {
    objet: m,
    animer: (dt, voulue) => {
      actuelle += (voulue - actuelle) * Math.min(1, dt * 4);
      temps.value += dt;
      ampleur.value = actuelle;
    },
  };
}

/**
 * Le rampement, fait à la main (la bibliothèque n'a pas d'animation de rampement) : le corps part de sa pose de repos
 * (droit, bras en croix), on le couche sur le ventre (VueEteint), et chaque image on oriente quelques os.
 * Les rotations sont données dans le repère du personnage debout (X : sa gauche, Y : le haut, Z : devant) ; une fois
 * couché, Y pointe vers l'avant du rampement et Z vers le sol. Les bras tirent le corps chacun son tour, coudes
 * pliés vers le sol ; les jambes traînent, un genou se plie de temps en temps ; la tête se relève pour regarder devant.
 */
export class Rampement {
  private readonly os = new Map<string, { os: THREE.Bone; repos: THREE.Quaternion; versPerso: THREE.Quaternion; depuisPerso: THREE.Quaternion }>();
  private phase = 0;
  private readonly q = new THREE.Quaternion();
  private readonly r = new THREE.Quaternion();
  private readonly d = new THREE.Vector3();

  /** À créer au repos, avant de coucher le corps. */
  constructor(corps: Humanoide) {
    corps.objet.updateMatrixWorld(true);
    const racine = corps.objet.getWorldQuaternion(new THREE.Quaternion()).invert();
    for (const nom of ["spine_01", "spine_03", "neck_01", "Head", "upperarm_l", "upperarm_r", "lowerarm_l", "lowerarm_r", "thigh_l", "thigh_r", "calf_l", "calf_r", "foot_l", "foot_r"]) {
      const os = corps.osNomme(nom);
      if (!os) continue;
      const perso = racine.clone().multiply(os.getWorldQuaternion(new THREE.Quaternion()));
      this.os.set(nom, { os, repos: os.quaternion.clone(), versPerso: perso, depuisPerso: perso.clone().invert() });
    }
  }

  /** Tourne un os de `rot` (repère du personnage debout), à partir de sa pose de repos. */
  private tourner(nom: string, rot: THREE.Quaternion): void {
    const o = this.os.get(nom);
    if (!o) return;
    o.os.quaternion.copy(o.repos).multiply(this.q.copy(o.depuisPerso).multiply(rot).multiply(o.versPerso));
  }

  /** Oriente un os qui, au repos, pointe selon `de`, pour qu'il pointe selon `vers` (repère du personnage). */
  private pointer(nom: string, de: THREE.Vector3, vers: THREE.Vector3): void {
    this.tourner(nom, this.r.setFromUnitVectors(de, this.d.copy(vers).normalize()));
  }

  /** `allure` : 0 immobile, 1 rampement normal ; `agite` : il saisit (les bras griffent, vite). */
  animer(dt: number, allure: number, agite: boolean): void {
    this.phase += dt * (agite ? 9 : 1.6 + allure * 2.4) * (allure > 0 || agite ? 1 : 0);
    const X = new THREE.Vector3(1, 0, 0);
    const MX = new THREE.Vector3(-1, 0, 0);
    for (const [cote, s] of [["l", 1], ["r", -1]] as const) {
      // Chaque bras : tendu loin devant (il agrippe), puis ramené près de l'épaule (il tire).
      const t = 0.5 + 0.5 * Math.sin(this.phase + (s > 0 ? 0 : Math.PI));
      const loin = new THREE.Vector3(s * 0.38, 0.86, 0.3);
      const pres = new THREE.Vector3(s * 0.8, 0.28, 0.52);
      this.pointer(`upperarm_${cote}`, s > 0 ? X : MX, pres.lerp(loin, t));
      // Le coude plié vers le sol, plus quand le bras est ramené.
      this.pointer(`lowerarm_${cote}`, s > 0 ? X : MX, new THREE.Vector3(s * (0.75 + 0.2 * t), 0, 0.65 - 0.35 * t));
      // Les jambes traînent, un peu écartées ; le genou se plie quand le bras opposé tire.
      const genou = 0.15 + 0.5 * Math.max(0, Math.sin(this.phase + (s > 0 ? Math.PI : 0))) * Math.min(1, allure);
      this.tourner(`thigh_${cote}`, this.r.setFromAxisAngle(new THREE.Vector3(0, 0, 1), s * 0.12));
      this.tourner(`calf_${cote}`, this.r.setFromAxisAngle(X, genou));
      // Les pieds à plat, orteils au sol.
      this.tourner(`foot_${cote}`, this.r.setFromAxisAngle(X, -0.5));
    }
    // Le buste se tord un peu à chaque traction ; la tête se relève et regarde devant.
    this.tourner("spine_01", this.r.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(this.phase) * 0.12 * Math.min(1, allure + (agite ? 1 : 0))));
    this.tourner("spine_03", this.r.setFromAxisAngle(X, -0.12));
    this.tourner("neck_01", this.r.setFromAxisAngle(X, -0.6));
    this.tourner("Head", this.r.setFromAxisAngle(X, -0.5));
  }
}

// ---------- Le Noyé et l'Ensablé (0.10, chantier G ; S-31 à S-33) ----------
// Rien que des réglages du corps (sa peau, sa carrure, ses valeurs de matériau) et, pour l'Ensablé, une butte de sable :
// ni matériau ni lumière de plus par Éteint. Les petits effets (les fluides, la flaque, la bouffée de sable) ont une
// géométrie et un matériau partagés par tous, comme la poussière de la chute (eteint-au-sol.ts).

/** La peau du Noyé : blême, tirant sur le bleu-vert (la lumière du jour la fait luire, `LUISANCE_NOYE`). */
export const PEAU_NOYE = 0xd4e2e6;
/** La peau de l'Ensablé : grise, poudrée de sable. */
export const PEAU_ENSABLE = 0x939a86;
/**
 * Le Noyé gonflé : un peu plus large en tout (`large`, `epais`), et surtout le ventre, les cuisses et les bras enflés
 * (`ENFLURE`, os par os). Il se dégonfle en crevant (`apres`), en `crevaison` secondes, après un dernier gonflement.
 */
export const GONFLE = { large: 1.4, epais: 1.38, apres: { large: 1, epais: 0.95 }, crevaison: 0.45, gonflement: 0.1 };
/**
 * L'enflure, os par os : l'os s'élargit en travers (pas en longueur) de ce facteur. Ses enfants nommés retrouvent la
 * largeur qu'on leur veut (la leur, ou 1) : sans ça, tout le haut du corps suivrait le ventre, et il aurait l'air
 * costaud, pas gonflé.
 */
const ENFLURE: [os: string, facteur: number, enfants: string[]][] = [
  // Le ventre en tonneau, la poitrine et les épaules bouffies.
  ["spine_01", 1.05, ["spine_02"]],
  ["spine_02", 0.85, ["spine_03"]],
  ["spine_03", 0.5, ["neck_01", "clavicle_l", "clavicle_r"]],
  ["clavicle_l", 0.3, ["upperarm_l"]],
  ["clavicle_r", 0.3, ["upperarm_r"]],
  // Le cou et le visage bouffis.
  ["neck_01", 0.8, ["Head"]],
  ["Head", 0.32, []],
  // Les cuisses et les bras boudinés, les mains enflées.
  ["thigh_l", 0.7, ["calf_l"]],
  ["thigh_r", 0.7, ["calf_r"]],
  ["calf_l", 0.45, ["foot_l"]],
  ["calf_r", 0.45, ["foot_r"]],
  ["foot_l", 0.2, []],
  ["foot_r", 0.2, []],
  ["upperarm_l", 0.65, ["lowerarm_l"]],
  ["upperarm_r", 0.65, ["lowerarm_r"]],
  ["lowerarm_l", 0.5, ["hand_l"]],
  ["lowerarm_r", 0.5, ["hand_r"]],
  ["hand_l", 0.45, []],
  ["hand_r", 0.45, []],
];

/**
 * Gonfle le corps du Noyé (`k` : 1 gonflé, 0 dégonflé) : chaque os d'ENFLURE s'élargit en travers de son axe (celui qui
 * mène à son enfant), et ses enfants compensent ce qu'ils en héritent. Rien que l'échelle des os : ni matériau ni
 * maillage en plus. La tête garde son agrandissement (les proportions du jeu, Humanoide).
 */
export function gonfler(corps: Humanoide, k: number): void {
  const voulu = (nom: string) => 1 + (ENFLURE.find(([n]) => n === nom)?.[1] ?? 0) * k;
  const parent = new Map<string, string>();
  for (const [nom, , enfants] of ENFLURE) for (const e of enfants) parent.set(e, nom);
  for (const nom of new Set([...ENFLURE.map(([n]) => n), ...parent.keys()])) {
    const os = corps.osNomme(nom);
    if (!os) continue;
    // L'axe de l'os : vers son premier enfant (sa longueur ne change pas).
    const enfant = os.children.find((c) => (c as THREE.Bone).isBone);
    const a = enfant?.position ?? new THREE.Vector3(0, 1, 0);
    const ax = Math.abs(a.x);
    const ay = Math.abs(a.y);
    const az = Math.abs(a.z);
    const axe = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
    const p = parent.get(nom);
    const f = voulu(nom) / (p ? voulu(p) : 1);
    const base = (os.userData.echelleRepos as number | undefined) ?? (os.userData.echelleRepos = os.scale.y);
    os.scale.setScalar(base);
    for (const i of [0, 1, 2]) if (i !== axe) os.scale.setComponent(i, base * f);
  }
}

/**
 * Le Noyé luit (peau mouillée, vêtements trempés) : une matité négative, passée au matériau du corps (Humanoide.ternir) ;
 * 0 : la matière d'origine. Détruit, le corps redevient mat avec les autres (eteint-au-sol.ts).
 */
export const LUISANCE_NOYE = 0.5;
/** L'Ensablé qui dort : le corps enfoncé de tant (m) sous le sol ; la butte de sable couvre les jambes et les reins. */
export const ENFOUI = 0.15;

const SABLE = new THREE.Color(0xc9b68c);
const VASE = new THREE.Color(0x8e9a88);
const _c = new THREE.Color();

/**
 * Une couleur de vêtement restée des semaines dans l'eau : délavée, passée au gris-vert de vase claire (plus claire
 * que sombre : la forme gonflée doit se lire de haut, sur un petit écran).
 */
function detrempe(c: number): number {
  return _c.setHex(c).lerp(VASE, 0.6).getHex();
}

/** Une couleur de vêtement couverte de sable. */
function ensable(c: number): number {
  return _c.setHex(c).multiplyScalar(0.6).lerp(SABLE, 0.25).getHex();
}

let butte: THREE.BufferGeometry | null = null;
/**
 * La butte de l'Ensablé (son repère : z vers sa tête, le sol à y = 0) : des mottes de sable aplaties, sur les jambes et
 * les reins ; la tête, les épaules et les bras restent dehors. Une géométrie pour tous.
 */
export function butteDeSable(graine: number): THREE.Mesh {
  if (!butte) {
    const a = new Assemblage(91);
    const h = aleatoire(4111);
    const TONS = [0xcdb98f, 0xbfa97c, 0xd6c49b];
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      // De ses pieds (z ≈ − 0,9) à ses reins (z ≈ 0,35) : plus haute sur le dos, plus étalée aux pieds.
      const z = -0.95 + t * 1.3;
      const x = (h() - 0.5) * 0.5;
      const r = 0.22 + h() * 0.14;
      const haut = 0.12 + 0.12 * Math.sin(Math.PI * Math.min(1, t * 1.2)) + h() * 0.04;
      a.ajouter(placer(new THREE.IcosahedronGeometry(1, 1).scale(r * 1.3, haut, r * 1.5), x, 0, z, 0, h() * 3, 0), TONS[i % 3]!, "sol", 0.05);
    }
    // Un bourrelet de chaque côté, et le sable qui recouvre un peu une épaule.
    for (const [x, z, r] of [[0.32, -0.3, 0.24], [-0.34, -0.1, 0.22], [0.28, 0.45, 0.16]] as const) {
      a.ajouter(placer(new THREE.IcosahedronGeometry(1, 1).scale(r, 0.09, r * 1.4), x, 0, z), TONS[1]!, "sol", 0.05);
    }
    butte = a.maillages()[0]!.geometry;
  }
  const m = new THREE.Mesh(butte, materiauSommets("sol"));
  m.rotation.y = ((graine % 7) - 3) * 0.04;
  m.castShadow = false;
  m.receiveShadow = true;
  return m;
}

/** Les petits effets partagés : une géométrie et un matériau chacun, créés au premier besoin. */
let effets: { gouttes: THREE.BufferGeometry; flaque: THREE.BufferGeometry; bouffee: THREE.BufferGeometry; fluide: THREE.Material; mare: THREE.Material; sable: THREE.Material } | null = null;
function effetsPartages(): NonNullable<typeof effets> {
  if (effets) return effets;
  const h = aleatoire(733);
  // Les fluides : une gerbe de gouttes, qui partent du ventre (y ≈ 1) dans toutes les directions.
  const gouttes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + h() * 0.4;
    const r = 0.2 + h() * 0.35;
    gouttes.push(new THREE.IcosahedronGeometry(0.02 + h() * 0.025, 0).translate(Math.cos(ang) * r, (h() - 0.3) * 0.35, Math.sin(ang) * r));
  }
  const g = new Assemblage(3);
  for (const x of gouttes) g.ajouter(x, 0x4f5c26, "verre", 0.08);
  // La flaque, au sol : une tache irrégulière (un disque aux bords tirés au hasard).
  const n = 18;
  const pos: number[] = [];
  const bord = Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2;
    const k = 0.7 + h() * 0.45;
    return [Math.cos(ang) * k, Math.sin(ang) * k] as const;
  });
  for (let i = 0; i < n; i++) {
    const [x1, z1] = bord[i]!;
    const [x2, z2] = bord[(i + 1) % n]!;
    pos.push(0, 0, 0, x2, 0, z2, x1, 0, z1);
  }
  const flaque = new THREE.BufferGeometry();
  flaque.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  flaque.computeVertexNormals();
  // La bouffée de sable quand l'Ensablé surgit : des mottes claires qui s'écartent, comme la poussière de la chute.
  const s = new Assemblage(7);
  for (let i = 0; i < 9; i++) {
    const ang = (i / 9) * Math.PI * 2 + h() * 0.5;
    s.ajouter(new THREE.IcosahedronGeometry(0.08 + h() * 0.05, 0).scale(1.4, 0.6, 1.4).translate(Math.cos(ang) * 0.5, 0.08, Math.sin(ang) * 0.5), 0xd2c29c, "mat", 0.06);
  }
  effets = {
    gouttes: g.maillages()[0]!.geometry,
    flaque,
    bouffee: s.maillages()[0]!.geometry,
    fluide: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.85, depthWrite: false }),
    mare: new THREE.MeshStandardMaterial({ color: 0x2f3524, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.6, depthWrite: false }),
    sable: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, transparent: true, opacity: 0.55, depthWrite: false }),
  };
  return effets;
}

/**
 * Le Noyé crève (S-32) : une gerbe de fluides qui part du ventre et retombe, puis une flaque sombre qui s'étale sous lui
 * et reste avec le corps (elle part avec lui). Pas de feu, pas d'éclair : les gaz crèvent la peau. `animer(dt)` à
 * chaque image.
 */
export function crevaison(parent: THREE.Object3D, x: number, z: number): { animer: (dt: number) => void } {
  const e = effetsPartages();
  const gerbe = new THREE.Mesh(e.gouttes, e.fluide);
  gerbe.position.set(x, 0.95, z);
  gerbe.renderOrder = 2;
  gerbe.castShadow = false;
  const mare = new THREE.Mesh(e.flaque, e.mare);
  mare.position.set(x, 0.025, z);
  mare.renderOrder = 1;
  mare.scale.setScalar(0.01);
  parent.add(gerbe, mare);
  let t = 0;
  return {
    animer: (dt) => {
      t += dt;
      // La gerbe s'ouvre vite et retombe en 0,7 s ; la flaque s'étale en 1,5 s, jusqu'à ≈ 1,6 m de large.
      if (gerbe.parent) {
        const k = Math.min(1, t / 0.7);
        const ecart = 1 + 3 * (1 - Math.pow(1 - k, 3));
        gerbe.scale.set(ecart, Math.max(0.01, 1 + 2 * k - 3.2 * k * k), ecart);
        gerbe.position.y = Math.max(0.05, 0.95 + 0.6 * k - 1.6 * k * k);
        if (k >= 1) parent.remove(gerbe);
      }
      mare.scale.setScalar(Math.max(0.01, 0.8 * (1 - Math.pow(1 - Math.min(1, t / 1.5), 2))));
    },
  };
}

/** L'Ensablé surgit : une bouffée de sable qui s'écarte et retombe ; rend false une fois finie (et s'est retirée). */
export function bouffeeDeSable(parent: THREE.Object3D, x: number, z: number): (dt: number) => boolean {
  const e = effetsPartages();
  const m = new THREE.Mesh(e.bouffee, e.sable);
  m.position.set(x, 0, z);
  m.renderOrder = 1;
  m.castShadow = false;
  parent.add(m);
  let t = 0;
  return (dt) => {
    t += dt;
    const k = Math.min(1, t / 1.2);
    const ecart = 0.8 + 1.4 * (1 - Math.pow(1 - k, 3));
    m.scale.set(ecart, Math.max(0.01, Math.sin(Math.PI * Math.min(1, k * 1.1)) * 1.6), ecart);
    if (k < 1) return true;
    parent.remove(m);
    return false;
  };
}
