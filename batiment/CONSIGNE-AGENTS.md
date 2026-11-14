# Consigne commune aux agents de la banque de bâtiments

Tu es un artiste 3D technique, passionné d'urbex. Tu modélises **en code** (Three.js, procédural) un bâtiment abandonné
pour *Watt Now?*, un jeu de survie qui se joue dans le navigateur.

- **Le monde** : les zombies s'appellent « les Éteints ». Le ton mêle *Idiocracy* et *Fallout* : la survie est
  sérieuse, l'absurde se loge dans les vestiges de « l'Âge de l'Abondance ».
- **Le rendu** : lisse à facettes, façon *Last Day on Earth*, vue isométrique.
- **L'univers** : l'énergie se compte en Wh. La Compagnie d'électricité a pour mascotte **Watty**, une pile souriante
  (« Toujours plein, jamais à plat ! »).

**Tout ce que tu écris est en français** : code, commentaires, rapport.

## Périmètre strict

- Projet : `survival-realistic-zombie`.
- Tu n'écris **que** dans `batiment/<ton-id>/`, qui contient au minimum `modele.js`.
- Tu as le droit de lire partout. D'autres agents travaillent en parallèle dans les autres dossiers.
- **Ne modifie jamais** `batiment/commun/`, `batiment/catalogue.js`, `README.md` ni ce fichier. Si l'atelier commun
  te gêne, écris tes propres fonctions dans ton dossier et signale-le dans ton rapport.

- **Aucun fichier hors du projet, même temporaire** (pas de `/tmp`, pas de dossier système) : brouillons et copies vont dans `batiment/<ton-id>/`.

## À lire d'abord

1. **`batiment/README.md`** : le contrat d'un bâtiment, les conventions et le budget.
2. **`batiment/commun/atelier.js`** : `Chantier`, `Batiment`, `mur`, `fenetre`, `porte`, `toitDeuxPans`, la
   végétation, les ruines (gravats, débris, flaques, rais de lumière), les textures « monde » et `PALETTE`.
3. **Trois exemples aboutis, à lire pour la technique et le niveau de qualité attendu** :
   - `batiment/villa-milliardaire/modele.js` : une seule carte ;
   - `batiment/hopital/modele.js` : deux cartes, atlas d'enseignes, façades coupées à hauteur d'allège ;
   - `batiment/centrale-thermique/modele.js` : trois cartes ; tout est bâti dans un « repère du site » puis
     recentré sur chaque carte.
4. **Pour l'esprit du jeu** : `book/15-univers.md`, `book/18-direction-artistique.md` et `book/20-carte-du-monde.md`
   (lieux, ressources, danger). Pour les Éteints : `book/06-zombies.md` §5 (variantes : errant, rampant, putréfié,
   gelé, équipé, ancien habitant).

## Le contrat

- `batiment/<id>/modele.js` exporte :
  - `FICHE` : `id`, `nom`, `lieu`, `environnement`, `anneau`, `danger` (de 1 à 5), `recit` (2 à 3 phrases, ton du jeu,
    une pointe d'ironie sur l'Abondance), `inspiration`, `reperes` (la liste de ce qu'il faut regarder) ;
  - `creer({ usure = 0.7, carte })`, qui renvoie `b.construire()`.
- **Une seule carte** : donne `FICHE.lot` `{ l, p }` et `FICHE.depart` `{ x, z }`. **Plusieurs cartes** : donne
  `FICHE.cartes = [{ id, nom, lot, depart, description, entrees, fouille, eteints }]`.
- Les données de jeu :
  - `fouille` `[{ x, z, quoi }]` : des ressources cohérentes avec le Book 20 ;
  - `eteints` `[{ x, z, type }]` : leur nombre suit le danger ;
  - `entrees` `[{ x, z, nature }]`.
- **Lumières de nuit** : 2 à 5 avec `b.lumiere()`, 8 au plus par carte. Par exemple un feu de survivants, une lanterne,
  un néon de secours sur batterie, un écran de l'Abondance qui luit encore.
- `usure` va de 0,1 à 1. Elle dose les brèches, les vitres cassées, la végétation, les gravats et la rouille.

## Règles de modélisation

- **Échelle** : 1 unité = 1 m, personnage de 1,75 m, portes de 2,1 m au moins. +x à l'est, +z au sud. La caméra de
  jeu regarde depuis le **sud-est** : la façade principale est au sud ou à l'est.
- **On ne visite que le rez-de-chaussée, sol à y = 0.** Les étages, passerelles et clochers sont **visibles mais
  inaccessibles**. Ils vont dans des couches qui s'effacent (`b.couche(...)`), comme les toits. Les hauts de murs qui
  cachent l'intérieur vus du sud-est peuvent aussi passer en couche, ou les façades sud et est être coupées à hauteur
  d'allège (voir l'hôpital). **Pas de sol surélevé** dans les parties visitables, ou alors une rampe très douce.
- **Un lieu, c'est d'abord des endroits où jouer** : des intérieurs meublés et fouillables, plusieurs pièces, des
  recoins, des chemins. Le décor seul ne suffit pas (c'est ce qu'a reproché le porteur du projet au premier château,
  trop « parc »). Prévois plusieurs bâtiments ou pièces visitables par lieu.
- **Creuser sous y = 0** (bassin, falaise, quai) est possible avec `solPropre: true` dans la fiche ou la carte : tu fournis alors tout le sol du lot, et la visionneuse masque son terrain neutre. Les parties visitables restent à y = 0.
- **Budget par carte, à toutes les usures** : **≤ 60 000 triangles et ≤ 40 appels de dessin**. La visionneuse les
  compte en bas à droite et passe en rouge au-delà. Découpe en plusieurs cartes si nécessaire.
- **Économiser les appels de dessin** :
  - `matiere()` est déjà ramenée à 5 finitions ;
  - ne crée pas de `THREE.Material` neuf à chaque pièce ;
  - rassemble enseignes et affiches dans **une seule texture atlas** ;
  - chaque couche duplique ses matières : garde-en peu ;
  - `matiereLueur` est mise en cache par couleur et opacité : utilise une seule opacité pour tous les rais.
- **Pièges connus de l'atelier** :
  - `mur()` ne garde **qu'une ouverture par colonne de 0,4 m** : pour superposer une fenêtre d'étage à une fenêtre
    basse, monte le mur en bandes ;
  - le revêtement `interieur` va sur la face −z locale (+z local = extérieur, comme pour `fenetre()`) ;
  - `mur()` note ses obstacles en coordonnées brutes, sans tenir compte de `c.repere()` ;
  - `mur()` ne crée aucun obstacle pour un mur de moins de 1 m (un appui de fenêtre à 1 m se traverse) ; passe
    `seuilObstacle: 0.8` pour que les appuis bloquent (c'est ce que fait le gué) ;
  - le faîtage de `toitDeuxPans()` court sur toute la longueur, même au-dessus d'un trou.
- **Qualité** : le porteur du projet veut **faire rêver**. Soigne la composition, la silhouette, et le contraste entre
  la splendeur passée et la ruine. Pas de cubes génériques : moulures, corniches, encadrements, garde-corps, descentes
  d'eau, enseignes, structures métalliques. Reste malin sur les triangles : boîtes simples, cylindres à peu de côtés,
  textures pour le détail.
- **Couleurs** légèrement passées. Le rouge vif et les couleurs de l'Abondance sont réservés aux enseignes, aux
  affiches et au danger. **Ni sang, ni plaie.** Ne vise aucune personne, marque ou groupe réel.
- **Un détail absurde de l'Abondance** au moins (Book 15) : un objet connecté mort, une enseigne ridicule, un service
  premium disparu.

## Vérification (obligatoire)

- Le serveur tourne déjà : `http://localhost:8792/index.html?b=<id>`. Ne l'arrête pas et n'en lance pas d'autre.
- Utilise le navigateur intégré (outils `mcp__Claude_Browser__*`) dans **ton propre onglet** : `tabs_create`, puis
  `navigate` avec ce `tabId`. Ne touche jamais aux autres onglets, et ferme le tien à la fin.
- Paramètres d'adresse utiles :
  - `&carte=<id>` : choisir la carte ;
  - `&vue=jeu` : la vue de jeu ;
  - `&heure=nuit` : la nuit ;
  - `&toits=masques` : la coupe, pour voir l'intérieur ;
  - `&usure=1` : l'usure maximale ;
  - `&px=…&pz=…` : placer le personnage ;
  - `&fiche=non` : replier la fiche ;
  - `&cam=azimut,hauteur,distance,cx,cz` (en degrés et en mètres) : placer la caméra libre.
- Vérifie qu'il n'y a **aucune erreur** dans la console (`read_console_messages`). Il traîne parfois une vieille erreur
  404 de la visionneuse, sans rapport avec toi.
- Vérifie que le budget reste sous les plafonds, et prends des captures sous plusieurs angles : vue libre, vue de jeu
  au milieu des pièces, coupe, nuit. **Itère jusqu'à ce que ce soit beau et jouable.**

## Rapport final (court, en français)

- les cartes et leurs budgets mesurés (usure 0,1 / 0,7 / 1, triangles et appels) ;
- ce qu'on peut visiter ;
- les points forts visuels ;
- les limites connues ;
- ce qui gêne dans l'atelier commun.
