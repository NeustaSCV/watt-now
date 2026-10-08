# Book 24 — Améliorer sa base

> Document de conception · version 0.1 · 2026-10-08
> Statut : **proposition à valider** par le porteur du projet. Rien n'est codé.
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
| **Banc de recharge**, **panneau solaire** | — | Électricité (É4) | ⚡ |
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
| **Forge** 🔥 | Foyer de forge à soufflet (existe) | Forge ventilée au charbon (1 300 °C, Book 02 §8) | + creuset (cuivre, aluminium, Book 04 §2.6) |
| **Charbonnière** 🔥 | Meule de terre (existe, consommée au défournement) | **Charbonnière en fût** (Book 02 §12.2) : **permanente**, 1 case au lieu de 3 × 3, odeur moindre, donne du goudron | — |

La charbonnière en fût règle le « champ de meules ». Et une forge allumée devrait **compter comme un feu** pour bouillir l'eau : un forgeron n'allume pas un feu de camp à côté de sa forge (§8).

### 3.2 L'eau

| Niv. | Nom | Coût de l'amélioration | Ce qu'il permet de plus | Ce qu'il remplace |
|---|---|---|---|---|
| **1** | **Récupérateur de pluie** (existe) | 1 bâche, 4 branches, 1 corde | 5 L au plus, eau potable, hors ligne | — |
| **2** | **Citerne de bâche** : un bac de perches doublé d'une deuxième bâche, avec un couvercle | +1 bâche, 6 branches, 1 corde · Couper 1 | **60 L** ; couverte, l'eau reste potable | Le deuxième, troisième… récupérateur |
| **3** | **Citerne filtrante** : un filtre trois couches à côté (chiffons, gravier, charbon) | +2 chiffons, 2 pierres, 1 kg de charbon de bois | On y **verse l'eau de la mare** : elle ressort **claire**. Claire n'est pas potable (P-002) : il faut la bouillir, mais avec **deux fois moins de bois** | Le filtre posé à part |
| **4** | **Gouttière** (accessoire) : un tuyau d'arrosage (vestige) depuis le toit de l'abri ou de la cabane, à moins de 3 m | 1 tuyau d'arrosage, 2 branches | La pluie de tout le toit : **débit ×3** | — |

Les évolutions de famille du P-002 s'y brancheront comme accessoires : **filtre à sable lent** (⚙️, potable sans bois), **jauge** (⚡). Le charbon du niveau 3, les autres familles l'**achètent** aux Charbonniers.

### 3.3 Le couchage

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

| Niv. | Nom | Coût de l'amélioration | Ce qu'il permet de plus | Ce qu'il remplace |
|---|---|---|---|---|
| **1** | **Coffre** (existe) | 4 bûches, 4 branches, 1 corde | 150 kg | — |
| **2** | **Coffre cerclé** : feuillards de métal, fond renforcé | +1 barre de métal, 2 bûches · Marteler 1 | **250 kg** | Le deuxième coffre |
| **3** | **Réserve couverte** : le coffre sous un auvent de bâche, sur des pierres | +1 bâche, 4 branches, 4 pierres · Couper 1 | **400 kg** ; en 0b, garde les stocks **au sec** (pas de pourriture, Book 10 §2.2) | Le troisième coffre, l'abri à provisions |

On garde la possibilité d'avoir plusieurs coffres (on range près de l'atelier, près de la cuisine), mais un seul bon coffre suffit à la phase 0. Les rangements **spécialisés** (le bûcher pour le bois, le râtelier pour les outils, le garde-manger pour les vivres) sont de nouveaux éléments (§5) : ils servent à autre chose qu'empiler des kilos.

### 3.5 La lumière

Il n'existe aujourd'hui **aucune lumière fixe** : la nuit, la base n'est éclairée que par le feu. Une lignée courte, qui se paie en signature :

| Niv. | Nom | Coût | Ce qu'il permet de plus | Ce qu'il remplace |
|---|---|---|---|---|
| **1** | **Panier à feu** : un brasero de grillage sur une perche | 1 grillage (ou 2 barres de métal), 2 branches · Marteler 1 | Éclaire 8 m autour. Brûle **0,3 kg de bois par heure**, seulement quand on l'allume. Lumière 30 m, pas de cuisine | Le feu de camp allumé « pour y voir » |
| **2** | **Lanterne à bocal** : une mèche dans la graisse, à l'abri du vent dans un bocal (vestige) | 1 bocal, 1 chiffon, graisse (sous-produit de la volaille, à ajouter) | Lumière douce, **14 m de signature** (comme la lanterne à dynamo) ; s'accroche à l'abri ou au coffre | — |
| **3** | **Selon la famille** : guirlande de LED sur le banc de recharge (⚡ : 20 LED d'une guirlande, fil de cuivre, prend ses Wh au banc) ; lanterne de forge à huile (🔥) ; lanterne à dynamo à manivelle fixée (⚙️) | Composants des vestiges | Une base éclairée sans flamme. **La lumière blanche se voit** : les Voltaïques paient leur confort en signature, comme la frontale | — |

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
| **0 · Ranger** | Démonter une installation ou un feu ; creuser un feu existant en Dakota, le combler. Aucun niveau encore | **0.5.1** (petit correctif, il débloque les joueurs coincés à 3 feux) | Un joueur à 3 feux de camp creuse un Dakota sans en poser un quatrième |
| **1 · Le moteur et le feu** | Lignées en données, colonne `niveau`, verbe Améliorer, fantôme, migration ; feu niveaux 1 à 3, poêle-fusée, broche ; signature rendue visible ; aide | **0.6**, en parallèle du lancer | Un foyer de cuisine remplace trois feux ; les tests de migration passent |
| **2 · La base qui s'organise** | Couchage 1 à 3 (abri garni : fin du lit à côté), eau 1 à 3, coffre 1 à 3, lumière 1 ; bûcher, râtelier, établi utile, claie, fumoir, pieux, carillon ; objectifs « S'installer » 11 et plus | **0.7** | Une base de joueur testeur compte moins d'installations qu'en 0.5, avec plus de fonctions |
| **3 · Le premier hiver** | Argile et sable (nouvelles matières), four de terre, hutte, gouttière, poêle dans la cabane, garde-manger, poulailler, lanternes de famille | **0b**, avec la cabane et la conservation (Book 21 §8.1) | On passe l'hiver avec un seul foyer qui cuit, chauffe et sèche |

---

## 10. Questions ouvertes

- [ ] **Niveaux et accessoires, ou un arbre libre ?** *Recommandation :* niveaux linéaires (avec une seule bifurcation pour le feu) plus des accessoires, sur le modèle du pédalier qui marche déjà. Un arbre libre multiplie les modèles 3D et embrouille la fiche.
- [ ] **Ce que rend un démontage.** *Recommandation :* la moitié des matériaux naturels, la totalité des vestiges et objets fabriqués (Book 02 §10, bas de la fourchette).
- [ ] **Le plafond de foyers.** *Recommandation :* garder **3**, la forge et la charbonnière à part, avec le démontage et la signature rendue visible ; pas de plafond par zone.
- [ ] **L'abri et le lit.** Fusion automatique à la mise à jour, ou proposée ? *Recommandation :* proposée, par l'amélioration de l'abri qui absorbe le lit voisin sans frais. Rien ne change sans que le joueur le décide.
- [ ] **Les niveaux de famille.** Interdits aux autres, ou plus chers ? *Recommandation :* construits à ×1,5 par les autres familles (Book 01 §5), **utilisables par tous** : un four sert à cuire, quel que soit le maçon. Cela demande d'assouplir la règle actuelle « Tu ne sais pas te servir de ça » pour les installations de la vie courante (foyer, couchage, eau), et de la garder pour les machines de métier.
- [ ] **Le lot 0 en 0.5.1 ?** *Recommandation :* oui. Il est petit, il ne touche pas la Coopérative, et il répare un vrai blocage (le joueur à 3 feux ne peut plus suivre son carnet).
