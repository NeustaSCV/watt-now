// La couche de déchets à l'écran (0.7, chantier 7 ; Book 26 §9.2) : le vrai rendu en AMAS, qui remplace l'affichage
// provisoire du chantier 2. Tout ce qu'on voit au sol se ramasse (décision du porteur) : chaque pièce est un objet du
// catalogue, à sa silhouette, sa teinte et sa taille (apparence.ts, silhouettes.ts), posée sur une tache de crasse.
//
// Comment c'est dessiné (mesures sur l'iPhone 13 mini du porteur, 2026-10-09) :
// - les pièces et les conteneurs des amas : un seul BatchedMesh pour tout le lieu (≈ 2 appels avec WEBGL_multi_draw,
//   écart hors champ objet par objet). Si le navigateur ne sait pas dessiner en multiple, repli : une géométrie fondue
//   par carreau de 20 m (1 appel par carreau visible) ;
// - les taches de crasse : un lot (1 appel), transparent, jamais d'ombre ;
// - l'éclat de repère : un lot (1 appel, eclats.ts) ;
// - les points du monde (vélo du fossé, trampoline…) : 1 à 3 appels chacun, avec leur ombre comme les épaves.
// Les ombres des pièces seulement en qualité haute (décision Q-G6 : elles faisaient chuter le 1 % le plus lent).
//
// Une pièce ramassée disparaît aussitôt ; un carreau renouvelé se redessine (son tirage change, sa disposition non).
// Le client reconstruit tout de la graine du lieu (commun/src/couche-dechets.ts) : le serveur n'envoie que la clé, les
// pièces prises et les points.

import * as THREE from "three";
import {
  dispositionLieu,
  lieuDeCle,
  nomConteneur,
  piecesCarreau,
  refConteneur,
  type EmplacementDechets,
  type FouilleVue,
  type PieceDechets,
  type PointDechetsVu,
  type VueDechets,
} from "../../../../commun/src/couche-dechets.ts";
import { POINTS_DECHETS, graineDe } from "../../../../commun/src/dechets.ts";
import type { MessageClient } from "../../../../commun/src/messages.ts";
import { OBJETS, nommer, type TypeObjet } from "../../../../commun/src/objets.ts";
import { DISTANCE_INTERACTION } from "../../../../commun/src/terrain.ts";
import { estOrdure } from "../../../../commun/src/vestiges.ts";
import { icone } from "../../icones.ts";
import type { ActionProposee, Propositions } from "../../interaction.ts";
import { AMBIANCE } from "../ciel.ts";
import { aleatoire } from "../materiaux.ts";
import { apparenceDe, type Silhouette } from "./apparence.ts";
import { Eclats } from "./eclats.ts";
import { HAUTEUR_CONTENEUR, geometriesConteneurs, modelePoint, type ModelePoint } from "./points.ts";
import { construireSilhouette } from "./silhouettes.ts";

/** L'éclat se voit à moins de 8 m de jour ; la nuit, seulement dans la lumière qu'on porte, à moins de 4 m (Q-G3). */
const PORTEE_ECLAT = 8;
const PORTEE_ECLAT_NUIT = 4;
/** Au-delà de cette part de nuit (ou dans une pièce noire), on passe aux règles de la nuit. */
const SEUIL_NUIT = 0.5;

/** Ce qui se tient debout (on ne le penche pas) : un fût, un cône, un caddie. */
const DEBOUT: ReadonlySet<Silhouette> = new Set(["pot", "cone", "grille", "barbecue"]);

/** Comment dessiner les pièces : un lot unique (BatchedMesh), ou une géométrie fondue par carreau (repli). */
export type ModeDessinDechets = "lot" | "fusion";

export interface OptionsCoucheDechets {
  /** Le navigateur sait dessiner en multiple (WEBGL_multi_draw) : le lot unique tient en ≈ 2 appels. */
  multiDraw: boolean;
  /** Les pièces portent une ombre (qualité haute seulement). */
  ombresPieces: boolean;
  /** Les points du monde portent une ombre (dès que les ombres sont là, comme les épaves). */
  ombresPoints: boolean;
}

/** Ce que le mode mesure lit de la couche (`?mesure=1`). */
export interface BilanCoucheDechets {
  mode: ModeDessinDechets;
  multiDraw: boolean;
  pieces: number;
  amas: number;
  conteneurs: number;
  points: number;
  /** Triangles de toutes les pièces posées (pas seulement celles à l'écran). */
  triangles: number;
  geometries: number;
  ombresPieces: boolean;
  /** Durée de la dernière construction complète (ms). */
  construction: number;
}

interface EtatCarreauVu {
  r: number;
  pris: Set<number>;
  pieces: PieceDechets[];
}

/** Une chose dessinée dans le lot : sa géométrie (clé) et sa place. */
interface Pose {
  geometrie: string;
  matrice: THREE.Matrix4;
}

const BLANC = new THREE.Color(1, 1, 1);

/** La forme d'une tache de crasse : un polygone arrondi et irrégulier (rayon ≈ 1), mis à l'échelle de l'amas. */
function formeTache(): THREE.BufferGeometry {
  const al = aleatoire(17);
  const n = 14;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 0.8 + 0.2 * Math.sin(a * 3 + 1.3) + (al() - 0.5) * 0.18;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r * 0.85));
  }
  return new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
}

export class CoucheDechetsVue {
  readonly objet = new THREE.Group();
  private cle: string | null = null;
  private terrain = false;
  private readonly carreaux = new Map<string, EtatCarreauVu>();
  private points: PointDechetsVu[] = [];
  private readonly envoyer: (m: MessageClient) => void;
  private readonly panneau: HTMLElement;
  private readonly options: OptionsCoucheDechets;
  private mode: ModeDessinDechets;

  // ---- Le dessin ----
  private readonly materiau = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05, flatShading: true });
  private readonly geometries = new Map<string, THREE.BufferGeometry>();
  /** Le haut de chaque géométrie (pour l'éclat), et la tête lumineuse de la balise. */
  private readonly hauteurs = new Map<string, number>();
  private lot: THREE.BatchedMesh | null = null;
  private capaciteSommets = 0;
  private readonly idsGeometries = new Map<string, number>();
  /** Ce qui est posé, par carreau : clé de la pose → pose (et son instance dans le lot). */
  private readonly poses = new Map<string, Map<string, Pose & { id: number }>>();
  /** Le repli : une géométrie fondue par carreau. */
  private readonly fondus = new Map<string, THREE.Mesh>();
  private taches: THREE.InstancedMesh;
  private readonly eclats = new Eclats();
  private readonly groupePoints = new THREE.Group();
  private readonly modelesPoints = new Map<string, ModelePoint & { type: string }>();
  private bilanCourant: BilanCoucheDechets;

  // ---- L'animation ----
  private temps = 0;
  private prochainEclat = 0;
  /** La pièce visée (son liseré bat avec l'anneau) : carreau, clé de pose. */
  private visee: { k: string; pose: string } | null = null;
  private candidate: { k: string; pose: string } | null = null;
  private liseree: number | null = null;

  constructor(envoyer: (m: MessageClient) => void, hud: HTMLElement, options: OptionsCoucheDechets) {
    this.envoyer = envoyer;
    this.options = options;
    this.mode = options.multiDraw ? "lot" : "fusion";
    this.panneau = document.createElement("div");
    this.panneau.className = "fouille-dechets";
    this.panneau.hidden = true;
    this.panneau.setAttribute("role", "dialog");
    hud.appendChild(this.panneau);
    this.objet.name = "déchets";
    const t = new THREE.MeshStandardMaterial({ color: 0x3a3328, roughness: 1, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.taches = new THREE.InstancedMesh(formeTache(), t, 1);
    this.taches.count = 0;
    this.taches.receiveShadow = true;
    this.objet.add(this.taches, this.eclats.maillage, this.groupePoints);
    this.bilanCourant = this.bilanVide();
  }

  // ---------- Ce que dit le serveur ----------

  /** L'entrée dans un lieu : on reconstruit tout de la graine. */
  installer(vue: VueDechets | undefined): void {
    const t0 = performance.now();
    this.cle = vue?.cle ?? null;
    this.terrain = vue ? lieuDeCle(vue.cle) === "terrain" : false;
    this.carreaux.clear();
    this.points = vue?.points ?? [];
    this.fouille(null);
    this.visee = null;
    this.candidate = null;
    if (vue) {
      const pris = new Map(vue.carreaux.map(([cx, cz, r, p]) => [`${cx},${cz}`, { r, p }]));
      for (const k of dispositionLieu(vue.cle).keys()) {
        const [cx, cz] = k.split(",").map(Number) as [number, number];
        const etat = pris.get(k) ?? { r: 0, p: [] };
        this.carreaux.set(k, { r: etat.r, pris: new Set(etat.p), pieces: piecesCarreau(vue.cle, cx, cz, etat.r) });
      }
    }
    this.toutRedessiner();
    this.bilanCourant.construction = performance.now() - t0;
  }

  majCarreau(cx: number, cz: number, r: number, pris: number[]): void {
    if (!this.cle) return;
    const k = `${cx},${cz}`;
    const e = this.carreaux.get(k);
    this.carreaux.set(k, { r, pris: new Set(pris), pieces: e && e.r === r ? e.pieces : piecesCarreau(this.cle, cx, cz, r) });
    this.dessinerCarreau(k);
    this.dessinerTaches();
    this.majBilan();
  }

  majPoint(p: PointDechetsVu): void {
    this.points = [...this.points.filter((q) => q.id !== p.id), p];
    this.dessinerPoints();
    this.majBilan();
  }

  // ---------- Le dessin ----------

  /** La géométrie d'une clé (« o:canette », « c:sac_poubelle:plein:0 »), construite à la première demande. */
  private geometrie(cle: string): THREE.BufferGeometry {
    let g = this.geometries.get(cle);
    if (g) return g;
    if (cle.startsWith("c:")) {
      for (const [k, gc] of geometriesConteneurs()) {
        this.geometries.set(`c:${k}`, gc);
        this.hauteurs.set(`c:${k}`, k.includes(":plein:") ? HAUTEUR_CONTENEUR : 0.1);
      }
      g = this.geometries.get(cle);
      if (!g) throw new Error(`conteneur inconnu : ${cle}`);
      return g;
    }
    const objet = cle.slice(2) as TypeObjet;
    const a = apparenceDe(objet, OBJETS[objet].poids);
    g = construireSilhouette(a.s, a.t, a.a, a.e, graineDe("silhouette", objet) % 1000);
    this.geometries.set(cle, g);
    this.hauteurs.set(cle, g.boundingBox!.max.y);
    return g;
  }

  /** Ce qu'il faut poser dans un carreau, d'après son tirage et ce qui a été pris. */
  private posesCarreau(k: string): Map<string, Pose> {
    const poses = new Map<string, Pose>();
    const e = this.carreaux.get(k);
    if (!e || !this.cle) return poses;
    const emplacements = dispositionLieu(this.cle).get(k) ?? [];
    const restes = new Map<number, number>();
    const q = new THREE.Quaternion();
    const eul = new THREE.Euler();
    const un = new THREE.Vector3(1, 1, 1);
    for (const p of e.pieces) {
      if (p.dedans) {
        restes.set(p.e, (restes.get(p.e) ?? 0) + (e.pris.has(p.i) ? 0 : 1));
        continue;
      }
      if (e.pris.has(p.i)) continue;
      const geometrie = `o:${p.objet}`;
      const al = aleatoire(graineDe("pose", k, p.i, p.objet));
      const s = apparenceDe(p.objet, OBJETS[p.objet].poids).s;
      const penche = DEBOUT.has(s) ? 0 : 0.14;
      eul.set((al() - 0.5) * penche, al() * Math.PI * 2, (al() - 0.5) * penche);
      poses.set(`p${p.i}`, { geometrie, matrice: new THREE.Matrix4().compose(new THREE.Vector3(p.x, -0.006, p.z), q.setFromEuler(eul), un) });
    }
    // Les conteneurs : pleins, ou vidés (et alors effacés du terrain personnel, qui ne se renouvelle pas).
    for (const em of emplacements) {
      if (em.genre === "sol" || em.genre === "coffre_voiture") continue;
      const n = restes.get(em.e) ?? 0;
      if (n === 0 && this.terrain) continue;
      const variante = em.genre === "sac_poubelle" ? graineDe("sac", k, em.e) % 3 === 0 ? 1 : 0 : 0;
      const geometrie = `c:${em.genre}:${n > 0 ? "plein" : "vide"}:${variante}`;
      poses.set(`c${em.e}:${n > 0 ? 1 : 0}`, { geometrie, matrice: new THREE.Matrix4().compose(new THREE.Vector3(em.x, -0.005, em.z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), em.o), un) });
    }
    return poses;
  }

  private toutRedessiner(): void {
    // On repart de zéro : le lot, les fondus, les taches, les points.
    if (this.lot) {
      this.objet.remove(this.lot);
      this.lot.dispose();
      this.lot = null;
    }
    this.idsGeometries.clear();
    this.poses.clear();
    for (const m of this.fondus.values()) {
      this.objet.remove(m);
      m.geometry.dispose();
    }
    this.fondus.clear();
    this.liseree = null;
    if (this.cle) {
      const toutes = new Map<string, Map<string, Pose>>();
      let instances = 0;
      let sommets = 0;
      const vues = new Set<string>();
      for (const k of this.carreaux.keys()) {
        const p = this.posesCarreau(k);
        toutes.set(k, p);
        instances += p.size;
        for (const pose of p.values()) {
          if (vues.has(pose.geometrie)) continue;
          vues.add(pose.geometrie);
          sommets += this.geometrie(pose.geometrie).getAttribute("position")!.count;
        }
      }
      if (this.mode === "lot") {
        // De la marge : un renouvellement amène d'autres objets, donc d'autres géométries.
        this.capaciteSommets = Math.max(30_000, sommets * 2);
        this.lot = new THREE.BatchedMesh(Math.max(64, Math.ceil(instances * 1.5)), this.capaciteSommets, 0, this.materiau);
        this.lot.name = "pièces";
        this.lot.sortObjects = false;
        this.lot.castShadow = this.options.ombresPieces;
        this.lot.receiveShadow = true;
        this.objet.add(this.lot);
      }
      for (const [k, p] of toutes) this.dessinerCarreau(k, p);
    }
    this.dessinerTaches();
    this.dessinerPoints();
    this.majBilan();
  }

  /** L'instance d'une géométrie dans le lot (le lot grandit au besoin). */
  private idGeometrie(cle: string): number {
    const lot = this.lot!;
    let id = this.idsGeometries.get(cle);
    if (id !== undefined) return id;
    const g = this.geometrie(cle);
    const n = g.getAttribute("position")!.count;
    if (lot.unusedVertexCount < n) {
      this.capaciteSommets = this.capaciteSommets * 2 + n;
      lot.setGeometrySize(this.capaciteSommets, 0);
    }
    id = lot.addGeometry(g);
    this.idsGeometries.set(cle, id);
    return id;
  }

  /** Redessine un carreau : on retire ce qui n'y est plus, on ajoute ce qui est nouveau. */
  private dessinerCarreau(k: string, voulues = this.posesCarreau(k)): void {
    if (this.mode === "fusion") {
      this.fondre(k, voulues);
      return;
    }
    const lot = this.lot;
    if (!lot) return;
    const actuelles = this.poses.get(k) ?? new Map<string, Pose & { id: number }>();
    for (const [cle, pose] of actuelles) {
      const v = voulues.get(cle);
      if (v && v.geometrie === pose.geometrie) continue;
      lot.deleteInstance(pose.id);
      if (this.liseree === pose.id) this.liseree = null;
      actuelles.delete(cle);
    }
    for (const [cle, pose] of voulues) {
      if (actuelles.has(cle)) continue;
      const g = this.idGeometrie(pose.geometrie);
      if (lot.instanceCount >= lot.maxInstanceCount) lot.setInstanceCount(lot.maxInstanceCount * 2);
      const id = lot.addInstance(g);
      lot.setMatrixAt(id, pose.matrice);
      lot.setColorAt(id, BLANC);
      actuelles.set(cle, { ...pose, id });
    }
    this.poses.set(k, actuelles);
  }

  /** Le repli sans dessin multiple : toutes les poses d'un carreau fondues en une géométrie (1 appel). */
  private fondre(k: string, voulues: Map<string, Pose>): void {
    const ancien = this.fondus.get(k);
    if (ancien) {
      this.objet.remove(ancien);
      ancien.geometry.dispose();
      this.fondus.delete(k);
    }
    this.poses.set(k, new Map([...voulues].map(([c, p]) => [c, { ...p, id: -1 }])));
    if (voulues.size === 0) return;
    let total = 0;
    for (const p of voulues.values()) total += this.geometrie(p.geometrie).getAttribute("position")!.count;
    const pos = new Float32Array(total * 3);
    const nor = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);
    const v = new THREE.Vector3();
    const n = new THREE.Vector3();
    const normale = new THREE.Matrix3();
    let o = 0;
    for (const p of voulues.values()) {
      const g = this.geometrie(p.geometrie);
      const gp = g.getAttribute("position")!;
      const gn = g.getAttribute("normal")!;
      const gc = g.getAttribute("color")!;
      normale.getNormalMatrix(p.matrice);
      for (let i = 0; i < gp.count; i++, o += 3) {
        v.fromBufferAttribute(gp, i).applyMatrix4(p.matrice);
        n.fromBufferAttribute(gn, i).applyMatrix3(normale).normalize();
        pos.set([v.x, v.y, v.z], o);
        nor.set([n.x, n.y, n.z], o);
        col.set([gc.getX(i), gc.getY(i), gc.getZ(i)], o);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, this.materiau);
    m.name = "pièces";
    m.castShadow = this.options.ombresPieces;
    m.receiveShadow = true;
    this.fondus.set(k, m);
    this.objet.add(m);
  }

  /** Une tache de crasse sous chaque amas qui garde au moins une pièce, et sous chaque conteneur plein. */
  private dessinerTaches(): void {
    const liste: { x: number; z: number; r: number; o: number }[] = [];
    if (this.cle) {
      for (const [k, e] of this.carreaux) {
        const emplacements = dispositionLieu(this.cle).get(k) ?? [];
        const restes = new Set<number>();
        for (const p of e.pieces) if (!e.pris.has(p.i)) restes.add(p.e);
        for (const em of emplacements) {
          if (!restes.has(em.e) || em.genre === "coffre_voiture") continue;
          liste.push({ x: em.x, z: em.z, r: rayonAmas(em), o: em.o });
        }
      }
    }
    if (liste.length > this.taches.instanceMatrix.count) {
      const ancien = this.taches;
      const nouveau = new THREE.InstancedMesh(ancien.geometry, ancien.material, Math.ceil(liste.length * 1.5));
      nouveau.receiveShadow = true;
      this.objet.remove(ancien);
      ancien.dispose();
      this.taches = nouveau;
      this.objet.add(nouveau);
    }
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const axe = new THREE.Vector3(0, 1, 0);
    liste.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, 0.012, t.z), q.setFromAxisAngle(axe, t.o), new THREE.Vector3(t.r, 1, t.r));
      this.taches.setMatrixAt(i, m);
    });
    this.taches.count = liste.length;
    this.taches.instanceMatrix.needsUpdate = true;
    this.taches.computeBoundingSphere();
  }

  /** Les points du monde : là, ou vidés (le contenu part), ou partis (démontés, emportés). */
  private dessinerPoints(): void {
    const vus = new Set<string>();
    for (const p of this.points) {
      const fouille = POINTS_DECHETS[p.type].verbe === "fouiller";
      if (!p.dispo && !fouille) continue;
      vus.add(p.id);
      let m = this.modelesPoints.get(p.id);
      if (!m || m.type !== p.type) {
        if (m) this.groupePoints.remove(m.objet);
        m = { ...modelePoint(p.type, this.options.ombresPoints), type: p.type };
        this.modelesPoints.set(p.id, m);
        this.groupePoints.add(m.objet);
      }
      m.objet.position.set(p.x, 0, p.z);
      m.objet.rotation.y = p.o;
      const plein = p.dispo && (!fouille || (p.reste ?? 0) > 0);
      if (m.contenu) m.contenu.visible = plein;
      // Un coffre vidé : il n'en reste rien au sol (l'épave, elle, est toujours là).
      m.objet.visible = plein || m.contenu !== null && m.objet.children.length > 1;
    }
    for (const [id, m] of this.modelesPoints) {
      if (vus.has(id)) continue;
      this.groupePoints.remove(m.objet);
      this.modelesPoints.delete(id);
    }
  }

  // ---------- L'image ----------

  /**
   * À chaque image : l'éclat de repère (à moins de 8 m ; la nuit, seulement dans la lumière qu'on porte, à moins de
   * 4 m ; les balises solaires s'allument), et le liseré de la pièce visée.
   */
  animer(dt: number, joueur: { x: number; z: number } | null, lumiere: boolean): void {
    this.temps += dt;
    this.eclats.animer(this.temps);
    this.animerLiseré();
    if (this.temps < this.prochainEclat) return;
    this.prochainEclat = this.temps + 0.15;
    const nuit = AMBIANCE.noir > SEUIL_NUIT;
    const portee = nuit ? (lumiere ? PORTEE_ECLAT_NUIT : 0) : PORTEE_ECLAT;
    const liste: { x: number; y: number; z: number; phase: number; lueur: boolean; d: number }[] = [];
    if (!joueur || !this.cle) {
      this.eclats.poser([]);
      return;
    }
    const pres = (x: number, z: number) => Math.hypot(x - joueur.x, z - joueur.z);
    const v = new THREE.Vector3();
    for (const [k, poses] of this.poses) {
      const [cx, cz] = k.split(",").map(Number) as [number, number];
      // Un carreau loin de tout : on ne regarde pas ses pièces (sauf les balises, la nuit).
      const loin = Math.max(Math.abs((cx + 0.5) * 20 - joueur.x), Math.abs((cz + 0.5) * 20 - joueur.z)) > 10 + PORTEE_ECLAT;
      if (loin && !nuit) continue;
      for (const [cle, pose] of poses) {
        const x = pose.matrice.elements[12]!;
        const z = pose.matrice.elements[14]!;
        const d = pres(x, z);
        const phase = (graineDe(k, cle) % 997) / 997;
        if (nuit && pose.geometrie === "o:balise_solaire") {
          // La tête de la balise, au bout de la barre couchée.
          v.set(this.geometrie(pose.geometrie).boundingBox!.max.x - 0.02, 0.05, 0).applyMatrix4(pose.matrice);
          liste.push({ x: v.x, y: v.y + 0.05, z: v.z, phase, lueur: true, d: -1 });
        }
        if (d > portee || pose.geometrie.includes(":vide:")) continue;
        liste.push({ x, y: (this.hauteurs.get(pose.geometrie) ?? 0.2) + 0.12, z, phase, lueur: false, d });
      }
    }
    for (const [id, m] of this.modelesPoints) {
      const p = this.points.find((q) => q.id === id);
      if (!p || !p.dispo || (POINTS_DECHETS[p.type].verbe === "fouiller" && (p.reste ?? 0) <= 0)) continue;
      const d = pres(p.x, p.z);
      if (d - 0.8 > portee) continue;
      liste.push({ x: p.x, y: m.hauteur + 0.15, z: p.z, phase: (graineDe(id) % 997) / 997, lueur: false, d });
    }
    // Les plus proches d'abord (le lot a une limite) ; les lueurs de balise passent avant tout.
    liste.sort((a, b) => a.d - b.d);
    this.eclats.poser(liste);
  }

  /** Dit à la couche si sa proposition a été retenue : la pièce visée bat alors avec l'anneau. */
  cibler(retenue: boolean): void {
    this.visee = retenue ? this.candidate : null;
  }

  private animerLiseré(): void {
    const lot = this.lot;
    if (!lot || this.mode !== "lot") return;
    const pose = this.visee ? this.poses.get(this.visee.k)?.get(this.visee.pose) : undefined;
    const id = pose?.id ?? null;
    if (this.liseree !== null && this.liseree !== id) lot.setColorAt(this.liseree, BLANC);
    this.liseree = id;
    if (id === null) return;
    const k = 1.15 + 0.3 * (0.5 + 0.5 * Math.sin(this.temps * 7));
    lot.setColorAt(id, new THREE.Color(k, k, k));
  }

  // ---------- Ce qu'on peut faire ----------

  /** Ce qu'on peut faire de la couche à portée de main : la cible la plus proche, et sa distance. */
  proposer(position: { x: number; z: number }): { distance: number; propositions: Propositions } | null {
    if (!this.cle) return null;
    let meilleure: { distance: number; propositions: Propositions; vise: { k: string; pose: string } | null } | null = null;
    const garder = (x: number, z: number, rayon: number, A: ActionProposee | null, B: ActionProposee, vise: { k: string; pose: string } | null) => {
      const d = Math.max(0, Math.hypot(x - position.x, z - position.z) - rayon);
      if (d > DISTANCE_INTERACTION || (meilleure && d >= meilleure.distance)) return;
      meilleure = { distance: d, propositions: { A, B, cible: { x, z, rayon: Math.max(0.35, rayon) } }, vise };
    };
    const op = (o: Extract<MessageClient, { t: "dechets" }>["op"]): MessageClient => ({ t: "dechets", op: o });
    for (const [k, e] of this.carreaux) {
      const [cx, cz] = k.split(",").map(Number) as [number, number];
      const restes = new Map<number, { x: number; z: number; n: number }>();
      for (const p of e.pieces) {
        if (p.dedans) {
          const c = restes.get(p.e) ?? { x: p.x, z: p.z, n: 0 };
          if (!e.pris.has(p.i)) c.n++;
          restes.set(p.e, c);
          continue;
        }
        if (e.pris.has(p.i)) continue;
        const nom = OBJETS[p.objet].nom;
        garder(
          p.x,
          p.z,
          0.1,
          { libelle: `Ramasser : ${nom}`, message: op({ genre: "ramasser", cx, cz, i: p.i }) },
          { libelle: "Examiner", examiner: `${OBJETS[p.objet].description}${estOrdure(p.objet) ? " Rien d'utile." : ""}` },
          { k, pose: `p${p.i}` },
        );
      }
      const emplacements = dispositionLieu(this.cle).get(k) ?? [];
      for (const [em, c] of restes) {
        const genre = emplacements[em]?.genre;
        if (!genre || genre === "sol") continue;
        if (c.n > 0) {
          garder(c.x, c.z, 0.4, { libelle: `Fouiller : ${nomConteneur(genre)}`, message: op({ genre: "fouiller", ref: refConteneur(cx, cz, em) }) }, { libelle: "Examiner", examiner: POINTS_DECHETS[genre].examen }, null);
        } else if (!this.terrain) {
          // Vidé, il reste là jusqu'à ce que le carreau se remplisse : on peut seulement le regarder.
          garder(c.x, c.z, 0.4, null, { libelle: "Examiner", examiner: `Un ${nomConteneur(genre)}, déjà fouillé. Il n'y a plus rien dedans… pour l'instant.` }, null);
        }
      }
    }
    for (const p of this.points) {
      if (!p.dispo) continue;
      const d = POINTS_DECHETS[p.type];
      const ref = `p:${p.id}`;
      const A: ActionProposee = { libelle: d.verbe === "fouiller" ? `${d.libelle} (${p.reste ?? 0})` : d.libelle, message: op(d.verbe === "fouiller" ? { genre: "fouiller", ref } : { genre: "demonter", ref }) };
      garder(p.x, p.z, p.type === "trampoline" ? 1.2 : 0.6, A, { libelle: "Examiner", examiner: d.examen }, null);
    }
    const m = meilleure as { distance: number; propositions: Propositions; vise: { k: string; pose: string } | null } | null;
    this.candidate = m?.vise ?? null;
    return m ? { distance: m.distance, propositions: m.propositions } : null;
  }

  /** La liste du conteneur fouillé (null : refermée). On choisit ce qu'on prend ; le reste reste dedans. */
  fouille(f: FouilleVue | null): void {
    const p = this.panneau;
    if (!f) {
      p.hidden = true;
      p.innerHTML = "";
      return;
    }
    p.hidden = false;
    const objets = f.objets
      .map(
        (o) =>
          `<button type="button" class="${estOrdure(o.objet) ? "ordure" : ""}" data-i="${o.i}">${icone(o.objet, 30)}<span>${nommer(o.objet, 1)}<small>${String(Math.round(OBJETS[o.objet].poids * 100) / 100).replace(".", ",")} kg</small></span></button>`,
      )
      .join("");
    p.innerHTML = `<header><h2>${f.nom[0]!.toUpperCase()}${f.nom.slice(1)}</h2><button type="button" class="fermer" aria-label="Fermer">✕</button></header>${
      objets ? `<div class="liste">${objets}</div><p class="indice">Touche ce que tu prends ; le reste reste là.</p>` : `<p class="indice">Plus rien dedans.</p>`
    }`;
    p.querySelector(".fermer")!.addEventListener("click", () => {
      this.envoyer({ t: "dechets", op: { genre: "fermer" } });
      this.fouille(null);
    });
    for (const b of p.querySelectorAll<HTMLButtonElement>("button[data-i]")) {
      b.addEventListener("click", () => this.envoyer({ t: "dechets", op: { genre: "prendre", ref: f.ref, i: Number(b.dataset.i) } }));
    }
  }

  // ---------- Le mode mesure ----------

  /** Change la façon de dessiner (lot unique ou fusion par carreau) et l'ombre des pièces, pour comparer. */
  regler(r: { mode?: ModeDessinDechets; ombresPieces?: boolean }): void {
    if (r.mode) this.mode = r.mode;
    if (r.ombresPieces !== undefined) this.options.ombresPieces = r.ombresPieces;
    const t0 = performance.now();
    this.toutRedessiner();
    this.bilanCourant.construction = performance.now() - t0;
  }

  bilan(): BilanCoucheDechets {
    return this.bilanCourant;
  }

  private bilanVide(): BilanCoucheDechets {
    return { mode: this.mode, multiDraw: this.options.multiDraw, pieces: 0, amas: 0, conteneurs: 0, points: 0, triangles: 0, geometries: 0, ombresPieces: this.options.ombresPieces, construction: 0 };
  }

  private majBilan(): void {
    const b = this.bilanVide();
    b.construction = this.bilanCourant.construction;
    const amas = new Set<string>();
    for (const [k, poses] of this.poses) {
      for (const [cle, pose] of poses) {
        b.triangles += this.geometrie(pose.geometrie).getAttribute("position")!.count / 3;
        if (cle.startsWith("c")) b.conteneurs++;
        else b.pieces++;
      }
      const e = this.carreaux.get(k);
      if (e) for (const p of e.pieces) if (!p.dedans && !e.pris.has(p.i)) amas.add(`${k}:${p.e}`);
    }
    b.amas = amas.size;
    b.points = this.modelesPoints.size;
    b.geometries = this.mode === "lot" ? this.idsGeometries.size : this.geometries.size;
    this.bilanCourant = b;
  }
}

/** Le rayon de la tache d'un amas : selon le nombre de pièces (un conteneur : la taille d'un sac crevé). */
function rayonAmas(em: EmplacementDechets): number {
  if (em.genre !== "sol") return 0.55;
  return 0.35 + Math.min(4, em.n) * 0.13;
}

