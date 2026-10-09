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

export interface Quete {
  id: string;
  ligne: LigneQuete;
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

// ---------- S'installer (Book 22 §3.1 : l'ordre de l'urgence de la proposition P-002, et sa gamme bushcraft) ----------

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
    titre: "La dynamo",
    icone: "pedalier",
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
    icone: "panneau_solaire",
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
    lecon: "Sans pinces, pas plus de ★★. Avec elles et une enclume, ★★★.",
    recompense: { wotts: 20 },
  },
  {
    id: "trempe",
    ligne: "metier",
    famille: "charbonniers",
    titre: "La trempe",
    icone: "machette_forgee",
    texte: "Forge une machette, l'arme de ton métier. Ressort ou fer doux, trempe à l'eau ou à l'huile : vise ★★ ou mieux.",
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
    texte: "Soude un tranchant de ressort sur un corps de fer : forge des hachettes, ou une hache.",
    objectifs: [{ libelle: "Hachette ou hache forgée", condition: fabriqueOuObjet(["hachette", "hache_forgee", "hache_forgee_soc"], ["hachette", "hache_forgee"]) }],
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
    lecon: "Casque ou pas, le courant passe. Et une courte fait lâcher qui te tient.",
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

