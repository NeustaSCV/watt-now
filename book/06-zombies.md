# Book 06 — Les Zombies

> Document de conception · version 0.7 · 2026-10-09
> Statut : **brouillon de travail**. Valeurs indicatives, à calibrer en playtest.
> v0.7 (2026-10-09) : §8.2 et §9.3 alignés sur le [Book 25](25-le-metier-des-familles.md) : l'arc pour tous, l'arbalète mécaniste, l'arme électrique qui raidit puis détruit (le casque n'y change rien), la clôture qui raidit sans détruire, l'arme à feu reportée après la 1.0, le bruit d'un coup tranchant à 10 m.
> S'appuie sur les books [01](01-les-trois-feux.md) (signature, monde, temps), [02](02-crafting.md) (bruit des outils) et [05](05-sante-et-soins.md) (morsure, infection).

---

## 1. Principes

1. **Un zombie seul n'est presque jamais dangereux.** Il est lent, bête et fragile. Le danger vient du **nombre** et de la **situation** : être encerclé, saisi, surpris, épuisé.
2. **Les zombies ne viennent pas par hasard.** Ils répondent à la **signature** (Book 01 §2). Chaque horde qui arrive a une cause, que le joueur peut comprendre.
3. **La signature est une ressource qu'on dépense.** Faire du bruit, de la fumée ou de la lumière, c'est accepter d'attirer. Le joueur choisit quand, où et combien.
4. **Les zombies obéissent à des règles simples et constantes.** Pas de mutants, pas de pouvoirs. Ils restent des corps humains abîmés, soumis au froid, à la décomposition et aux obstacles.
5. **Les zombies font partie de l'écologie du monde.** Ils se déplacent, se regroupent, se décomposent, gèlent l'hiver. Ils portent encore ce qu'ils avaient de leur vivant.

---

## 2. Le corps du zombie

### 2.1 Capacités

| Capacité | Valeur | Comparaison |
|---|---|---|
| **Vitesse de marche** | ≈ 0,6 m/s | Un humain marche à ≈ 1,4 m/s et court à ≈ 3 à 4 m/s |
| **Vitesse en poursuite** | ≈ 0,9 m/s (traîne les pieds plus vite) | Un humain qui marche vite les distance |
| **Ouïe** | **Sens principal** | Réagit à la signature sonore (Book 01 §2) |
| **Odorat** | Bon | Fumée, cuisson, **sang**, sueur |
| **Vue** | **Mauvaise** | Perçoit le mouvement à courte distance (≈ 10 à 15 m le jour) et la lumière la nuit |
| **Force** | Celle d'un adulte, sans fatigue | Dangereuse seulement s'il **saisit** |
| **Intelligence** | Nulle | N'ouvre pas les portes, ne grimpe pas, n'utilise pas d'outils, ne contourne pas un obstacle |
| **Endurance** | Infinie | Ne se lasse jamais d'un stimulus tant qu'il dure |

### 2.2 Fragilité

| Zone frappée | Effet |
|---|---|
| **Tête** | Un coup solide (marteau, hache, machette, carreau) **le détruit** |
| **Torse** | Plusieurs coups : il tombe, puis se relève lentement… s'il n'est pas achevé |
| **Au sol** | **N'importe quel coup l'achève**, même au couteau ou aux poings : la tête est à portée |
| **Jambe** | Un coup solide la brise : il devient **rampant** |
| **Bras** | Un coup solide le brise : il ne peut plus saisir de ce côté |
| **Le courant** | Il ne sent pas la douleur, mais ses muscles obéissent encore aux nerfs : une décharge le fait **lâcher** et le **raidit** ; maintenue, elle le couche. Tenue une seconde à la tempe d'un Éteint raidi ou à terre, elle **grille ce qui l'anime** : il s'éteint (Book 25 §5.1). Le casque n'y change rien |

> **Décision (2026-10-08) : on achève un Éteint à terre.** Tomber ne suffit pas : il se relève au bout de quelques secondes (5 s en 0a). Pendant ce temps, n'importe quel coup le détruit. Le combat de base devient : le faire tomber, puis l'achever vite. Le coup appuyé à la tête avec une arme solide reste le seul moyen de le détruire debout.

> Les zombies sont **fragiles** parce que leurs corps sont en décomposition : os friables, muscles abîmés. Une arme lourde et simple suffit. Ce qui coûte, c'est l'**endurance** du joueur et l'**usure** des armes à chaque coup.

### 2.3 La saisie : le vrai danger

Le zombie n'attaque pas comme un combattant. Il **attrape**, puis il **mord**.

| Situation | Conséquence |
|---|---|
| Un zombie saisit le joueur | Le joueur est **ralenti**. Il doit se dégager (test de FOR et d'END) ou tuer le zombie. Au bout de quelques secondes : **morsure**. |
| Deux zombies saisissent | Le joueur est **immobilisé**. Se dégager devient très difficile. |
| Trois zombies ou plus | **Effondrement** quasi certain (Book 05 §10). |

> **Règle d'or du joueur :** ne jamais se laisser encercler. Un couloir, une porte, un fossé valent mieux qu'une bonne arme.

---

## 3. La perception : comment la signature attire

### 3.1 L'attention d'un zombie

Chaque zombie a une **jauge d'attention**. Elle se remplit quand il perçoit un stimulus, et se vide quand le stimulus cesse.

```
chaque seconde, pour chaque stimulus perçu :
    attention += intensité × (1 − distance / portée)

sans stimulus :
    attention −= oubli
```

| Seuil d'attention | Comportement |
|---|---|
| Faible | Le zombie **s'oriente** vers la source |
| Moyen | Il **se déplace** vers la source |
| Contact visuel avec un humain | Il **poursuit** |
| Stimulus perdu | Il continue vers le dernier point perçu, puis **erre** autour |

**Ce que ça implique :**

- **Le bruit bref et fort** (coup de feu) fait tourner toutes les têtes d'un coup, mais l'attention retombe si rien ne suit.
- **Le bruit faible mais long** (une lime pendant des heures, une charbonnière qui fume trois jours de jeu, soit 1 h 12 réelle) remplit lentement l'attention des zombies, de plus en plus loin.
- Ce qui compte, c'est **l'intensité multipliée par la durée** (Book 02 §7).

### 3.2 Ce qui modifie la portée

| Facteur | Effet |
|---|---|
| **Vent** | Odeurs portées **×2 sous le vent**, ×0,3 contre le vent |
| **Pluie** | Bruits −30 %, odeurs −50 % : **la pluie est une alliée** |
| **Nuit** | La lumière porte **×3** ; un feu se voit de très loin |
| **Bâtiments, relief** | Atténuent le bruit, bloquent la lumière |
| **Blessure** | Un joueur qui **saigne** émet une signature olfactive (≈ 30 m) |
| **Hygiène** | Un joueur très sale (sueur, sang séché) sent plus fort (Book 05 §3) |

### 3.3 Le compteur de signature du joueur

Le joueur voit en permanence **sa propre signature** : un cercle au sol, discret, qui montre jusqu'où porte ce qu'il fait (marcher, courir, frapper, forger, tirer). C'est l'outil le plus important pour apprendre à jouer.

---

## 4. Les comportements

| État | Description | Déclencheur |
|---|---|---|
| **Dormant** | Immobile, souvent dans un bâtiment (pièce fermée, véhicule). Invisible tant qu'on ne s'approche pas. | Par défaut dans les ruines |
| **Errant** | Dérive lentement, sans but | Pas de stimulus |
| **Attiré** | Marche vers une source | Attention moyenne |
| **Poursuivant** | Suit un humain vu | Contact visuel |
| **Grégaire** | Suit les zombies qui se déplacent autour de lui | Un voisin qui bouge **compte comme un stimulus** faible |
| **Pressant** | Pousse contre un obstacle (mur, porte) sans pouvoir passer | Obstacle sur le chemin |

**Le comportement grégaire** explique la formation des hordes : quelques zombies attirés en entraînent d'autres, qui en entraînent d'autres. Un bruit au mauvais endroit peut mettre en mouvement tout un quartier.

**Les dormants** rendent la fouille tendue : ouvrir une porte dans une ruine, c'est peut-être réveiller ce qui dort derrière.

---

## 5. Les variantes

Pas de mutants : seulement des corps différents, selon ce qu'ils ont vécu et l'état où ils sont.

| Variante | Particularité | Danger | Ce qu'il porte |
|---|---|---|---|
| **Errant** | Le zombie ordinaire | Faible seul | Vêtements, petits objets |
| **Rampant** | Jambes brisées, au sol, **caché dans les herbes ou sous un véhicule** | Morsure aux chevilles, surprise | — |
| **Putréfié** | Très décomposé, surtout l'été. Se désagrège presque au contact. | **Fluides infectieux** : risque d'infection au corps à corps (Book 05 §5) | Rien d'utile |
| **Gelé** | L'hiver, raide et presque immobile. Se réveille au dégel ou près d'une source de chaleur. | Faible, mais peut surprendre près d'un feu | — |
| **Équipé** | Mort avec une protection : casque de moto, tenue de pompier, gilet | **Résiste aux lames** à la tête : il faut une arme contondante ou viser autrement | **Butin intéressant** : l'équipement lui-même |
| **Ancien habitant** | Zombie qui portait son métier : infirmière, mécanicien, chasseur | Comme un errant | **Vestiges** liés au métier (médicaments, outils, munitions) |

> **Les zombies sont aussi des vestiges.** Ce qu'ils portent raconte qui ils étaient, et peut valoir la peine du combat.

---

## 6. Les hordes

### 6.1 Tailles

| Nom | Nombre | Comment s'en sortir |
|---|---|---|
| **Groupe** | 3 à 10 | Combat possible en choisissant le terrain |
| **Meute** | 10 à 30 | Éviter, détourner, ou combattre à plusieurs avec des défenses |
| **Horde** | 30 à 100 | Ne pas combattre de front : défenses, entonnoirs, feu, leurres |
| **Migration** | 100 et plus | Se déplace sur la **carte du monde**. On l'évite, on la détourne, on se barricade. |

### 6.2 Les deux échelles d'attraction

| Échelle | Où | Ce qui se passe |
|---|---|---|
| **Locale** | Dans une map (lieu, halte, terrain) | Les zombies présents réagissent à la signature en temps réel (§3) |
| **Régionale** | Sur la carte du monde | Les hordes errantes **dérivent** vers les lieux qui ont émis le plus de signature récemment |

**La pression de signature d'un terrain** est la somme de ce qu'il a émis (intensité × durée) sur les derniers jours (calendrier), avec un oubli progressif. C'est l'un des critères qui font varier la **probabilité** d'une attaque du terrain (§9.1). Elle ne décide pas seule, et la taille de l'attaque reste liée au niveau du joueur.

| Activité sur le terrain | Pression |
|---|---|
| Vie normale (feu de cuisine, outils manuels) | Faible |
| Forge régulière, outils électriques | Moyenne |
| Charbonnière (3 jours de fumée), fonte au bas fourneau | Forte |
| Tirs répétés, incendie | Très forte |

> C'est la conséquence directe du triangle des familles : les **Charbonniers** génèrent plus de pression et doivent mieux défendre leur terrain ; les **Voltaïques** en génèrent peu ; les **Mécanistes** sont entre les deux (Book 01 §5).

---

## 7. Les saisons et les zombies

Le calendrier (1 saison = 1 semaine réelle) change le comportement des zombies, et donc le rythme du jeu.

| Saison | Zombies | Conséquence pour le joueur |
|---|---|---|
| **Printemps** | Dégel : les gelés se réveillent, les hordes de l'hiver se remettent en marche | Saison des hordes migrantes |
| **Été** | Actifs, mais se **décomposent vite** : plus de putréfiés, population qui baisse. L'odeur des zombies trahit leur présence. | Plus de risques d'infection, mais des zombies plus faciles à repérer |
| **Automne** | Équilibre. Les pluies atténuent la signature. | Bonne saison d'expédition |
| **Hiver** | **Ralentis de moitié**, beaucoup de gelés, peu de hordes | **Saison des expéditions lointaines**… mais il fait froid, et chaque feu se voit de loin (Book 05 §3) |

> **Exception de fin de cycle : le Grand Dégel.** Les zombies gelés pendant les deux hivers se réveillent tous ensemble à la fin du dernier hiver (Book 09 §1.1).

> L'hiver crée un dilemme intéressant : les zombies sont faibles, mais le froid est l'ennemi. Les Charbonniers, résistants au froid, sont les rois des expéditions d'hiver.

---

## 8. Combattre

### 8.1 Le coût d'un combat

Chaque zombie tué coûte :

- de l'**endurance** (END) : un joueur épuisé frappe mal et se dégage mal ;
- de l'**usure** d'arme (Book 02 §7) ;
- un peu de **bruit** (signature de l'arme) ;
- un **corps** à gérer (§8.3).

### 8.2 Les armes face aux zombies

| Arme | Efficacité | Bruit | Remarque |
|---|---|---|---|
| Marteau, masse, pied-de-biche | Très bonne à la tête | Moyen (un coup : 14 m) | Contondant : efficace même contre les **casqués** |
| Hache, machette, lames forgées (🔥) | Très bonne : la mise à mort la plus rapide | Moyen (un coup tranchant : 10 m) | S'émousse ; le **casque** l'arrête à la tête. Le forgeron la reprend et la reforge |
| Lance, pique | Bonne : **tient à distance** | Moyen | Idéale derrière une palissade |
| Arc (tous) | Bonne à la tête, au **tir plein** et de près (≤ 6 m à ★★★) | Très faible (3 m) | Flèches récupérables ; passe la visière d'un casqué de face, à moitié de la portée |
| Arbalète (⚙️) | Bonne à la tête, **avant le contact** (≤ 12 m à ★★★) | Faible (6 m) | Armée d'avance ; réarmer immobilise. Carreaux récupérables |
| Arme électrique (⚡) | Bonne, en deux temps : une décharge courte **raidit** et fait lâcher, une longue à la tête d'un raidi ou d'un Éteint à terre le **détruit** | Faible (6 à 8 m) | **Passe le casque** ; rien au torse ; consomme des Wh_é |
| Arme à feu (🔥) | Excellente | **Énorme** (300 m) | **Reportée après la 1.0** (Book 25 §12, n° 7) : chaque tir peut attirer plus de zombies qu'il n'en tue |
| Clôture électrique, plaque de choc (⚡) | **Raidit** et repousse, ou **couche** ; ne détruit pas | Nul (la clôture bourdonne) | Défense passive, consomme des Wh_é. Trois Éteints qui poussent ensemble couchent la clôture |
| Pièges (⚙️) : assommoir, mâchoires, fosse | **Couchent**, **brisent la jambe** (un Rampant), **retiennent** ; ne détruisent pas | Faible | Aucune énergie après la pose ; à réarmer |

Chaque famille a son terrain et aucune arme ne domine : le tableau chiffré, niveau par niveau, est au Book 25 §8.4.

### 8.3 Les corps

Un zombie détruit laisse un **corps** :

- il **pourrit** et attire les insectes : **risque sanitaire** près de l'eau et du terrain (Book 05 §6) ;
- son odeur n'attire pas les zombies, mais elle **masque** celle des vivants : voir **le camouflage d'odeur** (§8.5) ;
- on peut l'**enterrer** (travail) ou le **brûler** (combustible + fumée, donc signature).

### 8.4 Les morts qui se relèvent

**Tout humain mort dont la tête est intacte se relève** quelques heures de jeu plus tard (quelques minutes réelles). Cela concerne les **PNJ** (pillards, survivants) : un combat contre des pillards peut laisser derrière lui… de nouveaux zombies.

> Les joueurs ne sont pas concernés : leur « mort » est un **effondrement** (Book 05 §10).

### 8.5 Le camouflage d'odeur

**Validé.** Se rouler dans un cadavre de zombie (ou s'enduire de ses fluides) rend le joueur **moins repérable à l'odeur**.

| | Effet |
|---|---|
| **Gain** | Signature olfactive du joueur fortement réduite (≈ −70 %) : les zombies le sentent beaucoup moins, y compris quand il saigne ou qu'il est en sueur |
| **Durée** | L'effet s'estompe en ≈ 1 jour de jeu (≈ 24 min réelles) |
| **Prix** | **Hygiène au plus bas** jusqu'au prochain lavage : le risque d'infection de toute plaie est fortement augmenté (Book 05 §5). Il faut **se laver plus souvent** (eau, savon). |
| **Danger** | Une **plaie ouverte** au moment du camouflage s'expose directement aux fluides : risque d'infection très élevé |
| **Ce que ça ne fait pas** | Ne réduit ni le bruit ni la lumière. Un zombie qui **voit** le joueur bouger à courte distance réagit quand même. |

> C'est une technique de fouille et d'infiltration : idéale pour traverser une ruine dense en silence, mauvaise idée quand on est blessé. Elle donne une valeur de plus au savon et à l'eau propre.

---

## 9. Défendre son terrain

### 9.1 Les attaques sur le terrain : un désagrément, pas le cœur du jeu

Le terrain est protégé des joueurs, **pas des zombies**. Mais l'attaque du terrain reste un **désagrément** ponctuel : le cœur du jeu est ailleurs (survie, crafting, énergie, expéditions, commerce).

**Trois règles :**

1. **Elle n'est pas systématique.** Sa probabilité dépend de critères variables (ci-dessous).
2. **Sa force est proportionnelle au niveau du joueur.** Un nouveau joueur affronte quelques errants ; un joueur installé, un groupe ou une meute.
3. **Elle ne touche que les défenses** : pièges et protections de la base (§9.4).

**Le niveau du joueur** n'est pas un niveau d'expérience (le jeu n'en a pas). C'est un **indice de développement** du terrain, calculé à partir :

- des paliers atteints (I, II, III) ;
- de l'énergie grise totale des constructions et installations ;
- de la solidité des défenses en place.

**La probabilité d'une attaque** combine plusieurs critères, aucun ne décidant seul :

| Critère | Effet sur la probabilité |
|---|---|
| **Pression de signature** des derniers jours (§6.2) | ↑ quand elle est forte |
| **Saison** (§7) | ↑ au printemps (hordes en marche), ↓ en hiver (zombies gelés) |
| **Migrations proches** sur la carte | ↑ quand une migration passe dans la région |
| **Nuit** | ↑ la nuit (lumière visible de loin) |
| **Temps écoulé depuis la dernière attaque** | ↓ juste après une attaque (délai de répit garanti) |
| **Leurres et alarmes** (⚡ ⚙️) | ↓ : une horde détournée n'arrive pas |
| **Part de hasard** | Une petite part d'imprévu, pour que rien ne soit totalement prévisible |

```
probabilité = base
            × pression de signature × saison × migrations × nuit
            × répit depuis la dernière attaque × effet des leurres
            (bornée : jamais 0 %, jamais systématique)

force de l'attaque = f(niveau du joueur) × (1 + bonus si pression très forte)
```

> Un joueur prudent, discret et bien équipé en leurres sera rarement dérangé. Un Charbonnier qui fait tourner sa charbonnière et sa forge à plein régime le sera plus souvent. Personne n'est assiégé tous les jours.

### 9.2 Ce que peuvent et ne peuvent pas faire les zombies

| Ils peuvent | Ils ne peuvent pas |
|---|---|
| **Pousser** : un mur faible cède sous le nombre | Ouvrir une porte, une trappe, un loquet |
| S'**entasser** : contre un mur bas, les derniers montent sur les premiers | Grimper une échelle, une palissade haute |
| **Briser** une vitre, une porte légère, une haie | Nager (ils coulent, ou dérivent) |
| Tomber dans un **fossé** et y rester | Franchir un fossé profond |

### 9.3 Les défenses

| Défense | Matériaux | Contre | Famille la plus à l'aise |
|---|---|---|---|
| **Palissade** | Bois, cordes | Groupes, meutes | ⚙️ |
| **Mur maçonné** | Pierre, mortier de chaux (Book 02 §12.3) | Hordes | 🔥 |
| **Fossé, pieux** | Travail, bois | Tout : les zombies tombent et restent coincés | ⚙️ |
| **Entonnoir** | Murs + passage étroit | Hordes : on les affronte un par un | Tous |
| **Fosse à feu, braseros** | Combustible | Hordes : barrage et destruction (fumée = signature) | 🔥 |
| **Clôture électrique** | Fil, batteries, Wh_é | Groupes : défense silencieuse ; elle raidit et repousse, ne détruit pas | ⚡ |
| **Alarmes, capteurs** | Électronique (l'alarme électrique ne fait aucun bruit) | **Prévenir** avant l'arrivée | ⚡ |
| **Pièges mécaniques** | Bois, ressorts, contrepoids (assommoir, mâchoires, fosse) | Rampants, groupes : ils couchent ou retiennent ; à toi d'achever | ⚙️ |
| **Leurre** | Sonore (réveil, carillon) ou lumineux (projecteur) | Détourner une horde **avant** qu'elle arrive | ⚡ ⚙️ |
| **Baliste de rempart** | Bois, corde, acier | Meutes, hordes | ⚙️ (palier III) |

### 9.4 Le siège hors ligne

Puisque le joueur peut être hors ligne pendant qu'une attaque survient (le monde continue, Book 01 §2 bis), le siège hors ligne est **résolu automatiquement**, selon les règles du §9.1 :

- la force de l'attaque est comparée à la **solidité des défenses** (murs, fossés, pièges, clôtures, alarmes) ;
- **les dégâts se limitent aux pièges et aux protections de la base** : un piège se déclenche et doit être réarmé, une palissade est abîmée et doit être réparée. **Les installations, les stocks, les cultures et les processus en cours ne sont jamais touchés** ;
- **le personnage n'est jamais blessé hors ligne** : il est sur la carte (Book 01 §2 bis) ;
- au retour, le joueur trouve un **rapport** : ce qui est arrivé, ce qui a tenu, ce qu'il faut réparer ou réarmer.

> Le siège hors ligne coûte donc du **temps et des matériaux de réparation**, jamais la base elle-même. Lancer une charbonnière avant de se déconnecter augmente un peu le risque d'avoir des réparations à faire au retour, rien de plus.

---

## 10. La morsure

**Validé.** En V1, tous les joueurs sont concernés de la même façon. Les variantes selon le sang (Trois Sangs) sont reportées en V2 (Book 99).

Une morsure de zombie est d'abord une **plaie très souillée** (Book 05 §4.2) : risque d'infection très élevé, à traiter comme toute plaie.

En plus, elle peut transmettre la **fièvre grise**, l'infection propre aux zombies :

| Étape | Délai (horloge d'action) | Ce qui se passe | Ce qu'on peut faire |
|---|---|---|---|
| **Morsure** | — | Risque de transmission | **Nettoyage immédiat et profond** (eau bouillie, savon, alcool) dans les premières minutes : réduit fortement le risque |
| **Incubation** | Quelques heures de jeu | Aucun symptôme, ou fièvre légère | Repos, surveillance |
| **Fièvre grise** | Un à deux jours de jeu | Forte fièvre, faiblesse, odeur particulière : **les zombies réagissent moins à vous** | Soins intensifs (Médecine II–III), repos, eau. Les antibiotiques n'aident que contre l'infection de la plaie. |
| **Issue** | — | La plupart guérissent avec des soins ; sans soins, **effondrement** | — |

- **Hors ligne, la fièvre grise est gelée**, comme toute maladie (Book 01 §2 bis) : elle reprend à la reconnexion.
- La fièvre grise **ne transforme jamais un joueur en zombie**. Elle peut le tuer, au sens de l'effondrement.
- Elle prépare la **V2 et les Trois Sangs** (Book 99) : les **Porteurs** seraient ceux qui en sont sortis « stabilisés », avec une odeur qui trompe les zombies ; les **Immuns** ceux qu'elle ne touche pas.

---

## 11. Population et écologie

- **Chaque lieu a une densité de base** : faible dans les ruines proches et les lieux de flux, forte dans les ruines lointaines et les grandes villes.
- **Les zombies se décomposent** : chacun a une « durée de vie » de quelques saisons, plus courte l'été.
- **De nouveaux zombies arrivent** par les **migrations** venues de l'extérieur de la carte, et par les **PNJ morts** dont la tête est intacte (§8.4).
- **Nettoyer un lieu a un effet durable mais pas permanent** : les migrations finissent par le repeupler.

> Le monde n'est donc ni vidé pour toujours, ni rempli à l'infini. La pression zombie suit les saisons, les migrations et ce que font les joueurs.

---

## 12. Équilibrage

- **La plupart des effondrements doivent venir d'une erreur compréhensible** : trop de bruit, encerclement, épuisement, plaie négligée. Le joueur doit pouvoir dire « j'aurais dû… ».
- **La pression de signature doit compenser les familles** : les Charbonniers produisent plus, attirent plus, défendent mieux.
- **Le joueur prudent ne combat presque jamais une horde** : il l'évite, la détourne ou la laisse se briser sur ses défenses.
- **L'attaque du terrain reste un désagrément** : rare, proportionnée au niveau du joueur, limitée aux pièges et aux protections. Le danger zombie se vit surtout **dehors**, en expédition (§9.1).
- **Les zombies ne doivent jamais être une simple corvée** : chaque rencontre doit offrir un choix (combattre, éviter, détourner, piller).

---

## 13. Questions ouvertes

- [x] **Fièvre grise :** ✅ validée (§10). Variantes par sang en V2 (Book 99).
- [x] **Leurres et autres joueurs :** ✅ on peut attirer volontairement une horde vers d'autres joueurs, partout où le combat entre joueurs est autorisé (haltes, ruines, lieux de flux). Jamais vers un terrain.
- [x] **Siège hors ligne :** ✅ dégâts limités aux pièges et protections ; force proportionnelle au niveau du joueur ; un désagrément non systématique (§9.1, §9.4).
- [ ] **Indice de développement :** valider sa composition (paliers, énergie grise des constructions, défenses) et la courbe « niveau → force de l'attaque ».
- [ ] **Probabilité d'attaque :** calibrer les critères (§9.1) et le délai de répit. Cible indicative : une attaque toutes les quelques sessions pour un joueur moyen, jamais deux de suite.
- [x] **Se masquer avec l'odeur des morts :** ✅ retenu en V1, accessible à tous (§8.5). En V2, capacité naturelle des Porteurs (Book 99).
- [ ] **Animaux :** chiens, rats, corbeaux, gibier ? Les animaux réagissent-ils aux zombies, peuvent-ils servir d'alarme ?
- [ ] **Densités et vitesses :** valeurs à calibrer en playtest.

---

## Glossaire

- **Attention** : jauge propre à chaque zombie, qui se remplit avec les stimuli et décide de son comportement.
- **Saisie** : un zombie qui attrape le joueur. C'est la cause principale des morsures.
- **Pression de signature** : somme de la signature émise par un terrain ou un lieu sur les derniers jours (calendrier). Elle attire les hordes de la carte.
- **Dormant** : zombie immobile, caché dans un bâtiment, qui se réveille au bruit ou à l'approche.
- **Fièvre grise** : infection propre aux zombies, transmise par morsure.
- **Siège hors ligne** : attaque d'un terrain pendant l'absence du joueur, résolue automatiquement.
