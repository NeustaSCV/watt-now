// Règles et constantes partagées par le client et le serveur.
// Les valeurs de réglage vivront plus tard dans des données (Book 03 §8) ;
// en É0, elles sont ici, en un seul endroit.

/** Côté du terrain d'un joueur, en mètres (Book 19 §1). */
export const TERRAIN_TAILLE = 50;

/** Distance minimale au bord du terrain, en mètres. */
export const MARGE_BORD = 0.4;

/** Cadence de calcul du serveur, en pas par seconde (Book 17 §2). */
export const TICK_HZ = 20;

/**
 * Un geste de 5 s ou moins se fait en tenant A ; au-delà, c'est un geste long : un appui le lance, un autre l'arrête,
 * et ce qui est fait reste fait (on reprend là où l'on s'était arrêté, décision du 2026-10-08).
 */
export const GESTE_TENU_MAX_S = 5;
/** Un geste long interrompu garde sa progression ce temps-là (réel), puis on l'oublie. */
export const PROGRESSION_GARDEE_MS = 2 * 3_600_000;

/** Vitesses des trois allures (Book 08 §3), en mètres par seconde réelle. Réglage de jeu, à caler en test. */
export const ALLURES = {
  discrete: 1.2,
  marche: 2.4,
  course: 4.6,
} as const;

export type Allure = keyof typeof ALLURES;

export const FAMILLES = ["charbonniers", "voltaiques", "mecanistes"] as const;

export type Famille = (typeof FAMILLES)[number];

export const NOMS_FAMILLES: Record<Famille, string> = {
  charbonniers: "Charbonniers",
  voltaiques: "Voltaïques",
  mecanistes: "Mécanistes",
};

/** Point d'arrivée d'un nouveau personnage : près du centre du terrain. */
export const POINT_ARRIVEE = { x: 25, z: 27 } as const;

export const PSEUDO_MIN = 2;
export const PSEUDO_MAX = 20;
export const MOT_DE_PASSE_MIN = 6;

export function estFamille(valeur: unknown): valeur is Famille {
  return typeof valeur === "string" && (FAMILLES as readonly string[]).includes(valeur);
}

export function estAllure(valeur: unknown): valeur is Allure {
  return typeof valeur === "string" && Object.hasOwn(ALLURES, valeur);
}
