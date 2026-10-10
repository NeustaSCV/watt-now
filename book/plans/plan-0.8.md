# Plan de développement — version 0.8 : le niveau 1

*Version du plan : v0.2 · 2026-10-10 · **Statut : brouillon, à amender.** On l'amendera avec les dernières analyses qui tournent encore (encart du §10).*

*v0.2 (2026-10-10) : intègre l'étude `candidats-h1b-l1b-et-budget.md` et les décisions du porteur qui la closent. **Le gué (H1B) et le Moulin à eau (L1B) sont retenus** ; le budget de pierre et de bois est décidé (B1 à B17, §2.7).*

*Code de départ : 0.7.3 (prête à déployer). Rien n'est codé ici : c'est le plan.*

*Sources (toutes les décisions du porteur y sont) :*

- *`.claude-travail/propositions/progression-par-ingredients.md` (v5) et `progression-par-ingredients-page.json` (v5.1 : `tableau_maitre`, `lignees`, `lieux`, `outils`, `familles`, `parcours`, `decisions`, `regles`) ;*
- *`ingredients-par-lieu.md` et `.json` (v4 : propositions I1 à I31 toutes acceptées, `objets_a_creer`, `objets_a_retirer`, R-BUTIN) ;*
- *`armes-par-niveau.md` (P, Q-A, Q-B, Q-C, D1 à D37, K1 à K56), `armes-graphique.json`, `decisions-armes.json`, `degats-electriques.md` ;*
- *`arbre-de-progression.md` (§10), `recettes-par-construction.md`, `avis-game-designer.md`, `examiner-detaille.md`, `visibilite-pieces.md` (codée en 0.7.2) ;*
- *la bible publiée : `book/bible/progression-et-equilibrage.html` ;*
- *`candidats-h1b-l1b-et-budget.md` (le couple H1B / L1B, le budget de pierre et de bois : B1 à B17, et les décisions du porteur) ;*
- *les modèles `batiment/halte-gue/` et `batiment/moulin/` (`batiment/LIVRAISON.md`), en lecture seule.*

---

## 0. En bref

- **Ce que livre la 0.8** : la base grandit **avec les sorties**, de la maison jusqu'au **niveau 1**. Plus de paliers. Chaque meuble monte d'un niveau avec **le niveau d'avant, des matériaux et un outil** ; les niveaux du niveau 1 demandent **une clé** qu'on trouve dehors.
- **Quatre lieux** portent le niveau 1 :
  - **H1A**, la station-service (existe) : le bois, le métal, et **la pièce de sa famille** ;
  - **H1B**, le Gué-aux-Saules (**à créer**, retenu) : la pierre, la glaise, la rive ;
  - **L1A**, la Coopérative (existe) : le feu et l'eau ;
  - **L1B**, le Moulin à eau (**à créer**, retenu) : le couchage, le stockage, l'établi.
- **Le bois et la pierre ne manquent plus** : la station et le gué donnent du vrac qui revient en 30 min, et un tas personnel à chacun (§2.7).
- **Les armes** suivent les étapes : bandes de dégâts, étoiles placées (K1 à K56), dégâts électriques, maîtrise sans plafond. Une arme **évolue** quand on la rapporte sur son meuble.
- **15 chantiers**, en **4 vagues**. Effort : **7 L et 8 M**, soit environ **45 jours-agent** au milieu de la fourchette.
- **Rien du niveau 2** n'est construit. Ce qui en existe déjà dans le code reste en place pour ceux qui l'ont, et devient **« plus tard »** pour les autres (§1.3).
- **25 questions ouvertes** (§9 ; une autre est réglée par les décisions de la v0.2), dont 4 qui bloquaient un chantier, tranchées le 2026-10-10.

---

## 1. Le périmètre

### 1.1 Ce qui entre

| Étape | Lieu | État dans le code | Ce que la 0.8 y met |
|---|---|---|---|
| **Maison** | Le terrain | Existe | Le niveau 1 de chaque meuble, avec ce que donne le terrain ; la ruine complétée (bidon de 5 L, tête de marteau) ; les 4 sacs plastique garantis |
| **H1A** | La station-service | Existe | La pièce de sa famille (⚡ panneau, 🔥 enclume et sac de charbon, ⚙️ petit alternateur), garantie et **personnelle** ; clous, fil de fer et huile garantis ; 12 bûches en vrac (30 min) et un tas de bois personnel de 10 bûches (6 h) |
| **H1B** | Le Gué-aux-Saules (**retenu**) | **À créer** | 15 pierres en vrac (30 min) et un banc de galets personnel de 8 pierres (6 h), le gisement de glaise, 6 touffes de joncs |
| **L1A** | La Coopérative | Existe | Trois clés à place fixe : grillage, cocotte, seau de 10 L |
| **L1B** | Le Moulin à eau (**retenu**) | **À créer** | Trois clés à place fixe : toile de jute, feuillards, étau ; la fourche à foin ; un if au bord du bief ; 2 bûches garanties ; 18 à 24 Éteints |

**Le parcours visé** (le `parcours` de la v5) :

| Sortie | Temps de jeu | Où | Au retour |
|---|---|---|---|
| 0 | 0 à 25 min | La maison (le tutoriel) | Feu, foyer de pierres, abri, coffre, établi, marteau remmanché |
| 1 | 25 à 50 min | H1A, dans le tutoriel (« La carte ») | « La famille » : le premier meuble de famille et son premier geste |
| 2 | 50 à 80 min | H1B | Le bac de trempe 🔥, des cordes, de quoi bâtir |
| 3 | 80 à 140 min | L1A ou L1B, au choix | A : cuisine, marmite, 10 L. B : abri fermé, coffre cerclé, établi à étau |
| 4 | 140 à 200 min | L'autre L1 | Tout le niveau 1 |

### 1.2 Ce qui n'entre pas (hors périmètre)

- **Le niveau 2** : H2A, H2B, L2A, L2B, et leurs clés (porte de four, couvertures, lanterne-tempête, tôles, jerrican de 20 L, rabot, cloche, et les clés de famille : fer à souder, roulements, soufflet de forge).
- **Les qualités Raboter et Souder** (V4-9) : elles ne servent qu'au niveau 2. Voir la question Q-0.8-21.
- **Les Éteints évolués** (le casque et les autres, renforcés d'un lieu à l'autre).
- **Le relais d'armes** (l'arme supérieure après ★★★★★), les **munitions** cohérentes, les **caractéristiques** selon les ennemis (bonus et malus).
- **Le niveau 3** et ce qui en dépend : trempe à l'huile ★★★★, ressort retrempé, arbalète lourde, noix à roulement, ligne longue, charbonnière en fût, scie à pédale.
- **Fendre et le bois vert** (`recettes-par-construction.md` §5) : décidé « pas de bois vert ».
- **L'incohérence C12** (l'établi reste sur la route B au niveau 2) : « plus tard ».
- **Le panneau Examiner détaillé** complet (`examiner-detaille.md`) : la 0.8 n'en prend que les indices (Q-0.8-17).

### 1.3 Ce qui existe déjà au-delà du niveau 1, et ce qu'il devient

Le code 0.7.3 a déjà des niveaux et des recettes que la grille place au niveau 2 ou plus tard. **Personne ne perd ce qu'il a construit ou fabriqué.** Pour un nouveau personnage, ces niveaux deviennent **« plus tard »** : grisés dans la fiche, comme les niveaux `phase: "0b"` d'aujourd'hui, avec leur clé nommée et « à trouver plus loin ».

| Élément | Aujourd'hui (0.7.3) | En 0.8 |
|---|---|---|
| **Forge ventilée** (forge, niveau 2) | Se bâtit (bâche ou 4 chiffons, 6 pierres, 1 barre) | **Plus tard** : clé « soufflet de forge » (L2B). Celle qu'on a reste, et forge à ★★★ |
| **Réserve couverte** (coffre, niveau 3) | Se bâtit (bâche, 4 branches, 4 pierres) | **Plus tard** : clé « tôles ondulées » (L2A) |
| **Citerne de bâche, 60 L** (récupérateur, niveau 2) | Se bâtit | **Retirée** de la lignée (V4-7). Le niveau 2 devient le **récupérateur à seau (10 L)**. La citerne déjà posée : Q-0.8-8 |
| **Four de terre**, hutte, poêle | `phase: "0b"` | Le four : plus tard, clé « porte de four en fonte » (L2B) ; ses deux plats restent grisés dans la fiche du foyer de cuisine (V4-6). La hutte et le poêle : inchangés |
| **Lit de branchages** (installation à part) | Se pose | **Fondu dans l'abri garni** (I25) ; celui qu'on a est absorbé à la prochaine montée de l'abri (le code le fait déjà) |
| **Module à bobine**, matraque ★★★ | La bobine se trouve à la station | La bobine **quitte la station** (I12) : ★★★ électrique seulement par la maîtrise. Ce qu'on a reste |
| **Aiguillon** ⚡ | Se fabrique | **Plus tard** (L2, `decisions-armes.json`) |
| **Électrificateur**, clôture électrique, ventilateur de forge | Se fabriquent | **Plus tard** : poste de montage (L2A). La clôture de fortune et l'alarme électrique restent au niveau 1 |
| **Arbalète lourde**, cranequin, arc d'arbalète retrempé, ressort retrempé | Se fabriquent (avec un ressort retrempé 🔥) | **Plus tard** (niveau 3, Q-A2d, I9) |
| **Arc d'arbalète en if** (arbalète ★★★) | Se fabrique à l'établi | **À trancher** (Q-B1b, Q-0.8-3) : la grille met l'arbalète ★★★ au niveau 2 |
| **Roulements** | Machine à laver, trottinette, planche à roulettes, chambre froide de la Coopérative | Retirés de la station et de la Coopérative (I8, I9) ; ils ne débloquent plus rien avant L2A |

**La règle technique** : un seul marqueur, `aVenir` (« 0b » ou « niveau 2 »), sur une étape de lignée ou une recette. Le serveur refuse, le client grise. Le chantier 1 le pose.

---

## 2. Les règles de jeu que la 0.8 met en œuvre

*Résumé des décisions, pour que chaque chantier ait la règle sous les yeux. Le détail est dans les sources.*

### 2.1 Construire : la fin des paliers

- **Construire** = le niveau d'avant posé + les matériaux + l'outil. Plus de palier.
- **Les outils sont des portes dures**, mais **plusieurs outils sont compatibles**, et **les objets de fortune donnent le niveau 1** de leur qualité (tableau `outils` de la v5 : pierre et clé plate pour Marteler 1 ; éclat de verre, lame ébréchée, couvercle de conserve, sécateur pour Couper 1 ; coin de bois et pierre pour Fendre 1 ; un morceau de fer plat pour Visser 1 ; enjoliveur et casserole pour Creuser 1…). Aujourd'hui, un niveau d'outil en dessous rend le geste plus lent (Book 03 §4) : en 0.8, **il faut le niveau demandé**.
- **Les outils de fortune à fabriquer** (à la main) : le serre-joint de fortune (2 branches, 1 corde : Serrer 1), la scie de fortune (un disque ou 2 lames ébréchées : Scier 1), le marteau de fortune (une barre repliée : Marteler 2), le coin de bois (Fendre 1, avec une pierre).
- **Le marteau remmanché** (I10) : la tête de marteau de la caisse de la ruine et une branche, à la main. Il donne **Marteler 2 à toutes les familles** (le coffre cerclé de L1B le demande).
- **Une clé par niveau** (règle 2 du game designer) : un ingrédient **ou** un outil de dehors, jamais les deux.
- **Les recettes sont liées aux meubles et à leur niveau** (`recettes-par-construction.md`) :
  - **à la main** : ce qu'on fait assis par terre avec ce qu'on porte (ficelle, corde, gourdin, lance, arcs de fortune, cordes d'arc, flèches, outils de fortune, marteau remmanché, bâton à fouir…) ;
  - **posée** : la construction elle-même, racine d'une lignée ;
  - **à une construction** : tout ce qui demande de la chaleur, un plan de travail, un serrage, une machine ou du courant. Elle apparaît **dès qu'on possède la construction au bon niveau**, à côté d'elle (2,5 m pour un feu, 3 m pour le reste).
- **Le métier se fait à l'atelier** : les recettes voltaïques vont au banc, celles de l'arbalète à l'établi.

### 2.2 Penser au bon moment : l'idée et l'indice

- **« Tu y penses »** : la première fois qu'on ramasse une **clé** (ingrédient) ou qu'on tient **l'outil** qui manque, un message dans la voix du carnet (le champ `idee` de chaque clé). Un son court, distinct du ramassage. Jamais au deuxième ramassage.
- **L'idée gardée** : si le niveau d'avant n'est pas posé, le message dit « un jour » (le champ `idee_plus_tard`). La fiche du meuble affichera la clé **« déjà en poche »** quand on y arrivera. Une trouvaille précoce n'est jamais perdue.
- **L'indice « où chercher », en deux temps** (le champ `indice` : deux phrases) : d'abord le **type de lieu** (« Une grille ? Les clôtures en sont faites. »), puis, après une visite du bon lieu sans la clé ou un délai, le **coin** (« Le parc à volailles de L1A. »). Jamais de flèche sur la carte.
- **La fiche du meuble devient l'arbre** : ce qu'on y fait, le niveau suivant (sa clé, ses matériaux, son outil, ce qui manque), et celui d'après, grisé.
- **Quatre sources par clé** : garantie dans son lieu, chance, repli fabricable, et le Comptoir **après une première visite** du lieu.

### 2.3 Les meubles jusqu'au niveau 1

| Meuble | Maison | H1A (pièce de famille) | L1A | L1B |
|---|---|---|---|---|
| **Feu** | Feu de camp (5 pierres, 3 branches) → foyer de pierres (6 pierres, 2 bûches ; Marteler 1) ; broche ; Dakota (Creuser 1) ; poêle-fusée (4 boîtes vides, 4 pierres) | — | **Foyer de cuisine** (🧩 grillage ; 3 branches, 1 corde ; Couper 1, Marteler 1) ; **marmite norvégienne** (🧩 cocotte en fonte ; 4 branches, 4 chiffons) | — |
| **Eau** | Récupérateur **5 L** (bidon de 5 L de la ruine, 4 branches, 1 corde, 4 sacs plastique ; Couper 1) | — | **Récupérateur à seau, 10 L** (🧩 seau de 10 L ; 2 branches ; Couper 1) | — |
| **Couchage** | Abri (8 branches, la bâche) → abri garni (6 branches), qui absorbe le lit | — | — | **Abri fermé** (🧩 toile de jute ; 10 branches, 1 corde, 1 poignée de clous ; Couper 1, Marteler 1) : sommeil ×1,45 |
| **Stockage** | Coffre (150 kg) ; 🆕 **râtelier à outils** (les outils rangés à 3 m comptent) | — | — | **Coffre cerclé** (🧩 feuillards ; 2 bûches, 1 poignée de clous ; Marteler 2) : 250 kg |
| **Établi** | Établi ; redresseur de fûts | — | — | 🆕 **Établi à étau** (🧩 étau ; Serrer 1) : Serrer 3 ; maillet, coin, planches fendues, **réparer le manche** (I19) |
| **Lumière** | 🆕 **Torche plantée** (branche, chiffon, graisse) : 6 m, 1 h | — | — | — |
| **Alarme** | Alarme à boîtes | — | — | — |
| **Autres** | Escabeau | — | — | — |
| 🔥 | Charbonnière (10 bûches) ; **bac de trempe** sans clé : une auge de planches calfatée de glaise (2 bûches, 2 glaises de H1B ; Creuser 1) | **Foyer de forge** (🧩 enclume de dépanneur ; 8 pierres, la barre de la ruine, 2 branches ; Marteler 1) : lames ★★ | — | — |
| ⚡ | Clôture de fortune, alarme électrique | **Banc solaire** (🧩 panneau ; 2 bûches, la barre et la batterie de la ruine, 3 branches ; Visser 1, Serrer 1) : 80 Wh par jour | — | — |
| ⚙️ | Meule, soufflet à manivelle (Q-0.8-13) ; tour à perche ; assommoir, mâchoires de fortune | **Pédalier générateur** (🧩 petit alternateur ; le vélo de la ruine, 2 bûches, la batterie de la ruine ; Serrer 1, Visser 1, Marteler 1) : ≈ 60 Wh par heure de pédalage | — | — |

**Les recettes permises, pour le feu** (décidé) : feu de camp → pommes cuites ; foyer de pierres → poêlée de cèpes, épieu et flèches durcis, **bâton à fouir durci** (I24) ; foyer de cuisine → soupe de cèpes ; le pot-au-feu et la volaille aux cèpes attendent le four (grisés). La poêlée se fait aussi au Dakota.

**« Rien de propre à une famille en L1 »** (V4-4) : les clés de L1A et de L1B sont communes. La casserole ne fait plus le bac de trempe.

### 2.4 Les armes jusqu'au niveau 1

**La grille** (Q-A2) : seul, ★ à la maison, ★★ à H1 et L1. Avec une autre famille, une étoile de plus, pas deux (Q-A2f). **La bande de dégâts d'une étape compte plus que le plafond d'étoiles** (R-ARMES-1).

**Les bandes** (dégâts au torse d'un coup simple, ou d'un tir plein ; un Errant tombe à 3, un Équipé à 4) : maison 0 – 1 ; H1 0,8 – 1,5 ; L1 1 – 2.

| Arme | Étoiles | Étape | Dégâts décidés | Ce qui change d'autre |
|---|---|---|---|---|
| Marteau (remmanché, kit 🔥) | — | maison | **0,8** | Solidité **40** ; ne tue plus à la tête d'un coup (Q-A3) ; la tête ne s'use pas, on répare le manche (R-ARMES-4) |
| Lance · gourdin · épieu | — | maison | **0,7 · 0,7 · 0,6** | — |
| Hache (tête trouvée) | — | maison | **1,0** (K39) | C'est aussi l'outil Fendre |
| Arc de fortune | ★ · ★★ | maison | **0,7 · 0,75** | ★★ par la maîtrise seulement |
| Arc simple | ★★ · ★★★ · ★★★★ | maison · H1 · L1 | **0,8 · 1,1 · 1,35** | ★★ : corde de joncs ; ★★★ : corde de fil dentaire (boutique de H1A) ou de boyau (I13) ; ★★★★ : Q-0.8-4 |
| Arc d'if | ★★ | L1 | **1,35** | Plafonné à ★★ au niveau 1 (Q-A2b) ; bâton d'if à L1A (haie) ou à L1B (bief) |
| 🔥 Machette forgée | ★★ | H1 | **1,2** | Maîtrisée : ★★★ à **2,5** (pas de plafond, K-Q1) |
| 🔥 Hachette · couteau de forge · serpe | ★★ | H1 | **1,1 · 0,9 · 1,0** | Hachette lancée : les dégâts de l'exemplaire (K45). Sa place : Q-0.8-2 |
| 🔥 Lance à pointe forgée | — | H1 | **1,15** | Pas d'étoiles (K25) |
| ⚡ Matraque de fortune | ★ · ★★ | H1 | **0,9 · 1,0** | Solidité 60 ; ★★ par la maîtrise |
| ⚡ Matraque électrique | ★ · ★★ | H1 | **1,0 · 1,1** | Solidité 60 ; à ★★ elle raidit 2,5 s, la longue dure 1,0 s (P6) ; la **petite batterie du kit** en est la source sûre (Q-A5) |
| ⚙️ Arbalète | ★ · ★★ | H1 | **1,1 · 1,2** | Solidité 60 · 80 ; maîtrisée ★★★ à 2,5 |
| ⚙️ Couteau aiguisé | — | H1 | **0,85** | Un outil |
| Masse · pied-de-biche · machette de fortune | trouvées | L1A | à part (usure) | Masse : Q-0.8-5 (Q-B4) |
| 🆕 **Fourche à foin** | trouvée | L1B | **1,5**, perçante | Tue à la tête, passe le casque ; allonge 2,0 m ; coup 0,65 s, appuyé 0,9 s ; solidité 80 ; sans étoiles ; pas un outil (I30) |

**Les règles qui vont avec** :

- **Les dégâts électriques** : une décharge courte qui raidit **ajoute ses dégâts** au torse. Pack vide : l'arme frappe à **la moitié** de ses dégâts décidés (C11, remplace les 0,6 fixes).
- **La maîtrise sans plafond** (K-Q1, refusé) : elle donne l'étoile du dessus **avec ses vrais dégâts**, même si cette étoile appartient à l'étape suivante. **Le niveau 1 se joue avec les armes de la station**, et « tant mieux s'il a la maîtrise » (K-Q2) : pas d'étoile intermédiaire pour L1.
- **Les enclumes** (P1, Q-A6) : l'enclume de dépanneur, l'étau et la tête de masse sont des enclumes **★★** (`forge.ts`, `ENCLUMES` : étoiles 3 → 2). Le ★★★ 🔥 ne vient plus que de la forge ventilée (L2B).
- **Faire évoluer une arme** (R-ARMES-5) : on rapporte l'arme qu'on porte **sur son meuble**, avec de nouvelles pièces, pour la **réparer** à son niveau ou la **monter d'une étoile** si le meuble le permet. Aujourd'hui, le code fabrique une nouvelle arme pour une meilleure étoile.
- **Réparer le manche sans forge** (R-ARMES-4), à l'établi à étau, pour toutes les familles.
- **Des noms uniques** partout (jeu, books, bible) : « Foyer de forge » (niveau 1, déjà fait en 0.7.3) et « Forge ventilée » (niveau 2) ; le mot « soufflet » est réservé à la clé « soufflet de forge » (Q-0.8-13).
- **Le garde-fou rejoué par étape** (P11) : à chaque étape, l'arme qui possède un terrain y est la meilleure ; les autres au plus 2 fois moins bonnes ; au coût, au plus 3 fois d'écart. Mesuré dans l'étude : **OK à H1 et L1** (pire rapport ⚡ 1,87 ; coût 1,4 fois).

### 2.5 Le butin : H1A et L1A, et la maison

**La règle du butin opportuniste (R-BUTIN)** : une clé de L1 est **rare** à H1 et en L1, plus courante à H2 et en L2. En 0.8, il n'y a ni H2 ni L2 : les clés de L1 ne se trouvent donc, en dehors de leur place fixe, que **rarement**, avec une chance fixée à la main (I7).

| Où | Garanti (place fixe) | Revient | Retiré |
|---|---|---|---|
| **Maison : la ruine** | La bâche, la barre, 2 lames de ressort, la batterie, le vélo ; 🆕 **le bidon de 5 L** | Une fois | — |
| **Maison : la caisse à outils** | Tête de hache, clé plate, tournevis ; 🆕 **la tête de marteau** (I10) | Une fois | — |
| **Maison : le premier sac-poubelle du chemin** | 🆕 **4 sacs plastique**, en plus de son tirage (I28) | Une fois | — |
| **H1A : l'atelier du garage** | 🆕 **Un bocal de clous** (5 poignées, I2), **un rouleau de fil de fer**, **un bidon d'huile** (I1), dans la caisse de l'atelier | Revient | **La bobine d'allumage** des épaves et de la mobylette (I12) ; **le roulement** de la machine à laver et de la trottinette (I9) |
| **H1A : la pièce de famille** (personnelle) | ⚡ le panneau (il y est déjà) ; 🔥 🆕 **l'enclume de dépanneur** sous l'établi, et le **sac de charbon** à côté (**4 charbons**, I23) ; ⚙️ 🆕 **le petit alternateur** sur l'établi, près d'une voiture éventrée | Revient pour son joueur | — |
| **H1A : par chance** | Lames de ressort, appareil photo jetable, petit ressort, chiffons, bâche, cellules lithium (démontages, I18), fil dentaire ; rarement une clé de L1 | — | L'étau, le grillage et la cocotte **sortent des tables courantes** (I7) |
| **L1A : la Coopérative** | **Rouleau de grillage** (parc à volailles, 4 jours) ; **cocotte en fonte** (libre-service, 24 h, I6) ; **seaux de 10 L** (la chambre froide devient **laiterie**, 24 h, I8) | Voir la colonne | **Les roulements et l'alternateur de tracteur** de la chambre froide (I8) |
| **L1A : déjà là** | Pied-de-biche, masse, machette, clé plate, haie d'ifs, bâches, corde, conserves, coffre (semences, 3 manuels), batterie du tracteur | — | — |
| **Partout (lot 2)** | — | — | Le « jerrican vide » devient un **jerrican percé** (un déchet : du plastique, I5). Le vrai jerrican de 20 L sera la clé de L2B |

**Les ingrédients orphelins** (I31) ne sont pas créés : sable, bois flotté, planches comme matériau, mèche, chablis.

### 2.6 Le tutoriel et les quêtes

- **« La carte » passe avant « La famille »** (V5-2) : le tutoriel mène à H1A, où le joueur trouve **la pièce de sa famille** et du bois. « La famille » se fait **au retour**, avec la pièce : c'est le **seuil du métier**.
- **« S'installer » en portes successives** : chaque objectif du carnet est **une porte**, la suivante d'un meuble, avec sa clé et son indice. Le foyer de pierres passe **en tête** (`recettes-par-construction.md` §6.3).
- **Le carnet nomme la porte suivante** au départ de chaque sortie (« Une vraie cuisine : il te faut une grille »).
- **La première nuit** (B14) : le tutoriel conseille les **branches** au feu. Si l'on met une bûche au feu du terrain alors qu'il en reste moins de 6, un avertissement : « Une bûche ne repousse pas : garde-la pour bâtir. »
- **Une règle d'interface du porteur, générale** : un avertissement ou un message **se ferme avec un bouton**, jamais une fenêtre de dialogue avec une croix (« les dialogues avec une croix cassent complètement la dynamique de jeu »). Elle vaut pour tout ce que la 0.8 ajoute : l'avertissement de la bûche, « Tu y penses », l'idée gardée, l'indice.

### 2.7 Le budget de pierre et de bois (décidé)

*`candidats-h1b-l1b-et-budget.md`, décisions du porteur du 2026-10-10. Le constat : le poids ne bloque pas, **le stock** bloque (6 bûches à la station pour tout le serveur, 13 pierres qui ne reviennent jamais).*

| # | Décision | Où dans le code |
|---|---|---|
| **B1** | Le terrain garde **16 bûches et 26 pierres qui ne reviennent pas**, et 34 branches qui repoussent | `terrain.ts` (inchangé) |
| **B2** | La station : **12 bûches** en vrac, qui reviennent **toutes les 30 min** | `halte.ts`, la repousse par lieu |
| **B3** | La station : un **tas de bois de chauffage personnel** derrière l'atelier, **10 bûches par joueur**, qui revient en **6 h réelles** | `halte.ts`, le butin personnel (chantier 10) |
| **B4** | Les pierres des **haltes** reviennent en **30 min** ; celles du **terrain**, jamais. Un **tableau de repousse par lieu** remplace `REPOUSSE_MS.pierre = null` partout | `terrain.ts` (`REPOUSSE_MS`), `serveur/src/lieu-vivant.ts` |
| **B5** | Le gué : **15 pierres** en vrac (elles reviennent en 30 min, B4), plus un **banc de galets personnel** de **8 pierres par joueur** (6 h) | `commun/src/gue.ts` |
| **B6** | Le gué, la glaise : un gisement inépuisable ; **1 glaise (2 kg) par geste de 6 s** avec Creuser 1 | `commun/src/gue.ts`, `terrain.ts` (`USAGES`) |
| **B7** | Le gué, les joncs : **6 touffes** qui repoussent en 30 min | `commun/src/gue.ts` |
| **B8** | Le vrac des haltes **grandit avec le nombre de voyageurs présents** : +50 % par voyageur en plus, jusqu'à **×3** | `serveur/src/lieu-vivant.ts` |
| **B9** | La meule de charbonnière accepte la **charbonnette** : **10 bûches, ou 5 bûches et 20 branches**, pour 4 charbons | `lignees.ts` ou `recettes/charbonniers.ts` (deux coûts au choix) |
| **B10** | **Refusée** : le gourdin garde sa bûche | — |
| **B11** | Le Moulin : les **poutres de chêne** de l'atelier du charpentier donnent **2 bûches garanties** (24 h) | `commun/src/moulin.ts` |
| **B12** | **Creuser un Dakota rend 5 pierres** au lieu de 3 | `lignees.ts` (`CREUSER.rend`) |
| **B13** | Le Comptoir garde en stock **10 bûches et 10 pierres**, réassort d'une unité toutes les 2 h, au prix de vente (19 et 7 wotts) | `serveur/src/comptoir.ts` (`STOCK_DE_BASE`), `commun/src/economie.ts` |
| **B14** | L'avertissement de la bûche (ci-dessus), **fermé par un bouton** | `client/src/hud.ts`, `commun/src/tutoriel.ts` |
| **B15** | Plus tard (niveau 2) : le tas de bois de H2B | — |
| **B16** | La route B à la **même distance** que la route A : **terrain → gué 3 km, gué → Moulin 2 km** | `lieux.ts` (`TRONCONS`) |
| **B17** | Le Moulin : **18 à 24 Éteints** (le modèle n'en a que 4) | `commun/src/moulin.ts` |

**Ce que cela donne** (calcul de l'étude, avec B2 à B5 et B9) : en plus de la visite du tutoriel, ⚡ n'a besoin d'**aucun** aller-retour de ravitaillement à la station, ⚙️ de 0 à 1, 🔥 d'**un** pour le niveau 1 ; la sortie au gué rapporte 8 à 15 pierres de réserve. Une visite typique rapporte ≈ 14 bûches et 10 pierres, soit **48 kg** : le sac est plein, le travois devient utile. Confortable sans être gratuit.

**À vérifier en test** : les 6 h de retour (B3, B5), les 10 bûches par joueur (B3), le stock du Comptoir (B13).

---

## 3. Les chantiers

**Effort** : **S** = une demi-journée à un jour ; **M** = un à trois jours ; **L** = trois à cinq jours de travail d'un agent.

*Chaque chantier relit les sources de sa partie avant de commencer. Les identifiants d'objets proposés sont entre parenthèses ; le chantier 3 les fixe une fois pour toutes.*

### Vague 1 · Les fondations

**Chantier 1 · Le moteur des constructions** (vague 1, **L**)

- **Contenu** :
  - un seul champ `lieu` dans `Recette` : `{ genre: "main" }`, `{ genre: "posee" }` ou `{ genre: "construction", construction, niveau?, formes?, accessoire? }`. Il remplace `installation`, `feu`, `feuNiveau`, et les listes cachées `FORGE_VENTILEE_REQUISE` et `HUILE_REQUISE` ;
  - chaque `Etape` de lignée gagne sa **clé** (`cle`: l'objet ou l'outil, ses replis, ses textes `idee`, `ideePlusTard`, `indice[2]`) et son **étape de lieu** (`maison`, `H1`, `L1`, `L2`…) ;
  - le marqueur **`aVenir`** (« 0b » ou « niveau 2 ») remplace `phase: "0b"` et s'applique aussi aux recettes (§1.3) ;
  - **les outils, portes dures** : `multiplicateurQualites` ne descend plus d'un niveau ; la table `QUALITES_OBJETS` reçoit les **objets de fortune** au niveau 1 (§2.1) ;
  - le serveur vérifie le `lieu` (la forme du foyer, la construction à son niveau à 3 m, l'accessoire), et le refus nomme ce qui manque (« Il te faut un foyer de pierres ») ;
  - la carte des installations distingue les **formes du feu** (`feu:dakota`, `feu:foyer_pierres`…), pas seulement le meilleur niveau.
- **Fichiers** : `commun/src/recettes.ts`, `commun/src/lignees.ts` (le type `Etape` et les fonctions, pas les données), `commun/src/recettes/*.ts` (le champ `lieu` seulement, ligne à ligne), `commun/src/forge.ts` (les deux listes), `serveur/src/joueur.ts` (`fabriquer`, `cuisinePour`, `preparerEtape`), `commun/src/messages.ts`.
- **Dépendances** : aucune. **Il livre d'abord les types** (`LieuRecette`, `CleEvolution`, `aVenir`), en une demi-journée : les chantiers 2, 3, 5, 6 et 7 s'appuient dessus.
- **Tests** : chaque recette de `RECETTES` a un `lieu` (comme la `categorie` obligatoire) ; une recette « au foyer de pierres » est refusée près d'un feu de camp ; une étape `aVenir` est refusée ; Marteler 1 ne suffit plus pour Marteler 2 ; la pierre donne Marteler 1, le couteau Visser 1 ; les tests de fabrication d'aujourd'hui passent, sauf ceux que la grille change (listés dans le commit).
- **Graphismes** : aucun.

**Chantier 2 · Le dévoilement et la migration** (vague 1, **L**)

- **Contenu** :
  - **`progression.ts` sans paliers** : on retire `palier`, `prochainPalier`, `recettesDuPalier` et le filet par palier. Une recette liée à une construction est dévoilée **par la construction seule**. Les recettes **à la main** gardent leurs déclencheurs, leur indice et un filet **par recette** (les 20 et 60 min d'aujourd'hui, portés par la ligne). Le seuil du métier reste (l'étape « La famille », ou 2 h) ;
  - **les silhouettes** « À découvrir » deviennent **le niveau suivant** des constructions qu'on possède (« Au foyer de cuisine : soupe de cèpes »), plus ce qu'une quête en cours demande ;
  - **l'idée au ramassage** : un nouveau déclencheur `cle` (le premier `vu` d'une clé, ou l'outil en main) ; le message `idee` ou `ideePlusTard` ; la liste des **idées gardées** dans le personnage ;
  - **l'indice en deux temps** : un fait `indice:<évolution>` passe au second temps après une visite du bon lieu sans la clé, ou 45 min de jeu (Q-0.8-16) ;
  - **le vétéran sans tutoriel** reçoit les recettes communes à la main ;
  - **la migration** (décision Q4 du 2026-10-09) : à la première connexion en 0.8, le dévoilement est **recalculé** à partir des constructions du terrain ; une recette déjà fabriquée reste visible, grisée si sa construction manque ; **rien de construit ni de fabriqué n'est détruit** ; un champ `versionDevoilement` empêche de la rejouer.
- **Fichiers** : `commun/src/progression.ts`, `serveur/src/devoilement.ts`, `serveur/src/sauvegardes.ts` (le personnage : idées gardées, temps d'indice), `serveur/src/base.ts` (si une colonne est ajoutée), `client/src/fabrication-arbre.ts`, `client/src/carnet-idees.ts`, `client/src/hud.ts` (la fiche d'installation : la clé, « déjà en poche », l'indice ; zone `carteEtape`, `carteApres`).
- **Dépendances** : les types du chantier 1.
- **Tests** : `progression.test.ts` et `devoilement.test.ts` réécrits ; ramasser un grillage sans foyer de pierres garde l'idée, et la fiche du foyer de cuisine la montre « déjà en poche » ; l'indice passe au second temps après une visite de L1A sans le grillage ; le message ne revient pas au second ramassage ; une sauvegarde 0.7.3 se relit, ses installations et ses objets sont intacts, et la poêlée reste grisée pour qui n'a qu'un feu de camp.
- **Graphismes** : le message « Tu y penses » et son son court (synthétisé côté code) : un bandeau qui passe, ou qui se ferme **d'un bouton**, jamais une fenêtre de dialogue à croix (règle du porteur, §2.6) ; la ligne de la clé dans la fiche (icône, nom, indice en six mots, lisible sur l'iPhone 13 mini) ; l'étiquette « déjà en poche ».

**Chantier 3 · Le catalogue des objets** (vague 1, **M**)

- **Contenu** : **tous** les objets de la 0.8, déclarés d'un coup, avec leur nom, leur pluriel, leur poids, leur description et leur famille de vestige :
  - **à créer** (`objets_a_creer`, ce qui touche L1) : bidon de 5 L (`bidon_5l`), tête de marteau (`tete_marteau`), enclume de dépanneur (`enclume_depanneur`), petit alternateur (`petit_alternateur`), glaise (`glaise`) et son gisement, seau de 10 L (`seau_10l`), toile de jute (`toile_jute`), feuillards (`feuillards`), fourche à foin (`fourche_foin`), poignée de clous (`poignee_clous` : vider un bocal en donne 5), maillet, coin de bois, planches fendues, serre-joint, scie et marteau de fortune, bâton à fouir durci ;
  - **à renommer sans changer l'identifiant** : « jerrican vide » → « jerrican percé » (`jerrican`, un déchet : du plastique), pour ne migrer aucun inventaire (I5) ;
  - **à retirer** (`objets_a_retirer`, ce qui touche L1) : la bobine d'allumage des épaves et de la mobylette, les roulements de la machine à laver et de la trottinette, les roulements et l'alternateur de tracteur de la Coopérative, l'étau, le grillage et la cocotte des tables de fouille courantes. On retire les **sources**, pas les objets : ceux qu'on a restent ;
  - **les qualités** : la pierre, la clé plate, le cric, la ferraille tordue (Marteler 1) ; la tête de marteau remmanchée (Marteler 2) ; l'étau (Serrer 3) ; etc.
- **Fichiers** : `commun/src/objets.ts`, `commun/src/vestiges.ts`, `commun/src/vestiges-lot2.ts` (démontages), `commun/src/dechets.ts` (les tables), `commun/src/recettes.ts` (`QUALITES_OBJETS` seulement), `client/src/icones.ts`, `client/src/icones-metier.ts`, `client/src/planche-icones.ts`.
- **Dépendances** : aucune. Les chantiers suivants **n'ajoutent pas d'objet** : s'il en manque un, ils le demandent au chantier 13.
- **Tests** : chaque objet nouveau a une icône (`icones.test.ts`) ; vider un bocal de clous donne 5 poignées ; la machine à laver ne donne plus de roulement ; aucune table de fouille courante ne tire l'étau, le grillage ni la cocotte ; un inventaire 0.7.3 avec un jerrican se relit.
- **Graphismes** : les **icônes** de tous les nouveaux objets, dans la charte du sac (Book 21 §5, priorité au soin visuel) : bidon, tête de marteau, enclume, petit alternateur, motte de glaise, seau galvanisé, toile de jute, feuillards, fourche, poignée de clous, outils de fortune ; le jerrican percé.

**Chantier 4 · La carte à deux routes** (vague 1, **M**)

- **Contenu** : les deux lieux nouveaux, **vides**, branchés partout pour que les chantiers 11 et 12 n'aient plus qu'à les remplir :
  - `LieuId` gagne `gue` et `moulin` ; les tronçons, les distances, l'ordre de découverte ; les sorties et les arrivées ;
  - **les distances** (B16) : **terrain → gué 3 km, gué → Moulin 2 km**, comme terrain → station → Coopérative. La route A passe la rivière par le pont, la route B par le gué ;
  - **une table `ETAPES_LIEUX`** (`H1A: "station"`, `H1B: "gue"`, `L1A: "cooperative"`, `L1B: "moulin"`) : le contenu du jeu (clés, quêtes, indices) cite **l'étape**, et l'affichage met le nom du lieu. Le couple est retenu, mais le niveau 2 réutilisera la même table ;
  - la carte du monde : deux nœuds, la route A (station, Coopérative) et la route B (gué, Moulin), les chemins, la fiche de chaque lieu avec sa **promesse** en une ligne (« Le gué : la pierre, la glaise et la rive. ») ;
  - le voyage (coût en kcal et en eau par km, séquence de 10 s), l'étape par une halte (on passe par le gué pour aller au Moulin, comme par la station pour la Coopérative) ;
  - le menu « Aller à… » de god.
- **Fichiers** : `commun/src/lieux.ts`, `commun/src/admin.ts`, `commun/src/messages.ts`, `client/src/carte.ts`, `client/src/rendu/carte-vue.ts`, `serveur/src/monde.ts`, `serveur/src/joueur.ts` (le voyage, une ligne d'appel), `client/src/son/audio.ts` (le nom des lieux pour les ambiances).
- **Dépendances** : aucune.
- **Tests** : on voyage du terrain au gué, du gué au Moulin, et retour ; terrain → gué coûte autant que terrain → station (3 km), gué → Moulin autant que station → Coopérative (2 km) ; god va au gué et au Moulin ; un joueur 0.7.3 en voyage se relit ; la carte s'ouvre à 375 px sans déborder (`carte-vue.test.ts`).
- **Graphismes** : la carte du monde avec ses deux routes (la rivière, le gué, le Moulin), les pictogrammes des deux lieux, dans le style de l'atlas existant.

### Vague 2 · La base et les armes

**Chantier 5 · Le feu et l'eau** (vague 2, **M**)

- **Contenu** :
  - **le feu** : les recettes rattachées (§2.3) ; le foyer de cuisine avec sa **clé** (grillage) et son repli (2 barres, Marteler 2, deux fois plus long) ; la marmite norvégienne avec sa clé (cocotte) et son repli (une casserole, la soupe refroidit plus vite) ; le four grisé « plus tard » avec ses deux plats ; le bâton à fouir **durci** au foyer de pierres (I24) ; **creuser un Dakota rend 5 pierres** au lieu de 3 (B12, `CREUSER.rend`) ;
  - **l'eau** : le récupérateur de 5 L à la maison (bidon, 4 sacs plastique) ; le **récupérateur à seau (10 L)** au niveau 2 (clé : seau ; repli : le bidon de 5 L et le bidon d'huile rincé, I4) ; la citerne de 60 L retirée de la lignée ; le 20 L grisé « plus tard » ; `CONTENANCES_RECUPERATEUR` = 5, 10, 20.
- **Fichiers** : `commun/src/lignees.ts` (blocs `VOIE_SURFACE`, `VOIE_CREUSEE`, `ACCESSOIRES_FEU`, `recuperateur_pluie`), `commun/src/recettes/communes.ts` (bloc « feu et cuisine »), `serveur/src/production.ts` (le remplissage), `client/src/rendu/feu.ts`, `client/src/rendu/installations.ts`.
- **Dépendances** : chantiers **1** (types) et **3** (objets).
- **Tests** : le foyer de cuisine se monte avec un grillage, ou deux barres et Marteler 2 ; la soupe n'apparaît qu'au foyer de cuisine ; creuser un feu de camp en Dakota rend 5 pierres, le combler en coûte 5 (plus de perte) ; le récupérateur de 5 L se fait à la maison avec les 4 sacs du chemin ; le 10 L tient 10 L, même hors ligne ; une citerne 0.7.3 se relit (Q-0.8-8).
- **Graphismes** : le récupérateur de 5 L (bidon, sacs plastique tendus en entonnoir), le récupérateur à seau, la marmite norvégienne (une caisse de chiffons, la cocotte dedans), la grille sur le foyer de cuisine ; le four grisé dans la fiche.

**Chantier 6 · Le couchage, le stockage, l'établi, la lumière** (vague 2, **M**)

- **Contenu** :
  - **le couchage** : l'abri garni absorbe le lit (I25) ; l'**abri fermé** avec sa clé (toile de jute ; repli : 4 chiffons et 2 sacs plastique cousus, moins chaud) et sa poignée de clous ;
  - **le stockage** : le **râtelier à outils** (nouveau : les outils rangés à 3 m comptent pour les qualités) ; le **coffre cerclé** avec sa clé (feuillards ; repli : une barre martelée en bandes, Marteler 2, long) et sa poignée de clous ; la réserve couverte grisée ;
  - **l'établi** : une lignée nouvelle (`etabli` : établi → établi à étau) ; l'**établi à étau** (clé : étau ; repli : serre-joint de fortune, sans le serrage fort) donne **Serrer 3** et ses recettes : maillet, coin, planches fendues, **réparer le manche** (le geste est au chantier 9) ;
  - **la lumière** : la **torche plantée** (6 m, 1 h, une source de lumière de nuit qui compte dans la signature) ;
  - **les recettes à la main** des outils de fortune et du **marteau remmanché**.
- **Fichiers** : `commun/src/lignees.ts` (blocs `abri`, `coffre`, `etabli` nouveau, `torche_plantee`), `commun/src/recettes/communes.ts` (bloc « outils et bâtir »), `commun/src/recettes.ts` (`TypeInstallation` : `ratelier_outils`, `torche_plantee`), `serveur/src/joueur.ts` (le râtelier dans `niveauQualite`, une ligne d'appel), `client/src/rendu/installations.ts`, `client/src/rendu/lumieres.ts`.
- **Dépendances** : chantiers **1** et **3**. En parallèle du chantier 5 (blocs séparés de `lignees.ts`).
- **Tests** : l'abri fermé donne sommeil ×1,45 ; le coffre cerclé tient 250 kg et demande Marteler 2 (le marteau remmanché suffit, la pierre non) ; une hache rangée au râtelier à 3 m donne Fendre au coffre ; l'établi à étau donne Serrer 3 ; la torche s'éteint au bout d'une heure ; un lit de branchages 0.7.3 est absorbé à la montée de l'abri.
- **Graphismes** : l'abri fermé (la toile de jute côté vent), le coffre cerclé (les feuillards), le râtelier, l'établi à étau, la torche plantée et sa lumière (dans la réserve fixe de lumières de nuit, Book 21 §5.3.3), le marteau remmanché en main.

**Chantier 7 · Les meubles de famille** (vague 2, **L**)

- **Contenu** :
  - 🔥 **le foyer de forge** avec sa clé (enclume de dépanneur ; repli : Q-0.8-1) ; `ENCLUMES` : enclume de dépanneur, étau et tête de masse à **★★** ; `etoilesForge` : le foyer donne ★★, la forge ventilée ★★★ (Q-A2d) ; la trempe à l'eau ne dépasse plus le maillon de la forge ; le **bac de trempe** devient une auge (2 bûches, 2 glaises, Creuser 1 ; `COUT_BAC` sans casserole) ; la forge ventilée grisée « plus tard » ; les recettes du foyer de forge (pinces, rivets, pointes, couteau et machette au fer doux ; la hachette : Q-0.8-2) ; la **meule de charbonnière** accepte la **charbonnette** (B9) : 10 bûches, **ou** 5 bûches et 20 branches, pour 4 charbons ;
  - ⚡ **le banc solaire** : le banc de recharge et son panneau ne font plus qu'un meuble, avec le panneau pour clé (repli : la manivelle de la lampe à dynamo, lent) ; 80 Wh par jour au soleil dans la batterie de la ruine ; ses recettes (pack, modules au flash et à la raquette, matraques ★ et ★★, lampe) ; le module à bobine, l'aiguillon et l'électrificateur grisés ;
  - ⚙️ **le pédalier générateur** : le pédalier universel avec le petit alternateur pour clé (repli : la dynamo du vélo, 3 à 6 W) ; ≈ 60 Wh par heure de pédalage dans la batterie de la ruine ; la meule et l'accessoire de ventilation s'y montent ; le cranequin et l'arbalète lourde grisés ;
  - **les meubles déjà posés** (banc et panneau séparés, pédalier universel, forge avec un étau) restent et fonctionnent.
- **Fichiers** : `commun/src/lignees.ts` (bloc `forge`, blocs nouveaux `banc_recharge`, `pedalier`), `commun/src/forge.ts`, `serveur/src/forge.ts`, `commun/src/energie.ts`, `serveur/src/electricite.ts`, `commun/src/mecanique.ts`, `serveur/src/mecanique.ts`, `commun/src/recettes/charbonniers.ts`, `recettes/voltaiques.ts`, `recettes/mecanistes.ts` (le champ `lieu` et les recettes grisées, pas les valeurs d'armes), `client/src/rendu/metier/forge.ts`, `electricite.ts`, `mecanique.ts`.
- **Dépendances** : chantiers **1** et **3**.
- **Tests** : chaque famille, **seule**, bâtit son premier meuble avec sa pièce et ce que la ruine lui donne ; une machette forgée sur l'enclume de dépanneur est ★★, ★★★ maîtrisée ; un étau posé sur la forge ne donne plus ★★★ ; le bac de trempe demande la glaise et plus de casserole ; la charbonnière se charge de 5 bûches et 20 branches et rend 4 charbons ; le pédalier générateur charge la batterie de ≈ 60 Wh en une heure de pédalage ; le banc solaire, ≈ 80 Wh par jour de soleil ; une forge ventilée 0.7.3 reste ventilée.
- **Graphismes** : l'enclume de dépanneur posée près du foyer, le bac de trempe en auge de planches et de glaise (et sa vapeur), le banc solaire (le panneau sur le banc, la jauge), le pédalier générateur (le vélo de la ruine sur son bâti, l'alternateur, la courroie, la batterie) ; sons synthétisés : le ronronnement de l'alternateur qui monte avec le pédalage.

**Chantier 8 · Les armes : chiffres, plafonds, garde-fou** (vague 2, **L**)

- **Contenu** :
  - **les valeurs** décidées (§2.4, `decisions-armes.json`) dans les tables : dégâts par étoiles, solidités (marteau 40, matraques 60, arbalète 60 et 80…) ; le marteau ne tue plus à la tête (Q-A3) ;
  - **les dégâts électriques** : `degatsTorse` non nul pour les trois armes électriques, appliqué par `encaisser` au type « électrique » ; pack vide à la moitié (C11) ; un réglage `equilibre_electrique_degats` (1 par défaut) ;
  - **les plafonds de la grille par les recettes** : la corde de joncs donne ★★, le fil dentaire et le boyau ★★★ (I13) ; l'arc d'if ★★ ; l'arbalète ★★ (l'if : Q-0.8-3) ; la petite batterie, source de la matraque ★★ (Q-A5) ; le texte de la petite batterie unique dans les deux fiches (Q-B6) ;
  - **la maîtrise sans plafond** : vérifier que l'étoile du dessus prend ses vrais dégâts (K-Q1) ;
  - **la fourche à foin**, arme trouvée de L1B (I30) ;
  - **le garde-fou rejoué par étape** : `npm run equilibre -- --etape maison|H1|L1` rejoue les scénarios du Book 25 §8.4 avec les armes **de l'étape** (la grille), et dit OK ou faute ; un test le vérifie pour la maison et H1/L1.
- **Fichiers** : `commun/src/armes/communes.ts`, `armes/charbonniers.ts`, `armes/voltaiques.ts`, `armes/mecanistes.ts`, `commun/src/combat.ts` (`encaisser`, pack vide), `commun/src/tir.ts` (les valeurs de l'arc et de l'arbalète), `commun/src/recettes/communes.ts` (bloc « arcs » : cordes), `commun/src/equilibre.ts`, `scripts/equilibre.ts`, `commun/src/reglages.ts`.
- **Dépendances** : chantier **1** (le `lieu` des recettes d'armes). En parallèle des chantiers 5 à 7.
- **Tests** : `equilibre.test.ts` : le garde-fou passe à la maison et à H1/L1 (pire rapport ≤ 2, coût ≤ 3 fois) ; une courte de matraque ★★ ajoute 1,1 au torse ; vide, elle frappe à 0,55 ; une machette ★★ maîtrisée fait 2,5 ; la fourche tue à la tête et passe le casque ; `combat.test.ts` et `combat-enrichi.test.ts` mis à jour là où les valeurs changent, et seulement là.
- **Graphismes** : la fourche à foin en main (pose de la lance), dans le dos ; un éclat d'arc bleu un peu plus vif quand la courte fait des dégâts (à juger à l'œil, sans surcharger).

**Chantier 9 · Faire évoluer et réparer une arme sur son meuble** (vague 2, **M**)

- **Contenu** :
  - **le geste « Reprendre l'arme »** (R-ARMES-5) : près de son meuble (la forge pour une lame, le banc pour une matraque, l'établi pour une arbalète ou un arc), on choisit l'arme qu'on porte ; le meuble propose **la réparer** à son niveau, ou **la monter d'une étoile** si le meuble et les pièces le permettent (par exemple : arbalète ★ → ★★ avec un arc d'arbalète en ressort). L'exemplaire garde son identité (son usure revient à neuf, sa clé `type#n` change d'étoile). On ne fabrique plus une seconde arme pour une meilleure étoile ;
  - **réparer le manche** (R-ARMES-4) : à l'établi à étau, sans forge, pour toutes les familles ; pour le marteau, la tête ne s'use pas, seul le manche ;
  - `ATELIER_REPARATION` se lit dans les meubles (lame : meule ou forge ; bois : établi ; manche : établi à étau).
- **Fichiers** : nouveau `serveur/src/evolution-armes.ts` (et son test) ; `serveur/src/joueur.ts` (une ligne d'appel, le `reparer` d'aujourd'hui y est déplacé) ; `commun/src/combat.ts` (`ATELIER_REPARATION`), `commun/src/etoiles.ts` (`uneEtoileDePlus` sur un exemplaire), `commun/src/messages.ts`, `client/src/hud.ts` (le sac : le bouton « Reprendre » près d'un meuble).
- **Dépendances** : chantiers **1**, **7** (les meubles de famille) et **8** (les plafonds). Il peut commencer par la réparation du manche.
- **Tests** : une arbalète ★ rapportée à l'établi avec un arc en ressort devient ★★, sans nouvel objet ; une machette ★★ ne monte pas à ★★★ sur le foyer de forge (le meuble ne le permet pas), seulement la maîtrise ; un marteau abîmé retrouve son manche à l'établi à étau ; loin d'un meuble, le geste est refusé.
- **Graphismes** : le geste au meuble (la pose « outil » ou « lourd » existante) ; dans le sac, l'étoile qui s'ajoute (une courte animation dorée).

### Vague 3 · Les lieux et le butin

*Leur préparation graphique (l'import des modèles, les budgets sur iPhone) peut commencer dès la vague 1, dans leurs fichiers nouveaux, sans toucher au jeu.*

**Chantier 10 · Le butin de la maison, de H1A et de L1A** (vague 3, **M**)

- **Contenu** :
  - **la maison** : le bidon dans la ruine, la tête de marteau dans la caisse, les 4 sacs plastique dans le premier sac-poubelle du chemin ;
  - **H1A** : clous, fil de fer, huile dans la caisse de l'atelier ; **la pièce de famille personnelle** dans un lieu partagé (règle R4 du game designer) : chacun voit **la sienne**, et la prend **pour lui** ; elle revient pour son joueur (un nouveau mécanisme dans `LieuVivant` : une ressource visible et prise par joueur, à côté de `ressourceVisible(type, famille)` qui existe déjà pour l'if) ; l'enclume et le sac de 4 charbons sous l'établi du garage, le petit alternateur sur l'établi près d'une **voiture éventrée** (nouveau point) ; `VERSION_HALTE` + 1 ;
  - **le bois et la pierre de la station** (§2.7) : **12 bûches** en vrac qui reviennent **toutes les 30 min** (B2) ; le **tas de bois de chauffage personnel** derrière l'atelier, **10 bûches par joueur**, 6 h réelles (B3, avec le même mécanisme que la pièce de famille) ; les **13 pierres** qui reviennent en **30 min** (B4) ;
  - **la repousse par lieu** (B4) : un tableau `REPOUSSE_PAR_LIEU` (ou un champ de `DefinitionLieuVivant`) remplace `REPOUSSE_MS.pierre = null` appliqué partout : au terrain, les pierres et les bûches ne reviennent jamais ; dans les haltes, en 30 min ;
  - **le vrac qui grandit avec les voyageurs** (B8) : dans un lieu partagé, la quantité en vrac fait +50 % par voyageur présent en plus, jusqu'à ×3 ; le mécanisme sert à la station et au gué ;
  - **R-BUTIN** : les clés de L1 tirées rarement, avec une chance fixée à la main, à H1A, H1B et dans l'autre L1 ;
  - **L1A** : le grillage au parc à volailles, la cocotte au libre-service, les seaux à la chambre froide devenue laiterie ; on retire les roulements et l'alternateur de tracteur ; `VERSION_COOP` + 1 ;
  - **le Comptoir** vend les clés de L1 **après une première visite** du lieu (le fait `visite:<lieu>`), plus cher que d'aller les chercher, en stock limité ; il les rachète (prix : Q-0.8-12). Les pièces de famille ne s'y vendent pas ;
  - **le Comptoir, filet du bois et de la pierre** (B13) : **10 bûches et 10 pierres** en stock (`STOCK_DE_BASE`), réassort d'une unité toutes les 2 h, au prix de vente (19 et 7 wotts).
- **Fichiers** : `commun/src/terrain.ts` (ruine, caisse, `REPOUSSE_MS`), `commun/src/couche-dechets.ts` (le premier sac du chemin), `commun/src/halte.ts` (12 bûches, le tas de bois, les pierres), `commun/src/vestiges.ts` (tables de fouille, `EN_PLUS_PAR_LIEU` ou son équivalent), `commun/src/dechets.ts`, `commun/src/cooperative.ts` (`butinCoop`), `serveur/src/lieu-vivant.ts` (le butin personnel, la repousse par lieu, le vrac qui grandit), `serveur/src/comptoir.ts` (`STOCK_DE_BASE`, réassort), `commun/src/economie.ts`, `client/src/rendu/halte.ts`, `client/src/rendu/cooperative.ts`.
- **Dépendances** : chantiers **3** (objets) et **4** (étapes des lieux) ; les **clés** viennent des chantiers 5 à 7 (leurs textes d'idée et d'indice). Le mécanisme du butin personnel, de la repousse par lieu et du vrac qui grandit est livré **en premier** (une demi-journée) : le gué (11) et le Moulin (12) s'en servent.
- **Tests** : à la première visite de L1A, les trois clés sont à leur place ; elles reviennent au bout de leur délai ; à la station, deux joueurs de la même famille prennent chacun leur enclume ; un Voltaïque ne voit pas l'enclume ; le premier sac-poubelle donne toujours 4 sacs plastique (sur 2 000 terrains tirés) ; le Comptoir refuse de vendre un seau avant la première visite de L1A ; les bûches et les pierres de la station reviennent en 30 min, celles du terrain jamais ; deux joueurs à la station prennent chacun 10 bûches à leur tas, et le tas de l'un ne bouge pas quand l'autre se sert ; à trois voyageurs, le vrac fait ×2, à cinq ×3 et pas plus ; le Comptoir a 10 bûches au démarrage, et une de plus 2 h après en avoir vendu.
- **Graphismes** : l'enclume de dépanneur et le sac de charbon sous l'établi, le petit alternateur sur l'établi, la voiture éventrée (capot ouvert), le tas de bois de chauffage derrière l'atelier (qui baisse quand on se sert), le rouleau de grillage au parc à volailles, les seaux de la laiterie, la cocotte en rayon ; le bidon dans la ruine.

**Chantier 11 · H1B, le Gué-aux-Saules** (vague 3, **L**)

> **Retenu** par le porteur (2026-10-10), devant la digue des Roselières (24/27), gardée pour H2B. Le gué oppose à la route A une autre sorte de danger : l'eau, la vase et le passage, au lieu des bâtiments.

- **Contenu** :
  - **un lieu partagé** (`LieuVivant`, comme la halte) : la zone, les sorties, l'arrivée, les obstacles tirés du modèle (`userData.obstacles`), les zones creusées non praticables (la rivière) ;
  - **le rendu** depuis `batiment/halte-gue/modele.js` (4 tronçons de 50 × 70 m posés à leur `decalage`, seuls le tronçon du joueur et ses voisins construits ; alias `three` dans Vite, `server.fs.allow` sur `batiment/`) ; l'effacement des toits (`estomperToits`) ; les lumières de nuit (la guirlande de Chez Lulu) ;
  - **les deux goulets** : le **radier** submersible (on le traverse à pied, plus lentement) et le **bac à câble** (une interaction : on tire le radeau ; « pas de nuit » ; Q-0.8-22) ;
  - **le contenu** (H1B, I11, B5 à B8) :
    - **15 pierres** en vrac sur le **banc de galets** accroché au radier, qui reviennent en **30 min** et grandissent avec les voyageurs (B4, B8) ;
    - un **banc de galets personnel** de **8 pierres par joueur**, 6 h (B5) ;
    - le **gisement de glaise** : la vase de la berge du modèle, renommée « glaise » ; inépuisable ; **1 glaise (2 kg) par geste de 6 s** avec Creuser 1 (B6) ;
    - **6 touffes de joncs** sur les berges, qui repoussent en 30 min (B7) ;
    - le « bois flotté » du modèle devient un **tas de branches** (I11 l'a retiré comme matériau) ;
    - par chance : bâche, chiffons, casserole, cordes, et rarement une clé de L1 (R-BUTIN) ;
  - **le panneau** du modèle annonce « 1 km » : le jeu affiche les vraies distances (3 km du terrain) ; la correction du modèle est à demander à la session « bâtiments » (on n'écrit pas dans `batiment/`) ;
  - **les Éteints** : les **11** points du modèle (`eteints`), comme à la station (Q-0.8-23, réglée) ;
  - **la vue** : le gué est surtout à ciel ouvert ; la cabane du passeur et la guinguette suivent la vue par pièce si on y entre (plan à tirer du modèle, comme `PLAN_VUE_HALTE`).
- **Fichiers** : nouveaux `commun/src/gue.ts` (contenu, Éteints, plan de vue), `serveur/src/gue.ts`, `serveur/src/gue.test.ts`, `client/src/rendu/gue.ts` ; partagés : `commun/src/terrain.ts` (`TypeRessource` : `gisement_glaise`, et `USAGES`), `commun/src/vue-lieux.ts` (un bloc), `client/src/main.ts` (une ligne d'appel), `client/vite.config.ts`.
- **Dépendances** : chantiers **3** (glaise) et **4** (le lieu vide) ; le mécanisme du chantier **10** (butin personnel, repousse par lieu, vrac qui grandit), livré en tête de la vague 3.
- **Tests** : creuser la berge avec le bâton à fouir donne 1 glaise par geste de 6 s, sans fin ; sans outil Creuser 1, c'est refusé ; les 15 pierres reviennent en 30 min ; le banc de galets de chaque joueur lui donne 8 pierres, puis revient en 6 h ; les joncs repoussent en 30 min ; on ne marche pas dans la rivière ; le bac refuse la traversée de nuit ; deux joueurs au gué voient les mêmes pierres ; budget sur iPhone 13 mini : ≤ 60 000 triangles et ≤ 40 appels de dessin par tronçon (mesuré avec `?mesure=1`).
- **Graphismes** : l'intégration du modèle, la berge et son gisement de glaise (une motte qu'on voit creusée), les touffes de joncs, l'eau qui court sur le radier ; **son** : l'ambiance de l'eau courante est à demander à la session musique (moteur et ambiances, mémoire « Son : musique vs effets ») ; le clapot du radier et le grincement du câble du bac, synthétisés côté code.

**Chantier 12 · L1B, le Moulin à eau** (vague 3, **L**)

> **Retenu** par le porteur (2026-10-10). Le gué et le Moulin sont déjà liés par le récit : l'enseigne du modèle dit « MINOTERIE DU GUÉ ». La roue à restaurer, « objectif des Mécanistes ⚙️ » dans le modèle, est **gardée pour plus tard** (0b, niveau 3) : au niveau 1, rien n'est propre à une famille.

- **Contenu** :
  - **un lieu personnel** (un par joueur, comme les Coopératives) : ce qu'on garde entre deux visites (Éteints détruits, portes, butin pris), le repeuplement à l'entrée ;
  - **le rendu** depuis `batiment/moulin/modele.js` (une carte de 64 × 54 m, `solPropre` : la rivière et le bief creusés, non praticables) ; les étages et les toits qui s'effacent ;
  - **la vue par pièce** (0.7.2) : la salle des meules, la salle de la roue, la minoterie, le magasin, le logis, l'étable, l'atelier du charpentier. Le modèle n'exporte pas encore ses portes, ses fenêtres ni ses pièces : **demander à la session « bâtiments »** d'exporter `userData.portes`, `userData.fenetres` et `userData.vue` (`visibilite-pieces.md` §4.2), ou les relever ici dans `commun/src/moulin.ts` (Q-0.8-24). Les pièces jamais visitées sont assombries, jamais noires ;
  - **le contenu** (L1B) : la **toile de jute** (les sacs à farine du magasin, 24 h), les **feuillards** (les cercles des barils à farine du magasin, 24 h), l'**étau** (l'établi de l'atelier du charpentier, 4 jours), la **fourche à foin** (l'étable, une fois), un **if au bord du bief** (12 h ; bâton d'if) ; les **poutres de chêne** de l'atelier du charpentier : **2 bûches garanties**, 24 h (B11), pour cercler le coffre sur place ; par chance, rarement une clé de L1A (R-BUTIN). La fourche et la jute ont déjà leur point de fouille dans le modèle ; les feuillards, l'étau et l'if en demandent **trois de plus**, placés dans les données du jeu (`commun/src/moulin.ts`), sans écrire dans `batiment/` ;
  - **les Éteints** : **18 à 24** (B17), contre 4 dans le modèle : dans l'étable, le magasin, le logis, les roseaux et sur le pont ; des dormants dans les pièces sombres, comme à la Coopérative (24 Éteints). Le combat du niveau 1 est du même rang sur les deux routes.
- **Fichiers** : nouveaux `commun/src/moulin.ts` (plan, pièces, portes, butin, Éteints), `serveur/src/moulin.ts`, `serveur/src/moulin.test.ts`, `client/src/rendu/moulin.ts` ; partagés : `commun/src/vue-lieux.ts` (un bloc `PLAN_VUE_MOULIN`), `commun/src/terrain.ts` (`if_bief` dans `TypeRessource`), `serveur/src/monde.ts` (les Moulins, une ligne), `client/src/main.ts` (une ligne), `serveur/src/base.ts` (la table des Moulins, comme celle des Coopératives).
- **Dépendances** : chantiers **3**, **4**, le mécanisme du chantier **10** (butin à délai), et la vue par pièce de la 0.7.2 (`vue.ts`).
- **Tests** : à la première visite, les trois clés, la fourche, l'if et les 2 bûches sont là ; elles reviennent à leur délai ; le coffre cerclé se fait avec les seules bûches du Moulin ; il y a entre 18 et 24 Éteints à l'entrée d'un Moulin neuf ; un autre joueur ne voit pas mon Moulin ; un Éteint derrière une porte fermée ne se voit pas, il s'entend (onde orange) ; on ne marche pas dans le bief ; budget iPhone ≤ 60 000 triangles et ≤ 40 appels.
- **Graphismes** : l'intégration du modèle ; les sacs de jute empilés au magasin, les tonneaux et leurs cercles, l'étau sur l'établi du charpentier, la fourche contre le mur de l'étable, l'if sur la levée ; **son** : l'ambiance du bief et de la roue arrêtée, à demander à la session musique.

### Vague 4 · L'intégration

**Chantier 13 · Le tutoriel, les quêtes, l'aide et la fiche** (vague 4, **L**)

- **Contenu** :
  - **le tutoriel** : « La carte » avant « La famille » (V5-2) ; l'étape « La carte » mène à H1A et y fait trouver la pièce de sa famille ; « La famille » se fait au retour : « Pose le panneau sur ton banc… », « Cale l'enclume près de ta forge… », « Monte l'alternateur sur le vélo de la ruine… » (`familles` de la v5) ; l'ordre des étapes 10 à 12 : Q-0.8-18 ; `recettesDeLEtape` suit ;
  - **« S'installer » en portes successives** : le foyer de pierres en tête ; puis un vrai repas, l'eau du ciel, le coffre ; puis les portes du niveau 1, une par meuble (« Une vraie cuisine », « La soupe qui cuit seule », « Dix litres », « Un abri fermé », « Un coffre cerclé », « L'établi à étau ») ; deux portes ouvertes à la fois, une par route (Q-0.8-19) ;
  - **la première nuit** (B14) : la consigne de l'étape « La nuit » conseille les **branches** au feu ; un avertissement quand on met une bûche au feu du terrain alors qu'il en reste moins de 6 : « Une bûche ne repousse pas : garde-la pour bâtir. » Il se ferme **avec un bouton**, jamais une fenêtre de dialogue à croix (règle du porteur, §2.6) ; il ne revient pas à chaque bûche (une fois par nuit) ;
  - **les quêtes de métier** à revoir : « Le panneau » (trouvé, posé) devient le banc solaire ; « La dynamo » devient le pédalier générateur ; « La trempe » parle du bac de trempe et de la glaise ; « La mise d'acier » (hachette, hache) suit Q-0.8-2 ; « Forger une lame » : le couteau au fer doux ;
  - **l'aide du jeu** : « Fabriquer » (les recettes liées aux meubles, « tu y penses », l'idée gardée), « Améliorer sa base » (la clé, l'indice, les outils de fortune), « Je suis coincé » (renvoyer à la fiche du meuble et à ses indices), « Le gué », « Le Moulin », « Faire évoluer une arme » ;
  - **la fiche Examiner** : les indices « où chercher » en deux temps et l'idée gardée, dans la fiche d'installation (et, si Q-0.8-17 le décide, le panneau détaillé) ;
  - **la version** 0.8, sa ligne dans `code/VERSIONS.md` (dans la voix des versions précédentes).
- **Fichiers** : `commun/src/tutoriel.ts`, `commun/src/progression.ts` (`recettesDeLEtape`, `FAITS_A_FABRIQUER`), `commun/src/quetes.ts`, `serveur/src/quetes.ts`, `serveur/src/joueur.ts` (l'avertissement de la bûche : un appel au moment de nourrir le feu), `client/src/aide-contenu.ts`, `client/src/hud.ts` (l'avertissement et son bouton), `commun/src/version.ts`, `code/VERSIONS.md`.
- **Dépendances** : chantiers **5 à 12** finis.
- **Tests** : `tutoriel.test.ts` : chaque famille finit le tutoriel seule, en passant par H1A ; chaque porte de « S'installer » se valide seule ; aucune quête ne demande un niveau « plus tard » ; chaque rubrique d'aide s'ouvre (`aide-contenu.test.ts`) ; le tutoriel ne demande jamais une recette invisible ; une bûche mise au feu du terrain avec 5 bûches restantes déclenche l'avertissement, avec 6 non, au feu d'une halte jamais ; l'avertissement n'a pas de croix, il se ferme par son bouton.
- **Graphismes** : les icônes des quêtes nouvelles ; la fiche d'installation à 375 px (une ligne par manque, l'indice replié) ; l'avertissement de la bûche, un bandeau dans la charte du carnet avec un bouton (« Compris »).

**Chantier 14 · L'équilibrage, le rythme et les tests de jeu** (vague 4, **M**)

- **Contenu** :
  - **`npm run rythme`** apprend les constructions, les formes du feu et **les sorties** (H1A à 25 – 50 min, H1B, puis L1A et L1B, avec la chance tirée) ; il mesure le temps jusqu'à la première sortie, l'écart entre deux portes, les sorties **sans** porte, et le pire cas de malchance (`avis-game-designer.md` §5.2) ;
  - **`npm run equilibre`** par étape (du chantier 8), rejoué avec les valeurs finales ;
  - **le budget pierre et bois** (§2.7, décidé) : vérifier au simulateur que le niveau 1 tient avec ⚡ **0**, ⚙️ **0 à 1** et 🔥 **1** aller-retour de ravitaillement à la station en plus de la visite du tutoriel, seul puis à cinq joueurs (le vrac qui grandit) ; régler à l'essai les chiffres « à vérifier » (6 h de retour, 10 bûches par joueur, stock du Comptoir) ;
  - **les faits à noter** : `vu:<clé>` et son heure, `visite:<lieu>`, `niveau:<lignée>`, la fiche ouverte sans pouvoir améliorer, l'aide « Je suis coincé » ouverte ;
  - **les tests de jeu** : chaque famille seule, du personnage neuf à tout le niveau 1 ; puis à trois.
- **Fichiers** : `commun/src/rythme.ts`, `commun/src/rythme.test.ts`, `scripts/rythme.ts`, `commun/src/equilibre.ts` (valeurs), `serveur/src/mesures.ts`, `commun/src/reglages.ts`.
- **Dépendances** : chantiers **5 à 12** ; en parallèle du chantier 13.
- **Tests** : le simulateur lui-même ; `rythme.test.ts` vérifie le nombre d'allers-retours de ravitaillement par famille (ci-dessus) ; aucune régression des tests des vagues 1 à 3.
- **Graphismes** : une dernière passe de lisibilité sur l'iPhone 13 mini (la fiche, le message « Tu y penses », l'avertissement de la bûche, la carte à deux routes).

**Chantier 15 · Les books et la bible** (vague 4, **M**, une session « books » en parallèle)

- **Contenu** : relire chaque book **juste avant** de le modifier (sessions parallèles sur `book/`) :
  - **Book 02** (§14 quater, annexe A : les paliers deviennent une grille de conception ; les recettes liées aux meubles ; les outils de fortune) ;
  - **Book 03** (§4 les qualités, portes dures ; §5 l'idée au ramassage, l'indice en deux temps) ;
  - **Book 14** (§4, le tutoriel : la carte avant la famille) ;
  - **Book 20** (la carte : les deux routes à 3 km puis 2 km, la promesse de chaque lieu ; le gué et le Moulin retenus pour H1B et L1B ; la digue pressentie pour H2B) ;
  - **Book 01 §2 bis** et **Book 26** (le budget : repousse par lieu, tas personnels, vrac qui grandit avec les voyageurs, charbonnette, stock du Comptoir) ;
  - **Book 21** (le périmètre : la 0.8) ;
  - **Book 22** (« S'installer » en portes successives) ;
  - **Book 23** (la Coopérative : clés à place fixe, chambre froide devenue laiterie) ;
  - **Book 24** (les lignées : eau 5 → 10 → 20 L, établi à étau, râtelier, torche plantée, abri fermé, coffre cerclé ; la fin de la citerne et du lit de branchages) ;
  - **Book 25** (la grille, les bandes, les enclumes ★★, la pièce de famille, les dégâts électriques, la maîtrise, l'évolution d'une arme) ;
  - **Book 26** (le jerrican percé, les sacs plastique, les tables de fouille) ;
  - **la bible** (`book/bible/progression-et-equilibrage.html`) : marquer ce que la 0.8 a codé ;
  - le **README** des books : ajouter `plans/`.
- **Fichiers** : `book/*.md`, `book/bible/progression-et-equilibrage.html`, `book/README.md`.
- **Dépendances** : les décisions, pas le code ; elle finit avec le chantier 13 pour coller au jeu livré.
- **Tests** : aucun nom en double (« Foyer de forge », « Forge ventilée », « soufflet de forge ») dans les books, le jeu et la bible.

---

**Chantier 16 · La page d'administration sur le réseau local (P-014)** (vague 1, indépendant, **M**)

- **Contenu** (proposition P-014 de `PROPOSITIONS.md`, à lire en entier) : une page web d'administration servie par le serveur du jeu sur le **port 4321**, **sans authentification**, accessible seulement depuis le réseau local du porteur. Elle permet de **supprimer un compte** (confirmation en retapant le pseudo ; déconnexion d'abord), de **réinitialiser un mot de passe** (mot de passe provisoire affiché une seule fois ; sessions fermées), de voir **combien de joueurs sont connectés** et lesquels (pseudo, famille, lieu), et **ce que le serveur sait déjà** de chaque joueur (compte, personnage, sac, coffres, installations, feux, mesures). **Aucun nouveau compteur ni nouvelle mesure.** Le compte « god » est protégé (ni suppression, ni réinitialisation).
- **Le réseau du porteur** (2026-10-10) : le **Pi est dans une DMZ en 192.168.254.0/24** (lui-même en 192.168.254.99) ; **le réseau local du porteur est en 192.168.1.0/24**.
- **Garde-fous** :
  - un **serveur web séparé** dans le même programme, qui n'écoute que sur 4321 : rien de l'admin par le port 1234 du jeu ;
  - dans Docker (`deploiement/compose.yaml`), le port 4321 publié **seulement sur l'adresse du Pi** (`192.168.254.99:4321`), **jamais** redirigé sur la box ;
  - **liste blanche d'adresses** : n'accepter **que 192.168.1.0/24** (le réseau local du porteur) et 127.0.0.1 ; **refuser 192.168.254.0/24** (la DMZ : d'autres machines peuvent y être exposées) et tout le reste ; la box fait un simple routage entre le réseau local et la DMZ : le Pi voit la vraie adresse 192.168.1.x (Q-0.8-27, réglée) ;
  - la box ne publie que des **ports** (le 1234), pas d'hôte exposé : le 4321 n'est pas joignable d'Internet (Q-0.8-28, réglée) ;
  - un **journal des actions** (quoi, quel compte, quand) dans le journal du serveur.
- **Interface** : HTML simple, lisible sur téléphone et ordinateur, en français ; une confirmation **dans la page** avec un bouton (pas de fenêtre de dialogue à croix, règle R48).
- **Fichiers** : `serveur/src/admin-web.ts` (nouveau), `serveur/src/index.ts` (démarrer le second serveur), `serveur/src/base.ts` (lecture, suppression en cascade, réinitialisation), `deploiement/compose.yaml`, `deploiement/LISEZMOI.md`.
- **Dépendances** : aucune ; peut se faire dès la vague 1 et être livré à part.
- **Tests** : refus d'une adresse hors liste blanche (dont 192.168.254.x) ; suppression en cascade ; réinitialisation (ancien mot de passe refusé, jetons effacés) ; « god » protégé ; le port 1234 ne sert aucune route d'admin ; aucune nouvelle mesure écrite.
- **Books** : 17 (architecture), 08 (plateforme), `deploiement/LISEZMOI.md`.

---

## 4. L'ordre et le parallélisme

### 4.1 Les vagues

| Vague | Chantiers (en parallèle) | Doit être fini avant |
|---|---|---|
| **1 · Les fondations** | **1** Moteur des constructions · **2** Dévoilement et migration · **3** Catalogue des objets · **4** Carte à deux routes · **16** Page d'administration (indépendante) | La vague 2. Le chantier 1 livre d'abord ses types (une demi-journée) ; le chantier 2 s'appuie dessus |
| **2 · La base et les armes** | **5** Feu et eau · **6** Couchage, stockage, établi, lumière · **7** Meubles de famille · **8** Armes · **9** Évolution des armes | La vague 3 (le 9 peut déborder sur la vague 3) |
| **3 · Les lieux et le butin** | **10** Butin maison, H1A, L1A · **11** Le gué · **12** Le Moulin | La vague 4. La préparation graphique de 11 et 12 commence dès la vague 1 |
| **4 · L'intégration** | **13** Tutoriel, quêtes, aide, fiche · **14** Équilibrage et rythme · **15** Books et bible | La livraison |

```
vague 1   [1 Moteur] ──types──► [2 Dévoilement]    [3 Objets]        [4 Carte]
             │    ╲                  │                 │   ╲              │    ╲
vague 2   [5 Feu,eau] [6 Couchage…] [7 Famille] [8 Armes] ──► [9 Évolution]   │
             │          │             │            │                │        │
vague 3   [10 Butin] ◄──┴─────────────┴────────────┘   [11 Gué] ◄───┼────────┤
             │                                          [12 Moulin] ◄┴───────┘
vague 4   [13 Tutoriel, quêtes, aide] ◄─────────────────────┤
          [14 Équilibrage, rythme] ◄────────────────────────┤
          [15 Books et bible] (en parallèle, session books)
```

### 4.2 Les fichiers partagés, et comment éviter les conflits

**Le principe** (celui de la 0.6) : la vague 1 pose les **types** et les **points d'appel** ; la vague 2 n'écrit que dans **ses blocs** ; les lieux nouveaux vivent dans **leurs propres fichiers** ; la vague 4 reprend les fichiers d'interface. Quand deux chantiers d'une même vague touchent un fichier, ils écrivent dans des **blocs séparés**, et le second **relit le fichier juste avant de fusionner**.

| Fichier | Qui y touche | Dans quel ordre | Comment éviter le conflit |
|---|---|---|---|
| `commun/src/lignees.ts` | **1** (types, fonctions) ; **5**, **6**, **7** (données) | 1, puis 5, 6, 7 en parallèle | Un bloc par lignée : 5 (feu, eau), 6 (abri, coffre, établi, torche), 7 (forge, banc, pédalier). Personne ne touche le bloc d'un autre |
| `commun/src/recettes.ts` | **1** (moteur), **3** (`QUALITES_OBJETS`), **6** (`TypeInstallation`) | 1 → 3 ; 6 en vague 2 | Le 1 ajoute d'avance `ratelier_outils` et `torche_plantee` au type : le 6 n'a plus qu'à remplir |
| `commun/src/recettes/communes.ts` | **1** (champ `lieu`) ; **5**, **6**, **8** | 1 ; puis 5, 6, 8 | Trois blocs : « feu et cuisine » (5), « outils et bâtir » (6), « arcs » (8) |
| `commun/src/recettes/<famille>.ts` | **1** (champ `lieu`) ; **7** (meubles, grisés) ; **8** (rien : les valeurs d'armes sont dans `armes/`) | 1, puis 7 | Le 8 n'y écrit pas |
| `commun/src/armes/*.ts`, `commun/src/tir.ts` | **8** seul ; **9** lit | 8 | — |
| `commun/src/progression.ts` | **2** ; **13** (`recettesDeLEtape`, `FAITS_A_FABRIQUER`) | 2, puis 13 | Le 13 ne touche que ces deux fonctions |
| `commun/src/objets.ts`, `vestiges.ts`, `vestiges-lot2.ts` | **3** seul en vague 1 ; **10** (tables de fouille, chances) en vague 3 | 3, puis 10 | Le 3 déclare **tous** les identifiants ; personne d'autre n'ajoute d'objet |
| `commun/src/lieux.ts`, `client/src/carte.ts`, `client/src/rendu/carte-vue.ts`, `commun/src/admin.ts` | **4** seul | 4 | Les lieux nouveaux sont branchés vides par le 4 ; le 11 et le 12 n'y reviennent pas |
| `commun/src/terrain.ts` | **10** (ruine, caisse, `REPOUSSE_MS` par lieu) ; **11** (`gisement_glaise`, `banc_galets`) ; **12** (`if_bief`, `poutres_chene`) | 10 d'abord (la repousse), puis 11 et 12 en parallèle | Le 3 déclare d'avance les `TypeRessource` nouveaux ; le 11 et le 12 n'ajoutent que leurs `USAGES`, en fin de table |
| `commun/src/halte.ts`, `serveur/src/comptoir.ts` | **10** seul | — | — |
| `commun/src/vue-lieux.ts` | **11**, **12** | En parallèle | Un bloc chacun (`PLAN_VUE_GUE`, `PLAN_VUE_MOULIN`) |
| `serveur/src/joueur.ts` (3 827 lignes) | **1** ; **2** ; **4** ; **6** ; **9** | 1 → 2 → 4 ; puis 6 → 9 | Pas de logique nouvelle dans ce fichier : chaque chantier écrit son module (`devoilement.ts`, `evolution-armes.ts`, `gue.ts`, `moulin.ts`) et n'ajoute qu'un **appel** |
| `commun/src/messages.ts` | **1**, **2**, **4** en vague 1 ; **9** en vague 2 | 1 → 2 → 4 ; puis 9 | Des blocs en fin de fichier ; le 2 prévoit le message `idee` et ses champs |
| `client/src/hud.ts` | **2** (la fiche : clé, indice) ; **9** (le sac : « Reprendre ») ; **13** | 2 ; 9 ; puis 13 seul | Zones distinctes (la fiche, le sac) |
| `client/src/main.ts` | **11**, **12** (une ligne chacun) ; **13** | En fin de liste | — |
| `serveur/src/lieu-vivant.ts` | **10** (le butin personnel) ; **11** et **12** s'en servent | 10 d'abord | Le 10 livre le mécanisme tôt en vague 3 (une demi-journée) |
| `serveur/src/base.ts`, `serveur/src/sauvegardes.ts` | **2** (le personnage) ; **12** (la table des Moulins) | 2, puis 12 | Une migration chacun, numérotées |
| `commun/src/forge.ts` | **1** (les deux listes) ; **7** | 1, puis 7 | — |
| `commun/src/equilibre.ts` | **8** ; **14** (valeurs) | 8, puis 14 | — |

---

## 5. Les critères de réussite (ce qu'on doit pouvoir faire en jeu)

**Seul, sur un serveur neuf, pour chacune des trois familles :**

1. Finir le tutoriel en passant par **H1A** ; y trouver **sa** pièce de famille (un autre joueur de la même famille trouve la sienne) ; bâtir au retour son **premier meuble de famille** et faire son premier geste (brancher, forger un couteau, pédaler).
2. Construire **tout le niveau 1 de la maison** sans rien d'autre que le terrain, la ruine et sa caisse : feu de camp, foyer de pierres, récupérateur de 5 L, abri garni, coffre, râtelier, établi, torche plantée, alarme à boîtes, marteau remmanché.
3. Au **gué** : creuser de la glaise, ramasser des pierres et des joncs ; 🔥 bâtir le bac de trempe au retour.
4. À **L1A** : trouver le grillage, la cocotte et un seau **à la première visite** ; bâtir au retour le foyer de cuisine, la marmite, le récupérateur à seau.
5. Au **Moulin** : trouver la toile de jute, les feuillards, l'étau, la fourche à foin et l'if **à la première visite** ; bâtir au retour l'abri fermé, le coffre cerclé (au marteau remmanché), l'établi à étau.
6. Avoir **tout le niveau 1** en **≈ 3 h 20** de jeu pour le parcours prudent (`npm run rythme`), avec, en plus de la visite du tutoriel, **0** aller-retour de ravitaillement à la station pour ⚡, **0 à 1** pour ⚙️, **1** pour 🔥 (§2.7).
7. Ne **jamais** trouver la station ni le gué vides de bois et de pierres plus de 30 min, même à plusieurs ; son tas de bois et son banc de galets personnels sont là à chaque visite (au délai près).
8. La première nuit, mettre une bûche au feu quand il en reste moins de 6 sur le terrain : l'avertissement paraît, et **se ferme d'un bouton**.

**Le dévoilement :**

9. Au premier ramassage d'une clé : le message « Tu y penses » ; s'il est trop tôt, « un jour », et la fiche montre la clé « déjà en poche » plus tard.
10. La fiche d'un meuble montre le niveau suivant, sa clé et ce qui manque ; l'indice passe du type de lieu au coin après une visite infructueuse.
11. Rythme : une nouveauté toutes les 3 min en moyenne la première demi-heure ; un but au moins toutes les 20 min ensuite ; **première sortie avant 60 min** ; au plus **une sortie sur quatre** sans porte dans les trois premières heures.

**Les armes :**

12. Aucune arme fabriquée **au-dessus de ★★** sans la maîtrise ; la maîtrise donne ★★★ avec ses vrais dégâts.
13. `npm run equilibre` **OK** à la maison et à H1/L1 (pire rapport ≤ 2, coût par Errant ≤ 3 fois d'écart).
14. Une arme rapportée à son meuble est **réparée** ou **monte d'une étoile**, sans fabriquer une seconde arme ; un manche se répare à l'établi à étau, sans forge.

**La continuité et la technique :**

15. Un personnage 0.7.3 se reconnecte : **rien de ce qu'il a construit ou fabriqué n'est détruit** ; ses niveaux au-delà de L1 fonctionnent.
16. Sur iPhone 13 mini : le gué et le Moulin tiennent le budget (≤ 60 000 triangles, ≤ 40 appels par carte ou tronçon) et la cadence des lieux existants ; sur le Pi, deux lieux vivants de plus ne changent pas la charge mesurée à vide.
17. `npm test` et `npm run verif` passent.

---

## 6. Les risques

| Risque | Ce qui peut arriver | Garde-fou |
|---|---|---|
| **Le rythme qui s'effondre** | Sans paliers, les recettes liées aux constructions disparaissent des 30 premières minutes (l'étude estime 16 → 12 recettes pour le prudent, un écart max qui passe de 4,2 à ≈ 5,2 min) | La quête du foyer de pierres en tête ; la silhouette du foyer de pierres dès le feu de camp ; le rythme mesuré **avant** de livrer (chantier 14) |
| **Le simulateur aveugle** | `npm run rythme` ignore aujourd'hui `feu` et `feuNiveau` : il ne verrait aucun blocage | Le chantier 14 lui apprend les constructions et les sorties **avant** de juger |
| **La migration** | Un personnage 0.7.3 perd l'affichage de recettes qu'il utilisait, ou une installation devient invalide | Rien n'est détruit ; les recettes déjà fabriquées restent visibles ; un test relit une vraie sauvegarde 0.7.3 de chaque famille |
| **Le butin personnel dans un lieu partagé** | Le premier passé prend l'enclume, les autres trouvent la place vide | Un mécanisme dédié (chantier 10), testé à deux joueurs de la même famille |
| **Le budget de pierre et de bois** | Les chiffres décidés (§2.7) se révèlent trop généreux (le bois ne compte plus) ou trop serrés à plusieurs | Les chiffres « à vérifier » réglés au test (chantier 14) ; ce sont des réglages, pas du code ; le vrac qui grandit plafonne à ×3 |
| **Le butin qui revient en 30 min** | Les haltes deviennent une carrière qu'on vide en boucle ; le serveur du Pi recalcule souvent | La repousse se calcule à l'entrée d'un voyageur, comme le repeuplement de la Coopérative : une halte vide de monde ne coûte rien |
| **Le combat du Moulin** | 18 à 24 Éteints dans un lieu qui en a 4 dans le modèle : placements à inventer, coût sur iPhone | Les places de l'étude (étable, magasin, logis, roseaux, pont) ; la mesure `?mesure=1` au Moulin plein |
| **Le modèle du Moulin sans portes** | La vue par pièce ne peut pas s'appliquer | La demande à la session « bâtiments » part **dès la vague 1** ; à défaut, le relevé à la main dans `commun/src/moulin.ts` |
| **Les goulets du gué** | Le bac et le radier demandent des règles qui n'existent pas | Une règle minimale (Q-0.8-22) ; si elle tarde, le radier seul suffit pour la 0.8 |
| **Les dégâts électriques** | La matraque devient trop forte, ou change de nature | Le réglage `equilibre_electrique_degats` ; le garde-fou par étape ; l'étude montre que les temps ne bougent pas à ★★ |
| **Le Voltaïque à H1** | Sans pack ni petite batterie, il reste à ★ (la faute de H1 d'avant Q-A5) | La petite batterie du kit, source de la matraque ★★ ; la fiche le dit (Q-B6) |
| **Les recettes devenues « plus tard »** | Un joueur 0.7.3 qui comptait sur la forge ventilée ou l'aiguillon ne les retrouve plus pour un nouveau personnage | La ligne de `VERSIONS.md` le dit ; la fiche montre la clé « à trouver plus loin » |
| **`serveur/src/joueur.ts`** (3 827 lignes) | Cinq chantiers y touchent | Un module par chantier, un appel par chantier, l'ordre du §4.2 |
| **Les sessions parallèles sur `book/`** | Un book écrasé à l'aveugle | Relire chaque book juste avant de l'écrire (règle du projet) |

---

## 7. Les graphismes et le son, en un coup d'œil

*Priorité au soin visuel (Book 21, mémoire « Phase 0 : graphismes et musique »). Chaque modèle est lisible sur l'iPhone 13 mini.*

| Chantier | Modèles et effets | Son |
|---|---|---|
| 2 | Le message « Tu y penses », l'étiquette « déjà en poche », la ligne de la clé dans la fiche | Un son court et chaleureux (synthétisé) |
| 3 | Les icônes de tous les objets nouveaux | — |
| 4 | La carte à deux routes | — |
| 5 | Récupérateurs de 5 et 10 L, marmite norvégienne, grille du foyer de cuisine | — |
| 6 | Abri fermé, coffre cerclé, râtelier, établi à étau, torche plantée et sa lumière, marteau remmanché | — |
| 7 | Enclume au foyer, bac de trempe en auge, banc solaire, pédalier générateur | L'alternateur qui ronronne |
| 8 | La fourche à foin en main | — |
| 9 | Le geste au meuble, l'étoile qui s'ajoute dans le sac | — |
| 10 | L'enclume et le sac de charbon, le petit alternateur, la voiture éventrée, les clés de L1A en place | — |
| 11 | Le gué (modèle `halte-gue`), la berge à glaise, les joncs, l'eau du radier | Ambiance de l'eau : session musique ; radier et câble : synthétisés |
| 12 | Le Moulin (modèle `moulin`), sacs de jute, tonneaux, étau, fourche, if | Ambiance du bief : session musique |

---

## 8. Ce qui reste hors de la 0.8 (rappel)

- Le niveau 2 tout entier (lieux, clés, Raboter et Souder, le mélange des routes, C12).
- Les Éteints évolués (le casque et les autres), et leur résistance qui suit les bandes (×1,7 à L2 selon l'étude).
- Le relais d'armes, les munitions, les caractéristiques selon les ennemis.
- Le niveau 3 (trempe à l'huile, arbalète lourde, noix à roulement…).
- Fendre et le bois vert.
- Le panneau Examiner détaillé complet (sauf décision contraire, Q-0.8-17).

---

## 9. Les questions encore ouvertes

*« Rec. » : ma recommandation. ⛔ : bloque un chantier tant qu'elle n'est pas tranchée.*

| # | Question | Rec. | Chantier |
|---|---|---|---|
| **Q-0.8-1** ✅ | L'enclume de dépanneur donne ★★ (P1) ; son repli, « une grosse pierre plate », donne aussi ★★. Que gagne-t-on à aller chercher l'enclume ? | La pierre plate donne **★** (un objet de fortune donne le niveau 1) ; l'enclume, ★★ **Décidé (2026-10-10) : oui — la pierre plate donne ★, l'enclume ★★.** | 7  |
| **Q-0.8-2** ✅ | La hachette : au **foyer de forge** (★★ à H1, K13, et la ligne d'armes du tableau) ou à la **forge ventilée** (le tableau des meubles, `recettes-par-construction.md` Q7) ? | Au foyer de forge, à ★★ : la grille et les bandes la placent à H1 ; la hache et le glaive restent à la forge ventilée **Décidé (2026-10-10) : oui — la hachette au foyer de forge, à ★★.** | 7, 13  |
| **Q-0.8-3** ✅ | L'arbalète ★★★ (arc d'if) : la grille la renvoie au niveau 2, avec quel moyen ? (Q-B1b : l'établi de menuisier, L2B.) En 0.8, elle ne s'obtiendrait que par la maîtrise | Oui, Q-B1b : l'arc d'arbalète en if demande l'établi de menuisier ; en 0.8, grisé « plus tard » **Décidé (2026-10-10) : oui — à voir plus tard ; en 0.8, l'arbalète ★★★ est grisée « plus tard ».** | 7, 8  |
| **Q-0.8-4** | L'arc simple ★★★★ placé à L1 (K54) : par quel moyen l'obtient-on seul, sans la maîtrise ? | Par la maîtrise seulement, comme la matraque de fortune ★★ ; corriger K54 en « maîtrise » | 8 |
| **Q-0.8-5** ✅ | La masse (L1A, sans étoiles, 2,5, passe le casque) bat la matraque ★★ sur le terrain de l'électrique : la passer au niveau 2 (Q-B4) ? En 0.8, il n'y a pas de niveau 2 | Oui : la retirer de la Coopérative en 0.8 ; on la remettra dans un lieu du niveau 2. Celle qu'on a reste **Décidé (2026-10-10) : pas grave, c'est une arme trouvée — la masse reste à la Coopérative.** | 10  |
| **Q-0.8-6** | La lance commune (0,7 décidé, Q-B5) et la lance forgée (sans étoiles, K25) : on les garde ainsi et on mesure au test de jeu ? | Oui, mesurer d'abord | 8, 14 |
| **Q-0.8-7** | Les incohérences qui restent dans les valeurs « proposées » des armes hors de la 0.8 (aiguillon ★★★★, matraque ★★★★★, arbalète lourde, §10.2 d'`armes-par-niveau.md`) : on les laisse au plan du niveau 2 ? | Oui | — |
| **Q-0.8-8** | La citerne de 60 L déjà posée chez un joueur : on la garde telle quelle (« héritée », non rebâtissable), ou on la convertit en récupérateur à seau de 10 L en rendant la différence ? | La garder telle quelle : rien n'est détruit | 5 |
| **Q-0.8-9** | La forge ventilée et la réserve couverte déjà posées : elles gardent leurs effets (★★★, 400 kg) ? | Oui | 6, 7 |
| **Q-0.8-10** | La quête « La mise d'acier » (hachette ou hache) : on la met en pause « plus tard », ou on la réécrit pour la hachette au foyer de forge (selon Q-0.8-2) ? | La réécrire pour la hachette | 13 |
| **Q-0.8-11** | La quête « Un vrai repas » : les plats permis sont les pommes cuites (feu de camp) et la poêlée (foyer de pierres, Dakota) ; la volaille aux cèpes attend le four. On garde le texte « pommes cuites, ou une poêlée » ? | Oui | 13 |
| **Q-0.8-12** | Le prix des clés de L1 au Comptoir, après une première visite : environ deux allers-retours de travail, en stock limité (`avis-game-designer.md` Q4) ? | Oui ; le chantier 10 propose les chiffres | 10 |
| **Q-0.8-13** | Le mot « soufflet » est réservé à la clé de la forge ventilée (NOMS). Le code a un « soufflet à manivelle » ⚙️ (accessoire du pédalier) et le « soufflet double » de la forge ventilée. Comment renommer l'accessoire ⚙️ ? | « Ventilateur à manivelle » | 7, 15 |
| **Q-0.8-14** | La pièce de famille personnelle à la station : elle **revient** pour son joueur (s'il la perd ou la vend) ? Au bout de combien ? | Oui, au bout de 24 h | 10 |
| **Q-0.8-15** | Le vétéran qui saute le tutoriel : il doit quand même aller à H1A pour sa pièce ? | Oui ; le carnet le lui dit d'emblée (« Ta famille t'attend à la station ») | 2, 13 |
| **Q-0.8-16** | L'indice passe au second temps après une visite du bon lieu sans la clé, **ou** après combien de temps de jeu ? | 45 min | 2 |
| **Q-0.8-17** | La fiche Examiner : la 0.8 n'ajoute que les indices à la fiche d'installation, ou elle livre le panneau détaillé de `examiner-detaille.md` (`commun/src/fiches.ts`) ? | Les indices seulement ; le panneau détaillé dans une version à part | 13 |
| **Q-0.8-18** | L'ordre de la fin du tutoriel : … la saisie, **la carte**, **la famille**, la nuit ? Ou la nuit avant la carte ? | La saisie, la carte, la famille, la nuit : la première nuit se passe avec le premier meuble de famille | 13 |
| **Q-0.8-19** | « S'installer » au niveau 1 : deux portes ouvertes à la fois (une par route), ou une seule, celle de la route qu'on prend en premier ? | Deux à la fois : le joueur choisit sa route | 13 |
| **Q-0.8-20** | La matraque électrique ★ (module au flash) : on la garde, à 1,0 et 60, sous la ★★ ? | Oui (C2, déjà décidé dans les chiffres) | 8 |
| **Q-0.8-21** | Les qualités Raboter et Souder : les déclarer dès la 0.8 (sans usage), pour éviter une migration plus tard ? | Oui, dans le type seulement | 3 |
| **Q-0.8-22** | Les goulets du gué : le bac à câble coûte-t-il quelque chose (le panneau dit « 2 wotts — pas de nuit ») ? Le radier ralentit-il, mouille-t-il ? | Le bac : gratuit, lent, pas de nuit ; le radier : lent, et l'on n'y court pas | 11 |
| ~~Q-0.8-23~~ | ~~Le danger du gué et du Moulin~~ | **Réglée (v0.2)** : le gué garde les 11 Éteints du modèle, comme la station ; le Moulin en a 18 à 24 (B17) | 11, 12 |
| **Q-0.8-24** | La vue par pièce du Moulin : on attend l'export des portes par la session « bâtiments », ou on les relève dans le jeu ? | Demander l'export tout de suite ; relever à la main si elle n'a pas répondu à la vague 3 | 12 |
| **Q-0.8-25** | Les noms affichés : « Le Gué-aux-Saules » et « Le Moulin à eau » (ou « La Minoterie du Gué », l'enseigne du modèle) ? | « Le Gué-aux-Saules » et « Le Moulin du Gué » : le lien entre les deux se lit sur la carte | 4 |
| **Q-0.8-26** | Le Book 25 §2.5 (« ★★★ seul, en s'y mettant ») contredit la grille (★★ jusqu'au niveau 1, ★★★ à L2). On réécrit la règle d'or avec la grille ? | Oui (chantier 15) | 15 |
| **Q-0.8-27** ✅ | La page d'administration (chantier 16) : quelle adresse source le Pi voit-il pour un poste du réseau 192.168.1.0/24 (la vraie adresse, ou celle de la box si elle traduit les adresses entre le réseau local et la DMZ) ? | La mesurer au premier déploiement (le journal de la page l'affiche) avant de figer la liste blanche  **Réponse du porteur (2026-10-10) : simple routage entre le réseau local et la DMZ, sans traduction d'adresses : le Pi voit la vraie adresse 192.168.1.x. La liste blanche 192.168.1.0/24 tient.** |
| **Q-0.8-28** ✅ | La DMZ de la box est-elle une DMZ « hôte exposé » (tous les ports du Pi ouverts sur Internet) ? Si oui, une page sans mot de passe n'est protégée que par la liste blanche | Ajouter tout de même un mot de passe simple ou un jeton dans l'adresse, saisi une fois sur le poste du porteur ; sinon, vérifier sur la box que seul le port 1234 est ouvert  **Réponse du porteur (2026-10-10) : la box ne publie que des ports (le 1234), pas des hôtes. Pas de mot de passe : la page reste sans authentification, protégée par le port non publié et la liste blanche.** |

**Une note sur les sources.** Le bloc `familles` de `progression-par-ingredients-page.json` (et le §4 du `.md` v5) dit encore que l'enclume donne ★★★ et que le sac donne « les 4 premiers charbons ». Les décisions plus récentes l'emportent : **★★** (P1, Q-A6) et **4 charbons** (I23). La question V5-3 est donc réglée.

---

## 10. Analyses en cours, à intégrer

> **À amender.** Chaque étude qui tourne encore a sa ligne ici. Quand elle rend ses conclusions et que le porteur a décidé, on met à jour ce plan **avant** de lancer les chantiers concernés, et la ligne passe à « intégrée ».

| Analyse | Ce qu'elle doit trancher | Chantiers touchés | État |
|---|---|---|---|
| **Le meilleur couple H1B / L1B** (`candidats-h1b-l1b-et-budget.md`, question 1) | Quel couple de lieux porte le mieux « la pierre, la glaise et la rive » puis « le couchage, le stockage, l'établi » | 4, 10, 11, 12, 13, 15 | **Intégrée (v0.2)** : le **Gué-aux-Saules** et le **Moulin à eau** sont retenus (25/27, devant la digue des Roselières, 24/27, pressentie pour H2B). Chantiers 11 et 12 |
| **Le budget de pierre et de bois** (même étude, question 2) | Les quantités qui tiennent tout le niveau 1, famille par famille | 5, 7, 10, 11, 12, 13, 14 | **Intégrée (v0.2)** : B1 à B17 décidés, sauf B10 (refusée) et B15 (plus tard) ; §2.7. Restent à régler au test : les 6 h de retour, les 10 bûches par joueur, le stock du Comptoir |
| *(À compléter)* | *Les autres analyses en cours, à ajouter ici par la session qui les mène.* | — | — |

---

## 11. Le récapitulatif des chantiers

| # | Chantier | Vague | Effort | Dépend de |
|---|---|---|---|---|
| 1 | Le moteur des constructions | 1 | L | — |
| 2 | Le dévoilement et la migration | 1 | L | 1 (types) |
| 3 | Le catalogue des objets | 1 | M | — |
| 4 | La carte à deux routes | 1 | M | — |
| 5 | Le feu et l'eau | 2 | M | 1, 3 |
| 6 | Le couchage, le stockage, l'établi, la lumière | 2 | M | 1, 3 |
| 7 | Les meubles de famille | 2 | L | 1, 3 |
| 8 | Les armes : chiffres, plafonds, garde-fou | 2 | L | 1 |
| 9 | Faire évoluer et réparer une arme | 2 | M | 1, 7, 8 |
| 10 | Le butin de la maison, de H1A et de L1A | 3 | M | 3, 4, (5 à 7) |
| 11 | H1B, le Gué-aux-Saules | 3 | L | 3, 4, 10 (mécanisme) |
| 12 | L1B, le Moulin à eau | 3 | L | 3, 4, 10 (mécanisme) |
| 13 | Le tutoriel, les quêtes, l'aide et la fiche | 4 | L | 5 à 12 |
| 14 | L'équilibrage, le rythme, les tests de jeu | 4 | M | 5 à 12 |
| 15 | Les books et la bible | 4 | M | les décisions |
| 16 | La page d'administration sur le réseau local (P-014) | 1 | M | — |

**Total : 7 L et 9 M**, soit environ **47 jours-agent** au milieu de la fourchette (S ≈ ½ à 1 jour, M ≈ 1 à 3, L ≈ 3 à 5).
