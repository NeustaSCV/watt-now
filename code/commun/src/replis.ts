// Les façons de franchir un niveau (plan 0.8 §2.1 et §2.2, chantier 5) : avec sa clé, ou par l'un de ses replis. Un repli
// remplace l'objet clé par d'autres objets (deux barres au lieu du grillage, une casserole au lieu de la cocotte), demande
// parfois un meilleur outil (Marteler 2) et prend plus de temps. Le serveur prend la première façon possible ; la fiche
// montre la façon avec la clé, puis la phrase de chaque repli.
//
// Les données sont dans `Etape.cle.replis` (lignees.ts) : ce module ne fait que les déplier, pour toutes les lignées.

import type { Inventaire, TypeObjet } from "./objets.ts";
import { multiplicateurQualites, type Qualite } from "./recettes.ts";
import { choisirCout, type CleEvolution, type RepliCle } from "./lignees.ts";
import type { Famille } from "./regles.ts";

/** Ce qu'on donne à `faconsEtape` : une étape de lignée, ou un accessoire. */
export interface EtapeAFranchir {
  couts: readonly Inventaire[];
  qualites: Partial<Record<Qualite, number>>;
  duree: number;
  famille?: Famille;
  cle?: CleEvolution;
}

/** Une façon de franchir le niveau : ses coûts (au choix), ses outils, sa durée ; le repli d'où elle vient, s'il y en a un. */
export interface Facon {
  couts: Inventaire[];
  qualites: Partial<Record<Qualite, number>>;
  duree: number;
  repli?: RepliCle;
}

/** Les outils de deux listes, au plus haut niveau demandé par l'une ou l'autre. */
function outilsLesPlusHauts(a: Partial<Record<Qualite, number>>, b: Partial<Record<Qualite, number>> = {}): Partial<Record<Qualite, number>> {
  const r: Partial<Record<Qualite, number>> = { ...a };
  for (const [q, n] of Object.entries(b) as [Qualite, number][]) r[q] = Math.max(r[q] ?? 0, n);
  return r;
}

/** Un coût sans l'objet clé, avec ce que le repli met à sa place. */
function sansLaCle(cout: Inventaire, objet: TypeObjet | undefined, aLaPlace: Inventaire = {}): Inventaire {
  const r: Inventaire = { ...cout };
  if (objet) delete r[objet];
  for (const [t, n] of Object.entries(aLaPlace) as [TypeObjet, number][]) r[t] = (r[t] ?? 0) + n;
  return r;
}

/** Les façons de franchir l'étape : d'abord avec la clé, puis chaque repli, dans l'ordre. */
export function faconsEtape(e: EtapeAFranchir): Facon[] {
  const avecLaCle: Facon = { couts: [...e.couts], qualites: e.qualites, duree: e.duree };
  const replis = e.cle?.replis ?? [];
  return [
    avecLaCle,
    ...replis.map((repli) => ({
      couts: (e.couts.length ? e.couts : [{}]).map((c) => sansLaCle(c, e.cle?.objet, repli.couts)),
      qualites: outilsLesPlusHauts(e.qualites, repli.qualites),
      duree: e.duree * (repli.dureeFois ?? 1),
      repli,
    })),
  ];
}

/** Ce qu'on retient d'une façon pour la faire : le coût choisi, et le facteur de temps des outils (null : il en manque). */
export interface FaconChoisie {
  facon: Facon;
  cout: Inventaire;
  payable: boolean;
  outils: number | null;
}

/**
 * La première façon qu'on peut faire (de quoi payer et les outils), sinon la façon avec la clé, pour dire ce qui manque.
 * `outils` juge les qualités (le serveur peut y ajouter les outils rangés à côté) ; par défaut, le sac seul.
 */
export function choisirFacon(
  inventaire: Inventaire,
  e: EtapeAFranchir,
  famille: Famille,
  outils: (q: Partial<Record<Qualite, number>>) => number | null = (q) => multiplicateurQualites(inventaire, q),
): FaconChoisie {
  const essais = faconsEtape(e).map((facon) => {
    const { cout, payable } = choisirCout(inventaire, facon.couts, e, famille);
    return { facon, cout, payable, outils: outils(facon.qualites) };
  });
  return essais.find((x) => x.payable && x.outils !== null) ?? essais[0]!;
}
