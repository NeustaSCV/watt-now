// Watt Now? — making-of : le pont vers le rendu du jeu (code/client/src/rendu) et la bibliothèque de bâtiments,
// empaqueté avec three.js dans making-of/vendor/rendu-jeu.js par outils/preparer.sh. Rien n'est modifié : on lit.
// Mêmes exports que le paquet de l'intro (ses modules copiés s'y branchent), plus la faune et les Éteints.
export * from "../../intro/outils/rendu-jeu.ts";
export { Volaille, creerRenard, poserRenard } from "../../code/client/src/rendu/faune.ts";
export { tenueDeVariante, habillerVariante } from "../../code/client/src/rendu/variantes-eteints.ts";
export { couleurCheveuxDe, hauteurDe } from "../../code/commun/src/apparence.ts";
