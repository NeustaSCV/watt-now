# Book 03 — La Bibliothèque et le Savoir

> Document de conception · version 0.5 · 2026-10-09
> Statut : **brouillon de travail**.
> S'appuie sur le [Book 01 — Les Trois Feux](01-les-trois-feux.md) et le [Book 02 — Le Crafting](02-crafting.md).

Ce book répond à deux questions :

1. **Comment construire une bibliothèque immense** d'objets et de matériaux sans qu'elle devienne ingérable, pour l'équipe comme pour le joueur ?
2. **Comment le joueur passe-t-il du savoir de base au savoir complexe ?** Par exemple : comprendre ce qu'il y a dans une batterie de voiture, et ce qu'on peut en faire.

---

## 1. Principe : un monde décrit par des propriétés, pas par des listes

Une bibliothèque de milliers d'objets écrits un par un, chacun avec ses recettes, devient vite ingérable et incohérente. La solution est de **décrire le monde de façon systémique** :

| Au lieu de… | On décrit… | Résultat |
|---|---|---|
| « La hache demande un marteau » | Des **qualités d'outil** : *Marteler 2* | N'importe quel objet qui martèle à ce niveau convient : un marteau, une masse, le dos d'une hache. L'outil de fortune devient automatique. |
| « Le couteau demande de l'acier » | Des **propriétés de matériau** : *dureté ≥ 6, trempable* | Tout matériau qui remplit ces conditions convient : acier à ressort, lime usée, roulement. |
| « Démonter une voiture donne X, Y, Z » | La **composition** de chaque objet | Le démontage, la masse et l'énergie grise se **calculent**. |
| « Le jus de batterie est dangereux » | Des **propriétés de danger** : *corrosif 3* | Le danger s'applique partout où il a du sens : contact, contenant, mélange. |

> **Référence de genre :** *Cataclysm: Dark Days Ahead* gère des milliers d'objets réalistes grâce à ce principe (qualités d'outil, composition des objets). On en reprend la logique, avec l'énergie grise en plus.

---

## 2. Les niveaux d'objets

Chaque objet appartient à un **niveau**. Un objet d'un niveau est fait d'objets du niveau inférieur.

| Niveau | Nature | Exemples | Volume estimé au lancement |
|---|---|---|---|
| **N0 — Ressource** | Naturelle ou brute | Bois mort, pierre, argile, peau fraîche, eau, minerai | ≈ 60 |
| **N1 — Matériau** | Ressource travaillée, homogène | Planche, charbon de bois, chaux, cuir, corde, fil de cuivre, lingot de plomb, tôle | ≈ 120 |
| **N2 — Pièce** | Élément fonctionnel | Manche, lame, ressort, engrenage, axe, roulement, rivet, poulie, cellule de batterie | ≈ 250 |
| **N3 — Objet** | Utilisable seul | Hache, arbalète, lampe, seau, vêtement, pompe à main | ≈ 600 |
| **N4 — Ensemble** | Machine, installation, véhicule | Forge, roue hydraulique, vélo-cargo, banc de batteries | ≈ 120 |
| | | **Total au lancement** | **≈ 1 150** |

**Les vestiges sont des objets N3 et N4 de l'ancien monde.** Une voiture est un N4 ; son démontage donne des N2 (alternateur, ressorts) et des N1 (tôle, fil de cuivre). Les joueurs, eux, remontent la chaîne dans l'autre sens.

> **La bibliothèque grandit par combinaison.** Avec 250 pièces bien choisies, on peut décrire des centaines d'objets sans multiplier les recettes à la main. Ajouter une pièce enrichit toutes les recettes qui peuvent l'utiliser.

---

## 3. Les matériaux de base

### 3.1 Les propriétés

Chaque matériau est décrit par la même fiche de propriétés. Ce sont elles qui décident de ce qu'on peut en faire.

| Propriété | Échelle | Sert à… |
|---|---|---|
| **Dureté** | 1 à 10 | Tranchant, résistance à l'usure, capacité à rayer ou limer |
| **Ténacité** | 1 à 10 | Résistance aux chocs (le verre est dur mais pas tenace) |
| **Trempable** | oui / non | Peut durcir par chauffe et refroidissement brusque (aciers riches en carbone) |
| **Magnétique** | oui / non | Test de l'aimant : distinguer l'acier de l'aluminium, de l'inox ou du laiton |
| **Conductivité électrique** | isolant / faible / bonne / excellente | Câbles, contacts, isolation |
| **Combustible** | Wh_th/kg (0 si non) | Valeur comme carburant |
| **Température de travail / de fusion** | °C | Quelle installation peut le transformer (Book 01 §3) |
| **Densité** | kg/L | Masse, flottaison, portage |
| **Corrosif** | 0 à 3 | Brûlures, attaque des métaux, contenants nécessaires |
| **Toxique** | 0 à 3 (contact, ingestion, fumées) | Dangers, intoxications |
| **Imperméable** | oui / non | Contenants, toits, vêtements |
| **Périssable** | durée | Pourrissement, péremption |

### 3.2 Le catalogue de départ (≈ 80 matériaux)

Le catalogue est organisé en familles. Chaque matériau a ses variantes (sec/vert, propre/rouillé…).

| Famille | Matériaux |
|---|---|
| **Minéraux** | Pierre ordinaire, silex, grès (abrasif), calcaire, argile, sable, gravier, sel, soufre, charbon minéral, minerai de fer des marais, hématite (sidérurgie, Book 04), gypse |
| **Végétaux** | Bois feuillu, bois résineux, écorce (tanin), fibres (ortie, lin, chanvre), paille, résine, feuilles, graines, huile végétale, coton (vestige) |
| **Animaux** | Viande, peau, cuir, os, corne, tendon, graisse et suif, laine, plumes, cire d'abeille |
| **Métaux ferreux** | Fer doux (de loupe), acier doux, acier cémenté, acier à ressort (riche en carbone), acier à outils, fonte, inox |
| **Métaux non ferreux** | Aluminium, cuivre, laiton, bronze, plomb, zinc, étain |
| **Chimie** | Eau, acide sulfurique dilué (électrolyte), vinaigre, potasse (lessive de cendres), soude et cristaux de soude, chaux, plâtre, salpêtre, alcool, essence et gazole résiduels, huile moteur, javel, ammoniaque, peroxyde, goudron de bois, poix, savon, biogaz (détail : Book 04) |
| **Synthétiques** | PEHD, PVC, PET, nylon, caoutchouc, mousse, tissu synthétique, colle, adhésifs |
| **Minéraux transformés** | Verre, céramique, béton, brique, plâtre |
| **Papier et assimilés** | Papier, carton |
| **Électronique** | Composants classés par fonction (voir 3.3) |

### 3.3 L'électronique : des composants, pas des matériaux

L'électronique ne se fabrique pas (Book 02 §4). On la décrit par **fonction**, pour éviter des centaines de références :

| Classe | Exemples | Usage typique |
|---|---|---|
| Stockage | Batteries plomb, lithium, piles | Stocker l'électricité |
| Génération | Alternateur, moteur (réversible), cellule solaire | Produire l'électricité |
| Conversion | Régulateur, onduleur, chargeur, transformateur | Adapter la tension |
| Commande | Interrupteur, relais, fusible | Contrôler, protéger |
| Éclairage | LED, ampoule | Éclairer |
| Signal | Haut-parleur, micro, radio, capteur | Communiquer, détecter |
| Passifs | Condensateurs, résistances, diodes | Réparer et bricoler des circuits |

### 3.4 Exemple de fiche matériau

```
ACIER À RESSORT
────────────────────────────────────────────────
Famille        Métal ferreux
Dureté 7 · Ténacité 8 · Trempable : oui · Magnétique : oui
Conductivité   bonne · Combustible : non
Forge          900–1 100 °C · Fusion : ≈ 1 450 °C
Corrosif 0 · Toxique 0 · Périssable : rouille lente
Se trouve dans ressorts de voiture, lames de scie, ressorts de sommier
Bon pour       lames, outils tranchants, ressorts, arcs d'arbalète
```

---

## 4. Les qualités d'outil

Une recette ne demande **pas un outil précis**, mais une **qualité** d'un certain niveau (1 à 3). Chaque objet possède zéro, une ou plusieurs qualités.

| Qualité | Exemples d'objets et niveau |
|---|---|
| **Couper** | Éclat de verre 1 · couteau 2 · cutter 2 · couteau de bonne qualité 3 |
| **Scier le bois** | Couteau à dents 1 · scie égoïne 2 · scie à cadre 3 |
| **Scier le métal** | Lime 1 · scie à métaux 2 · meuleuse 3 |
| **Marteler** | Pierre 1 · marteau 2 · masse 3 |
| **Fendre / abattre** | Pierre emmanchée 1 · hachette 2 · hache 3 |
| **Percer** | Clou chauffé 1 · vilebrequin 2 · perceuse 3 |
| **Visser** | Couteau 1 · tournevis 2 · visseuse 3 |
| **Serrer** | Pince 1 · clé plate 2 · clé à cliquet 3 |
| **Saisir à chaud** | Bâton vert 1 · pince 2 · pinces de forge 3 |
| **Abraser / affûter** | Pierre ordinaire 1 · grès 2 · lime ou meule 3 |
| **Creuser** | Mains, bâton 1 · pelle 2 |
| **Coudre** | Arête, os pointu 1 · aiguille 2 |
| **Contenir un liquide** | Bouteille 1 · seau 2 · bidon 3 · **résistant aux acides** (verre, PEHD) |
| **Chauffer** | Feu 1 (600 °C) · forge 2 (1 300 °C) · four électrique 3 (1 600 °C) |
| **Mesurer** (électrique) | Ampoule-témoin 1 · multimètre 2 |
| **Souder** | Fer à souder 1 · poste à l'arc 2 |
| **Servir d'enclume** | Grosse pierre 1 · rail 2 · enclume 3 |

**Règle :** le niveau de la qualité remplace la règle « outil de fortune » du Book 02 §7. Un niveau inférieur à celui demandé est accepté avec un malus de temps et de qualité ; deux niveaux en dessous, la recette est impossible.

### 4.1 Depuis la 0.8 : des portes dures (2026-10-10)

Plan 0.8 §2.1, codé en 0.8. **La règle ci-dessus change** :

- **Il faut le niveau demandé.** Un niveau en dessous ne rend plus le geste plus lent : il est **refusé**, et le refus nomme ce qui manque. Marteler 1 ne suffit plus pour Marteler 2.
- **Plusieurs outils sont compatibles** pour une même qualité, et **les objets de fortune donnent le niveau 1** : on n'est jamais bloqué faute d'un outil précis, seulement faute du bon niveau.
- **Ce que le code donne au niveau 1** (`QUALITES_OBJETS`) : Marteler, la pierre, la clé plate, le cric, la ferraille tordue, le pied-de-biche ; Couper, l'éclat de verre, la lame ébréchée, la boîte de conserve vide (le couvercle), le sécateur, la machette ; Visser, le couteau, la lame ébréchée (le fer plat) ; Fendre, la tête de hache sans manche et le coin de bois ; Creuser, le bâton à fouir, l'enjoliveur, la casserole ; Serrer, le serre-joint de fortune ; Scier le bois, la scie de fortune ; Trancher le métal, la lime usée.
- **Le niveau 2 à la portée de tous** : le **marteau remmanché** (la tête de marteau de la caisse de la ruine et une branche, à la main) et le **marteau de fortune** (une barre repliée) donnent **Marteler 2** ; la clé plate, Serrer 2 ; la bêche, Creuser 2.
- **Les postes et les outils à portée** : l'**établi à étau** donne **Serrer 3** à qui travaille à 3 m (l'étau dans le sac ne donne rien) ; un outil rangé au **râtelier à outils**, à 3 m, compte comme porté (Book 24 §12).
- **Deux qualités nouvelles, déclarées sans usage** : **Raboter** et **Souder** (Q-0.8-21) ; elles serviront au niveau 2 (le rabot de l'établi de menuisier, le fer à souder).
- **Les enclumes** (Servir d'enclume) : la grosse pierre plate donne ★, l'enclume de dépanneur, l'étau et la tête de masse ★★ (Book 25 §13.4).

Les outils de fortune à fabriquer sont au Book 02 §14 quinquies.

---

## 5. Le savoir

### 5.1 Deux choses à connaître : les matériaux et les recettes

| Objet du savoir | Niveaux | Ce que voit le joueur |
|---|---|---|
| **Matériau / objet** | **Inconnu** → **Identifié** → **Compris** | *« liquide inconnu »* → *« acide sulfurique dilué »* → ses propriétés et dangers |
| **Recette** | **Inconnue** → **Pressentie** → **Connue** → **Maîtrisée** | Rien → *« Il doit y avoir un moyen de… »* → la recette → bonus de qualité (Book 02 §9) |

> La **recette pressentie** évite la frustration : quand le joueur possède des éléments utiles à une recette qu'il ne connaît pas, le jeu lui laisse entrevoir qu'elle existe et lui dit où chercher (livre, PNJ, expérimentation).

> **Depuis la 0.7** (§5.7) : la recette pressentie a pris deux formes. Pour une recette **connue** (commune ou de sa famille) mais pas encore **dévoilée**, c'est la **silhouette « À découvrir »** du panneau Fabriquer : l'icône assombrie, sans nom, avec un indice qui dit le besoin. Pour une recette d'une **autre famille**, c'est la carte **grisée** « chez les Charbonniers », montrée après le Comptoir ou une rencontre (Book 25 §2.3).

### 5.2 Le savoir de base, commun à tous

Tout survivant adulte sait :

| Domaine | Savoir de base |
|---|---|
| Matériaux | Reconnaître le bois, la pierre, le métal (sans distinguer les métaux entre eux), le plastique, le verre, le tissu, l'eau, la nourriture courante |
| Feu | Allumer et entretenir un feu, faire bouillir de l'eau, cuire de la viande |
| Abri | Abri de branches et de bâche, barricade simple |
| Outils | Utiliser les outils courants, remmancher, affûter |
| Démontage | Démonter avec tournevis et clés, sans comprendre tout ce qu'on récupère |
| Corps | Pansement simple, nœuds, transport de charges |

Ce savoir de base est **connu** de tout survivant, mais il n'apparaît dans Fabriquer qu'une fois **dévoilé**, quand le personnage y pense (§5.7). On ne retire pas un savoir : on y pense au bon moment.

### 5.3 Le savoir de famille

Chaque famille arrive avec le savoir de son domaine. C'est cohérent avec son histoire, et cela rend l'échange de savoir précieux.

| | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **Identifie d'emblée** | Les métaux entre eux, les combustibles, le calcaire, l'argile | Les composants électroniques, les batteries et leur contenu, les métaux conducteurs | Les plantes et graines utiles, le bois par essence, les pièces mécaniques (roulements, engrenages) |
| **Recettes connues** | Foyer de forge, fonte du plomb, fumage | Recharge, branchement en série et en parallèle, réparation simple | Pédalier, meule à bras, nœuds et cordages, potager |

### 5.4 Les quatre façons d'apprendre

| Voie | Comment | Exemple |
|---|---|---|
| **Lire** | Livres et manuels trouvés dans les ruines. Chaque livre débloque un ensemble de recettes et d'identifications. | *Manuel d'entretien automobile* : batteries, alternateurs, circuits 12 V |
| **Être enseigné** | Par un PNJ (contre des wotts ou un service) ou par un autre joueur (voir ci-dessous) | Un Voltaïque enseigne la recharge à un Mécaniste |
| **Expérimenter** | Tester un objet inconnu pour découvrir ses propriétés (§6) | Tremper un clou dans un liquide inconnu |
| **Pratiquer** | Répéter les recettes d'une catégorie fait monter la maîtrise | Forger 20 lames → maîtrise de la forge |

**L'enseignement entre joueurs (validé) :**

- L'enseignant doit **maîtriser** la recette, et les deux joueurs doivent être **ensemble**, au même endroit, pendant la leçon (quelques minutes réelles).
- **Pour l'élève :** la recette devient **Connue**, plus vite et pour moins cher qu'avec un livre, sans expérimentation.
- **Pour l'enseignant :** il gagne du **rayonnement** (composante « Contribuer », Book 09 §3.1), **une seule fois par élève et par recette** : enseigner en boucle à un complice ne rapporte rien. Il peut aussi faire payer la leçon (échange direct ou commande, Book 07 §5).
- On peut enseigner une technique étrangère à sa famille, à condition de la maîtriser.

### 5.5 Le carnet

Tout ce que le joueur apprend est consigné dans son **carnet** :

- les matériaux identifiés et leurs propriétés découvertes ;
- les recettes connues et pressenties ;
- les livres lus, ce qu'ils ont appris et ce qu'il reste à y trouver.

**Construit en 0.7** : le carnet du jeu note, tout en bas, la **dernière idée** venue au personnage (« Dernière idée : Tresser une corde »), à la bienvenue et à chaque dévoilement. Le reste du carnet de savoir (matériaux identifiés, livres lus) attend l'expérimentation et les livres.

Le carnet est **personnel**. Il est **conservé à l'effondrement** en cours de cycle (on perd son inventaire courant, pas son savoir), et **effacé en fin de cycle**, comme tout le reste (Book 09 §4). On ne partage pas un carnet, on **enseigne** (§5.4).

---

### 5.6 Les domaines de savoir (validé)

Le savoir est rangé en **douze domaines**, chacun à **trois niveaux**. Une recette demande un domaine et un niveau (par exemple *Métal II*). La pratique (§5.4) fait progresser dans un domaine.

| Domaine | I | II | III | Connu au niveau I dès le départ |
|---|---|---|---|---|
| **Métal** | Travail à froid, fonte du plomb, décapage, identifier les métaux et les minerais | Forger, tremper et revenir, souder à la forge, creuset (cuivre, aluminium), griller le minerai | Bas fourneau, cinglage, cémentation, corroyage (Book 04 §2) | 🔥 |
| **Feu** | Foyers, fumage, four à pain | Charbonnière, poêle-fusée, four à chaux et à poterie | Poêle de masse, gazogène, machine à vapeur | 🔥 |
| **Chimie** | Chaux, potasse, savon, neutraliser un produit | Plâtre, fermentation, vinaigre, distillation (séparer les « têtes »), nitrière | Poudre noire et amorces, goudron et poix, acides | 🔥 |
| **Électricité** | Piles et batteries, branchements en série et en parallèle, réparation simple | Panneau et régulateur, reconditionnement des batteries, soudure à l'arc, clôture électrique, électrochimie | Micro-réseau, onduleur, moteurs, four électrique, radio longue portée | ⚡ |
| **Mécanique** | Pédalier, manivelle, meule à bras, pompe à main, nœuds et cordages | Poulies, treuil, tour à perche, vélo-cargo, arbalète | Roue hydraulique, moulin à vent, manège, scierie, marteau-pilon, baliste | ⚙️ |
| **Agriculture** | Potager, compost, rotation | Sélection des semences, test de germination, serre, couches chaudes, irrigation | Greffage et arboriculture, variétés adaptées | ⚙️ |
| **Élevage** | Poules, lapins | Chèvres et moutons (traite, tonte, soins courants comme la mammite), abeilles | Bœufs et chevaux (traction, manège), reproduction sélective, digesteur à biogaz | — |
| **Conservation** | Séchage, cave, salage | Lacto-fermentation, confit, bocaux stérilisés, sel par évaporation | Silo hermétique, chambre froide (avec l'Électricité) | — |
| **Construction** | Abri, palissade, clayonnage, barricade | Rondins, paille, terre-paille, enduits, chaume | Pierre jointée, voûte et cave, maison métallique (avec la soudure) | — |
| **Couture** | Réparer, coudre | Tanner, filer, tisser | Vêtements techniques, protections en cuir (Book 12) | — |
| **Médecine** | Reconnaître une infection, attelle, suture simple, réhydratation | Plâtre, drainage, extraction d'un projectile, doser les médicaments | Soins graves, chirurgie de terrain (Book 05 §8.1) | — |
| **Météo** | Lire le ciel | Lire un baromètre, monter une station météo | Prévoir les épisodes climatiques (Book 13 §2.1, §5) | — |

> **Forge, Métallurgie et Sidérurgie** sont regroupées dans le seul domaine **Métal** : forger une lame (II) et conduire un bas fourneau (III) en sont deux niveaux. Le niveau d'un savoir est distinct du palier d'une installation : on peut connaître *Chimie II* sans posséder d'alambic.

### 5.7 Connu n'est pas dévoilé : l'arbre de progression (0.7, 2026-10-09)

Le détail, les règles et la table complète sont au Book 02 (§14 quater et annexe A). Ce qui touche au savoir :

| Une recette est… | Ce que ça veut dire | Ce qu'en voit le joueur |
|---|---|---|
| **Connue** | Commune, de sa famille, ou apprise (leçon, manuel) | Rien de plus, tant qu'elle n'est pas dévoilée |
| **Dévoilée** | Connue, **et** le personnage **y a pensé** : il en a eu besoin, ou il a tenu l'ingrédient clé | La carte dans Fabriquer ; seule une recette dévoilée se fabrique (le serveur refuse les autres) |
| **Pressentie** | On la devine : une recette du prochain palier, pas encore dévoilée ; ou celle d'une autre famille, pas encore apprise | Une silhouette « À découvrir » (sans nom, l'icône assombrie, un indice) ; ou une carte grisée « chez les… » (§5.1) |

- **Deux verbes, deux sens** (décision Q10) : **« Tu y penses »** pour le savoir de base et de famille, qu'on a toujours eu ; **« apprendre »** pour la leçon et le manuel, qui ouvrent le savoir d'une autre famille. La leçon et le manuel **dévoilent** en même temps qu'ils apprennent : un livre, on le lit en entier.
- **Le dévoilé est du savoir** : il est conservé à l'effondrement et effacé en fin de cycle, comme le carnet (§5.5).
- **Les cinq paliers** suivent la pyramide de Maslow (le corps, l'abri du danger, les tiens puis les autres, le métier, l'œuvre) : ce sont des familles de déclencheurs, pas des niveaux à atteindre.
- **Voir faire** est une cinquième façon, discrète, de penser à une recette : à moins de 5 m d'un joueur qui la fabrique. Pour une recette d'une autre famille, on ne l'apprend pas ainsi ; on la voit seulement, grisée, ce qui donne envie d'une leçon (§5.4).

> **Depuis la 0.8** : les cinq paliers ne sont plus qu'une grille de conception (Book 02 §14 quater) ; une recette **pressentie** est désormais ce qu'ouvrirait le **niveau suivant** d'une construction qu'on possède (« Au foyer de cuisine : soupe de cèpes »), ou ce que demande une quête en cours.

### 5.8 Penser au bon moment : l'idée au ramassage et l'indice en deux temps (0.8, 2026-10-10)

Plan 0.8 §2.2, codé en 0.8 (chantier 2 ; les textes de chaque clé sont dans les lignées, `Etape.cle`). Chaque niveau d'un meuble au-delà de la maison demande **une clé** trouvée dehors (Book 24 §12). Le savoir n'en est pas changé : on sait déjà fermer un abri ou cercler un coffre ; on **y pense** quand on tient ce qu'il faut.

**« Tu y penses » : l'idée au ramassage.**

- La **première fois** qu'on ramasse une clé (le premier « vu » de l'objet), ou qu'on tient l'outil qui manque, un **bandeau** passe, dans la voix du carnet, avec l'icône de la trouvaille : « Ce grillage, posé sur ton foyer, ferait une grille. Tu y penses. » Un son court et chaleureux l'accompagne, distinct du ramassage.
- **Jamais au deuxième ramassage** : l'idée ne revient pas.
- **L'idée gardée** : si le niveau d'avant n'est pas encore posé, le message dit « un jour » (« Ce grillage pourra servir à ton feu, un jour. »), avec « gardé pour plus tard ». L'idée est notée dans le personnage ; quand on arrive au meuble, sa fiche montre la clé **« déjà en poche »**. Une trouvaille précoce n'est jamais perdue.
- **Un meuble de famille** ne compte comme monté au niveau de sa clé **qu'une fois sa pièce posée** (le panneau sur le banc, l'enclume près du foyer, l'alternateur sur le pédalier) : avant, l'idée reste muette (plan 0.8 §9.2).
- **Le bandeau passe seul**, ou se ferme **d'un bouton** (« Noté », « Je le garde ») : **jamais une fenêtre à croix** (règle du porteur). Plusieurs idées d'une même fouille passent l'une après l'autre, au plus un message toutes les 10 s. *(0.8.2 : plus de bouton, voir plus bas.)*
- **Les textes nomment le lieu par son nom affiché** (« la Coopérative », « la station », « le Gué-aux-Saules », « le Moulin du Gué »), jamais par le code de l'étape (« L1A »).

**L'indice « où chercher », en deux temps.**

| Temps | Ce qu'il dit | Exemple (le foyer de cuisine) |
|---|---|---|
| **1 · le type de lieu** | Où ce genre d'objet se trouve, sans nommer le lieu | « Une grille ? Les clôtures en sont faites. » |
| **2 · le coin** | Le lieu et l'endroit précis *(0.8.2 : le lieu seul, voir plus bas)* | « Le parc à volailles de la Coopérative. » *(0.8.2 : « À la Coopérative. »)* |

- L'indice d'une clé s'ouvre quand son étape devient **le niveau suivant** d'une construction qu'on a.
- Il passe au **second temps** après **une visite du bon lieu sans la clé**, ou après **45 min** de jeu (Q-0.8-16).
- **Jamais de flèche sur la carte** : l'indice se lit dans la **fiche du meuble** (Examiner), une ligne par manque, l'indice replié.

**La fiche du meuble devient l'arbre.** Ouverte par **Examiner** (bouton B), elle montre ce qu'on y fait, **le niveau suivant** (sa clé, ses matériaux, son outil, ce qui manque, l'indice) et celui d'après, **grisé** ; un niveau « plus tard » porte sa clé nommée, « à trouver plus loin ». Elle se ferme par **B**, ou par son bouton « Fermer » pour la souris et le toucher : pas de croix (plan 0.8 §9.2). La 0.8 n'y ajoute que les indices ; le panneau Examiner détaillé attend une version à part (Q-0.8-17).

**Quatre sources par clé** : sa **place fixe** dans son lieu, la **chance** ailleurs (rare, 2 % par fouille), un **repli** fabricable (plus cher, plus lent ou moins bon), et le **Comptoir**, seulement **après une première visite** du lieu (500 wotts, Book 01 §2 bis).

### 5.9 Ce que la 0.8.2 change : un message qui part seul, des indices qui ne disent que le lieu (2026-10-13)

*Plan 0.8 §9.4 (R9, R10, R22) et plan 0.8.2 §2, chantiers H et K ; **codé en 0.8.2** (`client/src/bandeau-idee.ts`, les textes de `commun/src/lignees.ts`, le test `client/src/textes-du-jeu.test.ts`). Là où le §5.8 diffère, ce paragraphe fait foi.*

Le porteur a joué la 0.8 : « Tu y penses » appelait une action qu'il n'y avait pas à faire, et les indices en disaient trop.

**« Tu y penses » devient un message d'information** (R22, qui remplace le bandeau « fermé d'un bouton » du §5.8) :

- **Sans bouton** : il n'appelle aucune action. Son fond est **plus transparent**, il **ne cache pas le jeu** et ne prend ni le toucher ni la souris : on joue à travers.
- **Il part seul**, le temps de le lire : entre **5 et 9 s** selon la longueur de l'idée, puis un fondu court. Plusieurs idées d'une même fouille passent toujours l'une après l'autre.
- **Ce qui ne change pas** : l'icône de la trouvaille, le son court et chaleureux, « gardé pour plus tard » quand le niveau d'avant n'est pas posé, et la fiche du meuble qui montre la trouvaille **« déjà en poche »**.
- **La règle qui en sort**, pour tout le jeu : un **message d'information** n'a pas de bouton et part seul ; un **avertissement** garde son bouton (la bûche au feu : « Compris », Book 14 §4.5) ; les panneaux ouverts au toucher ou à la souris gardent leur croix ; ce qu'on ouvre au bouton B se ferme par B.

**L'indice nomme le lieu, jamais l'endroit exact** (R10) :

| Temps | Ce qu'il dit (0.8.2) | Exemple (le foyer de cuisine) |
|---|---|---|
| **1 · le genre de lieu** | Où ce genre d'objet se trouve, sans nommer le lieu | « Une grille ? Les fermes ont des clôtures. » |
| **2 · le lieu** | **Le nom du lieu, et rien de plus** | « À la Coopérative. » |

- Plus de « parc à volailles », de « pilier de l'auvent », de « palettes du quai » : **le joueur cherche dans le lieu**. Un niveau « plus tard » dit seulement : « Plus loin, pas encore sur ta carte. »
- **Rien sur les kits de départ** : un indice ne dévoile pas ce qu'une autre famille a dans son sac.
- **Des textes courts** : on n'est plus dans le tutoriel.
- Le second temps s'ouvre toujours après une visite du bon lieu sans la trouvaille, ou après 45 min (§5.8) ; il ne fait que nommer ce lieu.
- **Un test garde la règle** : une liste de mots d'endroit interdits dans les indices (l'auvent, le garage, le quai, la berge, le magasin, le bief…, et les tournures « sous le », « au fond »…).

**Le mot « clé » est banni des textes du jeu** (R9). C'est un **mot de conception** : il reste dans les books, les plans et le code (`Etape.cle`), mais le joueur croirait à de vraies clés. La fiche du meuble dit **« Il te faut : »** là où elle disait « Clé : » ; les descriptions, les idées, les indices, l'aide, le carnet et les messages disent ce qu'on cherche par son nom (« une grille », « de la grosse toile »). **Seules les vraies clés gardent leur mot** : la **grosse clé** du Moulin du Gué (sa serrure, la grande porte « fermée à clé »), la clé du coffre du magasinier de la Coopérative, et l'outil **clé plate**. Le même test lit tous les textes affichés, données et messages du code, et refuse le mot ailleurs.

---

## 6. L'expérimentation

Le joueur peut **tester** un objet inconnu pour découvrir ses propriétés. Chaque test est réaliste, coûte un peu de temps et comporte parfois un risque.

| Test | Ce qu'il révèle | Risque |
|---|---|---|
| **Aimant** | Magnétique : fer et acier, ou pas (aluminium, inox, laiton, cuivre) | Aucun |
| **Rayer, limer** | Dureté approximative | Aucun |
| **Plier, frapper** | Ténacité, fragilité | Casse de l'échantillon |
| **Flamme** | Combustible, fond, dégage des fumées | Brûlure, fumées toxiques |
| **Eau** | Soluble, flotte, réagit | Réaction (chaux vive : chaleur) |
| **Clou ou métal trempé** | Corrosif : le métal bulle et se ronge | Éclaboussure |
| **Sentir** | Indices (acide, solvant, pourriture) | Intoxication légère |
| **Multimètre** | Tension, conductivité, état d'une batterie | Aucun (avec l'outil) |
| **Chou rouge bouilli** (indicateur) | Acide (vire au rouge) ou base (vire au vert) | Aucun |
| **Trait sur une pierre claire** | Couleur du trait : rouge-brun pour le minerai de fer (hématite) | Aucun |

**La Perception (PER) aide :** un personnage attentif reçoit des indices **avant** d'agir (« ça sent l'acide… »). Le Savoir technique (SAV) aide à **interpréter** le résultat.

> L'expérimentation remplace l'arbre de compétences abstrait par une démarche de bricoleur : on observe, on teste, on comprend. Elle donne aussi une raison de garder des objets inconnus plutôt que de les jeter.

---

## 7. Exemple complet : la batterie de voiture

Le même vestige, vu par trois joueurs qui n'ont pas le même savoir.

### 7.1 Ce que chacun voit au départ

| | Savoir de base (tous) | ⚡ Voltaïque | 🔥 Charbonnier |
|---|---|---|---|
| **Nom affiché** | « Batterie de voiture » | « Batterie plomb-acide 12 V 60 Ah, chargée à 30 % » | « Batterie de voiture (plomb) » |
| **Usages connus** | Stocker de l'électricité (sans savoir comment s'en servir) | Stocker, recharger, brancher, diagnostiquer | Récupérer le plomb |
| **Dangers connus** | « Ne pas ouvrir » (vague) | Acide, court-circuit, gaz pendant la charge | Acide |

### 7.2 Le parcours de découverte d'un joueur sans savoir

| Étape | Ce qui se passe | Ce que le joueur apprend |
|---|---|---|
| 1. Il démonte la batterie | Avec une PER suffisante : *« Il y a du liquide dedans. Ça sent l'acide. »* Sans protection, risque de **brûlure légère**. | Le contenu existe et il est dangereux |
| 2. Il récupère le liquide | Il lui faut un contenant **résistant aux acides** (verre, PEHD). Un seau en métal fuit et se ronge. | Les contenants ont des propriétés |
| 3. Le liquide apparaît comme « liquide inconnu » | Il peut le garder, le tester, ou demander à quelqu'un | — |
| 4. Il le teste avec un clou | Le clou se couvre de bulles et se ronge : propriété **Corrosif** découverte | Le liquide est un acide |
| 5. Il trouve le *Manuel d'entretien automobile*, ou un Voltaïque le lui enseigne | Identification : **acide sulfurique dilué (électrolyte)** | Le nom, les propriétés, les dangers |
| 6. Recettes pressenties puis connues | Selon ses autres savoirs (liste ci-dessous) | Le matériau devient une ressource |

**Ce qu'on peut faire avec cet électrolyte** (selon le savoir) :

| Usage | Savoir requis | Famille native |
|---|---|---|
| **Reconditionner une batterie** (refaire le plein d'électrolyte) | Électricité II | ⚡ |
| **Décaper le métal** (enlever la rouille avant soudure ou forge) | Métal I | 🔥 ⚡ |
| **Neutraliser** avec de la chaux ou de la potasse avant de jeter | Chimie I | Tous |

> **Le message pour le joueur :** une batterie n'est pas « un objet de crafting ». C'est un système fait de plomb, d'acide, de plastique et d'énergie stockée. Plus on en sait, plus on en tire de choses. Et ce qu'on ignore peut faire mal.

### 7.3 Les règles qui en ressortent

1. **Ne pas savoir n'empêche pas d'agir, mais rend l'action risquée ou inefficace.** On peut démonter une batterie sans rien y connaître : on se brûle et on perd l'acide.
2. **Le danger est toujours annoncé à qui sait le voir.** Un indice de PER ou de SAV arrive avant l'accident. Le joueur ne doit jamais se sentir piégé par un danger invisible.
3. **Le savoir des autres a de la valeur.** Un Voltaïque qui identifie un liquide pour un autre joueur lui rend un vrai service, qu'on peut payer en wotts.

---

## 8. Produire la bibliothèque

Une bibliothèque de plus de 1 000 objets demande une **chaîne de production de contenu** :

| Étape | Outil | Règle |
|---|---|---|
| **Saisie** | Tableur partagé : une feuille par niveau (N0 à N4), une par matériau, une par recette | Tout est donnée : aucun objet dans le code |
| **Export** | Script tableur → JSON (format du Book 02 §16) | Automatique |
| **Calculs** | Script de calcul de l'énergie grise, de la masse, du démontage | L'énergie grise n'est **jamais saisie à la main** |
| **Validation** | Script de contrôle | Voir ci-dessous |
| **Revue réaliste** | Relecture humaine, par domaine (métal, électricité, agriculture, chimie) | « Peut-on vraiment faire ça ? » |

**Contrôles automatiques à chaque modification :**

- toute pièce utilisée existe, et elle est obtenable (par la nature, la fouille ou une recette) ;
- aucune boucle de recettes ne crée de wotts à partir de rien (Book 02 §15) ;
- chaque famille garde ses domaines (au moins 20 % moins chère) et son autonomie (jamais plus de 3 fois plus chère) ;
- tout matériau dangereux a un contenant compatible quelque part dans la bibliothèque ;
- tout objet trouvé dans les ruines peut être démonté ou utilisé (pas d'objet inutile).

> **Génération assistée :** on peut faire proposer des fiches d'objets par une IA à partir des propriétés et de la composition, mais **chaque fiche est relue** avant d'entrer dans la bibliothèque. La crédibilité est le premier pilier du jeu.

---

## 9. Ordre de construction proposé

Il n'est pas nécessaire d'avoir 1 150 objets pour commencer à tester.

| Étape | Contenu | Objectif |
|---|---|---|
| **1. Socle** | ≈ 30 matériaux, toutes les qualités d'outil, ≈ 80 objets (premières heures, Book 02 §14) | Tester la boucle de base : collecter, démonter, fabriquer |
| **2. Familles** | + une chaîne complète par famille jusqu'au palier II (≈ 150 objets) | Tester l'équilibrage entre familles |
| **3. Économie** | + objets d'échange et vestiges rares (≈ 300 objets) | Tester les cours et le commerce |
| **4. Profondeur** | Paliers III, chimie, électronique complète (≈ 1 150 objets) | Lancement |
| **5. Extension continue** | Nouveaux vestiges, nouvelles ruines, nouveaux livres | Vie du jeu |

---

## 10. Questions ouvertes

- [ ] **Qualités d'outil :** valider la liste et l'échelle à 3 niveaux.
- [x] **Sidérurgie :** ✅ une sidérurgie **simplifiée mais réaliste** (bas fourneau, loupe, cinglage, cémentation). Détail : Book 04.
- [ ] **Expérimentation :** quels tests sont disponibles dès le départ ? Faut-il un outil pour chacun (aimant, multimètre) ?
- [ ] **Livres :** combien de livres, quel découpage du savoir ? Un livre peut-il être recopié (papier, encre, temps) ?
- [x] **Savoir et mort :** ✅ le savoir est **conservé** à la mort. Seul l'inventaire courant est perdu.
- [x] **Chimie :** ✅ **basique mais réaliste** : acides et bases, saponification, chaux, fermentation, distillation, etc. Détail et limites : Book 04.

---

## Glossaire

- **Qualité d'outil** : capacité d'un objet à réaliser une action (couper, marteler…), avec un niveau de 1 à 3. Les recettes demandent des qualités, pas des outils précis.
- **Propriété** : caractéristique physique d'un matériau (dureté, corrosivité…), qui décide de ce qu'on peut en faire.
- **Niveaux N0 à N4** : ressource, matériau, pièce, objet, ensemble.
- **Recette pressentie** : recette dont le joueur devine l'existence sans la connaître encore.
- **Recette dévoilée** : recette connue à laquelle le personnage a pensé (§5.7) ; seule une recette dévoilée s'affiche dans Fabriquer et se fabrique.
- **Carnet** : registre personnel du savoir du joueur.
- **Expérimentation** : test réaliste qui révèle les propriétés d'un objet inconnu.
