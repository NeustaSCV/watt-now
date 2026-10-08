#!/usr/bin/env bash
# Mesure la capacité du Raspberry Pi avec le banc de charge (Book 17 §5.2), dans le conteneur du jeu.
# Une seule connexion SSH (un mot de passe). Lecture seule : le banc simule des joueurs dans une base jetable,
# sans toucher aux vraies données ; il charge le Pi ≈ 4 min.
# Usage : code/deploiement/mesurer-pi.sh      (WATT_PI, WATT_PI_UTILISATEUR comme deployer.sh)
set -euo pipefail
PI="${WATT_PI:-192.168.254.99}"
UTILISATEUR="${WATT_PI_UTILISATEUR:-pi}"
ssh -o ConnectTimeout=10 -o PreferredAuthentications=password,keyboard-interactive -o PubkeyAuthentication=no "$UTILISATEUR@$PI" '
  echo "=== Le Pi"; tr -d "\0" < /proc/device-tree/model; echo; uname -m; echo "coeurs : $(nproc)"; free -m | head -2
  echo "=== Le jeu, maintenant"; docker stats --no-stream --format "{{.Name}} cpu {{.CPUPerc}} mem {{.MemUsage}}" watt-now
  echo "=== Banc de charge"
  for essai in "terrain 50 15" "halte 25 15" "halte 50 15" "halte 100 15"; do
    docker exec watt-now node --disable-warning=ExperimentalWarning scripts/banc-charge.ts $essai 2>&1 | tail -1
  done
  # La Coopérative (0.5g, Book 23 §7) : trois essais par taille (on retient la médiane), après une chauffe.
  docker exec watt-now node --disable-warning=ExperimentalWarning scripts/banc-charge.ts cooperative 5 5 > /dev/null 2>&1 || true
  for essai in "cooperative 10 30" "cooperative 20 30"; do
    for n in 1 2 3; do
      docker exec watt-now node --disable-warning=ExperimentalWarning scripts/banc-charge.ts $essai 2>&1 | tail -1
    done
  done
  echo "=== Fin"
'
