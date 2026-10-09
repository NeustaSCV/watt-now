# Book 25 — Le métier des familles

> Document de conception · version 0.1 · 2026-10-09
> Statut : **proposition à valider** par le porteur du projet. Rien n'est codé.
> Demande du porteur : « Aujourd'hui, on va développer le craft spécifique à chaque famille. Il faudra sans doute ajouter des objets et des matières de base. Fais-moi des propositions. Les charbonniers ont les lames. Les voltaïques peuvent avoir des armes électriques (taser ?) et les mécanistes peuvent avoir des arbalètes ? Arc pour tout le monde, c'est assez basique comme technologie. Fais-moi une proposition étoffée. »
> S'appuie sur les books [01](01-les-trois-feux.md) (§3 et §4 : familles, travail du métal, triangle de combat), [02](02-crafting.md) (§6 domaines, §9 maillon faible, §10 réparation, §12.1 la lame, §14 bis gamme bushcraft, §15 équilibrage), [03](03-bibliotheque-et-savoir.md) (§4 qualités d'outil, §5 savoir), [04](04-siderurgie-et-chimie.md) (§2 sidérurgie, §3.8 électrochimie), [06](06-zombies.md) (§2 corps, §3 signature, §8 et §9 combat et défense), [07](07-economie.md), [11](11-agriculture-elevage-alimentation.md) (§10 chasse), [15](15-univers.md), [21](21-perimetre-phase-0.md), [22](22-quetes-et-objectifs.md), [23](23-cooperative-et-combat.md) (§4 et §5) et [24](24-ameliorer-sa-base.md), sur le code de la version 0.5.3 et sur la proposition P-002 (`PROPOSITIONS.md`, lue sans être modifiée).

---

## 1. L'état des lieux (code 0.5.3)

### 1.1 Ce que chaque famille sait faire en propre

Aujourd'hui, une recette de famille est **réservée** à sa famille : les autres ne la voient pas (`recettesConnues`, `commun/src/recettes.ts`). Seuls les niveaux des lignées de la base (Book 24) connaissent le surcoût ×1,5 hors famille (`SURCOUT_AUTRE_FAMILLE`, `lignees.ts`).

| Famille | Recettes propres | Installations | Ce qu'elle vend | Carnet « Le métier » (Book 22 §3.2) |
|---|---|---|---|---|
| 🔥 **Charbonniers** | Meule de charbonnière (10 bûches, 4 branches) ; foyer de forge à soufflet (8 pierres, 1 barre de métal, 2 branches) ; **lame forgée** (1 lame de ressort + 1 kg de charbon, Marteler 2, 90 min de travail lourd, à la forge) | Charbonnière, forge | Lames forgées, charbon | Charbonnière → défourner → forger une lame → la vendre |
| ⚙️ **Mécanistes** | Pédalier universel (cadre, chaîne, roue de vélo, 2 bûches) ; accessoires **meule** (couteau → couteau aiguisé) et **dynamo** | Pédalier | Électricité de pédalage, affûtage | Meule → affûter → dynamo → déposer l'électricité |
| ⚡ **Voltaïques** | Banc de recharge (2 bûches, 1 barre de métal) ; poser le panneau solaire de la station | Banc, panneau | Électricité, composants | Panneau → l'installer → 20 Wh → déposer |

Le kit de départ ajoute à chaque famille ses outils : marteau et pierre à feu (🔥), scie et corde (⚙️), lampe à dynamo, petite batterie et frontale (⚡). Les **réparations** suivent le Book 23 §4.3 : le bois à l'établi, **les lames à la meule du pédalier**, le métal à la forge.

**Le constat** : chaque famille a **une chaîne-vitrine** de quatre gestes, mais pas encore de **métier** au sens du Book 02 §6. Une fois la lame vendue ou la batterie déposée, plus rien ne distingue un Charbonnier d'un Mécaniste au combat ou à l'établi.

### 1.2 Les armes en jeu

Toutes au contact (`ARMES`, `commun/src/combat.ts`). Il faut **3 points** au torse pour faire tomber un Éteint (4 pour un Équipé) ; le coup appuyé compte double ; à terre, n'importe quel coup l'achève.

| Arme | Origine | Type | Dégâts | Coup / appuyé (ms) | Allonge | Solidité | Tue à la tête |
|---|---|---|---|---|---|---|---|
| Masse | Vestige (Coopérative) | Contondant | 2,5 | 950 / 1 250 | 1,6 | 70 | Oui |
| Hache | Tête trouvée + manche | Tranchant | 2 | 700 / 950 | 1,7 | 60 | Oui |
| Pied-de-biche | Vestige | Contondant | 1,5 | 600 / 880 | 1,5 | 120 | Oui |
| Machette | Vestige | Tranchant | 1,5 | 500 / 750 | 1,6 | 50 | Oui |
| Marteau | Kit 🔥 | Contondant | 1,5 | 600 / 850 | 1,5 | 80 | Oui |
| Barre de métal | Vestige | Contondant | 1,5 | 650 / 900 | 1,9 | 100 | Oui |
| Lance | Épieu + couteau + ficelle | Perçant | 1,2 | 650 / 900 | 2,6 | 40 | Oui |
| Lame forgée | 🔥 | Tranchant | 1 | 480 / 720 | 1,4 | 60 | Oui |
| Gourdin | Commun | Contondant | 1 | 550 / 800 | 1,5 | 25 | Non |
| Épieu | Commun | Perçant | 0,8 | 650 / 900 | 2,3 | 30 | Non |
| Couteau aiguisé | ⚙️ (meule) | Tranchant | 0,7 | 420 / 650 | 1,25 | 40 | Non |
| Couteau | Kit | Tranchant | 0,5 | 420 / 650 | 1,2 | 40 | Non |

Aucune arme à distance : la 0.6 apporte le **lancer** (pierre, réveil, hachette, Book 23 §5), avec un bouton, un arc de visée et un serveur qui juge la trajectoire.

### 1.3 Les matières qui existent

| Sorte | Matières |
|---|---|
| **Nature** | Branche, bûche, pierre, fibres (joncs), fruits, cèpes, poule (→ 4 portions de volaille crue) |
| **Fabriquées** | Ficelle, corde, charbon de bois |
| **Métal récupéré** | Lame de ressort (ressort de camionnette, « la meilleure matière pour une lame »), barre de métal, tête de hache, et les débris d'arme : lame ébréchée (→ lame de ressort), ferraille tordue (→ barre) |
| **Vestiges utiles plus tard** | Rouleau de fil de fer, bocal de clous, chambre à air, rallonge et câbles de démarrage (cuivre), cric, roulements (rare), alternateur de tracteur (rare), étau, sécateur, grillage, pied-de-biche, ceinture de sécurité |
| **Treize composants** (sans aucun usage aujourd'hui) | Fil de cuivre, petit moteur, pile, cellule lithium, aimant, LED, résistance, verre, aluminium, plastique, papier, **petit ressort**, caoutchouc |

**Ce qui manque** pour un vrai métier : des **essences de bois** (le Book 03 §5.3 dit que les Mécanistes reconnaissent le bois par essence, mais tous les arbres sont du décor ou des fruitiers) ; les **sous-produits** de la poule (plumes, os) ; une **qualité** d'objet (les étoiles du Book 02 §9 ne sont pas codées, et l'inventaire compte des types, pas des exemplaires) ; un usage pour les composants.

### 1.4 Ce que la demande change dans les books

Trois choses : l'arc n'est plus mécaniste mais commun (Books 01, 06, 11) ; le combat des Charbonniers passe de la poudre noire aux **lames** ; l'électricité **étourdit sans blesser** (Books 01, 06). Le détail est au §11.

---

## 2. Le principe

### 2.1 Un métier, c'est trois choses

1. **Une filière** : une chaîne de transformations qu'on maîtrise de bout en bout (le charbon jusqu'à la lame trempée ; la cellule jusqu'à la matraque ; la planche jusqu'à l'arbalète).
2. **Une gamme** : des objets dont les **autres familles ont besoin** chaque semaine (une lame s'use, une batterie se vide, un carreau se perd).
3. **Une qualité qui monte** : la règle du maillon faible (Book 02 §9). La famille native atteint les **étoiles hautes** ; les autres, rarement.

### 2.2 Trois façons d'avoir un objet de métier

| Voie | Coût | Qualité | Pour qui |
|---|---|---|---|
| **Le fabriquer dans sa famille** | Normal | Jusqu'à ★★★★★ | La famille native |
| **Le fabriquer hors de sa famille** | **×1,5** en matières et en temps (Book 01 §5) | **Plafonnée à ★★** | Celui qui a appris la recette (§2.3) |
| **L'acheter ou l'échanger** | Le cours du Comptoir, ou ce qu'on négocie | Celle du fabricant | Tout le monde : c'est la voie voulue (Book 02 §12.1) |

Le plafond à ★★ est la vraie raison d'acheter : un Mécaniste **peut** forger une machette, mais elle cassera deux fois plus vite que celle d'un Charbonnier. Personne n'est bloqué ; tout le monde a intérêt à commercer.

### 2.3 Apprendre la recette d'une autre famille

Aujourd'hui, le code cache les recettes des autres familles. On propose de les **montrer grisées** avec la mention « chez les Charbonniers » (P-002, recette pressentie du Book 03 §5.1), et de les ouvrir de deux façons :

- **une leçon** d'un joueur de la famille (Book 03 §5.4 : ensemble, au même endroit, quelques minutes ; l'enseignant gagne du rayonnement une fois par élève) ;
- **un manuel** trouvé dans un lieu de fouille (le *Manuel du forgeron amateur*, le *Guide de l'électricien du dimanche*, *L'Arbalète pour les nuls*), rare.

Les installations de métier restent **utilisables par tous** quand on les visite (Book 24 Q5), sauf les machines qui demandent le savoir (la forge, le banc).

### 2.4 Les garde-fous du Book 02 §15

La famille native produit au moins 20 % moins cher (×1,5 hors famille : 33 %), et personne ne paie plus de 3 fois la voie la moins chère. Chaque métier paie dans **sa monnaie** (Book 01 §5) : 🔥 le charbon et le bruit, ⚡ les Wh et les composants rares, ⚙️ le temps et les calories. **Rien de puissant ne sort d'une quête** (Book 22 §1).

---

## 3. Le socle commun : l'arc pour tous

### 3.1 Pourquoi pour tous

L'arc simple, taillé d'une seule pièce dans une perche, est la technique de jet la plus ancienne et la plus répandue : il n'a rien d'un savoir de métier. Le Book 01 le plaçait au palier I des Mécanistes ; on le **sort du métier**, et les Mécanistes gardent ce qui est vraiment mécanique : **l'arbalète** et les pièges. Ils gardent aussi un avantage sur l'arc, qui leur vient de leur savoir (Book 03 §5.3) : **ils reconnaissent les essences**, donc ils trouvent la meilleure perche (§6.1).

### 3.2 Les matières nouvelles de l'arc

| Matière | Où | Comment | Énergie grise |
|---|---|---|---|
| **Perche de frêne** | Deux **frênes** à la lisière de chaque terrain (nouvelle ressource : un arbre qu'on reconnaît à ses bourgeons noirs) ; ils repoussent en 6 h réelles | Couper 2 (couteau aiguisé, lame forgée, serpe) ; 1 perche par coupe | ≈ 10 wotts |
| **Bâton d'if** | La **haie d'ifs** taillés en boules du parking de la Coopérative (les Abondants la faisaient tailler tous les mois) ; et, pour les Mécanistes seulement, un if repéré au fond du bois | Couper 2 ; rare, 1 par visite | ≈ 30 wotts |
| **Plumes** | **Sous-produit** de « Plumer et vider la poule » : 1 poignée de plumes | Rien de plus | ≈ 2 wotts |
| **Os** | Même sous-produit : 1 os de poule | Rien de plus | ≈ 2 wotts |
| **Fûts** | Une branche droite donne 3 fûts | Couper 1, redressés au-dessus d'un feu | ≈ 3 wotts le fût |
| **Corde d'arc** | 3 ficelles retordues (★★), **ou** 1 bobine de **fil dentaire** (★★★★, vestige de salle de bain : « Menthe Glaciale, 50 m ») | Rien ; 10 min | ≈ 15 wotts |

> L'if est le bois d'arc idéal (l'arc anglais), mais il pousse lentement et toutes ses parties sont toxiques : on n'en mange pas les baies, et l'examen le dit. Le frêne, l'orme et le noisetier font de très bons arcs simples. C'est le réalisme bushcraft, sans dictionnaire.

### 3.3 Les recettes

| Recette | Matières | Outil | Où | Durée (jeu) | Résultat |
|---|---|---|---|---|---|
| **Ébaucher un arc** | 1 perche de frêne (ou 1 bâton d'if) | Couper 1 | Établi | 45 min, moyenne | Une **ébauche d'arc**, qui doit sécher (processus passif : 2 h réelles, même hors ligne, à l'abri) |
| **Monter l'arc** | 1 ébauche sèche, 1 corde d'arc | Couper 1 | Un feu allumé (on durcit le ventre de l'arc à la chaleur) | 20 min, légère | **Arc simple** ★★★ (frêne) ou **arc d'if** ★★★★ |
| **Flèches durcies** | 1 branche (3 fûts), 1 poignée de plumes, 1 ficelle | Couper 1, feu | — | 20 min, légère | 3 flèches à pointe durcie au feu |
| **Flèches à pointe d'os** | 1 branche, 1 plumes, 1 ficelle, 1 os | Couper 1 | — | 25 min, légère | 3 flèches |
| **Flèches à pointe de clou** | 1 branche, 1 plumes, 1 ficelle, 1 bocal de clous pour 12 pointes | Couper 1, **Marteler 1** | — | 25 min, légère | 3 flèches |
| **Flèches à pointe d'acier** | 1 branche, 1 plumes, 1 ficelle, 3 **pointes d'acier** (🔥, §4.3) | Couper 1 | — | 20 min, légère | 3 flèches |

L'**arc de tir sportif** (vestige rare, bureaux de la Coopérative : « Club de tir à l'arc d'entreprise, séminaire 2031 ») est un arc ★★★★★ tout fait ; ses flèches en carbone (vestige) se récupèrent sans casser, jusqu'à ce qu'on les perde.

### 3.4 Les règles du tir

Le tir **réutilise le lancer de la 0.6** (Book 23 §5) : même bouton, même arc de visée, même serveur de projectiles. Il n'y a rien de plus à apprendre.

| Règle | Ce qu'elle dit |
|---|---|
| **Préparer** | Dans le sac, l'arc se met « **Prêt à tirer** » (l'objet rapide). A reste l'arme de contact : on a les deux à la fois |
| **Bander et viser** | **Maintenir** le bouton Lancer : le personnage bande, l'arc de visée s'accroche à l'Éteint le plus proche devant soi (sur ordinateur, la souris) |
| **Tir rapide ou tir plein** | Relâcher **avant 1 s** : tir rapide, dégâts faibles. **Après 1 s** : tir plein. Le cercle de visée **se referme** quand l'arc est bandé à fond ; on le voit, pas de règle cachée |
| **Toucher** | Dans la **portée utile**, la flèche touche la cible accrochée. Au-delà, la chance baisse jusqu'à zéro à la portée maximale ; le cercle passe du blanc à l'orange |
| **Tuer à la tête** | Un **tir plein** à la tête, dans la portée utile, avec une pointe d'os, de clou ou d'acier, **détruit** l'Éteint (Book 06 §2.2). La pointe durcie au feu ne tue pas à la tête |
| **Le casque** | La règle unique du Book 23 §4.2 ne change pas : le casque arrête le **tranchant**. La flèche est **perçante** : elle passe par la visière ouverte |
| **Les munitions** | La flèche qui manque tombe au sol, **ramassable** (perdue dans la mare). Celle qui touche reste plantée et se reprend sur le corps, sauf si elle casse : **une sur deux** pour la pointe durcie, **une sur trois** pour l'os et le clou, **une sur cinq** pour l'acier. Le message le dit |
| **L'endurance** | Bander coûte 6 d'endurance ; tenir bandé plus de 3 s en coûte 2 par seconde (le bras tremble) |
| **Le bruit** | La corde claque à **3 m** ; l'impact s'entend à 4 m. C'est l'arme la plus silencieuse du jeu : un atout contre des Éteints guidés par l'oreille (Book 06 §2.1) |
| **Le corps à corps** | On ne tire pas quand on est **saisi** : il faut d'abord se dégager (B) |

**La chasse.** Avec l'arc, les **lapins** du terrain deviennent chassables (Book 11 §10), dès que la faune vit côté serveur. Une flèche suffit ; le lapin donne 2 portions de viande, une peau (plus tard) et **des boyaux** pour une corde d'arc ★★★★ séchée.

---

## 4. Les Charbonniers 🔥 : les lames

### 4.1 La filière

| Étape | Ce qui existe | Ce qu'on ajoute |
|---|---|---|
| **1. Le charbon** | Meule de charbonnière : 10 bûches → 4 kg en 72 min réelles | Rien (la charbonnière en fût du Book 24 §3.1 viendra avec la lignée) |
| **2. La forge** | Foyer de forge à soufflet (≈ 900 °C, palier I) | **Une lignée de la forge** (Book 24) : niveau 2 **forge ventilée** (tuyère d'argile, soufflet double en cuir ou ventilateur 12 V ⚡, ≈ 1 300 °C) ; accessoire **enclume** (§9.3) |
| **3. L'acier** | Lame de ressort, barre de métal, débris | **Une qualité par matière** (§4.2) et quatre vestiges nouveaux (lime usée, soc de charrue, bidon d'huile, rail) |
| **4. Forger** | Lame forgée (1 ressort, 1 kg de charbon, 90 min) | Une **gamme** (§4.3) |
| **5. Tremper et revenir** | Compris dans la lame forgée | **Un geste à part**, avec le choix du bain (§4.2) |
| **6. Emmancher** | — | À l'établi : un manche (branche, ou manche tourné ⚙️ pour une étoile de plus), ficelle ou rivets |
| **7. Affûter** | La meule ⚙️ | Inchangé : les Mécanistes affûtent, les Charbonniers reforgent (§4.4) |
| **8. Le fer neuf** | — | **Bas fourneau** et minerai des marais (Book 04 §2), **après la 0b**, quand la ferraille se raréfie |

> On ne fond jamais l'acier (Book 04 §2.1) : on **forge** de l'acier récupéré. Tant qu'il reste des camionnettes, personne ne cémente. C'est la transition du Book 04 §5, et elle donne aux Charbonniers un métier pour toute la durée d'un cycle.

### 4.2 La qualité d'une lame

La règle du maillon faible (Book 02 §9), appliquée aux lames :

```
étoiles = min( acier, trempe, forge et outils ) + 1 si la forge est maîtrisée   (plafond ★★★★★)
```

| Facteur | ★★ | ★★★ | ★★★★ | ★★★★★ |
|---|---|---|---|---|
| **Acier** | Fer doux : barre de métal, clous, ferraille (il ne prend pas la trempe) | Soc de charrue, lame de scie | Lame de ressort (camionnette, débris reforgé) | Lime usée (acier à outils) |
| **Trempe** | Sans revenu (la lame est cassante) | Trempe à l'eau (risque) | Trempe à l'huile | Trempe à l'huile, maîtrisée |
| **Forge et outils** | Foyer à soufflet, une pierre pour enclume | Foyer à soufflet, marteau | Forge ventilée, marteau, pinces de forge | Forge ventilée, enclume de rail |

- **La trempe à l'eau** est toujours possible, mais **une lame sur trois se fend** : elle redevient une lame ébréchée, à reforger (Book 02 §9 : jamais de disparition totale). Le risque est affiché avant le geste.
- **La trempe à l'huile** est sûre ; il faut un **bidon d'huile** (vestige du garage, 5 L, vingt trempes : « Huile Turbo Max Énergie, pour moteurs de plus de 400 chevaux »), ou de la **graisse** de volaille (une trempe).
- **La maîtrise** (Book 03 §5.4) : après **10 lames** forgées de même sorte, la forge est maîtrisée pour cette sorte : +1 étoile, plafond ★★★★★.
- **Hors famille** : plafond ★★ (§2.2), quelle que soit la matière.

**Ce que font les étoiles** (Book 02 §9), et seulement cela :

| | ★ | ★★ | ★★★ | ★★★★ | ★★★★★ |
|---|---|---|---|---|---|
| **Solidité** | ×0,5 | ×0,75 | ×1 | ×1,5 | ×2 |
| **Dégâts** | −20 % | −10 % | référence | +10 % | +20 % |

Les étoiles s'affichent sur la fiche de l'objet et sur sa case du sac. La valeur au Comptoir suit l'énergie grise, plus le cours : une lame ★★★★★ se vend mieux, parce qu'elle dure deux fois plus.

### 4.3 La gamme

Les valeurs de combat sont à ★★★ (la référence) ; elles sont reprises au §8.

| Objet | Matières | Outil, installation | Durée | Usage |
|---|---|---|---|---|
| **Pinces de forge** (le premier objet du forgeron) | 1 barre de métal, ½ kg de charbon | Marteler 2, forge | 40 min, lourde | Qualité **Saisir à chaud 2** (Book 03 §4) : sans elles, pas plus de ★★★ |
| **Couteau de forge** (la lame forgée d'aujourd'hui, renommée) | 1 lame de ressort, 1 kg de charbon, puis un manche | Marteler 2, forge ; établi | 90 min + 15 | **Couper 3**. Arme vive |
| **Hachette** | ½ barre de métal, ½ lame de ressort (la **mise d'acier** : on soude le tranchant d'acier sur un corps de fer), 1 kg de charbon, 1 branche | Marteler 2, forge ; établi | 75 min | **Fendre 2**, arme, **se lance** (Book 23 §5) |
| **Hache forgée** | 1 barre de métal, 1 lame de ressort (mise d'acier), 2 kg de charbon, 1 bûche (le manche) | Marteler 2, forge ventilée ; établi | 2 h | **Fendre 3** ; remplace la tête de hache rouillée qu'on ne trouve plus |
| **Machette** | 2 lames de ressort, 1,5 kg de charbon, 1 branche, 2 rivets | Marteler 2, forge ; établi | 2 h | Couper 2, arme vive |
| **Serpe** | 1 lame de ressort, 1 kg de charbon, 1 branche | Marteler 2, forge | 80 min | **Couper 2 et Élaguer** : une coupe de branches en donne 2 de plus, et une perche de frêne se coupe sans effort. Arme moyenne |
| **Glaive de ressort** (l'épée courte) | 3 lames de ressort, 3 kg de charbon, 1 manche tourné (⚙️) ou 1 branche, 2 rivets | Marteler 2, **forge ventilée**, maîtrise du couteau | 4 h | L'arme la plus vive de la gamme. Réservé à la forge ventilée : c'est la pièce de vitrine du forgeron |
| **Pointe de lance forgée** | ½ lame de ressort, ½ kg de charbon | Marteler 2, forge | 40 min | Remplace le couteau ligaturé : la **lance à pointe forgée** |
| **Pointes d'acier** (flèches et carreaux) | 1 lame de ressort, ou 1 rouleau de fil de fer (★★) | Marteler 2, forge | 45 min | **12 pointes** |
| **Rivets et clous forgés** | 1 barre de métal, 1 kg de charbon | Marteler 2, forge | 60 min | 20 pièces : manches, coffre cerclé, arbalète |
| **Ciseau à bois et burin** | 1 lame de ressort (pour les deux), 1 kg de charbon | Marteler 2, forge | 60 min | Nouvelles qualités **Tailler le bois 2** (mortaises : arbrier d'arbalète, tour) et **Trancher le métal 1** (couper une tôle, un fil d'acier) |
| **Ressort retrempé** (l'arc d'arbalète) | 1 lame de ressort, 1 kg de charbon, 1 trempe à l'huile | Marteler 2, forge | 60 min | Rend sa **nervosité** à un ressort fatigué : c'est le cœur de l'arbalète mécaniste (§6.1) |

> **Le ton (Book 15).** Le forgeron de l'an 30 tire ses meilleures lames d'une camionnette de livraison « Livré en 20 minutes ou c'est gratuit ». La lime usée vient d'un « kit manucure de luxe » de quatre kilos. L'enclume, c'est le rail de l'embranchement des silos, où plus aucun train n'est passé depuis la Grande Panne.

### 4.4 La réparation et l'usure (lien avec la 0.5)

| Situation | Qui | Ce qu'on fait | Coût |
|---|---|---|---|
| **Abîmée** (sous 30 %) | Tous | Réparation de fortune (ficelle, chiffons) : remonte jusqu'à « abîmée » (Book 23 §4.3, inchangé) | 1 ficelle, 1 chiffon |
| **Abîmée** | ⚙️ (meule) | **Affûter** : remise à neuf (inchangé) | Quelques minutes de pédalage |
| **Abîmée** | 🔥 (forge) | **Reprendre la lame** : chauffer, redresser, affûter à la lime. Remise à neuf, sans meule | ½ kg de charbon |
| **Cassée** (le débris « lame ébréchée ») | 🔥 | **Reforger** : la lame ébréchée redevient la **même arme**, à une étoile de moins, sans repasser par le ressort | 1 kg de charbon, la moitié du temps de forge |
| **Cassée** | Tous | Démonter le débris : une lame de ressort (inchangé, Marteler 1) | — |

Deux nouveautés : la **forge répare aussi les lames** (aujourd'hui, un Charbonnier ne peut pas réparer sa propre lame, puisque la meule est mécaniste) ; et le **reforgeage** donne une valeur au débris, ce qui fait vivre un petit commerce de ferraille. Les Mécanistes gardent l'affûtage, moins cher et plus rapide : chacun son geste.

### 4.5 Le prix du métier

- **Le bruit** : marteler s'entend à 40 m (`BRUIT_ACTION.lourd`), +50 % pour les Charbonniers (*Feu bavard*). Forger une machette, c'est 2 h de jeu de marteau : la forge doit être derrière des murs (Book 01 §4).
- **Le charbon** : un forgeron qui produit pour les trois familles brûle une charbonnière par jour.
- **Repère d'énergie grise**, procédé de référence : couteau de forge ≈ 215 wotts ; hachette ≈ 190 ; machette ≈ 330 ; hache ≈ 380 ; glaive ≈ 620 ; 12 pointes d'acier ≈ 125.

---

## 5. Les Voltaïques ⚡ : l'électricité

### 5.1 Comment l'électricité agit sur un Éteint (décision proposée)

Un Éteint ne **sent pas la douleur** : la fièvre grise a éteint tout ce qui n'est pas la faim. Un **aiguillon à bétail** (une décharge qui fait mal) ne lui fait donc rien. En revanche, ses **muscles obéissent encore aux nerfs** : sinon, il ne marcherait pas. Une décharge assez longue fait **contracter tous ses muscles à la fois** (la tétanie) : il **lâche prise**, se raidit, et tombe s'il est en déséquilibre. Son cerveau, lui, n'est pas touché : **il se relève**. Son cœur bat à peine : le courant n'a rien à arrêter.

D'où une règle courte, la même pour toutes les armes et défenses électriques :

> **Électrique : il lâche et se raidit ; une décharge longue le met à terre. Jamais de dégâts, jamais de mort. Le casque n'y change rien.**

C'est cohérent avec le Book 06 (« un Éteint étourdi n'est pas mort ») et avec l'identité des Voltaïques (Book 01 §4 : ils ne frappent pas fort, ils choisissent leurs combats). Cela crée la **combinaison** propre à la famille : **la décharge le met à terre, le couteau l'achève** (au sol, n'importe quel coup le détruit).

### 5.2 Les matières

| Matière | Où | Rôle |
|---|---|---|
| **Cellule lithium** (existe) | Démontage : batterie externe (4), perceuse (5), aspirateur robot (4), robot domestique (10) | Le réservoir des armes électriques |
| **Fil de cuivre, résistance, LED, petit ressort, caoutchouc** (existent) | Démontage | Câblage, contacts, isolant de la poignée |
| **Raquette anti-moustiques** (vestige nouveau, gadget, commun) | Boutique, bureaux | Un petit **étage haute tension** tout fait. « Électrocute les insectes et les ennuis. » |
| **Bobine d'allumage** (vestige nouveau, voiture, peu commun) | Épaves | La vraie haute tension : la matraque sérieuse et la clôture |
| **Appareil photo jetable** (vestige nouveau, salon, commun) | Boutique | Un **condensateur** de flash : il donne le claquement de la décharge longue. « Vingt-sept poses, toutes de son assiette. » |

**Les pièces intermédiaires**, toutes ⚡ :

| Pièce | Matières | Outil | Durée | Ce que c'est |
|---|---|---|---|---|
| **Pack de cellules** | 3 cellules lithium, 1 fil de cuivre, 1 ruban adhésif (ou 1 ficelle) | Visser 1 | 20 min | **12 Wh** portables, 0,2 kg. Se recharge au banc. Utile à toutes les familles (lampes, matraques) |
| **Module de décharge** | 1 raquette anti-moustiques **ou** (1 bobine d'allumage, 1 appareil photo jetable), 1 fil de cuivre | Visser 1 ; banc à côté | 30 min | La haute tension. Avec la raquette : ★★ ; avec la bobine : ★★★★ |

### 5.3 La gamme

| Objet | Matières | Outil | Durée | Usage |
|---|---|---|---|---|
| **Matraque électrique** (« la Raquette ») | 1 gourdin, 1 module de décharge, 1 pack de cellules, 1 caoutchouc | Visser 1, Couper 1 | 40 min | **Arme de contact électrique** (§8). Sans charge, c'est un gourdin court |
| **Aiguillon de défense** | 1 épieu, 1 module de décharge, 1 pack, 2 fils de cuivre (les électrodes au bout) | Visser 1 | 45 min | La même décharge, **à 2,3 m** : on le tient à distance |
| **Lampe de poche bricolée** | 1 pack, 4 LED, 1 boîte vide (le réflecteur) | Visser 1 | 15 min | Lumière blanche portée, **sans dynamo à tourner** ; 1 W (12 h). À vendre aux deux autres familles |
| **Alarme électrique** | 1 fil de fer (rouleau, 20 m), 1 pile, 1 LED, 1 petit ressort (le contact), 2 branches | Visser 1 | 20 min | Un fil tendu : un Éteint qui passe **allume la LED et fait vibrer l'alerte du joueur**. **Elle ne fait aucun bruit** : contrairement aux boîtes de conserve, elle ne l'attire pas. Le rapport d'absence la compte |
| **Clôture électrique** | 1 électrificateur (1 module ★★★★, 1 résistance, 1 fil de cuivre), 1 rouleau de fil de fer, 8 branches, 4 morceaux de plastique (les isolateurs), à moins de 6 m du banc | Visser 1, Couper 1 | 90 min | **Défense de la base** : une ligne de 6 m. ≈ 3 W pris au banc en continu (≈ 70 Wh par jour de calendrier, Book 01 §4). Un Éteint qui la touche se raidit 2 s et recule d'un pas ; il ne passe pas tant que le courant passe. **Trois Éteints qui poussent ensemble** la couchent (Book 06 §9.2 : ils poussent). Claquement à 5 m |
| **Plaque de choc** (le piège électrique) | 1 tôle (enjoliveur ou casserole aplatie), 1 module, 1 pack | Visser 1 | 30 min | Posée dans un passage : le premier Éteint qui marche dessus **tombe à terre** (4 s). Une décharge, puis il faut la réarmer (0,5 Wh) |
| **Ventilateur de forge 12 V** | 1 petit moteur, 1 pack ou un câble au banc, 1 plastique | Visser 1 | 20 min | **Accessoire de la forge** 🔥 : la ventilation devient passive (Book 04 §2.5) ; forge ventilée sans soufflet |
| **Bain de dérouillage** | 1 casserole, 1 barre de métal sacrificielle, 50 Wh pris au banc | — | 12 h de jeu (passif) | **+1 étoile** sur un outil ou une arme rouillée (tête de hache trouvée, machette de vestige ; Book 04 §3.8). Un service à vendre |

> Le **taser à fléchettes** (deux dards au bout d'un fil) est hors de portée du bricolage : ses cartouches ne se fabriquent pas. On peut en faire un **vestige légendaire** des bureaux de la Coopérative (« Paralyseur de la Sécurité Compagnie, 2 cartouches »), mais ce n'est pas le métier : c'est une trouvaille.

### 5.4 Les Wh, sans tricher

| Usage | Coût | D'où vient le chiffre |
|---|---|---|
| **Décharge courte** (A) | **0,25 Wh** | Une décharge utile, c'est ≈ 100 J tenus 2 s, l'ordre de grandeur d'un aiguillon agricole. Le montage bricolé gaspille ≈ 90 % de ce qu'il tire : ≈ 900 J, soit 0,25 Wh |
| **Décharge longue** (A maintenu) | **0,5 Wh** | Deux fois plus longue |
| **Un pack plein** | 12 Wh : **48 décharges courtes** | 3 cellules de récupération, fatiguées (≈ 4 Wh utiles chacune) |
| **Recharger un pack** | 12 Wh pris aux batteries du banc, 25 s réelles | Banc : 30 Wh par heure de jeu, rendement 85 % (`energie.ts`) |
| **Clôture** | ≈ 3 W continus | Book 01 §4 : 2 à 5 W |
| **Lampe bricolée** | 1 W | Quatre LED |

- **Le pack se vide** en se servant, et se lit dans le sac en barre de charge (comme la solidité). Vide, la matraque est un gourdin court ; l'alerte « Plus de courant » s'affiche une seule fois.
- **Un pack par visite de la Coopérative**, en gros : 12 wotts. C'est moins cher que l'usure d'une machette (≈ 2 wotts par coup), mais **ça ne tue pas** : il faut une deuxième arme pour achever.
- **Le banc ne recharge que si les batteries ont de quoi** : l'hiver gris (0b) vide les batteries et désarme les Voltaïques. C'est la faiblesse voulue de la famille (Book 01 §4 : énergie intermittente).
- **Courant propre** (Book 01 §4) : la production et le stockage ne font pas de bruit. La **décharge**, elle, crépite à 6 m : c'est une arme, pas une batterie.

---

## 6. Les Mécanistes ⚙️ : la mécanique

### 6.1 L'arbalète

L'arbalète est le métier mécaniste par excellence : un **arc d'acier** trop raide pour être bandé à la main, tenu tendu par un **mécanisme**, et relâché par une **détente**. On peut la porter **armée** : le premier tir part sans attendre, puis il faut réarmer, longtemps.

| Pièce | Matières | Outil, installation | Durée | Remarque |
|---|---|---|---|---|
| **Arbrier** (le fût) | 1 bûche | **Scier le bois 2** (scie du kit), **Tailler le bois 2** (ciseau 🔥) ou Couper 2 avec malus ; établi | 90 min | La rainure du carreau, le logement de la noix |
| **Noix et détente** | 1 petit ressort, 1 clou (ou rivet), 1 os ou un bout de bois dur | Couper 1 ; établi | 40 min | Noix en os ★★★, en bois ★★, **en acier forgé** (🔥, 2 rivets) ★★★★ |
| **Arc d'acier** | 1 **ressort retrempé** (🔥) ; à défaut, 1 lame de ressort brute | Serrer 1 (les brides) | 20 min | Brute : l'acier est fatigué, l'arbalète reste à ★★ |
| **Corde d'arbalète** | 2 cordes d'arc, ou 1 ceinture de sécurité découpée et cousue | — | 15 min | |
| **Monter l'arbalète légère** | Arbrier, noix et détente, 1 arc d'acier, 1 corde d'arbalète | Serrer 1 ; établi | 30 min | Se réarme **au pied**, dans l'étrier |
| **Arbalète lourde** | La même, avec **2 arcs d'acier** superposés | Serrer 1 ; établi | 45 min | Trop raide pour le pied : on la réarme au **pied-de-biche** (le vestige !) ou au **cranequin** |
| **Cranequin** (accessoire) | 1 roulement, 1 chaîne de vélo, 1 barre de métal | Serrer 2 ; pédalier (pour tailler le pignon à la meule) | 2 h | Réarme l'arbalète lourde en 4 s au lieu de 6, à la manivelle |
| **Carreaux** | 1 branche (2 fûts de bois dur, courts), 1 poignée de plumes **ou** 2 liasses de papier (les contraventions de la boîte à gants), 2 pointes (clou ou acier 🔥) | Couper 1 ; établi | 20 min | **4 carreaux** |

> **Un clin d'œil réaliste.** Le levier qui servait à armer les arbalètes au Moyen Âge s'appelait déjà un **pied-de-biche**. Le vestige que la Coopérative garde sous sa caisse retrouve son premier métier.

**Hors famille**, une arbalète se fabrique à ×1,5 et plafonne à ★★ : l'arc d'acier fatigué, la noix qui accroche. Les Charbonniers et les Voltaïques **l'achètent**, et rachètent des carreaux toutes les semaines.

### 6.2 L'arc, version mécaniste

Tout le monde fait un arc (§3), mais **les Mécanistes reconnaissent les essences** (Book 03 §5.3) : ils voient l'if du fond du bois (un bâton d'if par jour de calendrier, sans aller à la Coopérative), et leur ébauche passe au **tour à perche** pour une étoile de plus. Leurs arcs se vendent ★★★★.

### 6.3 Les pièges mécaniques

Ils ne consomment aucune énergie après la pose (Book 01 §4) et agissent sur ce qui existe déjà : le corps des Éteints (Book 06 §2.2).

| Piège | Matières | Outil | Effet sur un Éteint | Réarmer |
|---|---|---|---|---|
| **Collet** (pour tous, avec la faune) | 1 ficelle ou 1 fil de fer, 1 branche | Couper 1 | Aucun : il est pour les lapins (processus passif, Book 11 §10) | Tout seul |
| **Assommoir** (un poids qui tombe) | 2 bûches, 1 corde, 2 branches (la détente en 4) | Couper 1 ; établi | Le premier qui passe est **mis à terre** (5 s) : on l'achève | A sur le piège, 4 s |
| **Piège à mâchoires** | 2 **ressorts retrempés** (🔥), 1 barre de métal, 4 rivets, 1 chaîne de vélo (l'ancrage) | Serrer 1, Marteler 1 ; établi | Il **brise la jambe** : l'Éteint devient un **Rampant** (Book 06 §2.2), et il est tenu sur place 20 s | A sur le piège, 8 s, 12 d'endurance |
| **Fosse à pieux** | 6 branches | **Creuser 2** (bêche) | Il **tombe et reste coincé** (Book 06 §9.2) : on l'achève d'en haut | Retirer le corps |

> Le piège à mâchoires est une **commande type** entre familles : deux ressorts trempés du Charbonnier, la mécanique du Mécaniste. Posé derrière la porte de la chambre froide, il change une visite.

### 6.4 Ce qui va avec le pédalier, et le reste

| Objet | Matières | Outil | Effet |
|---|---|---|---|
| **Tour à perche** (installation, ⚙️) | 1 perche de frêne, 1 corde, 4 bûches, 2 branches | Couper 1, Serrer 1 | Tourner le bois : **manches tournés** (+1 étoile à l'arme qui le reçoit, pour les Charbonniers), fûts réguliers (+1 étoile aux flèches), bols |
| **Accessoire « soufflet à manivelle » du pédalier** | 1 roue de vélo, 1 bâche, 4 branches | Serrer 1 | Posé à moins de 3 m d'une forge : **ventilation passive** pendant qu'on pédale (l'autre voie que le ventilateur ⚡) |
| **Accessoire « meule fine »** | 1 pierre, 1 chiffon (le cuir de l'affûteur) | — | L'affûtage remonte à neuf **et** gagne +10 % de dégâts jusqu'à la prochaine casse (un fil de rasoir) |
| **Brouette** | 1 roue de vélo, 4 branches, 2 bûches | Scier le bois 1 | +60 kg roulés, la course reste possible sur le chemin (le travois traîne, la brouette roule) |
| **Pompe à chapelet** (lignée de l'eau, niveau 3) | 1 chaîne de vélo, 1 tuyau d'arrosage, 4 branches | Serrer 1 | L'eau de la mare à la citerne, sans porter : 10 L par minute de pédalage |

---

## 7. L'interdépendance

Personne n'est bloqué : chaque ligne a sa voie de secours, plus chère ou moins bonne. Mais la voie normale passe par l'autre famille.

| A besoin de → | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **🔥 Charbonniers** | — | **Ventilateur de forge** (forge ventilée sans soufflet) ; **dérouillage** (+1 étoile) ; alarme silencieuse pour forger tranquille | **Affûtage** à la meule ; **manches tournés** (+1 étoile) ; arbalète et carreaux pour se défendre sans bruit ; soufflet à manivelle |
| **⚡ Voltaïques** | **Couteau de forge** pour achever ce que la matraque met à terre ; pointes d'acier ; ressorts trempés pour les contacts | — | **Recharge par pédalage** quand le soleil manque ; arbalète ; brouette pour les batteries de 18 kg |
| **⚙️ Mécanistes** | **Ressorts retrempés** (arbalète, mâchoires) ; noix et rivets forgés ; ciseau à bois ; pointes de carreaux ; lames | **Lampe bricolée** (pas de dynamo à tourner) ; **packs de cellules** ; clôture électrique | — |
| **Tous** | Lames, haches, hachettes à lancer, pointes de flèche | Packs, lampes, alarmes, matraques | Arbalètes, carreaux, pièges, arcs d'if |

**Trois commandes qui doivent arriver souvent dans un test** (à mesurer, Book 07 §7.2) :

| Commande | Qui fournit quoi | Ce que ça apprend |
|---|---|---|
| **L'arbalète lourde** | 🔥 deux ressorts retrempés et des pointes ; ⚙️ l'arbrier, la noix, le montage | Une arme qui n'existe bien faite qu'à deux familles |
| **La visite de la Coopérative** | ⚡ la matraque et un pack chargé ; 🔥 le couteau qui achève | Un Voltaïque y va armé de deux métiers |
| **La forge silencieuse** | ⚡ l'alarme électrique ; ⚙️ le soufflet à manivelle ou ⚡ le ventilateur | Le Charbonnier forge plus longtemps sans être surpris |

---

## 8. L'équilibre du combat

### 8.1 Les armes de contact nouvelles

Dans le langage de `combat.ts`, à ★★★ (les étoiles modifient dégâts et solidité, §4.2). « Appuyé » : la durée du coup appuyé.

| Arme | Famille | Type | Dégâts torse | Coup / appuyé (ms) | Allonge (m) | Solidité | Tue à la tête |
|---|---|---|---|---|---|---|---|
| **Couteau de forge** (lame forgée) | 🔥 | Tranchant | 1 | 480 / 720 | 1,4 | 60 | Oui (inchangé) |
| **Hachette** | 🔥 | Tranchant | 1,3 | 520 / 780 | 1,4 | 50 | Oui ; **se lance** (10 m, Book 23 §5) |
| **Serpe** | 🔥 | Tranchant | 1,2 | 480 / 720 | 1,4 | 50 | Oui |
| **Machette forgée** | 🔥 | Tranchant | 1,5 | 500 / 750 | 1,6 | 55 | Oui |
| **Hache forgée** | 🔥 | Tranchant | 2 | 700 / 950 | 1,7 | 70 | Oui |
| **Glaive de ressort** | 🔥 | Tranchant | 1,6 | 520 / 780 | 1,7 | 70 | Oui |
| **Lance à pointe forgée** | 🔥 (pointe) | Perçant | 1,4 | 650 / 900 | 2,6 | 60 | Oui |
| **Matraque électrique** | ⚡ | **Électrique** | 0 | 450 / 800 | 1,3 | 60 | Non |
| **Aiguillon de défense** | ⚡ | **Électrique** | 0 | 650 / 950 | 2,3 | 40 | Non |

**Lecture.** Le glaive a le meilleur rythme de dégâts de la gamme (1,6 en 0,52 s), mais il reste **tranchant** : il glisse sur le casque de l'Équipé. La masse et le pied-de-biche gardent leur place contre les casqués. La hache forgée vaut la hache trouvée, en plus solide : elle remplace une tête rouillée qui ne se trouve plus. Aucune arme nouvelle ne dépasse la masse en dégâts par coup.

### 8.2 Le type « électrique »

Pourquoi un **quatrième type** plutôt que du contondant : parce que l'effet n'a rien à voir avec un choc. Il ne fait **pas de dégâts**, il **passe le casque** et il **libère d'une saisie**. Une seule ligne dans le sac le dit.

| | Décharge courte (A) | Décharge longue (A maintenu) |
|---|---|---|
| **Effet** | Il **lâche** (s'il tenait quelqu'un) et **se raidit 2,5 s** : il ne bouge plus, ne saisit plus | Il **tombe à terre** 4 s : n'importe quel coup l'achève |
| **Coût** | 0,25 Wh | 0,5 Wh |
| **Équipé (casque)** | Même effet | Même effet ; au sol, l'achever demande du contondant ou du perçant (règle du Book 23 §4.2, inchangée) |
| **Saisi** | **A fonctionne même saisi** : une décharge, et il lâche. C'est la réponse des Voltaïques (FOR −2) à la saisie | Idem |
| **Bruit** | Crépitement à 6 m | Claquement à 8 m |
| **Pack vide** | Un gourdin court : contondant, 0,6, ne tue pas à la tête | — |

Comparaison : un coup appuyé de machette (1,5 × 2 = 3 points) met déjà un Errant à terre. La décharge longue fait pareil, **sans s'user contre le casque ni le blouson** de l'Équipé (qui encaisse un point de plus au torse), mais elle **ne tue jamais**. L'équilibre tient : la puissance du Voltaïque, c'est le contrôle, pas la mise à mort.

### 8.3 Les armes de tir

Même bouton que le lancer de la 0.6. « Utile » : la cible accrochée est touchée ; « max » : au-delà, aucune chance.

| Arme | Famille | Type | Portée utile / max | Dégâts (rapide / plein) | Cadence | Tue à la tête | Bruit | Munitions | Solidité |
|---|---|---|---|---|---|---|---|---|---|
| **Pierre** (rappel, 0.6) | Tous | Contondant | 8 m | Faibles ; étourdit 1 s | 1 par seconde | Non | Impact (leurre) | Pierres | — |
| **Hachette lancée** (rappel, 0.6) | 🔥 | Tranchant | 10 m | 1,3 | Une, puis aller la reprendre | Oui, coup heureux | Impact 6 m | Elle-même | 50 |
| **Arc simple** (frêne) | Tous | Perçant | 12 / 25 m | 0,6 / 1,2 | ≈ 1 tir par 1,5 s | Tir plein, ≤ 12 m, pointe dure | 3 m | Flèches, 3 par recette | 150 tirs |
| **Arc d'if** | Tous (if) / ⚙️ | Perçant | 15 / 30 m | 0,7 / 1,4 | ≈ 1 tir par 1,5 s | Tir plein, ≤ 15 m | 3 m | Flèches | 200 tirs |
| **Arbalète légère** | ⚙️ | Perçant | 15 / 30 m | 1,5 (toujours plein) | Armée d'avance ; réarmer **3 s** (10 d'endurance), immobile | Oui, ≤ 15 m | 6 m | Carreaux, 4 par recette | 200 tirs |
| **Arbalète lourde** | ⚙️ | Perçant | 20 / 35 m | **3** (à terre en un carreau) | Réarmer **6 s** au pied-de-biche, 4 s au cranequin (16 d'endurance) | Oui, ≤ 20 m | 8 m | Carreaux | 250 tirs |

**Les règles qui tiennent l'ensemble :**

- **Le tir ne remplace pas le contact.** On ne tire pas saisi ; réarmer une arbalète immobilise ; contre trois Éteints au contact, la masse et le repousser valent mieux. Le tir sert à **éclaircir avant le contact** et à **chasser**.
- **La portée tient dans l'écran du téléphone** : à l'iPhone 13 mini, la vue isométrique montre ≈ 15 à 20 m autour du personnage ; les portées utiles s'y arrêtent. Au-delà, le tir reste possible (indicateur hors champ, Book 23 §4.5), mais incertain.
- **Les munitions sont l'usure** : une flèche coûte ≈ 8 wotts, un carreau à pointe d'acier ≈ 15. Une visite de la Coopérative à l'arc coûte ≈ 6 flèches cassées, du même ordre que l'usure d'une arme de contact.
- **Aucune arme de tir n'a de bruit d'impact qui porte loin** : c'est pour cela qu'on les veut. Le leurre reste la pierre lancée.

### 8.4 Ce que le joueur lit dans son sac

Une ligne par type, pas de règle cachée (Book 23 §4.2) : **contondant** « Passe le casque, étourdit plus longtemps » ; **tranchant** « Le casque l'arrête à la tête » ; **perçant** « Sa force, c'est l'allonge » (au tir : « Tir plein à la tête : il tombe pour de bon ») ; **électrique** « Il lâche et se raidit ; maintenu, il tombe. Ne tue jamais. » Plus, pour les armes de métier, les **étoiles**, la **charge** et les **munitions**.

---

## 9. Ce qu'il faut ajouter au monde

### 9.1 Les matières nouvelles

| Matière | Où | Comment | Énergie grise | Lot |
|---|---|---|---|---|
| **Perche de frêne** | 2 frênes à la lisière de chaque terrain | Couper 2 ; repousse en 6 h | 10 | A |
| **Bâton d'if** | Haie d'ifs de la Coopérative ; un if au fond du bois, visible des seuls ⚙️ | Couper 2 | 30 | A |
| **Plumes, os** | Sous-produits de « Plumer et vider la poule » | — | 2 | A |
| **Graisse** | Sous-produit de la volaille rôtie (Book 24 §3.5, lanterne à bocal) | — | 3 | B |
| **Boyaux** | Lapin vidé (avec la faune côté serveur) | Couper 1 | 4 | C |
| **Minerai des marais** | Lieux de flux (Book 04 §2.2) | Creuser 2 | Book 04 | Après 0b |

### 9.2 Les vestiges nouveaux

| Vestige | Famille de vestige, rareté | Où | Sert à |
|---|---|---|---|
| **Fil dentaire** « Menthe Glaciale, 50 m » | Salle de bain, C | Boutique | Corde d'arc ★★★★ |
| **Raquette anti-moustiques** | Gadget, C | Boutique, bureaux | Module de décharge ★★ |
| **Appareil photo jetable** | Salon, C | Boutique | Condensateur |
| **Bobine d'allumage** | Voiture, P | Épaves, atelier de la Coopérative | Module de décharge ★★★★, clôture |
| **Lime usée** (« kit manucure de luxe ») | Garage, P | Atelier | Acier ★★★★★ |
| **Soc de charrue** | Ferme, P | Grange, quai | Acier ★★★ (hache, serpe) |
| **Bidon d'huile moteur** | Garage, C | Atelier, épaves | Trempe à l'huile (20 trempes) |
| **Tronçon de rail** | Garage, R | L'embranchement des silos (Coopérative) | Enclume ★★★★★ |
| **Arc de tir sportif**, **flèches en carbone** | Gadget, R / P | Bureaux de la Coopérative | Arc ★★★★★ tout fait |

### 9.3 Les installations, et les niveaux à ajouter aux lignées (Book 24)

| Lignée ou installation | Niveaux et accessoires | Famille | Lot |
|---|---|---|---|
| **La forge** | 1 foyer à soufflet (existe) → **2 forge ventilée** (tuyère d'argile, soufflet double ; 1 chiffon de cuir ou de bâche, 6 pierres, 1 barre). Accessoires : **enclume** (pierre plate ★★, étau ou tête de masse ★★★, rail ★★★★★), **ventilateur 12 V** (⚡), **soufflet à manivelle** (⚙️), **bac de trempe** (1 casserole) | 🔥 | A (niveau 1, enclume), B (niveau 2) |
| **L'établi** | Book 24 §5 (établi utile, étau) ; accessoire **redresseur de fûts** (2 branches, 1 pierre chaude) : les flèches à l'établi vont 2 fois plus vite | Tous | A |
| **Le banc de recharge** | Accessoire **électrificateur** (la clôture se branche dessus) ; **poste de montage** (pince, fer à souder bricolé avec une résistance) : +1 étoile aux modules | ⚡ | A (poste), B (électrificateur) |
| **Le pédalier** | Accessoires existants (meule, dynamo) + **soufflet à manivelle**, **meule fine** | ⚙️ | B |
| **Tour à perche** | Nouvelle installation, 1 × 2 cases | ⚙️ | B |
| **Bas fourneau** | Nouvelle installation, 2 × 2 cases, palier III (Book 04 §2.3) | 🔥 | Après 0b |

### 9.4 Les quêtes « Le métier » (Book 22 §3.2)

Les quatre étapes actuelles restent. On ajoute **quatre étapes par famille**, qui font découvrir la gamme et **mènent toujours vers l'échange**. Chacune se fait seul, au pire à une étoile de moins (Book 22 §1 : personne ne reste bloqué). Récompenses : 20, 25, 30, 40 wotts, des primes des Compteurs.

| Famille | 5 | 6 | 7 | 8 |
|---|---|---|---|---|
| 🔥 | **Les pinces** : forger des pinces de forge | **La trempe** : un couteau de forge ★★★ ou mieux | **La mise d'acier** : forger une hachette ou une hache | **Le fournisseur** : vendre ou échanger une lame **à un joueur** d'une autre famille |
| ⚡ | **Du courant en poche** : monter un pack de cellules | **La Raquette** : une matraque électrique | **Prévenu sans bruit** : poser une alarme électrique | **Le courant chez les autres** : échanger un pack ou une lampe avec un joueur d'une autre famille |
| ⚙️ | **Le bois qui plie** : un arc d'if | **Le pied-de-biche** : une arbalète (légère ou lourde) | **Les mâchoires** : poser un assommoir ou un piège à mâchoires | **Le carquois des autres** : échanger 8 carreaux avec un joueur d'une autre famille |

**Pour tous**, une ligne « S'installer » gagne **« Le premier arc »** (monter un arc simple, récompense : 3 flèches à pointe d'os) et **« Tir plein »** (détruire un Éteint d'une flèche à la tête).

### 9.5 L'aide du jeu

Cinq rubriques nouvelles ou mises à jour (`client/src/aide-contenu.ts`), qui expliquent **comment**, jamais **où** est le rare (l'if, la lime, le vestige légendaire) :
- **Tirer à l'arc** : prêt à tirer, maintenir pour bander, le cercle qui se referme, ramasser ses flèches ;
- **Les étoiles d'un objet** : « la moins bonne des trois choses fixe la qualité », et ce que changent les étoiles ;
- **Le métier des autres** : les recettes « chez les Charbonniers », la leçon d'un joueur, le ×1,5 et le plafond ★★ ;
- **L'électricité contre les Éteints** : la règle en une ligne (§5.1), la charge, la recharge au banc ;
- **Pièges et défenses** : poser, réarmer, ce que fait chaque piège.

### 9.6 L'impact technique (pour le développement)

- **Sous-produits** : `Recette` gagne `sousProduits` (plumes et os de la poule), comme les démontages qui ont déjà plusieurs sorties.
- **Qualité par exemplaire** : un suffixe d'étoiles sur les seuls objets de métier (`couteau_forge#4`), qui s'empilent par étoiles ; l'usure suit la même clé (question 2).
- **Hors famille** : `recettesConnues` rend aussi les recettes apprises (une liste dans le personnage), avec le ×1,5 de `lignees.ts` et le plafond ★★.
- **Tir** : une table `ARMES_TIR` à part (sinon `meilleureArme` choisirait un arc au contact) ; le serveur de projectiles de la 0.6 sert tel quel.
- **Électrique** : `TypeDegat` gagne `"electrique"` ; `encaisser` pose `etourdi` ou `a_terre` sans `degats` ; la charge du pack se range comme l'usure.
- **Pièges et clôture** : des installations à déclencheur, comme l'alarme à boîtes de conserve.
- **Modèles et sons** (agent graphisme, session son) : arc, arbalète, flèche et carreau en vol, matraque et son arc bleu, clôture, pièges ; corde qui claque, crépitement, trempe, déclic.

---

## 10. Le découpage en lots

| Lot | Contenu | Version proposée | Pourquoi là | Critère de réussite |
|---|---|---|---|---|
| **A0 · L'arc avec le lancer** | Frênes, plumes et os, arc simple et d'if, flèches durcies, d'os et de clou ; tir dans le bouton Lancer ; la hachette (0.6) devient aussi une recette 🔥 | **0.6**, avec le lancer | Le serveur de projectiles, le bouton et l'arc de visée sont faits **une seule fois** pour la pierre et pour la flèche. L'arc n'a besoin d'aucun métier | ≥ 60 % des joueurs ont tiré une flèche ; un Errant tué au tir plein sans saisie |
| **A · Les trois métiers, le cœur** | La qualité ★ (exemplaires, maillon faible) ; 🔥 pinces, couteau de forge, hachette, machette, pointes, reprise et reforgeage ; ⚡ pack, matraque, lampe, alarme électrique ; ⚙️ arbalète légère, carreaux, assommoir ; recettes hors famille (leçon, ×1,5, ★★) ; quêtes 5 à 7 | **0.7** | Il faut les étoiles avant la gamme : sans elles, une lame de Charbonnier vaut la machette trouvée. Chaque famille reçoit **une arme et un objet utile aux autres** en même temps : aucune n'attend | Au moins un échange de métier par joueur et par semaine ; ±5 % entre familles sur le temps passé à se défendre |
| **B · Les ateliers** | Forge ventilée, enclume, ventilateur 12 V, soufflet à manivelle ; hache forgée, serpe, glaive, lance à pointe forgée, ressort retrempé ; arbalète lourde, cranequin, piège à mâchoires, tour à perche, meule fine ; clôture électrique, plaque de choc, dérouillage ; quête 8 | **0.8** | Les installations croisées (Book 02 §8) demandent que les trois métiers existent déjà ; la clôture et les pièges travaillent mieux avec la défense de la 0b qui approche | Une arbalète lourde fabriquée à deux familles dans chaque test ; une clôture tient une nuit |
| **C · L'hiver et la chasse** | Lapins chassables, boyaux, collet ; la clôture et les pièges contre le **siège hors ligne** (Book 06 §9.4) ; les packs qui se vident au froid | **0b** | La faune côté serveur et le siège sont des chantiers de la 0b | On passe l'hiver en défendant sa base avec un métier |
| **D · Le fer neuf** | Bas fourneau, minerai, cémentation ; la poudre noire, si elle est gardée | **Après 0b** (1.0 et plus) | La ferraille doit d'abord se raréfier (Book 04 §5) | Le cours de la lame de ressort monte assez pour rendre le bas fourneau rentable |

**Le croisement avec le Book 24.** Le Book 24 place son lot 2 (la base qui s'organise) en 0.7. Les deux chantiers touchent le terrain et `Recette`. Recommandation : **0.7 = le métier (lot A) et la part du lot 2 qui le sert** (établi utile, râtelier, bûcher couvert) ; le reste du lot 2 (claie, fumoir, carillon, pieux) en 0.7.1 ou en 0.8, avec le lot B.

---

## 11. Les incohérences repérées entre le code et les books

| Sujet | Code | Books | Proposition |
|---|---|---|---|
| **L'arc** | — | Book 01 §4 et §5, Book 06 §8.2, Book 11 §10 : arc et arbalète **mécanistes** | Arc pour tous, arbalète mécaniste (§3.1) ; mettre les trois books à jour après validation |
| **Le combat des Charbonniers** | — | Book 01 §5 : la **poudre noire** | Les lames ; la poudre noire reportée (question 7) |
| **L'électricité** | — | Book 01 §4 et Book 06 §8.2 : la clôture « étourdit et **blesse** » | Étourdit, ne blesse jamais (§5.1) |
| **Recettes des autres familles** | `recettesConnues` : invisibles, impossibles | Book 01 §5 : apprentissage, puis ×1,5 ; Book 24 l'applique aux lignées seulement | Ouvrir les recettes par la leçon (§2.3) |
| **Réparer une lame** | `ATELIER_REPARATION.lame` = la meule du **pédalier**, recette mécaniste | Book 23 §4.3 | Un **Charbonnier ne peut pas réparer sa propre lame** : ajouter la forge (§4.4) |
| **La qualité ★** | Absente ; l'inventaire compte des types | Book 02 §9 : maillon faible ; Book 23 §4.3 : l'usure par type | Qualité par exemplaire pour les objets de métier (§9.6) |
| **La forge de la lame** | « Foyer de forge à soufflet », 1 kg de charbon | Book 01 §3 : ce foyer chauffe **au bois** à 900 °C (palier I) ; un couteau, c'est 1,25 à 2,5 kg de charbon ; Book 02 §12.1 : forge **ventilée** (palier II) | Garder 1 kg pour le couteau en 0a ; la forge ventilée devient le niveau 2 (§9.3) ; corriger le Book 01 (le foyer à soufflet brûle aussi du charbon) |
| **La lame forgée** | Une lame **sans manche** qui sert d'arme | Book 02 §12.1 : une lame de couteau | La renommer « couteau de forge » (même identifiant), emmanchée |
| **Valeur de la machette** | Vestige à **30 wotts** | Lame forgée (plus faible) ≈ 215 wotts d'énergie grise ; Book 01 §6 : un vestige vaut ce qu'il coûterait à refaire | Remonter la machette, la masse et le pied-de-biche à leur valeur de remplacement (≈ 330, 200, 150) |
| **La lame ébréchée** | **4 wotts**, et son démontage donne une lame de ressort à **50 wotts** | Book 02 §15 règle 4 : pas de boucle qui crée de la valeur | Valeur ≈ 40 wotts |
| **La lance** | Déclarée **deux fois** : vestige (`VESTIGES.lance`, 14 wotts) et produit de recette ; son énergie grise est celle du vestige | Book 01 §6 : énergie grise d'un objet fabriqué = matières + travail | La sortir des vestiges (≈ 75 wotts par la recette) |
| **Qualités d'outil manquantes** | Machette, masse, pied-de-biche : aucune qualité | Book 03 §4 : masse **Marteler 3** ; une machette coupe | Machette Couper 2 ; masse Marteler 3 ; pied-de-biche Marteler 1 |
| **Essences de bois** | Aucune : arbres de décor ou fruitiers | Book 03 §5.3 : les ⚙️ reconnaissent le bois par essence | Frênes et ifs (§9.1) |

Le Book 02 §14 bis (« pierre à aiguiser écartée, pour ne pas casser la meule ») et P-002 (aiguillon à décharge en Électricité II, arbalète en Mécanique II) sont **cohérents** avec cette proposition.

---

## 12. Les questions ouvertes

1. **L'arc pour tous, et que gardent les Mécanistes ?**
   *Recommandation :* l'arc simple pour tous ; les Mécanistes gardent **l'arbalète, les pièges et le tour**, et un avantage sur l'arc qui vient de leur savoir (ils trouvent l'if, leurs arcs passent ★★★★). Mettre à jour les Books 01, 06 et 11.

2. **La qualité par exemplaire : pour tout, ou pour les seuls objets de métier ?**
   *Recommandation :* **les seuls objets de métier** (lames, arcs, arbalètes, armes électriques), par un suffixe d'étoiles dans l'inventaire. Un caillou n'a pas d'étoile. À faire relire par l'architecte BMAD avant le code.

3. **Les recettes des autres familles : comment s'ouvrent-elles ?**
   *Recommandation :* grisées et visibles « chez les Charbonniers » ; ouvertes par **la leçon d'un joueur** de la famille (ou un manuel rare) ; ×1,5 en matières et en temps ; **plafond ★★**. Pour un joueur seul sur le serveur, un manuel par famille au coffre du directeur de la Coopérative.

4. **Un quatrième type de dégât, « électrique » ?**
   *Recommandation :* **oui**. L'effet (pas de dégâts, passe le casque, libère d'une saisie, ne tue jamais) ne ressemble à aucun des trois autres ; le ranger dans le contondant ferait une règle cachée. Une ligne de plus dans le sac.

5. **Le casque et les flèches.**
   *Recommandation :* **ne rien changer** à la règle unique du Book 23 §4.2 : la flèche et le carreau sont perçants et passent par la visière ouverte. Si les tests montrent que l'Équipé tombe trop facilement à l'arc, on lui donnera une visière **fermée** (variante), pas une règle de plus.

6. **L'épée courte (le glaive) ?**
   *Recommandation :* **oui, au lot B**, à la forge ventilée seulement, comme pièce de vitrine. Ses valeurs restent sous la masse en dégâts par coup, et elle reste tranchante (le casque l'arrête). Une épée plus puissante que la hache ferait oublier toutes les autres armes.

7. **La poudre noire : les Charbonniers la gardent-ils ?**
   *Recommandation :* **la reporter après la 1.0**. Les lames suffisent à faire un métier, et un coup de feu à 300 m (Book 01 §4) changerait tout l'équilibre de la Coopérative. Le Book 01 la garde au palier II-III, en idée.

8. **Réparer les lames : la meule, la forge, ou les deux ?**
   *Recommandation :* **les deux**. La meule ⚙️ affûte (rapide, bon marché) ; la forge 🔥 reprend une lame abîmée et **reforge** une lame cassée à une étoile de moins. Le Charbonnier n'est plus obligé d'acheter l'entretien de sa propre lame, et le Mécaniste garde le geste le moins cher.

