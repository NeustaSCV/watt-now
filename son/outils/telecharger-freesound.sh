#!/bin/bash
# Télécharge les aperçus HQ (OGG) des candidats Freesound listés dans son/candidats.tsv.
# Pour chaque son : vérifie sur sa page que la licence est bien « Creative Commons 0 », relève le titre et la durée,
# puis enregistre l'aperçu dans son/sources/freesound/<id>.ogg. Le relevé va dans son/sources/freesound/index.tsv.
# Un son déjà téléchargé n'est pas repris. Usage : bash son/outils/telecharger-freesound.sh

set -u
racine="$(cd "$(dirname "$0")/.." && pwd)"
dest="$racine/sources/freesound"
index="$dest/index.tsv"
mkdir -p "$dest"
[ -f "$index" ] || printf 'id\tauteur\ttitre\tduree_s\tlicence\tpage\n' > "$index"

tail -n +2 "$racine/candidats.tsv" | cut -f2,3 | sort -u -t$'\t' -k2,2 | while IFS=$'\t' read -r auteur id; do
  [ -s "$dest/$id.ogg" ] && continue
  page="https://freesound.org/people/$auteur/sounds/$id/"
  html="$(curl -sL --max-time 30 "$page")"
  # La licence se lit dans son lien officiel (le texte « Creative Commons » peut venir de la description de l'auteur).
  liens="$(printf '%s' "$html" | grep -oE 'creativecommons\.org/(publicdomain|licenses)/[a-z/.0-9-]+' | sort -u)"
  if [ "$liens" = "creativecommons.org/publicdomain/zero/1.0/" ]; then licence="Creative Commons 0"; else licence="$(echo $liens)"; fi
  duree="$(printf '%s' "$html" | grep -oE 'data-duration="[^"]+"' | head -1 | cut -d'"' -f2)"
  titre="$(printf '%s' "$html" | grep -oE '<title>[^<]*' | head -1 | sed 's/<title>//; s/ - Freesound$//' | sed 's/&quot;/"/g; s/&amp;/\&/g; s/&#x27;/'"'"'/g')"
  mp3="$(printf '%s' "$html" | grep -oE 'https://cdn\.freesound\.org/previews/[^"]+-hq\.mp3' | head -1)"
  if [ "$licence" != "Creative Commons 0" ]; then
    echo "REFUSÉ $id ($auteur) : licence « $licence »" >&2
    continue
  fi
  if [ -z "$mp3" ]; then
    echo "ÉCHEC $id ($auteur) : aperçu introuvable" >&2
    continue
  fi
  if curl -sfL --max-time 120 -o "$dest/$id.ogg" "${mp3%-hq.mp3}-hq.ogg"; then
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$id" "$auteur" "$titre" "$duree" "$licence" "$page" >> "$index"
    echo "ok $id $auteur ($duree s)"
  else
    rm -f "$dest/$id.ogg"
    echo "ÉCHEC $id ($auteur) : téléchargement" >&2
  fi
  sleep 0.5
done
