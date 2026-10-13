// Le message « trop lourd » (plan 0.8.2, chantier H ; recette 0.8) : il dit ce que pèse l'objet qu'on voulait prendre,
// et où en est le sac : « Étau, 6 kg : trop lourd, ton sac est à 50 kg sur 55. » Puis comment s'en sortir.

import { CAPACITE_SAC, OBJETS, capaciteDe, nommer, poidsInventaire, type Inventaire } from "../../commun/src/objets.ts";
import { typeDe, type CleObjet } from "../../commun/src/etoiles.ts";

/** Des kilos lisibles : « 6 », « 1,2 », « 0,3 ». */
function kilos(kg: number): string {
  return String(Math.round(kg * 10) / 10).replace(".", ",");
}

/**
 * Les lignes à dire quand le sac ne peut pas prendre `vise` (ce qu'on voulait prendre, s'il est connu). Sans objet
 * visé, la ligne d'avant (le poids du sac et sa capacité). Sans sac, la seconde ligne rappelle comment en retrouver un.
 */
export function texteTropLourd(inventaire: Inventaire, litresGourde: number, vise?: Inventaire): string[] {
  const capacite = capaciteDe(inventaire);
  const sansSac = capacite < CAPACITE_SAC && !(inventaire.sac_fortune ?? 0);
  const porte = poidsInventaire(inventaire, litresGourde);
  const conseil = "Jette (Sac → Jeter) ou range dans un coffre.";
  const lignes: string[] = [];
  const pieces = (Object.entries(vise ?? {}) as [CleObjet, number][]).filter(([, n]) => n > 0);
  if (pieces.length > 0) {
    // Un seul objet : son nom (« Étau d'établi ») ; plusieurs : chacun compté (« 2 bûches de bois sec et 1 pierre »).
    const noms = pieces.map(([cle, n]) => (pieces.length > 1 && n === 1 ? `1 ${nommer(cle, 1)}` : nommer(cle, n)));
    const liste = noms.length > 1 ? `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}` : noms[0]!;
    const poids = pieces.reduce((s, [cle, n]) => s + OBJETS[typeDe(cle)].poids * n, 0);
    lignes.push(`${liste.charAt(0).toUpperCase()}${liste.slice(1)}, ${kilos(poids)} kg : trop lourd, ${sansSac ? "tes poches sont" : "ton sac est"} à ${kilos(porte)} kg sur ${capacite}. ${conseil}`);
  } else {
    lignes.push(`${sansSac ? "Tes poches sont pleines" : "Ton sac est trop lourd"} (${Math.round(porte)} kg sur ${capacite}) : jette (Sac → Jeter) ou range dans un coffre.`);
  }
  if (sansSac) lignes.push("Sans sac, tu ne portes que 10 kg : reprends le tien, ou fabrique un sac de fortune (4 branches, 2 cordes).");
  return lignes;
}
