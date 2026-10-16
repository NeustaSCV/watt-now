// Le bouton « Lumière » en icône (0.10.1, chantier L, R-10) : la variante V3 de la maquette, « l'auréole », choisie par le
// porteur (`.claude-travail/maquettes-0-10-1/lumiere/`). Le mot « Lumière » devient un rond de 56 px, à la même place,
// avec le dessin de la lumière qu'on porte vraiment (`lumierePortee`) sur le rond sombre des boutons. Éteinte, le dessin
// est terne ; allumée, une auréole de sa couleur déborde autour du bouton (le CSS, fin de style.css) ; sans aucune
// lumière, un rond en pointillé et une torche grise ; la frontale dont la petite batterie est vide, éteinte avec une
// petite pile vide dans un coin (validée par le porteur le 2026-10-16). L'appui ne change pas : la commande « lumiere »,
// les messages du serveur.
//
// Les dessins reprennent les vraies icônes du jeu (icones.ts : torche, lampe_frontale, lanterne ; icones-metier.ts :
// lampe_bricolee), même charte : trait d'encre, aplats de la palette. Sur le rond sombre, la silhouette est « découpée » :
// un liseré crème autour, comme un autocollant, pour qu'elle se lise de jour comme de nuit.

import type { Charges } from "../../commun/src/energie.ts";
import { lumierePortee, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";

/** Le dessin du bouton : la lumière qu'on porte (la lampe bricolée a le sien, même si elle éclaire comme la frontale). */
export type GenreBouton = "torche" | "frontale" | "lanterne" | "lampe";

const GENRES: Partial<Record<TypeObjet, GenreBouton>> = {
  torche: "torche",
  lampe_frontale: "frontale",
  lanterne: "lanterne",
  lampe_bricolee: "lampe",
};

/** Le nom, pour l'étiquette du bouton (lecteur d'écran). */
const NOMS: Record<GenreBouton, string> = { torche: "ta torche", frontale: "ta lampe frontale", lanterne: "ta lanterne", lampe: "ta lampe bricolée" };

const ENCRE = "#3b2a1e";
const CREME = "#f4ecd8";
const T = `stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

let compteur = 0;

/** Un halo doux (dégradé radial), derrière une flamme ou devant une lampe. */
function halo(cx: number, cy: number, r: number, couleur: string, force: number): string {
  const id = `bl-h${++compteur}`;
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${couleur}" stop-opacity="${force}"/><stop offset="0.55" stop-color="${couleur}" stop-opacity="${force * 0.35}"/><stop offset="1" stop-color="${couleur}" stop-opacity="0"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`;
}

/** Un faisceau blanc froid qui s'efface (frontale : vers le bas ; lampe bricolée : vers la droite). */
function faisceau(d: string, horizontal: boolean): string {
  const id = `bl-f${++compteur}`;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${horizontal ? 1 : 0}" y2="${horizontal ? 0 : 1}"><stop offset="0" stop-color="#f3f7ff" stop-opacity="0.95"/><stop offset="1" stop-color="#e6f0ff" stop-opacity="0"/></linearGradient></defs><path class="faisceau" d="${d}" fill="url(#${id})"/>`;
}

/** Le liseré d'autocollant : la silhouette, en crème, un peu plus grosse, sous le dessin. */
const lisere = (d: string, epaisseur = 4.5) => `<path d="${d}" fill="${CREME}" stroke="${CREME}" stroke-width="${epaisseur}" stroke-linejoin="round" stroke-linecap="round"/>`;
const lisereTrait = (d: string, largeur: number) => `<path d="${d}" fill="none" stroke="${CREME}" stroke-width="${largeur}" stroke-linejoin="round" stroke-linecap="round"/>`;

// ---------------------------------------------------------------- La torche
// Le manche, la tête de chiffon gras, la flamme (trois couches). Penchée (28°) pour remplir le rond ; la flamme reste
// droite. Éteinte : la tête noircie, deux points de braise, un filet de fumée. Grise : aucune lumière.
const TORCHE_MANCHE = "M21 27.5 L27 27.5 L25.4 46 L22.6 46 Z";
const TORCHE_TETE = "M17.5 19.5 H30.5 L29.4 28 H18.6 Z";
const FLAMME = "M24 0.5 Q36 10.5 31.6 19.2 Q29 22.4 24 22 Q19 22.4 16.4 19.2 Q12 10.5 24 0.5 Z";
const PENCHE = "rotate(28 24 20)";

function torche(allumee: boolean, grise = false): string {
  let s = `<g transform="translate(1 1)">`;
  if (allumee) s += halo(24, 12, 18, "#ffb54a", 0.75);
  s += `<g transform="${PENCHE}">${lisere(TORCHE_MANCHE)}${lisere(TORCHE_TETE)}</g>`;
  if (allumee) s += lisere(FLAMME, 3.5);
  s += `<g transform="${PENCHE}">`;
  s += `<path d="${TORCHE_MANCHE}" fill="${grise ? "#77706a" : "#8a6642"}" ${T}/>`;
  s += `<path d="M23.3 30.5 L23.1 43" stroke="${grise ? "#958e86" : "#a98258"}" stroke-width="1.3" stroke-linecap="round"/>`;
  s += `<path d="${TORCHE_TETE}" fill="${allumee ? "#6b4a2e" : grise ? "#5c5650" : "#2b2620"}" ${T}/>`;
  s += `<path d="M18 22.3 H30 M18.4 25.2 H29.6" stroke="${allumee ? ENCRE : "#5a524a"}" stroke-width="1" opacity="0.8"/>`;
  if (!allumee && !grise) s += `<circle cx="21.5" cy="20.6" r="1" fill="#c8562b"/><circle cx="26.5" cy="20.9" r="0.8" fill="#a4452b"/>`;
  if (allumee) s += `<path d="M20 20.6 h2.4 M25.6 20.6 h2.4" stroke="#ff8a3d" stroke-width="1.4" stroke-linecap="round"/>`;
  s += `</g>`;
  if (allumee) {
    s += `<g class="flamme"><path d="${FLAMME}" fill="#ff7a2e" ${T}/><path d="M24 7 Q31.4 13.5 28.8 19 Q27 21 24 20.9 Q21 21 19.2 19 Q16.6 13.5 24 7 Z" fill="#ffb648"/><path d="M24 12 Q27.8 16.2 26.4 19.4 Q24 20.7 21.6 19.4 Q20.2 16.2 24 12 Z" fill="#fff1b8"/></g>`;
  } else if (!grise) {
    s += `<g class="fumee"><path d="M24 18.5 C20.5 15 27.5 12 24 8 C21.5 5 25.5 3 23.5 0" fill="none" stroke="#d9d3c8" stroke-width="2.2" stroke-linecap="round"/><path d="M26.5 17 C29 14 25.5 11.5 28 8.5" fill="none" stroke="#bdb6aa" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/></g>`;
  }
  return s + `</g>`;
}

// ---------------------------------------------------------------- La lampe frontale
// La sangle, le boîtier jaune, la lentille. Allumée : la lentille blanche et le faisceau vers le bas.
const FRONTALE_SANGLE = "M5 29 Q24 12 43 29";
const FRONTALE_BOITIER = "M16 12.5 h16 a3 3 0 0 1 3 3 v10.5 a3 3 0 0 1 -3 3 h-16 a3 3 0 0 1 -3 -3 v-10.5 a3 3 0 0 1 3 -3 Z";

function frontale(allumee: boolean, vide: boolean): string {
  let s = "";
  if (allumee) s += faisceau("M19.5 27 L7 48 L41 48 L28.5 27 Z", false) + halo(24, 21, 14, "#ffffff", 0.7);
  s += lisereTrait(FRONTALE_SANGLE, 7.5) + lisere(FRONTALE_BOITIER);
  s += `<path d="${FRONTALE_SANGLE}" fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"/>`;
  s += `<path d="${FRONTALE_BOITIER}" fill="${vide ? "#b9ad5a" : "#d8c43a"}" ${T}/>`;
  s += `<circle cx="24" cy="21" r="5.4" fill="${allumee ? "#ffffff" : "#5d5a55"}" ${T}/>`;
  if (allumee) {
    s += `<circle cx="24" cy="21" r="2.4" fill="#fff6c8"/>`;
    s += `<path d="M24 32.5 v11 M19 32 l-5.5 10 M29 32 l5.5 10" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>`;
  } else {
    s += `<path d="M21.8 19.2 q1.4 -1.2 3.2 -0.8" stroke="#9a958c" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

/**
 * La petite pile vide, en bas à droite (décision du porteur, 2026-10-16) : la frontale ne peut pas s'allumer. Un SVG à
 * part, par-dessus le dessin : il garde sa couleur quand le dessin éteint devient terne.
 */
function pileVide(): string {
  return `<svg class="pile-vide" viewBox="0 0 48 48" aria-hidden="true"><g transform="translate(29 33)"><rect x="-1.5" y="-1.5" width="18" height="12" rx="2.5" fill="${CREME}"/><rect x="0" y="0" width="13" height="9" rx="1.5" fill="${CREME}" stroke="${ENCRE}" stroke-width="1.6"/><rect x="13" y="2.8" width="2.2" height="3.4" rx="0.6" fill="${ENCRE}"/><rect x="1.8" y="1.8" width="2.4" height="5.4" fill="#c8362b"/></g></svg>`;
}

// ---------------------------------------------------------------- La lanterne
const LANTERNE = "M18 8 Q24 2 30 8 L33 11 L31 16 V35 H34 V40 H14 V35 H17 V16 L15 11 Z";

function lanterne(allumee: boolean): string {
  let s = "";
  if (allumee) s += halo(24, 25, 20, "#ffd27a", 0.8);
  s += lisere(LANTERNE);
  s += `<path d="M18 8 Q24 2 30 8" fill="none" ${T}/>`;
  s += `<path d="M15 11 h18 l-2 5 h-14 Z" fill="#55524d" ${T}/>`;
  s += `<path d="M17 16 h14 v19 h-14 Z" fill="${allumee ? "#ffd27a" : "#59626a"}" ${T}/>`;
  if (allumee) {
    s += `<g class="flamme petite"><path d="M24 19.5 Q28 24 26.2 28.6 Q24 30 21.8 28.6 Q20 24 24 19.5 Z" fill="#ff8a3d"/><path d="M24 23 Q25.8 25.4 25 28 Q24 28.6 23 28 Q22.2 25.4 24 23 Z" fill="#fff1b8"/></g>`;
  } else {
    s += `<path d="M19 18.5 v14" stroke="#8f9aa3" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>`;
    s += `<path d="M24 28.5 v3" stroke="#2b2620" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  s += `<path d="M24 16 v19 M17 25.5 h14" stroke="${ENCRE}" stroke-width="1.2" opacity="${allumee ? 0.55 : 0.9}"/>`;
  s += `<path d="M14 35 h20 v5 h-20 Z" fill="#55524d" ${T}/>`;
  return s;
}

// ---------------------------------------------------------------- La lampe bricolée des Voltaïques
const LAMPE_CORPS = "M8 18 h18 v14 h-18 Z";
const LAMPE_TETE = "M26 14 h8 l4 -4 v28 l-4 -4 h-8 Z";

function lampeBricolee(allumee: boolean): string {
  let s = "";
  if (allumee) s += faisceau("M38 11 L48 2 L48 46 L38 37 Z", true);
  s += lisere(LAMPE_CORPS) + lisere(LAMPE_TETE);
  s += `<path d="${LAMPE_CORPS}" fill="#7a8fa8" ${T}/>`;
  // Les tours de ruban adhésif : c'est bricolé.
  s += `<path d="M14 18 v14 M19 18 v14" stroke="#c9ccd0" stroke-width="2.2"/><path d="M14 18 v14 M19 18 v14" stroke="${ENCRE}" stroke-width="0.8" opacity="0.5"/>`;
  s += `<path d="${LAMPE_TETE}" fill="#b8b4ac" ${T}/>`;
  s += `<path d="M38 11 V37" stroke="${allumee ? "#ffffff" : "#6f6a62"}" stroke-width="3" stroke-linecap="round"/>`;
  if (allumee) s += `<path d="M41 15 l5 -3 M41 24 h6 M41 33 l5 3" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`;
  return s;
}

/**
 * Le dessin du bouton (SVG, viewBox 48 × 48).
 * @param genre la lumière qu'on porte (null : aucune, une torche grise)
 * @param vide la frontale dont la petite batterie est vide : éteinte, avec la petite pile vide dans un coin
 */
export function dessinerLumiere(genre: GenreBouton | null, allumee: boolean, vide = false): string {
  const corps =
    genre === null
      ? torche(false, true)
      : genre === "torche"
        ? torche(allumee)
        : genre === "frontale"
          ? frontale(allumee && !vide, vide)
          : genre === "lanterne"
            ? lanterne(allumee)
            : lampeBricolee(allumee);
  return `<svg class="objet" viewBox="0 0 48 48" aria-hidden="true">${corps}</svg>${genre === "frontale" && vide ? pileVide() : ""}`;
}

/** Ce que montre le bouton. */
export interface EtatBouton {
  genre: GenreBouton | null;
  allumee: boolean;
  /** La frontale dont la petite batterie est vide (la petite pile vide se voit). */
  vide: boolean;
}

/** Le seuil du serveur (joueur.ts, commande « lumiere ») : en dessous, la frontale ne s'allume pas. */
const SEUIL_FRONTALE_VIDE = 0.1;

/**
 * Ce que le bouton doit montrer : la lumière qu'on porte, et si elle brille. La frontale dont la petite batterie est vide
 * se montre éteinte, avec la petite pile vide (le serveur ne l'allume pas) ; sans lumière, rien n'est allumé.
 */
export function etatBouton(inventaire: Inventaire, charges: Charges, allumee: boolean): EtatBouton {
  const portee = lumierePortee(inventaire);
  const genre = portee === null ? null : (GENRES[portee] ?? null);
  const vide = genre === "frontale" && (charges.petite_batterie ?? 0) <= SEUIL_FRONTALE_VIDE;
  return { genre, allumee: genre !== null && allumee && !vide, vide };
}

/** L'étiquette du bouton pour un lecteur d'écran : « Allumer ta torche », « Éteindre ta lanterne »… */
export function etiquetteLumiere(e: EtatBouton): string {
  if (e.genre === null) return "Lumière (tu n'en as pas)";
  if (e.vide) return "Allumer ta lampe frontale (sa petite batterie est vide)";
  return `${e.allumee ? "Éteindre" : "Allumer"} ${NOMS[e.genre]}`;
}

/**
 * Tient à jour le bouton du HUD (`.b-lumiere`, sur écran tactile) : le dessin, les classes (`allumee`, `sans`,
 * `g-torche`…), `aria-label` et `aria-pressed`. Ne redessine le SVG que si l'état change (sinon la flamme et l'auréole
 * repartent du début).
 */
export class BoutonLumiere {
  private cle = "";
  private readonly bouton: HTMLElement;
  private readonly dessin: HTMLElement;

  constructor(bouton: HTMLElement, dessin: HTMLElement) {
    this.bouton = bouton;
    this.dessin = dessin;
  }

  maj(inventaire: Inventaire, charges: Charges, allumee: boolean): void {
    const e = etatBouton(inventaire, charges, allumee);
    const cle = `${e.genre}|${e.allumee}|${e.vide}`;
    if (cle === this.cle) return;
    this.cle = cle;
    this.dessin.innerHTML = dessinerLumiere(e.genre, e.allumee, e.vide);
    for (const g of ["torche", "frontale", "lanterne", "lampe"] as const) this.bouton.classList.toggle(`g-${g}`, e.genre === g);
    this.bouton.classList.toggle("sans", e.genre === null);
    this.bouton.classList.toggle("allumee", e.allumee);
    this.bouton.setAttribute("aria-pressed", String(e.allumee));
    this.bouton.setAttribute("aria-label", etiquetteLumiere(e));
  }
}
