# Plan de développement — version 0.10.1 : les corrections des points en suspens

*Version du plan : v0.2 · 2026-10-15 · **Statut : validé par le porteur ; lot 1 (A, B) lancé ; E décidé (V3) et lancé ; maquettes C et D en préparation.***

*v0.2 (2026-10-15) : **toutes les recommandations acceptées**, sauf : **les saisons suivent les vraies dates** (Q-4) ; **la bouteille d'eau se boit directement**, sans passer par la gourde (Q-5 et Q-6 sans objet). **Les murs et les sols en 0.10.2** (Q-1).*

*v0.1 (2026-10-15) : le plan rédigé, après lecture du code de la 0.10.0 (`main` 8918df1, étiquette `v0.10`).*

*Code de départ : la **0.10.0** (déployée le 2026-10-15, 1 228 tests). Les numéros de ligne sont ceux de `main` au 2026-10-15. Source : [`en-suspens.md`](en-suspens.md) §1 quater (A1 à A10, B2, C1 à C3, D1, décrits au §1 bis, §1 ter, §2 et §3) et §6 ; [`plan-0.10.md`](plan-0.10.md) §8.1 (les murs et les sols).*

---

## 0. En bref

- **Ce que livre la 0.10.1** : les quinze corrections retenues le 2026-10-15, en **cinq chantiers** (A à E) et une recette (G). Les **murs et les sols** (chantier F) passent en **0.10.2** (Q-1).
- **Ce qui ne demande que du code** (lot 1, lancé dès ton accord) : l'eau et les saisons (A), les petits défauts (B).
- **Ce qui se voit et n'est pas décidé dans le détail** (lot 2, **maquettes d'abord**, rien de codé avant ton choix) : le menu d'échange sur iPhone (C), la boussole (D), la fiche « Examiner » courte (E).
- **Trois choses trouvées en lisant le code**, qui changent ce qu'on croyait :
  1. **La boussole ne peut pas montrer le nord en haut par défaut** : la vue du jeu est tournée de 45° (le haut de l'écran regarde le nord-ouest). Au repos, le N de la boussole sera en haut à droite (Q-2).
  2. **Le chemin du terrain est bien au sud** (dans le code et dans le modèle) ; il **paraît à l'ouest** parce qu'à cause de ces 45°, le sud s'affiche en bas à gauche de l'écran. Les textes sont justes : c'est la boussole qui résoudra B2 (Q-3).
  3. **La lueur des yeux des dormeurs existe déjà** (70 %, `client/src/rendu/eteint.ts:42`) : C1 n'est qu'un commentaire et une ligne de book à corriger.
- **Du §6 « Après la 0.10 »**, rien d'autre ne se corrige : tout y est marqué « plus tard », « à transmettre aux bâtiments » ou déjà réglé, sauf les murs et les sols (Q-1).
- **Estimation** : ≈ 6,5 jours-agent ; en temps réel, **une demi-journée à une journée**, plus tes choix sur les maquettes et tes essais (§5).
- **Pas de remise à zéro** : une partie 0.10 se relit (la réserve d'eau au-dessus de 1,5 L est ramenée à 1,5 L au chargement).

---

## 1. Le périmètre

### 1.1 Ce qui entre

| # | Sujet | Chantier |
|---|---|---|
| A1 | L'idée de l'escabeau ne vient jamais | B |
| A2 | Ramasser les pierres qu'on lance | B |
| A3 | Le menu d'échange sur iPhone | C (maquette) |
| A4 | Les bouteilles d'eau d'1 L | A |
| A5 | Plusieurs gourdes : 1 L par gourde, une seule réserve | A |
| A6 | Le zoom au double appui sur iPhone | B |
| A7 | Les saisons : plus de faim l'hiver, plus de soif l'été | A |
| A8 | La jauge de soif à 1,5 L, la soif ralentie (0,21) | A |
| A9 | Le bouton « Tourner la vue » devient une boussole | D (maquette) |
| A10 | La brume dans la vue d'ensemble de l'arrivée | B |
| B2 | Les textes du chemin de sortie : sud ou ouest | D (avec la boussole) |
| C1 | Les dormeurs gardent une lueur dans les yeux | B (book et commentaire) |
| C2 | Pas de déconnexion pour inactivité pendant la pause | B |
| C3 | Raccourcir les textes « Examiner » coupés | E |
| D1 | La fiche « Examiner » courte | E (maquette) |

### 1.2 Ce qui n'entre pas

- **Les murs et les sols** : en **0.10.2**, juste après (Q-1).
- Tout ce que le §6 d'`en-suspens.md` marque « plus tard » : les buts de carnet du niveau 2, les manches + 25 %, l'angle nord-est de la tour, la recherche de chemin des Éteints, le cargo des bâtiments, le retour visible du coup au torse sur le Noyé, les draps noués.
- Ce qui est « à transmettre à la session bâtiments » (bords des alentours, verre des lanternes, budgets).
- Le §1 ter, point 7 au-delà de ce qui est tranché (pas de vêtements chauds, pas de température affichée).

---

## 2. Les chantiers

**Effort** : **S** = une demi-journée à un jour ; **M** = un à trois jours ; **L** = trois à cinq jours de travail d'un agent.

### Chantier A · L'eau et les saisons (A4, A5, A7, A8) — **M**, lot 1

Un seul chantier, parce que les quatre points touchent les mêmes lignes (`commun/src/survie.ts`, la gourde de `serveur/src/joueur.ts`).

**A8 · La jauge de soif à 1,5 L.**
- *Lu dans le code* : `RESERVE_EAU_MAX = 2.5` (`commun/src/survie.ts:17`) ; la soif baisse de `LITRES_PAR_HEURE = 2.5 / 24` × `soif_rythme` (l.14 et l.82) : ce débit est **en litres**, il ne suit pas la taille de la jauge. Il faut donc bien ralentir `soif_rythme` (0,35 → 0,21, `commun/src/reglages.ts:18`) pour que la jauge pleine dure toujours ≈ 70 min. `GORGEE = 0.25` reste (≈ 17 % de la jauge).
- *Proposé* : les deux valeurs, le texte d'aide du réglage, les seuils « tu n'as plus soif » (`joueur.ts:3645`, `:3676`) qui suivent déjà `RESERVE_EAU_MAX` ; **au chargement, une réserve au-dessus de 1,5 L est ramenée à 1,5 L** ; les textes de l'aide et de la bible qui disent 2,5 L ; `npm run equilibre`.
- *À vérifier par toi* : si `~/watt-now/donnees/reglages.json` sur le Pi contient `soif_rythme`, il prime sur la nouvelle valeur (Q-7).

**A5 · Plusieurs gourdes, une seule réserve.**
- *Lu dans le code* : une seule `gourde = { contenu, litres }` (`joueur.ts:355`), plafonnée partout par la constante `CONTENANCE_GOURDE = 1` : à la mare (`joueur.ts:3631-3634`, qui remplit toujours à 1 L tout rond), au récupérateur de pluie (`:4089-4096`), au départ (`GOURDE_DEPART`). Le nombre de gourdes du sac n'est lu nulle part.
- *Proposé* : une fonction `contenance(inventaire)` = 1 L × le nombre de gourdes, qui remplace `CONTENANCE_GOURDE` à la mare, à la pluie, au jerrican du phare s'il remplit la gourde ; **après tout ce qui retire une gourde du sac** (jeter, poser au coffre, échanger, vendre, payer au péage, l'effondrement), l'eau au-delà est perdue (un seul point d'appel, après chaque changement d'inventaire) ; les textes au pluriel quand on en porte plusieurs (« Tes gourdes sont pleines ») ; la description de la gourde (`commun/src/objets.ts:125`) ; le poids de l'eau compte déjà (`poidsInventaire(…, gourde.litres)`).

**A4 · La bouteille d'eau d'1 L.**
- *Lu dans le code* : la bouteille vide existe (`bouteille_plastique`, `commun/src/vestiges-lot2.ts:56`, « 1,5 L » dans sa description). Le démontage (`joueur.ts:2006`) ne sait que **donner des objets** : remplir la gourde est un cas à part.
- *Décidé (2026-10-15)* : **on boit la bouteille directement**, sans passer par la gourde (la décision « la démonter remplit les gourdes » du §1 ter, point 4, est remplacée). L'objet `bouteille_eau` (pleine, 1 kg, commune, « partout », dans toutes les fouilles) ; dans le sac, **« Boire »** : l'eau potable va droit dans la jauge de soif, **jusqu'à 1 L** ; ce que la soif ne prend pas est perdu ; on garde la bouteille vide. Refusé si l'on n'a pas soif (« Tu n'as plus soif : garde-la pour plus tard. »), comme la gourde. La description de la vide passe à 1 L. Une icône. Pas de bouteille entamée (un seul geste, simple).

**A7 · Les saisons sur la faim et la soif.**
- *Lu dans le code* : `consommer()` (`survie.ts:79`) ne connaît pas la date ; le calendrier (`commun/src/calendrier.ts`) donne le jour de l'année (1 an = 4 semaines réelles, une saison ≈ 1 semaine réelle) ; il ne sert qu'aux récoltes. Le serveur appelle `consommer()` à un seul endroit (`joueur.ts:2797`), où il sait déjà si l'on dort (`this.sommeil`, avec `dansUnAbri`). Aucune notion « près du feu » n'existe pour les besoins.
- *Proposé* : une fonction pure `surplusSaison(jour)` → `{ faim, soif }`, une cloche (0 au premier jour, + 25 % au milieu, 0 au dernier) ; l'hiver sur la faim, l'été sur la soif ; le surplus de faim de l'hiver **annulé au feu** (à 3 m d'un feu allumé à soi : feu de camp, foyer Dakota, four, forge) **ou à l'abri** (endormi dans un abri) ; le banc d'équilibre repassé.
- *Décidé (Q-4)* : **les vraies dates** (hiver : 21 décembre → 20 mars ; été : 21 juin → 22 septembre) ; au feu = à 3 m d'un feu allumé à soi ; à l'abri = endormi dans un abri. **À savoir** : le monde a commencé le 1ᵉʳ juin il y a quelques jours réels ; nous sommes sans doute **en plein été de jeu**, la soif + 25 % s'appliquerait presque tout de suite après le déploiement.

**Tests** : la jauge pleine dure le même temps qu'avant ; deux gourdes → 2 L à la mare, 2 L purifiés d'un coup, le récupérateur ne donne que ce qui manque ; on donne une gourde → l'eau au-delà de 1 L disparaît ; boire une bouteille → au plus 1 L dans la jauge, une bouteille vide ; la cloche vaut 0 aux bords et 1,25 au milieu ; au feu, l'hiver ne coûte rien de plus ; une partie 0.10 avec 2,4 L de réserve se relit à 1,5 L.

### Chantier B · Les petits défauts (A1, A2, A6, A10, C1, C2) — **S à M**, lot 1

**A1 · L'escabeau.**
- *Lu dans le code* : confirmé. Sans escabeau dans le cercle, le client met seulement un texte d'examen sur le bouton A (`client/src/interaction.ts:371-378`) et **n'envoie rien** ; le fait `arbre_haut` n'est noté que par le serveur (`joueur.ts:3093`). De plus, le message `constat` n'accepte que `fiche_bloquee` et `aide_coince` (`commun/src/messages.ts:765`, liste blanche `serveur/src/controle.ts:187`).
- *Proposé* : ajouter `arbre_haut` au type et à la liste blanche, et l'envoyer quand on appuie sur A devant un fruitier mûr sans escabeau (le texte reste le même). Test : viser un fruitier mûr sans escabeau → la recette de l'escabeau se dévoile.

**A2 · Les pierres lancées.**
- *Lu dans le code* : le serveur pose bien la pierre au sol, en tas ramassable par tous (`serveur/src/tir.ts:415`), à l'Éteint touché, au pied du premier mur, ou à la portée (8 m) ; perdue seulement dans la mare et dans la rivière du gué. Le tas est proposé au bouton A (`interaction.ts:557-565`). **Je n'ai pas trouvé de défaut dans la logique.** Deux causes possibles : **on ne le voit pas** (une pierre seule est un petit polyèdre gris de 9 cm, `client/src/rendu/sang.ts:178-180`, invisible dans l'herbe et la nuit) ; **ou il est caché par autre chose** au bouton A (le corps de l'Éteint touché, posé au même endroit, passe peut-être avant). Au phare et sur la grève, le tas doit aussi se poser à la hauteur du vrai sol.
- *Proposé* : d'abord **reproduire** par un test de bout en bout (lancer → le tas → le ramasser), sur l'Éteint touché, dans le vide, contre un mur, au phare ; puis corriger ce qui cloche. Si c'est la visibilité : une pierre posée un peu plus grosse et plus claire, rien d'autre.
- *À trancher* : où lançais-tu, et sur quoi (Q-8) ?

**A6 · Le zoom au double appui.**
- *Lu dans le code* : confirmé. `touch-action: manipulation` n'est que sur certains boutons ; ni `html`, ni `body`, ni `#hud` ne l'ont (`client/src/style.css:25`, `:247`) ; rien n'écoute `gesturestart` ni le double appui.
- *Proposé* : `touch-action: manipulation` sur `html`, `body` et `#hud` (le canevas et le joystick gardent `none`) ; bloquer `gesturestart` et le double appui hors des champs de saisie ; si le zoom arrive quand même, le remettre à l'échelle au prochain changement d'orientation. **Seul ton essai sur l'iPhone le prouvera**, en vertical et en horizontal.

**A10 · La brume de la vue d'ensemble.**
- *Lu dans le code* : la brume (`client/src/rendu/brume.ts`) est faite de trois nappes de 70 × 70 m qui suivent le centre de la caméra (`main.ts:2039`) ; la vue d'ensemble (`client/src/arrivee.ts`) ne la touche pas. Vue de haut, le lieu entier dépasse 70 m : on voit **un grand carré pâle** posé sur le terrain, qui se lit comme un voile au-dessus ; pendant le retour vers le personnage, le carré **glisse avec la caméra**.
- *Proposé* : la brume **s'efface pendant la vue d'ensemble** et **revient en fondu à la fin du zoom** (≈ 1 s). Rien d'autre ne change. Ton essai vers 6 h 30 de jeu le dira (je te donnerai l'heure réelle).

**C1 · La lueur des dormeurs.**
- *Lu dans le code* : déjà fait : un dormeur a 70 % de la lueur (`client/src/rendu/eteint.ts:42`, `LUEUR.dormant`), et elle grandit quand il s'éveille (`:413`). Seuls le commentaire d'en-tête (`eteint.ts:2`, « les yeux fermés ») et le Book 23 (§ des yeux, l.158) ne le disent pas.
- *Proposé* : corriger le commentaire et le Book 23. Rien à coder.

**C2 · La pause et l'inactivité.**
- *Lu dans le code* : confirmé. `deconnecterInactifs()` (`serveur/src/monde.ts:238`) coupe tout joueur sans geste depuis `inactivite_min` (5 min), **pause ou pas** ; la pause (`joueur.ts:601`, `enPause()`) n'est pas consultée.
- *Proposé* : ne pas déconnecter un joueur en pause. Test : en pause 10 min, toujours connecté ; hors pause, déconnecté à 5 min.

### Chantier C · Le menu d'échange sur iPhone (A3) — **M**, lot 2, **maquette d'abord**

- *Lu dans le code* : le panneau (`client/src/hud.ts:844-905`, styles `style.css:2177-2360`) a **deux colonnes côte à côte** (« Tu donnes » / « Tu reçois ») ; « Tu donnes » liste **tout le sac**, une ligne par objet avec − et +, dans une boîte de 46 % de la hauteur ; puis les wotts, les accords, deux boutons. **Aucune règle pour le petit écran.** À 375 px, chaque colonne fait ≈ 170 px (les noms se coupent) ; en paysage (≈ 320 px de haut), l'en-tête, les accords et les boutons mangent presque tout : la liste n'a plus que quelques lignes, et la demande d'échange (`.demande-echange`) se superpose.
- *Proposé* : une maquette à deux ou trois variantes, jouable sur ton iPhone, en vertical et en horizontal, avec un vrai sac de 25 objets. Pistes : en vertical, **ce qu'on reçoit en haut, résumé** (une rangée d'icônes), ton sac en grille d'icônes comme le sac du jeu, un toucher = +1, un appui long = −1 ; en paysage, **ton sac à gauche, l'échange à droite** ; les boutons « Annuler » et « D'accord » toujours visibles en bas. La logique (`serveur/src/echange.ts`) ne change pas.
- *Décidé (2026-10-16, maquette `.claude-travail/maquettes-0-10-1/echange/`)* : **la variante V2, « toucher = choisir »** : ce qu'on reçoit en haut (rangée d'icônes et une ligne de noms), ce qu'on donne, les wotts, puis ton sac en grille ; un toucher choisit un objet, une barre sous la grille donne son nom, ses étoiles et deux gros − et + ; « Annuler » et « Je suis d'accord » toujours visibles ; en paysage, le sac à gauche et l'échange à droite ; plus besoin de la ✕. La logique (`serveur/src/echange.ts`) ne change pas.

### Chantier D · La boussole (A9) et le chemin (B2) — **S à M**, lot 2, **maquette d'abord**

- *Lu dans le code* : deux boutons font tourner la vue d'un quart de tour : « Vue » (`.r-tourner`, `hud.ts:404`) et « ⟳ » (`.b-tourner`, `hud.ts:453`). L'angle de la caméra est `π/4 + quartDeTour × π/2` (`client/src/rendu/scene.ts:170`) ; le nord est le −z (`client/src/rendu/carte-vue.ts:73`). **Au repos, le haut de l'écran regarde le nord-ouest** : le nord est en haut à droite, le sud en bas à gauche. C'est exactement pourquoi le chemin du terrain (au sud, `commun/src/lieux.ts:158-165`, dessiné au sud dans `client/src/rendu/terrain.ts:36-37`) **paraît à l'ouest**.
- *Proposé* : la boussole remplace les deux icônes ; elle suit l'angle réel de la caméra à chaque image (donc elle tourne en douceur avec la vue, et aussi dans les scènes du phare) ; le N en rouge, lisible à la taille du bouton ; même geste qu'aujourd'hui. **B2** : on ne change pas les textes (« au sud » est juste) ; la boussole le rend lisible. Maquette : la boussole sur une vue du terrain, avec le chemin, et un appui qui tourne la vue.
- *Décidé (2026-10-16, maquette `.claude-travail/maquettes-0-10-1/boussole/`)* : **la variante V3, le cadran** : un rond crème avec N (rouge, plus gros), E, S, O, des graduations et un cran fixe en haut qui montre où regarde l'écran ; les lettres restent droites, seule leur place tourne ; au repos, le N en haut à droite (Q-2) ; en paysage, la légende de la tuile écrit la direction (« N-O », « S-O »…) au lieu de « Vue ». Les textes « au sud » ne changent pas (Q-3).

### Chantier E · La fiche « Examiner » courte (D1) et les textes coupés (C3) — **M**, lot 2, **maquette d'abord**

- *Lu dans le code* : le texte d'Examiner passe **en entier** dans la colonne des messages, 4 à 12 s selon sa longueur (`client/src/texte-examen.ts`) ; la fiche d'un objet du sac (`hud.ts:1563`, `dessinerSac`) dit la description, le poids, la valeur, le démontage, l'énergie grise, mais jamais **à quoi sert l'objet** ni **ce qu'il permet comme outil** ; la fiche d'une installation (`hud.ts:2138`, `dessinerFiche`) dit le texte d'examen et le niveau, pas **pourquoi elle ne marche pas**. L'étude complète (`.claude-travail/propositions/examiner-detaille.md`, maquette `maquettes/examiner/`) prévoyait six blocs : tu as retenu la version courte.
- *Proposé* : trois lignes au plus, seulement quand il y a quelque chose à dire : **Sert à** (les fabrications **dévoilées** où l'objet entre, au plus 4, puis « et 2 autres » ; jamais une recette cachée) ; **Outil** (« couper, visser ») ; pour une installation, **pourquoi elle ne marche pas** (« il lui faut une batterie dans le sac »). Pour C3 : l'agent relève, à 375 × 630 et 812 × 320, tous les textes d'examen qui débordent, et propose une version courte de chacun **à ta validation mot pour mot** (aucun texte changé sans toi).
- *Décidé (2026-10-16, maquette `.claude-travail/maquettes-0-10-1/examiner-court/`)* : **la variante V3 partout** (dans le sac, sur la fiche d'une installation, dans les messages d'Examiner) : les lignes utiles **avant** la phrase d'ambiance, titres en petites capitales ; ce qui ne va pas en **bandeau orange** tout en haut de la fiche (« Ne marche pas : … »). Phrases validées : pour le pédalier, « il lui faut une batterie : dans ton sac, ou un banc à moins de 3 m » ; « Rien que tu saches faire, pour l'instant. » seulement pour un objet qui n'est pas une ordure et dont toutes les recettes sont cachées (sinon pas de ligne) ; une pièce qui se monte sur une installation (dynamo, panneau solaire, alternateur) dit « Se monte sur : le pédalier » (ou son installation). Les variantes d'une recette comptent une fois ; le feu de camp compte. Q-9 : l'agent relève tout ce qui déborde.

### Chantier F · Les murs et les sols — **L**, en 0.10.2 (Q-1), pas dans cette version

Le chantier E du plan de la 0.10 (§8.1), inchangé : la pose sur la grille de 1 m, les sols, les boîtes des murs dans la zone du terrain (joueurs et Éteints arrêtés), l'usure par les Éteints qui s'acharnent, le démontage, le rendu en lots, le plafond de 200 éléments ; le vrai objet « planche rabotée » (V1-21). Il demanderait, lui aussi, **une maquette** (le fantôme du mur qui se cale, la claie, le plancher) et une mesure à 60 i/s sur l'iPhone.

### Chantier G · La recette, les books, la version — **S**, à la fin

- La recette au strict nécessaire (ce qui prouve chaque correction, pas une partie entière) ; une partie 0.10 relue.
- Les books : Book 05 (la soif, les gourdes, les saisons), Book 23 (la lueur), Book 13 (les saisons, si la météo en parle), l'aide du jeu ; la bible (2,5 → 1,5 L, les gourdes, la bouteille), régénérée.
- `VERSION` 0.10.1, `code/VERSIONS.md`, `en-suspens.md` (rayer ce qui est fait), le plan à jour.

---

## 3. L'ordre

| Étape | Quoi | Avant l'étape suivante |
|---|---|---|
| **1** | Ce plan, ton accord, tes réponses aux questions du §4 | — |
| **2** | **Les maquettes** (C, D, E ; F si retenu), servies sur le réseau local pour ton iPhone ; **en même temps**, le **lot 1** codé (A et B, qui n'ont rien à choisir) | Ton choix sur chaque maquette |
| **3** | Le lot 1 fusionné → **ton essai sur l'iPhone** ; le **lot 2** codé (C, D, E) | — |
| **4** | Le lot 2 fusionné → ton essai ; F s'il est retenu | — |
| **5** | G (recette, books, version) → ta validation → fusion dans `main` ; l'étiquette `v0.10.1` après ton déploiement | — |

**Où** : la branche `integration-0-10-1` (worktree `.claude-travail/integration-0-10-1`, partie de `main`), un worktree par chantier `.claude-travail/wt101/<lettre>-<nom>` (branches `0.10.1/<lettre>-<nom>`), `node_modules` cloné par `cp -cR`, lien `batiment` → `../../../batiment`. Ports : serveur 83N1, admin 83N2, Vite 53N1, Chrome 93N1 (A : 8311…, B : 8321…, etc.). Consigne commune : `.claude-travail/consigne-0.10.1.md`. Ton serveur d'essai : `.claude-travail/mesures/`, jeu 8401, Vite HTTPS 5176, compte « Banc » administrateur, base neuve.

**Fichiers partagés** : `serveur/src/joueur.ts` (A et B : des blocs distincts, A la gourde et `consommer`, B le constat et rien d'autre) ; `client/src/hud.ts` et `style.css` (C, D, E : chacun son panneau ou son bouton) ; `commun/src/messages.ts` (B seulement). Ordre de fusion : A, B, puis C, D, E.

---

## 4. Les questions

| # | Question | Recommandation |
|---|---|---|
| **Q-1** ✅ 0.10.2 | **Les murs et les sols** (§8.1 du plan de la 0.10, ≈ 5 jours-agent, une maquette en plus) : dans la 0.10.1, ou plus tard ? | **Plus tard, dans une 0.10.2 qui suit tout de suite** : la 0.10.1 reste un correctif court, essayé et déployé vite ; les murs sont une vraie nouveauté (pose, Éteints arrêtés, rendu) qui mérite sa propre maquette et sa propre recette |
| **Q-2** ✅ | **La boussole au repos** : la vue est tournée de 45° ; le nord n'est jamais tout en haut. | **Une boussole honnête** : au repos, le N est en haut à droite ; elle tourne avec la vue. (Mettre le nord en haut voudrait dire changer l'angle de toute la caméra du jeu : non) |
| **Q-3** ✅ | **B2, sud ou ouest** : le chemin est au sud dans le monde ; il paraît à l'ouest à cause de la vue à 45°. | **Garder « au sud »** dans les textes ; la boussole montre où est le sud |
| **Q-4** ✅ vraies dates | **Les saisons** (A7) : quelles dates ? qu'est-ce qu'« au feu » et « à l'abri » ? | **Les saisons des météorologues** (hiver : 1ᵉʳ décembre → 28 février ; été : 1ᵉʳ juin → 31 août), le plus fort à mi-saison ; **au feu** = à 3 m d'un feu allumé (feu de camp, foyer Dakota, four, forge) ; **à l'abri** = endormi dans un abri |
| **Q-5** sans objet | **Une bouteille d'eau sans gourde** dans le sac | **Refusé**, avec un message (« Il te faut une gourde pour garder cette eau. ») : on ne perd pas l'eau par mégarde |
| **Q-6** sans objet | **Le bouton de la bouteille pleine** : « Démonter » comme les autres, ou « Verser dans la gourde » ? | **« Verser dans la gourde »** (même geste, un mot juste) |
| **Q-7** ✅ | **`reglages.json` du Pi** : contient-il `soif_rythme` ? | À vérifier par toi (`cat ~/watt-now/donnees/reglages.json`) ; s'il y est, l'enlever au déploiement |
| **Q-8** ✅ | **Les pierres lancées** (A2) : où et sur quoi lançais-tu quand tu ne pouvais pas les reprendre ? | Ta réponse oriente le test ; sinon l'agent essaie tous les cas |
| **Q-9** ✅ | **Les textes « Examiner » coupés** (C3) : où les as-tu vus coupés (dans la colonne des messages, sur le bouton, dans une fiche) ? | Ta réponse ; sinon l'agent relève tout ce qui déborde à l'écran de l'iPhone et te soumet les versions courtes |

---

## 5. L'estimation

| Chantier | Effort | Jours-agent |
|---|---|---|
| A · L'eau et les saisons | M | 2 |
| B · Les petits défauts | S à M | 1 |
| C · Le menu d'échange | M | 1,5 (maquette comprise) |
| D · La boussole | S | 0,5 (maquette comprise) |
| E · L'Examiner court, les textes coupés | M | 1 (maquette comprise) |
| G · Recette, books, version | S | 0,5 |
| **Total** | | **≈ 6,5 jours-agent** ; + ≈ 5 avec F (les murs) |

En temps réel : **≈ 4 à 6 h de travail des agents**, en parallèle, plus le temps de tes choix sur les maquettes et de tes essais.

**Les risques** : A touche la soif de tout le monde (une erreur se sent tout de suite : le banc d'équilibre et une partie 0.10 relue le gardent) ; A6 ne se prouve que sur ton iPhone ; A2 peut ne pas se reproduire (on te le dira, sans inventer de correction).

---

## 6. Les critères (ce que tu dois pouvoir faire sur l'iPhone)

1. Viser un fruitier mûr sans escabeau → l'idée de l'escabeau arrive.
2. Lancer une pierre (sur un Éteint, dans le vide, contre un mur) → la voir par terre et la reprendre.
3. Échanger avec un autre joueur, en vertical et en horizontal, sans rien de coupé.
4. Trouver une bouteille d'eau, la verser : 1 L de plus, une bouteille vide.
5. Avec deux gourdes : 2 L à la mare, purifiés d'un coup.
6. Toucher deux fois vite un bouton grisé → pas de zoom.
7. La jauge de soif se remplit plus vite à chaque gorgée et dure autant.
8. La boussole tourne avec la vue ; le chemin du terrain est du côté du S.
9. La vue d'ensemble vers 6 h 30 : pas de voile, pas de glissement.
10. En pause plus de 5 min : toujours là.
11. Un « Examiner » d'objet dit à quoi il sert ; une installation dit pourquoi elle ne marche pas.
12. Une partie 0.10 se relit ; `npm run verif`, `npm test`, `npm run build` passent.

---

## 7. Les décisions prises en route (2026-10-16)

| # | Décision |
|---|---|
| R-01 ✅ | La bouteille d'eau pleine vaut **2 wotts** (elle reste dans les déchets, aussi commune que la vide) ; elle est aussi dans ce que la crue charrie au gué |
| R-02 ✅ | *Corrigé par le porteur le 2026-10-16* : **la forge réchauffe** (à 3 m) pendant un geste de forge et encore **2 h de jeu après** (les braises ; elle n'a pas d'état « allumée » dans le code) ; **la charbonnière réchauffe pendant qu'elle cuit** (jusqu'au défournement) ; **un feu couvert sous la cendre réchauffe** |
| R-03 ✅ | Ramasser près d'un Éteint debout (mode Combat, moins de 10 m) : **rien ne change** (A frappe) |
| R-04 ✅ | Une pierre lancée dans la mer au phare : **la faire disparaître, plus tard** (`en-suspens.md`) |
| R-05 ✅ | **C3** : aucun texte n'est coupé à l'écran ; ce qui coupe, c'est le temps (12 s au plus). **Les 12 textes courts proposés sont validés mot pour mot** (`.claude-travail/wt101/e-examiner/.claude-travail/c3-textes.md`) ; le plafond de 12 s reste |
| R-06 ✅ | Le pédalier sans alternateur ni dynamo : le bandeau reprend la phrase du jeu, « Rien à entraîner : monte l'alternateur de la station (ou, à défaut, la dynamo du vélo). » ; pas de phrase nouvelle pour les autres installations sans qu'on la demande |
| R-07 ✅ | **Une espace insécable entre un nombre et son unité** dans tous les textes du jeu (aucun mot ne change) |
| R-08 ✅ | Pas de « Sert à » quand on examine une chose posée dans le monde (en 0.10.1) |
| R-09 ✅ | **Le menu d'échange** : les trois petits ajouts de la maquette sont pris : la ligne « X a changé son offre : redis d'accord si ça te va. » quand les deux « d'accord » tombent ; le trait qui raccourcit pendant les 20 s de la demande ; le bref éclair jaune sur « Tu reçois » quand l'autre change ce qu'il donne |
| R-10 ✅ | **Le bouton « Lumière » devient une icône** (demande du porteur ; maquette `.claude-travail/maquettes-0-10-1/lumiere/`) : **la variante V3, l'auréole** : l'icône de la lumière qu'on porte vraiment (torche, frontale, lanterne, lampe bricolée) sur le rond sombre des boutons ; éteinte, l'icône est terne ; allumée, une auréole de la couleur de sa lumière déborde autour du bouton (orange qui vacille pour la torche, jaune pour la lanterne, blanc pour la frontale et la lampe) ; sans lumière, un rond en pointillé |
| R-11 ✅ | À la recette : **la demande d'échange** tient sur une ligne en vertical (« X te propose un échange. » au-dessus des deux boutons) |
| R-12 ✅ | À la recette : **un pédalier qui porte la meule** (sans alternateur ni dynamo) n'affiche pas « Ne marche pas : rien à entraîner… » : il sert à affûter |
| R-13 ✅ | **La pile vide** sur le bouton Lumière : une frontale dont la petite batterie est vide montre une petite pile vide dans un coin du bouton |
| R-14 ✅ | **Essai du porteur sur l'iPhone (2026-10-16)** : bon pour le zoom, la boussole, la fiche Examiner, l'échange, l'eau, la brume, les pierres, la pause. **L'escabeau n'a pas pu être essayé** (ce n'est pas la saison des fruits) : seuls les tests le couvrent |
