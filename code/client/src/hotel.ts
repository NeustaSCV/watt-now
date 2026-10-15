// Ce qu'on fait au Grand Hôtel des Flots (plan 0.10, chantier J) : « le check-in ». Prendre la batterie du panneau et la
// brancher à la borne ; dégager le robot-serveur ; porter sa tête à deux mains et la présenter à la borne ; appeler
// l'ascenseur ; poser ce qu'on porte. Le serveur décide de tout (serveur/src/hotel.ts) et répond par une ligne de
// message, jamais une fenêtre.
//
// Ici aussi : l'état du check-in tel que le serveur l'a dit (message `hotel`), et le fondu au noir d'une seconde de
// l'ascenseur et du saut du balcon (message `scene`, S-01).

import {
  ASCENSEUR,
  BORNE,
  CARTE,
  NOMS_PORTES,
  PORTEE_HOTEL,
  RAYON_GRILLE,
  ROBOT,
  TEXTES_HOTEL,
  borneAlimentee,
  dansLesBrasHotel,
  niveauHotel,
  ouEst,
  type EtatHotel,
  type ObjetPorte,
} from "../../commun/src/hotel.ts";
import type { MessageClient, MessageServeur, Verbe } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import type { ActionProposee, Propositions } from "./interaction.ts";

const geste = (libelle: string, id: string, verbe: Verbe): ActionProposee => ({ libelle, message: { t: "interagir", cible: { genre: "lieu", id }, verbe } as MessageClient });
const examiner = (texte: string): ActionProposee => ({ libelle: "Examiner", examiner: texte });

export class ClientHotel {
  /** Où en est le check-in (null : on ne l'a pas encore reçu). */
  etat: EtatHotel | null = null;
  /** Le voile noir du fondu (créé à la première scène). */
  private voile: HTMLElement | null = null;

  /** Un message du serveur pour l'hôtel : true s'il l'a pris (main.ts n'en fait rien d'autre). */
  recevoir(m: MessageServeur): boolean {
    // Une arrivée, ailleurs ou ici : l'état d'avant ne vaut plus (le serveur le redit dès qu'on est à l'hôtel).
    if (m.t === "bienvenue") this.etat = null;
    if (m.t === "hotel") {
      this.etat = m.hotel;
      return true;
    }
    if (m.t === "scene" && m.lieu === "grand_hotel") {
      this.fondu();
      return true;
    }
    return false;
  }

  /** Ce qu'on a dans les bras (null : rien). */
  porte(): ObjetPorte | null {
    return this.etat ? dansLesBrasHotel(this.etat) : null;
  }

  /** Le fondu au noir d'une seconde (S-01) : le personnage change de place au milieu, dans le noir. */
  private fondu(): void {
    if (!this.voile) {
      const v = document.createElement("div");
      v.className = "fondu-lieu";
      v.setAttribute("aria-hidden", "true");
      Object.assign(v.style, { position: "fixed", inset: "0", background: "#05070a", opacity: "0", pointerEvents: "none" });
      (document.getElementById("monde") ?? document.body).after(v);
      this.voile = v;
    }
    this.voile.animate([{ opacity: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 1000, easing: "ease-in-out" });
  }

  /**
   * Les propositions de l'hôtel, à portée de main : la batterie, le robot et sa tête, la borne, l'ascenseur. Les bras
   * pris, A pose ce qu'on porte (ou le branche, ou le présente, devant la borne), comme l'escabeau.
   */
  proposer(p: { x: number; z: number }, base: Propositions, inventaire: Inventaire): Propositions {
    const e = this.etat;
    if (!e) return base;
    const bras = dansLesBrasHotel(e);
    const pres = (o: { x: number; z: number } | null, d = PORTEE_HOTEL) => (o ? Math.hypot(o.x - p.x, o.z - p.z) <= d : false);
    if (bras) {
      // Devant la borne : brancher la batterie, présenter la tête ; ailleurs, la poser.
      if (pres(BORNE) && bras === "batterie")
        return { A: geste("Brancher la batterie à la borne", "borne", "brancher"), B: examiner(TEXTES_HOTEL.borneEteinte), cible: { x: BORNE.x, z: BORNE.z, rayon: 0.6 } };
      if (pres(BORNE) && bras === "tete")
        return { A: geste("Présenter la tête du robot à la borne", "borne", "presenter"), B: examiner(borneAlimentee(e) ? TEXTES_HOTEL.borneAllumee : TEXTES_HOTEL.borneEteinte), cible: { x: BORNE.x, z: BORNE.z, rayon: 0.6 } };
      return {
        A: { libelle: `Poser ${NOMS_PORTES[bras]}`, message: { t: "poser" } },
        B: examiner(bras === "tete" ? "Tu portes la tête du robot, à deux mains : huit kilos. On marche, on ne frappe pas." : "Tu portes la batterie du panneau, à deux bras. On marche, on ne court pas."),
        cible: null,
      };
    }
    const dBase = base.cible ? Math.max(0, Math.hypot(base.cible.x - p.x, base.cible.z - p.z) - (base.cible.rayon ?? 0.5)) : base.A ? 0 : Infinity;
    let meilleure: { d: number; prop: Propositions } | null = null;
    const garder = (o: { x: number; z: number } | null, prop: Omit<Propositions, "cible">, rayon = 0.5) => {
      if (!o) return;
      const d = Math.max(0, Math.hypot(o.x - p.x, o.z - p.z) - rayon);
      if (d <= PORTEE_HOTEL && d < dBase && (!meilleure || d < meilleure.d)) meilleure = { d, prop: { ...prop, cible: { x: o.x, z: o.z, rayon } } };
    };
    const etage = niveauHotel(p.x, p.z) === "etage";
    if (!etage) {
      // La batterie : au pied du panneau, ou posée par terre ; branchée, elle reste à la borne.
      if (e.batterie !== "borne") garder(ouEst(e, "batterie"), { A: geste("Prendre la batterie", "batterie", "porter"), B: examiner(e.batterie === "panneau" ? TEXTES_HOTEL.batterie : TEXTES_HOTEL.batterieAuSol) }, 0.4);
      // Le robot ensablé : le dégager ; dégagé, dévisser sa tête.
      if (e.tete === "robot")
        garder(ROBOT, e.degage ? { A: geste("Dévisser la tête du robot", "tete", "porter"), B: examiner(TEXTES_HOTEL.robotDegage) } : { A: geste("Dégager le robot (Creuser)", "robot", "degager"), B: examiner(TEXTES_HOTEL.robotEnsable) }, 0.7);
      else if (e.tete !== "borne") garder(ouEst(e, "tete"), { A: geste("Prendre la tête du robot", "tete", "porter"), B: examiner(TEXTES_HOTEL.teteAuSol) }, 0.4);
      // La borne : sourire (le joueur seul n'est pas reconnu) ; la tête dessus, redemander la carte si on ne l'a plus.
      const aLaCarte = (inventaire[CARTE] ?? 0) > 0;
      garder(BORNE, { A: geste(e.tete === "borne" && !aLaCarte ? "Demander la carte de la chambre 7" : "Sourire à la borne", "borne", "presenter"), B: examiner(borneAlimentee(e) ? TEXTES_HOTEL.borneAllumee : TEXTES_HOTEL.borneEteinte) }, 0.6);
    }
    // L'ascenseur : en bas, il monte avec la carte ; en haut, il redescend.
    const ascenseur = etage ? ASCENSEUR.haut : ASCENSEUR.bas;
    garder(ascenseur.grille, { A: geste(etage ? "Redescendre par l'ascenseur" : "Appeler l'ascenseur", "ascenseur", "appeler_ascenseur"), B: examiner(etage ? TEXTES_HOTEL.ascenseurHaut : TEXTES_HOTEL.ascenseurBas) }, RAYON_GRILLE);
    return meilleure ? (meilleure as { prop: Propositions }).prop : base;
  }
}
