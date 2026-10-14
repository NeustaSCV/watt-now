// Ce qu'on fait au phare du cap (plan 0.10, chantier K), côté client : les gestes proposés (l'escabeau, la cuve, le
// prisme, l'escalier coupé et la lanterne, la corne de brume, le saut de la rampe), l'arrivée du cargo (S-17 : sa corne
// grave, le choc, un fondu de 2 s, puis l'épave), la corne de brume (S-16), le message de jour (S-14), et le relief (L-1) :
// les personnages, les Éteints et le cercle de visée posés sur la hauteur du sol du modèle, la caméra qui suit.
//
// Le serveur décide de tout (serveur/src/phare.ts) ; ce module ne fait que montrer et proposer. main.ts l'appelle à
// quelques endroits (une ligne chacun) : la réception du message `phare`, les propositions, la pose sur le relief, les
// lumières, l'escabeau dans les bras.

import * as THREE from "three";
import { DISTANCE_INTERACTION } from "../../commun/src/terrain.ts";
import { ENDROITS_PHARE, PORTEE_SAUT, RAYON_MARQUE, type EtatPhareVu } from "../../commun/src/phare.ts";
import type { MessageServeurPhare } from "../../commun/src/messages.ts";
import { BandeauAvertissement } from "./avertissement.ts";
import type { ActionProposee, Propositions } from "./interaction.ts";
import { lumieresPhare, solPhare, type ScenePhare } from "./rendu/phare.ts";
import type { SourceLumiere } from "./rendu/lumieres.ts";
import type { IdSon } from "./son/catalogue.ts";

/** L'arrivée du cargo (S-17), en secondes depuis son début : la corne grave, le choc, le fondu de 2 s (1 s au noir, 1 s pour revenir). */
const SCENE_CARGO = { choc: 3.8, noir: 4.2, epave: 5.2, fin: 6.2 } as const;

const EXAMEN_ESCALIER = "L'escalier en fonte tourne dans la tour… et s'arrête net à trois mètres du sol. Dessous, une marque à la craie.";
const EXAMEN_ESCABEAU = "L'escabeau du gardien, en bois, ses marches usées. Assez haut pour atteindre une première marche à trois mètres.";
const EXAMEN_CUVE = "La cuve à pompe de la réserve : du pétrole lampant, et un bidon pour le monter.";
const EXAMEN_PRISME = "Un prisme de verre épais, taillé en biseau, tombé de la lentille. Là-haut, il manque.";
const EXAMEN_CORNE = "La corne de brume, ses deux pavillons tournés vers le large. Son cri porte sur tout le cap.";
const EXAMEN_RAMPE = "Le tronçon effondré de la rampe du canot : un mètre et demi plus bas, la partie affaissée descend jusqu'aux galets. On saute ; on ne remonte pas.";

type Joueur = (id: IdSon, ou?: { x: number; z: number }) => void;

export class PhareClient {
  /** L'état du phare, tel que le serveur l'a dit (null : pas encore reçu). */
  etat: EtatPhareVu | null = null;
  /** L'arrivée du cargo en cours : son début (performance.now(), ms), ou null. */
  private cargo: number | null = null;
  private sonsJoues = new Set<string>();
  private voile: HTMLElement | null = null;
  private bandeau: BandeauAvertissement | null = null;
  /** La hauteur où le personnage est posé (lissée : on descend la rampe, on saute, sans à-coups). */
  private yPerso: number | null = null;

  private readonly jouer: Joueur;
  private readonly hud: () => HTMLElement;

  constructor(jouer: Joueur, hud: () => HTMLElement) {
    this.jouer = jouer;
    this.hud = hud;
  }

  /** Le message `phare` du serveur. */
  recevoir(m: MessageServeurPhare): void {
    this.etat = m.etat;
    if (m.cargo) {
      this.cargo = performance.now();
      this.sonsJoues.clear();
      this.jouer("corne_cargo");
    }
    if (m.corne) this.jouer("corne_brume", ENDROITS_PHARE.pavillons);
    // Un message fermé par un bouton (S-14), jamais une fenêtre à croix.
    if (m.avertissement) (this.bandeau ??= new BandeauAvertissement(this.hud())).montrer({ texte: m.avertissement, bouton: "Compris" });
  }

  /** L'escabeau du gardien est dans les bras (on marche, on ne court pas ; l'escabeau se voit dans les bras). */
  get dansLesBras(): boolean {
    return this.etat?.escabeau === "bras";
  }

  /** L'épave se voit : échouée (`portes.epave`), et le fondu du cargo passé. */
  private epaveVisible(portes: Readonly<Record<string, boolean>>): boolean {
    if (portes.epave !== true) return false;
    return this.cargo === null || performance.now() - this.cargo >= SCENE_CARGO.epave * 1000;
  }

  /** Ce que le décor doit montrer (rendu/phare.ts, animerPhare). */
  scene(portes: Readonly<Record<string, boolean>>): ScenePhare {
    return { etat: this.etat, epave: this.epaveVisible(portes) };
  }

  /** Les lumières du phare, la nuit (la lanterne allumée, le feu de détresse de l'épave). */
  lumieres(portes: Readonly<Record<string, boolean>>, nuit: boolean): SourceLumiere[] {
    return lumieresPhare(this.scene(portes), nuit);
  }

  /** À chaque image : la scène du cargo (le choc, le fondu au noir). */
  animer(): void {
    if (this.cargo === null) return;
    const t = (performance.now() - this.cargo) / 1000;
    if (t >= SCENE_CARGO.choc && !this.sonsJoues.has("choc")) {
      this.sonsJoues.add("choc");
      this.jouer("choc_cargo");
    }
    const noir = t < SCENE_CARGO.noir ? 0 : t < SCENE_CARGO.epave ? (t - SCENE_CARGO.noir) / (SCENE_CARGO.epave - SCENE_CARGO.noir) : t < SCENE_CARGO.fin ? 1 - (t - SCENE_CARGO.epave) / (SCENE_CARGO.fin - SCENE_CARGO.epave) : 0;
    this.fondu(noir);
    if (t >= SCENE_CARGO.fin) this.cargo = null;
  }

  /** Le fondu au noir de l'arrivée du cargo (un voile par-dessus le jeu, qui ne prend aucun geste). */
  private fondu(opacite: number): void {
    if (!this.voile) {
      if (opacite <= 0) return;
      const v = document.createElement("div");
      v.className = "voile-phare";
      v.style.cssText = "position:fixed;inset:0;background:#05070b;pointer-events:none;z-index:40;opacity:0";
      document.body.append(v);
      this.voile = v;
    }
    this.voile.style.opacity = String(Math.max(0, Math.min(1, opacite)));
    this.voile.hidden = opacite <= 0;
  }

  /**
   * Le relief (L-1) : le personnage, les Éteints et les cercles posés sur la hauteur du sol du modèle ; la caméra suit
   * (`hauteurSuivie`). Ailleurs qu'au phare, tout revient à plat.
   */
  poser(
    auPhare: boolean,
    portes: Readonly<Record<string, boolean>>,
    dt: number,
    cible: {
      personnage: THREE.Object3D | null;
      eteints: Iterable<{ objet: THREE.Object3D }>;
      cercles: readonly THREE.Object3D[];
      scene: { hauteurSuivie: number };
    },
  ): void {
    if (!auPhare) {
      this.yPerso = null;
      cible.scene.hauteurSuivie = 0;
      return;
    }
    const epave = portes.epave === true;
    const sol = (o: THREE.Object3D) => solPhare(o.position.x, o.position.z, epave);
    if (cible.personnage) {
      const y = sol(cible.personnage);
      // On descend la rampe, on saute le tronçon effondré, on pose le pied sur les galets : la hauteur suit, en douceur.
      this.yPerso = this.yPerso === null || Math.abs(y - this.yPerso) > 4 ? y : this.yPerso + (y - this.yPerso) * Math.min(1, dt * 12);
      cible.personnage.position.y = this.yPerso;
      cible.scene.hauteurSuivie = this.yPerso;
    }
    for (const e of cible.eteints) e.objet.position.y = sol(e.objet);
    for (const c of cible.cercles) c.position.y = sol(c) + 0.03;
  }

  /**
   * Les gestes du phare, à portée de main : ils l'emportent sur ce qui est proposé ailleurs s'ils sont plus près. Les
   * bras chargés (l'escabeau), A le pose, rien d'autre.
   */
  proposer(position: { x: number; z: number }, propositions: Propositions): Propositions {
    const e = this.etat;
    if (!e) return propositions;
    const m = ENDROITS_PHARE.marque;
    const dMarque = Math.hypot(position.x - m.x, position.z - m.z);
    if (e.escabeau === "bras") {
      return {
        A: { libelle: dMarque <= RAYON_MARQUE + 0.9 ? "Poser l'escabeau sous l'escalier" : "Poser l'escabeau", message: { t: "interagir", cible: { genre: "phare", id: "escabeau" }, verbe: "poser" } },
        B: { libelle: "Examiner", examiner: "Tu portes l'escabeau du gardien : on marche, on ne court pas. Sous l'escalier coupé de la tour, une marque à la craie." },
        cible: null,
      };
    }
    let meilleure: { d: number; p: Propositions } | null = null;
    const garder = (o: { x: number; z: number }, A: ActionProposee | null, examen: string, ecart = 0, portee = DISTANCE_INTERACTION) => {
      const d = Math.max(0, Math.hypot(position.x - o.x, position.z - o.z) - ecart);
      if (d > portee || (meilleure && d >= meilleure.d)) return;
      meilleure = { d, p: { A, B: { libelle: "Examiner", examiner: examen }, cible: { x: o.x, z: o.z } } };
    };
    const geste = (id: "escabeau" | "escalier" | "cuve" | "prisme" | "corne" | "rampe", verbe: "porter" | "poser" | "remplir" | "ramasser" | "remettre" | "allumer" | "sonner_corne" | "sauter", libelle: string): ActionProposee => ({
      libelle,
      message: { t: "interagir", cible: { genre: "phare", id }, verbe },
    });
    const prendreEscabeau = geste("escabeau", "porter", "Prendre l'escabeau (dans les bras)");

    // L'escalier coupé : l'escabeau posé dessous, on monte verser le pétrole, remettre le prisme, puis allumer.
    if (e.escabeau === "marque") {
      const A =
        e.bidon === "plein"
          ? geste("escalier", "remplir", "Monter verser le pétrole")
          : e.prisme === "main"
            ? geste("escalier", "remettre", "Monter remettre le prisme")
            : e.bidon === "verse" && e.prisme === "remis" && !e.lanterne
              ? geste("escalier", "allumer", "Monter allumer la lanterne")
              : prendreEscabeau;
      const haut = e.lanterne
        ? "Là-haut, la lanterne brûle : son faisceau balaie le cap."
        : `Là-haut, la lanterne : ${e.bidon === "verse" ? "le pétrole versé" : "sèche"}, ${e.prisme === "remis" ? "le prisme à sa place" : "un prisme manque à la lentille"}.`;
      garder(m, A, `L'escabeau est calé sous l'escalier coupé : on monte. ${haut}`, 0.2);
    } else {
      garder(m, null, EXAMEN_ESCALIER, 0.6);
      const ou = e.escabeau === "hangar" ? ENDROITS_PHARE.hangar : e.escabeau;
      garder(ou, prendreEscabeau, EXAMEN_ESCABEAU, 0.3);
    }
    if (e.bidon === "cuve") garder(ENDROITS_PHARE.cuve, geste("cuve", "remplir", "Remplir le bidon à la cuve"), EXAMEN_CUVE, 0.2);
    if (e.prisme === "tombe") garder(ENDROITS_PHARE.prisme, geste("prisme", "ramasser", "Ramasser le prisme"), EXAMEN_PRISME, 0.2);
    // La corne : réparée (le compresseur se répare comme une ressource, Serrer 1), on la sonne une fois par nuit.
    if (e.compresseur)
      garder(
        ENDROITS_PHARE.compresseur,
        e.corneSonnee ? null : geste("corne", "sonner_corne", "Sonner la corne de brume (attire les Éteints)"),
        e.corneSonnee ? "Le réservoir d'air est vide : la corne a déjà sonné cette nuit." : EXAMEN_CORNE,
        0.4,
      );
    garder(ENDROITS_PHARE.sautDe, geste("rampe", "sauter", "Sauter (on ne remonte pas)"), EXAMEN_RAMPE, 0, PORTEE_SAUT);

    const choix = meilleure as { d: number; p: Propositions } | null;
    if (!choix) return propositions;
    const c = propositions.cible;
    const dAvant = c ? Math.max(0, Math.hypot(c.x - position.x, c.z - position.z) - (c.rayon ?? 0.5)) : Infinity;
    // Un geste du phare passe devant ce qui est plus loin, ou devant rien ; un simple examen ne prend pas la place d'un geste.
    if (!propositions.A || (choix.p.A && choix.d < dAvant)) return choix.p;
    return propositions;
  }
}
