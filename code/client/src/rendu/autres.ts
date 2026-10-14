// Les autres joueurs croisés à la halte et au comptoir (É4, lot 3) : leur personnage de famille (la silhouette se
// reconnaît de loin, Book 18 §4), leur nom au-dessus de la tête, et leur lampe la nuit. En 0.9 (plan §3.1) : montrés
// 150 ms en arrière, sans à-coups, à leur allure, avec leurs gestes et l'arme du coup en main.

import * as THREE from "three";
import type { AllureVue, AutreVu, GesteVu } from "../../../commun/src/messages.ts";
import type { Famille } from "../../../commun/src/regles.ts";
import { typeDe } from "../../../commun/src/etoiles.ts";
import type { TypeObjet } from "../../../commun/src/objets.ts";
import { Personnage, gesteDAction } from "./personnage.ts";
import { FileGestes, HorlogeServeur, Interpolateur, RETARD_AFFICHAGE } from "./interpolation.ts";

const COULEURS: Record<Famille, string> = { charbonniers: "#a4552f", voltaiques: "#2f5fa4", mecanistes: "#7f8f3a" };

function etiquette(pseudo: string, famille: Famille): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.font = "bold 26px 'Avenir Next', 'Helvetica Neue', sans-serif";
  const largeur = Math.min(240, g.measureText(pseudo).width + 44);
  const x0 = (256 - largeur) / 2;
  g.fillStyle = "rgba(20, 24, 32, 0.72)";
  // Une pastille arrondie (tracée à la main : roundRect manque sur les vieux Safari)
  g.beginPath();
  g.moveTo(x0 + 20, 12);
  g.lineTo(x0 + largeur - 20, 12);
  g.arc(x0 + largeur - 20, 32, 20, -Math.PI / 2, Math.PI / 2);
  g.lineTo(x0 + 20, 52);
  g.arc(x0 + 20, 32, 20, Math.PI / 2, -Math.PI / 2);
  g.fill();
  g.fillStyle = COULEURS[famille];
  g.beginPath();
  g.arc(x0 + 20, 32, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f2efe6";
  g.textBaseline = "middle";
  g.fillText(pseudo, x0 + 34, 33, largeur - 42);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(2, 0.5, 1);
  s.position.y = 2.25;
  s.renderOrder = 10;
  return s;
}

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

  constructor(a: AutreVu) {
    this.cible = a;
    this.trajet = new Interpolateur(a.x, a.z, a.o);
    this.personnage = new Personnage(a.famille, a.apparence);
    this.personnage.objet.add(etiquette(a.pseudo, a.famille));
    this.personnage.objet.position.set(a.x, 0, a.z);
    this.personnage.objet.rotation.y = a.o;
    this.equiper();
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
  }

  /** Sa nouvelle position (message « positions », toutes les 100 ms), à l'heure du serveur `h`. */
  deplacer(h: number, x: number, z: number, o: number, allure: AllureVue): void {
    this.cible = { ...this.cible, x, z, o };
    this.trajet.recevoir(h, x, z, o, allure);
  }

  /** Un de ses gestes (message « gestes ») : joué à son heure, avec le même retard que sa position. */
  geste(g: GesteVu): void {
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
