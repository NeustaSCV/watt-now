#!/bin/sh
# Empaquette le Grand Hôtel des Flots (vendor/hotel.js) et l'aiguillage de three.js (vendor/three.js). À relancer
# quand le modèle de l'hôtel change ; le reste du rendu (vendor/rendu-jeu.js) n'est pas touché.
set -e
ICI="$(cd "$(dirname "$0")/.." && pwd)"
CODE="$ICI/../code"
"$CODE/node_modules/.bin/rolldown" -c "$ICI/outils/hotel.config.mjs"
# vendor/three.js : les exports de three.js, pris dans l'instance déjà empaquetée avec le rendu du jeu
cd "$CODE" && node --input-type=module -e "
const t = await import('three');
const noms = Object.keys(t).filter((n) => n !== 'default');
process.stdout.write('// Généré par outils/hotel.sh : three.js, tel qu\'empaqueté dans rendu-jeu.js.\nimport { THREE } from \'./rendu-jeu.js\';\nexport const { ' + noms.join(', ') + ' } = THREE;\n');
" > "$ICI/vendor/three.js"
ls -la "$ICI/vendor/hotel.js" "$ICI/vendor/three.js"
