# Ce qui reste en suspens (au 2026-10-10)

> Tenu par la session du jeu. Tout ce qui a été dit ou décidé en discussion mais qui n'est pas encore entré dans un book, la bible ou le plan de la 0.8. À relire au début d'une nouvelle session ; rayer ce qui est fait.

## 1. À transmettre à d'autres sessions

- ~~**Session « bâtiments »** : les changements du modèle du Moulin (et du gué) pour la 0.8 — demande complète dans `.claude-travail/propositions/demande-batiment-moulin.md` (passages trop étroits de 0,58 m et 0,74 m, nord fermé, mur de clôture, planche du bief, if, tableau à clés, étau et poutres au nord, 22 Éteints, pièces et portes pour la vision par pièce). Le chantier 12 de la 0.8 en dépend.~~ *Fait : livré (2026-10-10, puis les retouches du 2026-10-13), importé en 0.8 et en 0.8.3.*
- **Session « intro »** (écrans d'accueil, branchés en 0.7.1 ; copie dans `code/client/public/intro/`, `npm run accueil:importer` pour la refaire) :
  1. ~~en paysage sur iPhone 13 mini (812 × 320), l'image 3D tombe à 0 px : garder l'image à gauche et le texte à droite (`src3d/ecrans.js`, `ajuster()`, et `intro.css`) ;~~ *Fait : livré par l'intro, importé en 0.8.3.*
  2. ~~`src3d/acteurs.js` demande `assets/personnages/animations_intro_1.glb` et `_2.glb`, que la notice dit de ne pas servir (deux 404 sans conséquence) ;~~ *Fait : livré par l'intro, importé en 0.8.3.*
  3. en vertical (375 × 630), une grande bande noire entre l'image et le texte.

## 1 bis. À corriger en 0.8.4 (relevé sur la 0.8.3 déployée, 2026-10-13)

> *Fait : les trois points sont codés en 0.8.4 (étiquette v0.8.4), déployée le 2026-10-13. Reste à les essayer sur l'iPhone, surtout le point 1.*

1. ~~**Image déformée à l'arrivée sur le terrain (premier lancement).** Juste après les 3 écrans d'accueil, en arrivant sur le terrain, l'image est étirée, comme si l'image verticale avait été mise à l'échelle pour remplir l'horizontale. Passer le téléphone en vertical puis le remettre en horizontal remet tout d'aplomb. À faire : relire l'orientation et la taille réelles de l'écran au moment où l'on entre sur le terrain (taille du rendu et proportions de la caméra), sans jamais déformer : soit vertical, soit horizontal.~~ *Fait en 0.8.4 : la scène revérifie la taille de la fenêtre à chaque image (`rendu/scene.ts`, `dessiner()`). Cause probable : sur iPhone, « resize » arrive avant la nouvelle taille. À confirmer sur le téléphone.*
2. **Tutoriel : « le chemin » pour sortir du terrain n'est pas clair.** *Tranché le 2026-10-13 : piste B. Fait en 0.8.4 (`sortiePourPartir`, `commun/src/lieux.ts`) ; on ne part pas quand un Éteint nous tient ; textes réécrits sans « au sud ».* Sur le **terrain seulement**, on peut partir par la carte **depuis n'importe où** ; sur les autres lieux, rien ne change (il faut toujours aller jusqu'à la sortie). Les textes du tutoriel, de l'aide (`code/client/src/aide-contenu.ts:628`) et de la carte (`code/client/src/carte.ts:451`, « Pour partir, rejoins le chemin, au sud de ton terrain ») sont à réécrire en conséquence.
   
   Au passage, l'incohérence « sud » / « ouest » : ces textes placent le chemin au **sud**, alors que le porteur voit le début du chemin et le panneau à l'**ouest**. Si un texte nomme encore le chemin, vérifier sur le modèle du terrain et l'aligner.
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

## 2. Questions anciennes jamais tranchées (avant la 0.6)

- Les Éteints endormis gardent-ils une lueur des yeux à 70 % (le Book 23 dit « fermés ») ?
- La déconnexion pour inactivité est-elle suspendue pendant la pause ?
- Faut-il raccourcir aussi les textes « Examiner » ?
- Le hangar de la Coopérative saccade-t-il sur l'iPhone (à mesurer avec `?mesure=1`) ?
- Le double appui de 350 ms dans le coffre convient-il ?

## 3. Études faites, non tranchées

- **L'Examiner détaillé** (`.claude-travail/propositions/examiner-detaille.md`, maquette `maquettes/examiner/`) : la 0.8 n'en prend que les indices (question Q-0.8-17 du plan).
- **Les lots de l'inventaire des constructions** (`.claude-travail/propositions/plan-lots-constructions.md`, 9 questions) : en grande partie remplacés par le nouveau système (bible, plan 0.8) ; à relire pour ce qui n'y est pas (pédalier complet, lampe qui consomme, tour à perche…).
- ~~**Les dégâts électriques E1–E8** (`degats-electriques.md`) : remplacés par les décisions V, C, D et K ; rien à reprendre.~~ *Plus d'actualité : codés en 0.8.*

## 4. Sujets mis de côté, à traiter après la 0.8

- Le **niveau 2** (L2A, L2B, H2A, H2B) : la notice `notice-nouveau-niveau.md` en donne une esquisse ; C12 (l'établi reste sur la route B) est ouvert « plus tard ».
- Le **relais d'armes** (« une super machette ★★ aussi forte qu'une machette ★★★★★ »).
- Les **caractéristiques des armes** en bonus/malus selon les ennemis ; les **ennemis évolués** (casque et autres) qui accompagnent la montée des dégâts.
- Les **munitions** (flèches, carreaux) : une règle cohérente sans tout déséquilibrer.
- ~~Les **réparations** (la tête du marteau ne s'use pas ; on répare le manche sans forge) : au-delà de ce que la 0.8 code.~~ *Fait en 0.8 (le manche à l'établi à étau) et 0.8.2 (la masse aussi).*
- ~~Vérifier les **noms des autres meubles** (établi, banc de recharge, pédalier…) comme pour la forge (un seul nom partout).~~ *Fait en 0.8 : « banc solaire », « pédalier générateur », « ventilateur à manivelle » partout (jeu, books, bible).*
- La **halte de cueillette et de chasse** (gibier, boyaux, corde d'arc en boyau) : Book 99.
- La **bibliothèque de bâtiments** `batiment/` : à valider par le porteur ; Book 99.
- Le **combat entre joueurs** : règles du duel décidées le 2026-10-13 (`duel-entre-joueurs.md`), à coder **bien après la 0.9**, une fois la fluidité validée , toutes les questions tranchées.

## 5. Où sont les choses

- Le plan de la 0.8 : `book/plans/plan-0.8.md` (prompt de lancement donné au porteur le 2026-10-10).
- La bible : `book/bible/progression-et-equilibrage.html`, régénérée par `python3 .claude-travail/propositions/outils/construire-page.py` ; publiée en https://claude.ai/artifact/4FF8F1SQ1LSVmbfPyLzhFH.
- Le plan de la 0.9 (après la 0.8.3) : `book/plans/plan-0.9.md`.
- La notice d'un nouveau niveau : `book/plans/notice-nouveau-niveau.md`.
- Les études et données : `.claude-travail/propositions/` (non versionné : à ne pas supprimer).
- ~~Versions : 0.7.3 déployée le 2026-10-10 (étiquette v0.7.3).~~ Versions : 0.8 et 0.8.1 déployées le 2026-10-11, 0.8.2 le 2026-10-13 ; 0.8.3 le 2026-10-13 (étiquette v0.8.3) ; 0.8.4 le 2026-10-13 (étiquette v0.8.4, avec la barre de métal à 1 de dégâts). Le plan de la 0.8.2 : `book/plans/plan-0.8.2.md`.
