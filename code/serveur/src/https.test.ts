// HTTPS et HTTP sur le même port (déploiement sur le Pi, 2026-10-08).

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { get as getHttp } from "node:http";
import { get as getHttps } from "node:https";
import { join } from "node:path";
import { WebSocket } from "ws";
import { FERMETURE_JETON_REFUSE } from "../../commun/src/messages.ts";
import { demarrerServeur } from "./serveur.ts";

function requete(url: string): Promise<{ statut: number; entetes: Record<string, unknown>; corps: string }> {
  const get = url.startsWith("https") ? getHttps : getHttp;
  return new Promise((ok, ko) => {
    get(url, { rejectUnauthorized: false }, (res) => {
      let corps = "";
      res.on("data", (d) => (corps += d));
      res.on("end", () => ok({ statut: res.statusCode ?? 0, entetes: res.headers, corps }));
    }).on("error", ko);
  });
}

test("avec un certificat : HTTPS et WSS ; le HTTP en clair est renvoyé vers HTTPS, sauf le contrôle de santé", async () => {
  // Dans le dossier du projet (jamais dans un dossier temporaire du système).
  const dossier = join(import.meta.dirname, "..", "donnees", "essais-https");
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const cert = join(dossier, "fullchain.pem");
  const cle = join(dossier, "privkey.pem");
  // Un certificat de test, auto-signé (le vrai viendra de Let's Encrypt).
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", cle, "-out", cert, "-days", "1", "-subj", "/CN=localhost"], { stdio: "ignore" });
  const serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase: ":memory:", certificat: { cert, cle } });
  try {
    const p = serveur.port;
    assert.equal(JSON.parse((await requete(`https://127.0.0.1:${p}/api/sante`)).corps).ok, true);
    const clair = await requete(`http://127.0.0.1:${p}/jeu?x=1`);
    assert.equal(clair.statut, 301);
    assert.equal(clair.entetes.location, `https://127.0.0.1:${p}/jeu?x=1`);
    assert.equal((await requete(`http://127.0.0.1:${p}/api/sante`)).statut, 200, "le contrôle de santé de Docker, en clair");
    const code = await new Promise<number>((ok, ko) => {
      const ws = new WebSocket(`wss://127.0.0.1:${p}/ws?jeton=faux`, { rejectUnauthorized: false });
      ws.on("close", (c) => ok(c));
      ws.on("error", ko);
    });
    assert.equal(code, FERMETURE_JETON_REFUSE, "la WebSocket chiffrée arrive jusqu'au jeu");
  } finally {
    await serveur.fermer();
    rmSync(dossier, { recursive: true, force: true });
  }
});
