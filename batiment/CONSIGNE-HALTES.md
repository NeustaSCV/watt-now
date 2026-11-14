# Consigne complémentaire : les haltes

Lis d'abord `batiment/CONSIGNE-AGENTS.md` : elle s'applique en entier (périmètre, contrat, budget, vérification). Ce
fichier ajoute ce qui est propre aux haltes.

## Ce qu'est une halte (Book 01 §2 bis, Book 20 §4)

Une halte est une **map qu'il faut traverser physiquement** pour continuer sa route sur la carte du monde. C'est là
que les voyageurs **se croisent** : on peut s'ignorer, commercer, s'escorter ou s'embusquer (combat entre joueurs
autorisé, jusqu'à 10 joueurs par instance, pillards PNJ, marchand itinérant parfois).

Le format est validé :

| Élément | Règle |
|---|---|
| **Taille** | Environ **200 m de long × 70 m de large**. La route traverse dans le sens de la longueur, d'ouest (entrée A) en est (sortie B). |
| **Bords** | **Obstacles naturels ou construits** des deux côtés (forêt dense, falaise, talus d'autoroute, glissières et grillages, rivière, immeubles) : on comprend tout de suite que **la route est le seul passage**. |
| **Goulets** | **Un ou deux points de passage obligés** où l'on se croise forcément : un pont, un col, une barricade, une passerelle, un tunnel. |
| **Un vrai niveau** | Pas seulement un couloir : des **zones à l'écart de la route** (bâtiments, épaves, recoins) où l'on **ramasse** des vestiges, au prix de **mauvaises rencontres**. Plus on s'écarte de la route, plus il y a de butin… et d'Éteints. |
| **Durée** | Environ 2 à 3 minutes réelles en suivant la route sans s'arrêter, 5 à 10 minutes en fouillant les à-côtés. |
| **Butin** | **Modeste**, régénéré lentement : les haltes sont d'abord des lieux de passage et de rencontre. |

La halte qui existe déjà dans le jeu, la **station-service** de la route de la Campagne, est la référence. Lis
`code/client/src/rendu/halte.ts` et `code/commun/src/halte.ts`, **en lecture seule**.

## Le découpage en tronçons (obligatoire)

Une halte de 200 m ne tient pas dans le budget d'une seule carte. Elle est donc faite de **tronçons**, qui sont ses
cartes, mis bout à bout le long de la route. Le jeu ne charge que ceux qui sont proches du joueur.

- `FICHE.halte = true`.
- `FICHE.lot = { l: 200, p: 70 }` : la halte entière.
- `FICHE.depart` : l'entrée A, à l'ouest.
- `FICHE.cartes` : en général **4 tronçons de 50 × 70 m**. Chaque carte porte :
  - `id`, `nom`, `lot: { l: 50, p: 70 }`, `depart`, `description`, `entrees`, `fouille`, `eteints` ;
  - **`decalage: { x, z }`** : la position du centre du tronçon dans le repère de la halte entière. Pour 4 tronçons :
    x = −75, −25, 25, 75 et z = 0.
- **Chaque tronçon est construit centré sur son propre lot.** Il doit se raccorder **exactement** à ses voisins :
  route, talus, glissières, bords, sol continu. Le plus simple est de tout bâtir dans le repère de la halte entière
  (comme `centrale-thermique` et son « repère du site »), puis de ne garder pour chaque tronçon que ce qui tombe dans
  sa bande de x et de le recentrer. Un objet à cheval sur deux tronçons va dans celui qui contient son centre.
- **Budget par tronçon, à toutes les usures** : **≤ 60 000 triangles et ≤ 40 appels de dessin** (la consigne
  commune).
- **Mesure aussi la halte entière** : bouton « Toute la halte » dans la fiche, ou `&carte=*` dans l'adresse. Le total
  des triangles dépasse alors le plafond d'une carte, c'est normal. Vérifie surtout que les raccords sont invisibles.
- Avec `solPropre: true` (dans la fiche ou dans chaque tronçon), tu fournis tout le sol de chaque tronçon. Utile pour
  un talus, une tranchée, une rivière, un fossé.
- Ajoute `goulets: [{ x, z, nature }]` dans la fiche (coordonnées de la halte entière) : ce sont les points de passage
  obligés.
- Ajoute aussi `panneaux` : au moins un **panneau routier** à chaque extrémité, qui indique la destination, à la façon
  de la station-service (« ← Comptoir · 2 km », « Ton terrain →… »).
- Lumières : 8 au plus **par tronçon**.

## Ambiance et ton

- **Public adulte.** Le jeu ne vise pas les mineurs, et le sang est marqué (rouge seulement, aucune plaie : Book 21).
- **Embuscades** : prévois des **couverts** (épaves, murets, cabines) et des **points de vue** près des goulets.
  C'est là que les joueurs se guettent.
- **Pas de transport de gros véhicules** : les voitures sont des épaves, pas des véhicules utilisables.
- **Pas d'armes modernes** (Book 01 §4). Pas de fusils posés à ramasser, pas de dépôt d'armes militaires.
- **L'Abondance** se voit dans les services routiers disparus : bornes, abonnements, applis, « premium ».
