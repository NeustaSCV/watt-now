// Le contenu de la corniche du Cap Rouge (plan 0.10, chantier I ; la géographie : corniche.ts) : ses Éteints, ses
// ressources, son butin, son semis. Le serveur le lit par le registre des lieux (contenu-lieux.ts) ; le client n'en a
// pas besoin.
//
// - **Le pin tombé** (N2-29, S-21) : le tas de bois personnel de la corniche, comme celui de la station : 10 bûches à
//   chacun, qui reviennent pour lui 6 h après sa première bûche (les mêmes réglages à chaud : `tas_bois_buches`,
//   `tas_bois_retour_h`). Deux joueurs ont chacun le leur.
// - **La pierre et le bois** (N2-55, le thème « pierre, terre, bois » de H2B, **pas de glaise**) : les pierres en vrac au
//   pied de l'éboulement et des murets écroulés ; les bûches et les branches sous les pins (parasols et pins d'Alep) et
//   sur les bas-côtés. Elles reviennent en 30 min, ailleurs dans leur étendue, et grandissent avec les voyageurs (B8),
//   comme au gué. **Les quantités sont une proposition du chantier I, à valider par le porteur** (SEMIS_CORNICHE).
// - **Les fouilles** : celles de la fiche du modèle (la station, l'abri du cantonnier, les épaves, le camp des pillards,
//   les trois chambres du Panoramique, sa cuisine, la villa, le cabanon du pêcheur), chacune avec la table qui lui
//   ressemble (vestiges.ts, LIEU_DE_FOUILLE) ; les chambres : des chiffons, et le fil dentaire courant (N2-61).
// - **Les Éteints** : ceux de la fiche du modèle (S-06 : ≈ 12 pour une halte), sauf l'Errant posé à la sortie vers le
//   phare (on y arrive : il serait à un mètre de l'arrivée) ; celui de l'entrée, reculé de 12 m sur la route.

import { aLaCorniche, accessibleCorniche, dansUnePiece, surLaChaussee, PIN_TOMBE, SORTIES_CORNICHE } from "./corniche.ts";
import { ETEINTS_CORNICHE, FOUILLE_CORNICHE } from "./corniche-modele.ts";
import { eteintsDePlaces, type Eteint, type PlaceEteint } from "./eteints.ts";
import { REGLAGES } from "./reglages.ts";
import { placeLibre, type Etendue, type LigneSemis, type SemisLieu, type SemisVivant } from "./semis.ts";
import { VRAC_MAX, aleatoire, type ButinLieu, type RessourceSol, type TypeRessource } from "./terrain.ts";

/** À augmenter quand le contenu de la corniche change : la base le régénère alors. */
export const VERSION_CORNICHE = 1;

type Ressources = Omit<RessourceSol, "disponible">[];

const MIN = 60_000;

// ---------- Le semis : la pierre et le bois ----------

/**
 * **La table du semis de la corniche** (le format de semis.ts : une ligne par sorte et par étendue). Proposition du
 * chantier I, **à valider par le porteur** : plus de pierres qu'à la station (13) et qu'au gué (21 avec le banc), du bois
 * comme à la station (12 bûches) avec le pin tombé en plus ; pas de glaise (elle est au gué, sur la même route B).
 */
export const SEMIS_CORNICHE: SemisLieu = {
  vrac: { pierre: true, buche: true, branche: true },
  repousse: { pierre: 30 * MIN, buche: 30 * MIN, branche: 30 * MIN },
  lignes: {
    // Les blocs tombés de la paroi, aux deux bouts de l'éboulement (C3 du modèle).
    pierres_eboulement: { type: "pierre", n: 10, ou: "eboulement", ecart: 0.9, ailleurs: true },
    // Les pierres taillées des murets écroulés du parapet (C3 du modèle).
    pierres_murets: { type: "pierre", n: 10, ou: "murets", ecart: 0.9, ailleurs: true },
    // Le bois mort sous les pins parasols et les pins d'Alep.
    buches_pins: { type: "buche", n: 8, ou: "pins", ecart: 1.5, ailleurs: true },
    branches_pins: { type: "branche", n: 10, ou: "pins", ecart: 1.5, ailleurs: true },
    // Des branches cassées par le vent sur les bas-côtés.
    branches_bas_cotes: { type: "branche", n: 8, ou: "bas_cotes", ecart: 2, ailleurs: true },
  },
};

/** Les points du modèle d'où les pierres en vrac sont tirées (la fiche : « vrac de pierres ») ; ceux de l'éboulement, à l'est. */
const VRAC_PIERRES = FOUILLE_CORNICHE.filter((f) => f.quoi === "vrac de pierres").map((f) => ({ ...aLaCorniche(f.x, f.z), eboulement: f.x > 50 }));

/** Les pins du modèle (repère du modèle) : les pins parasols, et les pins d'Alep au bout de l'éperon du tunnel. */
const PINS = ([[-87.6, -2.6], [-19.4, 14.2], [18.6, -9.6], [-0.2, -9.2], [48.6, -19.4], [97.4, -5.2], [-44, 5], [-36, 7.5], [-32, 1]] as const).map(([x, z]) => aLaCorniche(x, z));

/** Libre pour le semis : là où l'on marche, hors de la chaussée, des pièces et du pied des sorties. */
function libre(x: number, z: number, horsChaussee = true): boolean {
  if (!accessibleCorniche(x, z) || dansUnePiece(x, z, 0.6)) return false;
  if (horsChaussee && surLaChaussee(x, z, 0.3)) return false;
  return SORTIES_CORNICHE.every((s) => Math.hypot(s.arrivee.x - x, s.arrivee.z - z) > 5);
}

/** Un point au hasard dans un disque. */
function autour(c: { x: number; z: number }, r: number, a: () => number): { x: number; z: number } {
  const t = a() * Math.PI * 2;
  const d = Math.sqrt(a()) * r;
  return { x: c.x + Math.cos(t) * d, z: c.z + Math.sin(t) * d };
}

/** Les étendues de la corniche (semis.ts : où une ligne se tire, et ce qui y est libre). */
export const ETENDUES_CORNICHE: Readonly<Record<"eboulement" | "murets" | "pins" | "bas_cotes", Etendue>> = {
  // Les éboulis peuvent déborder sur la chaussée (les blocs y ont roulé) ; le reste est hors de la route.
  eboulement: { tirer: (a) => autour(VRAC_PIERRES.filter((p) => p.eboulement)[Math.floor(a() * 2)]!, 3, a), libre: (x, z) => libre(x, z, false) },
  murets: { tirer: (a) => autour(VRAC_PIERRES.filter((p) => !p.eboulement)[Math.floor(a() * 4)]!, 3, a), libre: (x, z) => libre(x, z, false) },
  pins: { tirer: (a) => autour(PINS[Math.floor(a() * PINS.length)]!, 5, a), libre: (x, z) => libre(x, z) },
  bas_cotes: { tirer: (a) => ({ x: 6 + a() * 188, z: 6 + a() * 58 }), libre: (x, z) => libre(x, z) },
};

// ---------- Les ressources ----------

/** Les fouilles de la corniche, aux points de la fiche du modèle. */
const FOUILLES: readonly [TypeRessource, number, number][] = [
  ["corniche_boutique", -83.5, -12.4],
  ["corniche_cantonnier", -61.3, -9.2],
  ["corniche_epave", -40, 2.2],
  ["corniche_camp", -21.2, -3.2],
  // Les trois chambres du Panoramique : leur lavabo et leur trousse de toilette (N2-61).
  ["corniche_chambre", 4.6, 7.6],
  ["corniche_chambre", 7.6, 7.6],
  ["corniche_chambre", 10.6, 7.6],
  ["corniche_cuisine", 25.5, 8.4],
  ["corniche_villa", 37.5, -16.5],
  ["corniche_epave", 81, -1.4],
  ["corniche_cabanon", 87, 8.6],
];

/** Ce que la corniche a semé : pour chaque point, sa ligne et sa tournée de vrac. */
type Semes = Map<number, { ligne: string; tour: number }>;

let deja: { cle: string; ressources: Ressources; semes: Semes } | null = null;

/**
 * Tout le contenu de la corniche à la première visite : le pin tombé, les fouilles, puis le semis (VRAC_MAX tournées
 * pour le vrac), tiré dans ses étendues. Le même pour une même table (on le garde).
 */
export function semerCorniche(): { ressources: Ressources; semes: Semes } {
  const cle = JSON.stringify(SEMIS_CORNICHE);
  if (deja?.cle === cle) return deja;
  const ressources: Ressources = [{ id: 1, type: "pin_tombe", ...PIN_TOMBE }];
  for (const [type, x, z] of FOUILLES) ressources.push({ id: ressources.length + 1, type, ...aLaCorniche(x, z) });
  const semes: Semes = new Map();
  const alea = aleatoire(9203);
  for (const [nom, ligne] of Object.entries(SEMIS_CORNICHE.lignes)) {
    const tours = SEMIS_CORNICHE.vrac[ligne.type] ? VRAC_MAX : 1;
    for (let tour = 0; tour < tours; tour++) {
      for (let i = 0; i < ligne.n; i++) {
        const p = placeLibre(ETENDUES_CORNICHE[ligne.ou as keyof typeof ETENDUES_CORNICHE], alea, ressources, ligne.ecart);
        if (!p) continue;
        const id = ressources.length + 1;
        ressources.push({ id, type: ligne.type, ...p });
        semes.set(id, { ligne: nom, tour });
      }
    }
  }
  deja = { cle, ressources, semes };
  return deja;
}

/** Les ressources de la corniche à la première visite (la `ressources` du contenu du lieu). */
export function ressourcesCorniche(): Ressources {
  return semerCorniche().ressources.map((r) => ({ ...r }));
}

/** Ce que le lieu vivant sait du semis : la tournée de chaque point, et où revient un point pris (M5). */
export const SEMIS_VIVANT_CORNICHE: SemisVivant = {
  tournee: (id) => semerCorniche().semes.get(id)?.tour ?? 0,
  ailleurs: (r, alea, occupees) => {
    const seme = semerCorniche().semes.get(r.id);
    const ligne: LigneSemis | undefined = seme ? SEMIS_CORNICHE.lignes[seme.ligne] : undefined;
    if (!ligne?.ailleurs) return null;
    return placeLibre(ETENDUES_CORNICHE[ligne.ou as keyof typeof ETENDUES_CORNICHE], alea, [...occupees].filter((o) => o !== r), ligne.ecart);
  },
};

/** Le vrac de la corniche pour un voyageur seul (B8) : la somme de ses lignes, par type en vrac. */
function vracCorniche(): Partial<Record<TypeRessource, number>> {
  const vrac: Partial<Record<TypeRessource, number>> = {};
  for (const l of Object.values(SEMIS_CORNICHE.lignes)) if (SEMIS_CORNICHE.vrac[l.type]) vrac[l.type] = (vrac[l.type] ?? 0) + l.n;
  return vrac;
}

/**
 * Le butin de la corniche (le moteur : serveur/src/lieu-vivant.ts) : la pierre et le bois reviennent en 30 min et
 * grandissent avec les voyageurs ; le pin tombé est à chacun, 10 bûches qui reviennent en 6 h (S-21 : les réglages du
 * tas de bois de la station, lus à chaque usage).
 */
export const BUTIN_CORNICHE: ButinLieu = {
  repousse: {
    ...SEMIS_CORNICHE.repousse,
    get pin_tombe() {
      return REGLAGES.tas_bois_retour_h * 3_600_000;
    },
  },
  vrac: vracCorniche(),
  personnel: {
    get pin_tombe() {
      return REGLAGES.tas_bois_buches;
    },
  },
};

// ---------- Les Éteints ----------

/** L'Errant que la fiche pose à la sortie vers le phare (x = 95 du modèle) : on arrive là, il n'y est pas. */
const A_LA_SORTIE = (p: { x: number }) => p.x > 93;
/**
 * L'Errant de l'entrée (x = −90 du modèle) serait à 6 m de l'arrivée depuis le terrain : il saisissait le voyageur à
 * peine arrivé. On le recule de 12 m sur la route (on arrive libre, comme ailleurs).
 */
const A_L_ENTREE = (p: { x: number; z: number }) => (p.x < -85 ? { x: p.x + 12, z: p.z - 0.8 } : p);

/**
 * Les Éteints de la corniche, d'après la fiche du modèle : les Errants errent ; les anciens habitants (le pompiste, le
 * serveur, la vacancière) et le putréfié de la cuisine dorment à leur place ; les Rampants (le tunnel, la crique) aussi.
 */
export function eteintsCorniche(): Eteint[] {
  const places: PlaceEteint[] = ETEINTS_CORNICHE.filter((p) => !A_LA_SORTIE(p)).map((p, i) => {
    const type = p.type ?? "errant";
    const base = { n: i + 1, ...A_L_ENTREE(p), o: (i * 1.7) % (Math.PI * 2) };
    if (type.startsWith("rampant")) return { ...base, etat: "dormant", variante: "rampant" };
    if (type.startsWith("errant")) return { ...base, etat: "errant" };
    return { ...base, etat: "dormant" };
  });
  return eteintsDePlaces(places, aLaCorniche);
}
