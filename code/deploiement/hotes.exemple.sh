# Modèle : copier en hotes.local.sh (hors de Git) et mettre les vraies adresses.
# Les scripts de déploiement le lisent ; une variable passée à la main (WATT_VPS, WATT_NOM) reste prioritaire.
export WATT_HOTE_PROD="jeu.example.org"         # le VPS de production, et l'adresse des joueurs
export WATT_HOTE_PREPROD="preprod.example.org"  # la préprod (le Pi), le nom du certificat HTTPS
