// La boussole (0.10.1, chantier D : A9, avec B2) : le cadran de papier crème de la maquette V3, choisi par le porteur
// (`.claude-travail/maquettes-0-10-1/boussole/`). Elle remplace le « ⟳ » (vertical) et l'icône de la tuile « Vue »
// (paysage) ; le geste ne change pas : un appui, un quart de tour.
//
// Le nord du monde est le −z (rendu/carte-vue.ts). La caméra regarde depuis (cos lacet, sin lacet) vers la cible
// (rendu/scene.ts) : le haut de l'écran pointe vers (−cos lacet, −sin lacet). Au repos (lacet = π/4), il regarde le
// nord-ouest : le N du cadran est en haut à droite (plan 0.10.1, Q-2). Le chemin du terrain est au sud (B2, Q-3) : la
// boussole le montre, les textes « au sud » ne changent pas.

const ENCRE = "#3b2a1e";
const CREME = "#f4ecd8";
const ROUGE = "#c8362b";

/** De combien le nord est tourné à l'écran, en degrés, dans le sens des aiguilles d'une montre (0 = nord en haut). */
export function rotationNord(lacet: number): number {
  return 90 - (lacet * 180) / Math.PI;
}

/** Les huit directions, pour dire où regarde le haut de l'écran. */
const HUIT = ["N", "N-E", "E", "S-E", "S", "S-O", "O", "N-O"] as const;

/** La direction la plus proche d'un cap (degrés, 0 = nord, sens des aiguilles : 90 = est). */
export function directionCourte(cap: number): string {
  const i = Math.round((((cap % 360) + 360) % 360) / 45) % 8;
  return HUIT[i];
}

/** Où regarde le haut de l'écran, pour un lacet de caméra donné (la légende de la tuile en paysage : « N-O »…). */
export function directionVue(lacet: number): string {
  return directionCourte(-rotationNord(lacet));
}

const rad = (d: number) => (d * Math.PI) / 180;
/** Un point à `r` du centre (24, 24), dans la direction `cap` (degrés, 0 = haut, sens des aiguilles). */
function point(cap: number, r: number): [number, number] {
  return [24 + Math.sin(rad(cap)) * r, 24 - Math.cos(rad(cap)) * r];
}
const f = (n: number) => n.toFixed(2);

/** Une lettre droite (seule sa place tourne : un N penché se lit mal à cette taille), liserée de crème. */
function lettre(texte: string, cap: number, r: number, taille: number, couleur: string, epaisseur: number): string {
  const [x, y] = point(cap, r);
  return `<text x="${f(x)}" y="${f(y)}" font-size="${taille}" font-weight="800" text-anchor="middle" dominant-baseline="central" font-family="'Avenir Next Condensed','Avenir Next','Arial Narrow',system-ui,sans-serif" fill="${couleur}" stroke="${CREME}" stroke-width="${epaisseur}" paint-order="stroke" stroke-linejoin="round">${texte}</text>`;
}

/** Une branche en losange (moitié claire, moitié ombrée), de la pointe à `long` jusqu'à la base de demi-largeur `l`. */
function branche(cap: number, long: number, l: number, clair: string, sombre: string): string {
  const [px, py] = point(cap, long);
  const [gx, gy] = point(cap - 90, l);
  const [dx, dy] = point(cap + 90, l);
  return `<path d="M${f(px)} ${f(py)} L${f(gx)} ${f(gy)} L24 24 Z" fill="${clair}"/><path d="M${f(px)} ${f(py)} L${f(dx)} ${f(dy)} L24 24 Z" fill="${sombre}"/>`;
}

/**
 * Le cadran (SVG, viewBox 48 × 48) : un rond de papier crème, N (rouge, plus gros), E, S, O, des graduations, une petite
 * aiguille au centre ; en haut, un cran fixe (encre) : la lettre qui passe sous le cran, c'est là où regarde l'écran.
 * @param rot rotation du nord à l'écran (degrés, sens des aiguilles), voir `rotationNord`.
 */
export function dessinerBoussole(rot: number): string {
  let s = `<circle cx="24" cy="24" r="22.6" fill="${CREME}"/><circle cx="24" cy="24" r="22.2" fill="none" stroke="${ENCRE}" stroke-width="1.4"/>`;
  for (let c = 0; c < 360; c += 22.5) {
    if (c % 90 === 0) continue;
    const grand = c % 45 === 0;
    const [a, b] = [point(rot + c, 21.4), point(rot + c, grand ? 18.4 : 19.8)];
    s += `<path d="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}" stroke="${ENCRE}" stroke-width="${grand ? 1.3 : 0.8}" stroke-linecap="round" opacity="0.75"/>`;
  }
  s += branche(rot + 180, 8.5, 2.6, "#d9cfb8", "#b9ad92");
  s += branche(rot, 8.5, 2.6, ROUGE, "#9a2219");
  s += `<circle cx="24" cy="24" r="1.5" fill="${ENCRE}"/>`;
  s += lettre("E", rot + 90, 16.2, 8.5, ENCRE, 1.6);
  s += lettre("S", rot + 180, 16.2, 8.5, ENCRE, 1.6);
  s += lettre("O", rot + 270, 16.2, 8.5, ENCRE, 1.6);
  s += lettre("N", rot, 15.8, 11.5, ROUGE, 1.8);
  // Le cran fixe, en haut, hors du cadran : « l'écran regarde par ici ».
  s += `<path d="M20.6 -1.6 L27.4 -1.6 L24 3.2 Z" fill="${ENCRE}" stroke="${CREME}" stroke-width="1" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${s}</svg>`;
}

/**
 * Tient à jour les boussoles du HUD (le rond du bas en vertical, la tuile du haut en paysage) : appelée à chaque image
 * avec le lacet lissé de la caméra (`scene.angleCamera`), elle ne redessine que si l'angle a bougé d'un dixième de degré.
 */
export class Boussoles {
  private dernier = "";
  private derniereLegende = "";
  private readonly cadrans: readonly HTMLElement[];
  private readonly legende: HTMLElement | null;

  constructor(cadrans: readonly HTMLElement[], legende: HTMLElement | null) {
    this.cadrans = cadrans;
    this.legende = legende;
  }

  maj(lacet: number): void {
    const rot = rotationNord(lacet);
    const cle = (((rot % 360) + 360) % 360).toFixed(1);
    if (cle === this.dernier) return;
    this.dernier = cle;
    const svg = dessinerBoussole(rot);
    for (const c of this.cadrans) c.innerHTML = svg;
    const texte = directionVue(lacet);
    if (this.legende && texte !== this.derniereLegende) this.legende.textContent = this.derniereLegende = texte;
  }
}
