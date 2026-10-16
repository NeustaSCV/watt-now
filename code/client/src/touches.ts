// Les touches du clavier (Book 08 §3) : une seule source pour lire le clavier, l'afficher et le réassigner.
// Le jeu part d'un clavier AZERTY (décision du porteur du projet, 2026-10-08). Le navigateur désigne les touches
// par leur position (`code`, nommé d'après le QWERTY américain) : on les affiche avec leur nom AZERTY.
// Pas de Ctrl par défaut : sur Mac, Ctrl + flèches change de bureau.

import { ecrire, lire } from "./stockage.ts";

export type Action =
  | "avancer"
  | "reculer"
  | "gauche"
  | "droite"
  | "courir"
  | "discret"
  | "agir"
  | "examiner"
  | "combat"
  | "sac"
  | "fabriquer"
  | "carte"
  | "carnet"
  | "lumiere"
  | "tourner"
  | "photo"
  | "lancer";

interface DefAction {
  libelle: string;
  /** La touche principale par défaut (réassignable). */
  defaut: string;
  /** Les touches de secours, toujours actives (flèches, Espace, Tab…). */
  aussi?: string[];
}

export const ACTIONS: Record<Action, DefAction> = {
  avancer: { libelle: "Avancer", defaut: "KeyW", aussi: ["ArrowUp"] },
  reculer: { libelle: "Reculer", defaut: "KeyS", aussi: ["ArrowDown"] },
  gauche: { libelle: "Aller à gauche", defaut: "KeyA", aussi: ["ArrowLeft"] },
  droite: { libelle: "Aller à droite", defaut: "KeyD", aussi: ["ArrowRight"] },
  courir: { libelle: "Courir (maintenir)", defaut: "ShiftLeft", aussi: ["ShiftRight"] },
  discret: { libelle: "Allure discrète (maintenir)", defaut: "KeyC" },
  agir: { libelle: "Agir, frapper (maintenir : coup appuyé)", defaut: "KeyE", aussi: ["Space"] },
  examiner: { libelle: "Examiner, esquiver, se dégager", defaut: "KeyF" },
  combat: { libelle: "Mode Combat / Exploration", defaut: "KeyX" },
  sac: { libelle: "Sac", defaut: "KeyI", aussi: ["Tab"] },
  fabriquer: { libelle: "Fabriquer", defaut: "KeyB" },
  // Le M de l'AZERTY est à la place du « ; » du QWERTY (code Semicolon).
  carte: { libelle: "Carte", defaut: "Semicolon" },
  carnet: { libelle: "Carnet (objectifs)", defaut: "KeyJ" },
  lumiere: { libelle: "Lumière portée", defaut: "KeyR" },
  tourner: { libelle: "Tourner la vue (Maj : dans l'autre sens)", defaut: "KeyV" },
  photo: { libelle: "Mode photo", defaut: "KeyP" },
  // Le lancer et le tir (Book 23 §6, 0.6) : G, ou le clic du milieu.
  lancer: { libelle: "Lancer, tirer (maintenir : viser)", defaut: "KeyG" },
};

/** Les touches qu'on ne peut pas prendre (fermer les fenêtres, et les touches de secours). */
export const RESERVEES = new Set(["Escape", "Tab", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftRight", "MetaLeft", "MetaRight", "ControlLeft", "ControlRight"]);

const CLE = "watt.touches";

function charger(): Record<Action, string> {
  const choix: Partial<Record<Action, string>> = {};
  try {
    Object.assign(choix, JSON.parse(lire(CLE) ?? "{}"));
  } catch {
    // Réglages illisibles : on garde les touches par défaut.
  }
  const r = {} as Record<Action, string>;
  for (const a of Object.keys(ACTIONS) as Action[]) r[a] = typeof choix[a] === "string" ? choix[a]! : ACTIONS[a].defaut;
  return r;
}

let assignees = charger();

/** Les noms des touches sur un clavier AZERTY français, d'après leur position (`code`). */
const AZERTY: Record<string, string> = {
  KeyQ: "A",
  KeyW: "Z",
  KeyA: "Q",
  KeyZ: "W",
  Semicolon: "M",
  KeyM: ",",
  Comma: ";",
  Period: ":",
  Slash: "!",
  Quote: "Ù",
  Backslash: "*",
  BracketLeft: "^",
  BracketRight: "$",
  Backquote: "²",
  Minus: ")",
  Equal: "=",
  IntlBackslash: "<",
  Digit1: "&",
  Digit2: "É",
  Digit3: '"',
  Digit4: "'",
  Digit5: "(",
  Digit6: "-",
  Digit7: "È",
  Digit8: "_",
  Digit9: "Ç",
  Digit0: "À",
};

const NOMS_SPECIAUX: Record<string, string> = {
  ShiftLeft: "Maj",
  ShiftRight: "Maj droite",
  Space: "Espace",
  Tab: "Tab",
  Escape: "Échap",
  Enter: "Entrée",
  Backspace: "Retour arrière",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  AltLeft: "Alt",
  AltRight: "Alt droite",
  CapsLock: "Verr. maj",
};

/** Le nom d'une touche, tel qu'il est écrit sur un clavier AZERTY. */
export function nomTouche(code: string): string {
  if (NOMS_SPECIAUX[code]) return NOMS_SPECIAUX[code]!;
  if (AZERTY[code]) return AZERTY[code]!;
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Pavé ${code.slice(6)}`;
  return code;
}

/** La touche d'une action. */
export function touche(a: Action): string {
  return assignees[a];
}

/** Le nom à afficher pour une action (sa touche principale). */
export function nomDe(a: Action): string {
  return nomTouche(assignees[a]);
}

/** L'action d'une touche frappée (ou null). */
export function actionDe(code: string): Action | null {
  for (const a of Object.keys(ACTIONS) as Action[]) {
    if (assignees[a] === code || ACTIONS[a].aussi?.includes(code)) return a;
  }
  return null;
}

/** Les touches tenues correspondent-elles à cette action ? */
export function tenue(a: Action, touches: Set<string>): boolean {
  return touches.has(assignees[a]) || (ACTIONS[a].aussi ?? []).some((c) => touches.has(c));
}

/**
 * Réassigne une touche. Si elle servait déjà à une autre action, les deux échangent leurs touches.
 * Renvoie l'action qui a dû changer, s'il y en a une.
 */
export function assigner(a: Action, code: string): Action | null {
  if (RESERVEES.has(code)) return null;
  let echange: Action | null = null;
  for (const autre of Object.keys(ACTIONS) as Action[]) {
    if (autre !== a && assignees[autre] === code) {
      assignees[autre] = assignees[a];
      echange = autre;
    }
  }
  assignees[a] = code;
  sauver();
  return echange;
}

export function retablir(): void {
  for (const a of Object.keys(ACTIONS) as Action[]) assignees[a] = ACTIONS[a].defaut;
  sauver();
}

function sauver(): void {
  const diff: Partial<Record<Action, string>> = {};
  for (const a of Object.keys(ACTIONS) as Action[]) if (assignees[a] !== ACTIONS[a].defaut) diff[a] = assignees[a];
  ecrire(CLE, Object.keys(diff).length ? JSON.stringify(diff) : null);
  ecouteurs.forEach((f) => f());
}

const ecouteurs: (() => void)[] = [];
/** Prévenir quand les touches ou leurs noms changent (pour réécrire les textes à l'écran). */
export function surChangement(f: () => void): void {
  ecouteurs.push(f);
}

/** Sur écran tactile : le nom des boutons, à la place des touches. */
const BOUTONS: Partial<Record<Action, string>> = {
  agir: "A",
  examiner: "B",
  combat: "Explorer / Combat",
  sac: "Sac",
  fabriquer: "Fabriquer",
  carte: "Carte",
  carnet: "Carnet",
  lumiere: "le bouton de ta lumière",
  tourner: "la boussole",
  lancer: "Lancer",
  courir: "joystick à fond",
  discret: "joystick à peine incliné",
};

/**
 * Remplace les repères {action} d'un texte par la touche du joueur (ou le bouton, sur téléphone).
 * Ex. « Passe en mode Combat ({combat}) » → « Passe en mode Combat (X) ».
 */
export function avecTouches(texte: string, tactile: boolean): string {
  return texte.replace(/\{(\w+)\}/g, (tout, nom: string) => {
    if (!(nom in ACTIONS)) return tout;
    const a = nom as Action;
    return tactile ? (BOUTONS[a] ?? nomDe(a)) : nomDe(a);
  });
}
