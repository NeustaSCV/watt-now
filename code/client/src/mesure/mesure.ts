// Le mode mesure (2026-10-09) : `?mesure=1` dans l'adresse, et seulement alors (ce fichier n'est même pas chargé
// sinon). Un petit panneau, lisible sur 375 px, qui montre en direct :
// - les images par seconde (moyenne, 1 % les plus lentes), la durée d'une image, le temps de calcul et de rendu ;
// - les appels de dessin et les triangles, rangés par poste (sol, herbe, arbres, bâtiments, ressources…), dans
//   l'image et dans la passe d'ombre ;
// - des interrupteurs pour couper un poste à la fois et voir le gain sur l'appareil ;
// - une couche de déchets simulée (0.7), pour mesurer son coût avant de l'écrire ;
// - un banc d'essai automatique (≈ 80 s, sans bouger) qui coupe les postes un par un et envoie le relevé au Mac.
// Comment on compte : chaque appel de dessin passe par `renderer.renderBufferDirect` (image et ombres). On
// l'enveloppe : on range l'appel selon l'objet dessiné, et on le saute si son poste est coupé.

import * as THREE from "three";
import type { Scene } from "../rendu/scene.ts";
import { changerQualite, type Qualite, type NiveauQualite } from "../rendu/qualite.ts";
import { creerDechets, libererDechets, type BilanDechets, type ModeDechets } from "./dechets-simules.ts";

export interface SourcesMesure {
  scene: Scene;
  qualite: Qualite;
  /** Les objets du jeu, chacun avec son poste (« décor », « ressource:pommier », « éteints »…). */
  postes: () => Iterable<readonly [string, THREE.Object3D | null | undefined]>;
  /** Le lieu où l'on est. */
  lieu: () => string;
}

export interface Mesureur {
  /** Début d'une image (instant de requestAnimationFrame). */
  debut(instant: number): void;
  /** Fin d'une image (après le rendu). */
  fin(): void;
}

type ClePoste = "sol" | "herbe" | "arbres" | "batiments" | "ressources" | "installations" | "personnages" | "eteints" | "faune" | "brume" | "effets" | "dechets" | "autre";
const POSTES: { cle: ClePoste; nom: string }[] = [
  { cle: "sol", nom: "Sol, routes, eau" },
  { cle: "herbe", nom: "Herbe" },
  { cle: "arbres", nom: "Arbres (lisière)" },
  { cle: "batiments", nom: "Bâtiments, décor" },
  { cle: "ressources", nom: "Ressources" },
  { cle: "installations", nom: "Installations, feux" },
  { cle: "personnages", nom: "Personnages" },
  { cle: "eteints", nom: "Éteints" },
  { cle: "faune", nom: "Faune" },
  { cle: "brume", nom: "Brume" },
  { cle: "effets", nom: "Pluie, visée, effets" },
  { cle: "dechets", nom: "Déchets simulés" },
  { cle: "autre", nom: "Autre" },
];

/** Le décor de chaque lieu : son nom de morceau (terrain.ts, halte.ts, comptoir.ts, cooperative.ts) → poste. */
function posteDuDecor(nom: string): ClePoste {
  if (/^(sol|sols|exterieur|route|routes|mare|eau)$/.test(nom)) return "sol";
  if (/^(herbes|details)$/.test(nom)) return "herbe";
  if (/^(lisiere|foret)$/.test(nom)) return "arbres";
  return "batiments";
}
function posteDuRegistre(r: string): ClePoste {
  if (r.startsWith("ressource")) return "ressources";
  if (r === "installations" || r === "feux") return "installations";
  if (r === "personnage" || r === "autres joueurs") return "personnages";
  if (r === "éteints") return "eteints";
  if (r === "faune") return "faune";
  if (r === "brume") return "brume";
  if (r === "déchets") return "dechets";
  if (r.startsWith("effets") || r === "pluie" || r === "sang") return "effets";
  return "autre";
}

interface Classe {
  poste: ClePoste;
  detail: string;
}
interface Compte {
  image: number;
  ombre: number;
  triangles: number;
}
const vide = (): Compte => ({ image: 0, ombre: 0, triangles: 0 });

interface Resultat {
  etape: string;
  ips: number;
  ipsBas: number;
  imageMs: number;
  calculMs: number;
  renduMs: number;
  appels: number;
  appelsOmbre: number;
  triangles: number;
}

const DEV = import.meta.env.DEV;

export function demarrerMesure(s: SourcesMesure): Mesureur {
  const rendu = s.scene.rendu;
  const info = rendu.info;

  // ---------- Le comptage, appel par appel ----------
  let registre = new Map<THREE.Object3D, string>();
  let cache = new WeakMap<THREE.Object3D, Classe>();
  let imagesDepuisRegistre = 1e9;
  const coupes = new Set<ClePoste>();
  let parPoste = new Map<ClePoste, Compte>();
  let parDetail = new Map<string, Compte>();
  let appelsImage = 0;
  let appelsOmbre = 0;

  function majRegistre(): void {
    registre = new Map();
    for (const [poste, objet] of s.postes()) if (objet) registre.set(objet, poste);
    cache = new WeakMap();
    imagesDepuisRegistre = 0;
  }

  function classer(o: THREE.Object3D): Classe {
    const connu = cache.get(o);
    if (connu) return connu;
    let n: THREE.Object3D | null = o;
    let nomDecor = "";
    let c: Classe | null = null;
    while (n) {
      const r = registre.get(n);
      if (r === "décor") {
        c = { poste: posteDuDecor(nomDecor), detail: `décor:${nomDecor || "?"}` };
        break;
      }
      if (r) {
        c = { poste: posteDuRegistre(r), detail: r };
        break;
      }
      const p = n.userData.poste as string | undefined;
      if (p) {
        c = { poste: posteDuRegistre(p), detail: p };
        break;
      }
      if (n.name) nomDecor = n.name;
      n = n.parent;
    }
    c ??= { poste: "autre", detail: `${o.type}${o.name ? " " + o.name : ""}` };
    cache.set(o, c);
    return c;
  }

  const rbd = rendu.renderBufferDirect.bind(rendu);
  rendu.renderBufferDirect = (camera, scene, geometry, material, object, group) => {
    const c = classer(object);
    if (coupes.has(c.poste)) return;
    const ombre = scene === null;
    const avant = info.render.calls;
    const triAvant = info.render.triangles;
    rbd(camera, scene, geometry, material, object, group);
    const appels = info.render.calls - avant;
    const tri = info.render.triangles - triAvant;
    for (const [carte, cle] of [
      [parPoste, c.poste],
      [parDetail, c.detail],
    ] as const) {
      let k = (carte as Map<string, Compte>).get(cle);
      if (!k) (carte as Map<string, Compte>).set(cle, (k = vide()));
      if (ombre) k.ombre += appels;
      else {
        k.image += appels;
        k.triangles += tri;
      }
    }
    if (ombre) appelsOmbre += appels;
    else appelsImage += appels;
  };

  let dureeRendu = 0;
  const render = rendu.render.bind(rendu);
  rendu.render = (scene, camera) => {
    if (++imagesDepuisRegistre > 30) majRegistre();
    parPoste = new Map();
    parDetail = new Map();
    appelsImage = 0;
    appelsOmbre = 0;
    const t0 = performance.now();
    render(scene, camera);
    dureeRendu = performance.now() - t0;
  };

  // ---------- Le temps ----------
  /** Les dernières images (≈ 5 s) : durée entre deux images, temps de calcul, temps de rendu, en ms. */
  const images: { dt: number; calcul: number; rendu: number }[] = [];
  let precedent = 0;
  let debutCalcul = 0;
  function stats(depuis = 5000): { ips: number; ipsBas: number; imageMs: number; pireMs: number; calculMs: number; renduMs: number } {
    let total = 0;
    const l: typeof images = [];
    for (let i = images.length - 1; i >= 0 && total < depuis; i--) {
      total += images[i]!.dt;
      l.push(images[i]!);
    }
    if (l.length === 0) return { ips: 0, ipsBas: 0, imageMs: 0, pireMs: 0, calculMs: 0, renduMs: 0 };
    const tries = l.map((x) => x.dt).sort((a, b) => a - b);
    const p99 = tries[Math.min(tries.length - 1, Math.floor(tries.length * 0.99))]!;
    const moy = (f: (x: (typeof l)[number]) => number) => l.reduce((acc, x) => acc + f(x), 0) / l.length;
    return { ips: (l.length * 1000) / total, ipsBas: 1000 / p99, imageMs: total / l.length, pireMs: tries.at(-1)!, calculMs: moy((x) => x.calcul), renduMs: moy((x) => x.rendu) };
  }

  // ---------- Les ombres, les pixels, les déchets ----------
  let ombres = true;
  function reglerOmbres(oui: boolean): void {
    ombres = oui;
    s.scene.scene.traverse((o) => {
      const l = o as THREE.DirectionalLight | THREE.PointLight;
      if (!l.isLight || !("shadow" in l)) return;
      if (l.userData.ombreOrigine === undefined) l.userData.ombreOrigine = l.castShadow;
      l.castShadow = oui && (l.userData.ombreOrigine as boolean);
    });
  }
  const pixelsOrigine = rendu.getPixelRatio();
  function reglerPixels(v: number): void {
    rendu.setPixelRatio(v);
    window.dispatchEvent(new Event("resize"));
  }
  let dechets: { objet: THREE.Group; bilan: BilanDechets } | null = null;
  let reglageDechets = { mode: "aucun" as ModeDechets, densite: 1, ombres: false };
  function reglerDechets(r: Partial<typeof reglageDechets>): void {
    reglageDechets = { ...reglageDechets, ...r };
    if (dechets) {
      s.scene.scene.remove(dechets.objet);
      libererDechets(dechets.objet);
      dechets = null;
    }
    if (reglageDechets.mode !== "aucun") {
      const c = s.scene.centre;
      const t0 = performance.now();
      dechets = creerDechets(reglageDechets.mode, c.x, c.z, reglageDechets.densite, reglageDechets.ombres, rendu);
      s.scene.scene.add(dechets.objet);
      tempsDechets = performance.now() - t0;
    }
    majBoutons();
  }
  let tempsDechets = 0;

  // ---------- Le panneau ----------
  const style = document.createElement("style");
  style.textContent = `
#mesure { position: fixed; top: max(6px, env(safe-area-inset-top)); left: max(6px, env(safe-area-inset-left)); z-index: 60; width: 226px;
  max-height: calc(100vh - 12px); overflow-y: auto; -webkit-overflow-scrolling: touch; background: rgba(18, 15, 12, 0.78); color: #f2ead8;
  font: 10.5px/1.3 -apple-system, system-ui, sans-serif; border-radius: 8px; padding: 4px 6px 6px; box-shadow: 0 2px 8px rgba(0,0,0,.4);
  font-variant-numeric: tabular-nums; -webkit-user-select: none; user-select: none; touch-action: manipulation; }
#mesure.droite { left: auto; right: max(6px, env(safe-area-inset-right)); }
#mesure.replie { width: auto; }
#mesure.replie .corps { display: none; }
#mesure .tete { display: flex; gap: 4px; align-items: center; }
#mesure .tete b { font-size: 12px; }
#mesure .tete [data-v="resume"] { flex: 1; text-align: right; padding-right: 2px; }
#mesure:not(.replie) .tete [data-v="resume"] { visibility: hidden; }
#mesure summary { margin-top: 5px; padding: 2px 0; font-weight: 600; cursor: pointer; }
#mesure details { border-top: 1px solid #5e5446; }
#mesure button { font: inherit; color: #f2ead8; background: #3a332b; border: 1px solid #5e5446; border-radius: 4px; padding: 3px 6px; min-height: 26px; }
#mesure button.actif { background: #c98b2b; border-color: #e8b45a; color: #1b140c; }
#mesure .gros { font-size: 12.5px; font-weight: 600; }
#mesure .alerte { color: #ff9a6a; }
#mesure .ok { color: #9fdc7a; }
#mesure table { width: 100%; border-collapse: collapse; margin-top: 4px; }
#mesure td { padding: 1px 2px; white-space: nowrap; }
#mesure td.n { text-align: right; width: 30px; }
#mesure tr.coupe td { opacity: 0.45; text-decoration: line-through; }
#mesure tr[data-poste] td:first-child { cursor: pointer; }
#mesure .ligne { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; margin-top: 4px; }
#mesure .ligne > span { min-width: 52px; }
#mesure .sec { margin-top: 6px; border-top: 1px solid #5e5446; padding-top: 4px; }
#mesure .petit { font-size: 10px; opacity: 0.8; }
#mesure pre { font: 10px/1.25 ui-monospace, Menlo, monospace; white-space: pre-wrap; margin: 4px 0 0; }
`;
  document.head.append(style);
  const p = document.createElement("div");
  p.id = "mesure";
  const ligneBoutons = (nom: string, attr: string, valeurs: [string, string][]) =>
    `<div class="ligne"><span>${nom}</span>${valeurs.map(([v, t]) => `<button data-${attr}="${v}">${t}</button>`).join("")}</div>`;
  p.innerHTML = `
<div class="tete"><b>Mesure</b><span data-v="resume"></span><button data-action="cote" title="Changer de côté">⇄</button><button data-action="replier" title="Replier">–</button></div>
<div class="corps">
  <div class="gros" data-v="ips">–</div>
  <div data-v="temps">–</div>
  <div class="gros" data-v="appels">–</div>
  <div data-v="memoire" class="petit">–</div>
  <div data-v="qualite" class="petit">–</div>
  <details open><summary>Postes (toucher une ligne : la couper)</summary>
  <table>
    <tr class="petit"><td></td><td class="n">img</td><td class="n">omb</td><td class="n">ktri</td></tr>
    <tr data-poste="ombres"><td>Ombres (soleil, lampe)</td><td class="n"></td><td class="n" data-n="ombres"></td><td class="n"></td></tr>
    ${POSTES.map((q) => `<tr data-poste="${q.cle}"><td>${q.nom}</td><td class="n" data-i="${q.cle}"></td><td class="n" data-o="${q.cle}"></td><td class="n" data-t="${q.cle}"></td></tr>`).join("")}
  </table></details>
  <details><summary>Réglages</summary>
  ${ligneBoutons("Qualité", "qualite", [["bas", "bas"], ["moyen", "moyen"], ["haut", "haut"]])}
  ${ligneBoutons("Pixels", "pixels", [["1", "×1"], ["1.5", "×1,5"], ["2", "×2"], ["3", "×3"]])}
  <div class="ligne"><span>Ombres</span><button data-action="tri-ombres">hors champ écartées</button></div>
  </details>
  <details><summary>Déchets simulés (amas, carreaux de 20 m)</summary>
  ${ligneBoutons("Dessin", "dechets", [["aucun", "aucun"], ["instancie", "instancié"], ["lot", "lot"], ["fusion", "fusion"]])}
  ${ligneBoutons("Densité", "densite", [["0.5", "×½"], ["1", "×1"], ["2", "×2"]])}
  <div class="ligne"><span>Ombres</span><button data-action="ombres-dechets">ombre des déchets</button></div>
  <div class="petit" data-v="dechets"></div>
  </details>
  <div class="sec ligne"><button data-action="banc">Banc d'essai (90 s)</button>${DEV ? `<button data-action="envoyer">Envoyer au Mac</button>` : ""}<button data-action="detail">Détail</button></div>
  <div class="petit" data-v="etat"></div>
  <pre data-v="banc"></pre>
  <pre data-v="detail" hidden></pre>
</div>`;
  document.body.append(p);
  // Le panneau ne doit pas faire bouger le personnage ni la caméra.
  for (const ev of ["pointerdown", "touchstart", "wheel"]) p.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
  const v = (nom: string) => p.querySelector<HTMLElement>(`[data-v="${nom}"]`)!;

  function majBoutons(): void {
    p.querySelectorAll<HTMLElement>("[data-qualite]").forEach((b) => b.classList.toggle("actif", b.dataset.qualite === s.qualite.niveau));
    p.querySelectorAll<HTMLElement>("[data-pixels]").forEach((b) => b.classList.toggle("actif", Number(b.dataset.pixels) === rendu.getPixelRatio()));
    p.querySelectorAll<HTMLElement>("[data-dechets]").forEach((b) => b.classList.toggle("actif", b.dataset.dechets === reglageDechets.mode));
    p.querySelectorAll<HTMLElement>("[data-densite]").forEach((b) => b.classList.toggle("actif", Number(b.dataset.densite) === reglageDechets.densite));
    p.querySelector<HTMLElement>('[data-action="ombres-dechets"]')!.classList.toggle("actif", reglageDechets.ombres);
    const tri = p.querySelector<HTMLElement>('[data-action="tri-ombres"]')!;
    tri.classList.toggle("actif", s.scene.frustumOmbre?.actif ?? false);
    tri.textContent = !s.scene.frustumOmbre ? "sans ombres" : s.scene.frustumOmbre.actif ? "hors champ écartées" : "toutes (three.js)";
    p.querySelectorAll<HTMLElement>("tr[data-poste]").forEach((tr) => {
      const cle = tr.dataset.poste!;
      tr.classList.toggle("coupe", cle === "ombres" ? !ombres : coupes.has(cle as ClePoste));
    });
    const d = dechets?.bilan;
    v("dechets").textContent = d
      ? `${d.pieces} pièces en ${d.amas} amas sur ${d.carreaux} carreaux · ${Math.round(d.triangles / 1000)} k tri en tout · construit en ${Math.round(tempsDechets)} ms · dessin multiple : ${d.multiDraw ? "oui" : "NON"}`
      : "";
  }

  let banc: Resultat[] | null = null;
  let bancEnCours = false;
  p.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("button, tr[data-poste]");
    if (!b || bancEnCours) return;
    if (b.dataset.poste) {
      const cle = b.dataset.poste;
      if (cle === "ombres") reglerOmbres(!ombres);
      else if (coupes.has(cle as ClePoste)) coupes.delete(cle as ClePoste);
      else coupes.add(cle as ClePoste);
    } else if (b.dataset.qualite) changerQualite(b.dataset.qualite as NiveauQualite);
    else if (b.dataset.pixels) reglerPixels(Number(b.dataset.pixels));
    else if (b.dataset.dechets) reglerDechets({ mode: b.dataset.dechets as ModeDechets });
    else if (b.dataset.densite) reglerDechets({ densite: Number(b.dataset.densite) });
    else if (b.dataset.action === "ombres-dechets") reglerDechets({ ombres: !reglageDechets.ombres });
    else if (b.dataset.action === "tri-ombres" && s.scene.frustumOmbre) s.scene.frustumOmbre.actif = !s.scene.frustumOmbre.actif;
    else if (b.dataset.action === "replier") p.classList.toggle("replie");
    else if (b.dataset.action === "cote") p.classList.toggle("droite");
    else if (b.dataset.action === "detail") v("detail").hidden = !v("detail").hidden;
    else if (b.dataset.action === "banc") void lancerBanc();
    else if (b.dataset.action === "envoyer") void envoyer();
    majBoutons();
  });

  const fmt = (x: number, d = 0) => x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  function afficher(): void {
    const t = stats();
    const ipsClasse = t.ips >= 55 ? "ok" : t.ips < 30 ? "alerte" : "";
    v("resume").textContent = `${fmt(t.ips)} i/s · ${appelsImage + appelsOmbre} app.`;
    v("ips").innerHTML = `<span class="${ipsClasse}">${fmt(t.ips)} i/s</span> · 1 % lent : ${fmt(t.ipsBas)} i/s`;
    v("temps").textContent = `image ${fmt(t.imageMs, 1)} ms (pire ${fmt(t.pireMs)}) · calcul ${fmt(t.calculMs, 1)} · rendu ${fmt(t.renduMs, 1)} ms`;
    const total = appelsImage + appelsOmbre;
    v("appels").innerHTML = `<span class="${total > 120 ? "alerte" : "ok"}">${total} appels</span> (ombres ${appelsOmbre}) · ${fmt(info.render.triangles / 1000)} k tri`;
    v("memoire").textContent = `programmes ${info.programs?.length ?? "?"} · géométries ${info.memory.geometries} · textures ${info.memory.textures}`;
    const c = rendu.domElement;
    v("qualite").textContent = `qualité ${s.qualite.niveau} · pixels ×${fmt(rendu.getPixelRatio(), 2)} (écran ×${fmt(devicePixelRatio, 1)}) · ${c.width}×${c.height} · ${s.lieu()}`;
    for (const q of POSTES) {
      const k = parPoste.get(q.cle) ?? vide();
      p.querySelector<HTMLElement>(`[data-i="${q.cle}"]`)!.textContent = k.image ? String(k.image) : "";
      p.querySelector<HTMLElement>(`[data-o="${q.cle}"]`)!.textContent = k.ombre ? String(k.ombre) : "";
      p.querySelector<HTMLElement>(`[data-t="${q.cle}"]`)!.textContent = k.triangles ? fmt(k.triangles / 1000, k.triangles < 10000 ? 1 : 0) : "";
    }
    p.querySelector<HTMLElement>('[data-n="ombres"]')!.textContent = String(appelsOmbre);
    if (!v("detail").hidden) {
      const l = [...parDetail.entries()].sort((a, b) => b[1].image + b[1].ombre - (a[1].image + a[1].ombre)).slice(0, 40);
      v("detail").textContent = "img omb  ktri  source\n" + l.map(([d, k]) => `${String(k.image).padStart(3)} ${String(k.ombre).padStart(3)} ${fmt(k.triangles / 1000, 1).padStart(5)}  ${d}`).join("\n");
    }
  }
  majBoutons();
  setInterval(afficher, 500);

  // ---------- Le relevé (banc d'essai, envoi au Mac) ----------
  function releve(): object {
    const t = stats();
    return {
      date: new Date().toISOString(),
      appareil: navigator.userAgent,
      ecran: `${screen.width}×${screen.height} ×${devicePixelRatio}`,
      fenetre: `${innerWidth}×${innerHeight}`,
      lieu: s.lieu(),
      qualite: s.qualite.niveau,
      ombresTriees: s.scene.frustumOmbre?.actif ?? null,
      pixels: rendu.getPixelRatio(),
      multiDraw: rendu.extensions.has("WEBGL_multi_draw"),
      images: { ips: +t.ips.toFixed(1), ipsBas: +t.ipsBas.toFixed(1), imageMs: +t.imageMs.toFixed(2), calculMs: +t.calculMs.toFixed(2), renduMs: +t.renduMs.toFixed(2) },
      appels: { image: appelsImage, ombre: appelsOmbre, triangles: info.render.triangles },
      programmes: info.programs?.length ?? 0,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      postes: Object.fromEntries(parPoste),
      detail: Object.fromEntries([...parDetail.entries()].sort((a, b) => b[1].image + b[1].ombre - (a[1].image + a[1].ombre))),
      dechets: dechets?.bilan ?? null,
      banc,
    };
  }
  async function envoyer(): Promise<void> {
    v("etat").textContent = "Envoi…";
    try {
      const r = await fetch("/__mesure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(releve()) });
      v("etat").textContent = r.ok ? "Relevé envoyé au Mac." : `Échec de l'envoi (${r.status}).`;
    } catch {
      v("etat").textContent = "Échec de l'envoi (réseau).";
    }
  }

  const attendre = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
  interface Etape {
    nom: string;
    couper?: ClePoste[];
    ombres?: false;
    pixels?: number;
    dechets?: ModeDechets;
    ombresDechets?: boolean;
    triOmbres?: false;
  }
  const ETAPES: Etape[] = [
    { nom: "référence" },
    { nom: "sans ombres", ombres: false },
    { nom: "ombres non triées", triOmbres: false },
    { nom: "sans herbe", couper: ["herbe"] },
    { nom: "sans arbres", couper: ["arbres"] },
    { nom: "sans bâtiments", couper: ["batiments"] },
    { nom: "sans sol", couper: ["sol"] },
    { nom: "sans ressources", couper: ["ressources"] },
    { nom: "sans persos/Éteints", couper: ["personnages", "eteints", "faune"] },
    { nom: "sans brume/effets", couper: ["brume", "effets"] },
    { nom: "pixels ×1", pixels: 1 },
    { nom: "déchets instancié", dechets: "instancie" },
    { nom: "déchets lot", dechets: "lot" },
    { nom: "déchets fusion", dechets: "fusion" },
    { nom: "déchets lot+ombre", dechets: "lot", ombresDechets: true },
    { nom: "référence (fin)" },
  ];
  async function lancerBanc(): Promise<void> {
    bancEnCours = true;
    banc = [];
    const avant = { tri: s.scene.frustumOmbre?.actif ?? false, coupes: new Set(coupes), ombres, pixels: rendu.getPixelRatio(), dechets: { ...reglageDechets } };
    try {
      for (const [i, e] of ETAPES.entries()) {
        v("etat").textContent = `Banc d'essai : ${i + 1}/${ETAPES.length} (${e.nom}). Ne bouge pas.`;
        coupes.clear();
        for (const c of e.couper ?? []) coupes.add(c);
        reglerOmbres(e.ombres !== false);
        if (s.scene.frustumOmbre) s.scene.frustumOmbre.actif = e.triOmbres !== false;
        if (rendu.getPixelRatio() !== (e.pixels ?? pixelsOrigine)) reglerPixels(e.pixels ?? pixelsOrigine);
        if (reglageDechets.mode !== (e.dechets ?? "aucun") || reglageDechets.ombres !== (e.ombresDechets ?? false)) reglerDechets({ mode: e.dechets ?? "aucun", ombres: e.ombresDechets ?? false, densite: 1 });
        majBoutons();
        await attendre(1500);
        const t0 = performance.now();
        await attendre(4000);
        const t = stats(performance.now() - t0);
        banc.push({ etape: e.nom, ips: +t.ips.toFixed(1), ipsBas: +t.ipsBas.toFixed(1), imageMs: +t.imageMs.toFixed(2), calculMs: +t.calculMs.toFixed(2), renduMs: +t.renduMs.toFixed(2), appels: appelsImage + appelsOmbre, appelsOmbre, triangles: info.render.triangles });
        afficherBanc();
      }
    } finally {
      coupes.clear();
      for (const c of avant.coupes) coupes.add(c);
      reglerOmbres(avant.ombres);
      if (s.scene.frustumOmbre) s.scene.frustumOmbre.actif = avant.tri;
      reglerPixels(avant.pixels);
      reglerDechets(avant.dechets);
      bancEnCours = false;
      v("etat").textContent = "Banc d'essai fini.";
      majBoutons();
    }
    if (DEV) await envoyer();
  }
  function afficherBanc(): void {
    if (!banc) return;
    v("banc").textContent =
      "étape               i/s  1%  rendu appels\n" +
      banc.map((r) => `${r.etape.padEnd(19).slice(0, 19)} ${fmt(r.ips).padStart(3)} ${fmt(r.ipsBas).padStart(3)} ${fmt(r.renduMs, 1).padStart(5)} ${String(r.appels).padStart(4)}`).join("\n");
  }

  // Pour les captures automatiques (Chrome sans fenêtre, sur le Mac).
  Object.assign(window, { __mesure: { releve, couper: (c: ClePoste, oui = true) => (oui ? coupes.add(c) : coupes.delete(c)), ombres: reglerOmbres, dechets: reglerDechets, banc: lancerBanc } });

  return {
    debut(instant) {
      if (precedent > 0 && !document.hidden) {
        const dt = instant - precedent;
        if (dt > 0 && dt < 1000) images.push({ dt, calcul: 0, rendu: 0 });
        if (images.length > 1200) images.splice(0, images.length - 1200);
      }
      precedent = instant;
      debutCalcul = performance.now();
    },
    fin() {
      const derniere = images.at(-1);
      if (derniere && derniere.calcul === 0) {
        derniere.calcul = performance.now() - debutCalcul;
        derniere.rendu = dureeRendu;
      }
    },
  };
}
