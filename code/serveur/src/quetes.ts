// Le suivi des quêtes d'un joueur (Book 22) : le serveur constate ce que le joueur a fait ou possède,
// passe à l'objectif suivant, verse la récompense. Les règles sont dans commun/src/quetes.ts.

import type { Charges } from "../../commun/src/energie.ts";
import { OBJETS, lumierePortee, nommer, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import {
  QUETES,
  quetesOuvertes,
  type Condition,
  type EtatQuetes,
  type LigneQuete,
  type Quete,
  type VueQuete,
  type VueQuetes,
} from "../../commun/src/quetes.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { ETOILES_MAX, exemplaires } from "../../commun/src/etoiles.ts";

/** Ce que le suivi peut regarder chez le joueur. */
export interface EtatJoueurPourQuetes {
  famille: Famille;
  inventaire: Inventaire;
  charges: Charges;
  /** Les installations de son terrain, avec leur état (meule, dynamo…). */
  installations: Iterable<{ type: string; etat: object; niveau?: number }>;
}

/** Les lignes du carnet, dans l'ordre d'affichage. */
const LIGNES: LigneQuete[] = ["metier", "installer", "autres"];

export class SuiviQuetes {
  etat: EtatQuetes;

  constructor(etat: EtatQuetes) {
    this.etat = etat;
  }

  /** Un fait de plus (« plat_mange », « wotts_gagnes » de n…). Vrai si le compte a changé. */
  noter(fait: string, n = 1): boolean {
    if (!(n > 0)) return false;
    this.etat.faits[fait] = (this.etat.faits[fait] ?? 0) + n;
    return true;
  }

  /** Les quêtes en cours : une par ligne, deux pour « S'installer » arrivé aux portes du niveau 1 (une par route). */
  enCours(famille: Famille): Quete[] {
    return LIGNES.flatMap((ligne) => quetesOuvertes(ligne, famille, this.etat.finies));
  }

  /** Où en est cet objectif : fait / but. */
  avancement(c: Condition, j: EtatJoueurPourQuetes): { fait: number; but: number } {
    switch (c.a) {
      case "fait":
        return { fait: Math.min(c.but, Math.floor(this.etat.faits[c.fait] ?? 0)), but: c.but };
      case "installation": {
        const ok = [...j.installations].some((i) => i.type === c.type && (!c.avec || (i.etat as Record<string, unknown>)[c.avec] === true) && (i.niveau ?? 1) >= (c.niveau ?? 1));
        return { fait: ok ? 1 : 0, but: 1 };
      }
      case "faits": {
        const n = c.faits.reduce((s, f) => s + (this.etat.faits[f] ?? 0), 0);
        return { fait: Math.min(c.but, Math.floor(n)), but: c.but };
      }
      case "objet": {
        // Les objets de métier comptent toutes étoiles confondues (« machette_forgee#2 »), au-dessus du seuil s'il y en a un.
        const min = c.etoiles ?? 0;
        const n = c.types.reduce((s, t) => s + exemplaires(j.inventaire, t).reduce((k, e) => k + ((e.etoiles ?? ETOILES_MAX) >= min ? e.nombre : 0), 0), 0);
        return { fait: Math.min(c.n, n), but: c.n };
      }
      case "wh": {
        const wh = c.batterie ? (j.charges[c.batterie] ?? 0) : Object.values(j.charges).reduce((s, v) => s + (v ?? 0), 0);
        return { fait: Math.min(c.but, Math.floor(wh)), but: c.but };
      }
      case "vivres": {
        let kcal = 0;
        for (const [type, n] of Object.entries(j.inventaire) as [TypeObjet, number][]) {
          const o = OBJETS[type];
          if (o?.kcal && !o.toxique) kcal += o.kcal * n;
        }
        return { fait: Math.min(c.but, Math.floor(kcal)), but: c.but };
      }
      case "lumiere":
        return { fait: lumierePortee(j.inventaire) ? 1 : 0, but: 1 };
      case "un_de": {
        // La meilleure des possibilités (en part du but) : c'est celle qu'on montre.
        let meilleure = { fait: 0, but: 1 };
        for (const sous of c.conditions) {
          const a = this.avancement(sous, j);
          if (a.fait / a.but > meilleure.fait / meilleure.but) meilleure = a;
        }
        return meilleure;
      }
    }
  }

  /** Les quêtes réussies maintenant (elles passent dans « finies »), dans l'ordre. */
  verifier(j: EtatJoueurPourQuetes): Quete[] {
    const reussies: Quete[] = [];
    // Une réussite peut en débloquer une autre déjà remplie (un ancien qui a déjà tout) : on boucle.
    for (let tour = 0; tour < QUETES.length; tour++) {
      const q = this.enCours(j.famille).find((x) => x.objectifs.every((o) => { const a = this.avancement(o.condition, j); return a.fait >= a.but; }));
      if (!q) break;
      this.etat.finies.push(q.id);
      reussies.push(q);
    }
    return reussies;
  }

  vue(j: EtatJoueurPourQuetes, reussies: Quete[] = []): VueQuetes {
    const quetes: VueQuete[] = this.enCours(j.famille).map((q) => {
      const v: VueQuete = {
        id: q.id,
        ligne: q.ligne,
        ...(q.route ? { route: q.route } : {}),
        titre: q.titre,
        ...(q.icone ? { icone: q.icone } : {}),
        texte: q.texte,
        objectifs: q.objectifs.map((o) => ({ libelle: o.libelle, ...this.avancement(o.condition, j) })),
      };
      const r = texteRecompense(q);
      if (r) v.recompense = r;
      return v;
    });
    const vue: VueQuetes = { quetes };
    if (reussies.length > 0) {
      vue.reussies = reussies.map((q) => {
        const r = texteRecompense(q);
        return { titre: q.titre, lecon: q.lecon, ...(r ? { recompense: r } : {}) };
      });
    }
    return vue;
  }

  aFini(id: string): boolean {
    return this.etat.finies.includes(id);
  }
}

export function texteRecompense(q: Quete): string | undefined {
  const r = q.recompense;
  if (!r) return undefined;
  const parts: string[] = [];
  for (const [type, n] of Object.entries(r.objets ?? {}) as [TypeObjet, number][]) parts.push(n === 1 ? `1 ${nommer(type, 1)}` : nommer(type, n));
  if (r.wotts) parts.push(`${r.wotts} wotts sur ton compte au Comptoir`);
  return parts.length ? parts.join(", ") : undefined;
}
