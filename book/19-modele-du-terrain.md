# Book 19 — Le Modèle du Terrain

> Document de conception · version 0.1 · 2026-10-07
> Statut : **brouillon de travail**, issu d'un prototype d'éditeur.
> S'appuie sur le [Book 10](10-construction.md) (construction, isolation) et le [Book 01 §6 bis](01-les-trois-feux.md) (terrain du joueur).

---

## 1. La grille

| Élément | Règle |
|---|---|
| **Taille** | **50 × 50 m**, soit **2 500 cases de 1 m × 1 m** |
| **Cases** | On y pose des **objets** (meubles, installations, cultures) et on y trouve le **terrain naturel** |
| **Arêtes** | On y construit les **murs**, **portes**, **fenêtres** et **palissades** |
| **Nombre d'arêtes** | 51 × 50 horizontales + 50 × 51 verticales = **5 100 arêtes** |
| **Hauteur** | **Un seul niveau, au sol** : ni étage ni cave (décidé). Hauteur standard des murs : **2,5 m**. |
| **Relief** | **Terrain plat** (décidé), avec des éléments naturels (eau, arbres, rochers) et **éventuellement des ruines** déjà présentes |
| **Rendu** | **3D isométrique** (décidé, §7) |

> Mettre les murs **sur les arêtes** (et non sur des cases) est le choix des jeux de construction les plus lisibles : un mur ne « mange » pas de place, deux pièces voisines partagent le même mur, et une porte se pose exactement entre deux cases.

---

## 2. Les trois couches d'une case

| Couche | Contenu | Exemples |
|---|---|---|
| **1. Terrain naturel** | Ce qui était là au départ, selon la topologie choisie à la création (Book 01 §6 bis) | Herbe, terre, roche, eau (ruisseau, mare), arbre, chemin |
| **2. Sol aménagé** | Ce que le joueur a transformé | Planche de culture, sol battu, dallage, plancher |
| **3. Objet** | Ce qui est posé dessus, avec une **emprise** en cases | Lit (1 × 2), poêle (1 × 1), forge (2 × 2), établi (2 × 1), charbonnière (2 × 2), puits (1 × 1) |

**Règles de placement :**

- Un objet occupe toutes les cases de son emprise. Il peut être **pivoté**.
- On ne pose rien sur l'eau, un arbre ou un rocher. Il faut d'abord **abattre** l'arbre (bois) ou **casser** le rocher (pierre) : le terrain naturel est aussi une ressource.
- Une case de culture devient une **planche** avec son sol vivant (Book 11 §2).

---

### 2.1 Emprises des objets (validé)

Dimensions réalistes arrondies au mètre, en cases (largeur × profondeur). « + recul » indique un espace libre conseillé autour (travail, sécurité incendie), sans être bloquant.

| Catégorie | Objet | Emprise | Remarque |
|---|---|---|---|
| **Vie** | Lit, couchette | 1 × 2 | |
| | Table | 2 × 1 | |
| | Chaise, tabouret | 1 × 1 | Peut partager une case avec une table (non bloquant) |
| | Coffre | 1 × 1 | |
| | Étagère, armoire | 1 × 1 | Contre un mur |
| | Latrines | 1 × 1 | Loin du puits (hygiène, Book 05) |
| **Chaleur** | Feu de camp | 1 × 1 | + recul 1 case |
| | Poêle en fonte | 1 × 1 | Conduit à travers le toit |
| | Poêle de masse | 1 × 2 | |
| **Forge et fours (🔥)** | Foyer de forge à soufflet | 1 × 1 | + recul |
| | Forge ventilée | 2 × 2 | + recul |
| | Enclume (rail, bloc) | 1 × 1 | |
| | Creuset, four de fonderie | 1 × 1 | + recul |
| | Four à pain | 2 × 2 | |
| | Four à chaux, à poterie | 2 × 2 | + recul |
| | Charbonnière (meule) | **3 × 3** | Une meule de 100 kg de bois fait 2 à 3 m de diamètre. + recul |
| | Charbonnière en fût | 1 × 1 | |
| | Bas fourneau | 1 × 1 | + recul 3 × 3 pour travailler |
| | Alambic | 1 × 2 | |
| | Nitrière | 2 × 2 | |
| **Électricité (⚡)** | Panneau solaire (≈ 100 W) | 1 × 1 | Plusieurs panneaux côte à côte |
| | Petite éolienne (mât) | 1 × 1 | Haubans : + recul |
| | Banc de batteries, recharge | 1 × 1 | À l'abri |
| | Poste de soudure | 1 × 1 | |
| | Établi électrique | 2 × 1 | |
| **Mécanique (⚙️)** | Établi | 2 × 1 | |
| | Pédalier universel | 1 × 2 | |
| | Tour à perche | 1 × 3 | La perche flexible est longue |
| | Meule à bras | 1 × 1 | |
| | Roue hydraulique | 2 × 3 | **Sur une rive** : une partie dans l'eau |
| | Pompe à main | 1 × 1 | Sur un puits ou une source |
| **Eau et réserves** | Puits | 2 × 2 | Margelle comprise |
| | Fût de récupération | 1 × 1 | Sous une gouttière |
| | Cellier enterré | 2 × 3 | Butte de terre avec entrée |
| | Séchoir à bois | 2 × 3 | Abri ouvert |
| **Potager et élevage** | Planche de culture | 1 × 1 par case | Se trace case par case |
| | Compost | 1 × 2 | Deux bacs : un qui mûrit, un qu'on remplit |
| | Couche chaude | 1 × 2 | Châssis vitré |
| | Serre tunnel | 3 × 6 | |
| | Ruche | 1 × 1 | + recul |
| | Poulailler | 2 × 2 | Avec un enclos à palissade |
| | Clapier | 1 × 2 | |
| | Abri à chèvres ou moutons | 2 × 3 | Avec un enclos |
| | Fosses de tannage | 2 × 2 | Loin de la maison (odeur, Book 06) |
| **Soins** | Lit d'infirmerie | 1 × 2 | Dans une pièce propre (Book 05 §8.4) |

## 2 bis. Les ruines sur le terrain

Certains terrains tirés à la création (Book 01 §6 bis) contiennent des **ruines** : murs de pierre écroulés, dalle, fondations, épave.

| Règle | Détail |
|---|---|
| **Murs en ruine** | Posés sur des arêtes, de hauteur variable, **incomplets** : ils ne forment pas de pièce tant qu'ils ne sont pas réparés |
| **Réparer** | Compléter et rehausser un mur en ruine coûte bien moins cher que bâtir à neuf : un bon départ pour une maison de pierre (Book 10) |
| **Démanteler** | Ou les démonter : c'est une **carrière de pierre** sur place |
| **Fouille** | Gravats et vestiges à fouiller (Book 02 §5) |

> Une ruine est un atout du tirage de terrain, au même titre qu'un ruisseau ou un vieux verger.

## 3. Les arêtes

| Type | Rôle | Forme une pièce ? |
|---|---|---|
| **Mur** (rondins, torchis, paille, pierre, béton, tôle…) | Construction, isolation (Book 10 §3) | **Oui** |
| **Porte** | Passage, se ferme | **Oui** (fermée) |
| **Fenêtre** | Lumière, pertes de chaleur | **Oui** |
| **Palissade, clôture** | Enclos, défense contre les zombies (Book 06 §9) | **Non** (pas de toit, pas d'isolation) |

- Un mur a un **matériau**, éventuellement en **couches** (porteur + isolant + enduit, Book 10 §1).
- Une arête ne porte qu'un seul élément à la fois.
- Les arêtes du **bord du terrain** accueillent la **défense du périmètre** (palissade, portail).

---

## 4. Les pièces

### 4.1 Détection automatique

Le jeu **détecte tout seul les pièces fermées** :

1. On part de l'extérieur du terrain et on se répand de case en case, sans traverser les murs, portes ou fenêtres.
2. Toute case que l'on n'atteint pas est **enfermée**.
3. Les cases enfermées qui communiquent entre elles forment **une pièce**.

> Une palissade ne ferme pas de pièce : un enclos à poules reste « dehors ».

### 4.2 Ce que le jeu calcule pour chaque pièce

| Calcul | Méthode |
|---|---|
| **Surface** | Nombre de cases |
| **Toit** | Posé automatiquement sur toute pièce fermée (matériau au choix : chaume, bardeaux, tôle…, Book 10 §3.1) |
| **Pertes de chaleur** | Somme sur les **arêtes qui donnent dehors** (1 m × 2,5 m chacune) de U × surface, + toit + renouvellement d'air (Book 10 §2.1). Les murs **partagés entre deux pièces** ne comptent pas. |
| **Besoin de chauffage** | En kWh par jour d'hiver, puis en kg de bois selon le poêle |
| **Fonction** | Déduite des objets (lit → chambre ; établi ou forge → atelier ; lit + infirmerie → infirmerie…), avec ses bonus (Book 10 §7.1) |
| **Atténuation du bruit** | Un atelier fermé de murs épais réduit la signature sonore de ce qui s'y fait (Book 10 §7.1) |

### 4.3 Exemple du prototype

Cabane en rondins de 8 × 6 m, coupée en deux pièces par un mur intérieur avec une porte :

| Pièce | Surface | Ouvertures | Chauffage d'hiver (poêle à 60 %) |
|---|---|---|---|
| Chambre (lit, poêle, coffre) | 24 m² | 1 porte, 1 fenêtre | ≈ 27 kWh/jour, ≈ 10 kg de bois/jour |
| Atelier (établi, coffre) | 24 m² | 1 fenêtre | Non chauffée |

> Le prototype montre tout de suite l'intérêt d'une **petite pièce chauffée** : 24 m² en rondins avec porte et fenêtre coûtent environ deux fois plus de bois que la pièce standard de 12 m² du Book 10. Cela pousse à construire petit et bien isolé, ce qui est réaliste.

---

## 5. L'organisation type d'un terrain

L'exemple du prototype montre une organisation de départ crédible :

| Zone | Contenu | Remarque |
|---|---|---|
| **Maison** | Chambre + atelier | Au centre, loin des bords |
| **Forge, charbonnière** | En plein air, à l'écart de la maison | Fumée et risque d'incendie (Book 10) |
| **Énergie** | Panneau solaire, éolienne, roue hydraulique près du ruisseau | Selon la topologie |
| **Eau** | Puits, ruisseau, fûts sous les gouttières | Book 11 §5 |
| **Potager** | Planches de 2 m de large séparées par des allées | Pour ne pas tasser le sol (Book 11 §2) |
| **Élevage** | Enclos à palissade, poulailler | Book 11 §9 |
| **Compost** | Près du potager | Book 11 §2.2 |
| **Périmètre** | Palissade sur le bord du terrain, portail | Défense contre les Éteints (Book 06 §9) |

---

## 6. Données (pour le développement)

Le terrain se stocke de façon très compacte :

```json
{
  "taille": 50,
  "terrain": "… 2 500 valeurs (herbe, eau, arbre, roche, chemin, culture) …",
  "aretes_h": "… 2 550 valeurs (vide, ou type + matériau) …",
  "aretes_v": "… 2 550 valeurs …",
  "objets": [
    { "type": "lit", "x": 18, "y": 18, "pivote": false },
    { "type": "forge", "x": 28, "y": 19, "pivote": false }
  ]
}
```

- Quelques kilo-octets par terrain : **aucun problème pour le Raspberry Pi** (Book 17).
- La détection des pièces est un simple **remplissage de proche en proche** sur 2 500 cases : instantané, recalculé à chaque modification.

---

## 7. La vue du jeu : 3D isométrique (décidé)

- Le jeu est rendu en **vraie 3D**, avec une **caméra orthographique en angle isométrique**, comme *Last Day on Earth*. La grille sert au **placement** et à la **simulation** ; elle ne s'affiche qu'en mode Construction (Book 08 §3).
- **Rotation de la caméra par quarts de tour**, zoom et déplacement.
- Les murs sont des volumes de 2,5 m sur les arêtes ; portes et fenêtres sont découpées dans le mur.
- **Toits posés automatiquement** sur les bâtiments (pièces voisines regroupées), à deux pans selon la plus grande longueur. Ils **s'effacent automatiquement** quand le joueur entre (validé).
- **La 3D sert directement la mécanique de la lumière** (Book 18 §2) : de nuit, les vraies sources de lumière (feu, poêle, forge, fenêtres, lampes) éclairent et projettent des ombres, et elles se voient de loin.

---

## 8. Questions ouvertes

- [x] **Étages et caves :** ✅ **ni l'un ni l'autre.** Le cellier de conservation devient une **installation** posée au sol (§2), pas un niveau.
- [ ] **Murs en diagonale :** non (proposition), pour garder la grille simple.
- [x] **Relief :** ✅ terrain plat, avec éléments naturels et éventuellement des ruines (§2 bis).
- [ ] **Taille maximale d'une pièce** sans poteau ni mur porteur (portée de la charpente, Book 10) ?
- [x] **Emprises :** ✅ validées (§2.1).
