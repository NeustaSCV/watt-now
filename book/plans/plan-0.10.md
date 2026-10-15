# Plan de développement — version 0.10 : le niveau 2, sur la côte

*Version du plan : v0.7 · 2026-10-14 · **Statut : en cours de codage ; vagues 0 et 1 fusionnées dans `integration-0-10` ; pause.***

*v0.7 (2026-10-14) : les questions V1-01 à V1-18 tranchées (toutes les recommandations, V1-17 à réexpliquer) ; le Noyé redessiné (taille normale, tronc en boule) ; la vague 1 finie (A, B, C, D, F, G fusionnés, 1 023 tests) ; les 18 questions remontées par les chantiers au §12.*

*v0.6 (2026-10-14) : après la vague 0, deux décisions du porteur : **toutes les routes partent du terrain** (terrain → H2A → L2A, terrain → H2B → L2B ; plus de route de la Coopérative ou du Moulin vers la côte) ; le **menu de téléportation de l'administrateur** propose le niveau 2.*

*v0.5 (2026-10-14) : **le complément est livré** (§11) : au pont, le banc devient une **cale basse** à y = − 0,5 (traitée à plat) avec son point de retour `FICHE.maree.retour` ; au phare, **`hauteurSol(x, z, { epave })` est exportée** par le modèle, à importer telle quelle.*

*v0.4 (2026-10-14) : **la session « bâtiments » a livré les quatre modèles** (réponse : `.claude-travail/propositions/reponse-batiments-niveau-2.md` ; format : `batiment/CONSIGNE-NIVEAU-2.md`). Trois points tranchés (§11) : le banc de vase du pont ramené au niveau d'une cale basse ; le relief du phare gardé, avec une fonction de hauteur du sol fournie par le modèle ; l'étage de l'hôtel caché par le jeu. Un complément de demande (§6 de la demande). Le chantier K passe à 6,5 jours-agent.*

*v0.3 (2026-10-14) : les **33 précisions S-01 à S-33** (§10) validées par le porteur, pour un développement simple ; les dix objets-clés **tous au fond** des lieux (R49) ; la demande à la session « bâtiments » écrite ([`demande-batiments-niveau-2.md`](demande-batiments-niveau-2.md)).*

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
- **Estimation** : **≈ 40 jours-agent**, soit **une journée et demie en temps réel**, agents en parallèle (§7).
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

La demande est écrite : [`demande-batiments-niveau-2.md`](demande-batiments-niveau-2.md) (2026-10-14) (les chantiers H à K en dépendent). **Livrés le 2026-10-14**, complément compris (§11). Ce qui était demandé :

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
  - **les quatre lieux** (`route_pont`, `corniche`, `grand_hotel`, `phare`) déclarés avec `lieu-vide.ts` comme rendu provisoire ; `ETAPES_LIEUX` complétée (H2A, H2B, L2A, L2B) ; `TRONCONS` : **toutes les routes partent du terrain** (décision du porteur, 2026-10-14 : « sinon c'est trop complexe ») : **terrain → H2A 3 km, H2A → L2A 2 km ; terrain → H2B 3 km, H2B → L2B 2 km** (mêmes distances, B16) ; aucune sortie de la Coopérative ou du Moulin vers la côte ;
  - la carte : quatre lieux de plus, dévoilés comme ceux du niveau 1, **les deux routes de la côte partant du terrain** ; aucune fiche de lieu qui divulgue son contenu ;
  - **le menu de téléportation de l'administrateur** (« Aller à… ») propose aussi les quatre lieux du niveau 2 (décision du porteur, 2026-10-14).
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
- **Les objets nommés du modèle** : `maree_basse` / `maree_haute` (et `obstaclesMareeHaute`), `chicane_fermee` / `chicane_ouverte` (et `obstaclesChicane`), `caisse_peage` ; **la cale basse** (y = − 0,5, traitée à plat ; `FICHE.maree.cale`, tronçon « bourg ») : quand la mer monte, un joueur resté sur la cale est remis **au point `FICHE.maree.retour`** (en haut de l'accès, sur le quai), avec un fondu et un message fermé par un bouton (« La mer monte : tu remontes sur le quai. »).
- **Tests** : le péage refuse 11 wotts, accepte 12, ne redemande pas pendant 1 h ; à marée haute, les bancs ne se fouillent pas, et un joueur resté sur le banc se retrouve sur le quai.

**Chantier I · H2B, la corniche** (**M à L**)

- **Contenu** : le modèle ; les pierres en vrac (l'éboulement, les murets) ; **le pin tombé** = le tas de bois personnel (10 bûches, 6 h) ; le péage du **tunnel** (le module de H) ; l'éboulement (goulet) ; les fouilles (les chambres du Panoramique : fil dentaire) ; le semis.
- **Fichiers** : `commun/src/corniche.ts` (+ milieu, Éteints), registre, rendu client.
- **Tests** : le tas de bois est personnel et revient en 6 h ; le tunnel applique la même règle que le pont.

**Chantier J · L2A, le Grand Hôtel des Flots** (**L**)

- **Contenu** : le modèle (la façade, l'intérieur et **l'étage** livré) ; le scénario « le check-in » (§3.3) : brancher une batterie à la borne, dégager le robot (Creuser), porter **sa tête** **à deux mains** (8 kg : on ne frappe pas en la portant, Q-0.10-8), la présenter, recevoir la **carte de la chambre 7** ; l'**ascenseur** (scène `ascenseur`) change de zone ; l'étage : les objets-clés (Q-0.10-2), les clients couchés qui se relèvent (dormeurs), l'Ensablé, les Noyés de la piscine ; le **pied de guéridon** (la terrasse) ; la **sortie à sens unique** (balcon ou draps : `sansArrivee`) ; la réinitialisation à 24 h (la carte expire, le robot revient) ; le fil dentaire des salles de bains.
- **Fichiers** : `commun/src/hotel.ts` (+ milieu, Éteints, vue), registre, `serveur/src/hotel.ts` (sur `LieuVivant`), `client/src/rendu/hotel.ts`, `client/src/hotel.ts` (les interactions).
- **Le modèle livré** : un seul lot de 64 × 66 m, l'étage posé au nord ; **deux groupes nommés `rez_de_chaussee` et `etage` : le jeu cache celui où le joueur n'est pas** (sinon l'étage se voit du rez-de-chaussée) ; obstacles et lumières portent un champ `niveau` ; `teleports[0]` (l'ascenseur) et `sensUnique[0]` (le balcon) ; la lumière de la borne ne s'allume qu'avec l'écran allumé ; 18 Éteints placés.
- **Tests** : l'étage ne se voit pas du rez-de-chaussée ; sans carte, l'ascenseur ne monte pas ; sans courant, la borne ne répond pas ; le joueur seul n'est pas reconnu ; on ne rentre pas par le balcon ; tout revient au bout de 24 h.

**Chantier K · L2B, le phare du cap** (**L**)

- **Contenu** : le modèle (la tour, la crique, **l'épave en deux états**) ; la montée (l'escabeau sous l'escalier coupé, ou la colonne des poids) ; remplir la lanterne (pétrole de la cuve) et remettre le prisme ; **allumer, la nuit seulement** (`estNuit`) ; de jour, on prépare la montée, le pétrole, le prisme et le compresseur, et un message (fermé par un bouton) dit « Le feu ne sert qu'à la nuit tombée. » (Q-0.10-9) ; un stimulus de lumière qui fait monter les Éteints du chemin des douaniers ; **la corne de brume** (réparer le compresseur, sonner : un leurre vers la falaise) ; **la scène du cargo** (`scene: "cargo"`, 2 à 3 min réelles après l'allumage) qui ouvre la zone de l'épave (un état, comme les portes du Moulin) ; les **objets-clés** dans les conteneurs (Q-0.10-2) ; le **harpon** (la cuisine du gardien) ; la **sortie à sens unique** par la rampe du canot ; les Noyés de la crique ; la réinitialisation à 24 h.
- **Fichiers** : `commun/src/phare.ts` (+ milieu, Éteints, vue), registre, `serveur/src/phare.ts`, `client/src/rendu/phare.ts` (l'animation du cargo), `client/src/phare.ts`.
- **Le relief** (gardé, §11) : la grève (y ≈ − 8,8), le pont de l'épave (y ≈ − 4,1) et la rampe du canot (≈ 37°). **Le serveur reste en 2D** ; le client pose les personnages, les Éteints et les objets sur **la hauteur du sol** : la fonction **`hauteurSol(x, z, { epave })` exportée par le modèle** (repère du lot ; `epave: true` quand l'épave est là), importée telle quelle ; la caméra suit.
- **Le modèle livré** : `epave_apres` et `obstaclesEpave` (31 segments), les conteneurs marqués `apresEpave`, `FICHE.escabeau` (la marque à la craie), `sensUnique` « rampe_canot ».
- **Tests** : un personnage descend la rampe et marche sur la grève à la bonne hauteur ; la lanterne ne s'allume pas de jour ; sans lanterne allumée, pas de cargo ; la corne détourne un Errant ; l'épave s'ouvre une fois par 24 h ; on ne remonte pas la rampe.

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
| K · Le phare (dont le relief) | L | 6,5 |
| L · Butin, indices, textes | M | 2 |
| M · Rythme et budget | S à M | 1 |
| N · Recette, mesures, books, version | M | 2,5 |
| **Total** | | **≈ 40 jours-agent** (fourchette 29 à 56) ; + ≈ 5 pour la 0.10.1 (les murs) |

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
5. **La performance** : les modèles livrés sont **à la limite** (l'hôtel à 40 appels de dessin, le phare et le bourg du pont à 39) ; les Éteints et les joueurs s'y ajoutent. Parade : **mesurer sur l'iPhone dès l'import** (pas à la fin), la vision par pièce, et au besoin une retouche demandée aux bâtiments.
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
| **Q-0.10-2** ✅ | **Les objets-clés dans les lieux** : on garde la répartition décidée (L2A, l'hôtel : tôles, couvertures de laine, lanterne-tempête, fer à souder, roulements ; L2B, le phare : porte de four, jerrican, rabot, cloche, soufflet) ? | **Oui**, et **toutes au fond** (R49) : à l'hôtel, **à l'étage** — les couvertures à la **lingerie**, la lanterne-tempête dans la **suite**, les roulements et le fer à souder dans la **machinerie de l'ascenseur**, les tôles dans la **chambre au balcon** ; au phare, **dans l'épave** — **la cloche du cargo**, et dans les conteneurs la porte de four, le soufflet, le rabot et le jerrican (la livraison du jour) |
| **Q-0.10-3** ✅ | **Les Éteints face à un mur** : MS-Q3 disait « ils le contournent ou s'acharnent dessus », mais ils ne savent pas contourner (pas de recherche de chemin, Book 06 §2.1). | **Ils s'acharnent** : un Éteint arrêté par un mur l'abîme (le mur de branches cède en ≈ 20 s) ; pas de contournement (cohérent avec le Book 06) |
| **Q-0.10-4** ✅ | **Les fluides du Noyé** : « risque d'infection », mais l'infection n'existe pas encore. | Pour la 0.10 : **l'odeur** (déjà décidée) et une **nausée** de 30 s (l'endurance revient deux fois moins vite) ; l'infection viendra avec le Book 05 |
| **Q-0.10-5** ✅ | **Le péage** : les survivants ne sont pas des personnages du jeu. À qui donne-t-on ? | Une **caisse au pied du poste de guet** et une **voix** d'en haut (« Douze, et tu passes. ») ; on y dépose les objets, la chicane s'ouvre pour soi seul ; l'écran montre le compte ; un message fermé par un bouton (R48) |
| **Q-0.10-6** ✅ | **Le banc solaire produit autant la nuit et sous la pluie** (80 Wh par jour au calendrier). Le moulin à vent « quand le panneau ne donne rien » perd son sens. | **Le banc suit le soleil** : rien la nuit, moins par temps couvert, rien sous la pluie, avec la même moyenne de 80 Wh par beau jour. C'est un changement de règle pour les ⚡ : à valider explicitement |
| **Q-0.10-7** ✅ | **La marée** de la route du pont : quel rythme ? | **Marée basse la moitié du temps**, un cycle de 12 h de jeu (12 min réelles) ; l'heure de la marée se lit sur l'échelle peinte du quai |
| **Q-0.10-8** ✅ | **La tête du robot** : un objet qu'on porte (poids, sac) ou qu'on tient à deux mains (on ne frappe plus) ? | **À deux mains**, 8 kg : on ne frappe pas en la portant, ce qui fait de la traversée un moment de tension |
| **Q-0.10-9** ✅ | **La nuit du phare** : si le joueur arrive de jour, que fait-il ? | Il **prépare** : la montée, le pétrole, le prisme, le compresseur ; un message dit « Le feu ne sert qu'à la nuit tombée. » ; il peut aussi rentrer et revenir |

---

## 10. Les précisions pour un développement simple (validées le 2026-10-14)

*But : que chaque chantier sache exactement quoi faire, en **réutilisant ce qui existe** plutôt qu'en inventant un mécanisme. Toutes validées par le porteur ; elles priment sur les sections précédentes en cas d'écart (S-07, S-12, S-19 et S-28 modifient des décisions de `niveau-2.md`). La demande à la session « bâtiments » ([`demande-batiments-niveau-2.md`](demande-batiments-niveau-2.md)) suit déjà ces propositions.*

### 10.1 Les lieux

| # | Précision | Ce qu'on réutilise |
|---|---|---|
| S-01 | **Un lieu = un seul repère.** L'étage de l'hôtel est posé **à côté** du rez-de-chaussée, au sol ; l'**ascenseur** et le **balcon** sont des **téléportations** dans le lieu, avec un **fondu au noir** d'une seconde. Pas de vrai étage superposé, pas de cabine qui bouge | Le placement d'arrivée (`arriveeDans`), le fondu du voyage |
| S-02 | **Ce qui change d'état est un état du lieu**, comme les portes du Moulin : la grille de l'ascenseur, la borne, la lanterne, l'épave, la marée, la chicane du péage. Le modèle livre les deux versions ; le jeu montre l'une | `EtatMoulin.portes`, `zoneMoulin(portes)` |
| S-03 | **Les objets-clés** ont chacun **une place fixe**, comme la fourche et l'étau du Moulin ; ils reviennent selon leur délai (24 h ou 4 jours) | Les ressources de lieu (`moulin_fourche`, `REPOUSSE_MS`) |
| S-04 | **La réinitialisation à 24 h** se fait comme au Moulin : à l'entrée, lieu vide | `aReinitialiser`, `LieuVivant.reinitialiser()` |
| S-05 | **Les deux haltes** sont faites comme le gué : un lot de 200 × 70 m en tronçons, partagé | Le code du gué |
| S-06 | **Le nombre d'Éteints** : on part de **20 par lieu personnel** (la Coopérative en a 24, le Moulin 22) et **12 par halte** (la station en a 11), puis on règle à la mesure sur l'iPhone | Les places de la `FICHE` |

### 10.2 L'hôtel, « le check-in »

| # | Précision | Ce qu'on réutilise |
|---|---|---|
| S-07 | **La batterie** est celle du panneau de la promenade, **un objet du lieu** : on la prend, on la branche à la borne, elle y reste. Le joueur ne dépense rien de son sac. **La variante « le pack d'un Voltaïque » est retirée** | La clé du Moulin laissée dans la serrure |
| S-08 | **La tête du robot** et **la batterie** se portent **dans les bras**, comme l'escabeau : on ne court pas, on ne frappe pas, on peut les poser | L'objet lourd dans les bras (`messages.ts` l.115, l.178) |
| S-09 | **Dégager le robot** : un geste de 10 s avec Creuser 1 (la pelle, ou les mains à Creuser 0 en 30 s) | Le gisement de glaise du gué |
| S-10 | **La borne** : batterie branchée + tête présentée → elle remet **la carte de la chambre 7** (un objet). **La carte disparaît du sac quand on quitte le lieu** (pas d'expiration à gérer) | `donne` d'une ressource |
| S-11 | **L'ascenseur** : la carte en main, appeler → fondu → l'étage. On **redescend** par l'ascenseur tant qu'on est à l'étage ; on **sort** par le balcon (sens unique : on retombe sur la dune, on ne remonte pas) | S-01 ; `sansArrivee` |

### 10.3 Le phare, « le feu et le cargo »

| # | Précision | Ce qu'on réutilise |
|---|---|---|
| S-12 | **La montée** : seulement **l'escabeau du gardien**, pris dans le hangar et porté dans les bras jusqu'au pied de l'escalier coupé. **La colonne des poids est retirée** (un seul chemin) | S-08 ; l'escabeau posé au pied d'un arbre |
| S-13 | **Le pétrole** : on remplit le bidon à la cuve (5 s), on le monte, on remplit la lanterne. **Le prisme** : on le ramasse, on le monte, on le remet. Ce sont deux objets ordinaires du lieu | Des ressources de lieu |
| S-14 | **Allumer** n'est possible **que la nuit** (21 h – 5 h 30 de jeu) ; de jour, un message fermé par un bouton : « Le feu ne sert qu'à la nuit tombée. » | `estNuit` |
| S-15 | **La « vague »** : **pas d'Éteints qui apparaissent**. 8 à 10 **dormeurs** sont déjà couchés sur le chemin des douaniers ; la lanterne allumée est une **lumière** qui les réveille et les attire | `Stimulus` lumière, les dormeurs |
| S-16 | **La corne de brume** : réparer le compresseur (Serrer 1, 10 s, sans pièce) ; sonner = **un leurre** : un bruit fort au bord de la falaise, 60 s, une fois par nuit | `LEURRES_MOULIN` |
| S-17 | **Le cargo** : **pas de cinématique synchronisée**. **2 min réelles** après l'allumage, le serveur passe le lieu à l'état « épave » : le client joue **la corne grave du cargo**, **un choc**, un **fondu de 2 s**, et l'épave est là. Un joueur qui arrive après la trouve déjà échouée | S-02 ; un son et un fondu |
| S-18 | **L'épave reste jusqu'à la réinitialisation** (24 h) ; elle ne revient qu'avec un nouvel allumage, la nuit suivante | S-04 |

### 10.4 Les haltes

| # | Précision | Ce qu'on réutilise |
|---|---|---|
| S-19 | **Le péage** : on touche la caisse ; **le sac s'ouvre en mode « donner »** ; on touche des objets, un compteur monte jusqu'à 12 wotts ; « Payer » ; la chicane s'ouvre **pour soi**. Pas de monnaie rendue. **« À l'aller seulement »** = on paie une fois et on passe librement **pendant 1 h réelle** (l'aller et le retour d'une sortie) | L'écran du coffre, `energieGrise` |
| S-20 | **La marée** : **deux états** qui alternent toutes les **6 min réelles**, la même heure pour tout le monde (calculée comme la météo). Pas d'eau animée : le modèle montre l'un ou l'autre. Les bancs se fouillent à marée basse seulement | `meteo.ts` (un tirage par tranche) |
| S-21 | **Le pin tombé** : un tas personnel de 10 bûches, comme le tas de bois de la station | Le tas personnel de H1A (B3) |

### 10.5 Les meubles nouveaux

| # | Précision | Ce qu'on réutilise |
|---|---|---|
| S-22 | **Le cuiseur solaire** = **un foyer qui ne brûle rien** : les recettes « bouillir l'eau » et les plats du foyer de pierres, **deux fois plus lentes**, au soleil et le jour seulement | Les recettes du foyer |
| S-23 | **Les bacs de tri** = **un bonus de proximité** (3 m), comme le râtelier : démonter 2 fois plus vite ; **une matière de plus, un démontage sur trois** (au hasard, tiré par le serveur) | La proximité du râtelier |
| S-24 | **Le creuset** = **deux recettes à la forge ventilée** : 4 chutes → 1 poulie ; 4 chutes → 1 lingot | Les recettes de forge |
| S-25 | **La rampe de LED** = **une lumière posée** comme la lanterne fixe (20 m), qui **tire 3 W** sur la batterie de la base, la nuit seulement ; batterie vide : éteinte | La lanterne fixe, `decharger` |
| S-26 | **La batterie de cellules** = **un type de batterie de 120 Wh** posé à la base | `TypeBatterie` |
| S-27 | **La charrette** = **la brouette avec + 100 kg** (au lieu de + 60) | La brouette |
| S-28 | **Le moulin de jerricans** = **un producteur comme le banc** : 15 W quand il vente (couvert, pluie), 5 W par temps voilé, rien au soleil, au calendrier, même hors ligne, vers la batterie de la base. **La poulie (🔥) : + 50 % de production**, au lieu d'un entraînement direct de la meule et du tour (une mécanique de moins) | `productionPanneau`, `NUAGES` |
| S-29 | **L'arbalète de garde** = **un piège** comme l'assommoir : le premier Éteint qui passe à 1 m devant reçoit **un carreau** (les dégâts de l'arbalète posée) ; puis il faut la réarmer (2 s au cranequin léger, 3 s sinon). Pas de trajectoire | L'assommoir, les dégâts de `tir.ts` |
| S-30 | **Le banc qui suit le soleil** : la production = la moyenne actuelle × un facteur d'heure (0 la nuit) × un facteur de temps (soleil 1, voilé 0,6, couvert 0,3, pluie 0), réglé pour donner **80 Wh par beau jour** | `productionPanneau`, `meteo()` |

### 10.6 Les Éteints

| # | Précision | Ce qu'on réutilise |
|---|---|---|
| S-31 | **Le Noyé** = **une variante d'Errant** (`noye`) : 0,4 m/s ; **un coup au torse ne le fait pas tomber** ; la tête et les jambes comme les autres | `VarianteEteint`, `encaisser` |
| S-32 | **Quand il crève** : tout joueur à **moins de 1,5 m** prend **la nausée** (30 s : l'endurance revient deux fois moins vite, une icône) ; une **odeur** (stimulus) d'1 min au point de sa mort. Pas de corps qui reste gonflé | `Stimulus` odeur ; un état comme l'intoxication |
| S-33 | **L'Ensablé** = **un rampant dormeur** dessiné à moitié sous le sable ; aucune règle nouvelle | Le rampant, le dormeur |

### 10.7 Ce qu'on retire pour simplifier (déjà pris en compte ci-dessus)

- La **colonne des poids** du phare (S-12) et le **pack du Voltaïque** à la borne (S-07).
- L'**entraînement direct** de la meule par le moulin (S-28 : un bonus de production à la place).
- Les **deux cartes** de l'hôtel (S-01 : un seul lot).
- L'**animation** du cargo, de l'ascenseur et de la marée (S-17, S-01, S-20 : des états et des fondus).

---

## 11. La livraison des bâtiments (2026-10-14)

*Les quatre modèles sont dans `batiment/` (versions d'avant dans `.claude-travail/avant-niveau-2/`), au format de `batiment/CONSIGNE-NIVEAU-2.md` : objets nommés (`FICHE.objets`, `groupe.userData.objets`), obstacles propres à un état (`obstaclesEpave`, `obstaclesChicane`, `obstaclesMareeHaute`, `obstaclesBarricade`, `obstaclesPin`), `pieces` et `portes` au format du Moulin, `sensUnique`, `teleports` (l'hôtel). Les objets-clés d'autres niveaux sont retirés du décor ; toutes les couvertures sont polaires ; passages ≥ 1,2 m.*

| Lieu | Budget livré (k triangles / appels de dessin / lumières) | Ce qui change pour le jeu |
|---|---|---|
| Grand Hôtel | 55,4 / **40** / 8 (un seul lot, 64 × 66 m) | `FICHE.cartes` a disparu ; le pavillon des bains est retiré ; 18 Éteints, 25 fouilles |
| Phare | 57,6 / **39** / 5 | Le ponton retiré ; 9 dormeurs sur le chemin, 3 Noyés |
| Route du pont | bourg 39,3 / **39** ; les autres tronçons plus légers | Le péage déplacé sur le goulet n° 2 ; le fil dentaire à l'épicerie |
| Corniche | 46,7 / 26 au plus | La barricade refaite (on passait par les côtés) |

**Les trois points renvoyés au jeu, tranchés par le porteur (2026-10-14)** :

| # | Point | Décision |
|---|---|---|
| L-1 | **Le relief** : le banc de vase du pont (8 m sous le quai), la grève et le pont de l'épave du phare, la rampe du canot (≈ 37°) | **Au pont, aplatir** : le banc ramené au niveau d'une cale basse ; quand la mer monte, le joueur resté sur le banc est remis en haut de l'escalier. **Au phare, garder le relief** : le modèle fournit une fonction de **hauteur du sol** ; le client s'en sert, le serveur reste en 2D (+ 1 jour-agent au chantier K) |
| L-2 | **L'étage de l'hôtel se voit** du rez-de-chaussée | Le jeu **cache le groupe** où le joueur n'est pas (chantier J) |
| L-3 | **Les deux caisses de péage** se ressemblent sans être identiques | **On les garde** : même comportement |

**Le complément, livré le 2026-10-14** (réponse, section « Complément ») :
- **K1, le pont** : le banc 8 m plus bas et son escalier sont supprimés ; **une cale de pierre à y = − 0,5** (x − 58 → − 51, z 14,6 → 34,4, tronçon « bourg ») ; l'accès de 2 m à deux marches basses, **traité à plat** ; `maree_haute` noie la cale et `obstaclesMareeHaute` ferme l'accès ; **le point de retour** : `FICHE.maree.retour` (− 59,2 ; 17) dans le repère de la halte, `retourMaree` (15,8 ; 17) dans la carte « bourg » ; budget du bourg 38,8 k / 39.
- **K2, le phare** : `export function hauteurSol(x, z, { epave = false } = {})`, pure, dans le repère du lot (décrite dans `FICHE.hauteurSol`) : le plateau à 0, la rampe (0 → − 5,15 puis − 6,65 → − 8,95), les galets (− 8,7 à − 9), et avec l'épave l'échelle de coupée, le pont (≈ − 4) et les conteneurs ; écart contrôlé ≤ 0,09 m ; l'échelle de coupée remise à l'endroit ; budget inchangé.

---

## 12. Après la vague 1 (2026-10-14) : l'état et les questions

**Fait et fusionné dans `integration-0-10`** (1 023 tests, verif et build passent) : A (le registre des lieux, la carte, les routes depuis le terrain, le menu de l'administrateur), B (les matières, les objets-clés, le Comptoir toujours servi, plus aucun repli), C (les dix meubles du niveau 2, le pack soudé), D (les huit meubles nouveaux, le banc qui suit le soleil), F (les armes ★★★, le cranequin léger, le pied de guéridon, le harpon, la fourche à 2,3), G (le Noyé, très gonflé à la demande du porteur, et l'Ensablé). **Pause demandée par le porteur.** Reste : la vague 2 (les quatre lieux, H à K), puis L, M, N.

**Les questions remontées par les chantiers.** **Décision du porteur (2026-10-14) : toutes les recommandations acceptées (✅), V1-17 comprise (réexpliquée : le moulin de jerricans et la rampe de LED se branchent à une batterie à 15 m au plus).**

| # | Question | Recommandation |
|---|---|---|
| V1-01 ✅ | **Les roulements** : B dit « la boîte contient 3 roulements », C consomme une boîte entière aux roulements montés, F et D comptent 1 boîte = 1 roulement (la charrette en prend 2) : un Mécaniste aurait besoin de 5 boîtes | **Une boîte = 3 roulements** (des objets) ; chaque recette compte ses roulements : roulements montés 1, cranequin léger 1, moulin 1, charrette 2 → 5 roulements = **2 boîtes**, comme prévu au plan |
| V1-02 ✅ | **Le banc qui suit le soleil** : 80 Wh par beau jour **de calendrier** (≈ 17 Wh par jour de jeu) ; avec la vraie météo, le revenu des ⚡ baisse de moitié (le Voltaïque prudent finit le niveau 1 en 298 min au lieu de 276) | **Compenser** : 80 Wh par **beau jour** comme voulu, mais calé pour que la moyenne sur la météo réelle reste celle d'avant (≈ × 1,9 au soleil) |
| V1-03 ✅ | **Le moulin de jerricans** : 15 W continus ≈ 190 Wh par jour de calendrier, ≈ 4,5 fois le banc | **Le ramener à la même moyenne que le banc** (≈ 6 W par vent, 2 W par temps voilé), pour qu'il complète sans écraser |
| V1-04 ✅ | **Les recettes de l'établi de menuisier** (étagères, manches + 25 %) n'ont pas de chiffres ; la porte de planches attend les murs (0.10.1) | Étagères : **2 planches rabotées, 4 clous** → + 50 kg au coffre ou à la réserve à côté ; manches + 25 % : **reporter** (il faut une solidité par exemplaire, gros changement) ; la porte en 0.10.1 |
| V1-05 ✅ | **Le pack soudé** : 6 cellules, 1 LED, 1 fil de cuivre, Souder 1, 30 min (choisi par C) | **Oui** |
| V1-06 ✅ | **L'huile de la lanterne fixe** : un bidon consommé une seule fois, à la construction | **Oui** (la lanterne ne se rallume pas : simple) |
| V1-07 ✅ | **La chance « courante »** des objets-clés du niveau 1 au niveau 2 : 6 % par fouille (≈ 1,5 par visite de l'hôtel) | **4 %** (≈ 1 par visite) : trouver reste une surprise |
| V1-08 ✅ | **Les meubles de famille sans leur pièce** (la pierre plate en enclume, la manivelle de la lampe, la dynamo du vélo) : ce ne sont pas des replis de clé, mais des voies de secours | **Les garder** : c'est la règle d'or du Book 25 (chaque famille autonome dès le premier jour) |
| V1-09 ✅ | **Le serre-joint de fortune** reste (Serrer 1) | **Le garder** (un outil, pas un repli) |
| V1-10 ✅ | **L'échelle en aluminium** sort aussi de la caisse à outils de la ruine (même table « atelier ») | **Non** : la retirer de la ruine (elle reste aux ateliers) |
| V1-11 ✅ | **La machette à manche ficelé** plafonnée à ★★ (le ★★★ demande le manche de caoutchouc) | **Oui** |
| V1-12 ✅ | **La hache forgée** : 2 caoutchoucs **à la place** de la bûche du manche | **Oui** (la récupération au niveau 2) |
| V1-13 ✅ | **L'empennage de plastique** : un choix sur les trois carreaux à plumes | **Oui** |
| V1-14 ✅ | **La matraque ★★★ avec le pack soudé** : 24 Wh (Q-C10) au lieu de 12 ? | **Oui, 24 Wh** (C10 décidée) ; surveiller l'électrique à 15 m (1,92, sous la limite de 2) |
| V1-15 ✅ | **Le Noyé** : 0,4 m/s même en poursuite ? Vacille-t-il sous les coups au torse ? | **0,4 m/s partout** (on le fuit en marchant) ; **il ne vacille pas** (sa masse, comme l'Équipé qui encaisse) |
| V1-16 ✅ | **La poulie et le lingot** : sans charbon (« 4 chutes ») | **1 charbon** chacun, comme les autres recettes de forge |
| V1-17 ✅ | **La batterie de la base** remplie par le moulin, la rampe : la plus proche, **sans limite de distance** | **15 m au plus** (comme le reste de la base), et la fiche du banc cite le moulin |
| V1-18 ✅ | **R38** : quelques anciens textes écrivent encore « aluminium » seul (casserole, canette, planche à roulettes) | **Corriger** au chantier L |

**Après le chantier V1 (2026-10-14)** : fusionné dans `integration-0-10` (1 036 tests). Quatre précisions tranchées par le porteur, toutes selon les recommandations :

| # | Question | Décision |
|---|---|---|
| V1-19 ✅ | « 80 Wh par beau jour » et « la moyenne d'avant » ne tiennent pas ensemble | **La moyenne** : 80 Wh par jour sur la vraie météo, soit ≈ 160 Wh par beau jour ; le moulin de jerricans à la même moyenne (≈ 5,9 W par vent, 2 W voilé) |
| V1-20 ✅ | Les « 4 clous » des étagères (les clous n'existent qu'en poignée) | **1 poignée de clous** |
| V1-21 ✅ | Les « planches rabotées » n'existent pas comme objet | En 0.10 : **2 planches fendues, et le rabot** ; le vrai objet en 0.10.1, avec les murs |
| V1-22 ✅ | La matraque ★★★ obtenue par la maîtrise dès le niveau 1 a aussi 24 Wh | **Accepté** (la capacité suit les étoiles) |

**Le Noyé** : la boule refusée ; le corps lui-même gonflé (« patate »), **variante moyenne** choisie par le porteur, fusionnée.

---

## 13. Après la vague 2 (2026-10-14) : l'état et les décisions

**Fait et fusionné dans `integration-0-10`** (1 102 tests, verif et build passent) : H (la route du pont : le péage, la marée de 6 min, la cale basse), I (la corniche : le pin tombé, l'éboulement, le péage du tunnel), J (le Grand Hôtel : le check-in, l'étage caché, le balcon), K (le phare : l'escabeau, la lanterne la nuit, la corne, le cargo, l'épave, le relief par `hauteurSol`). Les objets portés dans les bras suivent une seule règle (S-08) : on ne frappe pas, on pose.

**Les questions des chantiers, tranchées par le porteur (2026-10-14)** :

| # | Question | Décision |
|---|---|---|
| V2-01 ✅ | Repayer le péage au retour, l'heure passée ? | **Non** : dans le sens lieu → terrain, on passe toujours librement (N2-60, « à l'aller seulement ») |
| V2-02 ✅ | La valeur d'un objet au péage | **Le prix de rachat du Comptoir** ; **les ordures comptent si elles valent déjà quelque chose** au Comptoir (celles à 0 ne comptent pas) — « soyons sympa » |
| V2-03 ✅ | Le semis des haltes : pont 10 pierres, 8 branches, 4 bûches (+ le vrac électrique) ; corniche 20 pierres, 8 bûches, 18 branches (+ le pin) | **Validé** |
| V2-04 ✅ | La caisse du pont est derrière la porte | **Demander aux bâtiments de la déplacer** devant la porte ; en attendant, on paie aussi contre la porte |
| V2-05 ✅ | L'Équipé derrière la porte du péage devenu dormeur | **Oui** |
| V2-06 ✅ | Les couvertures polaires : seulement dans les textes | **Oui** (pas d'objet nouveau) |
| V2-07 ✅ | Le fil dentaire « courant » (≈ 1 chance sur 3 par visite des chambres) | **Oui** |
| V2-08 ✅ | Le nombre d'Éteints du phare (14 au modèle, 20 visés) | **Après la mesure sur l'iPhone** |
| V2-09 ✅ | La lanterne du phare : 45 m, allumée jusqu'au retour à 24 h, n'attire que la nuit | **Oui** |
| V2-10 ✅ | Le bidon et le prisme : des états du lieu, pas des objets du sac | **Oui** |
| V2-11 ✅ | L'écran de la borne s'allume dès la batterie branchée | **Oui** |
| V2-12 ✅ | Les bras pris, le bouton A dit « Frapper » | **Corriger** (chantier L : il dit « Poser ») |
| V2-13 ✅ | Les bâtiments du pont vus de dehors, tout noirs | **À regarder à la recette** (N, sur l'iPhone) |
| V2-14 ✅ | Pour la session bâtiments : le pin parasol qui cache la barricade, les bords invisibles du phare, la réserve des guetteurs inaccessible, l'eau du pont pas fermée | **À transmettre** (`en-suspens.md`) |
| V2-15 ✅ | La fenêtre de la caisse du péage a une croix (✕), comme le sac et le coffre | **Gardée** (ce n'est pas un message) |

**Après la vague 3, L et M (2026-10-14)** : L (le butin, les indices, les textes, R38, V2-01, V2-02, V2-12) et M (le rythme et le budget du niveau 2, le banc de charge ouvert aux lieux de la côte) fusionnés dans `integration-0-10` (1 126 tests). Les questions du chantier M, tranchées :

| # | Question | Décision |
|---|---|---|
| V3-01 ✅ | Les boîtes de roulements de la machinerie de l'hôtel | **2 boîtes** (6 roulements) |
| V3-02 ✅ | Le tube d'aluminium trop rare (≈ 3,3 par tour de la côte ; besoin ⚙️ 16) | **Plus généreux** : ≈ 14 tubes par tour (transats et parasols de l'hôtel, échelle au hangar du phare, bancs du pont, corniche) |
| V3-03 ✅ | Les bouteilles en verre (6 au four, 1 sur la côte) | **Plus généreux** : ≈ 8 par tour (hôtel, phare, pont) |
| V3-04 ✅ | Le bois du 🔥 (14 bûches au niveau 2) | **Tel quel** (il servira aux murs de la 0.10.1) |
| V3-05 ✅ | Des buts de carnet pour le niveau 2 | **Plus tard** (`en-suspens.md`) |
| V3-06 ✅ | Pour information : 34 kg d'objets-clés au phare, péage léger, énergie par jour | **Noté** |

**Une fausse manœuvre réparée** : une fusion du chantier L partie par erreur dans `main` (702c402) a été annulée (`git reset --keep a6cc3cb`, avec l'accord du porteur) ; rien n'était poussé.

**Après l'essai sur l'iPhone (2026-10-14, soir)** : V3 (plus généreux : ≈ 15 tubes et 8 bouteilles par tour de la côte, 2 boîtes de roulements, 6 fouilles de plus au phare, l'Errant de la porte du péage endormi) et les correctifs du phare (l'épave qui s'effaçait, la rampe où le combat cachait « Sauter ») fusionnés (1 135 tests). Le relevé du péage (11 Éteints à l'écran) tient 60 i/s. Décisions du porteur :

| # | Décision |
|---|---|
| V4-01 ✅ | **Le guidage** : G-1 (pensées et voix à l'approche, une fois par visite) et G-2 (les écriteaux lisibles par « Lire ») ; les 27 phrases et les 11 écriteaux validés mot pour mot (`.claude-travail/guidage-0.10.md`). G-3 (une pastille) et G-4 (le carnet du lieu) non retenus pour la 0.10 |
| V4-02 ✅ | **L'écran tremble** quand le cargo s'échoue (0,8 s ; rien si l'appareil demande de réduire les mouvements) |
| V4-03 ✅ | **La lanterne allumée se voit** : le faisceau balaie le sol (A) et la caméra recule quelques secondes sur la tour à l'allumage (C) |
| V4-04 ✅ | **L'arrivée du cargo se voit** : ses feux approchent dans les dernières secondes, sa corne au large (A), puis la caméra cadre la crique pour l'échouage (C) ; S-17 (un son et un fondu seulement) est remplacée |
| V4-05 ✅ | **Le cargo** : le premier coup de corne **10 s après l'allumage** (au lieu de ≈ 60 s ; « 1 minute, c'est trop long si le joueur a déjà fouillé tout le lieu »), le second juste avant le choc ; **un vrai son de paquebot** : « Cruise Ship Horn, 3x » de Kinoton (Freesound 352374, CC0) |
| V4-06 ✅ | Le guidage : le texte du serveur à l'arrivée du cargo retiré (P-26 le remplace) ; « La mèche prend… » gardé avec P-24 ; la borne répond « Veuillez sourire davantage. » ; P-03 dite aussi à l'approche au retour ; « Lire » remplace « Examiner » à la borne et à la porte du péage |
| V4-07 ✅ | **Le cargo s'échoue 50 s après l'allumage** (au lieu de 2 min) ; la première corne à 10 s |
| V4-08 ✅ | **Au phare, les Éteints attirés par la lanterne viennent jusqu'au pied de l'escalier** (on tient la tour) ; **le message de jour et « La mer monte » sont des messages qui passent** (plus de bandeau à bouton au niveau 2) ; **le cadrage du cargo se voit** (la crique montrée, la brume écartée, le projecteur du cargo) ; **le lieu du phare est clôturé** par un muret de pierres sèches (à demander aussi aux bâtiments) |
| V4-09 ✅ | **Le cargo** : on ajoute **sa coque** qui glisse vers la crique pendant l'approche (solution B, en plus des feux) ; à l'approche du choc, **une vue large qui montre à la fois le personnage et la crique, toujours** (même avec des Éteints autour : plus d'annulation à 6 m), sans brume. Mesure de nuit au phare : 60 i/s avec 16 à 18 Éteints à l'écran (243 appels) |
| V4-10 ✅ | **La nuit du phare** : constat du porteur, quand on allume, le joueur a déjà tué les Éteints du lieu ; donc **à l'allumage, 2 ou 3 Éteints arrivent de la lande** (de l'extérieur du lieu) et marchent vers la tour et le joueur (S-15 « pas d'Éteints qui apparaissent » est remplacée). La scène du cargo : **une courte scène de 5 à 6 s** (fondu, plan fixe sur la crique, la coque qui s'écrase, secousse, retour), **maquette d'abord**, rien de codé avant le choix du porteur. Plus aucun bandeau à bouton en jeu (l'avertissement de la bûche compris) |
