// L'affichage tête haute (Book 18 §3) : identité et jauges en haut à gauche, heure et mesures en haut à droite,
// sous elles les raccourcis Sac et Fabriquer (on s'en sert moins souvent), invite d'action en bas,
// barre de progression, messages, et les boutons tactiles près du pouce (Book 08 §3.4).

import { VERSION } from "../../commun/src/version.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import { ceQuiManque } from "../../commun/src/aide-fabrication.ts";
import { ACTIONS, RESERVEES, assigner, avecTouches, nomDe, nomTouche, retablir, surChangement, type Action } from "./touches.ts";
import { PanneauAide } from "./aide.ts";
import { CAPACITES, type Charges } from "../../commun/src/energie.ts";
import { ARMES, MATIERE_ARME, NOMS_BLESSURES, PLAFOND_FORTUNE, RESISTANCE_TORSE, SEUIL_ABIMEE, caracteristiquesArme, estArme, etatArme } from "../../commun/src/combat.ts";
import type { EchangeVu, FeuVu, InstallationVue, OffreEchange, OperationComptoir, OperationEchange, Personne, RapportBase, SanteVue, Verbe, VueComptoir, WottsVus } from "../../commun/src/messages.ts";
import {
  ACCESSOIRES_FEU,
  COMBLER,
  CREUSER,
  VOIE_CREUSEE,
  VOIE_SURFACE,
  capaciteCoffre,
  choisirCout,
  contenanceRecuperateur,
  coutPour,
  effetsFeu,
  etapeFeu,
  etapeInstallation,
  etapeSuivanteFeu,
  etapeSuivanteInstallation,
  formeFeu,
  lignee,
  niveauInstallation,
  type AccessoireFeu,
  type Etape,
} from "../../commun/src/lignees.ts";
import { PRIX_RETRAIT, formaterWotts, prixVente } from "../../commun/src/economie.ts";
import { detailEnergieGrise } from "../../commun/src/recettes.ts";
import type { TypeBatterie } from "../../commun/src/energie.ts";
import type { Inventaire, TypeObjet } from "../../commun/src/objets.ts";
import { OBJETS, capaciteDe, nomContenant, nommer, poidsInventaire } from "../../commun/src/objets.ts";
import {
  CATEGORIES_RECETTES,
  NOMS_INSTALLATIONS,
  NOMS_QUALITES,
  dureeReelle,
  energieGrise,
  energieGriseRecette,
  ingredientsPresents,
  multiplicateurQualites,
  niveauQualite,
  recettesConnues,
  type CategorieRecette,
  type Qualite,
  type Recette,
} from "../../commun/src/recettes.ts";
import { NOMS_FAMILLES, type Famille } from "../../commun/src/regles.ts";
import { RECETTE_DAKOTA, RECETTE_FEU, RESERVE_EAU_MAX, RESERVE_KCAL_MAX, aFaim, aSoif, fatigue, type Besoins, type Gourde } from "../../commun/src/survie.ts";
import { NOMS_TEMPS, type Temps } from "../../commun/src/meteo.ts";
import type { VueTutoriel } from "../../commun/src/tutoriel.ts";
import type { VueQuetes } from "../../commun/src/quetes.ts";
import { formaterHeure } from "../../commun/src/temps.ts";
import { COULEURS_FAMILLES } from "./accueil.ts";
import { ecrire, lire } from "./stockage.ts";
import type { Commande } from "./entrees.ts";
import { icone, type Pictogramme } from "./icones.ts";
import { EXAMENS_INSTALLATIONS, type Propositions } from "./interaction.ts";
import { ORDRE_NIVEAUX, changerQualite, type NiveauQualite } from "./rendu/qualite.ts";
import { COMPOSANTS, DEMONTAGE, NOMS_FAMILLES_VESTIGES, VESTIGES, type FamilleVestige } from "../../commun/src/vestiges.ts";

/** Ordre d'affichage dans le sac : à boire et à manger, matériaux, pièces, outils, lumières. */
const ORDRE_SAC: TypeObjet[] = [
  "gourde", "pot_au_feu", "soupe_cepes", "volaille_cepes", "cepes_poeles", "pommes_cuites", "volaille_cuite", "volaille_crue", "conserve", "baies", "pomme", "poire", "prunes", "cerises", "noix", "cepe", "amanite_tue_mouches", "amanite_phalloide", "buche", "branche", "pierre",
  "fibres", "bache", "ressort_lames", "barre_metal", "tete_hache", "cadre_velo", "chaine_velo", "roue_velo", "dynamo_velo", "batterie_voiture",
  "hache", "couteau", "marteau", "scie", "cle_plate", "tournevis", "briquet", "pierre_a_feu", "corde", "petite_batterie",
  "torche", "lampe_frontale", "lanterne", "lampe_dynamo", "sac_a_dos",
  // Vestiges, lot 1 (0.3) : les composants, puis le bric-à-brac rangé par famille (cuisine, salle de bain…).
  ...(Object.keys(COMPOSANTS) as TypeObjet[]),
  ...(["cuisine", "salle_de_bain", "salon", "gadget", "garage", "voiture", "ferme"] as FamilleVestige[]).flatMap((f) =>
    (Object.keys(VESTIGES) as (keyof typeof VESTIGES)[]).filter((t) => VESTIGES[t].famille === f),
  ),
];

/** Le tri du sac : par sorte (l'ordre ci-dessus) ou par poids (le plus lourd d'abord, pour choisir quoi laisser). */
type TriSac = "sorte" | "poids";

function lireTriSac(): TriSac {
  try {
    return localStorage.getItem("watt.tri-sac") === "poids" ? "poids" : "sorte";
  } catch {
    return "sorte";
  }
}

export interface ActionsJoueur {
  manger(objet: TypeObjet): void;
  boire(): void;
  lumiere(): void;
  /** `dakota` : un foyer Dakota, creusé dans le sol (P-002). */
  construireFeu(dakota?: boolean): void;
  fabriquer(recette: Recette): void;
  panser(): void;
  comptoir(op: OperationComptoir): void;
  echange(op: OperationEchange): void;
  passerTutoriel(): void;
  /** Jeter un objet par terre (quand le sac est trop lourd). */
  jeter(objet: TypeObjet, quantite: number): void;
  /** Démonter un vestige en composants (Vestiges, lot 1). */
  demonter(objet: TypeObjet): void;
  /** Équiper une arme pour le mode Combat (null : la meilleure du sac) (P-005). */
  equiper(objet: TypeObjet | null): void;
  /** Réparer une arme (Book 23 §4.3) : de fortune, ou pour de bon à l'atelier. */
  reparer(objet: TypeObjet, fortune: boolean): void;
  /** Ranger dans le coffre, ou en sortir. */
  coffre(id: number, sens: "deposer" | "prendre", objet: TypeObjet, quantite: number): void;
  /** Un geste sur un feu ou une installation, depuis sa fiche (Book 24 : améliorer, démonter, creuser…). */
  amenager(genre: "feu" | "installation", id: number, verbe: Verbe): void;
}

/** Le feu de camp, vu comme une recette, pour dire ce qui manque. */
const RECETTE_FEU_AIDE: Recette = { id: "feu", categorie: "feu", nom: "Feu de camp", produit: { objet: "branche", quantite: 0 }, ingredients: RECETTE_FEU, qualites: {}, duree: 0, intensite: "legere", famille: "tous" };
/** Le foyer Dakota (P-002), vu comme une recette, pour dire ce qui manque. */
const RECETTE_DAKOTA_AIDE: Recette = { id: "dakota", categorie: "feu", nom: "Foyer Dakota", produit: { objet: "branche", quantite: 0 }, ingredients: RECETTE_DAKOTA, qualites: { creuser: 1 }, duree: 0, intensite: "legere", famille: "tous" };

type NomJauge = "faim" | "eau" | "sommeil" | "sante" | "endurance";

type OngletComptoir = "vendre" | "acheter" | "energie" | "compte";

function kg(valeur: number): string {
  return valeur.toFixed(2).replace(".", ",").replace(/,?0+$/, "");
}

/** Les infos techniques (images/s, latence, version) affichées ou non. */
const CLE_INFOS = "watt.infos";
const CLE_ONGLET_FABRICATION = "watt.fabrication.onglet";

function lireOngletFabrication(): CategorieRecette | "tout" {
  const v = lire(CLE_ONGLET_FABRICATION);
  return v && CATEGORIES_RECETTES.some((c) => c.id === v) ? (v as CategorieRecette) : "tout";
}

/** Le choix du joueur pour le carnet (ouvert ou fermé), s'il en a fait un. */
function lireChoixCarnet(): boolean | null {
  try {
    const v = localStorage.getItem("watt.carnet");
    if (v) return v === "ouvert";
  } catch {
    // Pas de stockage : pas de choix gardé.
  }
  return null;
}

/** Le carnet ouvert ou fermé : le choix du joueur s'il en a fait un ; sinon fermé (l'icône 📓 suffit). */
function lireCarnetOuvert(): boolean {
  return lireChoixCarnet() ?? false;
}

/** L'importance d'un message : quand la pile est pleine, le moins important part en premier. */
const RANG_MESSAGE = { indice: 0, "": 1, aide: 2, lecon: 3 } as const;

/** Le type de dégât, en une phrase (Book 23 §4.2). */
const TYPES_DEGATS = {
  contondant: "Contondant : il passe les casques et étourdit plus longtemps.",
  tranchant: "Tranchant : un casque l'arrête à la tête.",
  percant: "Perçant : sa force, c'est l'allonge.",
} as const;
/** Où remettre une arme à neuf (Book 23 §4.3). */
const ATELIERS_REPARATION_NOMS = { bois: "à l'établi", lame: "à la meule", metal: "à la forge" } as const;

export class Hud {
  /** Réassigner une touche : le jeu attend la prochaine touche frappée (null : annulé). */
  surAttendreTouche: ((f: (code: string | null) => void) => void) | null = null;
  private tactile = false;
  /** Un panneau s'ouvre (true) ou se ferme (false) : pour le son de l'interface. */
  surPanneau: ((ouvert: boolean) => void) | null = null;
  /** Le panneau d'aide (menu ⚙ → Aide). */
  readonly aide: PanneauAide;
  /** Le choix de l'emplacement d'une construction : les trois boutons du bandeau (pour le doigt comme pour la souris). */
  surPose: ((choix: "tourner" | "annuler" | "poser") => void) | null = null;
  private nomPose = "";

  /** Le bandeau du choix de l'emplacement (2026-10-08). */
  afficherPose(nom: string): void {
    this.nomPose = nom;
    const el = this.element.querySelector<HTMLElement>(".pose")!;
    el.hidden = false;
    if (!el.dataset.cable) {
      el.dataset.cable = "1";
      for (const b of el.querySelectorAll<HTMLButtonElement>("[data-pose]")) {
        b.addEventListener("click", () => this.surPose?.(b.dataset.pose as "tourner" | "annuler" | "poser"));
      }
    }
    this.majPose(null);
  }

  /** `raison` : pourquoi on ne peut pas construire là (null : on peut). */
  majPose(raison: string | null): void {
    const el = this.element.querySelector<HTMLElement>(".pose")!;
    if (el.hidden) return;
    const aide = this.tactile
      ? "Touche le sol pour l'y placer, ou pousse-le au joystick. Touche-le encore pour construire."
      : avecTouches("Clique au sol pour le placer, reclique dessus (ou {agir}) pour construire · flèches ou ZQSD : l'ajuster · molette ou {lumiere} : tourner · clic droit ou Échap : annuler.", false);
    const texte = `<b>${this.nomPose}</b> · ${raison ? `<span class="non">${raison}</span>` : "On peut construire ici."}<br><small>${aide}</small>`;
    const p = el.querySelector<HTMLElement>(".texte-pose")!;
    if (p.innerHTML !== texte) p.innerHTML = texte;
    el.querySelector<HTMLButtonElement>(".poser")!.disabled = raison !== null;
  }

  masquerPose(): void {
    this.element.querySelector<HTMLElement>(".pose")!.hidden = true;
  }
  /** Le joueur est-il à son abri (pour le conseil du dialogue de départ) ? Branché par le jeu. */
  aLAbri: (() => boolean) | null = null;
  private infosTechniques = false;
  /** Le bouton « Son » : coupe ou remet le son, renvoie true si le son est actif. */
  surSon: (() => boolean) | null = null;
  private readonly element: HTMLElement;
  private readonly ips: HTMLElement;
  private readonly latence: HTMLElement;
  private readonly horloge: HTMLElement;
  private readonly faim: HTMLElement;
  private readonly eau: HTMLElement;
  private readonly invite: HTMLElement;
  private readonly progression: HTMLElement;
  private readonly messages: HTMLElement;
  private readonly sac: HTMLElement;
  private readonly fabrication: HTMLElement;
  private readonly boutonA: HTMLButtonElement | null;
  private readonly boutonB: HTMLButtonElement | null;
  private readonly sante: HTMLElement;
  private readonly sommeilJauge: HTMLElement;
  private dernierTemps = "";
  private readonly endurance: HTMLElement;
  private readonly blessures: HTMLElement;
  private derniereSante = "";
  private readonly guichet: HTMLElement;
  private vueComptoir: VueComptoir | null = null;
  private wotts: WottsVus = { poche: 0, compte: 0 };
  private onglet: OngletComptoir = "vendre";
  private dernierGuichet = "";
  private echange: EchangeVu | null = null;
  /** Mon offre telle que je la compose (envoyée au serveur, qui la renvoie). */
  private monOffre: OffreEchange = { objets: {}, wotts: 0 };
  private envoiOffre = 0;
  private dernierEchange = "";
  private dernierMode = "";
  private images = 0;
  private depuis = performance.now();
  private derniereInvite = "";
  private finAction = 0;
  private dureeAction = 0;
  private dernierSac = "";
  private derniereFabrication = "";
  private selection: TypeObjet | null = null;
  private triSac: TriSac = lireTriSac();
  private inventaire: Inventaire = {};
  private gourde: Gourde = { contenu: "potable", litres: 0 };
  private lumiereAllumee = false;
  private charges: Charges = {};
  private famille: Famille = "charbonniers";
  private readonly actions: ActionsJoueur;

  constructor(
    element: HTMLElement,
    niveau: NiveauQualite,
    tactile: boolean,
    quitter: () => void,
    actions: ActionsJoueur,
    commande: (c: Commande) => void,
    boutonA: { appuyer(): void; relacher(): void },
  ) {
    this.element = element;
    this.actions = actions;
    element.innerHTML = `
      <div class="bandeau">
      <div class="bloc identite">
        <div class="nom"><span class="pastille"></span><span class="texte"></span></div>
        <div class="jauge faim" title="Faim : touche pour comprendre" role="button" tabindex="0" data-jauge="faim"><span class="icone">🍞</span><span class="barre"><span></span></span></div>
        <div class="jauge eau" title="Eau : touche pour comprendre" role="button" tabindex="0" data-jauge="eau"><span class="icone">💧</span><span class="barre"><span></span></span></div>
        <div class="jauge sommeil" title="Sommeil : touche pour comprendre" role="button" tabindex="0" data-jauge="sommeil"><span class="icone">🌙</span><span class="barre"><span></span></span></div>
        <div class="jauge sante" title="Santé : touche pour comprendre" role="button" tabindex="0" data-jauge="sante"><span class="icone">❤️</span><span class="barre"><span></span></span></div>
        <div class="jauge endurance" title="Endurance : touche pour comprendre" role="button" tabindex="0" data-jauge="endurance"><span class="icone">💨</span><span class="barre"><span></span></span></div>
        <div class="blessures" hidden></div>
        <div class="explication-jauge" hidden role="note"></div>
      </div>
      <div class="etat">
        <div class="boutons">
          <button type="button" class="partir" aria-label="Partir" title="Partir">🚪</button>
          <button type="button" class="options" aria-label="Options" aria-expanded="false" aria-haspopup="true" title="Options">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4L10.7 6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>
          </button>
          <div class="menu-options" hidden role="menu">
            <button type="button" class="r-aide" role="menuitem">❓ Aide</button>
            ${tactile ? "" : `<button type="button" class="r-commandes" role="menuitem">Commandes</button>`}
            <button type="button" class="son" role="menuitem" aria-pressed="true">Son : oui</button>
            <button type="button" class="qualite" role="menuitem">Qualité : ${niveau}</button>
            <button type="button" class="infos" role="menuitem" aria-pressed="false">Infos techniques : non</button>
          </div>
        </div>
        <div class="ligne-haut"><span class="meteo" hidden>☀️</span><span class="latence-alerte" hidden title="Connexion lente">📶</span><span class="horloge">–</span><span class="sep"> · </span><span class="wotts" title="Tes bons de wotts (ils se déchargent d'≈ 2 % par semaine)">⚡ <span>0 wott</span></span></div>
        <div class="mesures" hidden>v${VERSION} · <span class="ips">–</span> img/s · <span class="latence">–</span> ms</div>
      </div>
      <div class="raccourcis">
        <button type="button" class="b-carnet" hidden aria-label="Carnet (J)" title="Carnet (J)" aria-expanded="false"><svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4 h16 a2 2 0 0 1 2 2 v20 a2 2 0 0 1 -2 2 h-16 Z" fill="#a4552f" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/><path d="M8 4 v24" stroke="#3b2a1e" stroke-width="3"/><rect x="12" y="9" width="10" height="6" rx="1" fill="#ecdfbf" stroke="#3b2a1e" stroke-width="1.2"/><path d="M13 19 h8 M13 22 h6" stroke="#ecdfbf" stroke-width="1.4" stroke-linecap="round"/><path d="M22 4 v8 l2 -1.5 l2 1.5 v-8" fill="#c8362b" stroke="#3b2a1e" stroke-width="1"/></svg><span>Carnet</span><span class="etape-carnet"></span><span class="pastille-carnet" hidden></span></button>
        <button type="button" class="r-sac" title="Sac (I)" aria-label="Sac">${icone("sac_a_dos", 30)}<span>Sac</span></button>
        <button type="button" class="r-fabriquer" title="Fabriquer (B)" aria-label="Fabriquer">${icone("marteau", 30)}<span>Fabriquer</span></button>
        <button type="button" class="r-carte" title="Carte (M)" aria-label="Carte"><svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 8 L11 5 L21 8 L28 5 V24 L21 27 L11 24 L4 27 Z" fill="#ecdfbf" stroke="#3b2a1e" stroke-width="2" stroke-linejoin="round"/><path d="M11 5 V24 M21 8 V27" stroke="#3b2a1e" stroke-width="1.5"/><path d="M7 19 C10 15 14 18 17 13 S23 12 25 9" fill="none" stroke="#c8362b" stroke-width="1.8" stroke-dasharray="2 2"/></svg><span>Carte</span></button>
        <button type="button" class="r-tourner" title="Tourner la vue (V)" aria-label="Tourner la vue"><svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path d="M25 12a10 10 0 1 0 1 8" fill="none" stroke="#1c2333" stroke-width="3" stroke-linecap="round"/><path d="M27 5v8h-8" fill="none" stroke="#c8362b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Vue</span></button>
      </div>
      </div>
      <div class="depart" hidden role="alertdialog" aria-modal="true" aria-labelledby="titre-depart">
        <div class="carte-depart">
          <h2 id="titre-depart">Partir pour aujourd'hui ?</h2>
          <p class="texte-depart"></p>
          <div class="boutons-depart">
            <button type="button" class="rester">Rester</button>
            <button type="button" class="confirmer-depart">Partir quand même</button>
          </div>
        </div>
      </div>
      <div class="messages" aria-live="polite"></div>
      <div class="gains" aria-live="polite"></div>
      <div class="progression" hidden><span class="ligne-progression"><span class="libelle"></span><span class="pourcent"></span></span><span class="arreter"></span></div>
      <div class="invite" hidden></div>
      <div class="mode-clavier" hidden><kbd></kbd> <span>Exploration</span></div>
      <div class="saisie" hidden><strong>Saisi !</strong><span class="texte-saisie"></span><span class="barre"><span></span></span></div>
      <div class="flash" aria-hidden="true"></div>
      <div class="halo" aria-hidden="true"></div>
      <div class="rapport" hidden role="dialog" aria-label="Pendant ton absence"></div>
      <div class="carnet" hidden></div>
      <div class="pose" hidden role="dialog" aria-label="Choisir l'emplacement">
        <p class="texte-pose"></p>
        <div class="boutons-pose">
          <button type="button" data-pose="tourner">Tourner</button>
          <button type="button" data-pose="annuler">Annuler</button>
          <button type="button" data-pose="poser" class="poser">Construire ici</button>
        </div>
      </div>
      <div class="dodo" hidden><p>Tu dors…</p><span class="barre"><span></span></span><small>Bouge pour te réveiller</small></div>
      <div class="effondrement" hidden><p class="titre">Tu t'effondres…</p><p class="suite">Des inconnus t'ont ramené chez toi. Ton sac est resté là où tu es tombé.</p></div>
      <div class="panneau sac" hidden role="dialog" aria-label="Sac"></div>
      <div class="panneau fabrication" hidden role="dialog" aria-label="Fabriquer"></div>
      <div class="panneau comptoir" hidden role="dialog" aria-label="Guichet des Compteurs"></div>
      <div class="panneau echange" hidden role="dialog" aria-label="Échange"></div>
      <div class="panneau coffre" hidden role="dialog" aria-label="Coffre"></div>
      <div class="panneau fiche" hidden role="dialog" aria-label="Fiche"></div>
      <div class="demande-echange" hidden role="alertdialog"></div>
      ${
        tactile
          ? `<div class="tactile">
              <button type="button" class="b-mode" aria-label="Mode">Explorer</button>
              <button type="button" class="b-lumiere">Lumière</button>
              <button type="button" class="b-tourner" aria-label="Tourner la vue">⟳</button>
              <button type="button" class="b-B" disabled>B</button>
              <button type="button" class="b-A" disabled>A</button>
            </div>`
          : // L'aide-mémoire des touches : seulement pendant le tutoriel ; ensuite, le bouton « Commandes ».
            `<div class="bloc aide" hidden></div><div class="panneau commandes" hidden role="dialog" aria-label="Commandes"></div>`
      }`;
    const q = <T extends HTMLElement>(s: string) => element.querySelector<T>(s)!;
    this.ips = q(".ips");
    this.latence = q(".latence");
    this.horloge = q(".horloge");
    this.faim = q(".jauge.faim");
    this.eau = q(".jauge.eau");
    this.invite = q(".invite");
    this.progression = q(".progression");
    this.messages = q(".messages");
    this.sac = q(".panneau.sac");
    this.fabrication = q(".panneau.fabrication");
    this.guichet = q(".panneau.comptoir");
    this.boutonA = element.querySelector(".b-A");
    this.boutonB = element.querySelector(".b-B");
    this.sante = q(".jauge.sante");
    this.sommeilJauge = q(".jauge.sommeil");
    this.endurance = q(".jauge.endurance");
    this.blessures = q(".blessures");
    // Un appui sur une jauge explique à quoi elle sert et comment la remonter ; un second appui la referme.
    for (const j of element.querySelectorAll<HTMLElement>("[data-jauge]")) {
      const basculer = () => {
        this.jaugeOuverte = this.jaugeOuverte === j.dataset.jauge ? null : (j.dataset.jauge as NomJauge);
        this.expliquerJauge();
      };
      j.addEventListener("click", basculer);
      j.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          basculer();
        }
      });
    }
    this.blessures.addEventListener("pointerdown", (e) => {
      if ((e.target as HTMLElement).closest("[data-action='panser']")) {
        e.preventDefault();
        this.actions.panser();
      }
    });

    // Les options, derrière la roue dentée (2026-10-08) : on l'ouvre, on la ferme, un clic ailleurs la ferme.
    const menu = q<HTMLDivElement>(".menu-options");
    const roue = q(".options");
    const ouvrirMenu = (oui: boolean) => {
      menu.hidden = !oui;
      roue.setAttribute("aria-expanded", String(oui));
    };
    roue.addEventListener("click", (e) => {
      e.stopPropagation();
      ouvrirMenu(menu.hidden !== false);
    });
    document.addEventListener("pointerdown", (e) => {
      if (!menu.hidden && !(e.target as HTMLElement).closest(".menu-options, .options")) ouvrirMenu(false);
    });
    for (const b of menu.querySelectorAll<HTMLButtonElement>(".r-commandes")) b.addEventListener("click", () => ouvrirMenu(false));
    // L'aide du jeu : tous les mécanismes, sans les secrets (2026-10-08).
    this.aide = new PanneauAide(element, tactile);
    this.aide.surBascule = (ouvert) => this.surPanneau?.(ouvert);
    q(".r-aide").addEventListener("click", () => {
      ouvrirMenu(false);
      this.fermerPanneaux();
      this.aide.ouvrir();
    });
    q(".qualite").addEventListener("click", () => {
      changerQualite(ORDRE_NIVEAUX[(ORDRE_NIVEAUX.indexOf(niveau) + 1) % ORDRE_NIVEAUX.length]!);
    });
    // Infos techniques (images/s, latence, version) : cachées d'office, gardées dans le navigateur.
    const infos = q<HTMLButtonElement>(".infos");
    const montrerInfos = (oui: boolean) => {
      q(".mesures").hidden = !oui;
      infos.textContent = `Infos techniques : ${oui ? "oui" : "non"}`;
      infos.setAttribute("aria-pressed", String(oui));
      this.infosTechniques = oui;
    };
    montrerInfos(lire(CLE_INFOS) === "oui");
    infos.addEventListener("click", () => {
      montrerInfos(!this.infosTechniques);
      ecrire(CLE_INFOS, this.infosTechniques ? "oui" : "non");
    });
    // Partir : un geste de jeu, pas un réglage. Un dialogue rappelle de dormir à l'abri (spécification de Sally).
    const depart = q<HTMLDivElement>(".depart");
    const fermerDepart = () => {
      depart.hidden = true;
    };
    q(".partir").addEventListener("click", () => {
      ouvrirMenu(false);
      const aLAbri = this.aLAbri?.() ?? false;
      q(".texte-depart").textContent = aLAbri
        ? "Tu es à ton abri : tu vas dormir ici. Si tu reviens dans plus de 8 minutes, tu te réveilleras reposé, comme après une nuit complète. Ta faim et ta soif sont gelées pendant ton absence."
        : "Conseil : va dormir dans ton abri avant de partir. Se déconnecter dans son abri compte comme une nuit complète. Ta faim, ta soif et ta fatigue sont gelées pendant ton absence.";
      q(".confirmer-depart").textContent = aLAbri ? "Partir" : "Partir quand même";
      depart.hidden = false;
      q<HTMLButtonElement>(".rester").focus();
    });
    q(".rester").addEventListener("click", fermerDepart);
    q(".confirmer-depart").addEventListener("click", () => {
      fermerDepart();
      quitter();
    });
    depart.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fermerDepart();
    });
    depart.addEventListener("pointerdown", (e) => {
      if (e.target === depart) fermerDepart();
    });
    // Le carnet : l'icône 📓 ouvre et ferme le panneau.
    q(".b-carnet").addEventListener("click", () => this.basculerCarnet());
    // La hauteur du bandeau, pour placer messages et panneaux juste dessous (sans jamais le chevaucher).
    const bandeau = q(".bandeau");
    // Et le bas de la rangée de tuiles : en téléphone horizontal, les messages se logent juste dessous, au centre (Sally).
    const raccourcis = q(".raccourcis");
    new ResizeObserver(() => {
      element.style.setProperty("--haut-bandeau", `${Math.ceil(bandeau.getBoundingClientRect().bottom)}px`);
      element.style.setProperty("--bas-raccourcis", `${Math.ceil(raccourcis.getBoundingClientRect().bottom)}px`);
    }).observe(bandeau);
    this.tactile = tactile;
    if (!tactile) {
      q(".r-commandes").addEventListener("click", () => this.basculerCommandes());
      surChangement(() => this.majTouches());
    }
    this.majTouches();
    q(".son").addEventListener("click", () => {
      if (this.surSon) this.majSon(this.surSon());
    });
    // Sur iPhone, `pointerdown` répond plus vite que `click`.
    const lier = (classe: string, c: Commande) =>
      q(classe).addEventListener("pointerdown", (e) => {
        e.preventDefault();
        commande(c);
      });
    lier(".r-sac", "sac");
    lier(".r-fabriquer", "fabriquer");
    lier(".r-tourner", "tourner+");
    lier(".r-carte", "carte");
    if (tactile) {
      // A se juge au relâchement en combat (appui court, ou maintenu pour viser la tête).
      const a = q(".b-A");
      a.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        a.setPointerCapture(e.pointerId);
        boutonA.appuyer();
      });
      a.addEventListener("pointerup", () => boutonA.relacher());
      a.addEventListener("pointercancel", () => boutonA.relacher());
      lier(".b-mode", "mode");
      lier(".b-B", "B");
      lier(".b-lumiere", "lumiere");
      lier(".b-tourner", "tourner+");
    }
  }

  identite(pseudo: string, famille: Famille): void {
    this.famille = famille;
    // L'habillage de la famille (Book 18 §3) : plaques rivetées, terminal ambre, carnet du bricoleur.
    this.element.classList.remove("habit-charbonniers", "habit-voltaiques", "habit-mecanistes");
    this.element.classList.add(`habit-${famille}`);
    this.element.querySelector<HTMLElement>(".pastille")!.style.background = COULEURS_FAMILLES[famille];
    this.element.querySelector(".nom .texte")!.textContent = `${pseudo} · ${NOMS_FAMILLES[famille]}`;
    this.element.hidden = false;
  }

  // ---------- États reçus du serveur ----------

  majBesoins(besoins: Besoins, gourde: Gourde): void {
    this.gourde = gourde;
    const regler = (jauge: HTMLElement, part: number, manque: boolean) => {
      jauge.querySelector<HTMLElement>(".barre > span")!.style.width = `${Math.round(Math.max(0, Math.min(1, part)) * 100)}%`;
      jauge.classList.toggle("manque", manque);
    };
    regler(this.faim, besoins.kcal / RESERVE_KCAL_MAX, aFaim(besoins));
    regler(this.eau, besoins.eau / RESERVE_EAU_MAX, aSoif(besoins));
    regler(this.sommeilJauge, besoins.repos ?? 1, fatigue(besoins));
    this.element.querySelector<HTMLElement>(".dodo .barre > span")!.style.width = `${Math.round((besoins.repos ?? 1) * 100)}%`;
    this.besoins = besoins;
    if (this.jaugeOuverte) this.expliquerJauge();
    this.redessiner();
  }

  majInventaire(inventaire: Inventaire): void {
    this.inventaire = inventaire;
    // Le bouton du sac dit ce qu'on porte vraiment : le sac, le sac de fortune, ou ses poches (sac perdu).
    const bouton = this.element.querySelector<HTMLElement>(".r-sac");
    const nom = nomContenant(inventaire);
    if (bouton && bouton.dataset.contenant !== nom) {
      bouton.dataset.contenant = nom;
      bouton.innerHTML = `${icone(nom === "Poches" ? "poches" : nom === "Sac" ? "sac_a_dos" : "sac_fortune", 30)}<span>${nom === "Sac de fortune" ? "Sac" : nom}</span>`;
    }
    this.redessiner();
    if (this.coffre) this.dessinerCoffre();
    this.majFiche();
  }

  majCharges(charges: Charges): void {
    this.charges = charges;
    this.redessiner();
  }

  majLumiere(allumee: boolean): void {
    this.lumiereAllumee = allumee;
    this.redessiner();
  }

  /**
   * L'heure et la date du calendrier (2026-10-08) : c'est la date qui dit la saison des récoltes.
   * Le compte des jours de jeu (24 min chacun) passe dans l'infobulle.
   */
  heure(jour: number, heure: number, date = ""): void {
    this.horloge.textContent = date ? `${date} · ${formaterHeure(heure)}` : `Jour ${jour} · ${formaterHeure(heure)}`;
    this.horloge.title = `Jour de jeu ${jour}. Le calendrier avance d'un jour toutes les 1 h 50 réelles : un an dure 4 semaines.`;
  }

  private redessiner(): void {
    if (!this.sac.hidden) this.dessinerSac();
    if (!this.fabrication.hidden) this.dessinerFabrication();
    if (!this.guichet.hidden) this.dessinerGuichet();
    this.dessinerEchange();
  }

  // ---------- Actions ----------

  /** `tenu` : le geste en cours se fait en tenant A (son libellé, pour le bouton tactile). */
  propositions(p: Propositions, occupe: boolean, tenu: string | null = null): void {
    const texte = occupe
      ? ""
      : // Au clavier, on montre les vraies touches (E ou clic gauche, F ou clic droit).
        [p.A ? `<kbd>${nomDe("agir")}</kbd> ${p.A.libelle}` : "", p.B ? `<kbd>${nomDe("examiner")}</kbd> ${p.B.libelle}` : ""].filter(Boolean).join("<span class='sep'>·</span>");
    const cle = `${occupe}|${tenu}|${p.A?.libelle ?? ""}|${p.B?.libelle ?? ""}|${nomDe("agir")}|${nomDe("examiner")}`;
    if (cle === this.derniereInvite) return;
    this.derniereInvite = cle;
    this.invite.innerHTML = texte;
    this.invite.hidden = texte === "" || this.boutonA !== null;
    if (this.boutonA) {
      // Pendant un geste tenu, on le garde enfoncé (lâcher l'arrête) ; pendant une autre action, A sert à l'arrêter.
      this.boutonA.textContent = occupe ? (tenu ? `${tenu}…` : "Arrêter") : (p.A?.libelle ?? "A");
      this.boutonA.disabled = !p.A && !occupe;
    }
    if (this.boutonB) {
      this.boutonB.textContent = p.B && !occupe ? p.B.libelle : "B";
      this.boutonB.disabled = !p.B || occupe;
    }
  }

  /** `deja` : la part déjà faite d'un geste long repris (0 à 1). */
  debutAction(libelle: string, duree: number, deja = 0): void {
    this.dureeAction = duree * 1000;
    this.finAction = performance.now() + this.dureeAction * (1 - deja);
    this.progression.querySelector(".libelle")!.textContent = libelle;
    // Comment l'arrêter en cours de route.
    this.progression.querySelector(".arreter")!.textContent = this.tactile ? "Touche « Arrêter » pour t'arrêter" : avecTouches("{agir} pour t'arrêter", false);
    this.progression.hidden = false;
  }

  /** Le pourcentage suit l'anneau : on le pose juste dessous (coordonnées de l'écran, en pixels). */
  placerProgression(x: number, y: number): void {
    this.progression.style.left = `${Math.round(x)}px`;
    this.progression.style.top = `${Math.round(y + 26)}px`;
  }

  masquerProgression(): void {
    this.progression.hidden = true;
  }

  /**
   * L'énergie grise en clair (Book 01 §6, affichage validé le 2026-10-07) : le « wott » est la monnaie ;
   * on montre d'abord la valeur, puis ce qu'il a fallu physiquement pour obtenir l'objet.
   */
  private texteEnergieGrise(type: TypeObjet): string {
    const e = detailEnergieGrise(type);
    if (e.nature === "collecte") return `Énergie grise : le travail de la cueillette, ≈ ${formaterWotts(e.total)}.`;
    if (e.nature === "vestige") return "Énergie grise : un vestige de l'Abondance. Il vaut ce qu'il coûterait à refaire aujourd'hui.";
    const minutes = Math.round(e.minutes ?? 0);
    return `Énergie grise : matières ≈ ${formaterWotts(e.matieres ?? 0)} · travail ${minutes} min de jeu, ${Math.round(e.kcal ?? 0)} kcal ≈ ${formaterWotts(e.travail ?? 0)}.`;
  }

  // ---------- L'échange entre joueurs (É4, lot 3) : une fenêtre, deux accords, pas de chat ----------

  /** Quelqu'un propose un échange : accepter ou refuser (sans réponse en 20 s, c'est non). */
  demandeEchange(de: Personne): void {
    const el = this.element.querySelector<HTMLElement>(".demande-echange")!;
    el.innerHTML = `<p><span class="pastille" style="background:${COULEURS_FAMILLES[de.famille]}"></span><b>${de.pseudo}</b> te propose un échange.</p>
      <div><button type="button" data-r="non">Refuser</button><button type="button" data-r="oui" class="oui">Voir l'échange</button></div>`;
    el.hidden = false;
    const repondre = (accepte: boolean) => {
      if (el.hidden) return;
      el.hidden = true;
      this.actions.echange({ genre: "repondre", accepte });
    };
    el.querySelector("[data-r='oui']")!.addEventListener("click", () => repondre(true));
    el.querySelector("[data-r='non']")!.addEventListener("click", () => repondre(false));
    window.setTimeout(() => repondre(false), 20_000);
  }

  majEchange(e: EchangeVu | null): void {
    const nouveau = e !== null && this.echange === null;
    this.echange = e;
    if (!e) {
      this.echangeOuvert(false);
      return;
    }
    if (nouveau) this.monOffre = { objets: {}, wotts: 0 };
    // Le serveur fait foi : s'il a refusé une offre, on repart de la sienne.
    if (Date.now() - this.envoiOffre > 600) this.monOffre = { objets: { ...e.moi.objets }, wotts: e.moi.wotts };
    if (nouveau) this.ouvrir(this.panneauEchange, true);
    else this.dessinerEchange();
  }

  get echangeEnCours(): boolean {
    return this.echange !== null;
  }

  private get panneauEchange(): HTMLElement {
    return this.element.querySelector<HTMLElement>(".panneau.echange")!;
  }

  private echangeOuvert(oui: boolean): void {
    if (oui) this.ouvrir(this.panneauEchange, true);
    else {
      this.panneauEchange.hidden = true;
      this.dernierEchange = "";
    }
  }

  private envoyerOffre(): void {
    this.envoiOffre = Date.now();
    this.actions.echange({ genre: "offrir", offre: this.monOffre });
    this.dessinerEchange();
  }

  private dessinerEchange(): void {
    const e = this.echange;
    const el = this.panneauEchange;
    if (!e || el.hidden) return;
    const o = this.monOffre;
    const mesObjets = (Object.entries(this.inventaire) as [TypeObjet, number][])
      .filter(([, n]) => n > 0)
      .map(([type, n]) => {
        const mis = o.objets[type] ?? 0;
        return `<li class="${mis > 0 ? "mis" : ""}">${icone(type, 28)}<span class="nom">${OBJETS[type].nom}<small>${n} dans ton sac</small></span>
          <span class="pas"><button type="button" data-moins="${type}" ${mis > 0 ? "" : "disabled"} aria-label="Moins">−</button><b>${mis}</b><button type="button" data-plus="${type}" ${mis < n ? "" : "disabled"} aria-label="Plus">+</button></span></li>`;
      })
      .join("");
    const sesObjets = (Object.entries(e.lui.objets) as [TypeObjet, number][])
      .filter(([, n]) => n > 0)
      .map(([type, n]) => `<li class="mis">${icone(type, 28)}<span class="nom">${nommer(type, n)}</span></li>`)
      .join("");
    const html = `
      <header><h2>Échange avec ${e.avec.pseudo}</h2><button type="button" class="fermer" aria-label="Annuler l'échange">✕</button></header>
      <div class="colonnes">
        <section>
          <h3>Tu donnes</h3>
          <ul class="lignes">${mesObjets || '<li class="vide">Ton sac est vide.</li>'}</ul>
          <div class="wotts-offre"><span>Wotts</span>
            <button type="button" data-wotts="-10">−10</button><b>${formaterWotts(o.wotts)}</b><button type="button" data-wotts="10">+10</button>
            <small>en poche : ${formaterWotts(this.wotts.poche)}</small></div>
        </section>
        <section class="recoit">
          <h3>Tu reçois</h3>
          <ul class="lignes">${sesObjets || `<li class="vide">${e.avec.pseudo} n'a encore rien posé.</li>`}</ul>
          <div class="wotts-offre"><span>Wotts</span><b>${formaterWotts(e.lui.wotts)}</b></div>
        </section>
      </div>
      <p class="accords"><span class="${e.accordMoi ? "ok" : ""}">${e.accordMoi ? "✓ Tu es d'accord" : "Tu n'as pas encore dit oui"}</span>
        <span class="${e.accordLui ? "ok" : ""}">${e.accordLui ? `✓ ${e.avec.pseudo} est d'accord` : `${e.avec.pseudo} réfléchit…`}</span></p>
      <div class="boutons"><button type="button" data-annuler>Annuler</button>
        <button type="button" class="oui ${e.accordMoi ? "actif" : ""}" data-accord>${e.accordMoi ? "Je ne suis plus d'accord" : "Je suis d'accord"}</button></div>`;
    if (html === this.dernierEchange) return;
    this.dernierEchange = html;
    el.innerHTML = html;
    const total = (type: TypeObjet, delta: number) => {
      const n = Math.max(0, Math.min(this.inventaire[type] ?? 0, (o.objets[type] ?? 0) + delta));
      const objets = { ...o.objets };
      if (n > 0) objets[type] = n;
      else delete objets[type];
      this.monOffre = { ...o, objets };
      this.envoyerOffre();
    };
    for (const b of el.querySelectorAll<HTMLButtonElement>("[data-plus]")) b.addEventListener("click", () => total(b.dataset.plus as TypeObjet, 1));
    for (const b of el.querySelectorAll<HTMLButtonElement>("[data-moins]")) b.addEventListener("click", () => total(b.dataset.moins as TypeObjet, -1));
    for (const b of el.querySelectorAll<HTMLButtonElement>("[data-wotts]")) {
      b.addEventListener("click", () => {
        const w = Math.max(0, Math.min(Math.floor(this.wotts.poche * 10) / 10, o.wotts + Number(b.dataset.wotts)));
        this.monOffre = { ...o, wotts: Math.round(w * 10) / 10 };
        this.envoyerOffre();
      });
    }
    const annuler = () => this.actions.echange({ genre: "annuler" });
    el.querySelector("[data-annuler]")!.addEventListener("click", annuler);
    el.querySelector(".fermer")!.addEventListener("click", annuler);
    el.querySelector("[data-accord]")!.addEventListener("click", () => this.actions.echange({ genre: "accord", oui: !e.accordMoi }));
  }

  // ---------- Le rapport de la base (É4, lot 2 : Book 01 §2 bis) ----------

  rapport(r: RapportBase): void {
    const el = this.element.querySelector<HTMLElement>(".rapport")!;
    const h = Math.floor(r.absence / 3_600_000);
    const min = Math.round((r.absence % 3_600_000) / 60_000);
    const duree = h > 0 ? `${h} h ${String(min).padStart(2, "0")}` : `${min} min`;
    const lignes: string[] = [];
    if (r.produit > 0) {
      lignes.push(`<li><b>Panneau solaire</b> : ${r.produit} Wh produits, ${r.stocke} Wh dans les batteries du banc${r.perdu > 0 ? `, <span class="perdu">${r.perdu} Wh perdus</span> (${r.stocke === 0 ? "pas de batterie sur le banc" : "batteries pleines"})` : ""}.</li>`);
    }
    const banc = Object.entries(r.surLeBanc).filter(([, wh]) => (wh ?? 0) > 0);
    if (banc.length) lignes.push(`<li><b>Sur le banc</b> : ${banc.map(([b, wh]) => `${b === "petite_batterie" ? "petite batterie" : "batterie de voiture"} ${wh} Wh`).join(", ")}.</li>`);
    if (r.charbonniere === "prete") lignes.push(`<li><b>La charbonnière</b> a fini de cuire : le charbon est prêt.</li>`);
    else if (typeof r.charbonniere === "number") lignes.push(`<li><b>La charbonnière</b> fume encore : prête dans ${r.charbonniere} min.</li>`);
    if (r.feuxEteints > 0) lignes.push(`<li><b>${r.feuxEteints > 1 ? `${r.feuxEteints} feux se sont éteints` : "Le feu s'est éteint"}</b> faute de bois.</li>`);
    if (r.decharge_remonte) lignes.push(`<li>La décharge a fait remonter ${r.decharge_remonte > 1 ? `${r.decharge_remonte} objets` : "un objet"}.</li>`);
    if (r.feuxAllumes > 0) lignes.push(`<li>${r.feuxAllumes > 1 ? `${r.feuxAllumes} feux brûlent` : "Le feu brûle"} encore.</li>`);
    if (r.decharge >= 1) lignes.push(`<li>Les batteries se sont déchargées toutes seules : −${r.decharge} Wh.</li>`);
    if (r.repousse > 0) lignes.push(`<li>Du bois mort et des baies ont repoussé (${r.repousse}).</li>`);
    if (lignes.length === 0) lignes.push(`<li>Rien n'a bougé : aucune de tes installations n'a travaillé en ton absence.</li>`);
    el.innerHTML = `
      <h2>Pendant ton absence <small>${duree}</small></h2>
      <ul>${lignes.join("")}</ul>
      <button type="button">Compris</button>`;
    el.hidden = false;
    el.querySelector("button")!.addEventListener("click", () => (el.hidden = true));
  }

  // ---------- Le comptoir et les wotts (É4) ----------

  majWotts(w: WottsVus): void {
    this.wotts = w;
    this.element.querySelector(".wotts span")!.textContent = formaterWotts(w.poche);
    this.redessiner();
  }

  ouvrirComptoir(vue: VueComptoir): void {
    this.vueComptoir = vue;
    this.ouvrir(this.guichet, true);
  }

  majComptoir(vue: VueComptoir): void {
    this.vueComptoir = vue;
    this.redessiner();
  }

  get guichetOuvert(): boolean {
    return !this.guichet.hidden;
  }

  private dessinerGuichet(): void {
    const v = this.vueComptoir;
    if (!v) return;
    const w = this.wotts;
    const ligne = (type: TypeObjet, droite: string, sous = "") =>
      `<li>${icone(type, 32)}<span class="nom">${OBJETS[type].nom}${sous ? `<small>${sous}</small>` : ""}</span>${droite}</li>`;
    let corps = "";
    if (this.onglet === "vendre") {
      const lignes = (Object.entries(this.inventaire) as [TypeObjet, number][])
        .filter(([, n]) => n > 0)
        .map(([type, n]) => {
          const prix = v.achats[type];
          if (prix === null || prix === undefined) return ligne(type, `<span class="prix non">non racheté</span>`, `× ${n}`);
          return ligne(
            type,
            `<span class="prix">${formaterWotts(prix)}</span><button type="button" data-op="vendre" data-objet="${type}" data-n="1">Vendre</button>${n > 1 ? `<button type="button" data-op="vendre" data-objet="${type}" data-n="${n}">Tout · ${formaterWotts(prix * n)}</button>` : ""}`,
            `× ${n}${(type === "petite_batterie" || type === "batterie_voiture") && (this.charges[type] ?? 0) >= 1 ? ` · ${Math.round(this.charges[type] ?? 0)} Wh dedans : dépose-les d'abord` : ""}`,
          );
        });
      corps = `${v.tresorerieBasse ? `<p class="avis">Les caisses sont presque vides : on ne rachète plus que le bois, la pierre et la nourriture, au prix plancher.</p>` : ""}
        <ul class="lignes">${lignes.join("") || "<li class=\"vide\">Ton sac est vide.</li>"}</ul>`;
    } else if (this.onglet === "acheter") {
      const lignes = (Object.entries(v.stock) as [TypeObjet, number][])
        .filter(([, n]) => n > 0)
        .map(([type, n]) => {
          const prix = prixVente(type);
          return ligne(type, `<span class="prix">${formaterWotts(prix)}</span><button type="button" data-op="acheter" data-objet="${type}" data-n="1" ${w.poche + 1e-6 >= prix ? "" : "disabled"}>Acheter</button>`, `en stock : ${n}`);
        });
      corps = `<ul class="lignes">${lignes.join("") || "<li class=\"vide\">Rien en stock.</li>"}</ul>`;
    } else if (this.onglet === "energie") {
      const batteries: TypeBatterie[] = ["petite_batterie", "batterie_voiture"];
      const lignes = batteries
        .filter((b) => (this.inventaire[b] ?? 0) > 0)
        .map((b) => {
          const wh = this.charges[b] ?? 0;
          const cap = CAPACITES[b] * (this.inventaire[b] ?? 0);
          const retrait = Math.min(cap - wh, v.reserveWh, w.poche / PRIX_RETRAIT);
          return ligne(
            b,
            `<button type="button" data-op="deposer" data-batterie="${b}" ${wh >= 1 ? "" : "disabled"}>Déposer · +${formaterWotts(wh * REGLAGES.depot_wotts_par_wh)}</button><button type="button" data-op="retirer" data-batterie="${b}" ${retrait >= 1 ? "" : "disabled"}>Recharger · −${formaterWotts(retrait * PRIX_RETRAIT)}</button>`,
            `${Math.round(wh)} / ${cap} Wh`,
          );
        });
      corps = `<p class="explication">Seul le dépôt d'électricité <b>crée</b> des wotts. Au printemps, le comptoir prend ${String(REGLAGES.depot_wotts_par_wh).replace(".", ",")} wott par Wh ; il le rend à ${PRIX_RETRAIT} wott par Wh. Énergie en réserve : ${v.reserveWh} Wh.</p>
        <ul class="lignes">${lignes.join("") || "<li class=\"vide\">Tu n'as pas de batterie sur toi.</li>"}</ul>`;
    } else {
      corps = `<p class="explication">Sur ton compte, les bons sont à l'abri : si tu t'effondres en route, tu ne les perds pas. Ils se déchargent pareil (≈ 2 % par semaine).</p>
        <div class="compte">
          <div><span>En poche</span><strong>${formaterWotts(w.poche)}</strong></div>
          <div><span>Sur ton compte</span><strong>${formaterWotts(w.compte)}</strong></div>
        </div>
        <div class="boutons-compte">
          <button type="button" data-op="verser" data-montant="${Math.min(10, w.poche)}" ${w.poche > 0 ? "" : "disabled"}>Verser 10</button>
          <button type="button" data-op="verser" data-montant="${w.poche}" ${w.poche > 0 ? "" : "disabled"}>Tout verser</button>
          <button type="button" data-op="tirer" data-montant="${Math.min(10, w.compte)}" ${w.compte > 0 ? "" : "disabled"}>Reprendre 10</button>
          <button type="button" data-op="tirer" data-montant="${w.compte}" ${w.compte > 0 ? "" : "disabled"}>Tout reprendre</button>
        </div>`;
    }
    const onglets: [OngletComptoir, string][] = [
      ["vendre", "Vendre"],
      ["acheter", "Acheter"],
      ["energie", "Énergie"],
      ["compte", "Compte"],
    ];
    const html = `
      <header>
        <div class="bandeau"><strong>LES COMPTEURS</strong><span>Comptoir du Carrefour · prix fixes</span></div>
        <button type="button" class="fermer" aria-label="Fermer">✕</button>
      </header>
      <div class="bons"><span>Tes bons</span><strong>${formaterWotts(w.poche)}</strong><span class="sur-compte">compte : ${formaterWotts(w.compte)}</span></div>
      <nav>${onglets.map(([o, nom]) => `<button type="button" data-onglet="${o}" class="${o === this.onglet ? "actif" : ""}">${nom}</button>`).join("")}</nav>
      <div class="contenu">${corps}</div>
      <span class="tampon-guichet">VÉRIFIÉ</span>`;
    if (html === this.dernierGuichet) return;
    this.dernierGuichet = html;
    this.guichet.innerHTML = html;
    this.guichet.querySelector(".fermer")!.addEventListener("click", () => this.ouvrir(this.guichet, false));
    for (const b of this.guichet.querySelectorAll<HTMLButtonElement>("[data-onglet]")) {
      b.addEventListener("click", () => {
        this.onglet = b.dataset.onglet as OngletComptoir;
        this.dessinerGuichet();
      });
    }
    for (const b of this.guichet.querySelectorAll<HTMLButtonElement>("[data-op]")) {
      b.addEventListener("click", () => {
        const op = b.dataset.op;
        const objet = b.dataset.objet as TypeObjet;
        const n = Number(b.dataset.n);
        const batterie = b.dataset.batterie as TypeBatterie;
        const montant = Number(b.dataset.montant);
        if (op === "vendre") this.actions.comptoir({ genre: "vendre", objet, quantite: n });
        if (op === "acheter") this.actions.comptoir({ genre: "acheter", objet, quantite: n });
        if (op === "deposer") this.actions.comptoir({ genre: "deposer", batterie });
        if (op === "retirer") this.actions.comptoir({ genre: "retirer", batterie });
        if (op === "verser") this.actions.comptoir({ genre: "verser", montant });
        if (op === "tirer") this.actions.comptoir({ genre: "tirer", montant });
      });
    }
  }

  // ---------- Le carnet (tutoriel, puis objectifs) : une icône 📓 en haut au centre (spécification de Sally, 0.4) ----------

  /** Le panneau du carnet ouvert ou fermé (le choix est gardé ; au tout début du tutoriel, il s'ouvre d'office). */
  private carnetOuvert = lireCarnetOuvert();
  private tutoriel: VueTutoriel | null = null;
  /** Objectifs qui ont avancé depuis la dernière ouverture (la pastille rouge). */
  private nonLus = 0;
  /** Un objectif vient d'être réussi : la pastille devient un tampon vert un moment. */
  private reussiJusqua = 0;
  private derniersProgres = "";

  majTutoriel(v: VueTutoriel | null): void {
    const fini = this.tutoriel !== null && v === null;
    const nouvelleEtape = v !== null && this.tutoriel !== null && v.etape !== this.tutoriel.etape;
    // Le tout début : le carnet s'ouvre d'office (on n'a pas encore pu choisir).
    if (v && v.etape === 0 && this.tutoriel === null && lireChoixCarnet() === null) this.carnetOuvert = true;
    this.tutoriel = v;
    // L'aide-mémoire des touches, en bas de l'écran : le temps du tutoriel seulement.
    const aide = this.element.querySelector<HTMLElement>(".bloc.aide");
    if (aide) aide.hidden = !v;
    if (v?.lecon) this.message(`✓ ${v.lecon}`, "lecon");
    // Une nouvelle étape : sa consigne passe aussi dans les messages, carnet ouvert ou non.
    if (nouvelleEtape && v) {
      this.message(`📓 ${v.titre} : ${avecTouches(v.consigne, this.tactile)}`, "lecon");
      if (!this.carnetOuvert) this.nonLus += 1;
    }
    if (fini) this.message("Tutoriel terminé : le monde est à toi. Ton carnet (📓, en haut) te propose maintenant des objectifs.", "lecon");
    this.dessinerCarnet();
  }

  // ---------- Les quêtes après le tutoriel (Book 22) ----------

  private quetes: VueQuetes | null = null;

  majQuetes(v: VueQuetes | null): void {
    // Ce qui a avancé depuis la dernière fois : la pastille le compte, si le carnet est fermé.
    const progres = JSON.stringify(v?.quetes.map((q) => [q.id, q.objectifs.map((o) => o.fait)]) ?? []);
    if (this.quetes && progres !== this.derniersProgres && !this.carnetOuvert) this.nonLus += 1;
    this.derniersProgres = progres;
    this.quetes = v;
    for (const r of v?.reussies ?? []) this.message(`✓ ${r.titre} : ${r.lecon}${r.recompense ? ` Reçu : ${r.recompense}.` : ""}`, "lecon");
    if (v?.reussies?.length) {
      this.reussiJusqua = performance.now() + 4000;
      window.setTimeout(() => this.dessinerCarnet(), 4100);
    }
    this.dessinerCarnet();
  }

  private contenuQuetes(v: VueQuetes): string {
    const LIGNES = { metier: "Le métier", installer: "S'installer", autres: "Les autres" } as const;
    return v.quetes
      .map(
        (q) => `<div class="quete">
          <div class="ligne-quete">${LIGNES[q.ligne]}</div>
          <div class="nom-quete">${q.titre}</div>
          ${
            q.objectifs.some((o) => o.but > 1) || q.objectifs.length > 1
              ? `<div class="progres-tuto">${q.objectifs
                  .map((o) => `<span class="${o.fait >= o.but ? "fait" : ""}">${o.libelle}${o.but > 1 ? ` <b>${o.fait}/${o.but}</b>` : ""}${o.fait >= o.but ? " ✓" : ""}</span>`)
                  .join("")}</div>`
              : ""
          }
          <p>${avecTouches(q.texte, this.tactile)}</p>${q.recompense ? `<p class="recompense">Récompense : ${q.recompense}</p>` : ""}
        </div>`,
      )
      .join("");
  }

  private contenuTutoriel(v: VueTutoriel): string {
    return `
      <div class="quete">
        <div class="ligne-quete">Tutoriel · étape ${v.etape + 1} sur ${v.total}</div>
        <div class="nom-quete">${v.titre}</div>
        ${
          v.progres
            ? `<div class="progres-tuto">${v.progres
                .map((p) => `<span class="${p.fait >= p.but ? "fait" : ""}">${p.libelle} <b>${p.fait}/${p.but}</b>${p.fait >= p.but ? " ✓" : ""}</span>`)
                .join("")}</div>`
            : ""
        }
        <p>${avecTouches(v.consigne, this.tactile)}</p>
        <button type="button" class="passer">Passer le tutoriel</button>
      </div>`;
  }

  /** Ouvre ou ferme le panneau du carnet (l'icône, le ✕, Échap ou la touche J). */
  basculerCarnet(ouvrir?: boolean): void {
    this.carnetOuvert = ouvrir ?? !this.carnetOuvert;
    if (this.carnetOuvert) this.nonLus = 0;
    try {
      localStorage.setItem("watt.carnet", this.carnetOuvert ? "ouvert" : "replie");
    } catch {
      // Pas de stockage (navigation privée) : le choix vaut pour la session.
    }
    this.dessinerCarnet();
  }

  get carnetEstOuvert(): boolean {
    return this.carnetOuvert && !this.element.querySelector<HTMLElement>(".carnet")!.hidden;
  }

  private dessinerCarnet(): void {
    const el = this.element.querySelector<HTMLElement>(".carnet")!;
    const bouton = this.element.querySelector<HTMLButtonElement>(".b-carnet")!;
    const v = this.tutoriel;
    const q = !v && this.quetes && this.quetes.quetes.length > 0 ? this.quetes : null;
    // L'icône : visible dès qu'il y a quelque chose à lire ; l'étape du tutoriel en petit ; la pastille.
    bouton.hidden = !v && !q;
    bouton.setAttribute("aria-expanded", String(this.carnetOuvert));
    bouton.querySelector<HTMLElement>(".etape-carnet")!.textContent = v ? `${v.etape + 1}/${v.total}` : "";
    const pastille = bouton.querySelector<HTMLElement>(".pastille-carnet")!;
    const reussi = performance.now() < this.reussiJusqua;
    pastille.hidden = !reussi && (this.nonLus === 0 || this.carnetOuvert);
    pastille.classList.toggle("reussi", reussi);
    pastille.textContent = reussi ? "✓" : String(Math.min(9, this.nonLus));
    el.hidden = bouton.hidden || !this.carnetOuvert;
    if (el.hidden) return;
    const titre = v ? "Tutoriel" : `Carnet · ${q!.quetes.length === 1 ? "1 objectif" : `${q!.quetes.length} objectifs`}`;
    const html = `
      <header><h2>📓 ${titre}</h2><button type="button" class="fermer-carnet" aria-label="Fermer le carnet">✕</button></header>
      <div class="contenu-carnet">${v ? this.contenuTutoriel(v) : this.contenuQuetes(q!)}</div>`;
    if (el.innerHTML === html) return;
    el.innerHTML = html;
    el.querySelector(".fermer-carnet")!.addEventListener("click", () => this.basculerCarnet(false));
    el.querySelector(".passer")?.addEventListener("click", () => {
      if (window.confirm("Passer le tutoriel ? Tu pourras tout découvrir par toi-même.")) this.actions.passerTutoriel();
    });
  }

  // ---------- Sommeil et météo (É5) ----------

  dort(oui: boolean, dansUnAbri: boolean): void {
    const d = this.element.querySelector<HTMLElement>(".dodo")!;
    d.hidden = !oui;
    d.querySelector("p")!.textContent = dansUnAbri ? "Tu dors dans l'abri…" : "Tu dors à même le sol…";
    this.element.classList.toggle("endormi", oui);
  }

  temps(t: Temps): void {
    if (t === this.dernierTemps) return;
    this.dernierTemps = t;
    const e = this.element.querySelector<HTMLElement>(".meteo")!;
    e.textContent = { soleil: "☀️", voile: "🌤", couvert: "☁️", pluie: "🌧" }[t];
    e.title = NOMS_TEMPS[t];
  }

  // ---------- Combat et santé (É3, lot 3) ----------

  majSante(s: SanteVue, endurance: number, pansements: number): void {
    const cle = `${JSON.stringify(s)}|${endurance}|${pansements}`;
    if (cle === this.derniereSante) return;
    this.derniereSante = cle;
    const regler = (jauge: HTMLElement, part: number, manque: boolean) => {
      jauge.querySelector<HTMLElement>(".barre > span")!.style.width = `${Math.round(Math.max(0, Math.min(1, part)) * 100)}%`;
      jauge.classList.toggle("manque", manque);
    };
    regler(this.sante, s.points / 100, s.points < 35);
    regler(this.endurance, endurance / 100, endurance < 15);
    this.endurance.classList.toggle("convalescence", s.convalescence);
    this.santeVue = s;
    this.valeurEndurance = endurance;
    if (this.jaugeOuverte) this.expliquerJauge();
    // Les blessures en langage courant, l'urgence en évidence (Book 05 §11).
    const puces: string[] = [];
    for (const type of new Set(s.blessures)) puces.push(`<span class="puce-blessure">${NOMS_BLESSURES[type]}</span>`);
    if (s.saignement !== "aucun") {
      puces.push(`<span class="puce-blessure saigne ${s.saignement}">${s.saignement === "fort" ? "Saigne beaucoup !" : "Saigne"}</span>`);
      if (pansements > 0) puces.push(`<button type="button" data-action="panser">Panser</button>`);
    }
    if (s.convalescence) puces.push(`<span class="puce-blessure calme">Convalescence</span>`);
    if (s.intoxique) puces.push(`<span class="puce-blessure saigne">Empoisonné</span>`);
    this.blessures.innerHTML = puces.join("");
    this.blessures.hidden = puces.length === 0;
  }

  /** Le mode : Exploration ou Combat (Book 08 §3.3). `alerte` : un Éteint approche, le bouton pulse. */
  mode(combat: boolean, alerte: boolean): void {
    const cle = `${combat}|${alerte}`;
    if (cle === this.dernierMode) return;
    this.dernierMode = cle;
    const b = this.element.querySelector<HTMLElement>(".b-mode");
    if (b) {
      b.textContent = combat ? "Combat" : "Explorer";
      b.classList.toggle("combat", combat);
      b.classList.toggle("alerte", alerte && !combat);
    }
    const c = this.element.querySelector<HTMLElement>(".mode-clavier")!;
    // Au clavier, pas d'étiquette « X Exploration / Combat » : on la prenait pour un bouton de plus (2026-10-08).
    // La touche reste dans le panneau Commandes ; en combat, l'invite (Frapper, Esquiver) et son bord rouge suffisent.
    c.hidden = true;
    c.querySelector("span")!.textContent = combat ? "Combat" : "Exploration";
    c.classList.toggle("combat", combat);
    c.classList.toggle("alerte", alerte && !combat);
    this.element.classList.toggle("en-combat", combat);
  }

  /** Saisi : le message au centre, et la barre des appuis pour se dégager. */
  saisie(nombre: number, progres: number): void {
    const s = this.element.querySelector<HTMLElement>(".saisie")!;
    s.hidden = nombre === 0;
    if (nombre === 0) return;
    s.querySelector("strong")!.textContent = nombre > 1 ? `Saisi par ${nombre} !` : "Saisi !";
    s.querySelector<HTMLElement>(".barre > span")!.style.width = `${Math.round(Math.min(1, progres) * 100)}%`;
  }

  /** Une morsure : l'écran rougit un instant. */
  flash(): void {
    const f = this.element.querySelector<HTMLElement>(".flash")!;
    f.classList.remove("actif");
    void f.offsetWidth;
    f.classList.add("actif");
  }

  /** La nuit, une lampe allumée : un halo ambré au bord de l'écran — on te voit de loin. */
  halo(actif: boolean): void {
    this.element.querySelector<HTMLElement>(".halo")!.classList.toggle("actif", actif);
  }

  effondrement(): void {
    const e = this.element.querySelector<HTMLElement>(".effondrement")!;
    e.hidden = false;
    e.classList.remove("actif");
    void e.offsetWidth;
    e.classList.add("actif");
    window.setTimeout(() => (e.hidden = true), 6000);
  }

  /** Un objet gagné : « +1 branche » qui monte au-dessus du personnage et s'efface. */
  gain(type: TypeObjet, n: number): void {
    const d = OBJETS[type];
    this.pastille(type, `+${n} ${n > 1 ? d.pluriel : d.nom}`);
  }

  /** Une pastille qui monte au-dessus du personnage et s'efface : l'effet immédiat d'une action. */
  pastille(type: TypeObjet | "feu_de_camp", texte: string): void {
    const conteneur = this.element.querySelector<HTMLElement>(".gains")!;
    const div = document.createElement("div");
    div.className = "gain";
    div.innerHTML = `${icone(type, 22)}<span>${texte}</span>`;
    // Plusieurs gains à la fois : ils s'empilent.
    div.style.animationDelay = `${conteneur.children.length * 0.12}s`;
    conteneur.append(div);
    window.setTimeout(() => div.remove(), 2000 + conteneur.children.length * 120);
  }

  /**
   * Un message en haut de l'écran (avis de Sally, 2026-10-08) : peu nombreux (3 sur ordinateur, 2 sur téléphone), sans
   * doublon (un message déjà affiché est relancé, avec « ×2 »), et quand la pile est pleine on retire d'abord le moins
   * important (leçon > aide > info > indice). Une même phrase d'indice ne revient pas avant 90 s.
   */
  message(texte: string, genre: "" | "aide" | "lecon" | "indice" = ""): void {
    const maintenant = performance.now();
    if (genre === "indice") {
      const vu = this.indicesVus.get(texte);
      if (vu !== undefined && maintenant - vu < 90_000) return;
      this.indicesVus.set(texte, maintenant);
    }
    const duree = { "": 4000, indice: 5000, aide: 8000, lecon: 9000 }[genre];
    const present = [...this.messages.children].find((e) => (e as HTMLElement).dataset.texte === texte) as HTMLElement | undefined;
    if (present) {
      const n = Number(present.dataset.fois ?? "1") + 1;
      present.dataset.fois = String(n);
      present.textContent = `${texte} ×${n}`;
      present.classList.remove("sortie");
      this.programmerSortie(present, duree);
      return;
    }
    const p = document.createElement("p");
    p.textContent = texte;
    p.dataset.texte = texte;
    p.dataset.rang = String(RANG_MESSAGE[genre]);
    if (genre) p.className = genre;
    this.messages.append(p);
    const max = this.tactile || matchMedia("(max-width: 560px), (max-height: 520px)").matches ? 2 : 3;
    while (this.messages.children.length > max) {
      // Le moins important d'abord ; à importance égale, le plus ancien.
      const tous = [...this.messages.children] as HTMLElement[];
      const victime = tous.reduce((a, b) => (Number(b.dataset.rang) < Number(a.dataset.rang) ? b : a));
      victime.remove();
    }
    this.programmerSortie(p, duree);
  }

  private indicesVus = new Map<string, number>();
  private sorties = new WeakMap<HTMLElement, number>();

  /** Le message s'efface en fondu (300 ms) au bout de sa durée ; relancé s'il revient entre-temps. */
  private programmerSortie(p: HTMLElement, duree: number): void {
    const avant = this.sorties.get(p);
    if (avant) window.clearTimeout(avant);
    this.sorties.set(
      p,
      window.setTimeout(() => {
        p.classList.add("sortie");
        this.sorties.set(p, window.setTimeout(() => p.remove(), 300));
      }, duree),
    );
  }

  // ---------- Panneaux : un seul ouvert à la fois ----------

  basculerSac(ouvrir?: boolean): void {
    this.ouvrir(this.sac, ouvrir === undefined ? Boolean(this.sac.hidden) : ouvrir);
  }

  basculerFabrication(ouvrir?: boolean): void {
    // Pendant le tutoriel, on ouvre toujours sur « Tout » : le carnet dit « fabrique une hache », elle doit sauter aux yeux.
    if (this.fabrication.hidden && this.tutoriel && !this.tutoriel.termine) this.ongletFabrication = "tout";
    this.ouvrir(this.fabrication, ouvrir === undefined ? Boolean(this.fabrication.hidden) : ouvrir);
  }

  fermerPanneaux(): void {
    this.ouvrir(this.sac, false);
  }

  private get panneauCommandes(): HTMLElement[] {
    const p = this.element.querySelector<HTMLElement>(".panneau.commandes");
    return p ? [p] : [];
  }

  /** Les noms des touches partout où on les montre (ils suivent les réglages et le clavier du joueur). */
  private majTouches(): void {
    const t = this.tactile;
    const saisie = this.element.querySelector<HTMLElement>(".texte-saisie");
    if (saisie) saisie.textContent = avecTouches("Tape {examiner} vite pour te dégager", t);
    const kbd = this.element.querySelector<HTMLElement>(".mode-clavier kbd");
    if (kbd) kbd.textContent = nomDe("combat");
    const aide = this.element.querySelector<HTMLElement>(".bloc.aide");
    if (aide) {
      const m = `${nomDe("avancer")}${nomDe("gauche")}${nomDe("reculer")}${nomDe("droite")}`;
      aide.textContent = avecTouches(
        `${m} : marcher · {courir} : courir · {discret} : discret · {agir} / clic : agir · {examiner} / clic droit : examiner · {sac} : sac · {fabriquer} : fabriquer · {combat} : combat · {carte} : carte · {lumiere} : lumière · {tourner} : tourner la vue · molette : zoom · « Commandes » pour les changer`,
        t,
      );
    }
    for (const [classe, action, nom] of [
      [".r-sac", "sac", "Sac"],
      [".r-fabriquer", "fabriquer", "Fabriquer"],
      [".r-carte", "carte", "Carte"],
      [".r-tourner", "tourner", "Tourner la vue"],
    ] as const) {
      const b = this.element.querySelector<HTMLElement>(classe);
      if (b) b.title = t ? nom : `${nom} (${nomDe(action)})`;
    }
    this.derniereInvite = "";
    if (this.tutoriel || this.quetes) this.dessinerCarnet();
    const p = this.panneauCommandes[0];
    if (p && !p.hidden) this.dessinerCommandes();
  }

  basculerCommandes(ouvrir?: boolean): void {
    const p = this.panneauCommandes[0];
    if (!p) return;
    const oui = ouvrir ?? Boolean(p.hidden);
    this.ouvrir(p, oui);
    if (oui) this.dessinerCommandes();
  }

  /** Le panneau « Commandes » : un rappel des touches, et la réassignation (Book 08 §3). */
  private dessinerCommandes(attente: Action | null = null, note = ""): void {
    const p = this.panneauCommandes[0]!;
    const lignes = (Object.keys(ACTIONS) as Action[])
      .map(
        (a) => `<tr><td>${ACTIONS[a].libelle}</td><td><button type="button" class="touche${attente === a ? " attente" : ""}" data-action="${a}">${
          attente === a ? "Appuie sur une touche…" : `<kbd>${nomDe(a)}</kbd>`
        }</button>${(ACTIONS[a].aussi ?? []).map((c) => ` <span class="aussi">ou ${nomTouche(c)}</span>`).join("")}</td></tr>`,
      )
      .join("");
    p.innerHTML = `
      <div class="entete"><h2>Commandes</h2><button type="button" class="fermer" aria-label="Fermer">✕</button></div>
      <p class="explication">Clique sur une touche pour la changer, puis appuie sur la nouvelle. Échap annule.</p>
      <table class="table-commandes"><tbody>${lignes}
        <tr><td>Agir / examiner à la souris</td><td><span class="aussi">clic gauche / clic droit</span></td></tr>
        <tr><td>Zoom</td><td><span class="aussi">molette</span></td></tr>
        <tr><td>Fermer une fenêtre</td><td><kbd>Échap</kbd></td></tr>
      </tbody></table>
      ${note ? `<p class="note">${note}</p>` : ""}
      <button type="button" class="retablir">Rétablir les touches par défaut</button>`;
    p.querySelector(".fermer")!.addEventListener("click", () => this.basculerCommandes(false));
    p.querySelector(".retablir")!.addEventListener("click", () => {
      retablir();
      this.dessinerCommandes(null, "Touches par défaut rétablies.");
    });
    for (const b of p.querySelectorAll<HTMLButtonElement>("button.touche")) {
      b.addEventListener("click", () => {
        const a = b.dataset.action as Action;
        this.dessinerCommandes(a);
        this.surAttendreTouche?.((code) => {
          if (!code) return this.dessinerCommandes();
          if (RESERVEES.has(code)) return this.dessinerCommandes(null, `${nomTouche(code)} est réservée : choisis une autre touche.`);
          const echange = assigner(a, code);
          this.dessinerCommandes(null, echange ? `${ACTIONS[echange].libelle} passe sur ${nomDe(echange)} (les deux touches ont été échangées).` : "");
        });
      });
    }
  }

  /** Affiche l'état du son sur son bouton. */
  majSon(actif: boolean): void {
    const b = this.element.querySelector<HTMLButtonElement>(".son")!;
    b.textContent = `Son : ${actif ? "oui" : "non"}`;
    b.setAttribute("aria-pressed", String(actif));
  }

  private ouvrir(panneau: HTMLElement, oui: boolean): void {
    const avant = [this.sac, this.fabrication, this.guichet].some((p) => !p.hidden);
    for (const p of [this.sac, this.fabrication, this.guichet, this.panneauEchange, this.panneauCoffre, this.panneauFiche, ...this.panneauCommandes]) p.hidden = !(oui && p === panneau);
    if (panneau !== this.panneauCoffre || !oui) this.coffre = null;
    if (panneau !== this.panneauFiche || !oui) this.fiche = null;
    if (oui || avant) this.surPanneau?.(oui);
    // Un échange en cours ne se ferme que par ses propres boutons : sa fenêtre revient quand on ferme les autres.
    if (!oui && this.echange) this.panneauEchange.hidden = false;
    this.dernierGuichet = "";
    this.dernierEchange = "";
    this.element.querySelector(".r-sac")!.classList.toggle("actif", !this.sac.hidden);
    this.element.querySelector(".r-fabriquer")!.classList.toggle("actif", !this.fabrication.hidden);
    this.dernierSac = "";
    this.derniereFabrication = "";
    this.redessiner();
  }

  // ---------- Le sac ----------

  /** L'arme équipée pour le combat (P-005). */
  private armeEquipee: TypeObjet | null = null;

  majArme(arme: TypeObjet | null): void {
    this.armeEquipee = arme;
    this.dernierSac = "";
    if (!this.sac.hidden) this.dessinerSac();
  }

  private dessinerSac(): void {
    if (this.selection && this.selection !== "gourde" && !(this.inventaire[this.selection] ?? 0)) this.selection = null;
    const poids = poidsInventaire(this.inventaire);
    const g = this.gourde;

    const presents = ORDRE_SAC.filter((t) => t !== "gourde" && (this.inventaire[t] ?? 0) > 0);
    // Les objets absents de l'ordre prévu viennent à la fin, pour ne rien oublier.
    for (const t of Object.keys(this.inventaire) as TypeObjet[]) if (!ORDRE_SAC.includes(t) && (this.inventaire[t] ?? 0) > 0) presents.push(t);
    // Par poids : la pile la plus lourde d'abord (le tri est stable : à poids égal, l'ordre par sorte).
    if (this.triSac === "poids") presents.sort((a, b) => OBJETS[b].poids * (this.inventaire[b] ?? 0) - OBJETS[a].poids * (this.inventaire[a] ?? 0));
    const case_ = (type: TypeObjet, badge: string, classe = "") => {
      const d = OBJETS[type];
      const pile = d.poids * Math.max(1, this.inventaire[type] ?? 0);
      return `<button type="button" class="case ${classe} ${this.selection === type ? "choisie" : ""}" data-objet="${type}"
        title="${d.nom} (${kg(pile)} kg) — ${d.description}" aria-label="${d.nom}">${icone(type)}${badge ? `<span class="badge">${badge}</span>` : ""}</button>`;
    };
    const cases = [
      (this.inventaire.gourde ?? 0) > 0 ? case_("gourde", g.litres > 0 ? `${kg(g.litres)} L` : "vide", g.contenu === "brute" && g.litres > 0 ? "brute" : "") : "",
      ...presents.map((t) => case_(t, (this.inventaire[t] ?? 0) > 1 ? `×${this.inventaire[t]}` : "", t === this.armeEquipee ? "equipee" : "")),
    ].join("");

    let fiche = `<p class="indice">Touche un objet pour le voir.</p>`;
    const s = this.selection;
    if (s) {
      const d = OBJETS[s];
      const n = Math.max(1, this.inventaire[s] ?? 0);
      let detail = d.description;
      // Une seule rangée d'actions, toujours visible sous la tête de la fiche (avis de Sally, 2026-10-08) :
      // l'action principale d'abord (en rouge), Jeter tout à droite pour ne pas le toucher par erreur.
      const actions: string[] = [];
      const infos: string[] = [];
      let enMain = "";
      if (s === "gourde") {
        detail = g.litres <= 0 ? "Vide. Remplis-la à la mare." : `${kg(g.litres)} L d'eau ${g.contenu === "potable" ? "potable" : "brute : fais-la bouillir sur le feu avant de la boire"}.`;
        actions.push(`<button type="button" class="principal" data-action="boire" ${g.litres > 0 ? "" : "disabled"}>Boire</button>`);
      } else if (d.kcal) {
        actions.push(`<button type="button" class="principal" data-action="manger">Manger</button>`);
      } else if (d.lumiere) {
        actions.push(`<button type="button" class="principal" data-action="lumiere">${this.lumiereAllumee ? "Éteindre" : "Allumer"}</button>`);
      } else if (s === "pansement") {
        actions.push(`<button type="button" class="principal" data-action="panser">Panser</button>`);
      } else if (estArme(s)) {
        // P-005 : l'arme qu'on a en main dès qu'on passe en mode Combat.
        if (s === this.armeEquipee) {
          enMain = " · ⚔ en main au combat";
          actions.push(`<button type="button" data-action="desequiper" title="En mode Combat, tu prendras la meilleure arme du sac.">Retirer</button>`);
        } else actions.push(`<button type="button" class="principal" data-action="equiper" title="L'arme que tu prends en mode Combat">Équiper</button>`);
      }
      // Batteries et lampe frontale : la charge stockée (Book 01 §2).
      const batterie = s === "lampe_frontale" ? "petite_batterie" : s === "petite_batterie" || s === "batterie_voiture" ? s : null;
      if (batterie) {
        const wh = this.charges[batterie] ?? 0;
        const cap = CAPACITES[batterie] * Math.max(1, this.inventaire[batterie] ?? 0);
        const pct = Math.round((wh / cap) * 100);
        infos.push(`<span class="charge-batterie"><span class="charge-barre"><span style="width:${Math.min(100, pct)}%"></span></span> ${Math.round(wh)} / ${cap} Wh${s === "lampe_frontale" ? " (petite batterie)" : ""}</span>`);
        if (s === "lampe_frontale" && (this.inventaire.petite_batterie ?? 0) === 0) detail += " Il lui faut une petite batterie.";
      }
      // Une arme : ses dégâts et sa vitesse, comparés aux autres (2026-10-08), et sa réparation (Book 23 §4.3).
      const arme = caracteristiquesArme(s);
      const caracs = arme ? this.ficheArme(arme, s) : "";
      if (arme) {
        const etat = etatArme(s, this.usureArmes);
        if (etat < 1) {
          actions.push(`<button type="button" data-action="reparer" title="Remettre à neuf ${ATELIERS_REPARATION_NOMS[MATIERE_ARME[s] ?? "metal"]}">Réparer</button>`);
          infos.push(`<p class="info-objet">Réparer : ${ATELIERS_REPARATION_NOMS[MATIERE_ARME[s] ?? "metal"]}, chez toi.${etat < PLAFOND_FORTUNE ? " Rafistoler : partout, avec une ficelle et des chiffons (elle reste abîmée)." : ""}</p>`);
          if (etat < PLAFOND_FORTUNE) actions.push(`<button type="button" data-action="reparer-fortune" title="Une ficelle et des chiffons : elle tient, mais reste abîmée">Rafistoler</button>`);
        }
      }
      // Vestiges, lot 1 : ce que donne le démontage, et l'outil qu'il demande.
      const dem = DEMONTAGE[s];
      if (dem) {
        const donne = (Object.entries(dem.donne) as [TypeObjet, number][]).map(([t, k]) => nommer(t, k)).join(", ");
        const outils = (Object.entries(dem.qualites) as [Qualite, number][]).map(([q, niv]) => `${NOMS_QUALITES[q]} ${niv}`).join(", ");
        const facteur = multiplicateurQualites(this.inventaire, dem.qualites);
        const etat = facteur === null ? "il te manque l'outil" : facteur > 1 ? "ton outil fera l'affaire, plus lentement" : outils ? "tu as l'outil" : "";
        actions.push(`<button type="button" data-action="demonter" ${facteur === null ? "disabled" : ""}>Démonter</button>`);
        infos.push(`<p class="info-objet">Démonter → ${donne}. Outil : ${outils || "aucun"}${etat ? ` (${etat})` : ""}.</p>`);
      }
      // Jeter par terre, quand le sac est trop lourd (on garde son sac sur le dos).
      if (s !== "sac_a_dos" && s !== "sac_fortune") {
        actions.push(`<button type="button" class="a-part" data-action="jeter1">Jeter${n > 1 ? " 1" : ""}</button>`);
        if (n > 1) actions.push(`<button type="button" data-action="jeterTout">Jeter les ${n}</button>`);
      }
      const famille = d.famille ? ` · ${NOMS_FAMILLES_VESTIGES[d.famille]}` : "";
      fiche = `
        <div class="fiche-tete">${icone(s, 36)}<div><strong>${nommer(s, n)}</strong>
          <small>${kg(d.poids * n)} kg · valeur ≈ ${formaterWotts(energieGrise(s))}${famille}${enMain}</small></div></div>
        ${actions.length ? `<div class="actions-objet">${actions.join("")}</div>` : ""}
        <p class="description">${detail}</p>
        ${caracs}
        ${infos.join("")}
        <p class="energie-grise">${this.texteEnergieGrise(s)}</p>`;
    }

    const capacite = capaciteDe(this.inventaire);
    const html = `
      <header><h2>${nomContenant(this.inventaire)}</h2>
        <span class="charge" title="${poids.toFixed(1)} / ${capacite} kg"><span style="width:${Math.min(100, (poids / capacite) * 100).toFixed(0)}%"></span></span>
        <span class="poids-total">${poids.toFixed(1).replace(".", ",")} / ${capacite} kg</span>
        ${capacite < 30 ? `<p class="sans-sac">Sans sac, tu ne portes que ${capacite} kg : retourne chercher le tien, ou fabrique un sac de fortune (4 branches, 2 cordes).</p>` : ""}
        <button type="button" class="fermer" aria-label="Fermer">✕</button></header>
      ${presents.length > 8 ? `<div class="tri-sac" role="group" aria-label="Trier le sac">Trier :
        <button type="button" data-tri="sorte" aria-pressed="${this.triSac === "sorte"}">par sorte</button>
        <button type="button" data-tri="poids" aria-pressed="${this.triSac === "poids"}">par poids</button></div>` : ""}
      <div class="grille">${cases}</div>
      <div class="fiche">${fiche}</div>`;

    // On ne redessine que si le contenu change : sinon un appui en cours serait perdu (iPhone).
    if (html === this.dernierSac) return;
    this.dernierSac = html;
    this.sac.innerHTML = html;

    this.sac.querySelector(".fermer")!.addEventListener("click", () => this.basculerSac(false));
    for (const b of this.sac.querySelectorAll<HTMLButtonElement>("[data-tri]")) {
      b.addEventListener("click", () => {
        this.triSac = b.dataset.tri === "poids" ? "poids" : "sorte";
        try {
          localStorage.setItem("watt.tri-sac", this.triSac);
        } catch {
          // Pas de stockage : le tri vaut pour cette partie.
        }
        this.dessinerSac();
      });
    }
    for (const b of this.sac.querySelectorAll<HTMLButtonElement>(".case")) {
      b.addEventListener("click", () => {
        const type = b.dataset.objet as TypeObjet;
        this.selection = this.selection === type ? null : type;
        this.dessinerSac();
      });
    }
    for (const b of this.sac.querySelectorAll<HTMLButtonElement>("[data-action]")) {
      b.addEventListener("click", () => {
        const action = b.dataset.action;
        if (action === "boire") this.actions.boire();
        if (action === "manger" && this.selection) this.actions.manger(this.selection);
        if (action === "lumiere") this.actions.lumiere();
        if (action === "panser") this.actions.panser();
        if (action === "equiper" && this.selection) this.actions.equiper(this.selection);
        if (action === "desequiper") this.actions.equiper(null);
        if ((action === "reparer" || action === "reparer-fortune") && this.selection) this.actions.reparer(this.selection, action === "reparer-fortune");
        if (action === "demonter" && this.selection) this.actions.demonter(this.selection);
        if ((action === "jeter1" || action === "jeterTout") && this.selection) {
          this.actions.jeter(this.selection, action === "jeter1" ? 1 : (this.inventaire[this.selection] ?? 1));
        }
      });
    }
  }

  /** Les caractéristiques d'une arme, en barres (la meilleure arme du jeu remplit la barre). */
  /** L'usure des armes (coups qui restent ; absente : neuve), Book 23 §4.3. */
  private usureArmes: Partial<Record<TypeObjet, number>> = {};

  majUsure(usure: Partial<Record<TypeObjet, number>>, evenement?: { objet: TypeObjet; etat: "abimee" | "cassee" | "reparee" }): void {
    this.usureArmes = usure;
    this.dernierSac = "";
    if (!this.sac.hidden) this.dessinerSac();
    if (evenement?.etat === "reparee") this.message(`${nommer(evenement.objet, 1)} : réparée.`);
  }

  private ficheArme(a: NonNullable<ReturnType<typeof caracteristiquesArme>>, objet: TypeObjet): string {
    const maxDegats = Math.max(...ARMES.map((x) => x.degatsTorse));
    const maxVitesse = Math.max(...ARMES.map((x) => 1000 / x.coup));
    const maxAllonge = Math.max(...ARMES.map((x) => x.allonge));
    const virgule = (n: number, d = 1) => n.toFixed(d).replace(".", ",");
    const barre = (libelle: string, part: number, valeur: string, titre: string) =>
      `<span class="carac" title="${titre}"><span class="nom-carac">${libelle}</span><span class="barre-carac"><span style="width:${Math.round(Math.min(1, part) * 100)}%"></span></span><span class="valeur-carac">${valeur}</span></span>`;
    const coupsPourTomber = Math.ceil(RESISTANCE_TORSE / a.degats);
    const etat = etatArme(objet, this.usureArmes);
    const abimee = etat < SEUIL_ABIMEE;
    return `<div class="caracs-arme">
      ${barre("Dégâts", a.degats / maxDegats, virgule(a.degats), `${coupsPourTomber} coup${coupsPourTomber > 1 ? "s" : ""} au torse pour le faire tomber`)}
      ${barre("Vitesse", a.vitesse / maxVitesse, `${virgule(a.coup, 2)} s`, `Un coup simple dure ${virgule(a.coup, 2)} s, un coup appuyé ${virgule(a.coupAppuye, 2)} s`)}
      ${barre("Allonge", a.allonge / maxAllonge, `${virgule(a.allonge)} m`, "Jusqu'où il porte")}
      ${barre("Solidité", etat, abimee ? "abîmée" : `${Math.round(etat * 100)} %`, abimee ? "Abîmée : ses coups portent 30 % moins fort. Répare-la." : "Elle s'use à chaque coup qui touche ; à zéro, elle casse.")}
      <span class="tete-carac">${a.tueALaTete ? "☠ Un coup appuyé à la tête l'arrête net." : "Ne tue pas d'un coup à la tête : il faut l'achever au sol."}</span>
      <span class="tete-carac">${TYPES_DEGATS[a.type]}</span>
    </div>`;
  }

  // ---------- Le coffre de rangement ----------

  private coffre: InstallationVue | null = null;
  /** Ranger ou sortir un seul objet, ou toute la pile. */
  private parPile = false;

  private get panneauCoffre(): HTMLElement {
    return this.element.querySelector<HTMLElement>(".panneau.coffre")!;
  }

  /** Le coffre ouvert (pour le fermer quand on s'en éloigne). */
  get coffreOuvert(): InstallationVue | null {
    return this.coffre;
  }

  ouvrirCoffre(i: InstallationVue): void {
    this.ouvrir(this.panneauCoffre, true);
    this.coffre = i;
    this.dessinerCoffre();
  }

  /** Le contenu du coffre a changé (on y a rangé ou pris quelque chose). */
  majCoffre(i: InstallationVue): void {
    if (this.coffre?.id !== i.id) return;
    this.coffre = i;
    this.dessinerCoffre();
  }

  private dessinerCoffre(): void {
    const c = this.coffre;
    const p = this.panneauCoffre;
    if (!c) return;
    const contenu = c.etat.contenu ?? {};
    const poidsCoffre = poidsInventaire(contenu);
    // La décharge (P-001) s'ouvre comme un coffre : on n'y fait que prendre, en choisissant (le sac ne suit pas).
    const estDecharge = c.type === "decharge";
    const poidsSac = poidsInventaire(this.inventaire);
    const cases = (inv: Inventaire, sens: "deposer" | "prendre") =>
      (Object.keys(inv) as TypeObjet[])
        .filter((t) => (inv[t] ?? 0) > 0 && !(sens === "deposer" && t === "sac_a_dos"))
        .map((t) => {
          const n = inv[t] ?? 0;
          if (estDecharge && sens === "deposer") return `<span class="case" title="${OBJETS[t].nom}" aria-label="${OBJETS[t].nom}">${icone(t)}${n > 1 ? `<span class="badge">×${n}</span>` : ""}</span>`;
          return `<button type="button" class="case" data-sens="${sens}" data-objet="${t}" title="${OBJETS[t].nom} (${kg(OBJETS[t].poids * n)} kg)" aria-label="${OBJETS[t].nom}">${icone(t)}${n > 1 ? `<span class="badge">×${n}</span>` : `${estDecharge ? `<span class="badge">${kg(OBJETS[t].poids)} kg</span>` : ""}`}</button>`;
        })
        .join("") || `<p class="indice">Rien.</p>`;
    p.innerHTML = `
      <header><h2>${estDecharge ? "Décharge" : "Coffre"}</h2><button type="button" class="fermer" aria-label="Fermer">✕</button></header>
      <div class="mode-pile">
        <button type="button" data-pile="un" aria-pressed="${!this.parPile}">Un par un</button>
        <button type="button" data-pile="tout" aria-pressed="${this.parPile}">Toute la pile</button>
      </div>
      <div class="colonnes">
        <section><h3>Sur toi <small>${kg(poidsSac)} / ${capaciteDe(this.inventaire)} kg</small></h3><div class="grille">${cases(this.inventaire, "deposer")}</div><p class="indice">${estDecharge ? "La décharge rend, elle ne reprend pas : choisis ce que tu emportes." : "Touche un objet pour le ranger."}</p></section>
        <section><h3>${estDecharge ? `Remonté du tas <small>${kg(poidsCoffre)} kg</small>` : `Dans le coffre <small>${kg(poidsCoffre)} / ${capaciteCoffre(c)} kg</small>`}</h3><div class="grille">${cases(contenu, "prendre")}</div><p class="indice">${estDecharge ? "Touche un objet pour le prendre. Le reste attend ici." : "Touche un objet pour le prendre."}</p></section>
      </div>`;
    p.querySelector(".fermer")!.addEventListener("click", () => this.ouvrir(p, false));
    for (const b of p.querySelectorAll<HTMLButtonElement>("[data-pile]")) {
      b.addEventListener("click", () => {
        this.parPile = b.dataset.pile === "tout";
        this.dessinerCoffre();
      });
    }
    for (const b of p.querySelectorAll<HTMLButtonElement>(".case[data-sens]")) {
      b.addEventListener("click", () => {
        const sens = b.dataset.sens as "deposer" | "prendre";
        const objet = b.dataset.objet as TypeObjet;
        const dispo = (sens === "deposer" ? this.inventaire[objet] : contenu[objet]) ?? 0;
        this.actions.coffre(c.id, sens, objet, this.parPile ? dispo : 1);
      });
    }
  }

  // ---------- La fiche d'un feu ou d'une installation (Book 24 : améliorer sa base, sur place) ----------

  /** L'état à jour de ce que montre la fiche (tenu par main.ts). */
  sourceFiche: ((genre: "feu" | "installation", id: number) => FeuVu | InstallationVue | null) | null = null;
  /** Les installations et feux du terrain (le lit voisin que l'abri peut absorber). */
  voisinsFiche: (() => { installations: InstallationVue[]; feux: FeuVu[] }) | null = null;
  private fiche: { genre: "feu" | "installation"; id: number } | null = null;
  private derniereFiche = "";

  private get panneauFiche(): HTMLElement {
    return this.element.querySelector<HTMLElement>(".panneau.fiche")!;
  }

  /** Où est ce que montre la fiche ouverte (pour la fermer quand on s'en éloigne). */
  get ficheOuverte(): { x: number; z: number } | null {
    if (!this.fiche || this.panneauFiche.hidden) return null;
    const v = this.sourceFiche?.(this.fiche.genre, this.fiche.id);
    return v ? { x: v.x, z: v.z } : null;
  }

  ouvrirFiche(genre: "feu" | "installation", id: number): void {
    this.ouvrir(this.panneauFiche, true);
    this.fiche = { genre, id };
    this.derniereFiche = "";
    this.dessinerFiche();
  }

  /** Le feu ou l'installation a changé (bois, niveau, démonté) : la fiche suit. */
  majFiche(): void {
    if (this.fiche && !this.panneauFiche.hidden) this.dessinerFiche();
  }

  private dessinerFiche(): void {
    const f = this.fiche;
    const p = this.panneauFiche;
    if (!f) return;
    const v = this.sourceFiche?.(f.genre, f.id);
    if (!v) {
      this.ouvrir(p, false);
      return;
    }
    const html = f.genre === "feu" ? this.ficheFeu(v as FeuVu) : this.ficheInstallation(v as InstallationVue);
    if (html === this.derniereFiche) return;
    this.derniereFiche = html;
    p.innerHTML = html;
    p.querySelector(".fermer")!.addEventListener("click", () => this.ouvrir(p, false));
    for (const b of p.querySelectorAll<HTMLButtonElement>("[data-verbe]")) {
      b.addEventListener("click", () => this.actions.amenager(f.genre, f.id, b.dataset.verbe as Verbe));
    }
  }

  /** Les puces d'un coût (avec ses choix : « ou »), et les qualités d'outil demandées. */
  private pucesCout(couts: readonly Inventaire[], qualites: Partial<Record<Qualite, number>>, famille?: Famille): string {
    const choix = (couts.length ? couts : []).map((c) =>
      (Object.entries(famille ? coutPour(c, { famille }, this.famille) : c) as [TypeObjet, number][]).map(([t, n]) => this.puce(t, n)).join(""),
    );
    const outils = (Object.entries(qualites) as [Qualite, number][])
      .map(([q, n]) => {
        const a = niveauQualite(this.inventaire, q);
        const etat = a >= n ? "ok" : a >= 1 && a === n - 1 ? "lent" : "manque";
        return `<span class="outil ${etat}">${NOMS_QUALITES[q]} ${n}</span>`;
      })
      .join("");
    return `<span class="puces">${choix.join(`<span class="ou">ou</span>`)}${outils}</span>`;
  }

  /**
   * Une étape à franchir (un niveau, un accessoire, creuser, combler) : ce qu'elle apporte, ce qu'elle coûte, le
   * bouton, ou ce qui manque et où le trouver (Book 08 §3).
   */
  private carteEtape(
    titre: string,
    texte: string,
    e: { couts: readonly Inventaire[]; qualites: Partial<Record<Qualite, number>>; famille?: Famille },
    verbe: Verbe,
    bouton: string,
    bloque: string | null = null,
    gratuit = false,
  ): string {
    const { cout, payable } = choisirCout(this.inventaire, e.couts, e, this.famille);
    const outils = multiplicateurQualites(this.inventaire, e.qualites) !== null;
    const possible = (gratuit || (payable && outils)) && !bloque;
    const badge = e.famille ? ` <span class="badge-famille ${e.famille}" title="Un niveau de métier">${NOMS_FAMILLES[e.famille]}${e.famille !== this.famille ? " · ×1,5" : ""}</span>` : "";
    const manque =
      !possible && !bloque && !gratuit
        ? this.listeManque({ id: "fiche", categorie: "batir", nom: titre, produit: { objet: "branche", quantite: 0 }, ingredients: cout, qualites: e.qualites, duree: 0, intensite: "legere", famille: "tous" })
        : "";
    return `
      <article class="etape ${possible ? "possible" : ""}">
        <div class="corps"><strong>${titre}${badge}</strong>
          <small>${texte}</small>
          ${gratuit ? "" : this.pucesCout(e.couts, e.qualites, e.famille)}
          ${bloque ? `<small class="bloque">${bloque}</small>` : manque}
        </div>
        <button type="button" data-verbe="${verbe}" ${possible ? "" : "disabled"}>${bouton}</button>
      </article>`;
  }

  /** « Et après ? » : le niveau d'ensuite, grisé (la recette pressentie, Book 03 §5.1). */
  private carteApres(e: Etape | null | undefined): string {
    if (!e) return "";
    return `<article class="etape apres"><div class="corps"><strong>Et après ? ${e.nom}</strong><small>${e.apporte}${e.phase ? " Pas encore : il faudra de l'argile, et du temps." : ""}</small></div></article>`;
  }

  private ficheFeu(v: FeuVu): string {
    const etape = etapeFeu(v);
    const effets = effetsFeu(v);
    const voie = v.dakota ? VOIE_CREUSEE : VOIE_SURFACE;
    const niveau = etape.niveau;
    const suivante = etapeSuivanteFeu(v);
    const flammes = v.aspect === "flammes";
    const aspect = v.couvert ? "couvert sous la cendre" : { flammes: "en flammes", braises: "en braises", eteint: "éteint", cendres: "froid, des cendres" }[v.aspect];
    const nb = (x: number) => String(Math.round(x * 100) / 100).replace(".", ",");
    const proprietes = [
      `${nb(v.bois)} kg de bois sur ${effets.boisMax}`,
      effets.bois !== 1 ? `brûle ×${nb(effets.bois)}` : "",
      effets.chaleur > 1 ? "réchauffe l'abri voisin" : "",
      effets.plats > 1 ? "deux plats à la fois" : "",
      effets.cuisine >= 3 ? "soupes mijotées" : "",
    ].filter(Boolean);

    // Ce qu'on fait au feu, tout de suite.
    const aDuBois = (this.inventaire.buche ?? 0) > 0 || (this.inventaire.branche ?? 0) > 0;
    const briquet = (this.inventaire.briquet ?? 0) > 0 || (this.inventaire.pierre_a_feu ?? 0) > 0;
    const gestes = [
      aDuBois ? `<button type="button" data-verbe="ajouter_bois">Ajouter du bois</button>` : "",
      v.couvert ? `<button type="button" data-verbe="ranimer">Ranimer</button>` : "",
      !v.couvert && v.aspect === "eteint" && v.bois > 0 && briquet ? `<button type="button" data-verbe="allumer">Allumer</button>` : "",
      effets.couvrir && !v.couvert && (v.aspect === "flammes" || v.aspect === "braises") ? `<button type="button" data-verbe="couvrir">Couvrir pour la nuit</button>` : "",
    ].join("");

    // Améliorer : le niveau suivant (jamais dans les flammes), et celui d'après, grisé.
    const bloqueFlammes = flammes ? "On ne maçonne pas dans les flammes : attends les braises, ou couvre le feu." : null;
    let ameliorer = "";
    if (suivante && !suivante.phase) {
      ameliorer = this.carteEtape(`Améliorer : ${suivante.nom}`, suivante.apporte, suivante, "ameliorer", "Améliorer", bloqueFlammes) + this.carteApres(voie[niveau + 1]);
    } else if (suivante) {
      ameliorer = this.carteApres(suivante);
    } else {
      ameliorer = `<p class="indice">C'est le plus haut de sa lignée.</p>`;
    }

    // L'autre voie, au premier niveau seulement : creuser le feu de camp, ou combler le Dakota.
    let voieAutre = "";
    if (!v.dakota && niveau === 1) {
      voieAutre = this.carteEtape("Creuser en foyer Dakota", `${VOIE_CREUSEE[0]!.apporte} Tu récupères 3 pierres.`, { couts: [], qualites: CREUSER.qualites }, "creuser_dakota", "Creuser", bloqueFlammes);
    } else if (v.dakota && niveau === 1) {
      voieAutre = this.carteEtape("Combler en feu de camp", "On rebouche le trou, on pose un cercle de pierres : un feu qui chauffe et éclaire, mais qui se voit.", { couts: [COMBLER.cout], qualites: COMBLER.qualites }, "combler", "Combler", bloqueFlammes);
    }

    // Les accessoires, comme la meule du pédalier.
    const forme = formeFeu(v);
    const accessoires = (Object.entries(ACCESSOIRES_FEU) as [AccessoireFeu, (typeof ACCESSOIRES_FEU)[AccessoireFeu]][])
      .map(([a, def]) => {
        if (v.accessoires?.includes(a)) return `<p class="monte">✓ ${def.nom} : ${def.apporte}</p>`;
        if (!def.formes.includes(forme)) return a === "marmite" && !v.dakota ? `<article class="etape apres"><div class="corps"><strong>${def.nom}</strong><small>${def.apporte} Il faut un foyer de cuisine.</small></div></article>` : "";
        return this.carteEtape(def.nom, def.apporte, def, a === "broche" ? "monter_broche" : "monter_marmite", "Installer");
      })
      .join("");

    // Redescendre, démonter : ce qu'on récupère (Book 24 §2.4).
    const precedente = niveau > 1 ? voie[niveau - 2]! : null;
    const defaire = [
      precedente ? `<button type="button" class="secondaire" data-verbe="redescendre" ${flammes ? "disabled" : ""} title="Redevient ${precedente.nom.toLowerCase()}">Défaire l'amélioration</button>` : "",
      `<button type="button" class="secondaire" data-verbe="demonter_installation" ${v.aspect === "flammes" || v.aspect === "braises" ? "disabled" : ""}>Démonter</button>`,
    ].join("");

    return `
      <header><h2>${etape.nom}</h2><button type="button" class="fermer" aria-label="Fermer">✕</button></header>
      <p class="niveau">Niveau ${niveau} · ${aspect}</p>
      <p class="examen">${etape.examen}</p>
      <p class="proprietes">${proprietes.join(" · ")}</p>
      ${gestes ? `<div class="gestes">${gestes}</div>` : ""}
      <h3>Améliorer, sur place</h3>
      ${ameliorer}
      ${voieAutre ? `<h3>L'autre voie</h3>${voieAutre}` : ""}
      ${accessoires ? `<h3>Accessoires</h3>${accessoires}` : ""}
      <div class="defaire">${defaire}</div>
      <p class="indice">Un démontage rend la moitié des pierres, branches et bûches, et tout le reste. Un feu se démonte éteint.</p>`;
  }

  private ficheInstallation(i: InstallationVue): string {
    const etape = etapeInstallation(i);
    const niveau = niveauInstallation(i);
    const l = lignee(i.type);
    const suivante = etapeSuivanteInstallation(i);
    const nom = etape?.nom ?? NOMS_INSTALLATIONS[i.type].charAt(0).toUpperCase() + NOMS_INSTALLATIONS[i.type].slice(1);
    const examen = niveau > 1 && etape ? etape.examen : EXAMENS_INSTALLATIONS[i.type];
    const nb = (x: number) => String(Math.round(x * 10) / 10).replace(".", ",");
    const etat =
      i.type === "coffre"
        ? `${nb(poidsInventaire(i.etat.contenu ?? {}))} kg sur ${capaciteCoffre(i)}`
        : i.type === "recuperateur_pluie"
          ? `${nb(i.etat.litres ?? 0)} L sur ${contenanceRecuperateur(i)}`
          : "";

    let ameliorer = "";
    if (l && suivante && !suivante.phase) {
      // L'abri garni peut absorber le lit de branchages voisin, sans rien payer : c'est proposé, jamais fait d'office.
      const lit = suivante.id === "abri_garni" && this.voisinsFiche?.().installations.some((x) => x.type === "lit_branchages" && Math.hypot(x.x - i.x, x.z - i.z) <= 3);
      ameliorer = lit
        ? this.carteEtape(`Améliorer : ${suivante.nom}`, `${suivante.apporte} Ton lit de branchages voisin passe sous la bâche : rien à payer.`, suivante, "ameliorer", "Glisser le lit sous l'abri", null, true)
        : this.carteEtape(`Améliorer : ${suivante.nom}`, suivante.apporte, suivante, "ameliorer", "Améliorer");
      ameliorer += this.carteApres(l[niveau + 1]);
    } else if (l && suivante) {
      ameliorer = this.carteApres(suivante);
    } else if (l) {
      ameliorer = `<p class="indice">C'est le plus haut de sa lignée.</p>`;
    }

    const plein = i.type === "coffre" && Object.values(i.etat.contenu ?? {}).some((n) => (n ?? 0) > 0);
    const precedente = niveau > 1 && l ? l[niveau - 2]! : null;
    const defaire = [
      precedente ? `<button type="button" class="secondaire" data-verbe="redescendre" title="Redevient ${precedente.nom.toLowerCase()}">Défaire l'amélioration</button>` : "",
      `<button type="button" class="secondaire" data-verbe="demonter_installation" ${plein ? "disabled" : ""}>Démonter</button>`,
    ].join("");

    return `
      <header><h2>${nom}</h2><button type="button" class="fermer" aria-label="Fermer">✕</button></header>
      ${l ? `<p class="niveau">Niveau ${niveau}${etat ? ` · ${etat}` : ""}</p>` : etat ? `<p class="niveau">${etat}</p>` : ""}
      <p class="examen">${examen}</p>
      ${ameliorer ? `<h3>Améliorer, sur place</h3>${ameliorer}` : ""}
      <div class="defaire">${defaire}</div>
      <p class="indice">${plein ? "Vide d'abord le coffre pour le démonter. " : ""}Un démontage rend la moitié des pierres, branches et bûches, et tout le reste (la bâche, la corde, le métal).</p>`;
  }

  // ---------- La fabrication ----------

  private puce(type: TypeObjet, besoin: number): string {
    const a = this.inventaire[type] ?? 0;
    return `<span class="ingredient ${a >= besoin ? "ok" : ""}" title="${OBJETS[type].nom}">${icone(type, 22)}${Math.min(a, besoin)}/${besoin}</span>`;
  }

  /** L'onglet du panneau Fabriquer : le dernier choisi, gardé sur l'appareil (« Tout » si rien). */
  private ongletFabrication: CategorieRecette | "tout" = lireOngletFabrication();
  private faisableSeulement = false;

  private dessinerFabrication(): void {
    const recettes = recettesConnues(this.famille);
    const cartes: { categorie: CategorieRecette; possible: boolean; html: string }[] = [];

    // Le feu de camp (É1) a sa propre règle, mais il se fabrique au même endroit.
    const feuPossible = Object.entries(RECETTE_FEU).every(([t, n]) => (this.inventaire[t as TypeObjet] ?? 0) >= (n ?? 0));
    // Le foyer Dakota (P-002) : creusé d'emblée, discret, économe. Il faut de quoi creuser.
    const dakotaPossible = ingredientsPresents(this.inventaire, RECETTE_DAKOTA_AIDE) && niveauQualite(this.inventaire, "creuser") >= 1;
    // Une seule carte pour toute la lignée du feu (Book 24) : le reste (foyer de pierres, de cuisine, Dakota, poêle-fusée)
    // se fait sur place, depuis le feu (« Examiner »).
    cartes.push({ categorie: "feu", possible: feuPossible || dakotaPossible, html: `
      <article class="recette ${feuPossible || dakotaPossible ? "possible" : ""}">
        ${icone("feu_de_camp", 40)}
        <div class="corps"><strong>Feu de camp</strong>
          <span class="puces">${Object.entries(RECETTE_FEU).map(([t, n]) => this.puce(t as TypeObjet, n ?? 0)).join("")}</span>
          <small>Se pose devant toi. Cuire, faire bouillir l'eau, s'éclairer. Ou en foyer Dakota, plus discret (3 branches, outil Creuser 1). Il s'améliore ensuite sur place : approche-toi, puis « Examiner ».</small>
          ${this.pourquoi === "feu" ? this.listeManque(RECETTE_FEU_AIDE) : ""}${this.pourquoi === "dakota" ? this.listeManque(RECETTE_DAKOTA_AIDE) : ""}</div>
        <div class="boutons-feu">
          ${feuPossible ? `<button type="button" data-feu>Construire</button>` : `<button type="button" class="pourquoi" data-pourquoi="feu" aria-expanded="${this.pourquoi === "feu"}" aria-label="Voir ce qui manque">Il manque…</button>`}
          ${dakotaPossible ? `<button type="button" data-dakota title="3 branches, un outil pour creuser (Creuser 1)">Creuser en Dakota</button>` : ""}
        </div>
      </article>` });

    for (const r of recettes) {
      const pictogramme: Pictogramme = "objet" in r.produit ? r.produit.objet : r.produit.installation;
      const outils = multiplicateurQualites(this.inventaire, r.qualites);
      const possible = ingredientsPresents(this.inventaire, r) && outils !== null;
      const qualites = Object.entries(r.qualites)
        .map(([q, n]) => {
          const a = niveauQualite(this.inventaire, q as Qualite);
          // Sans aucun outil de cette qualité, c'est impossible (rouge) ; un niveau en dessous, possible mais plus lent (jaune).
          const etat = a >= (n ?? 0) ? "ok" : a >= 1 && a === (n ?? 0) - 1 ? "lent" : "manque";
          const titre = etat === "lent" ? "Outil de fortune : plus lent" : etat === "manque" ? "Il te manque un outil pour ça" : "Qualité d'outil demandée";
          return `<span class="outil ${etat}" title="${titre}">${NOMS_QUALITES[q as Qualite]} ${n}</span>`;
        })
        .join("");
      const ou =
        ("installation" in r.produit ? `Se pose devant toi : ${NOMS_INSTALLATIONS[r.produit.installation]}. ` : "") +
        (r.installation ? `Près d'un ${NOMS_INSTALLATIONS[r.installation]}. ` : "") +
        (r.feu ? ((r.feuNiveau ?? 1) >= 3 ? "Sur un foyer de cuisine allumé (la crémaillère). " : "Près d'un feu allumé. ") : "") +
        (r.eau ? `${String(r.eau).replace(".", ",")} L d'eau de la gourde (celle de la mare suffit). ` : "");
      const secondes = Math.round(dureeReelle(r) * (outils ?? 1) * 10) / 10;
      const badge = r.famille === "tous" ? "" : ` <span class="badge-famille ${r.famille}" title="Recette de ta famille">${NOMS_FAMILLES[r.famille]}</span>`;
      cartes.push({ categorie: r.categorie, possible, html: `
        <article class="recette ${possible ? "possible" : ""}">
          ${icone(pictogramme, 40)}
          <div class="corps"><strong>${r.nom}${badge}</strong>
            <span class="puces">${Object.entries(r.ingredients).map(([t, n]) => this.puce(t as TypeObjet, n ?? 0)).join("")}${qualites}</span>
            <small>${ou}${String(secondes).replace(".", ",")} s · ≈ ${Math.round(energieGriseRecette(r))} wotts</small>${this.pourquoi === r.id ? this.listeManque(r) : ""}</div>
          ${
            possible
              ? `<button type="button" data-recette="${r.id}">${"installation" in r.produit ? "Construire" : "Fabriquer"}</button>`
              : `<button type="button" class="pourquoi" data-pourquoi="${r.id}" aria-expanded="${this.pourquoi === r.id}" aria-label="Voir ce qui manque">Il manque…</button>`
          }
        </article>` });
    }

    // Les onglets (avis de Sally, 2026-10-08) : « Tout » en premier, regroupé sous des intertitres ; un compteur des
    // recettes faisables, seulement s'il y en a ; « Faisable maintenant » est un filtre, pas un onglet. L'ordre ne bouge
    // jamais sous le doigt.
    const onglet = this.ongletFabrication;
    const faisables = (c: CategorieRecette | "tout") => cartes.filter((x) => x.possible && (c === "tout" || x.categorie === c)).length;
    const bouton = (id: CategorieRecette | "tout", court: string, long: string, image: string) => {
      const n = faisables(id);
      const etiquette = `${long}${n ? `, ${n} faisable${n > 1 ? "s" : ""}` : ""}`;
      return `<button type="button" role="tab" class="onglet" data-onglet="${id}" aria-selected="${onglet === id}" tabindex="${onglet === id ? 0 : -1}" aria-label="${etiquette}" title="${long}">${image}<span class="nom-onglet">${court}</span>${n ? `<span class="compte" aria-hidden="true">${n}</span>` : ""}</button>`;
    };
    const IMAGES: Record<CategorieRecette, Pictogramme> = { feu: "feu_de_camp", outils: "hache", sur_soi: "sac_a_dos", materiaux: "corde", batir: "abri", ateliers: "etabli" };
    const onglets = [bouton("tout", "Tout", "Toutes les recettes", `<span class="image-tout" aria-hidden="true">☰</span>`), ...CATEGORIES_RECETTES.map((c) => bouton(c.id, c.nom, c.long, icone(IMAGES[c.id], 24)))].join("");
    const visibles = (c: CategorieRecette) => cartes.filter((x) => x.categorie === c && (!this.faisableSeulement || x.possible));
    let contenu =
      onglet === "tout"
        ? CATEGORIES_RECETTES.map((c) => {
            const v = visibles(c.id);
            return v.length ? `<h3 class="intertitre">${c.long}</h3>${v.map((x) => x.html).join("")}` : "";
          }).join("")
        : visibles(onglet)
            .map((x) => x.html)
            .join("");
    if (!contenu) contenu = `<p class="vide">${this.faisableSeulement ? "Rien de faisable ici pour l'instant : décoche « Faisable maintenant » pour voir ce qui manque." : "Aucune recette connue dans cette catégorie pour l'instant."}</p>`;

    const html = `
      <header><h2>Fabriquer</h2><span class="sous-titre">${recettes.length + 1} recettes connues</span>
        <button type="button" class="fermer" aria-label="Fermer">✕</button></header>
      <div class="onglets-fabrication" role="tablist" aria-label="Catégories">${onglets}</div>
      <label class="filtre-faisable"><input type="checkbox" ${this.faisableSeulement ? "checked" : ""}> Faisable<span class="long"> maintenant</span></label>
      <div class="recettes" role="tabpanel">${contenu}</div>`;
    if (html === this.derniereFabrication) return;
    this.derniereFabrication = html;
    // Un changement dans le sac redessine le panneau : on garde le défilement (même onglet) et la place dans les onglets.
    const avant = this.fabrication.querySelector<HTMLElement>(".recettes");
    const defilement = avant && this.fabrication.dataset.onglet === onglet ? avant.scrollTop : 0;
    const defilementOnglets = this.fabrication.querySelector<HTMLElement>(".onglets-fabrication")?.scrollLeft ?? 0;
    this.fabrication.innerHTML = html;
    this.fabrication.dataset.onglet = onglet;
    this.fabrication.querySelector<HTMLElement>(".recettes")!.scrollTop = defilement;
    this.fabrication.querySelector<HTMLElement>(".onglets-fabrication")!.scrollLeft = defilementOnglets;
    const choisir = (id: CategorieRecette | "tout", focus = false) => {
      this.ongletFabrication = id;
      this.pourquoi = null;
      ecrire(CLE_ONGLET_FABRICATION, id);
      this.dessinerFabrication();
      if (focus) this.fabrication.querySelector<HTMLElement>(`[data-onglet="${id}"]`)?.focus();
    };
    const ids = ["tout", ...CATEGORIES_RECETTES.map((c) => c.id)] as (CategorieRecette | "tout")[];
    for (const b of this.fabrication.querySelectorAll<HTMLButtonElement>("[data-onglet]")) {
      b.addEventListener("click", () => choisir(b.dataset.onglet as CategorieRecette | "tout"));
      // Flèches gauche/droite d'un onglet à l'autre (motif « tablist »).
      b.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        e.stopPropagation();
        const i = ids.indexOf(b.dataset.onglet as CategorieRecette | "tout");
        choisir(ids[(i + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length]!, true);
      });
    }
    this.fabrication.querySelector<HTMLInputElement>(".filtre-faisable input")!.addEventListener("change", (e) => {
      this.faisableSeulement = (e.target as HTMLInputElement).checked;
      this.dessinerFabrication();
    });

    this.fabrication.querySelector(".fermer")!.addEventListener("click", () => this.basculerFabrication(false));
    this.fabrication.querySelector("[data-feu]")?.addEventListener("click", () => {
      this.basculerFabrication(false);
      this.actions.construireFeu();
    });
    this.fabrication.querySelector("[data-dakota]")?.addEventListener("click", () => {
      this.basculerFabrication(false);
      this.actions.construireFeu(true);
    });
    // Une recette grisée : un appui dit ce qui manque, et par quoi le remplacer.
    for (const b of this.fabrication.querySelectorAll<HTMLButtonElement>("[data-pourquoi]")) {
      b.addEventListener("click", () => {
        this.pourquoi = this.pourquoi === b.dataset.pourquoi ? null : b.dataset.pourquoi!;
        this.dessinerFabrication();
      });
    }
    for (const b of this.fabrication.querySelectorAll<HTMLButtonElement>("[data-recette]")) {
      b.addEventListener("click", () => {
        const r = recettes.find((x) => x.id === b.dataset.recette);
        if (!r) return;
        if ("installation" in r.produit) this.basculerFabrication(false);
        this.actions.fabriquer(r);
      });
    }
  }

  // ---------- L'explication des jauges ----------

  private jaugeOuverte: NomJauge | null = null;
  private besoins: Besoins | null = null;
  private santeVue: SanteVue | null = null;
  private valeurEndurance = 100;

  private expliquerJauge(): void {
    const bulle = this.element.querySelector<HTMLElement>(".explication-jauge")!;
    for (const j of this.element.querySelectorAll<HTMLElement>("[data-jauge]")) j.classList.toggle("ouverte", j.dataset.jauge === this.jaugeOuverte);
    if (!this.jaugeOuverte) {
      bulle.hidden = true;
      return;
    }
    const pc = (x: number) => `${Math.round(Math.max(0, Math.min(1, x)) * 100)} %`;
    const b = this.besoins;
    // Les durées réelles suivent les réglages (rythme 1 : une journée de jeu de 24 min ; 0,35 : ≈ 70 min).
    const minutes = (base: number, rythme: number) => (rythme > 0 ? `≈ ${Math.round(base / rythme / 5) * 5} min de jeu réel` : "sans limite");
    const textes: Record<NomJauge, [string, string]> = {
      faim: [
        `Faim · ${b ? pc(b.kcal / RESERVE_KCAL_MAX) : "–"}`,
        `Ta réserve de nourriture : pleine, elle tient ${minutes(24, REGLAGES.faim_rythme)} au calme. Elle baisse avec le temps, plus vite quand tu cours ou travailles dur. Pour la remonter : ouvre ton sac et mange. Sous 15 %, tu ne peux plus courir ; à vide, tes blessures ne guérissent plus.`,
      ],
      eau: [
        `Eau · ${b ? pc(b.eau / RESERVE_EAU_MAX) : "–"}`,
        "Ce que ton corps a bu. Elle baisse avec le temps et l'effort. Pour la remonter : bois à ta gourde (dans le sac), remplis-la à la mare, et fais bouillir l'eau brute sur un feu avant de la boire. Sous 15 %, plus de course ; à vide, tes blessures ne guérissent plus.",
      ],
      sommeil: [
        `Sommeil · ${b ? pc(b.repos ?? 1) : "–"}`,
        `Ta fraîcheur : éveillé, tu t'uses en ${minutes(16, REGLAGES.sommeil_rythme)}. Pour la remonter : dors dans un abri (8 heures de jeu pour une nuit complète). Sous 15 %, tu es épuisé : plus de course, et tu travailles plus lentement.`,
      ],
      sante: [
        `Santé · ${this.santeVue ? `${Math.round(this.santeVue.points)} %` : "–"}`,
        "Les morsures, coupures et coups l'entament ; un saignement la vide peu à peu : panse-le vite. Elle remonte toute seule, lentement, quand tu ne saignes plus et que tu as mangé et bu. À zéro, tu t'effondres et passes un jour en convalescence.",
      ],
      endurance: [
        `Endurance · ${Math.round(this.valeurEndurance)} %`,
        `Ton souffle : pleine quand tu es en forme. Courir, frapper, esquiver ou te dégager la vident ; elle se remplit vite dès que tu souffles (marcher ou rester sur place). Sous 15 %, tu es essoufflé : plus de course, coups faibles.${this.santeVue?.convalescence ? " En convalescence, elle ne remonte qu'à 60 %." : ""}`,
      ],
    };
    const [titre, texte] = textes[this.jaugeOuverte];
    bulle.innerHTML = `<strong>${titre}</strong><p>${texte}</p>`;
    bulle.hidden = false;
  }

  /** La recette dont on montre ce qui manque (ou « feu »). */
  private pourquoi: string | null = null;

  private listeManque(r: Recette): string {
    const lignes = ceQuiManque(r, this.inventaire);
    return lignes.length ? `<ul class="manque">${lignes.map((l) => `<li>${l}</li>`).join("")}</ul>` : "";
  }

  // ---------- À chaque image ----------

  compter(latenceMs: number): void {
    if (!this.progression.hidden && this.dureeAction > 0) {
      const part = 1 - Math.max(0, this.finAction - performance.now()) / this.dureeAction;
      this.progression.querySelector<HTMLElement>(".pourcent")!.textContent = `${Math.min(100, Math.round(part * 100))} %`;
    }
    this.images += 1;
    const instant = performance.now();
    if (instant - this.depuis < 500) return;
    this.ips.textContent = String(Math.round((this.images * 1000) / (instant - this.depuis)));
    this.latence.textContent = latenceMs > 0 ? String(Math.round(latenceMs)) : "–";
    // Une connexion lente se signale même sans les infos techniques (📶 orange près de l'heure).
    const alerte = this.element.querySelector<HTMLElement>(".latence-alerte");
    if (alerte) {
      alerte.hidden = !(latenceMs > 400);
      alerte.title = `Connexion lente : ${Math.round(latenceMs)} ms`;
    }
    this.images = 0;
    this.depuis = instant;
  }
}
