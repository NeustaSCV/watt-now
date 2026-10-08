# Watt Now? — le code

Phase 0a, étapes **É0** et **É1** (faites), **É2 : fabriquer** (en cours), Book 21 §3.9.

## Lancer le jeu

```bash
npm install        # une fois ; le cache npm reste dans code/.npm-cache
npm run dev        # serveur de jeu (port 8787) + client (port 5173)
```

- Sur ce Mac : http://localhost:5173
- Sur l'iPhone, sur le même Wi-Fi : l'adresse « sur l'iPhone » affichée au démarrage.

## Vérifier

```bash
npm test           # tests unitaires + test de bout en bout du critère É0
npm run verif      # vérification des types TypeScript
npm run build      # client de production dans client/dist
```

## Test familial (É5, lot 4)

```bash
npm run reglages   # les réglages d'équilibrage, leurs bornes, leur valeur en cours
npm run bilan      # le bilan des mesures (temps par activité, wotts, effondrements, progression, serveur, appareils)
node scripts/banc-charge.ts halte 50 30   # banc de charge (joueurs simulés, base jetable)
```

- **Réglages à chaud** : écrire seulement les valeurs à changer dans `serveur/donnees/reglages.json` (par exemple `{ "faim_rythme": 0.8 }`). Le serveur les relit en 2 s et les envoie aux joueurs, sans redémarrer.
- **Mesures** (Book 17 §6) : table `mesures` de la base, sans rien de personnel (ni pseudo, ni position).
- **Sauvegardes** (en production) : une par jour (gardée 7 jours) et une par semaine (gardée 4 semaines), dans `serveur/donnees/sauvegardes/`.
- **Raspberry Pi** : `Dockerfile` et `deploiement/` (voir `deploiement/LISEZMOI.md`).

## Organisation

| Dossier | Contenu |
|---|---|
| `commun/src/` | Ce que partagent le client et le serveur : règles (`regles.ts`), déplacement (`deplacement.ts`), messages réseau (`messages.ts`) |
| `serveur/src/` | Serveur autoritaire : HTTP (connexion) + WebSocket (jeu), monde à 20 pas par seconde, base SQLite (`serveur/donnees/`) |
| `client/src/` | Accueil, entrées (clavier, joystick tactile), réseau, rendu Three.js (`rendu/`), HUD |
| `scripts/` | Lancement du développement |

Le TypeScript tourne **directement dans Node** (sans compilation), d'où les imports en `.ts`.

## Commandes du jeu (Book 08 §3)

Le jeu part d'un clavier **AZERTY**. Toutes les touches se réassignent avec le bouton **Commandes** du menu (en haut à droite, sur ordinateur). L'aide-mémoire en bas de l'écran n'apparaît que pendant le tutoriel. Ci-dessous, les touches par défaut.

| Action | Clavier et souris | Tactile |
|---|---|---|
| Se déplacer | ZQSD, flèches | Joystick |
| Courir / allure discrète | Maj / C | Inclinaison du joystick |
| **A** : agir (ramasser, démonter, fouiller, allumer, ajouter du bois, remplir, pédaler, affûter, recharger…). L'anneau autour de l'objet se remplit. Geste de 5 s ou moins : **garder A enfoncé** (lâcher l'arrête) ; geste plus long : **un appui le lance, un autre l'arrête** (jauge avec pourcentage). Fabrication : un tas de matières devant soi ; A, B ou Échap l'annulent | E, Espace ou clic gauche | Gros bouton rouge |
| **B** : examiner (ou action secondaire près d'un feu) | F ou clic droit | Bouton B |
| Sac (manger, boire, lumière, charge des batteries) | I ou Tab | Sac (en haut à droite ; en haut au centre en paysage) |
| Fabriquer (feu, hache, établi, abri, coffre, installations de famille…) | B | Fabriquer (à côté du Sac) |
| Jeter un objet par terre (sac trop lourd) | Sac, puis l'objet, puis « Jeter » | Idem |
| Ranger dans le coffre | E devant le coffre : « Ouvrir le coffre » | A |
| Mode Combat (il se met tout seul quand un Éteint approche) | X | Explorer / Combat |
| En combat : frapper (appui court) ; coup appuyé visé à la tête (maintenir puis relâcher) | E, Espace ou clic gauche | A |
| En combat : esquiver ; saisi : taper vite pour se dégager | F ou clic droit | B |
| Carte du monde (au bout du chemin, au sud du terrain, ou aux bouts de la route de la halte : « Prendre la route ») | M | Carte |
| Lumière portée (torche, lampe frontale, lanterne) | R | Lumière |
| Tourner la vue d'un quart de tour | V (Maj+V dans l'autre sens) | ⟳ (portrait) ; « Vue » en haut au centre (paysage) |
| Zoom | Molette | — |
| Mode photo (heure, temps, angle, zoom libres ; HUD masqué) | P (H : masquer le panneau de réglages) | — |

## Les lieux (É3)

- **Ton terrain** : sortie par le chemin, au sud (panneau « Route de la Campagne »).
- **Le Comptoir du Carrefour** (É4) : zone neutre gardée par les Compteurs, sans Éteints. La route du terrain y passe par la station-service, qu'il faut traverser à pied. Au guichet : vendre et acheter à prix fixes (énergie grise ± 20 %, prix plancher des ressources de base), déposer l'électricité de ses batteries (0,85 wott par Wh au printemps : le seul geste qui crée des wotts), recharger ses batteries (1 wott par Wh), mettre ses bons à l'abri sur un compte. Les wotts se déchargent d'≈ 2 % par semaine. Le pédalier des Compteurs paie 60 wotts l'heure (78 pour un Mécaniste). La trésorerie part de 10 000 wotts, + 1 000 par joueur ; le stock de base revient d'une unité toutes les 2 h.
- **La base qui tourne seule** (É4, lot 2) : le petit panneau solaire (recette voltaïque : le panneau, 3 branches, Visser 1) se pose sur le terrain et se branche tout seul sur un banc de recharge à moins de 6 m. Il produit au calendrier, connecté ou non : ≈ 80 Wh_é par jour de calendrier au printemps (1 h 50 réelle). L'énergie va aux batteries posées sur le banc (« Poser les batteries sur le banc ») ; sans place, elle est perdue. Au retour (absence de plus de 2 min), le **rapport de la base** dit ce qui a été produit, stocké, perdu, et où en sont la charbonnière et les feux.
- **Ensemble** (É4, lot 3) : à la halte et au Carrefour, on voit les autres joueurs (leur personnage de famille, leur nom, leur lampe la nuit) ; le terrain reste privé. Près de quelqu'un, A propose un **échange** : une fenêtre où chacun pose ses objets et ses wotts, puis dit s'il est d'accord. Toute modification remet les accords à zéro ; le serveur revérifie tout (objets, wotts, poids du sac) et échange d'un seul coup ; la charge des batteries suit la batterie. S'éloigner, partir ou se déconnecter annule. Pas de chat en 0a.
  Pour tester à deux sur un seul ordinateur : un onglet sur `localhost`, l'autre sur `127.0.0.1` (deux sessions séparées).
- **Le sommeil** (É5) : une jauge de repos ; éveillé, on s'use en 16 h de jeu ; « Dormir dans l'abri » récupère en 8 h (deux fois moins vite par terre). Épuisé : plus de course, travail 30 % plus lent. Se déconnecter près de son abri compte comme une nuit complète.
- **Le verger et le sous-bois** (Book 11 §10) : six arbres fruitiers par terrain (pommes, poires, prunes, cerises, noix, calories réelles), cueillis depuis un **escabeau** posé dans le disque de l'arbre ; des cèpes et des amanites (tue-mouches, phalloïde) qui empoisonnent avec retard (Book 05 §6 bis). L'escabeau est le premier **objet lourd** : on le porte (marche seulement) et on le pose (Book 10 §7.2).
- **Le calendrier des récoltes** (Book 13 §3 bis) : 1 an = 4 semaines réelles, le monde a commencé le 1er juin ; la date s'affiche en haut à droite. Fruits et champignons à leur vraie saison (cerises en juin, pommes de mi-août à mi-novembre, amanites dès juillet…) ; hors saison, fleurs ou fruits verts.
- **Gestes longs repris** (Book 08 §3) : un geste de plus de 5 s arrêté garde sa progression 2 h ; relancé, il reprend là où il en était.
- **La faune** (Book 11 §10) : trois poules ensauvagées autour de la ferme, qu'on approche en allure discrète et qu'on assomme (même au gourdin de bois dur) ; plumer, rôtir au feu (crue, elle rend malade une fois sur deux). Lapins, renard qui les chasse, colverts et héron de la mare qui s'envolent quand on approche (animés par le client seulement, pas encore chassables). La mare a une forme naturelle.
- **Choisir où construire** (Book 10 §7.1) : après « Construire », un fantôme sur une grille de 50 cm, vert ou rouge (même règle que le serveur, `commun/src/emplacement.ts`) ; A ou clic : construire ; R : tourner ; B ou Échap : annuler.
- **Panneau solaire de la station** : au sol, contre le pilier est de l'auvent (VERSION_HALTE 5 : les ressources de la halte sont régénérées au démarrage).
- **Indices** (Book 08 §3) : chaque refus dit quoi faire et où trouver ce qui manque ; ce qui ratait en silence le dit (`serveur/src/indices.test.ts`).
- **Besoins et repas** (Book 05 §3) : faim et soif à 0,35, fatigue à 0,4 (réglables) ; manger désaltère ; les plats cuisinés au feu (volaille aux cèpes, poêlée de cèpes, pommes cuites) nourrissent mieux.
- **Portage** (Book 12 §2.1) : sac à dos 55 kg, sac de fortune 30 kg (4 branches, 2 cordes), poches 10 kg après un effondrement.
- **Coiffures** (Book 18) : chaque coupe est ajustée à la tête ; planche `client/coiffures.html` (serveur de développement).
- **Immédiat ou anneau** (Book 08 §3) : ajouter du bois est immédiat ; toute action minutée remplit l'anneau (sur la cible ou aux pieds), avec une petite étiquette pour les gestes longs.
- **Le jeu s'explique** (Book 08 §3) : une recette grisée porte un bouton « Ce qu'il manque ? » qui dit ce qui manque, où le trouver et par quoi le remplacer (`commun/src/aide-fabrication.ts`). Un appui sur une jauge (faim, eau, sommeil, santé, endurance) ouvre une bulle qui l'explique. L'endurance est pleine quand on est en forme et se vide à l'effort.
- **La météo** (É5) : beau temps et pluie, commune à tout le serveur, par tranches de 3 h de jeu, avec de la persistance. La pluie réduit les bruits de 30 % et les odeurs de 50 % (le cercle de signature rétrécit).
- **Le tutoriel** (É5, Book 14 §4.2) : les 12 étapes, suivies par le serveur, affichées dans le carnet (en haut à gauche ; à droite sur téléphone en paysage). Un Éteint attiré par la fumée, puis une saisie scénarisée qui ne mord jamais. Seuls les comptes créés par l'inscription le commencent ; on peut le passer. Des conseils 💡 apparaissent la première fois qu'un système se présente (pluie, Éteint, saisie, saignement, faim, halte, comptoir…).
- **La monnaie s'appelle le wott** (et non le watt, l'unité de puissance), depuis le 2026-10-07. Les colonnes de la base gardent leur ancien nom (`watts`, `compte_watts`).
- **La station-service** (halte de 200 × 70 m, partagée par tous les joueurs) : vestiges qui reviennent lentement (conserves, petit panneau solaire sur l'auvent, lames de ressort des épaves, bâche, barre de métal, corde). Sortie ouest : retour au terrain ; sortie est : le Comptoir du Carrefour.
- Le trajet dure 10 s à l'écran (10 min de jeu) et coûte les calories et l'eau de la marche (≈ 60 kcal et 0,08 L par km).
- **Les Éteints** (lot 2) : à la halte, des dormants près du butin et quelques errants (partagés par tous) ; sur le terrain, un errant arrive de la lisière seulement si quelque chose l'attire (feu, charbonnière, lumière la nuit, travail bruyant), trois au plus, et ils repartent quand on prend la route. Ils entendent (allure, actions), sentent (fumée) et voient mal (12 m le jour, 5 m la nuit, 16 m si l'on porte une lumière). Au contact, ils saisissent puis mordent (lot 3).
- **Le cercle de signature** au sol : en blanc, jusqu'où porte le bruit qu'on fait ; en ambre la nuit, jusqu'où se voit sa lumière. La nuit, une lampe allumée fait aussi un halo ambré au bord de l'écran.
- **Le combat** (lot 3) : on frappe avec la meilleure arme du sac (hache, marteau, barre, lame forgée, couteau, poings). Un coup appuyé à la tête avec une arme solide détruit l'Éteint ; au torse, il vacille, puis tombe et se relève. Il saisit au contact et mord au bout de 3 s : se dégager (taper B/F), esquiver ou frapper. L'endurance limite coups, esquives et course.
- **Blessures et santé** : morsure (saigne), contusion, coupure ; un deuxième saignement devient fort. Le pansement (recette commune : chiffons + Couper 1) arrête le saignement. Les chiffons se trouvent dans le camion et la grange de la halte.
- **L'effondrement** : à 0 de santé, ou saisi par trois Éteints. Le sac reste sur place (on peut revenir le chercher), on se réveille chez soi, faim et soif à 30 %, en convalescence (endurance à 60 % pendant 24 min).
- Si le contenu de la halte change, augmenter `VERSION_HALTE` (`commun/src/halte.ts`) : la base la régénère.

## Pour l'iPhone

```bash
npm run dev:iphone   # même chose, en HTTPS (certificat de développement)
```

Safari affiche un avertissement : « Afficher les détails », puis « visiter ce site web ».

Plein écran : dans Safari, « ••• », puis « Partager », puis « Sur l'écran d'accueil », et lancer le jeu depuis son icône (l'accueil le rappelle sur téléphone).

## La vitrine graphique (É5, lot 2)

- **Accueil** : logo et Watty, choix de la famille et de la carnation (3 teintes) à l'inscription ; écran de chargement avec les conseils des Compteurs.
- **Habillage par famille** : le HUD prend la couleur de sa famille (pastille, liserés).
- **Moments-vitrine** (Book 21 §5.1.2) : la nuit au feu (étincelles, fumée éclairée, rôdeurs au loin dont les yeux luisent), la brume d'aube (`?heure=6.5`), l'intérieur de la boutique de la station (le toit s'efface quand on entre).
- **Mode photo** : touche P, le cercle de signature et le HUD disparaissent.
- **Accessibilité tactile** : textes d'au moins 14 px et cibles d'au moins 44 px sur écran tactile (sauf quelques petites étiquettes décoratives).

## Les personnages

- **Base** : corps riggés et animations de Quaternius (CC0), déposés dans `../download/` ; `node scripts/preparer-personnages.mjs` les prépare (simplification, textures réduites, 34 animations) dans `client/public/assets/personnages/`. Licences : `licences.csv`.
- **Dans le jeu** (`client/src/rendu/humanoides.ts`, `vetements.ts`, `accessoires.ts`) : tête agrandie (≈ 4,8 têtes), vêtements taillés dans le corps, accessoires de famille moulés sur le corps (🔥 Nadia : tablier de cuir, bandana, lunettes de soudeur ; ⚡ Malik : lampe frontale, câble en bandoulière, batterie dans le dos ; ⚙️ Rose : chapeau de paille, hotte en osier, tablier à graines). Éteints et Compteurs sur le même squelette.
- **Apparence** (Book 14 §3) : choisie à la création, juste après le pseudo et la famille (`client/src/apparence-ecran.ts`, `commun/src/apparence.ts`) ; la tenue reste celle de la famille.
- **Planche de validation** : `/personnages.html` sur le serveur de développement (animations, vues face, profil, dos, test de silhouette en aplat noir).

## Le son (É5, lot 3)

- **Musique** : livrée par la session musique (`../musique/LIVRAISON.md`). `node scripts/copier-musique.mjs` copie le moteur (`client/src/audio/`) et les fichiers (`client/public/assets/musique/`, Opus et AAC) ; à relancer à chaque nouvelle livraison. Le directeur suit le jeu : lieu, nuit, menace des Éteints (Tension, Danger), sommeil, premier feu du tutoriel, atelier de la famille, radio du Comptoir, signaux (recette, échange, premier Éteint repéré, mort).
- **Effets** : synthétisés (`client/src/son/`, 79 sons, 228 variantes), joués par le même moteur, avec la portée de signature de chaque son (Book 21 §6.3). Les ambiances de jour et de nuit, la halte et le Comptoir sont dans la musique.
- **Écouter les effets** : `/ecoute.html` sur le serveur de développement (chaque son, chaque variante).
- Le son se débloque au premier geste (iOS) ; bouton **Son : oui / non** en haut à droite.

## En développement

- `?heure=22` dans l'adresse fige l'heure affichée (pour régler la nuit sans attendre) ; `?meteo=pluie` (ou `soleil`, `voile`, `couvert`) force le temps affiché. Les règles du serveur ne changent pas.
- `window.__watt` dans la console : état du client, envoi de messages ; `__watt.son()` : état du son (contexte, phase du directeur, couches, mémoire).

## Comptes d'essai locaux

Créés pendant le développement, **uniquement dans la base locale** (`serveur/donnees/watt.sqlite`, ignorée par Git) :

| Pseudo | Mot de passe | Famille |
|---|---|---|
| Essai Nadia | essai-local-e0 | Charbonniers |
| Essai Tuto | essai-local-e0 | Charbonniers (créé par l'inscription : il commence le tutoriel) |
| Essai Malo | essai-local-e0 | Mécanistes (pour tester l'échange à deux) |
| Essai Vitrine | essai-local-e0 | Voltaïques (avec meule allumée, forge, pédalier équipé, banc de recharge : vitrine de l'É2) |
| Essai Apparence | essai-local-e0 | Mécanistes (créé par l'écran d'apparence : silhouette masculine, grand, fort, crâne rasé, barbe ; en tutoriel) |

Pour repartir de zéro : arrêter le serveur et supprimer `serveur/donnees/watt.sqlite`.

## Règles

Voir `../CLAUDE.md` : rien hors du dossier du projet sans demander (Docker compris).
