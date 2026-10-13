// La grille des étoiles au niveau 1 (plan 0.8 §2.4, chantier 8 ; `armes-par-niveau.md` Q-A2, K1 à K56, K-Q1, K-Q2).
//
// Seul, on fait ★ à la maison, ★★ à H1 et L1 ; avec une autre famille, une étoile de plus, pas deux (Q-A2f). La grille
// tient **par les recettes** : la forge du niveau 1 fait ★★, la corde d'arc de fil dentaire ★★★, l'arc d'if se monte ★★,
// l'arc d'arbalète en if attend le niveau 2… La **maîtrise** donne l'étoile du dessus, avec ses vrais dégâts, même quand
// elle appartient à l'étape suivante (K-Q1, refusé : pas de plafond par étape). Le niveau 1 se joue avec les armes de
// la station (K-Q2) : aucune étoile intermédiaire pour L1.
//
// Ce fichier n'a que des données (aucun import de valeur : les recettes le lisent sans cycle). Le chantier 9 (faire
// évoluer une arme sur son meuble) lit `PLAFONDS_NIVEAU_1` pour savoir jusqu'où un meuble du niveau 1 peut monter une
// arme ; les dégâts et l'étape de chaque étoile sont dans les tables (`parEtoiles`, armes/*.ts et tir.ts).

import type { EtapeArme, ValeursEtoile } from "../combat.ts";
import type { Etoiles } from "../etoiles.ts";
import type { TypeObjet } from "../objets.ts";

/** Au niveau 1, l'arc d'if se monte ★★ (Q-A2b, Q-B1d) : ★★★ attendra le rabot (L2B). */
export const PLAFOND_ARC_IF_NIVEAU_1: Etoiles = 2;

/** Les étoiles qu'une arme atteint au niveau 1, seul : par une recette, et avec la maîtrise (une de plus). */
export interface PlafondArme {
  /** La meilleure étoile qu'une recette du niveau 1 donne (null : rien à fabriquer au niveau 1 : trouvée, ou plus tard). */
  recette: Etoiles | null;
  /** Avec la maîtrise (10 exemplaires de la même sorte, +1 étoile, sans plafond : K-Q1). null : pas de maîtrise. */
  maitrise: Etoiles | null;
  /** Ce qui fixe ce plafond, en clair. */
  pourquoi: string;
}

/**
 * Les plafonds de la grille au niveau 1, arme par arme (plan 0.8 §2.4 et §9.1). Les armes sans étoiles (marteau,
 * lance, gourdin, épieu, hache, lance forgée, couteau aiguisé, fourche à foin) n'y sont pas : elles ne montent pas.
 */
export const PLAFONDS_NIVEAU_1: Partial<Record<TypeObjet, PlafondArme>> = {
  // 🔥 Le foyer de forge et l'enclume de dépanneur font ★★ (P1, Q-A6) ; ★★★ attend la forge ventilée (L2B).
  machette_forgee: { recette: 2, maitrise: 3, pourquoi: "Le foyer de forge fait ★★ (l'enclume de dépanneur) ; ★★★ par la maîtrise, à 2,5." },
  hachette: { recette: 2, maitrise: 3, pourquoi: "Au foyer de forge, à ★★ (Q-0.8-2)." },
  serpe: { recette: 2, maitrise: 3, pourquoi: "Au foyer de forge, à ★★." },
  lame_forgee: { recette: 2, maitrise: 3, pourquoi: "Au foyer de forge, à ★★." },
  hache_forgee: { recette: null, maitrise: null, pourquoi: "La forge ventilée (L2B) : plus tard." },
  glaive: { recette: null, maitrise: null, pourquoi: "La forge ventilée (L2B) : plus tard." },
  // ⚡ La matraque de fortune ★, sa ★★ par la maîtrise ; la matraque électrique ★★ au module de décharge (celui du condensateur moyen), avec la petite
  // batterie du kit pour source sûre (Q-A5). Le module à bobine (★★★) et l'aiguillon attendent le poste de montage (L2A).
  matraque_fortune: { recette: 1, maitrise: 2, pourquoi: "Le flash et la petite batterie : ★ ; ★★ par la maîtrise seulement (K27)." },
  matraque_electrique: { recette: 2, maitrise: 3, pourquoi: "Le module de décharge du condensateur moyen : ★★ ; le module à bobine attend le poste de montage (L2A)." },
  aiguillon: { recette: null, maitrise: null, pourquoi: "Le poste de montage (L2A) : plus tard." },
  // ⚙️ L'arbalète ★★ (la lame de ressort) ; l'arc d'arbalète en if attend l'établi de menuisier (Q-0.8-3).
  arbalete: { recette: 2, maitrise: 3, pourquoi: "★★ au ressort ; l'arc d'arbalète en if est grisé « plus tard » (Q-0.8-3)." },
  arbalete_lourde: { recette: null, maitrise: null, pourquoi: "Les ressorts retrempés (niveau 3) : plus tard." },
  // L'arc pour tous : la corde fait l'étoile (I13).
  arc_fortune: { recette: 1, maitrise: 2, pourquoi: "Le bois vert : ★ ; ★★ par la maîtrise seulement (K51)." },
  arc_simple: { recette: 3, maitrise: 4, pourquoi: "Corde de joncs ou de ficelle : ★★ ; de fil dentaire ou de boyau : ★★★ ; ★★★★ par la maîtrise seulement (Q-0.8-4)." },
  arc_if: { recette: PLAFOND_ARC_IF_NIVEAU_1, maitrise: 3, pourquoi: "Monté ★★ au niveau 1 (Q-B1d) ; ★★★ par la maîtrise, à 2,25." },
  arc_sportif: { recette: null, maitrise: null, pourquoi: "Plus tard (Q-A2c)." },
};

/** L'étape d'une étoile, lue dans la table d'une arme (null : non placée). */
export function etapeDeLEtoile(parEtoiles: Partial<Record<Etoiles, ValeursEtoile>> | undefined, n: Etoiles): EtapeArme | null {
  return parEtoiles?.[n]?.etape ?? null;
}
