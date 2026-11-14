# Consigne des agents : les retouches de la 0.10 et la règle R52

Cette consigne **complète** `CONSIGNE-AGENTS.md`, `CONSIGNE-HALTES.md` et `CONSIGNE-NIVEAU-2.md` : lis-les d'abord. La
demande du jeu est `book/plans/demande-batiments-0.10-retouches.md` (lecture seule) : **lis sa section 0 et celle de ton
lieu**. Une sauvegarde de l'état d'avant est faite dans `.claude-travail/avant-0.10-retouches/` : rien à copier.

## La règle R52 : « un lieu ne s'arrête jamais net »

Désormais valable pour tous les lieux (`book/plans/notice-nouveau-niveau.md`, R52) :

- **chaque bord du lot a un obstacle visible et crédible** (muret, ganivelle, haie, éboulis, rochers, mer profonde,
  façades), noté dans `obstacles` là où l'on bute ;
- **le décor se prolonge au-delà du lot** de 30 à 60 m, en version légère : le sol, la côte, la falaise, la roche, les
  routes et chemins qui continuent. Les vues d'ensemble de l'arrivée (caméra haute) ne doivent plus montrer un tapis
  posé sur le ciel ;
- **une sortie se montre** : un chemin dessiné qui continue hors du lot, et un **panneau de sortie lisible de nuit comme
  de jour**.

## Les formats

- **Les alentours** (le décor au-delà du lot) vont dans un groupe nommé `alentours` (`name` = `userData.nom`), rangé
  aussi dans `userData.objets.alentours`. Ils sont **très légers** : de grands polygones à couleur par sommet, peu de
  matières (partage celles du lot), pas d'obstacles hors du lot. Vise **≤ 4 000 triangles et ≤ 3 appels** pour eux.
  Pour une halte en tronçons : chaque tronçon porte sa bande nord et sud, les tronçons des bouts portent en plus le
  prolongement ouest ou est.
- **Les panneaux de sortie** (R0-1) : plus grands qu'avant (lisibles à 375 px de large en vue de jeu, environ 1,6 ×
  0,9 m au moins), **tournés vers la caméra sud-est** par défaut, la **vraie destination peinte** (textes validés dans
  la demande, à recopier exactement), et **une lanterne au-dessus** qui luit la nuit : une petite boîte de lumière
  (matière lueur partagée) et une entrée dans `lumieres` (`nature: "lanterne du panneau de sortie"`). Chaque panneau
  est un objet nommé `panneau_sortie_<ouest|est|nord|greve>` et figure dans `FICHE.panneaux` (ou `panneauxSortie`)
  avec `{ x, z, texte, sortie }`. Dans un atlas, un texte se dessine en grosses lettres sombres sur fond clair.
- **La mer** (R0-3) : **une seule matière** pour l'eau du lot et celle des alentours. L'eau **peu profonde** (où l'on
  marche, jusqu'aux genoux) est plus claire et turquoise, l'eau **profonde** plus sombre, avec **une ligne de brisants**
  (écume blanche) à la limite. Donne la limite dans la `FICHE` (`mer: { peuProfonde: …, profonde: … }`, en une phrase
  ou en coordonnées).

## Ce que le jeu a déjà posé en attendant

Le jeu a codé des retouches provisoires dans `.claude-travail/integration-0-10/code/client/src/rendu/` (`bords-*.ts`,
`decor-cote.ts`, `phare-*.ts`, `lanterne-panneau.ts`) : **lis-les** (lecture seule) pour voir où il a posé ses
murets, ganivelles, panneaux et routes, et faire au moins aussi bien dans le modèle. Les captures de la revue sont
dans `.claude-travail/revue-r52/images/` : regarde celles de ton lieu.

## Les règles qui restent

- **Budget par carte ou tronçon, pire cas, usure 1 : ≤ 60 000 triangles, ≤ 40 appels, ≤ 8 lumières**, alentours et
  lanternes compris. Plusieurs lieux sont déjà au plafond d'appels : ce que tu ajoutes doit **se fondre dans les
  matières existantes** (une lanterne en matière lueur déjà présente, les alentours dans les matières du sol). Libère
  des appels si besoin en fusionnant des matières proches.
- Les passages restent ≥ 1,2 m. Ne casse rien de ce qui a été livré (objets nommés, obstacles à part, pièces, portes,
  `hauteurSol` du phare).
- **Périmètre** : tu n'écris **que** dans le dossier (ou le fichier) qu'on t'a attribué. Pas de `/tmp`, pas de commit,
  pas de serveur à lancer (le serveur tourne sur le port 8792). Ne touche ni à `commun/`, ni à `catalogue.js`, ni aux
  `README.md` / `CONSIGNE-*.md`.
- Navigateur : **ton propre onglet** (`tabs_create`, puis `navigate` avec ce `tabId`), fermé à la fin. Force le cache
  avant de recharger : `await fetch('/<id>/modele.js', { cache: 'reload' })`. `&montrer=a,b&cacher=c` montre ou cache
  des objets nommés.
- Vérifie **la vue d'ensemble** (caméra haute, de jour et de nuit) : le lot ne doit plus flotter sur le ciel, et les
  panneaux doivent se lire.

## Rapport final (court, en français)

Demande par demande : ce qui est fait, les coordonnées utiles au jeu (panneaux, sorties, limites de la mer, ce que le
jeu peut retirer de ses retouches), les budgets mesurés (pire cas, usure 0,1 et 1), ce qui n'a pas pu être fait.
