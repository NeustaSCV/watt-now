# Book 07 — L'Économie

> Document de conception · version 0.7 · 2026-10-07
> Statut : **brouillon de travail**. Valeurs indicatives, à valider par simulation avant tout playtest.
> Prolonge le [Book 01 §6](01-les-trois-feux.md) (énergie grise, cours dynamiques, wott), qui reste la référence pour les bases.

---

## 1. Principes

1. **La monnaie est de l'énergie, et les biens valent l'énergie qu'ils contiennent** (Book 01 §6).
2. **Personne n'imprime de wotts.** Ni les joueurs, ni les Compteurs. Un wott n'existe que parce qu'un Wh_é a été déposé. Seule exception : l'achat de Wh en argent réel (phase 1), compté et plafonné (Book 08 §4.2).
3. **Les prix bougent, mais dans des bornes.** Le cours réagit à l'offre et à la demande, sans s'emballer (0,5× à 2× le prix de base).
4. **L'économie équilibre les familles.** Une famille trop nombreuse voit ses produits baisser et ses besoins monter (Book 01 §6).
5. **Échanger comporte un risque physique.** Les biens et les bons se transportent, et on peut être pillé en route (Book 01 §6 bis).
6. **Les nouveaux joueurs doivent pouvoir entrer dans l'économie dès la première heure.**

---

## 2. Rappel du socle (Book 01 §6)

| Élément | Règle |
|---|---|
| **Énergie grise** | Toute l'énergie dépensée pour produire un objet (matières, transformation, travail humain). Affichée sur chaque objet. |
| **Prix de base** | Énergie grise du **procédé de référence** (voie la moins chère, sans bonus de famille) |
| **Cours** | `prix_base × (demande / offre) ^ 0,5`, borné entre 0,5× et 2×, sur une période glissante de 7 jours |
| **Wott** | Bon émis par les Compteurs, remboursable contre 1 Wh_é |
| **Cours de base de l'énergie** | 1 Wh_é = 1 wott · 1 Wh_m = 0,6 wott · 1 kcal de travail = 0,2 wott · nourriture et combustibles à leur énergie grise |
| **Création des wotts** | Seul le Wh_é déposé au comptoir crée des wotts (§3.1) |

---

## 3. Le wott en détail

### 3.1 Création et destruction

| Le wott est **créé** quand… | Le wott est **détruit** quand… |
|---|---|
| Un joueur **dépose de l'énergie électrique** au comptoir (batterie chargée) | Un joueur **retire de l'énergie** (recharge une batterie au comptoir) |
| | Il **perd de sa valeur** avec le temps (§3.3) |

**Tout le reste ne crée pas de wotts.** Quand un comptoir **achète** un objet, un combustible ou de la nourriture, ou **paie** un joueur pour pédaler sur ses machines, il paie avec sa **trésorerie**, c'est-à-dire des wotts qui existent déjà. Quand il **vend**, il remplit sa trésorerie.

> Conséquence : si les joueurs vendent beaucoup plus qu'ils n'achètent, la trésorerie du comptoir baisse, et ses prix d'achat baissent avec elle. Le comptoir ne peut pas devenir une planche à billets. D'où vient la trésorerie : §3.6.

> **Pourquoi seulement l'électricité ?** Un bon est un reçu d'énergie stockée dans une cellule (§3.3). Les Compteurs ne stockent que de l'électricité : ils ne peuvent émettre un bon que pour un Wh_é réellement entré dans une cellule. Le travail humain, qui va 60 fois plus vite que le monde (horloge d'action, Book 01 §2 bis), ne crée jamais de wotts : sinon, pédaler serait une planche à billets.

> **Le nom (validé, 2026-10-07).** La monnaie s'appelle le **wott**, pour ne pas la confondre avec le **watt** (W), l'unité de puissance que le jeu utilise aussi. Un wott vaut toujours 1 Wh_é au comptoir (§2).

### 3.2 Forme physique

Les wotts sont des **bons papier** tamponnés par les Compteurs, en coupures de **1, 5, 10, 50, 100 et 500 wotts**. Ils occupent un peu de place dans l'inventaire et **se pillent** comme n'importe quel objet.

Un joueur peut aussi avoir un **compte** dans un comptoir : il dépose ses bons et les retrouve dans n'importe quel autre comptoir du même réseau.

### 3.3 Le wott se décharge (validé)

**Tous les wotts se déchargent, où qu'ils soient : ≈ 2 % par semaine réelle** (une saison). C'est une inflation volontaire, exprimée en Wh, qui reflète la décharge naturelle des batteries.

#### L'explication dans l'univers : le papier ne se décharge pas, la batterie si

Un bon n'est pas de l'énergie : c'est un **reçu**. Il dit « les Compteurs gardent pour toi tant de Wh dans telle réserve ». Or ces réserves sont de vraies batteries, qui se déchargent toutes seules.

Chaque bon porte donc, imprimé et tamponné :

```
┌────────────────────────────────────────────────────┐
│  LES COMPTEURS · BON D'ÉNERGIE          100 WOTTS  │
│                                                    │
│  Réserve : Cellule 7 — Comptoir du Carrefour       │
│  Chargé le : Printemps, an 3                       │
│                                                    │
│  Remboursable selon le barème de décharge          │
│  affiché dans tout comptoir.                       │
└────────────────────────────────────────────────────┘
```

- La **cellule** est la batterie de réserve où l'énergie a été stockée au moment du dépôt.
- La **date de charge** indique depuis combien de temps l'énergie y attend.
- Le **barème de décharge**, affiché dans chaque comptoir, dit combien vaut aujourd'hui un bon selon son âge. Les Compteurs ne remboursent que l'énergie **qui reste réellement** dans la cellule.

> Dans le langage des joueurs et des PNJ : un bon récent est un **wott frais**, un vieux bon est un **wott plat**. « Il m'a payé en wotts plats » veut dire qu'on s'est fait avoir.

#### Ce que ça change en jeu

- **L'unité de compte reste le wott**, c'est-à-dire 1 Wh_é **aujourd'hui**. Tous les prix sont affichés dans cette unité.
- Le joueur ne gère pas une pile de bons de dates différentes : l'interface affiche directement la **valeur actuelle** de ce qu'il possède, qui baisse lentement. Les séries et les dates n'existent que dans le décor (on peut les voir en examinant un bon).
- Échanger de vieux bons au comptoir contre des **bons frais** est possible, mais ne fait rien gagner : les Compteurs réémettent à la valeur actuelle.
- Le compte au comptoir devient un **service de sécurité** (contre le pillage), et non plus un endroit qui coûte plus cher que le coffre.

> **Inspiration historique :** les « monnaies fondantes » du début du XXᵉ siècle (comme celle de la ville de Wörgl en 1932) perdaient elles aussi de leur valeur avec le temps, pour pousser à les faire circuler. On aurait pu reprendre leur mécanisme (coller chaque mois un timbre payant sur le billet), mais il ajouterait une corvée au joueur. La décharge automatique donne le même effet sans geste à faire.

| Garder des wotts… | Risque de pillage | Décharge |
|---|---|---|
| En poche | **Oui**, hors de la base | ≈ 2 %/semaine |
| Dans le coffre de la base | Non | ≈ 2 %/semaine |
| Sur un compte au comptoir | Non | ≈ 2 %/semaine |

> **Effet voulu :** l'argent sert à **échanger**, pas à dormir. Pour conserver sa richesse longtemps, mieux vaut la transformer en **biens durables** (outils, installations, stocks de matériaux), ce qui est exactement le comportement réaliste d'une économie où l'énergie se perd.

### 3.4 Le dépôt d'énergie selon les saisons

Les comptoirs ont une **capacité de stockage limitée**. Le taux auquel ils acceptent l'énergie déposée varie donc selon leur remplissage et la saison :

| Situation | Taux de dépôt (wotts par Wh_é déposé) |
|---|---|
| Hiver, comptoir peu rempli | **1,0** |
| Printemps, automne | ≈ 0,85 |
| Été, surplus solaire, comptoir plein | ≈ 0,6 |

**Le retrait reste toujours à 1 Wh_é par wott** (tant que le comptoir a de l'énergie en réserve). La différence entre dépôt et retrait reflète la **capacité de stockage limitée** des cellules et le surplus saisonnier : l'été, les Compteurs ne savent plus où mettre l'énergie. L'autodécharge, elle, est déjà portée par la décharge des bons (§3.3).

> C'est le **marché saisonnier de l'énergie** : l'été, les Voltaïques et les Mécanistes à roue hydraulique produisent beaucoup et gagnent moins par Wh ; l'hiver, l'électricité devient précieuse. Stocker de l'énergie en été pour la revendre en hiver est un vrai métier (et demande des batteries, qui sont un stock rare).

### 3.5 D'où vient l'électricité déposée (validé)

Chaque famille produit son électricité chez elle, à sa façon, puis la **porte** au comptoir (Book 01 §2 bis) :

| Famille | Production | Contrainte |
|---|---|---|
| 🔥 Charbonniers | Machine à vapeur + alternateur (palier III) | Remplir la trémie de combustible |
| ⚡ Voltaïques | Panneaux solaires, petite éolienne | Attendre le jour et la belle saison |
| ⚙️ Mécanistes | Roue hydraulique, moulin à vent ou manège + alternateur, pédalier à dynamo | Réparer l'usure, nourrir les animaux |

- **La production suit le calendrier** et sert d'abord aux machines de la base. Seul le surplus stocké en **batteries** peut être déposé.
- **Le poids limite le dépôt :** ≈ 1,3 kWh par trajet avec des batteries au plomb (≈ 20 Wh/kg), ≈ 10 kWh avec du lithium (≈ 150 Wh/kg), rare et impossible à fabriquer. Les batteries s'usent à chaque cycle.
- **La neutralité se règle sur la puissance installée** et sur les batteries, pas sur le temps passé à jouer. Elle est suivie par un indicateur (§7.2).

> Le lithium devient l'objet le plus convoité du transport d'énergie, et **porteur d'énergie** un métier (§8).

### 3.6 La trésorerie des comptoirs (validé, à calibrer en test)

| Élément | Règle |
|---|---|
| **Dotation de départ** | Au début du cycle, les cellules des Compteurs contiennent déjà l'énergie des derniers grands stocks de l'ancien monde (Book 01 §6). Elle forme la trésorerie de départ : ce n'est pas de la création à partir de rien, c'est un vestige, comme les ruines. Ordre de grandeur : **≈ 5 000 wotts par joueur attendu**, répartis entre le Grand Comptoir (≈ 50 %), les comptoirs régionaux (≈ 30 %) et le Carrefour (≈ 20 %). |
| **Nouveau joueur** | Chaque arrivée ajoute une dotation (≈ 1 000 wotts, au Carrefour) : la trésorerie suit la population. |
| **Remplissage** | Les ventes du comptoir (sa marge, §4.2) et **la moitié** des frais et des services (§4.4, §5). L'autre moitié est détruite. |
| **Réserve plancher** | Une part de la trésorerie est mise de côté pour garantir le prix plancher (§4.3). |
| **Trésorerie basse** | Quand elle descend jusqu'à la réserve plancher, le comptoir n'achète plus que les ressources de base, au prix plancher, avec un **quota par joueur et par jour**. Si la réserve elle-même s'épuise, le plancher est suspendu : cela ne devrait jamais arriver, et c'est suivi (§7.2). |

> Toutes ces valeurs sont des points de départ : elles se régleront pendant les tests, en surveillant la trésorerie et la masse de wotts.

---

## 4. Les comptoirs

### 4.1 Sur la carte

Chaque serveur compte plusieurs comptoirs, placés à des distances différentes du centre (où se trouve le terrain de chaque joueur, Book 01 §2 bis) :

| Comptoir | Distance | Taille | Particularité |
|---|---|---|---|
| **Comptoir du Carrefour** | Proche | Petit | Accessible dès la première heure. Fourchette plus large, stocks limités. |
| **Comptoirs régionaux** (2 ou 3) | Moyenne | Moyens | Spécialités locales (un comptoir près des forêts achète mieux le bois, un autre près d'une ville vend plus de composants) |
| **Grand Comptoir** | Lointain (haltes obligatoires) | Grand | Meilleurs prix, plus grand choix, carnet d'ordres le plus actif |

Chaque comptoir a **son propre cours** pour chaque bien, d'où des écarts de prix entre comptoirs, et donc un métier de **caravanier**.

### 4.2 La fourchette

Le comptoir PNJ achète et vend **toujours**, mais avec une marge :

```
prix de vente du comptoir = cours × (1 + marge)
prix d'achat du comptoir  = cours × (1 − marge)
marge : ≈ 10 % (Grand Comptoir) à ≈ 20 % (Comptoir du Carrefour)
```

> Commercer directement entre joueurs est donc toujours plus avantageux que de passer par le comptoir. Le comptoir sert de **filet de sécurité**, pas de marché principal.

### 4.3 Prix plancher des ressources de base

Pour qu'un nouveau joueur puisse toujours gagner ses premiers wotts, chaque comptoir **rachète toujours** les ressources de base (bois sec, pierre, fibres, eau potable, nourriture simple) à **au moins 0,5× leur prix de base**, même si leur cours est au plus bas. Cette garantie est financée par la **réserve plancher** de la trésorerie, avec un quota par joueur et par jour quand la trésorerie est basse (§3.6).

### 4.4 Services des comptoirs

| Service | Prix indicatif | Intérêt |
|---|---|---|
| **Compte** (dépôt et retrait de bons) | Gratuit | Sécurité contre le pillage |
| **Transport sécurisé** entre deux comptoirs | ≈ 5 à 10 % de la valeur transportée | Évite le risque des haltes. Moitié détruite, moitié à la trésorerie (§3.6). |
| **Recharge de batteries** | 1 wott par Wh_é | Retrait d'énergie |
| **Soins** (PNJ soignant) | Selon les soins | Book 05 §8.5 |
| **Apprentissage de recettes** | Selon le savoir | Book 03 §5.4 |
| **Identification** d'objets inconnus | Faible | Book 03 §6 |
| **Réparation** | ≈ 40 % de l'énergie grise | Plus cher qu'un artisan joueur |

---

## 5. Les façons d'échanger

| Mode | Où | Comment | Risque |
|---|---|---|---|
| **Troc et vente directe** | Partout où deux joueurs se croisent (terrain d'un ami, comptoir, halte…) | Fenêtre d'échange sécurisée : les deux valident (Book 01 §6 bis) | Être attaqué **après** l'échange, hors des zones protégées |
| **Comptoir PNJ** | Comptoir | Achat et vente immédiats, avec la fourchette | Le trajet aller et retour |
| **Carnet d'ordres** | Comptoir | Le joueur **dépose** ses biens au comptoir avec un prix de vente, ou dépose des wotts avec un prix d'achat. L'échange se fait même s'il est **hors ligne**. Le bien se récupère **dans ce comptoir**. | Le trajet pour déposer et récupérer |
| **Commande artisanale** | Comptoir | Un joueur commande un objet précis (« lame ★★★★, 250 wotts »). Les wotts sont **bloqués au comptoir** jusqu'à la livraison. Un artisan accepte, fabrique, livre au comptoir, et il est payé. | Aucun pour l'argent (bloqué). Délai. |
| **Services entre joueurs** | Partout | Escorte, enseignement, soins, identification, transport. Paiement direct ou par commande au comptoir. | Confiance |

**Frais :** le carnet d'ordres et les commandes coûtent ≈ **3 %** de la transaction, payés au comptoir. La moitié est détruite (un puits de wotts discret), l'autre moitié va à la trésorerie (§3.6).

> **La commande artisanale** remplace le besoin d'un système de réputation : l'argent est bloqué par un tiers neutre, donc personne n'a besoin de faire confiance à personne. Et la **marque du fabricant** (Book 02 §13) permet aux bons artisans de se faire un nom.

---

## 6. La formation des prix

### 6.1 Ce qui fait bouger un cours

| Facteur | Effet |
|---|---|
| **Population des familles** | Une famille nombreuse fait baisser les prix de ce qu'elle produit et monter ceux de ce qu'elle achète |
| **Saison** | L'énergie électrique est chère l'hiver, bon marché l'été. Le bois et la nourriture conservée montent l'hiver. |
| **Épuisement des stocks** | À mesure que les ruines se vident, les vestiges montent (§9) |
| **Événements** | Migration de zombies sur une route : le transport devient risqué, les écarts entre comptoirs se creusent |
| **Distance** | Chaque comptoir a son cours ; l'écart est limité par le coût du transport |

### 6.2 L'information est une richesse

- Le **tableau des cours** n'est visible que **dans le comptoir où l'on se trouve**, avec l'historique des 7 derniers jours.
- Connaître les prix des autres comptoirs demande d'y aller… ou d'avoir une **radio** (⚡, Book 01 §4).

> Les Voltaïques, maîtres de la radio, ont un **avantage d'information** : ils savent où vendre et où acheter. C'est un atout économique propre à leur famille, qu'ils peuvent aussi vendre (bulletins de prix).

---

## 7. Les flux de monnaie

### 7.1 Sources et puits

| Sources (création de wotts) | Puits (destruction de wotts) |
|---|---|
| Dépôt de Wh_é au comptoir | Retrait d'énergie au comptoir |
| **Achat de Wh en argent réel** (phase 1, plafonné, Book 08 §4.2) | |
| **Dotation des comptoirs** : au début du cycle, puis à chaque nouveau joueur (§3.6) | |
| | Décharge des bons (≈ 2 %/semaine) |
| | Frais du carnet d'ordres et des commandes (≈ 3 %) : la moitié |
| | Services PNJ (transport, soins, apprentissage, réparation) : la moitié |
| | Bons perdus (pillés puis jamais utilisés, abandonnés au sol) |

**Ce qui ne crée ni ne détruit de wotts :** les échanges entre joueurs, et les achats et ventes du comptoir (qui passent par sa trésorerie).

### 7.2 Indicateurs suivis par l'équipe

| Indicateur | Cible |
|---|---|
| **Masse de wotts** (en circulation + comptes) **par joueur actif** | Stable dans le temps |
| **Trésorerie des comptoirs** | Ni vide (le comptoir n'achète plus), ni pleine (les prix d'achat sont trop généreux) |
| **Réserve plancher** | Jamais épuisée. Nombre de jours où le quota plancher s'applique : faible. |
| **Cours des biens clés** (charbon, Wh_é, lame, pain, antibiotiques) | Dans les bornes, sans oscillation forte |
| **Répartition des familles** | Aucune famille au-dessus de ≈ 45 % |
| **Part des wotts créés par famille** (dépôts de Wh_é) | Proche de la part de chaque famille dans la population : aucune ne doit « imprimer » mieux que les autres (Book 01 §6) |
| **Richesse des 10 % les plus riches** | Ne s'envole pas par rapport à la médiane |
| **Temps pour gagner ses 100 premiers wotts nets** (nouveau joueur, trajet et nourriture déduits) | ≈ 10 à 15 min réelles |

---

## 8. Les rôles économiques

Ils ne sont pas des classes : ils **émergent** de ce que font les joueurs.

| Rôle | Ce qu'il fait | Famille souvent concernée |
|---|---|---|
| **Fouilleur** | Ramène des vestiges des ruines | ⚡ (œil de récupérateur), mais tous |
| **Artisan** | Fabrique et répare, prend des commandes | 🔥 (lames, outils), ⚙️ (bois, cordes) |
| **Fermier** | Produit la nourriture, l'huile, les fibres | ⚙️ |
| **Énergéticien** | Produit et stocke l'électricité, l'achète l'été, la revend l'hiver | ⚡ surtout, mais aussi ⚙️ (roue) et 🔥 (vapeur) |
| **Fondeur, distillateur** | Filières lourdes : fer, acier, alcool (Book 04) | 🔥 |
| **Caravanier** | Transporte entre comptoirs, profite des écarts de prix | ⚙️ (vélo-cargo, charrette) |
| **Porteur d'énergie** | Transporte des batteries chargées jusqu'au comptoir, surtout avec du lithium (§3.5) | Tous |
| **Soignant** | Soigne contre paiement (Book 05) | Tous, avec le savoir |
| **Enseignant** | Vend son savoir | Tous les anciens |
| **Escorte** | Protège les caravanes dans les haltes | Combattants |
| **Pillard** | Vit du pillage des autres | Le risque qui rend les autres rôles nécessaires |

---

## 9. La transition : de la récupération à la production

Les vestiges sont un stock qui s'épuise (Book 01 §2 bis). L'économie doit accompagner ce lent basculement.

| Moment du cycle de 2 mois (Book 09) | Économie dominante | Ce qui est cher |
|---|---|---|
| **Semaines 1 à 2** | Récupération : les ruines regorgent de ferraille, de batteries, de médicaments | Le savoir, les installations, la nourriture |
| **Semaines 3 à 5** | Mixte : les vestiges proches s'épuisent, on va plus loin, on commence à produire | Les vestiges rares (électronique, antibiotiques), le transport |
| **Semaines 6 à 8** | Production : bas fourneau, distillation, cultures, énergie renouvelable | Tout ce qui ne se fabrique pas (électronique, antibiotiques, batteries) |

> La transition se fait **toute seule par les cours** : quand la ferraille se raréfie, son prix monte, jusqu'à ce que produire du fer devienne rentable (Book 04 §1). Il faut simuler **quand** chaque bascule arrive, pour qu'elle ne soit ni trop rapide (le jeu devient vite dur), ni jamais atteinte.

---

## 10. Les nouveaux joueurs

| Besoin | Réponse |
|---|---|
| Gagner ses premiers wotts | Prix plancher des ressources de base (§4.3), pédalage au comptoir, petites quêtes de PNJ |
| Ne pas être écrasé par les anciens | Décharge des wotts (§3.3) : pas de fortunes dormantes |
| Avoir de quoi vendre | Les ruines **proches** se régénèrent (Book 01 §2 bis) : il y a toujours des petits vestiges à revendre |
| Trouver des acheteurs | Les anciens ont besoin de main-d'œuvre et de matières premières : bois, fibres, minerai, nourriture |
| Apprendre | Les anciens gagnent à **enseigner** (rayonnement, Book 03 §5.4), et les nouveaux à apprendre |

---

## 11. Abus et garde-fous

| Risque | Garde-fou |
|---|---|
| **Manipulation des cours** (acheter tout un stock pour faire monter un prix) | Période glissante de 7 jours, bornes 0,5×–2×, limite de quantité par ordre |
| **Comptes multiples** (un joueur qui se transfère des biens d'un compte à l'autre) | Échanges limités pour les comptes très récents, surveillance des transferts à sens unique |
| **Robots** (farm automatique de ressources) | Prix plancher bas, rendements décroissants sur une même ressource dans une même session |
| **Thésaurisation** | Décharge des wotts (§3.3) |
| **Planche à billets par le travail** (pédaler pour créer des wotts) | Seul le Wh_é crée des wotts. Le pédalage au comptoir est payé sur la trésorerie (§3.1). |
| **Rente d'énergie hors ligne** | Production au calendrier, consommée d'abord par la base, surplus limité aux batteries et à leur poids (§3.5) |
| **Monopole** (un groupe qui contrôle une filière) | Comptoirs PNJ toujours présents comme alternative, même chère |
| **Arnaque** | Fenêtre d'échange sécurisée, commandes avec wotts bloqués au comptoir |

---

## 12. Simulation avant le playtest

L'économie doit être **simulée** avant d'être jouée. Un modèle simple, avec des joueurs virtuels de chaque famille et de chaque profil (Book 01 §7.3), permet de vérifier :

1. que la masse de wotts reste stable quand le nombre de joueurs change ;
2. que les cours restent dans leurs bornes sans osciller ;
3. qu'une famille surreprésentée (60 %) devient bien moins rentable, et une famille sous-représentée plus rentable ;
4. que les boucles de production ne créent pas de wotts à partir de rien (Book 02 §15) ;
5. à quel moment les bascules de la récupération vers la production arrivent (§9) ;
6. qu'un nouveau joueur gagne ses 100 premiers wotts nets (trajet et nourriture déduits) en ≈ 10 à 15 min réelles.

---

## 13. Questions ouvertes

- [x] **Décharge universelle des wotts** (§3.3) : ✅ validée, partout (poche, coffre, compte), avec son explication dans l'univers (cellules de réserve, wotts frais et wotts plats).
- [x] **Trésorerie des comptoirs :** ✅ dotation de départ, dotation par nouveau joueur, réserve plancher (§3.6). Valeurs à régler en test.
- [x] **Création des wotts :** ✅ seul le Wh_é déposé crée des wotts. Chaque famille produit le sien à sa façon, et le poids des batteries limite le dépôt (§3.1, §3.5).
- [ ] **Nombre de comptoirs** et leurs spécialités régionales.
- [ ] **Taux de dépôt saisonnier** de l'énergie (§3.4) : valider les valeurs.
- [ ] **Carnet d'ordres et commandes :** frais de 3 %, à valider.
- [ ] **Bulletins de prix par radio :** un objet vendable (⚡) ?
- [ ] **Quêtes de PNJ rémunérées :** elles paient avec la trésorerie du comptoir (donc sans créer de wotts). Quelle place leur donner ?

---

## Glossaire

- **Trésorerie** : wotts que possède un comptoir. Il paie ses achats avec, et la remplit par ses ventes.
- **Fourchette** : écart entre le prix auquel le comptoir vend et celui auquel il achète.
- **Carnet d'ordres** : liste des offres d'achat et de vente déposées par les joueurs dans un comptoir.
- **Commande artisanale** : commande d'un objet précis, avec paiement bloqué au comptoir jusqu'à la livraison.
- **Décharge** : perte de valeur progressive d'un bon d'énergie (≈ 2 % par semaine), qui reflète la décharge réelle de la cellule de réserve.
- **Cellule de réserve** : batterie des Compteurs où l'énergie d'un bon est stockée.
- **Wott frais, wott plat** : bon récent, vieux bon déchargé (argot).
- **Taux de dépôt** : nombre de wotts reçus par Wh_é déposé, selon la saison et le remplissage du comptoir.
- **Prix plancher** : prix minimum auquel un comptoir rachète toujours les ressources de base.
