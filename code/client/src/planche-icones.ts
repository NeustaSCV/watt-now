// La planche des icônes (développement) : toutes les icônes du sac, à la taille du sac (48 px) et à celle des listes
// (28 px), groupées par famille ; les vestiges à l'icône générique sont en pointillés. Ouvrir /icones.html.

import { OBJETS, type TypeObjet } from "../../commun/src/objets.ts";
import { NOMS_FAMILLES_VESTIGES, definitionVestige, type FamilleVestige } from "../../commun/src/vestiges.ts";
import { estDessinee, icone, type Pictogramme } from "./icones.ts";

const INSTALLATIONS: Pictogramme[] = ["feu_de_camp", "etabli", "abri", "coffre", "charbonniere", "forge", "pedalier", "banc_recharge", "escabeau", "poches", "recuperateur_pluie", "alarme_boites", "lit_branchages", "decharge"];

const groupes = new Map<string, Pictogramme[]>();
for (const type of Object.keys(OBJETS) as TypeObjet[]) {
  const v = definitionVestige(type);
  const cle = v ? `Vestiges : ${NOMS_FAMILLES_VESTIGES[v.famille as FamilleVestige] ?? v.famille}` : "Objets";
  groupes.set(cle, [...(groupes.get(cle) ?? []), type]);
}
groupes.set("Installations", INSTALLATIONS);

const planche = document.getElementById("planche")!;
let dessinees = 0;
let generiques = 0;
// Un filtre dans l'adresse (icones.html#cuisine) ne montre que les groupes dont le titre le contient.
const filtre = decodeURIComponent(location.hash.slice(1)).toLowerCase();
for (const [titre, types] of groupes) {
  if (filtre && !titre.toLowerCase().includes(filtre)) continue;
  const h = document.createElement("h2");
  h.textContent = `${titre} (${types.length})`;
  const grille = document.createElement("div");
  grille.className = "grille";
  for (const type of types) {
    const v = definitionVestige(type);
    const propre = estDessinee(type);
    if (v) {
      if (propre) dessinees++;
      else generiques++;
    }
    const d = document.createElement("div");
    d.className = `case${propre ? "" : " generique"}`;
    const nom = type in OBJETS ? OBJETS[type as TypeObjet].nom : type;
    d.innerHTML = `${v ? `<span class="rarete">${v.rarete}</span>` : ""}<span class="petite">${icone(type, 28)}</span>${icone(type, 48)}<small>${nom}</small>`;
    grille.append(d);
  }
  planche.append(h, grille);
}
document.getElementById("bilan")!.innerHTML = `<b>Icônes</b> · vestiges et composants : ${dessinees} dessinés à la main, ${generiques} en icône générique (pointillés).`;
