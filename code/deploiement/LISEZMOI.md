# Mettre *Watt Now?* sur le Raspberry Pi (test familial)

Le jeu tourne dans **un seul conteneur Docker** : le serveur de jeu sert aussi les pages du jeu. Les données (base, réglages, sauvegardes) restent dans le dossier `~/watt-now/donnees/` du Pi, hors de l'image : on peut mettre le jeu à jour sans rien perdre.

## 1. Le Pi (une fois)

- **Raspberry Pi 4** (le nôtre, à l'adresse 192.168.254.99) ou 5, avec 2 Go au moins pour le jeu (il en prend ≈ 130 Mo), **SSD** en USB ou NVMe (pas la carte SD seule : elle s'use vite avec une base de données), alimentation officielle (Book 17 §5.1).
- **Raspberry Pi OS 64 bits** (Lite suffit).
- **Docker** installé, avec son extension *compose* (voir la documentation de Docker pour Debian).

## 2. La connexion au Pi

Le script se connecte au Pi en SSH **avec le mot de passe**, qu'il demande trois fois (vérifier le Pi, envoyer l'image, relancer le jeu). Il ne pose aucune clé et ne modifie aucune configuration, ni sur le Mac, ni sur le Pi. Sur le Pi, il n'écrit que dans `~/watt-now/` et ajoute l'image `watt-now:0a` à Docker. L'utilisateur du Pi doit pouvoir lancer `docker`.

## 3. Déployer (et mettre à jour)

Depuis le Mac, une seule commande :

```bash
code/deploiement/deployer.sh
```

Elle fait tout, dans l'ordre, et s'arrête à la première erreur en expliquant quoi faire :

1. elle lance les tests et la vérification des types, sur le Mac : rien n'est envoyé si quelque chose échoue ;
2. elle vérifie le Pi : Docker, architecture (64 bits attendu), **port 1234 libre** ou déjà tenu par le jeu ;
3. elle **construit l'image sur le Mac**, pour l'architecture du Pi (le Pi 4 ne compile rien) ;
4. elle l'envoie au Pi par SSH (≈ 650 Mo, compressés en route) ;
5. elle installe `compose.yaml` dans `~/watt-now/` sur le Pi, relance le jeu et attend qu'il soit en bonne santé ;
6. elle vérifie que le Mac le joint.

Le jeu répond alors sur **http://192.168.254.99:1234**. Variantes :

```bash
code/deploiement/deployer.sh --sans-tests                 # plus rapide, sans relancer les tests
WATT_PI_UTILISATEUR=stan code/deploiement/deployer.sh    # un autre utilisateur que « pi »
WATT_PORT=1235 code/deploiement/deployer.sh              # un autre port
```

Sur le Pi, le jeu vit dans `~/watt-now/` : `compose.yaml`, `.env` (le port) et `donnees/` (base, réglages, sauvegardes). Il redémarre tout seul après une coupure (`restart: unless-stopped`) et se limite à 2 cœurs et 768 Mo, pour laisser de la place aux autres services. À chaque mise à jour, les joueurs connectés sont déconnectés une vingtaine de secondes ; leur état est sauvegardé.

## 3 bis. HTTPS (https://preprod.example.org:1234)

Le jeu sert **HTTPS directement**, sur le même port 1234, avec un certificat **Let's Encrypt** pour `preprod.example.org`. Ce certificat dure 90 jours ; le premier expire le 6 janvier 2027.

**Obtenir ou renouveler le certificat** (vers le 60e jour), sur le Mac :

```bash
code/deploiement/certificat/obtenir.sh
```

- Il lance certbot dans Docker et affiche la valeur d'un enregistrement **TXT `_acme-challenge.preprod.example.org`** à créer dans la zone DNS publique. La valeur change à chaque demande.
- Il attend jusqu'à 2 h que l'enregistrement soit visible chez Cloudflare et Google, puis Let's Encrypt délivre le certificat. On peut ensuite supprimer le TXT.
- Le certificat et sa clé restent dans `code/deploiement/certificat/lettre/`, exclu de Git et de l'image Docker.

**L'installer sur le Pi** : depuis le dossier du projet,

```bash
L=code/deploiement/certificat/lettre/config/live/preprod.example.org
WATT_CERT="$PWD/$L/fullchain.pem" WATT_CLE="$PWD/$L/privkey.pem" code/deploiement/deployer.sh
```

- **Avant tout envoi**, le script vérifie sur le Mac que la clé correspond au certificat, que celui-ci n'a pas expiré et qu'il couvre `preprod.example.org`.
- **Sur le Pi**, les fichiers arrivent dans `~/watt-now/donnees/certificat/`, la clé en droits 600. Le jeu tourne sous ton utilisateur du Pi : il la lit sans l'ouvrir aux autres.
- Les déploiements suivants **sans** `WATT_CERT` et `WATT_CLE` gardent le certificat déjà en place.
- Le jeu reprend un nouveau certificat dans la minute, sans redémarrer.
- **Une adresse tapée en `http://` est renvoyée vers `https://`** (plus de `PR_END_OF_FILE_ERROR`). Sans certificat, le jeu reste en HTTP et le dit dans son journal.

## 4. Sur le Pi

```bash
cd ~/watt-now
docker compose ps          # « healthy » : tout va bien
docker compose logs -f     # le journal : arrivées, sauvegardes, réglages
```

## 5. Régler à chaud pendant le test

Écrire dans `~/watt-now/donnees/reglages.json` (sur le Pi) **seulement les valeurs à changer**, par exemple :

```json
{ "faim_rythme": 0.8, "eteints_terrain_max": 2 }
```

Le serveur relit le fichier en 2 s et l'envoie aux joueurs connectés. Pas de redémarrage. La liste des réglages, leurs bornes et ce qu'ils font :

```bash
cd ~/watt-now && docker compose exec jeu node --disable-warning=ExperimentalWarning scripts/reglages.ts
```

Une valeur hors bornes est ramenée dans les bornes. Si le fichier est mal écrit, le serveur garde les réglages précédents. Dans les deux cas, il le dit dans le journal.

## 6. Le bilan des mesures

Le serveur note le temps passé par activité, les flux de wotts, les causes d'effondrement, la progression par famille, sa propre charge et les images par seconde de chaque appareil (Book 17 §6). Le bilan, en français :

```bash
cd ~/watt-now && docker compose exec jeu node --disable-warning=ExperimentalWarning scripts/bilan-mesures.ts
cd ~/watt-now && docker compose exec jeu node --disable-warning=ExperimentalWarning scripts/bilan-mesures.ts --depuis 2026-10-15
```

## 7. Les sauvegardes

- Une sauvegarde par jour, gardée **7 jours**, et une par semaine, gardée **4 semaines**, dans `~/watt-now/donnees/sauvegardes/`.
- On peut aussi les copier depuis un autre ordinateur :
  ```bash
  rsync -av pi@192.168.254.99:~/watt-now/donnees/sauvegardes/ ./sauvegardes-watt-now/   # demande le mot de passe
  ```
- **Restaurer** : arrêter le jeu (`docker compose down`), remplacer `donnees/watt.sqlite` par la sauvegarde choisie (et supprimer `watt.sqlite-wal` et `watt.sqlite-shm`), relancer (`docker compose up -d`).

### 7 bis. La copie sur la clé USB (0.7)

La carte SD peut lâcher : le jeu recopie donc tout seul ses sauvegardes sur la **clé USB de 57 Go** branchée sur le Pi (Book 17 §5.4).

**Ce que le porteur prépare sur le Pi (une fois, à la main)** :
- la clé, en FAT, montée dans `/mnt/watt-cle` ;
- elle doit être montée **avec les droits de l'utilisateur qui fait tourner le jeu** (le FAT n'a pas de droits à lui), par exemple avec les options `uid=1000,gid=1000` ; avec `nofail` dans `/etc/fstab`, le Pi démarre même sans la clé ;
- un dossier `/mnt/watt-cle/watt-now/` contenant un fichier repère vide `.cle-watt-now`.

**Ce que fait le jeu** (`compose.yaml` monte `/mnt/watt-cle/watt-now` dans le conteneur, variable `WATT_CLE_USB`) :
- Après chaque vérification des sauvegardes (au démarrage, puis toutes les heures), il recopie sur la clé ce qui lui manque, **en arrière-plan** (le jeu n'attend jamais la clé). Une clé rebranchée rattrape les jours manqués, dans la limite de ce que le Pi garde encore.
- **Seulement si le repère `.cle-watt-now` est là.** Clé débranchée ou pas montée : Docker met à sa place un dossier vide de la carte SD, sans repère, et le jeu n'y écrit rien.
- Chaque copie passe par un fichier `….partiel`, renommé une fois complet : une copie interrompue n'abîme jamais une sauvegarde. Il ne copie jamais la base vivante, seulement les sauvegardes cohérentes déjà faites.
- Sur la clé, il range :
  - `sauvegardes/` : **30** quotidiennes, **26** hebdomadaires et une **mensuelle** par mois, gardée **24 mois** ;
  - `reglages.json` et `certificat/` (quand ils changent) : de quoi remonter le jeu sur une carte SD neuve.
- **Attention** : `certificat/privkey.pem` est sur la clé, lisible par qui la branche (le FAT n'a pas de droits). La clé se garde comme une clé de maison.

**Comment savoir que ça marche** :
- Dans le journal (`docker compose logs jeu | grep Clé`), une ligne à chaque copie : `Clé de sauvegarde : 2 fichier(s) copié(s) (… ; 1,2 Mo, 52,3 Go libres)`.
- Une alerte `⚠ Clé de sauvegarde — CLÉ ABSENTE`, `CLÉ PLEINE` ou `ERREUR` quand ça ne va pas. Elle est redite à chaque nouvelle sauvegarde tant que le problème dure.
- En tête du bilan (§6) : `Sauvegardes — clé : dernière copie il y a 3 h, 52,3 Go libres.`
- Après avoir **rebranché** la clé et l'avoir remontée : `docker compose restart`, pour que le conteneur la voie (sinon il garde le dossier vide de la carte SD).

**Restaurer depuis la clé, sur le Pi** :
1. `cd ~/watt-now && docker compose down`
2. Choisir la sauvegarde : `ls /mnt/watt-cle/watt-now/sauvegardes/` (par exemple `quotidienne-2026-11-03.sqlite`).
3. La remettre en place :
   ```bash
   cp /mnt/watt-cle/watt-now/sauvegardes/quotidienne-2026-11-03.sqlite donnees/watt.sqlite
   rm -f donnees/watt.sqlite-wal donnees/watt.sqlite-shm
   ```
4. `docker compose up -d`

**Sur une carte SD neuve** :
- Réinstaller le Pi (§1) et déployer le jeu depuis le Mac (§3) : cela crée `~/watt-now/` et son `compose.yaml`.
- Remonter la clé (voir plus haut), puis arrêter le jeu (`docker compose down`).
- Recopier depuis la clé, dans `~/watt-now/donnees/` :
  - la base (étape 3 ci-dessus) ;
  - `reglages.json` ;
  - le dossier `certificat/`, puis remettre ses droits : `chmod 700 donnees/certificat && chmod 600 donnees/certificat/privkey.pem`.
- Relancer : `docker compose up -d`.

**Depuis un Mac** (la clé branchée dessus, elle apparaît dans le Finder, par exemple `/Volumes/WATT`) :
- Les sauvegardes sont dans `watt-now/sauvegardes/`. Ce sont des bases SQLite ordinaires, qu'on peut ouvrir pour vérifier : `sqlite3 /Volumes/WATT/watt-now/sauvegardes/quotidienne-2026-11-03.sqlite "SELECT pseudo FROM comptes"`.
- Pour remettre l'une d'elles sur le Pi, depuis le Mac (le jeu arrêté sur le Pi) :
  ```bash
  scp /Volumes/WATT/watt-now/sauvegardes/quotidienne-2026-11-03.sqlite pi@192.168.254.99:watt-now/donnees/watt.sqlite   # demande le mot de passe
  ```
  Puis, sur le Pi : `rm -f ~/watt-now/donnees/watt.sqlite-wal ~/watt-now/donnees/watt.sqlite-shm && cd ~/watt-now && docker compose up -d`.
- Éjecter la clé avant de la débrancher. Ne pas supprimer le fichier repère `.cle-watt-now` (caché dans le Finder : `Cmd + Maj + .` pour le voir).

## 8. Mesurer la capacité sur le Pi

Le Book 17 §5.2 estime le Pi 3 à 4 fois plus lent que le Mac de développement. Pour le vérifier, lancer le banc de charge (joueurs simulés, base jetable) :

```bash
cd ~/watt-now && docker compose exec jeu node --disable-warning=ExperimentalWarning scripts/banc-charge.ts halte 50 30
```

Viser un **retard de boucle p99 sous 50 ms** (le temps entre deux calculs du monde). Sur le Mac (M2), dans le conteneur, avec 50 joueurs à la halte : 15 ms, 11 % d'un cœur, 128 Mo.

## 8 bis. Le compte admin « god » (pour tout tester)

Un seul compte admin : son terrain a toutes les constructions, ses coffres tout le catalogue, et son menu ⚙ « Invincible », « Aller à… », « Remplir mes coffres ». Après un déploiement qui contient la 0.7, depuis le Mac (god déconnecté du jeu) :

```bash
code/deploiement/admin-pi.sh            # crée god (ou l'écrase s'il existe) : son mot de passe se tape au clavier
code/deploiement/admin-pi.sh --remplir  # re-remplit seulement ses coffres
```

## 8 ter. La page d'administration (0.8, port 4321)

Une page web, **sans mot de passe**, pour gérer les comptes depuis le réseau de la maison (proposition P-014, Book 17 §5.5) :

- combien de joueurs sont connectés en ce moment, et lesquels (pseudo, famille, lieu) ;
- la liste des comptes, et la fiche de chacun : ce que le serveur sait déjà (compte, personnage, sac, coffres, installations, feux, mesures). Elle n'ajoute aucun compteur ;
- **réinitialiser un mot de passe** : la page tire un mot de passe provisoire (`k7mp-2xqa-hn4d`) et l'affiche **une seule fois**, à donner au joueur ; ses sessions sont fermées (s'il joue, il revient à l'écran de connexion) ;
- **supprimer un compte** : retaper son pseudo, puis « Supprimer définitivement ». S'il joue, il est déconnecté d'abord ; le compte et tout ce qui en dépend partent (personnage, sac, terrain, coffres, feux, Coopérative, sacs au sol, mesures). On ne revient pas en arrière, sauf par une sauvegarde (§7) ;
- le compte **god** est protégé : ni suppression, ni réinitialisation (pour lui : `admin-pi.sh`, §8 bis).

**L'ouvrir** : depuis un ordinateur ou un téléphone de la maison, `http://192.168.254.99:4321` (par l'adresse du Pi ou par un nom, peu importe).

**Ce qui la protège** (ni mot de passe, ni liste d'adresses depuis la 0.8.1, décision du porteur du 2026-10-11) :
- un serveur web à part, dans le même programme que le jeu, sur le seul port 4321 : rien de l'admin ne passe par le port 1234 du jeu ;
- **le port 4321 n'est jamais publié sur la box** : seul le 1234 l'est. La page n'est donc pas joignable d'Internet. C'est la seule protection : **ne jamais rediriger le 4321**, ni mettre le Pi en « hôte exposé » ;
- un formulaire envoyé depuis une autre page que la sienne est refusé ;
- chaque action est notée dans le journal du jeu, avec l'adresse du poste : `[14:02:11] Admin (192.168.1.20) : mot de passe réinitialisé pour « Nadia » (compte 12) ; 1 session(s) fermée(s), déconnecté`.
- Attention : tout appareil qui peut joindre le Pi (le réseau de la maison, le Wi-Fi des invités, les autres machines de la DMZ) peut ouvrir la page.

**Au déploiement** :
1. Déployer comme d'habitude (`code/deploiement/deployer.sh`, §3) : `compose.yaml` publie le port 4321 sur le Pi (`"4321:4321"`).
2. **Ne rien ouvrir sur la box** : aucune redirection du 4321 (seul le 1234 reste publié).
3. Depuis le Mac, ouvrir `http://192.168.254.99:4321` : la liste des comptes s'affiche.
4. Dans le journal, la ligne de démarrage : `docker compose logs jeu | grep "Page d'administration"` ; les actions : `docker compose logs jeu | grep "Admin"`.

## 9. Jouer depuis l'extérieur

À choisir (Book 17 §5.3) :

- **Réseau privé (Tailscale)** : le plus sûr ; chaque joueur installe l'application Tailscale et rejoint le réseau de la famille, puis ouvre `http://<nom-du-pi-dans-tailscale>:1234`.
- **Tunnel (Cloudflare Tunnel)** : une adresse publique en HTTPS (par exemple `https://watt-now.mondomaine.fr`), rien à installer chez les joueurs, aucun port à ouvrir sur la box ; il faut un nom de domaine.

Sur iPhone, le son et le plein écran demandent HTTPS : le tunnel le fournit ; avec Tailscale, on peut activer HTTPS dans Tailscale (`tailscale serve`).

## 10. La production sur le VPS (https://jeu.example.org)

Décision du 2026-10-16 : le Pi reste la **préprod** (sections 1 à 9, `deployer.sh`, sans changement) ; la **production** tourne sur un VPS Debian (4 cœurs, 7,6 Go, x86_64), utilisateur `debian`, où **Traefik** (v3.6) sert déjà d'autres sites (d'autres sites). Les fichiers : `deployer-prod.sh`, `admin-prod.sh` et `prod/` (`compose.yaml`, `installer.sh`).

**Ce qui change par rapport au Pi**
- **HTTPS** : c'est Traefik qui obtient et renouvelle le certificat de `jeu.example.org` (résolveur `letsencrypt`, défi HTTP). Le jeu ne publie **aucun port** : il est seulement sur le réseau Docker `traefik_proxy`, avec des routeurs à son nom (`wattnow`, `wattnow-admin`). Traefik et les autres services ne sont pas modifiés.
- **La page d'administration** est sur Internet, à `https://jeu.example.org/admin`, avec **connexion obligatoire** : identifiant `godfather`, mot de passe (12 caractères au moins), et le **code à 6 chiffres** d'une application d'authentification (Google Authenticator, Aegis, 1Password…). Session de 30 minutes sans activité (8 h au plus), cookie protégé, 5 échecs depuis une adresse → bloquée un quart d'heure (20 échecs en tout → tout le monde), un code ne sert qu'une fois, chaque connexion notée au journal avec l'adresse.
- **L'adresse des joueurs** est celle que Traefik transmet (`WATT_PROXY=1`) : la limite d'essais de connexion au jeu reste par joueur, pas pour tout le monde à la fois.
- **Sauvegardes** : les 5 dernières quotidiennes, sur le disque du VPS (`~/watt-now/donnees/sauvegardes/`) ; pas d'hebdomadaire, pas de clé USB.
- **Limites** : 2 cœurs et 1,5 Go pour le jeu.

**Avant le premier déploiement** (vérifié le 2026-10-16) : `jeu.example.org` pointe sur le VPS ; `debian` lance `docker` sans `sudo` ; le conteneur `traefik` et le réseau `traefik_proxy` existent. Le script le revérifie à chaque fois.

**Déployer** (depuis le Mac ; le mot de passe de `debian` est demandé trois fois) :

```bash
code/deploiement/deployer-prod.sh
```

Il lance les tests, vérifie le VPS, construit l'image pour x86_64 sur le Mac (plus long que pour le Pi : émulation), l'envoie, installe `compose.yaml` et `installer.sh` dans `~/watt-now`, relance le jeu, attend qu'il soit en bonne santé, puis vérifie de dehors que `https://jeu.example.org` répond avec un certificat valable et que `/admin/` renvoie bien vers la connexion. Au tout premier déploiement, Traefik met quelques secondes à obtenir le certificat : le script attend.

**Créer le compte godfather** (une fois, après le premier déploiement ; le téléphone à la main) :

```bash
code/deploiement/admin-prod.sh
```

Taper deux fois le mot de passe ; la commande affiche **une seule fois** la clé de configuration : dans l'application, « Ajouter un compte » → « Saisir une clé », puis taper le code à 6 chiffres qu'elle montre. Rien n'est enregistré tant que ce code n'est pas bon. Relancer la commande remplace le compte (nouvelle clé : refaire l'application). L'heure du téléphone doit être juste (réglage automatique).

**Remettre le monde à zéro** (avant l'ouverture au public) :

```bash
code/deploiement/deployer-prod.sh --remise-a-zero
```

Il faut retaper le nom du site pour confirmer. Le jeu est arrêté, l'ancienne base est **rangée** (pas effacée) dans `~/watt-now/donnees/avant-remise-<date>/`, puis le jeu repart d'une base neuve : plus aucun compte de jeu, personnages et terrains neufs, nouveau début du monde. Le compte **godfather est gardé** (même mot de passe, même clé). Les réglages et les sauvegardes déjà faites ne bougent pas.

**Sur le VPS**, dans `~/watt-now` :
- l'état et le journal : `docker compose ps`, `docker compose logs -f jeu` ; les connexions à l'admin : `docker compose logs jeu | grep Admin` ;
- relancer sans redéployer : `./installer.sh` ;
- revenir à la version d'avant : `docker tag watt-now:<version> watt-now:courante && ./installer.sh` (les versions : `docker images watt-now`) ;
- fermer toutes les sessions d'admin ouvertes : `docker compose restart jeu`.
