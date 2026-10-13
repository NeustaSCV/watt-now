// L'aide des touches sur ordinateur (plan 0.8.2, chantier H, R7), le temps du tutoriel : un petit rectangle en bas à
// gauche, une case par action, avec **des touches dessinées** (une touche de clavier en relief, une souris dont le
// bouton utile est coloré) et non des lettres seules. Chaque action est dans sa case, séparée des autres par un filet :
// on ne se demande plus si « R » va avec la carte ou la lumière (avant, les « · » se confondaient avec les « : »).
// Les noms suivent les réglages du joueur (`nomDe`, touches.ts).

import type { Action } from "./touches.ts";

/** Une souris dessinée : le bouton gauche, le droit, ou la molette, en couleur. */
export function souris(bouton: "gauche" | "droit" | "molette"): string {
  const plein = "currentColor";
  const g = bouton === "gauche" ? plein : "none";
  const d = bouton === "droit" ? plein : "none";
  const m = bouton === "molette" ? plein : "none";
  const nom = { gauche: "clic gauche", droit: "clic droit", molette: "molette" }[bouton];
  return `<span class="souris" role="img" aria-label="${nom}" title="${nom}"><svg viewBox="0 0 14 20" width="14" height="20" aria-hidden="true">
    <rect x="1" y="1" width="12" height="18" rx="6" fill="none" stroke="currentColor" stroke-width="1.4"/>
    <path d="M1.7 8.5 H7 V1.1 A6 6 0 0 0 1.7 7 Z" fill="${g}" opacity="0.85"/>
    <path d="M12.3 8.5 H7 V1.1 A6 6 0 0 1 12.3 7 Z" fill="${d}" opacity="0.85"/>
    <path d="M1 8.5 H13 M7 1 V8.5" stroke="currentColor" stroke-width="1.1"/>
    <rect x="5.6" y="3" width="2.8" height="4" rx="1.4" fill="${m}" stroke="currentColor" stroke-width="1"/>
  </svg></span>`;
}

/** Une touche de clavier dessinée, avec son nom (« E », « Maj »). */
export function toucheDessinee(nom: string): string {
  const echappe = nom.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<kbd class="touche${[...nom].length > 1 ? " large" : ""}">${echappe}</kbd>`;
}

/** Une case : les touches (ou la souris), puis ce qu'elles font. */
interface EntreeAide {
  touches: string[];
  /** La souris en second choix (« E ou clic gauche »). */
  souris?: "gauche" | "droit" | "molette";
  quoi: string;
}

/** Les cases de l'aide, dans l'ordre où on les apprend. */
export function entreesAide(nom: (a: Action) => string): EntreeAide[] {
  return [
    { touches: [nom("avancer"), nom("gauche"), nom("reculer"), nom("droite")], quoi: "Marcher" },
    { touches: [nom("courir")], quoi: "Courir" },
    { touches: [nom("agir")], souris: "gauche", quoi: "Agir" },
    { touches: [nom("examiner")], souris: "droit", quoi: "Examiner" },
    { touches: [nom("discret")], quoi: "Discret" },
    { touches: [nom("combat")], quoi: "Combat" },
    { touches: [nom("sac")], quoi: "Sac" },
    { touches: [nom("fabriquer")], quoi: "Fabriquer" },
    { touches: [nom("carte")], quoi: "Carte" },
    { touches: [nom("lumiere")], quoi: "Lumière" },
    { touches: [nom("tourner")], quoi: "Tourner la vue" },
    { touches: [], souris: "molette", quoi: "Zoom" },
  ];
}

/** L'aide entière, en HTML (pur, pour les tests). */
export function htmlAideTouches(nom: (a: Action) => string): string {
  const cases = entreesAide(nom)
    .map((e) => {
      // Les quatre touches de marche en croix, comme sur le clavier (Z en haut, Q S D dessous).
      const touches = e.touches.length === 4 ? `<span class="croix">${e.touches.map(toucheDessinee).join("")}</span>` : e.touches.map(toucheDessinee).join("");
      const ou = touches && e.souris ? `<span class="ou">ou</span>` : "";
      return `<li><span class="touches">${touches}${ou}${e.souris ? souris(e.souris) : ""}</span><span class="quoi">${e.quoi}</span></li>`;
    })
    .join("");
  return `<ul class="aide-touches" aria-label="Les touches">${cases}</ul><p class="changer">Pour les changer : ⚙️ → Commandes</p>`;
}
