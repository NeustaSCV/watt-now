#!/usr/bin/env bash
# Le compte admin « god » sur le Raspberry Pi (outil du porteur, 0.7), dans le conteneur du jeu.
# Une seule connexion SSH (le mot de passe du Pi). Puis, dans le conteneur, le mot de passe de god se tape au clavier,
# sans écho (« ssh -t » et « docker exec -it » gardent le terminal) : il ne passe ni en argument ni dans un fichier.
# Si god existe déjà, il est écrasé : nouveau mot de passe, personnage neuf, terrain monté, coffres remplis.
# Déconnecte god du jeu avant (connecté, son personnage en mémoire réécrirait par-dessus).
# Usage : code/deploiement/admin-pi.sh             crée (ou écrase) god, monte son terrain, remplit ses coffres
#         code/deploiement/admin-pi.sh --remplir   re-remplit seulement ses coffres (sans mot de passe de god)
#         (WATT_PI, WATT_PI_UTILISATEUR comme deployer.sh)
set -euo pipefail
PI="${WATT_PI:-192.168.254.99}"
UTILISATEUR="${WATT_PI_UTILISATEUR:-pi}"
OPTION=""
case "${1:-}" in
  "") ;;
  --remplir) OPTION="--remplir" ;;
  *) echo "Usage : $0 [--remplir]" >&2; exit 1 ;;
esac
ssh -t -o ConnectTimeout=10 -o PreferredAuthentications=password,keyboard-interactive -o PubkeyAuthentication=no "$UTILISATEUR@$PI" \
  "docker exec -it watt-now node --disable-warning=ExperimentalWarning scripts/admin.ts god $OPTION"
