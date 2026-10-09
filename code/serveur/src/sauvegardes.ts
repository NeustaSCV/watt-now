// Les sauvegardes de la base (Book 17 §5.4) : une par jour, gardées 7 jours, et une par semaine, gardées 4 semaines.
// Le serveur s'en charge lui-même (pas de tâche planifiée à installer sur le Pi). Le dossier peut être un disque
// externe (variable WATT_SAUVEGARDES). Depuis la 0.7, la copie hors de la carte SD se fait sur la clé USB du Pi
// (variable WATT_CLE_USB, voir cle-sauvegardes.ts) : chaque vérification y recopie ce qui manque, sans bloquer le jeu.

import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Base } from "./base.ts";
import { CleSauvegardes, type EtatCle } from "./cle-sauvegardes.ts";
import { journal } from "./journal.ts";

const GARDER_QUOTIDIENNES = 7;
const GARDER_HEBDOMADAIRES = 4;
/** On vérifie toutes les heures s'il faut faire la sauvegarde du jour. */
const INTERVALLE_VERIFICATION = 3_600_000;

function jourIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Semaine ISO, « 2026-S41 ». */
function semaineIso(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const jour = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - jour);
  const debut = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const n = Math.ceil(((t.getTime() - debut.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-S${String(n).padStart(2, "0")}`;
}

/** Les noms des sauvegardes à faire aujourd'hui. */
export function nomsDuJour(d: Date): { quotidienne: string; hebdomadaire: string } {
  return { quotidienne: `quotidienne-${jourIso(d)}.sqlite`, hebdomadaire: `hebdomadaire-${semaineIso(d)}.sqlite` };
}

/** Les fichiers à supprimer pour ne garder que les plus récents de chaque sorte (les noms se trient par date). */
export function aSupprimer(fichiers: readonly string[]): string[] {
  const trier = (prefixe: string) => fichiers.filter((f) => f.startsWith(prefixe) && f.endsWith(".sqlite")).sort().reverse();
  return [...trier("quotidienne-").slice(GARDER_QUOTIDIENNES), ...trier("hebdomadaire-").slice(GARDER_HEBDOMADAIRES)];
}

export class Sauvegardes {
  private readonly base: Base;
  private readonly dossier: string;
  /** La copie sur la clé USB (absente : pas de clé configurée, comme en local). */
  readonly cle: CleSauvegardes | null;
  private minuterie: NodeJS.Timeout | undefined;

  constructor(base: Base, dossier: string, cle?: { dossier: string; reglages?: string; certificat?: string }) {
    this.base = base;
    this.dossier = dossier;
    this.cle = cle ? new CleSauvegardes(cle.dossier, { sauvegardes: dossier, reglages: cle.reglages, certificat: cle.certificat }) : null;
  }

  demarrer(): void {
    void this.verifier();
    this.minuterie = setInterval(() => void this.verifier(), INTERVALLE_VERIFICATION);
  }

  arreter(): void {
    clearInterval(this.minuterie);
  }

  /**
   * Fait la sauvegarde du jour (et de la semaine) si elle manque, puis fait le ménage. La sauvegarde elle-même est
   * immédiate (≈ 20 ms) ; la copie sur la clé suit en arrière-plan : la promesse rendue ne sert qu'à l'attendre (tests).
   */
  verifier(maintenant = new Date()): Promise<EtatCle | null> {
    let nouvelle = false;
    try {
      mkdirSync(this.dossier, { recursive: true });
      const { quotidienne, hebdomadaire } = nomsDuJour(maintenant);
      for (const nom of [quotidienne, hebdomadaire]) {
        const chemin = join(this.dossier, nom);
        if (existsSync(chemin)) continue;
        const debut = performance.now();
        this.base.sauvegarderVers(chemin);
        nouvelle = true;
        journal(`Sauvegarde : ${nom} (${Math.round(performance.now() - debut)} ms)`);
      }
      for (const f of aSupprimer(readdirSync(this.dossier))) rmSync(join(this.dossier, f));
    } catch (erreur) {
      journal(`Sauvegarde impossible : ${String(erreur)}`);
    }
    return this.cle ? this.cle.synchroniser(nouvelle, maintenant.getTime()) : Promise.resolve(null);
  }
}
