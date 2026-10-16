// La connexion à la page d'administration en production (décision du porteur du 2026-10-16) : la page est exposée sur
// Internet (https://jeu.example.org/admin), elle demande donc un identifiant, un mot de passe et le code à usage
// unique de l'application d'authentification (totp.ts). Sur le Pi (préprod), rien ne change : la page reste ouverte
// sur le réseau local, sans connexion (0.8.1).
//
// - Une session est un jeton aléatoire, gardé en mémoire seulement (un redémarrage du jeu déconnecte) et envoyé dans
//   un cookie HttpOnly, Secure, SameSite=Strict, limité au chemin de la page.
// - Elle expire après 30 minutes sans rien faire, et au plus tard 8 heures après la connexion.
// - Après 5 échecs depuis une même adresse en 15 minutes, cette adresse est bloquée jusqu'à la fin de la fenêtre ;
//   au-delà de 20 échecs en tout (plusieurs adresses), tout le monde l'est : un essai en masse ne passe pas.
// - Un code déjà accepté ne sert pas deux fois.

import type { IncomingMessage } from "node:http";
import type { Base } from "./base.ts";
import { Limiteur } from "./limiteur.ts";
import { nouveauJeton } from "./motdepasse.ts";
import { verifierTotp } from "./totp.ts";

export const NOM_COOKIE = "watt_admin";
export const INACTIVITE_MAX = 30 * 60 * 1000;
export const DUREE_MAX = 8 * 3600 * 1000;
const FENETRE_ECHECS = 15 * 60 * 1000;
export const ECHECS_PAR_ADRESSE = 5;
export const ECHECS_EN_TOUT = 20;

export type ResultatConnexion = { ok: true; jeton: string } | { ok: false; raison: "bloque" | "refuse" | "sans-compte" };

interface Session {
  debut: number;
  derniere: number;
}

export class GardienAdmin {
  private readonly base: Base;
  private readonly horloge: () => number;
  private readonly sessions = new Map<string, Session>();
  private readonly echecsParAdresse = new Limiteur(ECHECS_PAR_ADRESSE, FENETRE_ECHECS);
  private readonly echecsEnTout = new Limiteur(ECHECS_EN_TOUT, FENETRE_ECHECS);
  /** Le dernier pas de code accepté : on ne rejoue pas un code. */
  private dernierPas = -1;

  constructor(base: Base, horloge: () => number = Date.now) {
    this.base = base;
    this.horloge = horloge;
  }

  /** Le compte existe-t-il ? (Sinon la page dit comment le créer.) */
  compteCree(): boolean {
    return this.base.identifiantAdminWeb() !== null;
  }

  connecter(adresse: string, identifiant: string, motDePasse: string, code: string): ResultatConnexion {
    const instant = this.horloge();
    if (!this.compteCree()) return { ok: false, raison: "sans-compte" };
    if (!this.echecsParAdresse.autorise(adresse, instant) || !this.echecsEnTout.autorise("tout", instant)) return { ok: false, raison: "bloque" };
    const compte = this.base.verifierAdminWeb(identifiant.trim(), motDePasse);
    const pas = compte ? verifierTotp(compte.secretTotp, code, instant, this.dernierPas) : null;
    if (pas === null) {
      this.echecsParAdresse.compter(adresse, instant);
      this.echecsEnTout.compter("tout", instant);
      return { ok: false, raison: "refuse" };
    }
    this.dernierPas = pas;
    const jeton = nouveauJeton();
    this.sessions.set(jeton, { debut: instant, derniere: instant });
    return { ok: true, jeton };
  }

  /** La session de ce jeton est-elle valable ? Si oui, elle est prolongée (l'inactivité repart de zéro). */
  valide(jeton: string | undefined): boolean {
    if (!jeton) return false;
    const s = this.sessions.get(jeton);
    if (!s) return false;
    const instant = this.horloge();
    if (instant - s.derniere > INACTIVITE_MAX || instant - s.debut > DUREE_MAX) {
      this.sessions.delete(jeton);
      return false;
    }
    s.derniere = instant;
    return true;
  }

  deconnecter(jeton: string | undefined): void {
    if (jeton) this.sessions.delete(jeton);
  }
}

/** Le jeton de session envoyé par le navigateur, s'il y en a un. */
export function jetonDe(req: IncomingMessage): string | undefined {
  for (const morceau of String(req.headers.cookie ?? "").split(";")) {
    const [nom, ...reste] = morceau.trim().split("=");
    if (nom === NOM_COOKIE) return reste.join("=");
  }
  return undefined;
}

/** L'en-tête qui pose le cookie de session (ou l'efface, sans jeton). `securise` : seulement en HTTPS (la production). */
export function cookieSession(jeton: string | null, chemin: string, securise: boolean): string {
  const valeur = jeton ?? "";
  const duree = jeton ? Math.floor(DUREE_MAX / 1000) : 0;
  return `${NOM_COOKIE}=${valeur}; Path=${chemin || "/"}; Max-Age=${duree}; HttpOnly; SameSite=Strict${securise ? "; Secure" : ""}`;
}
