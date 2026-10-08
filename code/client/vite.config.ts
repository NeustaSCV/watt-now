import { defineConfig, type PluginOption } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { fileURLToPath } from "node:url";

const racineCode = fileURLToPath(new URL("..", import.meta.url));
const serveurDeJeu = "http://localhost:8787";
// HTTPS pour l'iPhone (Safari passe en HTTPS, et le Service Worker l'exige) : `npm run dev:iphone`.
const https = process.env.WATT_HTTPS === "1";

const extensions: PluginOption[] = [];
// Certificat auto-signé, gardé dans node_modules/.vite (dans le projet).
if (https) extensions.push(basicSsl({ name: "watt-now-dev" }));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // Les fichiers de travail de Vite restent dans le projet (règle du CLAUDE.md).
  cacheDir: fileURLToPath(new URL("../node_modules/.vite", import.meta.url)),
  plugins: extensions,
  server: {
    host: true, // accessible depuis l'iPhone sur le réseau local
    port: 5173,
    fs: { allow: [racineCode] },
    proxy: {
      "/api": serveurDeJeu,
      "/ws": { target: serveurDeJeu, ws: true },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    // Three.js et son chargeur glTF (personnages animés) pèsent ≈ 950 Ko (≈ 270 Ko compressé) :
    // largement dans le budget du Book 21 §5.3.4 (premier écran ≤ 20 Mo).
    chunkSizeWarningLimit: 1100,
  },
});
