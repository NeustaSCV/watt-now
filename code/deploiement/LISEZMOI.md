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
- Pour les avoir **hors du Pi** (Book 17 §5.4) : monter un disque externe à la place de ce dossier (voir `compose.yaml`), ou les copier régulièrement depuis un autre ordinateur :
  ```bash
  rsync -av pi@192.168.254.99:~/watt-now/donnees/sauvegardes/ ./sauvegardes-watt-now/   # demande le mot de passe
  ```
- **Restaurer** : arrêter le jeu (`docker compose down`), remplacer `donnees/watt.sqlite` par la sauvegarde choisie (et supprimer `watt.sqlite-wal` et `watt.sqlite-shm`), relancer (`docker compose up -d`).

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

## 9. Jouer depuis l'extérieur

À choisir (Book 17 §5.3) :

- **Réseau privé (Tailscale)** : le plus sûr ; chaque joueur installe l'application Tailscale et rejoint le réseau de la famille, puis ouvre `http://<nom-du-pi-dans-tailscale>:1234`.
- **Tunnel (Cloudflare Tunnel)** : une adresse publique en HTTPS (par exemple `https://watt-now.mondomaine.fr`), rien à installer chez les joueurs, aucun port à ouvrir sur la box ; il faut un nom de domaine.

Sur iPhone, le son et le plein écran demandent HTTPS : le tunnel le fournit ; avec Tailscale, on peut activer HTTPS dans Tailscale (`tailscale serve`).
