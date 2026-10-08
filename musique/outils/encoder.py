#!/usr/bin/env python3
"""Encode et masterise les stems produits par musique/production/index.html (Book 21 §6.4.2 et §6.5.4).

1. production/wav/**.wav  →  production/masters/**.flac   (rendu brut, sans perte, 24 bits : archive pour la phase 1) ; les WAV sont effacés.
2. Mastering par pièce : chaque bloc est mesuré avec tous ses stems (LUFS intégré, crête vraie). La pièce reçoit UN gain,
   le même pour tous ses stems (l'équilibre entre stems est gardé), pour atteindre sa cible, sans dépasser −1,5 dBTP.
3. production/jeu/**.opus (ordinateur : Opus 64 kbit/s stéréo ; stems de basse en mono 32 kbit/s) et **.m4a (AAC, secours), avec ce gain.
4. production/mobile/ : la version allégée (Book 21 §6.4.4). Chaque pièce prémixée en un seul stem « mix » (Opus 48 kbit/s) ;
   la Vie de jour existe en deux prémix, sans et avec l'atelier. Manifeste : production/manifeste-mobile.json.
5. production/rapport-niveaux.md (avant et après) ; le gain de chaque pièce est noté dans les manifestes.

Rappel : le débit ne change que le poids à télécharger ; en mémoire, un stem décodé pèse toujours ≈ 384 Ko par seconde
en stéréo à 48 kHz (la moitié en mono). La mémoire se règle dans le moteur (décodage juste à temps, version mobile).

Cibles : Vie de jour (avec l'atelier), Tension, Danger : −18 LUFS ; Vie de nuit : −20 ; Fond seul : −26 (il joue sous la Vie) ;
signaux : −19. Usage : python3 musique/outils/encoder.py
"""
import json, math, os, re, subprocess, sys

ICI = os.path.dirname(os.path.abspath(__file__))
PROD = os.path.normpath(os.path.join(ICI, '..', 'production'))
WAV, MASTERS, JEU, MOBILE = (os.path.join(PROD, d) for d in ('wav', 'masters', 'jeu', 'mobile'))
CRETE_MAX = -1.5


def cible(nom):
    if nom.startswith('fond'): return -26
    if nom.startswith('vie-nuit'): return -20
    return -18


def ff(*args):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit('ffmpeg a échoué : ' + ' '.join(args) + '\n' + r.stderr[-800:])
    return r.stderr


def masters():
    n = 0
    for racine, _, fichiers in os.walk(WAV):
        for f in sorted(fichiers):
            if not f.endswith('.wav'):
                continue
            src = os.path.join(racine, f)
            rel = os.path.relpath(src, WAV)[:-4]
            os.makedirs(os.path.dirname(os.path.join(MASTERS, rel)), exist_ok=True)
            ff('-i', src, '-c:a', 'flac', '-sample_fmt', 's32', '-bits_per_raw_sample', '24', os.path.join(MASTERS, rel + '.flac'))
            os.remove(src)
            n += 1
    for racine, dossiers, fichiers in os.walk(WAV, topdown=False):      # dossiers vides
        if not os.listdir(racine):
            os.rmdir(racine)
    return n


def mesurer(fichiers, gain_db=0.0):
    entrees = sum((['-i', f] for f in fichiers), [])
    filtre = (f'amix=inputs={len(fichiers)}:normalize=0,' if len(fichiers) > 1 else '') + f'volume={gain_db}dB,ebur128=peak=true'
    sortie = ff(*entrees, '-filter_complex', filtre, '-f', 'null', '-')
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', sortie)
    p = re.findall(r'Peak:\s+(-?[\d.]+|-inf) dBFS', sortie)
    return (float(i[-1]) if i else None, float(p[-1]) if p and p[-1] != '-inf' else None)


def energie_moyenne(valeurs):
    v = [x for x in valeurs if x is not None]
    return 10 * math.log10(sum(10 ** (x / 10) for x in v) / len(v)) if v else None


def encoder(rel, gain_db):
    src = os.path.join(MASTERS, rel + '.flac')
    os.makedirs(os.path.dirname(os.path.join(JEU, rel)), exist_ok=True)
    vol = ['-af', f'volume={gain_db:.2f}dB']
    mono = rel.endswith('_basse')                      # sous 150 Hz, la stéréo ne sert à rien : mono, moitié moins de mémoire
    canaux = ['-ac', '1'] if mono else []
    ff('-i', src, *vol, *canaux, '-c:a', 'libopus', '-b:a', '32k' if mono else '64k', '-vbr', 'on', os.path.join(JEU, rel + '.opus'))
    ff('-i', src, *vol, *canaux, '-c:a', 'aac', '-b:a', '64k' if mono else '96k', os.path.join(JEU, rel + '.m4a'))


def prémixer(fichiers, gain_db, rel):
    """Version mobile : somme des stems d'un bloc, avec le gain de la pièce, en un seul fichier."""
    entrees = sum((['-i', os.path.join(MASTERS, f + '.flac')] for f in fichiers), [])
    filtre = (f'amix=inputs={len(fichiers)}:normalize=0,' if len(fichiers) > 1 else '') + f'volume={gain_db:.2f}dB'
    os.makedirs(os.path.dirname(os.path.join(MOBILE, rel)), exist_ok=True)
    ff(*entrees, '-filter_complex', filtre, '-c:a', 'libopus', '-b:a', '48k', '-vbr', 'on', os.path.join(MOBILE, rel + '.opus'))
    ff(*entrees, '-filter_complex', filtre, '-c:a', 'aac', '-b:a', '80k', os.path.join(MOBILE, rel + '.m4a'))


def main():
    print(masters(), 'masters FLAC écrits')
    chemin_man = os.path.join(PROD, 'manifeste.json')
    with open(chemin_man) as fh:
        man = json.load(fh)
    lignes = ['# Niveaux des pièces produites', '',
              'Chaque bloc est mesuré avec tous ses stems actifs (Vie de jour : avec l\'atelier). Un gain par pièce, identique pour tous ses stems.',
              'Cibles : Vie de jour, Tension, Danger −18 LUFS ; Vie de nuit −20 ; Fond seul −26 (il joue sous la Vie) ; signaux −19. Crête vraie ≤ −1,5 dBTP.', '',
              '| Pièce | Blocs | Avant (LUFS / crête) | Gain | Après (LUFS / crête) | Avis |', '|---|---|---|---|---|---|']
    for nom, p in man['pieces'].items():
        mesures = [mesurer([os.path.join(MASTERS, f + '.flac') for f in stems.values()]) for stems in p['blocs']]
        lufs = energie_moyenne([m[0] for m in mesures]); pic = max(m[1] for m in mesures if m[1] is not None)
        gain = min(cible(nom) - lufs, CRETE_MAX - pic)
        for stems in p['blocs']:
            for f in stems.values():
                encoder(f, gain)
        p['gainDb'] = round(gain, 2)
        apres_l, apres_p = lufs + gain, pic + gain
        avis = 'ok' if abs(apres_l - cible(nom)) <= 1 else 'limité par la crête'
        lignes.append(f'| {nom} | {len(p["blocs"])} | {lufs:.1f} / {pic:.1f} | {gain:+.1f} dB | {apres_l:.1f} / {apres_p:.1f} | {avis} |')
        print(lignes[-1], flush=True)
    for nom, f in man['signaux'].items():
        lufs, pic = mesurer([os.path.join(MASTERS, f + '.flac')])
        gain = min(-19 - lufs, CRETE_MAX - pic)
        encoder(f, gain)
        man['signaux'][nom] = f
        man.setdefault('gainsSignaux', {})[nom] = round(gain, 2)
        lignes.append(f'| signal {nom} | — | {lufs:.1f} / {pic:.1f} | {gain:+.1f} dB | {lufs + gain:.1f} / {pic + gain:.1f} | {"ok" if abs(lufs + gain + 19) <= 1 else "limité par la crête"} |')
    with open(chemin_man, 'w') as fh:
        json.dump(man, fh, ensure_ascii=False, indent=1)
    # Version mobile : un stem « mix » par bloc ; la Vie de jour en deux prémix (sans et avec l'atelier)
    mob = {'genere': man['genere'], 'grille': man['grille'], 'mobile': True, 'pieces': {}, 'signaux': {}}
    for nom, p in man['pieces'].items():
        variantes = [(nom, [s for s in p['stems'] if s != 'outil'])]
        if 'outil' in p['stems']:
            variantes.append((nom.replace('vie-jour', 'vie-jour-atelier'), p['stems']))
        for nv, stems in variantes:
            mob['pieces'][nv] = {k: v for k, v in p.items() if k not in ('stems', 'blocs')}
            mob['pieces'][nv].update({'stems': ['mix'], 'stemsPrémixés': stems, 'blocs': []})
            for b, fichiers in enumerate(p['blocs']):
                rel = nv + '/' + nv + '_b' + str(b + 1) + '_mix'
                prémixer([fichiers[s] for s in stems], p['gainDb'], rel)
                mob['pieces'][nv]['blocs'].append({'mix': rel})
            print('mobile :', nv, flush=True)
    for nom, f in man['signaux'].items():
        prémixer([f], man['gainsSignaux'][nom], 'signaux/' + nom)
        mob['signaux'][nom] = 'signaux/' + nom
    with open(os.path.join(PROD, 'manifeste-mobile.json'), 'w') as fh:
        json.dump(mob, fh, ensure_ascii=False, indent=1)
    with open(os.path.join(PROD, 'rapport-niveaux.md'), 'w') as fh:
        fh.write('\n'.join(lignes) + '\n')
    print('\n'.join(lignes[-len(man['signaux']):]))


if __name__ == '__main__':
    main()
