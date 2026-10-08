#!/usr/bin/env bash
# Déploie Watt Now? sur le Raspberry Pi, depuis le Mac (Book 17 §5).
# Connexion SSH par mot de passe : le script ne pose aucune clé et ne change aucune configuration, ni sur le Mac,
# ni sur le Pi. Il demande le mot de passe du Pi trois fois :
#   1. vérifier le Pi (Docker, architecture, port libre) ;
#   2. lui envoyer l'image, construite sur le Mac (le Pi ne compile rien) ;
#   3. installer compose.yaml dans ~/watt-now, relancer le jeu et attendre qu'il soit en bonne santé.
# Sur le Pi, il n'écrit que dans ~/watt-now (et ajoute l'image watt-now:0a à Docker).
#
# Usage :
#   code/deploiement/deployer.sh                 # tout
#   code/deploiement/deployer.sh --sans-tests    # sans relancer les tests
# Variables : WATT_PI (192.168.254.99), WATT_PI_UTILISATEUR (pi), WATT_PORT (1234), WATT_PI_DOSSIER (watt-now),
# WATT_NOM (preprod.example.org : l'adresse des joueurs, celle du certificat HTTPS).
# HTTPS : le certificat et sa clé, pris là où ils sont sur le Mac, envoyés au Pi dans ~/watt-now/donnees/certificat/ :
#   WATT_CERT=~/Downloads/le-certificat.crt WATT_CLE=~/Downloads/_.example.org_private_key.key code/deploiement/deployer.sh
# Sans ces variables, le certificat déjà sur le Pi est gardé tel quel.

set -euo pipefail

PI="${WATT_PI:-192.168.254.99}"
UTILISATEUR="${WATT_PI_UTILISATEUR:-pi}"
PORT="${WATT_PORT:-1234}"
NOM="${WATT_NOM:-preprod.example.org}"
CERT="${WATT_CERT:-}"
CLE="${WATT_CLE:-}"
DOSSIER="${WATT_PI_DOSSIER:-watt-now}"
# La version du jeu (commun/src/version.ts) : l'image porte son numéro, et « courante » désigne celle qui tourne.
# Pour revenir à la version d'avant, sur le Pi : docker tag watt-now:<version> watt-now:courante && docker compose up -d
VERSION="$(sed -n 's/^export const VERSION = "\(.*\)";/\1/p' "$(cd "$(dirname "$0")/.." && pwd)/commun/src/version.ts")"
IMAGE="watt-now:$VERSION"
CIBLE="$UTILISATEUR@$PI"
ICI="$(cd "$(dirname "$0")" && pwd)"
CODE="$(dirname "$ICI")"
# Seulement des options de cette commande : rien n'est écrit dans ~/.ssh.
SSH=(ssh -o ConnectTimeout=10 -o PreferredAuthentications=password,keyboard-interactive -o PubkeyAuthentication=no "$CIBLE")

etape() { printf '\n\033[1m%s\033[0m\n' "$1"; }
erreur() { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# ---------- Sur le Mac d'abord : rien n'est envoyé si les tests échouent ----------

if [ "${1:-}" != "--sans-tests" ]; then
  etape "1/5 · Tests et types (sur le Mac)"
  (cd "$CODE" && npm run --silent verif) || erreur "Le typage échoue : rien n'est déployé."
  RESULTATS="$(cd "$CODE" && npm test --silent 2>&1)" || { echo "$RESULTATS" | grep -E '^✖|^ℹ (pass|fail)' | head -20; erreur "Des tests échouent : rien n'est déployé."; }
  echo "$RESULTATS" | grep -E '^ℹ (pass|fail)'
else
  etape "1/5 · Tests et types : passés (--sans-tests)"
fi

# ---------- Le certificat (facultatif) : vérifié sur le Mac avant tout envoi ----------

if [ -n "$CERT$CLE" ]; then
  etape "· Certificat HTTPS"
  [ -f "$CERT" ] || erreur "Certificat introuvable : '$CERT' (WATT_CERT)."
  [ -f "$CLE" ] || erreur "Clé privée introuvable : '$CLE' (WATT_CLE)."
  # La clé correspond-elle au certificat ? On compare leurs clés publiques (rien de secret n'est affiché).
  [ "$(openssl x509 -in "$CERT" -noout -pubkey | openssl sha256)" = "$(openssl pkey -in "$CLE" -pubout | openssl sha256)" ] \
    || erreur "La clé privée ne correspond pas à ce certificat."
  openssl x509 -in "$CERT" -noout -checkend 0 >/dev/null || erreur "Ce certificat a expiré."
  openssl x509 -in "$CERT" -noout -checkhost "$NOM" | grep -q "does match" || erreur "Ce certificat n'est pas valable pour $NOM."
  echo "Valable pour $NOM jusqu'au $(openssl x509 -in "$CERT" -noout -enddate | cut -d= -f2) ; $(grep -c 'BEGIN CERTIFICATE' "$CERT") certificat(s) dans la chaîne."
fi

# ---------- Connexion 1 : vérifier le Pi ----------

etape "2/5 · Vérifier le Pi ($CIBLE) — mot de passe 1/3"
VERIF="$("${SSH[@]}" "
  docker info >/dev/null 2>&1 || { echo 'ERREUR Docker ne répond pas pour cet utilisateur (installé ? dans le groupe docker ?)'; exit 0; }
  docker compose version >/dev/null 2>&1 || { echo 'ERREUR L extension « docker compose » manque.'; exit 0; }
  echo ARCH \$(uname -m)
  AUTRE=\$(docker ps --format '{{.Names}} {{.Ports}}' | grep ':$PORT->' | grep -v '^watt-now ' || true)
  [ -n \"\$AUTRE\" ] && echo \"ERREUR Le port $PORT est déjà pris par le conteneur : \$AUTRE\"
  if ! docker ps --format '{{.Names}}' | grep -qx watt-now; then
    (ss -ltnH 2>/dev/null || netstat -ltn 2>/dev/null) | grep -q ':$PORT ' && echo 'ERREUR Le port $PORT est déjà pris par un autre service du Pi.'
  fi
  true
")" || erreur "Connexion SSH impossible à $CIBLE."
echo "$VERIF" | grep '^ERREUR' && erreur "Le Pi n'est pas prêt (voir ci-dessus). Pour un autre port : WATT_PORT=… $0"
ARCH="$(echo "$VERIF" | awk '/^ARCH/ {print $2}')"
case "$ARCH" in
  aarch64 | arm64) PLATEFORME="linux/arm64" ;;
  armv7l) PLATEFORME="linux/arm/v7"; echo "⚠ Système 32 bits : un Raspberry Pi OS 64 bits est recommandé (Node 25 en 32 bits n'est pas garanti)." ;;
  x86_64) PLATEFORME="linux/amd64" ;;
  *) erreur "Architecture inconnue : '$ARCH'" ;;
esac
echo "Architecture : $ARCH → $PLATEFORME ; port $PORT libre (ou déjà au jeu)."

# ---------- Sur le Mac : construire ----------

etape "3/5 · Construire l'image de la version $VERSION ($PLATEFORME, sur le Mac)"
docker buildx build --platform "$PLATEFORME" -t "$IMAGE" -t watt-now:courante --load "$CODE"

# ---------- Connexion 2 : envoyer l'image ----------

etape "4/5 · Envoyer l'image au Pi (quelques minutes) — mot de passe 2/3"
docker save "$IMAGE" watt-now:courante | gzip -1 | "${SSH[@]}" 'gunzip | docker load'

# ---------- Connexion 3 : installer, relancer, attendre ----------

etape "5/5 · Relancer le jeu et attendre qu'il soit prêt — mot de passe 3/3"
# compose.yaml (et le certificat, s'il est donné) voyagent dans la même connexion, en une archive : pas de second
# mot de passe, et la clé privée n'est jamais copiée dans le projet.
# (Avec le tar du Mac, les renommages -s se placent avant les fichiers ; -h suit les liens de certbot.)
RENOMMER=()
FICHIERS=(-C "$ICI" compose.yaml)
if [ -n "$CERT" ]; then
  RENOMMER+=(-s "#^$(basename "$CERT")\$#donnees/certificat/fullchain.pem#" -s "#^$(basename "$CLE")\$#donnees/certificat/privkey.pem#")
  FICHIERS+=(-C "$(dirname "$CERT")" "$(basename "$CERT")" -C "$(dirname "$CLE")" "$(basename "$CLE")")
fi
COPYFILE_DISABLE=1 tar -h -cf - ${RENOMMER[@]+"${RENOMMER[@]}"} "${FICHIERS[@]}" | "${SSH[@]}" "
  set -e
  mkdir -p '$DOSSIER/donnees'
  cd '$DOSSIER' && tar -xf - --no-same-owner 2>/dev/null && cd ..
  # Le jeu tourne sous l'utilisateur qui déploie (voir .env) : la clé lui est lisible, et à personne d'autre.
  if [ -f '$DOSSIER/donnees/certificat/privkey.pem' ]; then chmod 700 '$DOSSIER/donnees/certificat'; chmod 644 '$DOSSIER/donnees/certificat/fullchain.pem'; chmod 600 '$DOSSIER/donnees/certificat/privkey.pem'; fi
  printf 'WATT_PORT=%s\nWATT_UID=%s\nWATT_GID=%s\n' '$PORT' \$(id -u) \$(id -g) > '$DOSSIER/.env'
  cd '$DOSSIER' && docker compose up -d --remove-orphans
  for i in \$(seq 1 30); do
    ETAT=\$(docker inspect -f '{{.State.Health.Status}}' watt-now 2>/dev/null || echo absent)
    [ \"\$ETAT\" = healthy ] && break
    [ \"\$ETAT\" = unhealthy ] && break
    sleep 3
  done
  docker logs --tail 6 watt-now
  echo ETAT \$ETAT
" | tee /dev/stderr | grep '^ETAT healthy$' >/dev/null || erreur "Le jeu n'est pas en bonne santé sur le Pi (voir le journal ci-dessus)."

# Avec le certificat, l'adresse des joueurs est en HTTPS (curl vérifie le certificat) ; sinon, HTTP.
if curl -fsS --max-time 8 "https://$NOM:$PORT/api/sante" >/dev/null 2>&1; then
  printf '\n\033[32m✓ Version %s déployée : https://%s:%s\033[0m\n' "$VERSION" "$NOM" "$PORT"
elif curl -fsS --max-time 5 "http://$PI:$PORT/api/sante" >/dev/null; then
  printf '\n\033[32m✓ Déployé : http://%s:%s\033[0m\n' "$NOM" "$PORT"
  echo "⚠ Pas encore de HTTPS valide sur https://$NOM:$PORT : certificat absent sur le Pi (ou pas pour ce nom)."
else
  echo "⚠ Le jeu tourne sur le Pi, mais le Mac ne le joint pas sur le port $PORT (pare-feu ?)."
fi
