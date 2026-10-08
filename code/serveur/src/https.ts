// HTTPS sur le même port que HTTP (déploiement sur le Pi, 2026-10-08).
// Un seul port public (1234) : une connexion chiffrée (TLS) est servie en HTTPS ; une connexion en clair est
// renvoyée vers https:// (sauf /api/sante, pour le contrôle de santé de Docker). Ainsi, taper http:// ne donne
// plus d'erreur incompréhensible. Le certificat est relu dès qu'il change (renouvellement Let's Encrypt).

import { accessSync, constants, existsSync, readFileSync, unwatchFile, watchFile } from "node:fs";
import { createServer as creerHttp, type IncomingMessage, type Server as ServeurHttp, type ServerResponse } from "node:http";
import { createServer as creerHttps, type Server as ServeurHttps } from "node:https";
import { createServer as creerTcp, type Server as ServeurTcp, type Socket } from "node:net";
import { journal } from "./journal.ts";

export interface Certificat {
  /** La chaîne complète (fullchain.pem). */
  cert: string;
  /** La clé privée (privkey.pem). */
  cle: string;
}

/** Le certificat est-il là, et lisible ? (Sinon le jeu reste en HTTP simple, comme en développement.) */
export function certificatPresent(c: Certificat | undefined): c is Certificat {
  if (c === undefined || !existsSync(c.cert) || !existsSync(c.cle)) return false;
  try {
    accessSync(c.cert, constants.R_OK);
    accessSync(c.cle, constants.R_OK);
    return true;
  } catch {
    journal(`HTTPS : le certificat est là mais illisible pour le jeu (droits des fichiers) : le jeu reste en HTTP.`);
    return false;
  }
}

export interface PortMixte {
  /** Le serveur HTTPS : c'est lui qui reçoit les requêtes du jeu et les WebSocket (wss). */
  https: ServeurHttps;
  tcp: ServeurTcp;
  fermer(): Promise<void>;
}

/** Le premier octet d'une poignée de main TLS. */
const TLS_HANDSHAKE = 0x16;

export function portMixte(certificat: Certificat, traiter: (req: IncomingMessage, res: ServerResponse) => void): PortMixte {
  const lire = () => ({ cert: readFileSync(certificat.cert), key: readFileSync(certificat.cle) });
  const https = creerHttps(lire(), traiter);
  const clair: ServeurHttp = creerHttp((req, res) => {
    if (req.url === "/api/sante") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }).end('{"ok":true}');
      return;
    }
    const hote = req.headers.host ?? "";
    res.writeHead(301, { Location: `https://${hote}${req.url ?? "/"}` }).end();
  });
  // On regarde le premier octet de chaque connexion pour savoir s'il parle TLS ou en clair.
  const ouvertes = new Set<Socket>();
  const tcp = creerTcp((socket: Socket) => {
    ouvertes.add(socket);
    socket.on("close", () => ouvertes.delete(socket));
    socket.once("data", (premier: Buffer) => {
      socket.pause();
      socket.unshift(premier);
      (premier[0] === TLS_HANDSHAKE ? https : clair).emit("connection", socket);
      process.nextTick(() => socket.resume());
    });
    socket.on("error", () => socket.destroy());
  });
  // Le certificat renouvelé est pris sans redémarrer.
  watchFile(certificat.cert, { interval: 60_000 }, () => {
    try {
      https.setSecureContext(lire());
      journal("HTTPS : certificat rechargé.");
    } catch (erreur) {
      journal(`HTTPS : certificat illisible, on garde l'ancien (${String(erreur)}).`);
    }
  });
  return {
    https,
    tcp,
    async fermer() {
      unwatchFile(certificat.cert);
      // À l'arrêt, on coupe tout ce qui reste ouvert (connexions gardées vivantes, WebSocket).
      for (const s of ouvertes) s.destroy();
      await new Promise<void>((r) => tcp.close(() => r()));
    },
  };
}
