# Book 05 — Santé et Soins

> Document de conception · version 0.4 · 2026-10-07
> Statut : **brouillon de travail**. Les effets médicaux sont **simplifiés pour le jeu**. Ils restent crédibles dans leurs grandes lignes, mais ce book n'est pas un guide de soins réel.
> S'appuie sur les books [01](01-les-trois-feux.md), [02](02-crafting.md), [03](03-bibliotheque-et-savoir.md) et [04](04-siderurgie-et-chimie.md).

---

## 1. Principes

1. **Pas de barre de vie magique.** Le corps est un ensemble de besoins et de blessures. On meurt de froid, de soif, d'une hémorragie ou d'une infection, pas d'un compteur qui tombe à zéro.
2. **La prévention coûte moins cher que la guérison.** Eau bouillie, savon, vêtements chauds, nourriture variée : l'essentiel de la santé se joue avant la blessure.
3. **Soigner coûte de l'énergie, des matières et du savoir**, comme tout le reste. L'eau bouillie coûte du bois, l'alcool coûte des fruits et un alambic, le froid médical coûte des Wh_é.
4. **Les médicaments modernes sont un stock.** Antibiotiques et antalgiques ne se fabriquent pas : ils se trouvent, se périment et s'épuisent, comme l'électronique.
5. **Le danger est toujours annoncé** à qui a le savoir ou la perception (Book 03 §7.3). Pas de mort par un mal invisible.
6. **Une blessure change la façon de jouer, elle ne l'empêche pas.** Une jambe cassée interdit les longs trajets, pas le travail à l'atelier.
7. **On se soigne mieux à plusieurs.** Soigner un autre est plus efficace que se soigner soi-même : c'est un rôle social à part entière.

---

## 2. Trois échelles de temps

La santé utilise les deux horloges du jeu (Book 01 §2 bis), plus une échelle aiguë en temps réel.

| Échelle | Rythme | Ce qu'elle règle | Exemples |
|---|---|---|---|
| **Aiguë** | Temps réel, réglé pour le gameplay | Urgences pendant l'action | Saignement fort : quelques minutes réelles pour le stopper |
| **Horloge d'action** | 1 h de jeu = 1 min réelle | Besoins et maladies qui évoluent en heures ou en jours | Soif, faim, sommeil, progression d'une infection |
| **Calendrier** | 1 saison = 1 semaine réelle | Guérisons longues | Cicatrisation, consolidation d'une fracture, convalescence |

| Situation (réaliste) | Échelle | Durée réelle en jeu |
|---|---|---|
| Hémorragie forte non traitée | Aiguë | ≈ 2 à 3 min pour agir |
| 3 jours sans boire | Action | ≈ 72 min de connexion |
| Infection qui s'aggrave en 2 à 3 jours | Action | ≈ 48 à 72 min |
| Nuit de sommeil (8 h) | Action | 8 min |
| Coupure qui cicatrise (1 à 2 semaines) | Calendrier | ≈ 14 à 28 h |
| Fracture qui se consolide (6 à 8 semaines) | Calendrier | ≈ 3 jours et demi à 4 jours et demi |

> Rappel : **hors ligne, tout ce qui suit l'horloge d'action est gelé** : besoins, carences, saignement, infection, fièvre grise, maladies (Book 01 §2 bis). En revanche, la **guérison continue** au calendrier, si la blessure est soignée et non infectée : une fracture sous attelle se consolide pendant que le joueur dort dans la vraie vie.

---

## 3. Les besoins

| Besoin | Référence | Ce qui l'augmente | Si on le néglige |
|---|---|---|---|
| **Nourriture** | 2 500 kcal par jour de jeu | Effort (Book 02 §2), froid, Mécanistes +15 % | Faiblesse (FOR, END), puis amaigrissement, puis mort (plusieurs semaines réalistes) |
| **Variété** | Quatre groupes : féculents, protéines, fruits et légumes, graisses | — | **Carences** : fatigue, guérison lente, **scorbut** après ≈ 1 à 3 mois sans fruits ni légumes, comptés en jours de jeu connectés (≈ 30 à 90 jours, soit ≈ 12 à 36 h de connexion) |
| **Eau** | ≈ 2,5 L par jour | Chaleur, effort, fièvre, diarrhée | Soif, confusion, puis mort en ≈ 3 jours |
| **Température** | Neutre | Vent, pluie, hiver, vêtements mouillés | Frissons, maladresse, **hypothermie** ; ou coup de chaleur l'été |
| **Sommeil** | ≈ 8 h par jour | Effort, maladie | Fatigue : erreurs de crafting, perception réduite |
| **Hygiène** | Propre | Forge, tannage, combat, fouille, fumier, **camouflage d'odeur** (Book 06 §8.5) | **Multiplie le risque d'infection** de toute plaie (§5) |

### Quelques règles pratiques

- **Les carences se comptent en jours de jeu connectés** (horloge d'action), comme les repas : la variété se mesure sur une fenêtre glissante des repas récents. Elles n'avancent jamais hors ligne.
- **Se déconnecter dans son lit** compte comme une nuit complète. Le joueur n'a pas à regarder son personnage dormir.
- **L'eau non potable** n'est jamais neutre : elle donne un risque de **dysenterie** (§6). L'ébullition coûte ≈ 0,45 kg de bois par litre sur un feu de camp, ≈ 0,25 kg sur un réchaud ou un poêle (Book 02 §3).
- **Le froid coûte de l'énergie :** un abri chauffé consomme du bois (🔥), de l'électricité (⚡, rare et cher) ou s'isole mieux (paille, terre, laine). Les Charbonniers résistent mieux au froid (Book 01, *Peau tannée*).
- **La variété** fait pousser les joueurs à commercer : un Charbonnier fumeur de viande a besoin des légumes d'un Mécaniste.

> **Décision (2026-10-08) : des besoins plus lents, une nourriture qui désaltère, des plats qui nourrissent mieux.**
> - **Rythmes de la 0a** (réglables à chaud, Book 21 §3.9) :
>   - au rythme réel, une réserve pleine ne tenait que 24 min réelles : trop vite pour jouer ;
>   - la faim et la soif passent à **0,35** : une réserve pleine tient ≈ 70 min ;
>   - la fatigue passe à **0,4** : on est épuisé après ≈ 40 min éveillé.
> - **Manger désaltère**, à la vraie teneur en eau des aliments :
>   - une pomme ≈ 0,13 L, une poire 0,15 L, des baies 0,2 L, une conserve 0,3 L, des pommes cuites 0,3 L ;
>   - les noix sont presque sèches.
>   - Rassasié, on ne mange plus, sauf un aliment juteux quand on a soif.
> - **Les plats cuisinés au feu** (Book 11 §11) nourrissent mieux que leurs ingrédients crus :
>   - **+25 % d'énergie** : la cuisson rend les aliments plus digestes ;
>   - **quelques points de santé** rendus : le réconfort d'un vrai repas ;
>   - **ça cale** : la faim revient deux fois moins vite pendant 6 heures de jeu.
>   - Exemple : **volaille aux cèpes**, ≈ 590 kcal et +10 de santé.

---

## 4. Les blessures

### 4.1 Localisation

Les blessures sont **localisées** sur sept zones : tête, torse, ventre, bras gauche, bras droit, jambe gauche, jambe droite. La zone détermine l'effet :

| Zone touchée | Effet typique |
|---|---|
| Bras | Crafting plus lent, armes à deux mains difficiles |
| Jambes | Déplacement ralenti, pas de sprint, trajets longs impossibles si grave |
| Tête | Vision ou perception réduites, confusion |
| Torse, ventre | Endurance réduite, saignements plus dangereux |

### 4.2 Types de blessures

| Blessure | Causes typiques | Effets | Premiers soins | Soins complets | Guérison (calendrier) |
|---|---|---|---|---|---|
| **Coupure** | Outils, verre, lames | Saignement léger | Nettoyer, pansement | — | 1 à 2 semaines (14 à 28 h) |
| **Lacération profonde** | Armes, accidents | Saignement fort | **Compression**, garrot si membre | **Suture** | 2 à 3 semaines |
| **Contusion** | Chocs, chutes, coups | Douleur | Repos, froid | — | Quelques jours (**horloge d'action** : ≈ 1 à 2 h de connexion) |
| **Entorse** | Chute, terrain accidenté | Jambe ou poignet affaibli | Bandage serré, repos | — | 1 à 3 semaines |
| **Fracture** | Chute, coup violent, accident de forge | Membre inutilisable sans attelle | **Attelle** | **Plâtre** (Book 04 §3.5) | 6 à 8 semaines (3,5 à 4,5 jours réels) |
| **Brûlure** | Forge, feu, chaux vive, acide | Douleur, risque d'infection élevé | Refroidir à l'eau propre, couvrir | Pansements propres renouvelés | 1 à 4 semaines |
| **Brûlure chimique** | Électrolyte, lessive, chaux | Comme une brûlure, et la substance continue d'agir | **Rincer longuement à l'eau** | Comme une brûlure | 1 à 4 semaines |
| **Perforation** | Flèche, carreau, balle, clou | Saignement, risque d'infection élevé | Compression, **ne pas retirer** l'objet sans savoir | Extraction (Médecine II), suture | 2 à 4 semaines |
| **Morsure** | Animal, humain, zombie | Plaie souillée : **risque d'infection très élevé** | Nettoyer abondamment | Nettoyage profond, surveillance | 1 à 3 semaines |

### 4.3 Le saignement

| Niveau | Délai pour agir (aigu) | Ce qui l'arrête |
|---|---|---|
| Léger | Aucun (s'arrête seul, lentement) | Pansement |
| Fort | ≈ 2 à 3 min réelles | Compression ferme, pansement compressif |
| Très fort (membre) | ≈ 1 min réelle | **Garrot**, puis soins complets rapides |

> Un garrot sauve une vie mais ne se garde pas indéfiniment : il faut ensuite des soins complets (suture) dans un délai limité, sinon le membre est durablement affaibli.

### 4.4 La douleur

La douleur réduit la précision, la vitesse de crafting et la qualité du sommeil. Elle se traite par :

- le **repos** et l'immobilisation (attelle) ;
- l'**écorce de saule** en décoction : effet faible mais réel ;
- les **antalgiques** de vestige (paracétamol, ibuprofène) : efficaces, rares, périssables.

---

## 5. L'infection

C'est le **cœur du système de santé** : la plupart des morts « lentes » viennent d'une plaie mal soignée.

### 5.1 Le risque

Chaque plaie reçoit un **risque d'infection**, calculé ainsi :

```
risque = risque de base du type de plaie
       × saleté (hygiène du blessé, lieu, objet en cause)
       ÷ qualité du nettoyage et du pansement
```

| Facteur | Augmente le risque | Diminue le risque |
|---|---|---|
| Type de plaie | Morsure, perforation, brûlure | Coupure nette |
| Saleté | Terre, fumier, rouille sur une plaie, mains sales, plaie restée à l'air | Hygiène correcte (savon) |
| Nettoyage | Aucun, eau non potable | **Eau bouillie, eau salée bouillie, savon, alcool ≥ 70 %, miel** |
| Pansement | Aucun, tissu sale | Tissu **bouilli**, renouvelé |

### 5.2 La progression

```
plaie ──► inflammation ──► infection locale ──► infection générale ──► mort
         (rougeur,         (pus, fièvre           (forte fièvre,
          chaleur)          légère)                confusion)
```

- Chaque étape dure de quelques heures à quelques jours de jeu (horloge d'action : **de quelques minutes à environ une heure réelle**). **Hors ligne, la progression est gelée** (Book 01 §2 bis), et une plaie infectée ne cicatrise pas.
- Chaque étape est **visible** (symptômes) et laisse le temps d'agir.
- On peut revenir en arrière à chaque étape, mais les remèdes nécessaires sont de plus en plus lourds.

| Étape | Traitement artisanal | Traitement de vestige |
|---|---|---|
| Inflammation | Nettoyage, pansement propre, repos | Antiseptique (bétadine, chlorhexidine) |
| Infection locale | Nettoyage répété, **drainage** (Médecine II), miel, alcool | Antibiotiques |
| Infection générale | Très faibles chances sans médicament | **Antibiotiques**, repos, eau, chaleur |

### 5.3 Le tétanos

Une plaie souillée de **terre** (piqûre de clou dans un champ, morsure, blessure de jardin) peut donner le tétanos : raideurs, puis spasmes, souvent mortel sans traitement.

- Prévention : le **vaccin antitétanique** de vestige (rare, se conserve **au froid**, donc chez les Voltaïques), qui protège pour une longue durée.
- Sans vaccin : nettoyage soigneux des plaies souillées. Le risque reste faible mais réel.

---

## 6. Les maladies

| Maladie | Cause | Symptômes | Traitement | Prévention |
|---|---|---|---|---|
| **Dysenterie** | Eau ou aliments contaminés | Diarrhée, **déshydratation rapide** | **Solution de réhydratation** (eau bouillie + sel + sucre), repos | Eau bouillie ou filtrée, hygiène |
| **Intoxication alimentaire** | Viande avariée, conserve gonflée | Vomissements, faiblesse | Réhydratation, repos | **Conservation** (fumage, réfrigération, salage, Book 02 §6) |
| **Rhume, grippe** | Froid, fatigue, contact | Fièvre, fatigue | Repos, chaleur, eau | Vêtements secs, sommeil |
| **Pneumonie** | Grippe négligée, froid humide | Forte fièvre, essoufflement | Antibiotiques, repos au chaud | Ne pas négliger une grippe |
| **Scorbut** | Pas de fruits ni de légumes pendant des mois | Fatigue, gencives, plaies qui ne guérissent pas | Fruits, légumes, choucroute, aiguilles de pin en infusion | Variété alimentaire |
| **Affection respiratoire** | Fumées, suie, poussières (forge, charbonnière, ruines), **moisissures** (habitat humide, Book 10 §2.2) | Toux, endurance réduite | Éloignement, repos | **Masque** (tissu + charbon), ventilation. Lié au trait *Poumons de suie* (🔥). |
| **Intoxication chimique** | Fumées de plastique, têtes de distillation, contact avec l'acide | Selon le produit | Air frais, rinçage, repos | Savoir (Book 04 §3.2) |

**Contagion :** les maladies transmissibles (grippe, dysenterie) peuvent passer d'un joueur à l'autre, mais **seulement en cas de contact prolongé** : vivre sur le même terrain, partager l'eau ou la nourriture. Une rencontre dans une halte ne transmet rien. (À valider.)

### 6 bis. Les champignons toxiques (décision du 2026-10-08, phase 0a)

Un champignon toxique n'a **pas mauvais goût** : on ne sent rien en le mangeant. Les symptômes viennent plus tard, comme dans la réalité (1 h de jeu = 1 min réelle) :

| Champignon | Délai avant les symptômes | Symptômes en jeu | Issue |
|---|---|---|---|
| **Amanite tue-mouches** | 30 min à 3 h dans la réalité ; **1 min réelle** en jeu | Vomissements, délire : pendant 2 min réelles, on perd de l'eau et ≈ 18 points de santé | On s'en remet |
| **Amanite phalloïde** | 6 à 12 h sans rien sentir dans la réalité ; **8 min réelles** en jeu | Crampes, vomissements, puis le foie lâche : pendant 4 min, la santé fond (0,5 point par seconde) | **Effondrement** presque certain (§10.3) |

- À l'arrivée des symptômes, un message les décrit et nomme le coupable. Une puce « Empoisonné » s'affiche sous les jauges.
- Tant qu'ils durent, la santé ne remonte pas.
- **Pas d'antidote en 0a.** Dans la réalité, on traite la phalloïde à l'hôpital (silibinine, greffe du foie) : à l'infirmerie (§8.4), plus tard. Le seul vrai remède est la **prévention** : savoir reconnaître (Book 11 §10).
- Si les symptômes mènent à l'effondrement, le message en donne la cause : « Le poison t'a terrassé. »

---

## 7. Le matériel de soin

### 7.1 Ce qu'on fabrique

| Produit | Recette (résumé) | Usage | Famille la plus à l'aise |
|---|---|---|---|
| **Eau bouillie** | Eau + feu | Boire, nettoyer les plaies | Tous |
| **Eau salée bouillie** | Eau bouillie + sel | Nettoyer les plaies | Tous |
| **Pansements propres** | Tissu de coton ou de lin **bouilli**, séché | Couvrir les plaies | Tous |
| **Bandage** | Tissu en bandes | Compression, maintien | Tous |
| **Garrot** | Sangle + bâton | Hémorragie d'un membre | Tous |
| **Attelle** | Planchettes + bandages | Fracture, entorse | ⚙️ |
| **Plâtre** | Plâtre (Book 04 §3.5) + bandes | Fracture | 🔥 |
| **Fil de suture** | Fil de nylon (vestige), crin ou boyau préparé, aiguille fine | Fermer une plaie | ⚙️ (fibres, boyaux) |
| **Alcool à 70 %** | Distillation (Book 04 §3.7) | Désinfection | 🔥 |
| **Savon** | Saponification (Book 04 §3.4) | Hygiène, nettoyage | ⚙️ (graisses d'élevage) |
| **Miel** | Ruche | Pansement antiseptique | ⚙️ |
| **Solution de réhydratation** | Eau bouillie + sel + sucre | Dysenterie, déshydratation | Tous |
| **Décoction d'écorce de saule** | Écorce + eau bouillie | Douleur et fièvre (effet faible) | ⚙️ |
| **Masque filtrant** | Tissu + charbon de bois broyé | Fumées, suie | 🔥 |

### 7.2 Ce qu'on trouve (stock)

| Vestige | Effet | Conservation |
|---|---|---|
| **Antibiotiques** | Traitent les infections | **Se périment** : efficacité qui baisse avec le temps |
| **Antalgiques** (paracétamol, ibuprofène) | Douleur, fièvre | Se périment lentement |
| **Antiseptiques** (bétadine, chlorhexidine) | Nettoyage des plaies, très efficace | Longue |
| **Vaccin antitétanique** | Protection durable | **Au froid uniquement** (⚡) |
| **Kit de suture, bandes stériles** | Soins de meilleure qualité | Longue |
| **Comprimés de purification d'eau** | Eau potable sans bois | Longue |
| **Livres de médecine** | Savoir (Médecine I à III) | — |

> **La pharmacie est une ruine de grande valeur.** Les antibiotiques ne se fabriquent pas dans le jeu (une production artisanale fiable n'est pas crédible). Leur stock baisse sur tout le serveur, comme celui de l'électronique. Ils sont l'un des biens les plus chers des comptoirs.

### 7.3 Le froid médical (⚡)

Certains produits (vaccins, certains médicaments) ne se conservent qu'au **réfrigérateur**. C'est un **domaine des Voltaïques** : ils sont les seuls à pouvoir stocker durablement ce qui se garde au froid, ce qui en fait les dépositaires naturels des pharmacies d'un groupe.

---

## 8. Soigner

### 8.1 Le savoir médical

| Savoir | Permet | Source typique |
|---|---|---|
| **Base** (tous) | Nettoyer, panser, comprimer, garrot, repos | — |
| **Médecine I** | Reconnaître une infection et ses étapes, attelle, suture simple, réhydratation | Manuel de secourisme, PNJ |
| **Médecine II** | Plâtre, drainage d'une infection, extraction d'un projectile, doser les médicaments | Livre de médecine, hameau |
| **Médecine III** | Soins graves, meilleures chances face à une infection générale, chirurgie de terrain | Maîtrise par la pratique |

### 8.2 Le diagnostic

Comme pour les matériaux (Book 03 §5), le joueur voit d'abord des **symptômes** et non un nom de maladie :

| Ce que voit un joueur sans savoir | Ce que voit un joueur avec Médecine I |
|---|---|
| « Plaie rouge et chaude, fièvre légère » | « Infection locale, bras gauche. À nettoyer et drainer. » |
| « Diarrhée, soif » | « Dysenterie. Réhydrater, eau bouillie. » |

### 8.3 Se soigner ou être soigné

| Situation | Efficacité |
|---|---|
| Soigner quelqu'un d'autre | **100 %** |
| Se soigner soi-même | ≈ 60 % : impossible de suturer correctement son propre dos, de poser une attelle sur son propre bras… |
| Être soigné dans une **infirmerie** | **+25 %** et guérison plus rapide |

### 8.4 L'infirmerie

Installation à construire sur son terrain (palier II) :

- un lit propre (repos, convalescence) ;
- de l'eau bouillie disponible ;
- de la **lumière** pour soigner la nuit (⚡) ;
- de la **chaleur** (🔥) ;
- des surfaces lavables (chaux, Book 04 §3.5).

### 8.5 Les soins payants

Le **PNJ soignant** des comptoirs propose des soins contre des wotts. C'est cher, mais toujours disponible. Les joueurs qui ont le savoir médical peuvent proposer le même service, moins cher.

---

## 9. Les familles et la santé

| | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **Atout** | Résistance au froid. Fabriquent l'alcool, le plâtre, les masques. | **Froid médical** (vaccins, médicaments), lumière de l'infirmerie | Nourriture variée (potager), savon, miel, plantes, attelles, fils |
| **Point faible** | **Poumons de suie** : affections respiratoires | **Habitués aux machines** : se fatiguent vite aux travaux lourds | **Gros mangeurs** : la faim arrive plus vite |

> Comme pour le crafting, chaque famille couvre une partie de la santé. Un groupe qui réunit les trois est bien mieux soigné qu'un joueur seul.

---

## 10. La mort

### 10.1 Rappel des règles décidées

- À la mort, le joueur **perd son inventaire courant** et **revient à sa base** (Book 01 §8).
- Le **savoir est conservé** (Book 03 §5.5).

### 10.2 Le problème : la mort ne doit pas soigner

Si l'on revient à la base en pleine santé, mourir devient **le meilleur remède**. Un joueur avec une jambe cassée (4 jours de consolidation) aurait intérêt à se laisser mourir, inventaire vide, sur son terrain.

### 10.3 Règle validée : l'effondrement

On présente la mort comme un **effondrement** : le personnage tombe, perd ce qu'il portait, et se réveille chez lui (ramené par des inconnus, ou revenu tant bien que mal).

| Au retour | Règle |
|---|---|
| Inventaire courant | **Perdu** (reste sur place, pillable) |
| Savoir | Conservé |
| Blessures en cours (fracture, plaie) | **Conservées**, mais **stabilisées** : le saignement est arrêté |
| Infection générale, maladie grave | Ramenée à l'étape précédente (le personnage a survécu de justesse) |
| Faim, soif, fatigue | Remises à un niveau bas (≈ 30 %) |
| **Convalescence** | Malus de FOR et d'END pendant ≈ 1 jour de jeu (24 min réelles) |

> Résultat : mourir n'est jamais un raccourci. On garde ses problèmes, on y ajoute la perte de son équipement et une convalescence.

---

## 11. L'interface

- **Une silhouette** avec les sept zones : chaque blessure y apparaît avec une icône (coupure, fracture, brûlure…) et une couleur (gravité, infection).
- **Les besoins** en jauges simples : nourriture, eau, température, sommeil, hygiène.
- **Les symptômes** en langage courant, et le diagnostic quand le joueur a le savoir.
- **Le carnet médical** dans le carnet du joueur : maladies déjà eues, vaccins, allergies éventuelles.
- **Les urgences** (saignement fort) sont signalées clairement, avec l'action à faire.

---

## 12. Équilibrage

- **Temps passé à se soigner :** la santé (soins, eau, nourriture, sommeil compris) ne doit pas dépasser **≈ 15 à 20 % du temps de jeu** d'un joueur prudent. Au-delà, elle devient une corvée.
- **Pas d'immobilisation longue :** aucune blessure ne doit empêcher de jouer. Elle change le type d'activité (crafting à la base plutôt qu'expédition), avec des malus.
- **Les erreurs coûtent, l'ignorance n'est pas punie sans prévenir :** chaque danger a un signe visible avant de devenir grave.
- **Les médicaments de vestige sont un luxe, pas une obligation :** un joueur prudent sans antibiotiques doit pouvoir survivre, grâce à l'hygiène et aux soins artisanaux. Les antibiotiques sauvent ceux qui ont pris des risques ou n'ont pas eu de chance.

---

## 13. Questions ouvertes

- [x] **Effondrement :** ✅ validé. Mourir n'est jamais un raccourci (§10.3).
- [x] **Morsure de zombie :** ✅ plaie très souillée + **fièvre grise** (Book 06 §10). Variantes par sang en V2 (Book 99).
- [ ] **Contagion entre joueurs :** valider la règle « contact prolongé uniquement ».
- [ ] **Variété alimentaire :** quatre groupes suffisent-ils, ou faut-il simplifier encore ?
- [ ] **Santé mentale et moral :** faut-il une jauge de moral (isolement, nuit, deuil, alcool) ? Elle ajoute de la profondeur, mais aussi de la gestion.
- [ ] **Péremption des médicaments :** à quel rythme baisse leur efficacité ?

---

## Glossaire

- **Échelle aiguë** : urgences réglées en temps réel pour le gameplay (saignement fort).
- **Risque d'infection** : probabilité qu'une plaie s'infecte, selon son type, la saleté et la qualité des soins.
- **Effondrement** : forme que prend la mort dans le jeu. On perd son inventaire, on garde ses blessures stabilisées et son savoir.
- **Convalescence** : période de malus après un effondrement ou une maladie grave.
- **Infirmerie** : installation qui améliore l'efficacité des soins et la guérison.
- **Solution de réhydratation** : eau bouillie, sel et sucre, contre la déshydratation due à la diarrhée.
