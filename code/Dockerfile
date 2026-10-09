# L'image du jeu pour le Raspberry Pi (Book 17 §5) : le serveur de jeu sert aussi le client compilé.
# Construite sur le Pi lui-même (arm64) ou ailleurs avec « docker buildx build --platform linux/arm64 ».

# ---------- 1. Compiler le client ----------
FROM node:25-bookworm-slim AS construction
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- 2. L'image qui tourne ----------
FROM node:25-bookworm-slim
ENV NODE_ENV=production \
    PORT=8080 \
    TZ=Europe/Paris
WORKDIR /app
# Seulement ce dont le serveur a besoin (ws) : pas d'outils de développement.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY commun ./commun
COPY serveur/src ./serveur/src
COPY scripts/bilan-mesures.ts scripts/reglages.ts scripts/banc-charge.ts scripts/admin.ts ./scripts/
COPY --from=construction /app/client/dist ./client/dist
# Les données (base, réglages, sauvegardes) vivent dans un volume : elles survivent aux mises à jour de l'image.
RUN mkdir -p serveur/donnees && chown -R node:node serveur/donnees
USER node
VOLUME /app/serveur/donnees
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:8080/api/sante').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "--disable-warning=ExperimentalWarning", "serveur/src/index.ts"]
