// La Coopérative du Plateau (Book 23 §2) : la cour de gravier et sa bascule à camions, le grillage avec son portail
// (sud) et sa brèche (ouest), le grand bâtiment — hangar à bardage métallique, libre-service vitré sous son enseigne,
// bureaux, chambre froide —, l'atelier des tracteurs et sa fosse, le quai de chargement, la cour des silos, une
// camionnette, et la forêt autour. Tout est construit d'après le plan en données (commun/src/cooperative.ts).
//
// Comme à la halte : ce qui peut cacher le personnage (toits, hauts des murs côté caméra, haut des rayonnages de
// 4 m, silos, portes) est construit à part avec ses propres matériaux, pour s'effacer (estomperToits). Le reste
// est fondu par matériau (Chantier, Assemblage + fusionnerStatique) : ≈ 80 appels de dessin pour tout le lieu.
// Le hangar, les bureaux, la chambre froide et l'atelier sont sombres : leurs intérieurs prennent des teintes plus
// froides et plus éteintes (froid()), et l'ombre des toits effacés y reste portée.

import * as THREE from "three";
import {
  ATELIER,
  BASCULE,
  BATIMENT,
  BRECHE,
  COOP,
  FOSSE,
  HAUTEUR_ATELIER,
  HAUTEUR_HANGAR,
  MOBILIER,
  MUR,
  PORTAIL,
  PORTES,
  RAYONNAGES,
  radioSurEtabli,
} from "../../../commun/src/cooperative.ts";
import type { Boite } from "../../../commun/src/lieux.ts";
import { Assemblage, NOIR, V3, X, Y, Z, placer, rouille, surface } from "./assemblage.ts";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { estomperToits, type Toit } from "./halte.ts";
import { PALETTE, aleatoire } from "./materiaux.ts";
import { Chantier, dessiner, geoToleOndulee, lierre, matiere, matiereTexture, matiereVerre, taches, textureEnduit, textureToitPlat, touffes } from "./ruine.ts";
import { bruit } from "./terrain.ts";

const L = COOP.largeur;
const P = COOP.profondeur;
/** Le socle des murs, qui reste quand le haut s'efface (m). */
const SOCLE = 1;
const H = HAUTEUR_HANGAR;
/** Hauteur de l'avant (libre-service et bureaux), toit plat, plus bas que le hangar. */
const HF = 4.4;
const FAITE = 8.6;
const HA = HAUTEUR_ATELIER;
const FAITE_A = 7;
/** Le dessus des dalles intérieures. */
const SOL = 0.06;
const B = { x0: BATIMENT.x - BATIMENT.l / 2, x1: BATIMENT.x + BATIMENT.l / 2, z0: BATIMENT.z - BATIMENT.p / 2, z1: BATIMENT.z + BATIMENT.p / 2 };
const A = { x0: ATELIER.x - ATELIER.l / 2, x1: ATELIER.x + ATELIER.l / 2, z0: ATELIER.z - ATELIER.p / 2, z1: ATELIER.z + ATELIER.p / 2 };

const BETON = 0x8f8b82;
const BETON_SOMBRE = 0x596066;
const BARDAGE_INT = 0x4c5459;
const PANNEAU_FROID = 0xaab6bc;
const VERT_COOP = 0x2f6b3a;
const BLEU_RACK = 0x2d5687;
const ORANGE_RACK = 0xc8642a;
const BOIS_PALETTE = 0x9c8261;
const GALVA = 0xb4b9ba;

/** Hauteur de passage de chaque porte (le linteau est au-dessus). */
/** Ce qu'une porte garde d'opacité quand elle s'estompe devant le personnage (voir Toit.fantome). */
const FANTOME_PORTE = 0.5;

const HAUT_PORTE: Record<string, number> = {
  libre_service_cour: 2.5,
  libre_service_hangar: 2.2,
  bureaux: 2.1,
  froide_hangar: 2.6,
  froide_arriere: 2.6,
  quai: 4,
  atelier_sud: 4.4,
  atelier_est: 2.1,
};

const _c = new THREE.Color();
const _sombre = new THREE.Color(0x2c3644);
/** Une teinte d'intérieur sombre : désaturée, assombrie, tirée vers le bleu-gris (en attendant l'éclairage dynamique). */
function froid(hex: number, k = 1): number {
  const hsl = { h: 0, s: 0, l: 0 };
  _c.setHex(hex).getHSL(hsl);
  _c.setHSL(hsl.h, hsl.s * (1 - 0.45 * k), hsl.l * (1 - 0.22 * k));
  return _c.lerp(_sombre, 0.22 * k).getHex();
}

// ---------- Les textures dessinées ----------

function textureBardage(graine: number, fond: string, rouilleForce = 1): THREE.CanvasTexture {
  const aleat = aleatoire(graine);
  const t = dessiner(512, 256, (g) => {
    g.fillStyle = fond;
    g.fillRect(0, 0, 512, 256);
    // Les nervures : un liseré clair, un creux sombre (la géométrie fait le relief, la texture le souligne).
    for (let x = 0; x < 512; x += 16) {
      g.fillStyle = "rgba(255,255,255,0.09)";
      g.fillRect(x, 0, 3, 256);
      g.fillStyle = "rgba(0,0,0,0.13)";
      g.fillRect(x + 7, 0, 2, 256);
    }
    for (let i = 0; i < 1800; i++) {
      g.fillStyle = aleat() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
      g.fillRect(aleat() * 512, aleat() * 256, 2 + aleat() * 4, 1 + aleat() * 3);
    }
    // Coulures de rouille : sous l'égout du toit et sous les rangées de fixations.
    for (let i = 0; i < 38 * rouilleForce; i++) {
      const x = Math.floor(aleat() * 32) * 16 + 4 + aleat() * 6;
      const y0 = aleat() < 0.6 ? 0 : aleat() * 160;
      const l = 30 + aleat() * 110;
      const d = g.createLinearGradient(0, y0, 0, y0 + l);
      d.addColorStop(0, `rgba(138, 72, 36, ${0.35 + aleat() * 0.3})`);
      d.addColorStop(1, "rgba(138, 72, 36, 0)");
      g.fillStyle = d;
      g.fillRect(x, y0, 2 + aleat() * 5, l);
    }
    taches(g, aleat, 8, "rgba(120, 66, 34, 0.3)", 6, 22, 512, 256);
    const p = g.createLinearGradient(0, 196, 0, 256);
    p.addColorStop(0, "rgba(0,0,0,0)");
    p.addColorStop(1, "rgba(64, 70, 48, 0.55)");
    g.fillStyle = p;
    g.fillRect(0, 196, 512, 60);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Des parpaings (4 × 2 m par motif) : blocs de 50 × 20 cm, joints, humidité au pied. */
function textureParpaings(graine: number): THREE.CanvasTexture {
  const aleat = aleatoire(graine);
  const t = dessiner(256, 128, (g) => {
    g.fillStyle = "#6f6c65";
    g.fillRect(0, 0, 256, 128);
    for (let r = 0; r < 10; r++) {
      for (let col = -1; col < 9; col++) {
        const x = col * 32 + (r % 2) * 16;
        const v = 140 + Math.floor(aleat() * 28);
        g.fillStyle = `rgb(${v},${v - 3},${v - 10})`;
        g.fillRect(x + 1, r * 12.8 + 1, 30, 10.8);
      }
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = aleat() < 0.5 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)";
      g.fillRect(aleat() * 256, aleat() * 128, 1 + aleat() * 2, 1 + aleat() * 2);
    }
    taches(g, aleat, 5, "rgba(60, 64, 50, 0.25)", 8, 26, 256, 128);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** L'enseigne : vert coopérative, lettres crème, un épi de blé ; délavée, coulures, une lettre qui manque. */
function textureEnseigne(): THREE.CanvasTexture {
  const aleat = aleatoire(2390);
  return dessiner(1536, 128, (g) => {
    g.fillStyle = "#2f6b3a";
    g.fillRect(0, 0, 1536, 128);
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 5;
    g.strokeRect(10, 10, 1516, 108);
    // L'épi de blé
    const epi = (x0: number, s: number) => {
      g.strokeStyle = "#e3c56a";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x0, 108);
      g.quadraticCurveTo(x0 + 6 * s, 64, x0 + 2 * s, 22);
      g.stroke();
      g.fillStyle = "#e3c56a";
      for (let i = 0; i < 6; i++) {
        const y = 30 + i * 12;
        for (const c of [-1, 1]) {
          g.beginPath();
          g.ellipse(x0 + 3 * s + c * 9, y, 5, 10, c * 0.5, 0, Math.PI * 2);
          g.fill();
        }
      }
    };
    epi(70, 1);
    epi(1466, -1);
    g.fillStyle = "#efe6cc";
    g.font = "bold 80px 'Avenir Next', 'Helvetica Neue', Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("COOPÉRATIVE DU PLATEAU", 768, 68, 1240);
    // Délavée : voile, coulures, salissures
    g.fillStyle = "rgba(233, 223, 198, 0.12)";
    g.fillRect(0, 0, 1536, 128);
    for (let i = 0; i < 40; i++) {
      const x = aleat() * 1536;
      const l = 20 + aleat() * 90;
      const d = g.createLinearGradient(0, 0, 0, l);
      d.addColorStop(0, "rgba(40, 36, 28, 0.35)");
      d.addColorStop(1, "rgba(40, 36, 28, 0)");
      g.fillStyle = d;
      g.fillRect(x, 0, 2 + aleat() * 5, l);
    }
    taches(g, aleat, 14, "rgba(40, 40, 30, 0.25)", 10, 40, 1536, 128);
  });
}

/** Le panneau du portail, et ce que les survivants y ont ajouté à la bombe. */
function texturePanneauPortail(): THREE.CanvasTexture {
  const aleat = aleatoire(2391);
  return dessiner(512, 256, (g) => {
    g.fillStyle = "#e7dfc9";
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#2f6b3a";
    g.fillRect(0, 0, 512, 78);
    g.fillStyle = "#efe6cc";
    g.font = "bold 40px 'Avenir Next', Arial, sans-serif";
    g.textAlign = "center";
    g.fillText("COOPÉRATIVE DU PLATEAU", 256, 54, 480);
    g.fillStyle = "#2b2f2a";
    g.font = "26px 'Avenir Next', Arial, sans-serif";
    g.fillText("Approvisionnement agricole · Libre-service", 256, 118, 480);
    g.fillText("Lundi – samedi : 8 h – 12 h · 14 h – 18 h", 256, 156, 480);
    g.fillText("Pont-bascule 50 t — se présenter à l'accueil", 256, 192, 480);
    // À la bombe rouge, de travers
    g.save();
    g.translate(256, 150);
    g.rotate(-0.12);
    g.fillStyle = "rgba(178, 34, 28, 0.9)";
    g.font = "bold italic 58px 'Marker Felt', 'Comic Sans MS', sans-serif";
    g.fillText("ÉTEINTS DEDANS", 0, 20);
    g.restore();
    taches(g, aleat, 10, "rgba(80, 70, 50, 0.3)", 8, 30, 512, 256);
  });
}

/** Une affiche de promotion collée sur la vitrine, jaunie. */
function textureAffichePromo(texte: string, sous: string, fond: string): THREE.CanvasTexture {
  const aleat = aleatoire(texte.length * 31);
  return dessiner(128, 160, (g) => {
    g.fillStyle = fond;
    g.fillRect(0, 0, 128, 160);
    g.fillStyle = "#c8362b";
    g.font = "bold 34px Arial, sans-serif";
    g.textAlign = "center";
    g.fillText(texte, 64, 60, 120);
    g.fillStyle = "#1d2433";
    g.font = "bold 15px Arial, sans-serif";
    g.fillText(sous, 64, 100, 120);
    g.font = "12px Arial, sans-serif";
    g.fillText("Coopérative du Plateau", 64, 140, 120);
    g.fillStyle = "rgba(240, 225, 170, 0.25)";
    g.fillRect(0, 0, 128, 160);
    taches(g, aleat, 4, "rgba(120, 100, 60, 0.3)", 6, 20, 128, 160);
  });
}

function textureCarrelage(): THREE.CanvasTexture {
  const aleat = aleatoire(2392);
  const t = dessiner(128, 128, (g) => {
    g.fillStyle = "#8f877a";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const v = 196 + Math.floor(aleat() * 14);
        g.fillStyle = `rgb(${v},${v - 8},${v - 22})`;
        g.fillRect(i * 32 + 1, j * 32 + 1, 30, 30);
      }
    }
    taches(g, aleat, 5, "rgba(90, 80, 60, 0.18)", 6, 20, 128, 128);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Le grillage à mailles losanges : transparent entre les fils (au loin, un voile gris). */
function textureGrillage(): THREE.CanvasTexture {
  const t = dessiner(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.strokeStyle = "rgba(182, 188, 190, 1)";
    g.lineWidth = 3;
    for (const d of [-64, 0, 64]) {
      g.beginPath();
      g.moveTo(d, 0);
      g.lineTo(d + 64, 64);
      g.moveTo(d + 64, 0);
      g.lineTo(d, 64);
      g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Le chemin agricole qui arrive au portail : deux ornières de terre, l'herbe au milieu. */
function textureChemin(): THREE.CanvasTexture {
  const aleat = aleatoire(2393);
  return dessiner(128, 1024, (g) => {
    g.fillStyle = "#9d8e70";
    g.fillRect(0, 0, 128, 1024);
    for (let i = 0; i < 5000; i++) {
      const v = 120 + aleat() * 60;
      g.fillStyle = `rgba(${v},${v - 10},${v - 30},0.5)`;
      g.fillRect(aleat() * 128, aleat() * 1024, 1 + aleat() * 2, 1 + aleat() * 2);
    }
    // L'herbe du milieu et des bords : des brins, plus serrés au centre et sur les rives
    const brins = (x0: number, largeur: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const y = aleat() * 1024;
        const x = x0 + (aleat() + aleat() - 1) * largeur + Math.sin(y * 0.02) * 3;
        g.strokeStyle = `rgba(${100 + aleat() * 30}, ${132 + aleat() * 26}, ${64 + aleat() * 16}, 0.8)`;
        g.lineWidth = 1.5 + aleat() * 1.5;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (aleat() - 0.5) * 4, y - 3 - aleat() * 5);
        g.stroke();
      }
    };
    brins(64, 9, 5000);
    brins(6, 8, 4000);
    brins(122, 8, 4000);
    taches(g, aleat, 14, "rgba(80, 70, 50, 0.35)", 6, 18, 128, 1024);
    taches(g, aleat, 8, "rgba(70, 82, 90, 0.4)", 5, 12, 128, 1024);
  });
}

/** Le sol de la cour (80 × 60 m, 12,8 px/m) : gravier, dalles de béton fissurées, ornières, herbes, flaques. */
function textureCour(): THREE.CanvasTexture {
  const aleat = aleatoire(2318);
  const k = 1024 / L;
  return dessiner(1024, 768, (g) => {
    g.fillStyle = "#a39a86";
    g.fillRect(0, 0, 1024, 768);
    for (let i = 0; i < 26000; i++) {
      const v = 120 + aleat() * 75;
      g.fillStyle = `rgba(${v},${v - 6},${v - 18},0.55)`;
      g.fillRect(aleat() * 1024, aleat() * 768, 1 + aleat() * 2, 1 + aleat() * 2);
    }
    taches(g, aleat, 34, "rgba(112, 98, 72, 0.22)", 20, 70, 1024, 768);

    const fissure = (x: number, z: number, n: number) => {
      let a = aleat() * Math.PI * 2;
      const pts: [number, number][] = [[x, z]];
      for (let i = 0; i < n; i++) {
        a += (aleat() - 0.5) * 1.1;
        x += Math.cos(a) * (0.4 + aleat() * 0.6);
        z += Math.sin(a) * (0.4 + aleat() * 0.6);
        pts.push([x, z]);
      }
      for (const [style, w] of [["rgba(96, 124, 62, 0.18)", 2.5], ["rgba(46, 42, 36, 0.55)", 1]] as const) {
        g.strokeStyle = style;
        g.lineWidth = w;
        g.beginPath();
        pts.forEach(([px, pz], i) => (i ? g.lineTo(px * k, pz * k) : g.moveTo(px * k, pz * k)));
        g.stroke();
      }
    };
    const dalle = (x0: number, z0: number, x1: number, z1: number, ton: string) => {
      g.fillStyle = ton;
      g.fillRect(x0 * k, z0 * k, (x1 - x0) * k, (z1 - z0) * k);
      for (let i = 0; i < (x1 - x0) * (z1 - z0) * 12; i++) {
        g.fillStyle = aleat() < 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
        g.fillRect((x0 + aleat() * (x1 - x0)) * k, (z0 + aleat() * (z1 - z0)) * k, 2, 2);
      }
      g.strokeStyle = "rgba(66, 62, 54, 0.45)";
      g.lineWidth = 1.2;
      g.beginPath();
      for (let x = x0 + 4; x < x1; x += 4) {
        g.moveTo(x * k, z0 * k);
        g.lineTo(x * k, z1 * k);
      }
      for (let z = z0 + 4; z < z1; z += 4) {
        g.moveTo(x0 * k, z * k);
        g.lineTo(x1 * k, z * k);
      }
      g.stroke();
      for (let i = 0; i < ((x1 - x0) * (z1 - z0)) / 30; i++) fissure(x0 + aleat() * (x1 - x0), z0 + aleat() * (z1 - z0), 5 + Math.floor(aleat() * 10));
      taches(g, aleat, Math.ceil(((x1 - x0) * (z1 - z0)) / 60), "rgba(70, 64, 54, 0.2)", 8, 30, 1024, 768);
    };
    // Les dalles : le parvis du libre-service, le quai, devant l'atelier, autour des silos
    dalle(31, 40.2, 77, 47.5, "#b2ada2");
    dalle(27.5, 16.5, 34, 35.5, "#aaa598");
    dalle(4.5, 34, 29.5, 39, "#a7a297");
    dalle(8, 1, 29, 10.5, "#a9a59c");
    dalle(74, 6, 79, 42, "#a8a397");

    // Les ornières des camions : du portail vers la bascule, le quai, l'atelier
    const ornieres = (pts: [number, number][]) => {
      for (const d of [-0.95, 0.95]) {
        g.strokeStyle = "rgba(92, 80, 60, 0.32)";
        g.lineWidth = 0.42 * k;
        g.beginPath();
        pts.forEach(([x, z], i) => {
          const [nx, nz] = pts[Math.min(i + 1, pts.length - 1)]!;
          const [px, pz] = pts[Math.max(i - 1, 0)]!;
          const dx = nx - px;
          const dz = nz - pz;
          const n = Math.hypot(dx, dz) || 1;
          const ox = (-dz / n) * d;
          const oz = (dx / n) * d;
          if (i) g.lineTo((x + ox) * k, (z + oz) * k);
          else g.moveTo((x + ox) * k, (z + oz) * k);
        });
        g.stroke();
      }
    };
    ornieres([[43, 60], [44, 56], [48, 53], [52, 50], [52, 44]]);
    ornieres([[43, 60], [41, 54], [36, 46], [31, 38], [30.5, 30], [31, 20]]);
    ornieres([[42, 58], [33, 50], [22, 44], [16, 37], [15, 33]]);
    ornieres([[30, 20], [27, 14], [20, 12], [12, 12]]);

    // Les herbes : le long du grillage, au pied des murs, dans les coins
    const herbe = (x: number, z: number, r: number) => {
      const d = g.createRadialGradient(x * k, z * k, 0, x * k, z * k, r * k);
      const v = Math.floor(aleat() * 30);
      d.addColorStop(0, `rgba(${96 + v}, ${132 + v}, 66, 0.75)`);
      d.addColorStop(1, `rgba(${96 + v}, ${132 + v}, 66, 0)`);
      g.fillStyle = d;
      g.fillRect((x - r) * k, (z - r) * k, r * 2 * k, r * 2 * k);
    };
    for (let i = 0; i < 520; i++) {
      const t = aleat();
      const cote = Math.floor(aleat() * 4);
      const e = aleat() * 2.2;
      const [x, z] = cote === 0 ? [t * L, e] : cote === 1 ? [t * L, P - e] : cote === 2 ? [e, t * P] : [L - e, t * P];
      herbe(x, z, 0.6 + aleat() * 1.6);
    }
    for (let i = 0; i < 120; i++) herbe(B.x0 - 0.6 + aleat() * (B.x1 - B.x0 + 1.2), B.z0 - 0.8 - aleat() * 1.2, 0.4 + aleat() * 1);
    for (let i = 0; i < 60; i++) herbe(A.x0 - 1.5 + aleat() * 1.2, A.z0 + aleat() * (A.z1 - A.z0), 0.4 + aleat() * 1);
    for (let i = 0; i < 40; i++) herbe(A.x0 + aleat() * (A.x1 - A.x0), A.z0 - 0.4 - aleat(), 0.4 + aleat() * 0.8);

    // Flaques, huile, grain renversé près des silos
    const flaque = (x: number, z: number, rx: number, rz: number) => {
      g.save();
      g.translate(x * k, z * k);
      g.scale(1, rz / rx);
      const d = g.createRadialGradient(0, 0, 0, 0, 0, rx * k);
      d.addColorStop(0, "rgba(120, 136, 146, 0.55)");
      d.addColorStop(0.6, "rgba(96, 106, 110, 0.45)");
      d.addColorStop(0.85, "rgba(80, 76, 66, 0.35)");
      d.addColorStop(1, "rgba(80, 76, 66, 0)");
      g.fillStyle = d;
      g.beginPath();
      g.arc(0, 0, rx * k, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };
    for (const [x, z, rx, rz] of [[47, 52, 1.8, 0.9], [36.5, 48, 1.2, 0.7], [24, 41, 2.2, 1], [31, 36.5, 1, 0.6], [60, 45.5, 1.4, 0.6], [18, 11.5, 1.6, 0.8], [70, 4, 1.3, 0.8]] as const) flaque(x, z, rx, rz);
    for (const [x, z, r] of [[15, 36, 1.6], [19, 35.5, 1], [25.5, 48.5, 1.4], [30, 29, 0.8], [33, 26, 1.1], [12, 37, 0.7]] as const) {
      const d = g.createRadialGradient(x * k, z * k, 0, x * k, z * k, r * k);
      d.addColorStop(0, "rgba(30, 28, 25, 0.55)");
      d.addColorStop(1, "rgba(30, 28, 25, 0)");
      g.fillStyle = d;
      g.fillRect((x - r) * k, (z - r) * k, r * 2 * k, r * 2 * k);
    }
    for (let i = 0; i < 26; i++) {
      const x = 12 + aleat() * 14;
      const z = 7.5 + aleat() * 3;
      const r = 0.2 + aleat() * 0.7;
      const d = g.createRadialGradient(x * k, z * k, 0, x * k, z * k, r * k);
      d.addColorStop(0, "rgba(214, 182, 100, 0.75)");
      d.addColorStop(1, "rgba(214, 182, 100, 0)");
      g.fillStyle = d;
      g.fillRect((x - r) * k, (z - r) * k, r * 2 * k, r * 2 * k);
    }
    // Le trou de la fosse (le sol est découpé là : on voit la fosse en dessous)
    g.clearRect((FOSSE.x - FOSSE.l / 2) * k, (FOSSE.z - FOSSE.p / 2) * k, FOSSE.l * k, FOSSE.p * k);
  });
}

// ---------- Les morceaux de mur ----------

/** Un pan plan ou nervuré, posé sur la face d'un mur (`dehors` : la normale, ±1 selon l'axe perpendiculaire au mur). */
function face(
  ch: Chantier,
  mat: THREE.Material,
  couleur: number,
  sens: "x" | "z",
  fixe: number,
  dehors: 1 | -1,
  u0: number,
  u1: number,
  y0: number,
  y1: number,
  options: { nervures?: boolean; uEch?: number; vEch?: number; decalage?: number } = {},
): void {
  const len = u1 - u0;
  if (len < 0.02 || y1 - y0 < 0.02) return;
  const nervures = options.nervures ?? false;
  const n = nervures ? Math.max(2, Math.round(len / 0.1)) : 1;
  const geo = new THREE.PlaneGeometry(len, y1 - y0, n, 1).translate(len / 2, (y0 + y1) / 2, 0);
  const pos = geo.attributes.position!;
  const uv = geo.attributes.uv!;
  const uEch = options.uEch ?? 6;
  const vEch = options.vEch ?? 7;
  for (let i = 0; i < pos.count; i++) {
    if (nervures) {
      const kx = Math.round((pos.getX(i) / len) * n);
      pos.setZ(i, kx % 2 ? 0.035 : 0);
    }
    uv.setXY(i, (u0 + pos.getX(i)) / uEch, pos.getY(i) / vEch);
  }
  geo.computeVertexNormals();
  const d = MUR / 2 + (options.decalage ?? 0.012);
  // Le repère : x local le long du mur, z local vers le dehors.
  let pose: { x: number; z: number; ry: number };
  if (sens === "x") pose = dehors > 0 ? { x: u0, z: fixe + d, ry: 0 } : { x: u1, z: fixe - d, ry: Math.PI };
  else pose = dehors > 0 ? { x: fixe + d, z: u1, ry: Math.PI / 2 } : { x: fixe - d, z: u0, ry: -Math.PI / 2 };
  ch.poser(geo, mat, couleur, pose, { nuance: 0.03, crasse: false });
}

/** Une boîte de mur sur une ligne, de u0 à u1 et de y0 à y1. */
function pan(ch: Chantier, sens: "x" | "z", fixe: number, u0: number, u1: number, y0: number, y1: number, couleur: number, mat: THREE.Material = matiere(), ep = MUR): void {
  if (u1 - u0 < 0.02 || y1 - y0 < 0.02) return;
  if (sens === "x") ch.pave(u0, y0, fixe - ep / 2, u1, y1, fixe + ep / 2, couleur, mat, { nuance: 0.02 });
  else ch.pave(fixe - ep / 2, y0, u0, fixe + ep / 2, y1, u1, couleur, mat, { nuance: 0.02 });
}

type Habit = "bardage" | "enduit" | "panneau" | "parpaing";

interface Ligne {
  sens: "x" | "z";
  fixe: number;
  a: number;
  b: number;
  h: number;
  /** Côté de la face extérieure (habillée). */
  dehors: 1 | -1;
  /** Le chantier du haut (qui s'efface). */
  haut: Chantier;
  habit: Habit;
  /** Couleur de la face intérieure (et du cœur du mur). */
  interieur?: number;
  /** Hauteur où commence l'habillage extérieur (par défaut : le socle). */
  habitDe?: number;
}

interface Mats {
  bardage: THREE.Material;
  enduit: THREE.Material;
  parpaing: THREE.Material;
}

/** Un mur entier : découpé aux portes, socle dans le chantier fixe, le haut et les linteaux dans `haut`. */
function poserLigne(c: Chantier, l: Ligne, mats: Mats): void {
  const posPorte = (p: (typeof PORTES)[number]) => (l.sens === "x" ? p.x : p.z);
  const portes = PORTES.filter((p) => p.sens === l.sens && Math.abs((l.sens === "x" ? p.z : p.x) - l.fixe) < 0.5 && posPorte(p) > l.a && posPorte(p) < l.b).sort((p, q) => posPorte(p) - posPorte(q));
  const pleins: [number, number][] = [];
  let debut = l.a;
  for (const p of portes) {
    pleins.push([debut, posPorte(p) - p.largeur / 2]);
    debut = posPorte(p) + p.largeur / 2;
  }
  pleins.push([debut, l.b]);
  const interieur = l.interieur ?? BARDAGE_INT;
  const habiller = (u0: number, u1: number, y0: number, y1: number) => {
    y0 = Math.max(y0, l.habitDe ?? SOCLE);
    if (l.habit === "bardage") face(l.haut, mats.bardage, 0xffffff, l.sens, l.fixe, l.dehors, u0, u1, y0, y1, { nervures: true });
    else if (l.habit === "parpaing") face(l.haut, mats.parpaing, 0xffffff, l.sens, l.fixe, l.dehors, u0, u1, y0, y1, { uEch: 4, vEch: 2 });
  };
  const coeur = (ch: Chantier, u0: number, u1: number, y0: number, y1: number) => {
    if (l.habit === "enduit") pan(ch, l.sens, l.fixe, u0, u1, y0, y1, 0xffffff, mats.enduit);
    else if (l.habit === "panneau") pan(ch, l.sens, l.fixe, u0, u1, y0, y1, PANNEAU_FROID);
    else pan(ch, l.sens, l.fixe, u0, u1, y0, y1, interieur);
  };
  for (const [u0, u1] of pleins) {
    if (u1 - u0 < 0.05) continue;
    // Le socle : béton brut (parpaings pour l'atelier), il reste toujours.
    if (l.habit === "parpaing") {
      pan(c, l.sens, l.fixe, u0, u1, 0, SOCLE, 0x8a877f);
      face(c, mats.parpaing, 0xffffff, l.sens, l.fixe, l.dehors, u0, u1, 0, SOCLE, { uEch: 4, vEch: 2 });
    } else pan(c, l.sens, l.fixe, u0, u1, 0, SOCLE, l.habit === "panneau" ? PANNEAU_FROID : l.habit === "enduit" ? 0xa79d88 : BETON);
    coeur(l.haut, u0, u1, SOCLE, l.h);
    habiller(u0, u1, SOCLE, l.h);
    // Les joints des panneaux isothermes
    if (l.habit === "panneau") for (let u = u0 + 1.2; u < u1 - 0.1; u += 1.2) for (const s of [-1, 1]) {
      if (l.sens === "x") l.haut.pave(u - 0.02, SOCLE, l.fixe + s * (MUR / 2) - 0.01, u + 0.02, l.h, l.fixe + s * (MUR / 2 + 0.01), 0x7f8a90);
      else l.haut.pave(l.fixe + s * (MUR / 2) - 0.01, SOCLE, u - 0.02, l.fixe + s * (MUR / 2 + 0.01), l.h, u + 0.02, 0x7f8a90);
    }
  }
  for (const p of portes) {
    const hp = HAUT_PORTE[p.id] ?? 2.2;
    const u = posPorte(p);
    if (hp < l.h) {
      coeur(l.haut, u - p.largeur / 2, u + p.largeur / 2, hp, l.h);
      habiller(u - p.largeur / 2, u + p.largeur / 2, hp, l.h);
    }
    // Le seuil
    if (l.sens === "x") c.pave(u - p.largeur / 2, 0, l.fixe - MUR / 2, u + p.largeur / 2, SOL + 0.02, l.fixe + MUR / 2, 0x77746e);
    else c.pave(l.fixe - MUR / 2, 0, u - p.largeur / 2, l.fixe + MUR / 2, SOL + 0.02, u + p.largeur / 2, 0x77746e);
  }
}

// ---------- Les portes ----------

type GenrePorte = "battant" | "double_battant" | "coulissante" | "double_coulissante" | "rideau";

interface VuePorte {
  id: string;
  genre: GenrePorte;
  largeur: number;
  h: number;
  cote: 1 | -1;
  dir: 1 | -1;
  /** Ouverture courante (0 fermée, 1 ouverte) et voulue. */
  t: number;
  cible: number;
  pivots: THREE.Object3D[];
}

interface DefPorte {
  genre: GenrePorte;
  cote: 1 | -1;
  dir?: 1 | -1;
}

/** Comment chaque porte est faite ; `cote` : le côté du mur où elle est (et vers lequel elle s'ouvre), en z local. */
const DEF_PORTES: Record<string, DefPorte> = {
  libre_service_cour: { genre: "double_coulissante", cote: -1 },
  libre_service_hangar: { genre: "battant", cote: -1 },
  bureaux: { genre: "battant", cote: 1 },
  froide_hangar: { genre: "coulissante", cote: 1, dir: 1 },
  froide_arriere: { genre: "coulissante", cote: -1, dir: -1 },
  quai: { genre: "rideau", cote: 1 },
  atelier_sud: { genre: "double_coulissante", cote: 1 },
  atelier_est: { genre: "battant", cote: -1 },
  portail: { genre: "double_battant", cote: -1 },
};

function appliquerPorte(v: VuePorte): void {
  const t = v.t;
  const l = v.largeur;
  switch (v.genre) {
    case "battant":
      v.pivots[0]!.rotation.y = -v.cote * t * 1.5;
      break;
    case "double_battant":
      v.pivots[0]!.rotation.y = -v.cote * t * 1.35;
      v.pivots[1]!.rotation.y = v.cote * t * 1.05;
      break;
    case "coulissante":
      v.pivots[0]!.position.x = v.dir * t * l * 0.98;
      break;
    case "double_coulissante":
      v.pivots[0]!.position.x = -l / 4 - t * l * 0.48;
      v.pivots[1]!.position.x = l / 4 + t * l * 0.48;
      break;
    case "rideau":
      v.pivots[0]!.scale.y = Math.max(0.06, 1 - t * 0.94);
      break;
  }
}

/** Le battant d'une porte, dans le repère de son pivot (x le long du mur, de `x0` à `x0 + l`). */
function battant(ch: Chantier, id: string, x0: number, l: number, h: number, mats: { verre: THREE.Material; grillage: THREE.Material }): void {
  // Un seul matériau par porte (plus le verre ou le grillage) : un appel de dessin par battant.
  const acier = matiere();
  const xm = x0 + l / 2;
  if (id === "libre_service_cour") {
    // Porte vitrée coulissante : cadre d'aluminium, une vitre fendue
    ch.boite(l, 0.08, 0.06, 0x9ea3a6, { x: xm, y: 0.04 }, acier);
    ch.boite(l, 0.08, 0.06, 0x9ea3a6, { x: xm, y: h - 0.04 }, acier);
    for (const x of [x0 + 0.04, x0 + l - 0.04]) ch.boite(0.08, h, 0.06, 0x9ea3a6, { x, y: h / 2 }, acier);
    ch.boite(l - 0.1, h - 0.16, 0.02, 0xffffff, { x: xm, y: h / 2 }, mats.verre, { nuance: 0, crasse: false });
    ch.boite(l - 0.1, 0.05, 0.065, 0x9ea3a6, { x: xm, y: 1.05 }, acier);
  } else if (id === "froide_hangar" || id === "froide_arriere") {
    // Porte isotherme : épaisse, blanche, bordée d'inox, levier de fermeture
    ch.boite(l, h, 0.14, froid(0xd9dfe0, 0.6), { x: xm, y: h / 2 });
    ch.boite(l + 0.04, 0.06, 0.16, froid(0xa9aeb0, 0.6), { x: xm, y: h - 0.03 }, acier);
    ch.boite(l + 0.04, 0.3, 0.16, froid(0xa9aeb0, 0.6), { x: xm, y: 0.15 }, acier);
    for (const s of [-1, 1]) ch.boite(0.14, 0.6, 0.06, 0x8a8f94, { x: xm + s * (l / 2 - 0.25), y: 1.2, z: 0.1 }, acier);
    ch.boite(0.6, 0.06, 0.06, 0x3a3d42, { x: xm + l / 2 - 0.45, y: 1.2, z: 0.12, rz: -0.35 }, acier);
    ch.boite(l * 0.6, 0.12, 0.02, 0xc8362b, { x: xm, y: 1.75, z: 0.08 }, matiere(), { crasse: false });
  } else if (id === "quai") {
    // Rideau métallique : des lames, du pivot (en haut) vers le bas
    for (let y = -h; y < -0.05; y += 0.12) ch.boite(l, 0.11, 0.05, ch.hasard() < 0.15 ? PALETTE.rouille : 0x8d9396, { x: xm, y: y + 0.06 }, acier, { nuance: 0.06, crasse: false });
    ch.boite(l, 0.1, 0.08, 0x3a3d42, { x: xm, y: -h + 0.05 }, acier);
  } else if (id === "atelier_sud") {
    // Grand vantail de tôle sur rail, rouillé, renforts en Z
    ch.boite(l, h - 0.1, 0.06, 0x6f7a72, { x: xm, y: h / 2 + 0.05 }, acier, { nuance: 0.05 });
    for (let y = 0.4; y < h; y += 0.32) ch.boite(l, 0.05, 0.08, 0x5d675f, { x: xm, y }, acier);
    ch.poutre(new THREE.Vector3(x0 + 0.1, 0.3, 0.05), new THREE.Vector3(x0 + l - 0.1, h - 0.3, 0.05), 0.08, 0x5d675f, acier);
    // Des coulures de rouille sous les renforts
    for (let i = 0; i < 7; i++) ch.boite(0.05 + ch.hasard() * 0.06, 0.4 + ch.hasard() * 1.2, 0.065, 0x7a4a30, { x: x0 + 0.2 + ch.hasard() * (l - 0.4), y: 0.6 + ch.hasard() * (h - 1.6) }, acier, { nuance: 0.08, crasse: false });
  } else if (id === "portail") {
    // Portail tubulaire galvanisé, grillage, écharpe
    const t = (a: THREE.Vector3, b: THREE.Vector3) => ch.poutre(a, b, 0.06, GALVA, acier);
    t(new THREE.Vector3(x0 + 0.05, 0.08, 0), new THREE.Vector3(x0 + 0.05, h, 0));
    t(new THREE.Vector3(x0 + l - 0.05, 0.08, 0), new THREE.Vector3(x0 + l - 0.05, h, 0));
    t(new THREE.Vector3(x0, 0.1, 0), new THREE.Vector3(x0 + l, 0.1, 0));
    t(new THREE.Vector3(x0, h, 0), new THREE.Vector3(x0 + l, h, 0));
    t(new THREE.Vector3(x0 + 0.05, 0.1, 0), new THREE.Vector3(x0 + l - 0.05, h, 0));
    const g = new THREE.PlaneGeometry(l, h - 0.1);
    const uv = g.attributes.uv!;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (l / 0.25), uv.getY(i) * ((h - 0.1) / 0.25));
    ch.poser(g, mats.grillage, 0xffffff, { x: xm, y: h / 2 + 0.05 }, { nuance: 0, crasse: false });
  } else {
    // Porte pleine de service (bois peint ou acier), poignée, plaque de propreté
    const bois = id === "bureaux";
    const couleur = bois ? froid(0x7a5f45, 0.6) : froid(0x55606a, 0.5);
    ch.boite(l - 0.04, h - 0.02, 0.05, couleur, { x: xm, y: h / 2 }, acier, { nuance: 0.04 });
    ch.boite(l - 0.2, 0.25, 0.06, froid(0x8a8f94, 0.5), { x: xm, y: 0.2 }, acier);
    ch.boite(0.14, 0.03, 0.12, 0xb59048, { x: x0 + l - 0.12, y: 1.05 }, acier);
    if (!bois) ch.boite(l * 0.4, 0.5, 0.06, 0x24323a, { x: xm, y: 1.55 }, mats.verre, { nuance: 0, crasse: false });
  }
}

/** Fond les matériaux d'un objet dans des copies qu'on peut effacer (estomperToits). */
function fondre(objet: THREE.Object3D): THREE.Material[] {
  const copies = new Map<THREE.Material, THREE.Material>();
  objet.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.Material;
    if (mat.userData.grillage) return;
    let copie = copies.get(mat);
    if (!copie) {
      copie = mat.clone();
      copie.transparent = true;
      copie.userData = { ...mat.userData, opacite: mat.opacity };
      copies.set(mat, copie);
    }
    m.material = copie;
  });
  return [...copies.values()];
}

/** Le chantier du mur qui porte chaque porte : son rail ou son coffre s'efface avec le haut du mur. */
const MUR_DE_PORTE: Record<string, keyof Chantiers> = {
  libre_service_cour: "ta",
  libre_service_hangar: "th",
  bureaux: "th",
  froide_hangar: "tf",
  froide_arriere: "fond",
  quai: "fond",
  atelier_sud: "tt",
  atelier_est: "tt",
  portail: "c",
};

function creerPorte(p: { id: string; x: number; z: number; largeur: number; sens: "x" | "z"; ouverte: boolean }, h: number, toits: Toit[], mats: { verre: THREE.Material; grillage: THREE.Material }, chantiers: Chantiers): { objet: THREE.Group; vue: VuePorte } {
  const def = DEF_PORTES[p.id] ?? { genre: "battant", cote: 1 };
  const g = new THREE.Group();
  g.position.set(p.x, 0, p.z);
  g.rotation.y = p.sens === "z" ? -Math.PI / 2 : 0;
  const l = p.largeur;
  const zc = def.cote * (MUR / 2 + 0.06);
  const pivots: THREE.Object3D[] = [];
  const graine = p.id.length * 97 + Math.round(p.x * 13);
  const pivot = (x: number, y: number, z: number, construire: (ch: Chantier) => void) => {
    const o = new THREE.Group();
    o.position.set(x, y, z);
    const ch = new Chantier(graine + pivots.length);
    construire(ch);
    o.add(ch.construire());
    g.add(o);
    pivots.push(o);
  };
  switch (def.genre) {
    case "battant":
      pivot(-l / 2, 0, zc, (ch) => battant(ch, p.id, 0, l, h, mats));
      break;
    case "double_battant":
      pivot(-l / 2, 0, zc, (ch) => battant(ch, p.id, 0, l / 2, h, mats));
      pivot(l / 2, 0, zc, (ch) => battant(ch, p.id, -l / 2, l / 2, h, mats));
      break;
    case "coulissante":
      pivot(0, 0, zc + def.cote * 0.04, (ch) => {
        battant(ch, p.id, -l / 2 - 0.1, l + 0.2, h + 0.05, mats);
      });
      break;
    case "double_coulissante":
      pivot(-l / 4, 0, zc, (ch) => battant(ch, p.id, -l / 4 - 0.05, l / 2 + 0.1, h, mats));
      pivot(l / 4, 0, zc + def.cote * 0.08, (ch) => battant(ch, p.id, -l / 4 - 0.05, l / 2 + 0.1, h, mats));
      break;
    case "rideau":
      pivot(0, h, zc, (ch) => battant(ch, p.id, -l / 2, l, h, mats));
      break;
  }
  // Ce qui ne bouge pas (rail des portes coulissantes, coffre du rideau, montants du portail) va au chantier fixe.
  const acier = matiere();
  const c = chantiers[MUR_DE_PORTE[p.id] ?? "c"];
  c.repere({ x: p.x, z: p.z, ry: g.rotation.y }, () => {
    if (def.genre === "coulissante" || def.genre === "double_coulissante") c.boite(l * 2.2, 0.1, 0.1, 0x55524d, { x: def.genre === "coulissante" ? (def.dir ?? 1) * l * 0.5 : 0, y: h + 0.12, z: zc + def.cote * 0.06 }, acier);
    if (def.genre === "rideau") c.boite(l + 0.3, 0.45, 0.45, 0x6d7276, { y: h + 0.2, z: zc + def.cote * 0.2 }, acier);
    if (p.id === "portail") for (const s of [-1, 1]) c.boite(0.16, 2.2, 0.16, 0x7d8285, { x: s * (l / 2 + 0.1), y: 1.1 }, acier);
  });
  const materiaux = fondre(g);
  sansOmbrePortee(g);
  const r = Math.max(l, 2);
  const boite: Boite = p.sens === "x" ? { x: p.x, z: p.z, l: l + 1.2, p: r } : { x: p.x, z: p.z, l: r, p: l + 1.2 };
  // Le portail (1,9 m, ajouré) ne cache personne : il ne s'efface pas. Les autres portes s'estompent sans disparaître
  // (0.7.1) : en s'approchant de la porte des bureaux par le hangar, elle s'effaçait tout entière, et l'on ne voyait
  // plus ni la porte ni si elle était fermée ; elle reste maintenant visible, en transparence.
  if (p.id !== "portail") toits.push({ boite, materiaux, bas: 0.5, haut: h + 0.3, fantome: FANTOME_PORTE });
  const vue: VuePorte = { id: p.id, genre: def.genre, largeur: l, h, cote: def.cote, dir: def.dir ?? 1, t: p.ouverte ? 1 : 0, cible: p.ouverte ? 1 : 0, pivots };
  appliquerPorte(vue);
  g.userData.porte = p.id;
  return { objet: g, vue };
}

/**
 * Ouvre ou ferme les portes (identifiants de PORTES, et « portail »). Par défaut, tout de suite ; avec
 * `anime`, les portes y vont en douceur, à condition d'appeler animerCooperative à chaque image.
 */
export function majPortes(groupe: THREE.Object3D, etats: Record<string, boolean>, anime = false): void {
  const portes = groupe.userData.portes as VuePorte[] | undefined;
  if (!portes) return;
  for (const v of portes) {
    const e = etats[v.id];
    if (e === undefined) continue;
    v.cible = e ? 1 : 0;
    if (!anime) {
      v.t = v.cible;
      appliquerPorte(v);
    }
  }
}

/** À chaque image : les portes en mouvement (voir majPortes). */
export function animerCooperative(groupe: THREE.Object3D, dt: number): void {
  const portes = groupe.userData.portes as VuePorte[] | undefined;
  if (!portes) return;
  for (const v of portes) {
    if (v.t === v.cible) continue;
    const pas = dt * (v.genre === "rideau" ? 0.8 : 2.2);
    v.t = v.cible > v.t ? Math.min(v.cible, v.t + pas) : Math.max(v.cible, v.t - pas);
    appliquerPorte(v);
  }
}

/**
 * Les toits, hauts de murs, hauts de rayonnages, silos et portes qui cachent le personnage s'effacent
 * (le mécanisme de la halte). `lacet` : l'angle horizontal de la caméra.
 */
export function estomperCooperative(groupe: THREE.Object3D, x: number, z: number, dt: number, lacet = Math.PI / 4): void {
  estomperToits(groupe, x, z, dt, lacet);
}

// ---------- Le sol ----------

function creerSols(aleat: () => number): THREE.Group {
  const g = new THREE.Group();
  const n = bruit(aleat, 64);
  // L'herbe autour, sans rien sous la cour (la cour a son propre sol, et la fosse y est un vrai trou).
  const geo = new THREE.PlaneGeometry(160, 140, 64, 56).rotateX(-Math.PI / 2).translate(40, 0, 30).toNonIndexed();
  const pos = geo.attributes.position!;
  const garde: number[] = [];
  const couleurs: number[] = [];
  const c = new THREE.Color();
  const seche = new THREE.Color(PALETTE.herbeSeche);
  const sombre = new THREE.Color(PALETTE.herbeSombre);
  const sousBois = new THREE.Color(0x34482d);
  const dedans = (x: number, z: number) => x >= -0.01 && x <= L + 0.01 && z >= -0.01 && z <= P + 0.01;
  for (let i = 0; i < pos.count; i += 3) {
    let tous = true;
    for (let j = 0; j < 3; j++) if (!dedans(pos.getX(i + j), pos.getZ(i + j))) tous = false;
    if (tous) continue;
    for (let j = 0; j < 3; j++) {
      const x = pos.getX(i + j);
      const z = pos.getZ(i + j);
      garde.push(x, 0, z);
      const v = n((x + 60) / 9, (z + 60) / 9);
      c.setHex(PALETTE.herbe).lerp(sombre, Math.max(0, 0.55 - v) * 0.9).lerp(seche, Math.max(0, v - 0.5) * 1.2);
      // Le long du grillage, l'herbe haute et sèche ; au bord du chemin, de la terre.
      const dGrillage = Math.min(Math.abs(x), Math.abs(x - L), Math.abs(z), Math.abs(z - P));
      if (dGrillage < 3) c.lerp(seche, (1 - dGrillage / 3) * 0.45);
      // Hors du grillage, le sol passe au sous-bois sombre : on ne voit plus le bord du monde.
      const dehors = Math.hypot(Math.max(0, -x, x - L), Math.max(0, -z, z - P));
      if (dehors > 4) c.lerp(sousBois, Math.min(1, (dehors - 4) / 12) * 0.85);
      c.offsetHSL(0, 0, (n((x + 60) / 2.5 + 20, (z + 60) / 2.5) - 0.5) * 0.06);
      couleurs.push(c.r, c.g, c.b);
    }
  }
  const herbe = new THREE.BufferGeometry();
  herbe.setAttribute("position", new THREE.Float32BufferAttribute(garde, 3));
  herbe.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
  herbe.computeVertexNormals();
  const mHerbe = new THREE.Mesh(herbe, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mHerbe.receiveShadow = true;
  g.add(mHerbe);

  const cour = new THREE.Mesh(new THREE.PlaneGeometry(L, P).rotateX(-Math.PI / 2).translate(L / 2, 0.012, P / 2), new THREE.MeshStandardMaterial({ map: textureCour(), roughness: 1, alphaTest: 0.5 }));
  cour.receiveShadow = true;
  g.add(cour);

  const chemin = new THREE.Mesh(new THREE.PlaneGeometry(6, 60).rotateX(-Math.PI / 2).translate(PORTAIL.x, 0.015, P + 30), new THREE.MeshStandardMaterial({ map: textureChemin(), roughness: 1 }));
  chemin.receiveShadow = true;
  g.add(chemin);
  return g;
}

/** Une tache irrégulière au sol (huile, givre) : un polygone posé à plat. */
function tacheSol(ch: Chantier, x: number, y: number, z: number, r: number, couleur: number): void {
  const pts: THREE.Vector2[] = [];
  const n = 9;
  const depart = ch.hasard() * 6;
  for (let i = 0; i < n; i++) {
    const a = depart + (i / n) * Math.PI * 2;
    const k = 0.5 + 0.5 * ch.hasard();
    pts.push(new THREE.Vector2(Math.cos(a) * r * k * 1.4, Math.sin(a) * r * k));
  }
  ch.poser(new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2), matiere(), couleur, { x, y, z, ry: ch.hasard() * 3 }, { crasse: false, nuance: 0.02 });
}

// ---------- Le chargement des rayonnages ----------

function palette(ch: Chantier, x: number, y: number, z: number, ry = 0, sombre = 1): void {
  const bois = froid(BOIS_PALETTE, sombre);
  ch.repere({ x, y, z, ry }, () => {
    ch.boite(1.2, 0.025, 0.8, bois, { y: 0.132 }, matiere(), { nuance: 0.06 });
    for (const zz of [-0.34, 0, 0.34]) ch.boite(1.2, 0.1, 0.1, froid(0x8a7254, sombre), { y: 0.06, z: zz }, matiere(), { nuance: 0.06 });
  });
}

function sac(ch: Chantier, x: number, y: number, z: number, couleur: number, ry: number, bande?: number): void {
  ch.boite(0.62, 0.2, 0.42, couleur, { x, y: y + 0.1, z, ry, rz: (ch.hasard() - 0.5) * 0.08 }, matiere(), { nuance: 0.05, crasse: false });
  if (bande !== undefined) ch.boite(0.2, 0.205, 0.425, bande, { x, y: y + 0.1, z, ry }, matiere(), { nuance: 0, crasse: false });
}

function fut(ch: Chantier, x: number, y: number, z: number, couleur: number): void {
  ch.poser(new THREE.CylinderGeometry(0.29, 0.29, 0.88, 8), matiere(), couleur, { x, y: y + 0.44, z, ry: ch.hasard() }, { nuance: 0.05, crasse: false });
  ch.poser(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 8, 1, true), matiere(), couleur, { x, y: y + 0.45, z }, { nuance: 0.08, crasse: false });
}

function bidon(ch: Chantier, x: number, y: number, z: number, couleur: number, ry: number): void {
  ch.boite(0.3, 0.38, 0.18, couleur, { x, y: y + 0.19, z, ry }, matiere(), { nuance: 0.04, crasse: false });
  ch.boite(0.12, 0.05, 0.04, couleur, { x, y: y + 0.4, z, ry }, matiere(), { crasse: false });
}

/**
 * Ce qu'on trouve sur un emplacement de 1,2 × 0,8 m (une palette) ; `k` : à quel point c'est sombre.
 * Allégé pour le téléphone : des blocs chargés (une palette, un bloc, une bande) plutôt que chaque sac ou bidon ;
 * de loin, la même allure.
 */
function charge(ch: Chantier, x: number, y: number, z: number, k: number, genre = Math.floor(ch.hasard() * 8)): void {
  const h = () => ch.hasard();
  const r = () => (h() - 0.5) * 0.08;
  const plateau = () => ch.boite(1.2, 0.14, 0.8, froid(BOIS_PALETTE, k), { x, y: y + 0.07, z }, matiere(), { nuance: 0.06, crasse: false });
  const bloc = (l: number, hh: number, p: number, couleur: number, bande?: number) => {
    const ry = r();
    ch.boite(l, hh, p, froid(couleur, k), { x, y: y + 0.14 + hh / 2, z, ry }, matiere(), { nuance: 0.05, crasse: false });
    if (bande !== undefined) ch.boite(0.26, hh + 0.01, p + 0.01, froid(bande, k), { x: x + 0.22, y: y + 0.14 + hh / 2, z, ry }, matiere(), { nuance: 0, crasse: false });
  };
  switch (genre) {
    case 0:
    case 1:
      // Des sacs d'engrais : un bloc par palette, la bande imprimée
      plateau();
      bloc(1.18, 0.2 * (1 + Math.floor(h() * 3)), 0.8, genre === 0 ? 0xe6e2d6 : 0x3f6fa8, genre === 0 ? VERT_COOP : 0xe9dfc6);
      break;
    case 2:
      // Des cartons
      plateau();
      bloc(1.1, 0.45 + h() * 0.2, 0.75, 0xb08a5a);
      if (h() < 0.6) ch.boite(0.5, 0.3, 0.5, froid(0xa07a4c, k), { x: x - 0.25, y: y + 0.85, z, ry: r() * 3 }, matiere(), { nuance: 0.05, crasse: false });
      break;
    case 3:
      // Un big bag
      plateau();
      bloc(0.95, 0.88, 0.78, 0xe8e4d8, VERT_COOP);
      break;
    case 4: {
      // Des fûts (deux, à six pans)
      const t = [0x2f5d8a, 0x3a6b3a, 0x2a2826, 0xb5452e];
      for (const dx of [-0.3, 0.3]) ch.poser(new THREE.CylinderGeometry(0.29, 0.29, 0.88, 6), matiere(), froid(t[Math.floor(h() * 4)]!, k), { x: x + dx, y: y + 0.44, z, ry: h() }, { nuance: 0.05, crasse: false });
      break;
    }
    case 5:
      // Des bidons, en bloc
      plateau();
      bloc(1.15, 0.4, 0.7, h() < 0.5 ? 0x3e7d4c : 0x2f5d8a);
      break;
    case 6:
      // Des bâches roulées
      for (let i = 0; i < 2; i++) ch.poser(new THREE.CylinderGeometry(0.17, 0.17, 1.15, 6).rotateZ(Math.PI / 2), matiere(), froid(i ? 0x2f5d8a : 0x4f6b3a, k), { x, y: y + 0.17, z: z - 0.18 + i * 0.36, ry: r() }, { nuance: 0.05, crasse: false });
      break;
    default:
      // Pillé : une palette vide, parfois
      if (h() < 0.6) plateau();
  }
}

/** Un rayonnage à palettes de 4 m (montants bleus, lisses orange) : le bas reste, le haut s'efface s'il cache. */
function creerRayonnage(r: Boite, c: Chantier, toits: Toit[], graine: number): THREE.Object3D {
  const haut = new Chantier(graine);
  // Un seul matériau par rayonnage (peinture mate) : un appel de dessin pour tout son haut.
  const acier = matiere();
  const COUPE = 1.45;
  const x0 = r.x - r.l / 2;
  const z0 = r.z - r.p / 2;
  const z1 = r.z + r.p / 2;
  const travees = 5;
  const lt = r.l / travees;
  const k = 1;
  for (let i = 0; i <= travees; i++) {
    const x = x0 + i * lt;
    for (const z of [z0 + 0.05, z1 - 0.05]) {
      c.boite(0.08, COUPE - SOL, 0.08, froid(BLEU_RACK, 0.6), { x, y: SOL + (COUPE - SOL) / 2, z }, acier);
      haut.boite(0.08, 4 - COUPE, 0.08, froid(BLEU_RACK, 0.6), { x, y: COUPE + (4 - COUPE) / 2, z }, acier);
    }
    // Croisillons entre les montants avant et arrière
    for (const [y0, y1, ch] of [[0.2, 1.4, c], [1.5, 2.7, haut], [2.7, 3.9, haut]] as const) ch.poutre(new THREE.Vector3(x, y0, z0 + 0.05), new THREE.Vector3(x, y1, z1 - 0.05), 0.03, froid(BLEU_RACK, 0.6), acier);
  }
  const niveaux = [SOL, 1.4, 2.65];
  for (let i = 0; i < travees; i++) {
    const xm = x0 + (i + 0.5) * lt;
    for (const [n, y] of niveaux.entries()) {
      const ch = n === 0 ? c : haut;
      if (n > 0) for (const z of [z0 + 0.05, z1 - 0.05]) ch.boite(lt - 0.08, 0.1, 0.05, froid(ORANGE_RACK, 0.5), { x: xm, y: y - 0.05, z }, acier);
      for (const dx of [-0.65, 0.65]) charge(ch, xm + dx, y, r.z, k);
    }
    for (const z of [z0 + 0.05, z1 - 0.05]) haut.boite(lt - 0.08, 0.1, 0.05, froid(ORANGE_RACK, 0.5), { x: xm, y: 3.85, z }, acier);
  }
  const { objet, materiaux } = haut.construireFondu(false);
  sansOmbrePortee(objet);
  toits.push({ boite: { x: r.x, z: r.z, l: r.l + 0.2, p: r.p + 0.1 }, materiaux, bas: COUPE, haut: 4.2 });
  objet.name = "rayonnage";
  return objet;
}

// ---------- Le mobilier ----------

function caisse(c: Chantier, b: Boite): void {
  const acier = matiere();
  c.repere({ x: b.x, y: SOL, z: b.z }, () => {
    c.boite(b.l, 0.9, b.p, 0xc9c2b2, { y: 0.45 });
    c.boite(b.l + 0.05, 0.04, b.p + 0.05, 0x8e8b84, { y: 0.92 }, acier);
    c.boite(b.l, 0.2, 0.02, VERT_COOP, { y: 0.7, z: b.p / 2 + 0.01 }, matiere(), { crasse: false });
    c.boite(1.5, 0.03, 0.5, 0x2a2a2a, { x: -0.6, y: 0.955 });
    c.boite(0.42, 0.22, 0.38, 0x3a3d42, { x: 1, y: 1.05 }, acier);
    c.boite(0.3, 0.2, 0.04, 0x1c2128, { x: 1, y: 1.28, z: -0.1, rx: -0.4 });
    c.boite(0.08, 0.14, 0.04, 0x2a2a2a, { x: 0.55, y: 1.0, z: 0.2, rx: 0.4 });
    // Le tiroir-caisse arraché, par terre ; des tickets
    c.boite(0.4, 0.1, 0.35, 0x3a3d42, { x: 1.2, y: -SOL + 0.05, z: -0.75, ry: 0.5, rz: 0.2 }, acier);
    for (let i = 0; i < 9; i++) c.boite(0.08, 0.004, 0.14, 0xe9e4d4, { x: (c.hasard() - 0.3) * 2.5, y: 0.004, z: -0.6 - c.hasard() * 1.2, ry: c.hasard() * 3 }, matiere(), { crasse: false, nuance: 0 });
    // Le présentoir à bonbons, renversé
    c.boite(0.5, 0.9, 0.3, 0xc8362b, { x: -1.9, y: 0.15, z: -0.2, rz: Math.PI / 2 - 0.1 }, acier);
  });
  // Le tabouret
  c.poser(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 8), matiere(), 0x2a2a2a, { x: b.x + 0.6, y: SOL + 0.7, z: b.z + 0.8 });
  c.poser(new THREE.CylinderGeometry(0.03, 0.12, 0.7, 6), acier, 0x8a8f94, { x: b.x + 0.6, y: SOL + 0.35, z: b.z + 0.8 });
}

function rayonBas(c: Chantier, b: Boite): void {
  const acier = matiere();
  const tons = [0xc8362b, 0xd8c43a, 0x3b5a8c, 0x5f8a46, 0xe9dfc6, 0xb5452e, 0x7a4a8c, 0xe0a030];
  c.repere({ x: b.x, y: SOL, z: b.z }, () => {
    c.boite(b.l, 0.12, b.p, 0x4a4d50, { y: 0.06 }, acier);
    c.boite(b.l, 1.5, 0.05, 0xd2cdc2, { y: 0.75 }, acier);
    for (const s of [-1, 1]) {
      for (const y of [0.35, 0.78, 1.2]) {
        c.boite(b.l, 0.025, 0.38, 0xbfbab0, { y, z: s * 0.23 }, acier);
        c.boite(b.l, 0.05, 0.01, 0xe9dfc6, { y: y - 0.02, z: s * 0.42 }, matiere(), { crasse: false });
        for (let x = -b.l / 2 + 0.15; x < b.l / 2 - 0.1; x += 0.22) {
          if (c.hasard() < 0.45) continue; // pillé
          const t = tons[Math.floor(c.hasard() * tons.length)]!;
          const genre = c.hasard();
          if (y < 0.5) c.boite(0.36, 0.28, 0.3, genre < 0.5 ? 0x6b4a32 : 0x5f7f45, { x, y: y + 0.15, z: s * 0.23, ry: (c.hasard() - 0.5) * 0.3 }, matiere(), { nuance: 0.05, crasse: false });
          else if (genre < 0.4) for (let k = 0; k < 3; k++) c.boite(0.12, 0.17, 0.025, tons[Math.floor(c.hasard() * tons.length)]!, { x: x - 0.06 + k * 0.06, y: y + 0.1, z: s * (0.12 + k * 0.08), rx: 0.15 }, matiere(), { crasse: false });
          else if (genre < 0.7) for (let k = 0; k < 2; k++) c.poser(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 7), matiere(), t, { x: x - 0.05 + k * 0.1, y: y + 0.07, z: s * 0.2 }, { crasse: false });
          else c.boite(0.16, 0.24, 0.1, t, { x, y: y + 0.13, z: s * 0.2, rz: c.hasard() < 0.2 ? 1.2 : 0 }, matiere(), { crasse: false });
        }
      }
    }
    // Ce qui est tombé
    for (let i = 0; i < 10; i++) {
      const s = c.hasard() < 0.5 ? -1 : 1;
      c.boite(0.14, 0.04, 0.2, tons[Math.floor(c.hasard() * tons.length)]!, { x: (c.hasard() - 0.5) * b.l, y: 0.02, z: s * (0.6 + c.hasard() * 0.8), ry: c.hasard() * 3 }, matiere(), { crasse: false });
    }
  });
}

function bureau(c: Chantier, b: Boite): void {
  const acier = matiere();
  const bois = froid(0x6e5640);
  c.repere({ x: b.x, y: SOL, z: b.z }, () => {
    c.boite(b.l, 0.05, b.p, bois, { y: 0.74 }, matiere(), { nuance: 0.04 });
    for (const s of [-1, 1]) c.boite(0.05, 0.72, b.p - 0.1, bois, { x: s * (b.l / 2 - 0.05), y: 0.36 });
    c.boite(b.l - 0.1, 0.5, 0.03, bois, { y: 0.45, z: -b.p / 2 + 0.06 });
    c.boite(0.45, 0.6, b.p - 0.15, froid(0x5d4a38), { x: b.l / 2 - 0.3, y: 0.32 });
    // Le vieil écran, le clavier, les registres, la lampe
    c.boite(0.42, 0.36, 0.4, froid(0xcfc8b4), { x: -0.5, y: 0.95, z: -0.15 });
    c.boite(0.34, 0.26, 0.02, 0x1c2128, { x: -0.5, y: 0.97, z: 0.06 });
    c.boite(0.45, 0.03, 0.16, froid(0xcfc8b4), { x: -0.45, y: 0.78, z: 0.3 });
    for (let i = 0; i < 3; i++) c.boite(0.3, 0.05, 0.4, froid([0x7a2e2a, 0x2f4d6b, 0x4a5a3a][i]!), { x: 0.4, y: 0.79 + i * 0.05, z: 0, ry: (c.hasard() - 0.5) * 0.4 });
    c.poutre(new THREE.Vector3(0.9, 0.77, -0.3), new THREE.Vector3(0.95, 1.2, -0.2), 0.03, 0x2a2a2a, acier);
    // Le fauteuil, renversé en arrière
    c.repere({ x: 0.1, z: 0.95, rx: 1.2 }, () => {
      c.boite(0.5, 0.08, 0.5, froid(0x2a2a2a), { y: 0.45 });
      c.boite(0.5, 0.55, 0.08, froid(0x2a2a2a), { y: 0.75, z: 0.24 });
      c.boite(0.06, 0.4, 0.06, 0x55524d, { y: 0.22 }, acier);
    });
  });
  // Les classeurs contre la cloison, un tiroir sorti ; des papiers partout
  for (let i = 0; i < 3; i++) {
    const z = 33 + i * 0.62;
    c.boite(0.6, 1.3, 0.58, froid(0x7d8478), { x: 58.5, y: SOL + 0.65, z }, acier);
    if (i === 1) c.boite(0.5, 0.25, 0.5, froid(0x7d8478), { x: 59.05, y: SOL + 0.85, z }, acier);
  }
  for (let i = 0; i < 40; i++) c.boite(0.21, 0.003, 0.29, froid(0xe9e4d4, 0.5), { x: 59 + c.hasard() * 14, y: SOL + 0.003 + i * 0.0004, z: 32.6 + c.hasard() * 7, ry: c.hasard() * 3 }, matiere(), { crasse: false, nuance: 0.03 });
  // Le portemanteau tombé, la plante morte
  c.poser(new THREE.CylinderGeometry(0.16, 0.12, 0.35, 7), matiere(), froid(0x9c5a3a), { x: 73.3, y: SOL + 0.18, z: 39.3 });
  c.poser(new THREE.IcosahedronGeometry(0.3, 0), matiere(), froid(0x6b6040), { x: 73.3, y: SOL + 0.5, z: 39.3, e: [1, 0.6, 1] });
}

function coffreFort(c: Chantier, b: Boite): void {
  const acier = matiere();
  c.repere({ x: b.x, y: SOL, z: b.z }, () => {
    c.boite(b.l, 1.1, b.p, froid(0x34463a, 0.5), { y: 0.6 }, acier);
    c.boite(b.l + 0.02, 0.08, b.p + 0.02, 0x2a2826, { y: 0.04 }, acier);
    // La porte, côté ouest (vers le bureau) : cadran, poignée, plaque de laiton
    c.boite(0.03, 0.9, 0.72, froid(0x2c3c31, 0.5), { x: -b.l / 2 - 0.01, y: 0.62 }, acier);
    c.poser(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12).rotateZ(Math.PI / 2), acier, 0xb9b4a8, { x: -b.l / 2 - 0.04, y: 0.82, z: 0.12 });
    for (let i = 0; i < 3; i++) c.boite(0.03, 0.22, 0.03, 0xb9b4a8, { x: -b.l / 2 - 0.05, y: 0.5, z: -0.15, rx: (i * Math.PI) / 3 }, acier);
    c.boite(0.01, 0.08, 0.3, PALETTE.laiton, { x: -b.l / 2 - 0.03, y: 1.0, z: 0 }, acier);
  });
}

function etabli(c: Chantier, b: Boite): void {
  const acier = matiere();
  const bois = froid(0x8a6a3e, 0.8);
  c.repere({ x: b.x, y: SOL, z: b.z }, () => {
    c.boite(b.l, 0.08, b.p, bois, { y: 0.9 }, matiere(), { nuance: 0.05 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.boite(0.06, 0.86, 0.06, froid(0x3a3d42), { x: sx * (b.l / 2 - 0.08), y: 0.43, z: sz * (b.p / 2 - 0.08) }, acier);
    c.boite(b.l - 0.1, 0.03, b.p - 0.1, bois, { y: 0.25 });
    // L'étau (sa vis vers l'avant, côté caméra), des outils, la caisse rouge, des bidons d'huile dessous
    c.boite(0.2, 0.16, 0.3, froid(0x2f5d8a), { x: b.l / 2 - 0.3, y: 1.02, z: 0.2 }, acier);
    c.boite(0.04, 0.04, 0.4, 0x8a8f94, { x: b.l / 2 - 0.3, y: 1.06, z: 0.45 }, acier);
    c.boite(0.5, 0.25, 0.25, froid(0xc8362b), { x: -0.8, y: 1.07, z: 0.1 }, acier);
    for (let i = 0; i < 6; i++) c.boite(0.25, 0.025, 0.04, froid(0x8a8f94), { x: -0.2 + c.hasard() * 1, y: 0.955, z: (c.hasard() - 0.5) * 0.6, ry: c.hasard() * 3 }, acier, { crasse: false });
    for (let i = 0; i < 4; i++) bidon(c, -1.1 + i * 0.4, 0.27, 0.1, froid(i % 2 ? 0x2a2826 : 0x3e7d4c), 0);
    // Le panneau à outils, debout derrière (côté nord : la caméra et celui qui travaille voient le plateau, 2026-10-08)
    c.boite(b.l, 1, 0.03, froid(0x8a6a48), { y: 1.55, z: -(b.p / 2 - 0.02) });
    for (const sx of [-1, 1]) c.boite(0.06, 2.05, 0.06, froid(0x3a3d42), { x: sx * (b.l / 2 - 0.05), y: 1.03, z: -(b.p / 2 - 0.02) }, acier);
    for (let i = 0; i < 10; i++) c.boite(0.05, 0.22 + c.hasard() * 0.18, 0.03, froid(0x55524d), { x: -b.l / 2 + 0.25 + i * 0.28, y: 1.6, z: -(b.p / 2 - 0.05), rz: (c.hasard() - 0.5) * 0.6 }, acier);
  });
}

function pilePalettes(c: Chantier, b: Boite): void {
  const n = Math.round(b.p / 1.4);
  for (let i = 0; i < n; i++) {
    const z = b.z - b.p / 2 + 0.7 + i * 1.4;
    const ry = Math.PI / 2 + (c.hasard() - 0.5) * 0.2;
    const hauteur = 3 + Math.floor(c.hasard() * 5);
    for (let k = 0; k < hauteur; k++) palette(c, b.x + (c.hasard() - 0.5) * 0.08, k * 0.145, z + (c.hasard() - 0.5) * 0.08, ry + (c.hasard() - 0.5) * 0.08, 0);
    if (i === 0 && c.hasard() < 0.9) charge(c, b.x, hauteur * 0.145 - 0.145, z, 0, 0);
  }
}

// ---------- Les engins (Assemblage : nuance par facette, occlusion cuite) ----------

function repere(a: Assemblage, x: number, z: number, o: number, y = 0): void {
  a.repere = new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromAxisAngle(Y, o), new V3(1, 1, 1));
}

/** Un tracteur rouillé : grandes roues à crampons, capot long, calandre, pot vertical, arceau ou cabine. */
function tracteur(a: Assemblage, x: number, z: number, o: number, cabine: boolean, aleat: () => number): void {
  repere(a, x, z, o, 0.08);
  const k = 0.7;
  const caisse = froid(cabine ? 0x4f6d3a : 0xa4452f, k);
  const jante = froid(cabine ? 0xc9a83a : 0xd0c3a0, k);
  const pneu = 0x272624;
  const fonte = froid(0x45433f, k);
  const roue = (rx: number, rz: number, r: number, w: number, crampons: number, plat = 1) => {
    const y = r * plat;
    a.ajouter(placer(new THREE.CylinderGeometry(r, r, w, 16).rotateZ(Math.PI / 2).scale(1, plat, 1), rx, y, rz), pneu, "mat", 0.03);
    for (let i = 0; i < crampons; i++) {
      const ang = (i / crampons) * Math.PI * 2;
      for (const s of [-1, 1]) a.ajouter(placer(new THREE.BoxGeometry(w * 0.46, 0.07, 0.1), rx + s * w * 0.23, y + Math.cos(ang) * (r + 0.015) * plat, rz + Math.sin(ang) * (r + 0.015), ang, s * 0.5, 0), pneu, "mat");
    }
    const flanc = Math.sign(rx) || 1;
    a.ajouter(placer(new THREE.CylinderGeometry(r * 0.6, r * 0.6, w * 0.7, 14).rotateZ(Math.PI / 2), rx, y, rz), jante, "tole", 0.06);
    a.ajouter(placer(new THREE.CylinderGeometry(r * 0.2, r * 0.24, 0.12, 8).rotateZ(Math.PI / 2), rx + flanc * w * 0.38, y, rz), fonte, "metal");
  };
  // Les roues : un pneu avant à plat sur le vieux rouge
  roue(-1.05, 0.95, 0.8, 0.46, 13);
  roue(1.05, 0.95, 0.8, 0.46, 13, cabine ? 1 : 0.94);
  roue(-0.82, -1.45, 0.42, 0.24, 10, cabine ? 1 : 0.78);
  roue(0.82, -1.45, 0.42, 0.24, 10);
  // Pont arrière, trompettes, moteur, capot, calandre, essieu avant
  a.boite(fonte, "metal", 0.9, 0.6, 1.2, 0, 0.85, 0.75);
  a.boite(fonte, "metal", 1.7, 0.2, 0.24, 0, 0.8, 0.95);
  a.boite(fonte, "metal", 0.55, 0.5, 1.5, 0, 0.78, -0.45);
  a.boite(caisse, "tole", 0.76, 0.52, 2.0, 0, 1.3, -0.62);
  a.boite(caisse, "tole", 0.66, 0.08, 1.95, 0, 1.6, -0.62);
  a.boite(0x2a2826, "metal", 0.66, 0.56, 0.06, 0, 1.28, -1.63);
  for (let i = 0; i < 5; i++) a.boite(caisse, "tole", 0.68, 0.04, 0.07, 0, 1.06 + i * 0.11, -1.64);
  a.boite(fonte, "metal", 1.55, 0.12, 0.16, 0, 0.42, -1.45);
  for (const s of [-1, 1]) a.boite(0xd8d0b4, "verre", 0.13, 0.11, 0.06, s * 0.28, 1.5, -1.67);
  // Les garde-boue arrière, en arc au-dessus des grandes roues
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const th = Math.PI * (0.18 + (i / 5) * 0.7);
      a.boite(caisse, "tole", 0.52, 0.04, 0.34, s * 1.05, 0.8 + Math.sin(th) * 0.93, 0.95 + Math.cos(th) * 0.93, th + Math.PI / 2, 0, 0);
    }
    a.boite(caisse, "tole", 0.5, 0.05, 0.9, s * 0.7, 1.32, 0.95);
  }
  // Le pot d'échappement, le préfiltre
  a.perche(new V3(0.27, 1.55, -1.15), new V3(0.27, 2.55, -1.15), 0.045, NOIR, "metal", 6);
  a.ajouter(placer(new THREE.CylinderGeometry(0.06, 0.05, 0.08, 6), 0.27, 2.58, -1.15, 0.5), PALETTE.rouille, "metal");
  a.perche(new V3(-0.24, 1.55, -1.0), new V3(-0.24, 2.0, -1.0), 0.07, froid(0x3a3d42, k), "metal", 7);
  // Le siège, le volant
  a.boite(0x232220, "mat", 0.46, 0.1, 0.42, 0, 1.55, 0.78);
  a.boite(0x232220, "mat", 0.46, 0.4, 0.08, 0, 1.78, 1.0, -0.2, 0, 0);
  a.perche(new V3(0, 1.3, 0.05), new V3(0, 1.95, 0.32), 0.03, NOIR, "metal", 5);
  a.ajouter(placer(new THREE.TorusGeometry(0.2, 0.025, 4, 10), 0, 1.97, 0.33, -1.0, 0, 0), NOIR, "mat");
  // L'attelage trois points
  for (const s of [-1, 1]) a.perche(new V3(s * 0.35, 0.62, 1.35), new V3(s * 0.42, 0.45, 2.0), 0.035, fonte, "metal", 5);
  a.perche(new V3(0, 1.2, 1.35), new V3(0, 1.05, 2.0), 0.035, fonte, "metal", 5);
  if (cabine) {
    // La cabine : montants, toit, vitres (une manque), masses à l'avant
    for (const sx of [-1, 1]) for (const sz of [0.15, 1.45]) a.perche(new V3(sx * 0.68, 1.3, sz), new V3(sx * 0.66, 2.75, sz), 0.035, NOIR, "metal", 5);
    a.boite(caisse, "tole", 1.5, 0.1, 1.55, 0, 2.8, 0.8);
    a.boite(0x2c3d44, "verre", 1.3, 1.1, 0.02, 0, 2.15, 0.15);
    a.boite(0x2c3d44, "verre", 0.02, 0.9, 1.25, 0.67, 2.25, 0.8);
    a.boite(0x2c3d44, "verre", 1.3, 0.8, 0.02, 0, 2.3, 1.45);
    for (let i = 0; i < 4; i++) a.boite(froid(0x3a3d42, k), "metal", 0.75, 0.16, 0.18, 0, 0.98 + i * 0.17, -1.82);
  } else {
    // L'arceau de sécurité
    for (const s of [-1, 1]) a.perche(new V3(s * 0.62, 1.32, 1.25), new V3(s * 0.6, 2.5, 1.25), 0.045, NOIR, "metal", 6);
    a.perche(new V3(-0.62, 2.5, 1.25), new V3(0.62, 2.5, 1.25), 0.045, NOIR, "metal", 6);
    // Le klaxon (un leurre, Book 23 §4.7) : le pavillon chromé au flanc du capot, le gros bouton rouge au centre du
    // volant, et la batterie sur le garde-boue, qu'il videra.
    // (Côté droit, celui que voit la caméra.)
    a.ajouter(placer(new THREE.ConeGeometry(0.09, 0.24, 10, 1, true).rotateX(Math.PI / 2), 0.48, 1.45, -1.38), 0xe4e8ea, "metal");
    a.ajouter(placer(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 8).rotateX(Math.PI / 2), 0.48, 1.45, -1.21), 0x3a3836, "metal");
    a.perche(new V3(0.38, 1.45, -1.21), new V3(0.48, 1.45, -1.21), 0.02, 0x3a3836, "metal", 5);
    a.ajouter(placer(new THREE.CylinderGeometry(0.065, 0.065, 0.035, 10), 0, 1.985, 0.335, -1.0, 0, 0), 0xd42a20, "tole");
    // La batterie elle-même se démonte (0.5.1) : c'est une ressource (rendu/ressources.ts, « coop_batterie »). Ici,
    // son berceau de tôle et sa sangle, qui restent quand on l'a prise.
    a.boite(0x3a3836, "metal", 0.36, 0.03, 0.26, 0.7, 1.335, 0.62);
    a.boite(0x3a3836, "metal", 0.02, 0.12, 0.26, 0.53, 1.4, 0.62);
  }
  // La rouille : sur les flancs et le dessus du capot, sur les garde-boue
  for (const s of [-1, 1]) {
    const flanc = surface(new V3(s * 0.381, 1.3, -0.62), s > 0 ? Z.clone().negate() : Z, Y, s > 0 ? X : X.clone().negate());
    rouille(a, flanc, (aleat() - 0.5) * 1.2, -0.1, 0.12 + aleat() * 0.08, 0.06 + aleat() * 0.05, aleat);
  }
  const dessus = surface(new V3(0, 1.641, -0.62), X, Z, Y);
  rouille(a, dessus, (aleat() - 0.5) * 0.3, (aleat() - 0.5) * 1.2, 0.08 + aleat() * 0.06, 0.12 + aleat() * 0.1, aleat);
  a.repere = null;
}

/** La camionnette de la coopérative : blanc passé, bande verte, pneus à plat, rouille aux passages de roue. */
function camionnette(a: Assemblage, x: number, z: number, o: number, aleat: () => number): void {
  repere(a, x, z, o);
  const blanc = 0xd9d6cb;
  const verre = 0x26343a;
  // Les roues (deux à plat)
  for (const [rx, rz, plat] of [[-0.86, -1.6, 0.72], [0.86, -1.6, 1], [-0.86, 1.65, 1], [0.86, 1.65, 0.75]] as const) {
    a.ajouter(placer(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12).rotateZ(Math.PI / 2).scale(1, plat, 1), rx, 0.34 * plat, rz), 0x272624, "mat", 0.03);
    a.ajouter(placer(new THREE.CylinderGeometry(0.2, 0.2, 0.23, 8).rotateZ(Math.PI / 2), rx, 0.34 * plat, rz), 0x8a8f94, "metal");
  }
  // Caisse, cabine, capot, pare-brise, pare-chocs
  a.boite(blanc, "tole", 1.96, 1.7, 2.75, 0, 1.43, 1.0);
  a.boite(blanc, "tole", 1.96, 1.45, 1.4, 0, 1.3, -1.05);
  a.boite(blanc, "tole", 1.9, 0.62, 0.75, 0, 0.88, -2.05);
  a.boite(verre, "verre", 1.72, 0.7, 0.04, 0, 1.75, -1.63, -0.42, 0, 0);
  a.boite(blanc, "tole", 1.9, 0.3, 0.6, 0, 1.3, -1.86, -0.6, 0, 0);
  for (const s of [-1, 1]) a.boite(verre, "verre", 0.02, 0.55, 0.85, s * 0.985, 1.68, -1.0);
  a.boite(0x3a3836, "mat", 2.0, 0.22, 0.14, 0, 0.55, -2.45);
  a.boite(0x3a3836, "mat", 2.0, 0.22, 0.14, 0, 0.55, 2.42);
  for (const s of [-1, 1]) {
    a.boite(0xd8d0b4, "verre", 0.3, 0.18, 0.04, s * 0.7, 1.0, -2.44);
    a.boite(0xa33a2a, "verre", 0.12, 0.3, 0.04, s * 0.85, 1.1, 2.39);
    // La bande verte de la coopérative, le long des flancs
    a.boite(VERT_COOP, "tole", 0.012, 0.22, 2.7, s * 0.985, 1.25, 1.0);
  }
  a.boite(0x55524d, "metal", 0.012, 1.5, 0.02, 0, 1.4, 2.385);
  // Rouille et mousse
  for (const s of [-1, 1]) {
    const flanc = surface(new V3(s * 0.99, 1.0, 0), s > 0 ? Z.clone().negate() : Z, Y, s > 0 ? X : X.clone().negate());
    for (const zz of [-1.6, 1.65]) rouille(a, flanc, s > 0 ? -zz : zz, -0.2, 0.35, 0.2, aleat);
  }
  const toit = surface(new V3(0, 2.281, 1.0), X, Z, Y);
  rouille(a, toit, 0.3, 0.5, 0.4, 0.5, aleat);
  a.plaque([new THREE.Vector2(-0.6, -1), new THREE.Vector2(0.2, -1.2), new THREE.Vector2(0.5, 0.2), new THREE.Vector2(-0.4, 0.4)], toit, 0x6d7f4a, "mat", 0.012);
  a.repere = null;
}

function transpalette(a: Assemblage, b: Boite): void {
  repere(a, b.x, b.z, 0.2);
  const rouge = 0xc8362b;
  for (const s of [-1, 1]) a.boite(0x8d9396, "metal", 0.16, 0.07, 1.15, s * 0.27, 0.06, -0.2);
  a.boite(rouge, "tole", 0.62, 0.32, 0.28, 0, 0.22, 0.5);
  a.perche(new V3(0, 0.35, 0.55), new V3(0, 1.25, 0.9), 0.025, 0x2a2826, "metal", 5);
  a.boite(0x2a2826, "mat", 0.32, 0.05, 0.05, 0, 1.25, 0.9);
  a.ajouter(placer(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 8).rotateZ(Math.PI / 2), 0, 0.09, 0.55), 0x2a2826, "mat");
  a.repere = null;
}

/** Le chariot élévateur abandonné dans le hangar, les fourches levées. */
function chariot(a: Assemblage, x: number, z: number, o: number): void {
  repere(a, x, z, o, SOL);
  const jaune = froid(0xd8a52a, 0.8);
  a.boite(jaune, "tole", 1.1, 0.8, 1.9, 0, 0.65, 0.2);
  a.boite(froid(0x3a3d42, 0.8), "metal", 1.0, 0.55, 0.55, 0, 0.9, 1.0);
  for (const sx of [-1, 1]) for (const sz of [-0.5, 1.0]) a.perche(new V3(sx * 0.5, 1.05, sz), new V3(sx * 0.48, 2.1, sz), 0.03, NOIR, "metal", 5);
  a.boite(froid(0x3a3d42, 0.8), "metal", 1.05, 0.06, 1.6, 0, 2.12, 0.25);
  a.boite(0x232220, "mat", 0.45, 0.1, 0.4, 0, 1.1, 0.35);
  for (const s of [-1, 1]) a.boite(froid(0x55524d, 0.8), "metal", 0.1, 2.6, 0.12, s * 0.38, 1.35, -0.85);
  a.boite(froid(0x55524d, 0.8), "metal", 0.9, 0.5, 0.06, 0, 1.6, -0.95);
  for (const s of [-1, 1]) a.boite(froid(0x55524d, 0.8), "metal", 0.1, 0.05, 1.1, s * 0.3, 1.4, -1.5);
  for (const [sx, sz, r] of [[-0.5, -0.45, 0.3], [0.5, -0.45, 0.3], [-0.48, 0.8, 0.24], [0.48, 0.8, 0.24]] as const) a.ajouter(placer(new THREE.CylinderGeometry(r, r, 0.22, 10).rotateZ(Math.PI / 2), sx, r, sz), 0x272624, "mat");
  a.repere = null;
}

// ---------- Les silos ----------

function silo(c: Chantier, haut: Chantier, b: Boite, toits: Toit[]): void {
  const r = b.l / 2 - 0.3;
  const COUPE = 1.85;
  const acier = matiere();
  c.poser(new THREE.CylinderGeometry(r + 0.35, r + 0.5, 0.35, 22), matiere(), BETON, { x: b.x, y: 0.17, z: b.z });
  const bandes = 12;
  for (let i = 0; i < bandes; i++) {
    const y0 = 0.35 + i * 0.75;
    const ch = y0 + 0.75 <= COUPE + 0.01 ? c : haut;
    const rr = r + (i % 2 ? 0.035 : 0);
    const ton = i < 2 ? 0x9a9f9a : ch.hasard() < 0.2 ? 0xa89d8c : GALVA;
    ch.poser(new THREE.CylinderGeometry(rr, rr, 0.75, 24, 1, true), acier, ton, { x: b.x, y: y0 + 0.375, z: b.z }, { nuance: 0.05, crasse: false });
  }
  const yt = 0.35 + bandes * 0.75;
  haut.poser(new THREE.CylinderGeometry(0.4, r + 0.18, 1.9, 24), acier, 0xc6cacb, { x: b.x, y: yt + 0.95, z: b.z }, { nuance: 0.03, crasse: false });
  haut.poser(new THREE.CylinderGeometry(0.25, 0.42, 0.45, 10), acier, 0x8f948f, { x: b.x, y: yt + 2.1, z: b.z }, { crasse: false });
  // L'échelle à crinoline, côté sud-est (vue de la caméra)
  const a = Math.PI * 0.25;
  const ex = b.x + Math.cos(a) * (r + 0.3);
  const ez = b.z + Math.sin(a) * (r + 0.3);
  const t = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(0.22);
  for (const s of [-1, 1]) {
    c.poutre(new THREE.Vector3(ex + t.x * s, 0.4, ez + t.z * s), new THREE.Vector3(ex + t.x * s, COUPE, ez + t.z * s), 0.04, 0x8f948f, acier);
    haut.poutre(new THREE.Vector3(ex + t.x * s, COUPE, ez + t.z * s), new THREE.Vector3(ex + t.x * s, yt + 0.6, ez + t.z * s), 0.04, 0x8f948f, acier);
  }
  for (let y = 0.6; y < yt + 0.5; y += 0.35) (y < COUPE ? c : haut).poutre(new THREE.Vector3(ex - t.x, y, ez - t.z), new THREE.Vector3(ex + t.x, y, ez + t.z), 0.025, 0x8f948f, acier);
  for (let y = 2.5; y < yt; y += 0.9) haut.poser(new THREE.TorusGeometry(0.36, 0.015, 3, 10, Math.PI), acier, 0x8f948f, { x: ex + Math.cos(a) * 0.05, y, z: ez + Math.sin(a) * 0.05, rx: Math.PI / 2, rz: a - Math.PI / 2 }, { crasse: false });
  // Coulures de rouille sous les boulons
  for (let i = 0; i < 9; i++) {
    const an = Math.PI * (0.05 + c.hasard() * 0.75);
    const y = 2.5 + c.hasard() * 6;
    haut.boite(0.08, 0.5 + c.hasard() * 1.2, 0.02, PALETTE.rouille, { x: b.x + Math.cos(an) * (r + 0.045), y, z: b.z + Math.sin(an) * (r + 0.045), ry: Math.PI / 2 - an }, matiere(), { nuance: 0.1, crasse: false });
  }
  // La trappe de vidange, au pied
  c.boite(0.8, 0.8, 0.06, 0x6d7276, { x: b.x + Math.cos(Math.PI * 0.55) * (r + 0.03), y: 0.85, z: b.z + Math.sin(Math.PI * 0.55) * (r + 0.03), ry: Math.PI / 2 - Math.PI * 0.55 }, acier);
  toits.push({ boite: { x: b.x, z: b.z, l: b.l, p: b.p }, materiaux: [], bas: COUPE, haut: yt + 2.3 });
}

// ---------- La clôture ----------

function creerCloture(c: Chantier, grillage: THREE.Material): void {
  const acier = matiere();
  const segment = (x1: number, z1: number, x2: number, z2: number, trous: [number, number][] = []) => {
    const l = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(1, Math.round(l / 2.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x1 + (x2 - x1) * t;
      const z = z1 + (z2 - z1) * t;
      const penche = c.hasard() < 0.12 ? (c.hasard() - 0.5) * 0.25 : 0;
      c.poser(new THREE.CylinderGeometry(0.035, 0.04, 2.1, 5), acier, GALVA, { x, y: 1.05, z, rx: penche, rz: penche * 0.6 }, { nuance: 0.05 });
      if (i === n) break;
      const tm = (i + 0.5) / n;
      const xm = x1 + (x2 - x1) * tm;
      const zm = z1 + (z2 - z1) * tm;
      if (trous.some(([a, b]) => (x1 === x2 ? zm : xm) > a && (x1 === x2 ? zm : xm) < b)) continue;
      const lp = l / n;
      const affaisse = c.hasard() < 0.08;
      const g = new THREE.PlaneGeometry(lp, affaisse ? 1.4 : 1.85, 2, 1);
      const uv = g.attributes.uv!;
      for (let j = 0; j < uv.count; j++) uv.setXY(j, uv.getX(j) * (lp / 0.25), uv.getY(j) * (1.85 / 0.25));
      if (affaisse) g.attributes.position!.setY(4, g.attributes.position!.getY(4) - 0.35);
      c.poser(g, grillage, 0xffffff, { x: xm, y: affaisse ? 0.85 : 1.05, z: zm, ry: -Math.atan2(z2 - z1, x2 - x1) }, { nuance: 0, crasse: false });
    }
    // Le fil de tension et les barbelés
    for (const y of [2.05, 2.15]) c.poutre(new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2), 0.012, 0x8a8f94, acier);
  };
  const xo = 0.5;
  const xe = L - 0.5;
  const zn = 0.5;
  const zs = PORTAIL.z;
  segment(xo, zn, xe, zn);
  segment(xe, zn, xe, zs);
  segment(xo, zs, PORTAIL.x - PORTAIL.largeur / 2 - 0.2, zs);
  segment(PORTAIL.x + PORTAIL.largeur / 2 + 0.2, zs, xe, zs);
  segment(xo, zn, xo, zs, [[BRECHE.z - BRECHE.largeur / 2, BRECHE.z + BRECHE.largeur / 2]]);
  // La brèche : le pan arraché, couché dans l'herbe, un poteau tordu
  const g = new THREE.PlaneGeometry(2.6, 1.85);
  const uv = g.attributes.uv!;
  for (let j = 0; j < uv.count; j++) uv.setXY(j, uv.getX(j) * (2.6 / 0.25), uv.getY(j) * (1.85 / 0.25));
  c.poser(g, grillage, 0xffffff, { x: BRECHE.x - 1.3, y: 0.22, z: BRECHE.z + 0.2, ry: Math.PI / 2, rx: -Math.PI / 2 + 0.25, rz: 0.1 }, { nuance: 0, crasse: false });
  c.poser(new THREE.CylinderGeometry(0.035, 0.04, 2.1, 5), acier, GALVA, { x: BRECHE.x - 0.5, y: 0.8, z: BRECHE.z - 1.2, rz: 0.9 });
}

// ---------- Le grand bâtiment ----------

interface Chantiers {
  c: Chantier;
  ta: Chantier;
  th: Chantier;
  tf: Chantier;
  tt: Chantier;
  fond: Chantier;
}

function creerBatiment(ch: Chantiers, mats: Mats & { verre: THREE.Material; enseigne: THREE.Material; toitPlat: THREE.Material; translucide: THREE.Material; affiches: THREE.Material[]; carrelage: THREE.Material }): THREE.Object3D[] {
  const { c, ta, th, tf, fond } = ch;
  const acier = matiere();
  const tole = matiere();
  const objets: THREE.Object3D[] = [];
  const { x0, x1, z0, z1 } = B;
  const zc = 32; // la cloison entre le hangar et l'avant
  const xc = 58; // entre libre-service et bureaux

  // Les sols : hangar sombre, chambre froide, libre-service carrelé, bureaux en lino
  c.pave(x0, 0, z0, x1, SOL, zc, BETON_SOMBRE);
  c.pave(52, SOL, z0 + 0.15, x1 - 0.15, SOL + 0.006, 16, froid(0x8a979e, 0.6), matiere());
  c.pave(x0, 0, zc, x1, SOL, z1, 0x8c8578);
  const carrelage = new THREE.Mesh(new THREE.PlaneGeometry(xc - x0 - 0.3, z1 - zc - 0.3).rotateX(-Math.PI / 2), mats.carrelage);
  carrelage.position.set((x0 + xc) / 2, SOL + 0.004, (zc + z1) / 2);
  carrelage.receiveShadow = true;
  objets.push(carrelage);
  c.pave(xc + 0.15, SOL, zc + 0.15, x1 - 0.15, SOL + 0.006, z1 - 0.15, froid(0x6f7a68, 0.7), matiere());
  // Les marquages jaunes des allées du hangar, effacés ; des taches d'huile ; du givre devant la chambre froide
  for (const z of [21.85, 26.75]) for (let x = 36; x < 72; x += 1.2) if (c.hasard() < 0.8) c.pave(x, SOL, z - 0.05, x + 0.9, SOL + 0.004, z + 0.05, froid(0xc9a83a, 0.5), matiere(), { crasse: false });
  for (let i = 0; i < 9; i++) tacheSol(c, 36 + c.hasard() * 36, SOL + 0.003, 9 + c.hasard() * 22, 0.3 + c.hasard() * 0.4, 0x4f5457);

  // ---- Les murs extérieurs ----
  // Sud : la façade du libre-service (vitrine), puis les bureaux
  const allege = 0xa79d88;
  const vitrines: [number, number][] = [[x0 + 0.15, 44 - 1.2], [44 + 1.2, xc - 0.15]];
  pan(c, "x", z1, x0, 44 - 1.2, 0, SOCLE, allege);
  pan(c, "x", z1, 44 + 1.2, x1, 0, SOCLE, allege);
  c.pave(43.2 - 0.4, 0, z1 - MUR / 2, 44.8 + 0.4, SOL + 0.02, z1 + MUR / 2, 0x9ea3a6, acier);
  const HV = 2.9;
  pan(ta, "x", z1, x0, xc, HV, HF, 0xffffff, mats.enduit);
  pan(ta, "x", z1, 44 - 1.2, 44 + 1.2, 2.5, HV, 0xffffff, mats.enduit);
  pan(ta, "x", z1, xc, x1, SOCLE, HF, 0xffffff, mats.enduit);
  for (const [u0, u1] of vitrines) {
    const n = Math.max(1, Math.round((u1 - u0) / 2));
    const lv = (u1 - u0) / n;
    for (let i = 0; i <= n; i++) ta.pave(u0 + i * lv - 0.05, SOCLE, z1 - 0.06, u0 + i * lv + 0.05, HV, z1 + 0.06, 0x8e9396, acier);
    ta.pave(u0, SOCLE, z1 - 0.07, u1, SOCLE + 0.08, z1 + 0.07, 0x8e9396, acier);
    ta.pave(u0, HV - 0.08, z1 - 0.07, u1, HV, z1 + 0.07, 0x8e9396, acier);
    for (let i = 0; i < n; i++) {
      const xm = u0 + (i + 0.5) * lv;
      const casse = ta.hasard();
      if (casse < 0.18) {
        // Vitre brisée : des éclats restés dans le cadre
        for (let k = 0; k < 3; k++) ta.poser(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.5 + k * 0.4, 0, 0), new THREE.Vector3(-0.2 + k * 0.4, 0, 0), new THREE.Vector3(-0.35 + k * 0.4, 0.3 + ta.hasard() * 0.5, 0)]), mats.verre, 0xffffff, { x: xm, y: SOCLE + 0.08, z: z1 }, { nuance: 0, crasse: false });
      } else if (casse < 0.3) {
        // Condamnée par un panneau de contreplaqué
        ta.boite(lv - 0.1, HV - SOCLE - 0.2, 0.03, 0xb39566, { x: xm, y: (SOCLE + HV) / 2, z: z1 + 0.09 }, matiere(), { nuance: 0.04 });
      } else ta.boite(lv - 0.1, HV - SOCLE - 0.16, 0.02, 0xffffff, { x: xm, y: (SOCLE + HV) / 2, z: z1 }, mats.verre, { nuance: 0, crasse: false });
    }
  }
  // Les affiches de promotion, derrière la vitre
  ta.poser(new THREE.PlaneGeometry(0.7, 0.88), mats.affiches[0]!, 0xffffff, { x: 37.2, y: 1.9, z: z1 - 0.04, ry: 0 }, { nuance: 0, crasse: false });
  ta.poser(new THREE.PlaneGeometry(0.7, 0.88), mats.affiches[0]!, 0xffffff, { x: 50.5, y: 1.85, z: z1 - 0.04, rz: 0.04 }, { nuance: 0, crasse: false });
  // L'enseigne au-dessus des vitrines, un auvent étroit
  ta.boite(15.4, 1.4, 0.14, 0x24502c, { x: 46, y: 3.66, z: z1 + 0.2 }, acier, { crasse: false });
  ta.poser(new THREE.PlaneGeometry(15, 1.2), mats.enseigne, 0xffffff, { x: 46, y: 3.66, z: z1 + 0.28 }, { nuance: 0, crasse: false });
  ta.boite(xc - x0, 0.1, 0.9, 0x8e9396, { x: (x0 + xc) / 2, y: HV + 0.05, z: z1 + 0.5 }, acier);
  // Les fenêtres des bureaux, à barreaux, un store baissé
  for (const xm of [62, 66, 70.5]) {
    ta.boite(1.4, 1.2, 0.04, 0x1c2630, { x: xm, y: 1.75, z: z1 + 0.16 }, mats.verre, { nuance: 0, crasse: false });
    ta.boite(1.55, 0.08, 0.2, 0xbdb5a2, { x: xm, y: 1.12, z: z1 + 0.18 });
    for (let k = 0; k < 6; k++) ta.boite(0.025, 1.2, 0.025, 0x3a3d42, { x: xm - 0.6 + k * 0.24, y: 1.75, z: z1 + 0.22 }, acier);
    if (xm === 66) ta.boite(1.35, 0.7, 0.02, 0xd8d0b4, { x: xm, y: 2.0, z: z1 + 0.13 }, matiere(), { crasse: false });
  }
  // Est : l'avant (enduit, une fenêtre), le hangar (bardage), la chambre froide
  pan(c, "z", x1, zc, z1, 0, SOCLE, allege);
  pan(ta, "z", x1, zc, z1, SOCLE, HF, 0xffffff, mats.enduit);
  ta.boite(0.04, 1.2, 1.4, 0x1c2630, { x: x1 + 0.16, y: 1.75, z: 36 }, mats.verre, { nuance: 0, crasse: false });
  poserLigne(c, { sens: "z", fixe: x1, a: 16, b: zc, h: H, dehors: 1, haut: th, habit: "bardage" }, mats);
  poserLigne(c, { sens: "z", fixe: x1, a: z0, b: 16, h: H, dehors: 1, haut: tf, habit: "bardage" }, mats);
  // Nord : bardage, avec la porte frigorifique arrière (côté cour des silos)
  poserLigne(c, { sens: "x", fixe: z0, a: x0, b: x1, h: H, dehors: -1, haut: fond, habit: "bardage" }, mats);
  // Ouest : bardage (le hangar, la porte du quai), enduit (le libre-service)
  poserLigne(c, { sens: "z", fixe: x0, a: z0, b: zc, h: H, dehors: -1, haut: fond, habit: "bardage" }, mats);
  pan(c, "z", x0, zc, z1, 0, SOCLE, allege);
  pan(fond, "z", x0, zc, z1, SOCLE, HF, 0xffffff, mats.enduit);

  // ---- Les cloisons ----
  poserLigne(c, { sens: "x", fixe: zc, a: x0, b: x1, h: H, dehors: 1, haut: th, habit: "bardage", habitDe: HF }, mats);
  // Côté avant, la cloison est enduite (on la voit du libre-service et des bureaux)
  face(th, mats.enduit, 0xffffff, "x", zc, 1, x0 + 0.15, 40 - 0.8, SOCLE, HF, { uEch: 24, vEch: 4.4 });
  face(th, mats.enduit, 0xffffff, "x", zc, 1, 40 + 0.8, 61 - 0.6, SOCLE, HF, { uEch: 24, vEch: 4.4 });
  face(th, mats.enduit, 0xffffff, "x", zc, 1, 61 + 0.6, x1 - 0.15, SOCLE, HF, { uEch: 24, vEch: 4.4 });
  pan(c, "z", xc, zc, z1, 0, SOCLE, 0xd0c7b0);
  pan(ta, "z", xc, zc, z1, SOCLE, HF, 0xffffff, mats.enduit);
  poserLigne(c, { sens: "x", fixe: 16, a: 52, b: x1, h: H, dehors: 1, haut: tf, habit: "panneau" }, mats);
  poserLigne(c, { sens: "z", fixe: 52, a: z0, b: 16, h: H, dehors: -1, haut: th, habit: "panneau" }, mats);
  // L'intérieur de la chambre froide : panneaux blancs sur les murs nord et est (le fond, vu de dedans)
  pan(c, "x", z0 + 0.2, 52.15, x1 - 0.15, 0, SOCLE, froid(PANNEAU_FROID, 0.6), matiere(), 0.1);
  pan(fond, "x", z0 + 0.2, 52.15, 69 - 0.05, SOCLE, H, froid(PANNEAU_FROID, 0.6), matiere(), 0.1);
  pan(fond, "x", z0 + 0.2, 71 + 0.05, x1 - 0.15, SOCLE, H, froid(PANNEAU_FROID, 0.6), matiere(), 0.1);
  pan(fond, "x", z0 + 0.2, 69, 71, 2.6, H, froid(PANNEAU_FROID, 0.6), matiere(), 0.1);

  // ---- Les toits ----
  // Le hangar : deux pentes de fibrociment, faîtage est-ouest à z = 20 ; des plaques translucides, trois trous.
  const pente = Math.atan2(FAITE - H, 12);
  const yToit = (z: number) => H + (FAITE - H) * (1 - Math.abs(z - 20) / 12);
  const largeurTole = 2;
  let n = 0;
  const rangs: [number, number, 1 | -1][] = [[z0 - 0.4, 16, -1], [16, 20, -1], [20, zc + 0.15, 1]];
  for (let x = x0 - 0.3; x < x1 + 0.2; x += largeurTole - 0.03) {
    for (const [za, zb, s] of rangs) {
      n++;
      const zm = (za + zb) / 2;
      const longueur = (zb - za) / Math.cos(pente) + 0.04;
      const versFroide = zb <= 16.01 && x + largeurTole / 2 > 52;
      const cible = versFroide ? tf : th;
      if (n === 17 || n === 41 || n === 64) continue; // des tôles envolées
      const clair = n % 11 === 4;
      const teinte = cible.hasard() < 0.3 ? 0x858a78 : cible.hasard() < 0.5 ? 0x9ea096 : 0x93958c;
      cible.poser(geoToleOndulee(largeurTole, longueur, 0.18, 0.04), clair ? mats.translucide : tole, clair ? 0xffffff : teinte, { x: x + largeurTole / 2, y: yToit(zm) + 0.06, z: zm, rx: s * pente }, { nuance: 0.06, crasse: false });
    }
  }
  // Pannes et fermes (visibles par les trous, et quand le toit s'efface à demi)
  for (const z of [10, 14, 18, 22, 26, 30]) th.pave(x0, yToit(z) - 0.2, z - 0.06, x1, yToit(z) - 0.05, z + 0.06, 0x55524d, acier);
  for (let x = x0 + 6.6; x < x1 - 1; x += 6.6) {
    th.poutre(new THREE.Vector3(x, H - 0.1, z0 + 0.2), new THREE.Vector3(x, FAITE - 0.25, 20), 0.18, 0x5d6266, acier);
    th.poutre(new THREE.Vector3(x, FAITE - 0.25, 20), new THREE.Vector3(x, H - 0.1, zc - 0.2), 0.18, 0x5d6266, acier);
  }
  th.pave(x0 - 0.3, FAITE + 0.02, 19.8, x1 + 0.3, FAITE + 0.12, 20.2, 0x8d9396, acier);
  // Les pignons : est (côté caméra, avec le hangar), ouest (au fond)
  const pignon = new THREE.Shape([new THREE.Vector2(-12, 0), new THREE.Vector2(12, 0), new THREE.Vector2(0, FAITE - H)]);
  const geoPignon = new THREE.ExtrudeGeometry(pignon, { depth: MUR, bevelEnabled: false }).rotateY(Math.PI / 2);
  th.poser(geoPignon, matiere(), 0x84907f, { x: x1 - MUR / 2, y: H, z: 20 });
  fond.poser(geoPignon, matiere(), 0x84907f, { x: x0 - MUR / 2, y: H, z: 20 });
  // Les néons morts, pendus aux fermes
  for (let x = 38; x < 72; x += 6.6) for (const z of [22.2, 26.8]) {
    th.boite(1.5, 0.08, 0.16, froid(0xd8dcd8, 0.6), { x, y: 5.2, z }, acier);
    for (const s of [-1, 1]) th.poutre(new THREE.Vector3(x + s * 0.6, 5.25, z), new THREE.Vector3(x + s * 0.6, yToit(z) - 0.2, z), 0.012, 0x2a2826, acier);
  }
  // Les gouttières
  for (const z of [z0 - 0.45, zc + 0.2]) th.pave(x0 - 0.3, H - 0.12, z - 0.08, x1 + 0.3, H, z + 0.08, 0x8a8f94, acier);

  // L'avant : toit plat, acrotère, la ventilation de la chambre froide ailleurs, une flaque
  ta.pave(x0, HF - 0.2, zc, x1, HF, z1, 0xffffff, mats.toitPlat, { nuance: 0, crasse: false });
  for (const [a, b2, cz, dz] of [[x0, x1, z1 - 0.12, 0.25], [x0, x1, zc + 0.12, 0.25]] as const) ta.pave(a, HF, cz - dz / 2, b2, HF + 0.45, cz + dz / 2, 0xffffff, mats.enduit);
  for (const xx of [x0 + 0.12, x1 - 0.12]) ta.pave(xx - 0.12, HF, zc, xx + 0.12, HF + 0.45, z1, 0xffffff, mats.enduit);
  ta.boite(1.4, 0.9, 1.0, 0x9ea3a6, { x: 66, y: HF + 0.45, z: 35 }, acier);
  ta.boite(0.5, 0.6, 0.5, 0x8a8f94, { x: 40, y: HF + 0.3, z: 34 }, acier);

  // ---- L'intérieur du libre-service (pas sombre) ----
  // Étagères murales le long du mur ouest, des seaux, des outils de jardin
  const acierClair = matiere();
  for (const y of [0.4, 1.0, 1.6]) c.pave(x0 + 0.15, SOL + y, 33, x0 + 0.65, SOL + y + 0.03, 39.5, 0xbfbab0, acierClair);
  for (let z = 33.2; z < 39.4; z += 0.35) {
    if (c.hasard() < 0.45) continue;
    const y = [0.4, 1.0, 1.6][Math.floor(c.hasard() * 3)]!;
    c.poser(new THREE.CylinderGeometry(0.13, 0.11, 0.26, 8), matiere(), [0xc8362b, 0x3b5a8c, 0x5f8a46, 0xd8c43a][Math.floor(c.hasard() * 4)]!, { x: x0 + 0.4, y: SOL + y + 0.16, z }, { crasse: false });
  }
  // Le caddie renversé, des paniers, des prospectus
  c.repere({ x: 49, y: SOL, z: 38.6, ry: 0.7 }, () => {
    c.boite(0.55, 0.45, 0.85, 0x9ea3a6, { y: 0.28, rz: Math.PI / 2 }, acierClair);
    c.boite(0.05, 0.7, 0.05, 0x55524d, { x: -0.3, y: 0.35, z: 0.5, rz: 1.2 }, acierClair);
  });
  for (let i = 0; i < 4; i++) c.boite(0.4, 0.2, 0.28, 0xc8362b, { x: 40 + c.hasard() * 15, y: SOL + 0.1, z: 33 + c.hasard() * 6, ry: c.hasard() * 3, rz: c.hasard() < 0.5 ? 1.4 : 0 }, acierClair);
  for (let i = 0; i < 30; i++) c.boite(0.15, 0.003, 0.21, [0xe9e4d4, 0xd8c43a, 0xe0a030][i % 3]!, { x: 35 + c.hasard() * 22, y: SOL + 0.006 + i * 0.0003, z: 32.6 + c.hasard() * 7, ry: c.hasard() * 3 }, matiere(), { crasse: false, nuance: 0 });

  // ---- Le hangar (sombre) : big bags et chariot dans l'aile nord-ouest, palettes près du quai ----
  for (let i = 0; i < 7; i++) charge(c, 37 + (i % 4) * 1.6, SOL, 10 + Math.floor(i / 4) * 1.4, 1, 3);
  for (let i = 0; i < 5; i++) charge(c, 37 + i * 1.5, SOL, 14.6, 1, i % 2 ? 0 : 2);
  charge(c, 35.4, SOL, 22.8, 1, 1);
  charge(c, 35.4, SOL, 30.6, 1, 4);
  // Les sacs crevés au milieu d'une allée, de l'engrais répandu
  for (let i = 0; i < 4; i++) sac(c, 55 + c.hasard() * 2, SOL, 22 + c.hasard() * 0.8, froid(0xe6e2d6), c.hasard() * 3, froid(VERT_COOP));
  tacheSol(c, 56, SOL + 0.004, 22.3, 0.8, froid(0xd9d3c4, 0.8));

  // ---- La chambre froide (très sombre) : le rail à crochets, des caisses, les semences ----
  for (const z of [10.5, 13]) {
    tf.pave(53, 3.2, z - 0.04, 73.5, 3.28, z + 0.04, froid(0xa9aeb0, 0.8), acier);
    for (let x = 54; x < 73; x += 0.9) tf.poutre(new THREE.Vector3(x, 3.2, z), new THREE.Vector3(x, 2.7 + c.hasard() * 0.2, z), 0.02, froid(0x8a8f94, 0.8), acier);
  }
  const caisses = [0x3b5a8c, 0x5f8a46, 0xc8362b, 0xd8d6cb];
  for (let i = 0; i < 9; i++) {
    const x = 53.5 + c.hasard() * 18;
    const z = 9 + c.hasard() * 5.5;
    if (Math.abs(x - 60) < 1.4 && z > 14) continue;
    const pile = 1 + Math.floor(c.hasard() * 4);
    for (let k = 0; k < pile; k++) c.boite(0.6, 0.3, 0.4, froid(caisses[Math.floor(c.hasard() * 4)]!, 1.2), { x, y: SOL + 0.15 + k * 0.3, z, ry: (c.hasard() - 0.5) * 0.3 }, matiere(), { crasse: false });
  }
  for (const x of [66, 68.6]) {
    palette(c, x, SOL, 14.8, 0, 1.2);
    for (const dx of [-0.3, 0.3]) for (const dz of [-0.2, 0.2]) sac(c, x + dx, SOL + 0.145, 14.8 + dz, froid(0xe9dfc6, 1.2), 0, froid(0xc8362b, 1.2));
  }
  // Étagères inox basses le long du mur nord
  for (const y of [0.3, 0.9, 1.5]) c.pave(54, SOL + y, z0 + 0.35, 66, SOL + y + 0.03, z0 + 0.95, froid(0xb8bcbc, 1), acier);
  for (let x = 54.2; x < 66; x += 0.5) if (c.hasard() < 0.5) c.boite(0.4, 0.25, 0.35, froid(caisses[Math.floor(c.hasard() * 4)]!, 1.2), { x, y: SOL + 0.3 + Math.floor(c.hasard() * 3) * 0.6 + 0.16, z: z0 + 0.65 }, matiere(), { crasse: false });
  // Le givre au sol
  for (let i = 0; i < 6; i++) tacheSol(c, 54 + c.hasard() * 18, SOL + 0.008, 9 + c.hasard() * 6, 0.6 + c.hasard() * 0.8, froid(0x93a0a6, 0.6));

  // ---- Le quai de chargement (dehors, contre le mur ouest du hangar) ----
  // Un auvent en console (sans poteaux), des butoirs, des chevrons, le bouton extérieur de la sonnette (la sonnerie est
  // dedans, voir creerLeurres)
  const zq = 26;
  for (let z = 19; z < 33.5; z += 1.95) fond.poser(geoToleOndulee(1.98, 4.6, 0.2, 0.04), tole, fond.hasard() < 0.4 ? 0x86604a : 0x8d9396, { x: x0 - 2.3, y: 4.85 + 0.1, z: z + 0.98, ry: Math.PI / 2, rz: 0.08 }, { nuance: 0.08, crasse: false });
  for (const z of [19.2, 26, 32.8]) fond.poutre(new THREE.Vector3(x0 - 0.15, 3.9, z), new THREE.Vector3(x0 - 4.4, 4.62, z), 0.12, 0x55524d, acier);
  for (const z of [19.2, 26, 32.8]) fond.poutre(new THREE.Vector3(x0 - 0.15, 2.8, z), new THREE.Vector3(x0 - 3.2, 4.5, z), 0.08, 0x55524d, acier);
  for (const s of [-1, 1]) {
    c.boite(0.25, 0.5, 0.3, 0x232220, { x: x0 - 0.28, y: 0.55, z: zq + s * 2.3 });
    for (let k = 0; k < 4; k++) c.boite(0.02, 0.18, 0.25, k % 2 ? 0x2a2826 : 0xd8c43a, { x: x0 - 0.16, y: 0.25 + k * 0.2, z: zq + s * 1.95, rx: 0.6 }, matiere(), { crasse: false });
  }
  c.boite(0.12, 0.2, 0.16, 0x3a3d42, { x: x0 - 0.21, y: 1.55, z: zq + 2.7 }, acier);
  c.poser(new THREE.SphereGeometry(0.09, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), acier, PALETTE.laiton, { x: x0 - 0.3, y: 1.62, z: zq + 2.7, rz: Math.PI / 2 });
  return objets;
}

// ---------- Les leurres posés dans le décor (Book 23 §4.7) ----------

/** Le tracteur rouge (le premier du plan, sans cabine) : celui dont on peut faire sonner le klaxon. */
const TRACTEUR_ROUGE = MOBILIER.find((m) => m.genre === "tracteur")!;

/** Un point du repère d'un engin (x à droite, z vers l'arrière) ramené au sol de la Coopérative. */
function pointDEngin(m: (typeof MOBILIER)[number], x: number, z: number): { x: number; z: number } {
  const o = m.o ?? 0;
  const r = (v: number) => Math.round(v * 100) / 100;
  return { x: r(m.boite.x + x * Math.cos(o) + z * Math.sin(o)), z: r(m.boite.z - x * Math.sin(o) + z * Math.cos(o)) };
}

/**
 * Les leurres de la Coopérative, là où le rendu les dessine (mètres, sol du lieu) : à reprendre côté serveur pour
 * l'interaction. Aucun n'est un obstacle (la sonnette est au mur, la radio sur l'établi, le klaxon dans le tracteur).
 * - `sonnette` : la sonnerie de quai et son bouton, au mur ouest du hangar, côté intérieur (le mur est en x 34, sa
 *   face intérieure en x 34,15), juste au sud de la porte du quai (z 24,25 à 27,75). Bouton à 1,4 m, cloche à 2,6 m.
 *   Dehors, le petit boîtier à dôme de laiton (x 33,8) en est le bouton côté quai, pour les chauffeurs.
 * - `radio` : la radio à piles, posée sur l'établi de l'atelier (x 7,5, z 30,5) ; l'objet 3D s'appelle
 *   « leurre-radio » dans le groupe de la Coopérative (à masquer quand on la prend).
 * - `klaxon` : le volant du tracteur rouge (x 12, z 20, sans cabine). Le tracteur est un obstacle : prévoir une portée
 *   d'au moins 1,6 m depuis ce point.
 */
export const LEURRES_COOP = {
  sonnette: { x: 34.3, z: 28.6 },
  radio: { x: 7.2, z: 30.5 },
  klaxon: pointDEngin(TRACTEUR_ROUGE, 0, 0.33),
} as const;

/** La sonnette du quai (à l'intérieur) et la radio à piles de l'établi : chacune son petit groupe. */
function creerLeurres(): THREE.Group {
  const groupe = new THREE.Group();
  groupe.name = "leurres";

  // La sonnette : une grosse sonnerie électrique d'entrepôt, cloche de laiton sur un socle rouge, son marteau dessous,
  // le tube électrique qui descend au boîtier jaune et à son gros bouton rouge. Un peu plus grande que nature (lisible).
  const s = new Assemblage(2361);
  const zs = LEURRES_COOP.sonnette.z;
  const xm = B.x0 + MUR / 2; // la face intérieure du mur
  s.ajouter(placer(new THREE.CylinderGeometry(0.19, 0.19, 0.045, 14).rotateZ(Math.PI / 2), xm + 0.022, 2.6, zs), 0xb8302a, "tole");
  s.ajouter(placer(new THREE.SphereGeometry(0.22, 14, 5, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2), xm + 0.05, 2.6, zs), 0xd2b062, "metal", 0.04);
  s.ajouter(placer(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 8).rotateZ(Math.PI / 2), xm + 0.28, 2.6, zs), 0x55524d, "metal");
  s.ajouter(placer(new THREE.BoxGeometry(0.08, 0.1, 0.09), xm + 0.07, 2.32, zs), 0x8e2620, "tole");
  s.perche(new V3(xm + 0.09, 2.35, zs), new V3(xm + 0.2, 2.44, zs), 0.012, 0x3a3836, "metal", 5);
  s.ajouter(placer(new THREE.SphereGeometry(0.025, 6, 4), xm + 0.21, 2.45, zs), 0x3a3836, "metal");
  s.perche(new V3(xm + 0.03, 2.27, zs), new V3(xm + 0.03, 1.5, zs), 0.016, 0x8a8f94, "metal", 6);
  s.ajouter(placer(new THREE.BoxGeometry(0.07, 0.2, 0.15), xm + 0.035, 1.4, zs), 0xd8b52a, "tole");
  s.ajouter(placer(new THREE.CylinderGeometry(0.042, 0.048, 0.04, 10).rotateZ(Math.PI / 2), xm + 0.09, 1.42, zs), 0xc8261e, "tole");
  s.ajouter(placer(new THREE.BoxGeometry(0.008, 0.035, 0.11), xm + 0.072, 1.33, zs), 0x2a2826, "mat");
  const sonnette = s.groupe();
  sonnette.name = "leurre-sonnette";
  groupe.add(sonnette);

  // La radio à piles : un poste portatif des années 70, orange et crème, la grille du haut-parleur, le cadran, la
  // poignée, et l'antenne télescopique tirée, qui se voit de loin. Construite face à +z, puis tournée vers la caméra ;
  // nettement plus grande que nature (×1,3) et de couleurs vives : l'atelier est sombre, elle doit s'y repérer.
  const r = new Assemblage(2362);
  const ORANGE = 0xe36a2c;
  const CREME = 0xf0e6c8;
  r.ajouter(placer(new THREE.BoxGeometry(0.44, 0.26, 0.13), 0, 0.13, 0), ORANGE, "tole", 0.03);
  r.ajouter(placer(new THREE.BoxGeometry(0.45, 0.045, 0.135), 0, 0.27, 0), CREME, "tole");
  // La grille : des fentes sombres sur une plaque argentée.
  r.ajouter(placer(new THREE.BoxGeometry(0.2, 0.17, 0.006), -0.1, 0.13, 0.066), 0xd0d3d3, "metal");
  for (let i = 0; i < 6; i++) r.ajouter(placer(new THREE.BoxGeometry(0.17, 0.008, 0.004), -0.1, 0.07 + i * 0.024, 0.07), 0x2a2826, "mat");
  // Le cadran, crème, et ses deux boutons.
  r.ajouter(placer(new THREE.BoxGeometry(0.15, 0.06, 0.006), 0.11, 0.18, 0.066), CREME, "mat");
  r.ajouter(placer(new THREE.BoxGeometry(0.004, 0.05, 0.004), 0.09, 0.18, 0.07), 0xc8261e, "mat");
  for (const x of [0.07, 0.15]) r.ajouter(placer(new THREE.CylinderGeometry(0.022, 0.022, 0.025, 8).rotateX(Math.PI / 2), x, 0.08, 0.075), 0x2a2826, "metal");
  // La poignée, en arc au-dessus.
  r.ajouter(placer(new THREE.TorusGeometry(0.13, 0.014, 4, 10, Math.PI), 0, 0.29, 0), 0x2a2826, "mat");
  // L'antenne : trois brins de plus en plus fins, une boule au bout.
  const pied = new V3(0.19, 0.29, -0.04);
  const dir = new V3(0.42, 1, -0.2).normalize();
  const brins = [0.013, 0.01, 0.008];
  brins.forEach((rayon, i) => r.perche(pied.clone().addScaledVector(dir, i * 0.24), pied.clone().addScaledVector(dir, (i + 1) * 0.24 + 0.01), rayon, 0xe4e8ea, "metal", 5));
  const bout = pied.clone().addScaledVector(dir, 0.73);
  r.ajouter(placer(new THREE.SphereGeometry(0.02, 6, 4), bout.x, bout.y, bout.z), 0xe4e8ea, "metal");
  const radio = r.groupe();
  radio.name = "leurre-radio";
  radio.position.set(LEURRES_COOP.radio.x, SOL + 0.94, LEURRES_COOP.radio.z);
  radio.rotation.y = 0.55;
  radio.scale.setScalar(1.3);
  groupe.add(radio);
  return groupe;
}

/**
 * La radio se prend et se pose ailleurs (Book 23 §4.7, 0.5.1) : sur l'établi, à sa place ; ailleurs, au sol, tournée
 * vers la caméra ; dans un sac (null), on ne la voit plus.
 */
export function placerRadio(groupe: THREE.Object3D, ou: { x: number; z: number } | null): void {
  const radio = groupe.getObjectByName("leurre-radio");
  if (!radio) return;
  radio.visible = ou !== null;
  if (!ou) return;
  const etabli = radioSurEtabli(ou);
  radio.position.set(ou.x, etabli ? SOL + 0.94 : SOL + 0.03, ou.z);
  radio.rotation.y = etabli ? 0.55 : Math.PI / 4;
}

// ---------- L'atelier des tracteurs ----------

function creerAtelier(ch: Chantiers, mats: Mats & { translucide: THREE.Material }): void {
  const { c, tt, fond } = ch;
  const { x0, x1, z0, z1 } = A;
  const acier = matiere();
  const tole = matiere();
  const zm = (z0 + z1) / 2;
  // La dalle, découpée autour de la fosse ; la fosse elle-même, un vrai trou d'1,4 m
  const fx0 = FOSSE.x - FOSSE.l / 2;
  const fx1 = FOSSE.x + FOSSE.l / 2;
  const fz0 = FOSSE.z - FOSSE.p / 2;
  const fz1 = FOSSE.z + FOSSE.p / 2;
  const dalle = froid(0x6e6b66, 0.6);
  c.pave(x0, 0, z0, fx0, 0.08, z1, dalle);
  c.pave(fx1, 0, z0, x1, 0.08, z1, dalle);
  c.pave(fx0, 0, z0, fx1, 0.08, fz0, dalle);
  c.pave(fx0, 0, fz1, fx1, 0.08, z1, dalle);
  const fond2 = 0x2b2c2b;
  c.pave(fx0, -1.4, fz0, fx1, -1.35, fz1, fond2);
  c.pave(fx0 - 0.1, -1.4, fz0, fx0, 0.08, fz1, 0x46484a);
  c.pave(fx1, -1.4, fz0, fx1 + 0.1, 0.08, fz1, 0x3d3f41);
  c.pave(fx0, -1.4, fz0 - 0.1, fx1, 0.08, fz0, 0x46484a);
  c.pave(fx0, -1.4, fz1, fx1, 0.08, fz1 + 0.1, 0x3d3f41);
  for (let k = 0; k < 5; k++) c.pave(fx0, -1.4, fz1 - 0.3 * (k + 1), fx1, -1.4 + 0.28 * (5 - k), fz1 - 0.3 * k, 0x4d4f50);
  // La margelle peinte en jaune et noir
  for (let z = fz0 - 0.1; z < fz1 + 0.1; z += 0.4) for (const x of [fx0 - 0.1, fx1]) c.pave(x, 0.08, z, x + 0.1, 0.09, z + 0.2, 0xc9a83a, matiere(), { crasse: false });
  // Des taches d'huile, des pneus empilés, des fûts, un compresseur
  for (let i = 0; i < 8; i++) tacheSol(c, x0 + 2 + c.hasard() * 18, 0.085, z0 + 2 + c.hasard() * 16, 0.35 + c.hasard() * 0.4, 0x46443f);
  for (const [x, z, nb] of [[x1 - 1, z0 + 1.2, 5], [x1 - 2.2, z0 + 1, 3], [x0 + 1, z0 + 6, 4]] as const) for (let i = 0; i < nb; i++) c.poser(new THREE.TorusGeometry(0.45, 0.17, 5, 12).rotateX(Math.PI / 2), matiere(), 0x232220, { x: x + (c.hasard() - 0.5) * 0.1, y: 0.25 + i * 0.32, z }, { nuance: 0.04 });
  for (let i = 0; i < 4; i++) fut(c, x0 + 0.7 + i * 0.65, 0.08, z1 - 0.8, froid([0x2a2826, 0xb5452e, 0x2f5d8a, 0x3a6b3a][i]!, 0.7));
  c.poser(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 10).rotateZ(Math.PI / 2), matiere(), froid(0xc8362b, 0.7), { x: x1 - 1.4, y: 0.42, z: z1 - 1 });
  // Une étagère de pièces le long du mur nord
  for (const y of [0.5, 1.2, 1.9]) c.pave(x0 + 6, y, z0 + 0.3, x0 + 12, y + 0.04, z0 + 0.9, froid(0x7d7a72, 0.7), acier);
  for (let x = x0 + 6.2; x < x0 + 12; x += 0.45) if (c.hasard() < 0.6) c.boite(0.35, 0.25, 0.4, froid([0xb08a5a, 0x55524d, 0x2f5d8a][Math.floor(c.hasard() * 3)]!, 0.7), { x, y: [0.5, 1.2, 1.9][Math.floor(c.hasard() * 3)]! + 0.17, z: z0 + 0.6 }, acier);
  for (const x of [x0 + 6, x0 + 12]) c.boite(0.06, 2.1, 0.6, froid(0x55524d, 0.7), { x, y: 1.05, z: z0 + 0.6 }, acier);

  // Les murs : parpaings ; sud et est s'effacent avec le toit ; nord et ouest au fond
  poserLigne(c, { sens: "x", fixe: z1, a: x0, b: x1, h: HA, dehors: 1, haut: tt, habit: "parpaing", interieur: froid(0x8a877f, 0.7) }, mats);
  poserLigne(c, { sens: "z", fixe: x1, a: z0, b: z1, h: HA, dehors: 1, haut: tt, habit: "parpaing", interieur: froid(0x8a877f, 0.7) }, mats);
  poserLigne(c, { sens: "x", fixe: z0, a: x0, b: x1, h: HA, dehors: -1, haut: fond, habit: "parpaing", interieur: froid(0x8a877f, 0.7) }, mats);
  poserLigne(c, { sens: "z", fixe: x0, a: z0, b: z1, h: HA, dehors: -1, haut: fond, habit: "parpaing", interieur: froid(0x8a877f, 0.7) }, mats);
  // Les pignons
  const demi = (z1 - z0) / 2;
  const pignon = new THREE.Shape([new THREE.Vector2(-demi, 0), new THREE.Vector2(demi, 0), new THREE.Vector2(0, FAITE_A - HA)]);
  const geoPignon = new THREE.ExtrudeGeometry(pignon, { depth: MUR, bevelEnabled: false }).rotateY(Math.PI / 2);
  tt.poser(geoPignon, matiere(), 0x9a958a, { x: x1 - MUR / 2, y: HA, z: zm });
  fond.poser(geoPignon, matiere(), 0x9a958a, { x: x0 - MUR / 2, y: HA, z: zm });
  // Le toit de tôle ondulée rouillée : des trous, une plaque translucide
  const pente = Math.atan2(FAITE_A - HA, demi);
  const longueur = Math.hypot(FAITE_A - HA, demi + 0.4) + 0.05;
  const tolePlaque = geoToleOndulee(0.98, longueur, 0.24, 0.045);
  let n = 0;
  for (const s of [-1, 1]) {
    for (let x = x0 - 0.3; x < x1 + 0.25; x += 0.95) {
      n++;
      if (n === 6 || n === 9 || n === 33 || n === 34 || n === 41) continue;
      const clair = n === 15 || n === 38;
      const teinte = tt.hasard() < 0.4 ? 0x86604a : tt.hasard() < 0.5 ? 0x8d9396 : 0x7a6d60;
      tt.poser(tolePlaque, clair ? mats.translucide : tole, clair ? 0xffffff : teinte, { x: x + 0.475, y: (HA + FAITE_A) / 2 + 0.06, z: zm + (s * (demi + 0.4)) / 2, rx: s * pente }, { nuance: 0.1, crasse: false });
    }
  }
  for (const s of [-1, 1]) for (const d of [3, 7]) tt.pave(x0, FAITE_A - (FAITE_A - HA) * (d / demi) - 0.16, zm + s * d - 0.06, x1, FAITE_A - (FAITE_A - HA) * (d / demi) - 0.04, zm + s * d + 0.06, 0x55524d, acier);
  tt.pave(x0 - 0.3, FAITE_A + 0.02, zm - 0.22, x1 + 0.3, FAITE_A + 0.1, zm + 0.22, 0x8d9396, acier);
  // Le palan, pendu à la poutre au-dessus de la fosse
  tt.pave(x0 + 0.2, HA - 0.4, FOSSE.z - 0.1, x1 - 0.2, HA - 0.2, FOSSE.z + 0.1, 0xc9a83a, acier);
  tt.boite(0.3, 0.35, 0.2, 0x3a3d42, { x: FOSSE.x, y: HA - 0.65, z: FOSSE.z }, acier);
  tt.poutre(new THREE.Vector3(FOSSE.x, HA - 0.8, FOSSE.z), new THREE.Vector3(FOSSE.x, 2.2, FOSSE.z), 0.03, 0x55524d, acier);
  // Du lierre sur le mur ouest (vu de la brèche)
  lierre(fond, x0 - 0.2, 0.1, 27, -Math.PI / 2, 3, 3.5, 70);
  lierre(fond, x0 + 4, 0.1, z0 - 0.2, Math.PI, 2.5, 3, 50);
}

// ---------- La lisière (la carte est petite : pas de forêt lointaine) ----------

/**
 * Une lisière basse et peu dense contre le grillage, puis des massifs sombres et le sol de sous-bois : de quoi
 * fermer tous les cadrages de jeu. Six morceaux (un par côté, nord et sud en deux) : un appel de dessin chacun,
 * et la caméra n'en voit qu'un ou deux. Ni les arbres ni les massifs ne portent d'ombre en temps réel : leur ombre
 * est cuite au sol (creerOmbresCuites).
 */
function creerLisiere(aleat: () => number, ombres: OmbreCuite[]): THREE.Group {
  const g = new THREE.Group();
  const morceaux = new Map<string, Chantier>();
  const morceau = (x: number, z: number) => {
    const cle = x < 0 ? "ouest" : x > L ? "est" : z < 0 ? (x < L / 2 ? "nord-o" : "nord-e") : x < L / 2 ? "sud-o" : "sud-e";
    let c = morceaux.get(cle);
    if (!c) morceaux.set(cle, (c = new Chantier(2400 + morceaux.size)));
    return c;
  };
  const tronc = new THREE.CylinderGeometry(0.16, 0.24, 1.6, 5).translate(0, 0.8, 0);
  const feuillu = new THREE.IcosahedronGeometry(1.25, 0).translate(0, 2.55, 0);
  const sapin = new THREE.ConeGeometry(1.1, 2.8, 6).translate(0, 2.5, 0);
  const massif = new THREE.IcosahedronGeometry(1, 0);
  const tons = [PALETTE.feuillage, PALETTE.feuillageSombre, PALETTE.feuillageClair];
  const tonsMassif = [0x3f5f35, 0x4a6a3a, 0x35502e];
  for (let i = 0; i < 700; i++) {
    const x = -22 + aleat() * (L + 44);
    const z = -22 + aleat() * (P + 44);
    const d = Math.hypot(Math.max(0, -x, x - L), Math.max(0, -z, z - P));
    if (d < 2 || d > 22) continue;
    if (Math.abs(x - PORTAIL.x) < 5 && z > P) continue; // le chemin
    const c = morceau(x, z);
    // Côté caméra (sud, est), plus bas, pour ne pas cacher la cour.
    const cote = z > P || x > L;
    if (d < 9 && aleat() < 0.45) {
      const e = cote ? 0.55 + aleat() * 0.25 : 0.8 + aleat() * 0.6;
      const ry = aleat() * 6;
      c.poser(tronc, matiere(), PALETTE.bois, { x, z, ry, e }, { nuance: 0.05, crasse: false });
      const t = tons[Math.floor(aleat() * 3)]!;
      if (aleat() < 0.3) c.poser(sapin, matiere(), t, { x, z, ry, e }, { nuance: 0.05, crasse: false });
      else c.poser(feuillu, matiere(), t, { x, z, ry, e: [e, e * (0.9 + aleat() * 0.3), e] }, { nuance: 0.06, crasse: false });
      ombres.push({ x: x - 0.5 * e, z: z + 0.8 * e, y: 0.015, l: 2.6 * e, p: 2.6 * e, rond: true });
    } else if (d > 5 && aleat() < 0.65) {
      const l = 1.8 + aleat() * 1.8;
      const hh = cote ? 0.8 + aleat() * 0.5 : 1.1 + aleat() * 1.3;
      c.poser(massif, matiere(), tonsMassif[Math.floor(aleat() * 3)]!, { x, y: hh * 0.35, z, ry: aleat() * 6, e: [l, hh, l * (0.7 + aleat() * 0.5)] }, { nuance: 0.06, crasse: false });
    }
  }
  for (const [nom, c] of morceaux) {
    const o = c.construire();
    sansOmbrePortee(o);
    o.name = nom;
    g.add(o);
  }
  return g;
}

// ---------- Les ombres : volumes simples et ombres cuites ----------

/** Rien dans cet objet ne porte d'ombre en temps réel (il en reçoit toujours). */
function sansOmbrePortee(o: THREE.Object3D): void {
  o.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) m.castShadow = false;
  });
}

/**
 * Les ombres portées en temps réel, par des volumes simples et invisibles : les enveloppes du grand bâtiment et de
 * l'atelier (un peu en retrait des murs et sous les toits), les silos, l'auvent du quai. Un seul maillage, un appel
 * dans la passe d'ombre. Tout ce qui est dedans est à l'ombre : l'intérieur reste sombre même quand le toit s'efface.
 */
function creerOmbres(): THREE.Mesh {
  const geos: THREE.BufferGeometry[] = [];
  const boite = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => geos.push(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
  boite(B.x0 + 0.1, 0, B.z0 + 0.1, B.x1 - 0.1, H - 0.35, 32);
  boite(B.x0 + 0.1, 0, 32, B.x1 - 0.1, HF - 0.3, B.z1 - 0.1);
  boite(A.x0 + 0.1, 0, A.z0 + 0.1, A.x1 - 0.1, HA - 0.35, A.z1 - 0.1);
  boite(B.x0 - 4.3, 4.45, 19.2, B.x0 - 0.3, 4.6, 33.2);
  for (const m of MOBILIER) if (m.genre === "silo") geos.push(new THREE.CylinderGeometry(m.boite.l / 2 - 0.4, m.boite.l / 2 - 0.4, 9, 12).translate(m.boite.x, 0.35 + 4.5, m.boite.z));
  // Faces avant dans la passe d'ombre (Three.js prend les faces arrière par défaut : la boîte fermée n'ombrerait
  // alors que depuis son fond, et l'intérieur resterait au soleil).
  const m = new THREE.Mesh(mergeGeometries(geos, false)!, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, shadowSide: THREE.FrontSide }));
  m.castShadow = true;
  m.receiveShadow = false;
  m.name = "ombres";
  return m;
}

/** Une ombre cuite : une tache sombre et floue posée au sol (sous les rayonnages, les engins, les meubles, les arbres). */
interface OmbreCuite {
  x: number;
  z: number;
  y: number;
  l: number;
  p: number;
  ry?: number;
  rond?: boolean;
}

function textureOmbreCuite(rond: boolean): THREE.CanvasTexture {
  return dessiner(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    if (rond) {
      const d = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      d.addColorStop(0, "rgba(0,0,0,0.85)");
      d.addColorStop(0.5, "rgba(0,0,0,0.6)");
      d.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = d;
      g.fillRect(0, 0, 64, 64);
    } else for (let i = 0; i < 16; i++) {
      // Un rectangle aux bords flous : des couches de plus en plus petites
      g.fillStyle = "rgba(0,0,0,0.1)";
      const m = i * 1.7;
      g.fillRect(m, m, 64 - 2 * m, 64 - 2 * m);
    }
  });
}

/** Toutes les ombres cuites en deux appels de dessin (rectangles, ronds). */
function creerOmbresCuites(liste: OmbreCuite[]): THREE.Group {
  const g = new THREE.Group();
  g.name = "ombres-cuites";
  const plan = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (const rond of [false, true]) {
    const ombres = liste.filter((o) => !!o.rond === rond);
    if (!ombres.length) continue;
    const mat = new THREE.MeshBasicMaterial({ map: textureOmbreCuite(rond), color: 0x000000, transparent: true, opacity: rond ? 0.42 : 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const inst = new THREE.InstancedMesh(plan, mat, ombres.length);
    ombres.forEach((o, i) => inst.setMatrixAt(i, m.compose(new THREE.Vector3(o.x, o.y, o.z), q.setFromAxisAngle(Y, o.ry ?? 0), new THREE.Vector3(o.l, 1, o.p))));
    inst.computeBoundingSphere();
    inst.renderOrder = 1;
    g.add(inst);
  }
  return g;
}

// ---------- L'ensemble ----------

/**
 * Construit tout le lieu (repère du plan : x de 0 à 80 m vers l'est, z de 0 à 60 m vers le sud).
 * `userData.toits` : ce qui s'efface (voir estomperCooperative) ; `userData.portes` : voir majPortes.
 */
export function creerCooperative(): THREE.Group {
  const groupe = new THREE.Group();
  const aleat = aleatoire(2323);
  const toits: Toit[] = [];

  const mats = {
    bardage: matiereTexture(textureBardage(2301, "#8e998c"), { roughness: 0.62, metalness: 0.28 }),
    enduit: matiereTexture(textureEnduit(2303, "#d9cfb5")),
    parpaing: matiereTexture(textureParpaings(2304)),
    verre: matiereVerre(0x3a5560, 0.45),
    enseigne: matiereTexture(textureEnseigne(), { roughness: 0.7 }),
    toitPlat: matiereTexture(textureToitPlat(2305)),
    translucide: matiereVerre(0xdfe6d6, 0.55),
    affiches: [matiereTexture(textureAffichePromo("-20 %", "ENGRAIS GAZON", "#f2e27a"))],
    carrelage: (() => {
      const t = textureCarrelage();
      t.repeat.set((58 - B.x0) / 2, (B.z1 - 32) / 2);
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 });
    })(),
    grillage: (() => {
      const m = new THREE.MeshStandardMaterial({ map: textureGrillage(), vertexColors: true, transparent: true, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4, depthWrite: false });
      m.userData.sansOmbre = true;
      m.userData.grillage = true;
      return m;
    })(),
  };

  // Le fixe, découpé par zone (le grand bâtiment, l'atelier, la cour, le grillage) : la caméra et la passe d'ombre
  // ne dessinent que ce qui sert. Seuls le grillage et la camionnette portent une ombre en temps réel ; le reste
  // reçoit celle des volumes simples (creerOmbres) et ses ombres cuites (creerOmbresCuites).
  const zones = { batiment: new Chantier(2330), atelier: new Chantier(2339), cour: new Chantier(2350), grillage: new Chantier(2351) };
  const ch: Chantiers = { c: zones.batiment, ta: new Chantier(2331), th: new Chantier(2332), tf: new Chantier(2333), tt: new Chantier(2334), fond: new Chantier(2335) };
  const hautSilos = new Chantier(2336);
  const engins = { atelier: new Assemblage(2337), batiment: new Assemblage(2352), cour: new Assemblage(2353) };
  for (const a of Object.values(engins)) {
    a.occlusion = 0.7;
    a.forceOcclusion = 0.45;
  }
  const ombres: OmbreCuite[] = [];

  const fixes = new THREE.Group();
  const sols = creerSols(aleat);
  sols.name = "sols";
  groupe.add(sols);
  for (const o of creerBatiment(ch, mats)) fixes.add(o);
  ch.c = zones.atelier;
  creerAtelier(ch, mats);
  creerCloture(zones.grillage, mats.grillage);
  const c = zones.cour;

  // La bascule à camions : cadre de béton, tablier d'acier strié, bords jaunes
  c.pave(BASCULE.x - BASCULE.l / 2 - 0.35, 0, BASCULE.z - BASCULE.p / 2 - 0.35, BASCULE.x + BASCULE.l / 2 + 0.35, 0.05, BASCULE.z + BASCULE.p / 2 + 0.35, BETON);
  c.pave(BASCULE.x - BASCULE.l / 2, 0.05, BASCULE.z - BASCULE.p / 2, BASCULE.x + BASCULE.l / 2, 0.1, BASCULE.z + BASCULE.p / 2, 0x6f736f, matiere());
  for (let z = BASCULE.z - BASCULE.p / 2 + 0.25; z < BASCULE.z + BASCULE.p / 2; z += 0.5) c.pave(BASCULE.x - BASCULE.l / 2 + 0.1, 0.1, z, BASCULE.x + BASCULE.l / 2 - 0.1, 0.115, z + 0.06, 0x5d615d, matiere(), { crasse: false });
  for (const s of [-1, 1]) for (let x = BASCULE.x - BASCULE.l / 2; x < BASCULE.x + BASCULE.l / 2 - 0.1; x += 0.5) c.pave(x, 0.1, BASCULE.z + s * (BASCULE.p / 2 - 0.15) - 0.15, x + 0.25, 0.112, BASCULE.z + s * (BASCULE.p / 2 - 0.15) + 0.15, 0xc9a83a, matiere(), { crasse: false });
  for (let i = 0; i < 9; i++) c.boite(0.08 + c.hasard() * 0.15, 0.01, 0.3 + c.hasard() * 0.9, 0x7a4a30, { x: BASCULE.x + (c.hasard() - 0.5) * 3.4, y: 0.118, z: BASCULE.z + (c.hasard() - 0.5) * 9, ry: (c.hasard() - 0.5) * 0.5 }, matiere(), { crasse: false, nuance: 0.1 });

  // Le mobilier, d'après le plan ; une ombre cuite sous chaque meuble et chaque engin (pas sous les silos ni la
  // camionnette, qui ont la leur en temps réel).
  let nTracteurs = 0;
  const cb = zones.batiment;
  const dansBatiment = (b: Boite) => b.x > B.x0 && b.x < B.x1 && b.z > B.z0 && b.z < B.z1;
  const dansAtelier = (b: Boite) => b.x > A.x0 && b.x < A.x1 && b.z > A.z0 && b.z < A.z1;
  for (const m of MOBILIER) {
    const b = m.boite;
    switch (m.genre) {
      case "caisse":
        caisse(cb, b);
        break;
      case "rayon_bas":
        rayonBas(cb, b);
        break;
      case "bureau":
        bureau(cb, b);
        break;
      case "coffre_fort":
        coffreFort(cb, b);
        break;
      case "tracteur":
        tracteur(engins.atelier, b.x, b.z, m.o ?? 0, ++nTracteurs === 2, aleat);
        break;
      case "etabli":
        etabli(zones.atelier, b);
        break;
      case "palettes":
        pilePalettes(c, b);
        break;
      case "transpalette":
        transpalette(engins.cour, b);
        break;
      case "silo":
        silo(c, hautSilos, b, toits);
        break;
      case "camionnette":
        camionnette(engins.cour, b.x, b.z, m.o ?? 0, aleat);
        break;
    }
    if (m.genre === "silo" || m.genre === "camionnette") continue;
    const y = dansBatiment(b) ? SOL + 0.012 : dansAtelier(b) ? 0.092 : 0.022;
    const grand = m.genre === "tracteur" ? 1 : 0.5;
    ombres.push({ x: b.x, z: b.z, y, l: b.l + grand, p: b.p + grand, ry: m.o ?? 0 });
  }
  chariot(engins.batiment, 47.5, 11.5, 0.6);
  ombres.push({ x: 47.5, z: 11.5, y: SOL + 0.012, l: 1.8, p: 3, ry: 0.6 });
  // Sous les big bags et les palettes du hangar, et sous les rayonnages
  ombres.push({ x: 40, z: 12.4, y: SOL + 0.012, l: 8, p: 7 });
  for (const r of RAYONNAGES) ombres.push({ x: r.x, z: r.z, y: SOL + 0.012, l: r.l + 0.9, p: r.p + 1.1 });

  // La cour des silos : la vis à grain entre les deux, une remorque de pièces, des herbes
  hautSilos.poutre(new THREE.Vector3(18.5, 10.2, 5), new THREE.Vector3(18.5, 1.2, 11.5), 0.3, 0x9a9f9f, matiere());
  hautSilos.poutre(new THREE.Vector3(14, 10.6, 5), new THREE.Vector3(23, 10.6, 5), 0.25, 0x9a9f9f, matiere());
  c.boite(0.8, 1.2, 0.8, 0x6d7276, { x: 18.5, y: 0.6, z: 11.7 }, matiere());

  // Le panneau du portail (dehors, contre le grillage)
  const panneau = new Chantier(2338);
  panneau.poser(new THREE.PlaneGeometry(2.6, 1.3), matiereTexture(texturePanneauPortail(), { roughness: 0.8 }), 0xffffff, { x: 36.5, y: 1.55, z: PORTAIL.z + 0.18 }, { nuance: 0, crasse: false });
  for (const s of [-1, 1]) c.boite(0.08, 2.3, 0.08, 0x55524d, { x: 36.5 + s * 1.2, y: 1.15, z: PORTAIL.z + 0.12 }, matiere());
  fixes.add(panneau.construire());

  // Des herbes folles : au pied du grillage, des murs, dans les fissures de la cour
  const points: [number, number][] = [];
  for (let i = 0; i < 170; i++) {
    const t = aleat();
    const cote = Math.floor(aleat() * 4);
    const e = 0.3 + aleat() * 1.2;
    points.push(cote === 0 ? [t * L, e] : cote === 1 ? [t * L, PORTAIL.z - e] : cote === 2 ? [e, t * P] : [L - e, t * P]);
  }
  for (let i = 0; i < 70; i++) points.push([B.x0 + aleat() * (B.x1 - B.x0), B.z0 - 0.4 - aleat() * 0.6]);
  for (let i = 0; i < 40; i++) points.push([3 + aleat() * 70, 42 + aleat() * 14]);
  touffes(c, points.filter(([x, z]) => Math.abs(x - PORTAIL.x) > 3.5 || z < PORTAIL.z - 3));
  // Quelques débris bas dans la cour : pneus couchés, une brouette renversée, des bâches
  for (const [x, z] of [[8, 42], [9, 43.3], [62, 52], [70, 47]] as const) c.poser(new THREE.TorusGeometry(0.4, 0.15, 5, 11).rotateX(Math.PI / 2), matiere(), 0x232220, { x, y: 0.15, z });
  c.repere({ x: 34, z: 50, ry: 0.8 }, () => {
    c.poser(new THREE.CylinderGeometry(0.45, 0.3, 0.35, 8, 1, true), matiere(), 0x2f6b8a, { y: 0.3, rz: 2.4 });
    c.poser(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 8).rotateZ(Math.PI / 2), matiere(), 0x232220, { x: 0.6, y: 0.2 });
  });
  c.poser(new THREE.PlaneGeometry(3, 2, 6, 4).rotateX(-Math.PI / 2), matiere(), 0x2f5d8a, { x: 66, y: 0.06, z: 44, ry: 0.4 }, { crasse: false });

  // Les rayonnages du hangar
  RAYONNAGES.forEach((r, i) => groupe.add(creerRayonnage(r, cb, toits, 2340 + i)));

  // Les portes, ouvertes ou fermées selon le plan ; le portail, entrouvert (ses montants vont au grillage)
  ch.c = zones.grillage;
  const vues: VuePorte[] = [];
  for (const p of [...PORTES, { id: "portail", x: PORTAIL.x, z: PORTAIL.z, largeur: PORTAIL.largeur, sens: "x" as const, ouverte: true }]) {
    const { objet, vue } = creerPorte(p, p.id === "portail" ? 1.9 : (HAUT_PORTE[p.id] ?? 2.2) - 0.02, toits, mats, ch);
    objet.name = `porte-${p.id}`;
    groupe.add(objet);
    vues.push(vue);
  }
  // On assemble : le fixe, par zone ; les morceaux qui s'effacent, avec leurs matériaux à eux.
  for (const [nom, z] of Object.entries(zones)) {
    const o = z.construire();
    o.name = nom;
    fixes.add(o);
  }
  for (const [nom, a] of Object.entries(engins)) {
    const o = a.groupe();
    o.name = `engins-${nom}`;
    fixes.add(o);
  }
  // Ne portent une ombre en temps réel que le grillage et la camionnette (avec le transpalette, dans la cour).
  for (const o of fixes.children) if (o.name !== "grillage" && o.name !== "engins-cour") sansOmbrePortee(o);
  fixes.name = "fixe";
  groupe.add(fixes, creerOmbres(), creerLeurres());

  const effacables: [Chantier, Toit[]][] = [
    [ch.ta, [{ boite: { x: (B.x0 + B.x1) / 2, z: (32 + B.z1) / 2, l: B.x1 - B.x0 + 0.4, p: B.z1 - 32 + 1 }, materiaux: [], bas: SOCLE, haut: HF + 0.6 }]],
    [
      ch.th,
      [
        { boite: { x: (B.x0 + B.x1) / 2, z: 24, l: B.x1 - B.x0 + 0.6, p: 16.6 }, materiaux: [], bas: SOCLE, haut: FAITE + 0.1 },
        { boite: { x: (B.x0 + 52) / 2, z: 12, l: 52 - B.x0 + 0.6, p: 8.6 }, materiaux: [], bas: SOCLE, haut: FAITE + 0.1 },
      ],
    ],
    [ch.tf, [{ boite: { x: 63, z: 12, l: 22.6, p: 8.6 }, materiaux: [], bas: SOCLE, haut: FAITE + 0.1 }]],
    [ch.tt, [{ boite: { x: ATELIER.x, z: ATELIER.z, l: ATELIER.l + 0.6, p: ATELIER.p + 0.8 }, materiaux: [], bas: SOCLE, haut: FAITE_A + 0.1 }]],
    [
      ch.fond,
      [
        // Les murs du fond : ils ne s'effacent que si l'on est derrière, dehors.
        { boite: { x: (B.x0 + B.x1) / 2, z: B.z0, l: B.x1 - B.x0, p: 0.6 }, materiaux: [], bas: SOCLE, haut: FAITE, horsDe: BATIMENT },
        { boite: { x: B.x0, z: (B.z0 + B.z1) / 2, l: 0.6, p: B.z1 - B.z0 }, materiaux: [], bas: SOCLE, haut: FAITE, horsDe: BATIMENT },
        { boite: { x: B.x0 - 2.3, z: 26, l: 4.8, p: 14.5 }, materiaux: [], bas: 3.6, haut: 5.3 },
        { boite: { x: ATELIER.x, z: A.z0, l: ATELIER.l, p: 0.6 }, materiaux: [], bas: SOCLE, haut: FAITE_A, horsDe: ATELIER },
        { boite: { x: A.x0, z: ATELIER.z, l: 0.6, p: ATELIER.p }, materiaux: [], bas: SOCLE, haut: FAITE_A, horsDe: ATELIER },
      ],
    ],
    [hautSilos, toits.filter((t) => t.materiaux.length === 0 && t.haut! > 10)],
  ];
  const noms = ["toit-avant", "toit-hangar", "toit-froide", "toit-atelier", "murs-du-fond", "silos"];
  for (const [i, [chantier, liste]] of effacables.entries()) {
    // Pas d'ombre portée par les toits eux-mêmes : les volumes simples (creerOmbres) la portent pour eux.
    const { objet, materiaux } = chantier.construireFondu(false);
    sansOmbrePortee(objet);
    objet.name = noms[i]!;
    for (const t of liste) {
      t.materiaux = materiaux;
      if (!toits.includes(t)) toits.push(t);
    }
    groupe.add(objet);
  }


  const lisiere = creerLisiere(aleat, ombres);
  lisiere.name = "lisiere";
  groupe.add(lisiere, creerOmbresCuites(ombres));
  groupe.userData.toits = toits;
  groupe.userData.portes = vues;
  return groupe;
}
