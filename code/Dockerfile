# L'image du jeu, pour le Raspberry Pi (préprod, Book 17 §5) et pour le VPS (production, deploiement/prod/) : le serveur
# de jeu sert aussi le client compilé.
# Construite sur le Mac avec « docker buildx build --platform linux/arm64 » (le Pi) ou « linux/amd64 » (le VPS).
#
# Sans émulation (2026-10-16) : le Mac (arm64) ne sait pas exécuter de programme x86_64 (« exec format error » au
# premier deployer-prod.sh). Tout ce qui exécute une commande (npm ci, la compilation) tourne donc sur la plateforme
# du Mac ($BUILDPLATFORM), et l'image finale ne fait que recopier des fichiers : aucun RUN. Possible parce que les
# dépendances du serveur (ws, three) sont du JavaScript pur, sans module natif (vérifié à l'étape 2).

# ---------- 1. Compiler le client (sur la plateforme qui construit) ----------
FROM --platform=$BUILDPLATFORM node:25-bookworm-slim AS construction
WORKDIR /app
COPY package.json package-lock.json ./
# npm saute en silence une dépendance optionnelle qu'il n'a pas pu télécharger : le module natif de rolldown (vite)
# manquait ainsi au déploiement de la 0.10, et l'étape gardée en cache échouait ensuite à chaque fois. On vérifie
# qu'il est là (celui de la plateforme qui construit) : une étape ratée n'est jamais gardée en cache.
RUN npm ci --no-audit --no-fund \
 && node -e 'require.resolve(`@rolldown/binding-${process.platform}-${process.arch}-gnu`)' \
 || { echo "Le module natif de rolldown manque (téléchargement raté ?) : relancer la construction."; exit 1; }
COPY . .
RUN npm run build

# ---------- 2. Les dépendances du serveur (sur la plateforme qui construit, elles aussi) ----------
FROM --platform=$BUILDPLATFORM node:25-bookworm-slim AS dependances
WORKDIR /app
COPY package.json package-lock.json ./
# Seulement ce dont le serveur a besoin : pas d'outils de développement. Un module natif (.node) serait compilé pour le
# Mac et ne marcherait pas sur le VPS : la construction s'arrête si une dépendance en apporte un.
RUN npm ci --omit=dev --no-audit --no-fund \
 && if find node_modules -name '*.node' | grep -q .; then echo "Une dépendance du serveur a un module natif : elle ne peut pas être recopiée telle quelle pour une autre plateforme."; exit 1; fi \
 && mkdir -p serveur/donnees

# ---------- 3. L'image qui tourne (aucune commande exécutée : que des copies) ----------
FROM node:25-bookworm-slim
ENV NODE_ENV=production \
    PORT=8080 \
    TZ=Europe/Paris
WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=dependances /app/node_modules ./node_modules
COPY commun ./commun
COPY serveur/src ./serveur/src
COPY scripts/bilan-mesures.ts scripts/reglages.ts scripts/banc-charge.ts scripts/admin.ts scripts/clavier.ts scripts/admin-web.ts scripts/remise-a-zero.ts ./scripts/
COPY --from=construction /app/client/dist ./client/dist
# Les données (base, réglages, sauvegardes) vivent dans un volume : elles survivent aux mises à jour de l'image.
COPY --from=dependances --chown=node:node /app/serveur/donnees ./serveur/donnees
USER node
VOLUME /app/serveur/donnees
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:8080/api/sante').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "--disable-warning=ExperimentalWarning", "serveur/src/index.ts"]
