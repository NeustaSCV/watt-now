# Ce qui reste en suspens (au 2026-10-10)

> Tenu par la session du jeu. Tout ce qui a été dit ou décidé en discussion mais qui n'est pas encore entré dans un book, la bible ou le plan de la 0.8. À relire au début d'une nouvelle session ; rayer ce qui est fait.

## 1. À transmettre à d'autres sessions

- **Session « bâtiments »** : les changements du modèle du Moulin (et du gué) pour la 0.8 — demande complète dans `.claude-travail/propositions/demande-batiment-moulin.md` (passages trop étroits de 0,58 m et 0,74 m, nord fermé, mur de clôture, planche du bief, if, tableau à clés, étau et poutres au nord, 22 Éteints, pièces et portes pour la vision par pièce). Le chantier 12 de la 0.8 en dépend.
- **Session « intro »** (écrans d'accueil, branchés en 0.7.1 ; copie dans `code/client/public/intro/`, `npm run accueil:importer` pour la refaire) :
  1. en paysage sur iPhone 13 mini (812 × 320), l'image 3D tombe à 0 px : garder l'image à gauche et le texte à droite (`src3d/ecrans.js`, `ajuster()`, et `intro.css`) ;
  2. `src3d/acteurs.js` demande `assets/personnages/animations_intro_1.glb` et `_2.glb`, que la notice dit de ne pas servir (deux 404 sans conséquence) ;
  3. en vertical (375 × 630), une grande bande noire entre l'image et le texte.

## 2. Questions anciennes jamais tranchées (avant la 0.6)

- Les Éteints endormis gardent-ils une lueur des yeux à 70 % (le Book 23 dit « fermés ») ?
- La déconnexion pour inactivité est-elle suspendue pendant la pause ?
- Faut-il raccourcir aussi les textes « Examiner » ?
- Le hangar de la Coopérative saccade-t-il sur l'iPhone (à mesurer avec `?mesure=1`) ?
- Le double appui de 350 ms dans le coffre convient-il ?

## 3. Études faites, non tranchées

- **L'Examiner détaillé** (`.claude-travail/propositions/examiner-detaille.md`, maquette `maquettes/examiner/`) : la 0.8 n'en prend que les indices (question Q-0.8-17 du plan).
- **Les lots de l'inventaire des constructions** (`.claude-travail/propositions/plan-lots-constructions.md`, 9 questions) : en grande partie remplacés par le nouveau système (bible, plan 0.8) ; à relire pour ce qui n'y est pas (pédalier complet, lampe qui consomme, tour à perche…).
- **Les dégâts électriques E1–E8** (`degats-electriques.md`) : remplacés par les décisions V, C, D et K ; rien à reprendre.

## 4. Sujets mis de côté, à traiter après la 0.8

- Le **niveau 2** (L2A, L2B, H2A, H2B) : la notice `notice-nouveau-niveau.md` en donne une esquisse ; C12 (l'établi reste sur la route B) est ouvert « plus tard ».
- Le **relais d'armes** (« une super machette ★★ aussi forte qu'une machette ★★★★★ »).
- Les **caractéristiques des armes** en bonus/malus selon les ennemis ; les **ennemis évolués** (casque et autres) qui accompagnent la montée des dégâts.
- Les **munitions** (flèches, carreaux) : une règle cohérente sans tout déséquilibrer.
- Les **réparations** (la tête du marteau ne s'use pas ; on répare le manche sans forge) : au-delà de ce que la 0.8 code.
- Vérifier les **noms des autres meubles** (établi, banc de recharge, pédalier…) comme pour la forge (un seul nom partout).
- La **halte de cueillette et de chasse** (gibier, boyaux, corde d'arc en boyau) : Book 99.
- La **bibliothèque de bâtiments** `batiment/` : à valider par le porteur ; Book 99.
- Le **combat entre joueurs** : règles du duel décidées le 2026-10-13 (`duel-entre-joueurs.md`), à coder **bien après la 0.9**, une fois la fluidité validée , toutes les questions tranchées.

## 5. Où sont les choses

- Le plan de la 0.8 : `book/plans/plan-0.8.md` (prompt de lancement donné au porteur le 2026-10-10).
- La bible : `book/bible/progression-et-equilibrage.html`, régénérée par `python3 .claude-travail/propositions/outils/construire-page.py` ; publiée en https://claude.ai/artifact/4FF8F1SQ1LSVmbfPyLzhFH.
- Le plan de la 0.9 (après la 0.8.3) : `book/plans/plan-0.9.md`.
- La notice d'un nouveau niveau : `book/plans/notice-nouveau-niveau.md`.
- Les études et données : `.claude-travail/propositions/` (non versionné : à ne pas supprimer).
- Versions : 0.7.3 déployée le 2026-10-10 (étiquette v0.7.3).
