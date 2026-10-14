// Le métier des familles (Book 25, version 0.6, chantier 3) : toutes les matières et tous les objets fabriqués de la 0.6,
// déclarés d'un coup, pour que les chantiers 4 à 7 n'aient pas à toucher le catalogue (Book 25 §10.4). Les vestiges
// nouveaux (fil dentaire, bobine d'allumage, manuels…) sont dans vestiges.ts, avec leur rareté et leur lieu.
//
// Les recettes qui fabriquent ces objets arrivent avec les chantiers de métier : `recettes/<famille>.ts`. En attendant,
// leur énergie grise est une valeur provisoire (ENERGIE_GRISE_PROVISOIRE, d'après le Book 25 §4.5) ; dès qu'une recette
// les produit, c'est elle qui compte.

import type { DefinitionObjet, TypeObjet } from "./objets.ts";
import { ENERGIE_GRISE_NIVEAU1 } from "./objets-niveau1.ts";

/** Les matières et les objets de la 0.6 (Book 25 §9.1 et §10.3). */
export const OBJETS_METIER = {
  // ---------- Les matières (chantier 3) ----------
  perche_frene: {
    nom: "perche de frêne",
    pluriel: "perches de frêne",
    poids: 1.2,
    description: "Une perche de frêne, droite et souple, coupée à la lisière. Elle plie sans casser : le bois de l'arc simple.",
  },
  baton_if: {
    nom: "bâton d'if",
    pluriel: "bâtons d'if",
    poids: 1,
    description: "Cœur rouge, aubier clair : le meilleur bois d'arc. Toutes les parties de l'if sont toxiques, on n'en mange rien.",
  },
  plumes: {
    nom: "poignée de plumes",
    pluriel: "poignées de plumes",
    poids: 0.03,
    description: "Les plumes d'une poule, triées : les longues des ailes empennent trois flèches ou quatre carreaux.",
  },
  os: {
    nom: "os de poule",
    pluriel: "os de poule",
    poids: 0.03,
    description: "Un os de poule, gratté et séché. Taillé en pointe, il arme une flèche.",
  },
  graisse: {
    nom: "noix de graisse",
    pluriel: "noix de graisse",
    poids: 0.03,
    description: "La graisse de volaille recueillie sous la broche. Fondue, elle trempe une lame à l'huile, ou brûle dans une lanterne à bocal.",
  },
  boyaux: {
    nom: "boyau séché",
    pluriel: "boyaux séchés",
    poids: 0.05,
    description: "Un boyau de lapin, gratté, tordu et séché. Il fait une corde d'arc nerveuse, qui ne craint pas le froid.",
  },

  // ---------- Tous : l'arc (chantier 4) ----------
  arc_fortune: {
    nom: "arc de fortune",
    pluriel: "arcs de fortune",
    poids: 0.6,
    description: "Une perche verte, une ficelle : il tire, mais le bois vert fatigue vite. Mieux que rien pour commencer.",
  },
  ebauche_arc: {
    nom: "ébauche d'arc en frêne",
    pluriel: "ébauches d'arc en frêne",
    poids: 1,
    description: "Une perche de frêne dégrossie en arc, encore verte. Elle doit sécher deux heures, à l'abri, avant d'être montée.",
  },
  ebauche_arc_seche: {
    nom: "ébauche d'arc sèche",
    pluriel: "ébauches d'arc sèches",
    poids: 0.8,
    description: "L'ébauche de frêne a séché : le bois sonne clair. Il ne lui manque qu'une corde, et un passage au feu.",
  },
  ebauche_if: {
    nom: "ébauche d'arc en if",
    pluriel: "ébauches d'arc en if",
    poids: 0.9,
    description: "Un bâton d'if taillé en arc, le cœur rouge au ventre, l'aubier au dos. Il doit sécher deux heures, à l'abri.",
  },
  ebauche_if_seche: {
    nom: "ébauche d'if sèche",
    pluriel: "ébauches d'if sèches",
    poids: 0.7,
    description: "L'ébauche d'if a séché. Bien montée, elle donnera le meilleur arc qu'on sache faire.",
  },
  corde_arc: {
    nom: "corde d'arc",
    pluriel: "cordes d'arc",
    poids: 0.02,
    description: "Des brins retordus serré, une boucle à chaque bout. Elle ne doit ni s'étirer, ni casser.",
  },
  arc_simple: {
    nom: "arc de frêne",
    pluriel: "arcs de frêne",
    poids: 0.7,
    description: "Un arc simple, d'une seule pièce de frêne séché. Silencieux : la corde ne claque qu'à trois mètres.",
  },
  arc_if: {
    nom: "arc d'if",
    pluriel: "arcs d'if",
    poids: 0.6,
    description: "Un arc d'if, le bois des arcs anglais : il porte plus loin, et il dure. Une pièce que l'on garde.",
  },
  fleche_durcie: {
    nom: "flèche durcie au feu",
    pluriel: "flèches durcies au feu",
    poids: 0.03,
    description: "Un fût redressé, trois plumes, une pointe durcie au feu. Elle blesse ; elle ne perce pas un crâne.",
  },
  fleche_os: {
    nom: "flèche à pointe d'os",
    pluriel: "flèches à pointe d'os",
    poids: 0.03,
    description: "Une pointe d'os ligaturée : elle entre. Une sur trois casse à l'impact.",
  },
  fleche_clou: {
    nom: "flèche à pointe de clou",
    pluriel: "flèches à pointe de clou",
    poids: 0.035,
    description: "Un clou aplati à la pierre, ligaturé au bout du fût. Elle entre. Une sur trois casse.",
  },
  fleche_acier: {
    nom: "flèche à pointe d'acier",
    pluriel: "flèches à pointe d'acier",
    poids: 0.035,
    description: "Une pointe forgée par un Charbonnier : elle entre, et ne casse qu'une fois sur cinq.",
  },

  // ---------- 🔥 Charbonniers : les lames (chantier 5) ----------
  pinces_forge: {
    nom: "pinces de forge",
    pluriel: "pinces de forge",
    poids: 0.9,
    description: "Le premier outil du forgeron : on tient la pièce rouge sans se brûler. Sans elles, pas de belle lame.",
  },
  hachette: {
    nom: "hachette",
    pluriel: "hachettes",
    poids: 0.7,
    description: "Un corps de fer, un tranchant d'acier soudé à la forge. Elle fend le petit bois, et elle se lance.",
  },
  hache_forgee: {
    nom: "hache forgée",
    pluriel: "haches forgées",
    poids: 1.5,
    description: "Une tête neuve, la mise d'acier soudée au fil, un manche de bûche. Elle remplace les têtes rouillées qu'on ne trouve plus.",
  },
  machette_forgee: {
    nom: "machette forgée",
    pluriel: "machettes forgées",
    poids: 0.7,
    description: "Tirée d'un ressort de camionnette, trempée, rivetée sur son manche. Elle tranche, et elle dure.",
  },
  serpe: {
    nom: "serpe",
    pluriel: "serpes",
    poids: 0.5,
    description: "La lame courbe des haies : elle élague d'un coup, et coupe une perche de frêne sans effort.",
  },
  glaive: {
    nom: "glaive de ressort",
    pluriel: "glaives de ressort",
    poids: 1,
    description: "Trois lames de ressort forgées en une épée courte, à la forge ventilée. La pièce de vitrine du forgeron.",
  },
  pointe_lance: {
    nom: "pointe de lance forgée",
    pluriel: "pointes de lance forgées",
    poids: 0.2,
    description: "Une pointe d'acier à douille, prête à emmancher sur un épieu.",
  },
  lance_forgee: {
    nom: "lance à pointe forgée",
    pluriel: "lances à pointe forgée",
    poids: 1.6,
    description: "Un épieu coiffé d'une vraie pointe d'acier : l'allonge de la lance, et une pointe qui ne se défait plus.",
  },
  pointe_acier: {
    nom: "pointe d'acier",
    pluriel: "pointes d'acier",
    poids: 0.01,
    description: "Une petite pointe forgée, pour une flèche ou un carreau. Elle casse bien moins que l'os ou le clou.",
  },
  rivet: {
    nom: "rivet forgé",
    pluriel: "rivets forgés",
    poids: 0.01,
    description: "Un rivet de fer doux, frappé à chaud. Pour un manche qui ne bouge plus, un coffre cerclé.",
  },
  ciseau_bois: {
    nom: "ciseau à bois",
    pluriel: "ciseaux à bois",
    poids: 0.3,
    description: "Une lame plate et trempée, un manche à frapper : on taille une mortaise, un logement de noix.",
  },
  burin: {
    nom: "burin",
    pluriel: "burins",
    poids: 0.3,
    description: "Un court barreau d'acier trempé, biseauté : il tranche une tôle, un fil d'acier, une tête de rivet.",
  },
  ressort_retrempe: {
    nom: "ressort retrempé",
    pluriel: "ressorts retrempés",
    poids: 0.4,
    description: "Une lame de ressort reforgée et trempée à l'huile : elle a retrouvé sa nervosité. Le meilleur arc d'arbalète.",
  },
  electrodes_forgees: {
    nom: "paire d'électrodes forgées",
    pluriel: "paires d'électrodes forgées",
    poids: 0.1,
    description: "Deux pointes d'acier, forgées pour tenir contre une tempe : les contacts d'une matraque des Voltaïques.",
  },

  // ---------- ⚡ Voltaïques : l'électricité (chantier 6) ----------
  pack_cellules: {
    nom: "pack de cellules",
    pluriel: "packs de cellules",
    poids: 0.2,
    description: "Trois cellules lithium câblées et scotchées : 12 Wh qui tiennent dans la main.",
  },
  module_decharge: {
    nom: "module de décharge",
    pluriel: "modules de décharge",
    poids: 0.15,
    description: "La haute tension, en bricolage : un condensateur et son étage de charge, ou une bobine d'allumage. Ne pas toucher.",
  },
  matraque_fortune: {
    nom: "matraque de fortune",
    pluriel: "matraques de fortune",
    poids: 1.4,
    description: "Un gourdin, un petit condensateur, la petite batterie de la frontale : elle raidit, et elle éteint.",
  },
  matraque_electrique: {
    nom: "matraque électrique",
    pluriel: "matraques électriques",
    poids: 0.9,
    description: "« La Raquette » : une décharge courte le raidit, maintenue à la tête elle l'éteint. Casque ou pas.",
  },
  aiguillon: {
    nom: "aiguillon de défense",
    pluriel: "aiguillons de défense",
    poids: 1.4,
    description: "La même décharge, au bout d'un épieu : on le tient à deux mètres. Plus lent à viser la tête.",
  },
  lampe_bricolee: {
    nom: "lampe de poche bricolée",
    pluriel: "lampes de poche bricolées",
    poids: 0.25,
    description: "Quatre LED, un pack, une boîte de conserve en réflecteur : une lumière blanche, sans manivelle.",
    lumiere: "frontale",
  },
  ventilateur_forge: {
    nom: "ventilateur de forge 12 V",
    pluriel: "ventilateurs de forge 12 V",
    poids: 0.6,
    description: "Un petit moteur, une hélice de plastique : posé sur une forge, il souffle à la place du forgeron.",
  },
  electrificateur: {
    nom: "électrificateur",
    pluriel: "électrificateurs",
    poids: 0.3,
    description: "Un module à bobine, une résistance, du cuivre : il envoie le courant du banc dans une clôture.",
  },

  // ---------- ⚙️ Mécanistes : la mécanique (chantier 7) ----------
  arbrier: {
    nom: "arbrier d'arbalète",
    pluriel: "arbriers d'arbalète",
    poids: 1.5,
    description: "Le fût de l'arbalète, scié dans une bûche : la rainure du carreau, le logement de la noix.",
  },
  noix_detente: {
    nom: "noix et détente",
    pluriel: "noix et détentes",
    poids: 0.1,
    description: "La noix qui retient la corde, la détente qui la libère, un petit ressort pour les remettre en place.",
  },
  arc_arbalete: {
    nom: "arc d'arbalète",
    pluriel: "arcs d'arbalète",
    poids: 0.8,
    description: "Un arc court et raide, bridé en travers de l'arbrier : frêne, lame de ressort, if ou ressort retrempé.",
  },
  corde_arbalete: {
    nom: "corde d'arbalète",
    pluriel: "cordes d'arbalète",
    poids: 0.1,
    description: "Une corde épaisse, doublée : deux cordes d'arc, ou une ceinture de sécurité découpée et cousue.",
  },
  arbalete: {
    nom: "arbalète",
    pluriel: "arbalètes",
    poids: 3,
    description: "Armée d'avance, elle tire tout de suite, et perce un crâne à douze mètres. Réarmer prend du temps.",
  },
  arbalete_lourde: {
    nom: "arbalète lourde",
    pluriel: "arbalètes lourdes",
    poids: 4.5,
    description: "Deux ressorts retrempés superposés : un carreau met à terre. On la réarme au pied-de-biche, ou au cranequin.",
  },
  cranequin: {
    nom: "cranequin",
    pluriel: "cranequins",
    poids: 1.5,
    description: "Une manivelle, un pignon, une crémaillère : il réarme l'arbalète lourde sans y laisser le dos.",
  },
  // Le cranequin léger (plan 0.10, chantier F ; N2-33) : un roulement, une chaîne de vélo, une barre. L'arbalète à arc
  // d'if ne se bande pas à la main : il la réarme, et toute arbalète légère, en 2 s au lieu de 3.
  cranequin_leger: {
    nom: "cranequin léger",
    pluriel: "cranequins légers",
    poids: 0.9,
    description: "Un pignon sur son roulement, une crémaillère de chaîne de vélo : trois tours de manivelle, et l'arbalète est bandée.",
  },
  carreau: {
    nom: "carreau",
    pluriel: "carreaux",
    poids: 0.04,
    description: "Un trait court de bois dur, empenné, à pointe d'os ou de clou. Un sur trois casse.",
  },
  carreau_acier: {
    nom: "carreau à pointe d'acier",
    pluriel: "carreaux à pointe d'acier",
    poids: 0.045,
    description: "Un carreau à pointe forgée : il casse une fois sur cinq. Les Mécanistes en rachètent toutes les semaines.",
  },
  manche_tourne: {
    nom: "manche tourné",
    pluriel: "manches tournés",
    poids: 0.3,
    description: "Un manche de bois dur, tourné au tour à perche : il tient la main, et il donne une étoile à l'outil.",
  },
  brouette: {
    nom: "brouette",
    pluriel: "brouettes",
    poids: 12,
    description: "Une roue de vélo, deux bras, une caisse de planches : soixante kilos roulés, et l'on court encore sur le chemin.",
  },

  // ---------- ⚡ Le niveau 2 (plan 0.10, chantier C) : ce qui se fait au poste de montage ----------
  pack_soude: {
    nom: "pack soudé",
    pluriel: "packs soudés",
    poids: 0.35,
    description: "Six cellules lithium soudées en barrette, leur LED de charge sur le côté : 24 Wh qui ne se décrochent pas.",
  },

  // ---------- Les meubles nouveaux du niveau 2 (plan 0.10, chantier D ; meubles-neufs.ts) ----------
  // ⚡ La batterie de cellules (N2-45, S-26) : un type de batterie de 120 Wh, posé à la base (energie.ts).
  batterie_cellules: {
    nom: "batterie de cellules",
    pluriel: "batteries de cellules",
    poids: 0.9,
    description: "Douze cellules lithium soudées en bloc, dans un boîtier de plastique : 120 Wh, pour le banc de la base.",
  },
  // ⚙️ La charrette à bras (N2-46, S-27) : la brouette avec 100 kg roulés au lieu de 60 (objets.ts, `capaciteDe`).
  charrette_bras: {
    nom: "charrette à bras",
    pluriel: "charrettes à bras",
    poids: 16,
    description: "Deux roues de vélo sur roulements neufs, un châssis de tubes, un plateau de bûches : cent kilos roulés, et l'on court encore.",
  },
  // 🔥 Ce que coule le creuset de la forge ventilée (N2-43, S-24) : la poulie (pour le moulin de jerricans), le lingot.
  poulie_aluminium: {
    nom: "poulie d'aluminium",
    pluriel: "poulies d'aluminium",
    poids: 0.6,
    description: "Une poulie coulée dans un moule de terre, sa gorge reprise à la lime. Sur l'axe d'un moulin, elle fait tourner plus vite.",
  },
  lingot_aluminium: {
    nom: "lingot d'aluminium",
    pluriel: "lingots d'aluminium",
    poids: 1,
    description: "Quatre chutes fondues en un lingot propre, mat et léger : il se vend au Comptoir.",
  },
} satisfies Record<string, DefinitionObjet>;

export type TypeObjetMetier = keyof typeof OBJETS_METIER;

/**
 * L'énergie grise provisoire des objets fabriqués de la 0.6, en wotts (Book 25 §4.5 pour les lames) : elle ne sert que
 * tant qu'aucune recette ne les produit. Les matières ont leur valeur de collecte dans ENERGIE_GRISE_BASE (recettes.ts).
 */
export const ENERGIE_GRISE_PROVISOIRE: Partial<Record<TypeObjet, number>> = {
  // Le niveau 1 (plan 0.8, chantier 3) : objets-niveau1.ts.
  ...ENERGIE_GRISE_NIVEAU1,
  arc_fortune: 25,
  ebauche_arc: 45,
  ebauche_arc_seche: 45,
  ebauche_if: 70,
  ebauche_if_seche: 70,
  corde_arc: 15,
  arc_simple: 80,
  arc_if: 110,
  fleche_durcie: 6,
  fleche_os: 8,
  fleche_clou: 8,
  fleche_acier: 12,
  pinces_forge: 110,
  hachette: 190,
  hache_forgee: 380,
  machette_forgee: 330,
  serpe: 200,
  glaive: 620,
  pointe_lance: 90,
  lance_forgee: 120,
  pointe_acier: 10,
  rivet: 5,
  ciseau_bois: 90,
  burin: 90,
  ressort_retrempe: 160,
  electrodes_forgees: 70,
  pack_cellules: 70,
  module_decharge: 40,
  matraque_fortune: 230,
  matraque_electrique: 160,
  aiguillon: 170,
  lampe_bricolee: 85,
  ventilateur_forge: 45,
  electrificateur: 70,
  arbrier: 60,
  noix_detente: 30,
  arc_arbalete: 60,
  corde_arbalete: 35,
  arbalete: 220,
  arbalete_lourde: 520,
  cranequin: 260,
  cranequin_leger: 200,
  carreau: 8,
  carreau_acier: 15,
  manche_tourne: 25,
  brouette: 110,
};
