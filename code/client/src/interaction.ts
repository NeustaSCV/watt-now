// Ce que le joueur peut faire là où il se trouve : les actions proposées aux boutons A et B (Book 08 §3.3).
// A : interagir. B : examiner (Book 03 §6), ou une action secondaire près d'un feu.

import { PERIODES_FRUITIERS, enSaison, etatDuFruitier, phaseFruitier, visibleEnSaison } from "../../commun/src/calendrier.ts";
import type { Position } from "../../commun/src/deplacement.ts";
import { CAPACITES, type Charges } from "../../commun/src/energie.ts";
import { COMPTOIR, sortieIci, type LieuId, type LieuJouable } from "../../commun/src/lieux.ts";
import type { AutreVu, InstallationVue, MessageClient, SacVu, Verbe } from "../../commun/src/messages.ts";
import { nommer, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { RECETTES } from "../../commun/src/recettes.ts";
import { NOMS_FAMILLES, type Famille } from "../../commun/src/regles.ts";
import type { Gourde } from "../../commun/src/survie.ts";
import { DISTANCE_INTERACTION, EMPRISE_RESSOURCE, PORTEE_ARBRE, distanceMare, RAYON_ESCABEAU, USAGES, estFruitier, type TypeRessource } from "../../commun/src/terrain.ts";
import type { FeuDeCamp } from "./rendu/feu.ts";
import type { VueRessource } from "./rendu/ressources.ts";

export type ActionProposee =
  | { libelle: string; message: MessageClient }
  /** Action locale au client : afficher un texte, ou ouvrir le panneau de fabrication. */
  | { libelle: string; examiner: string }
  | { libelle: string; ouvrirFabrication: true }
  /** À une sortie : ouvrir la carte, la destination déjà choisie. */
  | { libelle: string; ouvrirCarte: LieuId }
  /** Au comptoir : ouvrir le guichet des Compteurs. */
  | { libelle: string; ouvrirGuichet: true }
  /** Près d'un coffre : ouvrir le coffre (ranger, reprendre). */
  | { libelle: string; ouvrirCoffre: number };

export interface Propositions {
  A: ActionProposee | null;
  B: ActionProposee | null;
  /** Position de ce qui est visé, pour le surligner. */
  /** `rayon` : l'emprise de ce qu'on vise, pour ajuster le cercle de visée (P-007). */
  cible: { x: number; z: number; rayon?: number } | null;
}

const EXAMENS_INSTALLATIONS: Record<InstallationVue["type"], string> = {
  etabli: "Un établi solide. On y fabrique ce qui demande de la précision.",
  abri: "Un appentis de branches et de bâche. De quoi dormir au sec, près du feu.",
  coffre: "Un coffre de planches, ficelé de corde. Ce que tu y ranges ne pèse plus sur ton dos.",
  charbonniere: "Une meule de bois couverte de terre. Allumée, elle cuit trois jours en fumant beaucoup.",
  forge: "Un foyer de pierres, un soufflet, une pierre plate pour enclume. Il faut du charbon de bois.",
  pedalier: "Un vieux cadre de vélo sur un bâti de bois. Il entraîne ce qu'on y monte : une meule, une dynamo.",
  banc_recharge: "Des pinces, des fils et un régulateur bricolé : on passe l'énergie d'une batterie à l'autre.",
  panneau_solaire: "Le petit panneau de la station, plein sud. Il charge les batteries posées sur le banc, même quand tu n'es pas là.",
  escabeau: "Un escabeau de bois ligaturé de corde. Posé au pied d'un arbre fruitier, dans son cercle, il permet de cueillir en haut.",
  recuperateur_pluie: "Une bâche tendue en entonnoir au-dessus d'une bassine. Quand il pleut, elle se remplit, même quand tu n'es pas là. L'eau du ciel se boit sans la faire bouillir.",
  alarme_boites: "Une ficelle tendue entre deux piquets, des boîtes de conserve qui pendent. Si un Éteint passe, tu l'entendras. Lui aussi.",
  lit_branchages: "Un cadre de branches couvert de rameaux. On y dort isolé du sol : à côté de l'abri, le sommeil répare mieux.",
  decharge: "Un tas d'ordures de l'Âge de l'Abondance, au bord du terrain. La pluie et le temps en font remonter des objets : surtout des trucs nuls, parfois une bonne surprise.",
};

/** La famille qui sait se servir d'une installation (celle qui sait la construire). */
function familleDe(type: InstallationVue["type"]): Famille | "tous" {
  return RECETTES.find((r) => "installation" in r.produit && r.produit.installation === type)?.famille ?? "tous";
}

/** Ce que propose une installation de famille selon son état (le serveur vérifie tout). */
function actionsInstallation(
  i: InstallationVue,
  repos: number,
  famille: Famille,
  inventaire: Inventaire,
  charges: Charges,
  maintenantServeur: number,
): [ActionProposee | null, ActionProposee | null] {
  const msg = (libelle: string, verbe: Verbe): ActionProposee => ({ libelle, message: { t: "interagir", cible: { genre: "installation", id: i.id }, verbe } });
  const examiner: ActionProposee = { libelle: "Examiner", examiner: EXAMENS_INSTALLATIONS[i.type] };
  const sienne = familleDe(i.type);
  if (sienne !== "tous" && sienne !== famille) return [null, { libelle: "Examiner", examiner: `${EXAMENS_INSTALLATIONS[i.type]} Tu ne sais pas t'en servir.` }];
  switch (i.type) {
    case "etabli":
      return [{ libelle: "Travailler à l'établi", ouvrirFabrication: true }, examiner];
    case "coffre":
      return [{ libelle: "Ouvrir le coffre", ouvrirCoffre: i.id }, examiner];
    case "escabeau":
      return [msg("Porter l'escabeau", "porter"), examiner];
    case "abri":
      // Dormir à l'abri récupère deux fois plus vite que par terre (É5, Book 05 §3).
      return [repos < 0.97 ? msg("Dormir dans l'abri", "dormir") : null, examiner];
    case "lit_branchages":
      return [repos < 0.97 ? msg("Dormir sur le lit", "dormir") : null, examiner];
    case "decharge": {
      // La décharge (P-001) : on y fouille comme dans un coffre, objet par objet.
      const n = Object.values(i.etat.contenu ?? {}).reduce((t, x) => t + (x ?? 0), 0);
      return [
        n > 0 ? { libelle: `Fouiller la décharge (${n} objet${n > 1 ? "s" : ""})`, ouvrirCoffre: i.id } : null,
        n > 0 ? examiner : { libelle: "Examiner", examiner: `${EXAMENS_INSTALLATIONS.decharge} Rien de neuf pour l'instant : reviens plus tard.` },
      ];
    }
    case "recuperateur_pluie": {
      const l = i.etat.litres ?? 0;
      const examen: ActionProposee = { libelle: "Examiner", examiner: `${EXAMENS_INSTALLATIONS.recuperateur_pluie} Dans la bassine : ${l.toFixed(1).replace(".", ",")} L.` };
      return [l >= 0.1 && (inventaire.gourde ?? 0) > 0 ? msg(`Remplir la gourde (eau de pluie, ${l.toFixed(1).replace(".", ",")} L)`, "remplir_pluie") : null, examen];
    }
    case "forge":
      return [{ libelle: "Travailler à la forge", ouvrirFabrication: true }, examiner];
    case "charbonniere": {
      if (!i.etat.pretLe) return [msg("Allumer la meule", "allumer_meule"), examiner];
      const reste = i.etat.pretLe - maintenantServeur;
      if (reste > 0) {
        const minutes = Math.ceil(reste / 60_000);
        return [null, { libelle: "Examiner", examiner: `La meule fume. Le charbon sera prêt dans ${minutes} min réelle${minutes > 1 ? "s" : ""}.` }];
      }
      return [msg("Défourner le charbon", "defourner"), examiner];
    }
    case "pedalier": {
      if (!i.etat.dynamo && (inventaire.dynamo_velo ?? 0) > 0) return [msg("Monter la dynamo", "monter_dynamo"), examiner];
      if (!i.etat.meule && (inventaire.pierre ?? 0) >= 3) return [msg("Monter la meule (3 pierres)", "monter_meule"), examiner];
      const pedaler = i.etat.dynamo ? msg("Pédaler : charger la batterie", "pedaler") : null;
      const affuter = i.etat.meule && (inventaire.couteau ?? 0) > 0 ? msg("Affûter le couteau", "affuter") : null;
      return [pedaler ?? affuter, pedaler && affuter ? affuter : examiner];
    }
    case "banc_recharge": {
      // Sur le banc : les batteries posées, que le panneau charge, même hors ligne (É4).
      const posees = Object.values(i.etat.batteries ?? {}).some((n) => (n ?? 0) > 0);
      const portees = (inventaire.petite_batterie ?? 0) > 0 || (inventaire.batterie_voiture ?? 0) > 0;
      const surBanc = Object.entries(i.etat.charges ?? {})
        .map(([b, wh]) => `${b === "petite_batterie" ? "petite batterie" : "batterie de voiture"} ${Math.round(wh ?? 0)} Wh`)
        .join(", ");
      const examen: ActionProposee = { libelle: "Examiner", examiner: posees ? `Sur le banc : ${surBanc}.` : EXAMENS_INSTALLATIONS.banc_recharge };
      if (posees) return [msg("Reprendre les batteries", "reprendre_batteries"), examen];
      const place = CAPACITES.petite_batterie * (inventaire.petite_batterie ?? 0) - (charges.petite_batterie ?? 0);
      if ((charges.batterie_voiture ?? 0) > 1 && place > 0.5) return [msg("Recharger la petite batterie", "recharger"), portees ? msg("Poser les batteries sur le banc", "poser_batteries") : examen];
      return [portees ? msg("Poser les batteries sur le banc", "poser_batteries") : null, examen];
    }
    default:
      return [null, examiner];
  }
}

/** Ce que montre un arbre fruitier hors saison (A ne fait que le dire). */
function libelleHorsSaison(type: TypeRessource, jour: number): string {
  if (!(type in PERIODES_FRUITIERS)) return "Pas la saison";
  const phase = phaseFruitier(type as keyof typeof PERIODES_FRUITIERS, jour);
  return phase === "fleurs" ? "En fleurs" : phase === "verts" ? "Fruits encore verts" : "Plus de fruits cette année";
}

export function proposer(
  position: Position,
  lieu: LieuJouable,
  famille: Famille,
  ressources: Iterable<VueRessource>,
  feux: Iterable<FeuDeCamp>,
  installations: Iterable<InstallationVue>,
  inventaire: Inventaire,
  gourde: Gourde,
  charges: Charges,
  maintenantServeur: number,
  sacs: readonly SacVu[] = [],
  autres: readonly AutreVu[] = [],
  repos = 1,
  animaux: readonly { id: number; x: number; z: number; robe: number }[] = [],
  /** Le jour du calendrier (0 : inconnu) : les récoltes suivent la saison. */
  jour = 0,
): Propositions {
  // Un objet lourd dans les bras : A le pose devant soi, rien d'autre (les bras sont pris).
  const installationsVues = [...installations];
  if (installationsVues.some((i) => i.etat.portee)) {
    return {
      A: { libelle: "Poser l'escabeau", message: { t: "poser" } },
      B: { libelle: "Examiner", examiner: "Tu portes l'escabeau : on marche, on ne court pas. Pose-le dans le cercle d'un arbre fruitier pour cueillir." },
      cible: null,
    };
  }
  installations = installationsVues;
  // La cible la plus proche, parmi ce qui est à portée de main.
  const meilleure: { distance: number; propositions: Propositions | null } = { distance: Infinity, propositions: null };
  const garder = (distance: number, propositions: Propositions) => {
    if (distance <= DISTANCE_INTERACTION && distance < meilleure.distance) {
      meilleure.distance = distance;
      meilleure.propositions = propositions;
    }
  };

  for (const r of ressources) {
    if (!r.donnees.disponible) continue;
    // Un champignon hors saison n'est pas là ; un fruitier hors saison se regarde seulement.
    if (jour > 0 && !visibleEnSaison(r.donnees.type, jour)) continue;
    const usage = USAGES[r.donnees.type];
    const horsSaison = jour > 0 && !enSaison(r.donnees.type, jour);
    const arbre = estFruitier(r.donnees.type);
    const d = Math.max(0, Math.hypot(r.donnees.x - position.x, r.donnees.z - position.z) - (arbre ? PORTEE_ARBRE : 0));
    // Un fruitier sans escabeau dans son cercle : on le dit tout de suite (rien ne se lance pour rien).
    const escabeau = !usage.escabeau || installationsVues.some((i) => i.type === "escabeau" && Math.hypot(i.x - r.donnees.x, i.z - r.donnees.z) <= RAYON_ESCABEAU);
    garder(d, {
      A: horsSaison
        ? { libelle: libelleHorsSaison(r.donnees.type, jour), examiner: etatDuFruitier(r.donnees.type, jour) ?? "Ce n'est pas la saison." }
        : escabeau
        ? { libelle: usage.libelle, message: { t: "interagir", cible: { genre: "ressource", id: r.donnees.id }, verbe: usage.verbe } }
        : { libelle: `${usage.libelle} (escabeau)`, examiner: "Les fruits sont trop haut. Pose un escabeau au pied de l'arbre, dans le cercle, puis monte cueillir." },
      B: { libelle: "Examiner", examiner: arbre && jour > 0 ? `${usage.examen} ${etatDuFruitier(r.donnees.type, jour)}` : usage.examen },
      cible: { x: r.donnees.x, z: r.donnees.z, rayon: EMPRISE_RESSOURCE[r.donnees.type] ?? 0.5 },
    });
  }

  for (const i of installations) {
    // La décharge est un grand tas : on la vise depuis son bord (P-001).
    const d = Math.max(0, Math.hypot(i.x - position.x, i.z - position.z) - (i.type === "decharge" ? 1.9 : 0.6));
    const [A, B] = actionsInstallation(i, repos, famille, inventaire, charges, maintenantServeur);
    garder(d, { A, B, cible: { x: i.x, z: i.z, rayon: i.type === "decharge" ? 2.1 : i.type === "escabeau" || i.type === "alarme_boites" ? 0.7 : 1.1 } });
  }

  const aDuBois = (inventaire.buche ?? 0) > 0 || (inventaire.branche ?? 0) > 0;
  const peutAllumer = (inventaire.briquet ?? 0) > 0 || (inventaire.pierre_a_feu ?? 0) > 0;
  for (const f of feux) {
    const d = Math.hypot(f.x - position.x, f.z - position.z) - 0.4;
    const ajouter: ActionProposee | null = aDuBois
      ? { libelle: "Ajouter du bois", message: { t: "interagir", cible: { genre: "feu", id: f.id }, verbe: "ajouter_bois" } }
      : null;
    const allumer: ActionProposee | null =
      peutAllumer && f.bois > 0 ? { libelle: "Allumer le feu", message: { t: "interagir", cible: { genre: "feu", id: f.id }, verbe: "allumer" } } : null;
    const bouillir: ActionProposee | null =
      gourde.contenu === "brute" && gourde.litres > 0
        ? { libelle: "Faire bouillir l'eau", message: { t: "interagir", cible: { genre: "feu", id: f.id }, verbe: "bouillir" } }
        : null;
    const brule = f.aspect === "flammes" || f.aspect === "braises";
    // De la volaille crue : la rôtir passe avant le reste (2026-10-08).
    const rotir: ActionProposee | null =
      brule && (inventaire.volaille_crue ?? 0) > 0 ? { libelle: "Faire rôtir la volaille", message: { t: "interagir", cible: { genre: "feu", id: f.id }, verbe: "rotir" } } : null;
    garder(Math.max(0, d), {
      A: f.aspect === "eteint" ? (allumer ?? ajouter) : brule ? (rotir ?? bouillir ?? ajouter) : ajouter,
      B: f.aspect === "eteint" ? (allumer ? ajouter : null) : brule && (rotir || bouillir) ? ajouter : null,
      cible: { x: f.x, z: f.z, rayon: 0.7 },
    });
  }

  // La volaille ensauvagée : il faut l'approcher sans l'effrayer (allure discrète), puis l'assommer (2026-10-08).
  for (const a of animaux) {
    garder(Math.max(0, Math.hypot(a.x - position.x, a.z - position.z) - 0.3), {
      A: { libelle: "Assommer la poule", message: { t: "interagir", cible: { genre: "animal", id: a.id }, verbe: "assommer" } },
      B: {
        libelle: "Examiner",
        examiner: `Une poule ${["rousse", "blanche", "noire"][a.robe % 3]} de la ferme, retournée à l'état sauvage. Elle se méfie : approche-toi en allure discrète, sans geste brusque, et frappe avant qu'elle détale. Il faut au moins un gourdin.`,
      },
      cible: { x: a.x, z: a.z },
    });
  }

  // Au Carrefour : le guichet des Compteurs, et leur pédalier.
  if (lieu === "comptoir") {
    garder(Math.max(0, Math.hypot(COMPTOIR.guichet.x - position.x, COMPTOIR.guichet.z - position.z) - 0.8), {
      A: { libelle: "Aller au guichet", ouvrirGuichet: true },
      B: { libelle: "Examiner", examiner: "Un guichet grillagé, une lampe électrique, des registres, des tampons. Les Compteurs : pointilleux, procéduriers, honnêtes." },
      cible: { x: COMPTOIR.guichet.x, z: COMPTOIR.guichet.z },
    });
    garder(Math.max(0, Math.hypot(COMPTOIR.pedalier.x - position.x, COMPTOIR.pedalier.z - position.z) - 0.6), {
      A: { libelle: "Pédaler pour les Compteurs", message: { t: "interagir", cible: { genre: "comptoir" }, verbe: "pedaler_comptoir" } },
      B: { libelle: "Examiner", examiner: "Leur pédalier charge les cellules. Ils paient comptant : 60 wotts l'heure, pris sur leur trésorerie." },
      cible: { x: COMPTOIR.pedalier.x, z: COMPTOIR.pedalier.z },
    });
  }

  // Un autre joueur : on peut lui proposer un échange (É4, lot 3). Pas de chat : une fenêtre et deux accords.
  for (const a of autres) {
    garder(Math.max(0, Math.hypot(a.x - position.x, a.z - position.z) - 0.6), {
      A: { libelle: `Proposer un échange à ${a.pseudo}`, message: { t: "echange", op: { genre: "proposer", a: a.id } } },
      B: { libelle: "Examiner", examiner: `${a.pseudo}, de la famille des ${NOMS_FAMILLES[a.famille]}.` },
      cible: { x: a.x, z: a.z },
    });
  }

  // Un sac tombé là après un effondrement (Book 05 §10.3), ou des objets jetés par terre.
  for (const s of sacs) {
    if (s.jete) {
      const liste = Object.entries(s.contenu ?? {}).map(([t, n]) => nommer(t as TypeObjet, n ?? 0));
      garder(Math.hypot(s.x - position.x, s.z - position.z), {
        A: { libelle: `Ramasser : ${liste.join(", ")}`, message: { t: "interagir", cible: { genre: "sac", id: s.id }, verbe: "reprendre" } },
        B: { libelle: "Examiner", examiner: s.aMoi ? `Ce que tu as posé là : ${liste.join(", ")}.` : `Quelqu'un a laissé ça par terre : ${liste.join(", ")}.` },
        cible: { x: s.x, z: s.z },
      });
      continue;
    }
    garder(Math.hypot(s.x - position.x, s.z - position.z), {
      A: s.aMoi ? { libelle: "Reprendre ton sac", message: { t: "interagir", cible: { genre: "sac", id: s.id }, verbe: "reprendre" } } : null,
      B: { libelle: "Examiner", examiner: s.aMoi ? "Ton sac, là où tu es tombé. Tout y est encore." : "Le sac de quelqu'un d'autre, tombé là." },
      cible: { x: s.x, z: s.z },
    });
  }

  // Une sortie : on y prend la route (la carte s'ouvre). Elle passe avant le reste quand on s'y tient.
  const sortie = sortieIci(lieu, position.x, position.z);
  if (sortie) {
    garder(0, {
      A: { libelle: sortie.libelle, ouvrirCarte: sortie.vers },
      B: { libelle: "Examiner", examiner: lieu === "terrain" ? "Le chemin de terre rejoint la route de la Campagne, vers la station-service." : "La route continue. Au bout, il faudra la carte." },
      cible: null,
    });
  }

  const dMare = Math.max(0, distanceMare(position.x, position.z) - 0.5);
  if (lieu === "terrain" && (inventaire.gourde ?? 0) > 0) {
    garder(dMare, {
      A: { libelle: "Remplir la gourde", message: { t: "interagir", cible: { genre: "mare" }, verbe: "remplir" } },
      B: { libelle: "Examiner", examiner: "Une mare d'eau dormante. L'eau n'est pas potable : il faut la faire bouillir." },
      cible: null,
    });
  }

  return meilleure.propositions ?? { A: null, B: null, cible: null };
}
