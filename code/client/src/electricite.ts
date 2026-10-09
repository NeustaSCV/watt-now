// L'électricité des Voltaïques, côté client (Book 25 §5.3, chantier 6 · 0.6) : ce que change la mise à jour d'une
// installation électrique. L'alarme franchie allume sa LED et fait vibrer le téléphone (sans un bruit : rien ne doit
// attirer les Éteints) ; la clôture couchée, ou privée de courant, se dit en une ligne.
// Le serveur juge tout (serveur/src/electricite.ts) ; ici, on ne fait que montrer.

import type { InstallationVue } from "../../commun/src/messages.ts";
import { allumerLed } from "./rendu/metier/electricite.ts";

/** Les installations électriques dont le client suit l'état. */
export function estInstallationElectrique(type: string): boolean {
  return type === "alarme_electrique" || type === "cloture_fortune" || type === "cloture_electrique" || type === "plaque_choc";
}

/** Une clôture sous tension (armée, pas couchée) : elle bourdonne. */
export function sousTension(i: InstallationVue): boolean {
  return (i.type === "cloture_fortune" || i.type === "cloture_electrique") && i.etat.declencheur?.arme === true && !i.etat.declencheur.couche;
}

/**
 * Ce qu'il faut dire quand une installation électrique change (null : rien). `avant` : l'état connu (absent : elle
 * vient d'arriver, on ne dit rien). Allume la LED et fait vibrer quand l'alarme est franchie.
 */
export function suivreElectrique(avant: InstallationVue | undefined, apres: InstallationVue): string | null {
  if (!avant || !estInstallationElectrique(apres.type)) return null;
  const a = avant.etat.declencheur;
  const b = apres.etat.declencheur;
  if (!b) return null;
  if (apres.type === "alarme_electrique") {
    if (b.prises > (a?.prises ?? 0)) {
      allumerLed();
      // Le téléphone vibre (Android ; sur iPhone, le message suffit) : prévenu sans un bruit.
      navigator.vibrate?.([180, 90, 180]);
    }
    return null;
  }
  if (apres.type === "plaque_choc") return null;
  if (b.couche && !a?.couche) return "Ta clôture est couchée : trois Éteints ont poussé. Relève-la ({agir}).";
  if (!b.couche && a?.arme && !b.arme) return "Ta clôture n'a plus de courant : les batteries du banc sont vides.";
  if (!b.couche && a && !a.arme && !a.couche && b.arme) return "Le courant repasse dans ta clôture.";
  return null;
}
