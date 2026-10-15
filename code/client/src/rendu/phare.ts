// Le phare du cap à l'écran (plan 0.10, chantier K) : le modèle de la session « bâtiments » (batiments/phare/, copié par
// `npm run batiments:importer`, jamais modifié ici), posé dans le repère du jeu, et ce que le jeu y change.
//
// - Le relief (L-1) : la fonction `hauteurSol` du modèle, importée telle quelle, donne la hauteur du sol où l'on marche
//   (le plateau à 0, la rampe du canot, la grève à − 8,8, le pont de l'épave à − 4) ; `solPhare` la lit dans le repère du
//   jeu. Le serveur reste en 2D ; client/src/phare.ts pose les personnages, les Éteints et le cercle de visée dessus.
// - Le modèle dessine aussi ce qui borde le lieu (0.10, R52) : le muret de la lande, le sentier côtier, les rochers des
//   deux bouts de la grève, la mer claire puis profonde, et ses alentours (le groupe `alentours` : la falaise, la lande,
//   la route du nord) ; ses panneaux de sortie et leurs lanternes (FICHE.panneaux). Le jeu n'y ajoute plus rien.
// - Ses couches (le fût de la tour, les toits, la coque de l'épave) s'effacent quand le personnage passe dessous ou
//   derrière, comme les toits de la halte (estomperToits). Leurs hauteurs sont comptées depuis leur sol (le plateau ; la
//   grève pour la coque) : on les recompte depuis le sol du personnage (`hauteursDepuis`), sinon la coque, neuf mètres
//   plus bas, s'effaçait devant qui marche au bord de la falaise (essai sur l'iPhone, 2026-10-14).
// - Ses objets nommés (`userData.objets`) suivent l'état du phare : la lanterne éteinte ou allumée, le prisme tombé ou
//   remis, le bidon à côté de la cuve, l'escabeau (au hangar, sous l'escalier, posé ailleurs, ou dans les bras), la
//   courroie du compresseur, le harpon, l'épave et ses objets-clés.

import * as THREE from "three";
// @ts-ignore — le modèle est en JavaScript (session « bâtiments »), sans déclaration de types.
import { creer as creerModele, hauteurSol } from "../batiments/phare/modele.js";
import type { Boite } from "../../../commun/src/lieux.ts";
import { ENDROITS_PHARE, NIVEAU_MER, PHARE, auModele, dansLEauPhare, etageDuPhare, type EtatPhareVu } from "../../../commun/src/phare.ts";
import { LUMIERES_MODELE, PLACES_OBJETS } from "../../../commun/src/phare-modele.ts";
import type { TypeRessource } from "../../../commun/src/terrain.ts";
import { estomperToits, montrerTousLesToits } from "./halte.ts";
import { animerNuitPhare, creerNuitPhare } from "./phare-nuit.ts";
import type { FeuxCargo } from "../phare-scene.ts";
import { estLanternePanneau, lumiereLanterneModele } from "./lanterne-panneau.ts";
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
  // Les couches qui s'effacent, dans le repère du jeu ; le modèle ne garde pas les siennes (on les lirait deux fois).
  // (Les toits et parois des conteneurs de l'épave en sont, depuis la 0.10 : P-7, ils s'effacent quand on y entre.)
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
  groupe.add(modele);
  nommer(groupe, ["phare"]);
  // K2 : le balayage du faisceau, les feux du cargo (rendu/phare-nuit.ts).
  creerNuitPhare(groupe);

  etats.set(groupe, (modele.userData.objets ?? {}) as Partial<Record<ObjetNomme, THREE.Object3D | null>>);
  return groupe;
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

/**
 * Les lumières du phare, la nuit (Book 18) : la lanterne allumée, le feu de détresse du cargo échoué, les lanternes des
 * panneaux de sortie (0.10, R0-1 : celles du modèle ; la nuit seulement, comme toutes celles-ci).
 */
export function lumieresPhare(vu: ScenePhare, nuit: boolean): SourceLumiere[] {
  if (!nuit) return [];
  const sources: SourceLumiere[] = [];
  for (const l of LUMIERES_MODELE) {
    if (estLanternePanneau(l.nature)) {
      // Près de l'eau (le panneau de la grève), une portée un peu plus courte que celle du modèle : son reflet sur la mer
      // luisante faisait une tache claire sous la lanterne, qu'on prenait pour un halo mal placé (essai du 2026-10-15).
      sources.push({ ...lumiereLanterneModele(l, { x: OX, z: OZ }), portee: Math.min(l.portee, PORTEE_LANTERNE_PANNEAU) });
      continue;
    }
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

/** La portée des lanternes des panneaux de sortie, au phare (m). */
const PORTEE_LANTERNE_PANNEAU = 3.8;

/** Le projecteur du cargo : au-dessus de la mer (y − 9), une lumière large et douce. */
const PROJECTEUR = { y: 6, intensite: 16, portee: 45 } as const;
