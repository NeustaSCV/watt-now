#!/usr/bin/env bash
# Déploie Watt Now? en PRODUCTION sur le VPS (https://jeu.example.org), depuis le Mac (décision du 2026-10-16).
# La préprod du Pi garde son propre script (deployer.sh), qui ne change pas.
#
# Comme pour le Pi : connexion SSH par mot de passe, aucune clé posée, aucune configuration changée, ni sur le Mac ni
# sur le VPS. Le mot de passe de debian est demandé trois fois :
#   1. vérifier le VPS (Docker, Traefik, le réseau traefik_proxy, le nom du conteneur) ;
#   2. lui envoyer l'image, construite sur le Mac (le VPS ne compile rien) ;
#   3. installer compose.yaml et installer.sh dans ~/watt-now, relancer le jeu, attendre qu'il soit en bonne santé.
# Sur le VPS, il n'écrit que dans ~/watt-now (et ajoute l'image watt-now:<version> à Docker). Traefik et les autres
# services (d'autres sites) ne sont pas touchés : le certificat, c'est Traefik qui l'obtient seul.
#
# Usage :
#   code/deploiement/deployer-prod.sh                    # tout
#   code/deploiement/deployer-prod.sh --sans-tests       # sans relancer les tests
#   code/deploiement/deployer-prod.sh --remise-a-zero    # et remet le monde à zéro (avant l'ouverture au public) :
#       comptes, personnages, terrains et début du monde repartent de zéro ; l'ancienne base est rangée sur le VPS
#       dans ~/watt-now/donnees/avant-remise-<date>/ ; le compte godfather est gardé. Demande de retaper le nom du site.
# Variables : WATT_VPS (jeu.example.org), WATT_VPS_UTILISATEUR (debian), WATT_VPS_PORT_SSH (22),
# WATT_VPS_DOSSIER (watt-now), WATT_NOM (jeu.example.org : l'adresse des joueurs).
#
# Revenir à la version d'avant, sur le VPS : docker tag watt-now:<version> watt-now:courante && cd ~/watt-now && ./installer.sh

set -euo pipefail

VPS="${WATT_VPS:-jeu.example.org}"
UTILISATEUR="${WATT_VPS_UTILISATEUR:-debian}"
PORT_SSH="${WATT_VPS_PORT_SSH:-22}"
DOSSIER="${WATT_VPS_DOSSIER:-watt-now}"
NOM="${WATT_NOM:-jeu.example.org}"
ICI="$(cd "$(dirname "$0")" && pwd)"
CODE="$(dirname "$ICI")"
VERSION="$(sed -n 's/^export const VERSION = "\(.*\)";/\1/p' "$CODE/commun/src/version.ts")"
IMAGE="watt-now:$VERSION"
CIBLE="$UTILISATEUR@$VPS"
# Seulement des options de cette commande : rien n'est écrit dans ~/.ssh.
SSH=(ssh -p "$PORT_SSH" -o ConnectTimeout=10 -o PreferredAuthentications=password,keyboard-interactive -o PubkeyAuthentication=no "$CIBLE")

etape() { printf '\n\033[1m%s\033[0m\n' "$1"; }
erreur() { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

SANS_TESTS=""
REMISE=""
for option in "$@"; do
  case "$option" in
    --sans-tests) SANS_TESTS=1 ;;
    --remise-a-zero) REMISE="--remise-a-zero" ;;
    *) erreur "Option inconnue : $option (--sans-tests, --remise-a-zero)" ;;
  esac
done

# ---------- La remise à zéro se confirme avant tout ----------

if [ -n "$REMISE" ]; then
  printf '\n\033[1;31m⚠ REMISE À ZÉRO DE LA PRODUCTION\033[0m\n'
  echo "Tous les comptes de jeu, les personnages, les terrains et le début du monde repartiront de zéro."
  echo "L'ancienne base reste sur le VPS (~/$DOSSIER/donnees/avant-remise-<date>/) ; le compte godfather est gardé."
  read -r -p "Pour confirmer, tape le nom du site ($NOM) : " CONFIRMATION
  [ "$CONFIRMATION" = "$NOM" ] || erreur "Pas confirmé : rien n'est fait."
fi

# ---------- Sur le Mac d'abord : rien n'est envoyé si les tests échouent ----------

if [ -z "$SANS_TESTS" ]; then
  etape "1/5 · Tests et types (sur le Mac)"
  (cd "$CODE" && npm run --silent verif) || erreur "Le typage échoue : rien n'est déployé."
  RESULTATS="$(cd "$CODE" && npm test --silent 2>&1)" || { echo "$RESULTATS" | grep -E '^✖|^ℹ (pass|fail)' | head -20; erreur "Des tests échouent : rien n'est déployé."; }
  echo "$RESULTATS" | grep -E '^ℹ (pass|fail)'
else
  etape "1/5 · Tests et types : passés (--sans-tests)"
fi

# ---------- Connexion 1 : vérifier le VPS ----------

etape "2/5 · Vérifier le VPS ($CIBLE) — mot de passe 1/3"
VERIF="$("${SSH[@]}" 'bash -s' <<'DISTANT'
docker info >/dev/null 2>&1 || { echo "ERREUR Docker ne répond pas pour cet utilisateur (dans le groupe docker ?)"; exit 0; }
docker compose version >/dev/null 2>&1 || { echo "ERREUR L'extension « docker compose » manque."; exit 0; }
echo "ARCH $(uname -m)"
docker network inspect traefik_proxy >/dev/null 2>&1 || echo "ERREUR Le réseau Docker traefik_proxy n'existe pas."
docker ps --format '{{.Names}}' | grep -qx traefik || echo "ERREUR Le conteneur traefik ne tourne pas."
# Le nom « watt-now » : libre, ou déjà à nous (projet compose watt-now).
PROJET=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' watt-now 2>/dev/null || true)
if docker inspect watt-now >/dev/null 2>&1 && [ "$PROJET" != "watt-now" ]; then echo "ERREUR Un autre conteneur s'appelle déjà watt-now."; fi
LIBRE=$(df -Pm "$HOME" | awk 'NR==2 {print $4}')
[ "${LIBRE:-0}" -lt 3000 ] && echo "ERREUR Moins de 3 Go libres sur le disque (${LIBRE} Mo)."
true
DISTANT
)" || erreur "Connexion SSH impossible à $CIBLE (port $PORT_SSH)."
echo "$VERIF" | grep '^ERREUR' && erreur "Le VPS n'est pas prêt (voir ci-dessus)."
ARCH="$(echo "$VERIF" | awk '/^ARCH/ {print $2}')"
case "$ARCH" in
  x86_64) PLATEFORME="linux/amd64" ;;
  aarch64 | arm64) PLATEFORME="linux/arm64" ;;
  *) erreur "Architecture inconnue : '$ARCH'" ;;
esac
echo "Architecture : $ARCH → $PLATEFORME ; Docker, Traefik et le réseau traefik_proxy sont là."

# ---------- Sur le Mac : construire ----------

etape "3/5 · Construire l'image de la version $VERSION ($PLATEFORME, sur le Mac)"
docker buildx build --platform "$PLATEFORME" -t "$IMAGE" -t watt-now:courante --load "$CODE"

# ---------- Connexion 2 : envoyer l'image ----------

etape "4/5 · Envoyer l'image au VPS (quelques minutes) — mot de passe 2/3"
docker save "$IMAGE" watt-now:courante | gzip -1 | "${SSH[@]}" 'gunzip | docker load'

# ---------- Connexion 3 : installer, relancer, attendre ----------

etape "5/5 · Relancer le jeu${REMISE:+ (avec remise à zéro)} et attendre qu'il soit prêt — mot de passe 3/3"
COPYFILE_DISABLE=1 tar -cf - -C "$ICI/prod" compose.yaml installer.sh | "${SSH[@]}" "
  set -e
  mkdir -p '$DOSSIER'
  tar -xf - --no-same-owner -C '$DOSSIER'
  chmod +x '$DOSSIER/installer.sh'
  '$DOSSIER/installer.sh' $REMISE
" | tee /dev/stderr | grep '^ETAT healthy$' >/dev/null || erreur "Le jeu n'est pas en bonne santé sur le VPS (voir le journal ci-dessus)."

# ---------- De dehors, comme un joueur : HTTPS valide, admin protégée ----------

# Au tout premier déploiement, Traefik demande le certificat à Let's Encrypt : quelques secondes à attendre.
for _ in $(seq 1 30); do
  curl -fsS --max-time 8 "https://$NOM/api/sante" >/dev/null 2>&1 && break
  sleep 3
done
curl -fsS --max-time 8 "https://$NOM/api/sante" >/dev/null 2>&1 \
  || erreur "Le jeu tourne, mais https://$NOM ne répond pas (DNS ? certificat pas encore obtenu ? journal : docker logs traefik)."
ADMIN="$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "https://$NOM/admin/")"
[ "$ADMIN" = "303" ] || erreur "https://$NOM/admin/ répond $ADMIN au lieu de renvoyer vers la connexion : à vérifier avant d'ouvrir."
printf '\n\033[32m✓ Version %s déployée : https://%s  (admin : https://%s/admin)\033[0m\n' "$VERSION" "$NOM" "$NOM"
