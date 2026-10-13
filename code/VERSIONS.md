# Les versions de *Watt Now?*

Le numéro est dans `commun/src/version.ts` (et `package.json`). Il s'affiche à l'accueil et dans le jeu (en haut à droite, à côté des images par seconde), et `/api/sante` le donne. Sur le Pi, chaque image Docker porte son numéro ; `watt-now:courante` est celle qui tourne.

**Revenir à la version d'avant**, sur le Pi :

```bash
cd ~/watt-now && docker tag watt-now:<version> watt-now:courante && docker compose up -d
```

(La version 0 s'appelle `watt-now:0a`.) Les données des joueurs ne bougent pas.

---

## 0.8.4 · prête à déployer

- **Se dégager, enfin faisable** : quand un Éteint te tient, tu ne frappes plus. A sert à se dégager, comme B, et **deux appuis suffisent**, même essoufflé (avant : six sur B, neuf essoufflé). Aucune arme ne libère d'un coup, la matraque non plus.
- **La saisie du tutoriel** : frapper pendant la saisie ne fait plus surgir un autre Éteint dans ton dos à chaque coup. Avant, ils s'accumulaient jusqu'à trois, et l'on s'effondrait.
- **Partir de chez soi** : sur ton terrain, tu ouvres la carte de n'importe où et tu pars, sans chercher le bout du chemin. Ailleurs, il faut toujours aller jusqu'à la sortie. On ne part pas quand un Éteint te tient.
- **L'image sur téléphone** : si tu tournes le téléphone pendant l'accueil, l'image n'arrive plus déformée sur le terrain.

## 0.8.3 · déployée le 2026-10-13

- **La glaise du gué, bien en vue** : la berge de glaise est maintenant au milieu de la vase, à découvert. Plus d'arbre au-dessus pour te cacher pendant que tu creuses.
- **Le Moulin retouché** : le chemin du jardin est dégagé derrière le magasin, la planche du bief est plus large, et les portes intérieures du logis et des dépendances aussi. Le bord du lot se voit enfin : une haie au nord et à l'ouest, un muret de pierres au sud et à l'est, plus de mur invisible. Dans le couloir du rouet, le rouet et sa lanterne s'effacent pour te laisser voir où tu marches.
- **Le Moulin à l'écran** : une fois déverrouillée, la grande porte se voit ouverte, même tout près, et ce que tu emportes disparaît de sa place (avant, rien ne changeait à l'écran).
- **L'accueil sur téléphone couché** : l'image et le texte se mettent côte à côte, l'image entière. Ton personnage porte dès le premier écran la couleur de cheveux que tu as choisie, et l'accueil charge moins de choses.
- **Rien n'est perdu** : ta partie de la 0.8.2 se relit telle quelle, ce que tu as construit et ce que tu portes.

---

## 0.8.2 · déployée le 2026-10-13

- **Le coffre et la décharge répondent de nouveau** : depuis la 0.8, leur panneau s'ouvrait mais restait sourd, au doigt comme à la souris (ni choisir un objet, ni le déplacer, ni fermer). Corrigé, pour le coffre, le coffre cerclé, le râtelier et la décharge.
- **La vue d'ensemble à l'arrivée** : en arrivant à la station, au gué, à la Coopérative, au Moulin ou chez toi au retour d'une sortie, tu vois tout le lieu de loin, toits compris, le jeu en pause. Une touche ou un toucher, et la vue descend sur ton personnage. Pas de vue d'ensemble quand tu te reconnectes sur place.
- **Le banc se comprend enfin** : il fait passer le courant de sa batterie, la batterie de voiture de la ruine, dans ce que tu portes. Sa fiche a une ligne par chose qui se charge, avec son niveau et un bouton « Charger ». Le panneau la remplit au soleil, un pédalier à moins de 3 m quand on pédale, la manivelle de la lampe à dynamo lentement. Et tu peux l'échanger contre une batterie de ton sac.
- **Le gué plus riche** : des branches, quelques bûches, des pierres sur les pistes et des déchets le long des berges, qui reviennent en 30 min. La glaise est au milieu de la berge, bien en vue. Le bac se hale dès qu'on pose le pied dessus. Et quand le radier est noyé, une ligne te le dit : le bac passe toujours.
- **Fabriquer s'allège** : une seule corde d'arc (3 ficelles ou une corde) et une seule matraque électrique (un pack de cellules ou la petite batterie). Le flash jetable donne un petit condensateur, la raquette à moustiques un condensateur moyen : l'un ou l'autre fait le module de décharge, qui prend son étoile. La matraque de fortune prend le petit condensateur.
- **Les canettes écrasées** se démontent par trois en une chute d'aluminium ; les boîtes de conserve vides restent des boîtes. **Remmancher** une hache ou un marteau se fait près d'un établi.
- **Les armes de métier se découvrent avec le meuble complet** : rien dans Fabriquer, pas même une silhouette, tant que ton banc n'a pas son panneau, ta forge son enclume ou ton pédalier son alternateur. Un meuble d'une autre famille appris (leçon, manuel) te sert aussi.
- **« Un vrai lit »** vient juste après le coffre dans « S'installer » : l'abri garni avant l'abri fermé.
- **Le sac et l'écran** : l'arme en main et le sac à dos porté ont leur marque. « Tu y penses » ne cache plus rien et part seul. Le cercle de fouille se remplit en bleu, même en basse qualité. Sur ordinateur, l'aide des touches tient dans un cadre en bas à gauche, avec ses touches dessinées. Examiner montre tout le texte. « Trop lourd » dit le poids de l'objet.
- **Le guichet du Comptoir** montre enfin toute une liste sur téléphone, et devant une porte, A ouvre la porte et B ramasse ce qui traîne au sol.
- **Des gestes plus doux** : on ramasse deux fois plus vite les baies, les branches, les pierres et les bûches. On entre dans la mare pour remplir sa gourde au milieu ; le bord reste aux joncs. Un sac-poubelle vidé ne propose plus rien. Le feu prend d'abord les branches, puis les bûches.
- **Dormir dans l'abri** : ton personnage va jusqu'à sa couche et dort dedans. Endormi, A dit « Se réveiller ».
- **La station** : la caisse de l'atelier est à chacun la sienne, comme le tas de bois, et l'Éteint qui dormait contre l'établi de ta pièce de famille dort maintenant contre la voiture éventrée.
- **L'accueil** : un « + » dans les couleurs de cheveux, pour choisir la tienne. L'écran des lieux lointains a son image en paysage.
- **Des textes qui ne divulgâchent plus** : plus de mots de conception à l'écran, des indices qui nomment le lieu sans l'endroit exact, une carte qui ne dit plus ce qu'on trouve dans un lieu.
- **Le tutoriel nourrit** : toutes les deux étapes, un repas un peu meilleur arrive dans ton sac, des pommes au départ jusqu'au pot-au-feu de ta première vraie nuit. Une ligne du carnet le dit.
- **Rien n'est perdu** : ta partie de la 0.8.1 se relit telle quelle, ce que tu as construit et ce que tu portes.

---

## 0.8.1 · déployée le 2026-10-11

- **La page d'administration s'ouvre de partout dans la maison** : elle n'est plus réservée à une liste d'adresses, et on peut l'ouvrir par l'adresse du Pi ou par un nom. Elle reste sans mot de passe, sur un port qui n'est jamais publié sur Internet.

---

## 0.8 · déployée le 2026-10-11

- **La base grandit avec tes sorties** : plus de paliers. Chaque meuble monte d'un niveau avec le niveau d'avant, des matériaux de la maison et un outil ; au niveau 1, il lui faut en plus **une clé** qu'on trouve dehors : une grille, une grosse toile, un seau, un étau… Chaque sortie peut changer ta base.
- **« Tu y penses »** : la première fois que tu ramasses la pièce qui ferait monter un de tes meubles, le carnet te souffle l'idée, dans un bandeau qui se ferme d'un bouton. Trop tôt ? L'idée est gardée « pour un jour » : la fiche du meuble dira « déjà en poche » quand tu y arriveras.
- **La fiche d'un meuble devient son arbre** : ce qu'il fait, le niveau suivant, sa clé, ce qui manque (une ligne par chose), et un indice « Où chercher ? », replié, qui se précise quand tu es allé au bon endroit sans trouver. Jamais de flèche sur la carte. Elle tient enfin sur un téléphone, en vertical comme en paysage.
- **Ta famille t'attend à la station** : le tutoriel t'y emmène (« La carte ») chercher ta pièce, le petit panneau solaire, l'enclume de dépanneur et son sac de charbon, ou le petit alternateur. Au retour, « La famille » : ton banc solaire, ton foyer de forge ou ton pédalier générateur, la pièce posée dessus. Puis ta première nuit.
- **Deux routes, à la même distance** : par la station jusqu'à la Coopérative, ou par le Gué-aux-Saules jusqu'au Moulin du Gué. « S'installer » commence par un foyer de pierres, puis ouvre deux portes à la fois, une par route ; au départ de chaque sortie, le carnet te rappelle ce qu'il te faut.
- **Le Gué-aux-Saules** : une halte au bord de la rivière. Le radier gronde et couvre les pas ; après deux averses, la crue le noie, et le bac à câble prend le relais, de jour comme de nuit. La cloche du passeur, les ricochets pour détourner un Éteint, la glaise de la rive, et la pierre qui revient.
- **Le Moulin du Gué** : un moulin à eau à toi seul, bien gardé. Trouve la grosse clé de la grande porte, méfie-toi de la fosse du rouet (un Éteint repoussé au bord y reste), et repars par le chemin de halage. Tout y revient au bout de 24 h, comme à la Coopérative.
- **Les armes évoluent sur leur meuble** : rapporte ton arme près de son établi, de sa forge, de sa meule ou de son banc, et « Reprendre » : la remettre à neuf, ou la monter d'une étoile, le même exemplaire. Le marteau et la masse retrouvent un manche à l'établi à étau, sans forge.
- **La fourche à foin** : une arme trouvée au Moulin, longue et perçante, qui passe le casque et se porte dans le dos. Une seule par personnage.
- **Le bois et la pierre reviennent** : à la station et au gué, les bûches et les pierres en vrac reviennent en 30 min, plus nombreuses quand vous êtes plusieurs, et chacun a son tas de bois et son banc de galets. Sur ton terrain, elles ne repoussent pas : la première nuit, le carnet te conseille les branches au feu, et te prévient si tu brûles tes dernières bûches.
- **Le Comptoir** garde des bûches et des pierres en stock, et vend les clés du niveau 1, cher, à qui connaît déjà leur lieu : avant ta première visite, elles ne sont pas sur l'étal.
- **De nouveaux meubles** : le récupérateur de 5 L puis le seau de 10 L, l'abri fermé, le coffre cerclé, l'établi à étau, la marmite norvégienne, le râtelier à outils, la torche plantée qui brûle jusqu'au matin, le bac de trempe en auge calfatée de glaise.
- **Les outils sont des portes** : il faut le niveau demandé. Une pierre, un éclat de verre, un coin de bois donnent le premier ; des outils de fortune se fabriquent à la main ; le marteau se remmanche avec la tête trouvée dans la caisse à outils de la ruine.
- **Les armes du niveau 1** : des dégâts revus étape par étape, les décharges électriques qui s'ajoutent au coup, la maîtrise sans plafond, la hachette au foyer de forge. Et l'arbalète a une icône qui ne ressemble plus à une pioche.
- **L'aide** suit : trois rubriques nouvelles (le gué, le Moulin, faire évoluer une arme) ; « Fabriquer » et « Améliorer sa base » racontent les clés, les indices et les replis ; « Je suis coincé » renvoie à la fiche du meuble.
- **Tout le monde repart de zéro** : au passage à la 0.8, tous les personnages sont remis à neuf. Nouvelle famille, nouveau terrain si tu veux : le niveau 1 est fait pour être découvert.

---

## 0.7.3 · déployée le 2026-10-10

- **Fouiller, c'est tout prendre** : un sac-poubelle, une poubelle ou un coffre de voiture fouillé passe tout entier dans ton sac, avec les « +1 … » habituels. Plus de fenêtre où choisir. Si ton sac est plein, ce qui ne rentre pas reste dedans.
- **La Coopérative est derrière la station** : à la halte, un chemin de terre part vers le nord (panneau « Coopérative du Plateau »), à 2 km, comme le Comptoir. Son portail te ramène à la station, ou au Carrefour ; le chemin agricole du Carrefour et la brèche restent.
- **Un nom plus simple** : le premier niveau de la forge des Charbonniers s'appelle désormais « Foyer de forge » (au lieu de « Foyer de forge à soufflet »). Son niveau 2 reste la « Forge ventilée ».

---

## 0.7.2 · déployée le 2026-10-10

- **Chaque pièce se découvre** : à la Coopérative et dans la boutique de la halte, ce que ton personnage ne voit pas est assombri, « en souvenir » : le décor reste lisible, mais aucun Éteint ni joueur n'y apparaît. Une porte fermée cache ce qu'il y a derrière ; ouverte, on voit dans son prolongement, et presque toute la pièce depuis le seuil.
- **La lampe ne traverse plus les murs** : la nuit ou dans une pièce noire, elle n'éclaire que ce que tu vois. Par une porte ouverte, sa lumière entre en cône dans la pièce d'à côté.
- **On voit à travers les vitrines et les fenêtres** : du libre-service, la cour ; des bureaux, par les fenêtres à barreaux. Une vitre condamnée (contreplaqué, store, planches) arrête la vue. Les Éteints suivent la même règle : s'ils te voient par la vitrine, tu les vois aussi.
- **Ce qu'on entend sans le voir** : un Éteint caché derrière un mur n'est plus muet. Ses pas, ses râles, ses coups s'entendent étouffés, et une onde orange s'élargit sur la porte ou le mur par où le son arrive. Jamais sa silhouette, ni sa place exacte.
- **Une porte qu'un Éteint pousse tremble**, et l'onde devient rouge. À moins de 3 m derrière un mur, on le sent : une onde rouge, un souffle.
- **Le cercle de signature dit sa vraie portée pièce par pièce**, à la Coopérative : bien plus petit derrière une porte fermée, moitié moins par une porte ouverte. Et il ne se cache plus sous le carrelage du libre-service.
- **À la halte, chacun sa vue** : on ne voit plus un autre joueur, un coup ou une pierre lancée de l'autre côté des murs de la boutique.
- **F referme la fiche Examiner** qu'il a ouverte (B sur téléphone), au lieu de la laisser ouverte.

---

## 0.7.1 · déployée le 2026-10-09

- **Le cercle de signature dit vrai** : un Éteint qu'il touche réagit, god compris. Les dormants n'entendaient qu'à la moitié du cercle et ignoraient la lampe ; ils perçoivent tout le cercle (blanc et ambre), bord compris. Atteint, un dormant remue (yeux, corps, un indice) puis se réveille en quelques secondes.
- **Plus rien à travers les murs** : un coup, un tir, une pierre ou une morsure ne passent plus à travers un mur, une cloison, une porte fermée ou un rayonnage, partout où il y a des murs. Et à la Coopérative, la porte des bureaux ne disparaît plus quand on s'en approche : elle s'estompe, on la voit et l'on se voit derrière.
- **Les trois écrans d'accueil** : juste après la création du personnage, avant d'arriver sur son terrain, « Ton terrain », « Les lieux lointains » et « Le Comptoir » présentent le monde. Une seule fois ; une simple connexion ne les montre pas, et s'ils ne se chargent pas, on entre directement.
- **Fouiller un sac-poubelle montre enfin ce qu'il contient.** La liste de la fouille ne s'affichait jamais (elle était détachée de l'écran) : chaque sac semblait vide alors qu'il gardait 1 à 3 objets. Tous les conteneurs ont au moins un objet à la première fouille ; écraser le compte god remet aussi à neuf les déchets de son terrain.
- **Plus de barrière invisible** : au Comptoir, chaque bord se voit et bloque (grillage, haie basse, barrages), comme les sacs de sable, les bacs, le banc, la corde de la file, le drapeau. Ailleurs : fourrés aux bouts de la halte, barbelés au terrain, brèche de la Coopérative devenue sortie, silos ronds. `?obstacles=1` (ou `=ensemble`) dessine les obstacles ; un test contrôle chaque lieu.

---

## 0.7 · déployée le 2026-10-09

Penser au bon moment, et des déchets partout (Book 26, Book 02 §14 quater). Les recettes ne tombent plus toutes d'un coup : ton personnage y pense quand il en a besoin. Et le monde de l'Abondance est enfin jonché de ce qu'il a jeté : tout se ramasse, presque rien ne vaut quelque chose.

**On y pense au bon moment** (l'arbre de progression)
- **On ne voit plus cent recettes d'un coup.** Au début, deux idées : le feu de camp et l'abri. Les autres viennent quand ton personnage **y pense** : en tenant l'ingrédient (des joncs : la ficelle), en ayant besoin (un arbre trop haut : l'escabeau), en vivant quelque chose (le premier feu : le gourdin ; la première nuit : le bâton à fouir).
- **« Tu y penses : … »** : un message annonce chaque idée nouvelle ; plusieurs à la fois sont regroupées (« 3 idées nouvelles »), au plus un message toutes les 10 s.
- **Cinq paliers**, du plus urgent au plus beau : le corps (manger, boire, dormir), l'abri du danger (se défendre, se soigner, ranger), les tiens puis les autres (ton atelier, ton arme de métier, le Comptoir), le métier, l'œuvre (les pièces à plusieurs familles).
- **Ton métier commence** quand tu as un toit et que tu as tenu tête une fois (un Éteint détruit, ou une nuit dormie) : pile à l'étape « La famille » du tutoriel.
- **Une recette fait penser à ses pièces** : le récupérateur de pluie fait penser à la corde.
- **Voir faire** : à 5 m d'un joueur qui fabrique, tu y penses aussi. Rester une minute près d'un joueur d'une autre famille, c'est une rencontre.
- **Personne ne reste bloqué** : après 20 min de jeu, tous les gestes du corps ; après 1 h, ceux de l'abri du danger ; après 2 h, ton métier.
- **Sans tutoriel**, le survivant connaît d'emblée les gestes du corps et de l'abri du danger.
- **Les personnages d'avant** ne voient plus ce qu'ils n'ont pas encore vécu, mais **rien n'est détruit** : leurs installations, leurs objets, ce qu'ils ont déjà fabriqué restent, et ce qu'ils ont déjà fait reste une idée.
- Une recette à laquelle on n'a pas encore pensé ne se fabrique pas : « Tu n'y as pas encore pensé. »

**Le panneau Fabriquer**
- **Fabriquer ne montre que tes idées** : le premier jour, le feu de camp et l'abri ; l'en-tête dit par exemple « 4 recettes · 3 à découvrir ».
- **À découvrir** : en bas du panneau, les silhouettes des recettes du prochain palier, l'icône assombrie et sans nom, avec ce dont tu auras besoin (« Dormir par terre, c'est dormir à moitié. »). Trois d'abord, « Voir les autres » pour le reste.
- **Une pastille rouge** dans le coin du bouton Fabriquer compte les idées nouvelles ; un point rouge marque l'onglet où elles sont (Matériaux, Outils…).
- **« Nouveau »** : la carte d'une idée nouvelle porte l'étiquette et un liseré doré, et passe en tête de son onglet le temps d'une ouverture. Le téléphone et l'ordinateur sont d'accord sur ce qui a été vu.
- **Les onglets arrivent à 8 recettes** : avant, une seule liste ; ensuite toute la barre, toujours dans le même ordre, les onglets encore vides atténués.
- **Les recettes des autres familles** ne s'affichent plus d'emblée : après le Comptoir, un échange ou une rencontre, une ligne par famille (« Chez les Voltaïques · 20 recettes »), à déplier. Celles qu'on a vu faire, ou dont on tient le produit, se montrent une à une.
- **« Il manque… »** ne nomme plus une recette à laquelle tu n'as pas encore pensé : « ça se fabrique (tu y penseras) ».

**Le tutoriel, le carnet et l'aide**
- **Le tutoriel ne demande jamais une recette invisible** : chaque étape qui fait fabriquer (le feu, la hache, l'abri, l'atelier de ta famille) te la fait penser.
- **Chaque objectif du carnet en cours fait penser à ce qu'il demande**, pièces comprises : « Forger une lame » fait penser à la lame et à sa forge.
- **Le carnet note ta dernière idée**, tout en bas : « Dernière idée : Tresser une corde ».
- **Le Comptoir vend une scie** : l'arbrier et la brouette, appris d'un Mécaniste, se font enfin.
- **L'aide** : « Fabriquer » dit que les recettes viennent quand on y pense (le message, la pastille, « À découvrir ») ; « Je suis coincé » répond à la recette qui ne vient pas ; nouvelle rubrique « Les déchets de l'Abondance ».

**Des déchets partout, et tout se ramasse**
- **Des déchets dans chaque lieu** : ≈ 75 coins jonchés à la halte, ≈ 60 à la Coopérative, ≈ 20 au Carrefour (rien que des ordures). Bas-côtés, parking, cour de ferme, jardin, lisières : chaque coin a ses objets.
- **Tout ce qu'on voit au sol se ramasse** : approche-toi, A, une seconde, c'est dans le sac. B dit ce que c'est (« Rien d'utile. » pour une ordure).
- **Fouiller un sac-poubelle, une poubelle renversée, le coffre d'une voiture** : 4 à 8 s, puis une liste ; touche ce que tu prends, le reste reste dedans. Les tout petits objets (une carte bancaire, un briquet, des pinces à linge) ne se trouvent qu'en fouillant.
- **On revient, on trouve autre chose** : un coin entamé se remplit à nouveau, d'autres objets, 8 à 24 h réelles plus tard.
- **Ton terrain** : 12 déchets de départ (dont 3 sacs-poubelle), qui ne reviennent pas. Le nettoyer, c'est pour de bon. La décharge, elle, continue de remonter des objets.
- **À la halte, des choses à démonter sur place** : un vélo dans le fossé, une épave de mobylette, un trampoline éventré, une machine à laver, un frigo connecté. Il faut une clé et un tournevis ; ils reviennent 7 jours plus tard, ailleurs.
- **Le tas de gravats** (des pierres, parfois un déchet ; un bâton à fouir va deux fois plus vite) et **la carcasse de mouton** (6 os), à la halte et à la Coopérative : ils reviennent en 3 jours.
- **Les ordures jetées par terre disparaissent au bout de 24 h**, sauf sur ton terrain. Ce qui vaut quelque chose reste.
- **Les balises solaires de jardin** restées au sol s'allument la nuit : une petite lumière que les Éteints viennent voir. Ramasse-les pour éteindre le coin.
- **Les déchets ont leur vraie forme, en amas** : une tache de crasse au sol et quelques objets serrés dessus, chacun reconnaissable à sa silhouette et à la couleur de son icône (canette, bouteille, carton, pneu, caddie, cône de chantier, vélo, ballon, flamant rose, nain de jardin…). Ce qu'on ramasse disparaît tout de suite ; un coin qui se remplit à nouveau se redessine.
- **Un éclat scintille** de temps en temps sur ce qui se ramasse, à moins de 8 m (et sur un sac-poubelle plein ; vidé, il ne scintille plus). **La nuit, rien ne brille hors de ta lumière** : l'éclat ne vient qu'à moins de 4 m, lampe ou torche allumée. Les balises solaires, elles, s'allument.
- **L'objet que tu vises** s'éclaircit en battant avec l'anneau.
- **Les points du monde ont leur modèle** : sac-poubelle crevé, poubelle renversée, tas de gravats, ce qui déborde du coffre des épaves, vélo couché dans le fossé, épave de mobylette, trampoline éventré, machine à laver, frigo connecté, carcasse de mouton (des os blanchis, de la laine grise, rien d'autre).

**91 objets nouveaux, presque tous sans valeur**
- **Canettes, stylos, oreillers, pneus, vélos en libre-service, onduleurs…** : 91 objets au catalogue, et le trampoline éventré à démonter sur place. La plupart ne valent rien.
- **Trois familles de vestiges nouvelles** : déchet, textile, loisir.
- **Les ordures valent 0** : le Comptoir les refuse (« Les Compteurs ne reprennent pas les ordures. ») ; au guichet, elles sont marquées « ordure ». Un sac de canettes, lui, vaut un peu.
- **Tout se démonte en matières connues** : un stylo donne un petit ressort, un oreiller des plumes, un piquet de clôture une barre de métal, un ressort de suspension deux lames de ressort, un onduleur une petite batterie.
- **Ce qui manquait aux familles se trouve enfin** : des barres de métal et des lames de ressort pour les Charbonniers, des appareils photo jetables et des petites batteries (peu communes) pour les Voltaïques, des vélos, des petits ressorts et des plumes pour les Mécanistes.
- **Les fouilles d'avant** donnent aussi le couteau abîmé (rare), l'onduleur et la trottinette électrique (peu communs, pour leur petite batterie), le sac de charbon de barbecue (peu commun, à la station) et la conserve bombée.
- **La conserve bombée** ressemble à une conserve. Mangée, elle rend malade deux minutes plus tard : vomissements, faiblesse. Démontée, une boîte vide.
- **La décharge du terrain** remonte aussi les nouveaux déchets, surtout des ordures.

**Les icônes**
- **Chaque objet nouveau a son icône**, dessinée dans la charte du sac : 91 dessins, de la canette écrasée à la débroussailleuse.
- **Deux pièges se reconnaissent** : la conserve bombée a l'étiquette rouge de la bonne conserve, couvercle gonflé ; l'os en nylon est trop lisse et trop rose.
- **Les ordures sont grisées dans le sac** : ce qui ne vaut rien se repère d'un coup d'œil.
- **Trois pictogrammes de famille** : un sac-poubelle noué (déchet), un t-shirt plié (textile), un ballon de plage (loisir).
- **Plus aucune icône générique** : le réveil, les roulements, l'alternateur, les semences, la clé du coffre, la radio, le manche fendu, la ferraille tordue et la décharge ont aussi leur dessin.

**Sur téléphone**
- **Moins d'ombres inutiles** : le jeu ne calcule plus l'ombre des objets dont l'ombre tombe hors de l'écran, et regroupe le dessin de la mare, des panneaux et de la halte. Même image, moins de travail pour le téléphone.
- **Moins d'appels de dessin, même image** : chaque personnage et chaque Éteint en un seul morceau, les ressources du sol regroupées, la forêt hors de l'écran plus dessinée. Le téléphone travaille trois fois moins à la halte.
- **Les déchets coûtent peu** : tous les objets au sol d'un lieu en un seul appel de dessin (et un pour les taches, un pour l'éclat), chaque point du monde en un seul ; l'ombre des objets seulement en qualité haute.

**Pour la suite** (pas dans cette version)
- **Les papiers et les sacs qui volent au vent.**

**Pour l'équipe**
- **`npm run rythme`** joue neuf parcours types (prudent, pressé, sans tutoriel, pour chaque famille) et vérifie le rythme : une nouveauté toutes les 3 min en moyenne la première demi-heure, un but au moins toutes les 20 min ensuite, et aucun blocage.
- **`?mesure=1`** dans l'adresse ouvre le panneau de mesure (images par seconde, appels de dessin et triangles par poste, dont la couche de déchets réelle et son dessin de repli, banc d'essai automatique) pour l'essai sur iPhone.
- **Le banc de charge** a l'option `--dechets` (des ramassages au hasard). Sur le Mac, 50 joueurs à la halte : ≈ 1 ms de calcul par joueur et par seconde, avec ou sans déchets (Book 17 §5.2).
- Outil du porteur : un compte admin unique (`npm run admin -- god`, sur le Pi `deploiement/admin-pi.sh`), pour tout tester ; le pseudo « god » est réservé.
- **Sauvegardes sur la clé USB du Pi** : le serveur y recopie en arrière-plan ses sauvegardes, `reglages.json` et `certificat/`, seulement si le repère `.cle-watt-now` est là. La clé garde 30 quotidiennes, 26 hebdomadaires et 24 mensuelles ; le journal et `npm run bilan` disent quand date la dernière copie (LISEZMOI §7 bis, Book 17 §5.4).

---

## 0.6 · déployée le 2026-10-09

Le métier des familles (Book 25) : chaque famille fabrique seule son arme de métier, et les autres lui apportent les améliorations. Le lancer, l'arc pour tous, les étoiles, les lames des Charbonniers, l'électricité des Voltaïques, l'arbalète et les pièges des Mécanistes.

**Le lancer** (Book 23 §5, Book 25 §3.4)
- **Lancer** : G, le clic du milieu, ou le nouveau bouton rond « Lancer » du téléphone (il n'apparaît que si tu as de quoi lancer). Maintiens pour viser, relâche pour lancer.
- **La visée** : une ligne de points au sol et un cercle. Une arme s'accroche à l'Éteint le plus proche devant toi (sur ordinateur, la souris oriente) ; un leurre vise un point à 8 m.
- **La pierre** (8 m) étourdit l'Éteint touché une seconde, et fait un petit bruit là où elle tombe. Elle n'achève pas un Éteint à terre.
- **Le réveil à piles** (nouveau vestige, au salon) : lancé à 8 m, il sonne vingt secondes et attire les Éteints vers lui.
- **Sac → « Prêt à lancer »** : choisis ce que le bouton lancera ; sans choix, c'est une pierre.
- **Ce qu'on lance retombe au sol** et se ramasse, là où il est tombé ; dans la mare, il est perdu.
- **Les murs arrêtent tout** : on ne lance pas par-dessus un rayonnage de la Coopérative (une caisse basse, si).
- Saisi, on ne lance rien : il faut d'abord se dégager.
- La **hachette** forgée se lance aussi : va la reprendre là où elle tombe.

**L'arc pour tous** (Book 25 §3)
- **L'arc de fortune** : une perche de frêne (ou une branche droite) et une ficelle. Il tire tout de suite, mais c'est un arc ★ : le bois vert fatigue vite.
- **L'arc de frêne** : ébauche la perche à l'établi, laisse-la **sécher deux heures** (dans ton sac, même quand tu n'es pas là), puis monte-la près d'un feu avec une corde d'arc. Un arc ★★★.
- **L'arc d'if** : pareil, avec un bâton d'if. Le meilleur bois d'arc : ★★★★, il porte plus loin et il dure.
- **La corde d'arc** fait la qualité de l'arc : 3 ficelles retordues (★★), une corde défaite (★★★), une bobine de fil dentaire (★★★★). Un arc ne vaut jamais mieux que sa corde.
- **Quatre flèches** : durcie au feu (elle blesse, mais ne tue pas à la tête), à pointe d'os, à pointe de clou (douze d'un coup avec un bocal de clous), à pointe d'acier (forgée par un Charbonnier). Toutes se font seul, quelle que soit ta famille.
- **Tirer** : Sac → « Prêt à tirer », puis maintiens Lancer pour bander. Après 1,5 s, c'est un tir plein ; le cercle rougit quand la tête est à portée : 6 m pour un arc ★★★ (4 m à ★, 5 m à ★★, 7 m pour l'if). Relâché trop tôt, la flèche touche le torse. Encocher prend 1 s.
- Un **Équipé** casqué ne meurt d'une flèche que **de face**, par la visière, et deux fois plus près.
- **Les flèches se ramassent** là où elles tombent, ou sur le corps. Elles cassent parfois : une durcie sur deux, une d'os ou de clou sur trois, une d'acier sur cinq.
- L'**arc de tir sportif** trouvé dans les bureaux de la Coopérative est un arc ★★★★★ tout fait ; ses flèches en carbone ne cassent jamais.
- **Le redresseur de fûts** : sur ton établi, 2 branches et 1 pierre. À côté, tes flèches se font deux fois plus vite.
- La corde claque, tout doucement : l'arc ne s'entend qu'à 3 m. Le personnage tient l'arc en main pendant qu'il vise.

**Le combat et les étoiles** (Book 25 §4.2, §5.1 et §8)
- **Les étoiles** : les objets de métier (lames, arcs, arbalètes, armes électriques) ont une qualité de ★ à ★★★★★, par exemplaire. Leur case du sac montre « 4★ », leur fiche les cinq étoiles.
- Deux exemplaires d'étoiles différentes ne s'empilent plus. Plus d'étoiles : plus de dégâts, et une arme qui dure plus longtemps (une ★★★★★ dure deux fois plus qu'une ★★★).
- **L'usure par exemplaire** : chaque lame s'use de son côté ; quand l'une casse, l'autre reste comme elle était.
- La **machette de fortune** compte comme une lame ★.
- **Réparer une lame : à la meule ou à la forge.** La meule du pédalier l'affûte, sans rien consommer ; la forge la reprend pour un kilo de charbon. Un Charbonnier répare enfin ses lames lui-même.
- **Un coup tranchant s'entend moins loin** : 10 m au lieu de 14 (le choc d'une masse ou d'un marteau, lui, porte toujours à 14 m).
- **L'électricité contre les Éteints** : une décharge courte fait lâcher et raidit ; maintenue, elle met à terre, et elle **éteint pour de bon** un Éteint raidi ou à terre, casque ou pas. L'Éteint raidi se fige, de petits arcs bleus sur le torse ; éteint, il s'affaisse, sans sang.
- **Les pièges** ont leur moteur (plaque de choc, clôtures, assommoir, mâchoires) : raidir, mettre à terre, briser la jambe, tenir sur place ; jamais détruire.
- Les sauvegardes d'avant se relisent sans rien perdre.

**🔥 Les Charbonniers : les lames** (Book 25 §4)
- **La gamme de la forge** : pinces de forge, couteau de forge (l'ancienne « lame forgée », désormais emmanchée), deux hachettes, serpe, machette forgée, hache forgée, glaive de ressort, pointes de lance, pointes d'acier, rivets, ciseau à bois et burin, ressort retrempé, électrodes.
- **La machette forgée**, l'arme de métier : 1,5 de dégâts et 80 de solidité, deux fois plus solide que la machette de fortune.
- **La hachette** se lance ; **la serpe** élague ; **la hache forgée** remplace les têtes rouillées qu'on ne trouve plus.
- **La lance à pointe forgée** : un épieu coiffé d'une vraie pointe d'acier (1,4 de dégâts, solidité 60).
- **La qualité d'une lame**, c'est la moins bonne de trois choses : l'acier, la trempe, la forge. Seul, dès le premier jour : ★★.
- **L'acier** : le fer doux (barre, fil de fer) ★★, une lame ébréchée ou un soc de charrue ★★★, un ressort ★★★★, une lime usée ★★★★★.
- **La trempe à l'eau** : une lame sur trois se fend (le jeu le dit avant). Elle devient une lame ébréchée, qui se reforge.
- **La trempe à l'huile** est sûre : une noix de graisse dans le sac, ou l'huile du bac de trempe.
- **La forge** : sans pinces, pas plus de ★★ ; avec les pinces et une enclume, ★★★ ; à la forge ventilée, ★★★★ ; avec le rail, ★★★★★.
- **Les accessoires de la forge**, à poser sur place (B) : l'enclume (étau, tête de masse, tronçon de rail), le bac de trempe (une casserole) où l'on verse un bidon d'huile (vingt trempes), le ventilateur des Voltaïques.
- **La forge ventilée** : Examiner la forge → Améliorer (bâche ou chiffons, 6 pierres, 1 barre). La hache et le glaive s'y forgent ; on y pompe le soufflet, sauf avec un ventilateur.
- **Le glaive** demande la maîtrise du couteau : dix couteaux forgés d'abord.
- **Un manche tourné** des Mécanistes dans le sac : une étoile de plus à la lame qu'on emmanche.
- **Reforger une lame ébréchée** à la forge : la lame cassée redevient la même arme, une étoile de moins, pour un kilo de charbon.
- Une machette forgée peut aussi naître de deux lames ébréchées (acier ★★★).
- Hors de sa famille, une lame forgée ne dépasse jamais ★★, quelle que soit la forge.

**⚡ Les Voltaïques : l'électricité** (Book 25 §5)
- **La matraque de fortune** : un gourdin, un appareil photo jetable, la petite batterie du kit. Un Voltaïque seul la monte dès le premier jour (★, 50 Wh).
- **La matraque électrique**, « la Raquette » : ★★ au module de raquette, ★★★ au module à bobine (sa décharge saute alors au voisin). Les électrodes forgées d'un Charbonnier ajoutent une étoile, un manche tourné d'un Mécaniste une autre.
- **L'aiguillon de défense** : la même décharge au bout d'un épieu, à 2,3 m.
- **La décharge** : A, une courte, il lâche et se raidit ; maintenu, une longue, il tombe ; sur un Éteint raidi ou à terre, il s'éteint pour de bon. Casque ou pas.
- **Une courte libère** : saisi, une décharge et il lâche.
- **Chaque décharge prend du courant** : 0,25 Wh la courte, 1 Wh la longue. La barre bleue du sac le montre.
- **Pack vide** : la matraque n'est plus qu'un gourdin court ; « Plus de courant » s'affiche une seule fois.
- **Recharger au banc** : « Recharger tes armes électriques », pris aux batteries posées sur le banc ; un pack vide en 25 s.
- **La manivelle** : Sac → l'arme → « Manivelle », avec la lampe à dynamo du kit. 1 Wh par minute, à la force du bras, même sans soleil.
- **Les pièces** : le pack de cellules (3 cellules, 12 Wh) et le module de décharge (flash ★, raquette ★★, bobine ★★★), au banc.
- **La lampe de poche bricolée** : quatre LED et un pack, une lumière blanche sans manivelle.
- **L'alarme électrique** : un fil tendu bas. Un Éteint passe : la LED s'allume, le téléphone vibre, et rien ne fait de bruit.
- **La clôture de fortune** (4 m) et **la clôture électrique** (6 m) : branchées à un banc chargé à moins de 6 m, elles raidissent l'Éteint et le repoussent. Trois qui poussent ensemble la couchent : relève-la. Elles ne tuent jamais.
- **La plaque de choc** : le premier Éteint qui marche dessus tombe à terre. Réarme-la (0,5 Wh) après chaque décharge.
- **Le ventilateur de forge 12 V** et **l'électrificateur** se fabriquent, pour les forgerons et les clôtures.
- **Le bain de dérouillage** : douze heures de jeu, et la machette de fortune passe à ★★.
- On entend la décharge : un crépitement (à 6 m), un claquement pour la longue (à 8 m). La clôture sous tension bourdonne.

**⚙️ Les Mécanistes : l'arbalète, les pièges, le tour** (Book 25 §6)
- **L'arbalète** : à l'établi, un arbrier scié dans une bûche, une noix et sa détente, un arc, une corde. Un Mécaniste seul en monte une dès le premier jour, avec la scie et la clé plate de son kit.
- Ses étoiles sont celles de sa moins bonne pièce : arc de frêne ★, lame de ressort ★★, if ★★★, ressort retrempé d'un Charbonnier ★★★★ ; noix de bois ★★, d'os ★★★, de rivets forgés ★★★★. Le ciseau à bois d'un Charbonnier donne une étoile de plus à l'arbrier.
- **Armée d'avance** : Sac → « Prêt à tirer », puis le bouton Lancer : le carreau part tout de suite. Un tir à la tête détruit jusqu'à 12 m (8 m pour une ★, 10 m pour une ★★) ; un Équipé, de face, à moitié moins.
- **Réarmer** : appuie sur Lancer ; 3 s sans bouger, 10 d'endurance. Saisi, on ne tire pas.
- **L'arbalète lourde** (deux ressorts retrempés d'un Charbonnier) : un carreau met un Éteint à terre, jusqu'à 15 m pour la tête. Trop raide pour le pied : on la réarme au pied-de-biche (6 s) ou au **cranequin** (4 s), qui se fait au pédalier.
- **Les carreaux**, quatre par recette (douze avec un bocal de clous) : pointe d'os ou de clou (un sur trois casse), d'acier forgé (un sur cinq). Le papier des boîtes à gants remplace les plumes.
- **Les pièges** : l'**assommoir** met à terre le premier qui passe ; les **mâchoires de fortune** (deux lames de ressort) lui brisent la jambe et le tiennent 10 s, mais se faussent au bout de cinq prises ; le **piège à mâchoires** (ressorts retrempés) le tient 20 s et ne se fausse pas ; la **fosse à pieux** (il faut une bêche) le garde au fond. Aucun ne tue : à toi d'achever.
- A sur un piège qui a pris : le **réarmer** (quelques secondes, de l'endurance).
- **Le tour à perche** : une installation des Mécanistes. On y tourne des **manches**, qui donneront une étoile de plus aux armes des autres familles.
- **Le pédalier** reçoit deux accessoires : le **soufflet à manivelle** (souffle sur une forge à moins de 3 m) et la **meule fine** (posée sur la meule : une lame affûtée y gagne 10 % de dégâts jusqu'à ce qu'elle casse).
- **La brouette** : 60 kg roulés de plus que le sac, et l'on court encore (le travois, lui, traîne).

**Le métier des autres, les matières nouvelles** (Book 25 §2.3 et §9)
- **Le métier des autres** : dans Fabriquer, les recettes des autres familles se voient, grisées, « chez les Charbonniers ».
- **La leçon** : à la halte ou au Comptoir, près d'un joueur d'une autre famille, B « Enseigner » : tu choisis une recette de ton métier. Deux minutes côte à côte, et il la sait.
- Enseigner fait circuler ton nom (du rayonnement), une fois par élève et par recette.
- **Les manuels** (*Manuel du forgeron amateur*, *Guide de l'électricien du dimanche*, *L'Arbalète pour les nuls*) : « Lire », dans le sac, ouvre toutes les recettes d'une famille. Le livre reste dans le sac. Un de chaque attend au coffre du directeur de la Coopérative.
- Une recette apprise hors de sa famille coûte **une fois et demie** plus de matières et de temps, et ce qu'elle produit ne dépasse pas **★★**.
- **Les frênes** : deux à la lisière de chaque terrain. Une perche de frêne se coupe au couteau aiguisé (au couteau du kit, plus lentement) et repousse en 6 h, même quand tu n'es pas là.
- **L'if** : une haie d'ifs taillés en boules devant les bureaux de la Coopérative ; et, au fond du bois, un if que seuls les Mécanistes reconnaissent.
- Plumer une poule laisse une **poignée de plumes** et un **os** ; la volaille rôtie laisse de la **graisse**.
- **Treize vestiges nouveaux** dans les fouilles : fil dentaire, appareil photo jetable, raquette anti-moustiques, bobine d'allumage, lime usée, soc de charrue, bidon d'huile, tronçon de rail, arc de tir sportif, flèches en carbone, et les trois manuels.
- Les Mécanistes ont une **clé plate** dans leur kit de départ.
- La masse martèle (et mieux que le marteau), le pied-de-biche aussi, la machette de fortune coupe.
- La masse et le pied-de-biche valent enfin ce qu'ils coûteraient à refaire (200 et 150 wotts) ; la lance vaut ce que vaut sa recette.
- Après dix exemplaires d'une même lame, la forge est maîtrisée : une étoile de plus.

**Le carnet, le sac, le Comptoir, l'aide** (Book 25 §9.4 à §9.6)
- **Le métier, suite** : quatre étapes de plus dans le carnet pour chaque famille, qui mènent jusqu'à l'échange. Toutes se font seul.
  - 🔥 Les pinces, La trempe (une machette ★★), La mise d'acier (hachette ou hache), Le fournisseur (une lame).
  - ⚡ Du courant en poche (un pack), La Raquette (éteindre un Éteint à la décharge), Prévenu sans bruit (l'alarme électrique), Le courant chez les autres (un pack ou une lampe).
  - ⚙️ Le bois qui plie (une arbalète), Le carreau (un Éteint à la tête), Les mâchoires (un piège posé), Le carquois des autres (8 carreaux).
- La dernière étape de chaque métier se valide en donnant à un joueur d'une **autre famille** dans un échange, ou, si tu es seul, en vendant au Comptoir.
- **S'installer** gagne deux étapes : **Le premier arc** (3 flèches à pointe d'os en récompense) et **Tir plein** (un Éteint détruit d'une flèche à la tête).
- **Le Comptoir rachète les armes de métier** selon leurs étoiles : une ★★★★★ vaut deux fois une ★★★, une ★ moitié moins. Elles entrent en stock telles quelles, et se rachètent pareil.
- **Les armes de métier s'échangent** entre joueurs, étoiles comprises. Le guichet et la fenêtre d'échange montrent les étoiles.
- **Le sac, pour le tir** : l'arc et l'arbalète montrent sur leur case ce qui leur reste à tirer (« ➶7 », en rouge à zéro) ; leur fiche dit leurs portées, la portée de tête, la cadence, les flèches ou carreaux du sac, et leur solidité.
- **L'aide du jeu** : cinq rubriques nouvelles (Lancer et tirer, Les étoiles, Le métier des autres, L'électricité contre les Éteints, Pièges et défenses) ; le combat, les familles, le carnet et le Comptoir sont mis à jour.
- Les leçons des quêtes réussies citent tes touches.
- Dans le carnet, chaque étape du métier (et de l'arc) a son icône, celle de l'objet à faire.

**L'équilibre des armes de métier** (Book 25, chantier 9)
- **La lame, la matraque et l'arbalète ont chacune leur terrain**, vérifié par un simulateur qui rejoue les vraies règles du jeu : la lame au corps à corps, l'électrique contre le casqué et le groupe serré, l'arbalète à distance. Aucune n'est plus de deux fois moins bonne ailleurs. Aucune valeur n'a eu à changer.
- **Le cercle de visée se lit mieux sur un petit écran** : son trait reste épais même refermé, et il se remplit d'un rouge pâle quand la tête est à portée.
- **Un Éteint raidi** par une décharge porte un anneau bleu au sol, qui palpite : on le reconnaît d'un coup d'œil, de jour comme de nuit.
- Pour le test : cinq réglages d'équilibre modifiables à chaud (dégâts des lames, raidissement, décharge longue, réarmement, portée de tête) ; `npm run equilibre` dit si l'équilibre tient encore, `npm run bilan` mesure les critères de réussite de la 0.6.

## 0.5.3 · déployée le 2026-10-09

- **Le coffre** (et la décharge), refait selon l'avis de Sally :
  - toucher un objet le choisit, et son **nom** s'affiche en bas, avec « Ranger 1 » et « Tout », ou « Prendre 1 » et « Tout » ;
  - deux touchers rapides déplacent toute la pile ;
  - sur téléphone, le coffre s'ouvre en volet, comme le sac.
- **La gourde pèse son eau** : un kilo de plus quand elle est pleine, compté dans le poids du sac.
- **Pause** : un bouton ⏸ à côté de la porte, sur ton terrain et dans ta Coopérative, là où tu es seul. La faim, la soif, la fatigue et les Éteints s'arrêtent ; l'heure du monde, elle, continue. Pas de pause dans les lieux partagés (station, Comptoir), ni quand un Éteint te tient.
- **Construire** : la barre de placement est une petite barre en bas, plus au centre. On voit enfin où l'on pose. Sur téléphone, elle prend la place de A et B, et le joystick reste pour pousser l'objet.
- **Améliorer** : après un geste, la fiche se ferme seule, et l'on voit tout de suite l'objet amélioré.
- **Messages plus courts** : deux lignes au plus, un conseil sur une ligne, plus jamais coupés par « … ». Quand il y a beaucoup à dire, deux messages se suivent.
- **Fabriquer, sur ordinateur** : les sept onglets sont tous visibles.
- **La brume de l'aube** est plus légère et reste au ras de l'herbe. Elle ne devrait plus prendre de reflets de couleur sur iPhone.

## 0.5.2 · déployée avec la 0.5.3 (2026-10-09)

- **Le sac, en vertical** : la grille prend toute la place libre, et on voit tous ses objets d'un coup. La fiche de l'objet touché ne prend que la hauteur dont elle a besoin.
- **Les messages, en horizontal** : centrés dans la place libre, sous les tuiles et l'heure. Ils ne passent plus sous les jauges.

## 0.5.1 · déployée le 2026-10-08

**Le sac et Fabriquer, enfin utilisables sur téléphone** (avis de Sally ; référence : l'iPhone 13 mini)
- **Le sac** : en vertical, un volet presque plein écran. La grille de petites cases est en haut, et la **fiche de l'objet** est en dessous, toujours visible, avec ses boutons sur une seule ligne. En horizontal, deux colonnes : la grille à gauche, la fiche à droite.
- **Fabriquer** : chaque recette tient sur toute la largeur, avec un petit bouton à côté du nom. Il n'y a plus de texte écrasé dans une colonne étroite. On voit quatre recettes d'un coup (deux colonnes en horizontal).
- **Des polices plus petites sur les petits écrans** : carnet, sac, Fabriquer, carte, aide.
- Le bloc des jauges se resserre quand le sac ou Fabriquer est ouvert, et ne touche plus le joystick en horizontal.
- **Des mots plus clairs** :
  - « Construire » (le feu de camp) au lieu de « Monter ici » ;
  - « Il manque… » au lieu de « Ce qu'il manque ? » ;
  - « Équiper », « Réparer », « Rafistoler » (la réparation de fortune) ;
  - « Installer » la broche, la marmite, la dynamo et la meule ;
  - « Défaire l'amélioration ».


**La Coopérative, ce qui manquait** (Book 23 §4.3 et §4.7)
- **La batterie du tracteur rouge se démonte** (une clé plate pour les cosses) : 18 kg, jusqu'à 360 Wh. Mais chaque coup de klaxon en vide un quart : klaxonner ou l'emporter, il faut choisir. Prise, le klaxon reste muet ; une autre batterie se retrouve dans le tracteur au bout de 4 jours. L'examen dit ce qui lui reste.
- **La radio à piles se transporte** : B la prend (2 kg, dans le sac), A la pose à tes pieds, où tu veux dans la Coopérative. Allumée, elle attire les Éteints là où elle est. Elle ne capte la Compagnie qu'au Plateau : si tu pars avec, tu la poses au pied du portail.
- **Une arme cassée laisse un débris** : un manche fendu, une lame ébréchée ou une ferraille tordue. Il va dans le sac (par terre s'il est plein) et se démonte : du petit bois, une lame de ressort à reforger, une barre de métal (ces deux-là demandent un marteau).

## 0.5 · déployée le 2026-10-08

**La Coopérative du Plateau** (Book 23)
- Un nouveau lieu, **un par joueur** : la Coopérative agricole, au bout d'un chemin agricole qui part au nord du Carrefour. Du terrain, on traverse la station, puis le Carrefour.
- Un grand hangar à rayonnages, un libre-service, des bureaux, une chambre froide, l'atelier des tracteurs, le quai, les silos. Les toits s'effacent quand on passe dessous.
- **Des portes** qu'on ouvre et qu'on referme (A) : refermée derrière soi, une porte arrête un Éteint. Ouvrir une porte fait un peu de bruit.
- Se reconnecter dans la Coopérative ramène au portail.
- **24 Éteints** à la première visite, chacun dans sa zone :
  - des groupes dans le hangar, qui se suivent ;
  - des dormants serrés dans la chambre froide : un dormant qui se réveille **gémit**, et réveille ses voisins ;
  - des **Rampants** près des tracteurs : un coup les achève ;
  - des **Équipés** casqués, plus solides ;
  - le magasinier et le mécanicien.
- **Les murs étouffent les bruits et arrêtent la vue** : derrière une porte fermée, on ne t'entend presque pas. Dans les pièces noires, sans lampe, on n'y voit qu'à quelques mètres, et ta lampe se voit de loin. Les Éteints passent par les portes, et un bruit derrière la chambre froide fait sortir ses dormants par la porte de derrière. Après 3 minutes sans te voir, un Éteint rentre chez lui.
- **Le butin** : du commun dans le libre-service et sur le quai, des outils à l'atelier, des bâches et des cordes dans le hangar. Un **pied-de-biche** t'attend sous le comptoir de caisse. Au fond, le **rare** :
  - le coffre du directeur, qui s'ouvre avec la clé du magasinier ;
  - les caisses de pièces de la chambre froide.
- **Sa musique** : tonique mi, nostalgique dans la cour, elle **se retire** quand on entre (le hangar, l'atelier) et se tait presque dans la chambre froide, pour qu'on entende respirer les dormants. Un Danger à part quand trois Éteints ou plus sont sur toi ; un signal quand on trouve le butin rare, et à la sortie par le portail.
- **Il fait noir dedans** : en entrant dans le hangar, les bureaux, l'atelier ou la chambre froide, la lumière tombe, même en plein jour. Ta lampe éclaire alors à quelques mètres… et se voit. Dans le noir, on voit d'abord **les yeux** des Éteints.
- **On les reconnaît** : l'Équipé et son casque de moto, le Rampant qui avance couché (l'herbe frémit autour de lui), le magasinier en blouse avec ses clés, le mécanicien en combinaison.
- **Ce que tu fais reste fait** : un Éteint détruit ne revient pas tout de suite (quelques-uns toutes les 12 h, la chambre froide d'abord), une porte reste comme tu l'as laissée, et le butin pris revient en quelques heures (en 4 jours pour le rare).

**Le combat, enrichi** (Book 23 §4)
- **D'où vient le danger** : un Éteint qui approche hors de l'écran fait apparaître une flèche autour de ton personnage (orange s'il vient, rouge s'il te poursuit).
- **B selon la situation** : un Éteint au contact devant toi, B le **repousse** d'un grand pas, étourdi (deux à la fois) ; sinon B esquive ; saisi, B dégage. Le bouton dit ce qu'il va faire.
- **Contondant, tranchant, perçant** : un casque arrête le tranchant à la tête ; le contondant passe et étourdit plus longtemps ; le perçant vaut par son allonge.
- **Les armes s'usent** : la solidité se lit dans le sac. Sous 30 %, elle est abîmée (le jeu prévient) ; à zéro, elle casse.
  - **Réparation de fortune** partout, avec une ficelle et des chiffons.
  - **Remise à neuf** chez soi : à l'établi, à la meule ou à la forge.
- **Quatre armes** :
  - le **pied-de-biche**, la plus solide ;
  - la **machette**, vive ;
  - la **masse**, lente et terrible ;
  - la **lance**, à fabriquer : un couteau ligaturé au bout d'un épieu.

  Chacune a son modèle en main.
- **Des leurres dans la Coopérative** : le klaxon du tracteur (sa batterie ne tient que quatre coups), la sonnette du quai, et une radio à piles qui braille la réclame de la Compagnie.

**L'écran**
- Les **messages** passent **en haut, juste sous les tuiles**, en petit et sur un fond très léger : ils ne cachent plus la zone de jeu. Sur téléphone en horizontal, ils se placent **au centre**, sans plus jamais recouvrir Explorer, Lumière, A ou B (avis de Sally). Les **indices** (« comment s'y prendre ») sont encore plus discrets.
- Moins de messages à la fois : 3 sur ordinateur, 2 sur téléphone, 2 lignes au plus. Un message répété ne s'empile plus : il est relancé avec « ×2 ». Quand la place manque, l'indice part avant la leçon. Une même phrase d'indice ne revient pas avant 90 s. Les messages s'effacent en fondu.
- **La carte du monde** : la fiche du lieu fait maintenant partie de la feuille (la marge de légende d'un atlas). Le bouton Partir est toujours visible, même sur téléphone en horizontal. Un clic à côté de la carte la ferme.
- **Fabriquer rangé par catégories** (avis de Sally) : les onglets sont Tout, Feu, Outils, Sur soi, Matériaux, Bâtir et Ateliers. Chaque onglet compte ses recettes faisables. Un filtre « Faisable maintenant » est ajouté, et un badge signale les recettes de famille. Le dernier onglet choisi est gardé.
- **Aide du jeu** : menu ⚙ → ❓ Aide. Elle explique tous les mécanismes en 20 rubriques, sans dévoiler les secrets, pour le joueur perdu. Les touches citées sont les siennes.
- Les bulles des jauges donnent enfin les vraies durées (la faim tient ≈ 70 min réelles, pas 24) ; les messages du serveur citent les touches du joueur au lieu de touches écrites en dur.
- L'indice des poules ne revient plus à chaque passage : seulement si l'on a de quoi chasser, au plus toutes les 10 minutes, et plus jamais une fois une poule attrapée.

**Améliorer sa base** (Book 24 ; le « ranger » peut sortir à part, en 0.5.1)
- **Examiner** un feu ou une installation ouvre sa **fiche** : ce qu'il fait, ce qu'on peut y faire, le niveau suivant, ce qu'il coûte et ce qui manque.
- **Démonter** un feu (éteint) ou une installation : on récupère la moitié des pierres, branches et bûches, et tout le reste (bâche, corde, métal…). Un coffre se vide d'abord.
- **Creuser son feu de camp en foyer Dakota, sur place** (et le combler pour revenir au feu de camp). Le joueur qui avait déjà trois feux n'est plus bloqué : l'objectif « Un feu qui ne se voit pas » compte le feu creusé.
- **Le feu grandit sur place** : foyer de pierres (moins de bois, 16 kg de bois, se couvre sous la cendre pour la nuit et se ranime sans briquet, son muret réchauffe l'abri voisin), puis **foyer de cuisine** (deux plats à la fois, l'eau bout deux fois plus vite, on rôtit plus vite). Côté discret, le Dakota devient un **poêle-fusée** en boîtes de conserve.
- Deux **soupes mijotées** au foyer de cuisine (cèpes, pot-au-feu de volaille) : elles nourrissent et désaltèrent.
- Accessoires du feu : la **broche** (une portion de plus à la fois) et la **marmite norvégienne** (les soupes demandent moitié moins de bois).
- **L'abri garni** (le lit de branchages voisin y passe sans rien payer), puis **fermé** : on y dort mieux. **Coffre cerclé** (250 kg) puis **réserve couverte** (400 kg). **Citerne de bâche** : 60 L d'eau de pluie.
- Chaque niveau a **son modèle**, qu'on reconnaît de loin. Dans Fabriquer, le feu n'a plus qu'une carte : le reste se fait sur place.
- Allumer un deuxième feu le dit : chaque feu allumé s'ajoute à ce que sentent les Éteints.
- Carnet : l'abri garni vaut un lit ; deux nouveaux objectifs, « Un foyer qui tient la nuit » et « Une vraie cuisine ». L'aide a une rubrique « Améliorer sa base ».

## 0.4 · déployée le 2026-10-08

**L'écran** (spécification de Sally, la designeuse UX de BMAD, validée sur maquettes ; Book 18 §3)
- Le haut de l'écran tient dans une seule grille : plus rien ne se chevauche, sur ordinateur comme sur iPhone (le bouton Vue n'est plus recouvert).
- En haut à droite, sans cadre : 🚪 Partir et ⚙ Options, puis la date, l'heure et les wotts. Plus de météo ni de version (la version reste sur l'écran titre).
- **Partir** sort du menu des réglages : un dialogue conseille d'aller dormir dans son abri avant de partir.
- Le menu ⚙ : Commandes, Son, Qualité, et « Infos techniques » (images/s, latence, version). Une connexion lente se signale d'un 📶 orange.
- Le **carnet** devient une tuile, à côté de Sac, Fabriquer et Carte (touche J), avec une pastille quand un objectif avance ou est réussi.

**Jouer**
- **Déconnexion d'office après 5 minutes sans rien faire** (réglable) : hors ligne, la faim, la soif et la fatigue sont gelées. Un écran explique la pause et propose de reprendre.
- Un conseil, dès la première nuit : aller dormir dans son abri avant de fermer le jeu (une nuit complète).

## 0.3 · déployée le 2026-10-08

**Jouer : la gamme bushcraft, lot 1** (proposition P-002, Book 02 §14 bis), rien que des matières qu'on a déjà :
- ficelle, bâton à fouir (Creuser 1), **foyer Dakota** (un feu creusé : il se voit trois fois moins la nuit, fume moins, brûle moins de bois) ;
- **récupérateur de pluie** (il se remplit même hors ligne ; l'eau de pluie se boit sans bouillir) ;
- **lit de branchages** (sommeil +30 %), **alarme à boîtes de conserve** (elle tinte quand un Éteint passe, et l'attire), **protège-bras** (une morsure sur deux), **épieu** (la plus longue allonge), **travois** (+50 kg, sans courir) ;
- manger une conserve laisse sa boîte vide.
- « S'installer » passe à 10 objectifs, dans l'ordre de l'urgence ; « Les autres » (le Comptoir, les premiers wotts, l'échange) devient une troisième ligne du carnet.

**Ramasser : les vestiges, lot 1** (proposition P-003, Book 02 §5) : on ramasse tout et n'importe quoi, et il faut choisir.
- **55 vestiges** du quotidien (cuisine, salle de bain, salon, gadgets morts, garage, voiture, ferme), à leur vrai poids : une télé de 85 pouces fait 45 kg, un sac de ciment durci 25 kg. Chacun a sa valeur au Comptoir ; les absurdes ne valent presque rien.
- **Fouiller** un rayonnage, l'atelier, une épave, la grange ou la caisse à outils rapporte en plus **1 à 3 vestiges** tirés au hasard selon le lieu. Ce qui ne rentre pas dans le sac reste par terre, en petit tas.
- **Démonter** un vestige depuis le sac (36 s'y prêtent) : il donne des **composants** (fil de cuivre, petit moteur, cellule lithium, aimant, LED…), avec l'outil qu'il faut. Les composants serviront plus tard.
- Le sac se **trie** par sorte ou par poids, et sa grille défile ; une icône par famille d'objets, une douzaine dessinées à la main. La bêche creuse (Creuser 2).

**Combat** (propositions P-004 et P-005)
- Un coup va jusqu'au bout : taper vite ne relance plus le geste ; un appui pendant le coup est gardé pour la suite. Chaque arme a son rythme (hache lente, couteau vif).
- On choisit son arme dans le sac (« Équiper pour le combat », ⚔). Perdue, on reprend la meilleure du sac.
- Le gourdin se voit enfin dans la main.

**Interface**
- Sur téléphone, le carnet se replie en un petit onglet (replié d'office, choix gardé).
- Commandes, Son, Qualité et Quitter passent dans un menu derrière une roue dentée ⚙.
- Chaque arme montre dans le sac ses **dégâts**, sa **vitesse** (durée d'un coup) et son **allonge**, en barres comparées aux autres armes, et si elle tue d'un coup appuyé à la tête.

**La décharge du terrain** (proposition P-001, Book 19 §2 ter)
- Un tas d'ordures au bord de chaque terrain fait **remonter un objet toutes les deux heures**, même hors ligne, jusqu'à 12 : surtout des trucs nuls, parfois une bonne surprise. Le rapport d'absence le dit.
- On y fouille comme dans un coffre, objet par objet : il faut choisir ce qu'on emporte.

**Entendre**
- Les **effets sonores enregistrés** de la session son (82 sons, 237 fichiers, CC0) remplacent les sons synthétisés, chargés à la demande ; la recette synthétisée reste en secours.
- Soufflet et trempe à la forge, scie, hache, aiguiser et braises s'entendent enfin.

**Construire : la pose revue**
- Pendant la pose, **le personnage ne bouge plus : seul le fantôme bouge**. Clavier ou joystick le poussent ; un clic (ou un appui du doigt) au sol l'y amène ; un second clic dessus construit.
- Bouger la souris ne déplace plus rien : on clique sur « Tourner » ou « Annuler » sans déranger le fantôme. Molette ou R : tourner. Clic droit ou Échap : annuler.
- Un cercle pointillé montre jusqu'où l'on peut construire.

**Voir**
- Le **cercle de visée** se voit toujours, même sous un objet, à la taille de ce qu'on vise, avec un contour sombre et une pulsation lente (proposition P-007).
- **Les objets refaits** : toutes les installations, le feu de camp et le foyer Dakota, la fumée (un seul appel de dessin), les ressources du terrain et de la halte, le vélo couché, la décharge. Les armes en main sont redessinées et **tenues dans le poing** (elles traversaient le poignet).
- **68 icônes dessinées à la main** pour les vestiges et les composants ; quatre anciennes refaites.
- **On arrive à la station du bon côté** (proposition P-006) : du terrain par l'est, vers le Carrefour par l'ouest, comme sur la carte. Au Carrefour, la route de la station arrive par l'est ; la route fermée de la Ville part à l'ouest.

## 0.2 · déployée le 2026-10-08

**Jouer : le carnet guide après le tutoriel** (Book 22)
- **S'installer** (toutes les familles), dans l'ordre de l'urgence : un vrai repas, un coffre à soi, de quoi se défendre, se soigner, le Comptoir du Carrefour, premiers wotts, la main tendue.
- **Le métier**, la chaîne de sa famille :
  - 🔥 charbonnière → défourner → forger une lame → la vendre ;
  - ⚙️ meule → affûter → dynamo → déposer l'électricité ;
  - ⚡ rapporter le panneau de la station → l'installer → faire le plein → déposer l'électricité.
- Chaque objectif a ses compteurs et sa récompense : des objets, ou une prime des Compteurs en wotts, versée sur le compte au Comptoir (prise sur leur trésorerie ; vide, elle attend).
- Ce qui est déjà fait compte : un ancien bien équipé enchaîne plusieurs objectifs d'un coup.

## 0.1.1 · déployée le 2026-10-08

Correctifs de sécurité, après la revue des spécialistes BMAD (architecte et développeur).

- **Faille du Comptoir corrigée.** Un client modifié pouvait vendre un faux objet (« toString ») et rendre la trésorerie commune illisible (NaN) pour tout le monde. Chaque message du client est maintenant contrôlé à l'arrivée (`serveur/src/controle.ts`), et le guichet refuse tout montant qui n'est pas un nombre positif.
- **Échange atomique.** Les deux côtés d'un échange sont enregistrés d'un seul bloc : une panne au milieu ne peut plus dupliquer ni perdre d'objets.
- **Limite d'essais.** 10 mots de passe faux par adresse et par pseudo en 10 minutes, 10 inscriptions par adresse en 10 minutes. Au-delà : « Trop d'essais. Attends quelques minutes ».
- **Base plus douce pour la carte du Pi** (SQLite `synchronous = NORMAL`) : moins d'écritures forcées, moins d'à-coups. Une coupure de courant peut faire perdre les dernières secondes, jamais la cohérence.
- Les mesures d'images par seconde envoyées par le client : au plus une toutes les 20 s.
- Le serveur de fichiers vérifie le chemin avec son séparateur.

## 0.1 · déployée le 2026-10-08

**Jouer**
- Choisir où l'on construit : un fantôme sur une grille de 50 cm, vert ou rouge, qu'on tourne (Book 10 §7.1).
- Les plats cuisinés au feu (volaille aux cèpes, poêlée de cèpes, pommes cuites) nourrissent mieux. Manger désaltère (Book 05 §3, Book 11 §11).
- Faim et soif presque 3 fois plus lentes, fatigue 2,5 fois plus lente (réglables à chaud).
- Après un effondrement, il ne reste que les poches (10 kg). Le sac de fortune (4 branches, 2 cordes) porte 30 kg (Book 12 §2.1).
- Des indices quand on s'y prend mal : chaque refus dit quoi faire et où trouver ce qui manque (Book 08 §3).
- Compteurs du tutoriel (« Branches 2/3 · Pierres 1/5 »).
- Le panneau solaire de la station est au sol, contre un pilier de l'auvent.
- Le grand cercle des arbres fruitiers n'apparaît que quand on porte l'escabeau.

**Voir**
- Les coiffures tiennent sur toutes les têtes : plus de Voltaïques chauves ni de calvitie avec la coupe « Ras ». Les cheveux ne traversent plus le chapeau.
- Épaves de voiture et de camion refaites.
- Faune refaite : poules, lapins, renard, colverts, héron.
- Bâtiments refaits (station, boutique, atelier, grange, ruine, Comptoir). La boutique se lit de loin : enseigne, vitrine, porte, intérieur.
- Les toits et façades qui cachent le personnage disparaissent complètement (leur ombre reste), à la halte comme au Comptoir, et suivent le quart de tour de la caméra.

**Plus léger** (même image, mêmes règles)
- Client : 728 → ≈ 390 appels de dessin par image sur le terrain.
  - Les morceaux de même matériau sont fondus.
  - Branches, bûches et pierres sont dessinées en lots.
  - Les accessoires des personnages sont fondus.
- Réseau, à la halte avec 100 joueurs : 15 → 7,4 Ko/s par joueur.
  - On n'envoie que les joueurs qui ont bougé.
  - Les Éteints sont envoyés seulement autour de chaque joueur.
  - La position est arrondie au millimètre.
  - Les poules sont envoyées seulement quand elles bougent, moins souvent si elles sont calmes.
- Serveur (Mac) : 0,79 → 0,56 ms de calcul par joueur et par seconde ; pire pic de 142 → 40 ms.
- Téléchargement : le code part compressé (1 024 → 259 Ko). Les fichiers sont gardés en cache, et revérifiés en 0 octet s'ils n'ont pas changé.

**Outils**
- Numéro de version, journal des versions, retour en arrière sur le Pi.
- `deploiement/mesurer-pi.sh` : le banc de charge sur le Pi (un mot de passe).

## 0 · déployée le 2026-10-08

Première version en ligne sur le Pi (`https://preprod.example.org:1234`).

- Les étapes É0 à É5 de la phase 0a : terrain, survie, fabrication, halte, Comptoir, échanges, Éteints, combat, tutoriel, sommeil, météo, calendrier des récoltes, verger, champignons, escabeau, faune.
- Réglages à chaud, mesures, sauvegardes quotidiennes, HTTPS (Let's Encrypt).
