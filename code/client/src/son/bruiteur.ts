// Le bruiteur : ce qui se passe dans le jeu, traduit en effets sonores (Book 21 §6.3).
// Les pas selon le sol et l'allure, la vie sonore des Éteints selon leur état, les gestes des actions,
// les sons continus (feu, pédalier, pluie) et le niveau de menace transmis à la musique.

import type { BruitVu, GenreBruit } from "../../../commun/src/bruits.ts";
import type { EtatEteint, ResultatCoup, VarianteEteint } from "../../../commun/src/eteints.ts";
import { BOUTIQUE, COMPTOIR, ROUTE, ROUTE_CARREFOUR, STATION, type LieuJouable } from "../../../commun/src/lieux.ts";
import type { AspectFeu } from "../../../commun/src/survie.ts";
import type { BruitAction } from "../../../commun/src/signature.ts";
import { RUINE } from "../../../commun/src/terrain.ts";
import type { TypeInstallation } from "../../../commun/src/recettes.ts";
import type { NiveauMenace } from "../audio/moteur-couches.js";
import type { IdSon } from "./catalogue.ts";
import type { AllurePas, Sol } from "./recettes.ts";
import type { Ou, Sonorisation } from "./audio.ts";

/** La longueur d'un pas selon l'allure (m) : un son par pas. */
/** La Coopérative : distance (m) à laquelle un Éteint compte dans « le nombre » (musique/LIVRAISON.md §3 bis). */
const CONTACT_NOMBRE = 2;
const FOULEE: Record<AllurePas, number> = { discrete: 0.55, marche: 0.75, course: 1.15 };

const dans = (x: number, z: number, b: { x: number; z: number; l: number; p: number }, marge = 0) =>
  Math.abs(x - b.x) <= b.l / 2 + marge && Math.abs(z - b.z) <= b.p / 2 + marge;

/** Le sol sous les pieds, d'après le lieu (Book 21 §6.3 : terre, herbe, béton, gravats et verre). */
export function solIci(lieu: LieuJouable, x: number, z: number): Sol {
  if (lieu === "terrain") {
    if (dans(x, z, { x: RUINE.x, z: RUINE.z, l: RUINE.largeur, p: RUINE.profondeur }, 0.5)) return "gravats";
    // Le chemin de terre qui part vers le sud.
    if (Math.abs(x - 25) < 1.8 && z > 38) return "terre";
    return "herbe";
  }
  if (lieu === "station") {
    const b = STATION.boutique;
    if (dans(x, z, b) || dans(x, z, STATION.atelier)) return "gravats";
    if (Math.abs(z - ROUTE.z) <= ROUTE.demiLargeur) return "beton";
    // Le parvis de la station, sous l'auvent et jusqu'à la route.
    if (x > STATION.auvent.x - STATION.auvent.l / 2 - 6 && x < STATION.atelier.x + STATION.atelier.l / 2 + 2 && z > BOUTIQUE.porte.z - 0.5 && z < ROUTE.z) return "beton";
    return "herbe";
  }
  // Les autres lieux (le gué, le Moulin, le niveau 2) : de la terre, en attendant leurs sols ; le Comptoir a les siens.
  if (lieu !== "comptoir") return "terre";
  if (Math.abs(z - ROUTE_CARREFOUR.z) <= ROUTE_CARREFOUR.demiLargeur || Math.abs(x - ROUTE_CARREFOUR.x) <= ROUTE_CARREFOUR.demiLargeur) return "beton";
  if (dans(x, z, COMPTOIR.batiment, 4)) return "beton";
  return "terre";
}

/** Dans la boutique de la station : la pluie s'entend sur le toit, assourdie. */
export function dansLaBoutique(x: number, z: number): boolean {
  return dans(x, z, STATION.boutique);
}

interface SuiviEteint {
  etat: EtatEteint;
  x: number;
  z: number;
  /** Prochain râle ou souffle (s, horloge du bruiteur). */
  prochainCri: number;
  /** Distance parcourue depuis le dernier pas. */
  foulee: number;
  saisit: boolean;
  /** Il gémissait au dernier envoi (on ne rejoue le gémissement qu'au début). */
  gemit: boolean;
  /** Sa variante (0.10 : le Noyé et l'Ensablé ont leurs sons). */
  variante?: VarianteEteint;
}

/** Le geste sonore d'une action, d'après son libellé (et son bruit de signature). */
interface Geste {
  id?: IdSon;
  /** Répété toutes les `periode` secondes pendant l'action. */
  periode?: number;
  /** Ou bien joué en continu pendant l'action. */
  continu?: IdSon;
  /** Un second son continu (la chaîne sous la meule, l'alternateur sur la chaîne). */
  continu2?: IdSon;
  /**
   * Le second son continu n'entre qu'au bout de ces secondes, en fondu : le son joué au début (l'alternateur qui se
   * lance, du grave au sifflement) lui passe alors la main.
   */
  apres2?: number;
  /** Joué à la fin réussie de l'action. */
  fin?: IdSon;
}

export function gesteDe(libelle: string, bruit: BruitAction): Geste {
  const l = libelle.toLowerCase();
  if (l.startsWith("ramasser la branche") || l.startsWith("ramasser la bûche")) return { id: "geste_bois" };
  if (l.startsWith("ramasser la pierre")) return { id: "geste_pierre" };
  if (l.startsWith("cueillir") || l.startsWith("couper des joncs")) return { id: "geste_feuillage", periode: 1.2 };
  if (l.startsWith("tresser")) return { id: "tissu", periode: 1.4 };
  if (l.startsWith("fouiller")) return { id: "fouille", periode: 1.3 };
  if (l.includes("bâche")) return { id: "bache" };
  if (l.startsWith("monter un feu")) return { id: "pose_pierres", periode: 1.3 };
  if (l.startsWith("ajouter")) return { id: "buche_tombe" };
  if (l.startsWith("allumer le feu")) return { id: l.includes("briquet") ? "briquet" : "pierre_a_feu" };
  if (l.startsWith("allumer la meule")) return { id: "briquet" };
  if (l.startsWith("faire bouillir")) return { continu: "bouillir" };
  if (l.startsWith("remplir")) return { continu: "remplir_eau" };
  if (l.startsWith("manger")) return { id: "manger" };
  if (l.startsWith("boire")) return { id: "boire" };
  // Le pédalier générateur (plan 0.8) : l'alternateur se lance, puis son ronronnement monte avec le pédalage.
  if (l.startsWith("pédaler") && l.includes("alternateur")) return { id: "alternateur_lance", continu: "chaine_velo", continu2: "alternateur", apres2: 2.3, fin: "roue_libre" };
  if (l.startsWith("pédaler")) return { continu: "chaine_velo", fin: "roue_libre" };
  if (l.startsWith("affûter")) return { continu: "meule", continu2: "chaine_velo", fin: "aiguiser" };
  if (l.startsWith("défourner")) return { id: "charbon", periode: 1.4 };
  if (l.startsWith("brancher") || l.startsWith("reprendre les batteries")) return { id: "pinces", fin: "interrupteur" };
  if (l.startsWith("recharger")) return { id: "pinces", fin: "interrupteur" };
  // L'électricité des Voltaïques (Book 25 §5) : la manivelle de la dynamo ronronne ; on câble au tournevis.
  if (l.startsWith("tourner la manivelle")) return { continu: "chaine_velo", fin: "interrupteur" };
  if (l.includes("module de décharge") || l.includes("matraque") || l.includes("pack de cellules") || l.includes("aiguillon") || l.includes("électri") || l.includes("plaque de choc"))
    return { id: "visser", periode: 1.1, fin: "interrupteur" };
  if (l.includes("pansement")) return { id: "tissu", periode: 1.1 };
  if (l.startsWith("reprendre ton sac")) return { id: "fouille" };
  if (l.startsWith("monter la meule") || l.startsWith("monter la dynamo") || l.startsWith("monter l'alternateur") || l.includes("panneau")) return { id: "visser", periode: 1.1 };
  if (l.startsWith("démonter") || l.startsWith("prendre la batterie") || l.startsWith("prendre les lames")) return { id: "demonter", periode: 1.2 };
  if (l.startsWith("remmancher")) return { id: "marteau_bois", periode: 0.9 };
  // La forge : le feu attisé sous les coups d'enclume, la trempe à la fin (son/LIVRAISON.md : sons livrés, enfin joués).
  // L'identifiant n'est plus « soufflet » (0.8.2) : le mot est réservé au soufflet de forge, la clé de la forge ventilée.
  if (l.startsWith("forger")) return { id: "enclume", periode: 0.85, continu: "forge_attisee", fin: "trempe" };
  // Débiter du bois : la scie pour les planches, la hache pour les perches et les branches.
  if (l.includes("coffre") || l.includes("escabeau")) return { id: "scie", periode: 1.4 };
  if (l.includes("travois") || l.includes("lit de branchages") || l.includes("épieu") || l.includes("bâton") || l.includes("gourdin") || l.includes("sac de fortune"))
    return { id: "hache_coupe", periode: 1.1 };
  if (l.includes("foyer de forge")) return { id: "marteau_metal", periode: 1 };
  if (l.includes("abri")) return { id: "marteau_bois", periode: 1.1 };
  if (l.includes("établi") || l.includes("pédalier") || l.includes("banc") || l.includes("charbonnière")) return { id: "marteau_bois", periode: 1 };
  if (l.startsWith("prendre") || l.startsWith("ramasser")) return { id: "fouille" };
  // Par défaut, selon le bruit que fait l'action.
  if (bruit === "lourd") return { id: "marteau_metal", periode: 1 };
  if (bruit === "outil") return { id: "demonter", periode: 1.2 };
  return { id: "fouille", periode: 1.5 };
}

/** Le son d'un bruit entendu sans le voir (0.7.2), et son volume. */
const SON_DU_BRUIT: Record<GenreBruit, { id: IdSon; gain?: number }> = {
  pas: { id: "eteint_pas" },
  pas_presses: { id: "eteint_pas_presse" },
  rale: { id: "eteint_rale" },
  rale_rapide: { id: "eteint_rale_rapide" },
  halete: { id: "eteint_halete", gain: 0.7 },
  souffle: { id: "eteint_souffle" },
  gemissement: { id: "eteint_rale", gain: 1.2 },
  rale_coupe: { id: "eteint_rale_coupe" },
  coups: { id: "impact_appuye", gain: 1.1 },
  chute: { id: "chute_corps" },
  presence: { id: "eteint_souffle", gain: 1.3 },
};
/** Ce qu'on entend sans le voir garde la musique en alerte ce nombre de secondes. */
const ALERTE_ENTENDUE = 4;

export class Bruiteur {
  private readonly son: Sonorisation;
  private t = 0;
  private foulee = 0;
  private readonly suivis = new Map<number, SuiviEteint>();
  private readonly autres = new Map<number, { x: number; z: number; foulee: number }>();
  private action: { geste: Geste; prochain: number; debut: number } | null = null;
  private derniereAction: Geste | null = null;
  private readonly aspects = new Map<number, AspectFeu>();
  private prochainTonnerre = 0;
  private saisiAvant = 0;
  /** Le premier Éteint repéré de la session a eu son signal musical. */
  private repere = false;
  /** Ce qu'on entend derrière un mur tient la musique en alerte (0.7.2) : le niveau, et jusqu'à quand. */
  private entendu: { niveau: "attire" | "poursuite"; jusqua: number } | null = null;

  /**
   * Ce qu'on entend sans le voir (message « bruits », 0.7.2) : étouffé, depuis le point de passage (la porte, le
   * mur). Un Éteint qui cogne, qui poursuit ou qu'on sent tout près met la musique en poursuite ; un râle coupé, en
   * tension. On n'entend jamais que le bruit : ni qui le fait, ni où il est.
   */
  entendre(bruits: readonly BruitVu[]): void {
    for (const b of bruits) {
      const s = SON_DU_BRUIT[b.g];
      this.son.jouerEtouffe(s.id, b, b.f, { gain: s.gain ?? 1 });
      const niveau = b.g === "coups" || b.g === "presence" || b.g === "pas_presses" || b.g === "rale_rapide" ? "poursuite" : b.g === "rale_coupe" || b.g === "halete" || b.g === "gemissement" ? "attire" : null;
      if (!niveau || b.f < 0.15) continue;
      const garde = this.entendu && this.entendu.jusqua > this.t && this.entendu.niveau === "poursuite" ? "poursuite" : niveau;
      this.entendu = { niveau: garde, jusqua: this.t + ALERTE_ENTENDUE };
    }
  }

  constructor(son: Sonorisation) {
    this.son = son;
  }

  /** Les pas du joueur : un son à chaque foulée, selon le sol et l'allure. */
  pas(lieu: LieuJouable, x: number, z: number, allure: AllurePas, distance: number): void {
    if (distance <= 0) {
      this.foulee = Math.min(this.foulee, FOULEE[allure] * 0.6);
      return;
    }
    this.foulee += distance;
    if (this.foulee < FOULEE[allure]) return;
    // On garde le reste de la foulée : le rythme des pas suit exactement la distance parcourue.
    this.foulee = Math.min(this.foulee - FOULEE[allure], FOULEE[allure]);
    this.son.jouer(`pas_${solIci(lieu, x, z)}_${allure}` as IdSon);
  }

  /** Les autres joueurs : on entend leurs pas (à la marche). */
  pasDesAutres(lieu: LieuJouable, liste: { id: number; x: number; z: number }[]): void {
    const vus = new Set<number>();
    for (const a of liste) {
      vus.add(a.id);
      const s = this.autres.get(a.id);
      if (!s) {
        this.autres.set(a.id, { x: a.x, z: a.z, foulee: 0 });
        continue;
      }
      s.foulee += Math.hypot(a.x - s.x, a.z - s.z);
      s.x = a.x;
      s.z = a.z;
      if (s.foulee >= FOULEE.marche) {
        s.foulee = 0;
        this.son.jouer(`pas_${solIci(lieu, a.x, a.z)}_marche` as IdSon, a);
      }
    }
    for (const id of this.autres.keys()) if (!vus.has(id)) this.autres.delete(id);
  }

  /**
   * La vie sonore des Éteints, et le niveau de menace pour la musique.
   * Dormant : respiration à 3 m. Errant : pas qui traînent, râles espacés. Attiré : le râle se coupe net, la tête
   * craque, puis le silence et les pas. Poursuivant : râles rapprochés, pas pressés, souffle.
   * `nombre` (à la Coopérative seulement, musique/LIVRAISON.md §3 bis) : la menace « nombre » quand 3 Éteints ou plus
   * poursuivent le joueur à moins de 2 m, ou pendant une saisie avec 2 autres Éteints au contact.
   */
  eteints(
    dt: number,
    liste: { id: number; x: number; z: number; etat: EtatEteint; saisit?: boolean; gemit?: boolean; variante?: VarianteEteint }[],
    moi: Ou | null,
    saisi: number,
    nombre = false,
  ): void {
    this.t += dt;
    const vus = new Set<number>();
    let menace: NiveauMenace = saisi > 0 ? "saisie" : "aucune";
    /** Éteints qui poursuivent le joueur au contact, et Éteints debout au contact (pour la saisie). */
    let poursuivantsProches = 0;
    let auContact = 0;
    for (const e of liste) {
      vus.add(e.id);
      let s = this.suivis.get(e.id);
      if (!s) {
        s = { etat: e.etat, x: e.x, z: e.z, prochainCri: this.t + 0.5 + Math.random() * 3, foulee: 0, saisit: false, gemit: false };
        this.suivis.set(e.id, s);
      }
      s.variante = e.variante;
      // Le Noyé râle noyé (0.10).
      const rale = e.variante === "noye" ? "eteint_noye_rale" : "eteint_rale";
      const ou = { x: e.x, z: e.z };
      if (e.etat !== s.etat) this.changement(s, e.etat, ou);
      s.etat = e.etat;
      const bouge = Math.hypot(e.x - s.x, e.z - s.z);
      s.x = e.x;
      s.z = e.z;
      if (e.saisit && !s.saisit) this.son.jouer("saisie", ou);
      s.saisit = Boolean(e.saisit);
      // Un dormant qui se réveille gémit (Book 23 §3) : la cascade s'entend, pièce après pièce.
      if (e.gemit && !s.gemit) this.son.jouer("eteint_rale", ou, { gain: 1.2 });
      s.gemit = Boolean(e.gemit);

      // Les pas.
      if (e.etat === "errant" || e.etat === "attire" || e.etat === "poursuivant") {
        s.foulee += bouge;
        const presse = e.etat === "poursuivant";
        if (s.foulee >= (presse ? 0.8 : 0.6)) {
          s.foulee = 0;
          this.son.jouer(presse ? "eteint_pas_presse" : "eteint_pas", ou);
        }
      }
      // Les râles et les souffles, à intervalles irréguliers.
      if (this.t >= s.prochainCri) {
        if (e.etat === "dormant") {
          this.son.jouer(Math.random() < 0.15 ? "eteint_machoire" : "eteint_souffle", ou);
          s.prochainCri = this.t + 3 + Math.random() * 1.5;
        } else if (e.etat === "errant") {
          this.son.jouer(rale, ou);
          s.prochainCri = this.t + 4 + Math.random() * 6;
        } else if (e.etat === "attire") {
          // L'Attiré se tait : on n'entend que son souffle, de temps en temps.
          if (Math.random() < 0.4) this.son.jouer("eteint_halete", ou, { gain: 0.6 });
          s.prochainCri = this.t + 3 + Math.random() * 3;
        } else if (e.etat === "poursuivant") {
          this.son.jouer(Math.random() < 0.75 ? (e.variante === "noye" ? rale : "eteint_rale_rapide") : "eteint_halete", ou);
          s.prochainCri = this.t + 1.2 + Math.random() * 1.6;
        } else if (e.etat === "a_terre") {
          // À terre, il n'est pas fini (chantier F) : il gémit, étouffé, de loin en loin.
          this.son.jouer("eteint_gemit_sol", ou);
          s.prochainCri = this.t + 1.8 + Math.random() * 2.2;
        } else s.prochainCri = this.t + 2;
      }

      // La menace : l'état le plus grave des Éteints qui en veulent au joueur.
      if (moi) {
        const d = Math.hypot(e.x - moi.x, e.z - moi.z);
        if (!this.repere && d < 14 && e.etat !== "dormant" && e.etat !== "detruit") {
          this.repere = true;
          this.son.signal("eteintRepere");
        }
        if (e.etat === "poursuivant" && d < 30 && menace !== "saisie") menace = "poursuite";
        else if (e.etat === "attire" && d < 25 && menace === "aucune") menace = "attire";
        if (d < CONTACT_NOMBRE) {
          if (e.etat === "poursuivant") poursuivantsProches++;
          if (e.etat !== "dormant" && e.etat !== "detruit" && e.etat !== "a_terre") auContact++;
        }
      }
    }
    if (nombre && (poursuivantsProches >= 3 || (saisi > 0 && Math.max(auContact, saisi) >= 3))) menace = "nombre";
    // Ce qu'on entend derrière un mur compte aussi (0.7.2) : sinon, l'Éteint caché ne ferait plus peur.
    if (this.entendu && this.entendu.jusqua > this.t) {
      if (menace === "aucune" || (menace === "attire" && this.entendu.niveau === "poursuite")) menace = this.entendu.niveau;
    }
    for (const id of this.suivis.keys()) if (!vus.has(id)) this.suivis.delete(id);
    this.son.menace(menace);
    if (saisi > this.saisiAvant) this.son.jouer("saisie");
    this.saisiAvant = saisi;
  }

  private changement(s: SuiviEteint, etat: EtatEteint, ou: Ou): void {
    // Le Noyé crève (0.10) : la peau qui cède, les fluides qui giclent, après le coup.
    if (etat === "detruit" && s.variante === "noye") setTimeout(() => this.son.jouer("eteint_noye_creve", ou), 120);
    // L'Ensablé surgit du sable (0.10) ; les autres dormants font craquer leur mâchoire.
    if (s.etat === "dormant" && etat !== "detruit" && s.variante === "ensable") this.son.jouer("eteint_ensable_surgit", ou);
    else if (s.etat === "dormant" && etat !== "detruit") this.son.jouer("eteint_machoire", ou, { portee: 10 });
    if (etat === "attire" && s.etat !== "poursuivant") {
      // Le râle coupé net, la tête qui se tourne : le son le plus important du jeu.
      this.son.jouer("eteint_rale_coupe", ou);
      setTimeout(() => this.son.jouer("eteint_tete_craque", ou), 450);
      s.prochainCri = this.t + 3;
    }
    if (etat === "poursuivant") {
      this.son.jouer("eteint_rale_rapide", ou);
      s.prochainCri = this.t + 1.2;
    }
    if (etat === "a_terre") {
      setTimeout(() => this.son.jouer("chute_corps", ou), 150);
      // Le premier gémissement, une fois tombé.
      s.prochainCri = this.t + 1.2 + Math.random() * 0.8;
    }
  }

  // ---------- Le combat ----------

  /**
   * L'alarme à boîtes de conserve (P-002) : du métal qui s'entrechoque, plusieurs fois. La cloche d'alarme (plan 0.10,
   * chantier C) : la cloche de bronze, celle du passeur du gué (un effet déjà livré, entendu à 40 m).
   */
  alarme(ou: Ou, cloche = false): void {
    if (cloche) {
      this.son.jouer("cloche_bac", ou);
      return;
    }
    this.son.jouer("marteau_metal", ou);
    setTimeout(() => this.son.jouer("marteau_metal", ou), 160);
    setTimeout(() => this.son.jouer("marteau_metal", ou), 420);
  }

  frappe(appuye: boolean): void {
    this.son.jouer(appuye ? "sifflement_lourd" : "sifflement");
  }

  coup(resultat: ResultatCoup, ou: Ou & { electrique?: true }): void {
    // La décharge (Book 25 §5.4) : la courte crépite (il se raidit) ; la longue claque (à terre, ou il s'éteint).
    if (ou.electrique) {
      this.son.jouer(resultat === "raidi" ? "decharge_courte" : "decharge_longue", ou);
      if (resultat === "detruit") setTimeout(() => this.son.jouer("chute_corps", ou), 450);
      return;
    }
    if (resultat === "raidi") this.son.jouer("impact", ou);
    // L'Équipé encaisse (plan 0.9 §3.3) : le choc mat du blouson et du casque.
    else if (resultat === "encaisse") this.son.jouer("impact_mat", ou);
    else if (resultat === "detruit") {
      this.son.jouer("coup_tete", ou);
      setTimeout(() => this.son.jouer("chute_corps", ou), 280);
    } else this.son.jouer(resultat === "a_terre" ? "impact_appuye" : "impact", ou);
  }

  esquive(): void {
    this.son.jouer("esquive");
  }

  degagement(): void {
    this.son.jouer("degagement");
  }

  morsure(): void {
    this.son.jouer("morsure");
    setTimeout(() => this.son.jouer("coeur"), 500);
  }

  effondrement(): void {
    this.son.jouer("effondrement");
    this.son.signal("mort");
  }

  // ---------- Les actions ----------

  debutAction(libelle: string, bruit: BruitAction): void {
    const geste = gesteDe(libelle, bruit);
    this.action = { geste, prochain: this.t + (geste.periode ?? Infinity), debut: this.t };
    this.derniereAction = geste;
    if (geste.id) this.son.jouer(geste.id);
  }

  finAction(reussie: boolean): void {
    const g = this.derniereAction;
    this.action = null;
    if (reussie && g?.fin) this.son.jouer(g.fin);
    else if (!reussie && g?.continu === "chaine_velo") this.son.jouer("roue_libre");
  }

  // ---------- Les sons continus et le monde ----------

  monde(o: {
      feux: { id: number; x: number; z: number; aspect: AspectFeu }[];
      installations: { id: number; type: TypeInstallation; x: number; z: number; batteries: boolean; sousTension?: boolean }[];
      pluie: number;
      dehors: boolean;
      /** Les sons continus d'un lieu (plan 0.8, chantier 11 : au gué, le clapot du radier, le câble du bac). */
      lieu?: { cle: string; id: IdSon; ou?: Ou; gain?: number }[];
  }): void {
    // Les gestes répétés de l'action en cours.
    const a = this.action;
    if (a && a.geste.id && a.geste.periode && this.t >= a.prochain) {
      this.son.jouer(a.geste.id);
      a.prochain = this.t + a.geste.periode * (0.85 + Math.random() * 0.3);
    }
    const voulus: { cle: string; id: IdSon; ou?: Ou; gain?: number }[] = [];
    if (a?.geste.continu) voulus.push({ cle: "action", id: a.geste.continu });
    if (a?.geste.continu2 && this.t - a.debut >= (a.geste.apres2 ?? 0)) voulus.push({ cle: "action2", id: a.geste.continu2, gain: a.geste.apres2 ? 1 : 0.6 });

    for (const f of o.feux) {
      const avant = this.aspects.get(f.id);
      if (avant && avant !== f.aspect) {
        if ((avant === "flammes" || avant === "braises") && (f.aspect === "cendres" || f.aspect === "eteint")) this.son.jouer("extinction", f);
        if (f.aspect === "flammes" && avant !== "braises") this.son.premierFeu();
      }
      this.aspects.set(f.id, f.aspect);
      if (f.aspect === "flammes") voulus.push({ cle: `feu${f.id}`, id: "feu_crepite", ou: f });
      else if (f.aspect === "braises") voulus.push({ cle: `feu${f.id}`, id: "braises", ou: f });
    }
    for (const i of o.installations) {
      if (i.type === "banc_recharge" && i.batteries) voulus.push({ cle: `banc${i.id}`, id: "bourdonnement", ou: i });
      // Une clôture sous tension bourdonne, à deux pas (Book 25 §5.3).
      if ((i.type === "cloture_fortune" || i.type === "cloture_electrique") && i.sousTension) voulus.push({ cle: `cloture${i.id}`, id: "bourdonnement", ou: i });
    }
    // La pluie couvre tout ; le tonnerre roule de temps en temps quand il pleut fort.
    if (o.pluie > 0.05) voulus.push({ cle: "pluie", id: "pluie", gain: o.pluie * (o.dehors ? 1 : 0.45) });
    if (o.pluie > 0.6 && this.t > this.prochainTonnerre) {
      if (this.prochainTonnerre > 0) this.son.jouer("tonnerre", null, { gain: 0.6 + Math.random() * 0.4 });
      this.prochainTonnerre = this.t + 25 + Math.random() * 50;
    }
    voulus.push(...(o.lieu ?? []));
    this.son.continus(voulus);
  }
}
