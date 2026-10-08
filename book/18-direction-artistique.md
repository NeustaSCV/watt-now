# Book 18 — Direction Artistique

> Document de conception · version 0.1 · 2026-10-07
> Statut : **en cours d'exploration** (maquettes).

---

## 1. Références

| Référence | Ce qu'on en retient |
|---|---|
| ***Last Day on Earth*** | Vue isométrique, lisibilité, structure en petites maps. Le jeu en est volontairement proche dans le style graphique. |
| ***Fallout*** | L'univers : rétro-futurisme ironique, rouille, humour noir, objets d'une époque révolue tournés en dérision |
| ***Idiocracy*** | Le ton (Book 15) : l'absurde des vestiges de l'Âge de l'Abondance |

**Notre patte :** l'énergie se voit partout (panneaux, câbles, fumée, lumières), et la **lumière est une mécanique** : ce qui éclaire attire les Éteints (Book 06).

---

## 2. Rendu du monde (décidé)

- **3D isométrique** (Book 19 §7), **style lisse, proche de *Last Day on Earth*** : modèles simples, pas de pixels visibles, couleurs franches le jour.
- **Éclairage de nuit dynamique** (repris de l'exploration « pixel fin, nuit éclairée ») :
  - la nuit, le monde est plongé dans une pénombre bleutée ;
  - **seules les sources de lumière éclairent** : feu de camp, fenêtres, lampes ;
  - chaque source a sa **couleur** (feu orangé, fenêtre jaune chaud, lampe électrique blanc froid) ;
  - ce qui éclaire se voit de loin et **augmente la signature lumineuse** (Book 01 §2, Book 06 §3.2). La lumière est belle et dangereuse.

**Règles d'éclairage (validées sur prototype) :**

- **Nuit « américaine »** : la nuit est **bleutée mais assez claire** pour toujours lire le décor et les silhouettes. La lune éclaire faiblement et donne des ombres douces. Les lumières artificielles restent nettement plus chaudes et plus vives.
- **Le jour, seules les ombres du soleil existent** : les lumières artificielles (feu, poêle, forge, lampes) **ne projettent pas d'ombre** en plein jour. Elles ne le font que la nuit ou dans un intérieur sombre. (C'est aussi une économie de calcul.)

| Source | Couleur | Particularité |
|---|---|---|
| Feu de camp, forge | Orangé chaud | Grande portée, vacille |
| Fenêtre éclairée | Jaune chaud | Révèle la maison la nuit |
| Torche (🔥) | Orangé | Portée moyenne |
| Lampe électrique (⚡) | **Blanc froid** | Signature d'une famille qui a du courant |
| Lanterne, lampe à dynamo (⚙️) | Jaune doux | Faible portée |

---

## 3. Interface (proposition à valider)

**Une interface par famille**, qui affiche les mêmes informations avec un habillage différent :

| Famille | Habillage | Typographie | Couleurs |
|---|---|---|---|
| 🔥 **Charbonniers** | **Plaques de métal rivetées** | Condensée, industrielle | Fonte sombre, laiton, braise |
| ⚡ **Voltaïques** | **Terminal ambre** : l'appareil des Compteurs, bricolé | Chasse fixe | Ambre sur noir |
| ⚙️ **Mécanistes** | **Carnet du bricoleur**, écrit à la main | Manuscrite | Papier, encre bleue |

**L'affiche de l'Abondance** (rétro publicitaire, ironique) sert pour les **menus**, les **écrans de chargement**, l'interface des **comptoirs** des Compteurs, et les **affiches** trouvées dans les ruines.

### Contenu de l'écran de jeu

| Zone | Contenu |
|---|---|
| Haut gauche | Jauges : faim, eau, chaleur, santé |
| Haut droite | Wotts, saison et année, heure, météo, signature actuelle |
| Bas gauche (mobile) | Joystick |
| Bas droite | Boutons A, B, Mode, Objet rapide (Book 08 §3) |
| Au sol | **Cercle de signature** autour du joueur |

> **Décision (2026-10-08) : un écran dégagé sur téléphone.** Les réglages (Commandes, Son, Qualité, Quitter) sont rangés dans un petit menu derrière une **roue dentée ⚙**, en haut à droite ; restent visibles les raccourcis Sac, Fabriquer, Carte. Le **carnet** des objectifs (Book 22) se replie en un petit onglet « 📓 Carnet · 3 objectifs » : replié d'office sur un téléphone, ouvert sur ordinateur, et le choix du joueur est gardé.

---

## 4. Personnages (décidé)

| Élément | Règle |
|---|---|
| **Proportions** | **≈ 4,8 têtes** de haut : assez trapu pour rester lisible sur téléphone, assez proportionné pour garder un ton sérieux |
| **Lisibilité** | Chaque famille se reconnaît **à sa silhouette** avant ses couleurs : casquette, tablier et marteau (🔥) ; lampe frontale, câble et bande réfléchissante (⚡) ; chapeau de paille, hotte et fourche (⚙️) |
| **Éteints** | Toujours reconnaissables à trois signes : **bras tendus, peau gris-vert, yeux blancs**. Les variantes (équipé, rampant…) se lisent à leur silhouette. |
| **Diversité** | Survivants de toutes origines (Book 15) : variété de teintes de peau, d'âges adultes et de morphologies |

### 4.2 Personnages en 3D *low poly* (décidé)

| Règle | Détail |
|---|---|
| **Technique** | Modèles 3D simples, **un squelette commun** à tous les humains (survivants et Éteints) |
| **Variantes** | Vêtements et accessoires sont des **pièces** qu'on assemble : famille, saison, saleté, outil tenu |
| **Animations** | **Une bibliothèque partagée** (marcher, courir, frapper, porter, se baisser…). Les Éteints ont leurs propres démarches (bras tendus, pas traînants) |
| **Source de lumière portée** | Torche (🔥), lampe frontale (⚡), lanterne (⚙️) : elle bouge avec le personnage et éclaire le décor |
| **Finesse** | Le prototype valide le principe ; les vrais modèles seront plus fins (proportions des fiches §4.1, visages, mains) |
| **Phase 0** | Modèles libres de droits (*low poly*, déjà animés) en attendant les vrais |

### 4.3 Le bestiaire des Éteints en 3D (décidé)

Même squelette que les survivants (§4.2). Toujours : **bras tendus, peau gris-vert, yeux blancs** (§4).

| Variante (Book 06 §5) | Signes visuels | Démarche |
|---|---|---|
| **Errant** | Vêtements délavés et déchirés | Traînante, tête penchée |
| **Rampant** | Au ras du sol, se tire avec les bras | Se confond avec les herbes hautes |
| **Putréfié** | Plus maigre, peau verdâtre, côtes visibles, **mouches** | Plus penché, plus lent |
| **Gelé** | Peau bleutée, **givre** et stalactites | Raide, presque immobile, tremblements |
| **Équipé** | Casque de moto, veste de cuir | Comme l'errant |
| **Ancien habitant** (ex. infirmière) | Tenue de métier, **objet de métier visible** (trousse à croix rouge) | Comme l'errant ; on voit ce qu'il porte à récupérer |

> En hiver, **contours marqués** pour tous les Éteints (§5).

### 4.1 Les trois personnages de référence

Ils servent de modèles pour le style, le niveau de détail et la lisibilité. Chaque accessoire a une raison d'être dans le jeu.

| | 🔥 **Nadia, Charbonnière** | ⚡ **Malik, Voltaïque** | ⚙️ **Rose, Mécaniste** |
|---|---|---|---|
| **Qui** | Forgeronne, ancienne chaudronnière | Ancien monteur de lignes de la **Compagnie d'électricité** | Maraîchère à la retraite, n'a jamais eu besoin du réseau |
| **Silhouette** | Tablier de cuir, bandana, lunettes de soudeur relevées | Lampe frontale, câble en bandoulière, batterie dans le dos | Chapeau de paille, hotte en osier |

> **Coiffures et couvre-chefs (2026-10-08).**
> - **Chaque coupe est ajustée à la tête qui la porte.** Les coupes du pack sont modelées pour une tête de femme ou une tête d'homme. Posées sur l'autre, elles laissaient le crâne nu, d'où les Voltaïques « chauves » et la coupe « Ras » qui faisait une calvitie. Le jeu les recale maintenant sur la tête : même sommet, mêmes proportions.
> - **Sous le chapeau de paille** (⚙️), les cheveux au-dessus du bord ne sont plus dessinés : ils traversaient la calotte. Ce qui tombe dessous reste visible (cheveux longs, chignon).
> - **Les Voltaïques n'ont pas de chapeau**, c'est voulu : leur marque est la lampe frontale.
> - La planche de mise au point `client/coiffures.html` montre les 3 familles × 2 silhouettes × 6 coupes.
| **Équipement** | Marteau, pince à forger, gros gants (aussi contre les morsures), bottes ressemelées | Multimètre, sacoche et tournevis, lunettes rondes, chaussures coquées | Fourche-bêche (ne retourne pas le sol), sécateur, tablier à graines, bottes en caoutchouc |
| **Après une journée** | Suie sur le visage, les bras et le tablier | Poussière, égratignure, manche déchirée, pansement | Terre aux genoux et aux mains, hotte pleine |
| **En hiver** | Manteau de laine, bonnet, écharpe | Doudoune chauffée sur batterie (fils orange) | Pèlerine de laine, bonnet, mitaines |
| **Couleurs dominantes** | Rouille, cuir, laiton | Bleu de travail, jaune réfléchissant, orange câble | Paille, vert laine, toile écrue |

**Règles qui en découlent :**

- **L'état du personnage se voit sur lui** : saleté (hygiène, Book 05 §3), blessures, saison (Book 12).
- **Âges et origines variés** : un adulte jeune, une adulte, une personne âgée ; trois teintes de peau (Book 15).
- **À l'échelle du jeu**, chaque personnage reste reconnaissable à sa silhouette.

## 5. Palettes de saison (décidé)

| Saison | Sol et végétation | Ciel et ambiance | Lien avec le jeu |
|---|---|---|---|
| **Printemps** | Vert tendre, arbres en fleurs, terre humide et sombre | Clair | Dégel, hordes en marche (Book 06 §7) |
| **Été** | Herbe jaunie, terre sèche et claire | Lumière crue, brume de chaleur | Sécheresse, canicule (Book 13) |
| **Automne** | Roux, feuilles au sol | Couvert, pluie | La pluie atténue la signature : saison d'expédition |
| **Hiver** | Sol blanc bleuté, arbres nus, toits enneigés | Froid, neige | Fumée plus visible ; traces de pas ; Éteints gelés (givre, teinte froide) |

**Règle de lisibilité :** en hiver, les Éteints gardent des **contours marqués**, pour ne jamais se fondre dans la neige.

## 6. La charte de l'affiche de l'Abondance (décidé)

### 6.1 Watty, la mascotte

- **Watty** était la mascotte de la compagnie d'énergie de l'Âge de l'Abondance : une **pile souriante**, clin d'œil, éclair rouge sur le ventre, une prise à la main, chaussures rouges.
- Il joue le rôle que tient le Vault Boy dans *Fallout*, mais il est **conçu pour s'en distinguer** : un objet de l'énergie facile, pas un bonhomme.
- Son slogan, « Toujours plein, jamais à plat ! », est ironique dans un monde de **wotts plats** (Book 07 §3.3).

### 6.2 Les affiches

| Époque | Aspect | Usage |
|---|---|---|
| **Neuve** (Âge de l'Abondance) | Papier crème, bandeau rouge, typographie massive, Watty | Menus, écrans hors jeu, objets de collection (Book 09 §5.1) |
| **En ruine** | Délavée, tachée, déchirée, **corrigée au feutre par les survivants** (« Watty ment ! », « réfléchis, toi ») | Décor des ruines : raconter l'univers sans texte d'explication |

### 6.3 Typographie et couleurs

| Rôle | Choix |
|---|---|
| Titres | Typographie massive, style publicitaire rétro |
| Textes des Compteurs | Typographie de machine à écrire |
| Graffitis des survivants | Feutre, écriture à la main |
| Couleurs | Papier crème, rouge publicitaire, brun d'encre, bleu canard, ocre |

### 6.4 Les slogans

| L'Abondance (ironique) | Les Compteurs (sobres et utiles) |
|---|---|
| Pourquoi réfléchir quand on peut brancher ? | Un wott dépensé est un wott perdu. |
| Ne pensez plus, on s'occupe de tout. | Comptez vos wotts, ils comptent sur vous. |
| Votre frigo vous aime. | La pluie couvre le bruit de votre forge. |
| Watty, toujours plein, jamais à plat ! | Un bon frais vaut mieux que deux plats. |

### 6.5 Les écrans hors jeu

- **Menu principal** dans le style de l'affiche : titre *Watt Now?*, boutons Jouer, Classements, Réglages, tampon « Vérifié par les Compteurs ».
- **Écran de chargement** : la barre de progression est une **batterie qui se charge**, accompagnée d'un **conseil des Compteurs** qui rappelle une règle du jeu.
- **Aucun élément lié à l'argent réel** (dons, achats) n'apparaît tant que ce sujet n'est pas ouvert (Book 08 §1).

## 6 bis. La carte du monde

Illustrée à la main, façon **vieil atlas régional annoté par les survivants**, avec des frontières naturelles entre environnements (Book 20 §1 bis). Les prototypes en secteurs ne servent qu'à valider l'organisation.

## 7. Questions ouvertes

- [ ] **Interfaces par famille :** valider la correspondance proposée.
- [x] **Proportions des personnages :** ✅ **≈ 4,8 têtes**, entre le trapu façon *Last Day on Earth* et l'intermédiaire (§4).
- [x] **Personnages de référence :** ✅ Nadia, Malik et Rose (§4.1).
- [x] **Bestiaire des Éteints :** ✅ validé (§4.3).
- [x] **Personnages :** ✅ **modèles 3D simples (*low poly*)**, validés sur prototype, à affiner (§4.2).
- [x] **Palettes de saison :** ✅ validées (§5).
- [x] **Charte de l'affiche de l'Abondance :** ✅ validée (§6).
