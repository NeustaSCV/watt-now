# Watt Now? — bâtiments urbex et haltes : livraison

> Préparé le 2026-10-09. **Statut : tout est « à valider »** par le porteur du projet.

## Où sont les modèles

Tout est dans le dossier **`batiment/`** :

- **21 bâtiments urbex** (37 cartes) : villa du milliardaire, château, hôpital, centrale thermique, gare, siège de la
  Compagnie, théâtre, Grand Hôtel, église, mine, sanatorium d'altitude, médiathèque, aciérie, phare, Galerie de
  l'Abondance, Wattyland, usine chimique, château d'eau, moulin, sanatorium marin, piscine Art déco ;
- **14 haltes** (56 tronçons) : aire d'autoroute, aire du Bois-Joli, grand bouchon, tunnel, péage, col, passage à
  niveau, avenue barricadée, route du pont, corniche, digue, gué, carrefour, Superchargeurs Watty.

Un lieu = un dossier `batiment/<id>/` avec son `modele.js`. La liste des id est dans `batiment/catalogue.js`. Le
détail par lieu (cartes, budgets, goulets) est dans `batiment/README.md`.

Ce sont des **modules ES en JavaScript** (Three.js procédural, aucun fichier 3D). Ils ne dépendent que de `three` et
de `batiment/commun/atelier.js`.

## Les voir

Lancer la configuration « batiment » de `.claude/launch.json` (port 8792), puis ouvrir
`http://localhost:8792/index.html`.

- **Choisir un lieu** : liste en haut à gauche. Pour changer de carte, utiliser les boutons de la fiche en bas à gauche.
- **Régler la vue** :
  - vue libre ou vue de jeu (isométrique, clic au sol pour déplacer le personnage, A / E pour tourner) ;
  - jour, soir ou nuit ;
  - toits visibles ou en coupe ;
  - usure.
- **Le compteur en bas à droite** donne les triangles et les appels de dessin de la carte affichée.
- **Raccourcis d'adresse** : `index.html?b=<id>&carte=<id>&vue=jeu&heure=nuit&toits=masques`. Pour voir une halte
  entière, `&carte=*`. Pour voir l'autre état d'un objet nommé, `&montrer=epave_apres&cacher=maree_basse`.

## Les utiliser dans le jeu

```js
import { FICHE, creer } from "<chemin>/batiment/hopital/modele.js";

const objet = creer({ usure: 0.7, carte: "cour" }); // un THREE.Group, à poser dans la scène
objet.userData.toits;      // couches qui s'effacent (toits, étages) : même format que la halte actuelle
objet.userData.obstacles;  // segments infranchissables : [{ x1, z1, x2, z2, nature }]
objet.userData.lumieres;   // sources de nuit : [{ x, y, z, couleur, intensite, portee, nature }]
objet.traverse((o) => o.userData.animer?.(t, dt)); // à appeler à chaque image (eau, néons, guirlandes…)
```

- **Le repère** : 1 unité = 1 m, sol à y = 0, +x à l'est, +z au sud, origine au centre du lot. La caméra de jeu
  regarde depuis le sud-est.
- **`carte`** : un id de `FICHE.cartes`. Sans cartes, il y a une seule carte, décrite par `FICHE.lot` et
  `FICHE.depart`.
- **`usure`** : de 0,1 (vieilli) à 1 (effondré). La référence est 0,7. Le résultat est déterministe.
- **La `FICHE` de chaque carte** donne :
  - `lot` et `depart` (point d'arrivée du joueur) ;
  - `entrees` ;
  - `fouille` : les points de butin ;
  - `eteints` : les points d'apparition ;
  - pour une halte, `halte: true`, `goulets` et `panneaux`, et le `decalage` de chaque tronçon.
- **Les toits et étages** : on ne visite que le rez-de-chaussée. Le reste est dans `userData.toits`. Il suffit
  d'appeler `estomperToits(objet, x, z, dt, lacet)` de `code/client/src/rendu/halte.ts`, comme pour la
  station-service.
- **Les lumières** : 8 au plus par carte. Elles entrent dans la réserve fixe de lumières de nuit (Book 21 §5.3.3).
- **Les haltes** : poser chaque tronçon à son `decalage`. Garder construits seulement le tronçon du joueur et ses
  voisins.
- **Avec Vite** : ajouter un alias `three` vers `code/node_modules/three`, pour n'avoir qu'un seul three.js, et
  autoriser `server.fs.allow` sur `batiment/`.
- **Le temps de construction** : `creer()` prend de 50 à 800 ms selon le lieu. Le faire derrière un chargement.
- **Le budget** : 60 000 triangles et 40 appels de dessin au plus par carte ou tronçon, mesurés à toutes les usures.

## À savoir

- **Les zones creusées** (`solPropre: true` : rivières, ravins, falaises, bassins) ne sont pas praticables. Leurs bords
  sont déjà en obstacles.
- **Certains passages demandent une règle de jeu** :
  - ramper sous la citerne du passage à niveau ;
  - la passerelle à 6 m du passage à niveau ;
  - la barrière des pillards du péage, qui s'ouvre quand on a payé ;
  - le bac du gué.
- **De petites marches** existent : le perron du château (0,9 m), les quais de la gare (0,3 m), la scène du théâtre
  (0,15 m). Le personnage peut les traverser, ou il faut suivre la hauteur.
- **L'usine chimique** a un champ `zones` (zones contaminées), à brancher sur la santé (Book 05).
- **L'aire du Bois-Joli** est volontairement crue, pour un public adulte.
- **Rien n'est commité.**
