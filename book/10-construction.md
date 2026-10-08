# Book 10 — La Construction

> Document de conception · version 0.4 · 2026-10-07
> Statut : **brouillon de travail**. Les valeurs thermiques sont des **ordres de grandeur réalistes**, simplifiés pour le jeu.

---

## 1. Principes

1. **Pas de règle des « trois petits cochons ».** Le plus solide n'est pas le mieux en tout. Chaque matériau a des qualités et des défauts réels : isolation, inertie, humidité, solidité, feu, coût.
2. **On part de l'abri bushcraft** et on peut aller jusqu'à la maison en pierre jointée à la chaux, voire la maison en métal pour qui en a les moyens.
3. **L'isolation est une question d'énergie.** Une maison mal isolée coûte du bois, de l'électricité ou du froid tous les jours d'hiver. C'est le lien direct entre la construction et le thème du jeu.
4. **Le béton n'est pas une solution miracle :** humide, mal isolé, et impossible à produire (on ne fait que le récupérer).
5. **Les murs se construisent en couches** : une partie porteuse, éventuellement un isolant, un enduit. Les meilleures maisons combinent les matériaux.

---

## 2. Comment le jeu calcule le confort d'une maison

### 2.1 Le besoin de chauffage

Pour rester lisible, le jeu calcule le besoin de chauffage d'une **pièce de vie standard** :

- 12 m² au sol, 30 m² de murs, 20 m² de toit ;
- hiver : 3 °C dehors, 18 °C dedans, soit **15 °C d'écart**.

```
pertes (W) = Σ (U × surface) × écart de température     ← à travers les parois
           + 0,34 × renouvellement d'air × volume × écart ← par les fuites d'air

besoin par jour (kWh) = pertes × 24 / 1 000
```

- **U** (en W/m²·K) mesure combien une paroi laisse passer la chaleur. Plus il est **bas**, mieux la paroi isole.
- **Le renouvellement d'air** (volumes par heure) mesure l'étanchéité : une cabane pleine de jours laisse fuir sa chaleur.

### 2.2 Les autres qualités d'une paroi

| Qualité | Ce qu'elle change en jeu |
|---|---|
| **Inertie** | Une paroi lourde (pierre, terre) stocke la chaleur : température stable, fraîcheur l'été, mais longue à chauffer |
| **Humidité** | Une paroi qui ne respire pas ou mal ventilée crée de la condensation : **moisissures**, maladies respiratoires (Book 05 §6), pourriture des stocks |
| **Solidité** | Résistance aux zombies qui poussent (Book 06 §9.2) et aux tempêtes (Book 13) |
| **Feu** | Risque d'incendie (forge, foudre, poêle mal fait) |
| **Acoustique** | Une paroi épaisse **atténue la signature sonore** de ce qui se fait à l'intérieur (Book 01 §2) |
| **Entretien** | Enduits à refaire, chaume à remplacer, rouille à traiter |

---

## 3. Les matériaux de paroi

| Paroi | U indicatif (W/m²·K) | Inertie | Humidité | Solidité | Feu | Remarques |
|---|---|---|---|---|---|---|
| **Bâche, branchages** | ≈ 6 | Nulle | Condensation | Très faible | Risque | Abri d'urgence |
| **Clayonnage + torchis** (15 cm) | ≈ 2,6 | Moyenne | Respire bien | Faible | Faible | Rapide à faire, terre + paille + bois souple |
| **Rondins** (20 cm) | ≈ 0,6 | Moyenne | Bon si bien jointoyé | Bonne | Moyen | Demande beaucoup de bois et des outils de charpentier |
| **Ossature bois + paille ou laine** (15 cm d'isolant) | ≈ 0,3 | Faible | Bon avec enduit à la chaux | Moyenne | Faible si enduit | Léger, très efficace |
| **Bottes de paille porteuses + enduit chaux ou terre** (45 cm) | **≈ 0,13** | Moyenne | Bon si toit débordant | Moyenne | **Faible** (enduit) | **Le meilleur isolant réaliste du jeu.** Craint l'eau par le haut. |
| **Terre-paille, bauge** (40 cm) | ≈ 0,5 | Forte | Excellent régulateur | Bonne | Nul | Lent à sécher |
| **Pierre sèche** (50 cm, sans mortier) | ≈ 2,5 | Très forte | Ventilée | Très bonne | Nul | **Plein de courants d'air** |
| **Pierre jointée chaux-sable** (50 cm) | ≈ 2,5 | Très forte | Bon (la chaux respire) | **Excellente** | Nul | Étanche à l'air, très solide, froide sans doublage |
| **Pierre jointée + doublage paille ou laine** (10 cm) | **≈ 0,4** | Très forte | Bon | Excellente | Faible | **La meilleure maison de fin de cycle** |
| **Béton** (20 cm, récupéré) | ≈ 3,5 | Forte | **Mauvais : condensation, moisissures** | Excellente | Nul | Ne se fabrique pas. Bunkers, garages, caves. |
| **Tôle, conteneur métallique** | **≈ 5,8** | Nulle | **Très mauvais : condensation** | **Maximale** | Nul | Glacial l'hiver, four l'été, bruyant sous la pluie |

### 3.1 Les toits

| Couverture | Isolation | Remarques |
|---|---|---|
| **Chaume** (30 cm) | Très bonne (U ≈ 0,2) | Rapide, réaliste, **inflammable**, à refaire tous les quelques ans |
| **Bardeaux de bois** | Moyenne | Demande du bois fendu et du temps |
| **Lauzes, ardoises** (vestiges ou carrière) | Faible sans isolant | Très durables, lourdes : charpente solide |
| **Tôle** (vestige) | Nulle | Rapide, solide, **bruyante sous la pluie et la grêle**, condensation |
| **Toit végétalisé** (terre + végétaux sur bâche) | Bonne, forte inertie | Lourd, étanchéité délicate |

---

## 4. Exemples de maisons

Besoin de chauffage de la pièce de vie standard (§2.1), par jour d'hiver, et bois sec nécessaire avec un **poêle en fonte** (rendement 60 %, soit ≈ 2,6 kWh utiles par kg de bois).

| Maison | Besoin (kWh/jour) | Bois sec / jour | Solidité | Verdict |
|---|---|---|---|---|
| **Abri bushcraft** (bâche + branchages) | ≈ 145 | **Impossible à chauffer** | Très faible | On dort devant le feu, dans un sac de couchage |
| **Cabane en rondins**, toit de chaume | ≈ 13 | ≈ 5 kg | Bonne | Le bon compromis des premières semaines |
| **Maison de paille** enduite, toit isolé | **≈ 5** | **≈ 2 kg** | Moyenne | Très économe, à protéger de la pluie |
| **Pierre sèche**, toit de chaume | ≈ 40 | ≈ 15 kg | Très bonne | Solide mais pleine de courants d'air |
| **Pierre jointée à la chaux**, toit de chaume | ≈ 31 | ≈ 12 kg | Excellente | Solide, fraîche l'été, froide l'hiver |
| **Pierre jointée + doublage isolant** | **≈ 9** | **≈ 3,5 kg** | Excellente | **La maison de fin de cycle idéale** |
| **Béton récupéré** (garage, bunker) | ≈ 67 | ≈ 25 kg | Excellente | Humide, malsain, cher à chauffer |
| **Maison métallique**, conteneur | ≈ 106 | ≈ 40 kg | Maximale | Pour les très riches… qui ont du bois ou des Wh à brûler. Inhabitable sans isolation intérieure. |

> **Lecture :** une maison de paille se chauffe avec 2 kg de bois par jour, une maison en métal en demande 40. Le plus solide est le plus cher à habiter. Ce n'est pas un bonus de jeu arbitraire, c'est de la physique.

> **Le chauffage électrique** (⚡) a un rendement de 100 %, mais l'électricité est chère : chauffer la maison de paille coûte ≈ 5 kWh_é, soit ≈ 5 000 wotts par jour d'hiver. Les Voltaïques ont tout intérêt à **très bien isoler**.

---

## 5. Les moyens de chauffage

| Appareil | Rendement | Remarques | Famille |
|---|---|---|---|
| **Feu ouvert, cheminée** | ≈ 15 % | L'essentiel de la chaleur part par le conduit | Tous |
| **Poêle en fonte récupéré** | ≈ 60 % | Vestige courant | Tous |
| **Poêle de masse** (briques, argile, pierre) | **≈ 80 %** | Une flambée vive de 1 à 2 h, puis la masse **restitue la chaleur pendant des heures**. Peu de fumée. | 🔥 natif |
| **Chauffage électrique** | 100 % | Électricité chère | ⚡ |
| **Couche chaude, compost** | — | Chaleur de fermentation : serres, semis (Book 11) | ⚙️ |
| **Inertie et soleil** | — | Grandes ouvertures au sud + murs lourds : chauffage solaire passif | Tous |

> **Hors ligne, le logement n'est pas chauffé** : personne n'y est (Book 01 §2 bis). Au retour, la maison est froide et il faut rallumer. Le temps pour revenir à une température confortable dépend de l'isolation et de l'inertie : une cabane légère chauffe vite, une maison de pierre lentement. Ce qui craint le gel (eau, bocaux) se garde en cave.

---

## 6. Les étapes de construction

| Palier | Constructions typiques | Matériaux | Durée indicative |
|---|---|---|---|
| **I** (premiers jours) | Abri bushcraft, appentis, hutte de clayonnage, foyer, palissade légère | Branches, bâche, cordes, terre, paille | Quelques heures de jeu (quelques minutes réelles) |
| **I–II** (première semaine) | **Cabane en rondins**, toit de chaume, premier poêle récupéré | Rondins, chaume, pierres | 1 à 3 jours de jeu |
| **II** (premier mois) | **Maison de paille** ou **terre-paille**, ossature bois, enduits à la chaux | Bottes de paille, bois, chaux, sable, terre | Plusieurs jours de jeu, **à plusieurs c'est mieux** |
| **II–III** (deuxième mois) | **Pierre jointée chaux-sable**, doublage isolant, **poêle de masse**, cellier enterré | Pierre, chaux, sable, paille, laine, briques | Grands chantiers collectifs |
| **III** (très riches) | **Maison métallique**, conteneur aménagé, atelier en tôle soudée | Tôles, profilés, soudure (⚡) | Long, coûteux en énergie grise |

> Les durées longues (séchage des enduits et de la terre) sont des **processus passifs au calendrier** (Book 01 §2 bis).

> **Les enduits à la chaux et à la terre ne sèchent pas quand il gèle** (gel, vague de froid, Book 13) : un chantier d'isolation se fait pendant la belle saison. Une maison chaude pour l'hiver se prépare avant (Book 01 §7.2).

---

## 7. Les éléments d'une construction

| Élément | Options | Points clés |
|---|---|---|
| **Fondations** | Pierres sèches, hérisson de cailloux, plots | Protègent les murs de l'humidité du sol (indispensable pour la paille et la terre) |
| **Murs** | Voir §3, **en couches** : porteur + isolant + enduit | Chaque couche ajoute ses propriétés |
| **Toit** | Voir §3.1 | **Un toit débordant protège les murs** de la pluie |
| **Sol** | Terre battue, plancher, dalle à la chaux | Un plancher sur vide sanitaire isole du froid du sol |
| **Ouvertures** | Porte, fenêtre (vitre de vestige, papier huilé, volets) | **Une vitre perd beaucoup de chaleur** mais apporte lumière et soleil |
| **Chauffage** | Voir §5 | Un conduit mal fait : incendie, fumée intérieure (Book 05 §6) |
| **Cellier enterré, silo** | **Installation** posée au sol (entrée sur une butte de terre) : il n'y a pas de niveau souterrain (Book 19) | Frais et stable toute l'année : **conservation des aliments sans énergie** (Book 11) |

### 7.1 Mécanique de jeu

- Construction sur une **grille** du terrain. Murs, sols et toits se posent par éléments.
- Le jeu **détecte les pièces fermées** et calcule pour chacune son isolation, son humidité et sa température.
- Une pièce peut avoir une **fonction** (chambre, atelier, infirmerie, réserve) qui donne des bonus si ses conditions sont remplies (une réserve doit rester fraîche, une infirmerie propre et chaude).
- **Atelier fermé :** une forge ou un atelier dans une pièce aux murs épais voit sa **signature sonore réduite** (environ −50 % derrière de la pierre). La fumée, elle, sort toujours par la cheminée.

> **Décision (2026-10-08) : on choisit où l'on construit (phase 0a).** Après « Construire » (une installation ou le feu de camp), une étape de pose s'ouvre :
> - **Le fantôme** de la construction (le vrai modèle, en transparence) suit la souris. Sur téléphone, il se tient devant le personnage : on le déplace en marchant.
> - **Il se cale sur une grille de 50 cm** et reste à portée de bras (3 m). Plus loin, il s'arrête au bout du bras, dans la direction visée.
> - **Son empreinte au sol** est verte si l'on peut construire, rouge sinon. La raison s'affiche : trop près du bord, de l'eau, d'un feu, d'une autre construction, dans les ruines. C'est la même règle que celle du serveur (`commun/src/emplacement.ts`). Les escabeaux ne gênent pas, puisqu'on les déplace.
> - **Commandes** :
>   - construire : A, le clic ou « Construire ici » ;
>   - tourner d'un quart de tour : la touche de lumière (R) ou « Tourner » ;
>   - annuler : B, Échap ou « Annuler ».
> - **Plus tard : un mode Construction** pour déplacer les constructions existantes et poser des murs, des sols et des toits sur cette grille (§7.1).

### 7.2 Les objets lourds à porter : l'escabeau d'abord (décision du 2026-10-08)

Certains objets ne vont **pas dans le sac** : ils restent posés sur le terrain, et on les **porte dans les bras** pour les déplacer. L'escabeau est le premier ; il y en aura d'autres (échelle, brouette, poutres, pierres de taille…).

- **L'escabeau de bois** (recette commune) : 2 bûches, 6 branches, 1 rouleau de corde ; Couper 1 et Marteler 1 ; 45 min de travail. Il se pose devant soi, comme une installation.
- **Porter** (A, immédiat) : l'objet passe dans les bras.
  - **On marche, on ne court plus.**
  - Les bras sont pris : pas de geste, pas de fabrication. A sert à **poser**.
  - On ne prend pas la route avec : il reste sur le terrain.
  - Frapper le lâche sur place.
- **Poser** (A, immédiat) : l'objet se pose à 0,9 m devant soi. S'il faut le lâcher (déconnexion, effondrement), il reste là où l'on était.
- **Le disque où il sert** : autour des objets où l'escabeau est utile, un disque apparaît.
  - Quand on porte l'escabeau, les disques de tous les arbres fruitiers s'affichent.
  - Quand on vise un arbre, seul son disque s'affiche.
  - Le disque s'allume en vert quand l'escabeau tomberait dedans, ou qu'il y est déjà posé.
  - Pour un arbre fruitier, le rayon est de 2,4 m.
- **Ce qu'il permet** :
  - cueillir dans les arbres fruitiers (Book 11 §10) ;
  - plus tard, servir d'**outil requis** pour monter un mur ou une toiture (on ne pose pas un rang haut sans escabeau), et pour d'autres objets.

---

## 8. Solidité face aux zombies et à la météo

| Construction | Contre les zombies (Book 06 §9) | Contre la tempête (Book 13) |
|---|---|---|
| Bâche, branchages | Aucune | Arrachée |
| Torchis | Groupes : cède | Tient, mais l'enduit s'abîme |
| Rondins | Meutes : tient | Tient |
| Paille enduite | Groupes : tient ; meute : s'abîme | Tient si le toit tient |
| Pierre jointée | Hordes : tient | Tient |
| Béton, métal | Tout | Tient (la tôle de toit peut s'envoler si mal fixée) |

> Rappel : les attaques de zombies n'abîment que les **pièges et protections** (Book 06 §9.1). La solidité des murs de la maison compte pour la **météo** (Book 13). Les zombies, eux, ne s'en prennent qu'aux défenses (Book 06 §9.1).

---

## 9. Familles et construction

| | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **Points forts** | Chaux, mortier, briques, **poêle de masse**, pierre | Soudure (maisons et ateliers métalliques), éclairage, ventilation | Charpente, rondins, **paille**, terre, chaume, sciage |
| **Besoin propre** | Ateliers en pierre pour étouffer le bruit de la forge | **Isoler très bien** : le chauffage électrique coûte cher | Grandes surfaces abritées (stockage, animaux, serres) |

---

## 10. Questions ouvertes

- [x] **Taille du terrain :** ✅ ≈ **50 × 50 m** (2 500 m²) : maison, ateliers, potager (Book 11) et défenses.
- [ ] **Niveau de détail thermique :** calcul par pièce comme proposé, ou plus simple (une note d'isolation par bâtiment) ?
- [ ] **Incendies :** peuvent-ils détruire une construction ? (Proposition : oui, mais seulement si le joueur est présent et n'agit pas, jamais hors ligne.)
- [ ] **Entretien :** fréquence de réfection des enduits et du chaume, au calendrier.
- [ ] **Construction collective :** plusieurs joueurs sur le terrain d'un ami (combat désactivé) partagent-ils le travail et le rayonnement (Book 09) ?
