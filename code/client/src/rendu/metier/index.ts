// Le registre des modèles de métier (Book 25 §10.3 et §10.4, chantier 1 · 0.6).
//
// Chaque chantier de métier dessine ses objets dans son propre fichier (`arc.ts`, `forge.ts`, `electricite.ts`,
// `mecanique.ts`) et les enregistre ici, d'une ligne : le reste du client (les projectiles en vol, plus tard l'arme en
// main et les installations) demande un modèle par son identifiant, sans connaître le fichier qui le fabrique.
//
// Le registre est vide à la création : les chantiers 4 à 7 y ajoutent chacun une ligne d'import, en fin de liste.

import type * as THREE from "three";

/** Fabrique un modèle neuf (chaque appel rend un nouvel objet, qu'on peut placer et animer seul). */
export type FabriqueModele = () => THREE.Object3D;

/** Où sert le modèle : en vol (flèche, carreau), en main, au sol. */
export type UsageModele = "vol" | "main" | "sol";

const MODELES = new Map<string, FabriqueModele>();

/** Enregistre le modèle d'un objet de métier pour un usage (le dernier enregistré l'emporte). */
export function enregistrerModele(objet: string, usage: UsageModele, fabrique: FabriqueModele): void {
  MODELES.set(`${usage}:${objet}`, fabrique);
}

/** Un modèle neuf de cet objet pour cet usage, s'il est enregistré (sinon null : on prend le dessin par défaut). */
export function modeleMetier(objet: string, usage: UsageModele): THREE.Object3D | null {
  return MODELES.get(`${usage}:${objet}`)?.() ?? null;
}

// ---- Les fichiers des métiers, une ligne chacun (chantiers 4 à 7) ----
// L'arc pour tous (chantier 4) : les arcs en main, les flèches en vol, le redresseur de l'établi. Un appel, et non un
// import à effet : les imports passent avant ce fichier, quand le registre n'existe pas encore.
import { enregistrerArc } from "./arc.ts";
enregistrerArc(enregistrerModele);
