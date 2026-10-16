// La forge des Charbonniers, côté serveur (Book 25 §4, chantier 5 de la 0.6).
//
// Ce que la fabrication ordinaire (joueur.ts, `fabriquer`) ne sait pas faire, et que la forge ajoute :
// - refuser ce qui ne se forge pas encore : le glaive demande la maîtrise du couteau (la forge ventilée, le bac de
//   trempe et l'huile sont dans le lieu de chaque recette, que joueur.ts vérifie : commun/src/lieu-recette.ts) ;
// - la trempe : à l'huile (la graisse du sac, ou l'huile du bac), sûre ; à l'eau, une lame sur trois se fend et devient
//   une lame ébréchée (Book 02 §9 : jamais de disparition totale) ; le risque est dit avant le geste ;
// - le manche tourné ⚙️ : une étoile de plus à la lame qu'on emmanche ;
// - le reforgeage : la lame ébréchée redevient la même arme, une étoile de moins. La forge se souvient des lames
//   cassées (gardé en base, `monde`, clé « forge:<compte> ») ; une lame ébréchée d'origine inconnue donne un couteau ;
// - les accessoires de la forge : l'enclume (l'enclume de dépanneur, clé du foyer ; un étau, une tête de masse, le
//   rail), le bac de trempe (une auge de planches et de glaise, plan 0.8) et son huile, le ventilateur ⚡ ;
// - la forge ventilée sans ventilateur : on pompe le soufflet double (des calories en plus).
//
// Ce module ne connaît pas le joueur : il passe par un `ContexteForge` (ce que le joueur lui prête). joueur.ts n'ajoute
// que des appels d'une ligne (Book 25 §10.4).

import { cleExemplaire, estObjetDeMetier, lireCle, PLAFOND_HORS_FAMILLE, SEUIL_MAITRISE, uneEtoileDeMoins, uneEtoileDePlus, type CleObjet, type Etoiles } from "../../commun/src/etoiles.ts";
import {
  COUT_BAC,
  ENCLUMES,
  ETOILES_PIERRE_PLATE,
  QUALITES_BAC,
  ETOILES_ACIER,
  KCAL_POMPER,
  RISQUE_TREMPE_EAU,
  TREMPES_PAR_BIDON,
  enclumeDuSac,
  estVentilee,
  forgeProche,
  prendLaTrempe,
  souffletDeForge,
  trempeDisponible,
  type ForgeVue,
} from "../../commun/src/forge.ts";
import type { InstallationVue } from "../../commun/src/messages.ts";
import { nommer, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { niveauQualite, type ContexteFabrication, type Recette } from "../../commun/src/recettes.ts";
import { LAMES_EMMANCHEES, LAMES_TREMPEES, MAITRISE_REQUISE, RECETTE_REFORGER } from "../../commun/src/recettes/charbonniers.ts";

/** Une recette qui ne se trempe qu'à l'huile (son lieu demande l'huile : le ressort retrempé). */
function trempeALHuile(r: Recette): boolean {
  return r.lieu.genre === "construction" && r.lieu.accessoire === "huile";
}

/** Ce que le joueur prête à la forge. */
export interface ContexteForge {
  readonly id: number;
  alea(): number;
  inventaire(): Inventaire;
  /** Les outils à portée (le sac, le râtelier et l'établi à étau à 3 m) : pour juger les qualités, pas pour payer. */
  outils(): Inventaire;
  retirer(cle: CleObjet, n: number): void;
  ajouter(objets: Inventaire): void;
  /** Les installations de son terrain à moins de 3 m (aucune ailleurs). */
  installationsProches(): InstallationVue[];
  /** L'état d'une installation a changé : le sauver et le montrer. */
  majInstallation(i: InstallationVue): void;
  /** Combien de fois on a fait ceci (« fabrique:lame_forgee »). */
  faits(cle: string): number;
  info(texte: string): void;
  /** Un geste qui prend du temps (poser l'enclume). */
  commencer(libelle: string, dureeS: number, appliquer: () => void): void;
  lire<T>(cle: string): T | null;
  ecrire(cle: string, valeur: unknown): void;
}

/** Ce que la forge garde d'un joueur. */
interface Memoire {
  /** Les lames cassées dont on garde la lame ébréchée, de la plus ancienne à la plus récente (« machette_forgee#4 »). */
  ebrechees: string[];
}

/** On ne se souvient pas de plus de lames cassées que ça. */
const MEMOIRE_MAX = 30;

/** La forge d'un joueur. */
export class Forge {
  private memoire: Memoire | null = null;

  private readonly ctx: ContexteForge;

  constructor(ctx: ContexteForge) {
    this.ctx = ctx;
  }

  /** Le contexte des étoiles : les installations tout près (la forge, son niveau, ses accessoires). */
  contexte(): ContexteFabrication {
    return { installations: this.ctx.installationsProches() };
  }

  private forge(): ForgeVue | null {
    return forgeProche(this.contexte());
  }

  /** Ce qui empêche de forger cette recette ici (un message court), ou null. Le risque de la trempe est dit ici. */
  refus(r: Recette): string | null {
    if (r.installation !== "forge") return null;
    const id = r.id;
    const forge = this.forge();
    const maitrise = MAITRISE_REQUISE[id];
    if (maitrise) {
      const faits = maitrise.recettes.reduce((s, x) => s + this.ctx.faits(`fabrique:${x}`), 0);
      if (faits < SEUIL_MAITRISE) return `Il faut d'abord maîtriser ${maitrise.nom} : ${SEUIL_MAITRISE} forgés (tu en es à ${faits}).`;
    }
    const trempe = trempeDisponible(this.ctx.inventaire(), forge);
    if (LAMES_TREMPEES.has(id) && trempe.genre === "eau") this.ctx.info("Trempe à l'eau : une lame sur trois se fend. À l'huile (graisse, bac), aucune.");
    return null;
  }

  /**
   * La forge ventilée sans ventilateur, ni le soufflet de forge (une partie d'avant la 0.10) : on pompe (kcal par heure
   * de jeu en plus). Plan 0.10 (chantier C) : le soufflet de forge, monté avec la forge ventilée, souffle seul.
   */
  kcalEnPlus(r: Recette): number {
    if (r.installation !== "forge") return 0;
    const forge = this.forge();
    return estVentilee(forge) && !forge?.etat.ventilateur && !souffletDeForge(forge) ? KCAL_POMPER : 0;
  }

  /**
   * Ce qui sort de la forge, à la fin du geste (les ingrédients sont déjà pris) : le produit à ses étoiles, ou une lame
   * fendue à la trempe ; le reforgeage rend la lame d'origine. Consomme l'huile de la trempe et le manche tourné.
   */
  sortie(r: Recette, objet: TypeObjet, etoiles: Etoiles | null, quantite: number, horsFamille: boolean): Inventaire {
    const plafond = (n: Etoiles): Etoiles => (horsFamille ? (Math.min(n, PLAFOND_HORS_FAMILLE) as Etoiles) : n);
    if (r.installation !== "forge" || !("objet" in r.produit)) return { [cleExemplaire(objet, etoiles ?? undefined)]: quantite };
    if (r.id === RECETTE_REFORGER) return this.reforger(objet, etoiles, plafond);

    const forge = this.forge();
    const sortie: Inventaire = {};
    const ajouter = (cle: CleObjet, n = 1) => (sortie[cle] = (sortie[cle] ?? 0) + n);
    // La trempe (les aciers qui la prennent) : l'huile se consomme, l'eau peut fendre.
    let fendues = 0;
    const trempe = trempeDisponible(this.ctx.inventaire(), forge);
    const acier = Math.max(0, ...Object.keys(r.ingredients).map((t) => ETOILES_ACIER[t as TypeObjet] ?? 0));
    if ((LAMES_TREMPEES.has(r.id) || trempeALHuile(r)) && prendLaTrempe(acier)) {
      if (trempe.genre === "huile") this.consommerHuile(trempe.source, forge);
      else if (estObjetDeMetier(objet)) for (let k = 0; k < quantite; k++) if (this.ctx.alea() < RISQUE_TREMPE_EAU) fendues++;
    }
    let n = etoiles;
    // Le manche tourné ⚙️ : une étoile de plus à une lame qu'on emmanche (une seule pièce à la fois).
    if (n !== null && quantite - fendues === 1 && LAMES_EMMANCHEES.has(r.id) && (this.ctx.inventaire().manche_tourne ?? 0) > 0) {
      const plus = plafond(uneEtoileDePlus(n));
      if (plus > n) {
        this.ctx.retirer("manche_tourne", 1);
        n = plus;
        this.ctx.info("Le manche tourné tient la main : une étoile de plus.");
      }
    }
    const cle = cleExemplaire(objet, n ?? undefined);
    if (quantite - fendues > 0) ajouter(cle, quantite - fendues);
    if (fendues > 0) {
      ajouter("lame_ebrechee", fendues);
      for (let k = 0; k < fendues; k++) this.noterDebris(cle);
      this.ctx.info(fendues === quantite && quantite === 1 ? "La lame s'est fendue à la trempe : une lame ébréchée. Elle se reforge." : `${fendues} sur ${quantite} se sont fendues à la trempe : elles se reforgent.`);
    }
    return sortie;
  }

  /** La lame ébréchée redevient la même arme, une étoile de moins ; d'origine inconnue, un couteau (acier ★★★). */
  private reforger(objet: TypeObjet, etoiles: Etoiles | null, plafond: (n: Etoiles) => Etoiles): Inventaire {
    const m = this.lireMemoire();
    const origine = m.ebrechees.pop();
    if (origine === undefined) return { [cleExemplaire(objet, etoiles ?? undefined)]: 1 };
    this.ecrireMemoire(m);
    const { type, etoiles: avant } = lireCle(origine);
    const cle = avant === null ? type : cleExemplaire(type, plafond(uneEtoileDeMoins(avant)));
    this.ctx.info(`La lame ébréchée redevient ${nommer(cle, 1)}.`);
    return { [cle]: 1 };
  }

  private consommerHuile(source: "bac" | "graisse", forge: ForgeVue | null): void {
    if (source === "graisse") return this.ctx.retirer("graisse", 1);
    const i = this.ctx.installationsProches().find((x) => x === forge);
    if (!i) return;
    const reste = Math.max(0, (i.etat.huile ?? 0) - 1);
    i.etat = { ...i.etat, huile: reste };
    if (reste === 0) delete i.etat.huile;
    this.ctx.majInstallation(i);
  }

  /** Une lame vient de casser (ou de se fendre) : on garde sa lame ébréchée en mémoire, pour la reforger. */
  noterDebris(cle: CleObjet): void {
    const m = this.lireMemoire();
    m.ebrechees.push(cle);
    if (m.ebrechees.length > MEMOIRE_MAX) m.ebrechees.splice(0, m.ebrechees.length - MEMOIRE_MAX);
    this.ecrireMemoire(m);
  }

  /** Les lames ébréchées dont la forge se souvient (la dernière reforgée en premier). */
  lamesEbrechees(): readonly string[] {
    return [...this.lireMemoire().ebrechees];
  }

  private lireMemoire(): Memoire {
    if (!this.memoire) {
      const brut = this.ctx.lire<Partial<Memoire>>(`forge:${this.ctx.id}`);
      const ebrechees = Array.isArray(brut?.ebrechees) ? brut.ebrechees.filter((c): c is string => typeof c === "string" && c.length <= 40) : [];
      this.memoire = { ebrechees };
    }
    return this.memoire;
  }

  private ecrireMemoire(m: Memoire): void {
    this.memoire = m;
    this.ctx.ecrire(`forge:${this.ctx.id}`, m);
  }

  // ---------- Les accessoires de la forge (Book 25 §9.3) ----------

  /**
   * Un geste sur la forge : poser l'enclume, le bac de trempe, verser l'huile, monter le ventilateur. Rend false si ce
   * n'est pas un geste de la forge (joueur.ts continue alors comme avant).
   */
  utiliser(i: InstallationVue, verbe: string): boolean {
    if (i.type !== "forge") return false;
    const inv = this.ctx.inventaire();
    switch (verbe) {
      case "poser_enclume": {
        const e = enclumeDuSac(inv);
        const actuelle = i.etat.enclume ? ENCLUMES[i.etat.enclume].etoiles : ETOILES_PIERRE_PLATE;
        if (!e) {
          this.ctx.info("Il te faut une enclume : celle du dépanneur, sous l'établi du garage de la station (un étau, une tête de masse font aussi l'affaire).");
          return true;
        }
        if (ENCLUMES[e].etoiles <= actuelle && i.etat.enclume) {
          this.ctx.info(`L'enclume posée vaut déjà ${ENCLUMES[e].nom}.`);
          return true;
        }
        this.ctx.commencer(`Poser l'enclume : ${ENCLUMES[e].nom}`, 8, () => {
          if ((this.ctx.inventaire()[ENCLUMES[e].objet] ?? 0) < 1) return;
          this.ctx.retirer(ENCLUMES[e].objet, 1);
          // L'ancienne enclume revient dans le sac.
          if (i.etat.enclume) this.ctx.ajouter({ [ENCLUMES[i.etat.enclume].objet]: 1 });
          i.etat = { ...i.etat, enclume: e };
          this.ctx.majInstallation(i);
          this.ctx.info(`${ENCLUMES[e].nom.charAt(0).toUpperCase()}${ENCLUMES[e].nom.slice(1)} sert d'enclume : tes lames montent à ${"★".repeat(Math.min(2, ENCLUMES[e].etoiles))}.`);
        });
        return true;
      }
      case "poser_bac": {
        // Plan 0.8 : une auge de planches calfatée de glaise, sans clé (2 bûches, 2 glaises du gué ; Creuser 1).
        if (i.etat.bac) return true;
        const manque = Object.entries(COUT_BAC).filter(([t, n]) => (inv[t as TypeObjet] ?? 0) < (n ?? 0));
        if (manque.length) {
          this.ctx.info(`Le bac de trempe, c'est une auge de planches calfatée de glaise : il manque ${manque.map(([t, n]) => nommer(t as TypeObjet, n ?? 1)).join(", ")}. La glaise se creuse au gué.`);
          return true;
        }
        // Creuser 1 se lit aussi dans les outils à portée : le bâton à fouir rangé au râtelier (plan 0.8 §9.2).
        if (niveauQualite(this.ctx.outils(), "creuser") < QUALITES_BAC.creuser) {
          this.ctx.info("Il faut de quoi creuser l'assise de l'auge : un bâton à fouir, une pelle.");
          return true;
        }
        this.ctx.commencer("Poser le bac de trempe", 20, () => {
          const sac = this.ctx.inventaire();
          if (Object.entries(COUT_BAC).some(([t, n]) => (sac[t as TypeObjet] ?? 0) < (n ?? 0))) return;
          for (const [t, n] of Object.entries(COUT_BAC)) this.ctx.retirer(t as TypeObjet, n ?? 0);
          i.etat = { ...i.etat, bac: true };
          this.ctx.majInstallation(i);
          this.ctx.info("L'auge est calfatée et pleine d'eau : l'acier s'y trempe. Une lame sur trois s'y fend encore.");
        });
        return true;
      }
      case "verser_huile": {
        if (!i.etat.bac) {
          this.ctx.info("Il faut d'abord le bac de trempe (une auge de planches et de glaise).");
          return true;
        }
        if ((inv.bidon_huile ?? 0) < 1) {
          this.ctx.info("Il te faut un bidon d'huile moteur (au garage, dans les épaves).");
          return true;
        }
        this.ctx.commencer("Verser l'huile dans le bac", 4, () => {
          if ((this.ctx.inventaire().bidon_huile ?? 0) < 1) return;
          this.ctx.retirer("bidon_huile", 1);
          i.etat = { ...i.etat, huile: (i.etat.huile ?? 0) + TREMPES_PAR_BIDON };
          this.ctx.majInstallation(i);
          this.ctx.info(`Le bac tient ${i.etat.huile} trempes à l'huile : plus aucune lame ne se fend.`);
        });
        return true;
      }
      case "monter_ventilateur": {
        if (i.etat.ventilateur) return true;
        if ((inv.ventilateur_forge ?? 0) < 1) {
          this.ctx.info("Le ventilateur 12 V se fabrique chez les Voltaïques.");
          return true;
        }
        this.ctx.commencer("Monter le ventilateur sur la forge", 6, () => {
          if ((this.ctx.inventaire().ventilateur_forge ?? 0) < 1) return;
          this.ctx.retirer("ventilateur_forge", 1);
          i.etat = { ...i.etat, ventilateur: true };
          this.ctx.majInstallation(i);
          this.ctx.info("Le ventilateur souffle à ta place : plus besoin de pomper.");
        });
        return true;
      }
      default:
        return false;
    }
  }

  /** Ce que rendent les accessoires d'une forge qu'on démonte (tout revient entier, l'huile restée dans le bac est perdue). */
  static accessoiresRendus(i: Pick<InstallationVue, "type" | "etat">): Inventaire {
    if (i.type !== "forge") return {};
    const r: Inventaire = {};
    if (i.etat.enclume) r[ENCLUMES[i.etat.enclume].objet] = 1;
    if (i.etat.bac) Object.assign(r, COUT_BAC);
    if (i.etat.ventilateur) r.ventilateur_forge = 1;
    return r;
  }
}

