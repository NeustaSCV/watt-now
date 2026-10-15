// Les ressources du terrain (bois mort, bûches, pierres, buissons de baies) et la mare.

import * as THREE from "three";
import { MARE, RESTE_EN_PLACE, rayonMare, type RessourceSol } from "../../../commun/src/terrain.ts";
import { PERIODES_FRUITIERS, phaseFruitier, visibleEnSaison } from "../../../commun/src/calendrier.ts";
import { PALETTE, aleatoire, materiau } from "./materiaux.ts";
import { ACIER, Assemblage, BOIS, CORDE, NOIR, ROUILLE_SOMBRE, SOL_PLAT, V, V3, X, Y, Z, bosseler, courber, disque, placer, rect, rouille, surface, tache, touffe, type Surface } from "./assemblage.ts";
import { batterieVoiture, modulePanneau, roueVelo } from "./pieces.ts";
import { frene, haieIfs, ifSombre } from "./essences.ts";
import { fusionnerStatique } from "./fusion.ts";
import { vracPont } from "./ressources-pont.ts";

/**
 * Les modèles partagés des ressources dessinées en lots (lots.ts : une géométrie et un matériau par type, un appel
 * de dessin pour toutes). Faits une fois, à la première demande, avec l'assemblage à couleurs par sommet (2026-10-08) :
 * écorce nuancée, bouts cassés plus clairs, cernes des bûches, lichen sur les pierres.
 */
const modeles = new Map<string, THREE.Mesh>();
function modelePartage(cle: string, construire: (c: Assemblage, aleat: () => number) => void): THREE.Mesh {
  let m = modeles.get(cle);
  if (!m) {
    const c = new Assemblage(cle.length * 17 + cle.charCodeAt(cle.length - 1));
    c.occlusion = 0.12;
    c.forceOcclusion = 0.3;
    construire(c, aleatoire(cle.length * 31 + cle.charCodeAt(0)));
    m = c.maillages()[0]!;
    modeles.set(cle, m);
  }
  const copie = new THREE.Mesh(m.geometry, m.material);
  copie.castShadow = true;
  copie.receiveShadow = true;
  return copie;
}

/** Une branche morte tombée : un bois tordu, deux rameaux, les bouts cassés plus clairs. */
function branche(c: Assemblage): void {
  const ecorce = PALETTE.boisSombre;
  const a = new V3(-0.55, 0.04, 0.02);
  const m = new V3(0.05, 0.06, -0.04);
  const b = new V3(0.55, 0.045, 0.05);
  c.perche(a, m, 0.042, ecorce, "mat", 6, 0.036, 0.08);
  c.perche(m, b, 0.036, ecorce, "mat", 6, 0.026, 0.08);
  c.perche(new V3(-0.15, 0.06, -0.01), new V3(0.18, 0.2, 0.16), 0.02, ecorce, "mat", 5, 0.01);
  c.perche(new V3(0.25, 0.055, 0.0), new V3(0.48, 0.12, -0.2), 0.016, ecorce, "mat", 4, 0.008);
  c.perche(new V3(0.38, 0.05, 0.03), new V3(0.46, 0.09, 0.12), 0.01, ecorce, "mat", 4, 0.005);
  for (const [p, r] of [[a, 0.04], [b, 0.025]] as const) c.ajouter(placer(new THREE.DodecahedronGeometry(r, 0).scale(0.4, 1, 1), p.x, p.y, p.z), 0xb08a5a, "mat");
}

/** Une bûche fendue au carré : écorce striée, cernes clairs aux deux bouts, un moignon de branche. */
function buche(c: Assemblage, aleat: () => number): void {
  const g = bosseler(new THREE.CylinderGeometry(0.11, 0.12, 0.62, 9, 2).rotateZ(Math.PI / 2), 0.008, aleat).translate(0, 0.12, 0);
  c.ajouterDegrade(g, (p) => {
    if (Math.abs(p.x) > 0.305) return BOIS.coupe;
    const a = Math.atan2(p.y - 0.12, p.z);
    return Math.sin(a * 9 + p.x * 4) > 0.55 ? 0x5e4430 : Math.sin(a * 5) > 0.7 ? 0x8a6a48 : PALETTE.bois;
  });
  for (const s of [-1, 1]) {
    c.ajouter(placer(new THREE.CircleGeometry(0.085, 9).rotateY((s * Math.PI) / 2), s * 0.312, 0.12, 0), 0xd9bc8e);
    c.ajouter(placer(new THREE.RingGeometry(0.045, 0.052, 9).rotateY((s * Math.PI) / 2), s * 0.314, 0.12, 0), 0xa8865a);
    c.ajouter(placer(new THREE.CircleGeometry(0.012, 5).rotateY((s * Math.PI) / 2), s * 0.315, 0.12, 0), 0x8a6a48);
  }
  c.perche(new V3(0.05, 0.2, 0.05), new V3(0.12, 0.27, 0.12), 0.022, PALETTE.boisSombre, "mat", 5, 0.016);
}

/** Le tas de bois de chauffage de la station : 10 bûches à chacun (plan 0.8, B3 ; BUTIN_HALTE). */
const TAS_BOIS = 10;

/**
 * Un seau de laiterie en tôle galvanisée (10 L, plan 0.8) : le fût évasé, ses deux nervures, l'anse de fil. Renversé
 * (`renverse`), on le voit par le fond, empilé sur les autres.
 */
function seauGalvanise(c: Assemblage, x: number, y: number, z: number, renverse: boolean): void {
  const zinc = 0xb8bcc0;
  const g = new THREE.CylinderGeometry(0.15, 0.12, 0.26, 14, 1, true);
  if (renverse) g.rotateX(Math.PI);
  c.ajouterDegrade(placer(g, x, y + 0.13, z), (q) => (Math.sin(q.x * 20 + q.z * 13) > 0.7 ? 0xd2d5d6 : zinc), "metal");
  for (const k of [0.06, 0.2]) c.ajouter(placer(new THREE.TorusGeometry(renverse ? 0.123 + k * 0.105 : 0.147 - k * 0.105, 0.006, 3, 14).rotateX(Math.PI / 2), x, y + k, z), 0x9a9ea2, "metal");
  c.ajouter(placer(new THREE.CircleGeometry(0.12, 14).rotateX(renverse ? -Math.PI / 2 : -Math.PI / 2), x, renverse ? y + 0.26 : y + 0.005, z), renverse ? 0xa8acb0 : 0x6e7276, "metal");
  if (!renverse) c.ajouter(placer(new THREE.TorusGeometry(0.15, 0.005, 3, 12, Math.PI).rotateX(-0.3), x, y + 0.26, z), 0x6b6862, "metal");
}

/** Une pierre des champs : bosselée, le dessus plus clair, une tache de lichen. */
function pierre(c: Assemblage, aleat: () => number, sombre: boolean): void {
  const g = bosseler(new THREE.IcosahedronGeometry(0.2, 1), 0.035, aleat).scale(1.2, 0.62, 1).translate(0, 0.09, 0);
  const base = sombre ? PALETTE.pierreSombre : PALETTE.pierre;
  const lichen = new V3((aleat() - 0.5) * 0.2, 0.2, (aleat() - 0.5) * 0.2);
  c.ajouterDegrade(g, (p) => (p.distanceTo(lichen) < 0.08 ? 0xa8a86a : p.y > 0.15 ? new THREE.Color(base).offsetHSL(0, 0, 0.04).getHex() : base));
}

const geoBaie = new THREE.IcosahedronGeometry(0.042, 0);

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
        this.objet.add(modelePartage("branche", branche));
        break;
      case "buche":
        this.objet.add(modelePartage("buche", buche));
        break;
      case "pierre": {
        const sombre = aleat() < 0.5;
        this.objet.add(modelePartage(sombre ? "pierre sombre" : "pierre", (c, a) => pierre(c, a, sombre)));
        break;
      }
      case "velo":
        this.velo(aleat, ombre);
        break;
      case "caisse_outils":
        this.caisseOutils(aleat, ombre);
        break;
      case "batterie_voiture": {
        // La batterie de la vieille voiture, dans l'herbe : celle qu'on posera sur le banc (pieces.ts), crottée.
        const c = new Assemblage(donnees.id);
        c.occlusion = 0.12;
        batterieVoiture(c);
        c.plaque(tache(0, 0, 0.25, 0.18, aleat, 8), SOL_PLAT, 0x4d4a42, "sol", 0.012);
        touffe(c, 0.2, 0.12, aleat, 3, 0.25);
        touffe(c, -0.18, -0.1, aleat, 2, 0.2);
        for (const m of c.maillages(ombre)) this.objet.add(m);
        break;
      }
      case "ressort": {
        // Une lame de ressort de camion : trois lames cintrées, les œils roulés aux bouts, la bride au milieu, la rouille.
        const c = new Assemblage(donnees.id);
        for (let i = 0; i < 3; i++) {
          const lame = courber(new THREE.BoxGeometry(1.1 - i * 0.28, 0.025, 0.07, 6, 1, 1), 0.1, 0.55);
          c.ajouterDegrade(lame.translate(0, 0.0125 + (2 - i) * 0.026, 0), (q) => (Math.sin(q.x * 13 + i) > 0.5 ? PALETTE.rouille : i === 1 ? ROUILLE_SOMBRE : 0x55524d), "metal");
        }
        for (const x of [-0.57, 0.57]) c.ajouter(placer(new THREE.TorusGeometry(0.035, 0.013, 4, 8), x, 0.17, 0), 0x55524d, "metal");
        c.boite(0x3a3836, "metal", 0.09, 0.1, 0.09, 0, 0.06, 0);
        touffe(c, 0.2, 0.1, aleat, 3, 0.3);
        for (const m of c.maillages(ombre)) this.objet.add(m);
        break;
      }
      case "bache": {
        // La bâche pliée, roulée en ballot et ficelée ; un coin défait retombe dans l'herbe.
        const c = new Assemblage(donnees.id);
        c.occlusion = 0.1;
        for (let i = 0; i < 4; i++) c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.56 - i * 0.03, 0.035, 0.4 - i * 0.02, 3, 1, 2), 0.008, aleat), (aleat() - 0.5) * 0.03, 0.02 + i * 0.034, (aleat() - 0.5) * 0.03), i % 2 ? 0x2a6292 : 0x2f6fa4, "toile", 0.03);
        c.plaque([V(0.27, -0.18), V(0.5, -0.24), V(0.46, -0.02), V(0.27, 0.05)], SOL_PLAT, 0x3a74a6, "toile", 0.012);
        for (const x of [-0.15, 0.15]) c.ajouter(placer(new THREE.TorusGeometry(0.21, 0.007, 3, 10).scale(1, 0.38, 1).rotateY(Math.PI / 2), x, 0.08, 0), 0xb59a6a, "mat", 0.04);
        c.ajouter(placer(new THREE.TorusGeometry(0.016, 0.005, 3, 6).rotateX(Math.PI / 2), -0.26, 0.145, -0.18), 0x9a968c, "metal");
        for (const m of c.maillages(ombre)) this.objet.add(m);
        break;
      }
      case "barre_metal": {
        // La barre à mine, rouillée, couchée dans l'herbe : le bout recourbé, l'autre en biseau.
        const c = new Assemblage(donnees.id);
        const tige = new THREE.CylinderGeometry(0.018, 0.018, 0.9, 6, 6).rotateZ(Math.PI / 2).translate(0, 0.02, 0);
        c.ajouterDegrade(tige, (q) => (Math.sin(q.x * 23) + Math.sin(q.x * 61 + q.z * 90) > 0.8 ? PALETTE.rouille : 0x5c5953), "metal");
        c.perche(new V3(0.45, 0.02, 0), new V3(0.53, 0.02, 0.06), 0.018, 0x5c5953, "metal", 6);
        c.perche(new V3(0.53, 0.02, 0.06), new V3(0.53, 0.02, 0.12), 0.016, ROUILLE_SOMBRE, "metal", 6, 0.01);
        touffe(c, -0.1, 0.05, aleat, 3, 0.28);
        for (const m of c.maillages(ombre)) this.objet.add(m);
        break;
      }
      case "buisson": {
        // Un roncier de mûres : des lobes de feuillage bosselés, nuancés, quelques tiges ; les baies en grappes.
        const c = new Assemblage(donnees.id);
        c.occlusion = 0.35;
        c.forceOcclusion = 0.35;
        const lobes: [number, number, number, number][] = [[0, 0.38, 0, 0.5], [0.32, 0.28, 0.12, 0.34], [-0.3, 0.26, -0.1, 0.36], [0.05, 0.3, -0.32, 0.32], [-0.08, 0.6, 0.06, 0.3]];
        for (const [x, y, z, r] of lobes) {
          const g = bosseler(new THREE.IcosahedronGeometry(r, 1), r * 0.12, aleat).scale(1, 0.78, 1);
          c.ajouter(placer(g, x, y, z, aleat(), aleat(), 0), [PALETTE.feuillageSombre, 0x4a7a40, 0x3a6236][Math.floor(aleat() * 3)]!, "mat", 0.05);
        }
        for (let i = 0; i < 5; i++) {
          const a = aleat() * Math.PI * 2;
          c.perche(new V3(0, 0, 0), new V3(Math.cos(a) * 0.55, 0.3 + aleat() * 0.3, Math.sin(a) * 0.55), 0.012, 0x5a3a3a, "mat", 4, 0.006);
        }
        for (const m of c.maillages(ombre)) this.objet.add(m);
        const baies = new THREE.Group();
        const mures = materiau(0x3a1a2a, { rugosite: 0.35 });
        const rouges = materiau(0xb3243a, { rugosite: 0.4 });
        for (let i = 0; i < 7; i++) {
          const l = lobes[i % lobes.length]!;
          const a = aleat() * Math.PI * 2;
          const h = (aleat() - 0.3) * 0.8;
          const rh = Math.sqrt(Math.max(0, 1 - h * h)) * l[3] * 1.02;
          for (let k = 0; k < 3; k++) {
            const b = new THREE.Mesh(geoBaie, k === 2 ? rouges : mures);
            b.position.set(l[0] + Math.cos(a) * rh + (k - 1) * 0.04, l[1] + h * l[3] * 0.78 - (k % 2) * 0.03, l[2] + Math.sin(a) * rh);
            baies.add(b);
          }
        }
        this.objet.add(baies);
        this.contenu = baies;
        break;
      }
      case "joncs": {
        // Des moignons au ras de l'eau restent toujours ; les feuilles en lame et les épis de massette repoussent.
        const souche = new Assemblage(donnees.id);
        for (let i = 0; i < 12; i++) {
          const a = aleat() * Math.PI * 2;
          const r = 0.22 * aleat();
          souche.perche(new V3(Math.cos(a) * r, 0, Math.sin(a) * r), new V3(Math.cos(a) * r, 0.1 + aleat() * 0.05, Math.sin(a) * r), 0.018, 0x6f7a45, "mat", 4, 0.012);
        }
        souche.plaque(tache(0, 0, 0.35, 0.3, aleat, 8), SOL_PLAT, 0x4a4632, "sol", 0.01);
        for (const m of souche.maillages(ombre)) this.objet.add(m);
        const t = new Assemblage(donnees.id + 1);
        t.occlusion = 0.4;
        t.forceOcclusion = 0.3;
        for (let i = 0; i < 18; i++) {
          const h = 0.75 + aleat() * 0.65;
          const a = aleat() * Math.PI * 2;
          const r = 0.25 * aleat();
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r;
          // Une feuille en lame : deux triangles, la pointe qui s'incline au vent.
          const penche = new V3((aleat() - 0.5) * 0.35, 0, (aleat() - 0.5) * 0.35);
          const o = aleat() * Math.PI;
          const l = 0.025 + aleat() * 0.015;
          const dx = Math.cos(o) * l;
          const dz = Math.sin(o) * l;
          const milieu = new V3(x + penche.x * 0.4, h * 0.55, z + penche.z * 0.4);
          const pointe = new V3(x + penche.x, h, z + penche.z);
          const pos = [x - dx, 0, z - dz, x + dx, 0, z + dz, milieu.x + dx * 0.7, milieu.y, milieu.z + dz * 0.7, x - dx, 0, z - dz, milieu.x + dx * 0.7, milieu.y, milieu.z + dz * 0.7, milieu.x - dx * 0.7, milieu.y, milieu.z - dz * 0.7, milieu.x - dx * 0.7, milieu.y, milieu.z - dz * 0.7, milieu.x + dx * 0.7, milieu.y, milieu.z + dz * 0.7, pointe.x, pointe.y, pointe.z];
          t.triangles(pos, [0x6f8b4e, 0x7f9a55, 0x5f7a40, 0x9aa65e][i % 4]!, "toile", 0.04);
          // Quelques massettes : une tige droite, l'épi brun velouté, la pointe sèche.
          if (i % 4 === 0) {
            const tige = new V3(x * 0.8, h + 0.15, z * 0.8);
            t.perche(new V3(x, 0, z), tige, 0.008, 0x7f9a55, "mat", 4);
            t.perche(tige.clone().add(new V3(0, -0.2, 0)), tige, 0.034, 0x6b4a2e, "mat", 6, 0.032, 0.05);
            t.perche(tige, tige.clone().add(new V3(0, 0.12, 0)), 0.006, 0x9a8a5a, "mat", 3, 0.002);
          }
        }
        const tiges = t.groupe(ombre);
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
      // Les essences du métier (Book 25 §3.2) : ce qu'on coupe (perches, branche droite) revient à la repousse.
      case "frene":
      case "if_bois":
      case "coop_ifs": {
        const m = donnees.type === "frene" ? frene(aleat, ombre) : donnees.type === "if_bois" ? ifSombre(aleat, ombre) : haieIfs(aleat, ombre);
        // La haie longe la façade des bureaux : elle ne tourne pas.
        if (donnees.type === "coop_ifs") this.objet.rotation.y = 0;
        this.objet.add(m.groupe);
        this.contenu = m.contenu;
        break;
      }
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
        // L'établi métallique de l'atelier : plateau de tôle, pieds en cornière, tiroirs (dont un ouvert), l'étau
        // bleu ; les chutes de barre posées dessus sont ce qu'on vient chercher.
        this.objet.rotation.y = 0;
        const c = new Assemblage(donnees.id);
        c.occlusion = 0.45;
        const gris = 0x6e6a63;
        c.boite(0x5c5953, "metal", 1.8, 0.05, 0.7, 0, 0.88, 0);
        for (const [x, z] of [[-0.85, -0.3], [0.85, -0.3], [-0.85, 0.3], [0.85, 0.3]] as const) c.boite(gris, "metal", 0.05, 0.86, 0.05, x, 0.43, z);
        c.boite(gris, "metal", 1.7, 0.04, 0.04, 0, 0.15, 0.3);
        c.boite(gris, "metal", 1.7, 0.04, 0.04, 0, 0.15, -0.3);
        c.boite(0x77746c, "tole", 1.7, 0.02, 0.62, 0, 0.17, 0);
        // Le bloc-tiroirs sous le plateau, à droite.
        c.boite(0x4a5a6a, "tole", 0.5, 0.6, 0.6, 0.55, 0.55, 0);
        for (let k = 0; k < 3; k++) {
          const y = 0.73 - k * 0.19;
          const ouvert = k === 1 ? 0.18 : 0;
          c.boite(0x56687a, "tole", 0.46, 0.16, 0.03, 0.55, y, 0.3 + ouvert);
          c.boite(0xa8a59c, "metal", 0.14, 0.02, 0.02, 0.55, y + 0.03, 0.32 + ouvert);
          if (ouvert) c.boite(0x2a2826, "mat", 0.44, 0.1, 0.18, 0.55, y + 0.02, 0.3 + ouvert / 2);
        }
        rouille(c, surface(new V3(0, 0.906, 0), X, Z, Y), -0.4 + aleat() * 0.3, (aleat() - 0.5) * 0.3, 0.2, 0.12, aleat);
        // L'étau bleu, vissé au bord gauche.
        c.boite(0x2f6fa4, "metal", 0.16, 0.08, 0.22, -0.6, 0.95, 0.22);
        c.boite(0x2f6fa4, "metal", 0.16, 0.12, 0.05, -0.6, 1.03, 0.12);
        c.boite(0x2f6fa4, "metal", 0.16, 0.12, 0.05, -0.6, 1.03, 0.3);
        c.perche(new V3(-0.6, 0.98, 0.33), new V3(-0.6, 0.98, 0.5), 0.012, 0xa8a59c, "metal", 5);
        c.perche(new V3(-0.68, 0.98, 0.5), new V3(-0.52, 0.98, 0.5), 0.01, 0xa8a59c, "metal", 5);
        for (const m of c.maillages(ombre)) this.objet.add(m);
        const chutes = new Assemblage(donnees.id + 1);
        for (let i = 0; i < 3; i++) {
          const tige = new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6, 4).rotateZ(Math.PI / 2);
          chutes.ajouterDegrade(placer(tige, 0.1, 0.93, -0.15 + i * 0.12, 0, (aleat() - 0.5) * 0.3, 0), (q) => (Math.sin(q.x * 19 + i * 2) > 0.6 ? PALETTE.rouille : 0x6e6a63), "metal");
        }
        const g = chutes.groupe(ombre);
        this.objet.add(g);
        this.contenu = g;
        break;
      }
      case "grenier": {
        // La potence de la grange : un poteau équarri, son bras et la jambe de force, la poulie, la corde qui pend
        // et son rouleau au pied (la corde est ce qu'on vient chercher).
        this.objet.rotation.y = 0;
        const c = new Assemblage(donnees.id);
        c.occlusion = 0.5;
        c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.22, 3.2, 0.22, 1, 4, 1), 0.01, aleat), 0, 1.6, 0), PALETTE.boisSombre, "mat", 0.07);
        c.ajouter(placer(bosseler(new THREE.BoxGeometry(1.25, 0.18, 0.18, 4, 1, 1), 0.008, aleat), 0.52, 3.1, 0), PALETTE.boisSombre, "mat", 0.07);
        c.perche(new V3(0.08, 2.45, 0), new V3(0.62, 3.02, 0), 0.06, BOIS.sombre, "mat", 4);
        for (const y of [2.45, 3.05]) c.boite(0x3a3836, "metal", 0.24, 0.05, 0.24, 0, y, 0);
        // La poulie : chape de fer, réa, axe.
        c.boite(0x3a3836, "metal", 0.04, 0.22, 0.12, 1.0, 2.96, 0);
        c.ajouter(placer(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 12).rotateX(Math.PI / 2), 1.0, 2.88, 0), 0x55524d, "metal", 0.04);
        c.ajouter(placer(new THREE.TorusGeometry(0.13, 0.02, 4, 12), 1.0, 2.88, 0), PALETTE.rouille, "metal");
        // Une pierre d'ancrage au pied du poteau, de l'herbe haute.
        for (let i = 0; i < 3; i++) {
          const a = aleat() * Math.PI * 2;
          c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.12, 0), 0.02, aleat).scale(1.2, 0.6, 1), Math.cos(a) * 0.22, 0.04, Math.sin(a) * 0.22), PALETTE.pierreSombre, "mat", 0.06);
        }
        touffe(c, 0.15, 0.15, aleat, 4, 0.5);
        touffe(c, -0.15, -0.1, aleat, 3, 0.4);
        for (const m of c.maillages(ombre)) this.objet.add(m);
        const corde = new Assemblage(donnees.id + 1);
        corde.perche(new V3(1.13, 2.88, 0), new V3(1.12, 0.3, 0.02), 0.018, CORDE, "mat", 4, 0.018, 0.04);
        corde.perche(new V3(0.87, 2.88, 0), new V3(0.88, 2.2, 0), 0.018, CORDE, "mat", 4, 0.018, 0.04);
        for (let k = 0; k < 3; k++) corde.ajouter(placer(new THREE.TorusGeometry(0.2 - k * 0.03, 0.045, 4, 12).rotateX(Math.PI / 2), 1.12, 0.05 + k * 0.07, 0.1), CORDE, "mat", 0.05);
        const g = corde.groupe(ombre);
        this.objet.add(g);
        this.contenu = g;
        break;
      }
      // Le butin de la Coopérative (Book 23) : le décor (comptoir, rayonnages, établi, coffre) est dessiné par le lieu ;
      // ici, seulement ce qu'on vient prendre, qui disparaît une fois pris et revient avec le temps.
      case "coop_caisse":
      case "coop_rayon":
      case "coop_palettes":
      case "coop_etabli":
      case "coop_rayonnage":
      case "coop_coffre":
      case "coop_caisse_froide": {
        this.objet.rotation.y = (aleat() - 0.5) * 0.6;
        const c = new Assemblage(donnees.id);
        c.occlusion = 0.4;
        const t = donnees.type;
        if (t === "coop_caisse") {
          // Un carton glissé sous le comptoir, un manche d'acier qui dépasse.
          c.boite(0x9a7a52, "mat", 0.5, 0.28, 0.36, 0, 0.14, 0);
          c.boite(0x3a3d42, "metal", 0.62, 0.04, 0.04, 0.12, 0.3, 0.05, 0, 0, 0.2);
        } else if (t === "coop_rayon") {
          for (let i = 0; i < 4; i++) c.boite(i % 2 ? 0xc8a24a : 0x8f3a2e, "metal", 0.09, 0.12, 0.09, -0.18 + i * 0.12, 0.06, (aleat() - 0.5) * 0.1);
        } else if (t === "coop_palettes") {
          c.boite(0xc9b48a, "mat", 0.8, 0.12, 0.6, 0, 0.06, 0);
          c.boite(0x6a7a3a, "mat", 0.5, 0.18, 0.4, 0, 0.21, 0);
        } else if (t === "coop_etabli") {
          c.boite(0xa83a2a, "metal", 0.5, 0.22, 0.24, 0, 0.11, 0);
          c.boite(0x2a2826, "metal", 0.3, 0.04, 0.04, 0, 0.25, 0);
        } else if (t === "coop_rayonnage") {
          c.boite(0xd8cfb4, "mat", 0.5, 0.2, 0.75, 0, 0.1, 0);
          c.boite(0x2e5c8a, "mat", 0.42, 0.14, 0.42, 0.05, 0.27, 0);
        } else if (t === "coop_caisse_froide") {
          // La laiterie (plan 0.8, I8) : sur une caisse de bois, une pile de seaux galvanisés renversés, et un autre
          // debout à côté, son anse couchée. Pris, il ne reste que la caisse (laiterie(), toujours là).
          for (let k = 0; k < 3; k++) seauGalvanise(c, -0.12, 0.42 + k * 0.07, 0, true);
          seauGalvanise(c, 0.26, 0.42, 0.04, false);
        }
        const g = c.groupe(ombre);
        if (t === "coop_caisse_froide") this.laiterie(ombre);
        this.objet.add(g);
        this.contenu = g;
        break;
      }
      // ---------- Le niveau 1 (plan 0.8, chantier 10) : la ruine, la station, la Coopérative ----------
      case "ruine_bidon":
        this.bidonRuine(aleat, ombre);
        break;
      case "piece_enclume":
        this.enclumeEtCharbon(aleat, ombre);
        break;
      case "piece_alternateur":
        this.alternateurSurEtabli(ombre);
        break;
      case "tas_bois":
        this.tasDeBois(aleat, ombre);
        break;
      case "coop_grillage":
        this.rouleauGrillage(aleat, ombre);
        break;
      case "coop_cocotte":
        this.cocotte(ombre);
        break;
      case "coop_batterie": {
        // La batterie du tracteur rouge (Book 23 §4.7), sanglée sur son garde-boue droit (le tracteur est tourné de
        // 0,15 rad, son repère est à 8 cm du sol) : prise, il ne reste que le berceau vide (rendu/cooperative.ts).
        this.objet.rotation.y = 0.15;
        const c = new Assemblage(donnees.id);
        c.boite(0x232220, "mat", 0.3, 0.2, 0.2, 0, 1.53, 0);
        c.ajouter(placer(new THREE.CylinderGeometry(0.024, 0.024, 0.04, 8), -0.08, 1.65, 0), 0xd42a20, "metal");
        c.ajouter(placer(new THREE.CylinderGeometry(0.024, 0.024, 0.04, 8), 0.08, 1.65, 0), 0x2a2826, "metal");
        c.boite(0xd8b52a, "mat", 0.16, 0.06, 0.006, 0, 1.53, 0.105);
        // La sangle par-dessus, et le câble rouge qui file vers le klaxon.
        c.boite(0x2a2826, "mat", 0.03, 0.012, 0.22, 0.04, 1.636, 0);
        c.perche(new V3(-0.08, 1.67, 0), new V3(-0.2, 1.62, -0.5), 0.012, 0xd42a20, "mat", 4);
        for (const m of c.maillages(ombre)) this.objet.add(m);
        break;
      }
      // 0.10, chantier H : le vrac de la route du pont (rendu/ressources-pont.ts) ; le reste est dessiné par le modèle.
      case "pont_cuivre":
      case "pont_resistances":
      case "pont_cellules":
      case "pont_huile":
        for (const m of vracPont(donnees.type, donnees.id, aleat, ombre)) this.objet.add(m);
        break;
    }
    // Ce qu'on montre ou cache à part (fruits, fleurs, contenu fouillé) reste un groupe à part, même fusionné.
    for (const g of [this.contenu, this.fleurs, this.verts]) if (g) g.userData.garder = true;
    this.disponible(donnees.disponible);
  }

  disponible(oui: boolean): void {
    this.donnees.disponible = oui;
    this.majVisibilite();
  }

  /** Un point semé au hasard reparaît ailleurs (plan 0.9) : il y va ; renvoie de combien il a bougé (pour ses lots). */
  deplacer(x: number, z: number): { dx: number; dz: number } {
    const de = { dx: x - this.donnees.x, dz: z - this.donnees.z };
    this.donnees.x = x;
    this.donnees.z = z;
    this.objet.position.set(x, 0, z);
    this.objet.updateMatrixWorld(true);
    return de;
  }

  /** Un butin personnel à plusieurs prises (le tas de bois) : ce qu'il en reste pour moi (plan 0.8, chantier 10). */
  reste(n: number | undefined): void {
    if (n === undefined) return;
    this.donnees.reste = n;
    this.majVisibilite();
  }

  /**
   * Les bûches du tas de bois, en un seul appel de dessin : une instance par bûche, de la première posée (en bas) à la
   * dernière (en haut, la première qu'on prend) ; on n'en dessine que ce qu'il reste.
   */
  private buchesDuTas: THREE.InstancedMesh | null = null;

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
      // Le tas de bois : autant de bûches qu'il m'en reste.
      if (this.buchesDuTas) this.buchesDuTas.count = oui ? Math.min(TAS_BOIS, this.donnees.reste ?? TAS_BOIS) : 0;
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

  /**
   * Le vieux vélo couché dans l'herbe (moment-vitrine n° 3, tutoriel ét. 5) : cadre en losange à la peinture bleu canard
   * mangée de rouille, roues à rayons (la même que sur le pédalier), guidon, selle fendue, pédalier et chaîne ;
   * l'herbe a poussé à travers les rayons.
   */
  private velo(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    const c = new Assemblage(this.donnees.id);
    // On le monte debout (plan x, y ; roues d'axe z), puis on le couche sur le flanc, appuyé sur la pédale.
    c.repere = new THREE.Matrix4().makeTranslation(0, 0.07, 0).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2 + 0.16)).multiply(new THREE.Matrix4().makeTranslation(0, -0.36, 0));
    const peinture = 0x4d6a7a;
    const arriere = new V3(-0.52, 0.34, 0);
    const avant = new V3(0.55, 0.34, 0);
    const pedalier = new V3(-0.05, 0.3, 0);
    const selle = new V3(-0.2, 0.82, 0);
    const douille = new V3(0.42, 0.78, 0);
    const douilleBas = new V3(0.45, 0.64, 0);
    const tube = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
      const d = b.clone().sub(a);
      const g = new THREE.CylinderGeometry(r, r, d.length(), 6, 4).translate(0, d.length() / 2, 0);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, d.normalize())).translate(a.x, a.y, a.z);
      c.ajouterDegrade(g, (q) => (Math.sin(q.x * 17 + q.y * 11) + Math.sin(q.x * 41 - q.y * 23) > 0.6 ? PALETTE.rouille : peinture), "tole");
    };
    tube(pedalier, selle, 0.02);
    tube(selle.clone().add(new V3(0.01, -0.05, 0)), douille, 0.018);
    tube(pedalier, douilleBas, 0.022);
    tube(douilleBas, douille.clone().add(new V3(-0.01, 0.06, 0)), 0.024);
    for (const s of [-1, 1]) {
      tube(pedalier.clone().setZ(s * 0.03), arriere.clone().setZ(s * 0.05), 0.011);
      tube(selle.clone().add(new V3(0, -0.06, s * 0.02)), arriere.clone().setZ(s * 0.05), 0.01);
      tube(douilleBas.clone().setZ(s * 0.03), avant.clone().setZ(s * 0.05), 0.013);
    }
    for (const centre of [arriere, avant]) {
      c.repere = c.repere!.clone().multiply(new THREE.Matrix4().makeTranslation(centre.x, centre.y, centre.z));
      roueVelo(c, 0.33, 0x2b2b2b, aleat() < 0.5 ? ROUILLE_SOMBRE : 0x9a968c);
      c.repere = c.repere.clone().multiply(new THREE.Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z));
    }
    c.perche(selle, selle.clone().add(new V3(-0.01, 0.09, 0)), 0.013, ACIER, "metal", 5);
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.24, 0.05, 0.12, 2, 1, 1), 0.008, aleat), selle.x - 0.02, selle.y + 0.11, 0), 0x2b2622, "mat", 0.04);
    c.perche(douille.clone().add(new V3(-0.01, 0.06, 0)), douille.clone().add(new V3(0.05, 0.13, 0)), 0.013, ACIER, "metal", 5);
    c.perche(douille.clone().add(new V3(0.05, 0.13, -0.24)), douille.clone().add(new V3(0.05, 0.13, 0.24)), 0.012, ACIER, "metal", 5);
    for (const s of [-1, 1]) c.perche(douille.clone().add(new V3(0.05, 0.13, s * 0.17)), douille.clone().add(new V3(0.05, 0.13, s * 0.26)), 0.019, NOIR, "mat", 6);
    c.ajouter(placer(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 12).rotateX(Math.PI / 2), pedalier.x, pedalier.y, 0.04), 0x55524d, "metal");
    for (const s of [-1, 1]) {
      c.boite(0x77746c, "metal", 0.025, 0.16, 0.012, pedalier.x + s * 0.03, pedalier.y - s * 0.07, s * 0.065, 0, 0, s * 0.4);
      c.boite(0x2b2b2b, "mat", 0.09, 0.02, 0.06, pedalier.x + s * 0.06, pedalier.y - s * 0.14, s * 0.1);
    }
    for (const [d0, d1] of [[0.09, 0.04], [-0.09, -0.04]] as const) c.perche(pedalier.clone().add(new V3(0, d0, 0.04)), arriere.clone().add(new V3(0, d1, 0.04)), 0.005, ROUILLE_SOMBRE, "metal", 3);
    c.repere = null;
    // Au sol : l'herbe tassée sous le vélo, et des touffes qui passent à travers les rayons.
    c.plaque(tache(0, 0, 0.85, 0.45, aleat, 10), SOL_PLAT, 0x5f7f45, "sol", 0.008);
    for (const [x, z] of [[-0.52, 0.05], [0.55, 0.0], [0.1, 0.25], [-0.3, -0.3]] as const) touffe(c, x, z, aleat, 4, 0.4);
    for (const m of c.maillages(ombre)) this.objet.add(m);
  }

  /** La caisse à outils de la ferme : tôle rouge passée, couvercle à charnière, poignée, fermoirs ; une clé et un tournevis à côté. */
  // ---------- Le niveau 1 (plan 0.8, chantier 10) ----------

  /** Le bidon de 5 L de la ruine : plastique blanc jauni, bouchon rouge, couché à moitié sous une poutre tombée. */
  private bidonRuine(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = 0.5;
    const c = new Assemblage(this.donnees.id);
    c.occlusion = 0.3;
    // Le corps : une boîte arrondie (bosselée), couché sur le flanc ; la poignée moulée, le goulot et son bouchon.
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.19, 0.27, 0.13, 2, 3, 2), 0.006, aleat), 0, 0.068, 0, 0, 0, Math.PI / 2 - 0.08), 0xe6e0cf, "mat", 0.04);
    c.ajouter(placer(new THREE.TorusGeometry(0.035, 0.012, 4, 8, Math.PI), -0.07, 0.15, 0, 0, 0, -Math.PI / 2 + 0.1), 0xe6e0cf, "mat");
    c.ajouter(placer(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 8).rotateZ(Math.PI / 2), 0.15, 0.11, 0), 0xd8d2c0, "mat");
    c.ajouter(placer(new THREE.CylinderGeometry(0.026, 0.026, 0.025, 8).rotateZ(Math.PI / 2), 0.175, 0.11, 0), 0xc8362b, "mat");
    // Une étiquette délavée, de la terre sur le flanc.
    c.boite(0xb9c4cf, "mat", 0.004, 0.08, 0.1, -0.01, 0.07, 0.066, Math.PI / 2, 0, 0);
    c.plaque(tache(0.02, 0.03, 0.14, 0.09, aleat, 7), SOL_PLAT, 0x5a4a38, "sol", 0.01);
    // La poutre tombée qui le coince.
    c.perche(new V3(-0.45, 0.16, -0.18), new V3(0.4, 0.05, -0.12), 0.06, BOIS.sombre, "mat", 5, 0.055);
    touffe(c, 0.22, -0.1, aleat, 3, 0.22);
    for (const m of c.maillages(ombre)) this.objet.add(m);
  }

  /**
   * La pièce du Charbonnier (plan 0.8 §2.5) : sous l'établi de bois du garage (dessiné par la halte), l'enclume de
   * dépanneur posée sur un billot bas (le vert d'atelier écaillé, la table polie), et le sac de charbon entamé à côté,
   * quelques morceaux tombés.
   */
  private enclumeEtCharbon(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = 0;
    const c = new Assemblage(this.donnees.id);
    c.occlusion = 0.4;
    const [x, z] = [-0.2, -0.22];
    // Le billot.
    c.ajouter(placer(bosseler(new THREE.CylinderGeometry(0.15, 0.16, 0.16, 8), 0.006, aleat), x, 0.08, z), BOIS.ecorce, "mat", 0.05);
    c.ajouter(placer(new THREE.CircleGeometry(0.145, 8).rotateX(-Math.PI / 2), x, 0.161, z), BOIS.coupe, "mat");
    // L'enclume : pied, taille, table, bigorne, talon (comme sur le foyer de forge, metier/forge.ts).
    const vert = 0x3d5a46;
    c.boite(vert, "metal", 0.22, 0.05, 0.16, x, 0.185, z);
    c.boite(vert, "metal", 0.12, 0.08, 0.09, x, 0.25, z);
    c.boite(0x45423f, "metal", 0.3, 0.06, 0.11, x, 0.32, z);
    c.ajouter(placer(new THREE.ConeGeometry(0.045, 0.16, 6).rotateZ(Math.PI / 2), x + 0.23, 0.325, z), 0x45423f, "metal");
    c.boite(0x45423f, "metal", 0.05, 0.05, 0.09, x - 0.17, 0.32, z);
    c.boite(0xa9aaa6, "metal", 0.28, 0.005, 0.09, x, 0.352, z);
    for (const [dx, dy] of [[-0.05, 0.26], [0.04, 0.19], [0.09, 0.24]] as const) c.boite(PALETTE.rouille, "mat", 0.03, 0.02, 0.002, x + dx, dy, z + 0.081);
    // Le sac de charbon : un sac de papier kraft affaissé, ouvert, le haut roulé ; du charbon noir qui dépasse.
    const [sx, sz] = [0.3, -0.12];
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.26, 0.3, 0.16, 2, 3, 2), 0.02, aleat), sx, 0.15, sz, 0.12, 0.3, -0.08), 0xa98a5c, "toile", 0.05);
    c.boite(0xc8362b, "mat", 0.2, 0.06, 0.002, sx + 0.02, 0.17, sz + 0.075, 0, 0.3, -0.08);
    for (let k = 0; k < 6; k++) c.ajouter(placer(bosseler(new THREE.DodecahedronGeometry(0.03, 0), 0.008, aleat), sx - 0.06 + aleat() * 0.12, 0.3 + aleat() * 0.03, sz - 0.03 + aleat() * 0.06), 0x1c1b1a, "mat", 0.04);
    for (let k = 0; k < 4; k++) c.ajouter(placer(bosseler(new THREE.DodecahedronGeometry(0.025, 0), 0.008, aleat), sx + 0.18 + aleat() * 0.15, 0.02, sz + 0.05 + aleat() * 0.12), 0x1c1b1a, "mat", 0.04);
    c.plaque(tache(sx + 0.15, sz + 0.12, 0.16, 0.1, aleat, 7), SOL_PLAT, 0x2b2a28, "sol", 0.006);
    for (const m of c.maillages(ombre)) this.objet.add(m);
  }

  /**
   * La pièce du Mécaniste (plan 0.8 §2.5) : sur l'établi de la voiture éventrée (dessinés par la halte), le petit
   * alternateur sorti du moteur, couché sur un chiffon gras, sa poulie vers nous ; une clé de 13 et deux écrous à côté.
   */
  private alternateurSurEtabli(ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = 0;
    const c = new Assemblage(this.donnees.id);
    c.occlusion = 0.25;
    const y = 0.93;
    const alu = 0xb9bcbc;
    c.boite(0x6a5a44, "toile", 0.32, 0.006, 0.24, 0.02, y, -0.06, 0, 0.3, 0);
    // Le carter à ailettes, couché (l'axe vers nous), ses pattes de fixation.
    c.ajouter(placer(new THREE.CylinderGeometry(0.075, 0.075, 0.13, 12).rotateX(Math.PI / 2), 0, y + 0.078, -0.07), alu, "metal");
    for (let k = 0; k < 4; k++) c.ajouter(placer(new THREE.TorusGeometry(0.076, 0.004, 3, 12), 0, y + 0.078, -0.12 + k * 0.033), 0x6b6862, "metal");
    for (const s of [-1, 1]) c.boite(alu, "metal", 0.03, 0.03, 0.05, s * 0.07, y + 0.14, -0.07);
    // La poulie et son ventilateur, devant.
    c.ajouter(placer(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10).rotateX(Math.PI / 2), 0, y + 0.078, 0.01), ACIER, "metal");
    for (let k = 0; k < 6; k++) {
      const t = (k / 6) * Math.PI * 2;
      c.boite(0x3a3836, "metal", 0.05, 0.014, 0.004, Math.cos(t) * 0.04, y + 0.078 + Math.sin(t) * 0.04, 0.0, 0, 0, t + 0.5);
    }
    // La borne rouge, derrière ; un bout de fil coupé.
    c.ajouter(placer(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 6).rotateX(Math.PI / 2), 0.03, y + 0.1, -0.15), 0xc8362b, "mat");
    c.perche(new V3(0.03, y + 0.1, -0.16), new V3(0.12, y + 0.01, -0.2), 0.005, 0xc8362b, "mat", 4);
    // La clé et deux écrous.
    c.boite(ACIER, "metal", 0.16, 0.006, 0.02, -0.2, y + 0.003, 0.03, 0, 0.6, 0);
    for (const dx of [0.17, 0.2]) c.ajouter(placer(new THREE.CylinderGeometry(0.01, 0.01, 0.008, 6), dx, y + 0.004, 0.04), 0x8a8780, "metal");
    for (const m of c.maillages(ombre)) this.objet.add(m);
  }

  /**
   * Le bois de chauffage de la station (B3), derrière l'atelier : dix bûches rangées en pyramide sur deux perches, entre
   * deux piquets. Chacun voit son tas ; il baisse d'une bûche à chaque prise (le haut d'abord), et se refait en 6 h.
   */
  private tasDeBois(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = 0;
    const c = new Assemblage(this.donnees.id);
    c.occlusion = 0.3;
    // Les deux perches au sol (les bûches ne touchent pas la terre), les piquets aux bouts, des copeaux.
    for (const z of [0.18, 0.55]) c.perche(new V3(-0.62, 0.04, z), new V3(0.62, 0.04, z), 0.035, BOIS.ecorce, "mat", 5);
    for (const x of [-0.6, 0.6]) c.perche(new V3(x, 0, 0.36), new V3(x * 1.04, 0.95, 0.38), 0.03, BOIS.gris, "mat", 5, 0.025);
    for (let k = 0; k < 10; k++) c.boite(BOIS.coupe, "mat", 0.05, 0.008, 0.03, -0.7 + aleat() * 1.4, 0.004, -0.2 + aleat() * 0.25, 0, aleat() * 3, 0);
    c.plaque(tache(0, 0, 0.75, 0.22, aleat, 9), SOL_PLAT, 0x5a4632, "sol", 0.006);
    for (const m of c.maillages(ombre)) this.objet.add(m);
    // Les bûches : 4, puis 3, 2 et 1, couchées vers le mur (l'axe selon z).
    const modele = modelePartage("buche", buche);
    const tas = new THREE.InstancedMesh(modele.geometry, modele.material, TAS_BOIS);
    tas.castShadow = true;
    tas.receiveShadow = true;
    const m = new THREE.Matrix4();
    let k = 0;
    [4, 3, 2, 1].forEach((n, r) => {
      for (let i = 0; i < n; i++) {
        m.makeRotationY(Math.PI / 2 + (aleat() - 0.5) * 0.12).setPosition((i - (n - 1) / 2) * 0.25, 0.06 + r * 0.205, 0.36 + (aleat() - 0.5) * 0.06);
        tas.setMatrixAt(k++, m);
      }
    });
    tas.computeBoundingSphere();
    tas.userData.garder = true;
    this.objet.add(tas);
    this.buchesDuTas = tas;
  }

  /** La clé du foyer de cuisine (L1A) : un rouleau de grillage à poules neuf, debout contre un piquet du parc. */
  private rouleauGrillage(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = 0.4;
    const c = new Assemblage(this.donnees.id);
    c.occlusion = 0.2;
    // Le rouleau : 1 m de haut, ses spires de maille galvanisée (des bandes claires et sombres), les bords torsadés.
    const g = new THREE.CylinderGeometry(0.17, 0.17, 1.0, 14, 8, true).translate(0, 0.5, 0);
    c.ajouterDegrade(g, (q) => (Math.sin(Math.atan2(q.z, q.x) * 14 + q.y * 30) > 0.35 ? 0xc9ccc8 : Math.sin(q.y * 61) > 0.6 ? 0x8d918e : 0xa9ada9), "metal");
    for (const yy of [0.01, 0.99]) c.ajouter(placer(new THREE.TorusGeometry(0.17, 0.012, 4, 14).rotateX(Math.PI / 2), 0, yy, 0), 0xb4b8b4, "metal");
    // Le cœur sombre (on voit dedans par le haut), le fil de ligature, l'étiquette de la coopérative.
    c.ajouter(placer(new THREE.CircleGeometry(0.16, 12).rotateX(-Math.PI / 2), 0, 0.97, 0), 0x3a3c3a, "mat");
    for (const yy of [0.3, 0.7]) c.ajouter(placer(new THREE.TorusGeometry(0.175, 0.005, 3, 14).rotateX(Math.PI / 2), 0, yy, 0), 0x6b6862, "metal");
    c.boite(0xd8c43a, "mat", 0.12, 0.09, 0.004, 0, 0.55, 0.172);
    // Une boucle de grillage déroulée qui traîne au pied.
    c.ajouterDegrade(placer(new THREE.PlaneGeometry(0.5, 0.35, 4, 3).rotateX(-Math.PI / 2 + 0.1), 0.3, 0.03, 0.15, 0, 0.5, 0), (q) => (Math.sin(q.x * 40) * Math.sin(q.z * 40) > 0.2 ? 0xb9bdb9 : 0x7a7e7a), "toile");
    touffe(c, -0.2, 0.15, aleat, 4, 0.35);
    const groupe = c.groupe(ombre);
    groupe.rotation.z = 0.12;
    this.objet.add(groupe);
  }

  /**
   * La clé de la marmite norvégienne (L1A) : la cocotte en fonte émaillée rouge, en tête de gondole au bout du premier
   * rayon, sous sa pancarte de promotion. Prise, la tête de gondole reste, vide.
   */
  private cocotte(ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = 0;
    const socle = new Assemblage(this.donnees.id + 3);
    socle.occlusion = 0.3;
    // La tête de gondole : un présentoir bas, une pancarte jaune sur sa tige (« −20 % »).
    socle.boite(0xd2cdc2, "metal", 0.6, 0.62, 0.55, 0, 0.37, 0);
    socle.boite(0x2f5d3a, "mat", 0.62, 0.05, 0.57, 0, 0.68, 0);
    socle.boite(0xe9dfc6, "mat", 0.003, 0.1, 0.5, -0.301, 0.5, 0);
    socle.perche(new V3(0.22, 0.7, -0.2), new V3(0.22, 1.35, -0.2), 0.008, ACIER, "metal", 4);
    socle.boite(0xf2d23a, "mat", 0.34, 0.24, 0.01, 0.22, 1.42, -0.2, 0, -0.5, 0);
    socle.boite(0xc8362b, "mat", 0.2, 0.08, 0.004, 0.24, 1.42, -0.192, 0, -0.5, 0);
    for (const m of socle.maillages(ombre)) this.objet.add(m);
    const c = new Assemblage(this.donnees.id);
    c.occlusion = 0.2;
    const y = 0.705;
    const rouge = 0xb8322a;
    c.ajouter(placer(new THREE.CylinderGeometry(0.13, 0.12, 0.13, 14), 0, y + 0.065, 0), rouge, "metal");
    c.ajouter(placer(new THREE.CylinderGeometry(0.115, 0.115, 0.004, 14), 0, y + 0.002, 0), 0x2a2826, "metal");
    // Le couvercle bombé et son bouton, les deux poignées.
    c.ajouter(placer(new THREE.SphereGeometry(0.135, 14, 4, 0, Math.PI * 2, 0, 0.5), 0, y + 0.07, 0), rouge, "metal");
    c.ajouter(placer(new THREE.CylinderGeometry(0.022, 0.026, 0.025, 8), 0, y + 0.205, 0), 0x2a2826, "metal");
    for (const s of [-1, 1]) c.boite(rouge, "metal", 0.05, 0.025, 0.07, s * 0.15, y + 0.1, 0);
    // L'étiquette de prix, pendue à une poignée.
    c.boite(0xf2eee2, "mat", 0.04, 0.025, 0.002, 0.18, y + 0.07, 0.03, 0, 0, 0.3);
    const g = c.groupe(ombre);
    this.objet.add(g);
    this.contenu = g;
  }

  /** La laiterie (plan 0.8, I8) : la caisse qui porte les seaux, et deux bidons à lait de 20 L contre elle. */
  private laiterie(ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    const c = new Assemblage(this.donnees.id + 7);
    c.occlusion = 0.4;
    c.boite(0x8a6a40, "mat", 0.8, 0.4, 0.55, 0, 0.2, 0);
    for (const y of [0.12, 0.3]) c.boite(0x6e5434, "mat", 0.82, 0.03, 0.57, 0, y, 0);
    c.boite(0x2f5d8a, "mat", 0.3, 0.12, 0.003, -0.1, 0.25, 0.277);
    for (const dx of [-0.6, -0.95]) {
      c.ajouter(placer(new THREE.CylinderGeometry(0.15, 0.17, 0.45, 12), dx, 0.225, 0.08), 0xb8bcc0, "metal");
      c.ajouter(placer(new THREE.CylinderGeometry(0.07, 0.13, 0.12, 12), dx, 0.51, 0.08), 0xb8bcc0, "metal");
      c.ajouter(placer(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), dx, 0.59, 0.08), 0x9a9ea2, "metal");
      for (const s of [-1, 1]) c.boite(0x8a8f94, "metal", 0.02, 0.08, 0.05, dx + s * 0.16, 0.42, 0.08);
    }
    for (const m of c.maillages(ombre)) this.objet.add(m);
  }

  private caisseOutils(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    const c = new Assemblage(this.donnees.id);
    c.occlusion = 0.15;
    const rouge = 0x8a3a2a;
    c.boite(rouge, "tole", 0.62, 0.22, 0.32, 0, 0.11, 0);
    c.ajouter(placer(new THREE.CylinderGeometry(0.16, 0.16, 0.62, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.4, 1), 0, 0.22, 0), 0x7a3324, "tole", 0.03);
    c.boite(0x5a2a20, "tole", 0.63, 0.015, 0.325, 0, 0.22, 0);
    for (const x of [-0.24, 0.24]) c.boite(0xa8a59c, "metal", 0.05, 0.06, 0.01, x, 0.21, 0.165);
    c.ajouter(placer(new THREE.TorusGeometry(0.1, 0.014, 4, 10, Math.PI), 0, 0.28, 0), 0x2b2b2b, "mat");
    const face = surface(new V3(0, 0, 0.161), X, Y, Z);
    for (let i = 0; i < 3; i++) rouille(c, face, (aleat() - 0.5) * 0.45, 0.05 + aleat() * 0.12, 0.05, 0.03, aleat);
    rouille(c, surface(new V3(0, 0.285, 0), X, Z, Y), (aleat() - 0.5) * 0.3, (aleat() - 0.5) * 0.15, 0.06, 0.05, aleat);
    // La clé plate et le tournevis tombés dans l'herbe.
    c.boite(0x8a8780, "metal", 0.2, 0.008, 0.022, 0.42, 0.01, 0.12, 0, 0.4, 0);
    for (const s of [-1, 1]) c.ajouter(placer(new THREE.TorusGeometry(0.02, 0.008, 3, 6, Math.PI * 1.4).rotateX(Math.PI / 2), 0.42 + s * 0.092, 0.01, 0.12 - s * 0.04, 0, 0.4, 0), 0x8a8780, "metal");
    c.perche(new V3(-0.42, 0.015, 0.1), new V3(-0.3, 0.015, 0.2), 0.016, 0xd8c43a, "mat", 6);
    c.perche(new V3(-0.3, 0.015, 0.2), new V3(-0.2, 0.015, 0.28), 0.005, 0xa8a59c, "metal", 4);
    touffe(c, 0.3, -0.2, aleat, 3, 0.3);
    touffe(c, -0.32, -0.12, aleat, 2, 0.25);
    for (const m of c.maillages(ombre)) this.objet.add(m);
  }

  /** Une étagère de magasin tirée hors de la boutique : montants perforés, tablettes, fond, une tablette tombée ; quelques boîtes oubliées. */
  private rayonnage(aleat: () => number, ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = (aleat() - 0.5) * 0.4;
    const c = new Assemblage(this.donnees.id);
    c.occlusion = 0.4;
    const gris = 0x9aa0a6;
    for (const dx of [-0.75, 0.75]) {
      for (const dz of [-0.2, 0.2]) c.boite(gris, "metal", 0.04, 1.8, 0.04, dx, 0.9, dz);
      for (let k = 0; k < 9; k++) c.plaque(rect(0, 0.2 + k * 0.18, 0.008, 0.02), surface(new V3(dx, 0, 0.221), Z.clone().negate(), Y, Z), 0x3a3836, "metal", 0.002);
      c.boite(gris, "metal", 0.04, 0.04, 0.44, dx, 0.03, 0);
    }
    c.boite(0x8a9096, "metal", 1.5, 1.7, 0.015, 0, 0.92, -0.215);
    for (let i = 0; i < 4; i++) {
      const y = 0.2 + i * 0.48;
      if (i === 2) {
        // Une tablette décrochée d'un côté, qui pend en travers.
        c.boite(gris, "metal", 1.5, 0.03, 0.42, 0, y - 0.1, 0, 0, 0, 0.16);
        continue;
      }
      c.boite(gris, "metal", 1.5, 0.03, 0.42, 0, y, 0);
      c.boite(0xd8d2b8, "mat", 1.5, 0.05, 0.008, 0, y - 0.01, 0.214);
      for (let k = 0; k < 3; k++) c.plaque(rect(-0.55 + k * 0.5, y - 0.01, 0.04, 0.012), surface(new V3(0, 0, 0.219), X, Y, Z), 0xc8362b, "mat", 0.002);
    }
    rouille(c, surface(new V3(0, 0, -0.2), X, Y, Z), (aleat() - 0.5), 0.5 + aleat() * 0.6, 0.15, 0.12, aleat);
    // Des cartons affaissés au pied.
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.4, 0.28, 0.3, 2, 2, 2), 0.02, aleat), 0.4, 0.14, 0.38, 0, 0.4, 0), 0xa88a5c, "mat", 0.04);
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.34, 0.2, 0.26, 2, 2, 2), 0.02, aleat), -0.45, 0.1, 0.42, 0, -0.3, 0.2), 0x9a7d52, "mat", 0.04);
    for (const m of c.maillages(ombre)) this.objet.add(m);
    // Les boîtes de conserve oubliées (étiquettes de l'Abondance) : ce qu'on vient chercher.
    const b = new Assemblage(this.donnees.id + 1);
    const couleurs = [0xc8362b, 0xd8c43a, 0x2f6fa4];
    for (let i = 0; i < 5; i++) {
      const x = -0.55 + aleat() * 1.1;
      const y = 0.29 + Math.floor(aleat() * 2) * 0.96;
      const z = (aleat() - 0.5) * 0.25;
      const couche = aleat() < 0.3;
      const boite = new THREE.CylinderGeometry(0.06, 0.06, 0.13, 9, 3);
      if (couche) boite.rotateZ(Math.PI / 2).translate(0, -0.005, 0);
      b.ajouterDegrade(placer(boite, x, couche ? y - 0.005 : y, z), (q) => {
        const h = couche ? Math.abs(q.x - x) : Math.abs(q.y - y);
        return h > 0.05 ? 0xb8b4ac : h > 0.035 ? 0xe8e0c8 : couleurs[i % 3]!;
      }, "metal");
    }
    const boites = b.groupe(ombre);
    this.objet.add(boites);
    this.contenu = boites;
  }

  /** Le petit panneau solaire, tombé de l'auvent, appuyé contre le pilier : on le voit et on l'atteint du sol. */
  private panneauAuvent(ombre: (m: THREE.Mesh) => THREE.Mesh): void {
    this.objet.rotation.y = -Math.PI / 2;
    const c = new Assemblage(this.donnees.id);
    // Debout sur sa tranche, penché contre le pilier (à l'ouest du panneau) ; le même panneau que sur le chevalet.
    c.repere = new THREE.Matrix4().makeTranslation(0, 0.36, 0.12).multiply(new THREE.Matrix4().makeRotationX(-1.2));
    modulePanneau(c);
    // Le câble arraché, qui pend, et une fêlure en étoile dans le verre.
    c.perche(new V3(0, -0.04, 0.2), new V3(0.35, -0.3, 0.25), 0.008, 0x1a1a1a, "mat", 4);
    c.perche(new V3(0.35, -0.3, 0.25), new V3(0.5, -0.32, 0.1), 0.008, 0x1a1a1a, "mat", 4);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      c.plaque([V(0.2, -0.1), V(0.2 + Math.cos(a) * 0.12, -0.1 + Math.sin(a) * 0.12), V(0.2 + Math.cos(a + 0.12) * 0.01, -0.1 + Math.sin(a + 0.12) * 0.01)], surface(new V3(0, 0.021, 0), X, Z, Y), 0xc4ccd0, "verre", 0.006);
    }
    c.repere = null;
    for (const m of c.maillages(ombre)) this.objet.add(m);
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
// L'assemblage lui-même (couleurs par sommet, fusion par finition) est dans assemblage.ts, partagé depuis.

const NUIT = 0x1c1e20;
const VERRE = 0x7d929c;
const FISSURE = 0xc4ccd0;
const MOUSSE = 0x4f6a35;
const CRASSE = 0x5a4e40;
const MOUSSE_CLAIRE = 0x66823f;
const FEUILLES = [0x8a6a3a, 0xa07a3a, 0x6f5a32];
/** Les arceaux de la benne du camion (x) ; à l'avant, la bâche s'appuie sur la paroi de la benne. */
const ARCEAUX = [-3.6, -2.25, -0.9, 0.45];
/** Un éclair stylisé (logo de la société de livraison), dans un carré de côté 2. */
const ECLAIR = [V(-0.25, 0.9), V(0.35, 0.9), V(0.05, 0.15), V(0.45, 0.15), V(-0.3, -0.95), V(-0.05, -0.1), V(-0.45, -0.1)];

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
  groupe.name = "mare";
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
  // Les 22 roseaux, fondus par couleur (2026-10-09) : 2 appels de dessin au lieu de 22, autant dans l'ombre. Même image.
  fusionnerStatique(groupe);
  return groupe;
}
