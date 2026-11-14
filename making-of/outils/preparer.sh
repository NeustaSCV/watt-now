#!/bin/sh
# Watt Now? — making-of : prépare tout ce que la page de tournage lit, en copiant (jamais en modifiant) :
#   - le rendu du jeu et three.js, empaquetés dans vendor/rendu-jeu.js ;
#   - les briques de la cinématique d'intro (moteur d'image, décors, acteurs, objets Kenney) dans intro-copie/ ;
#   - les personnages du jeu et quelques objets Kenney dans assets/ ;
#   - la bande-son (outils/bande-son.sh).
# À relancer quand le jeu, l'intro ou la musique changent. Rien n'est écrit hors de making-of/.
set -e
ICI="$(cd "$(dirname "$0")/.." && pwd)"
RACINE="$ICI/.."
"$RACINE/code/node_modules/.bin/rolldown" -c "$ICI/outils/rolldown.config.mjs"
mkdir -p "$ICI/intro-copie" "$ICI/assets/personnages" "$ICI/assets/kenney"
for f in moteur decors acteurs kenney; do cp "$RACINE/intro/src3d/$f.js" "$ICI/intro-copie/$f.js"; done
cp "$RACINE/intro/src/dessins.js" "$ICI/intro-copie/dessins.js"   # le logo
cp "$RACINE/code/client/public/assets/personnages/"*.glb "$ICI/assets/personnages/"
cp "$RACINE/intro/assets/kenney/"*.glb "$ICI/assets/kenney/"
[ -d "$RACINE/intro/assets/kenney/Textures" ] && cp -R "$RACINE/intro/assets/kenney/Textures" "$ICI/assets/kenney/"
cp "$RACINE/intro/assets/kenney/LICENCE-Kenney.txt" "$ICI/assets/kenney/"
sh "$ICI/outils/bande-son.sh"
ls -la "$ICI/vendor/rendu-jeu.js"
