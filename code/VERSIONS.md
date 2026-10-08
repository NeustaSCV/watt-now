# Les versions de *Watt Now?*

Le numéro est dans `commun/src/version.ts` (et `package.json`). Il s'affiche à l'accueil et dans le jeu (en haut à droite, à côté des images par seconde), et `/api/sante` le donne. Sur le Pi, chaque image Docker porte son numéro ; `watt-now:courante` est celle qui tourne.

**Revenir à la version d'avant**, sur le Pi :

```bash
cd ~/watt-now && docker tag watt-now:<version> watt-now:courante && docker compose up -d
```

(La version 0 s'appelle `watt-now:0a`.) Les données des joueurs ne bougent pas.

---

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
