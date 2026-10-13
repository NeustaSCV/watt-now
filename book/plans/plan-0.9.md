# Plan de développement — version 0.9 : les autres joueurs fluides, un combat moins facile

*Version du plan : v0.2 · 2026-10-13 · **Statut : décidé, pas encore codé**.*

*v0.2 (2026-10-13) : le porteur tranche les six questions du §8 en suivant toutes les recommandations ; la version s'appellera **0.9**.*

*Elle vient après la 0.8.3 (en cours de codage dans une autre session). Code de départ : **0.8.2** (déployée), lu sans rien modifier. Source : les remarques du porteur du 2026-10-13 après avoir joué à plusieurs.*

---

## 0. En bref

- **Ce que livre la 0.9** :
  - on voit les autres joueurs **marcher et courir de façon fluide**, avec la bonne animation ;
  - on les voit **frapper, esquiver et faire leurs gestes** ;
  - **quand un Éteint nous tient, on ne peut plus frapper** : on se dégage ;
  - **l'Équipé (le casqué) ne se laisse plus bloquer** en martelant.
- **5 chantiers**, sans contenu nouveau dans le monde : ni lieu, ni arme, ni Éteint nouveau.
- **Le combat entre joueurs n'entre pas** (décision du porteur, 2026-10-13). Il viendra dans une version ultérieure. L'analyse et les questions à trancher sont gardées au §7.
- **Pas de remise à zéro** des joueurs : rien ne change dans les sauvegardes.

---

## 1. Le périmètre

### 1.1 Ce qui entre

| N° | Remarque du porteur | Réponse |
|---|---|---|
| M1 | « Un autre joueur dans une halte se déplace par à-coups, et je ne le vois pas marcher. » | Affichage légèrement différé et interpolé ; l'allure et les gestes transmis (chantiers 1 et 2) |
| M2 | « En martelant la touche d'attaque, l'Éteint ne nous touche jamais. Pour l'Éteint de base, ça peut aller (le danger, c'est la masse) ; pas pour le casqué. » | L'Équipé n'est étourdi qu'un coup sur deux (chantier 4, variante choisie par le porteur) |
| M3 | « Saisi, appuyer sur Frapper nous libère, alors qu'on n'a pas l'amplitude pour taper. Marteler la frappe sort de toutes les situations. » | Saisi, on ne frappe plus ; seul le dégagement libère (chantier 3) |

### 1.2 Ce qui n'entre pas

- **Le combat entre joueurs** : pas de frappe sur un joueur, pas de mode choisi diffusé, pas de halo (§7).
- **Le changement de la bascule automatique du mode Combat** : elle reste telle quelle. Le retour en Exploration après 3 s sans Éteint n'a d'effet gênant qu'avec le combat entre joueurs (§7.1).
- **L'Errant**, le Rampant, le Magasinier et le Mécanicien : leur étourdissement ne change pas. C'est la masse qui fait leur danger, et le porteur l'accepte.

---

## 2. Ce qu'on a trouvé dans le code (0.8.2)

### 2.1 Les autres joueurs (M1)

- **Le serveur** envoie les positions des autres joueurs environ 10 fois par seconde (`presences.ts`, message `positions` : `id, x, z, o`).
  - L'envoi part au premier tour de serveur (20 par seconde) où 100 ms sont écoulées (`monde.ts:211`). Le pas réel est donc **irrégulier : 100 ou 150 ms**.
  - Il n'envoie **ni l'allure, ni les gestes** (frappe, esquive, ramassage…).
- **Le client** (`rendu/autres.ts:75`) fait glisser le personnage vers la dernière position reçue, de façon exponentielle. Il n'y a ni horodatage ni tampon.
  - Le glissement est rapide juste après un paquet, puis ralentit jusqu'au suivant : le mouvement avance **par à-coups**.
- **L'animation** est choisie d'après la vitesse mesurée image par image (`personnage.ts:629`) :
  - moins de 1,7 m/s : marche accroupie ;
  - moins de 3,4 m/s : marche ;
  - au-delà : trot.
- **Pourquoi on ne voit pas la marche** : pendant une marche à 2,4 m/s, la vitesse mesurée oscille entre 3,6 et 1,4 m/s à chaque paquet. Elle franchit donc deux seuils toutes les 100 ms. Chaque changement relance le clip au début avec un fondu de 0,25 s (`humanoides.ts:780`) : **aucun pas ne se déroule**.
- **Les Éteints paraissent fluides** avec le même mécanisme parce qu'ils sont lents et n'ont qu'un clip de marche, dont seule la vitesse varie. Il n'y a pas de meilleur mécanisme à reprendre ailleurs.

### 2.2 La saisie (M3)

- `cibleDevant` (`joueur.ts:1097`) : « celui qui nous tient se frappe toujours, même dans le dos ».
- `encaisser` (`eteints.ts:281`) remet à zéro la saisie (`saisit = null`), la tenue et le contact. **Un seul coup libère**, alors que le dégagement prévu (Book 08 §3.3, Book 23 §4.4) demande **6 appuis rapides sur B** par Éteint qui tient, et 1,5 fois plus si l'on est épuisé.

### 2.3 Le martèlement (M2)

- **L'attaque de l'Éteint** : il lui faut 0,6 s au contact pour saisir, puis 3 s de saisie pour mordre.
- **Chaque coup** :
  - l'**étourdit 1,2 s** (1,8 s avec un contondant) ;
  - le **fait reculer de 0,6 m** ;
  - **remet son contact à zéro** (`eteints.ts:278-309`).
- Il lui faut donc environ 2,2 s pour revenir et saisir. Or toutes les armes refrappent en 0,38 à 0,95 s : **il est bloqué en permanence**.
- **L'Équipé** existe déjà (`variante: "equipe"`). Il encaisse un coup de plus au torse, et le tranchant ne le tue pas à la tête. Il est en revanche **étourdi exactement comme les autres**.
- **L'endurance ne limite pas le martèlement** : à bout de forces, on frappe encore, à moitié force, et l'étourdissement reste entier.

---

## 3. Les règles de jeu que la 0.9 met en œuvre

### 3.1 Voir les autres joueurs (M1)

- **Affichage différé.** Un autre joueur est montré **avec environ 150 ms de retard**, en ligne droite entre les deux positions reçues qui encadrent ce moment. Sa vitesse à l'écran devient celle qu'il a vraiment.
- **Sauts.** Au-delà de 3 m d'écart (entrée dans le lieu, voyage, réapparition), le personnage est posé directement, sans glissement.
- **Paquets en retard.** Si un paquet tarde, le personnage continue au plus 100 ms dans la même direction, puis s'arrête.
- **L'allure transmise.** Le serveur envoie, avec chaque position, l'allure du joueur : immobile, discrète (accroupi), marche ou course (`ALLURES`, `regles.ts`), et s'il est dans l'eau (le gué, où la marche freinée reste une marche). Le client choisit le clip d'après cette allure. La vitesse ne sert qu'à régler la cadence du clip.
- **Les gestes transmis.** Le serveur envoie, aux joueurs qui le voient, chaque frappe (rapide ou appuyée), esquive, poussée, dégagement et geste de travail (ramasser, couper, puiser…). Le client les joue sur l'autre joueur avec les animations qu'il utilise déjà pour soi (`frapper()`, `lancer()`, `ANIMATION_GESTE`).
- **Rien ne change pour soi** : son propre personnage reste prédit, sans retard.

### 3.2 Saisi, on ne frappe plus (M3)

- **Tant qu'un Éteint nous tient, A ne frappe pas** : on n'a pas l'amplitude.
- **A compte alors comme un appui de dégagement**, comme B : quand on est saisi, on tape sur ce qu'on a sous le doigt. Marteler reste la bonne réaction, mais il faut 6 appuis par Éteint qui tient, et chacun coûte de l'endurance. Pendant ce temps, la morsure approche.
- **Le bouton A affiche « Se dégager »** pendant la saisie, comme B. La jauge de dégagement existante (`hud.saisie`) compte les appuis des deux boutons.
- **Le coup appuyé** chargé avant la saisie est perdu : le relâchement ne frappe pas.
- **Cas particuliers inchangés** :
  - la décharge d'une arme électrique ne libère pas non plus : on se dégage d'abord (Q-4) ;
  - l'Éteint du tutoriel lâche toujours tout seul.

### 3.3 L'Équipé : étourdi un coup sur deux (M2)

- **Un coup sur deux, l'Équipé ne vacille pas**. Il encaisse les dégâts au torse, mais :
  - il n'est pas étourdi ;
  - il ne recule pas ;
  - il garde son contact, donc sa saisie continue de se préparer.
- **L'autre coup** fait l'effet habituel : étourdi 1,2 s (1,8 s au contondant), recul de 0,6 m, contact remis à zéro.
- **Le décompte** est tenu par Éteint (« le prochain coup passe-t-il ? ») et repart à zéro quand il tombe à terre.
- **Ce qui fait toujours vaciller** : la poussée (B au contact) et la décharge électrique. Ce sont les vraies réponses à l'Équipé, avec le coup appuyé au contondant à terre.
- **Le signe.** Le coup qui ne fait pas vaciller a un son plus mat (le casque, le blouson). Le client joue un léger sursaut de l'Éteint, pas le recul. Le joueur doit comprendre « celui-là encaisse ».

---

## 4. Les chantiers

| N° | Chantier | Fichiers principaux | Effort |
|---|---|---|---|
| **1** | **Le réseau des présences** : envoi régulier tous les deux tours (100 ms fixes), horodatage du tour, allure dans le message `positions` (un 5ᵉ nombre), nouveau message `geste` diffusé à ceux qui voient | `serveur/src/monde.ts`, `presences.ts`, `joueur.ts`, `commun/src/messages.ts` | M |
| **2** | **L'affichage des autres** : tampon d'interpolation (150 ms), sauts, clip choisi d'après l'allure, gestes rejoués | `client/src/rendu/autres.ts`, `rendu/personnage.ts`, `client/src/main.ts` (réception) | M |
| **3** | **La saisie** : A ne frappe plus quand on est tenu, il compte comme un appui de dégagement ; libellé et jauge | `serveur/src/joueur.ts` (`frapper`, `cibleDevant`, `degager`), `client/src/main.ts` | S |
| **4** | **L'Équipé** : étourdi un coup sur deux, son et sursaut | `commun/src/eteints.ts` (`encaisser`), `client/src/rendu/eteint.ts`, son | S |
| **5** | **Mesures et recette** : le banc d'équilibre (`commun/src/equilibre.ts`) refait avec les chantiers 3 et 4 ; débit réseau à la halte (100 joueurs) avant et après ; deux navigateurs côte à côte, et l'iPhone 13 mini | `commun/src/equilibre.ts`, tests, `deploiement/mesurer-pi.sh` | S |

**Ordre.** Les chantiers 1 puis 2 se suivent. Les chantiers 3 et 4 sont indépendants et peuvent se faire en parallèle. Le chantier 5 vient en dernier.

**Tests à écrire** :
- interpolation : vitesse constante entre deux paquets, saut au-delà de 3 m, arrêt après un paquet manquant ;
- allure et geste reçus ;
- saisi : A ne libère pas, 6 appuis A ou B libèrent ;
- Équipé : un coup sur deux sans étourdissement, décompte remis à zéro à terre ;
- relecture d'une sauvegarde 0.8.2.

---

## 5. Les critères de réussite (ce qu'on doit pouvoir faire en jeu)

1. **Deux joueurs dans la même halte.** L'un marche en rond : l'autre le voit marcher, sans à-coups, avec le cycle de pas. Il court : on le voit courir. Il s'arrête : il reste debout, immobile.
2. **On voit un autre joueur frapper un Éteint, esquiver, ramasser.**
3. **Saisi par un Errant, marteler A ne libère pas au premier coup.** Il faut 6 appuis. Marteler B fait pareil.
4. **Face à un Équipé, marteler A ne suffit plus** : il finit par saisir. Le repousser (B), puis frapper, fonctionne.
5. **Face à un Errant seul, rien ne change** par rapport à la 0.8.2.
6. **Le débit réseau à la halte** reste sous 8 Ko/s par joueur (7,4 Ko/s mesurés jusqu'ici), et l'iPhone 13 mini reste à 60 images par seconde.

---

## 6. Les risques

- **Le débit réseau.** L'allure ajoute un nombre par joueur qui bouge, et les gestes ajoutent des messages. L'allure tient en un chiffre et les gestes sont rares : l'effet attendu est faible. À mesurer (chantier 5).
- **Le retard de 150 ms.** Il ne se voit pas tant qu'on ne combat pas un autre joueur. Il faudra le revoir le jour du combat entre joueurs (§7).
- **La saisie plus dure.** Avec plusieurs Éteints, on risque plus vite l'effondrement (3 qui tiennent). C'est voulu (« la masse est le danger »), mais à vérifier au banc : le taux de morsures au niveau 1 ne doit pas exploser.
- **Le tutoriel** dit déjà « tape {examiner} très vite » pour se dégager. Il reste juste. Il faut relire ses textes pour qu'aucun ne dise de frapper pour se libérer.

---

## 7. Pour plus tard : le combat entre joueurs

*Décision du porteur (2026-10-13) : pas de combat entre joueurs dans la 0.9, à prévoir pour une version ultérieure. Le Book 21 le garde « désactivé partout » ; le Book 01 (§6 bis) dit où il sera permis : haltes, ruines et lieux de flux, jamais sur le Terrain ni au Comptoir, ni sur le terrain d'un ami.*

### 7.1 Ce qu'on a trouvé

- **Le mode Combat n'existe que sur l'écran du joueur** (`main.ts:183`). Le serveur ne le connaît pas et ne le diffuse à personne.
- **Le mode choisi se perd** : quand aucun Éteint n'est à moins de 10 m pendant 3 s, `majMode` (`main.ts:1487`) repasse en Exploration, **même si le joueur a choisi le mode Combat lui-même**. Une fois en Exploration, le jeu propose l'échange et la leçon. C'est ce que le porteur a vu près d'un autre joueur.
- **Le serveur ne sait frapper que des Éteints** : `cibleDevant` ne parcourt que les Éteints du lieu (`joueur.ts:1086`).

### 7.2 Ce que le porteur a demandé (2026-10-13)

- **Le mode choisi persiste.** L'Exploration est le mode par défaut ; le joueur bascule en Combat, et ce choix tient jusqu'à ce qu'il le change.
- **La bascule automatique face à un Éteint reste.**
- **Le mode de chacun se voit de loin** : **halo rouge** en Combat, **halo vert** en Exploration. On sait ainsi dans quel état d'esprit est celui qu'on croise.

### 7.3 La proposition (à reprendre le moment venu)

- **Deux bascules distinctes :**
  - **le mode choisi** décide du halo et seul lui permet de frapper un joueur ;
  - **la bascule automatique** ne vise que les Éteints, et revient seule en Exploration quand la menace est passée.
- **Ainsi, celui qui se défend contre un Éteint ne paraît pas hostile** : son halo reste vert.
- **Côté serveur**, il faudra :
  - connaître et diffuser le mode choisi ;
  - permettre de viser un joueur et de le blesser ;
  - n'autoriser le combat qu'aux endroits du Book 01.
- **Le retard d'affichage** du §3.1 devra être compensé pour les coups entre joueurs, en jugeant le coup d'après ce que voyait le frappeur.

### 7.4 Les questions à trancher

1. **Qui peut être frappé ?** Un joueur au halo vert, ou seulement si les deux sont en rouge ? Le halo n'a de sens comme avertissement que si l'on peut attaquer un joueur en vert.
2. **Que fait un coup sur un joueur ?** Combien de dégâts ? Est-il étourdi, peut-il être saisi ?
3. **Que se passe-t-il quand il tombe ?** Mort, butin perdu ou laissé au sol, réveil quelque part ?
4. **Où est-ce permis ?** Exactement la répartition du Book 01 ?
5. **Repasser au vert** : à tout moment, ou après un délai, pour ne pas fuir trop facilement un combat qu'on a commencé ?

---

## 8. Les questions tranchées (2026-10-13)

| N° | Question | Décision du porteur |
|---|---|---|
| Q-1 | Le **numéro** de cette version (0.8.4 ou 0.9) | **0.9** |
| Q-2 | Le **retard d'affichage** des autres : 150 ms convient-il ? | **Oui.** C'est 1,5 paquet ; on le règlera au chantier 5 si un réseau mobile fait sauter des paquets |
| Q-3 | Appliquer aussi **l'affichage différé aux Éteints** (paquets toutes les 200 ms) ? | **Non pour l'instant** : ils paraissent déjà fluides. À revoir si le porteur voit des à-coups |
| Q-4 | Saisi, **la décharge électrique au contact** (Voltaïques) peut-elle encore libérer ? | **Non** : même règle que pour les autres, on se dégage d'abord. La décharge n'est pas un geste ample, mais une exception rendrait la règle moins lisible |
| Q-5 | Saisi, **A compte comme un appui de dégagement**, ou A ne fait rien du tout (avec un message « Il te tient : tape {examiner} ») ? | **A compte comme un appui** : marteler est le bon réflexe, il faut juste que ça coûte |
| Q-6 | **Le couteau**, arme courte, permet-il de frapper quand on est tenu ? | **Non pour la 0.9.** Ce serait une mécanique nouvelle, à décider à part |
