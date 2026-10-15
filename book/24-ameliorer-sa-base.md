# Book 24 — Améliorer sa base

> Document de conception · version 0.3 · 2026-10-08
> Statut : **validé dans ses grandes lignes** par le porteur du projet (« tout ça est cohérent », 2026-10-08). Les six recommandations des questions ouvertes sont retenues. **Lots 0 et 1 codés, lot 2 en partie** (couchage, eau 1 à 2, coffre) : voir §11.
> **0.8 (2026-10-10)** : les lignées vont jusqu'au **niveau 1**, chaque niveau au-delà de la maison avec sa **clé** trouvée dehors ; la citerne et le lit de branchages disparaissent ; l'établi, le râtelier et la torche plantée arrivent : voir **§12**, qui fait foi.
> **0.10 (2026-10-15)** : les lignées vont jusqu'au **niveau 2** (les dix meubles et leurs objets-clés, faits de récupération), **plus aucun repli**, les étagères, les deux meubles nouveaux pour tous (le cuiseur solaire, les bacs de tri), **le banc solaire qui suit le soleil** : voir **§14**, qui fait foi.
> Demande du porteur : « faire évoluer les éléments existants (je pense au feu notamment, pour éviter d'avoir 50 places à feu dans la base) », et ajouter de nouveaux éléments à fabriquer pour la base.
> S'appuie sur les books [02](02-crafting.md) (§8 installations, §10 démontage, §14 bis bushcraft), [03](03-bibliotheque-et-savoir.md) (§5 savoir), [04](04-siderurgie-et-chimie.md), [06](06-zombies.md) (signature), [10](10-construction.md) (abri, chauffage), [11](11-agriculture-elevage-alimentation.md) (§11 conservation), [19](19-modele-du-terrain.md) (emprises), [21](21-perimetre-phase-0.md) (0a, 0b), [22](22-quetes-et-objectifs.md) (carnet) et sur la proposition P-002 (`PROPOSITIONS.md`, gamme bushcraft et ses « évolutions »).

---

## 1. Le constat, à partir du code (version 0.5 en préparation)

### 1.1 Ce qu'on peut poser aujourd'hui

| Installation | Coût | Rôle réel dans le code | Famille |
|---|---|---|---|
| **Feu de camp** | 5 pierres, 3 branches | Cuire les plats (`feu: true`), bouillir la gourde (0,45 kg de bois par litre), rôtir, lumière la nuit (45 m) et odeur (35 m). Brûle 1,5 kg de bois par heure de jeu, 10 kg au plus | Tous |
| **Foyer Dakota** | 3 branches, Creuser 1 | Le même feu, mais bois ×0,6, lumière ×0,3, odeur ×0,4 | Tous |
| **Abri** | 8 branches, 1 bâche | Dormir (repos ×2), nuit complète si l'on se déconnecte à moins de 3 m | Tous |
| **Lit de branchages** | 6 branches | Sommeil ×1,3 ; **ne vaut un vrai lit que s'il est à moins de 3 m d'un abri** | Tous (petite installation) |
| **Coffre** | 4 bûches, 4 branches, 1 corde | Garde 150 kg. Plein : « construis-en un autre » | Tous |
| **Récupérateur de pluie** | 1 bâche, 4 branches, 1 corde | 5 L au plus, eau potable, se remplit hors ligne | Tous |
| **Alarme à boîtes** | 2 boîtes vides, 1 ficelle, 2 branches | Tinte quand un Éteint passe à 2,5 m, et l'attire | Tous (petite installation) |
| **Escabeau** | 2 bûches, 6 branches, 1 corde | Se porte ; cueillir dans les arbres | Tous |
| **Établi** | 4 bûches, 6 branches | **Aucun** : aucune recette ne le demande | Tous |
| **Charbonnière** | 10 bûches, 4 branches | 4 kg de charbon en 3 jours de jeu, puis **disparaît** au défournement | 🔥 |
| **Foyer de forge** | 8 pierres, 1 barre de métal, 2 branches | Forger une lame. Ne brûle rien, n'émet rien, ne compte pas comme un feu | 🔥 |
| **Pédalier** (+ meule, + dynamo) | Vélo, 2 bûches | Affûter, charger une batterie. **Ses accessoires se montent sur place** (`etat.meule`, `etat.dynamo`) | ⚙️ |
| **Banc de recharge**, **panneau solaire** (un seul meuble en 0.8 : le banc solaire) | — | Électricité (É4) | ⚡ |
| **Décharge** | Fixe | Fait remonter des objets | — |

### 1.2 Pourquoi la base devient un champ de foyers

1. **Aucune installation ne s'améliore.** Pour faire mieux, on pose autre chose à côté. Le seul précédent d'évolution sur place est le pédalier (meule, dynamo) : c'est le bon modèle, il marche.
2. **Rien ne se démonte.** Un feu, un abri, un coffre posés restent pour toujours (seule la charbonnière s'efface au défournement). Le code plafonne les feux à **3 par terrain** (`MAX_FEUX`, dans `serveur/src/joueur.ts`, cité par aucun book) : le joueur qui a monté trois feux de camp ne peut **plus jamais** creuser de foyer Dakota, alors que le carnet le lui demande (objectif 5, « Un feu qui ne se voit pas »).
3. **Le carnet pousse à empiler.** L'objectif Dakota fait creuser un deuxième foyer au lieu de transformer le premier ; l'objectif « Un vrai lit » fait poser un lit **à côté** de l'abri pour qu'ils comptent ensemble.
4. **Les fonctions sont éparpillées.** Le feu cuit, mais la forge, qui brûle à 900 °C, ne fait pas bouillir un litre d'eau. Le coffre plein appelle un deuxième coffre. Chaque futur besoin (fumer, sécher, cuire au four, chauffer la cabane en 0b) ajouterait une installation de plus.
5. **Ce qui limite déjà, sans qu'on le voie.** Chaque feu allumé s'**additionne** dans le tirage des Éteints (`tirerApparition` : somme de intensité × portée). Trois feux allumés, c'est trois fois plus d'attrait. Le joueur ne le sait pas.

---

## 2. Le principe : une place, qui grandit

### 2.1 Niveaux et accessoires

Une installation appartient à une **lignée** (le feu, l'eau, le couchage, le stockage, la lumière…). Elle a deux façons d'évoluer, toutes deux **sur place** :

| | **Niveau** | **Accessoire** |
|---|---|---|
| Ce que c'est | La **structure** change : le feu de camp devient un foyer de pierres, puis un four | Un équipement **monté** sur la structure, comme la meule sur le pédalier |
| Combien | Un seul niveau à la fois, du plus simple au plus élaboré | Plusieurs, selon le niveau (une crémaillère, une broche, un fumoir) |
| Coût | Matériaux de construction, outil, temps, parfois un savoir | Un objet ou deux, peu de temps |
| Modèle 3D | **Une variante de maillage par niveau** | Une pièce ajoutée au maillage |
| Exemple déjà en jeu | — | Pédalier : meule, dynamo |

Une lignée peut avoir **une bifurcation** quand le réel en propose deux voies opposées : le feu **de surface** (confort, chaleur, cuisine) et le feu **creusé** (discrétion). On passe de l'une à l'autre sur place, au premier niveau.

### 2.2 Ce que l'amélioration garde

- **La position et l'orientation.** L'identifiant aussi : pour le serveur, c'est la même installation.
- **Le contenu** : le bois et les braises d'un feu, l'eau d'un récupérateur, les objets d'un coffre, les accessoires montés (s'ils restent compatibles ; sinon ils reviennent dans le sac).
- **Une seule contrainte d'emplacement** : si le nouveau niveau est plus grand (le four fait 2 × 2 cases quand le feu en fait 1, Book 19 §2.1), la place doit être libre autour, l'installation elle-même ne comptant pas comme obstacle. Sinon, le refus dit pourquoi, comme pour une pose (`raisonEmplacement`).
- **Un feu s'améliore éteint ou en braises**, jamais en pleines flammes : on ne maçonne pas dans le feu. Le bois restant est gardé.

### 2.3 Ce que l'amélioration coûte

Les quatre ingrédients du Book 02 §1, sans en inventer :

| Ingrédient | Règle |
|---|---|
| **Matériaux** | Seulement **la différence** avec le niveau d'avant : on ajoute des pierres au cercle, on ne repart pas de zéro |
| **Outil** | Qualités d'outil du Book 03 §4 (Marteler 1 pour maçonner, Creuser 1 pour un foyer creusé), avec la règle du malus d'un niveau en dessous |
| **Travail** | Durée et intensité comme une recette : l'énergie grise de l'installation **s'accumule** niveau après niveau |
| **Savoir** | Niveaux 1 à 3 : **communs** (Book 03 §5.2 : tout survivant sait faire un foyer). Niveaux 4 et plus : **native d'une famille** quand le réel le dit (le poêle de masse aux Charbonniers, Book 10 §9) ; les autres la construisent à ×1,5 (Book 01 §5) et **s'en servent librement** : on ne refuse pas de cuire sur le four du voisin |

Dans l'interface, l'action **Améliorer** apparaît sur l'installation visée (à côté d'Ajouter du bois, Dormir…). Sa fiche montre le niveau suivant, ce qu'il apporte, ce qui manque et où le trouver (Book 08 §3). Le niveau d'après est grisé : c'est la **recette pressentie** du Book 03 §5.1 et la ligne « Et après ? » de P-002.

### 2.4 Redescendre et démonter

- **Redescendre d'un niveau** rend **la moitié** des matériaux naturels de ce niveau (pierres, branches, bûches, arrondi en dessous) et **tous** les vestiges et objets fabriqués (une grille, une barre de métal, une casserole). C'est la règle du Book 02 §10 (« le démontage rend 50 à 80 % des matières »), au bas de la fourchette, pour que changer d'avis coûte un peu.
- **Démonter le niveau 1** retire l'installation du terrain, aux mêmes conditions. Un feu doit être éteint ; un coffre, vide ; un récupérateur se vide sur place.
- C'est **nouveau et nécessaire** : sans démontage, aucune limite n'est supportable (§4).

### 2.5 L'effet visuel

Chaque niveau a **son modèle**, monté avec l'atelier commun (`client/src/rendu/assemblage.ts`), dans le budget du Book 21 §5.3.4 (≈ 450 à 1 800 triangles, 1 à 4 appels de dessin). La règle : **on doit lire le niveau de loin**, sans bulle. Le foyer de pierres est plus haut et plus régulier que le cercle de cailloux ; le foyer de cuisine a sa crémaillère qui dépasse ; le four est un dôme.

---

## 3. Les lignées

### 3.1 Le feu

**La voie de surface** : de la flamme au four. C'est la lignée principale, celle qui doit rendre inutiles les autres feux.

| Niv. | Nom | Coût de l'amélioration | Ce qu'il permet de plus | Ce qu'il remplace |
|---|---|---|---|---|
| **1** | **Feu de camp** (existe) | 5 pierres, 3 branches | Cuire les plats, bouillir 1 L, rôtir, lumière, un peu de chaleur. Bois 1,5 kg/h, 10 kg au plus | — |
| **2** | **Foyer de pierres** : cercle maçonné à sec, muret réflecteur | +6 pierres, 2 bûches · Marteler 1 · 30 min, moyenne | **Bois ×0,8** (à l'abri du vent) ; tient **16 kg** ; **couvrir le feu** : sous la cendre, il brûle ×0,25 et se ranime sans briquet tant qu'il reste des braises ; le muret renvoie la chaleur : un abri à moins de 3 m dort **×1,15** ; lumière vers l'extérieur ×0,8 | Le réflecteur de chaleur (P-002) ; le « deuxième feu pour tenir la nuit » |
| **3** | **Foyer de cuisine** : crémaillère sur trépied, grille | +3 branches, 1 corde, 1 grille (un rouleau de grillage de la ferme, ou 2 barres de métal) · Couper 1, Marteler 1 · 30 min | **Bouillir 2 L d'un coup**, bois par litre ×0,7 si une casserole ou une cocotte est dans le sac ; **deux plats à la fois** ; une nouvelle famille de plats **mijotés** (soupes : elles désaltèrent) ; rôtir deux fois plus vite | Le trépied et la gamelle (P-002) ; le feu « réservé à la cuisine » |
| **4** | **Four de terre** : dôme d'argile sur le foyer (0b) | +8 argile, 6 pierres, 4 branches · Marteler 1 · 3 h, lourde, puis **séchage passif** d'un jour de jeu | **Cuisson passive** : on enfourne, on s'en va, c'est cuit au retour, même hors ligne ; **bois ×0,5** en cuisine ; le pain (avec le grain, 0b) ; la **chaleur perdue** sèche plus vite ce qui est sur une claie voisine (Book 02 §11) ; lumière ×0,3 (porte fermée) | Le four à pain séparé du Book 02 §8 |
| **5** | **Poêle** (0b, dans une cabane) : poêle en fonte récupéré (60 %, tous) ou **poêle de masse** (80 %, 🔥 natif) | Le poêle (vestige) ou briques, argile, pierres · Feu III pour le poêle de masse (Book 03 §5.6) | **Chauffe la pièce** (Book 10 §5) : c'est le seul niveau qui vit **à l'intérieur**, quand une cabane est construite autour du foyer. Cuisine sur la plaque | Le chauffage comme installation à part |

**La voie creusée** : moins de signature, moins de confort.

| Niv. | Nom | Coût | Ce qu'il permet de plus | Ce qu'il remplace |
|---|---|---|---|---|
| **1 bis** | **Foyer Dakota** (existe) | **Creuser sur place** un feu de camp : Creuser 1, 15 min ; rend 3 pierres | Bois ×0,6, lumière ×0,3, odeur ×0,4. Cuisine et eau comme le feu de camp, **pas de chaleur** pour l'abri | Le deuxième feu creusé à côté du premier |
| **2 bis** | **Poêle-fusée « des Abondants »** : quatre boîtes de conserve emboîtées dans un lit de pierres. Le vrai *rocket stove* de bivouac, fait avec les déchets de l'Âge de l'Abondance | +4 boîtes vides, 4 pierres · Marteler 1 · 20 min | **Bois ×0,4**, bouillir ×0,6 ; lumière ×0,2, odeur ×0,3. Mais petit : **4 kg de bois** au plus, un seul plat, pas de crémaillère, pas de chaleur | Le poêle-fusée en argile de P-002 (qui viendra avec l'argile, comme variante plus durable) |

- **Combler** un Dakota le ramène au feu de camp (5 pierres, Creuser 1). On change de voie sans changer de place.
- La voie creusée s'arrête au niveau 2 : la discrétion a un prix, celui du confort. C'est le choix que le joueur doit faire (§4.3).

**Les accessoires du feu** (comme la meule du pédalier) :

| Accessoire | Niveau min. | Coût | Effet |
|---|---|---|---|
| **Broche** | 1 | 2 branches · Couper 1 | Rôtir une portion de plus à la fois |
| **Marmite norvégienne** : une caisse garnie de chiffons où l'on finit la cuisson sans feu | 3 | 4 branches, 4 chiffons, 1 casserole ou cocotte | Plats mijotés : **moitié moins de bois** (on porte à ébullition, la caisse finit seule) |
| **Fumoir en tipi** (§5) | 2 | 6 branches, 1 bâche | Fumer la volaille ; odeur ×2 pendant le fumage |

**Le bois consommé** ne change pas de règle : chaque niveau applique un **multiplicateur** à `BOIS_PAR_HEURE`, comme le Dakota aujourd'hui. Les multiplicateurs de lumière et d'odeur s'appliquent aux signatures du Book 06 (`FEU_ODEUR`, `FEU_LUMIERE_NUIT`), comme `DAKOTA` aujourd'hui. **La cuisine près d'un feu** (`feu: true`) devient « près d'un foyer allumé de niveau suffisant » : les plats d'aujourd'hui demandent le niveau 1, les mijotés le niveau 3, le pain le niveau 4.

**La forge et la charbonnière** suivent le même principe, dans leur propre lignée (le métier des Charbonniers) :

| Lignée | Niv. 1 | Niv. 2 | Niv. 3 |
|---|---|---|---|
| **Forge** 🔥 | Foyer de forge (existe) | Forge ventilée au charbon (1 300 °C, Book 02 §8) | + creuset (cuivre, aluminium, Book 04 §2.6) |
| **Charbonnière** 🔥 | Meule de terre (existe, consommée au défournement) | **Charbonnière en fût** (Book 02 §12.2) : **permanente**, 1 case au lieu de 3 × 3, odeur moindre, donne du goudron | — |

La charbonnière en fût règle le « champ de meules ». Et une forge allumée devrait **compter comme un feu** pour bouillir l'eau : un forgeron n'allume pas un feu de camp à côté de sa forge (§8).

### 3.2 L'eau

> **0.8** : voir §12 (le niveau 1 tel qu'il est codé).

| Niv. | Nom | Coût de l'amélioration | Ce qu'il permet de plus | Ce qu'il remplace |
|---|---|---|---|---|
| **1** | **Récupérateur de pluie** (existe) | 1 bâche, 4 branches, 1 corde | 5 L au plus, eau potable, hors ligne | — |
| **2** | **Citerne de bâche** : un bac de perches doublé d'une deuxième bâche, avec un couvercle | +1 bâche, 6 branches, 1 corde · Couper 1 | **60 L** ; couverte, l'eau reste potable | Le deuxième, troisième… récupérateur |
| **3** | **Citerne filtrante** : un filtre trois couches à côté (chiffons, gravier, charbon) | +2 chiffons, 2 pierres, 1 kg de charbon de bois | On y **verse l'eau de la mare** : elle ressort **claire**. Claire n'est pas potable (P-002) : il faut la bouillir, mais avec **deux fois moins de bois** | Le filtre posé à part |
| **4** | **Gouttière** (accessoire) : un tuyau d'arrosage (vestige) depuis le toit de l'abri ou de la cabane, à moins de 3 m | 1 tuyau d'arrosage, 2 branches | La pluie de tout le toit : **débit ×3** | — |

Les évolutions de famille du P-002 s'y brancheront comme accessoires : **filtre à sable lent** (⚙️, potable sans bois), **jauge** (⚡). Le charbon du niveau 3, les autres familles l'**achètent** aux Charbonniers.

### 3.3 Le couchage

> **0.8** : voir §12 (le niveau 1 tel qu'il est codé).

C'est la deuxième lignée la plus urgente : aujourd'hui, le lit et l'abri sont deux installations qui ne valent rien l'une sans l'autre.

| Niv. | Nom | Coût de l'amélioration | Ce qu'il permet de plus | Ce qu'il remplace |
|---|---|---|---|---|
| **1** | **Abri** (existe) | 8 branches, 1 bâche · Couper 1 | Repos ×2 (1/8 par heure), nuit complète à la déconnexion | — |
| **2** | **Abri garni** : un lit de branchages sous la bâche | +6 branches, **ou** absorbe un lit de branchages posé à moins de 3 m (sans rien payer) | Sommeil **×1,3** | Le lit posé à côté |
| **3** | **Abri fermé** : un coupe-vent tressé sur le côté au vent, une couverture | +10 branches, 1 corde, 4 chiffons · Couper 1 | Sommeil **×1,45** ; en 0b, protège de la pluie et du froid (on dort sans être réveillé par l'averse, moins d'hypothermie, Book 05) | Le coupe-vent de P-002 |
| **4** | **Hutte de clayonnage et torchis** (0b) | Branches souples, argile, paille · Construction I · 1 jour de séchage passif | Paroi U ≈ 2,6 (Book 10 §3) : **se chauffe** avec un foyer de niveau 2 ou plus à moins de 3 m ; une porte | L'abri de bâche pour l'hiver |

- La lignée s'arrête à la hutte. **La cabane en rondins** (Book 10 §6) ne s'« améliore » pas depuis l'abri : elle se construit par murs, sols et toits sur les arêtes (Book 19), et c'est elle qui accueille le poêle (§3.1, niveau 5).
- **Le lit de branchages seul** reste posable : c'est le couchage de qui n'a pas encore de bâche (sommeil par terre ×1,3).

### 3.4 Le stockage

> **0.8** : voir §12 (le niveau 1 tel qu'il est codé).

| Niv. | Nom | Coût de l'amélioration | Ce qu'il permet de plus | Ce qu'il remplace |
|---|---|---|---|---|
| **1** | **Coffre** (existe) | 4 bûches, 4 branches, 1 corde | 150 kg | — |
| **2** | **Coffre cerclé** : feuillards de métal, fond renforcé | +1 barre de métal, 2 bûches · Marteler 1 | **250 kg** | Le deuxième coffre |
| **3** | **Réserve couverte** : le coffre sous un auvent de bâche, sur des pierres | +1 bâche, 4 branches, 4 pierres · Couper 1 | **400 kg** ; en 0b, garde les stocks **au sec** (pas de pourriture, Book 10 §2.2) | Le troisième coffre, l'abri à provisions |

On garde la possibilité d'avoir plusieurs coffres (on range près de l'atelier, près de la cuisine), mais un seul bon coffre suffit à la phase 0. Les rangements **spécialisés** (le bûcher pour le bois, le râtelier pour les outils, le garde-manger pour les vivres) sont de nouveaux éléments (§5) : ils servent à autre chose qu'empiler des kilos.

### 3.5 La lumière

> **0.8** : voir §12 (le niveau 1 tel qu'il est codé).

Il n'existe aujourd'hui **aucune lumière fixe** : la nuit, la base n'est éclairée que par le feu. Une lignée courte, qui se paie en signature :

| Niv. | Nom | Coût | Ce qu'il permet de plus | Ce qu'il remplace |
|---|---|---|---|---|
| **1** | **Panier à feu** : un brasero de grillage sur une perche | 1 grillage (ou 2 barres de métal), 2 branches · Marteler 1 | Éclaire 8 m autour. Brûle **0,3 kg de bois par heure**, seulement quand on l'allume. Lumière 30 m, pas de cuisine | Le feu de camp allumé « pour y voir » |
| **2** | **Lanterne à bocal** : une mèche dans la graisse, à l'abri du vent dans un bocal (vestige) | 1 bocal, 1 chiffon, graisse (sous-produit de la volaille, à ajouter) | Lumière douce, **14 m de signature** (comme la lanterne à dynamo) ; s'accroche à l'abri ou au coffre | — |
| **3** | **Selon la famille** : guirlande de LED sur le banc solaire (⚡ : 20 LED d'une guirlande, fil de cuivre, prend ses Wh au banc) ; lanterne de forge à huile (🔥) ; lanterne à dynamo à manivelle fixée (⚙️) | Composants des vestiges | Une base éclairée sans flamme. **La lumière blanche se voit** : les Voltaïques paient leur confort en signature, comme la frontale | — |

---

## 4. Les limites douces contre les « 50 feux »

### 4.1 Les leviers possibles

| Levier | Ce qu'il fait | Pour | Contre |
|---|---|---|---|
| **Plafond par type** | Pas plus de N foyers | Simple, existe déjà (3) | Sans démontage, c'est un piège ; trop bas, c'est une règle de jeu vidéo |
| **Plafond par zone** | Un foyer par rayon de X m | Aère la base | Une règle de plus à expliquer, et le terrain fait 50 × 50 m |
| **Entretien en bois** | Chaque feu allumé mange son bois | Réaliste, existe déjà (1,5 kg/h : 36 kg par jour de jeu pour un feu qui ne s'éteint jamais) | Ne joue que sur les feux **allumés** : un champ de cendres ne coûte rien |
| **Signature** | Chaque feu allumé s'ajoute à l'attrait du terrain | Réaliste, existe déjà, et c'est le cœur du jeu (Book 06 §1 : « la signature est une ressource qu'on dépense ») | **Invisible** pour le joueur aujourd'hui |
| **L'intérêt d'un seul bon foyer** | Les bonus d'amélioration ne valent que sur une installation | La seule qui donne **envie**, au lieu d'interdire | Demande les niveaux (§3) |

### 4.2 La combinaison recommandée

1. **D'abord l'intérêt.** Un foyer de cuisine (niveau 3) fait tout ce que font trois feux de camp, en brûlant moins (×0,8 dès le niveau 2) et en cuisinant deux plats à la fois. Personne ne construit trois feux quand le sien sait tout faire. C'est la vraie réponse : **les améliorations ne s'additionnent pas entre installations**, elles s'empilent sur une seule.
2. **Puis la signature, rendue visible.** Elle fonctionne déjà. Il suffit de la **montrer** : quand on allume un deuxième feu, un message « Deux feux allumés : on te sent deux fois plus loin » ; dans la fiche du terrain, une ligne « Ce qui t'attire des Éteints ». Le joueur apprend tout seul qu'un seul feu, c'est mieux.
3. **L'entretien en bois reste tel quel.** Il est déjà sévère.
4. **Le plafond reste, comme filet** : **3 foyers** (feux de camp, Dakota et leurs niveaux ; la forge et la charbonnière à part, puisqu'elles sont le métier). Il ne gêne plus personne dès lors qu'on peut **démonter** et **transformer** sur place (§2.4, Dakota).
5. **Pas de plafond par zone.** Il n'apporte rien que les trois premiers points ne fassent déjà, et il coûte une règle de plus.

Pourquoi : elle **n'interdit presque rien**, elle fait **comprendre** (Book 06 §1 : le joueur choisit ce qu'il dépense de signature). Un plafond seul punit, une signature seule reste invisible ; l'intérêt d'un bon foyer rend le choix évident.

### 4.3 Le choix qu'on garde

Deux foyers ont un sens réel, et on les laisse possibles : un **foyer de cuisine** confortable près de l'abri, et un **poêle-fusée** discret pour les nuits où les Éteints rôdent. C'est un vrai choix de jeu (confort contre discrétion), pas un empilement.

---

## 5. De nouveaux éléments pour la base

Neuf éléments, filtrés avec les quatre questions du Book 02 §14 bis (un effet dans un système qui existe, pas de matière nouvelle sans nécessité, pas de doublon, pas de métier cassé). Le ton est celui du Book 15 : du bushcraft sérieux, fait avec les débris absurdes de l'Âge de l'Abondance.

| Élément | Coût | Rôle de jeu | Système | Quand |
|---|---|---|---|---|
| **Bûcher couvert** | 4 bûches, 8 branches, 1 bâche · Couper 1 | Garde **120 kg de bois** hors du sac et du coffre. À moins de 3 m d'un foyer, **Ajouter du bois** y puise directement. En 0b, garde le bois **sec** (le bois humide brûle deux fois moins bien, Book 02 §3) | Feu, portage | Lot 2 |
| **Râtelier à outils** | 2 bûches, 6 branches, 1 corde · Couper 1 | On y range ses outils : **à moins de 3 m, leurs qualités comptent** pour fabriquer, sans les porter. Hache et marteau pèsent 2,4 kg à eux deux : le sac respire | Fabrication, poids | Lot 2 |
| **Établi** (enfin utile) | Existe · niveau 2 : + étau (vestige du garage), Serrer 1 | Aujourd'hui sans effet. Proposé : **fabriquer 25 % plus vite** à côté ; avec l'étau, les recettes de bois fendu (maillet, coin, planches, P-002) | Fabrication | Lot 2 |
| **Claie de séchage** | 6 branches, 1 corde · Couper 1 | **Processus passif**, même hors ligne : fruits et champignons séchés pèsent **quatre fois moins** pour les mêmes kcal (l'eau part). On porte et on vend plus. Ralentie par la pluie, accélérée à côté d'un four. En 0b, ils **se gardent** | Alimentation, portage, Comptoir | Lot 2 |
| **Fumoir en tipi** | Accessoire du foyer (niveau 2) : 6 branches, 1 bâche | Volaille **fumée** : se vend plus cher, se garde (0b). Odeur ×2 pendant le fumage : on fume quand on peut se le permettre | Alimentation, signature | Lot 2 (l'effet « se garde » en 0b) |
| **Ligne de pieux** | 6 branches · Couper 1 · se pose en ligne de 3 m | **Ralentit** de moitié l'Éteint qui la traverse, s'use à chaque passage (Book 06 §9.1 : les attaques n'abîment que les défenses). Le premier pas vers la palissade de la 0b | Éteints, défense | Lot 2 |
| **Le carillon des Abondants** | 1 nain de jardin **ou** 3 enjoliveurs, 1 ficelle, 2 branches | Un leurre à vent : posé **loin de la base**, il tinte quand le vent souffle (météo, Book 13) et **attire les Éteints ailleurs**. L'alarme prévient ; le carillon détourne. Le nain de jardin trouve enfin un emploi | Éteints, signature, météo | Lot 2 |
| **Garde-manger enterré** | Creuser 2 (bêche), 4 branches, 4 pierres · 1 × 2 cases | Frais et stable : **les vivres s'y gardent** sans énergie (Book 11 §11, cellier du Book 19). Sans objet tant que rien ne pourrit | Conservation | 0b |
| **Poulailler** | 8 branches, 1 grillage, 2 cordes · 2 × 2 cases | Les poules du terrain viennent y nicher : **un œuf toutes les quelques heures**, si on leur laisse du grain ou des baies. On ne les chasse plus, on les garde (Book 11 §9) | Faune, alimentation | 0b |

Écartés pour l'instant : les **feuillées** (la dysenterie n'existe pas encore), l'**étendoir** (les vêtements mouillés non plus), la **table à manger** (décorative), le **séchoir à bois** du Book 02 §8 (le bûcher couvert fait le travail en 0b).

---

## 6. La migration des bases existantes

Rien n'est retiré à personne. Tout ce qui est posé reste à sa place.

| Ce qui existe | Ce qu'il devient |
|---|---|
| Tout feu, toute installation | **Niveau 1** de sa lignée (valeur par défaut de la colonne) |
| Un foyer Dakota | Niveau 1 de la voie creusée (le champ `dakota` devient la voie) |
| Un lit de branchages à moins de 3 m d'un abri | Ne bouge pas. **Améliorer** l'abri propose de l'**absorber** gratuitement (§3.3). Un message à la première connexion le signale. Jusque-là, le bonus actuel continue |
| Trois feux de camp (le plafond) | Ne bougent pas. Le joueur peut maintenant en **démonter** ou en **creuser** un en Dakota. Un indice le dit une fois |
| Une charbonnière en cours de cuisson | Inchangée ; la charbonnière en fût n'est qu'une amélioration proposée |
| Les quêtes déjà réussies | Restent réussies. Les conditions s'élargissent (§7) : ce qui comptait compte toujours |

---

## 7. L'impact technique

- **Données** : un module `commun/src/lignees.ts` décrit chaque lignée : niveaux, coût de chaque amélioration, qualités, durée, famille native, emprise, multiplicateurs (bois, lumière, odeur, sommeil, capacité) et accessoires permis. Les règles lisent ces multiplicateurs au lieu des constantes dispersées (`DAKOTA`, `BONUS_LIT`, `CAPACITE_COFFRE`, `RECUPERATEUR_MAX_L`). Les recettes restent des données (Book 02 §16).
- **Persistance** : une colonne `niveau INTEGER NOT NULL DEFAULT 1` dans `installations` et dans `feux`, plus `accessoires TEXT DEFAULT '{}'` pour les feux (les installations ont déjà `etat`). Même mécanisme que l'ajout de `dakota` (liste des colonnes à ajouter de `serveur/src/base.ts`). On garde **deux tables** : les feux ont leur combustion à part.
- **Messages** : `InstallationVue` et `FeuVu` gagnent `niveau` (et `accessoires`). Côté client → serveur, des verbes : `ameliorer`, `redescendre`, `demonter_installation`, `creuser_dakota`, `combler`, `monter_accessoire`. Contrôle à l'arrivée dans `serveur/src/controle.ts`, comme tout message.
- **Serveur** : `ameliorer()` vérifie matériaux, outils, savoir et place (`raisonEmplacement` avec l'installation elle-même exclue), puis lance la jauge de travail (`commencer`), garde l'identifiant et l'état, et envoie la vue. Le démontage rend les matières (§2.4). `bruler()`, `sourcesTerrain()`, `dormir()` et la capacité des coffres lisent le niveau.
- **Rendu** : `VueInstallation` et `FeuDeCamp` reçoivent le niveau et choisissent **une variante de maillage par niveau** (la même fonction de montage, avec des pièces en plus). Le fantôme de l'amélioration montre le niveau suivant en transparence. La planche `client/objets.html` montre tous les niveaux (`#objet=feu&niveau=3`).
- **Quêtes** : la condition `installation` gagne un `niveau` minimal, et les feux deviennent visibles du carnet (type `feu`). L'objectif « Un vrai lit » accepte un lit **ou** un abri de niveau 2. L'objectif Dakota reste un fait (`foyer_dakota`), noté aussi quand on creuse un feu existant. De nouveaux objectifs « S'installer » peuvent suivre : « Un foyer qui tient la nuit » (niveau 2), « Une vraie cuisine » (niveau 3).
- **Aide du jeu** (`client/src/aide-contenu.ts`) : une rubrique « Améliorer sa base » (niveaux, accessoires, démontage, un bon foyer plutôt que trois) ; mise à jour des rubriques « Le feu » et « Fabriquer et construire ».
- **Tests** : identifiant, position, bois et contenu gardés ; refus quand la place manque ; démontage ; migration sans effet sur les bases existantes.

---

## 8. Les incohérences repérées entre le code et les books

| Sujet | Code | Books | Proposition |
|---|---|---|---|
| **Plafond de feux** | `MAX_FEUX = 3`, sans démontage | Aucun book ne le mentionne | L'écrire (§4.2) et ajouter le démontage |
| **Établi** | Posable, aucune recette ne le demande | Book 02 §8 : installation de palier I | Lui donner un rôle (§5) |
| **Signature de la forge** | Aucune ; le tutoriel dit « Le feu ne trahit pas » | Book 02 §8 : sonore 30 m, olfactive 40 m | Trancher : le tutoriel simplifie, ou la forge doit émettre |
| **La forge et l'eau** | Une forge ne compte pas comme un feu | Book 02 §11 : sa chaleur perdue sert | La forge allumée fait bouillir l'eau |
| **Charbonnière** | Disparaît au défournement | Book 02 §8 et Book 19 §2.1 : installation permanente de 3 × 3 cases | La meule se consomme (réaliste), la charbonnière en fût reste (§3.1) |
| **Grille de pose** | 50 cm (`GRILLE`, décision du Book 10 §7.1) | Book 19 §1 : cases de 1 m | Mettre à jour le Book 19 (les emprises en cases de 1 m restent justes) |
| **Gamme bushcraft, lot 1** | Livrée en 0.3 (`VERSIONS.md`) | Book 02 §14 bis et P-002 : « Lot 1 (0.2) » | Corriger le Book 02 (P-002 est en lecture seule : à signaler au porteur) |
| **Odeur du feu** | 35 m (`FEU_ODEUR`) | Book 02 §8 : 30 m | Aligner l'un sur l'autre |
| **Rendement du feu** | — | Book 02 §8 : 5 % ; Book 10 §5 : feu ouvert 15 % | Préciser : 5 % pour travailler un matériau, 15 % pour chauffer une pièce |

---

## 9. Découpage en lots

La 0.5 est consacrée à la Coopérative, la 0.6 aux armes de lancer (Book 23 §8). Ce chantier touche le **terrain**, pas les lieux de combat : il peut avancer **en parallèle**, avec très peu de fichiers en commun (`joueur.ts`, les messages).

| Lot | Contenu | Version proposée | Critère de réussite |
|---|---|---|---|
| **0 · Ranger** ✅ codé | Démonter une installation ou un feu ; creuser un feu existant en Dakota, le combler. Aucun niveau encore | **0.5.1** (petit correctif, il débloque les joueurs coincés à 3 feux) | Un joueur à 3 feux de camp creuse un Dakota sans en poser un quatrième |
| **1 · Le moteur et le feu** ✅ codé (sauf le fantôme) | Lignées en données, colonne `niveau`, verbe Améliorer, fantôme, migration ; feu niveaux 1 à 3, poêle-fusée, broche ; signature rendue visible ; aide | **0.6**, en parallèle du lancer | Un foyer de cuisine remplace trois feux ; les tests de migration passent |
| **2 · La base qui s'organise** ◐ en partie | Couchage 1 à 3 (abri garni : fin du lit à côté), eau 1 à 3, coffre 1 à 3, lumière 1 ; bûcher, râtelier, établi utile, claie, fumoir, pieux, carillon ; objectifs « S'installer » 11 et plus | **0.7** | Une base de joueur testeur compte moins d'installations qu'en 0.5, avec plus de fonctions |
| **3 · Le premier hiver** | Argile et sable (nouvelles matières), four de terre, hutte, gouttière, poêle dans la cabane, garde-manger, poulailler, lanternes de famille | **0b**, avec la cabane et la conservation (Book 21 §8.1) | On passe l'hiver avec un seul foyer qui cuit, chauffe et sèche |

---

## 10. Questions ouvertes

- [x] **Niveaux et accessoires, ou un arbre libre ?** *Recommandation :* niveaux linéaires (avec une seule bifurcation pour le feu) plus des accessoires, sur le modèle du pédalier qui marche déjà. Un arbre libre multiplie les modèles 3D et embrouille la fiche.
- [x] **Ce que rend un démontage.** *Recommandation :* la moitié des matériaux naturels, la totalité des vestiges et objets fabriqués (Book 02 §10, bas de la fourchette).
- [x] **Le plafond de foyers.** *Recommandation :* garder **3**, la forge et la charbonnière à part, avec le démontage et la signature rendue visible ; pas de plafond par zone.
- [x] **L'abri et le lit.** Fusion automatique à la mise à jour, ou proposée ? *Recommandation :* proposée, par l'amélioration de l'abri qui absorbe le lit voisin sans frais. Rien ne change sans que le joueur le décide.
- [x] **Les niveaux de famille.** Interdits aux autres, ou plus chers ? *Recommandation :* construits à ×1,5 par les autres familles (Book 01 §5), **utilisables par tous** : un four sert à cuire, quel que soit le maçon. Cela demande d'assouplir la règle actuelle « Tu ne sais pas te servir de ça » pour les installations de la vie courante (foyer, couchage, eau), et de la garder pour les machines de métier.
- [x] **Le lot 0 en 0.5.1 ?** *Recommandation :* oui. Il est petit, il ne touche pas la Coopérative, et il répare un vrai blocage (le joueur à 3 feux ne peut plus suivre son carnet).

Les six recommandations sont retenues par le porteur du projet (2026-10-08).

---

## 11. Ce qui est codé (2026-10-08)

### 11.1 Lot 0 · Ranger

- **Démonter** un feu (éteint : pas de flammes ni de braises) ou une installation, depuis sa fiche. Rendu : la moitié des matériaux naturels (pierres, branches, bûches, fibres ; arrondi en dessous), tout le reste (bâche, corde, métal, casserole, et les accessoires). Le bois resté dans un feu éteint revient en bûches et branches entières. Refus : la décharge (elle était là avant), un coffre pas vide, un banc avec des batteries, une meule en cuisson, un escabeau dans les bras. Le récupérateur se vide sur place.
- **Creuser** un feu de camp en Dakota sur place (Creuser 1, 15 min de jeu, rend 3 pierres) ; **combler** un Dakota en feu de camp (5 pierres, Creuser 1). Le fait `foyer_dakota` est noté : l'objectif du carnet est rempli. Le plafond reste à **3 foyers** (`MAX_FOYERS`, `commun/src/lignees.ts`), et son message dit quoi faire à la place.

### 11.2 Lot 1 · Le moteur et le feu

- **Données** : `commun/src/lignees.ts` (voies de surface et creusée, accessoires, lignées des installations, coûts avec choix, surcoût ×1,5 des niveaux de famille, règle du démontage). Les règles lisent les multiplicateurs (`effetsFeu`) : `bruler()`, les signatures, le bois accepté, la cuisine, le sommeil.
- **Persistance** : colonnes `niveau`, `accessoires`, `etat` (couvert, ce qui a été payé à chaque niveau, orientation du muret) dans `feux` ; `niveau` dans `installations` (le reste dans `etat`). Tout ce qui existe passe au niveau 1 sans rien perdre (test de migration).
- **Gestes** (verbes de `interagir`, contrôlés dans `controle.ts`) : `ameliorer`, `redescendre`, `demonter_installation`, `creuser_dakota`, `combler`, `monter_broche`, `monter_marmite`, `couvrir`, `ranimer`. Message serveur `feu_retire`.
- **Le feu** : feu de camp → foyer de pierres (bois ×0,8, 16 kg, se couvre sous la cendre : ×0,25, sans flamme, se ranime sans briquet ; sommeil ×1,15 dans un abri à 3 m quand il brûle ; lumière ×0,8) → foyer de cuisine (deux plats à la fois, soupes mijotées, l'eau bout deux fois plus vite et ×0,7 de bois avec une casserole ou une cocotte dans le sac, rôtir ×2). Four de terre et poêle : montrés grisés (« Et après ? »), pas jouables avant l'argile (0b). Voie creusée : Dakota → poêle-fusée (bois ×0,4, bouillir ×0,6, lumière ×0,2, odeur ×0,3, 4 kg au plus).
- **Accessoires** : broche (Couper 1, 2 branches : une portion de plus par tour) ; marmite norvégienne (foyer de cuisine : 4 branches, 4 chiffons, une casserole ou une cocotte ; les soupes à moitié de bois).
- **Signature rendue visible** : allumer (ou ranimer) un deuxième feu le dit, une fois toutes les 5 minutes au plus. La ligne « Ce qui t'attire des Éteints » dans la fiche du terrain reste à faire.
- **Interface** : « Examiner » sur un feu ou une installation ouvre sa **fiche** (gestes du feu, niveau suivant avec ce qu'il apporte, coûte et ce qui manque, « Et après ? » grisé, autre voie, accessoires, redescendre, démonter). Dans Fabriquer, **une seule carte** pour la lignée du feu (monter un feu de camp, ou creuser d'emblée un Dakota).
- **Rendu** (`client/rendu/feu.ts`, `installations.ts`) : un modèle par niveau, dans l'atelier d'assemblage ; le muret du foyer de pierres est tourné à l'opposé de l'abri le plus proche. Tous les niveaux sont sur la planche `objets.html` (≈ 1 100 à 2 500 triangles, 2 à 15 appels).
- **Carnet** : la condition `installation` a un `niveau` minimal ; « Un vrai lit » accepte l'abri garni ; deux objectifs « S'installer » : « Un foyer qui tient la nuit » (foyer de pierres), « Une vraie cuisine » (foyer de cuisine).
- **Aide du jeu** : rubrique « Améliorer sa base » ; « Le feu », « Fabriquer et construire » et « Cuisiner » mises à jour.

### 11.3 Lot 2 · ce qui est fait

- **Couchage** : abri garni (+6 branches, ou le lit de branchages à moins de 3 m absorbé sans frais, proposé et jamais d'office), sommeil ×1,3 ; abri fermé (+10 branches, 1 corde, 4 chiffons), ×1,45. Hutte : grisée (0b).
- **Eau** : citerne de bâche, 60 L.
- **Stockage** : coffre cerclé 250 kg, réserve couverte 400 kg (on ne redescend pas un coffre trop plein pour sa taille d'avant).

### 11.4 Choix tranchés en codant

- **Les soupes** : soupe de cèpes (2 cèpes, 0,5 L d'eau, 0,5 kg de bois du foyer) et pot-au-feu de volaille (1 portion crue, 1 cèpe, 0,5 L, 0,8 kg). L'eau de la gourde peut être celle de la mare : elle bout.
- **« Bouillir 2 L d'un coup »** : la gourde ne tient qu'un litre ; le foyer de cuisine fait donc bouillir **deux fois plus vite** (et ×0,7 de bois avec une casserole), ce qui revient au même pour le joueur.
- **Un feu couvert** : il n'émet plus de lumière la nuit, son odeur est réduite de moitié ; on ne cuisine pas dessus.
- **Ce qu'on récupère** : on garde ce qui a été réellement payé à chaque niveau (le grillage ou les deux barres). Creuser ou combler remet le compte au coût de base de la nouvelle voie.
- **Un accessoire qui ne va plus** (après une redescente, un creusement) revient entier dans le sac ; démonté avec le foyer, il suit la règle des 50 %.
- **La fiche** remplace « Examiner » (le texte d'examen y est en tête). Sur un feu, {examiner} ouvre donc toujours la fiche ; « Ajouter du bois » y est le premier bouton (il n'est plus sur B quand le feu est éteint).
- **Le muret** se tourne vers l'abri (ou le lit) le plus proche à 6 m, sinon vers le maçon.

### 11.5 Ce qui reste

- Le **fantôme** du niveau suivant, en transparence, quand la fiche est ouverte.
- La contrainte d'emplacement d'un niveau plus grand (aucun niveau jouable ne grandit encore).
- Lot 2 : citerne filtrante (eau « claire »), gouttière, lumière (panier à feu), bûcher, râtelier, établi utile, claie, fumoir, pieux, carillon ; la ligne « Ce qui t'attire des Éteints » ; la forge qui fait bouillir l'eau ; la charbonnière en fût.
- Un message à la première connexion pour les joueurs qui ont un lit à côté de l'abri, ou trois feux (§6).

---

## 12. Le niveau 1 : la base grandit avec les sorties (0.8, 2026-10-10)

*Plan 0.8 §2.1 à §2.3, §9.1 et §9.2 ; **codé en 0.8** (chantiers 1, 5, 6 et 7, `commun/src/lignees.ts`). Les tableaux des §3.1 à §3.5 restent l'histoire de la conception ; là où ils diffèrent, ce paragraphe fait foi.*

### 12.1 La règle

- **Construire** un niveau = **le niveau d'avant posé** + **les matériaux** + **l'outil** (une porte dure : il faut le niveau demandé, Book 03 §4.1). Plus de palier.
- **Chaque niveau a son étape de lieu** : **maison** (ce que donnent le terrain, la ruine et sa caisse), **H1** (la pièce de famille, à la station), **L1** (la Coopérative ou le Moulin du Gué), puis **L2** et au-delà, « plus tard ».
- **Une clé par niveau** au-delà de la maison : un ingrédient **ou** un outil trouvé dehors, jamais les deux. Chaque clé a sa place fixe, ses replis, son idée au ramassage (« Tu y penses ») et son indice en deux temps (Book 03 §5.8).
- **« Plus tard »** : un niveau marqué `aVenir` est grisé dans la fiche, avec sa clé nommée, « à trouver plus loin » ; le serveur le refuse.
- **Rien de propre à une famille en L1** : les clés de la Coopérative et du Moulin sont communes (V4-4).
- **Pas de migration** : tous les joueurs repartent de zéro au déploiement de la 0.8 (plan §9.1). La citerne, la forge ventilée, la réserve couverte et le lit de branchages déjà posés n'ont pas eu à être gérés.

### 12.2 Les lignées jusqu'au niveau 1

| Meuble | Maison | H1 (station) | L1 (Coopérative ou Moulin) | Plus tard |
|---|---|---|---|---|
| **Feu** (voie de surface) | **Feu de camp** (5 pierres, 3 branches) → **foyer de pierres** (6 pierres, 2 bûches ; Marteler 1) | — | **Foyer de cuisine** · clé : **rouleau de grillage** (Coopérative) · 3 branches, 1 corde ; Couper 1, Marteler 1 · repli : 2 barres martelées en grille (Marteler 2, deux fois plus long) | Four de terre (clé : porte de four en fonte, L2B) ; poêle (0b) |
| **Feu** (voie creusée) | **Dakota** (creuser un feu de camp : Creuser 1 ; **rend 5 pierres**, le combler en coûte 5) → **poêle-fusée** (4 boîtes vides, 4 pierres ; Marteler 1) | — | — | — |
| **Accessoires du feu** | **Broche** (2 branches ; Couper 1) | — | **Marmite norvégienne** · clé : **cocotte en fonte** (Coopérative) · 4 branches, 4 chiffons ; bois des mijotés ×0,5 · repli : une casserole (×0,75 : la soupe refroidit plus vite) | — |
| **Eau** | **Récupérateur de pluie, 5 L** (le **bidon de 5 L** de la ruine, 4 branches, 1 corde, **4 sacs plastique** ; Couper 1) | — | **Récupérateur à seau, 10 L** · clé : **seau de 10 L** (laiterie de la Coopérative) · 2 branches ; Couper 1 · repli : le bidon d'huile de la station, rincé, à côté du bidon de 5 L (10 L aussi) | Récupérateur à jerrican, **20 L** (clé : jerrican de 20 L, L2B) |
| **Couchage** | **Abri** (8 branches, la bâche ; Couper 1) → **abri garni** (6 branches) : sommeil ×1,3 | — | **Abri fermé** · clé : **toile de jute** (Moulin) · 10 branches, 1 corde, 1 poignée de clous ; Couper 1, Marteler 1 ; sommeil **×1,45** · repli : 4 chiffons et 2 sacs plastique cousus, **×1,35** | Abri doublé (couvertures de laine, L2A) ; hutte (0b) |
| **Stockage** | **Coffre** (4 bûches, 4 branches, 1 corde ; Couper 1, Fendre 1, Marteler 1) : 150 kg ; 🆕 **râtelier à outils** (2 bûches, 6 branches, 1 corde ; Couper 1) | — | **Coffre cerclé** · clé : **feuillards** (Moulin) · 2 bûches, 1 poignée de clous ; **Marteler 2** (le marteau remmanché suffit, la pierre non) : **250 kg** · repli : la barre de la ruine martelée en bandes (deux fois plus long) | Réserve couverte (tôles ondulées, L2A) : 400 kg |
| **Établi** 🆕 | **Établi** (4 bûches, 6 branches ; Couper 1, Fendre 1, Marteler 1) | — | **Établi à étau** · clé : **étau** (Moulin) ; Serrer 1 : donne **Serrer 3** à 3 m · repli : un serre-joint de fortune (sans le serrage fort) | Établi de menuisier (clé : Raboter, le rabot, L2B) |
| **Lumière** 🆕 | **Torche plantée** (1 branche, 1 chiffon, 1 graisse ; Couper 1) : éclaire **6 m**, **brûle jusqu'au matin** suivant quelle que soit l'heure où on l'allume ; une nuit, puis on en plante une autre | — | — | Lanterne fixe (lanterne-tempête, L2A) |
| **Alarme, divers** | Alarme à boîtes ; escabeau | — | — | — |
| 🔥 **Forge** | Charbonnière (10 bûches et 4 branches, **ou** la charbonnette : 5 bûches et 20 branches) ; **bac de trempe** sans clé : une auge de planches calfatée de **glaise** du gué (2 bûches, 2 glaises ; Creuser 1) | **Foyer de forge** · clé : **enclume de dépanneur** · 8 pierres, la barre de la ruine, 2 branches ; Marteler 1 ; lames **★★** · repli : une grosse pierre plate (★ seulement) | — | **Forge ventilée** (clé : soufflet de forge, L2B) : ★★★ |
| ⚡ **Banc** | Clôture de fortune, alarme électrique | **Banc solaire** · clé : **panneau solaire** (le pilier de l'auvent de la station) · 2 bûches, la barre de la ruine, 3 branches ; Visser 1, Serrer 1 ; ≈ 80 Wh par jour de soleil · repli : la manivelle de la lampe à dynamo, lente | — | Poste de montage (L2A) : module à bobine, aiguillon, électrificateur |
| ⚙️ **Pédalier** | Meule, **ventilateur à manivelle** ; tour à perche ; assommoir, mâchoires de fortune | **Pédalier générateur** · clé : **petit alternateur** (l'établi du garage, près d'une voiture éventrée) · le vélo de la ruine (cadre, chaîne, roue), 2 bûches ; Serrer 1, Visser 1, Marteler 1 ; ≈ 60 Wh par heure de pédalage · repli : la dynamo du vélo (3 à 6 W) | — | Cranequin, arbalète lourde |

**Les clés de L1 sont à place fixe, à la première visite** (Book 23 §11 et §12) : à la Coopérative, le grillage, la cocotte, les seaux ; au Moulin du Gué, la toile de jute, les feuillards, l'étau. Elles reviennent à 24 h. **Les pièces de famille** sont à la station, **une par joueur** (Book 01 §2 bis) : chacun voit la sienne, la prend pour lui ; elle revient pour lui au bout de 24 h.

### 12.3 Ce qui change, lignée par lignée

- **L'eau : 5 → 10 → 20 L.** Le récupérateur de la maison tient **5 L** et demande le **bidon de 5 L** de la ruine et les **4 sacs plastique** du premier sac-poubelle du chemin (garantis). **La citerne de bâche de 60 L est retirée** de la lignée (V4-7) : le niveau 2 est le **récupérateur à seau, 10 L**, qui les tient même hors ligne. Le **20 L** (jerrican) est « plus tard ».
- **Le couchage : la fin du lit de branchages.** Le lit n'est plus une installation à part : il est **fondu dans l'abri garni** (I25). La ligne « le lit de branchages seul reste posable » (§3.3) ne vaut plus. **L'abri fermé** prend la toile de jute du Moulin pour clé (plus les 4 chiffons du §3.3).
- **Le stockage : le coffre cerclé** demande désormais une **clé** (les feuillards du Moulin) et **Marteler 2** : le **marteau remmanché** (la tête de marteau de la caisse de la ruine et une branche, à la main ; **à côté de l'établi** depuis la 0.8.2, §13) le permet à toutes les familles. La réserve couverte passe « plus tard ».
- **Le râtelier à outils** (nouveau) : les outils rangés dessus, **à 3 m**, comptent pour les qualités comme s'ils étaient dans le sac (une hache au râtelier donne Fendre au coffre ; le bac de trempe lit Creuser 1 au râtelier).
- **L'établi : une lignée nouvelle.** L'établi d'avant devient le niveau 1 ; l'**établi à étau** (niveau 2) donne **Serrer 3** à qui travaille à 3 m (l'étau dans le sac ne donne rien), et ses recettes : **maillet** (1 bûche, 1 branche), **coins de bois** (1 bûche → 4), **planches fendues** (1 bûche, 1 coin, le maillet → 2 planches ; le maillet revient), et **réparer le manche** d'une arme sans forge (Book 25 §13.6). Il porte aussi l'arbalète ⚙️ et l'évolution des armes de bois.
- **La lumière : la torche plantée** (nouvelle) remplace le panier à feu du §3.5 pour le niveau 1 : 6 m de lumière, une nuit entière, une source de lumière de nuit qui compte dans la signature (Book 06). Elle ne se regarnit pas : on en plante une autre.
- **Le feu** : le **foyer de cuisine** prend le **grillage** de la Coopérative pour clé (le « rouleau de grillage de la ferme » du §3.1) ; la **marmite** prend la **cocotte** ; le **four de terre** passe « plus tard », et ses deux plats (pot-au-feu, volaille aux cèpes) restent grisés dans la fiche du foyer de cuisine. **Creuser un Dakota rend 5 pierres** (au lieu de 3, B12) : on ne perd plus de pierres en changeant de voie.
- **Les meubles de famille** : le **banc de recharge** et le **panneau** ne font plus qu'un meuble, le **banc solaire** ; le **pédalier universel** devient le **pédalier générateur** ; on **pose le meuble**, puis on y **monte sa pièce** (poser le panneau, poser l'enclume, monter l'alternateur). Un meuble de famille ne compte comme monté au niveau de sa clé **qu'une fois sa pièce posée**. L'accessoire ⚙️ de ventilation s'appelle le **ventilateur à manivelle** (le mot « soufflet » est réservé à la clé « soufflet de forge » de la forge ventilée, Q-0.8-13).

### 12.4 Les recettes liées aux meubles

Une recette **liée à une construction** apparaît dès qu'on possède la construction au bon niveau, et se fait à côté d'elle (2,5 m pour un feu, 3 m pour le reste) : la liste est au Book 02 §14 quinquies. La **fiche du meuble** (Examiner) devient l'arbre : ce qu'on y fait, le niveau suivant (sa clé, ses matériaux, son outil, ce qui manque, l'indice), et celui d'après, grisé.

### 12.5 Le rythme, et ce qui reste

- **Le rythme, mesuré** (`npm run rythme`, chantier 14) : le joueur prudent atteint la station à 38 min, le gué à 85, la Coopérative vers 104 à 107, le Moulin vers 163 à 166 ; sa **dernière porte à clé** tombe à **209 à 212 min**, et **tout le niveau 1** (avec le reste de la maison et du métier) à **277 à 278 min**. Le joueur pressé : 110 à 125 min pour les portes, 141 à 179 min pour tout ; le malchanceux : 161 à 163 min, puis 219 à 254 min ; le vétéran sans tutoriel : 126 à 141 min, puis 191 à 196 min. Aucun aller-retour de ravitaillement à la station pour le joueur seul ; un pour le malchanceux ⚙️ ou 🔥 (Book 01 §2 bis). La cible « ≈ 3 h 20 pour le prudent » (critère 6 du plan) est en cours d'arbitrage par le porteur : les portes à clé la tiennent, tout le niveau 1 la dépasse.
- **Le tutoriel et les quêtes** (chantier 13, codé) : « S'installer » en portes successives (Book 22 §3.1 bis) ; l'aide « Améliorer sa base » raconte la clé, l'indice, les replis, les outils de fortune et le râtelier.
- **Hors de la 0.8** : le niveau 2 de chaque lignée (§12.2, colonne « plus tard ») ; la citerne filtrante, la gouttière, le bûcher, la claie, le fumoir, la charbonnière en fût (§11.5).

## 13. Ce que la 0.8.2 change : le banc et sa batterie, l'établi, le meuble appris (2026-10-13)

*Plan 0.8 §9.4 (R12, R13, R17, R21) et §9.3, plan 0.8.2 §7.2 et §7.3, chantiers C, B, I et J ; **codé en 0.8.2** (`commun/src/banc.ts`, `commun/src/energie.ts`, `serveur/src/electricite.ts`, `serveur/src/mecanique.ts`, `client/src/fiche-banc.ts`, `commun/src/recettes/communes.ts`, `commun/src/savoir-meuble.ts`). Là où le §12 diffère, ce paragraphe fait foi.*

### 13.1 Le banc solaire et sa batterie (R17)

**Le banc fait passer l'énergie de la batterie posée dedans vers ce qu'on porte.** On ne parle plus de « grosse batterie » : chaque batterie a son nom.

- **Une seule batterie dans le banc, à demeure** : **la batterie de voiture de la ruine** (360 Wh de capacité, trouvée à moitié pleine), posée par le geste qui existait déjà ; elle y reste. Plus tard, une batterie de plus forte capacité pourra la remplacer (à définir : la liste des batteries de banc n'a aujourd'hui que la batterie de voiture).
- **Remplir la batterie du banc** :
  - **le panneau solaire** posé sur le banc : ≈ **80 Wh par jour** de soleil (inchangé, réglage `panneau_wh_jour`), même joueur absent ;
  - **le pédalier générateur posé à moins de 3 m du banc** la charge **directement** quand on pédale, sans qu'on la porte : ≈ 46 Wh par heure de jeu avec le petit alternateur (≈ 60 pour un Mécaniste), 5 avec la dynamo du vélo. Le pédalier remplit d'abord la batterie du banc, puis une batterie posée sur lui, puis une du sac ; sans rien de tout cela : « Rien à charger : approche le pédalier à moins de 3 m du banc, ou pose une batterie dessus. » À 4 m, il ne charge plus le banc ;
  - **la manivelle** de la lampe à dynamo reste **le secours lent** (1 Wh par minute réelle) ; dans le code, elle charge **une arme électrique**, pas la batterie du banc.
- **Échanger la batterie du banc** contre une **batterie de voiture** du sac (6 s) : l'ancienne revient au sac **avec sa charge** ; on emporte une batterie pleine au Comptoir, par exemple. Après un échange, la batterie du banc s'appelle « la batterie de voiture » (elle n'est plus celle de la ruine). Sans batterie de voiture dans le sac, la fiche le dit : « Pour l'échanger, il te faut une autre batterie de voiture dans ton sac. »
- **Charger ce qu'on porte** : **dans la fiche du banc**, jamais une fenêtre à part, **une ligne par chose qui se charge**, nommée, avec son niveau et un bouton « **Charger** » :
  - **la petite batterie de la frontale** ;
  - **chaque arme électrique**, une ligne par exemplaire, avec ses étoiles (« Le courant va dans son pack de cellules », ou « dans sa petite batterie ») ;
  - une **batterie de voiture** qu'on porte.
- **Un pack de cellules en vrac n'a pas de ligne** : il reste « plein » (§7.2 du plan) ; c'est dans une arme qu'il se charge.
- **La charge** : **85 %** du courant arrive (« au bout des pinces »), **30 Wh par heure de jeu**, deux minutes au plus à la fois, sans bouger. **Rien ne se charge si la batterie du banc est vide**, et le refus le dit : « La batterie de voiture de la ruine, dans le banc, est vide : rien à charger. Le panneau la remplit au soleil. »
- **Ces lignes remplacent** les gestes « Recharger » et « Recharger ses armes ». **Une partie 0.8.1 se relit** : les batteries en trop posées sur le banc reviennent au sac, avec leur charge.
- **L'aide** a une rubrique « **Le banc** » (Book 14 §4.6) ; les textes du banc, de la frontale et des armes électriques sont réécrits, sans jargon.

### 13.2 Remmancher à l'établi (R13)

- **Remmancher la hache** (la tête de hache et une branche) et **remmancher le marteau** (la tête de marteau et une branche) se font **à côté de l'établi** (le niveau 1 de la lignée, §12.2), plus à la main ; Couper 1, Marteler 1, 30 s, toutes familles. Le tutoriel fait donc bâtir l'établi avant la hache (Book 14 §4.6).
- **Réparer le manche** d'une arme reste à l'**établi à étau** (le niveau 2, Book 25 §13.6).

### 13.3 La torche, l'abri, la mare

- **La torche plantée et l'abri ne changent pas** de lignée : mêmes niveaux, mêmes coûts, mêmes clés. Seuls leurs textes changent : l'abri ne parle plus d'un lit construit à côté (R11 : on **garnit** l'abri), et le message de lumière ne dresse plus la liste des lumières des familles.
- **Dormir dans l'abri** (R12, Q-0.8.2-7) : le personnage **va, accroupi, jusqu'à sa couche**, par une ouverture de l'abri, et dort **à sa place fixe**, dedans ; la bâche s'efface en partie tant qu'on dort dessous. Endormi, le bouton A dit « **Se réveiller** ».
- **« Un vrai lit »** (l'abri garni) vient **juste après le coffre** dans « S'installer » (Book 22 §3.1 bis) : l'abri fermé suppose l'abri garni.
- **La gourde au milieu de la mare** (R21, Q-0.8.2-3) : on **entre dans la mare**, l'eau aux genoux, à mi-allure, et l'on remplit la gourde **au milieu** ; au bord, l'eau est trouble, et **le bord reste aux joncs**.

### 13.4 Se servir du meuble d'une autre famille (plan 0.8.2 §7.3)

- **Qui a appris la recette d'un meuble de famille** (une leçon, un manuel) **peut s'en servir et y poser sa pièce** (l'enclume, le panneau, le petit alternateur). Avant la 0.8.2, le jeu refusait : « C'est le savoir d'une autre famille » ; le refus reste pour qui ne l'a pas appris. C'est ce que disait déjà ce book (les installations de métier « utilisables par tous », Q5) : la 0.8.2 le fait pour les meubles appris.
- **Le malus ×1,5** reste sur **ce qu'on y fabrique** (Book 25 §2.3), **pas sur les gestes** : pédaler, charger, poser sa pièce coûtent le même prix à tous.
- **Exemple** : un Voltaïque qui a appris le pédalier générateur peut pédaler à moins de 3 m de son banc pour remplir sa batterie.
- **Les armes de métier** n'apparaissent qu'avec **le meuble complet de leur métier**, bâti et équipé de sa pièce, même pour un apprenti d'une autre famille (Book 25 §14).

## 14. Le niveau 2 : la récupération, et plus aucun repli (0.10, 2026-10-15)

*`niveau-2.md` (§1, §2, §4.2), plan 0.10 (§3.1, chantiers B, C, D ; S-22, S-23, S-30 ; V1-01 à V1-06, V1-17 à V1-21, V3-02, V3-03) ; **codé en 0.10** (`commun/src/lignees.ts`, `commun/src/meubles-neufs.ts`, `commun/src/energie.ts`, `commun/src/economie.ts`, `serveur/src/meubles-neufs.ts`). Là où le §12 et le §13 diffèrent, ce paragraphe fait foi. Les meubles des familles du niveau 2 et leurs recettes : Book 25 §15.*

### 14.1 La règle, revue

- **Construire** un niveau reste **le niveau d'avant posé + les matériaux + l'outil**, et **l'objet-clé** du niveau (§12.1).
- **Plus aucun repli, à aucun niveau** (décision du porteur, 2026-10-14 : « une complexité en plus à gérer ») : les replis du niveau 1 (deux barres en grille, la casserole, les chiffons cousus, le bidon d'huile, la barre en bandes…) **sont retirés**. Sans son objet-clé, un niveau ne se monte pas, même avec ce que demandait son ancien repli. **Ce qu'on avait déjà bâti avec un repli reste bâti** (un abri fermé aux chiffons garde son ×1,35, une marmite à la casserole son ×0,75). Restent, parce que ce ne sont pas des replis de clé mais les voies de secours des familles (V1-08, V1-09) : la pierre plate en enclume, la manivelle de la lampe, la dynamo du vélo, le serre-joint de fortune.
- **Les trois sources d'un objet-clé** : **sa place garantie** dans son lieu (tous **au fond** : R49) ; **la chance** (rare à la route du pont, à la corniche et dans l'autre lieu du niveau 2 ; les objets-clés du niveau 1 y sortent plus souvent, à 4 % par fouille : V1-07) ; **le Comptoir**, qui le vend **toujours**, sans stock ni réassort, **dès qu'on a visité son lieu** (et jamais avant). Les objets-clés du niveau 1 suivent la même règle au Comptoir.
- **La récupération** (N2-01) : au niveau 2, les meubles demandent surtout des matières démontées ; les pierres, les branches, les bûches et la glaise restent ceux de la maison et du niveau 1 (et serviront aux murs de la 0.10.1).
- **Le tube d'aluminium** (N2-02 à N2-05), une matière nouvelle, distincte de la chute d'aluminium : il sort du **parasol**, de la **débroussailleuse**, de la **trottinette d'enfant** et de la **perche à selfie** démontés, de l'**échelle en aluminium** (4 tubes ; dans les ateliers de la station, de la Coopérative et du Moulin, le hangar du phare) et de la **chaise de camping** (2 tubes, 1 chiffon ; le jardin de la station, les berges du gué, les transats de l'hôtel). Sur la côte, **≈ 15 tubes et 8 bouteilles en verre par tournée** (V3-02, V3-03).

### 14.2 Les lignées jusqu'au niveau 2

| Meuble | Niveau 1 (L1) | **Niveau 2 (L2)** · objet-clé (lieu) · matériaux ; outil | Ce qu'il apporte |
|---|---|---|---|
| **Feu** | Foyer de cuisine | **Four de terre** · **porte de four en fonte** (phare) · 4 glaises, 2 pierres, 6 bouteilles en verre (le lit de bouteilles isole la sole) ; Marteler 1 | **Bois × 0,5** ; ses deux plats (pot-au-feu, volaille aux cèpes) restent grisés jusqu'à la 0b |
| **Eau** | Récupérateur à seau, 10 L | **Récupérateur à jerrican** · **jerrican de 20 L** (phare) · 2 caoutchoucs (le tuyau), 1 plastique (l'entonnoir) ; Couper 1 | **20 L** d'eau de pluie |
| **Couchage** | Abri fermé | **Abri doublé** · **couvertures de laine** (hôtel) · 1 bâche, 4 chiffons ; Couper 1 | Sommeil **× 1,6** |
| **Stockage** | Coffre cerclé | **Réserve couverte** · **tôles ondulées** (hôtel) · 4 tubes d'aluminium, 1 rouleau de fil de fer, 1 poignée de clous ; Couper 1, Marteler 2 | **400 kg** |
| **Établi** | Établi à étau | **Établi de menuisier** · **le rabot** (phare : la qualité Raboter) · 2 bûches, 1 barre (la vis de presse), 1 poignée de clous | Les **étagères** (§14.3) |
| **Lumière** | Torche plantée | **Lanterne fixe** · **lanterne-tempête** (hôtel) · 1 tube (la potence), 2 chutes d'aluminium (le réflecteur), 1 bidon d'huile, consommé une fois (V1-06) ; Couper 1 | **14 m** de lumière **chaque nuit, d'elle-même**, sans flamme nue ; rien à rallumer |
| **Alarme** | Alarme à boîtes | **Cloche d'alarme** · **cloche de bronze** (phare : la cloche du cargo) · 2 tubes, 1 rouleau de fil de fer, 1 petit ressort ; Marteler 1 | On l'entend à **40 m**, et elle **réveille le dormeur** (l'alarme à boîtes prévient seulement qui est éveillé) |
| 🔥 **Forge** | Foyer de forge | **Forge ventilée** · **soufflet de forge** (phare) · 3 pierres, 2 glaises, 1 barre (la tuyère) ; Marteler 2 | Vers 1 300 °C **sans pomper** : les lames ★★★ (Book 25 §15) |
| ⚡ **Banc** | Banc solaire | **Poste de montage** · **fer à souder** (hôtel : la qualité Souder, sans version pauvre) · 1 fil de cuivre, 1 résistance, 1 aimant, 2 plastiques | Souder : le pack soudé de 24 Wh, la batterie de cellules, la rampe de LED (Book 25 §15) |
| ⚙️ **Pédalier** | Pédalier générateur | **Roulements montés** · **1 roulement** (hôtel : la boîte en contient 3, V1-01) ; Serrer 2 | **− 30 % d'effort, + 30 % de courant** ; le cranequin léger, la charrette, le moulin de jerricans (Book 25 §15) |

- **Les délais de retour** des objets-clés : les couvertures et le jerrican en **24 h**, les autres en **4 jours** (N2-18 à N2-27).
- **Les fiches** : « Tu y penses » au ramassage, et l'indice en deux temps, qui nomme le type de lieu puis le lieu, jamais l'endroit exact (« De la vraie laine ? Un grand hôtel en avait plein. », puis « Au Grand Hôtel des Flots. »).

### 14.3 Les étagères de l'établi de menuisier

- **Étagères** (V1-04, V1-20, V1-21) : **2 planches fendues** et **1 poignée de clous**, rabotées au rabot (Raboter 1), à côté de l'établi de menuisier : **+ 50 kg** au coffre ou à la réserve d'à côté. Le vrai objet « planche rabotée » viendra avec les murs, en 0.10.1.
- **Les manches + 25 %** sont reportés (il faudrait une solidité par exemplaire) ; **la porte de planches** attend les murs (0.10.1).

### 14.4 Deux meubles nouveaux pour tous

**Ils apparaissent après la première visite d'un lieu du niveau 2** (N2-Q3), sans objet-clé ni meuble d'avant.

| Meuble | Matériaux · outil | Ce qu'il fait |
|---|---|---|
| **Cuiseur solaire** (N2-40, S-22) | 4 chutes d'aluminium (les réflecteurs), 1 verre (la vitre), 4 papiers (l'isolant), 1 boîte vide ; Couper 1 | **Un foyer qui ne brûle rien** : il fait bouillir l'eau et cuit les plats du foyer de pierres, **deux fois plus lentement**, **au soleil et le jour seulement** ; moitié moins vite par temps voilé ; rien sous un ciel couvert, sous la pluie ni la nuit (et il le dit) |
| **Bacs de tri** (N2-41, S-23) | 3 jerricans percés, 1 aimant (il sépare le fer de l'aluminium), 1 tube ; Couper 1 | À moins de 3 m, **démonter va deux fois plus vite**, et **une matière de plus, un démontage sur trois** (tiré par le serveur) |

### 14.5 Le banc solaire suit le soleil (Q-0.10-6, S-30, V1-02, V1-19)

- **Le panneau ne produit plus au calendrier sans regarder le ciel** : il suit **l'heure** (rien la nuit, le plus fort à midi) et **le temps** (plein soleil 1, voilé 0,6, couvert 0,3, pluie 0), même joueur absent.
- **La même recharge qu'avant, en moyenne** : **80 Wh par jour de calendrier** sur la vraie météo, soit **≈ 160 Wh par beau jour** (≈ 162 ; tout est multiplié par ≈ 2). Mesuré par `npm run rythme` : ≈ 18,7 Wh par jour de jeu en moyenne, 35,2 un jour tout au soleil.
- **Par mauvais temps, le moulin de jerricans prend le relais** (⚙️, Book 25 §15) : il remplit la même batterie de la base, à la même moyenne.
- **La batterie de la base**, que remplissent le banc et le moulin et que vide la rampe de LED, est **la plus proche à 15 m au plus** (V1-17) ; au-delà, rien ne charge et la rampe reste éteinte. La batterie de voiture du banc (360 Wh) peut être remplacée par **la batterie de cellules** (120 Wh) des ⚡.
