#!/usr/bin/env python3
"""Fabrique son/ecoute.html (page d'écoute de toutes les variantes) et son/CREDITS.md (origine de chaque fichier).

  python3 son/outils/pages.py

Lit son/decoupe.tsv, son/sources/freesound/index.tsv et les fichiers de son/effets/.
"""

from __future__ import annotations

import csv
import html
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent

FAMILLES = [
    ("Pas du joueur", lambda i: i.startswith("pas_")),
    ("Éteints", lambda i: i.startswith("eteint_")),
    ("Contact et combat", lambda i: i in {"saisie", "morsure_manquee", "morsure", "impact", "impact_appuye", "coup_tete", "chute_corps", "sifflement", "sifflement_lourd", "esquive", "degagement", "coeur", "effondrement"}),
    ("Feu de camp", lambda i: i in {"buche_tombe", "extinction", "feu_crepite"}),
    ("Installations", lambda i: i in {"soufflet", "braises", "trempe", "chaine_velo", "roue_libre", "meule", "pinces", "bourdonnement", "interrupteur"}),
    ("Faune", lambda i: i in {"envol", "caquet", "cancan"}),
    ("Météo", lambda i: i in {"pluie", "tonnerre"}),
    ("Interface", lambda i: i.startswith("ui_")),
    ("Gestes et outils", lambda i: True),
]


def lignes():
    with open(RACINE / "decoupe.tsv", newline="") as f:
        return [l for l in csv.DictReader((x for x in f if x.strip() and not x.startswith("#")), delimiter="\t")]


def famille(ident: str) -> str:
    return next(nom for nom, test in FAMILLES if test(ident))


def sources_de(source: str) -> list[str]:
    """Les sources citées dans une recette : « fs:ID » ou un chemin de pack."""
    return [c.split("@")[0].strip() for c in source.split("&")]


def page(ls) -> None:
    par_id: dict[str, list[dict]] = {}
    for l in ls:
        par_id.setdefault(l["identifiant"], []).append(l)
    blocs: dict[str, list[str]] = {}
    for ident, vs in par_id.items():
        note = next((v["note"] for v in vs if v["note"]), "")
        boucle = any(v["boucle"] for v in vs)
        lecteurs = "".join(
            f'<figure><audio controls preload="none"{" loop" if boucle else ""}>'
            f'<source src="effets/{ident}/{ident}_{v["variante"]}.opus" type="audio/ogg; codecs=opus">'
            f'<source src="effets/{ident}/{ident}_{v["variante"]}.m4a" type="audio/mp4"></audio>'
            f'<figcaption>variante {v["variante"]}</figcaption></figure>'
            for v in vs
        )
        blocs.setdefault(famille(ident), []).append(
            f'<section><h3>{ident}{" 🔁" if boucle else ""}</h3><p>{html.escape(note)}</p><div class="lecteurs">{lecteurs}</div></section>'
        )
    corps = "".join(f"<h2>{nom}</h2>{''.join(blocs[nom])}" for nom, _ in FAMILLES if nom in blocs)
    (RACINE / "ecoute.html").write_text(f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Écoute des effets</title>
<style>
:root {{ --fond:#16130f; --texte:#ece4d6; --doux:#a39886; --carte:#221d17; --accent:#e0a050; }}
body {{ margin:0; padding:16px; background:var(--fond); color:var(--texte); font:15px/1.45 system-ui,sans-serif; }}
main {{ max-width:1100px; margin:auto; }}
h1 {{ font-size:1.5rem; }} h2 {{ color:var(--accent); margin-top:2rem; border-bottom:1px solid #3a3128; }}
section {{ background:var(--carte); border-radius:8px; padding:10px 14px; margin:10px 0; }}
h3 {{ margin:0; font-family:ui-monospace,monospace; font-size:1rem; }} p {{ margin:2px 0 8px; color:var(--doux); }}
.lecteurs {{ display:flex; flex-wrap:wrap; gap:10px; }} figure {{ margin:0; }} audio {{ width:220px; max-width:100%; }}
figcaption {{ font-size:.8rem; color:var(--doux); }}
</style></head><body><main>
<h1>Effets sonores — écoute de la livraison</h1>
<p>Chaque fichier contient un seul événement (le jeu le répète lui-même). 🔁 = boucle : la lecture recommence sans couture.
Le jeu ajoute en plus ±3 % de hauteur et ±2 dB à chaque lecture. Si le navigateur ne lit pas l'Opus (anciens Safari), les mêmes sons existent en .m4a.</p>
{corps}
</main></body></html>
""")


def credits(ls) -> None:
    index = {}
    with open(RACINE / "sources" / "freesound" / "index.tsv", newline="") as f:
        for l in csv.DictReader(f, delimiter="\t"):
            index[l["id"]] = l
    utilises: dict[str, list[str]] = {}
    for l in ls:
        for s in sources_de(l["source"]):
            utilises.setdefault(s, []).append(f'{l["identifiant"]}_{l["variante"]}')
    lignes_fs, lignes_packs = [], []
    for s, fichiers in sorted(utilises.items()):
        cibles = ", ".join(sorted(set(fichiers)))
        if s.startswith("fs:"):
            i = index[s[3:]]
            titre = re.sub(r"^Freesound - ", "", i["titre"]).replace("|", "/")
            lignes_fs.append(f'| [{titre}]({i["page"]}) | {i["auteur"]} | {cibles} |')
        else:
            pack = s.split("/")[0]
            lignes_packs.append(f"| {pack} | `{s.split('/')[-1]}` | {cibles} |")
    (RACINE / "CREDITS.md").write_text(
        "# Origine des sons livrés\n\n"
        "Tous les sons sont dans le **domaine public (CC0 1.0)** : aucune attribution n'est exigée. "
        "On remercie quand même les auteurs, ici et dans les crédits du jeu si on le souhaite.\n"
        "Licence de chaque son Freesound vérifiée le 2026-10-08 sur sa page (lien creativecommons.org/publicdomain/zero/1.0). "
        "Packs : Kenney (kenney.nl, CC0, fichier License.txt dans chaque pack).\n\n"
        "## Freesound\n\n| Son d'origine | Auteur | Fichiers livrés qui l'utilisent |\n|---|---|---|\n"
        + "\n".join(lignes_fs)
        + "\n\n## Packs\n\n| Pack | Fichier | Fichiers livrés qui l'utilisent |\n|---|---|---|\n"
        + "\n".join(lignes_packs)
        + "\n"
    )


def manifeste(ls) -> None:
    """son/effets/manifeste.json : pour chaque identifiant, ses fichiers (sans extension), leurs durées, s'il boucle."""
    import json
    import sys

    sys.path.insert(0, str(Path(__file__).parent))
    import sons

    sortie: dict[str, dict] = {}
    for l in ls:
        ident = l["identifiant"]
        base = f'{ident}/{ident}_{l["variante"]}'
        duree = len(sons.lire(RACINE / "effets" / (base + ".flac"))) / sons.FE
        e = sortie.setdefault(ident, {"boucle": bool(l["boucle"]), "variantes": [], "durees": []})
        e["variantes"].append(base)
        e["durees"].append(round(duree, 3))
    (RACINE / "effets" / "manifeste.json").write_text(
        json.dumps({"version": 1, "formats": [".opus", ".m4a"], "frequence": sons.FE, "sons": sortie}, ensure_ascii=False, indent=1) + "\n"
    )


if __name__ == "__main__":
    ls = lignes()
    page(ls)
    credits(ls)
    manifeste(ls)
    print("son/ecoute.html, son/CREDITS.md, son/effets/manifeste.json")
