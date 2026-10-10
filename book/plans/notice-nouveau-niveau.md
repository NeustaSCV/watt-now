# Notice : concevoir un nouveau niveau (L#A, L#B, H#A, H#B)

> Méthode de travail · version 0.1 · 2026-10-10
> **Statut : une méthode, rien n'est décidé ni appliqué.** Elle sert à préparer les **propositions** d'un niveau N ; le porteur du projet tranche ensuite, une ligne à la fois.
> **Pour qui** : un humain ou un agent qui doit peupler le niveau N (deux lieux personnels L#A et L#B, deux haltes H#A et H#B) en respectant tout ce qui a été décidé pour les niveaux 1 et 2.
> **Sources** (toutes lues pour l'écrire, citées entre parenthèses dans le texte) :
> - `.claude-travail/propositions/` : `progression-par-ingredients-page.json` (v5.1 : `regles`, `decisions`, `lieux`, `outils`, `lignees`, `familles`, `parcours`, `tableau_maitre`, `armes_par_famille`, `objets_a_creer`, `objets_a_retirer`), `progression-par-ingredients.md`, `ingredients-par-lieu.json` et `.md`, `armes-graphique.json`, `decisions-armes.json`, `armes-par-niveau.md`, `avis-game-designer.md` ;
> - la bible `book/bible/progression-et-equilibrage.html` (reconstruite à partir des mêmes JSON) ;
> - les Books 06, 12, 15, 17, 20, 23, 24 et 25 ;
> - `batiment/LIVRAISON.md`, `batiment/catalogue.js` et les `FICHE` des modèles ;
> - le code, en lecture seule : `commun/src/lignees.ts`, `recettes.ts` et `recettes/*.ts`, `armes/*.ts`, `etoiles.ts`, `dechets.ts`, `vestiges.ts`, `halte.ts`, `lieux.ts`, `objets.ts`.
>
> Le budget du §3.i reprend les chiffres et les décisions de l'étude `candidats-h1b-l1b-et-budget.md` (2026-10-10).

---

## 0. En bref

- **Un niveau N, c'est quatre lieux** : une halte partagée et un lieu personnel sur chacune des deux routes (H#A puis L#A, H#B puis L#B). Les haltes donnent des **matériaux de base** ; les lieux L donnent des **clés**, et chaque clé fait monter un meuble d'un cran.
- **La notice a six parties** :
  1. les **règles** à respecter (44, numérotées, avec leur source) ;
  2. les **entrées** : ce qu'il faut relever de l'état existant ;
  3. la **démarche** en neuf étapes, avec des questions guides et des calculs ;
  4. les **contrôles** à passer avant de proposer ;
  5. le **format de sortie**, pour que le résultat s'ajoute à la bible ;
  6. **deux exemples** : le niveau 1 tel qu'il a été décidé (la méthode retrouve les décisions), puis le niveau 2 (elle confirme, et produit les pistes qui manquent : les lieux, les Éteints, les armes trouvées).
- **Ce que produit un passage de la notice** : les nouvelles évolutions de meubles, les nouvelles clés, les éventuels nouveaux matériaux de base, les armes et leurs étoiles pour l'étape N, les Éteints du niveau, les lieux proposés, le budget de matériaux et d'allers-retours, puis **des propositions numérotées, une par ligne**, et les questions ouvertes.
- **La méthode du porteur, qui prime sur tout** : proposer, **ne rien appliquer sans décision explicite**, une modification par ligne (V5-7 : « propositions à soumettre une par une, sans modifier le tableau directement »).

---

## 1. Les règles à respecter

*Chaque règle porte un numéro (R1…R48) et sa source. « Décidé » : une décision du porteur ; « repère » : une valeur d'étude, pas encore tranchée. Les identifiants entre parenthèses renvoient au champ `decisions` du tableau maître ou aux études citées.*

### 1.A Les meubles et la progression

| # | Règle | Source |
|---|---|---|
| **R1** | **Plus de paliers.** On construit une évolution avec trois choses : le niveau d'avant **posé**, les matériaux, l'outil. Rien d'autre (pas de niveau de joueur). | `regles` « Construire » ; `progression-par-ingredients.md` §0.3 |
| **R2** | **Un lieu, un niveau.** Le lieu personnel L#X donne le niveau N : **plusieurs clés pour plusieurs meubles**, mais **au plus un niveau de plus par lignée** dans un même lieu. Un accessoire peut s'ajouter au niveau (L1A : le foyer de cuisine **et** la marmite norvégienne). | `regles` « Un lieu, un niveau » ; Book 24 §2.1 |
| **R3** | **Le niveau d'avant vient d'un niveau de lieu plus bas** (maison, H ou L de rang < N), jamais de l'autre L du même rang : le joueur choisit librement l'ordre L#A / L#B. | `parcours` (sorties 3 et 4 « au choix ») ; vérification ligne à ligne de `ingredients-par-lieu.md` §1.1 |
| **R4** | **On bride le confort, jamais la survie.** Le niveau 1 de chaque lignée se fait à la maison et suffit à vivre ; les clés apportent l'économie, le volume, le confort. | `avis-game-designer.md` R9 |
| **R5** | **Une lignée peut s'arrêter, une autre peut naître.** L'eau s'arrête à 5 → 10 → 20 L et se grise à partir de L3 ; la lumière et l'alarme sont nées pour remplir le niveau 2. Une lignée nouvelle a toujours son niveau 1 **à la maison**, en matériaux de base. | V4-7, V5-6 |
| **R6** | **Pas de bois vert** : le bois est sec ; aucune évolution ne demande de faire sécher du bois. | Hypothèse du porteur, `avis-game-designer.md` en tête |
| **R7** | **Niveau ou accessoire** : un niveau change la structure (une variante de maillage), un accessoire se monte dessus. Le coût d'un niveau est **la différence** avec le niveau d'avant. Le plafond de **3 foyers** reste (forge et charbonnière à part). | Book 24 §2.1, §2.3, §4.2 ; `lignees.ts` (`MAX_FOYERS`) |

### 1.B Les clés

| # | Règle | Source |
|---|---|---|
| **R8** | **Une clé est un ingrédient ou un outil.** **Une porte, une clé** : une évolution demande **au plus un** objet de dehors (ingrédient **ou** outil), tout le reste est en matériaux de base. Une clé-outil (le rabot, le fer à souder) **est** la clé. | `regles` « Les clés » ; `avis-game-designer.md` règle 2 |
| **R9** | **Quatre sources par clé** : **garantie** (une place fixe dans son lieu L, qui revient), **chance** (rare, fixée à la main), **repli** (une recette plus chère ou moins bonne, ou « aucun » si le réel l'impose, comme le rabot), **Comptoir** (après une première visite du lieu). La pièce de famille n'est pas au Comptoir. | `regles` « Les clés » ; `avis-game-designer.md` règle 1 ; I7 |
| **R10** | **Le niveau 1 n'a rien de propre à une famille.** Seule exception : la **pièce de famille**, garantie à H1A dans le tutoriel (⚡ panneau, 🔥 enclume, ⚙️ petit alternateur). | V4-4, V4-5, V5-1 |
| **R11** | **À partir du niveau 2 : une seule clé par famille pour tout le niveau**, dans L#A **ou** dans L#B, pas les deux. | V4-4, V5-5 |
| **R12** | **Le mélange** : à partir du niveau 2, la clé suivante d'un meuble peut changer de route ; **rien ne doit être prévisible**. L'exception ouverte : l'établi reste sur la route B au niveau 2 (C12, « plus tard »). | V4-1, C12 |
| **R13** | **Deux routes de difficulté équivalente** : même nombre de clés (3 et 3 au niveau 1, 5 et 5 au niveau 2), même danger, même distance à peu près, des armes trouvées de même rang. | `progression-par-ingredients.md` §0.1 et §2 ; A6, I22, I30 |
| **R14** | **La clé de famille sert à sa famille, seule.** Elle doit ouvrir une marche visible du métier, sans l'aide des autres familles (leçon des roulements, qui ne donnaient rien au Mécaniste seul : P9). | `armes-par-niveau.md` §2.3 et P9 |
| **R15** | **Une clé ne traîne pas avant son lieu.** Si l'objet existe déjà comme déchet ou vestige courant, on le retire des tables de fouille courantes, ou l'on change de clé (le jerrican devenu « jerrican percé », la casserole remplacée par la cocotte, l'étau sorti des fouilles). | C3, I5, I6, I7 |
| **R16** | **Une trouvaille précoce n'est jamais perdue** : l'idée est gardée (« un jour ») et la fiche du meuble la montre déjà en poche. | `avis-game-designer.md` règle 3 ; champ `idee_plus_tard` |

### 1.C Les haltes, le butin et les matériaux

| # | Règle | Source |
|---|---|---|
| **R17** | **Les haltes donnent des matériaux de base**, en vrac, et des tirages personnels. **Pas de clé garantie** dans une halte (sauf la pièce de famille de H1A). | `regles` « Les haltes » |
| **R18** | **Une halte a un thème**, une identité de matière, et les deux haltes d'un niveau se complètent (H1A bois et métal / H1B pierre, glaise et rive ; H2A électrique et atelier / H2B pierre, terre et bois d'œuvre). | I1, I11, I14, I15 ; `avis-game-designer.md` règle 8 |
| **R19** | **La règle du butin** : les clés de L_k sont **rares** à H_k et dans l'autre L_k, **plus courantes** à partir de H_(k+1) et L_(k+1). Au niveau N, on trouve donc couramment les clés des niveaux < N, rarement celles de l'autre L_N. | R-BUTIN |
| **R20** | **Les matériaux d'une évolution se trouvent au plus tard à H_N**, de préférence sur la même route. **Les routes peuvent se croiser** (l'acier 🔥 à H2A pour une clé 🔥 à L2B ; la glaise de H1B pour le four), mais chaque croisement est **écrit** et vérifié. | `progression-par-ingredients.md` §2 ; I14 ; N1 corrigée par I29 |
| **R21** | **Pas d'ingrédient orphelin** : chaque matériau sert à au moins une recette ; un matériau sans usage sort du jeu (sable, bois flotté, planches de halte, chablis, mèche). Un **nouveau matériau de base** ne se crée que s'il sert à **au moins deux** recettes. | I11, I15, I17, I26, I31 ; `ingredients-par-lieu.md` §3.1 |
| **R22** | **Personnel ou partagé.** Un lieu L est une instance **personnelle** (un par joueur, comme la Coopérative) ; une halte est **partagée** (le vrac est commun, les trouvailles sont des tirages personnels). Aucun objet-clé garanti dans un lieu partagé, sauf s'il est personnel (chacun voit le sien). | Book 23 §2.1 ; `avis-game-designer.md` R4 et Q3 ; `lieux` (`personnel`, `partage`) |

### 1.D Les outils

| # | Règle | Source |
|---|---|---|
| **R23** | **Les outils sont des portes dures**, mais **plusieurs outils sont compatibles** pour une même qualité, et les **objets de fortune** donnent le niveau 1. Le premier outil d'une qualité se fabrique en version pauvre. Une **qualité nouvelle** ne se crée que si le réel l'impose (Raboter, Souder). Un outil peut **rouvrir un lieu connu**. | `regles` « Les outils » ; V4-9 ; `avis-game-designer.md` règle 5 ; `outils` |

### 1.E Les armes

| # | Règle | Source |
|---|---|---|
| **R24** | **Les dégâts des armes fabriquées suivent l'étape**, en bandes (dégâts au torse d'un coup simple ou d'un tir plein) : maison 0 – 1 ; H1 0,8 – 1,5 (flottement accepté) ; L1 1 – 2 ; L2 2 – 3 ; L3 3 – 4 *(à confirmer)* ; plus tard 4 – 5 *(à confirmer)*. **La bande prime** sur le plafond d'étoiles. | R-DEGATS ; R-ARMES-1 ; `armes-par-niveau.md` §11.1 |
| **R25** | **La grille des étoiles**, pour une famille **seule** : ★ maison, ★★ H1 et L1, ★★★ L2, ★★★★ L3, ★★★★★ plus tard. **Avec une autre famille** : une étoile de plus, jamais deux. | Q-A2, Q-A2f ; `armes_par_famille.grille` |
| **R26** | **La formule des dégâts** : centre de l'étape × coefficient du type, moins 0,1 par étoile sous le plafond de l'étape ; ramené dans la bande ; arrondi à 0,05 ; toujours au-dessus de l'étoile d'avant. **L'équité** : à étape et étoiles égales, lame = arbalète = centre ; électrique × 0,9. | `armes-par-niveau.md` §11.1, §12 ; K1–K56 acceptées |
| **R27** | **Les rôles des familles** : 🔥 mêlée forte ; ⚡ mêlée étourdissante (elle raidit) ; ⚙️ jet. | R-ARMES-3 |
| **R28** | **Étoiles, relais, évolution au meuble.** Une même arme monte d'étoile en étoile, puis une arme supérieure **prend le relais**. Pour faire évoluer une arme, on la **rapporte sur son meuble** avec de nouvelles pièces : la réparer à son niveau, ou la faire monter au niveau d'après si le meuble le permet. | R-ARMES-1, R-ARMES-5 |
| **R29** | **La maîtrise** (10 exemplaires de la même sorte) donne l'étoile du dessus **avec ses vrais dégâts**, même si elle appartient à l'étape suivante (pas de plafond). Le niveau 1 se joue avec les armes de H1 et la maîtrise : pas d'étoile intermédiaire à L1. | J3 ; K-Q1 et K-Q2 (`decisions-armes.json`, `_regles_communes`) |
| **R30** | **Le garde-fou à chaque étape**, avec la meilleure arme qu'une famille fait **seule** à cette étape : (1) sur son terrain, l'arme qui le possède est la meilleure des trois ; (2) hors de son terrain, aucune n'est **plus de 2 fois** moins bonne (la lame contre l'Équipé et l'arbalète au contact jugées avec leur seconde arme : marteau, lance) ; (3) **au plus 3 fois** d'écart au coût par Errant. | Book 25 §8.4 et §8.7 ; P11 ; R-ARMES-2 |
| **R31** | **Les armes trouvées sont hors bandes** : on joue sur leur **usure** (une arme très forte mais très abîmée) ; elles n'ont pas d'étoiles et ne se refont pas. Les deux routes d'un niveau en trouvent **de même rang** (pied-de-biche de L1A, fourche à foin de L1B). | R-DEGATS ; I22, I30 ; Q-A2b |
| **R32** | **Le marteau commun reste sous les armes de métier** (il ne tue plus à la tête d'un coup) ; la tête d'un marteau ne s'use pas, on **répare le manche**, sans forge, pour que toutes les familles le puissent. | Q-A3 ; R-ARMES-2 ; R-ARMES-4 |
| **R33** | **Le jet se juge en dégâts × portée de tête.** L'arbalète garde la portée de tête de ★★★ (12 m) au-dessus de ★★★ ; seuls ses dégâts et sa solidité montent. | R-ARMES-2 ; Q-A1d ; Q-B3 (en attente pour ★★★★★) |
| **R34** | **Ne pas inventer ce qui est « à venir »** : le relais d'armes, les caractéristiques (bonus et malus selon les ennemis), les munitions, les ennemis. Une proposition de niveau peut les **signaler**, pas les fixer. | Décision « À VENIR » |

### 1.F Les Éteints

| # | Règle | Source |
|---|---|---|
| **R35** | **Les Éteints se renforcent d'un lieu à l'autre** (Éteints évolués : casque et autres, à définir). Pas de mutants : des corps différents. **Repère** : pour garder deux coups au torse par Errant, leur résistance au torse suit à peu près le centre de la bande, **≈ × 1,7 à L2 et × 2,3 à L3 par rapport à H1** (un Errant tombe aujourd'hui à 3 points, un Équipé à 4). | R-DEGATS ; Book 06 §5 ; `armes-par-niveau.md` §11.5 ; `armes-graphique.json` (`regles`) |

### 1.G Les familles

| # | Règle | Source |
|---|---|---|
| **R36** | **Chaque famille est autonome pour sa base** : seul, on fait sa base ; ensemble, on la fait mieux. Les dépendances entre familles n'ouvrent que les améliorations (une étoile de plus, les variantes, les accessoires) et ne bloquent jamais le cœur d'une famille ; sinon, une **voie autonome** plus modeste. | Book 25 §2.5 |
| **R37** | **Hors de sa famille** : recette × 1,5 en matières et en temps, produit plafonné à ★★ ; les installations de métier restent utilisables par tous. | Book 25 §2.2 et §2.3 ; Book 24 §2.3 ; `etoiles.ts` (`PLAFOND_HORS_FAMILLE`) |

### 1.H Les noms, l'idée et l'indice

| # | Règle | Source |
|---|---|---|
| **R38** | **Des noms uniques partout** (jeu, books, bible) : un objet, un nom ; un mot réservé ne sert pas ailleurs (« soufflet » est réservé à la clé de la forge ventilée ; « petit alternateur » partout). | NOMS, NOMS-2 |
| **R39** | **« Tu y penses » et l'indice.** Au premier ramassage d'une clé : un message du carnet (deux lignes au plus), ou « un jour » si le niveau d'avant manque. La fiche du meuble montre **le niveau suivant seulement** et un **indice en deux temps** : le type de lieu, puis le coin. Rien n'est montré au-delà (une silhouette). | `regles` « L'idée et l'indice » ; `avis-game-designer.md` règles 3 et 4, R5, R7 |

### 1.I La logistique, le monde et la technique

| # | Règle | Source |
|---|---|---|
| **R40** | **Poids et allers-retours** : les clés sont légères, la matière lourde reste proche (pierres et bûches aux haltes, qui reviennent). On porte 10 kg en poches, 30 kg au sac de fortune, 55 kg au sac à dos ; un trajet coûte 60 kcal et 0,08 L d'eau par km. **Chaque retour des trois premières heures rapporte une porte.** | `avis-game-designer.md` R3 et règle 7 ; Book 12 §2.1 ; `lieux.ts` (`KCAL_PAR_KM`, `EAU_PAR_KM`) ; `objets.ts` (pierre 2 kg, bûche 2 kg, branche 0,5 kg, barre 2 kg, corde 1 kg, bâche 1,5 kg) |
| **R41** | **Les règles des lieux** : chaque ressource existe dans au moins deux lieux, dont un avant le lointain ; le danger suit la richesse ; chaque lieu raconte l'Âge de l'Abondance ; les lieux de flux se régénèrent ; chaque famille a ses lieux phares à chaque anneau. Les lieux et leur place restent **provisoires** (on écrit L3A, H3B…). | Book 20 §5 ; V4-10 |
| **R42** | **La performance** (Raspberry Pi 4, iPhone 13 mini) : une instance L coûte ≈ 17 ms de calcul par seconde et par joueur pour **24 Éteints** (cible : retard p99 < 25 ms à 10 joueurs, tenue à 13,6 ms ; 23,2 ms à 20 joueurs) ; IA à 10 Hz et 2 Hz, calcul à l'entrée. Un modèle de lieu : **≤ 60 000 triangles, ≤ 40 appels de dessin, ≤ 8 lumières** par carte ; construction de 50 à 800 ms, derrière un chargement. Une halte fait ≈ 200 × 70 m, en tronçons. La fiche tient en 375 px. | Book 17 §5.2 ; Book 23 (0.5g) ; `batiment/LIVRAISON.md` ; `avis-game-designer.md` R5 |
| **R43** | **Le ton** : l'absurde est dans les vestiges et les souvenirs, la survie est sérieuse ; pas d'armes modernes (un fusil trouvé reste du décor). | Book 15 §1 et §4 ; Book 20 §6 |
| **R44** | **La méthode du porteur** : proposer, ne rien appliquer sans décision explicite, **une modification par ligne** ; relire un book juste avant de le modifier (plusieurs sessions y travaillent) ; `PROPOSITIONS.md` en lecture seule ; brouillons et sauvegardes dans `.claude-travail/` ; tout en français. | V5-7 ; `CLAUDE.md` du projet |

### 1.J Les réserves, le ravitaillement et l'interface (décisions du 2026-10-10)

| # | Règle | Source |
|---|---|---|
| **R45** | **Les réserves des haltes reviennent vite ; celles du terrain jamais.** Le vrac partagé d'une halte (bûches, pierres) revient **en 30 minutes** (la station : 12 bûches) ; les pierres et les bûches du **terrain** ne reviennent pas (les branches, oui, en 40 min). Le vrac grandit avec le nombre de voyageurs présents : **+ 50 % par voyageur, jusqu'à × 3**. | B1, B2, B4, B8 (`candidats-h1b-l1b-et-budget.md`) |
| **R46** | **Les tas personnels.** Une halte qui fournit la matière lourde d'un niveau a, en plus du vrac, un **tas personnel** par joueur, qui revient en **6 h réelles** (station : un tas de bois de 10 bûches ; gué : un banc de galets de 8 pierres). Un joueur n'attend jamais qu'un autre ait vidé le stock. | B3, B5 ; R22 |
| **R47** | **Le Comptoir est un filet payant pour les matériaux de base** : un petit stock (10 bûches, 10 pierres), un réassort lent (1 toutes les 2 h), au prix de vente. Ni bloquant, ni gratuit. | B13 |
| **R48** | **Pas de dialogue à croix.** Un avertissement ou un conseil se ferme **avec un bouton**, jamais par une fenêtre de dialogue avec une croix : « les dialogues avec une croix cassent complètement la dynamique de jeu ». | B14 (condition du porteur) |

---

## 2. Les entrées : ce qu'il faut relever avant de commencer

*À faire à chaque fois : les fichiers bougent vite (plusieurs sessions en parallèle). Relever, ne rien recopier de mémoire.*

### 2.1 Les fichiers à lire, et ce qu'on y prend

| Fichier | Ce qu'on y relève pour le niveau N |
|---|---|
| `progression-par-ingredients-page.json` · `lignees` | Pour chaque lignée : son **dernier niveau placé**, le **lieu** de ce niveau (`niveau_lieu`), son `etat` (`existe`, `change`, `nouveau`, `0b`, `plus_tard`) ; les évolutions déjà « réservées » pour L3 ou plus tard |
| idem · `tableau_maitre` | Les lignes de niveau de lieu < N (les meubles **et** les 25 lignes « Armes … ») ; les lignes en état `a_trancher` |
| idem · `lieux` | La promesse, le domaine, le garanti, le par-chance de chaque lieu existant ; l'entrée « L3 » (les clés déjà nommées : poêle en fonte, paille, disque de scie, câble, fût, courroie) |
| idem · `outils` | Les qualités et leurs outils, par niveau ; les objets de fortune |
| idem · `decisions`, `questions` | Tout ce qui touche N (par exemple V5-7, Q-B2, C12) |
| idem · `armes_par_famille` | La grille, la suite d'armes de chaque famille, `avec_les_autres` |
| `decisions-armes.json` | Pour chaque arme : `par_etoiles` (dégâts, solidité décidés) et `niveau_par_etoiles` (l'étape de chaque étoile) ; `_regles_communes` |
| `armes-graphique.json` | Les 30 armes et 71 évolutions **telles que le code les définit** (chiffres, fabrication, meuble, réparation) ; `resume.niveau_null` (les étoiles sans étape) |
| `armes-par-niveau.md` | Les bandes, coefficients et propositions D1–D37, K1–K56 ; §12.3 (les armes qui manqueront d'étoiles : où il faudra un relais) |
| `ingredients-par-lieu.json` | Les `etapes` (thème, clés, matériaux avec quantités, outils, par-chance, manque) ; `ingredients_a_usage_unique` ; `objets_a_creer` et `objets_a_retirer` |
| Books 20 et 23 ; `batiment/` | Les lieux de la carte (environnement, anneau, danger) ; les modèles déjà faits (`catalogue.js`, `FICHE` : `lieu`, `danger`, `recit`, `reperes`, cartes, budgets) |
| Le code | Les noms réels (`objets.ts`, `_noms.txt` des recettes), les coûts « avec choix » (`lignees.ts`, `couts: Inventaire[]` : la clé **ou** le repli), les étoiles (`etoiles.ts`), les tables de fouille (`vestiges.ts`, `EN_PLUS_PAR_LIEU`), les déchets (`dechets.ts`, `PROFILS_DECHETS`) |

### 2.2 La fiche d'état à remplir (une page)

1. **Les lignées communes** : nom, dernier niveau, lieu de ce niveau, route de ce lieu, la lignée est-elle finie ?
2. **Les lignées de famille** : idem pour la forge 🔥, le banc ⚡, le pédalier ⚙️ ; la clé de famille de chaque niveau déjà placé, et sa route.
3. **Les armes** : pour chaque famille, la meilleure arme faite seule à l'étape N − 1, ses étoiles, ses dégâts ; les étoiles que `decisions-armes.json` place déjà à l'étape N.
4. **Les matériaux** : ce que chaque étape < N fournit (thème, quantités, « revient » ou non) ; ce qui s'épuise (les 26 pierres du terrain, les 16 bûches).
5. **Les lieux** : ceux qui existent dans le jeu, ceux qui sont provisoires, leur route et leur danger.
6. **Les points ouverts** qui touchent N.

### 2.3 L'état au 2026-10-10 (pour mémoire, à revérifier)

| Lignée | Niveau 1 (maison) | Niveau de lieu 1 | Niveau de lieu 2 | Réservé pour L3 ou plus tard |
|---|---|---|---|---|
| Feu | Feu de camp, foyer de pierres, Dakota, poêle-fusée, broche | Foyer de cuisine + marmite (L1A) | Four de terre (L2B) | Poêle (0b, poêle en fonte) |
| Eau | Récupérateur 5 L | Récupérateur à seau 10 L (L1A) | Récupérateur à jerrican 20 L (L2B) | **Finie** (grisée à partir de L3) |
| Couchage | Abri, abri garni | Abri fermé (L1B) | Abri doublé (L2A) | Hutte de torchis (0b, paille) |
| Stockage | Coffre, râtelier | Coffre cerclé (L1B) | Réserve couverte (L2A) | — |
| Établi | Établi, redresseur | Établi à étau (L1B) | Établi de menuisier (L2B) | — |
| Lumière | Torche plantée | — | Lanterne fixe (L2A) | — |
| Alarme | Alarme à boîtes | — | Cloche d'alarme (L2B) | — |
| 🔥 Forge | Charbonnière, bac de trempe ; foyer de forge (H1A, enclume) | — | Forge ventilée (L2B, soufflet) | Charbonnière en fût (fût) ; rail (★★★★★, plus tard) |
| ⚡ Banc | Clôtures ; banc solaire (H1A, panneau) | — | Poste de montage (L2A, fer à souder) | Ligne longue (câble) |
| ⚙️ Pédalier | Meule, tour à perche, pièges ; pédalier générateur (H1A, petit alternateur) | — | Roulements montés (L2A, roulements) | Scie à pédale (disque de scie) ; tour à pédale (courroie) |

| Étape | 🔥 seul | ⚡ seul | ⚙️ seul | Bande |
|---|---|---|---|---|
| H1 et L1 | machette forgée ★★ (1,2) | matraque électrique ★★ (1,1) | arbalète ★★ (1,2) | 0,8 – 1,5 puis 1 – 2 |
| L2 | machette ★★★ (2,5), hache (3,0), glaive (2,6) | contacts soudés ★★★ (2,25), aiguillon (2,0 – 2,1) | arbalète ★★★ (2,5), cranequin léger | 2 – 3 |
| L3 (placé, clé à définir : Q-B2) | machette ★★★★ (3,5) | contacts soudés ★★★★ (3,15), aiguillon ★★★★ (3,0) | arbalète ★★★★ (3,5) | 3 – 4 |

---

## 3. La démarche, pas à pas

*Neuf étapes, dans l'ordre. Chaque étape a ses questions guides, ses calculs, et ce qu'elle écrit dans le brouillon. On n'avance pas tant que la question d'une étape n'a pas de réponse ; si elle n'en a pas, elle devient une **question ouverte**.*

### 3.a Quels meubles montent d'un niveau, lesquels apparaissent

**Questions guides**

1. Quelles lignées ne sont **pas finies** (R5) ? Lesquelles attendent la 0b (`etat: "0b"`) et ne peuvent donc pas être jouées au niveau N ?
2. Pour chaque lignée vivante : **quel cran** de plus apporte quelque chose de **sensible** au joueur (« pourquoi y aller ») ? On vise une phrase concrète : « des nuits plus courtes », « le bois divisé par deux », pas un pourcentage.
3. Le cran proposé respecte-t-il R4 (le confort, pas la survie) et R7 (niveau ou accessoire, la différence de matériaux) ?
4. Faut-il une **lignée nouvelle** pour équilibrer le compte (§3.b) ? Si oui, a-t-elle un niveau 1 à la maison (R5) ?
5. Les trois **lignées de famille** : quel cran pour chacune, et ce cran ouvre-t-il **l'étoile de l'étape N** de l'arme de la famille (§3.c, R14) ?

**Le calcul du compte.** Soit C le nombre de lignées communes qui gagnent un cran au niveau N, et 3 les clés de famille (une par famille, R11). Le total T = C + 3 doit se partager **à égalité** entre L#A et L#B (R13). Si T est impair :

- une lignée commune **fait une pause** à ce niveau (elle reprendra au suivant), **ou**
- une lignée gagne un **accessoire** à clé dans le lieu le plus léger, **ou**
- une **lignée nouvelle** naît (R5).

*Exemple : au niveau 2, C = 7 (feu, eau, couchage, stockage, établi, lumière, alarme), T = 10, soit 5 et 5.*

**Ce qu'on écrit** : la liste des évolutions candidates, une ligne chacune (lignée, nom, niveau dans la lignée, niveau de lieu N, accessoire ou niveau, ce qu'elle apporte).

> **Deux numéros différents** : le **niveau du meuble** (son rang dans la lignée : le foyer de cuisine est le niveau 3 du feu) et le **niveau de lieu** N (L1A). Le tableau maître les garde tous deux (`niveau` et `niveau_lieu`).

### 3.b Répartir les clés entre L#A et L#B

**Questions guides**

1. **Le compte** est-il égal (R13) ? Le lieu qui reçoit deux clés de famille reçoit une clé commune de moins (au niveau 2 : L2A a ⚡ et ⚙️ avec 3 clés communes, L2B a 🔥 avec 4).
2. **Une clé par famille** (R11), et seulement à partir du niveau 2 (R10).
3. **Le mélange** (R12) : pour chaque lignée commune, sa clé de niveau N est-elle sur la **même route** que sa clé de niveau N − 1 ? On compte les changements.
4. **Le niveau d'avant** (R3) : chaque évolution de L#X demande un niveau d'avant placé à un rang < N.
5. **Le thème du lieu** : les clés d'un lieu forment-elles un ensemble crédible (un château a une chapelle, une remise, des communs) ? Le thème ne doit pas devenir un « domaine fixe » (V4-1).

**Le calcul du mélange.** Pour chaque lignée commune qui a un cran à N et un cran à un niveau de lieu antérieur : noter « change » si la route change. **Repères proposés** (heuristiques, pas des règles décidées) :

- au moins **la moitié** des lignées communes changent de route ;
- **aucune** lignée ne reste sur la même route trois niveaux de suite ;
- une famille ne garde pas la même route que sa clé du niveau d'avant **et** les deux autres familles la leur : la répartition des clés de famille doit bouger d'un niveau à l'autre (au niveau 2 : ⚡ ⚙️ sur A, 🔥 sur B).

**Ce qu'on écrit** : un tableau L#A / L#B, une ligne par clé (clé, lignée, cran, famille, « change de route : oui / non »), et le compte.

### 3.c Les armes de l'étape N

**Questions guides**

1. **Quelle étoile** la grille donne-t-elle seul à l'étape N (R25) ? Pour N ≥ 2 : ★ = N + 1 (L2 : ★★★, L3 : ★★★★, au-delà : ★★★★★, « plus tard »). Au niveau 1 : **rien de nouveau** (R29, K-Q2).
2. **Quelle bande** (R24) ? Pour N ≥ 1 : **[N ; N + 1]**, centre **N + 0,5**. Une halte H_N est entre les deux bandes (le flottement de H1).
3. **Quelles étoiles tombent à l'étape N** ? Celles dont `niveau_par_etoiles` vaut « L*N* » dans `decisions-armes.json`, et les étoiles encore sans étape (`resume.niveau_null` d'`armes-graphique.json`) que la grille y range (règle J2 : une évolution sans niveau prend la bande du niveau où la grille permet son étoile).
4. **Quel meuble** permet de fabriquer ou de faire monter chacune (R28) ? Au niveau N, c'est en principe **la clé de famille de N** qui l'ouvre (R14 ; c'est l'idée de Q-B2 pour L3).
5. **Quelles armes manquent d'étoiles** pour l'étape N (`armes-par-niveau.md` §12.3) et demandent un **relais** ? Le relais est « à venir » (R34) : on le signale, on ne le chiffre pas sans décision.
6. **Une arme nouvelle** est-elle nécessaire ? Seulement si une famille n'a rien à l'étape N, ou si le rôle d'une famille (R27) n'est plus tenu.
7. **Les armes trouvées** de L#A et L#B : même rang (R31) ?

**Le calcul des dégâts** (R26) :

```
dégâts = arrondi_0,05( borner( centre(N) × coef(type) − 0,1 × (étoile_plafond(N) − étoile), N, N + 1 ) )
et dégâts(étoile) > dégâts(étoile − 1)
```

| Type | Coef. |
|---|---|
| Machette, machette forgée (référence) ; arbalète ; marteau | 1,00 |
| Hache | 1,20 |
| Glaive | 1,05 |
| Lance à pointe forgée | 0,95 |
| Lance ; hachette ; arc ; hachette lancée ; **matraque électrique** | 0,90 |
| Gourdin ; serpe ; matraque de fortune ; aiguillon | 0,85 |
| Couteau de forge ; épieu | 0,75 |
| Couteau aiguisé | 0,70 |

*Vérification sur L3 (centre 3,5) : machette ★★★★ 3,5 ; arbalète 3,5 ; matraque 0,9 × 3,5 = 3,15 ; hache 1,2 × 3,5 = 4,2, bornée à 4,0. Ce sont bien D19, D36, D20 et K7.*

**La solidité** suit le pas des étoiles du code (`ETOILES` : × 0,5 · 0,75 · 1 · 1,5 · 2) et les valeurs décidées (arbalète 60 · 80 · 100 · 140 ; matraque électrique 60 · 60 · 80 · 110 ; aiguillon 40 · 50 · 60 · 80). **Le jet** : on calcule aussi dégâts × portée de tête (R33).

**Le garde-fou** (R30) : on le rejoue avec la meilleure arme seule de chaque famille à l'étape N, par les outils d'étude (`outils/armes-equilibre-niveaux.ts`, `outils/armes-decisions-chiffres.ts`, avec la copie `_equilibre-degats-electriques.ts` pour les dégâts électriques), sans toucher au code. **Points à surveiller** : l'électrique contre trois Errants à 15 m (vers 1,9 fois à L2 et L3) ; l'arbalète sur son propre terrain.

**Les armes trouvées (repère proposé, à trancher)** : une par lieu L, de même rang sur les deux routes (dégâts à 0,1 près, même « tue à la tête », solidité à 40 près) ; dégâts **au haut de la bande N, voire au-dessus**, mais une solidité basse ou un exemplaire déjà abîmé (sous 30 % : − 30 %, Book 23 §4.3) ; une seule fois (« revient : une fois ») ; pas d'étoiles.

**Ce qu'on écrit** : un tableau par famille (arme, étoile, étape, dégâts calculés, solidité, meuble qui l'ouvre, clé) ; les armes trouvées ; le résultat du garde-fou ; les relais à prévoir.

### 3.d Les matériaux de base, et leur partage entre H#A et H#B

**Questions guides**

1. **Que demandent** les évolutions communes, les meubles de famille et les armes de l'étape N ? On fait la liste, avec les quantités (« commun X ; 🔥 + Y »).
2. **Où se trouve chaque matériau** au plus tard à H_N (R20) ? Sur la même route que l'évolution qui le demande, sinon le croisement est écrit.
3. **Les thèmes** : quel est le thème de H#A, celui de H#B ? Se complètent-ils (R18) ? Le thème découle des besoins, pas l'inverse.
4. **Ce qui s'épuise** : la maison ne rend plus ses pierres ; les haltes doivent fournir ce qui « revient » (pierres, bûches, branches).
5. **Un matériau nouveau** est-il nécessaire ? Seulement s'il sert à **deux recettes au moins** et qu'il existe dans **deux lieux** (R21, R41). Sinon, prendre un objet qui existe déjà dans le code.
6. **Les orphelins** : un matériau du niveau N qui ne sert plus à rien sort (R21).

**Ce qu'on écrit** : pour H#A et H#B, au format `etapes` de `ingredients-par-lieu.json` : thème, matériaux (nom, quantité, sert à, existe, où), outils, par-chance, manque.

### 3.e Les outils requis

**Questions guides**

1. Quelles **qualités** (et quels niveaux de qualité) demandent les évolutions et les armes de N ?
2. Chacune est-elle **disponible au plus tard à N**, avec au moins un objet de fortune ou un outil fabricable en version pauvre (R23) ?
3. Une **porte dure** est-elle justifiée par le réel (on ne rabote pas au couteau) ? Une **qualité nouvelle** est-elle nécessaire ?
4. Une **clé-outil** compte comme la clé de l'évolution (R8) : pas d'ingrédient de dehors en plus.

**Ce qu'on écrit** : une ligne par qualité au format `outils` (qualité, sert à, outils par niveau avec `fortune`, `trouver`, `fabriquer`).

### 3.f Le butin opportuniste

**Questions guides**

1. Pour chaque clé de N : où est-elle **garantie** (place fixe, coin du lieu, délai de retour) ?
2. Où est-elle **rare** (H#A, H#B, l'autre L#) ? Est-elle déjà **courante** quelque part avant N dans le code (R15) ? Si oui : la retirer des tables courantes, ou changer de clé.
3. Quelles clés des niveaux < N deviennent **plus courantes** à H_N et L_N (R19) ?
4. Le **repli** existe-t-il, et est-il vraiment moins bon ? Le **Comptoir** la vend-il après une 1ʳᵉ visite (R9) ?

**Le délai de retour d'une place fixe (repère tiré des niveaux 1 et 2)** : **24 h** pour une clé qu'on peut vouloir en plusieurs (toile de jute, feuillards, cocotte, seau, couvertures, jerrican) ; **4 jours** pour un objet durable et unique (grillage, étau, tôles, lanterne-tempête, fer à souder, roulements, porte de four, rabot, cloche, soufflet) ; **une fois** pour une arme trouvée ; **12 h** pour un arbre.

**Ce qu'on écrit** : pour chaque clé, le bloc `cle` complet (`garanti`, `par_chance`, `repli`, `comptoir`) ; pour chaque lieu, le champ `par_chance`.

### 3.g Les Éteints du niveau

**Questions guides**

1. **Combien** dans chaque L ? Au plus **24**, comme la Coopérative, sinon il faut remesurer sur le Pi (R42).
2. **Quelles variantes** : Errants, Groupes, Rampants, Équipés, Dormants, Anciens habitants (Book 06 §5, Book 23 §3) ? Quelle **part d'Équipés** (le casque arrête le tranchant à la tête) ?
3. **Quel renforcement** (R35) ? Repère : résistance au torse d'un Errant ≈ 3 × 1,7 ≈ **5** à L2, ≈ 3 × 2,3 ≈ **7** à L3 ; d'un Équipé ≈ 6,8 et 9,2. **À confirmer** : les Éteints évolués (casque et autres) sont encore à définir.
4. **Un Ancien habitant porte-t-il une clé de porte** (comme le magasinier et le coffre du directeur) ? C'est un bon moyen de placer une clé garantie au fond du lieu.
5. Les **haltes** : quelques Éteints dispersés, plus nombreux près du butin (≈ 11 à la station : `halte.ts`).
6. Les deux L ont-ils **le même danger** (R13) ? On aligne le danger par le nombre et la nature des Éteints, pas par le chiffre indicatif du modèle 3D.

**Ce qu'on écrit** : un tableau par lieu (variante, nombre, où, comportement, réponse attendue), au format du Book 23 §3.

### 3.h Choisir les lieux idéaux

**Les critères**, notés de 0 à 2 chacun :

| Critère | Ce qu'on regarde |
|---|---|
| **Univers** | L'environnement du lieu (Book 20 §2) porte le thème des clés ; le lieu raconte l'Âge de l'Abondance (Book 15, R43) |
| **Carte** | La route : la halte H#X est **sur le chemin** entre L(N−1)X et L#X (Book 20 §4 : deux haltes par route principale) ; l'anneau monte avec N (H1 proche ; L1 moyen ; L2 moyen ; L3 moyen à lointain ; au-delà lointain) |
| **Distance** | Le trajet en km et en haltes depuis le terrain ; le coût en kcal et en eau (R40) ; les deux routes à peu près égales |
| **Danger croissant** | L1 ●● ; L2 ●● à ●●● ; L3 ●●● ; plus tard ●●●● ; les deux L d'un niveau au même danger |
| **Identité de ressource** | Chaque clé a un **coin** plausible dans le lieu (le deuxième temps de l'indice : « Le fournil de L2B ») |
| **Modèle existant** | Un dossier `batiment/<id>/` existe (cartes, budget ≤ 60 000 triangles et ≤ 40 appels, points de `fouille` et d'`eteints`) ; sinon, le coût d'un modèle neuf |
| **Pièges** | Une clé d'un **autre** niveau visible dans le décor du modèle (R15, R19) ; un objet hors du ton (une arme à feu) ; un passage qui demande une règle de jeu nouvelle (`LIVRAISON.md` « À savoir ») |

**Questions guides**

1. Quels modèles de `batiment/` ont l'anneau et le danger du niveau N ?
2. Chacune des clés de L#X a-t-elle un coin dans le modèle (lire les `reperes` de la `FICHE`) ?
3. Le décor montre-t-il déjà une clé d'un autre niveau ? Si oui : la laisser en décor, ou la rendre rare (règle du butin).
4. Les deux haltes et les deux lieux sont-ils de **même danger** et de **même longueur de trajet** ?

**Ce qu'on écrit** : pour chaque lieu, une proposition au format `lieux` (avec `nom` provisoire entre parenthèses), sa note sur les critères, une alternative.

### 3.i Le budget de matériaux et d'allers-retours

*Méthode et chiffres de l'étude `candidats-h1b-l1b-et-budget.md` (2026-10-10), avec les décisions du porteur en fin de fichier (B1 à B17). Elle a été faite pour le niveau 1 et une estimation du niveau 2 ; pour le niveau N, on refait les mêmes quatre tableaux.*

**Les constantes (code et décisions)**

| Valeur | Chiffre | Source |
|---|---|---|
| Poids | bûche 2 kg, pierre 2 kg, glaise 2 kg (B6), barre 2 kg, corde 1 kg, bâche 1,5 kg, charbon 1 kg, branche 0,5 kg, chiffon 0,1 kg | `objets.ts` ; B6 |
| Portage | sac à dos 55 kg (**≈ 45 kg libres** avec le kit, la gourde et les outils) ; travois + 50 kg ; brouette ⚙️ + 60 kg | `objets.ts`, `communes.ts`, `mecanistes.ts` |
| Trajet | ≈ 60 kcal/km à vide, ≈ 85 chargé : **≈ 435 kcal** par aller-retour terrain ↔ station (3 km). Les deux routes à la même distance : **3 km jusqu'à H1, puis 2 km jusqu'à L1** | `lieux.ts` ; B16 |
| Temps | 1 h de jeu = 1 min réelle ; un jour = 24 min réelles ; une nuit (21 h – 5 h 30) = 8,5 min réelles | `temps.ts` |
| Feu | feu de camp 1,5 kg/h ; foyer de pierres × 0,8, **× 0,2 couvert** ; poêle-fusée × 0,4 ; Dakota × 0,6 ; 1 L d'eau bouillie : 0,45 kg | `survie.ts`, `lignees.ts` |
| Charbon | une meule : **10 bûches, ou 5 bûches et 20 branches** (la charbonnette), + 4 branches → 4 charbons ; on la refait à chaque fournée | `charbonniers.ts` ; B9 |
| Corde | 4 fibres = 2 coupes de joncs ; ficelle : 2 fibres | `communes.ts` |

**Étape 1 — La demande « confortable », par famille et par niveau.** « Confortable » : chaque meuble de la bible jusqu'au niveau N, les deux voies du feu, l'escabeau, le râtelier, un travois et les armes de base de chaque famille. On compte, à partir du `tableau_maitre` (le chiffre du code entre parenthèses s'il diffère), un **tronc commun** puis ce que **chaque famille ajoute**. Les chiffres de l'étude :

| | Niveau 1 : bûches / pierres | Jusqu'au niveau 2 : bûches / pierres |
|---|---|---|
| Tronc commun | 17 / 15 (+ ≈ 82 branches, ≈ 20 coupes de joncs) | + 2 / + 10 (+ 4 glaises, 4 perches) |
| ⚡ | **20 / 15** | 22 / 25 |
| ⚙️ | **30 / 18** | 33 / 28 |
| 🔥 | **30 à 40 / 23** (1 ou 2 meules) | **62 à 72 / 39** (≈ 3 meules de plus) ; ≈ 30 bûches de moins avec la charbonnette (B9) |

*Le gourdin garde sa bûche (B10 refusée) : elle est comptée.*

**Étape 2 — Le feu à entretenir.** Il s'ajoute à la demande et se paie surtout en branches :

| Façon de faire | Par nuit | Par heure réelle |
|---|---|---|
| Feu de camp gardé toute la nuit | **6,4 bûches** (12,75 kg) | ≈ 23 bûches ou 93 branches |
| Foyer de pierres couvert la nuit | 1,3 bûche ou 5 branches | ≈ **37 branches** |
| Poêle-fusée, l'eau et un plat | — | ≈ 10 branches |

Les branches du terrain repoussent à ≈ 51 par heure réelle : avec le foyer couvert, le feu se fait aux branches. Le piège est le feu de camp gardé la nuit aux bûches (le terrain vide en 3 nuits) : d'où l'avertissement B14 (R48).

**Étape 3 — L'offre.** Pour chaque source jusqu'à H_N : la quantité, si elle revient et en combien de temps, si elle est **partagée** ou **personnelle**.

| Source | Bûches | Pierres | Branches | Autres |
|---|---|---|---|---|
| Terrain | 16, ne reviennent **jamais** | 26, ne reviennent **jamais** | 34, en 40 min | 7 touffes de joncs (30 min), 2 frênes (une perche / 6 h) |
| H1A, la station | **12 en vrac, toutes les 30 min** (B2) + **tas personnel de 10, toutes les 6 h** (B3) | en vrac, reviennent **en 30 min** (B4) | 26, en 40 min | — |
| H1B, le gué | — | **15 en vrac (30 min)** + **banc de galets personnel de 8 (6 h)** (B4, B5) | — | glaise inépuisable, 1 par geste de 6 s (B6) ; 6 touffes de joncs (30 min, B7) |
| L1B, le Moulin | **2 garanties (24 h)**, les poutres de l'atelier (B11) | — | — | — |
| Comptoir | **10 en stock**, + 1 toutes les 2 h, 19 wotts (B13) | **10**, + 1 toutes les 2 h, 7 wotts (B13) | — | un filet payant |
| Toutes les haltes | le vrac grandit de + 50 % par voyageur présent, jusqu'à × 3 (B8) | idem | — | — |

*Creuser un Dakota rend 5 pierres (B12). Le tas de bois personnel de H2B (B15) est « plus tard » : à proposer avec le niveau 2.*

**Étape 4 — Le bilan et les allers-retours.**

1. **Ce qui manque après le terrain** = demande − terrain, par famille et par matériau.
2. **Les visites** = manque ÷ ce qu'une visite rapporte à **un** joueur (son tas personnel + sa part du vrac), sans dépasser ≈ 45 kg par sac. Repère de l'étude : une visite typique à H1A rapporte **14 bûches et 10 pierres, soit 48 kg** : le sac est plein, le travois devient utile.
3. **Le coût** : 435 kcal et la traversée d'une halte par aller-retour ; le temps d'attente si le stock ne suffit pas.
4. **Le test « à 5 joueurs »** : refaire le calcul avec le vrac partagé entre 5 joueurs actifs (avant B2 à B8, la station donnait 1 à 2 bûches par visite, et le 🔥 du niveau 2 demandait 30 allers-retours et plus : bloquant).

Le résultat de l'étude, avec les décisions :

| | Allers-retours de ravitaillement, en plus des sorties prévues | Pierres |
|---|---|---|
| ⚡ | 0 (la visite du tutoriel suffit) | le terrain suffit |
| ⚙️ | 0 à 1 | le terrain suffit |
| 🔥, niveau 1 | 1 | la sortie au gué rapporte 8 à 15 pierres de réserve |
| 🔥, niveau 2 | 2 à 3, ou 1 à 2 avec la charbonnette | le gué puis H2B couvrent les 13 à 23 qui manquent |

**Le critère « confortable »** (celui de l'étude) : **confortable sans être gratuit**. Il faut sortir, porter et traverser une halte ; **1 à 4 sorties de ravitaillement** selon la famille et le niveau ; jamais d'attente bloquante sur un stock partagé ; le Comptoir reste un raccourci payant. Un résultat se classe : **confortable** ; **pénible** (plus de 4 sorties, ou des heures réelles d'attente) ; **bloquant** (un stock qui ne revient pas, ou une trentaine de sorties).

**Ce qu'on écrit** : les quatre tableaux (demande par famille, feu, offre, bilan), le classement de chaque famille au niveau N, et, si une famille est « pénible » ou « bloquante », les réglages proposés (vrac, tas personnel, délai de retour, recette de repli) au format des propositions B de l'étude.

---

## 4. Les contrôles, avant de proposer

*Chaque contrôle se coche, ou devient une question ouverte. Un seul « non » sans réponse bloque la proposition.*

**Les évolutions**

- [ ] **K1** — Chaque évolution du niveau N a : son **niveau d'avant** à un rang < N (R3), **sa clé** et ses quatre sources (R8, R9), des **matériaux trouvables** au plus tard à H_N (R20), **un outil** disponible au plus tard à N (R23).
- [ ] **K2** — Chaque lieu L#X donne **au plus un niveau** par lignée (accessoires à part) (R2).
- [ ] **K3** — **Une porte, une clé** : jamais un ingrédient de dehors **et** un outil de dehors pour la même évolution (R8).
- [ ] **K4** — Le **compte** est égal entre L#A et L#B (R13) ; **une** clé par famille sur tout le niveau (R11) ; rien de propre à une famille au niveau 1 (R10).
- [ ] **K5** — **Le mélange** : les changements de route sont comptés ; aucune lignée ne reste trois fois de suite sur la même route (repère du §3.b) ; les exceptions sont écrites (C12).
- [ ] **K6** — Chaque clé de famille ouvre, **seule**, une marche visible de sa famille (R14, R36).

**Les armes**

- [ ] **K7** — Les dégâts de chaque arme fabriquée sont **dans la bande** de leur étape (R24), calculés par la formule (R26), et **croissent** avec les étoiles.
- [ ] **K8** — La **grille** est tenue : aucune ★ au-dessus de N + 1 seul (R25) ; « avec les autres » : + 1 au plus.
- [ ] **K9** — Le **garde-fou** tient à l'étape N (R30) : les trois conditions, avec les chiffres du simulateur.
- [ ] **K10** — Les **rôles** sont tenus (R27) ; l'équité à étoiles égales (lame = arbalète, électrique × 0,9) (R26).
- [ ] **K11** — Les **armes trouvées** sont hors bandes, de même rang sur les deux routes (R31) ; aucune arme à feu (R43).
- [ ] **K12** — Les **relais** nécessaires sont signalés, pas inventés (R28, R34).

**Le butin, les matériaux, les familles**

- [ ] **K13** — Aucune clé de N n'est **courante** avant N dans le code (R15) ; la règle du butin est écrite pour chaque clé (R19).
- [ ] **K14** — **Pas d'ingrédient orphelin** : chaque matériau nouveau sert à deux recettes et existe dans deux lieux (R21, R41) ; les orphelins sont dans `objets_a_retirer`.
- [ ] **K15** — **Aucune famille lésée** : même nombre de crans de métier, même distance à la clé de famille, même budget à une charge près (R13, R36, `avis-game-designer.md` R8).
- [ ] **K16** — **Équilibre A / B** : même nombre de clés, même danger, même trajet à peu près, même rang d'arme trouvée (R13).
- [ ] **K17** — **Aucune clé garantie** dans une halte partagée (R17, R22).

**Les noms, le jeu, la technique**

- [ ] **K18** — **Pas de doublon de nom** : chaque nom nouveau est cherché dans `objets.ts`, `_noms.txt` (recettes), le tableau maître et les books ; les mots réservés sont respectés (R38).
- [ ] **K19** — Chaque clé a son **idée**, son **idée « un jour »** et son **indice en deux temps** (R39).
- [ ] **K20** — **Ce qui doit être créé ou retiré** dans le jeu est listé (`objets_a_creer`, `objets_a_retirer`), y compris les lieux eux-mêmes (`lieux.ts` ne connaît que quatre lieux : terrain, station, comptoir, coopérative).
- [ ] **K21** — **Performance** : ≤ 24 Éteints par instance L, ou une remesure prévue sur le Pi ; modèles dans le budget ; fiche lisible en 375 px (R42).
- [ ] **K22** — **Survie** : rien de vital ne dépend du niveau N (R4).

---

## 5. Le format de sortie

*Le résultat d'un passage de la notice tient en deux fichiers de proposition, dans `.claude-travail/propositions/` (par exemple `niveau-3-proposition.md` et `niveau-3-proposition.json`). Rien n'entre dans le tableau maître, la bible ni le code avant la décision du porteur. Une fois décidé, on l'ajoute aux sources (après une sauvegarde dans `sauvegardes/`), puis on relance les outils d'étude : `progression-par-ingredients.py` (qui réécrit le JSON), `armes-tableau.py` (idempotent, à relancer après), `construire-page.py` (la bible).*

### 5.1 Les lignes du tableau maître (`tableau_maitre`)

Mêmes champs que l'existant :

```json
{
  "meuble": "Le stockage",
  "famille": "tous",
  "evolution": "Nom unique de l'évolution",
  "niveau": 4,
  "niveau_lieu": "L3A",
  "cle": "nom de la clé",
  "cle_genre": "ingrédient",
  "materiaux": "4 bûches, 2 cordes",
  "outil": "Couper 1, Marteler 2",
  "permet": ["ce que le joueur gagne, en clair"],
  "recettes": [],
  "pourquoi": "La phrase « pourquoi y aller ».",
  "nouveau": true,
  "etat": "nouveau"
}
```

`cle_genre` : `"ingrédient"`, `"outil"` ou `null` (matériaux de base). `etat` : `existe`, `change`, `nouveau`, `0b`, `plus_tard`, `a_trancher`.

### 5.2 Le détail de l'évolution et de sa clé (`lignees[].evolutions`)

C'est la source du tableau maître ; la clé y porte ses quatre sources :

```json
{
  "id": "identifiant_unique",
  "nom": "Nom unique",
  "niveau": 4,
  "niveau_lieu": "L3A",
  "genre": "niveau",
  "famille": "tous",
  "etat": "nouveau",
  "nouveau": true,
  "cle": {
    "nom": "nom de la clé",
    "genre": "ingrédient",
    "lieu": "L3A",
    "garanti": "L3A (le coin du lieu, place fixe, revient 4 jours)",
    "par_chance": "rare à H3A, H3B et L3B ; plus courant au niveau 4 et après (règle du butin)",
    "repli": "la recette de repli, et ce qu'elle a de moins bon",
    "comptoir": "oui, après une 1re visite de L3A"
  },
  "outils": ["Couper 1"],
  "materiaux": "…",
  "gestes": ["…"],
  "recettes": [],
  "pourquoi": "…",
  "indice": ["Le besoin ? L'objet générique.", "Le coin de L3A."],
  "idee": "Cet objet, posé sur ton meuble : ce qu'il change. Tu y penses.",
  "idee_plus_tard": "Cet objet servira à ton meuble, un jour.",
  "note": "Décision ou proposition d'origine."
}
```

### 5.3 Les armes et leurs évolutions

- **Une étoile d'une arme qui existe dans le code** : une entrée de `decisions-armes.json`.

```json
"machette_forgee": {
  "date": "AAAA-MM-JJ",
  "pourquoi": "Proposition N3-xx : …",
  "par_etoiles": { "4": { "degats": 3.5, "solidite": 120 } },
  "niveau_par_etoiles": { "4": "L3" }
}
```

- **Une arme nouvelle** : elle n'entre **pas** dans `armes-graphique.json`, qui est lu dans le code (`outils/armes-graphique.ts`) ; elle va dans `objets_a_creer` avec tous ses chiffres (comme la fourche à foin, I30), et dans `armes_par_famille.familles[].suite` :

```json
{
  "niveau_lieu": "L3A",
  "arme": "Nom unique",
  "etoiles": 4,
  "melee_ou_jet": "mêlée",
  "chiffres": { "degats": 3.5, "type": "tranchant", "tue_a_la_tete": true, "allonge_m": 1.6, "coup_s": 0.5, "solidite": 120 },
  "cle": "la clé de famille qui l'ouvre",
  "decision": "N3-xx (proposée)"
}
```

- **Le garde-fou** : un tableau au format de `armes-par-niveau.md` §10.1 (trois à 5 m, groupe serré, la visite, trois à 15 m, coût par Errant, verdict).

### 5.4 Les clés et matériaux par étape (`ingredients-par-lieu.json`, `etapes`)

```json
{
  "id": "H3A",
  "nom": "H3A (provisoire : …)",
  "theme": "une identité de matière",
  "existe_dans_le_jeu": false,
  "cles": [],
  "materiaux": [
    { "nom": "pierres", "quantite": "12 (reviennent)", "sert_a": ["… (6, L3A)"], "existe": true, "ou": "en vrac" }
  ],
  "outils": ["Creuser 1 (gisement)"],
  "par_chance": ["clés de L2 : plus courantes (règle du butin)", "clés de L3 : rares"],
  "manque": ["le lieu"]
}
```

Pour un lieu L, `cles` liste « clé → évolution (le coin) ».

### 5.5 Ce qui change dans le jeu

```json
"objets_a_creer": [ { "nom": "…", "pour_quoi": "…", "ou": "…" } ],
"objets_a_retirer": [ { "nom": "…", "pourquoi": "…" } ]
```

### 5.6 Les lieux proposés (`lieux`)

```json
{
  "id": "L3A",
  "nom": "L3A (provisoire : le lieu proposé)",
  "icone": "🏭",
  "niveau": 3,
  "route": "A",
  "acces": "route A, après H3A",
  "personnel": true,
  "partage": "un par joueur",
  "existe": false,
  "promesse": "Ce qu'on y va chercher, en une ligne.",
  "danger": "Le combat du niveau 3.",
  "domaine": "mélangé",
  "garanti": [ { "quoi": "clé → évolution", "ou": "le coin", "revient": "4 jours" } ],
  "par_chance": [ { "quoi": "les clés de L2, plus couramment ; les clés de L3B, rarement (règle du butin)", "ou": "tirage personnel", "chance": "commun (L2) ; rare (L3)" } ],
  "pieces_de_famille": []
}
```

On ajoute, hors format, la note du §3.h et le modèle `batiment/` retenu.

### 5.7 Les propositions et les questions

- **Les propositions** : numérotées **N*n*-01, N*n*-02…** (le niveau, puis le rang), **une modification par ligne**, au format de `ingredients-par-lieu.json` :

```json
{ "id": "N3-01", "texte": "Une seule modification, dite en une phrase.", "pourquoi": "La règle ou le constat qui la justifie.", "statut": "proposée", "resout": [] }
```

  Dans le `.md`, le même contenu en tableau : `| # | Proposition | Pourquoi |`, avec « Rec. : » quand on recommande.
- **Les questions ouvertes** : numérotées **N*n*-Q1…**, une par ligne, avec la recommandation.
- **L'ordre de présentation au porteur** : d'abord le compte et la répartition des clés (§3.b), puis les armes (§3.c), puis les haltes et les matériaux, puis les lieux, puis le reste. Une décision en amont peut changer tout l'aval.

---

## 6. Deux exemples

### 6.1 La notice appliquée au niveau 1, tel qu'il a été décidé

*But : vérifier que la méthode retrouve les décisions du porteur. Chaque étape cite ce qu'elle aurait produit, et la décision qui l'a tranché.*

| Étape | Ce que la notice fait trouver | La décision qui l'a tranché |
|---|---|---|
| **3.a Les meubles** | Cinq lignées communes vivantes (feu, eau, couchage, stockage, établi) ; lumière et alarme n'ont pas encore de clé. Le feu gagne un niveau **et** un accessoire (R2) | Foyer de cuisine et marmite (L1A) ; récupérateur à seau ; abri fermé, coffre cerclé, établi à étau (L1B) |
| **3.b Les clés** | 5 lignées communes gagnent un cran, le feu avec un accessoire en plus : 6 clés, et aucune clé de famille au niveau 1 (R10), donc 3 et 3. La casserole qui ouvrait le bac de trempe 🔥 est signalée | V4-4 (le bac de trempe devient un meuble de matériaux de base, V5-4) ; domaines du niveau 1 : L1A le feu et l'eau, L1B le couchage, le stockage, l'établi |
| **3.c Les armes** | Rien de neuf à L1 (R29) ; la bande 1 – 2 n'est atteinte que par l'arc d'if ★★ et les armes trouvées. **K8 lève trois drapeaux** : l'arbalète ★★★ à l'if à H1A, l'arc simple ★★★ et le module à bobine ★★★ donnent ★★★ avant L2. **K16** : L1A a des armes trouvées, L1B aucune | K-Q2 ; les trois lignes « à trancher » du tableau (Q-B1) ; la bobine renvoyée à H2A (I12) ; la fourche à foin et l'if du bief à L1B (I22, I30) |
| **3.d Les matériaux** | Le récupérateur de 5 L manque de sacs ; les clous n'ont pas d'unité ; le sable et le bois flotté n'ont plus d'usage ; les haltes ont deux thèmes complémentaires | I28 (4 sacs garantis), I2 (poignées), I11 et I31 (orphelins retirés) ; I1 (H1A bois et métal), I11 (H1B pierre, glaise et rive) |
| **3.e Les outils** | Le coffre cerclé demande Marteler 2 : seuls les 🔥 l'ont avant L1A | I10 : la tête de marteau dans la caisse de la ruine, pour toutes les familles |
| **3.f Le butin** | La casserole (clé de L1A) est un vestige commun de la station ; l'étau sort de l'atelier une fouille sur douze ; le jerrican (clé de L2B) est un déchet commun (K13) | I6 (la cocotte), I7 (clés retirées des fouilles courantes), I5 (le jerrican percé), R-BUTIN |
| **3.g Les Éteints** | 24 Éteints au plus par instance (R42) | Book 23 §3 : la Coopérative, 24 Éteints placés |
| **3.h Les lieux** | L1A : la Coopérative (Campagne, moyen, ●●, existe) ; L1B : un lieu de rivière qui porte des sacs de farine, des tonneaux et un atelier → le **moulin** (`batiment/moulin`, Marais et rivière, moyen, danger 2 : magasin aux sacs de farine, atelier du charpentier, bief) ; H1B : le **gué** (`batiment/halte-gue`, galets, rive) | Lieux provisoires retenus : la Coopérative, le Moulin des Saules, la station, le Gué-aux-Saules (V4-10) |
| **3.i Le budget** | Les 26 pierres du terrain ne reviennent pas : 15 pour les meubles communs, 23 pour un 🔥 ; il faut une halte de pierre qui revient | H1B : 15 pierres en vrac qui reviennent (I11) |

**Conclusion** : la notice retrouve toutes les décisions du niveau 1, et elle aurait levé, avant de les voir au tableau, les incohérences C1 à C13 et A1 à A8 de `ingredients-par-lieu.md` §1.2.

### 6.2 La notice appliquée au niveau 2 : ce qu'elle confirme, et les pistes qu'elle produit

*Le contenu du niveau 2 est en grande partie décidé (V5-5, I21, I14, I15…), mais « le niveau 2 n'est pas finalisé » (I20) : ses lieux, ses Éteints et ses armes trouvées manquent. Les pistes ci-dessous **ne figent rien** ; ce sont des exemples de ce que produit un passage de la notice.*

**Ce que la notice confirme**

| Étape | Résultat |
|---|---|
| 3.a – 3.b | C = 7 (dont deux lignées nouvelles, lumière et alarme : R5), T = 10, **5 et 5**. L2A : réserve couverte, abri doublé, lanterne fixe, ⚡ poste de montage, ⚙️ roulements montés ; L2B : four de terre, récupérateur à jerrican, établi de menuisier, cloche d'alarme, 🔥 forge ventilée |
| Mélange (K5) | Feu A → B, eau A → B, couchage B → A, stockage B → A : **4 changements sur 5**. L'établi reste sur B : c'est C12, déjà ouverte (« plus tard ») |
| 3.c Les armes | Bande 2 – 3, centre 2,5, ★★★ : machette 2,5, hache 3,0, glaive 2,6 (🔥 forge ventilée) ; contacts soudés 2,25, aiguillon 2,0 – 2,1 (⚡ poste de montage) ; arbalète 2,5 et cranequin léger (⚙️ roulements montés). Garde-fou : **OK**, l'électrique à 1,92 contre trois à 15 m (`armes-par-niveau.md` §10.1) |
| 3.d Les matériaux | H2A électrique et atelier ; H2B pierre, terre et bois d'œuvre. Croisements écrits : l'acier 🔥 à H2A pour la forge de L2B (I14) ; les perches de la réserve (L2A) aussi à H2A (I29) |
| 3.e Les outils | Deux qualités nouvelles, Raboter et Souder, chacune portée par une clé-outil (V4-9) |
| 3.i Le budget | Communs de la route B ≈ 21 kg (6 pierres, 9 branches, 2 bûches, 1 corde) plus 4 glaises ; 🔥 + 14 kg (6 pierres, 1 barre) plus 2 glaises. Route A ≈ 11 kg plus 4 perches et une poignée de clous. Les pierres font l'essentiel : elles viennent de H2B (12, qui reviennent), juste avant L2B. **Une charge de sac à dos par route** : dans la cible. La glaise pèse 2 kg (B6) |

**Ce que la notice signale (contrôles en défaut ou vides)**

- **K16 et R31 : aucune arme trouvée n'est placée au niveau 2**, sur aucune des deux routes. Et Q-B4 propose de faire passer la **masse** de L1A au niveau 2.
- **3.g : les Éteints du niveau 2 ne sont pas définis** (résistance, Équipés, renforcement : R35).
- **3.h : les quatre lieux sont « à définir ».**
- **K13 à vérifier dans les modèles** : le décor des lieux candidats montre déjà des clés d'autres niveaux (voir les pistes de lieux).

**Les pistes (à proposer une par une, rien n'est décidé)**

| # | Piste | Pourquoi |
|---|---|---|
| N2-01 | **H2A (provisoire : le passage à niveau)**, `batiment/halte-passage-niveau` : le cuivre des signaux et du dépôt Wattbus, les cellules des trottinettes tombées des conteneurs, les ressorts à lames des wagons, les frênes des friches, une mobylette dans les garages du faubourg (la bobine, I12) | Le thème « électrique et atelier » (I14) y est entier, et la voie ferrée mène à L2A. *Alternative : les Superchargeurs Watty, plus électriques, mais sur la route de la Zone industrielle* |
| N2-02 | **L2A (provisoire : la gare)**, `batiment/gare` (Ville, anneau moyen, danger 3) : la **lampisterie** pour la lanterne-tempête, la **voiture-couchettes** pour les couvertures de laine, le **wagon couvert** pour les tôles, le **poste d'aiguillage** pour le fer à souder, les **boîtes d'essieu** pour les roulements | Chaque clé de L2A y a son coin (le second temps de l'indice). **Piège** : la pile de rails du quai n° 3 est le tronçon de rail, l'enclume ★★★★★ (« plus tard ») : elle reste du décor (R15) |
| N2-03 | **H2B (provisoire : la digue)**, `batiment/halte-digue` (Marais, entre proche et moyen, danger 2) : les enrochements (pierres), la berge (glaise), les saules et des frênes (perches de frêne), les huttes de chasse (chiffons) | Le thème « pierre, terre et bois d'œuvre » (I15), et la route des Marais continue celle du gué et du moulin (Book 20 §4 : la digue et le gué) |
| N2-04 | **L2B (provisoire : le château)**, `batiment/chateau`, carte des communs (Campagne, moyen à lointain, danger 3) : la **chapelle castrale** et sa cloche de bronze tombée (déjà modélisée), l'**établi de la remise** et ses jerricans (déjà modélisés), la **maréchalerie des écuries** pour le soufflet de forge, le **fournil** pour la porte de four, l'**atelier du menuisier** pour le rabot (ces trois coins à ajouter) | Les cinq clés de L2B y trouvent leur coin. **Pièges** : la sellerie montre des couvertures et une lanterne (clés de L2A : décor, ou rares par la règle du butin) ; le fusil de chasse rouillé reste du décor (R43). *Alternative pour la cloche seule : l'église du bourg, trop petite pour cinq clés* |
| N2-05 | **Aligner le danger** des deux haltes (la digue est notée 2, le passage à niveau 3) par le nombre d'Éteints, pas par le chiffre du modèle | R13 |
| N2-06 | **Une arme trouvée par L2**, de même rang : à L2A, **la masse** (Q-B4) devient une « masse de cantonnier » du dépôt de la gare ; à L2B, une arme de panoplie du château (piste : une hallebarde de l'escalier d'honneur, perçante, longue, très abîmée). Chiffres à proposer au §3.c (hors bandes, usure) | R31 ; le nom « masse » ne doit pas exister deux fois (R38) |
| N2-07 | **Les Éteints de L2** : 24 au plus par lieu ; une part d'Équipés plus forte qu'à la Coopérative ; un **Ancien habitant** qui porte une clé de porte (le lampiste et la lampisterie ; le palefrenier et la maréchalerie) ; la résistance au torse à proposer avec les Éteints évolués | R35, R42 ; le modèle du magasinier (Book 23 §3) |

### 6.3 Pour le niveau 3 : ce que la notice dit déjà

*Le niveau 3 est « à peupler » (V5-7). Sans rien proposer encore, la notice donne le cadre :*

- **Les armes** : étoile ★★★★, bande 3 – 4 (à confirmer), centre 3,5 ; les étoiles déjà placées à L3 (machette, hache, glaive, hachette, serpe, couteau de forge ★★★★ ; contacts soudés et aiguillon ★★★★ ; arbalète ★★★★ ; arc d'if ★★★★ ; arbalète lourde ★★ à ★★★★) attendent **leur clé de famille** (Q-B2, en attente). L'aiguillon n'a pas de ★★★★★ : son relais est à prévoir (R34).
- **Le compte** : l'eau est finie ; le poêle et la hutte attendent la 0b. Il reste au plus le stockage, l'établi, la lumière et l'alarme (C ≤ 4) : avec 3 clés de famille, T ≤ 7 est **impair** ou petit. Il faudra une pause, un accessoire à clé ou une lignée nouvelle (§3.a).
- **Les familles** : ⚙️ a deux clés candidates (disque de scie, courroie) pour **une** place (R11) ; la répartition 🔥 / ⚡ / ⚙️ entre L3A et L3B doit bouger par rapport au niveau 2 (§3.b).
- **Les lieux** : anneau moyen à lointain, danger ●●●. Les modèles de `batiment/` à regarder d'abord : le sanatorium d'altitude (Montagne, danger 3), le sanatorium marin (Littoral, 3), la centrale thermique et la mine (danger 4, peut-être trop tôt) ; pour les haltes, le col, le tunnel, le péage, la corniche.

---

## 7. Les questions ouvertes de la notice elle-même

*Ce que la notice ne peut pas trancher seule. Chacune se décide à part ; tant qu'elle ne l'est pas, la notice applique la recommandation en la marquant « proposée ».*

| # | Question | Recommandation |
|---|---|---|
| NOT-Q1 | Les **repères de mélange** du §3.b (la moitié des lignées change de route ; jamais trois fois la même route ; la répartition des familles bouge) deviennent-ils des règles ? | Oui, comme repères de contrôle, sans en faire des contraintes absolues |
| NOT-Q2 | Les **bandes L3 et « plus tard »** (3 – 4 et 4 – 5) sont-elles confirmées ? Et pour N ≥ 4, la bande [N ; N + 1] continue-t-elle, alors que la grille s'arrête à ★★★★★ ? | Confirmer 3 – 4 ; décider du relais avant de peupler un niveau 4 |
| NOT-Q3 | **Le relais d'armes** : une arme de relais commence-t-elle à ★ au bas de la bande de son étape, avec sa propre échelle d'étoiles ? | À traiter avec le chantier « à venir » (R34) avant le niveau 4 |
| NOT-Q4 | **Les armes trouvées** : le repère du §3.c (haut de la bande N, solidité basse ou exemplaire abîmé, une seule fois) est-il le bon ? | Oui, à mesurer au simulateur comme la fourche (I30) |
| NOT-Q5 | **Les Éteints renforcés** : la résistance au torse suit-elle le centre de la bande (× 1,7 à L2, × 2,3 à L3) ? Quels Éteints évolués (casque, autres) ? | À décider avant le niveau 2 en jeu : c'est ce qui garde le rythme de deux coups au torse |
| NOT-Q6 | **Les chances du butin** : quelles valeurs pour « rare » et « courant » ? | Partir de l'avis du game designer (≈ 3 à 5 % par tirage pour une trouvaille rare), puis régler au simulateur de rythme |
| NOT-Q7 | **Où écrire** le résultat d'un passage de la notice : `.claude-travail/propositions/niveau-N-proposition.md` et `.json` ? | Oui : la bible ne bouge qu'après décision |
