# Musique de *Watt Now?* — phase 0a

Dossier de travail du compositeur (voir `BRIEF.md`). La commande est au Book 21 §6, la direction musicale au Book 16.

| Fichier | Contenu | Étape (Book 21 §6.5.3) |
|---|---|---|
| `BRIEF.md` | La commande de la session musique | — |
| `LIVRAISON.md` | **Pour l'agent qui développe** : ce qui est livré, quoi copier dans le client, comment brancher le moteur, quels appels pour quels événements du jeu | Livraison |
| `brief-ecoute.md` | Listes d'écoute par famille et par lieu, lecture des modes et des toniques | 1. Brief |
| `esquisses/` | Les trois thèmes de famille, ≈ 1 minute chacun, jouables dans le navigateur | 2. Esquisses |
| `moteur/` | Moteur de couches, directeur musical, pièces en blocs, Éteints provisoires, banc d'essai | 3. Maquette du moteur |
| `propositions.md` | Propositions de modification des books (à valider) | — |
| `credits.md` | Crédits et licences | — |

## Écouter les esquisses

La page charge des scripts : il faut la servir en HTTP (ouverte directement depuis le disque, le navigateur bloque les scripts). Depuis ce dossier :

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:8765` : la page d'accueil mène aux esquisses (`/esquisses/`) et au banc d'essai du moteur (`/moteur/`). Pour l'iPhone 13 sur le même réseau Wi-Fi, remplacer `127.0.0.1` par l'adresse de l'ordinateur dans les deux commandes, ou utiliser le bouton **Exporter en WAV** et écouter le fichier.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `esquisses/js/moteur.js` | Instruments (synthèse), graphe audio (couches, réverbération, écho, compresseur), lecteur par mesure, rendu hors ligne et export WAV |
| `esquisses/js/themes.js` | Les trois thèmes (v3, souffle accordé et effets discrets) : accords, sections de nappe et silences, lit sonore, effets de chaque famille |
| `esquisses/index.html` | Page d'écoute : lecture, couches activables, export WAV, test à l'aveugle |

Les couches (Fond, Texture, Basse, Nappes, Effets) préfigurent les stems de la production. Elles se coupent par leur volume, sans arrêter la lecture, comme le prévoit le moteur du jeu (Book 21 §6.4.1).

## Moteur de couches (étape 3)

| Fichier | Rôle |
|---|---|
| `moteur/directeur.js` | Directeur musical : machine à états pure (Book 21 §6.2.3). Reçoit la menace et le moment, renvoie des commandes datées sur l'horloge musicale. Module ES |
| `moteur/moteur-couches.js` | Moteur audio (Book 21 §6.4.1) : bus et réglages, couches et stems synchronisés par bloc, volumes, signaux, effets spatialisés à portée de signature, atténuation de la musique, limite de voix. Module ES sans dépendance, à brancher dans `code/` |
| `moteur/test-directeur.mjs` | Tests du directeur : `node moteur/test-directeur.mjs` |
| `moteur/pieces.js` | Pièces rendues depuis les esquisses (`preparer` : terrain d'une famille ; `preparerHalte` : la halte en la mineur harmonique — Fond, Exploration, Tension et Danger transposés, signal d'arrivée ; `preparerComptoir` : le Comptoir en sol mixolydien à 96 BPM, 4 blocs, 4 stems) : Fond jour et nuit, Vie de jour (2 blocs) et **Vie de nuit** (4 blocs ; mélodie au violon solo, à l'onde douce ou à la flûte), Tension, Danger, signaux (crépuscule, aube, saisie, dégagement, endormissement) ; blocs de 8 mesures + 1 mesure de queue |
| `moteur/outils-famille.js` | Sons **provisoires** des ateliers (forge : enclume, soufflet, trempe ; pédalier : chaîne, roue libre, rayons, meule ; banc de recharge : bornes, pinces, interrupteur, bourdonnement). Servent comme effets (rythme libre) et comme percussion « outil » du thème au complet (accordés, sur la grille) |
| `moteur/halte-sons.js` | Sons **provisoires** de la halte : compteur à rouleaux de la pompe, bidons, tuyau, guitare préparée, auvent, néon mort |
| `moteur/comptoir-sons.js` | Sons **provisoires** du Comptoir : tampons encreurs, clic du compteur électrique, caisse enregistreuse, papiers (la batterie du groove et l'ambiance) |
| `moteur/eteints-provisoires.js` | Râles, pas, saisie, chute, **feu de camp** (briquet, petit bois, crépitement en boucle, bûche, extinction), ambiance : sons **provisoires** pour tester |
| `moteur/index.html` | Banc d'essai : on joue une scène (premier feu, installation de l'atelier, Éteint repéré, poursuite, saisie, dégagement, nuit, endormissement, aube) et on voit ce que fait le directeur |

En production, les tampons de `pieces.js` seront remplacés par les fichiers des stems ; le moteur et le directeur ne changent pas.

## Le réveil et le thème principal (moment-vitrine 1)

| Fichier | Rôle |
|---|---|
| `theme-principal/theme.js` | La composition : jingle Watty à la radio, coupure de courant, puis le thème (52 mesures, ≈ 2 min 29 s), boucle de la mesure 44 à 52 pour l'écran titre |
| `theme-principal/echantillonneur.js` | Échantillonneur : lit `banques/index.json`, choisit l'échantillon le plus proche, la nuance et la variante ; tient les notes longues par segments en fondu |
| `theme-principal/index.html` | Page d'écoute : lecture, boucle, « ▶ Jouer » (fondu vers le petit matin sur le terrain), couches, export du mixage et des 5 stems |

## Banques d'échantillons

| Dossier | Contenu |
|---|---|
| `banques/vsco2-ce/` | Sélection de VSCO 2 Community Edition (CC0), ≈ 1,2 Go ; voir `credits.md` |
| `banques/index.json` | Index des échantillons (note, nuance, variante), produit par `outils/indexer-banques.py` |
| `outils/telecharger-vsco.py` | Retélécharge la sélection (rejouable, saute les fichiers déjà présents) |

## Production (étape 4)

| Élément | Rôle |
|---|---|
| `outils/serveur.py` | Le serveur local (127.0.0.1:8765) : sert `musique/` et accepte l'enregistrement de fichiers, **uniquement** dans `production/` |
| `production/index.html` | Calcule toutes les pièces à 48 kHz, bloc par bloc et stem par stem, et écrit les WAV et `manifeste.json` |
| `outils/encoder.py` | WAV → master FLAC 24 bits (`production/masters/`, archive) ; mastering par pièce (−18 LUFS, crête ≤ −1,5 dBTP) ; **ordinateur** : Opus 64 kbit/s (basse en mono 32), AAC en secours (`production/jeu/`, 11,5 Mo par famille) ; **mobile** : 3 couches prémixées en Opus 48 kbit/s (`production/mobile/`, ≈ 4 Mo par famille, `manifeste-mobile.json`) ; efface les WAV ; rapport `production/rapport-niveaux.md` |
| `production/manifeste.json` | La grille (84 BPM, blocs de 8 mesures + 1 de queue), et pour chaque pièce : rôle, tonique, mode, stems et fichiers de chaque bloc ; les signaux |
| `moteur/moteur-couches.js` → `chargerProduction(base, famille, progres, mobile)` | Le moteur charge ces fichiers (Opus, ou AAC si le navigateur ne lit pas l'Opus), pour la famille du joueur seulement. Ils restent **compressés** en mémoire ; seuls le bloc en cours et le suivant sont décodés (mesuré : 137 Mo au plus sur ordinateur, 58 Mo sur mobile). `memoire()` donne la mémoire décodée |

Pour tout refaire :

```bash
python3 musique/outils/serveur.py
```

Puis ouvrir `http://127.0.0.1:8765/production/`, cliquer « Produire », et lancer :

```bash
python3 musique/outils/encoder.py
```
