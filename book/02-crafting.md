# Book 02 — Le Crafting

> Document de conception · version 0.7 · 2026-10-09
> Statut : **brouillon de travail**. Les valeurs chiffrées sont des hypothèses de départ, réalistes en ordre de grandeur, à calibrer en playtest.
> S'appuie sur le [Book 01 — Les Trois Feux](01-les-trois-feux.md) : familles, énergie en Wh, énergie grise, wotts.

---

## 1. Principes

1. **Une recette doit pouvoir s'expliquer à quelqu'un qui bricole.** Si on ne peut pas le faire dans la réalité avec ces matières et ces outils, on ne peut pas le faire dans le jeu.
2. **Fabriquer demande cinq choses :** des **matières**, des **outils**, une **installation**, de l'**énergie** et du **savoir**. Il en manque une, et la recette est impossible ou dégradée.
3. **Tout objet a son énergie grise**, calculée et affichée (Book 01 §6). Le crafting est ce qui la produit.
4. **Plusieurs voies pour un même objet.** Quand c'est réaliste, chaque famille a sa façon de le fabriquer, avec un coût dominant différent : bois et bruit, électricité et pièces rares, ou calories et temps.
5. **Rien ne se perd.** Chaque recette a des sous-produits, chaque objet usé peut être réparé ou démonté, chaque métal peut être refondu.
6. **Le monde travaille même quand le joueur est absent.** Séchage, tannage, combustion lente, fermentation : les processus passifs continuent hors ligne.

---

## 2. Anatomie d'une recette

### La fiche

```
RECETTE : Lame de couteau, voie forge
──────────────────────────────────────────────────────────────
Entrées       1 ressort à lames (0,4 kg)                     [vestige]
Outils        marteau (usure 2) · pinces de forge (usure 1) · enclume
Installation  forge ventilée (≥ 900 °C requis)
Énergie       10 000 Wh_th, soit 5 chauffes ≈ 1,25 kg de charbon de bois
Travail       1 h 30, effort lourd (450 kcal)
Savoir        Métal II · DEX ≥ 9
Sorties       1 lame (qualité : voir §9) + calamine (déchet)
Signature     sonore 40 m · olfactive 50 m          (+50 % si Charbonnier)
Famille       🔥 native Charbonniers
```

### Les champs

| Champ | Contenu | Règle |
|---|---|---|
| **Entrées** | Matières consommées | Quantités réalistes en kg ou en litres |
| **Outils** | Outils nécessaires, non consommés | Chaque usage use l'outil (§7). Un outil de fortune est possible, avec un malus. |
| **Installation** | Équipement fixe sur le terrain | Définit la température atteignable et le rendement (§8) |
| **Énergie** | Wh_th, Wh_é ou Wh_m | Convertie en combustible, en charge de batterie ou en kcal |
| **Travail** | Durée et intensité | Intensité légère (≈ 150 kcal/h), moyenne (≈ 250 kcal/h), lourde (≈ 300 à 400 kcal/h) ou très lourde (≈ 500 kcal/h : abattage) |
| **Savoir** | Recette connue, seuil de stat | Voir §9 |
| **Sorties** | Produit et sous-produits | Toujours au moins un sous-produit ou déchet, quand c'est réaliste |
| **Signature** | Bruit, odeur, lumière | Attire les zombies (Book 01 §2) |
| **Famille** | Native ou étrangère | Étrangère : coût ×1,5 et temps ×1,5 (Book 01 §5) |

### Travail actif et processus passif

| Type | Le joueur… | Exemples |
|---|---|---|
| **Actif** | Est occupé, dépense des kcal, ne peut rien faire d'autre | Forger, scier, pédaler, démonter |
| **Passif** | Lance le processus et s'en va. Celui-ci continue **même hors ligne**. | Séchage du bois, charbonnière, tannage, nitrière, fermentation, recharge solaire |

> Les processus passifs sont une bonne nouvelle pour les joueurs qui ont peu de temps : on lance une charbonnière avant de se déconnecter, elle est prête au retour. Ils créent aussi des **cibles fixes** : une charbonnière qui fume pendant trois jours attire les zombies vers le terrain.
>
> **Les machines alimentées en énergie** (moulin, pompe, scie, clôture…) suivent une règle à part : elles tournent avec la production de la base, au calendrier, dans la limite de ce qu'on leur a chargé (Book 01 §2 bis).

---

## 3. Énergie grise des ressources de base

Les ressources naturelles (les **flux**) ne coûtent que le **travail de collecte**. La nature fournit le reste gratuitement.

Rappel des cours de base (Book 01 §6) : **1 kcal = 0,2 wott**, **1 Wh_é = 1 wott**, **1 Wh_m = 0,6 wott**.

| Ressource | Collecte par heure | Effort | Énergie grise |
|---|---|---|---|
| Bois sec (bois mort, fendage) | ≈ 10 kg | 400 kcal | **≈ 8 wotts/kg** |
| Bois vert (abattage) | ≈ 20 kg | 500 kcal | ≈ 5 wotts/kg, **mais il doit sécher** |
| Pierre | ≈ 30 kg | 450 kcal | ≈ 3 wotts/kg |
| Argile | ≈ 20 kg | 350 kcal | ≈ 3,5 wotts/kg |
| Calcaire | ≈ 25 kg | 450 kcal | ≈ 3,6 wotts/kg |
| Sable | ≈ 40 kg | 300 kcal | ≈ 1,5 wott/kg |
| Eau brute (portage court) | ≈ 50 L | 300 kcal | ≈ 1,2 wott/L |
| Fibres (ortie, lin) | ≈ 2 kg | 250 kcal | ≈ 25 wotts/kg, puis rouissage passif |
| Sel, marais salant (bord de plage, été) | ≈ 10 kg récoltés | 250 kcal | ≈ 5 wotts/kg, après une cristallisation passive au soleil (calendrier) dans des bassins à construire |
| Sel, eau de mer bouillie (bord de plage, toute saison) | ≈ 30 L d'eau par kg de sel | ≈ 20 kg de bois et 2 h de surveillance | ≈ 200 wotts/kg (🔥) |

**Le bois vert** brûle mal : rendement −50 % et fumée ×2. Il faut le faire **sécher** sous abri (processus passif : ≈ 6 mois réalistes, soit ≈ 2 semaines réelles au calendrier). Le bois mort ramassé, lui, est déjà sec, **sauf en hiver et après la pluie** : il est alors humide (mêmes pénalités que le bois vert) et doit sécher quelques jours (calendrier) sous abri. En hiver, la collecte est aussi plus lente dans la neige (≈ −30 %). Un **bûcher** rempli à l'automne est le meilleur investissement d'avant l'hiver (Book 01 §7.2). Un tas de bois sec est un capital : c'est de l'énergie mise de côté.

**L'eau brute n'est pas potable.** Pour la rendre buvable :

- **Ébullition :** porter 1 L de 15 à 100 °C demande ≈ 100 Wh utiles. Sur un feu de camp (rendement 5 %), cela fait ≈ 2 000 Wh_th, soit ≈ 0,45 kg de bois (eau potable ≈ 4,8 wotts/L) ; sur un réchaud ou un poêle, ≈ 0,25 kg.
- **Filtration :** sable, charbon de bois, tissu. Pas d'énergie, mais un filtre à entretenir.

---

## 4. Les matériaux et leurs états

Un matériau passe par des **états**. Chaque passage d'un état à l'autre est une recette.

| Famille de matériau | États | Ce qui fait passer de l'un à l'autre |
|---|---|---|
| **Bois** | Vert → sec → débité (planche, poutre) → assemblé | Séchage (passif), sciage, menuiserie |
| **Bois (combustible)** | Sec → charbon de bois → cendres | Charbonnière (pyrolyse), combustion |
| **Argile** | Crue → modelée → séchée → cuite | Modelage, séchage (passif), four à poterie (≈ 900 °C) |
| **Calcaire** | Brut → chaux vive → chaux éteinte → mortier | Four à chaux (≈ 900 °C), ajout d'eau, mélange au sable |
| **Peaux** | Fraîche → salée ou séchée → tannée → cuir | Salage, tannage végétal à l'écorce (passif, plusieurs semaines de jeu) |
| **Fibres** | Brutes → rouies → filées → corde ou tissu | Rouissage (passif), filage, tressage ou tissage |
| **Métaux** | Vestige → brut (récupéré) → chauffé → forgé ou fondu → coulé | Démontage, forge, creuset (Book 01 §3) |
| **Plastiques** | Vestige → broyé → refondu | Refonte du PEHD (bidons, bouchons) vers 130 à 180 °C. **Fumées toxiques** en cas de surchauffe. |
| **Verre** | Vestige → brisé ou ramolli | Découpe (usage direct en lame, en vitre) ou ramollissement en forge (≈ 1 000 °C) |
| **Caoutchouc** | Pneu, chambre à air → découpé | Découpe uniquement : semelles, joints, élastiques (lance-pierre) |
| **Électronique** | Vestige → composants | **Ne se fabrique pas.** Se récupère et se répare uniquement. |

> L'électronique ne se fabrique jamais. C'est le stock le plus précieux et le plus rare du monde. C'est ce qui rend les Voltaïques dépendants de la fouille, et les ruines lointaines indispensables.

---

## 5. Les vestiges : outil, composants ou matière

Chaque vestige offre trois options, et chaque option détruit les autres. **Choisir comment utiliser un vestige est la décision de crafting la plus fréquente du jeu.**

| Vestige | Usage direct | Démontage (outils, durée) | Composants obtenus |
|---|---|---|---|
| **Voiture** | Abri, coffre, barricade | Clés, tournevis, scie à métaux · 4 à 6 h | Batterie 12 V, **alternateur** (génératrice !), faisceau électrique (≈ 2 kg de cuivre), **ressorts à lames** (acier à ressort), roulements, pneus, vitres, tôles, mousse, réservoir |
| **Vélo** | Transport | Clés · 30 min | Chaîne, pédalier, roues, roulements, câbles, **rayons** (fil d'acier : carreaux, aiguilles) |
| **Machine à laver** | — | Tournevis, clés · 1 h | **Moteur** (génératrice possible), contrepoids en béton, tambour inox, courroie, roulements |
| **Réfrigérateur** | Glacière passive (caisse isolée) | Tournevis, pince · 1 h | Compresseur, tubes de cuivre, isolant |
| **Batterie de voiture** | Stockage électrique | Pince, protection · 30 min | ≈ 10 kg de **plomb** (balles, lests), acide (**dangereux**), bac plastique |
| **Bouteille de gaz** (vide) | — | Scie à métaux · 1 h | Corps de **forge à gaz** ou de poêle. **Risque d'explosion** s'il reste du gaz. |
| **Fût métallique 200 L** | Récupération d'eau de pluie | Burin, marteau · 30 min | Poêle, **charbonnière en fût** (meilleur rendement), tôle |
| **Rail de chemin de fer** | **Enclume** (après découpe) | Scie à métaux · 3 h | Bloc d'acier dur |
| **Panneau solaire** | Production électrique | (déconseillé) | Verre, cadre aluminium, cellules (inutilisables séparément) |
| **Ordinateur, électronique** | — | Tournevis · 20 min | Ventilateurs, alimentation, condensateurs, relais, LED. **Peu de métal utile.** |
| **Pneu** | Barricade, semelle | Couteau · 20 min | Caoutchouc. Combustible possible, mais **fumée noire toxique** et signature énorme. |
| **Livre technique, manuel** | **Recette apprise** (§9) | — | Papier (allume-feu) |

> **Les conflits d'usage créent du gameplay.** Une batterie de voiture est un stockage précieux pour un Voltaïque, et 10 kg de plomb (des centaines de balles) pour un Charbonnier. Un alternateur est une génératrice pour un Mécaniste qui a une roue hydraulique. Le même vestige n'a pas la même valeur pour tout le monde, ce qui fait vivre le commerce.

**Valeur des vestiges** (Book 01 §6) : leur prix de base est leur **valeur de remplacement**, c'est-à-dire ce qu'il coûterait de les refaire aujourd'hui. Elle est **plafonnée** pour ce qui ne se fabrique plus (électronique, roulements de précision, cellules solaires).

### Vestiges, lot 1 (0.3, 2026-10-08)

**Le but** : comme dans les ruines de *Fallout*, on peut ramasser tout et n'importe quoi, et l'on finit par **devoir choisir** ce qu'on emporte. Le bric-à-brac de l'Abondance encombre : la plupart des objets ne servent pas tout de suite, certains serviront bien plus tard, d'autres jamais.

**La règle de choix** des 55 vestiges, pris dans le catalogue de P-003 :
1. **Ce qu'on trouve sur la route de campagne** : cuisine, salle de bain, salon, gadgets connectés morts, garage et atelier, voiture, ferme et jardin. Pas encore d'intimité, d'humour noir cru ni de pop culture : ce premier lot reste de bon goût.
2. **Le poids réaliste avant tout** : c'est lui qui force le choix. Une télé de 85 pouces pèse 45 kg, un sac de ciment durci 25 kg, une encyclopédie en 24 volumes 36 kg, un groupe électrogène 45 kg, pour un sac de 55 kg.
3. **La valeur** (énergie grise, ce que paie le Comptoir) : l'électronique est plafonnée (on ne sait plus la refaire, mais elle ne marche plus) ; les objets absurdes valent 1 ou 2 wotts (nain de jardin, coussin péteur, sapin désodorisant, boîte à gants pleine de PV).
4. **Un mélange** : des utiles plus tard (cocotte en fonte, étau, pied-de-biche, bêche, Creuser 2), des réserves de pièces (gadgets, moteurs, lithium), des absurdes, et quelques raretés (robot domestique, groupe électrogène ; la pyramide de 96 rouleaux est légendaire).

**Treize composants** qui reviennent partout (P-003 §2) : fil de cuivre, petit moteur, pile usagée, cellule lithium, aimant, LED, résistance chauffante, morceau de verre, chute d'aluminium, morceau de plastique, liasse de papier, petit ressort, bande de caoutchouc. Ils n'entrent encore dans aucune recette : ils attendent l'électricité (Book 03 §3.3), la refonte (§4) et les pièges.

**Démonter un vestige** depuis le sac (fiche de l'objet, bouton « Démonter ») : 36 vestiges se démontent (table `DEMONTAGE`, `commun/src/vestiges.ts`). Chacun a ce qu'il donne, la qualité d'outil demandée et une durée de quelques secondes : **Visser 1** (le couteau suffit) pour l'électronique grand public, **Couper 1** pour les câbles, le caoutchouc et les sangles, **Marteler 1** pour aplatir une casserole, **Marteler 2** pour casser un sac de ciment en 6 pierres, **Visser 2** pour le robot domestique, **Serrer 2 et Visser 1** pour le groupe électrogène. Le rebut reste sur place : une télé de 45 kg donne 30 LED, du cuivre, du plastique et de l'aluminium (≈ 3,5 kg). Exemples : un smartphone fêlé donne une cellule lithium, un morceau de verre, un petit moteur (le vibreur) et un aimant ; une ceinture de sécurité, une corde ; la pyramide, ses 96 rouleaux. Ce qui ne se démonte pas garde son usage futur (cocotte, étau, encyclopédie) ou ne sert à rien (le nain).

**La fouille rapporte du bric-à-brac** : fouiller un vestige de la halte ou la caisse à outils de la ferme donne l'objet habituel, **plus 1 à 3 vestiges** tirés au hasard (côté serveur) dans la table du lieu. Ce qui ne rentre pas dans le sac **reste par terre en petit tas** ramassable, et le message dit ce qui a été laissé : il faut alors jeter, démonter ou renoncer.

| Lieu de fouille | Ressources | Familles tirées (poids) |
|---|---|---|
| **Boutique** de la station | Rayonnage | Cuisine 3, salle de bain 3, gadgets 3, salon 1 |
| **Atelier** | Établi de l'atelier, caisse à outils de la ferme | Garage 6, gadgets 1, voiture 1 |
| **Épaves** | Épave de voiture, benne du camion | Voiture 6, gadgets 1 |
| **Grange** | Grange effondrée | Ferme 4, salon 2 (le débarras qu'on y entassait), garage 1 |

Le poids de tirage d'un vestige est celui de sa famille dans le lieu × celui de sa rareté : **C 10, P 4, R 1, L 0,25**. Valeurs de réglage, à caler pendant le test.

### Vestiges, lot 2 : les déchets de l'Abondance (0.7, 2026-10-09)

Le détail est au [Book 26](26-les-dechets-de-l-abondance.md). En bref, pour le crafting :

- **91 objets nouveaux**, presque tous sans valeur, en trois familles nouvelles (déchet, textile, loisir), posés **partout** en amas et en conteneurs : **tout ce qu'on voit au sol se ramasse**.
- **Aucune recette ne change, aucun composant nouveau** : chaque objet se démonte en matières qui existent déjà. Un stylo donne un petit ressort, un oreiller des plumes, un piquet de clôture une barre de métal, un ressort de suspension deux lames de ressort, une lame de tondeuse deux lames ébréchées, un onduleur une petite batterie.
- **Les manques de la 0.6 sont comblés** dans le monde ordinaire : barres de métal et lames de ressort (🔥), appareils photo jetables et petites batteries (⚡), vélos, petits ressorts et plumes (⚙️). Chaque famille trouve sa base seule (Book 25 §2.5).
- **Une ordure vaut 0** : le Comptoir la refuse ; jetée hors du terrain personnel, elle disparaît en 24 h.

---

## 6. Les domaines de chaque famille

Chaque famille est **la moins chère dans ses domaines**. C'est ce qui la rend autonome sur l'essentiel, et ce qui crée le commerce pour le reste.

| | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **Domaines** | Métallurgie, lames, outils, chaux, céramique, chauffage | Froid, éclairage, assemblage du métal (soudure), perçage et découpe précis, radio, recharge | Mouture, pressage (huile), cordes et textiles, sciage du bois, pompage, transport |
| **Conservation des aliments** | **Fumage** (fumée = signature) | **Réfrigération** (Wh_é) | **Salage et séchage** (sel, temps) |
| **Voie typique sur le métal** | Chauffer, forger | Souder, meuler | Travail à froid, limer, riveter |

> Le triangle de la conservation est un bon exemple : trois méthodes réalistes, chacune avec le coût de sa famille.

---

## 7. Les outils

### Règles

- **Un outil n'est pas consommé, il s'use.** Chaque usage retire des points de durabilité, selon la dureté du travail.
- **Un outil a une qualité** (★ à ★★★★★), qui influe sur le temps de travail et sur la qualité du produit (§9).
- **Un outil manquant peut être remplacé par un outil de fortune**, avec un malus. On peut casser une noix avec une pierre, mais pas forger un couteau avec. La règle précise est celle des **qualités d'outil** (Book 03 §4).

### Outils essentiels

| Outil | Usages | Origine | Outil de fortune et malus |
|---|---|---|---|
| **Couteau** | Découpe, dépeçage, sculpture du bois | Vestige, forgé, meulé | Éclat de verre ou silex : temps ×2, qualité −1 |
| **Hache** | Abattage, fendage | Vestige, tête forgée + manche | Pierre emmanchée : temps ×4 |
| **Scie à bois** | Débit de planches et de poutres | Vestige | Hache : perte de matière 50 % |
| **Scie à métaux** | Découpe du métal | Vestige. **Lames consommables, rares.** | Lime : temps ×5 |
| **Marteau** | Forge, clouage, démontage | Vestige, forgé | Pierre : temps ×2, précision −1 |
| **Tournevis, clés** | Démontage | Vestige | Couteau : risque de casse de la lame |
| **Lime** | Ajustage, affûtage, mise en forme à froid | Vestige. Fabrication : palier III (taillage + trempe). | Pierre abrasive : temps ×3 |
| **Enclume** | Forge | Rail, bloc d'acier | Grosse pierre plate : qualité −2 |
| **Pinces de forge** | Tenir le métal chaud | Forgées | Bâton vert mouillé : 1 ou 2 chauffes seulement |
| **Soufflet** | Ventiler la forge | Cuir + bois (🔥) **ou ventilateur 12 V (⚡)** | Souffler dans un tube : température max 800 °C |
| **Vilebrequin, perceuse** | Perçage | Vestige. Perceuse électrique (⚡). | Couteau et rotation à la main : temps ×6 |
| **Pierre à aiguiser** | Affûtage | Grès naturel, vestige | — |

> **Remplacé par les qualités d'outil (Book 03 §4).** La dernière colonne donne des exemples de malus, mais la règle qui s'applique est celle du Book 03 : un niveau en dessous de la qualité demandée, malus de temps et de qualité ; deux niveaux en dessous, recette impossible. Une pierre emmanchée (niveau 1) ne remplace donc pas une hache (niveau 3), et une grosse pierre (niveau 1) ne remplace pas une enclume (niveau 3).

### Le bruit des outils

**Tout outil fait du bruit, qu'il soit électrique ou manuel** (Book 01 §2). Ce bruit s'ajoute à celui de l'installation.

| Outil | Signature sonore indicative |
|---|---|
| Couteau, lime, pierre à aiguiser | 5 m |
| Scie à bois (manuelle) | 15 m |
| Hache (abattage, fendage) | 25 m |
| Marteau sur enclume | 40 m |
| Perceuse électrique | 30 m |
| Meuleuse électrique | 60 m |
| Tronçonneuse (si on trouve le carburant) | 100 m |

> Les outils électriques font plus de bruit, mais pendant moins longtemps. Une meuleuse travaille 20 minutes là où une lime travaille des heures. Ce qui compte pour les zombies, c'est **l'intensité multipliée par la durée**.

> **Le premier outil se fait avec un outil trouvé.** Le joueur ne part jamais de la pierre taillée : le monde est rempli d'outils modernes abîmés. Le crafting commence par **réparer, détourner et améliorer**, puis seulement ensuite **fabriquer**.

---

## 8. Les installations

Les installations sont construites sur le terrain du joueur. Elles définissent **ce qui est possible** (température, précision) et **à quel coût** (rendement).

| Installation | Palier | Famille native | Temp. max | Rendement | Signature | Processus |
|---|---|---|---|---|---|---|
| Feu de camp | I | Tous | 600 °C | 5 % | Olfactive 30 m, lumière | Actif |
| Établi | I | Tous | — | — | — | Actif |
| Séchoir à bois (abri ventilé) | I | Tous | — | — | — | **Passif** |
| Foyer de forge | I | 🔥 | 900 °C | 8 % | Sonore 30 m, olfactive 40 m | Actif |
| Pédalier universel (entraîne une meule, une scie, une dynamo) | I | ⚙️ | — | 100 Wh_m/h | Sonore 15 m | Actif |
| Banc de recharge (batteries + régulateur) | I | ⚡ | — | 85 % | — | **Passif** |
| Charbonnière (meule couverte ; le fût est une amélioration de palier III, §12.2) | II | 🔥 | — | 20 à 30 % en masse | **Olfactive 150 m pendant toute la combustion** | **Passif** (3 jours) |
| Forge ventilée au charbon de bois | II | 🔥 | 1 300 °C | 10 % | Sonore 40 m, olfactive 50 m | Actif |
| Creuset, four de fonderie | II | 🔥 | 1 200 °C | 15 % | Olfactive 50 m | Actif |
| Four à chaux, four à poterie | II | 🔥 | 1 000 °C | 20 % | Olfactive 80 m | **Passif** (1 jour) |
| Four à pain | II | Tous | 300 °C | 30 % | Olfactive 40 m | Actif |
| Fosses de tannage | II | Tous | — | — | **Olfactive 40 m** (ça sent très mauvais) | **Passif** (semaines) |
| Nitrière | II | 🔥 | — | — | Olfactive 30 m | **Passif** (semaines) |
| Poste de soudure à l'arc (3 batteries de voiture en série) | II | ⚡ | > 3 000 °C (local) | — | **Lumineuse forte** (arc) | Actif |
| Atelier électrique (meuleuse, perceuse) | II | ⚡ | — | — | **Sonore 60 m** (meuleuse) | Actif |
| Tour à perche | II | ⚙️ | — | — | Sonore 15 m | Actif |
| Roue hydraulique (meule, scie, marteau-pilon) | III | ⚙️ | — | 200 à 500 W_m continus (cours d'eau requis) | Sonore 30 m | **Passif** (réparer) |
| Moulin à vent (meule, pompe) | III | ⚙️ | — | 100 à 300 W_m selon le vent | Sonore 20 m | **Passif** (réparer) |
| Manège à traction animale (meule, pompe, scie) | III | ⚙️ | — | 400 W_m (bœuf) à 600 W_m (cheval), ≈ 8 h par jour | Sonore 15 m, olfactive 20 m | **Passif** (réparer, nourrir) |
| Petite machine à vapeur (+ alternateur) | III | 🔥 | — | ≈ 500 W_m (≈ 300 W_é avec l'alternateur) pour ≈ 3 kg de bois par heure | Sonore 40 m, olfactive 60 m | **Passif** (remplir la trémie) |
| Alambic | III | 🔥 | — | — | Olfactive 50 m | Actif |
| Four électrique (à arc ou à induction) | III | ⚡ | 1 600 °C et plus | 60 % | Lumineuse | Actif |

> **Les installations croisées sont voulues.** Un soufflet électrique (⚡) sur une forge (🔥), ou un marteau-pilon hydraulique (⚙️) alimenté en métal chaud par une forge (🔥) : les meilleures installations naissent de la coopération.

---

## 9. Qualité, savoir et échec

### La qualité : la règle du maillon faible

La qualité d'un produit (★ à ★★★★★) est **plafonnée par le plus faible de ses trois facteurs** :

```
qualité max = min( qualité des matières, qualité des outils, qualité de l'installation )
qualité obtenue = qualité max, +1 si maîtrise du savoir (plafond ★★★★★)
```

> Un bon forgeron avec un marteau rouillé et un rail tordu ne fera pas un chef-d'œuvre. C'est réaliste, et cela donne de la valeur aux bons outils et aux bonnes installations.

| Qualité | Effet sur le produit |
|---|---|
| ★ | Durabilité ×0,5, efficacité −20 % |
| ★★★ | Référence |
| ★★★★★ | Durabilité ×2, efficacité +20 % |

### Le savoir

Une recette doit être **connue** pour être réalisée. On l'apprend :

| Source | Exemple |
|---|---|
| **Livres et manuels** trouvés dans les ruines | *Manuel du forgeron amateur* → recettes de Métal II |
| **PNJ** (survivants, hameaux des familles) | Apprentissage contre des wotts ou un service |
| **Autres joueurs** | Un joueur enseigne une recette qu'il maîtrise (rayonnement pour l'enseignant, Book 03 §5.4) |
| **Pratique** | Réaliser des recettes d'une catégorie fait progresser la **maîtrise** dans cette catégorie |

Chaque recette demande un **seuil de stat** (DEX, SAV, FOR selon le cas). En dessous du seuil, la recette est réalisable mais avec un **risque de défaut**.

### L'échec

Pas de tout ou rien au hasard. Un échec réaliste, c'est :

- **un défaut** : qualité −1 ;
- **une perte partielle de matière** : la lame fissurée à la trempe redevient du métal à refondre ;
- **jamais une disparition totale** : les matières se récupèrent toujours en partie (§10).

---

## 10. Usure, réparation et recyclage

| Action | Coût | Exemple |
|---|---|---|
| **Entretien** | Très faible | Affûter un couteau : 5 min, une pierre à aiguiser |
| **Réparation** | 20 à 40 % de l'énergie grise initiale | Remmancher une hache, ressouder un cadre |
| **Démontage d'un objet fabriqué** | Rend 50 à 80 % des matières | Une armure rivetée rend ses tôles et ses rivets |
| **Refonte d'un métal** | Rend ≈ 90 % du métal, contre de l'énergie | Un couteau cassé redevient de l'acier à forger (au four électrique, palier III ⚡, ou en vendant à un fondeur) |

> **La ferraille garde toujours une valeur.** Le métal est le matériau qu'on ne jette jamais.

---

## 11. Les sous-produits

Chaque recette réaliste produit **autre chose** que ce qu'on cherche. Ce qui est un déchet pour l'un est souvent une matière pour l'autre.

| Sous-produit | Vient de | Sert à |
|---|---|---|
| **Cendres** | Tout feu | Lessive (potasse) → **savon** (avec de la graisse), amendement du sol |
| **Poussier de charbon** | Charbonnière | **Filtres à eau**, amendement |
| **Goudron de bois** | Charbonnière en fût (palier III) | Imperméabilisation, colle, entretien du cuir |
| **Copeaux, sciure** | Sciage, menuiserie | Allume-feu, litière, isolation |
| **Calamine, scories** | Forge, fonderie | Déchet (peut lester) |
| **Fumée** | Combustion | **Fumage des aliments** (conservation) |
| **Chaleur perdue** | Four, forge | **Séchoir** à côté du four : le bois sèche plus vite |
| **Petit plomb, chutes de métal** | Coulée, découpe | Refonte |

---

## 12. Exemples de chaînes complètes

### 12.1 Un même objet, trois voies : la lame de couteau

**Matière commune :** un ressort à lames de voiture (acier à ressort, excellent pour une lame).

| | 🔥 Forge | ⚡ Meuleuse électrique | ⚙️ Meule à pédale |
|---|---|---|---|
| **Principe** | Chauffer, forger, tremper, revenir | Découper et meuler à froid, sans perdre la trempe d'origine | Meuler à froid, lentement |
| **Installation** | Forge ventilée (II) | Atelier électrique (II) | Pédalier universel + meule (I) |
| Ressort à lames | 50 wotts | 50 wotts | 50 wotts |
| Énergie | 1,25 kg de charbon : **59 wotts** | 333 Wh_é (20 min à 1 kW) : **333 wotts** | Compris dans le travail |
| Consommables rares | — | 2 disques abrasifs : **100 wotts** | — |
| Travail | 1 h 30 lourd, 450 kcal : **90 wotts** | 1 h de finition, 150 kcal : **30 wotts** | 6 h de pédalage + 1 h de finition, 2 250 kcal : **450 wotts** |
| **Énergie grise** | **≈ 200 wotts** | **≈ 513 wotts** | **≈ 500 wotts** |
| Avec le bonus natif | ≈ 185 wotts | (pas de bonus sur la meuleuse) | ≈ 400 wotts |
| **Temps actif** | 1 h 30 | 1 h 20 | 7 h (passif avec une roue hydraulique) |
| **Signature** | Sonore 40 m, olfactive 50 m | **Sonore 60 m** (20 min) | Sonore 15 m |
| **Point faible** | Bruit, odeur, forge à construire | Une batterie de voiture vidée, des disques introuvables | Une journée de nourriture et des heures de travail |

**Lecture :**

- La lame est un **domaine des Charbonniers**. Ils la font 2,5 fois moins cher que les autres.
- Les deux autres familles **peuvent** se débrouiller seules, à un coût plus élevé mais pas absurde (moins de 3 fois plus).
- Le plus rentable pour un Voltaïque ou un Mécaniste est **d'acheter la lame** à un Charbonnier. C'est le commerce voulu.
- Le prix de base de la lame est celui du **procédé de référence**, c'est-à-dire la voie la moins chère, sans bonus : **≈ 200 wotts**.

### 12.2 Le charbon de bois

| Étape | Détail | Coût |
|---|---|---|
| Collecte | 100 kg de bois sec (10 h de collecte, ou achat) | 800 wotts |
| Montage de la meule | 4 h de travail lourd (1 200 kcal) | 240 wotts |
| Combustion | **Passive, 3 jours.** 3 surveillances de 15 min. **Fumée visible et odeur à 150 m pendant tout ce temps.** | — |
| **Sortie** | **≈ 22 kg de charbon de bois** (rendement réaliste de 20 à 25 % en masse), plus du poussier et de la fumée (fumage possible à côté) | **≈ 47 wotts/kg** |

> Le charbon de bois perd plus de la moitié de l'énergie du bois, mais il atteint 1 300 °C, ce que le bois ne fait pas. C'est l'exemple parfait d'une énergie qui vaut par sa **qualité** et pas par sa quantité.
>
> Avec une **charbonnière en fût** (palier III), le rendement monte à ≈ 30 % et on récupère le goudron de bois.

### 12.3 La chaux et le mortier

| Étape | Détail | Coût |
|---|---|---|
| Collecte | 10 kg de calcaire | 36 wotts |
| Cuisson | Four à chaux, ≈ 900 °C, ≈ 22 000 Wh_th (≈ 5 kg de bois). **Passive, 1 jour.** | 40 wotts |
| Chargement et défournement | 1 h de travail moyen (250 kcal) | 50 wotts |
| **Sortie** | **≈ 5,6 kg de chaux vive** (la cuisson libère le CO₂ du calcaire, d'où la perte de masse) | **≈ 22,5 wotts/kg** |
| Extinction | Ajout d'eau → chaux éteinte. **Dégage beaucoup de chaleur : risque de brûlure.** | — |
| Mortier | 1 volume de chaux pour 3 volumes de sable | — |

**Usages de la chaux :** mortier et enduit (murs en pierre), désinfection, épilage des peaux avant tannage, chaulage des sols.

### 12.4 Le pain : une chaîne entre familles

| Étape | Qui le fait le mieux | Coût |
|---|---|---|
| Culture du blé | ⚙️ Mécanistes (pompe à eau, outils agricoles) | ≈ 60 wotts/kg (≈ 1 h de travail par kg en culture manuelle) |
| Mouture : 1 kg de blé → farine | ⚙️ **Meule à pédale** : 1 h de pédalage modéré (≈ 70 W, moins que les 100 W du pédalage soutenu, Book 01 §2), 250 kcal = 50 wotts (≈ 38 avec le bonus). **Moulin (eau, vent ou manège) : quasi gratuit**, et il tourne hors ligne tant que sa trémie contient du grain. | 38 à 50 wotts |
| Cuisson | 🔥 **Four à pain** : chauffé pour 10 pains avec 20 kg de bois, soit 16 wotts par pain | 16 wotts |
| Façonnage | Tous : 30 min, 100 kcal | 20 wotts |
| **1 kg de pain** | **≈ 2 500 kcal de nourriture** | **≈ 150 wotts d'énergie grise** |

> **La nourriture vaut son énergie grise.** Un kilo de pain vaut environ 150 wotts, soit ≈ 0,06 wott/kcal, et nourrit pendant une journée. Le travail, lui, est payé 0,2 wott/kcal (Book 01 §6) : une journée de travail rapporte donc environ 3 fois la nourriture qu'elle consomme. C'est réaliste (l'agriculture rend plus d'énergie qu'elle n'en coûte), et c'est voulu : ce **surplus agricole** fait vivre tous les métiers et pousse à **passer de la récupération à la production**. Il ne crée pas de wotts : le pain se vend sur la trésorerie d'un comptoir ou à un autre joueur.
>
> **Le pain est périssable** (quelques jours, Book 11 §11). Ce qui se garde, c'est le grain, avec des pertes au stockage : on moud et on cuit au fur et à mesure.

---

## 13. Le crafting dans l'interface

### Fiche d'objet

```
┌─────────────────────────────────────────────────────┐
│  Couteau à lame de ressort                  ★★★★☆   │
│                                                     │
│  Énergie grise : 199 wotts                          │
│    ├ matière   ressort à lames (vestige) ...... 50  │
│    ├ chaleur   1,25 kg de charbon de bois ..... 59  │
│    └ travail   450 kcal ....................... 90  │
│                                                     │
│  Fabriqué par  Marthe (Charbonnière)                │
│  Installation  forge ventilée ★★★★                  │
│  Durabilité    140 / 150                            │
│  Cours actuel  230 wotts (comptoir de la Vallée)    │
└─────────────────────────────────────────────────────┘
```

- **L'énergie grise est toujours visible.** Le joueur apprend sans y penser ce que coûtent les choses.
- **La marque du fabricant** est conservée. Un bon artisan se fait un nom, ce qui donne un rôle social au crafting.
- **Le cours actuel** est comparé à l'énergie grise : le joueur voit tout de suite s'il gagne à produire ou à acheter.

### Écran de recette

Pour chaque recette, l'écran indique :

- les voies disponibles, avec leur coût total et leur coût dominant ;
- ce qui manque (matière, outil, installation, savoir), avec un lien vers l'endroit où l'obtenir ;
- la **qualité prévue**, et le maillon faible qui la limite ;
- la **signature** de l'opération, avant de la lancer.

---

## 14. Les premières heures d'un nouveau joueur

Le crafting doit être accessible **sans rien** et devenir profond **avec le temps**.

| Étape | Ce que fait le joueur | Ce qu'il apprend |
|---|---|---|
| 1 | Explore son terrain : bois mort, pierres, vestige sur place (ruine de ferme) | Ressources et vestiges |
| 2 | Allume un **feu de camp** (briquet du kit de départ) | Énergie thermique, signature |
| 3 | **Fait bouillir de l'eau** | Eau potable, coût en bois |
| 4 | Monte un **abri** (branches + bâche récupérée) | Construction |
| 5 | **Démonte** un vestige (vieux vélo, outils rouillés) | Choix usage direct / démontage |
| 6 | **Répare** un outil trouvé (remmancher une hache) | Outils, durabilité |
| 7 | Construit sa **première installation native** | Identité de famille |
| 8 | Premier voyage vers un **lieu proche** | Monde, risque, retour |

> **Depuis la 0.7**, ces premières heures suivent l'**arbre de progression** (§14 quater) : le premier clic sur Fabriquer ne montre que **deux cartes**, le feu de camp et l'abri ; les autres recettes viennent quand le personnage **y pense**, et chaque étape du tutoriel qui fait fabriquer trouve sa recette déjà dévoilée.

### Kit de départ (proposition)

Commun à tous : couteau abîmé, briquet, gourde, bâche, sac à dos.

| Famille | En plus |
|---|---|
| 🔥 Charbonniers | Pierre à feu (allumage illimité), marteau |
| ⚡ Voltaïques | Lampe à dynamo, multimètre, petite batterie |
| ⚙️ Mécanistes | Scie à bois, rouleau de corde |

---

## 14 bis. La gamme bushcraft (proposition P-002, retenue le 2026-10-08)

Une quarantaine d'objets bushcraft étaient proposés, rangés par besoin (l'ordre de l'urgence : s'abriter, le feu, l'eau, se nourrir, porter, se défendre, se soigner). **On les filtre** avant de les construire, avec quatre questions :

1. **L'objet a-t-il un effet dans un système qui existe ?** Sinon c'est un objet mort, qui attend son système : l'étendoir attend les vêtements mouillés, l'attelle les fractures, la tisane de saule la fièvre, les feuillées la dysenterie, l'aiguille d'os la couture, le panier et la claie de séchage la conservation (0b).
2. **Demande-t-il une matière nouvelle ?** Chaque matière à ramasser (écorce, résine, argile, sable, fougères) coûte un modèle 3D, des points de ramassage et une icône (Book 21 §5) : on les ajoute par petits groupes, quand plusieurs objets en ont besoin.
3. **Fait-il doublon ?** La cache enterrée garde ses objets après un effondrement… mais le coffre le fait déjà, puisque le terrain ne se perd pas. Écartée.
4. **Casse-t-il un métier ou un échange ?** La pierre à aiguiser rendrait inutile la meule des Mécanistes ; la torche de résine pour tous, les lumières de famille qu'on échange. Écartées pour l'instant.

**Lot 1 (0.2) : rien que des matières qu'on a déjà**, branché sur des systèmes qui existent :

| Objet | Matières | Outil | Effet |
|---|---|---|---|
| **Ficelle** | 2 fibres | — | Lien fin : alarme, protège-bras |
| **Bâton à fouir** | 1 branche | Couper 1, près d'un feu | **Creuser 1** (nouvelle qualité d'outil) |
| **Foyer Dakota** | 3 branches, pas de pierres | Creuser 1 | Un feu creusé : bois brûlé ×0,6, lumière la nuit ×0,3, odeur ×0,4 (portée de la signature, Book 06) |
| **Récupérateur de pluie** | 1 bâche, 4 branches, 1 corde | Couper 1 | Processus passif : ≈ 0,5 L par minute réelle de pluie, 5 L au plus, même hors ligne. **L'eau de pluie se boit sans bouillir** (mélangée à de l'eau brute, non). La bâche : la benne du camion, à la halte |
| **Lit de branchages** | 6 branches | Couper 1 | Sommeil +30 % ; à moins de 3 m de l'abri, il s'ajoute à l'abri |
| **Alarme à boîtes de conserve** | 2 boîtes vides, 1 ficelle, 2 branches | — | Un Éteint à moins de 2,5 m : elle tinte (son, message). C'est aussi un **leurre** : un bruit de 14 m de portée |
| **Protège-bras de fortune** | 2 chiffons, 1 ficelle | Couper 1 | Une morsure sur deux glisse dessus ; il se déchire une fois sur quatre |
| **Épieu durci au feu** | 2 branches | Couper 1, près d'un feu | Arme : peu de dégâts (0,8), la plus longue allonge (2,3 m) : on le tient à distance |
| **Travois** | 6 branches, 2 cordes | Couper 1 | +50 kg traînés ; chargé au-delà du sac, on ne court plus |
| **Boîte de conserve vide** | — | — | Rien ne se perd : manger une conserve laisse sa boîte |

Le lit et l'alarme sont de **petites installations** : on peut les poser à 1,2 m des autres (le lit à côté de l'abri).

**Lots suivants**, dans l'ordre de ce qui rapporte le plus au joueur : l'archet à feu quand le briquet s'usera ; la claie de séchage et le panier avec la conservation (0b) ; le bûcher couvert avec le bois humide (0b) ; le collet et la nasse quand la faune sera côté serveur ; l'écorce de bouleau et la résine quand assez d'objets en auront besoin.

---

## 14 ter. Le panneau Fabriquer rangé par catégories (avis de Sally, 2026-10-08)

On range les recettes selon **ce à quoi sert l'objet**, pas selon ses ingrédients. Chaque recette a **une seule** catégorie : c'est un champ obligatoire de `Recette` (`categorie`), donc une recette ne peut pas être oubliée.

| Onglet | Contenu (2026-10-08) |
|---|---|
| 🔥 **Feu** (feu et cuisine) | feu de camp, foyer Dakota, plats cuisinés, volaille |
| 🪓 **Outils** (outils et armes) | hache, gourdin, épieu, bâton à fouir, lame forgée |
| 🎒 **Sur soi** | sac de fortune, protège-bras, pansement, travois |
| 🧵 **Matériaux** | ficelle, corde (et les matériaux intermédiaires à venir) |
| 🧱 **Bâtir** (vivre au camp) | abri, coffre, lit, escabeau, alarme, récupérateur d'eau ; plus tard sols et murs |
| ⚙️ **Ateliers** (fabriquer, produire) | établi, charbonnière, forge, pédalier, banc de recharge, panneau solaire |

- **La règle des cas limites** : une installation qui fabrique ou produit de l'énergie va dans **Ateliers** ; une installation qui sert à vivre au camp va dans **Bâtir**.
- **« Tout »** est le premier onglet et le filet de sécurité : il montre toutes les recettes, regroupées sous des intertitres.
- **« Faisable maintenant »** est un filtre, pas un onglet.
- **Les compteurs** : une pastille sur chaque onglet donne le nombre de recettes faisables, seulement s'il y en a.
- **L'ordre** ne bouge jamais sous le doigt.
- **La famille** n'est pas une catégorie : c'est un badge sur la carte de recette.
- **Le dernier onglet** est gardé sur l'appareil. Pendant le tutoriel, on ouvre toujours sur « Tout ».
- **En téléphone horizontal**, les onglets n'ont que leur icône.
- **Les améliorations sur place** (Book 24) n'auront pas d'onglet à elles : le bouton « Améliorer » est sur l'installation, dans le monde.
- **À tester** : la frontière entre Bâtir et Ateliers, sur quelques joueurs.
- **Depuis la 0.7**, le panneau ne montre que les recettes **dévoilées**, et la barre d'onglets n'apparaît qu'à 8 recettes (§14 quater).

## 14 quater. L'arbre de progression : on y pense au bon moment (0.7, 2026-10-09)

Demande du porteur : « afficher les crafts progressivement, pour que le nouveau joueur soit obligé de commencer par un feu ou un abri et qu'il ne soit pas noyé sous tous les crafts possibles », avec un arbre « logique, qui respecte la pyramide de Maslow et cohérent en termes de gameplay ». Avant la 0.7, un nouveau joueur voyait **plus de cent cartes** au premier clic sur Fabriquer (59 à 64 de sa famille et communes, et 44 à 49 grisées des autres familles), sur un iPhone 13 mini. **Construit en 0.7** ; la table complète est en **annexe A**.

### Le principe : connu n'est pas dévoilé

- Tout survivant **sait** faire un feu, un abri, remmancher, panser (Book 03 §5.2). On ne lui fait pas « apprendre » le feu : on règle son **attention**. Une recette commune ou de sa famille est **connue**, mais elle n'apparaît dans Fabriquer qu'une fois **dévoilée** : quand le personnage en a eu **besoin**, ou qu'il a **tenu l'ingrédient clé**.
- Le mot du jeu : **« Tu y penses »** (dévoiler), jamais « tu apprends », réservé à la leçon et au manuel des autres familles (Book 25 §2.3).
- Une recette dévoilée **le reste** : à l'effondrement, d'une session à l'autre. Elle s'efface en fin de cycle, avec le reste.
- Le savoir des **autres familles** garde sa règle (leçon, manuel, ×1,5, ★★) ; seul change le moment où l'on en voit les cartes grisées (ci-dessous).

### Les cinq paliers, calqués sur Maslow

| Palier | Maslow | Dans *Watt Now?* | Recettes (code 0.7) |
|---|---|---|---|
| **1 · Le corps** | Physiologique | Chaleur, dormir, boire, manger | 14 (avec les cartes Feu de camp et Foyer Dakota) |
| **2 · À l'abri du danger** | Sécurité | S'outiller, se défendre, se cacher, se soigner, ranger | 17 |
| **3 · Les tiens, puis les autres** | Appartenance | 3a : l'atelier et l'arme de sa famille ; 3b : le Comptoir, la rencontre, les pièces à vendre | 35 |
| **4 · Le métier** | Estime | Toute la gamme de sa famille, l'arc vrai | 31 |
| **5 · L'œuvre** | Accomplissement | Les pièces à deux ou trois familles | 12 |

Les paliers **ne sont pas des niveaux** : aucune jauge, aucun « palier 3 atteint ». Une recette s'ouvre dès que **l'un** de ses déclencheurs est vrai. Le palier sert à concevoir, à régler le rythme et à choisir les silhouettes « À découvrir ».

### Les six règles

1. **Premier écran : deux cartes**, le feu de camp et l'abri (décision Q3).
2. **Un déclencheur lié à l'action**, jamais un compteur abstrait : on **tient** l'ingrédient clé (« vu : X » : l'objet est entré une fois dans le sac), on a **fabriqué** la recette d'avant, on a **ressenti** un besoin (nuit, sommeil bas, morsure, sac trop lourd, arbre trop haut), on a **vu** quelque chose (un Éteint, la pluie).
3. **Plusieurs déclencheurs par recette, reliés par « ou »** : personne ne reste bloqué parce qu'il n'a pas vécu *la* bonne scène.
4. **La chaîne tire ses maillons** : dévoiler une recette dévoile la voie de base de ses ingrédients fabricables et de son installation (le récupérateur de pluie fait penser à la corde).
5. **Le tutoriel et le carnet dévoilent ce qu'ils demandent** : chaque étape du tutoriel qui fait fabriquer (le feu, la hache, l'abri, l'atelier de famille) et chaque quête en cours (« Forger une lame » : la lame et sa forge). Le carnet ne demande jamais une recette invisible.
6. **Le serveur constate et refuse** (décision Q1) : tout déclencheur se vérifie côté serveur, et le serveur refuse de fabriquer une recette non dévoilée (« Tu n'y as pas encore pensé. »). En jeu normal, ce cas n'arrive pas, puisque le client ne montre pas la recette : c'est un filet de sécurité.

### Les seuils

- **Le seuil S, « ton métier commence »** : l'abri posé **et** un premier danger surmonté (un Éteint détruit, ou une nuit dormie), **ou** l'étape « La famille » du tutoriel, **ou** 2 h de jeu. Il dévoile l'**atelier** de la famille (foyer de forge, banc de recharge, pédalier) et son **arme de métier** ; rien du métier ne se dévoile avant l'atelier, sauf ce qu'une quête demande. Pendant le tutoriel, l'Éteint scénarisé ne compte pas : le seuil tombe **pile** à l'étape « La famille », avant « La nuit » (décision Q9). Message, une seule fois : « Ton métier commence : le foyer de forge t'attend dans Fabriquer. »
- **Le déclencheur A, « les autres »** : une visite au Comptoir, un échange, **une rencontre** (rester une minute à moins de 3 m d'un joueur d'une autre famille) ou **voir faire** (être à moins de 5 m d'un joueur qui fabrique). Il ouvre les pièces qu'on vend aux autres (rivets, pointes, lampe bricolée) et les cartes grisées des autres familles.
- **Voir faire** (décision Q7) : une recette commune ou de sa famille qu'on a vu fabriquer se dévoile ; celle d'une autre famille s'affiche grisée et dépliée.
- **Au palier 5, la rencontre est un raccourci, pas une porte** : le Charbonnier seul ouvre le ressort retrempé et les électrodes par la **pratique** (5 lames forgées, avec A), comme le veut la règle d'or (Book 25 §2.5).

### Le rythme (décision Q5 : rapide au début pour accrocher, puis régulier)

- **Le filet du temps** : au plus tard après **20 min** de jeu connecté, tout le palier 1 est dévoilé ; après **1 h**, tout le palier 2 ; après **2 h**, le seuil S tombe de lui-même.
- **Le vétéran qui saute le tutoriel**, et les comptes créés sans tutoriel, ont les **paliers 1 et 2 d'emblée** (décision Q8).
- **Mesuré** par `npm run rythme` (neuf parcours types : prudent, pressé, sans tutoriel, pour chaque famille ; 300 min simulées) : dans les 30 premières minutes, **15 à 24 nouveautés** (recettes ou buts) selon le joueur, jamais plus de 4,5 min sans rien (10 min pour le vétéran, qui a déjà tout le début) ; ensuite, un but nouveau au plus tard toutes les **13,5 à 23 min** jusqu'au dernier objectif du carnet ; **aucun blocage**, chaque ingrédient demandé se trouve. Cible : 10 nouveautés en 30 min, un but toutes les 20 min ; le joueur prudent (×1,3 plus lent) la dépasse un peu, à surveiller au test familial.
- **Un message au plus toutes les 10 s** : « Tu y penses : tresser une corde. », ou, regroupées, « Tu y penses : 3 idées nouvelles dans Fabriquer. »

### Les personnages d'avant la 0.7 (décision Q4)

- L'arbre **s'applique à eux aussi** : ils **ne voient plus** ce qu'ils n'ont pas encore validé.
- **On ne détruit rien** : leurs installations, leurs objets, leurs fabrications restent. Ce qu'ils ont déjà fabriqué ou posé compte comme vécu : ces recettes-là restent dévoilées.
- La migration se fait une fois, à la première connexion en 0.7 (colonne `progression` du personnage, vide avant).

### Le panneau Fabriquer (décisions Q2, Q6 et « pastille »)

- **Moins de 8 recettes dévoilées : pas de barre d'onglets**, une seule liste. **À 8**, toute la barre apparaît, une fois pour toutes, dans son ordre fixe (§14 ter) ; un onglet encore vide est **atténué**, pas caché : les onglets ne bougent jamais.
- **L'en-tête** : « 23 recettes · 3 à découvrir ».
- **« Nouveau »** : la carte d'une recette dévoilée porte l'étiquette et un **liseré doré** jusqu'à ce qu'elle ait été montrée ; elle passe **en tête de son onglet** le temps d'une ouverture, puis reprend sa place (on ne réordonne qu'à l'ouverture du panneau : l'ordre ne bouge pas sous le doigt). Le « vu » est gardé par le serveur : le téléphone et l'ordinateur sont d'accord.
- **La pastille** (décision du porteur) : une **pastille rouge dans le coin du bouton Fabriquer**, qui compte les recettes nouvelles non regardées, **et** un point rouge sur l'**onglet** concerné (par exemple Matériaux).
- **« À découvrir »** (décision Q2) : en bas du panneau, les **silhouettes des recettes du prochain palier** (celui dont une recette reste à dévoiler), celles que demande une quête en cours d'abord. L'icône assombrie, **pas de nom**, une ligne d'**indice** qui dit le besoin, jamais la solution ni le lieu (« Dormir par terre, c'est dormir à moitié. »). **Trois** d'abord, « Voir les N autres » pour le reste. La section est dépliée la première fois, puis repliée sur téléphone. « Faisable maintenant » la cache aussi.
- **Les cartes grisées des autres familles** (décision Q6) : **cachées** jusqu'au déclencheur A ; ensuite **une ligne repliée par famille** (« Chez les Voltaïques · 20 recettes »), qu'on déplie d'un doigt. Se montrent **une à une, dépliées** : celle qu'on a vu faire, celle dont on tient le produit, celle qui est la pièce d'une recette qu'on voit. La leçon et le manuel **dévoilent** en même temps qu'ils apprennent.
- **« Il manque… »** ne cite plus une recette cachée : « ça se fabrique (tu y penseras) ».

### Ce que garde le serveur

Par personnage, une liste courte (colonne `progression`, en JSON) : les recettes **dévoilées** (dans l'ordre), celles **pas encore vues** (la pastille), les **types d'objets entrés une fois dans le sac** (le « vu : X ») et le **temps de jeu connecté** (le filet). Rien ne tourne en continu : on ne réévalue que lorsque quelque chose change (un fait noté, le sac, une quête, une étape du tutoriel, une échéance du filet), au plus deux fois par seconde ; les constats d'état (sommeil bas, Éteint en vue, pluie, plaie, saisie, sac chargé) sont regardés une fois par seconde, et seulement tant qu'ils n'ont jamais été vus.

### Les fichiers

`code/commun/src/progression.ts` (la table, les déclencheurs, les calculs purs ; un test vérifie que chaque recette de `RECETTES` y a sa ligne, comme la `categorie` obligatoire), `code/serveur/src/devoilement.ts` (le suivi, la migration, les messages), `code/serveur/src/rencontres.ts` (rencontre et voir faire), `code/client/src/fabrication-arbre.ts` (ce que montre le panneau), `code/client/src/carnet-idees.ts` (« Dernière idée » dans le carnet), `code/commun/src/rythme.ts` et `code/scripts/rythme.ts` (le simulateur). **Rien ne change dans les recettes elles-mêmes.**

## 15. Règles d'équilibrage du crafting

1. **Domaines :** dans ses domaines (§6), une famille doit produire **au moins 20 % moins cher** que la moyenne des autres voies. En dessous, il n'y a pas de raison de commercer.
2. **Autonomie :** hors de ses domaines, une famille ne doit jamais payer **plus de 3 fois** le prix de la voie la moins chère. Au-delà, elle ne peut plus se débrouiller seule.
3. **Panier de survie :** le coût total d'un panier mensuel standard (nourriture, eau, chauffage, outils, réparations) produit **entièrement par soi-même** doit être égal à **±5 %** près entre les trois familles. C'est ce qui garantit que l'avantage dans un domaine est compensé ailleurs (Book 01 §7).
4. **Pas de création de wotts à partir de rien :** toute boucle « produire → vendre → racheter → produire » doit être **déficitaire ou neutre**, sauf une petite marge pour la famille native. À vérifier pour chaque nouvelle recette. Boucles connues :

| Boucle | État |
|---|---|
| Couper du bois → le vendre au pouvoir calorifique | ✅ **Corrigée** : les combustibles sont payés à leur énergie grise (Book 01 §6) |
| Pédaler au comptoir → recevoir des wotts neufs | ✅ **Corrigée** : le pédalage au comptoir est un service payé sur la trésorerie, il ne crée pas de wotts (Book 07 §3.1) |
| Acheter du pain → pédaler → déposer | ✅ **Corrigée** : ne crée plus de wotts au comptoir. À domicile, pédaler pour charger une batterie reste possible, mais le **poids des batteries** limite le dépôt (≈ 1,3 kWh par trajet avec du plomb) : le gain par minute reste du même ordre que la collecte de bois (Book 01 §2 bis). |
| Cultiver → vendre la nourriture | ✅ La nourriture se vend à son énergie grise. Le surplus vient du travail payé 0,2 wott/kcal (§12.4), sans création de wotts. À surveiller en simulation. |
| Roue hydraulique, panneaux, machine à vapeur → déposer des Wh_é | ✅ **Encadrée** : production au calendrier, consommée d'abord par les machines de la base. Seul le surplus stocké en batteries peut être porté au comptoir, qui a lui-même une capacité limitée (Book 01 §2 bis, Book 07 §3.4). |

5. **Toute voie a un coût dominant différent :** bois et bruit, électricité et pièces rares, ou calories et temps. Deux voies qui coûtent la même chose sont une voie de trop.

---

## 16. Format des données (pour le développement)

Les recettes sont des **données**, pas du code. On peut en ajouter sans toucher au moteur, et l'énergie grise se calcule automatiquement.

```json
{
  "id": "lame_couteau.forge",
  "produit": "lame_couteau",
  "voie": "forge",
  "famille_native": "charbonniers",
  "entrees": [{ "item": "ressort_a_lames", "qte": 1 }],
  "outils": [
    { "item": "marteau", "usure": 2 },
    { "item": "pinces_forge", "usure": 1 },
    { "item": "enclume", "usure": 0 }
  ],
  "installation": { "type": "forge_ventilee", "temperature_min": 900 },
  "energie": { "forme": "th", "wh": 10000 },
  "travail": { "duree_h": 1.5, "intensite": "lourde" },
  "savoir": { "recette": "forge_2", "stats": { "DEX": 9 } },
  "sorties": [
    { "item": "lame_couteau", "qte": 1 },
    { "item": "calamine", "qte": 0.05 }
  ],
  "signature": { "sonore_m": 40, "olfactive_m": 50 },
  "processus": "actif"
}
```

---

## 17. Questions ouvertes

- [x] **Temps de jeu et temps réel :** ✅ **deux horloges** (Book 01 §2 bis). Les actions et processus courts suivent l'horloge d'action (1 h de jeu = 1 min réelle : la lame à la meule à pédale prend 7 minutes). Les processus longs (séchage, tannage, cultures) suivent le calendrier (1 saison = 1 semaine réelle).
- [x] **Courant propre et outils bruyants :** ✅ le trait couvre la production et le stockage. **Tous les outils font du bruit**, électriques ou manuels (§7).
- [x] **Signature cumulée :** ✅ définie au Book 06 : attention = intensité × durée (§3.1), pression de signature d'un terrain (§6.2).
- [x] **Rente hydraulique et solaire :** ✅ production au calendrier, consommée sur place, surplus limité aux batteries (Book 01 §2 bis). La capacité limitée des comptoirs reste un garde-fou (Book 07 §3.4).
- [x] **Cours de la kcal :** ✅ 0,2 wott/kcal pour le **travail** seulement. La nourriture se vend à son énergie grise (≈ 0,06 wott/kcal). Le surplus qui en découle est voulu, son ampleur reste à vérifier en simulation.
- [ ] **Qualité :** échelle à 5 niveaux et règle du maillon faible, à valider.
- [ ] **Kit de départ :** à valider, et à équilibrer en énergie grise (les trois kits doivent avoir la même valeur).
- [ ] **Arbre complet des recettes :** à construire, sans doute dans un book par famille. *(0.7 : l'arbre de **progression** des 107 recettes existantes, c'est-à-dire l'ordre dans lequel on y pense, est construit : §14 quater et annexe A. L'arbre complet des recettes à venir reste à faire.)*

---

## Glossaire

- **Voie** : une façon de fabriquer un objet. Un même objet peut avoir plusieurs voies, en général une par famille.
- **Procédé de référence** : la voie la moins chère sans bonus de famille. Elle fixe le prix de base.
- **Outil de fortune** : objet utilisé à la place de l'outil adapté, avec un malus.
- **Maillon faible** : la qualité d'un produit est plafonnée par la plus faible de ses matières, de ses outils ou de son installation.
- **Processus passif** : transformation qui continue sans le joueur, même hors ligne.
- **Sous-produit** : ce qu'une recette produit en plus de l'objet recherché.
- **Domaine** : catégorie de production où une famille est la moins chère.
- **Recette dévoilée** : recette connue à laquelle le personnage a pensé (§14 quater) ; seules celles-là s'affichent dans Fabriquer et se fabriquent.
- **Palier** : une des cinq familles de déclencheurs de l'arbre de progression (le corps, l'abri du danger, les tiens puis les autres, le métier, l'œuvre). Pas un niveau.
- **Silhouette « À découvrir »** : une recette du prochain palier, montrée sans nom, l'icône assombrie, avec un indice qui dit le besoin.

---

## Annexe A. La table complète de l'arbre de progression (code 0.7)

Tirée de `code/commun/src/progression.ts` (2026-10-09) : 107 recettes et les deux cartes à part (Feu de camp, Foyer Dakota). Une recette se dévoile dès que **l'un** de ses déclencheurs est vrai (séparés par « · »). En plus de ses déclencheurs, toute recette se dévoile aussi : si on l'a **vu faire** ; si le **tutoriel** ou une **quête en cours** la demande (règle 5) ; si on l'a **déjà fabriquée** ; par le **filet du temps** de son palier ; par la **chaîne** d'une recette dévoilée (règle 4). Une recette de famille autre que l'atelier attend l'atelier, sauf demande d'une quête.

**Notation** : « vu : X » = l'objet X est entré au moins une fois dans le sac ; « fait : R » = la recette R a été fabriquée (ou son installation posée) ; **seuil S** = l'abri et un premier danger surmonté, ou l'étape « La famille » du tutoriel, ou 2 h de jeu ; **A** = le Comptoir, un échange, une rencontre d'une autre famille ou avoir vu faire ; « « R » dévoilée » = la recette R est déjà dans Fabriquer. Les indices font environ 60 caractères : le besoin, jamais la solution ni le lieu.

#### Palier 1 · Le corps (14) · filet du temps : 20 min

| Recette | Famille | Déclencheurs (l'un ou l'autre) | Indice « À découvrir » |
|---|---|---|---|
| Feu de camp | Tous | **d'emblée** | Chaleur, eau bouillie, cuisine : tout commence là. |
| Abri de branches et de bâche | Tous | **d'emblée** | Un toit pour dormir deux fois mieux. |
| Lit de branchages | Tous | fait : Abri de branches et de bâche · une nuit dormie · sommeil sous la moitié · quête « Un vrai lit » | Dormir par terre, c'est dormir à moitié. |
| Rouler une ficelle | Tous | vu : poignée de fibres | Des fibres au bord de l'eau, et tes doigts. |
| Tresser une corde | Tous | vu : poignée de fibres | Plus solide qu'une ficelle, pour ce qui pèse. |
| Récupérateur de pluie | Tous | la pluie · 3e ébullition · quête « L'eau du ciel » | Bouillir l'eau coûte du bois. Le ciel, lui, la donne. |
| Plumer et vider la poule | Tous | vu : poule | Une poule, ça ne se mange pas avec les plumes. |
| Poêlée de cèpes | Tous | vu : cèpe · quête « Un vrai repas » | Ce qui pousse sous les arbres, cuit, cale bien. |
| Volaille aux cèpes | Tous | vu : portion de volaille crue **et** vu : cèpe · quête « Un vrai repas » | Le vrai repas : de la viande et ce qui l'accompagne. |
| Pommes cuites sous la cendre | Tous | vu : pomme · quête « Un vrai repas » | Un fruit sous la cendre devient un dessert. |
| Escabeau de bois | Tous | un arbre hors de portée | Les plus belles pommes sont toujours en haut. |
| Soupe de cèpes | Tous | (foyer de cuisine ou foyer de niveau 3) · quête « Une vraie cuisine » | Un mijoté nourrit et désaltère à la fois. |
| Pot-au-feu de volaille | Tous | (foyer de cuisine ou foyer de niveau 3) · quête « Une vraie cuisine » | Ce qui mijote longtemps cale longtemps. |
| Foyer Dakota | Tous | vu : bâton à fouir ou bêche · quête « Un feu qui ne se voit pas » | Un feu qui ne se voit pas de loin. |

#### Palier 2 · À l'abri du danger (17) · filet du temps : 60 min

| Recette | Famille | Déclencheurs (l'un ou l'autre) | Indice « À découvrir » |
|---|---|---|---|
| Remmancher la hache | Tous | vu : tête de hache · tutoriel, étape « L'outil » | Une tête d'outil sans manche ne sert à rien. |
| Établi | Tous | fait : Remmancher la hache · vu : hache remmanchée ou perche de frêne | Les gestes fins demandent un plan de travail. |
| Tailler un gourdin | Tous | premier feu allumé · un Éteint en vue · quête « De quoi se défendre » | Les poings, c'est pour les films. |
| Épieu durci au feu | Tous | un Éteint en vue · fait : Tailler un gourdin · quête « De quoi se défendre » | Mieux vaut les tenir à distance. |
| Lance (épieu et couteau ligaturé) | Tous | fait : Épieu durci au feu | Une pointe d'acier au bout du bois. |
| Arc de fortune (branche droite) | Tous | un Éteint détruit · quête « Le premier arc » | Frapper de plus loin, la prochaine fois. |
| Arc de fortune (perche de frêne) | Tous | vu : perche de frêne · un Éteint détruit · quête « Le premier arc » | Frapper avant d'être saisi. |
| Flèches durcies au feu | Tous | un arc de fortune fait · un arc en main | Un arc sans flèches, c'est un bâton. |
| Flèches à pointe d'os | Tous | vu : os de poule **et** un arc en main | Une pointe plus dure que le bois. |
| Flèches à pointe de clou (douze) | Tous | vu : bocal de clous et vis mélangés **et** un arc en main | Des pointes toutes faites, par douzaines. |
| Bâton à fouir | Tous | une nuit dormie · quête « Un feu qui ne se voit pas » | La nuit, toute lumière se voit de loin. |
| Alarme à boîtes de conserve | Tous | vu : boîte de conserve vide **et** (une nuit dormie ou un Éteint en vue) · quête « Être prévenu » | Être prévenu avant qu'ils arrivent. |
| Pansements | Tous | vu : chiffon · une plaie · quête « Se soigner » | Un chiffon propre vaut de l'or quand ça saigne. |
| Protège-bras de fortune | Tous | saisi · mordu · quête « Là où ils mordent » | Ils mordent l'avant-bras qu'on lève. |
| Coffre de rangement | Tous | sac chargé à 70 % · 2 nuits dormies · quête « Un coffre à soi » | Quand ton sac pèsera trop lourd… |
| Sac de fortune | Tous | sans sac | Sans sac, tes poches ne portent pas grand-chose. |
| Travois | Tous | trop lourd pour ramasser · quête « Traîner plus lourd » | Ce qu'on ne porte pas, on le traîne. |

#### Palier 3 · Les tiens, puis les autres (35)

| Recette | Famille | Déclencheurs (l'un ou l'autre) | Indice « À découvrir » |
|---|---|---|---|
| Foyer de forge | 🔥 | **seuil S** | Quand tu auras un toit et tenu tête une fois… |
| Meule de charbonnière | 🔥 | fait : Foyer de forge · quête « La charbonnière » | Ta forge aura faim d'un feu plus chaud. |
| Forger un couteau (fer doux) | 🔥 | (premier charbon défourné ou vu : kilo de charbon de bois) · quête « Forger une lame » | Ton premier charbon, ta première lame. |
| Forger un couteau | 🔥 | (premier charbon défourné ou vu : kilo de charbon de bois) **et** vu : lame de ressort | Un bon acier de ressort fait une bonne lame. |
| Forger un couteau (lime usée) | 🔥 | (premier charbon défourné ou vu : kilo de charbon de bois) **et** vu : lime usée | Le meilleur acier dort dans les vieux outils. |
| Forger une machette (fer doux) | 🔥 | **seuil S** · un couteau forgé · quête « La trempe » | Ton arme de métier : plus longue qu'un couteau. |
| Forger une machette | 🔥 | un couteau forgé **et** vu : lame de ressort | Une longue lame dans un bon acier. |
| Forger une machette (lames ébréchées) | 🔥 | un couteau forgé **et** vu : lame ébréchée | Deux lames cassées en font une neuve. |
| Forger de nouveau une lame ébréchée | 🔥 | vu : lame ébréchée | Une lame cassée n'est pas perdue. |
| Banc de recharge | ⚡ | **seuil S** | Quand tu auras un toit et tenu tête une fois… |
| Matraque de fortune | ⚡ | **seuil S** · fait : Banc de recharge · vu : appareil photo jetable | Ton arme de métier : le silence qui mord. |
| Module de décharge (flash) | ⚡ | vu : appareil photo jetable | Un flash garde une belle décharge en réserve. |
| Poser le panneau solaire | ⚡ | vu : petit panneau solaire · quête « Le panneau de la station » · quête « Installer le panneau » | Le soleil donne, encore faut-il le recueillir. |
| Monter un pack de cellules | ⚡ | vu : cellule lithium · quête « Du courant en poche » | Des petites piles ensemble font une vraie batterie. |
| Module de décharge (raquette) | ⚡ | vu : raquette anti-moustiques · quête « La Raquette » | Ce qui grillait les moustiques peut servir encore. |
| Matraque électrique | ⚡ | fait : Monter un pack de cellules · un module de décharge fait · quête « La Raquette » | Une décharge qui les éteint pour de bon. |
| Pédalier universel | ⚙️ | **seuil S** · vu : cadre de vélo · quête « La meule » · quête « La dynamo » | Ce qui tourne ne meurt pas. |
| Monter l'arbalète | ⚙️ | **seuil S** · fait : Pédalier universel · quête « Le bois qui plie » | Ton arme de métier : rien à bander, tout à viser. |
| Arbrier d'arbalète | ⚙️ | « Monter l'arbalète » dévoilée | Le corps de l'arme, taillé dans une bûche. |
| Noix et détente (bois) | ⚙️ | « Monter l'arbalète » dévoilée | Ce qui retient la corde jusqu'au tir. |
| Arc d'arbalète (frêne) | ⚙️ | « Monter l'arbalète » dévoilée | Un arc court et raide pour l'arbalète. |
| Corde d'arbalète (cordes d'arc) | ⚙️ | « Monter l'arbalète » dévoilée | Une corde doublée, pour tenir la tension. |
| Arc d'arbalète (lame de ressort) | ⚙️ | vu : lame de ressort **et** « Monter l'arbalète » dévoilée | Un ressort plie mieux que le bois. |
| Noix et détente (os) | ⚙️ | vu : os de poule **et** « Monter l'arbalète » dévoilée | Un os dur tient mieux qu'un bout de bois. |
| Corde d'arbalète (ceinture de sécurité) | ⚙️ | vu : ceinture de sécurité **et** « Monter l'arbalète » dévoilée | Une sangle faite pour ne jamais lâcher. |
| Carreaux à pointe d'os | ⚙️ | fait : Monter l'arbalète · « Monter l'arbalète » dévoilée · quête « Le carreau » | Une arbalète sans carreaux, c'est un meuble. |
| Carreaux à pointe de clou | ⚙️ | vu : bocal de clous et vis mélangés **et** « Monter l'arbalète » dévoilée | Des pointes toutes faites, par douzaines. |
| Carreaux empennés de papier | ⚙️ | vu : liasse de papier **et** « Monter l'arbalète » dévoilée | Pas de plumes ? Le papier vole aussi. |
| Forger vingt rivets | 🔥 | **A** · une machette forgée · quête « Le fournisseur » | De petites pièces que les autres achètent. |
| Forger douze pointes d'acier | 🔥 | **A** · une machette forgée · vu : une flèche ou un carreau | Les flèches des autres ont besoin de pointes. |
| Forger douze pointes (fil de fer) | 🔥 | (**A** ou une machette forgée ou vu : une flèche ou un carreau) **et** vu : rouleau de fil de fer | Du fil de fer, frappé à chaud. |
| Forger deux pointes de lance | 🔥 | **A** · fait : Lance (épieu et couteau ligaturé) | Une vraie pointe, pour une vraie lance. |
| Emmancher une pointe de lance | 🔥 | fait : Forger deux pointes de lance · vu : pointe de lance forgée | L'épieu coiffé d'acier. |
| Lampe de poche bricolée | ⚡ | vu : LED **et** **A** · quête « Le courant chez les autres » | Une lumière à vendre aux autres familles. |
| Flèches à pointe d'acier | Tous | vu : pointe d'acier | Une pointe d'acier perce mieux que l'os. |

#### Palier 4 · Le métier (31)

| Recette | Famille | Déclencheurs (l'un ou l'autre) | Indice « À découvrir » |
|---|---|---|---|
| Ébaucher un arc de frêne | Tous | un arc de fortune fait · un Éteint abattu d'une flèche à la tête | Le bois vert fatigue vite : il faut un bois sec. |
| Corde d'arc (3 ficelles retordues) | Tous | un arc de fortune fait · un Éteint abattu d'une flèche à la tête | Un arc ne vaut pas mieux que sa corde. |
| Monter l'arc de frêne | Tous | un arc de fortune fait · un Éteint abattu d'une flèche à la tête | Un arc qui dure, et qui porte plus loin. |
| Corde d'arc (une corde retordue) | Tous | vu : rouleau de corde **et** « Monter l'arc de frêne » dévoilée | Une corde défaite fait une meilleure corde d'arc. |
| Corde d'arc (fil dentaire) | Tous | vu : bobine de fil dentaire **et** « Monter l'arc de frêne » dévoilée | Le fil le plus solide est dans la salle de bains. |
| Corde d'arc (boyau séché) | Tous | vu : boyau séché **et** « Monter l'arc de frêne » dévoilée | Les anciens tendaient leurs arcs autrement. |
| Ébaucher un arc d'if | Tous | vu : bâton d'if | Le meilleur bois d'arc pousse au fond du bois. |
| Monter l'arc d'if | Tous | vu : bâton d'if | Le meilleur arc, s'il sèche bien. |
| Forger des pinces de forge | 🔥 | un couteau forgé · quête « Les pinces » | Sans pinces, pas plus de deux étoiles. |
| Forger deux hachettes | 🔥 | fait : Forger des pinces de forge **et** une machette forgée · quête « La mise d'acier » | Une lame qui fend et qui se lance. |
| Forger une hache | 🔥 | fait : Forger des pinces de forge **et** une machette forgée · quête « La mise d'acier » | Les vieilles têtes rouillées ne durent pas. |
| Forger une hache (soc de charrue) | 🔥 | vu : soc de charrue | Un vieil outil des champs cache un bel acier. |
| Forger une serpe (soc de charrue) | 🔥 | vu : soc de charrue | Un vieil outil des champs cache un bel acier. |
| Forger une serpe | 🔥 | un couteau forgé | Une lame courbe pour élaguer. |
| Forger un ciseau à bois et un burin | 🔥 | fait : Forger des pinces de forge | Tailler le bois et trancher le métal. |
| Module de décharge (bobine) | ⚡ | vu : bobine d'allumage | Ce qui allumait un moteur claque plus fort. |
| Aiguillon de défense | ⚡ | une matraque électrique faite **et** fait : Épieu durci au feu | La décharge au bout d'une longue hampe. |
| Alarme électrique | ⚡ | (vu : rouleau de fil de fer ou fait : Alarme à boîtes de conserve) **et** fait : Banc de recharge · quête « Prévenu sans bruit » | Une alarme qui ne fait pas de bruit. |
| Clôture de fortune | ⚡ | fait : Module de décharge (raquette) · fait : Alarme électrique | Un fil qui mord ceux qui passent. |
| Électrificateur | ⚡ | vu : résistance chauffante | Une décharge qui revient sans cesse. |
| Clôture électrique | ⚡ | fait : Électrificateur | Un vrai enclos qui se défend seul. |
| Plaque de choc | ⚡ | vu : casserole cabossée **et** un module de décharge fait | Le sol lui-même peut mordre. |
| Bain de dérouillage | ⚡ | vu : casserole cabossée **et** vu : machette de fortune | La rouille se défait, avec un peu de courant. |
| Dérouiller une machette | ⚡ | fait : Bain de dérouillage | Une lame rouillée retrouve son tranchant. |
| Arc d'arbalète (if) | ⚙️ | vu : bâton d'if | Le meilleur bois d'arc, en court et raide. |
| Assommoir | ⚙️ | 3 Éteints détruits · fait : Monter l'arbalète · quête « Les mâchoires » | Ils reviennent : qu'un piège travaille pour toi. |
| Fosse à pieux | ⚙️ | vu : bêche | Un trou bien caché arrête net. |
| Mâchoires de fortune | ⚙️ | fait : Assommoir **et** vu : lame de ressort | Un piège qui tient au lieu d'assommer. |
| Tour à perche | ⚙️ | fait : Monter l'arbalète | Ce qui tourne façonne le bois. |
| Manche tourné | ⚙️ | fait : Tour à perche | Un manche rond et droit, fait au tour. |
| Brouette | ⚙️ | (trop lourd pour ramasser ou fait : Travois) **et** vu : roue de vélo | Ce qui roule porte plus que ce qu'on traîne. |

#### Palier 5 · L'œuvre (12)

| Recette | Famille | Déclencheurs (l'un ou l'autre) | Indice « À découvrir » |
|---|---|---|---|
| Forger un ressort retrempé | 🔥 | rencontre : un Mécaniste · **A** **et** 5 lames forgées | Un ressort qui ne casse plus, pour d'autres que toi. |
| Forger deux paires d'électrodes | 🔥 | rencontre : un Voltaïque · **A** **et** 5 lames forgées | Des pointes d'acier pour ceux qui manient le courant. |
| Forger un glaive de ressort | 🔥 | forge ventilée (forge de niveau 2) **et** vu : rivet forgé | Ta plus belle lame, quand ta forge soufflera fort. |
| Matraque à électrodes forgées | ⚡ | vu : paire d'électrodes forgées | Des électrodes forgées mordent plus fort. |
| Matraque à manche tourné | ⚡ | vu : manche tourné | Un manche tourné, une matraque qui dure. |
| Ventilateur de forge 12 V | ⚡ | vu : petit moteur · rencontre : un Charbonnier | Une forge souffle mieux avec un moteur. |
| Noix et détente (rivets forgés) | ⚙️ | vu : rivet forgé | Des rivets d'acier, une détente qui ne s'use plus. |
| Arc d'arbalète (ressort retrempé) | ⚙️ | vu : ressort retrempé | Un ressort retrempé, l'arc le plus puissant. |
| Monter l'arbalète lourde | ⚙️ | vu : ressort retrempé | Deux ressorts retrempés, une arme lourde. |
| Piège à mâchoires | ⚙️ | vu : ressort retrempé | Des mâchoires qui ne lâchent jamais. |
| Cranequin | ⚙️ | fait : Monter l'arbalète lourde **et** vu : boîte de roulements à billes | Une manivelle pour bander l'arme lourde. |
| Carreaux à pointe d'acier | ⚙️ | vu : pointe d'acier | Une pointe d'acier perce mieux que l'os. |

