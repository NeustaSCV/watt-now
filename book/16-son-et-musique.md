# Book 16 — Son et Musique

> Document de conception · version 0.2 · 2026-10-07
> Statut : **brouillon de travail**.

---

## 1. Principes

1. **Le son est une information de jeu.** Les bruits sont ce qui attire les zombies (Book 01 §2, Book 06 §3) : le joueur doit les **entendre clairement**.
2. **La musique accompagne, elle ne fatigue pas.** Principalement d'ambiance, discrète, jamais envahissante.
3. **Une bande-son de grande qualité, très soignée**, riche musicalement.
4. **Le silence fait partie de la partition.**

---

## 2. La musique

### 2.1 Direction artistique

| Référence | Ce qu'on en retient |
|---|---|
| **Snarky Puppy** | **Richesse musicale** : harmonies fournies, grooves, interplay, instruments acoustiques et électriques mêlés |
| **Amon Tobin** | **Finesse du design sonore** : textures, sons trouvés et retravaillés, matière sonore organique et précise |
| **Cristobal van der Veer** (référence donnée) | **Créativité** : liberté de forme, surprises |

**Langage harmonique : modal.** Les modes donnent des couleurs reconnaissables sans les tensions et résolutions appuyées de la musique tonale, ce qui convient à une musique d'ambiance qui doit durer sans lasser.

### 2.2 Une couleur par famille, par saison, par lieu

| Contexte | Mode suggéré | Couleur | Instrumentation suggérée |
|---|---|---|---|
| 🔥 **Charbonniers** | Dorien, phrygien | Chaleureux, terrien, un peu sombre | Percussions métalliques (enclume, tôle), cuivres graves, basse ronde |
| ⚡ **Voltaïques** | Lydien | Lumineux, suspendu, étrange | Synthétiseurs analogiques, Rhodes, textures électriques, bourdonnements |
| ⚙️ **Mécanistes** | Mixolydien, ionien | Ouvert, organique, terrestre | Guitares acoustiques, cordes, bois, percussions de bois, rythmes mécaniques |
| **Printemps / été** | Couleurs majeures (lydien, mixolydien) | — | Plus aéré |
| **Automne / hiver** | Couleurs mineures (dorien, éolien) | — | Plus dépouillé |
| **Ruines** | Phrygien, locrien par touches | Inquiétant | Sons trouvés, résonances |
| **Comptoir** | Mixolydien | Vivant, social | Groove léger |

### 2.3 Les sons trouvés

Dans l'esprit d'Amon Tobin et du thème du jeu, une partie de la matière musicale provient de **sons de vestiges** retravaillés : tôle frappée, ressorts, moteur de machine à laver, grésillement de radio, chaîne de vélo. **La musique est elle-même faite de récupération.**

### 2.4 Musique adaptative

La musique est composée en **couches** (stems) qui se superposent selon la situation, avec des transitions douces :

| Couche | Quand |
|---|---|
| **Fond** | Toujours : nappes, textures, très discret |
| **Vie** | Sur son terrain, au comptoir : thème de famille ou de lieu |
| **Exploration** | En dehors du terrain : plus aéré, plus incertain |
| **Tension** | Des zombies sont **attentifs** (Book 06 §3.1) : pulsation légère |
| **Danger** | Saisie, horde en vue : rythme marqué, mais **jamais au point de masquer les bruits** |
| **Silence** | Moments choisis : la nuit, la neige, après un combat |

---

## 3. Les effets sonores

### 3.1 Règle d'or : ce que le joueur entend, les zombies l'entendent

- La **portée audible** d'un bruit dans le jeu correspond à sa **portée de signature** (Book 01 §2, Book 02 §7). Si le joueur entend nettement sa forge, il sait qu'elle porte loin.
- Les effets sonores sont **spatialisés** (direction, distance) : on entend d'où vient un Éteint, un tir, un autre joueur.
- Chaque bruit important a une **forme reconnaissable** : un coup de feu, un grognement d'Éteint dormant, un pas sur du verre, le cliquetis d'une armure de tôle (Book 12 §4).

### 3.2 Priorités du mixage

| Priorité | Sons | Règle |
|---|---|---|
| 1 | **Menaces** : Éteints proches, tirs, pas d'autres joueurs | Jamais couverts |
| 2 | **Signature du joueur** : ses pas, ses outils, ses coups | Toujours audibles |
| 3 | **Environnement** : météo (pluie, vent, tonnerre), animaux | Informatifs (la pluie couvre les bruits, Book 13) |
| 4 | **Musique** | **Baisse automatiquement** quand un son de priorité 1 ou 2 apparaît |

### 3.3 Les zombies

Les Éteints ont un **vocabulaire sonore** qui renseigne sur leur état :

| État (Book 06 §4) | Son |
|---|---|
| Dormant | Respiration lente, presque inaudible : il faut tendre l'oreille |
| Errant | Pas traînants, râles espacés |
| Attiré | Râle qui s'interrompt, tête qui se tourne, puis pas qui se dirigent vers la source |
| Poursuivant | Râles rapprochés, pas plus pressés |
| Grégaire | Pas qui s'accordent à ceux des voisins |
| Pressant | Coups sourds et raclements contre l'obstacle |

> En **horde** (une taille, pas un état, Book 06 §6.1), ces sons se fondent en une masse sonore sourde, audible de loin.

---

## 4. Contraintes techniques (navigateur)

| Point | Règle |
|---|---|
| **Déblocage du son** | Les navigateurs (surtout sur iOS) n'autorisent le son qu'après un geste de l'utilisateur : bouton « Jouer » à l'accueil (Book 08 §2.2) |
| **Formats** | Opus (avec un format de repli pour les navigateurs qui ne le lisent pas) ; musique en flux, effets préchargés par lieu |
| **Volume** | Réglages séparés : général, musique, effets, ambiance, voix |
| **Niveau** | Normalisation homogène entre toutes les pistes ; pas de pics agressifs |
| **Mobile** | Version allégée des couches musicales si l'appareil peine |

---

## 5. Questions ouvertes

- [ ] **Composition :** compositeur ou compositrice à trouver ; budget en phase 1 ?
- [ ] **Voix :** les personnages et PNJ parlent-ils (voix réelles, onomatopées, texte seul) ?
- [ ] **Thèmes de famille :** valider les modes et l'instrumentation proposés.
- [ ] **Musique diégétique :** des instruments jouables par les joueurs (guitare, harmonica) qui font… du bruit ?
