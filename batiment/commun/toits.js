// L'effacement des toits et des étages : même règle que le jeu (code/client/src/rendu/halte.ts, estomperToits).
// Une couche (toit, étage inaccessible, façade haute) disparaît en fondu quand elle cache le personnage : il est
// dessous, ou derrière elle vu de la caméra. Son ombre reste au sol. Le jeu peut reprendre ses propres fonctions
// telles quelles : le format `userData.toits` est le même ({ boite: {x, z, l, p}, materiaux, bas, haut, horsDe }).

/** Recul au sol d'un point vu par la caméra isométrique, par mètre de hauteur : 1 / tan(35,26°) = √2. */
const RECUL = Math.SQRT2;

function dansBoite(x, z, b, marge) {
  return Math.abs(x - b.x) <= b.l / 2 + marge && Math.abs(z - b.z) <= b.p / 2 + marge;
}

function cacheLePersonnage(t, x, z, lacet) {
  if (t.horsDe && dansBoite(x, z, t.horsDe, 0.25)) return false;
  const b = t.boite;
  const marge = t.efface ? 0.9 : 0.45;
  if (dansBoite(x, z, b, marge * 0.5)) return true;
  const dx = Math.cos(lacet);
  const dz = Math.sin(lacet);
  const bas = t.bas ?? 2.4;
  const haut = t.haut ?? 5;
  for (const y of [0.15, 0.9, 1.75]) {
    const s0 = Math.max(0, (bas - y) * RECUL);
    const s1 = Math.max(0, (haut - y) * RECUL);
    const n = Math.max(5, Math.ceil((s1 - s0) / 1.5));
    for (let i = 0; i <= n; i++) {
      const s = s0 + ((s1 - s0) * i) / n;
      if (dansBoite(x + dx * s, z + dz * s, b, marge)) return true;
    }
  }
  return false;
}

/**
 * Efface en fondu les couches qui cachent le personnage en (x, z). `mode` : « auto » (règle du jeu), « visibles »
 * (tout reste), « masques » (toutes les couches effacées : vue en coupe). `lacet` : angle horizontal caméra → cible.
 */
export function estomperToits(racine, x, z, dt, lacet = Math.PI / 4, mode = "auto") {
  const voulu = new Map();
  racine.traverse((o) => {
    const toits = o.userData.toits;
    if (!toits) return;
    for (const t of toits) {
      const efface = mode === "masques" ? true : mode === "visibles" ? false : cacheLePersonnage(t, x, z, lacet);
      t.efface = efface;
      for (const m of t.materiaux) voulu.set(m, (voulu.get(m) ?? false) || efface);
    }
  });
  // En coupe ou toits visibles : tout de suite (une capture ne doit pas tomber au milieu d'un fondu).
  const k = mode === "auto" ? 1 - Math.exp(-dt * 14) : 1;
  for (const [m, efface] of voulu) {
    const avant = m.userData.fondu ?? 1;
    let f = avant + ((efface ? 0 : 1) - avant) * k;
    if (efface && f < 0.03) f = 0;
    if (!efface && f > 0.97) f = 1;
    if (f === avant && m.userData.fondu !== undefined) continue;
    m.userData.fondu = f;
    const opacite = m.userData.opacite ?? 1;
    m.opacity = opacite * f;
    m.visible = f > 0;
    // Une matière opaque réécrit sa profondeur une fois revenue (même « sans ombre » : enseignes, écrans).
    m.depthWrite = f >= 1 && opacite >= 1;
  }
}
