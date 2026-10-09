// Le catalogue des objets de l'É1 (sous-ensemble des ≈ 40 objets du Book 21 §3.4).
// Poids réalistes (Book 12). Plus tard, ce catalogue viendra d'un tableur (Book 03 §8).

import type { Famille } from "./regles.ts";
import { estCleEtoileeValide, etoilesDe, etoilesTexte, typeDe, type CleObjet } from "./etoiles.ts";
import { TOUS_LES_VESTIGES, type FamilleVestige, type Rarete, type TypeComposant, type TypeVestige } from "./vestiges.ts";
import { OBJETS_METIER, type TypeObjetMetier } from "./objets-metier.ts";

/**
 * Tous les objets : ceux du jeu de base, le bric-à-brac des vestiges (lot 1, 0.3) avec leurs composants, et les
 * matières et objets du métier des familles (Book 25, 0.6 : objets-metier.ts).
 */
export type TypeObjet = TypeObjetDeBase | TypeVestige | TypeComposant | TypeObjetMetier;

type TypeObjetDeBase =
  | "branche"
  | "buche"
  | "pierre"
  | "baies"
  | "conserve"
  | "couteau"
  | "briquet"
  | "gourde"
  | "sac_a_dos"
  | "pierre_a_feu"
  | "marteau"
  | "lampe_dynamo"
  | "petite_batterie"
  | "scie"
  | "corde"
  | "torche"
  | "lampe_frontale"
  | "lanterne"
  // Vestiges et pièces (É2, Book 21 §3.4)
  | "hache"
  | "tete_hache"
  | "cle_plate"
  | "tournevis"
  | "cadre_velo"
  | "chaine_velo"
  | "roue_velo"
  | "dynamo_velo"
  | "ressort_lames"
  | "bache"
  | "barre_metal"
  | "batterie_voiture"
  // Chaînes des familles (É2, lot 2)
  | "charbon_bois"
  | "lame_forgee"
  | "couteau_aiguise"
  // La halte (É3)
  | "panneau_solaire"
  // Soins (É3, lot 3)
  | "chiffons"
  | "fibres"
  | "pansement"
  // Fruits et champignons du terrain (2026-10-08) : de vrais noms, de vraies calories.
  | "pomme"
  | "poire"
  | "prunes"
  | "cerises"
  | "noix"
  | "cepe"
  | "amanite_tue_mouches"
  | "amanite_phalloide"
  // La chasse à la volaille (2026-10-08)
  | "gourdin"
  | "poule"
  | "volaille_crue"
  | "volaille_cuite"
  // Les plats cuisinés au feu (2026-10-08) : ils nourrissent mieux (cuisson, réconfort, ça cale).
  | "volaille_cepes"
  | "cepes_poeles"
  | "pommes_cuites"
  // Les mijotés du foyer de cuisine (Book 24 §3.1) : des soupes, qui désaltèrent aussi.
  | "soupe_cepes"
  | "pot_au_feu"
  // Le sac de fortune : un cadre de branches lié de corde, quand on a perdu son sac à dos (2026-10-08).
  | "sac_fortune"
  // La gamme bushcraft, lot 1 (P-002, 2026-10-08) : rien que des matières qu'on a déjà.
  | "ficelle"
  | "baton_fouir"
  | "epieu"
  | "boite_vide"
  | "protege_bras"
  | "travois"
  // La lance n'est plus un vestige (Book 25 §11) : elle se fabrique (épieu, couteau, ficelle).
  | "lance";

export interface DefinitionObjet {
  nom: string;
  /** Une phrase pour la fiche de l'objet (ton du Book 15). */
  description: string;
  /** Pluriel, pour « 3 bûches ». */
  pluriel: string;
  /** Poids d'une unité, en kg. */
  poids: number;
  /** Énergie d'une unité si on la mange, en kcal. */
  kcal?: number;
  /** L'eau qu'elle apporte quand on la mange, en litres (fruits ≈ 85 % d'eau, plats mijotés…), 2026-10-08. */
  eau?: number;
  /** Masse de combustible apportée au feu, en kg de bois sec. */
  combustible?: number;
  /** Lumière portée (Book 18 §4.2). */
  lumiere?: "torche" | "frontale" | "lanterne";
  /** Un plat chaud : points de santé rendus (le réconfort d'un vrai repas), et il cale (RASSASIE_HEURES). */
  plat?: { sante: number };
  /** Un champignon toxique : ce qu'il fait si on le mange (Book 05 §5 bis). */
  toxique?: "tue_mouches" | "phalloide" | "viande_crue";
  /** Un vestige ou un composant (lot 1, 0.3) : sa famille (icône, tri du sac) et sa rareté. */
  famille?: FamilleVestige;
  rarete?: Rarete;
}

const OBJETS_DE_BASE: Record<TypeObjetDeBase, DefinitionObjet> = {
  branche: { description: "Du bois mort, sec et léger. Parfait pour démarrer un feu.", nom: "branche", pluriel: "branches", poids: 0.5, combustible: 0.5 },
  buche: { description: "Bois sec et dense : un feu tient avec ça. Environ 1 h 20 de flammes.", nom: "bûche de bois sec", pluriel: "bûches de bois sec", poids: 2, combustible: 2 },
  pierre: { description: "Une pierre de la taille d'un poing. Un cercle de pierres garde le feu à sa place.", nom: "pierre", pluriel: "pierres", poids: 2 },
  baies: { description: "Sauvages, un peu acides. 130 kcal la poignée.", nom: "poignée de baies", pluriel: "poignées de baies", poids: 0.25, kcal: 130, eau: 0.2 },
  conserve: { description: "Un vestige de l'Abondance. L'étiquette promet « Saveur Bonheur ». 400 kcal.", nom: "conserve", pluriel: "conserves", poids: 0.45, kcal: 400, eau: 0.3 },
  couteau: { description: "Lame ébréchée, manche recollé. Mieux que rien.", nom: "couteau abîmé", pluriel: "couteaux abîmés", poids: 0.2 },
  briquet: { description: "Il fait encore des étincelles. Pour combien de temps ?", nom: "briquet", pluriel: "briquets", poids: 0.05 },
  gourde: { description: "Un litre (un kilo d'eau, pleine). L'eau de la mare doit bouillir avant d'être bue.", nom: "gourde", pluriel: "gourdes", poids: 0.3 },
  sac_a_dos: { description: "Un sac de randonnée de l'Abondance. Porte jusqu'à 55 kg.", nom: "sac à dos", pluriel: "sacs à dos", poids: 1.5 },
  pierre_a_feu: { description: "Silex et acier : le feu des Charbonniers, inusable.", nom: "pierre à feu", pluriel: "pierres à feu", poids: 0.1 },
  marteau: { description: "Tête de fer, manche de frêne. L'outil de la forge.", nom: "marteau", pluriel: "marteaux", poids: 0.8 },
  lampe_dynamo: { description: "On tourne la manivelle, elle éclaire. Pas de pile, pas de souci.", nom: "lampe à dynamo", pluriel: "lampes à dynamo", poids: 0.3 },
  petite_batterie: { description: "Quelques wattheures en réserve. Précieuse.", nom: "petite batterie", pluriel: "petites batteries", poids: 1.2 },
  scie: { description: "Pour débiter le bois. Les dents tiennent encore.", nom: "scie à bois", pluriel: "scies à bois", poids: 0.7 },
  corde: { description: "Dix mètres de corde tressée. Ça sert toujours.", nom: "rouleau de corde", pluriel: "rouleaux de corde", poids: 1 },
  torche: { description: "Flamme orangée, bonne portée. Se voit de loin la nuit.", nom: "torche", pluriel: "torches", poids: 0.5, lumiere: "torche" },
  lampe_frontale: { description: "Lumière blanche, mains libres. Elle trahit ceux qui ont du courant.", nom: "lampe frontale", pluriel: "lampes frontales", poids: 0.15, lumiere: "frontale" },
  lanterne: { description: "Lumière jaune et douce, à dynamo. Discrète, mais éclaire peu.", nom: "lanterne à dynamo", pluriel: "lanternes à dynamo", poids: 0.6, lumiere: "lanterne" },
  hache: { description: "Une tête rouillée sur un manche neuf. Elle fend, elle abat.", nom: "hache remmanchée", pluriel: "haches remmanchées", poids: 1.6 },
  tete_hache: { description: "Rouillée, mais le fil se retrouve. Il lui manque un manche.", nom: "tête de hache", pluriel: "têtes de hache", poids: 1.2 },
  cle_plate: { description: "Une clé de 13, la plus utile de toutes. Pour desserrer les écrous.", nom: "clé plate", pluriel: "clés plates", poids: 0.2 },
  tournevis: { description: "Plat d'un côté, tordu de l'autre. Il visse encore.", nom: "tournevis", pluriel: "tournevis", poids: 0.1 },
  cadre_velo: { description: "Un cadre d'acier, solide. La base d'un pédalier.", nom: "cadre de vélo", pluriel: "cadres de vélo", poids: 3.5 },
  chaine_velo: { description: "Elle a besoin de graisse, mais elle transmet.", nom: "chaîne de vélo", pluriel: "chaînes de vélo", poids: 0.3 },
  roue_velo: { description: "Rayons tordus, jante encore ronde. Un volant tout trouvé.", nom: "roue de vélo", pluriel: "roues de vélo", poids: 1.4 },
  dynamo_velo: { description: "La petite dynamo du phare. Tourner, c'est produire.", nom: "dynamo de vélo", pluriel: "dynamos de vélo", poids: 0.3 },
  ressort_lames: { description: "Acier à ressort de l'Abondance : la meilleure matière pour une lame.", nom: "lame de ressort", pluriel: "lames de ressort", poids: 0.4 },
  bache: { description: "Bleue, imperméable, un peu déchirée. Un toit pour une nuit.", nom: "bâche", pluriel: "bâches", poids: 1.5 },
  barre_metal: { description: "Un mètre de fer rond. Levier, arme, ou matière à forger.", nom: "barre de métal", pluriel: "barres de métal", poids: 2 },
  batterie_voiture: { description: "12 V, 60 Ah : environ 360 Wh utiles. Lourde, mais précieuse.", nom: "batterie de voiture", pluriel: "batteries de voiture", poids: 18 },
  charbon_bois: { description: "Léger, noir, il chauffe à 1 300 °C : de quoi forger. Un kilo par lame.", nom: "kilo de charbon de bois", pluriel: "kilos de charbon de bois", poids: 1, combustible: 1.8 },
  lame_forgee: { description: "Un couteau de forge : une lame tirée d'un ressort, trempée, emmanchée sur une branche. Il se vendra bien.", nom: "couteau de forge", pluriel: "couteaux de forge", poids: 0.3 },
  couteau_aiguise: { description: "Le même couteau, repassé à la meule. Il coupe enfin.", nom: "couteau aiguisé", pluriel: "couteaux aiguisés", poids: 0.2 },
  panneau_solaire: {
    description: "Un petit panneau de 20 W démonté de l'auvent. Personne ne sait plus en fabriquer : il vaut ce qu'il coûterait à refaire.",
    nom: "petit panneau solaire",
    pluriel: "petits panneaux solaires",
    poids: 2.5,
  },
  chiffons: { description: "Des chiffons de coton, sales mais solides. Coupés en bandes, ils feront des pansements.", nom: "chiffon", pluriel: "chiffons", poids: 0.1 },
  fibres: { description: "Des feuilles de jonc et de massette, coupées au bord de l'eau. Tordues et tressées, elles font une corde.", nom: "poignée de fibres", pluriel: "poignées de fibres", poids: 0.15 },
  pansement: {
    description: "Une bande de coton serrée sur la plaie. Elle arrête le saignement (Book 05 §7).",
    nom: "pansement",
    pluriel: "pansements",
    poids: 0.05,
  },
  // Les fruits : énergie réelle (tables Ciqual), au poids d'un fruit ou d'une poignée.
  pomme: { description: "Une pomme un peu acide, ferme. 150 g, ≈ 80 kcal (52 kcal pour 100 g).", nom: "pomme", pluriel: "pommes", poids: 0.15, kcal: 80, eau: 0.13 },
  poire: { description: "Une poire juteuse, à manger vite avant qu'elle blettisse. 180 g, ≈ 100 kcal.", nom: "poire", pluriel: "poires", poids: 0.18, kcal: 100, eau: 0.15 },
  prunes: { description: "Une poignée de quetsches violettes. 150 g, ≈ 70 kcal (46 kcal pour 100 g).", nom: "poignée de prunes", pluriel: "poignées de prunes", poids: 0.15, kcal: 70, eau: 0.13 },
  cerises: { description: "Une poignée de cerises sucrées. 150 g, ≈ 95 kcal (63 kcal pour 100 g).", nom: "poignée de cerises", pluriel: "poignées de cerises", poids: 0.15, kcal: 95, eau: 0.12 },
  noix: {
    description: "Une poignée de noix dans leur coque : 45 g de cerneaux, ≈ 290 kcal (654 kcal pour 100 g). Le meilleur rapport poids-énergie de la nature.",
    nom: "poignée de noix",
    pluriel: "poignées de noix",
    poids: 0.1,
    kcal: 290, eau: 0.005,
  },
  // Les champignons : le cèpe se mange, les amanites tuent ou rendent très malade.
  cepe: {
    description: "Un cèpe de Bordeaux : chapeau brun, pied ventru, une éponge blanche sous le chapeau (pas de lames). 150 g, ≈ 45 kcal. Un régal.",
    nom: "cèpe",
    pluriel: "cèpes",
    poids: 0.15,
    kcal: 45, eau: 0.13,
  },
  amanite_tue_mouches: {
    description: "Chapeau rouge vif semé de flocons blancs, lames blanches, un anneau au pied. Toxique : vomissements, délire. Ne pas manger.",
    nom: "amanite tue-mouches",
    pluriel: "amanites tue-mouches",
    poids: 0.12,
    kcal: 30, eau: 0.1,
    toxique: "tue_mouches",
  },
  amanite_phalloide: {
    description: "Chapeau vert olive, lames blanches, un anneau, et le pied pris dans un sac blanc (la volve). Mortelle : les symptômes n'arrivent que des heures après, trop tard.",
    nom: "amanite phalloïde",
    pluriel: "amanites phalloïdes",
    poids: 0.1,
    kcal: 30, eau: 0.09,
    toxique: "phalloide",
  },
  gourdin: {
    description: "Un rondin de bois dur taillé au couteau, une poignée amincie. De quoi assommer une poule, ou repousser un Éteint.",
    nom: "gourdin de bois dur",
    pluriel: "gourdins de bois dur",
    poids: 1.2,
  },
  poule: {
    description: "Une poule ensauvagée de la ferme, assommée. ≈ 1,8 kg. À plumer et vider (Couper 1) avant de la cuire.",
    nom: "poule",
    pluriel: "poules",
    poids: 1.8,
  },
  volaille_crue: {
    description: "Une portion de volaille crue, 200 g. ≈ 380 kcal, mais crue elle peut rendre malade : à cuire sur le feu.",
    nom: "portion de volaille crue",
    pluriel: "portions de volaille crue",
    poids: 0.2,
    kcal: 380, eau: 0.13,
    toxique: "viande_crue",
  },
  // Les plats : l'énergie des ingrédients, ×1,25 pour la cuisson (Book 11 §11).
  volaille_cepes: {
    description: "Une portion de volaille rôtie aux cèpes, cuite au feu. ≈ 590 kcal (380 + 2 × 45, ×1,25 par la cuisson). Un vrai repas : il cale, et il réconforte.",
    nom: "volaille aux cèpes",
    pluriel: "portions de volaille aux cèpes",
    poids: 0.4,
    kcal: 590, eau: 0.2,
    plat: { sante: 10 },
  },
  cepes_poeles: {
    description: "Trois cèpes poêlés sur une pierre plate, au coin du feu. ≈ 170 kcal. Simple et bon.",
    nom: "poêlée de cèpes",
    pluriel: "poêlées de cèpes",
    poids: 0.35,
    kcal: 170, eau: 0.15,
    plat: { sante: 4 },
  },
  pommes_cuites: {
    description: "Trois pommes cuites sous la cendre, fondantes. ≈ 300 kcal.",
    nom: "pommes cuites",
    pluriel: "portions de pommes cuites",
    poids: 0.4,
    kcal: 300, eau: 0.3,
    plat: { sante: 4 },
  },
  // Les mijotés (Book 24 §3.1) : il faut la crémaillère du foyer de cuisine, et de l'eau (elle bout, la mare suffit).
  soupe_cepes: {
    description: "Une soupe de cèpes mijotée à la crémaillère, dans un demi-litre d'eau. ≈ 110 kcal (2 × 45, ×1,25 par la cuisson), et elle désaltère. Un vrai repas.",
    nom: "soupe de cèpes",
    pluriel: "bols de soupe de cèpes",
    poids: 0.6,
    kcal: 110, eau: 0.45,
    plat: { sante: 6 },
  },
  pot_au_feu: {
    description: "Une portion de volaille et un cèpe, mijotés longtemps dans un demi-litre d'eau. ≈ 530 kcal (380 + 45, ×1,25 par la cuisson), et il désaltère. Ça cale, ça réconforte.",
    nom: "pot-au-feu de volaille",
    pluriel: "bols de pot-au-feu de volaille",
    poids: 0.75,
    kcal: 530, eau: 0.45,
    plat: { sante: 12 },
  },
  ficelle: {
    description: "Deux fibres de jonc roulées sur la cuisse. Plus fine que la corde : alarmes, ligatures, protège-bras.",
    nom: "ficelle",
    pluriel: "ficelles",
    poids: 0.02,
  },
  baton_fouir: {
    description: "Une branche taillée en biseau et durcie au feu. On creuse avec (Creuser 1) : un foyer Dakota, un trou, une racine.",
    nom: "bâton à fouir",
    pluriel: "bâtons à fouir",
    poids: 0.6,
  },
  epieu: {
    description: "Une longue branche taillée en pointe et durcie au feu. Il garde un Éteint à distance : il saisit avant de mordre, l'allonge compte.",
    nom: "épieu",
    pluriel: "épieux",
    poids: 1.2,
  },
  boite_vide: {
    description: "Une boîte de conserve vide, rincée. Rien ne se perd : deux boîtes et une ficelle font une alarme.",
    nom: "boîte de conserve vide",
    pluriel: "boîtes de conserve vides",
    poids: 0.06,
  },
  protege_bras: {
    description: "Des chiffons roulés serrés autour de l'avant-bras, liés à la ficelle. L'avant-bras, c'est là qu'ils mordent : une morsure sur deux n'y passe pas.",
    nom: "protège-bras de fortune",
    pluriel: "protège-bras de fortune",
    poids: 0.3,
  },
  travois: {
    description: "Deux longues perches et un plancher de branches liés à la corde. On traîne 50 kg de plus que son sac, mais on ne court plus quand il est chargé.",
    nom: "travois",
    pluriel: "travois",
    poids: 4,
  },
  lance: {
    description: "Un épieu au bout duquel on a ligaturé un couteau. On le tient à deux mètres, et cette fois la pointe entre.",
    nom: "lance",
    pluriel: "lances",
    poids: 1.6,
  },
  sac_fortune: {
    description: "Un cadre de branches lié de corde, des bretelles tressées : on y attache ses affaires. Porte 30 kg (le sac à dos : 55).",
    nom: "sac de fortune",
    pluriel: "sacs de fortune",
    poids: 2,
  },
  volaille_cuite: {
    description: "Une portion de volaille rôtie sur le feu, 150 g. ≈ 380 kcal, et sans risque.",
    nom: "portion de volaille rôtie",
    pluriel: "portions de volaille rôtie",
    poids: 0.15,
    kcal: 380, eau: 0.09,
  },
};

export const OBJETS: Record<TypeObjet, DefinitionObjet> = { ...OBJETS_DE_BASE, ...OBJETS_METIER, ...TOUS_LES_VESTIGES };

/**
 * Un inventaire : combien de chaque objet. Les objets de métier y portent leurs étoiles par exemplaire (Book 25 §9.6) :
 * « lame_forgee#4 » à côté de « lame_forgee » (★★★, la clé nue). Voir etoiles.ts.
 */
export type Inventaire = Partial<Record<CleObjet, number>>;

/** Capacité de portage du sac à dos de départ (Book 12 §2.1), en kg. */
export const CAPACITE_SAC = 55;
/** Sans sac (perdu à l'effondrement) : ce que tiennent les poches et les mains, en kg (2026-10-08). */
export const CAPACITE_POCHES = 10;
/** Ce que porte chaque contenant (le meilleur compte). */
export const CONTENANTS: Partial<Record<TypeObjet, number>> = { sac_a_dos: CAPACITE_SAC, sac_fortune: 30 };

/**
 * Est-ce un vrai type d'objet ? `OBJETS[x]` ne suffit pas : « toString » ou « constructor » existent sur tout objet
 * JavaScript (hérités). Le serveur s'en sert pour tout ce qui vient du client (revue de sécurité 0.1.1).
 */
export function estObjet(x: unknown): x is TypeObjet {
  return typeof x === "string" && Object.hasOwn(OBJETS, x);
}

/**
 * Une clé d'inventaire valide : un type d'objet, ou un exemplaire étoilé d'un objet de métier sous sa forme canonique
 * (« lame_forgee#4 », Book 25 §9.6). Pour tout ce qui vient du client et désigne un objet du sac ou d'un coffre.
 */
export function estCleObjet(x: unknown): x is CleObjet {
  return estObjet(x) || (typeof x === "string" && estObjet(typeDe(x)) && estCleEtoileeValide(x));
}

/** Le travois traîné derrière soi : 50 kg de plus que le sac (P-002). */
export const CAPACITE_TRAVOIS = 50;

/** Ce qu'on porte sur soi : le meilleur contenant, ou les poches (sans le travois). */
export function capaciteSurSoi(inventaire: Inventaire): number {
  let c = CAPACITE_POCHES;
  for (const [type, kg] of Object.entries(CONTENANTS) as [TypeObjet, number][]) if ((inventaire[type] ?? 0) > 0) c = Math.max(c, kg);
  return c;
}

/** Ce qu'on peut emporter avec ce qu'on a : le meilleur contenant (ou les poches), plus le travois. */
export function capaciteDe(inventaire: Inventaire): number {
  return capaciteSurSoi(inventaire) + ((inventaire.travois ?? 0) > 0 ? CAPACITE_TRAVOIS : 0);
}

/** On traîne le travois chargé : plus lourd que ce qu'on porte sur soi. On ne court plus (P-002). */
export function traineTravois(inventaire: Inventaire): boolean {
  return (inventaire.travois ?? 0) > 0 && poidsInventaire(inventaire) > capaciteSurSoi(inventaire) + 1e-9;
}

/** Le nom de ce qui porte les affaires : « Sac », « Sac de fortune », ou « Poches ». */
export function nomContenant(inventaire: Inventaire): string {
  if ((inventaire.sac_a_dos ?? 0) > 0) return "Sac";
  if ((inventaire.sac_fortune ?? 0) > 0) return "Sac de fortune";
  return "Poches";
}
/** Ce que tient un coffre de rangement (kg). */
export const CAPACITE_COFFRE = 150;

/** Kit de départ (Book 02 §14, Book 21 §3.4) et lumière portée de famille. */
export function kitDeDepart(famille: Famille): Inventaire {
  const commun: Inventaire = { couteau: 1, briquet: 1, gourde: 1, sac_a_dos: 1, conserve: 2 };
  const parFamille: Record<Famille, Inventaire> = {
    charbonniers: { pierre_a_feu: 1, marteau: 1, torche: 1 },
    voltaiques: { lampe_dynamo: 1, petite_batterie: 1, lampe_frontale: 1 },
    // La clé plate (Serrer 2) entre dans le kit (Book 25 §2.5) : l'arbalète et le pédalier demandent de serrer.
    mecanistes: { scie: 1, corde: 1, lanterne: 1, cle_plate: 1 },
  };
  return { ...commun, ...parFamille[famille] };
}

/**
 * Le poids de ce qu'on porte. `litresGourde` : l'eau de la gourde, un kilo par litre (2026-10-09), comptée seulement
 * si l'on a une gourde.
 */
export function poidsInventaire(inventaire: Inventaire, litresGourde = 0): number {
  let total = 0;
  // Un exemplaire étoilé pèse ce que pèse son objet.
  for (const [cle, quantite] of Object.entries(inventaire)) total += (OBJETS[typeDe(cle)]?.poids ?? 0) * (quantite ?? 0);
  if ((inventaire.gourde ?? 0) > 0) total += Math.max(0, litresGourde);
  return total;
}

/** « lame forgée », « 3 lames forgées » ; un exemplaire étoilé dit ses étoiles : « lame forgée ★★★★ ». */
export function nommer(cle: CleObjet, quantite: number): string {
  const type = typeDe(cle);
  const d = OBJETS[type];
  const n = cle === type ? null : etoilesDe(cle);
  const etoiles = n === null ? "" : ` ${etoilesTexte(n)}`;
  return quantite > 1 ? `${quantite} ${d.pluriel}${etoiles}` : `${d.nom}${etoiles}`;
}

/** La lumière portée que possède un personnage, s'il en a une. */
export function lumierePortee(inventaire: Inventaire): TypeObjet | null {
  // La lampe de poche bricolée des Voltaïques (Book 25 §5.3) : une lumière blanche, sans manivelle.
  for (const type of ["torche", "lampe_frontale", "lanterne", "lampe_bricolee"] as const) if ((inventaire[type] ?? 0) > 0) return type;
  return null;
}
