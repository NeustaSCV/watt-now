// Le carnet note les idées dévoilées (0.7, chantier 6 ; Book 03 §5.5, proposition « arbre de progression » §4.4) :
// une ligne discrète en bas du carnet, « Dernière idée : Tresser une corde ». Le feu et l'abri du départ ne comptent
// pas : ce ne sont pas des idées venues en chemin.

import { devoileesAuDepart, nomDevoile } from "../../commun/src/progression.ts";

const DEPART = new Set(devoileesAuDepart());

/** La dernière idée venue (et combien d'autres sont venues avec elle) ; null : pas encore d'idée en chemin. */
export interface DerniereIdee {
  id: string;
  /** Les autres idées venues au même moment. */
  avec: number;
}

/**
 * La dernière idée : celle du dernier dévoilement s'il y en a un (`nouvelles`), sinon la dernière de la liste gardée
 * par le serveur (dans l'ordre où elles sont venues).
 */
export function derniereIdee(devoilees: readonly string[], nouvelles: readonly string[] = []): DerniereIdee | null {
  const lot = nouvelles.filter((id) => !DEPART.has(id));
  if (lot.length > 0) return { id: lot[lot.length - 1]!, avec: lot.length - 1 };
  for (let i = devoilees.length - 1; i >= 0; i--) if (!DEPART.has(devoilees[i]!)) return { id: devoilees[i]!, avec: 0 };
  return null;
}

/** Le texte de la ligne : « Dernière idée : Tresser une corde (+2) ». */
export function texteDerniereIdee(d: DerniereIdee): string {
  const nom = nomDevoile(d.id);
  return `Dernière idée : ${nom.charAt(0).toUpperCase()}${nom.slice(1)}${d.avec > 0 ? ` (+${d.avec})` : ""}`;
}

/** La ligne du carnet, en HTML (vide s'il n'y a pas encore d'idée). */
export function ligneDerniereIdee(d: DerniereIdee | null): string {
  if (!d) return "";
  return `<p class="derniere-idee" title="Les idées nouvelles t'attendent dans Fabriquer.">💡 ${texteDerniereIdee(d)}</p>`;
}
