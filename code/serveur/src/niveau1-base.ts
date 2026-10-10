// Le couchage, le stockage, l'établi, la lumière côté serveur (plan 0.8 §2.3, chantier 6).
// - La torche plantée : on l'allume (briquet ou pierre à feu), elle brûle une heure de jeu, puis elle est consumée.
// - Le râtelier à outils : il se remplit comme un coffre, mais seulement d'outils (joueur.ts, `utiliserCoffre`).
// - Les outils à portée (le râtelier, l'établi à étau) : commun/src/outils-a-portee.ts.
//
// Ce module ne connaît pas le joueur : il passe par le `ContexteMecanique` que joueur.ts prête déjà à la mécanique.
// joueur.ts n'ajoute que des appels d'une ligne.

import type { InstallationVue, Verbe } from "../../commun/src/messages.ts";
import { DUREE_TORCHE_MS, torcheConsumee } from "../../commun/src/torche.ts";
import type { ContexteMecanique } from "./mecanique.ts";

/** Le temps d'allumer le chiffon gras (secondes réelles). */
const ALLUMER_TORCHE_S = 3;

/**
 * A sur une installation du niveau 1 : allumer la torche plantée. Rend true si le geste est pris en charge ici (sinon
 * le joueur continue avec ses autres gestes).
 */
export function utiliserNiveau1(ctx: ContexteMecanique, i: InstallationVue, verbe: Verbe, maintenant: () => number): boolean {
  if (i.type !== "torche_plantee" || verbe !== "allumer") return false;
  if (torcheConsumee(i, maintenant())) {
    ctx.info("La torche est consumée : plante une autre torche (une branche, un chiffon, de la graisse).");
    return true;
  }
  if (i.etat.eteinteLe !== undefined) {
    ctx.info("La torche brûle déjà.");
    return true;
  }
  const inv = ctx.inventaire();
  if (!(inv.pierre_a_feu || inv.briquet)) {
    ctx.info("Rien pour allumer la torche : il faut un briquet ou une pierre à feu.");
    return true;
  }
  ctx.commencer(
    "Allumer la torche",
    ALLUMER_TORCHE_S,
    () => {
      if (i.etat.eteinteLe !== undefined) return;
      i.etat = { ...i.etat, eteinteLe: maintenant() + DUREE_TORCHE_MS };
      ctx.maj();
      ctx.noter("torche_allumee");
      ctx.info("La torche brûle : six mètres de lumière pendant une heure de jeu. La nuit, elle se voit de loin.");
    },
    "outil",
  );
  return true;
}
