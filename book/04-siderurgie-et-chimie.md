# Book 04 — Sidérurgie et Chimie

> Document de conception · version 0.5 · 2026-10-07
> Statut : **brouillon de travail**. Ordres de grandeur réalistes, valeurs à calibrer en playtest.
> S'appuie sur les books [01](01-les-trois-feux.md), [02](02-crafting.md) et [03](03-bibliotheque-et-savoir.md).
> Rappel des cours : **1 kcal = 0,2 wott** · **1 Wh_é = 1 wott** · **bois sec ≈ 8 wotts/kg** · **charbon de bois ≈ 47 wotts/kg**.

---

## 1. Pourquoi ce book

Les vestiges sont un **stock** qui s'épuise (Book 01 §2 bis). Tant que les ruines regorgent de ferraille, de produits ménagers et de batteries, personne n'a besoin de produire du fer ou des produits chimiques. Mais le monde se vide, et il faut un jour **produire à partir des flux** : minerai, bois, cendres, graisses, fruits.

Ce book décrit les deux grandes filières qui prennent le relais :

- **la sidérurgie**, pour ne plus dépendre de la ferraille ;
- **la chimie de base**, pour ne plus dépendre des produits trouvés.

> Elles sont volontairement **beaucoup plus chères** que la récupération. Ce n'est pas un défaut : c'est ce qui rend les vestiges précieux, et ce qui rend la transition progressive. Quand la ferraille se raréfie, son cours monte, jusqu'à ce que produire du fer devienne rentable.

---

## 2. La sidérurgie simplifiée

### 2.1 Le principe réaliste

On reprend la méthode qui a produit le fer pendant plus de deux mille ans : le **bas fourneau**.

- Le minerai et le charbon de bois sont chargés en couches dans une cheminée d'argile, ventilée en continu.
- Vers 1 200 °C, le charbon **réduit** le minerai : le fer se forme **sans fondre**, en une masse spongieuse, la **loupe**. Les impuretés fondent et s'écoulent : ce sont les **scories**.
- La loupe est ensuite **cinglée** (réchauffée et martelée) pour en chasser les scories : on obtient du **fer doux**.
- Le fer doux n'est pas trempable. Pour en faire de l'**acier**, on le **cémente** : on le chauffe longtemps au contact du charbon, qui lui apporte du carbone.

> **Exclu volontairement :** le haut fourneau et la fonte liquide. Trop grands, trop énergivores, hors de portée de survivants. Fondre de l'acier reste réservé au four électrique de fin de jeu (Book 01 §3), à partir de ferraille.

### 2.2 Le minerai

| Minerai | Où | Identification (expérimentation, Book 03 §6) | Remarque |
|---|---|---|---|
| **Minerai de fer des marais** | Lieux de flux : marais, tourbières | Nodules bruns, lourds, trait brun | Se reforme très lentement : c'est presque un **flux** |
| **Hématite** | Carrières, affleurements | **Trait rouge-brun** sur une pierre claire | Plus riche, mais plus loin |

**Préparation :** le minerai est **lavé** puis **grillé** sur un feu ouvert (déshydratation, il devient friable), puis **concassé**.

### 2.3 La chaîne complète

| Étape | Détail | Installation | Coût |
|---|---|---|---|
| **1. Collecte** | 20 kg de minerai : extraction et lavage, 2 h de travail lourd (700 kcal) | — | 140 wotts |
| **2. Grillage** | 10 kg de bois, 2 h (surveillance légère) | Feu ouvert | 80 wotts |
| **3. Bas fourneau** | Cheminée d'argile réfractaire (argile + sable + paille), ≈ 1 m. Construction : 6 h. Séchage passif. **Réutilisable** pour plusieurs fontes, avec réparations. | Bas fourneau (palier III, 🔥) | Investissement unique |
| **4. Fonte** | Charges alternées : **≈ 25 kg de charbon de bois** pour 20 kg de minerai. **6 à 8 h de ventilation continue** (6 à 8 min réelles), dans une fonte de ≈ 20 à 35 min réelles en tout (§2.5). | Bas fourneau | 1 175 wotts (charbon) |
| | Ventilation au soufflet manuel : 8 h de travail lourd (3 000 kcal), **relais à plusieurs conseillé** | 🔥 | + 600 wotts |
| | *ou* ventilateur électrique 12 V : ≈ 400 Wh_é et surveillance légère (1 200 kcal) | ⚡ | *ou* + 640 wotts |
| | *ou* soufflet hydraulique : surveillance légère (1 200 kcal) | ⚙️ (roue hydraulique) | *ou* + 240 wotts |
| **Sortie de la fonte** | Une loupe de **3 à 4 kg**, et ≈ 10 kg de scories | | |
| **5. Cinglage** | Réchauffer et marteler la loupe : 3 kg de charbon, 2 h de travail lourd (700 kcal). **Marteau-pilon hydraulique possible (⚙️).** | Forge ventilée | 280 wotts |
| **Sortie** | **≈ 2,5 kg de fer doux** en barre | | |

**Bilan :** ≈ 2 300 wotts pour 2,5 kg, soit **≈ 900 wotts/kg de fer doux**, contre ≈ 50 à 100 wotts/kg pour de la ferraille ordinaire récupérée (l'acier à ressort, plus recherché, revient plus cher : ≈ 125 wotts/kg pour un ressort à lames, Book 02 §12.1).

> **Ordre de grandeur réaliste :** environ 80 kWh de chaleur (le charbon) pour 1 kg de fer. Le bas fourneau est un procédé très inefficace, c'est ce qui le rend crédible.

### 2.4 De fer doux à acier : la cémentation

| Étape | Détail | Coût |
|---|---|---|
| Mise en caisse | Barres de fer doux entourées de charbon de bois broyé, dans une caisse scellée à l'argile | — |
| Chauffe | **900 à 950 °C pendant 8 à 12 h** (horloge d'action : 8 à 12 min réelles), ≈ 10 kg de charbon | 470 wotts |
| Travail | Chargement, surveillance, défournement : 2 h moyennes | 100 wotts |
| **Sortie** | **2,5 kg d'acier cémenté**, trempable (surtout en surface pour les pièces épaisses) | **≈ 230 wotts/kg en plus** |

> Un acier de loupe coûte donc au total **≈ 1 100 wotts/kg**. Une lame de ressort récupérée en coûte 50. Tant qu'il reste des voitures, personne ne cémente. Quand il n'en reste plus, les Charbonniers qui maîtrisent la filière deviennent indispensables.

### 2.5 Une fonte : un processus passif surveillé (validé)

Une fonte complète suit l'horloge d'action et dure **≈ 20 à 35 h de jeu, soit ≈ 20 à 35 minutes réelles** :

| Phase | Durée de jeu | Durée réelle | Ce que fait le joueur |
|---|---|---|---|
| **Séchage et préchauffe** du fourneau | ≈ 12 à 24 h (plus long pour un fourneau neuf) | ≈ 12 à 24 min | Rajouter du bois à chaque passage |
| **Fonte** : charges alternées de charbon et de minerai, ventilation continue | 6 à 8 h | 6 à 8 min | Charger, et ventiler : au soufflet (actif) ou par une machine (passif) |
| **Extraction** de la loupe à chaud, premier martelage, puis refroidissement du fourneau | ≈ 2 h | ≈ 2 min | Être là : une loupe qui refroidit dans le fourneau se travaille mal |

- **Le fourneau travaille seul, mais il faut passer le recharger** environ toutes les 5 minutes réelles. Une charge manquée fait baisser le rendement (loupe plus petite, plus de scories). Trois charges manquées éteignent le fourneau : la fonte est perdue.
- **Hors ligne**, la fonte continue mais personne ne la recharge (Book 01 §2 bis) : on ne lance une fonte que si l'on peut rester.
- **La ventilation** au soufflet manuel est un vrai travail lourd (6 à 8 min réelles d'effort), qu'on gagne à faire en relais. Un ventilateur sur batterie (⚡) ou un soufflet hydraulique (⚙️) la rendent passive : ce sont des machines de la base.

Le jeu doit en faire un **moment social** :

- plusieurs joueurs peuvent se relayer au soufflet et aux charges (le terrain d'un ami est sans combat) ;
- chaque famille apporte sa solution de ventilation : soufflet (🔥), ventilateur sur batterie (⚡), soufflet hydraulique (⚙️) ;
- la fonte dégage une **forte signature** (lumière, fumée, bruit du soufflet) pendant toute sa durée : il faut défendre le terrain contre les zombies attirés.

### 2.6 Savoirs de la sidérurgie (domaine Métal, Book 03 §5.6)

| Savoir | Contenu | Source typique |
|---|---|---|
| Métal I et II | Identifier les minerais (I), les griller (II) | Livre de géologie, PNJ |
| Métal III | Construire et conduire un bas fourneau, cingler | Hameau des Charbonniers, livre d'archéologie expérimentale |
| Métal III (maîtrise) | Cémenter, tremper et revenir finement, corroyer (souder des couches à la forge pour homogénéiser) | Maîtrise par la pratique |

---

## 3. La chimie de base

### 3.1 Le périmètre

La chimie du jeu est **artisanale et réaliste** : ce qu'un village pouvait faire avant l'industrie, plus ce qu'on récupère dans les ruines.

| Inclus | Exclu |
|---|---|
| Acides et bases du quotidien, neutralisation | Synthèse organique, chimie de laboratoire |
| Chaux, plâtre, potasse, savon | Explosifs puissants (au-delà de la poudre noire) |
| Fermentation, vinaigre, distillation | Gaz toxiques, poisons |
| Tannage, teintures simples | Drogues |
| Électrochimie simple (batteries, dérouillage) | Électrolyse à risque (chlore, hydrogène en quantité) |
| Biogaz, charbon, goudron et poix | Procédés détaillés pas à pas au-delà du niveau du jeu |

> Le jeu décrit **ce qu'on fait et ce que ça coûte**, pas un mode opératoire de laboratoire. Le réalisme porte sur les entrées, les sorties, les durées, les énergies et les dangers.

### 3.2 Les dangers chimiques

Ils s'appuient sur les propriétés du Book 03 §3.1.

| Danger | Exemples | Conséquence en jeu | Prévention |
|---|---|---|---|
| **Corrosif** | Électrolyte, lessive de potasse, chaux vive | Brûlures, objets rongés | Gants, contenant adapté, neutralisation |
| **Toxique** | Fumées de plastique, têtes de distillation, fumées de pneu | Intoxication (maladie, vision troublée) | Savoir, ventilation, masque |
| **Inflammable** | Alcool, essence, biogaz | Incendie de l'installation | Distance au feu, savoir |
| **Exothermique** | Extinction de la chaux vive | Brûlures, projections | Ajouter l'eau lentement |
| **Explosif** | Poudre noire, bouteille de gaz mal vidée | Blessure grave, destruction | Savoir, stockage séparé |

### 3.3 Acides et bases

**Ce qu'il faut comprendre en jeu :** un acide et une base se **neutralisent**. Les deux rongent ou brûlent. Le **chou rouge bouilli** sert d'indicateur : il vire au rouge en milieu acide, au vert en milieu basique.

| | Origine | Usages |
|---|---|---|
| **Acides** | | |
| Vinaigre (acide acétique) | Fermentation d'un alcool faible (§3.6) | Conservation des aliments, nettoyage, décapage léger |
| Électrolyte (acide sulfurique dilué) | Vestige : batteries | Reconditionnement de batteries, décapage du métal (Book 03 §7) |
| Jus d'agrumes, petit-lait | Nourriture | Acides faibles, cuisine |
| **Bases** | | |
| Lessive de potasse | Cendres de bois lessivées (§3.4) | **Savon**, lessive, nettoyage |
| Chaux éteinte | Four à chaux (Book 02 §12.3) | Mortier, désinfection, épilage des peaux, neutralisation des acides |
| Cristaux de soude | Vestige : droguerie | Lessive, dérouillage électrolytique (§3.8) |

### 3.4 La potasse et la saponification

**La lessive de potasse** :

| Étape | Détail | Coût |
|---|---|---|
| Lessivage | ≈ 10 kg de **cendres** (sous-produit gratuit) dans un tonneau percé, sur un lit de paille, arrosées de 20 L d'eau. **Passif, ≈ 1 jour.** | 24 wotts (eau) |
| Concentration | Ébullition pour réduire le liquide : 5 kg de bois | 40 wotts |
| Travail | 1 h moyenne | 50 wotts |
| **Sortie** | **≈ 1 L de lessive concentrée** (corrosive), testable au chou rouge | **≈ 115 wotts** |

**Le savon** (saponification : corps gras + base = savon) :

| Étape | Détail | Coût |
|---|---|---|
| Corps gras | 1 kg de suif ou de graisse (chasse, élevage) | ≈ 60 wotts |
| Base | 1 L de lessive de potasse | 115 wotts |
| Cuisson | 2 h sur feu doux, en remuant : 3 kg de bois, 500 kcal | 124 wotts |
| **Sortie** | **≈ 1,3 kg de savon mou**. Avec du sel en fin de cuisson : savon plus dur. **Cure passive : ≈ 1 mois réaliste (≈ 2 jours un tiers réels au calendrier).** | **≈ 230 wotts/kg** |

**Pourquoi c'est important en jeu :** le savon fait baisser fortement le **risque d'infection** des plaies et des maladies (hygiène). C'est le premier produit chimique à forte valeur, et une bonne raison de garder les cendres.

### 3.5 La chaux et le plâtre

**La chaux** est détaillée dans le Book 02 §12.3. Le cycle complet est cohérent avec la réalité :

```
calcaire ──(four, ≈ 900 °C)──► chaux vive ──(+ eau, dégage de la chaleur)──► chaux éteinte
    ▲                                                                              │
    └───────────────(prise lente à l'air : le mortier redevient du calcaire)──────┘
```

**Le plâtre** :

| Étape | Détail | Coût |
|---|---|---|
| Collecte | Gypse (carrière) | ≈ 3 wotts/kg |
| Cuisson | ≈ 150 °C seulement : un simple four ou une forte braise. ≈ 1 000 Wh_th/kg (≈ 0,25 kg de bois/kg) | ≈ 2 wotts/kg |
| Broyage | Pilon ou meule (⚙️) | Travail |
| **Sortie** | **Plâtre en poudre** : prend en quelques minutes une fois mouillé | **≈ 10 wotts/kg** |

**Usages :** enduits, moules (pour couler le plomb, l'aluminium), **attelles** pour les fractures.

### 3.6 Fermentation, vinaigre et alcool

**La fermentation** (passive) : des levures transforment le sucre en alcool. Sources de sucre : fruits, miel, céréales maltées, betteraves.

| Produit | Entrée | Durée réaliste | Durée réelle (calendrier) | Sortie |
|---|---|---|---|---|
| **Moût fermenté** | 10 kg de fruits écrasés + eau | 1 à 2 semaines | ≈ 14 h à 1 jour | ≈ 10 L à ≈ 8 % d'alcool |
| **Vinaigre** | Moût fermenté ou vin + « mère de vinaigre » | 2 à 4 semaines | ≈ 1 à 2 jours | Vinaigre (acide faible) |

### 3.7 La distillation

L'**alambic** (palier III, 🔥) sépare l'alcool de l'eau en chauffant le moût : l'alcool s'évapore avant l'eau et se recondense dans un serpentin refroidi.

| Étape | Détail | Coût |
|---|---|---|
| Entrée | 10 L de moût fermenté (≈ 10 kg de fruits) | ≈ 100 wotts |
| Chauffe | ≈ 10 kWh_th, soit ≈ 2,3 kg de bois | ≈ 18 wotts |
| Travail | 3 h de surveillance légère (deux passages, 450 kcal) | ≈ 90 wotts |
| **Sortie** | **≈ 1,2 L d'alcool à 60–70 %** | **≈ 175 wotts/L** |

**Le danger des « têtes » :** les premières fractions qui sortent de l'alambic sont **toxiques** et doivent être écartées. Avec le savoir *Chimie II*, le joueur les sépare automatiquement. Sans ce savoir, l'alcool produit risque de provoquer une **intoxication grave** s'il est bu.

**Usages de l'alcool :**

| Usage | Concentration | Intérêt |
|---|---|---|
| **Désinfectant** | ≥ 70 % | Soins (en complément du savon) |
| **Combustible** | ≥ 60 % | Lampe, réchaud : **flamme propre, sans fumée** (signature olfactive faible) |
| **Solvant** | ≥ 60 % | Teintures, extraits de plantes, nettoyage des contacts électriques |
| **Carburant** | ≥ 90 % (redistillé) | Petits moteurs adaptés : un des rares carburants liquides renouvelables |
| **Boisson, monnaie d'échange** | variable | Commerce, moral |

> **L'alcool, une énergie chère mais précieuse :** ≈ 175 wotts le litre pour ≈ 4 à 5 kWh de chaleur, soit environ 20 fois plus cher que le bois par kWh. Mais il est liquide, transportable, propre et polyvalent. C'est exactement la logique « qualité de l'énergie » du Book 01 §6.

### 3.8 L'électrochimie simple (⚡)

| Procédé | Principe | Coût | Intérêt |
|---|---|---|---|
| **Reconditionnement d'une batterie** | Refaire le niveau d'électrolyte, charges lentes de désulfatation | Électrolyte, ≈ 200 Wh_é, savoir Électricité II | Prolonge la vie d'une batterie (un stock qui ne se fabrique pas) |
| **Dérouillage électrolytique** | Bac d'eau + cristaux de soude, l'outil rouillé relié à la batterie, une ferraille sacrificielle en face. ≈ 12 h. | ≈ 50 à 100 Wh_é | **Restaure un outil rouillé : +1 en qualité**, sans abrasion ni chaleur |

### 3.9 La chimie du bois et des combustibles (🔥)

| Produit | Procédé | Usages |
|---|---|---|
| **Charbon de bois** | Charbonnière (Book 02 §12.2) | Forge, filtres |
| **Charbon broyé pour filtres** | Charbon de bois concassé et lavé | Filtration de l'eau (goût, odeurs, une partie des impuretés) |
| **Goudron de bois** | Charbonnière en fût, récupération des condensats | Imperméabilisation (bois, cordes, cuir), protection |
| **Poix** | Résine de pin chauffée et épaissie | Colle, étanchéité des tonneaux et des barques |
| **Biogaz** | Digesteur (palier III, **⚙️ natif** : c'est une fermentation de fumier, Book 01 §4) : fumier et déchets organiques **sans air**. ≈ 1 m³ de gaz par jour pour un petit digesteur, ≈ 6 kWh_th | Cuisson et éclairage **sans fumée**. Le résidu est un engrais. Les Charbonniers peuvent en construire un (technique étrangère, ×1,5) ou acheter le gaz. |
| **Salpêtre** | Nitrière (Book 01 §4) | Poudre noire, conservation des viandes |

### 3.10 Tannage et teintures

| Procédé | Chimie | Détail |
|---|---|---|
| **Épilage** | Base | Peau trempée dans un bain de chaux éteinte : les poils se détachent |
| **Tannage végétal** | Tanins | Écorce de chêne broyée dans l'eau, plusieurs semaines (calendrier). **Signature olfactive forte.** |
| **Teintures** | Pigments végétaux + **mordant** | Mordants réalistes : cendres, vinaigre, fer rouillé. Intérêt surtout social (signes de groupe, vêtements reconnaissables). |

---

## 4. Domaines des familles dans ces filières

| | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **Sidérurgie** | **Native** : bas fourneau, cinglage, cémentation | Ventilation électrique, dérouillage | Soufflet et marteau-pilon hydrauliques, concassage du minerai |
| **Chimie** | Chaux, plâtre, potasse, distillation, charbon, goudron, salpêtre | **Électrochimie** : batteries, dérouillage | Fermentation, vinaigre, savon (graisses d'élevage), biogaz (fumier), tannage |

> La sidérurgie et la distillation sont des filières **🔥 natives**, mais à chaque étape une autre famille fait gagner du temps ou de la peine. Les grandes productions de fin de jeu sont **collectives**.

---

## 5. Équilibrage

- **Les filières de production coûtent beaucoup plus cher que la récupération** (fer : ×10 à ×20). C'est ce qui rend la transition progressive et donne une valeur durable aux vestiges.
- **Les cours font la transition tout seuls :** quand la ferraille se raréfie, son cours monte, jusqu'à rendre le bas fourneau rentable. Il faut vérifier en simulation **à quel moment** du cycle de vie d'un serveur ce point est atteint.
- **Chaque produit chimique a une utilité concrète en jeu** (santé, conservation, énergie, entretien). Pas de chimie décorative.
- **Le danger est toujours annoncé** à qui a le savoir ou la perception (Book 03 §7.3).

---

## 6. Questions ouvertes

- [ ] **Point de bascule de la sidérurgie :** au bout de combien de temps de vie d'un serveur la ferraille devient-elle assez rare pour que le bas fourneau soit rentable ?
- [ ] **Autres métaux :** faut-il aussi produire du **plomb** à partir de minerai (galène, facile et basse température) ? Le cuivre et l'étain (bronze) semblent hors de portée réaliste et peuvent rester issus du recyclage.
- [x] **Santé :** ✅ traité au Book 05 (Santé et soins).
- [ ] **Événement collectif :** faut-il un vrai mode « chantier collectif » (fonte, construction lourde) avec des rôles et un partage du produit ?
- [ ] **Carburant :** jusqu'où aller avec l'alcool-carburant et le gazogène ? Ce sont les seules voies vers un moteur thermique, à équilibrer face aux autres transports.

---

## Glossaire

- **Bas fourneau** : cheminée d'argile où le minerai est réduit en fer par le charbon de bois, sans fondre.
- **Loupe** : masse spongieuse de fer et de scories sortie du bas fourneau.
- **Cinglage** : martelage à chaud de la loupe pour en chasser les scories.
- **Fer doux** : fer pauvre en carbone, malléable, non trempable.
- **Cémentation** : chauffe prolongée du fer au contact du charbon pour en faire de l'acier.
- **Saponification** : réaction d'un corps gras avec une base, qui donne le savon.
- **Têtes** (distillation) : premières fractions toxiques, à écarter.
- **Mordant** : produit qui fixe une teinture sur une fibre.
- **Indicateur** : substance qui change de couleur selon l'acidité (chou rouge).
