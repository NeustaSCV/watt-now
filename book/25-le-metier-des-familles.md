# Book 25 — Le métier des familles

> Document de conception · version 0.2 · 2026-10-09
> Statut : **v0.2, validé par le porteur (2026-10-09)**. Rien n'est codé, sauf les deux corrections du §0.2.
> Demande du porteur (v0.1) : « Aujourd'hui, on va développer le craft spécifique à chaque famille. Il faudra sans doute ajouter des objets et des matières de base. Fais-moi des propositions. Les charbonniers ont les lames. Les voltaïques peuvent avoir des armes électriques (taser ?) et les mécanistes peuvent avoir des arbalètes ? Arc pour tout le monde, c'est assez basique comme technologie. Fais-moi une proposition étoffée. »
> Décisions du porteur (v0.2) : « Il ne faut pas qu'il y ait trop de dépendances. Elles doivent pouvoir permettre des améliorations, mais ne pas bloquer les choses de base de chaque famille. Au début du jeu il n'y a pas toutes les familles, alors il faut que chacun soit — un peu — autonome. Il aura besoin des autres pour faire évoluer ses armes évidemment. Il faut veiller à ce que l'arme de chaque famille soit équilibrée. La matraque électrique me semble un peu en dessous car elle ne permet pas de tuer les Éteints. 1. oui 2. oui 3. oui 4. oui 5. oui 6. oui 7. oui 8. les deux. La machette trouvée peut être une machette de fortune (un bout de métal avec un manche), rien à voir avec une lame forgée. Je comprends pas comment on obtient un ressort à partir d'une lame ébréchée ? C'est pas logique. Il faut sans doute rendre l'électricité plus dangereuse, sinon les Voltaïques sont désavantagés ? Je pense que les versions 0.6 à 0.8 peuvent faire l'objet d'une seule livraison. »
> S'appuie sur les books [01](01-les-trois-feux.md) (§3 et §4 : familles, travail du métal, triangle de combat), [02](02-crafting.md) (§6 domaines, §9 maillon faible, §10 réparation, §12.1 la lame, §14 bis gamme bushcraft, §15 équilibrage), [03](03-bibliotheque-et-savoir.md) (§4 qualités d'outil, §5 savoir), [04](04-siderurgie-et-chimie.md) (§2 sidérurgie, §3.8 électrochimie), [06](06-zombies.md) (§2 corps, §3 signature, §8 et §9 combat et défense), [07](07-economie.md), [11](11-agriculture-elevage-alimentation.md) (§10 chasse), [15](15-univers.md), [21](21-perimetre-phase-0.md), [22](22-quetes-et-objectifs.md), [23](23-cooperative-et-combat.md) (§4 et §5) et [24](24-ameliorer-sa-base.md), sur le code de la version 0.5.3 et sur la proposition P-002 (`PROPOSITIONS.md`, lue sans être modifiée).

---

## 0. Ce qui change en v0.2

### 0.1 Les décisions, en bref

| Sujet | Décision (2026-10-09) | Où |
|---|---|---|
| **L'autonomie** | Règle d'or : chaque famille fait **seule** sa base (arme de métier ★ et ★★, outils, installations) ; les autres familles n'ouvrent que les **améliorations** | §2.5, §7 |
| **L'électricité** | Elle devient **dangereuse** : une décharge longue à la tête d'un Éteint raidi ou à terre **le détruit** (« il grille »). Le coût en Wh et l'étourdissement restent | §5.1, §8.2 |
| **L'équilibre** | Un tableau chiffré met côte à côte la lame, l'arme électrique, l'arbalète et l'arc, aux niveaux ★, ★★ et ★★★. Chacune a son terrain | §8.4 |
| **Les huit questions** | Toutes à « oui » ; la n° 8 à « les deux » | §12 |
| **La livraison** | Les lots 0.6, 0.7 et 0.8 deviennent **une seule version, la 0.6**, en neuf chantiers parallèles et trois vagues | §10 |

### 0.2 Déjà corrigé dans le code (2026-10-09)

- **La machette trouvée** s'appelle désormais **« machette de fortune »** : « une tôle d'acier découpée et meulée, un manche de bois ficelé » (`VESTIGES.machette`). Ses valeurs baissent : **solidité 40, dégâts 1,2** (`ARMES`, `combat.ts`). Elle n'a rien d'une lame forgée : c'est une lame **★** (§4.2), et la **machette forgée** des Charbonniers (§4.3) est un autre objet.
- **La lame ébréchée ne se démonte plus en lame de ressort** : c'était illogique (un éclat de lame n'est pas un ressort) et cela créait de la valeur à partir de rien. Sa description dit maintenant : « L'acier est bon : **un Charbonnier saura le reforger**. » Le reforgeage est au §4.4.

---

## 1. L'état des lieux (code 0.5.3)

### 1.1 Ce que chaque famille sait faire en propre

Aujourd'hui, une recette de famille est **réservée** à sa famille : les autres ne la voient pas (`recettesConnues`, `commun/src/recettes.ts`). Seuls les niveaux des lignées de la base (Book 24) connaissent le surcoût ×1,5 hors famille (`SURCOUT_AUTRE_FAMILLE`, `lignees.ts`).

| Famille | Recettes propres | Installations | Ce qu'elle vend | Carnet « Le métier » (Book 22 §3.2) |
|---|---|---|---|---|
| 🔥 **Charbonniers** | Meule de charbonnière (10 bûches, 4 branches) ; foyer de forge (8 pierres, 1 barre de métal, 2 branches) ; **lame forgée** (1 lame de ressort + 1 kg de charbon, Marteler 2, 90 min de travail lourd, à la forge) | Charbonnière, forge | Lames forgées, charbon | Charbonnière → défourner → forger une lame → la vendre |
| ⚙️ **Mécanistes** | Pédalier universel (cadre, chaîne, roue de vélo, 2 bûches) ; accessoires **meule** (couteau → couteau aiguisé) et **dynamo** | Pédalier | Électricité de pédalage, affûtage | Meule → affûter → dynamo → déposer l'électricité |
| ⚡ **Voltaïques** | Banc de recharge (2 bûches, 1 barre de métal) ; poser le panneau solaire de la station | Banc, panneau | Électricité, composants | Panneau → l'installer → 20 Wh → déposer |

Le kit de départ ajoute à chaque famille ses outils : marteau et pierre à feu (🔥), scie et corde (⚙️), lampe à dynamo, petite batterie (50 Wh) et frontale (⚡). Les **réparations** suivent le Book 23 §4.3 : le bois à l'établi, **les lames à la meule du pédalier**, le métal à la forge.

**Le constat** : chaque famille a **une chaîne-vitrine** de quatre gestes, mais pas encore de **métier** au sens du Book 02 §6. Une fois la lame vendue ou la batterie déposée, plus rien ne distingue un Charbonnier d'un Mécaniste au combat ou à l'établi.

### 1.2 Les armes en jeu

Toutes au contact (`ARMES`, `commun/src/combat.ts`). Il faut **3 points** au torse pour faire tomber un Éteint (4 pour un Équipé) ; le coup appuyé compte double ; à terre, n'importe quel coup l'achève, sauf le tranchant sur un casqué.

| Arme | Origine | Type | Dégâts | Coup / appuyé (ms) | Allonge | Solidité | Tue à la tête |
|---|---|---|---|---|---|---|---|
| Masse | Vestige (Coopérative) | Contondant | 2,5 | 950 / 1 250 | 1,6 | 70 | Oui |
| Hache | Tête trouvée + manche | Tranchant | 2 | 700 / 950 | 1,7 | 60 | Oui |
| Pied-de-biche | Vestige | Contondant | 1,5 | 600 / 880 | 1,5 | 120 | Oui |
| **Machette de fortune** (2026-10-09) | Vestige | Tranchant | **1,2** | 500 / 750 | 1,6 | **40** | Oui |
| Marteau | Kit 🔥 | Contondant | 1,5 | 600 / 850 | 1,5 | 80 | Oui |
| Barre de métal | Vestige | Contondant | 1,5 | 650 / 900 | 1,9 | 100 | Oui |
| Lance | Épieu + couteau + ficelle | Perçant | 1,2 | 650 / 900 | 2,6 | 40 | Oui |
| Lame forgée | 🔥 | Tranchant | 1 | 480 / 720 | 1,4 | 60 | Oui |
| Gourdin | Commun | Contondant | 1 | 550 / 800 | 1,5 | 25 | Non |
| Épieu | Commun | Perçant | 0,8 | 650 / 900 | 2,3 | 30 | Non |
| Couteau aiguisé | ⚙️ (meule) | Tranchant | 0,7 | 420 / 650 | 1,25 | 40 | Non |
| Couteau | Kit | Tranchant | 0,5 | 420 / 650 | 1,2 | 40 | Non |

Aucune arme à distance : la 0.6 apporte le **lancer** (pierre, réveil, hachette, Book 23 §5), avec un bouton, un arc de visée et un serveur qui juge la trajectoire. Elle apporte aussi, désormais, tout le métier des familles (§10).

### 1.3 Les matières qui existent

| Sorte | Matières |
|---|---|
| **Nature** | Branche, bûche, pierre, fibres (joncs), fruits, cèpes, poule (→ 4 portions de volaille crue) |
| **Fabriquées** | Ficelle, corde, charbon de bois |
| **Métal récupéré** | Lame de ressort (ressort de camionnette, « la meilleure matière pour une lame »), barre de métal, tête de hache, et les débris d'arme : **lame ébréchée** (ne se démonte plus : un Charbonnier la reforge, §4.4), ferraille tordue (→ barre) |
| **Vestiges utiles plus tard** | Rouleau de fil de fer, bocal de clous, chambre à air, rallonge et câbles de démarrage (cuivre), cric, roulements (rare), alternateur de tracteur (rare), étau, sécateur, grillage, pied-de-biche, ceinture de sécurité |
| **Treize composants** (sans aucun usage aujourd'hui) | Fil de cuivre, petit moteur, pile, cellule lithium, aimant, LED, résistance, verre, aluminium, plastique, papier, **petit ressort**, caoutchouc |

**Ce qui manque** pour un vrai métier : des **essences de bois** (le Book 03 §5.3 dit que les Mécanistes reconnaissent le bois par essence, mais tous les arbres sont du décor ou des fruitiers) ; les **sous-produits** de la poule (plumes, os) ; une **qualité** d'objet (les étoiles du Book 02 §9 ne sont pas codées, et l'inventaire compte des types, pas des exemplaires) ; un usage pour les composants.

### 1.4 Ce que la demande change dans les books

Quatre choses : l'arc n'est plus mécaniste mais commun (Books 01, 06, 11) ; le combat des Charbonniers passe de la poudre noire aux **lames** ; l'électricité **étourdit, et, maintenue à la tête, détruit** (Books 01, 06) ; **chaque famille fait seule sa base** (règle d'or, §2.5). Le détail est au §11.

---

## 2. Le principe

### 2.1 Un métier, c'est trois choses

1. **Une filière** : une chaîne de transformations qu'on maîtrise de bout en bout (le charbon jusqu'à la lame trempée ; la cellule jusqu'à la matraque ; la planche jusqu'à l'arbalète).
2. **Une gamme** : des objets dont les **autres familles ont envie** chaque semaine (une lame s'use, une batterie se vide, un carreau se perd).
3. **Une qualité qui monte** : la règle du maillon faible (Book 02 §9). La famille native atteint les **étoiles hautes** ; les autres, rarement.

### 2.2 Trois façons d'avoir un objet de métier

| Voie | Coût | Qualité | Pour qui |
|---|---|---|---|
| **Le fabriquer dans sa famille** | Normal | Jusqu'à ★★★★★ | La famille native |
| **Le fabriquer hors de sa famille** | **×1,5** en matières et en temps (Book 01 §5) | **Plafonnée à ★★** | Celui qui a appris la recette (§2.3) |
| **L'acheter ou l'échanger** | Le cours du Comptoir, ou ce qu'on négocie | Celle du fabricant | Tout le monde : c'est la voie voulue (Book 02 §12.1) |

Le plafond à ★★ est la vraie raison d'acheter : un Mécaniste **peut** forger une machette, mais elle cassera deux fois plus vite que celle d'un Charbonnier. Personne n'est bloqué ; tout le monde a intérêt à commercer.

### 2.3 Apprendre la recette d'une autre famille (décision 3)

Les recettes des autres familles sont **montrées grisées**, avec la mention « chez les Charbonniers » (P-002, recette pressentie du Book 03 §5.1). Elles s'ouvrent de deux façons :

- **la leçon d'un joueur** de la famille (Book 03 §5.4 : ensemble, au même endroit, quelques minutes ; l'enseignant gagne du rayonnement une fois par élève) ;
- **un manuel** trouvé dans un lieu de fouille (le *Manuel du forgeron amateur*, le *Guide de l'électricien du dimanche*, *L'Arbalète pour les nuls*), rare. Pour un joueur seul sur le serveur, un manuel par famille attend au coffre du directeur de la Coopérative.

Une fois ouverte, la recette coûte **×1,5** en matières et en temps, et ce qu'elle produit plafonne à **★★**.

Les installations de métier restent **utilisables par tous** quand on les visite (Book 24 Q5), sauf les machines qui demandent le savoir (la forge, le banc).

**Quand on voit les cartes grisées (0.7, arbre de progression, Book 02 §14 quater ; décisions Q6 et Q7 du 2026-10-09)** :

- **Pas d'emblée.** Avant la 0.7, un nouveau joueur voyait 44 à 49 cartes grisées des autres familles dès le premier clic sur Fabriquer. Elles sont désormais **cachées** jusqu'au **déclencheur A** : une visite au **Comptoir**, un **échange**, une **rencontre** (rester une minute à moins de 3 m d'un joueur d'une autre famille) ou **voir faire** quelqu'un.
- **Ensuite, repliées** : une ligne par famille, « Chez les Voltaïques · 20 recettes », qu'on déplie d'un doigt.
- **Dépliées une à une** quand on en a besoin : la recette qu'on a **vu faire** (à moins de 5 m d'un joueur qui fabrique), celle dont on **tient le produit** (une machette forgée dans le sac fait voir « Forger une machette, chez les Charbonniers »), celle qui est la **pièce** d'une recette qu'on voit (le ressort retrempé pour l'arbalète lourde).
- **Voir faire** une recette commune ou de sa famille la **dévoile** ; voir faire celle d'une autre famille la montre seulement, grisée : la meilleure publicité pour une leçon.
- **La leçon et le manuel dévoilent** en même temps qu'ils apprennent : un manuel ouvre et montre toutes les recettes de sa famille. Le ×1,5 et le plafond ★★ ne changent pas.
- Les personnages d'avant la 0.7 voient eux aussi le nouvel affichage (décision Q4).

### 2.4 Les garde-fous du Book 02 §15

La famille native produit au moins 20 % moins cher (×1,5 hors famille : 33 %), et personne ne paie plus de 3 fois la voie la moins chère. Chaque métier paie dans **sa monnaie** (Book 01 §5) : 🔥 le charbon et le bruit, ⚡ les Wh et les composants rares, ⚙️ le temps et les calories. **Rien de puissant ne sort d'une quête** (Book 22 §1).

### 2.5 La règle d'or : chaque famille est autonome pour sa base

Au début d'un serveur, toutes les familles ne sont pas là. Un Voltaïque seul doit pouvoir se défendre, un Mécaniste seul doit pouvoir monter son arbalète. D'où la règle, appliquée à **chaque recette** de ce book :

> **Seul, on fait sa base. Ensemble, on la fait mieux.**

1. **Chaque famille fabrique seule son niveau de base**, avec ce qu'elle trouve et ce qu'elle sait faire : son **arme de métier ★ et ★★**, ses **outils de base**, ses **installations de base**.
2. **Les dépendances entre familles n'ouvrent que les améliorations** : les niveaux **★★★ et plus** (plus tôt, moins cher), les **variantes supérieures** (arbalète lourde, glaive, matraque à électrodes forgées), les **accessoires** (ventilateur, soufflet à manivelle, manche tourné).
3. **Elles ne bloquent jamais le cœur d'une famille.** Si une recette de base demandait une pièce d'une autre famille, elle reçoit une **voie autonome**, plus modeste : matière de récupération, qualité moindre, geste plus lent.
4. **Le ★★★ reste possible seul**, par un chemin plus long : un outil maison, un vestige rare ou la **maîtrise** (10 exemplaires de la même sorte : +1 étoile, Book 03 §5.4). Avec une autre famille, on y arrive plus vite, et l'on va plus haut.

**Les voies autonomes ajoutées en v0.2** (le détail est dans chaque chapitre) :

| Ce qui bloquait la base | Voie autonome | Ce qu'elle coûte de plus |
|---|---|---|
| ⚡ Achever ce que la matraque met à terre demandait le **couteau de forge 🔥** | La matraque **détruit elle-même** : décharge longue à la tête (§5.1) | 1 Wh par Éteint |
| ⚡ La matraque demandait une **raquette anti-moustiques** et un **pack de cellules** | La **matraque de fortune** : le flash d'un appareil photo jetable, la **petite batterie du kit**, un gourdin (§5.3) | ★ : raidit moins longtemps, 2 kg à porter |
| ⚡ Sans soleil (hiver gris), plus de recharge sans le **pédalier ⚙️** | **La manivelle de la lampe à dynamo** du kit recharge un pack (§5.4) | Lent : 1 Wh par minute réelle, 10 d'endurance |
| ⚙️ L'arc d'acier de l'arbalète demandait un **ressort retrempé 🔥** | **Arbalète à arc de frêne** (★), à **lame de ressort brute** (★★), à **arc d'if** (★★★, les Mécanistes voient l'if) (§6.1) | Moins de portée, moins de dégâts |
| ⚙️ Monter l'arbalète demandait **Serrer 1**, un outil qu'aucun kit mécaniste ne contient | La **clé plate** entre dans le kit ⚙️ (Serrer 2) | — |
| ⚙️ L'arbrier se taillait au **ciseau 🔥** | La **scie du kit** (Scier le bois 2) suffit ; le ciseau donne +1 étoile | — |
| ⚙️ Le piège à mâchoires demandait **2 ressorts retrempés 🔥** | **Mâchoires de fortune** : 2 lames de ressort brutes (§6.3) | Tient 10 s au lieu de 20, se fausse en 5 prises |
| 🔥 Réparer sa propre lame demandait la **meule ⚙️** | **Reprendre la lame à la forge** (§4.4) | ½ kg de charbon |
| 🔥 La lame demandait une **lame de ressort** trouvée | Forger le **fer doux** (barre, clous, lame ébréchée) (§4.2) | Plafond ★★ |
| 🔥 La forge ventilée demandait le **ventilateur ⚡** ou le **soufflet à manivelle ⚙️** | Le **soufflet double** en cuir ou en bâche, à pomper soi-même (§9.3) | On pompe : 2 d'endurance par minute de forge |
| Tous : la **perche de frêne** demandait Couper 2 (couteau aiguisé ⚙️ ou lame 🔥) | Le **couteau du kit** (Couper 1) la coupe, avec le malus du Book 03 §4 | Temps ×1,5 |
| ⚡ La clôture demandait un module **★★★★** (bobine d'allumage) | **Clôture de fortune** au module de raquette (§5.3) | Raidit 1 s, ligne de 4 m |

**La règle d'or s'applique aussi au dévoilement (0.7, arbre de progression, Book 02 §14 quater et annexe A)** :

- **Toute la base d'une famille se dévoile seul**, par des déclencheurs qu'on vit seul : le **seuil du métier** (l'abri posé et un premier danger surmonté, ou l'étape « La famille » du tutoriel, ou 2 h de jeu), son propre premier charbon, sa propre arme, une matière ramassée. **Aucune recette des paliers « les tiens » et « le métier » ne demande une rencontre.**
- **Au seuil, chaque famille voit son atelier et son arme de base** : une recette-but, pas une liste. 🔥 le foyer de forge, puis la meule de charbonnière, le couteau au fer doux dès le premier charbon, la machette ; ⚡ le banc de recharge et la matraque de fortune (l'appareil photo jetable y fait penser aussi) ; ⚙️ le pédalier (le cadre du vélo démonté y fait penser), puis l'arbalète, ses pièces par la chaîne. Rien du métier ne se dévoile avant l'atelier, sauf ce qu'une quête demande.
- **Les voies autonomes se dévoilent en même temps que la voie « avec les autres », jamais après** : le Mécaniste voit « Arc d'arbalète (frêne) » dès l'arbalète, et « (ressort retrempé) » seulement quand il en tient un.
- **Au palier de l'œuvre, la rencontre est un raccourci, pas une porte** : le Charbonnier seul ouvre le ressort retrempé et les électrodes par la **pratique** (5 lames forgées, une fois passé au Comptoir). Il ne peut pas encore les vendre à personne, mais il le pourra le jour où quelqu'un arrive.
- **Les matières de base existent dans le monde ordinaire** depuis la 0.7 : la couche de déchets de l'Abondance (Book 26) donne barres de métal, lames de ressort, appareils jetables, petites batteries, vélos, petits ressorts et plumes, sans dépendre d'un seul point de fouille.
- **Mesuré** (`npm run rythme`, neuf parcours, trois par famille) : aucune famille ne reste bloquée, et chaque ingrédient demandé se trouve.

---

## 3. Le socle commun : l'arc pour tous (décision 1)

### 3.1 Pourquoi pour tous

L'arc simple, taillé d'une seule pièce dans une perche, est la technique de jet la plus ancienne et la plus répandue : il n'a rien d'un savoir de métier. Le Book 01 le plaçait au palier I des Mécanistes ; on le **sort du métier**, et les Mécanistes gardent ce qui est vraiment mécanique : **l'arbalète**, les pièges et le tour. Ils gardent aussi un avantage sur l'arc, qui leur vient de leur savoir (Book 03 §5.3) : **ils reconnaissent les essences**, donc ils trouvent la meilleure perche (§6.2).

### 3.2 Les matières nouvelles de l'arc

| Matière | Où | Comment | Énergie grise |
|---|---|---|---|
| **Perche de frêne** | Deux **frênes** à la lisière de chaque terrain (nouvelle ressource : un arbre qu'on reconnaît à ses bourgeons noirs) ; ils repoussent en 6 h réelles | Couper 2 (couteau aiguisé, couteau de forge, serpe), **ou le couteau du kit, ×1,5** ; 1 perche par coupe | ≈ 10 wotts |
| **Bâton d'if** | La **haie d'ifs** taillés en boules du parking de la Coopérative (les Abondants la faisaient tailler tous les mois) ; et, pour les Mécanistes seulement, un if repéré au fond du bois | Couper 2 ; rare, 1 par visite | ≈ 30 wotts |
| **Plumes** | **Sous-produit** de « Plumer et vider la poule » : 1 poignée de plumes | Rien de plus | ≈ 2 wotts |
| **Os** | Même sous-produit : 1 os de poule | Rien de plus | ≈ 2 wotts |
| **Fûts** | Une branche droite donne 3 fûts | Couper 1, redressés au-dessus d'un feu | ≈ 3 wotts le fût |
| **Corde d'arc** | 3 ficelles retordues (★★), **1 corde** du kit défaite et retordue (★★★), **ou** 1 bobine de **fil dentaire** (★★★★, vestige de salle de bain : « Menthe Glaciale, 50 m ») | Rien ; 10 min | ≈ 15 wotts |

> L'if est le bois d'arc idéal (l'arc anglais), mais il pousse lentement et toutes ses parties sont toxiques : on n'en mange pas les baies, et l'examen le dit. Le frêne, l'orme et le noisetier font de très bons arcs simples. C'est le réalisme bushcraft, sans dictionnaire.

### 3.3 Les recettes

| Recette | Matières | Outil | Où | Durée (jeu) | Résultat |
|---|---|---|---|---|---|
| **Arc de fortune** | 1 perche de frêne **ou** 1 branche droite, 1 ficelle | Couper 1 | — | 20 min, légère ; **pas de séchage** | **Arc ★** : le bois vert fatigue vite |
| **Ébaucher un arc** | 1 perche de frêne (ou 1 bâton d'if) | Couper 1 | Établi | 45 min, moyenne | Une **ébauche d'arc**, qui doit sécher (processus passif : 2 h réelles, même hors ligne, à l'abri) |
| **Monter l'arc** | 1 ébauche sèche, 1 corde d'arc | Couper 1 | Un feu allumé (on durcit le ventre de l'arc à la chaleur) | 20 min, légère | **Arc simple** : sa qualité est celle du maillon faible, bois ou corde (frêne ★★★, if ★★★★ ; corde de ficelle ★★) |
| **Flèches durcies** | 1 branche (3 fûts), 1 poignée de plumes, 1 ficelle | Couper 1, feu | — | 20 min, légère | 3 flèches à pointe durcie au feu |
| **Flèches à pointe d'os** | 1 branche, 1 plumes, 1 ficelle, 1 os | Couper 1 | — | 25 min, légère | 3 flèches |
| **Flèches à pointe de clou** | 1 branche, 1 plumes, 1 ficelle, 1 bocal de clous pour 12 pointes | Couper 1, **Marteler 1** (une pierre suffit) | — | 25 min, légère | 3 flèches |
| **Flèches à pointe d'acier** (amélioration) | 1 branche, 1 plumes, 1 ficelle, 3 **pointes d'acier** (🔥, §4.3) | Couper 1 | — | 20 min, légère | 3 flèches, qui cassent moins |

Toutes ces recettes se font **seul**, quelle que soit la famille. Seule la pointe d'acier vient d'un Charbonnier : c'est une amélioration, pas un passage obligé.

L'**arc de tir sportif** (vestige rare, bureaux de la Coopérative : « Club de tir à l'arc d'entreprise, séminaire 2031 ») est un arc ★★★★★ tout fait ; ses flèches en carbone (vestige) se récupèrent sans casser, jusqu'à ce qu'on les perde.

### 3.4 Les règles du tir

Le tir **réutilise le lancer de la 0.6** (Book 23 §5) : même bouton, même arc de visée, même serveur de projectiles. Il n'y a rien de plus à apprendre.

| Règle | Ce qu'elle dit |
|---|---|
| **Préparer** | Dans le sac, l'arc se met « **Prêt à tirer** » (l'objet rapide). A reste l'arme de contact : on a les deux à la fois |
| **Bander et viser** | **Maintenir** le bouton Lancer : le personnage bande, l'arc de visée s'accroche à l'Éteint le plus proche devant soi (sur ordinateur, la souris) |
| **Tir rapide ou tir plein** | Relâcher **avant 1,5 s** : tir rapide, dégâts faibles, au torse. **Après 1,5 s** : tir plein. Le cercle de visée **se referme** quand l'arc est bandé à fond ; on le voit, pas de règle cachée. Après chaque tir, **encocher** prend 1 s |
| **Toucher** | Dans la **portée utile**, la flèche touche la cible accrochée. Au-delà, la chance baisse jusqu'à zéro à la portée maximale ; le cercle passe du blanc à l'orange |
| **Tuer à la tête** | Un **tir plein**, dans la **portée de tête** (arc ★ : 4 m ; ★★ : 5 m ; ★★★ : 6 m ; if ★★★★ : 7 m), avec une pointe d'os, de clou ou d'acier, **détruit** l'Éteint (Book 06 §2.2). Plus loin, le tir plein touche le torse. La pointe durcie au feu ne tue pas à la tête. Le cercle devient **rouge** quand la tête est à portée |
| **Le casque** (décision 5) | La règle unique du Book 23 §4.2 ne change pas : le casque arrête le **tranchant**. La flèche est **perçante** : elle **passe par la visière ouverte**, de face seulement, et à la **moitié** de la portée de tête |
| **Les munitions** | La flèche qui manque tombe au sol, **ramassable** (perdue dans la mare). Celle qui touche reste plantée et se reprend sur le corps, sauf si elle casse : **une sur deux** pour la pointe durcie, **une sur trois** pour l'os et le clou, **une sur cinq** pour l'acier. Le message le dit |
| **L'endurance** | Bander coûte 6 d'endurance ; tenir bandé plus de 3 s en coûte 2 par seconde (le bras tremble) |
| **Le bruit** | La corde claque à **3 m** ; l'impact s'entend à 4 m. C'est l'arme la plus silencieuse du jeu : un atout contre des Éteints guidés par l'oreille (Book 06 §2.1) |
| **Le corps à corps** | On ne tire pas quand on est **saisi** : il faut d'abord se dégager (B) |

**La chasse.** Avec l'arc, les **lapins** du terrain deviennent chassables (Book 11 §10), dès que la faune vit côté serveur (0b). Une flèche suffit ; le lapin donne 2 portions de viande, une peau (plus tard) et **des boyaux** pour une corde d'arc ★★★★ séchée.

---

## 4. Les Charbonniers 🔥 : les lames

### 4.1 La filière

| Étape | Ce qui existe | Ce qu'on ajoute |
|---|---|---|
| **1. Le charbon** | Meule de charbonnière : 10 bûches → 4 kg en 72 min réelles | Rien (la charbonnière en fût du Book 24 §3.1 viendra avec la lignée) |
| **2. La forge** | Foyer de forge (≈ 900 °C, palier I) | **Une lignée de la forge** (Book 24) : niveau 2 **forge ventilée** (tuyère d'argile ; soufflet double en cuir ou en bâche, **seul** ; ou ventilateur 12 V ⚡, ou soufflet à manivelle ⚙️, pour ne plus pomper ; ≈ 1 300 °C) ; accessoire **enclume** (§9.3) |
| **3. L'acier** | Lame de ressort, barre de métal, débris | **Une qualité par matière** (§4.2) et quatre vestiges nouveaux (lime usée, soc de charrue, bidon d'huile, rail) |
| **4. Forger** | Lame forgée (1 ressort, 1 kg de charbon, 90 min) | Une **gamme** (§4.3) |
| **5. Tremper et revenir** | Compris dans la lame forgée | **Un geste à part**, avec le choix du bain (§4.2) |
| **6. Emmancher** | — | À l'établi : un manche (branche ; ou manche tourné ⚙️ pour une étoile de plus), ficelle ou rivets |
| **7. Affûter, reprendre** | La meule ⚙️ | Les Mécanistes affûtent ; les Charbonniers **reprennent et reforgent** à la forge (§4.4, décision 8) |
| **8. Le fer neuf** | — | **Bas fourneau** et minerai des marais (Book 04 §2), **après la 0b**, quand la ferraille se raréfie |

> On ne fond jamais l'acier (Book 04 §2.1) : on **forge** de l'acier récupéré. Tant qu'il reste des camionnettes, personne ne cémente. C'est la transition du Book 04 §5, et elle donne aux Charbonniers un métier pour toute la durée d'un cycle.

### 4.2 La qualité d'une lame (décision 2)

La qualité ★ est portée **par exemplaire**, pour les seuls **objets de métier** (lames, arcs, arbalètes, armes électriques). Un caillou n'a pas d'étoile. La règle du maillon faible (Book 02 §9), appliquée aux lames :

```
étoiles = min( acier, trempe, forge et outils ) + 1 si la sorte est maîtrisée   (plafond ★★★★★ ; ★★ hors famille)
```

| Facteur | ★ | ★★ | ★★★ | ★★★★ | ★★★★★ |
|---|---|---|---|---|---|
| **Acier** | Tôle, ferraille rouillée | Fer doux : barre de métal, clous, ferraille (il ne prend pas la trempe) | Soc de charrue, lame de scie, **lame ébréchée** reforgée | Lame de ressort (camionnette) | Lime usée (acier à outils) |
| **Trempe** | Aucune | Sans revenu (la lame est cassante) | Trempe à l'eau (risque) | Trempe à l'huile | Trempe à l'huile, maîtrisée |
| **Forge et outils** | Un feu de camp, une pierre | Foyer de forge, marteau | Foyer de forge, marteau, **pinces de forge**, une enclume trouvée (étau, tête de masse) | Forge ventilée, pinces | Forge ventilée, enclume de rail |

**Ce que le Charbonnier fait seul, et ce que les autres lui apportent :**
- **Seul, dès le premier jour** : le marteau du kit, le foyer, une lame de ressort trouvée ou du fer doux, une trempe à l'eau → **★★**. S'il n'a pas de ressort : du fer doux, ★★ aussi.
- **Seul, en s'y mettant** : les pinces (sa propre recette) et un étau trouvé → **★★★** ; la graisse de volaille pour une trempe à l'huile ; la forge ventilée au soufflet double (on pompe) → **★★★★** ; la maîtrise → ★★★★★.
- **Avec les autres** : le ventilateur ⚡ ou le soufflet à manivelle ⚙️ rendent la forge ventilée **sans effort** ; le manche tourné ⚙️ et le dérouillage ⚡ donnent **une étoile de plus** à une pièce.
- **La trempe à l'eau** est toujours possible, mais **une lame sur trois se fend** : elle redevient une lame ébréchée, à reforger (Book 02 §9 : jamais de disparition totale). Le risque est affiché avant le geste.
- **La trempe à l'huile** est sûre ; il faut un **bidon d'huile** (vestige du garage, 5 L, vingt trempes : « Huile Turbo Max Énergie, pour moteurs de plus de 400 chevaux »), ou de la **graisse** de volaille (une trempe).
- **La maîtrise** (Book 03 §5.4) : après **10 lames** forgées de même sorte, la forge est maîtrisée pour cette sorte : +1 étoile, plafond ★★★★★.
- **Hors famille** : plafond ★★ (§2.2), quelle que soit la matière.
- **La machette de fortune** trouvée (§0.2) compte comme une lame **★**.

**Ce que font les étoiles** (Book 02 §9), pour toutes les armes de métier :

| | ★ | ★★ | ★★★ | ★★★★ | ★★★★★ |
|---|---|---|---|---|---|
| **Solidité** | ×0,5 | ×0,75 | ×1 | ×1,5 | ×2 |
| **Dégâts** | −20 % | −10 % | référence | +10 % | +20 % |

Pour l'arme électrique, les étoiles règlent la durée du raidissement et de la décharge longue (§8.2) ; pour l'arc et l'arbalète, les dégâts et la portée de tête (§8.3).

Les étoiles s'affichent sur la fiche de l'objet et sur sa case du sac. La valeur au Comptoir suit l'énergie grise, plus le cours : une lame ★★★★★ se vend mieux, parce qu'elle dure deux fois plus.

### 4.3 La gamme

Les valeurs de combat sont à ★★★ (la référence) ; elles sont reprises au §8. Toute la gamme se fait **seul** ; l'apport des autres familles est noté en italique.

| Objet | Matières | Outil, installation | Durée | Usage |
|---|---|---|---|---|
| **Pinces de forge** (le premier objet du forgeron) | 1 barre de métal, ½ kg de charbon | Marteler 2, forge | 40 min, lourde | Qualité **Saisir à chaud 2** (Book 03 §4) : sans elles, pas plus de ★★ |
| **Couteau de forge** (la lame forgée d'aujourd'hui, renommée) | 1 lame de ressort (ou 1 barre de métal : fer doux), 1 kg de charbon, puis un manche | Marteler 2, forge ; établi | 90 min + 15 | **Couper 3**. Arme vive |
| **Hachette** | ½ barre de métal, ½ lame de ressort (la **mise d'acier** : on soude le tranchant d'acier sur un corps de fer), 1 kg de charbon, 1 branche | Marteler 2, forge ; établi | 75 min | **Fendre 2**, arme, **se lance** (Book 23 §5) |
| **Hache forgée** | 1 barre de métal, 1 lame de ressort (mise d'acier), 2 kg de charbon, 1 bûche (le manche) | Marteler 2, forge ventilée ; établi | 2 h | **Fendre 3** ; remplace la tête de hache rouillée qu'on ne trouve plus |
| **Machette forgée** (l'arme de métier, §8.4) | 2 lames de ressort (ou 2 lames ébréchées, ou 2 barres : fer doux), 1,5 kg de charbon, 1 branche, 2 rivets (ou 1 ficelle) | Marteler 2, forge ; établi | 2 h | Couper 2, arme vive et **durable**. *Manche tourné ⚙️ : +1 étoile* |
| **Serpe** | 1 lame de ressort, 1 kg de charbon, 1 branche | Marteler 2, forge | 80 min | **Couper 2 et Élaguer** : une coupe de branches en donne 2 de plus, et une perche de frêne se coupe sans effort. Arme moyenne |
| **Glaive de ressort** (l'épée courte, décision 6) | 3 lames de ressort, 3 kg de charbon, 1 branche (*ou 1 manche tourné ⚙️*), 2 rivets | Marteler 2, **forge ventilée**, maîtrise du couteau | 4 h | L'arme la plus vive de la gamme. Réservé à la forge ventilée : c'est la pièce de vitrine du forgeron. Une **variante supérieure**, pas une base |
| **Pointe de lance forgée** | ½ lame de ressort, ½ kg de charbon | Marteler 2, forge | 40 min | Remplace le couteau ligaturé : la **lance à pointe forgée** |
| **Pointes d'acier** (flèches et carreaux) | 1 lame de ressort, ou 1 rouleau de fil de fer (★★) | Marteler 2, forge | 45 min | **12 pointes** |
| **Rivets et clous forgés** | 1 barre de métal, 1 kg de charbon | Marteler 2, forge | 60 min | 20 pièces : manches, coffre cerclé, arbalète |
| **Ciseau à bois et burin** | 1 lame de ressort (pour les deux), 1 kg de charbon | Marteler 2, forge | 60 min | Nouvelles qualités **Tailler le bois 2** (mortaises : +1 étoile à l'arbrier d'arbalète, tour) et **Trancher le métal 1** (couper une tôle, un fil d'acier) |
| **Ressort retrempé** (l'arc d'arbalète) | 1 lame de ressort, 1 kg de charbon, 1 trempe à l'huile | Marteler 2, forge | 60 min | Rend sa **nervosité** à un ressort fatigué : l'arbalète ★★★★ et l'arbalète lourde des Mécanistes (§6.1) |
| **Électrodes forgées** | ½ lame de ressort, ½ kg de charbon | Marteler 2, forge | 30 min | Deux pointes d'acier : les contacts de la **matraque ★★★★** des Voltaïques (§5.3) |

> **Le ton (Book 15).** Le forgeron de l'an 30 tire ses meilleures lames d'une camionnette de livraison « Livré en 20 minutes ou c'est gratuit ». La lime usée vient d'un « kit manucure de luxe » de quatre kilos. L'enclume, c'est le rail de l'embranchement des silos, où plus aucun train n'est passé depuis la Grande Panne.

### 4.4 La réparation et l'usure (décision 8 : les deux)

| Situation | Qui | Ce qu'on fait | Coût |
|---|---|---|---|
| **Abîmée** (sous 30 %) | Tous | Réparation de fortune (ficelle, chiffons) : remonte jusqu'à « abîmée » (Book 23 §4.3, inchangé) | 1 ficelle, 1 chiffon |
| **Abîmée** | ⚙️ (meule) | **Affûter** : remise à neuf (inchangé). Le geste le moins cher | Quelques minutes de pédalage |
| **Abîmée** | 🔥 (forge) | **Reprendre la lame** : chauffer, redresser, affûter à la lime. Remise à neuf, sans meule | ½ kg de charbon |
| **Cassée** (le débris « lame ébréchée ») | 🔥 | **Reforger** : la lame ébréchée redevient la **même arme**, à une étoile de moins ; ou elle sert d'acier ★★★ pour une autre pièce | 1 kg de charbon, la moitié du temps de forge |
| **Cassée** | Les autres familles | **Garder le débris** pour un Charbonnier, le lui vendre ou le lui confier (un petit commerce de ferraille). Il **ne se démonte plus** en lame de ressort (§0.2) | — |

Deux nouveautés : la **forge répare aussi les lames** (aujourd'hui, un Charbonnier ne peut pas réparer sa propre lame, puisque la meule est mécaniste) ; et le **reforgeage** donne une valeur au débris. Les Mécanistes gardent l'affûtage, moins cher et plus rapide : chacun son geste. Dans le code, `ATELIER_REPARATION.lame` accepte **les deux** installations : la meule du pédalier **ou** la forge.

### 4.5 Le prix du métier

- **Le bruit** : marteler s'entend à 40 m (`BRUIT_ACTION.lourd`), +50 % pour les Charbonniers (*Feu bavard*). Forger une machette, c'est 2 h de jeu de marteau : la forge doit être derrière des murs (Book 01 §4).
- **Le charbon** : un forgeron qui produit pour les trois familles brûle une charbonnière par jour.
- **Repère d'énergie grise**, procédé de référence : couteau de forge ≈ 215 wotts ; hachette ≈ 190 ; machette forgée ≈ 330 ; hache ≈ 380 ; glaive ≈ 620 ; 12 pointes d'acier ≈ 125.

---

## 5. Les Voltaïques ⚡ : l'électricité

### 5.1 Comment l'électricité agit sur un Éteint (décision du porteur : elle devient dangereuse)

Un Éteint ne **sent pas la douleur** : la fièvre grise a éteint tout ce qui n'est pas la faim. Un **aiguillon à bétail** (une décharge qui fait mal, sans plus) ne lui fait donc rien. En revanche, deux choses restent vraies :

1. **Ses muscles obéissent encore aux nerfs** : sinon, il ne marcherait pas. Une décharge, même brève, fait **contracter tous ses muscles à la fois** (la tétanie) : il **lâche prise** et **se raidit**. Une décharge longue sur un Éteint debout le **fait tomber**.
2. **Ce qui l'anime tient à peu de chose.** Le Book 06 §2.2 le dit : un coup solide à la tête le détruit, parce que tout est déjà abîmé chez lui, les os comme le reste. Le courant fait la même chose par un autre chemin : **une décharge longue, tenue une seconde contre la tempe, grille ce qui l'anime**. Il s'affaisse, et il ne se relève plus. Les Voltaïques disent qu'ils l'**éteignent pour de bon**.

Pourquoi ne pas tuer d'une simple décharge ? Parce qu'on ne tient pas des électrodes une seconde contre la tempe d'un Éteint qui se débat : il faut d'abord qu'il soit **raidi** (une décharge courte, un coup, un repousser) ou **à terre**. La mise à mort électrique est donc un **enchaînement en deux temps**, qui coûte du courant et du temps, mais qui se fait sans jamais se laisser saisir.

D'où la règle, la même pour toutes les armes électriques :

> **Électrique : une décharge courte le fait lâcher et le raidit. Maintenue sur un Éteint debout, elle le met à terre ; maintenue à la tête d'un Éteint raidi ou à terre, elle le détruit. Le casque n'y change rien.**

| Situation | Décharge courte (A) | Décharge longue (A maintenu) |
|---|---|---|
| **Éteint libre** (il marche, il saisit) | Il **lâche** et se **raidit** (2,5 s à ★★★) | Il **tombe à terre** (4 s) |
| **Éteint raidi ou étourdi** | Il reste raidi (la durée repart) | **Détruit** : « il grille » |
| **Éteint à terre** | **Détruit** (règle du Book 06 : au sol, tout coup l'achève ; la décharge va à la tempe) | Détruit |
| **Équipé** (casque, blouson) | **Même effet** : le courant passe le casque et le cuir | **Même effet**, y compris la destruction. C'est le **terrain** des Voltaïques |
| **Il tient quelqu'un** (soi ou un autre joueur) | **Il lâche aussitôt** : on sauve une prise | — |

**Le ton.** C'est cohérent avec le Book 15 (les Voltaïques sont les anciens de la Compagnie d'électricité) et avec le nom même des Éteints. Le message de la destruction le dit sobrement : « Il s'éteint. » L'effet visuel reste sobre aussi : un arc bleu, les muscles qui se tendent, les yeux blancs qui ternissent, une odeur de fusible. Pas d'explosion, pas de fumée noire.

**Ce qui ne change pas** : l'électricité **ne fait pas de dégâts au torse** (on ne « tape » pas avec), elle se paie en **Wh**, et sa force reste le **contrôle** : raidir, faire lâcher, mettre à terre. La clôture et la plaque de choc, elles, ne tiennent pas d'électrodes à la tempe : elles **raidissent** et **font tomber**, sans détruire (§5.3).

### 5.2 Les matières

| Matière | Où | Rôle |
|---|---|---|
| **Cellule lithium** (existe) | Démontage : batterie externe (4), perceuse (5), aspirateur robot (4), robot domestique (10) | Le réservoir des armes électriques |
| **Petite batterie** (existe, kit ⚡) | Kit de départ, 50 Wh | La source de la **matraque de fortune** : lourde (2 kg), mais là dès le premier jour |
| **Fil de cuivre, résistance, LED, petit ressort, caoutchouc** (existent) | Démontage | Câblage, contacts, isolant de la poignée |
| **Appareil photo jetable** (vestige nouveau, salon, commun) | Boutique, maisons | Un **condensateur** de flash : à lui seul, un étage haute tension de fortune ; avec la bobine, le claquement de la décharge longue. « Vingt-sept poses, toutes de son assiette. » |
| **Raquette anti-moustiques** (vestige nouveau, gadget, commun) | Boutique, bureaux | Un petit **étage haute tension** tout fait. « Électrocute les insectes et les ennuis. » |
| **Bobine d'allumage** (vestige nouveau, voiture, peu commun) | Épaves, atelier de la Coopérative | La vraie haute tension : la matraque ★★★ et la clôture |

**Les pièces intermédiaires**, toutes ⚡, toutes faisables **seul** :

| Pièce | Matières | Outil | Durée | Ce que c'est |
|---|---|---|---|---|
| **Pack de cellules** | 3 cellules lithium, 1 fil de cuivre, 1 ruban adhésif (ou 1 ficelle) | Visser 1 | 20 min | **12 Wh** portables, 0,2 kg. Se recharge au banc ou à la manivelle. Utile à toutes les familles (lampes, matraques) |
| **Module de décharge** | 1 appareil photo jetable (★) **ou** 1 raquette anti-moustiques (★★) **ou** (1 bobine d'allumage, 1 appareil photo jetable) (★★★), 1 fil de cuivre | Visser 1 ; banc à côté | 30 min | La haute tension. Au **poste de montage** du banc : +1 étoile |

**La qualité d'une arme électrique** (maillon faible, comme la lame) :

| Facteur | ★ | ★★ | ★★★ | ★★★★ | ★★★★★ |
|---|---|---|---|---|---|
| **Module** | Flash d'appareil jetable | Raquette anti-moustiques | Bobine d'allumage et condensateur | Bobine, montée au poste de montage | — (maîtrise) |
| **Source** | 4 piles | Petite batterie du kit | Pack de cellules | Pack de cellules triées (6 cellules, la moitié jetée) | — (maîtrise) |
| **Contacts** | — | Fil de cuivre nu, ruban | Fil de cuivre, poignée de caoutchouc | **Électrodes forgées 🔥** | Électrodes forgées, **manche tourné ⚙️** isolé |

Seul, un Voltaïque monte une matraque **★★ dès le premier jour** (raquette, petite batterie ou pack), **★★★ en s'y mettant** (une bobine trouvée dans une épave), **★★★★ par la maîtrise**. Les électrodes du Charbonnier donnent ★★★★ tout de suite, et le manche du Mécaniste ouvre ★★★★★.

### 5.3 La gamme

| Objet | Matières | Outil | Durée | Usage |
|---|---|---|---|---|
| **Matraque de fortune** (voie autonome) | 1 gourdin, 1 module ★ (le flash), la **petite batterie du kit** (ou 4 piles), 1 ficelle | Visser 1 | 20 min | Arme électrique **★**. La batterie pèse 2 kg dans le sac ; elle se recharge au banc comme toujours |
| **Matraque électrique** (« la Raquette ») | 1 gourdin, 1 module de décharge, 1 pack de cellules, 1 caoutchouc | Visser 1, Couper 1 | 40 min | **L'arme de métier** (§8.4), ★★ ou ★★★ selon le module. Sans charge, c'est un gourdin court |
| **Aiguillon de défense** | 1 épieu, 1 module de décharge, 1 pack, 2 fils de cuivre (les électrodes au bout) | Visser 1 | 45 min | La même décharge, **à 2,3 m** : on le tient à distance. La décharge longue à la tête y est plus lente (+0,3 s : on vise au bout d'une perche) |
| **Lampe de poche bricolée** | 1 pack, 4 LED, 1 boîte vide (le réflecteur) | Visser 1 | 15 min | Lumière blanche portée, **sans dynamo à tourner** ; 1 W (12 h). À vendre aux deux autres familles |
| **Alarme électrique** | 1 fil de fer (rouleau, 20 m), 1 pile, 1 LED, 1 petit ressort (le contact), 2 branches | Visser 1 | 20 min | Un fil tendu : un Éteint qui passe **allume la LED et fait vibrer l'alerte du joueur**. **Elle ne fait aucun bruit** : contrairement aux boîtes de conserve, elle ne l'attire pas. Le rapport d'absence la compte |
| **Clôture de fortune** (voie autonome) | 1 module ★★ (raquette), 1 rouleau de fil de fer, 6 branches, 3 morceaux de plastique, à moins de 6 m du banc | Visser 1 | 60 min | Une ligne de **4 m** ; l'Éteint qui la touche se raidit **1 s** et recule d'un pas. ≈ 2 W pris au banc |
| **Clôture électrique** (amélioration) | 1 électrificateur (1 module ★★★, 1 résistance, 1 fil de cuivre), 1 rouleau de fil de fer, 8 branches, 4 morceaux de plastique (les isolateurs), à moins de 6 m du banc | Visser 1, Couper 1 | 90 min | **Défense de la base** : une ligne de 6 m. ≈ 3 W pris au banc en continu (≈ 70 Wh par jour de calendrier, Book 01 §4). Un Éteint qui la touche se raidit 2 s et recule d'un pas ; il ne passe pas tant que le courant passe. **Trois Éteints qui poussent ensemble** la couchent (Book 06 §9.2 : ils poussent). Claquement à 5 m. **Elle ne détruit pas** : il faut quelqu'un pour achever |
| **Plaque de choc** (le piège électrique) | 1 tôle (enjoliveur ou casserole aplatie), 1 module, 1 pack | Visser 1 | 30 min | Posée dans un passage : le premier Éteint qui marche dessus **tombe à terre** (4 s). Une décharge, puis il faut la réarmer (0,5 Wh) |
| **Ventilateur de forge 12 V** (pour les 🔥) | 1 petit moteur, 1 pack ou un câble au banc, 1 plastique | Visser 1 | 20 min | **Accessoire de la forge** 🔥 : la ventilation devient passive (Book 04 §2.5) ; forge ventilée sans pomper |
| **Bain de dérouillage** | 1 casserole, 1 barre de métal sacrificielle, 50 Wh pris au banc | — | 12 h de jeu (passif) | **+1 étoile** sur un outil ou une arme rouillée (tête de hache trouvée, machette de fortune ; Book 04 §3.8). Un service à vendre |

> Le **taser à fléchettes** (deux dards au bout d'un fil) est hors de portée du bricolage : ses cartouches ne se fabriquent pas. On peut en faire un **vestige légendaire** des bureaux de la Coopérative (« Paralyseur de la Sécurité Compagnie, 2 cartouches »), mais ce n'est pas le métier : c'est une trouvaille.

### 5.4 Les Wh, sans tricher

| Usage | Coût | D'où vient le chiffre |
|---|---|---|
| **Décharge courte** (A) | **0,25 Wh** | Une décharge utile, c'est ≈ 100 J tenus 2 s, l'ordre de grandeur d'un aiguillon agricole. Le montage bricolé gaspille ≈ 90 % de ce qu'il tire : ≈ 900 J, soit 0,25 Wh |
| **Décharge longue** (A maintenu) | **1 Wh** (v0.1 : 0,5) | Une seconde pleine, à fond, et ce qui grille consomme : c'est le prix de la mise à mort |
| **Détruire un Éteint** | **1,25 Wh** | Une courte, puis une longue (ou une longue, puis une courte au sol) |
| **Un pack plein** | 12 Wh : **≈ 9 Éteints détruits**, ou 48 décharges courtes | 3 cellules de récupération, fatiguées (≈ 4 Wh utiles chacune) |
| **La petite batterie du kit** | 50 Wh (40 à la découverte) | `CAPACITES.petite_batterie` (`energie.ts`) ; 2 kg |
| **Recharger un pack au banc** | 12 Wh pris aux batteries du banc, 25 s réelles | Banc : 30 Wh par heure de jeu, rendement 85 % (`energie.ts`) |
| **Recharger à la manivelle** (voie autonome) | **1 Wh par minute réelle**, 10 d'endurance par minute | La lampe à dynamo du kit, tournée à la main (≈ 15 W de bras, rendement médiocre) |
| **Clôture** | ≈ 3 W continus (fortune : 2 W) | Book 01 §4 : 2 à 5 W |
| **Lampe bricolée** | 1 W | Quatre LED |

- **Le pack se vide** en se servant, et se lit dans le sac en barre de charge (comme la solidité). Vide, la matraque est un gourdin court ; l'alerte « Plus de courant » s'affiche une seule fois.
- **Une visite de la Coopérative** (24 Éteints, Book 23 §3) demande ≈ 2 packs, soit ≈ 30 Wh : ≈ 30 wotts de courant, plus l'usure de la matraque. C'est du même ordre que l'usure d'une machette sur la même visite (§8.4).
- **Le banc ne recharge que si les batteries ont de quoi** : l'hiver gris (0b) vide les batteries et gêne les Voltaïques. La manivelle les empêche d'être **désarmés** ; le pédalier ⚙️ les remet **à l'aise**. C'est la faiblesse voulue de la famille (Book 01 §4 : énergie intermittente), sans être un mur.
- **Courant propre** (Book 01 §4) : la production et le stockage ne font pas de bruit. La **décharge**, elle, crépite à 6 m (la courte) et claque à 8 m (la longue) : c'est une arme, pas une batterie, mais elle reste plus discrète qu'un coup porté (§8.4).

---

## 6. Les Mécanistes ⚙️ : la mécanique

### 6.1 L'arbalète (l'arme de métier)

L'arbalète est le métier mécaniste par excellence : un **arc** trop raide pour être bandé à la main, tenu tendu par un **mécanisme**, et relâché par une **détente**. On peut la porter **armée** : le premier tir part sans attendre, puis il faut réarmer, longtemps.

| Pièce | Matières | Outil, installation | Durée | Remarque |
|---|---|---|---|---|
| **Arbrier** (le fût) | 1 bûche | **Scier le bois 2** (scie du kit) ; Couper 2 avec malus ; établi | 90 min | La rainure du carreau, le logement de la noix. *Au ciseau 🔥 (Tailler le bois 2) : +1 étoile* |
| **Noix et détente** | 1 petit ressort, 1 clou (ou une cheville de bois dur), 1 os ou un bout de bois dur | Couper 1 ; établi | 40 min | Noix en bois ★★, en os ★★★, *en acier forgé (🔥, 2 rivets) ★★★★* |
| **Arc de l'arbalète** | Au choix : 1 perche de frêne (★) ; 1 lame de ressort brute (★★) ; 1 **bâton d'if** (★★★, les Mécanistes voient l'if du fond du bois) ; *1 ressort retrempé 🔥 (★★★★)* | Serrer 1 (les brides) | 20 à 40 min | Le bois s'use plus vite que l'acier ; la lame brute est fatiguée ; l'if est le meilleur bois ; le ressort retrempé est le meilleur arc |
| **Corde d'arbalète** | 2 cordes d'arc, ou 1 ceinture de sécurité découpée et cousue | — | 15 min | |
| **Monter l'arbalète légère** | Arbrier, noix et détente, 1 arc, 1 corde d'arbalète | Serrer 1 (la **clé plate**, désormais dans le kit ⚙️) ; établi | 30 min | Se réarme **à la main** (arc de frêne) ou **au pied**, dans l'étrier |
| **Arbalète lourde** (variante supérieure) | La même, avec **2 ressorts retrempés 🔥** superposés | Serrer 1 ; établi | 45 min | Trop raide pour le pied : on la réarme au **pied-de-biche** (le vestige !) ou au **cranequin** |
| **Cranequin** (accessoire) | 1 roulement, 1 chaîne de vélo, 1 barre de métal | Serrer 2 ; pédalier (pour tailler le pignon à la meule) | 2 h | Réarme l'arbalète lourde en 4 s au lieu de 6, à la manivelle |
| **Carreaux** | 1 branche (2 fûts de bois dur, courts), 1 poignée de plumes **ou** 2 liasses de papier (les contraventions de la boîte à gants), 2 pointes (os, clou, *ou acier 🔥*) | Couper 1 ; établi | 20 min | **4 carreaux** |

> **Un clin d'œil réaliste.** Le levier qui servait à armer les arbalètes au Moyen Âge s'appelait déjà un **pied-de-biche**. Le vestige que la Coopérative garde sous sa caisse retrouve son premier métier. Et les premières arbalètes avaient un arc de bois : celle à arc de frêne n'a rien d'un pis-aller.

**Seul**, un Mécaniste monte une arbalète **★ dès le premier jour** (frêne, noix en bois, scie et clé du kit), **★★** avec une lame de ressort trouvée, **★★★** avec l'if qu'il est seul à voir. **Avec les autres** : le ressort retrempé et la noix forgée 🔥 donnent ★★★★ et l'arbalète lourde ; les pointes d'acier 🔥 font des carreaux qui cassent moins.

**Hors famille**, une arbalète se fabrique à ×1,5 et plafonne à ★★ : l'arc fatigué, la noix qui accroche. Les Charbonniers et les Voltaïques **l'achètent**, et rachètent des carreaux toutes les semaines.

### 6.2 L'arc, version mécaniste

Tout le monde fait un arc (§3), mais **les Mécanistes reconnaissent les essences** (Book 03 §5.3) : ils voient l'if du fond du bois (un bâton d'if par jour de calendrier, sans aller à la Coopérative), et leur ébauche passe au **tour à perche** pour une étoile de plus. Leurs arcs se vendent ★★★★.

### 6.3 Les pièges mécaniques

Ils ne consomment aucune énergie après la pose (Book 01 §4) et agissent sur ce qui existe déjà : le corps des Éteints (Book 06 §2.2).

| Piège | Matières | Outil | Effet sur un Éteint | Réarmer |
|---|---|---|---|---|
| **Collet** (pour tous, avec la faune) | 1 ficelle ou 1 fil de fer, 1 branche | Couper 1 | Aucun : il est pour les lapins (processus passif, Book 11 §10) | Tout seul |
| **Assommoir** (un poids qui tombe) | 2 bûches, 1 corde, 2 branches (la détente en 4) | Couper 1 ; établi | Le premier qui passe est **mis à terre** (5 s) : on l'achève | A sur le piège, 4 s |
| **Mâchoires de fortune** (voie autonome) | 2 **lames de ressort brutes**, 1 barre de métal, 1 corde (l'ancrage), 4 clous | Serrer 1, Marteler 1 ; établi | Il **brise la jambe** : l'Éteint devient un **Rampant** (Book 06 §2.2), tenu sur place **10 s**. Le ressort fatigué se fausse : **5 prises**, puis il faut le refaire | A sur le piège, 10 s, 15 d'endurance |
| **Piège à mâchoires** (amélioration) | 2 **ressorts retrempés** (🔥), 1 barre de métal, 4 rivets, 1 chaîne de vélo (l'ancrage) | Serrer 1, Marteler 1 ; établi | Rampant, tenu sur place **20 s** ; il ne se fausse pas | A sur le piège, 8 s, 12 d'endurance |
| **Fosse à pieux** | 6 branches | **Creuser 2** (bêche) | Il **tombe et reste coincé** (Book 06 §9.2) : on l'achève d'en haut | Retirer le corps |

> Le piège à mâchoires est une **commande type** entre familles : deux ressorts trempés du Charbonnier, la mécanique du Mécaniste. Posé derrière la porte de la chambre froide, il change une visite. Mais le Mécaniste seul en fait déjà une version qui marche.

### 6.4 Ce qui va avec le pédalier, et le reste

| Objet | Matières | Outil | Effet |
|---|---|---|---|
| **Tour à perche** (installation, ⚙️) | 1 perche de frêne, 1 corde, 4 bûches, 2 branches | Couper 1, Serrer 1 | Tourner le bois : **manches tournés** (+1 étoile à l'arme qui le reçoit, pour les 🔥 et les ⚡), fûts réguliers (+1 étoile aux flèches), bols |
| **Accessoire « soufflet à manivelle » du pédalier** | 1 roue de vélo, 1 bâche, 4 branches | Serrer 1 | Posé à moins de 3 m d'une forge : **ventilation passive** pendant qu'on pédale (l'autre voie que le ventilateur ⚡) |
| **Accessoire « meule fine »** | 1 pierre, 1 chiffon (le cuir de l'affûteur) | — | L'affûtage remonte à neuf **et** gagne +10 % de dégâts jusqu'à la prochaine casse (un fil de rasoir) |
| **Recharge par pédalage** (existe : la dynamo) | — | — | Un pack de 12 Wh en ≈ 6 min réelles de pédalage : le service que les ⚡ achètent l'hiver |
| **Brouette** | 1 roue de vélo, 4 branches, 2 bûches | Scier le bois 1 | +60 kg roulés, la course reste possible sur le chemin (le travois traîne, la brouette roule) |
| **Pompe à chapelet** (lignée de l'eau, niveau 3, Book 24) | 1 chaîne de vélo, 1 tuyau d'arrosage, 4 branches | Serrer 1 | L'eau de la mare à la citerne, sans porter : 10 L par minute de pédalage |

---

## 7. L'interdépendance, sans dépendance

### 7.1 Ce que chaque famille fait seule, ce qu'elle gagne avec les autres

| Famille | Seule, dès le premier jour (la base) | Seule, en s'y mettant (★★★) | Ce qu'elle gagne avec les autres (les améliorations) |
|---|---|---|---|
| 🔥 **Charbonniers** | **Arme** : machette forgée ou couteau de forge **★★** (ressort trouvé ou fer doux, trempe à l'eau, foyer, marteau du kit). **Outils** : pinces, hachette, serpe, rivets, pointes d'acier. **Installations** : charbonnière, foyer de forge. **Entretien** : reprendre et reforger ses lames à la forge. **À distance** : l'arc commun | Pinces et étau trouvé → **★★★** ; graisse de volaille → trempe à l'huile ; forge ventilée au **soufflet double** (on pompe) → ★★★★ ; maîtrise → ★★★★★ | ⚡ **ventilateur** ou ⚙️ **soufflet à manivelle** : forge ventilée sans pomper ; ⚙️ **manche tourné** et ⚡ **dérouillage** : +1 étoile ; ⚙️ **affûtage** : l'entretien le moins cher ; ⚡ **alarme** : forger sans être surpris ; ⚙️ **arbalète** ; ⚡ **matraque** contre l'Équipé |
| ⚡ **Voltaïques** | **Arme** : matraque de fortune **★** (flash, petite batterie du kit), matraque **★★** (raquette, pack). Elle **détruit seule** (§5.1). **Outils** : packs, modules, lampe bricolée, alarme. **Installations** : banc, panneau, clôture de fortune. **Recharge** : banc au soleil, **manivelle** l'hiver. **À distance** : l'arc commun | Bobine d'allumage trouvée → **★★★** (la décharge saute au voisin) ; poste de montage, pack trié, maîtrise → ★★★★ ; clôture et plaque de choc | 🔥 **électrodes forgées** : ★★★★ tout de suite ; ⚙️ **manche tourné** : ★★★★★ ; ⚙️ **recharge par pédalage** l'hiver ; ⚙️ **brouette** pour les batteries de 18 kg ; 🔥 **lame** pour les jours sans courant ; ⚙️ **arbalète** |
| ⚙️ **Mécanistes** | **Arme** : arbalète **★** (arc de frêne) et **★★** (lame de ressort brute), carreaux à pointe d'os ou de clou. **Outils** : scie et **clé plate** du kit, meule, dynamo. **Installations** : pédalier, tour à perche. **Pièges** : assommoir, mâchoires de fortune, fosse. **À distance comme au contact** : l'arc, la lance | Arc d'arbalète en **if** (ils voient l'if) → **★★★** ; arcs d'if ★★★★ ; maîtrise | 🔥 **ressort retrempé** : arbalète ★★★★ et **arbalète lourde** ; 🔥 **noix forgée**, **ciseau à bois** : +1 étoile ; 🔥 **pointes d'acier** : carreaux qui cassent une fois sur cinq ; 🔥 **ressorts** : vrai piège à mâchoires ; ⚡ **packs** et **lampe** ; ⚡ **matraque** contre l'Équipé |
| **Tous** | L'arc de fortune et l'arc simple, les flèches d'os et de clou, la réparation de fortune, le lancer | L'arc d'if (haie de la Coopérative) | Lames et pointes 🔥, packs et lampes ⚡, arbalètes, carreaux et pièges ⚙️ |

### 7.2 Le tableau des dépendances, revu

Chaque case dit ce que l'autre famille **améliore**, jamais ce qu'elle **débloque**. Entre parenthèses, la voie autonome qui existe déjà.

| A envie de → | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **🔥 Charbonniers** | — | **Ventilateur de forge** (sinon : soufflet double, on pompe) ; **dérouillage** +1 étoile (sinon : reforger) ; **alarme** silencieuse (sinon : boîtes de conserve) | **Affûtage** (sinon : reprendre à la forge, ½ kg de charbon) ; **manches tournés** +1 étoile (sinon : une branche) ; **soufflet à manivelle** (sinon : soufflet double) |
| **⚡ Voltaïques** | **Électrodes forgées** ★★★★ (sinon : fil de cuivre, ★★★) ; **couteau** pour les jours sans courant (sinon : l'arc, le gourdin) | — | **Recharge par pédalage** (sinon : la manivelle, lente) ; **manche tourné** (sinon : caoutchouc) ; **brouette** (sinon : le travois) |
| **⚙️ Mécanistes** | **Ressorts retrempés** : arbalète ★★★★, arbalète lourde, vrai piège à mâchoires (sinon : if ★★★, lame brute, mâchoires de fortune) ; **noix forgée**, **ciseau** (sinon : noix en os, scie) ; **pointes d'acier** (sinon : os, clou) | **Lampe bricolée** (sinon : la lanterne du kit) ; **packs** (sinon : la dynamo du pédalier) ; **clôture** (sinon : pièges) | — |

### 7.3 Trois commandes qui doivent arriver souvent dans un test

À mesurer (Book 07 §7.2). Aucune n'est nécessaire pour jouer ; chacune fait gagner une étoile, une variante ou du temps.

| Commande | Qui fournit quoi | Ce que ça apprend |
|---|---|---|
| **L'arbalète lourde** | 🔥 deux ressorts retrempés et des pointes ; ⚙️ l'arbrier, la noix, le montage | Une arme qui n'existe qu'à deux familles : une **variante supérieure** |
| **La matraque ★★★★★** | 🔥 les électrodes forgées ; ⚙️ le manche tourné ; ⚡ la bobine, le pack trié, le montage | Le haut de gamme électrique passe par les trois métiers |
| **La forge silencieuse** | ⚡ l'alarme électrique ; ⚙️ le soufflet à manivelle ou ⚡ le ventilateur | Le Charbonnier forge plus longtemps sans être surpris |

---

## 8. L'équilibre du combat

### 8.1 Les armes de contact nouvelles

Dans le langage de `combat.ts`, à ★★★ (les étoiles modifient dégâts et solidité, §4.2). « Appuyé » : la durée du coup appuyé (pour l'électrique : la décharge longue).

| Arme | Famille | Type | Dégâts torse | Coup / appuyé (ms) | Allonge (m) | Solidité | Tue à la tête |
|---|---|---|---|---|---|---|---|
| **Couteau de forge** (lame forgée) | 🔥 | Tranchant | 1 | 480 / 720 | 1,4 | 60 | Oui (inchangé) |
| **Hachette** | 🔥 | Tranchant | 1,3 | 520 / 780 | 1,4 | 50 | Oui ; **se lance** (10 m, Book 23 §5) |
| **Serpe** | 🔥 | Tranchant | 1,2 | 480 / 720 | 1,4 | 50 | Oui |
| **Machette forgée** | 🔥 | Tranchant | 1,5 | 500 / 750 | 1,6 | **80** | Oui |
| **Hache forgée** | 🔥 | Tranchant | 2 | 700 / 950 | 1,7 | 70 | Oui |
| **Glaive de ressort** | 🔥 | Tranchant | 1,6 | 520 / 780 | 1,7 | 70 | Oui |
| **Lance à pointe forgée** | 🔥 (pointe) | Perçant | 1,4 | 650 / 900 | 2,6 | 60 | Oui |
| **Matraque électrique** | ⚡ | **Électrique** | 0 | 450 / **1 000** | 1,3 | 60 | **Oui**, sur un Éteint raidi ou à terre (§5.1) |
| **Aiguillon de défense** | ⚡ | **Électrique** | 0 | 650 / 1 300 | 2,3 | 40 | **Oui**, idem |

**Lecture.** La machette forgée gagne en **solidité** (80 au lieu de 55 en v0.1) : c'est ce qui la distingue de la machette de fortune (40) et ce qui fait de la lame l'arme **durable**. Le glaive a le meilleur rythme de dégâts de la gamme (1,6 en 0,52 s), mais il reste **tranchant** : il glisse sur le casque de l'Équipé. La masse et le pied-de-biche gardent leur place contre les casqués. Aucune arme nouvelle ne dépasse la masse en dégâts par coup.

### 8.2 Le type « électrique » (décision 4)

Un **quatrième type** plutôt que du contondant, parce que l'effet n'a rien à voir avec un choc : il ne fait **pas de dégâts au torse**, il **passe le casque**, il **libère d'une saisie**, et il **détruit en deux temps**. Une seule ligne dans le sac le dit.

| | Décharge courte (A) | Décharge longue (A maintenu) |
|---|---|---|
| **Éteint libre** | Il **lâche** et **se raidit** : il ne bouge plus, ne saisit plus | Il **tombe à terre** 4 s |
| **Éteint raidi, étourdi ou à terre** | Raidi : la durée repart. À terre : **détruit** | **Détruit** (« il s'éteint ») |
| **Coût** | 0,25 Wh, 5 d'endurance | 1 Wh, 8 d'endurance (on tient, on ne frappe pas) |
| **Équipé (casque)** | Même effet | **Même effet, y compris la destruction** |
| **Saisi** | **A fonctionne même saisi** : une décharge, et il lâche. C'est la réponse des Voltaïques (FOR −2) à la saisie, et le **sauvetage** d'un autre joueur pris | Idem |
| **Bruit** | Crépitement à 6 m | Claquement à 8 m |
| **Pack vide** | Un gourdin court : contondant, 0,6, ne tue pas à la tête | — |

**Ce que font les étoiles** sur une arme électrique :

| | ★ | ★★ | ★★★ | ★★★★ | ★★★★★ |
|---|---|---|---|---|---|
| **Raidi** (courte) | 1,5 s | 2 s | 2,5 s | 3 s | 3,5 s |
| **Décharge longue** (durée à tenir) | 1,4 s | 1,2 s | 1 s | 0,9 s | 0,8 s |
| **La courte saute** à un 2ᵉ Éteint à moins de 1 m | Non | Non | **Oui** | Oui | Oui |
| **Solidité** (décharges) | 30 | 45 | 60 | 90 | 120 |

### 8.3 Les armes de tir

Même bouton que le lancer de la 0.6. « Utile » : la cible accrochée est touchée ; « max » : au-delà, aucune chance ; « tête » : distance jusqu'à laquelle le tir plein peut détruire (moitié contre un Équipé, de face). Valeurs à ★★★, sauf mention.

| Arme | Famille | Type | Portée utile / max / tête | Dégâts (rapide / plein) | Cadence | Bruit | Munitions | Solidité |
|---|---|---|---|---|---|---|---|---|
| **Pierre** (rappel, 0.6) | Tous | Contondant | 8 m / — / — | Faibles ; étourdit 1 s | 1 par seconde | Impact (leurre) | Pierres | — |
| **Hachette lancée** (rappel, 0.6) | 🔥 | Tranchant | 10 m / — / coup heureux | 1,3 | Une, puis aller la reprendre | Impact 6 m | Elle-même | 50 |
| **Arc simple** (frêne) | Tous | Perçant | 12 / 25 / **6 m** | 0,6 / 1,2 | Tir plein toutes les **2,5 s** (bander 1,5 s, encocher 1 s) | 3 m | Flèches, 3 par recette | 150 tirs |
| **Arc d'if** (★★★★) | Tous (if) / ⚙️ | Perçant | 15 / 30 / 7 m | 0,65 / 1,3 | Idem | 3 m | Flèches | 225 tirs |
| **Arbalète légère** | ⚙️ | Perçant | 15 / 30 / **12 m** | 1,5 (toujours plein) | **Armée d'avance** : tir en 0,3 s ; réarmer **3 s** (10 d'endurance), immobile | 6 m | Carreaux, 4 par recette | 200 tirs |
| **Arbalète lourde** (★★★★) | ⚙️ + 🔥 | Perçant | 20 / 35 / 15 m | **3** (à terre en un carreau) | Réarmer **6 s** au pied-de-biche, 4 s au cranequin (16 d'endurance) | 8 m | Carreaux | 300 tirs |

**Les règles qui tiennent l'ensemble :**

- **Le tir ne remplace pas le contact.** On ne tire pas saisi ; réarmer une arbalète immobilise ; contre trois Éteints au contact, il faut une autre arme. Le tir sert à **éclaircir avant le contact** et à **chasser**.
- **La portée tient dans l'écran du téléphone** : à l'iPhone 13 mini, la vue isométrique montre ≈ 15 à 20 m autour du personnage ; les portées utiles s'y arrêtent. Au-delà, le tir reste possible (indicateur hors champ, Book 23 §4.5), mais incertain.
- **Les munitions sont l'usure** : une flèche coûte ≈ 8 wotts, un carreau à pointe d'acier ≈ 15. Une visite de la Coopérative à l'arc coûte ≈ 6 flèches cassées, du même ordre que l'usure d'une arme de contact.
- **Aucune arme de tir n'a de bruit d'impact qui porte loin** : c'est pour cela qu'on les veut. Le leurre reste la pierre lancée.

### 8.4 Le tableau d'équilibre des armes de métier

Les trois armes de métier, et l'arc commun pour repère, aux niveaux ★, ★★ et ★★★. **★ et ★★ se font seul** (§2.5) ; ★★★ se fait seul en s'y mettant, ou plus vite avec une autre famille. Les niveaux ★★★★ et ★★★★★ prolongent chaque ligne sans en changer l'ordre.

Repères de calcul (code 0.5.3) : un Errant tombe à 3 points au torse, un Équipé à 4 ; le coup appuyé compte double ; un appuyé à la tête avec une arme qui « tue à la tête » détruit un Errant ; le tranchant n'achève jamais un Équipé, même au sol ; la saisie part après 0,6 s de contact, la morsure 3 s après ; un Éteint en poursuite avance à 0,9 m/s ; un coup porté s'entend à 14 m (`BRUIT_ACTION.coup`) ; on propose **10 m** pour le tranchant (§8.5).

> **Rejoué par le simulateur (chantier 9, 2026-10-09)** : le code fait avancer un Éteint en poursuite à **1,55 m/s** (`VITESSES.poursuivant`), pas 0,9 : un groupe surgi à 5 m est au contact en ≈ 2,6 s, pas 5,5 s. Les chiffres ci-dessous sont ceux de la v0.2, gardés pour l'histoire ; **les chiffres qui font foi sont au §8.7**, rejoués avec les vraies règles du jeu.

**Les chiffres :**

| Arme | Niv. | Ce que c'est | Dégâts | Détruire un Errant | Détruire un Équipé | Groupe de 3 (surgis à 5 m, ≈ 5,5 s avant le contact) | Coût d'usage par Errant | Bruit | Portée |
|---|---|---|---|---|---|---|---|---|---|
| 🔥 **Lame** | ★ | Machette de fortune, ou forgée en fer doux | 1,2 / appuyé 2,4 | **0,75 s** (un appuyé à la tête) | **Impossible seule** : à terre en 2 appuyés (1,5 s), mais le tranchant ne l'achève pas | 0 avant le contact ; ≈ 4 s au contact (3 appuyés, 1 repousser), une saisie probable ; solidité 40 : la lame casse en une visite | 1 coup sur 40 ; 16 d'endurance | Coup : 10 m | 1,6 m |
| | ★★ | Machette forgée, ressort et trempe à l'eau | 1,35 / 2,7 | 0,75 s | À terre en 1,25 s (simple + appuyé) ; pas d'achèvement | Idem ; solidité 60 | 1 coup sur 60 ; ≈ 4 wotts | 10 m | 1,6 m |
| | ★★★ | Machette forgée, pinces et étau (ou manche tourné ⚙️) | 1,5 / 3 | 0,75 s | À terre en 1,25 s ; pas d'achèvement | Idem ; solidité 80 : **une visite entière sans réparer** | 1 coup sur 80 ; ≈ 4 wotts | 10 m | 1,6 m |
| ⚡ **Électrique** | ★ | Matraque de fortune (flash, petite batterie) | 0 ; raidit 1,5 s | **1,85 s** (courte, puis longue 1,4 s) | **1,85 s**, pareil | 0 avant ; ≈ 7 s au contact ; les saisies se défont d'une courte | 1,25 Wh + 2 décharges sur 30 ; 13 d'endurance | 6 / 8 m | 1,3 m |
| | ★★ | Matraque à la raquette, pack de cellules | 0 ; raidit 2 s | 1,65 s | 1,65 s | ≈ 5,5 s au contact, presque sans saisie | 1,25 Wh + 2 sur 45 ; ≈ 5 wotts | 6 / 8 m | 1,3 m |
| | ★★★ | Matraque à bobine | 0 ; raidit 2,5 s ; **la courte saute au voisin** | 1,45 s | 1,45 s | ≈ 4,5 s au contact, **sans saisie** (deux raidis d'une courte) ; ≈ 4 Wh | 1,25 Wh + 2 sur 60 ; ≈ 5 wotts | 6 / 8 m | 1,3 m |
| ⚙️ **Arbalète** | ★ | Arc de frêne, noix en bois | 1,2 (plein) | **0,3 s** armée, à ≤ 8 m ; puis réarmer 2,5 s | De face, à ≤ 4 m | **2 avant le contact** (à 0,3 s et 3,1 s), le 3ᵉ à l'arme de contact | 1 carreau, cassé 1 fois sur 3 (os, clou) ; ≈ 3 wotts ; 8 d'endurance | 6 m (+ impact 4 m) | 10 / 20 m |
| | ★★ | Lame de ressort brute, noix en os | 1,35 | 0,3 s à ≤ 10 m ; réarmer 3 s | De face, à ≤ 5 m | 2 avant le contact | ≈ 3 wotts ; 10 d'endurance | 6 m | 12 / 25 m |
| | ★★★ | Arc d'if (ou ressort retrempé 🔥) | 1,5 | 0,3 s à **≤ 12 m** ; réarmer 3 s | De face, à ≤ 6 m | 2 avant le contact ; **en terrain ouvert, à 15 m : les trois** | ≈ 3 wotts (acier 🔥 : cassé 1 fois sur 5) | 6 m | 15 / 30 m |
| **Arc** (commun, repère) | ★ | Arc de fortune, bois vert | 0,5 / 1 | 1,5 s (tir plein) à ≤ 4 m | De face, à ≤ 2 m | 2 avant le contact s'il ne manque rien ; le 3ᵉ au contact | 1 flèche, cassée 1 fois sur 3 ; ≈ 3 wotts ; 6 d'endurance | 3 m (+ impact 4 m) | 8 / 15 m |
| | ★★ | Arc simple, corde de ficelle | 0,55 / 1,1 | 1,5 s à ≤ 5 m | De face, à ≤ 2,5 m | Idem | ≈ 3 wotts | 3 m | 10 / 20 m |
| | ★★★ | Arc simple, frêne et bonne corde | 0,6 / 1,2 | 1,5 s à ≤ 6 m | De face, à ≤ 3 m | Idem ; à 15 m, 2 ou 3 selon la chance | ≈ 3 wotts | 3 m | 12 / 25 m |

**Forces, faiblesses et terrain de chacune :**

| Arme | Son terrain | Forces | Faiblesses |
|---|---|---|---|
| 🔥 **Lame** | **Le corps à corps durable** : la visite longue, l'Éteint après l'Éteint | La mise à mort la plus rapide (0,75 s) ; aucune munition, aucun courant ; la plus **solide** (80 à ★★★) ; on frappe même saisi ; se répare à sa propre forge | **Ne détruit pas un Équipé** (le casque) ; au contact, donc exposée à la saisie et aux groupes ; la plus **bruyante** (10 m) ; 16 d'endurance par mise à mort |
| ⚡ **Électrique** | **Le contrôle et l'Équipé** : la saisie, le groupe serré, le casqué | La seule arme de contact qui **détruit un Équipé aussi vite qu'un Errant** ; **libère d'une saisie**, la sienne ou celle d'un autre ; raidit avant de tuer, donc presque **jamais saisi** ; peu d'endurance ; discrète (6 m) | **Deux fois plus lente** à tuer que la lame ; coûte des **Wh** (l'hiver gris la rationne) ; allonge courte (1,3 m) ; pack vide = gourdin ; ★ fragile et lourde |
| ⚙️ **Arbalète** | **La distance** : l'espace ouvert, le premier coup, l'Éteint qu'on ne veut pas approcher | Détruit **avant le contact**, jusqu'à 12 m ; **armée d'avance** (0,3 s, rien à bander) ; perce le casque de face ; discrète | **Réarmer immobilise 3 s** ; inutile une fois saisi ou entouré ; carreaux qui se perdent ; il faut une **seconde arme** au contact |
| **Arc** (commun) | Le repère de tous : la chasse, l'éclaircissement | Pour tout le monde, dès le premier jour ; le plus silencieux (3 m) ; cadence correcte | Portée de tête courte (≤ 6 m) ; il faut **bander 1,5 s** ; endurance ; flèches qui cassent ; inutile saisi |

**Pourquoi aucune ne domine :**
- **Contre un Errant seul**, la lame est la plus rapide, l'arbalète la plus sûre (il ne l'approche pas), l'électrique la plus lente : chacun peut le faire, aucun n'est désavantagé.
- **Contre un Équipé**, l'électrique est la meilleure au contact, l'arbalète le prend de face à courte distance, la lame **ne peut pas** sans une seconde arme : c'est le prix de sa vitesse et de sa solidité.
- **Contre un groupe**, l'arbalète et l'arc en éclaircissent deux avant le contact, puis cèdent la place ; l'électrique tient le contact sans être saisi ; la lame va le plus vite, mais au risque d'une prise.
- **Au coût**, les trois armes de métier sont du même ordre : ≈ 3 à 5 wotts par Errant détruit. Chacune paie dans sa monnaie : la lame en **usure et en bruit**, l'électrique en **Wh et en temps**, l'arbalète en **carreaux et en réarmement**.
- **L'arc commun** reste juste en dessous de l'arbalète à niveau égal (portée de tête 6 m contre 12 m, il faut bander) : le métier des Mécanistes vaut quelque chose, sans priver les autres d'une arme de jet.
- **Garde-fou chiffré**, à vérifier par un test automatique (§10, chantier 9) : sur son propre terrain, chaque arme de métier est la meilleure des trois ; hors de son terrain, à ★★★, elle n'est jamais plus de **2 fois** moins bonne que la meilleure, sauf la lame contre l'Équipé, qui demande une seconde arme et le dit. **Vérifié** : le test `commun/src/equilibre.test.ts` le rejoue à chaque `npm test` ; le détail et ce qu'il a appris sont au §8.7.

### 8.5 Les valeurs dans le langage de `combat.ts`

À ★★★ ; les étoiles s'appliquent par `ETOILES`. Les nouvelles armes vont dans des fichiers par famille (§10.4) ; `ARMES` les rassemble et les trie par `rang`.

```ts
export type TypeDegat = "contondant" | "tranchant" | "percant" | "electrique";

export interface Arme {
  // … les champs d'aujourd'hui (objet, nom, type, solidite, degatsTorse, tueALaTete, allonge, coup, coupAppuye) …
  /** Objet de métier : il porte des étoiles par exemplaire (Book 25 §4.2). Les valeurs sont à ★★★. */
  metier?: true;
  /**
   * Électrique (Book 25 §5.1) : rien au torse. La courte (coup) fait lâcher et raidit ; la longue (coupAppuye)
   * met à terre un Éteint libre, et détruit un Éteint raidi, étourdi ou à terre. Le casque n'y change rien.
   */
  electrique?: { raidi: number; whCourte: number; whLongue: number; saute: boolean };
}

/** Ce que font les étoiles d'un exemplaire (Book 02 §9). */
export const ETOILES = {
  1: { degats: 0.8, solidite: 0.5, raidi: 1.5, longueMs: 1400, porteeTete: 2 / 3 },
  2: { degats: 0.9, solidite: 0.75, raidi: 2, longueMs: 1200, porteeTete: 5 / 6 },
  3: { degats: 1, solidite: 1, raidi: 2.5, longueMs: 1000, porteeTete: 1 },
  4: { degats: 1.1, solidite: 1.5, raidi: 3, longueMs: 900, porteeTete: 7 / 6 },
  5: { degats: 1.2, solidite: 2, raidi: 3.5, longueMs: 800, porteeTete: 4 / 3 },
} as const;

/** Le bruit d'un coup porté (proposé) : le tranchant fait moins de bruit que le choc ; l'électrique crépite. */
export const BRUIT_COUP: Record<TypeDegat, number> = { contondant: 14, tranchant: 10, percant: 10, electrique: 6 };

// 🔥 commun/src/armes/charbonniers.ts
{ objet: "machette_forgee", nom: "la machette forgée", type: "tranchant", solidite: 80, degatsTorse: 1.5, tueALaTete: true, allonge: 1.6, coup: 500, coupAppuye: 750, metier: true },
{ objet: "lame_forgee", nom: "le couteau de forge", type: "tranchant", solidite: 60, degatsTorse: 1, tueALaTete: true, allonge: 1.4, coup: 480, coupAppuye: 720, metier: true },
{ objet: "hachette", nom: "la hachette", type: "tranchant", solidite: 50, degatsTorse: 1.3, tueALaTete: true, allonge: 1.4, coup: 520, coupAppuye: 780, metier: true },
{ objet: "glaive", nom: "le glaive de ressort", type: "tranchant", solidite: 70, degatsTorse: 1.6, tueALaTete: true, allonge: 1.7, coup: 520, coupAppuye: 780, metier: true },

// ⚡ commun/src/armes/voltaiques.ts (★★★ : module à bobine ; `raidi` et la longue suivent ETOILES)
{ objet: "matraque_electrique", nom: "la matraque électrique", type: "electrique", solidite: 60, degatsTorse: 0, tueALaTete: true, allonge: 1.3, coup: 450, coupAppuye: 1000, metier: true,
  electrique: { raidi: 2.5, whCourte: 0.25, whLongue: 1, saute: true } },
{ objet: "aiguillon", nom: "l'aiguillon de défense", type: "electrique", solidite: 40, degatsTorse: 0, tueALaTete: true, allonge: 2.3, coup: 650, coupAppuye: 1300, metier: true,
  electrique: { raidi: 2.5, whCourte: 0.25, whLongue: 1, saute: false } },

// ⚙️ et commun : commun/src/tir.ts (une table à part, sinon `meilleureArme` choisirait un arc au contact)
export interface ArmeTir {
  objet: TypeObjet; nom: string; type: "percant";
  porteeUtile: number; porteeMax: number; porteeTete: number;
  degatsRapide: number | null; degatsPlein: number;
  /** Arc : bander jusqu'au tir plein. Arbalète armée : viser. */
  pleinMs: number;
  /** Arc : encocher. Arbalète : réarmer (immobile). */
  rechargeMs: number;
  endurance: number; bruit: number; solidite: number; metier?: true;
}
export const ARMES_TIR: ArmeTir[] = [
  { objet: "arc_simple", nom: "l'arc", type: "percant", porteeUtile: 12, porteeMax: 25, porteeTete: 6, degatsRapide: 0.6, degatsPlein: 1.2, pleinMs: 1500, rechargeMs: 1000, endurance: 6, bruit: 3, solidite: 150, metier: true },
  { objet: "arbalete", nom: "l'arbalète", type: "percant", porteeUtile: 15, porteeMax: 30, porteeTete: 12, degatsRapide: null, degatsPlein: 1.5, pleinMs: 300, rechargeMs: 3000, endurance: 10, bruit: 6, solidite: 200, metier: true },
  { objet: "arbalete_lourde", nom: "l'arbalète lourde", type: "percant", porteeUtile: 20, porteeMax: 35, porteeTete: 15, degatsRapide: null, degatsPlein: 3, pleinMs: 300, rechargeMs: 6000, endurance: 16, bruit: 8, solidite: 200, metier: true }, // à ★★★ : 300 à ★★★★, son niveau réel
];
```

Et la règle électrique dans `encaisser` (`eteints.ts`), en clair :

```ts
if (arme.type === "electrique") {
  lacher(e);                                              // il lâche toujours
  const pris = e.etourdi > 0 || e.etat === "a_terre" || e.variante === "rampant";
  if (e.etat === "a_terre" || e.variante === "rampant") return detruire(e);   // au sol : toute décharge achève
  if (appuye) return pris ? detruire(e) : mettreATerre(e, DUREE_A_TERRE_ELECTRIQUE /* 4 s */);
  e.etourdi = Math.max(e.etourdi, raidi(etoiles));        // courte : raidi, et rien au torse
  if (saute) raidirLeVoisin(e, 1 /* m */);
  return "raidi";
}
```

### 8.6 Ce que le joueur lit dans son sac

Une ligne par type, pas de règle cachée (Book 23 §4.2) : **contondant** « Passe le casque, étourdit plus longtemps » ; **tranchant** « Le casque l'arrête à la tête » ; **perçant** « Sa force, c'est l'allonge » (au tir : « Tir plein à la tête : il tombe pour de bon ») ; **électrique** « Il lâche et se raidit. Maintenu sur un Éteint raidi ou à terre, il l'éteint. Passe le casque. » Plus, pour les armes de métier, les **étoiles**, la **charge** et les **munitions**.

### 8.7 Le simulateur et le garde-fou (chantier 9, 2026-10-09)

**Ce qu'il fait.** `commun/src/equilibre.ts` rejoue le tableau du §8.4 avec les **vraies règles du jeu** : les Éteints pensent et marchent par `penser` (leur vitesse, la saisie à 0,6 s, la morsure à 3 s), les coups passent par `encaisserCoup` (le casque, l'électrique en deux temps, le saut au voisin), les armes sont celles des tables `ARMES` et `ARMES_TIR`, corrigées par les étoiles de l'exemplaire. Rien n'est recopié : si une valeur change dans `armes/*.ts` ou `tir.ts`, le simulateur le voit, et le test casse si le garde-fou ne tient plus. `npm run equilibre` imprime le tableau complet, avec les réglages du serveur.

**Le modèle, en clair.** Le joueur reste sur place, sur un terrain vide ; les Éteints surgissent déjà en poursuite. Un geste compte **à la fin** de sa durée (la convention du §8.4). Une conduite simple, la même pour tous : frapper d'abord celui qui tient, achever celui qui est à terre, viser la tête ; à l'électrique, raidir avant d'éteindre ; au tir, tirer dès que la tête est à portée, ne réarmer que si l'on en a le temps. Saisi, on frappe celui qui tient, ou l'on se dégage (6 appuis par Éteint). Une rencontre vaut son **temps équivalent** : le temps jusqu'au dernier détruit, plus 6 s par morsure (se panser) ; perdue ou impossible, l'infini.

**Les rencontres.** Un Errant, un Équipé, trois Errants surgis à 5 m, trois à 15 m (terrain ouvert), **le groupe serré** (un Équipé et deux Errants à 2,5 m, au coin d'un rayonnage), **la visite** (huit Errants, un toutes les 2 s, à 3 m), **la cascade** (les mêmes, un toutes les 1,2 s : un repère, le terrain de personne).

**Les terrains jugés par le garde-fou** : la lame, la visite et les trois à 5 m ; l'électrique, le groupe serré ; l'arbalète, les trois à 15 m.

**Les chiffres (chaque arme seule) :**

| Arme | Niv. | Un Errant à 5 m | Un Équipé à 5 m | Trois à 5 m | Trois à 15 m | Groupe serré (2,5 m) | La visite | La cascade | Détruits avant le contact (15 m) | Wotts par Errant | Autonomie |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 🔥 Lame | ★ | 2,0 s | impossible seule | 3,5 s (1 saisie) | 10,0 s (1 saisie) | impossible seule | 14,8 s | 14,8 s (3 saisies) | 0 | 0,8 | 40 |
| | ★★ | 2,0 s | impossible seule | 3,5 s (1 saisie) | 10,0 s (1 saisie) | impossible seule | 14,8 s | 14,8 s (3 saisies) | 0 | 6,3 | 60 |
| | ★★★ | 2,0 s | impossible seule | 3,5 s (1 saisie) | 10,0 s (1 saisie) | impossible seule | **14,8 s** | 12,5 s (1 saisie) | 0 | 4,7 | **80** |
| ⚡ Électrique | ★ | 3,6 s | 3,6 s | 8,7 s (3 saisies) | 15,1 s (3 saisies) | 7,1 s (3 saisies) | 16,3 s | effondré | 0 | 14,5 | 15 |
| | ★★ | 3,4 s | 3,4 s | 8,1 s | 14,1 s (1 saisie) | 6,5 s | 16,1 s | 16,5 s (5 saisies) | 0 | 8,5 | 9 |
| | ★★★ | 3,2 s | 3,2 s | 6,1 s | 12,6 s | **4,5 s** | 15,9 s | **12,1 s** | 0 | 6,7 | 9 |
| ⚙️ Arbalète | ★ | 0,3 s | 0,7 s | 9,1 s (3 saisies) | 11,8 s (1 saisie) | 21,1 s (2 morsures) | effondré | effondré | 2 | 4,1 | 36 |
| | ★★ | 0,3 s | 0,3 s | 9,1 s (3 saisies) | 9,8 s (1 saisie) | 21,1 s (2 morsures) | effondré | effondré | 2 | 3,3 | 36 |
| | ★★★ | 0,3 s | 0,3 s | 9,1 s (3 saisies) | **8,5 s** | 21,1 s (2 morsures) | effondré | effondré | 2 | 2,9 | 36 |
| Arc (commun) | ★ | 1,5 s | 1,9 s | 7,2 s (3 saisies) | 12,4 s (1 saisie) | 7,5 s (3 saisies) | 24,4 s (12 saisies) | effondré | 1 | 3,8 | 36 |
| | ★★ | 1,5 s | 1,6 s | 7,2 s (3 saisies) | 11,8 s | 7,5 s (3 saisies) | 24,4 s (12 saisies) | effondré | 1 | 4,2 | 36 |
| | ★★★ | 1,5 s | 1,5 s | 7,2 s (3 saisies) | 10,8 s (1 saisie) | 7,5 s (3 saisies) | 24,4 s (12 saisies) | effondré | 2 | 4,0 | 36 |

Les temps comptent l'approche (un Errant à 5 m met ≈ 1,3 s à venir à portée de lame). « Wotts par Errant » : l'usure de l'arme (son énergie grise sur sa solidité), les Wh au prix du dépôt, les munitions cassées. « Autonomie » : Errants détruits avant de devoir réparer, recharger (un pack de 12 Wh ; 50 Wh pour la matraque de fortune) ou refaire des munitions (12 emportées).

**Avec la seconde arme** (★★★ ; les ★ et ★★ suivent la même pente) :

| Arme | Un Équipé à 5 m | Trois à 5 m | Groupe serré | La visite | La cascade |
|---|---|---|---|---|---|
| 🔥 Lame + le marteau du kit | 2,1 s | 3,5 s (1 saisie) | 2,4 s (1 saisie) | 14,8 s | 12,5 s (1 saisie) |
| ⚙️ Arbalète + la lance | 0,3 s | 2,2 s | 2,1 s (1 saisie) | 17,1 s (4 saisies) | 16,6 s (2 saisies) |
| Arc + la lance | 1,5 s | 4,3 s (2 saisies) | 3,3 s (2 saisies) | 16,9 s | 15,3 s (7 saisies) |

**Le garde-fou, à ★★★ : il tient, sans changer aucune valeur.**

| Terrain | 🔥 Lame | ⚡ Électrique | ⚙️ Arbalète |
|---|---|---|---|
| La visite (lame) | **1** | 1,08 | 1,16 (avec la lance) |
| Trois à 5 m (lame) | **1** | 1,74 | 0,64 (avec la lance) |
| Groupe serré (électrique) | 0,53 (avec le marteau) | **1** | 0,47 (avec la lance) |
| Trois à 15 m (arbalète) | 1,17 | 1,47 | **1** |

(Le rapport au meilleur temps des trois armes **seules** ; au-dessus de 2, le garde-fou casse.) Au coût, de 2,9 à 6,7 wotts par Errant : sous les 3 fois du Book 02 §15.

**Ce que le simulateur a appris :**

1. **La vitesse des Éteints.** Le §8.4 comptait 0,9 m/s ; le code dit 1,55 m/s. Le groupe arrive deux fois plus vite : à 5 m, l'arbalète n'en détruit qu'**un** avant le contact (pas deux) ; à 15 m, **deux** (pas trois). L'ordre des armes ne change pas.
2. **L'arbalète seule ne tient pas le contact** : 2,6 fois moins bonne que la lame contre trois Errants à 5 m, effondrée dans la visite (réarmer 3 s, c'est trop long quand ils arrivent toutes les 2 s). Le §8.4 le disait (« il faut une seconde arme au contact ») et son tableau comptait déjà « le 3ᵉ à l'arme de contact ». Le garde-fou la juge donc, **au contact**, avec la **lance** que les Mécanistes font seuls (§7.1), comme il juge la lame contre l'Équipé avec le **marteau** du kit des Charbonniers. **C'est une seconde exception, à faire valider par le porteur** (`DEMANDE_UNE_SECONDE_ARME`, equilibre.ts).
3. **La seconde arme est forte.** Avec la lance, l'arbalète devient la plus rapide au contact (2,2 s contre 3,5 s pour la lame à 5 m ; 2,1 s contre 4,5 s pour l'électrique dans le groupe serré). La lance (commune, perçante, allonge 2,6 m) passe le casque et frappe avant qu'on l'approche ; le marteau aussi passe le casque. Le §8.4 disait l'électrique « la seule arme de contact qui détruit un Équipé aussi vite qu'un Errant » : c'est vrai **parmi les armes de métier**, pas parmi toutes. Ce qui reste à l'électrique : **aucune saisie** dans le groupe serré et la cascade, là où la lance et le marteau en prennent une ou deux. **Question au porteur** : la lance doit-elle rester aussi forte ? (Elle s'use vite : solidité 40.)
4. **L'électrique ★★★ tient son terrain** et gagne même la cascade (12,1 s sans une saisie, contre 12,5 s et une saisie pour la lame) : la lame s'essouffle (16 d'endurance par mise à mort), la décharge non. **Mais l'électrique ★★**, celle qu'un Voltaïque fait seul dès le premier jour, est **2,3 fois** moins bonne que la lame ★★ contre trois Errants à 5 m (8,1 s contre 3,5 s). Le garde-fou ne juge que ★★★ ; c'est à surveiller au test de jeu (le porteur trouvait la matraque « un peu en dessous »). Les réglages le corrigeraient sans toucher au code : `equilibre_electrique_longue` à 0,7 (la longue tenue 0,7 s au lieu de 1 s à ★★★, 0,84 s à ★★) et `equilibre_electrique_raidi` à 1,2 ramènent l'électrique ★★ à 6,1 s (1,7 fois), et le garde-fou tient toujours ; la longue seule à 0,8 ne suffit pas (7,4 s, 2,1 fois). **Proposition, non appliquée** : on garde les valeurs validées tant que le test de jeu n'a pas parlé.
5. **La lame ★ ne coûte presque rien** (0,8 wotts par Errant) : la machette de fortune est un vestige à 30 wotts. Ce n'est pas un problème : elle casse en 40 coups, et l'on ne la refait pas.
6. **L'autonomie** sépare les trois : 80 Errants pour la machette ★★★, 36 pour 12 carreaux, **9 pour un pack** : un Voltaïque emporte deux ou trois packs pour une visite (§5.4 le disait). Ce n'est pas dans le garde-fou (chacune paie dans sa monnaie), mais c'est la vraie faiblesse de l'électrique.

**Les réglages d'équilibre** (`commun/src/reglages.ts`, modifiables à chaud pendant le test, Book 21 §3.9) : cinq multiplicateurs, à 1 par défaut, sur les seules armes de métier — `equilibre_lames_degats`, `equilibre_electrique_raidi`, `equilibre_electrique_longue`, `equilibre_arbalete_rearmer`, `equilibre_tir_portee_tete`. On en change un dans `serveur/donnees/reglages.json`, on relance `npm run equilibre`, et l'on voit tout de suite si le garde-fou tient encore.

**Les mesures des critères de réussite** (§10.1, `serveur/src/mesures.ts`, genre « metier ») : chaque tir (`tir:<arme>`), chaque Éteint détruit et comment (`detruit:tranchant`, `detruit:electrique`, `detruit:tir_plein`…), chaque objet de métier fabriqué avec ses étoiles, chaque échange d'objets de métier entre joueurs. `npm run bilan` en tire une section « Le métier des familles » : part des joueurs qui ont tiré, Éteints détruits au tir plein, délai de la première arme de métier ★★ par famille (en jours de calendrier), échanges par joueur et par semaine, part du temps passé à se défendre par famille (écart ≤ 5 points), arbalètes lourdes. **La clôture qui tient une nuit** ne se mesure pas encore : à noter à la main.

**Le test de jeu à la Coopérative** (à faire par le porteur et la famille, la 0.6 en main) :
1. **Seul, une famille à la fois, sur un serveur neuf** : faire son arme de métier ★★ (noter le temps de calendrier), puis une visite de la Coopérative avec elle et l'arc. Noter : les saisies, les morsures, l'arme cassée ou le pack vide, ce qui a manqué.
2. **À trois**, une famille chacun : une visite ensemble ; puis une semaine de jeu pour les échanges (une arbalète lourde à deux familles, une matraque ★★★★ avec les électrodes forgées).
3. Après chaque séance : `npm run bilan` et `npm run equilibre` ; reporter ici ce qui s'écarte du tableau (en particulier l'électrique ★★ et la lance).

---

## 9. Ce qu'il faut ajouter au monde

Les numéros de chantier renvoient au §10.

### 9.1 Les matières nouvelles

| Matière | Où | Comment | Énergie grise | Chantier |
|---|---|---|---|---|
| **Perche de frêne** | 2 frênes à la lisière de chaque terrain | Couper 2 (couteau du kit : ×1,5) ; repousse en 6 h | 10 | 3 |
| **Bâton d'if** | Haie d'ifs de la Coopérative ; un if au fond du bois, visible des seuls ⚙️ | Couper 2 | 30 | 3 |
| **Plumes, os** | Sous-produits de « Plumer et vider la poule » | — | 2 | 3 |
| **Graisse** | Sous-produit de la volaille rôtie (Book 24 §3.5, lanterne à bocal) | — | 3 | 3 |
| **Boyaux** | Lapin vidé (avec la faune côté serveur) | Couper 1 | 4 | 0b |
| **Minerai des marais** | Lieux de flux (Book 04 §2.2) | Creuser 2 | Book 04 | Après 0b |

### 9.2 Les vestiges nouveaux

Tous déclarés par le chantier 3.

| Vestige | Famille de vestige, rareté | Où | Sert à |
|---|---|---|---|
| **Fil dentaire** « Menthe Glaciale, 50 m » | Salle de bain, C | Boutique | Corde d'arc ★★★★ |
| **Appareil photo jetable** | Salon, C | Boutique, maisons | Module de décharge ★ ; condensateur |
| **Raquette anti-moustiques** | Gadget, C | Boutique, bureaux | Module de décharge ★★ |
| **Bobine d'allumage** | Voiture, P | Épaves, atelier de la Coopérative | Module de décharge ★★★, clôture |
| **Lime usée** (« kit manucure de luxe ») | Garage, P | Atelier | Acier ★★★★★ |
| **Soc de charrue** | Ferme, P | Grange, quai | Acier ★★★ (hache, serpe) |
| **Bidon d'huile moteur** | Garage, C | Atelier, épaves | Trempe à l'huile (20 trempes) |
| **Tronçon de rail** | Garage, R | L'embranchement des silos (Coopérative) | Enclume ★★★★★ |
| **Arc de tir sportif**, **flèches en carbone** | Gadget, R / P | Bureaux de la Coopérative | Arc ★★★★★ tout fait |
| **Trois manuels** (*Manuel du forgeron amateur*, *Guide de l'électricien du dimanche*, *L'Arbalète pour les nuls*) | Salon, R ; un de chaque au coffre du directeur | Bureaux, maisons | Ouvrir les recettes d'une famille (§2.3) |

Et un changement de kit : la **clé plate** (Serrer 2) entre dans le kit des Mécanistes.

### 9.3 Les installations, et les niveaux à ajouter aux lignées (Book 24)

| Lignée ou installation | Niveaux et accessoires | Famille | Chantier |
|---|---|---|---|
| **La forge** | 1 foyer de forge (existe) → **2 forge ventilée** (tuyère d'argile, **soufflet double** ; 1 chiffon de cuir ou de bâche, 6 pierres, 1 barre ; on pompe, 2 d'endurance par minute de forge). Accessoires : **enclume** (pierre plate ★★, étau ou tête de masse ★★★, rail ★★★★★), **ventilateur 12 V** (⚡) ou **soufflet à manivelle** (⚙️) qui suppriment le pompage, **bac de trempe** (1 casserole) | 🔥 | 5 |
| **L'établi** | Book 24 §5 (établi utile, étau) ; accessoire **redresseur de fûts** (2 branches, 1 pierre chaude) : les flèches à l'établi vont 2 fois plus vite | Tous | 4 |
| **Le banc de recharge** | Accessoire **électrificateur** (la clôture se branche dessus) ; **poste de montage** (pince, fer à souder bricolé avec une résistance) : +1 étoile aux modules | ⚡ | 6 |
| **Le pédalier** | Accessoires existants (meule, dynamo) + **soufflet à manivelle**, **meule fine** | ⚙️ | 7 |
| **Tour à perche** | Nouvelle installation, 1 × 2 cases | ⚙️ | 7 |
| **Bas fourneau** | Nouvelle installation, 2 × 2 cases, palier III (Book 04 §2.3) | 🔥 | Après 0b |

### 9.4 Les quêtes « Le métier » (Book 22 §3.2)

Les quatre étapes actuelles restent. On ajoute **quatre étapes par famille**, qui font découvrir la gamme et **mènent vers l'échange**. Chacune se fait seul (Book 22 §1 et §2.5 : personne ne reste bloqué) ; l'étape 8 propose l'échange, et se valide aussi en vendant au Comptoir s'il n'y a personne d'une autre famille sur le serveur. Récompenses : 20, 25, 30, 40 wotts, des primes des Compteurs.

| Famille | 5 | 6 | 7 | 8 |
|---|---|---|---|---|
| 🔥 | **Les pinces** : forger des pinces de forge | **La trempe** : une machette forgée ★★ ou mieux | **La mise d'acier** : forger une hachette ou une hache | **Le fournisseur** : vendre ou échanger une lame **à un joueur** d'une autre famille (ou au Comptoir) |
| ⚡ | **Du courant en poche** : monter un pack de cellules | **La Raquette** : une matraque électrique, et **éteindre** un Éteint avec | **Prévenu sans bruit** : poser une alarme électrique | **Le courant chez les autres** : échanger un pack ou une lampe avec un joueur d'une autre famille (ou au Comptoir) |
| ⚙️ | **Le bois qui plie** : une arbalète, quelle qu'elle soit | **Le carreau** : détruire un Éteint d'un carreau à la tête | **Les mâchoires** : poser un assommoir ou des mâchoires | **Le carquois des autres** : échanger 8 carreaux avec un joueur d'une autre famille (ou au Comptoir) |

**Pour tous**, une ligne « S'installer » gagne **« Le premier arc »** (monter un arc, récompense : 3 flèches à pointe d'os) et **« Tir plein »** (détruire un Éteint d'une flèche à la tête).

### 9.5 L'aide du jeu

Cinq rubriques nouvelles ou mises à jour (`client/src/aide-contenu.ts`), qui expliquent **comment**, jamais **où** est le rare (l'if, la lime, le vestige légendaire) :
- **Tirer à l'arc et à l'arbalète** : prêt à tirer, maintenir pour bander, le cercle qui se referme et rougit quand la tête est à portée, réarmer, ramasser ses flèches ;
- **Les étoiles d'un objet** : « la moins bonne des trois choses fixe la qualité », ce que changent les étoiles, et « seul, on fait sa base ; ensemble, on la fait mieux » ;
- **Le métier des autres** : les recettes « chez les Charbonniers », la leçon d'un joueur, le manuel, le ×1,5 et le plafond ★★ ;
- **L'électricité contre les Éteints** : la règle en une ligne (§5.1), raidir puis éteindre, la charge, la recharge au banc et à la manivelle ;
- **Pièges et défenses** : poser, réarmer, ce que fait chaque piège.

### 9.6 L'impact technique (pour le développement)

- **Sous-produits** : `Recette` gagne `sousProduits` (plumes et os de la poule), comme les démontages qui ont déjà plusieurs sorties.
- **Qualité par exemplaire** (décision 2) : un suffixe d'étoiles sur les seuls objets de métier (`machette_forgee#4`), qui s'empilent par étoiles ; l'usure et la charge suivent la même clé. Les sauvegardes existantes se lisent comme des objets ★★★ (la machette de fortune : ★).
- **Hors famille** (décision 3) : `recettesConnues` rend aussi les recettes apprises (une liste dans le personnage), avec le ×1,5 de `lignees.ts` et le plafond ★★ ; les autres recettes de famille sont rendues **grisées**.
- **Tir** : la table `ARMES_TIR` à part (§8.5) ; le serveur de projectiles de la 0.6 sert pour la pierre, la flèche et le carreau.
- **Électrique** (décision 4) : `TypeDegat` gagne `"electrique"` ; `encaisser` raidit, met à terre ou détruit selon l'état (§8.5) ; la charge du pack se range comme l'usure.
- **Réparation** (décision 8) : `ATELIER_REPARATION.lame` devient une liste (meule du pédalier, forge) ; une recette « reforger » pour la lame ébréchée.
- **Pièges et clôture** : des installations à déclencheur, comme l'alarme à boîtes de conserve, dans un moteur commun.
- **Modèles et sons** (agent graphisme, session son) : arc, arbalète, flèche et carreau en vol, matraque et son arc bleu, clôture, pièges ; corde qui claque, crépitement, trempe, déclic.

---

## 10. Une seule livraison : la 0.6, en chantiers parallèles

### 10.1 Ce qui change

Les lots A0, A et B de la v0.1 (versions 0.6, 0.7 et 0.8) deviennent **une seule version, la 0.6** : le lancer du Book 23 §5, l'arc pour tous et le métier complet des trois familles. Elle est découpée en **neuf chantiers**, pensés pour être confiés à **plusieurs agents en même temps**, en **trois vagues**. Les lots C (l'hiver et la chasse, en 0b) et D (le fer neuf, après la 0b) ne bougent pas.

**Le croisement avec le Book 24.** Son lot 2 (la base qui s'organise) reste hors de cette livraison, sauf la **lignée de la forge** (niveau 2, enclume), prise par le chantier 5. S'il avance en même temps, il partage `recettes.ts` et `lignees.ts` : il suit alors la même règle des fichiers par famille (§10.4).

**Le critère de réussite de la 0.6** : ≥ 60 % des joueurs ont tiré une flèche ; un Errant détruit au tir plein sans saisie ; chaque famille, **seule sur un serveur neuf**, fabrique son arme de métier ★★ en moins de 2 jours de calendrier ; au moins un échange de métier par joueur et par semaine quand les trois familles sont là ; ±5 % entre familles sur le temps passé à se défendre ; une arbalète lourde faite à deux familles dans chaque test ; une clôture tient une nuit.

### 10.2 Les vagues

| Vague | Chantiers (en parallèle) | Doit être fini avant |
|---|---|---|
| **1 · Les fondations** | **1** Projectiles · **2** Socle du combat et étoiles · **3** Recettes de métier et matières | La vague 2. Dans la vague, le chantier 2 livre d'abord `etoiles.ts` (types et fonctions pures, une demi-journée) : les chantiers 1 et 3 s'appuient dessus |
| **2 · Les métiers** | **4** L'arc pour tous · **5** Charbonniers · **6** Voltaïques · **7** Mécanistes | La vague 3 |
| **3 · L'intégration, l'aide, l'équilibrage** | **8** Intégration (quêtes, aide, sac, version) · **9** Équilibrage et tests de jeu | La livraison |

```
vague 1   [1 Projectiles]   [2 Socle combat + étoiles]   [3 Recettes + matières]
              │      ╲              │      │      ╲            │      │
vague 2   [4 Arc] ◄──┴──── [7 Mécanistes]  [5 Charbonniers]   [6 Voltaïques]
              │                │                │                 │
vague 3   [8 Intégration] ◄────┴────────────────┴─────────────────┤
          [9 Équilibrage] ◄───────────────────────────────────────┘
```

### 10.3 Les chantiers

**Chantier 1 · Le moteur de projectiles** (vague 1)
- **Contenu** : l'objet rapide « Prêt à lancer / Prêt à tirer » ; le bouton Lancer (G, clic du milieu, troisième bouton du téléphone, gâchette) ; maintenir et relâcher (tir rapide, tir plein) ; l'arc de visée et le cercle qui se referme (blanc, orange, rouge) ; le serveur des projectiles : objet prêt, cadence, angle, distance bornée, premier mur, premier Éteint sur la ligne, impact, objet posé au sol et ramassable ; la casse des munitions ; le refus quand on est saisi ; la pierre, le réveil et la hachette lancée (Book 23 §5) ; la table `ARMES_TIR` **vide** de toute arme de métier (le chantier 4 y met l'arc, le 7 l'arbalète) ; les messages « armer / réarmer ».
- **Fichiers** : nouveaux `commun/src/tir.ts`, `serveur/src/tir.ts`, `serveur/src/tir.test.ts`, `client/src/visee.ts`, `client/src/rendu/projectiles.ts`, `client/src/rendu/metier/index.ts` (le registre des modèles de métier, vide) ; partagés : `commun/src/messages.ts`, `serveur/src/joueur.ts` (une ligne d'appel), `client/src/hud.ts` (le bouton), `client/src/main.ts`, `client/src/entrees.ts`, `client/src/touches.ts`.
- **Dépendances** : aucune, sauf `etoiles.ts` du chantier 2 (dégâts et portée selon les étoiles).
- **Tests** : la trajectoire s'arrête au premier mur ; on ne lance pas par-dessus un rayonnage ; cadence trop rapide refusée ; au-delà de la portée maximale, aucun impact ; saisi, pas de tir ; la munition tombe et se ramasse ; la casse suit sa probabilité (graine fixe).
- **Graphismes** : l'arc de visée au sol, le cercle qui se referme et change de couleur, la pierre, le réveil et la hachette en vol, l'impact ; sons synthétisés côté code : le lancer, l'impact sourd.

**Chantier 2 · Le socle du combat et les étoiles** (vague 1)
- **Contenu** : `etoiles.ts` (exemplaires `type#n`, empilement par étoiles, maillon faible, maîtrise à 10 exemplaires, plafond ★★ hors famille, table `ETOILES`) ; l'usure et la charge **par exemplaire** ; la migration des sauvegardes ; le type **électrique** dans `combat.ts` et sa règle dans `encaisser` (raidir, mettre à terre, détruire, sauter au voisin) ; `BRUIT_COUP` par type ; `ATELIER_REPARATION.lame` en liste (meule ou forge) ; le découpage de `ARMES` en fichiers par famille, triés par `rang` ; le **moteur des déclencheurs** (pièges, plaque, clôture : raidir, mettre à terre, briser la jambe, tenir sur place) ; les étoiles et la barre de charge dans le sac.
- **Fichiers** : nouveaux `commun/src/etoiles.ts`, `commun/src/etoiles.test.ts`, `commun/src/armes/communes.ts`, `armes/charbonniers.ts`, `armes/voltaiques.ts`, `armes/mecanistes.ts` (vides sauf l'existant), `serveur/src/declencheurs.ts` ; partagés : `commun/src/combat.ts`, `commun/src/eteints.ts`, `commun/src/objets.ts` (le type `Inventaire` seulement), `commun/src/signature.ts`, `serveur/src/joueur.ts`, `serveur/src/sauvegardes.ts`, `serveur/src/base.ts`, `client/src/hud.ts`.
- **Dépendances** : aucune.
- **Tests** : un exemplaire ★★ casse deux fois plus tôt qu'un ★★★★ ; deux exemplaires d'étoiles différentes ne s'empilent pas ; une sauvegarde 0.5.3 se relit sans perte ; électrique : la courte raidit et fait lâcher, la longue met à terre un Éteint libre et détruit un raidi, un Équipé est détruit pareil, au sol toute décharge achève ; le tranchant n'achève toujours pas un Équipé ; les tests `combat.test.ts` et `combat-enrichi.test.ts` passent sans changement de résultat pour les armes existantes.
- **Graphismes** : les étoiles sur la case du sac et sur la fiche (lisibles sur l'iPhone 13 mini) ; la barre de charge bleue ; l'Éteint **raidi** (pose tétanisée, petits arcs bleus) et celui **qui s'éteint** (les yeux blancs ternissent, il s'affaisse ; pas de fumée noire).

**Chantier 3 · Les recettes de métier et les matières** (vague 1)
- **Contenu** : `Recette.sousProduits` ; le découpage de `recettes.ts` en fichiers par famille ; les recettes des autres familles **grisées** « chez les Charbonniers » ; la **leçon** (deux joueurs au même endroit, quelques minutes, le rayonnement de l'enseignant) et les **manuels** ; ×1,5 et plafond ★★ ; la liste des recettes apprises dans le personnage ; **toutes** les matières et tous les vestiges de la 0.6 (§9.1, §9.2), et **tous les identifiants d'objets** que les chantiers 4 à 7 fabriqueront, avec leur nom et leur description ; les frênes du terrain (repousse), la haie d'ifs de la Coopérative, l'if du fond du bois visible des ⚙️ ; la clé plate dans le kit ⚙️ ; les qualités nouvelles (Saisir à chaud, Tailler le bois, Trancher le métal, Élaguer).
- **Fichiers** : nouveaux `commun/src/recettes/communes.ts`, `recettes/charbonniers.ts`, `recettes/voltaiques.ts`, `recettes/mecanistes.ts`, `serveur/src/lecon.ts`, `serveur/src/lecon.test.ts` ; partagés : `commun/src/recettes.ts`, `commun/src/objets.ts`, `commun/src/vestiges.ts`, `commun/src/terrain.ts`, `commun/src/milieu-coop.ts`, `commun/src/messages.ts`, `serveur/src/joueur.ts`, `commun/src/aide-fabrication.ts`.
- **Dépendances** : `etoiles.ts` du chantier 2 (le plafond ★★).
- **Tests** : une recette d'une autre famille est grisée, puis ouverte par une leçon, puis coûte ×1,5 et plafonne à ★★ ; plumer une poule rend plumes et os ; un frêne coupé repousse en 6 h, même hors ligne ; le couteau du kit coupe une perche en ×1,5 ; un Voltaïque ne voit pas l'if du fond du bois, un Mécaniste si ; chaque nouveau vestige peut sortir au tirage de son lieu.
- **Graphismes** : le frêne (écorce grise, bourgeons noirs), l'if (sombre, la haie taillée en boules au parking), les icônes de toutes les nouvelles matières et de tous les vestiges (`planche-icones.ts`), la recette grisée, la scène de la leçon (deux personnages côte à côte).

**Chantier 4 · L'arc pour tous** (vague 2)
- **Contenu** : l'arc de fortune, l'ébauche qui sèche (processus passif, hors ligne compris), l'arc simple et l'arc d'if, les cordes, les quatre sortes de flèches, le redresseur de fûts de l'établi ; la ligne de l'arc dans `ARMES_TIR` ; la portée de tête selon les étoiles ; l'arc de tir sportif.
- **Fichiers** : `commun/src/tir.ts` (le bloc « arc » seulement), `commun/src/recettes/communes.ts`, `serveur/src/production.ts` (le séchage), nouveaux `serveur/src/arc.test.ts`, `client/src/rendu/metier/arc.ts`.
- **Dépendances** : chantiers **1** (le tir), **2** (les étoiles), **3** (frênes, plumes, os, identifiants).
- **Tests** : l'ébauche sèche en 2 h, même déconnecté ; un tir plein à la tête à 6 m (★★★) détruit, à 7 m il touche le torse ; la pointe durcie ne tue pas à la tête ; la casse 1/2, 1/3, 1/5 ; un Équipé de dos ne meurt pas d'une flèche.
- **Graphismes** : trois arcs (fortune, frêne, if) en main et dans le dos, la pose « bander », la flèche en vol et plantée dans un corps ; son : la corde qui claque.

**Chantier 5 · Les Charbonniers** (vague 2)
- **Contenu** : toute la gamme du §4.3 (dont les électrodes forgées et le ressort retrempé, que les chantiers 6 et 7 utilisent comme améliorations) ; la qualité d'une lame (§4.2) ; la trempe à l'eau (une sur trois se fend) ou à l'huile ; reprendre une lame et reforger la lame ébréchée ; la forge ventilée, le soufflet double, l'enclume, le bac de trempe (lignée de la forge).
- **Fichiers** : `commun/src/armes/charbonniers.ts`, `commun/src/recettes/charbonniers.ts`, `commun/src/lignees.ts`, nouveaux `serveur/src/forge.ts`, `serveur/src/forge.test.ts`, `client/src/rendu/metier/forge.ts`.
- **Dépendances** : chantiers **2** (étoiles, réparation en liste) et **3** (identifiants, recettes par famille).
- **Tests** : ressort + eau + foyer + marteau donne ★★ ; avec les pinces et un étau, ★★★ ; hors famille, jamais plus de ★★ ; la trempe à l'eau fend une lame sur trois (graine fixe) ; une lame ébréchée reforgée redevient la même arme à une étoile de moins ; un Charbonnier seul répare sa lame à la forge.
- **Graphismes** : la forge ventilée (tuyère, soufflet double), l'enclume en trois versions (pierre, étau, rail), le bac de trempe et sa vapeur, les lames en main (couteau, hachette, machette forgée, serpe, hache, glaive), les pinces ; son : le pschitt de la trempe.

**Chantier 6 · Les Voltaïques** (vague 2)
- **Contenu** : packs et modules (★, ★★, ★★★), la matraque de fortune, la matraque, l'aiguillon ; la consommation en Wh, le pack vide, l'alerte « Plus de courant » ; la **recharge à la manivelle** ; la lampe bricolée, l'alarme électrique, la clôture de fortune et la clôture, la plaque de choc (par le moteur des déclencheurs) ; le ventilateur de forge, le bain de dérouillage, le poste de montage, l'électrificateur.
- **Fichiers** : `commun/src/armes/voltaiques.ts`, `commun/src/recettes/voltaiques.ts`, `commun/src/energie.ts`, nouveaux `serveur/src/electricite.ts`, `serveur/src/electricite.test.ts`, `client/src/rendu/metier/electricite.ts` ; `serveur/src/joueur.ts` (une ligne d'appel).
- **Dépendances** : chantiers **2** (type électrique, déclencheurs, charge par exemplaire) et **3**.
- **Tests** : un Voltaïque **seul** monte une matraque de fortune avec son kit et un appareil photo ; la courte puis la longue détruisent un Errant et un Équipé ; une courte libère un joueur saisi ; chaque décharge retire ses Wh, le pack vide devient un gourdin court ; la manivelle recharge 1 Wh par minute ; la clôture tient un Éteint, trois qui poussent la couchent ; la clôture ne détruit jamais.
- **Graphismes** : la matraque (fortune, raquette, bobine) et son arc bleu, l'aiguillon, la clôture et ses isolateurs en plastique, la LED de l'alarme, la plaque de choc, le ventilateur sur la forge ; sons : crépitement de la courte, claquement de la longue, bourdonnement de la clôture.

**Chantier 7 · Les Mécanistes** (vague 2)
- **Contenu** : l'arbalète (★ frêne, ★★ lame brute, ★★★ if, ★★★★ ressort retrempé), l'arbalète lourde et le cranequin, les carreaux ; la ligne de l'arbalète dans `ARMES_TIR` ; armée d'avance, réarmer immobile ; l'assommoir, les mâchoires de fortune, le piège à mâchoires, la fosse (par le moteur des déclencheurs) ; le tour à perche, le soufflet à manivelle, la meule fine, la recharge par pédalage vendue aux ⚡ ; la brouette.
- **Fichiers** : `commun/src/armes/mecanistes.ts`, `commun/src/tir.ts` (le bloc « arbalète » seulement), `commun/src/recettes/mecanistes.ts`, nouveaux `serveur/src/mecanique.ts`, `serveur/src/mecanique.test.ts`, `client/src/rendu/metier/mecanique.ts` ; `serveur/src/joueur.ts` (une ligne d'appel).
- **Dépendances** : chantiers **1** (tir), **2** (étoiles, déclencheurs), **3**. Le ressort retrempé du chantier 5 n'est **pas** un prérequis : il ouvre seulement ★★★★ et la lourde, testées en fin de vague.
- **Tests** : un Mécaniste **seul** monte une arbalète ★ avec son kit et une perche ; armée, elle tire en 0,3 s ; réarmer immobilise 3 s ; saisi, pas de tir ; la lourde met à terre en un carreau ; les mâchoires font un Rampant, celles de fortune se faussent en 5 prises.
- **Graphismes** : trois arbalètes et la lourde, la pose « réarmer à l'étrier » et au pied-de-biche, le cranequin, le carreau en vol, les pièges armés et déclenchés, le tour à perche ; sons : le déclic de la détente, le cliquetis du cranequin, le claquement de l'assommoir.

**Chantier 8 · L'intégration** (vague 3)
- **Contenu** : les quêtes « Le métier » 5 à 8 et les deux étapes « S'installer » (§9.4) ; les cinq rubriques d'aide (§9.5) ; les lignes du sac par type, les étoiles, la charge et les munitions ; le tutoriel des touches (Lancer) ; le registre des modèles de métier branché ; la version **0.6** et sa ligne dans `code/VERSIONS.md`. En parallèle, une session « books » met à jour les Books 01, 06, 11 et 23 (§11).
- **Fichiers** : `commun/src/quetes.ts`, `serveur/src/quetes.ts`, `client/src/aide-contenu.ts`, `client/src/hud.ts`, `client/src/main.ts`, `commun/src/tutoriel.ts`, `commun/src/version.ts`, `code/VERSIONS.md`.
- **Dépendances** : chantiers **4 à 7** finis.
- **Tests** : chaque étape de quête se valide **seul** (l'étape 8 par le Comptoir) ; chaque rubrique d'aide s'ouvre ; le sac affiche étoiles et charge sans déborder à 375 px de large.
- **Graphismes** : les icônes de quête, la mise en page du sac (étoiles, barre de charge, compteur de munitions), le bouton Lancer sur téléphone.

**Chantier 9 · L'équilibrage et les tests de jeu** (vague 3)
- **Contenu** : un **simulateur chiffré** qui rejoue le tableau du §8.4 (détruire un Errant, un Équipé, un groupe de 3 surgi à 5 m et à 15 m, coût par Errant) pour chaque arme et chaque niveau, et vérifie le garde-fou (chacune la meilleure sur son terrain, jamais plus de 2 fois moins bonne ailleurs à ★★★, sauf la lame contre l'Équipé) ; les valeurs exposées dans les réglages ; les mesures des critères de réussite (§10.1) ; un test de jeu à la Coopérative par famille, **seul**, puis à trois.
- **Fichiers** : nouveaux `commun/src/equilibre.ts`, `commun/src/equilibre.test.ts` ; `commun/src/reglages.ts`, `serveur/src/mesures.ts` ; les **valeurs** (pas la structure) des fichiers `armes/*.ts` et `tir.ts`.
- **Dépendances** : chantiers **4 à 7** ; en parallèle du chantier 8.
- **Tests** : le simulateur lui-même ; aucune régression des tests des vagues 1 et 2.
- **Graphismes** : une dernière passe de lisibilité sur l'iPhone 13 mini (le cercle de visée, les étoiles, la barre de charge, l'Éteint raidi qu'on doit reconnaître d'un coup d'œil).

### 10.4 Les fichiers partagés, et comment éviter les conflits

**Le principe** : la vague 1 **ouvre des fichiers par famille** (armes, recettes, rendu) et des **points d'appel** d'une ligne ; la vague 2 n'écrit plus que dans **ses propres fichiers** ; la vague 3 reprend les fichiers d'interface. Quand deux chantiers de la même vague touchent un même fichier, ils écrivent dans des **blocs séparés** et fusionnent dans l'ordre indiqué ; le second relit le fichier juste avant de fusionner.

| Fichier | Qui y touche | Dans quel ordre | Comment éviter le conflit |
|---|---|---|---|
| `commun/src/combat.ts` | **2** seul en vague 1 ; personne en vague 2 ; **9** (valeurs) en vague 3 | 2, puis 9 | Le chantier 2 sort les armes vers `armes/<famille>.ts` : les chantiers 5, 6 et 7 n'y écrivent que leurs lignes. `ARMES` les rassemble et les trie par `rang` |
| `commun/src/recettes.ts` | **3** seul en vague 1 | 3 | Le chantier 3 le découpe en `recettes/<famille>.ts` (et `communes.ts` pour l'arc, chantier 4). `recettes.ts` ne garde que le moteur |
| `serveur/src/joueur.ts` (3 178 lignes) | **2**, **3**, **1** en vague 1 ; **6** et **7** en vague 2 (une ligne chacun) | 2 → 3 → 1 ; puis 6 → 7 | Pas de logique nouvelle dans ce fichier : chaque chantier écrit son module (`tir.ts`, `lecon.ts`, `electricite.ts`, `mecanique.ts`) et n'ajoute qu'un **appel** d'une ligne |
| `commun/src/messages.ts` | **1** et **3** en vague 1 ; personne en vague 2 ; **8** si besoin | 1 → 3 | Deux blocs séparés en fin de fichier. Le chantier 1 prévoit dès le départ les messages dont la vague 2 aura besoin (armer, réarmer, déclencher un piège, recharger à la manivelle) |
| `client/src/hud.ts` | **2** (sac : étoiles, charge) et **1** (bouton Lancer) en vague 1 ; personne en vague 2 ; **8** en vague 3 | 2 → 1 ; puis 8 seul | Zones distinctes (le sac, les boutons). En vague 2, rien : l'affichage passe par les données (étoiles, charge, munitions) déjà prévues |
| `client/src/main.ts` | **1** en vague 1 ; **8** en vague 3 | 1, puis 8 | Le chantier 1 crée le registre `client/src/rendu/metier/index.ts` ; les chantiers 4 à 7 y ajoutent **une ligne** chacun (ajout en fin de liste, sans conflit réel) |
| `commun/src/objets.ts`, `commun/src/vestiges.ts` | **2** (le type `Inventaire`) puis **3** (tous les objets de la 0.6) en vague 1 | 2 → 3 | Le chantier 3 déclare **d'un coup** tous les identifiants de la 0.6 : la vague 2 n'ajoute pas d'objet. S'il en manque un, elle le demande au chantier 8 au lieu de l'ajouter |
| `commun/src/tir.ts` | **1** (crée) ; **4** et **7** en vague 2 | 1 ; puis 4 et 7 en parallèle | Deux blocs réservés dès la création (« arc », « arbalète ») |
| `commun/src/eteints.ts`, `serveur/src/base.ts` | **2** seul | 2 | Le moteur des déclencheurs (`declencheurs.ts`) reçoit les pièges des chantiers 6 et 7 par enregistrement, sans toucher `eteints.ts` ni `base.ts` |
| `commun/src/lignees.ts`, `commun/src/energie.ts` | **5** (forge) ; **6** (énergie) | En parallèle | Un seul chantier par fichier |

---

## 11. Les incohérences repérées entre le code et les books

| Sujet | Code | Books | Proposition | État |
|---|---|---|---|---|
| **L'arc** | — | Book 01 §4 et §5, Book 06 §8.2, Book 11 §10 : arc et arbalète **mécanistes** | Arc pour tous, arbalète mécaniste (§3.1) | **Décidé** (décision 1) ; Books 01 (v1.8), 06 (v0.7) et 11 (v0.8) **mis à jour** (chantier 8, 2026-10-09) |
| **Le combat des Charbonniers** | — | Book 01 §5 : la **poudre noire** | Les lames ; la poudre noire reportée après la 1.0 | **Décidé** (décision 7) ; Book 01 **mis à jour** (v1.8) |
| **L'électricité** | — | Book 01 §4 et Book 06 §8.2 : la clôture « étourdit et **blesse** » | L'arme électrique raidit, met à terre, et **détruit** à la tête un Éteint raidi ou à terre ; la clôture raidit et ne détruit pas (§5.1) | **Décidé** (2026-10-09) ; Books 01 et 06 **mis à jour** (v1.8, v0.7) |
| **Recettes des autres familles** | `recettesConnues` : invisibles, impossibles | Book 01 §5 : apprentissage, puis ×1,5 ; Book 24 l'applique aux lignées seulement | Grisées, ouvertes par la leçon ou un manuel, ×1,5, plafond ★★ (§2.3) | **Décidé** (décision 3) ; chantier 3 |
| **Réparer une lame** | `ATELIER_REPARATION.lame` = la meule du **pédalier**, recette mécaniste | Book 23 §4.3 | Un **Charbonnier ne peut pas réparer sa propre lame** : la meule **et** la forge (§4.4) | **Décidé** (décision 8) ; chantier 2 |
| **La qualité ★** | Absente ; l'inventaire compte des types | Book 02 §9 : maillon faible ; Book 23 §4.3 : l'usure par type | Qualité par exemplaire pour les seuls objets de métier (§9.6) | **Décidé** (décision 2) ; chantier 2 |
| **La forge de la lame** | « Foyer de forge », 1 kg de charbon | Book 01 §3 : ce foyer chauffe **au bois** à 900 °C (palier I) ; un couteau, c'est 1,25 à 2,5 kg de charbon ; Book 02 §12.1 : forge **ventilée** (palier II) | Garder 1 kg pour le couteau ; la forge ventilée devient le niveau 2 (§9.3) ; corriger le Book 01 (le foyer de forge brûle aussi du charbon) | À faire (chantier 5, Book 01) |
| **La lame forgée** | Une lame **sans manche** qui sert d'arme | Book 02 §12.1 : une lame de couteau | La renommer « couteau de forge » (même identifiant), emmanchée | À faire (chantier 5) |
| **La machette trouvée** | Était une « machette » à 1,5 de dégâts et 50 de solidité, valeur 30 wotts, bien plus forte que la lame forgée (≈ 215 wotts) | Book 01 §6 : un vestige vaut ce qu'il coûterait à refaire | **Machette de fortune** (une tôle découpée, un manche ficelé) : dégâts 1,2, solidité 40 ; une lame ★. À 30 wotts, sa valeur est cohérente avec ce qu'elle est. La machette **forgée** est un autre objet (§4.3) | **Réglé** (code, 2026-10-09) |
| **La lame ébréchée** | Se démontait en une **lame de ressort** à 50 wotts, pour un débris à 4 wotts | Book 02 §15 règle 4 : pas de boucle qui crée de la valeur ; et un éclat de lame n'est pas un ressort | Elle **ne se démonte plus** ; « un Charbonnier saura le reforger » (§4.4). Sa valeur (4 wotts) pourra monter vers ≈ 40 quand le reforgeage existera | **Réglé** (code, 2026-10-09) ; reforgeage au chantier 5 |
| **Valeur de la masse et du pied-de-biche** | Vestiges à 28 et ≈ 30 wotts | Book 01 §6 | Les remonter à leur valeur de remplacement (≈ 200, 150) | À faire (chantier 3) |
| **La lance** | Déclarée **deux fois** : vestige (`VESTIGES.lance`, 14 wotts) et produit de recette ; son énergie grise est celle du vestige | Book 01 §6 : énergie grise d'un objet fabriqué = matières + travail | La sortir des vestiges (≈ 75 wotts par la recette) | À faire (chantier 3) |
| **Qualités d'outil manquantes** | Machette, masse, pied-de-biche : aucune qualité | Book 03 §4 : masse **Marteler 3** ; une machette coupe | Machette de fortune Couper 1, machette forgée Couper 2 ; masse Marteler 3 ; pied-de-biche Marteler 1 | À faire (chantier 3) |
| **Essences de bois** | Aucune : arbres de décor ou fruitiers | Book 03 §5.3 : les ⚙️ reconnaissent le bois par essence | Frênes et ifs (§9.1) | À faire (chantier 3) |
| **Le kit mécaniste** | Scie, corde, lanterne : aucun outil **Serrer**, que l'arbalète et le pédalier demandent | Book 02 §14 | Ajouter la clé plate au kit ⚙️ (§2.5) | À faire (chantier 3) |
| **Le casque et la flèche** | — | Book 23 §4.2 : une seule règle, le casque arrête le tranchant | La flèche et le carreau sont perçants : ils passent par la visière, de face, à la moitié de la portée de tête | **Décidé** (décision 5) |

Le Book 02 §14 bis (« pierre à aiguiser écartée, pour ne pas casser la meule ») et P-002 (aiguillon à décharge en Électricité II, arbalète en Mécanique II) sont **cohérents** avec ce book.

---

## 12. Les décisions (2026-10-09)

Les huit questions de la v0.1 sont tranchées par le porteur : toutes à « oui », la n° 8 à « les deux ».

1. **L'arc pour tous ; les Mécanistes gardent l'arbalète.** L'arc simple est commun ; les Mécanistes gardent **l'arbalète, les pièges et le tour**, et un avantage sur l'arc qui vient de leur savoir (ils trouvent l'if, leurs arcs passent ★★★★). Books 01, 06 et 11 mis à jour (2026-10-09). → §3, §6.

2. **La qualité ★ par exemplaire, pour les seuls objets de métier** (lames, arcs, arbalètes, armes électriques), par un suffixe d'étoiles dans l'inventaire. Un caillou n'a pas d'étoile. À faire relire par l'architecte BMAD avant le code. → §4.2, §9.6, chantier 2.

3. **Les recettes des autres familles** sont grisées et visibles « chez les Charbonniers » ; elles s'ouvrent par **la leçon d'un joueur** de la famille (ou un manuel rare, dont un par famille au coffre du directeur de la Coopérative pour le joueur seul) ; **×1,5** en matières et en temps ; **plafond ★★**. → §2.3, chantier 3.

4. **Un quatrième type de dégât, « électrique ».** Pas de dégâts au torse, passe le casque, libère d'une saisie ; et, depuis la décision du porteur sur l'équilibre, **il détruit** en deux temps (raidir, puis la décharge longue à la tête). Une ligne de plus dans le sac. → §5.1, §8.2, chantier 2.

5. **La flèche perce le casque** par la visière ouverte : la règle unique du Book 23 §4.2 ne change pas, la flèche et le carreau sont perçants. Pour que l'Équipé ne tombe pas trop facilement, c'est **de face** et à la **moitié** de la portée de tête. Si les tests montrent encore qu'il tombe trop vite, on lui donnera une visière **fermée** (variante), pas une règle de plus. → §3.4, §8.3.

6. **Le glaive**, l'épée courte : à la forge ventilée seulement, comme pièce de vitrine. Il reste sous la masse en dégâts par coup, et tranchant (le casque l'arrête). → §4.3, chantier 5.

7. **La poudre noire est reportée après la 1.0.** Les lames suffisent à faire un métier, et un coup de feu à 300 m (Book 01 §4) changerait tout l'équilibre de la Coopérative. Le Book 01 la garde au palier II-III, en idée. → §11.

8. **Réparer les lames : les deux.** La meule ⚙️ affûte (rapide, bon marché) ; la forge 🔥 reprend une lame abîmée et **reforge** une lame cassée à une étoile de moins. Le Charbonnier n'est plus obligé d'acheter l'entretien de sa propre lame, et le Mécaniste garde le geste le moins cher. → §4.4, chantiers 2 et 5.

**Et les décisions du même jour, hors questions :**
- **L'autonomie** : la règle d'or du §2.5, appliquée à chaque recette.
- **L'électricité dangereuse** et **l'équilibre des trois armes de métier** : §5.1 et §8.4.
- **La machette de fortune** et **la lame ébréchée qui ne donne plus de ressort** : réglées dans le code (§0.2).
- **Une seule livraison** : la 0.6, en neuf chantiers (§10).
