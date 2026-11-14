# La musique de la Coopérative du Plateau — proposition

> Session musique, 2026-10-08. **Validée en entier par le porteur le 2026-10-08** (tonique mi, mi majeur harmonique dehors, musique qui se retire, Danger « le nombre », radio de la Compagnie). **Produite et livrée** : voir `LIVRAISON.md` §3 bis. Lieu : Book 23 (versions 0.5 et 0.6).
> Esquisse jouable : `http://127.0.0.1:8765/cooperative/` (serveur : `python3 musique/outils/serveur.py`), avec un bouton pour exporter un parcours de 3 minutes en WAV (pour écouter sur l'iPhone).
> Rien n'est modifié dans `code/` ni dans `book/`. Après validation : le moteur et le directeur (`moteur/`) ont reçu les zones et la menace « nombre » (19 tests).

## 1. L'idée en une phrase

**Plus on entre, plus la musique se retire.** Dehors, une musique nostalgique de ferme abandonnée ; dedans, presque plus que du grave et de l'aigu, pour laisser entendre les Éteints ; dans la chambre froide, presque rien. La coopérative est le premier lieu où l'on **se bat vraiment** : le son est l'arme du joueur (Book 16 §3.1), la musique doit lui laisser la place.

## 2. Les choix

### 2.1 Tonique : mi

| Lieu | Tonique | Distance |
|---|---|---|
| Terrain | ré | la maison |
| Halte (station) | la (la quinte de ré) | une traversée |
| **Coopérative** | **mi** (la quinte de la) | **deux traversées** |
| Comptoir | sol (la quarte de ré) | le lieu où l'on se pose |

On s'éloigne de la maison **par quintes**, comme on s'en éloigne à pied. Mi est le plus loin de ré : l'oreille sent qu'on n'est plus chez soi, sans savoir pourquoi.

### 2.2 Les modes : suivre la profondeur

| Zone (Book 23 §2.2) | Danger | Pièce | Mode | Ce qu'on entend |
|---|---|---|---|---|
| **Dehors** : cour, bascule, libre-service, quai, cour des silos | ● | Fond (2 blocs) + **Exploration** (4 blocs) | **Mi majeur harmonique** | Le la **mineur** sous le mi majeur (le do♮) : la ferme d'avant, les moissons qui ne reviendront pas. Doux-amer, jamais tendu. Pas encore utilisé dans le jeu |
| **Dedans** : atelier des tracteurs, hangar, bureaux | ●● | **Dedans** (2 blocs) | Mi éolien, une touche de ré♯ à la fin | La musique se retire : un bourdon grave et du verre très aigu, **rien entre ≈ 250 Hz et 2 kHz** |
| **Chambre froide** | ●●● | **Froid** (2 blocs) | Un mi à 41 Hz, seul | Presque rien. **Il faut entendre respirer les dormants** (Book 16 §3.3 : « il faut tendre l'oreille ») |

Le mineur harmonique, la couleur commune « fantaisie » des trois familles, revient par le **ré♯** (accord de si 7 dans l'Exploration, verre du « Dedans »). Aucun cliché : pas de phrygien, pas de trémolo, pas de seconde mineure tenue.

**Les accords de l'Exploration** (un accord toutes les 4 mesures) :

| Bloc | Accords | Rôle |
|---|---|---|
| 1 | Mi add9 · la m6 | L'idée : le majeur, puis son ombre |
| 2 | do♯ m7 · la m add9 | Plus sombre |
| 3 | fa♯ m7♭5 · si 7 | Le ré♯ (couleur commune) |
| 4 | Mi maj7 / sol♯ · la m6 | Le petit motif de harpe (mi fa♯ sol♯ si, puis **do → si** : le soupir) ; retour au bloc 1 par la cadence la m → Mi |

### 2.3 La matière : les sons du lieu

Comme à la halte (le compteur de la pompe) et au Comptoir (les tampons), la musique est faite de la coopérative :

- **les silos** : grands cylindres qui résonnent, la couleur « cuve » de la halte une octave plus bas, sur mi et si ;
- **les palettes** de bois frappées, accordées : la pulsation de l'Exploration ;
- **la bascule à camions** : son plateau d'acier qui retombe, en tête de phrase ;
- **le grain qui coule** d'une trémie ;
- **les montants des rayonnages** : la Tension et le Danger ;
- **la tôle du hangar** qui travaille au soleil (dilatation) : le « Dedans ».

Instruments : **violoncelles en pizzicato** (la basse, organique), **souffle accordé de bois** (l'harmonie, le grenier), un **harmonium** très lointain, quelques notes de **harpe** (échantillons VSCO 2 CE, déjà téléchargés). Peu de mélodie, des silences : la direction validée.

### 2.4 Un rythme à elle : 3+3+3+3+2+2

La halte groove en **3+3+2** par mesure. La coopérative groupe ses croches **sur deux mesures** : 3+3+3+3+2+2. Ça boite doucement, comme une machine agricole fatiguée. Le **Danger** reprend **exactement cette métrique**, durcie (les palettes deviennent de la tôle et de l'acier) : la peur vient du lieu lui-même.

### 2.5 Tension et Danger propres au lieu

Le joueur y passera beaucoup plus de temps qu'au terrain (24 Éteints, Book 23 §3) : rejouer la Tension et le Danger du terrain transposés lasserait.

- **Tension** (2 blocs) : le battement sourd en 3 contre 4 qui se resserre (comme au terrain, pour que le joueur reconnaisse « on m'a repéré »), mais avec les **montants de rayonnage** au lieu du bois, sur le bourdon mi-si des silos.
- **Danger** (2 blocs) : une saisie ; **« le nombre »**, un stem qui s'ajoute quand **3 Éteints ou plus** sont sur le joueur (l'encerclement, Book 23 §4.4) : la grille se remplit, la bascule retombe.

## 3. Les règles de couches (faites dans le directeur)

Ce que la coopérative demande de **nouveau** au directeur musical :

| Situation | Ce que fait la musique | Quand |
|---|---|---|
| Arrivée au portail | Signal « arrivée » (la bascule, puis les silos), Fond seul | Au chargement |
| Calme, dehors | Fond + Exploration, après 8 s de calme | Au bloc suivant |
| **Passer une porte** vers dedans ou la chambre froide | Le stem de Fond de la zone remplace le précédent ; l'Exploration se tait | **À la mesure suivante**, fondu d'une mesure (même tonique, même grille : pas de heurt). Attendre la fin du bloc (≈ 23 s) serait trop lent |
| Attiré / poursuite | Tension ; l'Exploration garde pulsation et basse à moitié | Au temps fort suivant (règle actuelle) |
| Saisie | Danger | Au temps suivant (règle actuelle) |
| **3 Éteints ou plus** sur le joueur | Danger **+ le stem « nombre »** | Au temps suivant |
| Fin de menace | Silence 4 à 8 s, puis le Fond de la zone | Règle actuelle |
| Butin rare trouvé | Signal « butin » (la harpe monte, un rayonnage tinte très haut) | Au temps suivant |
| Repasser le portail, vivant | Signal « sortie » (la m6 → Mi add9) | Tout de suite |
| Dans la chambre froide | **Pas de fenêtres de silence à gérer** : la pièce est déjà presque silencieuse | — |

**Fait** : un nouveau lieu `'cooperative'`, une méthode `changerZone('dehors' | 'dedans' | 'froid')` et un niveau de menace `'nombre'`. Le Fond est **une seule pièce à trois stems** (un par zone) : le moteur sait déjà régler un stem à la mesure, et seul le stem de la zone est décodé. « Le nombre » est un **stem en plus** du Danger (la version mobile le garde séparé).

## 4. Le mixage : laisser la place au combat

- **Dedans**, la musique ne joue que **sous 250 Hz et au-dessus de 2 kHz** : les râles, les pas, le **raclement des Rampants** et le gémissement de la cascade (session son) restent nets. Le bouton « Râle provisoire à 8 m » de la page d'écoute permet de le vérifier.
- **Niveaux visés** (au mastering) : Exploration −18 LUFS comme ailleurs ; **Dedans −24** ; **Froid −30** (on le sent plus qu'on ne l'entend) ; Tension et Danger −18.
- **Poids** (mesuré) : **6,9 Mo** en Opus sur ordinateur, radio comprise ; **2,5 Mo** sur mobile. **Mémoire** (mesurée, scène complète) : voir `LIVRAISON.md` §4.

## 5. Une idée de plus : la radio à piles joue vraiment

Le Book 23 §4.7 pose une **radio à piles** sur l'établi, comme leurre. Proposition : quand on l'allume, elle joue **une émission de la Compagnie** — une publicité pour « l'engrais Watty » dans le style du jingle de l'écran titre (do majeur kitsch, orgue de pub, voix synthétique), 20 secondes en boucle, filtrée comme une petite radio. C'est **diégétique** (les Éteints l'entendent, c'est le but), drôle (le ton Idiocracy du Book 15) et ça réutilise le matériau du thème principal (l'orgue et la voix du jingle). **Faite** : `diegetiques/radio-compagnie`, 20 s en boucle parfaite, mono ; on ne comprend que le slogan « Watt… Now? » (le crooner chantonne « ouh » : une voix de synthèse ne sait pas articuler une vraie réclame).

## 6. Questions pour le porteur (toutes tranchées : oui, le 2026-10-08)

1. **La tonique mi** (par quintes depuis la maison) : d'accord ?
2. **Le mi majeur harmonique** dehors (nostalgie, le la mineur sous le mi majeur) : la bonne couleur pour une coopérative abandonnée, ou faut-il plus sombre dès la cour ?
3. **La musique qui se retire** dedans et dans la chambre froide : d'accord pour qu'un niveau de combat soit **moins** musical que le reste ?
4. **Le Danger « le nombre »** (3 Éteints ou plus) : utile, ou un seul Danger suffit ?
5. **La radio à piles** qui joue une pub de la Compagnie : on la garde ?
