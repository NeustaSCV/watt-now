# Book 01 — Les Trois Feux

> Document de conception · version 1.8 · 2026-10-09
> Statut : **brouillon de travail**. Les valeurs chiffrées sont des hypothèses de départ à calibrer en playtest.
> v1.8 (2026-10-09) : aligné sur le [Book 25](25-le-metier-des-familles.md), validé par le porteur. L'arc devient commun à tous (les Mécanistes gardent l'arbalète, les pièges et le tour) ; le combat des Charbonniers passe aux **lames**, la poudre noire est **reportée après la 1.0** ; l'électricité **raidit, met à terre, et détruit** à la tête un Éteint raidi ou à terre ; chaque famille fait **seule** sa base.

---

## 1. Vision

Un jeu de survie **multijoueur** en vue isométrique (référence : *Last Day on Earth*), dans un monde post-apocalyptique où **l'énergie est la ressource la plus chère**. Le crafting est **réaliste** : on fabrique à partir de ce qu'offre la nature, des outils dont on dispose et des **vestiges de la civilisation** qu'on fouille.

### Piliers de design

1. **L'usure, pas l'action.** Les zombies sont lents, bêtes et fragiles. Un seul ne menace personne, une horde attirée par une erreur est mortelle. La vraie menace, c'est l'attrition : faim, froid, blessures, pannes, coût de l'énergie.
2. **Toute énergie a un prix, mesuré en Wh.** Rien n'est gratuit. Chaque source d'énergie se paie dans une monnaie différente : sécurité, rareté ou calories.
3. **Tout vestige est à la fois un outil et une ressource.** Une barre de métal peut servir telle quelle (levier, arme, outil) ou être transformée en matière première, à condition d'avoir l'énergie et l'installation pour la chauffer, la ramollir ou la fondre.
4. **Un crafting crédible.** Une recette doit pouvoir s'expliquer à quelqu'un qui bricole. Pas de « 3 bouts de bois = 1 fusil ».
5. **Le choix de famille est un choix de style de jeu.** On ne choisit pas une famille pour ses chiffres, on la choisit pour sa façon de vivre.

---

## 2. Le monde et l'énergie

Le réseau électrique s'est effondré. Les carburants raffinés ont été consommés en quelques années. Il reste trois façons de produire du travail ou de la chaleur. Chacune est devenue une culture, puis une **famille**.

### Unité : le wattheure

Toute énergie se mesure en **Wh** (et en kWh pour les grandes quantités), avec un suffixe qui indique sa forme :

| Forme | Notation | Exemples d'usage |
|---|---|---|
| Thermique | **Wh_th** | Chauffer, cuire, forger, fondre |
| Électrique | **Wh_é** | Éclairer, réfrigérer, souder, alimenter un outil |
| Mécanique | **Wh_m** | Moudre, pomper, scier, soulever |

### Repères réels

| Source | Valeur |
|---|---|
| 1 kg de bois sec | ≈ 4 400 Wh_th |
| 1 kg de charbon de bois | ≈ 8 000 Wh_th (et une flamme bien plus chaude) |
| Panneau solaire 100 W, journée moyenne en climat tempéré | ≈ 400 Wh_é par jour de calendrier (≈ 100 l'hiver, ≈ 600 l'été) |
| Batterie de voiture 12 V 60 Ah (50 % utilisable) | ≈ 360 Wh_é stockés |
| Humain qui pédale 1 h (≈ 100 W) | ≈ 100 Wh_m pour ≈ 350 kcal dépensées |
| Roue hydraulique modeste | ≈ 200 à 500 W_m en continu, tant que l'eau coule |
| Moulin à vent artisanal | ≈ 100 à 300 W_m, irrégulier, de jour comme de nuit, tant qu'il y a du vent |
| Manège à traction animale | ≈ 400 W_m (bœuf) à ≈ 600 W_m (cheval), ≈ 8 h par jour |
| Petite machine à vapeur | ≈ 500 W_m pour ≈ 3 kg de bois (ou ≈ 2 kg de charbon de bois) par heure |
| Batterie au plomb | ≈ 20 Wh_é utiles par kg : lourde, mais courante |
| Batterie au lithium (vélo électrique, outillage) | ≈ 150 Wh_é utiles par kg : légère, mais rare et impossible à fabriquer |

### Conversions

Les trois formes ne s'échangent pas librement. Chaque conversion passe par une **machine** et **perd de l'énergie**. Ces pertes sont l'un des principaux leviers du crafting.

| Conversion | Machine | Rendement indicatif |
|---|---|---|
| Mécanique → électrique | Dynamo, alternateur | 50 à 70 % |
| Électrique → mécanique | Moteur électrique | 60 à 80 % |
| Électrique → thermique | Résistance | ≈ 100 % (mais l'électricité est rare) |
| Thermique → mécanique | Machine à vapeur artisanale | 2 à 5 % |
| Thermique → électrique | Vapeur + dynamo, thermocouple | < 3 % |

> Conséquence voulue : la chaleur est abondante mais difficile à transformer en autre chose. L'électricité est précieuse mais très souple.

### La signature

Toute production d'énergie laisse une **signature** qui attire les zombies :

| Type | Sources | Portée indicative |
|---|---|---|
| Sonore | Forge, marteau, moteur, **coup de feu** | 20 à 60 m (jusqu'à 300 m pour une arme à feu) |
| Olfactive | Fumée, cuisson, combustion | 30 à 80 m selon le vent |
| Lumineuse | Feu, lampe la nuit | Ligne de vue, nuit uniquement |

Les zombies étant bêtes, ils **convergent vers la signature la plus forte**. La signature est le principal outil d'équilibrage entre familles.

La signature a **deux origines** qui s'additionnent :

- **La production d'énergie :** un feu, une forge, un moteur. C'est là que les familles diffèrent : le feu fait de la fumée, le courant est silencieux, le pédalier grince un peu.
- **L'activité :** tout outil fait du bruit, **qu'il soit électrique ou manuel**. Une meuleuse s'entend à 60 m, mais un marteau sur une enclume aussi, et une hache à 25 m. Aucune famille ne travaille en silence.

---

## 2 bis. La structure du monde

### Principe : pas de monde ouvert, mais des lieux

Comme dans *Last Day on Earth*, il n'y a **pas de grande carte jouable continue** :

- La **carte du monde** est un écran de navigation. On y choisit une destination, on ne s'y promène pas.
- Chaque destination est un **lieu** : une petite carte jouable, chargée à l'entrée (temps de chargement entre chaque lieu).
- Le **terrain du joueur** est lui-même un lieu, privé (§6 bis).
- **Tous les joueurs voient la même disposition**, avec leur propre terrain au centre. Les distances vers les lieux sont donc **identiques pour tout le monde**. Il n'y a pas de terrain mieux placé que les autres.

### Types de lieux

| Type | Exemples | Combat entre joueurs | Ressources |
|---|---|---|---|
| **Terrain** | Le sien, celui d'un ami | ❌ | Ce qu'on y construit et cultive |
| **Comptoir** | Comptoir des Compteurs | ❌ | Commerce, wotts, services |
| **Lieux de flux** | Forêt, rivière, carrière, prairie de chasse, **bord de plage** | ✅ | Renouvelables : bois, eau, gibier, pierre, argile ; sur la côte, **sel**, poisson, algues et bois flotté |
| **Ruines** | Bourg, zone commerciale, garage, hôpital, zone industrielle | ✅ | **Vestiges** (stock fini, voir plus bas) |
| **Haltes** | Pont, carrefour, station-service abandonnée | ✅ | Peu de ressources : ce sont des lieux de rencontre |

### Distance, voyage et énergie

Se déplacer coûte du **temps** et de l'**énergie**, comme tout le reste. Plus un lieu est riche, plus il est loin.

| Moyen de transport | Famille native | Coût indicatif | Charge transportée |
|---|---|---|---|
| À pied | Tous | ≈ 60 kcal/km | Sac à dos |
| Vélo, vélo-cargo | ⚙️ Mécanistes | ≈ 20 kcal/km | Moyenne à grande |
| Charrette à traction animale | ⚙️ Mécanistes (palier III) | Fourrage | Très grande |
| Vélo ou triporteur électrique | ⚡ Voltaïques | ≈ 10 à 20 Wh_é/km | Moyenne |
| Véhicule à gazogène | 🔥 Charbonniers (palier III) | Ordre de grandeur : 0,5 à 1 kg de bois/km (à vérifier) | Grande |

> Chaque famille a donc sa façon d'aller loin, avec le coût qui lui correspond : calories, électricité ou bois.

### Flux et stock

Le monde distingue deux types de ressources :

- **Les flux** se renouvellent : soleil, vent, eau, bois, gibier, récoltes. Les lieux de flux **se régénèrent**, à un rythme crédible (un bois coupé met du temps à repousser).
- **Les stocks** s'épuisent : ce sont les vestiges de l'ancien monde, qui contiennent son énergie grise. Une fois fouillés, ils ne reviennent pas.

**Les ruines (validé) :**

| Distance | Comportement | Pour qui |
|---|---|---|
| **Proches** | Régénération lente et butin modeste (débris, petits objets ramenés par les crues ou les zombies) | Toujours viables pour un nouveau joueur |
| **Lointaines** | Stock riche mais **fini, partagé par tous les joueurs du serveur**. Une ruine épuisée disparaît et une nouvelle est **découverte** plus loin. | Joueurs installés, équipés pour voyager |

> Le monde se vide lentement de ce qui reste de l'ancienne civilisation, et il faut aller toujours plus loin. Cela pousse les joueurs à passer peu à peu de la récupération à la production, ce qui est le cœur du thème.

### Les haltes

Un trajet long passe obligatoirement par une ou plusieurs **haltes**. Une halte est une map qu'il faut **traverser physiquement**, d'un côté à l'autre, pour continuer sa route.

```
  [Terrain] ──── carte ────► ┌──────── HALTE ────────┐ ──── carte ────► [Ruine lointaine]
                             │ entrée A      sortie B│
                             │   ●  ~ ~ ~ ~ ~ ~ ~ ►● │
                             │  (zombies, PNJ,       │
                             │   autres voyageurs)   │
                             └───────────────────────┘
```

- La traversée est le moment où les voyageurs se croisent : on peut s'ignorer, commercer, s'escorter ou s'embusquer.
- Le combat entre joueurs y est autorisé (§6 bis).
- Sans haltes, aucun risque n'existerait entre le comptoir et la base, et le transport de wotts perdrait tout son enjeu.

**Format d'une halte (validé) :**

| Élément | Règle |
|---|---|
| **Taille** | Environ **200 m de long × 70 m de large** |
| **Bords** | **Obstacles naturels** de part et d'autre (forêt dense, falaises, éboulis, rivière) : on comprend tout de suite que **la route est le seul passage** |
| **Points de passage obligés** | Un ou deux goulets (pont, col, barricade) où les voyageurs se croisent forcément |
| **Un vrai niveau** | Pas seulement un couloir : des **zones à l'écart de la route** (station-service, ferme en ruine, épaves) où l'on peut **ramasser** des vestiges, au prix de **mauvaises rencontres** (Éteints, autres joueurs) |
| **Durée** | ≈ 2 à 3 minutes réelles en suivant la route sans s'arrêter ; **5 à 10 minutes** en fouillant les à-côtés |
| **Butin** | Modeste et **régénéré lentement**, comme les ruines proches. Plus on s'écarte de la route, plus il y a de butin… et d'Éteints. |
| **Population** | Éteints dispersés, plus nombreux près du butin ; marchand itinérant parfois ; jusqu'à 10 joueurs par instance |

### Le bois, la pierre et les clés du niveau 1 (0.8, 2026-10-10)

*Plan 0.8 §2.5 et §2.7 (décisions B1 à B17 du porteur, étude `candidats-h1b-l1b-et-budget.md`), §9.1 et §9.2 ; **codé en 0.8** (chantiers 5, 7, 10, 11 et 12). Les chiffres marqués « à régler » sont des réglages, vérifiés au test de jeu (chantier 14).*

**Le constat** : le poids ne bloquait pas, **le stock** bloquait (6 bûches à la station pour tout le serveur, 13 pierres qui ne revenaient jamais). La 0.8 fait revenir le bois et la pierre **dans les haltes**, et les garde rares **sur le terrain**.

| Règle | Ce que dit le jeu (0.8) |
|---|---|
| **Le terrain** (B1) | **16 bûches et 26 pierres qui ne reviennent jamais** ; 34 branches qui repoussent. Creuser un Dakota **rend 5 pierres** (B12), le combler en coûte 5 |
| **La repousse par lieu** (B4) | Chaque lieu a son tableau de repousse : au terrain, les bûches et les pierres jamais ; **dans les haltes, en 30 min**. Elle ne se calcule que quand quelqu'un est là : une halte vide ne coûte rien au serveur |
| **La station** (B2, B3) | **12 bûches en vrac**, qui reviennent toutes les 30 min ; ses pierres aussi ; un **tas de bois de chauffage personnel** derrière l'atelier : **10 bûches par joueur**, qui revient en **6 h** réelles (à régler) |
| **Le gué** (B5 à B7) | **15 pierres en vrac** (30 min) ; un **banc de galets personnel** de **8 pierres par joueur** (6 h, à régler) ; le **gisement de glaise**, inépuisable : **1 glaise (2 kg) par geste de 6 s**, avec Creuser 1 ; **6 touffes de joncs** qui repoussent en 30 min |
| **Le vrac qui grandit** (B8) | Dans une halte, le vrac fait **+50 % par voyageur présent en plus**, jusqu'à **×3** (×2 à trois voyageurs, ×3 à cinq) |
| **Le butin personnel** | Dans un lieu partagé, un **tas personnel** se voit plein pour chacun, se prend **pour soi**, et revient pour soi, sans que les autres voient rien bouger : le tas de bois, le banc de galets, et **la pièce de famille** de la station (revient au bout de **24 h** pour son joueur, Q-0.8-14 ; un Voltaïque ne voit pas l'enclume) |
| **La charbonnette** (B9) | La meule de charbonnière se charge de **10 bûches, ou de 5 bûches et 20 branches**, pour 4 charbons |
| **Le Moulin** (B11) | Les **poutres de chêne** de l'atelier du charpentier donnent **2 bûches garanties** (24 h) : de quoi cercler le coffre sur place |
| **Le Comptoir** (B13) | Il garde en stock **10 bûches et 10 pierres**, réassort d'une unité toutes les **2 h**, au prix de vente (19 et 7 wotts) : un filet, pas une carrière |
| **La première nuit** (B14) | Le tutoriel conseille les branches au feu ; une bûche mise au feu du terrain quand il en reste moins de 6 fait paraître un avertissement fermé d'un bouton (Book 14 §4.5 ; chantier 13, en cours) |
| **Refusée, ou plus tard** | B10 (le gourdin garde sa bûche) ; B15 (le tas de bois de H2B, au niveau 2) |

**Ce que cela donne** (calcul de l'étude) : en plus de la visite du tutoriel, ⚡ n'a besoin d'**aucun** aller-retour de ravitaillement à la station, ⚙️ de 0 à 1, 🔥 d'un seul pour tout le niveau 1 ; une visite typique rapporte ≈ 14 bûches et 10 pierres, soit **48 kg** : le sac est plein, le travois devient utile. Confortable sans être gratuit. À vérifier au simulateur (`npm run rythme`, chantier 14), seul puis à cinq.

**Les clés du niveau 1 et le butin opportuniste (R-BUTIN).** Les lieux personnels (L1A, L1B) donnent les **clés** des meubles, chacune à sa **place fixe** (Book 23 §11, Book 24 §12). Ailleurs, une clé de L1 ne sort que **rarement** d'une fouille (2 %), à la station, au gué et dans l'autre L1. **Le Comptoir** les vend **500 wotts** (il les rachète 90), une de chaque en stock, mais **seulement après une première visite du lieu** où elles se trouvent : avant, il les **masque** (absentes de l'étal, pas grisées). Les pièces de famille ne s'y vendent pas.

**Les lieux à un joueur reviennent à 24 h** (décision N1) : à la Coopérative et au Moulin, tout revient au bout de 24 h (Éteints, butin, clés garanties ; au Moulin, la clé d'accès et la grande porte refermée). La fourche à foin du Moulin et le pied-de-biche de la Coopérative ne se trouvent **qu'une fois par personnage**.

### Instances : combien de joueurs par map

- **Capacité :** 10 joueurs maximum par instance.
- **Le joueur choisit son instance** parmi celles qui sont ouvertes et ont encore de la place.
- **Le nombre d'instances ouvertes est limité** et dépend du nombre total de joueurs présents sur ce lieu (N) :

| Joueurs présents (N) | Instances ouvertes |
|---|---|
| 0 à 4 | 1 |
| 5 à 14 | 2 |
| 15 à 24 | 3 |
| 25 et plus | une de plus tous les 10 joueurs |

> Formule : `instances = 1 + ⌊(N + 5) / 10⌋`. Les seuils sont **à ajuster**.

Pourquoi ces seuils :

- **Les rencontres restent fréquentes.** On n'ouvre pas une map vide par joueur. Le choix est réel, mais on ne peut pas s'isoler complètement.
- **Il reste toujours de la place pour un groupe.** On ouvre une nouvelle instance avant que les autres soient pleines : un groupe de 4 amis trouve toujours où entrer ensemble.

> Proposition : appliquer la même règle à **tous les lieux publics** (ruines, lieux de flux), avec une capacité qui peut varier selon le type de lieu.

### Connexion et déconnexion

- **Hors ligne, le personnage n'est dans aucune map** : il est sur la carte du monde, à l'abri.
- **À la connexion**, il apparaît à **l'entrée d'un lieu**, ou **d'un côté ou de l'autre d'une halte** :
  - s'il ne l'avait pas encore traversée, du côté d'où il venait ;
  - s'il avait atteint la sortie, de l'autre côté.

**Anti-fuite (validé) :** pour empêcher de se déconnecter pour échapper à un combat ou à un pillage :

- se déconnecter **hors d'une sortie de map** laisse le personnage **30 secondes** dans la map, vulnérable, avant qu'il disparaisse ;
- ce délai passe à **60 secondes** si le personnage a reçu ou infligé des dégâts récemment ;
- se déconnecter **sur une sortie de map** (ou sur son terrain, ou dans un comptoir) est immédiat.

### Le temps

Le temps est géré par **deux horloges**, parce qu'une seule ne peut pas donner à la fois des actions courtes et des saisons longues.

| Horloge | Rythme | Ce qu'elle règle |
|---|---|---|
| **Horloge d'action** | **1 heure de jeu = 1 minute réelle**. Un cycle jour + nuit dure 24 minutes. | Actions du joueur, processus courts (de quelques heures à quelques jours), faim et soif, alternance jour/nuit |
| **Calendrier** | **1 saison = 1 semaine réelle**, donc **1 année = 4 semaines réelles = 28 jours** (1 mois de jeu ≈ 2 jours un tiers ; 1 jour de calendrier ≈ 1 h 50 réelle) | Saisons et météo, cultures, processus longs (semaines, mois), régénération des lieux de flux |

**Ce que ça donne en jeu :**

| Activité | Horloge | Durée réaliste | Durée réelle |
|---|---|---|---|
| Collecter 10 kg de bois | Action | 1 h | 1 min |
| Forger une lame | Action | 1 h 30 | 1 min 30 |
| Meuler une lame à la pédale | Action | 7 h | 7 min |
| Charbonnière (passive) | Action | 3 jours | 1 h 12 |
| Tannage d'une peau (passif) | Calendrier | 3 à 6 semaines | ≈ 1,5 à 3 jours |
| Radis, salades (passif) | Calendrier | ≈ 1 mois | ≈ 2 jours un tiers |
| Pommes de terre (passif) | Calendrier | ≈ 3 à 4 mois | ≈ 7 à 9 jours |
| Séchage du bois vert (passif) | Calendrier | ≈ 6 mois | ≈ 2 semaines |
| Blé, du semis d'automne à la récolte d'été (passif) | Calendrier | ≈ 9 mois | ≈ 3 semaines |

**Règle de répartition :** un processus qui dure, dans la réalité, **moins d'une semaine** suit l'horloge d'action. Au-delà, il suit le calendrier. Dans les données, chaque processus passif a directement sa **durée réelle**, choisie selon cette règle.

Cette frontière crée un saut : un processus de 6 jours dure 2 h 24 réelles, un processus de 8 jours ≈ 15 h. C'est un **compromis assumé**. Pour éviter toute ambiguïté, les books écrivent **« jour (action) »** (24 min réelles) ou **« jour (calendrier) »** (≈ 1 h 50 réelle) quand le contexte ne suffit pas. Certaines durées converties arrondissent à 2,5 jours réels par mois de jeu : l'écart (≤ 7 %) est sans effet en jeu.

> Le joueur ne voit jamais deux horloges : il voit une durée réelle (« prêt dans 1 h 12 », « récolte dans 9 jours ») et une saison. La seule incohérence visible est qu'une saison compte beaucoup de cycles jour/nuit. C'est un compromis assumé, comme dans la plupart des jeux de survie.

**Conséquences et règles associées :**

- **Une saison par semaine :** un rythme lisible (« cette semaine, c'est l'hiver ») qui permet de préparer l'hiver suivant. Un nouveau joueur n'attend jamais plus de 3 semaines le retour du printemps.
- **Le bois mort est déjà sec.** Seul le bois vert abattu doit sécher deux semaines. Un nouveau joueur n'est donc pas bloqué, et un stock de bois sec reste un vrai capital.
- **L'agriculture se planifie.** Les cultures longues (céréales) traversent plusieurs saisons. Les cultures courtes (légumes) nourrissent les nouveaux joueurs.
- **Hors ligne, les besoins du personnage sont suspendus** (détail ci-dessous). Il est sur la carte (§2 bis), il ne mange pas et ne boit pas. En revanche, **le monde continue** : les processus passifs avancent, la base produit et consomme son énergie (voir ci-dessous), les saisons passent, les zombies rôdent autour du terrain.
- **Pression alimentaire :** 2 500 kcal par cycle jour + nuit (horloge d'action), soit une journée de nourriture toutes les 24 minutes de connexion. C'est un levier d'équilibrage majeur, à surveiller en playtest.
- **L'espace dans les maps est abstrait**, comme dans tous les jeux de ce type : traverser une halte prend quelques minutes réelles, donc quelques heures de jeu. On ne cherche pas à faire coïncider les distances.

### La base : produire, consommer, stocker (validé)

La production d'énergie continue d'une base (soleil, eau, vent, manège, machine à vapeur) suit **toujours le calendrier**, que le joueur soit connecté ou non. Elle ne s'accumule pas toute seule : elle est **consommée sur place**, au moment où elle est produite, dans cet ordre :

1. **Les machines de la base**, dans l'ordre de priorité choisi par le joueur (pompe, moulin, clôture électrique, séchoir, chambre froide…). Une machine ne travaille que **ce qu'on lui a chargé** : un moulin moud le grain de sa trémie, puis s'arrête.
2. **Les batteries**, s'il en a, pour le surplus.
3. **Le reste est perdu.**

> Le joueur prépare sa base avant de se déconnecter : grain dans le moulin, bois dans la trémie, peaux dans la cuve. À son retour, le **rapport de la base** dit ce qui a tourné, ce qui s'est arrêté et pourquoi.

Chaque famille a sa propre contrainte pour que sa base tourne en son absence :

| | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **Sources** | Fours, machine à vapeur (palier III) | Panneaux solaires, petite éolienne | Roue hydraulique, moulin à vent, manège à traction animale |
| **Contrainte** | **Remplir** : l'autonomie dépend du combustible chargé dans la trémie | **Attendre** : la production dépend du jour, de la saison et de la météo | **Réparer** : l'usure arrête la machine après un certain temps de marche. Le manège demande aussi du fourrage. |
| **Atout** | Produit quand il veut, de jour comme de nuit | Énergie gratuite, sans geste quotidien | Production continue et gratuite |
| **Faiblesse** | Coûte du combustible. La fumée et le bruit attirent les zombies sur les défenses. | Faible en hiver et par temps gris | Rivière gelée en hiver ou à sec en été (Book 13), vent irrégulier |

> Les saisons se complètent : l'hiver favorise les Charbonniers, l'été les Voltaïques. C'est ce qui fait vivre le marché saisonnier de l'énergie (Book 07 §3.4).

**Le Wh_m ne se transporte pas.** Une roue, un moulin ou un manège entraîne les machines **placées à côté**, par un arbre ou une courroie. Pour alimenter une machine plus loin ou charger une batterie, il faut convertir en électricité avec une dynamo ou un alternateur (50 à 70 %). La roue hydraulique est la source la plus puissante, mais elle demande un cours d'eau : c'est un avantage de terrain, pas une condition pour jouer Mécaniste.

**Le poids de l'énergie.** Pour déposer de l'électricité au comptoir, et donc créer des wotts (§6), il faut la porter. Une batterie au plomb stocke ≈ 20 Wh_é par kg : un sac de 70 kg (Book 12) emporte ≈ 1,3 kWh par trajet. Le lithium (≈ 150 Wh_é/kg) en emporte ≈ 10 kWh, mais il est rare, ne se fabrique pas, et les batteries trouvées dans les ruines sont souvent mortes. **Toutes les batteries s'usent** à chaque cycle de charge (≈ 300 cycles pour le plomb). L'électricité reste donc surtout locale, et c'est sous forme de **combustible** (charbon de bois ≈ 8 000 Wh_th/kg) que l'énergie voyage le mieux.

### Hors ligne : ce qui avance, ce qui est gelé (validé)

Règle générale : **ce qui suit l'horloge d'action concerne le personnage, et se gèle quand il n'est pas là. Ce qui suit le calendrier concerne le monde, et continue.**

| Élément | Hors ligne | Détail |
|---|---|---|
| Faim, soif, sommeil, carences | **Gelés** | Les carences se comptent en jours de jeu connectés (Book 05 §3). |
| Saignement, infection, fièvre grise, maladies | **Gelés** | Ils reprennent à la reconnexion. Le personnage n'est jamais blessé hors ligne (Book 06 §9.4) : se déconnecter ne soigne rien et n'aggrave rien. |
| Cicatrisation, consolidation, convalescence | **Avancent** (calendrier) | Seulement si la blessure est soignée (pansement, attelle) et **non infectée** : une plaie infectée ne cicatrise pas. |
| Chauffage du logement | **Éteint** | Personne n'est là. Au retour, il faut rallumer (Book 10 §5). Ce qui craint le gel se garde en cave. |
| Machines de la base (serre, séchoir, clôture, chambre froide, moulin…) | **Tournent** (calendrier) | Selon l'énergie produite et ce qui leur a été chargé (voir ci-dessus) |
| Processus passifs à durée fixe (charbonnière, tannage, séchage, fonte…) | **Avancent** | Chacun à son horloge (règle de répartition ci-dessus). Un processus surveillé, comme la fonte (Book 04 §2.5), n'est pas rechargé : on ne le lance que si l'on peut rester. |
| Animaux | **Mangent sur le stock** | Stock vide : ils maigrissent, puis meurent, au calendrier. Le lait et les œufs non récoltés se perdent au-delà de ce que tiennent le pis et le nid (Book 11 §9). |
| Batteries | **Se déchargent** (calendrier) | ≈ 10 % par saison pour le plomb, ≈ 5 % pour le lithium |
| Conservation des aliments, usure des machines | **Avancent** (calendrier) | Book 11 §11 |
| Zombies | **Rôdent** | Siège hors ligne résolu à la reconnexion (Book 06 §9.4) |

---

## 2 ter. Les PNJ

Le monde ne doit jamais sembler vide, même quand peu de joueurs sont connectés. Les PNJ jouent aussi des rôles que les joueurs ne peuvent pas tenir en permanence.

| PNJ | Où | Rôle |
|---|---|---|
| **Les Compteurs** | Comptoirs | Commerce, émission et retrait des wotts, comptes, services (réparation, transport sécurisé). Gardes armés : zone sans combat. |
| **Marchands itinérants** | Haltes, de passage | Commerce ponctuel avec des stocks limités. Biens d'autres régions. |
| **Survivants isolés** | Ruines, lieux de flux | Quêtes, informations (où trouver tel vestige), **apprentissage des technologies étrangères** (§5). |
| **Hameaux des trois familles** (validé) | Lieux dédiés | Une communauté de Charbonniers, une de Voltaïques, une de Mécanistes. On y apprend leurs techniques et on y commerce leurs produits. |
| **Pillards** | Haltes, ruines | Hostiles. Ils maintiennent la tension quand il y a peu de joueurs. |

### Une menace constante

Pour qu'une halte reste dangereuse **quel que soit le nombre de joueurs**, la présence des pillards PNJ s'ajuste à la population de l'instance :

- **peu de joueurs** → plus de pillards PNJ ;
- **beaucoup de joueurs** → moins de pillards PNJ, puisque la menace vient déjà des autres joueurs.

> Le PNJ pillard obéit aux mêmes règles que le joueur : il a un inventaire, il fait du bruit en se battant (et attire donc les zombies), et ce qu'il porte peut être récupéré.

---

## 3. La matière : vestiges, outils, ressources

### Les trois états d'un objet

```
             ┌────────────► OUTIL (usage direct ou détourné)
             │               barre de fer → pied-de-biche, arme
  VESTIGE ───┤
  (fouille)  │               démontage (outils, temps)
             └────────────► COMPOSANTS ───► MATIÈRE PREMIÈRE ───► NOUVEL OBJET
                             vis, câble,     (chauffer, ramollir,   (forger, couler,
                             roulement…       fondre : Wh_th)        assembler)
```

- **Usage direct :** pas d'énergie, mais l'objet reste ce qu'il est. Une barre de fer ne deviendra jamais un couteau tranchant sans être travaillée.
- **Démontage :** coûte du temps et demande le bon outil. Un tournevis ne suffit pas pour démonter un moteur.
- **Transformation :** coûte des Wh et demande une **installation** capable d'atteindre la bonne température.

### Deux verrous : la température et l'énergie

On ne fond pas de l'acier sur un feu de camp, même avec une montagne de bois. Chaque transformation demande :

1. Une **installation** qui atteint la température nécessaire (verrou de technologie).
2. Une **quantité d'énergie** en Wh_th, qui dépend du rendement de l'installation (coût de jeu).

| Installation | Température max | Rendement thermique | Palier |
|---|---|---|---|
| Feu de camp | ≈ 600 °C | ≈ 5 % | I |
| Foyer de forge (on y souffle à la main) (bois ou charbon de bois ; en jeu, 1 kg de charbon pour un couteau) | ≈ 900 °C | ≈ 8 % | I |
| Forge au charbon de bois avec ventilation | ≈ 1 300 °C | ≈ 10 % | II |
| Creuset isolé (four de fonderie) | ≈ 1 200 °C | ≈ 15 % | II |
| Four à arc ou à induction (électrique) | ≈ 1 600 °C et plus | ≈ 60 % | III, très énergivore |

### Coût de transformation des métaux (par kg)

« Théorique » = énergie physiquement nécessaire. « Jeu » = énergie à fournir avec une installation artisanale typique.

| Matériau | Action | Température | Théorique | Jeu (indicatif) | Faisable avec |
|---|---|---|---|---|---|
| **Plomb** | Fondre | 330 °C | ≈ 20 Wh | ≈ 300 Wh_th | Feu de camp |
| **Aluminium** | Fondre | 660 °C | ≈ 270 Wh | ≈ 2 000 Wh_th | Creuset au charbon de bois |
| **Cuivre** | Fondre | 1 085 °C | ≈ 170 Wh | ≈ 2 500 Wh_th | Forge ventilée et creuset |
| **Acier** | Ramollir (forger) | 900 à 1 100 °C | ≈ 180 Wh | ≈ 2 000 Wh_th par chauffe | Forge ventilée (palier II) |
| **Acier** | Fondre | 1 500 °C | ≈ 330 Wh | ≈ 10 000 Wh_th et plus | Four électrique uniquement (fin de jeu) |
| **Verre** | Ramollir | ≈ 1 000 °C | — | ≈ 3 000 Wh_th | Forge ventilée |

> Une pièce forgée demande en général **plusieurs chauffes**. Un couteau, c'est 5 à 10 chauffes, soit 10 à 20 kWh_th, soit 1,25 à 2,5 kg de charbon de bois. Le combustible coûte peu ; ce qui coûte, c'est le travail, le savoir-faire et l'installation (voir le book 02).

### Trois façons de travailler le métal

Chaque famille dispose d'une voie native pour transformer le métal. Aucune n'est meilleure : elles produisent des choses différentes.

| | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **Méthode** | Chauffer : forger, fondre, couler | Assembler : souder à l'arc, découper | Travail à froid : scier, limer, plier, riveter |
| **Énergie** | Wh_th (combustible) | Wh_é (batteries) | Calories et temps |
| **Exemple** | Couler des balles de plomb, forger une lame | Souder un cadre avec 3 batteries de voiture en série | Riveter une armure de tôles, limer un ressort en lame |
| **Limite** | Bruyant, fumée | Consomme vite les batteries : 1 min de soudure ≈ 40 Wh_é | Lent, ne change pas la nature du matériau |

---

## 4. Les trois familles

### Socle commun

Six caractéristiques, valeur de base **10** :

| Stat | Effet |
|---|---|
| **FOR** (Force) | Dégâts en mêlée, portage, travaux lourds (abattage, maçonnerie) |
| **END** (Endurance) | Réserve d'effort, sprint, résistance à l'épuisement |
| **DEX** (Dextérité) | Crafting fin, crochetage, réparations délicates, tir |
| **PER** (Perception) | Détection des menaces et des ressources, fouille |
| **SAV** (Savoir technique) | Accès aux recettes avancées, rendement des machines |
| **MET** (Métabolisme) | Efficacité calorique : plus il est haut, moins on a faim |

**Règle d'or :** chaque famille reçoit **+3 / −3** en modificateurs de stats, et ses traits ont une **valeur nette de 0 point** (voir §7).

---

### 🔥 Les Charbonniers — « Le feu ne trahit pas »

Ce sont les descendants des forgerons, chauffagistes et ouvriers d'usine. Ils ont survécu aux premiers hivers parce qu'ils savaient entretenir un feu. Leurs camps sentent la suie et on les entend de loin.

**Énergie : combustion.** Bois, charbon de bois, alcool, huiles. Ils brûlent aussi le biogaz, mais le digesteur est une technique des Mécanistes.

| FOR | END | DEX | PER | SAV | MET |
|---|---|---|---|---|---|
| **+2** | −1 | −1 | −1 | 0 | **+1** |

| Type | Trait | Effet |
|---|---|---|
| ✅ Signature | **Maîtres du feu** | Rendement des installations thermiques +30 %. Fours, forges et lames natifs. |
| ✅ Atout | **Peau tannée** | Résistance au froid élevée. Le corps brûle moins de calories pour se réchauffer. |
| ❌ Handicap | **Poumons de suie** | Jauge de *Suie* qui monte près des fumées et réduit l'END max. Un masque ou un filtre la ralentit. |
| ❌ Handicap | **Feu bavard** | Leurs installations ont une signature olfactive et sonore **+50 %**. |

- **Style de jeu :** bâtisseur et forgeron. Base fortifiée qu'on défend et qu'on agrandit.
- **Ce qu'ils font mieux que les autres :** métallurgie, outils, **lames forgées**, cuisson, chauffage.
- **Leur problème :** ils attirent les hordes. Une Charbonnière qui forge doit d'abord avoir des murs.

**Combat : les lames** (Book 25 §4, décision du 2026-10-09). Le corps à corps durable, au prix du bruit et de l'usure.

Les Charbonniers forgent de l'acier récupéré (lames de ressort, socs, limes) : couteau de forge, hachette qui se lance, serpe, **machette forgée** (leur arme de métier), hache, et, à la forge ventilée, le glaive. La qualité d'une lame est le maillon faible de l'acier, de la trempe et de la forge (★ à ★★★★★). C'est l'arme qui tue le plus vite et qui dure le plus ; mais elle est **tranchante** (le casque d'un Équipé l'arrête à la tête) et un coup s'entend à 10 m. Ils reprennent et reforgent eux-mêmes leurs lames à la forge.

**La poudre noire est reportée après la 1.0** (Book 25 §12, n° 7). Les lames suffisent à faire un métier, et un coup de feu qui s'entend à 300 m changerait tout l'équilibre de la Coopérative. On la garde ici en idée, pour plus tard : 75 % de salpêtre (une *nitrière* : compost, fumier, urine, des semaines de jeu), 15 % de **charbon de bois**, 10 % de soufre (rare) ; du plomb coulé facilement (300 Wh_th/kg) ; des amorces introuvables avant le palier III (ou un mécanisme à silex) ; et un coup de feu qui appelle la horde.

**Progression énergétique**

| Palier | Technologies |
|---|---|
| I | Feu ouvert, foyer de pierres, foyer de forge, fumage, fonte du plomb, couteau et machette forgés |
| II | Poêle-fusée, four à pain, charbonnière, forge ventilée, enclume, creuset, glaive |
| III | Bas fourneau, gazogène, distillerie, petite machine à vapeur (avec un alternateur : électricité) |
| Après la 1.0 (idée) | Nitrière, poudre noire, mousquet à silex, rechargement de cartouches, amorces |

---

### ⚡ Les Voltaïques — « Le silence est une arme »

Ce sont les anciens de la **Compagnie d'électricité** de l'Âge de l'Abondance : techniciens, monteurs de lignes, ingénieurs du réseau. Ce monde était bête, mais si gourmand en énergie que la Compagnie avait dû garder des gens qui réfléchissent. Quand le réseau s'est effondré, ils ont emporté leur savoir et ce qu'ils pouvaient sauver du matériel. Ils savent réparer ce que les autres jettent.

**Énergie : électricité.** Solaire, batteries de récupération, petites éoliennes, dynamos.

| FOR | END | DEX | PER | SAV | MET |
|---|---|---|---|---|---|
| −2 | −1 | 0 | **+1** | **+2** | 0 |

| Type | Trait | Effet |
|---|---|---|
| ✅ Signature | **Courant propre** | Production et stockage électriques **sans signature sonore ni olfactive**. Seule la lumière nocturne trahit. Les outils, eux, font du bruit comme pour tout le monde. |
| ✅ Atout | **Œil de récupérateur** | Fouille des appareils électroniques : +1 composant rare par fouille réussie. |
| ❌ Handicap | **Dépendance aux pièces** | Les batteries s'usent (cycles) et les panneaux se salissent ou se cassent. L'entretien consomme des composants rares (cuivre, cellules, semi-conducteurs). |
| ❌ Handicap | **Habitués aux machines** | Fatigue rapide lors des travaux lourds (abattage, terrassement, collecte de bois) : ≈ +25 % de temps et de calories. Le portage, lui, n'est réduit que par la FOR −2 (Book 12 §2.1). À la Compagnie, les nacelles, les grues et les treuils faisaient le gros du travail. |

- **Style de jeu :** explorateur technique. On fouille les ruines (zones dangereuses mais riches) pour alimenter une base discrète.
- **Ce qu'ils font mieux que les autres :** éclairage, réfrigération (conservation), soudure, outillage électrique, radio, détection.
- **Leur problème :** une énergie **intermittente et limitée**. Un hiver gris vide les batteries, et sans composants tout finit par s'arrêter.

**Combat : le contrôle et l'information.** Ils ne frappent pas fort, ils choisissent leurs combats.

Leur faiblesse physique (FOR −2) est cohérente avec leur histoire et doit rester. Faire des Voltaïques des combattants physiques casserait leur identité. Leur réponse est ailleurs :

- **L'arme électrique** (Book 25 §5, décision du 2026-10-09) : matraque (de fortune, à la raquette, à bobine), aiguillon de défense. **Une décharge courte fait lâcher et raidit ; maintenue sur un Éteint debout, elle le met à terre ; maintenue à la tête d'un Éteint raidi ou à terre, elle le détruit. Le casque n'y change rien.** Rien au torse : on raidit, puis on éteint, sans jamais se laisser saisir. C'est la meilleure arme de contact contre l'Équipé casqué, et une courte libère un joueur saisi.
- **Détection :** alarmes (l'alarme électrique est silencieuse), capteurs de mouvement, radio. Ils savent où est la horde **avant** qu'elle arrive. Ils sont rarement surpris.
- **Défense passive :** clôtures électrifiées (≈ 2 à 5 W en continu, soit 50 à 120 Wh_é/jour) qui **raidissent** l'Éteint et le repoussent, et plaques de choc qui le couchent, sans aucun bruit. Elles **ne détruisent pas** : il faut quelqu'un pour achever.
- **Éblouissement :** projecteurs qui désorientent les zombies et attirent la horde **ailleurs** (leurre lumineux).
- **Contrepartie :** tout cela consomme des Wh_é (≈ 1,25 Wh par Éteint détruit), et l'arme électrique tue deux fois moins vite qu'une lame. L'hiver gris rationne le courant ; la manivelle de la lampe à dynamo les empêche d'être désarmés.

**Progression énergétique**

| Palier | Technologies |
|---|---|
| I | Piles et batteries récupérées, lampe à dynamo, chargeur bricolé, alarme à fil |
| II | Panneau solaire + régulateur, banc de batteries, petite éolienne, soudure à l'arc, matraque électrique, clôture électrique |
| III | Micro-réseau, onduleur, outillage électrique, réfrigérateur, radio longue portée, four électrique |

---

### ⚙️ Les Mécanistes — « Ce qui tourne ne meurt pas »

Ce sont les descendants des paysans, meuniers et cyclistes. Ils ont renoncé au feu et au courant comme sources de travail, au profit du muscle, de l'eau et de l'animal. Le feu leur sert à cuire et à se chauffer, moins que chez les Charbonniers, et le biogaz de leur fumier leur épargne la fumée. Leurs machines sont lentes et s'usent, mais elles se réparent toujours avec du bois, du cuir et de la graisse.

**Énergie : mécanique.** Pédaliers, manivelles, poulies, contrepoids, ressorts, roues hydrauliques, moulins à vent, traction animale.

| FOR | END | DEX | PER | SAV | MET |
|---|---|---|---|---|---|
| 0 | **+2** | **+1** | 0 | −2 | −1 |

| Type | Trait | Effet |
|---|---|---|
| ✅ Signature | **Rendement musculaire** | Production de Wh_m +30 % pour une même dépense calorique. Machines mécaniques natives. |
| ✅ Atout | **Robustesse simple** | Leurs machines n'ont **pas d'usure par composant rare** : entretien en bois, cuir, graisse. |
| ❌ Handicap | **Gros mangeurs** | Besoin calorique de base +15 %, en plus de l'énergie fournie par le corps. |
| ❌ Handicap | **Tradition orale** | Recettes avancées (électricité, chimie) plus lentes à apprendre. |

- **Style de jeu :** autonome et patient. Fermier-artisan qui maîtrise sa chaîne de bout en bout.
- **Ce qu'ils font mieux que les autres :** agriculture (pompes, moulins), transformation (farine, huile, cordes), transport (charrettes, vélos-cargos), menuiserie, travail du métal à froid.
- **Leur problème :** **tout se paie en nourriture et en temps**. Un Mécaniste qui a faim n'a plus d'énergie.

**Combat : la mécanique silencieuse.** Précision et endurance.

- **L'arbalète** (Book 25 §6) : armée d'avance, elle détruit à la tête jusqu'à 12 m sans rien bander ; mais la réarmer immobilise. Arbalète légère (arc de frêne, lame de ressort, if), arbalète lourde et cranequin (avec les ressorts retrempés des Charbonniers), lance-pierre lourd plus tard. Silencieuses, carreaux **récupérables**, rechargement lent.
- **L'arc** n'est plus un métier : il est **commun à tous** (Book 25 §3). Les Mécanistes y gardent un avantage de savoir : ils reconnaissent les essences (l'if), et leurs arcs passent au tour.
- **Pièges mécaniques :** fosses, contrepoids, mâchoires. Aucune énergie après la pose.
- **Endurance :** ils peuvent nettoyer une zone longtemps sans s'épuiser.
- **Contrepartie :** faible cadence et puissance moyenne. Face à une horde, ils reculent en tirant.

**Progression énergétique**

| Palier | Technologies |
|---|---|
| I | Manivelle, pédalier, meule à bras, pompe à main, arbalète légère, assommoir, travail à froid |
| II | Système de poulies, tour à perche, vélo-cargo, treuil, arbalète lourde et cranequin, piège à mâchoires, rivetage |
| III | Roue hydraulique, moulin à vent, manège et traction animale (bœuf, cheval), digesteur à biogaz, scierie mécanique, baliste de rempart |

---

## 5. Vue d'ensemble

### Le triangle des coûts

Chaque famille paie son énergie dans **une monnaie différente** :

| | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **Monnaie de paiement** | 🧟 Sécurité (signature) | 🔩 Rareté (composants) | 🍖 Calories (nourriture) |
| **Abondance de l'énergie** | Élevée | Faible et intermittente | Moyenne, mais lente |
| **Discrétion** | Faible | Élevée | Moyenne |
| **Autonomie** | Moyenne (bois) | Faible (pièces) | Élevée |
| **Contrainte hors ligne** (§2 bis) | Remplir | Attendre | Réparer |
| **Style** | Bâtisseur | Explorateur | Producteur |

### Le triangle de combat

Chaque famille a une force de combat différente, et aucune ne domine les deux autres.

| | 🔥 Lames | ⚡ Contrôle électrique | ⚙️ Mécanique silencieuse |
|---|---|---|---|
| **Puissance** | Élevée : la mise à mort la plus rapide | Moyenne : raidir, puis éteindre | Moyenne, mais **avant le contact** |
| **Bruit** | Élevé (un coup : 10 m ; la forge : 40 m) | Faible (crépitement, 6 à 8 m) | Faible (la corde, 3 à 6 m) |
| **Coût par usage** | Usure (la lame la plus solide) | Wh_é | Quasi nul (munitions récupérables) |
| **Brille quand…** | La visite est longue, l'Éteint après l'Éteint | Il est casqué, on est saisi, ils sont serrés | Le terrain est ouvert, on frappe le premier |
| **Échoue quand…** | L'Éteint est casqué, la discrétion compte | Les batteries sont vides | La horde est déjà là |

Le détail chiffré, niveau par niveau (★ à ★★★), est au Book 25 §8.4 : chacune est la meilleure sur son terrain, et jamais plus de deux fois moins bonne ailleurs. **L'arc**, commun à tous, sert de repère.

### Interdépendance

| A besoin de → | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **🔥 Charbonniers** | — | Détection (alarme silencieuse), filtres, ventilateur de forge | Nourriture, bois transporté, affûtage, manches tournés, arbalètes et carreaux |
| **⚡ Voltaïques** | Cuivre fondu, pièces forgées, électrodes forgées, une lame pour les jours sans courant | — | Recharge par pédalage (secours hiver), manches tournés, nourriture |
| **⚙️ Mécanistes** | Outils forgés, ressorts retrempés, pointes d'acier, engrenages | Conservation (froid), éclairage (lampe bricolée), packs de cellules, soudure | — |

Ces besoins sont des **améliorations**, jamais des verrous : chaque famille fabrique **seule** sa base (son arme de métier ★ et ★★, ses outils, ses installations), et les autres lui ouvrent les étoiles hautes, les variantes et le confort (Book 25 §2.5 et §7).

### Accès aux technologies des autres familles

Aucune technologie n'est verrouillée, pour éviter qu'une famille soit coincée.

- **Technologie native :** coût normal.
- **Technologie étrangère :** apprentissage requis (livre, PNJ, autre joueur), puis **coût ×1,5** et **temps de craft ×1,5**. En jeu (0.6, Book 25 §2.3) : les recettes des autres familles se voient grisées, s'ouvrent par la leçon d'un joueur ou un manuel, et ce qu'elles produisent ne dépasse pas **★★**.
- Les traits de signature (+30 %, sans signature, etc.) ne s'appliquent **qu'aux technologies natives**.

---

## 6. Économie : des cours dynamiques

### Principe

Le prix des biens dépend de **l'offre et de la demande réelles sur le serveur**. Si la majorité des joueurs sont Charbonniers :

- ce qu'ils produisent en abondance (charbon de bois, outils et lames forgés) **perd de la valeur** ;
- ce dont ils manquent (nourriture, filtres, composants) **prend de la valeur** ;
- jouer une famille minoritaire devient **plus rentable**.

L'économie devient ainsi un **mécanisme d'équilibrage automatique** de la population des familles, sans imposer de quota.

### Le prix de base : l'énergie grise

> *Inspiration : la lecture de l'économie par l'énergie popularisée par Jean-Marc Jancovici. Ce qui a de la valeur, c'est l'énergie qu'il a fallu pour transformer le monde.*

Chaque objet crafté porte son **énergie grise**, c'est-à-dire la somme de toute l'énergie dépensée pour le produire, matières comprises. Elle est **affichée sur l'objet** : le joueur voit ce que « coûte » réellement ce qu'il tient.

> **Le nom de la monnaie (validé, 2026-10-07) : le « wott ».** La monnaie s'appelait d'abord le « watt » ; elle a été renommée **wott** pour ne plus la confondre avec le **watt**, l'unité physique de puissance (W), que le jeu utilise aussi (panneaux, pédalage, Wh). Dans l'univers, c'est le surnom que les survivants ont donné aux bons des Compteurs.
>
> **Affichage (validé, 2026-10-07).** Le wott est une **monnaie**, pas une énergie : la fiche de l'objet montre donc d'abord son **prix de base** (« valeur ≈ 79 wotts »), puis le **détail des énergies réelles** qui le composent (par exemple « 30 min de travail · 125 kcal », « matières · 54 wotts », « 2 Wh_é »). Le joueur voit à la fois ce que l'objet vaut et ce qu'il a coûté physiquement. Mis en place avec le comptoir (É4, Book 21 §3.9).

```
énergie grise = énergie grise des matières
              + énergie de transformation (Wh_th, Wh_é, Wh_m dépensés à l'installation)
              + travail humain (kcal dépensées au-delà du métabolisme de base)
```

Le **prix de base en wotts** s'en déduit directement, en appliquant le cours de chaque forme d'énergie :

| Forme | Cours de base |
|---|---|
| 1 Wh_é | 1 wott |
| 1 Wh_m | 0,6 wott |
| 1 kcal de **travail humain** | 0,2 wott |
| Nourriture | **À son énergie grise** (≈ 0,06 wott/kcal pour le pain, Book 02 §12.4) |
| Combustibles | **À leur énergie grise**, pas à leur pouvoir calorifique (voir ci-dessous) |

> **Pourquoi la chaleur n'a pas de cours au Wh.** Une heure de collecte rapporte environ 10 kg de bois sec, soit 44 000 Wh_th, pour 400 kcal d'effort. Si on payait la chaleur au Wh, couper du bois rapporterait des dizaines de fois plus que n'importe quelle autre activité. Un combustible vaut donc **le travail qu'il a coûté** : bois sec ≈ 8 wotts/kg, charbon de bois ≈ 47 wotts/kg (détail dans le book 02).
>
> C'est aussi plus juste physiquement : une chaleur à haute température (charbon de bois, 1 300 °C) vaut plus qu'une chaleur tiède, même à quantité de Wh égale. Le charbon vaut plus cher que le bois parce qu'il permet de forger, pas parce qu'il contient plus d'énergie.

> **Contrôle de cohérence :** le travail humain est payé 0,2 wott/kcal, alors que la nourriture coûte ≈ 0,06 wott/kcal à produire. Travailler rapporte donc environ 3 fois ce que coûte la nourriture dépensée : c'est le **surplus agricole** qui fait vivre tous les métiers. Ce surplus ne crée pas de wotts, parce que le travail est toujours payé par quelqu'un (un joueur ou la trésorerie d'un comptoir). Seul le dépôt de Wh_é crée des wotts (voir plus bas).

**Exemple : un couteau forgé** (le même qu'au Book 02 §12.1)

| Poste | Quantité | Wotts |
|---|---|---|
| Ressort à lames récupéré (vestige) | coût de récupération | ≈ 50 |
| 5 chauffes à la forge | 10 000 Wh_th = 1,25 kg de charbon de bois | 59 |
| 1 h 30 de forge (travail lourd) | 450 kcal | 90 |
| **Énergie grise totale** | | **≈ 200 wotts** |

Soit un peu plus d'**une journée de nourriture** (un kilo de pain, 2 500 kcal, vaut ≈ 150 wotts). Ce qui fait la valeur d'un outil forgé, c'est surtout le travail, le savoir-faire et l'installation, plus que le combustible.

**Conséquences intéressantes :**

- **Aucun prix à régler à la main.** On définit les recettes en Wh et les prix en découlent. Tout reste cohérent quand on ajoute un objet.
- **Les bonus de famille deviennent des marges.** Le prix de base suit le **procédé de référence** (sans bonus). Un Charbonnier qui forge ce couteau dépense ≈ 23 % de charbon en moins (rendement +30 %, soit 1 − 1/1,3 ; on divise toujours par 1,3), mais le vend au même prix : sa maîtrise du feu devient un bénéfice.
- **Les vestiges sont précieux.** Un roulement à billes ou un panneau solaire contient une énergie grise que personne ne peut plus reproduire. Leur prix de base est leur **valeur de remplacement** : l'énergie qu'il faudrait pour les refaire avec les moyens actuels, plafonnée quand c'est impossible. Fouiller les ruines revient à récolter l'énergie de l'ancien monde.

### Le cours réel

Le prix de base sert de point d'ancrage. Le cours réel s'en écarte selon l'offre et la demande :

```
cours = prix_base × (demande / offre) ^ k

  demande : consommation observée sur la période + commandes ouvertes
  offre   : production observée sur la période + stocks en vente
  k       : élasticité (0,5 au départ : réaction lissée)
  bornes  : cours entre 0,5× et 2× le prix de base
```

- **Période glissante** (par exemple 7 jours réels) pour éviter les à-coups et les manipulations.
- **Comptoirs PNJ** qui servent de teneurs de marché : ils achètent et vendent toujours, avec une marge, pour qu'un joueur seul à 4 h du matin puisse quand même commercer.
- **Cours par région** (piste) : le transport a un coût, donc les prix diffèrent d'une ville à l'autre. Cela crée un rôle de marchand ou de caravanier, très naturel pour les Mécanistes avec leurs vélos-cargos.

### La monnaie : le wott (validé, détail dans le Book 07)

#### Ce qu'on attend d'une monnaie dans ce jeu

1. **Crédible :** sa valeur doit s'expliquer dans l'univers.
2. **Neutre :** aucune famille ne doit pouvoir « imprimer » de l'argent mieux que les autres.
3. **Risquée à transporter :** en dehors de sa base, on peut être pillé (§6 bis). Porter sa fortune sur soi doit être un vrai choix.
4. **Sans inflation :** l'argent ne doit pas apparaître à partir de rien.
5. **Favorable à l'onboarding :** les anciens ne doivent pas pouvoir accumuler une fortune qui rend l'économie inaccessible aux nouveaux.

#### Options écartées

| Option | Pourquoi l'écarter |
|---|---|
| **Troc pur** | Réaliste, mais impraticable à grande échelle : il faut que deux joueurs aient chacun ce que l'autre veut au même moment. Le troc reste **toujours possible** à côté de la monnaie. |
| **Marchandise-monnaie** (cartouches, sel, alcool, batteries…) | Une famille la produit forcément mieux que les autres. Avec les cartouches, les Charbonniers imprimeraient la monnaie. |
| **Monnaie PNJ « magique »** (pièces gagnées en tuant des zombies) | Aucun sens dans l'univers, et source d'inflation permanente. |

#### Le **wott**, un bon adossé à l'énergie

Les **Compteurs** sont une guilde neutre de PNJ qui gère les derniers grands stocks d'énergie (batteries de centrales, cuves de carburant, réserves de charbon). Ils tiennent les **comptoirs** et émettent des **bons d'énergie**, que tout le monde appelle des **wotts**.

- **1 wott = un bon remboursable contre 1 Wh_é** au comptoir. L'électricité sert de référence parce que c'est la forme d'énergie la plus polyvalente (§2).
- **Le wott n'est créé que lorsqu'un joueur dépose de l'électricité (Wh_é) au comptoir**, parce que c'est la seule énergie que les Compteurs stockent dans leurs cellules. Pas d'électricité déposée, pas de wott. Tout le reste (combustibles, nourriture, objets, travail) est acheté avec la **trésorerie** du comptoir, c'est-à-dire avec des wotts qui existent déjà (Book 07 §3.1).

**Comment chaque famille crée des wotts :** en produisant de l'électricité chez elle, puis en la portant au comptoir dans des batteries (§2 bis).

| Famille | Ce qui produit l'électricité | Ce qui la limite |
|---|---|---|
| 🔥 Charbonniers | Machine à vapeur + alternateur (palier III) | Combustible (remplir), signature |
| ⚡ Voltaïques | Panneaux solaires, petite éolienne | Jour, saison, météo (attendre) |
| ⚙️ Mécanistes | Roue hydraulique, moulin à vent ou manège + alternateur, pédalier à dynamo | Usure (réparer), fourrage, calories |
| Tous | — | Capacité et poids des batteries, trajet jusqu'au comptoir |

Les wotts se **gagnent** aussi, sans en créer, en vendant des biens et des services : combustibles, nourriture, outils, composants, ou travail sur les machines du comptoir (pédaliers, meules), payé sur sa trésorerie.

**Ce que fait le comptoir de chaque forme d'énergie apportée :**

| Forme apportée | Traitement | Justification |
|---|---|---|
| Wh_é (batterie chargée) | **Crée des wotts** : 1 wott par Wh_é, modulé par la saison (Book 07 §3.4) | Référence : c'est ce que stockent les cellules |
| Wh_m (pédalage sur place) | **Service payé sur la trésorerie** | Le comptoir n'en a besoin que pour ses propres machines |
| Combustibles, nourriture | **Achetés sur la trésorerie**, à leur cours | Ce sont des biens, pas de l'énergie stockée. La chaleur est quasi impossible à convertir en électricité (< 3 %). |

> La boucle est cohérente : **la monnaie est de l'énergie, et les biens valent l'énergie qu'ils contiennent.**

> Si tout le monde est Charbonnier, le comptoir croule sous le charbon. Le cours du charbon baisse et chaque kilo rapporte moins de wotts. L'équilibrage par les cours s'applique donc aussi à la monnaie.

**Où passe l'argent qui sort du jeu :**

- **Retrait d'énergie :** échanger des wotts contre une recharge ou du combustible détruit les wotts correspondants.
- **Services des comptoirs :** réparations, apprentissage de recettes, transport sécurisé.
- **Décharge :** tous les wotts, où qu'ils soient, **perdent environ 2 % par semaine réelle**, comme l'énergie de la batterie de réserve qu'ils représentent. Cela pousse à faire circuler l'argent plutôt qu'à le thésauriser, ce qui protège les nouveaux joueurs (détail et explication dans l'univers : Book 07 §3.3).

#### Le wott et le risque

| Où sont les wotts | Risque |
|---|---|
| En poche (bons papier dans l'inventaire) | **Pillables** en dehors de la base, perdus à la mort |
| Dans le coffre de la base | Protégés des joueurs (décharge normale) |
| Sur un compte au comptoir | Protégés, retrait seulement dans un comptoir (décharge normale) |

> Le trajet entre le comptoir et la base devient un moment de tension, à condition que les longs trajets passent par des **haltes** (§2 bis). On peut y voir naître des escortes, des caravanes… et des embuscades.

---

## 6 bis. Territoires et rencontres entre joueurs

### Le terrain du joueur

Chaque joueur reçoit **un terrain de taille fixe** à la création de son personnage. Ce terrain **est** sa base : c'est la zone protégée où il construit.

**Choix de la topologie :**

1. À la création du personnage, le jeu génère **3 terrains au hasard**.
2. Le joueur en choisit un. Ce choix est définitif.

**Ce qui compose un terrain :**

| Élément | Exemples | Intéresse surtout |
|---|---|---|
| Bois et forêt | Taillis, futaie, bois mort | 🔥 Charbonniers |
| Exposition et relief | Versant sud, crête ventée, plateau dégagé | ⚡ Voltaïques |
| Eau | Rivière, ruisseau en pente, source, étang | ⚙️ Mécanistes (roue hydraulique) et tout le monde (eau potable) |
| Sol | Terre arable, argile, pierre, sable | Agriculture, construction, fours et creusets |
| Vestiges sur place | Ruine de ferme, garage, pylône abattu | Tout le monde (matériaux de départ) |

**Règles d'équilibrage du générateur (proposition) :**

- Les 3 terrains proposés ont le même **score de potentiel** (somme pondérée des ressources). Ils diffèrent par leur **profil**, pas par leur richesse.
- Le tirage comprend toujours : **1 terrain favorable** à la famille choisie, **1 terrain neutre**, **1 terrain favorable à une autre famille**. Ce dernier sert au joueur qui veut sortir de sa spécialité ou vendre ce que les autres n'ont pas.
- Aucun terrain n'est **privé d'eau** : c'est une ressource vitale, pas un choix de build.

### Amis et visites

- **On ne peut pas entrer sur le terrain d'un autre joueur**, sauf s'il vous a déclaré **ami**.
- **Sur le terrain d'un ami, le combat est désactivé**, pour les deux joueurs. Le terrain reste une zone sans combat, quoi qu'il arrive.

**La trahison existe, mais pas par les armes.** Proposition :

| Niveau de confiance | Accès | Trahison possible |
|---|---|---|
| **Inconnu** | Aucun accès au terrain | — |
| **Ami** | Entrée sur le terrain, échanges, coffres **que l'hôte a ouverts** | Vider un coffre partagé, repérer la base et les allées et venues |
| **Associé** (piste) | Accès à tous les coffres, droit de construire | Vol et démontage de constructions |

- L'hôte peut **retirer l'amitié à tout moment**. L'ancien ami est alors immédiatement reconduit à la limite du terrain.
- **Hors des terrains, l'amitié ne protège de rien.** Un ami peut tendre une embuscade sur la route. C'est la trahison classique, et elle a la même règle que pour tout le monde.

> Logique : la base reste un sanctuaire, ce qui est la promesse faite au joueur. Le risque de trahison porte sur **ce qu'on confie** et sur **ce qu'on révèle**, jamais sur sa vie à l'intérieur de chez soi.

### Les zones

| Zone | Pillage entre joueurs | Zombies |
|---|---|---|
| **Son terrain** | ❌ **Impossible** : on ne peut ni être attaqué ni être pillé | Oui, la base doit être défendue contre les zombies |
| **Terrain d'un ami** | ❌ Impossible : combat désactivé | Oui |
| **Comptoir des Compteurs** | ❌ Impossible : zone neutre gardée par des PNJ | Non |
| **Partout ailleurs** (nature, ruines, routes) | ✅ **Possible** | Oui |

- **Mort face à un joueur :** même règle que d'habitude. L'inventaire courant tombe au sol et peut être ramassé, puis le joueur revient à sa base.
- **Rien n'oblige à attaquer.** Les joueurs peuvent se parler, s'ignorer ou commercer.

### Lire les intentions

Pour que la rencontre ne tourne pas automatiquement au combat, il faut que les intentions soient **lisibles** :

- **Arme rangée ou dégainée :** visible de loin. Dégainer prend une à deux secondes, assez pour réagir.
- **Chat de proximité** (texte, éventuellement voix) et **gestes** : main levée, drapeau blanc, signe de commerce.
- **Échange sécurisé :** une fenêtre de troc où les deux joueurs valident (objets + wotts). Pas d'arnaque possible pendant l'échange lui-même, mais on peut toujours être attaqué après.

### Ce qui freine le pillage

- **Le bruit :** un combat attire les zombies. Un pillard Charbonnier qui ouvre le feu prend un vrai risque (§2).
- **Ce qu'on gagne est limité :** seul l'inventaire courant est pillable. Un voyageur prudent ne transporte pas tout.
- **La réputation :** en suspens, aucune intégration satisfaisante pour l'instant (voir §9).

---

## 7. Méthode d'équilibrage

### 7.1 Budget de points

Chaque trait a une valeur. La somme nette d'une famille doit faire **0**. **Les poids sont à valider en simulation.**

| Famille | Traits positifs | Traits négatifs | Net |
|---|---|---|---|
| 🔥 Charbonniers | Maîtres du feu (+6), Peau tannée (+3) | Poumons de suie (−4), Feu bavard (−5) | **0** |
| ⚡ Voltaïques | Courant propre (+6), Œil de récupérateur (+3) | Dépendance aux pièces (−5), Habitués aux machines (−4) | **0** |
| ⚙️ Mécanistes | Rendement musculaire (+6), Robustesse simple (+3) | Gros mangeurs (−5), Tradition orale (−4) | **0** |

> Structure imposée : **1 signature (+6), 1 atout (+3), 1 handicap majeur (−5), 1 handicap mineur (−4).** Le handicap majeur porte toujours sur la monnaie de paiement de la famille.

### 7.2 Monnaie commune : le temps de survie

Pour comparer des choses différentes (calories, composants, zombies attirés), on convertit tout en **temps réel passé à survivre** (se chauffer, se nourrir, s'éclairer, se défendre, réparer), par opposition au temps passé à progresser (forger, explorer, construire, commercer).

**Unité : une journée réelle type, avec 2 h de connexion**, soit 5 jours (action). Le chauffage et les besoins ne comptent que pendant la connexion (hors ligne, ils sont éteints ou gelés, §2 bis). La production de la base compte sur les 24 h réelles.

**Repères de besoin pour ces 2 h, en hiver** (cabane en rondins, Book 10 §4) :

- **Chauffage :** ≈ 65 kWh, soit ≈ 25 kg de bois sec au poêle en fonte (≈ 18 kg au poêle de masse), ou ≈ 50 kg de bois humide ramassé dans la neige.
- **Nourriture :** ≈ 12 500 kcal, soit ≈ 5 kg de pain.
- **Éclairage :** ≈ 0,6 kWh_é avec une lampe de 10 W. Un panneau de 100 W en produit ≈ 1,3 kWh par jour réel en hiver : il faut une batterie. Le chauffage électrique (≈ 65 kWh_é) est hors de portée.

**Cibles :**

| Profil | Part du temps de connexion passée à survivre |
|---|---|
| Débutant **non préparé**, en hiver, dans une cabane | **≈ 40 %** |
| Joueur **préparé** (bûcher, cave, maison isolée), en hiver | ≈ 10 %, la préparation ayant été faite à l'automne |
| Joueur préparé, **en moyenne sur l'année** | **≈ 20 %** |

> **L'hiver se prépare.** Le temps du joueur prévoyant ne disparaît pas : il est passé à l'automne, à récolter, fendre, conserver et isoler. Bien construire et bien stocker, c'est s'offrir du temps libre en hiver. Ce qui rend l'hiver cher sans préparation : le bois mort humide et lent à ramasser (Book 02 §3), rien ne pousse dehors (Book 11 §11), les prix d'hiver (Book 07 §6.1), les enduits qui ne sèchent pas quand il gèle (Book 10 §6), le froid à chaque sortie.

**Hiver non préparé, cabane, 2 h de connexion** (valeurs cibles en minutes réelles, à mesurer en playtest) :

| Poste | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| Bois (humide, ramassé dans la neige) | 8 (poêle de masse) | 11 (*Habitués aux machines*) | 10 |
| Nourriture (achat au prix d'hiver, cueillette maigre) | 27 | 27 | 30 (*Gros mangeurs*) |
| Éclairage | 0 (feu) | 3 (batteries, hiver gris) | 2 (lampe à dynamo) |
| Menace (zombies attirés) | 10 (*Feu bavard*) | 3 | 4 |
| Entretien et manque | 2 | 4 (pièces) | 3 (réparer) |
| **Total** | **47 min** | **48 min** | **49 min** |
| **Part des 2 h** | ≈ 39 % | ≈ 40 % | ≈ 41 % |

**Critère de validation :** écart **≤ ±5 %** entre familles, en moyenne sur les 4 saisons. Sur une saison donnée, une famille peut s'écarter jusqu'à **±20 %** (les Voltaïques souffrent l'hiver, les Charbonniers en sont les rois) : c'est voulu, cela crée du rythme. **Les cours dynamiques (§6) amortissent ces écarts** : en hiver, les Wh_é deviennent chers et les Voltaïques vendent plus cher ce qu'ils produisent encore.

### 7.3 Trois profils de joueur à tester

Chaque famille est testée avec chaque profil (matrice 3 × 3) :

- **Explorateur :** sort beaucoup, base minimale.
- **Bâtisseur :** sort peu, investit dans la base.
- **Combattant :** nettoie des zones, cherche le loot dangereux.

**Attendu :** chaque famille est **meilleure avec un profil**, **correcte avec un autre** et **pénible (sans être injouable) avec le troisième**.

| | Explorateur | Bâtisseur | Combattant |
|---|---|---|---|
| 🔥 Charbonniers | Pénible | **Meilleur** | Correct ¹ |
| ⚡ Voltaïques | **Meilleur** | Correct | Pénible |
| ⚙️ Mécanistes | Correct | Pénible ² | **Meilleur** ³ |

¹ La lame tue le plus vite et dure le plus, mais elle fait du bruit et ne vient pas à bout d'un Équipé casqué. Il faut vérifier qu'elle ne fait pas des Charbonniers les « meilleurs » combattants (le simulateur du Book 25 §8.4 et §10, chantier 9).
² Le Mécaniste bâtisseur stagne : les grands chantiers demandent trop de calories.
³ Arbalète silencieuse, munitions récupérables, endurance : cohérent sur le papier, à confirmer en test.

### 7.4 Jalons mesurés

Pour chaque famille, on mesure le temps de jeu médian pour atteindre :

1. Le premier abri sûr
2. La première source d'énergie stable (≥ 1 kWh par jour de calendrier)
3. Le premier hiver survécu, puis le premier hiver passé **sur ses réserves** (temps de survie ≤ 20 %, §7.2)
4. Le premier palier III

**Règle :** chaque famille doit être **la plus rapide sur au moins un jalon** et **aucune ne doit l'être sur tous**.

### 7.5 Règle du contre-jeu

Chaque force doit avoir une situation où elle **ne sert à rien** :

| Force | Situation où elle ne sert à rien |
|---|---|
| Rendement du feu, lames (Charbonniers) | Mission de discrétion, infiltration ; l'Équipé casqué |
| Silence électrique, détection, arme électrique (Voltaïques) | Combat imprévu loin de la base, batteries vides |
| Endurance, arbalète (Mécanistes) | Pénurie de nourriture, horde déjà au contact |

---

## 8. Décisions prises

| Sujet | Décision |
|---|---|
| Mode de jeu | **Multijoueur** |
| Mort | **Effondrement** : perte de l'inventaire courant et retour à la base, blessures conservées mais stabilisées, convalescence. Mourir n'est jamais un raccourci (Book 05 §10). La base et son stock sont conservés. |
| Unité d'énergie | **Wh** (Wh_th, Wh_é, Wh_m) |
| Couche « Trois Sangs » | **Reportée en V2** : voir [Book 99 — Évolutions futures](99-evolutions-futures.md) |
| Économie | **Cours dynamiques** selon l'offre et la demande (§6) |
| Pillage entre joueurs | **Impossible dans sa propre base, possible partout ailleurs.** On peut aussi se parler et commercer (§6 bis). |
| Structure du monde | **Pas de monde ouvert** : une carte de navigation et des lieux instanciés, avec chargement entre chaque (§2 bis) |
| Haltes | **Map à traverser obligatoirement** sur les longs trajets (§2 bis) |
| Hors ligne | **Le personnage est sur la carte**, hors de toute map. À la connexion, il apparaît à l'entrée d'un lieu ou d'un côté d'une halte. |
| Instances | **Le joueur choisit**, mais le nombre d'instances ouvertes est limité : 10 joueurs max, 2e instance à partir de 5 joueurs, 3e à partir de 15 (valeurs à ajuster) |
| PNJ | **Oui**, plusieurs rôles (§2 ter) |
| Anti-fuite | **Déconnexion hors sortie de map : 30 s dans la map** (60 s après un combat). Immédiate sur une sortie, sur son terrain ou dans un comptoir. |
| Temps | **Deux horloges** : actions à 1 h de jeu = 1 min réelle (jour + nuit = 24 min) ; calendrier à 1 saison = 1 semaine réelle (1 an = 4 semaines réelles). Besoins du personnage suspendus hors ligne, monde qui continue (§2 bis). La production d'énergie de la base suit toujours le calendrier. Hors ligne, ce qui touche le personnage est gelé, ce qui touche le monde continue (§2 bis). |
| Signature | **Tout outil fait du bruit**, électrique ou manuel. « Courant propre » ne couvre que la production et le stockage d'électricité. |
| Savoir et mort | **Le savoir (carnet) est conservé à l'effondrement** en cours de cycle : seul l'inventaire courant est perdu. **Il est effacé en fin de cycle**, comme tout le reste (Book 09 §4). |
| Plateforme | **Navigateur** (ordinateur et mobile), commandes réassignables, commandes tactiles à l'écran (Book 08) |
| Phases | **Phase 0** : test familial sur Raspberry Pi. **Phase 1** : ouverture. **Tout ce qui touche à l'argent réel attend le signal du porteur du projet** : rien n'est préparé avant (Book 08 §1). |
| Cycle | **Réinitialisation toutes les 8 semaines réelles** (≈ 2 mois, 8 saisons), classement général entre les cycles, récompenses cosmétiques et d'accès (Book 09) |
| Terrain | **Taille fixe, ≈ 50 × 50 m** (Book 10 §10), topologie choisie parmi plusieurs générées au hasard à la création du personnage (§6 bis). Même disposition de carte pour tous, terrain au centre. |
| Visites | **Uniquement entre amis.** Combat désactivé sur le terrain d'un ami (§6 bis). |
| Prix | **Le prix de base d'un bien est son énergie grise**, convertie en wotts, nourriture comprise. Seul le travail humain a un cours propre (0,2 wott/kcal) (§6). |
| Création des wotts | **Seul le Wh_é déposé au comptoir crée des wotts.** Combustibles, nourriture, objets et travail (pédalage au comptoir compris) sont payés sur la trésorerie (§6, Book 07 §3.1). |
| Énergie de la base | **Production au calendrier, consommée sur place** : machines d'abord (selon la priorité et ce qui leur a été chargé), batteries ensuite, surplus perdu. Contrainte par famille : remplir (🔥), attendre (⚡), réparer (⚙️) (§2 bis). |
| Métier des familles | **Book 25 (2026-10-09)** : l'arc est commun à tous ; 🔥 les lames, ⚡ l'électricité qui raidit et détruit, ⚙️ l'arbalète, les pièges et le tour. **Seul, on fait sa base ; ensemble, on la fait mieux.** La poudre noire est reportée après la 1.0. |
| Transport d'énergie | **Limité par le poids des batteries** : plomb courant et lourd (≈ 20 Wh/kg), lithium rare et léger (≈ 150 Wh/kg), usure à chaque cycle (§2 bis). |

---

## 9. Questions ouvertes

- [x] **Saisons et onboarding :** ✅ en partie réglé par le cycle de 2 mois et l'arrivée en cours de cycle (Book 09 §2.1). Pour mémoire, la question était : comment permettre à un nouveau joueur d'arriver à tout moment tout en donnant un avantage aux anciens ? Pistes à étudier :
  - ✅ Calendrier décidé (1 saison = 1 semaine réelle, §2 bis) : une année dure un mois. L'hiver n'est jamais très loin, mais jamais permanent.
  - Avantage des anciens, **pendant le cycle**, par la **base, le savoir appris et la réputation**, pas par les stats (le savoir est effacé en fin de cycle, Book 09 §4). Un nouveau peut rattraper un ancien en compétence, pas en patrimoine.
  - Zones de départ moins exposées, où l'on arrive au printemps local quelle que soit la saison du serveur.
  - ✅ Les anciens qui **enseignent** des recettes aux nouveaux gagnent du rayonnement (Book 03 §5.4).
  - La structure en lieux aide : un nouveau joueur trouve toujours des lieux proches viables, tandis que les anciens tirent leur avantage de l'**accès aux lieux lointains** (véhicules, énergie pour voyager).
- [ ] **Monnaie :** le principe du wott est validé. ✅ Création des wotts tranchée : seul le Wh_é déposé en crée (§6). Restent à calibrer les cours de base.
- [ ] **Trahison :** valider les niveaux de confiance (Inconnu / Ami / Associé) et ce que chacun permet.
- [x] **Terrain :** ✅ ≈ 50 × 50 m (Book 10 §10).
- [ ] **Instances :** ajuster les seuils (10 max par instance, 2e instance à 5 joueurs, 3e à 15). Étendre la règle à tous les lieux publics ?
- [x] **Haltes :** ✅ taille (≈ 200 × 70 m) et durée validées (§2 bis). Le **nombre de haltes par trajet** est un simple **paramètre de réglage** : non bloquant, ajusté en test.
- [ ] **PNJ :** ✅ hameaux des familles validés. Restent à valider la liste des rôles et l'ajustement des pillards selon la population.
- [x] **Ruines :** ✅ modèle validé (« proches qui se régénèrent, lointaines qui s'épuisent »). À vérifier en test : qu'il ne pénalise pas les nouveaux joueurs.
- [ ] **Générateur de terrains :** valider la règle « 1 favorable, 1 neutre, 1 favorable à une autre famille » et définir le score de potentiel.
- [ ] **Réputation des pillards :** *en suspens*. Pas d'intégration crédible trouvée pour l'instant.
- [ ] **Création de personnage :** on change librement de famille entre deux cycles (Book 09 §4). Reste : peut-on « changer de feu » **en cours de cycle**, par un long apprentissage ?
- [ ] **Valeurs des traits :** les poids +6/+3/−5/−4 restent à valider en simulation.
- [x] **Poudre noire :** ✅ reportée après la 1.0 (Book 25 §12, n° 7) ; le combat des Charbonniers passe aux lames. Reste à vérifier en test que la lame ne domine pas le triangle (Book 25 §8.4).
- [ ] **Épuisement du bois :** levier de réserve si la simulation montre que le bois reste trop facile (§7.2) : bois mort du terrain en quantité finie, forêts qui se régénèrent au calendrier.

---

## Glossaire

- **Wh_th / Wh_é / Wh_m** : wattheure thermique, électrique, mécanique.
- **Signature** : trace sonore, olfactive ou lumineuse qui attire les zombies.
- **Vestige** : objet issu de la civilisation passée. Peut servir d'outil ou de ressource.
- **Installation** : équipement fixe qui permet une transformation (forge, creuset, banc de soudure…). Elle définit la température atteignable et le rendement.
- **Technologie native** : technologie de sa propre famille, sans malus.
- **Monnaie de paiement** : ressource dans laquelle une famille paie son énergie (sécurité, rareté, calories).
- **Cours** : prix dynamique d'un bien selon l'offre et la demande du serveur.
- **Wott** : bon d'énergie émis par les Compteurs, remboursable contre 1 Wh_é. C'est la monnaie d'échange. Il n'est créé que par un dépôt de Wh_é. À ne pas confondre avec le **watt** (W), unité de puissance (renommé le 2026-10-07).
- **Contrainte hors ligne** : ce que chaque famille doit faire pour que sa base produise en son absence : remplir (🔥), attendre (⚡), réparer (⚙️).
- **Compteurs** : guilde neutre de PNJ qui tient les comptoirs et émet les wotts.
- **Comptoir** : zone neutre et protégée où l'on dépose de l'énergie, commerce et retire des wotts.
- **Énergie grise** : somme de toute l'énergie dépensée pour produire un objet, matières et travail humain compris. Elle détermine son prix de base.
- **Procédé de référence** : façon standard de fabriquer un objet, sans bonus de famille. Sert à calculer l'énergie grise.
- **Valeur de remplacement** : prix de base d'un vestige, égal à l'énergie qu'il faudrait pour le refaire aujourd'hui (plafonnée si c'est impossible).
- **Terrain** : parcelle de taille fixe attribuée à chaque joueur. C'est sa base et une zone sans combat.
- **Lieu** : petite carte jouable instanciée, accessible depuis la carte du monde.
- **Halte** : lieu de passage imposé sur les longs trajets, où les voyageurs peuvent se croiser.
- **Flux / stock** : ressources renouvelables (soleil, bois, eau) contre ressources finies (vestiges de l'ancien monde).
