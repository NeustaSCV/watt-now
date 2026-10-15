// Le phare du cap à l'écran (plan 0.10, chantier K) : le modèle de la session « bâtiments » (batiments/phare/, copié par
// `npm run batiments:importer`, jamais modifié ici), posé dans le repère du jeu, et ce que le jeu y change.
//
// - Le relief (L-1) : la fonction `hauteurSol` du modèle, importée telle quelle, donne la hauteur du sol où l'on marche
//   (le plateau à 0, la rampe du canot, la grève à − 8,8, le pont de l'épave à − 4) ; `solPhare` la lit dans le repère du
//   jeu. Le serveur reste en 2D ; client/src/phare.ts pose les personnages, les Éteints et le cercle de visée dessus.
// - Le modèle fournit son sol sur ses 60 × 50 m (`solPropre` : la falaise et la mer sont creusées) ; autour, on étend la
//   lande au nord, à l'ouest et à l'est, la mer au sud, pour que le bord du lot ne se voie pas (dans les matières du
//   modèle : aucun appel de dessin de plus).
// - Ses couches (le fût de la tour, les toits, la coque de l'épave) s'effacent quand le personnage passe dessous ou
//   derrière, comme les toits de la halte (estomperToits). Leurs hauteurs sont comptées depuis leur sol (le plateau ; la
//   grève pour la coque) : on les recompte depuis le sol du personnage (`hauteursDepuis`), sinon la coque, neuf mètres
//   plus bas, s'effaçait devant qui marche au bord de la falaise (essai sur l'iPhone, 2026-10-14).
// - Ses objets nommés (`userData.objets`) suivent l'état du phare : la lanterne éteinte ou allumée, le prisme tombé ou
//   remis, le bidon à côté de la cuve, l'escabeau (au hangar, sous l'escalier, posé ailleurs, ou dans les bras), la
//   courroie du compresseur, le harpon, l'épave et ses objets-clés.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
// @ts-ignore — le modèle est en JavaScript (session « bâtiments »), sans déclaration de types.
import { creer as creerModele, hauteurSol } from "../batiments/phare/modele.js";
import type { Boite } from "../../../commun/src/lieux.ts";
import { ECRITEAU_SENTIER, ENDROITS_PHARE, NIVEAU_MER, PHARE, auModele, dansLEauPhare, etageDuPhare, type EtatPhareVu } from "../../../commun/src/phare.ts";
import { LUMIERES_MODELE, PLACES_OBJETS } from "../../../commun/src/phare-modele.ts";
import type { TypeRessource } from "../../../commun/src/terrain.ts";
import { estomperToits, montrerTousLesToits } from "./halte.ts";
import { animerNuitPhare, creerNuitPhare } from "./phare-nuit.ts";
import { creerCloture } from "./phare-cloture.ts";
import { montrerConteneurs, ouvrirConteneurs, ouvrirLaCoupee } from "./phare-epave.ts";
import type { FeuxCargo } from "../phare-scene.ts";
import type { SourceLumiere } from "./lumieres.ts";
import { nommer } from "./materiaux.ts";

const OX = PHARE.origineModele.x;
const OZ = PHARE.origineModele.z;

/** L'usure du modèle (0 à 1) : celle par défaut, abandonné depuis quelques hivers. */
const USURE = 0.7;

/**
 * La hauteur du sol où l'on marche, à un point du jeu (L-1, K2) : celle du modèle (`hauteurSol`, repère du lot), avec
 * l'épave (`epave` : elle est échouée et montrée) ou sans (la grève, le fond de l'eau).
 */
export function solPhare(x: number, z: number, epave: boolean): number {
  const m = auModele(x, z);
  return (hauteurSol as (x: number, z: number, o: { epave: boolean }) => number)(m.x, m.z, { epave });
}

/** Dans l'eau peu profonde de la crique, on enfonce jusqu'aux genoux (m sous la surface). */
export const ENFONCE_EAU = 0.45;

/**
 * Où sont les pieds, à un point du jeu (0.10) : sur le sol, ou, dans l'eau peu profonde de la crique (commun/src/phare.ts,
 * dansLEauPhare), jusqu'aux genoux sous la surface (jamais plus bas que le fond, jamais plus haut que le sol).
 */
export function piedsPhare(x: number, z: number, epave: boolean): number {
  const sol = solPhare(x, z, epave);
  return dansLEauPhare(x, z, epave) ? Math.max(sol, NIVEAU_MER - ENFONCE_EAU) : sol;
}

/** Où se dessine ce qui est posé à plat (les cercles, la visée) : le sol, ou la surface de l'eau. */
export function surfacePhare(x: number, z: number, epave: boolean): number {
  const sol = solPhare(x, z, epave);
  return dansLEauPhare(x, z, epave) ? Math.max(sol, NIVEAU_MER) : sol;
}

/** Les objets nommés du modèle (FICHE.objets) que le jeu montre, cache ou déplace. */
type ObjetNomme = keyof typeof PLACES_OBJETS;

/** Ce qui se cache quand on l'a pris : la ressource, et l'objet nommé du modèle qui la dessine. */
const PRIS: Partial<Record<TypeRessource, ObjetNomme>> = {
  phare_harpon: "harpon",
  phare_cloche: "cloche_cargo",
  phare_porte_four: "porte_four",
  phare_soufflet: "soufflet",
  phare_rabot: "rabot",
  phare_jerrican: "jerrican",
};

const etats = new WeakMap<THREE.Object3D, Partial<Record<ObjetNomme, THREE.Object3D | null>>>();

/** Une couche qui s'efface (le format de halte.ts : `Toit`), avec ses hauteurs comptées depuis son sol à elle. */
interface CoucheEnRelief {
  nom?: string;
  bas?: number;
  haut?: number;
  /** Les hauteurs du modèle, depuis le sol de la couche (`solCouche`). */
  basModele?: number;
  hautModele?: number;
  /** La hauteur du sol d'où le modèle compte ses hauteurs : la grève pour la coque de l'épave, le plateau sinon. */
  solCouche?: number;
  /** La boîte où rien ne s'efface, telle que le modèle la donne (la coque : on la remplace à bord, `animerPhare`). */
  horsDe?: Boite;
  horsDeModele?: Boite;
}

/** La grève de la crique, d'où le modèle compte les hauteurs de la coque de l'épave (y ≈ − 8,8). */
const SOL_GREVE = -8.8;
const couchesEnRelief = new WeakMap<THREE.Object3D, CoucheEnRelief[]>();

/**
 * Les hauteurs d'une couche vues du sol du personnage (`ySol`) : celles du modèle, décalées de la différence entre son
 * sol à elle et celui du personnage. Du plateau, la coque de l'épave est tout entière sous ses pieds : elle ne le cache
 * jamais ; de la grève, on la compte comme le modèle.
 */
export function hauteursDepuis(c: CoucheEnRelief, ySol: number): { bas?: number; haut?: number } {
  const ecart = (c.solCouche ?? 0) - ySol;
  return {
    ...(c.basModele !== undefined ? { bas: c.basModele + ecart } : {}),
    ...(c.hautModele !== undefined ? { haut: c.hautModele + ecart } : {}),
  };
}

/** Une boîte du modèle, ramenée dans le repère du jeu. */
const auJeu = (b: Boite): Boite => ({ x: b.x + OX, z: b.z + OZ, l: b.l, p: b.p });

export function creerPhare(): THREE.Group {
  const groupe = new THREE.Group();
  const modele = creerModele({ usure: USURE }) as THREE.Group;
  modele.position.set(OX, 0, OZ);
  // 0.10 (essai sur l'iPhone du 2026-10-15) : les conteneurs de l'épave s'ouvrent quand on y entre (leur toit, leurs
  // flancs) ; le pavois s'ouvre au haut de l'échelle de coupée (rendu/phare-epave.ts).
  const epave = modele.getObjectByName("epave_apres");
  if (epave) {
    const plancher = (x: number, z: number) => (hauteurSol as (x: number, z: number, o: { epave: boolean }) => number)(x, z, { epave: true });
    (modele.userData.toits as unknown[]).push(...ouvrirConteneurs(epave, plancher));
    ouvrirLaCoupee(epave);
  }
  // Les couches qui s'effacent, dans le repère du jeu ; le modèle ne garde pas les siennes (on les lirait deux fois).
  // (Les mêmes objets, ramenés sur place : rendu/phare-epave.ts garde ceux des conteneurs pour savoir s'ils s'ouvrent.)
  const toits = (modele.userData.toits as { boite: Boite; horsDe?: Boite }[]).map((t) => Object.assign(t, { boite: auJeu(t.boite) }, t.horsDe ? { horsDe: auJeu(t.horsDe) } : {}));
  delete modele.userData.toits;
  groupe.userData.toits = toits;
  for (const t of toits as CoucheEnRelief[]) {
    t.basModele = t.bas;
    t.hautModele = t.haut;
    // Les toits des conteneurs portent leur sol (leur plancher : la grève, le pont) ; la coque compte depuis la grève.
    t.solCouche ??= t.nom?.startsWith("coque de l'épave") ? SOL_GREVE : 0;
    if (t.horsDe) t.horsDeModele = t.horsDe;
  }
  couchesEnRelief.set(groupe, toits as CoucheEnRelief[]);
  etendreAlentours(modele);
  planterSentier(modele);
  groupe.add(modele);
  nommer(groupe, ["phare"]);
  // K2 : le balayage du faisceau, les feux du cargo (rendu/phare-nuit.ts) ; la clôture des bords (rendu/phare-cloture.ts).
  creerNuitPhare(groupe);
  groupe.add(creerCloture());

  etats.set(groupe, (modele.userData.objets ?? {}) as Partial<Record<ObjetNomme, THREE.Object3D | null>>);
  return groupe;
}

/**
 * Autour du lot : la lande au nord, à l'ouest et à l'est (au niveau du plateau), et la mer au sud, neuf mètres plus bas,
 * avec la tranche de la falaise qui continue de part et d'autre. Dans les maillages du modèle qui ont la même matière (le
 * sol, la mer), ramenés dans leur repère : aucun appel de dessin de plus (le budget du phare est à 39).
 */
function etendreAlentours(modele: THREE.Group): void {
  const M = 70;
  const L = PHARE.largeur / 2;
  const P = PHARE.profondeur / 2;
  const BORD = 11.5; // le bord de la falaise, au bout du plateau (repère du modèle)
  const MER = -9;
  const sol = { p: [] as number[], c: [] as number[] };
  const eau = { p: [] as number[], c: [] as number[] };
  const c = new THREE.Color();
  const quad = (cible: typeof sol, coins: [number, number, number][], couleur: number) => {
    c.setHex(couleur);
    for (const k of [0, 1, 2, 0, 2, 3]) {
      cible.p.push(...coins[k]!);
      cible.c.push(c.r, c.g, c.b);
    }
  };
  const rect = (cible: typeof sol, x0: number, z0: number, x1: number, z1: number, couleur: number, y: number) => quad(cible, [[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]], couleur);
  const lande = 0x8a9658;
  const roc = 0x5a554c;
  // La lande : au nord, sur toute la largeur ; à l'ouest et à l'est, jusqu'au bord de la falaise (légèrement sous le
  // plateau du modèle, pour ne pas le doubler).
  rect(sol, -L - M, -P - M, L + M, -P, lande, -0.02);
  rect(sol, -L - M, -P, -L, BORD, lande, -0.02);
  rect(sol, L, -P, L + M, BORD, lande, -0.02);
  // La tranche de la falaise, de part et d'autre du lot, et la mer au sud.
  quad(sol, [[-L - M, -0.02, BORD], [-L - M, MER - 1, BORD], [-L, MER - 1, BORD], [-L, -0.02, BORD]], roc);
  quad(sol, [[L, -0.02, BORD], [L, MER - 1, BORD], [L + M, MER - 1, BORD], [L + M, -0.02, BORD]], roc);
  // La mer : blanche aux sommets, comme celle du modèle (sa matière porte la teinte de l'eau).
  rect(eau, -L - M, BORD, -L, P, 0xffffff, MER);
  rect(eau, L, BORD, L + M, P, 0xffffff, MER);
  rect(eau, -L - M, P, L + M, P + M, 0xffffff, MER);
  // Les maillages du modèle : le sol mat (le plateau, la roche) et la mer.
  let auSol: THREE.Mesh | null = null;
  let aLaMer: THREE.Mesh | null = null;
  modele.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (o as unknown as THREE.InstancedMesh).isInstancedMesh || m.geometry.index) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (!auSol && !mat.map && !mat.transparent && mat.roughness === 0.95 && mat.metalness === 0) auSol = m;
    if (!aLaMer && mat.transparent && mat.roughness === 0.15 && mat.metalness === 0.25) aLaMer = m;
  });
  modele.updateMatrixWorld(true);
  for (const [g, cible] of [
    [sol, auSol],
    [eau, aLaMer],
  ] as [typeof sol, THREE.Mesh | null][]) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(g.p, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(g.c, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((g.p.length / 3) * 2).fill(0), 2));
    geo.computeVertexNormals();
    if (cible) {
      // Le modèle est posé en (OX, 0, OZ) : la géométrie ajoutée est dans le repère du lot, comme la sienne.
      const memes = ["position", "normal", "uv", "color"].every((n) => cible.geometry.getAttribute(n)?.itemSize === geo.getAttribute(n).itemSize);
      const fondu = memes && mergeGeometries([cible.geometry, geo]);
      if (fondu) {
        cible.geometry.dispose();
        cible.geometry = fondu;
        continue;
      }
    }
    const m = new THREE.Mesh(geo, cible ? cible.material : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
    m.receiveShadow = true;
    modele.add(m);
  }
}

/** Le panneau du sentier côtier dans l'atlas du modèle (R.sentier : x, y, largeur, hauteur, sur 1024 × 1024). */
const ATLAS_SENTIER = { x: 640, y: 384, l: 192, h: 128, cote: 1024 } as const;

/**
 * Le panneau du sentier côtier, planté à la sortie de la grève (commun/src/phare.ts, ECRITEAU_SENTIER ; on le lit : E-12) :
 * le même que celui du modèle, sur le plateau (son poteau de 1,5 m, sa planche de 0,9 × 0,6 m peinte dans l'atlas), face à
 * la mer. Ajouté au maillage des panneaux du modèle (même matière, même atlas) : aucun appel de dessin de plus.
 */
function planterSentier(modele: THREE.Group): void {
  let panneaux: THREE.Mesh | null = null;
  modele.traverse((o) => {
    const m = o as THREE.Mesh;
    if (panneaux || !m.isMesh || m.geometry.index || Array.isArray(m.material)) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    // La matière des panneaux : l'atlas, des deux côtés ; pas celle de l'épave (cachée au départ), le décor du plateau.
    let dansEpave = false;
    for (let p = o.parent; p; p = p.parent) if (p.name === "epave_apres") dansEpave = true;
    if (mat.map && mat.side === THREE.DoubleSide && mat.roughness === 0.85 && !dansEpave) panneaux = m;
  });
  const cible = panneaux as THREE.Mesh | null;
  if (!cible) return;
  const m = auModele(ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z);
  const y0 = solPhare(ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z, false);
  const A = ATLAS_SENTIER;
  // Une géométrie au format du maillage des panneaux (position, normale, uv, couleur), dans le repère du lot.
  const morceau = (g: THREE.BufferGeometry, uv: (u: number, v: number) => [number, number], x: number, y: number, z: number) => {
    const n = g.toNonIndexed();
    g.dispose();
    const u = n.getAttribute("uv");
    for (let i = 0; i < u.count; i++) u.setXY(i, ...uv(u.getX(i), u.getY(i)));
    n.translate(x, y, z);
    for (const nom of Object.keys(n.attributes)) if (!cible.geometry.getAttribute(nom)) n.deleteAttribute(nom);
    if (cible.geometry.getAttribute("color")) n.setAttribute("color", new THREE.Float32BufferAttribute(new Array(n.getAttribute("position").count * 3).fill(1), 3));
    return n;
  };
  // La planche peinte, et le poteau (teint par le fond brun du panneau : un coin de l'atlas sans écriture).
  const planche = morceau(new THREE.PlaneGeometry(0.9, 0.6), (u, v) => [(A.x + u * A.l) / A.cote, 1 - (A.y + (1 - v) * A.h) / A.cote], m.x, y0 + 1.3, m.z + 0.07);
  const fond: [number, number] = [(A.x + 6) / A.cote, 1 - (A.y + 6) / A.cote];
  const poteau = morceau(new THREE.BoxGeometry(0.12, 1.5, 0.12), () => fond, m.x, y0 + 0.75, m.z);
  const memes = (g: THREE.BufferGeometry) => Object.keys(cible.geometry.attributes).every((nom) => g.getAttribute(nom)?.itemSize === cible.geometry.getAttribute(nom).itemSize);
  if (!memes(planche) || !memes(poteau)) return;
  const fondu = mergeGeometries([cible.geometry, planche, poteau]);
  if (!fondu) return;
  cible.geometry.dispose();
  cible.geometry = fondu;
}

/** Le décor du phare d'un groupe (le jeu le pose dans un groupe à lui : main.ts, montrerDecor). */
function objetsDe(decor: THREE.Object3D): Partial<Record<ObjetNomme, THREE.Object3D | null>> | undefined {
  let e = etats.get(decor);
  if (!e) decor.traverse((o) => (e ??= etats.get(o)));
  return e;
}

/** Le groupe du phare (creerPhare) dans le décor que le jeu lui a donné, cherché une seule fois. */
const groupes = new WeakMap<THREE.Object3D, THREE.Object3D>();
function groupePhare(decor: THREE.Object3D): THREE.Object3D | undefined {
  let g = groupes.get(decor);
  if (!g) {
    decor.traverse((o) => {
      if (!g && etats.has(o)) g = o;
    });
    if (g) groupes.set(decor, g);
  }
  return g;
}

/** Les couches du phare d'un groupe (comme `objetsDe`). */
function couchesDe(decor: THREE.Object3D): CoucheEnRelief[] | undefined {
  let c = couchesEnRelief.get(decor);
  if (!c) decor.traverse((o) => (c ??= couchesEnRelief.get(o)));
  return c;
}

/** Ce que le décor montre de l'état du phare. */
export interface ScenePhare {
  etat: EtatPhareVu | null;
  /** L'épave se voit (échouée, et le fondu du cargo passé). */
  epave: boolean;
  /** K2 : la nuit (le balayage du faisceau ne se voit qu'alors). */
  nuit?: boolean;
  /** K2 : les feux du cargo qui approche (client/src/phare-scene.ts), ou rien. */
  feux?: FeuxCargo | null;
  /** K2 : la caméra cadre la tour ou la crique : toutes les couches restent (on voit la lanterne, la coque). */
  cadre?: boolean;
}

/**
 * À chaque image : les couches qui cachent le personnage s'effacent ; les objets nommés suivent l'état du phare ; ce qu'on
 * a pris se cache.
 */
export function animerPhare(
  decor: THREE.Object3D,
  x: number,
  z: number,
  dt: number,
  lacet: number,
  vu: ScenePhare,
  ressources: Iterable<{ donnees: { type: TypeRessource; disponible: boolean } }>,
): void {
  const couches = couchesDe(decor);
  if (couches) {
    const ySol = solPhare(x, z, vu.epave);
    // Sur le pont de l'épave, la coque ne s'efface jamais (essai sur l'iPhone, 2026-10-15 : l'avant s'effaçait sous les
    // pieds, hors de la boîte `horsDe` du modèle, trop courte) : on est toujours « hors d'effacement ».
    const aBord = vu.epave && etageDuPhare(x, z, true) === "pont";
    for (const c of couches) {
      Object.assign(c, hauteursDepuis(c, ySol));
      if (c.horsDeModele) c.horsDe = aBord ? { x, z, l: 2, p: 2 } : c.horsDeModele;
    }
  }
  if (vu.cadre) montrerTousLesToits(true);
  estomperToits(decor, x, z, dt, lacet);
  if (vu.cadre) montrerTousLesToits(false);
  const groupe = groupePhare(decor);
  // Les conteneurs de l'épave : ouverts quand on y est (leurs couches viennent d'être évaluées).
  const epave = groupe?.getObjectByName("epave_apres");
  if (epave) montrerConteneurs(epave);
  if (groupe) animerNuitPhare(groupe, dt, lacet, { nuit: vu.nuit === true, lanterne: vu.etat?.lanterne === true, epave: vu.epave, feux: vu.feux ?? null });
  const o = objetsDe(decor);
  if (!o) return;
  const montrer = (id: ObjetNomme, oui: boolean) => {
    const objet = o[id];
    if (objet) objet.visible = oui;
  };
  const e = vu.etat;
  montrer("lanterne_eteinte", !e?.lanterne);
  montrer("lanterne_allumee", e?.lanterne === true);
  montrer("prisme_tombe", !e || e.prisme === "tombe");
  montrer("prisme_manquant", e?.prisme === "remis");
  montrer("bidon_petrole", !e || e.bidon === "cuve");
  montrer("courroie_compresseur", !e?.compresseur);
  montrer("epave_apres", vu.epave);
  placerEscabeau(o.escabeau_phare ?? null, e?.escabeau ?? "hangar", vu.epave);
  for (const r of ressources) {
    const nom = PRIS[r.donnees.type];
    if (nom) montrer(nom, r.donnees.disponible);
  }
}

/** L'escabeau du gardien : au hangar (sa place dans le modèle), sous l'escalier coupé, posé ailleurs, ou dans les bras. */
function placerEscabeau(objet: THREE.Object3D | null, ou: EtatPhareVu["escabeau"], epave: boolean): void {
  if (!objet) return;
  objet.visible = ou !== "bras";
  const depart = PLACES_OBJETS.escabeau_phare;
  // Sous l'escalier, debout contre le mur de la tour, à la marque ; ailleurs, là où on l'a posé (repère du jeu).
  const cible = ou === "marque" ? ENDROITS_PHARE.marque : typeof ou === "object" ? ou : null;
  if (!cible) {
    objet.position.set(0, 0, 0);
    return;
  }
  const m = auModele(cible.x, cible.z);
  objet.position.set(m.x - depart.x, solPhare(cible.x, cible.z, epave) - depart.y, m.z - depart.z);
}

/** Les lumières du phare, la nuit (Book 18) : la lanterne allumée, le feu de détresse du cargo échoué. */
export function lumieresPhare(vu: ScenePhare, nuit: boolean): SourceLumiere[] {
  if (!nuit) return [];
  const sources: SourceLumiere[] = [];
  for (const l of LUMIERES_MODELE) {
    const lanterne = l.nature.startsWith("lanterne");
    const detresse = l.nature.startsWith("feu de détresse");
    if ((lanterne && vu.etat?.lanterne !== true) || (detresse && !vu.epave)) continue;
    if (!lanterne && !detresse) continue;
    sources.push({ x: l.x + OX, y: l.y, z: l.z + OZ, couleur: l.couleur, intensite: l.intensite, portee: l.portee, vacillement: lanterne ? 0.05 : 0.3 });
  }
  // K2 : le projecteur du cargo qui approche, braqué devant lui : il éclaire la crique et la falaise (sans lui, le cadrage
  // de la crique, la nuit, ne montrait que du noir : essai sur l'iPhone, 2026-10-15). Une lumière de la réserve.
  if (vu.feux) {
    const f = vu.feux;
    sources.push({ x: f.x + Math.sin(f.cap) * 12, y: PROJECTEUR.y, z: f.z + Math.cos(f.cap) * 12, couleur: 0xfff0d6, intensite: PROJECTEUR.intensite, portee: PROJECTEUR.portee, decroissance: 1, vacillement: 0 });
  }
  return sources;
}

/** Le projecteur du cargo : au-dessus de la mer (y − 9), une lumière large et douce. */
const PROJECTEUR = { y: 6, intensite: 16, portee: 45 } as const;
