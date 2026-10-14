// Le banc de recharge (0.8.2, chantier C : R17) : ce qu'on porte et qui se charge au banc, une ligne par chose, nommée.
// Le serveur s'en sert pour charger (serveur/src/electricite.ts), le client pour dessiner la fiche du banc
// (client/src/fiche-banc.ts). Les chiffres du banc (débit, rendement, portée du pédalier) sont dans energie.ts.

import { CAPACITE_MATRAQUE_FORTUNE_WH, CAPACITE_PACK_SOUDE_WH } from "./armes/voltaiques.ts";
import { armeDeCle, capaciteChargeArme, chargeArme } from "./combat.ts";
import { CAPACITES, NOMS_BATTERIES, TYPES_BATTERIES, capacite, type Charges, type TypeBatterie } from "./energie.ts";
import type { CleObjet } from "./etoiles.ts";
import { nommer, type Inventaire } from "./objets.ts";

/** Ce qu'on charge au banc : une batterie qu'on porte (par son type), ou un exemplaire d'arme électrique (sa clé). */
export type CibleCharge = TypeBatterie | CleObjet;

/** Une chose qu'on porte et qui se charge : son nom, sa source, ce qu'elle tient et ce qu'elle a. */
export interface ChoseACharger {
  cible: CibleCharge;
  /** « La petite batterie de la frontale », « Matraque électrique ★★ »… */
  nom: string;
  /** Ce qui tient le courant, pour une arme : « son pack de cellules », « sa petite batterie ». */
  source?: string;
  wh: number;
  capacite: number;
}

export function estBatterie(cible: string): cible is TypeBatterie {
  return cible in CAPACITES;
}

function majuscule(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Tout ce qu'on porte et qui se charge au banc : les batteries du sac (la petite de la frontale d'abord), puis chaque
 * arme électrique (une ligne par exemplaire, son étoile dans le nom). Pleines ou non : la fiche les montre toutes.
 */
export function chosesACharger(inventaire: Inventaire, charges: Charges, chargeArmes: Partial<Record<string, number>>): ChoseACharger[] {
  const r: ChoseACharger[] = [];
  for (const b of TYPES_BATTERIES) {
    const n = inventaire[b] ?? 0;
    if (n <= 0) continue;
    const nom = n > 1 ? `Tes ${nommer(b, n)}` : majuscule(NOMS_BATTERIES[b]);
    r.push({ cible: b, nom, wh: Math.max(0, charges[b] ?? 0), capacite: capacite(b, n) });
  }
  for (const [cle, n] of Object.entries(inventaire)) {
    if (!n || n <= 0) continue;
    const a = armeDeCle(cle);
    if (!a?.electrique) continue;
    r.push({
      cible: cle as CleObjet,
      nom: majuscule(nommer(cle as CleObjet, 1)),
      // La ★★★ tient son pack soudé (V1-14) ; la ★★ et la matraque de fortune, la petite batterie du kit.
      source: a.electrique.capaciteWh === CAPACITE_PACK_SOUDE_WH ? "son pack soudé" : a.electrique.capaciteWh === CAPACITE_MATRAQUE_FORTUNE_WH ? "sa petite batterie" : "son pack de cellules",
      wh: chargeArme(cle, chargeArmes),
      capacite: capaciteChargeArme(a),
    });
  }
  return r;
}

/** La place qui reste dans une chose à charger (Wh). */
export function manque(c: Pick<ChoseACharger, "wh" | "capacite">): number {
  return Math.max(0, c.capacite - c.wh);
}

/** Une chose est pleine à 0,05 Wh près. */
export function pleine(c: Pick<ChoseACharger, "wh" | "capacite">): boolean {
  return manque(c) <= 0.05;
}
