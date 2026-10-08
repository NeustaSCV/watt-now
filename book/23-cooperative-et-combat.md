# Book 23 — La Coopérative et le combat

> Document de conception · version 0.1 · 2026-10-08
> Statut : **proposition à valider** par le porteur du projet. Cible : versions 0.5 et 0.6.
> Décisions déjà prises (2026-10-08) : le lieu est la **coopérative agricole** (Book 20 §3.1) ; **une par joueur** pour commencer et valider la mécanique (des cartes partagées ne sont pas exclues plus tard) ; **conception écrite d'abord**.

---

## 1. Pourquoi

- **Éprouver le combat en vrai.** Aujourd'hui, on ne se bat que contre 1 à 3 Éteints isolés sur son terrain, ou contre les dormants de la halte. Les règles du combat (Book 06 §8, Book 08 §3.3) n'ont jamais été mises à l'épreuve : groupes, surprise, armure, retraite, gestion de l'endurance.
- **Un vrai niveau** : une entrée, un fond à atteindre, plusieurs chemins, un danger qui monte, et un **butin rare** qui récompense le risque.
- **Donner une raison aux armes** : leur type, leur usure, et des **armes de lancer** qui ouvrent la tactique (leurrer, isoler, frapper de loin).

## 2. Le lieu : la Coopérative du Plateau

### 2.1 Sur la carte

- Dans la Campagne, à **distance moyenne** (danger ●●). On y va **depuis le Carrefour**, par un chemin agricole vers le nord qui s'ouvre sur la carte (Book 20). Le voyage dure comme les autres trajets.
- **Une coopérative par joueur** (instance, comme le terrain) : son propre butin, ses propres Éteints. On n'y croise personne en 0.5.

### 2.2 Le plan (≈ 80 × 60 m)

```
            N
 ┌─────────────────────────────────────────────┐
 │  SILOS (2)        CHAMBRE FROIDE ●●●        │
 │  échelle → haut   noire, fond du hangar     │
 │       │                   │                 │
 │  ATELIER TRACTEURS ●●    HANGAR : allées    │
 │  fosse, engins,          de rayonnages ●●   │
 │  Rampants dessous        BUREAUX à l'étage  │
 │       │                  (escalier, coffre) │
 │  QUAI DE CHARGEMENT ●    LIBRE-SERVICE ●    │
 │       │                   │                 │
 │  brèche du grillage   COUR, bascule ●       │
 │  (à l'ouest)          PORTAIL (entrée, sud) │
 └─────────────────────────────────────────────┘
```

| Zone | Danger | Ce qu'on y trouve | Ce qu'elle apprend |
|---|---|---|---|
| **Cour et bascule à camions** | ● | Vestiges de voiture, bâches | Approcher en allure discrète, lire le terrain |
| **Libre-service** (comptoir, caisse, rayons) | ● | Vestiges communs, nourriture en conserve, graines | Fouiller sans se faire coincer entre les rayons |
| **Quai de chargement** | ● | Palettes, sangles, cordes, transpalette | Deux accès : le quai mène à l'atelier |
| **Atelier des tracteurs** (fosse, deux tracteurs, établi) | ●● | **Outils de qualité**, pièces de tracteur, **batterie de tracteur** (grosse capacité), huile | Les **Rampants** sous les engins ; se battre dans un espace encombré |
| **Hangar** (allées de rayonnages de 4 m) | ●● | Engrais, soufre, cordes, bâches, vestiges peu communs | Les **groupes** : quand un Éteint bouge, ses voisins suivent |
| **Bureaux à l'étage** (escalier unique) | ●● | **Coffre du directeur** (clé : le magasinier), registres, vestiges rares | Un seul escalier : on peut s'y faire acculer, ou y tenir |
| **Silos** (échelle, passerelle) | ● | Point haut : on voit la cour et l'arrière ; un nid de pigeons, du grain | Observer avant d'agir ; un Éteint ne monte pas à l'échelle |
| **Chambre froide** (fond du hangar, sans lumière) | ●●● | **Le butin légendaire** (armes, pièces rares) | Une demi-horde serrée dans le noir : il faut **la leurrer dehors** ou la prendre un par un |

- **Plusieurs chemins** : le portail (devant, bruyant à ouvrir), la **brèche du grillage** à l'ouest (discrète, par l'atelier, mais des Rampants), et le quai.
- **Il fait sombre dedans** : hangar et chambre froide demandent une **lumière portée**, qui se voit (signature, Book 06 §3).
- **Toits qui s'effacent** comme à la station (Book 18), pour voir à l'intérieur.

### 2.3 Le renouvellement

- **Ce qui est pris est pris.** Le butin **rare** revient **lentement** (plusieurs jours réels) ; le butin commun en quelques heures, comme la halte.
- **Les Éteints** : ceux qu'on a détruits ne reviennent pas tout de suite. **De nouveaux arrivent la nuit** (quelques-uns), et la chambre froide se **repeuple** sur plusieurs jours.
- **Partir et revenir** : la coopérative se souvient (instance gardée en base, comme le terrain).

## 3. Les méchants

Pas de mutant ni de boss magique (Book 06 §5) : seulement des corps différents, et **le nombre**.

| Variante (Book 06 §5) | Où | Comportement | Réponse attendue |
|---|---|---|---|
| **Errant** | Partout, ≈ 10 | Le zombie ordinaire | Viser la tête |
| **Groupe** (comportement « Grégaire », Book 06 §4) | Hangar, 3 groupes de 3 à 5 | Quand l'un bouge, les autres suivent | Isoler (leurre, couloir), ne pas réveiller tout le hangar |
| **Rampant** | Sous les tracteurs, dans l'herbe de la brèche, ≈ 4 | Au sol, caché ; mord aux chevilles | Regarder où l'on met les pieds, frapper vers le bas |
| **Équipé** (casque de moto) | 1 au bureau, 1 dans la cour | **Résiste aux lames à la tête** | **Arme contondante** (marteau, pied-de-biche, masse) |
| **Ancien habitant : le magasinier** | Bureaux | Comme un errant | Il porte la **clé du coffre** |
| **Ancien habitant : le mécanicien** | Atelier | Comme un errant | Il porte des **outils** (clé à molette, tournevis de qualité) |
| **Dormants** | Chambre froide, ≈ 8, serrés | Immobiles tant que rien ne les réveille ; en cascade ensuite | Les leurrer **hors** de la chambre froide (lancer, alarme), ou y entrer très discrètement |

**Total ≈ 25 à 30 Éteints** à la première visite : c'est un **niveau**, pas une promenade. On peut sortir et revenir (rien ne se remet à zéro).

> **Mesures du test** (Book 17 §6) : morts dans la coopérative et leur cause, armes utilisées, Éteints tués par type, temps passé par zone, objets lancés, retraites. Elles diront si le combat est juste.

## 4. Les armes, enrichies (0.5)

### 4.1 Ce qui existe déjà

Chaque arme a des **dégâts**, une **vitesse** (durée du geste), une **allonge**, et sait ou non **tuer d'un coup appuyé à la tête** (0.3, affiché dans le sac).

### 4.2 Le type de dégât

| Type | Armes | Contre l'Équipé (casque) | Particularité |
|---|---|---|---|
| **Contondant** | Marteau, masse, pied-de-biche, gourdin, batte | ✔ Plein effet | Étourdit plus longtemps |
| **Tranchant** | Hache, machette, couteaux, lame forgée | ✘ À la tête : dégâts ÷ 3 | Peut **rester coincée** (hache) sur un coup appuyé raté |
| **Perçant** | Épieu, fourche, lance | Moitié | **Allonge** : tient à distance |

### 4.3 L'usure (Book 02 §7)

- Chaque arme a une **solidité** (nombre de coups avant d'être **abîmée**, puis **cassée**). Abîmée : dégâts −30 %. Cassée : elle devient un débris (démontable).
- On **répare** : à l'établi (bois), à la meule (lames, ⚙️), à la forge (métal, 🔥). Les familles s'échangent ce service.
- La solidité s'affiche dans le sac (barre), comme les autres caractéristiques.

### 4.4 Repousser

- **B maintenu, au contact** : on **repousse** l'Éteint d'un coup d'épaule ou du manche (il recule et vacille), sans le blesser. Ça coûte de l'endurance ; ça crée l'espace pour frapper ou fuir.
- (B court reste l'esquive ; B tapé vite reste le dégagement quand on est saisi.)

### 4.5 Nouvelles armes de contact (trouvées dans la coopérative ou fabriquées)

| Arme | Type | Dégâts | Vitesse | Allonge | Origine |
|---|---|---|---|---|---|
| **Machette** | Tranchant | Bons | Rapide | Moyenne | Coopérative (atelier) |
| **Pied-de-biche** (le vestige devient une arme) | Contondant | Bons | Moyenne | Moyenne | Vestige (garage) ; ouvre aussi caisses et portes |
| **Masse** | Contondant | Très forts | Lente | Moyenne | Coopérative (atelier) |
| **Fourche** | Perçant | Moyens | Moyenne | **Longue** | Coopérative (hangar) |
| **Lance** (épieu à pointe ligaturée, évolution P-002) | Perçant | Bons | Moyenne | **Longue** | Fabriquée : épieu + couteau + ficelle |
| **Batte** | Contondant | Moyens | Rapide | Moyenne | Vestige (salon) |

## 5. Les armes de lancer (0.6)

### 5.1 Le principe : l'objet rapide

- C'est l'**objet rapide** prévu au Book 08 §3.3 : dans le sac, « **Prêt à lancer** » sur un objet lançable (comme « Équiper pour le combat »). Il s'affiche près du bouton A.
- **Lancer** : un bouton dédié. Ordinateur : **G** ou le **clic du milieu** ; téléphone : un **troisième bouton** à côté de A et B ; manette : la gâchette.
- **Viser** :
  - **maintenir** le bouton fait apparaître un **arc au sol** jusqu'au point d'impact ; relâcher lance ;
  - **assistance** : la visée s'accroche à l'Éteint le plus proche **devant soi** (cône) ; sur ordinateur, elle suit la **souris** ;
  - au doigt, on peut tirer l'arc avec le pouce droit.
- **Le serveur décide** : trajectoire simplifiée (ligne droite, temps de vol selon la distance), il juge l'impact.

### 5.2 Ce qu'on lance

| Objet | Portée | Dégâts | Effet | Après |
|---|---|---|---|---|
| **Pierre** (à la main) | 8 m | Faibles | **Étourdit** 1 s si à la tête ; **bruit à l'impact** : leurre | Reste au sol (ramassable) |
| **Fronde** + pierre (P-002 : chiffon, ficelle) | 20 m | Moyens | Plus juste ; **leurre lointain** | La pierre reste au sol |
| **Hachette / couteau de lancer** | 10 m | Bons | Tue un Errant à la tête (coup heureux) | **Il faut aller la reprendre** |
| **Épieu lancé** | 12 m | Forts | Transperce | On se retrouve **désarmé** jusqu'à le reprendre |
| **Objet bruyant** (réveil, boîte de conserve, poupée qui parle : P-003) | 10 m | Aucun | **Leurre** : attire les Éteints proches pendant quelques secondes (le réveil sonne 20 s) | Reste là ; le réveil peut se reprendre |

- **Le leurre est l'arme la plus importante** de la coopérative : vider la chambre froide, séparer un groupe, passer derrière.
- **Le bruit compte** : un lancer raté qui tape un bidon réveille ce qu'il ne fallait pas.

## 6. Les commandes, en résumé

| | Ordinateur | Téléphone |
|---|---|---|
| Frapper / coup appuyé | A (E, clic) / maintenir | A / maintenir |
| Esquiver / se dégager | B (F, clic droit) / taper vite | B / taper vite |
| **Repousser** | **B maintenu** au contact | **B maintenu** au contact |
| **Lancer** | **G** ou clic du milieu (maintenir : viser) | **Bouton Lancer** (maintenir : viser) |
| Choisir l'arme, l'objet à lancer | Sac | Sac |

## 7. Les lots

| Version | Contenu |
|---|---|
| **0.5 : la Coopérative** | Le lieu (plan, zones, toits, obscurité), l'instance par joueur, le voyage depuis le Carrefour ; les variantes (groupe, Rampant, Équipé, anciens habitants, dormants) ; type de dégât, usure et réparation, repousser ; les nouvelles armes de contact ; le butin par zone (tables du lot Vestiges) ; le coffre et sa clé ; les mesures |
| **0.6 : lancer** | L'objet rapide, le bouton Lancer, la visée (arc, assistance), les projectiles, les leurres et leur effet sur les Éteints |

**Graphismes** (agent graphisme, planches) : le bâtiment et ses zones, les tracteurs, les silos, l'Éteint casqué, le magasinier, les nouvelles armes en main, l'arc de visée.
**Son** (session son) : portail, transpalette, réveil-leurre, impact de pierre sur tôle, coup qui rebondit sur un casque.

## 8. Questions ouvertes

- [ ] Les nombres (Éteints, butin, renouvellement) : à régler en jouant (réglages à chaud).
- [ ] La coopérative partagée plus tard : rencontres, entraide, concurrence ?
- [ ] La batterie de tracteur (grosse capacité) : bonne récompense pour ⚡ et ⚙️, ou trop forte ?
- [ ] Le butin légendaire de la chambre froide : quoi exactement ?
- [ ] Les Éteints suivent-ils un joueur qui ressort dans la cour ? (Jusqu'où les poursuites ?)
