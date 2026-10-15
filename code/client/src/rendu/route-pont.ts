// La route du pont à l'écran (plan 0.10, chantier H) : le modèle de la session « bâtiments » (batiment/halte-route-pont/,
// copié dans client/src/batiments/ par `npm run batiments:importer`, jamais modifié ici), posé tel quel (le terrain à
// l'ouest, l'hôtel à l'est, comme sur la carte : commun/src/route-pont.ts), et ce qui y change d'état (S-02) :
//
// - la marée (S-20) : chaque tronçon a ses deux objets `maree_basse` et `maree_haute` ; on montre l'un ou l'autre selon
//   l'heure du monde (la même pour tous) ;
// - le péage (S-19) : la porte de la chicane, `chicane_fermee` ou `chicane_ouverte`, ouverte pour ce joueur s'il a payé
//   (le message `passage`) ; la caisse et l'échelle de marée qu'on touche (les propositions) ;
// - la mer qui monte (K1) : un fondu au noir, puis le message fermé par son bouton (main.ts le montre) ;
// - les toits qui s'effacent, les lumières de la nuit (les lanternes des panneaux de sortie du modèle comprises, 0.10,
//   R0-1), les drapeaux et l'eau qui bougent.
//
// Le décor au-delà du lot (les terre-pleins, l'estuaire, la plage, la route qui continue), les ganivelles et les dunes des
// bords, les panneaux de sortie et leurs lanternes sont dans le modèle depuis la 0.10 (R52 : le groupe `alentours` de
// chaque tronçon, ceux des bouts portent la route qui continue) : le jeu n'y ajoute plus rien.
//
// Quatre tronçons de 50 × 70 m : seuls celui du joueur et ses voisins sont construits. main.ts n'appelle que ce module
// (une ligne par point d'appel).

import * as THREE from "three";
import { LUMIERES_PONT } from "../../../commun/src/route-pont-modele.ts";
import { ECHELLE_MAREE, auPont, maree, prochePeage, texteEchelle, zoneRoutePont, CAISSE_PEAGE } from "../../../commun/src/route-pont.ts";
import { TEXTES_PEAGE, type Passage } from "../../../commun/src/peage.ts";
import type { Boite, Zone } from "../../../commun/src/lieux.ts";
import type { MessageServeur } from "../../../commun/src/messages.ts";
import type { Propositions } from "../interaction.ts";
import { brouillerTout } from "./carte-vue.ts";
import { estLanternePanneau, lumiereLanterneModele } from "./lanterne-panneau.ts";
import { tronconsVoulus } from "./vue-ensemble.ts";
import { estomperToits } from "./halte.ts";
import type { SourceLumiere } from "./lumieres.ts";
// @ts-expect-error : le modèle de la route du pont est en JavaScript, sans types (client/src/batiments/ ne se modifie pas).
import * as modeleJs from "../batiments/halte-route-pont/modele.js";

/** Ce que le jeu prend du modèle. */
interface ModelePont {
  creer(o: { usure?: number; carte: string }): THREE.Group;
  FICHE: { cartes: { id: string; decalage: { x: number; z: number } }[] };
}
const modele = modeleJs as unknown as ModelePont;
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

  constructor() {
    this.groupe.name = "route_pont";
    if (import.meta.env?.DEV) (globalThis as { __pont?: RenduRoutePont }).__pont = this;
  }

  /** Le décor : les tronçons (et leurs alentours) se construisent autour du joueur (animer). */
  creer(): THREE.Group {
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

  /** Est-on à portée de la caisse du péage ? (pour fermer la caisse quand on s'éloigne) */
  prochePeage(p: { x: number; z: number }): boolean {
    return prochePeage(p.x, p.z);
  }

  // ---------- Agir ----------

  /** Ce qu'on peut faire ici en plus : payer le péage (à la caisse, devant la porte), lire l'échelle de marée. */
  proposer(p: { x: number; z: number }, base: Propositions, instant: number, debutMonde: number): Propositions {
    const dBase = base.cible ? Math.max(0, Math.hypot(base.cible.x - p.x, base.cible.z - p.z) - (base.cible.rayon ?? 0.5)) : base.A ? 0 : Infinity;
    const passage: Passage = "pont";
    if (prochePeage(p.x, p.z)) {
      const cible = { x: CAISSE_PEAGE.x, z: CAISSE_PEAGE.z, rayon: 0.5 };
      const d = Math.max(0, Math.hypot(cible.x - p.x, cible.z - p.z) - cible.rayon);
      if (d <= dBase + 0.3) {
        return {
          A: this.ouvert ? null : { libelle: "Payer le péage", ouvrirCaisse: passage },
          B: { libelle: "Examiner", examiner: this.ouvert ? TEXTES_PEAGE.pont.dejaPaye : TEXTES_PEAGE.pont.examen },
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
    if (!nuit || !p) return [];
    const sources: SourceLumiere[] = [];
    for (const l of LUMIERES) {
      if (Math.abs(l.x - p.x) > 60) continue;
      // Les lanternes des panneaux de sortie (0.10, R0-1) : celles du modèle, la nuit seulement.
      if (estLanternePanneau(l.nature)) {
        sources.push(lumiereLanterneModele(l, { x: 0, z: 0 }));
        continue;
      }
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
