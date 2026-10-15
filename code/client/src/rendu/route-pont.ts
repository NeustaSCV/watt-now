// La route du pont à l'écran (plan 0.10, chantier H) : le modèle de la session « bâtiments » (batiment/halte-route-pont/,
// copié dans client/src/batiments/ par `npm run batiments:importer`, jamais modifié ici), posé tel quel (le terrain à
// l'ouest, l'hôtel à l'est, comme sur la carte : commun/src/route-pont.ts), et ce qui y change d'état (S-02) :
//
// - la marée (S-20) : chaque tronçon a ses deux objets `maree_basse` et `maree_haute` ; on montre l'un ou l'autre selon
//   l'heure du monde (la même pour tous) ;
// - le péage (S-19) : la porte de la chicane, `chicane_fermee` ou `chicane_ouverte`, ouverte pour ce joueur s'il a payé
//   (le message `passage`) ; la caisse et l'échelle de marée qu'on touche (les propositions) ;
// - la mer qui monte (K1) : un fondu au noir, puis le message fermé par son bouton (main.ts le montre) ;
// - les toits qui s'effacent, les lumières de la nuit, les drapeaux et l'eau qui bougent.
//
// Quatre tronçons de 50 × 70 m : seuls celui du joueur et ses voisins sont construits. main.ts n'appelle que ce module
// (une ligne par point d'appel).

import * as THREE from "three";
import { LUMIERES_PONT } from "../../../commun/src/route-pont-modele.ts";
import { ECHELLE_MAREE, auPont, maree, prochePeage, texteEchelle, zoneRoutePont, CAISSE_PEAGE, PORTE_PEAGE } from "../../../commun/src/route-pont.ts";
import { TEXTES_PEAGE, type Passage } from "../../../commun/src/peage.ts";
import type { Boite, Zone } from "../../../commun/src/lieux.ts";
import type { MessageServeur } from "../../../commun/src/messages.ts";
import type { Propositions } from "../interaction.ts";
import { creerBordsPont } from "./bords-pont.ts";
import { brouillerTout } from "./carte-vue.ts";
import { lumieresLanternes } from "./decor-cote.ts";
import type { LanternePanneau } from "./lanterne-panneau.ts";
import { tronconsVoulus } from "./vue-ensemble.ts";
import { estomperToits } from "./halte.ts";
import type { SourceLumiere } from "./lumieres.ts";
// @ts-expect-error : le modèle de la route du pont est en JavaScript, sans types (client/src/batiments/ ne se modifie pas).
import * as modeleJs from "../batiments/halte-route-pont/modele.js";
// @ts-expect-error : idem (les matières partagées du modèle : le sol, l'asphalte, l'eau, la pierre des quais).
import * as objetsJs from "../batiments/halte-route-pont/objets.js";

/** Ce que le jeu prend du modèle. */
interface ModelePont {
  creer(o: { usure?: number; carte: string }): THREE.Group;
  FICHE: { cartes: { id: string; decalage: { x: number; z: number } }[] };
}
const modele = modeleJs as unknown as ModelePont;
type Matiere = THREE.Material & { userData: { tuile?: number } };
const objets = objetsJs as unknown as { matieres(): Record<"sol" | "asphalte" | "paves" | "eau" | "pierre", Matiere> };

// ---------- Les alentours : le pays continue au-delà du lot ----------

/** Les hauteurs d'eau du modèle (Y_EAU, Y_HAUTE) : l'estuaire qui continue au nord et au sud suit la marée. */
const Y_BASSE = -8;
const Y_HAUTE = -5.7;

/**
 * Un rectangle horizontal du repère du jeu, dans une matière du modèle (ses couleurs par sommet, sa tuile : les
 * coordonnées de texture du modèle, pour que le sol se raccorde au lot).
 */
function plaque(x0: number, x1: number, z0: number, z1: number, y: number, couleur: number, m: Matiere, tuile = m.userData.tuile ?? 6, tuileZ = tuile, teinte?: (x: number, z: number, c: THREE.Color) => void): THREE.Mesh {
  // Une plaque teintée par endroits (`teinte`) est découpée en carreaux de 3 m, pour que la teinte se fonde.
  const n = (l: number) => (teinte ? Math.max(1, Math.round(l / 3)) : 1);
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, n(x1 - x0), n(z1 - z0)).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const pos = g.attributes.position!;
  const uv = g.attributes.uv!;
  const c = new THREE.Color(couleur);
  const couleurs: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - 100) / tuile, (pos.getZ(i) - 35) / tuileZ);
    c.setHex(couleur);
    teinte?.(pos.getX(i), pos.getZ(i), c);
    couleurs.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Autour du lot (200 × 70 m), le pays continue : la route du Littoral file vers le terrain (à l'ouest) et vers l'hôtel
 * (à l'est) entre ses trottoirs ; les terre-pleins de sable des deux rives ; l'estuaire qui vient du nord et descend
 * vers la mer, au sud, entre ses quais de pierre. Sans cela, on verrait le vide aux deux bouts de la route et la coupe
 * du lot. Quelques maillages, dans les matières du modèle (l'eau bouge avec lui).
 */
function creerAlentours(): { groupe: THREE.Group; eau: THREE.Mesh[] } {
  const M = objets.matieres();
  const groupe = new THREE.Group();
  groupe.name = "route_pont:alentours";
  const SOL = 0xb9b19c;
  const SABLE_CLAIR = 0xddd1b2;
  const ASPHALTE = 0x8e8d88;
  const TROTTOIR = 0xb3ada2;
  const QUAI = 0xa8a090;
  const EAU = 0x7f9890;
  const loin = 90;
  // Le sable clair des dunes du nord du lot (le modèle : z 0 à 19, aux deux bouts) se prolonge en se fondant dans le sol
  // des terre-pleins (0.10, R52 : plus de couture nette au bord du lot, à x = 0 et 200, ni à z = 0).
  const clair = new THREE.Color(SABLE_CLAIR);
  const fondu = (x: number, z: number, c: THREE.Color) => {
    const dx = Math.max(0, Math.min(Math.abs(x - 21), Math.abs(x - 179)) - 21);
    const dz = Math.max(0, -z, z - 19);
    const f = 1 - Math.min(1, Math.hypot(dx, dz) / 16);
    if (f > 0) c.lerp(clair, f * f * (3 - 2 * f));
  };
  // Les terre-pleins : à l'ouest et à l'est du lot, et au nord et au sud des deux rives (le quai est en x 42 et 158).
  for (const [x0, x1, z0, z1] of [
    [-loin, 0, -loin, 70 + loin],
    [200, 200 + loin, -loin, 70 + loin],
    [0, 42, -loin, 0],
    [0, 42, 70, 70 + loin],
    [158, 200, -loin, 0],
    [158, 200, 70, 70 + loin],
  ] as const) groupe.add(plaque(x0, x1, z0, z1, -0.02, SOL, M.sol, undefined, undefined, fondu));
  // La route et ses trottoirs, aux deux bouts.
  for (const [x0, x1] of [[-loin, 0], [200, 200 + loin]] as const) {
    groupe.add(plaque(x0, x1, 31.5, 38.5, 0.0, ASPHALTE, M.asphalte));
    groupe.add(plaque(x0, x1, 29.6, 31.5, 0.04, TROTTOIR, M.paves));
    groupe.add(plaque(x0, x1, 38.5, 40.4, 0.04, TROTTOIR, M.paves));
  }
  // L'estuaire, au nord et au sud du lot : l'eau (elle suit la marée) et les murs des quais.
  const eau = [plaque(42, 158, -loin, 0, Y_BASSE, EAU, M.eau, 9, 16), plaque(42, 158, 70, 70 + loin, Y_BASSE, EAU, M.eau, 9, 16)];
  for (const e of eau) {
    e.receiveShadow = false;
    groupe.add(e);
  }
  const mur = new THREE.MeshStandardMaterial({ color: QUAI, roughness: 0.95 });
  for (const x of [42, 158]) {
    for (const [z0, z1] of [[-loin, 0], [70, 70 + loin]] as const) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9.6, z1 - z0).translate(x + (x < 100 ? -0.3 : 0.3), -4.8, (z0 + z1) / 2), mur);
      m.receiveShadow = true;
      groupe.add(m);
    }
  }
  return { groupe, eau };
}

/** Un toit, une façade qui s'efface (le format de rendu/halte.ts : estomperToits), dans le repère du jeu. */
interface ToitJeu {
  nom: string;
  boite: Boite;
  materiaux: THREE.Material[];
  horsDe?: Boite;
}

interface Troncon {
  id: string;
  groupe: THREE.Group;
  modele: THREE.Group;
  /** Ce qui bouge (l'eau, les drapeaux, la diode du drone). */
  animes: ((t: number) => void)[];
}

/** Les tronçons d'ouest en est (le terrain à l'ouest, l'hôtel à l'est). */
const ORDRE = ["bourg", "pylone", "breche", "marins"] as const;
function tronconDe(x: number): (typeof ORDRE)[number] {
  return ORDRE[Math.max(0, Math.min(3, Math.floor(x / 50)))]!;
}

/** Les lumières du modèle, dans le repère du jeu. */
const LUMIERES = LUMIERES_PONT.map((l) => ({ ...l, ...auPont(l.x, l.z) }));

export class RenduRoutePont {
  readonly groupe = new THREE.Group();
  private readonly troncons = new Map<string, Troncon>();
  /** La porte du péage, pour ce joueur : ouverte s'il a payé (le serveur le dit, message `passage`). */
  private ouvert = false;
  /** Le voile du fondu au noir (la mer qui monte). */
  private voile: HTMLElement | null = null;
  /** L'eau des alentours (elle suit la marée). */
  private eauAlentours: THREE.Mesh[] = [];
  /** Les lanternes des deux panneaux de sortie (0.10, R52). */
  private lanternes: LanternePanneau[] = [];

  constructor() {
    this.groupe.name = "route_pont";
    if (import.meta.env?.DEV) (globalThis as { __pont?: RenduRoutePont }).__pont = this;
  }

  /** Le décor : les alentours tout de suite ; les tronçons se construisent autour du joueur (animer). */
  creer(): THREE.Group {
    if (this.groupe.children.length === 0) {
      const a = creerAlentours();
      this.groupe.add(a.groupe);
      this.eauAlentours = a.eau;
      // Les bords des deux bouts (0.10, R52) : ganivelles, dunes, oyats, la lanterne des panneaux de sortie.
      const bords = creerBordsPont();
      this.groupe.add(bords.groupe);
      this.lanternes = bords.lanternes;
    }
    return this.groupe;
  }

  // ---------- Ce que dit le serveur ----------

  /** Le passage du péage, pour ce joueur. */
  passage(m: Extract<MessageServeur, { t: "passage" }>): void {
    if (m.passage === "pont") this.ouvert = m.ouvert;
  }

  /** La mer monte : un fondu au noir d'une seconde, pendant que le serveur remet le personnage sur le quai (K1). */
  fondu(): void {
    if (!this.voile) {
      const v = document.createElement("div");
      v.className = "fondu-maree";
      Object.assign(v.style, { position: "fixed", inset: "0", background: "#000", opacity: "0", pointerEvents: "none", transition: "opacity 0.45s ease", zIndex: "40" });
      document.body.append(v);
      this.voile = v;
    }
    const v = this.voile;
    v.style.opacity = "1";
    setTimeout(() => (v.style.opacity = "0"), 650);
  }

  // ---------- Se déplacer ----------

  /** La zone où l'on marche : comme le serveur, la marée et la porte du péage (ouverte pour soi seul). */
  zone(instant: number, debutMonde: number): Zone {
    return zoneRoutePont({ haute: maree(instant, debutMonde) === "haute", ouverte: this.ouvert });
  }

  /** Est-on à portée de la caisse (ou de la porte) du péage ? (pour fermer la caisse quand on s'éloigne) */
  prochePeage(p: { x: number; z: number }): boolean {
    return prochePeage(p.x, p.z);
  }

  // ---------- Agir ----------

  /** Ce qu'on peut faire ici en plus : payer le péage (à la caisse, contre la porte), lire l'échelle de marée. */
  proposer(p: { x: number; z: number }, base: Propositions, instant: number, debutMonde: number): Propositions {
    const dBase = base.cible ? Math.max(0, Math.hypot(base.cible.x - p.x, base.cible.z - p.z) - (base.cible.rayon ?? 0.5)) : base.A ? 0 : Infinity;
    const passage: Passage = "pont";
    if (prochePeage(p.x, p.z)) {
      const aLaCaisse = Math.hypot(p.x - CAISSE_PEAGE.x, p.z - CAISSE_PEAGE.z) <= 1.6;
      const cible = aLaCaisse ? { x: CAISSE_PEAGE.x, z: CAISSE_PEAGE.z, rayon: 0.5 } : { x: PORTE_PEAGE.x, z: PORTE_PEAGE.z, rayon: 0.9 };
      const d = Math.max(0, Math.hypot(cible.x - p.x, cible.z - p.z) - cible.rayon);
      if (d <= dBase + 0.3) {
        return {
          A: this.ouvert ? null : { libelle: "Payer le péage", ouvrirCaisse: passage },
          B: { libelle: "Examiner", examiner: this.ouvert ? TEXTES_PEAGE.pont.dejaPaye : aLaCaisse ? TEXTES_PEAGE.pont.examen : TEXTES_PEAGE.pont.ferme },
          cible,
        };
      }
    }
    const dEchelle = Math.hypot(ECHELLE_MAREE.x - p.x, ECHELLE_MAREE.z - p.z);
    if (dEchelle <= 2.2 && Math.max(0, dEchelle - 0.4) <= dBase) {
      return { A: base.A, B: { libelle: "Lire l'échelle de marée", examiner: texteEchelle(instant, debutMonde) }, cible: { x: ECHELLE_MAREE.x, z: ECHELLE_MAREE.z, rayon: 0.3 } };
    }
    return base;
  }

  // ---------- La lumière ----------

  /** Les lumières de la nuit : les lanternes des panneaux de sortie, le brasero du poste de guet, la baladeuse du péage, les bougies, le portique… */
  lumieres(nuit: boolean, p: { x: number; z: number } | null): SourceLumiere[] {
    // Les lanternes des panneaux de sortie (0.10, R52) : leur verre luit la nuit, s'éteint le jour.
    const lanternes = lumieresLanternes(this.lanternes, nuit);
    if (!nuit || !p) return [];
    const sources: SourceLumiere[] = [...lanternes];
    for (const l of LUMIERES) {
      if (Math.abs(l.x - p.x) > 60) continue;
      const feu = /feu|brasero|bougie|cierge|lanterne/.test(l.nature);
      sources.push({ x: l.x, y: l.y, z: l.z, couleur: l.couleur, intensite: l.intensite, portee: l.portee, vacillement: feu ? 0.8 : 0 });
    }
    return sources;
  }

  // ---------- À chaque image ----------

  /** Les tronçons autour du joueur (tous pendant la vue d'ensemble), la marée et la porte du péage, les toits qui s'effacent, ce qui bouge. */
  animer(p: { x: number; z: number }, dt: number, lacet: number, instant: number, debutMonde: number, ensemble = false): void {
    // Pendant la vue d'ensemble de l'arrivée (`ensemble`), tout le lieu (0.10, R52) ; ensuite, autour du joueur.
    const { voulus, aConstruire } = tronconsVoulus<string>(ORDRE, ORDRE.indexOf(tronconDe(p.x)), ensemble, this.troncons);
    for (const id of aConstruire) this.construire(id);
    for (const [id, t] of this.troncons) if (!voulus.has(id)) this.defaire(id, t);
    const haute = maree(instant, debutMonde) === "haute";
    for (const t of this.troncons.values()) {
      const o = t.modele.userData.objets as Record<string, THREE.Object3D | undefined>;
      if (o.maree_basse) o.maree_basse.visible = !haute;
      if (o.maree_haute) o.maree_haute.visible = haute;
      if (o.chicane_fermee) o.chicane_fermee.visible = !this.ouvert;
      if (o.chicane_ouverte) o.chicane_ouverte.visible = this.ouvert;
    }
    for (const e of this.eauAlentours) e.position.y = (haute ? Y_HAUTE : Y_BASSE) - Y_BASSE;
    estomperToits(this.groupe, p.x, p.z, dt, lacet);
    const s = performance.now() / 1000;
    for (const t of this.troncons.values()) for (const a of t.animes) a(s);
  }

  private decalage(id: string): number {
    return modele.FICHE.cartes.find((c) => c.id === id)!.decalage.x;
  }

  /** Construit un tronçon, posé à sa place ; ses toits dans le repère du jeu. */
  private construire(id: string): void {
    const x0 = this.decalage(id);
    const m = modele.creer({ carte: id });
    const g = new THREE.Group();
    g.name = `route_pont:${id}`;
    g.position.set(100 + x0, 0, 35);
    g.add(m);
    const versJeu = (b: Boite): Boite => ({ x: 100 + x0 + b.x, z: b.z + 35, l: b.l, p: b.p });
    const toits = ((m.userData.toits ?? []) as ToitJeu[]).map((t) => ({ ...t, boite: versJeu(t.boite), ...(t.horsDe ? { horsDe: versJeu(t.horsDe) } : {}) }));
    m.userData.toits = undefined;
    g.userData.toits = toits;
    const animes: ((t: number) => void)[] = [];
    m.traverse((o) => {
      if (typeof o.userData.animer === "function") animes.push(o.userData.animer as (t: number) => void);
    });
    // La vue par pièce (0.7.2) : ce que le personnage ne voit pas est dessiné « en souvenir ».
    brouillerTout([g]);
    this.groupe.add(g);
    this.troncons.set(id, { id, groupe: g, modele: m, animes });
  }

  /** Défait un tronçon trop loin : ses géométries s'en vont (les matières du modèle sont partagées, elles restent). */
  private defaire(id: string, t: Troncon): void {
    this.groupe.remove(t.groupe);
    t.groupe.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    this.troncons.delete(id);
  }

  /** Les quatre tronçons à la fois (pour les essais : tout le pont). */
  toutConstruire(): THREE.Group {
    for (const id of ORDRE) if (!this.troncons.has(id)) this.construire(id);
    return this.groupe;
  }

  /** Les tronçons construits (pour les mesures). */
  get construits(): string[] {
    return [...this.troncons.keys()];
  }
}
