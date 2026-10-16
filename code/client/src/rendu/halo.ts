// Le halo (duel 0.11, D-17, D-19 V1, D-24) : un anneau au sol, sous chaque voyageur d'une halte, soi compris. Il dit
// l'état d'esprit de chacun, de loin :
// - **rouge à huit pointes** en Combat (la forme le dit aussi : rouge et vert se confondent pour un daltonien) ;
// - **vert lisse** en Exploration ;
// - **blanc, qui se vide comme une horloge** pendant les 45 s où le perdant d'un duel ne peut pas être provoqué (D-24),
//   puis il reprend sa couleur. En Combat, ses pointes restent (blanches).
// Bordé de sombre, pour se lire sur l'herbe, le béton et la nuit.
//
// Pour l'iPhone (R42, 60 i/s) : **aucune lumière**, deux matières sans éclairage partagées par tous les halos, des
// géométries partagées, **un seul appel de dessin par halo** (le bord et la couleur fondus, couleur par sommet) ; seule
// l'horloge a sa géométrie (on n'en dessine qu'une part) et son appel, créée à la protection et jetée après.
// Le halo est un enfant du personnage (`Personnage.objet`) : il le suit, se cache avec lui (vue par pièce) ; il n'est pas
// fondu dans le maillage du personnage (fusion-personnage.ts ne fond que le modèle du corps).

import * as THREE from "three";

/** Les couleurs du halo (celles de la maquette, reprises par la pastille du bouton : style.css `--halo-*`). */
export const COULEUR_HALO = { rouge: 0xff4a36, vert: 0x5fe07e, blanc: 0xfbf7ec, bord: 0x0c0f14 } as const;
/** La protection du perdant (D-24, `duel-entre-joueurs.md` §5) : l'horloge fait le tour en ce temps. */
export const PROTECTION_MS = 45_000;
/** Au-dessus du sol (m) : le carrelage de la halte cachait ce qui était posé à 6 cm (comme les cercles, main.ts). */
export const HAUTEUR_HALO = 0.1;
/** En Combat, l'anneau tourne lentement (rad/s) : il vit, sans clignoter. */
const ROTATION_COMBAT = 0.6;
/** Les pas de l'horloge : un tous les ≈ 0,5 s sur 45 s. */
const PAS_HORLOGE = 96;

const R_ANNEAU = [0.52, 0.68] as const;
const R_BORD = [0.48, 0.73] as const;

/** Huit pointes tournées vers l'extérieur, de `r0` à `r1`, chacune de demi-largeur `da` (rad). */
function pointes(r0: number, r1: number, da: number): THREE.BufferGeometry {
  const p: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    // Dans le sens qui regarde vers le haut (la caméra est au-dessus).
    p.push(Math.cos(a + da) * r0, 0, Math.sin(a + da) * r0, Math.cos(a) * r1, 0, Math.sin(a) * r1, Math.cos(a - da) * r0, 0, Math.sin(a - da) * r0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  return g;
}

type Teinte = keyof typeof COULEUR_HALO;
/** L'opacité de chaque teinte : le bord sombre est à moitié transparent. */
const OPACITE: Record<Teinte, number> = { rouge: 0.95, vert: 0.95, blanc: 0.95, bord: 0.55 };

/** Des morceaux colorés fondus en une géométrie (couleur et opacité par sommet) : un seul appel de dessin par halo. */
function fondre(morceaux: [THREE.BufferGeometry, Teinte][]): THREE.BufferGeometry {
  const positions: number[] = [];
  const couleurs: number[] = [];
  const c = new THREE.Color();
  for (const [g, teinte] of morceaux) {
    const p = (g.index ? g.toNonIndexed() : g).getAttribute("position");
    c.setHex(COULEUR_HALO[teinte]);
    for (let i = 0; i < p.count; i++) {
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
      couleurs.push(c.r, c.g, c.b, OPACITE[teinte]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 4));
  return g;
}

/**
 * Les géométries partagées par tous les halos (créées au premier halo), le bord sombre dessous, la couleur dessus :
 * vert lisse, rouge à pointes ; pendant la protection, le bord seul (l'horloge blanche se pose dessus), avec ou sans
 * pointes blanches.
 */
let geometries: Record<"vert" | "rouge" | "blanc" | "blancPointes", THREE.BufferGeometry> | null = null;
function lesGeometries(): NonNullable<typeof geometries> {
  if (geometries) return geometries;
  const anneau = new THREE.RingGeometry(R_ANNEAU[0], R_ANNEAU[1], 48).rotateX(-Math.PI / 2);
  const bord = new THREE.RingGeometry(R_BORD[0], R_BORD[1], 48).rotateX(-Math.PI / 2);
  const piques = pointes(0.66, 0.95, 0.16);
  const bordPiques = pointes(0.62, 1.01, 0.21);
  return (geometries = {
    vert: fondre([[bord, "bord"], [anneau, "vert"]]),
    rouge: fondre([[bord, "bord"], [bordPiques, "bord"], [anneau, "rouge"], [piques, "rouge"]]),
    blanc: fondre([[bord, "bord"]]),
    blancPointes: fondre([[bord, "bord"], [bordPiques, "bord"], [piques, "blanc"]]),
  });
}

/**
 * Les matières partagées : sans éclairage (le même rouge de jour et de nuit), sans brouillard, sans écrire la profondeur ;
 * `halo` lit la couleur de chaque sommet, `horloge` est blanche.
 */
let matieres: { halo: THREE.MeshBasicMaterial; horloge: THREE.MeshBasicMaterial } | null = null;
export function matieresHalo(): NonNullable<typeof matieres> {
  const m = (o: THREE.MeshBasicMaterialParameters) =>
    new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, ...o });
  return (matieres ??= { halo: m({ vertexColors: true }), horloge: m({ color: COULEUR_HALO.blanc, opacity: OPACITE.blanc }) });
}

/** Ce qui reste de la protection (1 : elle commence ; 0 : finie, ou pas protégé). */
export function resteProtection(protegeJusqua: number | undefined, maintenantServeur: number): number {
  if (protegeJusqua === undefined) return 0;
  return Math.min(1, Math.max(0, (protegeJusqua - maintenantServeur) / PROTECTION_MS));
}

/** L'état que montre le halo. */
export type EtatHalo = "vert" | "rouge" | "blanc";
export function etatHalo(rouge: boolean, protegeJusqua: number | undefined, maintenantServeur: number): EtatHalo {
  return resteProtection(protegeJusqua, maintenantServeur) > 0 ? "blanc" : rouge ? "rouge" : "vert";
}

export class Halo {
  readonly objet = new THREE.Group();
  /** L'anneau et son bord, en un maillage (sa géométrie change avec l'état, toutes partagées). */
  private readonly anneau: THREE.Mesh;
  /** L'horloge de la protection : sa propre géométrie (on n'en dessine qu'une part), seulement pendant les 45 s. */
  private horloge: THREE.Mesh | null = null;
  private pasHorloge = -1;
  private tour = 0;
  private cle = "";
  etat: EtatHalo = "vert";

  constructor() {
    this.anneau = new THREE.Mesh(lesGeometries().vert, matieresHalo().halo);
    this.anneau.renderOrder = 1;
    this.objet.add(this.anneau);
    this.objet.name = "halo";
  }

  /**
   * Chaque image. `rouge` : en Combat ; `protegeJusqua` : l'heure du serveur de la fin de sa protection ; `ySol` : le
   * vrai sol sous lui (le relief), en coordonnées du monde ; `porteur` : l'objet du personnage auquel il est accroché.
   */
  maj(dt: number, rouge: boolean, protegeJusqua: number | undefined, maintenantServeur: number, ySol: number, porteur: THREE.Object3D): void {
    const etat = etatHalo(rouge, protegeJusqua, maintenantServeur);
    const cle = `${etat}|${rouge}`;
    if (cle !== this.cle) {
      this.cle = cle;
      this.montrer(etat, rouge);
    }
    // Posé sur le vrai sol, quelle que soit la hauteur du personnage (enfoncé dans l'eau, sur la rampe du phare…).
    this.objet.position.y = ySol - porteur.position.y + HAUTEUR_HALO;
    if (etat === "blanc") {
      // L'horloge se lit depuis le haut de l'écran (comme l'anneau d'un geste) : elle ne tourne pas avec le personnage.
      this.objet.rotation.y = -porteur.rotation.y;
      this.vider(resteProtection(protegeJusqua, maintenantServeur));
    } else {
      this.tour = rouge ? (this.tour + dt * ROTATION_COMBAT) % (Math.PI * 2) : 0;
      this.objet.rotation.y = this.tour;
    }
  }

  private montrer(etat: EtatHalo, rouge: boolean): void {
    this.etat = etat;
    const g = lesGeometries();
    this.anneau.geometry = etat === "blanc" ? (rouge ? g.blancPointes : g.blanc) : etat === "rouge" ? g.rouge : g.vert;
    if (etat === "blanc" && !this.horloge) {
      // De midi, dans le sens des aiguilles d'une montre : la part qui reste (voir vider).
      const geo = new THREE.RingGeometry(R_ANNEAU[0], R_ANNEAU[1], PAS_HORLOGE, 1, Math.PI / 2, -Math.PI * 2).rotateX(-Math.PI / 2);
      this.horloge = new THREE.Mesh(geo, matieresHalo().horloge);
      this.horloge.renderOrder = 2;
      this.pasHorloge = -1;
      this.objet.add(this.horloge);
    } else if (etat !== "blanc" && this.horloge) {
      this.objet.remove(this.horloge);
      this.horloge.geometry.dispose();
      this.horloge = null;
    }
  }

  /** L'horloge se vide : la part vide grandit depuis midi, dans le sens des aiguilles d'une montre. */
  private vider(reste: number): void {
    const h = this.horloge;
    if (!h) return;
    const pas = Math.ceil(reste * PAS_HORLOGE);
    if (pas === this.pasHorloge) return;
    this.pasHorloge = pas;
    // Six indices par pas (deux triangles) ; on garde les derniers pas : de la part vide jusqu'à midi.
    h.geometry.setDrawRange((PAS_HORLOGE - pas) * 6, pas * 6);
  }

  /** La part d'horloge dessinée (0 à 1 ; pour les essais). */
  get partHorloge(): number {
    return this.horloge ? this.horloge.geometry.drawRange.count / (PAS_HORLOGE * 6) : 0;
  }

  /** Les teintes dessinées (pour les essais). */
  get teintes(): Set<number> {
    const vues = new Set<number>();
    for (const o of this.objet.children) {
      const m = o as THREE.Mesh;
      if (!m.visible) continue;
      const mat = m.material as THREE.MeshBasicMaterial;
      if (!mat.vertexColors) {
        vues.add(mat.color.getHex());
        continue;
      }
      const c = m.geometry.getAttribute("color");
      const coul = new THREE.Color();
      for (let i = 0; i < c.count; i += 3) vues.add(coul.setRGB(c.getX(i), c.getY(i), c.getZ(i)).getHex());
    }
    return vues;
  }
}
