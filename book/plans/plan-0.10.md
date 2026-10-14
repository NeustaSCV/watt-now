# Plan de développement — version 0.10 : le niveau 2, sur la côte

*Version du plan : v0.2 · 2026-10-14 · **Statut : décidé, pas encore codé.***

*v0.2 (2026-10-14) : les neuf questions tranchées en suivant toutes les recommandations (§9). **Les murs et les sols sortent en 0.10.1** (le chantier E passe au §8) ; **le banc solaire suit le soleil** (chantier D) ; les fluides du Noyé donnent une nausée de 30 s ; le péage : une caisse et une voix ; la marée basse la moitié du temps (cycle de 12 min) ; la tête du robot portée à deux mains ; au phare de jour, on prépare.*

*v0.1 (2026-10-14) : le plan rédigé.*

*Code de départ : la **0.9** (déployée le 2026-10-14). Les numéros de ligne cités sont ceux de la 0.9, relevés le 2026-10-14 : à revérifier au lancement. Source des règles de jeu : [`niveau-2.md`](niveau-2.md) (toutes les décisions N2-…, MS-…), la [notice](notice-nouveau-niveau.md) et la bible (`book/bible/progression-et-equilibrage.html`, version 5.4).*

---

## 0. En bref

- **Ce que livre la 0.10** : le **niveau 2**, sur la côte.
  - **Quatre lieux** : la **route du pont** (H2A) et le **Grand Hôtel des Flots** (L2A) sur la route A ; la **corniche du Cap Rouge** (H2B) et le **phare du cap** (L2B) sur la route B ; les mêmes distances sur les deux routes.
  - **Deux scénarios d'accès** propres aux lieux, au lieu d'une clé qui ouvre une porte : à l'hôtel, **« le check-in »** (le courant à la borne, le sourire du robot ensablé, la carte de l'ascenseur) ; au phare, **« le feu et le cargo »** (rallumer la lanterne la nuit, tenir la tour, le cargo de l'Abondance qui s'échoue dans la crique).
  - **Les dix meubles du niveau 2** et leurs dix objets-clés, faits de **récupération** (le tube d'aluminium, nouveau) ; **plus aucun repli**, le Comptoir à la place.
  - **Huit meubles nouveaux** : le cuiseur solaire et les bacs de tri pour tous ; le creuset 🔥 ; la rampe de LED et la batterie de cellules ⚡ ; la charrette à bras, le moulin de jerricans et l'arbalète de garde ⚙️ (les Mécaniste favorisés).
  - **Les armes ★★★**, le cranequin léger, deux armes trouvées (le pied de guéridon, le harpon), la fourche à 2,3.
  - **Deux Éteints nouveaux** : le **Noyé** (il crève en mourant) et l'**Ensablé**.
  - **Le banc solaire suit le soleil** (rien la nuit ni sous la pluie, la même moyenne par beau jour) : le moulin de jerricans prend le relais par mauvais temps.
  - **Les murs et les sols** sortent en **0.10.1** (Q-0.10-1).
- **13 chantiers en 4 vagues** (le chantier E, les murs, passe en 0.10.1), plus les **livraisons de la session « bâtiments »**, qui passent avant (§1.3).
- **Estimation** : **≈ 39 jours-agent**, soit **une journée et demie en temps réel**, agents en parallèle (§7).
- **Les neuf questions sont tranchées** (§9).

---

## 1. Le périmètre

### 1.1 Ce qui entre

Tout ce qui est décidé dans `niveau-2.md` (✅), c'est-à-dire :

| Domaine | Décisions |
|---|---|
| Matières | N2-01 à N2-06 (la récupération, le tube d'aluminium et ses sources, l'échelle et la chaise de camping) ; N2-61 (le fil dentaire courant au niveau 2) |
| Meubles du niveau 2 | N2-07 à N2-17 (C12 fermée ; les matériaux de récupération) ; N2-18 à N2-29 (délais de retour, noms, le pin tombé de la corniche) |
| Objets-clés | **pas de repli, à aucun niveau** ; le Comptoir toujours approvisionné après une 1ʳᵉ visite du lieu ; le fer à souder sans version pauvre |
| Armes | N2-30 à N2-39 (chiffres ★★★, arc d'if à l'établi à étau, cranequin léger, manches de caoutchouc, tubes, LED, empennage de plastique) ; N2-Q1 (l'arbalète lourde reste au niveau 3) ; N2-49, N2-62 (pied de guéridon, harpon) ; N2-66 (fourche à 2,3) |
| Meubles nouveaux | N2-40, N2-41, N2-43 à N2-48 ; N2-Q3 (les communs après la 1ʳᵉ visite d'un lieu du niveau 2), N2-Q4 (le vent déduit du temps), N2-Q5 (l'arbalète de garde ne tire pas sur les joueurs) |
| Lieux | §9 de `niveau-2.md` (les deux scénarios), N2-54 à N2-60 (les haltes, la bobine, les couvertures polaires, les péages de 12 wotts), N2-Q8, N2-Q10, N2-Q11 |
| Éteints | N2-63 à N2-65 (le Noyé, le nombre sans minimum sous le plafond de l'iPhone), N2-Q12, N2-Q13 (l'Ensablé) |

### 1.2 Ce qui n'entre pas

- **Les murs et les sols** (MS-01 à MS-09) : **en 0.10.1** (Q-0.10-1, §8).
- Le **palan à poulies** (N2-Q6, avec les murs plus tard) ; le **toit** et le **calcul thermique** des pièces (Book 10 §7.1).
- Les **plats du four** (le pain, la cuisson seule : 0b) ; la **hutte** et le **poêle** (0b).
- Les **lapins chassables**, le **boyau** (0b) ; le **piège-cage à lapin** (0b).
- L'**infection** au sens du Book 05 (voir Q-0.10-4) ; le **relais d'armes**, les **munitions**, les **caractéristiques** d'armes (« à venir »).
- Le **combat entre joueurs** (`duel-entre-joueurs.md`).
- Le **niveau 3**.

### 1.3 Ce qui doit être livré avant (la session « bâtiments »)

Une demande à écrire dans `.claude-travail/propositions/demande-batiment-niveau-2.md`, à faire **dès la validation du plan** (les chantiers H à K en dépendent) :

| Modèle | Ce qu'il faut ajouter ou changer |
|---|---|
| `grand-hotel` | **Un étage** (le couloir, des chambres dont la **chambre 7**, la **suite**, la lingerie et ses draps) ; la **cage de l'ascenseur** praticable (en bas, à l'étage) ; le **balcon effondré** franchissable dans un seul sens (de l'étage vers la dune) ; le **robot-serveur ensablé** dégageable ; la **borne** « Check-in par sourire » ; pièces et portes pour la vision par pièce ; points de fouille et d'Éteints (clients couchés, l'Ensablé, les Noyés de la piscine) |
| `phare` | **La crique et l'épave du cargo**, en deux états (avant : la mer vide ; après : le porte-conteneurs éventré sur les rochers, des conteneurs ouverts qu'on visite) ; l'**escalier coupé à 3 m** et la **colonne des poids** ; la **cuve à pompe** ; la **corne de brume** et son compresseur ; la **rampe du canot** au tronçon effondré (sens unique) ; le **chemin des douaniers** par où montent les Éteints |
| `halte-route-pont` | **La marée** : les bancs de vase découverts (marée basse) ou sous l'eau (marée haute), avec les trottinettes et les caddies échoués ; la **mobylette** dans la vase ; la **chicane** du péage, et l'endroit où l'on dépose son dû |
| `halte-corniche` | Le **pin d'Alep tombé** (le tas de bois personnel) ; la **barricade du tunnel** (le péage) ; les chambres du Panoramique fouillables |
| Tous | Les budgets du Book 17 : **≤ 60 000 triangles, ≤ 40 appels de dessin, ≤ 8 lumières par carte** ; des noms de pièces ; aucune « clé » visible d'un autre niveau dans le décor (R15) |

Dans le code, `client/src/rendu/lieu-vide.ts` permet de brancher un lieu **avant** son modèle : les chantiers A et H à K avancent avec lui, puis le modèle est importé (`npm run batiments:importer`, liste `A_COPIER`).

---

## 2. Ce qu'on a trouvé dans le code (0.9)

### 2.1 Ajouter un lieu : rien n'est centralisé

- `commun/src/lieux.ts` : `LieuId` (l.17, six lieux), `ORDRE_ROUTE` (l.26), `TRONCONS` (l.35), `ETAPES_LIEUX` (l.48, le commentaire prévoit le niveau 2), `LIEUX` (l.558), `ZONES` et `SORTIES` (l.645). `EtapeMonde` (`lignees.ts` l.25) connaît déjà H2A, H2B, L2A et L2B.
- Un lieu personnel = un plan (`moulin.ts`), un milieu (`milieu-moulin.ts`), des Éteints (`eteints-moulin.ts`), une vue (`vue-lieux.ts`), un semis (`semis.ts`, `semis-lieux.ts`), des ressources (`terrain.ts`), une fouille (`vestiges.ts`), un lieu vivant serveur (`serveur/src/moulin.ts`, sur `LieuVivant`), un rendu client.
- **`serveur/src/joueur.ts` a une quinzaine de branchements écrits en dur sur `"moulin"`** (constructeur l.404-475, `vivantRouteB` l.400, bienvenue l.592, pause l.610, `voyager` l.2076, `arriver` l.2119, `partir` l.2140, portes l.2482-2503) ; côté client, `main.ts` (`zoneIci` l.130, `montrerDecor` l.134, et six autres endroits), `carte.ts`, `carte-vue.ts`, `interaction.ts`, `audio.ts`, `bruiteur.ts`, `aide-contenu.ts`.
- **Conséquence** : ajouter quatre lieux par copie multiplierait ces branchements par cinq. Le chantier A crée d'abord un **registre des lieux**.

### 2.2 Les lieux personnels, le sens unique, la vision par pièce

- La réinitialisation à 24 h existe (`serveur/src/moulin.ts` : `EtatMoulin`, `aReinitialiser`, calculée à l'entrée, lieu vide ; idem `cooperative.ts`). L'état est en base par compte (`moulin:<compte>`).
- Le **sens unique** existe : une `Sortie` avec `sansArrivee` (le halage du Moulin) ; le serveur place toujours l'arrivée par `entreesDe()`.
- La **vision par pièce** existe (`commun/src/vue.ts`, `PlanVue`, `voit`, `facteurSon`).
- Un **état de portes** change la zone (`zoneMoulin(portes)`, grille en cache) : c'est le moyen d'ouvrir la crique après le cargo, ou l'étage après l'ascenseur.

### 2.3 Les Éteints

- Variantes : `VarianteEteint = "rampant" | "equipe" | "magasinier" | "mecanicien"` (`eteints.ts` l.70) ; dormeur et errant sont des états.
- **Pas de points de vie** : les dégâts se comparent à `RESISTANCE_TORSE = 3` (`combat.ts` l.424), + 1 pour l'Équipé. Le Noyé aura **sa** règle (« un Éteint est un Éteint » : on ne touche pas aux autres).
- **Pas de recherche de chemin** : `deplacer()` glisse le long des boîtes, sans contourner (Book 06 §2.1) ; seul `Milieu.passage()` vise la porte suivante. **Un mur posé en terrain ouvert ne serait pas contourné** (voir Q-0.10-3).
- **Pas d'infection** : la morsure aggrave une blessure, et seule l'intoxication par champignons existe (voir Q-0.10-4).
- L'odeur et la lumière attirent déjà (`signature.ts` : `Stimulus`, `FEU_ODEUR`…) : le phare allumé s'appuie dessus.

### 2.4 La construction

- `emplacement.ts` : grille de **50 cm**, portée 3 m, règle partagée serveur et fantôme client, écrite pour le terrain.
- **Aucun mur posable** ; **les installations ne bloquent pas le joueur** (`ZONE_TERRAIN.obstacles = []`). `murs.ts` ne règle que les coups à travers un obstacle. Les murs demandent d'injecter leurs boîtes dans la zone du terrain, côté serveur et client (`deplacement.ts`, `heurte`, `creerGrille`).

### 2.5 Les meubles, l'énergie, le Comptoir

- Lignées : `LIGNEES_INSTALLATIONS` (`lignees.ts` l.396), `Etape` (l.84 : `couts`, `cle`, `aVenir`), **`RepliCle` (l.49) et `replis.ts`** à retirer.
- Énergie : `energie.ts` (`TypeBatterie`, `MEUBLES_A_BATTERIES`) ; **le banc produit `panneau_wh_jour` au calendrier, sans regarder le soleil, la nuit ni la météo** (`productionPanneau`, l.94). La météo (`meteo.ts`, `NUAGES`) et l'heure (`temps.ts`, `estNuit`) existent (voir Q-0.10-6).
- Comptoir : `LIEU_DES_CLES` (`economie.ts` l.39) et `etalPour` testent déjà `faits["visite:<lieu>"]` ; `STOCK_DE_BASE` (l.172) met **1** de chaque clé du niveau 1, avec réassort lent : à changer en « toujours disponible ».

### 2.6 Les armes, le démontage, les messages, les mesures

- Armes : `armes/*.ts`, `combat.ts` (`ARMES`, `EtapeArme` a déjà `L2`) ; tir : `tir.ts` (`rearmerAvec`, résolu par `mecanique.ts` `rearmement()`). Une arme trouvée = une ressource de lieu qui `donne` l'arme, `REPOUSSE_MS = null` (la fourche).
- Démontage : `DEMONTAGE` (`vestiges.ts` l.1159) et `DEMONTAGE_LOT2` ; fouille : `FAMILLES_PAR_LIEU`, `EN_PLUS_PAR_LIEU`, `CLES_RARES` et `EtapeButin` (H1A à L1B seulement : à étendre).
- Messages : union `MessageClient` / `MessageServeur` ; un geste nouveau = le type, la liste blanche de `serveur/src/controle.ts`, le `case` de `joueur.recevoir`, l'envoi et la réception client. L'**échange entre joueurs** existe (`echange.ts`).
- Mesures : `npm run equilibre` (`ETAPES_EQUILIBRE` à étendre à L2), `npm run rythme` (lieux en dur), `node scripts/banc-charge.ts` (ni le gué ni le Moulin), `?mesure=1`.

---

## 3. Les règles de jeu que la 0.10 met en œuvre

*Le détail est dans `niveau-2.md` ; ce paragraphe ne fixe que ce que les chantiers doivent partager.*

### 3.1 Les dix évolutions et leurs objets-clés

| Lieu | Évolution | Objet-clé (revient) | Matériaux | Outil |
|---|---|---|---|---|
| L2A (hôtel) | Réserve couverte (400 kg) | tôles ondulées (4 j) | 4 tubes d'aluminium, 1 rouleau de fil de fer, 1 poignée de clous | Couper 1, Marteler 2 |
| | Abri doublé (sommeil × 1,6) | couvertures de laine (24 h) | 1 bâche, 4 chiffons | Couper 1 |
| | Lanterne fixe (14 m) | lanterne-tempête (4 j) | 1 tube, 2 chutes d'aluminium, huile | Couper 1 |
| | ⚡ Poste de montage | fer à souder (4 j) | 1 fil de cuivre, 1 résistance, 1 aimant, 2 plastique | Souder 1 |
| | ⚙️ Roulements montés | boîte de 3 roulements (4 j) | — | Serrer 2 |
| L2B (phare) | Four de terre (bois × 0,5) | porte de four en fonte (4 j) | 4 glaises, 2 pierres, 6 bouteilles en verre | Marteler 1 |
| | Récupérateur à jerrican (20 L) | jerrican de 20 L (24 h) | 2 caoutchouc, 1 plastique | Couper 1 |
| | Établi de menuisier | rabot (4 j) | 2 bûches, 1 barre, 1 poignée de clous | Raboter 1 |
| | Cloche d'alarme (40 m, réveille) | cloche de bronze (4 j) | 2 tubes, 1 rouleau de fil de fer, 1 petit ressort | Marteler 1 |
| | 🔥 Forge ventilée (★★★) | soufflet de forge (4 j) | 3 pierres, 2 glaises, 1 barre | Marteler 2 |

- **Sources d'un objet-clé** : sa place garantie dans son lieu ; la chance (rare à H2A, H2B et dans l'autre L2 ; plus courante au niveau 3) ; le **Comptoir**, toujours disponible après une 1ʳᵉ visite du lieu. **Pas de repli.**
- **Leur place dans les lieux** : Q-0.10-2.

### 3.2 Les murs et les sols (pour la 0.10.1, rappel)

- Un mur fait **1 m**, d'une intersection à la voisine de la **grille de 1 m** ; les meubles gardent leur grille de 50 cm. On pose **sur son terrain seulement**.
- **Mur de branches** (6 branches, 1 ficelle, Couper 1) sur le sol nu ou sur un sol ; à hauteur d'épaule. **Claie** (6 branches, 1 corde) à la place d'un mètre de mur de branches.
- **Plancher** (3 planches fendues, Marteler 1) et **sol de pierres** (4 pierres, Creuser 1), par m². **Mur de planches** (4 planches fendues, Marteler 1), ≈ 2,2 m, au bord d'un carré qui a un sol ; **porte de planches** (la recette du menuisier) à la place d'un mètre. Planches rabotées : + 50 % de solidité.
- Un mur **arrête les joueurs et les Éteints** ; les Éteints **s'acharnent dessus sans le contourner** (Q-0.10-3) : le mur de branches cède en ≈ 20 s, celui de planches tient plus longtemps. **Meubles sans feu** sur un sol ; **meubles à feu** sur la terre nue seulement.
- Démonter rend la moitié des matériaux naturels ; les éléments sont dessinés en lots ; ≤ 200 par terrain, à mesurer.
- Apparition : le mur de branches et la claie après la 1ʳᵉ visite d'un lieu du niveau 1 ; le reste après la 1ʳᵉ visite d'un lieu du niveau 2.

### 3.3 Les deux scénarios (rappel des étapes que le serveur doit garantir)

**L'hôtel, « le check-in »** : (1) le courant à la borne (la batterie du panneau de la promenade, ou un pack) ; (2) dégager le robot-serveur (Creuser) et porter sa tête devant la borne, qui remet la **carte de la chambre 7** ; (3) l'ascenseur monte à l'étage (la carte en main) ; (4) les objets-clés dans les chambres et la suite ; (5) **sortie à sens unique** par le balcon effondré ou les draps noués ; (6) au bout de 24 h, la carte expire, le robot reprend sa place.

**Le phare, « le feu et le cargo »** : (1) monter (l'escabeau posé sous l'escalier coupé, ou la colonne des poids) ; (2) remonter du pétrole et un prisme ; (3) **allumer, la nuit seulement** : la lumière attire les Éteints du chemin des douaniers, il faut tenir 2 à 3 min réelles ; **la corne de brume** (le compresseur réparé) les détourne vers la falaise ; (4) le **cargo** arrive, s'échoue, ses **conteneurs** s'ouvrent : la partie du fond ; (5) **sens unique** par la rampe du canot ; (6) au bout de 24 h, l'épave est partie, un autre cargo viendra.

### 3.4 Le péage des survivants

- À la chicane du pont et à la barricade du tunnel : **12 wotts d'objets** par personne, au **prix du Comptoir** ; les ordures ne comptent pas ; on choisit ce qu'on donne. **À l'aller seulement**, une fois par voyage.
- **Une caisse au pied du poste de guet** et une **voix** d'en haut (« Douze, et tu passes. ») ; on y dépose les objets, la chicane s'ouvre pour soi seul ; l'écran montre le compte ; un message fermé par un bouton (R48) (Q-0.10-5).

### 3.5 Le Noyé et l'Ensablé

- **Le Noyé** : un corps gonflé ; ≈ 0,4 m/s ; **un coup au torse ne le met pas à terre** (sa masse) : la tête, ou les jambes (il devient rampant). **Quand il meurt, il crève** : à moins de 1,5 m, les **fluides** — une **nausée de 30 s** (l'endurance revient deux fois moins vite, Q-0.10-4) — et une **odeur** qui attire les Éteints pendant 1 min. Au bord de l'eau, dès le niveau 2 : la piscine de l'hôtel, la crique du phare, la vase de la route du pont.
- **L'Ensablé** : un rampant dormeur enfoui dans la dune de la salle à manger, qui surgit quand on passe ; aucune règle nouvelle.
- **Le nombre d'Éteints** : réglé au parcours, sans minimum ; plafond = ce que l'iPhone 13 mini tient à **60 images par seconde** avec le plus d'Éteints visibles à la fois.

### 3.6 Le format des messages (fixé d'avance, pour que les chantiers avancent en parallèle)

| Message | Sens | Contenu |
|---|---|---|
| `payer_passage` | client → serveur | `{ t, passage: "pont" \| "tunnel", objets: Inventaire }` ; refusé si la valeur < 12 wotts ou si déjà payé pour ce voyage |
| `passage` | serveur → client | `{ t, passage, ouvert: boolean, du: number }` (le reste à payer) |
| `scene` | serveur → client | `{ t, lieu, scene: "cargo" \| "ascenseur" \| "corne", etape: string, debut: number }` : le client joue l'animation à l'heure dite |
| Verbes nouveaux (`interagir`) | client → serveur | `brancher`, `degager`, `presenter`, `appeler_ascenseur`, `allumer`, `sonner_corne`, `remplir`, `payer` |

---

## 4. Les chantiers

**Effort** : **S** = une demi-journée à un jour ; **M** = un à trois jours ; **L** = trois à cinq jours de travail d'un agent.

### Vague 0 · Le socle (avant tout le reste)

**Chantier A · Le registre des lieux et la carte** (**M**)

- **Contenu** :
  - un **registre** dans `commun/` : chaque lieu y déclare sa nature (halte partagée ou lieu personnel), sa zone, ses sorties, son plan, son milieu, ses Éteints, son butin, son semis, sa réinitialisation ; côté serveur, une fabrique de `LieuVivant` par lieu ;
  - **les branchements en dur sur `"moulin"`** de `joueur.ts`, `main.ts`, `carte.ts`, `interaction.ts`, `audio.ts`, `bruiteur.ts` passent par le registre, **sans changer le comportement** du gué, du Moulin, de la station et de la Coopérative ;
  - **les quatre lieux** (`route_pont`, `corniche`, `grand_hotel`, `phare`) déclarés avec `lieu-vide.ts` comme rendu provisoire ; `ETAPES_LIEUX` complétée (H2A, H2B, L2A, L2B) ; `TRONCONS` : **L1A → H2A 3 km, H2A → L2A 2 km ; L1B → H2B 3 km, H2B → L2B 2 km** (mêmes distances, B16) ;
  - la carte : quatre lieux de plus, dévoilés comme ceux du niveau 1 ; aucune fiche de lieu qui divulgue son contenu.
- **Fichiers** : `commun/src/lieux.ts`, un nouveau `commun/src/registre-lieux.ts`, `serveur/src/joueur.ts`, `serveur/src/monde.ts`, `client/src/main.ts`, `client/src/carte.ts`, `client/src/rendu/carte-vue.ts`, `client/src/interaction.ts`, `client/src/son/audio.ts`, `client/src/son/bruiteur.ts`.
- **Tests** : tous les tests actuels passent **sans modification** (la non-régression est le critère) ; on voyage du terrain au phare et à l'hôtel (lieux vides) ; `etapeVers` donne les mêmes temps de trajet sur A et B.

### Vague 1 · Les règles, en parallèle

**Chantier B · Les matières, les objets-clés, le Comptoir, sans repli** (**M**)

- **Contenu** : l'objet **tube d'aluminium** ; les démontages qui en donnent (parasol, débroussailleuse, trottinette d'enfant, perche à selfie) ; les vestiges **échelle en aluminium** (4 tubes) et **chaise de camping** (2 tubes, 1 chiffon) et leurs lieux de fouille ; le **fil dentaire** rare au niveau 1 ; les **dix objets-clés** (objets, icônes, `examen`, poids, wotts) ; le **jerrican percé** (I5) s'il n'existe pas ; **suppression de `RepliCle` et de `replis.ts`** (les replis du niveau 1 aussi) ; le **Comptoir** : `LIEU_DES_CLES` étendu aux dix objets-clés, et un objet-clé **toujours disponible** après la 1ʳᵉ visite de son lieu (plus de stock ni de réassort pour eux) ; `EtapeButin` et `CLES_RARES` étendus (R-BUTIN).
- **Fichiers** : `objets*.ts`, `vestiges.ts`, `vestiges-lot2.ts`, `lignees.ts`, `replis.ts` (supprimé), `economie.ts`, `client/src/rendu/icones*.ts`.
- **Tests** : aucun repli n'est proposé nulle part ; un objet-clé du niveau 2 s'achète au Comptoir après la visite de son lieu, jamais avant, et ne manque jamais ; un parasol démonté donne un tube.

**Chantier C · Les dix meubles du niveau 2** (**M à L**)

- **Contenu** : les étapes `aVenir: "niveau 2"` deviennent jouables avec les coûts du §3.1 ; les qualités **Raboter** et **Souder** (le rabot, le fer à souder) ; les recettes de l'établi de menuisier (étagères, porte de planches, manches + 25 %) ; le **pack soudé de 24 Wh** (avec sa LED) au poste de montage ; les effets : réserve 400 kg, abri doublé × 1,6, lanterne fixe 14 m toute la nuit, cloche 40 m qui réveille, jerrican 20 L, four bois × 0,5, forge ventilée ★★★ sans pomper, roulements montés (− 30 % d'effort, + 30 % de Wh) ; les fiches (« tu y penses », indices : le type de lieu puis le lieu, jamais « clé »).
- **Fichiers** : `lignees.ts`, `recettes.ts` et `recettes/*.ts`, `energie.ts`, `sommeil-abri.ts`, `torche.ts`, `serveur/src/forge.ts`, `client/src/hud.ts` (fiches).
- **Tests** : chaque évolution se construit avec son objet-clé, le niveau d'avant posé et l'outil ; refusée sans l'un des trois ; les effets mesurés (sommeil, kg, portée de la lumière et de la cloche).

**Chantier F · Les armes** (**M**)

- **Contenu** : les chiffres ★★★ (K1–K56) vérifiés dans le code ; l'**arc d'arbalète en if** à l'établi à étau ; l'arbalète ★★★ **demande le cranequin léger** ; le **cranequin léger** (1 roulement, 1 chaîne, 1 barre ; au pédalier équipé des roulements montés ; réarme en 2 s) — le cranequin actuel garde l'arbalète lourde ; les matériaux de récupération (manches de caoutchouc, contacts soudés en tube, arbrier en tube, empennage de plastique) ; **le pied de guéridon** et **le harpon** (3,2, solidité 50, sans étoiles) ; **la fourche à 2,3** (et son test) ; `ETAPES_EQUILIBRE` étendu à L2.
- **Fichiers** : `armes/*.ts`, `tir.ts`, `mecanique.ts`, `recettes/mecanistes.ts`, `recettes/charbonniers.ts`, `recettes/voltaiques.ts`, `equilibre.ts`, `equilibre.test.ts`.
- **Tests** : `npm run equilibre --etape L2` : le garde-fou tient (R30), l'électrique sous 2 fois contre trois Errants à 15 m ; la ★★★ refusée sans cranequin léger.

**Chantier G · Le Noyé et l'Ensablé** (**M**)

- **Contenu** : la variante **`noye`** (vitesse, coup au torse sans effet de chute, jambes et tête comme les autres ; à la mort : l'éclatement, les fluides (une **nausée** de 30 s : l'endurance revient deux fois moins vite, Q-0.10-4), un stimulus d'odeur de 1 min) ; la variante **`ensable`** (un rampant dormeur caché, qui surgit à 2 m) ; leur rendu (corps gonflé ; silhouette sous le sable) et leurs sons.
- **Fichiers** : `eteints.ts`, `combat.ts` (`encaisser`), `signature.ts`, `client/src/rendu/variantes-eteints.ts`, `eteint.ts`, `client/src/son/bruiteur.ts`.
- **Tests** : un coup au torse ne fait pas tomber le Noyé ; il crève en mourant, l'odeur attire un Errant à 15 m ; un joueur à 2 m n'est pas touché, à 1 m oui.

**Chantier D · Les meubles nouveaux** (**L**, après B pour le tube)

- **Contenu** :
  - **cuiseur solaire** : bout l'eau et cuit un plat sans bois au soleil (1 L en ≈ 2 h de jeu), à moitié par temps voilé, rien sous la pluie ni la nuit ;
  - **bacs de tri** : démonter deux fois plus vite à moins de 3 m, une matière de plus un démontage sur trois ;
  - **creuset et moules** (accessoire de la forge ventilée) : 4 chutes d'aluminium → 1 **poulie** ou 1 **lingot** ;
  - **rampe de LED** : 20 m de lumière la nuit, ≈ 25 Wh par nuit, sur une batterie ;
  - **batterie de cellules** : ≈ 120 Wh à la base (`MEUBLES_A_BATTERIES`) ;
  - **charrette à bras** : + 100 kg roulés (comme la brouette, + 60) ;
  - **moulin de jerricans** : 10 à 20 W **quand il vente**, le vent **déduit du temps** (couvert et pluie : venteux ; voilé : un peu ; soleil : calme), au calendrier, même hors ligne ; avec une poulie, il entraîne la meule ou le tour ;
  - **arbalète de garde** : un piège qui tire un carreau (les dégâts de l'arbalète montée) sur l'Éteint qui coupe le fil, jamais sur un joueur ; réarmée au cranequin léger ;
  - **le banc solaire suit le soleil** (Q-0.10-6) : la production dépend de l'heure (rien la nuit) et du temps (moins par temps couvert, rien sous la pluie), avec la même moyenne de 80 Wh par beau jour ; `productionPanneau` prend l'heure et la météo ;
  - **apparition** : les meubles communs après la 1ʳᵉ visite d'un lieu du niveau 2 (`faits`) ; ceux des familles avec leur installation du niveau 2.
- **Fichiers** : `recettes.ts` et `recettes/*.ts`, `energie.ts`, `meteo.ts` (une fonction `vent()`), `serveur/src/electricite.ts`, `serveur/src/mecanique.ts`, `objets-metier.ts`, `serveur/src/joueur.ts` (portage, démontage), `client/src/rendu/installations.ts`.
- **Tests** : le banc ne charge rien la nuit ni sous la pluie, et 80 Wh sur un beau jour ; le cuiseur ne cuit pas la nuit ; le moulin produit sous la pluie et rien au soleil ; la batterie de cellules ne dépasse pas 120 Wh ; l'arbalète de garde ne tire pas sur un joueur ; la charrette porte 100 kg de plus.

### Vague 2 · Les lieux (après A ; les modèles quand ils sont livrés)

**Chantier H · H2A, la route du pont** (**L**)

- **Contenu** : le modèle importé (plan, milieu, vue, Éteints dont des Noyés dans la vase) ; le vrac du thème « électrique et atelier » (cuivre, résistances, cellules, lames de ressort, barres, huile) et la **bobine** sur le moteur hors-bord (et la mobylette) ; les fouilles (le fil dentaire de l'épicerie, couvertures **polaires**) ; les goulets (la brèche : un par un) ; **le péage** (§3.4, `payer_passage`) ; **la marée** (Q-0.10-7) : basse la moitié du temps, sur un cycle de 12 h de jeu (12 min réelles), au calendrier ; l'heure se lit sur l'échelle peinte du quai ; les bancs de vase fouillables à marée basse ; **la caisse du péage** au pied du poste de guet, et la voix d'en haut (Q-0.10-5) ; le semis.
- **Fichiers** : un nouveau `commun/src/route-pont.ts` (+ milieu, Éteints), son entrée au registre, `serveur/src/route-pont.ts` ou une halte générique, `client/src/rendu/route-pont.ts`, un module partagé `commun/src/peage.ts` (repris par I).
- **Tests** : le péage refuse 11 wotts, accepte 12, ne redemande pas au retour ; à marée haute, les bancs ne se fouillent pas.

**Chantier I · H2B, la corniche** (**M à L**)

- **Contenu** : le modèle ; les pierres en vrac (l'éboulement, les murets) ; **le pin tombé** = le tas de bois personnel (10 bûches, 6 h) ; le péage du **tunnel** (le module de H) ; l'éboulement (goulet) ; les fouilles (les chambres du Panoramique : fil dentaire) ; le semis.
- **Fichiers** : `commun/src/corniche.ts` (+ milieu, Éteints), registre, rendu client.
- **Tests** : le tas de bois est personnel et revient en 6 h ; le tunnel applique la même règle que le pont.

**Chantier J · L2A, le Grand Hôtel des Flots** (**L**)

- **Contenu** : le modèle (la façade, l'intérieur et **l'étage** livré) ; le scénario « le check-in » (§3.3) : brancher une batterie à la borne, dégager le robot (Creuser), porter **sa tête** **à deux mains** (8 kg : on ne frappe pas en la portant, Q-0.10-8), la présenter, recevoir la **carte de la chambre 7** ; l'**ascenseur** (scène `ascenseur`) change de zone ; l'étage : les objets-clés (Q-0.10-2), les clients couchés qui se relèvent (dormeurs), l'Ensablé, les Noyés de la piscine ; le **pied de guéridon** (la terrasse) ; la **sortie à sens unique** (balcon ou draps : `sansArrivee`) ; la réinitialisation à 24 h (la carte expire, le robot revient) ; le fil dentaire des salles de bains.
- **Fichiers** : `commun/src/hotel.ts` (+ milieu, Éteints, vue), registre, `serveur/src/hotel.ts` (sur `LieuVivant`), `client/src/rendu/hotel.ts`, `client/src/hotel.ts` (les interactions).
- **Tests** : sans carte, l'ascenseur ne monte pas ; sans courant, la borne ne répond pas ; le joueur seul n'est pas reconnu ; on ne rentre pas par le balcon ; tout revient au bout de 24 h.

**Chantier K · L2B, le phare du cap** (**L**)

- **Contenu** : le modèle (la tour, la crique, **l'épave en deux états**) ; la montée (l'escabeau sous l'escalier coupé, ou la colonne des poids) ; remplir la lanterne (pétrole de la cuve) et remettre le prisme ; **allumer, la nuit seulement** (`estNuit`) ; de jour, on prépare la montée, le pétrole, le prisme et le compresseur, et un message (fermé par un bouton) dit « Le feu ne sert qu'à la nuit tombée. » (Q-0.10-9) ; un stimulus de lumière qui fait monter les Éteints du chemin des douaniers ; **la corne de brume** (réparer le compresseur, sonner : un leurre vers la falaise) ; **la scène du cargo** (`scene: "cargo"`, 2 à 3 min réelles après l'allumage) qui ouvre la zone de l'épave (un état, comme les portes du Moulin) ; les **objets-clés** dans les conteneurs (Q-0.10-2) ; le **harpon** (la cuisine du gardien) ; la **sortie à sens unique** par la rampe du canot ; les Noyés de la crique ; la réinitialisation à 24 h.
- **Fichiers** : `commun/src/phare.ts` (+ milieu, Éteints, vue), registre, `serveur/src/phare.ts`, `client/src/rendu/phare.ts` (l'animation du cargo), `client/src/phare.ts`.
- **Tests** : la lanterne ne s'allume pas de jour ; sans lanterne allumée, pas de cargo ; la corne détourne un Errant ; l'épave s'ouvre une fois par 24 h ; on ne remonte pas la rampe.

### Vague 3 · Le lien et la recette

**Chantier L · Le butin, les indices, les textes** (**M**)

- **Contenu** : la règle du butin aux quatre lieux (les objets-clés du niveau 1 plus courants, ceux de l'autre L2 rares) ; les **indices** des dix meubles (le type de lieu, puis le lieu ; jamais « clé », jamais le coin exact) ; les messages « tu y penses » ; le dévoilement des recettes ; l'aide ; les textes d'examen des lieux, des scènes, du péage ; la relecture « sans jargon ».
- **Fichiers** : `progression.ts`, `savoir*.ts`, `vestiges.ts`, `client/src/aide-contenu.ts`, les textes des chantiers H à K.
- **Tests** : aucun texte de jeu ne contient « clé » (hors la clé du Moulin et la carte de chambre) ; chaque objet-clé a son idée et son indice.

**Chantier M · Le rythme et le budget** (**S à M**)

- **Contenu** : `rythme.ts` connaît les quatre lieux et joue un **parcours du niveau 2** par famille (les sorties, les allers-retours de ravitaillement, les péages) ; le budget des matières (une charge de sac par route, 2 à 3 allers-retours de bois pour 🔥) ; `banc-charge.ts` ouvert aux nouveaux lieux.
- **Tests** : `npm run rythme` tient ses cibles au niveau 2.

**Chantier N · Recette, mesures, books, version** (**M**)

- **Contenu** :
  - **les mesures** : `npm run equilibre` (L2), `npm run rythme`, `banc-charge` à l'hôtel et au phare ; **l'iPhone 13 mini** avec `?mesure=1` dans les quatre lieux, Éteints au plus haut : **on fixe là le nombre d'Éteints** de chaque lieu (N2-65) ;
  - **la recette** : les critères du §6, avec captures et une courte vidéo du cargo ;
  - **les books** : Book 06 (le Noyé, l'Ensablé), Book 10 (les murs et les sols), Book 20 (les quatre lieux), Book 23 (les lieux du niveau 2), Book 24 (les meubles), Book 25 (les meubles des familles), la bible (régénérée), `niveau-2.md`, `en-suspens.md` ;
  - **la version** : `commun/src/version.ts` en **0.10.0**, `code/VERSIONS.md`, un commit et l'étiquette `v0.10` après le déploiement ; les lieux nouveaux n'ont pas de sauvegarde à migrer.
- **Tests** : `npm run verif`, `npm test`, `npm run build` passent.

---

## 5. L'ordre et le parallélisme

| Vague | Chantiers (en parallèle) | Avant la vague suivante |
|---|---|---|
| **0** | **A** registre et carte ; en même temps, la **demande à la session « bâtiments »** (§1.3) | A fusionné, tous les tests passent sans modification |
| **1** | **B** matières · **C** meubles · **F** armes · **G** Noyé et Ensablé ; puis **D** meubles nouveaux (après B) | B fusionné avant D ; C et F avant la vague 2 |
| **2** | **H** route du pont · **I** corniche (après H pour le péage) · **J** hôtel · **K** phare — chacun dès que son modèle est livré | Les quatre lieux fusionnés |
| **3** | **L** butin, indices, textes · **M** rythme · puis **N** recette | La livraison |

**Les fichiers partagés** :

| Fichier | Qui | Comment |
|---|---|---|
| `commun/src/registre-lieux.ts` | A, puis H à K | A crée le registre ; chaque lieu ajoute **une entrée** à la fin, rien d'autre |
| `commun/src/lignees.ts` | B, C | B retire les replis (le type et les données) **avant** C ; C ne touche que les étapes du niveau 2 |
| `commun/src/recettes.ts`, `recettes/*.ts` | C, D, F | Des blocs séparés par chantier, en fin de liste |
| `serveur/src/joueur.ts` | A, B, D, H à K | Après A, les lieux passent par le registre : les chantiers H à K n'y ajoutent que des appels d'une ligne |
| `commun/src/messages.ts` | H, J, K | Le format du §3.6, écrit par H ; un bloc par chantier en fin de fichier |
| `client/src/main.ts` | A, J, K | A : le registre ; J et K : la réception de `scene` |

---

## 6. Les critères de réussite (ce qu'on doit pouvoir faire en jeu)

1. **On voyage** du terrain à l'hôtel par la route du pont, et au phare par la corniche, **en autant de temps** sur les deux routes.
2. **Au pont**, on paie 12 wotts d'objets à l'aller, pas au retour ; on traverse la brèche un par un ; à marée basse, on fouille les caddies dans la vase et on y trouve des tubes d'aluminium.
3. **À la corniche**, on débite le pin tombé (10 bûches, à soi), on paie au tunnel, on passe l'éboulement.
4. **À l'hôtel**, seul : on branche la borne, on dégage le robot, on présente sa tête, on reçoit la carte de la chambre 7, on monte, on trouve ses objets-clés, on ressort par le balcon et on ne peut pas y rentrer. Le lendemain, tout est revenu.
5. **Au phare**, de nuit : on monte, on allume, on tient la tour, la corne détourne les Éteints, **le cargo arrive et s'échoue** ; on descend dans les conteneurs, on trouve ses objets-clés et le harpon, on ressort par la rampe.
6. **Les dix meubles du niveau 2** se construisent avec leur objet-clé ; sans objet-clé, **aucun repli** ne s'affiche ; le Comptoir le vend après la visite de son lieu.
7. **Les huit meubles nouveaux** marchent : le cuiseur cuit au soleil, le moulin tourne sous la pluie, la rampe éclaire la nuit, la charrette roule 100 kg de plus, l'arbalète de garde abat un Errant.
8. **Le Mécaniste seul** obtient son arbalète ★★★ par le cranequin léger, sans aller à l'hôtel *et* au phare.
9. **Le Noyé** ne tombe pas sous un coup au torse ; il crève en mourant, et l'odeur fait venir un Errant.
10. **Le banc solaire** ne charge rien la nuit ni sous la pluie, et donne ses 80 Wh par beau jour.
11. **Le garde-fou des armes** tient au niveau 2 (`npm run equilibre`), et `npm run rythme` tient ses cibles.
12. **L'iPhone 13 mini reste à 60 images par seconde** dans les quatre lieux, avec le nombre d'Éteints retenu ; le Pi tient son retard p99 sous 25 ms à 10 joueurs.
13. **Une partie 0.9 se relit** sans rien perdre (les replis disparaissent, les meubles restent).
14. `npm run verif`, `npm test`, `npm run build` passent.

---

## 7. L'estimation et les risques

### 7.1 Le temps

| Chantier | Effort | Jours-agent (milieu) |
|---|---|---|
| A · Registre des lieux, carte | M | 2 |
| B · Matières, objets-clés, Comptoir, sans repli | M | 2 |
| C · Les dix meubles du niveau 2 | M à L | 3 |
| D · Les huit meubles nouveaux | L | 4,5 |
| F · Les armes | M | 2 |
| G · Le Noyé et l'Ensablé | M | 2 |
| H · La route du pont | L | 4 |
| I · La corniche | M à L | 3 |
| J · Le Grand Hôtel | L | 5 |
| K · Le phare | L | 5,5 |
| L · Butin, indices, textes | M | 2 |
| M · Rythme et budget | S à M | 1 |
| N · Recette, mesures, books, version | M | 2,5 |
| **Total** | | **≈ 39 jours-agent** (fourchette 28 à 55) ; + ≈ 5 pour la 0.10.1 (les murs) |

**En temps réel**, d'après la 0.8 (≈ 47 jours-agent estimés, faits en ≈ 7 h, agents en parallèle) et la 0.9 :
- vague 0 (le registre) : 1 h 30 à 2 h, **seule** : c'est la fondation ;
- vague 1 : 2 h à 3 h (le plus long : les meubles nouveaux) ;
- vague 2 : 3 h à 4 h **une fois les modèles livrés** (le plus long : le phare) ;
- vague 3 et recette : 3 h à 4 h, recette sur ordinateur et sur l'iPhone ;
- fusions, vérifications, tes décisions en route : 2 h.

**Total : ≈ 11 à 14 h de travail, soit une journée et demie**, sans compter l'attente des modèles de la session « bâtiments ».

### 7.2 Les risques

1. **Le registre des lieux (A)** touche le cœur du serveur : une régression au Moulin ou à la Coopérative est possible. Parade : A seul en vague 0, et les tests actuels **inchangés** comme critère.
2. **Le banc qui suit le soleil (D)** change la vie des ⚡ : leur recharge baisse par mauvais temps. Parade : la même moyenne par beau jour, la batterie de cellules et le moulin ⚙️ (une commande entre familles) ; `npm run rythme` le vérifie.
3. **Les scènes (le cargo, l'ascenseur)** : la synchronisation entre le serveur (qui décide) et le client (qui anime) ; un joueur qui se déconnecte au milieu. Parade : le serveur garde l'état final (épave ouverte, étage atteint), le client rejoue la scène ou saute à la fin.
4. **Les modèles** : l'étage de l'hôtel et l'épave n'existent pas ; un retard bloque J et K. Parade : `lieu-vide.ts` et des boîtes provisoires pour coder la logique d'abord.
5. **La performance** : l'hôtel (deux cartes et un étage) et le phare (la tour, la crique, l'épave) sont de gros modèles. Parade : le budget du Book 17 par carte, la vision par pièce, et la mesure iPhone **avant** de fixer le nombre d'Éteints.
6. **L'équilibre** : les armes ★★★ face à des Éteints **inchangés** (N2-52 refusée) : le niveau 2 peut paraître facile. Parade : le Noyé, la nuit au phare, le nombre d'Éteints réglé au parcours ; `npm run rythme` le dira.

---

## 8. Pour plus tard

### 8.1 La 0.10.1 : les murs et les sols

Décidés (MS-01 à MS-09, MS-Q1 à MS-Q8, §3.2), sortis de la 0.10 pour la garder centrée sur les lieux (Q-0.10-1). Le chantier, tel qu'il était prévu (≈ 5 jours-agent ; quelques heures en temps réel, avec sa recette) :

**Chantier E · Les murs et les sols** (**L**, en 0.10.1)

- **Contenu** : la **pose sur la grille de 1 m** (le fantôme se cale sur un côté de carré, tourne d'un quart de tour) ; les **sols** par m² ; les règles du §3.2 (le bord d'un sol pour le mur de planches, le feu sur la terre nue) ; **les boîtes des murs dans la zone du terrain**, au serveur et au client (le joueur et les Éteints sont arrêtés) ; l'**usure** des murs par les Éteints, qui s'acharnent sans contourner (Q-0.10-3) ; le démontage ; le **rendu en lots** (un appel de dessin par sorte) ; le plafond de 200 éléments.
- **Fichiers** : `emplacement.ts`, `deplacement.ts`, `eteints.ts` (`deplacer`), `murs.ts`, `lieux.ts` (`ZONE_TERRAIN`), `serveur/src/base.ts`, `client/src/pose.ts`, `client/src/rendu/installations.ts` (ou un nouveau `rendu/murs.ts`).
- **Tests** : un enclos de 3 × 3 m fermé arrête un Errant ; la claie s'ouvre ; un feu refusé sur un plancher ; un mur de planches refusé hors du bord d'un sol ; 200 éléments à 60 i/s sur l'iPhone 13 mini.


### 8.2 Après

- Les **objets-clés de L3**, le **niveau 3** (`notice-nouveau-niveau.md` §6.3).
- Le **palan à poulies** et le **toit**, avec la suite des murs.
- L'**infection** (Book 05), si les fluides du Noyé la demandent (Q-0.10-4).

---

## 9. Les questions

**Toutes tranchées le 2026-10-14, en suivant les recommandations.**

| # | Question | Décision (la recommandation) |
|---|---|---|
| **Q-0.10-1** ✅ | **Les murs et les sols** dans la 0.10, ou en **0.10.1** ? | **En 0.10.1** : la 0.10 reste centrée sur les lieux et gagne ≈ 5 jours-agent de risque ; les murs auront leur propre recette |
| **Q-0.10-2** ✅ | **Les objets-clés dans les lieux** : on garde la répartition décidée (L2A, l'hôtel : tôles, couvertures de laine, lanterne-tempête, fer à souder, roulements ; L2B, le phare : porte de four, jerrican, rabot, cloche, soufflet) ? | **Oui**, elle va bien aux lieux : à l'hôtel, les couvertures à la **lingerie**, les roulements dans la **machinerie de l'ascenseur**, le fer à souder au **local technique**, la lanterne-tempête dans la **suite**, les tôles sur le **toit des cabines** ; au phare, la cloche est **la cloche du cargo**, le rabot à l'**établi du hangar**, le jerrican sous l'escalier, la porte de four et le soufflet **dans les conteneurs** (la livraison du jour) |
| **Q-0.10-3** ✅ | **Les Éteints face à un mur** : MS-Q3 disait « ils le contournent ou s'acharnent dessus », mais ils ne savent pas contourner (pas de recherche de chemin, Book 06 §2.1). | **Ils s'acharnent** : un Éteint arrêté par un mur l'abîme (le mur de branches cède en ≈ 20 s) ; pas de contournement (cohérent avec le Book 06) |
| **Q-0.10-4** ✅ | **Les fluides du Noyé** : « risque d'infection », mais l'infection n'existe pas encore. | Pour la 0.10 : **l'odeur** (déjà décidée) et une **nausée** de 30 s (l'endurance revient deux fois moins vite) ; l'infection viendra avec le Book 05 |
| **Q-0.10-5** ✅ | **Le péage** : les survivants ne sont pas des personnages du jeu. À qui donne-t-on ? | Une **caisse au pied du poste de guet** et une **voix** d'en haut (« Douze, et tu passes. ») ; on y dépose les objets, la chicane s'ouvre pour soi seul ; l'écran montre le compte ; un message fermé par un bouton (R48) |
| **Q-0.10-6** ✅ | **Le banc solaire produit autant la nuit et sous la pluie** (80 Wh par jour au calendrier). Le moulin à vent « quand le panneau ne donne rien » perd son sens. | **Le banc suit le soleil** : rien la nuit, moins par temps couvert, rien sous la pluie, avec la même moyenne de 80 Wh par beau jour. C'est un changement de règle pour les ⚡ : à valider explicitement |
| **Q-0.10-7** ✅ | **La marée** de la route du pont : quel rythme ? | **Marée basse la moitié du temps**, un cycle de 12 h de jeu (12 min réelles) ; l'heure de la marée se lit sur l'échelle peinte du quai |
| **Q-0.10-8** ✅ | **La tête du robot** : un objet qu'on porte (poids, sac) ou qu'on tient à deux mains (on ne frappe plus) ? | **À deux mains**, 8 kg : on ne frappe pas en la portant, ce qui fait de la traversée un moment de tension |
| **Q-0.10-9** ✅ | **La nuit du phare** : si le joueur arrive de jour, que fait-il ? | Il **prépare** : la montée, le pétrole, le prisme, le compresseur ; un message dit « Le feu ne sert qu'à la nuit tombée. » ; il peut aussi rentrer et revenir |
