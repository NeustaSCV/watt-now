# Le niveau 2 : les décisions et les propositions

> Étude · version 0.5 · 2026-10-14 (la v0.1 est dans `.claude-travail/propositions/sauvegardes/niveau-2-proposition-v0.1.md` ; **les numéros ont changé**). Rangé dans `book/plans/` le 2026-10-14 ; reporté dans la bible le même jour (`.claude-travail/propositions/outils/_appliquer-niveau-2.py`).
> **Statut : presque tout est décidé (✅) et reporté dans la bible ; rien n'est codé.** Une modification par ligne, à trancher une par une (V5-7, R44).
> **Méthode** : `book/plans/notice-nouveau-niveau.md`, §3.a à 3.g. **Hors sujet ici** : le choix des bâtiments de H2A, H2B, L2A et L2B (§3.h).
> **Relevé** : `progression-par-ingredients-page.json` (2026-10-13), `decisions-armes.json`, le code de la 0.8.3 en lecture seule (`vestiges.ts`, `vestiges-lot2.ts`, `dechets.ts`, `recettes/*.ts`, `lignees.ts`, `tir.ts`, `meteo.ts`). Les comptes de démontage viennent de `.claude-travail/niveau2/demontages.ts` et `usages.ts`.

---

## 0. Ce qui est déjà décidé

| Lieu | Évolutions et leur clé |
|---|---|
| **L2A** | Réserve couverte (tôles ondulées) · Abri doublé (couvertures de laine) · Lanterne fixe (lanterne-tempête) · ⚡ Poste de montage (fer à souder) · ⚙️ Roulements montés (boîte de 3 roulements) |
| **L2B** | Four de terre (porte de four en fonte) · Récupérateur à jerrican (jerrican de 20 L) · Établi de menuisier (rabot) · Cloche d'alarme (cloche de bronze) · 🔥 Forge ventilée (soufflet de forge) |

Les armes ★★★ du niveau 2 et leurs dégâts sont décidés (K1–K56) ; le garde-fou passe.

**Dit par le porteur (2026-10-14)** :
- **Les haltes continuent de fournir les matériaux de base** (pierres, bûches, branches, glaise), en vrac et qui reviennent : ils sont partout, et ils serviront plus tard aux murs et aux sols. H2A et H2B gardent leurs thèmes (I14, I15).
- **D'accord sur le principe de la récupération** au niveau 2, et sur le **tube d'aluminium** pour épargner les barres de métal (§1).
- **Les nouveaux meubles du §4 : acceptés**, sauf la **barricade de chariots** (N2-42, refusée).
- **N2-Q3, Q4, Q5 : oui** (les meubles communs apparaissent après la première visite d'un lieu du niveau 2 ; le vent se déduit du temps ; l'arbalète de garde ne tire pas sur les joueurs). **N2-Q6 : plus tard** (le palan, avec les murs).
- **Les murs et les sols** : le porteur fixe le cadre (§8) ; MS-01 à MS-09 acceptés (plancher : 3 planches seules ; mur de planches : 4 planches seules) ; MS-Q1 à Q8 tranchées (un mur fait 1 m, d'une intersection à la voisine ; les meubles gardent leur grille de 50 cm).

---

## 1. Le principe : au niveau 2, on bâtit avec la récupération

### 1.1 Le constat

Le démontage donne beaucoup de matières, et les recettes en utilisent peu :

| Matière de récupération | Objets qui la donnent | Recettes qui l'utilisent |
|---|---|---|
| plastique | 27 | 3 |
| fil de cuivre | 19 | 5 (dont 3 grisées) |
| petit moteur | 18 | 1 (grisée) |
| barre de métal | 12 | **13**, surtout chez les 🔥, et 5 meubles |
| chute d'aluminium | 11 | **0** |
| petit ressort | 11 | 4 |
| aimant | 9 | **0** |
| LED, cellules lithium | 9 chacune | 2 et 1 |
| caoutchouc | 9 | 3 |
| verre | 8 | **0** |
| dynamo de vélo | 2 | **0** |

### 1.2 Les propositions

| # | Proposition | Pourquoi |
|---|---|---|
| N2-01 ✅ | **À partir du niveau 2**, les meubles et les armes demandent surtout des **matières de récupération** démontées ; les matériaux de la nature (pierres, branches, bûches, glaise) restent ceux de la maison, du niveau 1 et des futurs murs et sols | Le joueur a accumulé du rebut ; R21 est en défaut (l'aluminium, l'aimant, le verre n'ont aucune recette) ; R4 : la survie reste faite de nature |
| N2-02 ✅ | Créer une matière de base : le **tube d'aluminium** (un montant, un profilé creux), distinct de la **chute d'aluminium** (de l'aluminium aplati). Il sert aux structures légères, qui ne chauffent pas et ne portent pas de charge sur un axe | Il épargne les barres de métal, dont les 🔥 ont besoin. R21 : il sert à sept recettes au moins (§2, §3, §4) ; R38 : on n'écrit jamais « aluminium » seul |
| N2-03 ✅ | **Ce qui reste à l'acier** : ce qui se forge ou se trempe (lames, rivets), ce qui touche le feu de la forge (la tuyère), les axes chargés (le pignon du cranequin), la vis d'une presse | L'aluminium fond à 660 °C et il est mou |
| N2-04 ✅ | Les objets qui donnent des **tubes d'aluminium** en se démontant : le **parasol** (1 tube au lieu d'1 barre), la **débroussailleuse** (1 tube au lieu d'1 barre), la **trottinette d'enfant** (1 tube et 3 chutes, au lieu de 4 chutes), la **perche à selfie** (1 tube au lieu d'1 chute) | Ce sont de vrais tubes d'aluminium. R41 : ce sont des déchets courants, présents dès le niveau 1 |
| N2-05 ✅ | Ajouter deux vestiges qui donnent des tubes : l'**échelle en aluminium** (4 tubes ; dans l'atelier et le hangar de la Coopérative, l'atelier du garage de la station, l'atelier du Moulin) et la **chaise de camping** (2 tubes, 1 chiffon ; dans le jardin de la ferme de la station, sur les berges du gué) | Pour en trouver environ 13 par partie complète du niveau 2 |
| N2-06 ✅ | Les **haltes ne changent pas** (pierres, bûches, branches, glaise, barres de H2A en vrac) | Décision du porteur (2026-10-14) |

---

## 2. Les meubles du niveau 2 (les évolutions décidées)

### 2.1 Une question laissée ouverte

| # | Proposition | Pourquoi |
|---|---|---|
| N2-07 ✅ | **Fermer C12** : l'établi reste sur la route B au niveau 2 (L1B puis L2B) ; il devra changer de route au niveau 3. Rec. : oui | Le repère « jamais trois fois la même route » tient ; 4 lignées communes sur 5 changent de route |

### 2.2 Les matériaux, repris avec la récupération (une ligne par meuble)

| # | Évolution | Aujourd'hui | Proposé | D'où vient l'idée |
|---|---|---|---|---|
| N2-08 ✅ | Réserve couverte | 4 perches, 4 pierres, 1 poignée de clous | 4 **tubes d'aluminium**, 1 rouleau de **fil de fer**, 1 poignée de clous | Une ossature de tubes ligaturés sous les tôles |
| N2-09 ✅ | Abri doublé | 4 branches | 1 **bâche**, 4 **chiffons** | Une couche étanche, puis le bourrage |
| N2-10 ✅ | Lanterne fixe | 2 branches, huile | 1 **tube** (la potence), 2 **chutes d'aluminium** (le réflecteur), huile | Le réflecteur renvoie la lumière vers le sol |
| N2-11 ✅ | ⚡ Poste de montage | 1 fil de cuivre, 1 résistance | les mêmes, + 1 **aimant**, 2 **plastique** | Une « troisième main » aimantée, un plan isolant |
| N2-12 ✅ | ⚙️ Roulements montés | — | — (inchangé) | |
| N2-13 ✅ | Four de terre | 6 pierres, 4 branches, 4 glaises | 4 glaises, 2 pierres, 6 **bouteilles en verre** | Une vraie technique : un lit de bouteilles sous la sole isole le four |
| N2-14 ✅ | Récupérateur à jerrican | 2 branches | 2 **caoutchouc** (le tuyau), 1 **plastique** (l'entonnoir) | Le tuyau va de la gouttière au jerrican |
| N2-15 ✅ | Établi de menuisier | 2 bûches | 2 bûches (le plateau), **1 barre** (la vis de presse), 1 poignée de clous | Le plateau reste en bois ; la vis reste en acier |
| N2-16 ✅ | Cloche d'alarme | 1 corde, 3 branches | 2 **tubes** (la potence), 1 rouleau de **fil de fer**, 1 **petit ressort** (le rappel du battant) | Le fil de fer porte plus loin que la corde |
| N2-17 ✅ | 🔥 Forge ventilée | 6 pierres, 2 glaises, 1 barre | 3 pierres, 2 glaises, **1 barre** (la tuyère) | Le foyer reste en pierre et en glaise : il doit tenir 1 300 °C |

**Barres de métal** pour les dix meubles : **2** (l'établi, la forge), au lieu de 1 aujourd'hui et de 14 dans la première idée. **Tubes** : 7.

### 2.3 Les quatre sources de chaque clé (une ligne par clé)

**Décision du porteur (2026-10-14) : pas de repli** (« une complexité en plus à gérer ») : le joueur trouve l'objet-clé, sinon il l'achète au Comptoir. La colonne « Repli » ci-dessous est **abandonnée** ; restent le délai de retour, la chance et le Comptoir.

**Décidé aussi (2026-10-14)** : les **replis du niveau 1** (déjà codés en 0.8 : grillage, cocotte, toile de jute, seau, feuillards…) sont **à retirer** du code ; au Comptoir, tout objet-clé est **toujours disponible après une première visite de son lieu**, sans rupture de stock, à son prix ; le **fer à souder** n'a pas de version pauvre (exception à R23). Les délais de retour ci-dessous sont acceptés.

*Pour toutes les clés : **par chance**, rare à H2A, à H2B et dans l'autre L2, puis plus courante à partir du niveau 3 (R-BUTIN). **Comptoir** : oui, après une première visite du lieu (R9).*

| # | Clé (lieu) | Garantie, revient | Repli proposé (moins bon) |
|---|---|---|---|
| N2-18 ✅ | Tôles ondulées (L2A) | 4 jours | Une réserve bâchée : 4 bâches à la place des tôles, 300 kg au lieu de 400 |
| N2-19 ✅ | Couvertures de laine (L2A) | 24 h | 4 sacs de toile de jute (L1B) : sommeil × 1,4 au lieu de × 1,6 |
| N2-20 ✅ | Lanterne-tempête (L2A) | 4 jours | Une lanterne à bocal (un bocal, un chiffon, l'huile ou la graisse de volaille) : 8 m au lieu de 14, à rallumer chaque nuit |
| N2-21 ✅ | ⚡ Fer à souder (L2A) | 4 jours | Un fer de fortune : une pointe de cuivre chauffée au feu (Souder 1, deux fois plus lent) ; la « version pauvre » du premier outil d'une qualité (R23) |
| N2-22 ✅ | ⚙️ Boîte de roulements (L2A) | 4 jours | Des paliers de bois dur graissés : − 15 % d'effort au lieu de − 30 %, ni cranequin ni meubles du §4.5 |
| N2-23 ✅ | Porte de four en fonte (L2B) | 4 jours | Une pierre plate en guise de porte : bois × 0,7 au lieu de × 0,5 |
| N2-24 ✅ | Jerrican de 20 L (L2B) | 24 h | Aucun : le seau de 10 L suffit à vivre (R4) |
| N2-25 ✅ | Rabot (L2B) | 4 jours | Aucun : on ne rabote pas au couteau (déjà admis) |
| N2-26 ✅ | Cloche de bronze (L2B) | 4 jours | Un gong : une jante ou un tuyau de fer pendu au fil, entendu à 25 m au lieu de 40 |
| N2-27 ✅ | 🔥 Soufflet de forge (L2B) | 4 jours | Un soufflet de fortune (chiffons et planches) : la forge chauffe, mais il faut pomper, comme au foyer de forge |

### 2.4 Les noms et le bois

| # | Proposition | Pourquoi |
|---|---|---|
| N2-28 ✅ | Garder « **lanterne-tempête** » pour la clé, distinct de la « lanterne à dynamo » du kit des Mécaniste ; jamais « lanterne » seul dans les textes | R38 |
| N2-29 ✅ | Mettre le **tas de bois personnel de H2B** (10 bûches, revient en 6 h), remis au niveau 2 par B15 | Le 🔥 demande encore 2 à 3 allers-retours de bois (les meules) |

---

## 3. Les armes fabriquées

### 3.1 Le tableau

| # | Proposition | Pourquoi |
|---|---|---|
| N2-30 ✅ | Mettre les lignes « Armes » du tableau maître aux chiffres décidés : machette forgée ★★★ **2,5** (au lieu de 1,5), hache forgée ★★★ **3,0** (au lieu de 2) | Les lignes datent d'avant K1–K56 |

### 3.2 Le ★★★ des Mécaniste ne passe pas par leur clé (constat)

Dans le code, l'arbalète ★★★ demande l'arc d'arbalète en if, fait à l'**établi de menuisier** (L2B), alors que la clé ⚙️ est à **L2A** ; et le cranequin du code ne réarme que l'arbalète lourde (niveau 3). Le « cranequin léger » de P9 n'existe pas. Seul, un Mécaniste qui ne va qu'à L2A n'a pas son ★★★ (R14, K6 en défaut).

| # | Proposition | Pourquoi |
|---|---|---|
| N2-31 ✅ | L'**arc d'arbalète en if** se façonne à l'**établi à étau** (niveau 2, L1B), et non plus à l'établi de menuisier | L'if est à L1B, sur une route de rang < 2 (R3) |
| N2-32 ✅ | Un arc en if ne se bande pas à la main : **monter l'arbalète ★★★ demande un cranequin léger** | C'est vrai historiquement ; la clé ⚙️ ouvre alors la marche du ★★★, et la grille reste tenue |
| N2-33 ✅ | Créer le **cranequin léger** (P9) : 1 roulement, 1 chaîne de vélo, 1 barre ; Serrer 2 ; au pédalier équipé des roulements montés ; il réarme l'arbalète en **2 s au lieu de 3**. Le cranequin actuel garde l'arbalète lourde (niveau 3) | P9 et Q-A1a étaient décidés, pas codés |
| N2-34 ✅ | Après N2-31 à N2-33, **rejouer le garde-fou** pour l'arbalète ★★★ (trois Errants à 15 m : 8,5 → 6,5 s) | R30 |

### 3.3 Les matériaux des armes, repris avec la récupération

| # | Arme | Proposé | D'où vient l'idée |
|---|---|---|---|
| N2-35 ✅ | 🔥 Machette, hache forgée, glaive ★★★ | Le manche n'est plus une branche et de la ficelle : il est tourné de **caoutchouc** (une chambre à air) | Une pratique réelle : la poignée ne glisse plus |
| N2-36 ✅ | ⚡ Contacts soudés | Le gourdin est remplacé par **1 tube d'aluminium** et **1 plastique** (l'isolant) | Ce qu'est une vraie matraque |
| N2-37 ✅ | ⚡ Pack soudé de 24 Wh | Cellules lithium et fil de cuivre, + **1 LED** de témoin : le pack montre ce qui lui reste | Un usage pour les LED |
| N2-38 ✅ | ⚙️ Arbalète ★★★ | Un arbrier en **1 tube d'aluminium**, plus léger que le frêne | Un usage pour le tube |
| N2-39 ✅ | ⚙️ Carreaux du niveau 2 | Un empennage de **plastique** découpé dans une bouteille, au lieu des plumes | Ça se fait vraiment |

### 3.4 Ce qui reste à trancher

| # | Question | Recommandation |
|---|---|---|
| N2-Q1 ✅ | **L'arbalète lourde** : « pas avant L2 » au livre, L3 aux décisions, C9 « plus tard » | La laisser à L3 : le niveau 2 a le cranequin léger |
| N2-Q2 ❌ (le porteur : « il faudra trouver une solution de repli ») → N2-61 | **Q-B1** : l'arc simple ★★★ et l'arbalète d'if ★★★ | L'arbalète d'if : réglée par N2-31 et N2-32. L'arc simple ★★★ : avec la corde de boyau, qui attend les lapins chassables (0b) |

---

## 4. Les nouveaux meubles du niveau 2

### 4.1 Comment ils s'ouvrent (sans nouvelle clé)

Les nouveaux meubles **ne demandent aucune clé** (R11 : une seule clé par famille et par niveau ; le compte de 5 et 5 reste). Ils demandent seulement des matières de récupération, un outil et **le meuble d'avant posé** (R1) :

- **un meuble de famille** demande l'installation de famille du niveau 2 : la forge ventilée 🔥, le poste de montage ⚡, les roulements montés ⚙️. La clé de famille ouvre donc **l'accessoire et ces meubles** (R14 : une marche visible, seule) ;
- **un meuble du tronc commun** n'a pas de meuble d'avant : voir N2-Q3.

**Les Mécaniste sont favorisés** : trois meubles, contre deux aux ⚡ et un aux 🔥, plus les poulies que les 🔥 leur fonderont (§4.2). C'est un écart voulu à K15 (« même nombre de crans de métier »), demandé par le porteur.

| # | Question | Recommandation |
|---|---|---|
| N2-Q3 ✅ oui | Comment les meubles du tronc commun **n'apparaissent-ils qu'au niveau 2** ? (a) Ils apparaissent dans la liste après la **première visite d'un lieu du niveau 2** ; (b) chacun demande un meuble du niveau 2 déjà posé ; (c) aucune barrière : on les fait dès qu'on a la matière | **(a)** : simple, et ça ne crée pas de dépendance à une route |

### 4.2 Le tronc commun (pour tous)

| # | Meuble | Matières · outil | Ce qu'il change | Coût de développement |
|---|---|---|---|---|
| N2-40 ✅ | **Cuiseur solaire** (une boîte à réflecteurs) | 4 **chutes d'aluminium** (les réflecteurs), 1 **verre** (la vitre), 4 **papier** (l'isolant), 1 boîte vide · Couper 1 | Au **soleil**, il fait bouillir l'eau et cuit un plat **sans bois**, lentement (1 L en ≈ 2 h de jeu) ; à moitié par temps voilé, rien sous la pluie. Le bois du feu baisse. Il existe vraiment et atteint 100 à 150 °C | S (la météo connaît déjà le soleil) |
| N2-41 ✅ | **Bacs de tri** | 3 **jerricans percés** (coupés), 1 **aimant** (il sépare le fer de l'aluminium), 1 **tube** · Couper 1 | À moins de 3 m, **démonter va deux fois plus vite** et rend **une matière de plus un démontage sur trois** (rien ne se perd au tri). Le tri sélectif de l'Abondance, enfin utile | S |
| ~~N2-42~~ ❌ | ~~**Barricade de chariots**~~ *(refusée, 2026-10-14)* | 2 **chariots de supermarché** entiers, 1 rouleau de **fil de fer** · aucun outil | Elle **barre un passage** de 3 m : les Éteints la contournent ou la secouent, et elle s'use (Book 06 §9.1). Les chariots sont posés entiers : on épargne leurs 6 barres | M à L (les Éteints doivent la contourner) |

### 4.3 🔥 Les Charbonniers (avec la forge ventilée)

| # | Meuble | Matières · outil | Ce qu'il change | Coût |
|---|---|---|---|---|
| N2-43 ✅ | **Creuset et moules** (accessoire de la forge ventilée) | 4 **glaises** (le creuset et les moules de terre cuite), 2 pierres · Marteler 1 | La forge ventilée fond l'aluminium (660 °C) : **4 chutes → 1 poulie d'aluminium** (pour les ⚙️, §4.5) ou **1 lingot** (il se vend au Comptoir). Enfin un débouché pour les chutes | S à M |

### 4.4 ⚡ Les Voltaïques (avec le poste de montage)

| # | Meuble | Matières · outil | Ce qu'il change | Coût |
|---|---|---|---|---|
| N2-44 ✅ | **Rampe de LED** | 10 **LED**, 2 **fils de cuivre**, 1 **tube** (le support), 1 pack · Souder 1 | Elle éclaire **20 m** autour de la base, sans flamme (la lanterne fixe : 14 m), et consomme ≈ 25 Wh par nuit (3 W pendant 8,5 h) : la batterie se vide si le banc ne l'a pas rechargée | S |
| N2-45 ✅ | **Batterie de cellules** | 12 **cellules lithium**, 4 **fils de cuivre**, 1 **plastique** (le boîtier) · Souder 1 | Elle garde **≈ 120 Wh** à la base (12 cellules d'environ 10 Wh), au lieu de packs de 12 ou 24 Wh : le soleil d'une journée sert la nuit (la rampe, la clôture) | M (le stockage de la base) |

### 4.5 ⚙️ Les Mécaniste (avec les roulements montés)

| # | Meuble | Matières · outil | Ce qu'il change | Coût |
|---|---|---|---|---|
| N2-46 ✅ | **Charrette à bras** | 2 **roues de vélo** (des moyeux grippés, sur lesquels on remonte 2 roulements neufs), 4 **tubes**, 2 bûches (le plateau) · Serrer 2 | **+ 100 kg** roulés (la brouette : + 60). Une seule sortie au lieu de deux pour les pierres et la glaise du niveau 2. Elle se prête ou se vend aux autres familles | M |
| N2-47 ✅ | **Moulin de jerricans** (une éolienne Savonius) | 2 **jerricans percés**, coupés en deux (les godets), 3 **tubes** (le mât), 1 roulement (le pied du mât), 1 **petit moteur** (la génératrice) · Serrer 2 | **Quand il vente**, il produit **10 à 20 W**, même hors ligne (Book 01 §2 bis) : du courant pour un pack ou la batterie, **par mauvais temps, quand le panneau du Voltaïque ne donne rien**. Avec une **poulie d'aluminium** (🔥), il entraîne directement la meule ou le tour (les 30 % que perd la génératrice) ; sans poulie, une roue de vélo fait poulie (R36) | M (il faut le vent : N2-Q4) |
| N2-48 ✅ | **Arbalète de garde** (un piège) | 1 **arbalète** (de n'importe quelle étoile), 1 **tube** (le support), 1 rouleau de **fil de fer** (le fil tendu), 1 **petit ressort** (la détente) · Serrer 1 | Posée, elle **tire un carreau** sur l'Éteint qui coupe le fil, avec les dégâts de l'arbalète montée ; elle se réarme au cranequin léger (2 s). Le piège le plus fort de la famille | S à M (les pièges existent) |

*Les roulements* : la boîte en contient 3. Le cranequin léger en prend 1, la charrette 2, le moulin 1 : un Mécaniste qui veut tout ramène **deux boîtes** (la boîte revient en 4 jours, ou elle se trouve par chance au niveau 3).

| # | Question | Recommandation |
|---|---|---|
| N2-Q4 ✅ oui | **Le vent n'existe pas** dans la météo (soleil, voilé, couvert, pluie). Pour le moulin : (a) on le déduit du temps (couvert et pluie : venteux ; voilé : un peu ; soleil : calme) ; (b) on ajoute le vent à la météo (Book 13) | **(a)** : peu coûteux, et le moulin complète ainsi le panneau solaire |
| N2-Q5 ✅ oui | L'arbalète de garde tire-t-elle **sur un joueur** qui coupe le fil ? | Non, tant que le duel entre joueurs n'est pas codé (`duel-entre-joueurs.md`) |
| N2-Q6 ⏳ plus tard | **Plus tard, pas au niveau 2** : un **palan à poulies** ⚙️ (les poulies d'aluminium) pour monter les charges des futurs murs | À garder pour les murs |

### 4.6 Ce que les nouveaux meubles règlent

- **R21** : la chute d'aluminium (cuiseur, réflecteur, creuset), le verre (cuiseur, four), l'aimant (bacs, poste), le petit moteur (moulin), les LED (rampe, pack), les cellules (batterie) et le jerrican percé (bacs, moulin) ont enfin un usage.
- **Les barres** : aucun nouveau meuble n'en demande.
- *La barricade refusée, les deux chariots ne servent plus : ils restent des vestiges qu'on démonte (3 barres, 2 caoutchoucs).*
- **Les Mécaniste** ont désormais du courant **sans pédaler** (le moulin), un **portage** à eux (la charrette), un **piège** qui tue (l'arbalète de garde), et une **commande** naturelle aux 🔥 (les poulies).

---

## 5. Les armes trouvées (une par L2, de même rang)

| # | Proposition | Pourquoi |
|---|---|---|
| N2-49 | **L2A** : une arme trouvée **contondante et lourde**, à **3,2** au torse ; elle tue à la tête et passe le casque ; coup lent (≈ 1 s) ; **solidité 50**, ou trouvée déjà abîmée ; une seule fois, sans étoiles, elle ne se refait pas | Le repère du §3.c : le haut de la bande 2 – 3 ou au-dessus, mais l'usure en contrepartie (R31) ; elle doit dépasser la masse (2,5) |
| N2-50 ❌ (le porteur : une arme qui n'existe nulle part ailleurs dans le jeu) → N2-62 | **L2B** : une arme trouvée **perçante et longue**, à **3,2** ; elle tue à la tête ; allonge **2,4 m** ; **solidité 50** ; mêmes règles | Même rang que celle de L2A (R13, R31) ; elle continue la fourche sur la route B |
| N2-51 | L'objet et son nom se choisiront **avec le lieu**, d'un vestige crédible ; pas d'arme à feu ; un nom qui n'existe pas encore | R38, R43 |
| N2-Q7 | Au niveau 1, la route A a la masse (2,5) et le pied-de-biche (1,5), la route B la fourche (1,5) : pas le même rang. On corrige ? | Laisser en l'état (PLAN-0.8) ; au niveau 2, même rang |

---

## 6. Les Éteints (la condition des armes ★★★)

| # | Proposition | Pourquoi |
|---|---|---|
| N2-52 ❌ (le porteur : « un Éteint est un Éteint », on ne change pas sa résistance ; à la limite, de nouveaux Éteints) → N2-63 | À L2, un Errant résiste à **≈ 5** au torse (contre 3), un Équipé à **≈ 6,8** (contre 4) | NOT-Q5 : deux coups au torse avec une arme à 2,5 |
| N2-53 ❌ (le porteur : pas de chiffre fixé d'avance ; un plafond donné par les capacités de l'appareil du joueur) → N2-65 | **24 Éteints au plus** par lieu L2, avec une part d'Équipés plus forte qu'à la Coopérative | R42 ; le casque arrête le tranchant à la tête |

---

## 7. L'ordre proposé pour trancher

1. N2-01 à N2-06 (le principe et le tube d'aluminium) ;
2. N2-07 à N2-17 (C12 et les matériaux des meubles), puis N2-18 à N2-29 (les clés, le bois) ;
3. N2-30 à N2-39 et N2-Q1, N2-Q2 (les armes) ;
4. N2-Q3, puis N2-40 à N2-48 et N2-Q4 à N2-Q6 (les nouveaux meubles) ;
5. N2-49 à N2-51 et N2-Q7 (les armes trouvées) ;
6. N2-52 et N2-53 (les Éteints) ;
7. MS-Q1 à MS-Q8, puis MS-01 à MS-09 (les murs et les sols).

---

## 8. Les murs et les sols (niveaux 1 et 2)

### 8.1 Ce que le porteur a fixé (2026-10-14)

- **Le mur de branches** (niveau 1) et **le mur de planches** (niveau 2).
- Ils se posent **d'une intersection à l'autre de la grille de 1 m** (le côté d'un carré de 1 m).
- **Ils apparaissent dès la première visite d'un lieu de leur niveau**, haltes comprises : le mur de branches après la première visite de H1A, H1B, L1A ou L1B (en pratique, la station, pendant le tutoriel) ; le mur de planches après la première visite de H2A, H2B, L2A ou L2B.
- **Le mur de branches** se pose sur le **sol nu**.
- **Le mur de planches** se pose **au bord d'un plancher de bois ou d'un sol de pierres** (faits de planches ou de pierres).

Ces murs et ces sols ne demandent **aucune clé** : ce sont des éléments de construction, pas des lignées (le compte de 5 et 5 ne bouge pas). Ils utilisent les **matériaux de base des haltes**, comme l'a voulu le porteur.

### 8.2 Ce qu'il faut ajouter pour que le cadre marche : les sols

| # | Élément | Matières · outil (pour 1 m²) | Quand | Pourquoi |
|---|---|---|---|---|
| MS-01 ✅ | **Plancher de bois** | **3 planches fendues**, rien d'autre (décision du porteur) · Marteler 1 | Avec le mur de planches | Le mur de planches en a besoin ; les planches fendues existent (1 bûche → 2 planches, à l'établi à étau) |
| MS-02 ✅ | **Sol de pierres** (un dallage à sec) | 4 **pierres** · Creuser 1 (égaliser le sol) | Avec le mur de planches | L'autre sol du cadre ; les pierres des haltes (H1B, H2B) y trouvent leur usage durable |

### 8.3 Les murs

| # | Élément | Matières · outil (pour 1 m) | Où il se pose | Pourquoi |
|---|---|---|---|---|
| MS-03 ✅ | **Mur de branches** (un clayonnage : deux piquets, des branches tressées) | 6 **branches**, 1 ficelle · Couper 1 | Sur le sol nu (et, si MS-Q4 : aussi sur un sol) | Les branches repoussent sur le terrain (34, en 40 min) et aux haltes : un mur de 3 × 3 m (12 m) coûte 72 branches, une après-midi de ramassage |
| MS-04 ✅ | **Mur de planches** | **4 planches fendues**, rien d'autre (décision du porteur) · Marteler 1 | Sur le bord d'un plancher de bois ou d'un sol de pierres | Un mur de 3 × 3 m coûte 48 planches, soit **24 bûches** et 24 passages à l'établi à étau : c'est le grand chantier du niveau 2, nourri par le bois des haltes (le tas personnel de H2B, N2-29) |
| MS-05 ✅ | Les **planches rabotées** (établi de menuisier, L2B) donnent un mur et un plancher **plus solides** (+ 50 % de solidité), sans autre effet | | | Elles existent déjà au tableau (I20) ; le menuisier gagne un usage visible |

### 8.4 Les ouvertures

| # | Élément | Matières · outil | Où | Pourquoi |
|---|---|---|---|---|
| MS-06 ✅ | **Claie** (une porte de branches tressées, sur deux liens de corde) | 6 branches, 1 corde · Couper 1 | À la place d'un mètre de mur de branches | Une pièce fermée sans porte n'a pas de sens |
| MS-07 ✅ | **Porte de planches** : c'est la « porte » déjà prévue à l'établi de menuisier (I20), qui se pose à la place d'un mètre de mur de planches | (la recette du menuisier) | Mur de planches | Elle existe au tableau ; on lui donne sa place |

### 8.5 Le démontage et la technique

| # | Proposition | Pourquoi |
|---|---|---|
| MS-08 ✅ | **Démonter** un mur ou un sol rend la moitié des matériaux naturels (branches, pierres, bûches) et tous les objets fabriqués (planches, clous), comme les meubles | Book 24 §2.4 |
| MS-09 ✅ | Les murs et les sols sont **dessinés en lots** (un seul appel de dessin par sorte, comme les arbres en BatchedMesh) ; plafond proposé : **200 éléments** par terrain, à remesurer sur l'iPhone 13 mini | R42 (≤ 40 appels de dessin) ; mesure de 2026-10-09 |

### 8.6 Les questions à trancher

| # | Question | Recommandation |
|---|---|---|
| MS-Q1 ✅ oui | « Sur les intersections » : le mur va **d'une intersection à la voisine** (un côté de carré de 1 m) ? La grille de pose actuelle est de 50 cm : les murs n'utiliseraient qu'un nœud sur deux | Oui, un côté de 1 m ; les meubles gardent leur grille de 50 cm |
| MS-Q2 ✅ oui | **Où** pose-t-on des murs : sur son terrain seulement, ou aussi aux haltes et dans les lieux ? | Sur son terrain seulement (les haltes sont partagées, les lieux L se réinitialisent) |
| MS-Q3 ✅ oui | Le mur **arrête-t-il** les joueurs et les Éteints ? Les Éteints l'abîment-ils ? | Il arrête tout le monde ; les Éteints le contournent, ou s'acharnent sur lui : le **mur de branches cède** (un Errant le passe en ≈ 20 s), le **mur de planches tient** plus longtemps. C'est une défense au sens du Book 06 §9.1 : elle seule s'abîme. **À coder avec soin** : il faut que les Éteints cherchent un passage |
| MS-Q4 ✅ oui | Un **mur de branches** peut-il aussi se poser sur un sol de pierres ou un plancher ? | Oui : « sur le sol nu » veut dire qu'il n'a pas besoin de sol, pas qu'un sol l'interdit |
| MS-Q5 ✅ oui | **Le bord** d'un sol : le mur de planches est accepté si **au moins un** des deux carrés qu'il sépare a un sol ? | Oui : on peut ainsi fermer une pièce par son pourtour |
| MS-Q6 ✅ oui | **La hauteur** : le mur de branches à hauteur d'épaule (≈ 1,5 m, on voit par-dessus), le mur de planches à ≈ 2,2 m (il cache) ? | Oui : le mur de planches donne une vraie pièce ; le toit et le calcul thermique (Book 10 §7.1) viendront plus tard |
| MS-Q7 ✅ oui | Les **sols** apparaissent-ils avec le mur de planches (première visite d'un lieu du niveau 2), ou le sol de pierres dès le niveau 1 ? | Les deux avec le mur de planches : ils servent à le poser |
| MS-Q8 ✅ | **Les meubles** peuvent-ils se poser sur un plancher ou un sol de pierres ? Et le feu ? | **Décision du porteur** : les meubles **sans feu** se posent sur un sol de pierres ou un plancher ; les meubles **avec feu** (feu de camp, foyers, four, forge, charbonnière…) se posent **sur la terre nue** seulement |

---

## 9. Les lieux L2 et le scénario pour arriver aux objets-clés

**Décidé par le porteur (2026-10-14)** : les deux lieux du niveau 2 sont **le Grand Hôtel des Flots** (`batiment/grand-hotel`) et **le phare du cap** (`batiment/phare`) ; leur route (A ou B) et la répartition des objets-clés restent à voir. Pour eux, **pas de clé qui ouvre une porte** : un **mécanisme propre au lieu** (R49 élargie dans la notice). Le parcours imposé, la partie du fond, la sortie à sens unique et la remise à zéro en 24 h restent.

### 9.1 Le phare : « Le feu et le cargo » ✅, avec la corne de brume en leurre ✅

1. **Monter** : l'escalier en fonte s'arrête net à 3 m ; on comble le vide avec l'escabeau (porté), ou en grimpant à la colonne des poids.
2. **Le feu** : remonter du pétrole de la cuve à pompe et un prisme tombé au pied de la tour, que la lentille fendue attend (31 m de marches : choisir ce qu'on porte).
3. **Allumer, la nuit seulement** : la lanterne attire les Éteints, le chemin des douaniers se remplit ; il faut tenir la tour deux ou trois minutes réelles. **La corne de brume** (le compresseur réparé) les détourne vers la falaise.
4. **Le cargo** : un porte-conteneurs de l'Abondance, sans équipage, sur pilote automatique, qui fait toujours sa « livraison du jour », prend le phare pour le port et s'éventre sur les rochers de la crique ; ses conteneurs ouverts sont la partie du fond (les objets-clés).
5. **Le sens unique** : la rampe du canot, au tronçon effondré (on saute, on ne remonte pas) ; on ressort par la grève de galets.
6. **24 h** : la mer emporte l'épave ; la « livraison du jour » ramène un autre cargo.

Décidé aussi : **le phare ne se joue que la nuit** (de jour, on prépare la montée et le pétrole, ou l'on attend : une nuit dure 8,5 min réelles).

### 9.2 Le Grand Hôtel des Flots : « Le check-in » ✅

1. **Le hall** : le grand escalier est effondré ; seul l'ascenseur à grille, bloqué entre deux étages, mène aux étages, avec une carte de chambre.
2. **Le courant** : brancher sur la borne « Check-in par sourire » la batterie du panneau « Zéro-Effort » de la promenade, ou le pack d'un Voltaïque.
3. **Le sourire** : la borne refuse le joueur (« sourire non reconnu ») ; seul le robot-serveur ensablé de la salle à manger est reconnu : le dégager du sable (Creuser) et porter sa tête devant la borne, qui remet la carte de la chambre 7.
4. **Les étages** : l'ascenseur monte aux chambres et à la suite (les objets-clés) ; les clients du « Séjour Zéro-Effort » se relèvent de leurs lits.
5. **Le sens unique** : le balcon effondré sur la dune (on saute), ou les draps noués de la lingerie (on ne remonte pas).
6. **24 h** : la carte expire (« votre séjour est terminé »), le robot reprend sa place.

### 9.3 Ce qui reste à voir (plus tard, sans se focaliser sur les lieux)

- La route de chacun (A ou B) et les objets-clés qu'il garde ; l'égalité des deux routes (même danger, même longueur de parcours) ;
- les modèles : l'épave du cargo et la crique (phare), un étage (hôtel) — demandes à faire à la session des bâtiments ;
- le phare est noté « lointain » dans sa fiche : sa place sur la carte.

---

## 10. Les haltes du niveau 2, sur le thème côtier (propositions)

*Modèles lus dans `batiment/` (FICHE : récit, repères, fouilles). Les thèmes de matière restent ceux décidés (I14, I15) ; les haltes gardent les matériaux de base (N2-06).*

### 10.1 Les candidates

| Halte | Environnement · anneau · danger | Ce qu'elle a pour « électrique et atelier » (H2A) | Ce qu'elle a pour « pierre, terre, bois » (H2B) |
|---|---|---|---|
| **La route du pont** (`halte-route-pont`) | Estuaire · proche → moyen · 3 | Fort : portique « Pont connecté » et borne « Pont Express » (batterie), drone livreur (cellules, petit moteur), camionnette de livraison (chargeurs, gadgets), moteur hors-bord du hangar (la bobine), voiture brûlée (ressorts, ferraille), grue de quai (câble, poulie), trottinettes et caddies échoués dans la vase (tubes, chutes, roues), huile et goudron | Moyen : quais de pierre, vase, pieux du ponton |
| **La corniche du Cap Rouge** (`halte-corniche`) | Falaise sur la mer · moyen → lointain · 3 | Faible : pompe connectée, écran domotique de la villa, ampoules et piles | Fort pour la pierre et le bois : l'éboulement et les murets, les pins d'Alep et les pins parasols ; les chambres du Panoramique (chiffons). **Pas de glaise** |
| **La digue des Roselières** (`halte-digue`, pressentie pour H2B) | Marais · proche → moyen · 2 | Moyen : station de pompage (câbles, courroies), poteaux tombés (cuivre), borne WattyVélo (cellules), fourgon Watty | Le meilleur : enrochements, **argile grise** de la brèche, saules, roseaux. Mais ce n'est pas la côte |

### 10.2 Les propositions

| # | Proposition | Pourquoi |
|---|---|---|
| N2-54 ✅ | **H2A = la route du pont** (l'estuaire), sur la route qui mène au **Grand Hôtel des Flots** | Le thème « électrique et atelier » y est entier ; son panneau mène déjà à la Côte des Flots et à la station balnéaire |
| N2-55 ✅ | **H2B = la corniche du Cap Rouge**, sur la route qui mène au **phare** | Pierre et bois en quantité ; son panneau dit déjà « Cap du Phare → ». La glaise se prend au gué (H1B), sur la même route B : un croisement écrit (R20) |
| N2-56 ✅ | **Ce que la proposition entraîne** : l'hôtel est sur la route A et le phare sur la route B. Les objets-clés se répartiront ensuite (le cargo du phare peut porter n'importe lequel) | La halte fixe la route de son lieu |
| N2-57 ✅ | **La bobine d'allumage** (I12) se trouve sur le **moteur hors-bord** du hangar de la route du pont (et sur une mobylette échouée dans la vase) | I12 la plaçait à H2A, sur une épave de mobylette |
| N2-58 ✅ | **Pièges** (R15, R19) : les fouilles des deux haltes montrent des **lampes-tempête** et des **couvertures**, qui sont des clés de L2. Dans les haltes : la lampe-tempête reste du décor ou une trouvaille **rare** ; les couvertures sont **synthétiques** (« couverture polaire »), jamais « de laine » | Une clé ne traîne pas avant son lieu |

### 10.3 Les moments de jeu (R50), deux ou trois par halte

| Halte | Moment | Ce que fait le joueur | Coût | Recommandé |
|---|---|---|---|---|
| Route du pont | **La brèche** | Traverser les planches au-dessus du vide, un par un, à 8 m au-dessus de l'eau | S (le goulet existe) | ✅ |
| | **Le péage des survivants** | À la chicane : payer une conserve, ruser ou forcer le passage | M | ✅ |
| | **La marée** | À marée basse, les bancs de vase se découvrent : on y fouille les trottinettes et les caddies échoués (les tubes d'aluminium) ; à marée haute, ils sont sous l'eau | M | ✅ |
| | La voiture suspendue | Prendre le sac sur la banquette, au-dessus du vide | S | |
| Corniche | **L'éboulement** | Le ruban de 2,5 m au-dessus de 15 m de vide | S (le goulet existe) | ✅ |
| | **Le tunnel des pillards** | « Passage : 1 conserve par tête » : payer, ruser ou forcer | M | ✅ |
| | **Le pin tombé** | Débiter le pin d'Alep tombé : c'est le **tas de bois personnel** de H2B (N2-29) | S | ✅ |
| | La voiture dans le pin | Y descendre à la corde | S | |

| # | Question | Recommandation |
|---|---|---|
| N2-Q8 ✅ la corniche | Strictement côtier (la corniche pour H2B), ou le meilleur thème de matière (la digue, prévue depuis la 0.8, mais dans les marais) ? | **La corniche**, pour la côte et le lien avec le phare ; la digue reste pour un autre niveau |
| N2-Q9 ✅ (réglée par N2-Q11 : les deux péages suivent la même règle simple) | Les deux péages de survivants (le pont, le tunnel) se ressemblent : on en garde un seul ? | Garder le péage du pont ; au tunnel, un autre moment (la nuit, les pillards dorment : passer sans bruit) |
| N2-Q10 ✅ mêmes distances | La route B (corniche, phare « lointain ») est plus longue que la route A (pont, hôtel « moyen ») | Garder les mêmes distances sur la carte (B16), comme au niveau 1 ; les anneaux des fiches restent indicatifs |

### 10.4 Décisions du porteur (2026-10-14) et suite

- **N2-Q8** : on garde **la corniche** pour H2B. **N2-Q10** : **les mêmes distances** sur les routes A et B.
- **Le péage des survivants, simple** : on passe en **donnant des objets d'une valeur en wotts** fixée.

| # | Proposition | Pourquoi |
|---|---|---|
| N2-59 ✅ | Le péage demande **12 wotts d'objets** par personne (la valeur d'une conserve au Comptoir), comptés au **prix du Comptoir** ; les ordures (0 wott) ne comptent pas ; on choisit soi-même ce qu'on donne | Simple, lisible, et chaque joueur paie avec ce qu'il a |
| N2-60 ✅ | On paie **à l'aller seulement**, une fois par voyage ; au retour, on passe | Ne pas taxer deux fois le même voyage |
| N2-Q11 ✅ même règle | Le tunnel des pillards (corniche) : la **même règle** (12 wotts d'objets), ou un autre moment (la nuit, les pillards dorment : passer sans bruit) ? | La même règle : plus simple, et les deux routes restent égales (R13) |

---

## 11. L'arc simple ★★★ sans attendre le boyau (suite de N2-Q2)

**Constat (code 0.8.3)** : la corde d'arc ★★★ existe déjà sans boyau : le **fil dentaire** (`corde_arc_dentaire`, I13). Mais on le trouve aujourd'hui **au niveau 1 et sur la route A seulement** (la boutique de la station et le libre-service de la Coopérative, famille « salle de bain », rareté commune) : l'arc simple ★★★ s'y fait donc **avant le niveau 2** (le drapeau K8 du §6.1 de la notice), et pas sur la route B.

| # | Proposition | Pourquoi |
|---|---|---|
| N2-61 ✅ | Le **fil dentaire** devient **rare** au niveau 1 (la station, la Coopérative) et **courant au niveau 2**, sur les deux routes : les salles de bains des chambres du **Grand Hôtel**, les chambres du **Panoramique** (la corniche), l'épicerie du bar de la **route du pont** | L'arc simple ★★★ arrive au niveau 2, comme le veut la grille, et sur les deux routes à égalité ; aucun objet nouveau, aucune recette nouvelle. Le boyau restera une deuxième source en 0b |

---

## 12. Les armes trouvées et les Éteints, repris (2026-10-14)

| # | Proposition | Pourquoi |
|---|---|---|
| N2-49 ✅ | Grand Hôtel : le **pied de guéridon en fonte** (contondant, 3,2, lent, solidité 50) | |
| N2-62 | **Phare** : le **harpon du gardien**, un vieux harpon de baleinier accroché au-dessus de la cuisinière, comme un trophée. **Perçant, long** (allonge 2,4 m), **3,2** au torse, tue à la tête, **solidité 50** ; trouvé une fois, sans étoiles | Une arme qui n'existe nulle part ailleurs dans le jeu (aucun « harpon » dans le code ni les books) : rien à corriger au gué. Même rang que le pied de guéridon (R31) |
| N2-63 | **Un Éteint nouveau du littoral : le Noyé.** Un corps resté longtemps dans l'eau, **gonflé** par les gaz : plus lourd, plus lent (≈ 0,4 m/s), il **ne tombe pas** sous un coup au torse (sa masse), il faut viser la tête ou le mettre à terre par les jambes | Un corps différent, pas un mutant (Book 06 §1, principe 4) ; sa résistance est la sienne, on ne touche pas aux autres |
| N2-64 | **Quand il meurt, le Noyé éclate** : ce n'est pas une explosion de feu (ce serait un pouvoir), mais les gaz qui le gonflaient crèvent la peau. Ceux qui sont **à moins de 1,5 m** reçoivent ses **fluides** : risque d'infection (comme le Putréfié, Book 05 §5), et une **odeur** qui attire les Éteints alentour pendant une minute | Il change la façon de se battre : on le tue **de loin** (arbalète, arc, lance, harpon) ou on recule après le coup ; les Mécaniste et leur arbalète y sont à l'aise |
| N2-65 | **Le nombre d'Éteints** d'un lieu se règle au **jeu** (le parcours, ses passages, ses moments), sans chiffre minimum. Le **plafond** vient de l'appareil du joueur : **l'iPhone 13 mini doit tenir 60 images par seconde** (`?mesure=1`, le banc de 90 s) avec le plus grand nombre d'Éteints **visibles à la fois** ; la vision par pièce aide (on ne dessine que la pièce où l'on est). Le serveur (le Pi) garde sa propre limite par instance | Décision du porteur ; la mesure de 2026-10-09 a donné 60 i/s partout |

| # | Question | Recommandation |
|---|---|---|
| N2-Q12 ✅ | Le **Noyé** : seulement au niveau 2 (la côte : la piscine de l'hôtel, la crique du phare, la vase de la route du pont), ou partout où il y a de l'eau ensuite ? | Le littoral et l'eau, à partir du niveau 2 |
| N2-Q13 ✅ | D'autres Éteints nouveaux pour le niveau 2 ? Une piste : **l'Ensablé** de l'hôtel, enfoui dans la dune de la salle à manger, qui surgit quand on passe (un Rampant caché, sans règle nouvelle) | Oui pour l'Ensablé (coût faible) ; rien d'autre pour l'instant |
| N2-Q14 ✅ (N2-51 sans objet ; pour N2-Q7, voir N2-66) | N2-51 (deux noms nouveaux, pas de gaffe au gué) devient sans objet avec N2-62 ; N2-Q7 (les armes du niveau 1 de force inégale) : laisser en l'état ? | Laisser en l'état |

| # | Décision du porteur (2026-10-14) | Ce qu'il faudra faire dans le code |
|---|---|---|
| N2-66 ✅ | **La fourche à foin** (arme trouvée du Moulin, L1B) passe de 1,5 à **2,3** au torse, pour approcher la masse de la route A (2,5) | `armes/communes.ts` (`degatsTorse: 2.3`) et le test `equilibre.test.ts` (« 1,5, allonge 2 m ») ; l'examen du Moulin ne cite pas de chiffre |

---

## 13. Les décisions prises avec le plan de la 0.10 (2026-10-14)

*Le niveau 2 sera la version **0.10** ([`plan-0.10.md`](plan-0.10.md)). Les questions Q-0.10-1 à Q-0.10-9 ont été tranchées en suivant les recommandations ; celles qui changent ce fichier :*

| # | Décision | Ce qu'elle change ici |
|---|---|---|
| Q-0.10-1 | Les murs et les sols sortent en **0.10.1** | §8 : décidés, codés après la 0.10 |
| Q-0.10-2 | La répartition des objets-clés est gardée (L2A, l'hôtel ; L2B, le phare), avec leurs coins : à l'hôtel, les couvertures à la lingerie, les roulements dans la machinerie de l'ascenseur, le fer à souder au local technique, la lanterne-tempête dans la suite, les tôles sur le toit des cabines ; au phare, la cloche du cargo, le rabot à l'établi du hangar, le jerrican sous l'escalier, la porte de four et le soufflet dans les conteneurs | §9.3 : « les objets-clés de chaque lieu » est réglé |
| Q-0.10-3 | Les Éteints **s'acharnent** sur un mur, ils ne le contournent pas (Book 06 §2.1) | MS-Q3 précisée : pas de contournement |
| Q-0.10-4 | Les fluides du Noyé : une **nausée de 30 s** (l'endurance revient deux fois moins vite) et l'odeur ; l'infection plus tard | N2-64 précisée |
| Q-0.10-5 | Le péage : une **caisse au pied du poste de guet** et une **voix** d'en haut | N2-59 précisée |
| Q-0.10-6 | **Le banc solaire suit le soleil** : rien la nuit, moins par temps couvert, rien sous la pluie, la même moyenne de 80 Wh par beau jour | Le moulin de jerricans (N2-47) prend tout son sens |
| Q-0.10-7 | La marée de la route du pont : **basse la moitié du temps**, cycle de 12 min réelles, lisible sur l'échelle du quai | §10.3 précisé |
| Q-0.10-8 | La tête du robot se porte **à deux mains** (8 kg) : on ne frappe pas en la portant | §9.2 précisé |
| Q-0.10-9 | Au phare de jour, **on prépare** (la montée, le pétrole, le prisme, le compresseur) | §9.1 précisé |
