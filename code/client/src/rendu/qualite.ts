// Réglages de qualité graphique (Book 21 §5.3.5) : bas, moyen, haut.
// L'iPhone 13 est l'appareil de référence : il démarre en « moyen ».

import { lire, ecrire } from "../stockage.ts";

export type NiveauQualite = "bas" | "moyen" | "haut";

export interface Qualite {
  niveau: NiveauQualite;
  /** Plafond du rapport de pixels (écrans Retina). */
  rapportPixelsMax: number;
  ombres: boolean;
  tailleCarteOmbre: number;
  anticrenelage: boolean;
}

const NIVEAUX: Record<NiveauQualite, Qualite> = {
  bas: { niveau: "bas", rapportPixelsMax: 1, ombres: false, tailleCarteOmbre: 0, anticrenelage: false },
  moyen: { niveau: "moyen", rapportPixelsMax: 1.5, ombres: true, tailleCarteOmbre: 1024, anticrenelage: false },
  haut: { niveau: "haut", rapportPixelsMax: 2, ombres: true, tailleCarteOmbre: 2048, anticrenelage: true },
};

export const ORDRE_NIVEAUX: NiveauQualite[] = ["bas", "moyen", "haut"];

const CLE = "watt.qualite";

export function qualiteActuelle(tactile: boolean): Qualite {
  const choisi = lire(CLE);
  if (choisi === "bas" || choisi === "moyen" || choisi === "haut") return NIVEAUX[choisi];
  return NIVEAUX[tactile ? "moyen" : "haut"];
}

/** Change la qualité. L'anticrénelage se règle à la création du rendu : on recharge la page. */
export function changerQualite(niveau: NiveauQualite): void {
  ecrire(CLE, niveau);
  location.reload();
}
