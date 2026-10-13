// ⚡ Les recettes des Voltaïques : le banc solaire (le banc et le panneau de la station, un seul meuble depuis la 0.8) ;
// et, depuis la 0.6 (Book 25 §5, chantier 6),
// les packs et les modules, les matraques, l'aiguillon, la lampe bricolée, l'alarme, les clôtures, la plaque de choc,
// le ventilateur de forge, l'électrificateur et le bain de dérouillage.
// Les autres familles voient ces recettes grisées, « chez les Voltaïques » (savoir.ts).
//
// La règle d'or (Book 25 §2.5) : un Voltaïque seul fait sa base. La matraque de fortune ne demande que son kit (la
// petite batterie, le couteau pour le gourdin) et le petit condensateur d'un appareil photo jetable ; la matraque ★★ le condensateur d'une
// raquette et trois cellules (ou la petite batterie). Les électrodes forgées (🔥) et le manche tourné (⚙️) ne sont que
// des améliorations.

import type { Inventaire, TypeObjet } from "../objets.ts";
import { exemplaires } from "../etoiles.ts";
import type { Recette } from "../recettes.ts";
import { POSEE, aCote } from "./lieux.ts";

/** Le métier se fait à l'atelier (`recettes-par-construction.md` §4.4) : on assemble et l'on vérifie là où il y a du courant. */
const AU_BANC = aCote("banc_recharge");
/** Monter fin (la haute tension, les électrodes, un moteur) : le poste de montage du banc, au niveau 2 (plan 0.8 §1.3). */
const AU_POSTE_DE_MONTAGE = aCote("banc_recharge", { accessoire: "poste_montage" });
/**
 * Ce qui attend le niveau 2 (plan 0.8 §1.3, `decisions-armes.json`) : le poste de montage (L2A, sa clé : le fer à souder)
 * et ce qui s'y fait, l'aiguillon, la clôture électrique. Grisé « plus tard » ; le serveur le refuse.
 */
const NIVEAU_2 = { aVenir: "niveau 2" } as const;

/**
 * La petite batterie du kit est unique (Q-B6) : la même phrase sur les deux fiches qui la prennent (la matraque de
 * fortune et la matraque électrique, chantier 8 ; une seule recette depuis la 0.8.2, R16).
 */
const NOTE_PETITE_BATTERIE = "La petite batterie de la frontale est unique : elle va à la matraque de fortune ou à la matraque électrique, pas aux deux.";
/** La petite batterie, source d'une matraque électrique : une source ★★ (Q-A5). */
const SOURCE_PETITE_BATTERIE = 2;

/** L'étoile de chaque condensateur (Q-0.8.2-4) : le module de décharge la prend (maillon faible). */
export const ETOILES_CONDENSATEUR = { petit_condensateur: 1, condensateur_moyen: 2 } as const;

/**
 * Les étoiles du module de décharge que la recette prendra : le moins bon du sac (une recette prend toujours les
 * exemplaires les moins bons d'abord, `retirerExemplaires`). Sans module : ★.
 */
export function etoilesModule(inventaire: Inventaire): number {
  const m = exemplaires(inventaire, "module_decharge");
  return m.length ? Math.min(...m.map((e) => e.etoiles ?? 3)) : 1;
}

/**
 * Le maillon faible d'une arme électrique (Book 25 §5.2) : le module, la source, les contacts. Le pack de cellules et
 * la poignée de caoutchouc valent ★★★ ; les électrodes forgées donnent une étoile de plus (★★★★ avec une bobine), le
 * manche tourné encore une (★★★★★).
 */
function facteursArme(contacts: number, bonus: number): (inventaire: Inventaire) => number[] {
  return (inventaire) => [etoilesModule(inventaire) + bonus, 3 + bonus, contacts];
}

/** Les étoiles d'un objet rouillé passé au bain : une de plus, sans dépasser ★★ (la rouille ôtée ne fait pas l'acier). */
function derouille(type: TypeObjet): (inventaire: Inventaire) => number[] {
  return (inventaire) => {
    const e = exemplaires(inventaire, type);
    const moinsBon = e.length ? Math.min(...e.map((x) => x.etoiles ?? 1)) : 1;
    return [Math.min(2, moinsBon + 1)];
  };
}

export const RECETTES_VOLTAIQUES: Recette[] = [
  {
    // Le banc solaire (plan 0.8, chantier 7) : un banc de planches, la barre de la ruine, le support du panneau. Le
    // panneau de la station s'y pose ensuite (« poser le panneau », serveur/src/electricite.ts) : un seul meuble. La
    // batterie de la ruine se branche dessus ; sans panneau, la manivelle de la lampe à dynamo (le repli).
    id: "banc_recharge",
    lieu: POSEE,
    categorie: "ateliers",
    nom: "Banc solaire",
    produit: { installation: "banc_recharge" },
    ingredients: { buche: 2, barre_metal: 1, branche: 3 },
    qualites: { visser: 1, serrer: 1 },
    duree: 60,
    intensite: "moyenne",
    famille: "voltaiques",
  },

  // ---------- Les pièces (Book 25 §5.2) ----------
  {
    // Trois cellules de récupération, fatiguées (≈ 4 Wh utiles chacune) : 12 Wh portables.
    id: "pack_cellules",
    lieu: AU_BANC,
    categorie: "materiaux",
    nom: "Monter un pack de cellules",
    produit: { objet: "pack_cellules", quantite: 1 },
    ingredients: { cellule_lithium: 3, fil_cuivre: 1, ficelle: 1 },
    qualites: { visser: 1 },
    duree: 20,
    intensite: "legere",
    famille: "voltaiques",
  },
  {
    // Un seul module (0.8.2, R14 et Q-0.8.2-4) : un condensateur recâblé, le petit (démonté d'un flash jetable, ★) ou le
    // moyen (d'une raquette à moustiques, ★★). Le module prend l'étoile de son condensateur ; le moyen passe d'abord. Il
    // remplace les modules « au flash » et « à la raquette » de la 0.8 : un module déjà fait reste un module_decharge.
    id: "module_decharge",
    lieu: AU_BANC,
    categorie: "materiaux",
    nom: "Module de décharge",
    produit: { objet: "module_decharge", quantite: 1 },
    ingredients: { fil_cuivre: 1 },
    auChoix: [{ condensateur_moyen: 1 }, { petit_condensateur: 1 }],
    qualites: { visser: 1 },
    duree: 30,
    intensite: "legere",
    famille: "voltaiques",
    facteursEtoiles: (_inventaire, _contexte, facon) => [ETOILES_CONDENSATEUR[facon?.condensateur_moyen ? "condensateur_moyen" : "petit_condensateur"]],
  },
  {
    // La bobine d'allumage, attaquée par le petit condensateur (celui du flash) : la vraie haute tension (★★★), qui saute au voisin.
    id: "module_bobine",
    ...NIVEAU_2,
    lieu: AU_POSTE_DE_MONTAGE,
    categorie: "materiaux",
    nom: "Module de décharge (bobine)",
    produit: { objet: "module_decharge", quantite: 1 },
    ingredients: { bobine_allumage: 1, petit_condensateur: 1, fil_cuivre: 1 },
    qualites: { visser: 1 },
    duree: 30,
    intensite: "legere",
    famille: "voltaiques",
    facteursEtoiles: () => [3],
  },

  // ---------- Les armes (Book 25 §5.3) ----------
  {
    // La voie autonome : le kit suffit (la petite batterie, le couteau qui taille le gourdin), plus le petit condensateur
    // démonté d'un appareil photo jetable (0.8.2 : plus l'appareil entier). Une matraque déjà faite reste ce qu'elle est.
    id: "matraque_fortune",
    lieu: AU_BANC,
    categorie: "outils",
    nom: "Matraque de fortune",
    produit: { objet: "matraque_fortune", quantite: 1 },
    ingredients: { gourdin: 1, petit_condensateur: 1, petite_batterie: 1, ficelle: 1 },
    qualites: { visser: 1 },
    duree: 20,
    intensite: "legere",
    famille: "voltaiques",
    facteursEtoiles: () => [1],
    note: NOTE_PETITE_BATTERIE,
  },
  {
    // « La Raquette » : l'arme de métier. ★★ au module du condensateur moyen, ★★★ au module à bobine. Sa source : un
    // pack de cellules, ou la petite batterie du kit (R16, 0.8.2 : l'ancienne « Matraque électrique (petite batterie) »
    // de Q-A5, fondue ici) ; le pack passe d'abord. La petite batterie vaut ★★ : avec elle, la matraque ne passe pas ★★,
    // même au module à bobine.
    id: "matraque_electrique",
    lieu: AU_BANC,
    categorie: "outils",
    nom: "Matraque électrique",
    produit: { objet: "matraque_electrique", quantite: 1 },
    ingredients: { gourdin: 1, module_decharge: 1, caoutchouc: 1 },
    auChoix: [{ pack_cellules: 1 }, { petite_batterie: 1 }],
    qualites: { visser: 1, couper: 1 },
    duree: 40,
    intensite: "legere",
    famille: "voltaiques",
    facteursEtoiles: (inventaire, _contexte, facon) => [etoilesModule(inventaire), facon?.petite_batterie ? SOURCE_PETITE_BATTERIE : 3, 3],
    note: `Avec la petite batterie, ★★ au plus. ${NOTE_PETITE_BATTERIE}`,
  },
  {
    // L'amélioration du Charbonnier : deux pointes d'acier forgées pour tenir contre une tempe, un pack trié (deux
    // packs, la moitié des cellules jetée). Une étoile de plus : ★★★★ avec une bobine.
    id: "matraque_electrodes",
    ...NIVEAU_2,
    lieu: AU_POSTE_DE_MONTAGE,
    categorie: "outils",
    nom: "Matraque à électrodes forgées",
    produit: { objet: "matraque_electrique", quantite: 1 },
    ingredients: { gourdin: 1, module_decharge: 1, pack_cellules: 2, electrodes_forgees: 1, caoutchouc: 1 },
    qualites: { visser: 1, couper: 1 },
    duree: 45,
    intensite: "legere",
    famille: "voltaiques",
    facteursEtoiles: facteursArme(4, 1),
  },
  {
    // Le haut de gamme passe par les trois métiers (Book 25 §7.3) : électrodes 🔥, manche tourné et isolé ⚙️, montage ⚡.
    id: "matraque_manche_tourne",
    ...NIVEAU_2,
    lieu: AU_POSTE_DE_MONTAGE,
    categorie: "outils",
    nom: "Matraque à manche tourné",
    produit: { objet: "matraque_electrique", quantite: 1 },
    ingredients: { manche_tourne: 1, module_decharge: 1, pack_cellules: 2, electrodes_forgees: 1, caoutchouc: 1 },
    qualites: { visser: 1, couper: 1 },
    duree: 45,
    intensite: "legere",
    famille: "voltaiques",
    facteursEtoiles: facteursArme(5, 2),
  },
  {
    // La même décharge au bout d'un épieu : deux fils de cuivre courent jusqu'aux électrodes.
    id: "aiguillon",
    ...NIVEAU_2,
    lieu: AU_BANC,
    categorie: "outils",
    nom: "Aiguillon de défense",
    produit: { objet: "aiguillon", quantite: 1 },
    ingredients: { epieu: 1, module_decharge: 1, pack_cellules: 1, fil_cuivre: 2 },
    qualites: { visser: 1 },
    duree: 45,
    intensite: "legere",
    famille: "voltaiques",
    facteursEtoiles: facteursArme(3, 0),
  },

  // ---------- Le reste de la gamme (Book 25 §5.3) ----------
  {
    // Quatre LED, un pack, une boîte de conserve en réflecteur : à vendre aux deux autres familles.
    id: "lampe_bricolee",
    lieu: AU_BANC,
    categorie: "sur_soi",
    nom: "Lampe de poche bricolée",
    produit: { objet: "lampe_bricolee", quantite: 1 },
    ingredients: { pack_cellules: 1, led: 4, boite_vide: 1 },
    qualites: { visser: 1 },
    duree: 15,
    intensite: "legere",
    famille: "voltaiques",
  },
  {
    // Un fil tendu bas : un Éteint qui passe allume la LED, et l'alerte vibre. Sans un bruit : rien ne l'attire.
    id: "alarme_electrique",
    lieu: POSEE,
    categorie: "batir",
    nom: "Alarme électrique",
    produit: { installation: "alarme_electrique" },
    ingredients: { rouleau_fil_fer: 1, pile: 1, led: 1, petit_ressort: 1, branche: 2 },
    qualites: { visser: 1 },
    duree: 20,
    intensite: "legere",
    famille: "voltaiques",
  },
  {
    // La voie autonome de la défense (§2.5) : un module de raquette sur quatre mètres de fil, branché au banc.
    id: "cloture_fortune",
    lieu: POSEE,
    categorie: "batir",
    nom: "Clôture de fortune",
    produit: { installation: "cloture_fortune" },
    ingredients: { module_decharge: 1, rouleau_fil_fer: 1, branche: 6, plastique: 3 },
    qualites: { visser: 1 },
    duree: 60,
    intensite: "moyenne",
    famille: "voltaiques",
  },
  {
    // L'électrificateur : il envoie le courant du banc dans une clôture.
    id: "electrificateur",
    ...NIVEAU_2,
    lieu: AU_POSTE_DE_MONTAGE,
    categorie: "materiaux",
    nom: "Électrificateur",
    produit: { objet: "electrificateur", quantite: 1 },
    ingredients: { module_decharge: 1, resistance: 1, fil_cuivre: 1 },
    qualites: { visser: 1 },
    duree: 30,
    intensite: "legere",
    famille: "voltaiques",
  },
  {
    // La défense de la base : six mètres sur isolateurs de plastique ; à moins de 6 m du banc, qui la nourrit.
    id: "cloture_electrique",
    ...NIVEAU_2,
    lieu: POSEE,
    categorie: "batir",
    nom: "Clôture électrique",
    produit: { installation: "cloture_electrique" },
    ingredients: { electrificateur: 1, rouleau_fil_fer: 1, branche: 8, plastique: 4 },
    qualites: { visser: 1, couper: 1 },
    duree: 90,
    intensite: "moyenne",
    famille: "voltaiques",
  },
  {
    // Le piège électrique : une casserole aplatie au marteau, un module, un pack. Le premier qui marche dessus tombe.
    id: "plaque_choc",
    lieu: POSEE,
    categorie: "batir",
    nom: "Plaque de choc",
    produit: { installation: "plaque_choc" },
    ingredients: { casserole: 1, module_decharge: 1, pack_cellules: 1 },
    qualites: { visser: 1, marteler: 1 },
    duree: 30,
    intensite: "legere",
    famille: "voltaiques",
  },
  {
    // Pour les Charbonniers : la forge ventilée sans pomper (Book 25 §9.3, accessoire de la forge).
    id: "ventilateur_forge",
    ...NIVEAU_2,
    lieu: AU_POSTE_DE_MONTAGE,
    categorie: "ateliers",
    nom: "Ventilateur de forge 12 V",
    produit: { objet: "ventilateur_forge", quantite: 1 },
    ingredients: { petit_moteur: 1, pack_cellules: 1, plastique: 1 },
    qualites: { visser: 1 },
    duree: 20,
    intensite: "legere",
    famille: "voltaiques",
  },
  {
    // L'électrolyse (Book 04 §3.8) : une casserole d'eau salée, une barre sacrificielle, branchée au banc.
    id: "bain_derouillage",
    lieu: POSEE,
    categorie: "ateliers",
    nom: "Bain de dérouillage",
    produit: { installation: "bain_derouillage" },
    ingredients: { casserole: 1, barre_metal: 1 },
    qualites: { visser: 1 },
    duree: 20,
    intensite: "legere",
    famille: "voltaiques",
  },
  {
    // Douze heures de jeu dans le bain : la machette de fortune perd sa rouille, et gagne une étoile (★ → ★★).
    id: "derouiller_machette",
    lieu: aCote("bain_derouillage"),
    categorie: "outils",
    nom: "Dérouiller une machette",
    produit: { objet: "machette", quantite: 1 },
    ingredients: { machette: 1 },
    qualites: {},
    duree: 720,
    intensite: "legere",
    famille: "voltaiques",
    facteursEtoiles: derouille("machette"),
  },
];
