// L'adresse d'un joueur (production derrière Traefik, 2026-10-16). Sans proxy (le Pi), c'est l'adresse de la prise.
// Derrière Traefik, toutes les connexions viennent de Traefik : la limite d'essais par adresse (serveur.ts) bloquerait
// tout le monde d'un coup, et le journal de l'admin ne dirait rien. Traefik ajoute l'adresse du client à la fin de
// l'en-tête X-Forwarded-For : on prend la dernière entrée, la seule qu'il garantit (les précédentes viennent du
// client et peuvent être inventées). À n'activer (WATT_PROXY=1) que si le jeu n'est joignable QUE par Traefik.

import type { IncomingMessage } from "node:http";

export function adresseClient(req: IncomingMessage, derriereProxy: boolean): string | undefined {
  if (derriereProxy) {
    const entete = req.headers["x-forwarded-for"];
    const liste = (Array.isArray(entete) ? entete.join(",") : (entete ?? "")).split(",");
    const derniere = liste[liste.length - 1]?.trim();
    if (derniere) return derniere;
  }
  return req.socket.remoteAddress;
}
