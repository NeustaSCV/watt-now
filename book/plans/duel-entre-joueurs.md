# Le combat entre joueurs : le duel

*Version : v0.5 · 2026-10-16 · **Statut : codé en 0.11 (en préparation)** (`plan-duel.md`).*

*v0.5 (2026-10-16) : D-25 (les sept choix du codage, acceptés) et D-26 (l'indice du Combat différé).*

*v0.4 (2026-10-16) : le duel codé en 0.11, en recette ; le statut seul change, aucune décision.*

*v0.3 (2026-10-16) : les questions D-7 à D-24 (dont les choix sur maquette, D-19), apparues en préparant le plan, tranchées par le porteur, et sa demande D-16 (§10) ; le duel passe **avant** les murs et les sols, en **0.11** (les murs en 0.12).*

*v0.2 (2026-10-13) : le porteur accepte les six propositions du §9 ; il n'y a plus de question ouverte.*

*Quand : **en 0.11** (décidé le 2026-10-16), après la 0.9 validée en jeu ; à l'origine « bien après la 0.9 », une fois validé en jeu que les interactions entre joueurs sont fluides (`plan-0.9.md`). Ce document remplace, pour le combat entre joueurs, la règle du Book 21 (« désactivé partout ») au moment où il sera codé. Il remplace aussi, pour le duel, l'effondrement avec perte de l'inventaire prévu par le Book 01.*

---

## 0. En bref

- **Un coup qui touche un autre joueur lance un duel.** Les deux joueurs reçoivent une **jauge de duel**, distincte de leur santé.
- **Ils se battent jusqu'à ce qu'une des deux jauges soit vide.** Le gagnant prend **un objet tiré au hasard** dans le sac du perdant.
- **Personne ne perd de vraie santé à cause de l'autre joueur.** Le duel ne tue pas, et l'écart de force entre deux joueurs compte, mais peu.
- **Le halo dit l'état d'esprit de chacun, de loin** : rouge en mode Combat, vert en mode Exploration.

---

## 1. Le mode et le halo

- **L'Exploration est le mode par défaut.** Le joueur bascule lui-même en mode Combat, et **ce choix tient** jusqu'à ce qu'il le change.
- **La bascule automatique face à un Éteint reste.** ~~Elle ne vise que les Éteints, et revient seule en Exploration quand la menace est passée (règle actuelle de `majMode`, `client/src/main.ts`).~~ *Depuis D-17 (2026-10-16)* : elle met en Combat, et **ne revient jamais seule en Exploration**.
- **Le halo suit le mode choisi** : **rouge** en mode Combat, **vert** en mode Exploration. Le mode choisi est connu du serveur et diffusé à tous ceux qui voient le joueur.
- ~~**La bascule automatique ne change pas le halo** (D-1).~~ *Remplacé le 2026-10-16 (D-17)* : **la bascule automatique met en Combat pour de bon, et le halo devient rouge** ; **rien ne repasse jamais tout seul en Exploration** : seul le joueur y revient, avec le bouton.

## 2. Lancer un duel

- **Il faut être en mode Combat (rouge)** pour frapper un joueur, donc pour lancer un duel.
- **On peut frapper un joueur vert** : celui qui passait par là avec son butin n'est pas à l'abri. Il a vu de loin le halo rouge de l'autre.
- **Le premier coup qui touche lance le duel** et retire déjà sa part de la jauge de l'autre. La surprise est récompensée sans tout décider.
- **Un joueur ne mène qu'un duel à la fois.** Les coups des autres joueurs ne touchent pas un duelliste.

## 3. Les coups pendant le duel

- **Des coups presque égaux.** Chaque coup qui touche retire une part fixe de la jauge. **Une bonne arme donne un avantage, mais amoindri** : la plus forte frappe **au plus 1,5 fois** plus que la plus faible (D-6).
- **La jauge** est réglée pour qu'un duel entre deux joueurs de même force dure **de 20 à 40 secondes** (D-5).
- **Pas d'étourdissement entre joueurs.** Un coup reçu fait tressaillir, sans étourdir ni faire reculer. On peut toujours riposter, esquiver ou repousser. Personne ne gagne en martelant.
- **Les deux jauges se voient**, au-dessus des deux duellistes, et **les témoins les voient aussi**.

## 4. Les Éteints pendant le duel

- **Les coups des duellistes ne font rien aux Éteints** tant que le duel dure.
- **Les coups des Éteints touchent les duellistes**, et c'est leur **jauge de duel** qui encaisse.
- **Dès qu'une jauge est vide, le duel s'arrête et se résout** (§5). Il reste les Éteints, et chaque joueur retrouve sa santé normale, qui encaisse à nouveau.
- **Si c'est un Éteint qui vide la jauge d'un duelliste, ce dernier perd le duel**, comme s'il avait été touché par l'autre joueur (D-2).
- **La saisie par trois Éteints**, qui aujourd'hui fait s'effondrer, **vide la jauge de duel d'un coup** (D-3).

## 5. La fin du duel

- **Le gagnant** prend **un objet tiré au hasard** dans le sac du perdant.
  - **Exclus du tirage** : les clés et les objets de quête.
  - **L'arme en main peut être prise.**
  - **Si le sac du gagnant est trop lourd**, l'objet tombe à ses pieds.
- **Le perdant n'est plus la cible d'aucun duel pendant 45 secondes**, de la part de qui que ce soit.
- **Le perdant, lui, peut lancer un duel** pendant ce temps, par exemple pour récupérer son butin.

## 6. Fuir et quitter

- **On ne peut pas quitter la halte pendant un duel.**
- **Une déconnexion laisse le joueur dans la halte.** Il perd le duel, et il reste exposé aux Éteints : c'est pire que de perdre le duel.
- **La fuite.** Tout le monde court à la même vitesse. Si un joueur fuit et que l'autre ne le poursuit pas, **le duel est annulé**, sans gagnant ni objet gagné.
  - Le duel est annulé quand les deux joueurs sont **à plus de 25 m l'un de l'autre pendant 10 secondes** (D-4).

## 7. Où

- **Dans les haltes uniquement**, pour l'instant.
- **Chaque nouvelle zone devra dire** si le combat entre joueurs y est permis ou non. Rappel du Book 01 : jamais sur un terrain ni au Comptoir.

---

## 8. Ce qu'il faut avant de le coder

- **La 0.9 validée en jeu** : on voit les autres joueurs se déplacer et frapper sans à-coups. Les gestes, l'allure et l'affichage différé sont transmis.
- **Juger un coup d'après ce que voyait celui qui frappe** : l'affichage des autres a environ 150 ms de retard, et le serveur doit en tenir compte.
- **Côté serveur**, aujourd'hui :
  - le mode Combat n'existe que sur l'écran du joueur (`client/src/main.ts`) ;
  - une frappe ne peut viser que des Éteints (`cibleDevant`, `serveur/src/joueur.ts`).
  Il faudra donc le mode choisi diffusé, la frappe sur un joueur, l'état du duel et les deux jauges.
- **Les textes** : expliquer le halo et le duel en jeu (tutoriel ou indice à la première rencontre), sans jargon.

## 9. Les questions tranchées (2026-10-13)

| N° | Question | Décision du porteur |
|---|---|---|
| D-1 | La bascule automatique face à un Éteint change-t-elle le halo ? | ~~Non : il reste vert (§1)~~ *Remplacé par D-17 (2026-10-16) : oui, elle rend rouge* |
| D-2 | Un Éteint qui vide la jauge d'un duelliste : ce dernier perd-il le duel, donc un objet ? | Oui, comme un coup de l'autre joueur (§4) |
| D-3 | La saisie par trois Éteints pendant un duel | Elle vide la jauge de duel d'un coup (§4) |
| D-4 | La distance et le temps qui annulent un duel par la fuite | 25 m pendant 10 secondes (§6) |
| D-5 | La taille de la jauge de duel et la part retirée par coup | À régler pour un duel d'environ 20 à 40 secondes entre deux joueurs de même force |
| D-6 | L'écart entre la meilleure et la moins bonne arme | Au plus 1,5 fois (§3) |

## 10. Les questions tranchées en préparant le plan (2026-10-16)

| N° | Question | Décision du porteur |
|---|---|---|
| D-7 | Le duel et la 0.10.2 (les murs et les sols) | **Le duel d'abord, en 0.11** ; les murs et les sols repoussés en **0.12** |
| D-8 | Les armes à distance (arc, arbalète, pierre, hachette lancée) | **Le duel se fait au corps à corps** : un tir ne lance pas de duel et ne touche pas l'autre pendant un duel ; pendant un duel, un tir ne fait rien aux Éteints non plus (§4). L'arbalète de garde (N2-Q5) est sans objet : elle ne se pose que sur le terrain, où le duel est interdit |
| D-9 | Le compte god | **On ne peut pas provoquer god en duel** (« il n'est qu'amour ») ; il ne lance pas de duel non plus. Le joueur qui le frappe lit : « On ne se bat pas avec Dieu. » |
| D-10 | La bascule et le mode choisi | Le bouton « Explorer / Combat » et la touche X existants basculent **le mode choisi** (le halo), qui tient même quand les Éteints s'en vont ; **Exploration à chaque connexion** |
| D-11 | En rouge, un Éteint et un joueur tous deux devant soi, à portée | **Le plus proche** est visé, joueur ou Éteint |
| D-12 | Ce qui est exclu du tirage, en plus des objets-clés des lieux et des clefs de porte (il n'existe pas d'objet de quête) | **Aussi les pièces de famille** (panneau solaire, enclume de dépanneur, petit alternateur) **et les sacs et ce qui roule** (sac à dos, sac de fortune, travois, brouette, charrette) |
| D-13 | Le corps laissé à la déconnexion | Le joueur perd le duel tout de suite ; son corps reste **1 minute** dans la halte, immobile, exposé aux Éteints (santé, saisie, effondrement habituels) ; reconnecté avant, il reprend la main là où est son corps |
| D-14 | Les réglages de la jauge (D-5, D-6) | **100 points**. Frapper sans arrêt retire **4 points par seconde avec la plus faible arme** (les poings) et **6 avec la plus forte** : l'écart × 1,5 se juge par seconde de combat, la part d'un coup suit la durée du coup ; le coup appuyé retire plus, à proportion de sa lenteur. Tous les coups touchés : 17 à 25 s ; avec esquives et ratés, ≈ 25 à 40 s. **Une morsure d'Éteint retire 18 points** |
| D-16 | Comprendre la fin du duel | *Demande du porteur* : à la résolution, **« + machette » au-dessus du gagnant et « − machette » au-dessus du perdant** (l'objet réellement pris), vus des duellistes et des témoins |
| D-17 | Le mode Combat après la bascule automatique (*remplace D-1*) | **Le Combat ne se désactive plus jamais tout seul** ; il s'active encore tout seul quand un Éteint approche, et **le halo devient rouge**, comme un Combat choisi. Deux états seulement : Exploration (vert) et Combat (rouge) ; seul le joueur repasse en Exploration |
| D-18 | La déconnexion comme triche, hors duel aussi | **Partout où il y a des Éteints** (les quatre haltes et les lieux personnels : Coopérative, Moulin, hôtel, phare), **toute déconnexion laisse le corps 1 minute**, immobile, exposé aux Éteints ; ni au terrain ni au Comptoir. Reconnecté avant la fin, on reprend la main là où il est. En duel, on perd en plus le duel (D-13) |
| D-19 | Les maquettes (`.claude-travail/maquettes-duel/`) | **Halo V1** : un anneau au sol, rouge à pointes en Combat, vert lisse en Exploration, bordé de sombre. **Bouton V2** : il porte la pastille du halo, qui bat quand le Combat se met tout seul. **Jauges V1** : une barre fine sous le nom de chacun ; la sienne sous « Toi ». **Coup reçu V2** : le buste plie en arrière puis revient, sans recul ni étourdissement. **Fin V1** : « + machette » monte au-dessus du gagnant, « − machette » descend au-dessus du perdant ; pendant la fuite, « trop loin · N s » sous la jauge |
| D-20 | Un joueur vert frappé par un rouge | **Il passe en Combat tout seul** (donc rouge), comme face à un Éteint, pour riposter |
| D-21 | Le perdant au sac vide | **« sac vide »** au-dessus du perdant ; rien au-dessus du gagnant (sa phrase le dit) |
| D-22 | Une phrase pour les témoins à la fin d'un duel | **Rien** : ils voient les étiquettes au-dessus des duellistes |
| D-23 | Les phrases trop longues pour l'écran | **Raccourcies** (elles remplacent celles de D-15) : voir ci-dessous |
| D-24 | Un repère des 45 s de protection | **Oui : l'anneau du perdant devient blanc et se vide comme une horloge** pendant 45 s, vu de tous ; il reprend sa couleur à la fin. Le perdant peut lancer un duel pendant ce temps (§5) ; il garde l'anneau blanc jusqu'au bout des 45 s |
| D-25 | Ce que le codage a dû choisir (accepté le 2026-10-16) | **(1)** Un duel coupe un échange ou une leçon : « Un duel commence : l'échange est annulé. » / « Un duel commence : la leçon s'arrête. » ; **(2)** épuisé, un coup sur un joueur retire quand même sa part pleine ; **(3)** l'arme gagnée arrive neuve (l'usure reste chez le perdant, comme à l'échange) ; **(4)** quand la saisie à trois vide la jauge, les trois Éteints lâchent prise ; **(5)** un perdant protégé ne fait pas écran : un Éteint derrière lui prend le coup ; **(6)** god reste hors du duel même quand il n'est plus invincible ; **(7)** le corps qui s'effondre pendant la minute d'absence : le joueur lit « Des inconnus t'ont ramené chez toi, sans ton sac. » à son retour |
| D-26 | L'indice « En Combat, les autres te voient en rouge. » arrive en même temps que « Duel avec… » chez le joueur frappé | **Différé** : il attend un passage en Combat sans duel (le bouton ou un Éteint) |
| D-15 | Les phrases du jeu (des messages qui passent ; chaque indice une seule fois) | Acceptées telles quelles : voir ci-dessous |

**Les phrases (D-23, raccourcies le 2026-10-16 ; elles remplacent D-15)** :

- Première fois en Combat dans une halte : « En Combat, les autres te voient en rouge. »
- Premier halo rouge vu : « Halo rouge : il peut te frapper. »
- Début : « Duel avec Paul ! »
- Gagné : « Duel gagné : tu prends sa machette. » ; sac plein : « Duel gagné : sa machette est à tes pieds. » ; sac vide : « Duel gagné, mais son sac est vide. »
- Perdu : « Duel perdu : Paul prend ta machette. » ; sac vide : « Duel perdu. Ton sac était vide. »
- Fuite : « Trop loin : duel annulé. »
- Partir : « Pas pendant un duel. »
- Frapper un duelliste : « Ils sont en duel. »
- Frapper un perdant protégé : « Il vient de perdre : laisse-le. »
- Frapper god : « On ne se bat pas avec Dieu. »

*Les phrases de D-15 (remplacées, gardées pour mémoire)* :

- Première fois en Combat dans une halte : « Tu es en Combat : les autres te voient en rouge, et tu peux frapper un voyageur. »
- Premier halo rouge vu : « Ce voyageur est en rouge : il peut te frapper. En vert, on ne cherche pas la bagarre. »
- Début du duel : « Duel avec Paul ! Vide sa jauge avant qu'il vide la tienne. »
- Gagné : « Tu gagnes le duel : tu prends sa machette. » ; sac plein : « Tu gagnes le duel : sa machette tombe à tes pieds. » ; sac vide : « Tu gagnes le duel, mais son sac est vide. »
- Perdu : « Duel perdu : Paul te prend ta machette. »
- Annulé par la fuite : « Trop loin l'un de l'autre : le duel est annulé. »
- Partir pendant un duel : « Pas pendant un duel : gagne-le, ou éloigne-toi. »
- Frapper un duelliste : « Ils sont en duel : laisse-les finir. »
- Frapper un perdant protégé : « Il vient de perdre un duel : laisse-le souffler. »
- Frapper god : « On ne se bat pas avec Dieu. »
