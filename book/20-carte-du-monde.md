# Book 20 — La Carte du Monde

> Document de conception · version 0.2 · 2026-10-07
> Statut : **validé** dans le principe (disposition, lieux, géographie de référence, §1 ter). Le dessin final reste à confier à un illustrateur (§1 bis).
> S'appuie sur le [Book 01 §2 bis](01-les-trois-feux.md) (structure du monde, haltes, flux et stocks) et le [Book 07 §4](07-economie.md) (comptoirs).

---

## 1. Principe

- La carte est un **écran de navigation** : on y choisit une destination (Book 01 §2 bis).
- **Le terrain du joueur est au centre**, et **tous les joueurs voient la même disposition** : les distances sont équitables.
- Elle est découpée en **six environnements** (secteurs) et **trois anneaux de distance**. Chaque environnement couvre un ensemble de ressources, pour qu'aucune ne manque au monde.
- Six **routes principales** partent du centre, une par environnement, avec leurs **haltes**.

| Anneau | Distance indicative | Ce qu'on y trouve |
|---|---|---|
| **Proche** | ≈ 2 à 5 km | Ruines modestes qui se régénèrent, lieux de flux. Toujours viables pour un nouveau joueur. |
| **Moyen** | ≈ 5 à 15 km | Lieux riches, comptoirs régionaux, hameaux des familles |
| **Lointain** | ≈ 15 à 30 km | Grands stocks finis, dangereux (Book 01 §2 bis), Grand Comptoir, lieux spéciaux |

---

## 1 bis. Le rendu de la carte (décidé)

Les prototypes ont validé **l'organisation** (six environnements, trois distances), mais pas leur **dessin** : le découpage « en camembert » est une **logique de conception**, pas une image.

| Règle | Détail |
|---|---|
| **Pas de secteurs visibles** | Les environnements se fondent les uns dans les autres avec des **frontières naturelles** : côte, rivière, lisière de forêt, relief, périphérie de la ville |
| **Pas d'anneaux visibles** | La distance se lit **en temps et en effort** sur l'itinéraire (durée, calories, nombre de haltes), pas en cercles |
| **Une vraie illustration** | Carte dessinée à la main, façon **vieil atlas régional annoté par les survivants** : routes coupées barrées, notes au crayon, tampons des Compteurs |
| **Niveau de qualité** | Bien supérieur aux prototypes, qui ne servent qu'à valider l'organisation. À confier à un illustrateur ou une illustratrice. |

**L'écran de la carte (avis de Sally, 2026-10-08).** La fiche du lieu choisi est la **marge de légende** de la feuille, comme dans un atlas : même papier, séparée du dessin par un double filet d'encre.
- **Placement** : elle est à droite sur ordinateur et en téléphone horizontal, sous le dessin en téléphone vertical. Elle ne recouvre jamais le pion, le lieu choisi ni la route.
- **Composition** : un en-tête (le nom et ✕), un corps qui défile, et un pied fixe avec **Partir**, ou l'état du lieu à sa place. Le bouton Partir ne passe donc jamais sous le bord de l'écran.
- **Fermeture** :
  - un clic sur le fond sombre (le geste doit commencer et finir sur le fond) ;
  - Échap ;
  - M ;
  - le bouton ✕.
- **Pendant un voyage** : la carte reste ouverte. Un trait d'encre sous le nom du lieu se remplit à mesure que le trajet avance.

### 1 ter. La géographie de référence (validée sur prototype)

Le prototype « atlas annoté » fixe la **géographie** de la région. Les secteurs du §2 restent la logique de conception ; voici comment ils prennent place sur le terrain :

| Zone | Où | Ce qui la dessine |
|---|---|---|
| **Les Monts** | Nord | Sommets enneigés à la plume, mine, refuge |
| **Lac du Barrage** | Nord, au centre des Monts | Lac de retenue et barrage : siège du **Grand Comptoir** |
| **Forêt de la Combe** | Pentes des Monts, jusqu'aux abords du terrain | Forêt dense, carrière, scierie, hameau des Charbonniers |
| **La rivière** | Du barrage à la mer, en contournant le terrain par l'ouest | Fil conducteur de la carte ; ponts et gué sont des haltes naturelles |
| **La Campagne** | Ouest | Champs bordés de haies, village, coopérative, haras ; **manoir du milliardaire** sur une colline boisée |
| **Les Marais** | Sud-ouest, à l'embouchure | Roseaux, mares, station d'épuration, écluse |
| **La Ville** | Nord-est | Tissu de rues, plus dense au centre : hôpital, médiathèque, gare, siège de la Compagnie |
| **Zone industrielle** | Est | Entrepôts, cheminées, ferme solaire, usines ; **autoroute** vers l'est |
| **Voie ferrée** | De la gare au port | Relie la ville, la zone industrielle et la côte |
| **Côte des Flots** | Sud | Plage, camping, station balnéaire, cap et phare, port, épave du cargo sur les rochers |
| **La Mer** | Sud | Limite naturelle de la carte |

**Les éléments de l'atlas annoté :**

| Élément | Exemples | Rôle |
|---|---|---|
| **Annotations au crayon** | « NON. » entouré autour de l'hôpital, « champignons ici », « sel ! », itinéraire en pointillés « 1re sortie » | Raconter l'expérience des survivants ; donner des indices sans texte d'explication |
| **Routes coupées** | Pont effondré barré d'une croix rouge | Montrer les chemins impossibles |
| **Tampons** | « Compteurs · vérifié » près des comptoirs | Présence des Compteurs (Book 15) |
| **Objet d'époque** | Rose des vents, échelle en kilomètres, cartouche « Carte de la région, établie avant la Grande Panne » | La carte est un vestige de l'Âge de l'Abondance |
| **Usure** | Plis du papier, tache, bords assombris | Une carte qui a beaucoup servi |
| **Distances** | Pas de cercles : la fiche d'un lieu donne la **distance** et le **nombre de haltes** sur le trajet | Book 01 §2 bis |

> **Piste :** les annotations pourraient devenir **personnelles**. Chaque joueur ajoute ses propres notes au crayon sur sa carte (ses coins de cueillette, ses dangers), et peut les partager avec ses amis.

### 1 quater. La route de la Campagne en 0a (0.7.3)

La carte du jeu n'ouvre encore que quatre lieux, reliés par des tronçons (`commun/src/lieux.ts`, `TRONCONS`) :

| Tronçon | Distance | Sur la carte |
|---|---|---|
| Ton terrain – station-service | 3 km | La route, par le pont |
| Station-service – Comptoir du Carrefour | 2 km | La route, vers l'ouest |
| Station-service – Coopérative du Plateau | 2 km | **Chemin de terre** vers le nord-ouest (0.7.3) |
| Comptoir du Carrefour – Coopérative du Plateau | 3 km | Chemin agricole, au nord du Carrefour |

- **La Coopérative est derrière la station, comme le Comptoir** (0.7.3, demande du porteur du projet) : on ne passe plus par le Carrefour pour y aller. Le chemin agricole du Carrefour reste, comme un deuxième accès.
- **L'étape** : on s'arrête à chaque lieu du plus court chemin. Du terrain au Carrefour ou à la Coopérative, il faut traverser la station à pied. La fiche du lieu donne la distance, les calories et l'eau de **l'étape**.
- **Le pion** suit le tracé du tronçon pris : la route, ou l'un des deux chemins de terre.

### 1 quater bis. Les deux routes du niveau 1 (0.8, 2026-10-10)

*Plan 0.8 §1.1, B16, Q-0.8-25 et §9.2 ; **codé en 0.8** (chantier 4, `commun/src/lieux.ts`, `client/src/carte.ts`).*

La 0.8 porte le **niveau 1** sur **deux routes**, qui passent la rivière chacune à sa façon. Chaque route a une **halte** (H1, partagée) puis un **lieu personnel** (L1, un par joueur). Le contenu du jeu (clés, quêtes, indices) cite **l'étape** (H1A, H1B, L1A, L1B) ; l'affichage met **le nom du lieu** (table `ETAPES_LIEUX`).

| Étape | Lieu | Route | Distance | La promesse (fiche de la carte) |
|---|---|---|---|---|
| **H1A** | La station-service | A, par **le pont** | 3 km du terrain | « La station : le bois, le métal, et la pièce de ta famille. » |
| **L1A** | La Coopérative du Plateau | A, chemin de terre derrière la station | 2 km de la station (5 km du terrain) | « La Coopérative : le feu et l'eau. » |
| **H1B** | **Le Gué-aux-Saules** | B, **à gué**, en aval du pont | 3 km du terrain | « Le gué : la pierre, la glaise et la rive. » |
| **L1B** | **Le Moulin du Gué** | B, le long de la rive ouest | 2 km du gué (5 km du terrain) | « Le Moulin : le couchage, le stockage, l'établi. » |

- **La même distance sur les deux routes** (B16) : terrain → gué **3 km**, gué → Moulin **2 km**, comme terrain → station et station → Coopérative. Le coût du voyage (≈ 60 kcal et 0,08 L d'eau par km) et sa séquence de 10 s sont les mêmes.
- **L'étape par la halte** : on passe par le gué pour aller au Moulin, comme par la station pour aller à la Coopérative.
- **Le dessin** : la route B descend la rive est jusqu'au gué, passe l'eau sur le radier (« le pont est parti : à gué », au crayon), puis suit la rive ouest jusqu'au Moulin, sa roue à aubes arrêtée au bord de l'eau. Le **chemin de halage**, sur la rive est, est une **sortie** du Moulin vers le gué, jamais une arrivée.
- **Les noms** (Q-0.8-25) : « Le Gué-aux-Saules » et « Le Moulin du Gué » ; le lien entre les deux se lit sur la carte (l'enseigne du modèle dit « Minoterie du Gué »). Le gué est une halte **sur la route du Moulin du Gué**.
- **Pourquoi ces deux lieux** (étude `candidats-h1b-l1b-et-budget.md`, retenus le 2026-10-10, 25/27) : le gué oppose à la route A une autre sorte de danger, l'eau, la vase et le passage, au lieu des bâtiments ; le Moulin lui est déjà lié par le récit.
- **La digue des Roselières** (24/27, dans les Marais), deuxième de l'étude, est **pressentie pour H2B** (le niveau 2, hors de la 0.8).
- **Rien au-delà du Moulin** : **aucun panneau, aucune route annoncée** vers plus loin que le Moulin du Gué (décision du porteur, §9.2 du plan : « on ne sait pas encore ce qu'on mettra plus loin ») ; la retouche du panneau du modèle est demandée à la session « bâtiments ». Le panneau du gué qui annonce « 1 km » reste un décor : la carte donne les vraies distances.
- **Le menu « Aller à… » de god** connaît le gué et le Moulin.
- **La carte se ferme** par sa croix ✕ (un panneau ouvert au toucher garde sa croix) **et par un clic en dehors** de la carte (décision revue le 2026-10-10).

## 2. Les six environnements

| Environnement | Ressources dominantes | Famille la plus concernée |
|---|---|---|
| **Campagne** | Nourriture, semences, outils agricoles, animaux, salpêtre des engrais | ⚙️ |
| **Montagne et forêt** | Bois, gibier, pierre, calcaire, gypse, minerai | 🔥 |
| **Ville** | Médicaments, livres de savoir, électronique, outils, vêtements | ⚡ et tous |
| **Zone industrielle** | Ferraille, ressorts, alternateurs, cuivre, chaux, acier, produits chimiques | 🔥 ⚡ |
| **Littoral** | Sel, poisson, cordages, bâches, conteneurs, sable | ⚙️ |
| **Marais et rivière** | Minerai de fer des marais, roseaux, fibres, argile, poisson, eau | 🔥 ⚙️ |

---

## 3. Les lieux

### 3.1 Campagne

| Lieu | Anneau | Ressources | Danger |
|---|---|---|---|
| Ferme abandonnée | Proche | Outils agricoles, grain, foin, ficelle, fût, poules ensauvagées | ● |
| Verger abandonné | Proche | Fruits de saison (flux), bois de taille, greffons | ● |
| Village et sa quincaillerie | Moyen | Outils, visserie, cordes, sachets de graines, four de boulangerie | ●● |
| Coopérative agricole | Moyen | Semences F1, **engrais (salpêtre)**, **soufre**, bâches, pièces de tracteur | ●● |
| Église du bourg | Moyen | **Cloche en bronze**, cire, bois, vitraux | ●● |
| Haras abandonné | Lointain | **Chevaux redevenus sauvages** (traction), cuir, foin | ●●● |
| **Manoir du milliardaire** *(lieu spécial)* | Lointain | Objets absurdes, cave, bunker de luxe en panne | ●●●● |

### 3.2 Montagne et forêt

| Lieu | Anneau | Ressources | Danger |
|---|---|---|---|
| Lisière et bois | Proche | Bois, champignons, baies, petit gibier (flux) | ● |
| Carrière | Moyen | Pierre, calcaire, gypse, hématite | ●● |
| Scierie abandonnée | Moyen | Planches, grumes, lames de scie, courroies | ●● |
| Mine abandonnée | Lointain | Minerai, charbon minéral, rails, wagonnets | ●●●● |
| Refuge de montagne | Lointain | Matériel de montagne, cordes, duvets, réchauds | ●●● |
| **Grand Comptoir du Barrage** | Lointain | Le barrage produit encore : cœur des réserves des Compteurs | ●● |

### 3.3 Ville

| Lieu | Anneau | Ressources | Danger |
|---|---|---|---|
| Quartier pavillonnaire | Proche | Garages (outils, vélos), potagers abandonnés, conserves | ●● |
| Gare | Moyen | **Rails (enclumes)**, wagons (tôle), câbles | ●●● |
| Centre-ville | Moyen | Appartements, commerces, pharmacies | ●●● |
| **Médiathèque** | Moyen | **Livres de savoir** (Book 03 §5.4) | ●● |
| Lycée technique | Moyen | Machines-outils, manuels, outillage de précision | ●●● |
| Caserne de pompiers | Moyen | Tenues de feu, casques, outils de désincarcération | ●●● |
| **Hôpital** | Lointain | **Antibiotiques**, matériel de soin, vaccins | ●●●●● |
| Galerie de l'Abondance (centre commercial) | Lointain | Électronique, vêtements synthétiques, objets absurdes | ●●●● |
| **Siège de la Compagnie d'électricité** *(lieu spécial)* | Lointain | Archives, plans du réseau, batteries de secours | ●●●● |

### 3.4 Zone industrielle

| Lieu | Anneau | Ressources | Danger |
|---|---|---|---|
| Casse automobile | Proche | Ferraille, **ressorts à lames**, alternateurs, batteries, pneus | ●● |
| Poste haute tension | Moyen | Cuivre, transformateurs, isolateurs, câbles | ●● |
| Entrepôt logistique | Moyen | Palettes, cartons, marchandises de l'Abondance | ●●● |
| Cimenterie | Moyen | **Chaux vive**, ciment, réfractaires | ●●● |
| **Ferme solaire** | Moyen/lointain | **Panneaux solaires**, onduleurs, câbles | ●●● |
| **Usine automobile** | Lointain | Tôles, ressorts, moteurs, roulements, robots, outillage | ●●●● |
| Aciérie à l'arrêt | Lointain | Acier en barres, briques réfractaires, creusets | ●●●● |
| Usine chimique | Lointain | Acides, soude, solvants : **dangereux sans savoir en chimie** | ●●●●● |

### 3.5 Littoral

| Lieu | Anneau | Ressources | Danger |
|---|---|---|---|
| Camping des Flots | Proche | Tentes, bâches, réchauds, bouteilles de gaz, vélos | ● |
| Plage | Proche | Sable, bois flotté, coquillages, algues, pêche à pied (flux) | ● |
| Station balnéaire | Moyen | Hôtels (literie, textiles, conserves), cuisines pro, piscine | ●●● |
| **Marais salants** | Moyen | **Sel** (conservation, savon) | ● |
| Port de pêche | Lointain | Filets, cordages, bateaux, moteurs, poisson (flux) | ●●● |
| Épave du cargo | Lointain | **Conteneurs** (maisons métalliques, Book 10), marchandises, acier | ●●●● |
| Phare | Lointain | Lentille, verre, lampe, groupe électrogène, longue-vue | ●● |

### 3.6 Marais et rivière

| Lieu | Anneau | Ressources | Danger |
|---|---|---|---|
| Étang | Proche | Poisson, eau, roseaux, argile (flux) | ● |
| Marais | Moyen | **Minerai de fer des marais**, roseaux, fibres, tourbe | ●● |
| Station d'épuration | Moyen | Pompes, tuyaux, bassins (et une rumeur sur la fièvre grise) | ●●● |
| Moulin à eau | Moyen | Meules, engrenages, roue hydraulique à restaurer | ●● |

> **0.8** : le Moulin à eau devient **le Moulin du Gué** (L1B), à 5 km par la route B (§1 quater bis) ; la roue à restaurer est gardée pour plus tard (niveau 3). Le gué de la ligne « Marais » ci-dessous devient **le Gué-aux-Saules** (H1B), et **la digue** est pressentie pour H2B.
| Écluse et péniche | Lointain | Vannes, roue, péniche chargée, cordages | ●● |

---

## 4. Comptoirs, hameaux et haltes

| Élément | Où | Rôle |
|---|---|---|
| **Comptoir du Carrefour** | Centre, proche du terrain | Accessible dès la première heure (Book 07 §4.1) |
| **Comptoir de la Gare** | Ville, moyen | Spécialité : composants, outils |
| **Comptoir du Port** | Littoral, moyen | Spécialité : poisson, sel, cordages |
| **Grand Comptoir du Barrage** | Montagne, lointain | Meilleurs prix, plus grand carnet d'ordres. Le barrage produit encore : c'est logique que les Compteurs y aient leur siège. |
| **Hameau des Charbonniers** | Montagne et forêt, moyen | Repérable à la fumée des charbonnières |
| **Hameau des Voltaïques** | Zone industrielle, moyen | Autour d'un poste électrique, d'anciens collègues de la Compagnie |
| **Hameau des Mécanistes** | Campagne, moyen | Autour d'un vieux moulin qui tourne encore |

**Haltes** (≈ 200 × 70 m, Book 01 §2 bis) : deux par route principale, aux passages entre anneaux.

| Route | Haltes |
|---|---|
| Montagne | Le col, le tunnel |
| Ville | Le passage à niveau, l'avenue barricadée |
| Zone industrielle | Le péage, l'aire d'autoroute |
| Littoral | La route du pont, la corniche |
| Marais | La digue (pressentie pour H2B), le gué (**le Gué-aux-Saules**, H1B en 0.8) |
| Campagne | Le carrefour, la station-service |

> Le nombre de haltes par trajet reste un **paramètre de réglage** (Book 01 §9).

---

## 5. Règles de conception des lieux

1. **Chaque ressource du jeu existe dans au moins deux lieux**, dont un accessible avant le lointain. Aucune famille ne doit dépendre d'un seul lieu.
2. **Le danger suit la richesse** : plus un lieu est riche en stocks rares (médicaments, électronique), plus il est dense en Éteints et loin.
3. **Chaque lieu raconte quelque chose** de l'Âge de l'Abondance (Book 15) : un détail absurde, une affiche de Watty, une rumeur.
4. **Les lieux de flux** (bois, étang, plage, verger) **se régénèrent** ; les ruines lointaines **s'épuisent** sur le cycle (Book 01 §2 bis, Book 09 §1.2).
5. **Équilibre des familles** : chaque famille a ses lieux phares à chaque anneau (proche, moyen, lointain).

---

## 6. Questions ouvertes

- [ ] **Valider** la disposition en six secteurs et trois anneaux.
- [ ] **Lieux à ajouter ou retirer** (aéroport, base militaire, prison, zoo, parc d'attractions… ?). Une base militaire poserait la question des armes modernes, aujourd'hui volontairement absentes (Book 01 §4).
- [ ] **Renouvellement** : les lieux lointains épuisés sont remplacés par de nouveaux lieux « découverts » (Book 01 §2 bis). Lesquels ?
- [ ] **Carte identique d'un cycle à l'autre**, ou nouvelle disposition à chaque cycle (Book 09) ?
