#!/usr/bin/env bash
# Demande (ou renouvelle) le certificat Let's Encrypt de preprod.example.org, par défi DNS (Book 17 §5.3).
# certbot tourne dans un conteneur Docker sur le Mac ; tout ce qu'il produit reste dans ce dossier (lettre/).
# Le défi : un enregistrement TXT _acme-challenge.preprod.example.org à créer à la main dans la zone DNS publique ;
# le script affiche sa valeur et attend qu'il soit visible. Un certificat Let's Encrypt dure 90 jours :
# relancer ce script vers le 60e jour, puis deployer.sh avec WATT_CERT et WATT_CLE (voir ../LISEZMOI.md).
#
# Usage : code/deploiement/certificat/obtenir.sh            (nom : WATT_NOM, preprod.example.org par défaut)

set -euo pipefail
NOM="${WATT_NOM:-preprod.example.org}"
ICI="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$ICI/lettre/config" "$ICI/lettre/travail" "$ICI/lettre/journaux"

# Pas d'adresse e-mail transmise à Let's Encrypt (pas de rappel d'expiration : c'est ce script qu'on relance).
docker run --rm \
  -v "$ICI/lettre/config:/etc/letsencrypt" \
  -v "$ICI/lettre/travail:/travail" \
  -v "$ICI/lettre/journaux:/var/log/letsencrypt" \
  -v "$ICI:/crochets:ro" \
  certbot/certbot:latest certonly \
  --manual --preferred-challenges dns \
  --manual-auth-hook /crochets/attendre-dns.sh \
  --manual-cleanup-hook /crochets/nettoyer-dns.sh \
  --non-interactive --agree-tos --register-unsafely-without-email \
  --key-type ecdsa \
  -d "$NOM"

LIVE="$ICI/lettre/config/live/$NOM"
echo ""
echo "✓ Certificat obtenu : $LIVE/fullchain.pem (et privkey.pem)"
openssl x509 -in "$LIVE/fullchain.pem" -noout -subject -enddate
echo ""
echo "Pour l'installer sur le Pi :"
echo "  WATT_CERT=\"$LIVE/fullchain.pem\" WATT_CLE=\"$LIVE/privkey.pem\" code/deploiement/deployer.sh"
