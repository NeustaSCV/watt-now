// Le catalogue des effets sonores (Book 21 §6.3) : chaque son a un identifiant, un bus, une priorité, une portée
// et un nombre de variantes. En 0a, ils sont synthétisés (recettes.ts) ; quand la session musique livrera des
// fichiers, il suffira de remplacer la recette d'un identifiant par son fichier : le jeu ne change pas.
// Les ambiances de jour et de nuit, la halte et le Comptoir sont joués par le moteur de musique (musique/LIVRAISON.md).

import { BRUIT_ACTION, BRUIT_ALLURE } from "../../../commun/src/signature.ts";
import type { BusEffet } from "../audio/moteur-couches.js";
import { alea, graine, niveler } from "./dsp.ts";
import * as R from "./recettes.ts";
import type { AllurePas, Recette, Sol } from "./recettes.ts";

export interface DefSon {
  recette: Recette;
  bus: BusEffet;
  priorite: 1 | 2 | 3;
  /** Nombre de variantes (le moteur fait en plus ±3 % de hauteur, ±2 dB). */
  variantes: number;
  /** Niveau dans le mélange (les sons sortent tous de la fabrication au même niveau). */
  gain: number;
  /** Portée audible en mètres : celle de la signature (Book 21 §6.3). */
  portee: number;
  /** Son continu, joué en boucle tant que sa source existe. */
  boucle?: boolean;
}

const SOLS: Sol[] = ["herbe", "terre", "beton", "gravats"];
const ALLURES: AllurePas[] = ["discrete", "marche", "course"];
const GAIN_PAS: Record<AllurePas, number> = { discrete: 0.22, marche: 0.38, course: 0.5 };

/** Un objet sans signature sonore ne s'entend qu'à moins de 2 m (Book 21 §6.3). */
const PROCHE = 2;

const joueur = (recette: Recette, gain: number, portee: number = BRUIT_ACTION.leger.portee, variantes = 3): DefSon => ({ recette, bus: "joueur", priorite: 2, variantes, gain, portee });
/**
 * Les sons du quotidien (pas, gestes répétés) : priorité 3. Le moteur baisse la musique à chaque son P1 ou P2 ;
 * un pas toutes les 0,4 s la ferait « pomper » sans fin. Les Éteints (P1) et le combat (P2) gardent ce privilège.
 */
const quotidien = (recette: Recette, gain: number, portee: number = BRUIT_ACTION.leger.portee, variantes = 3): DefSon => ({ recette, bus: "joueur", priorite: 3, variantes, gain, portee });
const menace = (recette: Recette, gain: number, portee: number, variantes = 4): DefSon => ({ recette, bus: "menaces", priorite: 1, variantes, gain, portee });

const pas: Record<string, DefSon> = {};
for (const sol of SOLS) {
  for (const allure of ALLURES) {
    pas[`pas_${sol}_${allure}`] = { recette: R.pas(sol, allure), bus: "joueur", priorite: 3, variantes: 4, gain: GAIN_PAS[allure], portee: BRUIT_ALLURE[allure].portee };
  }
}

const interfaceFamilles: Record<string, DefSon> = {};
for (const famille of ["charbonniers", "voltaiques", "mecanistes"] as const) {
  for (const geste of ["ouvrir", "fermer", "valider"] as const) {
    interfaceFamilles[`ui_${famille}_${geste}`] = { recette: R.interfaceFamille(famille, geste), bus: "interface", priorite: 3, variantes: 2, gain: 0.22, portee: 0 };
  }
}

export const SONS = {
  ...pas,

  // Les Éteints : il faut les entendre avant de les voir.
  eteint_souffle: menace(R.eteintSouffle, 0.5, 3),
  eteint_machoire: menace(R.eteintMachoire, 0.45, 3, 3),
  eteint_rale: menace(R.eteintRale, 0.75, 25, 6),
  eteint_rale_coupe: menace(R.eteintRaleCoupe, 0.85, 25),
  eteint_tete_craque: menace(R.eteintTeteCraque, 0.6, 25, 3),
  eteint_pas: menace(R.eteintPas, 0.45, 25),
  eteint_pas_presse: menace(R.eteintPasPresse, 0.55, 30),
  eteint_rale_rapide: menace(R.eteintRaleRapide, 0.8, 30, 6),
  eteint_halete: menace(R.eteintHalete, 0.5, 30, 3),

  // Le contact et le combat
  saisie: menace(R.saisie, 0.9, 6, 3),
  morsure_manquee: menace(R.morsureManquee, 0.8, 6, 3),
  morsure: menace(R.morsure, 1, 6, 3),
  impact: joueur(R.impact(1), 0.85, BRUIT_ACTION.coup.portee, 4),
  impact_appuye: joueur(R.impact(1.6), 0.95, BRUIT_ACTION.coup.portee, 3),
  coup_tete: joueur(R.coupTete, 1, BRUIT_ACTION.coup.portee, 3),
  chute_corps: joueur(R.chuteCorps, 0.75, 10, 3),
  sifflement: joueur(R.sifflement(false), 0.4, PROCHE, 4),
  sifflement_lourd: joueur(R.sifflement(true), 0.45, PROCHE, 3),
  // L'arc (Book 25 §3.4, chantier 4) : la corde claque à 3 m, l'arme la plus silencieuse du jeu.
  corde_arc: joueur(R.cordeArc, 0.55, 3, 3),
  esquive: joueur(R.esquive, 0.5, BRUIT_ALLURE.course.portee, 3),
  // L'électricité (Book 25 §5.4) : la courte crépite à 6 m, la longue claque à 8 m.
  decharge_courte: joueur(R.dechargeCourte, 0.7, 6, 3),
  decharge_longue: joueur(R.dechargeLongue, 0.85, 8, 3),
  degagement: joueur(R.degagement, 0.6, 6, 4),
  coeur: { recette: R.coeur, bus: "joueur", priorite: 2, variantes: 2, gain: 0.7, portee: 0 },
  effondrement: joueur(R.effondrement, 0.9, 10, 1),

  // Les gestes et les outils (Book 02 §7 : aucun outil n'est silencieux)
  geste_bois: quotidien(R.gesteBois, 0.5),
  geste_pierre: quotidien(R.gestePierre, 0.5),
  geste_feuillage: quotidien(R.gesteFeuillage, 0.4),
  fouille: quotidien(R.fouille, 0.5),
  demonter: quotidien(R.demonter, 0.5, BRUIT_ACTION.outil.portee),
  visser: quotidien(R.visser, 0.45, BRUIT_ACTION.outil.portee),
  marteau_bois: quotidien(R.marteauBois, 0.6, BRUIT_ACTION.lourd.portee),
  marteau_metal: quotidien(R.marteauMetal, 0.6, BRUIT_ACTION.lourd.portee),
  enclume: quotidien(R.enclume, 0.65, BRUIT_ACTION.lourd.portee),
  scie: quotidien(R.scie, 0.5, 15),
  hache_coupe: quotidien(R.hacheCoupe, 0.7, 25),
  aiguiser: quotidien(R.aiguiser, 0.4, 5),
  tissu: quotidien(R.tissu, 0.45),
  bache: quotidien(R.bache, 0.45),
  remplir_eau: { ...quotidien(R.remplirEau, 0.4, PROCHE, 1), boucle: true },
  bouillir: { ...quotidien(R.bouillir, 0.35, PROCHE, 1), boucle: true },
  manger: quotidien(R.manger, 0.45, PROCHE),
  boire: quotidien(R.boire, 0.45, PROCHE),
  briquet: quotidien(R.briquet, 0.5, 5, 2),
  pierre_a_feu: quotidien(R.pierreAFeu, 0.5, 5, 2),
  pose_pierres: quotidien(R.posePierres, 0.5),
  charbon: quotidien(R.charbon, 0.45),

  // Le feu de camp : sa signature est l'odeur et la lumière ; on ne l'entend qu'à 5 m.
  buche_tombe: quotidien(R.bucheTombe, 0.55, 5),
  extinction: quotidien(R.extinction, 0.4, 5, 2),
  feu_crepite: { recette: R.feuCrepite, bus: "environnement", priorite: 3, variantes: 1, gain: 0.45, portee: 5, boucle: true },

  // Les installations de famille
  soufflet: quotidien(R.soufflet, 0.55, 30),
  braises: { recette: R.braises, bus: "environnement", priorite: 3, variantes: 1, gain: 0.35, portee: 6, boucle: true },
  trempe: quotidien(R.trempe, 0.6, 30, 2),
  chaine_velo: { ...quotidien(R.chaineVelo, 0.4, 15, 1), boucle: true },
  roue_libre: quotidien(R.roueLibre, 0.45, 15, 2),
  // Le pédalier générateur (plan 0.8, chantier 7) : l'alternateur se lance, puis ronronne tant qu'on pédale.
  alternateur_lance: quotidien(R.alternateurLance, 0.32, 15, 2),
  alternateur: { ...quotidien(R.alternateur, 0.3, 15, 1), boucle: true },
  meule: { ...quotidien(R.meule, 0.45, 15, 1), boucle: true },
  pinces: quotidien(R.pinces, 0.45, PROCHE),
  bourdonnement: { recette: R.bourdonnement, bus: "environnement", priorite: 3, variantes: 1, gain: 0.18, portee: PROCHE, boucle: true },
  interrupteur: quotidien(R.interrupteur, 0.4, PROCHE, 2),
  // Les leurres du décor de la Coopérative (Book 23 §4.7) : faits pour être entendus de loin.
  klaxon: { recette: R.klaxon, bus: "environnement", priorite: 2, variantes: 1, gain: 0.7, portee: 45 },
  sonnette: { recette: R.sonnette, bus: "environnement", priorite: 2, variantes: 1, gain: 0.5, portee: 32 },

  // La faune (2026-10-08) : on l'entend de près ; l'envol des canards porte un peu plus loin.
  envol: { recette: R.envol, bus: "environnement", priorite: 3, variantes: 3, gain: 0.5, portee: 25 },
  caquet: { recette: R.caquet, bus: "environnement", priorite: 3, variantes: 3, gain: 0.45, portee: 15 },
  cancan: { recette: R.cancan, bus: "environnement", priorite: 3, variantes: 3, gain: 0.45, portee: 20 },

  // La météo
  pluie: { recette: R.pluie, bus: "environnement", priorite: 3, variantes: 1, gain: 0.5, portee: 0, boucle: true },
  tonnerre: { recette: R.tonnerre, bus: "environnement", priorite: 3, variantes: 3, gain: 0.6, portee: 0 },

  ...interfaceFamilles,
  // « Tu y penses » (plan 0.8, chantier 2) : l'idée au ramassage d'une clé, pour soi seul.
  idee: { recette: R.idee, bus: "interface", priorite: 2, variantes: 2, gain: 0.32, portee: 0 },
  // Le Moulin du Gué (plan 0.8, chantier 12) : la grande porte qui grince (M6), les trois leurres du décor (M31).
  grande_porte: { recette: R.grandePorte, bus: "environnement", priorite: 2, variantes: 2, gain: 0.6, portee: 18 },
  monte_sacs: { recette: R.monteSacs, bus: "environnement", priorite: 2, variantes: 1, gain: 0.75, portee: 30 },
  babillard: { recette: R.babillard, bus: "environnement", priorite: 2, variantes: 1, gain: 0.45, portee: 20 },
  borne: { recette: R.borneJingle, bus: "environnement", priorite: 2, variantes: 1, gain: 0.4, portee: 22 },

  // Le gué (plan 0.8, chantier 11) : le clapot du radier, le câble du bac, la cloche du passeur (un leurre : 40 m), le
  // galet dans l'eau (8 m, comme une pierre qui tombe).
  clapot_radier: { recette: R.clapotRadier, bus: "environnement", priorite: 3, variantes: 1, gain: 0.45, portee: 14, boucle: true },
  cable_bac: { recette: R.grincementCable, bus: "environnement", priorite: 3, variantes: 1, gain: 0.4, portee: 18, boucle: true },
  cloche_bac: { recette: R.clocheBac, bus: "environnement", priorite: 2, variantes: 1, gain: 0.6, portee: 40 },
  plouf: { recette: R.plouf, bus: "environnement", priorite: 3, variantes: 3, gain: 0.5, portee: 8 },
} satisfies Record<string, DefSon>;

export type IdSon = keyof typeof SONS;

/** Fabrique une variante : même identifiant, même variante → exactement le même son. */
export function fabriquer(id: IdSon, variante: number): Float32Array {
  const def: DefSon = SONS[id];
  const s = def.recette(alea(graine(id, variante)));
  niveler(s);
  if (!def.boucle) {
    // Fondus très courts : pas de clic au début ni à la fin.
    const ne = Math.min(s.length, 64);
    for (let i = 0; i < ne; i++) s[i]! *= i / ne;
    const ns = Math.min(s.length, 320);
    for (let i = 0; i < ns; i++) s[s.length - 1 - i]! *= i / ns;
  }
  return s;
}
