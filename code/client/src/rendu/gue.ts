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
  OUIE_RADIER,
  PORTEE_EMBARCADERE,
  RADEAU_AU_REPOS,
  RADIER,
  aBord,
  accostage,
  auGue,
  crue,
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
import { estomperToits } from "./halte.ts";
import type { SourceLumiere } from "./lumieres.ts";
// @ts-expect-error : le modèle du gué est en JavaScript, sans types (client/src/batiments/ ne se modifie pas) : typé ici.
import * as modeleJs from "../batiments/halte-gue/modele.js";
// @ts-expect-error : idem (les matières partagées du modèle, dont la texture des enseignes).
import * as outilsJs from "../batiments/halte-gue/outils.js";
// @ts-expect-error : idem (les régions de l'atlas des enseignes).
import * as atlasJs from "../batiments/halte-gue/atlas.js";

/** Ce que le jeu prend du modèle. */
interface ModeleGue {
  creer(o: { usure?: number; carte: string }): THREE.Group;
  FICHE: { cartes: { id: string; decalage: { x: number; z: number } }[] };
}
const modele = modeleJs as unknown as ModeleGue;
const outils = outilsJs as unknown as { matieres(): Record<string, THREE.Material & { map?: THREE.Texture | null }> };
const atlas = atlasJs as unknown as { R: Record<string, [number, number, number, number]>; AL: number; AH: number };

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
  /** Le tronçon retourné et posé à sa place (miroir en x). */
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

/**
 * Le texte des enseignes, retourné avec le gué, se lirait à l'envers : on retourne chaque enseigne dans sa région de
 * l'atlas (les coordonnées de texture u d'un triangle, d'un bord à l'autre de sa région).
 */
function remettreLesTextesALEndroit(g: THREE.Object3D, carte: THREE.Texture): void {
  const regions = Object.values(atlas.R).map(([x, y, l, h]) => ({ u0: x / atlas.AL, u1: (x + l) / atlas.AL, v0: 1 - (y + h) / atlas.AH, v1: 1 - y / atlas.AH }));
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    if (!mats.some((x) => (x as THREE.MeshStandardMaterial).map === carte)) return;
    const uv = m.geometry.getAttribute("uv") as THREE.BufferAttribute | undefined;
    if (!uv) return;
    const index = m.geometry.getIndex();
    const nb = index ? index.count : uv.count;
    const fait = new Uint8Array(uv.count);
    for (let t = 0; t < nb; t += 3) {
      const ids = [0, 1, 2].map((k) => (index ? index.getX(t + k) : t + k));
      const cu = ids.reduce((s, i) => s + uv.getX(i), 0) / 3;
      const cv = ids.reduce((s, i) => s + uv.getY(i), 0) / 3;
      const r = regions.find((q) => cu > q.u0 && cu < q.u1 && cv > q.v0 && cv < q.v1);
      if (!r) continue;
      for (const i of ids) {
        if (fait[i]) continue;
        fait[i] = 1;
        uv.setX(i, r.u0 + r.u1 - uv.getX(i));
      }
    }
    uv.needsUpdate = true;
  });
}

/**
 * Les panneaux de direction disaient « ← Ton terrain » : retourné, le terrain est à droite. On repeint leurs flèches
 * dans l'atlas (même fond, même police), en attendant que le modèle les donne pour le gué retourné.
 */
function repeindreLesDirections(carte: THREE.Texture): void {
  const canvas = carte.image as HTMLCanvasElement | undefined;
  const g = canvas?.getContext?.("2d");
  if (!g || carte.userData.directionsRepeintes) return;
  carte.userData.directionsRepeintes = true;
  const fonte = "'Avenir Next Condensed', 'Futura', 'Helvetica Neue', sans-serif";
  const ligne = (r: [number, number, number, number], y: number, h: number, texte: string, taille: number, gras: boolean, fond: string) => {
    const [x0, y0, l] = r;
    g.save();
    g.fillStyle = fond;
    g.fillRect(x0 + 12, y0 + y - h / 2, l - 24, h);
    g.font = `${gras ? "bold " : ""}${taille}px ${fonte}`;
    g.fillStyle = "#2b2b29";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(texte, x0 + l / 2, y0 + y, l - 30);
    g.restore();
  };
  const R = atlas.R;
  ligne(R.dirOuest!, 34, 36, "Ton terrain · La Campagne →", 30, true, "#f1ece0");
  ligne(R.dirEst!, 34, 36, "← Le Moulin du Gué · 2 km", 30, true, "#f1ece0");
  ligne(R.dirEst!, 70, 28, "Le Gué · Ton terrain →", 21, false, "#f1ece0");
  ligne(R.deviation!, 104, 30, "←", 30, true, "#e8b04a");
  carte.needsUpdate = true;
}

/** La guirlande de la guinguette, sur batterie solaire fatiguée : le même rythme que ses ampoules dans le modèle. */
function eclatGuirlande(t: number): number {
  const cycle = t % 6.5;
  if (cycle > 5.4) return 0.12;
  if (cycle > 4.2) return Math.sin(t * 31) > 0 ? 1 : 0.25;
  return 0.86 + 0.14 * Math.sin(t * 9);
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
  }

  /** Le décor, vide tant qu'on n'y est pas : les tronçons se construisent autour du joueur (animer). */
  creer(): THREE.Group {
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
    if (aBord(p.x, p.z, xr, 0.1)) garder(0, { A: haler, B: { libelle: "Examiner", examiner: examenBac }, cible: null });
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
    return meilleure ? (meilleure as { prop: Propositions }).prop : base;
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

  /** Les tronçons autour du joueur, le radeau, la nappe du radier, les toits qui s'effacent, l'eau qui court. */
  animer(p: { x: number; z: number }, dt: number, lacet: number, instant: number, debutMonde: number): void {
    const xr = this.radeau(instant);
    const ici = ORDRE.indexOf(tronconDe(p.x));
    const voulus = new Set<string>([ORDRE[ici]!, ...(ici > 0 ? [ORDRE[ici - 1]!] : []), ...(ici < 3 ? [ORDRE[ici + 1]!] : [])]);
    // Le radeau est dans le tronçon de la rive : on le garde tant qu'il n'est pas rentré à la cale.
    if (accostage(xr) !== "cale" && Math.abs(ORDRE.indexOf(TRONCON_RADEAU) - ici) <= 2) voulus.add(TRONCON_RADEAU);
    for (const id of voulus) if (!this.troncons.has(id)) this.construire(id);
    for (const [id, t] of this.troncons) if (!voulus.has(id)) this.defaire(id, t);

    // La nappe du radier monte avec la crue (G4), doucement.
    const voulu = crue(instant, debutMonde).montee;
    this.nappe += (voulu - this.nappe) * Math.min(1, dt * 0.6);
    for (const t of this.troncons.values()) {
      const nappe = t.modele.userData.nappeRadier as THREE.Object3D | null;
      if (nappe) nappe.position.y = this.nappe;
      const radeau = t.modele.userData.radeau as THREE.Object3D | null;
      // Dans le repère du tronçon (le modèle, recentré) : x = x du modèle − décalage du tronçon.
      if (radeau) radeau.position.x = 100 - xr - this.decalage(t.id);
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
    return modele.FICHE.cartes.find((c) => c.id === id)!.decalage.x;
  }

  /** Construit un tronçon : le modèle, retourné, posé à sa place ; ses toits dans le repère du jeu. */
  private construire(id: string): void {
    const x0 = this.decalage(id);
    const m = modele.creer({ carte: id });
    const carte = outils.matieres().panneaux?.map ?? null;
    if (carte) {
      repeindreLesDirections(carte);
      remettreLesTextesALEndroit(m, carte);
    }
    const g = new THREE.Group();
    g.name = `gue:${id}`;
    g.scale.x = -1;
    g.position.set(100 - x0, 0, 35);
    g.add(m);
    // Les toits : du repère du tronçon (recentré, avant le miroir) au repère du jeu.
    const versJeu = (b: Boite): Boite => ({ x: 100 - x0 - b.x, z: b.z + 35, l: b.l, p: b.p });
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

  /** Les tronçons construits (pour les mesures). */
  get construits(): string[] {
    return [...this.troncons.keys()];
  }
}
