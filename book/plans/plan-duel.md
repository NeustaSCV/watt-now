# Plan de développement — le duel entre joueurs (version 0.11)

*Version du plan : v0.5 · 2026-10-16 · **Statut : codée, essayée par le porteur en préprod, déployée en prod le 2026-10-16** (version 0.11.0, étiquette `v0.11`). Après l'essai : la jauge à 50 points (D-27) et la touche du mode au clavier (D-28).*

*v0.5 (2026-10-16) : le duel codé sur `integration-duel`. **Le découpage réel** (il remplace l'ordre du §4) : trois chantiers en parallèle, **S** le serveur du duel (B, C, la partie serveur de A, les phrases), **K** le client du duel (la partie client de A, D, les indices et l'aide de F), **E** le corps qui reste à la déconnexion (E étendu par D-18), fusionnés dans cet ordre, puis **G** la recette, les books et le numéro 0.11.0. Les maquettes (H) avaient été faites avant. Recette au strict nécessaire : 1 363 tests, et un essai à deux comptes dans le vrai client à la station (le Combat et l'anneau rouge, un duel gagné, l'objet à ses pieds, la fuite annulée, la déconnexion en duel et le corps qui reste une minute). Restent les essais du porteur sur l'iPhone, à deux comptes (§7).*

*v0.4 (2026-10-16) : les variantes choisies sur la maquette (D-19 : halo V1 l'anneau, bouton V2 la pastille, jauges V1 la barre fine, coup reçu V2 le buste qui plie, fin V1 « + / − » qui montent et descendent avec le compte des 10 s de fuite) ; le vert frappé passe en Combat tout seul (D-20) ; « sac vide » au-dessus du perdant (D-21) ; rien pour les témoins (D-22) ; les phrases raccourcies (D-23) ; l'anneau blanc qui se vide pendant les 45 s de protection (D-24).*

*v0.3 (2026-10-16) : deux décisions de plus. **D-17** (remplace D-1) : le Combat ne se désactive plus jamais tout seul ; la bascule automatique face à un Éteint **rend rouge** ; deux états seulement. **D-18** : toute déconnexion là où il y a des Éteints (haltes et lieux personnels) laisse le corps 1 minute, duel ou pas (contre la triche).*

*v0.2 (2026-10-16) : les questions Q-1 à Q-9 tranchées (§5, consignées dans `duel-entre-joueurs.md` v0.3, D-7 à D-16). Le duel passe **avant** les murs et les sols : il prend la **0.11**, les murs la **0.12**. En rouge, on vise **le plus proche**, joueur ou Éteint ; le corps reste **1 minute** ; on ne provoque pas god. Une demande du porteur : à la fin, **« + machette » au-dessus du gagnant et « − machette » au-dessus du perdant**, vus de tous.*

*v0.1 (2026-10-16) : le plan rédigé, après lecture du code.*

*Code de départ : `main` 9f43728 (la 0.10.1 et la mise en production sur le VPS). Les numéros de ligne sont ceux de ce commit. La référence des règles : [`duel-entre-joueurs.md`](duel-entre-joueurs.md) (v0.2, D-1 à D-6), qu'on applique sans les rediscuter. Les questions que ces règles ne couvrent pas sont au §5 ; leurs réponses sont dans `duel-entre-joueurs.md` (v0.3).*

---

## 0. En bref

- **Ce que livre la version** : le halo rouge ou vert, le duel avec ses deux jauges vues de tous, l'objet gagné, la protection de 45 s, les Éteints pendant le duel, la fuite qui annule, le corps qui reste dans la halte à la déconnexion, et les textes qui expliquent tout ça en jeu.
- **Où** : les **quatre haltes** seulement (la station, le gué, la route du pont, la corniche). Les autres lieux sont soit personnels (on y est seul : Coopérative, Moulin, hôtel, phare), soit interdits par le Book 01 (le terrain, le Comptoir). Le péage et le tunnel ne sont pas des lieux : ce sont des passages dans la route du pont et la corniche.
- **Le numéro : 0.11.** C'est une vraie nouveauté, pas un correctif.
- **Avant les murs et les sols** (décidé, Q-1) : le duel est codé tout de suite après ton accord ; les murs et les sols passent en **0.12**.
- **Cinq choses trouvées en lisant le code**, qui comptent pour la suite :
  1. **Le bouton existe déjà** (« Explorer / Combat » en bas de l'écran du téléphone, touche X au clavier), **mais le choix ne tient pas** : `majMode` (`client/src/main.ts:1594`) repasse en Exploration 3 s après le dernier Éteint, même si l'on avait choisi Combat soi-même. **Décidé (D-17)** : on enlève ce retour automatique ; la bascule automatique face à un Éteint reste, et elle rend rouge. Deux états : Exploration (vert) et Combat (rouge).
  2. **Le serveur ne sait toucher que des Éteints** : la frappe (`cibleDevant`, `serveur/src/joueur.ts:1151`), le tir (`serveur/src/tir.ts:286`) et les pièges ne reçoivent même pas la liste des joueurs. Et il **ne garde aucune position passée** : tout est jugé sur la position du moment.
  3. **Un joueur qui se déconnecte disparaît aussitôt** de la halte (`Joueur.partir`, `joueur.ts:2250`). La règle « une déconnexion laisse le joueur dans la halte » demande donc un **corps qui reste**, à créer (Q-7).
  4. **Il n'y a pas d'objets de quête** : les quêtes ne demandent que des objets ordinaires. Les objets à exclure du tirage sont les **objets-clés des lieux** (`estObjetCle`, `commun/src/economie.ts:63`), les **clés de porte** (`cle_coffre`, `cle_moulin`) les **pièces de famille** et les **sacs et ce qui roule** (Q-6).
  5. **L'arbalète de garde ne se pose que sur le terrain** (`joueur.ts:2734`) : elle ne peut jamais viser un joueur en duel. N2-Q5 est sans objet (Q-2).
- **Estimation** : ≈ 12 jours-agent ; en temps réel, **une journée à une journée et demie** de travail des agents, plus tes choix et tes essais (§6).

---

## 1. Ce que les règles demandent au code

| Règle | Ce qui manque aujourd'hui | Chantier |
|---|---|---|
| §1 Le mode choisi tient, le halo le montre à tous | Le mode n'existe que chez le joueur ; la défense automatique l'écrase | A |
| §2 Frapper un joueur, en rouge seulement | La frappe ne vise que des Éteints | B, C |
| §2 Un seul duel à la fois | Rien | B |
| §3 Coups presque égaux (× 1,5 au plus), 20 à 40 s, pas d'étourdissement | Rien : les dégâts des armes vont de 0,35 (poings) à 3,2 | B |
| §3 Les deux jauges vues des témoins | Rien | B, D |
| §4 Les Éteints touchent la jauge ; la saisie à trois la vide | La morsure et la saisie vont à la santé | B |
| §5 L'objet tiré au hasard, trop lourd → aux pieds ; 45 s de protection | Le transfert existe pour l'échange (`appliquerEchange`, `joueur.ts:959`) ; la chute au sol existe pour les débris d'arme (`joueur.ts:1585`) | B |
| §6 On ne quitte pas la halte ; la déconnexion laisse le corps | Seule la saisie bloque le départ ; le joueur déconnecté disparaît | B, E |
| §6 25 m pendant 10 s annulent le duel | Rien | B |
| §7 Chaque lieu dit si le duel y est permis | Aucun champ dans le registre des lieux | B |
| §8 Juger un coup d'après ce que voyait celui qui frappe (≈ 150 ms) | Aucun historique des positions | C |
| §8 Expliquer le halo et le duel en jeu | Rien | F |

---

## 2. Le format des messages (fixé d'avance)

Comme pour la 0.9 (`plan-0.9.md` §3.4) : ce contrat permet de mener le serveur et le client en même temps. Chaque ajout en bloc séparé, en fin de `commun/src/messages.ts`.

- **Client → serveur** : `{ t: "mode", combat: boolean }`, le mode, qu'il vienne du bouton ou de la bascule automatique (D-17).
- **`AutreVu`** prend **`rouge?: true`** (absent : vert). Il fait partie de l'identité (`cleIdentite`, `serveur/src/presences.ts:46`) : il ne part que quand il change.
- **`GesteAutre`** prend **`"tressaille"`** : le coup reçu d'un joueur, sans recul (le `"touche"` actuel reste pour la morsure).
- **`{ t: "duels", d: DuelVu[] }`**, avec `DuelVu = { a: number; b: number; ja: number; jb: number }` (les deux joueurs et leurs jauges, de 0 à 1) : à tous ceux qui voient l'un des deux, au tour des présences, **seulement quand une jauge change** ; une liste vide efface.
- **`{ t: "duel_fin", a: number; b: number; issue: "gagne" | "annule"; gagnant?: number; objet?: CleObjet; auSol?: boolean }`** : aux mêmes témoins, une fois.

---

## 3. Les chantiers

**Effort** : **S** = une demi-journée à un jour ; **M** = un à trois jours ; **L** = trois à cinq jours de travail d'un agent.

### Chantier A · Le mode choisi et le halo — **M**

- **Commun** : le message `mode`, le champ `rouge`.
- **Serveur** : `Joueur.modeChoisi` (Exploration à chaque connexion, Q-4) ; le getter de l'identité vue (`joueur.ts:~905`) ajoute `rouge`.
- **Client** (`main.ts`, D-17) : `majMode` garde la bascule automatique en Combat quand un Éteint approche, et **perd le retour automatique en Exploration** (`calmeDepuis`) ; chaque changement de mode part au serveur. Le bouton et la touche X basculent le mode, comme aujourd'hui.
- **Rendu** : le halo, sur soi et sur les autres : **l'anneau au sol** (D-19), rouge à pointes ou vert lisse, bordé de sombre ; **blanc et qui se vide pendant les 45 s de protection** (D-24). Le bouton porte la pastille du halo, qui bat quand le Combat se met tout seul (D-19). Un joueur vert frappé passe en Combat tout seul (D-20). Une seule géométrie partagée, pas de lumière en plus (R42 : l'iPhone tient 60 i/s).
- **Tests** : le Combat tient après le départ du dernier Éteint ; la bascule automatique part au serveur et rend rouge ; `rouge` n'entre dans l'identité que quand il change.

### Chantier B · Le duel côté serveur — **L**

Un module à part, `serveur/src/duel.ts`, et ses règles pures dans `commun/src/duel.ts` (testables sans serveur). `joueur.ts` ne reçoit que des points d'appel.

- **Le registre des lieux** : un champ `duel: boolean` dans `FicheLieu` (`commun/src/registre-lieux.ts:58`), **obligatoire** : vrai pour les quatre haltes, faux partout ailleurs ; le test du registre refuse un lieu qui ne le dit pas (§7 : « chaque nouvelle zone devra dire… »).
- **Frapper un joueur** : `cibleDevant` cherche aussi les joueurs, **seulement si l'on a choisi le mode Combat**, dans un lieu où le duel est permis, en visant **le plus proche** devant soi, joueur ou Éteint (Q-5). La position de la cible est **rembobinée** (chantier C). Personne à travers un mur (`voieLibre`), pas d'autre étage au phare.
- **Ce qu'on ne peut pas toucher** (le coup part dans le vide, avec une phrase courte, Q-8) : un joueur déjà en duel avec un autre ; un perdant protégé (45 s) ; un joueur en route ou qui n'est plus là. Le compte god, qu'on ne provoque pas et qui ne provoque pas (Q-3).
- **La jauge** (D-5, D-6, Q-9) : 100 points ; chaque coup qui touche retire une part fixe qui dépend de l'arme, bornée entre 1 et 1,5 ; pas d'étourdissement ni de recul, seulement le geste `tressaille` ; l'esquive protège comme contre un Éteint ; l'endurance se dépense comme d'habitude.
- **Les Éteints pendant le duel** (§4) : les coups d'un duelliste ne leur font rien ; leur morsure va à la jauge (Q-9) ; la saisie à trois vide la jauge (D-3) ; si un Éteint vide la jauge, le duelliste perd (D-2). La santé ne bouge pas tant que le duel dure.
- **La fin** (§5) : l'objet tiré au hasard (une chance par unité, hors exclusions, Q-6), avec sa charge s'il en a une (comme l'échange, `chargesQuiPartent`) ; trop lourd → posé aux pieds du gagnant, en tas ramassable (`poserAuSol`) ; le perdant protégé 45 s ; un perdant au sac vide ne donne rien (Q-8). Le tout dans une seule transaction (`enBloc`).
- **Fuir et quitter** (§6) : `voyager` refusé pendant un duel (Q-8) ; plus de 25 m pendant 10 s → annulé ; un échange ou une leçon en cours s'annulent au premier coup ; une action de travail s'arrête.
- **La diffusion** : les messages `duels` et `duel_fin` aux témoins (même rayon et même vue à travers les murs que les présences).
- **Tests** : vert ne frappe jamais un joueur ; le premier coup lance le duel et retire déjà sa part ; un troisième ne touche pas un duelliste ; l'écart des armes ≤ 1,5 ; un duel simulé entre deux joueurs de même force dure 20 à 40 s ; la morsure va à la jauge, pas à la santé ; la saisie à trois vide la jauge ; l'Éteint qui vide la jauge fait perdre ; le tirage n'offre jamais un objet exclu ; le sac plein fait tomber l'objet ; le perdant ne peut pas être attaqué pendant 45 s mais peut attaquer ; 25 m pendant 10 s annulent ; partir est refusé ; aucun lieu sans le champ `duel`.

### Chantier C · Juger d'après ce que voyait celui qui frappe — **S**

- Chaque joueur garde **ses positions de la dernière seconde**, avec l'heure du serveur (un petit tampon circulaire, 20 par seconde).
- Quand un joueur frappe un autre joueur, le serveur prend la position de la cible **150 ms plus tôt, plus la moitié du ping mesuré** de celui qui frappe (plafonné à 300 ms en tout), c'est-à-dire là où l'écran du frappeur la montrait. Le frappeur, lui, est jugé où il est.
- Les Éteints ne changent pas (leur affichage n'est pas différé, `plan-0.9.md` Q-3).
- **Tests** : une cible qui court est touchée là où elle était 150 ms plus tôt ; au-delà du plafond, pas de rembobinage plus long.

### Chantier D · Ce qu'on voit du duel — **M**, maquette d'abord

- **Les deux jauges au-dessus des duellistes**, chez eux et chez les témoins : **une barre fine sous le nom**, la sienne sous « Toi » (D-19) ; les étiquettes trop proches s'écartent ; une couche HTML au-dessus des personnages plutôt que l'étiquette dessinée dans la scène.
- **Le tressaillement** : **le buste plie en arrière puis revient** (D-19) ; pas de recul ni d'étourdissement.
- **La fin** : **au-dessus du gagnant, « + machette » (l'icône et le nom), au-dessus du perdant, « − machette »**, quelques secondes, vus des deux duellistes et des témoins (demande du porteur, D-16) ; le « + » monte, le « − » descend (D-19) ; **« sac vide » au-dessus du perdant** si son sac était vide (D-21) ; puis la phrase au gagnant et au perdant, **rien pour les témoins** (D-22) ; **l'annulation par la fuite** (un message qui passe) ; **« trop loin · N s » sous la jauge** pendant qu'on s'éloigne (D-19).
- Tout en messages qui passent, jamais de fenêtre (R48).
- **Tests** : `duels` et `duel_fin` dessinent puis effacent ; un témoin qui arrive pendant un duel voit les jauges.

### Chantier E · Le corps qui reste à la déconnexion — **M**

- **Partout où il y a des Éteints** (les haltes et les lieux personnels ; ni au terrain ni au Comptoir), **toute déconnexion laisse le corps 1 minute**, immobile (D-18, contre la triche). Pendant un duel, le joueur **perd en plus le duel tout de suite** (l'objet part au gagnant, Q-7). Les Éteints le voient et l'attaquent comme un joueur ; sa santé encaisse ; s'il s'effondre, c'est l'effondrement habituel (le sac reste sur place, lui seul peut le reprendre).
- S'il se reconnecte avant la fin, il reprend la main **là où est son corps**.
- **Tests** : déconnecté en duel → perd, le corps reste, un Éteint le mord ; reconnecté → au même endroit ; après 1 minute, le corps s'en va.

### Chantier F · Les textes et l'explication — **S**

- Les phrases tranchées en Q-4 et Q-8 : la première fois qu'on passe en mode Combat dans une halte, la première fois qu'on voit un halo rouge, le début et la fin d'un duel, les refus.
- L'aide « Se battre » (`client/src/aide-contenu.ts:392`) : un bloc « Le duel ».
- Sans jargon, jamais « clé » ; le mot « duel » est-il compris ? (Q-4).

### Chantier H · Les maquettes — **S à M**, avant tout code visible

Une page jouable sur ton iPhone, `.claude-travail/maquettes-duel/`, comme celles de la 0.10.1, avec des variantes à choisir :

1. **Le halo** (rouge et vert, de jour et de nuit, de près et à 30 m) : un anneau au sol, un liseré autour du personnage, une petite flamme au-dessus de la tête.
2. **Le bouton du mode** : comment il montre le mode, et la bascule automatique en Combat quand un Éteint approche (elle rend rouge et tient, D-17).
3. **Les deux jauges** au-dessus des duellistes, vues par eux et par un témoin.
4. **Le tressaillement** sans étourdissement.
5. **La fin** : le « + machette » au-dessus du gagnant et le « − machette » au-dessus du perdant (D-16), l'objet tombé aux pieds, le sac vide ; **l'annulation** par la fuite.

### Chantier G · La recette, les books, la version — **S**, à la fin

- La recette au strict nécessaire : `npm run verif`, `npm test`, `npm run build`, et un contrôle ciblé à deux comptes sur le serveur d'essai (un duel gagné, un objet tombé aux pieds, une fuite, une déconnexion).
- Les books : `duel-entre-joueurs.md` (v0.3 puis « codé »), **Book 21** (le « désactivé partout » remplacé pour le duel dans les haltes), **Book 01** (§6 bis : le pillage remplacé, pour le duel, par l'objet tiré au hasard ; l'effondrement avec perte de l'inventaire ne vient pas du duel), Book 08 (le mode), Book 06 (les Éteints et les duellistes) ; la bible, régénérée ; `en-suspens.md`.
- `VERSION`, `code/VERSIONS.md`, ce plan à jour. Tu déploies (préprod puis prod).

---

## 4. L'ordre et l'organisation

| Étape | Quoi | Avant l'étape suivante |
|---|---|---|
| **1** | Ce plan, tes réponses aux questions (§5), consignées dans `duel-entre-joueurs.md` v0.3 | Ton accord |
| **2** | Les maquettes (H) | Ton choix sur chaque variante |
| **3** | Le code (avant les murs, Q-1) : **A, B, C** en même temps (le format du §2 fixé), puis **D, E, F** | — |
| **4** | La fusion → ton essai sur la préprod du Pi, à deux comptes | — |
| **5** | G → ta validation → fusion dans `main` ; l'étiquette `v0.11` après ton déploiement | — |

**Où** : la branche `integration-duel` (worktree `.claude-travail/integration-duel`, partie de `main`) ; un worktree par chantier `.claude-travail/wt-duel/<lettre>-<nom>` (branches `duel/<lettre>-<nom>`), `node_modules` cloné par `cp -cR`, lien `batiment`. **Ports** (jamais 9333) : serveur 84N1, admin 84N2, Vite 54N1, Chrome 94N1 (A : 8411…, B : 8421…, etc.). Consigne commune : `.claude-travail/consigne-duel.md`. Fusions par `git -C <chemin absolu>`.

**Fichiers partagés** : `serveur/src/joueur.ts` (A : le mode ; B : des points d'appel vers `duel.ts` ; C : le tampon des positions ; E : `partir`) ; `commun/src/messages.ts` (le bloc du §2, écrit une fois au début) ; `client/src/main.ts` (A le mode, D les messages du duel). Ordre de fusion : C, A, B, puis D, E, F.

**Pas de remise à zéro** : rien ne change dans les sauvegardes, sauf si le mode choisi doit être gardé (Q-4 : non, Exploration à chaque connexion).

---

## 5. Les questions

*Toutes tranchées le 2026-10-16, une par une ; consignées dans `duel-entre-joueurs.md` v0.3 (D-7 à D-16).*

| # | Question | Recommandation |
|---|---|---|
| **Q-1** ✅ duel d'abord, murs en 0.12 | **Le duel et la 0.10.2** : après, ou à côté ? | **Après pour le code**, mais les maquettes et les questions dès maintenant. Le jeu a de vrais joueurs : deux versions séparées, deux recettes courtes |
| **Q-2** ✅ | **Les armes à distance** (arc, arbalète, pierre, hachette lancée) : lancent-elles un duel, touchent-elles pendant un duel ? | **Non, ni l'un ni l'autre** : le duel se fait au corps à corps. Une arbalète porte à 12 m et la fuite s'arrête à 25 m : le tir rendrait la fuite et l'égalité des coups (× 1,5) intenables. Pendant un duel, un tir ne fait rien aux Éteints non plus (§4). L'arbalète de garde : **sans objet** (elle ne se pose que sur le terrain) |
| **Q-3** ✅ on ne provoque pas god | **Le compte god** (invincible) face au duel | **Invincible, il est hors du duel** : il ne frappe pas les joueurs et on ne le frappe pas. **Invincibilité coupée, il duelle comme tout le monde** (pour essayer en prod sans prendre l'objet d'un vrai joueur par mégarde) |
| **Q-4** ✅ | **La bascule et l'explication** : le bouton existant suffit-il ? le mode choisi est-il gardé d'une connexion à l'autre ? quelles phrases ? | **Le bouton et la touche X existants**, qui basculent seulement le mode choisi ; **Exploration à chaque connexion** (le mode par défaut, §1). Des indices qui passent, une fois chacun, dans les haltes : voir les phrases proposées ci-dessous |
| **Q-5** ✅ le plus proche | **Rouge, quand un Éteint et un joueur sont tous deux devant soi** : qui le coup vise-t-il ? | **L'Éteint d'abord** : un joueur n'est visé que si aucun Éteint debout n'est à portée devant. Sinon, on lancerait un duel par accident en se battant à côté de quelqu'un |
| **Q-6** ✅ | **Ce qui est exclu du tirage**, en plus des objets-clés et des clés de porte | **Aussi les pièces de famille** (panneau solaire, enclume de dépanneur, petit alternateur : elles ne se vendent déjà pas) **et les sacs et ce qui roule** (sac à dos, sac de fortune, travois, brouette, charrette) : le perdant ne doit pas se retrouver avec un sac qui déborde |
| **Q-7** ✅ 1 minute | **Le corps laissé à la déconnexion** : combien de temps reste-t-il ? | **2 minutes**, immobile ; les Éteints l'attaquent comme un joueur ; reconnecté avant, on reprend la main là où il est |
| **Q-8** ✅ | **Les phrases des refus et des fins** | Voir les phrases proposées ci-dessous |
| **Q-9** ✅ | **Les réglages de la jauge** (D-5, D-6) | **100 points**. Frapper sans arrêt retire **4 points par seconde avec la plus faible arme** (les poings), **6 avec la plus forte** (× 1,5) ; la part d'un coup suit donc la durée du coup de l'arme (un couteau rapide retire moins par coup qu'une masse lente) ; le coup appuyé retire plus, à proportion de sa lenteur (pas d'avantage). Tous les coups touchés : 17 à 25 s ; avec les esquives et les ratés, ≈ 25 à 40 s. **La morsure d'un Éteint retire 18 points** (sa part de la santé aujourd'hui) |

**Les phrases** : *raccourcies le 2026-10-16 (D-23), la liste qui fait foi est dans `duel-entre-joueurs.md` §10* ; ci-dessous, les premières versions (Q-4 et Q-8), remplacées :

- Première fois en mode Combat dans une halte : « Tu es en Combat : les autres te voient en rouge, et tu peux frapper un voyageur. »
- Première fois qu'on voit un halo rouge : « Ce voyageur est en rouge : il peut te frapper. En vert, on ne cherche pas la bagarre. »
- Début du duel, pour les deux : « Duel avec Paul ! Vide sa jauge avant qu'il vide la tienne. »
- Gagné : « Tu gagnes le duel : tu prends sa machette. » ; sac trop lourd : « Tu gagnes le duel : sa machette tombe à tes pieds. »
- Perdu : « Duel perdu : Paul te prend ta machette. »
- Annulé par la fuite : « Trop loin l'un de l'autre : le duel est annulé. »
- Partir pendant un duel : « Pas pendant un duel : gagne-le, ou éloigne-toi. »
- Frapper un duelliste : « Ils sont en duel : laisse-les finir. »
- Frapper un perdant protégé : « Il vient de perdre un duel : laisse-le souffler. »
- Le perdant au sac vide : « Tu gagnes le duel, mais son sac est vide. »
- Frapper god (Q-3) : « On ne se bat pas avec Dieu. »

---

## 6. L'estimation

| Chantier | Effort | Jours-agent |
|---|---|---|
| H · Les maquettes | S à M | 1,5 |
| A · Le mode et le halo | M | 1,5 |
| B · Le duel côté serveur | L | 4 |
| C · Le rembobinage | S | 0,5 |
| D · Ce qu'on voit du duel | M | 2 |
| E · Le corps à la déconnexion | M | 1,5 |
| F · Les textes | S | 0,5 |
| G · Recette, books, version | S | 1 |
| **Total** | | **≈ 12,5 jours-agent** |

**Les risques** : le corps laissé à la déconnexion (E) est une mécanique neuve, qui touche la boucle de connexion ; le rembobinage (C) ne se juge bien qu'à deux sur de vrais téléphones ; le réglage de la jauge (Q-9) se confirmera en jouant, sans doute en une retouche.

---

## 7. Les critères (ce que tu dois pouvoir faire sur l'iPhone, à deux comptes)

1. Basculer en Combat : le halo devient rouge chez l'autre ; un Éteint qui approche met en Combat et rend rouge ; rien ne repasse en Exploration tout seul.
2. En vert, impossible de frapper un joueur ; en rouge, le premier coup lance le duel et les deux jauges apparaissent, aussi chez un troisième joueur.
3. Un coup reçu fait tressaillir, sans étourdir.
4. Un duel entre deux joueurs de même force dure entre 20 et 40 s.
5. Un Éteint qui mord un duelliste vide sa jauge, pas sa santé.
6. Le gagnant prend un objet (jamais un objet-clé) ; « + machette » au-dessus de lui, « − machette » au-dessus du perdant, vus aussi d'un témoin ; sac plein, l'objet tombe à ses pieds.
7. Le perdant n'est plus attaquable pendant 45 s, mais peut attaquer.
8. S'éloigner à plus de 25 m pendant 10 s annule le duel ; partir de la halte est refusé.
9. Fermer la page pendant un duel : on perd, le corps reste 1 minute exposé aux Éteints ; hors duel, dans une halte ou un lieu personnel, le corps reste aussi 1 minute.
10 bis. Frapper god : « On ne se bat pas avec Dieu. », rien ne se passe.
10. Aucun duel au terrain, au Comptoir ni dans un lieu personnel.
11. `npm run verif`, `npm test`, `npm run build` passent ; une partie 0.10.1 se relit.
