// Ce que le joueur peut faire là où il se trouve : les actions proposées aux boutons A et B (Book 08 §3.3).
// A : interagir. B : examiner (Book 03 §6), ou une action secondaire près d'un feu.

import { PERIODES_FRUITIERS, enSaison, etatDuFruitier, phaseFruitier, visibleEnSaison } from "../../commun/src/calendrier.ts";
import type { Position } from "../../commun/src/deplacement.ts";
import { armeDeCle } from "../../commun/src/combat.ts";
import { CAPACITES, type Charges } from "../../commun/src/energie.ts";
import { COMPTOIR, destinations, sortieIci, type LieuId, type LieuJouable } from "../../commun/src/lieux.ts";
import { KLAXONS_PAR_BATTERIE, LEURRES, PORTES, chargeBatterieTracteur, distancePorte } from "../../commun/src/cooperative.ts";
import type { AutreVu, EtatCoopVu, InstallationVue, MessageClient, SacVu, Verbe } from "../../commun/src/messages.ts";
import { nommer, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { RECETTES } from "../../commun/src/recettes.ts";
import { ENCLUMES, NIVEAU_FORGE_VENTILEE, enclumeDuSac } from "../../commun/src/forge.ts";
import { NOMS_FAMILLES, type Famille } from "../../commun/src/regles.ts";
import type { Gourde } from "../../commun/src/survie.ts";
import { DISTANCE_INTERACTION, EMPRISE_RESSOURCE, PORTEE_ARBRE, distanceMare, RAYON_ESCABEAU, USAGES, estArbre, estFruitier, type TypeRessource } from "../../commun/src/terrain.ts";
import type { FeuDeCamp } from "./rendu/feu.ts";
import type { VueRessource } from "./rendu/ressources.ts";

export type ActionProposee =
  | { libelle: string; message: MessageClient }
  /** Action locale au client : afficher un texte, ou ouvrir le panneau de fabrication. */
  | { libelle: string; examiner: string }
  | { libelle: string; ouvrirFabrication: true }
  /** À une sortie : ouvrir la carte, la destination déjà choisie. */
  | { libelle: string; ouvrirCarte: readonly LieuId[] }
  /** Au comptoir : ouvrir le guichet des Compteurs. */
  | { libelle: string; ouvrirGuichet: true }
  /** Près d'un coffre : ouvrir le coffre (ranger, reprendre). */
  | { libelle: string; ouvrirCoffre: number }
  /** Un feu ou une installation à soi : sa fiche (ce qu'il fait, l'améliorer, le démonter ; Book 24). */
  | { libelle: string; ouvrirFiche: { genre: "feu" | "installation"; id: number } };

export interface Propositions {
  A: ActionProposee | null;
  B: ActionProposee | null;
  /** Position de ce qui est visé, pour le surligner. */
  /** `rayon` : l'emprise de ce qu'on vise, pour ajuster le cercle de visée (P-007). */
  cible: { x: number; z: number; rayon?: number } | null;
}

export const EXAMENS_INSTALLATIONS: Record<InstallationVue["type"], string> = {
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
  // Le métier des familles (Book 25, 0.6) : les chantiers 6 et 7 les font vivre.
  alarme_electrique: "Un fil de fer tendu bas, une pile, une LED. Si un Éteint passe, la LED s'allume et ton alerte vibre, sans un bruit.",
  cloture_fortune: "Quatre mètres de fil de fer sur des piquets, isolés au plastique, branchés au banc. L'Éteint qui la touche se raidit.",
  cloture_electrique: "Six mètres de fil sous tension, sur isolateurs. Un Éteint ne passe pas tant que le courant passe ; à trois, ils la couchent.",
  plaque_choc: "Une tôle posée dans le passage, branchée à un pack. Le premier qui marche dessus tombe à terre.",
  bain_derouillage: "Une casserole d'eau salée, une barre sacrificielle, du courant du banc : la rouille s'en va, lentement.",
  collet: "Un nœud coulant de ficelle tendu sur une coulée. Pour les lapins, pas pour les Éteints.",
  assommoir: "Deux bûches en équilibre sur une détente. Le premier qui passe dessous est mis à terre.",
  machoires_fortune: "Deux lames de ressort brutes, armées en mâchoires. Elles brisent une jambe, et se faussent vite.",
  piege_machoires: "Deux ressorts retrempés, armés en mâchoires, ancrés à la chaîne. L'Éteint pris ne repart plus que sur les mains.",
  fosse_pieux: "Une fosse creusée sur le passage, des pieux au fond. Celui qui tombe reste coincé.",
  tour_perche: "Une perche de frêne en ressort, une corde, une pédale : le bois tourne, et le ciseau le façonne.",
  // Le niveau 1 (plan 0.8, chantier 6).
  ratelier_outils: "Deux perches et des chevilles contre un piquet : chaque outil a sa place. Rangé ici, il sert à tout ce qu'on bâtit autour.",
  torche_plantee: "Une branche plantée, un chiffon gras qui brûle au bout. Elle éclaire six mètres autour, une heure durant.",
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
  // Examiner ouvre la fiche : ce qu'elle fait, l'améliorer, la démonter (Book 24). La décharge, elle, se regarde.
  const examiner: ActionProposee = i.type === "decharge" ? { libelle: "Examiner", examiner: EXAMENS_INSTALLATIONS[i.type] } : { libelle: "Examiner", ouvrirFiche: { genre: "installation", id: i.id } };
  const sienne = familleDe(i.type);
  if (sienne !== "tous" && sienne !== famille) return [null, { libelle: "Examiner", examiner: `${EXAMENS_INSTALLATIONS[i.type]} Tu ne sais pas t'en servir.` }];
  switch (i.type) {
    case "etabli": {
      // Le redresseur de fûts (Book 25 §9.3) : proposé tant qu'il manque, si l'on a de quoi le monter.
      const redresseur = !i.etat.redresseur && (inventaire.branche ?? 0) >= 2 && (inventaire.pierre ?? 0) >= 1;
      return [{ libelle: "Travailler à l'établi", ouvrirFabrication: true }, redresseur ? msg("Monter le redresseur de fûts", "monter_redresseur") : examiner];
    }
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
      return [l >= 0.1 && (inventaire.gourde ?? 0) > 0 ? msg(`Remplir la gourde (eau de pluie, ${l.toFixed(1).replace(".", ",")} L)`, "remplir_pluie") : null, examiner];
    }
    case "forge": {
      // B : un accessoire à poser, s'il y a de quoi dans le sac (Book 25 §9.3) ; sinon, la fiche (améliorer la forge).
      const enclume = enclumeDuSac(inventaire);
      const posee = i.etat.enclume ? ENCLUMES[i.etat.enclume].etoiles : 2;
      const accessoire =
        enclume && ENCLUMES[enclume].etoiles > posee
          ? msg(`Poser l'enclume (${ENCLUMES[enclume].nom.replace(/^l'|^la |^le /, "")})`, "poser_enclume")
          : !i.etat.ventilateur && (i.niveau ?? 1) >= NIVEAU_FORGE_VENTILEE && (inventaire.ventilateur_forge ?? 0) > 0
            ? msg("Monter le ventilateur", "monter_ventilateur")
            : i.etat.bac && (inventaire.bidon_huile ?? 0) > 0
              ? msg("Verser l'huile dans le bac", "verser_huile")
              : !i.etat.bac && (inventaire.casserole ?? 0) > 0 && ((inventaire.bidon_huile ?? 0) > 0 || (inventaire.graisse ?? 0) > 0)
                ? msg("Poser le bac de trempe (casserole)", "poser_bac")
                : null;
      return [{ libelle: "Travailler à la forge", ouvrirFabrication: true }, accessoire ?? examiner];
    }
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
      if (!i.etat.dynamo && (inventaire.dynamo_velo ?? 0) > 0) return [msg("Installer la dynamo", "monter_dynamo"), examiner];
      if (!i.etat.meule && (inventaire.pierre ?? 0) >= 3) return [msg("Installer la meule (3 pierres)", "monter_meule"), examiner];
      const pedaler = i.etat.dynamo ? msg("Pédaler : charger la batterie", "pedaler") : null;
      const affuter = i.etat.meule && (inventaire.couteau ?? 0) > 0 ? msg("Affûter le couteau", "affuter") : null;
      // Les accessoires mécanistes (Book 25 §6.4) : proposés quand on a de quoi les monter, sans prendre la place du reste.
      const accessoire = accessoirePedalier(i, inventaire, msg);
      if (!pedaler && !affuter && accessoire) return [accessoire, examiner];
      return [pedaler ?? affuter, pedaler && affuter ? affuter : (accessoire ?? examiner)];
    }
    case "plaque_choc": {
      // Book 25 §5.3 : une décharge, puis il faut la réarmer (0,5 Wh).
      const armee = i.etat.declencheur?.arme ?? true;
      return [armee ? null : msg("Réarmer la plaque (0,5 Wh)", "rearmer_piege"), { libelle: "Examiner", examiner: `${EXAMENS_INSTALLATIONS.plaque_choc} ${armee ? "Elle est armée." : "Elle a servi : réarme-la."}` }];
    }
    case "cloture_fortune":
    case "cloture_electrique": {
      // Elle tire son courant d'un banc chargé à moins de 6 m ; trois Éteints qui poussent la couchent.
      const d = i.etat.declencheur;
      if (d?.couche) return [msg("Relever la clôture", "rearmer_piege"), { libelle: "Examiner", examiner: "Couchée : trois Éteints ont poussé ensemble. Relève-la." }];
      const courant = d?.arme === false ? "Le courant ne passe pas : il lui faut un banc chargé à moins de 6 m." : "Le courant passe.";
      return [null, { libelle: "Examiner", examiner: `${EXAMENS_INSTALLATIONS[i.type]} ${courant}` }];
    }
    // ⚙️ Les pièges (Book 25 §6.3) : réarmer ce qui a pris ; le tour à perche, un atelier.
    case "assommoir":
    case "machoires_fortune":
    case "piege_machoires":
    case "fosse_pieux": {
      const d = i.etat.declencheur;
      if (d?.fausse) return [null, { libelle: "Examiner", examiner: "Faussées : elles ne se réarment plus. Démonte-les, refais-en." }];
      return [d && !d.arme ? msg(i.type === "fosse_pieux" ? "Dégager la fosse" : "Réarmer le piège", "rearmer_piege") : null, examiner];
    }
    case "tour_perche":
      return [{ libelle: "Travailler au tour", ouvrirFabrication: true }, examiner];
    case "banc_recharge": {
      // Sur le banc : les batteries posées, que le panneau charge, même hors ligne (É4).
      const posees = Object.values(i.etat.batteries ?? {}).some((n) => (n ?? 0) > 0);
      // Les armes électriques (Book 25 §5.4) : on les recharge aux batteries du banc.
      const armes = Object.keys(inventaire).some((cle) => (inventaire[cle as keyof typeof inventaire] ?? 0) > 0 && armeDeCle(cle)?.electrique);
      if (armes && posees) return [msg("Recharger tes armes électriques", "recharger_armes"), msg("Reprendre les batteries", "reprendre_batteries")];
      const portees = (inventaire.petite_batterie ?? 0) > 0 || (inventaire.batterie_voiture ?? 0) > 0;
      const surBanc = Object.entries(i.etat.charges ?? {})
        .map(([b, wh]) => `${b === "petite_batterie" ? "petite batterie" : "batterie de voiture"} ${Math.round(wh ?? 0)} Wh`)
        .join(", ");
      const examen: ActionProposee = posees ? { libelle: "Examiner", examiner: `Sur le banc : ${surBanc}.` } : examiner;
      if (posees) return [msg("Reprendre les batteries", "reprendre_batteries"), examen];
      const place = CAPACITES.petite_batterie * (inventaire.petite_batterie ?? 0) - (charges.petite_batterie ?? 0);
      if ((charges.batterie_voiture ?? 0) > 1 && place > 0.5) return [msg("Recharger la petite batterie", "recharger"), portees ? msg("Poser les batteries sur le banc", "poser_batteries") : examen];
      return [portees ? msg("Poser les batteries sur le banc", "poser_batteries") : null, examen];
    }
    default:
      return [null, examiner];
  }
}

/** Le soufflet à manivelle, la meule fine (Book 25 §6.4) : à monter sur le pédalier, si l'on a de quoi. */
function accessoirePedalier(i: InstallationVue, inventaire: Inventaire, msg: (libelle: string, verbe: Verbe) => ActionProposee): ActionProposee | null {
  const a = (t: TypeObjet, n = 1) => (inventaire[t] ?? 0) >= n;
  if (i.etat.meule && !i.etat.meuleFine && a("pierre") && a("chiffons")) return msg("Monter la meule fine", "monter_meule_fine");
  if (!i.etat.soufflet && a("roue_velo") && a("bache") && a("branche", 4)) return msg("Monter le soufflet à manivelle", "monter_soufflet");
  return null;
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
  /** À la Coopérative : l'état de ses portes (ouverte : true). */
  portes: Readonly<Record<string, boolean>> | null = null,
  /** À la Coopérative : les leurres en marche (la radio allumée). */
  leurresActifs: ReadonlySet<string> = new Set(),
  /** À la Coopérative : où est la radio, ce qui reste au klaxon (0.5.1). */
  etatCoop: EtatCoopVu | null = null,
): Propositions {
  const ressourcesVues = [...ressources];
  ressources = ressourcesVues;
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
    const arbre = estArbre(r.donnees.type);
    const fruitier = estFruitier(r.donnees.type);
    const d = Math.max(0, Math.hypot(r.donnees.x - position.x, r.donnees.z - position.z) - (arbre ? PORTEE_ARBRE : 0));
    // Un fruitier sans escabeau dans son cercle : on le dit tout de suite (rien ne se lance pour rien).
    const escabeau = !usage.escabeau || installationsVues.some((i) => i.type === "escabeau" && Math.hypot(i.x - r.donnees.x, i.z - r.donnees.z) <= RAYON_ESCABEAU);
    garder(d, {
      A: horsSaison
        ? { libelle: libelleHorsSaison(r.donnees.type, jour), examiner: etatDuFruitier(r.donnees.type, jour) ?? "Ce n'est pas la saison." }
        : escabeau
        ? { libelle: usage.libelle, message: { t: "interagir", cible: { genre: "ressource", id: r.donnees.id }, verbe: usage.verbe } }
        : { libelle: `${usage.libelle} (escabeau)`, examiner: "Les fruits sont trop haut. Pose un escabeau au pied de l'arbre, dans le cercle, puis monte cueillir." },
      B: {
        libelle: "Examiner",
        examiner:
          r.donnees.type === "coop_batterie"
            ? examenBatterieTracteur(etatCoop?.klaxons ?? KLAXONS_PAR_BATTERIE, famille)
            : fruitier && jour > 0
              ? `${usage.examen} ${etatDuFruitier(r.donnees.type, jour)}`
              : usage.examen,
      },
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
    // Un feu couvert sous la cendre se ranime sans briquet (Book 24 §3.1).
    const ranimer: ActionProposee | null = f.vue.couvert ? { libelle: "Ranimer le feu", message: { t: "interagir", cible: { genre: "feu", id: f.id }, verbe: "ranimer" } } : null;
    garder(Math.max(0, d), {
      A: ranimer ?? (f.aspect === "eteint" ? (allumer ?? ajouter) : brule ? (rotir ?? bouillir ?? ajouter) : ajouter),
      // Examiner : la fiche du foyer, avec tout ce qu'on peut y faire (ajouter du bois, l'améliorer, le creuser…).
      B: { libelle: "Examiner", ouvrirFiche: { genre: "feu", id: f.id } },
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

  // À la Coopérative : ouvrir une porte, ou la refermer derrière soi (Book 23 §2.2 : c'est la meilleure retraite).
  if (portes) {
    for (const p of PORTES) {
      const ouverte = portes[p.id] ?? p.ouverte;
      garder(distancePorte(p, position.x, position.z) + 0.3, {
        A: ouverte
          ? { libelle: "Refermer la porte", message: { t: "interagir", cible: { genre: "porte", id: p.id }, verbe: "fermer_porte" } }
          : { libelle: "Ouvrir la porte", message: { t: "interagir", cible: { genre: "porte", id: p.id }, verbe: "ouvrir_porte" } },
        B: {
          libelle: "Examiner",
          examiner: ouverte
            ? "Une porte ouverte. Refermée derrière toi, elle arrête un Éteint : il pousse, mais il ne passe pas."
            : "Une porte fermée. Ce qu'il y a derrière, tu ne le sauras qu'en l'ouvrant… ou en écoutant.",
        },
        cible: { x: p.x, z: p.z },
      });
    }
  }

  // À la Coopérative : les leurres du décor (Book 23 §4.7). Un bruit qui attire les Éteints ailleurs que sur soi.
  if (portes) {
    // Le klaxon : tant que la batterie est dans le tracteur (0.5.1 : on peut la démonter et l'emporter).
    const klaxons = etatCoop?.klaxons ?? KLAXONS_PAR_BATTERIE;
    const batterie = ressourcesVues.find((r) => r.donnees.type === "coop_batterie");
    const batterieEnPlace = !batterie || batterie.donnees.disponible;
    const wh = Math.round(chargeBatterieTracteur(klaxons));
    const examenKlaxon = !batterieEnPlace
      ? "Le klaxon du tracteur rouge. Plus de batterie sous le capot : il ne sonnera plus, tant qu'une autre ne se sera pas retrouvée là."
      : klaxons > 0
        ? `Le klaxon du tracteur rouge : de quoi faire venir tous les Éteints du coin. Encore ${klaxons} coup${klaxons > 1 ? "s" : ""} : chacun vide un quart de la batterie (il lui reste ≈ ${wh} Wh), qui ne se recharge pas ici.`
        : "Le klaxon du tracteur rouge. La batterie est morte : il ne fait plus qu'un clic.";
    for (const l of LEURRES) {
      // La radio est là où on l'a posée ; dans un sac, elle n'est nulle part.
      const ou = l.id === "radio" ? (etatCoop ? etatCoop.radio : l) : l;
      if (!ou) continue;
      const d = Math.hypot(ou.x - position.x, ou.z - position.z) - 0.4;
      if (l.id === "radio") {
        garder(d, {
          A: {
            libelle: leurresActifs.has("radio") ? "Éteindre la radio" : "Allumer la radio (attire les Éteints)",
            message: { t: "interagir", cible: { genre: "leurre", id: "radio" }, verbe: "actionner" },
          },
          // B la prend : on la pose ailleurs, puis on l'allume (Book 23 §4.7 : « elle se transporte et se pose »).
          B: { libelle: "Prendre la radio (2 kg)", message: { t: "interagir", cible: { genre: "leurre", id: "radio" }, verbe: "prendre_radio" } },
          cible: { x: ou.x, z: ou.z },
        });
        continue;
      }
      const A: ActionProposee =
        l.id === "klaxon"
          ? batterieEnPlace
            ? { libelle: "Klaxonner (attire les Éteints)", message: { t: "interagir", cible: { genre: "leurre", id: l.id }, verbe: "actionner" } }
            : { libelle: "Klaxon muet (plus de batterie)", examiner: examenKlaxon }
          : { libelle: "Sonner (attire les Éteints)", message: { t: "interagir", cible: { genre: "leurre", id: l.id }, verbe: "actionner" } };
      garder(d, {
        A,
        B: { libelle: "Examiner", examiner: l.id === "klaxon" ? examenKlaxon : "La sonnette électrique du quai : on sonnait pour la livraison. Elle s'entend dans tout le hangar." },
        cible: { x: ou.x, z: ou.z },
      });
    }
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
      // D'une autre famille : on peut lui enseigner une recette de son métier (Book 25 §2.3, la leçon).
      B:
        a.famille !== famille
          ? { libelle: `Enseigner à ${a.pseudo}`, message: { t: "lecon", op: { genre: "choisir", a: a.id } } }
          : { libelle: "Examiner", examiner: `${a.pseudo}, de la famille des ${NOMS_FAMILLES[a.famille]}.` },
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
      A: { libelle: sortie.libelle, ouvrirCarte: destinations(sortie) },
      B: {
        libelle: "Examiner",
        examiner:
          lieu === "terrain"
            ? "Le chemin de terre rejoint la route de la Campagne : par le pont vers la station-service, ou en aval vers le gué."
            : lieu === "station" && sortie.vers === "cooperative"
              ? "Un chemin de terre file vers le nord, sous les arbres : la Coopérative du Plateau, à 2 km. Au bout, il faudra la carte."
              : sortie.sansArrivee && lieu === "moulin"
                ? "Le chemin de halage suit la levée vers le gué, à 2 km. On part par là ; on n'y revient jamais."
                : "La route continue. Au bout, il faudra la carte.",
      },
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

  // La radio dans le sac, à la Coopérative : rien à portée de main, A la pose ici (0.5.1).
  if (!meilleure.propositions && lieu === "cooperative" && (inventaire.radio_piles ?? 0) > 0) {
    return {
      A: { libelle: "Poser la radio ici", message: { t: "poser_radio" } },
      B: { libelle: "Examiner", examiner: "La radio de l'atelier est dans ton sac. Pose-la là où tu veux attirer les Éteints, allume-la, et éloigne-toi." },
      cible: null,
    };
  }
  return meilleure.propositions ?? { A: null, B: null, cible: null };
}

/** L'examen de la batterie du tracteur (Book 23 §4.7) : ce qu'elle vaut, ce qu'on perd en la prenant. */
function examenBatterieTracteur(klaxons: number, famille: Famille): string {
  const wh = Math.round(chargeBatterieTracteur(klaxons));
  const charge =
    klaxons >= KLAXONS_PAR_BATTERIE
      ? `Encore pleine : ≈ ${wh} Wh.`
      : wh > 0
        ? `Les coups de klaxon l'ont entamée : ≈ ${wh} Wh sur ${CAPACITES.batterie_voiture}.`
        : "Le klaxon l'a vidée : elle se rechargerait sur un banc.";
  const choix =
    famille === "voltaiques"
      ? " Pour toi, c'est du courant en réserve… mais sans elle, plus de klaxon pour vider le hangar."
      : famille === "mecanistes"
        ? " Pour un atelier, c'est une batterie de démarrage… mais sans elle, plus de klaxon pour vider le hangar."
        : " Sans elle, plus de klaxon pour vider le hangar.";
  return `La batterie du tracteur rouge, sanglée sur le garde-boue : c'est elle qui fait sonner le klaxon. ${charge} 18 kg, une clé plate pour les cosses.${choix} Chaque coup de klaxon en vide un quart.`;
}
