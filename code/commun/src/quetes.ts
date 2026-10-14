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
  | { a: "installation"; type: string; avec?: "meule" | "dynamo" | "alternateur" | "panneau"; niveau?: number }
  /** Plusieurs faits additionnés (vendus ou donnés, de plusieurs sortes), au moins `but` en tout (0.6). */
  | { a: "faits"; faits: string[]; but: number }
  /**
   * Au moins `n` objets parmi ces types, dans le sac, toutes étoiles confondues ; avec `etoiles`, seuls comptent les
   * exemplaires qui en ont au moins autant (Book 25 §4.2).
   */
  | { a: "objet"; types: TypeObjet[]; n: number; etoiles?: number }
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

/**
 * La route d'une porte du niveau 1 (plan 0.8 §2.6, Q-0.8-19) : A, la station puis la Coopérative ; B, le gué puis le
 * Moulin. « S'installer » garde une porte ouverte par route : deux à la fois, le joueur choisit sa sortie.
 */
export type RouteQuete = "A" | "B";

export interface Quete {
  id: string;
  ligne: LigneQuete;
  /** Une porte du niveau 1, sur sa route (absente : un objectif qui se suit dans l'ordre de la ligne). */
  route?: RouteQuete;
  /** La porte nommée au départ d'une sortie (« il te faut une grille ») : sa clé, en quelques mots. */
  besoin?: string;
  /** Réservée à une famille (le métier). */
  famille?: Famille;
  titre: string;
  /** L'icône du carnet : le pictogramme d'un objet ou d'une installation (Book 25 §10.3, chantier 8). */
  icone?: string;
  /** La phrase du carnet (Book 22 §2). Les touches s'écrivent {action}, comme dans le tutoriel. */
  texte: string;
  objectifs: Objectif[];
  /** Dit une fois l'objectif réussi. */
  lecon: string;
  recompense?: { wotts?: number; objets?: Inventaire };
}

// ---------- S'installer (Book 22 §3.1 ; plan 0.8 §2.6 : des portes successives) ----------
// Le foyer de pierres en tête, puis un vrai repas, l'eau du ciel, le coffre, un vrai lit (une à une) ; puis les portes
// du niveau 1, une par meuble, deux ouvertes à la fois (une par route, Q-0.8-19) ; puis le reste de la gamme bushcraft
// (P-002).

const fait = (f: string, but = 1): Condition => ({ a: "fait", fait: f, but });
const installation = (type: string): Condition => ({ a: "installation", type });
/** On l'a fabriqué (par l'une de ces recettes), ou on l'a dans le sac. */
const fabriqueOuObjet = (recettes: string[], types: TypeObjet[]): Condition => ({
  a: "un_de",
  conditions: [{ a: "faits", faits: recettes.map((r) => `fabrique:${r}`), but: 1 }, { a: "objet", types, n: 1 }],
});
/**
 * Passé à une autre famille (Book 25 §9.4) : vendu au Comptoir, ou donné dans un échange à un joueur d'une autre
 * famille. L'étape se fait donc seul, même quand personne d'une autre famille n'est sur le serveur.
 */
const passeAuxAutres = (types: TypeObjet[], but = 1): Condition => ({ a: "faits", faits: types.flatMap((t) => [`vente:${t}`, `don_autre_famille:${t}`]), but });

const INSTALLER: Quete[] = [
  // Plan 0.8 (recettes-par-construction.md §6.3) : le foyer de pierres en tête ; il ouvre la poêlée, l'épieu, les flèches
  // durcies et le bâton à fouir.
  {
    id: "foyer_pierres",
    ligne: "installer",
    titre: "Un foyer qui tient la nuit",
    icone: "pierre",
    texte: "Un feu de camp mange son bois et se voit de loin. Approche-toi du tien, examine-le, et maçonne-le en foyer de pierres (des pierres, deux bûches, une pierre pour marteler).",
    objectifs: [{ libelle: "Foyer de pierres", condition: fait("foyer:foyer_pierres") }],
    lecon: "Couvert, il tient la nuit et repart sans briquet. Son muret chauffe l'abri.",
    recompense: { wotts: 10 },
  },
  {
    id: "repas",
    ligne: "installer",
    titre: "Un vrai repas",
    icone: "pommes_cuites",
    // Q-0.8-11 : les pommes cuites (feu de camp), ou la poêlée de cèpes (foyer de pierres, Dakota).
    texte: "Les baies, ça va un moment. Cuisine un plat au feu et mange-le : des pommes cuites, ou une poêlée de cèpes.",
    objectifs: [{ libelle: "Plat cuisiné mangé", condition: fait("plat_mange") }],
    lecon: "Un plat chaud cale plus longtemps et remonte la santé. Le feu sert aussi à ça.",
    recompense: { objets: { conserve: 1 } },
  },
  {
    id: "eau_du_ciel",
    ligne: "installer",
    titre: "L'eau du ciel",
    icone: "bidon_5l",
    // Plan 0.8 §2.3 : le récupérateur de 5 L (le bidon de la ruine, les sacs plastique en entonnoir), sans bâche.
    texte: "Bouillir l'eau de la mare coûte du bois. Le bidon de 5 L de la ruine, des sacs plastique ouverts en entonnoir, quatre branches et une corde : la pluie se boit telle quelle.",
    objectifs: [{ libelle: "Récupérateur de pluie", condition: installation("recuperateur_pluie") }],
    lecon: "Il se remplit quand il pleut, même quand tu n'es pas là.",
    recompense: { wotts: 10 },
  },
  {
    id: "coffre",
    ligne: "installer",
    titre: "Un coffre à soi",
    icone: "coffre",
    texte: "Tout porter, c'est s'épuiser. Fabrique un coffre de rangement (bûches, branches, une corde de fibres de la mare).",
    objectifs: [{ libelle: "Coffre sur ton terrain", condition: installation("coffre") }],
    lecon: "Le coffre garde 150 kg pour toi. Ne pars en route qu'avec ce qu'il faut.",
  },
  // Plan 0.8 §9.3 (0.8.2, chantier J) : le lit juste après le coffre, avant les portes (l'abri fermé suppose l'abri
  // garni).
  {
    id: "lit",
    ligne: "installer",
    titre: "Un vrai lit",
    texte: "Dormir à même le sol, c'est dormir à moitié. Garnis ton abri de branches (examine-le : « Améliorer »).",
    // Book 24 §7 : l'abri garni (niveau 2) vaut un lit posé à côté.
    objectifs: [{ libelle: "Abri garni", condition: { a: "un_de", conditions: [installation("lit_branchages"), { a: "installation", type: "abri", niveau: 2 }] } }],
    lecon: "Isolé du sol, sous la bâche, on récupère un tiers plus vite.",
    recompense: { objets: { conserve: 1 } },
  },
  // ---------- Les portes du niveau 1 (plan 0.8 §2.6) : une par meuble, deux ouvertes à la fois, une par route ----------
  // Chacune demande la clé d'un lieu (sa fiche dit où chercher, en deux temps) ; l'ordre de la liste alterne les routes.
  {
    id: "foyer_cuisine",
    ligne: "installer",
    route: "A",
    besoin: "il te faut une grille",
    titre: "Une vraie cuisine",
    icone: "grillage_rouleau",
    texte: "Un trépied, une crémaillère, une grille : ton foyer de pierres devient une cuisine. Sa fiche dit où chercher la grille.",
    objectifs: [{ libelle: "Foyer de cuisine", condition: fait("foyer:foyer_cuisine") }],
    lecon: "Deux plats à la fois, des mijotés, l'eau bout plus vite. Un bon foyer vaut trois feux.",
    recompense: { objets: { conserve: 1 } },
  },
  {
    id: "abri_ferme",
    ligne: "installer",
    route: "B",
    besoin: "il te faut de la grosse toile",
    titre: "Un abri fermé",
    icone: "toile_jute",
    texte: "Garni, ton abri laisse encore passer le vent. Une grosse toile clouée côté vent, et c'est une chambre. Sa fiche dit où chercher.",
    objectifs: [{ libelle: "Abri fermé", condition: { a: "un_de", conditions: [{ a: "installation", type: "abri", niveau: 3 }, fait("niveau:abri_ferme")] } }],
    lecon: "Fermé au vent, on dort mieux et moins longtemps : la nuit passe plus vite.",
    recompense: { wotts: 15 },
  },
  {
    id: "marmite",
    ligne: "installer",
    route: "A",
    besoin: "il te faut une cocotte en fonte",
    titre: "La soupe qui cuit seule",
    icone: "cocotte_fonte",
    texte: "Une cocotte en fonte dans une caisse de chiffons, sur ton foyer de cuisine : la soupe cuit sans feu. Sa fiche dit où chercher.",
    objectifs: [{ libelle: "Marmite norvégienne", condition: fait("accessoire:marmite") }],
    lecon: "Moitié moins de bois pour un mijoté : le feu travaille, puis la caisse prend le relais.",
    recompense: { wotts: 15 },
  },
  {
    id: "coffre_cercle",
    ligne: "installer",
    route: "B",
    besoin: "il te faut des cercles de fer",
    titre: "Un coffre cerclé",
    icone: "feuillards",
    texte: "Cerclé de fer, cloué au marteau remmanché, ton coffre tiendrait bien plus lourd. Sa fiche dit où chercher les cercles.",
    objectifs: [{ libelle: "Coffre cerclé", condition: { a: "un_de", conditions: [{ a: "installation", type: "coffre", niveau: 2 }, fait("niveau:coffre_cercle")] } }],
    lecon: "250 kg à l'abri : de quoi garder la matière de tes sorties.",
    recompense: { wotts: 15 },
  },
  {
    id: "dix_litres",
    ligne: "installer",
    route: "A",
    besoin: "il te faut un seau de 10 L",
    titre: "Dix litres",
    icone: "seau_10l",
    texte: "Ton bidon de 5 L déborde à chaque averse. Un seau de 10 L sous l'entonnoir : deux fois plus d'eau. Sa fiche dit où chercher.",
    objectifs: [{ libelle: "Récupérateur à seau", condition: { a: "un_de", conditions: [{ a: "installation", type: "recuperateur_pluie", niveau: 2 }, fait("niveau:recuperateur_seau")] } }],
    lecon: "Dix litres d'eau potable qui t'attendent, même quand tu es sur la route.",
    recompense: { wotts: 15 },
  },
  {
    id: "etabli_etau",
    ligne: "installer",
    route: "B",
    besoin: "il te faut un étau",
    titre: "L'établi à étau",
    icone: "etau",
    texte: "Un étau boulonné sur ton établi serre ce que tes mains ne tiennent pas, et refait un manche sans forge. Sa fiche dit où chercher.",
    objectifs: [{ libelle: "Établi à étau", condition: { a: "un_de", conditions: [{ a: "installation", type: "etabli", niveau: 2 }, fait("niveau:etabli_etau")] } }],
    lecon: "Maillet, coins, planches fendues : l'étau ouvre le travail du bois, et répare le marteau.",
    recompense: { wotts: 15 },
  },
  // ---------- Ensuite, l'ordre de l'urgence (P-002) : ce qui reste du bushcraft, après les portes ----------
  {
    id: "dakota",
    ligne: "installer",
    titre: "Un feu qui ne se voit pas",
    texte: "La nuit, un feu se voit de loin. Durcis une branche au foyer de pierres pour en faire un bâton à fouir, puis creuse un foyer Dakota : un nouveau feu, depuis Fabriquer.",
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
  // L'arc pour tous (Book 25 §3 et §9.4) : monter un arc, puis un tir plein qui détruit.
  {
    id: "premier_arc",
    ligne: "installer",
    titre: "Le premier arc",
    icone: "arc_simple",
    texte: "Une perche de frêne (à la lisière) ou une branche droite, et une ficelle : un arc de fortune. Ou mieux, un arc de frêne séché.",
    objectifs: [{ libelle: "Un arc", condition: fabriqueOuObjet(["arc_fortune", "arc_fortune_branche", "arc_simple", "arc_if"], ["arc_fortune", "arc_simple", "arc_if", "arc_sportif"]) }],
    lecon: "Sac → « Prêt à tirer », puis maintiens {lancer} pour bander. Ramasse tes flèches.",
    recompense: { objets: { fleche_os: 3 } },
  },
  {
    id: "tir_plein",
    ligne: "installer",
    titre: "Tir plein",
    icone: "fleche_os",
    texte: "Bande l'arc à fond ({lancer} maintenu), attends que le cercle rougisse, et lâche : une flèche à la tête.",
    objectifs: [{ libelle: "Éteint détruit d'une flèche", condition: fait("tete:fleche") }],
    lecon: "L'arc est l'arme la plus discrète : la corde ne s'entend qu'à quelques pas.",
    recompense: { wotts: 15 },
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
    icone: "charbonniere",
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
    icone: "charbon_bois",
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
    icone: "lame_forgee",
    // Plan 0.8 (chantier 13) : le couteau au fer doux, au foyer de forge, sans bac (`lame_forgee_fer`).
    texte: "Au foyer de forge, un charbon et la barre de la ruine : du fer doux. Forge un couteau.",
    objectifs: [{ libelle: "Lame forgée", condition: { a: "un_de", conditions: [{ a: "fait", fait: "fabrique:lame_forgee", but: 1 }, { a: "objet", types: ["lame_forgee"], n: 1 }] } }],
    lecon: "Une lame forgée se vend bien : tout le monde a besoin de couper.",
    recompense: { wotts: 20 },
  },
  {
    id: "vendre_lame",
    ligne: "metier",
    famille: "charbonniers",
    titre: "Le premier client",
    icone: "lame_forgee",
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
    icone: "pedalier",
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
    icone: "couteau_aiguise",
    texte: "Ton couteau abîmé ne coupe plus rien. Affûte-le à la meule.",
    objectifs: [{ libelle: "Couteau aiguisé", condition: { a: "un_de", conditions: [{ a: "fait", fait: "affute", but: 1 }, { a: "objet", types: ["couteau_aiguise"], n: 1 }] } }],
    lecon: "Un outil entretenu travaille deux fois plus vite. Les autres familles paieront pour ça.",
    recompense: { wotts: 15 },
  },
  {
    id: "dynamo",
    ligne: "metier",
    famille: "mecanistes",
    titre: "Le pédalier générateur",
    icone: "petit_alternateur",
    // Plan 0.8 (chantiers 7 et 13) : le petit alternateur de la station ; la dynamo du vélo reste le repli, très lent.
    texte: "Monte le petit alternateur de la station sur ton pédalier générateur ({agir} au pédalier) : tes jambes feront de l'électricité.",
    objectifs: [{ libelle: "Alternateur sur le pédalier", condition: { a: "un_de", conditions: [{ a: "installation", type: "pedalier", avec: "alternateur" }, { a: "installation", type: "pedalier", avec: "dynamo" }] } }],
    lecon: "Une heure de pédalage, environ 60 Wh dans la batterie. C'est à toi, et ça ne fume pas.",
    recompense: { wotts: 20 },
  },
  {
    id: "depot_meca",
    ligne: "metier",
    famille: "mecanistes",
    titre: "Déposer l'électricité",
    icone: "petite_batterie",
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
    icone: "panneau_solaire",
    // Q-0.8-15 : le vétéran sans tutoriel va le chercher ; l'élève du tutoriel l'a déjà posé (« La famille »).
    texte: "Ta famille t'attend à la station-service : un petit panneau solaire, appuyé contre un pilier de l'auvent. Rapporte-le.",
    objectifs: [{ libelle: "Panneau solaire", condition: { a: "un_de", conditions: [{ a: "objet", types: ["panneau_solaire"], n: 1 }, { a: "installation", type: "banc_recharge", avec: "panneau" }, { a: "installation", type: "panneau_solaire" }] } }],
    lecon: "Le soleil ne fait pas de bruit, ne fume pas, et ne se fatigue jamais.",
    recompense: { wotts: 10 },
  },
  {
    id: "panneau_pose",
    ligne: "metier",
    famille: "voltaiques",
    titre: "Le banc solaire",
    icone: "banc_recharge",
    // Plan 0.8 (chantiers 7 et 13) : le panneau se pose sur le banc solaire, plein sud.
    texte: "Pose le panneau sur ton banc solaire ({agir} au banc), puis la batterie de la ruine dedans : le soleil s'y met en réserve.",
    objectifs: [{ libelle: "Panneau sur le banc", condition: { a: "un_de", conditions: [{ a: "installation", type: "banc_recharge", avec: "panneau" }, { a: "installation", type: "panneau_solaire" }] } }],
    lecon: "Il charge au soleil, même quand tu n'es pas là : ≈ 160 Wh par beau jour, rien la nuit.",
    recompense: { wotts: 15 },
  },
  {
    id: "charge",
    ligne: "metier",
    famille: "voltaiques",
    titre: "Faire le plein",
    icone: "petite_batterie",
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
    icone: "petite_batterie",
    texte: "Porte une batterie chargée au Comptoir et dépose son électricité : c'est ainsi qu'on crée des wotts.",
    objectifs: [{ libelle: "Électricité déposée", condition: { a: "fait", fait: "depot_wh", but: 1 } }],
    lecon: "Seul le dépôt d'électricité crée des wotts. Le soleil, changé en monnaie.",
    recompense: { wotts: 30 },
  },
];

// ---------- Le métier, suite (Book 25 §9.4, 0.6) : quatre étapes par famille, qui mènent vers l'échange ----------
// Chacune se fait seul (Book 22 §1) ; l'étape 8 se valide aussi au Comptoir, s'il n'y a personne d'une autre famille.

const LAMES: TypeObjet[] = ["lame_forgee", "machette_forgee", "hachette", "serpe", "hache_forgee", "glaive"];

const METIER_06: Quete[] = [
  // 🔥 Charbonniers : les lames
  {
    id: "pinces",
    ligne: "metier",
    famille: "charbonniers",
    titre: "Les pinces",
    icone: "pinces_forge",
    texte: "Le premier outil du forgeron : forge des pinces de forge (une barre de métal, du charbon).",
    objectifs: [{ libelle: "Pinces de forge", condition: fabriqueOuObjet(["pinces_forge"], ["pinces_forge"]) }],
    lecon: "Les pinces tiennent le fer rouge. Avec elles, une forge ventilée montera un jour à ★★★.",
    recompense: { wotts: 20 },
  },
  {
    id: "trempe",
    ligne: "metier",
    famille: "charbonniers",
    titre: "La trempe",
    icone: "machette_forgee",
    // Plan 0.8 : le bac de trempe est une auge de planches calfatée de glaise (H1B), sans clé.
    texte: "Forge une machette, l'arme de ton métier. Le ressort se trempe au bac : une auge calfatée de glaise du gué. Vise ★★.",
    objectifs: [{ libelle: "Machette forgée ★★", condition: { a: "objet", types: ["machette_forgee"], n: 1, etoiles: 2 } }],
    lecon: "Une lame vaut sa moins bonne part : l'acier, la trempe ou la forge.",
    recompense: { wotts: 25 },
  },
  {
    id: "mise_acier",
    ligne: "metier",
    famille: "charbonniers",
    titre: "La mise d'acier",
    icone: "hachette",
    // Q-0.8-2, Q-0.8-10 : la hachette au foyer de forge, à ★★ ; la hache attend la forge ventilée (plus tard).
    texte: "Au foyer de forge, soude un tranchant de ressort sur un corps de fer, et trempe-le au bac : deux hachettes.",
    objectifs: [{ libelle: "Hachette forgée", condition: fabriqueOuObjet(["hachette"], ["hachette"]) }],
    lecon: "La hachette se lance : va la reprendre là où elle tombe.",
    recompense: { wotts: 30 },
  },
  {
    id: "fournisseur",
    ligne: "metier",
    famille: "charbonniers",
    titre: "Le fournisseur",
    icone: "machette_forgee",
    texte: "Une lame pour un joueur d'une autre famille : échange-la ({agir} près de lui), ou vends-la au Comptoir.",
    objectifs: [{ libelle: "Lame passée aux autres", condition: passeAuxAutres(LAMES) }],
    lecon: "Une lame s'use, un débris se reforge : tes clients reviendront.",
    recompense: { wotts: 40 },
  },
  // ⚡ Voltaïques : l'électricité
  {
    id: "pack",
    ligne: "metier",
    famille: "voltaiques",
    titre: "Du courant en poche",
    icone: "pack_cellules",
    texte: "Trois cellules lithium (une batterie externe, une perceuse…), du fil de cuivre : monte un pack de cellules.",
    objectifs: [{ libelle: "Pack de cellules", condition: fabriqueOuObjet(["pack_cellules"], ["pack_cellules"]) }],
    lecon: "12 Wh qui tiennent dans la main : de quoi éteindre neuf Éteints.",
    recompense: { wotts: 20 },
  },
  {
    id: "raquette",
    ligne: "metier",
    famille: "voltaiques",
    titre: "La Raquette",
    icone: "matraque_electrique",
    texte: "Monte une matraque électrique, puis éteins un Éteint : une courte ({agir}) le raidit, une longue l'éteint.",
    objectifs: [
      { libelle: "Matraque électrique", condition: fabriqueOuObjet(["matraque_electrique", "matraque_electrodes", "matraque_manche_tourne"], ["matraque_electrique"]) },
      { libelle: "Éteint éteint à la décharge", condition: fait("detruit:electrique") },
    ],
    lecon: "Casque ou pas, le courant passe. Mais s'il te tient, dégage-toi d'abord.",
    recompense: { wotts: 25 },
  },
  {
    id: "alarme_electrique",
    ligne: "metier",
    famille: "voltaiques",
    titre: "Prévenu sans bruit",
    icone: "alarme_electrique",
    texte: "Tends une alarme électrique (fil de fer, pile, LED, petit ressort) là où ils passent.",
    objectifs: [{ libelle: "Alarme électrique posée", condition: { a: "un_de", conditions: [installation("alarme_electrique"), fait("fabrique:alarme_electrique")] } }],
    lecon: "La LED s'allume, ton téléphone vibre, et rien ne fait de bruit.",
    recompense: { wotts: 30 },
  },
  {
    id: "courant_autres",
    ligne: "metier",
    famille: "voltaiques",
    titre: "Le courant chez les autres",
    icone: "lampe_bricolee",
    texte: "Un pack ou une lampe bricolée pour un joueur d'une autre famille : échange-le, ou vends-le au Comptoir.",
    objectifs: [{ libelle: "Pack ou lampe passé aux autres", condition: passeAuxAutres(["pack_cellules", "lampe_bricolee"]) }],
    lecon: "Un pack se vide, une lampe aussi : on reviendra te voir.",
    recompense: { wotts: 40 },
  },
  // ⚙️ Mécanistes : l'arbalète, les pièges
  {
    id: "arbalete",
    ligne: "metier",
    famille: "mecanistes",
    titre: "Le bois qui plie",
    icone: "arbalete",
    texte: "À l'établi : un arbrier scié, une noix, un arc (une perche de frêne suffit), une corde. Monte une arbalète.",
    objectifs: [{ libelle: "Arbalète", condition: fabriqueOuObjet(["arbalete", "arbalete_lourde"], ["arbalete", "arbalete_lourde"]) }],
    lecon: "Armée d'avance, elle tire tout de suite. Réarmer : 3 s sans bouger.",
    recompense: { wotts: 20 },
  },
  {
    id: "carreau",
    ligne: "metier",
    famille: "mecanistes",
    titre: "Le carreau",
    icone: "carreau",
    texte: "Sac → « Prêt à tirer », puis {lancer} : un carreau à la tête, et l'Éteint ne se relève plus.",
    objectifs: [{ libelle: "Éteint détruit d'un carreau", condition: fait("tete:carreau") }],
    lecon: "Jusqu'à 12 m, rien à bander. Au contact, il te faut une autre arme.",
    recompense: { wotts: 25 },
  },
  {
    id: "machoires",
    ligne: "metier",
    famille: "mecanistes",
    titre: "Les mâchoires",
    icone: "assommoir",
    texte: "Pose un piège sur leur passage : un assommoir (bûches, corde) ou des mâchoires (lames de ressort).",
    objectifs: [
      {
        libelle: "Piège posé",
        condition: {
          a: "un_de",
          conditions: [
            installation("assommoir"),
            installation("machoires_fortune"),
            installation("piege_machoires"),
            { a: "faits", faits: ["fabrique:assommoir", "fabrique:machoires_fortune", "fabrique:piege_machoires"], but: 1 },
          ],
        },
      },
    ],
    lecon: "Un piège ne tue pas : il le tient pour toi. À toi d'achever.",
    recompense: { wotts: 30 },
  },
  {
    id: "carquois",
    ligne: "metier",
    famille: "mecanistes",
    titre: "Le carquois des autres",
    icone: "carreau",
    texte: "8 carreaux pour un joueur d'une autre famille : échange-les, ou vends-les au Comptoir.",
    objectifs: [{ libelle: "Carreaux passés aux autres", condition: passeAuxAutres(["carreau", "carreau_acier"], 8) }],
    lecon: "Un carreau se perd, un carreau casse : ton carquois se vendra chaque semaine.",
    recompense: { wotts: 40 },
  },
];

export const QUETES: Quete[] = [...METIER, ...METIER_06, ...INSTALLER, ...AUTRES];

export const QUETE = new Map(QUETES.map((q) => [q.id, q]));

/** Au plus deux objectifs ouverts à la fois sur une ligne qui a des portes (une par route). */
export const PORTES_OUVERTES_MAX = 2;

/**
 * Les quêtes ouvertes d'une ligne, pour cette famille (plan 0.8 §2.6, Q-0.8-19). Les objectifs sans route se suivent un à
 * un, dans l'ordre ; arrivées aux portes, deux sont ouvertes à la fois, la première qui reste de chaque route. Quand une
 * route est finie, sa place passe à l'objectif qui suit les portes. Une ligne sans portes n'en ouvre jamais qu'une.
 */
export function quetesOuvertes(ligne: LigneQuete, famille: Famille, finies: readonly string[]): Quete[] {
  const ouvertes: Quete[] = [];
  const routes = new Set<RouteQuete>();
  let auxPortes = false;
  for (const q of QUETES) {
    if (q.ligne !== ligne || (q.famille && q.famille !== famille)) continue;
    if (q.route) auxPortes = true;
    if (finies.includes(q.id)) continue;
    // Avant les portes : une à une.
    if (!auxPortes) return [q];
    if (q.route) {
      if (!routes.has(q.route)) {
        routes.add(q.route);
        ouvertes.push(q);
      }
    } else if (!ouvertes.some((o) => !o.route)) ouvertes.push(q);
    if (ouvertes.length >= PORTES_OUVERTES_MAX) break;
  }
  return ouvertes;
}

/** La première quête ouverte d'une ligne (le simulateur du rythme suit les lignes une à une). */
export function queteSuivante(ligne: LigneQuete, famille: Famille, finies: readonly string[]): Quete | null {
  return quetesOuvertes(ligne, famille, finies)[0] ?? null;
}

/**
 * Au départ d'une sortie, le carnet nomme les portes ouvertes (plan 0.8 §2.6, avis du game designer, règle 7) :
 * « Une vraie cuisine : il te faut une grille. » null s'il n'y a pas de porte ouverte.
 */
export function phraseDuDepart(ouvertes: readonly Quete[]): string | null {
  const portes = ouvertes.filter((q) => q.route && q.besoin);
  if (portes.length === 0) return null;
  return `${portes.map((q) => `${q.titre} : ${q.besoin}`).join(". ")}.`;
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
  /** Une porte du niveau 1 : sa route (le carnet le dit : « vers la Coopérative », « vers le Moulin »). */
  route?: RouteQuete;
  titre: string;
  icone?: string;
  texte: string;
  objectifs: { libelle: string; fait: number; but: number }[];
  recompense?: string;
}

export interface VueQuetes {
  quetes: VueQuete[];
  /** Les quêtes qui viennent d'être réussies (souvent une seule), et leur leçon, à montrer un moment. */
  reussies?: { titre: string; lecon: string; recompense?: string }[];
}

