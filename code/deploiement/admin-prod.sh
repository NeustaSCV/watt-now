#!/usr/bin/env bash
# Le compte de la page d'administration de PRODUCTION (« godfather », 2026-10-16), depuis le Mac, après un premier
# deployer-prod.sh. Une seule connexion SSH (le mot de passe de debian). Puis, dans le conteneur, le mot de passe de
# godfather se tape au clavier, sans écho ; la clé du code à usage unique s'affiche une seule fois, à saisir dans
# l'application d'authentification du téléphone ; on tape enfin le code qu'elle montre, pour vérifier.
# Relancé plus tard, il remplace le compte (nouveau mot de passe, nouvelle clé : refaire l'application).
# Usage : code/deploiement/admin-prod.sh            (WATT_VPS, WATT_VPS_UTILISATEUR, WATT_VPS_PORT_SSH comme deployer-prod.sh)
set -euo pipefail
VPS="${WATT_VPS:-jeu.example.org}"
UTILISATEUR="${WATT_VPS_UTILISATEUR:-debian}"
PORT_SSH="${WATT_VPS_PORT_SSH:-22}"
IDENTIFIANT="godfather"
[ $# -eq 0 ] || { echo "Usage : $0" >&2; exit 1; }
ssh -t -p "$PORT_SSH" -o ConnectTimeout=10 -o PreferredAuthentications=password,keyboard-interactive -o PubkeyAuthentication=no "$UTILISATEUR@$VPS" \
  "docker exec -it watt-now node --disable-warning=ExperimentalWarning scripts/admin-web.ts $IDENTIFIANT"
