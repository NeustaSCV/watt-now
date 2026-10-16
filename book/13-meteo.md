# Book 13 — La Météo

> Document de conception · version 0.2 · 2026-10-07
> v0.3 (2026-10-16) : §3 bis, la faim de l'hiver et la soif de l'été (0.10.1).
> Statut : **brouillon de travail**.

---

## 1. Principes

1. **La météo est essentielle** : elle touche l'énergie, la santé, l'agriculture, les zombies, la construction et les déplacements.
2. **Elle est imprévisible**, donc une vraie **contrainte**. On ne peut pas tout planifier.
3. **Mais elle se devine** : des signes, des instruments et des bulletins permettent d'anticiper, avec une fiabilité limitée. C'est la même règle que pour les dangers : on prévient ceux qui savent lire les signes (Book 03 §7.3).
4. **Pas de catastrophe arbitraire** : les événements extrêmes sont rares, annoncés par des signes, et leurs dégâts sont toujours réparables.

---

## 2. Comment le temps est généré

### 2.1 Climat et météo

| Notion | Rôle |
|---|---|
| **Climat** | Les moyennes de chaque saison : températures, nombre de jours de pluie, vent dominant (§3) |
| **Météo** | Le temps qu'il fait réellement, tiré au hasard **à partir du climat**, avec de la persistance : une journée pluvieuse a plus de chances d'être suivie d'une autre |
| **Événements** | Phénomènes ponctuels (orage, tempête, grêle) dans le temps qu'il fait, et **épisodes** (sécheresse, canicule, vague de froid, gel tardif…) dans la couche climatique (voir ci-dessous), plus probables à certaines saisons (§4) |

Techniquement, la météo a **deux couches**, qui suivent les deux horloges du jeu (Book 01 §2 bis) :

| Couche | Horloge | Durée | Ce qu'elle règle |
|---|---|---|---|
| **Le temps qu'il fait** : chaîne d'états (ensoleillé, voilé, couvert, pluie, orage, neige, brouillard…) | Action | Change toutes les quelques heures de jeu (quelques minutes réelles) | Ce que vit le joueur : signature, visibilité, froid ressenti, vêtements mouillés, traces dans la neige |
| **Les épisodes climatiques** (sécheresse, période grise, période pluvieuse, vague de froid, gel tardif, canicule) | Calendrier | Plusieurs jours (calendrier), soit de quelques heures à quelques jours réels | L'économie : cultures, rivières, roue hydraulique, production solaire et éolienne, conservation |

- **L'épisode oriente le temps qu'il fait.** La chaîne d'états tire ses probabilités dans le climat de la saison, **modifié par l'épisode en cours**. Pendant une sécheresse, le soleil domine et la pluie est rare et brève. Pendant une période grise, le ciel reste couvert.
- **La production de la base** (solaire, éolien, hydraulique) se calcule sur la couche des épisodes : moyenne de la saison × facteur de l'épisode (Book 01 §2 bis). Elle ne suit ni chaque nuage ni chaque cycle jour/nuit de 24 minutes.
- **Les cultures, les rivières et l'eau** ne réagissent qu'aux épisodes. Une averse de quelques minutes ne sauve pas un potager en pleine sécheresse.

### 2.2 Où s'applique la météo

- **Une météo commune à tout le serveur**, puisque tous les joueurs partagent la même région.
- **Des microclimats** selon les lieux et la topologie du terrain (Book 01 §6 bis) : une cuvette garde le gel, un versant sud se réchauffe vite, une vallée retient le brouillard, une crête prend le vent.

---

## 3. Le climat par saison

| Saison | Températures (jour / nuit) | Pluie | Vent | Événements fréquents |
|---|---|---|---|---|
| **Printemps** | 10–18 °C / 0–8 °C | Fréquente, giboulées | Variable | **Gel tardif**, giboulées de grêle, crues de fonte |
| **Été** | 20–30 °C / 12–18 °C | Rare, orageuse | Faible | **Canicule, sécheresse, orages** |
| **Automne** | 10–18 °C / 3–10 °C | Fréquente, longue | Plus fort | **Tempêtes**, brouillards, premières gelées |
| **Hiver** | −2–7 °C / −10–0 °C | Pluie ou **neige** | Fort | **Vagues de froid, blizzard**, verglas |

---

## 3 bis. Le calendrier des récoltes (décision du 2026-10-08)

**Le calendrier tourne** : 1 an de 365 jours = 4 semaines réelles (Book 01 §2 bis), soit un jour de calendrier toutes les ≈ 1 h 50 réelles. C'est le même pour tout le serveur.
- Le monde a commencé le **1er juin**, à la fin du printemps.
- La date s'affiche en haut à droite, à la place du « Jour N » (le compte des jours de jeu de 24 min passe dans l'infobulle).

**En phase 0a, seules les récoltes suivent le calendrier.** L'herbe, la lumière, la météo et la production solaire restent celles de la fin du printemps (Book 21 §3.6). Les quatre palettes de saison viendront en 0b.

**La faim et la soif suivent aussi les saisons (décision du 2026-10-15, codée en 0.10.1)**, aux vraies dates : **l'hiver** (21 décembre → 20 mars) creuse la **faim**, **l'été** (21 juin → 22 septembre) donne **soif**, en cloche (rien le premier jour, + 25 % au milieu, rien le dernier). Un feu allumé à soi, une forge encore chaude, une charbonnière qui cuit (à 3 m) ou le sommeil dans son abri annulent le surplus de l'hiver. Rien ne s'affiche : ni température, ni vêtements chauds (le détail : Book 05 §3).

| Récolte | Fleurs | Mûr | Fin |
|---|---|---|---|
| Cerises | 1er au 25 avril | 5 juin | 15 juillet |
| Prunes (quetsches) | 25 mars au 20 avril | 15 août | 30 septembre |
| Poires | 1er au 30 avril | 1er août | 31 octobre |
| Pommes | 15 avril au 20 mai | 15 août | 15 novembre |
| Noix | (chatons) | 15 septembre | 31 octobre |
| Cèpes (d'été, puis de Bordeaux) | — | 1er juin | 15 novembre |
| Amanite phalloïde | — | 1er juillet | 15 novembre |
| Amanite tue-mouches | — | 15 août | 30 novembre |

- **Entre la floraison et la maturité**, l'arbre porte des **fruits verts**. Après la saison, il n'a plus de fruits jusqu'à l'année suivante.
- **Hors saison**, viser un fruitier dit où il en est (« En fleurs », « Fruits encore verts », « Plus de fruits cette année »), et l'examen donne les dates.
- **Un champignon hors saison n'est pas sur le terrain.** Les amanites, les plus dangereuses, n'apparaissent qu'à partir de juillet.
- **En saison**, un arbre cueilli se recharge en 1 h réelle (1 h 30 pour le noyer), comme avant.
- **Pas encore de calendrier** pour le reste : bois mort, pierres, joncs et baies se trouvent toute l'année.

## 4. Les effets de la météo

| Temps | Énergie | Santé | Agriculture | Zombies (Book 06) | Autres |
|---|---|---|---|---|---|
| **Soleil** | Solaire 100 % | Coup de chaleur l'été | Croissance +, arrosage + | Normal | Séchage rapide |
| **Voilé** | Solaire ≈ 50 % | — | — | Normal | — |
| **Couvert** | Solaire ≈ 20 % | — | — | Normal | — |
| **Pluie** | Solaire ≈ 10 % ; **hydraulique +** | Vêtements mouillés : froid (Book 12) | Arrosage gratuit ; **mildiou** si chaud (Book 11) | **Bruits −30 %, odeurs −50 %** | Toits de tôle bruyants ; les enduits s'abîment |
| **Orage** | Solaire nul | — | Grêle possible | **Le tonnerre couvre les bruits** : moment idéal pour forger ou tirer | **Foudre** : incendie possible |
| **Brouillard** | Solaire faible | — | — | **Vue très réduite, pour les zombies comme pour les joueurs** | Embuscades en halte |
| **Neige** | Panneaux couverts : 0 % | Froid | Protège les cultures du gel | **Gelés** (Book 06 §5) | **Traces de pas visibles** : on peut être suivi (et suivre) |
| **Vent fort** | **Éolien +** (coupure en tempête) | Froid ressenti + | Casse | **Odeurs portées loin sous le vent** | Le feu se propage vite |
| **Tempête** | Éolienne à l'arrêt | Danger dehors | Dégâts | — | **Toits et protections endommagés** (réparables) |
| **Canicule** | Panneaux moins efficaces | **Déshydratation**, coup de chaleur | Stress hydrique | **Putréfiés** plus nombreux | Les maisons en tôle deviennent des fours (Book 10) |
| **Sécheresse** | **Roue hydraulique ralentie ou à l'arrêt** | Eau rare | Rendement −, arrosage indispensable | — | Sources et rivières basses |
| **Gel** | — | Hypothermie | **Gel des cultures non protégées** | Ralentis | Eau gelée dans les fûts |
| **Crue** | Roue hydraulique **en danger** | Noyade | Champs inondés | Zombies emportés | Lieux de rivière inaccessibles |

> Dans ce tableau, les effets sur l'**énergie de la base**, l'**agriculture** et l'eau viennent des **épisodes** (calendrier). Les effets sur la santé, les zombies et la signature viennent du **temps qu'il fait** (action).

> La météo **module la signature** : la pluie, l'orage et le brouillard sont des alliés pour qui doit faire du bruit ; le vent, la neige et la nuit claire sont des ennemis.

---

## 5. Prévoir le temps

| Moyen | Horizon | Fiabilité indicative | Comment l'obtenir |
|---|---|---|---|
| **Lire le ciel** (nuages, vent, comportement des animaux) | Quelques heures de jeu | ≈ 60 % | Savoir : Météo I (PER aide) |
| **Baromètre** | 12 à 24 h de jeu | ≈ 70 % | Vestige rare |
| **Station météo bricolée** (baromètre, anémomètre, girouette) | 24 h de jeu | ≈ 75 % | ⚡ (capteurs de vestige) |
| **Bulletin radio des Compteurs** | 24 à 48 h de jeu | ≈ 80 % | **Radio** (⚡) ou affichage au comptoir |
| **Almanach, dictons** | Saison | Faible | Livres de vestige : plus amusants qu'utiles |

> Aucune prévision n'est sûre à 100 %. Les **événements extrêmes** sont toujours **précédés de signes** (chute du baromètre, ciel particulier, chaleur lourde), mais un joueur qui ne regarde rien sera surpris.

---

## 6. La météo et les familles

| | 🔥 Charbonniers | ⚡ Voltaïques | ⚙️ Mécanistes |
|---|---|---|---|
| **Météo favorable** | Hiver (résistance au froid, chaleur abondante) | Été ensoleillé, vent régulier | Printemps et automne pluvieux (rivières pleines, cultures) |
| **Météo défavorable** | Sécheresse (risque d'incendie), vent qui porte la fumée | **Hiver gris** : batteries vides | **Sécheresse** (roue à l'arrêt, cultures), gel tardif |
| **Atout de prévision** | — | **Radio, station météo** : prévisions les plus fiables | Lire le ciel (savoir de famille agricole) |

> La météo crée des **périodes favorables différentes pour chaque famille**, ce qui fait varier les prix (Book 07 §6) et pousse à l'entraide.

---

## 7. Questions ouvertes

- [x] **Horloges de la météo :** ✅ deux couches, le temps qu'il fait à l'horloge d'action, les épisodes climatiques au calendrier (§2.1).
- [ ] **Fréquence des événements extrêmes :** combien par saison, pour qu'ils restent marquants sans devenir une corvée ?
- [ ] **Dégâts des tempêtes :** limités aux toits et aux protections, toujours réparables. À valider (cohérent avec Book 06 §9).
- [ ] **Incendie par la foudre :** possible hors ligne ? (Proposition : non, comme pour les autres incendies, Book 10 §10.)
- [ ] **Bulletin des Compteurs :** gratuit au comptoir, ou payant ? Accessible à la radio seulement pour les Voltaïques ?
- [ ] **Climat régional :** un seul climat (tempéré) pour tous les serveurs, ou des serveurs à climats différents (montagne, côte) ?
