# Book 21 — Périmètre de la phase 0

> Document de conception · version 0.2 · 2026-10-07
> Statut : **validé dans ses grandes lignes**, à détailler au démarrage du développement.
> C'est le **cahier des charges** du passage de la conception au développement. Il s'appuie sur tous les autres books ; en cas de doute, ce book dit **ce qui est construit maintenant**, les autres disent **comment c'est censé marcher**.

---

## 1. Principes

1. **Deux étapes (validé).** La **phase 0a** est une **tranche verticale** : la boucle d'une session, complète et polie. La **phase 0b** ajoute **le premier hiver** : la boucle d'une année.
2. **Petit, mais fini.** Mieux vaut peu de systèmes, entièrement jouables et beaux, que beaucoup de systèmes à moitié faits.
3. **Rien de jetable.** Tout ce qui est produit (code, données, modèles 3D, musique, sons) doit resservir dans le jeu complet.
4. **Les graphismes et la musique sont la vitrine (exigence du porteur du projet).** La phase 0a doit donner envie : à la famille qui teste, à l'équipe qui se forme, aux personnes à convaincre. **Ces deux domaines sont traités avec un soin particulier** (§5 et §6), au même rang que le jeu lui-même.
5. **Claude produit (validé).** Le code, les modèles 3D, les textures, la musique et les sons de la phase 0 sont produits par Claude, sous la direction du porteur du projet. Les méthodes de production en découlent (§5.7, §6.5.1).
6. **Mesurer dès le premier jour** (Book 17 §6) : le test familial sert aussi à récolter des données d'équilibrage.
7. **Aucun élément lié à l'argent réel** (Book 08 §1).

---

## 2. Les deux étapes

| | **Phase 0a : la tranche verticale** | **Phase 0b : le premier hiver** |
|---|---|---|
| **Ce qu'on teste** | La boucle d'une session : ramasser → fabriquer → s'abriter → affronter un Éteint → passer la nuit → aller au comptoir → gagner des wotts → revenir | La boucle d'une année : produire → stocker → préparer l'hiver → le passer |
| **Durée du test** | ≈ 2 semaines réelles | ≈ 4 semaines réelles (une année de jeu) |
| **Saisons** | **Fixe** (fin de printemps) | Les quatre saisons |
| **Joueurs** | Famille et proches : ≈ 5 à 20 (Book 17 §5.2) | Idem |
| **Combat entre joueurs** | **Désactivé** partout (validé) | Désactivé, sauf décision contraire après la 0a |
| **Appareil de référence** | **iPhone 13** (le plus ancien de la famille, validé) : il fixe le plancher de performance | Idem |
| **Critère de fin** | §3.1 | §8.2 |

---

## 2 bis. Ce que le test doit nous apprendre

La phase 0 ne cherche pas à tout faire. Elle doit répondre à six questions :

| # | Question | Comment on le saura | Étape |
|---|---|---|---|
| 1 | **La boucle de base est-elle amusante ?** Ramasser → fabriquer → s'abriter → sortir → revenir | Les testeurs reviennent jouer d'eux-mêmes ; retours qualitatifs | 0a |
| 2 | **Les trois familles sont-elles différentes et équilibrées ?** | Mesures de progression par famille (Book 17 §6), préférence des testeurs | 0a, 0b |
| 3 | **La signature et les Éteints créent-ils la bonne tension ?** Ni trop faciles, ni frustrants | Causes d'effondrement (Book 06 §12), ressenti | 0a |
| 4 | **L'énergie en Wh est-elle compréhensible et intéressante ?** | Les testeurs savent expliquer ce que coûte une chose | 0a |
| 5 | **Les graphismes et la musique donnent-ils envie ?** | Critères des §5.4.4 et §6.5.4, réaction des testeurs et de l'équipe | 0a |
| 6 | **La technique tient-elle ?** Navigateur, iPhone 13, Raspberry Pi | Performances, plantages, latence | 0a |

---

## 3. Phase 0a : ce qui est construit

### 3.1 Le critère de fin

**La phase 0a est prête quand un joueur, quelle que soit sa famille, peut :**

1. faire les **12 étapes du tutoriel** (Book 14 §4.2), de l'arrivée sur son terrain au premier voyage ;
2. traverser la **halte**, y fouiller un vestige, en revenir ;
3. **vendre** au comptoir, **déposer** de l'électricité et repartir avec des wotts ;
4. se déconnecter et retrouver, à la reconnexion, une base qui a **produit et consommé** pendant son absence (Book 01 §2 bis) ;
5. le tout **sur ordinateur et sur iPhone 13**, avec les graphismes et la musique au niveau décrit aux §5 et §6.

### 3.2 Le monde

| Élément | Phase 0a | Référence |
|---|---|---|
| **Terrain** | Un par joueur, grille de 50 × 50 m, **une seule topologie** (prairie, bois mort, ruine de ferme avec le vieux vélo) | Book 19 |
| **Carte du monde** | Trois destinations sur la route de la Campagne : son terrain, la halte, le comptoir. Le reste de la carte (Book 20) est visible mais fermé. | Book 01 §2 bis, Book 20 |
| **Halte** | **La station-service** (route de la Campagne, Book 20 §4). En 0a, elle sert à la fois de halte à traverser et de **ruine proche** : vestiges qui se régénèrent lentement, Éteints dormants, et un petit panneau solaire à récupérer (simplification : en jeu complet, les panneaux viennent de la ferme solaire) | Book 01 §2 bis, Book 20 |
| **Comptoir** | **Le Comptoir du Carrefour**, tenu par les Compteurs | Book 07 §4, Book 20 §4 |
| **Instances** | Une seule par lieu (10 joueurs au plus suffisent) | Book 01 §2 bis |
| **Rencontres** | On croise les autres joueurs à la halte et au comptoir et on peut **échanger** : une fenêtre où chacun pose ses objets (et ses wotts) puis dit s'il est d'accord. **Pas de chat en 0a** (validé, 2026-10-07). Pas de combat, donc pas de pillage : un sac tombé à l'effondrement n'est récupérable que par son propriétaire. | Book 01 §6 bis, Book 07 §5 |

### 3.3 Les familles

Les trois familles, avec leurs stats (Book 01 §4). Les traits sont gardés quand leur système existe en 0a :

| Famille | Gardés en 0a | Reportés (leur système attend) |
|---|---|---|
| 🔥 **Charbonniers** | *Maîtres du feu* (installations thermiques +30 %), *Feu bavard* (signature +50 %) | *Peau tannée* (pas de froid au printemps), *Poumons de suie* (jauge reportée) |
| ⚡ **Voltaïques** | *Courant propre*, *Œil de récupérateur*, *Dépendance aux pièces* (usure des batteries), *Habitués aux machines* | — |
| ⚙️ **Mécanistes** | *Rendement musculaire*, *Robustesse simple*, *Gros mangeurs* | *Tradition orale* (pas encore de livres) |

> Le budget de points des Charbonniers est un peu déséquilibré en 0a (deux traits reportés). C'est sans gravité pour un test familial, mais à noter dans l'analyse des mesures.

**Comment chaque famille gagne des wotts en 0a :**

| Famille | Création de wotts (dépôt de Wh_é) | Vente au comptoir |
|---|---|---|
| ⚡ | Petit panneau solaire trouvé à la halte, batterie de voiture | Composants, réparations |
| ⚙️ | Pédalier + dynamo (vieux vélo) qui charge une batterie | Bois, travail aux machines du comptoir |
| 🔥 | **Aucune en 0a** : la machine à vapeur est de palier III | Lames forgées, charbon de bois |

> C'est conforme aux règles (Book 01 §6) et utile à observer : les Charbonniers vivent-ils bien de la vente seule pendant deux semaines ?

### 3.4 Les objets (≈ 40)

| Catégorie | Objets | Origine |
|---|---|---|
| **Ressources** (6) | Bois sec, branches, pierre, eau brute, eau potable, **joncs** (fibres, au bord de la mare) | Terrain ; eau potable par ébullition |
| **Vestiges** (7) | Vieux vélo, outils rouillés, batterie de voiture, ressort à lames, bâche, barre de métal, **petit panneau solaire** | Terrain (ferme) et halte |
| **Kit commun** (4) | Couteau abîmé, briquet, gourde, sac à dos | Départ (Book 02 §14) |
| **Kits de famille** (6) | 🔥 pierre à feu, marteau · ⚡ lampe à dynamo, petite batterie · ⚙️ scie à bois, corde | Départ |
| **Lumières portées** (3) | 🔥 torche, ⚡ lampe frontale, ⚙️ lanterne à dynamo | Kit de famille : elles font la nuit et la silhouette des personnages (§5.2.1, Book 18 §4.2) |
| **Outils fabriqués** (2) | Hache remmanchée, lame de couteau forgée (🔥) | Tutoriel, forge |
| **Installations** (8) | Feu de camp, établi, abri de branches et bâche, **coffre de rangement**, **foyer de forge** (🔥), **charbonnière** (🔥), **pédalier générateur + meule + dynamo** (⚙️), **banc solaire + lampe** (⚡) | Construites sur le terrain |
| **Produits** (2) | Charbon de bois, batterie chargée | Charbonnière, recharge |
| **Nourriture et soins** (3) | Conserve (vestige), baies (cueillette sur le terrain), pansement | Fouille, cueillette, fabrication |
| **Monnaie** (1) | Bons de wotts | Comptoir |

> **Décision (2026-10-08) : ranger et jeter.** Le **coffre de rangement** (recette commune : 4 bûches, 4 branches, 1 corde ; couper 1, marteler 1) tient **150 kg** ; on y range et on en reprend un objet ou toute la pile, la charge des batteries suit. On peut aussi **jeter un objet par terre** depuis le sac (quand il est trop lourd) : il forme un petit tas que **n'importe qui peut ramasser** (sur son terrain ou à la halte ; pas au Comptoir). On ne jette pas son sac à dos. **Un tas jeté ne disparaît jamais** : il reste tant que personne ne le ramasse (validé, 2026-10-08).

> **Décision (2026-10-08) : la fabrication est condensée.** À l'écran, une fabrication dure **un vingtième de son temps de travail, 2 s au moins** : l'abri se monte en **3 s**, l'établi et la forge en 4,5 s, une corde en 2 s. Le temps de travail (en minutes de jeu) reste celui qui fait l'**énergie grise** et les prix : rien ne change dans l'économie.

> **Décision (2026-10-08) : la corde se tresse.** Des **joncs et des massettes** poussent au bord de la mare (ils repoussent en 30 min) : on y coupe des **fibres** au couteau, et **4 fibres** se tressent à la main en **une corde** (recette commune, 20 min, sans outil). C'est le geste de base du bushcraft ; le rouissage du Book 02 §4 viendra avec le lin et l'ortie. Toutes les familles peuvent donc fabriquer leur coffre dès le début.

> Chaque famille a **une chaîne-vitrine** complète : 🔥 bois → charbonnière → forge → lame vendue au comptoir ; ⚙️ vieux vélo → pédalier → meule et dynamo → batterie chargée ; ⚡ panneau de la halte → banc solaire → lampe la nuit, et batterie déposée au comptoir.

**Règles simplifiées en 0a :** les recettes de la famille sont **connues d'emblée** (pas de livres ni d'expérimentation) ; **pas de qualité ★** (tout est ★★★) ; les qualités d'outil du Book 03 §4 s'appliquent.

### 3.5 Les Éteints

| Élément | Phase 0a | Référence |
|---|---|---|
| **Type** | L'Errant seulement, sans variantes | Book 06 §5 |
| **États** | Dormant, Errant, Attiré, Poursuivant | Book 06 §4 |
| **Perception** | Signature sonore, olfactive et lumineuse ; attention = intensité × durée | Book 06 §3 |
| **Combat** | Corps à corps, viser la tête, endurance, **saisie et dégagement** | Book 06 §8, Book 08 §3 |
| **Morsure** | Plaie très souillée, sans infection ni fièvre grise en 0a | Book 06 §10 |
| **Sang (validé)** | **Un peu plus marqué que la moyenne** : éclaboussures et traces **rouges**, au sol et sur les vêtements. **Aucune plaie visible**, aucun démembrement. | §5.2.6 |
| **Sur le terrain** | Quelques errants attirés par la signature ; **pas de siège hors ligne** | Book 06 §9 |

### 3.6 Le temps et la santé

| Élément | Phase 0a |
|---|---|
| **Horloge d'action** | Oui : jour + nuit = 24 min réelles (Book 01 §2 bis) |
| **Calendrier** | Il tourne pour la production de la base et les processus passifs, mais **la saison reste fixée** |
| **Hors ligne** | Règles du Book 01 §2 bis pour ce qui existe en 0a (besoins gelés, base qui produit et consomme, batteries qui se déchargent) |
| **Besoins** | Faim, soif, sommeil (Book 05 §3) |
| **Blessures** | Coupure, contusion, morsure, saignement ; **effondrement** (Book 05 §10) |
| **Météo** | Beau temps et pluie seulement, à l'horloge d'action (la pluie atténue la signature) |

### 3.7 L'économie

| Élément | Phase 0a | Référence |
|---|---|---|
| **Bons de wotts** | Oui, avec décharge (≈ 2 % par semaine) | Book 07 §3 |
| **Dépôt et retrait de Wh_é** | Oui : seul le dépôt crée des wotts ; le poids des batteries limite le transport | Book 07 §3.1, §3.5 |
| **Achat et vente au comptoir** | Oui, **à prix fixes** (prix de base), fourchette ≈ 20 %, prix plancher | Book 07 §4 |
| **Trésorerie** | Dotation de départ et réserve plancher | Book 07 §3.6 |
| **Échange entre joueurs** | Oui, fenêtre sécurisée | Book 07 §5 |
| **Pédalage au comptoir** | Oui, payé sur la trésorerie | Book 07 §3.1 |

### 3.8 L'interface et les commandes

- **Commandes :** deux boutons + modes (Book 08 §3), clavier et souris, manette, tactile.
- **Écran de jeu :** jauges, wotts, heure, cercle de signature (Book 18 §3).
- **Inventaire** avec poids (Book 12), **écran de recette** (Book 02 §13), **carte du monde**, **carnet** réduit aux objectifs (Book 14 §4.3).
- **Tutoriel** complet (Book 14 §4.2).
- Habillage d'interface par famille : voir §5.

### 3.9 Les étapes de construction

Chaque étape produit quelque chose de **jouable** et de **testable**. Elles avancent en parallèle des jalons graphiques (§5.4.3) et musicaux (§6.5.3).

| Étape | Contenu | On peut… |
|---|---|---|
| **É0 — Socle technique** | Client Three.js, serveur, base de données, connexion, un personnage sur un terrain, sauvegarde | Se connecter, bouger, revenir le lendemain et retrouver son personnage |
| **É1 — Survivre** | Ramassage, inventaire, feu, faim et soif, jour et nuit, deux horloges | Passer une nuit autour d'un feu (le moment-vitrine n° 1, §5.1.2) |
| **É2 — Fabriquer** | Recettes de la 0a, qualités d'outil, énergie grise, démontage, abri, installations des trois familles | Faire tourner sa chaîne de famille |
| **É3 — Sortir** | Carte réduite, halte, Éteints, signature, combat, effondrement | Partir à la station-service, fouiller, fuir, revenir |
| **É4 — Ensemble** | Plusieurs joueurs, échange, comptoir, wotts, production hors ligne | Commercer, déposer de l'électricité, se croiser à la halte |
| **É5 — Finitions** | Tutoriel, graphismes et musique au niveau vitrine, réglages, mesures | **Lancer le test familial** |

> **Réglages à chaud :** les valeurs (prix, durées, densité d'Éteints) sont des **données** (Book 03 §8). On les ajuste sans redéployer, avec un point d'étape par semaine pendant le test.
>
> **Fait (É5, lot 4, 2026-10-08)** : 15 réglages sont lus dans `donnees/reglages.json`, relus en 2 s, et envoyés aux joueurs connectés.
> - **Durées** : fabrication, gestes.
> - **Rythmes** : faim, soif, fatigue, repousse.
> - **Éteints** : nombre maximal, attirance, répit.
> - **Économie** : fourchette de prix, taux de dépôt, décharge des wotts.
> - **Divers** : poules, panneau solaire.
>
> Chaque réglage a des bornes : une valeur hors bornes est ramenée dedans, un fichier illisible est ignoré. `npm run reglages` donne la liste. **Le calendrier des récoltes tourne** (Book 13 §3 bis) alors que la saison reste fixée : seules les récoltes suivent la date.

### 3.10 La 0.8 : le niveau 1 (2026-10-10)

*Le détail est dans le plan `book/plans/plan-0.8.md` (v0.3, décidé), §1, §5 et §9 ; les chantiers 1 à 14 et 16 sont codés et fusionnés (branche `integration-0-8`) ; la version s'appelle 0.8 dans le jeu, sa ligne de `VERSIONS.md` est « en préparation ».*

**Ce que livre la 0.8** : la base grandit **avec les sorties**, de la maison jusqu'au **niveau 1**. Plus de paliers : chaque meuble monte d'un niveau avec **le niveau d'avant, des matériaux et un outil** ; les niveaux du niveau 1 demandent **une clé** trouvée dehors (Book 24 §12).

| Étape | Lieu | Ce que la 0.8 y met |
|---|---|---|
| **Maison** | Le terrain | Le niveau 1 de chaque meuble avec ce que donne le terrain ; la ruine complétée (bidon de 5 L, tête de marteau) ; 4 sacs plastique dans le premier sac-poubelle du chemin |
| **H1A** | La station-service | **La pièce de sa famille**, garantie et personnelle (⚡ panneau, 🔥 enclume de dépanneur et sac de charbon, ⚙️ petit alternateur) ; clous, fil de fer, huile ; le bois en vrac et le tas personnel |
| **H1B** | **Le Gué-aux-Saules** (nouveau) | La pierre en vrac et le banc de galets personnel, la glaise, les joncs ; le radier, la crue et le bac |
| **L1A** | La Coopérative du Plateau | Trois clés à place fixe : grillage, cocotte, seau de 10 L |
| **L1B** | **Le Moulin du Gué** (nouveau) | Trois clés à place fixe : toile de jute, feuillards, étau ; la fourche à foin, un if, 2 bûches ; 22 Éteints |

**Le parcours visé** : la maison (0 à 25 min, le tutoriel) ; la station dans le tutoriel (« La carte », puis « La famille » au retour) ; le gué ; puis la Coopérative ou le Moulin, au choix, et l'autre : **tout le niveau 1 en ≈ 3 h 20** pour un joueur prudent (la cible du plan, en cours d'arbitrage par le porteur). **Mesuré** (`npm run rythme`, chantier 14) : le joueur prudent atteint la station à 38 min, le gué à 85, la Coopérative vers 104 à 107, le Moulin vers 163 à 166 ; sa **dernière porte à clé** tombe à **209 à 212 min**, et **tout le niveau 1** (avec le reste de la maison et du métier) à **277 à 278 min**. Le joueur pressé : 110 à 125 min pour les portes, 141 à 179 min pour tout ; le malchanceux : 161 à 163 min, puis 219 à 254 min ; le vétéran sans tutoriel : 126 à 141 min, puis 191 à 196 min.

**Ce qui n'entre pas** : le niveau 2 tout entier (H2A, H2B, L2A, L2B et leurs clés, Raboter et Souder en usage, le mélange des routes) ; les Éteints évolués ; le relais d'armes, les munitions, les caractéristiques selon les ennemis ; le niveau 3 (trempe à l'huile, arbalète lourde…) ; Fendre et le bois vert ; le panneau Examiner détaillé. Ce que le code avait déjà au-delà du niveau 1 (forge ventilée, réserve couverte, four de terre, aiguillon, électrificateur…) devient **« plus tard »** : grisé dans la fiche, avec sa clé nommée, « à trouver plus loin ».

**La ligne de la version 0.8** (`code/VERSIONS.md`, « en préparation », dans la voix des versions précédentes) dit au joueur : la base grandit avec tes sorties ; « Tu y penses » ; la fiche d'un meuble devient son arbre ; ta famille t'attend à la station ; deux routes, à la même distance ; le Gué-aux-Saules ; le Moulin du Gué ; les armes évoluent sur leur meuble ; la fourche à foin ; le bois et la pierre reviennent ; le Comptoir et les clés du niveau 1 ; de nouveaux meubles ; les outils sont des portes ; les armes du niveau 1 ; l'aide suit ; tout le monde repart de zéro. Le jeu affiche « 0.8 » (`commun/src/version.ts`).

**Remise à zéro** (plan §9.1) : **tous les joueurs repartent de zéro** au déploiement de la 0.8. Pas de migration des personnages 0.7.3 ; le serveur démarre sur une base neuve.

**Le critère de fin de la 0.8** (plan §5, en bref) : seul, sur un serveur neuf, pour chaque famille :

1. finir le tutoriel en passant par la station, y trouver **sa** pièce, bâtir au retour son premier meuble de famille ;
2. bâtir **tout le niveau 1 de la maison** avec le seul terrain ;
3. au gué, creuser de la glaise, ramasser pierres et joncs ;
4. à la Coopérative et au Moulin, trouver les clés **à la première visite**, et bâtir au retour foyer de cuisine, marmite, récupérateur à seau, abri fermé, coffre cerclé, établi à étau ;
5. le niveau 1 en ≈ 3 h 20 (`npm run rythme`, cible en cours d'arbitrage ; mesuré : les portes à clé en 209 à 212 min, tout le niveau 1 en 277 à 278 min pour le prudent), avec 0 (⚡), 0 à 1 (⚙️) et 1 (🔥) aller-retour de ravitaillement à la station en plus du tutoriel (mesuré : 0 seul, 1 pour le malchanceux ⚙️ ou 🔥) ;
6. ne jamais trouver la station ni le gué vides de bois et de pierres plus de 30 min ;
7. au premier ramassage d'une clé, « Tu y penses » ; l'indice passe du type de lieu au coin ;
8. aucune arme fabriquée au-dessus de ★★ sans la maîtrise ; `npm run equilibre` OK à la maison et à H1/L1 ;
9. sur iPhone 13 mini, le gué et le Moulin tiennent le budget (≤ 60 000 triangles, ≤ 40 appels de dessin).

**La priorité au soin visuel** (§5) vaut pour tout ce que la 0.8 ajoute : les icônes des objets nouveaux, la carte à deux routes, les meubles du niveau 1, le gué et le Moulin tirés des modèles de la session « bâtiments », le bandeau « Tu y penses », l'avertissement de la bûche ; tout est lisible sur l'iPhone 13 mini (375 × 630 en vertical, 812 × 320 en paysage). **Une règle d'interface du porteur** : un message ou un avertissement en jeu **se ferme d'un bouton**, jamais une fenêtre à croix ; ce qu'on ouvre au bouton B (Examiner) se ferme par B ; les panneaux qu'on ouvre au toucher ou à la souris (sac, Fabriquer, carnet, carte) gardent leur croix ✕.

---

## 4. Phase 0a : ce qui attend

| Domaine | Reporté en 0b | Reporté après la phase 0 |
|---|---|---|
| **Monde** | Palissade du terrain | Lieux lointains, plusieurs comptoirs, hameaux, instances multiples, topologies variées, les six environnements de la carte (Book 20) |
| **Temps et météo** | Saisons, épisodes climatiques, hiver | Prévisions, tempêtes, crues |
| **Production** | Potager, conservation, cabane et chauffage, bûcher | Élevage, sidérurgie, chimie, distillation, machine à vapeur |
| **Éteints** | Gelés, Grégaire et Pressant, siège hors ligne | Variantes, hordes, Grand Dégel, fièvre grise |
| **Santé** | Infection, maladies simples | Médecine II–III |
| **Savoir** | — | Livres, expérimentation, domaines à trois niveaux, enseignement |
| **Économie** | — | Cours dynamiques, carnet d'ordres, commandes artisanales |
| **Joueurs** | Visites entre amis | Combat entre joueurs, pillage, cycle complet, classements |
| **Personnage** | — | Points libres, apparence détaillée (Book 14) |

---

## 5. Graphismes

**Principe directeur :** la 0a est **petite mais finie**. Peu d'assets, tous au niveau final ou presque. Mieux vaut **cinq moments parfaits** qu'un monde entier moyen. Et **rien n'est jetable** : chaque asset de la 0a est le premier élément d'une bibliothèque, pas une maquette.

---

### 5.1 L'objectif de qualité

#### 5.1.1 Ce qui doit faire « waouh »

| Levier | Pourquoi c'est notre signature |
|---|---|
| **La lumière de nuit** | C'est la mécanique centrale (Book 18 §2). Une nuit bleutée où **seul le feu éclaire** se comprend et se ressent sans un mot d'explication. |
| **Les trois familles** | Nadia, Malik et Rose doivent être **reconnaissables au premier regard**, et attachants. Ce sont les visages du projet. |
| **Le ton** | Une affiche de Watty corrigée au feutre (« Watty ment ! ») dit tout l'univers en une image. |
| **La matière** | Rouille, bois, bâche, fumée : un monde **sale mais net**, jamais flou ni bruité. |

> Test simple : **chaque moment-vitrine doit donner une capture d'écran utilisable telle quelle** comme image de présentation, sans retouche.

#### 5.1.2 Les cinq moments-vitrine (par ordre de priorité)

| # | Moment | Étape du tutoriel (Book 14 §4.2) | Ce qu'on doit voir |
|---|---|---|---|
| **1** | **La première nuit au feu de camp** | 10. La famille · 11. La nuit | Bascule du jour à la nuit américaine. Le feu orangé vacille, l'abri de bâche se découpe, la **lumière de famille** s'allume (forge rougeoyante, lampe blanc froid, lanterne jaune doux). Le **cercle de signature** grandit avec la lumière. Au loin, des silhouettes aux yeux blancs. |
| **2** | **Le premier feu et sa fumée** | 3. Le feu · 8. Le premier zombie | Flamme qui prend, **colonne de fumée visible de loin**, cercle de signature qui s'élargit. Un Errant **sort de la fumée**, bras tendus. Le joueur comprend « fumée = danger » par l'image. |
| **3** | **L'aube sur son terrain** | 1. Arrivée · 2. Ramasser | Lumière rasante dorée, brume basse, rosée, ombres longues. Le vieux vélo rouillé dans l'herbe. **C'est la première image du jeu** après le menu. |
| **4** | **Le Dormant de la station-service** | 12. La carte (lieu proche) | Intérieur sombre de la boutique, rayon de la lampe ou lueur de la torche, une silhouette affalée derrière le comptoir **ouvre des yeux blancs**. Affiches de Watty déchirées aux murs. |
| **5** | **L'arrivée au Comptoir du Carrefour** | 12. La carte (après le tutoriel) | Le **seul endroit du monde où brille une lumière électrique blanche** en continu : enseigne, guichet grillagé, cellules de batteries, tampons. L'ironie de Watty au-dessus du guichet des Compteurs. |

> **Le moment 1 est l'« image cible »** de tout le projet. Il est produit **en premier et jusqu'au bout** (§5.4.2) : il fixe la barre pour tout le reste.

---

### 5.2 La liste des assets de la 0a

**Priorités :** **V** = vitrine (niveau final, sur mesure ou fortement retravaillé) · **S** = soigné (libre retravaillé, cohérent) · **Si** = simple (libre normalisé, peu retouché).
**Source :** **Mesure** = fait pour le jeu · **Libre** = modèle libre de droits (Book 18 §4.2), **toujours normalisé** (§5.3.6) · **Libre+** = base libre fortement retouchée.

#### 5.2.1 Personnages et Éteints

| Asset | Prio. | Source | Réutilisation ultérieure |
|---|---|---|---|
| **Squelette humain commun** + nomenclature des points d'attache (main, dos, tête, ceinture) | V | **Mesure** (choisi une fois pour toutes) | Tous les humains et Éteints du jeu (Book 18 §4.2) |
| **Nadia, Malik, Rose** : corps, tête, tenue de famille, accessoires de silhouette | **V** | **Mesure** | Personnages de référence, tenues de départ, base des pièces modulaires |
| **Corps de base** (2 morphologies) + têtes (4 à 6) + teintes de peau (palette) | S | Libre+ | Création de personnage (Book 14 §3) |
| **Sources de lumière portées** : torche 🔥, lampe frontale ⚡, lanterne à dynamo ⚙️ | **V** | Mesure | Équipement permanent (Book 18 §4.2) |
| **Salissure « après une journée »** (un masque par personnage) | S | Mesure (shader) | État visible du personnage (Book 05 §3) |
| **Compteur du Carrefour** (PNJ) : visière de comptable, manchettes, brassard de la Compagnie, tampon | S | Libre+ | Tous les comptoirs |
| **Éteint de base** (Errant) : peau gris-vert, yeux blancs, 3 tenues civiles délavées de l'Abondance | **V** | Libre+ sur le squelette commun | Base de tout le bestiaire (Book 18 §4.3) |
| **Animations survivants** (≈ 18) : 3 allures, ramasser, porter, frapper, abattre, casser la pierre, allumer le feu, boire, établi, forger, pédaler, brancher, dormir, être touché, s'effondrer | S | Libre (bibliothèque) + Mesure pour forger, pédaler, brancher | Bibliothèque partagée |
| **Animations Éteints** (≈ 9) : dormant affalé, **réveil**, errer, marche attirée (tête levée vers la source), poursuite, frapper, saisir, touché, chute | S | Libre+ ; **Mesure pour le réveil** | Bibliothèque des Éteints |
| **Saisie et dégagement** (animation à deux, synchronisée) | **V** | **Mesure** | Toutes les saisies (Book 06 §2.3) |

> Les quatre comportements de la 0a (Errant, Dormant, Attiré, Poursuivant) sont **des états, pas des variantes** (Book 06 §4). Ils se lisent **à la posture et à la démarche**, avec un seul modèle d'Éteint. C'est ce qui permet de rester dans « pas de variantes ».

#### 5.2.2 Le terrain (50 × 50 m, Book 19)

| Asset | Prio. | Source | Réutilisation |
|---|---|---|---|
| **Sol** : herbe, terre, chemin, roche (mélange par case, bords adoucis) | S | Mesure (shader) + textures libres | Tous les terrains et lieux |
| **Eau** : mare ou ruisseau (reflet du feu la nuit) | S | Mesure (shader) | Tous les points d'eau |
| **Arbres** : 3 essences × 2 tailles + souche + tronc abattu | S | Libre+ | Toutes les maps ; teinte de saison en paramètre |
| Buissons, herbes hautes, fleurs | Si | Libre (instancié) | Partout ; les herbes hautes serviront au Rampant |
| Rochers (3 tailles) + rocher cassé ; bois mort, branches, pierres au sol | Si | Libre | Partout ; ressources de toutes les maps |
| **Lisière du terrain** : sous-bois dense, clôture effondrée, brume de bord | S | Libre+ | Bord de toutes les maps |

#### 5.2.3 La halte : station-service abandonnée (≈ 200 × 70 m, Book 01 §2 bis)

| Asset | Prio. | Source | Réutilisation |
|---|---|---|---|
| **Kit modulaire de ruine commerciale** : murs, vitrines brisées, auvent, comptoir, rayonnages, toit effondré | **V** | **Mesure** | Toutes les ruines urbaines (boutiques, gare, ville) |
| **Pompes à essence** et enseigne de marque fictive de l'Abondance | **V** | Mesure | Autres haltes |
| Épaves : **voiture « connectée »** (source de la batterie), camionnette de livraison | S | Libre+ | Routes, villes |
| Route : asphalte fissuré, marquages, glissières, **poteaux électriques abattus et câbles** | S | Libre+ (kit) | Toutes les routes ; « l'énergie se voit partout » (Book 18 §1) |
| Débris : pneus, bidons, chariots, cartons, gravats | Si | Libre | Partout |

> **Décision (2026-10-08, proposition P-006) : on arrive du bon côté.** Sur la carte du monde, le terrain est à droite (est) de la station, et le Comptoir à gauche (ouest). La caméra du jeu regarde depuis le sud-est : l'est est à droite de l'écran. On arrive donc à la station **par le bout est** de la route (venant du terrain), et on en repart vers le Carrefour **par le bout ouest** ; les panneaux de la route sont retournés. Au Carrefour, la route de la station arrive **par l'est**, et la route fermée de la Ville part à l'ouest (ce qui colle avec la carte, où la Ville est à gauche du Comptoir). Le goulet (x ≈ 154) se trouve maintenant entre le terrain et la station.

#### 5.2.4 Le Comptoir du Carrefour

| Asset | Prio. | Source | Réutilisation |
|---|---|---|---|
| **Bâtiment** : ancienne agence de la Compagnie, guichet grillagé, sacs de sable | **V** | **Mesure** | Modèle de tous les comptoirs (variantes régionales) |
| **Cellules de batteries** numérotées (« Cellule 7 », Book 07 §3.3), câbles, compteur à aiguille | **V** | Mesure | Comptoirs, Grand Comptoir du Barrage |
| Barème de décharge affiché, tampons, registres, enseigne lumineuse | S | Mesure (2D) | Tous les comptoirs |

#### 5.2.5 Objets et installations (≈ 30)

| Groupe | Assets | Prio. | Source |
|---|---|---|---|
| **Ressources** | Bûche, branches, pierre, eau (gourde, pot) | Si | Libre |
| **Vestiges** | **Vieux vélo**, outils rouillés, **batterie de voiture**, ressort à lames, bâche | S (vélo : **V**, tutoriel ét. 5) | Libre+ ; le vélo a une version **démontée** |
| **Outils** | Hache (manche cassé / remmanchée), couteau, marteau, briquet, casserole | S | Libre+, **légèrement surdimensionnés** (§5.3.2) |
| **Feu de camp** | États : bois empilé, allumé, braises, cendres | **V** | Mesure |
| **Établi** | Avec outils posés | S | Libre+ |
| **Abri de branches et bâche** | Étapes de construction + fantôme de placement | **V** | Mesure (moment 1) |
| **Foyer de forge** 🔥 | Froid / chaud (braise, étincelles) | **V** | Mesure |
| **Pédalier + meule** ⚙️ | Au repos / en marche (meule qui tourne, étincelles) | **V** | Mesure (cadre de vélo récupéré : lien visuel avec le vestige) |
| **Banc solaire + lampe** ⚡ | Éteint / en charge (voyant) / lampe allumée | **V** | Mesure |

> Chaque objet a **un seul modèle** pour le sol, la main et l'icône (§5.2.7). Toutes les installations sont **réutilisées telles quelles** dans les phases suivantes.

> **Passe de finition des objets (2026-10-08).** Ce qui est fait, et comment, pour que les prochains objets suivent la même règle :
> - **Un atelier commun** (`client/src/rendu/assemblage.ts`) : chaque objet est monté pièce par pièce (planches, perches ligaturées, pierres bosselées, toile tendue), **la couleur passe par les sommets**, et tout est fondu en **un maillage par finition** (mat, tôle, métal, verre, toile). Deux touches gratuites : la **nuance** (chaque facette varie un peu de ton : bois, pierre, toile ne sont jamais d'un aplat) et l'**occlusion cuite** (le bas des objets s'assombrit près du sol, §5.3.5). Les pièces communes (roue de vélo, batterie de voiture, panneau solaire) sont dans `pieces.ts` : **le même modèle** sur le pédalier et sur le vieux vélo, sur le banc et dans l'herbe.
> - **Installations** : établi (3 planches, étau, marteau, égoïne, boîte de clous, copeaux), abri (perches fourchues ligaturées, bâche qui creuse et ondule, bord crotté, tendeurs, pierres, lit de fougères, couverture roulée), coffre (planches, couvercle bombé, feuillards, cadenas), charbonnière (dôme de terre nuancé, évents qui rougeoient la nuit, cheminée, pelle), forge (pierres sèches, cuvette de charbon, soufflet de cuir — retiré du dessin en 0.8 —, enclume sur billot, seau de trempe), pédalier (vrai cadre de vélo rouillé, roue à rayons, **plateau et pédales qui tournent** avec la roue, meule de grès, dynamo et son fil), banc (tréteaux, régulateur à cadran, **voyant vert seulement si une batterie est posée**, lampe de chantier), panneau (cellules en damier, chevalet ligaturé), récupérateur (bâche en entonnoir mouillée au centre, gouttes, bassine galvanisée où **l'eau monte et s'élargit**), alarme (ficelle qui pend, cinq boîtes aux étiquettes délavées), lit de branchages (cadre de rondins, rameaux de sapin en écailles, couverture). **1 à 4 appels de dessin** par installation (avant : 3 à 26), **≈ 450 à 1 800 triangles** (avant : 100 à 730), dans le budget §5.3.4.
> - **Feu de camp et foyer Dakota** : pierres noircies de suie côté feu, bûches **fraîches quand le bois est empilé, calcinées au bout une fois le feu pris**, langues de flamme vrillées, lit de cendres et de tisons. Le Dakota : un trou dans un bourrelet de terre remuée et son évent, flamme et fumée basses. **La fumée tient en un seul appel de dessin** (`panache.ts`, bouffées instanciées et triées) au lieu de 18 (22 pour la charbonnière) : un feu qui flambe passe de 38 à 14 appels. Le **fantôme de pose** du feu est le même foyer et les mêmes bûches (un seul modèle).
> - **Armes en main** : hache (fer à joue, tranchant clair), marteau (table et arrache-clou), barre à mine, couteaux (rivets ; fil brillant une fois aiguisé), lame forgée (fer sombre, soie ligaturée), gourdin noueux, épieu (pointe durcie, noircie au feu). +15 à 20 % (§5.3.2), 1 ou 2 appels. **L'arme est tenue dans le poing, plus au poignet** : l'os de la main a son origine au poignet ; dans son repère, +y va vers les doigts, +z de l'auriculaire vers l'index, les doigts se referment vers −x. L'arme est accrochée au creux des premières phalanges, manche selon +z, tête ou tranchant selon +y : juste au repos et pendant les coups.
> - **Ressources** : branche, bûche et pierre restent **en lots** (une géométrie partagée par type, désormais **un seul appel** par type au lieu de deux) ; ronce à mûres en lobes, joncs en feuilles et massettes, vieux vélo couché complet (herbe à travers les rayons), caisse à outils (clé et tournevis tombés), ressort à lames, ballot de bâche ficelé, barre à mine ; à la halte, rayonnage (cartons, étiquettes de prix, boîtes), panneau tombé (même module, verre étoilé), établi métallique (tiroirs, étau bleu), potence de la grange (poulie, corde et son rouleau). La décharge (P-001) suit la même règle.
> - **Les icônes des vestiges** (lot 1) : les 68 vestiges et composants ont leur **dessin à la main** (`client/src/icones.ts`) ; l'icône générique par famille reste en repli pour les suivants.
> - **Planches de contrôle** : `client/objets.html` (installations et leurs états, feux de jour et de nuit, armes en main au repos, en garde et en plein coup, ressources, mesures de triangles et d'appels par objet ; `#objet=forge`, `#vue=feux&nuit`, `#jeu`) et `client/icones.html` (toutes les icônes du sac, aux deux tailles).

#### 5.2.6 Effets visuels

| Effet | Prio. | Source | Note |
|---|---|---|---|
| **Feu** : flammes, braises, étincelles, vacillement de la lumière | **V** | **Mesure** | Le cœur du moment 1 |
| **Fumée** : colonne visible de loin, poussée par le vent | **V** | Mesure | Fumée = signature (Book 01 §2) |
| **Système de lumière de nuit** : nuit américaine, sources colorées, halos visibles de loin | **V** | **Mesure** (technique) | Le cœur du projet (§5.3.3) |
| **Cycle jour et nuit** : courbe de couleur du soleil et de la lune sur 24 min | **V** | Mesure | Aube, midi, crépuscule, nuit |
| **Cercle de signature** : anneau au sol, réagit à l'allure, au bruit, à la lumière | **V** | Mesure | Outil le plus important pour apprendre (Book 06 §3.3) |
| Étincelles de forge et de meule, vapeur de l'eau qui bout | S | Mesure (particules) | |
| Impacts, coup à la tête, chute d'un Éteint, **sang** : éclaboussures et traces rouges, un peu plus marquées que la moyenne, **aucune plaie visible** (validé) | S | Mesure | Book 21 §3.5 |
| Ambiance (brume du matin, lucioles, poussière des pas), surbrillance des objets, grille du mode Construction | S | Mesure | |

#### 5.2.7 Interface, écrans hors jeu, icônes

| Asset | Prio. | Source | Réutilisation |
|---|---|---|---|
| **Watty** : planche de modèle, 5 poses (salut, clin d'œil, pouce levé, « en panne », barré au feutre) | **V** | **Mesure** (vectoriel) | Mascotte de tout le jeu (Book 18 §6.1) |
| **Logo *Watt Now?*** | **V** | Mesure | Définitif |
| **Menu principal** et **écran de chargement** (batterie qui se charge, conseil des Compteurs) | **V** | Mesure | Définitifs (Book 18 §6.5) |
| **Affiches de l'Abondance** : 4 neuves + leurs versions en ruine corrigées au feutre | **V** | Mesure | Décor des ruines, objets de collection |
| HUD : jauges, wotts, heure, signature, joystick, boutons A / B / Mode / Objet rapide | S | Mesure | Définitif |
| **Habillage par famille** (plaques rivetées, terminal ambre, carnet) : cadre, typographie, couleurs | S | Mesure | Voir question ouverte §5.6 |
| Inventaire, fabrication, construction, dialogue, interface du comptoir | S | Mesure | Définitifs |
| Création de personnage (famille, apparence, nom) | S | Mesure | Définitive |
| **Carte** : carte routière de l'Abondance annotée au feutre | S | Mesure | Base de la carte du monde (Book 20) |
| **Icônes** (≈ 30 objets, ≈ 10 états) | S | **Rendues automatiquement** depuis les modèles 3D, éclairage fixe | Chaque nouvel objet a son icône sans travail de dessin |

> **Outils de vitrine** (pour convaincre, réutilisés ensuite) : **mode photo** (caméra libre, curseur d'heure, interface masquée), **réglages de qualité** (bas, moyen, haut), compteur d'images par seconde et de draw calls en mode développeur.

---

### 5.3 Les règles de cohérence visuelle

#### 5.3.1 Palette

| Usage | Règle | Valeurs indicatives (à caler sur la planche) |
|---|---|---|
| **Jour** | Couleurs franches mais **légèrement passées** : un monde délavé par le soleil, pas un jouet | Herbe `#7FA35A`, terre `#9C7A55`, rouille `#A4552F` |
| **Nuit américaine** | Ambiance bleue, **claire** : décor et silhouettes toujours lisibles (Book 18 §2) | Ambiance `#33476E`, lune `#9DB4D9` |
| **Sources de lumière** | Feu orangé, fenêtre jaune chaud, lampe **blanc froid**, lanterne jaune doux (Book 18 §2) | Feu `#FF8A3D`, lampe `#E6F0FF`, lanterne `#FFD27A` |
| **Éteints** | Peau gris-vert, yeux blancs : **jamais** ces deux teintes sur un survivant ou un décor proche | Peau `#8C9A7E`, yeux `#F4F1E6` |
| **Familles** | Rouille, cuir, laiton (🔥) · bleu de travail, jaune réfléchissant (⚡) · paille, vert laine, toile écrue (⚙️) | Book 18 §4.1 |
| **Abondance** | Crème, rouge publicitaire, brun d'encre, bleu canard, ocre (Book 18 §6.3) | **Réservée** aux vestiges, affiches et à l'interface |

- **Une seule saison** en 0a (palette fixe). La teinte de la végétation est **un paramètre**, pour brancher plus tard les quatre palettes du Book 18 §5 sans refaire les modèles.
- **Le rouge vif est rare** : Watty, signalétique de l'Abondance, danger. Il ne sert jamais au décor ordinaire.

#### 5.3.2 Échelle

| Règle | Valeur |
|---|---|
| Unité | **1 unité = 1 m**, alignée sur la grille (Book 19) |
| Personnage | ≈ 1,75 m, **≈ 4,8 têtes** (Book 18 §4) |
| Murs, portes | Murs **2,5 m** (Book 19 §1), portes 2,1 m |
| Outils tenus | **+15 à 20 %** pour rester lisibles à l'écran |
| Caméra | Orthographique isométrique, rotation par quarts de tour (Book 19 §7). Zoom par défaut : **≈ 20 m de large** à l'écran en paysage |
| Lisibilité | Au zoom par défaut, un personnage mesure **au moins 56 px** de haut sur un téléphone de 6 pouces |

#### 5.3.3 Éclairage

- **Jour** : un soleil, **une seule carte d'ombre** qui suit la caméra. Les lumières artificielles n'ont pas d'ombre (Book 18 §2).
- **Nuit** : lune faible à ombres douces + **réserve fixe de lumières dynamiques** (4 sur mobile, 8 sur ordinateur). On allume et on éteint les lumières de la réserve, **sans jamais en créer** : cela évite les recompilations de shaders, donc les saccades.
- **Ombres de nuit** : sur mobile, **seule la source la plus proche du joueur** projette une ombre ; sur ordinateur, jusqu'à 3.
- **Au-delà de la réserve**, une source lointaine reste visible par un **halo** (sprite) et une **tache de lumière au sol**. La règle « ce qui éclaire se voit de loin » est tenue sans coût.
- **Un matériau maison unique** (dérivé des matériaux standard de Three.js) : couleur par atlas de palette, émission, masque de salissure, teinte de nuit. Tous les modèles, libres ou sur mesure, l'utilisent.

#### 5.3.4 Budgets pour le mobile dans le navigateur

| Élément | Budget |
|---|---|
| **Scène visible** (mobile) | ≤ **150 000 triangles**, ≤ **120 draw calls** |
| Héros (Nadia, Malik, Rose, joueurs) | 6 000 à 10 000 triangles, texture **1024²** (512² en qualité basse) |
| Éteint, PNJ | 3 000 à 6 000 triangles |
| Installations | 1 000 à 3 000 triangles |
| Petits objets | 100 à 800 triangles, **atlas de palette partagé** (pas de texture propre) |
| Arbres | 1 000 à 3 000 triangles, instanciés, 2 niveaux de détail |
| Kit de la station-service | ≤ 25 000 triangles au total |
| Textures | **KTX2** compressées, mipmaps ; ≤ **128 Mo** de mémoire vidéo sur mobile |
| Téléchargement | Premier écran jouable ≤ **20 Mo** ; tout le contenu de la 0a ≤ **60 Mo** (glTF compressé) |

#### 5.3.5 Post-traitement raisonnable

| Qualité | Contenu |
|---|---|
| **Basse** (mobile ancien) | Aucun post-traitement. Tone mapping et étalonnage **dans le matériau** (gratuit). Résolution plafonnée à 1,5×, **résolution dynamique** : elle baisse avant les effets |
| **Moyenne** (mobile récent) | **Une seule passe** : bloom en quart de résolution (feu, lampes, yeux des Éteints) + table de couleurs + vignette |
| **Haute** (ordinateur) | La même + anticrénelage. **Pas d'occlusion ambiante en temps réel** : elle est **cuite** dans les couleurs des sommets |

#### 5.3.6 Normalisation des modèles libres

Tout modèle libre passe par la même chaîne avant d'entrer dans le jeu : **échelle** en mètres, **pivot** au sol, **atlas de palette**, **matériau maison**, nom selon la nomenclature, **licence notée** dans un registre (`licences.csv`). On privilégie les licences **CC0** ; **jamais** de licence non commerciale, pour ne pas bloquer la phase 1.

---

### 5.4 Le processus de validation

#### 5.4.1 Les planches de référence (avant toute 3D)

| Planche | Contenu |
|---|---|
| **Image cible** de chacun des 5 moments | Retouche peinte sur une capture de la maquette grise : lumière, couleurs, cadrage |
| **Script couleur** du cycle de 24 min | 6 vignettes : aube, matin, midi, crépuscule, nuit, nuit au feu |
| **Fiches de Nadia, Malik, Rose** | Face, profil, dos, à l'échelle du jeu ; **test de silhouette** en aplat noir |
| **Planche de Watty** | Proportions, poses, à ne pas faire (rester distinct du Vault Boy) |
| **Planche de matières** | Rouille, bois, bâche, toile, peau d'Éteint, de jour et de nuit |

#### 5.4.2 Les passes

1. **Maquette grise** (*greybox*) de tous les lieux : volumes, échelle, caméra, chemins. On valide le jeu **avant** la beauté.
2. **Passe de lumière** sur la maquette grise : jour, nuit, feu. **La lumière se règle avant les textures.**
3. **Le moment 1 jusqu'au bout** : héros, feu, abri, nuit, interface. Il devient la référence de qualité.
4. **Passe d'assets** sur les autres moments, du plus important au moins important (§5.1.2).
5. **Passe de finition** : effets, animations, transitions, interface, performances.

#### 5.4.3 Les revues à jalons

| Jalon | Livrable | On valide |
|---|---|---|
| **J1** | Planches + maquette grise jouable | Échelle, caméra, image cible |
| **J2** | Moment 1 terminé | **La barre de qualité** (feu vert ou on corrige avant d'aller plus loin) |
| **J3** | Les 5 moments en première passe | Cohérence d'ensemble |
| **J4** | Finition + performances | Critères d'acceptation, prêt pour le test familial |

> **Toutes les revues se font sur téléphone**, à côté des images cibles. Jamais seulement sur un grand écran.

#### 5.4.4 Critères d'acceptation

| Critère | Seuil |
|---|---|
| Images par seconde, **iPhone 13** (téléphone de référence, validé) | **30 stables**, jamais sous 25 plus d'une seconde |
| Images par seconde, ordinateur | **60** |
| Chargement jusqu'au premier écran jouable (4G correcte) | ≤ **15 s** |
| **Test des familles** : silhouette montrée 1 s à 5 personnes | ≥ **4 sur 5** reconnaissent la famille |
| Éteint de nuit, à 10 m, au zoom par défaut | Reconnu par **5 sur 5** |
| Textes et zones tactiles sur téléphone | Contraste ≥ 4,5:1 ; zones **tactiles** ≥ **44 px** (un bouton peut se dessiner à 30 px si sa zone tactile en fait 44). **Textes : assoupli le 2026-10-08 à la demande du porteur** (« on lit très bien, on peut réduire ») : 13 à 13,5 px pour les textes et les noms, 11 à 12,5 px pour les petits textes et les boutons, **jamais sous 10 px**. Appareil de référence : **l'iPhone 13 mini**, 375 × 630 points en vertical et 812 × 320 en horizontal, dans Safari (avis de Sally) |
| Daltonisme (simulation) | Éteints, familles et jauges restent distincts |
| Captures des 5 moments | Utilisables **sans retouche** comme images de présentation |

---

### 5.5 Ce qui attend la 0b ou plus tard

| Sujet | Report |
|---|---|
| Automne, hiver, rotation des saisons, contours d'hiver des Éteints (Book 18 §5) | 0b |
| Variantes d'Éteints : Rampant, Putréfié, Gelé, Équipé, Ancien habitant (Book 18 §4.3) | 0b et après |
| Murs, maisons, toits automatiques, fenêtres éclairées (Book 19 §7) | 0b |
| Météo visible : pluie, neige, brume de chaleur (Book 13) | 0b |
| Ruines sur le terrain, autres lieux, hameaux, autres comptoirs (Book 20) | Après 0a |
| Personnalisation complète, skins de fidélité (Book 14 §3, Book 09) ; visages et mains plus fins | Phase 1 |
| Séquence d'introduction de l'univers (Book 15 §6) | À décider |

---

### 5.6 Questions ouvertes

- [ ] **Saison de la 0a :** fin de printemps (vert tendre, arbres en fleurs, lucioles) ou plein été (herbe jaunie, lumière crue) ? Proposition : **fin de printemps**, plus accueillante pour une première image.
- [x] **Qui fait le sur-mesure ?** ✅ **Claude** (méthode : §5.7).
- [ ] **Apparence en 0a :** personnalisation limitée (2 morphologies, quelques têtes, teintes de peau) ou les trois héros comme seuls choix ?
- [ ] **Habillage par famille de l'interface** (Book 18 §3, encore à valider) : trois habillages légers dès la 0a, ou un seul habillage « Compteurs » ?
- [x] **Téléphone de référence :** ✅ **iPhone 13**, le plus ancien de la famille. Les budgets du §5.3.4 sont tenus sur cet appareil.
- [x] **Violence visuelle :** ✅ sang un peu plus marqué que la moyenne, **seulement du rouge**, aucune plaie visible.

---

### 5.7 La méthode de production : Claude produit (validé)

Tout le sur-mesure de la 0a est produit par Claude, sous la direction du porteur du projet, qui **valide sur iPhone 13**.

| Asset | Méthode |
|---|---|
| **Modèles 3D** (installations, kit de la station-service, comptoir, objets) | **Générés en code** : géométrie construite par scripts (Three.js, ou Blender en Python), exportée en **glTF**. Formes simples et franches, ce qui convient au style lisse du Book 18. |
| **Personnages** (Nadia, Malik, Rose, Éteints) | Base libre de droits (corps, squelette, animations), **retravaillée** : proportions à 4,8 têtes, pièces de tenue et accessoires de silhouette modélisés en code. C'est le point le plus délicat : on valide la silhouette (§5.4.1) avant tout détail. |
| **Matériaux, textures** | **Atlas de palette** et **shaders** écrits à la main (rouille, bois, bâche, peau des Éteints, salissure) plutôt que des textures peintes : léger, net, cohérent. |
| **Lumière, feu, fumée, cercle de signature** | **Shaders et particules** écrits pour le jeu |
| **Watty, logo, affiches, interface** | **Vectoriel (SVG)**, dessiné en code, exporté aux tailles voulues |
| **Icônes** | Rendues automatiquement depuis les modèles 3D (§5.2.7) |
| **Effets sonores** | **Synthèse dans le navigateur** (Web Audio), écrite en code (validé, 2026-10-08, §6.3) |
| **Images de validation** | Captures produites par le jeu lui-même (mode photo) : chaque jalon (§5.4.3) se juge sur des captures et sur l'iPhone 13 |

> **Décision (2026-10-08) : la base des personnages.** Corps riggés et animations de **Quaternius** (*Universal Base Characters* et *Universal Animation Library* 1 et 2, version gratuite, **CC0**), téléchargés par le porteur du projet, préparés par `code/scripts/preparer-personnages.mjs` (corps simplifiés à ≈ 9 000 triangles, textures 1024², 34 animations gardées, ≈ 6 Mo au total) et notés dans `code/licences.csv`. Dans le jeu : tête agrandie (≈ 4,8 têtes), **vêtements taillés dans le corps** (les triangles de chaque pièce sont lissés puis gonflés, ils gardent les os du corps), accessoires de silhouette **moulés sur le corps** en code, Éteints sur le même squelette (vêtements troués, peau gris-vert, yeux blancs). La planche de validation est `/personnages.html` (vues face, profil, dos, test de silhouette). Le pack libre n'a que la morphologie « Superhero » (carrure héroïque) : une morphologie plus ordinaire reste à trouver (autre base libre, ou corps fait sur mesure).

> **Ce qui reste au porteur du projet :** la direction (choix, refus, priorités), la validation sur téléphone, et les retours de la famille.

---

## 6. Musique et son

---

### 6.1 L'objectif de qualité

**La 0a doit sonner comme un jeu fini, sur un périmètre petit.** Peu de pièces, mais chacune polie jusqu'au bout. C'est le son, plus que les modèles 3D, qui fera dire à l'équipe et à la famille : « ce jeu a une âme ».

Trois exigences :

1. **Lisibilité d'abord** : la règle d'or du Book 16 §3.1 (« ce que le joueur entend, les zombies l'entendent ») est vérifiable en jeu, objet par objet.
2. **Richesse ensuite** : de vraies harmonies (Snarky Puppy), de la vraie matière (Amon Tobin), des instruments échantillonnés de qualité joués avec nuance (§6.5.1). Aucun son générique de banque reconnaissable dans la musique.
3. **Tout est récupérable** : masters, stems, sessions et sons trouvés sont archivés pour la phase 1 (§6.5.4).

#### 6.1.1 Les cinq moments-vitrine

On polit **ces cinq moments en priorité**. S'ils sont réussis, la 0a est réussie, même si le reste est plus simple.

| # | Moment | Étape (Book 14 §4.2) | Ce qu'on entend | Ce que ça doit provoquer |
|---|---|---|---|---|
| 1 | **Le réveil** | Écran titre puis 1. Arrivée | Un jingle publicitaire de la Compagnie (Watty) sur une radio qui grésille… coupure de courant, silence. Puis le **thème principal** naît de sons trouvés. Fondu vers le petit matin sur le terrain : oiseaux, vent, **Fond** seul. | Le ton du jeu en 30 secondes : ironie, puis beauté |
| 2 | **Le premier feu** | 3. Le feu | Le craquement du feu, proche et chaud. **La couche Vie entre pour la première fois**, un instrument à la fois, sur 16 mesures. | « La musique est née de mon feu » |
| 3 | **Le premier Éteint** | 8. et 9. | Un râle au loin **qui s'interrompt** (Attiré), puis des pas qui viennent. La Vie s'amincit, la **Tension** prend. Saisie : **Danger**. Dégagement, coup, chute. Puis **Silence** de 6 s. | Le joueur comprend qu'il faut **écouter** |
| 4 | **L'installation de famille** | 10. La famille | Le marteau sur le foyer de forge, la chaîne du pédalier, le bourdonnement du banc solaire. **Le thème de famille au complet**, dont la percussion est faite de ce même son. | « Ma famille a sa musique » |
| 5 | **La première nuit** | 11. La nuit | Signal du crépuscule, Vie nuit autour du feu, puis de longues plages de silence. Un râle d'Errant, loin, à gauche. Endormissement : motif court, puis silence. Aube au réveil. | La peur douce, la beauté de la nuit (Book 18 §2) |

> **Bonus, hors tutoriel : l'arrivée au Comptoir.** Le groove sort d'abord d'une **radio** posée sur le comptoir (filtrée, spatialisée), puis s'ouvre en pleine musique quand on entre. Proposition, à garder si le temps le permet.

---

### 6.2 Le périmètre musical de la 0a

#### 6.2.1 La grille commune

Pour que toutes les couches se superposent sans heurt, **une seule grille** sert à toute la musique du terrain et de la halte.

| Paramètre | Valeur | Pourquoi |
|---|---|---|
| **Tonique** | **Une par lieu** (validé) : terrain, halte et comptoir ont chacun la leur, et elle peut changer d'un lieu à l'autre | Dans un même lieu, toutes les couches partagent la tonique, pour se superposer sans heurt. Les toniques et modes de la commande (§6.2.2) sont un **point de départ**. |
| **Tempo** | **84 BPM**, 4/4 (comptoir : 96 BPM) | Assez lent pour durer, assez vivant pour groover. Les métriques impaires se jouent **dans** la mesure (groupements 3+3+2). |
| **Unité de bouclage** | **Blocs de 8 mesures** (≈ 22,9 s) | Toute transition tombe sur une frontière de bloc ; la mémoire mobile en dépend (§6.4.4) |
| **Format des pièces** | Chaque pièce Vie = **6 à 8 blocs** qu'on peut enchaîner dans plusieurs ordres | Transitions horizontales, et une musique qui ne se répète pas à l'identique |
| **Livraison** | WAV 48 kHz / 24 bits, **un fichier par stem et par bloc**, + 1 mesure de queue (réverbération) | Bouclage sans trou, montage dans le moteur |

#### 6.2.2 Les pièces commandées

**Socle** = indispensable pour la 0a. **Complet** = si le temps et l'énergie le permettent.

| Pièce | Lieu, moment | Mode | Durée totale | Stems | Instrumentation | Niveau |
|---|---|---|---|---|---|---|
| **Thème principal** | Écran titre | Ré dorien → lydien à la fin | 2:00 à 2:30, linéaire + queue bouclable de 8 mesures | 4 (pour réemploi) | Tout l'orchestre : les trois familles se croisent | Socle |
| **Jingle Watty** | Écran titre, avant le thème | Majeur kitsch | 0:08 | 1 | Orgue de publicité années 60, voix « Watt Now? » (onomatopée possible), radio | Socle |
| **Fond terrain, jour** | Terrain | Bourdon ré-la | 2 blocs (0:46) | 2 : nappe, texture trouvée | Ressort à lames frotté à l'archet, souffle de tôle, pad | Socle |
| **Fond terrain, nuit** | Terrain | Bourdon ré, plus grave | 2 blocs | 2 | Idem, plus sombre, grillons accordés | Socle |
| **Vie 🔥 Charbonniers, jour** | Terrain | Ré dorien | 8 blocs (≈ 3:00) | 4 : rythmique, basse, harmonie, mélodie | Enclume (ressort à lames frappé), tôle, cuivres graves (trombone, saxophone baryton), contrebasse ronde, guitare baryton | Socle : 6 blocs |
| **Vie ⚡ Voltaïques, jour** | Terrain | Ré lydien | 8 blocs | 4 | Rhodes, synthé analogique, bornes de batterie frappées, ronflement secteur **ramené au la (55 Hz)**, grésillement de radio | Socle : 6 blocs |
| **Vie ⚙️ Mécanistes, jour** | Terrain | Ré mixolydien | 8 blocs | 4 | Guitare acoustique, violon et violoncelle, percussions de bois, **chaîne et roue libre du vélo** en 3+3+2, rayons pincés accordés | Socle : 6 blocs |
| **Vie nuit** (× 3 familles) | Terrain, la nuit | Même mode, plus dépouillé | 4 blocs chacune (≈ 1:30) | 3 : basse, harmonie, mélodie | Même famille, moitié moins d'instruments, pas de batterie | Socle : 3 blocs |
| **Fond halte** | Station-service | Ré phrygien | 2 blocs | 2 | Résonances de cuve, vent dans l'auvent, néon mort | Socle |
| **Exploration halte** | Station-service | Ré phrygien, touches locriennes | 6 blocs (≈ 2:20) | 3 : pulsation, basse, texture | **Compteur à rouleaux de la pompe**, tuyau, bidons, guitare préparée | Socle : 4 blocs |
| **Tension** | Terrain et halte | Ré, seconde mineure (mi♭) | 2 blocs (variantes) | 2 : pulsation, texture | Battement sourd, cordes col legno, souffle | Socle |
| **Danger** | Terrain et halte | Selon la règle anti-cliché ci-dessous | 2 blocs | 3 : percussions, basse, stridences | Tôle frappée, basse saturée, souffle : la peur vient du **rythme et de la matière** | Socle |
| **Comptoir** | Comptoir du Carrefour | **Sol mixolydien** | 6 blocs à 96 BPM (≈ 2:00) | 4 | Groove léger : **tampons encreurs**, caisse enregistreuse, clic de compteur électrique, basse, orgue, cuivres légers | Socle : 4 blocs |
| **Signaux** (*stingers*) | Partout | Selon le contexte | 2 à 6 s chacun | 1 | Voir ci-dessous | Socle |

**Jouer sur les modes, sans cliché (validé).** Les modes sont un outil de couleur, pas une étiquette :

- **Éviter les associations automatiques** : phrygien = danger ou « exotisme », lydien = merveilleux de film, dorien = celtique, trémolos et tritons = horreur.
- **Chercher des couleurs moins usées** : modes de la mineure mélodique (lydien ♭7, mixolydien ♭6, locrien ♮2), majeur harmonique, emprunts modaux, glissement d'un mode à l'autre à l'intérieur d'une pièce.
- **Porter la couleur par le timbre et le rythme** autant que par le mode : la matière des vestiges (Book 16 §2.3) dit déjà où l'on est.
- **Changer de tonique** d'un lieu à l'autre pour que chaque lieu ait sa lumière propre.

**Les signaux (≈ 10)** : aube, crépuscule, premier Éteint repéré, saisie, dégagement, recette réussie, découverte d'une recette, arrivée au comptoir, échange conclu (coup de tampon), endormissement, mort.

**Volume total** : **≈ 25 minutes** de matière pour le socle, **≈ 40 minutes** pour le complet. Les thèmes de famille et le thème principal sont les pièces les plus importantes : **c'est là qu'on met le plus de soin**.

#### 6.2.3 Règles de couches et de transitions

| Situation | Couches actives | Transition |
|---|---|---|
| Terrain, calme, jour | Fond + **Vie** (famille du joueur) | — |
| Terrain, la nuit | Fond nuit + **Vie nuit**, avec des **fenêtres de silence** | Changement à la frontière de bloc, sur le signal du crépuscule |
| Halte | Fond halte + **Exploration** | Au chargement de la map, sur le signal d'arrivée |
| Un Éteint est **Attiré** par le joueur ou le **poursuit** | Fond + **Tension** ; la Vie perd harmonie et mélodie | Tension entre sur le **temps fort suivant** |
| **Saisie** (proposition : ou Poursuivant à moins de ≈ 5 m) | Fond + **Danger** | Sur le **temps suivant** (≤ 0,7 s) |
| Fin de menace | **Silence** 4 à 8 s, puis Fond | La Vie revient à la **phrase de 8 mesures** suivante, après 20 s de calme |
| Comptoir | Comptoir seul (**zone sûre**, pas de Tension) | — |

- **Hystérésis** : la Tension entre si la condition dure ≥ 2 s, sort après 10 s sans menace. La musique ne fait **jamais de va-et-vient**.
- **Fenêtres de silence** : après chaque passage de 3 à 4 blocs de Vie, 30 à 90 s de Fond seul (la nuit : plus longues). Le silence fait partie de la partition (Book 16 §1).
- **Le joueur n'entend que le thème de sa famille** sur son terrain. Les trois thèmes se croisent dans le thème principal et, plus tard, quand des joueurs se visitent.
- **Les effets sonores ne sont jamais calés sur le tempo** : ils sont de l'information. C'est la musique qui **emprunte** leur matière, pas l'inverse.

#### 6.2.4 Ce qui attend

| Reporté | Pourquoi |
|---|---|
| Thèmes d'**automne et d'hiver** (dorien, éolien, dépouillé) ; **Silence** de la neige | La 0a ne couvre que printemps et été |
| **Horde** (masse sonore), états **Grégaire** et **Pressant**, siège | Hors des zombies de base |
| **Grand Dégel** et grands événements | Hors périmètre |
| Thèmes des autres lieux, ruines profondes, autres environnements | Une seule halte en 0a |
| Musique diégétique jouable, voix des personnages | Questions ouvertes du Book 16 §5 |
| Combat entre joueurs (tirs, pas d'autres joueurs hostiles) | Désactivé en 0a |

---

### 6.3 Les effets sonores de la 0a

**Règle de réglage :** la distance à laquelle un son devient inaudible est **la portée de signature** de la donnée de jeu. Un objet sans signature sonore ne s'entend qu'**à moins de 2 m**.

> **Décision (2026-10-08, version 0.3) : les effets enregistrés remplacent les recettes synthétisées.** La session « son » a livré les 82 effets du catalogue (237 fichiers CC0, `son/LIVRAISON.md`). `code/scripts/copier-effets.mjs` les copie dans le client (Opus, AAC en secours, 5,9 Mo) ; le jeu les charge **à la demande** (mémoire mobile), et garde la **recette synthétisée en secours** tant qu'un fichier n'est pas décodé, s'il manque, ou si on la préfère (liste `RECETTE_PREFEREE` de `client/src/son/audio.ts`). **Les 82 effets ont été écoutés et validés par le porteur le 2026-10-08** : la liste reste vide. Les six sons livrés mais jamais joués le sont maintenant : le souffle de cuir et la trempe à la forge (l'effet s'appelle encore `soufflet` dans le code), scie (coffre, escabeau), hache (travois, lit, épieu, bâton, gourdin, sac de fortune), aiguiser à la fin de l'affûtage, braises sous le feu qui couve.

| Famille de sons | Sons | Priorité (Book 16 §3.2) | Portée audible |
|---|---|---|---|
| **Éteints, Dormant** | Respiration lente, craquement de mâchoire | 1 | ≈ 3 m : il faut tendre l'oreille |
| **Éteints, Errant** | Pas traînants, râles espacés (≥ 6 variantes) | 1 | ≈ 25 m |
| **Éteints, Attiré** | **Râle coupé net**, tête qui craque, pas qui accélèrent | 1 | ≈ 25 m |
| **Éteints, Poursuivant** | Râles rapprochés, pas pressés, souffle | 1 | ≈ 30 m |
| **Éteints, contact** | Saisie (agrippement, tissu), morsure manquée, coup reçu, chute du corps, coup à la tête | 1 | Proche |
| **Combat du joueur** | Arme qui fend l'air, coup porté, esquive, dégagement, cœur, effondrement | 2 | Proche (coup porté : 14 m) |
| **Pas du joueur** | 3 allures × 4 sols (terre, herbe, béton, gravats et verre), ≥ 4 variantes chacun | **3** (voir la décision ci-dessous) | Selon l'allure (Book 08 §3) : valeurs à caler sur le cercle de signature |
| **Outils** | Couteau et pierre à aiguiser, scie, **hache** (coupe, fendage), marteau | **3** | 5 m, 15 m, **25 m**, 40 m sur enclume (Book 02 §7) |
| **Feu de camp** | Allumage au briquet, craquements, bûche qui tombe, extinction | **3** | ≈ 5 m (sa signature est olfactive et lumineuse) |
| **🔥 Foyer de forge** | Souffle de cuir (une grande respiration, puis les braises qui ronflent), ronflement des braises, enclume, trempe | **3** | **30 m** |
| **⚙️ Pédalier + meule** | Chaîne, roue libre, meule sur le fer, étincelles | **3** | **15 m** |
| **⚡ Banc solaire + lampe** | Clic des pinces, bourdonnement léger, interrupteur | **3** | **≤ 2 m** (aucune signature sonore) |
| **Établi, abri, crafting** | Gestes génériques (bois, métal, tissu), montage de l'abri, bâche | **3** | Selon l'outil utilisé |
| **Ambiance jour** | Vent, oiseaux, insectes, feuillage, tôles qui bougent à la halte | 3 | Lit d'ambiance non spatialisé + 6 à 8 sources ponctuelles |
| **Ambiance nuit** | Grillons, hibou, vent froid, craquements lointains | 3 | Idem |
| **Météo** (si elle est dans la 0a) | Pluie légère, averse, tonnerre lointain | 3 | La pluie couvre les bruits (Book 13) |
| **Comptoir** | Tampons, papiers, caisse, compteur électrique, marmonnements des Compteurs | 3 | Lieu sûr |
| **Interface** | Une palette par habillage de famille (Book 18 §3) : rivet et métal, bip de terminal ambre, crayon et page | Hors hiérarchie | Courts, discrets, **jamais confondus avec un son du monde** |

> **Décision (2026-10-08) : les sons du quotidien passent en priorité 3.** Le moteur baisse la musique à chaque son P1 ou P2 (§6.4.1). Avec les pas en P2, la musique baissait à chaque foulée et « pompait » sans fin. Les pas, les gestes, les outils, le feu et les installations sont donc en **P3** : ils ne baissent pas la musique, et sont coupés les premiers si les voix manquent. Seuls les **Éteints (P1)** et le **combat du joueur (P2)** baissent la musique. La portée audible de chaque son ne change pas.

Volume : **≈ 90 sons, ≈ 250 fichiers** avec les variantes. La variation (hauteur ±3 %, volume ±2 dB, tirage sans répétition immédiate) est faite par le moteur.

#### 6.3.1 La banque de sons trouvés

> **Décision (2026-10-08) : en 0a, les effets sonores sont produits par Claude**, comme le reste du sur-mesure (§5.7) : **synthèse dans le navigateur** (Web Audio : bruits filtrés, oscillateurs, enveloppes), avec les variantes faites par le moteur. La musique est produite à part (session musique). La banque de sons enregistrés ci-dessous reste la piste pour aller plus loin après la 0a.

**On enregistre soi-même.** C'est gratuit, c'est unique, et c'est la matière commune aux effets et à la musique (Book 16 §2.3).

| Vestige | À enregistrer | Usage |
|---|---|---|
| **Vieux vélo** | Chaîne, roue libre, rayons pincés, sonnette, garde-boue frappé | Pédalier ; rythmique ⚙️ |
| **Batterie de voiture** | Bornes frappées, coffre en plastique, pinces | Banc solaire ; percussions ⚡ |
| **Ressort à lames** | Frappé (métal grave, résonant), **frotté à l'archet** | Enclume ; bourdon du Fond |
| **Station-service** | Pompe et compteur à rouleaux, tuyau, bidons, auvent dans le vent, néon | Halte ; Exploration |
| **Tôle, tuyaux, bouteilles** | Frappés, soufflés, frottés | Percussions, nappes |
| **Radio, transformateur** | Grésillement, ronflement secteur | ⚡, jingle Watty, radio du comptoir |
| **Tampons, caisse, compteur** | Coups, sonnerie, clics | Comptoir |

**Protocole** : enregistreur de poche ou téléphone avec micro externe, **48 kHz / 24 bits**, lieu calme, trois prises par geste, à deux distances (proche, pièce). Fichiers nommés `vestige_geste_prise.wav`, notés dans un tableau (lieu, date, micro).

---

### 6.4 Le moteur audio dans le navigateur

#### 6.4.1 Architecture

```
AudioContext (un seul, débloqué au bouton « Jouer »)
 ├─ Bus Menaces (P1)        ┐
 ├─ Bus Joueur (P2)         ├─ réglage « effets »
 ├─ Bus Environnement (P3)  ─ réglage « ambiance »
 ├─ Bus Musique (P4)        ─ réglage « musique »  ← atténué par P1 et P2
 ├─ Bus Interface           ─ réglage « effets »
 └─ Bus Voix (réservé)      ─ réglage « voix »
        → Maître (réglage « général ») → limiteur → sortie
```

- **Le directeur musical** : une machine à états (lieu, famille, jour ou nuit, niveau de menace) qui fixe le volume cible de chaque couche. Tous les stems d'un bloc démarrent **au même instant** sur l'horloge de l'`AudioContext` ; une couche se coupe par son **volume**, jamais en l'arrêtant, donc la synchronisation est parfaite. Programmateur avec 100 ms d'anticipation.
- **L'atténuation automatique** (*ducking*) : Web Audio n'a pas de compresseur à déclenchement externe. Le moteur le fait par événements : un son P1 ou P2 baisse la musique de 6 à 10 dB (attaque 80 ms, retour 1,5 s) ; les sons du quotidien sont en P3 pour ne pas la faire « pomper » (§6.3). Un son P1 baisse aussi l'environnement de 4 dB.
- **La spatialisation** : `AudioListener` et `PositionalAudio` de three.js, l'**auditeur placé sur le personnage** (pas sur la caméra isométrique, trop haute et trop loin), orienté comme l'écran. Courbe de distance réglée pour s'éteindre **exactement à la portée de signature**, lue dans les mêmes données que le serveur. Murs et relief : filtre passe-bas, avec le **même calcul d'atténuation** que la signature (code TypeScript partagé, Book 17 §3).
- **Les voix simultanées** : 24 sur mobile, 48 sur ordinateur. Quand on dépasse, on coupe d'abord P3, jamais P1.
- **Les données** : chaque son est décrit en JSON (fichiers, variantes, bus, portée), comme les objets (Book 03 §8).

> **Boîte à outils** : un module comme le plugin **« Audiorective »** (Web Audio, liaisons three.js) pourrait servir de base, tout comme Tone.js (horloge musicale) ou une couche maison sur Web Audio. **Ce n'est pas une décision** : à comparer au prototype, sur le critère de la synchronisation des stems et du poids sur mobile.

#### 6.4.2 Formats

| Contenu | Format principal | Repli (Safari ancien) | Chargement |
|---|---|---|---|
| Stems musicaux | **Opus** 96 kbit/s stéréo, 64 mono | AAC 128 kbit/s (`.m4a`) | Par bloc, juste à temps, décodé en mémoire |
| Effets | Opus 64 kbit/s mono | AAC | **Préchargés par lieu** |
| Ambiances, thème principal | Opus 80 à 96 kbit/s stéréo | AAC | **En flux** (`<audio>` relié à Web Audio) |

**Piège du bouclage** : Opus et AAC ajoutent un silence d'amorce. On boucle donc **dans le tampon décodé** (`loopStart`, `loopEnd` en échantillons, notés dans les métadonnées), jamais sur le fichier brut. Les fichiers sont mis en cache (Service Worker) : on ne les télécharge qu'une fois.

#### 6.4.3 Déblocage et particularités iOS

- **Bouton « Jouer »** (Book 08 §2.2) : il reprend l'`AudioContext` et joue un tampon muet.
- **Interruptions** (appel, mise en veille) : l'état passe à « interrompu » ; on reprend au toucher suivant. On **suspend** le son quand l'onglet est caché (batterie).
- **Interrupteur silencieux** de l'iPhone : il coupe le son de la page par défaut. L'API Audio Session de Safari permet de passer outre ; à trancher (question 4). À défaut, un rappel discret : « Le son est une information de jeu. »

#### 6.4.4 Budget mémoire

L'audio décodé pèse lourd (≈ 384 Ko par seconde en stéréo). D'où les blocs de 8 mesures.

| Appareil | Budget audio décodé | Comment |
|---|---|---|
| **Mobile** | **≤ 64 Mo** | Version allégée (Book 16 §4) : 3 couches prémixées (Fond + Vie, Tension, Danger), bloc en cours + bloc suivant seulement |
| **Ordinateur** | **≤ 160 Mo** | Tous les stems, bloc en cours + suivant |
| **Effets** (les deux) | ≤ 25 Mo | Seuls les effets du lieu courant |

---

### 6.5 Comment obtenir cette qualité sans budget

#### 6.5.1 Les personnes

- **Claude compose et produit (validé).** Les pièces sont écrites en partition (MIDI ou code), avec un vrai travail d'harmonie, de voix et de nuances, puis rendues avec des **instruments échantillonnés libres de droits** de qualité (licences CC0 ou permissives : orchestre, piano, guitare, cuivres) et de la **synthèse Web Audio** pour les nappes, le Rhodes et les synthés des Voltaïques. Les stems sont livrés selon la grille du §6.2.1.
- **Plus tard, de vrais musiciens** : grâce aux stems, une basse ou un cuivre enregistrés pourront **remplacer** une piste échantillonnée sans rien recomposer. C'est le meilleur gain de qualité possible en phase 1.
- **Le porteur du projet** : direction, écoute et validation (sur iPhone 13 et au casque). S'il le souhaite, il peut enregistrer au téléphone quelques **sons trouvés** (§6.3.1), qui rendront la matière unique ; sinon, banques libres et sons créés par synthèse.

#### 6.5.2 Les effets

- **Banques libres de qualité** : bundles **Sonniss GDC** (libres de droits, usage commercial), **Freesound** (seulement **CC0 ou CC-BY**, jamais NC), **Kenney** (CC0, interface). Attention : la licence de la BBC exclut l'usage commercial.
- **Les Éteints** : c'est le son le plus important du jeu, il doit être unique. Base : voix tirées de banques libres (CC0), **fortement retravaillées** (hauteur, granulation, filtres) pour obtenir un vocabulaire propre au jeu ; idéalement, quelques prises de voix du porteur du projet ou de la famille.
- Un tableau des crédits et licences, tenu **dès le premier fichier**.

#### 6.5.3 Le processus

| Étape | Livrable | Validation |
|---|---|---|
| 1. **Brief** | Ce document + une liste d'écoute (références par famille) | Le porteur du projet ; Claude compose à partir de là |
| 2. **Esquisses** | 1 minute par thème de famille, mixée simplement | Le porteur et l'équipe : la famille est-elle reconnaissable ? |
| 3. **Maquette en jeu** | Moteur de couches avec les esquisses, Éteints provisoires | Tests des critères ci-dessous, en interne |
| 4. **Production** | Stems définitifs, sons trouvés traités, Éteints finaux | Les moments-vitrine, un par un |
| 5. **Mixage sur appareils** | Haut-parleur de téléphone, casque, ordinateur | Critères de mixage |
| 6. **Test familial** | Questionnaire court + mesures | Bilan pour la phase 1 |

#### 6.5.4 Critères d'acceptation

| Critère | Seuil |
|---|---|
| **Les yeux fermés**, le joueur reconnaît l'état d'un Éteint (Dormant, Errant, Attiré, Poursuivant) | ≥ 80 % de bonnes réponses |
| Il situe un Éteint à gauche ou à droite, devant ou derrière | ≥ 90 % |
| Il reconnaît la famille sur 10 s de musique | ≥ 2 testeurs sur 3 |
| Un Dormant est audible à 2 m sur un haut-parleur de téléphone à mi-volume | Oui |
| Aucun clic, trou ou saut de mesure aux bouclages et transitions | Zéro sur 30 min de jeu |
| Après 45 min de jeu, la musique n'est ni coupée ni baissée par le joueur | Mesuré (Book 17 §6) : ≥ 80 % des joueurs |
| Niveau : musique ≈ −18 LUFS intégré, crête ≤ −1 dBTP ; effets homogènes | Mesuré |
| Le son démarre au premier toucher sur iPhone | 100 % |
| Mémoire audio dans le budget (§6.4.4), aucun craquement sur iPhone en 30 min | Oui |

**Archivage** : WAV maîtres, stems, sessions du compositeur, sons trouvés bruts et traités, métadonnées (tempo, mode, blocs, points de boucle), crédits et licences. Tout cela sert tel quel en phase 1.

---

### 6.6 Questions ouvertes

- [x] **Qui compose ?** ✅ **Claude**, avec des instruments échantillonnés libres de droits et de la synthèse (§6.5.1).
- [x] **Tonique :** ✅ elle peut changer d'un lieu à l'autre ; jouer sur les modes sans tomber dans le cliché (§6.2.2).
- [ ] **Voix des Compteurs** pour la 0a : marmonnements, onomatopées, ou rien (Book 16 §5) ?
- [ ] **Interrupteur silencieux de l'iPhone** : respecter le choix du joueur, ou le contourner parce que le son est une information de jeu ?
- [ ] **Le Danger au contact** : faut-il aussi le déclencher pour un Poursuivant tout proche, ou le garder pour la saisie ?
- [ ] **La radio du comptoir** (musique qui sort d'un objet du décor) : on la garde pour la 0a ?

---

## 7. Technique

| Élément | Phase 0a | Référence |
|---|---|---|
| **Pile** | TypeScript (client et serveur), Three.js, Node.js, WebSocket, SQLite, Docker Compose, Caddy | Book 17 §3 |
| **Hébergement** | Raspberry Pi | Book 17 §5 |
| **Appareil de référence** | **iPhone 13** (Safari) : performances, son et commandes tactiles s'y valident en premier | §2 |
| **Serveur** | Autoritaire, sans état caché (tout en base) | Book 17 §2 |
| **Monde hors ligne** | Calcul à la demande à la reconnexion | Book 17 §4 |
| **Contenu** | Objets et recettes en données (tableur → JSON) | Book 03 §8 |
| **Comptes** | Simples, pour un cercle familial (à trancher : Book 17 §8) | Book 17 |
| **Sauvegardes** | Quotidiennes, copie hors du Pi | Book 17 §5.4 |
| **Mesures** | Temps par activité, flux de wotts, causes d'effondrement, progression par famille, performances | Book 17 §6 |

---

## 8. Phase 0b : le premier hiver

### 8.1 Ce qui s'ajoute

| Domaine | Ajouts | Référence |
|---|---|---|
| **Temps** | Les quatre saisons, le calendrier complet, les **épisodes climatiques** (deux couches de météo) | Book 01 §2 bis, Book 13 §2.1 |
| **Production** | Potager simple (radis, salade, pommes de terre), cave, séchage, salage ; bûcher et bois humide | Book 11, Book 02 §3 |
| **Construction** | Cabane en rondins, toit de chaume, poêle récupéré, chauffage ; enduits qui ne sèchent pas en hiver | Book 10, Book 19 |
| **Éteints** | Gelés, Grégaire, Pressant ; palissade et **siège hors ligne** | Book 06 |
| **Santé** | Infection, froid et hypothermie | Book 05 |
| **Graphismes** | Palettes des quatre saisons, neige, Éteints gelés | Book 18 §5 |
| **Musique** | Couleurs de saison (automne, hiver), silence de la neige | Book 16 §2.2 |
| **Objectifs** | Le carnet guide après le tutoriel : **« S'installer »** et **« Le métier »** de chaque famille, avec primes des Compteurs. Ils grandissent avec le contenu de la 0b (potager, cabane, hiver) et la gamme bushcraft (P-002) | Book 22 §3 |

> **Décision (2026-10-08) : la 0b, c'est d'abord un jeu très jouable.** On ne veut pas une grande aventure avant que la boucle quotidienne tienne seule : des objectifs proches, logiques et rentables, qui donnent toujours une chose utile à faire. La **grande quête du cycle** (« Où est Bill Murray ? », Book 22 §4) est conçue, mais elle est **pour la 1.0**.

### 8.2 Le critère de fin

**La phase 0b est réussie quand des joueurs ont traversé un hiver**, et que les mesures permettent de comparer le **temps passé à survivre** avec les cibles du Book 01 §7.2 : ≈ 40 % pour un débutant non préparé, ≈ 10 % pour un joueur préparé, à ±5 % entre familles sur l'année.

---

## 9. Après la phase 0

Le cycle complet (Book 09) et sa **grande quête** (Book 22 §4, nécessaire pour la 1.0), le Grand Dégel, les classements, les lieux lointains, les filières lourdes (Book 04) et le combat entre joueurs viennent ensuite, au rythme de ce que les deux tests auront appris. La phase 1 (ouverture au public) reste soumise à la décision du porteur du projet (Book 08 §1).

---

## 10. Questions ouvertes

- [ ] **Durée exacte des tests** et nombre de joueurs invités.
- [ ] **Comptes :** mot de passe, lien magique ou comptes invités (Book 17 §8) ?
- [ ] **Visites entre amis** dès la 0a, si elles s'avèrent simples à faire ?
- Les questions propres aux graphismes et à la musique sont au §5.6 et au §6.6.

---

## Glossaire

- **Tranche verticale** : petite version du jeu, complète et finie de bout en bout (du ramassage au comptoir), plutôt qu'une version large mais inachevée.
- **Phase 0a / 0b** : les deux étapes du test familial : la boucle d'une session, puis la boucle d'une année.
- **Chaîne-vitrine** : la suite de fabrications qui montre l'identité d'une famille en une session.
