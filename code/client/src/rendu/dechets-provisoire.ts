// La couche de déchets à l'écran : AFFICHAGE PROVISOIRE (0.7, chantier 2). Juste assez pour voir, ramasser et
// fouiller : des boîtes teintées en lots (InstancedMesh, comme rendu/lots.ts), des sacs sombres pour les conteneurs,
// des blocs pour les points du monde. Le vrai rendu en amas (silhouettes, éclat de repère) viendra au chantier 7,
// après un test sur iPhone. Tout est ici, isolé : main.ts n'en appelle que quelques méthodes.
//
// Le client reconstruit les amas de la graine du lieu (commun/src/couche-dechets.ts) ; le serveur ne lui envoie que
// la clé, les pièces prises et les points.

import * as THREE from "three";
import {
  dispositionLieu,
  nomConteneur,
  piecesCarreau,
  refConteneur,
  type FouilleVue,
  type PieceDechets,
  type PointDechetsVu,
  type VueDechets,
} from "../../../commun/src/couche-dechets.ts";
import { POINTS_DECHETS } from "../../../commun/src/dechets.ts";
import type { MessageClient } from "../../../commun/src/messages.ts";
import { OBJETS, nommer, type TypeObjet } from "../../../commun/src/objets.ts";
import { DISTANCE_INTERACTION } from "../../../commun/src/terrain.ts";
import { estOrdure } from "../../../commun/src/vestiges.ts";
import { icone } from "../icones.ts";
import type { ActionProposee, Propositions } from "../interaction.ts";

/** La teinte d'un objet, stable (tirée de son nom) ; une ordure est grise. */
function teinte(objet: TypeObjet): THREE.Color {
  if (estOrdure(objet)) return new THREE.Color(0x8d8a82);
  let h = 0;
  for (const c of objet) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return new THREE.Color().setHSL((h % 360) / 360, 0.55, 0.5);
}

/** La taille d'une pièce, d'après son poids (une canette, un pneu, un matelas). */
function taille(objet: TypeObjet): number {
  return Math.min(0.75, Math.max(0.12, Math.cbrt(OBJETS[objet].poids) * 0.32));
}

interface EtatCarreauVu {
  r: number;
  pris: Set<number>;
  pieces: PieceDechets[];
}

const BOITE = new THREE.BoxGeometry(1, 1, 1);
const SAC = new THREE.IcosahedronGeometry(0.5, 0);

export class CoucheDechetsVue {
  readonly objet = new THREE.Group();
  private cle: string | null = null;
  private readonly carreaux = new Map<string, EtatCarreauVu>();
  private points: PointDechetsVu[] = [];
  private maillages: THREE.InstancedMesh[] = [];
  private readonly envoyer: (m: MessageClient) => void;
  private readonly panneau: HTMLElement;

  constructor(envoyer: (m: MessageClient) => void, hud: HTMLElement) {
    this.envoyer = envoyer;
    this.panneau = document.createElement("div");
    this.panneau.className = "fouille-dechets";
    this.panneau.hidden = true;
    this.panneau.setAttribute("role", "dialog");
    hud.appendChild(this.panneau);
  }

  /** L'entrée dans un lieu : on reconstruit tout de la graine. */
  installer(vue: VueDechets | undefined): void {
    this.cle = vue?.cle ?? null;
    this.carreaux.clear();
    this.points = vue?.points ?? [];
    this.fouille(null);
    if (vue) {
      const pris = new Map(vue.carreaux.map(([cx, cz, r, p]) => [`${cx},${cz}`, { r, p }]));
      for (const k of dispositionLieu(vue.cle).keys()) {
        const [cx, cz] = k.split(",").map(Number) as [number, number];
        const etat = pris.get(k) ?? { r: 0, p: [] };
        this.carreaux.set(k, { r: etat.r, pris: new Set(etat.p), pieces: piecesCarreau(vue.cle, cx, cz, etat.r) });
      }
    }
    this.redessiner();
  }

  majCarreau(cx: number, cz: number, r: number, pris: number[]): void {
    if (!this.cle) return;
    const k = `${cx},${cz}`;
    const e = this.carreaux.get(k);
    this.carreaux.set(k, { r, pris: new Set(pris), pieces: e && e.r === r ? e.pieces : piecesCarreau(this.cle, cx, cz, r) });
    this.redessiner();
  }

  majPoint(p: PointDechetsVu): void {
    this.points = [...this.points.filter((q) => q.id !== p.id), p];
    this.redessiner();
  }

  private redessiner(): void {
    for (const m of this.maillages) {
      this.objet.remove(m);
      (m.material as THREE.Material).dispose();
      m.dispose();
    }
    this.maillages = [];
    const sol: { p: PieceDechets }[] = [];
    const conteneurs: { x: number; z: number; plein: boolean }[] = [];
    for (const e of this.carreaux.values()) {
      const restes = new Map<number, number>();
      const places = new Map<number, { x: number; z: number }>();
      for (const p of e.pieces) {
        if (!p.dedans) {
          if (!e.pris.has(p.i)) sol.push({ p });
          continue;
        }
        places.set(p.e, { x: p.x, z: p.z });
        restes.set(p.e, (restes.get(p.e) ?? 0) + (e.pris.has(p.i) ? 0 : 1));
      }
      for (const [em, n] of restes) conteneurs.push({ ...places.get(em)!, plein: n > 0 });
    }
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    if (sol.length) {
      const lot = new THREE.InstancedMesh(BOITE, new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), sol.length);
      sol.forEach(({ p }, k) => {
        const t = taille(p.objet);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (p.i * 1.7) % Math.PI);
        m.compose(new THREE.Vector3(p.x, t * 0.2, p.z), q, new THREE.Vector3(t, t * 0.4, t * 0.7));
        lot.setMatrixAt(k, m);
        lot.setColorAt(k, teinte(p.objet));
      });
      this.maillages.push(lot);
    }
    if (conteneurs.length) {
      const lot = new THREE.InstancedMesh(SAC, new THREE.MeshStandardMaterial({ roughness: 0.6, flatShading: true }), conteneurs.length);
      conteneurs.forEach((c, k) => {
        m.compose(new THREE.Vector3(c.x, c.plein ? 0.25 : 0.06, c.z), q.identity(), new THREE.Vector3(0.75, c.plein ? 0.55 : 0.15, 0.6));
        lot.setMatrixAt(k, m);
        lot.setColorAt(k, new THREE.Color(c.plein ? 0x2c3a2a : 0x3d3d3a));
      });
      this.maillages.push(lot);
    }
    const points = this.points.filter((p) => p.dispo || POINTS_DECHETS[p.type].verbe === "fouiller");
    if (points.length) {
      const lot = new THREE.InstancedMesh(BOITE, new THREE.MeshStandardMaterial({ roughness: 0.7, flatShading: true }), points.length);
      points.forEach((p, k) => {
        const grand = p.type === "trampoline" ? 2.4 : p.type === "tas_gravats" ? 1.6 : 1.1;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.o);
        m.compose(new THREE.Vector3(p.x, p.dispo ? 0.3 : 0.08, p.z), q, new THREE.Vector3(grand, p.dispo ? 0.6 : 0.16, grand * 0.6));
        lot.setMatrixAt(k, m);
        lot.setColorAt(k, new THREE.Color(p.type === "carcasse_mouton" ? 0xd9d2c0 : p.type === "tas_gravats" ? 0x8f8a80 : 0x7a4b30));
      });
      this.maillages.push(lot);
    }
    for (const lot of this.maillages) {
      lot.castShadow = false;
      lot.receiveShadow = true;
      if (lot.instanceColor) lot.instanceColor.needsUpdate = true;
      this.objet.add(lot);
    }
  }

  /** Ce qu'on peut faire de la couche à portée de main : la cible la plus proche, et sa distance. */
  proposer(position: { x: number; z: number }): { distance: number; propositions: Propositions } | null {
    if (!this.cle) return null;
    let meilleure: { distance: number; propositions: Propositions } | null = null;
    const garder = (x: number, z: number, rayon: number, A: ActionProposee | null, B: ActionProposee) => {
      const d = Math.max(0, Math.hypot(x - position.x, z - position.z) - rayon);
      if (d > DISTANCE_INTERACTION || (meilleure && d >= meilleure.distance)) return;
      meilleure = { distance: d, propositions: { A, B, cible: { x, z, rayon: Math.max(0.35, rayon) } } };
    };
    const op = (o: Extract<MessageClient, { t: "dechets" }>["op"]): MessageClient => ({ t: "dechets", op: o });
    for (const [k, e] of this.carreaux) {
      const [cx, cz] = k.split(",").map(Number) as [number, number];
      const restes = new Map<number, { x: number; z: number; n: number }>();
      for (const p of e.pieces) {
        if (e.pris.has(p.i)) continue;
        if (p.dedans) {
          const c = restes.get(p.e) ?? { x: p.x, z: p.z, n: 0 };
          c.n++;
          restes.set(p.e, c);
          continue;
        }
        const nom = OBJETS[p.objet].nom;
        garder(p.x, p.z, 0.1, { libelle: `Ramasser : ${nom}`, message: op({ genre: "ramasser", cx, cz, i: p.i }) }, {
          libelle: "Examiner",
          examiner: `${OBJETS[p.objet].description}${estOrdure(p.objet) ? " Rien d'utile." : ""}`,
        });
      }
      const emplacements = dispositionLieu(this.cle).get(k) ?? [];
      for (const [em, c] of restes) {
        const genre = emplacements[em]?.genre;
        if (!genre || genre === "sol") continue;
        garder(c.x, c.z, 0.4, { libelle: `Fouiller : ${nomConteneur(genre)}`, message: op({ genre: "fouiller", ref: refConteneur(cx, cz, em) }) }, {
          libelle: "Examiner",
          examiner: POINTS_DECHETS[genre].examen,
        });
      }
    }
    for (const p of this.points) {
      if (!p.dispo) continue;
      const d = POINTS_DECHETS[p.type];
      const ref = `p:${p.id}`;
      const A: ActionProposee = { libelle: d.verbe === "fouiller" ? `${d.libelle} (${p.reste ?? 0})` : d.libelle, message: op(d.verbe === "fouiller" ? { genre: "fouiller", ref } : { genre: "demonter", ref }) };
      garder(p.x, p.z, p.type === "trampoline" ? 1.2 : 0.6, A, { libelle: "Examiner", examiner: d.examen });
    }
    return meilleure;
  }

  /** La liste du conteneur fouillé (null : refermée). On choisit ce qu'on prend ; le reste reste dedans. */
  fouille(f: FouilleVue | null): void {
    const p = this.panneau;
    if (!f) {
      p.hidden = true;
      p.innerHTML = "";
      return;
    }
    p.hidden = false;
    const objets = f.objets
      .map(
        (o) =>
          `<button type="button" class="${estOrdure(o.objet) ? "ordure" : ""}" data-i="${o.i}">${icone(o.objet, 30)}<span>${nommer(o.objet, 1)}<small>${String(Math.round(OBJETS[o.objet].poids * 100) / 100).replace(".", ",")} kg</small></span></button>`,
      )
      .join("");
    p.innerHTML = `<header><h2>${f.nom[0]!.toUpperCase()}${f.nom.slice(1)}</h2><button type="button" class="fermer" aria-label="Fermer">✕</button></header>${
      objets ? `<div class="liste">${objets}</div><p class="indice">Touche ce que tu prends ; le reste reste là.</p>` : `<p class="indice">Plus rien dedans.</p>`
    }`;
    p.querySelector(".fermer")!.addEventListener("click", () => {
      this.envoyer({ t: "dechets", op: { genre: "fermer" } });
      this.fouille(null);
    });
    for (const b of p.querySelectorAll<HTMLButtonElement>("button[data-i]")) {
      b.addEventListener("click", () => this.envoyer({ t: "dechets", op: { genre: "prendre", ref: f.ref, i: Number(b.dataset.i) } }));
    }
  }
}
