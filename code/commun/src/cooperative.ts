// La Coopérative du Plateau (Book 23, version 0.5) : le plan en données, partagé par le serveur (collisions, pièces,
// portes, obscurité, Éteints, butin) et par le client (le bâtiment en 3D). Tout est de plain-pied en 0.5.
// Repère : x vers l'est (0 → 80 m), z vers le sud (0 → 60 m). Le portail est au sud, la cour des silos au nord.

import type { Boite } from "./lieux.ts";

export const COOP = { largeur: 80, profondeur: 60 } as const;
/** Épaisseur des murs (m). */
export const MUR = 0.3;
/** Hauteur des murs des bâtiments (m) : pour le rendu et les toits qui s'effacent. */
export const HAUTEUR_HANGAR = 7;
export const HAUTEUR_ATELIER = 5.5;

export type PieceCoop = "dehors" | "libre_service" | "bureaux" | "hangar" | "chambre_froide" | "atelier";

/** Les pièces : ce qui arrête la vue, atténue le son, et dit où il fait noir. */
export const PIECES: Record<PieceCoop, { boite: Boite; sombre: boolean; nom: string }> = {
  dehors: { boite: { x: 40, z: 30, l: 80, p: 60 }, sombre: false, nom: "la cour" },
  libre_service: { boite: { x: 46, z: 36, l: 24, p: 8 }, sombre: false, nom: "le libre-service" },
  bureaux: { boite: { x: 66, z: 36, l: 16, p: 8 }, sombre: true, nom: "les bureaux" },
  hangar: { boite: { x: 54, z: 24, l: 40, p: 16 }, sombre: true, nom: "le hangar" },
  chambre_froide: { boite: { x: 63, z: 12, l: 22, p: 8 }, sombre: true, nom: "la chambre froide" },
  atelier: { boite: { x: 17, z: 24, l: 22, p: 20 }, sombre: true, nom: "l'atelier des tracteurs" },
};

/** Une porte : un trou dans un mur entre deux pièces ; `ouverte` au départ. Une porte fermée est un obstacle. */
export interface PorteCoop {
  id: string;
  /** Le milieu de l'ouverture. */
  x: number;
  z: number;
  largeur: number;
  /** Le mur qui la porte court selon x (« x ») ou selon z (« z »). */
  sens: "x" | "z";
  entre: [PieceCoop, PieceCoop];
  ouverte: boolean;
  /** Le portail grince : l'ouvrir fait du bruit (Book 23 §2.2). */
  bruyante?: boolean;
}

export const PORTES: PorteCoop[] = [
  // Le libre-service ouvre sur la cour (devant) et sur le hangar (derrière).
  { id: "libre_service_cour", x: 44, z: 40, largeur: 2.4, sens: "x", entre: ["dehors", "libre_service"], ouverte: true },
  { id: "libre_service_hangar", x: 40, z: 32, largeur: 1.6, sens: "x", entre: ["libre_service", "hangar"], ouverte: true },
  // Les bureaux : une seule porte, côté hangar, au bout d'un couloir (le point d'étranglement).
  { id: "bureaux", x: 61, z: 32, largeur: 1.2, sens: "x", entre: ["hangar", "bureaux"], ouverte: false },
  // La chambre froide : deux portes (la boucle, Book 23 §2.2).
  { id: "froide_hangar", x: 60, z: 16, largeur: 2, sens: "x", entre: ["hangar", "chambre_froide"], ouverte: false },
  { id: "froide_arriere", x: 70, z: 8, largeur: 2, sens: "x", entre: ["chambre_froide", "dehors"], ouverte: false },
  // Le quai : une large porte de chargement dans le mur ouest du hangar.
  { id: "quai", x: 34, z: 26, largeur: 3.5, sens: "z", entre: ["dehors", "hangar"], ouverte: true },
  // L'atelier : grande porte au sud (vers la cour), porte de service à l'est (vers le quai).
  { id: "atelier_sud", x: 15, z: 34, largeur: 6, sens: "x", entre: ["dehors", "atelier"], ouverte: true },
  { id: "atelier_est", x: 28, z: 20, largeur: 1.4, sens: "z", entre: ["atelier", "dehors"], ouverte: true },
];

/** Le portail (sud) et la brèche du grillage (ouest) : les entrées depuis la route. */
export const PORTAIL = { x: 43, z: 59, largeur: 6 } as const;
export const BRECHE = { x: 0.5, z: 31, largeur: 3 } as const;

/** Les murs extérieurs des bâtiments, avec leurs portes découpées (calculés ci-dessous). */
function mursDe(b: Boite, portes: PorteCoop[]): Boite[] {
  const x0 = b.x - b.l / 2;
  const x1 = b.x + b.l / 2;
  const z0 = b.z - b.p / 2;
  const z1 = b.z + b.p / 2;
  const murs: Boite[] = [];
  // Un mur selon x (nord ou sud) à la hauteur z, de xa à xb, découpé par les portes qui s'y trouvent.
  const murX = (z: number, xa: number, xb: number) => {
    const trous = portes.filter((p) => p.sens === "x" && Math.abs(p.z - z) < 0.5 && p.x > xa && p.x < xb).sort((a, c) => a.x - c.x);
    let debut = xa;
    for (const t of trous) {
      const fin = t.x - t.largeur / 2;
      if (fin > debut + 0.05) murs.push({ x: (debut + fin) / 2, z, l: fin - debut, p: MUR });
      debut = t.x + t.largeur / 2;
    }
    if (xb > debut + 0.05) murs.push({ x: (debut + xb) / 2, z, l: xb - debut, p: MUR });
  };
  const murZ = (x: number, za: number, zb: number) => {
    const trous = portes.filter((p) => p.sens === "z" && Math.abs(p.x - x) < 0.5 && p.z > za && p.z < zb).sort((a, c) => a.z - c.z);
    let debut = za;
    for (const t of trous) {
      const fin = t.z - t.largeur / 2;
      if (fin > debut + 0.05) murs.push({ x, z: (debut + fin) / 2, l: MUR, p: fin - debut });
      debut = t.z + t.largeur / 2;
    }
    if (zb > debut + 0.05) murs.push({ x, z: (debut + zb) / 2, l: MUR, p: zb - debut });
  };
  murX(z0, x0, x1);
  murX(z1, x0, x1);
  murZ(x0, z0, z1);
  murZ(x1, z0, z1);
  return murs;
}

/** Le grand bâtiment (hangar, libre-service, bureaux, chambre froide) : x 34 → 74, z 8 → 40. */
export const BATIMENT = { x: 54, z: 24, l: 40, p: 32 } as const;
/** L'atelier des tracteurs, à part, à l'ouest. */
export const ATELIER = PIECES.atelier.boite;

/** Les cloisons intérieures du grand bâtiment (avec leurs portes). */
function cloisons(): Boite[] {
  const c: Boite[] = [];
  const portesInt = PORTES.filter((p) => p.entre.includes("hangar") && !p.entre.includes("dehors"));
  // Entre le hangar et l'avant (libre-service + bureaux) : z = 32, de x 34 à 74.
  const avant = mursDe({ x: 54, z: 36, l: 40, p: 8 }, portesInt).filter((m) => Math.abs(m.z - 32) < 0.5);
  c.push(...avant);
  // Entre libre-service et bureaux : x = 58, z 32 → 40.
  c.push({ x: 58, z: 36, l: MUR, p: 8 });
  // Entre le hangar et la chambre froide : z = 16, de x 52 à 74 ; son mur ouest x = 52, z 8 → 16.
  c.push(...mursDe({ x: 63, z: 12, l: 22, p: 8 }, portesInt).filter((m) => Math.abs(m.z - 16) < 0.5));
  c.push({ x: 52, z: 12, l: MUR, p: 8 });
  return c;
}

/** Les rayonnages du hangar : trois longues rangées de 4 m de haut (Book 23 §2.2), avec des passages au milieu. */
export const RAYONNAGES: Boite[] = [
  { x: 44, z: 20, l: 14, p: 1.2 },
  { x: 64, z: 20, l: 14, p: 1.2 },
  { x: 44, z: 24.5, l: 14, p: 1.2 },
  { x: 64, z: 24.5, l: 14, p: 1.2 },
  { x: 44, z: 29, l: 14, p: 1.2 },
  { x: 64, z: 29, l: 14, p: 1.2 },
];

/** Le mobilier qui gêne le passage (boîtes au sol). */
export const MOBILIER: { genre: string; boite: Boite; o?: number }[] = [
  // Libre-service : le comptoir de caisse et deux rayons bas.
  { genre: "caisse", boite: { x: 38, z: 38.2, l: 3, p: 0.8 } },
  { genre: "rayon_bas", boite: { x: 46, z: 35, l: 6, p: 0.9 } },
  { genre: "rayon_bas", boite: { x: 52, z: 37.5, l: 5, p: 0.9 } },
  // Bureaux : le bureau du directeur et son coffre.
  { genre: "bureau", boite: { x: 69, z: 37, l: 2.4, p: 1.1 } },
  { genre: "coffre_fort", boite: { x: 72.6, z: 34, l: 0.9, p: 0.9 } },
  // Atelier : deux tracteurs, la fosse, l'établi.
  { genre: "tracteur", boite: { x: 12, z: 20, l: 2.6, p: 4.2 }, o: 0.15 },
  { genre: "tracteur", boite: { x: 22, z: 26, l: 2.6, p: 4.2 }, o: -0.3 },
  { genre: "etabli", boite: { x: 7.5, z: 30.5, l: 3, p: 0.9 } },
  // Quai : palettes et transpalette.
  { genre: "palettes", boite: { x: 31, z: 31, l: 1.4, p: 1.4 } },
  { genre: "palettes", boite: { x: 30.5, z: 22, l: 1.4, p: 2.8 } },
  { genre: "transpalette", boite: { x: 31.5, z: 27.5, l: 0.8, p: 1.6 } },
  // Cour des silos : les deux silos.
  { genre: "silo", boite: { x: 14, z: 5, l: 6, p: 6 } },
  { genre: "silo", boite: { x: 23, z: 5, l: 6, p: 6 } },
  // Cour d'entrée : la bascule (on marche dessus) n'est pas un obstacle ; une camionnette, si.
  { genre: "camionnette", boite: { x: 26, z: 50, l: 2.2, p: 5 }, o: 0.4 },
];

/** La bascule à camions et la fosse : au sol, sans obstacle (le rendu les dessine). */
export const BASCULE: Boite = { x: 52, z: 50, l: 4, p: 10 };
export const FOSSE: Boite = { x: 17, z: 30, l: 1.4, p: 4 };

/** Tous les obstacles fixes (les portes fermées s'y ajoutent selon leur état). */
export function obstaclesCoop(): Boite[] {
  const portesBat = PORTES.filter((p) => p.entre.includes("dehors"));
  return [
    ...mursDe(BATIMENT, portesBat),
    ...mursDe(ATELIER, portesBat),
    ...cloisons(),
    ...RAYONNAGES,
    ...MOBILIER.filter((m) => m.genre !== "bascule").map((m) => m.boite),
  ];
}

/** Une porte fermée : la boîte qui bouche son ouverture. */
export function boitePorte(p: PorteCoop): Boite {
  return p.sens === "x" ? { x: p.x, z: p.z, l: p.largeur, p: MUR } : { x: p.x, z: p.z, l: MUR, p: p.largeur };
}

/** Dans quelle pièce est ce point ? (la plus petite qui le contient ; sinon, dehors) */
export function pieceDe(x: number, z: number): PieceCoop {
  let meilleure: PieceCoop = "dehors";
  let aire = Infinity;
  for (const [nom, p] of Object.entries(PIECES) as [PieceCoop, (typeof PIECES)[PieceCoop]][]) {
    if (nom === "dehors") continue;
    const b = p.boite;
    if (Math.abs(x - b.x) <= b.l / 2 && Math.abs(z - b.z) <= b.p / 2 && b.l * b.p < aire) {
      meilleure = nom;
      aire = b.l * b.p;
    }
  }
  // Le coin nord-ouest du grand bâtiment (derrière le quai, à côté de la chambre froide) appartient au hangar.
  if (meilleure === "dehors" && Math.abs(x - BATIMENT.x) <= BATIMENT.l / 2 && Math.abs(z - BATIMENT.z) <= BATIMENT.p / 2) return "hangar";
  return meilleure;
}

/** Fait-il noir ici (sans lumière portée) ? */
export function sombreIci(x: number, z: number): boolean {
  return PIECES[pieceDe(x, z)].sombre;
}

/** Où l'on arrive : au portail, face au nord (Book 23 §2.3 : rien à moins de 15 m). */
export const ARRIVEE_COOP = { x: PORTAIL.x, z: PORTAIL.z - 2.5, o: Math.PI } as const;

/** Version du contenu de la Coopérative (ressources, butin) : la changer régénère les instances. */
export const VERSION_COOP = 1;

