# Book 22 — Quêtes et objectifs

> Document de conception · version 0.2 · 2026-10-09
> Statut : **brouillon de travail**. Né de la revue BMAD (Game Designer) : « après le tutoriel, il n'y a plus rien ». Ce qui fait revenir un joueur, c'est la deuxième session.

---

## 1. Principes

- **Le carnet propose, il n'oblige pas.** Après le tutoriel, il montre toujours **un ou deux objectifs proches** et, une fois découverte, **la grande quête du cycle**. Le joueur peut tout ignorer : le monde ne l'attend pas.
- **Des objectifs qui suivent une progression logique et profitable** : chacun apprend un système **et** rapporte quelque chose d'utile (un objet, une installation, des wotts). On ne fait jamais une quête « pour rien ».
- **Le serveur constate, il ne croit pas.** Un objectif est rempli par ce que le joueur a vraiment fait ou possède (comme le tutoriel, Book 14 §4.2). Ce qui est déjà fait compte : un ancien qui a déjà son coffre voit l'objectif réussi tout de suite.
- **Les récompenses en wotts** sont des **primes des Compteurs** (ils financent la remise en route du pays), versées **sur le compte** au Comptoir et prises sur leur trésorerie (Book 07 §3.6) : elles ne créent pas de monnaie de nulle part. Trésorerie vide : la prime attend.
- **Rien de puissant** : pas d'arme unique, pas d'objet introuvable autrement. La gloire, elle, est unique (§4.6).
- **Le carnet ne demande jamais une recette invisible** (0.7, arbre de progression, Book 02 §14 quater) : une quête **en cours** fait **penser** à ce qu'elle demande de fabriquer, pièces comprises. « Un coffre à soi » dévoile le coffre ; « Forger une lame » dévoile la lame et sa forge. Les quêtes « S'installer » et « Le métier » sont la **colonne vertébrale** de l'arbre : leur ordre (repas, lit, eau du ciel, coffre, Dakota, défense…) suit déjà la pyramide de Maslow, on n'y touche pas.

## 2. Le carnet après le tutoriel

| Ligne | Ce qu'elle montre | Quand |
|---|---|---|
| **La grande quête** (1.0) | L'étape en cours | Dès la première visite au Comptoir, où l'avis est placardé (§4.2) |
| **Le métier** | L'objectif suivant de la chaîne-vitrine de sa famille (Book 21 §3.3) | Dès la fin du tutoriel |
| **S'installer** | L'objectif bushcraft suivant (§3.1) | Dès la fin du tutoriel |
| **Les autres** | Le Comptoir, la monnaie, l'échange (§3.3) | Dès la fin du tutoriel |

Chaque objectif a un **titre**, **une phrase** dans la voix du carnet (directe, un peu d'humour, Book 15), des **compteurs** quand il y a des quantités (« Charbon 3/5 ») et sa **récompense** annoncée. Réussi : la leçon s'affiche un moment, la récompense tombe, le suivant apparaît.

## 3. Les objectifs proches

### 3.1 S'installer (toutes les familles)

L'ordre suit celui de la proposition **P-002** (`PROPOSITIONS.md` : ranger par urgence, la règle des 3 du bushcraft) et sa gamme bushcraft, lot 1 (Book 02 §14 bis). Le tutoriel a déjà couvert *s'abriter*, *le feu* et *l'eau*.

| # | Objectif | Ce qu'il faut | Ce qu'on apprend | Récompense |
|---|---|---|---|---|
| 1 | **Un vrai repas** | Manger un plat cuisiné au feu | 🍖 Les plats calent et soignent | 1 conserve |
| 2 | **Un vrai lit** | Un lit de branchages | 🏕️ Mieux dormir à côté de l'abri | 1 conserve |
| 3 | **L'eau du ciel** | Un récupérateur de pluie (la bâche : benne du camion, à la station) | 💧 L'eau de pluie se boit sans bouillir | 10 wotts |
| 4 | **Un coffre à soi** | Un coffre de rangement | 🎒 Porter et ranger | — (le coffre lui-même) |
| 5 | **Un feu qui ne se voit pas** | Creuser un foyer Dakota (bâton à fouir) | 🔥 La signature du feu | 1 conserve |
| 6 | **De quoi se défendre** | Un gourdin, un épieu ou une hache | 🛡️ Choisir son arme (P-005) | 1 conserve |
| 7 | **Être prévenu** | Une alarme à boîtes de conserve (les boîtes des conserves mangées) | 🛡️ Prévenir, et leurrer | 10 wotts |
| 8 | **Se soigner** | 2 pansements | 🩹 Le saignement | 1 pansement |
| 9 | **Là où ils mordent** | Un protège-bras de fortune | 🩹 Une morsure sur deux | 10 wotts |
| 10 | **Traîner plus lourd** | Un travois | 🎒 +50 kg, sans courir | 15 wotts |

Les conserves données en récompense laissent leurs boîtes vides : l'alarme se prépare toute seule. Les lots bushcraft suivants ajouteront leurs objectifs ici, sans rien changer au système.

### 3.1 bis S'installer en portes successives (0.8, 2026-10-10)

*Plan 0.8 §2.6 et chantier 13 (décisions Q-0.8-10, Q-0.8-11, Q-0.8-19). **Décidé ; en cours de codage** (chantier 13) : ce paragraphe dit ce que le plan décide, il sera relu sur le jeu livré (textes, récompenses, ordre exact).*

Depuis la 0.8, la base grandit avec les sorties (Book 24 §12). « S'installer » suit : **chaque objectif du carnet est une porte**, la suivante d'un meuble, avec sa **clé** et son **indice** (Book 03 §5.8).

- **Le foyer de pierres passe en tête** : c'est la porte de la maison qui ouvre le plus de recettes (la poêlée, l'épieu et les flèches durcis, le bâton à fouir durci, monter l'arc) ; sa silhouette paraît dès le feu de camp.
- **Puis les portes de la maison** : un vrai repas (« pommes cuites, ou une poêlée », Q-0.8-11 : la volaille aux cèpes attend le four), l'eau du ciel (le **récupérateur de 5 L** : le bidon de la ruine, les 4 sacs plastique du chemin), le coffre. **Un vrai lit** disparaît avec le lit de branchages : l'**abri garni** le remplace.
- **Puis les portes du niveau 1, une par meuble** : « **Une vraie cuisine** » (le foyer de cuisine : il te faut une grille), « **La soupe qui cuit seule** » (la marmite norvégienne : une cocotte), « **Dix litres** » (le récupérateur à seau : un seau de 10 L), « **Un abri fermé** » (la toile de jute), « **Un coffre cerclé** » (les feuillards), « **L'établi à étau** » (l'étau).
- **Deux portes ouvertes à la fois, une par route** (Q-0.8-19) : celle de la Coopérative (le feu et l'eau) et celle du Moulin du Gué (le couchage, le stockage, l'établi). Le joueur choisit sa route.
- **Le carnet nomme la porte suivante au départ de chaque sortie** : « Une vraie cuisine : il te faut une grille. »
- **Aucune quête ne demande un niveau « plus tard »** ; le carnet ne demande jamais une recette invisible (§1).

**Le métier (§3.2) à revoir avec la 0.8** (chantier 13) :

| Quête d'aujourd'hui | En 0.8 |
|---|---|
| « Le panneau » (trouvé, posé) ⚡ | Le **banc solaire** : le panneau de la station posé sur son banc |
| « La dynamo » ⚙️ | Le **pédalier générateur** : le petit alternateur de la station monté sur le vélo de la ruine |
| « La trempe » 🔥 | Le **bac de trempe** en auge de planches, calfatée de **glaise** du gué |
| « La mise d'acier » 🔥 | Réécrite pour la **hachette au foyer de forge** (Q-0.8-10) |
| « Forger une lame » 🔥 | Le **couteau au fer doux** |

Le premier meuble de famille se bâtit à l'étape « La famille » du tutoriel, **au retour de la station** (Book 14 §4.5).

### 3.2 Le métier (la chaîne-vitrine de chaque famille, Book 21 §3.3)

Le tutoriel fait déjà bâtir l'installation de famille (étape 10). Le métier prend la suite :

| Famille | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| 🔥 **Charbonniers** | Bâtir une **charbonnière** | Défourner **4 charbons de bois** (une meule) | Forger une **lame** | **Vendre une lame** au Comptoir |
| ⚙️ **Mécanistes** | Monter la **meule** sur le pédalier | **Aiguiser un couteau** | Monter la **dynamo** | **Déposer de l'électricité** au Comptoir |
| ⚡ **Voltaïques** | Rapporter le **panneau solaire** de la station | L'**installer** sur son terrain | Avoir **20 Wh** dans ses batteries | **Déposer de l'électricité** au Comptoir |

Récompenses : 10, 15, 20, 30 wotts. La dernière étape envoie au Comptoir.

### 3.3 Les autres (toutes les familles)

Une ligne à part, pour que le Comptoir ne vienne pas trop tard dans le fil.

| # | Objectif | Ce qu'il faut | Ce qu'on apprend | Récompense |
|---|---|---|---|---|
| 1 | **Le Comptoir du Carrefour** | Aller au Comptoir | La route, les Compteurs, les prix | 10 wotts |
| 2 | **Premiers wotts** | Gagner 20 wotts au Comptoir (vente, dépôt d'électricité ou pédalage) | L'économie | 1 conserve |
| 3 | **La main tendue** | Conclure un échange avec un autre joueur | Les autres familles ont ce qui te manque | 15 wotts |

## 4. La grande quête du cycle : « Où est Bill Murray ? »

> **Pour la 1.0, pas avant (décision du porteur, 2026-10-08).** On veut d'abord un jeu très jouable : la 0b se concentre sur « S'installer » et « Le métier » (§3). Cette partie est la conception de référence ; rien n'en est construit dans le code.

> **Décision du porteur (2026-10-08) : Bill Murray, le vrai.** C'est une **exception assumée** à la règle du Book 15 §1 (« on évite les personnes réelles »), en hommage affectueux : on va le chercher pour le sauver, pas pour se moquer de lui. Le nom est une seule constante dans le code (`commun/src/quetes.ts`) : on peut le changer en une ligne si le jeu sort du cercle familial. **Aucune réplique de film n'est citée.** La même règle est écrite dans la proposition P-003 (« pas de personne réelle ») : elle reste la règle pour tout le reste du jeu.

**L'idée.** Chaque cycle (Book 09 §1) a sa grande quête, absurde, que **chaque joueur suit pour lui-même**. La première : l'acteur Bill Murray vivait dans une villa de la région. Depuis la Grande Panne, plus de nouvelles. Est-il toujours vivant ? Il faut aller voir, et le ramener au Comptoir.

**Pourquoi lui a peut-être survécu** (le ton du Book 15 §2.2) : les riches sont tombés parce qu'ils dépendaient de tout. Lui n'avait **même pas d'agent** : on ne le joignait que par un vieux numéro avec un répondeur. Un homme qui sait se débrouiller sans personne a ses chances.

### 4.1 Le rythme : une quête de deux mois (décision du porteur, 2026-10-08)

- **Individuelle, sans concurrence.** Chacun fait sa propre quête, à son rythme. Personne ne la « prend » aux autres. On peut s'entraider (échanger une batterie chargée, escorter un ami), sans rien partager de la récompense.
- **Elle occupe tout le cycle** : **32 étapes en 6 actes**. Ordre de grandeur visé : **il faut s'être connecté une trentaine de jours sur les deux mois** pour la finir. Ce n'est pas une limite mathématique, mais le rythme est construit pour ça :
  - **au plus une étape par jour réel** : une étape réussie, la suivante s'ouvre **le lendemain** (jour de Paris). Le carnet le dit : « La suite demain. » ;
  - des étapes qui **durent plusieurs jours** par nature : rassembler 3 sachets de café trouvés un par jour, soigner la star trois jours de suite, nettoyer le parc en plusieurs visites, attendre une charbonnière ;
  - des étapes qui demandent **la production de toute la base** (vivres, électricité, outils) et **les autres familles** (batteries chargées, lames, pièces).
- **Les actes suivent le cycle** : on peut prendre de l'avance sur le rythme indicatif ci-dessous, ou du retard, sans pénalité tant que le cycle n'est pas fini.

### 4.2 Les 32 étapes

**Acte I — La rumeur** (semaine 1 : le Comptoir et la station)

| # | Étape | Ce qu'il faut | Ce que ça fait faire |
|---|---|---|---|
| 1 | **L'avis de recherche** | Lire l'avis placardé sur la façade du Comptoir | Aller au Comptoir |
| 2 | **Le registre** | Consulter le registre des Compteurs, à l'avis (frais de dossier : 5 wotts) | Gagner ses premiers wotts. Le registre : « cotisation payée d'avance pour trente ans ; pas d'agent ; un numéro de répondeur, relevé à la station-service » |
| 3 | **Le répondeur** | L'écouter, dans la boutique de la station, devant le Dormant. Il faut une **batterie chargée** (5 Wh) | ⚡ et ⚙️ en ont ; 🔥 doit **échanger**. La bande est abîmée : on n'entend que des bribes, et on emporte la **cassette** |
| 4 | **Recoller la bande** | À l'établi : la cassette, des fibres, le couteau | Fabriquer avec soin |
| 5 | **Le message** | Réécouter la cassette réparée au répondeur (encore 5 Wh) | « …si c'est pour un film, c'est non. Si c'est pour le dîner, je suis à la villa du lac. La grille est fermée, la porte du fond aussi. Apportez du café. Et pas de photos. » |

**Acte II — Où est la villa ?** (semaines 1 et 2)

| # | Étape | Ce qu'il faut | Ce que ça fait faire |
|---|---|---|---|
| 6 | **Le plan des villas** | L'acheter aux Compteurs, à l'avis : 40 wotts | Le plan touristique des villas de stars, confisqué à un Nostalgique. La villa du lac est entourée au feutre : « il est sympa » |
| 7 | **Le fan** | À la grange de la halte, un Éteint en t-shirt « I ♥ Bill » : le détruire et fouiller ses poches | Combat. On trouve son **carnet de fan** : il joue au golf à l'aube, il déteste les photos, il aime le café |
| 8 | **La boussole** | La fabriquer : l'aimant de la dynamo, une aiguille de ressort, un bol d'eau | Le plan n'a plus de repères : il faut s'orienter |
| 9 | **La lumière du lac** | De nuit, monter sur l'**escabeau** contre l'auvent de la station et regarder vers le sud-est | Porter l'escabeau jusqu'à la halte. On voit une lumière, très loin : quelqu'un a du courant |
| 10 | **Le laissez-passer** | Au Comptoir, présenter le plan et le carnet de fan : les Compteurs tamponnent un laissez-passer pour la route fermée (taxe : 25 wotts) | La route du lac s'ouvre sur la carte, jusqu'au **relais du marais** |

**Acte III — Le café** (semaines 2 et 3 : il en a demandé)

| # | Étape | Ce qu'il faut | Ce que ça fait faire |
|---|---|---|---|
| 11 | **Du vrai café** | Trouver **3 sachets de café soluble** en fouillant la halte. Les vestiges ne se régénèrent que lentement : au plus un sachet par jour | Revenir plusieurs jours |
| 12 | **La chicorée** | Arracher des racines de chicorée sauvage sur son terrain (5) | Cueillette |
| 13 | **Torréfier** | Griller la chicorée au feu : un « café » de survie | Cuisine au feu (le classique du bushcraft) |
| 14 | **La cafetière** | Fabriquer une cafetière de fortune : une boîte de conserve vide, un chiffon comme filtre | Rien ne se perd (P-002) |
| 15 | **Le thermos** | Fabriquer une bouteille isolée (bâche, chiffons, corde) pour qu'il arrive chaud | Préparer avec soin |

**Acte IV — L'expédition** (semaines 3 à 5)

| # | Étape | Ce qu'il faut | Ce que ça fait faire |
|---|---|---|---|
| 16 | **Les vivres** | 3 000 kcal dans son sac | Chasse, cueillette, cuisine |
| 17 | **L'équipement** | Une lumière portée, une arme, la barre de métal (pour la grille) | S'équiper |
| 18 | **L'énergie** | Une **batterie de voiture chargée à 100 Wh** (pour la porte de la pièce forte) | La plus grosse production d'électricité du jeu : ⚡ panneau, ⚙️ pédalier, ou un échange |
| 19 | **Le bivouac** | Une bâche et une corde de plus : on dormira sur la route | Porter et ranger |
| 20 | **Le relais du marais** | Aller jusqu'au relais (nouveau lieu, à mi-chemin) et y **passer la nuit** | Le premier voyage long, le sommeil hors de chez soi |

**Acte V — La villa du lac** (semaines 5 à 7 : nouveau lieu)

| # | Étape | Ce qu'il faut | Ce que ça fait faire |
|---|---|---|---|
| 21 | **La grille** | La forcer avec la barre de métal | — |
| 22 | **Le parc** | Le personnel de maison, éteint, en livrée (majordome, jardinier, coach de yoga) : en détruire **12**, en plusieurs visites | Combat, discrétion, retraites prudentes |
| 23 | **L'interphone** | Alimenter l'interphone de la grille avec la batterie de la voiturette de golf (à trouver au garage) | Il répond : « Si vous êtes un fan, partez. » |
| 24 | **La preuve** | Lui lire le carnet de fan à l'interphone… et lui promettre le café | — |
| 25 | **Le groupe électrogène** | Le réparer : un ressort (🔥 forge), une courroie (⚙️), du câble (⚡) | **Les trois familles** : il faut commercer |
| 26 | **La pièce forte** | Alimenter sa porte avec la batterie de voiture (100 Wh) | La porte s'ouvre. Il est **vivant**, maigre, en peignoir |
| 27 | **Le café** | Lui servir le café de chicorée, chaud (thermos) | « C'est le pire café de ma vie. Merci. » |
| 28 | **Le remettre sur pied** | Lui apporter **un plat chaud par jour, trois jours de suite** | Cuisine, régularité |

**Acte VI — Le retour** (semaines 7 et 8)

| # | Étape | Ce qu'il faut | Ce que ça fait faire |
|---|---|---|---|
| 29 | **Ses affaires** | Il ne part pas sans ses clubs de golf (au garage) et son chapeau (dans le parc) | Fouille |
| 30 | **Jusqu'au relais** | L'escorter jusqu'au relais du marais et y passer la nuit | L'escorte : il suit, lentement, et les Éteints s'en prennent aussi à lui |
| 31 | **Jusqu'à la station** | L'escorter à travers la halte | La traversée la plus dangereuse |
| 32 | **Au Comptoir** | Le présenter au guichet | Tamponné. La prime, la plaque |

**Si la star tombe** pendant l'escorte : elle n'est pas perdue. Elle retourne, blessée, dans la pièce forte ; il faut recommencer l'acte VI (et la soigner un jour de plus).

Tout est **pour la 1.0** : les actes I et II se feront sur les lieux qui existent ; le reste demande le relais du marais, la villa et leurs graphismes.

### 4.3 Le temps

- Dans la pièce forte, il a **des réserves jusqu'à la fin du cycle**. Le carnet l'affiche dès l'étape 5 (« Ses réserves : encore 41 jours »).
- **En 0a, il n'y a pas encore de fin de cycle** : la quête reste ouverte tant que le test dure.

### 4.4 L'issue, et les cycles suivants

Chaque joueur qui finit la quête a sa prime et sa plaque. Pour le monde, ce qui compte, c'est que **quelqu'un** l'ait ramené :

| Issue | Pendant le reste du cycle | Au cycle suivant (et ensuite) |
|---|---|---|
| **Au moins un joueur l'a ramené vivant** | Il s'installe au **Comptoir**, sur le banc, avec un café. Il dit une phrase différente à chacun chaque jour. Ceux qui finissent ensuite le trouvent là, et c'est lui qui leur dit merci | Il reste **PNJ** au Comptoir. Une plaque : « Sauvé par *pseudos*, cycle 1 ». Il pourra donner la grande quête d'un cycle suivant |
| **Personne** à la fin du cycle | — | Il est devenu un Éteint. Les Compteurs l'exhibent **dans une cage** au Comptoir, en tenue de golf : « Entrée : 1 wott. Ne pas nourrir. » |

C'est le **premier souvenir du monde** qui survit à la remise à zéro (Book 09 §4) : la région se souvient de ce que ses joueurs ont fait, ou pas.

### 4.5 La récompense (pour chaque joueur qui finit)

- **500 wotts**, prime des Compteurs, sur le compte (prise sur leur trésorerie ; vide, elle attend).
- Une **plaque gravée** pour le terrain (décoration, Book 09 §5.1), qui reste d'un cycle à l'autre.
- Son pseudo sur **la plaque du Comptoir**.

### 4.6 Ce qui est unique, et ce qui ne l'est pas

Les objets de la quête (cassette, plan, carnet de fan, laissez-passer, boussole, café de chicorée) ne servent qu'à elle. Aucune arme, aucun outil, aucun avantage de production. La gloire est unique ; la puissance, non.

## 5. Ce qui est construit (0.2, 2026-10-08)

- `commun/src/quetes.ts` : les objectifs « S'installer » (10), « Le métier » (4 par famille) et « Les autres » (3), leurs conditions et leurs récompenses. Une condition peut accepter plusieurs preuves (« on l'a » ou « on l'a déjà fait ») : personne ne reste bloqué.
- `serveur/src/quetes.ts` : le suivi. Le serveur constate toutes les demi-secondes ce que le joueur a fait (faits comptés : repas, ventes, dépôts, échanges, visites) ou possède (objets, installations, Wh, vivres). Ce qui est déjà fait compte.
- Les primes sont versées sur le compte du Comptoir, prises sur la trésorerie ; vide, elles attendent.
- Le carnet (HUD) prend le relais du tutoriel : une ligne par objectif, ses compteurs, sa récompense ; un message à chaque réussite. Depuis la 0.4, c'est une **tuile « Carnet »** à côté de Sac, Fabriquer et Carte (Book 18 §3), avec une pastille quand un objectif avance ; son panneau s'ouvre et se ferme à la demande. Il pourra un jour accueillir le classement (Book 09 §3), quand celui-ci existera.
- Tout est gardé en base (colonne `quetes` du personnage).

**Ajouté en 0.7 (2026-10-09), avec l'arbre de progression** :
- **La quête active dévoile sa recette** (`recettesDeLaQuete`, `code/commun/src/progression.ts`) : pour chaque objectif, la voie la plus simple qui passe par une recette (une installation : la recette qui la pose ; un objet : sa recette de base ; un fait comme « manger un plat cuisiné » ou « défourner » : les recettes qui y mènent). La chaîne suit : la recette dévoile ses pièces fabricables.
- **Dans « À découvrir »** (le bas du panneau Fabriquer), les silhouettes que demande une quête en cours passent **en tête**.
- **Le carnet note la dernière idée**, tout en bas : « Dernière idée : Tresser une corde ».
- **Le rythme** est vérifié par `npm run rythme` : après le tutoriel, un objectif nouveau arrive au plus tard toutes les 13,5 à 23 minutes de jeu selon le joueur, jusqu'au dernier objectif du carnet, sans aucun blocage (Book 02 §14 quater).

## 6. Questions ouvertes

- [ ] Les primes en wotts des objectifs proches : bon ordre de grandeur pour un test de 2 semaines ? (à mesurer)
- [ ] La grande quête du **cycle 2** (après la 1.0) : laquelle ? (Si Bill Murray est sauvé, c'est lui qui la donne.)
- [ ] Faut-il une version **solo** de la main tendue pour un joueur seul sur le serveur ?
- [ ] La villa : sa place sur la carte (Book 20) ; son ambiance musicale (session musique).
