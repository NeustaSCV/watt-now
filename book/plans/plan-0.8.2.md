# Plan de développement — version 0.8.2 : les retours de jeu du niveau 1

*Version du plan : v0.2 · 2026-10-13 · **Statut : décidé, en cours de codage** (branche `integration-0-8-2`).*

*v0.2 (2026-10-13) : le porteur accepte toutes les recommandations du §7 ; Q-0.8.2-4 tranchée autrement (§7.1).*

*Code de départ : **0.8.1** (déployée le 2026-10-11). Sources : `plan-0.8.md` §9.3 (ce qui était prévu en « 0.8.1 », repoussé en 0.8.2) et **§9.4** (les remarques du porteur après avoir joué : R1 à R26), et le compte rendu de la recette finale de la 0.8 (`.claude-travail/wt/c18-recette/`).*

---

## 0. En bref

- **Ce que livre la 0.8.2** : pas de contenu nouveau, mais **le niveau 1 plus agréable à jouer** : un défaut bloquant corrigé (le coffre et la décharge sur téléphone), le gué plus lisible, une vue d'ensemble à l'arrivée dans un lieu, un sac et un écran plus clairs, des textes qui ne divulgâchent plus rien, des gestes plus rapides, des recettes simplifiées, et **un banc de recharge qui se comprend enfin**.
- **13 chantiers en 3 vagues** ; effort : **8 M, 4 S et 1 L**, soit environ **23 jours-agent** au milieu de la fourchette. **En pratique, avec les agents en parallèle comme pour la 0.8 : environ une journée de travail**, recette comprise (§6).
- **Rien de nouveau dans le monde** : ni lieu, ni niveau, ni arme. Une seule mécanique neuve, décidée par le porteur : la vue d'ensemble à l'arrivée (R4).
- **Pas de remise à zéro** des joueurs : la 0.8.2 relit les personnages de la 0.8.1 (un test le garantit, §5).
- **10 questions** à trancher avant de lancer (§7), dont 3 qui bloquent un chantier.

---

## 1. Le périmètre

### 1.1 Ce qui entre

| Source | Quoi |
|---|---|
| **Plan 0.8 §9.4** | Les remarques R1 à R26 du porteur, toutes |
| **Plan 0.8 §9.3** (ex-« 0.8.1 ») | Le feu qui prend d'abord les branches ; « Un vrai lit » en tête de « S'installer » ; le tas de bois et le stock du Comptoir en réglages à chaud ; le son du foyer de forge renommé ; la mesure du budget sur l'iPhone au gué et au Moulin ; les défauts de la recette (ci-dessous) |
| **Recette de la 0.8** | La caisse de l'atelier personnelle ; l'aide-mémoire des Voltaïques sur la barre d'action ; le guichet du Comptoir trop bas sur téléphone ; le dormant collé à l'établi de la pièce de famille ; au gué, l'Éteint coincé dans la chicane et le camping-car qui bloque depuis le nord ; le message « trop lourd » sans le poids de l'objet ; les textes d'Examiner coupés sur téléphone ; « pierre plate » dans la fiche de la forge enclume posée ; la note de la carte identique pour toutes les familles ; l'illustration manquante de l'accueil en paysage ; un objet jeté qui cache la porte de la laiterie |

### 1.2 Ce qui n'entre pas

- **L'allure** du meunier, du charpentier et du putréfié du Moulin (§9.3 : « plus tard, à voir »), sauf décision contraire (Q-0.8.2-10).
- **Les retouches du modèle du Moulin** (`demande-batiment-moulin-2.md`) : elles entrent **seulement si la session « bâtiments » les a livrées** au lancement ; sinon, elles attendent (le jeu les corrige déjà de son côté).
- **Le niveau 2**, les Éteints évolués, le relais d'armes (inchangé : plan 0.8 §8).

---

## 2. Les règles de jeu et d'interface que la 0.8.2 met en œuvre

*Le détail est au §9.4 du plan 0.8. Rappel des règles du porteur qui s'appliquent à tout.*

- **Les messages** : un message d'information (« Tu y penses ») n'a **pas de bouton** : un peu transparent, il ne bloque pas la vue et disparaît seul. Un avertissement (la bûche) garde son bouton « Compris ». Les panneaux ouverts au toucher ou à la souris gardent leur croix ; ce qu'on ouvre au bouton B se ferme par B.
- **Les textes** : jamais le mot « clé » (sauf la vraie grosse clé du Moulin) ; un indice nomme **le lieu**, jamais l'endroit exact ; la carte ne dit pas ce qu'on trouve dans un lieu ; aucun contenu des kits de départ dévoilé ; des textes courts.
- **Le dévoilement** : les armes de métier n'apparaissent (même en silhouette) qu'avec **le meuble de famille bâti ET équipé de sa pièce** (R26).
- **Les batteries** : chaque batterie est nommée par son nom (« la batterie de voiture de la ruine »…), jamais « grosse batterie » (R17).

---

## 3. Les chantiers

**Effort** : **S** = une demi-journée à un jour ; **M** = un à trois jours ; **L** = trois à cinq jours de travail d'un agent.

### Vague 1 · Le bloquant, les recettes, le banc

**Chantier A · Le coffre et la décharge sur téléphone** (vague 1, **M**, priorité)

- **Contenu** (R5) : sur téléphone, le panneau du coffre du terrain et celui de la décharge s'ouvrent mais ne répondent plus (ni choisir un objet, ni le déplacer, ni fermer). Trouver la cause (une couche qui capte les touchers, un panneau sous un autre, un `pointer-events`…), corriger, et **vérifier tous les panneaux du même genre** (coffre cerclé, râtelier, Coopérative, Moulin) au toucher.
- **Fichiers** : `client/src/hud.ts` (le panneau du coffre et de la décharge), `client/src/style.css`, `client/src/main.ts` (les gestes tactiles) selon la cause.
- **Tests** : un test du panneau (le bouton de fermeture et les cases reçoivent le geste) ; **captures à 375 × 630 et 812 × 320** avec Chrome en émulation tactile : ouvrir, déplacer un objet, fermer.

**Chantier B · Les recettes et les objets** (vague 1, **M**)

- **Contenu** :
  - **des ingrédients au choix dans une recette** (petit changement du moteur : `Recette.ingredients` accepte des façons alternatives, comme les `couts` des étapes) ; la fiche et Fabriquer montrent « 3 ficelles **ou** 1 corde » sur une seule ligne ;
  - **la corde d'arc** : une seule recette, 3 ficelles **ou** une corde (R15) ;
  - **la matraque électrique** : une seule recette, un pack de cellules **ou** la petite batterie (R16 ; la recette « (petite batterie) » disparaît) ;
  - ⚡ **les condensateurs** (R14, Q-0.8.2-4) : deux objets nouveaux, le **petit condensateur** (★, en démontant le flash jetable) et le **condensateur moyen** (★★, en démontant la raquette à moustiques) ; l'un ou l'autre fait **le module de décharge** (un seul module, qui prend l'étoile de son condensateur, au lieu des modules au flash et à la raquette) ;
  - **les canettes écrasées** se démontent en aluminium ; **les boîtes de conserve vides** restent telles quelles (R25) ;
  - **remmancher** une hache ou un marteau se fait **près d'un établi** (R13 : le `lieu` de ces recettes passe de « à la main » à « à côté de l'établi ») ;
  - le son du foyer de forge : l'identifiant interne `soufflet` renommé (§9.3).
- **Fichiers** : `commun/src/recettes.ts` (le type et `ingredientsPresents`), `commun/src/recettes/communes.ts`, `recettes/voltaiques.ts`, `commun/src/objets.ts` ou `objets-niveau1.ts` (le condensateur), `commun/src/vestiges.ts`, `vestiges-lot2.ts` et `dechets.ts` (les démontages), `serveur/src/joueur.ts` (une ligne : prendre la façon choisie), `client/src/fabrication-arbre.ts`, `client/src/hud.ts` (la ligne « ou »), `client/src/icones-niveau1.ts` (l'icône du condensateur), `client/src/son/*`.
- **Tests** : une recette à deux façons se fait avec l'une ou l'autre, et prend la bonne ; démonter un flash ou une raquette donne un condensateur ; un module se fait d'un condensateur ; une canette écrasée donne de l'aluminium ; remmancher est refusé loin d'un établi ; Fabriquer n'a plus qu'une ligne de corde d'arc et une de matraque électrique ; `npm run equilibre` et `rythme` tiennent.

**Chantier C · Le banc de recharge et les batteries** (vague 1, **L**)

- **Contenu** (R17, décidé) : **le banc fait passer l'énergie de la batterie posée dedans vers ce qu'on porte.**
  - la **batterie de voiture de la ruine** se pose **à demeure** dans le banc (déjà posée par le geste existant, elle y reste) ; plus tard, une batterie de plus forte capacité pourra la remplacer (à définir) ;
  - **remplir la batterie du banc** : le panneau solaire posé dessus (80 Wh par jour, inchangé) ; **un pédalier générateur posé à moins de 3 m du banc** la charge directement quand on pédale (décidé) ; la manivelle de la lampe à dynamo reste le secours lent ;
  - **échanger la batterie du banc** contre une batterie du sac (emporter une batterie pleine, au Comptoir par exemple) ;
  - **charger ce qu'on porte** : dans la fiche du banc, **une ligne par chose qui se charge**, nommée (la petite batterie de la frontale, chaque arme électrique, un pack de cellules), avec son niveau et un bouton « Charger » ; jamais une fenêtre à part. Remplace les gestes « Recharger » et « Recharger ses armes » ;
  - les textes du banc, de la frontale et des armes électriques, et l'aide « Fabriquer » ou une rubrique « Le banc », sans jargon.
- **Fichiers** : `serveur/src/electricite.ts`, `commun/src/energie.ts`, `serveur/src/mecanique.ts` (le pédalier qui charge le banc proche), `serveur/src/joueur.ts` (des appels), `commun/src/messages.ts` (un verbe « charger » avec sa cible, bloc en fin), `client/src/hud.ts` (la fiche du banc), `client/src/interaction.ts`, `client/src/aide-contenu.ts`, `client/src/rendu/metier/electricite.ts` (la jauge suit la batterie du banc).
- **Dépendance** : aucune (la matraque du chantier B ne touche pas la charge).
- **Tests** : la batterie du banc se remplit au soleil et par un pédalier à 3 m, pas à 4 m ; échanger la batterie rend l'ancienne au sac ; charger la petite batterie de la frontale, puis une matraque, chacune depuis la batterie du banc, avec le rendement d'aujourd'hui (85 %) ; rien ne se charge si la batterie du banc est vide (le refus le dit) ; une partie 0.8.1 avec des batteries posées sur le banc se relit.

**Chantier D · La station, les réglages, le Moulin** (vague 1, **S**)

- **Contenu** :
  - la **caisse de l'atelier** de la station (clous, fil de fer, huile) devient **personnelle**, comme le tas de bois (le mécanisme du butin personnel existe) ;
  - le **dormant** couché à 0,85 m de l'établi de la pièce de famille est éloigné (à au moins 4 m) ;
  - le **tas de bois personnel** et le **stock du Comptoir** deviennent des **réglages modifiables à chaud** (`commun/src/reglages.ts`, comme les autres réglages du test familial) ;
  - **un objet jeté** ne cache plus la proposition « Ouvrir la porte » (la porte passe avant un objet au sol dans le choix de la cible), à la laiterie et partout ;
  - le Moulin : si la session « bâtiments » a livré `demande-batiment-moulin-2.md`, `npm run batiments:importer`, recopier `SEGMENTS_MODELE`, retirer les corrections du jeu devenues inutiles.
- **Fichiers** : `commun/src/halte.ts`, `serveur/src/lieu-vivant.ts` (rien de neuf : une déclaration), `commun/src/reglages.ts`, `serveur/src/comptoir.ts`, `client/src/interaction.ts` (la priorité de la porte), `commun/src/moulin.ts`.
- **Tests** : deux joueurs prennent chacun les clous de la caisse ; un réglage changé à chaud change le tas de bois à la visite suivante ; avec un sac jeté devant une porte, « Ouvrir la porte » reste proposé.

**Chantier E · L'accueil** (vague 1, **S**)

- **Contenu** : un **« + »** dans les couleurs de cheveux, qui ouvre un choix de couleur personnalisée (R8 ; la couleur est gardée avec l'apparence) ; l'**illustration de l'écran 2 de l'accueil en paysage** qui manque (vérifier aussi l'erreur des écrans d'accueil en dev et les deux `animations_intro_*.glb` en 404 relevés par la recette).
- **Fichiers** : `client/src/accueil.ts` (ou le fichier de l'apparence), `commun/src/apparence.ts`, le style de l'accueil.
- **Tests** : `apparence.test.ts` : une couleur personnalisée est acceptée, gardée et relue ; une couleur invalide est refusée ; captures de l'accueil aux trois tailles.

### Vague 2 · Les lieux, l'écran, les gestes

**Chantier F · Le gué** (vague 2, **M**)

- **Contenu** :
  - **plus à ramasser** (R1) : des branches, quelques bûches, des pierres au sol hors du banc de galets, et **quelques déchets** (la couche de déchets du gué, vide aujourd'hui) ; les quantités : Q-0.8.2-1 ;
  - **la glaise bien visible** (R2) : le gisement placé **au milieu de la berge**, à découvert ; le déplacement du décor (la motte, la bêche) est à demander à la session « bâtiments » (Q-0.8.2-5), le point du jeu suit ;
  - **le bac** (R3) : la zone où l'on peut haler devient fiable : le geste est proposé partout sur le radeau, et dès qu'on y monte ;
  - **la crue se dit** (R19) : buter au bord du radier noyé donne une ligne : « La rivière est en crue : le radier est sous l'eau. Le bac passe toujours. », une fois par tentative ;
  - les défauts de la recette : l'arbre qui cachait la glaise (avec R2), l'**Éteint coincé** dans la chicane de bûches de l'entrée, le **camping-car** qui bloque l'accès depuis le nord ;
  - le test `obstacles-visibles.test.ts` couvre le gué et le Moulin.
- **Fichiers** : `commun/src/gue.ts`, `serveur/src/gue.ts`, `client/src/rendu/gue.ts`, `commun/src/couche-dechets.ts` (la zone du gué), `commun/src/terrain.ts` (si une ressource s'ajoute), `scripts/extraire-gue.mjs` si le modèle change.
- **Tests** : le gué offre au moins N branches, N bûches, N pierres hors du banc (Q-0.8.2-1) ; le geste de haler est proposé à chaque endroit du radeau ; la crue donne son message une fois par tentative ; l'Éteint de la chicane atteint le joueur ; le passage nord est praticable ; `npm run rythme` (le budget) tient.

**Chantier G · La vue d'ensemble à l'arrivée** (vague 2, **M**)

- **Contenu** (R4) : en arrivant dans un lieu, **la vue est dézoomée, toits visibles, le jeu en pause** : on voit tout le lieu de loin et son artwork. **À l'appui d'une touche** (ou d'un toucher), la vue **zoome vers le personnage** (un mouvement court, ≈ 1,5 s) et la pause s'arrête. Quand : Q-0.8.2-2. La pause suit la règle actuelle de la pause (seul, ou dans un lieu personnel) ; à plusieurs dans une halte, Q-0.8.2-2.
- **Fichiers** : `client/src/rendu/camera.ts` (ou l'équivalent), `client/src/main.ts` (l'arrivée), la pause existante, `client/src/hud.ts` (une invite « Touche pour commencer », discrète).
- **Tests** : à l'arrivée, la caméra est en vue d'ensemble et le jeu en pause ; une touche lance le zoom et lève la pause ; pas de vue d'ensemble à une reconnexion sur place ; captures aux trois tailles, au gué, au Moulin, à la station, à la Coopérative ; **mesure `?mesure=1`** : la vue d'ensemble (tout le lieu, toits compris) tient le budget de l'iPhone 13 mini.

**Chantier H · Le sac et l'écran** (vague 2, **M**)

- **Contenu** :
  - **le sac** (R6) : l'arme équipée a sa marque **même équipée automatiquement** ; le **sac à dos porté** a la même marque ;
  - **« Tu y penses »** (R22) : un message **sans bouton**, plus transparent, qui ne cache pas le jeu et **disparaît seul** ;
  - **le cercle de fouille** (R23) : la barre de remplissage d'une couleur bien visible (bleue), lisible en basse qualité ;
  - **l'aide des touches sur ordinateur** (R7) : un **petit rectangle en bas à gauche**, des **icônes de touches** (pas des lettres seules), des séparateurs clairs entre deux actions ;
  - les défauts de la recette : l'**aide-mémoire des Voltaïques** (police Courier, 6 lignes) qui recouvre la barre d'action sur téléphone ; le **guichet du Comptoir** trop bas sur téléphone (une seule ligne d'étal visible) ; les **textes d'Examiner coupés** à deux lignes (laisser le texte entier, ou un « Lire la suite » d'un toucher) ; le message **« trop lourd »** qui dit le poids de l'objet visé (« L'étau pèse 6 kg : ton sac est à 50 kg sur 55. »).
- **Fichiers** : `client/src/hud.ts`, `client/src/bandeau-idee.ts`, `client/src/style.css`, le rendu du cercle de fouille (`client/src/rendu/…`), `serveur/src/joueur.ts` (le texte « trop lourd », une ligne).
- **Tests** : la marque d'arme équipée suit `arme` même sans choix du joueur ; le bandeau « Tu y penses » n'a aucun bouton et se retire seul ; le guichet montre au moins 4 lignes à 375 × 630 ; captures aux trois tailles (le sac, le message, la fouille en basse qualité, l'aide des touches, le guichet, un Examiner long).

**Chantier I · La base et les gestes** (vague 2, **M**)

- **Contenu** :
  - **ramasser deux fois plus vite** les baies, les branches, les pierres et les bûches (R20) ;
  - **la gourde se remplit au milieu de la mare** (R21 ; Q-0.8.2-3), plus au bord : la coupe des joncs garde le bord ;
  - **un contenant vide au sol** (sac-poubelle vidé, poubelle, coffre de voiture vide…) ne propose plus rien (R24 ; Q-0.8.2-6) ;
  - **dormir dans l'abri** (R12) : le personnage **rampe jusqu'à sa couche** et dort **dedans**, à une place fixe de l'abri (Q-0.8.2-7) ;
  - **le feu prend d'abord les branches**, puis les bûches (§9.3) : le conseil de la première nuit devient possible.
- **Fichiers** : `commun/src/terrain.ts` (`USAGES` : les durées), `serveur/src/joueur.ts` (le feu, le sommeil : des appels), `client/src/interaction.ts` (la gourde, les contenants vides), `client/src/rendu/personnage.ts` (la pose de sommeil et le déplacement vers la couche), `commun/src/couche-dechets.ts` (un contenant vidé).
- **Tests** : les durées de ramassage divisées par deux ; la gourde se remplit au milieu, pas au bord, et les joncs se coupent au bord ; un sac-poubelle vidé ne propose plus « Examiner » ; au sommeil, le personnage est à la place de la couche ; « Ajouter du bois » avec branches et bûches dans le sac prend une branche ; `npm run rythme` (les durées de ramassage changent le rythme : le dire).

**Chantier J · Le dévoilement et les quêtes** (vague 2, **S**)

- **Contenu** :
  - **les armes de métier n'apparaissent qu'avec le meuble de famille complet** (R26) : ni disponibles ni affichées (pas même en silhouette) tant que le meuble n'est pas bâti **et** équipé de sa pièce : ⚡ matraques et modules de décharge (banc solaire + panneau) ; 🔥 lames forgées (foyer de forge + enclume) ; ⚙️ l'arbalète et ses pièces (pédalier générateur + petit alternateur), même si l'établi est déjà là ;
  - **« Un vrai lit » en tête** de « S'installer », après le coffre (§9.3 : l'abri fermé suppose l'abri garni).
- **Fichiers** : `commun/src/progression.ts`, `serveur/src/devoilement.ts`, `commun/src/quetes.ts`, `commun/src/rythme.ts` (les tables du simulateur).
- **Dépendance** : le chantier B (le condensateur et le module de décharge unique).
- **Tests** : pour chaque famille, avec le meuble sans sa pièce, aucune arme de métier dans Fabriquer, ni en silhouette ; la pièce posée, elles apparaissent ; un Mécaniste avec un établi et sans alternateur ne voit pas l'arbalète ; « Un vrai lit » vient avant les portes ; `npm run rythme` tient.

### Vague 3 · Les textes, la recette

**Chantier K · Les textes du jeu** (vague 3, **M**)

- **Contenu** (après les autres chantiers, pour relire aussi leurs textes) :
  - **jamais « clé »** dans les textes du jeu (R9) : descriptions, fiches, indices, aide, carnet, messages ; la grosse clé du Moulin reste. Un test cherche le mot dans tous les textes affichés ;
  - **les indices moins précis** (R10) : le lieu, pas l'endroit exact ; rien sur les kits de départ ; plus courts ;
  - **la carte** ne dit plus ce qu'on trouve dans un lieu (R18 : les `promesse` retirées) ;
  - l'**abri** ne parle plus du lit (R11) ; la **fiche de la forge** ne parle plus de « pierre plate » une fois l'enclume posée ; la **note de la carte** « panneau solaire sur l'auvent ! » selon la famille (ou retirée, pour ne pas divulgâcher) ;
  - les textes nouveaux des chantiers B à J relus avec les mêmes règles.
- **Fichiers** : `commun/src/lignees.ts` (les textes des clés : `idee`, `indice`), `commun/src/lieux.ts`, `commun/src/objets*.ts`, `commun/src/quetes.ts`, `commun/src/tutoriel.ts`, `client/src/aide-contenu.ts`, `client/src/carte.ts`, `client/src/interaction.ts`, `commun/src/gue.ts`, `commun/src/moulin.ts`, `commun/src/cooperative.ts`.
- **Tests** : aucun texte affiché ne contient « clé » (hors la grosse clé du Moulin) ; aucun indice ne nomme un endroit plus précis que le lieu (une liste de mots interdits, à constituer) ; la carte n'a plus de promesse.

**Chantier L · La recette, les mesures, la version** (vague 3, **M**)

- **Contenu** : la recette du jeu assemblé (comme celle de la 0.8 : un personnage neuf, captures aux trois tailles, console, journal) centrée sur ce qui change ; **une partie 0.8.1 se relit** (pas de remise à zéro) ; `npm run equilibre` et `rythme` ; la version **0.8.2** (`version.ts`, `package.json`) et sa section dans `code/VERSIONS.md` (une ligne lisible par un joueur par nouveauté, ≤ 420 caractères).
- **Mesure sur l'iPhone** (§9.3) : `?mesure=1` au gué et au Moulin, et la vue d'ensemble du chantier G. **C'est au porteur de la faire** sur son appareil (banc de 90 s) ; la recette prépare l'adresse et lit les relevés.

**Chantier M · Les books et la bible** (vague 3, **S**, en parallèle de L)

- **Contenu** : relire chaque book juste avant de l'écrire ; Book 03 (« Tu y penses » sans bouton, les indices), Book 14 (la vue d'arrivée), Book 20 (la carte sans promesse), Book 21 (la 0.8.2), Book 24 (le banc, le lit en tête), Book 25 (le condensateur, le module unique, la matraque en une recette, la corde d'arc), Book 26 (la canette, la boîte de conserve) ; la bible (`construire-page.py`).

---

## 4. L'ordre et le parallélisme

| Vague | Chantiers (en parallèle) | Avant la vague suivante |
|---|---|---|
| **1** | **A** coffre et décharge · **B** recettes et objets · **C** banc et batteries · **D** station, réglages, Moulin · **E** accueil | A fusionné en premier (le bloquant) |
| **2** | **F** gué · **G** vue d'arrivée · **H** sac et écran · **I** base et gestes · **J** dévoilement (après B) | — |
| **3** | **K** textes · **L** recette, mesures, version · **M** books | La livraison |

**Les fichiers partagés** (même principe que la 0.8 : un module par chantier, un appel, des blocs séparés) :

| Fichier | Qui | Comment |
|---|---|---|
| `client/src/hud.ts` | A, C, H | A : les panneaux coffre et décharge ; C : la fiche du banc ; H : le sac, le message, le guichet. Zones séparées ; A fusionné d'abord |
| `serveur/src/joueur.ts` | B, C, H, I | Des appels d'une ligne seulement |
| `client/src/interaction.ts` | C, D, I | Blocs séparés (le banc ; la priorité de la porte ; la gourde et les contenants) |
| `commun/src/terrain.ts` | F, I | F : les ressources du gué ; I : les durées de `USAGES` |
| `commun/src/couche-dechets.ts` | F, I | F : la zone du gué ; I : le contenant vidé |
| Les textes (`lignees.ts`, `lieux.ts`, `aide-contenu.ts`…) | K, après tous | K passe en dernier |

---

## 5. Les critères de réussite

1. **Sur téléphone**, le coffre, le coffre cerclé, le râtelier et la décharge s'ouvrent, déplacent un objet et se ferment.
2. **Au gué**, un joueur seul trouve du bois, des pierres et des déchets hors du banc de galets ; la glaise se voit dès qu'on approche de la berge ; le bac se hale du premier coup ; la crue se dit.
3. **En arrivant** au gué, au Moulin, à la station ou à la Coopérative : la vue d'ensemble, en pause ; une touche, et l'on joue.
4. **Le sac** marque l'arme équipée et le sac à dos porté ; « Tu y penses » ne cache rien et part seul.
5. **Au banc**, on voit ce que contient sa batterie, ce qu'on peut charger, et on le charge d'un bouton ; un pédalier tout près remplit la batterie du banc.
6. **Fabriquer** n'a plus qu'une corde d'arc et une matraque électrique ; le module de décharge se fait d'un condensateur.
7. **Aucune arme de métier** n'apparaît avant le meuble de famille complet.
8. **Aucun texte** ne dit « clé » (hors la grosse clé) ; aucun indice ne nomme un endroit précis ; la carte ne promet rien.
9. **Une partie 0.8.1 se relit** : rien de construit ni de fabriqué n'est perdu.
10. `npm run verif`, `npm test`, `npm run build` passent ; `npm run equilibre` et `npm run rythme` tiennent.

---

## 6. L'estimation du temps de développement

**En jours-agent** (la convention du plan 0.8 : S ≈ ½ à 1 jour, M ≈ 1 à 3, L ≈ 3 à 5) :

| Chantier | Effort | Jours-agent (milieu) |
|---|---|---|
| A · Coffre et décharge sur téléphone | M | 2 |
| B · Recettes et objets | M | 2 |
| C · Banc et batteries | L | 4 |
| D · Station, réglages, Moulin | S | 0,75 |
| E · Accueil | S | 0,75 |
| F · Gué | M | 2 |
| G · Vue d'arrivée | M | 2 |
| H · Sac et écran | M | 2 |
| I · Base et gestes | M | 2 |
| J · Dévoilement et quêtes | S | 0,75 |
| K · Textes | M | 2 |
| L · Recette, mesures, version | M | 2 |
| M · Books et bible | S | 0,75 |
| **Total** | **8 M, 4 S, 1 L** | **≈ 23 jours-agent** (fourchette 13 à 31) |

**En temps réel**, d'après la 0.8 : ses 16 chantiers (≈ 47 jours-agent estimés) ont été codés, fusionnés et recettés en **environ 7 heures**, agents en parallèle, en comptant l'attente de tes réponses. Chaque agent a pris de 15 min à 2 h, la recette finale 3 h 30. Pour la 0.8.2, environ deux fois plus petite :

| Étape | Durée réelle estimée |
|---|---|
| Vague 1 (5 chantiers en parallèle, le plus long : le banc) | 1 h à 1 h 30 |
| Vague 2 (5 chantiers ; le gué et la vue d'arrivée les plus longs) | 1 h à 1 h 30 |
| Vague 3 (textes, books ; puis la recette) | 30 min, puis 2 h à 3 h de recette |
| Fusions, vérifications, tes décisions en route | 1 h |
| **Total** | **≈ 5 h 30 à 7 h 30**, soit **une journée** |

Ce qui peut l'allonger : une cause du bogue du coffre plus profonde que prévu (chantier A) ; les retouches du modèle du gué attendues de la session « bâtiments » (Q-0.8.2-5) ; la vue d'ensemble qui dépasserait le budget de l'iPhone (chantier G) ; ta mesure sur l'iPhone, qui se fait de ton côté.

---

## 7. Les questions à trancher

*« Rec. » : ma recommandation. ⛔ : bloque un chantier.*

| # | Question | Rec. | Chantier |
|---|---|---|---|
| **Q-0.8.2-1** | Au gué (R1), combien à ramasser hors du banc de galets ? | 8 branches (30 min), 4 bûches en vrac (30 min, grandit avec les voyageurs comme à la station), 6 pierres sur les pistes, et la couche de déchets du gué (comme sur les routes) | F |
| **Q-0.8.2-2** ⛔ | La vue d'ensemble (R4) : à chaque arrivée, ou à la première visite d'un lieu ? Et le terrain ? Et à plusieurs dans une halte (la pause ne s'impose pas aux autres) ? | À **chaque arrivée** dans un lieu, terrain compris au retour d'une sortie, mais pas à une reconnexion sur place ; à plusieurs, la vue d'ensemble sans pause (le joueur reste immobile et à l'abri des coups tant qu'il n'a pas touché) — à défaut, sans protection | G |
| **Q-0.8.2-3** ⛔ | La gourde « au milieu de la mare » (R21) : le joueur entre-t-il dans la mare (eau peu profonde, on y marche lentement) ou vise-t-il le milieu depuis le bord ? | Il **entre dans la mare** jusqu'au milieu, en marchant lentement (eau aux genoux) ; le bord reste aux joncs | I |
| **Q-0.8.2-4** ⛔ | Le condensateur (R14) : aujourd'hui, le module au flash et celui à la raquette n'ont pas les mêmes étoiles. Le module unique : quelles étoiles ? | Le condensateur **porte l'étoile de sa source** (le flash ★, la raquette ★★) et le module garde le maillon faible, comme aujourd'hui ; la maîtrise inchangée | B |
| **Q-0.8.2-5** | La glaise au milieu de la berge (R2) : on demande le déplacement du décor (la motte, la bêche) à la session « bâtiments », ou le jeu pose sa propre motte ? | **Demander aux bâtiments** (une demande prête au lancement) ; le jeu déplace le point en attendant | F |
| **Q-0.8.2-6** | Un contenant vide (R24) : il reste au sol en décor muet, ou il disparaît ? | Il **reste en décor**, sans action (un sac-poubelle crevé, une poubelle renversée) | I |
| **Q-0.8.2-7** | Dormir dans sa couche (R12) : « ramper » est-il une nouvelle animation, ou un déplacement accroupi existant suffit-il ? | Le déplacement **accroupi existant** jusqu'à la couche, puis la pose couchée à sa place exacte | I |
| **Q-0.8.2-8** | La note de la carte « panneau solaire sur l'auvent ! » : propre à chaque famille, ou retirée pour ne pas divulgâcher ? | **Retirée** (même règle que R18) | K |
| **Q-0.8.2-9** | Les textes d'Examiner coupés à deux lignes : le texte entier, ou « Lire la suite » ? | **Le texte entier** (avec R10, les textes seront plus courts) | H |
| **Q-0.8.2-10** | L'allure du meunier, du charpentier et du putréfié (§9.3) : dans la 0.8.2 ? | **Non**, plus tard | — |

### 7.1 Les décisions du porteur (2026-10-13)

- **Toutes les recommandations du §7 sont acceptées** (Q-0.8.2-1 à 3 et 5 à 10).
- **Q-0.8.2-4** : **deux condensateurs** : le **petit condensateur** (★) et le **condensateur moyen** (★★) ; le module de décharge unique prend l'étoile de son condensateur (maillon faible, maîtrise inchangée). Le petit vient du flash jetable, le moyen de la raquette à moustiques (comme les étoiles des modules d'aujourd'hui).

### 7.2 Les décisions prises pendant la vague 1 (2026-10-13)

- **Le coffre** : le défaut (aussi sur ordinateur, venu des correctifs de la 0.8) est corrigé dans la 0.8.2 ; **pas de version de correctif à part**, on attend la 0.8.2.
- **Recettes (B)** : les cordes d'arc au fil dentaire et au boyau restent sur leurs lignes ; le condensateur moyen passe d'abord ; **3 canettes écrasées donnent 1 aluminium** ; **la matraque de fortune prend le petit condensateur** au lieu de l'appareil photo.
- **Le banc (C)** : un pack de cellules en vrac reste « plein » (pas de ligne au banc) ; après un échange, la batterie s'appelle « la batterie de voiture » ; l'échange ne prend qu'une batterie de voiture.
- **Les portes (D)** : quand une porte et un objet au sol sont à portée, A ouvre la porte et **B propose « Ramasser »** (chantier H).
- **Le pédalier à 3 m du banc** : voir §7.3.

### 7.3 Les décisions de la vague 2 (2026-10-13)

- **Se servir du meuble d'une autre famille** : **qui a appris la recette d'un meuble** (leçon, manuel) **peut s'en servir et y poser sa pièce** (aujourd'hui, le jeu refuse : « C'est le savoir d'une autre famille »). Le Book 24 le disait déjà (« utilisables par tous »). Un Voltaïque qui a appris le pédalier peut donc pédaler près de son banc pour remplir sa batterie.
- **Une arme de métier apprise d'une autre famille** attend **le meuble complet de son métier** (le couteau forgé : la forge et son enclume, même pour un Mécaniste qui a lu le manuel), et non celui de la famille de l'apprenti.
- **R26, confirmé** : le repli ne compte pas comme meuble complet (la pierre plate, la manivelle, la dynamo du vélo) ; l'étau et la tête de masse posés en enclume comptent ; la pointe de lance est une arme forgée ; le pack de cellules et la lampe bricolée restent visibles sans le panneau. Les quêtes qui demandent une arme n'en montrent pas la silhouette tant que le meuble est incomplet.
- **La vue d'ensemble** : le budget de l'iPhone sera mesuré à la recette ; les bords du décor visibles de loin, gardés pour l'instant (à revoir à la recette du porteur) ; la protection de 15 s à l'arrivée dans une halte, gardée.
