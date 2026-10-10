// ⚙️ La mécanique des Mécanistes côté serveur (Book 25 §6, chantier 7 · 0.6) : les pièges (déclarés au moteur des
// déclencheurs), leur réarmement, les accessoires du pédalier (ventilateur à manivelle, meule fine) et le fil de rasoir
// que donne la meule fine.
//
// Ce module ne connaît pas le joueur : il passe par un `ContexteMecanique` (ce que le joueur lui prête). joueur.ts
// n'ajoute que des appels d'une ligne (Book 25 §10.4). L'arbalète, elle, est une arme de tir : sa table est dans
// commun/src/tir.ts, son réarmement dans serveur/src/tir.ts, ses recettes dans commun/src/recettes/mecanistes.ts.

import type { Arme } from "../../commun/src/combat.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";
import type { InstallationVue, Verbe } from "../../commun/src/messages.ts";
import { nommer, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { niveauQualite } from "../../commun/src/recettes.ts";
import { ACCESSOIRES_PEDALIER, BONUS_FIL_DE_RASOIR, REARMER_PIEGE, accessoireMonte, estPiegeMecanique, type AccessoirePedalier } from "../../commun/src/mecanique.ts";
import { declencheurNeuf, enregistrerDeclencheur, rearmer, type DefinitionDeclencheur } from "./declencheurs.ts";

// ---------- Les pièges (Book 25 §6.3), déclarés au moteur des déclencheurs ----------

/** Les pièges mécaniques : ils agissent sur le corps des Éteints, et ne détruisent jamais (il faut achever). */
export const DECLENCHEURS_MECANIQUES: DefinitionDeclencheur[] = [
  {
    // Deux bûches en équilibre sur une détente en 4 : le premier qui passe dessous est mis à terre 5 s.
    type: "assommoir",
    nom: "l'assommoir",
    forme: { genre: "cercle", rayon: 0.7 },
    effets: [{ genre: "mettre_a_terre", secondes: 5 }],
    prisesParArmement: 1,
    intervalle: 2,
    message: "Clac ! L'assommoir a mis un Éteint à terre : achève-le.",
  },
  {
    // Deux lames de ressort brutes : la jambe se brise (un Rampant), tenu 10 s. Le ressort fatigué se fausse en 5 prises.
    type: "machoires_fortune",
    nom: "les mâchoires de fortune",
    forme: { genre: "cercle", rayon: 0.5 },
    effets: [{ genre: "briser_jambe" }, { genre: "tenir", secondes: 10 }],
    prisesParArmement: 1,
    intervalle: 2,
    usure: 5,
    message: "Les mâchoires ont pris un Éteint : il rampe, tenu sur place.",
  },
  {
    // Deux ressorts retrempés : tenu 20 s, et le piège ne se fausse pas.
    type: "piege_machoires",
    nom: "le piège à mâchoires",
    forme: { genre: "cercle", rayon: 0.5 },
    effets: [{ genre: "briser_jambe" }, { genre: "tenir", secondes: 20 }],
    prisesParArmement: 1,
    intervalle: 2,
    message: "Le piège à mâchoires a pris un Éteint : il ne repartira pas.",
  },
  {
    // Il tombe et reste coincé (Book 06 §9.2) : on l'achève d'en haut.
    type: "fosse_pieux",
    nom: "la fosse à pieux",
    forme: { genre: "cercle", rayon: 0.8 },
    effets: [{ genre: "mettre_a_terre", secondes: 20 }, { genre: "tenir", secondes: 20 }],
    prisesParArmement: 1,
    intervalle: 2,
    message: "Un Éteint est tombé dans la fosse : achève-le d'en haut.",
  },
];
for (const d of DECLENCHEURS_MECANIQUES) enregistrerDeclencheur(d);

// ---------- Ce que le joueur prête au module ----------

export interface ContexteMecanique {
  inventaire(): Inventaire;
  endurance(): number;
  depenser(endurance: number): void;
  /** Retirer des objets du sac (tous présents : déjà vérifié). */
  retirer(objets: Inventaire): void;
  info(texte: string): void;
  /** Un geste, en secondes réelles (il s'arrête si l'on bouge). */
  commencer(libelle: string, secondes: number, appliquer: () => void, bruit: "outil" | "lourd"): void;
  /** L'installation a changé : la sauver, la montrer. */
  maj(): void;
  /** Un fait pour les quêtes et les mesures. */
  noter(fait: string): void;
}

/** Les gestes de la mécanique sur une installation. */
const VERBES: ReadonlySet<Verbe> = new Set<Verbe>(["rearmer_piege", "monter_soufflet", "monter_meule_fine"]);

/**
 * A sur une installation : un piège mécanique à réarmer, un accessoire à monter sur le pédalier. Rend true si le geste
 * est pris en charge ici (sinon le joueur continue : la plaque de choc des Voltaïques se réarme ailleurs).
 */
export function utiliserMecanique(ctx: ContexteMecanique, i: InstallationVue, verbe: Verbe): boolean {
  if (!VERBES.has(verbe)) return false;
  if (verbe === "rearmer_piege") {
    if (!estPiegeMecanique(i.type)) return false;
    rearmerPiege(ctx, i);
    return true;
  }
  if (i.type !== "pedalier") return true;
  monterAccessoire(ctx, i, verbe === "monter_soufflet" ? "soufflet" : "meule_fine");
  return true;
}

/** Réarmer un piège (Book 25 §6.3) : un geste, de l'endurance. Faussé, il ne se réarme plus : il faut le refaire. */
function rearmerPiege(ctx: ContexteMecanique, i: InstallationVue): void {
  if (!estPiegeMecanique(i.type)) return;
  const etat = (i.etat.declencheur ??= declencheurNeuf());
  if (etat.fausse) return ctx.info("Faussées : ces mâchoires ne se réarment plus. Démonte-les, refais-en.");
  if (etat.arme) return ctx.info("Il est déjà armé.");
  const r = REARMER_PIEGE[i.type];
  if (ctx.endurance() < r.endurance) return ctx.info("Trop essoufflé pour réarmer : souffle un instant.");
  ctx.commencer(r.geste, r.secondes, () => {
    const e = i.etat.declencheur;
    if (!e || e.arme || !rearmer(e)) return;
    ctx.depenser(Math.min(ctx.endurance(), r.endurance));
    ctx.maj();
    ctx.noter("piege_rearme");
  }, i.type === "assommoir" || i.type === "fosse_pieux" ? "lourd" : "outil");
}

/** Monter un accessoire sur le pédalier (Book 25 §6.4) : le ventilateur à manivelle, la meule fine. */
function monterAccessoire(ctx: ContexteMecanique, i: InstallationVue, a: AccessoirePedalier): void {
  const def = ACCESSOIRES_PEDALIER[a];
  if (accessoireMonte(i.etat, a)) return ctx.info(`${majuscule(def.nom)} est déjà monté${a === "meule_fine" ? "e" : ""}.`);
  if (def.apresMeule && !i.etat.meule) return ctx.info("Monte d'abord la meule (3 pierres) : la meule fine se pose dessus.");
  if (def.serrer && niveauQualite(ctx.inventaire(), "serrer") < 1) return ctx.info("Il faut une clé pour serrer les brides.");
  const manque = manquant(ctx.inventaire(), def.cout);
  if (manque) return ctx.info(`Pour ${def.nom}, il manque : ${manque}.`);
  ctx.commencer(`Monter ${def.nom}`, def.secondes, () => {
    if (accessoireMonte(i.etat, a) || manquant(ctx.inventaire(), def.cout)) return;
    ctx.retirer(def.cout);
    i.etat = { ...i.etat, ...(a === "soufflet" ? { soufflet: true } : { meuleFine: true }) };
    ctx.maj();
    ctx.noter(`pedalier:${a}`);
    ctx.info(a === "soufflet" ? "Le ventilateur à manivelle est monté : près d'une forge, il souffle quand on pédale." : "La meule fine est montée : l'affûtage y donne un fil de rasoir.");
  }, "outil");
}

/** Ce qui manque dans le sac, en toutes lettres (null : rien). */
function manquant(inventaire: Inventaire, cout: Inventaire): string | null {
  const m = Object.entries(cout)
    .filter(([t, n]) => (inventaire[t as TypeObjet] ?? 0) < (n ?? 0))
    .map(([t, n]) => nommer(t as TypeObjet, n ?? 1));
  return m.length ? m.join(", ") : null;
}

function majuscule(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- Le fil de rasoir (Book 25 §6.4 : la meule fine) ----------

/**
 * Les lames affûtées à la meule fine : +10 % de dégâts, jusqu'à ce que l'exemplaire casse. Tenu par le joueur, pour la
 * séance (il ne se sauve pas : un fil de rasoir ne survit pas à une nuit dans le sac).
 */
export class FilsDeRasoir {
  private readonly affutees = new Set<CleObjet>();

  /** Affûtée à la meule fine. */
  affuter(cle: CleObjet): void {
    this.affutees.add(cle);
  }

  /** L'exemplaire a cassé : le suivant n'a pas de fil. */
  casse(cle: CleObjet): void {
    this.affutees.delete(cle);
  }

  aUnFil(cle: CleObjet | null): boolean {
    return cle !== null && this.affutees.has(cle);
  }

  /** L'arme telle qu'elle frappe : +10 % au torse si elle a son fil de rasoir. */
  affile(arme: Arme, cle: CleObjet | null): Arme {
    return this.aUnFil(cle) ? { ...arme, degatsTorse: arme.degatsTorse * BONUS_FIL_DE_RASOIR } : arme;
  }
}
