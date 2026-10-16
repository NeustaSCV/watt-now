// Les autres joueurs croisés à la halte et au comptoir (É4, lot 3) : leur personnage de famille (la silhouette se
// reconnaît de loin, Book 18 §4), leur nom au-dessus de la tête, et leur lampe la nuit. En 0.9 (plan §3.1) : montrés
// 150 ms en arrière, sans à-coups, à leur allure, avec leurs gestes et l'arme du coup en main. En 0.11 (duel) : leur
// halo au sol (rendu/halo.ts), et leur nom passe dans la couche HTML au-dessus du monde (client/src/etiquettes.ts), où
// se mettent aussi les jauges du duel.

import * as THREE from "three";
import type { AllureVue, AutreVu, GesteVu } from "../../../commun/src/messages.ts";
import { typeDe } from "../../../commun/src/etoiles.ts";
import type { TypeObjet } from "../../../commun/src/objets.ts";
import { Personnage, gesteDAction } from "./personnage.ts";
import { FileGestes, HorlogeServeur, Interpolateur, RETARD_AFFICHAGE } from "./interpolation.ts";
import { Halo } from "./halo.ts";

/** L'heure du serveur, recalée sur les `positions` reçues : la même pour tous les autres joueurs. */
export const horlogeAutres = new HorlogeServeur();

/** Après une frappe, l'arme reste en main ce temps (ms, Q-7), puis retourne au dos ou disparaît. */
const ARME_APRES_COUP = 3000;

export class VueAutre {
  readonly personnage: Personnage;
  private cible: AutreVu;
  private readonly trajet: Interpolateur;
  private readonly gestes = new FileGestes<GesteVu>();
  /** L'arme du dernier coup, en main jusqu'à `armeJusqua` (heure du serveur, ms). */
  private armeJusqua = 0;
  private armeEnMain: TypeObjet | null | undefined = undefined;
  private chute = false;

  constructor(a: AutreVu) {
    this.cible = a;
    this.trajet = new Interpolateur(a.x, a.z, a.o);
    this.personnage = new Personnage(a.famille, a.apparence);
    this.personnage.objet.position.set(a.x, 0, a.z);
    this.personnage.objet.rotation.y = a.o;
    this.equiper();
    this.etat();
  }

  get objet(): THREE.Group {
    return this.personnage.objet;
  }

  get donnees(): AutreVu {
    return this.cible;
  }

  maj(a: AutreVu): void {
    // L'identité arrive sans changer la dernière position connue (elle vient du message « positions »).
    this.cible = { ...a, x: this.cible.x, z: this.cible.z, o: this.cible.o };
    this.equiper();
    this.etat();
  }

  /** Ce que dit son identité : endormi (même couché avant notre arrivée), la lampe levée. */
  private etat(): void {
    this.personnage.coucher(this.cible.couche === true);
    this.personnage.porterLumiere(this.cible.lumiere);
  }

  /** Son halo (0.11, duel) : créé dans la première halte où il paraît. */
  private halo: Halo | null = null;

  /**
   * Le halo, chaque image (0.11, D-19, D-24) : rouge s'il est en Combat, blanc pendant sa protection ; `montrer` : dans une
   * halte, et debout. `ySol` : le vrai sol sous lui.
   */
  majHalo(dt: number, montrer: boolean, maintenantServeur: number, ySol: number): void {
    const oui = montrer && !this.chute;
    if (!oui) {
      if (this.halo) this.halo.objet.visible = false;
      return;
    }
    if (!this.halo) {
      this.halo = new Halo();
      this.objet.add(this.halo.objet);
    }
    this.halo.objet.visible = true;
    this.halo.maj(dt, this.cible.rouge === true, this.cible.protegeJusqua, maintenantServeur, ySol, this.objet);
  }

  /** Il s'effondre : sa vue est gardée le temps de la chute après son départ du lieu (`Partants`). */
  get tombe(): boolean {
    return this.chute;
  }

  /** Sa nouvelle position (message « positions », toutes les 100 ms), à l'heure du serveur `h`. */
  deplacer(h: number, x: number, z: number, o: number, allure: AllureVue): void {
    this.cible = { ...this.cible, x, z, o };
    this.trajet.recevoir(h, x, z, o, allure);
  }

  /** Un de ses gestes (message « gestes ») : joué à son heure, avec le même retard que sa position. */
  geste(g: GesteVu): void {
    if (g.geste === "effondre") this.chute = true;
    this.gestes.mettre(g);
  }

  /** Montre l'instant d'il y a 150 ms : sa position, son allure, ses gestes. */
  animer(dt: number, maintenant = performance.now()): void {
    const instant = horlogeAutres.heure(maintenant);
    if (instant === null) {
      this.personnage.animer(dt, 0, 0);
      return;
    }
    const e = this.trajet.echantillon(instant);
    this.objet.position.x = e.x;
    this.objet.position.z = e.z;
    this.objet.rotation.y = e.o;
    for (const g of this.gestes.sortir(instant)) this.jouer(g);
    if (this.armeEnMain !== undefined && instant - RETARD_AFFICHAGE >= this.armeJusqua) {
      this.armeEnMain = undefined;
      this.equiper();
    }
    this.personnage.animer(dt, e.vitesse, e.allure);
  }

  /** L'arme en main pendant un coup et 3 s après ; l'arme encombrante équipée dans le dos le reste du temps. */
  private equiper(): void {
    const dos = this.cible.dos ? typeDe(this.cible.dos) : null;
    this.personnage.tenir(this.armeEnMain);
    this.personnage.porterDansLeDos(dos !== null && dos !== this.armeEnMain ? dos : null);
  }

  /** Rejoue un geste avec les animations du personnage local (plan-0.9 §3.1). */
  private jouer(g: GesteVu): void {
    const p = this.personnage;
    switch (g.geste) {
      case "frappe":
        this.armeEnMain = g.objet ? typeDe(g.objet) : null;
        this.armeJusqua = g.h + (g.duree ?? 0.5) * 1000 + ARME_APRES_COUP;
        this.equiper();
        p.frapper(g.appuye ?? false, g.duree);
        return;
      case "poussee":
        p.frapper(false, 0.45);
        return;
      case "esquive":
        p.esquiver();
        return;
      case "degagement":
      case "touche":
        p.toucher();
        return;
      // Un coup reçu d'un joueur, pendant un duel (0.11) : le buste plie et revient, sans recul.
      case "tressaille":
        p.tressaillir();
        return;
      case "action":
        p.agir(gesteDAction(g.action ?? ""));
        return;
      case "fin_action":
        p.agir(null);
        return;
      case "effondre":
        p.effondrer(true);
        return;
      case "releve":
        p.effondrer(false);
        p.coucher(false);
        return;
      case "couche":
        p.coucher(true);
        return;
    }
  }
}

/** Le temps de la chute (ms) : un joueur qui s'effondre quitte le lieu, on le voit encore tomber (0.9). */
const DUREE_CHUTE = 2500;

/** Ceux qui ont quitté le champ en tombant : leur vue est gardée le temps de la chute (retard compris), puis retirée. */
export class Partants {
  private liste: { vue: VueAutre; jusqua: number }[] = [];

  garder(vue: VueAutre, maintenant = performance.now()): void {
    this.liste.push({ vue, jusqua: maintenant + RETARD_AFFICHAGE + DUREE_CHUTE });
  }

  animer(dt: number, retirer: (vue: VueAutre) => void, maintenant = performance.now()): void {
    this.liste = this.liste.filter((p) => {
      if (maintenant < p.jusqua) {
        p.vue.animer(dt, maintenant);
        return true;
      }
      retirer(p.vue);
      return false;
    });
  }

  vider(retirer: (vue: VueAutre) => void): void {
    for (const p of this.liste) retirer(p.vue);
    this.liste = [];
  }
}
