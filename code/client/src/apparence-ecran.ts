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
        const valeur = champ === "barbe" ? (a.barbe ? "oui" : "non") : String(a[champ]);
        for (const b of groupe.querySelectorAll<HTMLButtonElement>("button")) b.setAttribute("aria-pressed", String(b.dataset.valeur === valeur));
      }
      for (const c of racine.querySelectorAll<HTMLInputElement>("[data-curseur]")) c.value = String(a[c.dataset.curseur as "taille" | "corpulence"]);
      sortie("taille").textContent = `${hauteurDe(a).toFixed(2).replace(".", ",")} m`;
      sortie("corpulence").textContent = a.corpulence < 0.3 ? "mince" : a.corpulence < 0.7 ? "moyenne" : "forte";
    }

    let minuteur = 0;
    function changer(maj: Partial<Apparence>, attendre = false): void {
      a = { ...a, ...maj };
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
        else if (champ === "cheveux") changer({ cheveux: Number(v) });
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
    racine.querySelector('[data-action="hasard"]')!.addEventListener("click", () => changer(auHasard()));
    racine.querySelector('[data-action="valider"]')!.addEventListener("click", () => finir({ apparence: a }));
  });
}
