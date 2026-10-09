# Book 99 — Évolutions futures

> Document de conception · version 0.1 · 2026-10-07
> Ce book consigne les idées **validées dans leur principe mais reportées** après la première version du jeu (V1). Rien de ce qui est décrit ici ne fait partie de la V1.

---

## Règles de ce book

- Une idée entre ici quand on décide de la **reporter**, pas de l'abandonner.
- Chaque idée note les **points d'accroche** déjà présents dans la V1 : ce qui a été prévu pour qu'elle puisse s'ajouter sans tout refaire.
- Une idée ne sort d'ici que lorsque la V1 est **stable et équilibrée** sur les systèmes qu'elle touche.

---

## Version 2

### V2.1 — Les Trois Sangs

**Statut :** reporté en V2 (décision du 2026-10-07).

#### Le concept

Une **seconde couche de création de personnage**, indépendante de la famille : le rapport du personnage au virus des zombies. Chaque joueur choisirait une famille (🔥 ⚡ ⚙️) **et** un sang, soit 9 combinaisons.

| | 🩸 **Les Sains** | 🧟 **Les Porteurs** | 🛡️ **Les Immuns** |
|---|---|---|---|
| **Statut** | Jamais infectés | Survivants de la fièvre grise, **stabilisés** | Naturellement immunisés contre la fièvre grise |
| **Atout** | Pleine capacité physique ; **confiance des PNJ** (commerce, quêtes, recrutement) | Odeur proche de celle des zombies : **les zombies réagissent moins à eux** (infiltration, fouille des zones denses) | **Une morsure ne leur transmet pas la fièvre grise** : corps à corps sans crainte de l'infection propre aux zombies |
| **Faiblesse** | La fièvre grise reste un vrai danger : prudence obligatoire | **Dépendance à un sérum** à fabriquer, qui se conserve **au froid** (dépense d'énergie constante, Wh_é) ; **méfiance des PNJ** (prix plus élevés, accès limité à certains comptoirs) | **Système immunitaire affaibli** face à tout le reste : infections de plaies, intoxications, maladies (Book 05) |
| **Style de jeu** | Social, commerçant | Infiltré, pilleur de zones denses | Nettoyeur, très dépendant des soins |

#### Points d'accroche déjà présents en V1

| Système V1 | Ce qui est prêt | Où |
|---|---|---|
| **Fièvre grise** | Infection propre aux zombies, transmise par morsure, dont on peut guérir. Pendant la fièvre, les zombies réagissent moins au malade. | Book 06 §10 |
| **Odeur des morts** | Validé en V1 : se couvrir de leurs fluides pour passer inaperçu. En V2, cette capacité deviendrait naturelle chez les Porteurs. | Book 06 §8.5 |
| **Perception des zombies** | La jauge d'attention accepte des modificateurs d'odeur par personnage | Book 06 §3 |
| **Infection et maladies** | Le risque d'infection est un calcul multiplicatif : un modificateur « immunité affaiblie » s'y ajoute facilement | Book 05 §5 |
| **Froid médical** | La réfrigération des médicaments existe déjà (domaine ⚡). Le sérum des Porteurs s'y appuierait. | Book 05 §7.3 |
| **Comptoirs et PNJ** | Prix et services des comptoirs, rôles des PNJ. La méfiance envers les Porteurs se traduirait par des prix modulés. | Book 01 §2 ter, §6 |
| **Budget de traits** | Méthode « signature +6, atout +3, handicap majeur −5, handicap mineur −4 » réutilisable | Book 01 §7.1 |

#### Exigences d'équilibrage pour la V2

1. **Indépendance :** le sang ne doit renforcer aucune famille plus qu'une autre. Les 9 combinaisons doivent rester jouables, avec le même critère que la V1 : écart ≤ ±5 % sur la journée type (Book 01 §7.2).
2. **Budget nul :** chaque sang a une valeur nette de 0 point, comme les familles.
3. **Pas de combinaison dominante :** vérifier en particulier les associations à risque :
   - **Voltaïque + Porteur** : discrétion électrique + odeur trompeuse = infiltration peut-être trop facile ;
   - **Charbonnier + Porteur** : la signature forte des Charbonniers compensée par l'odeur de Porteur ;
   - **Immun + combattant** : nettoyage de zones sans risque de fièvre grise.
4. **Rétrocompatibilité :** les personnages créés en V1 deviennent **Sains** par défaut. On pourra leur proposer un choix unique de sang, ou la possibilité de devenir Porteur en survivant à une fièvre grise grave.

#### Questions à trancher le moment venu

- [ ] Le sang se choisit-il à la création, ou s'acquiert-il en jeu (un Sain qui survit à une fièvre grise grave devient-il Porteur) ?
- [ ] Le sérum des Porteurs : quelle recette, quelle fréquence, que se passe-t-il en cas de manque ?
- [ ] Comment rendre la méfiance des PNJ envers les Porteurs **lisible** sans système de réputation (en suspens en V1) ?
- [ ] Faut-il que les Immuns aient une fenêtre de vulnérabilité réelle aux zombies, pour ne pas devenir des nettoyeurs sans risque ?

---

## À définir plus tard (V1 ou au-delà)

### Groupes et communautés

**Statut :** nécessaire, à définir ultérieurement (décision du 2026-10-07).

Aujourd'hui, le seul lien entre joueurs est l'**amitié** (accès au terrain, combat désactivé, Book 01 §6 bis). Il faudra définir :

- des **groupes** ou **clans** : nom, emblème, membres, rôles ;
- des **projets communs** (grands chantiers, fonte au bas fourneau, Book 04 §2.5 ; construction collective, Book 10 §10) et le partage du rayonnement (Book 09 §3) ;
- la possibilité de **terrains voisins** ou d'un **espace commun** ;
- des **outils de communication** (radio, Book 07 §6.2 ; tableau d'affichage au comptoir) ;
- un éventuel **classement de groupe**.

**Points d'accroche déjà présents :** amitié et niveaux de confiance (Book 01 §6 bis), commandes artisanales et escortes (Book 07 §5), soins mutuels (Book 05 §8.3), fonte collective (Book 04 §2.5).

---

## Pistes non encore classées

### L'équilibre des espèces (porteur du projet, 2026-10-08)

- **Les armes de jet** (arc, arbalète) rendront chassables les **lapins** et les **renards**, aujourd'hui trop rapides pour les outils de contact.
- **Chasser a un prix écologique** :
  - tuer les renards fait **proliférer les lapins**, qui apportent des **maladies** (myxomatose, tularémie) ;
  - moins de renards, c'est aussi plus de **rongeurs**, donc plus de **tiques** et de **maladie de Lyme**.
- **Points d'accroche** :
  - la faune du terrain (Book 11 §10) ;
  - les maladies (Book 05 §6) ;
  - le calendrier des saisons (Book 13).
- **À prévoir** : faire vivre les lapins et les renards par le serveur, comme la volaille, et suivre leurs effectifs.

### La bibliothèque de bâtiments urbex et de haltes (porteur du projet, 2026-10-09)

- **Ce qui existe** : une session dédiée a livré, dans `batiment/` (voir `batiment/LIVRAISON.md` et `batiment/README.md`), **21 bâtiments urbex** (villa du milliardaire, château, hôpital, centrale thermique, gare, siège de la Compagnie, théâtre, Grand Hôtel, église, mine, sanatoriums, médiathèque, aciérie, phare, Galerie de l'Abondance, Wattyland, usine chimique, château d'eau, moulin, piscine Art déco) et **14 haltes** (aire d'autoroute, grand bouchon, tunnel, péage, col, passage à niveau, gué, Superchargeurs Watty…). Statut : **à valider** par le porteur ; rien n'est encore branché dans le jeu ni commité.
- **Format** : modules three.js procéduraux (`batiment/<id>/modele.js`, fonction `creer({ usure, carte })`), avec leurs points de fouille, d'apparition des Éteints, entrées, obstacles, toits estompables (`estomperToits` de `client/src/rendu/halte.ts`) et lumières de nuit (8 au plus). Budget : 60 000 triangles et 40 appels de dessin par carte.
- **Points d'accroche** :
  - les lieux de la carte du monde (Book 20) et le modèle du terrain (Book 19) ;
  - la couche de déchets (Book 26) : les points de `fouille` de chaque carte deviennent des conteneurs ;
  - la zone contaminée de l'usine chimique (champ `zones`) et la santé (Book 05) ;
  - le mode mesure `?mesure=1` pour vérifier chaque lieu sur l'iPhone 13 mini.
- **À prévoir à l'intégration** : un alias Vite `three` vers `code/node_modules/three` et `server.fs.allow` sur `batiment/` (ou une copie dans `code/`) ; une construction derrière un écran de chargement (50 à 800 ms) ; les règles de jeu de certains passages (ramper sous la citerne, passerelle, barrière payante du péage, bac du gué) ; les petites marches ; l'aire du Bois-Joli, volontairement crue, à revoir pour un jeu familial.
