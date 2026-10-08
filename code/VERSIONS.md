# Les versions de *Watt Now?*

Le numéro est dans `commun/src/version.ts` (et `package.json`). Il s'affiche à l'accueil et dans le jeu (en haut à droite, à côté des images par seconde), et `/api/sante` le donne. Sur le Pi, chaque image Docker porte son numéro ; `watt-now:courante` est celle qui tourne.

**Revenir à la version d'avant**, sur le Pi :

```bash
cd ~/watt-now && docker tag watt-now:<version> watt-now:courante && docker compose up -d
```

(La version 0 s'appelle `watt-now:0a`.) Les données des joueurs ne bougent pas.

---

## 0.2 · en préparation

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
