# Ce qui reste en suspens (au 2026-10-16)

> Tenu par la session du jeu. Tout ce qui a été dit ou décidé en discussion mais qui n'est pas encore entré dans un book, la bible ou le plan de la 0.8. À relire au début d'une nouvelle session ; rayer ce qui est fait.

## 1. À transmettre à d'autres sessions

- ~~**Session « bâtiments »** : les changements du modèle du Moulin (et du gué) pour la 0.8 — demande complète dans `.claude-travail/propositions/demande-batiment-moulin.md` (passages trop étroits de 0,58 m et 0,74 m, nord fermé, mur de clôture, planche du bief, if, tableau à clés, étau et poutres au nord, 22 Éteints, pièces et portes pour la vision par pièce). Le chantier 12 de la 0.8 en dépend.~~ *Fait : livré (2026-10-10, puis les retouches du 2026-10-13), importé en 0.8 et en 0.8.3.*
- **Session « intro »** (écrans d'accueil, branchés en 0.7.1 ; copie dans `code/client/public/intro/`, `npm run accueil:importer` pour la refaire) :
  1. ~~en paysage sur iPhone 13 mini (812 × 320), l'image 3D tombe à 0 px : garder l'image à gauche et le texte à droite (`src3d/ecrans.js`, `ajuster()`, et `intro.css`) ;~~ *Fait : livré par l'intro, importé en 0.8.3.*
  2. ~~`src3d/acteurs.js` demande `assets/personnages/animations_intro_1.glb` et `_2.glb`, que la notice dit de ne pas servir (deux 404 sans conséquence) ;~~ *Fait : livré par l'intro, importé en 0.8.3.*
  3. ~~en vertical (375 × 630), une grande bande noire entre l'image et le texte.~~ *Le porteur la voit corrigée (2026-10-15).*

## 1 bis. À corriger en 0.8.4 (relevé sur la 0.8.3 déployée, 2026-10-13)

> *Fait : les trois points sont codés en 0.8.4 (étiquette v0.8.4), déployée le 2026-10-13. Reste à les essayer sur l'iPhone, surtout le point 1.*

1. ~~**Image déformée à l'arrivée sur le terrain (premier lancement).** Juste après les 3 écrans d'accueil, en arrivant sur le terrain, l'image est étirée, comme si l'image verticale avait été mise à l'échelle pour remplir l'horizontale. Passer le téléphone en vertical puis le remettre en horizontal remet tout d'aplomb. À faire : relire l'orientation et la taille réelles de l'écran au moment où l'on entre sur le terrain (taille du rendu et proportions de la caméra), sans jamais déformer : soit vertical, soit horizontal.~~ *Fait en 0.8.4 : la scène revérifie la taille de la fenêtre à chaque image (`rendu/scene.ts`, `dessiner()`). Cause probable : sur iPhone, « resize » arrive avant la nouvelle taille. Confirmé : le porteur la voit corrigée (2026-10-15).*
2. **Tutoriel : « le chemin » pour sortir du terrain n'est pas clair.** *Tranché le 2026-10-13 : piste B. Fait en 0.8.4 (`sortiePourPartir`, `commun/src/lieux.ts`) ; on ne part pas quand un Éteint nous tient ; textes réécrits sans « au sud ».* Sur le **terrain seulement**, on peut partir par la carte **depuis n'importe où** ; sur les autres lieux, rien ne change (il faut toujours aller jusqu'à la sortie). Les textes du tutoriel, de l'aide (`code/client/src/aide-contenu.ts:628`) et de la carte (`code/client/src/carte.ts:451`, « Pour partir, rejoins le chemin, au sud de ton terrain ») sont à réécrire en conséquence.
   
   ~~Au passage, l'incohérence « sud » / « ouest » : ces textes placent le chemin au **sud**, alors que le porteur voit le début du chemin et le panneau à l'**ouest**. Si un texte nomme encore le chemin, vérifier sur le modèle du terrain et l'aligner. **→ Retenu pour la 0.9.1 (B2, §1 quater).**~~ *Fait en 0.10.1 (B2) : le chemin est bien au sud, dans le code et le modèle ; il paraissait à l'ouest parce que la vue est tournée de 45°. Les textes gardent « au sud », et la boussole montre où est le sud.*
   *(Piste écartée, A : dire d'aller à l'ouest du terrain, là où commencent le chemin et le panneau.)*
3. **Tutoriel : le combat contre les Éteints est trop dur.** Le porteur est mort 3 fois. À recadrer pour que le combat reste une leçon et pas un mur. Constat : les deux Éteints mis en scène (`amenerEteintDuTutoriel`, `code/serveur/src/joueur.ts:2316` ; étape du premier Éteint, puis étape de la saisie dans le dos) sont des Éteints ordinaires (`nouvelEteint`), sans réglage propre au tutoriel. C'est **surtout la saisie** qui tue : impossible d'appuyer 6 fois sur B à temps. *Fait en 0.8.4.* **Vraie cause trouvée en codant** : pendant la saisie du tutoriel, un coup de A libérait sans valider l'étape, et le jeu faisait alors surgir un nouvel Éteint dans le dos à chaque coup ; à trois qui tiennent, c'est l'effondrement. Corrigé : un seul Éteint en scène à cette étape.
   
   *Décidé le 2026-10-13, pour la 0.8.4, **partout** (pas seulement au tutoriel), « pour l'instant » :*
   - quand un Éteint nous tient, **A sert aussi à se dégager**, comme B (A ne frappe plus) ;
   - **2 appuis suffisent** (A, B ou mélangés) par Éteint qui tient, au lieu de 6 (`APPUIS_DEGAGEMENT`, `code/commun/src/combat.ts:465`).
   
   Cela avance en 0.8.4 le chantier C de la 0.9 (« saisi, on ne frappe plus », `plan-0.9.md` §3.2), avec 2 appuis au lieu de 6. Conséquences :
   - le plan de la 0.9 est à ajuster (le chantier C est en grande partie fait, et ses tests passent de 6 à 2 et de 12 à 4) ;
   - le banc d'équilibre est à repasser (`commun/src/equilibre.ts`, qui suppose 6 appuis) ;
   - le message de la première saisie, la rubrique « saisie » de l'aide et la leçon des Voltaïques (`quetes.ts:557`) sont à réécrire : A **ou** B, 2 appuis.
   
   - **2 appuis même épuisé** (tranché le 2026-10-13) : le multiplicateur « épuisé » ×1,5 du dégagement disparaît (`degager()`, `joueur.ts`, et le banc d'équilibre).
   
   Le premier Éteint du tutoriel n'est pas mis en cause pour l'instant.
   
   ~~Les suites (plan de la 0.9, banc d'équilibre, textes de la saisie)~~ *vérifiées le 2026-10-15 : faites (`APPUIS_DEGAGEMENT` = 2, même épuisé ; l'aide dit « Tape deux fois A ou B »). Rayé par le porteur.*

## 1 ter. À corriger (relevé sur la 0.9 déployée, 2026-10-14)

1. ~~**L'idée de l'escabeau ne vient jamais.** Le porteur a visé un fruitier aux fruits mûrs et a bien eu le message « Les fruits sont trop haut… », mais la recette de l'escabeau n'est pas apparue.~~ *Fait en 0.10.1 (A1) : A devant un fruitier mûr sans escabeau envoie le constat `arbre_haut`, le serveur dévoile la recette ; un test. Pas encore essayé sur l'iPhone : ce n'est pas la saison des fruits (R-14).*
   - La règle : l'escabeau se dévoile sur le fait `arbre_haut` (`commun/src/progression.ts:128`), noté par le serveur quand on veut cueillir sans escabeau au pied (`serveur/src/joueur.ts:2973`).
   - **Cause probable** : le client répond lui-même, sans rien envoyer au serveur. Sans escabeau dans le cercle, le bouton A affiche seulement le texte d'examen (`client/src/interaction.ts:336-343`, « rien ne se lance pour rien »). Le serveur ne reçoit donc jamais la demande et ne note jamais `arbre_haut`.
   - **Piste de correction** : garder ce message côté client, mais envoyer aussi un `constat` avec `quoi: "arbre_haut"` (le serveur le note déjà dans `case "constat"`, `joueur.ts:~695`). Vérifier que ce `quoi` est accepté par le type du message, puis ajouter un test : viser un fruitier mûr sans escabeau → la recette de l'escabeau est proposée.
2. ~~**Il faut pouvoir ramasser les pierres qu'on lance.** Demande du porteur : une pierre lancée doit pouvoir se reprendre là où elle est tombée.~~ *Fait en 0.10.1 (A2) : le tas se pose sur le vrai sol (au phare, sur la grève), la pierre posée est plus grosse et plus claire ; essayé par le porteur sur l'iPhone (R-14).*
   - Ce que prévoit le code : la pierre qui retombe est posée au sol en tas ramassable (`ctx.poserAuSol`, `serveur/src/tir.ts:399-415`). Elle n'est perdue que dans la mare, ou dans la rivière au gué si elle coule.
   - À vérifier : le tas est-il bien créé, visible et proposé au bouton A, partout (terrain, haltes, Moulin, gué) ? Cherche-t-on au bon endroit (au pied de l'Éteint touché, à la portée maximale de 8 m, ou au pied d'un obstacle) ? Ajouter un test de bout en bout : lancer → le tas apparaît → le ramasser rend la pierre au sac.
3. ~~**Le menu d'échange est inutilisable sur iPhone**, en vertical comme en horizontal. À revoir pour l'optimiser sur le petit écran (iPhone 13 mini : 375 × 812 en vertical, 812 × 375 en horizontal). L'écran est dessiné côté client (`client/src/hud.ts`, styles dans `style.css`) ; la logique est dans `serveur/src/echange.ts`. Faire d'abord une maquette des deux orientations, à valider par le porteur, avant de coder.~~ *Fait en 0.10.1 (A3) : la variante V2, « toucher = choisir », et ses trois ajouts (R-09) ; la demande tient sur une ligne (R-11) ; essayé par le porteur (R-14).*
4. ~~**Des bouteilles d'eau pleines dans ce qu'on trouve.**~~ *Fait en 0.10.1 (A4), autrement que tranché ci-dessous : la bouteille d'eau (1 L, 2 wotts, commune, partout) **se boit d'un trait** depuis le sac, sans passer par la gourde ; on garde la bouteille vide (1 L).* Demande du porteur : un nouvel objet, la bouteille d'eau (pleine), parmi les trouvailles. **La démonter** (l'ouvrir) **remplit les gourdes** d'eau potable et **donne une bouteille vide** (l'objet `bouteille_plastique`, « bouteille d'eau vide », existe déjà : `commun/src/vestiges-lot2.ts:56`).
   - *Tranché le 2026-10-14* : **seulement des bouteilles d'1 L** ; ce qui ne tient pas dans les gourdes est **perdu**. La description de la bouteille vide (« 1,5 L ») est à passer à 1 L.
   - *Tranché le 2026-10-14* : si les gourdes contiennent de l'eau brute, **toute l'eau devient brute** (le mélange est à faire bouillir).
   - *Tranché le 2026-10-15* : un **objet commun**, qu'on trouve **partout** (rareté « C », lieux « partout », comme la bouteille vide), à répartir dans toutes les fouilles.
5. ~~**Plusieurs gourdes dans le sac.**~~ *Fait en 0.10.1 (A5) : la piste A, 1 L par gourde, une seule réserve ; l'eau en trop part avec la gourde qui quitte le sac.* Le porteur en a plusieurs et voudrait qu'elles se remplissent toutes. **Pas prévu aujourd'hui** : le jeu ne tient qu'**une seule réserve d'eau** (`this.gourde = { contenu, litres }`, `serveur/src/joueur.ts`, plafonnée à `CONTENANCE_GOURDE` = 1 L, `commun/src/survie.ts:25`), quel que soit le nombre de gourdes ; les gourdes en plus ne font que peser 0,3 kg chacune.
   - *Tranché le 2026-10-14 : piste A.* Une seule réserve, dont la contenance est **1 L × le nombre de gourdes** portées. Avec 2 gourdes :
     - **puiser à la mare** remplit les deux (2 L d'eau brute) ;
     - **purifier** (faire bouillir) purifie les deux ;
     - le **récupérateur de pluie** (5 L) ne donne que l'eau qui manque pour remplir toutes les gourdes portées ; le reste demeure dans le récupérateur.
   - *Tranché le 2026-10-14* : quand on donne, échange, pose ou perd une gourde, l'eau au-delà de la nouvelle contenance est **perdue**. Textes à revoir : la description de la gourde (`commun/src/objets.ts:125`) et les messages « Ta gourde est déjà pleine », au pluriel quand on en a plusieurs.
   - *(Piste écartée, B : chaque gourde avec son propre contenu.)*
6. ~~**Sur iPhone, un double appui sur un bouton inactif zoome la page**, et on reste coincé dans cette vue agrandie. Très désagréable.~~ *Fait en 0.10.1 (A6) : `touch-action: manipulation` sur tout l'écran, le geste de zoom et le second appui rapide retenus, retour à l'échelle au changement d'orientation ; essayé par le porteur (R-14).*
   - Constat dans le code : la page interdit déjà le zoom (`maximum-scale=1, user-scalable=no`, `client/index.html:5`), mais Safari sur iPhone ne respecte plus cette consigne. Les boutons ont `touch-action: manipulation` (qui empêche le zoom au double appui), mais un bouton **inactif** (`disabled`) ne reçoit pas le toucher : il passe à l'élément du dessous, qui n'a pas cette protection.
   - Piste : mettre `touch-action: manipulation` sur tout l'écran du jeu (`html`, `body`, `#hud` et ses panneaux), et pas seulement sur les boutons ; éventuellement bloquer aussi le geste de zoom (`gesturestart`) et le double appui sur les boutons inactifs. Prévoir de quoi revenir à l'échelle normale si le zoom arrive quand même. À essayer sur l'iPhone, en vertical et en horizontal.
7. ~~**Les saisons sur la faim et la soif** (idée du porteur, 2026-10-14) : la température de la saison agit sur les besoins. **L'hiver, on mange davantage ; l'été, on boit davantage.**~~ *Fait en 0.10.1 (A7) : aux vraies dates (hiver du 21 décembre au 20 mars, été du 21 juin au 22 septembre), en cloche, + 25 % au plus fort ; le surplus de l'hiver annulé à 3 m d'un feu allumé à soi, d'une forge encore chaude (2 h de jeu de braises), d'une charbonnière qui cuit, ou endormi dans un abri (Book 05 §3).*
   - Aujourd'hui, rien de tel : la faim et la soif baissent au même rythme toute l'année (`consommer()`, `commun/src/survie.ts:79`, réglages `faim_rythme` et `soif_rythme`). Le calendrier (`commun/src/calendrier.ts`) ne sert qu'aux récoltes.
   - À préciser : de combien (par exemple + 25 % de faim l'hiver, + 25 % de soif l'été ?), progressif au fil des mois ou par saison, et si le feu, l'abri ou les vêtements l'atténuent. À faire passer par le banc d'équilibre (`commun/src/equilibre.ts`).
   - *Tranché le 2026-10-15* : l'effet suit **une courbe sur la saison** : il commence le premier jour de l'hiver (ou de l'été), et finit le dernier jour de cette saison. **Une courbe en cloche** (confirmé) : nulle au début, au plus fort au milieu de la saison, de nouveau nulle à la fin. Au printemps et à l'automne, rien ne change.
   - *Tranché le 2026-10-15* : au plus fort, **+ 25 %** (de faim au milieu de l'hiver, de soif au milieu de l'été).
   - *Tranché le 2026-10-15* : **le feu et l'abri annulent le surplus de faim de l'hiver**. À préciser dans le plan : ce qui compte comme « au feu » (près d'un feu allumé, à quelle distance) et « à l'abri » (dedans, ou endormi dedans) ; l'été, rien n'atténue la soif.
8. ~~**Boire ne remplit pas assez la jauge de soif** (le porteur trouve que ce n'est « pas assez généreux »).~~ *Fait en 0.10.1 (A8) : la jauge de 1,5 L, la soif à 0,21 ; une réserve gardée au-dessus de 1,5 L revient à 1,5 L au chargement. La bible reste à mettre à jour.*
   - Aujourd'hui : une gorgée = 0,25 L (`GORGEE`, `commun/src/survie.ts:27`), la jauge tient 2,5 L (`RESERVE_EAU_MAX`). Une gorgée ne remplit donc que **10 %** de la jauge, et une gourde pleine (1 L) **40 %** ; il faut 10 appuis pour la remplir.
   - À revoir avec le point 5 (plusieurs gourdes) et le point 7 (soif de l'été). Pistes : une gorgée plus grande (0,5 L = 20 %), ou boire jusqu'à ne plus avoir soif en un seul geste, ou une jauge plus petite.
   - *Tranché le 2026-10-14, pour commencer* : **une jauge de 1,5 L** (`RESERVE_EAU_MAX` 2,5 → 1,5). Une gorgée en remplit alors ≈ 17 % et une gourde ≈ 67 %. Attention : au même rythme de soif, la jauge se vide aussi plus vite (≈ 42 min réelles au lieu de ≈ 70) ; *tranché le 2026-10-14* : on **ralentit la soif** dans la même proportion (`soif_rythme` 0,35 → 0,21), pour que la jauge pleine dure toujours ≈ 70 min réelles. Revoir aussi les textes de l'aide et de la bible qui parlent de 2,5 L, et repasser le banc d'équilibre.
9. ~~**Le bouton « Tourner la vue » devient une boussole** (demande du porteur, 2026-10-15). Sur téléphone, le bouton qui fait tourner la vue (`client/src/hud.ts:447`, `.b-tourner`, aujourd'hui « ⟳ » ; et le bouton « Vue » `.r-tourner`, `hud.ts:398`) est remplacé par une **boussole** : par défaut, elle montre le **nord en haut** ; quand on tourne la vue, la boussole tourne avec, et le joueur sait ainsi dans quel sens il regarde. Le geste ne change pas (un appui = un quart de tour, comme aujourd'hui).~~ *Fait en 0.10.1 (A9) : la variante V3, le cadran ; au repos, le N en haut à droite (la vue regarde le nord-ouest) ; essayé par le porteur (R-14).*
   - À vérifier : que le nord de la boussole soit le même que celui de la carte et des textes (voir le point « sud » / « ouest » du chemin, §1 bis, point 2) ; une petite animation de rotation ; la lisibilité à la taille du bouton (le N bien visible, en rouge).
10. ~~**La vue panoramique du terrain est buggée quand il y a de la brume** (relevé par le porteur, 2026-10-15).~~ *Fait en 0.10.1 (A10) : la brume s'efface pendant la vue d'ensemble et revient en fondu (1 s) à la fin du zoom ; essayé par le porteur (R-14).*
   - *Précisé par le porteur (2026-10-15)* : c'est bien **la vue d'ensemble à l'arrivée sur le terrain** (`client/src/arrivee.ts`, 0.8.2 chantier G). **La brume semble flotter très au-dessus du terrain**, et **pendant le zoom** (le retour vers le personnage), **ça fait un effet bizarre**.
   - La brume de l'aube (`client/src/rendu/brume.ts`, de 4 h 30 à 9 h environ) : **trois nappes plates de 70 m × 70 m**, à 0,12 à 0,48 m du sol, transparentes, qui ignorent le brouillard de la scène (`fog: false`) et **suivent le centre de la caméra** (`brume.animer(…, scene.centre, …)`, `client/src/main.ts:1920`), la texture étant recalée pour paraître posée sur le monde.
   - **Causes probables** (à vérifier en lançant la vue d'ensemble vers 6 h 30) :
     - vue de haut, une nappe uniforme, de même opacité partout, se lit comme un **voile au-dessus** de tout, pas comme une brume au ras de l'herbe ; ses bords carrés peuvent se voir ;
     - pendant le zoom, le centre de la caméra se déplace : les nappes **glissent avec lui** et la texture est recalée à chaque image, d'où l'effet bizarre.
   - Pistes : pendant la vue d'ensemble, atténuer ou masquer la brume (ou la faire apparaître seulement à la fin du zoom) ; ou poser les nappes sur le terrain lui-même, sans suivre la caméra, avec des bords fondus.

## 1 quater. Le prochain correctif (0.9.1) : retenu par le porteur le 2026-10-15

> ~~Planification seulement : rien n'est codé.~~ *Fait : tout est codé en **0.10.1** (le correctif a pris ce numéro, après la 0.10 ; plan `plan-0.10.1.md`).* Les numéros renvoient aux points ci-dessus.

| # | Sujet | Où c'est décrit | Reste à trancher |
|---|---|---|---|
| ~~A1~~ | ~~L'idée de l'escabeau ne vient jamais~~ | §1 ter, point 1 | *Fait en 0.10.1.* |
| ~~A2~~ | ~~Ramasser les pierres qu'on lance~~ | §1 ter, point 2 | *Fait en 0.10.1.* |
| ~~A3~~ | ~~Le menu d'échange sur iPhone (vertical et horizontal)~~ | §1 ter, point 3 | *Fait en 0.10.1.* |
| ~~A4~~ | ~~Les bouteilles d'eau d'1 L~~ | §1 ter, point 4 | *Fait en 0.10.1.* |
| ~~A5~~ | ~~Plusieurs gourdes : 1 L par gourde, une seule réserve~~ | §1 ter, point 5 | *Fait en 0.10.1.* |
| ~~A6~~ | ~~Le zoom au double appui sur iPhone~~ | §1 ter, point 6 | *Fait en 0.10.1.* |
| ~~A7~~ | ~~Les saisons : plus de faim l'hiver, plus de soif l'été~~ | §1 ter, point 7 | *Fait en 0.10.1.* |
| ~~A8~~ | ~~La jauge de soif à 1,5 L, la soif ralentie (0,21)~~ | §1 ter, point 8 | *Fait en 0.10.1.* |
| ~~A9~~ | ~~Le bouton « Tourner la vue » devient une boussole~~ | §1 ter, point 9 | *Fait en 0.10.1.* |
| ~~B2~~ | ~~Les textes du chemin de sortie : sud ou ouest~~ | §1 bis, point 2 | *Fait en 0.10.1.* |
| ~~C1~~ | ~~Les Éteints endormis gardent une lueur dans les yeux~~ | §2 | *Fait en 0.10.1.* |
| ~~C2~~ | ~~Pas de déconnexion pour inactivité pendant la pause~~ | §2 | *Fait en 0.10.1.* |
| ~~C3~~ | ~~Raccourcir les textes « Examiner » coupés à l'écran~~ | §2 | *Fait en 0.10.1.* |
| ~~A10~~ | ~~La vue d'ensemble à l'arrivée sur le terrain buggée avec la brume~~ | §1 ter, point 10 | *Fait en 0.10.1.* |
| ~~D1~~ | ~~Une fiche « Examiner » courte~~ | §3 | *Fait en 0.10.1.* |

**D1, la version courte proposée** (2026-10-15) : trois lignes au plus, seulement quand il y a quelque chose à dire : **Sert à** (les fabrications où l'objet entre) ; **Outil** (ce qu'il permet de faire : « couper, visser ») ; pour une installation, **pourquoi elle ne marche pas** (« il lui faut une batterie dans le sac »).

Les plus gros morceaux : A3, A5, A7, A9 et D1.

## 2. Questions anciennes jamais tranchées (avant la 0.6)

- ~~Les Éteints endormis gardent-ils une lueur des yeux à 70 % (le Book 23 dit « fermés ») ?~~ *Tranché le 2026-10-15 : **oui, une lueur** (le Book 23 est à corriger). Retenu pour la 0.9.1 (C1).* *Fait en 0.10.1 : le commentaire du code et le Book 23 le disent (≈ 70 %, qui grandit à l'éveil).*
- ~~La déconnexion pour inactivité est-elle suspendue pendant la pause ?~~ *Tranché le 2026-10-15 : **oui**, pas de déconnexion pendant la pause. Retenu pour la 0.9.1 (C2).* *Fait en 0.10.1 : en pause, jamais déconnecté ; les 5 min repartent à la fin.*
- ~~Faut-il raccourcir aussi les textes « Examiner » ?~~ *Tranché le 2026-10-15 : **oui, ceux qui sont coupés** à l'écran. Retenu pour la 0.9.1 (C3).* *Fait en 0.10.1 : aucun texte n'était coupé à l'écran, c'était le temps (12 s) ; les 12 textes trop longs ont leur version courte, validée mot pour mot (R-05).*
- ~~Le hangar de la Coopérative saccade-t-il sur l'iPhone (à mesurer avec `?mesure=1`) ?~~ *Non (le porteur, 2026-10-15).*
- ~~Le double appui de 350 ms dans le coffre convient-il ?~~ *Rayé par le porteur (2026-10-15).*

## 3. Études faites, non tranchées

- ~~**L'Examiner détaillé** (`.claude-travail/propositions/examiner-detaille.md`, maquette `maquettes/examiner/`) : la 0.8 n'en prend que les indices (question Q-0.8-17 du plan).~~ *Tranché le 2026-10-15 : **oui, mais court**. Retenu pour la 0.9.1 (D1, §1 quater).* *Fait en 0.10.1 (D1) : la variante V3 partout (Sert à, Outil, Se monte sur ; le bandeau « Ne marche pas » en tête de fiche) ; essayé par le porteur (R-14).*
- **Les lots de l'inventaire des constructions** (`.claude-travail/propositions/plan-lots-constructions.md`, 9 questions) : en grande partie remplacés par le nouveau système (bible, plan 0.8) ; à relire pour ce qui n'y est pas (pédalier complet, lampe qui consomme, tour à perche…).
- ~~**Les dégâts électriques E1–E8** (`degats-electriques.md`) : remplacés par les décisions V, C, D et K ; rien à reprendre.~~ *Plus d'actualité : codés en 0.8.*

## 4. Sujets mis de côté, à traiter après la 0.8

- ~~Le **niveau 2** (L2A, L2B, H2A, H2B) : la notice `notice-nouveau-niveau.md` en donne une esquisse ; C12 (l'établi reste sur la route B) est ouvert « plus tard ».~~ *Conçu le 2026-10-14 (`book/plans/niveau-2.md`, reporté dans la bible ; C12 fermée). Reste : les objets-clés de l'hôtel et du phare, les demandes à la session « bâtiments » (l'épave du cargo, la crique, l'étage de l'hôtel), et le code.*
- Le **relais d'armes** (« une super machette ★★ aussi forte qu'une machette ★★★★★ »).
- Les **caractéristiques des armes** en bonus/malus selon les ennemis ; les **ennemis évolués** (casque et autres) qui accompagnent la montée des dégâts.
- Les **munitions** (flèches, carreaux) : une règle cohérente sans tout déséquilibrer.
- ~~Les **réparations** (la tête du marteau ne s'use pas ; on répare le manche sans forge) : au-delà de ce que la 0.8 code.~~ *Fait en 0.8 (le manche à l'établi à étau) et 0.8.2 (la masse aussi).*
- ~~Vérifier les **noms des autres meubles** (établi, banc de recharge, pédalier…) comme pour la forge (un seul nom partout).~~ *Fait en 0.8 : « banc solaire », « pédalier générateur », « ventilateur à manivelle » partout (jeu, books, bible).*
- Le **rayon des Éteints** (0,30 m) plus mince que celui du joueur (0,35 m) : ils se glissent dans des fentes de 0,6 à 0,7 m où le joueur bute. Les aligner demande de déplacer les Éteints 2 et 7 du Moulin (proposition du chantier H de la 0.9).
- Le **Carrefour sans ressources au sol** : il faudrait en faire un lieu vivant (chantier G de la 0.9).
- Les **poules dans les haltes** (1 ou 2 par halte, partagées entre joueurs) : écartées « pour l'instant » de la 0.9 (2026-10-13) ; il faut d'abord une faune partagée dans les lieux à plusieurs (`plan-0.9.md` §2.7).
- La **halte de cueillette et de chasse** (gibier, boyaux, corde d'arc en boyau) : Book 99.
- La **bibliothèque de bâtiments** `batiment/` : à valider par le porteur ; Book 99.
- Le **combat entre joueurs** : règles du duel décidées le 2026-10-13 (`duel-entre-joueurs.md`). **Planifié en 0.11 le 2026-10-16** (`plan-duel.md`), avant les murs et les sols ; questions D-7 à D-24 tranchées, maquettes choisies (D-19). **Codé en 0.11 le 2026-10-16 (0.11.0, en préparation)** : en recette, à essayer par le porteur sur l'iPhone à deux comptes, puis à déployer. *En attente du porteur* : les phrases « Un duel commence : l'échange est annulé. » et « … la leçon s'arrête. » ; un coup épuisé à part pleine ; l'arme gagnée neuve ; la saisie à trois qui fait lâcher prise ; le message d'effondrement montré au retour d'un corps (pas codé).

## 5. Où sont les choses

- Le plan de la 0.8 : `book/plans/plan-0.8.md` (prompt de lancement donné au porteur le 2026-10-10).
- La bible : `book/bible/progression-et-equilibrage.html`, régénérée par `python3 .claude-travail/propositions/outils/construire-page.py` ; publiée en https://claude.ai/artifact/4FF8F1SQ1LSVmbfPyLzhFH.
- Le plan de la 0.9 (après la 0.8.3) : `book/plans/plan-0.9.md`.
- Le niveau 2 (décisions et propositions) : `book/plans/niveau-2.md`.
- La notice d'un nouveau niveau : `book/plans/notice-nouveau-niveau.md`.
- Les études et données : `.claude-travail/propositions/` (non versionné : à ne pas supprimer).
- ~~Versions : 0.7.3 déployée le 2026-10-10 (étiquette v0.7.3).~~ Versions : 0.8 et 0.8.1 déployées le 2026-10-11, 0.8.2 le 2026-10-13 ; 0.8.3 le 2026-10-13 (étiquette v0.8.3) ; 0.8.4 le 2026-10-13 (étiquette v0.8.4, avec la barre de métal à 1 de dégâts) ; 0.9 le 2026-10-14 (étiquette v0.9) ; 0.10 le 2026-10-15 (étiquette v0.10) ; 0.10.1 le 2026-10-16 (étiquette v0.10.1, plan `book/plans/plan-0.10.1.md`). Le plan de la 0.8.2 : `book/plans/plan-0.8.2.md`.

## 6. Après la 0.10 (recette du 2026-10-15)

> Tenu par la session du jeu ; source : `book/plans/plan-0.10.md` (§12, §13) et la recette N2.

### Pour plus tard (décidé « plus tard » pendant la 0.10)

- **Les buts de carnet du niveau 2** (des quêtes après « S'installer » et « Le métier ») : le niveau 2 n'en a pas ; ses seuls buts sont les portes nommées, les lieux atteints et les objets-clés trouvés. — plan 0.10, V3-05 ; `npm run rythme` (écart max entre buts : 22 à 42 min).
- **Les murs et les sols** (mur de branches, claie, plancher, sol de pierres, mur de planches, porte de planches ; le vrai objet « planche rabotée ») : ~~en 0.10.2~~ **en 0.12**, après le duel (0.11) (décidé le 2026-10-16, D-7 ; à l'origine le 2026-10-15, Q-1 du plan de la 0.10.1 ; une maquette d'abord). — plan 0.10, Q-0.10-1, §8.1 ; V1-04, V1-21 ; plan 0.10.1, chantier F.
- **Les manches + 25 % de l'établi de menuisier** : reportés (il faut une solidité par exemplaire). — plan 0.10, V1-04.
- **L'angle nord-est de la tour du phare** : les Éteints venus du nord s'y coincent. — plan 0.10, V4-11.
- **Les Éteints ne contournent rien** (le guindeau, les portes des conteneurs de l'épave, l'angle de la tour) : pas de recherche de chemin. — plan 0.10, V4-14 ; Book 06 §2.1 et §5.2.
- **Le cargo en marche de la session « bâtiments »** (`batiment/phare/cargo.js`, d'un seul bloc), avec son sillage et sa houle : la scène garde pour l'instant le cargo de la maquette, sans sillage ni houle. — plan 0.10, V4-18 ; réponse des bâtiments, P-9.
- ~~**Le coup appuyé à la tête** : le garder ou non.~~ *Gardé : avec la jauge, le porteur l'a vu marcher sur l'iPhone (2026-10-15).* Reste à voir : un retour visible du coup au torse sur le Noyé. — plan 0.10, V4-12.
- **Les draps noués de la lingerie** (seconde sortie de l'hôtel, `niveau-2.md` §9.2) : non faits, le balcon suffit (S-11) ; la bible les cite encore dans la promesse de L2A. — recette N2.
- **Une pierre lancée dans la mer, au phare**, devrait disparaître, comme dans la mare (décidé « plus tard » le 2026-10-16). — plan 0.10.1, R-04.
- **L'escabeau à essayer sur l'iPhone** à la saison des fruits : l'idée qui vient en visant un fruitier mûr trop haut (A1) n'est couverte que par les tests. — plan 0.10.1, R-14.
- **L'espace insécable de R-07 n'a pas touché** les unités écrites en toutes lettres (« 3 mètres », « 2 litres ») ni les enseignes des bâtiments (les textes des modèles importés, `client/src/batiments/`) ; les enseignes sont **à transmettre à la session « bâtiments »**. — plan 0.10.1, R-07.

### À transmettre à la session « bâtiments »

- **Les petits défauts de décor relevés à l'import** : les bords des alentours (en vue d'ensemble, le lot et ses alentours du gué s'arrêtent encore net sur le ciel, comme un bloc : capture `.claude-travail/captures/gue-arrivee-5000.png` du worktree n2-recette), les cimes du gué, les dunes du pont. — plan 0.10, V4-18 ; recette N2.
- **Le verre des lanternes des panneaux de sortie luit aussi un peu de jour** (matière additive) : accepté pour la 0.10 ; à reprendre si le porteur le veut (un verre qui ne luit que la nuit). — plan 0.10, V4-18 ; réponse des bâtiments (R0-1).
- **Plus aucune marge de budget** à l'hôtel et au bourg de la route du pont (40 appels de dessin), ni au phare (39 avec l'épave) : tout ajout futur devra se fondre dans l'existant. — réponse des bâtiments (budgets).

### À mesurer

- ~~**Le Pi après le déploiement de la 0.10.**~~ *Abandonné (le porteur, 2026-10-15) : le jeu migrera sur un VPS avant de monter en charge ; la mesure se fera là (`scripts/banc-charge.ts grand_hotel 10 30`, puis `phare`). Sur le Mac : 8 à 10 ms de retard p99 à 10 joueurs.* — plan 0.10, critère 12.

### Ce que la recette a trouvé

- ~~**Le statut de la bible est écrit en dur.**~~ *Réglé le 2026-10-15 : « niveau 2 codé en 0.10 », l'étiquette sur les lignes du niveau 2, le bandeau qui suit la version (5.5).* — recette N2.
- ~~**La rampe de LED** : la bible et le code ne disaient pas la même chose.~~ *Réglé le 2026-10-15 : la bible suit le code (3 W la nuit, ≈ 5,5 Wh par nuit de jeu, batterie à 15 m) ; le pack (de cellules ou soudé) est bien demandé par le code, il reste dans la bible.* — recette N2.
- ~~**Le test instable** de `npm test`.~~ *Corrigé : `client/src/rendu/sang.test.ts` (des gouttes retombaient sur la rampe), 40 passages sur 40.* — recette N2.
