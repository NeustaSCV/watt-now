// Les quêtes après le tutoriel (Book 22) : des objectifs proches qui guident (« S'installer », « Le métier »).
// Le serveur constate ce que le joueur a vraiment fait ou possède (comme le tutoriel) ; le client affiche le carnet.

import type { TypeBatterie } from "./energie.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import type { Famille } from "./regles.ts";

// La grande quête du cycle (« Où est Bill Murray ? », Book 22 §4) viendra avec la 1.0 : elle s'ajoutera ici
// comme une troisième ligne. Pour la 0b, on rend d'abord le jeu très jouable (décision du porteur, 2026-10-08).

export type LigneQuete = "metier" | "installer" | "autres";

/** Ce qu'un objectif demande. Le serveur sait le constater (serveur/src/quetes.ts). */
export type Condition =
  /** Un fait compté depuis l'arrivée (repas, échange, wotts gagnés…), au moins `but` fois. */
  | { a: "fait"; fait: string; but: number }
  /** Une installation de ce type sur son terrain (avec un équipement monté, ou un niveau minimal, si précisé ; Book 24). */
  | { a: "installation"; type: string; avec?: "meule" | "dynamo"; niveau?: number }
  /** Au moins `n` objets parmi ces types, dans le sac. */
  | { a: "objet"; types: TypeObjet[]; n: number }
  /** De l'électricité dans ses batteries (toutes, ou un type), en Wh. */
  | { a: "wh"; but: number; batterie?: TypeBatterie }
  /** De quoi manger dans le sac (hors toxiques), en kcal. */
  | { a: "vivres"; but: number }
  /** Une lumière portée. */
  | { a: "lumiere" }
  /** L'une ou l'autre : on l'a… ou on l'a déjà fait (le panneau installé n'est plus dans le sac). */
  | { a: "un_de"; conditions: Condition[] };

export interface Objectif {
  libelle: string;
  condition: Condition;
}

export interface Quete {
  id: string;
  ligne: LigneQuete;
  /** Réservée à une famille (le métier). */
  famille?: Famille;
  titre: string;
  /** La phrase du carnet (Book 22 §2). Les touches s'écrivent {action}, comme dans le tutoriel. */
  texte: string;
  objectifs: Objectif[];
  /** Dit une fois l'objectif réussi. */
  lecon: string;
  recompense?: { wotts?: number; objets?: Inventaire };
}

// ---------- S'installer (Book 22 §3.1 : l'ordre de l'urgence de la proposition P-002, et sa gamme bushcraft) ----------

const fait = (f: string, but = 1): Condition => ({ a: "fait", fait: f, but });
const installation = (type: string): Condition => ({ a: "installation", type });

const INSTALLER: Quete[] = [
  {
    id: "repas",
    ligne: "installer",
    titre: "Un vrai repas",
    texte: "Les baies, ça va un moment. Cuisine un plat au feu (volaille aux cèpes, poêlée de cèpes, pommes cuites) et mange-le.",
    objectifs: [{ libelle: "Plat cuisiné mangé", condition: fait("plat_mange") }],
    lecon: "Un plat chaud cale plus longtemps et remonte la santé. Le feu sert aussi à ça.",
    recompense: { objets: { conserve: 1 } },
  },
  {
    id: "lit",
    ligne: "installer",
    titre: "Un vrai lit",
    texte: "Dormir à même le sol, c'est dormir à moitié. Fais un lit de branchages à côté de ton abri, ou garnis l'abri lui-même (examine-le : « Améliorer »).",
    // Book 24 §7 : l'abri garni (niveau 2) vaut un lit posé à côté.
    objectifs: [{ libelle: "Lit de branchages, ou abri garni", condition: { a: "un_de", conditions: [installation("lit_branchages"), { a: "installation", type: "abri", niveau: 2 }] } }],
    lecon: "Isolé du sol, à côté de l'abri, on récupère un tiers plus vite.",
    recompense: { objets: { conserve: 1 } },
  },
  {
    id: "eau_du_ciel",
    ligne: "installer",
    titre: "L'eau du ciel",
    texte: "Bouillir l'eau de la mare coûte du bois. Tends une bâche en entonnoir au-dessus d'une bassine : la pluie se boit telle quelle. Une bâche ? Dans la benne du camion, à la station.",
    objectifs: [{ libelle: "Récupérateur de pluie", condition: installation("recuperateur_pluie") }],
    lecon: "Il se remplit quand il pleut, même quand tu n'es pas là.",
    recompense: { wotts: 10 },
  },
  {
    id: "coffre",
    ligne: "installer",
    titre: "Un coffre à soi",
    texte: "Tout porter, c'est s'épuiser. Fabrique un coffre de rangement (bûches, branches, une corde de fibres de la mare).",
    objectifs: [{ libelle: "Coffre sur ton terrain", condition: installation("coffre") }],
    lecon: "Le coffre garde 150 kg pour toi. Ne pars en route qu'avec ce qu'il faut.",
  },
  {
    id: "dakota",
    ligne: "installer",
    titre: "Un feu qui ne se voit pas",
    texte: "La nuit, un feu se voit de loin. Durcis une branche au feu pour en faire un bâton à fouir, puis creuse un foyer Dakota : ton feu de camp lui-même (examine-le), ou un nouveau, depuis Fabriquer.",
    objectifs: [{ libelle: "Foyer Dakota creusé", condition: fait("foyer_dakota") }],
    lecon: "La flamme reste dans le sol : moins de lumière, moins de fumée, moins de bois.",
    recompense: { objets: { conserve: 1 } },
  },
  {
    id: "defense",
    ligne: "installer",
    titre: "De quoi se défendre",
    texte: "Les poings, c'est pour les films. Fabrique un gourdin ou un épieu durci au feu, ou garde ta hache sous la main.",
    objectifs: [{ libelle: "Gourdin, épieu ou hache", condition: { a: "objet", types: ["gourdin", "epieu", "hache"], n: 1 } }],
    lecon: "Équipe ton arme depuis le sac. L'épieu les tient à distance, avant qu'ils saisissent.",
    recompense: { objets: { conserve: 1 } },
  },
  {
    id: "alarme",
    ligne: "installer",
    titre: "Être prévenu",
    texte: "Deux boîtes de conserve vides (mange tes conserves), une ficelle de fibres, deux branches : une alarme le long du chemin.",
    objectifs: [{ libelle: "Alarme posée", condition: installation("alarme_boites") }],
    lecon: "Un Éteint passe, les boîtes tintent. Lui aussi les entend : c'est aussi un leurre.",
    recompense: { wotts: 10 },
  },
  {
    id: "soins",
    ligne: "installer",
    titre: "Se soigner",
    texte: "Une coupure qui saigne, ça ne pardonne pas. Garde deux pansements sur toi (des chiffons, et ton couteau).",
    objectifs: [{ libelle: "Pansements", condition: { a: "objet", types: ["pansement"], n: 2 } }],
    lecon: "Panser arrête le saignement. Dormir à l'abri fait le reste.",
    recompense: { objets: { pansement: 1 } },
  },
  {
    id: "protege_bras",
    ligne: "installer",
    titre: "Là où ils mordent",
    texte: "Ils mordent à l'avant-bras, celui qu'on lève pour se protéger. Roule des chiffons serrés, lie-les à la ficelle.",
    objectifs: [{ libelle: "Protège-bras", condition: { a: "objet", types: ["protege_bras"], n: 1 } }],
    lecon: "Une morsure sur deux glisse dessus. Il finit par se déchirer : garde de quoi en refaire.",
    recompense: { wotts: 10 },
  },
  {
    id: "travois",
    ligne: "installer",
    titre: "Traîner plus lourd",
    texte: "Le bois, la pierre, ça pèse. Deux longues perches, des traverses, deux cordes : un travois.",
    objectifs: [{ libelle: "Travois", condition: { a: "objet", types: ["travois"], n: 1 } }],
    lecon: "50 kg de plus derrière toi. Chargé, on ne court plus : choisis bien quand tu sors avec.",
    recompense: { wotts: 15 },
  },
  // Améliorer sa base (Book 24 §7) : un seul bon foyer, plutôt que trois feux.
  {
    id: "foyer_pierres",
    ligne: "installer",
    titre: "Un foyer qui tient la nuit",
    texte: "Un feu de camp mange son bois et se voit de loin. Approche-toi du tien, examine-le, et maçonne-le en foyer de pierres (des pierres, deux bûches, une pierre pour marteler).",
    objectifs: [{ libelle: "Foyer de pierres", condition: fait("foyer:foyer_pierres") }],
    lecon: "Couvert, il tient la nuit et repart sans briquet. Son muret chauffe l'abri.",
    recompense: { wotts: 10 },
  },
  {
    id: "foyer_cuisine",
    ligne: "installer",
    titre: "Une vraie cuisine",
    texte: "Un trépied, une crémaillère, une grille (un rouleau de grillage, ou deux barres de métal) : ton foyer devient une cuisine.",
    objectifs: [{ libelle: "Foyer de cuisine", condition: fait("foyer:foyer_cuisine") }],
    lecon: "Deux plats à la fois, des mijotés, l'eau bout plus vite. Un bon foyer vaut trois feux.",
    recompense: { objets: { conserve: 1 } },
  },
];

// ---------- Les autres (Book 22 §3.3) : le Comptoir, la monnaie, l'échange ----------

const AUTRES: Quete[] = [
  {
    id: "comptoir",
    ligne: "autres",
    titre: "Le Comptoir du Carrefour",
    texte: "Au-delà de la station-service, les Compteurs tiennent le Comptoir : ils achètent, vendent, et paient en wotts. Va les voir.",
    objectifs: [{ libelle: "Arrivé au Comptoir", condition: fait("visite:comptoir") }],
    lecon: "Les Compteurs tamponnent tout, mais sont honnêtes. Les prix sont au guichet.",
    recompense: { wotts: 10 },
  },
  {
    id: "premiers_wotts",
    ligne: "autres",
    titre: "Premiers wotts",
    texte: "Gagne 20 wotts au Comptoir : vends ce que tu as en trop, ou dépose de l'électricité.",
    objectifs: [{ libelle: "Wotts gagnés", condition: fait("wotts_gagnes", 20) }],
    lecon: "Les wotts se déchargent avec le temps : ne les garde pas trop longtemps en poche.",
    recompense: { objets: { conserve: 1 } },
  },
  {
    id: "main_tendue",
    ligne: "autres",
    titre: "La main tendue",
    texte: "Les autres familles ont ce qui te manque, et inversement. À la station ou au Comptoir, propose un échange ({agir} près d'un autre joueur).",
    objectifs: [{ libelle: "Échange conclu", condition: fait("echange") }],
    lecon: "Seul, on survit. Ensemble, on reconstruit.",
    recompense: { wotts: 15 },
  },
];

// ---------- Le métier (Book 22 §3.2 : la chaîne-vitrine de chaque famille, Book 21 §3.3) ----------

const METIER: Quete[] = [
  // 🔥 Charbonniers
  {
    id: "charbonniere",
    ligne: "metier",
    famille: "charbonniers",
    titre: "La charbonnière",
    texte: "Ta forge a faim. Bâtis une charbonnière : du bois, de la terre, et trois jours de patience.",
    // La meule disparaît au défournement : l'avoir bâtie, ou avoir déjà son charbon, compte aussi.
    objectifs: [
      {
        libelle: "Charbonnière bâtie",
        condition: {
          a: "un_de",
          conditions: [
            { a: "installation", type: "charbonniere" },
            { a: "fait", fait: "fabrique:charbonniere", but: 1 },
            { a: "objet", types: ["charbon_bois", "lame_forgee"], n: 1 },
          ],
        },
      },
    ],
    lecon: "Le charbon de bois chauffe deux fois plus fort que le bois. C'est ton or noir.",
    recompense: { wotts: 10 },
  },
  {
    id: "charbon",
    ligne: "metier",
    famille: "charbonniers",
    titre: "Défourner",
    texte: "Allume la meule, attends qu'elle ait fini de fumer, et défourne : une meule donne 4 charbons de bois.",
    objectifs: [{ libelle: "Charbon défourné", condition: { a: "un_de", conditions: [{ a: "fait", fait: "defourne", but: 1 }, { a: "objet", types: ["charbon_bois"], n: 4 }] } }],
    lecon: "Une meule qui fume se voit de loin. Le feu bavarde : choisis ton moment.",
    recompense: { wotts: 15 },
  },
  {
    id: "lame",
    ligne: "metier",
    famille: "charbonniers",
    titre: "Forger une lame",
    texte: "Au foyer de forge, avec un charbon et le ressort à lames de la ruine : forge une lame.",
    objectifs: [{ libelle: "Lame forgée", condition: { a: "un_de", conditions: [{ a: "fait", fait: "fabrique:lame_forgee", but: 1 }, { a: "objet", types: ["lame_forgee"], n: 1 }] } }],
    lecon: "Une lame forgée se vend bien : tout le monde a besoin de couper.",
    recompense: { wotts: 20 },
  },
  {
    id: "vendre_lame",
    ligne: "metier",
    famille: "charbonniers",
    titre: "Le premier client",
    texte: "Vends une lame forgée au Comptoir. Les Compteurs la revendront à ceux qui ne savent pas forger.",
    objectifs: [{ libelle: "Lame vendue", condition: { a: "fait", fait: "vente:lame_forgee", but: 1 } }],
    lecon: "Tu ne crées pas d'électricité : tu vis de ton savoir-faire. Et ça suffit.",
    recompense: { wotts: 30 },
  },
  // ⚙️ Mécanistes
  {
    id: "meule",
    ligne: "metier",
    famille: "mecanistes",
    titre: "La meule",
    texte: "Ton pédalier peut entraîner une meule. Taille-la dans 3 pierres et monte-la ({agir} au pédalier).",
    objectifs: [{ libelle: "Meule sur le pédalier", condition: { a: "installation", type: "pedalier", avec: "meule" } }],
    lecon: "Ce qui tourne ne meurt pas : le même pédalier fera dix métiers.",
    recompense: { wotts: 10 },
  },
  {
    id: "affuter",
    ligne: "metier",
    famille: "mecanistes",
    titre: "Affûter",
    texte: "Ton couteau abîmé ne coupe plus rien. Affûte-le à la meule.",
    objectifs: [{ libelle: "Couteau aiguisé", condition: { a: "un_de", conditions: [{ a: "fait", fait: "affute", but: 1 }, { a: "objet", types: ["couteau_aiguise"], n: 1 }] } }],
    lecon: "Un outil entretenu travaille deux fois plus vite. Les autres familles paieront pour ça.",
    recompense: { wotts: 15 },
  },
  {
    id: "dynamo",
    ligne: "metier",
    famille: "mecanistes",
    titre: "La dynamo",
    texte: "Monte la dynamo du vélo sur le pédalier : tes jambes feront de l'électricité.",
    objectifs: [{ libelle: "Dynamo sur le pédalier", condition: { a: "installation", type: "pedalier", avec: "dynamo" } }],
    lecon: "Une heure de pédalage, quelques Wh. C'est peu, mais c'est à toi.",
    recompense: { wotts: 20 },
  },
  {
    id: "depot_meca",
    ligne: "metier",
    famille: "mecanistes",
    titre: "Déposer l'électricité",
    texte: "Charge une batterie en pédalant, porte-la au Comptoir et dépose son électricité : c'est ainsi qu'on crée des wotts.",
    objectifs: [{ libelle: "Électricité déposée", condition: { a: "fait", fait: "depot_wh", but: 1 } }],
    lecon: "Seul le dépôt d'électricité crée des wotts : tu fais de la monnaie avec tes jambes.",
    recompense: { wotts: 30 },
  },
  // ⚡ Voltaïques
  {
    id: "panneau_trouve",
    ligne: "metier",
    famille: "voltaiques",
    titre: "Le panneau de la station",
    texte: "Un petit panneau solaire est appuyé contre un pilier de l'auvent, à la station-service. Rapporte-le.",
    objectifs: [{ libelle: "Panneau solaire", condition: { a: "un_de", conditions: [{ a: "objet", types: ["panneau_solaire"], n: 1 }, { a: "installation", type: "panneau_solaire" }] } }],
    lecon: "Le soleil ne fait pas de bruit, ne fume pas, et ne se fatigue jamais.",
    recompense: { wotts: 10 },
  },
  {
    id: "panneau_pose",
    ligne: "metier",
    famille: "voltaiques",
    titre: "Installer le panneau",
    texte: "Installe le panneau sur ton terrain (depuis Fabriquer), au soleil, près de ton banc de recharge.",
    objectifs: [{ libelle: "Panneau installé", condition: { a: "installation", type: "panneau_solaire" } }],
    lecon: "Il charge le jour, même quand tu n'es pas là.",
    recompense: { wotts: 15 },
  },
  {
    id: "charge",
    ligne: "metier",
    famille: "voltaiques",
    titre: "Faire le plein",
    texte: "Laisse le soleil travailler : il te faut 20 Wh dans tes batteries.",
    objectifs: [{ libelle: "Wh en batteries", condition: { a: "wh", but: 20 } }],
    lecon: "Une batterie pleine pèse pareil qu'une vide. Le transport, c'est ton vrai coût.",
    recompense: { wotts: 20 },
  },
  {
    id: "depot_volt",
    ligne: "metier",
    famille: "voltaiques",
    titre: "Déposer l'électricité",
    texte: "Porte une batterie chargée au Comptoir et dépose son électricité : c'est ainsi qu'on crée des wotts.",
    objectifs: [{ libelle: "Électricité déposée", condition: { a: "fait", fait: "depot_wh", but: 1 } }],
    lecon: "Seul le dépôt d'électricité crée des wotts. Le soleil, changé en monnaie.",
    recompense: { wotts: 30 },
  },
];

export const QUETES: Quete[] = [...METIER, ...INSTALLER, ...AUTRES];

export const QUETE = new Map(QUETES.map((q) => [q.id, q]));

/** Les quêtes d'une ligne, dans l'ordre, pour cette famille. */
export function queteSuivante(ligne: LigneQuete, famille: Famille, finies: readonly string[]): Quete | null {
  return QUETES.find((q) => q.ligne === ligne && (!q.famille || q.famille === famille) && !finies.includes(q.id)) ?? null;
}

/** Ce que le serveur garde pour un joueur. */
export interface EtatQuetes {
  /** Les faits comptés depuis l'arrivée (« plat_mange », « wotts_gagnes », « vente:lame_forgee »…). */
  faits: Record<string, number>;
  /** Les quêtes réussies, dans l'ordre. */
  finies: string[];
  /** Les primes en wotts que les Compteurs n'ont pas encore pu verser (trésorerie vide). */
  primes: number;
}

export const QUETES_NEUVES: EtatQuetes = { faits: {}, finies: [], primes: 0 };

/** Ce que le client montre dans le carnet. */
export interface VueQuete {
  id: string;
  ligne: LigneQuete;
  titre: string;
  texte: string;
  objectifs: { libelle: string; fait: number; but: number }[];
  recompense?: string;
}

export interface VueQuetes {
  quetes: VueQuete[];
  /** Les quêtes qui viennent d'être réussies (souvent une seule), et leur leçon, à montrer un moment. */
  reussies?: { titre: string; lecon: string; recompense?: string }[];
}

