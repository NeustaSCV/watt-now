// Se servir du meuble d'une autre famille (plan 0.8.2 §7.3, chantier J) : qui a appris la recette d'un meuble (leçon,
// manuel) peut s'en servir et y poser sa pièce, comme un membre de cette famille (le Book 24 : « utilisables par
// tous »). Le malus reste sur ce qu'on y fabrique (×1,5, ★★ au plus : recettes.ts) ; les gestes qui ne sont pas des
// recettes (pédaler, charger au banc, poser sa pièce) n'en ont pas. Le serveur (joueur.ts) et le client
// (interaction.ts) posent la même question ici.

import { RECETTES, estApprise, type SavoirRecettes, type TypeInstallation } from "./recettes.ts";
import type { Famille } from "./regles.ts";

/** La famille qui sait bâtir (et donc se servir de) cette installation : celle de sa recette ; « tous » sinon. */
export function familleDuMeuble(type: TypeInstallation): Famille | "tous" {
  return RECETTES.find((r) => "installation" in r.produit && r.produit.installation === type)?.famille ?? "tous";
}

/** Sait-on se servir de cette installation : commune, de sa famille, ou sa recette apprise (leçon, manuel) ? */
export function saitSeServir(type: TypeInstallation, famille: Famille, savoir: SavoirRecettes = {}): boolean {
  const sienne = familleDuMeuble(type);
  if (sienne === "tous" || sienne === famille) return true;
  return RECETTES.some((r) => "installation" in r.produit && r.produit.installation === type && estApprise(r, savoir));
}
