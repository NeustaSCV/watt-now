# Book 08 — Plateforme, Commandes et Financement

> Document de conception · version 0.2 · 2026-10-07
> Statut : **brouillon de travail**.
> 0.10 (2026-10-15) : §3.3, la jauge du coup appuyé autour du bouton A, et les bras pris (« Poser »).

---

## 1. Les phases du projet

| Phase | Public | Hébergement | Paiement |
|---|---|---|---|
| **Phase 0 — Test familial** | Famille et proches | Raspberry Pi, Docker (Book 17) | **Aucun** |
| **Phase 1 — Ouverture** | Public | À faire évoluer selon la pertinence du projet | Achat de Wh, dons, classements (§4) |

> **Règle ferme : rien de ce qui touche à l'argent réel (§4) n'est préparé ni développé tant que le porteur du projet n'en a pas donné le signal.** Pas de bouton, pas de jauge de dons, pas d'écran d'achat, pas de code de paiement, même désactivé. Le §4 consigne seulement les intentions pour plus tard. Le jeu doit être complet et équilibré sans.

---

## 2. Le navigateur comme plateforme

### 2.1 Un choix cohérent

Un jeu dans le navigateur est **cohérent avec le projet** :

- **une seule version** pour ordinateur, tablette et téléphone ;
- **pas de magasin d'applications** (ni validation, ni commission de 15 à 30 %) ;
- **la structure en petites maps** (Book 01 §2 bis) convient au web : chaque lieu se charge vite ;
- le serveur fait l'essentiel des calculs (monde, processus passifs, économie) : le navigateur n'affiche que ce que le joueur voit.

Le jeu est aussi **installable** comme une application (PWA : icône sur l'écran d'accueil, plein écran), sans passer par un magasin.

### 2.2 Points d'attention

| Point | Risque | Réponse |
|---|---|---|
| **Performances sur mobile** | Un vieux téléphone peine avec beaucoup de sprites et d'effets | Rendu 3D isométrique léger (modèles simples, ombres et lumières limitées), limites de zombies affichés, réglages de qualité |
| **iOS / Safari** | Le son ne démarre qu'après un geste de l'utilisateur ; plein écran limité ; l'onglet en arrière-plan est suspendu | Écran d'accueil avec un bouton « Jouer » qui débloque le son ; installation en PWA ; le serveur gère tout ce qui continue hors ligne |
| **Réseau mobile instable** | Une coupure involontaire déclenche la règle anti-fuite (30 s dans la map, Book 01 §2 bis) | Reconnexion automatique rapide. Le serveur ne distingue pas une coupure d'une fuite : la règle reste la même pour tous, c'est ce qui la rend juste. |
| **Taille des fichiers** | Long premier chargement | Chargement progressif : on télécharge les éléments d'un lieu quand on y entre |
| **Stockage local** | Le navigateur peut effacer les données | **Tout est sur le serveur.** Le navigateur ne garde que les réglages et le cache. |

### 2.3 Les entrées

| Appareil | Entrée | Technologie |
|---|---|---|
| Ordinateur | Clavier + souris, **ou manette** | Événements clavier et souris, API Gamepad |
| Tablette, téléphone | **Commandes tactiles affichées à l'écran**, ou manette Bluetooth | Événements tactiles, API Gamepad |

- **Toutes les commandes sont réassignables** (clavier comme manette), avec des préréglages.
- **Accessibilité :** choix entre « maintenir » et « appuyer pour basculer », aide à la visée réglable, taille et position des boutons tactiles réglables.

### 2.4 L'administration du test familial (0.8)

Le porteur gère les comptes depuis **une page web de son réseau local**, sur le port 4321 du Pi : les joueurs connectés, la fiche de chaque joueur (ce que le serveur sait déjà, sans compteur nouveau), la **réinitialisation d'un mot de passe** (un provisoire, affiché une fois, à donner au joueur) et la **suppression d'un compte** (en retapant son pseudo ; ses mesures partent avec lui, sauf sa vitesse de progression, gardée sans son nom, Book 17 §6). Ni mot de passe ni liste d'adresses (0.8.1) : la page n'est jamais publiée sur Internet, c'est sa seule protection (Book 17 §5.5). Le compte « god » y est protégé. Lisible sur téléphone comme sur ordinateur.

---

## 3. Les commandes

### 3.1 Le principe

Garder les commandes **très simples** : un déplacement, **deux boutons d'action**, et un **bouton de mode** qui change le sens des deux boutons d'action.

### 3.2 Trois propositions

| | **A. Deux boutons + modes** (recommandé) | **B. Un seul bouton contextuel** | **C. Bouton + roue** |
|---|---|---|---|
| **Principe** | A = action principale, B = action secondaire. Le bouton Mode bascule Exploration ⇄ Combat. | Un bouton qui fait « la chose évidente » selon ce qui est devant le joueur | Un bouton d'action ; un appui long ouvre une roue de choix |
| **Avantages** | Lisible, prévisible, adapté au tactile | Le plus simple possible | Très souple |
| **Défauts** | Il faut penser à basculer de mode | Ambigu en combat (frapper ou ramasser ?) | Lent en combat, peu lisible sur mobile |

**Recommandation : la proposition A**, avec une roue seulement pour les objets rapides (§3.4).

### 3.3 Le schéma recommandé

**Commandes communes à tous les modes :**

| Commande | Rôle |
|---|---|
| **Déplacement** | Joystick, ZQSD ou stick gauche. **Trois allures** : discrète, marche, course. Sur mobile et à la manette, l'allure dépend de l'inclinaison du stick. Au clavier : une touche pour courir, une pour l'allure discrète. |
| **Mode** | Bascule Exploration ⇄ Combat. Le mode Construction s'active tout seul quand on tient un plan sur son terrain. |
| **Sac** | Inventaire, carnet, fabrication |
| **Objet rapide** | Utilise l'objet rapide choisi (bandage, torche, leurre). Appui long : roue de 6 objets rapides. |

**Les deux boutons d'action selon le mode :**

| Mode | Bouton A | Bouton B |
|---|---|---|
| 🔎 **Exploration** | **Interagir** : ramasser, fouiller, ouvrir, parler, utiliser une installation. **Maintenir** : action longue (démonter, récolter, abattre). | **Examiner** : informations sur l'objet visé, tests d'expérimentation (Book 03 §6). |
| ⚔️ **Combat** | **Frapper ou tirer.** Appui court : coup rapide. **Maintenir puis relâcher** : coup appuyé visé à la tête. | **Esquiver.** Pendant une saisie (Book 06 §2.3) : **A et B se dégagent**, deux appuis par Éteint qui tient (0.8.4) ; A ne frappe plus et affiche « Se dégager ». |
| 🔨 **Construction** | **Placer** | **Pivoter.** Maintenir : démonter l'élément visé. |

**Aides :**

- **Ciblage assisté :** en combat, le coup vise le zombie le plus proche dans la direction du joueur (réglable).
- **Suggestion de mode :** quand un zombie approche, le bouton Mode **pulse**. Une option permet la bascule automatique.
- **Cercle de signature** affiché au sol en permanence (Book 06 §3.3) : l'allure choisie se voit immédiatement.

> **Décisions (2026-10-08, propositions P-004 et P-005 des testeurs)** :
> - **Un coup va jusqu'au bout.** Pendant le geste, un nouvel appui ne relance ni l'animation, ni le son, ni le coup : il est **gardé** et joué à la fin du geste (on enchaîne sans marteler). Chaque arme a la durée de son geste, coup simple et coup appuyé : la hache est lente (0,7 s / 0,95 s), le couteau vif (0,42 s / 0,65 s). Le serveur refuse un coup avant la fin du geste (80 ms de tolérance pour le réseau). Dix appuis en une seconde à la hache : deux coups.
> - **On choisit son arme.** Dans le sac, « Équiper pour le combat » sur toute arme (une petite épée ⚔ marque l'équipée). C'est elle qu'on a en main en mode Combat. Si on ne l'a plus (jetée, vendue, tombée avec le sac), on prend la meilleure du sac, et le jeu le dit une fois. Sans choix, la règle d'avant reste : la meilleure du sac. Le choix est gardé d'une session à l'autre. Les emplacements rapides (ceinture, holster, Book 12 §2.1) viendront plus tard.
>
> **Décisions de la 0.10 (2026-10-15 ; plan 0.10, V2-12 et V4-12)** :
> - **Le coup appuyé se voit** : en mode Combat, **une jauge fait le tour du bouton A** pendant qu'on le tient ; **pleine en 0,35 s**, le coup à la tête est prêt ; elle se vide dès qu'on lâche. Aucune règle ne change : le coup se juge toujours au relâchement. Sur iPhone, le bouton A ne laisse plus Safari interrompre l'appui long au moindre glissement du pouce (il était compté comme un coup court) : c'est sans doute pourquoi le porteur ne l'avait jamais vu marcher. Garder ou non le coup à la tête reste à l'étude, selon les essais sur l'iPhone.
> - **Les bras pris** (la batterie ou la tête du robot à l'hôtel, l'escabeau ; Book 23 §13) : on ne frappe pas, et **le bouton A dit « Poser »**.

### 3.4 Disposition sur mobile

```
┌──────────────────────────────────────────────────────┐
│ [Sac]                                     [Carte]    │
│                                                      │
│                                                      │
│                                          [Mode]      │
│                                                      │
│   ( Joystick )                      [B]              │
│                                          ( A )       │
│                                   [Objet rapide]     │
└──────────────────────────────────────────────────────┘
```

- **A** est le plus gros bouton, sous le pouce droit.
- La position et la taille de chaque bouton sont réglables.

### 3.5 Préréglages

| Action | Clavier + souris | Manette |
|---|---|---|
| Déplacement | ZQSD | Stick gauche |
| Visée (facultative) | Souris | Stick droit |
| A | Clic gauche ou E | A / Croix |
| B | Clic droit ou F | B / Rond |
| Mode | Tab | Y / Triangle |
| Sac | I | Menu / Options |
| Objet rapide | R (maintenir : roue) | X / Carré (maintenir : roue) |
| Courir / Discret | Maj / C | Stick incliné / clic du stick gauche |
| Fabriquer | B | — |

> **Décision (2026-10-08) : les gestes sur ce qu'on vise.** L'**anneau autour de l'objet visé se remplit** au fil du geste.
> - **Geste court (5 s ou moins)** — ramasser, couper des joncs, fouiller une caisse : on le fait **en gardant A enfoncé** ; lâcher avant la fin l'arrête (rien n'est gagné).
> - **Geste long (plus de 5 s)** — démonter le vélo, pédaler, affûter : **un appui le lance, un autre l'arrête** en cours de route ; une **jauge bien visible** (pourcentage, et la touche pour s'arrêter) s'ajoute à l'anneau.
>   - **Ce qui est fait reste fait** (décision du 2026-10-08) : un geste long arrêté garde sa progression pendant 2 h réelles. Relancé, il reprend là où il s'était arrêté : l'anneau repart de la part faite, et un message le dit (« Tu reprends là où tu t'étais arrêté (44 %) »). La progression est gardée par geste (son nom), en mémoire du serveur : elle se perd à la déconnexion.
> - **Fabrication** : un **petit tas des matières** se pose devant le personnage (là où se dressera l'installation), l'anneau se remplit autour, avec la même jauge ; **A, B ou Échap l'annulent**.
> - Exception : dormir.

> **Décision (2026-10-08) : pas de Ctrl par défaut, et l'aide des touches seulement pendant le tutoriel.** Sur Mac, Ctrl + flèches change de bureau : l'allure discrète passe sur **C**, et fabriquer sur **B**. Au clavier, l'aide-mémoire des touches s'affiche en bas de l'écran **pendant le tutoriel seulement** ; ensuite, un bouton **« Commandes »** du menu donne le rappel et permet de **réassigner** les touches (gardé sur l'appareil). Les textes du jeu (tutoriel, aides) citent toujours la touche choisie par le joueur, ou le bouton sur téléphone. **Le jeu part d'un clavier AZERTY** (les touches portent leur nom AZERTY ; pas de WASD).

> **Décision (2026-10-08) : le jeu s'explique là où on bloque.**
> - **Recette grisée** : au lieu d'un bouton mort, un bouton **« Ce qu'il manque ? »** déplie, sur la carte, ce qui manque et **par quoi le remplacer**. Par exemple : « Il te manque 1 branche. Pour en avoir : ramasser la branche », ou « Pour marteler (niveau 1), il te faut pierre ou marteau ». Pour un outil d'un niveau trop bas : « ton outil fera l'affaire, mais plus lentement ». Le feu de camp suit la même règle. Tout est tiré des données du jeu (ressources, recettes, Comptoir, qualités d'outil), rien n'est écrit à la main.
> - **Jauges** (faim, eau, sommeil, santé, endurance) : un appui (ou Entrée) sur une jauge ouvre une **bulle** avec sa valeur, ce qui la fait baisser, comment la remonter et ce qui arrive en dessous de 15 %. Un second appui la referme.
> - **Endurance** : la barre est **pleine quand on est en forme** et se vide à l'effort. Elle est en **vert**, lisible sur les trois habillages (le crème d'avant disparaissait sur le papier des Mécanistes).
> - Le bois dur n'est **pas** un outil pour marteler : la pierre suffit, en bushcraft comme ici.

> **Décision (2026-10-08) : une action est immédiate, ou bien on voit sa progression.** Jamais un clic sans effet visible.
> - **Immédiates** :
>   - **ajouter du bois** au feu : un clic, un morceau ; une pastille « Feu : 3,5 kg de bois » monte, avec le bruit du bois ;
>   - **porter** et **poser** l'escabeau.
> - **Les autres actions ont une jauge, et on préfère la petite** : l'**anneau** qui se remplit autour de la cible.
>   - Sans cible (manger, boire, panser, monter un feu…), l'anneau se remplit **aux pieds du personnage**.
>   - La grosse barre en bas de l'écran disparaît. Pour un geste long ou une fabrication, une **petite étiquette** suit l'anneau, juste dessous : le nom, le pourcentage, et la touche pour s'arrêter.
> - **Geste à tenir lâché trop tôt** (par exemple un simple clic sur « Ramasser ») : il s'arrête, et un message le dit, au plus une fois toutes les 8 s : « Garde E enfoncé : l'anneau doit se remplir. »
> - **Assommer une poule** est immédiat aussi (Book 11 §10).

> **Décision (2026-10-08) : quand on s'y prend mal, le jeu dit quoi faire.** Les ≈ 110 refus du serveur ont été relus un par un.
> - **Un refus nomme la cause et la solution**, et dit où trouver ce qui manque. Les phrases sont tirées des données du jeu : ressources, recettes, Comptoir, kit de départ.
>   - « Pour serrer (niveau 1), il te faut clé plate. Où en trouver : fouiller la caisse à outils (sur ton terrain) ou l'acheter au Comptoir. »
>   - « Ton sac est trop lourd (56 kg sur 55) : jette ce qui ne sert pas (Sac → Jeter) ou range-le dans un coffre. »
> - **Ce qui ratait sans rien dire dit maintenant pourquoi** :
>   - A sans rien à portée ;
>   - vouloir courir quand on a faim, soif, sommeil, plus de souffle, ou les bras pris ;
>   - manger rassasié ;
>   - effaroucher une poule en arrivant trop vite ;
>   - frapper un Éteint qui se relèvera ;
>   - manger de la volaille crue.
> - **Les indices ne rabâchent pas** : chacun revient au plus une fois toutes les 20 à 60 s.
> - Chaque cas a son test (`serveur/src/indices.test.ts`).

> **Décision (2026-10-08) : pas d'étiquette du mode au clavier.** L'étiquette « X Exploration / Combat » en bas de l'écran ressemblait à un bouton de plus : elle n'est plus affichée.
> - La touche (X par défaut) reste dans le panneau **Commandes**.
> - En combat, l'invite (Frapper, Esquiver) et son bord rouge suffisent à le montrer.
> - Sur téléphone, le bouton Explorer / Combat reste : c'est le seul moyen de changer de mode sans clavier.

---

## 4. Le financement (phase 1)

### 4.1 Principes

1. **Couvrir les frais d'hébergement, pas faire du profit.**
2. **Pas de « payer pour gagner » :** ce qui s'achète reste modeste et plafonné, et n'existe que sous une forme que les joueurs gratuits peuvent aussi obtenir en jouant.
3. **Pas de loot boxes, pas d'objets exclusifs payants.**

### 4.2 L'achat de Wh

Les joueurs peuvent **acheter des Wh avec de l'argent réel**, dans une proportion raisonnable.

| Règle | Détail |
|---|---|
| **Forme** | Des **wotts frais** crédités sur le compte du joueur au comptoir (Book 07 §3) |
| **Explication dans l'univers** | Les **convois des Compteurs** apportent de l'énergie venue de l'extérieur de la région |
| **Plafond** | Au plus **≈ 25 % de ce que gagne un joueur médian** en une semaine réelle. Le plafond se recalcule automatiquement selon l'économie du serveur. |
| **Décharge** | Comme tous les wotts : ≈ 2 % par semaine (Book 07 §3.3). Impossible d'accumuler une fortune achetée. |
| **Effet sur l'économie** | C'est une **source de wotts** supplémentaire (Book 07 §7.1), suivie dans les indicateurs. Le plafond garantit qu'elle reste marginale. |

> Le seul cas où des wotts sont créés sans dépôt d'énergie dans le jeu. Il est explicitement compté, plafonné, et justifié dans l'univers.

### 4.3 Les classements

| Classement | Qui y figure |
|---|---|
| **Classement global** | Tous les joueurs |
| **Classement des joueurs libres** | Les joueurs qui **n'ont acheté aucun Wh pendant le cycle** (Book 09) |

> Un joueur qui achète des Wh une fois n'est exclu du classement libre que pour le cycle en cours.

### 4.4 Les dons

- Un **bouton de don**, toujours accessible, sans insistance.
- Une **jauge sans montant** : elle montre seulement si les frais d'hébergement du mois sont couverts (de 0 à 100 %, puis « couverts »).
- Un don **ne donne aucun avantage en jeu**. (Piste : un simple remerciement visible, à décider.)

### 4.5 Aspects pratiques

- Prestataire de paiement à choisir en phase 1 (gestion des cartes, TVA, conditions générales de vente).
- Le paiement passe par une page web séparée du jeu : le jeu ne manipule jamais les données bancaires.

---

## 5. Questions ouvertes

- [ ] **Commandes :** valider la proposition A et ses préréglages.
- [ ] **Bascule automatique du mode Combat :** activée ou désactivée par défaut ?
- [x] **Plafond d'achat de Wh :** ✅ ≈ 25 % du gain hebdomadaire médian, recalculé automatiquement.
- [ ] **Remerciement des donateurs :** rien, ou un signe discret (titre, décoration) ?
- [ ] **Navigateurs pris en charge :** fixer une liste minimale (Chrome, Firefox, Safari, Edge récents).
