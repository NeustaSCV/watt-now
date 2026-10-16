#!/usr/bin/env bash
# Sur le VPS, dans ~/watt-now : relancer le jeu avec l'image reçue (watt-now:courante) et attendre qu'il soit en
# bonne santé. Lancé par deployer-prod.sh (depuis le Mac), après l'envoi de l'image ; on peut aussi le relancer à la
# main sur le VPS : « cd ~/watt-now && ./installer.sh ».
#
#   ./installer.sh                   relance le jeu (les données restent)
#   ./installer.sh --remise-a-zero   arrête le jeu, remet le monde à zéro (scripts/remise-a-zero.ts : l'ancienne base
#                                    est rangée dans donnees/avant-remise-<date>/, godfather est gardé), puis relance
#
# N'écrit que dans ce dossier ; ne touche ni à Traefik ni aux autres conteneurs.
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p donnees
# Le jeu tourne sous l'utilisateur qui déploie : il écrit dans ./donnees sans sudo.
printf 'WATT_UID=%s\nWATT_GID=%s\n' "$(id -u)" "$(id -g)" > .env

if [ "${1:-}" = "--remise-a-zero" ]; then
  echo "· Arrêt du jeu pour la remise à zéro"
  docker compose stop jeu 2>/dev/null || true
  # Un conteneur jetable, sans réseau ni étiquette Traefik : il ne fait que préparer la base neuve dans ./donnees.
  docker run --rm --network none --user "$(id -u):$(id -g)" -v "$PWD/donnees:/app/serveur/donnees" watt-now:courante \
    node --disable-warning=ExperimentalWarning scripts/remise-a-zero.ts
fi

docker compose up -d --remove-orphans
ETAT=absent
for _ in $(seq 1 40); do
  ETAT=$(docker inspect -f '{{.State.Health.Status}}' watt-now 2>/dev/null || echo absent)
  [ "$ETAT" = healthy ] && break
  [ "$ETAT" = unhealthy ] && break
  sleep 3
done
docker logs --tail 8 watt-now
echo "ETAT $ETAT"
