// La corniche du Cap Rouge à l'écran (plan 0.10, chantier I) : le modèle de la session « bâtiments »
// (batiment/halte-corniche/, copié dans client/src/batiments/ par `npm run batiments:importer`, jamais modifié ici),
// posé dans le repère du jeu (commun/src/corniche.ts : décalé, pas retourné), et ce qui y change : le pin tombé (entier,
// ou débité quand on en a pris les dix bûches : chacun voit le sien), la porte de la barricade du tunnel (fermée, ou
// ouverte pour qui a payé le péage), les toits qui s'effacent, les lumières de la nuit, l'écume qui monte et descend.
//
// Quatre tronçons de 50 × 70 m : seuls celui du joueur et ses voisins sont construits (comme au gué). main.ts n'appelle
// que ce module (une ligne par point d'appel).

import * as THREE from "three";
import { CAISSE_PEAGE, CORNICHE, PORTE_BARRICADE_TUNNEL, PORTEE_CAISSE_TUNNEL, TRONCONS_CORNICHE, aLaCorniche, procheBarricade, tronconCorniche, zoneCorniche, type TronconCorniche } from "../../../commun/src/corniche.ts";
import { LUMIERES_CORNICHE } from "../../../commun/src/corniche-modele.ts";
import type { Boite, Zone } from "../../../commun/src/lieux.ts";
import type { MessageServeur } from "../../../commun/src/messages.ts";
import { TEXTES_PEAGE } from "../../../commun/src/peage.ts";
import type { Propositions } from "../interaction.ts";
import type { RessourceSol } from "../../../commun/src/terrain.ts";
import { brouillerTout } from "./carte-vue.ts";
import { tronconsVoulus } from "./vue-ensemble.ts";
import { estomperToits } from "./halte.ts";
import type { SourceLumiere } from "./lumieres.ts";
// @ts-expect-error : le modèle de la corniche est en JavaScript, sans types (client/src/batiments/ ne se modifie pas) : typé ici.
import * as modeleJs from "../batiments/halte-corniche/modele.js";

/** Ce que le jeu prend du modèle. */
interface ModeleCorniche {
  creer(o: { usure?: number; carte: string }): THREE.Group;
  FICHE: { cartes: { id: string; decalage: { x: number; z: number } }[] };
}
const modele = modeleJs as unknown as ModeleCorniche;

/** Un toit, une façade qui s'efface (le format de rendu/halte.ts : estomperToits), dans le repère du jeu. */
interface ToitJeu {
  nom: string;
  boite: Boite;
  materiaux: THREE.Material[];
  bas?: number;
  haut?: number;
  horsDe?: Boite;
  efface?: boolean;
}

interface Troncon {
  id: TronconCorniche;
  groupe: THREE.Group;
  modele: THREE.Group;
}

/** Le niveau de la mer (le modèle : MER_Y) et sa couleur (MER). */
const MER_Y = -15;
const MER = 0x2e7380;

/**
 * Autour du lot, la mer continue jusqu'à l'horizon, et la paroi rouge aux deux bouts : sans cela, on verrait le vide
 * au-delà du lot, vers le large et aux deux bouts de la route. Deux appels de dessin.
 */
function creerAlentours(): THREE.Group {
  const g = new THREE.Group();
  g.name = "corniche:alentours";
  const mer = new THREE.Mesh(new THREE.PlaneGeometry(1200, 600).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: MER, roughness: 0.35, metalness: 0.1 }));
  // Un peu sous la mer du modèle : elle ne la recouvre pas ; au-delà du lot, c'est elle qu'on voit.
  mer.position.set(CORNICHE.longueur / 2, MER_Y - 0.25, CORNICHE.largeur / 2 + 200);
  mer.receiveShadow = true;
  g.add(mer);
  // Aux deux bouts, la route s'enfonce dans la falaise rouge : une masse de roche de chaque côté, au nord de la route.
  const roche = new THREE.MeshStandardMaterial({ color: 0xa2654a, roughness: 1, flatShading: true });
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const masse = new THREE.InstancedMesh(geo, roche, 4);
  const m = new THREE.Matrix4();
  const places: [number, number, number, number, number][] = [
    // x, z, largeur, profondeur, hauteur (le pied à y = 0 côté route, plus bas côté mer)
    [-30, 14, 60, 40, 22],
    [CORNICHE.longueur + 30, 14, 60, 40, 22],
    [-30, 58, 60, 18, 2],
    [CORNICHE.longueur + 30, 58, 60, 18, 2],
  ];
  places.forEach(([x, z, l, p, h], i) => {
    m.compose(new THREE.Vector3(x, h / 2 - (i >= 2 ? 16 : 0), z), new THREE.Quaternion(), new THREE.Vector3(l, h, p));
    masse.setMatrixAt(i, m);
  });
  masse.castShadow = true;
  masse.receiveShadow = true;
  g.add(masse);
  return g;
}

/** Les lumières du modèle, dans le repère du jeu. */
const LUMIERES = LUMIERES_CORNICHE.map((l) => ({ ...l, ...aLaCorniche(l.x, l.z) }));

export class RenduCorniche {
  /** Le décor de la corniche (les tronçons construits s'y ajoutent). */
  readonly groupe = new THREE.Group();
  private readonly troncons = new Map<TronconCorniche, Troncon>();
  /** Mon pin tombé : vidé (débité) ou non ; la porte de la barricade : ouverte pour moi, ou fermée. */
  private pinDebite = false;
  private barricadeOuverte = false;

  constructor() {
    this.groupe.name = "corniche";
  }

  /** Le décor : les alentours tout de suite ; les tronçons se construisent autour du joueur (animer). */
  creer(): THREE.Group {
    if (this.groupe.children.length === 0) this.groupe.add(creerAlentours());
    return this.groupe;
  }

  /** La porte de la barricade, ouverte (rabattue contre les sacs de sable) ou fermée. */
  barricade(ouverte: boolean): void {
    this.barricadeOuverte = ouverte;
    this.montrerEtats();
  }

  // ---------- Le péage du tunnel (S-19 ; commun/src/peage.ts) ----------

  /** Le passage du péage, pour ce joueur (message `passage`) : la porte s'ouvre pour lui seul. */
  passage(m: Extract<MessageServeur, { t: "passage" }>): void {
    if (m.passage === "tunnel") this.barricade(m.ouvert);
  }

  /** La zone où l'on marche : comme le serveur, la porte de la barricade ouverte si l'on a payé. */
  zone(): Zone {
    return zoneCorniche(this.barricadeOuverte);
  }

  /** Est-on à portée de la caisse (ou de la porte) du péage ? (pour fermer la caisse quand on s'éloigne) */
  prochePeage(p: { x: number; z: number }): boolean {
    return procheBarricade(p.x, p.z);
  }

  /** Ce qu'on peut faire ici en plus : payer le péage, à la caisse ou contre la porte (comme au pont). */
  proposer(p: { x: number; z: number }, base: Propositions): Propositions {
    if (!procheBarricade(p.x, p.z)) return base;
    const dBase = base.cible ? Math.max(0, Math.hypot(base.cible.x - p.x, base.cible.z - p.z) - (base.cible.rayon ?? 0.5)) : base.A ? 0 : Infinity;
    const aLaCaisse = Math.hypot(p.x - CAISSE_PEAGE.x, p.z - CAISSE_PEAGE.z) <= PORTEE_CAISSE_TUNNEL;
    const porte = { x: PORTE_BARRICADE_TUNNEL.x, z: (PORTE_BARRICADE_TUNNEL.z0 + PORTE_BARRICADE_TUNNEL.z1) / 2, rayon: 0.9 };
    const cible = aLaCaisse ? { x: CAISSE_PEAGE.x, z: CAISSE_PEAGE.z, rayon: 0.5 } : porte;
    if (Math.max(0, Math.hypot(cible.x - p.x, cible.z - p.z) - cible.rayon) > dBase + 0.3) return base;
    const t = TEXTES_PEAGE.tunnel;
    return {
      A: this.barricadeOuverte ? null : { libelle: "Payer le péage", ouvrirCaisse: "tunnel" },
      B: { libelle: "Examiner", examiner: this.barricadeOuverte ? t.dejaPaye : aLaCaisse ? t.examen : t.ferme },
      cible,
    };
  }

  // ---------- La lumière ----------

  /** Les lumières de la corniche, la nuit : le brasero des pillards, le feu de la terrasse, les bougies, les écrans. */
  lumieres(nuit: boolean): SourceLumiere[] {
    if (!nuit) return [];
    return LUMIERES.map((l) => {
      const feu = /^(brasero|feu|bougie)/.test(l.nature);
      return { x: l.x, y: l.y, z: l.z, couleur: l.couleur, intensite: l.intensite, portee: l.portee, vacillement: feu ? 0.8 : 0 };
    });
  }

  // ---------- À chaque image ----------

  /**
   * Les tronçons autour du joueur (tous pendant la vue d'ensemble), le pin (débité quand je l'ai vidé : `ressources`, ce que le serveur m'a dit de mon
   * butin personnel ; il revient entier avec mes bûches), les toits qui s'effacent, l'écume.
   */
  animer(p: { x: number; z: number }, dt: number, lacet: number, ressources: Iterable<{ donnees: RessourceSol }>, ensemble = false): void {
    // Pendant la vue d'ensemble de l'arrivée (`ensemble`), tout le lieu (0.10, R52) ; ensuite, autour du joueur.
    const { voulus, aConstruire } = tronconsVoulus(TRONCONS_CORNICHE, TRONCONS_CORNICHE.indexOf(tronconCorniche(p.x)), ensemble, this.troncons);
    for (const id of aConstruire) this.construire(id);
    for (const [id, t] of this.troncons) if (!voulus.has(id)) this.defaire(id, t);

    for (const r of ressources) {
      if (r.donnees.type !== "pin_tombe") continue;
      const debite = !r.donnees.disponible;
      if (debite !== this.pinDebite) {
        this.pinDebite = debite;
        this.montrerEtats();
      }
    }
    estomperToits(this.groupe, p.x, p.z, dt, lacet);
    // L'écume qui monte et descend (les matières du modèle sont partagées : une fois suffit).
    for (const t of this.troncons.values()) {
      const anime = t.modele.children.find((o) => typeof o.userData.animer === "function");
      if (anime) {
        (anime.userData.animer as (t: number) => void)(performance.now() / 1000);
        break;
      }
    }
  }

  /** Le pin et la barricade, dans les tronçons construits (le modèle range ses objets nommés dans userData.objets). */
  private montrerEtats(): void {
    for (const t of this.troncons.values()) {
      const o = (t.modele.userData.objets ?? {}) as Record<string, THREE.Object3D>;
      if (o.pin_entier) o.pin_entier.visible = !this.pinDebite;
      if (o.pin_debite) o.pin_debite.visible = this.pinDebite;
      if (o.barricade_fermee) o.barricade_fermee.visible = !this.barricadeOuverte;
      if (o.barricade_ouverte) o.barricade_ouverte.visible = this.barricadeOuverte;
    }
  }

  private decalage(id: string): number {
    return modele.FICHE.cartes.find((c) => c.id === id)!.decalage.x;
  }

  /** Construit un tronçon et le pose à sa place ; ses toits dans le repère du jeu. */
  private construire(id: TronconCorniche): void {
    const x0 = this.decalage(id);
    const m = modele.creer({ carte: id });
    const g = new THREE.Group();
    g.name = `corniche:${id}`;
    const o = aLaCorniche(x0, 0);
    g.position.set(o.x, 0, o.z);
    g.add(m);
    const versJeu = (b: Boite): Boite => ({ ...aLaCorniche(x0 + b.x, b.z), l: b.l, p: b.p });
    const toits = ((m.userData.toits ?? []) as ToitJeu[]).map((t) => ({ ...t, boite: versJeu(t.boite), ...(t.horsDe ? { horsDe: versJeu(t.horsDe) } : {}) }));
    m.userData.toits = undefined;
    g.userData.toits = toits;
    // La vue par pièce (0.7.2) : ce que le personnage ne voit pas est dessiné « en souvenir ».
    brouillerTout([g]);
    this.groupe.add(g);
    this.troncons.set(id, { id, groupe: g, modele: m });
    this.montrerEtats();
  }

  /** Défait un tronçon trop loin : ses géométries s'en vont (les matières du modèle sont partagées, elles restent). */
  private defaire(id: TronconCorniche, t: Troncon): void {
    this.groupe.remove(t.groupe);
    t.groupe.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    this.troncons.delete(id);
  }

  /** Les quatre tronçons à la fois (pour les tests). */
  toutConstruire(): THREE.Group {
    for (const id of TRONCONS_CORNICHE) if (!this.troncons.has(id)) this.construire(id);
    return this.groupe;
  }

  /** Les tronçons construits (pour les mesures). */
  get construits(): string[] {
    return [...this.troncons.keys()];
  }

  /** Un objet nommé du modèle, s'il est dans un tronçon construit (pour les tests). */
  objet(nom: string): THREE.Object3D | undefined {
    for (const t of this.troncons.values()) {
      const o = (t.modele.userData.objets ?? {}) as Record<string, THREE.Object3D>;
      if (o[nom]) return o[nom];
    }
    return undefined;
  }
}
