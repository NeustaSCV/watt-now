# Livraison de la musique — phase 0a

> Pour l'agent qui développe le client (`code/`). Rédigé par la session musique le 2026-10-08.
> La session musique ne modifie pas `code/` : tout est ici, dans `musique/`, prêt à être copié et branché.
> Référence : Book 21 §6 (musique et son), en particulier §6.2.3 (couches et transitions) et §6.4 (moteur).

## 0. À faire côté code — correctif du 2026-10-08 (version mobile muette)

**Le défaut** (signalé par la session code, confirmé et corrigé par la session musique) : en **version mobile** (`chargerProduction(…, mobile = true)`), le moteur démarrait le fichier prémixé `mix` de **chaque** couche à volume 0. Seule la Vie le remontait ensuite. Conséquence : sur téléphone, le **Fond**, la **Tension** et le **Danger** restaient **muets** sur le terrain, à la halte et à la coopérative (mesuré : −120 dB, le Danger muet en pleine saisie). La version ordinateur n'était pas touchée.

**La correction** : une seule ligne, dans `musique/moteur/moteur-couches.js`, méthode `_stemsDe` : le prémix ne démarre à 0 que pour la couche **Vie** (la seule que le directeur règle stem par stem) ; le Fond, la Tension et le Danger jouent leur prémix à plein volume, et leur volume est réglé par la couche, comme sur ordinateur.

**Ce que l'agent du code doit faire** :

1. **Recopier** `musique/moteur/moteur-couches.js` → `<src>/audio/moteur-couches.js` (par exemple avec `code/scripts/copier-musique.mjs`). Rien d'autre ne change : ni l'interface du moteur, ni les fichiers audio, ni les manifestes, ni `directeur.js` (déjà recopié pour la coopérative).
2. **Ne rien changer** dans le code du jeu qui appelle le moteur : les appels restent les mêmes.
3. **Vérifier** : la page `musique/test-iphone/` (ci-dessous) doit afficher « Tout est bon » en version mobile pour le terrain, la halte et la coopérative. Vérifié le 2026-10-08 dans le navigateur de l'ordinateur, version mobile forcée : avant la correction, 4 échecs sur le terrain (Fond, Tension, Danger) ; après, tout est bon, terrain et coopérative.

**Test sur un vrai iPhone** (porteur du projet) : sur le Mac, `python3 musique/outils/serveur.py --reseau` (réseau local, lecture seule), puis ouvrir sur l'iPhone, même Wi-Fi, l'adresse affichée (`http://<adresse-du-Mac>:8765/test-iphone/`). La page lance le moteur avec les fichiers produits, **mesure ce qui sort de chaque couche** et coche chaque étape (son débloqué au premier toucher, Fond, Vie, Tension, Danger, silence, zones de la coopérative, mémoire) ; un compte rendu se copie en un toucher.

**À surveiller** : à la coopérative, en version mobile, le pic de mémoire décodée atteint **64 Mo, exactement le budget** (55 Mo sur le terrain). C'est au moment où l'on passe en Danger avec « le nombre » : le Danger et son stem sont décodés pendant que le bloc précédent l'est encore. À confirmer sur l'iPhone ; si ça déborde, la session musique allégera ce passage.

## 0 bis. Mise à jour du 2026-10-14 : le violon remplacé par les violoncelles

À la demande du porteur (le violon solo « perçait » et sonnait « MIDI »), la mélodie du **thème principal** (mesures 12-19 et 36-43) et celle de la **Vie de nuit des Charbonniers** sont maintenant jouées par les **violoncelles**, une octave plus bas, en jeu lié. Au sommet du thème, la flûte ne monte plus jusqu'au ré7. Mesuré au sommet : énergie entre 2 et 5 kHz de −18 dB à ≈ −33 dB.

**Côté code** : seulement **recopier les fichiers audio** (`jeu/`, `mobile/`, les deux manifestes) : la pièce `titre` et les pièces `vie-nuit-charbonniers` ont changé. Rien d'autre (moteur, appels) ne change.

## 1. Ce qui est livré

| Élément | Où | État |
|---|---|---|
| **Moteur audio** (bus, couches synchronisées, volumes, signaux, effets spatialisés, atténuation de la musique, limite de voix, radio, écran titre) | `moteur/moteur-couches.js` | Prêt. Module ES, sans dépendance |
| **Directeur musical** (machine à états des règles du Book 21 §6.2.3) | `moteur/directeur.js` | Prêt. Tests : `node musique/moteur/test-directeur.mjs` (14 tests) |
| **Musique, version ordinateur** (stems séparés, Opus 64 kbit/s, AAC en secours) | `production/jeu/` + `production/manifeste.json` | Prête (sons synthétisés et échantillons libres CC0) |
| **Musique, version mobile** (3 couches prémixées, Opus 48 kbit/s) | `production/mobile/` + `production/manifeste-mobile.json` | Prête |
| **La Coopérative du Plateau** (Book 23, 0.5) : Fond à un stem par zone, Exploration, Tension, Danger (+ stem « nombre »), 3 signaux, la radio de la Compagnie (son diégétique) | dans les deux manifestes (`fond-coop`, `explo-coop`, `tension-coop`, `danger-coop`, `diegetiques`) ; voir §3 bis | Prête (ajoutée le 2026-10-08) |
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

Les fichiers de la coopérative sont dans les mêmes dossiers (`jeu/fond-coop/`, `jeu/diegetiques/`…) : recopier `jeu/`, `mobile/` et les deux manifestes suffit. **Le moteur et le directeur ont changé le 2026-10-08** (zones, menace « nombre ») : les recopier aussi ; le terrain, la halte et le Comptoir ne changent pas de comportement (19 tests).

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
| **Coopérative** | `bpm: 84`, `lieu: 'cooperative'` | `fond-coop` | `explo-coop` | `tension-coop` | `danger-coop` |
| **Kit Château** | `bpm: 84`, `lieu: 'chateau'` | `fond-chateau` | `explo-chateau` | `tension-chateau` | `danger-chateau` |
| **Kits Villa, Hôpital, Industriel** | `bpm: 84`, `lieu: 'villa'` / `'hopital'` / `'industriel'` | `fond-<kit>` | `explo-<kit>` | `tension-<kit>` | `danger-<kit>` |

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

### 3 bis. La Coopérative du Plateau (Book 23)

La musique suit la **profondeur** : plus on entre, plus elle se retire, pour laisser entendre les Éteints. Tonique mi.

| Dans le jeu | Appel | Ce que fait la musique |
|---|---|---|
| Arrivée au portail (chargement du lieu) | `new MoteurAudio(ctx, { bpm: 84, directeur: { lieu: 'cooperative' } })`, `attribuer` (tableau ci-dessus), `demarrer()` | Signal `arriveeCoop` à la mesure, Fond « dehors » seul ; l'Exploration entre au premier bloc après 8 s de calme |
| Le joueur **change de zone** | `moteur.changerZone('dehors' \| 'dedans' \| 'froid')` | Le Fond passe au stem de la zone **à la mesure suivante** (≤ 2,9 s), fondu d'une mesure. Dedans et dans la chambre froide, l'Exploration se tait ; de retour dehors, elle revient à un bloc après 8 s de calme |
| **3 Éteints ou plus** sur le joueur (saisie ou contact) | `moteur.signalerMenace('nombre')` | Le Danger, plus son stem « nombre » qui remplit la grille. Revenir à `'saisie'` le retire ; `'aucune'` : silence comme ailleurs |
| Butin rare trouvé (chambre froide, coffre) | `moteur.jouerSignal('butin')` | Signal au temps suivant |
| Le joueur repasse le portail, vivant | `moteur.jouerSignal('sortieCoop', 'maintenant')` | Signal, puis le jeu charge la carte suivante |

**Zones** (Book 23 §2.2) : `dehors` = cour et bascule, libre-service, quai, cour des silos ; `dedans` = atelier des tracteurs, hangar, bureaux ; `froid` = chambre froide. Une zone se décide **à la pièce où est le personnage** (le plan en données a ses pièces) ; changer de zone à chaque passage de porte est prévu (pas de va-et-vient audible : même tonique, même grille).

**Niveau de menace** : `nombre` se place au-dessus de `saisie` (`aucune` < `attire` < `poursuite` < `saisie` < `nombre`). Proposition : `nombre` dès que **3 Éteints ou plus** sont à moins de ≈ 2 m et ciblent le joueur, ou dès une saisie avec 2 autres Éteints à ce contact.

**Mémoire** : seul le stem de la zone en cours est décodé (et l'Exploration seulement dehors, « nombre » seulement quand il joue) ; un stem décodé tard est lancé à la bonne position dans le bloc. Mesuré sur ordinateur : voir §4.

**La radio à piles** (leurre du Book 23 §4.7) est un **son diégétique**, pas de la musique : la réclame de la Compagnie pour l'« engrais Watty », 20 s en boucle parfaite, mono, −19 LUFS. Manifeste : `diegetiques['radio-compagnie']` (`fichier`, `boucle: true`, `duree`). La jouer comme un effet, à sa place, avec la portée de signature du leurre :

```js
const d = manifeste.diegetiques['radio-compagnie'];
const buf = await ctx.decodeAudioData(await (await fetch('/assets/musique/jeu/' + d.fichier + '.opus')).arrayBuffer());   // .m4a en secours ; mobile/ en version mobile
const radio = moteur.jouerEffet(buf, { bus: 'environnement', priorite: 3, position: { x, y }, portee: /* signature du leurre */ 25, boucle: true, varier: false });
// piles vides ou radio éteinte : moteur.arreterEffet(radio, 0.3);
```

### 3 ter. Les kits de niveau (`musique/niveaux/`) : le Château

Des musiques de base **réutilisables** pour les niveaux d'un même type (château, villa, hôpital, industriel : `musique/niveaux/PROPOSITION.md`). Le premier livré : le **Château** (tonique do). Il se branche **exactement comme la Coopérative** :

```js
const moteur = new MoteurAudio(ctx, { bpm: 84, directeur: { lieu: 'chateau' } });
await moteur.chargerProduction('/assets/musique/', famille, progres, mobile /*, { matiere: 'abbaye' } plus tard */);
moteur.attribuer('fond', 'fond-chateau'); moteur.attribuer('vie', 'explo-chateau');
moteur.attribuer('tension', 'tension-chateau'); moteur.attribuer('danger', 'danger-chateau');
await moteur.demarrer();
```

| Dans le jeu | Appel |
|---|---|
| Changer de zone : `dehors` (cour, remparts), `dedans` (grande salle, salles), `profond` (crypte, souterrains) | `moteur.changerZone('dehors' \| 'dedans' \| 'profond')` |
| Menaces, « nombre » | comme partout (`signalerMenace`) |
| Signaux | `arriveeChateau` (automatique au démarrage), `jouerSignal('butinChateau')`, `jouerSignal('sortieChateau', 'maintenant')` |
| **L'horloge** qui sonne les heures (son diégétique, ≈ 14 s, une fois, **pas en boucle**) | `manifeste.diegetiques['horloge-chateau']` : à jouer en effet spatialisé (`jouerEffet`, bus `environnement`, portée de signature du leurre), à l'heure du jeu ou quand on touche au balancier. Les Éteints l'entendent |

**Les sons du lieu sont séparés de la musique** (règle du porteur, 2026-10-09). Dans chaque pièce, le stem `matiere` (et, pour le Fond, `m-dehors`, `m-dedans`, `m-profond`) porte la cloche, l'horloge, le vent, les chaînes, les gouttes. Le jeu n'a rien de spécial à faire : le moteur les règle comme les autres stems. Pour **personnaliser un niveau** (une abbaye au lieu d'un château fort), la session musique livrera une autre matière, choisie au chargement : `chargerProduction(…, { matiere: 'abbaye' })` (option déjà prête dans le moteur ; sans elle, la matière d'origine du kit).

**Version mobile** : la matière y est **prémixée** avec la musique de base (la mémoire du téléphone ne permet pas de garder les deux) ; elle reste séparée sur ordinateur et dans les masters. Une variante de matière (`{ matiere: … }`) aura donc aussi sa version mobile prémixée, que la session musique produira avec la variante.

**Mémoire (changement du 2026-10-09, tous lieux)** : le directeur ne fait plus décoder la **Tension** qu'à partir d'un Éteint attiré, ni le **Danger** qu'à partir d'une poursuite, et il libère la Vie pendant le Danger (elle y est muette). Une saisie sans prévenir lance quand même le Danger, calé dans le bloc, dès qu'il est décodé (le signal de saisie, lui, est toujours prêt). Rien à changer dans les appels. Mesuré en version mobile : château **64 Mo** au plus (au budget, pendant une poursuite), coopérative et terrain en dessous ; 20 tests du directeur.

**À recopier pour le Château** : `jeu/`, `mobile/`, les deux manifestes, **et le moteur et le directeur** (`moteur-couches.js`, `directeur.js` : lieu `chateau`, matière séparée, choix de la matière au chargement).

**Ne charger que le lieu en cours** (option ajoutée le 2026-10-09) : `chargerProduction(base, famille, progres, mobile, { pieces: ['fond-villa', 'explo-villa', 'tension-villa', 'danger-villa'] })`. Sans cette option, le moteur garde en mémoire les fichiers compressés de **tous** les lieux (≈ 19 Mo en mobile avec les quatre kits). Pour le terrain : `['fond-jour', 'fond-nuit', 'vie-jour', 'vie-jour-atelier', 'vie-nuit', 'tension', 'danger']` (la Vie de la famille est choisie toute seule).

### 3 quater. Les kits Villa, Hôpital, Industriel

Même branchement que le Château (§3 ter), avec leur `lieu` et leurs pièces :

| Kit | `lieu` | Pièces (`fond-`, `explo-`, `tension-`, `danger-`) | Zones : `dehors` / `dedans` / `profond` | Signaux | Son du lieu (`diegetiques`) |
|---|---|---|---|---|---|
| 🏰 Château | `chateau` | `…-chateau` | cour, remparts / grande salle / crypte | `arriveeChateau`, `butinChateau`, `sortieChateau` | `horloge-chateau` (une fois, ≈ 14 s) |
| 🏖️ Villa | `villa` | `…-villa` | jardin, piscine / salons / cave, bunker | `arriveeVilla`, `butinVilla`, `sortieVilla` | `enceinte-villa` (**en boucle**, 22,9 s : la domotique qui joue son lounge) |
| 🏥 Hôpital | `hopital` | `…-hopital` | hall d'accueil / couloirs, chambres / bloc opératoire, pharmacie | `arriveeHopital`, `butinHopital`, `sortieHopital` | `appel-hopital` (**en boucle**, 16 s : l'appel d'infirmière) |
| 🏭 Industriel | `industriel` | `…-industriel` | parking, quais / ateliers / salle des machines | `arriveeIndustriel`, `butinIndustriel`, `sortieIndustriel` | `sirene-industriel` (une fois, ≈ 13 s : la sirène de fin de poste, leurre puissant) |

Le manifeste dit pour chaque son du lieu s'il boucle (`diegetiques[nom].boucle`) : le passer à `jouerEffet(…, { boucle })`, et l'arrêter avec `arreterEffet` quand l'objet est éteint ou détruit.

Ces kits sont **génériques** : un kit sert à tous les niveaux de son type (château fort ou abbaye ; villa ou manoir du milliardaire ; hôpital ou clinique ; usine automobile ou chimique). Pour un niveau qui demande ses propres sons, demander une variante de matière à la session musique (§3 ter).

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
- **Mémoire** : les fichiers restent compressés en mémoire ; seuls le bloc en cours et le suivant sont décodés. `moteur.memoire()` donne la mémoire décodée en Mo. Coopérative (mesuré le 2026-10-08, scène complète : Exploration, trois zones, Tension, Danger avec « nombre », radio) : **120 Mo** au plus sur ordinateur, **55 Mo** sur mobile.
- **Onglet caché** : suspendre le contexte (`ctx.suspend()`) et le reprendre au retour (Book 21 §6.4.3) ; le moteur reprend où il en était.
- **Grille** : 84 BPM, blocs de 8 mesures (≈ 22,9 s) + 1 mesure de queue ; Comptoir à 96 BPM. Toutes les transitions tombent sur un temps, un temps fort, une mesure ou un bloc, selon la règle.
- **Niveaux** : chaque pièce est masterisée à −18 LUFS (Vie de nuit −20, Fond seul −26, signaux −19), crête ≤ −1,5 dBTP. Détail : `production/rapport-niveaux.md`.
- **Le banc d'essai** `musique/moteur/index.html` (serveur : `python3 musique/outils/serveur.py`, puis `http://127.0.0.1:8765/moteur/`) montre tout cela en marche, avec la case « Jouer les fichiers produits ».

- **Coopérative** : version mobile en prémix séparés (Fond : un fichier par zone ; Danger : `base` + `nombre`) ; le moteur les règle un à un, comme sur ordinateur. Poids à télécharger : ≈ 6,9 Mo en Opus sur ordinateur (radio comprise), ≈ 2,5 Mo sur mobile.

## 5. Reste à faire (côté musique)

- Les **effets sonores en fichiers** : Éteints définitifs (voix retravaillées), pas, outils, feu, ambiance.
- Le **test sur iPhone 13** : son au premier toucher, mémoire, aucun craquement sur 30 min.
- Les propositions de modification du Book 21 (débits, méthode mémoire, modes) : `musique/propositions.md`.

Crédits et licences : `musique/credits.md` (synthèse maison, échantillons VSCO 2 CE en CC0).
