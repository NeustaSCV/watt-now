// Le Gué-aux-Saules à l'écran (plan 0.8, chantier 11) : le modèle de la session « bâtiments » (batiment/halte-gue/,
// copié dans client/src/batiments/ par `npm run batiments:importer`, jamais modifié ici), retourné pour suivre la carte
// (le terrain à l'est, commun/src/gue.ts), et ce qui y vit : le radeau du bac, la nappe du radier qui monte avec la
// crue, les toits qui s'effacent, les lumières de la nuit (la guirlande de Chez Lulu), le clapot et le câble.
//
// Quatre tronçons de 50 × 70 m : seuls celui du joueur et ses voisins sont construits ; celui du radeau (la rive côté
// terrain) reste construit tant que le radeau n'est pas à la cale. main.ts n'appelle que ce module (une ligne par point
// d'appel).

import * as THREE from "three";
import {
  BAC,
  BALISES,
  CLOCHE,
  ID_DERIVE,
  OUIE_RADIER,
  PORTEE_EMBARCADERE,
  RADEAU_AU_REPOS,
  RADIER,
  aBord,
  auBordDuRadeau,
  accostage,
  auGue,
  crue,
  dansLaRiviere,
  placeRadeau,
  surLeRadier,
  texteBalise,
  zoneGue,
  type MouvementRadeau,
} from "../../../commun/src/gue.ts";
import { LUMIERES_MODELE } from "../../../commun/src/gue-modele.ts";
import type { Position } from "../../../commun/src/deplacement.ts";
import type { Boite, Zone } from "../../../commun/src/lieux.ts";
import type { MessageServeurGue, ProjectileVu } from "../../../commun/src/messages.ts";
import type { ActionProposee, Propositions } from "../interaction.ts";
import type { IdSon } from "../son/catalogue.ts";
import { brouillerTout } from "./carte-vue.ts";
import { tronconsVoulus } from "./vue-ensemble.ts";
import { estomperToits } from "./halte.ts";
import type { SourceLumiere } from "./lumieres.ts";
// @ts-expect-error : le modèle du gué est en JavaScript, sans types (client/src/batiments/ ne se modifie pas) : typé ici.
import * as modeleJs from "../batiments/halte-gue/modele.js";

/** Ce que le jeu prend du modèle. */
interface ModeleGue {
  creer(o: { usure?: number; carte: string; miroir?: boolean }): THREE.Group;
  /** La fiche du gué retourné : les décalages des tronçons (le chemin creux à +75, côté terrain, à l'est). */
  FICHE_MIROIR: { cartes: { id: string; decalage: { x: number; z: number } }[] };
}
const modele = modeleJs as unknown as ModeleGue;

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
  id: string;
  /** Le tronçon (retourné par le modèle) posé à sa place. */
  groupe: THREE.Group;
  modele: THREE.Group;
}

/** Les tronçons d'ouest en est dans le jeu (retourné) : la remontée vers le Moulin, le gué, la rive, le chemin creux. */
const ORDRE = ["sortie", "gue", "rive", "chemin"] as const;
/** Le tronçon où se trouve un point du jeu. */
function tronconDe(x: number): (typeof ORDRE)[number] {
  return ORDRE[Math.max(0, Math.min(3, Math.floor(x / 50)))]!;
}

/** Le tronçon du radeau du bac. */
const TRONCON_RADEAU = "rive";

/** La guirlande de la guinguette, sur batterie solaire fatiguée : le même rythme que ses ampoules dans le modèle. */
function eclatGuirlande(t: number): number {
  const cycle = t % 6.5;
  if (cycle > 5.4) return 0.12;
  if (cycle > 4.2) return Math.sin(t * 31) > 0 ? 1 : 0.25;
  return 0.86 + 0.14 * Math.sin(t * 9);
}

// ---------- Les alentours ----------
//
// La vallée qui continue au-delà du lot (le relief, la rivière en amont et en aval, la route, quelques arbres) est dans le
// modèle depuis la 0.10 (N-2 : le groupe `alentours` de chaque tronçon, retourné avec lui par le miroir) : le jeu n'y
// ajoute que quelques pierres éboulées au bout ouest.

/**
 * Plan 0.8.2 (obstacles-visibles.test.ts) : au bout ouest, le pied du talus touche la route vers le Moulin sans rien qui
 * se voie sur un mètre ; quelques pierres éboulées le marquent.
 */
function creerEboulis(): THREE.Group {
  const g = new THREE.Group();
  g.name = "gue:eboulis";
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7d7768, roughness: 1, flatShading: true });
  for (const [x, z, e] of [[0.35, 33.3, 0.34], [0.7, 33.9, 0.26], [0.25, 34.5, 0.4], [0.9, 33.45, 0.18]] as const) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, e * 0.45, z);
    m.scale.set(e, e * 0.7, e * 1.1);
    m.rotation.y = x * 7 + z;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

/** Les lumières du modèle, dans le repère du jeu. */
const LUMIERES = LUMIERES_MODELE.map((l) => ({ ...l, ...auGue(l.x, l.z) }));

export class RenduGue {
  /** Le décor du gué (les tronçons construits s'y ajoutent). */
  readonly groupe = new THREE.Group();
  private readonly troncons = new Map<string, Troncon>();
  private mouvement: MouvementRadeau = { ...RADEAU_AU_REPOS };
  /** La place du radeau quand on a porté le joueur la dernière fois (le radeau l'emporte). */
  private radeauPorte: number | null = null;
  private nappe = 0;
  private readonly jouer: (id: IdSon, ou?: { x: number; z: number }) => void;

  constructor(jouer: (id: IdSon, ou?: { x: number; z: number }) => void) {
    this.jouer = jouer;
    this.groupe.name = "gue";
    // En développement seulement : de quoi lire, depuis la console, où l'on est et ce que le gué propose.
    if (import.meta.env?.DEV) (globalThis as { __gue?: RenduGue }).__gue = this;
  }

  /** En développement : la dernière place vue et la dernière proposition (pour les essais). */
  dernier: { p?: { x: number; z: number }; prop?: Propositions; base?: Propositions } = {};

  /** Le décor : l'éboulis tout de suite ; les tronçons (et leurs alentours) se construisent autour du joueur (animer). */
  creer(): THREE.Group {
    if (this.groupe.children.length === 0) this.groupe.add(creerEboulis());
    return this.groupe;
  }

  // ---------- Ce que dit le serveur ----------

  recevoir(m: MessageServeurGue): void {
    this.mouvement = m.radeau;
    if (m.cloche) this.jouer("cloche_bac", CLOCHE);
  }

  /** La place du radeau à cet instant (heure du serveur). */
  radeau(instant: number): number {
    return placeRadeau(this.mouvement, instant);
  }

  // ---------- Se déplacer ----------

  /** La zone où l'on marche : comme le serveur, avec le radeau à sa place et le radier noyé par la crue. */
  zone(instant: number, debutMonde: number): Zone {
    return zoneGue({ radeau: this.radeau(instant), noye: crue(instant, debutMonde).niveau === "noye" });
  }

  /** À bord, le radeau nous emporte (le serveur fait de même). */
  porter(p: Position, instant: number): Position {
    const xr = this.radeau(instant);
    const avant = this.radeauPorte;
    this.radeauPorte = xr;
    if (avant === null || avant === xr || !aBord(p.x, p.z, avant, 0.05)) return p;
    return { ...p, x: p.x + (xr - avant) };
  }

  /** Sur le radier, on marche, on n'y court pas. */
  surLeRadier(p: { x: number; z: number }): boolean {
    return surLeRadier(p.x, p.z);
  }

  /**
   * Plan 0.8.2 (R3) : cet Éteint fait-il entrer (ou rester) en mode Combat ? Celui qui dérive dans l'eau, contre le
   * radier, ne menace que qui marche sur le radier au-dessus de l'eau (pas sur sa tête, encore sur la berge) : sans
   * cela, sa ronde à moins de 10 m du bac gardait le joueur en mode Combat (A : « Frapper ») et « Haler le bac » ne
   * paraissait pas avant qu'on s'éloigne et revienne ; au bord du radier noyé, il couvrait la ligne de la crue (R19).
   */
  menace(id: number, p: { x: number; z: number }): boolean {
    return id !== ID_DERIVE || (surLeRadier(p.x, p.z) && dansLaRiviere(p.x, p.z));
  }

  /** Jusqu'où l'on entend les Éteints : sur le radier, l'eau couvre tout au-delà de 3 m (G1). */
  ouie(p: { x: number; z: number } | null): number {
    return p && surLeRadier(p.x, p.z) ? OUIE_RADIER : Infinity;
  }

  // ---------- Agir ----------

  /** Ce qu'on peut faire ici en plus : la cloche, haler ou rappeler le bac, examiner une balise. */
  proposer(p: Position, base: Propositions, instant: number, debutMonde: number): Propositions {
    const dBase = base.cible ? Math.max(0, Math.hypot(base.cible.x - p.x, base.cible.z - p.z) - (base.cible.rayon ?? 0.5)) : base.A ? 0 : Infinity;
    let meilleure: { d: number; prop: Propositions } | null = null;
    const garder = (d: number, prop: Propositions) => {
      if (d <= 2 && d < dBase && (!meilleure || d < meilleure.d)) meilleure = { d, prop };
    };
    const xr = this.radeau(instant);
    const ou = accostage(xr);
    const haler: ActionProposee = { libelle: "Haler le bac", message: { t: "gue", op: "haler" } };
    const examenBac = "Le radeau du passeur, sur ses bidons, glisse le long du câble. On tire la corde : un quart de minute jusqu'à l'autre rive, de jour comme de nuit. On peut lâcher pour se battre.";
    // Plan 0.8.2 (R3) : à bord, haler passe avant tout, partout sur le plancher et dès qu'on y pose le pied (autrefois
    // à égalité avec ce qu'on visait autour, il pouvait ne pas paraître).
    // Plan 0.8.2 §7.6 : et dès le bord du radeau à quai (on monte à bord d'un pas en halant).
    if (auBordDuRadeau(p.x, p.z, xr)) {
      const prop: Propositions = { A: haler, B: { libelle: "Examiner", examiner: examenBac }, cible: null };
      this.dernier = { p: { x: p.x, z: p.z }, prop, base };
      return prop;
    }
    for (const quai of [{ nom: "cale" as const, ...BAC.cale }, { nom: "ponton" as const, ...BAC.ponton }]) {
      const d = Math.hypot(quai.embarquement.x - p.x, quai.embarquement.z - p.z);
      if (d > PORTEE_EMBARCADERE || ou === quai.nom) continue;
      garder(Math.max(0, d - 0.6), {
        A: { libelle: "Rappeler le radeau", message: { t: "gue", op: "haler" } },
        B: { libelle: "Examiner", examiner: "Le radeau est de l'autre côté. La corde du câble passe ici : on peut le haler à vide jusqu'à soi." },
        cible: { x: quai.embarquement.x, z: quai.embarquement.z },
      });
    }
    garder(Math.max(0, Math.hypot(CLOCHE.x - p.x, CLOCHE.z - p.z) - 0.6), {
      A: { libelle: "Sonner la cloche (attire les Éteints)", message: { t: "gue", op: "cloche" } },
      B: { libelle: "Examiner", examiner: "La cloche du passeur : on la sonnait pour appeler le bac. Elle s'entend à quarante mètres, sur les deux rives." },
      cible: { x: CLOCHE.x, z: CLOCHE.z },
    });
    let balise: { x: number; z: number } | null = null;
    let dBalise = Infinity;
    for (const b of BALISES) {
      const d = Math.hypot(b.x - p.x, b.z - p.z);
      if (d < dBalise) [balise, dBalise] = [b, d];
    }
    if (balise && dBalise < 1.6) garder(Math.max(0, dBalise - 0.4), { A: null, B: { libelle: "Examiner la balise", examiner: texteBalise(crue(instant, debutMonde).niveau) }, cible: { x: balise.x, z: balise.z, rayon: 0.3 } });
    const choisie = meilleure ? (meilleure as { prop: Propositions }).prop : base;
    this.dernier = { p: { x: p.x, z: p.z }, prop: choisie, base };
    return choisie;
  }

  // ---------- Les ricochets (G8) ----------

  /**
   * Un galet bien lancé : il vole jusqu'à l'eau, puis rebondit de point en point jusqu'à l'autre rive. Chaque contact
   * fait « plouf » et une gerbe d'eau ; le dernier bond retombe sur les galets.
   */
  ricocher(p: ProjectileVu, lancer: (q: ProjectileVu, arrivee: () => void) => void, fin: () => void): void {
    const points = [{ x: p.x0, z: p.z0 }, ...(p.ricochets ?? []), { x: p.x1, z: p.z1 }];
    const etape = (i: number) => {
      if (i >= points.length - 1) return fin();
      const a = points[i]!;
      const b = points[i + 1]!;
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      const dernier = i === points.length - 2;
      const q: ProjectileVu = { de: p.de, objet: p.objet, x0: a.x, z0: a.z, x1: b.x, z1: b.z, duree: Math.round((d / (i === 0 ? 14 : 11)) * 1000), impact: dernier ? "sol" : "eau" };
      lancer(q, () => {
        if (!dernier) this.jouer("plouf", b);
        etape(i + 1);
      });
    };
    etape(0);
  }

  // ---------- Le son ----------

  /** Les sons continus du gué : le clapot du radier (au plus près du joueur), le câble du bac quand le radeau avance. */
  sons(p: { x: number; z: number } | null, instant: number, debutMonde: number): { cle: string; id: IdSon; ou?: { x: number; z: number }; gain?: number }[] {
    if (!p) return [];
    const sons: { cle: string; id: IdSon; ou?: { x: number; z: number }; gain?: number }[] = [];
    const ou = { x: Math.max(RADIER.x0, Math.min(RADIER.x1, p.x)), z: Math.max(RADIER.z0, Math.min(RADIER.z1, p.z)) };
    sons.push({ cle: "gue_clapot", id: "clapot_radier", ou, gain: crue(instant, debutMonde).niveau === "noye" ? 1.4 : 1 });
    if (this.mouvement.sens !== 0 && accostage(this.radeau(instant)) === null) sons.push({ cle: "gue_cable", id: "cable_bac", ou: { x: this.radeau(instant), z: BAC.z } });
    return sons;
  }

  // ---------- La lumière ----------

  /** Les lumières du gué, la nuit : la guirlande de Chez Lulu qui clignote, la lanterne du passeur, le feu du banc… */
  lumieres(nuit: boolean, p: { x: number; z: number } | null): SourceLumiere[] {
    if (!nuit) return [];
    const t = performance.now() / 1000;
    const g = eclatGuirlande(t);
    const sources: SourceLumiere[] = [];
    for (const l of LUMIERES) {
      // Le lampadaire « à détection de présence » ne s'allume qu'au passage.
      if (l.nature.startsWith("lampadaire") && (!p || Math.hypot(l.x - p.x, l.z - p.z) > 9)) continue;
      const guirlande = l.nature.startsWith("guirlande");
      const feu = l.nature.startsWith("feu") || l.nature.startsWith("lanterne") || l.nature.startsWith("bougies");
      sources.push({ x: l.x, y: l.y, z: l.z, couleur: l.couleur, intensite: l.intensite * (guirlande ? g : 1), portee: l.portee, vacillement: feu ? 0.8 : 0 });
    }
    return sources;
  }

  // ---------- À chaque image ----------

  /** Les tronçons autour du joueur (tous pendant la vue d'ensemble), le radeau, la nappe du radier, les toits qui s'effacent, l'eau qui court. */
  animer(p: { x: number; z: number }, dt: number, lacet: number, instant: number, debutMonde: number, ensemble = false): void {
    const xr = this.radeau(instant);
    const ici = ORDRE.indexOf(tronconDe(p.x));
    // Pendant la vue d'ensemble de l'arrivée (`ensemble`), tout le gué (0.10, R52) ; ensuite, autour du joueur.
    const { voulus, aConstruire } = tronconsVoulus<string>(ORDRE, ici, ensemble, this.troncons);
    // Le radeau est dans le tronçon de la rive : on le garde tant qu'il n'est pas rentré à la cale.
    if (accostage(xr) !== "cale" && Math.abs(ORDRE.indexOf(TRONCON_RADEAU) - ici) <= 2) {
      voulus.add(TRONCON_RADEAU);
      if (!this.troncons.has(TRONCON_RADEAU) && !aConstruire.includes(TRONCON_RADEAU)) aConstruire.push(TRONCON_RADEAU);
    }
    for (const id of aConstruire) this.construire(id);
    for (const [id, t] of this.troncons) if (!voulus.has(id)) this.defaire(id, t);

    // La nappe du radier monte avec la crue (G4), doucement.
    const voulu = crue(instant, debutMonde).montee;
    this.nappe += (voulu - this.nappe) * Math.min(1, dt * 0.6);
    for (const t of this.troncons.values()) {
      const nappe = t.modele.userData.nappeRadier as THREE.Object3D | null;
      if (nappe) nappe.position.y = this.nappe;
      const radeau = t.modele.userData.radeau as THREE.Object3D | null;
      // Dans le repère du tronçon retourné (recentré) : x = x du jeu − 100 − décalage du tronçon.
      if (radeau) radeau.position.x = xr - 100 - this.decalage(t.id);
    }
    estomperToits(this.groupe, p.x, p.z, dt, lacet);
    // L'eau qui court, la guirlande et les flammes (les matières du modèle sont partagées : une fois suffit).
    for (const t of this.troncons.values()) {
      const anime = t.modele.children.find((o) => typeof o.userData.animer === "function");
      if (anime) {
        (anime.userData.animer as (t: number) => void)(performance.now() / 1000);
        break;
      }
    }
  }

  private decalage(id: string): number {
    return modele.FICHE_MIROIR.cartes.find((c) => c.id === id)!.decalage.x;
  }

  /**
   * Construit un tronçon : le modèle le retourne lui-même (`miroir: true` : le terrain à l'est, les textes et les
   * flèches des enseignes à l'endroit) ; on le pose à sa place, ses toits dans le repère du jeu.
   */
  private construire(id: string): void {
    const x0 = this.decalage(id);
    const m = modele.creer({ carte: id, miroir: true });
    const g = new THREE.Group();
    g.name = `gue:${id}`;
    g.position.set(100 + x0, 0, 35);
    g.add(m);
    // Les toits : du repère du tronçon (recentré) au repère du jeu.
    const versJeu = (b: Boite): Boite => ({ x: 100 + x0 + b.x, z: b.z + 35, l: b.l, p: b.p });
    const toits = ((m.userData.toits ?? []) as ToitJeu[]).map((t) => ({ ...t, boite: versJeu(t.boite), ...(t.horsDe ? { horsDe: versJeu(t.horsDe) } : {}) }));
    m.userData.toits = undefined;
    g.userData.toits = toits;
    // La vue par pièce (0.7.2) : ce que le personnage ne voit pas est dessiné « en souvenir ».
    brouillerTout([g]);
    this.groupe.add(g);
    this.troncons.set(id, { id, groupe: g, modele: m });
  }

  /** Défait un tronçon trop loin : ses géométries s'en vont (les matières du modèle sont partagées, elles restent). */
  private defaire(id: string, t: Troncon): void {
    this.groupe.remove(t.groupe);
    t.groupe.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    this.troncons.delete(id);
  }

  /** Les quatre tronçons à la fois (pour les tests : le contrôle des obstacles voit tout le gué). */
  toutConstruire(): THREE.Group {
    for (const id of ORDRE) if (!this.troncons.has(id)) this.construire(id);
    return this.groupe;
  }

  /** Les tronçons construits (pour les mesures). */
  get construits(): string[] {
    return [...this.troncons.keys()];
  }
}
