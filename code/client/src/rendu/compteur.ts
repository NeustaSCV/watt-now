// Les Compteurs du Carrefour (Book 21 §5.2.2, Book 15) : costume sombre de la Compagnie, visière verte de
// comptable, brassard bleu. Les gardes se tiennent devant le guichet, l'un bras croisés, l'autre son bâton à la main.

import * as THREE from "three";
import { Mesure, bandeau } from "./accessoires.ts";
import { Humanoide, chargerHumanoides, humanoidesPrets } from "./humanoides.ts";
import { PALETTE, materiau } from "./materiaux.ts";

const COSTUME = 0x434c5e;

export class Compteur {
  readonly objet = new THREE.Group();
  private corps: Humanoide | null = null;
  private readonly baton: boolean;
  private readonly genre: "femme" | "homme";

  constructor(x: number, z: number, o: number, baton: boolean, genre: "femme" | "homme") {
    this.objet.position.set(x, 0, z);
    this.objet.rotation.y = o;
    this.baton = baton;
    this.genre = genre;
    if (humanoidesPrets()) this.construire();
    else void chargerHumanoides().then(() => this.construire());
  }

  private construire(): void {
    const c = new Humanoide({
      genre: this.genre,
      peau: this.genre === "homme" ? PALETTE.peau[0] : PALETTE.peau[1],
      tenue: { haut: COSTUME, manche: COSTUME, bas: 0x262a33, pieds: 0x151515, mains: null },
      coiffure: this.genre === "homme" ? "simpleparted" : "buns",
      couleurCheveux: 0x3a3330,
      tete: 1.28,
      hauteur: 1.78,
      graine: 31,
    });
    this.corps = c;
    const m = new Mesure(c.points());
    const teteY = c.repere("Head").y;
    const sommet = m.sommet();
    // La visière de comptable : verte, translucide, sur le front.
    const vert = new THREE.MeshStandardMaterial({ color: 0x2f8a5a, transparent: true, opacity: 0.8, roughness: 0.4 });
    const yVisiere = teteY + (sommet - teteY) * 0.74;
    const bande = bandeau(m, yVisiere, 0.03, 0.01, materiau(0x1f5a3a));
    const t = m.tranche(yVisiere);
    const visiere = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.25, 0.05, 20, 1, true, -1.1, 2.2), vert);
    visiere.material.side = THREE.DoubleSide;
    visiere.scale.set(t.rx + 0.02, 1, t.rz + 0.02);
    visiere.position.set(t.cx, yVisiere - 0.01, t.cz + 0.02);
    c.accrocher(bande, "Head");
    c.accrocher(visiere, "Head");
    // Le brassard bleu de la Compagnie, sur le bras gauche.
    const epaule = c.repere("upperarm_l");
    const coude = c.repere("lowerarm_l");
    const brassard = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.09, 14, 1, true), materiau(PALETTE.bleuTravail));
    brassard.material.side = THREE.DoubleSide;
    brassard.position.copy(epaule.clone().lerp(coude, 0.45));
    brassard.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), coude.clone().sub(epaule).normalize());
    c.accrocher(brassard, "upperarm_l");
    // Le col blanc de la chemise.
    const cou = c.repere("neck_01");
    const col = bandeau(m, cou.y - 0.01, 0.045, 0.01, materiau(0xf2efe6), 0, 0.09);
    c.accrocher(col, "neck_01");
    if (this.baton) {
      const main = c.repere("hand_r");
      const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), materiau(0x5a4130));
      baton.rotation.x = Math.PI / 2;
      baton.position.set(main.x, main.y, main.z + 0.1);
      c.accrocher(baton, "hand_r");
    }
    for (const o of [bande, visiere, brassard, col]) o.castShadow = true;
    this.objet.add(c.objet);
    c.jouer(this.baton ? "Idle_Loop" : "Idle_FoldArms_Loop");
    c.mixer.timeScale = 0.9 + Math.random() * 0.2;
  }

  animer(dt: number): void {
    this.corps?.mettreAJour(dt);
  }
}
