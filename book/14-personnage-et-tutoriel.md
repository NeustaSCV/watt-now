# Book 14 — Création de Personnage et Tutoriel

> Document de conception · version 0.2 · 2026-10-09
> Statut : **brouillon de travail**.

---

## 1. Les étapes de création

| Étape | Choix | Référence |
|---|---|---|
| 1 | **Famille** : 🔥 Charbonniers, ⚡ Voltaïques, ⚙️ Mécanistes | Book 01 §4 |
| 2 | **Points de stats libres**, dans les limites de la famille | §2 |
| 3 | **Apparence** | §3 |
| 4 | **Nom** | — |
| 5 | **Terrain** : un parmi trois tirés au hasard | Book 01 §6 bis |
| 6 | **Tutoriel** (première session), facultatif pour les anciens | §4 |

> À chaque nouveau cycle (Book 09), on recrée son personnage. On peut changer de famille.

---

## 2. Les points de stats libres

### 2.1 Le principe

Les stats partent de **10**, la famille applique ses modificateurs (**+3 / −3**, Book 01 §4), puis le joueur répartit des **points libres**. La liberté est réelle, mais **limitée par la famille**, pour que chaque famille garde son identité.

### 2.2 Proposition de règles

| Règle | Valeur |
|---|---|
| **Points libres** | **3 points** à répartir |
| **Échange** | On peut **baisser une stat de 1** pour gagner 1 point supplémentaire, **2 fois au maximum** |
| **Plafond par stat** | +2 au maximum par rapport à la valeur de famille |
| **Bornes absolues** | Aucune stat sous **7** ni au-dessus de **14** |
| **Identité de famille** | Une stat **pénalisée** par la famille ne peut pas remonter **au-dessus de 10**. On peut atténuer un défaut de famille, pas l'effacer. |

**Exemple : une Voltaïque**

| | FOR | END | DEX | PER | SAV | MET |
|---|---|---|---|---|---|---|
| Base | 10 | 10 | 10 | 10 | 10 | 10 |
| Famille | **8** | **9** | 10 | **11** | **12** | 10 |
| Points libres (3) | 8 | **10** | **11** | 11 | **13** | 10 |

Elle a remonté son END à 10 (plafond pour une stat pénalisée), gagné un point de DEX et de SAV. Elle reste une Voltaïque : faible en force, forte en savoir.

> **Équilibrage :** les points libres permettent de nuancer son personnage selon son style (Book 01 §7.3), sans créer de combinaison qui efface les faiblesses d'une famille.

---

## 3. L'apparence

- **Personnalisation complète** : corps, visage, peau, cheveux, pilosité, voix (pour les rares sons du personnage), âge apparent (adulte).
- **Vêtements de départ** sobres, cohérents avec l'univers, puis remplacés par ce que le joueur fabrique ou trouve (Book 12).
- **Skins de fidélité et de classement** (Book 09 §5.2) disponibles dès la création pour les anciens.
- **Aucun effet de jeu** : l'apparence est purement esthétique.

> **Décision (2026-10-08) : l'écran d'apparence de la 0a.** Juste après le pseudo et la famille, avant la création du compte : **silhouette** féminine ou masculine, **taille** (1,60 à 1,90 m), **corpulence** (mince à forte), **carnation** (6 teintes), **coiffure** (chignons, longs, raie sur le côté, courts, ras, crâne rasé), **couleur des cheveux** (6, dont gris pour l'âge), **barbe**. Aperçu 3D qu'on fait tourner, bouton « Au hasard ». La **tenue reste celle de la famille** : elle la fait reconnaître de loin (Book 18 §4.1). Les comptes d'avant gardent le personnage de référence de leur famille. Le visage, la pilosité fine et la voix viendront plus tard.

---

## 4. Le tutoriel : la première session

### 4.1 Objectifs

- **Familiariser** le joueur avec les commandes (Book 08 §3) et les systèmes de base, en le faisant **agir**, pas lire.
- **Durée :** ≈ 30 à 45 minutes réelles.
- **Se dérouler sur son vrai terrain** : rien n'est jetable, tout ce qu'il fait lui reste.
- **Facultatif** pour les joueurs qui ont déjà terminé un cycle.

### 4.2 Déroulé proposé

| Étape | Ce que fait le joueur | Ce qu'il apprend | Système |
|---|---|---|---|
| 1. **Arrivée** | Il arrive sur son terrain au petit matin, avec son kit de départ ; la consigne l'envoie **courir vers la ruine de ferme, à droite de l'écran** (le vélo y est caché) | Se déplacer, les **trois allures**, le **cercle de signature** | Book 08, Book 06 §3.3 |
| 2. **Ramasser** | Bois mort, pierres, branches | Interagir, inventaire, poids | Book 12 |
| 3. **Le feu** | Allumer un feu avec le briquet | Énergie thermique, **fumée = signature** | Book 01 §2 |
| 4. **L'eau** | Remplir une gourde, la faire bouillir | Eau potable, coût en bois | Book 02 §3, Book 05 |
| 5. **Le vestige** | Un vieux vélo rouillé sur le terrain : l'examiner, le démonter | Examiner, **usage direct ou démontage** | Book 02 §5, Book 03 §6 |
| 6. **L'outil** | Remmancher une hache trouvée | Réparer, qualité, durabilité | Book 02 §7 |
| 7. **L'abri** | Monter un abri de branches et de bâche | Construction, mode Construction | Book 10 |
| 8. **Le premier zombie** | Un errant isolé s'approche, attiré par la fumée | **Mode Combat**, viser la tête, l'endurance | Book 06 |
| 9. **La saisie** | Un second zombie l'attrape (scénarisé, sans danger réel) | **Se dégager** | Book 06 §2.3 |
| 10. **La famille** | Une tâche propre à sa famille (forge rudimentaire, branchement d'une batterie, pédalier) | Identité de famille | Book 01 §4 |
| 11. **La nuit** | La nuit tombe : dormir dans l'abri, près du feu | Sommeil, froid, lumière = signature la nuit | Book 05 §3 |
| 12. **La carte** | Au matin, ouvrir la carte, partir vers un lieu proche, revenir | Carte du monde, voyage, retour | Book 01 §2 bis |

> **En 0.8, la carte passe avant la famille** (§4.5) : l'ordre de la fin devient la saisie, **la carte**, **la famille**, la nuit.

### 4.3 Après le tutoriel

- **Le carnet** (Book 03 §5.5) prend le relais : il note ce que le joueur a appris et suggère des **objectifs** (« Construire une cabane avant l'hiver », « Trouver un livre de forge »). **Construit (2026-10-08) : voir Book 22** (« S'installer » et « Le métier » de chaque famille).
- **Les recettes pressenties** (Book 03 §5.1) guident vers la suite. *(0.7 : ce sont les silhouettes « À découvrir » du panneau Fabriquer, celles du prochain palier, §4.4. 0.8 : le niveau suivant des constructions qu'on possède, et l'indice « où chercher » de sa clé, Book 03 §5.8.)*
- **Aide contextuelle** discrète la première fois qu'un système apparaît (première pluie, première infection, première halte).
- **L'aide du jeu** (demande du porteur, 2026-10-08) : menu ⚙ → ❓ Aide, pour le joueur perdu. Elle compte 19 rubriques repliables : premiers pas, commandes, écran, besoins, partir et revenir, manger et boire, récolter, fabriquer, feu, nuit et pluie, terrain, Éteints, combat, blessures, voyager, wotts et Comptoir, carnet, familles, « Je suis coincé ». **Elle explique les mécanismes, jamais les solutions** : aucune liste de recettes, aucun lieu d'objet rare, aucun chiffre fin (dégâts, butins, probabilités), rien sur la grande quête ni sur un lieu pas encore livré. Les touches citées sont celles du joueur (ou ses boutons sur téléphone). Le texte est dans `code/client/src/aide-contenu.ts`. **À tenir à jour à chaque version** : une mécanique livrée a sa place dans l'aide.
  - **En 0.7** : « Fabriquer » dit que les recettes viennent quand on y pense (le message « Tu y penses », la pastille, « À découvrir ») ; « Je suis coincé » répond à la recette qui ne vient pas (ramasser, explorer, dormir, aller au Comptoir ; et le filet du temps) ; une rubrique nouvelle, « Les déchets de l'Abondance » (tout se ramasse, presque rien ne vaut, les conteneurs se fouillent, le Comptoir refuse les ordures).

### 4.4 Le tutoriel et l'arbre de progression (0.7, 2026-10-09)

Depuis la 0.7, les recettes ne s'affichent dans Fabriquer qu'une fois **dévoilées**, quand le personnage y pense (Book 02 §14 quater, Book 03 §5.7). Le tutoriel est le premier fil de cet arbre ; **ses textes ne changent pas**.

- **Au départ, deux cartes** : le feu de camp et l'abri. Le premier clic sur Fabriquer n'est plus une liste de cent lignes.
- **Le tutoriel ne demande jamais une recette invisible** : chaque étape qui fait fabriquer la dévoile en arrivant, si son déclencheur naturel ne l'a pas déjà fait. Étape 3 « Le feu » : le feu de camp ; étape 6 « L'outil » : remmancher la hache ; étape 7 « L'abri » : l'abri ; étape 10 « La famille » : l'atelier de la famille (foyer de forge, banc solaire, pédalier générateur).
- **Le métier commence pile à l'étape « La famille »** (décision Q9) : le seuil du métier, c'est l'abri posé et un premier danger surmonté. Pendant le tutoriel, l'Éteint scénarisé de l'étape 8 ne compte pas (il ferait tomber le seuil deux étapes trop tôt) ; une nuit dormie, si. Le message est un peu plus solennel : « Ton métier commence : le foyer de forge t'attend dans Fabriquer. »
- **Ce que le joueur vit dévoile la suite** : les joncs ramassés font penser à la ficelle et à la corde, le premier feu au gourdin (« la fumée se sent de loin »), la tête de hache trouvée à son manche.
- **Le vétéran qui saute le tutoriel** (§4.1, facultatif), et tout compte créé sans tutoriel, a d'emblée les **paliers 1 et 2** : les gestes du corps (feu, abri, lit, cuisine, eau de pluie…) et de l'abri du danger (outils, armes simples, alarme, soins, coffre, travois). Il connaît le début ; on ne lui fait pas refaire la cueillette pour voir le gourdin (décision Q8).
- **Le filet du temps** : au plus tard après 20 min de jeu, tout le palier 1 ; après 1 h, tout le palier 2 ; après 2 h, le métier. Personne ne reste bloqué parce qu'il n'a pas vécu la bonne scène.
- **Le rythme mesuré** (`npm run rythme`) : un élève du tutoriel a 15 à 24 nouveautés (recettes ou étapes) dans sa première demi-heure, jamais plus de 4,5 min sans rien.

### 4.5 La carte avant la famille (0.8, 2026-10-10)

*Plan 0.8 §2.6 et chantier 13 (décisions V5-2, Q-0.8-15, Q-0.8-18, B14). **Décidé ; en cours de codage** (chantier 13) : ce paragraphe dit ce que le plan décide, il sera relu sur le jeu livré.*

Depuis la 0.8, la base grandit **avec les sorties** (Book 24 §12), et chaque famille trouve **la pièce de son premier meuble** à la station-service (H1A). Le tutoriel suit : **« La carte » passe avant « La famille »**.

| Étape | Ce que fait le joueur (0.8) |
|---|---|
| 1 à 9 | Inchangées : l'arrivée, ramasser, le feu, l'eau, le vestige, l'outil, l'abri, le premier Éteint, la saisie |
| 10. **La carte** | Ouvrir la carte, partir à **la station-service**, y trouver **la pièce de sa famille** (⚡ le panneau, 🔥 l'enclume de dépanneur et son sac de charbon, ⚙️ le petit alternateur), garantie et **à soi**, et du bois (le tas de bois de chauffage derrière l'atelier) ; revenir |
| 11. **La famille** | **Au retour**, avec la pièce : « Pose le panneau sur ton banc… », « Cale l'enclume près de ta forge… », « Monte l'alternateur sur le vélo de la ruine… ». Bâtir son **premier meuble de famille** (banc solaire, foyer de forge, pédalier générateur) et faire son premier geste (brancher, forger un couteau, pédaler). C'est le **seuil du métier** |
| 12. **La nuit** | La première nuit se passe **avec le premier meuble de famille** |

- **Pourquoi** : la sortie 1 du parcours visé (25 à 50 min de jeu) est la station ; « La famille » au retour donne à la première sortie un but qu'on rapporte.
- **La première nuit** (B14) : la consigne conseille les **branches** au feu. Si l'on met une **bûche** au feu du terrain alors qu'il en reste **moins de 6**, un avertissement : « Une bûche ne repousse pas : garde-la pour bâtir. » C'est un **bandeau** dans la charte du carnet, qui **se ferme d'un bouton** (« Compris »), jamais une fenêtre à croix ; une fois par nuit au plus ; jamais au feu d'une halte.
- **Le vétéran qui saute le tutoriel** reçoit d'emblée les recettes communes **à la main** ; il doit quand même aller à la station chercher sa pièce, et le carnet le lui dit : « Ta famille t'attend à la station. » (Q-0.8-15, déjà codé).
- **Le tutoriel ne demande jamais une recette invisible** (§4.4) : les recettes liées à une construction viennent avec la construction (Book 02 §14 quinquies).
- **Le carnet prend le relais** avec « S'installer » en **portes successives** (Book 22 §3.1 bis).
- **À vérifier au test** (chantier 14) : la première sortie avant 60 min ; chaque famille finit le tutoriel seule en passant par la station.

---

## 5. Questions ouvertes

- [ ] **Points libres :** valider 3 points + 2 échanges, et les bornes.
- [ ] **Tutoriel :** valider le déroulé ; faut-il une courte mise en scène d'introduction (univers, Book 15) ?
- [x] **Saisie scénarisée :** ✅ **sans danger réel** (validé, 2026-10-08) : l'Éteint lâche prise tout seul si le joueur n'y arrive pas. On apprend le geste, on ne punit pas dès la première session.
- [ ] **Âge et apparence :** quelles limites pour rester cohérent avec un univers réaliste ?
