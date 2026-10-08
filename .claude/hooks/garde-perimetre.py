#!/usr/bin/env python3
"""Refuse toute écriture de fichier hors du dossier du projet (règle du CLAUDE.md).

Appelé par Claude Code avant Write, Edit et NotebookEdit (hook PreToolUse).
Seule exception : la mémoire de Claude pour ce projet, dans ~/.claude.
"""
import json
import os
import sys

PROJET = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", ".."))
MEMOIRE = os.path.realpath(os.path.expanduser(
    "~/.claude/projects/-Users-stan-Documents-01-Projets-dev-Claude-default-survival-realistic-zombie/memory"
))
AUTORISES = [PROJET, MEMOIRE]


def dedans(chemin, racine):
    return chemin == racine or chemin.startswith(racine + os.sep)


donnees = json.load(sys.stdin)
entree = donnees.get("tool_input", {})
cible = entree.get("file_path") or entree.get("notebook_path")
if not cible:
    sys.exit(0)

cible = os.path.realpath(os.path.expanduser(cible))
if any(dedans(cible, racine) for racine in AUTORISES):
    sys.exit(0)

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": (
            f"Écriture refusée : {cible} est hors du dossier du projet ({PROJET}). "
            "Règle du CLAUDE.md : demander d'abord au porteur du projet."
        ),
    }
}))
