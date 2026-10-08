# Livraison de la musique — phase 0a

> Pour l'agent qui développe le client (`code/`). Rédigé par la session musique le 2026-10-08.
> La session musique ne modifie pas `code/` : tout est ici, dans `musique/`, prêt à être copié et branché.
> Référence : Book 21 §6 (musique et son), en particulier §6.2.3 (couches et transitions) et §6.4 (moteur).

## 1. Ce qui est livré

| Élément | Où | État |
|---|---|---|
| **Moteur audio** (bus, couches synchronisées, volumes, signaux, effets spatialisés, atténuation de la musique, limite de voix, radio, écran titre) | `moteur/moteur-couches.js` | Prêt. Module ES, sans dépendance |
| **Directeur musical** (machine à états des règles du Book 21 §6.2.3) | `moteur/directeur.js` | Prêt. Tests : `node musique/moteur/test-directeur.mjs` (14 tests) |
| **Musique, version ordinateur** (stems séparés, Opus 64 kbit/s, AAC en secours) | `production/jeu/` + `production/manifeste.json` | Prête (sons synthétisés et échantillons libres CC0) |
| **Musique, version mobile** (3 couches prémixées, Opus 48 kbit/s) | `production/mobile/` + `production/manifeste-mobile.json` | Prête |
| **Thème principal** (écran titre : introduction + boucle) | dans les deux manifestes, pièce `titre` (le moteur prend toujours la version prémixée) | Prêt |
| **Masters sans perte** (archive phase 1, ne pas copier dans le client) | `production/masters/` (FLAC 24 bits) | Archive |
| **Effets sonores** (Éteints, pas, feu, ateliers, ambiance) | — | **Pas encore livrés en fichiers.** Les sons du banc d'essai sont provisoires et synthétisés en direct ; ils seront livrés en fichiers dans une prochaine étape |

Poids à télécharger pour un joueur (sa famille + tout le commun) : **≈ 11,5 Mo** sur ordinateur, **≈ 4 Mo** sur mobile, plus le thème principal (≈ 1,1 Mo).
Mémoire audio décodée mesurée (scène complète) : **137 Mo** au plus sur ordinateur (budget 160), **58 Mo** sur mobile (budget 64).

## 2. Copier les fichiers dans le client

Copier, en gardant l'arborescence (le moteur lit les chemins du manifeste) :

```
musique/production/manifeste.json          → <assets>/musique/manifeste.json
musique/production/manifeste-mobile.json   → <assets>/musique/manifeste-mobile.json
musique/production/jeu/                    → <assets>/musique/jeu/
musique/production/mobile/                 → <assets>/musique/mobile/
musique/moteur/moteur-couches.js           → <src>/audio/moteur-couches.js
musique/moteur/directeur.js                → <src>/audio/directeur.js
```

Ne pas copier `production/masters/` ni les WAV. Mettre les fichiers audio en cache (Service Worker, Book 21 §6.4.2).

## 3. Brancher le moteur

```js
import { MoteurAudio } from './audio/moteur-couches.js';

// Au bouton « Jouer » (iOS : le contexte doit être créé ou repris dans un geste du joueur)
const ctx = new AudioContext({ latencyHint: 'playback' });
await ctx.resume();
const muet = ctx.createBufferSource(); muet.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); muet.connect(ctx.destination); muet.start();

const mobile = /* choix du client : iPhone, iPad, Android, ou peu de mémoire */ false;
const moteur = new MoteurAudio(ctx, { bpm: 84, directeur: { lieu: 'terrain', attendreFeu: true } });
await moteur.chargerProduction('/assets/musique/', famille /* 'charbonniers' | 'voltaiques' | 'mecanistes' */, (fait, total) => {}, mobile);
moteur.attribuer('fond', 'fond-jour');
moteur.attribuer('vie', 'vie-jour');
moteur.attribuer('tension', 'tension');
moteur.attribuer('danger', 'danger');
await moteur.demarrer();
```

### Pièces à attribuer selon le lieu

| Lieu | Options du moteur | `fond` | `vie` | `tension` | `danger` |
|---|---|---|---|---|---|
| Terrain (jour) | `bpm: 84`, `lieu: 'terrain'` | `fond-jour` | `vie-jour` | `tension` | `danger` |
| Halte | `bpm: 84`, `lieu: 'halte'` | `fond-halte` | `explo-halte` | `tension-halte` | `danger-halte` |
| Comptoir (zone sûre) | `bpm: 96`, `lieu: 'comptoir'` | — | `comptoir` | — | — |

Le passage du terrain à la nuit (`fond-nuit`, `vie-nuit`) est géré par le moteur lui-même (`changerMoment`).
Changer de lieu = changer de carte : `moteur.arreter()`, puis un nouveau `MoteurAudio` avec les pièces du lieu (les fichiers déjà chargés sont en cache).

### Événements du jeu → appels au moteur

| Dans le jeu | Appel | Ce que fait la musique |
|---|---|---|
| Un Éteint est **Attiré** par le joueur, ou le **poursuit** | `moteur.signalerMenace('attire')` / `('poursuite')` | Tension au temps fort suivant, si la condition dure ≥ 2 s ; la Vie perd nappes, effets et mélodie |
| **Saisie** | `moteur.signalerMenace('saisie')` | Danger au temps suivant (≤ 0,7 s), signal de saisie |
| Fin de la menace (dégagement, Éteint semé ou mort) | `moteur.signalerMenace('aucune')` | Silence 4 à 8 s, puis Fond ; la Vie revient plus tard. La Tension ne sort qu'après 10 s sans menace |
| **Premier feu** (tutoriel, étape 3) | `moteur.premierFeu()` | Souffle chaud, puis la Vie entre pour la première fois, un instrument toutes les 4 mesures |
| **Installation de l'atelier** de la famille | `moteur.installerAtelier()` | Le thème entre au complet, avec sa percussion faite du son de l'atelier |
| Crépuscule / aube | `moteur.changerMoment('nuit')` / `('jour')` | Signal tout de suite (à la mesure), musique de nuit ou de jour au bloc suivant |
| Le personnage s'endort / se réveille | `moteur.dormir()` / `moteur.reveiller()` | Motif court puis silence ; à l'aube, signal et retour du Fond |
| Arrivée près du Comptoir / à l'intérieur | `moteur.radio(true)` / `moteur.radio(false)` | La musique sort d'un petit poste, puis s'ouvre en grand |
| Recette réussie, découverte d'une recette, échange conclu (coup de tampon), premier Éteint repéré, mort | `moteur.jouerSignal('recette' \| 'decouverte' \| 'echange' \| 'eteintRepere' \| 'mort')` (option : `'maintenant'`, `'temps'`, `'mesure'`) | Le signal, calé sur le temps suivant par défaut |
| Réglages du joueur | `moteur.regler('general' \| 'musique' \| 'effets' \| 'ambiance' \| 'voix', 0..1)` | — |

Le niveau de menace attendu est **l'état le plus grave parmi les Éteints qui ciblent le joueur** : `aucune` < `attire` < `poursuite` < `saisie`. Appeler `signalerMenace` à chaque changement ; le directeur gère lui-même l'hystérésis (pas de va-et-vient).

### Écran titre (moment-vitrine 1)

```js
await moteur.jouerTitre('/assets/musique/');   // jingle Watty, coupure, thème ; puis boucle sans fin
// au clic sur « Jouer » :
moteur.quitterTitre(5);                         // fondu de 5 s, puis charger le terrain (Fond seul au petit matin)
```

### Effets sonores

`moteur.jouerEffet(buffer, { bus, priorite, position: { x, y }, portee, gain, boucle })` joue un effet tout de suite (jamais calé sur le tempo), avec variation de hauteur (±3 %) et de volume (±2 dB). Il s'éteint exactement à sa **portée de signature**. Un effet P1 ou P2 proche baisse la musique (et P1 l'ambiance) ; au-delà de 48 voix, les P3 sont coupés d'abord. `moteur.arreterEffet(v, fondu)` arrête un effet en boucle.

La spatialisation du moteur est simple (panoramique, volume, filtre selon la distance ; `x` à droite, `y` devant, en mètres, auditeur sur le personnage). Le Book 21 §6.4.1 prévoit `PositionalAudio` de three.js : on peut soit calculer `position` relativement au personnage et garder `jouerEffet`, soit brancher les sources three.js sur `moteur.bus.menaces`, `bus.joueur`, `bus.environnement` (l'atténuation de la musique reste alors à déclencher).

## 4. Particularités

- **Opus ou AAC** : le moteur choisit l'Opus si `canPlayType('audio/ogg; codecs="opus"')` répond, sinon le `.m4a`.
- **Mémoire** : les fichiers restent compressés en mémoire ; seuls le bloc en cours et le suivant sont décodés. `moteur.memoire()` donne la mémoire décodée en Mo.
- **Onglet caché** : suspendre le contexte (`ctx.suspend()`) et le reprendre au retour (Book 21 §6.4.3) ; le moteur reprend où il en était.
- **Grille** : 84 BPM, blocs de 8 mesures (≈ 22,9 s) + 1 mesure de queue ; Comptoir à 96 BPM. Toutes les transitions tombent sur un temps, un temps fort, une mesure ou un bloc, selon la règle.
- **Niveaux** : chaque pièce est masterisée à −18 LUFS (Vie de nuit −20, Fond seul −26, signaux −19), crête ≤ −1,5 dBTP. Détail : `production/rapport-niveaux.md`.
- **Le banc d'essai** `musique/moteur/index.html` (serveur : `python3 musique/outils/serveur.py`, puis `http://127.0.0.1:8765/moteur/`) montre tout cela en marche, avec la case « Jouer les fichiers produits ».

## 5. Reste à faire (côté musique)

- Les **effets sonores en fichiers** : Éteints définitifs (voix retravaillées), pas, outils, feu, ambiance.
- Le **test sur iPhone 13** : son au premier toucher, mémoire, aucun craquement sur 30 min.
- Les propositions de modification du Book 21 (débits, méthode mémoire, modes) : `musique/propositions.md`.

Crédits et licences : `musique/credits.md` (synthèse maison, échantillons VSCO 2 CE en CC0).
