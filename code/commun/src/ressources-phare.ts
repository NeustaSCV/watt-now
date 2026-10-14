// Les ressources du phare du cap (plan 0.10, chantier K) : ce qu'on y prend ou fouille, déclaré à part et repris par
// terrain.ts (le type, la repousse, l'usage) et vestiges.ts (la table de fouille), comme le niveau 1 l'est en tête de ces
// fichiers. Leurs places sont dans commun/src/phare-vivant.ts (butinPhare).
//
// - Le harpon du gardien (N2-62), au-dessus de la cuisinière : une arme trouvée, une fois par personnage (REPOUSSE null,
//   comme la fourche du Moulin).
// - Le compresseur de la corne de brume (S-16) : le réparer est un geste de 10 s, Serrer 1, sans pièce ; il reste réparé
//   jusqu'au retour du phare, à 24 h (serveur/src/phare.ts le relève).
// - Les objets-clés du niveau 2 du phare (Q-0.10-2, R49 : tous au fond), dans l'épave : la cloche du cargo sur la proue, et
//   dans les conteneurs la porte de four, le soufflet, le rabot et le jerrican. Chacun revient selon son délai (S-03 :
//   4 jours, le jerrican 24 h), et ne se prend que l'épave échouée (serveur/src/phare.ts).
// - Le butin commun : la cuisine, la chambre, la salle des machines, le hangar, la grève (leurs tables : vestiges.ts).
//
// Ce fichier n'importe que des types.

import type { Inventaire } from "./objets.ts";
import type { UsageRessource } from "./terrain.ts";
import type { LieuFouille } from "./vestiges.ts";

export type TypeRessourcePhare =
  | "phare_harpon"
  | "phare_compresseur"
  | "phare_cloche"
  | "phare_porte_four"
  | "phare_soufflet"
  | "phare_rabot"
  | "phare_jerrican"
  | "phare_vaisselier"
  | "phare_chambre"
  | "phare_machines"
  | "phare_hangar"
  | "phare_greve";

const HEURE = 3_600_000;

/** Les objets-clés de l'épave : ils ne se prennent que l'épave échouée. */
export const OBJETS_DE_L_EPAVE: readonly TypeRessourcePhare[] = ["phare_cloche", "phare_porte_four", "phare_soufflet", "phare_rabot", "phare_jerrican"];

/** Leur repousse (ms réelles) ; null : jamais (le harpon, une fois par personnage). */
export const REPOUSSE_PHARE: Record<TypeRessourcePhare, number | null> = {
  phare_harpon: null,
  // Réparé jusqu'au retour du phare (24 h).
  phare_compresseur: 24 * HEURE,
  // S-03 : les objets-clés reviennent à leur délai (§3.1 du plan) ; le retour du phare à 24 h ne les fait pas revenir avant.
  phare_cloche: 4 * 24 * HEURE,
  phare_porte_four: 4 * 24 * HEURE,
  phare_soufflet: 4 * 24 * HEURE,
  phare_rabot: 4 * 24 * HEURE,
  phare_jerrican: 24 * HEURE,
  // Le butin commun revient en 12 h, comme au Moulin ; tout revient de toute façon à 24 h, avec le phare.
  phare_vaisselier: 12 * HEURE,
  phare_chambre: 12 * HEURE,
  phare_machines: 12 * HEURE,
  phare_hangar: 12 * HEURE,
  phare_greve: 12 * HEURE,
};

const prendre = (libelle: string, donne: Inventaire, duree: number, examen: string): UsageRessource => ({ verbe: "ramasser", libelle, donne, qualites: {}, duree, examen });
const fouiller = (libelle: string, donne: Inventaire, examen: string): UsageRessource => ({ verbe: "fouiller", libelle, donne, qualites: {}, duree: 6, examen });

export const USAGES_PHARE: Record<TypeRessourcePhare, UsageRessource> = {
  phare_harpon: prendre(
    "Décrocher le harpon",
    { harpon: 1 },
    2,
    "Au-dessus de la cuisinière, en trophée, un vieux harpon de baleinier : une hampe brunie, un fer barbelé. Il tient un Éteint à plus de deux mètres.",
  ),
  phare_compresseur: {
    verbe: "demonter",
    libelle: "Réparer le compresseur",
    donne: {},
    qualites: { serrer: 1 },
    duree: 10,
    examen: "Le compresseur de la corne de brume : pistons, volant, réservoirs d'air. Sa courroie a sauté de la poulie ; retendue et serrée, elle repartirait.",
  },
  phare_cloche: prendre(
    "Décrocher la cloche du cargo",
    { cloche_bronze: 1 },
    4,
    "Sur la proue, la cloche de bronze du cargo, gravée « PRIME ABONDANCE ». Elle sonne encore quand la coque bouge.",
  ),
  phare_porte_four: prendre(
    "Prendre la porte de four en fonte",
    { porte_four: 1 },
    3,
    "Dans un carton éventré de la Livraison du Jour : une porte de four en fonte, neuve, sous film. « Livré avant d'être commandé ».",
  ),
  phare_soufflet: prendre(
    "Prendre le soufflet de forge",
    { soufflet_forge: 1 },
    3,
    "Un soufflet de forge, cuir et bois de hêtre, encore sous plastique. L'étiquette promet « l'artisanat d'autrefois, livré demain ».",
  ),
  phare_rabot: prendre("Prendre le rabot", { rabot: 1 }, 2, "Dans une caisse à outils du conteneur : un rabot de menuisier, la lame encore huilée."),
  phare_jerrican: prendre("Prendre le jerrican de 20 L", { jerrican_20l: 1 }, 2, "Parmi les bidons du bord, un jerrican de 20 L, vide, son bouchon vissé. Solide, étanche."),
  phare_vaisselier: fouiller("Fouiller le vaisselier", {}, "Le vaisselier du gardien : des assiettes ébréchées, des conserves, des bougies, des allumettes humides."),
  phare_chambre: fouiller("Fouiller le coffre de marin", {}, "Un coffre de marin au pied du lit : des vêtements de mer pliés, une lampe à huile, une couverture polaire."),
  phare_machines: fouiller("Fouiller la salle des machines", {}, "Le groupe électrogène, ses courroies, ses filtres ; le tableau à couteaux et ses fusibles."),
  phare_hangar: fouiller("Fouiller l'établi du hangar", {}, "L'établi du hangar : des filets, des bouées couronnes, des outils rouillés, un photophore « Watty Glow »."),
  phare_greve: fouiller("Fouiller la laisse de mer", { corde: 1 }, "La laisse de mer, sur les galets : bois flotté, bouées, cordages, bouteilles. Ce que la mer rapporte."),
};

/** Les tables de fouille du butin commun (vestiges.ts, LIEU_DE_FOUILLE) : celles qui lui ressemblent. */
export const LIEU_DE_FOUILLE_PHARE: Partial<Record<TypeRessourcePhare, LieuFouille>> = {
  phare_vaisselier: "libre_service",
  phare_chambre: "bureaux",
  phare_machines: "atelier",
  phare_hangar: "hangar",
  phare_greve: "quai",
};
