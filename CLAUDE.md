# Règles du projet *Watt Now?*

## Périmètre de travail (règle du porteur du projet, 2026-10-07)

- **Interdit de toucher aux dossiers à l'extérieur de ce dossier** (`survival-realistic-zombie/`) : ni lecture pour modifier, ni écriture, ni suppression.
- **Tout le code est écrit ici**, dans ce dossier.
- **Demander à chaque fois** avant toute action qui touche l'extérieur de ce dossier, en particulier :
  - créer, lancer ou modifier un **conteneur Docker** (images, volumes, réseaux) ;
  - installer un outil ou un paquet global, modifier la configuration du système ou d'un autre projet ;
  - écrire dans un dossier temporaire ou de cache situé hors du projet.
- **Brouillons, sauvegardes avant modification, fichiers de travail** : dans `.claude-travail/` (à ignorer dans Git), jamais dans un dossier temporaire du système.
- **Exception autorisée** : la mémoire de Claude dans `~/.claude/projects/…/memory/`, qui sert seulement à garder les règles et l'avancement d'une session à l'autre.

**Garde-fous techniques** (`.claude/settings.json`) : un hook (`.claude/hooks/garde-perimetre.py`) refuse toute écriture de fichier hors du projet (sauf la mémoire) ; les commandes Docker, `sudo`, `brew` et les installations globales demandent toujours une confirmation.

## Langue (règle du porteur du projet, 2026-10-07)

- **Toujours parler en français** avec le porteur du projet : réponses, comptes rendus, questions, résumés d'avancement, sans exception (même après une reprise de contexte ou un long travail technique).
- Le code, ses commentaires et les books sont aussi en français.

## Organisation

- `book/` : les books de conception (le sommaire est dans `book/README.md`).
- `revue/` : les revues de cohérence des books.
- Plusieurs sessions peuvent travailler en même temps sur `book/` : **toujours relire un book juste avant de le modifier**.
