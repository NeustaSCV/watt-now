// La page d'administration sur le réseau local (P-014, chantier 16 de la 0.8) : un second serveur web, dans le même
// programme que le jeu, qui n'écoute que sur son port (4321 par défaut) ; rien de l'admin ne passe par le port du jeu.
// Sans mot de passe et sans liste d'adresses (0.8.1, décision du porteur du 2026-10-11) : elle n'est protégée que par
// son port, qui n'est jamais publié à l'extérieur (la box ne publie que le port du jeu).
//
// Ce qu'elle fait : compter et nommer les joueurs connectés, lister les comptes, montrer ce que la base sait déjà de
// chacun (aucun compteur nouveau, aucune mesure écrite), réinitialiser un mot de passe (le provisoire est affiché une
// seule fois), supprimer un compte (en retapant son pseudo). Le compte « god » est protégé. Chaque action est notée
// dans le journal du serveur : quoi, quel compte, quand (l'heure du journal), depuis quelle adresse.
//
// Du HTML simple, sans script : des liens, des formulaires, une confirmation dans la page avec un bouton (jamais de
// fenêtre de dialogue, règle R48).

import { randomInt } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { formaterWotts, valeurWotts } from "../../commun/src/economie.ts";
import { etapeFeu, etapeInstallation } from "../../commun/src/lignees.ts";
import { LIEUX } from "../../commun/src/lieux.ts";
import { nommer, type Inventaire } from "../../commun/src/objets.ts";
import { QUETES } from "../../commun/src/quetes.ts";
import { NOMS_INSTALLATIONS } from "../../commun/src/recettes.ts";
import { NOMS_FAMILLES, estFamille } from "../../commun/src/regles.ts";
import { NOMBRE_ETAPES, etapesTutoriel } from "../../commun/src/tutoriel.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";
import { CompteProtege, type Base, type FicheCompte } from "./base.ts";
import { journal } from "./journal.ts";
import type { Monde } from "./monde.ts";

/** Le port de la page d'administration en production (réglable : WATT_ADMIN_PORT). */
export const PORT_ADMIN = 4321;

/** Ce que la page demande au monde vivant : la liste des connectés et la déconnexion. */
export type MondeAdmin = Pick<Monde, "connectes" | "deconnecter">;

export interface OptionsAdminWeb {
  port: number;
  hote?: string;
  base: Base;
  monde: MondeAdmin;
  /** L'adresse d'où vient une requête (les tests la remplacent pour jouer un poste de la DMZ). */
  adresseDe?: (req: IncomingMessage) => string | undefined;
}

export interface AdminWebDemarre {
  port: number;
  fermer(): Promise<void>;
}

// ---------- L'adresse du poste (pour le journal) ----------

/** « ::ffff:192.168.1.20 » (une adresse IPv4 vue par une prise IPv6) → « 192.168.1.20 ». */
export function adresseNue(adresse: string): string {
  const a = adresse.trim().toLowerCase();
  return a.startsWith("::ffff:") && a.includes(".") ? a.slice(7) : a;
}

/** Un envoi de formulaire qui vient d'une autre page que la nôtre (un autre site ouvert sur le poste du porteur) : refusé. */
function origineAutorisee(req: IncomingMessage): boolean {
  const hote = String(req.headers.host ?? "").toLowerCase();
  const origine = req.headers.origin ?? req.headers.referer;
  if (!origine) return true;
  try {
    return new URL(String(origine)).host.toLowerCase() === hote;
  } catch {
    return false;
  }
}

// ---------- Le mot de passe provisoire ----------

/** Sans les caractères qui se confondent à l'œil (l, 1, i, o, 0). */
const ALPHABET_PROVISOIRE = "abcdefghjkmnpqrstuvwxyz23456789";

/** Un mot de passe provisoire lisible, à dicter : trois groupes de quatre (« k7mp-2xqa-hn4d »), environ 59 bits. */
export function motDePasseProvisoire(): string {
  const groupe = () => Array.from({ length: 4 }, () => ALPHABET_PROVISOIRE[randomInt(ALPHABET_PROVISOIRE.length)]).join("");
  return `${groupe()}-${groupe()}-${groupe()}`;
}

// ---------- Le serveur ----------

const TAILLE_MAX_FORMULAIRE = 2000;

async function lireFormulaire(req: IncomingMessage): Promise<URLSearchParams | null> {
  let taille = 0;
  const morceaux: Buffer[] = [];
  for await (const morceau of req) {
    taille += (morceau as Buffer).length;
    if (taille > TAILLE_MAX_FORMULAIRE) return null;
    morceaux.push(morceau as Buffer);
  }
  return new URLSearchParams(Buffer.concat(morceaux).toString("utf8"));
}

const ENTETES = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  // Aucun script, aucune ressource extérieure, pas d'affichage dans le cadre d'une autre page.
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "X-Frame-Options": "DENY",
  // « same-origin » et non « no-referrer » : avec ce dernier, le navigateur envoie « Origin: null » à nos propres
  // formulaires, qu'on ne distinguerait plus d'un envoi venu d'ailleurs.
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
};

function envoyer(res: ServerResponse, statut: number, html: string): void {
  res.writeHead(statut, ENTETES);
  res.end(html);
}

export async function demarrerAdminWeb(options: OptionsAdminWeb): Promise<AdminWebDemarre> {
  const { base, monde } = options;
  const adresseDe = options.adresseDe ?? ((req: IncomingMessage) => req.socket.remoteAddress);
  /** Les adresses refusées déjà notées au journal (une ligne par adresse et par heure, pas une par requête). */
  const refusNotes = new Map<string, number>();

  const noterRefus = (adresse: string, raison: string) => {
    const instant = Date.now();
    if ((refusNotes.get(adresse) ?? 0) > instant - 3_600_000) return;
    refusNotes.set(adresse, instant);
    journal(`Admin : accès refusé à ${adresse} (${raison})`);
  };

  const traiter = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const adresse = adresseNue(adresseDe(req) ?? "?");
    const url = new URL(req.url ?? "/", "http://admin");
    const chemin = url.pathname;
    if (req.method === "GET" && chemin === "/") return envoyer(res, 200, pageAccueil(base, monde));
    const fiche = /^\/joueur\/(\d+)$/.exec(chemin);
    if (req.method === "GET" && fiche) {
      const f = base.ficheCompte(Number(fiche[1]));
      if (!f) return envoyer(res, 404, pageIntrouvable());
      return envoyer(res, 200, pageFiche(f, monde, { confirmerMotDePasse: url.searchParams.get("confirmer") === "mot-de-passe" }));
    }
    const action = /^\/joueur\/(\d+)\/(mot-de-passe|supprimer)$/.exec(chemin);
    if (req.method === "POST" && action) {
      if (!origineAutorisee(req)) {
        noterRefus(adresse, "formulaire venu d'une autre page");
        return envoyer(res, 403, page("Accès refusé", `<p>Ce formulaire ne vient pas de la page d'administration.</p>`));
      }
      const id = Number(action[1]);
      const f = base.ficheCompte(id);
      if (!f) return envoyer(res, 404, pageIntrouvable());
      if (f.protege) {
        journal(`Admin (${adresse}) : refusé, « ${f.pseudo} » (compte ${id}) est protégé`);
        return envoyer(res, 403, pageFiche(f, monde, { erreur: "Ce compte est protégé : ni suppression ni réinitialisation depuis cette page." }));
      }
      const formulaire = await lireFormulaire(req);
      if (action[2] === "mot-de-passe") return reinitialiser(res, f, adresse);
      return supprimer(res, f, formulaire?.get("pseudo") ?? "", adresse);
    }
    envoyer(res, 404, pageIntrouvable());
  };

  function reinitialiser(res: ServerResponse, f: FicheCompte, adresse: string): void {
    const provisoire = motDePasseProvisoire();
    try {
      const fermees = base.changerMotDePasse(f.id, provisoire);
      const etaitConnecte = monde.deconnecter(f.id);
      journal(`Admin (${adresse}) : mot de passe réinitialisé pour « ${f.pseudo} » (compte ${f.id}) ; ${fermees} session(s) fermée(s)${etaitConnecte ? ", déconnecté" : ""}`);
      envoyer(
        res,
        200,
        page(
          `Nouveau mot de passe de ${f.pseudo}`,
          `${retour()}
          <h1>Nouveau mot de passe de ${e(f.pseudo)}</h1>
          <section class="bloc ok">
            <p>Le mot de passe provisoire, à donner à ${e(f.pseudo)} :</p>
            <p class="provisoire">${e(provisoire)}</p>
            <p class="note">Il n'est affiché <strong>qu'une seule fois</strong> : note-le maintenant. L'ancien ne marche plus. ${fermees > 0 || etaitConnecte ? "Ses sessions ouvertes sont fermées." : "Aucune session n'était ouverte."}</p>
          </section>
          <p><a class="bouton" href="/joueur/${f.id}">Revenir à sa fiche</a></p>`,
        ),
      );
    } catch (erreur) {
      if (erreur instanceof CompteProtege) return envoyer(res, 403, pageFiche(f, monde, { erreur: erreur.message }));
      throw erreur;
    }
  }

  function supprimer(res: ServerResponse, f: FicheCompte, retape: string, adresse: string): void {
    // La confirmation : le pseudo retapé à l'identique (les espaces autour ne comptent pas, la casse si).
    if (retape.trim() !== f.pseudo) {
      return envoyer(res, 400, pageFiche(f, monde, { erreur: `Le pseudo retapé ne correspond pas : le compte n'est pas supprimé.`, champSupprimer: retape }));
    }
    try {
      // Déconnecté d'abord : son état en mémoire ne doit pas réécrire la base derrière la suppression.
      const etaitConnecte = monde.deconnecter(f.id, true);
      base.supprimerCompte(f.id);
      journal(`Admin (${adresse}) : compte supprimé, « ${f.pseudo} » (compte ${f.id}, ${f.personnage ? NOMS_FAMILLES[f.personnage.famille] : "sans personnage"})${etaitConnecte ? ", déconnecté d'abord" : ""}`);
      envoyer(
        res,
        200,
        page(
          `${f.pseudo} supprimé`,
          `${retour()}
          <h1>Compte supprimé</h1>
          <section class="bloc ok"><p>Le compte <strong>${e(f.pseudo)}</strong> et tout ce qui en dépend (personnage, sac, terrain, coffres, feux, Coopérative, mesures) sont supprimés.${etaitConnecte ? " Il a été déconnecté d'abord." : ""}</p></section>
          <p><a class="bouton" href="/">Revenir à la liste</a></p>`,
        ),
      );
    } catch (erreur) {
      if (erreur instanceof CompteProtege) return envoyer(res, 403, pageFiche(f, monde, { erreur: erreur.message }));
      throw erreur;
    }
  }

  const serveur: Server = createServer((req, res) => {
    traiter(req, res).catch((erreur: unknown) => {
      journal(`Admin : erreur sur ${req.url ?? "?"} : ${String(erreur)}`);
      if (!res.headersSent) envoyer(res, 500, page("Erreur", "<p>Une erreur est survenue (voir le journal du serveur).</p>"));
    });
  });
  await new Promise<void>((resolve, reject) => {
    serveur.once("error", reject);
    serveur.listen(options.port, options.hote ?? "0.0.0.0", () => {
      serveur.off("error", reject);
      resolve();
    });
  });
  const port = (serveur.address() as AddressInfo).port;
  return {
    port,
    fermer: () =>
      new Promise<void>((resolve) => {
        serveur.close(() => resolve());
        serveur.closeAllConnections();
      }),
  };
}

// ---------- Les pages ----------

/** Échappe un texte pour le HTML. */
function e(texte: string | number): string {
  return String(texte).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const FORMAT_DATE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function date(iso: string | number | null): string {
  if (iso === null || iso === "" || iso === 0) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : FORMAT_DATE.format(d);
}

function nomFamille(famille: string | null): string {
  return famille && estFamille(famille) ? NOMS_FAMILLES[famille] : "—";
}

function nomLieu(lieu: string): string {
  if (lieu === "terrain") return "Son terrain";
  return (LIEUX as Record<string, { nom: string } | undefined>)[lieu]?.nom ?? lieu;
}

/** Le nom d'un objet ; une clé que le jeu ne connaît plus s'affiche telle quelle. */
function objet(cle: string, quantite: number): string {
  try {
    return nommer(cle as CleObjet, quantite);
  } catch {
    return `${quantite} × ${cle}`;
  }
}

function listeObjets(inventaire: Inventaire | undefined): string {
  const lignes = Object.entries(inventaire ?? {})
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([cle, n]) => objet(cle, n!))
    .sort((a, b) => a.localeCompare(b, "fr"));
  return lignes.length > 0 ? `<ul class="objets">${lignes.map((l) => `<li>${e(l)}</li>`).join("")}</ul>` : `<p class="vide">Vide.</p>`;
}

function arrondi(n: number, chiffres = 0): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: chiffres });
}

function retour(): string {
  return `<nav><a href="/">← Tous les comptes</a></nav>`;
}

function pageIntrouvable(): string {
  return page("Introuvable", `${retour()}<h1>Introuvable</h1><p>Ce compte n'existe pas (ou plus).</p>`);
}

function pageAccueil(base: Base, monde: MondeAdmin): string {
  const connectes = monde.connectes().sort((a, b) => a.pseudo.localeCompare(b.pseudo, "fr"));
  const enLigne = new Set(connectes.map((c) => c.id));
  const comptes = base.listeComptes().sort((a, b) => (b.majLe ?? "").localeCompare(a.majLe ?? ""));
  const n = connectes.length;
  const titreConnectes = n === 0 ? "Personne n'est connecté" : `${n} joueur${n > 1 ? "s" : ""} connecté${n > 1 ? "s" : ""}`;
  const listeConnectes =
    n === 0
      ? `<p class="vide">En ce moment, personne ne joue.</p>`
      : `<ul class="connectes">${connectes
          .map((c) => `<li><a href="/joueur/${c.id}"><span class="pastille"></span>${e(c.pseudo)}</a><span>${e(nomFamille(c.famille))}</span><span>${e(nomLieu(c.lieu))}</span></li>`)
          .join("")}</ul>`;
  const listeComptes =
    comptes.length === 0
      ? `<p class="vide">Aucun compte.</p>`
      : `<ul class="comptes">${comptes
          .map(
            (c) => `<li><a href="/joueur/${c.id}">
              <span class="pseudo">${enLigne.has(c.id) ? `<span class="pastille" title="Connecté"></span>` : ""}${e(c.pseudo)}${c.admin ? ` <span class="etiquette">admin</span>` : ""}</span>
              <span class="famille">${e(nomFamille(c.famille))}</span>
              <span class="detail"><span>Créé le ${e(date(c.creeLe))}</span><span>Vu le ${e(date(c.majLe))}</span></span>
            </a></li>`,
          )
          .join("")}</ul>`;
  return page(
    "Administration",
    `<h1>Administration</h1>
    <section class="bloc"><h2>${titreConnectes}</h2>${listeConnectes}</section>
    <section class="bloc"><h2>Les comptes <span class="compte">${comptes.length}</span></h2>${listeComptes}</section>
    <p class="pied"><a href="/">Actualiser</a> · page lue le ${e(date(Date.now()))}</p>`,
  );
}

interface OptionsFiche {
  erreur?: string;
  confirmerMotDePasse?: boolean;
  /** Ce qui avait été retapé (une erreur de confirmation : on le remet dans le champ). */
  champSupprimer?: string;
}

function ligne(etiquette: string, valeur: string): string {
  return `<div class="ligne"><dt>${e(etiquette)}</dt><dd>${valeur}</dd></div>`;
}

function pageFiche(f: FicheCompte, monde: MondeAdmin, o: OptionsFiche = {}): string {
  const enLigne = monde.connectes().find((c) => c.id === f.id);
  const p = f.personnage;
  const maintenant = Date.now();

  const compte = `<section class="bloc"><h2>Compte</h2><dl>
    ${ligne("Pseudo", e(f.pseudo))}
    ${ligne("Numéro", e(f.id))}
    ${ligne("Créé le", e(date(f.creeLe)))}
    ${ligne("Sessions ouvertes", e(f.sessions))}
    ${ligne("Connecté", enLigne ? `<span class="pastille"></span>oui, ${e(nomLieu(enLigne.lieu))}` : "non")}
    ${f.admin ? ligne("Rôle", "admin (protégé)") : f.protege ? ligne("Rôle", "pseudo réservé (protégé)") : ""}
  </dl></section>`;

  let personnage = `<section class="bloc"><h2>Personnage</h2><p class="vide">Pas de personnage.</p></section>`;
  if (p) {
    const tuto = p.tutoriel
      ? `en cours, étape ${Math.min(p.tutoriel.etape + 1, NOMBRE_ETAPES)} sur ${NOMBRE_ETAPES}${etapesTutoriel(p.famille)[p.tutoriel.etape] ? ` (« ${e(etapesTutoriel(p.famille)[p.tutoriel.etape]!.titre)} »)` : ""}`
      : "terminé (ou passé)";
    const quetes = p.quetesFinies.map((id) => QUETES.find((q) => q.id === id)?.titre ?? id);
    const blessures = p.sante.blessures.length;
    personnage = `<section class="bloc"><h2>Personnage</h2><dl>
      ${ligne("Famille", e(nomFamille(p.famille)))}
      ${ligne(enLigne ? "Lieu (en ce moment)" : "Dernier lieu", e(nomLieu(enLigne?.lieu ?? p.lieu)))}
      ${ligne("Position", `x ${e(arrondi(p.x))}, z ${e(arrondi(p.z))}`)}
      ${ligne("Dernière sauvegarde", e(date(p.majLe)))}
      ${ligne("Santé", `${e(arrondi(p.sante.points))} / 100${blessures > 0 ? `, ${blessures} blessure${blessures > 1 ? "s" : ""}` : ""}${p.sante.saignement !== "aucun" ? `, saignement ${e(p.sante.saignement)}` : ""}`)}
      ${ligne("Endurance", `${e(arrondi(p.endurance))} / 100`)}
      ${ligne("Calories", `${e(arrondi(p.besoins.kcal))} kcal`)}
      ${ligne("Eau", `${e(arrondi(p.besoins.eau, 2))} L`)}
      ${ligne("Repos", `${e(arrondi((p.besoins.repos ?? 1) * 100))} %`)}
      ${ligne("Gourde", `${e(arrondi(p.gourde.litres, 2))} L (${p.gourde.contenu === "brute" ? "eau brute" : "potable"})`)}
      ${ligne("Wotts en poche", e(formaterWotts(valeurWotts(p.wotts.poche, maintenant))))}
      ${ligne("Wotts au compte", e(formaterWotts(valeurWotts(p.wotts.compte, maintenant))))}
      ${ligne("Arme équipée", p.arme ? e(objet(p.arme, 1)) : "la meilleure du sac")}
      ${ligne("Tutoriel", tuto)}
      ${ligne("Quêtes finies", quetes.length > 0 ? `${quetes.length} : ${quetes.map(e).join(", ")}` : "aucune")}
    </dl>${enLigne ? `<p class="note">Connecté : la base est sauvegardée toutes les 5 secondes.</p>` : ""}</section>`;
  }

  const sac = `<section class="bloc"><h2>Sac</h2>${listeObjets(f.sac)}${f.sacsAuSol > 0 ? `<p class="note">${f.sacsAuSol} sac${f.sacsAuSol > 1 ? "s" : ""} ou tas encore au sol.</p>` : ""}</section>`;

  const coffres = f.installations.filter((i) => i.etat.contenu !== undefined || i.type === "coffre");
  const blocCoffres = `<section class="bloc"><h2>Coffres <span class="compte">${coffres.length}</span></h2>${
    coffres.length === 0
      ? `<p class="vide">Aucun coffre.</p>`
      : coffres.map((c) => `<details><summary>${e(nomInstallation(c))} n° ${e(c.id)}</summary>${listeObjets(c.etat.contenu)}</details>`).join("")
  }</section>`;

  const installations = `<section class="bloc"><h2>Installations <span class="compte">${f.installations.length}</span></h2>${
    f.installations.length === 0
      ? `<p class="vide">Rien n'est posé.</p>`
      : `<ul class="objets">${f.installations.map((i) => `<li>${e(nomInstallation(i))}${i.niveau ? ` <span class="niveau">niv. ${e(i.niveau)}</span>` : ""}</li>`).join("")}</ul>`
  }</section>`;

  const feux = `<section class="bloc"><h2>Feux <span class="compte">${f.feux.length}</span></h2>${
    f.feux.length === 0
      ? `<p class="vide">Aucun feu.</p>`
      : `<ul class="objets">${f.feux
          .map((x) => `<li>${e(nomFeu(x))}${x.niveau ? ` <span class="niveau">niv. ${e(x.niveau)}</span>` : ""} — ${x.allume ? "allumé" : "éteint"}, ${e(arrondi(x.bois, 1))} kg de bois</li>`)
          .join("")}</ul>`
  }</section>`;

  const parGenre = new Map<string, FicheCompte["mesures"]>();
  for (const m of f.mesures) parGenre.set(m.genre, [...(parGenre.get(m.genre) ?? []), m]);
  const mesures = `<section class="bloc large"><h2>Mesures</h2>${
    parGenre.size === 0
      ? `<p class="vide">Aucune mesure à son nom.</p>`
      : [...parGenre]
          .map(
            ([genre, lignes]) =>
              `<details><summary>${e(genre)} <span class="compte">${lignes.reduce((s, l) => s + l.nombre, 0)}</span></summary><table><thead><tr><th>Quoi</th><th>Fois</th><th>Total</th></tr></thead><tbody>${lignes
                .map((l) => `<tr><td>${e(l.quoi)}</td><td>${e(l.nombre)}</td><td>${e(arrondi(l.total, 1))}</td></tr>`)
                .join("")}</tbody></table></details>`,
          )
          .join("")
  }<p class="note">Ce que le jeu note déjà (Book 17 §6) ; la page n'en ajoute aucune.</p></section>`;

  let actions: string;
  if (f.protege) {
    actions = `<section class="bloc large"><h2>Actions</h2><p>Ce compte est <strong>protégé</strong> : ni suppression, ni réinitialisation depuis cette page.</p></section>`;
  } else {
    const motDePasse = o.confirmerMotDePasse
      ? `<div class="confirmation">
          <p>Réinitialiser le mot de passe de <strong>${e(f.pseudo)}</strong> ? Un mot de passe provisoire sera tiré et affiché une seule fois ; ses sessions seront fermées${enLigne ? " et il sera déconnecté" : ""}.</p>
          <form method="post" action="/joueur/${f.id}/mot-de-passe"><button type="submit" class="bouton danger">Oui, réinitialiser</button> <a class="bouton" href="/joueur/${f.id}">Annuler</a></form>
        </div>`
      : `<p><a class="bouton" href="/joueur/${f.id}?confirmer=mot-de-passe#actions">Réinitialiser le mot de passe…</a></p>`;
    actions = `<section class="bloc large" id="actions"><h2>Actions</h2>
      <h3>Mot de passe</h3>${motDePasse}
      <h3>Supprimer le compte</h3>
      <form method="post" action="/joueur/${f.id}/supprimer" class="supprimer">
        <p>Le compte et tout ce qui en dépend partent pour de bon${enLigne ? " ; il sera déconnecté d'abord" : ""}. Pour confirmer, retape le pseudo <strong>${e(f.pseudo)}</strong> :</p>
        <label class="champ"><span>Pseudo</span><input name="pseudo" autocomplete="off" autocapitalize="off" spellcheck="false" value="${e(o.champSupprimer ?? "")}" required></label>
        <button type="submit" class="bouton danger">Supprimer définitivement</button>
      </form>
    </section>`;
  }

  return page(
    f.pseudo,
    `${retour()}
    <h1>${enLigne ? `<span class="pastille"></span>` : ""}${e(f.pseudo)}</h1>
    ${o.erreur ? `<p class="erreur" role="alert">${e(o.erreur)}</p>` : ""}
    <div class="grille">${compte}${personnage}${sac}${blocCoffres}${installations}${feux}${mesures}${actions}</div>`,
  );
}

function nomInstallation(i: { type: string; niveau?: number }): string {
  const nom = etapeInstallation(i)?.nom ?? (NOMS_INSTALLATIONS as Record<string, string | undefined>)[i.type] ?? i.type;
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

function nomFeu(f: { niveau?: number; dakota?: boolean }): string {
  try {
    return etapeFeu(f).nom;
  } catch {
    return "Feu";
  }
}

function page(titre: string, corps: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${e(titre)} · Watt Now? admin</title>
<style>
:root {
  --fond: #f4f1ea; --carte: #fffdf8; --texte: #26231e; --doux: #6d675c; --ligne: #e2dccf;
  --accent: #9a5a12; --vert: #2f8a4c; --rouge: #b3261e; --rouge-fond: #fbe9e7; --ok-fond: #eaf5ec;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root {
    --fond: #171614; --carte: #22201d; --texte: #ece6da; --doux: #a59e90; --ligne: #39352f;
    --accent: #e0a458; --vert: #5cc47c; --rouge: #ff8a80; --rouge-fond: #3a1f1c; --ok-fond: #1d3324;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--fond); color: var(--texte); font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
header { background: var(--carte); border-bottom: 1px solid var(--ligne); padding: 10px 16px; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
header strong { font-size: 17px; }
header span { color: var(--doux); font-size: 13px; }
main { max-width: 1040px; margin: 0 auto; padding: 12px 16px 32px; }
h1 { font-size: 24px; margin: 8px 0 12px; display: flex; align-items: center; gap: 8px; overflow-wrap: anywhere; }
h2 { font-size: 17px; margin: 0 0 8px; display: flex; align-items: center; gap: 8px; }
h3 { font-size: 15px; margin: 14px 0 6px; color: var(--doux); }
a { color: var(--accent); }
nav { font-size: 15px; margin: 4px 0; }
.bloc { background: var(--carte); border: 1px solid var(--ligne); border-radius: 10px; padding: 12px 14px; margin: 0 0 12px; min-width: 0; }
.bloc.ok { background: var(--ok-fond); }
.grille { display: grid; grid-template-columns: 1fr; gap: 0 12px; align-items: start; }
@media (min-width: 760px) { .grille { grid-template-columns: 1fr 1fr; } .grille .large { grid-column: 1 / -1; } }
.compte { font-size: 13px; font-weight: 600; color: var(--doux); background: var(--fond); border-radius: 999px; padding: 1px 8px; }
.pastille { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--vert); margin-right: 6px; flex: none; }
.etiquette { font-size: 12px; color: var(--accent); border: 1px solid currentColor; border-radius: 4px; padding: 0 4px; font-weight: 600; }
.vide, .note, .pied { color: var(--doux); font-size: 14px; margin: 4px 0; }
ul { margin: 0; padding: 0; list-style: none; }
.connectes li { display: grid; grid-template-columns: 1.3fr 1fr 1.4fr; gap: 8px; padding: 8px 0; border-top: 1px solid var(--ligne); align-items: center; }
.connectes li:first-child { border-top: 0; }
.connectes a { font-weight: 600; display: flex; align-items: center; overflow-wrap: anywhere; }
.connectes span { color: var(--doux); font-size: 14px; }
.comptes { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; }
.comptes a { display: grid; gap: 2px; padding: 10px 12px; border: 1px solid var(--ligne); border-radius: 8px; text-decoration: none; color: var(--texte); background: var(--fond); min-height: 44px; }
.comptes a:hover, .comptes a:focus-visible { border-color: var(--accent); }
.comptes .pseudo { font-weight: 600; display: flex; align-items: center; gap: 4px; overflow-wrap: anywhere; }
.comptes .famille { color: var(--accent); font-size: 14px; }
.comptes .detail { display: flex; flex-wrap: wrap; gap: 0 12px; color: var(--doux); font-size: 13px; }
dl { margin: 0; }
.ligne { display: grid; grid-template-columns: minmax(110px, 40%) 1fr; gap: 8px; padding: 4px 0; border-top: 1px solid var(--ligne); }
.ligne:first-child { border-top: 0; }
dt { color: var(--doux); font-size: 14px; }
dd { margin: 0; overflow-wrap: anywhere; display: flex; align-items: center; flex-wrap: wrap; }
.objets li { padding: 3px 0; border-top: 1px solid var(--ligne); font-size: 15px; }
.objets li:first-child { border-top: 0; }
.niveau { font-size: 12px; color: var(--doux); }
details { border-top: 1px solid var(--ligne); padding: 6px 0; }
details:first-of-type { border-top: 0; }
summary { cursor: pointer; font-weight: 600; min-height: 32px; display: flex; align-items: center; gap: 8px; }
details > ul { padding-left: 12px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 4px; }
th, td { text-align: left; padding: 4px 6px; border-top: 1px solid var(--ligne); }
td:nth-child(n+2), th:nth-child(n+2) { text-align: right; white-space: nowrap; }
td:first-child { overflow-wrap: anywhere; }
.bouton { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--ligne); background: var(--fond); color: var(--texte); font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; }
.bouton.danger { background: var(--rouge); border-color: var(--rouge); color: #fff; }
@media (prefers-color-scheme: dark) { .bouton.danger { color: #1b0f0e; } }
.confirmation { border: 2px solid var(--rouge); background: var(--rouge-fond); border-radius: 8px; padding: 10px 12px; }
.confirmation p { margin: 0 0 8px; }
.supprimer p { margin: 0 0 8px; }
.champ { display: grid; gap: 4px; margin: 0 0 10px; max-width: 360px; }
.champ span { font-size: 14px; color: var(--doux); }
input { font: inherit; font-size: 16px; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--ligne); background: var(--fond); color: var(--texte); min-height: 44px; width: 100%; }
.erreur { background: var(--rouge-fond); color: var(--rouge); border: 1px solid var(--rouge); border-radius: 8px; padding: 10px 12px; font-weight: 600; }
.provisoire { font: 600 26px/1.3 ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: 1px; background: var(--carte); border: 1px dashed var(--ligne); border-radius: 8px; padding: 10px 12px; margin: 8px 0; user-select: all; overflow-wrap: anywhere; }
code { font-family: ui-monospace, Menlo, monospace; }
</style>
</head>
<body>
<header><strong>Watt Now? · administration</strong><span>réseau local seulement · sans mot de passe</span></header>
<main>
${corps}
</main>
</body>
</html>`;
}
