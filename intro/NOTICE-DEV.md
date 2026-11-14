# Écrans d'accueil — notice d'intégration

> Pour la session de code du jeu. Rédigée le 2026-10-09 par la session « intro ».
> **Décision du porteur** : le jeu intègre **les trois écrans d'accueil**, **pas la cinématique** (elle reste une vidéo de présentation).

## 1. Ce que c'est

Trois écrans, montrés **une seule fois, juste après la création du personnage**, avant le chargement du terrain. Le joueur clique sur « Suivant », « Suivant », puis « Entrer dans le monde ».

Chaque écran est un **tableau 3D vivant**, rendu en temps réel avec les personnages et les objets du jeu. Par-dessus, on trouve un titre, un court texte, une note au feutre et des étiquettes accrochées aux objets, qui suivent la caméra.

| N° | Titre | Scène | Message |
|---|---|---|---|
| 1 | Ton terrain | Le campement du joueur au crépuscule : sa famille, son apparence, le feu, l'abri, l'installation de sa famille. Deux Éteints sont à la lisière. | Chez toi, tu bâtis comme tu veux. Aucun joueur ne peut t'y attaquer. Seuls quelques Éteints viennent, attirés par le bruit ou la lumière. |
| 2 | Les lieux lointains | Le Grand Hôtel des Flots à l'heure dorée (le modèle de `batiment/grand-hotel/`). | Des expéditions pour récupérer des ressources. Plus c'est riche, plus c'est loin et dangereux. Certains lieux sont multijoueurs, d'autres non. |
| 3 | Le Comptoir | Le Comptoir du Carrefour du jeu, avec des joueurs qui troquent et une leçon entre deux familles. | Terrain neutre : commerce, troc, apprendre et enseigner. |

Autres caractéristiques :

- **Pas de son.** La musique reste celle du jeu.
- **Sans WebGL**, ou en cas d'erreur, on montre à la place la fiche d'accueil des Compteurs en HTML (`src/fiche.js`). Le joueur n'est jamais bloqué.

## 2. Le brancher

### a) Servir le dossier

Servir `intro/` tel quel, par exemple sous `/intro/`. Ce qu'il faut servir :

| Chemin | Rôle |
|---|---|
| `src/` et `src3d/` | Le code (modules ES, sans compilation) |
| `vendor/rendu-jeu.js` | Le rendu du jeu et three.js, empaquetés (1,4 Mo) |
| `assets/kenney/` | Les objets du Survival Kit de Kenney (1,4 Mo, CC0) |

Ce qu'on peut **ne pas servir** : `video/`, `maquettes/`, `outils/`, `.travail/`, `assets/musique/`, `assets/personnages/`.

- `assets/musique/` ne sert qu'à la cinématique.
- `assets/personnages/` contient les personnages HD de la cinématique. Dans le jeu, l'accueil charge les personnages **du jeu**, depuis `/assets/personnages/`, comme le jeu lui-même.

### b) L'appeler

À la fin d'une **création** de personnage réussie, avant de charger le terrain :

```ts
// @ts-ignore : module JS servi tel quel
import { jouerAccueil } from "/intro/src/intro.js";

await jouerAccueil(document.body, {
  famille,             // 'charbonniers' | 'voltaiques' | 'mecanistes'
  apparence,           // l'apparence choisie à la création (commun/src/apparence.ts) : l'écran 1 montre CE personnage
  base: "/intro/",     // l'adresse du dossier servi
});
// la promesse se résout au clic sur « Entrer dans le monde » : on charge le terrain
```

Dans `code/client/src/accueil.ts` :

- l'inscription (`/api/inscription`) résout aujourd'hui `{ jeton, pseudo, famille }` ;
- il faut y ajouter **`nouveau: mode === "creation"`** et **`apparence`** ;
- l'appelant ne lance alors `jouerAccueil` que si `nouveau` est vrai. Une simple connexion ne le montre pas.

### c) Options

| Option | Valeur par défaut | Effet |
|---|---|---|
| `famille` | `'charbonniers'` | La famille du personnage de l'écran 1 et de son installation (forge, panneau solaire et banc, ou pédalier) |
| `apparence` | celle de référence de la famille | L'apparence du personnage de l'écran 1 |
| `base` | `'./'` | L'adresse du dossier `intro/` servi (feuille de style, objets Kenney) |
| `qualite` | `'basse'` sur écran tactile, `'haute'` sinon | En haute qualité : occlusion ambiante, anticrénelage ×4, profondeur de champ, résolution ×2 |
| `sansCss` | `false` | `true` si le jeu charge lui-même `src/intro.css` |
| `page` | `1` | Ouvre directement l'écran 2 ou 3 (mise au point) |

## 3. Le déroulé

1. **L'écran de chargement** : une batterie qui se remplit et un conseil des Compteurs. Pendant ce temps, on charge les personnages et les objets, puis on **construit et compile les trois scènes d'avance**, pour qu'aucun à-coup ne survienne au changement d'écran.
2. **Les trois écrans.** Chaque changement passe par un fondu au noir de 0,6 s. Le titre et le texte montent, puis les étiquettes apparaissent l'une après l'autre.
3. Au dernier clic, tout est détruit : le contexte WebGL, les écouteurs et le DOM. La promesse se résout.

**Sur un petit écran**, quand l'image pleine taille ferait moins de 380 px de haut, le texte et le bouton sortent de l'image, et les étiquettes perdent leur phrase :

- **téléphone tenu droit** : le texte passe **sous** l'image ;
- **écran bas et large** (téléphone couché, 812 × 320) : l'image est à gauche, entière, et le texte à droite.

**Accessibilité** :

- le calque a `role="dialog"` et `aria-modal`, et le titre lui sert d'étiquette ;
- le bouton reçoit le focus, et Entrée le déclenche ;
- `prefers-reduced-motion` coupe les animations du texte.

## 4. Les modifier

| Quoi | Où |
|---|---|
| Titres, textes, notes au feutre, étiquettes (et l'objet auquel chacune est accrochée) | `src3d/ecrans.js`, tableau `ECRANS` |
| Les scènes : décor, personnages, lumière, caméra, points d'accroche (`reperes`) | `src3d/accueil.js` |
| La mise en page | `src/intro.css`, section « Les écrans d'accueil ». Tout est dessiné pour un cadre de 1600 px de large : la variable `--u` donne l'échelle. |
| La fiche de secours (sans WebGL) | `src/fiche.js` |

**Mise au point**, avec l'entrée « intro » de `.claude/launch.json` (port 8791) :

- `index.html?accueil` : les trois écrans, comme dans le jeu ;
- `&page=2` : ouvre directement le 2ᵉ écran ;
- `&famille=mecanistes` : change de famille ;
- `labo.html?m=accueil&t=10` : une scène en image figée, sans calque. Utiliser `t=1010` pour l'hôtel et `t=2010` pour le Comptoir.

Photos sans fenêtre : `node intro/outils/photo.mjs ecran.jpg "/index.html?accueil&page=1"`. Ajouter `--taille 390x844` pour le format téléphone. Les images vont dans `intro/.travail/`.

## 5. Dépendances, et ce qu'il faut savoir

- **`vendor/rendu-jeu.js` est une copie empaquetée** du rendu du jeu (`code/client/src/rendu/*`), de three.js 0.186 et du Grand Hôtel (`batiment/grand-hotel/`). **Il faut la refaire quand l'un d'eux change** : `sh intro/outils/empaqueter.sh` (rolldown, pris dans `code/node_modules`).
- **Intégration plus fine, si on veut gagner du poids** : le jeu a déjà three.js et ses modules de rendu. On peut faire importer `src3d/*.js` directement depuis `code/client/src/rendu/*` et `batiment/` au lieu de `vendor/rendu-jeu.js`, via un alias dans la configuration du jeu. On économise ainsi environ 600 Ko de three.js en double.
- **Un second contexte WebGL** est créé pour l'accueil, puis détruit à la fin. L'accueil passe avant le chargement du terrain : le rendu du jeu ne tourne pas encore à ce moment-là.
- **Le Grand Hôtel dépend de `batiment/`**, dont la livraison est **encore « à valider »** par le porteur. Si son modèle change, refaire le paquet et revérifier le cadrage de l'écran 2 (`lieux` dans `accueil.js`).
- **Le cache.** Pendant la mise au point, le petit serveur Python ne gère pas le cache : `index.html` et `labo.html` forcent le rechargement de chaque module. En production, servir avec des en-têtes de cache normaux, ou versionner les URL.
- Le chargement ne reste jamais bloqué : toute erreur (WebGL absent, modèle introuvable…) mène à la fiche de secours.
- `src/intro.js` exporte aussi `jouerIntro` (la cinématique, puis ces écrans). **Le jeu ne doit pas l'utiliser** : c'est la démonstration et l'export vidéo.

## 6. À vérifier avant la mise en ligne

- **iPhone 13**, en qualité basse : la fluidité de l'écran 2 (le Grand Hôtel fait environ 50 000 triangles) et la mémoire, puisque les trois scènes sont construites d'avance.
- Le texte sous l'image, sur un téléphone tenu droit, et la lisibilité des étiquettes.
- La première connexion **sans** création de personnage : l'accueil ne doit pas apparaître.

## 7. Historique des livraisons

**0.8.2 (2026-10-13)**, en réponse à `.claude-travail/propositions/demande-intro-0.8.2.md` :

1. **`vendor/rendu-jeu.js` refait** depuis le code du jeu à jour. Le personnage de l'écran 1 prend la couleur de cheveux personnalisée (`teinteCheveux`) : vérifié avec `#22cc44`.
2. **L'accueil seul ne charge plus `animations_intro_1.glb` ni `_2.glb`** : `jouerAccueil` appelle `pret({ gestes: false })`. Plus de 404 : il ne demande que les personnages et les animations du jeu.
3. **Écran bas et large** : la mise en page côte à côte est maintenant dans l'intro (classe `wi-cote` posée par `src3d/ecrans.js`, règles dans `src/intro.css`). **La règle provisoire du jeu (`client/src/style.css`, bloc « Les trois écrans d'accueil en paysage sur téléphone ») peut être retirée.** Testé en 812 × 320, 390 × 844 et 1600 × 900.

Relancer ensuite `npm run accueil:importer`.

## 8. Licences

| Élément | Licence |
|---|---|
| Personnages et animations (Quaternius) | CC0 |
| Objets du Survival Kit (Kenney) | CC0, licence jointe dans `assets/kenney/LICENCE-Kenney.txt` |
| three.js | MIT |

Le reste est du code du projet.
