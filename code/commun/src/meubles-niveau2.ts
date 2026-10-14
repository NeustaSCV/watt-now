// Les dix meubles du niveau 2 (plan 0.10 §3.1, chantier C) : ce que leurs niveaux font, en règles pures partagées par
// le serveur (qui juge) et le client (qui montre). Leurs étapes (coûts, objets-clés, textes) sont dans lignees.ts ;
// ce que les autres effets lisent déjà sans rien de nouveau : la réserve couverte garde 400 kg (CAPACITES_COFFRE),
// l'abri doublé donne un sommeil ×1,6 (SOMMEIL_ABRI), le jerrican tient 20 L (CONTENANCES_RECUPERATEUR), le four de
// terre brûle deux fois moins de bois (EFFETS_FEU), la forge ventilée monte à ★★★ (forge.ts).
//
// Ici : la lanterne fixe (le niveau 2 de la torche plantée), la cloche d'alarme (le niveau 2 de l'alarme à boîtes), le
// poste de montage ⚡ et les roulements montés ⚙️ (les niveaux 2 du banc solaire et du pédalier, que les recettes
// demandent comme des accessoires).

/** Une installation telle qu'on la regarde ici. */
export interface MeublePose {
  type: string;
  niveau?: number;
}

// ---------- La lanterne fixe (N2-10) ----------

/** Le niveau de la torche plantée où elle devient la lanterne fixe. */
export const NIVEAU_LANTERNE = 2;
/** Ce que la lanterne fixe éclaire autour d'elle (m) : 14 m, contre 6 pour la torche. */
export const PORTEE_LANTERNE = 14;

/** Est-ce la lanterne fixe (la torche plantée au niveau 2) ? */
export function estLanterneFixe(i: MeublePose): boolean {
  return i.type === "torche_plantee" && (i.niveau ?? 1) >= NIVEAU_LANTERNE;
}

/**
 * La lanterne fixe brille-t-elle ? Toute la nuit, chaque nuit, d'elle-même : elle ne se rallume pas et ne se consume
 * pas (la lanterne-tempête garde sa mèche ; l'huile du bidon, payée à la montée, la tient).
 */
export function lanterneAllumee(i: MeublePose, nuit: boolean): boolean {
  return nuit && estLanterneFixe(i);
}

// ---------- La cloche d'alarme (N2-16) ----------

/** Le niveau de l'alarme à boîtes où elle devient la cloche d'alarme. */
export const NIVEAU_CLOCHE = 2;
/** La cloche s'entend à 40 m (les boîtes : 14 m), et elle sonne plus fort. */
export const CLOCHE_ALARME = { portee: 40, intensite: 1.3 } as const;
/** Les boîtes de conserve qui tintent (P-002) : ce qu'on entend autour. */
export const BOITES_ALARME = { portee: 14, intensite: 0.5 } as const;

/** Est-ce la cloche d'alarme (l'alarme à boîtes au niveau 2) ? Elle réveille le dormeur. */
export function estClocheAlarme(i: MeublePose): boolean {
  return i.type === "alarme_boites" && (i.niveau ?? 1) >= NIVEAU_CLOCHE;
}

/** Le son d'une alarme qui sonne : la cloche porte à 40 m, les boîtes à 14 m. */
export function sonAlarme(i: MeublePose): { portee: number; intensite: number } {
  return estClocheAlarme(i) ? CLOCHE_ALARME : BOITES_ALARME;
}

// ---------- Les roulements montés ⚙️ (N2-12) ----------

/** Pédaler sur roulements : 30 % d'effort en moins (les calories), 30 % de Wh en plus. */
export const ROULEMENTS = { effort: 0.7, wh: 1.3 } as const;

/** Le pédalier a-t-il ses roulements montés (le niveau 2 de sa lignée) ? */
export function aDesRoulements(i: MeublePose): boolean {
  return i.type === "pedalier" && (i.niveau ?? 1) >= 2;
}

// ---------- Les accessoires qui sont des niveaux (le poste de montage ⚡, les roulements ⚙️) ----------

/**
 * Les recettes demandent le poste de montage et les roulements montés comme des accessoires (`aCote("banc_recharge",
 * { accessoire: "poste_montage" })`) ; dans les lignées, ce sont les niveaux 2 du banc et du pédalier. Ce tableau fait
 * le lien.
 */
export const ACCESSOIRES_DE_NIVEAU: Readonly<Record<string, { type: string; niveau: number }>> = {
  poste_montage: { type: "banc_recharge", niveau: 2 },
  roulements: { type: "pedalier", niveau: 2 },
};

/** Cet accessoire est-il un niveau, atteint par cette installation ? (false pour tout autre accessoire.) */
export function accessoireDeNiveau(i: MeublePose, accessoire: string): boolean {
  const a = ACCESSOIRES_DE_NIVEAU[accessoire];
  return a !== undefined && i.type === a.type && (i.niveau ?? 1) >= a.niveau;
}
