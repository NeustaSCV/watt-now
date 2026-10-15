// Le compte admin « god » (outil du porteur du projet, 0.7) : un seul compte, créé par la commande admin
// (code/scripts/admin.ts), jamais depuis le jeu. Ici, ce que client et serveur partagent : le pseudo réservé,
// les gestes admin (le serveur vérifie à chaque fois que c'est bien l'admin), les lieux où l'on peut aller d'un coup.

import { LIEUX, TOUS_LES_LIEUX, type LieuId } from "./lieux.ts";

/** Le seul pseudo admin. */
export const PSEUDO_ADMIN = "god";

/** Les sosies évidents d'une lettre (chiffres, lettres grecques et cyrilliques). */
const SOSIES: Record<string, string> = {
  "0": "o",
  "ο": "o",
  "о": "o",
  "º": "o",
  "°": "o",
  "6": "g",
  "9": "g",
  "ɡ": "g",
  "ԁ": "d",
  "ď": "d",
};

/**
 * Le pseudo réservé, et ses variantes évidentes : « God », « GOD », « g0d », « g o d », « G-o-d », « gοd » (omicron)…
 * On enlève accents, espaces et ponctuation, on remplace les sosies, et l'on compare à « god ».
 */
export function pseudoReserve(pseudo: string): boolean {
  const lettres = [...pseudo.normalize("NFKD").toLowerCase()]
    .map((c) => SOSIES[c] ?? c)
    .join("")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
  return lettres === PSEUDO_ADMIN;
}

/** Les gestes de l'admin (menu ⚙). Le serveur les refuse à tout autre compte. */
export type OperationAdmin = { genre: "invincible"; oui: boolean } | { genre: "aller"; vers: LieuId } | { genre: "remplir" };

/** Ce que le client sait de son statut d'admin (absent : un joueur comme les autres). */
export interface VueAdmin {
  invincible: boolean;
}

/** Les lieux du menu « Aller à… » : tous ceux de la carte qui sont ouverts, dans l'ordre de la route. */
export function lieuxAdmin(): { id: LieuId; nom: string }[] {
  return TOUS_LES_LIEUX.filter((id) => LIEUX[id].ouvert).map((id) => ({ id, nom: LIEUX[id].nom }));
}

export function estOperationAdmin(op: unknown): op is OperationAdmin {
  if (typeof op !== "object" || op === null || Array.isArray(op)) return false;
  const o = op as Record<string, unknown>;
  switch (o.genre) {
    case "invincible":
      return typeof o.oui === "boolean";
    case "aller":
      return typeof o.vers === "string" && (TOUS_LES_LIEUX as readonly string[]).includes(o.vers);
    case "remplir":
      return true;
    default:
      return false;
  }
}
