#!/bin/sh
# Watt Now? — making-of : la bande-son, tirée des pistes séparées du thème principal (musique/production/masters/titre,
# lues sans être modifiées). 84 BPM, une mesure = 20/7 s. On prend les mesures 34 à 44 : la fin des Mécanistes, les
# trois familles ensemble (36-43), puis la queue (44), sous le zoom arrière et le logo.
# La musique se construit comme le jeu : la nappe seule, puis la basse, le rythme, et enfin la mélodie, chacune
# entrant sur un premier temps (src/temps.js garde les mêmes instants).
set -e
ICI="$(cd "$(dirname "$0")/.." && pwd)"
M="$ICI/../musique/production/masters/titre"
SORTIE="$ICI/assets/musique"
mkdir -p "$SORTIE"
MESURE=2.857142857
DEBUT=$(python3 -c "print(34*4*60/84)")
DUREE=$(python3 -c "print(11*4*60/84)")
# entrée d'une piste à la mesure n (0 = début du film), sur 40 ms
entre() { python3 -c "m=$1*4*60/84; print(f\"volume='clip((t-{m:.4f}+0.04)/0.04,0,1)':eval=frame\")"; }
ffmpeg -v error -y \
  -ss "$DEBUT" -t "$DUREE" -i "$M/titre_intro_harmonie.flac" \
  -ss "$DEBUT" -t "$DUREE" -i "$M/titre_intro_basse.flac" \
  -ss "$DEBUT" -t "$DUREE" -i "$M/titre_intro_rythmique.flac" \
  -ss "$DEBUT" -t "$DUREE" -i "$M/titre_intro_melodie.flac" \
  -filter_complex "[0:a]afade=t=in:d=0.6[h];[1:a]$(entre 1)[b];[2:a]$(entre 2)[r];[3:a]$(entre 3)[m];[h][b][r][m]amix=inputs=4:normalize=0,afade=t=out:st=$(python3 -c "print(11*4*60/84-2.6)"):d=2.6,alimiter=limit=0.95[o]" \
  -map "[o]" -ar 48000 -c:a pcm_s16le "$SORTIE/bande.wav"
ffmpeg -v error -y -i "$SORTIE/bande.wav" -c:a aac -b:a 192k "$SORTIE/bande.m4a"
echo "Bande-son : $SORTIE/bande.wav ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SORTIE/bande.wav") s)"
