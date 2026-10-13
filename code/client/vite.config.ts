import { defineConfig, type PluginOption } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { fileURLToPath } from "node:url";
import { appendFileSync, mkdirSync } from "node:fs";

const racineCode = fileURLToPath(new URL("..", import.meta.url));
// Réglable pour faire tourner une seconde copie à côté (WATT_SERVEUR_JEU=http://localhost:8800).
const serveurDeJeu = process.env.WATT_SERVEUR_JEU ?? "http://localhost:8787";
// HTTPS pour l'iPhone (Safari passe en HTTPS, et le Service Worker l'exige) : `npm run dev:iphone`.
const https = process.env.WATT_HTTPS === "1";

const extensions: PluginOption[] = [];
// Certificat auto-signé, gardé dans node_modules/.vite (dans le projet).
if (https) extensions.push(basicSsl({ name: "watt-now-dev" }));

// Le mode mesure (`?mesure=1`) envoie ses relevés au Mac (bouton « Envoyer au Mac », fin du banc d'essai) : une ligne
// JSON par relevé dans `.claude-travail/mesures/releves.jsonl` (dans le projet). En développement seulement.
const dossierMesures = fileURLToPath(new URL("../../.claude-travail/mesures/", import.meta.url));
extensions.push({
  name: "watt-releves-de-mesure",
  configureServer(serveur) {
    serveur.middlewares.use("/__mesure", (req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.end();
        return;
      }
      let corps = "";
      req.on("data", (morceau: Buffer) => {
        corps += morceau;
        if (corps.length > 500_000) req.destroy();
      });
      req.on("end", () => {
        try {
          const releve = JSON.parse(corps) as object;
          mkdirSync(dossierMesures, { recursive: true });
          appendFileSync(dossierMesures + "releves.jsonl", JSON.stringify({ recu: new Date().toISOString(), ...releve }) + "\n");
          res.end("ok");
        } catch {
          res.statusCode = 400;
          res.end();
        }
      });
    });
  },
});

// Les écrans d'accueil (client/public/intro/, copie de la session intro) sont servis tels quels, sans compilation.
// En développement, Vite ajoute « ?import » à l'adresse de l'import dynamique (accueil.ts), puis refuse (erreur 500)
// d'importer un fichier de public/ ainsi marqué : on retire la marque, et Vite sert le fichier comme un fichier public.
// (Avec la version construite, rien à faire : dist/intro/ est servi comme le reste.)
extensions.push({
  name: "watt-accueil-tel-quel",
  configureServer(serveur) {
    serveur.middlewares.use((req, _res, suite) => {
      const url = req.url ?? "";
      if (url.startsWith("/intro/") && url.includes("?")) {
        const [chemin, requete] = url.split("?", 2);
        const reste = requete.split("&").filter((p) => p !== "import");
        req.url = reste.length ? `${chemin}?${reste.join("&")}` : chemin;
      }
      suite();
    });
  },
});

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
