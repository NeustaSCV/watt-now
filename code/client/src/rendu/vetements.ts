// Les vêtements taillés dans le corps (Book 18 §4.2 : « vêtements et accessoires sont des pièces »).
// Pour chaque pièce (veste, pantalon, chaussures, gants), on prend les triangles du corps qu'elle couvre,
// on les lisse (le tissu efface les muscles), on les gonfle de quelques centimètres, et on garde les mêmes os :
// la pièce suit toutes les animations. Les bords (col, poignets, chevilles, taille) restent collés à la peau,
// pour qu'aucun jour n'apparaisse. La peau cachée dessous est retirée (le budget de triangles ne bouge pas),
// sauf pour les Éteints : leurs vêtements sont troués, et la peau se voit par les trous.

import * as THREE from "three";

export type Zone = "peau" | "haut" | "manche" | "bas" | "pieds" | "mains";

/** La zone de chaque os du squelette commun (65 os, nomenclature Unreal). */
export function zoneDeLos(nom: string): Zone {
  if (nom === "Head" || nom === "neck_01") return "peau";
  if (/^(hand|index|middle|ring|pinky|thumb)/.test(nom)) return "mains";
  if (/^lowerarm/.test(nom)) return "manche";
  if (/^(spine|clavicle|upperarm)/.test(nom)) return "haut";
  if (/^(foot|ball)/.test(nom)) return "pieds";
  return "bas"; // pelvis, thigh, calf, root
}

export interface Piece {
  /** Les zones couvertes, avec leur couleur. */
  zones: Partial<Record<Zone, number>>;
  /** Épaisseur du tissu (m). */
  epaisseur: number;
  /** Passes de lissage (plus : plus ample, moins de détails du corps). */
  lissage: number;
}

/** La zone de chaque sommet : l'os qui le porte le plus. */
export function zonesDesSommets(geo: THREE.BufferGeometry, os: THREE.Bone[]): Zone[] {
  const indices = geo.getAttribute("skinIndex");
  const poids = geo.getAttribute("skinWeight");
  const zones: Zone[] = [];
  for (let i = 0; i < indices.count; i++) {
    let meilleur = 0;
    let max = -1;
    for (let k = 0; k < 4; k++) {
      const w = poids.getComponent(i, k);
      if (w > max) {
        max = w;
        meilleur = indices.getComponent(i, k);
      }
    }
    zones.push(zoneDeLos(os[meilleur]?.name ?? ""));
  }
  return zones;
}

/**
 * Taille les pièces dans le corps. Renvoie leurs géométries (mêmes os, mêmes poids), et retire du corps
 * les triangles couverts si `retirerPeau`.
 * `metresParUnite` : la taille d'une unité du maillage, pour que les épaisseurs soient en mètres.
 */
export function tailler(corps: THREE.BufferGeometry, zones: Zone[], pieces: Piece[], metresParUnite: number, retirerPeau: boolean): THREE.BufferGeometry[] {
  const index = corps.getIndex();
  if (!index) return [];
  const pos = corps.getAttribute("position");
  const nTri = index.count / 3;

  // Les sommets confondus (coutures d'UV) : une même clé de position, pour lisser sans déchirer.
  const cle = new Int32Array(pos.count);
  const parPosition = new Map<string, number>();
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
    let c = parPosition.get(k);
    if (c === undefined) {
      c = positions.length;
      parPosition.set(k, c);
      positions.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
    }
    cle[i] = c;
  }

  // Un triangle va à chaque pièce dont il touche la zone : les pièces se chevauchent (la veste recouvre
  // le haut du pantalon), et il n'y a jamais de jour entre elles.
  const dansPiece = pieces.map(() => new Uint8Array(nTri));
  const couvert = new Uint8Array(nTri);
  for (let t = 0; t < nTri; t++) {
    for (let k = 0; k < 3; k++) {
      const z = zones[index.getX(t * 3 + k)]!;
      pieces.forEach((pc, p) => {
        if (pc.zones[z] !== undefined) {
          dansPiece[p]![t] = 1;
          couvert[t] = 1;
        }
      });
    }
  }
  // Le bord à coller : les sommets que partage la peau restée visible (col, poignets, chevilles nues).
  const bord = new Set<number>();
  for (let t = 0; t < nTri; t++) if (!couvert[t]) for (let k = 0; k < 3; k++) bord.add(cle[index.getX(t * 3 + k)]!);

  const sorties: THREE.BufferGeometry[] = [];
  pieces.forEach((piece, p) => {
    const tris: number[] = [];
    for (let t = 0; t < nTri; t++) if (dansPiece[p]![t]) tris.push(t);
    if (tris.length === 0) return;

    // Les clés de la pièce et leurs voisines.
    const voisins = new Map<number, Set<number>>();
    const dedans = new Set<number>();
    for (const t of tris) {
      const cles = [0, 1, 2].map((k) => cle[index.getX(t * 3 + k)]!);
      for (const a of cles) {
        dedans.add(a);
        let v = voisins.get(a);
        if (!v) voisins.set(a, (v = new Set()));
        for (const b of cles) if (b !== a) v.add(b);
      }
    }

    // Lissage de Taubin (il adoucit sans faire maigrir) ; le bord ne bouge pas.
    const lisse = new Map<number, THREE.Vector3>();
    for (const a of dedans) lisse.set(a, positions[a]!.clone());
    const passe = (facteur: number) => {
      const suivant = new Map<number, THREE.Vector3>();
      for (const a of dedans) {
        const p0 = lisse.get(a)!;
        if (bord.has(a)) {
          suivant.set(a, p0);
          continue;
        }
        const moyenne = new THREE.Vector3();
        const v = voisins.get(a)!;
        for (const b of v) moyenne.add(lisse.get(b)!);
        moyenne.divideScalar(v.size);
        suivant.set(a, p0.clone().lerp(moyenne, facteur));
      }
      for (const [a, v] of suivant) lisse.set(a, v);
    };
    for (let i = 0; i < piece.lissage; i++) {
      passe(0.5);
      passe(-0.53);
    }

    // Les normales lissées, par clé.
    const normales = new Map<number, THREE.Vector3>();
    for (const a of dedans) normales.set(a, new THREE.Vector3());
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();
    for (const t of tris) {
      const [a, b, c] = [0, 1, 2].map((k) => cle[index.getX(t * 3 + k)]!) as [number, number, number];
      ab.subVectors(lisse.get(b)!, lisse.get(a)!);
      ac.subVectors(lisse.get(c)!, lisse.get(a)!);
      const n = ab.cross(ac);
      for (const x of [a, b, c]) normales.get(x)!.add(n);
    }
    for (const n of normales.values()) n.normalize();

    // Le gonflement : nul au bord, entier à deux rangs du bord (le tissu « tombe » du col et des poignets).
    const rang = new Map<number, number>();
    let front = [...dedans].filter((a) => bord.has(a));
    for (const a of front) rang.set(a, 0);
    for (let r = 1; r <= 2 && front.length; r++) {
      const suivant: number[] = [];
      for (const a of front) for (const b of voisins.get(a) ?? []) if (!rang.has(b)) rang.set(b, r), suivant.push(b);
      front = suivant;
    }
    const epaisseur = piece.epaisseur / metresParUnite;
    for (const a of dedans) {
      const k = Math.min(1, (rang.get(a) ?? 3) / 2);
      lisse.get(a)!.addScaledVector(normales.get(a)!, epaisseur * k);
    }

    // La géométrie de la pièce : les sommets d'origine utilisés, aux nouvelles positions.
    const nouveaux = new Map<number, number>();
    const garder: number[] = [];
    const indicesPiece: number[] = [];
    for (const t of tris) {
      for (let k = 0; k < 3; k++) {
        const i = index.getX(t * 3 + k);
        let j = nouveaux.get(i);
        if (j === undefined) {
          j = garder.length;
          nouveaux.set(i, j);
          garder.push(i);
        }
        indicesPiece.push(j);
      }
    }
    const geo = new THREE.BufferGeometry();
    const n = garder.length;
    const P = new Float32Array(n * 3);
    const N = new Float32Array(n * 3);
    const T = new Float32Array(n * 4);
    const zonesPiece: Zone[] = [];
    const premiere = Object.keys(piece.zones)[0] as Zone;
    garder.forEach((i, j) => {
      const a = cle[i]!;
      lisse.get(a)!.toArray(P, j * 3);
      normales.get(a)!.toArray(N, j * 3);
      zonesPiece.push(piece.zones[zones[i]!] !== undefined ? zones[i]! : premiere);
    });
    // La zone de chaque sommet de la pièce : pour la recolorer sans la retailler (voir `colorer`).
    geo.userData.zones = zonesPiece;
    geo.userData.piece = p;
    geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(N, 3));
    geo.setAttribute("tenue", new THREE.BufferAttribute(T, 4));
    colorer(geo, piece.zones);
    geo.setAttribute("gonfle", new THREE.BufferAttribute(new Float32Array(n), 1));
    for (const nom of ["uv", "skinIndex", "skinWeight"]) {
      const src = corps.getAttribute(nom) as THREE.BufferAttribute;
      const taille = src.itemSize;
      const dst = new (src.array.constructor as Float32ArrayConstructor)(n * taille);
      garder.forEach((i, j) => {
        for (let c = 0; c < taille; c++) dst[j * taille + c] = src.array[i * taille + c]!;
      });
      geo.setAttribute(nom, new THREE.BufferAttribute(dst, taille, src.normalized));
    }
    geo.setIndex(indicesPiece);
    sorties.push(geo);
  });

  // Le corps sous les vêtements : retiré (survivants), ou gardé pour se voir par les trous (Éteints).
  if (retirerPeau) {
    const reste: number[] = [];
    for (let t = 0; t < nTri; t++) if (!couvert[t]) reste.push(index.getX(t * 3), index.getX(t * 3 + 1), index.getX(t * 3 + 2));
    corps.setIndex(reste);
  }
  return sorties;
}

/** Donne à une pièce taillée les couleurs d'une tenue (d'après la zone de chaque sommet). */
export function colorer(geo: THREE.BufferGeometry, couleurs: Partial<Record<Zone, number>>): void {
  const zones = geo.userData.zones as Zone[];
  const T = new Float32Array(zones.length * 4);
  const c = new THREE.Color();
  zones.forEach((z, j) => {
    c.setHex(couleurs[z] ?? Object.values(couleurs)[0]!);
    T.set([c.r, c.g, c.b, 1], j * 4);
  });
  geo.setAttribute("tenue", new THREE.BufferAttribute(T, 4));
}
