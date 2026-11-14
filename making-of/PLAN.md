# Making-of vidéo de *Watt Now?* — plan

> Rédigé le 2026-10-14. Rien n'est codé. Tout le travail de cette vidéo s'écrit dans `making-of/` ; `intro/`, `batiment/`, `code/` et `musique/` sont seulement lus (ou copiés).

## Décisions du porteur (2026-10-14)

1. **Premières versions refaites** : l'historique Git commence à la 0.1.1, où le personnage est déjà un corps riggé. Le prototype « quelques polygones » (et les étapes d'avant la 0.1.1 pour le décor et les créatures) est refait à la main, avec des formes simples.
2. **Personnage : un Voltaïque** (tenue bleu de travail, bande réfléchissante, lampe frontale, câble, batterie). L'apparence est libre : elle peut **se transformer en douceur** au fil de la vidéo (taille, corpulence, carnation, coiffure), pour finir **aux cheveux bleus**.
3. **Format : 16:9 seulement** (1920 × 1080, 30 images/s).
4. **Texte à l'écran : seulement le logo à la fin.** Pas de titre, pas de compteur de version, pas de numéro sur les panneaux : le passage d'une époque à l'autre se voit seulement à l'image.

## Mise en scène

- Le personnage reste **fixe au centre** et joue la marche ou la course sur place ; **le sol défile** sous lui, découpé en tronçons créés devant et recyclés derrière.
- La caméra est de trois-quarts, un peu en hauteur, avec un mouvement doux.
- **Le temps passe dans le décor** : une vague de lumière traverse le sol (un front perpendiculaire à la marche). Devant elle, le monde est déjà dans l'époque suivante ; quand le personnage la franchit, il change à son tour, avec une petite bouffée de poussière.
- **Calage sur le thème principal** (84 BPM, 4/4, une mesure = 2,86 s) : un changement d'époque toutes les une ou deux mesures, et les changements d'allure sur les temps forts.

## Découpage (10 mesures + la queue du son ≈ 30 s)

| Temps | Mes. | Allure | Personnage | Décor et créatures |
|---|---|---|---|---|
| 0 – 3 s | 1 | marche lente | capsule et cube, sans visage (prototype refait) | pelouse vert uni, plate, ciel uni |
| 3 – 9 s | 2 – 3 | marche | corps 3D gris, puis la tenue voltaïque | relief, puis herbes ; **arbres bâtons** (cylindre et cône) |
| 9 – 14 s | 4 – 5 | marche rapide | tenue complète, lampe, câble, batterie ; l'apparence commence à changer | la vraie forêt remplace les bâtons ; **poules et lapins** : blocs, puis les modèles du jeu, qui fuient à son passage |
| 14 – 20 s | 6 – 7 | course | coiffures successives | **Éteints** : silhouettes grises, puis l'Éteint du jeu, puis ses variantes (casqué, Rampant) ; lumière de crépuscule |
| 20 – 25 s | 8 – 9 | sprint | **version finale, cheveux bleus** | l'herbe devient sable, la mer arrive sur le côté, la lumière devient dorée |
| 25 – 30 s | 10 + queue | ralentit, s'arrête | il se tourne vers la mer | **zoom arrière** (la caméra recule et monte) qui découvre le Grand Hôtel des Flots ; **logo**, puis fondu sur la dernière note |

## Ressources réutilisées

- Rendu du jeu et three.js : `intro/vendor/rendu-jeu.js`
- Personnage : `code/client/src/rendu/personnage.ts` (couleur de cheveux personnalisée, 0.8.2)
- Faune : `code/client/src/rendu/faune.ts` ; Éteints : `eteint.ts`, `variantes-eteints.ts`
- Plage et hôtel : `batiment/grand-hotel/`
- Herbes, rochers : pack Kenney de `intro/assets/kenney/` (CC0)
- Musique : le thème principal (`musique/theme-principal/`, masters dans `musique/production/`)
- Export : sur le modèle de `intro/outils/capture.mjs` (Chrome sans fenêtre, image par image, ffmpeg)

## Étapes et estimation

| Étape | Temps |
|---|---|
| 1. Page de tournage : tapis roulant, caméra, export | ½ j |
| 2. Personnage : prototype refait → Voltaïque final, transformation de l'apparence, allures | ½ j |
| 3. Décor par époques : pelouse plate → relief, herbes → arbres bâtons → forêt → plage | ½ à 1 j |
| 4. Étapes des poules, lapins et Éteints | ½ j |
| 5. Plan final : plage, hôtel, lumière dorée, zoom arrière, logo | ½ j |
| 6. Calage sur la musique, mixage | ¼ j |
| 7. Relectures (planches-contact, 2 ou 3 passages) et export final | ½ j |
| **Total** | **≈ 3 jours** (et ≈ 1 h 30 de relecture pour le porteur) |
