// Vestiges, lot 1 (0.3) : le bric-à-brac de l'Âge de l'Abondance (proposition P-003, Book 02 §5, Book 15 §4).
// On ramasse tout et n'importe quoi, comme dans les ruines d'avant : beaucoup ne servent à rien tout de suite,
// pèsent lourd et finissent par forcer le choix de ce qu'on garde. Certains se démontent en composants, qui
// serviront bien plus tard (électricité, forge, pièges).
//
// Poids réalistes (Book 12) : c'est le cœur du lot, ils doivent encombrer. La valeur est l'énergie grise payée
// par le Comptoir (Book 01 §6 : valeur de remplacement, plafonnée ; les objets absurdes valent peu).
// Pas de marque déposée ni de personne réelle (Book 15 §1, P-003 §1).

import type { Inventaire, TypeObjet } from "./objets.ts";
import type { Qualite } from "./recettes.ts";
import type { TypeRessource } from "./terrain.ts";
import { DEMONTAGE_LOT2, VESTIGES_LOT2 } from "./vestiges-lot2.ts";

/** Rareté (P-003 §1) : commun, peu commun, rare, légendaire. */
export type Rarete = "C" | "P" | "R" | "L";

/** La famille d'un vestige : où on le trouve, et son icône générique. */
export type FamilleVestige =
  | "cuisine"
  | "salle_de_bain"
  | "salon"
  | "gadget"
  | "garage"
  | "voiture"
  | "ferme"
  | "composant"
  // Lot 2 (0.7, les déchets de l'Abondance) : emballages et ordures ; vêtements et linge ; sport, jouets et jardin.
  | "dechet"
  | "textile"
  | "loisir";

export const NOMS_FAMILLES_VESTIGES: Record<FamilleVestige, string> = {
  cuisine: "cuisine",
  salle_de_bain: "salle de bain",
  salon: "salon",
  gadget: "gadget",
  garage: "garage",
  voiture: "voiture",
  ferme: "ferme",
  composant: "composant",
  dechet: "déchet",
  textile: "textile",
  loisir: "loisir",
};

export interface DefinitionVestige {
  nom: string;
  pluriel: string;
  description: string;
  /** kg, pour une unité. */
  poids: number;
  /** Énergie grise (wotts) : ce que vaut l'objet au Comptoir, avant la fourchette. */
  valeur: number;
  famille: FamilleVestige;
  rarete: Rarete;
  /** Une teinte propre pour l'icône générique (sinon celle de la famille). */
  teinte?: string;
  /** Hors des tirages (fouilles, décharge) : on ne le trouve qu'à un endroit précis (la Coopérative, Book 23). */
  horsTirage?: true;
  /** Il se mange (la conserve bombée, lot 2) : énergie, eau, et le mal qu'il fait (Book 05 §4). */
  kcal?: number;
  eau?: number;
  toxique?: "conserve_bombee";
}

// ---------- Les composants (P-003 §2) : ce qui revient partout ----------

export const COMPOSANTS = {
  fil_cuivre: {
    nom: "bobine de fil de cuivre",
    pluriel: "bobines de fil de cuivre",
    description: "Du fil de cuivre récupéré, enroulé sur lui-même. Le métal de l'électricité : câbler, bobiner, un jour un alambic.",
    poids: 0.2,
    valeur: 12,
    famille: "composant",
    rarete: "C",
    teinte: "#c8743a",
  },
  petit_moteur: {
    nom: "petit moteur",
    pluriel: "petits moteurs",
    description: "Un petit moteur à courant continu, gros comme un pouce. Tourné à la main, il produit un filet de courant ; alimenté, il fait tourner un ventilateur de forge.",
    poids: 0.15,
    valeur: 20,
    famille: "composant",
    rarete: "C",
    teinte: "#6b7b8c",
  },
  pile: {
    nom: "pile usagée",
    pluriel: "piles usagées",
    description: "Une pile bâton. La moitié sont vides, l'autre moitié presque. Zinc et graphite : de quoi faire des électrodes.",
    poids: 0.025,
    valeur: 2,
    famille: "composant",
    rarete: "C",
    teinte: "#d8a83a",
  },
  cellule_lithium: {
    nom: "cellule lithium",
    pluriel: "cellules lithium",
    description: "Un cylindre de lithium tiré d'un appareil mort. Assemblées par dizaines, elles refont une batterie. À ne pas percer.",
    poids: 0.05,
    valeur: 18,
    famille: "composant",
    rarete: "C",
    teinte: "#3f8f6a",
  },
  aimant: {
    nom: "aimant",
    pluriel: "aimants",
    description: "Il colle encore à tout ce qui est en fer. Avec une aiguille et un bouchon, une boussole ; avec du cuivre, une dynamo.",
    poids: 0.05,
    valeur: 5,
    famille: "composant",
    rarete: "C",
    teinte: "#b3243a",
  },
  led: {
    nom: "LED",
    pluriel: "LED",
    description: "Une diode qui éclaire avec presque rien. La lumière la moins chère du monde, quand on a le courant.",
    poids: 0.005,
    valeur: 3,
    famille: "composant",
    rarete: "C",
    teinte: "#e8d84a",
  },
  resistance: {
    nom: "résistance chauffante",
    pluriel: "résistances chauffantes",
    description: "Un fil qui rougit quand le courant passe. Un allumeur, une couveuse, un chauffe-eau : tout ce qui chauffe à l'électricité.",
    poids: 0.1,
    valeur: 8,
    famille: "composant",
    rarete: "C",
    teinte: "#d2691e",
  },
  verre: {
    nom: "morceau de verre",
    pluriel: "morceaux de verre",
    description: "Une plaque de verre récupérée, les bords cassés. Une vitre, un miroir à signaux, et un tranchant si on n'a rien d'autre.",
    poids: 0.3,
    valeur: 2,
    famille: "composant",
    rarete: "C",
    teinte: "#9cc8d8",
  },
  aluminium: {
    nom: "chute d'aluminium",
    pluriel: "chutes d'aluminium",
    description: "De l'aluminium aplati au marteau. Il fond à 660 °C : au creuset, il redevient ce qu'on veut.",
    poids: 0.25,
    valeur: 6,
    famille: "composant",
    rarete: "C",
    teinte: "#c9ccd0",
  },
  plastique: {
    nom: "morceau de plastique",
    pluriel: "morceaux de plastique",
    description: "Une coque cassée, un capot, un bouton. Il y en a partout et il ne pourrit jamais. Refondu, il fera des joints et des godets.",
    poids: 0.2,
    valeur: 1,
    famille: "composant",
    rarete: "C",
    teinte: "#4a8ac2",
  },
  papier: {
    nom: "liasse de papier",
    pluriel: "liasses de papier",
    description: "Du papier sec. Il allume un feu en une étincelle, et il prend moins de place qu'un fagot.",
    poids: 0.1,
    valeur: 1,
    famille: "composant",
    rarete: "C",
    teinte: "#efe6cf",
  },
  petit_ressort: {
    nom: "petit ressort",
    pluriel: "petits ressorts",
    description: "Un ressort d'acier, pas plus long qu'un doigt. Un piège, une alarme, une gâchette : il attend son mécanisme.",
    poids: 0.02,
    valeur: 3,
    famille: "composant",
    rarete: "C",
    teinte: "#8a8f96",
  },
  caoutchouc: {
    nom: "bande de caoutchouc",
    pluriel: "bandes de caoutchouc",
    description: "Une bande souple, découpée dans un tuyau ou une chambre à air. Un élastique de fronde, un joint, une sangle.",
    poids: 0.1,
    valeur: 3,
    famille: "composant",
    rarete: "C",
    teinte: "#3a3a3a",
  },
} satisfies Record<string, DefinitionVestige>;

export type TypeComposant = keyof typeof COMPOSANTS;

// ---------- Les vestiges du lot 1 ----------

const VESTIGES_LOT1 = {
  // ---- 🍳 Cuisine ----
  casserole: {
    nom: "casserole cabossée",
    pluriel: "casseroles cabossées",
    description: "Cabossée, le manche branlant, mais elle tient l'eau. Aplatie au marteau, de l'aluminium à refondre.",
    poids: 1,
    valeur: 8,
    famille: "cuisine",
    rarete: "C",
  },
  cocotte_fonte: {
    nom: "cocotte en fonte",
    pluriel: "cocottes en fonte",
    description: "Cinq kilos et demi de fonte émaillée. Elle a survécu à trois générations ; elle survivra à la tienne. Mais il faut la porter.",
    poids: 5.5,
    valeur: 45,
    famille: "cuisine",
    rarete: "P",
    // Plan 0.8 (I7) : une clé du niveau 1 (L1A, le libre-service) sort des tables de fouille courantes.
    horsTirage: true,
  },
  autocuiseur: {
    nom: "autocuiseur",
    pluriel: "autocuiseurs",
    description: "Sa soupape siffle encore quand on le secoue. Cuve d'inox, joint, soupape : les Charbonniers y voient un alambic.",
    poids: 4,
    valeur: 40,
    famille: "cuisine",
    rarete: "P",
  },
  bocal: {
    nom: "bocal à couvercle",
    pluriel: "bocaux à couvercle",
    description: "Un bocal de verre épais, son couvercle à vis. Il gardera des conserves, le jour où l'on saura en faire.",
    poids: 0.4,
    valeur: 4,
    famille: "cuisine",
    rarete: "C",
  },
  grille_pain_facial: {
    nom: "grille-pain à reconnaissance faciale",
    pluriel: "grille-pain à reconnaissance faciale",
    description: "« Visage non reconnu. » Il ne grillera plus jamais rien pour personne. Dedans : des résistances et des ressorts.",
    poids: 1.6,
    valeur: 10,
    famille: "cuisine",
    rarete: "P",
  },
  micro_ondes: {
    nom: "four à micro-ondes",
    pluriel: "fours à micro-ondes",
    description: "Treize kilos de tôle. Son transformateur cache des mètres de cuivre ; fermé, il protège l'électronique des orages.",
    poids: 13,
    valeur: 25,
    famille: "cuisine",
    rarete: "C",
  },
  machine_capsules: {
    nom: "machine à café à capsules",
    pluriel: "machines à café à capsules",
    description: "Elle garde 47 capsules d'un café qui n'existe plus. Une pompe, une résistance, beaucoup de plastique.",
    poids: 3.5,
    valeur: 15,
    famille: "cuisine",
    rarete: "C",
  },
  aimant_frigo: {
    nom: "aimant de frigo « Souvenir des Sables »",
    pluriel: "aimants de frigo « Souvenir des Sables »",
    description: "Un palmier en résine, un coucher de soleil, et derrière un vrai petit aimant. Le frigo, lui, est resté là-bas.",
    poids: 0.03,
    valeur: 2,
    famille: "cuisine",
    rarete: "C",
  },
  // ---- 🚿 Salle de bain ----
  brosse_dents_connectee: {
    nom: "brosse à dents connectée",
    pluriel: "brosses à dents connectées",
    description: "Batterie à plat depuis des années ; l'appli voulait encore te noter. Dedans, un minuscule moteur.",
    poids: 0.15,
    valeur: 5,
    famille: "salle_de_bain",
    rarete: "C",
  },
  seche_cheveux: {
    nom: "sèche-cheveux",
    pluriel: "sèche-cheveux",
    description: "Une résistance et un moteur dans une coque rose. Branché un jour sur du 230 V, il soufflera une forge.",
    poids: 0.7,
    valeur: 10,
    famille: "salle_de_bain",
    rarete: "C",
  },
  miroir_salle_bain: {
    nom: "miroir de salle de bain",
    pluriel: "miroirs de salle de bain",
    description: "Quatre kilos de verre argenté. On y voit sa mine, et au soleil il envoie un signal à des kilomètres.",
    poids: 4,
    valeur: 6,
    famille: "salle_de_bain",
    rarete: "C",
  },
  rouleau_papier_toilette: {
    nom: "rouleau de papier toilette",
    pluriel: "rouleaux de papier toilette",
    description: "La monnaie des trois premières semaines de la Grande Panne. Aujourd'hui, un bon allume-feu.",
    poids: 0.12,
    valeur: 3,
    famille: "salle_de_bain",
    rarete: "P",
  },
  pyramide_papier_toilette: {
    nom: "pyramide de 96 rouleaux",
    pluriel: "pyramides de 96 rouleaux",
    description: "Le trophée des grands stockeurs de la Grande Panne, encore sous film. Onze kilos et demi d'angoisse empilée.",
    poids: 11.5,
    valeur: 250,
    famille: "salle_de_bain",
    rarete: "L",
  },
  balance_connectee: {
    nom: "balance connectée",
    pluriel: "balances connectées",
    description: "Elle affiche encore ton poids, et que c'est trop. Tu n'as pourtant jamais été aussi léger.",
    poids: 1.8,
    valeur: 5,
    famille: "salle_de_bain",
    rarete: "C",
  },
  parfum_luxe: {
    nom: "flacon de parfum de luxe",
    pluriel: "flacons de parfum de luxe",
    description: "« Essence d'Abondance », 100 ml. De l'alcool qui sent la fleur : un Nostalgique te le reprendra peut-être.",
    poids: 0.35,
    valeur: 25,
    famille: "salle_de_bain",
    rarete: "P",
  },
  // ---- 🛋️ Salon ----
  tele_85: {
    nom: "télé plate de 85 pouces",
    pluriel: "télés plates de 85 pouces",
    description: "Quarante-cinq kilos d'écran noir. Elle reflète très bien ton visage fatigué. Démontée, des dizaines de LED.",
    poids: 45,
    valeur: 30,
    famille: "salon",
    rarete: "C",
  },
  telecommande: {
    nom: "télécommande sans télé",
    pluriel: "télécommandes sans télé",
    description: "Elle zappe dans le vide. Deux piles et une LED infrarouge, c'est toujours ça.",
    poids: 0.15,
    valeur: 2,
    famille: "salon",
    rarete: "C",
  },
  aspirateur_robot: {
    nom: "aspirateur robot",
    pluriel: "aspirateurs robots",
    description: "S'il lui restait du jus, il tournerait en rond en se cognant aux murs, comme avant. Des moteurs et du lithium.",
    poids: 3.5,
    valeur: 30,
    famille: "salon",
    rarete: "C",
  },
  guirlande: {
    nom: "guirlande lumineuse",
    pluriel: "guirlandes lumineuses",
    description: "Vingt petites LED sur un fil. On les allumait pour une fête ; elles éclaireront un abri avec presque rien.",
    poids: 0.4,
    valeur: 8,
    famille: "salon",
    rarete: "C",
  },
  tableau_vivre_rire: {
    nom: "tableau « Vivre Rire Aimer »",
    pluriel: "tableaux « Vivre Rire Aimer »",
    description: "Trois conseils en lettres dorées. Le châssis de bois brûlera mieux que le message.",
    poids: 2,
    valeur: 2,
    famille: "salon",
    rarete: "C",
  },
  ventilateur: {
    nom: "ventilateur sur pied",
    pluriel: "ventilateurs sur pied",
    description: "Un pied, une hélice, un moteur. Quatre kilos encombrants, mais l'hélice rêve d'être une éolienne.",
    poids: 4,
    valeur: 15,
    famille: "salon",
    rarete: "C",
  },
  coussin_peteur: {
    nom: "coussin péteur",
    pluriel: "coussins péteurs",
    description: "Le leurre sonore le plus petit et le plus vexant du monde. Il marche encore. Évidemment.",
    poids: 0.1,
    valeur: 1,
    famille: "salon",
    rarete: "C",
  },
  // Le leurre qu'on lance (Book 23 §5, 0.6) : il sonne vingt secondes là où il tombe.
  reveil: {
    nom: "réveil à piles",
    pluriel: "réveils à piles",
    description: "Deux cloches, un marteau, « Debout les Abondants ! ». Lancé, il sonne vingt secondes là où il tombe. Les Éteints accourent.",
    poids: 0.4,
    valeur: 6,
    famille: "salon",
    rarete: "C",
  },
  encyclopedie: {
    nom: "encyclopédie en 24 volumes",
    pluriel: "encyclopédies en 24 volumes",
    description: "Trente-six kilos de savoir relié, de « Abaque » à « Zygote ». Personne n'a le temps de la lire aujourd'hui. Plus tard, peut-être.",
    poids: 36,
    valeur: 40,
    famille: "salon",
    rarete: "P",
  },
  // ---- 💻 Gadgets connectés morts ----
  smartphone_fele: {
    nom: "smartphone à l'écran fêlé",
    pluriel: "smartphones à l'écran fêlé",
    description: "2 % de batterie depuis trois ans. Quarante notifications en attente, pour personne.",
    poids: 0.2,
    valeur: 12,
    famille: "gadget",
    rarete: "C",
  },
  batterie_externe: {
    nom: "batterie externe",
    pluriel: "batteries externes",
    description: "Une brique de plastique pleine de cellules lithium. Vide, mais les cellules se rechargent si on sait s'y prendre.",
    poids: 0.4,
    valeur: 25,
    famille: "gadget",
    rarete: "C",
  },
  ordinateur_portable: {
    nom: "ordinateur portable",
    pluriel: "ordinateurs portables",
    description: "L'écran affiche une dernière fois « Mise à jour 3 sur 47 », puis plus rien. Six cellules lithium dans la batterie.",
    poids: 2.2,
    valeur: 35,
    famille: "gadget",
    rarete: "C",
  },
  enceinte_intelligente: {
    nom: "enceinte « intelligente »",
    pluriel: "enceintes « intelligentes »",
    description: "Secouée, elle répond encore : « Je n'ai pas compris. » Elle n'est pas la seule.",
    poids: 1,
    valeur: 8,
    famille: "gadget",
    rarete: "C",
  },
  montre_connectee: {
    nom: "montre connectée",
    pluriel: "montres connectées",
    description: "Elle comptait tes pas, ton sommeil, ton stress. Elle a cessé de compter avant toi.",
    poids: 0.05,
    valeur: 6,
    famille: "gadget",
    rarete: "C",
  },
  sac_cables: {
    nom: "sac de 30 câbles de recharge",
    pluriel: "sacs de 30 câbles de recharge",
    description: "Aucun n'a le bon embout. Il n'y a plus rien à recharger, mais il y a du cuivre dedans.",
    poids: 1.5,
    valeur: 10,
    famille: "gadget",
    rarete: "C",
  },
  calculatrice_solaire: {
    nom: "calculatrice solaire",
    pluriel: "calculatrices solaires",
    description: "Elle marche toujours, et pour l'éternité. Le seul appareil de l'Abondance qui n'a jamais rien demandé.",
    poids: 0.1,
    valeur: 10,
    famille: "gadget",
    rarete: "C",
  },
  vapoteuse: {
    nom: "vapoteuse",
    pluriel: "vapoteuses",
    description: "Parfum « Barbe à papa glaciale ». Une cellule lithium et une résistance : un allumeur électrique en puissance.",
    poids: 0.1,
    valeur: 8,
    famille: "gadget",
    rarete: "C",
  },
  robot_domestique: {
    nom: "robot domestique",
    pluriel: "robots domestiques",
    description: "Vingt-deux kilos de « Comment puis-je vous aider ? ». Il ne peut plus. Mais ses moteurs et ses batteries, si.",
    poids: 22,
    valeur: 90,
    famille: "gadget",
    rarete: "R",
  },
  // ---- 🔧 Garage et atelier ----
  perceuse_visseuse: {
    nom: "perceuse-visseuse sans fil",
    pluriel: "perceuses-visseuses sans fil",
    description: "Batterie morte, chargeur introuvable. Un bon moteur et cinq cellules lithium dans la poignée.",
    poids: 1.8,
    valeur: 50,
    famille: "garage",
    rarete: "P",
  },
  bocal_clous: {
    nom: "bocal de clous et vis mélangés",
    pluriel: "bocaux de clous et vis mélangés",
    description: "Deux kilos et demi de tout, en vrac. Il y a forcément la bonne vis là-dedans. Quelque part.",
    poids: 2.5,
    valeur: 8,
    famille: "garage",
    rarete: "C",
  },
  rouleau_fil_fer: {
    nom: "rouleau de fil de fer",
    pluriel: "rouleaux de fil de fer",
    description: "Ligatures, collets, fil d'alarme : il servira, c'est sûr. Juste pas aujourd'hui.",
    poids: 1.5,
    valeur: 10,
    famille: "garage",
    rarete: "C",
  },
  ruban_adhesif: {
    nom: "rouleau de ruban adhésif gris",
    pluriel: "rouleaux de ruban adhésif gris",
    description: "Il répare tout, sauf la civilisation. Le rouleau est à moitié entamé.",
    poids: 0.25,
    valeur: 6,
    famille: "garage",
    rarete: "C",
  },
  pied_de_biche: {
    nom: "pied-de-biche",
    pluriel: "pieds-de-biche",
    description: "Deux kilos et demi d'acier forgé. Il ouvre les portes que personne n'ouvrira plus, et en garde d'autres fermées.",
    poids: 2.5,
    // Sa valeur de remplacement (Book 25 §11) : forger 2,5 kg d'acier, c'est une journée de forge.
    valeur: 150,
    famille: "garage",
    rarete: "P",
  },
  etau: {
    nom: "étau d'établi",
    pluriel: "étaux d'établi",
    description: "Neuf kilos de fonte qui serrent. Sur un établi, il change tout ; dans un sac, il change surtout le poids.",
    poids: 9,
    valeur: 35,
    famille: "garage",
    rarete: "P",
    // Plan 0.8 (I7) : une clé du niveau 1 (L1B, l'établi du rhabilleur) sort des tables de fouille courantes.
    horsTirage: true,
  },
  groupe_electrogene: {
    nom: "groupe électrogène",
    pluriel: "groupes électrogènes",
    description: "Quarante-cinq kilos, réservoir sec. Sans carburant, il ne vaut que son alternateur : du cuivre et des aimants.",
    poids: 45,
    valeur: 150,
    famille: "garage",
    rarete: "R",
  },
  sac_ciment: {
    nom: "sac de ciment durci",
    pluriel: "sacs de ciment durci",
    description: "Vingt-cinq kilos de ciment pris en bloc par l'humidité. Cassé au marteau, ça fait des pierres. C'est tout.",
    poids: 25,
    valeur: 2,
    famille: "garage",
    rarete: "P",
  },
  rallonge: {
    nom: "rallonge de 25 m",
    pluriel: "rallonges de 25 m",
    description: "Vingt-cinq mètres de câble orange enroulés n'importe comment. Du cuivre, ou une corde qui ne pourrit pas.",
    poids: 2.5,
    valeur: 18,
    famille: "garage",
    rarete: "C",
  },
  // ---- 🚗 Voiture et route ----
  chambre_air: {
    nom: "chambre à air",
    pluriel: "chambres à air",
    description: "Crevée, mais le caoutchouc est bon. Découpée en bandes : des élastiques de fronde, des joints, des sangles.",
    poids: 0.8,
    valeur: 5,
    famille: "voiture",
    rarete: "C",
  },
  enjoliveur: {
    nom: "enjoliveur",
    pluriel: "enjoliveurs",
    description: "Il enjolivait. Maintenant c'est une gamelle, un réflecteur, ou un bouclier très optimiste.",
    poids: 0.6,
    valeur: 2,
    famille: "voiture",
    rarete: "C",
  },
  retroviseur: {
    nom: "rétroviseur",
    pluriel: "rétroviseurs",
    description: "« Les objets dans le miroir sont plus proches qu'il n'y paraît. » Les Éteints aussi.",
    poids: 0.8,
    valeur: 5,
    famille: "voiture",
    rarete: "C",
  },
  ceinture_securite: {
    nom: "ceinture de sécurité",
    pluriel: "ceintures de sécurité",
    description: "Une sangle tissée qui tient une tonne. Découpée et nouée, elle vaut une bonne corde.",
    poids: 0.5,
    valeur: 6,
    famille: "voiture",
    rarete: "C",
  },
  cables_demarrage: {
    nom: "câbles de démarrage",
    pluriel: "paires de câbles de démarrage",
    description: "Deux gros câbles et leurs pinces. Pour relier des batteries… ou en tirer du cuivre épais.",
    poids: 1.8,
    valeur: 20,
    famille: "voiture",
    rarete: "P",
  },
  cric: {
    nom: "cric",
    pluriel: "crics",
    description: "Il soulève une voiture à la force du poignet. Un jour, une presse ou un pressoir ; aujourd'hui, trois kilos et demi.",
    poids: 3.5,
    valeur: 20,
    famille: "voiture",
    rarete: "P",
  },
  sapin_desodorisant: {
    nom: "sapin désodorisant « Voiture neuve »",
    pluriel: "sapins désodorisants « Voiture neuve »",
    description: "Il sent encore la voiture neuve. Plus rien d'autre ne sent la voiture neuve.",
    poids: 0.01,
    valeur: 1,
    famille: "voiture",
    rarete: "C",
  },
  boite_gants_pv: {
    nom: "boîte à gants pleine de PV",
    pluriel: "boîtes à gants pleines de PV",
    description: "Des contraventions jamais payées, soigneusement pliées. La preuve qu'on était civilisés. Un bon allume-feu.",
    poids: 0.5,
    valeur: 1,
    famille: "voiture",
    rarete: "C",
  },
  // ---- 🌱 Ferme et jardin ----
  beche: {
    nom: "bêche",
    pluriel: "bêches",
    description: "Un fer droit, un manche de frêne patiné. Elle creuse vite et profond (Creuser 2).",
    poids: 2,
    valeur: 15,
    famille: "ferme",
    rarete: "C",
  },
  secateur: {
    nom: "sécateur",
    pluriel: "sécateurs",
    description: "Le ressort grince, les lames se croisent encore. Il attend un verger et un printemps.",
    poids: 0.3,
    valeur: 10,
    famille: "ferme",
    rarete: "C",
  },
  tuyau_arrosage: {
    nom: "tuyau d'arrosage",
    pluriel: "tuyaux d'arrosage",
    description: "Vingt mètres de tuyau vert, durci par le soleil. Un siphon, une irrigation, ou des bandes de caoutchouc.",
    poids: 3,
    valeur: 6,
    famille: "ferme",
    rarete: "C",
  },
  nain_jardin: {
    nom: "nain de jardin",
    pluriel: "nains de jardin",
    description: "Il y a désormais plus de nains de jardin que de survivants. Celui-ci sourit toujours. Trois kilos de céramique.",
    poids: 3,
    valeur: 1,
    famille: "ferme",
    rarete: "C",
  },
  sac_engrais: {
    nom: "sac d'engrais",
    pluriel: "sacs d'engrais",
    description: "Vingt-cinq kilos de granulés. Les Charbonniers y voient des nitrates ; ton dos y voit vingt-cinq kilos.",
    poids: 25,
    valeur: 12,
    famille: "ferme",
    rarete: "P",
  },
  grillage_rouleau: {
    nom: "rouleau de grillage",
    pluriel: "rouleaux de grillage",
    description: "Vingt-cinq mètres de grillage à poules. Un jour, un poulailler ; aujourd'hui, douze kilos qui accrochent tout.",
    poids: 12,
    valeur: 20,
    famille: "ferme",
    rarete: "P",
    // Plan 0.8 (I7) : une clé du niveau 1 (L1A, le parc à volailles) sort des tables de fouille courantes.
    horsTirage: true,
  },
  // ---------- La Coopérative du Plateau (Book 23 §2.2) : on ne les trouve que là ----------
  roulements: {
    nom: "boîte de roulements à billes",
    pluriel: "boîtes de roulements à billes",
    description: "Six roulements neufs, encore graissés dans leur papier huilé. Sans eux, rien ne tourne : ni roue, ni meule, ni dynamo.",
    poids: 1.2,
    valeur: 90,
    famille: "garage",
    rarete: "R",
    horsTirage: true,
  },
  alternateur_tracteur: {
    nom: "alternateur de tracteur",
    pluriel: "alternateurs de tracteur",
    description: "Neuf, dans son carton : « pièce d'origine ». Du cuivre, des aimants, un régulateur. Bien monté, il fait de l'électricité avec tout ce qui tourne.",
    poids: 6,
    valeur: 160,
    famille: "garage",
    rarete: "R",
    horsTirage: true,
  },
  semences_f1: {
    nom: "sachet de semences F1",
    pluriel: "sachets de semences F1",
    description: "« Tomate Abondance F1 — rendement garanti ». Des graines de l'ancien monde, gardées au froid. Elles poussent une fois, et très bien.",
    poids: 0.05,
    valeur: 120,
    famille: "ferme",
    rarete: "L",
    horsTirage: true,
  },
  // Les armes de la Coopérative (Book 23 §4.6).
  machette: {
    nom: "machette de fortune",
    pluriel: "machettes de fortune",
    description: "Une tôle d'acier découpée et meulée, un manche de bois ficelé. Elle a dégagé des fossés ; elle tranche encore, sans plus. Contre un casque, elle glisse.",
    poids: 0.8,
    valeur: 30,
    famille: "garage",
    rarete: "P",
    horsTirage: true,
  },
  masse: {
    nom: "masse",
    pluriel: "masses",
    description: "Trois kilos d'acier au bout d'un manche de frêne. Lente à lever, mais aucun casque n'y résiste.",
    poids: 3.6,
    // Sa valeur de remplacement (Book 25 §11) : trois kilos d'acier forgé et un manche de frêne.
    valeur: 200,
    famille: "garage",
    rarete: "P",
    horsTirage: true,
  },
  // La lance n'est plus un vestige (Book 25 §11) : elle se fabrique, et vaut ce que vaut sa recette (objets.ts).
  cle_coffre: {
    nom: "clé du coffre",
    pluriel: "clés du coffre",
    description: "Une clé plate, à double panneton, au bout d'une chaînette « MAGASIN ». Elle ouvre quelque chose d'important.",
    poids: 0.05,
    valeur: 1,
    famille: "salon",
    rarete: "C",
    horsTirage: true,
  },
  // La radio de l'atelier (Book 23 §4.7, 0.5.1) : elle se prend et se pose ailleurs dans la Coopérative.
  radio_piles: {
    nom: "radio à piles",
    pluriel: "radios à piles",
    description: "Le poste orange de l'atelier, réglé sur la Compagnie. Pose-le où tu veux attirer les Éteints, puis allume-le. Il ne capte l'émetteur qu'au Plateau.",
    poids: 2,
    valeur: 8,
    famille: "gadget",
    rarete: "C",
    horsTirage: true,
  },
  // Les débris d'une arme cassée (Book 23 §4.3, 0.5.1) : ils se démontent et rendent un peu de matière.
  manche_fendu: {
    nom: "manche fendu",
    pluriel: "manches fendus",
    description: "Ce qui reste d'une arme de bois : fendu dans le fil, il ne tiendra plus un coup. Démonté, il fait encore du petit bois.",
    poids: 0.8,
    valeur: 1,
    famille: "garage",
    rarete: "C",
    teinte: "#8a6a40",
    horsTirage: true,
  },
  lame_ebrechee: {
    nom: "lame ébréchée",
    pluriel: "lames ébréchées",
    description: "Une lame cassée net, le fil en dents de scie. L'acier est bon : un Charbonnier saura le reforger.",
    poids: 0.4,
    valeur: 4,
    famille: "garage",
    rarete: "C",
    teinte: "#9aa3a8",
    horsTirage: true,
  },
  ferraille_tordue: {
    nom: "ferraille tordue",
    pluriel: "ferrailles tordues",
    description: "Le fer d'une arme qui a trop servi, tordu et fendu. Redressé au marteau, il redevient une barre de métal.",
    poids: 2.2,
    valeur: 6,
    famille: "garage",
    rarete: "C",
    teinte: "#6b6560",
    horsTirage: true,
  },
  // ---------- Le métier des familles (Book 25 §9.2, 0.6) : des vestiges qui servent enfin à quelque chose ----------
  fil_dentaire: {
    nom: "bobine de fil dentaire",
    pluriel: "bobines de fil dentaire",
    description: "« Menthe Glaciale, 50 m ». Retordu en trois, il fait la meilleure corde d'arc qu'on puisse trouver.",
    poids: 0.02,
    valeur: 4,
    famille: "salle_de_bain",
    rarete: "C",
    teinte: "#7fd0c8",
  },
  appareil_photo_jetable: {
    nom: "appareil photo jetable",
    pluriel: "appareils photo jetables",
    description: "« Vingt-sept poses, toutes de son assiette. » Son flash cache un condensateur : de la haute tension, en petit.",
    poids: 0.15,
    valeur: 6,
    famille: "salon",
    rarete: "C",
    teinte: "#d8a83a",
  },
  raquette_moustiques: {
    nom: "raquette anti-moustiques",
    pluriel: "raquettes anti-moustiques",
    description: "« Électrocute les insectes et les ennuis. » Dans le manche, un petit étage haute tension tout fait.",
    poids: 0.3,
    valeur: 10,
    famille: "gadget",
    rarete: "C",
    teinte: "#e0c040",
  },
  bobine_allumage: {
    nom: "bobine d'allumage",
    pluriel: "bobines d'allumage",
    description: "Elle faisait jaillir l'étincelle des bougies : des milliers de volts, d'une batterie de 12 V. La vraie haute tension.",
    poids: 0.8,
    valeur: 35,
    famille: "voiture",
    rarete: "P",
    // Plan 0.8 (I12) : elle quitte les épaves et la mobylette de la station ; elle ira à H2A, avec une épave de
    // mobylette. Le module à bobine ★★★ ne s'obtient plus avant le niveau 2.
    horsTirage: true,
  },
  lime_usee: {
    nom: "lime usée",
    pluriel: "limes usées",
    description: "Elle sortait d'un « kit manucure de luxe » de quatre kilos. De l'acier à outils : la meilleure lame qui soit.",
    poids: 0.3,
    valeur: 40,
    famille: "garage",
    rarete: "P",
    teinte: "#6b7b8c",
  },
  soc_charrue: {
    nom: "soc de charrue",
    pluriel: "socs de charrue",
    description: "Un soc usé, poli par la terre. Un bon acier, qui se forge en hache ou en serpe.",
    poids: 4,
    valeur: 45,
    famille: "ferme",
    rarete: "P",
  },
  troncon_rail: {
    nom: "tronçon de rail",
    pluriel: "tronçons de rail",
    description: "Un bout de rail de l'embranchement des silos, où plus aucun train n'est passé depuis la Grande Panne. Une enclume.",
    poids: 18,
    valeur: 120,
    famille: "garage",
    rarete: "R",
    teinte: "#55524d",
  },
  arc_sportif: {
    nom: "arc de tir sportif",
    pluriel: "arcs de tir sportif",
    description: "« Club de tir à l'arc d'entreprise, séminaire 2031. » Un arc à poulies, viseur et stabilisateur : tout fait.",
    poids: 1.8,
    valeur: 250,
    famille: "gadget",
    rarete: "R",
    teinte: "#2b2b2b",
  },
  fleche_carbone: {
    nom: "flèche en carbone",
    pluriel: "flèches en carbone",
    description: "Une flèche de compétition, noire et légère. Elle ne casse pas : on la perd.",
    poids: 0.02,
    valeur: 12,
    famille: "gadget",
    rarete: "P",
    teinte: "#3a3a3a",
  },
  bidon_huile: {
    nom: "bidon d'huile moteur",
    pluriel: "bidons d'huile moteur",
    description: "« Huile Turbo Max Énergie, pour moteurs de plus de 400 chevaux. » Cinq litres : vingt trempes de lames.",
    poids: 4.5,
    valeur: 30,
    famille: "garage",
    rarete: "C",
    teinte: "#c8362b",
  },
  // Les trois manuels (Book 25 §2.3) : lus, ils ouvrent les recettes d'une famille (×1,5, ★★ au plus).
  manuel_forgeron: {
    nom: "Manuel du forgeron amateur",
    pluriel: "Manuels du forgeron amateur",
    description: "« Forgez vos propres couteaux à steak en un week-end ! » Lu, il ouvre les recettes des Charbonniers.",
    poids: 0.6,
    valeur: 20,
    famille: "salon",
    rarete: "R",
    teinte: "#b3432a",
  },
  manuel_electricien: {
    nom: "Guide de l'électricien du dimanche",
    pluriel: "Guides de l'électricien du dimanche",
    description: "« Ne touchez jamais les deux fils à la fois. » Lu, il ouvre les recettes des Voltaïques.",
    poids: 0.5,
    valeur: 20,
    famille: "salon",
    rarete: "R",
    teinte: "#2f5fa4",
  },
  manuel_arbalete: {
    nom: "L'Arbalète pour les nuls",
    pluriel: "exemplaires de L'Arbalète pour les nuls",
    description: "Couverture jaune, coins cornés. Lu, il ouvre les recettes des Mécanistes.",
    poids: 0.5,
    valeur: 20,
    famille: "salon",
    rarete: "R",
    teinte: "#d8c43a",
  },
  // ---------- Le niveau 1 (plan 0.8, chantier 3) : les objets qu'on trouve, tous à une place fixe ----------
  // Hors des tirages : chacun a sa place (la ruine, la station, L1A, L1B), et le chantier 10 leur donne à la main une
  // chance rare ailleurs (R-BUTIN, I7). Les objets fabriqués du niveau 1 sont dans objets-niveau1.ts.
  // La maison : la ruine et sa caisse à outils.
  bidon_5l: {
    nom: "bidon de 5 L",
    pluriel: "bidons de 5 L",
    description: "Un bidon de plastique blanc, cinq litres, son bouchon encore vissé. Rincé, il gardera l'eau de pluie.",
    poids: 0.3,
    valeur: 4,
    famille: "ferme",
    rarete: "C",
    teinte: "#e8e4d8",
    horsTirage: true,
  },
  tete_marteau: {
    nom: "tête de marteau",
    pluriel: "têtes de marteau",
    description: "Une tête de marteau de menuisier, le manche tombé en poussière. Une branche droite dans l'œil, et elle tape de nouveau.",
    poids: 0.5,
    valeur: 20,
    famille: "garage",
    rarete: "P",
    teinte: "#55524d",
    horsTirage: true,
  },
  // H1A : les pièces de famille, dans l'atelier du garage (chacun la sienne : chantier 10).
  enclume_depanneur: {
    nom: "enclume de dépanneur",
    pluriel: "enclumes de dépanneur",
    description: "Une petite enclume de garage, dix kilos d'acier, la table polie par trente ans de coups. Près d'un foyer, elle forge.",
    poids: 10,
    valeur: 120,
    famille: "garage",
    rarete: "R",
    teinte: "#4a4844",
    horsTirage: true,
  },
  petit_alternateur: {
    nom: "petit alternateur",
    pluriel: "petits alternateurs",
    description: "L'alternateur d'une petite voiture, sorti du moteur avec sa poulie. Entraîné par une courroie, il charge une batterie.",
    poids: 3.5,
    valeur: 110,
    famille: "voiture",
    rarete: "R",
    teinte: "#9aa3a8",
    horsTirage: true,
  },
  // H1A : le bocal de clous de la caisse de l'atelier, vidé (I2).
  poignee_clous: {
    nom: "poignée de clous",
    pluriel: "poignées de clous",
    description: "Des clous triés dans le bocal, tous de la bonne longueur. De quoi clouer un abri, ou cercler un coffre.",
    poids: 0.5,
    valeur: 2,
    famille: "garage",
    rarete: "C",
    teinte: "#8a8f96",
    horsTirage: true,
  },
  // L1A : la laiterie de la Coopérative (I8).
  seau_10l: {
    nom: "seau galvanisé de 10 L",
    pluriel: "seaux galvanisés de 10 L",
    description: "Un seau de laiterie en tôle galvanisée, une anse de fil. Dix litres, sans une fuite.",
    poids: 1.4,
    valeur: 12,
    famille: "ferme",
    rarete: "P",
    teinte: "#b8bcc0",
    horsTirage: true,
  },
  // L1B : le magasin, l'étable et l'atelier du Moulin.
  toile_jute: {
    nom: "toile de jute",
    pluriel: "toiles de jute",
    description: "Des sacs à farine du Moulin, décousus et mis à plat. Une toile rêche et serrée, qui arrête le vent.",
    poids: 1.2,
    valeur: 10,
    famille: "textile",
    rarete: "P",
    teinte: "#b89a64",
    horsTirage: true,
  },
  feuillards: {
    nom: "botte de feuillards",
    pluriel: "bottes de feuillards",
    description: "Les cercles de fer d'un baril à farine, chassés au marteau. Cloués autour d'un coffre, ils le tiennent pour vingt ans.",
    poids: 3,
    valeur: 15,
    famille: "ferme",
    rarete: "P",
    teinte: "#6b6560",
    horsTirage: true,
  },
  // L'arme trouvée de L1B (I22, I30) : ses valeurs d'arme sont au chantier 8. Elle ne sert pas d'outil.
  fourche_foin: {
    nom: "fourche à foin",
    pluriel: "fourches à foin",
    description: "Trois dents d'acier au bout d'un long manche de frêne. On la tient à deux mètres, et elle passe où un casque arrête un coup.",
    poids: 1.8,
    valeur: 60,
    famille: "ferme",
    rarete: "P",
    teinte: "#8a6a48",
    horsTirage: true,
  },
  // La clé de la grande porte du Moulin (plan 0.8 §10.1), au tableau de l'atelier, comme la clé du coffre de L1A.
  cle_moulin: {
    nom: "grosse clé du Moulin",
    pluriel: "grosses clés du Moulin",
    description: "Une clé de fer longue comme la main, une étiquette de bois au bout d'une ficelle : « GRANDE PORTE ».",
    poids: 0.4,
    valeur: 1,
    famille: "salon",
    rarete: "C",
    teinte: "#5c5650",
    horsTirage: true,
  },
} satisfies Record<string, DefinitionVestige>;

/** Les vestiges : le lot 1 (0.3 et 0.6) et les déchets de l'Abondance (lot 2, 0.7 : vestiges-lot2.ts). */
export const VESTIGES = { ...VESTIGES_LOT1, ...VESTIGES_LOT2 };

export type TypeVestige = keyof typeof VESTIGES;

/** Les vestiges et les composants, pour le catalogue des objets. */
export const TOUS_LES_VESTIGES: Record<TypeVestige | TypeComposant, DefinitionVestige> = { ...VESTIGES, ...COMPOSANTS };

/** La valeur de chacun (énergie grise, en wotts) : elle s'ajoute à ENERGIE_GRISE_BASE. */
export function valeursVestiges(): Partial<Record<TypeObjet, number>> {
  return Object.fromEntries(Object.entries(TOUS_LES_VESTIGES).map(([t, d]) => [t, d.valeur]));
}

/**
 * Une ordure : un vestige qui ne vaut rien (valeur 0, lot 2). Le Comptoir ne la reprend pas (« Les Compteurs ne
 * reprennent pas les ordures. ») ; jetée hors du terrain personnel, elle disparaît au bout de 24 h (Q10).
 */
export function estOrdure(type: string): boolean {
  return definitionVestige(type)?.valeur === 0;
}

/** La définition d'un objet s'il est un vestige ou un composant. */
export function definitionVestige(type: string): DefinitionVestige | undefined {
  return Object.hasOwn(TOUS_LES_VESTIGES, type) ? TOUS_LES_VESTIGES[type as TypeVestige] : undefined;
}

// ---------- Démonter un vestige depuis le sac ----------

export interface Demontage {
  /** Ce qu'on en tire (le reste part au rebut). */
  donne: Inventaire;
  /** La qualité d'outil demandée (Book 03 §4). */
  qualites: Partial<Record<Qualite, number>>;
  /** Durée réelle, en secondes (avant le réglage gestes_vitesse). */
  duree: number;
}

/**
 * Ce que donne chaque vestige démontable. Visser 1 (le couteau) suffit pour l'électronique grand public ;
 * le groupe électrogène et le robot demandent de vrais outils. Ce qui n'est pas ici ne se démonte pas (encore) :
 * il garde son usage futur (cocotte, étau, encyclopédie…) ou il ne sert à rien (le nain).
 */
export const DEMONTAGE: Partial<Record<TypeObjet, Demontage>> = {
  casserole: { donne: { aluminium: 3 }, qualites: { marteler: 1 }, duree: 4 },
  grille_pain_facial: { donne: { resistance: 2, petit_ressort: 2, fil_cuivre: 1 }, qualites: { visser: 1 }, duree: 5 },
  micro_ondes: { donne: { fil_cuivre: 4, verre: 1, petit_moteur: 1 }, qualites: { visser: 1 }, duree: 10 },
  machine_capsules: { donne: { resistance: 1, petit_moteur: 1, plastique: 3 }, qualites: { visser: 1 }, duree: 6 },
  aimant_frigo: { donne: { aimant: 1 }, qualites: {}, duree: 1 },
  brosse_dents_connectee: { donne: { petit_moteur: 1, pile: 1 }, qualites: { visser: 1 }, duree: 3 },
  seche_cheveux: { donne: { resistance: 1, petit_moteur: 1, fil_cuivre: 1, plastique: 1 }, qualites: { visser: 1 }, duree: 4 },
  miroir_salle_bain: { donne: { verre: 3 }, qualites: { marteler: 1 }, duree: 3 },
  pyramide_papier_toilette: { donne: { rouleau_papier_toilette: 96 }, qualites: {}, duree: 6 },
  balance_connectee: { donne: { pile: 2, verre: 1, plastique: 1 }, qualites: { visser: 1 }, duree: 3 },
  tele_85: { donne: { led: 30, fil_cuivre: 2, plastique: 6, aluminium: 4 }, qualites: { visser: 1 }, duree: 20 },
  telecommande: { donne: { pile: 2, led: 1 }, qualites: {}, duree: 2 },
  aspirateur_robot: { donne: { petit_moteur: 3, cellule_lithium: 4, plastique: 4 }, qualites: { visser: 1 }, duree: 8 },
  guirlande: { donne: { led: 20, fil_cuivre: 1 }, qualites: { couper: 1 }, duree: 6 },
  tableau_vivre_rire: { donne: { branche: 2 }, qualites: {}, duree: 3 },
  ventilateur: { donne: { petit_moteur: 1, fil_cuivre: 1, plastique: 3 }, qualites: { visser: 1 }, duree: 6 },
  coussin_peteur: { donne: { caoutchouc: 1 }, qualites: { couper: 1 }, duree: 1 },
  reveil: { donne: { pile: 2, petit_ressort: 1 }, qualites: {}, duree: 2 },
  smartphone_fele: { donne: { cellule_lithium: 1, verre: 1, petit_moteur: 1, aimant: 1 }, qualites: { visser: 1 }, duree: 5 },
  batterie_externe: { donne: { cellule_lithium: 4 }, qualites: { visser: 1 }, duree: 4 },
  ordinateur_portable: { donne: { cellule_lithium: 6, petit_moteur: 1, aimant: 2, fil_cuivre: 1 }, qualites: { visser: 1 }, duree: 10 },
  enceinte_intelligente: { donne: { aimant: 1, fil_cuivre: 1, led: 4, plastique: 2 }, qualites: { visser: 1 }, duree: 4 },
  montre_connectee: { donne: { pile: 1, petit_moteur: 1 }, qualites: { visser: 1 }, duree: 3 },
  sac_cables: { donne: { fil_cuivre: 3, plastique: 2 }, qualites: { couper: 1 }, duree: 8 },
  vapoteuse: { donne: { cellule_lithium: 1, resistance: 1 }, qualites: { visser: 1 }, duree: 2 },
  robot_domestique: { donne: { petit_moteur: 6, cellule_lithium: 10, aimant: 4, fil_cuivre: 4, led: 6, plastique: 12 }, qualites: { visser: 2 }, duree: 30 },
  perceuse_visseuse: { donne: { cellule_lithium: 5, petit_moteur: 1, aimant: 2 }, qualites: { visser: 1 }, duree: 5 },
  groupe_electrogene: { donne: { fil_cuivre: 10, aimant: 4, barre_metal: 2 }, qualites: { serrer: 2, visser: 1 }, duree: 45 },
  sac_ciment: { donne: { pierre: 6 }, qualites: { marteler: 2 }, duree: 15 },
  rallonge: { donne: { fil_cuivre: 4, plastique: 1 }, qualites: { couper: 1 }, duree: 6 },
  chambre_air: { donne: { caoutchouc: 6 }, qualites: { couper: 1 }, duree: 4 },
  enjoliveur: { donne: { plastique: 3 }, qualites: {}, duree: 2 },
  retroviseur: { donne: { verre: 1, plastique: 1, petit_moteur: 1 }, qualites: { visser: 1 }, duree: 3 },
  ceinture_securite: { donne: { corde: 1 }, qualites: { couper: 1 }, duree: 4 },
  cables_demarrage: { donne: { fil_cuivre: 5 }, qualites: { couper: 1 }, duree: 6 },
  boite_gants_pv: { donne: { papier: 5 }, qualites: {}, duree: 2 },
  tuyau_arrosage: { donne: { caoutchouc: 4 }, qualites: { couper: 1 }, duree: 4 },
  // Les débris d'arme (Book 23 §4.3, 0.5.1) : un peu de matière, pas l'arme.
  manche_fendu: { donne: { branche: 1 }, qualites: {}, duree: 2 },
  // Vider le bocal de clous (I2) : cinq poignées triées. Les flèches et les carreaux de clou prennent encore le bocal.
  bocal_clous: { donne: { poignee_clous: 5 }, qualites: {}, duree: 6 },
  ferraille_tordue: { donne: { barre_metal: 1 }, qualites: { marteler: 1 }, duree: 8 },
  // Les déchets de l'Abondance (lot 2, 0.7) : vestiges-lot2.ts.
  ...DEMONTAGE_LOT2,
};

// ---------- La fouille rapporte du bric-à-brac ----------

/** Les lieux de fouille : chacun a sa table de vestiges. */
export type LieuFouille = "boutique" | "atelier" | "epave" | "grange" | "libre_service" | "quai" | "atelier_coop" | "hangar" | "bureaux" | "chambre_froide";

/** Quel lieu pour quelle ressource fouillée (la halte, et la caisse à outils de la ruine de ferme). */
export const LIEU_DE_FOUILLE: Partial<Record<TypeRessource, LieuFouille>> = {
  rayonnage: "boutique",
  caisse_atelier: "atelier",
  caisse_outils: "atelier",
  epave_voiture: "epave",
  epave_camion: "epave",
  grenier: "grange",
  coop_rayon: "libre_service",
  coop_caisse: "libre_service",
  coop_palettes: "quai",
  coop_etabli: "atelier_coop",
  coop_rayonnage: "hangar",
  coop_coffre: "bureaux",
  coop_caisse_froide: "chambre_froide",
};

/**
 * Le poids de chaque famille dans chaque lieu. La boutique de la station : cuisine, salle de bain, gadgets ;
 * l'atelier : le garage ; les épaves : la voiture ; la grange : la ferme, et le débarras (salon) qu'on y entassait.
 */
export const FAMILLES_PAR_LIEU: Record<LieuFouille, Partial<Record<FamilleVestige, number>>> = {
  boutique: { cuisine: 3, salle_de_bain: 3, gadget: 3, salon: 1 },
  atelier: { garage: 6, gadget: 1, voiture: 1 },
  epave: { voiture: 6, gadget: 1 },
  grange: { ferme: 4, salon: 2, garage: 1 },
  // La Coopérative (Book 23 §2.2) : commun dehors, plus rare au fond.
  libre_service: { cuisine: 3, ferme: 3, salle_de_bain: 1, gadget: 1 },
  quai: { ferme: 3, garage: 3 },
  atelier_coop: { garage: 6, voiture: 2 },
  hangar: { ferme: 6, garage: 2 },
  bureaux: { gadget: 3, salon: 3 },
  chambre_froide: { garage: 3, ferme: 3 },
};

/**
 * Ce que les fouilles existantes donnent en plus de leurs familles (lot 2, 0.7) : le couteau abîmé (rare), pour la
 * lance ; l'onduleur et la trottinette électrique (peu communs), pour leur petite batterie ; le sac de charbon de
 * barbecue (peu commun) à la boutique de la station ; la conserve bombée parmi les conserves. Chacun pèse comme un
 * vestige d'une famille de poids 3, selon sa rareté.
 */
export const EN_PLUS_PAR_LIEU: Partial<Record<LieuFouille, Partial<Record<TypeObjet, Rarete>>>> = {
  boutique: { couteau: "R", sac_charbon_bbq: "P", conserve_bombee: "C", onduleur: "P" },
  libre_service: { couteau: "R", conserve_bombee: "C" },
  grange: { couteau: "R" },
  hangar: { trottinette_electrique: "P" },
  bureaux: { onduleur: "P" },
};

/** Le poids de tirage de chaque rareté (P-003 §1). */
export const POIDS_RARETE: Record<Rarete, number> = { C: 10, P: 4, R: 1, L: 0.25 };

/** De 1 à 3 vestiges par fouille. */
export const VESTIGES_PAR_FOUILLE = { min: 1, max: 3 } as const;

/**
 * La table pondérée d'un lieu : chaque vestige du lot 1, avec son poids (famille × rareté), dans l'ordre du
 * catalogue ; puis ce que le lieu donne en plus (EN_PLUS_PAR_LIEU). Les déchets du lot 2 ont leurs propres tables
 * (dechets.ts) : ils n'encombrent pas les caisses et les rayonnages.
 */
export function tableDeFouille(lieu: LieuFouille): [TypeObjet, number][] {
  const familles = FAMILLES_PAR_LIEU[lieu];
  const table: [TypeObjet, number][] = [];
  for (const [type, d] of Object.entries(VESTIGES_LOT1) as [TypeVestige, DefinitionVestige][]) {
    if (d.horsTirage) continue;
    const f = familles[d.famille] ?? 0;
    if (f > 0) table.push([type, f * POIDS_RARETE[d.rarete]]);
  }
  for (const [type, r] of Object.entries(EN_PLUS_PAR_LIEU[lieu] ?? {}) as [TypeObjet, Rarete][]) table.push([type, 3 * POIDS_RARETE[r]]);
  return table;
}

/** Un tirage dans une table pondérée (alea dans [0, 1[ ; 1 est ramené au dernier). */
function tirer<T>(table: [T, number][], alea: () => number): T {
  const total = table.reduce((s, [, p]) => s + p, 0);
  let r = Math.min(Math.max(alea(), 0), 0.999999) * total;
  for (const [t, p] of table) {
    if (r < p) return t;
    r -= p;
  }
  return table[table.length - 1]![0];
}

/** Ce qu'une fouille rapporte en plus de l'objet habituel : 1 à 3 vestiges tirés dans la table du lieu. */
export function tirerVestiges(lieu: LieuFouille, alea: () => number): Inventaire {
  const table = tableDeFouille(lieu);
  const { min, max } = VESTIGES_PAR_FOUILLE;
  const n = Math.min(max, min + Math.floor(Math.min(Math.max(alea(), 0), 0.999999) * (max - min + 1)));
  const trouve: Inventaire = {};
  for (let i = 0; i < n; i++) {
    const t = tirer(table, alea);
    trouve[t] = (trouve[t] ?? 0) + 1;
  }
  return trouve;
}
