# Propositions issues des tests

Bonnes idées remontées par les testeurs de *Watt Now?*. Ce fichier sert de boîte à idées : une idée notée ici n'est **pas encore une décision**. Quand une idée est retenue, elle est reportée dans le book concerné (voir `book/README.md`), ou dans `book/99-evolutions-futures.md` si elle est remise à plus tard.

**Statuts** : 🆕 à étudier · ✅ retenue (book indiqué) · ⏳ plus tard (évolutions futures) · ❌ écartée (raison indiquée)

---

## Idées

### P-001 — Vestige de décharge sur le terrain du joueur
- **Date** : 2026-10-08
- **Source** : retour de test
- **Idée** : le terrain du joueur contient un vestige de décharge qui fait remonter de temps en temps, au hasard, des objets plus ou moins rares. Ces objets ne disparaissent pas : ils restent là jusqu'à ce que le joueur vienne les ramasser.
- **Pourquoi c'est intéressant** : le joueur qui ne joue pas souvent n'est pas puni, il a même une bonne surprise en revenant. Ça donne une raison de revenir sans créer d'obligation de se connecter.
- **Books concernés** : 19-modele-du-terrain, 09-cycles-progression-classements, 07-economie (rareté des objets)
- **Statut** : 🆕 à étudier

### P-002 — Une gamme d'objets bushcraft dès le début, rangée par besoin
- **Date** : 2026-10-08
- **Source** : demande du porteur du projet après les retours de test
- **Idée** : une quarantaine d'objets bushcraft fabricables dès la première heure, avec ce qu'on trouve sur le terrain. Ils sont rangés **par besoin** (comme le joueur pense), et chacun a une **suite** : une évolution commune à tous, puis une évolution propre à chaque famille.
- **Pourquoi c'est intéressant** : aujourd'hui, les recettes communes sont peu nombreuses (13 dans `code/commun/src/recettes.ts`) et la première heure s'épuise vite. Le bushcraft donne beaucoup de petits objets utiles, réalistes et bon marché. Les évolutions montrent au joueur où il va et donnent envie de commercer avec les autres familles.
- **Books concernés** : 02-crafting, 03-bibliotheque-et-savoir (§4 qualités d'outil, §5.6 domaines), 10-construction, 11-agriculture-elevage-alimentation (§10), 12-portage-vetements-protections, 05-sante-et-soins, 06-zombies (§9.3 défenses), 21-perimetre-phase-0
- **Statut** : 🆕 à étudier

#### 1. Ce qui existe déjà

| Déjà en jeu (recettes communes) | Déjà en jeu (recettes de famille) |
|---|---|
| Remmancher la hache · établi · abri de branches et de bâche · coffre · corde tressée · escabeau · gourdin · plumer la poule · trois plats au feu · sac de fortune · pansements | 🔥 charbonnière, foyer de forge, lame forgée · ⚡ banc de recharge, panneau solaire · ⚙️ pédalier universel |

Les objets marqués **(existe)** dans la suite sont ces recettes. On les range simplement à leur place.

#### 2. Le rangement proposé : sept onglets, dans l'ordre de l'urgence

L'ordre suit la règle des 3 du bushcraft (3 heures sans abri par mauvais temps, 3 jours sans eau, 3 semaines sans nourriture), adaptée au jeu : on se met à l'abri, on fait du feu, on boit, on mange, puis on s'équipe.

| Onglet | La question que se pose le joueur |
|---|---|
| 🏕️ **S'abriter et dormir** | « Où je passe la nuit ? » |
| 🔥 **Feu et lumière** | « Comment j'ai chaud, je cuis et je vois ? » |
| 💧 **Eau** | « Comment je bois sans tomber malade ? » |
| 🍖 **Se nourrir** | « Comment je trouve, j'attrape, je cuis et je garde à manger ? » |
| 🎒 **Porter et ranger** | « Comment je transporte et je stocke ? » |
| 🛡️ **Se défendre et prévenir** | « Comment je ne me fais pas surprendre ? » |
| 🩹 **Se soigner** | « Comment je me répare ? » |
| 🪢 **Matériaux et outils** | « De quoi j'ai besoin pour fabriquer le reste ? » |

Règles d'affichage proposées :

- Dans chaque onglet, **ce qu'on peut faire tout de suite d'abord**, puis ce à quoi il manque une seule chose (en indiquant laquelle), puis le reste.
- Sous chaque objet, une ligne **« Et après ? »** montre l'évolution suivante, grisée tant qu'elle n'est pas accessible. Cela applique la **recette pressentie** du Book 03 §5.1 : le joueur voit qu'il existe mieux, et où chercher.
- Les évolutions des autres familles sont visibles, avec la mention **« chez les Charbonniers »** (ou Voltaïques, Mécanistes) : c'est une invitation au commerce.
- L'onglet **Matériaux et outils** est en dernier : le joueur n'y va que quand une autre recette le lui demande, par le lien « ce qui manque » (Book 02 §13).

#### 3. Les nouvelles matières à ramasser

Presque tout se fait avec ce qui existe déjà (branches, bûches, pierres, fibres, bâche, chiffons, poule). Il faudrait ajouter quelques matières naturelles, toutes présentes sur un terrain de campagne :

| Matière | Où | Sert à |
|---|---|---|
| **Écorce de bouleau** | Bouleaux du terrain | Allume-feu (brûle même humide), récipients, bols |
| **Résine de pin** | Pins du terrain | Colle, torches, allume-feu |
| **Branches souples** (saule, noisetier) | Bord de la mare, haie | Paniers, nasse, clayonnage |
| **Argile** | Berge de la mare | Foyers, poêle-fusée, pots (plus tard) |
| **Sable** | Berge, chemin | Filtre à eau |
| **Fougères, feuilles mortes** | Sous-bois | Couchage, isolation, toit d'appentis |
| **Os et plumes** | Plumer la poule (sous-produit, Book 02 §11) | Aiguilles, hameçons, empennage |
| **Graisse** | Plumer la poule, cuisson | Lampe à graisse, entretien du cuir, savon (plus tard) |
| **Boîte de conserve vide** | Manger une conserve (sous-produit) | Gamelle, alarme, lampe |
| **Braises éteintes** (charbon de feu de camp) | Tout feu de camp | Filtre à eau, colle, masque |

> La boîte de conserve vide et les os de la poule appliquent le principe « rien ne se perd » (Book 02 §1.5) : manger donne une matière.

#### 4. La gamme, onglet par onglet

Notation : **Couper 1**, **Marteler 1**… sont les qualités d'outil du Book 03 §4. Les durées sont des minutes de jeu (à l'écran, un vingtième).

##### 🏕️ S'abriter et dormir

| Objet | Matières | Outil | À quoi ça sert |
|---|---|---|---|
| Abri de branches et de bâche **(existe)** | 8 branches, 1 bâche | Couper 1 | Un toit pour la nuit |
| **Appentis de feuillage** | 12 branches, 2 corde, fougères | Couper 1 | Un abri **sans bâche** : pour celui qui l'a perdue ou qui veut un deuxième abri |
| **Lit de branchages** | 6 branches, 4 fougères | Couper 1 | Isole du sol : meilleur sommeil, moins de froid la nuit (Book 12 §3.4) |
| **Réflecteur de chaleur** | 4 bûches, 4 branches | Marteler 1 | Petit mur derrière le feu, qui renvoie la chaleur vers l'abri |
| **Coupe-vent tressé** | 10 branches souples, 4 branches | Couper 1 | Pan de clayonnage : protège l'abri du vent dominant (Book 13) |
| **Étendoir** | 3 branches, 1 corde | — | Sèche les vêtements mouillés (Book 12 §3.3) |

| Ligne | Évolution commune | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|---|
| Abri | Appentis → hutte de clayonnage et torchis → cabane en rondins (Book 10 §6) | Hutte à **pierres chaudes** : des pierres chauffées au feu, glissées sous le couchage | Abri éclairé et ventilé : petit ventilateur 12 V contre la condensation | Tente en **toile tissée** et cordée : légère, se démonte et se transporte |
| Couchage | Lit de branchages → paillasse de paille ou de laine | Lit sur **braises enterrées** (vieille technique de bivouac d'hiver) | **Couverture chauffante** sur batterie : très confortable, très gourmande | **Hamac** de corde, puis lit de cordes tendues sur cadre (sec, aéré, hors d'atteinte des rampants) |
| Réflecteur | Réflecteur de pierres sèches | Le réflecteur devient le dos d'un **poêle de masse** (Book 10 §5) | Feuille d'aluminium récupérée : réflecteur léger | — |

##### 🔥 Feu et lumière

| Objet | Matières | Outil | À quoi ça sert |
|---|---|---|---|
| Feu de camp **(existe)** | Branches, bûches, pierres | Briquet | Chaleur, cuisson, lumière |
| **Allume-feu en copeaux** (« plumes » de bois) | 1 branche | Couper 1 | Allumer avec du bois humide (hiver, après la pluie, Book 02 §3) |
| **Nid d'écorce de bouleau** | 1 écorce | — | Prend à la première étincelle, même mouillé |
| **Archet à feu** | 3 branches, 1 corde, 1 pierre | Couper 1 | Allumer **sans briquet** : 10 min d'effort moyen. Le briquet du kit s'use et finit vide |
| **Torche de résine** | 1 branche, 1 chiffon, 1 résine | — | Lumière portée pour tous (aujourd'hui, seuls les Charbonniers ont une torche) |
| **Foyer Dakota** | — (on creuse deux trous reliés) | Creuser 1 | Feu **discret** : flamme sous terre, peu de lumière, peu de fumée, moins de bois. Signature lumineuse et olfactive réduites (Book 06) |
| **Lampe à graisse** | 1 boîte de conserve vide, 1 chiffon, graisse | Couper 1 | Petite lumière fixe pour l'abri, sans flamme nue au sol |

| Ligne | Évolution commune | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|---|
| Allumage | Archet → archet à poignée de pierre polie (plus rapide) | **Briquet à silex forgé** dans une vieille lime : inusable | **Allumeur électrique** : laine d'acier ou résistance sur une pile | **Piston à feu** : un cylindre alésé au tour, l'air comprimé enflamme l'amadou |
| Foyer | Foyer Dakota → **poêle-fusée** en argile (Feu II) : très peu de bois pour beaucoup de chaleur | Poêle de masse (Book 10 §5), puis forge | **Foyer ventilé** : un ventilateur 12 V attise le feu, combustion presque sans fumée | **Réchaud à bois** fermé, en tôle de fût, avec soufflet à pied |
| Lumière | Torche → lampe à graisse → lanterne à verre récupéré | Lanterne à huile, verre d'un bocal | Lampe LED sur batterie, puis éclairage de la base (Book 18) | Lanterne à dynamo à manivelle (existe dans le kit) |

##### 💧 Eau

| Objet | Matières | Outil | À quoi ça sert |
|---|---|---|---|
| **Récupérateur de pluie** | 1 bâche, 4 branches, 1 corde, un récipient | Couper 1 | **Processus passif** : il se remplit quand il pleut, même hors ligne. Eau plus propre que la mare |
| **Filtre trois couches** | 1 bouteille plastique (vestige) ou cône d'écorce, 1 chiffon, sable, braises éteintes | Couper 1 | Rend l'eau claire. **Ne la rend pas potable** : il faut toujours la bouillir, mais il en faut moins de bois (eau moins chargée) |
| **Bol d'écorce et pierres chaudes** | 1 écorce, 1 corde, 4 pierres | Couper 1 | Faire bouillir l'eau **sans casserole** : on y plonge des pierres chauffées au feu |
| **Gamelle de conserve** | 1 boîte de conserve vide, 1 branche | Couper 1 | Faire bouillir 0,5 L directement sur le feu |
| **Trépied de cuisson** | 3 branches, 1 corde | Couper 1 | Suspendre la gamelle au-dessus du feu (sert aussi à la cuisine) |

| Ligne | Évolution commune | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|---|
| Récupérer | Récupérateur → fût de 200 L (vestige, Book 02 §5) → citerne | — | **Jauge** à flotteur et contact : on voit le niveau depuis l'interface | **Gouttières** sur l'abri ou la cabane, menant à la citerne |
| Filtrer | Filtre trois couches → filtre à charbon de bois | **Charbon de charbonnière** (meilleur que les braises) : filtre plus durable | **Bouilloire électrique** ou stérilisation par lampe UV récupérée (rare) | **Filtre à sable lent** (biosable) avec pompe à main : l'eau en sort potable, sans bois |
| Contenir | Bol d'écorce → **pot d'argile cuite** (four à poterie) | Pot en argile cuite, chaudron de fonte | — | **Seau de bois cerclé** (tonnellerie simple) |

##### 🍖 Se nourrir

| Objet | Matières | Outil | À quoi ça sert |
|---|---|---|---|
| Plumer la poule, plats au feu **(existe)** | — | — | — |
| **Panier tressé** | 8 branches souples | — | Cueillette : porte fruits et champignons sans les abîmer (ils restent frais plus longtemps) |
| **Bâton à fouir** | 1 branche | Couper 1 | Creuser 1 : racines comestibles, vers pour la pêche |
| **Collet** | 1 corde (ou ficelle), 1 branche | Couper 1 | **Piège passif** : on le pose, on revient (Book 11 §10). Petit gibier |
| **Nasse** | 10 branches souples, 1 corde | Couper 1 | **Piège à poissons passif** dans la mare |
| **Ligne de pêche** | 1 ficelle, 1 os (hameçon), 1 branche | Couper 1 | Pêche active à la mare |
| **Foëne** (lance à poissons) | 1 branche | Couper 1 | Branche fendue en quatre pointes : pêche active, sans appât |
| **Claie de séchage** | 6 branches, 1 corde | Couper 1 | **Processus passif** : sécher fruits, champignons, viande. Ils se gardent bien plus longtemps (Conservation I) |
| **Gril de branches vertes** | 4 branches | Couper 1 | Cuire viande et poisson : une nouvelle famille de plats |

| Ligne | Évolution commune | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|---|
| Pièges | Collet → **cage-piège** en branches | Piège à **ressort d'acier** (lame de ressort) : plus sûr, plus gros gibier | Piège avec **alerte** : un contact prévient quand il s'est déclenché | Piège à **bascule et contrepoids**, puis pièges mécaniques contre les rampants (Book 06 §9.3) |
| Pêche | Nasse → **filet** de corde | Hameçons forgés dans du fil de fer | Pêche de nuit à la lampe (les poissons viennent à la lumière) | **Filet tissé** au métier, plus grand, plus solide |
| Conserver | Claie → séchoir abrité | **Fumoir** en tipi (fumage, Book 02 §6 : fumée = signature) | **Réfrigération** (Book 02 §6) | **Salage et séchoir solaire** en caisse vitrée (Book 02 §6) |
| Cuire | Trépied → **marmite norvégienne** : on porte à ébullition, puis la marmite finit de cuire seule dans une caisse isolée de fougères. Moitié moins de bois | Crémaillère et chaudron de fonte, four à pain | Plaque chauffante sur batterie | **Four solaire** en caisse vitrée |

##### 🎒 Porter et ranger

| Objet | Matières | Outil | À quoi ça sert |
|---|---|---|---|
| Sac de fortune, coffre **(existent)** | — | — | — |
| **Travois** | 2 longues branches, 4 branches, 2 corde | Couper 1 | Traîner des charges lourdes au sol (bûches, pierres) : 50 kg en plus du sac, mais on avance lentement |
| **Bûcher couvert** | 4 bûches, 8 branches, 1 bâche (ou fougères) | Couper 1 | Garde le bois **sec** en hiver et après la pluie (Book 02 §3) : le bois humide brûle deux fois moins bien |
| **Étui et ceinture** | 1 corde, 1 chiffon | Couper 1 | Accès rapide au couteau ou au gourdin (Book 12 §2.1) |
| **Cache enterrée** | 1 bâche | Creuser 1 | Un petit stock caché de 20 kg, que l'on retrouve après un effondrement |

| Ligne | Évolution commune | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|---|
| Porter | Sac de fortune → sac bricolé (Book 12 §2.1) | Traîneau à **patins de fer** (hiver, neige) | Remorque de vélo électrique récupérée (rare) | **Hotte** et sac à cadre (natifs, Book 12 §6), puis **brouette** et vélo-cargo |
| Stocker | Bûcher → séchoir à bois (Book 02 §8) | Bûcher accolé à la forge : la chaleur perdue sèche le bois (Book 02 §11) | — | Grand **hangar** de stockage (Book 10 §9) |

##### 🛡️ Se défendre et prévenir

| Objet | Matières | Outil | À quoi ça sert |
|---|---|---|---|
| Gourdin **(existe)** | — | — | — |
| **Épieu durci au feu** | 1 longue branche | Couper 1, feu | Garder un zombie à distance : il saisit avant de mordre (Book 06 §2.3), l'allonge compte |
| **Protège-avant-bras de fortune** | 2 écorces (ou magazines), 1 corde | Couper 1 | Protège la zone la plus mordue (Book 12 §4) |
| **Alarme à boîtes de conserve** | 2 boîtes vides, 1 ficelle, 2 branches | — | Un fil tendu autour de l'abri : on est **prévenu** quand quelque chose passe. Attention, les zombies proches l'entendent aussi |
| **Fronde** | 1 chiffon, 1 ficelle | Couper 1 | Lancer une pierre **loin** : le bruit de l'impact **détourne** un zombie (leurre sonore, Book 06) |
| **Pieux** | 6 branches | Couper 1 | Une ligne de pieux plantés : ralentit et bloque les groupes |

| Ligne | Évolution commune | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|---|
| Arme de contact | Épieu → épieu à pointe de couteau ligaturée | **Lance à pointe forgée**, machette | Aiguillon à décharge sur batterie (Électricité II) | **Arbalète** (Mécanique II, silencieuse, Book 11 §10) |
| Alarme | Boîtes de conserve → **carillon** de ferraille | — | **Alarme électrique** à contact, puis capteurs (Book 06 §9.3) | **Leurre à vent** : un carillon posé loin de la base attire les zombies ailleurs |
| Obstacle | Pieux → **fossé à pieux** → palissade | Mur maçonné (Book 06 §9.3), **fosse à feu** | Clôture électrique | Palissade, pièges mécaniques |

##### 🩹 Se soigner

| Objet | Matières | Outil | À quoi ça sert |
|---|---|---|---|
| Pansements **(existe)** | — | — | — |
| **Attelle de branches** | 2 branches, 1 chiffon, 1 corde | Couper 1 | Entorse, fracture : permet de bouger (Book 05) |
| **Tisane d'écorce de saule** | 1 écorce de saule, eau | Feu | Calme la douleur et la fièvre (le saule contient l'ancêtre de l'aspirine) |
| **Feuillées** | — | Creuser 1 | Des toilettes creusées loin de l'eau : moins de dysenterie (Book 05) |
| **Masque de tissu** | 1 chiffon, braises éteintes | — | Filtre la fumée et la poussière (fouille des ruines, forge) |

| Ligne | Évolution commune | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|---|
| Pansement | Pansement → **pansement bouilli** (moins d'infection) | Bandes stérilisées à l'eau bouillante sur la forge | Lampe frontale pour soigner la nuit, sans feu | Bandes de **lin** tissé |
| Immobiliser | Attelle → **plâtre** (Médecine II) | Plâtre de **chaux et de gypse** (Book 04) | — | Attelle articulée en bois et cuir |
| Hygiène | Feuillées → toilettes sèches | **Savon** de cendre et de graisse (Book 04) | — | Toilettes sèches avec **compost** pour le potager (Book 11) |

##### 🪢 Matériaux et outils

| Objet | Matières | Outil | À quoi ça sert |
|---|---|---|---|
| Corde, hache remmanchée **(existent)** | — | — | — |
| **Ficelle** | 2 fibres | — | Plus fine que la corde : collets, lignes, alarmes, ligatures |
| **Colle de résine** | 1 résine, braises éteintes | Feu | Emmancher, étanchéifier un panier, réparer |
| **Maillet de bois** | 1 bûche | Couper 1 | Marteler 1 pour tous, et **fendre au couteau** (bâtonnage) : des planches sans scie |
| **Coin de bois** | 1 branche | Couper 1 | Avec le maillet, fend une bûche en bardeaux et en planches |
| **Pierre à aiguiser** | 1 pierre de grès | — | Abraser 2 : remet le couteau abîmé en état (couteau aiguisé, qui existe déjà par la meule) |
| **Pelle de bois durci** | 1 bûche | Couper 1, feu | Creuser 1+ : foyer Dakota, feuillées, cache, fossé |
| **Aiguille d'os** | 1 os | Abraser 1 | Coudre 1 : réparer les vêtements, coudre une sacoche (Book 12 §5) |
| **Hache de pierre** | 1 pierre, 1 branche, 1 ficelle, colle | Couper 1 | Fendre 1 : un secours pour qui n'a pas trouvé de tête de hache |

| Ligne | Évolution commune | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|---|
| Lien | Ficelle → corde → **corde de lin roui** (Book 02 §4) | **Fil de fer** recuit à la forge | **Câble électrique** récupéré : solide, et conducteur | **Corderie à manivelle** : longues cordes régulières, plus solides |
| Colle | Colle de résine → **poix** | **Goudron de bois** (charbonnière en fût, Book 02 §11) | Colle chaude au pistolet sur batterie (vestige) | **Colle de peau** et de caséine (lait de chèvre, Book 11) |
| Frapper | Maillet → marteau (vestige) | **Masse** forgée (Marteler 3) | — | Marteau-pilon hydraulique (palier III) |
| Affûter | Pierre à aiguiser → grès fin | **Lime** forgée et trempée (Book 02 §7) | **Meuleuse** électrique | **Meule à pédale** (existe : pédalier) |
| Fendre | Hache de pierre → hache remmanchée (existe) | **Tête de hache forgée** | — | **Coins d'acier** et merlin pour débiter des rondins |

#### 5. Ce qu'il faudra vérifier avant d'en retenir une partie

- **Le volume** : environ 45 recettes nouvelles. Pour la phase 0a, on pourrait n'en prendre qu'une dizaine, une ou deux par onglet. Celles qui me semblent rapporter le plus : archet à feu, foyer Dakota, récupérateur de pluie, filtre trois couches, collet, claie de séchage, bûcher couvert, travois, alarme à boîtes de conserve, épieu.
- **Les nouvelles matières** (§3) demandent des modèles 3D, des points de ramassage sur le terrain et des icônes (Book 21 §5).
- **Les processus passifs** (pluie, collet, nasse, claie) servent aussi le joueur qui joue peu, comme l'idée P-001.
- **La règle de famille** (Book 02 §15) : les évolutions de famille doivent rester dans les domaines de chaque famille (Book 02 §6). Ici, j'ai mis « — » quand aucune version réaliste ne me venait, plutôt que d'en forcer une.
- **Le gibier et les poissons** n'existent pas encore en 0a (seulement la poule) : collet, nasse et pêche attendent la faune.

<!-- Modèle d'une entrée :

### P-001 — Titre court de l'idée
- **Date** : AAAA-MM-JJ
- **Source** : qui l'a proposée / dans quel contexte du test
- **Idée** : ce qui est proposé, en quelques phrases.
- **Pourquoi c'est intéressant** : le problème ressenti ou ce que ça apporte.
- **Books concernés** : ex. 02-crafting, 13-meteo
- **Statut** : 🆕 à étudier

-->
