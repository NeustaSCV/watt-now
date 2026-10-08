# Livraison des effets sonores — remplacement des sons synthétisés

> Pour l'agent qui développe le client (`code/`). Rédigé le 2026-10-08 par la session « son ».
> Cette session n'a pas touché à `code/` : tout est ici, dans `son/`, prêt à être copié et branché.
> Références : `code/client/src/son/catalogue.ts` (les identifiants), Book 21 §6.3 (effets sonores), `musique/LIVRAISON.md` (moteur, formats).

## 1. Ce qui est livré

| Élément | Où | Remarque |
|---|---|---|
| **Les 82 effets du catalogue, 237 fichiers** (un par variante) | `effets/<identifiant>/<identifiant>_<n>.opus` et `.m4a` | Opus 64 kbit/s + AAC 96 kbit/s en secours, mono 48 kHz, comme la musique |
| **Le manifeste** (identifiant → fichiers, durées, boucle ou non) | `effets/manifeste.json` | À lire par le chargeur |
| Masters sans perte (archive, **ne pas copier dans le client**) | `effets/**/*.flac` | FLAC 24 bits |
| Page d'écoute de toute la livraison | `ecoute.html` (ouvrir dans un navigateur) | Pour valider à l'oreille |
| Origine et licence de chaque fichier | `CREDITS.md` | Tout est **CC0** (domaine public) |
| Recette de chaque fichier (sources, coupes, montages) et outils | `decoupe.tsv`, `outils/` | Voir §6 pour refaire ou corriger un son |

Poids à télécharger : **2,4 Mo** en Opus (3,5 Mo en AAC). Durée totale : 219 s.

**Couverture : complète.** Les 82 identifiants de `SONS` (catalogue.ts) ont leurs fichiers, avec **exactement le nombre de variantes du catalogue** (`variantes`), numérotées de 0 à n − 1. Aucun identifiant n'est ajouté ni renommé.

## 2. La règle de contenu : un fichier = ce que fabrique la recette

Chaque fichier contient **le même événement que la recette synthétisée qu'il remplace**, ni plus ni moins. C'est le jeu qui répète :

- `coeur` = **un seul** battement double (« boum-boum »), comme `R.coeur` : le bruiteur le relance lui-même.
- `pas_*` = **un seul pas** (talon puis plante, ≈ 0,3–0,45 s) : un fichier par foulée, comme aujourd'hui.
- Gestes répétés (`marteau_bois`, `enclume`, `fouille`, `visser`…) = **un seul geste** : `gesteDe()` le rejoue toutes les `periode` secondes. Chaque fichier est plus court que sa période.
- Les recettes qui contiennent plusieurs petits sons en contiennent autant dans le fichier : `eteint_halete` (3 halètements), `manger` (4 bouchées), `boire` (3 gorgées), `pierre_a_feu` (3 frappes), `pose_pierres` (3 pierres), `scie` (2 allers-retours), `aiguiser` (2 passes), `pinces` (2 pinces), `eteint_machoire` (2–3 claquements), `effondrement` (chute + 2 battements qui faiblissent), `ui_*_valider` (2 notes ou 2 coups).
- Les 8 sons continus (`boucle: true` dans le catalogue) sont des **boucles sans couture** : `remplir_eau`, `bouillir` (4 s), `feu_crepite` (6 s), `braises` (5 s), `chaine_velo` (4 s), `meule` (4 s), `bourdonnement` (3 s), `pluie` (6 s). Le fichier entier boucle : pas besoin de `loopStart`/`loopEnd` ni de `finBoucle`.

Les durées sont proches de celles des recettes (voir `manifeste.json`).

## 3. Niveaux : on garde les gains du catalogue

Chaque fichier a été nivelé avec **exactement la formule de `niveler()`** (`dsp.ts`) : valeur efficace 0,14 mesurée sur la partie audible, crête plafonnée à 0,95 avec arrondi au-delà de 70 %. Un fichier sort donc au même niveau qu'une recette après `fabriquer()`. Conséquences :

- **Ne pas toucher aux `gain`, `priorite`, `portee`, `bus`** du catalogue : ils restent justes.
- Ne pas re-niveler ni ajouter de fondus : les fondus d'entrée et de sortie anti-clic sont déjà dans les fichiers.
- Le moteur continue d'ajouter ±3 % de hauteur et ±2 dB (`varier`) : c'est voulu, il n'y a rien à changer.

## 4. Copier les fichiers dans le client

Comme pour la musique : seuls l'Opus et l'AAC vont au client, avec le manifeste.

```
son/effets/manifeste.json   → code/client/public/assets/effets/manifeste.json
son/effets/**/*.opus, *.m4a → code/client/public/assets/effets/ (même arborescence)
```

Ne pas copier les `.flac`. Un script calqué sur `code/scripts/copier-musique.mjs` suffit (filtre sur `.opus`/`.m4a`, plus `manifeste.json`), à relancer à chaque nouvelle livraison. Mettre ces fichiers dans le cache du Service Worker, comme la musique (Book 21 §6.4.2).

## 5. Brancher les fichiers (proposition)

Le catalogue a été conçu pour ça (en-tête de `catalogue.ts`) : « remplacer la recette d'un identifiant par son fichier ; le jeu ne change pas ». Le point de branchement naturel est `Sonorisation.tamponsDe(id)` dans `code/client/src/son/audio.ts`, qui fabrique aujourd'hui les `AudioBuffer` à partir des recettes :

1. Au démarrage du son, charger `assets/effets/manifeste.json`.
2. Choisir le format comme le moteur de musique : Opus si `canPlayType('audio/ogg; codecs="opus"')` répond, sinon `.m4a`.
3. Dans `tamponsDe(id)` : si le manifeste connaît `id`, `fetch` puis `ctx.decodeAudioData` de chaque variante, et mettre les tampons en cache comme aujourd'hui. Sinon (fichier absent, échec réseau, tests sous Node), **garder la recette** : elle sert de secours et les tests (`catalogue.test.ts`, `bruiteur.test.ts`) continuent de tourner sans navigateur.
4. Le décodage étant asynchrone, `prechauffer()` doit lancer ces chargements d'avance (il le fait déjà pour `SONS_DE_BASE`). Si un son est demandé avant d'être décodé, jouer la recette cette fois-là plutôt que rien.
5. `continus()` joue déjà le premier tampon en boucle (`boucle: true`) : rien d'autre à changer pour les boucles.

**Mémoire.** Tout décodé d'un coup, les effets prennent environ **42 Mo** (48 kHz mono flottant), dont plus de la moitié pour les boucles et le tonnerre. Sur mobile, la musique occupe déjà 58 Mo sur un budget de 64 (`musique/LIVRAISON.md`) : il faut charger à la demande, et ne charger que les `ui_*` de la famille du joueur (3 identifiants sur 9). C'est déjà ce que fait `prechauffer()` dans `main.ts`.

## 6. Refaire ou corriger un son

Tout est reproductible depuis `son/` (Python 3 avec numpy et scipy, plus ffmpeg) :

```
bash son/outils/telecharger-freesound.sh               # récupère les sources de candidats.tsv (vérifie la licence CC0)
python3 son/outils/sons.py analyser <fichier>          # liste les événements d'un enregistrement
python3 son/outils/sons.py rendre son/decoupe.tsv      # refabrique tous les fichiers (ou --seul <identifiant>)
python3 son/outils/pages.py                            # refait ecoute.html, CREDITS.md et manifeste.json
```

Pour changer un son : modifier sa ligne dans `decoupe.tsv` (source, début-fin, montage de couches, fondu, filtre), relancer `rendre --seul <id>` puis `pages.py`. Les sources brutes (`son/sources/`, 69 Mo) restent hors de Git ; le script de téléchargement les reconstitue.

## 7. Points de vigilance (à écouter avant de brancher)

Je n'ai pas pu écouter les sons : les choix reposent sur les descriptions des auteurs, puis sur une analyse automatique (silences, nombre d'événements, durée, timbre, niveau). **Une écoute de `ecoute.html` par le porteur du projet est nécessaire** avant de brancher. Les plus incertains :

| Son | Pourquoi |
|---|---|
| `meule` | Aucune meule à pédale en CC0 : c'est un couteau sur une meule, dont les passes sont irrégulières. La répétition de la boucle de 4 s peut s'entendre. **Si c'est le cas, garder la recette.** |
| `pinces` | Ersatz : des clips métalliques (aucune pince crocodile en CC0). |
| `soufflet` | Le soufflet d'un vieux moulin, avec les braises de forge en dessous. Plus grand qu'un soufflet de forge. |
| `extinction` | Feu éteint à l'eau (vapeur), faute d'une extinction naturelle en CC0. |
| `buche_tombe` | Montage : une bûche lancée sur une pile, plus des crépitements de feu. |
| `esquive`, `degagement`, `saisie`, `coup_tete`, `effondrement` | Montages de deux ou trois sons (mouvement + appuis, tissu + coup, coup + os, chute + cœur). |
| `ui_voltaiques_*` | Fabriqués à partir d'un seul vrai bip de moniteur (795 Hz), transposé pour ouvrir, fermer et valider. |
| `chaine_velo`, `bourdonnement` | Boucles courtes : vérifier qu'aucun motif ne revient trop visiblement. |
| Voix des Éteints | Une seule voix (Joao_Janz) pour les râles : c'est cohérent, mais tous les Éteints auront la même gorge. On peut mélanger avec OwNathan ou Breviceps (déjà téléchargés, voir `recherche/02-eteints-combat.md`). |

Six sons du catalogue ne sont encore déclenchés nulle part dans le code : `soufflet`, `braises`, `trempe`, `scie`, `hache_coupe`, `aiguiser`. Ils sont quand même livrés.

**Qualité des sources.** Les sources Freesound sont les aperçus haute qualité (OGG ≈ 192 kbit/s) : les originaux WAV demandent un compte. C'est suffisant, puisque le jeu les recompresse en Opus 64 kbit/s. Pour une version plus propre plus tard, les liens des originaux sont dans `CREDITS.md`.

## 8. Licences

Tous les sons utilisés sont en **CC0 1.0** : aucune attribution obligatoire, usage commercial libre. Chaque licence Freesound a été vérifiée le 2026-10-08 sur la page du son (lien officiel `creativecommons.org/publicdomain/zero/1.0`), et les packs Kenney portent leur `License.txt` CC0. `CREDITS.md` liste quand même les auteurs, si l'on veut les remercier dans les crédits du jeu.
