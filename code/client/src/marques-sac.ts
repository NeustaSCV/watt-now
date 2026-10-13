// Les marques du sac (plan 0.8.2, chantier H, R6) : ce qu'on a « sur soi », d'un coup d'œil sur les cases.
// - l'arme en main au combat porte sa marque ⚔, qu'on l'ait choisie (« Équiper ») ou non : sans choix, le combat prend
//   la meilleure arme du sac (P-005), et c'est elle qu'on marque ; le serveur et le client la calculent de la même façon
//   (`armeEnMain`) ;
// - le sac qu'on porte sur le dos (celui qui compte pour la charge) porte la même marque, avec son signe.

import { armeEnMain } from "../../commun/src/combat.ts";
import { typeDe, type CleObjet } from "../../commun/src/etoiles.ts";
import { CONTENANTS, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";

/** La case de l'arme qu'on aura en main en mode Combat (choisie ou la meilleure du sac) ; null : les poings. */
export function armeMarquee(inventaire: Inventaire, equipee: CleObjet | null): CleObjet | null {
  const arme = armeEnMain(inventaire, equipee);
  if (!arme.objet) return null;
  const cle = arme.cle ?? arme.objet;
  if ((inventaire[cle] ?? 0) > 0) return cle;
  // Un exemplaire rangé sous une autre clé du même objet (filet de sécurité : la marque ne doit pas disparaître).
  return (Object.keys(inventaire) as CleObjet[]).find((c) => typeDe(c) === arme.objet && (inventaire[c] ?? 0) > 0) ?? null;
}

/** Le sac qu'on porte sur le dos : le contenant qui compte (le plus grand), ou null (les poches). */
export function sacPorte(inventaire: Inventaire): TypeObjet | null {
  let porte: TypeObjet | null = null;
  for (const [type, kg] of Object.entries(CONTENANTS) as [TypeObjet, number][]) {
    if ((inventaire[type] ?? 0) > 0 && (porte === null || kg > CONTENANTS[porte]!)) porte = type;
  }
  return porte;
}
