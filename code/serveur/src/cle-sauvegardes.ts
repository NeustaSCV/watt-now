// La copie des sauvegardes sur la clé USB du Pi (Book 17 §5.4, 0.7) : la copie hors de la carte SD.
// Après chaque vérification des sauvegardes, le serveur recopie sur la clé ce qui lui manque : les sauvegardes
// cohérentes déjà faites (jamais la base vivante), reglages.json et le dossier certificat/ — de quoi remonter le jeu
// sur une carte SD neuve. Rien n'est écrit si le fichier repère « .cle-watt-now » n'est pas là : clé débranchée,
// Docker monte à sa place un dossier vide de la carte SD, qu'il ne faut pas remplir.
// La clé est en FAT : pas de liens ni de droits, mais un renommage est atomique. Tout est asynchrone : la boucle de
// jeu n'attend jamais la clé (le Pi est lent, une clé USB encore plus).

import { constants } from "node:fs";
import { access, copyFile, mkdir, readdir, readFile, rename, rm, stat, statfs, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { journal } from "./journal.ts";

/** Le fichier repère : sans lui, on n'écrit rien. */
export const REPERE_CLE = ".cle-watt-now";
/** L'état de la dernière copie, gardé à côté des sauvegardes du Pi (lu par le bilan). */
export const FICHIER_ETAT_CLE = "etat-cle.json";

const GARDER_QUOTIDIENNES = 30;
const GARDER_HEBDOMADAIRES = 26;
const GARDER_MENSUELLES = 24;
const SUFFIXE_TEMPORAIRE = ".partiel";

export interface EtatCle {
  /** « ok » : copie faite (ou rien à copier) ; « absente » : pas de repère ; « pleine » ; « erreur ». */
  etat: "ok" | "absente" | "pleine" | "erreur";
  /** Quand on a vérifié (ms). */
  instant: number;
  /** La dernière copie réussie (ms), même si la vérification d'aujourd'hui a échoué. */
  derniereCopie?: number;
  /** Les fichiers copiés à cette vérification. */
  copies: string[];
  /** Les octets copiés à cette vérification. */
  octets: number;
  /** La place libre sur la clé (octets), si on a pu la lire. */
  libre?: number;
  message?: string;
}

export interface SourcesCle {
  /** Le dossier des sauvegardes du Pi (quotidienne-…, hebdomadaire-…). */
  sauvegardes: string;
  /** Le fichier des réglages (absent : on ne copie rien). */
  reglages?: string;
  /** Le dossier du certificat HTTPS (absent : on ne copie rien). */
  certificat?: string;
}

/** Le mois d'une sauvegarde quotidienne (« quotidienne-2026-10-08.sqlite » → « mensuelle-2026-10.sqlite »). */
export function nomMensuelle(quotidienne: string): string | null {
  const m = /^quotidienne-(\d{4}-\d{2})-\d{2}\.sqlite$/.exec(quotidienne);
  return m ? `mensuelle-${m[1]}.sqlite` : null;
}

/** Sur la clé, on garde plus longtemps : 30 quotidiennes, 26 hebdomadaires, 24 mensuelles (les noms se trient par date). */
export function aSupprimerSurCle(fichiers: readonly string[]): string[] {
  const trier = (prefixe: string) => fichiers.filter((f) => f.startsWith(prefixe) && f.endsWith(".sqlite")).sort().reverse();
  return [
    ...trier("quotidienne-").slice(GARDER_QUOTIDIENNES),
    ...trier("hebdomadaire-").slice(GARDER_HEBDOMADAIRES),
    ...trier("mensuelle-").slice(GARDER_MENSUELLES),
  ];
}

/** « 12,3 Mo » */
export function taille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  const unites = ["Ko", "Mo", "Go", "To"];
  let v = octets / 1024;
  let i = 0;
  while (v >= 1024 && i < unites.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${unites[i]}`;
}

async function existe(chemin: string): Promise<boolean> {
  try {
    await access(chemin, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** Copie sûre : d'abord un fichier temporaire, puis un renommage (atomique, même en FAT). Rend la taille copiée. */
async function copierSur(source: string, cible: string): Promise<number> {
  const temporaire = cible + SUFFIXE_TEMPORAIRE;
  try {
    await copyFile(source, temporaire);
    await rename(temporaire, cible);
  } catch (erreur) {
    await rm(temporaire, { force: true }).catch(() => {});
    throw erreur;
  }
  return (await stat(cible)).size;
}

/** Le fichier est-il différent sur la clé (absent, ou d'une autre taille, ou plus ancien) ? */
async function aRecopier(source: string, cible: string): Promise<boolean> {
  try {
    const [s, c] = await Promise.all([stat(source), stat(cible)]);
    // FAT n'a que 2 s de précision sur les dates : on tolère l'écart.
    return s.size !== c.size || s.mtimeMs > c.mtimeMs + 2000;
  } catch {
    return true;
  }
}

export class CleSauvegardes {
  private readonly dossierCle: string;
  private readonly sources: SourcesCle;
  private enCours: Promise<EtatCle> | null = null;
  private dernierEtatJournalise: string | null = null;
  private derniereCopie: number | undefined;

  constructor(dossierCle: string, sources: SourcesCle) {
    this.dossierCle = dossierCle;
    this.sources = sources;
  }

  /**
   * Recopie sur la clé ce qui lui manque, puis fait le ménage. Jamais deux copies à la fois ; ne lève jamais d'erreur.
   * `nouvelle` : une sauvegarde vient d'être faite (on redit alors l'alerte si la clé manque toujours).
   */
  synchroniser(nouvelle = false, maintenant = Date.now()): Promise<EtatCle> {
    if (this.enCours) return this.enCours;
    this.enCours = this.faire(nouvelle, maintenant).finally(() => {
      this.enCours = null;
    });
    return this.enCours;
  }

  private async faire(nouvelle: boolean, maintenant: number): Promise<EtatCle> {
    const etat: EtatCle = { etat: "ok", instant: maintenant, copies: [], octets: 0 };
    if (this.derniereCopie === undefined) this.derniereCopie = await this.lireDerniereCopie();
    try {
      if (!(await existe(join(this.dossierCle, REPERE_CLE)))) {
        etat.etat = "absente";
        etat.message = `pas de fichier repère ${REPERE_CLE} dans ${this.dossierCle} (clé débranchée ou pas montée) : rien n'est copié`;
      } else {
        await this.copier(etat);
      }
    } catch (erreur) {
      const code = (erreur as NodeJS.ErrnoException).code;
      etat.etat = code === "ENOSPC" ? "pleine" : "erreur";
      etat.message = code === "ENOSPC" ? "la clé est pleine" : String(erreur);
    }
    if (etat.etat !== "absente") {
      try {
        const s = await statfs(this.dossierCle);
        etat.libre = s.bavail * s.bsize;
      } catch {
        // pas grave : on ne connaîtra pas la place libre
      }
    }
    if (etat.etat === "ok" && etat.copies.length > 0) this.derniereCopie = maintenant;
    etat.derniereCopie = this.derniereCopie;
    this.journaliser(etat, nouvelle);
    await this.ecrireEtat(etat);
    return etat;
  }

  private async copier(etat: EtatCle): Promise<void> {
    const dossierSauvegardes = join(this.dossierCle, "sauvegardes");
    await mkdir(dossierSauvegardes, { recursive: true });
    const surCle = new Set(await readdir(dossierSauvegardes));
    // Les restes d'une copie interrompue (serveur arrêté, clé arrachée).
    for (const f of surCle) {
      if (f.endsWith(SUFFIXE_TEMPORAIRE)) await rm(join(dossierSauvegardes, f), { force: true });
    }
    const locales = (await readdir(this.sources.sauvegardes))
      .filter((f) => /^(quotidienne|hebdomadaire)-.+\.sqlite$/.test(f))
      .sort();
    // Les sauvegardes que la clé n'a pas encore (une clé rebranchée rattrape celles des jours manqués).
    const aCopier = locales.filter((f) => !surCle.has(f));
    for (const f of aCopier) {
      etat.octets += await copierSur(join(this.sources.sauvegardes, f), join(dossierSauvegardes, f));
      etat.copies.push(f);
      surCle.add(f);
    }
    // La mensuelle : la première quotidienne du mois arrivée sur la clé.
    const plusRecente = locales.filter((f) => f.startsWith("quotidienne-")).at(-1);
    const mensuelle = plusRecente ? nomMensuelle(plusRecente) : null;
    if (plusRecente && mensuelle && !surCle.has(mensuelle)) {
      etat.octets += await copierSur(join(this.sources.sauvegardes, plusRecente), join(dossierSauvegardes, mensuelle));
      etat.copies.push(mensuelle);
      surCle.add(mensuelle);
    }
    // De quoi remonter le jeu : les réglages et le certificat, s'ils ont changé.
    const fichiers: [string, string][] = [];
    if (this.sources.reglages && (await existe(this.sources.reglages))) {
      fichiers.push([this.sources.reglages, join(this.dossierCle, "reglages.json")]);
    }
    if (this.sources.certificat && (await existe(this.sources.certificat))) {
      const dossierCertificat = join(this.dossierCle, "certificat");
      await mkdir(dossierCertificat, { recursive: true });
      for (const f of await readdir(this.sources.certificat, { withFileTypes: true })) {
        // Les fichiers seulement (copyFile suit un lien vers son contenu) ; FAT n'a pas de liens.
        if (f.isFile() || f.isSymbolicLink()) fichiers.push([join(this.sources.certificat, f.name), join(dossierCertificat, f.name)]);
      }
    }
    for (const [source, cible] of fichiers) {
      if (!(await aRecopier(source, cible))) continue;
      etat.octets += await copierSur(source, cible);
      etat.copies.push(cible.slice(this.dossierCle.length + 1));
    }
    for (const f of aSupprimerSurCle([...surCle])) await rm(join(dossierSauvegardes, f), { force: true });
  }

  private journaliser(etat: EtatCle, nouvelle: boolean): void {
    const libre = etat.libre !== undefined ? `, ${taille(etat.libre)} libres` : "";
    if (etat.etat === "ok") {
      if (etat.copies.length > 0) {
        const quoi = etat.copies.filter((c) => c.endsWith(".sqlite")).join(", ") || etat.copies.map((c) => basename(c)).join(", ");
        journal(`Clé de sauvegarde : ${etat.copies.length} fichier(s) copié(s) (${quoi} ; ${taille(etat.octets)}${libre})`);
      } else if (this.dernierEtatJournalise !== null && this.dernierEtatJournalise !== "ok") {
        journal(`Clé de sauvegarde : de nouveau disponible, rien à copier${libre}`);
      }
    } else if (nouvelle || this.dernierEtatJournalise !== etat.etat) {
      // L'alerte est redite à chaque nouvelle sauvegarde, pas à chaque vérification horaire.
      const titre = { absente: "CLÉ ABSENTE", pleine: "CLÉ PLEINE", erreur: "ERREUR" }[etat.etat];
      journal(`⚠ Clé de sauvegarde — ${titre} : ${etat.message}${libre}. Les sauvegardes restent sur la carte SD.`);
    }
    this.dernierEtatJournalise = etat.etat;
  }

  private async lireDerniereCopie(): Promise<number | undefined> {
    try {
      const e = JSON.parse(await readFile(join(this.sources.sauvegardes, FICHIER_ETAT_CLE), "utf8")) as Partial<EtatCle>;
      return typeof e.derniereCopie === "number" ? e.derniereCopie : undefined;
    } catch {
      return undefined;
    }
  }

  private async ecrireEtat(etat: EtatCle): Promise<void> {
    try {
      const chemin = join(this.sources.sauvegardes, FICHIER_ETAT_CLE);
      await writeFile(chemin + SUFFIXE_TEMPORAIRE, JSON.stringify(etat, null, 2));
      await rename(chemin + SUFFIXE_TEMPORAIRE, chemin);
    } catch {
      // l'état n'est qu'une information pour le bilan
    }
  }
}

/** « clé : dernière copie il y a 3 h » (pour le bilan), à partir du fichier d'état. */
export function resumeEtatCle(etat: Partial<EtatCle> | null, maintenant = Date.now()): string {
  if (!etat) return "clé : aucune copie connue (pas de clé configurée, ou pas encore de vérification)";
  const ilYa = (ms: number) => {
    const h = (maintenant - ms) / 3_600_000;
    return h < 48 ? `${Math.max(0, Math.round(h))} h` : `${Math.round(h / 24)} jours`;
  };
  const derniere = typeof etat.derniereCopie === "number" ? `dernière copie il y a ${ilYa(etat.derniereCopie)}` : "jamais copiée";
  const libre = typeof etat.libre === "number" ? `, ${taille(etat.libre)} libres` : "";
  const alerte = etat.etat && etat.etat !== "ok" ? ` — ⚠ ${etat.etat} à la dernière vérification${etat.message ? ` (${etat.message})` : ""}` : "";
  return `clé : ${derniere}${libre}${alerte}`;
}
