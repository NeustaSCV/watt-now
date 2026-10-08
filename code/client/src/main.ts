// Point d'entrée du client : accueil, connexion au monde, boucle de jeu.

import { Lots } from "./rendu/lots.ts";
import { fusionnerStatique } from "./rendu/fusion.ts";
import { ModePose, fantomeFeu, type GenrePose } from "./pose.ts";
import { raisonEmplacement } from "../../commun/src/emplacement.ts";
import { REGLAGES, appliquerReglages } from "../../commun/src/reglages.ts";
import { formaterDate, jourDuCalendrier } from "../../commun/src/calendrier.ts";
import { avecTouches } from "./touches.ts";
import * as THREE from "three";
import { INTENTION_REPOS, avancer, type Position } from "../../commun/src/deplacement.ts";
import { COMPTOIR, sortieIci, zoneDe, type LieuJouable } from "../../commun/src/lieux.ts";
import type { EteintVu } from "../../commun/src/eteints.ts";
import { cerclesSignature, type BruitAction } from "../../commun/src/signature.ts";
import { ALLURES, GESTE_TENU_MAX_S, type Allure } from "../../commun/src/regles.ts";
import { APPUIS_DEGAGEMENT, ESQUIVE, SEUIL_EPUISE, armeEnMain, freinSaisie } from "../../commun/src/combat.ts";
import type { AutreVu, SacVu, SanteVue, VueComptoir } from "../../commun/src/messages.ts";
import { PORTEE_CABLE_PANNEAU, type Charges } from "../../commun/src/energie.ts";
import type { Bienvenue, InstallationVue, MessageClient, MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS, lumierePortee, traineTravois, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { aFaim, aSoif, allureAutorisee, fatigue, type Besoins, type Gourde } from "../../commun/src/survie.ts";
import { estNuit, heureDeJeu, jourDeJeu } from "../../commun/src/temps.ts";
import { demanderIdentite } from "./accueil.ts";
import { Carte } from "./carte.ts";
import { Entrees, type Commande } from "./entrees.ts";
import { Hud } from "./hud.ts";
import { proposer, type ActionProposee, type Propositions } from "./interaction.ts";
import { Reseau } from "./reseau.ts";
import { FeuDeCamp } from "./rendu/feu.ts";
import { VueInstallation, creerEscabeau } from "./rendu/installations.ts";
import { FauneAmbiante, Volaille, type CriFaune } from "./rendu/faune.ts";
import { RAYON_ESCABEAU, estFruitier } from "../../commun/src/terrain.ts";
import { creerRuine } from "./rendu/ruine.ts";
import { creerHalte, estomperToits } from "./rendu/halte.ts";
import { animerComptoir, creerComptoir, lumieresComptoir } from "./rendu/comptoir.ts";
import { VueEteint } from "./rendu/eteint.ts";
import { VueAutre } from "./rendu/autres.ts";
import { Pluie } from "./rendu/pluie.ts";
import { Rodeurs } from "./rendu/rodeurs.ts";
import { Brume } from "./rendu/brume.ts";
import { Aides, type Aide } from "./aides.ts";
import { CONSEILS, watty } from "./watty.ts";
import { ModePhoto } from "./photo.ts";
import { attenuationMeteo, meteo, type Meteo, type Temps } from "../../commun/src/meteo.ts";
import { Sang, creerSacTombe, creerTas } from "./rendu/sang.ts";
import type { SourceLumiere } from "./rendu/lumieres.ts";
import { Personnage, gesteDAction } from "./rendu/personnage.ts";
import { chargerHumanoides } from "./rendu/humanoides.ts";
import { qualiteActuelle } from "./rendu/qualite.ts";
import { VueRessource, creerMare } from "./rendu/ressources.ts";
import { Scene } from "./rendu/scene.ts";
import { creerTerrain } from "./rendu/terrain.ts";
import { ecrire, lire } from "./stockage.ts";
import { Sonorisation } from "./son/audio.ts";
import { Bruiteur, dansLaBoutique } from "./son/bruiteur.ts";
import type { IdSon } from "./son/catalogue.ts";
import { RECETTES, type Recette } from "../../commun/src/recettes.ts";

const CLE_JETON = "watt.jeton";
/** En développement : `?heure=22` fige l'heure affichée, pour régler la nuit sans attendre. */
const HEURE_FORCEE = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get("heure") ?? Number.NaN) : Number.NaN;
/** En développement : `?meteo=pluie` (ou soleil, voile, couvert) force le temps affiché. Les règles du serveur ne changent pas. */
const METEO_FORCEE = import.meta.env.DEV ? (new URLSearchParams(location.search).get("meteo") as Temps | null) : null;
/** Au-delà de cet écart avec le serveur, on recale la position d'un coup. */
const ECART_RECALAGE = 1.5;

/** Lumières portées (Book 18 §2) : couleur, force, portée, vacillement. */
const LUMIERES_PORTEES = {
  torche: { couleur: 0xff8a3d, intensite: 5, portee: 9, vacillement: 0.8 },
  frontale: { couleur: 0xe6f0ff, intensite: 6, portee: 10, vacillement: 0 },
  lanterne: { couleur: 0xffd27a, intensite: 3.5, portee: 7, vacillement: 0.15 },
} as const;

const accueil = document.getElementById("accueil")!;
const voile = document.getElementById("voile")!;
const canvas = document.getElementById("monde") as HTMLCanvasElement;
const tactile = Entrees.estTactile();
const qualite = qualiteActuelle(tactile);

const scene = new Scene(canvas, qualite);
// En développement : les compteurs du moteur 3D, pour mesurer (appels de dessin, triangles) depuis la console.
if (import.meta.env.DEV) Object.assign(window, { __watt: { scene } });
// Le décor de chaque lieu, construit à la première visite et gardé ensuite.
const decors = new Map<LieuJouable, THREE.Group>();
function montrerDecor(lieu: LieuJouable): void {
  if (!decors.has(lieu)) {
    const g = new THREE.Group();
    if (lieu === "terrain") g.add(creerTerrain(), creerMare(), creerRuine());
    else if (lieu === "comptoir") g.add(creerComptoir());
    else g.add(creerHalte());
    decors.set(lieu, g);
    scene.scene.add(g);
  }
  for (const [l, g] of decors) g.visible = l === lieu;
}
const entrees = new Entrees(document.getElementById("joystick")!, canvas);
// Le son : la musique livrée par la session musique et les effets du catalogue (É5, lot 3).
const son = new Sonorisation(tactile);
const bruiteur = new Bruiteur(son);
/** L'atelier de chaque famille : quand il est installé, son thème joue au complet (moment-vitrine 4). */
const ATELIERS = { charbonniers: "forge", voltaiques: "banc_recharge", mecanistes: "pedalier" } as const;
/** Les sons qu'on fabrique d'avance en entrant dans le monde. */
const SONS_DE_BASE: IdSon[] = [
  "eteint_rale", "eteint_rale_coupe", "eteint_tete_craque", "eteint_pas", "eteint_souffle", "eteint_rale_rapide", "eteint_pas_presse",
  "sifflement", "impact", "coup_tete", "chute_corps", "saisie", "morsure", "esquive", "degagement",
  "geste_bois", "geste_pierre", "fouille", "feu_crepite",
];
function uiSon(geste: "ouvrir" | "fermer" | "valider"): void {
  if (personnage) son.jouer(`ui_${personnage.famille}_${geste}` as IdSon);
}

// Ce qui vient du serveur
const contenu = new THREE.Group();
scene.scene.add(contenu);
const ressources = new Map<number, VueRessource>();
const feux = new Map<number, FeuDeCamp>();
const installations = new Map<number, VueInstallation>();
let charges: Charges = {};
let lieu: LieuJouable = "terrain";
const eteints = new Map<number, VueEteint>();
/** Le bruit de l'action en cours (pour le cercle de signature). */
let bruitAction: BruitAction = "aucun";
/** En route sur la carte : on ne bouge plus jusqu'à l'arrivée. */
let enVoyage = false;
// ---------- Combat et santé (É3, lot 3) ----------
let modeCombat = false;
/** L'arme équipée pour le combat (P-005) ; null : la meilleure du sac. */
let armeEquipee: TypeObjet | null = null;
/** Un coup va jusqu'au bout (P-004) : pas de nouveau coup avant cet instant ; un appui pendant le geste est gardé pour la suite. */
let coupFiniLe = 0;
let coupEnAttente: boolean | null = null;
/** Depuis quand plus aucun Éteint n'est proche (retour automatique en exploration). */
let calmeDepuis = 0;
let sante: SanteVue = { points: 100, saignement: "aucun", blessures: [], convalescence: false };
let endurance = 100;
let saisi = 0;
let appuisLocaux = 0;
let prochaineGoutte = 0;
/** L'élan de l'esquive, joué tout de suite à l'écran (le serveur fait le même). */
let elan: { dx: number; dz: number; restant: number } | null = null;
const sacs = new Map<number, { vue: THREE.Group; donnees: SacVu }>();
/** Les autres joueurs du lieu (É4, lot 3). */
const autres = new Map<number, VueAutre>();
const pluie = new Pluie(scene.scene, qualite.niveau === "bas" ? 500 : qualite.niveau === "moyen" ? 900 : 1500);
let endormi = false;
const rodeurs = new Rodeurs();
scene.scene.add(rodeurs.objet);
const brume = new Brume(scene.scene);
const photo = new ModePhoto(document.getElementById("hud")!, () => {
  scene.lacetLibre = photo.actif ? (photo.reglages.angle * Math.PI) / 180 : null;
  if (photo.actif) scene.reglerZoom(photo.reglages.zoom);
});
const aides = new Aides();
/** Un conseil, la première fois seulement (Book 14 §4.3). */
function aider(aide: Aide): void {
  const texte = aides.premiereFois(aide);
  if (texte) hud.message(`💡 ${avecTouches(texte, tactile)}`, "aide");
}
/** Le guichet des Compteurs, tel qu'on le voit (au Carrefour seulement). */
let vueComptoir: VueComptoir | null = null;
const sang = new Sang(scene.scene);
/** Libellé de l'action en cours (pour animer le pédalier). */
let actionEnCours = "";
let inventaire: Inventaire = {};
let besoins: Besoins = { kcal: 2500, eau: 2.5, repos: 1 };
let gourde: Gourde = { contenu: "potable", litres: 1 };
let lumiere = false;
let occupe = false;
let debutMonde = Date.now();
/** Heure du serveur moins heure locale, en ms. */
let decalage = 0;

let reseau: Reseau | null = null;
let personnage: Personnage | null = null;
/** Position prédite localement (affichée) et dernière position confirmée par le serveur. */
let position: Position | null = null;
let positionServeur: Position | null = null;
let propositions: Propositions = { A: null, B: null, cible: null };
let nuitAnnoncee = false;

// L'anneau sous ce que le joueur vise (P-007, 0.3) : toujours visible, dessiné par-dessus les objets mais assez
// transparent pour qu'on comprenne qu'il est au sol ; un contour sombre sous le trait clair (lisible sur l'herbe, le
// béton, plus tard la neige) ; à la taille de ce qu'on vise ; une pulsation lente.
const visee = new THREE.Group();
for (const [r0, r1, couleur, opacite, ordre] of [
  [0.86, 1.04, 0x1d1712, 0.45, 20],
  [0.9, 1.0, 0xf6f1e4, 0.85, 21],
] as const) {
  const anneau = new THREE.Mesh(
    new THREE.RingGeometry(r0, r1, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: opacite, depthWrite: false, depthTest: false }),
  );
  anneau.renderOrder = ordre;
  visee.add(anneau);
}
visee.position.y = 0.03;
visee.visible = false;
scene.scene.add(visee);
/** Ajuste le cercle de visée à ce qu'on vise, et le fait battre doucement. */
function majVisee(rayon: number, instant: number): void {
  const r = Math.max(0.45, rayon) * (1 + Math.sin(instant / 420) * 0.04);
  visee.scale.set(r, 1, r);
}

/**
 * Le geste en cours sur ce qu'on vise (ramasser, couper, fouiller, pédaler…), ou la fabrication en cours :
 * l'anneau autour de la cible se remplit au fil du geste (Book 08 §3, décisions du 2026-10-08).
 * - geste court (5 s ou moins) : il dure tant qu'on tient A ; lâcher l'arrête (et on dit pourquoi) ;
 * - geste long, fabrication : un appui le lance, un autre l'arrête, avec le pourcentage près de l'anneau ;
 * - action sans cible (manger, panser…) : l'anneau se remplit aux pieds du personnage.
 * Règle générale : une action est immédiate, ou bien on voit sa progression (jamais un clic sans effet visible).
 */
/** Les gestes sur une cible qui se font sur-le-champ : un appui, un effet (pas d'anneau, pas de maintien). */
const VERBES_IMMEDIATS = new Set(["ajouter_bois", "porter", "assommer"]);
/** Le dernier rappel « garde A enfoncé » (pour ne pas le répéter à chaque clic). */
let rappelMaintien = 0;
function rappelerMaintien(): void {
  if (performance.now() - rappelMaintien < 8000) return;
  rappelMaintien = performance.now();
  hud.message(tactile ? "Garde le bouton enfoncé : l'anneau doit se remplir." : avecTouches("Garde {agir} enfoncé : l'anneau doit se remplir.", false));
}
/** La faune du terrain (2026-10-08) : la volaille (serveur), les lapins, le renard et les oiseaux de la mare (ici). */
const volaille = new Volaille();
const fauneAmbiante = new FauneAmbiante();
scene.scene.add(volaille.groupe, fauneAmbiante.groupe);
function crierFaune(cri: CriFaune, x: number, z: number): void {
  son.jouer(cri, { x, z });
}
/** Les ressources dessinées en lots (voir lots.ts). */
const lots = new Lots();
const EN_LOTS = new Set(["branche", "buche", "pierre"]);
/** L'escabeau porté, et les disques autour des fruitiers où il faut le poser (2026-10-08). */
const escabeauPorte = creerEscabeau();
const DISQUE_ESCABEAU = new THREE.RingGeometry(RAYON_ESCABEAU - 0.08, RAYON_ESCABEAU, 64).rotateX(-Math.PI / 2);
const disquesArbres = new Map<number, THREE.Mesh>();
function porteEscabeau(): boolean {
  for (const i of installations.values()) if (i.vue.etat.portee) return true;
  return false;
}
/**
 * Les grands disques des fruitiers : seulement quand on porte l'escabeau (porteur du projet, 2026-10-08). Sinon,
 * viser un arbre ne montre que le petit cercle autour du tronc. Vert si l'escabeau tomberait dedans, ou y est posé.
 */
function majDisques(porte: boolean): void {
  escabeauPorte.visible = porte;
  for (const [id, disque] of disquesArbres) {
    const r = ressources.get(id);
    if (!r) continue;
    disque.visible = porte;
    if (!disque.visible) continue;
    let pose = false;
    for (const i of installations.values()) {
      if (i.vue.type === "escabeau" && !i.vue.etat.portee && Math.hypot(i.vue.x - r.donnees.x, i.vue.z - r.donnees.z) <= RAYON_ESCABEAU) pose = true;
    }
    // Porté : le disque s'allume quand l'escabeau tomberait dedans.
    const dedans =
      porte && position !== null && Math.hypot(position.x + Math.sin(position.o) * 0.9 - r.donnees.x, position.z + Math.cos(position.o) * 0.9 - r.donnees.z) <= RAYON_ESCABEAU;
    const m = disque.material as THREE.MeshBasicMaterial;
    m.color.setHex(pose || dedans ? 0x8fdc7a : 0xffe6a0);
    m.opacity = dedans ? 0.9 : 0.55;
  }
}
/** Le jour du calendrier déjà appliqué aux ressources (0 : pas encore). */
let jourAffiche = 0;
/** Le bois de chaque feu, pour montrer ce qu'on vient d'y ajouter. */
const boisDesFeux = new Map<number, number>();
let maintien: {
  cible: { x: number; z: number } | null;
  /** A a été lâché depuis le début du geste. */
  relache: boolean;
  /** Le geste se fait en tenant A (décidé quand le serveur annonce sa durée). */
  tenu: boolean;
  /** Une fabrication : le tas de matières posé devant soi. */
  tas?: THREE.Object3D;
  debut: number;
  duree: number;
} | null = null;
/** La fabrication demandée, en attendant que le serveur la commence (pour poser le tas de matières). */
let fabricationDemandee: { nom: string; ingredients: Inventaire; x: number; z: number } | null = null;
const MATIERE_PROGRES = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide });
const anneauProgres = new THREE.Mesh(new THREE.BufferGeometry(), MATIERE_PROGRES);
anneauProgres.position.y = 0.035;
anneauProgres.visible = false;
scene.scene.add(anneauProgres);
let progresDessine = -1;
/** Remplit l'anneau de progression (0 à 1), dans le sens des aiguilles d'une montre depuis le haut de l'écran. */
function dessinerProgres(progres: number): void {
  const p = Math.min(1, Math.max(0, progres));
  const pas = Math.round(p * 60) / 60;
  if (pas === progresDessine) return;
  progresDessine = pas;
  anneauProgres.geometry.dispose();
  anneauProgres.geometry = new THREE.RingGeometry(0.4, 0.52, 48, 1, Math.PI / 2, -Math.PI * 2 * Math.max(0.001, pas)).rotateX(-Math.PI / 2);
}

function envoyer(message: MessageClient): void {
  reseau?.envoyer(message);
}

/** L'écran de chargement (Book 21 §5.2.7) : Watty, une batterie qui se charge, un conseil des Compteurs. */
function ecranDeChargement(): void {
  // Les corps et les animations se chargent pendant la connexion.
  void chargerHumanoides().catch((e) => console.warn("Personnages indisponibles :", e));
  const conseil = CONSEILS[Math.floor(Math.random() * CONSEILS.length)]!;
  voile.innerHTML = `<div class="chargement">${watty("pouce", 130)}
    <div class="batterie"><span></span></div>
    <p class="etat-chargement">Connexion au monde…</p>
    <p class="conseil"><b>Les Compteurs conseillent :</b> ${conseil}</p></div>`;
  voile.hidden = false;
}

function afficherVoile(texte: string, bouton?: { libelle: string; action: () => void }): void {
  voile.innerHTML = "";
  const p = document.createElement("p");
  p.textContent = texte;
  voile.append(p);
  if (bouton) {
    const b = document.createElement("button");
    b.textContent = bouton.libelle;
    b.addEventListener("click", bouton.action);
    voile.append(b);
  }
  voile.hidden = false;
}

const hud = new Hud(
  document.getElementById("hud")!,
  qualite.niveau,
  tactile,
  () => {
    reseau?.fermer();
    ecrire(CLE_JETON, null);
    location.reload();
  },
  {
    manger: (objet) => envoyer({ t: "manger", objet }),
    boire: () => envoyer({ t: "boire" }),
    construireFeu: (dakota = false) => {
      if (!position) return;
      // On choisit d'abord où le monter (2026-10-08).
      hud.fermerPanneaux();
      commencerPose("feu", null, fantomeFeu(dakota), 0.75, dakota ? "Foyer Dakota" : "Feu de camp", dakota);
    },
    lumiere: () => envoyer({ t: "lumiere", allumee: !lumiere }),
    panser: () => envoyer({ t: "panser" }),
    comptoir: (op) => envoyer({ t: "comptoir", op }),
    echange: (op) => envoyer({ t: "echange", op }),
    passerTutoriel: () => envoyer({ t: "tutoriel_passer" }),
    jeter: (objet, quantite) => envoyer({ t: "jeter", objet, quantite }),
    demonter: (objet) => envoyer({ t: "demonter", objet }),
    equiper: (objet) => envoyer({ t: "equiper", objet }),
    coffre: (id, sens, objet, quantite) => envoyer({ t: "coffre", id, sens, objet, quantite }),
    fabriquer: (r) => {
      if (!position) return;
      // Le tas de matières : là où l'installation va se dresser, ou à nos pieds pour un objet.
      hud.fermerPanneaux();
      if ("installation" in r.produit) {
        // Une installation : on choisit d'abord où la construire, et dans quel sens (2026-10-08).
        const modele = new VueInstallation({ id: -1, type: r.produit.installation, x: 0, z: 0, o: 0, etat: {} }).objet;
        modele.position.set(0, 0, 0);
        modele.rotation.set(0, 0, 0);
        commencerPose("installation", r, modele, 1.1, r.nom);
        return;
      }
      // Un objet : à nos pieds.
      fabricationDemandee = { nom: r.nom, ingredients: r.ingredients, x: position.x + Math.sin(position.o) * 0.75, z: position.z + Math.cos(position.o) * 0.75 };
      envoyer({ t: "fabriquer", recette: r.id });
    },
  },
  (c) => entrees.commande(c),
  { appuyer: () => entrees.appuyerA(), relacher: () => entrees.relacherA() },
);

const carte = new Carte(document.getElementById("carte")!, (vers) => envoyer({ t: "voyager", vers }));
hud.surPanneau = (ouvert) => uiSon(ouvert ? "ouvrir" : "fermer");
hud.surSon = () => son.basculer();
hud.surAttendreTouche = (f) => entrees.attendreTouche(f);

function installer(message: Bienvenue): void {
  voile.hidden = true;
  lieu = message.lieu;
  montrerDecor(lieu);
  enVoyage = false;
  carte.arriver();
  if (!personnage) {
    personnage = new Personnage(message.moi.famille, message.moi.apparence);
    scene.scene.add(personnage.objet);
    // L'escabeau dans les bras, devant soi (visible seulement quand on le porte).
    escabeauPorte.position.set(0, 0.35, 0.5);
    escabeauPorte.rotation.x = -0.15;
    escabeauPorte.scale.setScalar(0.9);
    escabeauPorte.visible = false;
    personnage.objet.add(escabeauPorte);
  }
  position = message.position;
  positionServeur = message.position;
  debutMonde = message.temps.debutMonde;
  decalage = message.temps.serveur - Date.now();
  scene.suivre(position.x, position.z, 0, true);

  contenu.clear();
  ressources.clear();
  feux.clear();
  installations.clear();
  for (const i of message.installations) ajouterInstallation(i);
  disquesArbres.clear();
  lots.vider();
  jourAffiche = 0;
  volaille.maj(message.animaux ?? []);
  volaille.groupe.visible = message.lieu === "terrain";
  if (message.lieu === "terrain") fauneAmbiante.activer(message.moi.id);
  else fauneAmbiante.desactiver();
  for (const r of message.ressources) {
    const vue = new VueRessource(r);
    // Même image, bien moins d'appels de dessin (2026-10-08) : les ressources nombreuses et identiques sont
    // dessinées en lots ; les autres ont leurs morceaux de même matériau fondus.
    if (EN_LOTS.has(r.type)) lots.prendre(vue);
    else fusionnerStatique(vue.objet);
    ressources.set(r.id, vue);
    contenu.add(vue.objet);
    // Le disque où l'escabeau doit être posé pour cueillir : affiché quand il sert (on le porte, ou on vise l'arbre).
    if (estFruitier(r.type)) {
      const disque = new THREE.Mesh(DISQUE_ESCABEAU, new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.55, depthWrite: false }));
      disque.position.set(r.x, 0.04, r.z);
      disque.visible = false;
      disquesArbres.set(r.id, disque);
      contenu.add(disque);
    }
  }
  lots.construire();
  contenu.add(lots.groupe);
  for (const f of message.feux) {
    const vue = new FeuDeCamp(f);
    feux.set(f.id, vue);
    contenu.add(vue.objet);
  }
  eteints.clear();
  majEteints(message.eteints);
  autres.clear();
  sang.vider();
  sacs.clear();
  majSacs(message.sacs);
  sante = message.sante;
  endurance = message.endurance;
  saisi = 0;
  hud.majWotts(message.wotts);
  hud.majTutoriel(message.tutoriel);
  hud.majQuetes(message.quetes);
  armeEquipee = message.arme;
  hud.majArme(armeEquipee);
  aides.charger(message.moi.pseudo);
  if (lieu === "station") aider("halte");
  if (lieu === "comptoir") aider("comptoir");
  vueComptoir = message.comptoir ?? null;
  if (vueComptoir) hud.majComptoir(vueComptoir);
  elan = null;
  modeCombat = false;
  personnage.blesser(sante.blessures.length);
  personnage.effondrer(false);
  personnage.agir(null);
  hud.majSante(sante, endurance, inventaire.pansement ?? 0);
  inventaire = message.inventaire;
  besoins = message.besoins;
  gourde = message.gourde;
  lumiere = message.lumiere;
  charges = message.charges;
  occupe = false;
  hud.identite(message.moi.pseudo, message.moi.famille);
  son.entrer({
    famille: message.moi.famille,
    lieu: lieu === "station" ? "halte" : lieu,
    nuit: estNuit(heureDeJeu(Date.now() + decalage, debutMonde)),
    atelier: message.installations.some((i) => i.type === ATELIERS[message.moi.famille]),
    // Tutoriel : la Vie n'entre qu'au premier feu (étape 3, moment-vitrine 2).
    attendreFeu: message.tutoriel !== null && message.tutoriel.etape <= 2,
  });
  son.prechauffer([...SONS_DE_BASE, `ui_${message.moi.famille}_ouvrir`, `ui_${message.moi.famille}_fermer`, `ui_${message.moi.famille}_valider`] as IdSon[]);
  hud.majSon(!son.coupe);
  hud.majInventaire(inventaire);
  hud.majBesoins(besoins, gourde);
  hud.majLumiere(lumiere);
  hud.majCharges(charges);
  hud.masquerProgression();
  document.getElementById("joystick")!.hidden = !tactile;
}

function recevoir(message: MessageServeur): void {
  switch (message.t) {
    case "bienvenue":
      installer(message);
      return;
    case "etat": {
      positionServeur = message.position;
      if (!position) return;
      const ecart = Math.hypot(message.position.x - position.x, message.position.z - position.z);
      // Le serveur fait autorité : gros écart → recalage ; à l'arrêt → on glisse vers sa position.
      if (ecart > ECART_RECALAGE) position = { ...message.position };
      return;
    }
    case "pong":
      decalage = message.serveur + (reseau?.latence ?? 0) / 2 - Date.now();
      return;
    case "inventaire":
      // Ce qui vient d'entrer dans le sac s'affiche au-dessus du personnage.
      for (const [type, n] of Object.entries(message.inventaire) as [keyof Inventaire, number][]) {
        const avant = inventaire[type] ?? 0;
        if (n > avant) hud.gain(type, n - avant);
      }
      inventaire = message.inventaire;
      hud.majInventaire(inventaire);
      return;
    case "besoins":
      besoins = message.besoins;
      gourde = message.gourde;
      hud.majBesoins(besoins, gourde);
      return;
    case "ressource":
      ressources.get(message.id)?.disponible(message.disponible);
      return;
    case "feu": {
      const existant = feux.get(message.feu.id);
      // Du bois en plus : on le montre tout de suite (ajouter du bois est immédiat).
      const boisAvant = boisDesFeux.get(message.feu.id);
      if (boisAvant !== undefined && message.feu.bois > boisAvant + 0.05) {
        hud.pastille("feu_de_camp", `Feu : ${String(Math.round(message.feu.bois * 10) / 10).replace(".", ",")} kg de bois`);
        son.jouer("geste_bois");
      }
      boisDesFeux.set(message.feu.id, message.feu.bois);
      if (existant) existant.mettreAJourEtat(message.feu);
      else {
        const vue = new FeuDeCamp(message.feu);
        feux.set(message.feu.id, vue);
        contenu.add(vue.objet);
      }
      return;
    }
    case "installation":
      hud.majCoffre(message.installation);
      if (personnage && message.installation.type === ATELIERS[personnage.famille]) son.atelier();
      ajouterInstallation(message.installation);
      return;
    case "installation_retiree": {
      const vue = installations.get(message.id);
      if (vue) contenu.remove(vue.objet);
      installations.delete(message.id);
      return;
    }
    case "charges":
      charges = message.charges;
      hud.majCharges(charges);
      return;
    case "action":
      if (message.etat === "debut") {
        occupe = true;
        actionEnCours = message.libelle;
        bruitAction = message.bruit;
        // Une fabrication : le tas de matières devant soi, et l'anneau autour.
        if (fabricationDemandee && fabricationDemandee.nom === message.libelle) {
          const f = fabricationDemandee;
          const tas = creerTas(f.ingredients);
          tas.position.set(f.x, 0, f.z);
          contenu.add(tas);
          maintien = { cible: { x: f.x, z: f.z }, relache: true, tenu: false, tas, debut: 0, duree: 0 };
        }
        fabricationDemandee = null;
        // Une action sans cible (manger, boire, panser…) : l'anneau se remplit aux pieds du personnage.
        const sansCible = !maintien;
        if (!maintien) maintien = { cible: null, relache: true, tenu: false, debut: 0, duree: 0 };
        {
          maintien.tenu = !sansCible && !maintien.tas && message.duree <= GESTE_TENU_MAX_S;
          // Geste court, A déjà lâché avant qu'il commence : on s'arrête tout de suite, et on dit pourquoi.
          if (maintien.tenu && maintien.relache) {
            envoyer({ t: "annuler" });
            rappelerMaintien();
          }
          // Un geste long repris : l'anneau repart de la part déjà faite.
          maintien.debut = performance.now() - (message.deja ?? 0) * message.duree * 1000;
          maintien.duree = message.duree * 1000;
          progresDessine = -1;
        }
        // Un geste court se lit sur l'anneau seul ; un geste long et une fabrication ont aussi le pourcentage à côté.
        if (!maintien.tenu) hud.debutAction(message.libelle, message.duree, message.deja ?? 0);
        if ((message.deja ?? 0) > 0) hud.message(`Tu reprends là où tu t'étais arrêté (${Math.round((message.deja ?? 0) * 100)} %).`);
        bruiteur.debutAction(message.libelle, message.bruit);
        personnage?.agir(gesteDAction(message.libelle));
      } else {
        bruiteur.finAction(message.etat === "fin");
        personnage?.agir(null);
        // Une recette réussie : le signal musical et la coche de l'interface.
        if (message.etat === "fin" && RECETTES.some((r) => r.nom === actionEnCours)) {
          son.signal("recette");
          uiSon("valider");
        }
        occupe = false;
        actionEnCours = "";
        bruitAction = "aucun";
        hud.masquerProgression();
        if (maintien?.tas) contenu.remove(maintien.tas);
        maintien = null;
        anneauProgres.visible = false;
      }
      return;
    case "info":
      hud.message(message.texte);
      if (message.texte === "Échange conclu.") son.signal("echange");
      return;
    case "lumiere":
      lumiere = message.allumee;
      hud.majLumiere(lumiere);
      return;
    case "expulse":
      return;
    case "eteints":
      majEteints(message.eteints);
      return;
    case "animaux":
      volaille.maj(message.animaux);
      return;
    case "reglages":
      // Les réglages d'équilibrage du serveur (vitesses, rythmes, prix) : le client calcule pareil.
      appliquerReglages(message.reglages);
      return;
    case "sante":
      sante = message.sante;
      endurance = message.endurance;
      if (message.saisi === 0) appuisLocaux = 0;
      else aider("saisie");
      saisi = message.saisi;
      personnage?.blesser(sante.blessures.length);
      hud.majSante(sante, endurance, inventaire.pansement ?? 0);
      return;
    case "coup": {
      // Le sang : un peu plus marqué que la moyenne, aucune plaie visible (Book 21 §3.5).
      const vue = eteints.get(message.id);
      vue?.toucher();
      bruiteur.coup(message.resultat, message);
      if (message.resultat === "a_terre") hud.message(avecTouches("Il est à terre : frappe encore ({agir}) pour l'achever, avant qu'il se relève !", tactile));
      sang.eclabousser(message.x, message.z, message.resultat === "detruit" ? 1.5 : 1.25, message.resultat === "detruit" ? 2 : 1);
      if (message.resultat === "detruit") window.setTimeout(() => sang.tacher(message.x, message.z, 0.8), 400);
      return;
    }
    case "morsure":
      bruiteur.morsure();
      personnage?.toucher();
      aider("saignement");
      hud.flash();
      if (position) sang.eclabousser(position.x, position.z, 1.3, 0.8);
      return;
    case "effondrement":
      bruiteur.effondrement();
      personnage?.effondrer();
      window.setTimeout(() => aider("effondrement"), 6500);
      hud.effondrement();
      return;
    case "sacs":
      majSacs(message.sacs);
      return;
    case "wotts":
      hud.majWotts(message.wotts);
      return;
    case "rapport":
      hud.rapport(message.rapport);
      return;
    case "positions":
      for (let i = 0; i + 3 < message.p.length; i += 4) autres.get(message.p[i]!)?.deplacer(message.p[i + 1]!, message.p[i + 2]!, message.p[i + 3]!);
      return;
    case "autres":
      majAutres(message.joueurs);
      return;
    case "quetes":
      hud.majQuetes(message.quetes);
      break;
    case "arme":
      armeEquipee = message.arme;
      hud.majArme(armeEquipee);
      break;
    case "alarme":
      // Les boîtes de conserve tintent (P-002) : le serveur le dit aussi par écrit.
      bruiteur.alarme({ x: message.x, z: message.z });
      break;
    case "tutoriel":
      hud.majTutoriel(message.tutoriel);
      return;
    case "sommeil":
      if (message.dort !== endormi) son.dormir(message.dort);
      endormi = message.dort;
      hud.dort(message.dort, message.dansUnAbri);
      return;
    case "demande_echange":
      hud.demandeEchange(message.de);
      return;
    case "echange":
      hud.majEchange(message.echange);
      return;
    case "comptoir":
      if (vueComptoir && hud.guichetOuvert) uiSon("valider");
      vueComptoir = message.comptoir;
      hud.majComptoir(message.comptoir);
      return;
    case "voyage":
      enVoyage = true;
      occupe = false;
      hud.fermerPanneaux();
      hud.masquerProgression();
      carte.voyager(message.de, message.vers, message.duree);
      return;
  }
}

/** Les autres joueurs croisés là : on crée, on met à jour, on retire ceux qui sont partis. */
function majAutres(liste: AutreVu[]): void {
  const vus = new Set(liste.map((a) => a.id));
  for (const [id, v] of autres) {
    if (vus.has(id)) continue;
    contenu.remove(v.objet);
    autres.delete(id);
  }
  for (const a of liste) {
    const v = autres.get(a.id);
    if (v) v.maj(a);
    else {
      const nouvelle = new VueAutre(a);
      autres.set(a.id, nouvelle);
      contenu.add(nouvelle.objet);
    }
  }
}

/** Les sacs tombés au sol (effondrement) : on peut revenir les chercher. */
function majSacs(liste: SacVu[]): void {
  for (const [id, s] of sacs) {
    if (liste.some((l) => l.id === id)) continue;
    contenu.remove(s.vue);
    sacs.delete(id);
  }
  for (const s of liste) {
    if (sacs.has(s.id)) continue;
    const vue = s.jete ? creerTas(s.contenu ?? {}) : creerSacTombe(s.aMoi);
    vue.position.set(s.x, 0, s.z);
    contenu.add(vue);
    sacs.set(s.id, { vue, donnees: s });
  }
}

/** Les Éteints du lieu : on crée, on met à jour, on retire ceux qui ne sont plus là. */
function majEteints(liste: EteintVu[]): void {
  const vus = new Set<number>();
  for (const e of liste) {
    vus.add(e.id);
    const vue = eteints.get(e.id);
    if (vue) vue.maj(e);
    else {
      const nouvelle = new VueEteint(e);
      eteints.set(e.id, nouvelle);
      contenu.add(nouvelle.objet);
    }
  }
  for (const [id, vue] of eteints) {
    if (vus.has(id)) continue;
    contenu.remove(vue.objet);
    eteints.delete(id);
  }
}

/**
 * Le cercle de signature au sol (Book 06 §3.3) : jusqu'où porte le bruit qu'on fait (blanc),
 * et la nuit, jusqu'où se voit la lumière qu'on porte (ambre). Discret, mais toujours là.
 */
function cercle(couleur: number, opacite: number): THREE.LineLoop {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
  }
  const l = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color: couleur, transparent: true, opacity: opacite, dashSize: 0.05, gapSize: 0.04, depthWrite: false }),
  );
  l.computeLineDistances();
  l.position.y = 0.06;
  l.visible = false;
  scene.scene.add(l);
  return l;
}
const cercleSon = cercle(0xf2efe6, 0.5);
const cercleLumiere = cercle(0xffc46b, 0.45);

function majCercles(dt: number, allure: Allure, bouge: boolean, nuit: boolean): void {
  if (!position) return;
  const portee = lumiere ? lumierePortee(inventaire) : null;
  const c = cerclesSignature({ x: position.x, z: position.z, allure, bouge, action: bruitAction, lumiere: portee ? (OBJETS[portee].lumiere ?? null) : null, nuit });
  // La pluie couvre le bruit (Book 13 §4) : le cercle rétrécit.
  c.son *= attenuationMeteo(meteo(Date.now() + decalage, debutMonde), "son");
  for (const [ligne, rayon] of [
    [cercleSon, c.son],
    [cercleLumiere, c.lumiere],
  ] as const) {
    const actuel = ligne.scale.x;
    const vise = Math.max(0.01, rayon);
    const r = actuel + (vise - actuel) * Math.min(1, dt * 5);
    ligne.scale.set(r, 1, r);
    ligne.position.x = position.x;
    ligne.position.z = position.z;
    // En mode photo, l'image doit rester propre : pas de cercle.
    ligne.visible = r > 1.2 && !enVoyage && !photo.actif;
  }
}

function ajouterInstallation(i: InstallationVue): void {
  const existante = installations.get(i.id);
  if (existante) return existante.majEtat(i);
  const vue = new VueInstallation(i);
  installations.set(i.id, vue);
  contenu.add(vue.objet);
  cabler();
}

/** Le câble qui relie chaque panneau solaire au banc de recharge le plus proche (à portée). */
const cables = new THREE.Group();
contenu.add(cables);
function cabler(): void {
  cables.clear();
  if (!contenu.children.includes(cables)) contenu.add(cables);
  const vues = [...installations.values()].map((v) => v.vue);
  for (const p of vues.filter((v) => v.type === "panneau_solaire")) {
    const bancs = vues.filter((v) => v.type === "banc_recharge" && Math.hypot(v.x - p.x, v.z - p.z) <= PORTEE_CABLE_PANNEAU);
    const banc = bancs.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    if (!banc) continue;
    const debut = new THREE.Vector3(p.x, 0.5, p.z - 0.2);
    const fin = new THREE.Vector3(banc.x, 0.65, banc.z);
    const milieu = debut.clone().lerp(fin, 0.5).setY(0.04);
    const courbe = new THREE.QuadraticBezierCurve3(debut, milieu, fin);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(courbe, 16, 0.015, 4), new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.6 }));
    tube.castShadow = true;
    cables.add(tube);
  }
}

/** Un indice, au plus une fois par période pour chaque sorte : on aide sans rabâcher. */
const derniersIndices = new Map<string, number>();
function indice(sorte: string, texte: string, periodeMs = 20_000): void {
  const maintenant = performance.now();
  if (maintenant - (derniersIndices.get(sorte) ?? -Infinity) < periodeMs) return;
  derniersIndices.set(sorte, maintenant);
  hud.message(texte);
}

function agir(a: ActionProposee | null): void {
  // Rien à portée : on dit comment trouver quelque chose à faire, plutôt que de ne rien faire.
  if (!a) return indice("rien", "Rien à portée de main : approche-toi d'un objet. Quand un cercle apparaît au sol, tu peux agir.");
  if ("message" in a) envoyer(a.message);
  else if ("examiner" in a) hud.message(a.examiner);
  else if ("ouvrirCoffre" in a) {
    const c = installations.get(a.ouvrirCoffre);
    if (c) hud.ouvrirCoffre(c.vue);
  } else if ("ouvrirGuichet" in a) {
    if (vueComptoir) hud.ouvrirComptoir(vueComptoir);
  } else if ("ouvrirCarte" in a) {
    hud.fermerPanneaux();
    carte.ouvrir(lieu, a.ouvrirCarte);
  } else hud.basculerFabrication(true);
}

/** Le choix de l'emplacement d'une construction (2026-10-08) : le fantôme, puis construire ici, tourner ou annuler. */
const pose = new ModePose(canvas);
scene.scene.add(pose.groupe, pose.cerclePortee);
function commencerPose(genre: GenrePose, recette: Recette | null, modele: THREE.Object3D, rayon: number, nom: string, dakota = false): void {
  if (!position) return;
  // Par défaut, la construction regarde le personnage (au quart de tour près).
  pose.o = Math.round((position.o + Math.PI) / (Math.PI / 2)) * (Math.PI / 2);
  pose.demarrer(genre, recette, modele, rayon, dakota, position, scene.camera);
  hud.afficherPose(nom);
}
function finirPose(choix: "tourner" | "annuler" | "poser"): void {
  if (!pose.actif || !position) return;
  if (choix === "tourner") return pose.tourner();
  if (choix === "annuler") {
    pose.arreter();
    hud.masquerPose();
    return;
  }
  if (pose.raison) return hud.message(pose.raison);
  const { genre, recette, dakota } = pose.actif;
  if (genre === "feu") envoyer({ t: "construire_feu", x: pose.x, z: pose.z, ...(dakota ? { dakota } : {}) });
  else if (recette) {
    // Le tas de matières, là où l'installation va se dresser.
    fabricationDemandee = { nom: recette.nom, ingredients: recette.ingredients, x: pose.x, z: pose.z };
    envoyer({ t: "fabriquer", recette: recette.id, x: pose.x, z: pose.z, o: pose.o });
  }
  pose.arreter();
  hud.masquerPose();
}
hud.surPose = finirPose;

function executer(c: Commande): void {
  // Pendant le choix de l'emplacement : A construit, la touche de lumière tourne, B ou Échap annulent.
  if (pose.actif) {
    if (c === "A") return finirPose("poser");
    if (c === "lumiere") return finirPose("tourner");
    if (c === "B" || c === "fermer") return finirPose("annuler");
    if (c === "A_court" || c === "A_long") return;
  }
  switch (c) {
    case "A":
      // En combat, A se juge au relâchement (coup rapide ou appuyé).
      if (modeCombat) return;
      if (occupe) return envoyer({ t: "annuler" });
      // Un geste sur ce qu'on vise se fait en tenant A (sauf dormir : on ne tient pas une touche toute la nuit).
      {
        const a = propositions.A;
        if (a && "message" in a && a.message.t === "interagir" && a.message.verbe !== "dormir" && !VERBES_IMMEDIATS.has(a.message.verbe)) {
          maintien = { cible: propositions.cible, relache: false, tenu: true, debut: 0, duree: 0 };
        } else maintien = null;
      }
      {
        const a = propositions.A;
        if (a && "message" in a && a.message.t === "interagir" && a.message.verbe === "assommer") personnage?.frapper(false);
      }
      agir(propositions.A);
      return;
    case "A_court":
    case "A_long":
      // Hors combat : lâcher A arrête le geste en cours.
      if (!modeCombat && maintien) {
        maintien.relache = true;
        // Seul un geste court s'arrête quand on lâche ; un geste long continue jusqu'au prochain appui.
        if (occupe && maintien.tenu && maintien.duree > 0) {
          envoyer({ t: "annuler" });
          // Lâché bien avant la fin : on dit qu'il fallait tenir.
          if (performance.now() - maintien.debut < maintien.duree * 0.9) rappelerMaintien();
        }
        return;
      }
      if (!modeCombat || enVoyage || carte.ouverte) return;
      // Un coup va jusqu'au bout (P-004) : pendant le geste, on garde un seul appui, joué à la fin.
      if (performance.now() < coupFiniLe) {
        coupEnAttente = c === "A_long";
        return;
      }
      frapper(c === "A_long");
      return;
    case "B":
      if (modeCombat) return combatB();
      // Pendant une action, n'importe quelle touche d'action l'arrête.
      if (occupe) return envoyer({ t: "annuler" });
      agir(propositions.B);
      return;
    case "photo":
      photo.basculer(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde), scene.niveauZoom);
      return;
    case "photo_panneau":
      photo.masquerPanneau();
      return;
    case "mode":
      modeCombat = !modeCombat;
      calmeDepuis = 0;
      return;
    case "sac":
      hud.basculerSac();
      return;
    case "fabriquer":
      hud.basculerFabrication();
      return;
    case "fermer":
      if (carte.ouverte) return carte.fermer();
      if (occupe && maintien?.tas) envoyer({ t: "annuler" });
      hud.fermerPanneaux();
      return;
    case "carte":
      hud.fermerPanneaux();
      carte.basculer(lieu, position ? (sortieIci(lieu, position.x, position.z)?.vers ?? null) : null);
      return;
    case "lumiere":
      if (!lumierePortee(inventaire)) return hud.message("Tu n'as rien pour t'éclairer : une torche, une lampe frontale ou une lanterne. Chacune est dans le kit de départ d'une famille : échange-la avec un autre joueur.");
      envoyer({ t: "lumiere", allumee: !lumiere });
      return;
    case "tourner+":
      scene.tourner(1);
      return;
    case "tourner-":
      scene.tourner(-1);
      return;
  }
}

/** B en combat : se dégager si l'on est saisi, esquiver sinon (Book 08 §3.3). */
function combatB(): void {
  if (!position || enVoyage) return;
  if (saisi > 0) {
    appuisLocaux++;
    envoyer({ t: "degager" });
    bruiteur.degagement();
    return;
  }
  if (endurance < 14) return hud.message("Trop essoufflé pour esquiver.");
  const entree = entrees.lire();
  let { dx, dz } = scene.versMonde(entree.x, entree.y);
  // Sans direction, on recule.
  if (Math.hypot(dx, dz) < 0.01) {
    dx = -Math.sin(position.o);
    dz = -Math.cos(position.o);
  }
  const l = Math.hypot(dx, dz);
  elan = { dx: dx / l, dz: dz / l, restant: ESQUIVE.duree };
  envoyer({ t: "esquiver", dx: dx / l, dz: dz / l });
  bruiteur.esquive();
  personnage?.esquiver();
}

/**
 * Le mode Combat se met tout seul quand un Éteint debout approche (option par défaut en 0a, Book 08 §3.3),
 * et revient en exploration quand plus rien ne menace depuis quelques secondes.
 */
function majMode(dt: number): void {
  if (!position) return;
  let plusProche = Infinity;
  for (const e of eteints.values()) {
    if (e.etat === "dormant" || e.etat === "detruit" || e.etat === "a_terre") continue;
    plusProche = Math.min(plusProche, Math.hypot(e.objet.position.x - position.x, e.objet.position.z - position.z));
  }
  if (plusProche < 6 && !modeCombat && calmeDepuis >= 0) {
    modeCombat = true;
    calmeDepuis = -1;
    hud.message(avecTouches("Un Éteint ! Mode Combat : {agir} pour frapper (maintenir : à la tête), {examiner} pour esquiver.", tactile));
  }
  if (plusProche > 10) {
    calmeDepuis = Math.max(0, calmeDepuis) + dt;
    if (calmeDepuis > 3 && modeCombat && saisi === 0) modeCombat = false;
  } else if (plusProche < 6) calmeDepuis = -1;
  hud.mode(modeCombat, plusProche < 10);
}

async function entrer(messageInitial = ""): Promise<void> {
  let jeton = lire(CLE_JETON);
  if (!jeton) {
    const identite = await demanderIdentite(accueil, messageInitial);
    jeton = identite.jeton;
    ecrire(CLE_JETON, jeton);
  } else {
    accueil.hidden = true;
  }
  ecranDeChargement();

  reseau = new Reseau(jeton, {
    message: recevoir,
    perdue: (tentative) => afficherVoile(`Connexion perdue. Nouvelle tentative (${tentative})…`),
    jetonRefuse: () => {
      reseau = null;
      ecrire(CLE_JETON, null);
      voile.hidden = true;
      void entrer("Ta session a expiré : reconnecte-toi.");
    },
    remplace: () =>
      afficherVoile("Ton personnage est ouvert sur un autre appareil.", {
        libelle: "Reprendre ici",
        action: () => reseau?.ouvrir(),
      }),
    // Rien fait depuis quelques minutes : le serveur a mis la partie en pause (2026-10-08).
    inactif: () =>
      afficherVoile(
        `Tu n'as pas bougé depuis ${REGLAGES.inactivite_min} minutes : la partie s'est mise en pause. Hors ligne, ta faim, ta soif et ta fatigue sont gelées.\n\nConseil : avant de partir, va dormir dans ton abri. Se déconnecter dans son abri compte comme une nuit complète.`,
        { libelle: "Reprendre", action: () => reseau?.ouvrir() },
      ),
  });
  reseau.ouvrir();
}

function sourcesDeLumiere(): SourceLumiere[] {
  const sources: SourceLumiere[] = [];
  for (const f of feux.values()) {
    const s = f.source();
    if (s) sources.push(s);
  }
  // La lampe des autres, la nuit : chaque famille a la sienne (Book 18 §4.2).
  for (const a of autres.values()) {
    if (!a.donnees.lumiere) continue;
    const genre = a.donnees.famille === "charbonniers" ? "torche" : a.donnees.famille === "voltaiques" ? "frontale" : "lanterne";
    sources.push({ x: a.objet.position.x, y: 1.7, z: a.objet.position.z, ...LUMIERES_PORTEES[genre] });
  }
  // Au Carrefour, la lumière électrique ne s'éteint jamais.
  if (lieu === "comptoir") sources.push(...lumieresComptoir());
  const portee = lumierePortee(inventaire);
  if (lumiere && portee && position) {
    const genre = OBJETS[portee].lumiere!;
    sources.push({ x: position.x, y: 1.7, z: position.z, ...LUMIERES_PORTEES[genre] });
  }
  return sources;
}

let dernier = performance.now();
/**
 * Les images par seconde de cet appareil, envoyées chaque minute au serveur (mesures du test familial, Book 17 §6 ;
 * objectif : 30 images par seconde sur un iPhone 13). Seulement en jeu, onglet visible.
 */
const imagesMesurees: number[] = [];
let debutMesureImages = 0;
function appareil(): string {
  const ua = navigator.userAgent;
  const nom = /iPhone/.test(ua) ? "iPhone" : /iPad|Macintosh.*Mobile/.test(ua) || (/Macintosh/.test(ua) && tactile) ? "iPad" : /Android/.test(ua) ? "Android" : /Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Linux";
  return `${nom}${tactile ? " (tactile)" : ""} ${Math.round(window.screen.width * devicePixelRatio)}×${Math.round(window.screen.height * devicePixelRatio)}`;
}
function mesurerImages(dtReel: number): void {
  if (!reseau || document.hidden || dtReel <= 0 || dtReel > 1) return;
  imagesMesurees.push(dtReel);
  const maintenant = performance.now();
  if (debutMesureImages === 0) debutMesureImages = maintenant;
  if (maintenant - debutMesureImages < 60_000) return;
  const tries = [...imagesMesurees].sort((a, b) => a - b);
  const p95 = tries[Math.floor(tries.length * 0.95)] ?? tries.at(-1)!;
  envoyer({ t: "mesures", ips: Math.round((imagesMesurees.length / ((maintenant - debutMesureImages) / 1000)) * 10) / 10, ipsBas: Math.round((1 / p95) * 10) / 10, appareil: appareil(), qualite: qualite.niveau });
  imagesMesurees.length = 0;
  debutMesureImages = maintenant;
}

/** Un coup : l'animation, le son et le message durent le geste de l'arme en main (P-004). */
function frapper(appuye: boolean): void {
  const arme = armeEnMain(inventaire, armeEquipee);
  const duree = appuye ? arme.coupAppuye : arme.coup;
  coupFiniLe = performance.now() + duree;
  envoyer({ t: "frapper", appuye });
  bruiteur.frappe(appuye);
  personnage?.frapper(appuye, duree / 1000);
}

function boucle(instant: number): void {
  requestAnimationFrame(boucle);
  mesurerImages((instant - dernier) / 1000);
  const dt = Math.min(0.1, (instant - dernier) / 1000);
  dernier = instant;

  for (const c of entrees.prendreCommandes()) executer(c);

  if (position && personnage && reseau) {
    const entree = entrees.lire();
    const { dx, dz } = scene.versMonde(entree.x, entree.y);
    // Carte ouverte ou en route : le personnage s'arrête.
    const immobile = enVoyage || carte.ouverte;
    let allure = allureAutorisee(entree.allure, besoins, porteEscabeau() || traineTravois(inventaire));
    if (allure === "course" && endurance < SEUIL_EPUISE) allure = "marche";
    // On voulait courir, mais on marche : on dit pourquoi, et comment y remédier.
    if (entree.allure === "course" && allure !== "course" && Math.hypot(dx, dz) > 0.05) {
      const raison = porteEscabeau()
        ? "Les bras chargés, on ne court pas : pose d'abord l'escabeau."
        : aFaim(besoins)
          ? "Trop faible pour courir : tu as faim. Mange quelque chose (Sac)."
          : aSoif(besoins)
            ? "Trop faible pour courir : tu as soif. Bois à ta gourde (Sac)."
            : fatigue(besoins)
              ? "Trop épuisé pour courir : dors dans un abri."
              : "À bout de souffle : marche un moment, ton endurance remonte vite.";
      indice("course", raison);
    }
    // Pendant la pose, c'est le fantôme qui bouge, pas le personnage (0.3) : les touches et le joystick le poussent.
    if (pose.actif) {
      pose.pousser(dx, dz, dt);
      if (pose.confirme) {
        pose.confirme = false;
        finirPose("poser");
      }
    }
    const intention = immobile || pose.actif ? INTENTION_REPOS : { dx, dz, allure };
    reseau.envoyerIntention(intention);
    // La faune réagit à l'allure du joueur (discret, on approche ; en courant, tout détale).
    if (lieu === "terrain") {
      const qui = { x: position.x, z: position.z, allure, bouge: !immobile && Math.hypot(dx, dz) > 0.05 };
      volaille.animer(dt, crierFaune);
      fauneAmbiante.animer(dt, enVoyage ? null : qui, crierFaune);
    }

    const avant = position;
    // Saisi : ralenti ou immobilisé (le serveur fait de même).
    const frein = freinSaisie(saisi);
    position = avancer(position, { ...intention, dx: intention.dx * frein, dz: intention.dz * frein }, dt, zoneDe(lieu));
    if (elan) {
      const pas = Math.min(dt, elan.restant);
      position = avancer(position, { dx: elan.dx, dz: elan.dz, allure: "course" }, (pas * ESQUIVE.distance) / ESQUIVE.duree / ALLURES.course, zoneDe(lieu));
      elan.restant -= dt;
      if (elan.restant <= 0) elan = null;
    }
    const enMouvement = position !== avant;
    majCercles(dt, intention.allure, enMouvement, estNuit(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde)));
    if (!enMouvement && positionServeur) {
      // À l'arrêt, on rejoint en douceur la position confirmée par le serveur.
      const k = Math.min(1, dt * 8);
      position = {
        x: position.x + (positionServeur.x - position.x) * k,
        z: position.z + (positionServeur.z - position.z) * k,
        o: position.o,
      };
    }

    const vitesse = enMouvement ? Math.hypot(position.x - avant.x, position.z - avant.z) / Math.max(dt, 1e-3) : 0;
    bruiteur.pas(lieu, position.x, position.z, intention.allure, enMouvement ? vitesse * dt : 0);
    son.ecouter(position.x, position.z, scene.angleCamera);
    // Au Comptoir, la musique sort d'un petit poste ; elle s'ouvre en grand près du guichet (LIVRAISON §3).
    if (lieu === "comptoir") son.radio(Math.hypot(position.x - COMPTOIR.guichet.x, position.z - COMPTOIR.guichet.z) > 7);
    personnage.objet.position.set(position.x, 0, position.z);
    // Rotation du personnage : on prend le plus court chemin angulaire.
    const ecartAngle = Math.atan2(Math.sin(position.o - personnage.objet.rotation.y), Math.cos(position.o - personnage.objet.rotation.y));
    personnage.objet.rotation.y += ecartAngle * Math.min(1, dt * 14);
    personnage.animer(dt, vitesse);
    // Endormi : couché au sol, près du feu ou sous l'abri.
    personnage.coucher(endormi);
    personnage.porterLumiere(lumiere && estNuit(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde)));
    scene.suivre(position.x, position.z, dt);
    const decor = decors.get(lieu);
    // Les toits qui cachent le personnage s'effacent (à la halte et au Comptoir), selon l'angle de la caméra.
    if ((lieu === "station" || lieu === "comptoir") && decor) estomperToits(decor, position.x, position.z, dt, scene.angleCamera);

    majMode(dt);
    // Le coffre se ferme quand on s'en éloigne.
    const coffre = hud.coffreOuvert;
    if (coffre && (lieu !== "terrain" || Math.hypot(position.x - coffre.x, position.z - coffre.z) > (coffre.type === "decharge" ? 4.5 : 3))) hud.fermerPanneaux();
    // Le guichet se ferme quand on s'en éloigne.
    if (hud.guichetOuvert && (lieu !== "comptoir" || Math.hypot(position.x - COMPTOIR.guichet.x, position.z - COMPTOIR.guichet.z) > 4)) hud.fermerPanneaux();
    personnage.tenir(modeCombat ? armeEnMain(inventaire, armeEquipee).objet : undefined);
    // L'appui gardé pendant le coup précédent part à la fin du geste : on enchaîne sans marteler.
    if (coupEnAttente !== null && performance.now() >= coupFiniLe) {
      const appuye = coupEnAttente;
      coupEnAttente = null;
      if (modeCombat && !enVoyage) frapper(appuye);
    }
    personnage.preparer(modeCombat ? entrees.chargeA : 0);
    hud.saisie(saisi, appuisLocaux / (APPUIS_DEGAGEMENT * Math.max(1, saisi) * (endurance < SEUIL_EPUISE ? 1.5 : 1)));
    // Un blessé qui saigne laisse des gouttes derrière lui.
    if (sante.saignement !== "aucun" && instant > prochaineGoutte) {
      prochaineGoutte = instant + (sante.saignement === "fort" ? 350 : 1200);
      sang.tacher(position.x + (Math.random() - 0.5) * 0.3, position.z + (Math.random() - 0.5) * 0.3, sante.saignement === "fort" ? 0.16 : 0.1);
    }

    propositions = proposer(
      position,
      lieu,
      personnage.famille,
      ressources.values(),
      feux.values(),
      [...installations.values()].map((i) => i.vue),
      inventaire,
      gourde,
      charges,
      Date.now() + decalage,
      [...sacs.values()].map((s) => s.donnees),
      [...autres.values()].map((a) => a.donnees),
      besoins.repos,
      lieu === "terrain" ? volaille.places() : [],
      jourAffiche,
    );
    if (modeCombat) {
      // En combat, A frappe et B esquive ; saisi, B sert à se dégager.
      propositions = {
        A: { libelle: "Frapper (maintenir : à la tête)", examiner: "" },
        B: { libelle: saisi > 0 ? "Se dégager" : "Esquiver", examiner: "" },
        cible: null,
      };
    }
    hud.propositions(propositions, occupe, maintien?.tenu && occupe ? actionEnCours : null);
    if (pose.actif) {
      const genre = pose.actif.genre;
      const installationsVues = [...installations.values()].map((i) => i.vue);
      const r = pose.actif.recette;
      const type = r && "installation" in r.produit ? r.produit.installation : undefined;
      pose.placer(position, scene.camera, (x, z) => raisonEmplacement(genre, x, z, position!, feux.values(), installationsVues, type));
      hud.majPose(pose.raison);
    }
    majDisques(porteEscabeau());
    // Pendant une action, l'anneau reste sur la cible (ou aux pieds du personnage) et se remplit.
    const tenu = maintien && occupe && maintien.duree > 0 ? maintien : null;
    const centre = tenu ? (tenu.cible ?? position) : null;
    visee.visible = (propositions.cible !== null && !occupe) || centre !== null;
    if (centre) {
      visee.position.set(centre.x, 0.03, centre.z);
      majVisee(0.5, instant);
      anneauProgres.visible = true;
      anneauProgres.position.set(centre.x, 0.035, centre.z);
      dessinerProgres((performance.now() - tenu!.debut) / tenu!.duree);
      // Le pourcentage, juste sous l'anneau.
      const p = new THREE.Vector3(centre.x, 0, centre.z).project(scene.camera);
      hud.placerProgression(((p.x + 1) / 2) * window.innerWidth, ((1 - p.y) / 2) * window.innerHeight);
    } else {
      anneauProgres.visible = false;
      if (propositions.cible) {
        visee.position.set(propositions.cible.x, 0.03, propositions.cible.z);
        majVisee(propositions.cible.rayon ?? 0.5, instant);
      }
    }
  } else {
    scene.suivre(25, 25, dt);
  }

  const maintenant = Date.now() + decalage;
  const heure = photo.actif ? photo.reglages.heure : Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(maintenant, debutMonde);
  // Le calendrier des récoltes : la date, et ce que montrent les arbres et le sous-bois (2026-10-08).
  const jourCal = jourDuCalendrier(maintenant, debutMonde);
  hud.heure(jourDeJeu(maintenant, debutMonde), heure, formaterDate(jourCal));
  if (jourCal !== jourAffiche) {
    jourAffiche = jourCal;
    for (const r of ressources.values()) r.saison(jourCal);
  }
  // Le temps qu'il fait : le même pour tous, calculé à partir de l'heure du monde (Book 13).
  const forcee = photo.actif && photo.reglages.temps ? photo.reglages.temps : METEO_FORCEE;
  const temps: Meteo = forcee ? { temps: forcee, pluie: forcee === "pluie" ? 1 : 0, nuages: { soleil: 0, voile: 0.3, couvert: 0.65, pluie: 0.85 }[forcee] } : meteo(maintenant, debutMonde);
  hud.temps(temps.temps);
  if (temps.temps === "pluie" && position) aider("pluie");
  if (position) {
    if (aFaim(besoins)) aider("faim");
    if (aSoif(besoins)) aider("soif");
    if (fatigue(besoins)) aider("fatigue");
    for (const e of eteints.values()) {
      if (e.etat === "dormant" || e.etat === "detruit") continue;
      if (Math.hypot(e.objet.position.x - position.x, e.objet.position.z - position.z) < 14) aider("eteint");
    }
  }
  scene.eclairer(heure, sourcesDeLumiere(), dt, temps.nuages);
  pluie.animer(dt, temps.pluie, scene.centre, scene.ciel.nuit);
  brume.animer(dt, heure, scene.centre, temps.pluie);
  for (const f of feux.values()) f.animer(dt, scene.ciel.nuit);
  for (const e of eteints.values()) e.animer(dt);
  for (const a of autres.values()) a.animer(dt);
  if (lieu === "comptoir") animerComptoir(dt);
  sang.animer(dt);
  // Le son du monde : Éteints, autres joueurs, feux, installations, pluie ; la nuit pour la musique.
  bruiteur.eteints(
    dt,
    [...eteints.entries()].map(([id, e]) => ({ id, x: e.objet.position.x, z: e.objet.position.z, etat: e.etat })),
    position,
    saisi,
  );
  bruiteur.pasDesAutres(lieu, [...autres.entries()].map(([id, a]) => ({ id, x: a.objet.position.x, z: a.objet.position.z })));
  bruiteur.monde({
    feux: [...feux.values()].map((f) => ({ id: f.id, x: f.objet.position.x, z: f.objet.position.z, aspect: f.aspect })),
    installations: [...installations.values()].map((i) => ({ id: i.vue.id, type: i.vue.type, x: i.vue.x, z: i.vue.z, batteries: Object.values(i.vue.etat.batteries ?? {}).some((n) => (n ?? 0) > 0) })),
    pluie: enVoyage ? 0 : temps.pluie,
    dehors: !(lieu === "station" && position !== null && dansLaBoutique(position.x, position.z)),
  });
  if (position && !photo.actif) son.moment(estNuit(heure));
  rodeurs.animer(dt, scene.ciel.nuit, lieu === "terrain" && !enVoyage);
  hud.halo(lumiere && estNuit(heure) && !enVoyage);
  const pedale = actionEnCours.startsWith("Pédal");
  for (const i of installations.values()) {
    const proche = position !== null && Math.hypot(i.vue.x - position.x, i.vue.z - position.z) < 3;
    i.animer(dt, maintenant, scene.ciel.nuit, pedale && proche);
  }

  if (position && estNuit(heure) && !nuitAnnoncee) {
    nuitAnnoncee = true;
    if (!lumiere && lumierePortee(inventaire)) hud.message("La nuit tombe. R (ou « Lumière ») pour t'éclairer… mais la lumière se voit de loin.");
    aider("nuit");
    aider("partir");
  }
  if (!estNuit(heure)) nuitAnnoncee = false;

  scene.dessiner();
  hud.compter(reseau?.latence ?? 0);
}

// Onglet masqué : la boucle s'arrête, donc le personnage doit s'arrêter aussi côté serveur.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) reseau?.envoyerIntention(INTENTION_REPOS);
});

// En développement seulement : un accès pour les tests automatiques et le débogage.
if (import.meta.env.DEV) {
  Object.assign(window, {
    __watt: {
      position: () => position,
      serveur: () => positionServeur,
      entree: () => entrees.lire(),
      etat: () => ({ inventaire, besoins, gourde, lumiere, occupe, propositions, feux: [...feux.values()].map((f) => ({ id: f.id, aspect: f.aspect, bois: f.bois })) }),
      commande: (c: Commande) => entrees.commande(c),
      ressources: () => [...ressources.values()].map((r) => r.donnees),
      eteints: () => [...eteints.entries()].map(([id, e]) => ({ id, x: e.objet.position.x, z: e.objet.position.z, etat: e.etat })),
      combat: () => ({ modeCombat, saisi, sante, endurance }),
      son: () => son.diagnostic(),
      scene,
      personnage: () => personnage,
      envoyer,
    },
  });
}

requestAnimationFrame(boucle);
void entrer();
