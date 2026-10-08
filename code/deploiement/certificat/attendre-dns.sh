#!/bin/sh
# Appelé par certbot (dans son conteneur) au moment du défi DNS : on note la valeur TXT à créer, puis on attend
# qu'elle soit visible dans le DNS public (Cloudflare et Google), au plus 2 heures. Rien n'est créé automatiquement :
# c'est le porteur du projet qui ajoute l'enregistrement dans sa zone.
NOM="_acme-challenge.$CERTBOT_DOMAIN"
printf '%s\n%s\n' "$NOM" "$CERTBOT_VALIDATION" > /travail/defi-dns.txt
echo ""
echo "  ➜ Crée dans la zone DNS publique un enregistrement TXT :"
echo "      nom    : $NOM"
echo "      valeur : $CERTBOT_VALIDATION"
echo "  J'attends qu'il soit visible (au plus 2 h)…"
i=0
while [ $i -lt 720 ]; do
  vu=0
  for serveur in 1.1.1.1 8.8.8.8; do
    nslookup -type=TXT "$NOM" "$serveur" 2>/dev/null | grep -q -- "$CERTBOT_VALIDATION" && vu=$((vu + 1))
  done
  if [ $vu -eq 2 ]; then
    echo "  ✓ Enregistrement visible : vérification par Let's Encrypt."
    sleep 20
    exit 0
  fi
  i=$((i + 1))
  sleep 10
done
echo "  ✗ Enregistrement toujours invisible au bout de 2 h."
exit 1
