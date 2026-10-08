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
> **Reste de la 0.5e** :
>   - la batterie du tracteur à emporter (le vrai dilemme ⚡ ⚙️ du klaxon) ;
>   - la radio qu'on transporte ;
>   - le débris d'une arme cassée ;
>   - mesurer la fenêtre de frappe (§4.5) ; le rendu 3D du lieu est fait et allégé (ombres cuites, carte réduite).
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

### 4.3 L'usure

- L'usure se compte **pour l'arme en main** de chaque type (l'inventaire compte des objets, pas des exemplaires) : quand elle casse, on en perd une et la suivante est neuve.
- **Solidité, en coups qui touchent** : pied-de-biche 120 · marteau 80 · masse 70 · hache 60 · machette 50 · couteau 40 · épieu 30 · gourdin 25.
- Sous 30 % : **abîmée** (dégâts −30 %), avec un **signal sonore et visuel** au passage. À 0 : **cassée** (un débris, démontable). Une visite complète use environ une arme : bonne pression.
- **Réparer** : à l'établi (bois), à la meule (lames, ⚙️), à la forge (métal, 🔥) ; et une **réparation de fortune** pour toutes les familles (ficelle, chiffons), qui remonte jusqu'à « abîmée » seulement. Personne n'est bloqué ; les familles s'échangent la vraie réparation.
- La solidité s'affiche dans le sac, en barre.

### 4.4 Repousser : B selon la situation

- **Un Éteint à 1,2 m ou moins devant soi** : B **repousse** (12 d'endurance ; recul de 1,5 m ; étourdi 0,8 s ; jusqu'à **2 Éteints** dans un cône de 90°). C'est l'**outil contre l'encerclement**.
- **Sinon** : B **esquive**.
- **Saisi** : taper B vite **se dégage**.
- (Pas de « B maintenu » : il faudrait attendre pour savoir, et l'esquive arriverait en retard.)

### 4.5 Ce qui rend le combat juste

- **La fenêtre de frappe** (≈ 1,1 s entre l'allonge d'une hache et la saisie d'un poursuivant) est à **mesurer** ; si elle est trop courte, la saisie passe à 0,8 s face à une arme levée.
- **Un indicateur au bord de l'écran** pour les Éteints qui approchent hors champ (première cause probable de mort injuste en vue isométrique sur iPhone).
- **Les yeux blancs se voient dans le noir** à ≈ 6 m, sans lumière.

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
- **Le plan est une donnée** (`commun/src/cooperative.ts`) : murs, **pièces et portes**, zones sombres, avec une **grille d'obstacles** (cases de 4 m) pour que les collisions restent bon marché.
- **L'IA dans un bâtiment** :
  - **les murs arrêtent le son et la vue** (son atténué d'une pièce à l'autre selon que la porte est ouverte ; vue limitée à la pièce) ;
  - **l'obscurité est locale** (`obscur(x, z)` au lieu du seul « il fait nuit ») ;
  - **les Éteints passent par les portes** (un petit graphe des portes) : sans cela, un leurré resterait collé au mur. **C'est le risque n° 1** ;
  - groupe, variante et ce qu'ils portent deviennent des champs de l'Éteint ; la cascade passe par le gémissement.
- **Le coût sur le Pi** : 24 Éteints ≈ 1 % d'un cœur par joueur présent. On le borne : IA à 10 Hz, **2 Hz** pour les dormants et les Éteints loin de tout joueur ; on n'envoie que les Éteints **qui ont bougé et que le joueur perçoit** (cela empêche aussi de « voir dans le noir » en trichant) ; un réglage `cooperatives_actives_max` ; un scénario **« 10 joueurs en coopérative »** au banc de charge, avec un seuil de p99 < 25 ms.
- **La persistance** : une table des instances (graine, version, dernière mise à jour, coffre) et des Éteints d'instance ; le butin réutilise les ressources de lieu. On sauve à chaque destruction, en sortant, et toutes les 30 s ; on ne garde ni l'attention ni le but (au retour, chacun reprend sa place).
- **Le rendu sur iPhone 13** : bâtiments et toits qui s'effacent généralisés (`rendu/batiments.ts`) ; rayonnages et palettes en lots ; ≈ 150 appels de dessin au plus ; la lampe éclaire à courte portée (≈ 7 m) ; une ombre de lampe seulement en qualité haute.

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
