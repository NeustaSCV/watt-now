# Book 26 — Les déchets de l'Abondance

> Document de conception · version 0.1 · 2026-10-09
> Statut : **décisions du porteur prises (2026-10-09), construit en 0.7** : serveur, catalogue, icônes et **rendu au sol en amas** (§9, après l'essai sur l'iPhone du porteur).
> Demande du porteur : « Il va falloir créer de nouveaux objets dans le monde en cohérence avec les nouveaux crafts. Il faut rajouter beaucoup d'objets différents et il va falloir faire en sorte qu'il y en ait partout. Nous sortons d'un monde d'abondance, il doit y avoir des déchets partout. La grande majorité sans valeur. »
> Né de deux brouillons de travail : la proposition « objets et déchets » (vestiges, lot 2) et son chiffrage graphique. S'appuie sur les books [01](01-les-trois-feux.md) §6 (valeur), [02](02-crafting.md) §5 (vestiges, lot 1), [05](05-sante-et-soins.md) §4 (la conserve bombée), [12](12-portage-vetements-protections.md) (poids), [15](15-univers.md) §1 et §4 (ton, ni marque ni personne réelle), [17](17-architecture-technique.md) §4 et §5 (calcul à la demande, Pi 4), [18](18-direction-artistique.md) §2, [21](21-perimetre-phase-0.md) §5.3 (palette, budgets) et [25](25-le-metier-des-familles.md) §2.5 (la règle d'or).

---

## 1. Le principe

### 1.1 Tout ce qu'on voit au sol se ramasse

Avant la 0.7, le monde n'avait qu'une poignée de points de fouille (8 à la halte, 13 à la Coopérative, 6 dans la ruine du terrain) ; entre eux, le sol était propre comme un parc. Or l'Âge de l'Abondance a tout jeté, tout le temps, et personne n'a ramassé depuis la Grande Panne.

La 0.7 ajoute **une couche de déchets** à tous les lieux, faite de deux sortes d'**emplacements** :

| Emplacement | Ce que c'est | Ce qu'on fait |
|---|---|---|
| **Un amas au sol** | 1 à 4 objets du catalogue serrés autour d'un point | On **ramasse** chaque objet (1 s) |
| **Un conteneur** | Sac-poubelle crevé, poubelle renversée, coffre de voiture | On le **fouille** (4 à 8 s) et l'on **choisit** dans la liste ce qu'on prend |

**Décision du porteur (2026-10-09)** : *tout ce qu'on voit au sol se ramasse*. « Au bout de 3 consécutifs qui ne se ramassent pas, le joueur va abandonner. » Il n'y a donc **pas de décor de déchets non interactif** : chaque pièce d'un amas est un vrai objet du catalogue. Le décor terne et fondu, d'abord proposé, est abandonné.

### 1.2 La règle des trois tiers (inégaux)

Ce que rapporte la couche de déchets, en moyenne :

| Part | Sorte | Valeur | Exemple |
|---|---|---|---|
| **≈ 70 %** | **Ordure** : ne sert à rien ou presque | 0 à 2 wotts | Canette écrasée, gobelet, prospectus, flamant rose en plastique |
| **≈ 25 %** | **Petite trouvaille** : ne vaut presque rien, mais nourrit une recette | 3 à 14 wotts | Sac de canettes, tube de volants de badminton, lame de tondeuse |
| **≈ 5 %** | **Bonne trouvaille** : la pièce qu'on cherchait | 15 wotts et plus | Vélo en libre-service, ressort de suspension, onduleur |

Le tirage prend d'abord le palier (70 / 25 / 5), puis l'objet dans le palier : la part de chaque palier tient quelle que soit la taille du catalogue. C'est le ton de *Fallout* déjà choisi pour le lot 1 (Book 02 §5) : **tout se ramasse, presque rien ne vaut quelque chose**, et l'œil apprend à repérer le stylo dans le tas de prospectus.

### 1.3 Cohérence avec l'univers

- **Le ton du Book 15 §1** : l'absurde est dans les objets, jamais dans la survie. Les déchets racontent l'Abondance : le suremballage, les gadgets morts, les promesses imprimées.
- **Ni marque, ni personne réelle** : les noms sont inventés (« Boisson Énergie Totale », « VéloCité », « Agence Sérénité Patrimoine »), aucune référence politique.
- **Poids réalistes** (Book 12) : un pneu pèse 9 kg, un matelas 25 kg, un vélo en libre-service 22 kg. Le sac de 55 kg force toujours le choix.
- **Valeur** (Book 01 §6) : énergie grise, plafonnée. Une ordure vaut **0** et le Comptoir la refuse (§7).
- **Aucun composant nouveau** : chaque objet se démonte en composants ou matières **qui existent déjà** (petit ressort, plumes, chiffons, barre de métal…). Les recettes de la 0.6 restent telles quelles (décision Q5).

---

## 2. Ce que la couche apporte aux familles

### 2.1 Les manques comblés

Le relevé des recettes de la 0.6 (Book 25) montrait des ingrédients sans source dans le monde, ou une source unique partagée par tous les voyageurs de la halte. La couche de déchets les comble sans toucher aux recettes :

| # | Manque | Familles | Ce qui le comble (§3) |
|---|---|---|---|
| 1 | **Barre de métal** | 🔥 ⚡ ⚙️ | Piquet de clôture, panneau routier, chariot de supermarché, barbecue, parasol, vélo d'appartement, débroussailleuse |
| 2 | **Lame de ressort** | 🔥 ⚙️ | Ressort de suspension, ressort de porte de garage ; et des **lames ébréchées** : disque de scie, lame de tondeuse, couteau de cuisine |
| 3 | **Pièces de vélo** | ⚙️ | Vélo en libre-service, vélo d'enfant, vélo couché dans le fossé, épave de mobylette |
| 4 | **Appareil photo jetable** | ⚡ | Tiré bien plus souvent (route, parking, maisons) ; boîte d'appareils de mariage |
| 5 | **Petite batterie** | ⚡ | Onduleur de bureau, trottinette électrique (peu communs, décision Q6) |
| 6 | **Petit ressort** | ⚙️ ⚡ | Stylo rétractable, pinces à linge, agrafeuse, pot à crayons, matelas, parapluie, trampoline |
| 7 | **Plumes, os** | Tous | Oreiller, plumeau, volants de badminton, attrape-rêves ; carcasse de mouton |
| 8 | **Chiffons, bâche, ficelle, corde** | Tous | Vêtements, rideaux, tente, parasol, piscine gonflable, hamac, laisse à enrouleur |
| 9 | **Couteau** (la lance) | Tous | Le **couteau abîmé** existant entre dans les fouilles, **rare** (décision Q8) |
| 10 | **Pierre** (le terrain ne la repousse pas) | 🔥 | Tas de gravats |
| 11 | **Roulements** | ⚙️ | Planche à roulettes, trottinette électrique, machine à laver. **Retirés en 0.8** (I9) : la boîte de roulements est une clé du niveau 2 (§11 bis) |

### 2.2 Chaque famille trouve sa base seule

C'est la règle d'or du Book 25 §2.5 appliquée au monde : **chaque famille trouve sa base dans la couche de déchets ordinaire**, sans dépendre d'un seul point de fouille ni d'une autre famille.

- 🔥 **Charbonnier seul** : barres de métal (piquets, panneaux, chariots) → forge et lames au fer doux ★★ ; ressorts de suspension et lames de tondeuse → lames ★★★ et ★★★★.
- ⚡ **Voltaïque seul** : appareils jetables et onduleurs → matraques de fortune répétables ; gadgets des maisons → cellules ; stylos → alarmes.
- ⚙️ **Mécaniste seul** : vélos en libre-service et vélos d'enfant → pédalier **et** brouette ; stylos et pinces à linge → noix et détentes ; oreillers → empennage.

Les **bonnes trouvailles** restent ciblées par type de lieu (§4.1) : la casse et la station pour 🔥, les maisons et les bureaux pour ⚡, les cours de ferme et les jardins pour ⚙️. Cela pousse à **échanger** ce qu'on trouve et qui sert aux autres : un Charbonnier ramasse le stylo pour le Mécaniste.

---

## 3. Le catalogue

### 3.1 Les conventions

- **91 objets du sac**, et le **trampoline éventré**, qui ne se porte pas : il se démonte sur place (§3.3). Fichier : `code/commun/src/vestiges-lot2.ts`.
- **Trois familles de vestiges nouvelles** (décision Q1) : **déchet** (emballages et ordures), **textile** (vêtements, linge), **loisir** (sport, jouets, jardin d'agrément). Les huit familles du lot 1 restent ; certains objets nouveaux y sont rangés (un radiateur est du salon, un ressort de suspension du garage).
- **Rareté** : C commun, P peu commun, R rare, comme le lot 1. Aucun légendaire.
- **Valeur** en wotts : **0 = ordure**. Dans le code : **55 ordures** (0 à 2 wotts), **23 petites trouvailles**, **13 bonnes**.
- **Lieux** : R route et bas-côtés, P parking et station, V village et maisons, F cour de ferme, J jardin, C champ et prairie, B bois et lisière, D décharge, I intérieur (boutique, bureaux), A atelier et casse. « (conteneurs) » : un objet de moins de 10 cm, qu'on ne trouve qu'en fouillant (§6.2).
- **Démontage** : outil entre parenthèses (V Visser 1, C Couper 1, M Marteler 1, S Serrer 1 ; « M 2 » : Marteler 2). « — » : ne se démonte pas.
- **Décisions de catalogue** : petite batterie **peu commune** (Q6) ; sac de charbon de barbecue **peu commun**, à la station et dans les jardins seulement (Q7 : le coup de pouce du premier jour, pas une filière) ; couteau abîmé **rare** (Q8) ; **conserve bombée** oui (Q9 : mangée, elle rend malade, Book 05 §4) ; ressorts de suspension et lames de tondeuse donnent des **matières existantes** (Q5).

### 3.2 Les objets, par famille

Tiré du code (0.7). Les descriptions, dans le ton du Book 15, sont dans le fichier ; deux exemples : la canette « Boisson Énergie Totale, zéro sucre, zéro tout » ; le vélo en libre-service « VéloCité, 30 premières minutes offertes. Le compteur tourne depuis des années ».

#### Emballages et ordures, famille déchet (28)

| Objet | kg | W | Rar. | Lieux | Démontage |
|---|---|---|---|---|---|
| canette écrasée | 0,015 | 0 | C | partout | — |
| sac de canettes | 0,5 | 4 | P | P, V, D | chute d'aluminium 2 (M) |
| bouteille d'eau vide | 0,03 | 0 | C | partout | — |
| sac plastique | 0,01 | 0 | C | partout | — |
| barquette en polystyrène | 0,01 | 0 | C | R, V, D | — |
| gobelet de café à emporter | 0,012 | 0 | C | P, V, I | — |
| boîte de capsules usagées | 0,15 | 1 | C | V, I | — |
| paquet de chips vide | 0,005 | 0 | C | partout | — |
| brique de lait vide | 0,03 | 0 | C | V, D | — |
| boîte à pizza grasse | 0,15 | 0 | C | V, D | — |
| emballage « impossible à ouvrir » | 0,05 | 0 | C | I, D | — |
| liasse de prospectus | 0,2 | 1 | C | R, V, P | liasse de papier 2 |
| carton de livraison aplati | 0,4 | 0 | C | partout | liasse de papier 3 |
| rouleau de tickets de caisse | 0,05 | 0 | C | P, I (conteneurs) | liasse de papier 1 |
| magazine « Spécial Bien-être » | 0,3 | 0 | C | V, I | liasse de papier 2 |
| liasse de billets | 0,1 | 0 | C | V, P, I | liasse de papier 1 |
| carte bancaire « Platine Infinie » | 0,005 | 0 | C | V, I, R (conteneurs) | — |
| paquet de cartes de fidélité | 0,1 | 0 | C | V, P (conteneurs) | — |
| bouteille en verre vide | 0,45 | 0 | C | partout | morceau de verre 1 (M) |
| briquet jetable vide | 0,02 | 1 | C | R, P, V (conteneurs) | — |
| conserve bombée | 0,45 | 0 | C | V, I, D | boîte de conserve vide 1 (C) |
| bidon de lave-glace vide | 0,2 | 0 | C | P, R | morceau de plastique 1 |
| pot de peinture séché | 3 | 0 | C | A, V, D | — |
| os en nylon pour chien | 0,1 | 0 | C | V, J | — |
| ballon « Joyeux 40 ans » dégonflé | 0,005 | 0 | C | V, D | — |
| cône de chantier | 1,5 | 0 | C | R, P | — |
| stylo rétractable | 0,01 | 0 | C | partout | petit ressort 1 |
| chariot de supermarché | 18 | 5 | C | R, P, D | barre de métal 3, bande de caoutchouc 2 (S) |

#### Textile (11)

| Objet | kg | W | Rar. | Lieux | Démontage |
|---|---|---|---|---|---|
| t-shirt publicitaire | 0,15 | 1 | C | partout | chiffon 1 (C) |
| jean troué | 0,6 | 1 | C | V, D | chiffon 2 (C) |
| basket lumineuse dépareillée | 0,4 | 1 | C | R, V | bande de caoutchouc 1, LED 1, pile usagée 1 (C) |
| doudoune sans manches | 0,4 | 3 | C | V, D | chiffon 1 (C) |
| rideau occultant | 1,2 | 2 | C | V | chiffon 3 (C) |
| oreiller en plumes | 0,9 | 2 | C | V, D, R, F | poignée de plumes 3, chiffon 1 (C) |
| matelas à ressorts | 25 | 2 | P | V, D, R | petit ressort 6, rouleau de fil de fer 1, chiffon 3 (C) |
| couverture de survie | 0,06 | 4 | P | P, R | — |
| sac de cintres en fil de fer | 1,5 | 2 | C | V, I | rouleau de fil de fer 1 (C) |
| parapluie retourné | 0,4 | 1 | C | R, V | petit ressort 1, chiffon 1 (C) |
| poignée de pinces à linge | 0,15 | 1 | C | V, J (conteneurs) | petit ressort 2 |

#### Loisir, sport et jardin (22)

| Objet | kg | W | Rar. | Lieux | Démontage |
|---|---|---|---|---|---|
| tapis de yoga | 1 | 2 | C | V | bande de caoutchouc 3 (C) |
| tube de volants de badminton | 0,06 | 4 | C | V, J, I, P | poignée de plumes 3 |
| plumeau | 0,15 | 2 | C | V, I, F | poignée de plumes 1, branche 1 |
| attrape-rêves « Énergie positive » | 0,05 | 1 | C | V, P, R | poignée de plumes 1, ficelle 1 |
| hamac de jardin | 2 | 4 | C | J | rouleau de corde 2 (C) |
| tente « montée en 2 secondes » | 3 | 6 | C | J, B, R | bâche 1, ficelle 2 (C) |
| piscine gonflable crevée | 4 | 2 | C | J | bâche 1 (C) |
| parasol de terrasse | 8 | 3 | P | J, V, P | barre de métal 1, bâche 1 (S) |
| barbecue rouillé | 9 | 4 | C | J, V | barre de métal 1 (S) |
| sac de charbon de barbecue entamé | 2 | 120 | P | P, J | kilo de charbon de bois 2 |
| flamant rose en plastique | 0,6 | 0 | C | J | morceau de plastique 2 |
| balise solaire de jardin | 0,2 | 3 | C | J, V | LED 1, pile usagée 1, morceau de plastique 1 |
| ballon de foot crevé | 0,4 | 0 | C | J, C, V | bande de caoutchouc 1 (C) |
| peluche qui parle | 0,4 | 1 | C | V | pile usagée 2, chiffon 1 (C) |
| toupie à main | 0,05 | 1 | C | partout (conteneurs) | — |
| planche à roulettes | 2,5 | 15 | P | V, R | chute d'aluminium 2, branche 2 (S) ; plus de roulements en 0.8 |
| trottinette d'enfant | 3 | 4 | C | V, R | chute d'aluminium 4, bande de caoutchouc 1 (S) |
| laisse à enrouleur | 0,3 | 2 | C | V, R | ficelle 2, petit ressort 1, morceau de plastique 1 (V) |
| vélo en libre-service | 22 | 45 | P | R, P, V | cadre de vélo 1, chaîne de vélo 1, roue de vélo 2, dynamo de vélo 1 (S, V) |
| vélo d'enfant | 8 | 10 | C | V, J | chaîne de vélo 1, roue de vélo 1, barre de métal 1 (S) |
| vélo d'appartement connecté | 35 | 20 | P | V, I | barre de métal 3, aimant 4, petit moteur 1, morceau de plastique 4 (S) |
| trottinette électrique | 14 | 60 | P | R, V, P | petite batterie 1, petit moteur 1, aimant 4 (V, S) ; plus de roulements en 0.8 |

#### Maison, famille salon (6)

| Objet | kg | W | Rar. | Lieux | Démontage |
|---|---|---|---|---|---|
| pot à crayons plein | 0,3 | 1 | C | I, V | petit ressort 4, morceau de plastique 1 |
| agrafeuse | 0,25 | 1 | C | I | petit ressort 1 (V) |
| radiateur électrique « design » | 10 | 5 | C | V, I | résistance chauffante 2, chute d'aluminium 4, bobine de fil de cuivre 1 (V) |
| bougie parfumée « Cocooning d'automne » | 0,35 | 3 | C | V, I | — |
| livre « Devenez la meilleure version de vous-même » | 0,4 | 0 | C | V, I | liasse de papier 3 |
| boîte d'appareils jetables « Notre plus beau jour » | 1 | 20 | P | V, I | appareil photo jetable 5 |

#### Gadgets (9)

| Objet | kg | W | Rar. | Lieux | Démontage |
|---|---|---|---|---|---|
| chargeur sans fil | 0,1 | 1 | C | V, I | bobine de fil de cuivre 1 (V) |
| écouteur sans fil, le gauche | 0,005 | 0 | C | partout (conteneurs) | — |
| perche à selfie | 0,25 | 1 | C | R, V | chute d'aluminium 1 |
| casque de réalité virtuelle | 0,6 | 6 | C | V, I | morceau de verre 1, cellule lithium 1, morceau de plastique 1 (V) |
| box internet | 0,5 | 2 | C | V, I | LED 4, morceau de plastique 2 (V) |
| imprimante à jet d'encre | 5 | 3 | C | I, V, D | petit moteur 2, petit ressort 2, morceau de plastique 5 (V) |
| caméra de surveillance « intelligente » | 0,5 | 4 | C | V, P, I | LED 6, petit moteur 1, morceau de verre 1 (V) |
| fontaine à eau connectée pour chat | 1 | 2 | C | V | petit moteur 1, morceau de plastique 2 (V) |
| onduleur de bureau | 6 | 30 | P | I, V, P | petite batterie 1, bobine de fil de cuivre 2, morceau de plastique 2 (V) |

#### Atelier et casse, famille garage (5)

| Objet | kg | W | Rar. | Lieux | Démontage |
|---|---|---|---|---|---|
| morceau de tuyau de cuivre | 1 | 15 | C | V, A | bobine de fil de cuivre 3 (C) |
| jerrican percé (« jerrican vide » avant la 0.8) | 1 | 3 | C | P, R, F | morceau de plastique 2 (C) |
| ressort de porte de garage | 4 | 40 | P | V, A | lame de ressort 2 (M 2) |
| disque de scie émoussé | 0,6 | 12 | C | A, V | lame ébréchée 2 (M) |
| fût métallique de 200 L | 18 | 15 | P | F, A, P | — |

#### Cuisine (2)

| Objet | kg | W | Rar. | Lieux | Démontage |
|---|---|---|---|---|---|
| livre « Cuisiner sans cuisiner » | 0,5 | 0 | C | V | liasse de papier 4 |
| couteau de cuisine émoussé | 0,15 | 6 | C | V, D | lame ébréchée 1 |

#### Route et voiture (4)

| Objet | kg | W | Rar. | Lieux | Démontage |
|---|---|---|---|---|---|
| pneu usé | 9 | 1 | C | R, P, A, D | bande de caoutchouc 8 (C) |
| plaque d'immatriculation | 0,5 | 1 | C | R, P, A | chute d'aluminium 2 |
| panneau routier tordu | 6 | 3 | C | R | chute d'aluminium 4, barre de métal 1 (S) |
| ressort de suspension | 2,5 | 45 | P | A, R | lame de ressort 2 (M 2) |

#### Ferme et jardin (4)

| Objet | kg | W | Rar. | Lieux | Démontage |
|---|---|---|---|---|---|
| piquet de clôture tordu | 2,2 | 3 | C | C, F, R | barre de métal 1 (M) |
| lame de tondeuse | 0,9 | 12 | C | J, F, A | lame ébréchée 2 (M) |
| robot tondeuse | 10 | 25 | C | J | lame ébréchée 1, petit moteur 2, cellule lithium 4, morceau de plastique 4 (V) |
| débroussailleuse | 7 | 20 | P | F, J, A | barre de métal 1, morceau de plastique 2 (S) ; plus de bobine en 0.8 |

### 3.3 Les points du monde (pas des objets du sac)

Comme le vélo de la ruine : ils ne se portent pas, ils se **fouillent**, se **démontent sur place** ou se **ramassent** d'un geste. Fichier : `POINTS_DECHETS`, `code/commun/src/dechets.ts`.

| Point | Geste (durée) | Ce qu'il donne | Outil | Où (0.7) | Retour |
|---|---|---|---|---|---|
| **Sac-poubelle crevé** | Fouiller (5 s), liste au choix | 1 à 3 tirages, surtout des ordures, un peu de textile et de cuisine | — | Conteneur des amas, partout | Avec son carreau (§5.3) |
| **Poubelle renversée** | Fouiller (6 s) | 1 à 3 tirages, plus de cuisine | — | Conteneur des amas, au village et au parking | Avec son carreau |
| **Coffre de voiture** | Fouiller (5 s) | 1 à 2 tirages « voiture » et « textile » | — | Les deux épaves de la halte (un second geste) | 8 à 24 h |
| **Tas de gravats** | Fouiller (8 s) | 2 pierres, et une fois sur trois un déchet | Un outil Creuser (bâton à fouir) va **deux fois plus vite** | Halte, Coopérative | 3 jours |
| **Carcasse de mouton** | Prendre les os (4 s) | 6 os | — | Halte, Coopérative | 3 jours |
| **Vélo couché dans le fossé** | Démonter (45 s) | Cadre, chaîne, 2 roues, dynamo | Serrer 1, Visser 1 | Halte | 7 jours, ailleurs |
| **Épave de mobylette** | Démonter (40 s) | 2 roues de vélo, chaîne, barre de métal (la bobine est grillée depuis la 0.8, I12) | Serrer 1, Visser 1 | Halte | 7 jours, ailleurs |
| **Trampoline éventré** | Démonter (60 s) | 12 petits ressorts, 3 barres de métal, 1 bâche | Serrer 1 | Halte | 7 jours, ailleurs |
| **Machine à laver** | Démonter (40 s) | 6 fils de cuivre, 6 pierres (le contrepoids) ; le roulement du tambour est mort depuis la 0.8 (I9) | Visser 1, Serrer 1 | Halte | 7 jours, ailleurs |
| **Frigo connecté** | Démonter (30 s) | 4 fils de cuivre, 2 chutes d'aluminium, 6 morceaux de plastique | Visser 1 | Halte | 7 jours, ailleurs |

- **Le terrain personnel n'a aucun point** (décision Q-G1 : rien qu'on ne puisse ramasser, rien de plus que ses 12 déchets et sa décharge). **Le Carrefour non plus** : les Compteurs veillent.
- La carcasse reste **sobre** (décision Q-G7) : des os blanchis et un peu de laine grise, ni chair ni sang.

---

## 4. La répartition : « il y en a partout »

### 4.1 Les types de lieu

Chaque lieu est découpé en **zones typées** (route, parking, jardin…). Le type fixe la densité, la part de conteneurs et les familles tirées. Ce sont des **réglages de départ, à caler au test familial** (décision Q3). Fichier : `PROFILS_DECHETS`, `code/commun/src/dechets.ts`.

| Type de lieu | Emplacements / 100 m² | Part de conteneurs | Familles tirées (poids) | Trouvailles mises en avant |
|---|---|---|---|---|
| **Route et bas-côtés** (4 m de part et d'autre) | 2 | 30 % | déchet 6, voiture 3, textile 2, loisir 1 | Vélo en libre-service, trottinette électrique, ressort de suspension, appareil jetable, oreiller |
| **Parking, station** | 3 | 40 % | déchet 6, voiture 3, gadget 1, garage 1 | Onduleur, trottinette, vélo, appareil jetable, sac de charbon |
| **Village, maisons** | 2,5 | 50 % | déchet 5, cuisine 2, salon 2, textile 2, gadget 2, loisir 2 | Appareils de mariage, trottinette électrique |
| **Intérieur** (boutique, bureaux) | 4 | 60 % | déchet 3, cuisine 2, salle de bain 2, salon 2, gadget 2 | Onduleur, appareils de mariage |
| **Jardin** | 1,5 | 40 % | loisir 5, déchet 3, ferme 2 | Débroussailleuse, sac de charbon |
| **Cour de ferme** | 1,5 | 40 % | ferme 5, déchet 3, garage 2 | Soc de charrue, fût de 200 L, oreiller |
| **Champ, prairie** | 0,2 | 10 % | déchet 4, ferme 3, loisir 1 | Piquet de clôture |
| **Bois** (lisière : 0,4) | 0,1 | 10 % | déchet 4, loisir 2, textile 1 | Tente, hamac |
| **Atelier, casse** | 3 | 60 % | garage 5, voiture 4, déchet 2 | Ressorts de suspension et de garage, disque de scie |
| **Décharge** | 15 | 80 % | toutes | Un peu de tout |
| **Carrefour du Comptoir** | 1 | 0 % | déchet seulement | Rien : que des ordures |

Le **poids de tirage** d'un objet est celui de sa famille dans le lieu × celui de sa rareté (C 10, P 4, R 1, comme le lot 1), multiplié pour les trouvailles mises en avant. Un objet du lot 2 n'est tiré que dans les types de lieu de sa fiche.

### 4.2 Ce que ça donne sur les lieux d'aujourd'hui (mesuré dans le code)

| Lieu | Emplacements | Dont conteneurs | Objets au premier remplissage | Points du monde |
|---|---|---|---|---|
| **Halte** (200 × 70 m), partagée | **75** | 23 | ≈ 157 | 9 (vélo, mobylette, trampoline, machine à laver, frigo, gravats, carcasse, 2 coffres d'épave) |
| **Coopérative** (80 × 60 m), une par joueur | **≈ 59** | 26 à 29 | ≈ 115 à 125 | 2 (gravats, carcasse) |
| **Carrefour du Comptoir** | **19** | 0 | ≈ 29 ordures | — |
| **Terrain personnel** (50 × 50 m) | **12** (4 près du chemin d'entrée, 8 épars) | 3 sacs-poubelle | ≈ 17 | — (la décharge existante) |

Rien n'est posé sur un mur, au ras d'une sortie, sur la ruine, la mare, la décharge, le point d'arrivée ni au pied d'un arbre ; deux emplacements sont toujours à plus de 1,2 m l'un de l'autre (2,5 m sur le terrain).

### 4.3 Le terrain personnel : nettoyer, c'est pour de bon

- **12 déchets de départ**, dont 3 sacs-poubelle, **sans renouvellement**. Nettoyer son terrain est une petite satisfaction, et sa maison n'est pas une poubelle.
- **Pas d'« objet du vent »** (décision Q4) : le terrain a déjà son tas qui génère des objets, **la décharge** (P-001). Elle remonte aussi les objets du lot 2, surtout des ordures.
- **Aucun déchet non ramassable** sur le terrain (décision Q-G1).
- Les ordures qu'on **jette** sur son terrain **y restent** (§7.2). Il faudra à terme une **gestion des déchets du terrain** (à concevoir, §11).

### 4.4 Pour la carte du monde à venir

Chaque lieu reçoit simplement une liste de **zones typées** (`ZONES_DECHETS`, `code/commun/src/couche-dechets.ts`) : la couche de déchets se pose seule, sans travail de niveau à la main (Book 20).

---

## 5. Ramasser, fouiller, renouveler

### 5.1 Ramasser (un objet au sol)

- **On voit ce que c'est avant** : l'examen (bouton B) nomme l'objet, et dit « Rien d'utile. » pour une ordure.
- **A, une seconde** : l'objet est dans le sac. Trop lourd : le serveur refuse, comme pour toute ressource.

### 5.2 Fouiller (un conteneur)

- **4 à 8 secondes**, puis une **liste, comme à la décharge** : on touche ce qu'on prend. C'est essentiel : sans ce choix, les déchets rempliraient le sac de force.
- **Ce qu'on laisse reste dans le conteneur** jusqu'à son renouvellement. Le conteneur ouvert se referme quand on s'en éloigne (3,2 m).
- **Les objets de moins de 10 cm** (carte bancaire, cartes de fidélité, rouleau de tickets, briquet vide, toupie à main, pinces à linge, écouteur ; et, du lot 1, l'aimant de frigo, la montre connectée, le fil dentaire, la vapoteuse) **ne se trouvent que dans les conteneurs** : au sol, à 5 px, ils ne se liraient pas (décision du chiffrage graphique).
- **Au-delà de 8 kg**, un objet ne tient pas dans un sac-poubelle ni dans un coffre : il traîne au sol.

### 5.3 Le renouvellement

| Ce qui se vide | Quand il se remplit à nouveau | Pourquoi |
|---|---|---|
| **Un carreau entamé** (halte, Coopérative, Carrefour) | **8 à 24 h réelles** plus tard (tiré par carreau), avec un **tirage neuf** | Le vent, les pillards, les Éteints qui renversent : on revient, on trouve autre chose au même endroit |
| **Le terrain personnel** | **Jamais** | Le nettoyer compte (§4.3) |
| **Gravats, carcasse** | 3 jours | Lent : une ressource, pas un flux |
| **Points à démonter** (vélo, mobylette, trampoline…) | **7 jours**, à **un autre emplacement** | Ce sont des événements |
| **Coffre de voiture** | 8 à 24 h | Un second geste sur l'épave, qui garde la sienne |

**Les emplacements ne bougent pas** : la disposition dépend du lieu et du carreau, toujours la même pour tous. **Le contenu change** à chaque remplissage.

---

## 6. Ce que garde le serveur

### 6.1 La graine et le bit « ramassé » (décision du 2026-10-09)

- Le monde est découpé en **carreaux de 20 × 20 m**. Chaque pièce d'un amas est un objet du catalogue **tiré d'une graine** (lieu, carreau, numéro de remplissage). Le serveur et le client calculent la même chose : **le contenu ne se stocke pas, ne s'envoie pas**.
- Le serveur ne garde, **par carreau entamé**, que trois choses (table `dechets`) : son **numéro de remplissage**, la **liste des pièces prises** (le bit « ramassé ») et **l'instant où il se remplit**. Un carreau jamais touché n'a pas de ligne. Pour les points du monde, une ligne par point.
- **La base ne grossit pas sans fin** : au plus une ligne par carreau et par point. La halte en a 27 (et 9 points), le Carrefour 6, une Coopérative 12 (et 2 points), un terrain 6. Pour 100 joueurs : **≈ 2 050 lignes au plus**, de quelques dizaines d'octets.
- **Rien ne tourne en continu** (Book 17 §4) : le renouvellement, les balises et les ordures jetées sont regardés **quand quelqu'un est là**, au plus toutes les 5 s par lieu (les ordures jetées, une fois par minute).
- **Le réseau** : à l'entrée d'un lieu, le serveur n'envoie que la clé de la couche, les pièces prises et l'état des points ; ensuite, seulement ce qui change quand quelqu'un prend.

### 6.2 Le coût mesuré

Banc de charge du serveur (`code/scripts/banc-charge.ts`, option `--dechets` : chaque joueur tente un ramassage au hasard deux fois par seconde), sur le Mac de développement, le 2026-10-09 : **50 joueurs à la halte, ≈ 1 ms de calcul par joueur et par seconde, avec ou sans déchets** ; aucune différence visible sur le retard de boucle ni sur le débit (≈ 6,5 Ko/s par joueur). Le Pi 4 est ≈ 6 fois plus lent que le Mac (Book 17 §5.2) : à remesurer sur le Pi au déploiement (`mesurer-pi.sh`).

---

## 7. La valeur, le Comptoir, les ordures jetées

### 7.1 Le Comptoir refuse ce qui vaut 0

- **« Les Compteurs ne reprennent pas les ordures. »** (décision Q2). Au guichet, une ordure est marquée « ordure ».
- **Les lots valent un peu** : un sac de canettes (4 wotts) se vend.

### 7.2 Les ordures jetées disparaissent, sauf chez soi

- Une ordure **jetée** au sol (valeur 0) **disparaît après 24 h réelles** (décision Q10). Sinon la base grossirait sans fin.
- **Sauf sur le terrain personnel** : elles y restent. C'est au joueur de tenir son terrain (§11 : la gestion des déchets, à concevoir).
- Ce qui a de la valeur reste au sol comme avant, partout.

### 7.3 Deux pièges, et une lumière

- **La conserve bombée** ressemble à la conserve (même étiquette rouge, couvercle gonflé). **Mangée, elle rend malade** deux minutes plus tard, pendant trois minutes : vomissements, faiblesse (Book 05 §4, comme les amanites). Démontée, une boîte vide. Un piège qui apprend à regarder.
- **L'os en nylon** pour chien a l'air d'un os, sans en être un : un piège pour qui cherche des os.
- **Les balises solaires de jardin** restées au sol **s'allument la nuit** et attirent **faiblement** les Éteints (décision Q12) : une lumière de 12 m de portée et d'intensité 0,06, bien moins qu'un feu (45 m, 0,3). Les ramasser « éteint » un jardin.

---

## 8. Les icônes

**Décision Q-G4 : toutes les icônes** (92). C'est fait en 0.7 (`code/client/src/icones-dechets.ts`) :

- **Un dessin propre pour chacun des 91 objets**, dans la charte du sac (SVG 48 × 48, trait d'encre, aplats de la palette) ; plus aucune icône générique dans le jeu (les retardataires du lot 1 et la décharge ont aussi le leur).
- **Trois pictogrammes de famille** : un sac-poubelle noué (déchet), un t-shirt plié (textile), un ballon de plage (loisir).
- **Les deux pièges** sont dessinés avec soin : la conserve bombée garde l'étiquette rouge de la bonne conserve, couvercle gonflé ; l'os en nylon est trop lisse et trop rose.
- **Les ordures sont grisées dans le sac** (filtre gris et un peu transparent) : ce qui ne vaut rien se lit d'un regard.
- Les points du monde n'ont pas d'icône : la liste de fouille porte leur nom, comme la décharge.

---

## 9. Le rendu au sol

### 9.1 Ce qui est dans la 0.7 : le rendu en amas

L'affichage provisoire du début de la 0.7 (des boîtes teintées) est remplacé par le vrai rendu, dans `code/client/src/rendu/dechets/` : `apparence.ts` (chaque objet : silhouette, teinte, échelle), `silhouettes.ts`, `points.ts` (conteneurs et points du monde), `eclats.ts`, `couche.ts` (le dessin, la visée, la liste de fouille). Le client reconstruit tout de la graine du lieu ; le serveur n'envoie que la clé, les pièces prises et les points.

- **Des amas, pas des pièces isolées.** Au zoom normal, 1 m ≈ 40 px sur l'iPhone 13 mini : une canette de 12 cm fait 5 px et ne se lit pas ; l'amas, lui, se lit comme « des ordures ». Sous chaque amas, **une tache de crasse** ; elle s'efface quand on a tout ramassé. **Tout ce qu'on voit au sol se ramasse** : il n'y a aucun décor de déchets inerte.
- **Les silhouettes partagées** (décision Q-G5) : on ne dessine pas 160 modèles. Chaque objet qui peut traîner au sol est une **silhouette**, une **teinte** (celle de son icône, sauf exception) et une **échelle** (sa taille réelle, × 1,15 comme les outils tenus). **24 silhouettes** : les 16 du chiffrage (cylindre couché, boîte, plaque plate, chiffon froissé, coussin, barre, roue, ressort, petit appareil, lame plate, vélo, sac plastique, cylindre debout, cône de chantier, grille du caddie, ballon) et 8 de plus pour que rien ne soit absurde (bouteille, livre, bobine de câble ou de tuyau, galet du robot, trottinette, barbecue, flamant rose, nain de jardin). Un test vérifie que chacun des ≈ 160 objets possibles au sol a la sienne.
- **Les conteneurs** (sac-poubelle crevé noir ou vert, poubelle renversée) ont deux états : **plein** (des ordures sortent de l'accroc) et **vidé** (affaissé, rien autour). Vidé, il reste là jusqu'à son remplissage (on peut seulement l'examiner) ; **sur le terrain personnel, qui ne se renouvelle pas, il disparaît** (décision Q-G1 : rien d'inerte sur le terrain).
- **Les points du monde** ont leur modèle, à couleurs par sommet : tas de gravats (les pierres du dessus partent à la fouille), vélo couché dans l'herbe du fossé, épave de mobylette, trampoline éventré, machine à laver au hublot ouvert, frigo connecté couché à l'écran mort, carcasse de mouton **sobre** (des os blanchis, de la laine grise, ni chair ni sang, décision Q-G7). **Le coffre d'épave** : on ne touche pas au modèle de l'épave ; ce qui déborde du coffre (un carton, un sac, une couverture) est posé au sol derrière, et disparaît une fois le coffre vidé.
- **L'éclat de repère** : à moins de 8 m, chaque objet ramassable **scintille** de temps en temps (une petite étoile blanc chaud `#FFF0BE`, en décalé, toutes les 3 à 5 s), comme un conteneur plein ou un point qu'on peut fouiller ; un conteneur vide ne scintille plus.
- **La nuit** (décision Q-G3), et dans une pièce noire de la Coopérative : l'éclat ne vient **que dans la lumière qu'on porte** (lampe ou torche allumée, à moins de 4 m). Ailleurs, rien ne brille, sauf **les balises solaires**, qui s'allument (une petite lueur qui respire).
- **La visée** : l'anneau existant, et la teinte de l'objet visé éclaircie qui bat avec lui.
- **Une pièce ramassée disparaît aussitôt** ; un carreau renouvelé se redessine (même disposition, autre tirage).
- **Les ombres** (décision Q-G6) : celles des objets au sol en **qualité haute seulement** (elles faisaient chuter le 1 % d'images le plus lent sur l'iPhone). En qualité moyenne et basse, l'occlusion cuite au ras du sol pose l'objet. Les points du monde gardent la leur dès que les ombres sont là, comme les épaves.

### 9.2 Comment c'est dessiné

L'essai sur l'iPhone 13 mini du porteur (60 images par seconde partout, dessin multiple `WEBGL_multi_draw` présent dans Safari) a tranché pour le **lot unique** :

- **tous les objets et conteneurs au sol d'un lieu : un seul `BatchedMesh`** (le `LotTrie` des ressources du sol, `rendu/lots.ts`) : 1 appel de dessin ; chaque objet hors champ est écarté, et, dans la passe d'ombre, chaque objet dont l'ombre ne peut pas tomber à l'écran. Une géométrie par objet du catalogue (teinte et taille cuites), construite à la première rencontre ;
- **repli** si le navigateur ne sait pas dessiner en multiple : une géométrie fondue par carreau de 20 m (1 appel par carreau visible, sans le liseré de visée) ;
- **les taches de crasse : 1 appel** (un lot, transparent, sans ombre) ; **l'éclat : 1 appel** (un lot, animé dans le shader) ;
- **chaque point du monde : 1 appel** (son assemblage fondu en un maillage), et 1 dans l'ombre.

### 9.3 Ce que ça coûte (mesuré, 2026-10-09)

Relevé dans Chrome sur le Mac (rendu logiciel : les appels et les triangles comptent, pas les images par seconde), `?mesure=1`, poste « Déchets » :

| Lieu, écran | Appels (image + ombre) | Triangles à l'écran | Construction |
|---|---|---|---|
| Halte, iPhone portrait (qualité moyenne) | 7 + 6 | ≈ 4 750 | 17 ms (110 objets, 23 conteneurs, 9 points) |
| Halte, iPhone paysage | 5 + 2 | ≈ 2 500 | |
| Halte, ordinateur (qualité haute) | 5 + 4 | ≈ 2 900 | 20 ms |
| Coopérative, iPhone portrait | 3 + 0 | ≈ 2 500 | 19 à 35 ms (58 objets, 29 conteneurs, 2 points) |
| Terrain, iPhone portrait | 3 + 0 | ≈ 660 | 4 ms (9 objets, 3 sacs) |

**Toute la couche tient en 2 à 7 appels et moins de 5 000 triangles**, bien sous le budget visé (≈ 15 à 25 appels, ≈ 25 000 triangles). Le reste de l'image : 84 appels à la halte en portrait, 75 à la Coopérative, 36 sur le terrain.

### 9.4 Le vrai risque : le jeu dessine déjà trop

Le jeu dessinait ≈ 390 appels par image sur le terrain (Book 17 §5.2), pour un budget de 120. La couche de déchets n'en ajoute que 5 à 10 % : le dépassement vient d'ailleurs. Décision du porteur : **à étudier sérieusement et à tester sur son iPhone**, avec une page servie depuis le Mac. Ce qui est déjà fait dans la 0.7 :

- **Les ombres hors champ sont écartées** : un objet n'entre plus dans la passe d'ombre si son ombre ne peut pas tomber à l'écran (sur le terrain, c'était 196 appels sur 326). Même image.
- **Des regroupements** : la mare, les panneaux, la halte.
- **Le mode mesure** (`?mesure=1` dans l'adresse) : images par seconde, appels de dessin et triangles par poste, interrupteurs pour couper un poste à la fois, et un banc d'essai automatique qui envoie le relevé au Mac. La couche de déchets simulée qui avait servi à mesurer avant d'écrire le rendu est retirée : le poste « Déchets » mesure la vraie couche, et l'on peut y basculer son dessin (lot unique ou fusion par carreau) et l'ombre de ses objets.

### 9.5 Si le budget ne tient pas

Dans l'ordre, du moins coûteux pour le jeu au plus coûteux : qualité basse moins dense ; ramassables en un seul appel ; fusionner des silhouettes (la boule rejoint la roue, le cône le cylindre debout) ; simplifier des points du monde (la carcasse devient un amas d'os ; machine à laver et frigo, un seul « gros électroménager ») ; en dernier recours, moins de déchets dans les prairies et les bois.

---

## 10. Les décisions du porteur (2026-10-09)

**Proposition « objets et déchets »** (§7 et §7.1) :

- **Q1, Q2, Q3, Q5, Q6, Q7, Q8, Q9, Q12** : oui, selon la recommandation. Trois familles nouvelles ; le Comptoir refuse ce qui vaut 0 ; les densités comme réglage de départ ; les matières existantes pour les démontages ; petite batterie peu commune ; sac de charbon peu commun ; couteau abîmé rare ; conserve bombée ; balises solaires qui attirent faiblement.
- **Q4** : pas d'« objet du vent » sur le terrain ; la décharge suffit ; les 12 déchets de départ restent.
- **Q10** : les ordures jetées disparaissent après 24 h, **sauf sur le terrain personnel** ; une gestion des déchets du terrain sera à concevoir.
- **Q11** : la cible est la **0.7**.
- **Tout ce qu'on voit au sol se ramasse** (§7.1) : chaque pièce d'un amas est un objet du catalogue, tiré d'une graine par carreau de 20 m ; le serveur ne garde qu'un bit « ramassé » par pièce et un délai de renouvellement par carreau. Le décor non interactif est abandonné.

**Chiffrage graphique** :

- **Q-G1** : aucun déchet non ramassable sur le terrain personnel.
- **Q-G2, Q-G3, Q-G7** : oui. Les objets de moins de 10 cm seulement dans les conteneurs ; l'éclat, la nuit, seulement dans la lumière du joueur ; la carcasse de mouton, sobre.
- **Q-G4** : **toutes les icônes** (92). **Q-G5** : toutes les silhouettes nécessaires. **Q-G6** : ombres en qualité haute seulement.
- **Les appels de dessin** : à étudier sérieusement et à tester sur l'iPhone du porteur.

---

## 11. Ce qui est construit (0.7), et ce qui reste

**Construit** :

| Morceau | Fichiers |
|---|---|
| Le catalogue (91 objets, démontages, familles, valeurs) | `commun/src/vestiges-lot2.ts`, `vestiges.ts` |
| Les tables par type de lieu, les paliers, les conteneurs, les points du monde, les graines, les délais | `commun/src/dechets.ts` |
| Les zones typées et la disposition des lieux, partagées par le serveur et le client | `commun/src/couche-dechets.ts` |
| Ramasser, fouiller au choix, démonter, renouveler, effacer les ordures jetées, les balises de nuit | `serveur/src/couche-dechets.ts`, table `dechets` de `base.ts`, message `dechets` contrôlé dans `controle.ts` |
| Le Comptoir qui refuse les ordures, la conserve bombée | `serveur/src/joueur.ts`, `commun/src/combat.ts` |
| Les fouilles existantes enrichies (couteau abîmé, onduleur, trottinette électrique, sac de charbon, conserve bombée) | `commun/src/vestiges.ts` |
| Les 91 icônes, les pictogrammes de famille, le grisé des ordures | `client/src/icones-dechets.ts`, `icones.ts` |
| Le rendu en amas (silhouettes, conteneurs, points du monde, éclat, visée) et la liste de fouille | `client/src/rendu/dechets/`, fin de `style.css` |
| La rubrique d'aide « Les déchets de l'Abondance » | `client/src/aide-contenu.ts` |
| Le banc de charge `--dechets`, le mode mesure `?mesure=1` | `scripts/banc-charge.ts`, `client/src/mesure/` |

**Reste à faire** :

- **Le rendu à l'essai sur l'iPhone** du porteur : lisibilité des petits objets (un stylo, des billets se voient à peine), réglage des taches, de l'éclat et de la lueur des balises.
- **Remesurer sur le Pi 4** la halte pleine, déchets compris (`mesurer-pi.sh`).
- **Caler les densités** au test familial (Q3) ; le débit visé par jour (≥ 2 barres de métal, ≈ 1 lame de ressort, ≥ 3 petits ressorts, ≥ 2 poignées de plumes, ≈ 1 appareil jetable, une petite batterie et un vélo complet tous les 3 jours) est vérifié par les tests de `dechets.test.ts`, à confirmer en jeu.
- **Les usages « plus tard »** de certains objets : la couverture de survie (chaleur, Book 13), le rideau (occulter une fenêtre, Book 06), le jerrican (porter l'eau, Book 11), le fût de 200 L (charbonnière en fût, Book 02 §5), le tuyau de cuivre (alambic), la bougie parfumée (cire, lumière).

## 11 bis. Ce que la 0.8 change (2026-10-10)

*Plan 0.8 §2.5 (propositions I1 à I31 d'`ingredients-par-lieu.md`) ; **codé en 0.8** (chantiers 3 et 10 : `vestiges.ts`, `vestiges-lot2.ts`, `dechets.ts`, `couche-dechets.ts`).*

- **Le jerrican percé** (I5) : le « jerrican vide » devient un **jerrican percé**, un déchet (« il sent encore l'essence, et il fuit par le fond ») qui se démonte en 2 morceaux de plastique. L'identifiant reste. **Le vrai jerrican de 20 L** sera la clé du niveau 3 de l'eau, au niveau 2 (L2B) ; l'usage « porter l'eau » du §11 attend celui-là.
- **Les sacs plastique** (I28) : le **premier sac-poubelle du chemin**, sur le terrain, donne toujours **4 sacs plastique** en plus de son tirage : de quoi faire l'entonnoir du **récupérateur de 5 L** dès la maison (Book 24 §12). C'est le seul point garanti de la couche sur le terrain personnel.
- **Les tables de fouille** :
  - **la bobine d'allumage** quitte la station (I12) : l'épave de mobylette et la débroussailleuse ne la donnent plus ; la matraque ★★★ ne vient plus que de la maîtrise ;
  - **les roulements** quittent la machine à laver, la trottinette électrique et la planche à roulettes (I9), comme la chambre froide de la Coopérative (I8) : ils ne débloquent plus rien avant le niveau 2 ;
  - **l'étau, le grillage et la cocotte sortent des tables courantes** (I7) : ce sont les **clés du niveau 1**, à leur place fixe (la Coopérative, le Moulin du Gué) ;
  - **R-BUTIN** : une clé de L1 sort **rarement** d'une fouille, **2 %** par fouille, en plus du tirage : à la station et au gué, l'une des six ; à la Coopérative, l'une des trois du Moulin, et inversement. Elle n'est dans aucune table (un test le vérifie) ;
  - **par chance**, à la station : lames de ressort, appareil photo jetable, petit ressort, chiffons, bâche, cellules lithium (les démontages, I18), fil dentaire ; au gué : bâche, chiffons, casserole, cordes.
- **Le bois et la pierre** (la ligne 10 du §2.1) : le terrain ne les fait toujours pas revenir, mais **les haltes, si** (30 min), avec des **tas personnels** (le tas de bois de la station, le banc de galets du gué), un **vrac qui grandit avec les voyageurs**, la **charbonnette** et un **stock au Comptoir** : le budget est au Book 01 §2 bis.
- **Ce qu'on a ne disparaît pas** : on retire des **sources**, pas des objets (et tous les joueurs repartent de zéro au déploiement de la 0.8).
- **Les ingrédients orphelins** (I31) ne sont pas créés : sable, bois flotté (le « bois flotté » du modèle du gué devient un tas de branches), planches comme matériau, mèche, chablis.
- **La couche de déchets n'est pas encore posée** au **gué** ni au **Moulin du Gué** : leurs zones typées sont vides dans le code (`couche-dechets.ts`) ; c'est la question du §12 sur les lieux nouveaux.

## 12. Questions ouvertes

- [ ] **La gestion des déchets du terrain personnel** (décision Q10) : brûler, enterrer, un tas de compost, une benne qu'on porte à la décharge ? À concevoir quand le terrain en aura besoin.
- [x] **`BatchedMesh` ou `InstancedMesh`** pour les ramassables : **`BatchedMesh`** (Safari dessine en multiple sur l'iPhone 13 mini), repli par carreau sinon (§9.2).
- [ ] **Les papiers et les sacs qui volent au vent** : quelques plaques animées, en un seul lot. Hors de la 0.7.
- [ ] **La carte du monde** (Book 20) : quelles zones typées pour chaque lieu nouveau ? La couche s'y posera seule.

---

## Glossaire

- **Couche de déchets** : les amas et les conteneurs posés dans tous les lieux, tirés d'une graine.
- **Amas** : quelques objets du catalogue serrés autour d'un point, qu'on ramasse un à un.
- **Conteneur** : sac-poubelle, poubelle renversée ou coffre de voiture, qu'on fouille en choisissant ce qu'on prend.
- **Carreau** : un carré de 20 × 20 m. C'est l'unité du renouvellement et de ce que garde le serveur.
- **Remplissage** : le numéro du tirage d'un carreau ; il avance à chaque renouvellement.
- **Ordure** : un objet qui vaut 0 wott. Le Comptoir la refuse ; jetée hors du terrain, elle disparaît en 24 h.
- **Point du monde** : ce qui ne se porte pas et se fouille, se démonte ou se ramasse sur place (vélo du fossé, trampoline, gravats…).
- **Éclat** : la petite étoile qui scintille sur un objet à ramasser (§9.1).
