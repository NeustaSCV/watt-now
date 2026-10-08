// Les ressources du terrain (bois mort, bûches, pierres, buissons de baies) et la mare.

import * as THREE from "three";
import { MARE, RESTE_EN_PLACE, rayonMare, type RessourceSol } from "../../../commun/src/terrain.ts";
import { PERIODES_FRUITIERS, phaseFruitier, visibleEnSaison } from "../../../commun/src/calendrier.ts";
import { PALETTE, aleatoire, materiau } from "./materiaux.ts";

const geoBranche = new THREE.CylinderGeometry(0.03, 0.045, 1.1, 5).rotateZ(Math.PI / 2).translate(0, 0.05, 0);
const geoRameau = new THREE.CylinderGeometry(0.015, 0.025, 0.4, 4).rotateZ(Math.PI / 2.6).translate(0.2, 0.12, 0.05);
const geoBuche = new THREE.CylinderGeometry(0.11, 0.12, 0.62, 7).rotateZ(Math.PI / 2).translate(0, 0.12, 0);
const geoCoupe = new THREE.CircleGeometry(0.105, 7).rotateY(Math.PI / 2).translate(0.311, 0.12, 0);
const geoPierre = new THREE.DodecahedronGeometry(0.2, 0);
const geoBuisson = new THREE.IcosahedronGeometry(0.55, 0);
const geoBaie = new THREE.SphereGeometry(0.045, 5, 4);

/** L'allure de chaque fruitier : tronc, houppier, et ses fruits (couleur, taille, nombre). */
const FRUITIERS = {
  pommier: { tronc: 1.3, rayon: 1.15, etirement: 0.85, feuillage: 0x6f9a4a, ecorce: 0x6b5440, couleur: 0xc8362b, fruit: 0.075, allonge: 1, nombre: 26 },
  poirier: { tronc: 1.6, rayon: 1, etirement: 1.45, feuillage: 0x5f8a44, ecorce: 0x5a4a3a, couleur: 0xc9b84a, fruit: 0.065, allonge: 1.35, nombre: 22 },
  prunier: { tronc: 1.3, rayon: 1.05, etirement: 1, feuillage: 0x58803f, ecorce: 0x4e3a30, couleur: 0x4b2c5e, fruit: 0.05, allonge: 1.2, nombre: 34 },
  cerisier: { tronc: 1.7, rayon: 1.15, etirement: 1.1, feuillage: 0x4f7a3a, ecorce: 0x6a3e34, couleur: 0x8e1c2e, fruit: 0.035, allonge: 1, nombre: 30 },
  noyer: { tronc: 1.9, rayon: 1.55, etirement: 0.9, feuillage: 0x557a3c, ecorce: 0x8a8070, couleur: 0x7a9a3a, fruit: 0.06, allonge: 1.05, nombre: 24 },
} as const;

/** Un cèpe : pied ventru et clair, chapeau brun bombé, l'éponge jaune pâle dessous. */
function cepe(): THREE.Group {
  const g = new THREE.Group();
  const profil = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.04, 0.005),
    new THREE.Vector2(0.052, 0.035),
    new THREE.Vector2(0.045, 0.07),
    new THREE.Vector2(0.032, 0.1),
    new THREE.Vector2(0, 0.1),
  ];
  const pied = new THREE.Mesh(new THREE.LatheGeometry(profil, 8), materiau(0xe8dcbc));
  const chapeau = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), materiau(0x7a4a26, { rugosite: 0.6 }));
  chapeau.scale.y = 0.65;
  chapeau.position.y = 0.095;
  const eponge = new THREE.Mesh(new THREE.CircleGeometry(0.073, 10).rotateX(Math.PI / 2), materiau(0xe6d6a8));
  eponge.position.y = 0.096;
  g.add(pied, chapeau, eponge);
  return g;
}

/** Une amanite : pied mince et blanc, un anneau, des lames blanches ; tue-mouches rouge à flocons, phalloïde vert olive avec sa volve. */
function amanite(tueMouches: boolean, aleat: () => number): THREE.Group {
  const g = new THREE.Group();
  const blanc = materiau(0xf4efe2);
  const hauteur = tueMouches ? 0.15 : 0.12;
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, hauteur, 6).translate(0, hauteur / 2, 0), blanc);
  const anneau = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.032, 0.02, 8, 1, true), blanc);
  anneau.position.y = hauteur * 0.75;
  const rayon = tueMouches ? 0.085 : 0.065;
  const chapeau = new THREE.Mesh(
    new THREE.SphereGeometry(rayon, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    materiau(tueMouches ? 0xd8261c : 0xa8ad74, { rugosite: 0.45 }),
  );
  chapeau.scale.y = tueMouches ? 0.5 : 0.55;
  chapeau.position.y = hauteur;
  const lames = new THREE.Mesh(new THREE.CircleGeometry(rayon * 0.98, 10).rotateX(Math.PI / 2), blanc);
  lames.position.y = hauteur + 0.001;
  g.add(pied, anneau, chapeau, lames);
  if (tueMouches) {
    // Les flocons blancs, restes du voile.
    const flocon = new THREE.SphereGeometry(0.008, 4, 3);
    for (let i = 0; i < 12; i++) {
      const a = aleat() * Math.PI * 2;
      const h = 0.25 + aleat() * 0.7;
      const r = Math.sqrt(1 - h * h) * rayon;
      const f = new THREE.Mesh(flocon, blanc);
      f.position.set(Math.cos(a) * r, hauteur + h * rayon * 0.5, Math.sin(a) * r);
      g.add(f);
    }
  } else {
    // La volve : le sac blanc où le pied est pris, au ras du sol.
    const volve = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.026, 0.035, 8, 1, true).translate(0, 0.0175, 0), blanc);
    g.add(volve);
  }
  return g;
}

export class VueRessource {
  readonly objet = new THREE.Group();
  readonly donnees: RessourceSol;
  /** Ce qui disparaît quand on a fouillé (baies, boîtes, lame de ressort…) ; le reste demeure. */
  private contenu: THREE.Group | null = null;
  /** Les fleurs et les fruits verts d'un fruitier, selon le calendrier (2026-10-08). */
  private fleurs: THREE.Group | null = null;
  private verts: THREE.Group | null = null;
  /** Le jour de l'année : décide des fleurs, des fruits, des champignons de saison. */
  private jour = 0;

  constructor(donnees: RessourceSol) {
    this.donnees = donnees;
    const aleat = aleatoire(donnees.id * 97 + 3);
    this.objet.position.set(donnees.x, 0, donnees.z);
    this.objet.rotation.y = aleat() * Math.PI * 2;
    const ombre = (m: THREE.Mesh) => {
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    };

    switch (donnees.type) {
      case "branche":
        this.objet.add(ombre(new THREE.Mesh(geoBranche, materiau(PALETTE.boisSombre))), new THREE.Mesh(geoRameau, materiau(PALETTE.boisSombre)));
        break;
      case "buche":
        this.objet.add(ombre(new THREE.Mesh(geoBuche, materiau(PALETTE.bois))), new THREE.Mesh(geoCoupe, materiau(0xc9a77a)));
        break;
      case "pierre": {
        const m = ombre(new THREE.Mesh(geoPierre, materiau(aleat() < 0.5 ? PALETTE.pierre : PALETTE.pierreSombre)));
        m.scale.set(1.2, 0.7, 1);
        m.position.y = 0.1;
        this.objet.add(m);
        break;
      }
      case "velo": {
        // Un vieux vélo couché dans l'herbe : deux roues, le cadre, le guidon.
        const roue = new THREE.TorusGeometry(0.33, 0.035, 5, 16);
        const cadre = materiau(PALETTE.rouille, { rugosite: 0.7, metal: 0.3 });
        const r1 = ombre(new THREE.Mesh(roue, materiau(0x2b2b2b)));
        const r2 = ombre(new THREE.Mesh(roue, materiau(0x2b2b2b)));
        r1.rotation.x = r2.rotation.x = Math.PI / 2 - 0.12;
        r1.position.set(-0.52, 0.07, 0);
        r2.position.set(0.52, 0.1, 0.05);
        const tube = (l: number) => new THREE.CylinderGeometry(0.025, 0.025, l, 5);
        const t1 = ombre(new THREE.Mesh(tube(0.75), cadre));
        t1.rotation.z = Math.PI / 2;
        t1.position.set(0, 0.13, -0.1);
        const t2 = ombre(new THREE.Mesh(tube(0.55), cadre));
        t2.rotation.set(Math.PI / 2 - 0.1, 0, 0.6);
        t2.position.set(-0.12, 0.1, -0.05);
        const guidon = ombre(new THREE.Mesh(tube(0.45), materiau(0x55524d, { metal: 0.5, rugosite: 0.5 })));
        guidon.position.set(0.45, 0.22, -0.1);
        this.objet.add(r1, r2, t1, t2, guidon);
        break;
      }
      case "caisse_outils": {
        const caisse = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.32), materiau(0x7a2f22, { rugosite: 0.6, metal: 0.3 })));
        caisse.position.y = 0.15;
        const poignee = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 4, 10, Math.PI), materiau(0x55524d));
        poignee.position.y = 0.3;
        this.objet.add(caisse, poignee);
        break;
      }
      case "batterie_voiture": {
        const b = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.2), materiau(0x2b2b2b, { rugosite: 0.5 })));
        b.position.y = 0.11;
        const plus = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 6), materiau(0xc8362b));
        plus.position.set(-0.11, 0.245, 0);
        const moins = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 6), materiau(0x8f8a80));
        moins.position.set(0.11, 0.245, 0);
        this.objet.add(b, plus, moins);
        break;
      }
      case "ressort": {
        for (let i = 0; i < 3; i++) {
          const lame = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.1 - i * 0.25, 0.03, 0.07), materiau(0x55524d, { metal: 0.5, rugosite: 0.5 })));
          lame.position.set(0, 0.03 + i * 0.035, 0);
          this.objet.add(lame);
        }
        break;
      }
      case "bache": {
        const b = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.4), materiau(0x2f6fa4, { rugosite: 0.6 })));
        b.position.y = 0.06;
        b.rotation.y = 0.3;
        this.objet.add(b);
        break;
      }
      case "barre_metal": {
        const b = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6).rotateZ(Math.PI / 2), materiau(0x6e6a63, { metal: 0.6, rugosite: 0.5 })));
        b.position.y = 0.03;
        this.objet.add(b);
        break;
      }
      case "buisson": {
        const feuilles = ombre(new THREE.Mesh(geoBuisson, materiau(PALETTE.feuillageSombre)));
        feuilles.scale.set(1, 0.75, 1);
        feuilles.position.y = 0.38;
        this.objet.add(feuilles);
        const baies = new THREE.Group();
        for (let i = 0; i < 14; i++) {
          const b = new THREE.Mesh(geoBaie, materiau(0xb3243a, { rugosite: 0.4 }));
          const a = aleat() * Math.PI * 2;
          const h = 0.15 + aleat() * 0.45;
          b.position.set(Math.cos(a) * 0.5 * (1 - (h - 0.15) * 0.6), h, Math.sin(a) * 0.5 * (1 - (h - 0.15) * 0.6));
          baies.add(b);
        }
        this.objet.add(baies);
        this.contenu = baies;
        break;
      }
      case "joncs": {
        // Des moignons au ras de l'eau restent toujours ; les hautes tiges et les épis de massette repoussent.
        const vert = materiau(0x6f8b4e);
        const souche = new THREE.Group();
        for (let i = 0; i < 10; i++) {
          const t = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 4), vert);
          const a = aleat() * Math.PI * 2;
          t.position.set(Math.cos(a) * 0.22 * aleat(), 0.06, Math.sin(a) * 0.22 * aleat());
          souche.add(t);
        }
        this.objet.add(souche);
        const tiges = new THREE.Group();
        for (let i = 0; i < 16; i++) {
          const h = 0.7 + aleat() * 0.6;
          const t = ombre(new THREE.Mesh(new THREE.ConeGeometry(0.03, h, 4), materiau(aleat() < 0.5 ? 0x6f8b4e : 0x7f9a55)));
          const a = aleat() * Math.PI * 2;
          const r = 0.25 * aleat();
          t.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
          t.rotation.set((aleat() - 0.5) * 0.35, 0, (aleat() - 0.5) * 0.35);
          tiges.add(t);
          // Quelques épis bruns de massette, au bout d'une tige.
          if (i % 4 === 0) {
            const epi = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 6), materiau(0x6b4a2e));
            epi.position.set(t.position.x, h + 0.02, t.position.z);
            tiges.add(epi);
          }
        }
        this.objet.add(tiges);
        this.contenu = tiges;
        break;
      }
      case "pommier":
      case "poirier":
      case "prunier":
      case "cerisier":
      case "noyer":
        this.fruitier(donnees.type, aleat, ombre);
        break;
      case "cepe":
      case "amanite_tue_mouches":
      case "amanite_phalloide":
        this.champignons(donnees.type, aleat, ombre);
        break;
      case "rayonnage":
        this.rayonnage(aleat, ombre);
        break;
      case "panneau_auvent":
        this.panneauAuvent(ombre);
        break;
      case "epave_voiture":
        this.epaveVoiture(aleat, ombre);
        break;
      case "epave_camion":
        this.epaveCamion(aleat, ombre);
        break;
      case "caisse_atelier": {
        this.objet.rotation.y = 0;
        const etabli = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.7), materiau(0x6e6a63, { metal: 0.3, rugosite: 0.6 })));
        etabli.position.y = 0.45;
        const etau = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.25), materiau(0x2f6fa4, { metal: 0.4 })));
        etau.position.set(-0.6, 0.99, 0);
        const chutes = new THREE.Group();
        for (let i = 0; i < 3; i++) {
          const b = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6).rotateZ(Math.PI / 2), materiau(0x6e6a63, { metal: 0.6, rugosite: 0.5 })));
          b.position.set(0.2, 0.93, -0.15 + i * 0.12);
          b.rotation.y = (aleat() - 0.5) * 0.3;
          chutes.add(b);
        }
        this.objet.add(etabli, etau, chutes);
        this.contenu = chutes;
        break;
      }
      case "grenier": {
        // Une poulie au bout d'une poutre restée debout, la corde qui pend
        this.objet.rotation.y = 0;
        const poteau = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.2, 0.22), materiau(PALETTE.boisSombre)));
        poteau.position.y = 1.6;
        const bras = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.18), materiau(PALETTE.boisSombre)));
        bras.position.set(0.5, 3.1, 0);
        const poulie = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 5, 10), materiau(0x55524d, { metal: 0.5 }));
        poulie.position.set(1, 2.95, 0);
        const corde = new THREE.Group();
        const brin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.6, 4), materiau(0xb59a6a));
        brin.position.set(1.1, 1.65, 0);
        const rouleau = ombre(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 5, 12), materiau(0xb59a6a)));
        rouleau.position.set(1.1, 0.07, 0.1);
        rouleau.rotation.x = Math.PI / 2;
        corde.add(brin, rouleau);
        this.objet.add(poteau, bras, poulie, corde);
        this.contenu = corde;
        break;
      }
    }
    // Ce qu'on montre ou cache à part (fruits, fleurs, contenu fouillé) reste un groupe à part, même fusionné.
    for (const g of [this.contenu, this.fleurs, this.verts]) if (g) g.userData.garder = true;
    this.disponible(donnees.disponible);
  }

  disponible(oui: boolean): void {
    this.donnees.disponible = oui;
    this.majVisibilite();
  }

  /** Le calendrier avance : fleurs, fruits verts, fruits mûrs, champignons de saison. */
  saison(jour: number): void {
    if (jour === this.jour) return;
    this.jour = jour;
    this.majVisibilite();
  }

  private majVisibilite(): void {
    const t = this.donnees.type;
    const oui = this.donnees.disponible;
    const phase = this.jour > 0 && t in PERIODES_FRUITIERS ? phaseFruitier(t as keyof typeof PERIODES_FRUITIERS, this.jour) : null;
    if (this.fleurs) this.fleurs.visible = phase === "fleurs";
    if (this.verts) this.verts.visible = phase === "verts";
    // Un buisson cueilli, une épave fouillée restent là, vidés ; le reste disparaît jusqu'à sa repousse.
    if (RESTE_EN_PLACE[t]) {
      if (this.contenu) this.contenu.visible = oui && (phase === null || phase === "murs");
    } else this.objet.visible = oui && (this.jour === 0 || visibleEnSaison(t, this.jour));
    this.surVisibilite?.(this.objet.visible);
  }

  /** Prévenu quand la ressource apparaît ou disparaît (pour celles dessinées en lot, voir lots.ts). */
  surVisibilite: ((visible: boolean) => void) | null = null;

  /** Un arbre fruitier : tronc, houppier en grappes de facettes, et les fruits accrochés dehors (ils disparaissent à la cueillette). */
  private fruitier(type: keyof typeof FRUITIERS, aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    const f = FRUITIERS[type];
    // Un peu plus grands que les arbres de la lisière : on les repère de loin.
    this.objet.scale.setScalar(1.3);
    const tronc = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.24, f.tronc, 6).translate(0, f.tronc / 2, 0), materiau(f.ecorce)));
    this.objet.add(tronc);
    // Le houppier : quelques boules à facettes serrées, plus ou moins hautes selon l'espèce.
    const centre = new THREE.Vector3(0, f.tronc + f.rayon * f.etirement * 0.75, 0);
    const lobes: { c: THREE.Vector3; r: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + aleat();
      const c = i === 0 ? centre.clone() : centre.clone().add(new THREE.Vector3(Math.cos(a) * f.rayon * 0.55, (aleat() - 0.3) * f.rayon * 0.6 * f.etirement, Math.sin(a) * f.rayon * 0.55));
      const r = f.rayon * (i === 0 ? 0.85 : 0.6 + aleat() * 0.15);
      const lobe = ombre(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), materiau(new THREE.Color(f.feuillage).offsetHSL(0, 0, (aleat() - 0.5) * 0.06).getHex())));
      lobe.position.copy(c);
      lobe.scale.y = f.etirement;
      lobe.rotation.set(aleat(), aleat(), aleat());
      this.objet.add(lobe);
      lobes.push({ c, r });
    }
    // Les fruits : sur le pourtour des lobes, plutôt en bas et sur les côtés (là où ils pendent).
    const fruits = new THREE.Group();
    const geo = new THREE.SphereGeometry(f.fruit, 6, 5);
    const mat = materiau(f.couleur, { rugosite: 0.45 });
    for (let i = 0; i < f.nombre; i++) {
      const l = lobes[Math.floor(aleat() * lobes.length)]!;
      const a = aleat() * Math.PI * 2;
      const h = -0.75 + aleat() * 1.2;
      const rh = Math.sqrt(Math.max(0, 1 - h * h)) * l.r * 0.98;
      const fruit = new THREE.Mesh(geo, mat);
      fruit.position.set(l.c.x + Math.cos(a) * rh, l.c.y + h * l.r * f.etirement * 0.95, l.c.z + Math.sin(a) * rh);
      fruit.scale.y = f.allonge;
      fruits.add(fruit);
      // Les cerises vont par deux.
      if (type === "cerisier") {
        const deux = fruit.clone();
        deux.position.x += f.fruit * 1.8;
        fruits.add(deux);
      }
    }
    this.objet.add(fruits);
    this.contenu = fruits;
    // Au printemps, des fleurs blanches ou rosées ; ensuite, de petits fruits verts aux mêmes places.
    const fleurs = new THREE.Group();
    const verts = new THREE.Group();
    const geoFleur = new THREE.IcosahedronGeometry(0.06, 0);
    const matFleur = materiau(type === "pommier" ? 0xf6d8e0 : 0xfaf6ee, { rugosite: 0.8 });
    const geoVert = new THREE.SphereGeometry(f.fruit * 0.6, 5, 4);
    const matVert = materiau(type === "noyer" ? 0x7a9a3a : 0x8aa84a);
    for (const fruit of fruits.children) {
      for (let k = 0; k < 2; k++) {
        const fl = new THREE.Mesh(geoFleur, matFleur);
        fl.position.copy(fruit.position).add(new THREE.Vector3((aleat() - 0.5) * 0.25, (aleat() - 0.3) * 0.2, (aleat() - 0.5) * 0.25));
        fleurs.add(fl);
      }
      const v = new THREE.Mesh(geoVert, matVert);
      v.position.copy(fruit.position);
      verts.add(v);
    }
    if (type !== "noyer") this.objet.add(fleurs);
    this.objet.add(verts);
    this.fleurs = type !== "noyer" ? fleurs : null;
    this.verts = verts;
  }

  /** Une petite talle de champignons : de vraies formes, pour apprendre à les reconnaître. */
  private champignons(type: "cepe" | "amanite_tue_mouches" | "amanite_phalloide", aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    const nombre = 2 + Math.floor(aleat() * 2);
    for (let i = 0; i < nombre; i++) {
      const c = type === "cepe" ? cepe() : amanite(type === "amanite_tue_mouches", aleat);
      const a = aleat() * Math.PI * 2;
      const r = i === 0 ? 0 : 0.12 + aleat() * 0.1;
      c.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      // Un peu plus grands que nature (≈ ×1,6), pour qu'on les voie de la caméra.
      c.scale.setScalar((i === 0 ? 1.6 : 1.1 + aleat() * 0.4));
      c.rotation.set((aleat() - 0.5) * 0.2, aleat() * Math.PI * 2, (aleat() - 0.5) * 0.2);
      c.traverse((o) => {
        if (o instanceof THREE.Mesh) ombre(o);
      });
      this.objet.add(c);
    }
  }

  /** Une étagère de magasin tirée hors de la boutique, avec quelques boîtes oubliées. */
  private rayonnage(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = (aleat() - 0.5) * 0.4;
    const metal = materiau(0x9aa0a6, { metal: 0.4, rugosite: 0.5 });
    for (const dx of [-0.75, 0.75]) {
      const montant = ombre(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.8, 0.45), metal));
      montant.position.set(dx, 0.9, 0);
      this.objet.add(montant);
    }
    for (let i = 0; i < 4; i++) {
      const tablette = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.45), metal));
      tablette.position.set(0, 0.2 + i * 0.48, 0);
      if (i === 2) tablette.rotation.z = 0.18;
      this.objet.add(tablette);
    }
    const boites = new THREE.Group();
    const couleurs = [0xc8362b, 0xd8c43a, 0x2f6fa4];
    for (let i = 0; i < 5; i++) {
      const b = ombre(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.13, 8), materiau(couleurs[i % 3]!, { rugosite: 0.5, metal: 0.3 })));
      b.position.set(-0.55 + aleat() * 1.1, 0.29 + Math.floor(aleat() * 2) * 0.96, (aleat() - 0.5) * 0.25);
      if (aleat() < 0.3) b.rotation.z = Math.PI / 2;
      boites.add(b);
    }
    this.objet.add(boites);
    this.contenu = boites;
  }

  /** Le petit panneau solaire, tombé de l'auvent, appuyé contre le pilier : on le voit et on l'atteint du sol. */
  private panneauAuvent(ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = -Math.PI / 2;
    const cadre = ombre(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.7), materiau(0xc9ccd0, { metal: 0.6, rugosite: 0.4 })));
    const cellules = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.62).rotateX(-Math.PI / 2), materiau(0x1f3550, { rugosite: 0.2, metal: 0.4 }));
    cellules.position.y = 0.03;
    // Le câble arraché, qui pend.
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4), materiau(0x1a1a1a));
    cable.position.set(0.45, -0.25, -0.2);
    cable.rotation.z = 0.4;
    const panneau = new THREE.Group();
    panneau.add(cadre, cellules, cable);
    // Debout sur sa tranche, penché contre le pilier (à l'ouest du panneau).
    panneau.rotation.x = -1.2;
    panneau.position.set(0, 0.36, 0.12);
    this.objet.add(panneau);
  }

  /**
   * Une voiture de l'Abondance (2026-10-08) : une berline profilée, affaissée sur ses pneus crevés, une roue partie,
   * les vitres brisées, une portière ouverte, la rouille et la mousse par-dessus, l'herbe qui pousse autour.
   * Tout est fusionné par finition (voir `Assemblage`) : quelques appels de dessin, ≈ 2 000 triangles.
   */
  private epaveVoiture(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    const teintes = [0x8a3b2a, 0x4d6a7a, 0xc9bfa8, 0x5c6b4a];
    // La teinte suit l'identifiant : deux épaves voisines n'ont pas la même couleur.
    const peinture = teintes[(this.donnees.id + Math.floor(aleat() * 2) * 2) % teintes.length]!;
    this.objet.rotation.y = this.donnees.id % 2 === 0 ? 0.08 : Math.PI - 0.06;
    const c = new Assemblage();
    // La roue avant droite est partie : la caisse penche vers elle, en pivotant sur les roues qui restent.
    const penche = pivot(-1.35, 0, 0.76, -0.025, -0.015);
    c.repere = penche;

    // La caisse : coffre, ceinture, capot plongeant, passages de roues ; arêtes chanfreinées.
    const profil = new THREE.Shape([V(-2, 0.32), V(-2, 0.8), V(-1.9, 0.9), V(-1.15, 0.93), V(0.8, 0.93), V(1.95, 0.8), V(2, 0.68), V(2, 0.34), V(1.88, 0.25)]);
    profil.absarc(1.35, 0.3, 0.42, 0, Math.PI, false);
    profil.lineTo(0.93, 0.25);
    profil.lineTo(-0.93, 0.25);
    profil.absarc(-1.35, 0.3, 0.42, 0, Math.PI, false);
    profil.lineTo(-1.9, 0.25);
    const opts = { depth: 1.65, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1, curveSegments: 5 };
    c.ajouter(new THREE.ExtrudeGeometry(profil, opts).translate(0, 0, -0.825), peinture, "tole");
    // L'habitacle : montants inclinés, pavillon, flancs rentrés vers le haut.
    const habitacle = new THREE.ExtrudeGeometry(new THREE.Shape([V(-1.15, 0.93), V(-0.85, 1.36), V(0.25, 1.39), V(0.85, 0.93)]), { depth: 1.46, bevelEnabled: false });
    c.ajouter(pincer(habitacle.translate(0, 0, -0.73), 0.93, 0.46, 0.14), peinture, "tole");

    // Les surfaces où l'on pose vitres, phares, rouille et mousse.
    const k = (0.73 * 0.14) / 0.46;
    const flancHaut = (s: number) => surface(new V3(0, 0.93, s * 0.73), X, new V3(0, 1, -s * k), new V3(0, k, s));
    const flanc = (s: number) => surface(new V3(0, 0, s * 0.875), X, Y, new V3(0, 0, s));
    const pareBrise = surface(new V3(0.85, 0.93, 0), Z, new V3(-0.6, 0.46, 0), new V3(0.46, 0.6, 0));
    const lunette = surface(new V3(-1.15, 0.93, 0), Z, new V3(0.3, 0.43, 0), new V3(-0.43, 0.3, 0));
    const pavillon = surface(new V3(-0.85, 1.36, 0), new V3(1.1, 0.03, 0), Z, Y);
    const capot = surface(new V3(0.8, 0.98, 0), new V3(1.15, -0.13, 0), Z, new V3(0.11, 1, 0));
    const coffre = surface(new V3(-1.9, 0.95, 0), new V3(0.75, 0.03, 0), Z, Y);
    const avant = surface(new V3(2.05, 0, 0), Z, Y, X);
    const arriere = surface(new V3(-2.05, 0, 0), Z, Y, new V3(-1, 0, 0));

    // Les vitres : intactes, brisées (un éclat dentelé dans le cadre) ou parties (l'habitacle sombre).
    const portiereOuverte = aleat() < 0.65;
    for (const s of [1, -1]) {
      fenetre(c, { v0: 0.09, v1: 0.38, a0: -0.02, b0: 0.66, a1: -0.02, b1: 0.28 }, flancHaut(s), aleat, s === 1 && portiereOuverte);
      fenetre(c, { v0: 0.09, v1: 0.38, a0: -1.0, b0: -0.14, a1: -0.8, b1: -0.14 }, flancHaut(s), aleat);
    }
    const tPareBrise = { v0: 0.07, v1: 0.92, a0: -0.643, b0: 0.643, a1: -0.556, b1: 0.556 };
    if (aleat() < 0.55) {
      // Le pare-brise feuilleté tient encore, étoilé par un choc.
      c.plaque(trapeze(tPareBrise), pareBrise, VERRE, "verre");
      etoile(c, pareBrise, (aleat() - 0.5) * 0.7, 0.3 + aleat() * 0.35, aleat);
    } else fenetre(c, tPareBrise, pareBrise, aleat);
    fenetre(c, { v0: 0.08, v1: 0.9, a0: -0.632, b0: 0.632, a1: -0.554, b1: 0.554 }, lunette, aleat);
    // Les essuie-glaces, couchés au pied du pare-brise.
    for (const z of [-0.32, 0.25]) c.boite(0x222222, "metal", 0.03, 0.02, 0.55, 0.8, 0.99, z, 0, 0.25, 0);

    // Les flancs : jointures des portières, poignées, baguette, bas de caisse sombre.
    for (const s of [1, -1]) {
      const f = flanc(s);
      const ouverte = s === 1 && portiereOuverte;
      for (const x of ouverte ? [-1.0] : [0.78, -0.12, -1.0]) c.plaque(rect(x, 0.61, 0.007, 0.31), f, NOIR, "mat");
      for (const x of ouverte ? [-0.95] : [-0.05, -0.95]) c.boite(NOIR, "metal", 0.14, 0.03, 0.03, x, 0.84, s * 0.89);
      c.plaque(rect(0, 0.27, 0.9, 0.05), f, 0x3a3836, "mat");
      c.plaque(ouverte ? rect(-0.5, 0.52, 0.38, 0.025) : rect(0, 0.52, 0.88, 0.025), f, NOIR, "mat");
    }
    // Le rétroviseur gauche tient encore ; le droit est tombé.
    c.boite(peinture, "tole", 0.06, 0.04, 0.12, 0.72, 1.0, -0.9);
    c.boite(peinture, "tole", 0.07, 0.12, 0.16, 0.7, 1.02, -0.96);

    // La portière avant gauche, ouverte et affaissée sur ses gonds : l'habitacle noir derrière.
    if (portiereOuverte) {
      c.plaque(rect(0.33, 0.61, 0.43, 0.31), flanc(1), NUIT, "mat", 0.006);
      c.boite(0x4a3f36, "mat", 0.5, 0.12, 0.6, 0.15, 0.95, 0.45);
      c.repere = penche.clone().multiply(new THREE.Matrix4().compose(new V3(0.78, 0, 0.875), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.7 + aleat() * 0.4, 0.04)), new V3(1, 1, 1)));
      c.boite(peinture, "tole", 0.86, 0.6, 0.06, -0.43, 0.62, 0.03);
      c.boite(peinture, "tole", 0.05, 0.38, 0.05, -0.82, 1.12, 0.03);
      c.boite(peinture, "tole", 0.44, 0.04, 0.05, -0.6, 1.3, 0.03);
      c.boite(peinture, "tole", 0.59, 0.04, 0.05, -0.195, 1.13, 0.03, 0, 0, Math.PI - 0.654);
      c.boite(NOIR, "metal", 0.14, 0.03, 0.03, -0.72, 0.84, 0.07);
      c.plaque(rect(-0.43, 0.62, 0.4, 0.27), surface(new V3(0, 0, 0), X, Y, new V3(0, 0, -1)), 0x3d3833, "mat", 0.006);
      c.plaque(eclat({ v0: 0.95, v1: 1.28, a0: -0.8, b0: 0.0, a1: -0.8, b1: -0.4 }, 0.5, aleat), surface(new V3(0, 0, 0.03), X, Y, Z), VERRE, "verre");
      c.repere = penche;
    }

    // L'avant : calandre, phares (l'un crevé), clignotants, pare-chocs ; l'arrière : feux, plaque, pare-chocs qui pend.
    c.plaque(rect(0, 0.51, 0.42, 0.11), avant, 0x2b2a28, "metal");
    for (const s of [1, -1]) {
      c.plaque(rect(s * 0.65, 0.55, 0.15, 0.08), avant, aleat() < 0.4 ? NUIT : 0xd9d6c8, "verre");
      c.plaque(rect(s * 0.65, 0.42, 0.1, 0.03), avant, 0xc7792e, "verre");
      c.plaque(rect(s * 0.66, 0.67, 0.13, 0.06), arriere, aleat() < 0.3 ? NUIT : 0x8e2a22, "verre");
    }
    c.plaque(rect(0, 0.48, 0.25, 0.055), arriere, 0xd8d2b8, "mat");
    c.boite(0x4a4845, "metal", 0.16, 0.14, 1.8, 2.1, 0.3, 0);
    c.boite(0x4a4845, "metal", 0.16, 0.14, 1.8, -2.1, 0.27, 0.05, 0.09, 0, 0);

    // La rouille : en taches sur le capot, le pavillon, le coffre, au-dessus des roues et en bas des portières.
    // D'abord le vernis farineux, délavé par le soleil sur les dessus ; puis la crasse en bas de caisse.
    const delavee = new THREE.Color(peinture).offsetHSL(0, -0.04, 0.035).getHex();
    c.plaque(tache(0.45, 0, 0.5, 0.75, aleat, 9), capot, delavee, "tole", 0.005);
    c.plaque(tache(0.5, 0, 0.45, 0.55, aleat, 9), pavillon, delavee, "tole", 0.005);
    c.plaque(tache(0.5, 0, 0.4, 0.7, aleat, 8), coffre, delavee, "tole", 0.005);
    for (const s of [1, -1]) c.plaque(tache(0, 0.36, 0.85, 0.08, aleat, 9), flanc(s), CRASSE, "mat", 0.005);
    rouille(c, capot, 0.2 + aleat() * 0.6, (aleat() - 0.5) * 1.1, 0.12 + aleat() * 0.1, 0.18 + aleat() * 0.2, aleat);
    rouille(c, capot, 0.9, (aleat() - 0.5) * 1.2, 0.08, 0.15, aleat);
    rouille(c, pavillon, 0.6 + aleat() * 0.3, (aleat() - 0.5) * 0.6, 0.12, 0.18, aleat);
    rouille(c, coffre, 0.5, (aleat() - 0.5) * 1, 0.25, 0.25, aleat);
    for (const s of [1, -1]) {
      const f = flanc(s);
      for (const x of [-1.35, 1.35]) rouille(c, f, x + (aleat() - 0.5) * 0.3, 0.74, 0.24, 0.08, aleat);
      rouille(c, f, -0.9 + aleat() * 1.6, 0.36, 0.3 + aleat() * 0.15, 0.07, aleat);
      c.plaque(tache(-0.5 + aleat() * 0.6, 0.06, 0.05, 0.03, aleat), flancHaut(s), ROUILLE_SOMBRE);
    }
    // La mousse sur le pavillon et au pied du pare-brise, les feuilles mortes prises dans les recoins.
    c.plaque(tache(0.2 + aleat() * 0.2, (aleat() - 0.5) * 0.3, 0.22, 0.38, aleat, 9), pavillon, MOUSSE, "mat", 0.012);
    c.plaque(tache(0.25, (aleat() - 0.5) * 0.3, 0.12, 0.2, aleat), pavillon, MOUSSE_CLAIRE, "mat", 0.016);
    for (let i = 0; i < 3; i++) bosseMousse(c, -0.8 + aleat() * 0.4, 1.36, (aleat() - 0.5) * 1, 0.07 + aleat() * 0.05, aleat);
    for (let i = 0; i < 3; i++) bosseMousse(c, 0.86 + aleat() * 0.06, 0.97, (aleat() - 0.5) * 1.3, 0.06 + aleat() * 0.04, aleat);
    for (let i = 0; i < 8; i++) {
      const s = i < 5 ? capot : coffre;
      c.plaque(tache(aleat() * (i < 5 ? 0.25 : 1), (aleat() - 0.5) * 1.5, 0.05, 0.035, aleat, 5), s, FEUILLES[i % 3]!, "mat", 0.012);
    }

    // Les roues : pneus à plat sur jantes d'acier ; à l'avant droit, le disque de frein nu au-dessus des pierres.
    for (const [x, z] of [[-1.35, 0.76], [1.35, 0.76], [-1.35, -0.76]] as const) {
      roue(c, x, z, 0.32, 0.2, 0.08 + aleat() * 0.06, aleat() < 0.5 ? ROUILLE_SOMBRE : ACIER, Math.sign(z));
    }
    c.ajouter(placer(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 10), 1.35, 0.26, -0.62, Math.PI / 2), ROUILLE_SOMBRE, "metal");
    c.ajouter(placer(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 6), 1.35, 0.26, -0.66, Math.PI / 2), ACIER, "metal");

    // Au sol : la cale de pierres, une auréole sombre, l'herbe qui a repoussé autour et dans le passage de roue vide.
    const sol = new Assemblage();
    sol.ajouter(placer(new THREE.DodecahedronGeometry(0.17, 0).scale(1.3, 0.55, 1), 1.3, 0.08, -0.55, 0, aleat() * 3, 0), PALETTE.pierreSombre);
    sol.ajouter(placer(new THREE.DodecahedronGeometry(0.12, 0).scale(1.2, 0.6, 1), 1.38, 0.19, -0.52, 0, aleat() * 3, 0), PALETTE.pierre);
    sol.plaque(tache(0, 0, 2.3, 1.1, aleat, 11), SOL_PLAT, 0x4d4a42, "sol", 0.035);
    touffe(sol, 1.4, -0.85, aleat, 7, 0.6);
    for (const [x, z] of [[-1.35, 0.95], [1.35, 0.98], [-1.35, -0.98], [-1.75, 0.5], [0.4, -0.95], [2.15, 0.3]] as const) touffe(sol, x, z, aleat, 4, 0.45);
    for (let i = 0; i < 5; i++) touffe(sol, (aleat() - 0.5) * 4, (aleat() < 0.5 ? -1 : 1) * (0.95 + aleat() * 0.25), aleat, 3, 0.35);

    for (const m of [...c.maillages(ombre), ...sol.maillages(ombre)]) this.objet.add(m);

    // La lame de ressort, tombée sous la caisse, qui dépasse du bas de caisse côté droit : c'est ce qu'on vient chercher.
    const r = new Assemblage();
    r.repere = new THREE.Matrix4().compose(new V3(-0.55, 0.02, -0.92), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.18, 0)), new V3(1, 1, 1));
    for (let i = 0; i < 3; i++) {
      const lame = courber(new THREE.BoxGeometry(1.1 - i * 0.28, 0.025, 0.07, 6, 1, 1), 0.1, 0.55);
      r.ajouter(lame.translate(0, 0.0125 + (2 - i) * 0.026, 0), i === 1 ? ROUILLE_SOMBRE : 0x55524d, "metal");
    }
    for (const x of [-0.57, 0.57]) r.ajouter(placer(new THREE.TorusGeometry(0.035, 0.013, 4, 8), x, 0.17, 0), 0x55524d, "metal");
    const ressort = new THREE.Group();
    for (const m of r.maillages(ombre)) ressort.add(m);
    this.objet.add(ressort);
    this.contenu = ressort;
  }

  /**
   * Un camion de livraison à cabine avancée (2026-10-08) : calandre, phares, rétroviseurs, logo délavé sur la portière ;
   * la benne bâchée, la bâche crevée et affaissée entre ses arceaux, la ridelle arrière tombée. La bâche (et les
   * chiffons) disparaissent quand on a fouillé : restent les arceaux nus.
   */
  private epaveCamion(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = 0.04;
    const teintes = [0xd6d0c2, 0x9a4a3a, 0x56708a];
    const n = Math.floor(aleat() * teintes.length);
    const tole = teintes[n]!;
    const logo = n === 1 ? 0xd8ccb0 : 0xa8645a;
    const c = new Assemblage();
    // Le pneu avant droit est crevé : le camion s'affaisse un peu de ce côté.
    c.repere = pivot(-2, 0, 1, -0.018, -0.008);

    // La cabine : face avant presque droite, pare-brise incliné, pavillon arrondi, passage de roue.
    const profil = new THREE.Shape([V(1.95, 0.85), V(1.95, 2.8), V(2.05, 2.88), V(3.45, 2.88), V(3.57, 2.8), V(3.7, 1.72), V(3.74, 1.62), V(3.74, 0.95), V(3.64, 0.85)]);
    profil.absarc(2.85, 0.55, 0.6, Math.PI / 6, (Math.PI * 5) / 6, false);
    const opts = { depth: 2.25, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1, curveSegments: 6 };
    c.ajouter(new THREE.ExtrudeGeometry(profil, opts).translate(0, 0, -1.125), tole, "tole");

    const nPB = new V3(1.08, 0.13, 0).normalize();
    const pareBrise = surface(new V3(3.7, 1.72, 0).addScaledVector(nPB, 0.05), Z, new V3(-0.13, 1.08, 0), nPB);
    const porte = (s: number) => surface(new V3(0, 0, s * 1.175), X, Y, new V3(0, 0, s));
    const face = surface(new V3(3.79, 0, 0), Z, Y, X);
    const pavillon = surface(new V3(0, 2.93, 0), X, Z, Y);

    // Le pare-brise en deux moitiés : l'une étoilée, l'autre brisée ; l'habitacle sombre derrière.
    c.plaque(trapeze({ v0: 0.08, v1: 0.93, a0: -1.03, b0: 1.03, a1: -1.03, b1: 1.03 }), pareBrise, NUIT, "mat", 0.005);
    const gauche = { v0: 0.1, v1: 0.91, a0: -1.0, b0: -0.03, a1: -1.0, b1: -0.03 };
    const droite = { v0: 0.1, v1: 0.91, a0: 0.03, b0: 1.0, a1: 0.03, b1: 1.0 };
    const etoilee = aleat() < 0.5 ? gauche : droite;
    c.plaque(trapeze(etoilee), pareBrise, VERRE, "verre");
    etoile(c, pareBrise, (etoilee.a0 + etoilee.b0) / 2 + (aleat() - 0.5) * 0.4, 0.4 + aleat() * 0.3, aleat);
    c.plaque(eclat(etoilee === gauche ? droite : gauche, 0.45, aleat), pareBrise, VERRE, "verre", 0.01);
    c.plaque(rect(0, 0.5, 0.025, 0.42), pareBrise, tole, "tole", 0.012);
    for (const z of [-0.6, 0.45]) c.boite(0x222222, "metal", 0.03, 0.02, 0.8, 3.76, 1.78, z, 0, 0.3, 0);
    c.boite(tole, "tole", 0.3, 0.04, 2.2, 3.68, 2.88, 0, 0, 0, -0.12);

    // Les portières : vitre, jointures, poignée, logo délavé (un éclair dans un disque), marchepieds.
    for (const s of [1, -1]) {
      const p = porte(s);
      fenetre(c, { v0: 1.85, v1: 2.6, a0: 2.42, b0: 3.55, a1: 2.42, b1: 3.46 }, p, aleat);
      c.plaque(rect(2.36, 1.83, 0.008, 0.88), p, NOIR, "mat");
      c.plaque(rect(2.98, 2.71, 0.62, 0.008), p, NOIR, "mat");
      c.boite(NOIR, "metal", 0.16, 0.04, 0.04, 2.52, 1.72, s * 1.19);
      c.plaque(disque(3.0, 1.32, 0.27, 9), p, logo, "mat", 0.01);
      c.plaque(ECLAIR.map((q) => V(3.0 + q.x * 0.2, 1.32 + q.y * 0.2)), p, tole, "mat", 0.014);
      c.plaque(rect(2.98, 0.98, 0.6, 0.03), p, logo, "mat", 0.01);
      c.plaque(tache(3.2 + aleat() * 0.2, 1.1, 0.08, 0.2, aleat), p, ROUILLE_SOMBRE);
      c.boite(NOIR, "metal", 0.32, 0.05, 0.24, 2.12, 0.62, s * 1.05);
      c.boite(NOIR, "metal", 0.32, 0.05, 0.24, 2.12, 0.34, s * 1.05);
      c.boite(NOIR, "metal", 0.05, 0.4, 0.24, 1.98, 0.5, s * 1.05);
      // Les rétroviseurs sur leurs bras ; l'un pend, retourné.
      c.boite(NOIR, "metal", 0.04, 0.04, 0.14, 3.5, 2.35, s * 1.22);
      if (s === 1) c.boite(NOIR, "metal", 0.07, 0.42, 0.18, 3.52, 2.16, s * 1.3);
      else c.boite(NOIR, "metal", 0.07, 0.42, 0.18, 3.5, 2.1, s * 1.28, 0.5, 0, 0.3);
    }

    // L'avant : calandre à lames, pare-chocs, phares (l'un crevé), clignotants, feux de gabarit sur le pavillon.
    c.plaque(rect(0, 1.3, 0.85, 0.25), face, 0x2b2a28, "metal");
    for (const y of [1.12, 1.24, 1.36, 1.48]) c.boite(0x8a8780, "metal", 0.03, 0.035, 1.66, 3.8, y, 0);
    c.boite(0x3a3936, "metal", 0.22, 0.32, 2.36, 3.86, 0.68, 0);
    const parechoc = surface(new V3(3.97, 0, 0), Z, Y, X);
    for (const s of [1, -1]) {
      c.plaque(rect(s * 0.88, 0.7, 0.15, 0.08), parechoc, aleat() < 0.4 ? NUIT : 0xd9d6c8, "verre");
      c.plaque(rect(s * 0.6, 0.7, 0.07, 0.05), parechoc, 0xc7792e, "verre");
      c.plaque(tache(s * 0.8, 1.0, 0.06, 0.12, aleat), face, ROUILLE_SOMBRE);
    }
    for (const z of [-0.35, 0, 0.35]) c.boite(0xc7792e, "verre", 0.06, 0.05, 0.14, 3.45, 2.95, z);

    // Le pavillon : rouille, mousse, feuilles mortes.
    rouille(c, pavillon, 2.5 + aleat() * 0.6, (aleat() - 0.5) * 1.2, 0.3, 0.25, aleat);
    c.plaque(tache(2.4 + aleat() * 0.4, (aleat() - 0.5) * 0.8, 0.45, 0.5, aleat, 9), pavillon, MOUSSE, "mat", 0.012);
    c.plaque(tache(2.5, (aleat() - 0.5) * 0.5, 0.2, 0.25, aleat), pavillon, MOUSSE_CLAIRE, "mat", 0.016);
    for (let i = 0; i < 4; i++) bosseMousse(c, 2.1 + aleat() * 0.9, 2.93, (aleat() - 0.5) * 1.8, 0.09 + aleat() * 0.07, aleat);
    for (let i = 0; i < 6; i++) c.plaque(tache(2.1 + aleat() * 1.3, (aleat() - 0.5) * 2, 0.06, 0.04, aleat, 5), pavillon, FEUILLES[i % 3]!, "mat", 0.014);

    // Le châssis : longerons, traverses, réservoir, coffre à batteries, barre anti-encastrement, garde-boue.
    for (const z of [-0.48, 0.48]) c.boite(0x2b2b2b, "metal", 7.2, 0.22, 0.14, -0.1, 0.82, z);
    for (const x of [-3.3, -0.8, 1.5]) c.boite(0x2b2b2b, "metal", 0.12, 0.16, 0.9, x, 0.82, 0);
    c.ajouter(placer(new THREE.CylinderGeometry(0.27, 0.27, 0.9, 8), 1.1, 0.62, 0.86, 0, 0, Math.PI / 2), 0x5a5a56, "metal");
    c.boite(ROUILLE_SOMBRE, "metal", 0.05, 0.56, 0.58, 0.85, 0.62, 0.86);
    c.boite(0x2b2b2b, "metal", 0.6, 0.42, 0.45, 1.1, 0.66, -0.85);
    c.boite(0x2b2b2b, "metal", 0.1, 0.12, 2.2, -3.62, 0.48, 0);
    for (const z of [-0.6, 0.6]) c.boite(0x2b2b2b, "metal", 0.08, 0.36, 0.08, -3.6, 0.7, z);
    for (const s of [1, -1]) {
      c.boite(0x2b2b2b, "metal", 1.05, 0.04, 0.62, -2.0, 1.04, s * 0.93);
      c.boite(0x1f1f1f, "mat", 0.02, 0.45, 0.55, -2.62, 0.72, s * 0.93, 0, 0, 0.08);
    }

    // La benne : plancher, ridelles d'aluminium et leurs ranchers, la bande délavée ; la ridelle arrière est tombée.
    const alu = 0xa8a59c;
    c.boite(0x6e655a, "mat", 5.55, 0.16, 2.5, -0.945, 1.13, 0);
    for (const s of [1, -1]) {
      c.boite(alu, "metal", 5.55, 0.5, 0.05, -0.945, 1.46, s * 1.225);
      for (const x of [-3.6, -2.25, -0.9, 0.45]) c.boite(0x8a8780, "metal", 0.07, 0.56, 0.06, x, 1.46, s * 1.25);
      const cote = surface(new V3(0, 0, s * 1.25), X, Y, new V3(0, 0, s));
      c.plaque(rect(-0.95, 1.42, 2.6, 0.05), cote, logo, "mat");
      for (let i = 0; i < 3; i++) c.plaque(tache(-3.4 + aleat() * 5, 1.27, 0.3, 0.05, aleat), cote, 0x77746c);
    }
    c.boite(alu, "metal", 0.06, 1.64, 2.5, 1.8, 2.03, 0);
    c.boite(alu, "metal", 0.05, 0.5, 2.45, -3.76, 0.97, 0, 0, 0, -0.12);
    // Une palette et un carton éventré au fond ; de l'herbe a pris racine dans la poussière du plancher.
    c.boite(PALETTE.bois, "mat", 1.0, 0.12, 1.0, -2.95, 1.27, 0.5, 0, 0.2, 0);
    c.boite(0xa88a5c, "mat", 0.5, 0.4, 0.42, -2.9, 1.53, 0.55, 0, 0.5, 0);
    c.boite(0x9a7d52, "mat", 0.45, 0.35, 0.4, -3.15, 1.38, -0.5, 0.4, 0.2, 1.4);
    touffe(c, -3.45, -0.8, aleat, 4, 0.35, 1.2);
    // Les arceaux et les lattes de faîte : ils restent quand la bâche est partie.
    for (const x of ARCEAUX) {
      for (const s of [1, -1]) {
        c.boite(ACIER, "metal", 0.05, 1.12, 0.05, x, 2.27, s * 1.22);
        c.boite(ACIER, "metal", 0.05, 0.05, 0.2, x, 2.77, s * 1.15, s * 0.8, 0, 0);
      }
      c.boite(ACIER, "metal", 0.05, 0.05, 2.2, x, 2.82, 0);
    }
    for (const z of [-0.6, 0.6]) c.boite(ACIER, "metal", 5.4, 0.04, 0.04, -0.9, 2.8, z);

    // Les roues : simples à l'avant, jumelées à l'arrière ; deux pneus à plat.
    for (const s of [1, -1]) {
      roue(c, 2.85, s * 1.0, 0.5, 0.3, s === -1 ? 0.15 : 0.04, ACIER, s);
      roue(c, -2.0, s * 0.78, 0.5, 0.26, 0.04, ACIER, s);
      roue(c, -2.0, s * 1.06, 0.5, 0.26, s === 1 && aleat() < 0.6 ? 0.13 : 0.05, aleat() < 0.5 ? ROUILLE_SOMBRE : ACIER, s);
    }

    // Au sol : l'auréole sombre et l'herbe haute autour des roues et sous la ridelle.
    const sol = new Assemblage();
    sol.plaque(tache(0, 0, 4, 1.45, aleat, 12), SOL_PLAT, 0x4d4a42, "sol", 0.035);
    for (const [x, z] of [[2.85, 1.25], [2.85, -1.25], [-2.0, 1.32], [-2.0, -1.32], [-3.9, 0.6], [-3.95, -0.7], [0.4, 1.3], [1.4, -1.3]] as const) {
      touffe(sol, x, z, aleat, 5, 0.6);
    }
    for (let i = 0; i < 6; i++) touffe(sol, -3.5 + aleat() * 7, (aleat() < 0.5 ? -1 : 1) * (1.3 + aleat() * 0.3), aleat, 3, 0.4);
    for (const m of [...c.maillages(ombre), ...sol.maillages(ombre)]) this.objet.add(m);

    // La bâche : une toile tendue sur les arceaux, affaissée entre eux, crevée sur le dessus ; un pan arraché pend
    // sur le flanc. Avec deux chiffons roulés en boule au fond de la benne : c'est ce qu'on vient chercher.
    const b = new Assemblage();
    b.repere = c.repere;
    const toile = [0x5f7a8c, 0x7d8460, 0xb3a68a][Math.floor(aleat() * 3)]!;
    bache(b, toile, logo, aleat);
    for (const [x, z, teinte] of [[-3.3, 0.1, 0x9a8f7c], [-2.6, -0.6, 0x6d7f8f]] as const) {
      b.ajouter(placer(new THREE.IcosahedronGeometry(0.2, 0).scale(1.2, 0.45, 0.9), x, 1.28, z, 0, aleat() * 3, 0), teinte, "toile");
    }
    const baches = new THREE.Group();
    for (const m of b.maillages(ombre)) baches.add(m);
    this.objet.add(baches);
    this.contenu = baches;
  }
}

// ---------- L'atelier des épaves (2026-10-08) : tôles profilées, vitres brisées, rouille, mousse, bâche crevée ----------
// Une épave est faite de dizaines de pièces : on les fusionne par finition, la couleur passant par les sommets.
// Une voiture ou un camion = 4 à 6 appels de dessin, quelques milliers de triangles (objectif 30 i/s sur iPhone 13).

const V = (x: number, y: number) => new THREE.Vector2(x, y);
const V3 = THREE.Vector3;
const X = new V3(1, 0, 0);
const Y = new V3(0, 1, 0);
const Z = new V3(0, 0, 1);

const NUIT = 0x1c1e20;
const NOIR = 0x2a2826;
const VERRE = 0x7d929c;
const FISSURE = 0xc4ccd0;
const ACIER = 0x6b6862;
const ROUILLE_SOMBRE = 0x6e3a22;
const MOUSSE = 0x4f6a35;
const CRASSE = 0x5a4e40;
const MOUSSE_CLAIRE = 0x66823f;
const FEUILLES = [0x8a6a3a, 0xa07a3a, 0x6f5a32];
const HERBES = [PALETTE.herbe, PALETTE.herbeSeche, PALETTE.herbeSombre];
/** Les arceaux de la benne du camion (x) ; à l'avant, la bâche s'appuie sur la paroi de la benne. */
const ARCEAUX = [-3.6, -2.25, -0.9, 0.45];
/** Un éclair stylisé (logo de la société de livraison), dans un carré de côté 2. */
const ECLAIR = [V(-0.25, 0.9), V(0.35, 0.9), V(0.05, 0.15), V(0.45, 0.15), V(-0.3, -0.95), V(-0.05, -0.1), V(-0.45, -0.1)];

/** La finition d'une pièce : rugosité et métal du matériau partagé (la couleur, elle, est dans les sommets). */
type Finition = "mat" | "tole" | "metal" | "verre" | "toile" | "sol";
const FINITIONS: Record<Finition, [rugosite: number, metal: number]> = {
  mat: [0.9, 0],
  tole: [0.72, 0.25],
  metal: [0.5, 0.45],
  verre: [0.2, 0.15],
  toile: [0.95, 0],
  sol: [1, 0],
};
const materiauxSommets = new Map<Finition, THREE.MeshStandardMaterial>();

/** Le matériau à facettes d'une finition, couleurs par sommet ; la toile se voit des deux côtés (par les déchirures). */
function materiauSommets(f: Finition): THREE.MeshStandardMaterial {
  let m = materiauxSommets.get(f);
  if (!m) {
    const [rugosite, metal] = FINITIONS[f];
    m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rugosite, metalness: metal, flatShading: true, side: f === "toile" ? THREE.DoubleSide : THREE.FrontSide });
    materiauxSommets.set(f, m);
  }
  return m;
}

/** Une surface plane où poser une plaque : (u, v) → point 3D, et la direction « dehors ». */
interface Surface {
  point: (u: number, v: number) => THREE.Vector3;
  dehors: THREE.Vector3;
}

function surface(o: THREE.Vector3, eu: THREE.Vector3, ev: THREE.Vector3, dehors: THREE.Vector3): Surface {
  return { point: (u, v) => o.clone().addScaledVector(eu, u).addScaledVector(ev, v), dehors: dehors.clone().normalize() };
}

/** Le sol sous l'épave (u = x, v = z). */
const SOL_PLAT = surface(new V3(0, 0, 0), X, Z, Y);

/** Accumule des pièces par finition, puis les fusionne en un maillage par finition. */
class Assemblage {
  private readonly lots = new Map<Finition, { positions: number[]; couleurs: number[] }>();
  private readonly teinte = new THREE.Color();
  /** Transformation appliquée à tout ce qu'on ajoute : la caisse qui penche, une portière ouverte. */
  repere: THREE.Matrix4 | null = null;

  ajouter(g: THREE.BufferGeometry, couleur: number, finition: Finition = "mat"): void {
    if (this.repere) g.applyMatrix4(this.repere);
    const p = g.getAttribute("position");
    const index = g.getIndex();
    const n = index ? index.count : p.count;
    const lot = this.lot(finition);
    this.teinte.setHex(couleur);
    for (let i = 0; i < n; i++) {
      const k = index ? index.getX(i) : i;
      lot.positions.push(p.getX(k), p.getY(k), p.getZ(k));
      lot.couleurs.push(this.teinte.r, this.teinte.g, this.teinte.b);
    }
    g.dispose();
  }

  /** Des triangles bruts (x, y, z à la suite). */
  triangles(positions: number[], couleur: number, finition: Finition): void {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    this.ajouter(g, couleur, finition);
  }

  boite(couleur: number, finition: Finition, l: number, h: number, p: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): void {
    this.ajouter(placer(new THREE.BoxGeometry(l, h, p), x, y, z, rx, ry, rz), couleur, finition);
  }

  /** Un polygone plat posé sur une surface, un peu décollé : vitre, phare, tache de rouille, plaque de mousse. */
  plaque(points: THREE.Vector2[], s: Surface, couleur: number, finition: Finition = "mat", decalage = 0.008): void {
    const p3 = points.map((q) => s.point(q.x, q.y).addScaledVector(s.dehors, decalage));
    const ab = new V3();
    const ac = new V3();
    const positions: number[] = [];
    for (const t of THREE.ShapeUtils.triangulateShape(points, [])) {
      const [a, b, c] = [p3[t[0]!]!, p3[t[1]!]!, p3[t[2]!]!];
      // Toujours tournée vers le dehors, quel que soit le sens du polygone.
      const ordre = ab.subVectors(b, a).cross(ac.subVectors(c, a)).dot(s.dehors) >= 0 ? [a, b, c] : [a, c, b];
      for (const q of ordre) positions.push(q.x, q.y, q.z);
    }
    this.triangles(positions, couleur, finition);
  }

  maillages(ombre: (m: THREE.Mesh) => THREE.Mesh): THREE.Mesh[] {
    return [...this.lots].map(([f, lot]) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(lot.positions, 3));
      g.setAttribute("color", new THREE.Float32BufferAttribute(lot.couleurs, 3));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, materiauSommets(f));
      if (f !== "sol") return ombre(m);
      m.receiveShadow = true;
      return m;
    });
  }

  private lot(f: Finition): { positions: number[]; couleurs: number[] } {
    let lot = this.lots.get(f);
    if (!lot) {
      lot = { positions: [], couleurs: [] };
      this.lots.set(f, lot);
    }
    return lot;
  }
}

function placer<G extends THREE.BufferGeometry>(g: G, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): G {
  if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
  return g.translate(x, y, z);
}

/** Une rotation (roulis rx, tangage rz) autour d'un point : la caisse qui s'affaisse sur une roue crevée. */
function pivot(px: number, py: number, pz: number, rx: number, rz: number): THREE.Matrix4 {
  return new THREE.Matrix4()
    .makeTranslation(px, py, pz)
    .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, 0, rz)))
    .multiply(new THREE.Matrix4().makeTranslation(-px, -py, -pz));
}

/** Rentre les flancs vers le haut (z réduit de `k` au sommet) : un habitacle n'est pas une boîte. */
function pincer<G extends THREE.BufferGeometry>(g: G, y0: number, h: number, k: number): G {
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * (1 - k * Math.min(1, Math.max(0, (p.getY(i) - y0) / h))));
  return g;
}

/** Cintre une lame : y monte de `fleche` aux extrémités (x = ±demi). */
function courber<G extends THREE.BufferGeometry>(g: G, fleche: number, demi: number): G {
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + fleche * (p.getX(i) / demi) ** 2);
  return g;
}

/** Un rectangle centré (demi-largeurs du, dv). */
function rect(u: number, v: number, du: number, dv: number): THREE.Vector2[] {
  return [V(u - du, v - dv), V(u + du, v - dv), V(u + du, v + dv), V(u - du, v + dv)];
}

/** Un disque à `n` facettes. */
function disque(u: number, v: number, r: number, n: number): THREE.Vector2[] {
  return Array.from({ length: n }, (_, i) => V(u + Math.cos((i / n) * Math.PI * 2) * r, v + Math.sin((i / n) * Math.PI * 2) * r));
}

/** Une tache irrégulière (rouille, mousse, feuille morte, auréole). */
function tache(u: number, v: number, ru: number, rv: number, aleat: () => number, n = 7): THREE.Vector2[] {
  const depart = aleat() * Math.PI * 2;
  return Array.from({ length: n }, (_, i) => {
    const a = depart + (i / n) * Math.PI * 2;
    const r = 0.45 + 0.55 * aleat();
    return V(u + Math.cos(a) * ru * r, v + Math.sin(a) * rv * r);
  });
}

/** Une vitre en trapèze : en bas (v0) de a0 à b0, en haut (v1) de a1 à b1. */
interface Trapeze {
  v0: number;
  v1: number;
  a0: number;
  b0: number;
  a1: number;
  b1: number;
}

function trapeze(t: Trapeze): THREE.Vector2[] {
  return [V(t.a0, t.v0), V(t.b0, t.v0), V(t.b1, t.v1), V(t.a1, t.v1)];
}

/** Ce qui reste d'une vitre brisée : un éclat dentelé pris dans le bas du cadre (jusqu'à `haut` de sa hauteur). */
function eclat(t: Trapeze, haut: number, aleat: () => number): THREE.Vector2[] {
  const v = (f: number) => t.v0 + (t.v1 - t.v0) * f;
  const a = (f: number) => t.a0 + (t.a1 - t.a0) * f;
  const b = (f: number) => t.b0 + (t.b1 - t.b0) * f;
  const fb = haut * (0.4 + 0.6 * aleat());
  const fa = haut * (0.4 + 0.6 * aleat());
  const pts = [V(t.a0, t.v0), V(t.b0, t.v0), V(b(fb), v(fb))];
  const n = 6;
  for (let i = 1; i < n; i++) {
    const f = haut * (i % 2 === 0 ? 0.15 + 0.3 * aleat() : 0.6 + 0.4 * aleat());
    pts.push(V(b(f) + (a(f) - b(f)) * (i / n), v(f)));
  }
  pts.push(V(a(fa), v(fa)));
  return pts;
}

/** Une vitre au hasard : intacte, brisée (un éclat dans le cadre) ou partie ; derrière, l'habitacle sombre. */
function fenetre(c: Assemblage, t: Trapeze, s: Surface, aleat: () => number, partie = false): void {
  const e = partie ? 1 : aleat();
  if (e < 0.3) {
    c.plaque(trapeze(t), s, VERRE, "verre");
    return;
  }
  c.plaque(trapeze(t), s, NUIT, "mat", 0.006);
  if (e < 0.75) c.plaque(eclat(t, 0.3 + aleat() * 0.4, aleat), s, VERRE, "verre", 0.01);
}

/** Un impact étoilé dans un verre feuilleté : des fêlures claires qui rayonnent. */
function etoile(c: Assemblage, s: Surface, u: number, v: number, aleat: () => number): void {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + aleat() * 0.5;
    const l = 0.1 + aleat() * 0.18;
    const du = Math.cos(a);
    const dv = Math.sin(a);
    c.plaque([V(u - dv * 0.01, v + du * 0.01), V(u + du * l, v + dv * l), V(u + dv * 0.01, v - du * 0.01)], s, FISSURE, "verre", 0.012);
  }
}

/** Une roue d'axe z : pneu (aplati et évasé en bas s'il est crevé : `plat`), jante d'acier, moyeu côté dehors (s). */
function roue(c: Assemblage, x: number, z: number, rayon: number, largeur: number, plat: number, jante: number, s: number): void {
  const r = largeur / 2;
  const pneu = new THREE.TorusGeometry(rayon - r, r, 6, 14);
  const p = pneu.getAttribute("position");
  const seuil = -(rayon - plat);
  for (let i = 0; i < p.count; i++) {
    const e = seuil - p.getY(i);
    if (e > 0) {
      p.setY(i, seuil - e * 0.2);
      p.setZ(i, p.getZ(i) * (1 + e * 4));
    }
  }
  const y = rayon - 0.8 * plat;
  c.ajouter(pneu.translate(x, y, z), 0x262524);
  c.ajouter(placer(new THREE.CylinderGeometry(rayon * 0.55, rayon * 0.55, largeur * 0.8, 10), x, y, z, Math.PI / 2), jante, "metal");
  c.ajouter(placer(new THREE.CylinderGeometry(rayon * 0.16, rayon * 0.2, 0.06, 6), x, y, z + s * largeur * 0.42, Math.PI / 2), 0x3a3936, "metal");
}

/** Une touffe d'herbe folle : quelques brins à facettes, verts et secs mêlés. */
function touffe(c: Assemblage, x: number, z: number, aleat: () => number, n: number, haut: number, y = 0): void {
  for (let i = 0; i < n * 2; i++) {
    const h = haut * (0.5 + 0.6 * aleat());
    const brin = new THREE.ConeGeometry(0.04 + aleat() * 0.03, h, 3, 1, true).scale(1, 1, 0.4).translate(0, h / 2, 0);
    c.ajouter(placer(brin, x + (aleat() - 0.5) * 0.3, y, z + (aleat() - 0.5) * 0.3, (aleat() - 0.5) * 0.7, aleat() * 6, (aleat() - 0.5) * 0.7), HERBES[Math.floor(aleat() * 3)]!);
  }
}

/** Une tache de rouille : une auréole orangée, un cœur brun où la tôle est rongée. */
function rouille(c: Assemblage, s: Surface, u: number, v: number, ru: number, rv: number, aleat: () => number): void {
  c.plaque(tache(u, v, ru, rv, aleat, 10), s, PALETTE.rouille, "mat", 0.008);
  c.plaque(tache(u + (aleat() - 0.5) * ru * 0.6, v + (aleat() - 0.5) * rv * 0.6, ru * 0.5, rv * 0.5, aleat, 7), s, ROUILLE_SOMBRE, "mat", 0.01);
  // Quelques piqûres autour.
  for (let i = 0; i < 2; i++) {
    const a = aleat() * Math.PI * 2;
    c.plaque(tache(u + Math.cos(a) * ru * 1.3, v + Math.sin(a) * rv * 1.3, ru * 0.18, rv * 0.18, aleat, 5), s, PALETTE.rouille, "mat", 0.008);
  }
}

/** Un coussin de mousse bombé. */
function bosseMousse(c: Assemblage, x: number, y: number, z: number, r: number, aleat: () => number): void {
  c.ajouter(placer(new THREE.IcosahedronGeometry(r, 0).scale(1.3, 0.3, 1), x, y, z, 0, aleat() * 6, 0), aleat() < 0.65 ? MOUSSE : MOUSSE_CLAIRE);
}

/** La bâche de la benne : une grille de facettes autour des arceaux, affaissée entre eux, crevée sur le dessus. */
function bache(b: Assemblage, couleur: number, bande: number, aleat: () => number): void {
  // Le profil (z, y) de la toile autour d'un arceau, découpé en facettes.
  const coins = [V(-1.27, 1.66), V(-1.27, 2.76), V(-1.15, 2.91), V(1.15, 2.91), V(1.27, 2.76), V(1.27, 1.66)];
  const pts = [coins[0]!];
  [4, 1, 6, 1, 4].forEach((d, k) => {
    for (let i = 1; i <= d; i++) pts.push(coins[k]!.clone().lerp(coins[k + 1]!, i / d));
  });
  const M = pts.length - 1;
  const N = 20;
  const x0 = -3.6;
  const pas = 5.4 / N;
  const centre = V(0, 2.2);
  const grille: THREE.Vector3[][] = [];
  for (let i = 0; i <= N; i++) {
    // La toile pend entre deux arceaux (tous les 5 pas), plus sur le dessus que sur les flancs.
    const creux = Math.sin(Math.PI * ((i % 5) / 5));
    const ligne: THREE.Vector3[] = [];
    for (let j = 0; j <= M; j++) {
      const p = pts[j]!;
      const dedans = centre.clone().sub(p).normalize();
      const d = (j === 0 || j === M ? 0.01 : creux * (p.y > 2.85 ? 0.1 : 0.05)) + (aleat() - 0.5) * 0.035;
      ligne.push(new V3(x0 + i * pas + (aleat() - 0.5) * 0.03, p.y + dedans.y * d, p.x + dedans.x * d));
    }
    grille.push(ligne);
  }
  // Le grand accroc : une ellipse dentelée sur le dessus, qui mord sur le flanc gauche ; un coin arraché à l'arrière.
  const ci = 6 + aleat() * 7;
  const cj = 5.5 + aleat() * 2;
  const ri = 2.3 + aleat();
  const rj = 3.2 + aleat();
  const trou: boolean[][] = [];
  for (let i = 0; i < N; i++) {
    trou.push([]);
    for (let j = 0; j < M; j++) {
      const crevee = ((i + 0.5 - ci) / ri) ** 2 + ((j + 0.5 - cj) / rj) ** 2 < 1 + (aleat() - 0.5) * 1.1;
      trou[i]!.push(crevee || (i < 2 && j >= 12 && j <= 14 && aleat() < 0.7));
    }
  }
  // Les lèvres de la déchirure retombent vers l'intérieur.
  for (let i = 0; i <= N; i++) {
    for (let j = 1; j < M; j++) {
      const voisins = [trou[i - 1]?.[j - 1], trou[i - 1]?.[j], trou[i]?.[j - 1], trou[i]?.[j]].filter((t) => t !== undefined);
      const n = voisins.filter((t) => t).length;
      if (n > 0 && n < voisins.length) {
        const p = pts[j]!;
        const dedans = centre.clone().sub(p).normalize().multiplyScalar(0.1 + aleat() * 0.22);
        grille[i]![j]!.add(new V3(0, dedans.y, dedans.x));
      }
    }
  }
  const teinte = new THREE.Color();
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      if (trou[i]![j]) continue;
      const q = [grille[i]![j]!, grille[i + 1]![j]!, grille[i + 1]![j + 1]!, grille[i]![j + 1]!];
      const positions: number[] = [];
      for (const k of [0, 1, 2, 0, 2, 3]) positions.push(q[k]!.x, q[k]!.y, q[k]!.z);
      // La toile vieillie : la bande de la société sur les flancs, l'ourlet crasseux, le dessus verdi, des nuances par pan.
      const flancs = j === 2 || j === M - 3;
      teinte.setHex(flancs ? bande : j === 0 || j === M - 1 ? CRASSE : couleur);
      if (j >= 5 && j <= M - 6 && aleat() < 0.2) teinte.lerp(new THREE.Color(MOUSSE), 0.25);
      teinte.offsetHSL(0, 0, (aleat() - 0.5) * 0.05);
      b.triangles(positions, teinte.getHex(), "toile");
    }
  }
  // Le pan arraché qui pend sur le flanc, sous l'accroc.
  const haut = pts[Math.max(1, Math.floor(cj - rj * 0.8))]!.y;
  if (haut - 1.75 > 0.3) {
    const xa = x0 + (ci - ri * 0.6) * pas;
    const xb = x0 + (ci + ri * 0.6) * pas;
    const pan = [V(xa, 0), V(xb, 0)];
    for (let i = 1; i < 6; i++) pan.push(V(xb + ((xa - xb) * i) / 6, (haut - 1.75) * (0.55 + 0.45 * aleat())));
    b.plaque(pan, surface(new V3(0, haut, -1.3), X, new V3(0, -1, -0.12), new V3(0, -0.12, -1)), couleur, "toile", 0);
  }
}

export function creerMare(): THREE.Group {
  const groupe = new THREE.Group();
  groupe.position.set(MARE.x, 0, MARE.z);
  // Un contour naturel (rayonMare) : la berge déborde de 0,55 m tout autour.
  const contour = (marge: number) => {
    const forme = new THREE.Shape();
    for (let i = 0; i <= 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const r = rayonMare(angle) + marge;
      // La forme est dessinée dans le plan (x, y) puis couchée : y devient −z, d'où le signe.
      const x = Math.cos(angle) * r;
      const y = -Math.sin(angle) * r;
      if (i === 0) forme.moveTo(x, y);
      else forme.lineTo(x, y);
    }
    return new THREE.ShapeGeometry(forme, 4).rotateX(-Math.PI / 2);
  };
  const berge = new THREE.Mesh(contour(0.55), materiau(PALETTE.terreSombre));
  berge.position.y = 0.01;
  berge.receiveShadow = true;
  const eau = new THREE.Mesh(
    contour(0),
    new THREE.MeshStandardMaterial({ color: 0x3f6f7a, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.88 }),
  );
  eau.position.y = 0.025;
  eau.receiveShadow = true;
  groupe.add(berge, eau);
  // Quelques roseaux
  const aleat = aleatoire(77);
  const roseau = new THREE.ConeGeometry(0.035, 0.9, 3).translate(0, 0.45, 0);
  for (let i = 0; i < 22; i++) {
    const a = aleat() * Math.PI * 2;
    const r = rayonMare(a) - 0.1 + aleat() * 0.6;
    const m = new THREE.Mesh(roseau, materiau(aleat() < 0.5 ? PALETTE.herbeSeche : PALETTE.feuillage));
    m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    m.rotation.z = (aleat() - 0.5) * 0.3;
    m.castShadow = true;
    groupe.add(m);
  }
  return groupe;
}
