// La vue d'ensemble à l'arrivée dans un lieu, côté client (0.8.2, chantier G ; R4, Q2 ; commun/src/arrivee.ts).
// En arrivant d'un voyage (Bienvenue.arrivee : jamais à une connexion), la vue est dézoomée sur tout le lieu, toits
// visibles, et une invite discrète attend le premier geste. Une touche (clavier) ou un toucher (n'importe où) : la vue
// zoome vers le personnage (≈ 1,5 s) et le jeu commence ; le serveur l'apprend (« arrivee ») et lève la pause (seul) ou la
// protection (dans une halte). Ce premier geste ne fait rien d'autre : ni action, ni bouton du HUD.
// Dans une halte, le serveur ne protège que 15 s : passé ce délai, le zoom part tout seul.
// main.ts appelle ce module en quatre points : à l'installation (`arriver`), à chaque image (`cadrage`, `toitsVisibles`,
// `ensemble` : tout le lieu construit, 0.10), et pour savoir si le personnage doit rester immobile (`attend`).

import type { ModeArrivee } from "../../commun/src/arrivee.ts";
import type { LieuId, Zone } from "../../commun/src/lieux.ts";
import type { Cadrage } from "./rendu/scene.ts";
import { VueEnsemble, boiteDeLaVue, cadrerEnsemble, type BoiteVue } from "./rendu/vue-ensemble.ts";

export class ArriveeDansUnLieu {
  private readonly vue = new VueEnsemble();
  private readonly invite: HTMLDivElement;
  private boite: BoiteVue | null = null;
  /** Dans une halte : quand le zoom part tout seul (performance.now) ; Infinity : il attend le geste. */
  private zoomSeulLe = Infinity;
  /** Le clic qui suit le toucher du premier geste ne doit pas atteindre un bouton. */
  private avalerClicJusqua = 0;
  private readonly signaler: () => void;

  /** `parent` : le HUD (l'invite s'y pose) ; `signaler` : dire au serveur que le joueur a fait son premier geste. */
  constructor(parent: HTMLElement, tactile: boolean, signaler: () => void) {
    this.signaler = signaler;
    this.invite = document.createElement("div");
    this.invite.className = "invite-arrivee";
    this.invite.hidden = true;
    this.invite.setAttribute("role", "status");
    this.invite.textContent = tactile ? "Touche l'écran pour commencer" : "Appuie sur une touche";
    parent.append(this.invite);
    // Avant tout le reste (phase de capture, sur la fenêtre) : le premier geste n'appartient qu'à la vue d'ensemble.
    window.addEventListener("keydown", (e) => this.geste(e), { capture: true });
    window.addEventListener("pointerdown", (e) => this.geste(e), { capture: true });
    window.addEventListener(
      "click",
      (e) => {
        if (performance.now() > this.avalerClicJusqua) return;
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      { capture: true },
    );
  }

  /**
   * L'installation dans un lieu (chaque Bienvenue) : la vue d'ensemble si l'on arrive d'un voyage (`arrivee`), rien
   * sinon (une connexion, un retour chez soi après un effondrement).
   */
  arriver(arrivee: { mode: ModeArrivee; protection: number } | undefined, lieu: LieuId, zone: Zone, position: { x: number; z: number }): void {
    this.vue.arreter();
    this.boite = null;
    this.zoomSeulLe = Infinity;
    this.montrer(false);
    if (!arrivee) return;
    this.boite = boiteDeLaVue(lieu, zone, position);
    // Un rien plus tôt que le serveur : le zoom est fini quand la protection tombe.
    if (arrivee.mode === "abri") this.zoomSeulLe = performance.now() + Math.max(0, arrivee.protection - 500);
    this.montrer(true);
    this.vue.commencer({ x: position.x, z: position.z, zoom: 1 });
  }

  /** Vrai tant qu'on regarde le lieu de loin : le personnage ne bouge pas, rien ne se propose. */
  get attend(): boolean {
    return this.vue.etat === "attente";
  }

  /**
   * Vrai pendant toute la vue d'ensemble, le zoom vers le personnage compris (0.10, R52) : les haltes par tronçons
   * construisent alors tout le lieu, puis reviennent aux tronçons du joueur (rendu/vue-ensemble.ts : tronconsVoulus).
   */
  get ensemble(): boolean {
    return this.vue.etat !== null;
  }

  /**
   * Le cadrage de cette image (null : la caméra suit le personnage). `lacet` : l'angle de la caméra ; `zoomJoueur` :
   * le zoom habituel du joueur (molette), où la caméra revient.
   */
  cadrage(position: { x: number; z: number }, lacet: number, zoomJoueur: number): Cadrage | null {
    const maintenant = performance.now();
    if (this.vue.etat === "attente") {
      // Recalculé à chaque image : l'écran peut tourner (portrait, paysage) pendant qu'on regarde.
      if (this.boite) this.vue.commencer(cadrerEnsemble(this.boite, lacet, window.innerWidth, window.innerHeight, this.hautDuHud()));
      if (maintenant >= this.zoomSeulLe) this.lancer(false);
    }
    return this.vue.cadrage(maintenant, position, zoomJoueur);
  }

  /** Les toits restent pendant qu'on voit le lieu de loin. */
  get toitsVisibles(): boolean {
    return this.vue.toitsVisibles(performance.now());
  }

  /** En portrait, la part de l'écran que prennent en haut les jauges et les raccourcis (en paysage, ils sont sur les côtés). */
  private hautDuHud(): number {
    if (window.innerWidth >= window.innerHeight) return 0;
    const bas = document.querySelector("#hud .raccourcis")?.getBoundingClientRect().bottom ?? 0;
    return Math.min(0.35, Math.max(0, bas / window.innerHeight));
  }

  /** Pendant qu'on regarde le lieu, les commandes tactiles (manche, boutons A et B) s'effacent : elles n'ont rien à faire. */
  private montrer(attente: boolean): void {
    this.invite.hidden = !attente;
    document.body.classList.toggle("vue-ensemble", attente);
  }

  private geste(e: KeyboardEvent | PointerEvent): void {
    if (this.vue.etat !== "attente") return;
    // Les touches de modification seules (Maj, Ctrl…) et la répétition d'une touche tenue ne comptent pas.
    if (e instanceof KeyboardEvent && (e.repeat || ["Shift", "Control", "Alt", "Meta"].includes(e.key))) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e instanceof PointerEvent) this.avalerClicJusqua = performance.now() + 700;
    this.lancer(true);
  }

  /** Le zoom part ; le serveur l'apprend (sauf si c'est le délai de la halte : il le sait déjà). */
  private lancer(parGeste: boolean): void {
    this.vue.lancer(performance.now());
    this.montrer(false);
    if (parGeste) this.signaler();
  }
}
