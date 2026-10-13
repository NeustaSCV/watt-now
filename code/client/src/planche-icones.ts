// La planche des icônes (développement) : toutes les icônes du sac, à la taille du sac (48 px) et à celle des listes
// (28 px), groupées par famille ; un objet resté à l'icône générique est en pointillés, une ordure (valeur 0, que le
// Comptoir ne reprend pas) est grisée comme dans le sac. En tête, les pictogrammes des familles. Ouvrir /icones.html.
// Les nouveautés de la 0.8 (le niveau 1) ont leur groupe, avec en plus une icône agrandie (96 px) pour juger le dessin :
// /icones.html#niveau 1.

import { OBJETS, type TypeObjet } from "../../commun/src/objets.ts";
import { NOMS_FAMILLES_VESTIGES, definitionVestige, estOrdure, type FamilleVestige } from "../../commun/src/vestiges.ts";
import { estDessinee, icone, iconeFamille, type Pictogramme } from "./icones.ts";
import { NOMS_INSTALLATIONS, type TypeInstallation } from "../../commun/src/recettes.ts";
import { NOUVEAUX_OBJETS_0_8, NOUVEAUX_OBJETS_0_8_2 } from "../../commun/src/objets-niveau1.ts";

// Toutes les installations, celles du métier des familles comprises (Book 25).
const INSTALLATIONS: Pictogramme[] = ["feu_de_camp", "poches", ...(Object.keys(NOMS_INSTALLATIONS) as TypeInstallation[])];

/** Le groupe des nouveautés de la 0.8 : les objets créés, ceux dont le dessin a changé, les deux installations nouvelles. */
const NIVEAU_1 = "Niveau 1 (0.8)";
// Les deux condensateurs de la 0.8.2 (R14) les rejoignent, agrandis eux aussi.
const groupes = new Map<string, Pictogramme[]>([[NIVEAU_1, [...NOUVEAUX_OBJETS_0_8, ...NOUVEAUX_OBJETS_0_8_2, "baton_fouir", "jerrican", "ratelier_outils", "torche_plantee"]]]);
for (const type of Object.keys(OBJETS) as TypeObjet[]) {
  if (NOUVEAUX_OBJETS_0_8.includes(type) || NOUVEAUX_OBJETS_0_8_2.includes(type)) continue;
  const v = definitionVestige(type);
  const cle = v ? `Vestiges : ${NOMS_FAMILLES_VESTIGES[v.famille as FamilleVestige] ?? v.famille}` : "Objets";
  groupes.set(cle, [...(groupes.get(cle) ?? []), type]);
}
groupes.set("Installations", INSTALLATIONS);

const planche = document.getElementById("planche")!;
// Un filtre dans l'adresse (icones.html#cuisine) ne montre que les groupes dont le titre le contient.
const filtre = decodeURIComponent(location.hash.slice(1)).toLowerCase();
// icones.html?couleurs : les ordures en couleurs, pour juger le dessin.
const enCouleurs = new URLSearchParams(location.search).has("couleurs");

// Les pictogrammes des familles de vestiges : le repli d'un objet sans dessin propre.
if (!filtre || "familles".includes(filtre)) {
  const familles = Object.keys(NOMS_FAMILLES_VESTIGES) as FamilleVestige[];
  const h = document.createElement("h2");
  h.textContent = `Pictogrammes des familles (${familles.length})`;
  const grille = document.createElement("div");
  grille.className = "grille";
  for (const f of familles) {
    const d = document.createElement("div");
    d.className = "case";
    d.innerHTML = `<span class="petite">${iconeFamille(f, 28)}</span>${iconeFamille(f, 48)}<small>${NOMS_FAMILLES_VESTIGES[f]}</small>`;
    grille.append(d);
  }
  planche.append(h, grille);
}

let dessinees = 0;
let generiques = 0;
for (const [titre, types] of groupes) {
  if (filtre && !titre.toLowerCase().includes(filtre)) continue;
  const h = document.createElement("h2");
  h.textContent = `${titre} (${types.length})`;
  const grille = document.createElement("div");
  grille.className = "grille";
  for (const type of types) {
    const v = definitionVestige(type);
    const propre = estDessinee(type);
    if (propre) dessinees++;
    else generiques++;
    const d = document.createElement("div");
    d.className = `case${propre ? "" : " generique"}${estOrdure(type) && !enCouleurs ? " ordure" : ""}`;
    const nom = type in OBJETS ? OBJETS[type as TypeObjet].nom : type in NOMS_INSTALLATIONS ? NOMS_INSTALLATIONS[type as TypeInstallation] : type;
    const grande = titre === NIVEAU_1 ? `<span class="grande">${icone(type, 96)}</span>` : "";
    d.innerHTML = `${v ? `<span class="rarete">${v.rarete}</span>` : ""}<span class="petite">${icone(type, 28)}</span>${grande}${icone(type, 48)}<small>${nom}</small>`;
    grille.append(d);
  }
  planche.append(h, grille);
}
document.getElementById("bilan")!.innerHTML = `<b>Icônes</b> · ${dessinees} dessinées à la main, ${generiques} en icône générique (pointillés) · ordures grisées comme dans le sac.`;
