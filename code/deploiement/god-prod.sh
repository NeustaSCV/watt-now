#!/usr/bin/env bash
# Le compte admin « god » en PRODUCTION (le VPS, 2026-10-16), dans le conteneur du jeu, comme god-pi.sh pour la préprod.
# Une seule connexion SSH (le mot de passe de debian). Puis, dans le conteneur, le mot de passe de god se tape au clavier,
# sans écho (« ssh -t » et « docker exec -it » gardent le terminal) : il ne passe ni en argument ni dans un fichier.
# Si god existe déjà, il est écrasé : nouveau mot de passe, personnage neuf, terrain monté, coffres remplis.
# Déconnecte god du jeu avant (connecté, son personnage en mémoire réécrirait par-dessus).
# Ce n'est pas godfather (la page /admin : admin-prod.sh) : god est le compte administrateur dans le jeu.
# Usage : code/deploiement/god-prod.sh                       crée (ou écrase) god, monte son terrain, remplit ses coffres
#         code/deploiement/god-prod.sh --remplir             re-remplit seulement ses coffres (sans mot de passe de god)
#         code/deploiement/god-prod.sh --famille voltaiques  à la création (charbonniers, voltaiques ou mecanistes)
#         (WATT_VPS, WATT_VPS_UTILISATEUR, WATT_VPS_PORT_SSH comme deployer-prod.sh)
set -euo pipefail
VPS="${WATT_VPS:-jeu.example.org}"
UTILISATEUR="${WATT_VPS_UTILISATEUR:-debian}"
PORT_SSH="${WATT_VPS_PORT_SSH:-22}"
OPTIONS=""
case "${1:-}" in
  "") ;;
  --remplir) [ $# -eq 1 ] || { echo "Usage : $0 [--remplir | --famille charbonniers|voltaiques|mecanistes]" >&2; exit 1; }; OPTIONS="--remplir" ;;
  --famille)
    case "${2:-}" in
      charbonniers | voltaiques | mecanistes) OPTIONS="--famille $2" ;;
      *) echo "Famille inconnue : charbonniers, voltaiques ou mecanistes." >&2; exit 1 ;;
    esac ;;
  *) echo "Usage : $0 [--remplir | --famille charbonniers|voltaiques|mecanistes]" >&2; exit 1 ;;
esac
ssh -t -p "$PORT_SSH" -o ConnectTimeout=10 -o PreferredAuthentications=password,keyboard-interactive -o PubkeyAuthentication=no "$UTILISATEUR@$VPS" \
  "docker exec -it watt-now node --disable-warning=ExperimentalWarning scripts/admin.ts god $OPTIONS"
