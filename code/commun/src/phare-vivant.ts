// Le phare du cap vivant (plan 0.10, chantier K) : ce qui arrête la vue (la vue par pièce), ce que perçoivent les Éteints
// (le milieu), les Éteints placés par la fiche du modèle, et les points de butin. À part du plan (phare.ts), comme le
// Moulin (vue-lieux.ts, milieu-moulin.ts, eteints-moulin.ts) : le plan sert aux lieux, et ceci dépend des lieux.

import { eteintsDePlaces, type Eteint, type Milieu, type PlaceEteint } from "./eteints.ts";
import { ETEINTS_MODELE } from "./phare-modele.ts";
import { heurte } from "./lieux.ts";
import { PIECES_PHARE, PORTES_PHARE, jeu, mursVuePhare, piecePhare, sombrePhare, zonePhare, type PorteDuPhare } from "./phare.ts";
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
      if (pa === pb) return { x: bx, z: bz };
      const p = premiere.get(`${pa}>${pb}`);
      if (!p) return { x: bx, z: bz };
      const versLa = p.sens === "x" ? { x: 0, z: Math.sign(p.z - az) || 1 } : { x: Math.sign(p.x - ax) || 1, z: 0 };
      if (Math.hypot(p.x - ax, p.z - az) < 0.9) return { x: p.x + versLa.x * AU_DELA, z: p.z + versLa.z * AU_DELA };
      // On s'aligne d'abord sur l'axe de la porte (pour ne pas frotter le chambranle), puis on entre.
      const recul = p.sens === "x" ? { x: p.x, z: p.z - versLa.z * 0.8 } : { x: p.x - versLa.x * 0.8, z: p.z };
      const aligne = p.sens === "x" ? Math.abs(ax - p.x) < p.largeur / 2 - 0.35 : Math.abs(az - p.z) < p.largeur / 2 - 0.35;
      return aligne ? { x: p.x + versLa.x * AU_DELA, z: p.z + versLa.z * AU_DELA } : recul;
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

// ---------- Le butin (S-03 : une place fixe pour chaque objet-clé) ----------

/** Version du contenu du phare (points de butin, Éteints) : la changer régénère les phares. */
export const VERSION_PHARE = 1;

/**
 * Les points de butin, posés sur le décor du modèle (sa fiche : `fouille`) : le harpon sur la cuisinière, le compresseur de
 * la corne ; dans l'épave (seulement l'épave échouée), la cloche sur la proue, la porte de four et le soufflet dans le
 * conteneur de la Livraison du Jour, le jerrican dans celui des provisions du bord, le rabot dans celui d'outillage, sur le
 * pont ; puis le butin commun.
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
  ];
  return points.map(([type, x, z], i) => ({ id: i + 1, type, ...jeu(x, z) }));
}
