// Le serveur des projectiles (Book 23 §5, Book 25 §3.4 et §10.3, chantier 1 · 0.6).
//
// Le client ne fait que dire « je bande » puis « je lâche, par là, sur lui ». Le serveur décide de tout : l'objet prêt,
// la cadence, l'angle, la distance (bornée), le premier mur sur la trajectoire, le premier Éteint sur la ligne,
// l'impact contre la position réelle de l'Éteint, la casse de la munition, et l'objet posé au sol, qu'on ramasse.
//
// Ce module ne connaît pas le joueur : il passe par un `ContexteTir` (ce que le joueur lui prête). Ainsi joueur.ts
// n'ajoute que des appels d'une ligne (Book 25 §10.4).

import type { Arme } from "../../commun/src/combat.ts";
import { encaisser, type Eteint, type ResultatCoup } from "../../commun/src/eteints.ts";
import type { LieuJouable, Zone } from "../../commun/src/lieux.ts";
import type { MessageServeur, ProjectileVu } from "../../commun/src/messages.ts";
import { estCleObjet, nommer, type Inventaire } from "../../commun/src/objets.ts";
import type { Position } from "../../commun/src/deplacement.ts";
import type { Stimulus } from "../../commun/src/signature.ts";
import { distanceMare } from "../../commun/src/terrain.ts";
import { typeDe, type CleObjet } from "../../commun/src/etoiles.ts";
import { rearmement } from "../../commun/src/mecanique.ts";
import {
  BRUIT_IMPACT_TIR,
  DISTANCE_LEURRE,
  PART_TETE_EQUIPE,
  TABLES_TIR,
  TREMBLE_APRES_MS,
  TREMBLE_PAR_SECONDE,
  VITESSE_TIR,
  armeTirExemplaire,
  chanceDeToucher,
  deFace,
  distanceAuSegment,
  estLancable,
  premierMur,
  pretALancer,
  type ArmeTir,
  type Munition,
  type ObjetLance,
  type Pret,
  type TablesTir,
} from "../../commun/src/tir.ts";

/** Ce que le joueur prête au moteur des projectiles. */
export interface ContexteTir {
  readonly id: number;
  maintenant(): number;
  alea(): number;
  position(): Position;
  /** Se tourner vers où l'on lance. */
  orienter(o: number): void;
  lieu(): LieuJouable;
  zone(): Zone;
  eteints(): Eteint[];
  inventaire(): Inventaire;
  retirer(cle: CleObjet, n: number): void;
  /** Poser un objet au sol, là où il est tombé (un tas ramassable). */
  poserAuSol(objets: Inventaire, ou: { x: number; z: number }): void;
  /** Un Éteint le tient. */
  saisi(): boolean;
  /** Une raison de ne pas lancer (en route, les bras pris, endormi…), ou null. */
  empeche(): string | null;
  endurance(): number;
  depenser(endurance: number): void;
  info(texte: string): void;
  indice(sorte: string, texte: string): void;
  /** Envoyer à soi seul. */
  envoyer(m: MessageServeur): void;
  /** Envoyer à tous ceux du lieu (soi compris). */
  diffuser(m: MessageServeur): void;
  /** Un tir use l'arme (Book 23 §4.3) : elle peut casser. */
  user(arme: Arme): void;
  /** Ce qui suit la destruction d'un Éteint (la clé du magasinier, le tutoriel). */
  apresDestruction(e: Eteint): void;
  /** Un geste (réarmer l'arbalète : immobile, il s'arrête si l'on bouge). */
  commencer(libelle: string, dureeS: number, appliquer: () => void): void;
  /** Un fait pour les quêtes (« tete:fleche », « tete:carreau » : un Éteint détruit d'un tir à la tête, Book 25 §9.4). */
  noter?(fait: string): void;
}

/** On accroche un Éteint jusqu'à 35° de la direction donnée (le client l'a visé ; une petite marge pour le réseau). */
const ANGLE_ACCROCHE = (35 * Math.PI) / 180;
/** Un projectile heurte un Éteint qui passe à moins de 0,45 m de sa ligne. */
const RAYON_TOUCHE = 0.45;
/** Le projectile part d'un peu devant soi. */
const DEPART = 0.3;
/** La corde qui claque, l'impact : des bruits brefs (s). */
const DUREE_BRUIT_TIR = 0.6;

/** Ce qu'un impact fait à un Éteint. */
export type Touche =
  | { genre: "lancer"; def: ObjetLance; heureux: boolean }
  | { genre: "tir"; degats: number; tete: boolean };

/** Une arme le temps d'un impact, pour la règle commune des coups (`encaisser`, eteints.ts). */
function armeDImpact(type: Arme["type"], degats: number, tueALaTete: boolean, nom: string): Arme {
  return { objet: null, nom, type, solidite: Infinity, degatsTorse: degats, tueALaTete, allonge: 0, coup: 0, coupAppuye: 0 };
}

/**
 * Ce que fait un projectile qui touche (Book 23 §5, Book 25 §3.4). La règle des coups ne change pas (`encaisser`) :
 * - la pierre étourdit, sur n'importe quel impact, et ne fait presque rien au torse ; elle n'achève pas un Éteint à terre ;
 * - la hachette lancée touche le torse, ou, sur un coup heureux, la tête (le casque l'arrête : elle est tranchante) ;
 * - la flèche et le carreau : un tir plein à portée de tête détruit ; sinon, le torse. `tete` le dit déjà (le casque, la
 *   pointe, la portée sont jugés avant).
 */
export function toucher(e: Eteint, t: Touche, de: { x: number; z: number }, zone: Zone): ResultatCoup {
  if (t.genre === "tir") return encaisser(e, armeDImpact("percant", t.degats, true, "la flèche"), t.tete, 1, de, zone);
  const d = t.def;
  const arme = armeDImpact(d.type, d.degats, d.coupHeureux > 0, d.nom);
  const auSol = e.etat === "a_terre" || e.variante === "rampant";
  // Une pierre sur un Éteint à terre : elle rebondit. Il faut une vraie arme pour l'achever.
  if (auSol && d.degats < 1) return "vacille";
  const resultat = encaisser(e, arme, t.heureux && !auSol, 1, de, zone);
  // Étourdi le temps prévu (la pierre : 1 s), sans raccourcir une tétanie.
  if (resultat === "vacille" && d.etourdi > 0) e.etourdi = (e.raidi ?? 0) > 0 ? Math.max(e.etourdi, d.etourdi) : d.etourdi;
  return resultat;
}

/** Le moteur des projectiles d'un joueur. */
export class Tir {
  /** L'objet rapide choisi (« Prêt à lancer / Prêt à tirer ») ; null : la pierre. */
  private choisi: CleObjet | null = null;
  /** Depuis quand le bouton Lancer est tenu (l'arc bandé) ; null : relâché. */
  private bandeDepuis: number | null = null;
  /** Pas de nouveau lancer avant (la cadence, encocher). */
  private prochain = 0;
  /** Les arbalètes tirées, à réarmer (par exemplaire). */
  private readonly desarmees = new Set<CleObjet>();
  /** Les bruits en cours : la corde, les impacts, le réveil qui sonne. */
  private bruits: { stimulus: Stimulus; jusqua: number }[] = [];
  private readonly ctx: ContexteTir;
  private readonly tables: TablesTir;

  constructor(ctx: ContexteTir, tables: TablesTir = TABLES_TIR) {
    this.ctx = ctx;
    this.tables = tables;
  }

  /** Ce qui est choisi (pour la bienvenue). */
  get pret(): CleObjet | null {
    return this.choisi;
  }

  /** Ce que le bouton Lancer fera partir, maintenant. */
  pretActuel(): Pret | null {
    return pretALancer(this.ctx.inventaire(), this.choisi, this.tables);
  }

  /** Choisir l'objet rapide (Sac → « Prêt à lancer »). null : revenir à la pierre. */
  preparer(objet: CleObjet | null): void {
    if (objet !== null) {
      if (!estCleObjet(objet) || !estLancable(objet, this.tables) || (this.ctx.inventaire()[objet] ?? 0) < 1) return;
    }
    this.choisi = objet;
    this.bandeDepuis = null;
    this.envoyerPret();
    const p = this.pretActuel();
    if (!p) return this.ctx.info("Plus rien de prêt à lancer.");
    const nom = p.genre === "lancer" ? p.def.nom : p.arme.nom;
    this.ctx.info(`${p.genre === "tir" ? "Prêt à tirer" : "Prêt à lancer"} : ${nom}. Maintiens {lancer} pour viser, relâche.`);
  }

  private envoyerPret(): void {
    const p = this.pretActuel();
    const armee = p?.genre === "tir" && p.arme.armeeDAvance ? !this.desarmees.has(p.cle) : undefined;
    this.ctx.envoyer({ t: "pret", objet: this.choisi, ...(armee !== undefined ? { armee } : {}) });
  }

  /** Le bouton Lancer enfoncé : l'arc se bande (ça coûte de l'endurance), un objet se prend en main. */
  bander(): void {
    const p = this.pretActuel();
    if (!p || this.ctx.empeche() || this.ctx.saisi()) return;
    // L'arbalète désarmée : le bouton Lancer la réarme (un geste immobile).
    if (p.genre === "tir" && p.arme.armeeDAvance && this.desarmees.has(p.cle)) return this.rearmer();
    if (p.genre === "tir" && !p.arme.armeeDAvance) {
      if (this.ctx.endurance() < p.arme.endurance) return this.ctx.info("Trop essoufflé pour bander l'arc : souffle un instant.");
      this.ctx.depenser(p.arme.endurance);
    }
    this.bandeDepuis = this.ctx.maintenant();
  }

  /** Tenir l'arc bandé plus de 3 s fait trembler le bras (Book 25 §3.4). */
  tick(dt: number): void {
    if (this.bandeDepuis === null) return;
    const p = this.pretActuel();
    if (!p || p.genre !== "tir" || p.arme.armeeDAvance) return;
    if (this.ctx.maintenant() - this.bandeDepuis > TREMBLE_APRES_MS) this.ctx.depenser(Math.min(this.ctx.endurance(), TREMBLE_PAR_SECONDE * dt));
  }

  /** Les bruits du tir (Book 25 §3.4 : la corde à 3 m, l'impact à 4 m ; le réveil, 20 s). */
  stimuli(): Stimulus[] {
    const instant = this.ctx.maintenant();
    this.bruits = this.bruits.filter((b) => b.jusqua > instant);
    return this.bruits.map((b) => b.stimulus);
  }

  /** On change de lieu : ce qui sonnait ici reste ici, et l'on relâche la corde. */
  quitterLieu(): void {
    this.bruits = [];
    this.bandeDepuis = null;
  }

  private bruit(x: number, z: number, portee: number, dureeS: number, intensite = 1): void {
    if (portee <= 0) return;
    this.bruits.push({ stimulus: { genre: "son", x, z, portee, intensite }, jusqua: this.ctx.maintenant() + dureeS * 1000 });
  }

  /** Réarmer l'arbalète (Book 25 §6.1) : un geste immobile, qui coûte de l'endurance. */
  rearmer(): void {
    const p = this.pretActuel();
    if (!p || p.genre !== "tir" || !p.arme.armeeDAvance) return;
    if (!this.desarmees.has(p.cle)) return this.ctx.info(`${majuscule(p.arme.nom)} est déjà armée.`);
    if (this.ctx.saisi()) return this.ctx.info("Il te tient : dégage-toi d'abord ({examiner}).");
    if (this.ctx.endurance() < p.arme.endurance) return this.ctx.info("Trop essoufflé pour réarmer : souffle un instant.");
    const cle = p.cle;
    const arme = p.arme;
    // La lourde est trop raide pour le pied : le cranequin ou le pied-de-biche (Book 25 §6.1, chantier 7).
    const comment = rearmement(arme, this.ctx.inventaire());
    if (!comment) return this.ctx.info(`Trop raide pour le pied : il faut ${(arme.rearmerAvec ?? []).map((o) => `un ${nommer(o.objet, 1)}`).join(" ou ")}.`);
    this.ctx.commencer(`Réarmer ${arme.nom}${comment.outil ? ` (${nommer(comment.outil, 1)})` : ""}`, comment.ms / 1000, () => {
      this.ctx.depenser(Math.min(this.ctx.endurance(), arme.endurance));
      this.desarmees.delete(cle);
      this.envoyerPret();
    });
  }

  /**
   * Le bouton Lancer relâché : dans la direction (dx, dz), sur l'Éteint `cible` (une arme) ou au point à `distance`
   * (un leurre). Tout est vérifié ici.
   */
  lancer(dx: number, dz: number, cible?: number, distance?: number): void {
    const ctx = this.ctx;
    const instant = ctx.maintenant();
    const bande = this.bandeDepuis;
    this.bandeDepuis = null;
    const empeche = ctx.empeche();
    if (empeche) return ctx.info(empeche);
    if (ctx.saisi()) return ctx.info("Il te tient : on ne lance rien. Dégage-toi d'abord ({examiner}).");
    const p = this.pretActuel();
    if (!p) return ctx.info("Rien à lancer : une pierre, ou Sac → « Prêt à lancer ».");
    // La cadence : on ne lance pas plus vite que le geste (encocher, reprendre une pierre en main).
    if (instant < this.prochain) return;

    // Ce qui part, et ce qu'il peut faire.
    let portee: number;
    let utile: number;
    let tete: number | null = null;
    let cout = 0;
    let tir: (ArmeTir & { etoiles: unknown }) | null = null;
    let munition: Munition | null = null;
    let plein = false;
    if (p.genre === "tir") {
      tir = armeTirExemplaire(p.cle, p.arme);
      munition = p.munition;
      if (!munition) return ctx.info(`Plus rien à tirer avec ${tir.nom} : il te faut des ${tir.armeeDAvance ? "carreaux" : "flèches"}.`);
      // Désarmée : le lâcher ne tire rien (l'appui a lancé le geste « Réarmer »).
      if (tir.armeeDAvance && this.desarmees.has(p.cle)) return;
      plein = tir.degatsRapide === null || (bande !== null && instant - bande >= tir.pleinMs);
      portee = tir.porteeMax;
      utile = tir.porteeUtile;
      tete = plein && munition.tueALaTete ? tir.porteeTete : null;
      // Sans « bander » (un client pressé), l'arc se bande au lâcher : l'endurance se paie quand même.
      if (!tir.armeeDAvance && bande === null) cout = tir.endurance;
    } else {
      portee = p.def.portee;
      utile = p.def.portee;
      cout = p.def.endurance;
    }
    if (ctx.endurance() < cout) return ctx.info("Trop essoufflé pour lancer : souffle un instant.");

    // La direction : celle du client, ou devant soi.
    const pos = ctx.position();
    const l = Math.hypot(dx, dz);
    let ux = l > 0.01 ? dx / l : Math.sin(pos.o);
    let uz = l > 0.01 ? dz / l : Math.cos(pos.o);

    // La cible : l'Éteint accroché, s'il est bien devant, à portée (une arme) ; sinon un point (un leurre, ou dans le vide).
    const leurre = p.genre === "lancer" && p.def.genre === "leurre";
    let visee: Eteint | null = null;
    if (!leurre && cible !== undefined) {
      const e = ctx.eteints().find((x) => x.id === cible && x.etat !== "detruit");
      if (e) {
        const ex = e.x - pos.x;
        const ez = e.z - pos.z;
        const d = Math.hypot(ex, ez);
        const ecart = Math.acos(Math.max(-1, Math.min(1, (ex * ux + ez * uz) / Math.max(d, 1e-6))));
        if (d <= portee + 0.5 && (ecart <= ANGLE_ACCROCHE || d < 1)) visee = e;
      }
    }
    if (visee) {
      const d = Math.hypot(visee.x - pos.x, visee.z - pos.z) || 1;
      ux = (visee.x - pos.x) / d;
      uz = (visee.z - pos.z) / d;
    }
    const x0 = pos.x + ux * DEPART;
    const z0 = pos.z + uz * DEPART;
    let longueur = visee ? Math.hypot(visee.x - pos.x, visee.z - pos.z) : leurre ? Math.min(distance ?? DISTANCE_LEURRE, portee) : Math.min(distance ?? portee, portee);
    // Manqué (au-delà de la portée utile) : le projectile passe à côté et file plus loin.
    let manque = false;
    let ecartLateral = 0;
    if (visee && longueur > utile) {
      manque = ctx.alea() >= chanceDeToucher(longueur, utile, portee);
      if (manque) {
        ecartLateral = (ctx.alea() < 0.5 ? -1 : 1) * 0.9;
        longueur = Math.min(portee, longueur + 3);
      }
    }
    let x1 = pos.x + ux * longueur - uz * ecartLateral;
    let z1 = pos.z + uz * longueur + ux * ecartLateral;

    // Le premier mur : on ne lance pas à travers un rayonnage, ni par-dessus.
    const zone = ctx.zone();
    const t = premierMur(zone, x0, z0, x1, z1);
    let impact: ProjectileVu["impact"] = "sol";
    if (t < 1) {
      const recul = 0.15 / Math.max(Math.hypot(x1 - x0, z1 - z0), 1e-6);
      const k = Math.max(0, t - recul);
      x1 = x0 + (x1 - x0) * k;
      z1 = z0 + (z1 - z0) * k;
      impact = "mur";
    }

    // Le premier Éteint sur la ligne (un leurre passe en cloche au-dessus) ; celui qu'on a manqué n'en est pas.
    let touche: Eteint | null = null;
    if (!leurre) {
      let meilleur = Infinity;
      for (const e of ctx.eteints()) {
        if (e.etat === "detruit" || (manque && e === visee)) continue;
        // Un Éteint couché ne se touche que si on le vise.
        if (e.etat === "a_terre" && e !== visee) continue;
        const s = distanceAuSegment(e.x, e.z, x0, z0, x1, z1);
        const proche = e === visee && !manque ? s.d <= RAYON_TOUCHE + 0.3 : s.d <= RAYON_TOUCHE;
        if (proche && s.t < meilleur) {
          meilleur = s.t;
          touche = e;
        }
      }
    }

    // Il part : l'endurance, l'objet ou la munition, la cadence.
    ctx.depenser(cout);
    ctx.orienter(Math.atan2(ux, uz));
    if (tir && munition) {
      // Les munitions n'ont pas d'étoiles : leur clé est leur type.
      ctx.retirer(munition.objet, 1);
      this.prochain = instant + (tir.armeeDAvance ? tir.pleinMs : tir.rechargeMs);
      this.bruit(pos.x, pos.z, tir.bruit, DUREE_BRUIT_TIR);
      // Chaque tir use l'arme (150 tirs pour un arc simple).
      ctx.user({ objet: tir.objet, nom: tir.nom, type: "percant", solidite: tir.solidite, degatsTorse: 0, tueALaTete: false, allonge: 0, coup: 0, coupAppuye: 0, ...(p.cle !== tir.objet ? { cle: p.cle } : {}) });
      if (tir.armeeDAvance) {
        this.desarmees.add(p.cle);
        ctx.indice("rearmer", "Désarmée : {lancer} la réarme, sans bouger.");
      }
    } else if (p.genre === "lancer") {
      ctx.retirer(p.cle, 1);
      this.prochain = instant + p.def.cadenceMs;
    }

    // L'impact.
    let coup: ProjectileVu["coup"];
    let ou = { x: x1, z: z1 };
    if (touche) {
      ou = { x: touche.x, z: touche.z };
      impact = "eteint";
      let resultat: ResultatCoup;
      if (tir && munition) {
        const d = Math.hypot(touche.x - pos.x, touche.z - pos.z);
        // Le casque : la flèche passe par la visière, de face, à la moitié de la portée de tête.
        const porteeTete = tete === null ? -1 : touche.variante === "equipe" ? (deFace(touche, pos) ? tete * PART_TETE_EQUIPE : -1) : tete;
        const degats = plein ? tir.degatsPlein : (tir.degatsRapide ?? tir.degatsPlein);
        const aLaTete = d <= porteeTete;
        resultat = toucher(touche, { genre: "tir", degats, tete: aLaTete }, pos, zone);
        if (resultat === "detruit" && aLaTete) ctx.noter?.(tir.armeeDAvance ? "tete:carreau" : "tete:fleche");
      } else {
        const def = (p as Extract<Pret, { genre: "lancer" }>).def;
        resultat = toucher(touche, { genre: "lancer", def, heureux: def.coupHeureux > 0 && ctx.alea() < def.coupHeureux }, pos, zone);
      }
      coup = { id: touche.id, resultat };
      if (resultat === "detruit") ctx.apresDestruction(touche);
    }

    // Ce qui retombe : au sol, ramassable ; dans la mare, perdu ; une flèche qui touche casse parfois.
    const dansLaMare = ctx.lieu() === "terrain" && distanceMare(ou.x, ou.z) < 0;
    if (dansLaMare) impact = impact === "eteint" ? impact : "eau";
    const objet: CleObjet = tir && munition ? munition.objet : p.cle;
    let reste = !dansLaMare;
    if (touche && tir && munition && ctx.alea() < munition.casse) {
      reste = false;
      ctx.indice("casse", `${majuscule(nommer(munition.objet, 1))} s'est cassée.`);
    }
    if (reste) ctx.poserAuSol({ [objet]: 1 }, ou);
    else if (dansLaMare) ctx.indice("mare", "Perdu dans la mare.");

    // Le bruit de l'impact ; le réveil, lui, sonne (s'il n'est pas dans l'eau).
    if (tir) this.bruit(ou.x, ou.z, BRUIT_IMPACT_TIR, DUREE_BRUIT_TIR);
    else if (p.genre === "lancer") {
      this.bruit(ou.x, ou.z, p.def.bruitImpact.portee, p.def.bruitImpact.duree);
      if (p.def.sonne && !dansLaMare) this.bruit(ou.x, ou.z, p.def.sonne.portee, p.def.sonne.duree, p.def.sonne.intensite);
    }

    const vol = Math.hypot(ou.x - x0, ou.z - z0);
    const vitesse = tir ? VITESSE_TIR : (p as Extract<Pret, { genre: "lancer" }>).def.vitesse;
    const projectile: ProjectileVu = {
      de: ctx.id,
      objet: typeDe(objet),
      x0: arrondi(x0),
      z0: arrondi(z0),
      x1: arrondi(ou.x),
      z1: arrondi(ou.z),
      duree: Math.round((vol / vitesse) * 1000),
      impact,
      ...(coup ? { coup } : {}),
      ...(tir ? { tir: true as const } : {}),
    };
    ctx.diffuser({ t: "projectile", projectile });
    if (tir?.armeeDAvance || p.genre === "lancer") this.envoyerPret();
  }
}

function majuscule(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function arrondi(v: number): number {
  return Math.round(v * 100) / 100;
}
