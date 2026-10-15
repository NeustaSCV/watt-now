// L2B, le phare du cap, côté serveur (plan 0.10, chantier K) : un lieu vivant par joueur, construit par le registre
// (LieuxPersonnels : gardé en base `phare:<compte>`, revenu tout entier à 24 h, S-04), avec ses règles à lui, « le feu et
// le cargo » (S-12 à S-18). Le plan, les endroits et les textes sont dans commun/src/phare.ts ; la vue, le milieu, les
// Éteints et le butin dans commun/src/phare-vivant.ts.
//
// Ce qu'on garde entre deux visites, en plus de ce que garde tout lieu à soi (les Éteints détruits, le butin pris) :
// - l'épave échouée, un état du lieu comme une porte (`portes.epave`, S-02) : la zone change (commun/src/phare.ts) ;
// - le reste dans `propre` (EtatPhare) : où est l'escabeau, le bidon, le prisme, l'heure de l'allumage, le compresseur
//   réparé, la nuit où la corne a sonné. Une partie d'avant la 0.10 n'a rien gardé ici : tout part de l'état neuf.
//
// Le serveur reste en 2D (L-1) : monter à la lanterne est un geste au pied de l'escalier coupé, l'escabeau posé à la
// marque ; la grève, la rampe et le pont de l'épave sont des endroits du plan, et le client les pose à leur hauteur.

import { estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import type { Cible } from "../../commun/src/messages.ts";
import {
  CARGO_MS,
  CORNE,
  DUREES_PHARE,
  ENDROITS_PHARE,
  LUMIERE_LANTERNE,
  PORTEE_PHARE,
  PORTEE_SAUT,
  RAYON_MARQUE,
  TEXTES_PHARE,
  enSceneCargo,
  etatPhareNeuf,
  lireEtatPhare,
  nuitDe,
  type EtatPhare,
  type EtatPhareVu,
} from "../../commun/src/phare.ts";
import { arrivantsDeLaLande, remettreSurLaGreve } from "../../commun/src/phare-vivant.ts";
import { FOUILLES_DE_L_EPAVE, OBJETS_DE_L_EPAVE, type TypeRessourcePhare } from "../../commun/src/ressources-phare.ts";
import type { Base, RessourceEnBase } from "./base.ts";
import { JAMAIS, LieuVivant, type ContexteLieu, type DefinitionLieuVivant, type Voyageur } from "./lieu-vivant.ts";
import { LieuxPersonnels } from "./lieux-personnels.ts";

// Chantier V3 : les fouilles des conteneurs de l'épave aussi.
const DE_L_EPAVE = new Set<string>([...OBJETS_DE_L_EPAVE, ...FOUILLES_DE_L_EPAVE]);
/** Les objets-clés dont le délai dépasse les 24 h du retour du phare : ce retour ne les fait pas revenir avant l'heure. */
const DELAI_LONG = new Set<TypeRessourcePhare>(["phare_cloche", "phare_porte_four", "phare_soufflet", "phare_rabot"]);

/** Les bras pris, on ne fait rien d'autre (comme l'escabeau du terrain). */
const BRAS_PRIS = "Tu as les bras pris : pose d'abord l'escabeau.";

/** Le phare d'un joueur : un lieu vivant, plus « le feu et le cargo ». */
export class LieuPhare extends LieuVivant {
  private readonly baseDuPhare: Base;
  private readonly debutDuMonde: number;
  /** Ce que le phare garde de plus (`propre` de LieuxPersonnels, remplacé au retour à 24 h) et de quoi le sauver. */
  private propre: () => Record<string, unknown> = () => ({});
  /** Ceux qui viennent d'entrer : l'état du phare leur part au premier tic (après la bienvenue). */
  private readonly aPrevenir = new Set<number>();
  private readonly ici = new Set<Voyageur>();
  private readonly aleaDuPhare: () => number;
  /** La nuit (nuitDe) où des Éteints sont venus de la lande (en mémoire seulement : une fois par allumage). */
  private landeNuit: number | null = null;

  constructor(base: Base, definition: DefinitionLieuVivant, alea: () => number = Math.random) {
    super(base, definition, alea);
    this.aleaDuPhare = alea;
    this.baseDuPhare = base;
    this.debutDuMonde = base.debutMonde();
  }

  /** Le gardien lui confie ce qu'il garde (à chaque `de`, le même objet jusqu'au retour à 24 h). */
  lier(propre: () => Record<string, unknown>, instant: number): void {
    this.propre = propre;
    // Allumé puis laissé seul (le lieu déchargé de la mémoire) : le cargo s'est échoué entre-temps (S-17), sans scène.
    // K4 : le gardien relie le lieu à chaque fois qu'on le demande (le joueur qui marche le demande à chaque pas) ; avec
    // quelqu'un là, l'échouage s'annonce (la scène se joue), sinon il passait en silence et personne ne voyait la scène.
    this.echouerSiLHeureEstVenue(instant, this.ici.size > 0);
  }

  /** L'état du phare, relu (un champ abîmé ou absent prend sa valeur de départ). */
  get etat(): EtatPhare {
    return lireEtatPhare(this.propre());
  }

  private changer(e: Partial<EtatPhare>): EtatPhare {
    const nouvel = { ...this.etat, ...e };
    Object.assign(this.propre(), nouvel);
    return nouvel;
  }

  /** Ce que le client en sait (le message `phare`). */
  vue(instant: number): EtatPhareVu {
    const e = this.etat;
    return {
      escabeau: e.escabeau,
      bidon: e.bidon,
      prisme: e.prisme,
      lanterne: e.allumeLe !== null,
      compresseur: e.compresseur,
      corneSonnee: e.corneNuit === nuitDe(instant, this.debutDuMonde),
      // K2 : l'arrivée du cargo, pour que le client la mette en scène (ses feux, sa corne, puis la scène de l'échouage).
      ...(e.allumeLe !== null && this.portes.epave !== true ? { cargoDans: Math.max(0, CARGO_MS - (instant - e.allumeLe)) } : {}),
    };
  }

  private annoncer(instant: number, plus: { cargo?: true; corne?: true; avertissement?: string } = {}): void {
    this.diffuser({ t: "phare", etat: this.vue(instant), ...plus });
  }

  override entrer(v: Voyageur): void {
    // Un escabeau resté « dans les bras » sans personne (le serveur arrêté pendant qu'on le portait) : il est au hangar.
    if (this.ici.size === 0 && this.etat.escabeau === "bras") this.changer({ escabeau: "hangar" });
    super.entrer(v);
    this.ici.add(v);
    this.aPrevenir.add(v.humain().id);
  }

  override sortir(v: Voyageur): void {
    // Parti l'escabeau dans les bras : il reste là où on l'a lâché.
    if (this.ici.has(v) && this.etat.escabeau === "bras") {
      const h = v.humain();
      this.changer({ escabeau: { x: Math.round(h.x * 100) / 100, z: Math.round(h.z * 100) / 100 } });
    }
    this.ici.delete(v);
    super.sortir(v);
  }

  override dansLesBras(_compteId: number): string | null {
    return this.etat.escabeau === "bras" ? "l'escabeau" : null;
  }

  /** Poser l'escabeau là où l'on est (le geste « poser » commun aux lieux : S-08). */
  override poser(ctx: ContexteLieu): boolean {
    if (this.etat.escabeau !== "bras") return false;
    this.poserEscabeau(ctx);
    return true;
  }

  override accompagner(ctx: ContexteLieu, _dt: number): void {
    if (!this.aPrevenir.delete(ctx.id)) return;
    ctx.envoyer({ t: "phare", etat: this.vue(ctx.maintenant()) });
  }

  // ---------- Le butin : les objets-clés de l'épave, le compresseur ----------

  /** Les objets-clés de l'épave (et ses fouilles) ne se prennent que l'épave échouée (et à leur délai, S-03). */
  override disponiblePour(r: RessourceEnBase, compteId: number, instant: number): boolean {
    if (DE_L_EPAVE.has(r.type) && this.portes.epave !== true) return false;
    return super.disponiblePour(r, compteId, instant);
  }

  override prendrePar(r: RessourceEnBase, compteId: number, instant: number): void {
    super.prendrePar(r, compteId, instant);
    // Le compresseur de la corne réparé (S-16 : Serrer 1, 10 s, sans pièce) : il le reste jusqu'au retour du phare.
    if (r.type === "phare_compresseur") {
      this.changer({ compresseur: true });
      this.annoncer(instant);
    }
  }

  /**
   * Tout revient au bout de 24 h (S-04, S-18 : l'épave est partie, l'escabeau au hangar…), sauf les objets-clés qui ont un
   * délai plus long que le retour du phare (S-03 : 4 jours) : ils reviennent à leur heure.
   */
  override reinitialiser(): void {
    const longs = [...this.ressources.values()].filter((r) => DELAI_LONG.has(r.type as TypeRessourcePhare) && r.disponibleLe !== 0 && r.disponibleLe !== JAMAIS).map((r) => [r, r.disponibleLe] as const);
    super.reinitialiser();
    for (const [r, le] of longs) {
      r.disponibleLe = le;
      this.baseDuPhare.sauverRessourceLieu(this.definition.cle, r.id, le);
    }
  }

  // ---------- La vie du phare : la lanterne, le cargo ----------

  override tick(instant: number, dt: number): void {
    const e = this.etat;
    // La lanterne allumée, la nuit : une lumière qui réveille les dormeurs du chemin des douaniers (S-15).
    if (e.allumeLe !== null && estNuit(heureDeJeu(instant, this.debutDuMonde))) {
      const l = ENDROITS_PHARE.lumiere;
      this.ajouterBruit("lanterne", { genre: "lumiere", x: l.x, z: l.z, ...LUMIERE_LANTERNE }, instant + 1500);
    }
    this.echouerSiLHeureEstVenue(instant, true);
    super.tick(instant, dt);
  }

  /**
   * K4 : pendant la scène de l'échouage (de CARGO_MS à CARGO_MS + 6,6 s après l'allumage), les Éteints du phare ne bougent
   * ni ne frappent, pour personne ; ils reprennent après le fondu.
   */
  protected override figeLesEteints(instant: number): boolean {
    return enSceneCargo(this.etat.allumeLe, instant);
  }

  /** 50 s réelles après l'allumage, le cargo s'échoue (S-17) ; une fois par retour du phare (S-18). */
  private echouerSiLHeureEstVenue(instant: number, devantLeJoueur: boolean): void {
    const e = this.etat;
    if (e.allumeLe === null || this.portes.epave === true || instant - e.allumeLe < CARGO_MS) return;
    // Le client joue la scène (K4 : la maquette validée, 6,6 s), puis montre l'épave ; celui qui arrive après la trouve.
    // Pas de texte du serveur ici : la pensée du guidage (P-26) le dit (commun/src/guidage.ts).
    if (devantLeJoueur) this.annoncer(instant, { cargo: true });
    this.basculerPorte("epave", true);
    // Un Éteint dans l'eau, là où l'épave se pose, est remis sur les galets (pas sur le pont, d'où il ne savait pas
    // redescendre : essai sur l'iPhone, 2026-10-15).
    remettreSurLaGreve(this.eteints);
    for (const r of this.ressources.values()) if (DE_L_EPAVE.has(r.type) && r.disponibleLe <= instant) this.diffuser({ t: "ressource", id: r.id, disponible: true });
  }

  // ---------- Les gestes du phare ----------

  override geste(ctx: ContexteLieu, cible: Cible, verbe: string): boolean {
    // Les bras pris (l'escabeau), on ne prend ni ne fouille rien.
    if (cible.genre === "ressource" && this.etat.escabeau === "bras") {
      ctx.info(BRAS_PRIS);
      return true;
    }
    if (cible.genre !== "phare") return false;
    const instant = ctx.maintenant();
    const e = this.etat;
    const p = ctx.position();
    const pres = (o: { x: number; z: number }, portee = PORTEE_PHARE) => Math.hypot(p.x - o.x, p.z - o.z) <= portee;
    if (e.escabeau === "bras" && !(cible.id === "escabeau" || cible.id === "rampe")) {
      ctx.info(BRAS_PRIS);
      return true;
    }
    switch (cible.id) {
      case "escabeau":
        if (verbe === "poser") return this.poserEscabeau(ctx), true;
        if (verbe !== "porter" || e.escabeau === "bras") return true;
        if (!pres(placeEscabeau(e))) return ctx.info("Approche-toi de l'escabeau."), true;
        ctx.annuler();
        this.changer({ escabeau: "bras" });
        ctx.info(TEXTES_PHARE.escabeauPris);
        this.annoncer(instant);
        return true;
      case "cuve":
        if (verbe !== "remplir" || e.bidon !== "cuve") return true;
        if (!pres(ENDROITS_PHARE.cuve)) return ctx.info("Approche-toi de la cuve."), true;
        ctx.commencer("Remplir le bidon à la cuve", DUREES_PHARE.cuve, () => {
          if (this.etat.bidon !== "cuve") return;
          this.changer({ bidon: "plein" });
          ctx.info(TEXTES_PHARE.bidon);
          this.annoncer(ctx.maintenant());
        });
        return true;
      case "prisme":
        if (verbe !== "ramasser" || e.prisme !== "tombe") return true;
        if (!pres(ENDROITS_PHARE.prisme)) return ctx.info("Approche-toi du prisme."), true;
        ctx.commencer("Ramasser le prisme", DUREES_PHARE.prisme, () => {
          if (this.etat.prisme !== "tombe") return;
          this.changer({ prisme: "main" });
          ctx.info(TEXTES_PHARE.prisme);
          this.annoncer(ctx.maintenant());
        });
        return true;
      case "escalier":
        return this.monter(ctx, verbe), true;
      case "corne":
        if (verbe !== "sonner_corne") return true;
        if (!pres(ENDROITS_PHARE.compresseur)) return ctx.info("Approche-toi du compresseur."), true;
        if (!e.compresseur) return ctx.info("Le compresseur ne tourne pas : sa courroie a sauté."), true;
        if (e.corneNuit === nuitDe(instant, this.debutDuMonde)) return ctx.info(TEXTES_PHARE.corneSonnee), true;
        this.sonnerLaCorne(instant);
        ctx.info(TEXTES_PHARE.corne);
        return true;
      case "rampe":
        if (verbe !== "sauter") return true;
        if (!pres(ENDROITS_PHARE.sautDe, PORTEE_SAUT)) return ctx.info("Approche-toi du bord du tronçon effondré."), true;
        // On ne saute pas l'escabeau dans les bras : il reste en haut.
        if (e.escabeau === "bras") this.changer({ escabeau: { x: p.x, z: p.z } });
        ctx.annuler();
        ctx.deplacer({ x: ENDROITS_PHARE.sautVers.x, z: ENDROITS_PHARE.sautVers.z, o: 0 });
        ctx.info(TEXTES_PHARE.sauter);
        this.annoncer(instant);
        return true;
    }
    return true;
  }

  /** L'escabeau posé devant soi ; à la marque à la craie, il est calé sous l'escalier coupé (S-12). */
  private poserEscabeau(ctx: ContexteLieu): void {
    if (this.etat.escabeau !== "bras") return;
    const p = ctx.position();
    const m = ENDROITS_PHARE.marque;
    if (Math.hypot(p.x - m.x, p.z - m.z) <= RAYON_MARQUE + 0.9) {
      this.changer({ escabeau: "marque" });
      ctx.info(TEXTES_PHARE.escabeauPose);
    } else {
      const x = Math.round((p.x + Math.sin(p.o) * 0.9) * 100) / 100;
      const z = Math.round((p.z + Math.cos(p.o) * 0.9) * 100) / 100;
      this.changer({ escabeau: { x, z } });
      ctx.info(TEXTES_PHARE.escabeauLache);
    }
    this.annoncer(ctx.maintenant());
  }

  /**
   * Monter à la lanterne, par l'escabeau posé sous l'escalier coupé (S-12, S-13) : verser le pétrole, remettre le prisme,
   * allumer (la nuit seulement, S-14). Chaque montée est un geste (les 31 m de marches) ; rien ne se perd si on s'arrête.
   */
  private monter(ctx: ContexteLieu, verbe: string): void {
    const e = this.etat;
    const p = ctx.position();
    const m = ENDROITS_PHARE.marque;
    if (Math.hypot(p.x - m.x, p.z - m.z) > PORTEE_PHARE) return ctx.info("Approche-toi du pied de l'escalier.");
    if (e.escabeau !== "marque") return ctx.info("L'escalier s'arrête à trois mètres du sol : il faut de quoi grimper jusqu'à la première marche.");
    if (verbe === "remplir") {
      if (e.bidon !== "plein") return ctx.info(e.bidon === "verse" ? "La lanterne a son pétrole." : "Il faut d'abord remplir le bidon à la cuve.");
      ctx.commencer("Monter verser le pétrole", DUREES_PHARE.verser, () => {
        if (this.etat.bidon !== "plein" || this.etat.escabeau !== "marque") return;
        this.changer({ bidon: "verse" });
        ctx.info(TEXTES_PHARE.verse);
        this.annoncer(ctx.maintenant());
      });
      return;
    }
    if (verbe === "remettre") {
      if (e.prisme !== "main") return ctx.info(e.prisme === "remis" ? "Le prisme est à sa place." : "Le prisme manquant est tombé au pied de la tour.");
      ctx.commencer("Monter remettre le prisme", DUREES_PHARE.remettre, () => {
        if (this.etat.prisme !== "main" || this.etat.escabeau !== "marque") return;
        this.changer({ prisme: "remis" });
        ctx.info(TEXTES_PHARE.remis);
        this.annoncer(ctx.maintenant());
      });
      return;
    }
    if (verbe !== "allumer") return;
    if (e.allumeLe !== null) return ctx.info(TEXTES_PHARE.dejaAllume);
    if (e.bidon !== "verse" || e.prisme !== "remis") return ctx.info(e.bidon !== "verse" && e.prisme !== "remis" ? TEXTES_PHARE.manque : e.bidon !== "verse" ? TEXTES_PHARE.manquePetrole : TEXTES_PHARE.manquePrisme);
    // De jour, on prépare ; le feu ne s'allume qu'à la nuit tombée (S-14, Q-0.10-9) : un message qui passe (le porteur,
    // 2026-10-15 : pas de fenêtre en jeu, même fermée par un bouton).
    if (!estNuit(heureDeJeu(ctx.maintenant(), this.debutDuMonde))) return ctx.info(TEXTES_PHARE.jour);
    ctx.commencer("Monter allumer la lanterne", DUREES_PHARE.allumer, () => {
      const instant = ctx.maintenant();
      const f = this.etat;
      if (f.allumeLe !== null || f.bidon !== "verse" || f.prisme !== "remis" || f.escabeau !== "marque") return;
      if (!estNuit(heureDeJeu(instant, this.debutDuMonde))) return ctx.info(TEXTES_PHARE.jour);
      this.changer({ allumeLe: instant });
      ctx.info(TEXTES_PHARE.allume);
      this.annoncer(instant);
      this.faireVenirDeLaLande(instant, ctx.position());
    });
  }

  /**
   * À l'allumage, 2 ou 3 Éteints arrivent de la lande (décision du porteur, 2026-10-15 : on a déjà tué ceux du lieu) : en
   * plus de ceux du lieu, pas gardés en base, une fois par nuit, seulement si quelqu'un est là (commun/src/phare-vivant.ts).
   */
  private faireVenirDeLaLande(instant: number, joueur: { x: number; z: number }): void {
    const nuit = nuitDe(instant, this.debutDuMonde);
    if (this.landeNuit === nuit || this.ici.size === 0) return;
    this.landeNuit = nuit;
    this.eteints.push(...arrivantsDeLaLande(joueur, (a, b) => this.voitEntre(a, b), this.aleaDuPhare));
  }

  /** La corne de brume (S-16) : un leurre de 60 s au bord de la falaise, une fois par nuit, comme ceux du Moulin. */
  private sonnerLaCorne(instant: number): void {
    const o = ENDROITS_PHARE.pavillons;
    this.changer({ corneNuit: nuitDe(instant, this.debutDuMonde) });
    this.ajouterBruit("corne", { genre: "son", x: o.x, z: o.z, portee: CORNE.portee, intensite: CORNE.intensite }, instant + CORNE.dureeS * 1000);
    this.annoncer(instant, { corne: true });
  }
}

/** Où est l'escabeau, pour le prendre (au hangar, à la marque, ou là où on l'a posé). */
function placeEscabeau(e: EtatPhare): { x: number; z: number } {
  if (e.escabeau === "hangar" || e.escabeau === "bras") return ENDROITS_PHARE.hangar;
  if (e.escabeau === "marque") return ENDROITS_PHARE.marque;
  return e.escabeau;
}

/**
 * Les phares des joueurs (le gardien du registre : serveur/src/lieux-vivants.ts, FABRIQUES) : des lieux à soi comme les
 * autres (LieuxPersonnels), dont chacun reçoit ce qu'il garde de plus (`propre`).
 */
export class Phares extends LieuxPersonnels {
  private readonly horloge: () => number;

  constructor(base: Base, alea: () => number = Math.random, maintenant: () => number = Date.now) {
    super(base, "phare", alea, maintenant, (b, d, a) => new LieuPhare(b, d, a));
    this.horloge = maintenant;
  }

  override de(compteId: number): LieuPhare {
    const lieu = super.de(compteId) as LieuPhare;
    lieu.lier(() => this.etat(compteId)?.propre ?? {}, this.horloge());
    return lieu;
  }
}

/** Le phare tel qu'on le trouve (pour les tests). */
export const ETAT_PHARE_NEUF: EtatPhare = etatPhareNeuf();
