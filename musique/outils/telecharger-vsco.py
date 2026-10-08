#!/usr/bin/env python3
"""Télécharge une sélection de VSCO 2 Community Edition (CC0) dans musique/banques/vsco2-ce/.

Source : https://github.com/sgossner/VSCO-2-CE (licence CC0 1.0, domaine public).
Sélection validée par le porteur du projet le 2026-10-07 (≈ 1,2 Go).
Rejouable : les fichiers déjà présents avec la bonne taille sont sautés.
Usage : python3 musique/outils/telecharger-vsco.py
"""
import json, os, subprocess, sys, urllib.parse

DEPOT = 'sgossner/VSCO-2-CE'
BRANCHE = 'master'
SELECTION = [
    'Strings/Solo Violin', 'Strings/Violin Section', 'Strings/Cello Section', 'Strings/Harp',
    'Woodwinds/Flute', 'Keys/Organ', 'Brass/Tenor Trombone',
    'Percussion/Marimba', 'Percussion/Glock',
    'VSCO 1 Percussion/varMetal', 'VSCO 1 Percussion/varWood',
]
FICHIERS = ['LICENSE', 'README.md', 'Readme.txt']
ICI = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.normpath(os.path.join(ICI, '..', 'banques', 'vsco2-ce'))


def main():
    # curl plutôt qu'urllib : le Python de python.org n'a pas toujours ses certificats, et on ne modifie pas le système
    arbre = json.loads(subprocess.run(['curl', '-sfL', f'https://api.github.com/repos/{DEPOT}/git/trees/{BRANCHE}?recursive=1'], check=True, capture_output=True).stdout)
    blobs = [x for x in arbre['tree'] if x['type'] == 'blob' and (x['path'] in FICHIERS or any(x['path'].startswith(s + '/') for s in SELECTION))]
    total = sum(x.get('size', 0) for x in blobs)
    print(f'{len(blobs)} fichiers, {total / 1e6:.0f} Mo -> {DEST}', flush=True)
    fait = 0
    for i, x in enumerate(blobs):
        cible = os.path.join(DEST, x['path'])
        if not os.path.realpath(cible).startswith(DEST):
            sys.exit('chemin hors du dossier : ' + x['path'])
        fait += x.get('size', 0)
        if os.path.exists(cible) and os.path.getsize(cible) == x.get('size'):
            continue
        os.makedirs(os.path.dirname(cible), exist_ok=True)
        url = f'https://raw.githubusercontent.com/{DEPOT}/{BRANCHE}/' + urllib.parse.quote(x['path'])
        tmp = cible + '.part'
        subprocess.run(['curl', '-sfL', '--retry', '3', '-o', tmp, url], check=True)
        os.replace(tmp, cible)
        if i % 50 == 0:
            print(f'{i + 1}/{len(blobs)}  {fait / 1e6:.0f}/{total / 1e6:.0f} Mo  {x["path"]}', flush=True)
    print('Terminé.', flush=True)


if __name__ == '__main__':
    main()
