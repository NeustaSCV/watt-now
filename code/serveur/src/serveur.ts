// Le serveur HTTP + WebSocket. Séparé de index.ts pour pouvoir le démarrer dans les tests.

import { apparenceAncienne, apparenceValide } from "../../commun/src/apparence.ts";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import type { AddressInfo } from "node:net";
import { WebSocketServer } from "ws";
import { FERMETURE_JETON_REFUSE, type ReponseAuth } from "../../commun/src/messages.ts";
import { MOT_DE_PASSE_MIN, PSEUDO_MAX, PSEUDO_MIN, estFamille } from "../../commun/src/regles.ts";
import { Base, PseudoPris, type Compte } from "./base.ts";
import { pseudoReserve } from "../../commun/src/admin.ts";
import { Limiteur } from "./limiteur.ts";
import { journal } from "./journal.ts";
import { Monde } from "./monde.ts";
import { FichierReglages } from "./reglages-fichier.ts";
import { VERSION } from "../../commun/src/version.ts";
import { certificatPresent, portMixte, type Certificat } from "./https.ts";
import { Sauvegardes } from "./sauvegardes.ts";

export interface OptionsServeur {
  port: number;
  hote?: string;
  cheminBase: string;
  /** Dossier du client compilé, servi en production. */
  dossierClient?: string;
  /** Le fichier des réglages d'équilibrage, rechargé à chaud (absent : tout par défaut). */
  cheminReglages?: string;
  /** Le dossier des sauvegardes quotidiennes de la base (absent : pas de sauvegarde, comme dans les tests). */
  dossierSauvegardes?: string;
  /** Le dossier de la clé USB où recopier les sauvegardes (absent : pas de copie ; Book 17 §5.4). */
  dossierCle?: string;
  /** Le certificat HTTPS : s'il est là, le port sert HTTPS (et renvoie le HTTP en clair vers HTTPS). */
  certificat?: Certificat;
}

export interface ServeurDemarre {
  port: number;
  monde: Monde;
  /** La base, pour la page d'administration (admin-web.ts), qui tourne dans le même programme sur son propre port. */
  base: Base;
  fermer(): Promise<void>;
}

const TAILLE_MAX_CORPS = 10_000;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".glb": "model/gltf-binary",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".m4a": "audio/mp4",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

function repondre(res: ServerResponse, statut: number, corps: ReponseAuth | { ok: true; version?: string }): void {
  res.writeHead(statut, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(corps));
}

async function lireJson(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  let taille = 0;
  const morceaux: Buffer[] = [];
  for await (const morceau of req) {
    taille += (morceau as Buffer).length;
    if (taille > TAILLE_MAX_CORPS) return null;
    morceaux.push(morceau as Buffer);
  }
  try {
    const valeur: unknown = JSON.parse(Buffer.concat(morceaux).toString("utf8"));
    return typeof valeur === "object" && valeur !== null ? (valeur as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function pseudoValide(pseudo: unknown): pseudo is string {
  return (
    typeof pseudo === "string" &&
    pseudo.trim() === pseudo &&
    pseudo.length >= PSEUDO_MIN &&
    pseudo.length <= PSEUDO_MAX &&
    /^[\p{L}\p{N} _'-]+$/u.test(pseudo)
  );
}

/** Les fichiers texte compressés une fois, gardés en mémoire (chemin + date → contenu compressé). */
const COMPRESSES = new Map<string, { br: Buffer; gzip: Buffer }>();
const COMPRESSIBLES = new Set([".html", ".js", ".css", ".json", ".svg", ".webmanifest"]);

/**
 * Sert un fichier du client (2026-10-08, pour la légèreté) :
 * - les fichiers texte partent compressés (brotli ou gzip, selon le navigateur) : le code passe de ≈ 1 Mo à ≈ 290 Ko ;
 * - les fichiers dont le nom change à chaque version (code et styles, « index-XXXX.js ») sont gardés un an par le
 *   navigateur ; les autres (musique, personnages) un jour, avec une étiquette de version (ETag) : s'ils n'ont pas
 *   changé, le navigateur reçoit une réponse vide (304) ;
 * - index.html est toujours revérifié : une mise à jour arrive tout de suite.
 */
function servirFichier(dossier: string, req: IncomingMessage, res: ServerResponse): boolean {
  const url = req.url ?? "/";
  const chemin = normalize(join(dossier, decodeURIComponent(url.split("?")[0] ?? "/")));
  // Jamais hors du dossier (avec le séparateur : « dist-autre » n'est pas dans « dist »).
  if (chemin !== dossier && !chemin.startsWith(dossier.endsWith(sep) ? dossier : dossier + sep)) return false;
  let cible = chemin;
  // Un fichier absent des écrans d'accueil : une vraie 404 (pas la page du jeu, qu'un chargeur glTF lirait de travers).
  if (!existsSync(cible) && chemin.startsWith(join(dossier, "intro") + sep)) return false;
  if (!existsSync(cible) || statSync(cible).isDirectory()) cible = join(dossier, "index.html");
  if (!existsSync(cible)) return false;
  const infos = statSync(cible);
  const ext = extname(cible);
  const etiquette = `"${infos.size.toString(36)}-${Math.floor(infos.mtimeMs).toString(36)}"`;
  const nom = cible.slice(dossier.length);
  const versionne = /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(nom);
  // Les modules des écrans d'accueil (/intro/, copiés tels quels de la session intro) n'ont pas d'empreinte dans leur
  // nom : revalidés à chaque fois (l'ETag répond 304), pour qu'une nouvelle livraison ne mélange pas deux versions.
  const sansEmpreinte = ext === ".html" || (nom.startsWith(`${sep}intro${sep}`) && (ext === ".js" || ext === ".css"));
  const entetes: Record<string, string> = {
    "Content-Type": TYPES[ext] ?? "application/octet-stream",
    "Cache-Control": versionne ? "public, max-age=31536000, immutable" : sansEmpreinte ? "no-cache" : "public, max-age=86400",
    ETag: etiquette,
  };
  if (req.headers["if-none-match"] === etiquette) {
    res.writeHead(304, entetes).end();
    return true;
  }
  if (COMPRESSIBLES.has(ext)) {
    const accepte = String(req.headers["accept-encoding"] ?? "");
    const cle = `${cible}|${infos.mtimeMs}`;
    let c = COMPRESSES.get(cle);
    if (!c) {
      const brut = readFileSync(cible);
      c = { br: brotliCompressSync(brut, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 9 } }), gzip: gzipSync(brut, { level: 9 }) };
      COMPRESSES.set(cle, c);
    }
    const codage = /\bbr\b/.test(accepte) ? "br" : /\bgzip\b/.test(accepte) ? "gzip" : null;
    if (codage) {
      res.writeHead(200, { ...entetes, "Content-Encoding": codage, Vary: "Accept-Encoding" });
      res.end(c[codage]);
      return true;
    }
  }
  res.writeHead(200, entetes);
  createReadStream(cible).pipe(res);
  return true;
}

export async function demarrerServeur(options: OptionsServeur): Promise<ServeurDemarre> {
  const base = new Base(options.cheminBase);
  const monde = new Monde(base);
  const reglages = options.cheminReglages ? new FichierReglages(options.cheminReglages, (changes) => monde.diffuserReglages(changes)) : null;
  reglages?.charger();
  reglages?.surveiller();
  const sauvegardes = options.dossierSauvegardes
    ? new Sauvegardes(
        base,
        options.dossierSauvegardes,
        // La clé reçoit aussi de quoi remonter le jeu : les réglages et le dossier du certificat.
        options.dossierCle
          ? { dossier: options.dossierCle, reglages: options.cheminReglages, certificat: options.certificat ? dirname(options.certificat.cert) : undefined }
          : undefined,
      )
    : null;
  sauvegardes?.demarrer();

  // Les essais (0.1.1) : 10 mots de passe faux par adresse et par pseudo en 10 min ; 10 inscriptions par adresse en 10 min.
  const DIX_MINUTES = 10 * 60 * 1000;
  const echecsParAdresse = new Limiteur(10, DIX_MINUTES);
  const echecsParPseudo = new Limiteur(10, DIX_MINUTES);
  const inscriptionsParAdresse = new Limiteur(10, DIX_MINUTES);
  const TROP_D_ESSAIS = { ok: false as const, erreur: "Trop d'essais. Attends quelques minutes avant de réessayer." };

  async function inscription(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const adresse = req.socket.remoteAddress ?? "?";
    if (!inscriptionsParAdresse.autorise(adresse)) return repondre(res, 429, TROP_D_ESSAIS);
    const corps = await lireJson(req);
    const pseudo = corps?.pseudo;
    const motDePasse = corps?.motDePasse;
    const famille = corps?.famille;
    if (!pseudoValide(pseudo)) {
      return repondre(res, 400, { ok: false, erreur: `Pseudo de ${PSEUDO_MIN} à ${PSEUDO_MAX} caractères (lettres, chiffres, espaces, - et ').` });
    }
    if (typeof motDePasse !== "string" || motDePasse.length < MOT_DE_PASSE_MIN) {
      return repondre(res, 400, { ok: false, erreur: `Mot de passe d'au moins ${MOT_DE_PASSE_MIN} caractères.` });
    }
    if (!estFamille(famille)) return repondre(res, 400, { ok: false, erreur: "Choisis une famille." });
    // Le pseudo admin (« god » et ses variantes) : seule la commande admin le crée (scripts/admin.ts).
    if (pseudoReserve(pseudo)) return repondre(res, 409, { ok: false, erreur: "Ce pseudo est réservé." });
    // L'apparence choisie à la création (Book 14 §3) ; un ancien client n'envoie que sa carnation.
    const apparence =
      corps?.apparence !== undefined ? apparenceValide(corps.apparence, famille) : apparenceAncienne(famille, typeof corps?.peau === "number" ? corps.peau : -1);
    let compte: Compte;
    try {
      inscriptionsParAdresse.compter(adresse);
      compte = base.creerCompte(pseudo, motDePasse, famille, true, apparence);
    } catch (erreur) {
      if (erreur instanceof PseudoPris) return repondre(res, 409, { ok: false, erreur: erreur.message });
      throw erreur;
    }
    journal(`Nouveau personnage : ${compte.pseudo} (${compte.famille})`);
    // `nouveau` : le client montre les trois écrans d'accueil, une seule fois, avant le terrain ; `apparence` : le
    // personnage que l'écran n° 1 met en scène (intro/NOTICE-DEV.md §2b).
    repondre(res, 201, { ok: true, jeton: base.creerJeton(compte.id), pseudo: compte.pseudo, famille: compte.famille, nouveau: true, apparence });
  }

  /** Avant l'étape d'apparence : le pseudo est-il valide et libre ? */
  async function pseudoLibre(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const corps = await lireJson(req);
    const pseudo = typeof corps?.pseudo === "string" ? corps.pseudo.trim() : "";
    let erreur = "";
    if (!pseudoValide(pseudo)) erreur = `Pseudo de ${PSEUDO_MIN} à ${PSEUDO_MAX} caractères (lettres, chiffres, espaces, - et ').`;
    else if (pseudoReserve(pseudo)) erreur = "Ce pseudo est réservé.";
    else if (base.pseudoPris(pseudo)) erreur = "Ce pseudo est déjà pris.";
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ libre: erreur === "", erreur }));
  }

  async function connexion(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const corps = await lireJson(req);
    const pseudo = corps?.pseudo;
    const motDePasse = corps?.motDePasse;
    const adresse = req.socket.remoteAddress ?? "?";
    const clePseudo = typeof pseudo === "string" ? pseudo.trim().toLowerCase() : "";
    if (!echecsParAdresse.autorise(adresse) || !echecsParPseudo.autorise(clePseudo)) return repondre(res, 429, TROP_D_ESSAIS);
    const compte =
      typeof pseudo === "string" && typeof motDePasse === "string" ? base.verifierIdentifiants(pseudo, motDePasse) : null;
    if (!compte) {
      echecsParAdresse.compter(adresse);
      echecsParPseudo.compter(clePseudo);
      return repondre(res, 401, { ok: false, erreur: "Pseudo ou mot de passe incorrect." });
    }
    repondre(res, 200, { ok: true, jeton: base.creerJeton(compte.id), pseudo: compte.pseudo, famille: compte.famille, nouveau: false });
  }

  const traiterRequete = (req: IncomingMessage, res: ServerResponse): void => {
    const url = req.url ?? "/";
    const traiter = async (): Promise<void> => {
      if (req.method === "POST" && url === "/api/inscription") return inscription(req, res);
      if (req.method === "POST" && url === "/api/connexion") return connexion(req, res);
      if (req.method === "POST" && url === "/api/pseudo") return pseudoLibre(req, res);
      if (req.method === "GET" && url === "/api/sante") return repondre(res, 200, { ok: true, version: VERSION });
      if (req.method === "GET" && options.dossierClient && servirFichier(options.dossierClient, req, res)) return;
      res.writeHead(404).end();
    };
    traiter().catch((erreur: unknown) => {
      journal(`Erreur HTTP sur ${url} : ${String(erreur)}`);
      if (!res.headersSent) res.writeHead(500).end();
    });
  };

  const ws = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  // Avec un certificat : HTTPS et HTTP sur le même port (le clair est renvoyé vers HTTPS). Sinon : HTTP simple.
  const mixte = certificatPresent(options.certificat) ? portMixte(options.certificat, traiterRequete) : null;
  const http = mixte ? mixte.https : createServer(traiterRequete);
  if (options.certificat && !mixte) journal(`HTTPS : pas de certificat dans ${options.certificat.cert} : le jeu reste en HTTP.`);
  http.on("upgrade", (req, socket, entete) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/ws") return socket.destroy();
    ws.handleUpgrade(req, socket, entete, (client) => {
      const compte = base.compteParJeton(url.searchParams.get("jeton") ?? "");
      if (!compte) return client.close(FERMETURE_JETON_REFUSE, "Jeton refusé");
      monde.rejoindre(compte, client);
    });
  });

  const ecoute = mixte ? mixte.tcp : http;
  await new Promise<void>((resolve) => ecoute.listen(options.port, options.hote ?? "0.0.0.0", resolve));
  if (mixte) journal("HTTPS actif (le HTTP en clair est renvoyé vers HTTPS).");
  monde.demarrer();
  const port = (ecoute.address() as AddressInfo).port;

  return {
    port,
    monde,
    base,
    async fermer() {
      monde.arreter();
      reglages?.arreter();
      sauvegardes?.arreter();
      for (const client of ws.clients) client.terminate();
      ws.close();
      if (mixte) await mixte.fermer();
      else await new Promise<void>((resolve) => http.close(() => resolve()));
      base.fermer();
    },
  };
}
