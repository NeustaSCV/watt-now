#!/bin/sh
# Empaquette le rendu du jeu (lecture seule) et three.js dans intro/vendor/rendu-jeu.js.
# À relancer quand le rendu du jeu change. Rien n'est écrit hors de intro/.
set -e
ICI="$(cd "$(dirname "$0")/.." && pwd)"
CODE="$ICI/../code"
"$CODE/node_modules/.bin/rolldown" -c "$ICI/outils/rolldown.config.mjs"
# Les modèles des personnages (corps, coiffures, animations) : copiés tels quels.
mkdir -p "$ICI/assets/personnages"
cp "$CODE/client/public/assets/personnages/"*.glb "$ICI/assets/personnages/"
# … puis les corps et les cheveux en haute définition (maillages complets, textures 2048², relief)
if [ -f "$ICI/../download/Universal Base Characters[Standard].zip" ]; then node "$ICI/outils/preparer-personnages-hd.mjs"; node "$ICI/outils/preparer-animations.mjs"; fi
ls -la "$ICI/vendor/rendu-jeu.js"
