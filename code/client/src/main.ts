// Point d'entrée du client : accueil, connexion au monde, boucle de jeu.

import { LotsDeRessources, basculerRegroupements } from "./rendu/lots.ts";
import { fusionnerStatique } from "./rendu/fusion.ts";
import { ModePose, fantomeFeu, type GenrePose } from "./pose.ts";
import { raisonEmplacement } from "../../commun/src/emplacement.ts";
import { REGLAGES, appliquerReglages } from "../../commun/src/reglages.ts";
import { formaterDate, jourDuCalendrier } from "../../commun/src/calendrier.ts";
import { avecTouches } from "./touches.ts";
import { sousTension, suivreElectrique } from "./electricite.ts";
import * as THREE from "three";
import { INTENTION_REPOS, avancer, type Position } from "../../commun/src/deplacement.ts";
import { COMPTOIR, destinations, sortiePourPartir, sortiesDe, type LieuJouable, type Zone } from "../../commun/src/lieux.ts";
import { estPersonnel, ficheLieu, pausePossibleIci, planDe, sombreDans, zoneSelonPortes } from "../../commun/src/registre-lieux.ts";
import type { EteintVu } from "../../commun/src/eteints.ts";
import { cerclesSignature, type BruitAction } from "../../commun/src/signature.ts";
import { ALLURES, type Allure } from "../../commun/src/regles.ts";
import { APPUIS_DEGAGEMENT, ESQUIVE, REPOUSSER, SEUIL_EPUISE, armeEnMain, freinSaisie } from "../../commun/src/combat.ts";
import { armeDansLeDos } from "../../commun/src/combat.ts";
import type { AllureVue, AutreVu, SacVu, SanteVue, VueComptoir } from "../../commun/src/messages.ts";
import { PORTEE_CABLE_PANNEAU, type Charges } from "../../commun/src/energie.ts";
import type { Bienvenue, EtatCoopVu, InstallationVue, MessageClient, MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS, lumierePortee, traineTravois, type Inventaire } from "../../commun/src/objets.ts";
import { compter, typeDe, type CleObjet } from "../../commun/src/etoiles.ts";
import { aFaim, aSoif, allureAutorisee, fatigue, type Besoins, type Gourde } from "../../commun/src/survie.ts";
import { estNuit, heureDeJeu, jourDeJeu } from "../../commun/src/temps.ts";
import { demanderIdentite, presenterEcransAccueil } from "./accueil.ts";
import { Carte } from "./carte.ts";
import { Entrees, type Commande } from "./entrees.ts";
import { Hud } from "./hud.ts";
import { LIBELLE_FERMER_FICHE } from "./fiche-examiner.ts";
import { propositionsEndormi, proposer, retenirSavoir, type ActionProposee, type Propositions } from "./interaction.ts";
import { propositionsCombat } from "./bras-pris.ts";
import { Reseau } from "./reseau.ts";
import { FeuDeCamp } from "./rendu/feu.ts";
import { VueInstallation, creerEscabeau } from "./rendu/installations.ts";
import { FauneAmbiante, Volaille, type CriFaune } from "./rendu/faune.ts";
import { RAYON_ESCABEAU, estFruitier, profondeurMare } from "../../commun/src/terrain.ts";
import { avancerVersLaCouche } from "../../commun/src/sommeil-abri.ts";
import { estomperAbri } from "./rendu/abri-dormeur.ts";
import { creerRuine } from "./rendu/ruine.ts";
import { creerHalte, estomperToits, montrerTousLesToits } from "./rendu/halte.ts";
import { ArriveeDansUnLieu } from "./arrivee.ts";
import { animerMoulin, creerMoulin } from "./rendu/moulin.ts";
import { animerHotel, creerHotel, lumieresHotel } from "./rendu/hotel.ts";
import { ClientHotel } from "./hotel.ts";
import { Guidage } from "./guidage.ts";
import { animerPhare, creerPhare } from "./rendu/phare.ts";
import { PhareClient } from "./phare.ts";
import { pieceMoulin } from "../../commun/src/moulin.ts";
// Le Gué-aux-Saules (plan 0.8, chantier 11) : son décor, son bac, sa crue, ses sons.
import { RenduGue } from "./rendu/gue.ts";
import { RenduCorniche } from "./rendu/corniche.ts";
// La route du pont (plan 0.10, chantier H) : son décor, sa marée, son péage.
import { RenduRoutePont } from "./rendu/route-pont.ts";
import { animerCooperative, creerCooperative, estomperCooperative, majPortes, ouverturesPortes, placerRadio, secouerPorte } from "./rendu/cooperative.ts";
import { CarteVue, arcsParPiece, brouillerTout, clartesDe } from "./rendu/carte-vue.ts";
import { Ondes } from "./rendu/ondes.ts";
import { bruitAlarmant } from "../../commun/src/bruits.ts";
import { KLAXONS_PAR_BATTERIE, RADIO_ETABLI, pieceDe, portesInitiales } from "../../commun/src/cooperative.ts";
import { IndicateurHorsChamp } from "./hors-champ.ts";
import { InterfaceLecon } from "./lecon-ui.ts";
import { MenuAdmin } from "./admin-ui.ts";
import { animerComptoir, creerComptoir, lumieresComptoir } from "./rendu/comptoir.ts";
import { VueEteint } from "./rendu/eteint.ts";
import { solDesCorps } from "./rendu/eteint-au-sol.ts";
import { Partants, VueAutre, horlogeAutres } from "./rendu/autres.ts";
import { Pluie } from "./rendu/pluie.ts";
import { Rodeurs } from "./rendu/rodeurs.ts";
import { Brume } from "./rendu/brume.ts";
import { Aides, type Aide } from "./aides.ts";
import { CONSEILS, watty } from "./watty.ts";
import { ModePhoto } from "./photo.ts";
import { attenuationMeteo, meteo, vent, type Meteo, type Temps } from "../../commun/src/meteo.ts";
import { regleVentDesMoulins } from "./rendu/metier/meubles-neufs.ts";
import { Sang, creerSacTombe, creerTas } from "./rendu/sang.ts";
import type { SourceLumiere } from "./rendu/lumieres.ts";
import { outilsAPortee } from "../../commun/src/outils-a-portee.ts";
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
import { RECETTES, recetteAvecFacon, type Recette } from "../../commun/src/recettes.ts";
import { pretALancer, type Pret } from "../../commun/src/tir.ts";
import type { ResultatCoup } from "../../commun/src/eteints.ts";
import type { ProjectileVu } from "../../commun/src/messages.ts";
import { DessinVisee, viser, type Visee } from "./visee.ts";
import { Projectiles } from "./rendu/projectiles.ts";
import type { Mesureur } from "./mesure/mesure.ts";
import type { ControleEnDirect } from "./mesure/obstacles.ts";
// La couche de déchets (0.7) : un affichage provisoire, isolé (le vrai rendu en amas viendra au chantier 7).
import { CoucheDechetsVue } from "./rendu/dechets/couche.ts";
// « Tu y penses » au ramassage d'une clé (plan 0.8, chantier 2).
import { BandeauIdee } from "./bandeau-idee.ts";
import { seFaitEnTenantA } from "./geste-tenu.ts";
import { AnneauProgres } from "./rendu/anneau-progres.ts";
import { BandeauAvertissement } from "./avertissement.ts";

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
/** Le décor de la Coopérative (ses toits, ses portes) : construit à la première visite. */
let decorCoop: THREE.Group | null = null;
/** Les leurres de la Coopérative en marche (la radio allumée). */
const leurresActifs = new Set<string>();
/** L'état des portes du lieu à portes où l'on est (la Coopérative, le Moulin… ; ouverte : true), tel que le serveur l'a dit. */
let portesCoop: Record<string, boolean> = portesInitiales();
/** Où est la radio de la Coopérative, et ce qui reste au klaxon (0.5.1). */
let etatCoop: EtatCoopVu = { radio: { ...RADIO_ETABLI }, klaxons: KLAXONS_PAR_BATTERIE };
/** La zone où l'on se déplace : dans un lieu à portes (la Coopérative, le Moulin), les portes fermées bouchent le passage. */
function zoneIci(): Zone {
  if (lieu === "gue") return gue.zone(Date.now() + decalage, debutMonde); // le radeau du bac, le radier noyé (chantier 11)
  if (lieu === "route_pont") return routePont.zone(Date.now() + decalage, debutMonde); // la marée, la porte du péage (0.10, H)
  if (lieu === "corniche") return corniche.zone(); // la barricade du tunnel, ouverte pour qui a payé (0.10, I)
  return zoneSelonPortes(lieu, portesCoop);
}
/**
 * Le décor de chaque lieu (0.10, le registre des lieux : commun/src/registre-lieux.ts). Un lieu dont le modèle n'est pas
 * encore importé a son décor provisoire (rendu/lieu-vide.ts) : un sol, ses chemins, un panneau à chaque sortie.
 */
const DECORS: Record<LieuJouable, () => THREE.Object3D[]> = {
  terrain: () => [creerTerrain(), creerMare(), creerRuine()],
  station: () => [creerHalte()],
  comptoir: () => [creerComptoir()],
  cooperative: () => [(decorCoop = creerCooperative())],
  gue: () => [gue.creer()], // 0.8, chantier 11 : le modèle du gué, retourné pour suivre la carte
  moulin: () => [creerMoulin()], // 0.8, chantier 12 : le Moulin du Gué
  // 0.10 : le niveau 2, branché vide (chantier A) ; les modèles aux chantiers H à K.
  route_pont: () => [routePont.creer()], // 0.10, chantier H : le modèle de la route du pont
  grand_hotel: () => [creerHotel()], // 0.10, chantier J : le Grand Hôtel des Flots
  corniche: () => [corniche.creer()], // 0.10, chantier I : le modèle de la corniche du Cap Rouge
  phare: () => [creerPhare()], // 0.10, chantier K : le phare du cap
};
function montrerDecor(lieu: LieuJouable): void {
  if (!decors.has(lieu)) {
    const g = new THREE.Group();
    g.add(...DECORS[lieu]());
    // Les lieux à murs (0.7.2) : ce que le personnage ne voit pas est dessiné « en souvenir » (rendu/carte-vue.ts).
    if (planDe(lieu)) brouillerTout([g]);
    decors.set(lieu, g);
    scene.scene.add(g);
  }
  for (const [l, g] of decors) g.visible = l === lieu;
}
const entrees = new Entrees(document.getElementById("joystick")!, canvas);
// Le son : la musique livrée par la session musique et les effets du catalogue (É5, lot 3).
const son = new Sonorisation(tactile);
const bruiteur = new Bruiteur(son);
const gue = new RenduGue((id, ou) => son.jouer(id, ou ?? null));
/** Le Grand Hôtel (0.10, chantier J) : le check-in, le fondu de l'ascenseur et du balcon. */
const hotel = new ClientHotel();
/** La corniche du Cap Rouge (0.10, chantier I) : ses tronçons, le pin tombé, la barricade du tunnel. */
const corniche = new RenduCorniche();
const routePont = new RenduRoutePont();
// 0.10, chantier K : le phare du cap, « le feu et le cargo » (client/src/phare.ts).
const phare = new PhareClient((id, ou) => son.jouer(id, ou ?? null), () => document.getElementById("hud")!);
// Le guidage du niveau 2 (0.10) : les voix et les pensées à l'approche, les écriteaux qu'on lit (client/src/guidage.ts).
const guidage = new Guidage((texte, genre) => hud.message(texte, genre === "pensee" ? "pensee" : ""));
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
/** La vue par pièce (0.7.2) : la carte de ce que voit le personnage, et les ondes de ce qu'il entend sans le voir. */
const carteVue = new CarteVue();
const ondes = new Ondes();
scene.scene.add(ondes.objet);
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
let armeEquipee: CleObjet | null = null;
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
/** Ceux qui viennent de s'effondrer et de partir : on les voit encore tomber (0.9). */
const partants = new Partants();
const pluie = new Pluie(scene.scene, qualite.niveau === "bas" ? 500 : qualite.niveau === "moyen" ? 900 : 1500);
let endormi = false;
/** Le trajet jusqu'à la couche de l'abri, en cours (0.8.2, R12). */
let versLaCouche: { chemin: { x: number; z: number }[]; o: number } | null = null;
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
/** La faune du terrain (2026-10-08) : la volaille (serveur), les lapins, le renard et les oiseaux de la mare (ici). */
const volaille = new Volaille();
const fauneAmbiante = new FauneAmbiante();
scene.scene.add(volaille.groupe, fauneAmbiante.groupe);
function crierFaune(cri: CriFaune, x: number, z: number): void {
  son.jouer(cri, { x, z });
}
/** Les ressources du lieu, dessinées en lots par matériau (voir lots.ts). */
const lots = new LotsDeRessources();
/** Les déchets du lieu : amas, conteneurs, points du monde (0.7, rendu en amas, rendu/dechets/). */
const dechetsVue = new CoucheDechetsVue((m) => envoyer(m), document.getElementById("hud")!, {
  multiDraw: scene.rendu.extensions.has("WEBGL_multi_draw"),
  ombresPieces: qualite.niveau === "haut",
  ombresPoints: qualite.ombres,
});
scene.scene.add(dechetsVue.objet);
/** L'escabeau porté, et les disques autour des fruitiers où il faut le poser (2026-10-08). */
const escabeauPorte = creerEscabeau();
const DISQUE_ESCABEAU = new THREE.RingGeometry(RAYON_ESCABEAU - 0.08, RAYON_ESCABEAU, 64).rotateX(-Math.PI / 2);
const disquesArbres = new Map<number, THREE.Mesh>();
function porteEscabeau(): boolean {
  for (const i of installations.values()) if (i.vue.etat.portee) return true;
  // 0.10, chantier K : l'escabeau du gardien du phare, dans les bras.
  return lieu === "phare" && phare.dansLesBras;
}
/** Les bras pris (0.10, S-08, V2-12) : l'escabeau, ou la batterie et la tête du robot de l'hôtel. On ne frappe pas. */
function brasPris(): boolean {
  return porteEscabeau() || (lieu === "grand_hotel" && hotel.porte() !== null);
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
/** L'anneau de progression du geste : bleu vif, par-dessus le décor (0.8.2, R23 ; rendu/anneau-progres.ts). */
const anneauProgres = new AnneauProgres();
scene.scene.add(anneauProgres);

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

/** Le bandeau « Tu y penses », posé dans le HUD au premier usage (après que le HUD a dessiné son contenu). */
let bandeauIdee: BandeauIdee | null = null;
/** Plan 0.8.2 §7.6 : le message ne recouvre jamais un panneau ouvert du HUD (le carnet du tutoriel, le sac, une fiche…). */
const PANNEAUX_OUVERTS = [".carnet", ".rapport", ".panneau", ".aide-jeu", ".demande-echange", ".bandeau-avertissement"].map((c) => `:scope > ${c}:not([hidden])`).join(", ");
function nouveauBandeauIdee(): BandeauIdee {
  const el = document.getElementById("hud")!;
  return new BandeauIdee(el, window, {
    obstacles: () => [...el.querySelectorAll<HTMLElement>(PANNEAUX_OUVERTS)].map((p) => p.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0),
    hauteur: () => window.innerHeight,
  });
}
let bandeauAvertissement: BandeauAvertissement | null = null;
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
    lire: (objet) => envoyer({ t: "lire", objet }),
    recettesVues: (recettes) => envoyer({ t: "recettes_vues", recettes }),
    equiper: (objet) => envoyer({ t: "equiper", objet }),
    preparer: (objet) => envoyer({ t: "preparer", objet }),
    reparer: (objet, fortune) => envoyer({ t: "reparer", objet, fortune }),
    reprendre: (objet, geste) => envoyer({ t: "reprendre_arme", objet, geste }),
    coffre: (id, sens, objet, quantite) => envoyer({ t: "coffre", id, sens, objet, quantite }),
    amenager: (genre, id, verbe) => envoyer({ t: "interagir", cible: { genre, id }, verbe }),
    constat: (quoi, construction) => envoyer({ t: "constat", quoi, ...(construction ? { construction } : {}) }),
    banc: (id, g) => envoyer(g.op === "charger" ? { t: "banc", id, op: "charger", cible: g.cible } : { t: "banc", id, op: g.op }),
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
      fabricationDemandee = { nom: r.nom, ingredients: recetteAvecFacon(r, inventaire).ingredients, x: position.x + Math.sin(position.o) * 0.75, z: position.z + Math.cos(position.o) * 0.75 };
      envoyer({ t: "fabriquer", recette: r.id });
    },
  },
  (c) => entrees.commande(c),
  { appuyer: () => entrees.appuyerA(), relacher: () => entrees.relacherA() },
  { appuyer: () => entrees.appuyerLancer(), relacher: () => entrees.relacherLancer() },
);
/** La leçon entre joueurs (Book 25 §2.3) : choisir, accepter, la barre de la leçon en cours. */
const lecons = new InterfaceLecon(document.getElementById("hud")!, (op) => envoyer({ t: "lecon", op }));
/** Le menu ⚙ du compte admin « god » (admin-ui.ts) : caché pour tout autre compte. */
const menuAdmin = new MenuAdmin(
  document.querySelector<HTMLElement>("#hud .menu-options")!,
  (op) => envoyer({ t: "admin", op }),
  () => {
    document.querySelector<HTMLElement>("#hud .menu-options")!.hidden = true;
    document.querySelector("#hud .options")?.setAttribute("aria-expanded", "false");
  },
);
// Après le HUD (il remplit #hud à sa construction) : la flèche des Éteints hors champ.
const horsChamp = new IndicateurHorsChamp(document.getElementById("hud")!);
/** La vue d'ensemble à l'arrivée dans un lieu (0.8.2, chantier G ; arrivee.ts) : son invite se pose dans le HUD. */
const vueArrivee = new ArriveeDansUnLieu(document.getElementById("hud")!, tactile, () => envoyer({ t: "arrivee" }));

const carte = new Carte(document.getElementById("carte")!, (vers) => envoyer({ t: "voyager", vers }));
hud.surPanneau = (ouvert) => uiSon(ouvert ? "ouvrir" : "fermer");
hud.surPause = (oui) => envoyer({ t: "pause", oui });
hud.surSon = () => son.basculer();
hud.surAttendreTouche = (f) => entrees.attendreTouche(f);

function installer(message: Bienvenue): void {
  voile.hidden = true;
  lieu = message.lieu;
  montrerDecor(lieu);
  solDesCorps(lieu);
  // La pause : seulement là où l'on est seul (son terrain, sa Coopérative).
  hud.pausePossible(pausePossibleIci(lieu));
  hud.majPause(false);
  // Les portes de la Coopérative, dans l'état où on les a laissées ; la radio, si elle joue encore.
  if (message.portes) portesCoop = message.portes;
  leurresActifs.clear();
  son.radioCompagnie(false);
  for (const id of message.leurres ?? []) leurresActifs.add(id);
  // La radio, là où on l'a posée (0.5.1) ; elle joue à sa place.
  if (message.etatCoop) etatCoop = message.etatCoop;
  if (decorCoop && lieu === "cooperative") placerRadio(decorCoop, etatCoop.radio);
  if (leurresActifs.has("radio") && etatCoop.radio) son.radioCompagnie(true, { ...etatCoop.radio });
  if (message.usure) hud.majUsure(message.usure, undefined, message.charge);
  // Le lancer (0.6) : l'objet prêt reste choisi d'un lieu à l'autre ; ce qui volait et ce qui sonnait reste là-bas.
  pretChoisi = message.pret ?? null;
  projectiles.vider();
  arreterReveils();
  finirVisee();
  if (decorCoop && lieu === "cooperative") majPortes(decorCoop, portesCoop);
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
  // Arrivé d'un voyage : tout le lieu de loin, jusqu'au premier geste (0.8.2, chantier G).
  vueArrivee.arriver(message.arrivee, lieu, zoneIci(), position);

  contenu.clear();
  ressources.clear();
  carteVue.activer(planDe(lieu), clartesDe(lieu));
  ondes.vider();
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
    // Dans un lieu à murs, le butin hors de vue est « en souvenir » comme le décor (avant les lots : ils le gardent).
    if (carteVue.actif) brouillerTout([vue.objet]);
    // Même image, bien moins d'appels de dessin (2026-10-08, 0.7) : les morceaux de même matériau sont fondus, puis
    // toutes les ressources du lieu sont dessinées en lots, un par matériau (lots.ts).
    fusionnerStatique(vue.objet);
    lots.prendre(vue);
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
  dechetsVue.installer(message.dechets);
  contenu.add(lots.groupe);
  for (const f of message.feux) {
    const vue = new FeuDeCamp(f);
    feux.set(f.id, vue);
    contenu.add(vue.objet);
  }
  eteints.clear();
  majEteints(message.eteints);
  autres.clear();
  partants.vider((v) => contenu.remove(v.objet));
  sang.vider();
  sacs.clear();
  majSacs(message.sacs);
  sante = message.sante;
  endurance = message.endurance;
  saisi = 0;
  hud.majWotts(message.wotts);
  hud.majTutoriel(message.tutoriel);
  hud.majQuetes(message.quetes);
  // Le carnet note la dernière idée venue (0.7, chantier 6).
  if (message.progression) hud.majIdees(message.progression.devoilees);
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
  menuAdmin.maj(message.moi.admin);
  hud.admin = message.moi.admin !== undefined;
  hud.majSavoir(message.savoir ?? { apprises: [], manuels: [] });
  // Plan 0.8.2 §7.3 : un meuble appris d'une autre famille propose ses gestes.
  retenirSavoir(message.savoir ?? {});
  hud.majProgression(message.progression ?? null);
  lecons.maj(null);
  son.entrer({
    famille: message.moi.famille,
    lieu: ficheLieu(lieu).musique,
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

/** Un coup qui porte (au contact, ou un projectile qui arrive) : le sang, le son, ce qu'il faut faire ensuite. */
function montrerCoup(message: { id: number; x: number; z: number; resultat: ResultatCoup; electrique?: true }): void {
  // Le sang : un peu plus marqué que la moyenne, aucune plaie visible (Book 21 §3.5).
  const vue = eteints.get(message.id);
  // La décharge (Book 25 §5.1) : ni sang ni impact ; il se raidit, ou il s'éteint (le rendu de l'Éteint le montre).
  if (message.electrique) {
    // La courte porte : elle raidit, ou met à terre (ses dégâts au torse, plan 0.8 §2.4) ; un éclat d'arc plus vif.
    if (message.resultat === "raidi" || message.resultat === "a_terre") vue?.eclatDecharge();
    bruiteur.coup(message.resultat, message);
    if (message.resultat === "a_terre") hud.message(avecTouches("Il est à terre : une décharge ({agir}) l'éteint pour de bon.", tactile));
    return;
  }
  // L'Équipé encaisse sans vaciller (plan 0.9 §3.3) : un sursaut, un son mat, à peine de sang, pas de message.
  if (message.resultat === "encaisse") {
    vue?.encaisser();
    bruiteur.coup(message.resultat, message);
    sang.eclabousser(message.x, message.z, 1.25, 0.3);
    return;
  }
  vue?.toucher();
  bruiteur.coup(message.resultat, message);
  if (message.resultat === "a_terre") hud.message(avecTouches("Il est à terre : frappe encore ({agir}) pour l'achever, avant qu'il se relève !", tactile));
  sang.eclabousser(message.x, message.z, message.resultat === "detruit" ? 1.5 : 1.25, message.resultat === "detruit" ? 2 : 1);
  if (message.resultat === "detruit") window.setTimeout(() => sang.tacher(message.x, message.z, 0.8), 400);
}

// ---------- Le lancer et le tir (Book 23 §5, Book 25 §3.4, chantier 1 · 0.6) ----------

/** L'objet rapide choisi (null : la pierre) ; l'arbalète armée (undefined : pas d'arbalète prête). */
let pretChoisi: CleObjet | null = null;
let arbaleteArmee: boolean | undefined;
/** Lancer est tenu : on vise (ce qu'on vise, recalculé à chaque image). */
let viseeEnCours: { pret: Pret; visee: Visee | null } | null = null;
const dessinVisee = new DessinVisee();
scene.scene.add(dessinVisee.objet);
const projectiles = new Projectiles();
scene.scene.add(projectiles.objet);
/** Les réveils qui sonnent (Book 23 §5 : 20 s) : leurs minuteries, pour les arrêter en changeant de lieu. */
const reveils: number[] = [];
function arreterReveils(): void {
  for (const r of reveils) window.clearInterval(r);
  reveils.length = 0;
}

/** Ce que le bouton Lancer fera partir, et son verbe (« Lancer », « Tirer », « Réarmer ») ; null : rien. */
function verbeLancer(): { pret: Pret; verbe: string } | null {
  const pret = pretALancer(inventaire, pretChoisi);
  if (!pret) return null;
  if (pret.genre === "lancer") return { pret, verbe: "Lancer" };
  return { pret, verbe: pret.arme.armeeDAvance && arbaleteArmee === false ? "Réarmer" : "Tirer" };
}

/** Le point du sol sous la souris (sur ordinateur, quand elle a bougé il y a peu) : il donne la direction du lancer. */
const rayonSouris = new THREE.Raycaster();
const SOL = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function pointSouris(): { x: number; z: number } | null {
  const s = entrees.souris;
  if (tactile || !s || performance.now() - s.le > 4000) return null;
  const ndc = new THREE.Vector2((s.x / window.innerWidth) * 2 - 1, -(s.y / window.innerHeight) * 2 + 1);
  rayonSouris.setFromCamera(ndc, scene.camera);
  const p = new THREE.Vector3();
  return rayonSouris.ray.intersectPlane(SOL, p) ? { x: p.x, z: p.z } : null;
}

/** Lancer enfoncé : on prend l'objet en main, l'arc se bande, la visée paraît. */
function commencerVisee(): void {
  if (enVoyage || carte.ouverte || pose.actif || !position) return;
  const v = verbeLancer();
  if (!v) return hud.message(avecTouches("Rien à lancer : une pierre, ou Sac → « Prêt à lancer ».", tactile));
  if (saisi > 0) return hud.message(avecTouches("Il te tient : dégage-toi d'abord ({agir} ou {examiner}).", tactile));
  envoyer({ t: "bander" });
  // L'arbalète désarmée : l'appui la réarme (le serveur lance le geste) ; pas de visée.
  if (v.verbe === "Réarmer") return;
  viseeEnCours = { pret: v.pret, visee: null };
}

/** Lancer relâché : l'objet part vers ce qu'on vise. */
function finirVisee(lancer = false): void {
  const v = viseeEnCours;
  viseeEnCours = null;
  dessinVisee.cacher();
  if (!lancer || !v?.visee || !position) return;
  envoyer({ t: "lancer", dx: v.visee.dx, dz: v.visee.dz, ...(v.visee.cible !== null ? { cible: v.visee.cible } : {}), distance: Math.round(v.visee.distance * 10) / 10 });
  // Le geste se joue tout de suite (le serveur juge le reste) : on se tourne, le bras part.
  position = { ...position, o: Math.atan2(v.visee.dx, v.visee.dz) };
  // L'arc ne se lance pas d'un geste du bras : la corde part (son claquement vient avec le projectile).
  if (v.pret.genre === "tir" && !v.pret.arme.armeeDAvance) return;
  personnage?.frapper(false, 0.45);
  bruiteur.frappe(false);
}

/** Chaque image, tant que Lancer est tenu : ce qu'on vise, et son dessin. */
function majViseeLancer(): void {
  if (!viseeEnCours || !position) return;
  const pret = pretALancer(inventaire, pretChoisi);
  if (!pret) return finirVisee();
  viseeEnCours.pret = pret;
  const visables = [...eteints.entries()].map(([id, e]) => ({ id, x: e.objet.position.x, z: e.objet.position.z, debout: e.etat !== "a_terre" && e.etat !== "detruit" }));
  const v = viser(position, position.o, pret, visables, pointSouris());
  viseeEnCours.visee = v;
  dessinVisee.montrer(position, v, pret, entrees.tenuLancer ?? 0);
}

/** Un projectile vole (le sien, ou celui d'un autre joueur) : on le dessine, puis l'impact. */
function lancerProjectile(p: ProjectileVu): void {
  // Au gué, un galet bien lancé ricoche jusqu'à l'autre rive (G8, chantier 11).
  if (p.ricochets && lieu === "gue") return gue.ricocher(p, (q, arrivee) => projectiles.lancer(q, arrivee), () => son.jouer("geste_pierre", { x: p.x1, z: p.z1 }, { gain: 0.7 }));
  // Une flèche part : la corde de l'arc claque (Book 25 §3.4 : à 3 m, l'arme la plus silencieuse).
  if (p.tir && p.objet.startsWith("fleche")) son.jouer("corde_arc", { x: p.x0, z: p.z0 });
  projectiles.lancer(p, () => {
    const ou = { x: p.x1, z: p.z1 };
    if (p.coup) return montrerCoup({ id: p.coup.id, x: p.x1, z: p.z1, resultat: p.coup.resultat });
    if (p.impact === "eau") return son.jouer(lieu === "gue" ? "plouf" : "remplir_eau", ou, { gain: 0.6 });
    son.jouer(p.impact === "mur" ? "marteau_metal" : "geste_pierre", ou, { gain: 0.7 });
    // Le réveil sonne vingt secondes là où il est tombé : les Éteints l'entendent (le serveur), nous aussi.
    if (p.objet === "reveil") {
      let fois = 0;
      const r = window.setInterval(() => {
        son.jouer("sonnette", ou, { gain: 0.55 });
        if (++fois >= 16) window.clearInterval(r);
      }, 1250);
      reveils.push(r);
    }
  });
}

function recevoir(message: MessageServeur): void {
  guidage.recevoir(message); // le guidage 0.10 regarde passer les messages (il n'en prend aucun)
  // Le Grand Hôtel (0.10, chantier J) : l'état du check-in, la scène de l'ascenseur et du balcon.
  if (hotel.recevoir(message)) return;
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
      // Ce qui vient d'entrer dans le sac s'affiche au-dessus du personnage. On compte par sorte, toutes étoiles
      // confondues : une arme montée d'une étoile sur son meuble (chantier 9) change de clé, ce n'est pas un gain.
      const vues = new Set<string>();
      for (const [type, n] of Object.entries(message.inventaire) as [keyof Inventaire, number][]) {
        const sorte = typeDe(type);
        if (!(n > (inventaire[type] ?? 0)) || vues.has(sorte)) continue;
        vues.add(sorte);
        const gagne = compter(message.inventaire, sorte) - compter(inventaire, sorte);
        if (gagne > 0) hud.gain(type, gagne);
      }
      inventaire = message.inventaire;
      hud.majInventaire(inventaire);
      return;
    case "besoins":
      besoins = message.besoins;
      gourde = message.gourde;
      hud.majBesoins(besoins, gourde);
      return;
    case "ressource": {
      const r = ressources.get(message.id);
      // Un point semé au hasard reparaît ailleurs (plan 0.9) : la ressource et ses morceaux en lot le suivent.
      if (r && message.x !== undefined && message.z !== undefined) lots.deplacer(r, r.deplacer(message.x, message.z));
      // Le tas de bois de la station baisse d'une bûche (plan 0.8, chantier 10 : le butin personnel).
      r?.reste(message.reste);
      r?.disponible(message.disponible);
      // Le butin rare de la Coopérative (le coffre, la chambre froide) : un signal musical (session musique).
      if (!message.disponible && lieu === "cooperative" && (r?.donnees.type === "coop_coffre" || r?.donnees.type === "coop_caisse_froide")) son.butin();
      return;
    }
    case "feu": {
      const existant = feux.get(message.feu.id);
      // Du bois en plus : on le montre tout de suite (ajouter du bois est immédiat).
      const boisAvant = boisDesFeux.get(message.feu.id);
      if (boisAvant !== undefined && message.feu.bois > boisAvant + 0.05) {
        hud.pastille("feu_de_camp", `Feu : ${String(Math.round(message.feu.bois * 10) / 10).replace(".", ",")} kg de bois`);
        son.jouer("geste_bois");
      }
      boisDesFeux.set(message.feu.id, message.feu.bois);
      // Amélioré, creusé, un accessoire monté (Book 24) : le modèle change, on le refait à la même place.
      if (existant && existant.cle === FeuDeCamp.cle(message.feu)) existant.mettreAJourEtat(message.feu);
      else {
        if (existant) contenu.remove(existant.objet);
        const vue = new FeuDeCamp(message.feu);
        feux.set(message.feu.id, vue);
        contenu.add(vue.objet);
      }
      hud.majFiche();
      return;
    }
    case "installation": {
      // L'alarme électrique franchie, la clôture couchée ou sans courant (Book 25 §5.3) : client/src/electricite.ts.
      const dit = suivreElectrique(installations.get(message.installation.id)?.vue, message.installation);
      if (dit) hud.message(avecTouches(dit, tactile));
      hud.majCoffre(message.installation);
      if (personnage && message.installation.type === ATELIERS[personnage.famille]) son.atelier();
      ajouterInstallation(message.installation);
      return;
    }
    case "installation_retiree": {
      const vue = installations.get(message.id);
      if (vue) contenu.remove(vue.objet);
      installations.delete(message.id);
      hud.majFiche();
      return;
    }
    case "feu_retire": {
      // Un feu démonté (Book 24 §2.4).
      const vue = feux.get(message.id);
      if (vue) contenu.remove(vue.objet);
      feux.delete(message.id);
      boisDesFeux.delete(message.id);
      hud.majFiche();
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
          // Plan 0.8.2 §7.6 : un appui bref suffit, au toucher comme au clavier (geste-tenu.ts) ; un nouvel appui ou
          // un pas l'arrête.
          maintien.tenu = seFaitEnTenantA({ tactile, sansCible, fabrication: !!maintien.tas, duree: message.duree });
          // Un geste long repris : l'anneau repart de la part déjà faite.
          maintien.debut = performance.now() - (message.deja ?? 0) * message.duree * 1000;
          maintien.duree = message.duree * 1000;
          anneauProgres.repartir();
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
    // Le serveur écrit les touches en repères {action} : on met celles du joueur (ou ses boutons).
    case "indice":
      hud.message(avecTouches(message.texte, tactile), "indice");
      return;
    case "info":
      hud.message(avecTouches(message.texte, tactile));
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
    case "bruits": {
      // Ce qu'on entend sans le voir (0.7.2) : le son, étouffé, et une onde au point de passage ; la porte qu'on pousse
      // tremble. Jamais la silhouette. Sur le radier du gué, l'eau couvre tout au-delà de 3 m (chantier 11).
      const ouie = lieu === "gue" ? gue.ouie(position) : Infinity;
      const bruits = message.bruits.filter((b) => !position || Math.hypot(b.x - position.x, b.z - position.z) <= ouie);
      bruiteur.entendre(bruits);
      for (const b of bruits) {
        if (position) ondes.ajouter(b.x, b.z, position, b.f, bruitAlarmant(b.g));
        if (b.porte && decorCoop && lieu === "cooperative") secouerPorte(decorCoop, b.porte);
      }
      return;
    }
    // Le gué (chantier 11) : le radeau du bac, la cloche du passeur.
    case "gue":
      gue.recevoir(message);
      return;
    // Le péage et la marée de la route du pont (plan 0.10, chantier H) : la porte pour soi ; la mer qui monte, un fondu
    // et un message fermé par son bouton.
    case "passage":
      routePont.passage(message);
      corniche.passage(message);
      hud.reponseCaisse(message.ouvert);
      return;
    case "maree_remonte":
      routePont.fondu();
      (bandeauAvertissement ??= new BandeauAvertissement(document.getElementById("hud")!)).montrer({ texte: message.texte, bouton: message.bouton });
      return;
    // 0.10, chantier K : l'état du phare, l'arrivée du cargo, la corne de brume.
    case "phare":
      phare.recevoir(message);
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
    case "coup":
      montrerCoup(message);
      return;
    // Le lancer et le tir (0.6) : l'objet prêt a changé ; un projectile vole.
    case "pret":
      pretChoisi = message.objet;
      arbaleteArmee = message.armee;
      return;
    case "projectile":
      lancerProjectile(message.projectile);
      return;
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
    case "leurre": {
      // Un leurre se déclenche : on l'entend, et les Éteints aussi (Book 23 §4.7).
      const ou = { x: message.x, z: message.z };
      if (message.id === "radio") {
        if (message.actif) leurresActifs.add("radio");
        else leurresActifs.delete("radio");
        son.radioCompagnie(message.actif, ou);
      } else if (message.actif) son.jouer(message.id === "klaxon" ? "klaxon" : message.id === "monte_sacs" || message.id === "babillard" || message.id === "borne" ? message.id : "sonnette", ou);
      return;
    }
    // Reprendre une arme sur son meuble (plan 0.8, chantier 9) : l'étoile qui s'ajoute brille dans le sac.
    case "arme_reprise":
      hud.armeReprise(message.avant, message.apres, message.geste);
      return;
    case "usure":
      hud.majUsure(message.usure, message.evenement, message.charge);
      if (message.evenement?.etat === "cassee") son.jouer("chute_corps", null, { gain: 0.5 });
      else if (message.evenement?.etat === "abimee") son.jouer("demonter", null, { gain: 0.6 });
      return;
    case "etat_coop":
      // La radio a changé de place (prise, posée), ou le klaxon a sonné (0.5.1).
      etatCoop = message.etat;
      if (decorCoop) placerRadio(decorCoop, etatCoop.radio);
      return;
    case "pause":
      hud.majPause(message.oui);
      return;
    case "portes":
      portesCoop = message.portes;
      if (decorCoop && lieu === "cooperative") majPortes(decorCoop, portesCoop, true);
      // La grande porte du Moulin grince (M6).
      // Au phare, c'est l'épave qui s'échoue : la scène du cargo a ses sons (client/src/phare.ts).
      if (lieu !== "phare") son.jouer(lieu === "moulin" ? "grande_porte" : "geste_bois");
      return;
    case "wotts":
      hud.majWotts(message.wotts);
      return;
    case "rapport":
      hud.rapport(message.rapport);
      return;
    // Les autres joueurs fluides (0.9, plan §3.4) : id, x, z (cm), orientation (centièmes de radian), allure à la suite,
    // à l'heure du serveur `h`.
    case "positions":
      horlogeAutres.recaler(message.h, performance.now());
      for (let i = 0; i + 4 < message.p.length; i += 5) autres.get(message.p[i]!)?.deplacer(message.h, message.p[i + 1]! / 100, message.p[i + 2]! / 100, message.p[i + 3]! / 100, message.p[i + 4]! as AllureVue);
      return;
    case "gestes":
      for (const g of message.g) autres.get(g.id)?.geste(g);
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
      // Les boîtes de conserve tintent (P-002), ou la cloche d'alarme sonne (plan 0.10) : le serveur le dit aussi par écrit.
      bruiteur.alarme({ x: message.x, z: message.z }, message.cloche === true);
      break;
    case "tutoriel":
      hud.majTutoriel(message.tutoriel);
      return;
    // Dormir dans l'abri (0.8.2, R12) : le trajet accroupi jusqu'à la couche, que l'on prédit comme le serveur.
    case "vers_couche":
      versLaCouche = message.chemin ? { chemin: message.chemin, o: message.o } : null;
      return;
    case "sommeil":
      if (message.dort !== endormi) son.dormir(message.dort);
      endormi = message.dort;
      hud.dort(message.dort, message.dansUnAbri);
      return;
    case "demande_echange":
      hud.demandeEchange(message.de);
      return;
    // Le savoir des autres familles (Book 25 §2.3) : leçons et manuels.
    case "savoir":
      hud.majSavoir(message.savoir);
      retenirSavoir(message.savoir);
      return;
    case "admin":
      menuAdmin.maj(message.admin);
      return;
    // La couche de déchets (0.7) : une pièce prise, un remplissage neuf, un point, la liste d'une fouille.
    case "dechets_carreau":
      dechetsVue.majCarreau(message.cx, message.cz, message.r, message.pris);
      return;
    case "dechets_point":
      dechetsVue.majPoint(message.point);
      return;
    case "fouille":
      dechetsVue.fouille(message.fouille);
      return;
    // L'arbre de progression (0.7) : « Tu y penses : … » ; les cartes, la pastille et « À découvrir » (hud.ts).
    case "devoilement":
      hud.majProgression(message.progression);
      if (message.texte) hud.message(message.texte, "aide");
      hud.majIdees(message.progression.devoilees, message.nouvelles);
      return;
    // L'idée au ramassage d'une clé (plan 0.8 ; 0.8.2, R22) : un message sans bouton, qui passe tout seul, et un son court.
    case "idee":
      (bandeauIdee ??= nouveauBandeauIdee()).montrer({ texte: message.texte, plusTard: message.plusTard, ...(message.objet ? { objet: message.objet } : {}) });
      son.jouer("idee");
      return;
    // Un avertissement du carnet (plan 0.8, chantier 13 ; B14) : un bandeau fermé par son bouton « Compris ».
    case "avertissement":
      (bandeauAvertissement ??= new BandeauAvertissement(document.getElementById("hud")!)).montrer({ texte: message.texte, bouton: message.bouton, objet: message.id });
      return;
    case "lecons_possibles":
      lecons.choisir(message.a, message.recettes);
      return;
    case "demande_lecon":
      lecons.demande(message.de, message.recette);
      return;
    case "lecon":
      lecons.maj(message.lecon);
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
      // On repasse le portail de la Coopérative, vivant : son signal de sortie (musique/LIVRAISON.md §3 bis).
      if (message.de === "cooperative") son.sortieCoop();
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
    // Effondré, il quitte le lieu : on le garde le temps de la chute.
    if (v.tombe) partants.garder(v);
    else contenu.remove(v.objet);
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
    // Le cercle touche un dormant : il remue. On dit pourquoi, et comment l'éviter (le lien doit se voir).
    if (e.eveil) indice("eveil", "Un Éteint endormi remue : ton cercle l'atteint. Arrête-toi ou éloigne-toi, il va se réveiller.", 60_000);
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
  // (0.7.2 : 10 cm au-dessus du sol ; à 6 cm, le carrelage du libre-service et le sol des bureaux le cachaient.)
  l.position.y = 0.1;
  l.visible = false;
  scene.scene.add(l);
  return l;
}
const cercleSon = cercle(0xf2efe6, 0.5);
const cercleLumiere = cercle(0xffc46b, 0.45);

/**
 * À la Coopérative (0.7.2, décision 6) : le même cercle, mais pièce par pièce, à la portée que le serveur lui donne
 * vraiment derrière une porte, une vitrine, un mur (rendu/carte-vue.ts, arcsParPiece). Un seul objet à la place du
 * cercle : pas d'appel de dessin en plus.
 */
function cerclePieces(couleur: number, opacite: number): THREE.LineSegments {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6 * 96 * 6), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute("lineDistance", new THREE.BufferAttribute(new Float32Array(6 * 96 * 2), 1).setUsage(THREE.DynamicDrawUsage));
  const l = new THREE.LineSegments(g, new THREE.LineDashedMaterial({ color: couleur, transparent: true, opacity: opacite, dashSize: 0.05, gapSize: 0.04, depthWrite: false }));
  l.position.y = 0.1;
  l.visible = false;
  l.frustumCulled = false;
  l.userData.rayon = 0;
  l.userData.cle = "";
  scene.scene.add(l);
  return l;
}
const cercleSonPieces = cerclePieces(0xf2efe6, 0.5);
const cercleLumierePieces = cerclePieces(0xffc46b, 0.45);

function majCercles(dt: number, allure: Allure, bouge: boolean, nuit: boolean): void {
  if (!position) return;
  const portee = lumiere ? lumierePortee(inventaire) : null;
  const c = cerclesSignature({ x: position.x, z: position.z, allure, bouge, action: bruitAction, lumiere: portee ? (OBJETS[portee].lumiere ?? null) : null, nuit });
  // La pluie couvre le bruit (Book 13 §4) : le cercle rétrécit.
  c.son *= attenuationMeteo(meteo(Date.now() + decalage, debutMonde), "son");
  const plan = estPersonnel(lieu) ? planDe(lieu) : null;
  for (const [ligne, pieces, rayon] of [
    [cercleSon, cercleSonPieces, c.son],
    [cercleLumiere, cercleLumierePieces, c.lumiere],
  ] as const) {
    const actuel = ligne.scale.x;
    const vise = Math.max(0.01, rayon);
    const r = actuel + (vise - actuel) * Math.min(1, dt * 5);
    ligne.scale.set(r, 1, r);
    ligne.position.x = position.x;
    ligne.position.z = position.z;
    // En mode photo, l'image doit rester propre : pas de cercle.
    const montre = r > 1.2 && !enVoyage && !photo.actif;
    ligne.visible = montre && !plan;
    pieces.visible = montre && plan !== null;
    if (!pieces.visible || !plan) continue;
    // Redessiné seulement s'il a changé (on a bougé, il a grandi, une porte s'est ouverte).
    const cle = `${position.x.toFixed(2)},${position.z.toFixed(2)},${r.toFixed(2)},${Object.values(portesCoop).join()}`;
    if (cle === pieces.userData.cle) continue;
    pieces.userData.cle = cle;
    const g = pieces.geometry;
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const dist = g.getAttribute("lineDistance") as THREE.BufferAttribute;
    const n = arcsParPiece(plan, portesCoop, position.x, position.z, r, pos.array as Float32Array, dist.array as Float32Array);
    g.setDrawRange(0, n);
    pos.needsUpdate = true;
    dist.needsUpdate = true;
  }
}

function ajouterInstallation(i: InstallationVue): void {
  const existante = installations.get(i.id);
  // Améliorée ou redescendue (Book 24) : chaque niveau a son modèle, on le refait à la même place.
  if (existante && (existante.vue.niveau ?? 1) !== (i.niveau ?? 1)) {
    contenu.remove(existante.objet);
    installations.delete(i.id);
  } else if (existante) {
    existante.majEtat(i);
    hud.majFiche();
    return;
  }
  const vue = new VueInstallation(i);
  installations.set(i.id, vue);
  contenu.add(vue.objet);
  hud.majFiche();
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
  hud.message(texte, "indice");
}

function agir(a: ActionProposee | null): void {
  // Rien à portée : on dit comment trouver quelque chose à faire, plutôt que de ne rien faire.
  if (!a) return indice("rien", "Rien à portée : approche-toi jusqu'à voir un cercle au sol.");
  if ("message" in a) envoyer(a.message);
  else if ("examiner" in a) {
    // Un écriteau qu'on lit (le guidage 0.10) : son texte en grand ; sinon, le texte d'Examiner.
    if (a.lire) hud.message(a.examiner, "ecriteau");
    else hud.message(a.examiner, "examen");
  } else if ("ouvrirCoffre" in a) {
    const c = installations.get(a.ouvrirCoffre);
    if (c) hud.ouvrirCoffre(c.vue);
  } else if ("ouvrirFiche" in a) {
    hud.ouvrirFiche(a.ouvrirFiche.genre, a.ouvrirFiche.id);
  } else if ("ouvrirGuichet" in a) {
    if (vueComptoir) hud.ouvrirComptoir(vueComptoir);
  } else if ("ouvrirCarte" in a) {
    hud.fermerPanneaux();
    carte.ouvrir(lieu, a.ouvrirCarte);
  } else if ("ouvrirCaisse" in a) {
    // La caisse d'un péage (0.10, chantier H) : le sac en mode « donner » ; « Payer » part au serveur.
    const passage = a.ouvrirCaisse;
    hud.ouvrirCaisse(passage, (objets) => envoyer({ t: "payer_passage", passage, objets }));
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
    fabricationDemandee = { nom: recette.nom, ingredients: recetteAvecFacon(recette, inventaire).ingredients, x: pose.x, z: pose.z };
    envoyer({ t: "fabriquer", recette: recette.id, x: pose.x, z: pose.z, o: pose.o });
  }
  pose.arreter();
  hud.masquerPose();
}
hud.surPose = finirPose;
// La fiche d'un feu ou d'une installation (Book 24) lit l'état tenu ici, à jour, et ce qui l'entoure.
hud.sourceFiche = (genre, id) => {
  if (genre === "feu") return feux.get(id)?.vue ?? null;
  return installations.get(id)?.vue ?? null;
};
hud.voisinsFiche = () => ({ installations: [...installations.values()].map((i) => i.vue), feux: [...feux.values()].map((f) => f.vue) });
// Reprendre une arme sur son meuble (chantier 9) : les installations du terrain autour de soi.
hud.alentoursReprise = () => (position && lieu === "terrain" ? { x: position.x, z: position.z, feux: [], installations: [...installations.values()].map((i) => i.vue), inventaire } : null);
hud.outilsAPortee = () => (position && lieu === "terrain" ? outilsAPortee({ x: position.x, z: position.z, installations: [...installations.values()].map((i) => i.vue), inventaire }) : inventaire);
// Le dialogue de départ dit si l'on part à l'abri (une nuit complète) ou s'il vaut mieux y aller d'abord.
hud.aLAbri = () =>
  lieu === "terrain" && position !== null && [...installations.values()].some((i) => i.vue.type === "abri" && Math.hypot(i.vue.x - position!.x, i.vue.z - position!.z) <= 3);

function executer(c: Commande): void {
  // En pause : Échap ou A reprennent ; rien d'autre.
  if (hud.enPause) {
    if (c === "fermer" || c === "A") envoyer({ t: "pause", oui: false });
    return;
  }
  // Pendant le choix de l'emplacement : A construit, la touche de lumière tourne, B ou Échap annulent.
  if (pose.actif) {
    if (c === "A") return finirPose("poser");
    if (c === "lumiere") return finirPose("tourner");
    if (c === "B" || c === "fermer") return finirPose("annuler");
    if (c === "A_court" || c === "A_long" || c === "lancer" || c === "lancer_fin") return;
  }
  switch (c) {
    case "A":
      // Tenu, A sert à se dégager comme B (0.8.4), dès l'appui : on n'a pas l'amplitude pour frapper.
      if (saisi > 0) return degagerUnCoup();
      // En combat, A se juge au relâchement (coup rapide ou appuyé). Les bras pris, A pose ce qu'on porte (V2-12).
      if (modeCombat && !brasPris()) return;
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
      // Hors combat : lâcher A ne fait rien (0.8.2 §7.6) ; le geste va jusqu'au bout, un nouvel appui l'arrête.
      if (!modeCombat && maintien) {
        maintien.relache = true;
        return;
      }
      if (!modeCombat || enVoyage || carte.ouverte) return;
      // Les bras pris, on ne frappe pas : A a déjà posé (V2-12).
      if (brasPris()) return;
      // Tenu, le coup chargé est perdu : le relâchement ne frappe pas (l'appui a déjà compté pour se dégager).
      if (saisi > 0) return;
      // Un coup va jusqu'au bout (P-004) : pendant le geste, on garde un seul appui, joué à la fin.
      if (performance.now() < coupFiniLe) {
        coupEnAttente = c === "A_long";
        return;
      }
      frapper(c === "A_long");
      return;
    case "B":
      if (modeCombat || saisi > 0) return combatB();
      // Pendant une action, n'importe quelle touche d'action l'arrête.
      if (occupe) return envoyer({ t: "annuler" });
      // B (F au clavier) ouvre la fiche Examiner, et la referme.
      if (hud.ficheOuverte) return hud.fermerPanneaux();
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
    case "carnet":
      hud.basculerCarnet();
      return;
    case "fabriquer":
      hud.basculerFabrication();
      return;
    case "fermer":
      if (hud.aide.ouvert) return hud.aide.fermer();
      if (carte.ouverte) return carte.fermer();
      if (hud.carnetEstOuvert) return hud.basculerCarnet(false);
      if (occupe && maintien?.tas) envoyer({ t: "annuler" });
      hud.fermerPanneaux();
      return;
    case "carte": {
      hud.fermerPanneaux();
      const sortie = position ? sortiePourPartir(lieu, position.x, position.z) : null;
      carte.basculer(lieu, sortie ? destinations(sortie) : []);
      return;
    }
    case "lumiere":
      if (!lumierePortee(inventaire)) return hud.message("Rien pour t'éclairer : chaque famille a sa lumière, échanges-en une.");
      envoyer({ t: "lumiere", allumee: !lumiere });
      return;
    case "tourner+":
      scene.tourner(1);
      return;
    case "tourner-":
      scene.tourner(-1);
      return;
    case "lancer":
      return commencerVisee();
    case "lancer_fin":
      return finirVisee(true);
  }
}

/** Un Éteint debout à 1,2 m ou moins devant soi (cône de 90°) : B le repousse (Book 23 §4.4). */
function aRepousser(): boolean {
  if (!position) return false;
  for (const e of eteints.values()) {
    if (e.etat === "dormant" || e.etat === "detruit" || e.etat === "a_terre") continue;
    const dx = e.objet.position.x - position.x;
    const dz = e.objet.position.z - position.z;
    if (Math.hypot(dx, dz) > REPOUSSER.portee + 0.3) continue;
    const ecart = Math.atan2(dx, dz) - position.o;
    if (Math.abs(Math.atan2(Math.sin(ecart), Math.cos(ecart))) <= REPOUSSER.demiAngle) return true;
  }
  return false;
}

/** Un appui pour se dégager, avec A ou B (0.8.4) : compté tout de suite pour la jauge, le serveur fait foi. */
function degagerUnCoup(): void {
  if (!position || enVoyage) return;
  appuisLocaux++;
  coupEnAttente = null;
  envoyer({ t: "degager" });
  bruiteur.degagement();
}

/** B en combat, selon la situation (Book 23 §4.4) : saisi, se dégager ; un Éteint au contact devant, le repousser ; sinon, esquiver. */
function combatB(): void {
  if (!position || enVoyage) return;
  if (saisi > 0) return degagerUnCoup();
  if (aRepousser()) {
    if (endurance < REPOUSSER.cout) return hud.message("Trop essoufflé pour repousser.");
    envoyer({ t: "repousser" });
    bruiteur.esquive();
    // Une poussée sèche des deux bras : on reprend le geste du coup simple, bref.
    personnage?.frapper(false, 0.45);
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
  for (const [id, e] of eteints) {
    if (e.etat === "dormant" || e.etat === "detruit" || e.etat === "a_terre") continue;
    if (lieu === "gue" && !gue.menace(id, position)) continue; // 0.8.2 (R3) : l'Éteint qui dérive, hors du radier
    if (lieu === "phare" && !phare.menace(e.objet.position, position)) continue; // 0.10 (K2) : l'autre étage du phare
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
    // Le jeton d'abord : un rechargement pendant l'accueil entre directement dans le monde (l'accueil, une seule fois).
    ecrire(CLE_JETON, jeton);
    // Juste après une création (pas une connexion) : les trois écrans d'accueil, avant le terrain.
    accueilEnCours = identite.nouveau;
    await presenterEcransAccueil(identite);
    accueilEnCours = false;
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

/**
 * La lampe qu'on porte. Dans une pièce noire (Book 23 §4.5), elle éclaire ≈ 7 m autour de soi : une lumière plus
 * égale (décroissance 1, nulle à 9 m), tenue haut et un peu devant (sinon le corps jette une grande ombre à ses pieds).
 */
function lampeDansLeNoir(l: (typeof LUMIERES_PORTEES)[keyof typeof LUMIERES_PORTEES], p: { x: number; z: number; o: number }, noir: boolean): SourceLumiere {
  if (!noir) return { x: p.x, y: 1.7, z: p.z, ...l };
  return { ...l, x: p.x + Math.sin(p.o) * 0.45, y: 2.7, z: p.z + Math.cos(p.o) * 0.45, intensite: l.intensite * 2, portee: 9, decroissance: 1 };
}

/** Dans une pièce noire de la Coopérative, du Moulin (Book 23 §4.5) : il y fait nuit, même de jour. */
function dansLeNoir(): boolean {
  return position !== null && sombreDans(lieu, position.x, position.z);
}

function sourcesDeLumiere(): SourceLumiere[] {
  const sources: SourceLumiere[] = [];
  for (const f of feux.values()) {
    const s = f.source();
    if (s) sources.push(s);
  }
  // Les torches plantées qui brûlent (plan 0.8, chantier 6).
  for (const i of installations.values()) {
    const s = i.source(Date.now() + decalage);
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
  if (lieu === "gue") sources.push(...gue.lumieres(estNuit(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde)), position));
  if (lieu === "grand_hotel") sources.push(...lumieresHotel(decors.get(lieu), estNuit(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde)), hotel.etat, position));
  if (lieu === "corniche") sources.push(...corniche.lumieres(estNuit(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde))));
  if (lieu === "route_pont") sources.push(...routePont.lumieres(estNuit(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde)), position));
  // 0.10, chantier K : la lanterne du phare allumée, le feu de détresse de l'épave.
  if (lieu === "phare") sources.push(...phare.lumieres(portesCoop, estNuit(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde))));
  const portee = lumierePortee(inventaire);
  if (lumiere && portee && position) {
    const genre = OBJETS[portee].lumiere!;
    sources.push(lampeDansLeNoir(LUMIERES_PORTEES[genre], position, dansLeNoir()));
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

/** Vrai pendant les écrans d'accueil : ils ont leur propre rendu 3D, le jeu ne dessine rien en dessous. */
let accueilEnCours = false;

function boucle(instant: number): void {
  requestAnimationFrame(boucle);
  if (accueilEnCours) {
    dernier = instant;
    entrees.prendreCommandes(); // les touches frappées pendant l'accueil ne valent pas pour le jeu
    return;
  }
  mesureur?.debut(instant);
  controleObstacles?.maj();
  mesurerImages((instant - dernier) / 1000);
  const dt = Math.min(0.1, (instant - dernier) / 1000);
  dernier = instant;

  for (const c of entrees.prendreCommandes()) executer(c);

  if (position && personnage && reseau) {
    const entree = entrees.lire();
    const { dx, dz } = scene.versMonde(entree.x, entree.y);
    // Carte ouverte ou en route : le personnage s'arrête.
    const immobile = enVoyage || carte.ouverte || hud.enPause || vueArrivee.attend;
    const brasHotel = lieu === "grand_hotel" && hotel.porte() !== null; // la batterie, la tête du robot (0.10, chantier J)
    let allure = allureAutorisee(entree.allure, besoins, porteEscabeau() || brasHotel || traineTravois(inventaire));
    if (allure === "course" && endurance < SEUIL_EPUISE) allure = "marche";
    if (allure === "course" && lieu === "gue" && gue.surLeRadier(position)) allure = "marche"; // le radier : on n'y court pas
    // On voulait courir, mais on marche : on dit pourquoi, et comment y remédier.
    if (entree.allure === "course" && allure !== "course" && Math.hypot(dx, dz) > 0.05) {
      const raison = lieu === "gue" && gue.surLeRadier(position)
        ? "Sur le radier, on marche : le béton glisse sous l'eau qui court."
        : porteEscabeau()
        ? "Les bras chargés, on ne court pas : pose d'abord l'escabeau."
        : brasHotel
        ? "Les bras chargés, on ne court pas."
        : aFaim(besoins)
          ? "Trop faible pour courir : tu as faim. Mange (Sac)."
          : aSoif(besoins)
            ? "Trop faible pour courir : tu as soif. Bois (Sac)."
            : fatigue(besoins)
              ? "Trop épuisé pour courir : dors dans un abri."
              : "À bout de souffle : marche un peu, ça revient vite.";
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

    // Au gué, le radeau du bac emporte qui est à bord (le serveur fait de même).
    if (lieu === "gue") position = gue.porter(position, Date.now() + decalage);
    const avant = position;
    // Saisi : ralenti ou immobilisé (le serveur fait de même).
    const frein = freinSaisie(saisi);
    position = avancer(position, { ...intention, dx: intention.dx * frein, dz: intention.dz * frein }, dt, zoneIci());
    if (elan) {
      const pas = Math.min(dt, elan.restant);
      position = avancer(position, { dx: elan.dx, dz: elan.dz, allure: "course" }, (pas * ESQUIVE.distance) / ESQUIVE.duree / ALLURES.course, zoneIci());
      elan.restant -= dt;
      if (elan.restant <= 0) elan = null;
    }
    // En route vers la couche de l'abri (0.8.2, R12) : accroupi, pas à pas ; bouger l'interrompt (le serveur aussi).
    if (versLaCouche && !immobile) {
      if (Math.hypot(intention.dx, intention.dz) > 0.01) versLaCouche = null;
      else {
        const pas = avancerVersLaCouche(position, versLaCouche.chemin, dt, versLaCouche.o);
        position = pas.position;
        versLaCouche = pas.chemin.length > 0 ? { ...versLaCouche, chemin: pas.chemin } : null;
      }
    }
    const enMouvement = position !== avant;
    // Dans une pièce noire de la Coopérative, la lampe porte comme la nuit : le serveur le compte, le cercle ambre aussi.
    majCercles(dt, intention.allure, enMouvement, estNuit(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde)) || dansLeNoir());
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
    // Dans la mare, l'eau aux genoux (0.8.2, R21).
    personnage.patauger(lieu === "terrain" ? profondeurMare(position.x, position.z) : 0, dt, vitesse);
    // Rotation du personnage : on prend le plus court chemin angulaire.
    const ecartAngle = Math.atan2(Math.sin(position.o - personnage.objet.rotation.y), Math.cos(position.o - personnage.objet.rotation.y));
    personnage.objet.rotation.y += ecartAngle * Math.min(1, dt * 14);
    personnage.animer(dt, vitesse);
    // Endormi : couché au sol, près du feu ou sous l'abri.
    personnage.coucher(endormi);
    // Sous l'abri, à sa couche (0.8.2, R12) : la bâche s'efface en partie, pour qu'on voie le dormeur.
    if (lieu === "terrain") for (const i of installations.values()) if (i.vue.type === "abri") estomperAbri(i.objet, (endormi || versLaCouche !== null) && Math.hypot(i.vue.x - position.x, i.vue.z - position.z) < 2.5, dt);
    personnage.porterLumiere(lumiere && (dansLeNoir() || estNuit(Number.isFinite(HEURE_FORCEE) ? HEURE_FORCEE : heureDeJeu(Date.now() + decalage, debutMonde))));
    // La vue d'ensemble à l'arrivée impose son cadrage, puis zoome vers le personnage ; les toits restent jusque-là.
    scene.cadrage = vueArrivee.cadrage(position, scene.angleCamera, scene.niveauZoom);
    montrerTousLesToits(vueArrivee.toitsVisibles);
    carteVue.toutMontrer(vueArrivee.toitsVisibles);
    scene.suivre(position.x, position.z, dt);
    const decor = decors.get(lieu);
    // Les toits qui cachent le personnage s'effacent (à la halte et au Comptoir), selon l'angle de la caméra.
    if ((lieu === "station" || lieu === "comptoir") && decor) estomperToits(decor, position.x, position.z, dt, scene.angleCamera);
    if (lieu === "gue" && decor) gue.animer(position, dt, scene.angleCamera, Date.now() + decalage, debutMonde);
    if (lieu === "corniche" && decor) corniche.animer(position, dt, scene.angleCamera, ressources.values()); // 0.10, chantier I
    if (lieu === "route_pont" && decor) routePont.animer(position, dt, scene.angleCamera, Date.now() + decalage, debutMonde);
    if (!vueArrivee.attend && !enVoyage) guidage.suivre(lieu, position, Date.now() + decalage, debutMonde, inventaire); // 0.10, guidage
    if (lieu === "cooperative" && decorCoop) {
      estomperCooperative(decorCoop, position.x, position.z, dt, scene.angleCamera);
      animerCooperative(decorCoop, dt);
      // La musique suit la profondeur : dehors, dedans, chambre froide (seul un changement est transmis).
      const piece = pieceDe(position.x, position.z);
      son.zone(piece === "chambre_froide" ? "froid" : piece === "dehors" || piece === "libre_service" ? "dehors" : "dedans");
    }
    // Le Moulin du Gué (0.8, chantier 12) : ses toits, sa grande porte, ce qu'on y a pris, les Éteints de la fosse.
    if (lieu === "moulin" && decor) {
      animerMoulin(decor, position.x, position.z, dt, scene.angleCamera, portesCoop, ressources.values(), eteints.values());
      const piece = pieceMoulin(position.x, position.z);
      son.zone(piece === "dehors" || piece === "jardin" ? "dehors" : "dedans");
    }
    // Le Grand Hôtel (0.10, chantier J) : l'étage ou le rez-de-chaussée, ses couches, le check-in, ce qu'on a pris.
    if (lieu === "grand_hotel" && decor) animerHotel(decor, position.x, position.z, personnage.objet.rotation.y, dt, scene.angleCamera, hotel.etat, ressources.values());

    majMode(dt);
    // Le coffre se ferme quand on s'en éloigne.
    const coffre = hud.coffreOuvert;
    if (coffre && (lieu !== "terrain" || Math.hypot(position.x - coffre.x, position.z - coffre.z) > (coffre.type === "decharge" ? 4.5 : 3))) hud.fermerPanneaux();
    // La fiche d'un feu ou d'une installation (Book 24) aussi.
    const fiche = hud.ficheOuverte;
    if (fiche && (lieu !== "terrain" || Math.hypot(position.x - fiche.x, position.z - fiche.z) > 3.5)) hud.fermerPanneaux();
    // Le guichet se ferme quand on s'en éloigne.
    if (hud.guichetOuvert && (lieu !== "comptoir" || Math.hypot(position.x - COMPTOIR.guichet.x, position.z - COMPTOIR.guichet.z) > 4)) hud.fermerPanneaux();
    // La caisse du péage aussi (0.10, chantier H).
    if (hud.caisseOuverte && !(lieu === "route_pont" ? routePont.prochePeage(position) : lieu === "corniche" && corniche.prochePeage(position))) hud.fermerCaisse();
    // L'arc en main pendant qu'on vise, bras levé : le personnage bande (Book 25 §3.4).
    const arcVise = viseeEnCours?.pret.genre === "tir" && !viseeEnCours.pret.arme.armeeDAvance ? typeDe(viseeEnCours.pret.cle) : null;
    personnage.tenir(arcVise ?? (modeCombat ? armeEnMain(inventaire, armeEquipee).objet : undefined));
    // Hors du combat, la fourche à foin se porte dans le dos (plan 0.8 §2.4, chantier 8).
    personnage.porterDansLeDos(!modeCombat && !arcVise ? armeDansLeDos(inventaire, armeEquipee) : null);
    // L'appui gardé pendant le coup précédent part à la fin du geste : on enchaîne sans marteler.
    if (coupEnAttente !== null && performance.now() >= coupFiniLe) {
      const appuye = coupEnAttente;
      coupEnAttente = null;
      if (modeCombat && !enVoyage && saisi === 0 && !brasPris()) frapper(appuye);
    }
    personnage.preparer(arcVise ? 1 : modeCombat && !brasPris() ? entrees.chargeA : viseeEnCours ? 1 : 0);
    // Le lancer (0.6) : la visée suit l'Éteint accroché ; le bouton dit ce qu'il fera (Lancer, Tirer, Réarmer).
    majViseeLancer();
    projectiles.animer(dt);
    hud.majPret(pretChoisi, verbeLancer()?.verbe ?? null);
    hud.saisie(saisi, appuisLocaux / (APPUIS_DEGAGEMENT * Math.max(1, saisi)));
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
      ficheLieu(lieu).portes ? portesCoop : null,
      leurresActifs,
      etatCoop,
    );
    // Au gué : la cloche, haler ou rappeler le bac, examiner une balise (chantier 11).
    if (lieu === "gue") propositions = gue.proposer(position, propositions, Date.now() + decalage, debutMonde);
    // Au Grand Hôtel : la batterie, le robot, la borne, l'ascenseur (0.10, chantier J).
    if (lieu === "grand_hotel") propositions = hotel.proposer(position, propositions, inventaire);
    // À la route du pont : payer le péage, lire l'échelle de marée (0.10, chantier H).
    if (lieu === "route_pont") propositions = routePont.proposer(position, propositions, Date.now() + decalage, debutMonde);
    // Au phare : l'escabeau, la cuve, le prisme, l'escalier et la lanterne, la corne, la rampe (chantier K).
    if (lieu === "phare") propositions = phare.proposer(position, propositions);
    if (lieu === "corniche") propositions = corniche.proposer(position, propositions); // le péage du tunnel (0.10, I)
    propositions = guidage.proposer(lieu, position, propositions); // les écriteaux qu'on lit (0.10, guidage)
    // Les bras pris (V2-12) : ce que le lieu propose aux bras (poser, brancher, présenter) ; rien d'autre ne passe devant.
    const bras = brasPris();
    const gesteBras = bras ? propositions.A : null;
    // Les déchets à portée de main (0.7) : la cible la plus proche l'emporte (les bras libres).
    const dechet = bras ? null : dechetsVue.proposer(position);
    if (dechet) {
      const c = propositions.cible;
      // Une sortie ou la mare (sans cible au sol) passent avant : on s'y tient exprès.
      if (!propositions.A || (c && dechet.distance < Math.max(0, Math.hypot(c.x - position.x, c.z - position.z) - (c.rayon ?? 0.5)))) propositions = dechet.propositions;
    }
    if (modeCombat || saisi > 0) {
      // En combat, A frappe et B esquive ; saisi, A et B servent à se dégager ; les bras pris, A pose (V2-12 : bras-pris.ts).
      propositions = propositionsCombat({ saisi: saisi > 0, brasPris: bras, bras: gesteBras, repousser: aRepousser() });
    }
    // La pièce visée bat avec l'anneau (son liseré), seulement si c'est bien elle qu'on vise.
    dechetsVue.cibler(dechet !== null && propositions === dechet.propositions);
    // La fiche Examiner ouverte (plan 0.8 §9.2) : B la referme, le bouton tactile et l'invite le disent.
    if (!modeCombat && hud.ficheOuverte) propositions = { ...propositions, B: { libelle: LIBELLE_FERMER_FICHE, examiner: "" } };
    // Endormi : A réveille (0.8.2, chantier K), au lieu de « Dormir dans l'abri ».
    if (endormi && !modeCombat) propositions = propositionsEndormi(propositions);
    // Pendant la vue d'ensemble, rien ne se propose : le premier geste ne sert qu'à commencer.
    if (vueArrivee.attend) propositions = { A: null, B: null, cible: null };
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
      anneauProgres.remplir((performance.now() - tenu!.debut) / tenu!.duree);
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
    // Le phare du cap (0.10, chantier K) : son décor suit son état ; le relief (personnage, Éteints, cercles, caméra).
    if (lieu === "phare" && decors.get(lieu)) animerPhare(decors.get(lieu)!, position.x, position.z, dt, scene.angleCamera, phare.scene(portesCoop), ressources.values());
    phare.poser(lieu === "phare", portesCoop, dt, { personnage: personnage.objet, eteints: eteints.values(), cercles: [visee, anneauProgres], scene });
    phare.animer();
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
  // Les moulins de jerricans tournent au vent, déduit du temps (plan 0.10, chantier D).
  regleVentDesMoulins(vent(temps));
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
  scene.pieceNoire(dansLeNoir());
  scene.eclairer(heure, sourcesDeLumiere(), dt, temps.nuages);
  // La vue par pièce (0.7.2) : la carte suit le personnage et les portes qui s'animent ; ce qui bouge n'est montré que
  // s'il est vu (le serveur ne l'envoie déjà que dans ce cas : c'est la double sécurité, pendant qu'une porte s'ouvre).
  if (carteVue.actif && position) {
    carteVue.souvenir(scene.ciel.nuit, scene.ciel.obscurite);
    carteVue.maj(scene.rendu, position.x, position.z, lieu === "cooperative" && decorCoop ? ouverturesPortes(decorCoop) : ficheLieu(lieu).portes ? portesCoop : {});
    for (const e of eteints.values()) e.objet.visible = carteVue.voit(position, e.objet.position.x, e.objet.position.z);
    for (const a of autres.values()) a.objet.visible = carteVue.voit(position, a.objet.position.x, a.objet.position.z);
  }
  ondes.animer(dt);
  pluie.animer(dt, temps.pluie, scene.centre, scene.ciel.nuit);
  brume.animer(dt, heure, scene.centre, temps.pluie);
  for (const f of feux.values()) f.animer(dt, scene.ciel.nuit);
  // L'éclat de repère des déchets : de jour à moins de 8 m ; la nuit, seulement dans la lumière qu'on porte.
  dechetsVue.animer(dt, enVoyage ? null : position, lumiere && lumierePortee(inventaire) !== null);
  for (const e of eteints.values()) e.animer(dt);
  for (const a of autres.values()) a.animer(dt);
  partants.animer(dt, (v) => contenu.remove(v.objet));
  if (lieu === "comptoir") animerComptoir(dt);
  sang.animer(dt);
  // Le son du monde : Éteints, autres joueurs, feux, installations, pluie ; la nuit pour la musique.
  // Sur le radier du gué, on n'entend plus les Éteints au-delà de 3 m (chantier 11).
  const ouie = lieu === "gue" ? gue.ouie(position) : Infinity;
  bruiteur.eteints(
    dt,
    [...eteints.entries()].map(([id, e]) => ({ id, x: e.objet.position.x, z: e.objet.position.z, etat: e.etat, variante: e.variante })).filter((e) => !position || Math.hypot(e.x - position.x, e.z - position.z) <= ouie),
    position,
    saisi,
    lieu === "cooperative",
  );
  bruiteur.pasDesAutres(lieu, [...autres.entries()].map(([id, a]) => ({ id, x: a.objet.position.x, z: a.objet.position.z })));
  bruiteur.monde({
    feux: [...feux.values()].map((f) => ({ id: f.id, x: f.objet.position.x, z: f.objet.position.z, aspect: f.aspect })),
    installations: [...installations.values()].map((i) => ({ id: i.vue.id, type: i.vue.type, x: i.vue.x, z: i.vue.z, batteries: Object.values(i.vue.etat.batteries ?? {}).some((n) => (n ?? 0) > 0), sousTension: sousTension(i.vue) })),
    pluie: enVoyage ? 0 : temps.pluie,
    dehors: !(lieu === "station" && position !== null && dansLaBoutique(position.x, position.z)),
    lieu: lieu === "gue" && !enVoyage ? gue.sons(position, Date.now() + decalage, debutMonde) : undefined,
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

  // Les Éteints qui approchent hors de l'écran : une flèche au bord (Book 23 §4.5).
  horsChamp.maj(
    scene.camera,
    [...eteints.entries()].filter(([, e]) => e.objet.visible).map(([id, e]) => ({ id, x: e.objet.position.x, z: e.objet.position.z, etat: e.etat })),
    enVoyage ? null : position,
  );
  scene.dessiner();
  hud.compter(reseau?.latence ?? 0);
  mesureur?.fin();
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
      /** Simuler un message du serveur (captures, essais de rendu : l'indicateur hors champ, les variantes…). */
      simuler: (m: MessageServeur) => recevoir(m),
      hud,
      scene,
      personnage: () => personnage,
      envoyer,
      /** Mode mesure : dessin regroupé (true) ou d'avant (false), pour comparer les deux images (lots.ts). */
      fondre: basculerRegroupements,
      /** La vue par pièce (0.7.2) : la carte de vue (souvenirImpose, redessins). */
      carteVue,
      /** Le guidage 0.10 : ce qui s'est déjà dit pendant la visite. */
      guidage,
    },
  });
}

// Le mode mesure (`?mesure=1`, 2026-10-09) : images par seconde, appels de dessin par poste, interrupteurs, déchets
// simulés. Chargé seulement si l'adresse le demande : rien ne change sinon.
let mesureur: Mesureur | null = null;
const MESURE = new URLSearchParams(location.search).get("mesure");
if (MESURE !== null && MESURE !== "0") {
  void import("./mesure/mesure.ts").then((m) => {
    mesureur = m.demarrerMesure({ scene, qualite, lieu: () => lieu, postes: postesMesures, dechets: dechetsVue });
  });
}
// Le mode obstacles (`?obstacles=1`, ou `?obstacles=ensemble` pour voir tout le lieu, 0.7.1) : ce qui bloque le
// déplacement, dessiné par-dessus le lieu (vert : on voit ce qui bloque ; rouge : barrière invisible). Chargé seulement
// si l'adresse le demande : rien ne change sinon.
let controleObstacles: ControleEnDirect | null = null;
const OBSTACLES = new URLSearchParams(location.search).get("obstacles");
if (OBSTACLES !== null && OBSTACLES !== "0") {
  void import("./mesure/obstacles.ts").then((m) => {
    controleObstacles = m.demarrerObstacles({
      scene,
      lieu: () => lieu,
      zone: zoneIci,
      sorties: () => sortiesDe(lieu),
      visibles: () => {
        const decor = decors.get(lieu);
        return [...(decor ? [decor] : []), lots.groupe, ...[...ressources.values()].map((r) => r.objet), ...[...installations.values()].map((i) => i.objet)];
      },
    }, OBSTACLES === "ensemble");
  });
}

/** Les objets du jeu et leur poste, pour ranger les appels de dessin (mode mesure). */
function* postesMesures(): Generator<readonly [string, THREE.Object3D | null | undefined]> {
  yield ["décor", decors.get(lieu)];
  for (const r of ressources.values()) yield [`ressource:${r.donnees.type}`, r.objet];
  yield ["ressource:lots", lots.groupe];
  for (const f of feux.values()) yield ["feux", f.objet];
  for (const i of installations.values()) yield ["installations", i.objet];
  yield ["installations", cables];
  for (const e of eteints.values()) yield ["éteints", e.objet];
  for (const a of autres.values()) yield ["autres joueurs", a.objet];
  yield ["personnage", personnage?.objet];
  yield ["faune", volaille.groupe];
  yield ["faune", fauneAmbiante.groupe];
  yield ["effets:rôdeurs", rodeurs.objet];
  yield ["effets:visée", visee];
  yield ["effets:visée", anneauProgres];
  yield ["effets:visée", dessinVisee.objet];
  yield ["effets:projectiles", projectiles.objet];
  yield ["effets:pose", pose.groupe];
  yield ["effets:pose", pose.cerclePortee];
  yield ["effets:cercles", cercleSon];
  yield ["effets:cercles", cercleLumiere];
  yield ["effets:cercles", cercleSonPieces];
  yield ["effets:cercles", cercleLumierePieces];
  yield ["effets:ondes", ondes.objet];
  for (const s of sacs.values()) yield ["effets:sacs", s.vue];
  yield ["déchets", dechetsVue.objet];
  yield ["divers (contenu)", contenu];
}

requestAnimationFrame(boucle);
void entrer();
