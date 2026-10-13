# Le combat entre joueurs : le duel

*Version : v0.2 · 2026-10-13 · **Statut : règles décidées par le porteur, pas encore planifiées ni codées**.*

*v0.2 (2026-10-13) : le porteur accepte les six propositions du §9 ; il n'y a plus de question ouverte.*

*Quand : **bien après la 0.9**, une fois validé en jeu que les interactions entre joueurs sont fluides (`plan-0.9.md`). Ce document remplace, pour le combat entre joueurs, la règle du Book 21 (« désactivé partout ») au moment où il sera codé. Il remplace aussi, pour le duel, l'effondrement avec perte de l'inventaire prévu par le Book 01.*

---

## 0. En bref

- **Un coup qui touche un autre joueur lance un duel.** Les deux joueurs reçoivent une **jauge de duel**, distincte de leur santé.
- **Ils se battent jusqu'à ce qu'une des deux jauges soit vide.** Le gagnant prend **un objet tiré au hasard** dans le sac du perdant.
- **Personne ne perd de vraie santé à cause de l'autre joueur.** Le duel ne tue pas, et l'écart de force entre deux joueurs compte, mais peu.
- **Le halo dit l'état d'esprit de chacun, de loin** : rouge en mode Combat, vert en mode Exploration.

---

## 1. Le mode et le halo

- **L'Exploration est le mode par défaut.** Le joueur bascule lui-même en mode Combat, et **ce choix tient** jusqu'à ce qu'il le change.
- **La bascule automatique face à un Éteint reste.** Elle ne vise que les Éteints, et revient seule en Exploration quand la menace est passée (règle actuelle de `majMode`, `client/src/main.ts`).
- **Le halo suit le mode choisi** : **rouge** en mode Combat, **vert** en mode Exploration. Le mode choisi est connu du serveur et diffusé à tous ceux qui voient le joueur.
- **La bascule automatique ne change pas le halo** (D-1). Celui qui se défend contre un Éteint reste vert : il n'est pas hostile.

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
| D-1 | La bascule automatique face à un Éteint change-t-elle le halo ? | Non : il reste vert (§1) |
| D-2 | Un Éteint qui vide la jauge d'un duelliste : ce dernier perd-il le duel, donc un objet ? | Oui, comme un coup de l'autre joueur (§4) |
| D-3 | La saisie par trois Éteints pendant un duel | Elle vide la jauge de duel d'un coup (§4) |
| D-4 | La distance et le temps qui annulent un duel par la fuite | 25 m pendant 10 secondes (§6) |
| D-5 | La taille de la jauge de duel et la part retirée par coup | À régler pour un duel d'environ 20 à 40 secondes entre deux joueurs de même force |
| D-6 | L'écart entre la meilleure et la moins bonne arme | Au plus 1,5 fois (§3) |
