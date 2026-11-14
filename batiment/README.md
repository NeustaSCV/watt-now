# Banque de bâtiments urbex — *Watt Now?*

Des bâtisses abandonnées, belles et rongées par le temps, où le joueur va fouiller : villas de milliardaires, châteaux,
hôpitaux, centrales… Chacune raconte l'Âge de l'Abondance sans un mot (Book 15, Book 20 §5).

- **Voir les bâtiments** : `index.html`, servi par le serveur statique de ce dossier (configuration « batiment » de
  `.claude/launch.json`, port 8792). Adresse directe : `index.html?b=<id>&vue=jeu&heure=nuit&toits=masques`.
- **Piocher dedans (agents développeurs)** : chaque bâtiment est un module ES autonome, qui ne dépend que de `three`.

## Catalogue

| id | Bâtiment | Cartes (triangles / appels à l'usure maximale) |
|---|---|---|
| `villa-milliardaire` | La villa du milliardaire | 1 : 49 k / 31 |
| `chateau` | Le château abandonné | `parc` 57 k / 34 · `interieur` 54 k / 30 · `communs` 33 k / 35 |
| `hopital` | L'hôpital pavillonnaire | `cour` 58 k / 36 · `soins` 48 k / 28 |
| `centrale-thermique` | La centrale thermique | `site` 49 k / 34 · `turbines` 42 k / 24 · `tour` 35 k / 26 |
| `gare` | La gare à verrière | `voyageurs` 59 k / 30 · `halle` 56 k / 32 |
| `siege-compagnie` | Le siège de la Compagnie | `parvis` 36 k / 28 · `dispatching` 42 k / 34 |
| `theatre` | Le théâtre à l'italienne | `facade` 26 k / 24 · `salle` 42 k / 35 |
| `grand-hotel` | Le Grand Hôtel des Flots (`solPropre`) ; niveau 2 : un seul lot, l'étage posé à côté (groupes `rez_de_chaussee` et `etage`), objets nommés | 1 : 58 k / 40 |
| `eglise` | L'église du bourg et son presbytère | 1 : 58 k / 33 |
| `mine` | Le carreau de la mine | `carreau` 56 k / 38 · `batiments` 52 k / 35 |
| `sanatorium` | Le sanatorium des Hauts-Soleils | `galeries` 56 k / 28 · `interieur` 49 k / 24 |
| `mediatheque` | La médiathèque à coupole | `rotonde` 55 k / 31 · `magasins` 50 k / 37 |
| `acierie` | L'aciérie et son haut fourneau | `fourneau` 54 k / 34 · `laminerie` 49 k / 30 |
| `phare` | Le phare du cap (falaise, `solPropre`) ; niveau 2 : l'épave du cargo (`epave_apres`, `userData.obstaclesEpave`), objets nommés, `hauteurSol(x, z, { epave })` exportée | 1 : 59 k / 39 (+ `cargo.js` : `creerCargo()`, 2,7 k / 8) |
| `galerie-abondance` | La Galerie de l'Abondance | `parking` 38 k / 22 · `galerie` 58 k / 33 |
| `parc-attractions` | Wattyland, le parc d'attractions | `entree` 52 k / 28 · `maneges` 42 k / 30 |
| `usine-chimique` | L'usine chimique (champ `zones` contaminées) | `installations` 56 k / 35 · `ateliers` 46 k / 26 |
| `chateau-eau` | Le château d'eau et la station de pompage (`solPropre`) | 1 : 57 k / 33 |
| `moulin` | Le moulin à eau et sa minoterie (`solPropre`) ; parcours 0.8 (L1B), objets nommés (`userData.objets`) | 1 : 59 k / 39 |
| `sanatorium-marin` | Le sanatorium marin des Courlis | `front` (`solPropre`) 56 k / 36 · `pavillons` 51 k / 29 |
| `piscine-art-deco` | La piscine Art déco et ses bains-douches (`solPropre`) | 1 : 53 k / 35 |

21 bâtiments, 37 cartes, tous **à valider** par le porteur du projet. Mesures du 2026-10-09 (2026-10-14 pour les lieux du niveau 2), à l'usure 1 (le pire cas, tous les états visibles).

**Les objets nommés (niveau 2)** : ce qui change d'état ou qu'on prend est un objet à part (`name` = `userData.nom`), décrit dans `FICHE.objets` et rangé dans `userData.objets`. L'état de départ est visible, l'autre caché. Le format des pièces, des portes, des passages à sens unique et des téléportations est dans `CONSIGNE-NIVEAU-2.md`. Dans la visionneuse, `&montrer=epave_apres&cacher=maree_basse` montre ou cache des objets nommés.

**R52, « un lieu ne s'arrête jamais net »** (2026-10-15) : les lieux du niveau 2 et le gué ont un groupe `alentours` (le décor prolongé au-delà du lot), des panneaux de sortie à lanterne et une seule matière pour la mer ; la consigne est dans `CONSIGNE-R52.md`. Le décor autour de la station-service, dessinée par le jeu, est dans `alentours-station/` (repère du jeu, origine au coin nord-ouest du lot, hors catalogue).

**À savoir pour l'intégration** : les zones creusées (`solPropre`) et la dune du sanatorium marin sortent du sol plat. Le jeu doit les marquer comme non praticables ou suivre leur relief. Dans chaque fiche, les bords sont déjà notés comme obstacles.

## Haltes

Ce sont des maps à traverser sur les longs trajets (Book 01 §2 bis, Book 20 §4), d'environ 200 × 70 m, d'ouest (entrée A) en est (sortie B). Chacune est découpée en **4 tronçons** de 50 × 70 m : ce sont ses cartes, et chacune porte son `decalage`. Le jeu ne charge que les tronçons proches du joueur. Le budget de 60 000 triangles et 40 appels s'applique **à chaque tronçon**. Dans la visionneuse, « Toute la halte » (`&carte=*`) montre l'ensemble.

En plus du contrat d'un bâtiment, la fiche d'une halte porte `halte: true`, `goulets` (les passages obligés) et `panneaux`. La consigne des agents est dans `CONSIGNE-HALTES.md`.

| id | Halte | Goulets | Tronçons (k triangles / appels, usure 1) |
|---|---|---|---|
| `halte-aire-autoroute` | L'aire d'autoroute | Entrée bouchée, dessous de la passerelle | 27/12 · 29/27 · 29/27 · 21/17 |
| `halte-bois-joli` | L'aire du Bois-Joli (adulte, cru) | Pont de bois, barrière du parking | 41/21 · 47/17 · 41/26 · 44/15 |
| `halte-grand-bouchon` | Le grand bouchon de la Grande Panne | Carambolage (par la navette), contrôle sanitaire | 34/19 · 35/17 · 30/21 · 32/20 |
| `halte-tunnel` | Le tunnel | Éboulement à une voie, barrage de sortie | 19/20 · 19/16 · 20/18 · 18/16 |
| `halte-peage` | Le péage des Percepteurs | Voie en chicane, pont | 20/16 · 39/24 · 22/22 · 20/12 |
| `halte-col` | Le col du Grand-Vent | Galerie paravalanche, sommet | 30/11 · 20/22 · 30/20 · 20/19 |
| `halte-passage-niveau` | Le passage à niveau | Wagon, sous la citerne, passerelle | 39/23 · 39/27 · 57/31 · 33/24 |
| `halte-avenue-barricadee` | L'avenue barricadée | Barricade (par le bus), contrôle sanitaire | 40/28 · 44/32 · 37/33 · 37/29 |
| `halte-route-pont` | La route du pont (niveau 2 : marée `maree_basse` / `maree_haute`, péage `chicane_fermee` / `chicane_ouverte`, `caisse_peage`) | Brèche du tablier, chicane du pylône | 51/40 · 26/28 · 20/21 · 44/35 (`FICHE.maree.retour` : point de retour à marée haute) |
| `halte-corniche` | La corniche du Cap Rouge (niveau 2 : `pin_entier` / `pin_debite`, péage `barricade_fermee` / `barricade_ouverte`, `caisse_peage`) | Tunnel du rocher, éboulement | 40/33 · 56/32 · 48/27 · 39/19 |
| `halte-digue` | La digue des Roselières | Brèche, portes de l'écluse | 44/19 · 40/21 · 39/26 · 47/31 |
| `halte-gue` | Le Gué-aux-Saules (radeau et nappe du radier animables ; `creer({ miroir: true })` et `FICHE_MIROIR` pour le gué retourné) | Radier submersible, bac à câble | 53/12 · 41/33 · 32/26 · 36/17 |
| `halte-carrefour` | Le carrefour | Rond-point, pont-cadre | 44/26 · 40/20 · 39/18 · 20/17 |
| `halte-superchargeurs` | Les Superchargeurs Watty | File d'attente, local technique | 32/12 · 35/16 · 30/15 · 25/15 |

**Ce que le jeu devra prévoir** :
- certains passages demandent une règle propre : ramper sous la citerne du passage à niveau, monter sur la passerelle à 6 m, payer pour que les pillards lèvent leur barrière, traverser en bac ;
- les zones creusées (rivières, ravins, bassins) ne sont pas praticables : leurs bords sont déjà notés comme obstacles.

## Organisation

```
batiment/
  index.html, catalogue.js       la visionneuse et la liste des bâtiments
  commun/atelier.js              l'atelier : Chantier, Batiment, murs, fenêtres, toits, lierre, gravats, textures
  commun/toits.js                l'effacement des toits et des étages (même règle que le jeu)
  commun/visionneuse.js
  vendor/                        three.js 0.186 (copie de code/node_modules, licence MIT)
  <id>/modele.js                 un bâtiment : exporte FICHE et creer({ usure, carte })
```

## Le contrat d'un bâtiment

```js
import { FICHE, creer } from "batiment/villa-milliardaire/modele.js";
const objet = creer({ usure: 0.7, carte: "exterieur" }); // un THREE.Group, origine au centre du lot, au sol
objet.userData.toits;      // couches qui s'effacent : [{ nom, boite: {x, z, l, p}, bas, haut, horsDe, materiaux }]
objet.userData.obstacles;  // segments infranchissables : [{ x1, z1, x2, z2, nature }]
objet.userData.lumieres;   // sources de lumière : [{ x, y, z, couleur, intensite, portee, nature }]
objet.traverse(o => o.userData.animer?.(t, dt)); // quelques éléments animés (rideaux, eau…)
```

`FICHE` contient le nom, le lieu, le danger, le récit, l'inspiration, ce qu'il faut voir, et les **cartes**. Pour
chaque carte, elle donne la taille du lot, le point d'arrivée du joueur, les **points de fouille** (`fouille`), les
**Éteints** (`eteints`) et les **entrées**. Dans la visionneuse, le bouton « Copier la fiche » produit le JSON complet,
obstacles compris.

**Creuser sous le sol** (bassin vide, falaise, fosse, quai) : mets `solPropre: true` dans la fiche, ou dans la carte. Le bâtiment fournit alors lui-même tout le sol de son lot, trous compris, et la visionneuse masque son terrain neutre. Dans le jeu, la zone creusée devra être signalée comme non praticable, ou suivie par le relief.

`userData.toits` a **le même format que les toits de la halte** du jeu : `estomperToits` (code/client/src/rendu/halte.ts)
s'applique tel quel.

## Conventions

- **1 unité = 1 m**, sol à y = 0, +x à l'est, +z au sud. La caméra de jeu regarde depuis le sud-est : la façade
  principale est au sud ou à l'est.
- **On ne visite que le rez-de-chaussée** (Book 19 : un seul niveau). Les étages sont visibles mais inaccessibles :
  ils sont effondrés, murés ou sans escalier praticable. Les étages et les toits sont des **couches qui s'effacent**
  quand le joueur est dessous.
- Hauteur sous plafond du rez-de-chaussée : 2,5 m au moins, davantage dans les bâtisses anciennes. Portes de 2,1 m au
  moins.
- **Rendu du jeu** (Book 18, Book 21 §5.3) : style lisse à facettes, couleur par sommet, occlusion cuite au pied des
  pièces. Les textures sont dessinées au canvas et projetées à leur taille réelle. Le rouge vif et les couleurs de
  l'Abondance sont réservés aux enseignes, aux affiches et aux vestiges.
- **Le temps qui passe** : brèches, toits percés, vitres cassées, lierre, mousse, arbres qui poussent dedans,
  gravats, flaques, rais de lumière. Le réglage `usure` va de 0,1 (vieilli) à 1 (effondré).

## Budget (Book 21 §5.3.4)

La scène visible sur mobile ne doit pas dépasser **150 000 triangles et 120 appels de dessin**. Elle doit aussi loger
les personnages, les Éteints, les objets et le terrain. D'où le budget **par carte de bâtiment** :

| | Plafond |
|---|---|
| Triangles | **≤ 60 000** |
| Appels de dessin | **≤ 40** |

Comment tenir le budget :

- tout fondre par matériau (le Chantier le fait) ;
- de la géométrie simple et des textures pour le détail ;
- l'intérieur meublé seulement là où le joueur entre ;
- **découper un grand lieu en plusieurs cartes**, par exemple le parc et le château, ou l'extérieur et la salle des
  turbines.

La visionneuse affiche le compte en direct et le passe en rouge au-delà du plafond.
