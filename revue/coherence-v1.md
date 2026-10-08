# Revue de cohérence des books — v1

> Relecture critique des books 01 à 17 et 99 (état du 2026-10-07, fin d'après-midi). Aucun book n'a été modifié.
> **Suivi :** le nœud 1 (création des watts, prix de la nourriture, énergie de la base) a été tranché et reporté dans les Books 01, 02, 07, 11 et 17. Points résolus : 1.1, 1.2, 5.7, 7.1, 7.2.
> **Suivi :** le nœud 2 (horloges, hors ligne, météo) a été tranché et reporté dans les Books 01, 04, 05, 06, 09, 10, 11, 13 et 17. Points résolus : 3.1 à 3.7, 4.3. Ajout : réservoirs du lait et des œufs (Book 11 §9), qui résout aussi 2.7.
> **Suivi :** le nœud 3 (modèle d'équilibrage, l'hiver se prépare) a été tranché et reporté dans les Books 01 §7.2, 02, 10 et 11. Point résolu : 2.1.
> **Suivi :** derniers importants (biogaz ⚙️, savoir effacé en fin de cycle, Grand Dégel, trésorerie des comptoirs) reportés dans les Books 01, 03, 04, 06, 07 et 09. Points résolus : 1.3, 1.4, 1.5, 1.13, 6.1. **Tous les points bloquants et importants sont résolus.**
> **Suivi :** passe sur les mineurs sans décision : 26 points corrigés. Restent à trancher : 1.9, 5.8, 6.2, 6.3, 6.4.
> **Suivi :** derniers choix faits (portage, systèmes validés, enseignement, sel en bord de plage, domaines de savoir). **La revue est entièrement traitée.**
> Rappels utilisés pour les calculs : 1 kcal = 0,2 watt · 1 Wh_é = 1 watt · 1 Wh_m = 0,6 watt · bois sec ≈ 8 watts/kg · charbon de bois ≈ 47 watts/kg · 1 h de jeu = 1 min réelle · 1 saison = 1 semaine réelle.

## Résumé : les 5 problèmes les plus importants

1. **Boucle qui crée des watts** (7.1) : la nourriture coûte ≈ 0,06 watt/kcal à produire, mais le pédalage au comptoir est calculé avec 0,2 watt/kcal. Acheter du pain puis pédaler rapporte ≈ +80 à +250 watts par pain, en watts neufs.
2. **Production d'énergie hors ligne sans horloge** (7.2) : on ne sait pas si le solaire, la roue hydraulique ou le biogaz produisent à l'horloge d'action. Si c'est le cas, le gain est ×60 : une roue de 500 W donne ≈ 30 kWh par heure réelle.
3. **Qui crée les watts ?** (1.1) : selon le Book 01, les combustibles déposés créent des watts. Selon le Book 07, non. Avec la règle du 07, les Charbonniers ne peuvent jamais « imprimer » de watts, ce qui contredit le principe de neutralité.
4. **Le chauffage du Book 01 est sous-estimé** (2.1) : la journée type d'hiver du Book 01 §7.2 compte 2 kWh. Le Book 10 donne 5 à 40 kWh rien que pour chauffer une pièce.
5. **Les horloges se mélangent** (3.1 à 3.3) : la météo tourne à l'horloge d'action et les cultures au calendrier. Les carences se comptent au calendrier alors qu'on mange à l'horloge d'action. Enfin, ce qui continue hors ligne n'est pas défini (infection, chauffage, animaux).

**Décisions récentes**, vérifiées dans les books :

- **Savoir effacé en fin de cycle :** c'est juste dans le Book 09. Le Book 03 §5.5 dit encore « jamais son savoir », et la ligne du Book 01 §8 est incomplète (voir 1.4).
- **Plafond d'achat à ≈ 25 % :** il est validé au Book 08 §5, mais le tableau du §4.2 dit encore « Proposition » (voir 5.2).
- **Terrain de 50 × 50 m :** il est validé au Book 10 §10 et au Book 01 §9 (coché pendant la relecture). Le Book 11 §13 parle encore de taille « proposée », et la ligne Terrain du Book 01 §8 ne donne pas la valeur (voir 5.1).

---

## 1. Contradictions de règles entre books

| # | Gravité | Où | Problème | Correction proposée |
|---|---|---|---|---|
| 1.1 | ✅ **Résolu** (Important) | Book 01 §6 (« Le watt n'est créé que lorsqu'un joueur apporte de l'énergie au comptoir », tableau « 🔥 Charbonniers : Combustibles… rapporte des watts ») contre Book 07 §3.1 (« Tout le reste ne crée pas de watts… il paie avec sa trésorerie ») | Les deux books ne disent pas la même chose sur la création des watts. Avec la règle du Book 07, seuls les dépôts de Wh_é et le pédalage créent des watts. Les Voltaïques (solaire) et les Mécanistes (pédalage, roue) peuvent donc « imprimer » des watts, et les Charbonniers jamais. Cela contredit le principe « Neutre : aucune famille ne doit pouvoir imprimer de l'argent mieux que les autres » (Book 01 §6). | Garder la règle du Book 07 et réécrire le tableau « Comment chaque famille gagne des watts » du Book 01 : pour les combustibles, c'est une vente sur la trésorerie. Ajouter au Book 07 un contrôle de neutralité de la création monétaire, par exemple une part de watts créés par famille, suivie dans les indicateurs du §7.2. |
| 1.2 | ✅ **Résolu** (Important) | Book 01 §6 (tableau « 1 kcal (travail humain et nourriture) : 0,2 watt » et « Le prix de base d'un bien est son énergie grise ») contre Book 02 §12.4 (« 1 kg de pain… ≈ 150 watts… une journée de nourriture vaut 500 watts au cours de base ») | Deux règles donnent deux prix différents à la nourriture. Selon l'énergie grise, le pain vaut 150 watts, soit 0,06 watt/kcal. Selon le cours de la kcal, il vaut 500 watts. Le Book 02 §15 (« Rentable ×3 ») et le Book 02 §17 s'appuient tantôt sur l'un, tantôt sur l'autre. Cette ambiguïté rend possible l'exploit 7.1. | Trancher. Par exemple : « la nourriture suit la règle générale (énergie grise) ; 0,2 watt/kcal ne sert qu'à valoriser le **travail** dans l'énergie grise ». Retirer « nourriture » de la ligne du tableau du Book 01, puis recalculer les contrôles de cohérence. |
| 1.3 | ✅ **Résolu** (Important) : digesteur ⚙️ natif | Book 01 §4 (Charbonniers palier III : « Digesteur à biogaz » ; énergie « bois, charbon de bois, **biogaz** ») et Book 04 §3.9 (rangé sous « (🔥) ») contre Book 04 §4 (biogaz dans la colonne ⚙️ Mécanistes) | La famille native du biogaz change d'un endroit à l'autre. Or c'est elle qui décide qui paie ×1,5. | Choisir une seule famille, par exemple 🔥 pour l'installation et ⚙️ seulement pour l'apport de fumier, et l'écrire de la même façon dans les trois endroits. |
| 1.4 | ✅ **Résolu** (Important) | Book 03 §5.5 (« conservé à la mort : on perd son inventaire courant, **jamais son savoir** ») ; Book 01 §8 (ligne « Savoir et mort ») ; Book 01 §9 (« Avantage des anciens par… le savoir appris ») | Cela contredit la décision récente : le savoir est effacé à la réinitialisation (Book 09 §4). « Jamais » est faux. Le Book 01 §8 ne mentionne pas l'effacement. Le Book 01 §9 laisse entendre que le savoir reste un avantage d'un cycle à l'autre. | Book 03 §5.5 : « conservé à la mort en cours de cycle, effacé à la fin du cycle (Book 09 §4) ». Book 01 §8 : ajouter l'effacement à la ligne. Book 01 §9 : préciser « avantage **pendant le cycle** ». |
| 1.5 | ✅ **Résolu** (Important) : le Grand Dégel | Book 09 §1.1 (Grande Migration pendant la dernière semaine, c'est-à-dire la semaine 8, hiver de l'an 2) contre Book 06 §7 (hiver : « Ralentis de moitié, beaucoup de gelés, **peu de hordes** » ; les hordes migrantes sont au printemps) et Book 06 §9.1 (probabilité d'attaque « ↓ en hiver ») | L'événement final est une migration hors norme placée dans la saison où, d'après les règles, les zombies migrent le moins. | Soit justifier une exception (une migration poussée par le grand froid, par exemple), soit déplacer l'événement ou faire finir le cycle sur un printemps. |
| 1.6 | ✅ Résolu (Mineur) | Book 10 §8 (« compte… pour les **zombies qui entrent** si une protection cède ») contre Book 06 §9.1 règle 3 (« Elle ne touche que les défenses ») et §9.4 | Le Book 06 ne prévoit pas que des zombies entrent dans la maison. | Retirer la phrase du Book 10, ou définir ce qui se passe quand une protection cède alors que le joueur est en ligne. |
| 1.7 | ✅ Résolu (Mineur) | Book 03 §4 (« deux niveaux en dessous, la recette est impossible » et « remplace la règle outil de fortune du Book 02 §7 ») contre Book 02 §7 (« Pierre emmanchée : temps ×4 » à la place de la hache ; « Grosse pierre plate : qualité −2 » à la place de l'enclume) | Au Book 03, la pierre emmanchée est de niveau 1 et la hache de niveau 3. La grosse pierre est de niveau 1 et l'enclume de niveau 3. Le Book 02 autorise ce que le Book 03 interdit. | Mettre à jour le tableau du Book 02 §7 selon les niveaux du Book 03, ou le marquer « remplacé par Book 03 §4 ». |
| 1.8 | ✅ Résolu (Mineur) | Book 11 §12 (« Rendement musculaire : le travail du sol, le pompage et la mouture coûtent moins de calories (Book 01 §4) ») | Au Book 01 §4, le trait donne seulement « Production de Wh_m +30 % » sur les machines. Il ne couvre pas le travail du sol à la main. | Soit étendre le trait au Book 01 (en tenant compte du budget de points), soit limiter la phrase du Book 11 au pompage et à la mouture. |
| 1.9 | ✅ Résolu (Mineur) : le trait ne porte que sur la fatigue | Book 01 §4 (Voltaïques : FOR −2 **et** trait « Constitution de bunker : portage réduit ») contre Book 12 §6 (« FOR −2 : portent moins (*Constitution de bunker*) ») | On ne sait pas si la pénalité de portage s'ajoute à celle de la FOR (−6 kg selon le Book 12 §2.1) ou si c'est la même. | Chiffrer l'effet propre du trait, par exemple −10 % de capacité, ou le ramener à la seule fatigue. |
| 1.10 | ✅ Résolu (Mineur) | Book 01 §3 (acier « Ramollir (forger) 900 à 1 100 °C… Faisable avec : **Forge à soufflet** », palier I, 900 °C max) contre Book 02 §2 (« forge ventilée (≥ 900 °C requis) · Forge II ») et §12.1 | La forge minimale pour travailler l'acier n'est pas la même. | Aligner. La forge ventilée (palier II) est plus cohérente avec 900 à 1 100 °C. |
| 1.11 | ✅ Résolu (Mineur) | Book 02 §8 (« Charbonnière (meule couverte **ou fût**) : palier II ») contre Book 02 §11 et §12.2 (« charbonnière en fût (**palier III**) ») | Le palier de la charbonnière en fût change à l'intérieur du même book. | Garder la meule en palier II et le fût en palier III, et corriger le §8. |
| 1.12 | ✅ Résolu (Mineur) | Book 02 §10 (« Refonte… avec une **forge de palier III** ») | Aucune forge de palier III n'existe. Fondre l'acier demande le four électrique (Book 01 §3, Book 04 §2.1). | Écrire « four électrique (palier III, ⚡) ». |
| 1.13 | ✅ Résolu (Mineur) | Book 04 §2.3 (« Bas fourneau (palier III, 🔥) ») | Le bas fourneau n'apparaît pas dans la progression des Charbonniers (Book 01 §4, palier III). | L'ajouter à la liste du Book 01. |
| 1.14 | ✅ Résolu (Mineur) | Book 07 §3.4 (« La différence entre dépôt et retrait couvre l'autodécharge des réserves ») contre §3.3 (la décharge des bons reflète déjà l'autodécharge des cellules) | L'autodécharge est justifiée deux fois. | Justifier l'écart dépôt/retrait par la **capacité de stockage limitée** et le surplus saisonnier, et non par l'autodécharge. |

---

## 2. Incohérences chiffrées et calculs

| # | Gravité | Où | Problème | Correction proposée |
|---|---|---|---|---|
| 2.1 | ✅ **Résolu** (Important) | Book 01 §7.2 (« Journée type d'hiver, besoin de **2 kWh utiles** (chauffage, cuisson, craft) ») contre Book 10 §4 (chauffage seul : 5 kWh pour la maison de paille, 13 pour la cabane, 31 à 40 pour la pierre) | Le modèle d'équilibrage du Book 01 sous-estime l'énergie d'un facteur 2 à 20. De plus, « Mécanistes : 15 min (pédalage) » pour 2 kWh est impossible : il faudrait ≈ 20 h de pédalage et ≈ 7 000 kcal. Enfin, l'unité « minutes de jeu » est ambiguë (minutes réelles ou minutes de jeu ?). | Refaire le tableau du §7.2 avec les besoins du Book 10. Préciser l'unité (minutes réelles de connexion). Indiquer la source d'énergie de chaque famille pour le chauffage (en pratique, le bois pour tous). |
| 2.2 | ✅ Résolu (Mineur) | Book 01 §6 (couteau : 8 chauffes, 2 h, 600 kcal → **≈ 265 watts**) contre Book 02 §2, §12.1 et §13 (lame de couteau : 5 chauffes, 1 h 30, 450 kcal → **≈ 199 watts**) | Le même objet de référence a deux énergies grises. Autre écart dans le Book 01 §3 : « 10 à 20 kWh_th, soit 1,5 à 2,5 kg de charbon » donne en réalité 1,25 à 2,5 kg. | Reprendre au Book 01 l'exemple du Book 02 (ressort à lames, ≈ 200 watts) et corriger « 1,25 à 2,5 kg ». |
| 2.3 | ✅ Résolu (Mineur) | Book 01 §6 (« Un Charbonnier… dépense **30 % de charbon en moins** ») et Book 02 §12.1 (« ≈ 180 watts ») ; Book 02 §12.4 (mouture « 50 watts (**35** avec le bonus) ») | Un rendement +30 % fait économiser 1 − 1/1,3 ≈ **23 %** de combustible ou de calories, pas 30 %. Le Book 02 §12.1 (Mécaniste ≈ 400) divise correctement par 1,3, mais les autres calculs multiplient par 0,7 : la méthode n'est pas la même partout. | Fixer une seule règle (diviser par 1,3) et l'appliquer partout. Mouture : ≈ 38 au lieu de 35 ; lame Charbonnier : ≈ 185 au lieu de 180. |
| 2.4 | ✅ Résolu (Mineur) | Book 02 §12.3 (« Chargement et défournement : 1 h de travail moyen : **70 watts** ») | Le travail moyen vaut ≈ 250 kcal/h (Book 02 §2), soit 50 watts. Avec ce chiffre, la sortie vaut 126 / 5,6 ≈ **22,5 watts/kg**, et non 26. | Corriger à 50 watts et ≈ 22,5 watts/kg, ou passer en « travail lourd ». |
| 2.5 | ✅ Résolu (Mineur) | Book 02 §12.4 (« Meule à pédale : 1 h, **250 kcal** ») | Pédaler 1 h coûte ≈ 350 kcal (Book 01 §2), soit 70 watts et ≈ 54 avec le bonus. | Aligner sur 350 kcal/h, ou expliquer pourquoi la mouture demande moins d'effort. |
| 2.6 | ✅ Résolu (Mineur) | Book 02 §3 (« Ébullition : ≈ 1 000 Wh_th par litre sur un feu ouvert, soit ≈ 0,25 kg de bois ») ; repris au Book 05 §3 | Porter 1 L d'eau de 15 à 100 °C demande ≈ 100 Wh. Avec le feu de camp à 5 % (Book 01 §3, Book 02 §8), il faut ≈ 2 000 Wh_th, soit ≈ 0,45 kg de bois. Le chiffre de 1 000 Wh_th suppose un rendement de 10 %. | Soit 2 000 Wh_th et ≈ 0,45 kg sur un feu de camp (≈ 0,25 kg sur un réchaud), soit préciser l'installation. L'eau potable passe alors de ≈ 3 à ≈ 4,8 watts/L. |
| 2.7 | ✅ Résolu (Mineur) | Book 11 §9 (Porc : « Engraissement en 6 à 10 mois », « **1 à 2 semaines réelles** ») | 6 mois correspondent à ≈ 2 semaines réelles (Book 01 §2 bis) et 10 mois à ≈ 3,5 semaines. | Écrire « ≈ 2 à 3,5 semaines réelles ». |
| 2.8 | ✅ Résolu (Mineur) | Book 04 §3.7 (« 3 h de surveillance… **≈ 120 watts** ») | 120 watts font 600 kcal, soit 200 kcal/h. La surveillance légère vaut 150 kcal/h ailleurs (Book 04 §2.3 : 8 h = 1 200 kcal ; Book 02 §2). | 90 watts, et une sortie ≈ 175 watts/L. Ou bien préciser une intensité moyenne. |
| 2.9 | ✅ Résolu (Mineur) | Book 02 §2 (« lourde (≈ 300 à 400 kcal/h) ») contre Book 02 §3 (abattage : **500 kcal/h**) | L'abattage sort de l'échelle d'intensité. | Ajouter une intensité « très lourde » (≈ 500 kcal/h) ou élargir la fourchette. |
| 2.10 | ✅ Résolu (Mineur) | Book 04 §2.3 (« ≈ 50 à 100 watts/kg pour de la ferraille récupérée ») contre Book 02 §12.1 (ressort à lames de 0,4 kg = 50 watts) | Cela donne 125 watts/kg pour le ressort, hors de la fourchette annoncée. | Préciser que la fourchette vaut pour la ferraille ordinaire, l'acier à ressort étant plus cher, ou ajuster l'un des deux chiffres. |
| 2.11 | ✅ Résolu (Mineur) | Book 11 §3.2 (« ≈ 50 m² de pommes de terre… tous les 9 jours réels environ… suffisent ») | Le calcul ne tient pas compte de l'hiver, soit une semaine sur quatre sans culture en plein champ. Sur une année de 28 jours, on obtient au mieux ≈ 2 récoltes, soit ≈ 230 000 kcal, pour un besoin de ≈ 350 000 kcal (28 × 12 500). | Écrire « ≈ 75 à 100 m² avec stockage en cave pour l'hiver », ou garder 50 m² en précisant « en saison ». |
| 2.12 | ✅ Résolu (Mineur) | Book 07 §7.2 et §12 (« 100 premiers watts… en moins d'une heure de jeu réelle ») | Avec l'horloge d'action, 1 h de collecte de bois dure 1 minute réelle et rapporte ≈ 80 watts (64 avec la marge du comptoir). La cible est atteinte en quelques minutes réelles, trajet compris : elle ne mesure rien. | Reformuler la cible en heures de jeu, ou viser par exemple « 100 watts nets, trajet et nourriture déduits, en ≈ 10 à 15 min réelles ». |

---

## 3. Problèmes de temps (horloge d'action ou calendrier)

| # | Gravité | Où | Problème | Correction proposée |
|---|---|---|---|---|
| 3.1 | ✅ **Résolu** (Important) | Book 13 §2.1 (« Le temps change à l'échelle de **quelques heures de jeu**… les épisodes… durent **plusieurs jours de jeu** ») contre Book 11 §1 (cultures au calendrier, radis en ≈ 2,5 jours réels) | Une sécheresse ou une vague de froid de « plusieurs jours de jeu » dure ≈ 1 à 2 h réelles, soit moins d'une journée de calendrier. Ses effets sur les cultures, les rivières et la roue hydraulique (Book 13 §4) sont alors négligeables, ou bien on ne sait pas comment les reporter sur le calendrier. | Séparer deux couches : la **météo instantanée** à l'horloge d'action (pluie, brouillard, effet sur la signature) et les **épisodes climatiques** au calendrier (sécheresse, gel tardif, été pourri), qui durent plusieurs jours réels et sont les seuls à agir sur les cultures et l'eau. |
| 3.2 | ✅ **Résolu** (Important) | Book 05 §3 (scorbut « après ≈ 1 à 3 mois sans fruits ni légumes (≈ 2,5 à 7,5 jours réels) ») contre Book 01 §2 bis (« Hors ligne, les besoins du personnage sont suspendus » ; 2 500 kcal par 24 min) | Les carences se comptent au calendrier, mais la nourriture se consomme à l'horloge d'action et seulement en ligne. Un joueur absent une semaine aurait le scorbut sans avoir mangé un seul repas, et un joueur très présent mangerait des dizaines de jours de jeu sans aucun risque. | Compter les carences en **jours de jeu connectés** (horloge d'action). Par exemple, 1 à 3 mois réalistes deviennent 30 à 90 jours de jeu, soit ≈ 12 à 36 h de connexion. |
| 3.3 | ✅ **Résolu** (Important) | Book 01 §2 bis (seuls cas réglés : besoins suspendus, processus passifs qui avancent) ; Book 06 §9.4 (« jamais blessé hors ligne ») ; Book 17 §4 | Plusieurs cas hors ligne ne sont pas définis : la progression d'une **infection** ou de la **fièvre grise** (horloge d'action, Book 05 §5.2 et Book 06 §10), la **consommation de bois** du chauffage, la **nourriture des animaux**, la **clôture électrique** et la **réfrigération** qui consomment des Wh_é, la **décharge** des batteries du joueur. | Ajouter au Book 01 §2 bis un tableau « Hors ligne : ce qui avance, ce qui est gelé ». Par exemple : infection gelée, guérison au calendrier, chauffage et clôture coupés ou consommant à un rythme défini, animaux nourris sur le stock. |
| 3.4 | ✅ Résolu (Mineur) | Book 01 §2 bis (« 1 année = 1 mois réel (1 mois de jeu ≈ 2 jours et demi) ») ; Book 09 §1 (« deux mois réels… huit saisons ») | Quatre saisons d'une semaine font **28 jours**, pas un mois. Les conversions des books utilisent 2,5 jours par mois de jeu (année de 30 jours) au lieu de 2,33, soit un écart de 7 %. Le cycle dure 56 jours, et non deux mois de calendrier (≈ 61 jours). | Écrire « 1 an = 4 semaines = 28 jours réels ; 1 mois de jeu ≈ 2 jours un tiers ; cycle = 8 semaines ». Ajuster les durées si on veut de la précision. |
| 3.5 | ✅ Résolu (Mineur) | Book 01 §2 bis (« moins d'une semaine → horloge d'action. Au-delà, calendrier ») ; Book 05 §4.2 (Contusion : « Quelques jours » dans la colonne « Guérison (**calendrier**) ») | La règle crée un saut : un processus de 6 jours dure 2 h 24 réelles, un processus de 8 jours ≈ 15 h. La contusion, qui dure moins d'une semaine, est quand même rangée au calendrier. | Corriger la contusion (horloge d'action). Signaler le saut dans le Book 01 et le garder comme compromis assumé, ou lisser la frontière. |
| 3.6 | ✅ Résolu (Mineur) : processus passif surveillé, Book 04 §2.5 | Book 04 §2.3 et §2.5 (« 6 à 8 h de ventilation continue… un travail de groupe… relais… pendant des heures ») | À l'horloge d'action, cela fait 6 à 8 **minutes réelles**. L'« événement collectif » et les relais ne sont pas crédibles à cette durée. La même remarque vaut pour le Book 01 §2 ter et le Book 06 §6.2 (« charbonnière… 3 jours de fumée », soit 1 h 12 réelle). | Soit assumer et réécrire le texte (« quelques minutes intenses »), soit faire de la fonte un processus passif **surveillé**, à relancer régulièrement pendant 1 à 2 h réelles. |
| 3.7 | ✅ Résolu (Mineur) | « jour » sans précision : Book 01 §2 (« 400 Wh_é/jour »), §7.4 (« ≥ 1 kWh/jour »), Book 06 §6.2 (« derniers jours »), Book 09 §3.1 (« Jours de jeu sans effondrement »), Book 11 §9 (« 2 à 3 L de lait/jour ») | On ne sait pas s'il s'agit du jour d'action (24 min réelles) ou du jour de calendrier (≈ 1 h 50 réelle). Le rapport entre les deux est ≈ ×4,6. | Toujours préciser : « jour (action) » ou « jour (calendrier) ». |

---

## 4. Références croisées cassées ou fausses

| # | Gravité | Où | Problème | Correction proposée |
|---|---|---|---|---|
| 4.1 | ✅ Résolu (Mineur) | Book 99, points d'accroche (« Odeur des morts : **Piste** “se couvrir de leurs fluides”… Book 06 **§8.3** ») | Le §8.3 du Book 06 parle des corps. Le camouflage est au **§8.5**, et il est **validé** en V1, ce n'est plus une piste. | Écrire « Book 06 §8.5, validé en V1 ». |
| 4.2 | ✅ Résolu (Mineur) | Book 16 §3.3 (« État (Book 06 §4) : Dormant, Errant, **Attentif**, Poursuivant, **Horde** ») | Les états du Book 06 §4 sont : Dormant, Errant, **Attiré**, Poursuivant, **Grégaire**, **Pressant**. | Reprendre les noms du Book 06 et ajouter Grégaire et Pressant. « Horde » est une taille (Book 06 §6.1), pas un état. |
| 4.3 | ✅ Résolu (Mineur) | Book 05 §2 (« La santé utilise les **trois** rythmes du jeu (Book 01 §2 bis) ») | Le Book 01 définit **deux** horloges. L'échelle « aiguë » est propre au Book 05. | Écrire « les deux horloges du jeu (Book 01 §2 bis), plus une échelle aiguë en temps réel ». |
| 4.4 | ✅ Résolu (Mineur) | Book 10 §2.2 (« moisissures, maladies respiratoires (Book 05 §6) ») | Au Book 05 §6, l'affection respiratoire vient des fumées, de la suie et des poussières. L'humidité et les moisissures n'y figurent pas. | Ajouter « moisissures (habitat humide) » aux causes, au Book 05 §6. |

---

## 5. Validé ici, encore ouvert ou en proposition ailleurs

| # | Gravité | Où | Problème | Correction proposée |
|---|---|---|---|---|
| 5.1 | ✅ Résolu (Mineur) | Book 11 §13 (« cohérente avec la taille du terrain **proposée** (≈ 2 500 m²) ») ; Book 01 §8, ligne Terrain (« **Taille fixe** », sans valeur) | Le Book 10 §10 dit « ✅ ≈ 50 × 50 m », et le Book 01 §9 a été coché pendant la relecture. Restent le Book 11 et la table des décisions du Book 01. | Écrire « validée » au Book 11 et ajouter « ≈ 50 × 50 m » à la ligne Terrain du Book 01 §8. |
| 5.2 | ✅ Résolu (Mineur) | Book 08 §4.2, tableau (« Plafond : **Proposition** : au plus ≈ 25 % ») | Le Book 08 §5 dit « ✅ ». | Retirer « Proposition » du tableau. |
| 5.3 | ✅ Résolu (Mineur) | Book 06, glossaire (« Fièvre grise… (**proposition**) ») | Le Book 06 §10 dit « Validé », tout comme le §13 et le Book 05 §13. | Retirer « (proposition) ». |
| 5.4 | ✅ Résolu (Mineur) | Book 02 §17 (« [ ] Signature cumulée… À définir dans un book sur les zombies ») | C'est défini au Book 06 §3.1 (attention = intensité × durée) et au §6.2 (pression de signature). | Cocher la question et renvoyer au Book 06 §3.1 et §6.2. |
| 5.5 | ✅ Résolu (Mineur) | Book 04 §6 (« renvoient à un futur **book sur la santé** ») | Le Book 05 existe. | Cocher la question et renvoyer au Book 05. |
| 5.6 | ✅ Résolu (Mineur) | Book 01 §9 (« [ ] Création de personnage : la famille est-elle définitive ? ») | La question est tranchée pour le changement entre cycles (Book 09 §4, Book 14 §1). | Reformuler : « Peut-on changer de famille **en cours de cycle** ? » |
| 5.7 | ✅ Résolu (Mineur) | Book 01 §9 (« Restent à calibrer… les **frais de garde** ») | Il n'y a plus de frais de garde : le compte est gratuit (Book 07 §4.4) et la décharge les remplace (Book 07 §3.3). | Retirer « frais de garde ». |
| 5.8 | ✅ Résolu (Mineur) : les trois systèmes sont validés | Les **hameaux des familles** sont une « piste » (Book 01 §2 ter, à valider au §9), mais sont cités comme acquis aux Book 02 §9, Book 04 §2.6, Book 05 §8.1, Book 11 §7 et Book 15 §3. Le **modèle des ruines** est une « Proposition » (Book 01 §2 bis, à valider au §9), mais il sert de base aux Book 07 §10 et Book 09 §1.2 et §2.1. La **capacité limitée des comptoirs** est une « Proposition » au Book 02 §15, mais une règle au Book 07 §3.4. | Des systèmes encore à valider servent de base à d'autres books. | Valider ces trois points, ou marquer les passages qui en dépendent. |

---

## 6. Trous de conception

| # | Gravité | Où | Problème | Correction proposée |
|---|---|---|---|---|
| 6.1 | ✅ **Résolu** (Important) | Book 07 §3.1 (le comptoir achète « avec sa trésorerie » ; « ses prix d'achat baissent avec elle ») contre §4.3 (« rachète **toujours**… au moins 0,5× ») ; Book 09 §4 (tous les watts disparaissent à la réinitialisation) | La **trésorerie initiale** des comptoirs n'est définie nulle part, ni au début d'un cycle ni pour un nouveau serveur. Le prix plancher garanti contredit la règle de la trésorerie quand celle-ci est vide. | Définir une dotation de départ des comptoirs, exprimée en Wh stockés (réserves des Compteurs), comptée comme source au Book 07 §7.1. Préciser ce qui se passe quand la trésorerie est vide : plancher suspendu, ou plancher payé par création de watts plafonnée. |
| 6.2 | ✅ Résolu (Mineur) | Book 02 §9, Book 03 §5.5 et Book 07 §10 (« bonus d'enseignement, Book 01 §9 ») | Le bonus n'existe que comme piste dans une question ouverte du Book 01. Seul le Book 09 §3.1 (« Contribuer : enseignement ») le valorise un peu. | Définir la règle, par exemple un gain de rayonnement plus une part de maîtrise pour l'enseignant, ou retirer les renvois. |
| 6.3 | ✅ Résolu (Mineur) : lieu « bord de plage » | Book 02 §6 et Book 11 §11 (le salage est la conservation native des ⚙️ : « Sel (vestige, commerce) ») ; Book 05 §7 (eau salée, solution de réhydratation) | Le sel est indispensable, mais il n'a **aucune source renouvelable**. La conservation des Mécanistes dépend donc d'un stock qui s'épuise. | Ajouter une source (source salée, marais salant sur certaines topologies, commerce régional des Compteurs) ou l'assumer comme un stock. |
| 6.4 | ✅ Résolu (Mineur) : Book 03 §5.6 | Savoirs cités : Forge II (Book 02), Métallurgie II, Électricité II, Chimie I (Book 03), Sidérurgie I à III, Distillation II (Book 04), Médecine I à III (Book 05), Semences I à III, Arboriculture (Book 11), Couture I à III (Book 12), Météo I (Book 13) | Aucune liste de référence des domaines de savoir n'existe. Forge, Métallurgie et Sidérurgie se recoupent. | Ajouter au Book 03 §5 un tableau des domaines et de leurs niveaux. |

---

## 7. Risques d'équilibrage et exploits

| # | Gravité | Où | Problème | Correction proposée |
|---|---|---|---|---|
| 7.1 | ✅ **Résolu** (Bloquant) | Book 01 §6 (« pédaler… légèrement perdant ») ; Book 02 §15 (boucle « Pédaler → déposer : légèrement perdant ») ; Book 07 §3.1 (le pédalage au comptoir **crée** des watts) ; Book 02 §12.4 (pain ≈ 150 watts pour 2 500 kcal) | **Boucle « nourriture → pédalage → watts neufs ».** Si le pain se vend à son énergie grise (cours ≈ 150, achat ≈ 180 au Carrefour), 2 500 kcal permettent ≈ 7 h de pédalage, soit 714 Wh_m, soit **≈ 428 watts créés**. Le gain net est ≈ +250 watts par pain (≈ +80 en été si le taux saisonnier s'applique aussi au Wh_m), en ≈ 7 min réelles, et c'est encore mieux pour un fermier. Le contrôle « légèrement perdant » suppose que la kcal coûte 0,2 watt, alors qu'elle coûte 0,06 à produire. | Trancher le prix de la nourriture (1.2). Puis, au choix : payer le pédalage au comptoir sur la base du coût réel de la kcal (≈ 0,06 × 350 / 100 ≈ 0,2 watt/Wh_m), le **plafonner** par jour, ou ne plus lui faire créer de watts (paiement sur trésorerie comme un service). Revérifier toutes les boucles du Book 02 §15 avec la kcal à 0,06. |
| 7.2 | ✅ **Résolu** (Bloquant) | Book 02 §2 (« recharge solaire » passive, même hors ligne) et §8 (roue hydraulique « 200 à 500 W_m continus », **Passif**) ; Book 01 §2 (« 400 Wh_é/jour ») ; Book 04 §3.9 (biogaz « 1 m³ par jour ») ; Book 17 §4 | **L'horloge de la production continue n'est pas définie.** Si elle suit l'horloge d'action (le monde continue hors ligne), une roue de 500 W donne ≈ 30 kWh par **heure réelle**. Un panneau de 100 W donne ≈ 8 kWh pendant une nuit hors ligne (20 jours d'action), soit ≈ 5 000 à 8 000 watts. Une journée de nourriture vaut 500 watts. La capacité limitée des comptoirs (Book 07 §3.4) ne fait que ralentir cette rente. | Décider que la production continue suit le **calendrier**, ou une puissance « par heure réelle » explicite. Plafonner la production hors ligne par la capacité de stockage du joueur (batteries, qui sont un stock rare). Recalculer les repères du Book 01 §2 et le jalon « ≥ 1 kWh/jour » dans la bonne unité. |

---

## Points vérifiés et cohérents

Ces calculs ont été refaits et tombent juste, à l'arrondi près :

- **Énergie grise des ressources** (Book 02 §3) : bois sec 8, bois vert 5, pierre 3, argile 3,5, calcaire 3,6, sable 1,5, eau 1,2, fibres 25 watts/kg.
- **Charbon de bois** (Book 02 §12.2) : (800 + 240) / 22 kg ≈ 47 watts/kg.
- **Lames** (Book 02 §12.1) : 199, 513 et 500 watts.
- **Fer et acier** (Book 04 §2.3 et §2.4) : ≈ 2 275 watts pour 2,5 kg, soit ≈ 910 watts/kg ; cémentation ≈ 230 watts/kg ; acier ≈ 1 140 watts/kg.
- **Savon et lessive** (Book 04 §3.4) : 230 watts/kg de savon, 115 watts pour la lessive.
- **Alcool** (Book 04 §3.7) : ≈ 4,6 kWh/L, environ 20 fois le prix du bois par kWh.
- **Besoins de chauffage** (Book 10 §4) : cohérents avec U × surface × 15 °C + fuites d'air, et avec le poêle à 60 % (2,64 kWh/kg).
- **Physique des métaux** (Book 01 §3) : les énergies théoriques de fonte du plomb, de l'aluminium et du cuivre sont justes.
- **Stats** (Book 01 §4) : chaque famille fait bien +3 / −3, net 0. L'exemple de la Voltaïque au Book 14 §2.2 respecte toutes les règles.
- **Pédalage** (Book 01 §6) : 350 kcal = 70 watts, 100 Wh_m = 60 watts, 130 Wh_m = 78 watts.
- **Instances** (Book 01 §2 bis) : la formule `1 + ⌊(N + 5) / 10⌋` correspond bien au tableau.
- **Durées converties** (Book 01 §2 bis, Book 05 §2, Book 11 §3.1) : justes à ±7 % (voir 3.4), sauf le porc (2.7).
- **Références croisées** : elles pointent toutes vers la bonne section, sauf celles listées au §4.

---

## Décompte

| Gravité | Nombre |
|---|---|
| Bloquant | 2 |
| Important | 10 |
| Mineur | 39 |
| **Total** | **51** |
