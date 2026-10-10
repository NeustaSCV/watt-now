// H1B, le Gué-aux-Saules, côté serveur (plan 0.8, chantier 11) : un lieu vivant partagé par tous les voyageurs, comme
// la halte de la station-service (Book 01 §2 bis). Le contenu et la géographie sont dans commun/src/gue.ts ; ici, ce qui
// vit : le bac et son radeau (G5, G6), la crue (G4), la cloche (G7), l'Éteint qui dérive (G2), le radier qui gronde
// (G1), les fouilles « par chance ».
//
// Ce module ne connaît pas le joueur : il passe par un `ContexteGue` (ce que le joueur lui prête), comme le tir. Ainsi
// joueur.ts n'ajoute que des appels d'une ligne.

import type { Position } from "../../commun/src/deplacement.ts";
import {
  BAC,
  BUTIN_GUE,
  CLOCHE,
  ENDURANCE_HALAGE,
  FOUILLES_GUE,
  ID_DERIVE,
  LIGNES_CRUE,
  LIGNE_DERIVE,
  BORD_DANGEREUX,
  PLAN_GUE,
  PORTEE_EMBARCADERE,
  RADEAU_AU_REPOS,
  RADIER,
  SIGNATURE_RADIER,
  VERSION_GUE,
  VITESSE_RADEAU,
  aBord,
  accostage,
  crue,
  eteintsGue,
  genererGue,
  placeRadeau,
  surLeRadier,
  zoneGue,
  type FouilleGue,
  type MouvementRadeau,
  type NiveauCrue,
} from "../../commun/src/gue.ts";
import type { Zone } from "../../commun/src/lieux.ts";
import type { Inventaire, TypeObjet } from "../../commun/src/objets.ts";
import type { Stimulus } from "../../commun/src/signature.ts";
import type { RessourceEnBase } from "./base.ts";
import { tirerCleRare } from "../../commun/src/vestiges.ts";
import type { Base } from "./base.ts";
import { LieuVivant, type DefinitionLieuVivant, type Voyageur } from "./lieu-vivant.ts";
import { ZONE_GUE } from "../../commun/src/lieux.ts";

/** Le geste du bac : un geste long (un appui le lance, un autre l'arrête, comme les autres gestes de plus de 5 s). */
export const LIBELLE_HALER = "Haler le bac";

/** Le gué : sa zone (avec le radeau et la crue, voir `Gue.zone`), son plan de vue, son contenu, ses Éteints. */
export function definitionGue(): DefinitionLieuVivant {
  return {
    cle: "gue",
    sacs: { lieu: "gue", terrainDe: 0 },
    zone: ZONE_GUE,
    // La cabane du passeur et la buvette de Chez Lulu arrêtent la vue ; le reste est à ciel ouvert.
    plan: PLAN_GUE,
    eteints: eteintsGue,
    ressources: genererGue,
    version: VERSION_GUE,
    butin: BUTIN_GUE,
  };
}

/** Ce que le joueur prête au gué : rien que des accès, aucune règle. */
export interface ContexteGue {
  readonly id: number;
  maintenant(): number;
  position(): Position;
  deplacer(p: Position): void;
  info(texte: string): void;
  endurance(): number;
  depenser(n: number): void;
  /** Un geste (haler le bac) : il s'arrête si l'on bouge, si l'on frappe, ou d'un second appui. */
  commencer(libelle: string, dureeS: number, appliquer: () => void): void;
  /** Le geste en cours, s'il y en a un. */
  geste(): string | null;
  annuler(): void;
}

/** Les fouilles du gué « par chance » (plan 0.8, chantier 11) : la table de chacune, au poids. */
const TABLES_FOUILLE: Record<FouilleGue, [TypeObjet, number][]> = {
  gue_cabane: [["corde", 3], ["chiffons", 2], ["casserole", 1], ["bache", 1]],
  gue_buvette: [["casserole", 3], ["chiffons", 3], ["corde", 1]],
  gue_barques: [["corde", 3], ["bache", 2]],
  gue_camping_car: [["bache", 2], ["chiffons", 2], ["casserole", 2], ["corde", 1]],
  gue_lavoir: [["chiffons", 4], ["corde", 1]],
  gue_garde_peche: [["corde", 3], ["bache", 1], ["chiffons", 1]],
};
/** Une fouille sur cinq ne donne rien ; une sur cinq donne deux choses. Les chiffons viennent par deux. */
const CHANCE_FOUILLE = { une: 0.8, deux: 0.2 } as const;

/**
 * Ce qu'une fouille du gué rapporte : par chance, une bâche, des chiffons, une casserole, une corde ; rarement une clé
 * de L1 (R-BUTIN : `tirerCleRare("H1B")`). Rien pour ce qui n'est pas une fouille du gué.
 */
export function fouilleDuGue(type: string, alea: () => number): Inventaire {
  const table = TABLES_FOUILLE[type as FouilleGue];
  if (!table) return {};
  const trouve: Inventaire = {};
  const tirer = () => {
    const total = table.reduce((s, [, p]) => s + p, 0);
    let r = Math.min(alea(), 0.999999) * total;
    for (const [t, p] of table) {
      if (r < p) return t;
      r -= p;
    }
    return table[table.length - 1]![0];
  };
  const n = alea() < CHANCE_FOUILLE.une ? (alea() < CHANCE_FOUILLE.deux ? 2 : 1) : 0;
  for (let i = 0; i < n; i++) {
    const t = tirer();
    trouve[t] = (trouve[t] ?? 0) + (t === "chiffons" ? 2 : 1);
  }
  const cle = tirerCleRare("H1B", alea);
  if (cle) trouve[cle] = (trouve[cle] ?? 0) + 1;
  return trouve;
}

/** Les deux têtes du radier (sur les berges) : où l'eau qui monte repousse qui s'y trouve. */
const TETES_RADIER = [{ x: RADIER.x1 + 0.6, z: (RADIER.z0 + RADIER.z1) / 2 }, { x: RADIER.x0 - 0.6, z: (RADIER.z0 + RADIER.z1) / 2 }] as const;

export class Gue extends LieuVivant {
  private readonly debut: number;
  /** Le dernier instant connu (le tic, ou un geste) : la zone suit le radeau à cet instant. */
  private instant = 0;
  /** Le radeau du bac : sa place, et où il va. */
  private mouvement: MouvementRadeau = { ...RADEAU_AU_REPOS };
  /** Qui hale, et s'il hale encore. */
  private haleur: ContexteGue | null = null;
  /** Où il allait la dernière fois (pour reprendre au milieu de l'eau). */
  private dernierVers: number = BAC.ponton.x;
  /** Le niveau de l'eau (null : pas encore lu). */
  private niveau: NiveauCrue | null = null;
  /** Les joueurs passés ici, et la place du radeau à leur dernier pas (pour les emporter avec lui). */
  private readonly passagers = new Map<number, { ctx: ContexteGue; radeau: number }>();
  /** La place du radeau au tic d'avant (pour emporter les Éteints montés à bord). */
  private radeauAvant: number = RADEAU_AU_REPOS.x;
  /** Où dérive l'Éteint du radier (G2) : vers l'aval ou vers l'amont du bord (+1, −1). */
  private sensDerive: 1 | -1 = 1;

  constructor(base: Base, alea: () => number = Math.random) {
    super(base, definitionGue(), alea);
    this.debut = base.debutMonde();
  }

  // ---------- Ce que voit le jeu ----------

  /** La zone où l'on se déplace : celle du gué, avec le radeau à sa place et le radier noyé par la crue. */
  override get zone(): Zone {
    return zoneGue({ radeau: placeRadeau(this.mouvement, this.instant), noye: this.niveau === "noye" });
  }

  /** Le mouvement du radeau (pour l'écran : il le prolonge seul). */
  get radeau(): MouvementRadeau {
    return { ...this.mouvement };
  }

  get niveauEau(): NiveauCrue {
    return this.niveau ?? crue(this.instant, this.debut).niveau;
  }

  override entrer(v: Voyageur): void {
    super.entrer(v);
    v.envoyer({ t: "gue", radeau: this.radeau });
    if (this.niveauEau === "noye") v.envoyer({ t: "info", texte: LIGNES_CRUE.noye });
  }

  override sortir(v: Voyageur): void {
    super.sortir(v);
    const id = v.humain().id;
    this.passagers.delete(id);
    if (this.haleur?.id === id) this.arreterRadeau(this.instant);
  }

  /** Le gisement de glaise ne s'épuise pas (B6) : le prendre ne change rien pour personne. */
  override prendrePar(r: RessourceEnBase, compteId: number, instant: number): void {
    if (this.delaiRepousse(r.type) === 0) return;
    super.prendrePar(r, compteId, instant);
  }

  // ---------- Les gestes ----------

  /** Haler le bac (G5) : à bord, vers l'autre rive ; depuis la cale ou le ponton, rappeler le radeau à vide (G6). */
  haler(ctx: ContexteGue): void {
    const instant = ctx.maintenant();
    this.instant = Math.max(this.instant, instant);
    const xr = placeRadeau(this.mouvement, instant);
    const p = ctx.position();
    if (this.haleur && this.haleur.id !== ctx.id && this.haleur.geste() === LIBELLE_HALER) return ctx.info("Quelqu'un hale déjà le bac : un seul tire la corde.");
    let vers: number;
    if (aBord(p.x, p.z, xr, 0.2)) {
      const ou = accostage(xr);
      vers = ou === "cale" ? BAC.ponton.x : ou === "ponton" ? BAC.cale.x : (this.mouvement.vers ?? this.dernierVers);
    } else {
      const quai = [{ ou: "cale" as const, ...BAC.cale }, { ou: "ponton" as const, ...BAC.ponton }].find((q) => Math.hypot(q.embarquement.x - p.x, q.embarquement.z - p.z) <= PORTEE_EMBARCADERE);
      if (!quai) return ctx.info("Approche-toi du bac : à bord, ou sur la cale, ou sur le ponton.");
      if (accostage(xr) === quai.ou) return ctx.info("Le radeau est là : monte à bord pour haler.");
      vers = quai.x;
    }
    const duree = Math.abs(vers - xr) / VITESSE_RADEAU;
    if (duree < 0.05) return;
    ctx.commencer(LIBELLE_HALER, duree, () => {});
    if (ctx.geste() !== LIBELLE_HALER) return;
    this.haleur = ctx;
    this.dernierVers = vers;
    this.mouvement = { x: xr, depuis: instant, sens: vers > xr ? 1 : -1, vers };
    this.diffuser({ t: "gue", radeau: this.radeau });
  }

  /** La cloche du passeur (G7) : un leurre qu'on entend à 40 m, le temps de trois coups. */
  sonnerCloche(ctx: ContexteGue): void {
    const instant = ctx.maintenant();
    const p = ctx.position();
    if (Math.hypot(CLOCHE.x - p.x, CLOCHE.z - p.z) > 2.6) return ctx.info("Approche-toi de la cloche.");
    if (this.bruitEnCours("cloche", instant)) return;
    this.ajouterBruit("cloche", { genre: "son", x: CLOCHE.x, z: CLOCHE.z, portee: CLOCHE.portee, intensite: 1.3 }, instant + CLOCHE.dureeS * 1000);
    this.diffuser({ t: "gue", radeau: this.radeau, cloche: true });
  }

  // ---------- Ce qui suit le joueur, à chacun de ses pas ----------

  /**
   * À chaque pas d'un joueur au gué : le radeau l'emporte s'il est à bord ; s'il hale, la corde lui coûte un peu
   * d'endurance (G5).
   */
  suivre(ctx: ContexteGue, dt: number): void {
    const instant = ctx.maintenant();
    const xr = placeRadeau(this.mouvement, instant);
    const avant = this.passagers.get(ctx.id);
    const p = ctx.position();
    if (avant && avant.radeau !== xr && aBord(p.x, p.z, avant.radeau, 0.05)) ctx.deplacer({ ...p, x: p.x + (xr - avant.radeau) });
    this.passagers.set(ctx.id, { ctx, radeau: xr });
    if (this.haleur?.id === ctx.id && this.mouvement.sens !== 0 && ctx.geste() === LIBELLE_HALER) {
      ctx.depenser(ENDURANCE_HALAGE * dt);
      if (ctx.endurance() < 3) {
        ctx.annuler();
        ctx.info("À bout de souffle : tu lâches la corde. Le radeau s'arrête là où il est.");
      }
    }
  }

  /** Une fouille du gué, « par chance » : ce qu'on trouve, ou rien cette fois. */
  fouiller(type: string, alea: () => number, recevoir: (trouve: Inventaire) => void, info: (texte: string) => void): void {
    if (!(FOUILLES_GUE as readonly string[]).includes(type)) return;
    const trouve = fouilleDuGue(type, alea);
    if (Object.keys(trouve).length > 0) recevoir(trouve);
    else info("Rien d'utile, cette fois.");
  }

  /** Sur le radier, l'eau couvre les pas (G1) : les bruits qu'on fait soi-même portent trois fois moins. */
  assourdir(stimuli: Stimulus[], p: { x: number; z: number }): Stimulus[] {
    if (!surLeRadier(p.x, p.z)) return stimuli;
    return stimuli.map((s) => (s.genre === "son" && Math.hypot(s.x - p.x, s.z - p.z) < 1 ? { ...s, portee: s.portee * SIGNATURE_RADIER } : s));
  }

  /** On marche sur le radier, on n'y court pas (Q-0.8-22). */
  pasDeCourse(p: { x: number; z: number }): boolean {
    return surLeRadier(p.x, p.z);
  }

  // ---------- Le temps qui passe ----------

  override tick(instant: number, dt: number): void {
    this.instant = instant;
    this.suivreLEau(instant);
    this.suivreLeRadeau(instant);
    this.deriver(dt);
    super.tick(instant, dt);
  }

  private arreterRadeau(instant: number): void {
    const x = placeRadeau(this.mouvement, instant);
    this.mouvement = { x, depuis: instant, sens: 0 };
    this.haleur = null;
    this.diffuser({ t: "gue", radeau: this.radeau });
  }

  /** Le radeau avance tant qu'on le hale ; il s'arrête à l'accostage, ou dès qu'on lâche la corde. */
  private suivreLeRadeau(instant: number): void {
    if (this.mouvement.sens !== 0) {
      const x = placeRadeau(this.mouvement, instant);
      const arrive = this.mouvement.vers !== undefined && Math.abs(x - this.mouvement.vers) < 1e-6;
      const lache = !this.haleur || this.haleur.geste() !== LIBELLE_HALER;
      if (arrive || lache) this.arreterRadeau(instant);
    }
    // Les Éteints montés à bord partent avec le radeau.
    const xr = placeRadeau(this.mouvement, instant);
    if (xr !== this.radeauAvant) {
      for (const e of this.eteints) if (e.etat !== "detruit" && aBord(e.x, e.z, this.radeauAvant, 0.05)) e.x += xr - this.radeauAvant;
      this.radeauAvant = xr;
    }
  }

  /** La crue (G4) : le carnet le dit d'une ligne ; le radier noyé repousse vers la rive qui s'y trouve. */
  private suivreLEau(instant: number): void {
    const { niveau } = crue(instant, this.debut);
    const avant = this.niveau;
    this.niveau = niveau;
    if (avant === null || avant === niveau) return;
    if (!(avant === "monte" && niveau === "bas")) this.diffuser({ t: "info", texte: LIGNES_CRUE[niveau] });
    if (niveau !== "noye") return;
    const pres = (x: number) => TETES_RADIER.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    for (const { ctx } of this.passagers.values()) {
      const p = ctx.position();
      if (!surLeRadier(p.x, p.z) && !(Math.abs(p.z - (RADIER.z0 + RADIER.z1) / 2) < 3 && p.x > RADIER.x0 && p.x < RADIER.x1)) continue;
      const t = pres(p.x);
      ctx.deplacer({ x: t.x, z: t.z, o: p.o });
      ctx.info("L'eau monte d'un coup : tu regagnes la rive, trempé jusqu'aux genoux.");
    }
    for (const e of this.eteints) {
      if (e.id === ID_DERIVE || e.etat === "detruit" || !surLeRadier(e.x, e.z)) continue;
      const t = pres(e.x);
      e.x = t.x;
      e.z = t.z + 1;
      e.saisit = null;
    }
  }

  /**
   * L'Éteint qui dérive (G2) : au sol, dans l'eau, il suit le bord amont du radier ; il remonte vers qui marche dessus,
   * et agrippe la cheville de qui passe trop près du bord. On marche au milieu, ou on l'achève (il est au sol).
   */
  private deriver(dt: number): void {
    const e = this.eteints.find((x) => x.id === ID_DERIVE);
    if (!e || e.etat === "detruit") return;
    e.z = LIGNE_DERIVE.z;
    if (e.saisit !== null || e.etourdi > 0 || e.etat === "a_terre") return;
    const surRadier = [...this.passagers.values()].map((v) => v.ctx.position()).filter((p) => surLeRadier(p.x, p.z));
    const proie = surRadier.sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0];
    let cible: number;
    if (proie) cible = Math.max(LIGNE_DERIVE.x0, Math.min(LIGNE_DERIVE.x1, proie.x));
    else {
      if (e.x >= LIGNE_DERIVE.x1 - 0.05) this.sensDerive = -1;
      if (e.x <= LIGNE_DERIVE.x0 + 0.05) this.sensDerive = 1;
      cible = this.sensDerive > 0 ? LIGNE_DERIVE.x1 : LIGNE_DERIVE.x0;
    }
    const vitesse = LIGNE_DERIVE.vitesse * (proie ? 1.5 : 1);
    const pas = Math.max(-vitesse * dt, Math.min(vitesse * dt, cible - e.x));
    e.x += pas;
    if (Math.abs(pas) > 1e-4) e.o = pas > 0 ? Math.PI / 2 : -Math.PI / 2;
    // Trop près du bord amont : une main sort de l'eau.
    for (const { ctx } of this.passagers.values()) {
      const p = ctx.position();
      if (!surLeRadier(p.x, p.z) || p.z - RADIER.z0 >= BORD_DANGEREUX || Math.abs(p.x - e.x) > 0.8) continue;
      if (this.eteints.some((x) => x.saisit === ctx.id)) continue;
      e.saisit = ctx.id;
      e.tenue = 0;
      e.contact = 0;
      e.etat = "poursuivant";
      e.o = Math.atan2(p.x - e.x, p.z - e.z);
      ctx.info("Une main sort de l'eau et t'agrippe la cheville !");
      return;
    }
  }
}
