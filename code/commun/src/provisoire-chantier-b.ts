// ============================================================================================================
// PROVISOIRE, CHANTIER B (0.10) : à retirer à l'intégration, quand le chantier B est fusionné.
// ============================================================================================================
// Le chantier C (les dix meubles du niveau 2) cite les objets-clés que le chantier B crée (plan 0.10 §3.1, §4) : ce
// fichier n'en déclare que le minimum pour compiler et tester, sous les identifiants que B emploie (le tube d'aluminium,
// les dix objets-clés, les qualités du rabot et du fer à souder). B les déclare pour de bon dans `vestiges.ts`, avec
// leurs icônes ; l'intégration supprime ce fichier, sa ligne dans `vestiges.ts` (VESTIGES), sa ligne dans `recettes.ts`
// (QUALITES_OBJETS) et `client/src/icones-provisoire-b.ts` (et sa ligne dans `icones.ts`).

import type { Qualite } from "./recettes.ts";
import type { DefinitionVestige } from "./vestiges.ts";

/** Une définition courte : rien qu'on ne trouve au hasard (hors des tirages), une valeur pour le Comptoir. */
function cle(nom: string, pluriel: string, poids: number, valeur: number, famille: DefinitionVestige["famille"], teinte: string): DefinitionVestige {
  return { nom, pluriel, description: `${nom.charAt(0).toUpperCase()}${nom.slice(1)}.`, poids, valeur, famille, rarete: "R", teinte, horsTirage: true };
}

export const VESTIGES_PROVISOIRES_B = {
  tube_aluminium: { ...cle("tube d'aluminium", "tubes d'aluminium", 0.4, 8, "composant", "#d4d8dc"), rarete: "C" },
  toles_ondulees: cle("paquet de tôles ondulées", "paquets de tôles ondulées", 12, 40, "ferme", "#a9b0b5"),
  couvertures_laine: cle("paire de couvertures de laine", "paires de couvertures de laine", 3, 30, "textile", "#8c3b2e"),
  lanterne_tempete: cle("lanterne-tempête", "lanternes-tempête", 1.2, 35, "ferme", "#b5442e"),
  fer_souder: cle("fer à souder", "fers à souder", 0.4, 40, "gadget", "#3f5f7a"),
  porte_four: cle("porte de four en fonte", "portes de four en fonte", 9, 40, "cuisine", "#3a3633"),
  jerrican_20l: cle("jerrican de 20 L", "jerricans de 20 L", 1.5, 25, "garage", "#3f7a3a"),
  rabot: cle("rabot", "rabots", 1.6, 40, "garage", "#7a5a3a"),
  cloche_bronze: cle("cloche de bronze", "cloches de bronze", 12, 60, "salon", "#b8863b"),
  soufflet_forge: cle("soufflet de forge", "soufflets de forge", 10, 60, "garage", "#6b4a2e"),
} satisfies Record<string, DefinitionVestige>;

/** Les deux outils : le rabot (Raboter 1) et le fer à souder (Souder 1, sans version pauvre). */
export const QUALITES_PROVISOIRES_B: Record<"rabot" | "fer_souder", Partial<Record<Qualite, number>>> = {
  rabot: { raboter: 1 },
  fer_souder: { souder: 1 },
};
