# Book 23 — La Coopérative et le combat

> Document de conception · version 0.2 · 2026-10-08
> Statut : **validé** par le porteur du projet (2026-10-08), en cours de réalisation. Cible : versions 0.5 et 0.6.
> Avancement (2026-10-08) : **0.5a fait** (lieu vivant, une Coopérative par joueur, chemin agricole au nord du Carrefour, route en ligne) ; **0.5b fait** (murs, portes qu'on ouvre et referme, grille d'obstacles de 4 m) ; **0.5c fait** (les murs étouffent le son et arrêtent la vue, obscurité par pièce, passage par les portes, cascade des gémissements, groupes, Rampant et Équipé, retour dans sa zone après 3 min, IA à 10 Hz et 2 Hz, envoi limité à ce que le joueur perçoit ; 24 Éteints placés) ; **0.5d fait** :
>   - **sauvegarde** de chaque Coopérative : Éteints détruits, portes, butin pris ;
>   - **repeuplement** : 3 Éteints toutes les 12 h réelles, la chambre froide d'abord (réglages `coop_repeuplement_h` et `coop_repeuplement_n`) ;
>   - **butin** posé sur le décor : pied-de-biche garanti sous la caisse ; libre-service, quai, atelier et hangar reviennent en 6 à 12 h ;
>   - **coffre du directeur** : il s'ouvre avec la clé que lâche le magasinier ;
>   - **chambre froide** : roulements et alternateur, qui reviennent en 4 jours ;
>   - **semences F1** au coffre ; ces pièces rares ne sortent d'aucun autre tirage (fouille, décharge) ;
> **0.5e fait** :
>   - **type de dégât** : le casque arrête le tranchant à la tête ; au sol, seuls le contondant et le perçant achèvent un Équipé ; le contondant étourdit ×1,5 ;
>   - **usure**, aux solidités du §4.3 : abîmée sous 30 % (−30 %), puis cassée, la suivante est neuve ;
>   - **réparation** de fortune (ficelle et chiffons, qui ne dépasse pas « abîmée »), ou à l'établi, à la meule ou à la forge ;
>   - **B selon la situation** : repousser, esquiver, se dégager ;
>   - **nouvelles armes** : pied-de-biche (caisse), machette (établi de l'atelier), masse (contre le tracteur vert), lance (fabriquée) ;
>   - **leurres du décor** : klaxon (4 coups, la batterie du tracteur se vide), sonnette du quai, radio à piles (10 min ; la réclame de la Compagnie). Klaxon et sonnette sont synthétisés côté code.
>
> **0.5f fait** : obscurité par pièce (lampe à environ 7 m, même de jour), yeux des Éteints dans le noir, indicateur des Éteints hors champ (une flèche sur une ellipse autour du personnage), apparence des variantes.
> **0.5g fait** (Pi 4, 2026-10-08) : 10 joueurs en Coopérative, p99 13,6 ms (cible < 25 ms) ; 20 joueurs, p99 23,2 ms. **La 0.5 est déployée.**
> **0.5.1 fait** (le reste de la 0.5e) :
>   - **batterie du tracteur à emporter** : point de butin sur le garde-boue du tracteur rouge (clé plate, 8 s) ; c'est une batterie de voiture (360 Wh utiles), chargée selon les coups de klaxon restants (un quart par coup) ; prise, le klaxon est muet ; elle revient en 4 jours, pleine ;
>   - **radio transportable** : elle se prend (objet du sac, 2 kg) et se pose n'importe où dans la Coopérative, où elle attire les Éteints ; ses piles et sa place sont gardées avec la Coopérative ; elle ne quitte pas le Plateau (posée au portail si l'on part avec) ; perdue, elle revient sur l'établi ;
>   - **débris d'une arme cassée** : manche fendu (bois), lame ébréchée (lames), ferraille tordue (métal), démontables ; dans le sac, ou au sol s'il est plein.
> **Reste** : mesurer la fenêtre de frappe (§4.5) ; le rendu 3D du lieu est fait et allégé (ombres cuites, carte réduite).
> Décisions déjà prises (2026-10-08) : le lieu est la **coopérative agricole** (Book 20 §3.1) ; **une par joueur** pour commencer et valider la mécanique (des cartes partagées ne sont pas exclues plus tard) ; **conception écrite d'abord**.
> La version 0.2 intègre les relectures des agents BMAD : Samus (Game Designer : niveau, difficulté, combat sur téléphone) et Cloud (Game Architect : instances, IA, persistance, Pi).

---

## 1. Pourquoi

- **Éprouver le combat en vrai.** Aujourd'hui, on ne se bat que contre 1 à 3 Éteints isolés. Les règles du combat (Book 06 §8, Book 08 §3.3) n'ont jamais été mises à l'épreuve : groupes, surprise, armure, retraite, endurance.
- **Un vrai niveau** : une entrée, un fond à atteindre, plusieurs chemins, un danger qui monte, un **butin rare** qui récompense le risque.
- **Donner une raison aux armes** (type, usure) et ouvrir la tactique : **leurrer, isoler, repousser**, puis lancer.

## 2. Le lieu : la Coopérative du Plateau

### 2.1 Sur la carte

- Dans la Campagne, à **distance moyenne** (danger ●●). Un chemin agricole part **du Carrefour vers le nord** (Book 20). Du terrain, c'est donc **deux traversées à pied** (la station, puis le Carrefour) : on revient chargé, et c'est voulu (la batterie de tracteur pèse).
- **0.7.3 : la Coopérative est derrière la station, comme le Comptoir** (le porteur du projet : « ça ne sert à rien de passer au Comptoir pour aller à la Coopérative, c'est lourd en jeu »). On a **ajouté** un chemin, sans rien retirer :
  - à la halte, un **chemin de terre** quitte la route vers le nord, entre la grange et la station (x = 72). Un panneau « Coopérative du Plateau · 2 km ↑ » est planté au bord de la route. La forêt s'ouvre sur la largeur du chemin, avec un fourré de part et d'autre : la sortie couvre toute la trouée, il n'y a pas de bord invisible ;
  - **station ↔ Coopérative : 2 km** (≈ 120 kcal, ≈ 0,16 L d'eau, 10 min de route), comme station ↔ Carrefour. Du terrain, c'est donc **une seule traversée à pied** (la station) ;
  - le **portail** mène à la station (proposée d'abord sur la carte) **et**, comme avant, au Carrefour (chemin agricole, 3 km). La **brèche** mène toujours au Carrefour. Vers le terrain, il faut repasser le portail ;
  - **le chemin agricole du Carrefour reste**, avec son panneau : c'est un deuxième accès. On arrive toujours au portail, d'où qu'on vienne ;
  - **rien à migrer** : un voyage n'est pas gardé en base (la destination est enregistrée au départ). Qui était en route ou dans la Coopérative s'y retrouve au portail.
- **Une coopérative par joueur** (instance, comme le terrain) : son butin, ses Éteints. On n'y croise personne en 0.5.
- **Une visite tient en 15 à 20 minutes** (le téléphone) ; le niveau se fait en **trois visites** environ : (1) cour, libre-service, quai, atelier ; (2) hangar et bureaux ; (3) chambre froide.

### 2.2 Le plan (≈ 80 × 60 m, tout de plain-pied en 0.5)

```
            N
 ┌──────────────────────────────────────────────────┐
 │  COUR DES SILOS ●      ┌ porte frigorifique arrière
 │  (silos : décor)  ◄────┤ CHAMBRE FROIDE ●●●     │
 │       │                └ noire                  │
 │  ATELIER TRACTEURS ●●       HANGAR ●●           │
 │  fosse, 2 tracteurs,        3 allées de         │
 │  Rampants dessous           rayonnages (4 m)    │
 │       │                     BUREAUX (couloir,   │
 │  QUAI DE CHARGEMENT ●       une porte, coffre)  │
 │       │                     LIBRE-SERVICE ●     │
 │  brèche du grillage         COUR, bascule ●     │
 │  (à l'ouest)                PORTAIL (sud)       │
 └──────────────────────────────────────────────────┘
```

| Zone | Danger | Ce qu'on y trouve | Ce qu'elle apprend |
|---|---|---|---|
| **Cour et bascule à camions** | ● | Vestiges de voiture, bâches | Approcher en discrétion, lire le terrain |
| **Libre-service** (comptoir, rayons) | ● | Vestiges communs, conserves, graines ; **un pied-de-biche garanti** | Fouiller sans se faire coincer |
| **Quai de chargement** | ● | Palettes, sangles, cordes, transpalette ; **la sonnette du quai** (leurre) | Un deuxième accès, vers l'atelier |
| **Atelier des tracteurs** (fosse, 2 tracteurs, établi) | ●● | **Outils de qualité**, pièces, **batterie de tracteur** (grosse capacité, lourde) ; **klaxon du tracteur**, **radio à piles** (leurres) | Les **Rampants** sous les engins ; un espace encombré |
| **Hangar** (3 allées de rayonnages de 4 m) | ●● | Engrais, soufre, cordes, bâches, vestiges peu communs | Les **groupes**, espacés de **12 m au moins** : on peut en isoler un |
| **Bureaux** (couloir étroit, une porte, au rez-de-chaussée) | ●● | **Coffre du directeur** (clé : le magasinier), registres, vestiges rares | Un point d'étranglement qu'on tient ou qui piège |
| **Chambre froide** (fond du hangar, noire, **deux portes** : hangar et cour des silos) | ●●● | **Le butin légendaire : pièces rares** (roulements, alternateur, semences F1). **Pas d'arme unique** (Book 22 §4.6) | **La boucle** : leurrer les dormants par l'arrière, entrer par le hangar |
| **Cour des silos** | ● | Grain, un nid de pigeons | Le dehors de la boucle ; une sortie de secours |

- **Trois entrées** : le portail (devant, bruyant), la **brèche du grillage** à l'ouest (discrète, par l'atelier, des Rampants), le quai.
- **Il fait sombre dedans** : hangar, bureaux et chambre froide demandent une **lumière portée**, qui se voit (Book 06 §3).
- **Toits qui s'effacent** comme à la station (Book 18).
- **Portes qu'on referme** : un Éteint bloqué derrière pousse sans passer (comportement « Pressant », Book 06 §4). C'est la meilleure retraite.
- **Reportés après la 0.5** (coûteux pour peu de jeu) : l'**étage** des bureaux (il demande un niveau dans les positions, le protocole et la prédiction du client), le **point haut des silos** (échelle et vue).

### 2.3 Arrivée, poursuites, renouvellement

- **Arrivée sûre** : aucun Éteint à moins de **15 m du portail** quand on arrive. Une **reconnexion à l'intérieur** ramène au portail.
- **Poursuites** : un Éteint qui a perdu le joueur de vue depuis **3 minutes** retourne dans sa zone (il ne campe pas à l'entrée).
- **Ce qui est pris est pris.** Le butin **rare** revient en plusieurs jours réels ; le commun en quelques heures, comme la halte.
- **Les Éteints** détruits ne reviennent pas tout de suite : **quelques nouveaux par nuit écoulée**, et la chambre froide se **repeuple** jusqu'à 6 sur plusieurs jours. Tout se calcule **à l'entrée** (une coopérative où l'on n'est pas ne coûte rien).

### 2.4 Ce qu'on voit, ce qu'on entend : la vue par pièce (0.7.2)

> Ajouté le 2026-10-10, d'après l'étude « visibilité par pièce » validée par le porteur du projet (2026-10-09, ses huit
> décisions). Même règle à la halte, pour la boutique de la station.

- **Une porte fermée cache ce qu'il y a derrière ; c'est l'ouvrir qui révèle.** On voit en ligne droite : dans sa pièce, tout (les rayonnages du hangar n'arrêtent **pas** la vue, pour l'instant) ; par une porte ouverte, **dans le prolongement de l'ouverture** (un cône, étroit de loin, presque toute la pièce depuis le seuil) ; deux portes alignées se traversent. Le cône s'ouvre avec le battant.
- **On voit à travers les vitrines et les fenêtres** : le libre-service sur la cour, les bureaux par leurs fenêtres à barreaux. Une vitre condamnée (le contreplaqué d'une vitrine du libre-service, le store baissé du bureau du milieu, les planches de la boutique) arrête la vue.
- **Ce qu'on ne voit pas est « en souvenir »** : le décor reste lisible, assombri et désaturé, **jamais noir**, même dans une pièce jamais visitée ; **rien de ce qui bouge** n'y apparaît (ni Éteint, ni joueur). Un butin pris hors de vue disparaît tout de suite. **La lampe ne traverse plus les murs.**
- **Ce qu'on entend sans le voir** : le serveur envoie un « bruit » (son genre, sa force étouffée par les murs, un point de passage **de notre côté** : la porte par où il arrive, ou le mur), **jamais la position de l'Éteint ni son numéro**. On l'entend étouffé, et une **onde** s'élargit sur la porte ou le mur (orangée ; rouge pour des coups ou une présence). **Un Éteint qui pousse une porte fermée cogne, et la porte tremble.** À **moins de 3 m** derrière un mur, on le **sent** (onde rouge, souffle), sans le voir.
- **Le cercle de signature montre sa vraie portée** dans chaque pièce : ×0,5 par une porte ouverte, ×0,15 par une porte fermée, ×0,3 par une vitrine, ×0,05 à travers un mur (le meilleur chemin). C'est la règle des Éteints : le cercle ne ment plus.
- **« Si je le vois, il me voit »** : les Éteints voient par la même règle (un Éteint de la cour te voit par la vitrine ; ceux des bureaux, par les fenêtres à barreaux) et entendent à travers les vitrines (×0,3).
- **À plusieurs, chacun sa vue** : le serveur n'envoie à chacun que les Éteints, les joueurs, les coups et les projectiles qu'il voit (la Coopérative reste à un joueur ; c'est déjà vrai à la halte, autour de la boutique).

## 3. Les méchants : 24 à la première visite

> **À trancher (2026-10-08)** : les lignes du tableau ci-dessous font 28 Éteints (avec 6 Errants), pour un total annoncé de 24. Le code en place 24, total et budget de calcul du Pi, avec **2 Errants** (la cour et le libre-service). Repasser à 6 Errants ne coûte qu'une ligne.

Pas de mutant ni de boss magique (Book 06 §5) : seulement des corps différents, et **le nombre**.

| Variante (Book 06 §5) | Nombre | Où | Comportement | Réponse attendue |
|---|---|---|---|---|
| **Errant** | 6 | Partout | Le zombie ordinaire | Viser la tête |
| **Groupe** (comportement « Grégaire », Book 06 §4) | 3 groupes de 3 (9) | Hangar, espacés de 12 m au moins | Quand l'un bouge, les autres suivent | Isoler (leurre, couloir), ne pas réveiller tout le hangar (cible : un bruit met en marche **un seul** groupe) |
| **Rampant** | 3 | Sous les tracteurs, dans l'herbe de la brèche | Au sol, caché ; mord aux chevilles. **Signalé** : herbe qui bouge, raclement | **Un coup l'achève** (il est au sol, Book 06 §8.4) ; le ciblage le prend en priorité au contact |
| **Équipé** (casque de moto) | 2 | Un **dormant visible** dans la cour (évitable), un aux bureaux | Résistance au torse 4 au lieu de 3 ; **au sol, ne s'achève qu'au contondant ou au perçant** | Le **pied-de-biche** du libre-service, trouvé avant de devoir l'affronter |
| **Ancien habitant : le magasinier** | 1 | Bureaux | Comme un errant | Il porte la **clé du coffre** |
| **Ancien habitant : le mécanicien** | 1 | Atelier | Comme un errant | Il porte des **outils** |
| **Dormants** | 6, serrés | Chambre froide | Immobiles ; **un dormant qui se réveille gémit** (un bruit de 6 m) : la **cascade** | Les leurrer **par la porte arrière**, ou entrer très discrètement |

## 4. Le combat, enrichi (0.5)

### 4.1 Ce qui existe déjà

Dégâts, vitesse (durée du geste), allonge, coup appuyé à la tête (0.3, affichés dans le sac) ; un coup va jusqu'au bout ; on choisit son arme.

### 4.2 Le type de dégât : une seule règle, le casque

- **Contondant** (marteau, masse, pied-de-biche, gourdin, batte) : plein effet sur l'Équipé, et il étourdit un peu plus longtemps.
- **Tranchant** (hache, machette, couteaux, lame forgée) : le casque l'arrête à la tête (le coup appuyé ne tue pas un Équipé).
- **Perçant** (épieu, fourche, lance) : sa force, c'est l'**allonge**.
- Pas de « lame coincée », pas de règles cachées de plus : sur un téléphone, ce serait vécu comme une injustice.
- **L'Équipé encaisse (0.9)** : un coup sur trois seulement le fait vaciller (le premier, puis le 4e, le 7e…) ; les autres, il les **encaisse** : les dégâts au torse comptent, mais il n'est ni étourdi ni repoussé, et il garde sa prise et son élan. Un son mat, peu de sang, un léger sursaut : « celui-là tient ». Marteler ne suffit donc plus contre lui ; **repousser (B) et la décharge le font toujours vaciller**. Le décompte repart à zéro quand il tombe. À terre, une lame ajoute ses dégâts sans le faire reculer ; seuls le contondant et le perçant l'achèvent. Réglable à chaud (`equipe_vacille_un_sur`, 3 par défaut).

### 4.3 L'usure

- L'usure se compte **pour l'arme en main** de chaque type (l'inventaire compte des objets, pas des exemplaires) : quand elle casse, on en perd une et la suivante est neuve.
- **Solidité, en coups qui touchent** : pied-de-biche 120 · marteau 80 · masse 70 · hache 60 · machette 50 · couteau 40 · épieu 30 · gourdin 25.
- Sous 30 % : **abîmée** (dégâts −30 %), avec un **signal sonore et visuel** au passage. À 0 : **cassée** (un débris, démontable). Une visite complète use environ une arme : bonne pression.
- **Réparer** : à l'établi (bois), à la meule (lames, ⚙️), à la forge (métal, 🔥) ; et une **réparation de fortune** pour toutes les familles (ficelle, chiffons), qui remonte jusqu'à « abîmée » seulement. Personne n'est bloqué ; les familles s'échangent la vraie réparation.
- La solidité s'affiche dans le sac, en barre.

### 4.4 Repousser : B selon la situation

- **Un Éteint à 1,2 m ou moins devant soi** : B **repousse** (12 d'endurance ; recul de 1,5 m ; étourdi 0,8 s ; jusqu'à **2 Éteints** dans un cône de 90°). C'est l'**outil contre l'encerclement**.
- **Sinon** : B **esquive**.
- **Saisi** : on ne frappe plus (pas d'amplitude). **A et B se dégagent** : **deux appuis** par Éteint qui tient, même essoufflé (0.8.4). Aucune arme ne libère d'un coup, la décharge non plus.
- (Pas de « B maintenu » : il faudrait attendre pour savoir, et l'esquive arriverait en retard.)

### 4.5 Ce qui rend le combat juste

- **La fenêtre de frappe** (≈ 1,1 s entre l'allonge d'une hache et la saisie d'un poursuivant) est à **mesurer** ; si elle est trop courte, la saisie passe à 0,8 s face à une arme levée.
- **Un indicateur au bord de l'écran** pour les Éteints qui approchent hors champ (première cause probable de mort injuste en vue isométrique sur iPhone).
- **Les yeux blancs se voient dans le noir** à ≈ 6 m, sans lumière.
- **À terre ou détruit, ça se lit au corps (0.9)**, sans barre de vie : à terre, l'Éteint remue, gémit et prend appui juste avant de se relever ; détruit, il est inerte, les yeux éteints, la peau gris cendre, et se fond dans le décor avant de s'effacer doucement.

### 4.6 Nouvelles armes (0.5)

| Arme | Type | Dégâts | Vitesse | Allonge | Origine |
|---|---|---|---|---|---|
| **Pied-de-biche** (le vestige devient une arme) | Contondant | Bons | Moyenne | Moyenne | Vestige ; garanti au libre-service ; ouvre caisses et portes |
| **Machette** | Tranchant | Bons | Rapide | Moyenne | Atelier |
| **Masse** | Contondant | Très forts | Lente | Moyenne | Atelier |
| **Lance** (épieu + couteau + ficelle, évolution P-002) | Perçant | Bons | Moyenne | Longue | Fabriquée |

(Fourche, batte : plus tard.)

### 4.7 Les leurres dès la 0.5 : dans le décor

Le leurre est l'arme reine de la coopérative ; il ne peut pas attendre la 0.6. Trois leurres **posés dans le décor** :
- le **klaxon du tracteur** : il **vide la batterie de tracteur** (un vrai dilemme pour ⚡ et ⚙️) ;
- la **sonnette du quai** ;
- une **radio à piles** sur l'établi (elle se transporte et se pose).

## 5. Les armes de lancer (0.6)

- **L'objet rapide** (Book 08 §3.3) : dans le sac, « **Prêt à lancer** » sur un objet lançable. Il s'affiche près de A.
- **Lancer** : ordinateur **G** ou clic du milieu ; téléphone : un **troisième bouton** ; manette : la gâchette. **Maintenir** fait apparaître un **arc au sol** ; relâcher lance.
- **Viser** : une arme qu'on lance s'accroche à l'Éteint le plus proche devant soi (sur ordinateur : la souris) ; un **leurre** vise par défaut **un point au sol à 8 m devant soi**, que le pouce ajuste.
- **Le serveur décide** : il vérifie l'objet prêt, la cadence et l'angle, borne la distance, cherche **le premier mur sur la trajectoire** (on ne lance pas par-dessus un rayonnage de 4 m), juge l'impact contre la position réelle de l'Éteint, et pose l'objet au sol pour qu'on le ramasse.

| Objet (0.6) | Portée | Dégâts | Effet | Après |
|---|---|---|---|---|
| **Pierre** | 8 m | Faibles | **Étourdit** 1 s, **sur n'importe quel impact** ; bruit à l'impact (leurre) | Au sol, ramassable |
| **Réveil** (vestige) | 10 m | — | **Leurre** : sonne 20 s, attire les Éteints proches | Au sol ; il se reprend |
| **Hachette** | 10 m | Bons | Tue un Errant sur un coup heureux | **Il faut aller la reprendre** |

(Fronde, épieu lancé, poupée qui parle : plus tard.)

## 6. Les commandes, en résumé

| | Ordinateur | Téléphone |
|---|---|---|
| Frapper / coup appuyé | A (E, clic) / maintenir | A / maintenir |
| **B selon la situation** : repousser (au contact) / esquiver / se dégager (saisi) | B (F, clic droit) | B |
| **Lancer** (0.6) | **G** ou clic du milieu (maintenir : viser) | **Bouton Lancer** (maintenir : viser) |
| Choisir l'arme, l'objet à lancer | Sac | Sac |

## 7. La construction technique (relecture de l'architecte)

- **Un « lieu vivant » réutilisable** : on extrait de la halte (`serveur/src/halte.ts`) ce qu'elle sait faire (ressources, Éteints, sacs, présents, envoi filtré) ; la station devient un lieu vivant partagé, la coopérative un lieu vivant **par joueur**. Le jour où on la partage, on ne change que la clé.
- **Un registre de lieux** (`commun/src/lieux.ts`) remplace les cas particuliers ; les routes deviennent un petit graphe (terrain → station → Carrefour → coopérative).
  - *0.7.3 :* le graphe est écrit tel quel (`TRONCONS` : terrain–station 3 km, station–Carrefour 2 km, station–Coopérative 2 km, Carrefour–Coopérative 3 km). L'étape vers un lieu est le premier voisin sur le plus court chemin (`etapeVers`), et la distance est la plus courte (`distanceKm`). Une sortie peut mener à plusieurs lieux (`aussi` : le portail de la Coopérative).
- **Le plan est une donnée** (`commun/src/cooperative.ts`) : murs, **pièces et portes**, zones sombres, avec une **grille d'obstacles** (cases de 4 m) pour que les collisions restent bon marché.
- **L'IA dans un bâtiment** :
  - **les murs arrêtent le son et la vue** (son atténué d'une pièce à l'autre selon que la porte est ouverte ; vue limitée à la pièce) ;
  - **l'obscurité est locale** (`obscur(x, z)` au lieu du seul « il fait nuit ») ;
  - **les Éteints passent par les portes** (un petit graphe des portes) : sans cela, un leurré resterait collé au mur. **C'est le risque n° 1** ;
  - groupe, variante et ce qu'ils portent deviennent des champs de l'Éteint ; la cascade passe par le gémissement.
- **Le coût sur le Pi** : 24 Éteints ≈ 1 % d'un cœur par joueur présent. On le borne : IA à 10 Hz, **2 Hz** pour les dormants et les Éteints loin de tout joueur ; on n'envoie que les Éteints **qui ont bougé et que le joueur perçoit** (cela empêche aussi de « voir dans le noir » en trichant) ; un réglage `cooperatives_actives_max` ; un scénario **« 10 joueurs en coopérative »** au banc de charge, avec un seuil de p99 < 25 ms.
- **La persistance** : une table des instances (graine, version, dernière mise à jour, coffre) et des Éteints d'instance ; le butin réutilise les ressources de lieu. On sauve à chaque destruction, en sortant, et toutes les 30 s ; on ne garde ni l'attention ni le but (au retour, chacun reprend sa place).
- **Le rendu sur iPhone 13** : bâtiments et toits qui s'effacent généralisés (`rendu/batiments.ts`) ; rayonnages et palettes en lots ; ≈ 150 appels de dessin au plus ; la lampe éclaire à courte portée (≈ 7 m) ; une ombre de lampe seulement en qualité haute.
- **La vue par pièce (0.7.2, §2.4)** :
  - **un plan de vue partagé** (`commun/src/vue.ts`, `vue-lieux.ts`) : les murs de plus de 1,2 m percés de leurs fenêtres, les portes fermées ; un seul test en ligne droite pour ce que le serveur envoie, ce que voient les Éteints et ce que l'écran éclaire ;
  - **côté serveur** : le fil des bruits des Éteints cachés (`commun/src/bruits.ts`), envoyé 5 fois par seconde avec les Éteints ; envoi immédiat à l'ouverture d'une porte ; banc « 10 joueurs en Coopérative » inchangé (4 à 5 % d’un cœur du Mac avant comme après, p99 7,5 à 8,6 ms ; les bruits ajoutent ≈ 0,5 Ko/s par joueur) ;
  - **côté écran** : une carte de vue au sol (`rendu/carte-vue.ts`), dessinée seulement quand la vue change, lue par un greffon de nuanceur sur les matériaux du lieu (les lots le reconnaissent) : **aucun appel de dessin de plus** par image (55 et 70 appels mesurés, avant comme après) ; ondes en un seul maillage instancié, seulement quand on entend quelque chose.

## 8. Les étapes

| Étape | Contenu | Tests |
|---|---|---|
| **0.5a** | Lieu vivant extrait, registre de lieux | Les tests de halte et de voyage passent sans changement ; deux joueurs ne voient pas les Éteints l'un de l'autre |
| **0.5b** | Le plan en données : murs, pièces, portes, zones sombres, grille | Pas de traversée de mur ; passage d'une porte de 1,2 m ; porte fermée infranchissable |
| **0.5c** | IA : murs, obscurité locale, portes, cascade, groupes, variantes, retour en zone | Un dormant n'entend pas à travers un mur ; la cascade se propage ; un groupe suit ; le leurre fait **sortir** la chambre froide **par la porte** |
| **0.5d** | Persistance et renouvellement | Un Éteint détruit le reste ; repeuplement après N nuits ; le butin rare ne revient pas avant son délai |
| **0.5e** | Type de dégât (le casque), usure et réparation, B selon la situation, nouvelles armes, leurres du décor | Le combat, chiffré |
| **0.5f** | Rendu : le bâtiment, l'obscurité, l'indicateur hors champ, les yeux dans le noir | Images/s sur iPhone 13 |
| **0.5g** | Banc de charge | p99 < 25 ms à 10 joueurs en coopérative |
| **0.6a** | Lancer : message, projectiles, objet prêt | Refus sans objet, distance bornée, cadence, mur avant la cible, objet ramassable |
| **0.6b** | Pierre, réveil, hachette | Le réveil vide la chambre froide par la porte |
| **0.6c** | Client : bouton Lancer, arc, visée | Erreurs de bouton en jouant aux pouces (enfants compris) |

**Graphismes** (agent graphisme, planches) : le bâtiment et ses zones, les tracteurs, les silos, l'Éteint casqué, le magasinier, les nouvelles armes en main, les leurres, l'indicateur hors champ, l'arc de visée.
**Son** (session son) : portail, sonnette, klaxon, radio, gémissement de réveil, raclement du Rampant, coup qui rebondit sur un casque, impact de pierre sur tôle.

## 9. Les tests de jeu (et leurs cibles)

| Test | Cible |
|---|---|
| Maquette grise, Errants seuls, sur iPhone 13 : saisies venues de hors champ | < 10 % des saisies |
| Coup appuyé à la hache face à un poursuivant | ≥ 60 % de réussite (joueur moyen) |
| Un bruit dans le hangar : groupes mis en marche | 1 |
| Chambre froide : par discrétion ou leurre / en fonçant | ≥ 50 % / ≤ 20 % de réussite |
| Encerclé par 3, avec repousser | ≥ 40 % de survie |
| Effondrement à la première visite | 30 à 50 %, et **aucune cause au-dessus de 40 %** |

## 10. Questions ouvertes

- [ ] Les nombres (Éteints, butin, renouvellement) : à régler en jouant (réglages à chaud).
- [ ] La coopérative partagée plus tard : rencontres, entraide, concurrence ?
- [ ] La batterie de tracteur : bonne récompense pour ⚡ et ⚙️, ou trop forte ?
- [ ] La liste exacte des pièces rares de la chambre froide.
- [ ] L'étage des bureaux et le point haut des silos : quand ?

---

## 11. La Coopérative du niveau 1 (0.8, 2026-10-10)

*Plan 0.8 §2.5, §9.1 (N1) et §9.2 ; **codé en 0.8** (chantier 10, `commun/src/cooperative.ts`, `serveur/src/cooperative.ts`).*

Depuis la 0.8, la Coopérative est **L1A**, le lieu personnel de la **route A** du niveau 1 (Book 20 §1 quater bis). Sa promesse sur la carte : « La Coopérative : le feu et l'eau. » Elle porte **trois clés à place fixe**, communes à toutes les familles (« rien de propre à une famille en L1 ») :

| Clé | Où | Pour quel meuble (Book 24 §12) |
|---|---|---|
| **Rouleau de grillage** | Contre un piquet du **parc à volailles**, dans la cour des silos (un enclos dont le grillage est tombé) | Le **foyer de cuisine** |
| **Cocotte en fonte** | En tête de gondole, au **libre-service** | La **marmite norvégienne** |
| **Seaux de 10 L** | La **laiterie** | Le **récupérateur à seau** (10 L) |

- **La chambre froide devient la laiterie** (I8) : ses roulements et l'alternateur de tracteur sont **retirés** (ils ne débloquaient rien avant le niveau 2) ; ses seaux de 10 L sont une clé. La pièce reste noire, avec ses deux portes et ses dormants.
- **Tout revient à 24 h** (décision N1 du porteur, R51) : 24 h après qu'on l'a trouvée pleine, la Coopérative revient **entière** — les Éteints, le butin, les clés à place fixe, les portes, la batterie du tracteur et la radio. **Le repeuplement partiel** (3 Éteints toutes les 12 h, §2.3 et en-tête) **n'existe plus** ; le grillage, qui revenait en 4 jours, revient à 24 h comme le reste.
- **Une fois par personnage** : le **pied-de-biche** garanti sous la caisse ne se trouve qu'une fois (comme la fourche à foin du Moulin).
- **Ce qui reste** : la masse (Q-0.8-5 : une arme trouvée, elle reste), la machette, la clé plate, la haie d'ifs, les bâches, la corde, les conserves, le coffre du directeur (semences, trois manuels), la batterie du tracteur.
- **Ailleurs, rarement** : une clé de L1 sort d'une fouille à la station, au gué ou au Moulin avec 2 % de chances (R-BUTIN). **Le Comptoir** les vend 500 wotts, **une fois la Coopérative visitée** (avant, il les masque).
- **À la première visite**, les trois clés sont à leur place : on bâtit au retour le foyer de cuisine, la marmite et le récupérateur à seau (critère de fin de la 0.8, Book 21 §3.10).

## 12. Le Moulin du Gué, l'autre lieu du niveau 1 (0.8, 2026-10-10)

*Plan 0.8 §10.1 (étude `h1b-l1b-conception.md`, propositions M1 à M35), B11, B17, N1 ; **codé en 0.8** (chantier 12, `commun/src/moulin.ts`, `serveur/src/moulin.ts`, `commun/src/eteints-moulin.ts`). Le modèle 3D est celui de la session « bâtiments » (`batiment/moulin/`).*

**L1B**, le lieu personnel de la **route B** (Book 20 §1 quater bis), à 2 km du Gué-aux-Saules. Sa promesse : « Le Moulin : le couchage, le stockage, l'établi. » **Un par joueur**, comme la Coopérative, et le combat du niveau 1 y est du même rang.

- **Le parcours** : on arrive par le **pont de pierre** ; la **grosse clé** pend au tableau de l'atelier, dans les **dépendances** juste après le pont, gardée par deux dormants ; elle ouvre la **grande porte** de la salle des meules, qui reste ouverte une fois déverrouillée. Puis le **couloir du rouet**, un goulet le long de la fosse (on peut **y repousser un Éteint**) ; les **meules nord** ; le **magasin** (cinq dormants dont un Équipé) ; le **jardin clos**. On repart par la **planche du bief** et le **chemin de halage**, une sortie à sens unique (on n'arrive jamais par là).
- **Les clés à place fixe** : la **toile de jute** (les sacs à farine du magasin) pour l'**abri fermé** ; les **feuillards** (les cercles des barils à farine) pour le **coffre cerclé** ; l'**étau** (l'établi du rhabilleur, aux meules) pour l'**établi à étau**.
- **Le reste** : la **fourche à foin**, dans l'étable, **une fois par personnage** (une arme trouvée, Book 25 §13.3) ; un **if** au bord du bief (un bâton d'if) ; les **poutres de chêne** de l'atelier : **2 bûches garanties**, de quoi cercler le coffre sur place (B11).
- **Les Éteints** : **22, dont 9 dormants** (B17 demandait 18 à 24 ; le modèle n'en avait que 4), dans l'atelier, les meules, le magasin, l'étable, le logis et sur le pont. Les pièces sombres le sont vraiment ; la vue par pièce (§2.4) s'y applique, et les pièces jamais visitées sont assombries, jamais noires.
- **Tout revient à 24 h**, comme à la Coopérative : Éteints, butin, clés garanties ; la grosse clé retourne au tableau et la grande porte se referme. La fourche, elle, ne revient pas.
- **Gardé pour plus tard** : la **roue à restaurer** (« objectif des Mécanistes » dans le modèle), au niveau 3 : au niveau 1, rien n'est propre à une famille.
- **Rien au-delà** : aucun panneau n'annonce de lieu plus loin que le Moulin (Book 20 §1 quater bis).
