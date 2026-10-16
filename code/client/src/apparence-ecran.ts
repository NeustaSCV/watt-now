// L'écran d'apparence (Book 14 §1, étape 3, et §3) : juste après le pseudo et la famille, on façonne son
// personnage en le voyant en 3D, dans la tenue de sa famille. Purement esthétique : aucun effet de jeu.

import * as THREE from "three";
import {
  APPARENCES_DE_REFERENCE,
  CARNATIONS,
  COIFFURES,
  COULEURS_CHEVEUX,
  NOMS_COIFFURES,
  NOMS_COULEURS_CHEVEUX,
  hauteurDe,
  type Apparence,
  type Coiffure,
  type Silhouette,
} from "../../commun/src/apparence.ts";
import { NOMS_FAMILLES, type Famille } from "../../commun/src/regles.ts";
import { chargerHumanoides } from "./rendu/humanoides.ts";
import { Personnage } from "./rendu/personnage.ts";

const hex = (c: number) => `#${c.toString(16).padStart(6, "0")}`;

// ---------- La couleur de cheveux personnalisée (R8, 0.8.2) ----------
// Le « + » au bout des couleurs de cheveux déplie, sous les pastilles, trois curseurs (teinte, éclat, clarté) : pas de
// fenêtre qui surgit, pas de sélecteur du système. La couleur est gardée en « #rrggbb » (`Apparence.teinteCheveux`).

/** Une couleur en teinte (0 à 360), éclat (saturation, 0 à 100) et clarté (0 à 100). */
interface Tsl {
  t: number;
  s: number;
  l: number;
}

/** « #rrggbb » depuis teinte, éclat, clarté. */
function tslVersHex({ t, s, l }: Tsl): string {
  const sat = s / 100;
  const cla = l / 100;
  const k = (n: number) => (n + t / 30) % 12;
  const a = sat * Math.min(cla, 1 - cla);
  const f = (n: number) => Math.round(255 * (cla - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Teinte, éclat, clarté d'une couleur « #rrggbb » (arrondis : les curseurs vont d'un en un). */
function hexVersTsl(c: string): Tsl {
  const n = Number.parseInt(c.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const v = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, v, b);
  const min = Math.min(r, v, b);
  const l = (max + min) / 2;
  const d = max - min;
  let t = 0;
  let s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    t = max === r ? ((v - b) / d) % 6 : max === v ? (b - r) / d + 2 : (r - v) / d + 4;
    t = (t * 60 + 360) % 360;
  }
  return { t: Math.round(t), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Le choix du joueur : son apparence, ou le retour à l'étape précédente. */
export type ChoixApparence = { apparence: Apparence } | { retour: true; apparence: Apparence };

/** Une apparence au hasard (bouton « Au hasard »). */
function auHasard(): Apparence {
  const choisir = <T>(l: readonly T[]): T => l[Math.floor(Math.random() * l.length)]!;
  const silhouette: Silhouette = Math.random() < 0.5 ? "feminine" : "masculine";
  return {
    silhouette,
    taille: Math.round(Math.random() * 20) / 20,
    corpulence: Math.round(Math.random() * 20) / 20,
    peau: Math.floor(Math.random() * CARNATIONS.length),
    coiffure: choisir(COIFFURES),
    cheveux: Math.floor(Math.random() * COULEURS_CHEVEUX.length),
    barbe: silhouette === "masculine" && Math.random() < 0.4,
  };
}

export function choisirApparence(conteneur: HTMLElement, famille: Famille, depart?: Apparence): Promise<ChoixApparence> {
  return new Promise((resolve) => {
    let a: Apparence = { ...(depart ?? APPARENCES_DE_REFERENCE[famille]) };

    conteneur.innerHTML = `
      <div class="affiche apparence">
        <h2>Ton personnage</h2>
        <p class="sous-titre">${NOMS_FAMILLES[famille]} · l'apparence n'a aucun effet sur le jeu</p>
        <div class="apparence-corps">
          <div class="apercu">
            <canvas aria-label="Aperçu de ton personnage (fais-le tourner)"></canvas>
            <p class="chargement-apercu">Les Compteurs préparent ton dossier…</p>
            <p class="aide-apercu">↔ fais-le tourner</p>
          </div>
          <div class="reglages">
            <fieldset>
              <legend>Silhouette</legend>
              <div class="choix" data-champ="silhouette">
                <button type="button" data-valeur="feminine">Féminine</button>
                <button type="button" data-valeur="masculine">Masculine</button>
              </div>
            </fieldset>
            <fieldset>
              <legend>Taille <output data-sortie="taille"></output></legend>
              <input type="range" min="0" max="1" step="0.05" data-curseur="taille" aria-label="Taille" />
            </fieldset>
            <fieldset>
              <legend>Corpulence <output data-sortie="corpulence"></output></legend>
              <input type="range" min="0" max="1" step="0.05" data-curseur="corpulence" aria-label="Corpulence" />
            </fieldset>
            <fieldset>
              <legend>Carnation</legend>
              <div class="pastilles" data-champ="peau">
                ${CARNATIONS.map((c, i) => `<button type="button" data-valeur="${i}" style="background:${hex(c)}" aria-label="Carnation ${i + 1}"></button>`).join("")}
              </div>
            </fieldset>
            <fieldset>
              <legend>Coiffure</legend>
              <div class="choix" data-champ="coiffure">
                ${COIFFURES.map((c) => `<button type="button" data-valeur="${c}">${NOMS_COIFFURES[c]}</button>`).join("")}
              </div>
            </fieldset>
            <fieldset>
              <legend>Cheveux</legend>
              <div class="pastilles" data-champ="cheveux">
                ${COULEURS_CHEVEUX.map((c, i) => `<button type="button" data-valeur="${i}" style="background:${hex(c)}" aria-label="${NOMS_COULEURS_CHEVEUX[i]}"></button>`).join("")}
                <button type="button" data-valeur="perso" class="plus" aria-label="Une autre couleur" aria-expanded="false">+</button>
              </div>
              <div class="cheveux-perso" hidden>
                <label>Teinte <input type="range" min="0" max="360" step="1" data-tsl="t" /></label>
                <label>Éclat <input type="range" min="0" max="100" step="1" data-tsl="s" /></label>
                <label>Clarté <input type="range" min="4" max="92" step="1" data-tsl="l" /></label>
              </div>
            </fieldset>
            <fieldset>
              <legend>Barbe</legend>
              <div class="choix" data-champ="barbe">
                <button type="button" data-valeur="non">Sans</button>
                <button type="button" data-valeur="oui">Avec</button>
              </div>
            </fieldset>
          </div>
        </div>
        <div class="actions-apparence">
          <button type="button" class="secondaire" data-action="retour">← Retour</button>
          <button type="button" class="secondaire" data-action="hasard">Au hasard</button>
          <button type="button" class="entrer" data-action="valider">Créer et entrer</button>
        </div>
        <span class="tampon">Dossier n° ${Math.floor(1000 + Math.random() * 8999)}</span>
      </div>`;
    conteneur.hidden = false;

    const racine = conteneur.querySelector<HTMLElement>(".apparence")!;
    const canvas = racine.querySelector("canvas")!;
    const chargementTexte = racine.querySelector<HTMLElement>(".chargement-apercu")!;

    // ---------- L'aperçu 3D ----------
    const rendu = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendu.outputColorSpace = THREE.SRGBColorSpace;
    rendu.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6b5a46, 1.4));
    const soleil = new THREE.DirectionalLight(0xffe2b8, 2.4);
    soleil.position.set(2, 4, 3);
    scene.add(soleil);
    const socle = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshStandardMaterial({ color: 0xd9ccab, roughness: 1 }));
    socle.rotation.x = -Math.PI / 2;
    scene.add(socle);
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 20);
    camera.position.set(0, 1.25, 4.6);
    camera.lookAt(0, 0.95, 0);
    const pivot = new THREE.Group();
    pivot.rotation.y = 0.35;
    scene.add(pivot);
    let personnage: Personnage | null = null;
    let pret = false;

    function reconstruire(): void {
      if (!pret) return;
      if (personnage) pivot.remove(personnage.objet);
      personnage = new Personnage(famille, { ...a });
      pivot.add(personnage.objet);
    }

    function redimensionner(): void {
      const l = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (l === 0 || h === 0) return;
      rendu.setSize(l, h, false);
      camera.aspect = l / h;
      camera.updateProjectionMatrix();
    }
    const observateur = new ResizeObserver(redimensionner);
    observateur.observe(canvas);

    // Le faire tourner : glisser le doigt ou la souris ; sinon il tourne doucement tout seul.
    let glisse: number | null = null;
    let auRepos = 0;
    canvas.addEventListener("pointerdown", (e) => {
      glisse = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (glisse === null) return;
      pivot.rotation.y += (e.clientX - glisse) * 0.012;
      glisse = e.clientX;
      auRepos = 0;
    });
    const lacher = () => (glisse = null);
    canvas.addEventListener("pointerup", lacher);
    canvas.addEventListener("pointercancel", lacher);

    let actif = true;
    let dernier = performance.now();
    function boucle(t: number): void {
      if (!actif) return;
      requestAnimationFrame(boucle);
      const dt = Math.min(0.05, (t - dernier) / 1000);
      dernier = t;
      auRepos += dt;
      if (glisse === null && auRepos > 2) pivot.rotation.y += dt * 0.35;
      personnage?.animer(dt, 0);
      rendu.render(scene, camera);
    }
    requestAnimationFrame(boucle);

    void chargerHumanoides().then(() => {
      pret = true;
      chargementTexte.hidden = true;
      reconstruire();
    });

    // ---------- Les réglages ----------
    const sortie = (champ: string) => racine.querySelector<HTMLOutputElement>(`[data-sortie="${champ}"]`)!;
    function afficher(): void {
      for (const groupe of racine.querySelectorAll<HTMLElement>("[data-champ]")) {
        const champ = groupe.dataset.champ as keyof Apparence;
        const valeur = champ === "barbe" ? (a.barbe ? "oui" : "non") : champ === "cheveux" && a.teinteCheveux ? "perso" : String(a[champ]);
        for (const b of groupe.querySelectorAll<HTMLButtonElement>("button")) b.setAttribute("aria-pressed", String(b.dataset.valeur === valeur));
      }
      for (const c of racine.querySelectorAll<HTMLInputElement>("[data-curseur]")) c.value = String(a[c.dataset.curseur as "taille" | "corpulence"]);
      sortie("taille").textContent = `${hauteurDe(a).toFixed(2).replace(".", ",")} m`;
      sortie("corpulence").textContent = a.corpulence < 0.3 ? "mince" : a.corpulence < 0.7 ? "moyenne" : "forte";
      afficherPerso();
    }

    // ---------- La couleur de cheveux personnalisée ----------
    const plus = racine.querySelector<HTMLButtonElement>(".pastilles .plus")!;
    const perso = racine.querySelector<HTMLElement>(".cheveux-perso")!;
    const curseursTsl = [...perso.querySelectorAll<HTMLInputElement>("[data-tsl]")];
    let tsl: Tsl = hexVersTsl(a.teinteCheveux ?? hex(COULEURS_CHEVEUX[a.cheveux] ?? COULEURS_CHEVEUX[0]));
    function afficherPerso(): void {
      // Le « + » prend la couleur choisie ; les pistes des curseurs montrent où l'on va.
      plus.style.background = a.teinteCheveux ?? "";
      plus.classList.toggle("choisie", !!a.teinteCheveux);
      plus.setAttribute("aria-expanded", String(!perso.hidden));
      for (const c of curseursTsl) c.value = String(tsl[c.dataset.tsl as keyof Tsl]);
      const pistes: Record<keyof Tsl, string> = {
        t: `linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 360].map((t) => `hsl(${t} ${tsl.s}% ${tsl.l}%)`).join(", ")})`,
        s: `linear-gradient(90deg, hsl(${tsl.t} 0% ${tsl.l}%), hsl(${tsl.t} 100% ${tsl.l}%))`,
        l: `linear-gradient(90deg, hsl(${tsl.t} ${tsl.s}% 4%), hsl(${tsl.t} ${tsl.s}% 48%), hsl(${tsl.t} ${tsl.s}% 92%))`,
      };
      for (const c of curseursTsl) c.style.setProperty("--piste", pistes[c.dataset.tsl as keyof Tsl]);
    }

    let minuteur = 0;
    function changer(maj: Partial<Apparence>, attendre = false): void {
      a = { ...a, ...maj };
      // Une pastille (ou « Au hasard ») retire la couleur personnalisée.
      if (a.teinteCheveux === undefined) delete a.teinteCheveux;
      afficher();
      window.clearTimeout(minuteur);
      if (attendre) minuteur = window.setTimeout(reconstruire, 140);
      else reconstruire();
    }

    for (const groupe of racine.querySelectorAll<HTMLElement>("[data-champ]")) {
      groupe.addEventListener("click", (e) => {
        const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
        if (!b) return;
        const v = b.dataset.valeur!;
        const champ = groupe.dataset.champ!;
        if (champ === "silhouette") changer({ silhouette: v as Silhouette });
        else if (champ === "coiffure") changer({ coiffure: v as Coiffure });
        else if (champ === "barbe") changer({ barbe: v === "oui" });
        else if (champ === "peau") changer({ peau: Number(v) });
        else if (champ === "cheveux" && v === "perso") {
          // Le « + » : déplie les curseurs, en partant de la couleur portée ; le retouche les replie (la couleur reste).
          if (perso.hidden && !a.teinteCheveux) tsl = hexVersTsl(hex(COULEURS_CHEVEUX[a.cheveux] ?? COULEURS_CHEVEUX[0]));
          perso.hidden = !perso.hidden;
          changer({ teinteCheveux: tslVersHex(tsl) });
        } else if (champ === "cheveux") {
          perso.hidden = true;
          changer({ cheveux: Number(v), teinteCheveux: undefined });
        }
      });
    }
    for (const c of curseursTsl) {
      c.addEventListener("input", () => {
        tsl = { ...tsl, [c.dataset.tsl!]: Number(c.value) };
        changer({ teinteCheveux: tslVersHex(tsl) }, true);
      });
    }
    for (const c of racine.querySelectorAll<HTMLInputElement>("[data-curseur]")) {
      c.addEventListener("input", () => changer({ [c.dataset.curseur!]: Number(c.value) }, true));
    }
    afficher();

    function finir(choix: ChoixApparence): void {
      actif = false;
      observateur.disconnect();
      window.clearTimeout(minuteur);
      rendu.dispose();
      rendu.forceContextLoss();
      resolve(choix);
    }
    racine.querySelector('[data-action="retour"]')!.addEventListener("click", () => finir({ retour: true, apparence: a }));
    racine.querySelector('[data-action="hasard"]')!.addEventListener("click", () => {
      perso.hidden = true;
      changer({ ...auHasard(), teinteCheveux: undefined });
    });
    racine.querySelector('[data-action="valider"]')!.addEventListener("click", () => finir({ apparence: a }));
  });
}
