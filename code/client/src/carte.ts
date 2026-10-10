// La carte du monde (Book 20, réduite pour la 0a) : un vieil atlas régional annoté au crayon par les survivants.
// On y choisit une destination ; on ne s'y promène pas (Book 01 §2 bis). Pendant le trajet, le pion avance.
// 0.8 (plan §3, chantier 4) : deux routes passent la rivière. La route A par le pont (la station, la Coopérative), la
// route B à gué, en aval (le Gué-aux-Saules, puis le Moulin du Gué, au bord de la rivière).

import { DUREE_VOYAGE_S, EAU_PAR_KM, KCAL_PAR_KM, LIEUX, distanceKm, etapeVers, minuscule, type LieuId, type LieuJouable } from "../../commun/src/lieux.ts";

/** Les lieux de la route de la Campagne sur la feuille (viewBox 1000 × 700 ; l'échelle : 53 unités par km). */
export const POINTS: Record<LieuId, [number, number]> = {
  terrain: [560, 382],
  station: [402, 404],
  comptoir: [300, 380],
  // 0.7.3 : derrière la station, comme le Comptoir (≈ 2 km de chemin de terre, au nord-ouest).
  cooperative: [376, 296],
  // 0.8 : le gué, sur la rivière en aval du pont (3 km du terrain) ; le Moulin, 2 km plus bas, au bord de l'eau.
  gue: [462, 481],
  moulin: [379, 560],
};

/** Le chemin de halage, le long de la rive est, du Moulin au gué : une sortie du Moulin, jamais une arrivée. */
const HALAGE: [number, number][] = [[379, 560], [398, 560], [416, 550], [432, 534], [446, 516], [458, 498], [462, 481]];

/** Le tracé de chaque tronçon de route (commun/src/lieux.ts, TRONCONS), d'un bout à l'autre. */
export const TRACES: { a: LieuId; b: LieuId; points: [number, number][]; genre: "route" | "chemin" }[] = [
  // La route de la Campagne, du terrain à la station, en passant par le pont
  {
    a: "terrain",
    b: "station",
    genre: "route",
    points: [[560, 382], [532, 390], [506, 393], [490, 394], [466, 400], [436, 405], [402, 404]],
  },
  { a: "station", b: "comptoir", genre: "route", points: [[402, 404], [372, 399], [340, 392], [318, 386], [300, 380]] },
  // Le chemin de terre de la station à la Coopérative (0.7.3), qui part de la route à l'ouest de la station
  { a: "station", b: "cooperative", genre: "chemin", points: [[402, 404], [394, 402], [392, 380], [388, 356], [383, 330], [379, 310], [376, 296]] },
  // Le chemin agricole, au nord du Carrefour, jusqu'à la Coopérative (0.5)
  { a: "comptoir", b: "cooperative", genre: "chemin", points: [[300, 380], [304, 356], [314, 334], [332, 316], [354, 303], [376, 296]] },
  // La route B (0.8) : du terrain, elle descend la rive est jusqu'au gué, passe l'eau sur le radier, puis suit la rive
  // ouest jusqu'au Moulin.
  { a: "terrain", b: "gue", genre: "route", points: [[560, 382], [563, 410], [556, 438], [540, 460], [516, 476], [488, 483], [462, 481]] },
  { a: "gue", b: "moulin", genre: "route", points: [[462, 481], [446, 490], [432, 503], [418, 520], [402, 537], [379, 560]] },
];

/** Le tracé d'un lieu à son voisin, dans le sens du trajet. */
function traceEntre(de: LieuId, vers: LieuId): [number, number][] {
  const t = TRACES.find((t) => (t.a === de && t.b === vers) || (t.a === vers && t.b === de));
  if (!t) return [POINTS[de], POINTS[vers]];
  return t.a === de ? t.points : [...t.points].reverse();
}

const ENCRE = "#3b2a1e";

export function dessinCarte(): string {
  const arbres = (cx: number, cy: number, n: number, rx: number, ry: number, graine: number) => {
    let s = graine;
    const alea = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    let out = "";
    for (let i = 0; i < n; i++) {
      const x = cx + (alea() - 0.5) * rx * 2;
      const y = cy + (alea() - 0.5) * ry * 2;
      const r = 5 + alea() * 3;
      out += `<path d="M${x - r} ${y + r * 0.6} q${r} ${-r * 2.4} ${r * 2} 0 z" class="arbre"/><path d="M${x} ${y + r * 0.6} v3" class="trait-fin"/>`;
    }
    return out;
  };
  const sommets = () => {
    let out = "";
    const pics: [number, number, number][] = [
      [300, 120, 26], [340, 100, 34], [385, 115, 28], [430, 88, 40], [478, 104, 30], [650, 92, 38], [700, 112, 28], [742, 96, 34], [790, 118, 26], [835, 104, 30], [530, 70, 30], [600, 60, 26],
    ];
    for (const [x, y, h] of pics) {
      out += `<path d="M${x - h} ${y + h * 0.7} L${x} ${y - h * 0.5} L${x + h} ${y + h * 0.7}" class="mont"/>`;
      out += `<path d="M${x - h * 0.22} ${y - h * 0.2} L${x} ${y - h * 0.5} L${x + h * 0.25} ${y - h * 0.16}" class="neige"/>`;
      for (let k = 1; k < 5; k++) out += `<path d="M${x + k * h * 0.17} ${y - h * 0.5 + k * h * 0.24} l${-h * 0.12} ${h * 0.2}" class="trait-fin"/>`;
    }
    return out;
  };
  const champs = () => {
    const parcelles: [number, number, number, number, number][] = [
      [70, 230, 70, 46, -4], [150, 220, 60, 50, 3], [80, 290, 52, 60, 2], [200, 270, 78, 44, -2], [60, 370, 66, 54, 5], [190, 410, 70, 46, -3], [110, 450, 60, 50, 1], [230, 470, 64, 40, 4],
    ];
    return parcelles
      .map(([x, y, l, h, r]) => `<rect x="${x}" y="${y}" width="${l}" height="${h}" transform="rotate(${r} ${x + l / 2} ${y + h / 2})" class="champ"/>`)
      .join("");
  };
  const ville = () => {
    let out = "";
    let s = 7;
    const alea = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 46; i++) {
      const x = 720 + alea() * 200;
      const y = 160 + alea() * 150;
      const d = Math.hypot(x - 820, y - 235);
      if (d > 110) continue;
      out += `<rect x="${x}" y="${y}" width="${8 + alea() * 12}" height="${6 + alea() * 10}" class="ilot"/>`;
    }
    return out;
  };

  return `
  <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Carte de la région">
    <defs>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="b"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0.16 0"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
      <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
        <stop offset="60%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#5a3d1e" stop-opacity="0.38"/>
      </radialGradient>
      <pattern id="hachures-mer" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
        <path d="M0 5 H10" stroke="#5f8590" stroke-width="0.8" opacity="0.45"/>
      </pattern>
      <pattern id="roseaux" width="14" height="12" patternUnits="userSpaceOnUse">
        <path d="M3 10 v-6 M6 10 v-8 M9 10 v-5" stroke="#6b7a4a" stroke-width="0.9"/>
      </pattern>
    </defs>

    <!-- Le papier -->
    <rect x="0" y="0" width="1000" height="700" fill="#ecdfbf"/>
    <rect x="0" y="0" width="1000" height="700" fill="#ecdfbf" filter="url(#grain)"/>
    <circle cx="840" cy="560" r="48" fill="#b98a4e" opacity="0.08"/>
    <circle cx="846" cy="566" r="40" fill="none" stroke="#a87a42" stroke-width="2" opacity="0.15"/>

    <!-- Tout ce qui n'est pas encore ouvert, à l'encre pâlie -->
    <g class="estompe">
      <path d="M0 646 C150 622 250 660 400 634 S650 604 800 628 S950 618 1000 632 L1000 700 L0 700 Z" fill="#c9d6d2"/>
      <path d="M0 646 C150 622 250 660 400 634 S650 604 800 628 S950 618 1000 632 L1000 700 L0 700 Z" fill="url(#hachures-mer)"/>
      <path d="M0 646 C150 622 250 660 400 634 S650 604 800 628 S950 618 1000 632" class="cote"/>
      <text x="520" y="676" class="nom-zone">La Mer</text>
      <text x="640" y="618" class="nom-lieu">Côte des Flots</text>
      <path d="M880 600 l-5 -22 h10 z" class="trait"/><circle cx="880" cy="574" r="3" class="trait"/>
      <rect x="90" y="560" width="190" height="64" rx="30" fill="url(#roseaux)" opacity="0.8"/>
      <text x="120" y="552" class="nom-lieu">Les Marais</text>
      ${sommets()}
      <ellipse cx="590" cy="128" rx="46" ry="20" fill="#bdd0cf" stroke="#5f8590" stroke-width="1.2"/>
      <path d="M556 146 L624 146" stroke="${ENCRE}" stroke-width="3"/>
      <text x="590" y="132" class="nom-petit" text-anchor="middle">Lac du Barrage</text>
      <text x="575" y="40" class="nom-zone">Les Monts</text>
      ${arbres(600, 240, 48, 110, 60, 3)}
      <text x="600" y="214" class="nom-lieu" text-anchor="middle">Forêt de la Combe</text>
      ${ville()}
      <text x="820" y="150" class="nom-zone" text-anchor="middle">La Ville</text>
      <ellipse cx="858" cy="262" rx="22" ry="14" class="crayon-trait"/>
      <text x="884" y="292" class="crayon">NON.</text>
      <g transform="translate(780 400)">
        <rect x="0" y="0" width="30" height="20" class="ilot"/><rect x="40" y="10" width="44" height="26" class="ilot"/><rect x="100" y="0" width="34" height="30" class="ilot"/>
        <path d="M60 10 v-26 M66 10 v-30" class="trait"/>
        ${Array.from({ length: 6 }, (_, i) => `<path d="M${i * 22} 70 l16 -8" class="trait-fin"/>`).join("")}
      </g>
      <text x="850" y="500" class="nom-zone" text-anchor="middle">Zone industrielle</text>
      ${champs()}
      <text x="160" y="200" class="nom-zone">La Campagne</text>
      <circle cx="110" cy="235" r="3" class="trait"/><text x="64" y="256" class="nom-petit">manoir</text>
      <g transform="translate(130 335)"><rect x="-8" y="-6" width="16" height="12" class="ilot"/><rect x="10" y="-2" width="10" height="10" class="ilot"/></g>
      <text x="112" y="364" class="nom-petit">village</text>
      <!-- Routes vers le reste de la région -->
      <path d="M560 382 C620 330 690 290 760 250" class="route-pale"/>
      <path d="M560 382 C660 400 760 430 960 440" class="route-pale"/>
      <path d="M560 382 C580 470 620 540 650 610" class="route-pale"/>
      <path d="M560 382 C570 300 585 220 590 150" class="route-pale"/>
      <path d="M300 380 C240 370 190 350 140 336" class="route-pale"/>
      <path d="M300 380 C290 440 240 520 200 580" class="route-pale"/>
    </g>

    <!-- La rivière : du barrage à la mer, en contournant le terrain par l'ouest -->
    <path d="M592 148 C560 210 520 250 510 300 S486 370 490 394 S476 470 430 520 S300 600 220 640" class="riviere"/>
    <text x="318" y="618" class="nom-petit" transform="rotate(-26 318 618)">la rivière</text>

    <!-- Le chemin de halage, sur la rive est (0.8) : on part du Moulin par là, vers le gué -->
    <path d="M${HALAGE.map((p) => p.join(" ")).join(" L")}" fill="none" stroke="#6b4a2e" stroke-width="1.5" stroke-dasharray="1.5 3.5" stroke-linecap="round"/>
    <text x="446" y="550" class="crayon petit" transform="rotate(-50 446 550)">halage</text>

    <!-- La route de la Campagne, les chemins de terre de la Coopérative (depuis la station, depuis le Carrefour), la route du gué -->
    ${TRACES.map((t) => `<path d="M${t.points.map((p) => p.join(" ")).join(" L")}" class="${t.genre}"/>`).join("")}
    <path d="M482 386 h18 M482 402 h18" class="trait"/>
    <text x="474" y="378" class="crayon petit">le pont tient</text>

    <!-- Itinéraire au crayon -->
    <path d="M560 395 C520 410 460 420 410 418" class="pointilles"/>
    <text x="438" y="436" class="crayon">1re sortie</text>

    <!-- Les lieux -->
    <g class="lieu" data-lieu="terrain" transform="translate(560 382)" tabindex="0" role="button" aria-label="Ton terrain">
      <circle r="22" class="zone-clic"/>
      <rect x="-11" y="-11" width="22" height="22" class="enclos"/>
      <path d="M-5 4 l5 -9 l5 9 z" fill="#c8362b" stroke="${ENCRE}" stroke-width="1.2"/>
      <text y="34" text-anchor="middle" class="nom-ouvert">Ton terrain</text>
      <text x="16" y="-14" class="crayon petit">chez moi</text>
    </g>
    <g class="lieu" data-lieu="station" transform="translate(402 404)" tabindex="0" role="button" aria-label="La station-service">
      <circle r="22" class="zone-clic"/>
      <rect x="-12" y="-7" width="24" height="4" fill="${ENCRE}"/>
      <path d="M-9 -3 v10 M9 -3 v10" class="trait"/>
      <rect x="-4" y="1" width="8" height="7" fill="#c8362b" stroke="${ENCRE}" stroke-width="1"/>
      <text y="30" text-anchor="middle" class="nom-ouvert">Station-service</text>
      <text x="-112" y="52" class="crayon petit">panneau solaire sur l'auvent !</text>
      <text x="-98" y="68" class="crayon petit">ça dort, dans le coin…</text>
    </g>
    <g class="lieu" data-lieu="comptoir" transform="translate(300 380)" tabindex="0" role="button" aria-label="Le Comptoir du Carrefour">
      <circle r="22" class="zone-clic"/>
      <path d="M-12 0 h24 M0 -12 v24" class="trait"/>
      <rect x="-7" y="-7" width="14" height="14" fill="#ecdfbf" stroke="${ENCRE}" stroke-width="1.6"/>
      <text y="-20" text-anchor="middle" class="nom-ouvert">Comptoir du Carrefour</text>
      <g transform="translate(-122 -4) rotate(-9)">
        <rect x="0" y="0" width="92" height="22" rx="3" class="tampon"/>
        <text x="46" y="15" text-anchor="middle" class="tampon-texte">COMPTEURS · VÉRIFIÉ</text>
      </g>
      <text x="-128" y="44" class="crayon petit">on y dépose ses batteries</text>
    </g>
    <g class="lieu" data-lieu="cooperative" transform="translate(376 296)" tabindex="0" role="button" aria-label="La Coopérative du Plateau">
      <circle r="24" class="zone-clic"/>
      <rect x="-15" y="-6" width="24" height="13" fill="#ecdfbf" stroke="${ENCRE}" stroke-width="1.6"/>
      <path d="M-15 -6 l12 -6 l12 6" fill="none" stroke="${ENCRE}" stroke-width="1.4"/>
      <circle cx="13" cy="-6" r="4" fill="#ecdfbf" stroke="${ENCRE}" stroke-width="1.3"/>
      <circle cx="13" cy="4" r="4" fill="#ecdfbf" stroke="${ENCRE}" stroke-width="1.3"/>
      <text x="-20" y="-8" text-anchor="end" class="nom-ouvert">Coopérative</text>
      <text x="24" y="-4" class="crayon petit">plein d'Éteints.</text>
      <text x="24" y="11" class="crayon petit">noir dedans</text>
    </g>
    <!-- Le gué : le radier en travers du courant, ses balises rouge et blanc, les piles du pont emporté en amont -->
    <g class="lieu" data-lieu="gue" transform="translate(462 481)" tabindex="0" role="button" aria-label="Le Gué-aux-Saules">
      <circle r="22" class="zone-clic"/>
      <g transform="rotate(34)">
        <path d="M-7 -13 v6 M7 -13 v4" class="trait"/>
        <path d="M-7 -13 q5 7 10 3" class="trait-fin"/>
        <rect x="-13" y="-3" width="26" height="6" fill="#ecdfbf" stroke="${ENCRE}" stroke-width="1.3"/>
        <path d="M-9 0 h4 M-2 0 h4 M5 0 h4" stroke="#5f8590" stroke-width="1.1" stroke-linecap="round"/>
        <rect x="-16" y="-4.5" width="3" height="9" fill="#c8362b" stroke="${ENCRE}" stroke-width="0.8"/>
        <rect x="13" y="-4.5" width="3" height="9" fill="#c8362b" stroke="${ENCRE}" stroke-width="0.8"/>
        <path d="M-16 -1.5 h3 M-16 1.5 h3 M13 -1.5 h3 M13 1.5 h3" stroke="#ecdfbf" stroke-width="1"/>
      </g>
      <text x="16" y="28" class="nom-ouvert">Gué-aux-Saules</text>
      <text x="18" y="45" class="crayon petit">le pont est parti : à gué</text>
    </g>
    <!-- Le Moulin du Gué : la minoterie au bord de l'eau, sa roue à aubes arrêtée -->
    <g class="lieu" data-lieu="moulin" transform="translate(379 560)" tabindex="0" role="button" aria-label="Le Moulin du Gué">
      <circle r="24" class="zone-clic"/>
      <rect x="-16" y="-7" width="17" height="14" fill="#ecdfbf" stroke="${ENCRE}" stroke-width="1.6"/>
      <path d="M-17.5 -7 l9 -7 l9 7" fill="none" stroke="${ENCRE}" stroke-width="1.4"/>
      <rect x="-11" y="0" width="4" height="7" fill="${ENCRE}"/>
      <circle cx="9" cy="2" r="8" fill="#ecdfbf" stroke="${ENCRE}" stroke-width="1.5"/>
      <path d="M9 -6 v16 M1 2 h16 M3.3 -3.7 l11.4 11.4 M14.7 -3.7 l-11.4 11.4" class="trait-fin"/>
      ${Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return `<path d="M${(9 + Math.cos(a) * 8).toFixed(1)} ${(2 + Math.sin(a) * 8).toFixed(1)} L${(9 + Math.cos(a) * 10.5).toFixed(1)} ${(2 + Math.sin(a) * 10.5).toFixed(1)}" class="trait"/>`;
      }).join("")}
      <circle cx="9" cy="2" r="2.2" fill="#c8362b" stroke="${ENCRE}" stroke-width="0.8"/>
      <text x="-24" y="4" text-anchor="end" class="nom-ouvert">Moulin du Gué</text>
      <text x="14" y="26" class="crayon petit">la roue ne tourne plus</text>
    </g>

    <!-- Le pion -->
    <g class="pion" transform="translate(560 382)">
      <path d="M0 0 C-7 -10 -9 -14 -9 -19 a9 9 0 0 1 18 0 C9 -14 7 -10 0 0 z" fill="#c8362b" stroke="${ENCRE}" stroke-width="1.4"/>
      <circle cx="0" cy="-19" r="3.4" fill="#ecdfbf"/>
    </g>
    <path class="trace" d="" />

    <!-- Rose des vents, échelle, cartouche -->
    <g transform="translate(930 80)" class="rose">
      <circle r="30" fill="none" stroke="${ENCRE}" stroke-width="1"/>
      <path d="M0 -38 L6 0 L0 38 L-6 0 Z" fill="${ENCRE}"/>
      <path d="M-38 0 L0 6 L38 0 L0 -6 Z" fill="#ecdfbf" stroke="${ENCRE}" stroke-width="1"/>
      <text y="-44" text-anchor="middle" class="nom-petit">N</text>
    </g>
    <g transform="translate(40 664)">
      <path d="M0 0 h159" stroke="${ENCRE}" stroke-width="2"/>
      ${[0, 53, 106, 159].map((x, i) => `<path d="M${x} -5 v10" stroke="${ENCRE}" stroke-width="1.5"/><text x="${x}" y="-9" text-anchor="middle" class="nom-petit">${i}</text>`).join("")}
      <text x="172" y="4" class="nom-petit">km</text>
    </g>
    <g transform="translate(704 646)">
      <rect x="0" y="0" width="280" height="44" fill="#efe4c7" stroke="${ENCRE}" stroke-width="1.4"/>
      <rect x="4" y="4" width="272" height="36" fill="none" stroke="${ENCRE}" stroke-width="0.6"/>
      <text x="140" y="19" text-anchor="middle" class="cartouche">CARTE DE LA RÉGION</text>
      <text x="140" y="33" text-anchor="middle" class="cartouche-petit">établie avant la Grande Panne</text>
    </g>

    <!-- Plis du papier et usure -->
    <path d="M333 0 V700 M666 0 V700 M0 350 H1000" stroke="#fff" stroke-width="1.5" opacity="0.35"/>
    <path d="M334 0 V700 M667 0 V700 M0 351 H1000" stroke="#7a5a3c" stroke-width="0.8" opacity="0.18"/>
    <rect x="0" y="0" width="1000" height="700" fill="url(#vignette)" pointer-events="none"/>
  </svg>`;
}

export class Carte {
  private readonly racine: HTMLElement;
  private readonly fiche: HTMLElement;
  private readonly pion: SVGGElement;
  private readonly trace: SVGPathElement;
  private lieu: LieuJouable = "terrain";
  /** Les lieux où mène la sortie où se tient le joueur (vide s'il n'est pas à une sortie). */
  private sorties: readonly LieuId[] = [];
  private choisi: LieuId = "station";
  private enRoute = false;
  private animation = 0;
  private readonly partir: (vers: LieuId) => void;

  constructor(racine: HTMLElement, partir: (vers: LieuId) => void) {
    this.racine = racine;
    this.partir = partir;
    // La fiche du lieu est la marge de légende de la feuille, comme dans un atlas (avis de Sally, 2026-10-08) : elle ne
    // flotte plus à part, et ne recouvre jamais le dessin (pion, lieu choisi, route).
    racine.innerHTML = `
      <div class="carte-feuille">${dessinCarte()}<aside class="carte-fiche"></aside></div>`;
    racine.setAttribute("role", "dialog");
    racine.setAttribute("aria-modal", "true");
    racine.setAttribute("aria-labelledby", "titre-carte-fiche");
    this.fiche = racine.querySelector(".carte-fiche")!;
    // Un clic sur le fond sombre ferme la carte : seulement si le geste commence ET finit sur le fond (un défilement
    // commencé dans la fiche ne ferme rien). Pendant un voyage, rien.
    let surLeFond = false;
    racine.addEventListener("pointerdown", (e) => (surLeFond = e.target === racine));
    racine.addEventListener("click", (e) => {
      if (surLeFond && e.target === racine) this.fermer();
      surLeFond = false;
    });
    this.pion = racine.querySelector(".pion")!;
    this.trace = racine.querySelector(".trace")!;
    for (const g of racine.querySelectorAll<SVGGElement>(".lieu")) {
      const choisir = () => {
        if (this.enRoute) return;
        this.choisi = g.dataset.lieu as LieuId;
        this.dessinerFiche();
      };
      g.addEventListener("click", choisir);
      g.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && choisir());
    }
    this.fiche.addEventListener("click", (e) => {
      const bouton = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!bouton || bouton.disabled) return;
      if (bouton.dataset.action === "fermer") this.fermer();
      if (bouton.dataset.action === "partir") this.partir(this.choisi);
    });
  }

  get ouverte(): boolean {
    return !this.racine.hidden;
  }

  /** `sorties` : les destinations de la sortie où se tient le joueur, s'il y est (la première est proposée). */
  ouvrir(lieu: LieuJouable, sorties: readonly LieuId[]): void {
    if (this.enRoute) return;
    this.lieu = lieu;
    this.sorties = sorties;
    // Sans sortie sous les pieds, on propose le lieu voisin sur la route (vers le terrain, sauf depuis le terrain).
    this.choisi = sorties[0] ?? (lieu === "terrain" ? "station" : etapeVers(lieu, "terrain"));
    this.placerPion(POINTS[lieu]);
    this.trace.setAttribute("d", "");
    this.dessinerFiche();
    const dejaOuverte = this.ouverte;
    this.racine.hidden = false;
    if (!dejaOuverte) {
      this.focusAvant = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.racine.querySelector<SVGGElement>(`.lieu[data-lieu="${this.choisi}"]`)?.focus({ preventScroll: true });
    }
  }

  /** Ce qui avait le focus avant l'ouverture : il le retrouve à la fermeture. */
  private focusAvant: HTMLElement | null = null;

  fermer(): void {
    if (this.enRoute) return;
    this.racine.hidden = true;
    this.focusAvant?.focus({ preventScroll: true });
    this.focusAvant = null;
  }

  basculer(lieu: LieuJouable, sortie: readonly LieuId[]): void {
    if (this.ouverte) this.fermer();
    else this.ouvrir(lieu, sortie);
  }

  /** Le trajet : le pion suit la route, une trace de pas derrière lui. */
  voyager(de: LieuId, vers: LieuId, dureeS: number): void {
    this.ouvrir(de, []);
    this.enRoute = true;
    this.choisi = vers;
    this.dessinerFiche();
    const chemin = traceEntre(de, vers);
    const longueurs = chemin.slice(1).map((p, i) => Math.hypot(p[0] - chemin[i]![0], p[1] - chemin[i]![1]));
    const total = longueurs.reduce((s, l) => s + l, 0);
    const debut = performance.now();
    cancelAnimationFrame(this.animation);
    const pas = () => {
      const t = Math.min(1, (performance.now() - debut) / (dureeS * 1000));
      // Un départ et une arrivée en douceur
      const u = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      let reste = u * total;
      const points: [number, number][] = [chemin[0]!];
      let pos = chemin[0]!;
      for (let i = 0; i < longueurs.length; i++) {
        const l = longueurs[i]!;
        const p0 = chemin[i]!;
        const p1 = chemin[i + 1]!;
        if (reste <= l) {
          const k = l === 0 ? 0 : reste / l;
          pos = [p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k];
          points.push(pos);
          break;
        }
        reste -= l;
        points.push(p1);
        pos = p1;
      }
      this.placerPion(pos);
      this.trace.setAttribute("d", `M${points.map((p) => p.join(" ")).join(" L")}`);
      // Le trait d'encre sous le titre se remplit avec le trajet.
      this.fiche.querySelector<HTMLElement>(".progression span")?.style.setProperty("width", `${(t * 100).toFixed(1)}%`);
      if (t < 1) this.animation = requestAnimationFrame(pas);
    };
    this.animation = requestAnimationFrame(pas);
  }

  /** Arrivée (le serveur a envoyé le nouveau lieu) : on referme la carte. */
  arriver(): void {
    if (!this.enRoute) return;
    cancelAnimationFrame(this.animation);
    this.enRoute = false;
    this.racine.hidden = true;
  }

  private placerPion([x, y]: [number, number]): void {
    this.pion.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  }

  private dessinerFiche(): void {
    for (const g of this.racine.querySelectorAll<SVGGElement>(".lieu")) g.classList.toggle("choisi", g.dataset.lieu === this.choisi);
    const l = LIEUX[this.choisi];
    const ici = this.choisi === this.lieu;
    // Une halte se traverse à pied : du terrain au Carrefour ou à la Coopérative, on s'arrête d'abord à la station-service.
    const etape = ici ? this.lieu : etapeVers(this.lieu, this.choisi);
    const parHalte = !ici && etape !== this.choisi;
    const km = distanceKm(this.lieu, etape);
    const kcal = Math.round(km * KCAL_PAR_KM);
    const eau = (km * EAU_PAR_KM).toFixed(2).replace(".", ",");
    let etat = "";
    let peutPartir = false;
    if (this.enRoute) etat = `<p class="en-route">En route vers ${minuscule(l.nom)}…</p>`;
    else if (ici) etat = `<p class="note">Tu es ici.</p>`;
    else if (!l.ouvert) etat = `<p class="note">Fermé pour l'instant.</p>`;
    else if (!this.sorties.includes(etape)) {
      etat = `<p class="note">${
        this.lieu === "terrain"
          ? "Pour partir, rejoins le chemin, au sud de ton terrain."
          : this.lieu === "cooperative"
            ? etape === "comptoir"
              ? "Pour partir, repasse le portail, au sud (ou glisse-toi par la brèche, à l'ouest)."
              : "Pour partir, repasse le portail, au sud."
            : this.lieu === "station" && etape === "cooperative"
              ? "Pour partir, prends le chemin de terre au nord de la route, à l'ouest de la station, jusqu'à la lisière."
              : this.lieu === "moulin"
                ? "Pour partir, repasse le pont de pierre (ou prends le chemin de halage, au bout de la levée)."
                : "Pour partir, rejoins le bout de la route, du côté de ta destination."
      }</p>`;
    } else peutPartir = true;
    const trajet = ici
      ? ""
      : `<p class="trajet"><span>≈ ${String(km).replace(".", ",")} km à pied</span><span>≈ ${kcal} kcal</span><span>≈ ${eau} L d'eau</span><span>${DUREE_VOYAGE_S} min de route</span></p>${
          parHalte ? `<p class="note">La route passe par ${minuscule(LIEUX[etape].nom)} : il faudra y passer à pied.</p>` : ""
        }`;
    // En-tête (titre, ✕), corps qui défile, pied fixe : le bouton Partir ne passe jamais sous le bord de l'écran.
    // La promesse du lieu, en une ligne, avant sa description (plan 0.8 : ce qu'on va y chercher).
    const promesse = l.promesse ? `<p><strong>${l.promesse}</strong></p>` : "";
    const corps = this.enRoute ? `<p class="trajet"><span>${DUREE_VOYAGE_S} min de route</span></p>` : `${promesse}<p>${l.description}</p>${trajet}`;
    const pied = this.enRoute
      ? `${etat}<div class="progression" aria-hidden="true"><span></span></div>`
      : ici || !peutPartir
        ? etat
        : `<button type="button" class="partir" data-action="partir">Partir</button>`;
    this.fiche.innerHTML = `
      <header><h2 id="titre-carte-fiche">${l.nom}</h2>${this.enRoute ? "" : `<button type="button" class="fermer-x" data-action="fermer" aria-label="Fermer la carte">✕</button>`}</header>
      <div class="corps" aria-live="polite">${corps}</div>
      <footer>${pied}</footer>`;
  }
}
