#!/usr/bin/env python3
"""Indexe les échantillons de musique/banques/ dans musique/banques/index.json.

Le navigateur ne sait pas lister un dossier : l'échantillonneur lit cet index.
Pour chaque instrument : la liste des fichiers avec leur note MIDI (do 4 = 60), leur nuance et leur variante (round robin).
Usage : python3 musique/outils/indexer-banques.py
"""
import json, os, re

ICI = os.path.dirname(os.path.abspath(__file__))
BANQUES = os.path.normpath(os.path.join(ICI, '..', 'banques'))
V = 'vsco2-ce/'

# instrument : (dossier, motif du nom, nuances de la plus douce à la plus forte)
INSTRUMENTS = {
    'violonSolo':   (V + 'Strings/Solo Violin/Arco Vib', r'_([A-G][#b]?-?\d)_(p|f)\.wav$', ['p', 'f']),
    'violonPizz':   (V + 'Strings/Solo Violin/Pizz', r'_([A-G][#b]?-?\d)_?(\w*)\.wav$', None),
    'violons':      (V + 'Strings/Violin Section/susVib', r'_([A-G][#b]?-?\d)_?(\w*)\.wav$', None),
    'violoncelles': (V + 'Strings/Cello Section/susvib', r'_([A-G][#b]?-?\d)_?(\w*)\.wav$', None),
    'celloPizz':    (V + 'Strings/Cello Section/pizzT', r'_([A-G][#b]?-?\d)_(v\d)_RR(\d)\.wav$', None),
    'harpe':        (V + 'Strings/Harp', r'_([A-G][#b]?-?\d)_(\w+)\.wav$', None),
    'flute':        (V + 'Woodwinds/Flute/susvib', r'_([A-G][#b]?-?\d)_?(\w*)\.wav$', None),
    'fluteNV':      (V + 'Woodwinds/Flute/susNV', r'_([A-G][#b]?-?\d)_?(\w*)\.wav$', None),
    'trombone':     (V + 'Brass/Tenor Trombone/sus', r'_([A-G][#b]?-?\d)_?(\w*)\.wav$', None),
    'glock':        (V + 'Percussion/Glock', r'_([A-G][#b]?-?\d)\.wav$', None),
    'marimba':      (V + 'Percussion/Marimba', r'_([A-G][#b]?-?\d)_(\w+)\.wav$', None),
}
# percussions sans hauteur : tous les .wav d'un dossier
PERCUSSIONS = {
    'triangle':  V + 'VSCO 1 Percussion/varMetal/triangle',
    'gong':      V + 'VSCO 1 Percussion/varMetal/Gong',
    'metalDivers': V + 'VSCO 1 Percussion/varMetal/various',
    'cymbale':   V + 'VSCO 1 Percussion/varMetal/Cymbals/susp',
    'logDrum':   V + 'VSCO 1 Percussion/varWood/log_drum',
    'boisDivers': V + 'VSCO 1 Percussion/varWood',
}
NOTES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
# Hauteur réelle mesurée (YIN et FFT, 2026-10-07) : la plupart des instruments de VSCO nomment le do central « C3 »
# (ils sonnent une octave au-dessus de leur nom) ; le violon solo et la harpe le nomment « C4 » (justes).
TRANSPOSITION = {'violons': 12, 'violoncelles': 12, 'celloPizz': 12, 'flute': 12, 'fluteNV': 12, 'trombone': 12, 'marimba': 12, 'glock': 12}


def nuance_et_variante(brut):
    """« f_RR2 » → (f, 2) ; « v1_2 » → (v1, 2) ; « v2 » → (v2, 1) ; « loud_01 » → (loud, 1)"""
    m = re.match(r'^([A-Za-z]*\d?)(?:_(?:rr|RR)?(\d+))?$', brut or '')
    if not m:
        return brut, 1
    return m.group(1), int(m.group(2)) if m.group(2) else 1


def midi(nom):
    m = re.match(r'([A-G])([#b]?)(-?\d)$', nom)
    pc = NOTES[m.group(1)] + (1 if m.group(2) == '#' else -1 if m.group(2) == 'b' else 0)
    return (int(m.group(3)) + 1) * 12 + pc


def main():
    index = {}
    for nom, (dossier, motif, nuances) in INSTRUMENTS.items():
        chemin = os.path.join(BANQUES, dossier)
        if not os.path.isdir(chemin):
            continue
        liste = []
        for f in sorted(os.listdir(chemin)):
            m = re.search(motif, f)
            if not m:
                continue
            brut = m.group(2) if m.lastindex >= 2 else ''
            if m.lastindex >= 3:                       # motif avec la variante à part (pizz de violoncelle)
                brut = brut + '_' + m.group(3)
            v, rr = nuance_et_variante(brut)
            liste.append({'f': dossier + '/' + f, 'm': midi(m.group(1)) + TRANSPOSITION.get(nom, 0), 'v': v, 'rr': rr})
        index[nom] = liste
    for nom, dossier in PERCUSSIONS.items():
        chemin = os.path.join(BANQUES, dossier)
        if not os.path.isdir(chemin):
            continue
        fichiers = sorted(os.path.relpath(os.path.join(r, x), chemin) for r, _, fs in os.walk(chemin) for x in fs if x.lower().endswith('.wav'))
        if nom == 'boisDivers':                        # les fichiers à la racine seulement (le reste a son propre nom)
            fichiers = [x for x in fichiers if '/' not in x]
        index[nom] = [{'f': dossier + '/' + f, 'm': 0, 'v': '', 'rr': i + 1} for i, f in enumerate(fichiers)]
    with open(os.path.join(BANQUES, 'index.json'), 'w') as fh:
        json.dump(index, fh, ensure_ascii=False, indent=0)
    for k, v in index.items():
        notes = sorted({x['m'] for x in v})
        print(f'{k:13s} {len(v):4d} fichiers  notes {notes[0] if notes else "-"}..{notes[-1] if notes else "-"}  nuances {sorted({x["v"] for x in v})}')


if __name__ == '__main__':
    main()
