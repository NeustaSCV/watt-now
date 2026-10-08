#!/bin/sh
# Appelé par certbot après la vérification : l'enregistrement TXT ne sert plus.
echo "  L'enregistrement TXT _acme-challenge.$CERTBOT_DOMAIN peut être supprimé de la zone DNS."
rm -f /travail/defi-dns.txt
