# Demande à la session « bâtiments » : les retouches des quatre lieux du niveau 2, après les essais de la 0.10

> De la session du jeu, le 2026-10-15. Source : [`plan-0.10.md`](plan-0.10.md) (§13, V2-04, V2-14, V4-01 à V4-17), les essais du porteur sur son iPhone, et la revue `.claude-travail/revue-r52/` (images à l'appui).
> **Le jeu a posé lui-même, en attendant, une partie de ce qui suit** (un muret, des ganivelles, des routes prolongées, des panneaux et leurs lanternes…) : quand le modèle les aura, le jeu retirera ses retouches. Le nom du module du jeu qui fait la retouche est donné entre parenthèses.
> **Une règle nouvelle, à appliquer partout désormais** : **R52, « un lieu ne s'arrête jamais net »** (`notice-nouveau-niveau.md`) : chaque bord a un obstacle visible et crédible, le décor se prolonge un peu au-delà, une sortie se montre (un chemin dessiné qui continue, un panneau lisible de nuit comme de jour). Elle complète T5 de la demande du 2026-10-14.

---

## 0. Pour les quatre lieux

| # | Demande | Pourquoi |
|---|---|---|
| R0-1 | **Les panneaux de sortie** : plus grands, tournés vers la caméra par défaut, **une lanterne au-dessus** qui luit la nuit (décision du porteur), et **la vraie destination peinte** (voir les textes ci-dessous) | Illisibles à 375 px de large, invisibles la nuit ; certains disent « Comptoir du Port » ou « Port de pêche » alors que la sortie mène ailleurs (jeu : `lanterne-panneau.ts`, écriteaux « Lire » E-04, E-12 à E-17) |
| R0-2 | **Le décor au-delà du lot** : prolonger le sol, la côte, la falaise, les routes de 30 à 60 m autour, en une version légère | Vu de près comme dans la vue d'ensemble de l'arrivée, le lot ressemblait à un tapis posé sur le ciel (jeu : `decor-cote.ts`, `bords-*.ts`, `phare-bords.ts`) |
| R0-3 | **La mer** : une seule matière pour la mer du lot et celle des alentours ; l'eau **peu profonde** (où l'on marche, jusqu'aux genoux) plus claire, l'eau **profonde** plus sombre avec une ligne de brisants | Le jeu fait marcher le joueur dans une bande d'eau peu profonde au phare et à l'hôtel (V4-13, V4-15) |

Les textes des panneaux de sortie (validés par le porteur) :

| Lieu | Sortie | Texte |
|---|---|---|
| Route du pont | ouest | ← Ton terrain · 3 km · Grand Hôtel des Flots, par le pont → |
| Route du pont | est | Grand Hôtel des Flots · 2 km → · ← Le pont, ton terrain |
| Corniche | ouest | ← Ton terrain · 3 km · Phare du cap, par le tunnel → |
| Corniche | est | Phare du cap · 2 km → · ← La corniche, ton terrain |
| Grand Hôtel | est (vers le pont) | Route du pont → · Ton terrain, par le pont · 5 km |
| Phare | nord (arrivée) | ← La corniche · Ton terrain |
| Phare | grève, à l'ouest | Sentier côtier · ← Port · 6 km |

---

## 1. Le phare (`phare`)

| # | Demande | Ce que le jeu fait en attendant |
|---|---|---|
| P-1 | **Un muret de pierres sèches** sur les bords nord, ouest et est du plateau (la lande), la route d'arrivée restant ouverte | `phare-cloture.ts` |
| P-2 | **Le sentier côtier**, à l'ouest de la grève : de la terre battue bordée de pierres et de bornes blanc et rouge, au pied de la falaise jusqu'à la sortie, puis hors du lot une banquette au ras de l'eau et des marches taillées dans la falaise ; **le panneau près de l'eau**, au départ du sentier, à trois pas du bas de la rampe | `phare-bords.ts` (le panneau du modèle est sur le plateau : une copie est posée sur les galets) |
| P-3 | **Un éboulis de gros rochers** qui ferme le bout est de la grève jusque dans l'eau ; des rochers au sud de la sortie ouest | `phare-bords.ts` (`EBOULIS_EST`, `ROCHERS_OUEST`) |
| P-4 | **La falaise de la pointe prolongée à l'est** (elle s'arrête net en x ≈ 30) ; **la route d'arrivée qui continue au nord** dans la lande | chantier R52 |
| P-5 | **Le pavois ouvert à l'échelle de coupée** (un rebord donne l'impression qu'on ne peut pas redescendre) ; l'échelle de coupée un peu plus large et moins en biais (on s'y coince) | `ouvrirLaCoupee` (le rendu abaisse le pavois) |
| P-6 | **Les garde-corps à câble de la partie basse de la rampe** (poteaux à z 20 et 21,8) retirés là où l'on sort désormais sur le côté | les bords de la rampe raccourcis à z 20,1 |
| P-7 | **Les toits et parois des conteneurs** dans une couche à part, pour un vrai fondu quand on entre (aujourd'hui ils disparaissent d'un coup) | le jeu cache le toit et les parois |
| P-8 | **La barque et les bouées** qui encombrent le départ du sentier : les déplacer | — |
| P-9 | **Le cargo en marche** (pour la scène de l'échouage) : reprendre à votre niveau de soin le cargo de la maquette (`.claude-travail/maquettes/cargo/cargo.js` : coque, château, conteneurs « Abondance Express », feux, projecteur ; nom « Prime Abondance », « Livraison du Jour » sur le flanc), dans le même repère que `epave_apres` | le jeu joue la scène avec le cargo de la maquette |
| P-10 | **Le budget** : le décor du phare est à **40 appels de dessin avec l'épave** et ≈ 59 300 triangles sur 60 000 ; ce qui est ajouté devra se fondre dans l'existant | — |

## 2. La route du pont (`halte-route-pont`)

| # | Demande | Ce que le jeu fait en attendant |
|---|---|---|
| H-1 | **La caisse du péage devant la porte** (côté terrain : aujourd'hui elle est derrière, on paie contre la porte) | décision du porteur V2-04 ; paiement aussi contre la porte |
| H-2 | **Une ganivelle de châtaignier et des dunes** aux bouts ouest et est (x ≈ 0 et 200) et au sud des terre-pleins (z ≈ 69,5), la route restant ouverte ; la ganivelle du nord prolongée au-delà des bouts ; des dunes et des oyats sur les alentours | `bords-pont.ts` |
| H-3 | **La réserve des guetteurs** inaccessible (passage de 0,6 m entre le pied du pylône et la cabane) | — |
| H-4 | **L'eau du pont** pas fermée partout ; le bord du quai coupe la tête du pont à x = ± 50 | le jeu ferme l'eau et ouvre la tête du pont |

## 3. La corniche (`halte-corniche`)

| # | Demande | Ce que le jeu fait en attendant |
|---|---|---|
| C-1 | **La route prolongée aux deux bouts** (asphalte, muret côté mer, paroi côté montagne) jusqu'à ce qu'elle tourne derrière la roche : à l'ouest elle s'arrêtait sur le vide, à l'est sur un gros bloc lisse | `bords-corniche.ts` (le relief prolongé de 60 m, un éperon) |
| C-2 | **Une vraie roche** à la place des quatre blocs lisses des alentours | retirés par le jeu |
| C-3 | **Le grand pin parasol du belvédère** cache en partie la barricade du tunnel à l'écran | — |

## 4. Le Grand Hôtel (`grand-hotel`)

| # | Demande | Ce que le jeu fait en attendant |
|---|---|---|
| G-1 | **La promenade prolongée de 30 à 40 m vers l'est** (dalles, bordure, balustrade), puis le sable qui la recouvre ; **un panneau de sortie** (il n'y en avait pas) | `bords-hotel.ts` |
| G-2 | **Une ganivelle en travers à l'ouest de la promenade** (on y bute encore sur une limite invisible) ; les ganivelles prolongées ; des dunes et des oyats | prévue à la recette de la 0.10 |
| G-3 | **La bande d'eau claire** au sud (on y marche jusqu'aux genoux), puis l'eau profonde | `bords-hotel.ts` |
| G-4 | **La rue au nord** : des façades ou un mur | — |

## 5. Les haltes du niveau 1

| # | Demande | Ce que le jeu fait en attendant |
|---|---|---|
| N-1 | **La station** : un décor autour (le sous-bois, la route qui continue) ; dans la vue d'ensemble, elle flottait sur le ciel | `bords-station.ts` |
| N-2 | **Le gué** : ses alentours s'arrêtent sur le ciel dans la vue d'ensemble | prévu à la recette de la 0.10 |
