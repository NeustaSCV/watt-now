// Ce qui flotte au-dessus des voyageurs d'une halte (duel 0.11, D-16, D-19, D-21) : une couche HTML au-dessus du monde,
// sous le HUD. Pour chacun : son nom (la pastille sombre, le rond de sa famille, le pseudo crème, comme l'étiquette
// dessinée dans la scène jusqu'en 0.10) ; pendant un duel, **une barre fine sous le nom** (jauges V1), la sienne sous
// « Toi », vue des duellistes comme des témoins, et « trop loin · N s » dessous pendant la fuite ; à la fin, « + machette »
// qui monte au-dessus du gagnant, « − machette » qui descend au-dessus du perdant, ou « sac vide » (fin V1).
// Le serveur décide de tout : on montre `duels` et `duel_fin` tels qu'ils arrivent.
//
// Pourquoi en HTML : le texte reste net à toute distance, on écarte facilement deux étiquettes qui se chevauchent
// (deux duellistes à 1,5 m l'un de l'autre), et on n'ajoute ni matériau ni texture par personnage dans la scène.

import * as THREE from "three";
import type { DuelVu } from "../../commun/src/messages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { OBJETS } from "../../commun/src/objets.ts";
import { typeDe, type CleObjet } from "../../commun/src/etoiles.ts";
import { icone } from "./icones.ts";

/** Les couleurs des familles (le rond de l'étiquette). */
export const COULEURS_FAMILLE: Record<Famille, string> = { charbonniers: "#a4552f", voltaiques: "#2f5fa4", mecanistes: "#7f8f3a" };
/** La fuite (D-4) : à plus de 25 m l'un de l'autre pendant ce temps, le duel est annulé. */
export const DUREE_FUITE_MS = 10_000;
/** Sous ce reste, la barre passe à l'ocre (jamais le rouge : c'est la couleur du halo de Combat). */
export const SEUIL_BAS = 0.3;
/** « + machette », « − machette » : le temps de les lire (ms), puis elles s'effacent. */
export const DUREE_FIN_MS = 3300;
/** La hauteur de l'étiquette au-dessus des pieds (m) : juste au-dessus de la tête. */
export const HAUTEUR_ETIQUETTE = 2.05;
/** L'écart entre deux étiquettes côte à côte (px). */
const MARGE = 6;

/** Un voyageur qui porte une étiquette : `pseudo` null, c'est soi (« Toi », montré seulement pendant un duel). */
export interface Porteur {
  id: number;
  pseudo: string | null;
  famille: Famille;
  /** Ses pieds, dans le monde. */
  x: number;
  y: number;
  z: number;
  /** Vu (la vue par pièce le cache derrière un mur) et debout. */
  visible: boolean;
}

/** Ce que l'on sait d'un duelliste : sa jauge (0 à 1), son adversaire, depuis quand ils sont trop loin l'un de l'autre. */
interface Duelliste {
  jauge: number;
  adversaire: number;
  loinDepuis?: number;
}

/** Les duels en vue, d'après le dernier message `duels` (la liste complète ; vide : plus aucun). */
export class EtatDuels {
  private readonly duellistes = new Map<number, Duelliste>();

  /** Le message `duels` : renvoie ceux dont la jauge vient de baisser (un coup reçu). */
  recevoir(liste: readonly DuelVu[]): number[] {
    const avant = new Map(this.duellistes);
    this.duellistes.clear();
    for (const d of liste) {
      this.duellistes.set(d.a, { jauge: d.ja, adversaire: d.b, ...(d.loinDepuis !== undefined ? { loinDepuis: d.loinDepuis } : {}) });
      this.duellistes.set(d.b, { jauge: d.jb, adversaire: d.a, ...(d.loinDepuis !== undefined ? { loinDepuis: d.loinDepuis } : {}) });
    }
    const touches: number[] = [];
    for (const [id, d] of this.duellistes) {
      const a = avant.get(id);
      if (a && d.jauge < a.jauge - 1e-6) touches.push(id);
    }
    return touches;
  }

  /** La fin d'un duel : les deux jauges s'effacent tout de suite (le serveur enverra aussi la liste sans eux). */
  finir(a: number, b: number): void {
    this.duellistes.delete(a);
    this.duellistes.delete(b);
  }

  vider(): void {
    this.duellistes.clear();
  }

  enDuel(id: number): boolean {
    return this.duellistes.has(id);
  }

  duelliste(id: number): Readonly<Duelliste> | undefined {
    return this.duellistes.get(id);
  }
}

/** Ce que montre une étiquette. */
export interface ContenuEtiquette {
  /** Le nom écrit (« Toi » pour soi) ; null : pas de nom (soi, hors duel). */
  nom: string | null;
  /** La jauge (0 à 1) ; null : pas en duel. */
  jauge: number | null;
  bas: boolean;
  /** « trop loin · 7 s » ; null : assez près. */
  compte: string | null;
}

export function contenuEtiquette(p: Pick<Porteur, "id" | "pseudo">, duels: EtatDuels, maintenantServeur: number): ContenuEtiquette {
  const d = duels.duelliste(p.id);
  const nom = p.pseudo === null ? (d ? "Toi" : null) : p.pseudo;
  if (!d) return { nom, jauge: null, bas: false, compte: null };
  const jauge = Math.min(1, Math.max(0, d.jauge));
  const compte = d.loinDepuis === undefined ? null : `trop loin · ${Math.max(1, Math.ceil((DUREE_FUITE_MS - (maintenantServeur - d.loinDepuis)) / 1000))} s`;
  return { nom, jauge, bas: jauge <= SEUIL_BAS, compte };
}

/** Une étiquette à l'écran : son point d'ancrage (le bas, au milieu), sa largeur et sa hauteur (px). */
export interface Boite {
  x: number;
  y: number;
  l: number;
  h: number;
}

/**
 * Les étiquettes trop proches s'écartent de côté, juste ce qu'il faut, chacune au plus près de son personnage. Renvoie
 * le décalage horizontal de chacune (px).
 */
export function ecarter(boites: readonly Boite[]): number[] {
  const dx = boites.map(() => 0);
  for (let passe = 0; passe < 10; passe++) {
    for (let i = 0; i < boites.length; i++) {
      for (let j = i + 1; j < boites.length; j++) {
        const p = boites[i]!;
        const q = boites[j]!;
        if (Math.abs(p.y - q.y) > Math.min(p.h, q.h) * 0.8 + 4) continue;
        const ecart = (p.l + q.l) / 2 + MARGE - Math.abs(p.x + dx[i]! - (q.x + dx[j]!));
        if (ecart <= 0) continue;
        const sens = p.x + dx[i]! <= q.x + dx[j]! ? -1 : 1;
        dx[i]! += (sens * ecart) / 2;
        dx[j]! -= (sens * ecart) / 2;
      }
    }
  }
  return dx;
}

/** Une zone de l'écran (px). */
export interface Zone {
  gauche: number;
  droite: number;
  bas: number;
}

/**
 * Une étiquette ne tombe pas dans la bande des messages (en paysage, en haut au milieu) : si elle la croise, elle passe
 * juste dessous. Renvoie le y de son ancrage (son bas).
 */
export function sousLaBande(b: Boite, bande: Zone | null): number {
  if (!bande) return b.y;
  if (b.x + b.l / 2 < bande.gauche || b.x - b.l / 2 > bande.droite) return b.y;
  return Math.max(b.y, bande.bas + 4 + b.h);
}

/** Le contenu d'une pastille de fin : « + machette », « − machette », « sac vide » (le texte est sûr : des noms d'objets). */
export function htmlFin(genre: "plus" | "moins" | "vide", objet?: CleObjet): string {
  if (genre === "vide" || !objet) return `${icone("sac_a_dos", 22)}<span>sac vide</span>`;
  const type = typeDe(objet);
  return `${icone(type, 22)}<span class="signe">${genre === "plus" ? "+" : "−"}</span><span>${OBJETS[type]?.nom ?? type}</span>`;
}

/** Une étiquette dans la couche HTML. */
interface Pile {
  el: HTMLElement;
  fin: HTMLElement;
  nom: HTMLElement;
  texte: HTMLElement;
  barre: HTMLElement;
  compte: HTMLElement;
  cle: string;
  l: number;
  h: number;
  /** Le décalage vertical sous la bande des messages, lissé (px). */
  baisse: number;
  pseudo: string | null;
}

export class Etiquettes {
  readonly duels = new EtatDuels();
  private readonly couche: HTMLElement;
  private readonly piles = new Map<number, Pile>();
  private readonly projete = new THREE.Vector3();

  constructor(couche: HTMLElement) {
    this.couche = couche;
  }

  /** Le message `duels` : les jauges ; la barre de qui vient d'être touché s'éclaire et tremble. Renvoie les touchés. */
  recevoirDuels(liste: readonly DuelVu[]): number[] {
    const touches = this.duels.recevoir(liste);
    for (const id of touches) {
      const p = this.piles.get(id);
      if (!p) continue;
      p.el.classList.remove("coup");
      void p.el.offsetWidth;
      p.el.classList.add("coup");
    }
    return touches;
  }

  /**
   * La fin d'un duel (D-16, D-19 fin V1, D-21) : au-dessus du gagnant, « + machette » qui monte ; au-dessus du perdant,
   * « − machette » qui descend, ou « sac vide » (rien au-dessus du gagnant). L'annulation par la fuite : rien à montrer
   * ici (le serveur l'écrit aux deux duellistes).
   */
  finir(m: { a: number; b: number; issue: "gagne" | "annule"; gagnant?: number; objet?: CleObjet; sacVide?: true }): void {
    this.duels.finir(m.a, m.b);
    if (m.issue !== "gagne" || m.gagnant === undefined) return;
    const perdant = m.gagnant === m.a ? m.b : m.a;
    if (m.sacVide || !m.objet) return this.pastille(perdant, "vide");
    this.pastille(m.gagnant, "plus", m.objet);
    this.pastille(perdant, "moins", m.objet);
  }

  /** On change de lieu : plus rien au-dessus de personne. */
  vider(): void {
    this.duels.vider();
    for (const p of this.piles.values()) p.el.remove();
    this.piles.clear();
  }

  private pastille(id: number, genre: "plus" | "moins" | "vide", objet?: CleObjet): void {
    const p = this.piles.get(id);
    if (!p) return;
    const d = document.createElement("div");
    d.className = `gain-duel ${genre === "plus" ? "plus" : "moins"}`;
    d.innerHTML = htmlFin(genre, objet);
    p.fin.append(d);
    p.cle = ""; // la taille change : on la remesure
    window.setTimeout(() => {
      d.remove();
      p.cle = "";
    }, DUREE_FIN_MS);
  }

  private creer(porteur: Porteur): Pile {
    const el = document.createElement("div");
    el.className = "pile";
    el.innerHTML = `<div class="fin"></div><div class="nom"><span class="rond"></span><span class="texte"></span></div><div class="jauge-duel"><span></span></div><div class="compte"></div>`;
    const q = (s: string) => el.querySelector<HTMLElement>(s)!;
    q(".rond").style.background = COULEURS_FAMILLE[porteur.famille];
    this.couche.append(el);
    return { el, fin: q(".fin"), nom: q(".nom"), texte: q(".nom .texte"), barre: q(".jauge-duel > span"), compte: q(".compte"), cle: "", l: 0, h: 0, baisse: 0, pseudo: porteur.pseudo };
  }

  /**
   * Chaque image : chaque étiquette suit son voyageur à l'écran. `bande` : la bande des messages (null : vide), qu'elles
   * évitent ; `cachee` : le mode photo, l'image propre.
   */
  placer(porteurs: readonly Porteur[], camera: THREE.Camera, largeur: number, hauteur: number, maintenantServeur: number, bande: Zone | null, dt: number, cachee = false): void {
    const vus = new Set<number>();
    const montrees: { p: Pile; b: Boite }[] = [];
    for (const porteur of porteurs) {
      vus.add(porteur.id);
      let p = this.piles.get(porteur.id);
      if (!p || p.pseudo !== porteur.pseudo) {
        p?.el.remove();
        p = this.creer(porteur);
        this.piles.set(porteur.id, p);
      }
      const c = contenuEtiquette(porteur, this.duels, maintenantServeur);
      const aFin = p.fin.childElementCount > 0;
      const montree = !cachee && porteur.visible && (c.nom !== null || aFin);
      if (!montree) {
        p.el.hidden = true;
        continue;
      }
      // À l'écran : l'ancrage juste au-dessus de la tête.
      const v = this.projete;
      v.set(porteur.x, porteur.y + HAUTEUR_ETIQUETTE + (porteur.famille === "mecanistes" ? 0.12 : 0), porteur.z).project(camera);
      if (v.z > 1) {
        p.el.hidden = true;
        continue;
      }
      const x = ((v.x + 1) / 2) * largeur;
      const y = ((1 - v.y) / 2) * hauteur;
      // (Pendant un redimensionnement, la caméra peut donner un point invalide : on attend l'image suivante.)
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < -120 || x > largeur + 120 || y < -60 || y > hauteur + 200) {
        p.el.hidden = true;
        continue;
      }
      p.el.hidden = false;
      this.remplir(p, c);
      montrees.push({ p, b: { x, y, l: p.l, h: p.h } });
    }
    for (const [id, p] of this.piles) {
      if (vus.has(id)) continue;
      p.el.remove();
      this.piles.delete(id);
    }
    // D'abord sous la bande des messages (sans à-coup quand un message paraît ou s'efface), puis on écarte celles qui
    // se chevauchent encore.
    const k = Math.min(1, dt * 10);
    for (const { p, b } of montrees) {
      const vise = sousLaBande(b, bande) - b.y;
      p.baisse += (vise - p.baisse) * k;
      if (!(Math.abs(vise - p.baisse) >= 0.5)) p.baisse = vise; // (proche, ou invalide : on se recale)
      b.y += p.baisse;
    }
    const dx = ecarter(montrees.map((m) => m.b));
    montrees.forEach(({ p, b }, i) => {
      // Jamais coupée par le bord de l'écran.
      const x = Math.min(largeur - b.l / 2 - 4, Math.max(b.l / 2 + 4, b.x + dx[i]!));
      p.el.style.transform = `translate(${x.toFixed(1)}px, ${b.y.toFixed(1)}px) translate(-50%, -100%)`;
    });
  }

  /** Écrit le contenu d'une étiquette, seulement s'il a changé (et la remesure alors). */
  private remplir(p: Pile, c: ContenuEtiquette): void {
    const largeur = c.jauge !== null ? `${(c.jauge * 100).toFixed(1)}%` : "";
    if (largeur && largeur !== p.barre.style.width) p.barre.style.width = largeur;
    const cle = `${c.nom}|${c.jauge !== null}|${c.bas}|${c.compte}|${p.fin.childElementCount}`;
    if (cle === p.cle) return;
    p.cle = cle;
    p.texte.textContent = c.nom ?? "";
    p.nom.hidden = c.nom === null;
    p.el.classList.toggle("en-duel", c.jauge !== null);
    p.el.classList.toggle("soi", p.pseudo === null);
    p.el.classList.toggle("bas", c.bas);
    p.compte.hidden = c.compte === null;
    p.compte.textContent = c.compte ?? "";
    p.l = p.el.offsetWidth;
    p.h = p.el.offsetHeight;
  }
}
