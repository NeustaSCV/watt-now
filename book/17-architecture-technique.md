# Book 17 — Architecture Technique

> Document de conception · version 0.3 · 2026-10-07
> Statut : **brouillon de travail**. Propositions de technologies, à confirmer au démarrage du développement.

---

## 1. Contraintes

| Contrainte | Origine |
|---|---|
| **Jeu dans le navigateur**, ordinateur et mobile | Book 08 §2 |
| **Phase 0 sur un Raspberry Pi**, dans Docker, pour un test familial | Décision du 2026-10-07 |
| **Évolution ensuite** selon la pertinence du projet | Phase 1 (Book 08 §1) |
| **Monde qui continue hors ligne** : processus passifs, calendrier, sièges | Book 01 §2 bis, Book 06 §9.4 |
| **Contenu piloté par les données** (plus de 1 000 objets) | Book 03 §8 |
| **Petites maps instanciées**, ≤ 10 joueurs par instance | Book 01 §2 bis |

---

## 2. Vue d'ensemble

```
┌──────────────── Navigateur (ordinateur, mobile) ────────────────┐
│  Client : rendu 3D isométrique, entrées (clavier, manette,       │
│  tactile), son, interface. N'affiche que ce que voit le joueur.  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS + WebSocket
┌────────────────── Raspberry Pi (Docker Compose) ────────────────┐
│  Proxy inverse (HTTPS automatique)                               │
│  ├─ Fichiers du client (statique)                                │
│  └─ Serveur de jeu (autoritaire)                                 │
│       ├─ Instances de maps (terrains, lieux, haltes, comptoirs)  │
│       ├─ Services : calendrier, météo, économie, sièges          │
│       └─ Base de données (SQLite en phase 0)                     │
│  Sauvegardes automatiques                                        │
└──────────────────────────────────────────────────────────────────┘
```

**Le serveur fait autorité** : c'est lui qui décide de tout (combat, crafting, économie). Le client ne fait qu'afficher et envoyer les intentions du joueur. Cela empêche la triche et garde le monde cohérent.

**Déconnexion d'office (0.4, 2026-10-08)** : un joueur qui ne fait rien depuis **5 minutes** (réglage à chaud `inactivite_min`) est déconnecté. Ne comptent pas : les pings, les mesures, ni l'intention « ne pas bouger » que le client renvoie par sécurité. Hors ligne, la faim, la soif et la fatigue sont **gelées** (Book 01 §2 bis) : connecté et parti, elles baisseraient pour rien. Le joueur voit un écran qui explique la pause, redonne le conseil de l'abri, et propose « Reprendre ».

**Ce que le serveur ne croit jamais** (0.1.1, 2026-10-08, après la revue BMAD) :

- **Chaque message du client est contrôlé à l'arrivée** (`serveur/src/controle.ts`) : un type connu, des nombres finis, de vrais objets du jeu (pas « toString », qui existe sur tout objet JavaScript), des chaînes courtes. Le reste est ignoré sans réponse. Les règles du jeu (portée, inventaire, prix) sont vérifiées ensuite, comme avant.
- **Un échange s'enregistre d'un seul bloc** (une transaction pour les deux joueurs) : jamais de duplication ni de perte d'objets sur une panne.
- **Les essais de mot de passe sont limités** : 10 échecs par adresse et par pseudo en 10 minutes ; 10 inscriptions par adresse en 10 minutes. Une famille derrière la même box reste loin de ces seuils.
- **Ce qu'on accepte de perdre** sur une coupure : les dernières secondes (la position, les besoins et les charges sont sauvés toutes les 5 s ; l'inventaire et les wotts à chaque changement). SQLite en `synchronous = NORMAL` garde la base cohérente.
- Encore à faire : le calcul du mot de passe (scrypt) bloque la boucle de jeu ≈ 50 à 100 ms sur le Pi à chaque connexion ; les jetons n'expirent pas ; pas de limite générale du nombre de messages par seconde.

---

## 3. Propositions de technologies

| Élément | Proposition | Pourquoi |
|---|---|---|
| **Langage** | **TypeScript**, côté client **et** serveur | Un seul langage ; le code commun (règles, recettes, calculs d'énergie grise) est partagé |
| **Rendu** | **Three.js** (WebGL), en **3D** avec caméra orthographique isométrique | 3D décidée (Book 19 §7). Bibliothèque légère et répandue ; éclairage dynamique natif (lumière de nuit, Book 18). Prototype déjà réalisé. |
| **Réseau** | WebSocket, messages compacts | Temps réel dans les maps |
| **Serveur** | Node.js | Tourne bien sur Raspberry Pi (ARM64) |
| **Base de données** | **SQLite** en phase 0, **PostgreSQL** en phase 1 | SQLite suffit largement pour une famille, sans serveur de base à gérer |
| **Conteneurs** | Docker Compose | Déploiement simple, identique partout |
| **Proxy, HTTPS** | Caddy | Certificats HTTPS automatiques |
| **Contenu** | Tableur → JSON (Book 03 §8) | Les objets et recettes sont des données, pas du code |

> Alternative pour le rendu : **Babylon.js** (moteur 3D plus complet : physique, éditeur, outils). Plus lourd. À trancher au prototype.
>
> **Performances mobiles en 3D :** modèles simples (low poly), ombres limitées aux objets proches, éclairage de nuit plafonné à quelques sources actives, réglages de qualité.

---

## 4. Le temps et le monde hors ligne

Faire tourner en permanence tout le monde (terrains, cultures, charbonnières) coûterait cher à un petit serveur. La solution : **calculer à la demande**.

| Élément | Méthode |
|---|---|
| **Processus passifs** (séchage, cultures, charbonnière, compost) | On enregistre **l'heure de début et la durée**. L'état se calcule quand quelqu'un regarde. Aucun calcul en attendant. |
| **Énergie de la base** (soleil, eau, vent, manège, vapeur) | Calculée **à la reconnexion**, ou quand quelqu'un regarde : on rejoue la production au calendrier depuis la dernière visite (météo retrouvée par sa graine), par pas d'une heure de calendrier. Chaque pas alimente les machines selon leurs priorités et ce qui leur a été chargé, puis les batteries. Le surplus est perdu (Book 01 §2 bis). |
| **Calendrier, saisons** | Calculés à partir de l'heure réelle et du début du cycle |
| **Météo** | Générée par une graine déterministe, en deux couches : épisodes au calendrier, temps qu'il fait à l'horloge d'action (Book 13 §2.1). On peut retrouver le temps qu'il faisait à n'importe quel moment. |
| **Santé et besoins hors ligne** | Rien à calculer : tout ce qui suit l'horloge d'action est gelé. Seules les guérisons au calendrier avancent, calculées à la reconnexion (Book 01 §2 bis). |
| **Sièges hors ligne** (Book 06 §9.4) | Résolus **à la reconnexion** du joueur : on rejoue de façon déterministe ce qui a pu arriver pendant son absence, et on produit le rapport |
| **Maps actives** | Seules les instances **où se trouvent des joueurs** tournent en temps réel (≈ 10 calculs par seconde suffisent pour des zombies lents) |
| **Économie** | Cours recalculés périodiquement (par exemple toutes les heures), à partir des transactions enregistrées |

> Ce choix rend le Raspberry Pi viable : le serveur ne travaille vraiment que là où il y a des joueurs.

---

## 5. Phase 0 : le Raspberry Pi

### 5.1 Matériel recommandé

| Élément | Recommandation | Pourquoi |
|---|---|---|
| **Carte** | Raspberry Pi 5 (ou 4) avec **8 Go** de mémoire | Marge pour Docker, la base et plusieurs instances |
| **Stockage** | **SSD en USB** (ou NVMe sur Pi 5), pas la carte SD seule | Les cartes SD s'usent vite avec une base de données |
| **Alimentation** | Officielle, éventuellement onduleur | Éviter les coupures qui corrompent la base |
| **Refroidissement** | Ventilateur ou boîtier dissipant | Charge continue |

### 5.2 Capacité mesurée (2026-10-08)

Mesurée sur le vrai serveur de la 0a (banc de charge : joueurs simulés qui bougent sans arrêt, 20 calculs par seconde), sur un Mac M2. Pour le Raspberry Pi 5, on compte un processeur **3 à 4 fois plus lent** (estimation, à vérifier sur le Pi avec le même banc).

**Ce que coûte un joueur connecté**

| Ressource | Mesure (M2) | Raspberry Pi 5 (estimé) |
|---|---|---|
| Calcul | ≈ 0,4 ms par seconde sur son terrain, ≈ 1 ms à la halte (0,1 % d'un cœur) | ≈ 1,5 à 4 ms par seconde |
| Mémoire | ≈ 0,3 Mo par joueur, plus ≈ 50 Mo pour le serveur | idem |
| Débit envoyé | ≈ 2,3 Ko/s sur son terrain ; ≈ 7 Ko/s à la halte, plus ≈ 0,2 Ko/s par autre joueur à moins de 40 m | idem |
| Débit reçu | ≈ 0,5 Ko/s (déplacements, ping) | idem |
| Premier chargement d'un appareil | ≈ 20 Mo (musique, personnages, code), puis en cache | idem |

**Deux réglages pour tenir la charge** (décidés le 2026-10-08) :

- **Présences allégées.** L'identité d'un autre joueur (pseudo, famille, apparence, lumière) n'est envoyée que lorsqu'elle change ou qu'il entre dans le champ ; ensuite, seulement sa position, en quelques nombres, 10 fois par seconde, et seulement pour les joueurs **à moins de 40 m** (oubliés au-delà de 45 m). Avant : 222 octets par voisin et par envoi, soit 200 Ko/s par joueur avec 100 joueurs à la halte ; après : **15 Ko/s**.
- **Sauvegardes étalées et groupées.** Chaque joueur est sauvegardé toutes les 5 s, mais par petits groupes répartis sur une seconde, chacun en **une transaction**. Sauver tout le monde d'un coup figeait le serveur (≈ 25 ms pour 100 joueurs sur le M2, sans doute 80 à 120 ms sur le Pi, au-delà des 50 ms entre deux calculs). Après : pire retard mesuré **≈ 40 ms** avec 100 joueurs.

**Ce que ça donne**

| Situation | Raspberry Pi 5 | Connexion de la maison (envoi) |
|---|---|---|
| **Test familial** (≤ 10 joueurs connectés) | Très large : < 5 % du processeur, < 100 Mo de mémoire | ≈ 0,2 à 1 Mbit/s en jeu ; premier chargement ≈ 30 s par appareil à 5 Mbit/s |
| **50 joueurs connectés** | À l'aise (≈ 10 à 20 % d'un cœur, estimé) | ≈ 1 à 5 Mbit/s selon la foule à la halte |
| **100 joueurs connectés** | Possible (≈ 20 à 40 % d'un cœur, estimé) | ≈ 2 à 12 Mbit/s : c'est la connexion, plus le processeur, qui devient la limite |

> Au-delà, la limite n'est plus le calcul mais le **débit sortant** et le **premier chargement** des fichiers : c'est le passage au §7 (serveur en ligne, fichiers sur un CDN). Le banc de charge est à relancer sur le Pi au moment du déploiement.

> **Mesuré sur le vrai Pi (2026-10-08, version 0).** Raspberry Pi 4 Model B, 4 cœurs, 3,8 Go, système 64 bits. Le jeu au repos y prend 0,7 % du processeur. Banc de charge dans le conteneur (`code/deploiement/mesurer-pi.sh`) :
>
> | Scénario | Calcul par joueur | Part d'un cœur | Retard de boucle p99 / max | Envoyé par joueur | Mémoire |
> |---|---|---|---|---|---|
> | 50 joueurs sur leur terrain | 2,75 ms/s | 14 % | 13 / 51 ms | 3,6 Ko/s | 114 Mo |
> | 25 joueurs à la halte | 5,0 ms/s | 13 % | 12 / 47 ms | 7,6 Ko/s | 113 Mo |
> | 50 joueurs à la halte | 4,8 ms/s | 24 % | 21 / 72 ms | 10 Ko/s | 119 Mo |
> | 100 joueurs à la halte | 6,0 ms/s | 60 % | **54** / 135 ms | 14 Ko/s | 134 Mo |
>
> - **Le Pi 4 est ≈ 6 fois plus lent que le Mac** de développement, et non 3 à 4 comme estimé.
> - Le test familial (≤ 10 joueurs) est très à l'aise.
> - À 100 joueurs réunis à la halte, la version 0 dépassait l'objectif de 50 ms entre deux calculs du monde.
>
> **Allègements de la version 0.1** (même image, mêmes règles ; voir `code/VERSIONS.md`) :
> - **Serveur** :
>   - l'identité des joueurs est calculée une fois par envoi (c'était le premier coût) ;
>   - un message diffusé n'est mis en forme qu'une fois ;
>   - on n'envoie que les joueurs qui ont bougé ;
>   - les Éteints de la halte sont envoyés à chacun dans un rayon de 45 m ;
>   - la position est arrondie au millimètre ;
>   - les poules sont envoyées seulement quand elles bougent.
>   - Sur le Mac, à 100 joueurs à la halte : 15 → 7,4 Ko/s par joueur, 0,79 → 0,56 ms de calcul, pire pic de 142 → 40 ms.
>   - **Remesuré sur le Pi (0.1, 2026-10-08)** : 100 joueurs à la halte 60 → 52 % d'un cœur, p99 54 → 46 ms, pire 135 → 76 ms, 14 → 8,2 Ko/s. Réseau partout ≈ −40 % (terrain 50 : 2,2 Ko/s ; halte 25 : 4,5 ; halte 50 : 6,3). À faible charge, le processeur monte de 2 à 5 points (terrain 50 : 16 % ; halte 50 : 29 %) : surtout le bruit d'un essai unique sans chauffe, à côté du jeu qui tourne, et un peu plus de petits objets à ramasser par la mémoire. Le banc doit gagner une chauffe et 5 essais (médiane) pour départager deux versions.
>   - **Remesuré sur le Pi (0.3, 2026-10-08)** : stable, dans le bruit d'un essai unique. Terrain 50 : 16,8 % d'un cœur, 2,2 Ko/s ; halte 25 : 14,3 %, 4,5 Ko/s ; halte 50 : 28,1 %, p99 21,5 ms, 6,2 Ko/s ; halte 100 : 55 %, p99 50 ms, pire 118 ms, 8,3 Ko/s, 160 Mo. Le jeu au repos : 0,7 % du processeur. Les vestiges, la décharge, le bushcraft et les quêtes n'ont rien coûté de visible côté serveur ; les pires pics isolés (jusqu'à 160 ms sur un essai à 25 joueurs) restent à surveiller avec un banc à plusieurs essais.
>   - **La Coopérative (0.5g, 2026-10-08)** : nouveau scénario `cooperative` du banc. Chaque joueur est dans sa propre Coopérative (24 Éteints), une hache à la main, et bouge et frappe sans arrêt : c'est le pire cas pour l'IA. Cible du Book 23 §7 : retard p99 < 25 ms à 10 joueurs, **sur le Pi**.
>     - Sur le Mac, 10 joueurs : 3,6 % d'un cœur, p99 10,6 ms, 2,6 Ko/s par joueur, 70 Mo, tous restés sur place.
>     - Sur le Mac, 20 joueurs : 5 % d'un cœur, p99 14,6 ms, 2,5 Ko/s.
>     - Les pics isolés (jusqu'à 280 ms) existent aussi à la halte dans les mêmes conditions : c'est le Mac chargé par d'autres programmes, pas la Coopérative.
>     - `mesurer-pi.sh` fait maintenant une chauffe, puis trois essais à 10 et à 20 joueurs en Coopérative (on retient la médiane). **À lancer sur le Pi une fois la 0.5 déployée.**
> - **Fichiers** :
>   - compression brotli ou gzip : le code passe de 1 024 à 259 Ko ;
>   - cache d'un an pour les fichiers versionnés, d'un jour avec étiquette (ETag) pour les autres, revérifiés en 0 octet s'ils n'ont pas changé ;
>   - `index.html` toujours revérifié.
> - **Client** : 728 → ≈ 390 appels de dessin par image sur le terrain.
>   - Les morceaux de même matériau sont fondus (`rendu/fusion.ts`).
>   - Branches, bûches et pierres sont dessinées en lots (`rendu/lots.ts`).
>   - Les ombres comptent pour près de la moitié des appels qui restent.

### 5.3 Accès depuis l'extérieur

| Option | Avantages | Inconvénients |
|---|---|---|
| **Tunnel** (Cloudflare Tunnel ou équivalent) | Pas de port à ouvrir sur la box, HTTPS géré | Dépend d'un service tiers |
| **Réseau privé** (Tailscale ou équivalent) | Très sûr : seuls les invités y accèdent | Chaque joueur installe un client |
| **Ouverture de port + nom de domaine** | Autonome | Exposition directe de la maison à Internet |

> Pour une phase familiale, le **réseau privé** ou le **tunnel** sont les plus simples et les plus sûrs.

### 5.4 Sauvegardes

- Sauvegarde **quotidienne** de la base, avec rotation (7 jours, 4 semaines).
- Copie **hors du Pi** (disque externe ou stockage en ligne).
- Une sauvegarde particulière à chaque **fin de cycle** (Book 09), pour les classements.

> **Fait (É5, lot 4, 2026-10-08).**
> - **Qui sauvegarde** : le serveur lui-même, en production. Rien n'est à planifier sur le Pi.
> - **Quand** : une sauvegarde par jour (gardée 7 jours) et une par semaine (gardée 4 semaines).
> - **Comment** : une copie cohérente et compacte de la base (`VACUUM INTO`), faite pendant que le jeu tourne. Elle prend ≈ 20 ms aujourd'hui.
> - **Où** : dans `donnees/sauvegardes/`, que l'on peut remplacer par un disque externe monté à cette place (copie hors du Pi).
> - **Pas encore** : la sauvegarde de fin de cycle, puisqu'il n'y a pas de cycle en 0a.
>
> **Le déploiement** : un seul conteneur Docker (le serveur sert aussi le client compilé), un volume pour les données, un redémarrage automatique, et un contrôle de santé sur `/api/sante`. Mode d'emploi : `code/deploiement/LISEZMOI.md`.
>
> **Le certificat HTTPS (2026-10-08)** est un certificat **Let's Encrypt** pour `preprod.example.org`. Le wildcard `*.example.org` n'était pas utilisable.
> - Il est obtenu par **défi DNS**, parce que l'adresse du Pi est privée : un TXT `_acme-challenge` créé à la main dans la zone publique.
> - Le script `code/deploiement/certificat/obtenir.sh` lance certbot dans Docker sur le Mac, sans adresse e-mail.
> - Il dure 90 jours ; le premier expire le 6 janvier 2027. **On le renouvelle vers le 60e jour.**
>
> **Le Pi du test familial (décision du 2026-10-08)** : un Raspberry Pi 4 à l'adresse 192.168.254.99, qui fait déjà tourner d'autres services légers.
> - Le jeu y est publié sur le **port 1234**, et limité à 2 cœurs et 768 Mo.
> - **L'image se construit sur le Mac** (arm64, comme le Pi) et s'envoie par SSH : le Pi 4 ne compile rien.
> - `code/deploiement/deployer.sh` fait tout en une commande : il vérifie le Pi et le port, lance les tests, construit et envoie l'image, relance le jeu, puis contrôle sa santé.
> - **Image testée sur le Mac** : elle démarre « healthy ». Avec 50 joueurs simulés à la halte, dans le conteneur : 15 ms de retard p99, 11 % d'un cœur, 128 Mo.
> - **L'adresse des joueurs** est `preprod.example.org:1234`, qui résout sur l'adresse privée du Pi.
> - **Le jeu sert HTTPS directement**, sur ce même port, dès qu'il trouve son certificat (`donnees/certificat/fullchain.pem` et `privkey.pem`) :
>   - une connexion en clair est renvoyée vers `https://`, sauf le contrôle de santé de Docker ;
>   - un certificat renouvelé est repris sans redémarrer.
>   - Sans certificat, le jeu reste en HTTP.
>   - Testé dans Docker sur le Mac, avec un certificat de test.

---

## 6. Ce qui doit être mesuré dès la phase 0

Le test familial sert aussi à **récolter des données d'équilibrage** :

- temps passé par activité (collecte, crafting, expédition, soins) ;
- flux de wotts et cours (Book 07 §7.2) ;
- causes d'effondrement (Book 06 §12) ;
- progression par famille et par semaine (Book 09 §2) ;
- performances du serveur (charge du processeur, mémoire, latence).

> **Fait (É5, lot 4, 2026-10-08).** Chaque mesure est une ligne de la table `mesures` : l'instant, le compte (un numéro), la famille, le genre, quoi, combien. Rien de personnel n'y figure : ni pseudo, ni position, ni message.
>
> | Genre | Ce qu'on note |
> |---|---|
> | **Activité** | Le temps de chaque action, rangé en collecte, fabrication, soins, nourriture et eau, feu et charbon, énergie ; plus le sommeil, les expéditions (trajets) et le combat |
> | **Wotts** | Création (dépôt d'électricité), ventes, achats, pédalier des Compteurs, destruction (recharge au comptoir) |
> | **Effondrement** | La cause (sang perdu, poison, trop d'Éteints…) et le lieu |
> | **Progression** | Chaque recette réussie, chaque étape du tutoriel |
> | **Séance** | La durée de chaque connexion |
> | **Serveur** | Chaque minute : processeur, mémoire, retard de la boucle (p99 et maximum), joueurs connectés |
> | **Appareil** | Chaque minute : images par seconde, moyenne et creux (les 5 % les plus lentes), type d'appareil, qualité graphique. C'est ainsi qu'on vérifie l'objectif de **30 images par seconde sur iPhone 13**. |
>
> `npm run bilan` (ou le même script dans le conteneur) en fait un compte rendu en français, par famille et par semaine.

---

## 7. Évolution vers la phase 1

| Besoin | Évolution |
|---|---|
| Plus de joueurs | Serveur dédié ou hébergement en ligne ; plusieurs processus d'instances |
| Base plus robuste | PostgreSQL |
| Paiement (Book 08 §4) | Prestataire de paiement, page séparée du jeu |
| Fichiers du client | Réseau de distribution de contenu (CDN) |
| Plusieurs serveurs | Un serveur = un monde = un cycle ; classement général commun |

> Garder dès la phase 0 une architecture **en conteneurs** et un serveur **sans état caché** (tout en base) rend ce passage simple.

---

## 8. Questions ouvertes

- [ ] **Three.js ou Babylon.js :** à trancher au prototype (rendu 3D isométrique décidé).
- [ ] **Accès phase 0 :** tunnel ou réseau privé ?
- [ ] **Authentification :** mot de passe, lien magique par e-mail, ou comptes invités en phase 0 ?
- [ ] **Outil de simulation économique** (Book 07 §12) : script séparé, réutilisant le code partagé du jeu.
