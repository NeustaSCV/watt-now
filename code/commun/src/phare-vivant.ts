// Le phare du cap vivant (plan 0.10, chantier K) : ce qui arrête la vue (la vue par pièce), ce que perçoivent les Éteints
// (le milieu), les Éteints placés par la fiche du modèle, et les points de butin. À part du plan (phare.ts), comme le
// Moulin (vue-lieux.ts, milieu-moulin.ts, eteints-moulin.ts) : le plan sert aux lieux, et ceci dépend des lieux.

import { ATTENTION_MAX, eteintsDePlaces, nouvelEteint, type Eteint, type Milieu, type PlaceEteint } from "./eteints.ts";
import { ETEINTS_MODELE } from "./phare-modele.ts";
import { heurte } from "./lieux.ts";
import { PHARE, PIECES_PHARE, PORTES_PHARE, jeu, mursVuePhare, piecePhare, sombrePhare, zonePhare, type PorteDuPhare } from "./phare.ts";
import type { TypeRessourcePhare } from "./ressources-phare.ts";
import type { RessourceSol } from "./terrain.ts";
import { facteurSon, obstaclesVue, voit, type PlanVue } from "./vue.ts";

// ---------- La vue par pièce ----------

/**
 * Le phare : le pied de la tour, les maisons des gardiens (cuisine, chambre, salle des machines), le hangar, la salle de
 * la corne, l'abri du douanier. Toutes leurs portes ont perdu leur battant ou restent ouvertes ; la fiche ne donne pas de
 * fenêtres : dehors, on ne voit pas dedans, et l'on entend par les portes. Le reste est à ciel ouvert (la falaise, la
 * grève, l'épave : on voit par-dessus).
 */
export const PLAN_VUE_PHARE: PlanVue = {
  murs: mursVuePhare(),
  portes: PORTES_PHARE.map((p) => ({ id: p.id, x: p.x, z: p.z, largeur: p.largeur, sens: p.sens, entre: p.entre, toujoursOuverte: true })),
  fenetres: [],
  pieceDe: piecePhare,
  pieces: Object.keys(PIECES_PHARE),
};

// ---------- Le milieu des Éteints (comme milieu-moulin.ts) ----------

/** Au milieu d'une porte, l'Éteint vise un point un peu plus loin, de l'autre côté. */
const AU_DELA = 1.3;

/**
 * Le muret de l'enceinte (le modèle : `enceinte`, de x − 18 à 16, de z − 16 à 1,5, repère du modèle) et ses deux grilles
 * (la grille sud, arrachée, vers le chemin des douaniers ; la grille nord, vers la route) : un Éteint du dehors qui va à la
 * tour (la lumière de la lanterne, au pied de l'escalier) passe par une grille, comme par une porte (essai sur l'iPhone,
 * 2026-10-15 : les dormeurs du chemin restaient plantés contre le muret).
 */
const ENCEINTE = { x1: jeu(-18, -16).x, z1: jeu(-18, -16).z, x2: jeu(16, 1.5).x, z2: jeu(16, 1.5).z } as const;
const GRILLES: readonly PorteDuPhare[] = [
  { id: "grille_sud", ...jeu(2.3, 1.5), largeur: 2.5, sens: "x", entre: ["dehors", "dehors"] },
  { id: "grille_nord", ...jeu(-1.5, -16), largeur: 2.9, sens: "x", entre: ["dehors", "dehors"] },
];
/** Ce point du jeu est-il dans l'enceinte (la tour, les maisons, la cour) ? */
export function dansEnceinte(x: number, z: number): boolean {
  return x > ENCEINTE.x1 && x < ENCEINTE.x2 && z > ENCEINTE.z1 && z < ENCEINTE.z2;
}

/** Le segment de (ax, az) à (bx, bz) traverse-t-il l'enceinte (un peu élargie : l'épaisseur du muret, celle de l'Éteint) ? */
function coupeLeMuret(ax: number, az: number, bx: number, bz: number): boolean {
  const m = 0.6;
  for (let i = 1; i < 24; i++) {
    const t = i / 24;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    if (x > ENCEINTE.x1 - m && x < ENCEINTE.x2 + m && z > ENCEINTE.z1 - m && z < ENCEINTE.z2 + m) return true;
  }
  return false;
}

/** L'angle de l'enceinte (à 1,4 m dehors) par où contourner le muret pour aller de (ax, az) à `vers`, le plus court. */
function angleVers(ax: number, az: number, vers: { x: number; z: number }): { x: number; z: number } {
  const d = 1.4;
  const angles = [
    { x: ENCEINTE.x1 - d, z: ENCEINTE.z1 - d },
    { x: ENCEINTE.x2 + d, z: ENCEINTE.z1 - d },
    { x: ENCEINTE.x1 - d, z: ENCEINTE.z2 + d },
    { x: ENCEINTE.x2 + d, z: ENCEINTE.z2 + d },
  ].filter((c) => !coupeLeMuret(ax, az, c.x, c.z));
  const cout = (c: { x: number; z: number }) => Math.hypot(c.x - ax, c.z - az) + Math.hypot(vers.x - c.x, vers.z - c.z);
  return angles.sort((u, v) => cout(u) - cout(v))[0] ?? vers;
}

/** Le prochain point pour franchir l'ouverture `p` (porte ou grille, de sens « x » ou « z »), venant de (ax, az). */
function franchir(p: PorteDuPhare, ax: number, az: number, cible: { x: number; z: number }): { x: number; z: number } {
  const versLa = p.sens === "x" ? { x: 0, z: Math.sign(cible.z - p.z) || 1 } : { x: Math.sign(cible.x - p.x) || 1, z: 0 };
  if (Math.hypot(p.x - ax, p.z - az) < 0.9) return { x: p.x + versLa.x * AU_DELA, z: p.z + versLa.z * AU_DELA };
  // On s'aligne d'abord sur l'axe de l'ouverture (pour ne pas frotter le chambranle, le pilier), puis on entre.
  const recul = p.sens === "x" ? { x: p.x, z: p.z - versLa.z * 0.8 } : { x: p.x - versLa.x * 0.8, z: p.z };
  const aligne = p.sens === "x" ? Math.abs(ax - p.x) < p.largeur / 2 - 0.35 : Math.abs(az - p.z) < p.largeur / 2 - 0.35;
  return aligne ? { x: p.x + versLa.x * AU_DELA, z: p.z + versLa.z * AU_DELA } : recul;
}

/** Le milieu du phare : les portes ne se ferment pas, il ne dépend pas de l'état du lieu. */
export const MILIEU_PHARE: Milieu = (() => {
  const ov = obstaclesVue(PLAN_VUE_PHARE, {});
  const pieces = Object.keys(PIECES_PHARE);
  // Le chemin le plus court (en nombre de portes) d'une pièce à une autre : la première porte à prendre.
  const premiere = new Map<string, PorteDuPhare | null>();
  for (const a of pieces) {
    const venu = new Map<string, PorteDuPhare | null>([[a, null]]);
    const file = [a];
    while (file.length) {
      const ici = file.shift()!;
      for (const p of PORTES_PHARE) {
        if (!p.entre.includes(ici)) continue;
        const la = p.entre[0] === ici ? p.entre[1] : p.entre[0];
        if (venu.has(la)) continue;
        venu.set(la, venu.get(ici) ?? p);
        file.push(la);
      }
    }
    for (const [b, p] of venu) premiere.set(`${a}>${b}`, p);
  }
  return {
    son: (ax, az, bx, bz) => facteurSon(PLAN_VUE_PHARE, {}, piecePhare(ax, az), piecePhare(bx, bz)),
    vue: (ax, az, bx, bz) => voit(ov, ax, az, bx, bz),
    obscur: sombrePhare,
    passage(ax, az, bx, bz) {
      const pa = piecePhare(ax, az);
      const pb = piecePhare(bx, bz);
      // Dehors, d'un côté du muret à l'autre : par la grille la plus courte.
      if (pa === "dehors" && dansEnceinte(ax, az) !== dansEnceinte(bx, bz)) {
        const g = [...GRILLES].sort((u, v) => Math.hypot(u.x - ax, u.z - az) + Math.hypot(u.x - bx, u.z - bz) - Math.hypot(v.x - ax, v.z - az) - Math.hypot(v.x - bx, v.z - bz))[0]!;
        const cible = { x: g.x, z: g.z + (dansEnceinte(bx, bz) === dansEnceinte(g.x, g.z - 1) ? -1 : 1) };
        // Dehors, le muret entre nous et la grille (pas encore devant elle) : on le contourne par un angle.
        if (!dansEnceinte(ax, az) && Math.hypot(g.x - ax, g.z - az) > 2) {
          const devant = { x: g.x, z: g.z - (cible.z - g.z) * 0.8 };
          if (coupeLeMuret(ax, az, devant.x, devant.z)) return angleVers(ax, az, devant);
        }
        return franchir(g, ax, az, cible);
      }
      if (pa === pb) return { x: bx, z: bz };
      const p = premiere.get(`${pa}>${pb}`);
      if (!p) return { x: bx, z: bz };
      // La porte à prendre : on la franchit vers la pièce d'à côté (son centre ; vers le dehors : loin du centre de la
      // nôtre). Pas d'après notre côté de la porte : la pièce déborde un peu le seuil, on y oscillerait.
      const la = p.entre[0] === pa ? p.entre[1] : p.entre[0];
      const centre = (piece: string) => PIECES_PHARE[piece]?.boites[0];
      const c = centre(la);
      const ici = centre(pa);
      const cible = c ? { x: c.x, z: c.z } : ici ? { x: 2 * p.x - ici.x, z: 2 * p.z - ici.z } : { x: bx, z: bz };
      return franchir(p, ax, az, cible);
    },
  };
})();

// ---------- Les Éteints (FICHE.eteints) ----------

/**
 * Les places de la fiche (S-06 ; le modèle en donne 14) : le dernier gardien dans la cuisine, le rampant sous le canot, les
 * neuf dormeurs couchés le long du chemin des douaniers (la lanterne les réveille, S-15), les trois Noyés au bord de l'eau
 * de la crique. Leur numéro : leur rang dans la fiche (1 à 14).
 */
export const PLACES_ETEINTS_PHARE: readonly PlaceEteint[] = ETEINTS_MODELE.map((e, i) => {
  const type = e.type ?? "";
  const p: PlaceEteint = { n: i + 1, x: e.x, z: e.z, o: (i * 1.7) % (Math.PI * 2) };
  if (type.startsWith("dormeur")) p.etat = "dormant";
  if (type.startsWith("rampant")) p.variante = "rampant";
  if (type.startsWith("Noyé")) p.variante = "noye";
  return p;
});

/**
 * Une place de la fiche qui touche un obstacle du plan (le dormeur couché contre le mur du hangar) : le point libre le plus
 * proche, par cercles de 25 cm (dans le repère du jeu).
 */
function placeLibre(x: number, z: number): { x: number; z: number } {
  const zone = zonePhare({});
  if (!heurte(zone, x, z, 0.35)) return { x, z };
  for (let r = 0.25; r <= 2; r += 0.25) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      if (!heurte(zone, px, pz, 0.35)) return { x: px, z: pz };
    }
  }
  return { x, z };
}

/** Les Éteints du phare, au calme : chacun chez lui. */
export function eteintsPhare(): Eteint[] {
  return eteintsDePlaces(PLACES_ETEINTS_PHARE, (x, z) => {
    const j = jeu(x, z);
    return placeLibre(j.x, j.z);
  });
}

// ---------- Ceux qui arrivent de la lande à l'allumage (décision du porteur, 2026-10-15) ----------

/**
 * Quand on allume la lanterne, on a d'ordinaire déjà tué les Éteints du lieu : la lumière en fait venir 2 ou 3 de la lande,
 * des Errants ordinaires, déjà réveillés. Ils paraissent au bord du lot, côté lande (là où passe le muret de pierres
 * sèches, qui n'arrête personne), hors de la vue du joueur, et marchent vers lui. Ils ne sont pas gardés en base (leur
 * numéro n'est pas dans la fiche) : ils disparaissent au retour du lieu à 24 h.
 */
export const LANDE = { nombre: [2, 3], premierNumero: 101, distanceMin: 18, loinDeLaVue: 30 } as const;

/**
 * Les bords du lot où ils paraissent (repère du jeu) : à l'est et à l'ouest, à hauteur de la grille sud de l'enceinte. La
 * porte de la tour donne au sud, et la tour touche les maisons des gardiens : de là, le milieu du phare les mène à peu
 * près en ligne droite par la grille sud jusqu'à la porte (40 à 45 m, moins d'une minute à pas d'Éteint attiré). Du nord
 * (la route, la lande), il faudrait contourner la tour par l'étroit couloir entre elle et le muret : on n'y passe pas.
 */
const BORDS_LANDE: readonly { x: number; z: number }[] = (() => {
  const zone = zonePhare({});
  const points: { x: number; z: number }[] = [];
  for (const z of [20, 22, 24, 26]) points.push({ x: PHARE.largeur - 1.2, z });
  for (const z of [24, 26]) points.push({ x: 1.2, z });
  return points.filter((p) => !heurte(zone, p.x, p.z, 0.4));
})();

/**
 * Les arrivants de la lande : 2 ou 3 (au hasard), à des bords différents, hors de la vue du joueur (`voit` : la vue passe-t-
 * elle du joueur à ce point ? un mur l'arrête ; ou bien à 30 m, de nuit) et à 18 m au moins ; à défaut, les plus loin. Ils
 * marchent vers le joueur (`but`), l'attention au plus haut ; la lumière de la lanterne et le joueur, qu'ils perçoivent,
 * font le reste (le milieu du phare : par la grille sud et la porte de la tour).
 */
export function arrivantsDeLaLande(joueur: { x: number; z: number }, voit: (a: { x: number; z: number }, b: { x: number; z: number }) => boolean, alea: () => number): Eteint[] {
  const n = alea() < 0.5 ? LANDE.nombre[0] : LANDE.nombre[1];
  const loin = (p: { x: number; z: number }) => Math.hypot(p.x - joueur.x, p.z - joueur.z);
  const caches = BORDS_LANDE.filter((p) => loin(p) >= LANDE.distanceMin && (loin(p) >= LANDE.loinDeLaVue || !voit(joueur, p)));
  // Mélangés (le même tirage que le lieu), puis espacés : pas deux arrivants l'un sur l'autre.
  const ordre = (caches.length >= n ? caches : [...BORDS_LANDE].sort((a, b) => loin(b) - loin(a))).map((p) => ({ p, k: alea() })).sort((a, b) => a.k - b.k).map((c) => c.p);
  const choisis: { x: number; z: number }[] = [];
  for (const p of ordre) if (choisis.length < n && choisis.every((c) => Math.hypot(c.x - p.x, c.z - p.z) >= 4)) choisis.push(p);
  for (const p of ordre) if (choisis.length < n && !choisis.includes(p)) choisis.push(p);
  return choisis.map((p, i) => {
    const e = nouvelEteint(LANDE.premierNumero + i, p.x, p.z, "attire", Math.atan2(joueur.x - p.x, joueur.z - p.z));
    e.attention = ATTENTION_MAX;
    e.but = { x: joueur.x, z: joueur.z };
    e.sansVoir = 0;
    return e;
  });
}

// ---------- Le butin (S-03 : une place fixe pour chaque objet-clé) ----------

/** Version du contenu du phare (points de butin, Éteints) : la changer régénère les phares. */
export const VERSION_PHARE = 1;

/**
 * Les points de butin, posés sur le décor du modèle (sa fiche : `fouille`) : le harpon sur la cuisinière, le compresseur de
 * la corne ; dans l'épave (seulement l'épave échouée), la cloche sur la proue, la porte de four et le soufflet dans le
 * conteneur de la Livraison du Jour, le jerrican dans celui des provisions du bord, le rabot dans celui d'outillage, sur le
 * pont ; puis le butin commun, et les fouilles ajoutées par le chantier V3.
 */
export function butinPhare(): Omit<RessourceSol, "disponible">[] {
  const points: [TypeRessourcePhare, number, number][] = [
    ["phare_harpon", -4.8, -7.6],
    ["phare_compresseur", 17.4, 7.8],
    ["phare_cloche", -5.1, 17.6],
    ["phare_porte_four", -18.0, 17.2],
    ["phare_soufflet", -19.6, 18.2],
    ["phare_jerrican", -10.4, 17.3],
    ["phare_rabot", -2.5, 21.6],
    ["phare_vaisselier", 0, -10.0],
    ["phare_chambre", 3, -9.4],
    ["phare_machines", 9.8, -7.4],
    ["phare_hangar", -26.8, 6],
    ["phare_greve", -27.6, 18.6],
    // Chantier V3 : une fouille dans chaque bâtiment qui n'en avait pas, et dans chaque conteneur de l'épave (à l'écart de
    // l'objet-clé qu'il garde). À la fin : la base ajoute les points nouveaux sans toucher au butin déjà pris.
    ["phare_tour", -12, -8.2],
    ["phare_corne", 16.2, 5.2],
    ["phare_abri", -24, -7],
    ["phare_livraison", -21.2, 17.8],
    ["phare_provisions", -12.4, 17.9],
    ["phare_outillage", -3.2, 20.6],
  ];
  return points.map(([type, x, z], i) => ({ id: i + 1, type, ...jeu(x, z) }));
}
