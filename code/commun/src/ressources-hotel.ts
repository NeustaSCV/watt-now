// Les ressources du Grand Hôtel des Flots (plan 0.10, chantier J) : ses points de fouille (FICHE.fouille), ses objets-clés
// à leur place (Q-0.10-2, S-03 : tous à l'étage) et le pied de guéridon de la terrasse (N2-49, une fois par personnage).
// Leur type, leur usage, leur délai : terrain.ts les reprend (TypeRessource, USAGES, REPOUSSE_MS, RESTE_EN_PLACE) ;
// leur place est dans hotel.ts (`butinHotel`) ; leur table de fouille dans vestiges.ts (LIEU_DE_FOUILLE).
//
// Ce fichier n'importe que des types (terrain.ts l'importe).

import type { UsageRessource } from "./terrain.ts";

export type TypeRessourceHotel =
  // Les objets-clés de L2A, chacun à sa place à l'étage (S-03) : les couvertures à la lingerie, la lanterne-tempête dans
  // la suite, les roulements et le fer à souder dans la machinerie de l'ascenseur, les tôles dans la chambre 8.
  | "hotel_couvertures"
  | "hotel_lanterne"
  | "hotel_roulements"
  | "hotel_fer"
  | "hotel_toles"
  // Le pied de fonte du guéridon renversé de la terrasse : l'arme trouvée de L2A (N2-49).
  | "hotel_gueridon"
  // Les fouilles du rez-de-chaussée et des dehors.
  | "hotel_reception"
  | "hotel_bagages"
  | "hotel_cuisines"
  | "hotel_conserves"
  | "hotel_poisson"
  | "hotel_desserte"
  | "hotel_camp"
  | "hotel_bar"
  | "hotel_buvette"
  | "hotel_barque"
  | "hotel_maitre_nageur"
  | "hotel_transats"
  | "hotel_balcon_tombe"
  // Les fouilles de l'étage : les salles de bains (le fil dentaire, courant au niveau 2 : N2-61), les chambres, la
  // lingerie, la suite, la machinerie, l'office.
  | "hotel_bain_suite"
  | "hotel_bain_7"
  | "hotel_toilette_9"
  | "hotel_chambre_11"
  | "hotel_lingerie"
  | "hotel_suite"
  | "hotel_machinerie"
  | "hotel_chambre_8"
  | "hotel_office";

const H = 3_600_000;

/**
 * Les délais (S-03, §3.1) : les couvertures reviennent en 24 h, les autres objets-clés en 4 jours (au-delà du retour de
 * l'hôtel à 24 h : serveur/src/hotel.ts les garde) ; le pied de guéridon, jamais (une fois par personnage) ; les fouilles
 * en 12 h, comme au Moulin (tout revient de toute façon à 24 h).
 */
export const REPOUSSE_HOTEL: Record<TypeRessourceHotel, number | null> = {
  hotel_couvertures: 24 * H,
  hotel_lanterne: 96 * H,
  hotel_roulements: 96 * H,
  hotel_fer: 96 * H,
  hotel_toles: 96 * H,
  hotel_gueridon: null,
  hotel_reception: 12 * H,
  hotel_bagages: 12 * H,
  hotel_cuisines: 12 * H,
  hotel_conserves: 12 * H,
  hotel_poisson: 12 * H,
  hotel_desserte: 12 * H,
  hotel_camp: 12 * H,
  hotel_bar: 12 * H,
  hotel_buvette: 12 * H,
  hotel_barque: 12 * H,
  hotel_maitre_nageur: 12 * H,
  hotel_transats: 12 * H,
  hotel_balcon_tombe: 12 * H,
  hotel_bain_suite: 12 * H,
  hotel_bain_7: 12 * H,
  hotel_toilette_9: 12 * H,
  hotel_chambre_11: 12 * H,
  hotel_lingerie: 12 * H,
  hotel_suite: 12 * H,
  hotel_machinerie: 12 * H,
  hotel_chambre_8: 12 * H,
  hotel_office: 12 * H,
};

/** Les objets-clés de l'hôtel qui reviennent en plus de 24 h (le retour de l'hôtel ne les rend pas avant leur délai). */
export const CLES_LENTES_HOTEL: readonly TypeRessourceHotel[] = ["hotel_lanterne", "hotel_roulements", "hotel_fer", "hotel_toles"];

/** Ce qu'on emporte et qui est dessiné dans le modèle (les objets-clés, le pied de guéridon) : il disparaît quand on le prend. */
export const EMPORTES_HOTEL: readonly TypeRessourceHotel[] = ["hotel_couvertures", "hotel_lanterne", "hotel_roulements", "hotel_fer", "hotel_toles", "hotel_gueridon"];

/** Les fouilles restent en place, vidées. */
export const RESTE_EN_PLACE_HOTEL: Partial<Record<TypeRessourceHotel, true>> = Object.fromEntries(
  (Object.keys(REPOUSSE_HOTEL) as TypeRessourceHotel[]).filter((t) => !EMPORTES_HOTEL.includes(t)).map((t) => [t, true]),
);

const fouille = (libelle: string, donne: UsageRessource["donne"], examen: string, duree = 6): UsageRessource => ({ verbe: "fouiller", libelle, donne, qualites: {}, duree, examen });

export const USAGES_HOTEL: Record<TypeRessourceHotel, UsageRessource> = {
  // ---------- Les objets-clés, à l'étage ----------
  hotel_couvertures: {
    verbe: "ramasser",
    libelle: "Prendre les couvertures de laine",
    donne: { couvertures_laine: 1 },
    qualites: {},
    duree: 2,
    examen: "Sur l'étagère de la lingerie, entre les draps, deux couvertures de laine épaisse pliées au carré.",
  },
  hotel_lanterne: {
    verbe: "ramasser",
    libelle: "Prendre la lanterne-tempête",
    donne: { lanterne_tempete: 1 },
    qualites: {},
    duree: 2,
    examen: "Sur le guéridon de la suite, une lanterne-tempête au verre bombé, à côté d'une bougie. Le vent ne l'éteint pas.",
  },
  hotel_roulements: {
    verbe: "ramasser",
    libelle: "Prendre la boîte de roulements",
    // V1-01 : une boîte de trois roulements.
    donne: { roulements: 3 },
    qualites: {},
    duree: 2,
    examen: "Sur l'établi du mécanicien de l'ascenseur, une boîte de roulements à billes neufs, dans leur papier huilé.",
  },
  hotel_fer: {
    verbe: "ramasser",
    libelle: "Prendre le fer à souder",
    donne: { fer_souder: 1 },
    qualites: {},
    duree: 2,
    examen: "Sur l'établi, un fer à souder et sa bobine d'étain : on réparait ici les contacts du treuil.",
  },
  hotel_toles: {
    verbe: "ramasser",
    libelle: "Prendre les tôles ondulées",
    donne: { toles_ondulees: 1 },
    qualites: {},
    duree: 4,
    examen: "Empilées contre le mur de la chambre 8, des tôles ondulées galvanisées : on rapiéçait le toit par le balcon.",
  },
  hotel_gueridon: {
    verbe: "demonter",
    libelle: "Démonter le pied du guéridon",
    donne: { pied_gueridon: 1 },
    qualites: {},
    duree: 4,
    examen: "Un guéridon de terrasse renversé : son plateau de marbre s'est fendu, sa colonne de fonte ne tient plus qu'à un boulon.",
  },
  // ---------- Le rez-de-chaussée et les dehors ----------
  hotel_reception: fouille("Fouiller la réception", { ficelle: 1 }, "Le comptoir de la réception : le registre ouvert, des stylos, un nécessaire de couture, le tableau des chambres vide."),
  hotel_bagages: fouille("Fouiller les valises", { chiffons: 2 }, "Le chariot à bagages en laiton, chargé de valises jamais montées : des vêtements, des trousses de toilette."),
  hotel_cuisines: fouille("Fouiller les cuisines", { conserve: 1 }, "Les cuisines : le piano de cuisson froid, des marmites, des couteaux de chef dans leur bloc."),
  hotel_conserves: fouille("Fouiller la chambre froide", { conserve: 2 }, "La chambre froide des conserves, tiède depuis longtemps : des boîtes alignées, des sacs de farine éventrés."),
  hotel_poisson: fouille("Fouiller la chambre froide", { conserve: 1 }, "La chambre froide du poisson : l'odeur est partie, il reste des bocaux et des boîtes de sardines."),
  hotel_desserte: fouille("Fouiller la desserte", { chiffons: 2 }, "La desserte de la salle à manger : l'argenterie ternie, des nappes et des serviettes, des bougies."),
  hotel_camp: fouille("Fouiller le camp des survivants", { chiffons: 2 }, "Devant la cheminée du grand salon, un camp de survivants : des couvertures polaires, un réchaud, un carnet écrit serré."),
  hotel_bar: fouille("Fouiller le bar", { bouteille_verre: 1 }, "Le bar de la rotonde, barricadé : des bouteilles, des verres, des siphons."),
  hotel_buvette: fouille("Fouiller la buvette", { bouteille_plastique: 1 }, "La buvette de la promenade : une glacière de sodas éventés, du sel, des gobelets, la toile de l'auvent."),
  hotel_barque: fouille("Fouiller la barque", { corde: 1 }, "Une barque échouée sur le sable : un cordage, une rame, une petite ancre."),
  hotel_maitre_nageur: fouille("Fouiller le poste du maître-nageur", { pansement: 1 }, "Le poste du maître-nageur : une bouée, une corde, une trousse de secours, un sifflet."),
  hotel_transats: fouille("Fouiller les transats", { chiffons: 1 }, "Des transats délavés, des parasols de toile rayée : du tissu, du bois, de la visserie."),
  hotel_balcon_tombe: fouille("Fouiller le balcon tombé", { ferraille_tordue: 1 }, "Le balcon de la chambre 8, tombé sur la dune : du fer forgé tordu, des moellons."),
  // ---------- L'étage ----------
  hotel_bain_suite: fouille("Fouiller la salle de bains", { fil_dentaire: 1 }, "La salle de bains de la suite : l'armoire à pharmacie ouverte, des savons, des serviettes, un peignoir."),
  hotel_bain_7: fouille("Fouiller la salle de bains", { fil_dentaire: 1 }, "La salle de bains de la chambre 7 : un savon, des serviettes, un rasoir."),
  hotel_toilette_9: fouille("Fouiller le cabinet de toilette", { chiffons: 1 }, "Le cabinet de toilette de la chambre 9 : un savon, des serviettes, une brosse à dents encore sous blister."),
  hotel_chambre_11: fouille("Fouiller la chambre", { chiffons: 2 }, "La chambre 11, sur la cour : une valise oubliée au pied du lit."),
  hotel_lingerie: fouille("Fouiller la lingerie", { chiffons: 3 }, "La lingerie : des draps qui pendent, des serviettes, des taies, du fil et des aiguilles."),
  hotel_suite: fouille("Fouiller la suite", { chiffons: 2 }, "La suite : des rideaux de velours, une malle de voyage au pied du lit à baldaquin."),
  hotel_machinerie: fouille("Fouiller la machinerie", { rouleau_fil_fer: 1 }, "La machinerie de l'ascenseur : le gros treuil, du câble, des burettes d'huile vides."),
  hotel_chambre_8: fouille("Fouiller la chambre 8", { poignee_clous: 1 }, "La chambre 8, ouverte sur le vide : des outils, une boîte de clous, le vent de la mer."),
  hotel_office: fouille("Fouiller l'office", { chiffons: 2 }, "L'office d'étage : des produits ménagers, des chiffons, des ampoules."),
};
