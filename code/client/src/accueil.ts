// Écran d'accueil : connexion ou création du personnage (pseudo + mot de passe, famille).

import { VERSION } from "../../commun/src/version.ts";
import type { ReponseAuth } from "../../commun/src/messages.ts";
import { logo, watty } from "./watty.ts";
import { choisirApparence } from "./apparence-ecran.ts";
import type { Apparence } from "../../commun/src/apparence.ts";
import { FAMILLES, MOT_DE_PASSE_MIN, NOMS_FAMILLES, PSEUDO_MAX, PSEUDO_MIN, type Famille } from "../../commun/src/regles.ts";

export interface Identite {
  jeton: string;
  pseudo: string;
  famille: Famille;
  /** Vrai juste après une création de personnage : on montre alors les écrans d'accueil (une seule fois). */
  nouveau: boolean;
  /** L'apparence enregistrée à la création. */
  apparence?: Apparence;
}

const DESCRIPTIONS: Record<Famille, string> = {
  charbonniers: "Le feu ne trahit pas",
  voltaiques: "Le silence est une arme",
  mecanistes: "Ce qui tourne ne meurt pas",
};

export const COULEURS_FAMILLES: Record<Famille, string> = {
  charbonniers: "var(--charbonniers)",
  voltaiques: "var(--voltaiques)",
  mecanistes: "var(--mecanistes)",
};

type Mode = "connexion" | "creation";

/** Sur téléphone, hors écran d'accueil : comment installer le jeu pour jouer en plein écran. */
function conseilEcranAccueil(): string {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const installe = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (installe || (!ios && !android)) return "";
  const geste = ios
    ? `touche <b>•••</b>, puis <b>Partager</b>, puis <b>« Sur l'écran d'accueil »</b>`
    : `ouvre le menu <b>⋮</b> puis <b>« Ajouter à l'écran d'accueil »</b>`;
  return `<p class="ecran-accueil">📱 Pour jouer en plein écran, ${geste}, et lance le jeu depuis son icône.</p>`;
}

/** Affiche l'accueil et attend une identité valide. */
export function demanderIdentite(conteneur: HTMLElement, messageInitial = ""): Promise<Identite> {
  return new Promise((resolve) => {
    let mode: Mode = "connexion";

    conteneur.innerHTML = `
      <form class="affiche" novalidate>
        <h1 class="avec-logo">${logo(300)}<span class="lecteur">Watt Now?</span></h1>
        <div class="watty-coin" aria-hidden="true">${watty("salut", 120)}</div>
        <p class="slogan">Pourquoi réfléchir quand on peut brancher&nbsp;?</p>
        <div class="onglets" role="tablist">
          <button type="button" role="tab" data-mode="connexion">J'ai un personnage</button>
          <button type="button" role="tab" data-mode="creation">Nouveau personnage</button>
        </div>
        <label for="pseudo">Pseudo</label>
        <input id="pseudo" name="pseudo" type="text" autocomplete="username" autocapitalize="off"
               spellcheck="false" minlength="${PSEUDO_MIN}" maxlength="${PSEUDO_MAX}" required />
        <label for="mdp">Mot de passe</label>
        <input id="mdp" name="mdp" type="password" minlength="${MOT_DE_PASSE_MIN}" required />
        <div class="choix-famille">
          <label>Ta famille</label>
          <div class="familles">
            ${FAMILLES.map(
              (f, i) => `
              <label>
                <input type="radio" name="famille" value="${f}" ${i === 0 ? "checked" : ""} />
                <span class="carte-famille">
                  <span class="pastille" style="background:${COULEURS_FAMILLES[f]}"></span>
                  <strong>${NOMS_FAMILLES[f]}</strong>
                  <span>${DESCRIPTIONS[f]}</span>
                </span>
              </label>`,
            ).join("")}
          </div>
        </div>
        <p class="erreur" role="alert"></p>
        <button class="entrer" type="submit">Entrer</button>
        ${conseilEcranAccueil()}
        <span class="tampon">Vérifié par les Compteurs</span>
        <span class="version-jeu">version ${VERSION}</span>
      </form>`;

    const formulaire = conteneur.querySelector("form")!;
    // L'étape d'apparence s'affiche à la place du formulaire.
    const etape = document.createElement("div");
    etape.className = "etape-apparence";
    etape.hidden = true;
    conteneur.append(etape);
    const pseudo = formulaire.querySelector<HTMLInputElement>("#pseudo")!;
    const mdp = formulaire.querySelector<HTMLInputElement>("#mdp")!;
    const choixFamille = formulaire.querySelector<HTMLElement>(".choix-famille")!;
    const erreur = formulaire.querySelector<HTMLElement>(".erreur")!;
    const bouton = formulaire.querySelector<HTMLButtonElement>(".entrer")!;
    const onglets = [...formulaire.querySelectorAll<HTMLButtonElement>(".onglets button")];

    function changerMode(nouveau: Mode): void {
      mode = nouveau;
      for (const o of onglets) o.setAttribute("aria-selected", String(o.dataset.mode === mode));
      choixFamille.hidden = mode !== "creation";
      mdp.autocomplete = mode === "creation" ? "new-password" : "current-password";
      bouton.textContent = mode === "creation" ? "Suivant : ton apparence" : "Entrer";
      erreur.textContent = "";
    }

    for (const o of onglets) o.addEventListener("click", () => changerMode(o.dataset.mode as Mode));
    changerMode("connexion");
    erreur.textContent = messageInitial;
    conteneur.hidden = false;

    /** L'apparence déjà choisie (si l'on revient en arrière, on la retrouve). */
    let apparence: Apparence | undefined;
    let familleApparence: Famille | null = null;
    const formulaireHtml = formulaire;

    formulaire.addEventListener("submit", async (evenement) => {
      evenement.preventDefault();
      erreur.textContent = "";
      const famille = formulaire.querySelector<HTMLInputElement>('input[name="famille"]:checked')?.value as Famille | undefined;

      bouton.disabled = true;
      try {
        if (mode === "creation") {
          // Le pseudo d'abord : on ne façonne pas son personnage pour rien.
          if (mdp.value.length < MOT_DE_PASSE_MIN) {
            erreur.textContent = `Mot de passe d'au moins ${MOT_DE_PASSE_MIN} caractères.`;
            return;
          }
          const verif = (await (await fetch("/api/pseudo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pseudo: pseudo.value.trim() }) })).json()) as {
            libre: boolean;
            erreur: string;
          };
          if (!verif.libre) {
            erreur.textContent = verif.erreur;
            return;
          }
          // Puis l'apparence (Book 14 §1, étape 3).
          if (familleApparence !== famille) apparence = undefined;
          familleApparence = famille ?? null;
          formulaireHtml.hidden = true;
          const choix = await choisirApparence(etape, famille ?? "charbonniers", apparence);
          etape.innerHTML = "";
          etape.hidden = true;
          formulaireHtml.hidden = false;
          apparence = choix.apparence;
          if ("retour" in choix) return;
        }
        const corps =
          mode === "creation" ? { pseudo: pseudo.value.trim(), motDePasse: mdp.value, famille, apparence } : { pseudo: pseudo.value.trim(), motDePasse: mdp.value };
        const res = await fetch(mode === "creation" ? "/api/inscription" : "/api/connexion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corps),
        });
        const reponse = (await res.json()) as ReponseAuth;
        if (!reponse.ok) {
          erreur.textContent = reponse.erreur;
          return;
        }
        conteneur.hidden = true;
        resolve({
          jeton: reponse.jeton,
          pseudo: reponse.pseudo,
          famille: reponse.famille,
          // Une connexion n'est jamais « nouvelle », même si le serveur (ancien) ne le dit pas.
          nouveau: mode === "creation" && reponse.nouveau !== false,
          apparence: reponse.apparence ?? apparence,
        });
      } catch {
        erreur.textContent = "Le serveur ne répond pas. Réessaie dans un instant.";
      } finally {
        bouton.disabled = false;
      }
    });
  });
}

/** Le module des écrans d'accueil (client/public/intro/, copie de la livraison de la session intro). */
interface ModuleAccueil {
  jouerAccueil(conteneur: HTMLElement, options: { famille: Famille; apparence?: Apparence; base: string }): Promise<void>;
}

/** L'adresse du dossier des écrans d'accueil : servi tel quel (sans compilation), en développement comme en production. */
const BASE_ACCUEIL = "/intro/";

/**
 * Les trois écrans d'accueil (« Ton terrain », « Les lieux lointains », « Le Comptoir »), montrés une seule fois,
 * juste après la création du personnage et avant le chargement du terrain (intro/NOTICE-DEV.md). La promesse se
 * résout au clic sur « Entrer dans le monde ». Si le module ne se charge pas ou plante, on passe directement au
 * terrain : le joueur n'est jamais bloqué.
 */
export async function presenterEcransAccueil(identite: Identite): Promise<void> {
  if (!identite.nouveau) return;
  try {
    // Adresse calculée : Vite ne cherche pas à empaqueter ce module servi tel quel depuis public/.
    const adresse = `${BASE_ACCUEIL}src/intro.js`;
    const module = (await import(/* @vite-ignore */ adresse)) as ModuleAccueil;
    await module.jouerAccueil(document.body, { famille: identite.famille, apparence: identite.apparence, base: BASE_ACCUEIL });
  } catch (erreur) {
    console.warn("Écrans d'accueil indisponibles : on entre directement dans le monde.", erreur);
    // Un calque à moitié construit ne doit pas cacher le jeu.
    for (const reste of document.querySelectorAll(".wi-racine")) reste.remove();
  }
}
