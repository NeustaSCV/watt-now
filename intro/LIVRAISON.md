# Watt Now? — l'introduction : livraison

> Dossier `intro/`, préparé le 2026-10-09. Rien n'a été modifié hors de ce dossier.
> La seule exception, autorisée par le porteur du projet : une entrée « intro » ajoutée dans `.claude/launch.json`, un petit serveur local pour la mise au point.

## 1. Ce que c'est

**« La dernière émission »** est une cinématique d'environ 2 min 40, qu'on peut passer. Elle est suivie de **la fiche d'accueil des Compteurs** en trois pages. Le tout s'affiche **juste après la création du personnage**, avant le terrain.

| Acte | Temps | Musique | Ce qu'on voit |
|---|---|---|---|
| I. Abondance TV | 0:00 → 0:38 | Petites musiques de télé synthétisées, puis le jingle de Watty | On entre dans la télé d'un salon où tout est branché. On zappe : le **Souffle-Soupe 3000**, la météo qui conseille de lancer son **sèche-linge en plein soleil**, le **perron mécanique** de trois marches, la **laisse-drone**. On ressort : le spectateur est **nourri par son fauteuil** et sa montre lui rappelle de **cligner des yeux** (« Bravo ! 12 pas aujourd'hui »). Ensuite, les **arroseurs sous la pluie** et une **pomme livrée par drone au pied d'un pommier**, qui tombe sur la tête du client. Enfin la réclame de Watty : « WATT… NOW? »… et la **coupure**. |
| II. La Grande Panne | 0:38 → 1:07 | Naissance du thème, sons trouvés | Le salon dans le noir. La ville s'éteint par quartiers, vue du ciel. Les volets électriques restent fermés en plein jour, le frigo connecté demande une mise à jour. La nuit, sur un banc, l'écran d'un téléphone attire **les Éteints**, aux yeux blancs dans la brume. Le récit passe par des flashs de radio. |
| III. Ceux qui savaient encore faire | 1:07 → 2:16 | Un bloc du thème par famille | 🔥 **Nadia** souffle elle-même sur la braise, puis forge en frappant sur le temps. ⚡ **Malik** rebranche une batterie à la lueur de sa frontale ; l'abri s'allume, il éteint sa lampe. ⚙️ **Rose** pédale sous la pluie pour allumer sa lampe pendant que le récupérateur se remplit, puis cueille sa pomme à l'aube. Chaque scène répond à un gag de la télé. |
| IV. Ensemble | 2:16 → 2:39 et au-delà | Les trois familles, puis la boucle | L'aube sur le **Comptoir du Carrefour** du jeu, où trois voyageurs convergent. L'affiche de Watty en ruine, corrigée au feutre : « WATTY MENT ! », « Réfléchis par toi-même ! ». Puis **le personnage du joueur**, sur son terrain, à côté du vieux vélo, avec une phrase propre à sa famille. Le titre ***WATT NOW?*** et « Et maintenant ? », puis le bouton « Continuer ». |

Ensuite, **les écrans d'accueil** (direction « tableaux 3D », validée par le porteur le 2026-10-09) : trois tableaux vivants, rendus par le même moteur que la cinématique (`src3d/accueil.js`), avec par-dessus un titre, un texte, une note au feutre et des étiquettes accrochées aux objets 3D, qui suivent la caméra (`src3d/ecrans.js`). Le joueur clique sur « Suivant », puis « Entrer dans le monde » :

1. **Ton terrain** : ton campement au crépuscule (feu, abri, installation de ta famille, vieux vélo), les bornes du terrain, et deux Éteints à la lisière, attirés par la lueur. Chez toi, aucun joueur ne peut t'attaquer.
2. **Les lieux lointains** : le Grand Hôtel des Flots à l'heure dorée (le modèle de la bibliothèque `batiment/grand-hotel/`, lu sans être modifié et empaqueté avec le rendu du jeu), sans autre joueur à l'image. Des expéditions pour les ressources ; certains lieux sont multijoueurs, d'autres non (le porteur ne veut pas promettre d'autres joueurs).
3. **Le Comptoir** : terrain neutre ; deux joueurs troquent, une Mécaniste montre un geste à un Voltaïque, le guichet des Compteurs. Commerce, troc, apprendre et enseigner.

Sur un téléphone tenu droit, le texte passe sous l'image. Les maquettes de travail des trois directions proposées sont dans `maquettes/`. Sans WebGL (ou en cas d'erreur), l'intro montre à la place l'ancienne **fiche d'accueil des Compteurs** :

1. **Le monde d'aujourd'hui** : les Wh, le wott, sa décharge, le Comptoir.
2. **Rester en vie** : les besoins, l'eau à faire bouillir, la signature (bruit, fumée, lumière), les Éteints, la nuit.
3. **Ta place** : la famille du joueur (portrait, devise, énergie), le terrain, la carte, les trois familles, le temps, ce qui se passe quand on part.

La fiche n'explique que des mécanismes déjà dans le jeu, recoupés avec `code/client/src/aide-contenu.ts`. Elle ne parle pas d'argent réel, ni de la grande quête, ni du cycle de deux mois, qui n'est pas encore construit.

## 2. Comment c'est fait

- **Les personnages sont ceux du jeu.** `outils/empaqueter.sh` empaquette en lecture seule le rendu du jeu (`code/client/src/rendu/`) avec three.js dans `vendor/rendu-jeu.js`, et copie les modèles dans `assets/personnages/`. On y trouve les corps Quaternius retravaillés, les tenues et accessoires de famille, et les 34 animations. On y trouve aussi le feu de camp, la forge, le banc de recharge, le panneau solaire, l'abri, le pédalier, le récupérateur de pluie, le pommier, le vélo, la batterie et le Comptoir du Carrefour. **À relancer quand le rendu du jeu change.**
- **La qualité « cinéma »** (2026-10-09, à la demande du porteur : « on n'est pas limités en polygones ») :
  - les **personnages en haute définition**, préparés par `outils/preparer-personnages-hd.mjs` : maillages complets, textures en 2048², cartes de relief. Ils viennent des packs de `download/`, lus sans être modifiés ;
  - des **matériaux lisses**, des **boîtes aux arêtes arrondies**, des cylindres et des sphères très fins ;
  - **l'herbe** : des dizaines de milliers de brins courbés, de couleurs variées, qui ondulent au vent ;
  - **un pommier modélisé pour la cinématique** : branches en tubes, environ 9 000 feuilles, pommes lisses ;
  - **les nuages** dans les ciels de jour et d'aube ;
  - **la chaîne d'image** : anticrénelage multi-échantillons, **occlusion ambiante** (GTAO), **profondeur de champ** sur les gros plans, halo, étalonnage ;
  - **le flou de mouvement** :
    - en vidéo, un vrai obturateur à 180° (6 sous-images par image, moyennées) ;
    - en direct, une rémanence légère, coupée à chaque changement de plan ;
  - **la vidéo est suréchantillonnée** : rendue en 3840 × 2160, puis réduite en 1080p.
- **La mise en scène** (`src3d/`) :
  - les acteurs suivent des pistes d'animation déterministes, avec une cinématique inverse pour les bras, **les jambes** (pieds sur les pédales) et le regard, et **des mains qui se referment** sur ce qu'elles tiennent (`acteurs.js` : `atteindre`, `poser`, `serrer`, segments `plage` pour rester dans une partie d'un geste) ;
  - **des gestes en plus** de ceux du jeu (téléphone à l'oreille, rampe, arrosoir, semis…), tirés des mêmes packs Quaternius par `outils/preparer-animations.mjs` (`assets/personnages/animations_intro_1|2.glb`) ;
  - **les outils sont en main** : le marteau et la pince de forge de Nadia (la pince tient le fer), les pinces crocodile et leurs câbles de Malik, la pomme cueillie, mise dans la hotte, la cuillère, le verre, les téléphones ;
  - **quelques objets du Survival Kit de Kenney** (CC0, `assets/kenney/`, licence jointe) : le tonneau de trempe de la forge, le seau sous la pluie ; les autres modèles du kit sont prêts à servir (`src3d/kenney.js`) ;
  - les caméras suivent des courbes d'Hermite sans dépassement ;
  - un étalonnage de cinéma termine l'image : halo, vignette, grain, aberration, tube cathodique pour la télé, effondrement de l'écran à la coupure (`moteur.js`).
- **Le son** (`src/son.js`, `src/tele-sons.js`) :
  - la télé est synthétisée dans le navigateur ;
  - à 0:33, le **thème principal déjà validé** prend le relais (`assets/musique/`, copie du prémix mobile de `musique/production/mobile/titre/`) ;
  - **l'horloge du son pilote l'image**, ce qui garde l'image calée sur la musique même si l'appareil rame.
- **Les cartons** (texte seul, sans voix : des voix de synthèse — Kokoro, Piper — ont été essayées puis écartées par le porteur) sont dessinés **dans l'image**, et apparaissent donc aussi dans la vidéo exportée. Quand l'image est trop petite (téléphone tenu droit), ils passent **en texte sous l'image**.
- **Pas d'à-coup** : tous les plans sont construits et compilés **pendant l'écran de chargement** (la batterie qui se charge, Watty, un conseil des Compteurs).
- **Secours** : sans WebGL, l'intro joue une version dessinée en SVG (`src/cinematique2d.js` et les `src/plans-*.js`). Elle raconte la même histoire.

## 3. Brancher dans le jeu (pour la session de code)

**Décision du porteur (2026-10-09) : le jeu intègre seulement les trois écrans d'accueil, pas la cinématique** (qui reste une vidéo de présentation). Tout est dans **[`NOTICE-DEV.md`](NOTICE-DEV.md)** : `jouerAccueil(document.body, { famille, apparence, base: '/intro/' })`, après une création de personnage, avant le terrain.

## 4. La vidéo

```bash
node intro/outils/capture.mjs charbonniers
```

- Options : `--flou 6` (sous-images de flou de mouvement), `--ss 2` (suréchantillonnage). Le rendu complet prend une vingtaine de minutes ou plus.
- Le serveur « intro » doit tourner (`.claude/launch.json`, port 8791).
- La commande pilote Chrome sans fenêtre et rend chaque image au temps exact (1920 × 1080, 30 images/s). Elle mixe la bande-son hors ligne, puis assemble avec ffmpeg dans `intro/video/watt-now-intro-<famille>.mp4`. Familles possibles : `charbonniers`, `voltaiques`, `mecanistes`.
- `--planche` produit à la place une planche-contact (une image toutes les 2 s), pratique pour relire tout le film d'un coup d'œil.
- Les fichiers de travail vont dans `intro/.travail/`. Ce dossier et les vidéos sont ignorés par Git (`intro/.gitignore`).

## 5. Mise au point

| Page | Usage |
|---|---|
| `index.html` | La démonstration complète, avec le son. Paramètres : `?depuis=60` (démarre à 60 s), `?ecrans=2` (l'écran d'accueil n° 2), `&auto` (sans attendre le clic), `?fiche=2` (la fiche de secours), `?version=2d`, `?famille=voltaiques` |
| `labo.html?m=accueil&t=1010` | Les tableaux d'accueil (0, 1000, 2000 : terrain, hôtel, Comptoir) |
| `labo.html?m=acte3&t=96` | Une image figée d'un acte, à un instant donné. Dans la console, `window.__cam = [[x,y,z],[vx,vy,vz],focale]` place une caméra libre |
| `capture.html` | La page pilotée par l'export vidéo |
| `outils/photo.mjs` | Photos du labo sans fenêtre : `node intro/outils/photo.mjs --serie poses/x.jpg "m=acte3" "80;96|cam=x,y,z,vx,vy,vz,f"` (dans `intro/.travail/`) |
| `labo.html?plan=essai-gestes&clips=A,B&k=0.5` | Une rangée de personnages, chacun figé dans un geste (pour choisir) |

## 6. À valider ou à faire ensuite

- **À regarder et à écouter sur iPhone 13** : la fluidité (beaucoup de lumières et d'ombres la nuit), la mémoire (tous les plans sont construits d'avance) et la lisibilité des cartons en paysage.
- **Le mixage des sons de télé** est fait « à l'oreille du code », sans écoute : il est à vérifier, surtout le niveau des petites musiques par rapport au thème.
- Le Book 18 §6.2 cite « réfléchis, toi » parmi les graffitis : l'intro dit désormais « Réfléchis par toi-même ! ». La correction est à reporter dans le book.
- Les visages restent ceux de la base du jeu (Book 21 §5.7, à affiner). Une vraie animation de souffle ou de grimpe ajouterait du jeu aux scènes de Nadia et de Malik.
- Les Books 14, 15 et 21 notent encore la séquence d'introduction comme « à décider ». À reporter par la session qui tient les books, si le porteur valide.
