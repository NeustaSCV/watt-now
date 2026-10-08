// Les réglages d'équilibrage, modifiables à chaud pendant le test familial (Book 21 §3.9 É5, Book 03 §8).
// Ce sont des données : le serveur les lit dans `serveur/donnees/reglages.json` (seulement les valeurs changées),
// les recharge dès que le fichier change, et les envoie aux joueurs connectés. Pas de redémarrage, pas de redéploiement.

export interface DefinitionReglage {
  defaut: number;
  min: number;
  max: number;
  /** Ce que fait ce réglage, en clair. */
  aide: string;
}

export const DEFINITIONS_REGLAGES = {
  fabrication_acceleration: { defaut: 20, min: 1, max: 120, aide: "Une fabrication dure sa durée de jeu divisée par ce nombre (20 : monter l'abri prend 3 s)." },
  gestes_vitesse: { defaut: 1, min: 0.2, max: 5, aide: "Vitesse des gestes sur le terrain (ramasser, fouiller, démonter) : 2 = deux fois plus rapides." },
  // Ralentis le 2026-10-08 (porteur du projet) : au rythme réel, une réserve pleine ne tenait que 24 min réelles.
  faim_rythme: { defaut: 0.35, min: 0, max: 5, aide: "Vitesse à laquelle on a faim : 1 = 2 500 kcal par jour de jeu (réserve vide en 24 min réelles) ; 0,35 = en ≈ 70 min." },
  soif_rythme: { defaut: 0.35, min: 0, max: 5, aide: "Vitesse à laquelle on a soif : 1 = 2,5 L par jour de jeu (24 min réelles) ; 0,35 = en ≈ 70 min." },
  sommeil_rythme: { defaut: 0.4, min: 0, max: 5, aide: "Vitesse à laquelle on se fatigue : 1 = épuisé après 16 h de jeu éveillé (16 min réelles) ; 0,4 = en 40 min." },
  repousse_rythme: { defaut: 1, min: 0.1, max: 20, aide: "Vitesse de repousse des ressources (bois mort, baies, fruits, champignons, vestiges) : 2 = deux fois plus vite." },
  eteints_terrain_max: { defaut: 3, min: 0, max: 12, aide: "Nombre maximal d'Éteints debout en même temps sur un terrain." },
  eteints_attirance: { defaut: 1, min: 0, max: 5, aide: "Chance qu'un Éteint soit attiré sur le terrain (feu, lumière, bruit) : 0 = jamais, 2 = deux fois plus souvent." },
  eteints_repit_min: { defaut: 2, min: 0, max: 60, aide: "Minutes réelles de répit au moins entre deux arrivées d'Éteints sur un terrain." },
  prix_fourchette: { defaut: 0.2, min: 0, max: 1, aide: "Le Comptoir vend au prix de base plus cette part, et rachète moins cette part (0,2 = ±20 %)." },
  depot_wotts_par_wh: { defaut: 0.85, min: 0.1, max: 2, aide: "Wotts payés par Wh d'électricité déposé au Comptoir (le seul geste qui crée des wotts)." },
  decharge_wotts_semaine: { defaut: 0.02, min: 0, max: 0.5, aide: "Part des wotts qui se décharge chaque semaine réelle (0,02 = 2 %)." },
  poules_terrain: { defaut: 3, min: 0, max: 10, aide: "Nombre de poules ensauvagées autour de la ferme." },
  poule_retour_h: { defaut: 2, min: 0.1, max: 48, aide: "Heures réelles avant qu'une poule prise soit remplacée." },
  inactivite_min: { defaut: 5, min: 1, max: 120, aide: "Minutes sans bouger ni agir avant d'être déconnecté d'office : hors ligne, la faim, la soif et la fatigue sont gelées." },
  panneau_wh_jour: { defaut: 80, min: 0, max: 500, aide: "Wh produits par le petit panneau solaire par jour de calendrier (1 h 50 réelle)." },
} satisfies Record<string, DefinitionReglage>;

export type NomReglage = keyof typeof DEFINITIONS_REGLAGES;
export type Reglages = Record<NomReglage, number>;

function defauts(): Reglages {
  const r = {} as Reglages;
  for (const [nom, d] of Object.entries(DEFINITIONS_REGLAGES)) r[nom as NomReglage] = d.defaut;
  return r;
}

/** Les réglages en vigueur : lus partout au moment du calcul (jamais recopiés dans une constante). */
export const REGLAGES: Reglages = defauts();

export function estNomReglage(nom: string): nom is NomReglage {
  return nom in DEFINITIONS_REGLAGES;
}

/**
 * Applique des réglages venus d'un fichier ou du serveur : les valeurs absentes reprennent leur défaut, les valeurs
 * hors bornes sont ramenées dans les bornes. Renvoie les remarques (clé inconnue, valeur corrigée), pour le journal.
 */
export function appliquerReglages(brut: unknown): string[] {
  const remarques: string[] = [];
  const nouveaux = defauts();
  if (typeof brut === "object" && brut !== null) {
    for (const [nom, valeur] of Object.entries(brut as Record<string, unknown>)) {
      if (nom.startsWith("_")) continue; // commentaires
      if (!estNomReglage(nom)) {
        remarques.push(`réglage inconnu « ${nom} » ignoré`);
        continue;
      }
      const d: DefinitionReglage = DEFINITIONS_REGLAGES[nom];
      if (typeof valeur !== "number" || !Number.isFinite(valeur)) {
        remarques.push(`« ${nom} » doit être un nombre : défaut ${d.defaut} gardé`);
        continue;
      }
      const borne = Math.min(d.max, Math.max(d.min, valeur));
      if (borne !== valeur) remarques.push(`« ${nom} » = ${valeur} ramené à ${borne} (de ${d.min} à ${d.max})`);
      nouveaux[nom] = borne;
    }
  }
  Object.assign(REGLAGES, nouveaux);
  return remarques;
}

/** Les réglages qui diffèrent du défaut (ce qu'on envoie, ce qu'on écrit). */
export function reglagesChanges(): Partial<Reglages> {
  const r: Partial<Reglages> = {};
  for (const [nom, d] of Object.entries(DEFINITIONS_REGLAGES)) {
    const n = nom as NomReglage;
    if (REGLAGES[n] !== d.defaut) r[n] = REGLAGES[n];
  }
  return r;
}
