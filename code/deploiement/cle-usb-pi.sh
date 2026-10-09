#!/usr/bin/env bash
# La clé USB de sauvegarde du Pi (SanDisk Ultra, ID 0781:5581), dédiée aux sauvegardes du jeu : si la carte SD lâche,
# les sauvegardes survivent sur la clé.
# Étape 1, « examiner » : LECTURE SEULE. Une seule connexion SSH (un mot de passe). Ne monte rien, n'écrit rien, ne
# formate rien : dit seulement ce qu'est la clé (taille, système de fichiers, montage) et où en sont les sauvegardes.
# Usage : code/deploiement/cle-usb-pi.sh examiner      (WATT_PI, WATT_PI_UTILISATEUR comme deployer.sh)
set -euo pipefail
PI="${WATT_PI:-192.168.254.99}"
UTILISATEUR="${WATT_PI_UTILISATEUR:-pi}"
case "${1:-}" in
  examiner)
    ssh -o ConnectTimeout=10 -o PreferredAuthentications=password,keyboard-interactive -o PubkeyAuthentication=no "$UTILISATEUR@$PI" '
      echo "=== La clé (périphériques USB)"; lsusb | grep -i "0781:5581" || echo "clé SanDisk non vue par lsusb"
      echo "=== Les disques"; lsblk -o NAME,SIZE,TYPE,TRAN,FSTYPE,LABEL,UUID,MOUNTPOINT,MODEL
      echo "=== Montages actuels"; findmnt -rno TARGET,SOURCE,FSTYPE,OPTIONS | grep -E "^/(mnt|media)|/dev/sd" || echo "aucune clé montée"
      echo "=== Place sur la carte SD"; df -h /
      echo "=== Les sauvegardes du jeu aujourd'"'"'hui"; ls -la ~/watt-now/donnees/sauvegardes/ 2>/dev/null || echo "dossier absent"
      du -sh ~/watt-now/donnees/ 2>/dev/null || true
      echo "=== Le montage du conteneur"; grep -n "volumes" -A4 ~/watt-now/compose.yaml 2>/dev/null || true
      echo "=== Fin (rien n'"'"'a été modifié)"
    '
    ;;
  *)
    echo "Usage : $0 examiner" >&2
    exit 1
    ;;
esac
