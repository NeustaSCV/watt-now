#!/usr/bin/env python3
"""Les outils de la livraison des effets sonores (dossier son/).

  python3 son/outils/sons.py analyser FICHIER... [--ecart 0.08] [--seuil 30]
      Repère les événements (parties sonores séparées par des silences) de chaque fichier source et les liste :
      début, fin, durée, crête, timbre (centroïde spectral). Sert à choisir quoi découper.

  python3 son/outils/sons.py image FICHIER [--debut s] [--fin s] [--sortie png]
      Dessine la forme d'onde et le spectrogramme (pour « voir » un son qu'on ne peut pas écouter).

  python3 son/outils/sons.py rendre son/decoupe.tsv [--seul identifiant]
      Fabrique les fichiers finaux décrits dans decoupe.tsv : découpe, fondus, boucles, montages, niveau,
      puis encode en Opus (.opus) et AAC (.m4a), plus un master FLAC.

Tout est mono, 48 kHz. Le niveau suit exactement `niveler()` de code/client/src/son/dsp.ts (valeur efficace 0,14
mesurée sur la partie audible, crête 0,95 arrondie au-delà de 70 %) : les gains du catalogue restent justes.
"""

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from pathlib import Path

import numpy as np

FE = 48000
RACINE = Path(__file__).resolve().parent.parent  # son/
SOURCES = RACINE / "sources"


# ---------------------------------------------------------------------------------------------
# Lecture et écriture
# ---------------------------------------------------------------------------------------------

def lire(chemin: Path | str) -> np.ndarray:
    """Décode n'importe quel fichier audio en mono 48 kHz (float32), par ffmpeg.

    La moyenne des canaux est faite ici : le « -ac 1 » de ffmpeg monte le niveau (crêtes au-delà de 1).
    """
    canaux = int(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=channels", "-of", "csv=p=0", str(chemin)],
        check=True, capture_output=True, text=True,
    ).stdout.strip() or 1)
    sortie = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(chemin), "-ar", str(FE), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    s = np.frombuffer(sortie, dtype=np.float32)
    return s[: len(s) // canaux * canaux].reshape(-1, canaux).mean(axis=1).astype(np.float32)


def ecrire(s: np.ndarray, base: Path) -> None:
    """Écrit base.flac (master 24 bits), base.opus (Opus 64 kbit/s) et base.m4a (AAC 96 kbit/s)."""
    base.parent.mkdir(parents=True, exist_ok=True)
    brut = s.astype(np.float32).tobytes()
    entree = ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(FE), "-ac", "1", "-i", "-"]
    for ext, options in (
        (".flac", ["-c:a", "flac", "-sample_fmt", "s32", "-bits_per_raw_sample", "24"]),
        (".opus", ["-c:a", "libopus", "-b:a", "64k", "-vbr", "on", "-application", "audio"]),
        (".m4a", ["-c:a", "aac", "-b:a", "96k"]),
    ):
        subprocess.run(entree + options + [str(base) + ext], input=brut, check=True)


# ---------------------------------------------------------------------------------------------
# Analyse
# ---------------------------------------------------------------------------------------------

TRAME = 0.005  # s


def enveloppe_db(s: np.ndarray) -> np.ndarray:
    n = int(TRAME * FE)
    k = len(s) // n
    if k == 0:
        return np.array([-120.0])
    t = s[: k * n].reshape(k, n)
    return 20 * np.log10(np.sqrt((t * t).mean(axis=1)) + 1e-9)


def centroide(s: np.ndarray) -> float:
    if len(s) < 64:
        return 0.0
    spec = np.abs(np.fft.rfft(s * np.hanning(len(s))))
    f = np.fft.rfftfreq(len(s), 1 / FE)
    return float((spec * f).sum() / (spec.sum() + 1e-12))


def evenements(s: np.ndarray, ecart: float = 0.08, seuil: float = 30.0, minimum: float = 0.02):
    """Les événements d'un enregistrement : (début, fin) en secondes.

    Une trame est « sonore » si elle dépasse à la fois le bruit de fond + 10 dB et la crête − `seuil` dB.
    Deux parties séparées de moins de `ecart` s forment un seul événement (le talon et la plante d'un pas,
    les deux temps d'un battement de cœur…). Les bords sont élargis jusqu'au retour au bruit de fond.
    """
    e = enveloppe_db(s)
    crete = float(e.max())
    # Un fichier court n'a parfois presque pas de silence : le fond est alors pris 40 dB sous la crête.
    fond = min(float(np.percentile(e, 10)), crete - 40)
    seuil_db = max(fond + 10, crete - seuil)
    actif = e > seuil_db
    morceaux = []
    i = 0
    while i < len(actif):
        if not actif[i]:
            i += 1
            continue
        j = i
        while j < len(actif) and actif[j]:
            j += 1
        morceaux.append([i, j])
        i = j
    fusion: list[list[int]] = []
    g = int(ecart / TRAME)
    for m in morceaux:
        if fusion and m[0] - fusion[-1][1] <= g:
            fusion[-1][1] = m[1]
        else:
            fusion.append(m)
    sortie = []
    bas = fond + 4
    for a, b in fusion:
        if (b - a) * TRAME < minimum:
            continue
        a0 = a
        while a0 > 0 and e[a0 - 1] > bas and a - a0 < int(0.03 / TRAME):
            a0 -= 1
        b0 = b
        while b0 < len(e) and e[b0] > bas and b0 - b < int(0.6 / TRAME):
            b0 += 1
        sortie.append((a0 * TRAME, b0 * TRAME))
    # Les bords élargis peuvent se chevaucher : on recoupe au milieu.
    for k in range(1, len(sortie)):
        if sortie[k][0] < sortie[k - 1][1]:
            m = (sortie[k][0] + sortie[k - 1][1]) / 2
            sortie[k - 1] = (sortie[k - 1][0], m)
            sortie[k] = (m, sortie[k][1])
    return sortie, fond, crete


def analyser(chemins, ecart: float, seuil: float) -> None:
    for c in chemins:
        s = lire(c)
        evs, fond, crete = evenements(s, ecart, seuil)
        print(f"== {Path(c).name}  {len(s) / FE:.2f} s  fond {fond:.0f} dB eff.  {len(evs)} événement(s)")
        for k, (a, b) in enumerate(evs):
            m = s[int(a * FE): int(b * FE)]
            pk = 20 * np.log10(np.abs(m).max() + 1e-9)
            print(f"   {k:2d}  {a:7.3f} → {b:7.3f}  ({b - a:5.3f} s)  crête {pk:5.1f} dB  timbre {centroide(m):5.0f} Hz")


def image(chemin, debut: float | None, fin: float | None, sortie: str | None) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    s = lire(chemin)
    a = int((debut or 0) * FE)
    b = int(fin * FE) if fin else len(s)
    s = s[a:b]
    t = np.arange(len(s)) / FE + (debut or 0)
    fig, (h, bas) = plt.subplots(2, 1, figsize=(10, 4.5), sharex=True)
    h.plot(t, s, lw=0.4)
    h.set_title(Path(chemin).name)
    bas.specgram(s, NFFT=1024, Fs=FE, noverlap=768, xextent=(t[0], t[-1]), cmap="magma", vmin=-130)
    bas.set_ylim(0, 12000)
    bas.set_ylabel("Hz")
    fig.tight_layout()
    sortie = sortie or str(Path(chemin).with_suffix(".png"))
    fig.savefig(sortie, dpi=80)
    print(sortie)


# ---------------------------------------------------------------------------------------------
# Fabrication
# ---------------------------------------------------------------------------------------------

def niveler(s: np.ndarray, efficace: float = 0.14, plafond: float = 0.95) -> np.ndarray:
    """La copie exacte de niveler() de dsp.ts."""
    m = float(np.abs(s).max())
    if m < 1e-9:
        return s
    audible = s[np.abs(s) >= m * 0.03]
    rms = float(np.sqrt((audible * audible).mean())) if len(audible) else m
    s = s * (efficace / max(rms, 1e-9))
    genou = plafond * 0.7
    a = np.abs(s)
    dessus = a > genou
    s[dessus] = np.sign(s[dessus]) * (genou + (plafond - genou) * np.tanh((a[dessus] - genou) / (plafond - genou)))
    return s


def fondus(s: np.ndarray, entree: float = 0.003, sortie: float = 0.03) -> np.ndarray:
    ne = min(len(s), int(entree * FE))
    ns = min(len(s), int(sortie * FE))
    if ne:
        s[:ne] *= np.linspace(0, 1, ne)
    if ns:
        s[-ns:] *= np.cos(np.linspace(0, np.pi / 2, ns)) ** 2
    return s


def boucler(s: np.ndarray, recouvrement: float) -> np.ndarray:
    """Comme Piste.boucler() : la queue est fondue dans le début, à puissance constante."""
    n = min(int(recouvrement * FE), len(s) // 2)
    sortie = s[: len(s) - n].copy()
    x = np.linspace(0, 1, n, endpoint=False)
    sortie[:n] = s[:n] * np.sin(x * np.pi / 2) + s[len(s) - n:] * np.cos(x * np.pi / 2)
    return sortie


def filtrer(s: np.ndarray, passe_haut: float | None, passe_bas: float | None) -> np.ndarray:
    from scipy.signal import butter, sosfiltfilt

    if passe_haut:
        s = sosfiltfilt(butter(4, passe_haut, "highpass", fs=FE, output="sos"), s)
    if passe_bas:
        s = sosfiltfilt(butter(4, passe_bas, "lowpass", fs=FE, output="sos"), s)
    return s.astype(np.float32)


def source(nom: str) -> Path:
    """`fs:12345` → sources/freesound/12345.ogg ; sinon chemin relatif à sources/packs/."""
    if nom.startswith("fs:"):
        return SOURCES / "freesound" / f"{nom[3:]}.ogg"
    return SOURCES / "packs" / nom


_cache: dict[str, np.ndarray] = {}


def extrait(nom: str, debut: float, fin: float) -> np.ndarray:
    if nom not in _cache:
        _cache[nom] = lire(source(nom))
    s = _cache[nom]
    a = max(0, int(debut * FE))
    b = len(s) if fin <= 0 else min(len(s), int(fin * FE))
    return s[a:b].copy()


def couche(spec: str) -> tuple[np.ndarray, float]:
    """Une couche d'un montage : `source@debut-fin` avec options `+décalage` et `*gain`.

    Exemple : `fs:346692@0.05-1.0*1` puis `fs:22417@0-0.7+0.8*0.6`.
    """
    gain = 1.0
    decalage = 0.0
    if "*" in spec:
        spec, g = spec.rsplit("*", 1)
        gain = float(g)
    if "+" in spec.split("@")[-1]:
        spec, d = spec.rsplit("+", 1)
        decalage = float(d)
    nom, plage = spec.split("@")
    a, b = plage.split("-")
    return extrait(nom, float(a), float(b)) * gain, decalage


def fabriquer(ligne: dict) -> np.ndarray:
    couches = [couche(c.strip()) for c in ligne["source"].split("&")]
    longueur = max(int(d * FE) + len(c) for c, d in couches)
    s = np.zeros(longueur, dtype=np.float32)
    for c, d in couches:
        i = int(d * FE)
        s[i: i + len(c)] += c
    ph = float(ligne["passe_haut"]) if ligne.get("passe_haut") else None
    pb = float(ligne["passe_bas"]) if ligne.get("passe_bas") else None
    if ph or pb:
        s = filtrer(s, ph, pb)
    boucle = ligne.get("boucle", "").strip()
    if boucle:
        s = boucler(s, float(boucle))
    else:
        s = fondus(s, 0.003, float(ligne.get("fondu") or 0.03))
    return niveler(s)


def rendre(tableau: Path, seul: str | None) -> None:
    sortie = RACINE / "effets"
    with open(tableau, newline="") as f:
        lignes = [l for l in csv.DictReader((x for x in f if not x.startswith("#")), delimiter="\t")]
    for l in lignes:
        ident = l["identifiant"].strip()
        if seul and ident != seul:
            continue
        s = fabriquer(l)
        base = sortie / ident / f"{ident}_{int(l['variante'])}"
        ecrire(s, base)
        print(f"{base.relative_to(RACINE)}  {len(s) / FE:.2f} s")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="commande", required=True)
    a = sp.add_parser("analyser")
    a.add_argument("fichiers", nargs="+")
    a.add_argument("--ecart", type=float, default=0.08)
    a.add_argument("--seuil", type=float, default=30.0)
    i = sp.add_parser("image")
    i.add_argument("fichier")
    i.add_argument("--debut", type=float)
    i.add_argument("--fin", type=float)
    i.add_argument("--sortie")
    r = sp.add_parser("rendre")
    r.add_argument("tableau", type=Path)
    r.add_argument("--seul")
    o = p.parse_args()
    if o.commande == "analyser":
        analyser(o.fichiers, o.ecart, o.seuil)
    elif o.commande == "image":
        image(o.fichier, o.debut, o.fin, o.sortie)
    else:
        rendre(o.tableau, o.seul)


if __name__ == "__main__":
    sys.exit(main())
