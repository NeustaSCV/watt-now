# Making-of de *Watt Now?* — la vidéo

Une vidéo promotionnelle de 31 s (16:9). Le personnage marche puis court, toujours au centre de l'image. À chaque mesure de la musique, une vague de lumière électrique balaie le monde et le fait passer à l'époque suivante du développement : le personnage, le sol, les arbres, les poules, les lapins et les Éteints changent avec elle. À la fin, le personnage s'arrête sur la plage du Grand Hôtel des Flots, la caméra recule, et le logo apparaît.

Le plan et les décisions du porteur sont dans [PLAN.md](PLAN.md).

## Le résultat

- `video/watt-now-making-of.mp4` : la vidéo finale (1920 × 1080, 30 images/s, flou de mouvement) ;
- `video/watt-now-making-of-brouillon.mp4` : le brouillon (960 × 540, rendu en moins d'une minute) ;
- `video/planche.jpg` : la planche-contact (une image par seconde).

Les vidéos ne vont pas dans Git (`.gitignore`) : elles restent sur le disque.

## Refaire la vidéo

```sh
sh making-of/outils/preparer.sh                    # à refaire si le jeu, l'intro ou la musique changent
sh making-of/outils/hotel.sh                       # seulement le Grand Hôtel des Flots (vendor/hotel.js)
sh making-of/outils/bande-son.sh                   # seulement la musique
node making-of/outils/capture.mjs --planche --pas 1 # la planche-contact
node making-of/outils/capture.mjs --rapide          # le brouillon
node making-of/outils/capture.mjs                   # la vidéo finale
```

`capture.mjs` a besoin du serveur du making-of, l'entrée « making-of » de `.claude/launch.json` (http://localhost:8794). Le même serveur sert l'aperçu en direct : `index.html`, avec la musique, un curseur, `?t=12` pour commencer à 12 s et `?qualite=haute`.

## Ce qui est réutilisé (en lecture seule)

`preparer.sh` copie ou empaquette tout dans `making-of/`, sans rien modifier ailleurs :

| Quoi | D'où | Où |
|---|---|---|
| Le rendu du jeu (personnage, poules, lapins, Éteints et variantes, arbres) et three.js | `code/client/src/rendu/`, `code/commun/` | `vendor/rendu-jeu.js` |
| Le Grand Hôtel des Flots (un seul lot, avec ses alentours ; l'étage est caché) | `batiment/grand-hotel/` | `vendor/hotel.js`, à part (`outils/hotel.sh`) : il prend le three.js de `rendu-jeu.js` par une carte d'import (`vendor/three.js`) |
| Le moteur d'image, les décors, les acteurs, le logo | `intro/src3d/`, `intro/src/dessins.js` | `intro-copie/` |
| Les corps, les coiffures et les animations des personnages | `code/client/public/assets/personnages/` | `assets/personnages/` |
| Le Survival Kit de Kenney (CC0) : cailloux, herbes, bois | `intro/assets/kenney/` | `assets/kenney/` |
| La bande-son : les mesures 34 à 44 du thème principal, dont les pistes entrent une à une | `musique/production/masters/titre/` | `assets/musique/bande.wav` |

## Les fichiers

| Fichier | Rôle |
|---|---|
| `src/temps.js` | La ligne de temps, calée sur les mesures (84 BPM) : les vitesses, la distance, les poids des gestes de marche |
| `src/eres.js` | Les époques : les vagues et les plans de coupe qui ne montrent chaque objet que dans sa tranche de monde |
| `src/personnages.js` | Les huit versions du personnage, du prototype en capsule au Voltaïque aux cheveux bleus |
| `src/creatures.js` | Les poules, les lapins et les Éteints, en blocs, en facettes, puis ceux du jeu |
| `src/decor.js` | Les sols, les arbres, la plage et l'hôtel ; le ciel, la lumière et l'étalonnage de chaque époque |
| `src/film.js` | L'assemblage : le personnage, la caméra, le recul final, le logo |

Les premières versions (le prototype en capsule, le bonhomme en blocs, les poules et les lapins en blocs, les silhouettes d'Éteints) sont **refaites**, puisque l'historique Git commence à la 0.1.1. Les versions suivantes sont celles du jeu.
