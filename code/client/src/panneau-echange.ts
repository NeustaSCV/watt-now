// Le panneau d'échange entre joueurs, refait pour l'iPhone (plan 0.10.1, chantier C, A3 ; maquette V2 « toucher =
// choisir », choisie par le porteur le 2026-10-16).
//
// De haut en bas : ce que tu reçois (une rangée d'icônes, puis leurs noms), ce que tu donnes (idem ; toucher un objet
// posé le choisit), les wotts, puis ton sac en grille, comme le sac du jeu. Un toucher sur une case choisit l'objet ;
// la barre sous la grille donne son nom, ses étoiles et deux gros − et + : rien ne part par erreur. En pied, les accords
// et « Annuler » / « Je suis d'accord », toujours visibles. Plus de croix : « Annuler » suffit. En paysage (le CSS
// seul), le sac passe à gauche, l'échange à droite, et l'en-tête cède sa place à « Tu reçois de ● X ».
//
// La règle de l'échange ne change pas (`serveur/src/echange.ts`) : le HUD garde l'offre, l'envoie, et redessine à chaque
// message du serveur. Ce module ne fait que le dessin et les gestes ; l'objet choisi est tenu par le HUD, pour survivre
// aux redessins.

import { OBJETS, type Inventaire } from "../../commun/src/objets.ts";
import { etoilesDe, etoilesTexte, typeDe, type CleObjet } from "../../commun/src/etoiles.ts";
import { formaterWotts } from "../../commun/src/economie.ts";
import type { EchangeVu, OffreEchange } from "../../commun/src/messages.ts";
import { icone } from "./icones.ts";

/** Ce qu'il faut pour dessiner le panneau. */
export interface VueEchange {
  echange: EchangeVu;
  /** Ton offre telle que le HUD la tient (elle peut devancer celle du serveur de quelques centaines de ms). */
  offre: OffreEchange;
  /** Les cases de ton sac, déjà rangées comme dans le sac du jeu. */
  sac: CleObjet[];
  inventaire: Inventaire;
  /** Les wotts en poche. */
  poche: number;
  /** L'objet choisi dans la grille (ou dans « Tu donnes »), gardé d'un dessin à l'autre. */
  choisi: CleObjet | null;
  /** La couleur de la famille de l'autre (sa pastille). */
  couleur: string;
}

/**
 * Le nom d'un objet, avec ses étoiles s'il en porte : on doit voir ce qu'on donne ou ce qu'on reçoit (Book 25 §4.2).
 * Le même que celui du guichet (`hud.ts`).
 */
function nomEtoile(cle: CleObjet, n = 1): string {
  const t = typeDe(cle);
  const e = etoilesDe(cle);
  const nom = n > 1 ? `${n} ${OBJETS[t].pluriel}` : OBJETS[t].nom;
  return e === null ? nom : `${nom} <span class="etoiles-nom">${etoilesTexte(e)}</span>`;
}

/** Les objets posés d'une offre (quantité > 0). */
function poses(offre: OffreEchange): [CleObjet, number][] {
  return (Object.entries(offre.objets) as [CleObjet, number][]).filter(([, n]) => n > 0);
}

/** La ligne des noms : « 2 cellules lithium, serpe ★★★★, 30 wotts ». */
function resume(objets: [CleObjet, number][], wotts: number): string {
  const parts = objets.map(([c, n]) => nomEtoile(c, n));
  if (wotts > 0) parts.push(formaterWotts(wotts));
  return parts.join(", ");
}

/** Les marques en coin, comme sur les cases du sac : « 4★ » en haut, « ×3 » en bas. */
function marques(cle: CleObjet, n: number): string {
  const e = etoilesDe(cle);
  return `${e === null ? "" : `<span class="etoiles-case" title="${etoilesTexte(e)}">${e}★</span>`}${n > 1 ? `<span class="badge">×${n}</span>` : ""}`;
}

/** Le plafond des wotts qu'on peut poser : ce qu'on a en poche, au dixième. */
function plafondWotts(poche: number): number {
  return Math.floor(poche * 10) / 10;
}

/** Ton offre, un objet de plus ou de moins : jamais sous 0, jamais plus que ce que le sac contient. */
export function ajusterOffre(offre: OffreEchange, inventaire: Inventaire, type: CleObjet, delta: number): OffreEchange {
  const n = Math.max(0, Math.min(inventaire[type] ?? 0, (offre.objets[type] ?? 0) + delta));
  const objets = { ...offre.objets };
  if (n > 0) objets[type] = n;
  else delete objets[type];
  return { ...offre, objets };
}

/** Ton offre, 10 wotts de plus ou de moins : jamais sous 0, jamais plus qu'en poche. */
export function ajusterWotts(offre: OffreEchange, poche: number, delta: number): OffreEchange {
  const w = Math.max(0, Math.min(plafondWotts(poche), offre.wotts + delta));
  return { ...offre, wotts: Math.round(w * 10) / 10 };
}

/** Le panneau entier. */
export function htmlEchange(v: VueEchange): string {
  const e = v.echange;
  const o = v.offre;
  const pastille = `<span class="pastille" style="background:${v.couleur}"></span>`;
  const choisi = v.choisi && (v.inventaire[v.choisi] ?? 0) > 0 ? v.choisi : null;

  // Ce que tu reçois : une rangée d'icônes (et ses wotts), puis les noms.
  const recus = poses(e.lui);
  const pionsRecus = recus.map(([c, n]) => `<span class="pion" title="${OBJETS[typeDe(c)].nom}">${icone(typeDe(c), 36)}${marques(c, n)}</span>`).join("");
  const wottsRecus = e.lui.wotts > 0 ? `<span class="pion-wotts">⚡ ${formaterWotts(e.lui.wotts)}</span>` : "";
  const recoit = `<section class="z recoit">
      <h3><span>Tu reçois <span class="de-qui">de ${pastille}${e.avec.pseudo}</span></span></h3>
      ${recus.length || e.lui.wotts > 0 ? `<div class="rang" data-defile="recoit">${pionsRecus}${wottsRecus}</div><p class="resume">${resume(recus, e.lui.wotts)}</p>` : `<p class="vide">${e.avec.pseudo} n'a encore rien posé.</p>`}
    </section>`;

  // Ce que tu donnes : toucher un objet posé le choisit (la barre sous la grille le règle).
  const donnes = poses(o);
  const pionsDonnes = donnes
    .map(([c, n]) => `<button type="button" class="pion ${c === choisi ? "choisi" : ""}" data-choisir="${c}" aria-pressed="${c === choisi}" aria-label="${OBJETS[typeDe(c)].nom}, ${n} posé${n > 1 ? "s" : ""}">${icone(typeDe(c), 36)}${marques(c, n)}</button>`)
    .join("");
  const donne = `<section class="z donnes">
      <h3>Tu donnes</h3>
      ${donnes.length ? `<div class="rang" data-defile="donnes">${pionsDonnes}</div><p class="resume">${resume(donnes, 0)}</p>` : `<p class="vide">Choisis un objet dans ton sac.</p>`}
    </section>`;

  const plafond = plafondWotts(v.poche);
  const wotts = `<div class="wotts-offre">
      <span class="titre-wotts">⚡ Wotts</span>
      <button type="button" data-wotts="-10" ${o.wotts > 0 ? "" : "disabled"} aria-label="10 wotts de moins">−10</button>
      <b>${formaterWotts(o.wotts)}</b>
      <button type="button" data-wotts="10" ${o.wotts < plafond ? "" : "disabled"} aria-label="10 wotts de plus">+10</button>
      <small>en poche<br>${formaterWotts(v.poche)}</small>
    </div>`;

  // Ton sac : les cases du sac du jeu, avec la pastille du nombre posé.
  const cases = v.sac
    .map((c) => {
      const n = v.inventaire[c] ?? 0;
      const mis = o.objets[c] ?? 0;
      const classes = ["case", mis > 0 ? "posee" : "", mis >= n ? "epuisee" : "", c === choisi ? "choisie" : ""].filter(Boolean).join(" ");
      return `<button type="button" class="${classes}" data-choisir="${c}" aria-pressed="${c === choisi}" aria-label="${OBJETS[typeDe(c)].nom}, ${n} dans ton sac${mis ? `, ${mis} posé${mis > 1 ? "s" : ""}` : ""}">${icone(typeDe(c))}${marques(c, n)}${mis > 0 ? `<span class="nombre-pose">${mis}</span>` : ""}</button>`;
    })
    .join("");
  const sac = `<section class="z mon-sac">
      <h3>Ton sac <span class="astuce">touche un objet</span></h3>
      <div class="grille" data-defile="grille">${cases || '<p class="vide">Ton sac est vide.</p>'}</div>
      ${barreChoix(choisi, v.inventaire, o)}
    </section>`;

  const pied = `<div class="pied">
      <p class="accords"><span class="${e.accordMoi ? "ok" : ""}">${e.accordMoi ? "✓ Tu es d'accord" : "Tu n'as pas encore dit oui"}</span>
        <span class="${e.accordLui ? "ok" : ""}">${e.accordLui ? `✓ ${e.avec.pseudo} est d'accord` : `${e.avec.pseudo} réfléchit…`}</span></p>
      <div class="boutons"><button type="button" data-annuler>Annuler</button>
        <button type="button" class="oui ${e.accordMoi ? "actif" : ""}" data-accord>${e.accordMoi ? "Je ne suis plus d'accord" : "Je suis d'accord"}</button></div>
    </div>`;

  return `<header><h2>Échange avec ${pastille}${e.avec.pseudo}</h2></header>${recoit}${donne}${wotts}${sac}${pied}`;
}

/** La barre de l'objet choisi : son nom, ses étoiles, ce que le sac en contient, et deux gros − et +. */
function barreChoix(c: CleObjet | null, inventaire: Inventaire, o: OffreEchange): string {
  if (!c) return `<div class="choix vide"><p>Touche un objet pour le donner.</p></div>`;
  const n = inventaire[c] ?? 0;
  const mis = o.objets[c] ?? 0;
  return `<div class="choix">${icone(typeDe(c), 38)}<span class="nom">${nomEtoile(c)}<small>${n} dans ton sac</small></span>
      <span class="pas"><button type="button" data-moins="${c}" ${mis > 0 ? "" : "disabled"} aria-label="Moins">−</button><b>${mis}</b><button type="button" data-plus="${c}" ${mis < n ? "" : "disabled"} aria-label="Plus">+</button></span></div>`;
}

/** Ce que font les gestes du panneau (tenus par le HUD). */
export interface GestesEchange {
  /** Une case du sac, ou un objet posé, touché : il devient l'objet choisi (ou ne l'est plus, s'il l'était). */
  choisir(cle: CleObjet): void;
  /** − ou + de la barre du choix. */
  ajuster(cle: CleObjet, delta: number): void;
  /** −10 ou +10 wotts. */
  wotts(delta: number): void;
  annuler(): void;
  /** « Je suis d'accord » ou « Je ne suis plus d'accord ». */
  accord(): void;
}

/** Branche les gestes sur le panneau tout juste dessiné. Chaque groupe se branche seul (pas de `querySelector(…)!`). */
export function brancherEchange(p: Pick<ParentNode, "querySelectorAll">, gestes: GestesEchange): void {
  for (const b of p.querySelectorAll<HTMLElement>("[data-choisir]")) b.addEventListener("click", () => gestes.choisir(b.dataset.choisir as CleObjet));
  for (const b of p.querySelectorAll<HTMLElement>("[data-plus]")) b.addEventListener("click", () => gestes.ajuster(b.dataset.plus as CleObjet, 1));
  for (const b of p.querySelectorAll<HTMLElement>("[data-moins]")) b.addEventListener("click", () => gestes.ajuster(b.dataset.moins as CleObjet, -1));
  for (const b of p.querySelectorAll<HTMLElement>("[data-wotts]")) b.addEventListener("click", () => gestes.wotts(Number(b.dataset.wotts)));
  for (const b of p.querySelectorAll<HTMLElement>("[data-annuler]")) b.addEventListener("click", () => gestes.annuler());
  for (const b of p.querySelectorAll<HTMLElement>("[data-accord]")) b.addEventListener("click", () => gestes.accord());
}

/** Ce qui défile dans le panneau (la grille, les rangées), pour le remettre en place après un redessin. */
export type PlacesDefilement = Record<string, [number, number]>;

export function lirePlaces(p: Pick<ParentNode, "querySelectorAll">): PlacesDefilement {
  const places: PlacesDefilement = {};
  for (const el of p.querySelectorAll<HTMLElement>("[data-defile]")) places[el.dataset.defile!] = [el.scrollTop, el.scrollLeft];
  return places;
}

export function remettrePlaces(p: Pick<ParentNode, "querySelectorAll">, places: PlacesDefilement): void {
  for (const el of p.querySelectorAll<HTMLElement>("[data-defile]")) {
    const place = places[el.dataset.defile!];
    if (place) [el.scrollTop, el.scrollLeft] = place;
  }
}
