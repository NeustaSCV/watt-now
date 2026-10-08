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
- **Statut** : ✅ retenue en partie, par lots filtrés (Book 02 §14 bis). **Lot 1 fait (0.2, 2026-10-08)** : ficelle, bâton à fouir, foyer Dakota, récupérateur de pluie, lit de branchages, alarme à boîtes de conserve, protège-bras, épieu, travois, boîte de conserve vide ; ils nourrissent aussi les objectifs « S'installer » (Book 22 §3.1). Filtre : un objet n'entre que s'il agit sur un système qui existe, sans nouvelle matière à modéliser, sans doublon, sans casser un métier. Écartés pour l'instant : cache enterrée (le coffre suffit), pierre à aiguiser (la meule des Mécanistes), torche de résine (les lumières de famille s'échangent). Les autres attendent leur système (conservation, bois humide, faune côté serveur, fractures…).

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

### P-003 — Environ 500 objets du quotidien à trouver, utiles, absurdes ou d'humour noir
- **Date** : 2026-10-08
- **Source** : demande du porteur du projet
- **Idée** : remplir le monde (ruines, halte, décharge de P-001, poches des Éteints) de **vestiges de l'Âge de l'Abondance** que l'on reconnaît tout de suite. Chacun a un **usage direct** et/ou se **démonte en composants** qui entrent dans des recettes (Book 02 §5, Book 03 §2). Beaucoup sont décalés : gadgets connectés morts, objets de riches, sextoys, pop culture, humour noir. Le jeu est interdit aux moins de 18 ans.
- **Pourquoi c'est intéressant** : la fouille devient drôle et surprenante, et le joueur apprend à regarder un objet ridicule comme une réserve de pièces. Un vibromasseur, c'est un moteur, des piles et une LED. Un accordéon, c'est un soufflet de forge. Le même objet ne vaut pas la même chose pour chaque famille, ce qui fait vivre le commerce.
- **Books concernés** : 02-crafting (§5 vestiges), 03-bibliotheque-et-savoir (§2 niveaux, §3.3 électronique), 06-zombies (leurres), 07-economie (valeur des vestiges), 15-univers (§4 vestiges absurdes), P-001 (tableau de tirage de la décharge)
- **Statut** : 🆕 à étudier

#### 1. Règles d'écriture

- **Pas de marque déposée ni de personne réelle** (Book 15 §1, et pour éviter les ennuis de droits) : la pop culture passe par des **parodies reconnaissables** (« sabre de l'Ordre galactique », « monstre de poche jaune électrique »).
- **On se moque des comportements, pas des gens** (Book 15 §1) : l'ironie vise la dépendance aux gadgets, aux écrans, à l'argent, jamais un groupe réel.
- **Tout objet sert à quelque chose**, même par son démontage. Un objet vraiment inutile devient au moins un **trophée** ou une **décoration** du terrain (Book 15 §4).
- **Rareté** (colonne R), qui sert aussi au tirage de la décharge (P-001) : **C** commun · **P** peu commun · **R** rare · **L** légendaire.

#### 2. Les composants qui reviennent partout

C'est ce qui relie les 500 objets entre eux : on ne fouille pas pour un objet, on fouille pour ses **composants**.

| Composant | On le trouve dans | Il sert à |
|---|---|---|
| **Cellule lithium 18650** | Ordinateur portable, batterie externe, vapoteuse, trottinette, perceuse | ⚡ Packs de batteries, lampes |
| **Petit moteur à courant continu** | Brosse à dents, jouets, vibromasseur, imprimante, aspirateur robot | ⚡ Ventilateur de forge, génératrice miniature, leurre mobile |
| **Gros moteur** | Machine à laver, tapis de course, aspirateur, robot ménager | ⚙️ Génératrice entraînée par roue ou pédalier |
| **Résistance chauffante** | Grille-pain, sèche-cheveux, bouilloire, radiateur, lisseur | ⚡ Chauffage, allumeur, couveuse |
| **Ressort** | Matelas, trampoline, agrafeuse, stylo, horloge, sommier | Pièges, alarmes, arbalète |
| **Aimant** | Haut-parleur, disque dur, aimant de frigo | Boussole, génératrice, dynamo |
| **LED** | Guirlandes, jouets, baskets lumineuses, télé | ⚡ Éclairage basse consommation |
| **Haut-parleur, buzzer** | Enceinte, poupée qui parle, détecteur de fumée, babyphone | ⚡ Alarmes, leurres sonores |
| **Verre, miroir, lentille** | Bocaux, rétroviseur, lunettes, rétroprojecteur, jumelles | Récipients, signal, **allumer un feu au soleil**, four solaire |
| **Cuivre** | Câbles, rallonges, frigo, climatiseur, moteurs | ⚡ Câblage, alambic (🔥) |
| **Aluminium** | Canettes, capsules de café, casseroles, plaques | 🔥 Refonte au creuset |
| **Plastique PEHD** | Bidons, jouets, planches à découper | 🔥 Refonte (Book 02 §4) |
| **Latex, caoutchouc** | Préservatifs, gants, ballons, chambres à air | Élastiques de fronde, joints, étanchéité |
| **Roues et roulements** | Caddie, poussette, valise, fauteuil roulant, skate | ⚙️ Chariots, brouette, pédalier |
| **Tissu, mousse, plumes** | Couettes, peluches, canapés, doudounes | Isolant, couches de vêtements (Book 12) |
| **Papier** | Livres, billets de banque, magazines | Allume-feu, et parfois **savoir** (Book 03 §5.4) |

> **Les leurres forment une famille cachée.** Beaucoup d'objets absurdes font du bruit ou de la lumière tout seuls : réveil, poupée qui parle, aspirateur robot, distributeur de croquettes, feux d'artifice. Posés loin de la base, ils **détournent les Éteints** (Book 06 §9.3). C'est la meilleure raison de garder un objet ridicule.

#### 3. Le catalogue

##### 🍳 Cuisine (35)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Casserole cabossée | C | Bouillir l'eau, cuire | Aluminium à refondre |
| Poêle antiadhésive rayée | C | Cuisson, arme de contact honnête | Disque d'alu, manche |
| Cocotte en fonte | P | Four de camp, marmite norvégienne | Fonte (très recherchée) |
| Autocuiseur | P | Cuisson rapide : −60 % de bois | Cuve inox, soupape, joint : base d'alambic (🔥) |
| Couteau de chef | P | Couper 2 | Lame inox |
| Couverts dépareillés | C | Manger | Fourchette → foëne, cuillère → leurre de pêche |
| Ouvre-boîte | C | Ouvrir les conserves sans abîmer le couteau | Petite lame, engrenage |
| Bocaux à couvercle | C | Conserves, contenir un acide | Verre, couvercle → lampe à huile |
| Bouteille en verre | C | Contenir | Tesson = lame (Couper 1) |
| Bouteille plastique 1,5 L | C | Gourde, filtre, désinfection de l'eau au soleil | PET, bouchon, entonnoir |
| Film étirable | C | Étanchéifier, pansement d'urgence | Plastique |
| Papier aluminium | C | Réflecteur, cuisson sous la braise | Alu |
| Râpe | C | Abraser 1 | Tôle perforée → tamis |
| Passoire inox | C | Tamis à sable, filtre grossier | Inox |
| Moulinette à légumes | P | Purée | Engrenages, manivelle (⚙️) |
| Robot ménager | P | — | Moteur, lame, bol |
| Mixeur plongeant | C | — | Petit moteur, lame |
| Grille-pain à reconnaissance faciale | P | « Visage non reconnu. » | Résistance, ressorts |
| Bouilloire électrique | C | ⚡ Bouillir sur batterie (gros appel de courant) | Résistance, thermostat |
| Micro-ondes | C | Cage de Faraday pour ranger l'électronique | Transformateur haute tension (⚡ soudure), plateau de verre |
| Frigo connecté | P | « Mise à jour requise. Veuillez patienter. » Glacière passive | Compresseur, tubes de cuivre, isolant |
| Machine à café à capsules | C | Garde 47 capsules d'un café qui n'existe plus | Pompe 15 bars (⚙️ pulvérisateur), résistance |
| Sachet de 200 capsules de café usagées | C | Godets à semis | Aluminium à refondre |
| Friteuse sans huile | C | Le dernier appareil qu'on a vu marcher chez les riches | Résistance, ventilateur |
| Mandoline | P | Couper 2, et des doigts en moins | Lame très affûtée |
| Rouleau à pâtisserie | C | Gourdin compact | Bois dur |
| Planche à découper | C | Petit établi portatif | Bois ou PEHD |
| Gants de vaisselle | C | Manipuler la chaux, l'acide | Caoutchouc → élastiques |
| Thermomètre de cuisson | P | Fumage, fromage, couveuse | Sonde |
| Aimant de frigo « Souvenir des Sables » | C | — | Aimant : boussole de fortune avec une aiguille |
| Paquet de sel | C | Conservation, réhydratation | — |
| Sucre en morceaux | C | Réhydratation, appât, moral | — |
| Bidon d'huile de friture usagée | C | Combustible de lampe | Savon (Book 04) |
| Pot de pâte à tartiner de 3 kg | P | 16 000 kcal de bonheur industriel | Bocal |
| Livre « Cuisiner sans cuisiner » | C | Un classique de l'époque (Book 15) | Papier |

##### 🚿 Salle de bain (27)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Brosse à dents connectée | C | Batterie à plat depuis des années | Mini batterie, moteur |
| Rasoir électrique | C | — | Moteur, lames, batterie |
| Rasoirs jetables | C | Couper 1, précis | Lames |
| Pince à épiler | C | Échardes, tiques | Pince fine (⚡ électronique) |
| Coupe-ongles | C | — | Levier, petite lime |
| Sèche-cheveux | C | — | Résistance, moteur : soufflerie de forge 230 V |
| Lisseur à cheveux | C | — | Plaques chauffantes en céramique |
| Miroir de salle de bain | C | Signal lumineux, regarder derrière un coin | Verre, réflecteur de four solaire |
| Rouleau de papier toilette | P | La monnaie des trois premières semaines de la Grande Panne | Allume-feu |
| Pyramide de 96 rouleaux | L | Trophée des grands stockeurs de la Grande Panne | 96 allume-feu |
| Savon | C | Hygiène (Book 05) | — |
| Gel hydroalcoolique | C | Désinfecter. Brûle d'une flamme bleue | Alcool : allume-feu |
| Dentifrice | C | Polir le métal | — |
| Fil dentaire | C | Le fil le plus solide de la maison | Collets, sutures, ligatures |
| Vaseline | C | Graisser, protéger du froid | Avec du coton : le meilleur allume-feu |
| Cotons et coton-tiges | C | Soins | Allume-feu |
| Tampons hygiéniques | C | Pansement compressif, filtre | Coton : allume-feu |
| Couches pour bébé | C | Pansement absorbant | Gel absorbant |
| Laque à cheveux | C | Lance-flammes improvisé (dangereux, signature énorme) | Bombe aérosol |
| Peignoir d'hôtel « emprunté » | C | Couche chaude | Tissu éponge |
| Balance connectée | C | Affiche encore votre poids, et que c'est trop | Capteurs, pile bouton |
| Pomme de douche | C | Douche solaire avec un bidon noir | — |
| Rideau de douche | C | Bâche de fortune | Plastique, anneaux |
| Lunette de toilettes | C | Toilettes sèches. Le « siège social » du camp | — |
| Désodorisant « Brise d'Avant » | C | Masque son odeur (Book 06 §8.5)… à moitié | Aérosol |
| Parfum de luxe | P | Alcool, monnaie d'échange | Flacon de verre |
| Eau de Javel | P | Désinfecter l'eau : 2 gouttes par litre | Bidon PEHD |

##### 🛏️ Chambre et intimité (32)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Matelas à mémoire de forme | C | Couchage (lourd) | Mousse isolante |
| Sommier à ressorts | C | Couchage | Une centaine de ressorts : pièges |
| Couette | C | Couchage | Plumes ou fibres isolantes |
| Oreiller en plumes | C | — | Plumes : empennage de flèches |
| Réveil mécanique | P | **Leurre sonore à retardement** | Ressort, engrenages |
| Lampe de chevet | C | — | Douille, câble |
| Vibromasseur « lapin » | P | Vibre encore : petit leurre posé loin | Moteur vibrant, piles, LED, silicone |
| Godemichet XXL en silicone | P | Matraque très honorable | Silicone : joints, bouchons étanches |
| Plug en acier inoxydable | P | Lest de pêche, projectile de fronde | Inox poli |
| Menottes à fourrure rose | P | Attacher quelque chose qui bouge encore | Acier léger, fourrure |
| Poupée gonflable | R | **Leurre visuel**, flotteur, matelas | Vinyle : rustines |
| Boîte de 12 préservatifs | C | **Réservoir d'eau de 1 L**, protège une mèche de l'humidité | Latex : élastique de fronde et de collet |
| Flacon de lubrifiant | C | Graisser une charnière qui grince : la discrétion avant tout | — |
| Fouet en cuir | P | — | Lanières de cuir |
| Bâillon-boule | P | Empêcher un blessé de hurler pendant les soins (signature sonore) | Sangle, boule |
| Tenue intégrale en latex | R | Protection anti-morsure médiocre, sauna garanti | Latex |
| Corset à baleines | P | Protection légère du torse | Baleines d'acier : aiguilles, ressorts |
| Bougies parfumées | C | Lumière | Cire : étanchéité, allume-feu |
| Huile de massage | C | Combustible de lampe | — |
| Roman érotique « Cinquante nuances de wattheures » | C | Moral | Papier |
| Magazine de charme | C | Protège-avant-bras (avec du ruban adhésif) | Papier glacé |
| Grenouillère licorne | C | Couche chaude | Polaire |
| Sac de 50 chaussettes orphelines | C | Mitaines, filtre, poche de fronde | Fibres |
| Coffret coquin verrouillé | R | Personne ne sait ce qu'il y a dedans | Contenu tiré au hasard |
| Lit à eau | R | 600 L d'eau croupie | Vinyle étanche : citerne |
| Matelas gonflable | C | Radeau | Vinyle, valve |
| Pompe à pied | C | **Soufflet de forge** (🔥) | Membrane, clapet |
| Masque de sommeil | C | Dormir le jour | — |
| Babyphone | C | ⚡ Alarme : un émetteur, un récepteur | Radio |
| Table de nuit en aggloméré | C | — | Brûle mal, colle toxique |
| Coffre à bijoux | C | Rangement | Petit miroir, charnière |
| Doudou abandonné | C | « Il cherche son enfant. Ou l'inverse. » | Bourre |

##### 🛋️ Salon et maison (33)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Télé plate de 85 pouces | C | — | Diffuseur et réflecteur, LED de rétroéclairage, alimentation |
| Télécommande sans télé | C | — | 2 piles, LED infrarouge |
| Console de salon | C | — | Ventilateur, alimentation |
| Canapé d'angle | C | Barricade, couchage | Mousse, ressorts, tissu, bois |
| Fauteuil massant | P | Ronronne fort | Moteurs 12/24 V |
| Fauteuil en cuir | P | — | Cuir (Book 12) |
| Aspirateur robot | C | S'il reste du jus, il tourne en rond : **leurre mobile** | Moteurs, roues, batterie lithium, capteurs |
| Aspirateur traîneau | C | — | Moteur 2 kW, tuyau (tuyère de forge) |
| Lampadaire | C | Le pied fait une lance | Tube d'acier, câble |
| Guirlande lumineuse | C | ⚡ Éclairage basse consommation | LED, fil |
| Horloge murale à pile | C | — | Mouvement |
| Horloge comtoise | R | Tic-tac régulier : leurre sonore | Engrenages en laiton, poids en fonte (contrepoids) |
| Tableau « Vivre Rire Aimer » | C | — | Châssis de bois, toile |
| Cadre photo numérique | C | Fait défiler les vacances d'une famille éteinte | Écran, carte mémoire |
| Rideaux occultants | C | **Cacher sa lumière** (signature lumineuse) | Tissu, tringle |
| Tringle à rideaux | C | Lance, broche de cuisson | Tube |
| Tapis persan | P | Isolant de sol | Laine |
| Plante en plastique | C | Camouflage | — |
| Ficus desséché | C | — | Pot, terreau |
| Aquarium | P | Bac de culture, mini-serre | Verre, pompe, chauffage |
| Poisson rouge vivant | R | Il a survécu. Personne ne sait comment. Mascotte | — |
| Purificateur d'air | C | — | Filtre HEPA : masque contre la fumée |
| Climatiseur mobile | P | — | Compresseur, cuivre (⚡ froid) |
| Radiateur électrique | C | — | Résistances |
| Poêle à granulés connecté | P | Demande le Wi-Fi pour s'allumer | Corps d'acier, vis sans fin (⚙️) |
| Fausse cheminée à LED | C | Flammes en tissu, chaleur nulle | Ventilateur, LED |
| Boule à facettes | P | Signal, leurre lumineux | Miroirs, moteur |
| Piano droit | R | 200 kg de moral | Cordes d'acier (collets, arc), feutre, bois |
| Encyclopédie en 24 volumes | P | **Savoir tiré au hasard** | Papier |
| Collection de DVD | C | — | Disques : réflecteurs, effaroucheurs d'oiseaux au potager |
| Bibelots en porcelaine | C | — | Tessons |
| Ventilateur sur pied | C | ⚡ Ventilation | Moteur, hélice : petite éolienne (⚙️) |
| Coussin péteur | C | Leurre sonore minuscule et vexant | Vessie en caoutchouc |

##### 💻 Électronique et gadgets (36)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Smartphone à l'écran fêlé | C | 2 % de batterie depuis trois ans | Batterie lithium, vibreur, haut-parleur, lentille |
| Batterie externe | C | ⚡ 20 à 40 Wh de réserve | Cellules 18650 |
| Ordinateur portable | C | ⚡ Lire des fichiers, s'il en reste | Cellules 18650, ventilateur, écran |
| Disque dur « TOUT LE SAVOIR DU MONDE » | R | Manuels techniques… ou 4 To de mèmes | Aimants néodyme |
| PC gamer RGB | C | Les lumières arc-en-ciel marchent encore | Alimentation 750 W, ventilateurs, dissipateurs en cuivre |
| Imprimante | C | Bourrage papier éternel | Moteurs pas à pas, tiges d'acier lisses |
| Imprimante 3D | R | ⚡ Imprime des pièces (avec filament et courant) | Moteurs, tiges, buse chauffante |
| Bobines de filament plastique | P | — | Plastique, fil solide |
| Drone | P | ⚡ Repérer les Éteints au loin (bruyant) | Moteurs sans balais, caméra, batterie |
| Casque de réalité virtuelle | P | Les Nostalgiques le portent pour revoir le monde d'avant | **Lentilles** : allumer un feu au soleil |
| Montre connectée | C | Compte vos pas vers la mort | Mini batterie, vibreur |
| Écouteur sans fil (un seul) | C | — | Microbatterie |
| Enceinte « intelligente » | C | « Je n'ai pas compris. » Leurre sonore | Haut-parleur, micro |
| Talkie-walkies (paire) | P | ⚡ Parler à 2 km | Radio |
| Radio à piles | P | ⚡ Capter les annonces des Compteurs | Haut-parleur, antenne |
| Radio à manivelle | R | Radio sans pile | Dynamo |
| Lampe torche LED | C | Lumière | LED, réflecteur |
| Blister de piles AA | C | La moitié sont vides | Zinc, graphite : électrodes |
| Multiprise | C | ⚡ Distribution | Cuivre |
| Rallonge de 25 m | C | ⚡ Câble et corde | Cuivre |
| Sac de 30 câbles de recharge | C | Aucun n'a le bon embout | Fil de cuivre fin, ligatures |
| Box Internet | C | Clignote dans le vide | Alimentation 12 V, antennes |
| Caméra de surveillance Wi-Fi | P | ⚡ Surveiller la base | Capteur, LED infrarouges |
| Détecteur de fumée | C | Alarme | Buzzer, pile 9 V |
| Lampe de jardin à détecteur | C | ⚡ Alarme de périmètre | Capteur de mouvement |
| Calculatrice solaire | C | Marche toujours, et pour l'éternité | Petite cellule solaire |
| Animal virtuel de poche | P | Mort il y a vingt ans, ressuscité, remort | Pile bouton |
| GPS de voiture | C | « Recalcul de l'itinéraire » vers des routes disparues | Écran, aimant de fixation |
| Liseuse électronique | P | Si elle a encore du courant : 3 000 livres, du **savoir** | Batterie, écran |
| Clé USB « NE PAS OUVRIR » | P | Mystère (une rumeur, une carte, une recette ?) | — |
| Vapoteuse | C | ⚡ Allumeur électrique | Cellule 18650, résistance |
| Cigarette électronique jetable | C | — | Petite cellule lithium |
| Lampe solaire de jardin | C | ⚡ Micro-recharge | Mini panneau, accu, LED |
| Onduleur d'ordinateur | P | ⚡ Batterie au plomb 12 V et onduleur tout faits | Batterie au plomb |
| Robot domestique | R | Vous suit en répétant « Comment puis-je vous aider ? » | Moteurs, batterie, capteurs |
| Liseuse de lecture vocale pour enfants | C | « Il était une fois… » à 3 h du matin : leurre | Haut-parleur |

##### 🔧 Garage et bricolage (42)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Caisse à outils rouillée | C | Outils tirés au hasard | — |
| Perceuse-visseuse sans fil | P | Percer 3, Visser 3, tant que la batterie tient | Batterie lithium, moteur |
| Meuleuse d'angle | P | Scier le métal 3 (sur 230 V) | Moteur |
| Boîte de disques à tronçonner | P | Consommables rares (Book 02 §12.1) | — |
| Scie sauteuse | P | — | Moteur, lames |
| Tronçonneuse | R | Abattre, si on trouve du carburant (signature 100 m) | Chaîne, moteur deux temps |
| Bidon d'essence vide | C | Contenir 3 | PEHD |
| Bidon d'essence avec un fond | R | 2 L de pétrole de l'Abondance | — |
| Bidon d'huile de vidange | C | Graisser, enduire le bois | — |
| Dégrippant en bombe | C | Dégripper un écrou | Aérosol |
| Ruban adhésif gris | C | Répare tout : attelle, protège-avant-bras | — |
| Sachet de colliers de serrage | C | Ligatures | Nylon |
| Rouleau de fil de fer | C | Ligatures, collets, alarme | Acier |
| Bocal de clous et vis mélangés | C | Construction | Acier, pointes de flèches |
| Pied-de-biche | P | Levier, arme, ouvrir les portes | Acier forgé |
| Marteau arrache-clou | C | Marteler 2 | — |
| Masse | P | Marteler 3 | Tête d'acier |
| Échelle en aluminium | P | Grimper (les Éteints ne grimpent pas, Book 06 §9.2) | Aluminium |
| Brouette au pneu crevé | P | Transport | Roue, tôle, tubes |
| Diable | P | Transport de charges lourdes | Roues |
| Établi pliant | C | Établi | Acier |
| Étau | P | Serrer, tenir | Fonte |
| Compresseur d'air | P | ⚡ Soufflerie de forge, gonfler | Moteur, cuve sous pression |
| Groupe électrogène | R | Wh, avec du carburant (signature énorme) | **Alternateur**, moteur |
| Poste à souder | R | Souder 2 | Transformateur, gros câbles |
| Masque de soudeur | P | Protège le visage | Verre teinté |
| Chalumeau à cartouche | P | Chauffer, souder à l'étain | Cartouche de gaz |
| Pistolet à colle | C | — | Résistance |
| Niveau à bulle | C | Construction | Fiole |
| Mètre ruban | C | Mesurer | Ruban d'acier à ressort : scie à fil de fortune |
| Scie égoïne | C | Scier le bois 2 | Lame |
| Rabot | P | Planches propres | Fer de rabot (lame) |
| Papier de verre | C | Abraser 1 à 2 | — |
| Sac de ciment durci | C | Contrepoids, pierre artificielle | — |
| Rouleau de câble électrique | P | ⚡ Câblage | Cuivre |
| Gaine électrique | C | **Sarbacane**, tuyau | PVC |
| Tube PVC | C | Sarbacane, tuyère, canalisation | PVC (fumées toxiques si on le brûle) |
| Laine de verre | C | Isolant (gratte, Book 10) | — |
| Plaques de polystyrène | C | Isolant, flotteur | — |
| Pots de peinture | C | Marquer, camoufler | — |
| Chariot à outils sur roulettes | C | Rangement mobile | Roulettes, tiroirs de tôle |
| Lampe de chantier | C | ⚡ Projecteur, leurre lumineux | Ampoule, réflecteur |

##### 🌱 Jardin (30)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Bêche | C | Creuser 2 | — |
| Râteau | C | Jardin | Dents : pointes de foëne |
| Fourche | P | Garder un Éteint à distance | Dents d'acier |
| Sécateur | C | Couper les branches | Ressort, lames |
| Faux | R | Faucher, arme lourde | Lame d'acier fin |
| Tondeuse thermique | C | — | Moteur quatre temps (⚙️), lame |
| Robot tondeuse | C | Tond encore là où il y a du soleil | Moteurs, batterie, petit panneau |
| Tuyau d'arrosage | C | Siphon, irrigation | Caoutchouc |
| Arrosoir | C | Contenir | — |
| Récupérateur d'eau de 300 L | P | Eau de pluie | PEHD |
| Nain de jardin | C | Il y a plus de nains que de survivants | Tessons, épouvantail |
| Nain de jardin pêcheur | P | Sa canne est un vrai bambou | Bambou |
| Flamant rose en plastique | C | Épouvantail | Tige d'acier |
| Barbecue à gaz | P | Cuisson | Grille, **bouteille de gaz** (Book 02 §5) |
| Sac de charbon de barbecue | P | **Charbon de bois tout fait** (🔥) | — |
| Salon de jardin en résine | C | — | Plastique |
| Parasol | C | Abri léger | Toile, mât |
| Trampoline | P | — | Toile (bâche), ressorts (pièges), cadre |
| Piscine gonflable | C | Citerne de 1 000 L | Vinyle |
| Piscine enterrée à l'eau verte | R | Réserve d'eau à filtrer, grenouilles | Liner |
| Sachets de graines | P | **Semences** (Book 11) à tester | — |
| Sac d'engrais | P | — | Nitrates (Chimie, Book 04) |
| Grillage en rouleau | P | Clôture, poulailler | Fil d'acier |
| Ruche abandonnée | R | Abeilles (Élevage II), miel | Cire |
| Composteur | C | Compost | Plastique |
| Hamac de jardin | C | Hamac | Toile, cordes |
| Éolienne décorative | C | Tourne, ne produit rien | Petit roulement |
| Abri de jardin en kit | P | Abri, cabane | Planches, tôle |
| Arroseur oscillant | C | — | Engrenages |
| Serre de jardin | R | Serre (Book 11) | Polycarbonate, arceaux |

##### 🚗 Voiture et route (30)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Trottinette électrique | P | Un des rares vestiges vraiment utiles (Book 15) | Moteur, lithium, roues |
| Vélo électrique | R | ⚡ Transport | Moteur dans le moyeu, batterie de 400 Wh |
| Chambre à air | C | — | **Élastique de fronde**, joints |
| Enjoliveur | C | Bouclier léger, réflecteur, gamelle | Plastique ou alu |
| Rétroviseur | C | Signal, voir derrière | Miroir |
| Siège bébé | C | — | Sangles (hotte), mousse |
| Ceinture de sécurité | C | — | Sangles très solides (Book 12) |
| Triangle de signalisation | C | Réflecteur | — |
| Gilet jaune | C | Le vêtement le plus voyant du monde : à éviter la nuit | Bandes réfléchissantes |
| Panneau « STOP » | C | Bouclier | Tôle d'alu |
| Plots de chantier | C | Entonnoir, **porte-voix** | Plastique |
| Glissière de sécurité | P | — | Tôle d'acier épaisse |
| Câbles de démarrage | P | ⚡ Relier des batteries (poste de soudure, Book 02 §8) | Gros cuivre |
| Cric | P | Lever, presser (⚙️) | Vis, levier |
| Adaptateur allume-cigare | C | ⚡ Prise 12 V | — |
| Sapin désodorisant « Voiture neuve » | C | Masque son odeur (Book 06 §8.5), vaguement | — |
| Tableau de bord tactile | C | « Veuillez accepter les conditions d'utilisation. » | Écran |
| Gyrophare | R | Leurre lumineux 12 V | Moteur, LED |
| Sirène d'ambulance | R | **Leurre sonore géant** ⚡ | Haut-parleur, ampli |
| Plaque d'immatriculation | C | — | Alu : protège-avant-bras |
| Bidon d'huile moteur plein | P | Graisser | — |
| Radar automatique | R | Le dernier fonctionnaire encore en poste. Son flash est un leurre | Batterie, flash |
| Barrière de péage | R | — | Barre de 3 m |
| Caddie de supermarché | C | **Chariot de transport** | Grille (gril), roues |
| Clé de voiture sans contact | C | Ouvre une voiture… si elle a encore du courant | Pile bouton |
| Boîte à gants pleine de PV | C | Allume-feu, et la preuve qu'on était civilisés | Papier |
| Moto de route | R | Transport (carburant) | Moteur, chaîne, réservoir |
| Camping-car échoué | L | Abri tout fait, réservoirs | Batterie auxiliaire, panneau solaire, chauffe-eau |
| Borne de recharge électrique | R | Morte. Les Voltaïques la vénèrent un peu | Gros cuivre, contacteurs |
| Gilet de livreur et sac isotherme | C | Sac isotherme de 40 L. « Votre commande arrive dans 10 min. » (il y a trois ans) | Isolant |

##### ⚽ Sport et loisirs (30)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Batte de baseball | P | Gourdin de niveau supérieur | Bois ou alu |
| Club de golf | P | Arme | Tête d'acier |
| Raquette de tennis | C | **Raquette à neige** | Cordage |
| Arc de tir sportif | R | Arc silencieux | Branches, corde |
| Flèches en carbone | P | — | Pointes |
| Kayak | R | Traverser la rivière (les Éteints coulent) | Polyéthylène |
| Paddle gonflable | P | Radeau | Vinyle |
| Vélo d'appartement | P | **Pédalier tout fait** (⚙️) | Volant d'inertie, courroie |
| Tapis de course connecté | C | Exige un abonnement pour démarrer | Moteur de 2 kW : **génératrice** |
| Haltères | C | Lests, contrepoids de pièges | Fonte |
| Corde à sauter | C | Corde | — |
| Ballon de foot dégonflé | C | — | Vessie : contenant |
| Casque de vélo | C | Casque léger | — |
| Casque de moto | P | Protège la tête (Book 12) | — |
| Genouillères et coudières | C | Protections | — |
| Tenue de moto en cuir | P | **Protection anti-morsure** | Cuir |
| Combinaison de plongée | P | Chaude, protège un peu | Néoprène |
| Canne à pêche | P | Pêche | Moulinet, fil nylon |
| Boîte de leurres de pêche | P | Pêche | Hameçons |
| Paire de skis | P | Avancer dans la neige (Book 13) | — |
| Luge | C | **Traîneau** | — |
| Planche de surf | P | — | Mousse, résine |
| Fléchettes | C | Petites armes de jet | Pointes |
| Table de billard | R | — | Plaque d'ardoise, boules (projectiles) |
| Boules de pétanque | C | Projectiles | Acier |
| Coupe de concours de pétanque | P | Trophée | Laiton |
| Protège-tibias | C | **Jambières** contre les rampants | — |
| Gants de boxe | C | Protègent les mains… mal | Mousse |
| Skateboard | C | — | Roulements, roues |
| Rameur d'appartement | P | — | Volant à air, chaîne (⚙️) |

##### 🧸 Enfants et jouets (27)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Peluche géante | C | — | Bourre isolante |
| Ours en peluche borgne | C | Moral | Bourre |
| Poupée qui parle | C | « Maman ! » à 3 h du matin : **leurre sonore** | Haut-parleur, piles |
| Voiture télécommandée | P | ⚡ **Leurre mobile** | Moteur, radio |
| Hélicoptère télécommandé | P | Éclaireur bruyant | Moteurs, batterie |
| Pistolet à eau | C | Pulvériser (désinfecter, arroser) | Pompe |
| Pistolet à amorces | C | Petit bang : leurre | Amorces (Chimie III) |
| Lance-pierre en plastique | C | Fronde faible | Élastique |
| Bac de 5 kg de briques à construire | C | Les répandre au sol : piège à pieds nus | Plastique |
| Pâte à modeler | C | Mastic | — |
| Boîte de craies | C | Marquer | **Calcaire** |
| Jeu de société incomplet | C | Moral | Dés, carton |
| Puzzle de 5 000 pièces (4 999) | C | Allume-feu | Carton |
| Poussette | C | **Chariot de transport** | Roues, tubes |
| Toboggan en plastique | C | — | PEHD |
| Cabane d'enfant en plastique | C | Abri, poulailler | Panneaux |
| Balançoire | C | — | Cordes, chaînes, portique |
| Kit du petit chimiste | R | **Savoir Chimie I** | Fioles en verre |
| Microscope jouet | P | — | Lentilles |
| Talkie-walkies enfants | C | Portée 50 m | — |
| Bulles de savon | C | — | Savon dilué |
| Sachet de bonbons | C | Sucre : réhydratation | — |
| Trottinette d'enfant | C | — | Roues, roulements |
| Ballon sauteur | C | — | Caoutchouc |
| Cartable à roulettes | C | Petit sac à roulettes | Roues |
| Piñata en forme d'âne | C | Contient des bonbons | Carton |
| Pistolet laser à fléchettes en mousse | C | Moral | Ressort |

##### 🦸 Pop culture et fans (33)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Sabre de l'Ordre galactique (jouet) | C | Torche à LED, matraque creuse | LED, piles, tube |
| Baguette de sorcier en résine | C | — | Résine |
| « Cape d'invisibilité » | P | En fait une couverture de survie | Mylar |
| Bouclier rond de super-héros | P | Bouclier léger | Plastique |
| Marteau de dieu nordique en mousse | C | Ne martèle pas | Mousse |
| Casque de chasseur de primes | P | Casque médiocre | Résine |
| Masque de tueur au masque de hockey | P | Protection du visage | Plastique |
| Tronçonneuse de film d'horreur (factice) | C | Fait du bruit, ne coupe rien | Petit moteur |
| Collection de 300 figurines jamais déballées | P | Valaient une fortune, valent 0 Wh | Plastique, carton |
| Poster de boys band | C | — | Papier |
| Carte à collectionner holographique rare | R | Un Nostalgique la paiera cher (Book 15 §3) | — |
| Classeur de cartes à collectionner | P | — | Papier |
| Peluche de monstre de poche jaune électrique | C | Les Voltaïques en ont fait leur porte-bonheur | Bourre |
| Costume de mascotte de Watty | L | La mascotte de la Compagnie (Book 18 §6). Très chaud | Mousse, tissu |
| Pin's de la Compagnie d'électricité | C | Les Compteurs le reconnaissent | — |
| Disque d'or encadré | R | Réflecteur | Vinyle doré |
| Vinyle collector | P | — | — |
| Platine vinyle | P | — | Moteur lent, aiguille en diamant |
| VHS « Mariage de Kevin et Jessica, 1998 » | C | — | Bande magnétique : ficelle brillante d'alarme, effaroucheur |
| Cartouches de jeux rétro | P | — | — |
| Borne d'arcade | R | — | Écran, joystick, monnayeur plein de pièces |
| Trône de fer en carton | P | Siège | Carton |
| Anneau « précieux » plaqué or | P | — | Chaîne |
| Uniforme de vaisseau spatial | C | — | Tissu |
| Peluche de chat arc-en-ciel | C | — | Bourre |
| Coffret de la saga de zombies culte | C | Ils avaient tout prévu, sauf de le faire | Disques |
| Guide de survie zombie (best-seller) | P | 90 % faux, 10 % vrai : savoir partiel | Papier |
| Masque de zombie en latex | P | Pour se fondre parmi les Éteints ? Ils s'en moquent : ils suivent le bruit et la chaleur | Latex |
| Masque de clown triste | C | — | Plastique |
| Statue en résine d'un footballeur | P | Contrepoids | Résine |
| Figurine de super-héros taille réelle | R | Épouvantail, leurre visuel | Résine, armature |
| Mug de série culte « Winter is coming » parodique | C | « L'hiver arrive. » C'est vrai, cette fois | Céramique |
| Console portable rétro | P | — | Écran, piles |

##### 🍾 Fête et alcool (22)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Bouteille de vodka | P | Désinfectant, combustible, monnaie | Verre |
| Whisky de 18 ans d'âge | R | Antiseptique de luxe, monnaie | Verre |
| Champagne | P | Le bouchon qui saute est un leurre | Verre épais |
| Pack de bière tiède | C | Calories, piège à limaces (Book 11) | Canettes |
| Canettes vides | C | **Réchaud à alcool**, alarme | Aluminium |
| Fût de bière de 30 L | P | — | Inox : cuve d'alambic (🔥) |
| Tireuse à bière | R | — | Pompe, serpentin de cuivre |
| Sachet de ballons de baudruche | C | Étanchéifier | Latex |
| Bouteille d'hélium | P | Voix ridicule | Bouteille sous pression |
| Carton de feux d'artifice | R | **Leurre géant** : tous les Éteints du coin vont voir ailleurs | **Poudre noire** |
| Pétards | C | Leurre sonore | Poudre |
| Machine à fumée de discothèque | P | Écran de fumée | Résistance, pompe |
| Glacière | C | Glacière | Isolant |
| Chapeaux pointus et confettis | C | — | Carton |
| Liqueur de menthe des grands-parents | C | Personne n'en voulait avant, personne n'en veut après | Alcool |
| Fontaine à chocolat | P | — | Résistance, vis sans fin |
| Karaoké | P | ⚡ Micro et ampli : sirène, leurre | Haut-parleur |
| Gobelets en plastique | C | — | — |
| Seau à champagne | C | Seau | Inox |
| Shaker à cocktail | C | Contenant étanche | Inox |
| Tonneau de vin | R | Tonneau | Douelles, cercles d'acier |
| Distributeur de shots en forme de roulette | C | — | — |

##### 💊 Pharmacie et santé (29)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Trousse de secours | P | Soins (Book 05) | Bandes, ciseaux |
| Boîte de paracétamol | P | Douleur, fièvre | — |
| Antibiotiques périmés | R | Infection (Book 05) | — |
| Antiseptique iodé | P | Désinfecter | — |
| Bandes élastiques | C | Bandage serré | — |
| Seringues | P | — | Aiguilles |
| Stéthoscope | P | Écouter à travers une porte s'il y a des Éteints derrière | Tube |
| Tensiomètre | C | — | Poire : petit soufflet |
| Thermomètre médical | C | Fièvre | — |
| Lunettes de vue | C | — | Verres convergents : allumer un feu au soleil |
| Lunettes de soleil | C | — | — |
| Béquilles | C | Marcher blessé, lance | Tubes d'alu |
| Fauteuil roulant | P | Chariot | Roues, roulements |
| Déambulateur | C | Support de séchoir | Tubes |
| Dentier | C | « Toujours souriant. » | — |
| Prothèse de hanche en titane | P | Trouvée exactement là où on l'attendait. Petit marteau | Titane (la forge n'en fait rien) |
| Jambe de bois | R | Gourdin | Bois dur |
| Œil de verre | P | Bille de fronde | Verre |
| Stimulateur cardiaque | R | « Il a continué à battre après lui. » | Pile au lithium de dix ans |
| Appareil auditif | C | — | Microbatterie |
| Couverture de survie | C | Abri, réflecteur, signal | Mylar |
| Boîte de 50 masques chirurgicaux | C | Masque contre la fumée (Book 05) | — |
| Gants en latex | C | — | Latex |
| Appareil respiratoire de nuit | P | — | Moteur, tuyau |
| Bouteille d'oxygène médical | R | **Attise une forge à 1 500 °C** (dangereux) | Bouteille sous pression |
| Pilulier de la semaine | C | Ranger les graines, les hameçons | — |
| Vitamines | C | Évite le scorbut | — |
| Défibrillateur public | P | — | ⚡ Batterie, condensateur haute tension : **clôture électrique** |
| Squelette de salle de classe | P | Épouvantail | Os en plastique |

##### 👕 Vêtements et accessoires (28)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Doudoune | C | Couche isolante (Book 12) | Duvet |
| Imperméable | C | Couche de pluie | — |
| Bottes en caoutchouc | C | Jambières étanches | Caoutchouc |
| Chaussures de randonnée | P | Marcher loin | Semelles |
| Escarpins à talons aiguilles | C | Le talon fait un pic d'urgence | — |
| Baskets lumineuses | C | Une signature lumineuse à chaque pas | LED, pile |
| Ceinture en cuir | C | Sangle, cuir à affûter | Cuir, boucle |
| Jean | C | — | Toile solide (sac), rivets |
| Costume trois pièces | C | — | Laine |
| Robe de mariée | P | — | Tulle : **filet de pêche**, moustiquaire |
| Collants | C | Filtre, filet | Nylon |
| Soutien-gorge à armatures | C | — | Armatures : ressorts, hameçons |
| Bonnet de laine | C | Chaleur | Laine (fil) |
| Écharpe épaisse | C | **Col anti-morsure** (Book 12 §4) | — |
| Gants de jardin en cuir | C | Gants | Cuir |
| Tablier de boucher en cotte de mailles | R | **Excellente protection** du torse | Anneaux d'inox |
| Sac à main de luxe | P | Contenant chic | Cuir |
| Montre de luxe automatique | R | Donne l'heure sans pile | Mouvement |
| Parapluie | C | Abri | Baleines : flèches, broches, hameçons |
| Bijoux en or | P | — | Or : contacts électriques (⚡) |
| Valise à roulettes | C | Contenant à roulettes | Roues |
| Combinaison de ski | P | Couche chaude | — |
| Poncho | C | Pluie | — |
| Tenue de pompier | R | Protection, résiste au feu (Book 12) | — |
| Sabots en mousse troués | C | « Mode tout-terrain » enclenché | Mousse |
| Alliance gravée « Pour toujours » | C | — | Or |
| Chapeau de cow-boy | C | — | Feutre |
| Lunettes connectées | C | Affichent encore « Aucun réseau » | Microbatterie, caméra |

##### 🐕 Animaux de compagnie (16)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Sac de 15 kg de croquettes | P | Appât, et repas de dernier recours | — |
| Laisse | C | Corde | — |
| Laisse à enrouleur | C | — | Ressort, 5 m de cordelette |
| Collier GPS pour chien | C | — | Pile, puce |
| Litière pour chat | C | Feuillées (Book 05) | **Argile** |
| Cage à oiseaux | C | Piège à oiseaux | Barreaux |
| Niche | C | Abri à poules | Bois |
| Arbre à chat | C | — | **Corde de sisal** |
| Gamelle inox | C | Gamelle | Inox |
| Distributeur automatique de croquettes | C | Distribue encore à 18 h pile : **leurre sonore à heure fixe** | Moteur, minuterie |
| Chatière électronique | C | — | Lecteur de puce |
| Jouet couineur | C | Leurre sonore | Couineur |
| Panier en osier | C | Panier | Osier |
| Manteau pour chien de luxe | C | — | Polaire |
| Sifflet à ultrasons | C | Les Éteints ne l'entendent pas. Les chiens, si | — |
| Aquarium pour tortue | C | Bac | Verre, lampe chauffante |

##### ⛺ Camping et randonnée (20)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Tente deux places | P | Abri | Arceaux, toile |
| Sac de couchage | P | Couchage | Isolant |
| Réchaud à gaz | P | Cuisson discrète | Cartouche |
| Couteau suisse | R | Couper 2, Visser 1, Scier le bois 1 | — |
| Pince multifonction | R | Serrer 1, Couper 2, Visser 1 | — |
| Gourde filtrante | R | **Eau potable sans bois** | Filtre |
| Pastilles de purification | P | Eau potable | — |
| Boussole | P | Orientation | Aiguille aimantée |
| Carte de randonnée | P | **Révèle des lieux** (Book 20) | Papier |
| Jumelles | P | Repérer au loin | Lentilles |
| Hachette | P | Fendre 2 | Tête d'acier |
| Pelle pliante | P | Creuser 2 | — |
| Paracorde de 30 m | P | La meilleure corde | 7 brins intérieurs : ficelle |
| Sachet de 100 bougies chauffe-plat | C | Lumière, petit réchaud | Cire, coupelles d'alu |
| Allumettes tempête | P | Allumage | — |
| Sifflet | C | Signal, leurre | — |
| Popote en alu | C | Cuisson | Alu |
| Hamac à moustiquaire | P | Hamac | Toile, filet |
| Kit de survie premium | C | Couteau en plastique doré, bougie parfumée, guide de méditation (Book 15) | Presque rien : un trophée |
| Bâtons de marche | C | — | Tubes : lance |

##### 🏢 Bureau, commerce et administration (27)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Agrafeuse | C | — | Ressort, agrafes |
| Boîte de trombones | C | — | **Hameçons**, crochets |
| Classeurs | C | — | Anneaux d'acier |
| Ramette de papier | C | Carnet, allume-feu | — |
| Chaise de bureau à roulettes | C | — | Vérin à gaz, roulettes |
| Fontaine à eau et sa bonbonne de 19 L | P | **Eau potable scellée** | Bonbonne |
| Distributeur automatique de chips | P | Contient encore 40 paquets | Spirales, monnayeur, compresseur |
| Caisse enregistreuse | C | — | Pièces de monnaie |
| Bocal de pièces de monnaie | C | — | Cuivre, zinc, nickel : lests, **électrodes de pile** |
| Liasse de billets de banque | C | Le feu le plus cher du monde : 5 000 € pour 30 secondes de flamme | Papier |
| Carte bancaire platine | C | Racloir, ouvre-porte | Plastique, puce |
| Coffre-fort de bureau | P | Rangement inviolable | Acier épais |
| Badge d'accès | C | — | Puce |
| Tampon encreur des Compteurs | P | Les Compteurs le veulent absolument (Book 15) | — |
| Tableau blanc | C | — | Tôle émaillée |
| Rétroprojecteur | P | — | **Lentille de Fresnel : four solaire à 600 °C** |
| Destructeur de documents | C | — | Moteur, lames ; ses confettis font une litière isolante |
| Mug « Meilleur patron du monde » | C | Il ne l'était pas | Céramique |
| Mug « Le lundi, c'est nul » | C | Il n'y a plus de lundi | Céramique |
| Lettre de licenciement signée par un algorithme | C | — | Allume-feu |
| Trophée d'employé du mois | C | Trophée | Laiton |
| Plante de bureau morte | C | — | Pot |
| Vidéoprojecteur | P | — | Lentille, ampoule puissante |
| Machine à café de bureau | C | — | Pompe, résistance |
| Panneau « Sortie de secours » lumineux | C | — | Batterie, LED |
| Extincteur | P | Éteindre un incendie | Bouteille d'acier sous pression |
| Coussin de méditation d'entreprise | C | « Respirez. Vous êtes en sécurité. » | Sarrasin : graines |

##### 🔮 Bien-être, ésotérisme et religion (20)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Bol chantant | P | **Leurre sonore** qui résonne longtemps | Bronze |
| Boîte d'encens | C | Masquer son odeur, allume-feu lent | — |
| Collection de pierres « énergétiques » | C | « Rééquilibre vos ondes. » Projectiles de fronde | **Quartz** : étincelles au briquet à silex |
| Lampe de sel de l'Himalaya | C | — | **500 g de sel** : conservation |
| Attrape-rêves | C | — | Filet, plumes, cerceau |
| Tapis de yoga | C | **Isolant de sol** | Mousse |
| Ballon de gym | C | — | Caoutchouc |
| Casque en aluminium anti-ondes | P | Le PNJ des ondes en porte un (Book 15 §2.5) | Aluminium |
| Statue de Bouddha en résine | C | Contrepoids | Résine |
| Cierges d'église | P | **Lumière longue durée** | Cire |
| Cloche d'église | L | **Leurre sonore** entendu à des kilomètres | Bronze |
| Bénitier | R | Récipient de pierre | Pierre |
| Chapelet | C | — | Perles, fil |
| Jeu de tarot divinatoire | C | Toujours la même carte : la Tour | Carton |
| Kit de jeûne détox | C | Le seul régime que la Grande Panne a rendu obligatoire | — |
| Talisman anti-zombie vendu en ligne | C | Efficace à 0 % | Ficelle |
| Bouteille d'« eau dynamisée » | C | De l'eau potable en bouteille, au moins | — |
| Diffuseur d'huiles essentielles | C | — | Pastille ultrasonique, réservoir |
| Pendule de radiesthésie | C | Trouve l'eau… parfois | Lest |
| Livre « Manifestez votre abondance » | C | C'est raté | Papier |

##### 💸 Absurdités des riches (25)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Toilettes japonaises chauffantes | P | — | Résistance, pompe, gicleur |
| Cave à vin connectée | P | — | **Modules Peltier** (⚡ froid, ou un peu de courant) |
| Cave à cigares | P | Boîte hermétique | Bois de cèdre |
| Boîte de cigares | P | Monnaie | — |
| Lingot d'or | R | Ne nourrit personne. Lest de pêche de luxe | Or |
| Statue en or d'un chat | R | — | Or |
| Yacht échoué | L | Abri, ancre | **Voile** : bâche géante, moulin à vent (⚙️) |
| Jacuzzi | R | Citerne de 1 500 L | Pompe, chauffage |
| Sauna | R | — | **Poêle de sauna** (🔥) |
| Jet-ski | R | — | Moteur, coque |
| Épave d'hélicoptère privé | L | — | Turbine, aluminium aéronautique |
| Voiturette de golf électrique | R | ⚡ Transport | **6 batteries de 6 V** |
| Fontaine à champagne | P | — | Pompe |
| Majordome robot | R | Vous suit en répétant « Monsieur ? » | Moteurs, batterie |
| Capsule de cryogénie occupée | L | « Réveil prévu en 2140. Un léger retard est à prévoir. » | Isolant, compresseur |
| Tableau « Carré blanc n° 4 » | R | Il valait 12 millions | Toile, châssis |
| NFT imprimé et encadré | C | Le certificat d'une image qu'on ne peut plus voir | Cadre |
| Coffret de couteaux japonais | R | **Couper 3** | Acier de grande qualité |
| Trottinette plaquée or | R | — | Roues, plaqué |
| Chaise de designer à 4 000 € | P | Bois de chauffage griffé | Bois |
| Bouteille d'eau des glaciers à 80 € | P | Eau potable | Verre |
| Robot de cuisine qui pense pour vous | P | Il ne pense plus | Moteur, balance, résistance |
| Bunker de luxe (porte blindée seule) | L | Porte inviolable | Acier |
| Combinaison de survie de milliardaire, jamais portée | R | Couche chaude, étanche | Membrane technique |
| Montre à 200 000 € | R | Aussi précise qu'une à 20 € | Mouvement |

##### ☠️ Humour noir (20)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Urne funéraire | P | — | Les cendres donnent de la **potasse** (savon). Personne n'aime en parler |
| Cercueil en chêne | R | Couchage très au calme | Planches de chêne, poignées de laiton |
| Couronne mortuaire | C | — | Fil de fer |
| Plaque « À notre regretté » | C | Pierre plate : enclume de fortune | Pierre |
| Perche à selfie (encore tenue) | C | **Lance** télescopique avec un couteau | Tube |
| Mug « Je survivrai » | C | Il n'a pas survécu | Céramique |
| Pancarte « Les zombies, ça n'existe pas » | C | — | Planche, manche |
| Carnet « Jour 1 de mon défi survie » | P | S'arrête au jour 3 | Un peu de savoir, papier |
| Capsule temporelle d'école | P | « Chers enfants du futur, avez-vous des voitures volantes ? » | Contenu tiré au hasard |
| Panneau « Retour dans 5 minutes » | C | — | Carton |
| Livre « Comment devenir riche sans rien faire » | C | La méthode a fonctionné jusqu'à la Grande Panne | Papier |
| Tasse « Pas avant mon café » | C | Il n'y a plus de café | Céramique |
| Avis de passage du livreur | C | « Vous étiez absent. » | Papier |
| Plaque « Attention chien méchant » | C | Le chien est parti | Tôle |
| Collier de dents de requin souvenir | C | — | Dents : pointes de flèche minuscules |
| Panneau « Ville fleurie, 4 fleurs » | C | — | Tôle |
| Brochure « Votre avenir dans l'assurance-vie » | C | — | Allume-feu |
| Selfie encadré devant un coucher de soleil | C | Le dernier selfie de l'Abondance | Cadre, verre |
| Kit « Mon premier abri antiatomique » | R | Pour la mauvaise apocalypse | Bâche, filtre, rations |
| Gâteau d'anniversaire en résine (vitrine de pâtissier) | C | Ne se mange pas, même affamé | Résine |

##### 🎵 Musique (15)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Guitare acoustique | P | Moral (Book 16) | Cordes : collets, ligne de pêche |
| Guitare électrique et ampli | P | ⚡ L'ampli fait une sirène | Haut-parleur, cordes |
| Batterie (instrument) | P | Leurre sonore | **Cymbales** : gongs d'alarme, réflecteurs |
| Harmonica | C | Moral | — |
| Flûte à bec | C | Le pire leurre du monde | Tube |
| Triangle | C | Alarme | Acier |
| Violon | P | — | Cordes, **colophane** (résine) |
| Accordéon | P | — | **Soufflet** de forge (🔥) |
| Trompette | P | Appel à longue distance | Laiton |
| Mégaphone | P | ⚡ Appel, leurre | Haut-parleur |
| Platines de DJ | C | — | Moteurs lents |
| Métronome mécanique | C | **Leurre sonore à ressort** | Ressort |
| Partitions | C | — | Papier |
| Boîte à musique | C | Leurre doux | Ressort, peigne d'acier |
| Diapason | C | Accorder | Acier |

##### 🚔 Sécurité et armes (16)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Matraque télescopique | R | Arme | Acier |
| Bombe lacrymogène | P | Sans effet sur les Éteints : ils ne pleurent plus | Aérosol |
| Pistolet à impulsion électrique | R | ⚡ Arme | Condensateur, batterie |
| Gilet pare-balles | R | Protège le torse, lourd | Kevlar : tissu ultra-solide |
| Casque de maintien de l'ordre | R | Casque à visière | — |
| Bouclier anti-émeute | R | Bouclier | Polycarbonate |
| Fusil de chasse sans munitions | R | 🔥 Book 11 | Canon, mécanisme |
| Boîte de cartouches de chasse | R | — | Plomb, poudre |
| Arbalète de loisir | R | ⚙️ Arme silencieuse | Arc d'acier, câble |
| Machette | P | Couper 2, arme | Lame |
| Hache d'incendie | R | Fendre 3, arme | Tête d'acier |
| Alarme de voiture | C | Leurre | Sirène |
| Cadenas et chaîne | C | Fermer un coffre | Chaîne |
| Fusée de détresse | R | **Leurre lumineux puissant**, allumer un feu | — |
| Gilet de vigile « SÉCURITÉ » | C | Il ne l'était plus | Tissu |
| Menottes de police | P | — | Acier |

##### 🍂 Trouvailles de la nature (22)

| Objet | R | Usage direct | Se démonte en, sert à |
|---|---|---|---|
| Amadouvier (champignon du bouleau) | P | **Amadou** : garde une braise, prend l'étincelle | — |
| Silex | P | Étincelle avec de l'acier, éclat tranchant | — |
| Galet de grès | C | Pierre à aiguiser | — |
| Galets plats | C | Pierres de foyer, projectiles | — |
| Bois de cerf tombé | P | Manche, poinçon, crochet | Corne |
| Plume de corbeau | C | Empennage | — |
| Crâne de sanglier | P | Décoration de terrain, inquiétant | Dents |
| Nid d'oiseau abandonné | C | Allume-feu | — |
| Nid de guêpes vide | C | Allume-feu : du vrai papier | — |
| Pommes de pin | C | Allume-feu, combustible | Graines (pignons) |
| Bois flotté | C | — | Bois sec |
| Branche de sureau | C | **Tube** : sarbacane, souffleur de feu | Moelle |
| Écorce de tilleul | C | **Liber** : la meilleure corde végétale | Fibres |
| Ronce | C | Haie défensive | Épines : petits hameçons |
| Bambou échappé d'un jardin | P | Tubes, canne, lance | — |
| Cire d'abeille sauvage | R | Étanchéité, bougie | — |
| Coquilles d'escargots | C | — | Calcium (poules) |
| Mue de serpent | P | Curiosité de collection | — |
| Morceau de bois pétrifié | R | Trophée | Pierre dure |
| Gui | C | — | Glu (piège à oiseaux) |
| Châtaignes | C | Nourriture (en saison) | Farine |
| Ortie | C | Soupe | **Fibres** (rouissage, Book 02 §4) |

#### 4. Ce qu'il faudra trancher

- **Le nombre** : environ 600 objets (615 au compte exact), c'est trop pour la phase 0a. On pourrait en choisir **une trentaine**, par exemple ceux qui servent tout de suite aux recettes de P-002 (bouteille plastique, boîte de conserve, fil dentaire, préservatif, chambre à air), plus une poignée d'absurdes pour le ton.
- **Les modèles 3D** : chaque objet visible demande un modèle et une icône (Book 21 §5). Les objets rares pourraient n'avoir qu'une icône et rester dans le sac.
- **La décharge de P-001** : la colonne R donne directement un tableau de tirage.
- **Le ton** : à relire ensemble, objet par objet pour les plus crus (intimité, humour noir), afin de rester dans la satire du Book 15 sans tomber dans la cruauté.
- **Les noms de pop culture** : parodies uniquement, pas de marque ni de personne réelle.

### P-004 — Anomalie : en tapant vite, le coup recommence à zéro
- **Date** : 2026-10-08
- **Source** : retour de test (combat)
- **Constat** : en appuyant plusieurs fois très vite sur Frapper, le geste du personnage repart de zéro à chaque appui, et on entend plusieurs coups. Ça ressemble à une faille pour battre les Éteints plus vite.
- **Ce qu'il faut** : **un coup va jusqu'au bout**. Tant que le geste n'est pas fini, un nouvel appui ne relance ni l'animation, ni le son, ni le coup.
- **Ce que montre le code** (lecture seule, rien n'a été modifié) :
  - Le **serveur** a déjà un délai entre deux coups (`serveur/src/joueur.ts`, `frapper()` : 450 ms pour un coup simple, 700 ms pour un coup appuyé). Les appuis en trop sont ignorés : les dégâts ne sont sans doute **pas** multipliés.
  - Le **client**, lui, ne respecte pas ce délai : à chaque appui, `client/src/main.ts` (≈ ligne 899) envoie le message, joue le son (`bruiteur.frappe`) et relance l'animation (`personnage.frapper` → `lancer()`, qui fait `reset().play()`). D'où le geste remis à zéro et les coups entendus en double.
  - La faille est donc surtout **apparente**. Mais le joueur croit qu'elle marche, et rien ne garantit que la durée de l'animation (vitesse ×1,6) soit la même que le délai du serveur.
- **Correction proposée** :
  1. Côté client, ignorer l'appui (pas de son, pas d'animation, pas d'envoi) tant que le coup précédent n'est pas fini. On peut éventuellement **mémoriser un seul appui** pour l'enchaîner à la fin du geste, ce qui donne un combat fluide sans marteler la touche.
  2. Caler le délai du serveur sur la durée réelle du geste, par arme : une hache est plus lente qu'un couteau.
  3. Un test : dix appuis en 1 seconde donnent au plus deux ou trois coups, et un seul son par coup.
- **Books concernés** : 08-plateforme-commandes-financement (§3.3 commandes de combat), 06-zombies (§8 combat)
- **Statut** : ✅ corrigée (0.2, 2026-10-08 ; Book 08 §3.3). Un coup va jusqu'au bout, un seul appui est gardé et joué à la fin du geste, chaque arme a la durée de son geste (le serveur la respecte, 80 ms de tolérance). Testé : dix appuis en une seconde à la hache donnent deux coups.

### P-005 — Choisir son arme pour le mode Combat
- **Date** : 2026-10-08
- **Source** : retour de test (combat)
- **Idée** : pouvoir **équiper une arme** depuis le sac. C'est elle qu'on a en main dès qu'on passe en mode Combat.
- **Aujourd'hui** : le jeu choisit seul « la meilleure arme du sac » (`commun/src/combat.ts`, `meilleureArme()`, dans l'ordre fixe : hache, marteau, barre de métal, lame forgée, gourdin, couteau aiguisé, couteau, poings). Le joueur ne choisit rien.
- **Pourquoi c'est intéressant** :
  - Un choix tactique : le couteau est léger et discret, la barre de métal a plus d'allonge, la hache tue à la tête mais **s'use** et sert aussi à abattre.
  - On garde sa bonne hache pour le bois et on se bat avec le gourdin.
  - Ça prépare les emplacements d'accès rapide (ceinture, holster, Book 12 §2.1) et les armes de P-002 et P-003 (épieu, batte, pied-de-biche…).
- **Proposition** :
  - Dans le sac, une action **« Équiper pour le combat »** sur tout objet qui est une arme. Une petite icône d'arme sur l'objet équipé.
  - En mode Combat, c'est l'arme équipée qui sert. Si on l'a perdue (jetée, vendue, cassée, tombée avec le sac à l'effondrement), on revient à la meilleure arme du sac, avec un message.
  - Sans arme équipée, la règle actuelle reste : la meilleure du sac.
  - L'arme équipée se voit dans la main du personnage, et ce choix est gardé d'une session à l'autre.
- **Books concernés** : 08-plateforme-commandes-financement (§3 emplacements rapides), 12-portage-vetements-protections (§2.1), 06-zombies (§8)
- **Statut** : ✅ retenue et faite (0.2, 2026-10-08 ; Book 08 §3.3). « Équiper pour le combat » dans le sac, ⚔ sur l'arme équipée, choix gardé d'une session à l'autre, retour à la meilleure arme du sac (avec un message) si on l'a perdue. Les emplacements rapides viendront plus tard.

<!-- Modèle d'une entrée :

### P-001 — Titre court de l'idée
- **Date** : AAAA-MM-JJ
- **Source** : qui l'a proposée / dans quel contexte du test
- **Idée** : ce qui est proposé, en quelques phrases.
- **Pourquoi c'est intéressant** : le problème ressenti ou ce que ça apporte.
- **Books concernés** : ex. 02-crafting, 13-meteo
- **Statut** : 🆕 à étudier

-->
