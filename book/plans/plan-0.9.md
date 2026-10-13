# Plan de développement — version 0.9 : les autres joueurs fluides, un combat moins facile

*Version du plan : v0.4 · 2026-10-13 · **Statut : décidé, prêt à lancer après la 0.8.3** (rien n'est codé).*

*v0.4 (2026-10-13) : les questions Q-7 à Q-10 tranchées (§9.1). Une arme encombrante portée dans le dos, comme la fourche, se voit en permanence, et tous les gestes sont montrés.*

*v0.3 (2026-10-13) : le plan rédigé en entier :
- les chantiers détaillés (contenu, fichiers, tests) et le format des messages, fixé d'avance pour que deux chantiers avancent en même temps ;
- les vagues, les fichiers partagés, les critères de réussite, l'estimation du temps ;
- quatre questions de détail (§9.2 de la v0.3, tranchées en v0.4) ;
- un texte de leçon qui contredit la décision Q-4 (§3.2).*

*v0.2 (2026-10-13) : les six questions du §8 tranchées en suivant toutes les recommandations ; la version s'appelle **0.9**.*

*Code de départ : la **0.8.3** quand elle sera déployée (en cours de codage dans une autre session). L'étude a été faite sur la **0.8.2** : les numéros de ligne cités sont ceux de la 0.8.2, à revérifier au lancement. Source : les remarques du porteur du 2026-10-13, après avoir joué à plusieurs.*

---

## 0. En bref

- **Ce que livre la 0.9** :
  - on voit les autres joueurs **marcher, courir et s'arrêter de façon fluide**, avec la bonne animation ;
  - on les voit **frapper, esquiver, repousser, travailler**, et l'arme en main pendant le coup ;
  - **quand un Éteint nous tient, on ne frappe plus** : A et B servent tous deux à se dégager ;
  - **l'Équipé (le casqué) ne se laisse plus bloquer** en martelant : il n'est étourdi qu'un coup sur deux.
- **5 chantiers en 2 vagues**, sans contenu nouveau dans le monde : ni lieu, ni arme, ni Éteint, ni objet.
- **Effort : 2 M et 3 S, environ 6 jours-agent. En pratique, une demi-journée à une journée**, recette comprise (§6).
- **Pas de remise à zéro** des joueurs : rien ne change dans les sauvegardes.
- **Le combat entre joueurs n'entre pas.** Il viendra bien après la 0.9, une fois la fluidité validée en jeu (§8, [`duel-entre-joueurs.md`](duel-entre-joueurs.md)).

---

## 1. Le périmètre

### 1.1 Ce qui entre

| N° | Remarque du porteur | Réponse | Chantiers |
|---|---|---|---|
| M1 | « Un autre joueur dans une halte se déplace par à-coups, et je ne le vois pas marcher. » | Envoi régulier, affichage différé et interpolé ; l'allure et les gestes transmis | A, B |
| M2 | « En martelant la touche d'attaque, l'Éteint ne nous touche jamais. Pour l'Éteint de base, ça peut aller (le danger, c'est la masse) ; pas pour le casqué. » | L'Équipé n'est étourdi qu'un coup sur deux | D |
| M3 | « Saisi, appuyer sur Frapper nous libère, alors qu'on n'a pas l'amplitude pour taper. Marteler la frappe sort de toutes les situations. » | Saisi, on ne frappe plus ; seul le dégagement libère | C |

### 1.2 Ce qui n'entre pas

- **Le combat entre joueurs**, avec le mode choisi diffusé et le halo (§8).
- **La bascule automatique du mode Combat** reste telle quelle (§8.1).
- **L'Errant, le Rampant, le Magasinier et le Mécanicien** : leur étourdissement ne change pas. C'est la masse qui fait leur danger.
- **L'affichage différé des Éteints** (Q-3) : ils paraissent déjà fluides.
- **Frapper au couteau quand on est tenu** (Q-6).

---

## 2. Ce qu'on a trouvé dans le code (0.8.2)

### 2.1 Les autres joueurs (M1)

- **Le serveur** envoie les positions environ 10 fois par seconde (`serveur/src/presences.ts`, message `positions` : `id, x, z, o` à la suite, seulement pour ceux qui ont bougé).
  - L'envoi part au premier tour de serveur (20 par seconde) où 100 ms sont écoulées (`monde.ts:211`). Le pas réel est donc **irrégulier : 100 ou 150 ms**.
  - Il n'envoie **ni l'allure, ni les gestes**. Le serveur connaît pourtant l'allure (`allureEffective()`, `joueur.ts:2423`) et sait si le joueur bouge (`this.bouge`).
- **Le client** (`client/src/rendu/autres.ts:75`) fait glisser le personnage vers la dernière position reçue, de façon exponentielle (`k = dt × 10`). Il n'y a ni horodatage ni tampon. Le glissement est rapide juste après un paquet, puis ralentit : **à-coups**.
- **L'animation** est choisie d'après la vitesse mesurée à chaque image (`personnage.ts:629`) :
  - moins de 1,7 m/s : marche accroupie ;
  - moins de 3,4 m/s : marche ;
  - au-delà : trot.
- **Pendant une marche à 2,4 m/s**, la vitesse mesurée oscille entre 3,6 et 1,4 m/s à chaque paquet. Chaque changement de clip le relance au début avec un fondu de 0,25 s (`humanoides.ts:780`) : **aucun pas ne se déroule**.
- **Les gestes de l'autre ne sont jamais joués**. `VueAutre` n'appelle ni `frapper()`, ni `esquiver()`, ni `agir()`, ni `tenir()`, que le personnage local utilise (`main.ts:847`, `1452`, `1467`, `1608`, `1754`).

### 2.2 La saisie (M3)

- `cibleDevant` (`joueur.ts:1097`) : « celui qui nous tient se frappe toujours, même dans le dos ».
- `encaisser` (`commun/src/eteints.ts:281`) remet à zéro la saisie (`saisit = null`), la tenue et le contact. **Un seul coup libère**, alors que le dégagement prévu (Book 08 §3.3, Book 23 §4.4) demande **6 appuis rapides** par Éteint qui tient, et 1,5 fois plus quand on est épuisé (`degager()`, `joueur.ts:1589`).
- **La décharge électrique** libère aussi : `encaisserCoup`, branche électrique. La leçon des Voltaïques le dit même (`commun/src/quetes.ts:557` : « une courte fait lâcher qui te tient »).
- **Le banc d'équilibre** suppose cette règle : « saisi, il frappe celui qui le tient » (`commun/src/equilibre.ts:17` et `337`).

### 2.3 Le martèlement (M2)

- **L'attaque de l'Éteint** : il lui faut 0,6 s au contact pour saisir (`DELAI_SAISIE`), puis 3 s de saisie pour mordre (`DELAI_MORSURE`).
- **Chaque coup** (`eteints.ts:278-309`) :
  - l'**étourdit 1,2 s** (`DUREE_ETOURDI`), 1,8 s avec un contondant ;
  - le **fait reculer de 0,6 m** ;
  - **remet son contact à zéro**.
- Il lui faut environ 2,2 s pour revenir et saisir. Or toutes les armes refrappent en 0,38 à 0,95 s : **il est bloqué en permanence**.
- **L'Équipé** (`variante: "equipe"`) encaisse un coup de plus au torse, et le tranchant ne le tue pas à la tête. Mais il est **étourdi exactement comme les autres**.

---

## 3. Les règles de jeu que la 0.9 met en œuvre

### 3.1 Voir les autres joueurs (M1)

- **Envoi régulier.** Les présences partent **un tour de serveur sur deux**, exactement toutes les 100 ms, au lieu de « dès que 100 ms sont écoulées ».
- **Affichage différé.** Un autre joueur est montré **avec 150 ms de retard** (Q-2), en ligne droite entre les deux positions reçues qui encadrent ce moment, d'après l'heure du serveur. Sa vitesse à l'écran devient celle qu'il a vraiment.
- **Sauts.** Au-delà de 3 m d'écart entre deux positions (entrée dans le lieu, réapparition), le personnage est posé directement.
- **Paquets en retard.** Si plus rien n'arrive, le personnage continue au plus 100 ms dans la même direction, puis s'arrête sur place.
- **L'allure transmise.** Avec chaque position part l'allure : **immobile, discrète, marche ou course**. Le client choisit le clip d'après elle :
  - immobile : repos ;
  - discrète : marche accroupie ;
  - marche : marche ;
  - course : trot.

  La vitesse réelle ne sert qu'à régler la cadence du clip. Un joueur freiné, au gué ou chargé, reste en marche : il marche lentement, il ne s'accroupit pas.
- **Les gestes transmis.** Le serveur envoie, à ceux qui voient le joueur, chacun de ses gestes, avec son heure. Le client les joue sur l'autre personnage avec le même retard de 150 ms :

  | Geste | Ce qu'on voit | Animation existante |
  |---|---|---|
  | Frappe (rapide ou appuyée, avec l'arme et la durée du coup) | Le coup, **l'arme en main** pendant le geste et 3 s après (Q-7) | `frapper(appuye, duree)`, `tenir(objet)` |
  | Arme encombrante équipée (la fourche) | **Dans le dos, en permanence**, et en main pendant le coup (Q-7) | `porterDansLeDos(objet)` |
  | Poussée | Le geste court des deux bras | `frapper(false, 0.45)` |
  | Esquive | La roulade | `esquiver()` |
  | Dégagement | Des secousses (le geste du coup reçu) | `toucher()` |
  | Coup reçu (morsure) | Le geste du coup reçu | `toucher()` |
  | Début et fin d'une action de travail | Le geste de l'action (couper, ramasser, puiser…) | `agir(gesteDAction(libellé))` |
  | Effondrement, réveil, couché | Tomber, se relever, dormir | `effondrer()`, `coucher()` |

- **Tout est montré** (Q-10) : les gestes du combat comme ceux du travail.
- **Rien ne change pour soi** : son propre personnage reste prédit, sans retard.

### 3.2 Saisi, on ne frappe plus (M3)

- **Tant qu'un Éteint nous tient, A ne frappe pas** : on n'a pas l'amplitude.
- **A compte alors comme un appui de dégagement**, exactement comme B (Q-5). Il faut 6 appuis par Éteint qui tient, chacun coûte de l'endurance (3), et la morsure approche.
- **Le bouton A affiche « Se dégager »** pendant la saisie, comme B. La jauge de dégagement (`hud.saisie`) compte les appuis des deux boutons.
- **Le coup appuyé** chargé avant la saisie est perdu : le relâchement ne frappe pas.
- **Aucune arme ne fait exception** :
  - **la décharge électrique ne libère plus** (Q-4) ;
  - **le couteau non plus** (Q-6).
- **Le serveur fait foi** : un message `frapper` reçu pendant une saisie compte comme un appui de dégagement. Un client ancien ou trafiqué ne peut pas se libérer d'un coup.
- **Les textes à corriger** :
  - la leçon des Voltaïques (`quetes.ts:557`) dit encore « une courte fait lâcher qui te tient ». Elle devient : « Casque ou pas, le courant passe. Mais s'il te tient, dégage-toi d'abord. » (Q-9) ;
  - l'aide sur la saisie (`aide-contenu.ts`) ;
  - le premier message de saisie dit de marteler A **ou** B.
- **L'Éteint du tutoriel** lâche toujours tout seul, sans mordre.

### 3.3 L'Équipé : étourdi un coup sur deux (M2)

- **Un coup sur deux, l'Équipé ne vacille pas.** Il encaisse les dégâts au torse, mais :
  - il n'est pas étourdi ;
  - il ne recule pas ;
  - il garde son contact, donc sa saisie continue de se préparer.

  Le résultat du coup est nouveau : **« encaisse »**.
- **L'autre coup** fait l'effet habituel : étourdi 1,2 s (1,8 s au contondant), recul de 0,6 m, contact remis à zéro (« vacille »).
- **Le premier coup reçu fait vaciller.** Le décompte est tenu par Éteint et repart à zéro quand il tombe à terre.
- **Ce qui fait toujours vaciller** : la poussée (B au contact) et la décharge électrique. Avec le coup appuyé au contondant une fois à terre, ce sont les vraies réponses à l'Équipé.
- **Le signe à l'écran** : le coup « encaisse » a un **son plus mat** (le casque, le blouson), **peu de sang**, et un **léger sursaut** de l'Éteint, sans recul. Le joueur doit comprendre « celui-là encaisse ».
- **Un réglage à chaud** : la fréquence (« étourdi un coup sur N », 2 par défaut) se change sans redéployer, comme les autres réglages d'équilibre.

### 3.4 Le format des messages (fixé d'avance)

Ce format est le contrat entre les chantiers A (serveur) et B (client) : il permet de les mener en même temps. Chaque ajout se fait en bloc séparé, en fin de `commun/src/messages.ts`.

- **`positions`** : `{ t: "positions", h: number, p: number[] }`
  - `h` : l'heure du serveur de cet envoi (ms, `Date.now()` du serveur). Le client la compare à son horloge, recalée par `decalage` (`main.ts:230`).
  - `p` : des **quintuplets** `id, x, z, o, allure`. L'allure vaut 0 immobile, 1 discrète, 2 marche, 3 course.
  - Un joueur part dès que sa position **ou son allure** change. L'arrêt est donc envoyé une fois, avec l'allure 0.
- **`gestes`** (nouveau) : `{ t: "gestes", g: GesteVu[] }`, avec `GesteVu = { id: number; h: number; geste: GesteAutre; appuye?: boolean; objet?: CleObjet; duree?: number; action?: string }`.
  - `GesteAutre` vaut `"frappe" | "poussee" | "esquive" | "degagement" | "touche" | "action" | "fin_action" | "effondre" | "releve" | "couche"`.
  - Les gestes s'accumulent chez le joueur entre deux envois, et partent avec les présences du même tour, aux mêmes observateurs (même rayon, même vue à travers les murs).
- **`autres`** : `AutreVu` prend un champ **`dos?: CleObjet`**, l'arme encombrante équipée portée dans le dos (aujourd'hui la seule est la fourche, `fourche_foin`). Il fait partie de l'identité : il n'est envoyé que quand il change (`cleIdentite`, `presences.ts`). Le message porte déjà les positions d'entrée dans le champ ; l'allure y vaut 0 jusqu'au premier `positions`.

---

## 4. Les chantiers

**Effort** : **S** = une demi-journée à un jour ; **M** = un à trois jours de travail d'un agent.

### Vague 1 · Le réseau, l'affichage, la saisie, l'Équipé

**Chantier A · Les présences au serveur** (vague 1, **M**)

- **Contenu** :
  - **l'envoi régulier** : un compteur de tours dans `monde.ts` (les présences un tour sur deux), au lieu du test sur 100 ms ;
  - **l'heure et l'allure** dans `positions` (§3.4). Le joueur expose son allure effective et s'il bouge (`get vu` prend un champ `allure`). La clé « déjà envoyé » de `presences.ts` compte l'allure ;
  - **les gestes** : une file `gestesRecents` par joueur, remplie aux bons endroits de `joueur.ts`, chacun par un appel d'une ligne :
    - `frapper` (avec l'arme et la durée du coup), `repousser`, `esquiver`, `degager` ;
    - la morsure (`tickCombat`) ;
    - le début et la fin d'une action (`commencer`, `annulerAction`) ;
    - `effondrer`, le réveil, le sommeil.
  - **l'arme dans le dos** : `get vu` prend `dos`, l'arme équipée si elle est encombrante. La liste des armes encombrantes est une seule constante dans `commun/`, reprise par le client local (`main.ts:1756`, qui teste aujourd'hui `fourche_foin` en dur) ;
  - **la diffusion des gestes** dans `diffuserPresences`, aux voisins qui voient le joueur. La file est vidée après chaque envoi ;
  - **le débit** : `scripts/banc-charge.ts` rejoué avant et après, à la halte avec 100 joueurs.
- **Fichiers** : `serveur/src/monde.ts`, `serveur/src/presences.ts`, `serveur/src/joueur.ts` (appels d'une ligne), `commun/src/messages.ts` (bloc en fin).
- **Tests** (`presences.test.ts`) :
  - deux envois de suite sont espacés de 100 ms exactement ;
  - l'allure part avec la position, et l'arrêt part une fois ;
  - un geste n'est reçu que par ceux qui voient le joueur, et une seule fois ;
  - équiper la fourche renvoie l'identité avec `dos`, et une arme non encombrante ne l'y met pas ;
  - un joueur immobile ne coûte toujours rien.

**Chantier B · L'affichage des autres** (vague 1, **M**, en parallèle de A grâce au §3.4)

- **Contenu** :
  - **un module d'interpolation** sans Three.js, pour le tester seul (`client/src/rendu/interpolation.ts`) :
    - un tampon de positions horodatées par joueur ;
    - `echantillon(instant)` : position, orientation et allure 150 ms en arrière ;
    - les sauts au-delà de 3 m, l'extrapolation de 100 ms au plus ;
  - **`VueAutre`** (`rendu/autres.ts`) : `deplacer` alimente le tampon, et `animer` lit l'échantillon ;
  - **`Personnage.animer`** (`rendu/personnage.ts`) prend, pour les autres, l'allure reçue plutôt que la vitesse mesurée. Le chemin du joueur local ne change pas ;
  - **les gestes** : `VueAutre.geste(g)` les met en file et les joue à leur heure, retard compris, avec les méthodes existantes (§3.1). Pendant une frappe, l'arme est en main (`tenir`) pendant le geste puis 3 s ;
  - **l'arme dans le dos** : `VueAutre.maj` appelle `porterDansLeDos(dos)`. Pendant une frappe avec cette arme, elle passe en main, puis revient dans le dos ;
  - **la réception** dans `main.ts` : `positions` lit les quintuplets et `h`, et `gestes` est nouveau.
- **Fichiers** : `client/src/rendu/interpolation.ts` (nouveau), `client/src/rendu/autres.ts`, `client/src/rendu/personnage.ts`, `client/src/main.ts` (la réception, deux cas).
- **Tests** (`interpolation.test.ts`) :
  - à 2,4 m/s, la vitesse affichée reste entre 2,2 et 2,6 m/s sur 2 s de paquets, même irréguliers (100 et 150 ms mélangés) ;
  - au-delà de 3 m, le personnage est posé directement ;
  - sans paquet, il s'arrête après 100 ms ;
  - l'allure reçue choisit le clip, sans dépendre de la vitesse.

**Chantier C · La saisie** (vague 1, **S**)

- **Contenu** :
  - **au serveur** : `frapper()` commence par « tenu ? alors `degager()` et rien d'autre ». Le coût d'endurance est celui du dégagement, pas celui du coup. Cela vaut pour toutes les armes, électriques comprises. Le commentaire et l'exception de `cibleDevant` (« celui qui nous tient se frappe toujours ») disparaissent ;
  - **au client** : dans le cas `A` / `A_long` de `main.ts`, quand on est tenu, on prend le chemin du dégagement de `combatB()` (appui local compté, `degager` envoyé, son), sans geste de frappe. La charge du coup appuyé est remise à zéro. Le libellé de A devient « Se dégager » (`main.ts:1804`) ;
  - **les textes** (§3.2) :
    - la leçon des Voltaïques (`quetes.ts:557`) ;
    - la rubrique « saisie » de l'aide (`aide-contenu.ts`) ;
    - le message à la première saisie ;
  - **le banc d'équilibre** : « saisi, il se dégage » pour toutes les armes (`equilibre.ts:17` et `337`).
- **Fichiers** : `serveur/src/joueur.ts` (`frapper`, `cibleDevant`), `client/src/main.ts` (le cas A, le libellé), `commun/src/quetes.ts`, `client/src/aide-contenu.ts`, `commun/src/equilibre.ts`.
- **Tests** (`combat.test.ts`, `socle-combat.test.ts`) :
  - tenu, un `frapper` ne libère pas et ne fait aucun dégât ;
  - 6 `frapper`, 6 `degager`, ou 3 de chaque, libèrent ;
  - tenu par deux, il en faut 12 ;
  - une matraque électrique tenue ne libère pas ;
  - non tenu, rien ne change ;
  - les textes ne disent plus qu'une arme fait lâcher (`textes-du-jeu.test.ts`).

**Chantier D · L'Équipé** (vague 1, **S**)

- **Contenu** :
  - **`encaisser`** (`commun/src/eteints.ts`) : un compteur de coups reçus sur l'Éteint. Pour un Équipé, un coup sur N (réglage, 2 par défaut) fait vaciller. Les autres coups ajoutent les dégâts au torse, mettent à terre si le seuil est atteint, et renvoient **`"encaisse"`**, sans étourdissement, recul ni remise à zéro du contact. Le compteur repart à zéro à terre ;
  - **le type** `ResultatCoup` prend `"encaisse"`. La poussée (`repousser`) et la décharge (`encaisserCoup`, branche électrique) ne passent pas par le compteur ;
  - **au client** :
    - `montrerCoup` (`main.ts:606`) : pour « encaisse », moins de sang et pas de message ;
    - le rendu de l'Éteint (`rendu/eteint.ts`) : un sursaut sans recul ;
    - le son : un impact mat (`bruiteur.coup`), pris parmi les effets CC0 de `son/` ou synthétisé, selon la règle du partage des sons ;
  - **le réglage à chaud** `equipe_vacille_un_sur` (`commun/src/reglages.ts`) ;
  - **le banc d'équilibre** : un scénario « martèlement face à un Équipé », où le joueur frappe sans esquiver ni repousser.
- **Fichiers** : `commun/src/eteints.ts`, `commun/src/reglages.ts`, `commun/src/equilibre.ts` (le scénario), `client/src/main.ts` (`montrerCoup`, quelques lignes), `client/src/rendu/eteint.ts`, `client/src/son/*`.
- **Tests** (`eteints.test.ts`, `combat-enrichi.test.ts`) :
  - Équipé : coups 1 et 3 « vacille », coups 2 et 4 « encaisse » ;
  - après « encaisse », il saisit si on reste au contact 0,6 s ;
  - la poussée et la décharge le font toujours vaciller ;
  - à terre, le compteur repart ;
  - l'Errant ne change pas ;
  - au banc, le martèlement face à un Équipé donne au moins une saisie, et face à un Errant, aucune (comme aujourd'hui).

### Vague 2 · La recette

**Chantier E · Recette, mesures, books et version** (vague 2, **S**)

- **Contenu** :
  - **les mesures** :
    - `npm run equilibre` (les trois étapes) et `npm run rythme` : le garde-fou doit tenir, sinon on règle (§5, risque 3) ;
    - `scripts/banc-charge.ts` : le débit par joueur à la halte avec 100 joueurs ;
    - l'iPhone 13 mini avec `?mesure=1`, en halte avec un autre joueur ;
  - **la recette à deux navigateurs** côte à côte, puis un navigateur et l'iPhone : les critères du §5 un par un, avec captures et une courte vidéo de la marche ;
  - **les books** :
    - Book 23 §4.2 (l'Équipé encaisse un coup sur deux) et §4.4 (saisi, A et B dégagent, aucune arme ne libère) ;
    - Book 08 §3.3 (le bouton A pendant la saisie) ;
    - la bible (la ligne de l'Équipé), régénérée par `construire-page.py` ;
    - `en-suspens.md` ;
  - **la version** : `commun/src/version.ts` en 0.9.0, `code/VERSIONS.md`, un commit et l'étiquette `v0.9` après le déploiement.
- **Fichiers** : `commun/src/version.ts`, `code/VERSIONS.md`, `book/23-cooperative-et-combat.md`, `book/08-plateforme-commandes-financement.md`, la bible.
- **Tests** : `npm run verif`, `npm test`, `npm run build` passent.

---

## 5. L'ordre et le parallélisme

| Vague | Chantiers (en parallèle) | Avant la vague suivante |
|---|---|---|
| **1** | **A** présences · **B** affichage · **C** saisie · **D** Équipé | A et B fusionnés ensemble (le format du §3.4), puis C et D |
| **2** | **E** recette, mesures, books, version | La livraison |

**Les fichiers partagés** (même principe que la 0.8 : un module par chantier, des appels d'une ligne, des blocs séparés) :

| Fichier | Qui | Comment |
|---|---|---|
| `commun/src/messages.ts` | A, B | Écrit par A selon le §3.4. B part du même texte ; un seul bloc en fin de fichier |
| `serveur/src/joueur.ts` | A, C | A : des appels d'une ligne (gestes, allure dans `vu`) ; C : le début de `frapper` et `cibleDevant`. Zones distinctes, mais `frapper` est touchée par les deux : **C fusionné avant A**, et A pose sa ligne « geste frappe » après le test de saisie (un geste de dégagement, pas de frappe, quand on est tenu) |
| `client/src/main.ts` | B, C, D | B : la réception (`positions`, `gestes`) ; C : le cas A et le libellé ; D : `montrerCoup`. Trois endroits éloignés |
| `commun/src/equilibre.ts` | C, D | C : la règle de la saisie ; D : un scénario nouveau. Blocs séparés |

**Avec la 0.8.3** : la 0.9 part de la 0.8.3 déployée. Si la 0.8.3 touche `presences.ts`, `autres.ts`, `encaisser` ou `frapper`, on relit ces passages au lancement, avant de créer les branches.

---

## 6. Les critères de réussite (ce qu'on doit pouvoir faire en jeu)

1. **Deux joueurs dans la même halte.** L'un marche en rond : l'autre le voit **marcher**, avec le cycle de pas, sans à-coups. Il court : on le voit courir. Il s'accroupit : on le voit avancer accroupi. Il s'arrête : il reste debout, au repos.
2. **On voit un autre joueur frapper un Éteint**, avec son arme en main. **Sa fourche équipée se voit dans son dos**, même quand il ne se bat pas. On le voit esquiver, repousser, ramasser, couper du bois, s'effondrer et se relever.
3. **Saisi par un Errant, marteler A ne libère pas au premier coup** : il faut 6 appuis. Marteler B fait pareil, et mélanger les deux aussi. Le bouton A affiche « Se dégager ».
4. **Une matraque électrique ne libère pas** d'une saisie.
5. **Face à un Équipé, marteler A ne suffit plus** : il finit par saisir. Le repousser (B), puis frapper, fonctionne. On entend et on voit la différence entre « il vacille » et « il encaisse ».
6. **Face à un Errant seul, rien ne change** par rapport à la 0.8.3.
7. **Le débit réseau à la halte** reste sous 8 Ko/s par joueur (7,4 Ko/s mesurés jusqu'ici), et l'iPhone 13 mini reste à 60 images par seconde.
8. **Une partie 0.8.3 se relit** sans rien perdre.
9. `npm run verif`, `npm test`, `npm run build` passent. `npm run equilibre` et `npm run rythme` tiennent.

---

## 7. L'estimation et les risques

### 7.1 Le temps

| Chantier | Effort | Jours-agent (milieu) |
|---|---|---|
| A · Présences au serveur | M | 1,5 |
| B · Affichage des autres | M | 2 |
| C · Saisie | S | 0,75 |
| D · Équipé | S | 0,75 |
| E · Recette, mesures, books, version | S | 1 |
| **Total** | **2 M, 3 S** | **≈ 6 jours-agent** (fourchette 4 à 9) |

**En temps réel**, d'après la 0.8 et la 0.8.2 (agents en parallèle) :
- vague 1 : 1 h à 1 h 30 (le plus long, l'affichage) ;
- fusions : 30 min ;
- vague 2 : 2 h à 3 h, recette à deux appareils comprise.

**Total : une demi-journée à une journée**, en comptant tes réponses en route.

### 7.2 Les risques

- **Le débit réseau.** L'allure ajoute un nombre par joueur qui bouge, `h` un nombre par message, et les gestes sont rares. L'effet attendu est faible, mais à mesurer (chantier E).
- **L'horloge du client.** Le retard de 150 ms suppose que `decalage` est juste à quelques dizaines de millisecondes près. S'il dérive (téléphone en veille, réseau mobile), le tampon se vide ou déborde. Le module d'interpolation recale son retard doucement sur les heures reçues, sans saut.
- **La saisie plus dure.** Avec plusieurs Éteints, l'effondrement (3 qui tiennent) vient plus vite. C'est voulu, mais le garde-fou du banc d'équilibre peut tomber à certaines étapes. Si c'est le cas, on règle (`APPUIS_DEGAGEMENT`, par exemple 5 au lieu de 6) plutôt que de revenir sur la règle, et on te le dit.
- **Le retard de 150 ms** ne se voit pas tant qu'on ne combat pas un autre joueur. Il faudra le compenser le jour du duel (`duel-entre-joueurs.md` §8).

---

## 8. Pour plus tard : le combat entre joueurs

*Décision du porteur (2026-10-13) : pas de combat entre joueurs dans la 0.9. Il viendra **bien après**, une fois validé en jeu que les interactions entre joueurs sont fluides. Les règles du duel sont décidées dans [`duel-entre-joueurs.md`](duel-entre-joueurs.md) : le halo rouge ou vert, le duel avec sa jauge à part, l'objet gagné, la protection de 45 s, les Éteints pendant le duel, la fuite, les haltes seulement.*

### 8.1 Ce qu'on a trouvé

- **Le mode Combat n'existe que sur l'écran du joueur** (`main.ts:183`). Le serveur ne le connaît pas et ne le diffuse à personne.
- **Le mode choisi se perd** : quand aucun Éteint n'est à moins de 10 m pendant 3 s, `majMode` (`main.ts:1487`) repasse en Exploration, même si le joueur a choisi le mode Combat lui-même. Une fois en Exploration, le jeu propose l'échange et la leçon. C'est ce que le porteur a vu près d'un autre joueur.
- **Le serveur ne sait frapper que des Éteints** : `cibleDevant` ne parcourt que les Éteints du lieu (`joueur.ts:1086`).
- **Ce que la 0.9 prépare** : les gestes transmis, et l'arme en main visible pendant le coup.

---

## 9. Les questions

### 9.1 Toutes tranchées (2026-10-13)

| N° | Question | Décision du porteur |
|---|---|---|
| Q-1 | Le **numéro** de cette version (0.8.4 ou 0.9) | **0.9** |
| Q-2 | Le **retard d'affichage** des autres : 150 ms convient-il ? | **Oui.** C'est 1,5 paquet ; on le règlera au chantier E si un réseau mobile fait sauter des paquets |
| Q-3 | Appliquer aussi **l'affichage différé aux Éteints** (paquets toutes les 200 ms) ? | **Non pour l'instant** : ils paraissent déjà fluides. À revoir si le porteur voit des à-coups |
| Q-4 | Saisi, **la décharge électrique au contact** (Voltaïques) peut-elle encore libérer ? | **Non** : même règle que pour les autres, on se dégage d'abord |
| Q-5 | Saisi, **A compte comme un appui de dégagement**, ou A ne fait rien du tout ? | **A compte comme un appui** : marteler est le bon réflexe, il faut juste que ça coûte |
| Q-6 | **Le couteau**, arme courte, permet-il de frapper quand on est tenu ? | **Non pour la 0.9.** Ce serait une mécanique nouvelle, à décider à part |

| Q-7 | Voir **l'arme en main** d'un autre joueur seulement pendant ses coups (et 3 s après), ou tout le temps ? | **Pendant ses coups seulement**, sauf **les armes encombrantes équipées portées dans le dos (la fourche)**, qui se voient dans le dos en permanence |
| Q-8 | L'Équipé : **le premier coup** fait-il vaciller, ou encaisse-t-il le premier ? | **Le premier fait vaciller** : le joueur voit d'abord la règle habituelle, puis découvre que celui-là tient |
| Q-9 | La nouvelle **leçon des Voltaïques** (au lieu de « une courte fait lâcher qui te tient ») | **« Casque ou pas, le courant passe. Mais s'il te tient, dégage-toi d'abord. »** |
| Q-10 | **Montrer les gestes de travail** des autres (couper, ramasser, puiser), ou seulement ceux du combat ? | **Tout montrer** |
