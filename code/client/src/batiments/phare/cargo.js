// Le cargo en marche (P-9, scène de l'échouage) : le « Prime Abondance », petit porte-conteneurs de la Livraison du Jour,
// entier, tel qu'il arrive du large, avant de se casser sur les rochers de la crique. C'est le même navire que l'épave
// (modele.js, epave_apres) : même coque (largeur, fonds, quille, tonture du pont), mêmes teintes, même nom sur la joue de
// la proue, même guindeau, même portique de la cloche, même conteneur d'outillage vert sur le pont avant.
//
// Repère : celui du lot du phare (celui de epave_apres). Le groupe est posé à la place de l'échouage (EPAVE) et tourné à
// son cap ; à l'intérieur, le repère de la coque de l'épave : origine au milieu de la future cassure, +z local vers la
// proue, +x local vers la grève (bâbord), y = hauteur du lieu (la mer est à −9). À cette pose, l'avant (s ≥ 0) tombe
// exactement sur l'épave. Le jeu le fait venir du large en déplaçant le groupe (userData.route).
//
// Budget : ≤ 8 000 triangles et ≤ 10 appels de dessin (il s'ajoute au décor du phare sans l'épave).

import * as THREE from "three";
import { Chantier } from "../commun/atelier.js";

/** La place de l'échouage (repère du lot) et le cap de la coque : ceux de l'épave (modele.js). */
export const EPAVE = { x: -3.4, z: 23.75, ry: Math.atan2(-0.26, -0.966) };
const W = 3.2; // demi-largeur
const L_AV = 8.6; // de la cassure à l'étrave
const S_POUPE = -23.5; // le tableau arrière
const S_EFFILE = -17.5; // l'arrière s'effile à partir d'ici
const MER_Y = -9;
const FLOTTAISON = -8.2; // la ligne de peinture : rouge dessous, bleu nuit dessus (comme l'épave)

// ---------- Les formes de la coque (l'avant reprend exactement celles de l'épave) ----------

function largeur(s) {
  if (s >= 2.6) {
    const t = Math.min(1, (s - 2.6) / (L_AV - 2.6));
    return Math.max(0.06, W * (1 - t ** 1.7));
  }
  if (s >= S_EFFILE) return W;
  const t = (S_EFFILE - s) / (S_EFFILE - S_POUPE);
  return W * (1 - 0.16 * t * t);
}
function largeurFonds(s) {
  if (s >= 1.5) {
    const t = Math.min(1, (s - 1.5) / (L_AV - 1.0 - 1.5));
    return Math.max(0.05, W * 0.97 * (1 - t ** 1.5));
  }
  if (s >= S_EFFILE + 2) return W * 0.97;
  const t = Math.min(1, (S_EFFILE + 2 - s) / 8);
  return W * 0.97 * (1 - 0.78 * t ** 1.4);
}
function quille(s) {
  if (s >= 3.5) return -9.8 + 4.0 * Math.min(1, (s - 3.5) / (L_AV - 3.5)) ** 1.6;
  if (s >= S_EFFILE) return -9.8;
  return -9.8 + 1.5 * ((S_EFFILE - s) / 6) ** 1.6;
}
/** La hauteur du pont à la station s (ponCoque de l'épave pour s ≥ 0). */
export function pont(s) {
  return s >= 0 ? -4.2 + 0.5 * (s / L_AV) ** 2 : -4.2 + 0.35 * (s / 22) ** 2;
}
/** Le profil d'une demi-section : quille, bouchain, flottaison, livet du pont, haut du pavois. */
function profil(s, cote) {
  const w = largeur(s) * cote;
  const wf = largeurFonds(s) * cote;
  const yk = quille(s);
  const yd = pont(s);
  const yb = Math.min(yk + 0.9, yd - 0.5);
  const yf = Math.max(FLOTTAISON, yb);
  const wFl = wf + ((w - wf) * (yf - yb)) / Math.max(0.01, yd - yb);
  return [[0, yk, s], [wf * 0.72, yk, s], [wf, yb, s], [wFl, yf, s], [w, yd, s], [w, yd + 1.0, s]];
}
const STATIONS = [S_POUPE, -22.9, -21.9, -20.6, -19.2, S_EFFILE, -15.5, -11, -6, -2, 0.8, 2.6, 3.4, 4.2, 5.0, 5.8, 6.5, 7.1, 7.6, 8.0, 8.3, L_AV];

// ---------- Les matières (les siennes, en cache : un léger « clair de lune » pour que la coque se lise de nuit) ----------

const AL = 1024;
const R = {
  flanc: [0, 0, 512, 256], // la tôle ondulée d'un conteneur (teintée par les sommets)
  logo: [512, 0, 512, 128], // « ABONDANCE EXPRESS », blanc sur transparent
  logoBleu: [512, 128, 512, 128], // le même, bleu nuit, pour les conteneurs clairs
  portes: [0, 256, 256, 256], // les portes d'un conteneur (teintées)
  nom: [256, 256, 512, 128], // le nom sur la joue de la proue, comme sur l'épave
  poupe: [256, 384, 512, 128], // le nom au tableau arrière
  cheminee: [768, 256, 256, 128], // la flèche de l'Abondance sur la cheminée
  pavillon: [768, 384, 256, 128], // le pavillon de la Compagnie
  livraison: [0, 512, 1024, 128], // « LIVRAISON DU JOUR », blanc sur transparent
  gardeCorps: [0, 640, 512, 64], // un garde-corps à trois lisses, transparent entre les barres
  rouille: [512, 640, 256, 128], // des coulures de rouille
  fenetres: [0, 704, 512, 64], // une rangée de hublots, allumés ou non (matière « vitres »)
  passerelle: [0, 768, 512, 64], // les vitres de la passerelle, la lueur des écrans
};

let MATS = null;
function matieres() {
  if (MATS) return MATS;
  const atlas = new THREE.CanvasTexture(dessinerAtlas());
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.anisotropy = 4;
  const base = { vertexColors: true, flatShading: true };
  const vitres = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: 0.3, side: THREE.DoubleSide });
  vitres.userData.sansOmbre = true;
  MATS = {
    tole: new THREE.MeshStandardMaterial({ ...base, roughness: 0.68, metalness: 0.25, emissive: 0x121b2e }),
    peint: new THREE.MeshStandardMaterial({ ...base, roughness: 0.55, metalness: 0.05, emissive: 0x131c30 }),
    panneaux: new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.72, metalness: 0.1, alphaTest: 0.4, side: THREE.DoubleSide, emissive: 0x0a101c }),
    vitres,
    feux: matiereFeux(),
    faisceau: matiereFaisceau(0xcfdcff, 0.34, LONG_FAISCEAU),
    sillage: matiereSillage(),
  };
  return MATS;
}

/** Les halos des feux : des lutins fondus en un seul maillage (un appel), qui font face à la caméra dans le nuanceur. */
function matiereFeux() {
  return new THREE.ShaderMaterial({
    uniforms: { uForce: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec2 coin; attribute float taille; attribute vec3 teinte;
      varying vec2 vCoin; varying vec3 vTeinte;
      void main() {
        vCoin = coin; vTeinte = teinte;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        mv.xy += coin * taille * 0.5;
        mv.z += taille * 0.5; // un peu vers la caméra : la tôle qui porte le feu ne le coupe pas
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uForce; varying vec2 vCoin; varying vec3 vTeinte;
      void main() {
        float d2 = dot(vCoin, vCoin);
        if (d2 > 1.0) discard;
        float a = (exp(-d2 * 5.0) * 0.5 + exp(-d2 * 60.0) * 1.3) * (1.0 - d2);
        gl_FragColor = vec4(vTeinte * a * uForce, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** Le faisceau du projecteur : un cône additif, plus fort au cœur et près de la source (celui de la maquette). */
function matiereFaisceau(couleur, force, longueur) {
  return new THREE.ShaderMaterial({
    uniforms: { uCoul: { value: new THREE.Color(couleur) }, uForce: { value: force }, uLong: { value: longueur } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying float vLe; varying vec3 vN; varying vec3 vMonde;
      uniform float uLong;
      void main() {
        vLe = clamp(position.z / uLong, 0.0, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 m = modelMatrix * vec4(position, 1.0);
        vMonde = m.xyz;
        gl_Position = projectionMatrix * viewMatrix * m;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCoul; uniform float uForce;
      varying float vLe; varying vec3 vN; varying vec3 vMonde;
      void main() {
        vec3 V = normalize(cameraPosition - vMonde);
        float coeur = pow(abs(dot(normalize(vN), V)), 2.2);
        float a = pow(1.0 - vLe, 1.8) * coeur * uForce * (0.25 + 0.75 * smoothstep(0.0, 0.04, vLe));
        gl_FragColor = vec4(uCoul * a, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** L'écume du sillage : une texture qui se répète, qui défile (userData.animer). L'alpha passe par les sommets. */
function matiereSillage() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d");
  let a = 4242;
  const h = () => ((a = (a * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 420; i++) {
    const x = h() * 128;
    const y = h() * 256;
    const r = 2 + h() * 9;
    for (const [dx, dy] of [[0, 0], [128, 0], [-128, 0], [0, 256], [0, -256]]) {
      const d = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      d.addColorStop(0, `rgba(255,255,255,${0.35 + h() * 0.5})`);
      d.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = d;
      g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: t, color: 0xc4d0d8, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  m.userData.sansOmbre = true;
  return m;
}

// ---------- L'atlas : flancs et portes de conteneur, inscriptions, garde-corps, fenêtres ----------

function dessinerAtlas() {
  const c = document.createElement("canvas");
  c.width = c.height = AL;
  const g = c.getContext("2d");
  g.clearRect(0, 0, AL, AL);
  const texte = (t, x, y, police, coul, align = "center") => {
    g.font = police;
    g.fillStyle = coul;
    g.textAlign = align;
    g.textBaseline = "alphabetic";
    g.fillText(t, x, y);
  };
  const salir = (x, y, l, h, n, couleur) => {
    for (let i = 0; i < n; i++) {
      const px = x + ((i * 97) % l);
      const py = y + ((i * 61) % h);
      const r = 8 + ((i * 13) % 30);
      const d = g.createRadialGradient(px, py, 0, px, py, r);
      d.addColorStop(0, couleur);
      d.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = d;
      g.fillRect(px - r, py - r, r * 2, r * 2);
    }
  };
  // Le flanc ondulé (gris clair, teinté par les sommets), ses montants d'angle, ses longerons, sa rouille légère
  {
    const [x, y, l, h] = R.flanc;
    g.fillStyle = "#e2e2de";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < l; i += 16) {
      const d = g.createLinearGradient(x + i, 0, x + i + 16, 0);
      d.addColorStop(0, "rgba(255,255,255,0.35)");
      d.addColorStop(0.5, "rgba(0,0,0,0)");
      d.addColorStop(1, "rgba(0,0,0,0.26)");
      g.fillStyle = d;
      g.fillRect(x + i, y, 16, h);
    }
    g.fillStyle = "rgba(0,0,0,0.32)";
    g.fillRect(x, y, l, 10);
    g.fillRect(x, y + h - 10, l, 10);
    g.fillRect(x, y, 10, h);
    g.fillRect(x + l - 10, y, 10, h);
    texte("ABXU 220814 3   22G1", x + 26, y + 36, "bold 16px monospace", "rgba(255,255,255,0.7)", "left");
    for (let i = 0; i < 18; i++) {
      const px = x + 14 + ((i * 83) % (l - 28));
      const lg = 14 + ((i * 37) % 60);
      g.fillStyle = `rgba(${110 + (i % 3) * 20},60,30,${0.12 + (i % 4) * 0.05})`;
      g.fillRect(px, y + (i % 2 ? 10 : h - 10 - lg), 3 + (i % 3), lg);
    }
    salir(x, y, l, h, 10, "rgba(240,240,232,0.22)");
  }
  // Le logo des conteneurs (comme ceux de l'épave) : le nom et la promesse de l'Abondance
  for (const [r, coul, coul2] of [[R.logo, "rgba(255,255,255,0.95)", "rgba(255,255,255,0.88)"], [R.logoBleu, "#1d2c46", "#1d2c46"]]) {
    const [x, y, l, h] = r;
    g.save();
    g.strokeStyle = coul;
    g.lineWidth = 9;
    g.beginPath();
    g.arc(x + 64, y + 58, 30, Math.PI * 0.15, Math.PI * 1.75);
    g.stroke();
    g.fillStyle = coul;
    g.beginPath();
    g.moveTo(x + 92, y + 24);
    g.lineTo(x + 108, y + 50);
    g.lineTo(x + 78, y + 48);
    g.fill();
    g.restore();
    texte("ABONDANCE", x + 120, y + 62, "bold 60px sans-serif", coul, "left");
    texte("EXPRESS", x + 122, y + 100, "bold 32px sans-serif", coul, "left");
    texte("Livré avant d'être commandé", x + 290, y + 98, "italic 19px sans-serif", coul2, "left");
  }
  // Les portes d'un conteneur : barres de fermeture, crémones, plaque CSC
  {
    const [x, y, l, h] = R.portes;
    g.fillStyle = "#d4d4cf";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < h; i += 22) {
      g.fillStyle = "rgba(0,0,0,0.12)";
      g.fillRect(x, y + i + 14, l, 8);
    }
    g.fillStyle = "rgba(0,0,0,0.45)";
    g.fillRect(x + l / 2 - 2, y, 4, h);
    g.fillStyle = "rgba(0,0,0,0.32)";
    g.fillRect(x, y, 10, h);
    g.fillRect(x + l - 10, y, 10, h);
    g.fillRect(x, y, l, 10);
    g.fillRect(x, y + h - 10, l, 10);
    g.fillStyle = "#5a5a56";
    for (const px of [44, 92, 160, 208]) {
      g.fillRect(x + px, y + 12, 7, h - 24);
      g.fillRect(x + px - 6, y + 120, 19, 12);
    }
    g.fillStyle = "#e6e2d8";
    g.fillRect(x + 104, y + 30, 48, 30);
    texte("CSC", x + 128, y + 52, "bold 16px sans-serif", "#2a2420");
  }
  // Le nom du cargo, en lettres blanches sur la coque bleu nuit : le même panneau que sur l'épave
  {
    const [x, y, l, h] = R.nom;
    g.fillStyle = "#26384a";
    g.fillRect(x, y, l, h);
    texte("PRIME ABONDANCE", x + l / 2, y + 74, "bold 62px serif", "#ece8de");
    texte("LIVRAISON DU JOUR · FLOTS", x + l / 2, y + 112, "bold 20px sans-serif", "#c9c3b6");
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(150,75,40,${0.18 + (i % 3) * 0.08})`;
      g.fillRect(x + ((i * 89) % l), y + 82 + (i % 3) * 10, 3, 36);
    }
  }
  // Le tableau arrière : le nom et le port d'attache
  {
    const [x, y, l, h] = R.poupe;
    g.fillStyle = "#26384a";
    g.fillRect(x, y, l, h);
    texte("PRIME ABONDANCE", x + l / 2, y + 66, "bold 58px serif", "#ece8de");
    texte("LES FLOTS", x + l / 2, y + 108, "bold 30px serif", "#d8d2c4");
  }
  // La cheminée : bleu canard, bande rouge, la flèche crème de l'Abondance
  {
    const [x, y, l, h] = R.cheminee;
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 12;
    g.beginPath();
    g.arc(x + l / 2, y + h / 2 + 6, 34, Math.PI * 0.15, Math.PI * 1.75);
    g.stroke();
    g.fillStyle = "#e9dfc6";
    g.beginPath();
    g.moveTo(x + l / 2 + 30, y + h / 2 - 36);
    g.lineTo(x + l / 2 + 50, y + h / 2 - 4);
    g.lineTo(x + l / 2 + 12, y + h / 2 - 6);
    g.fill();
  }
  // Le pavillon de la Compagnie : la flèche sur fond rouge, un peu délavé
  {
    const [x, y, l, h] = R.pavillon;
    g.fillStyle = "#b8473a";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y + h - 22, l, 10);
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 9;
    g.beginPath();
    g.arc(x + 90, y + 54, 26, Math.PI * 0.15, Math.PI * 1.75);
    g.stroke();
    texte("PRIME", x + 172, y + 66, "bold 34px sans-serif", "#e9dfc6");
  }
  // « LIVRAISON DU JOUR », sur les flancs
  {
    const [x, y, l, h] = R.livraison;
    texte("LIVRAISON DU JOUR", x + l / 2, y + 100, "bold 104px sans-serif", "#f1ede4");
  }
  // Le garde-corps : deux montants, trois lisses (le reste est transparent)
  {
    const [x, y, l, h] = R.gardeCorps;
    g.fillStyle = "#e7e3d8";
    for (const py of [2, 26, 50]) g.fillRect(x, y + py, l, 7);
    for (const px of [6, l / 4, l / 2, (3 * l) / 4, l - 14]) g.fillRect(x + px, y, 8, h);
  }
  // Les coulures de rouille
  {
    const [x, y, l, h] = R.rouille;
    for (let i = 0; i < 9; i++) {
      const px = x + 10 + i * 27;
      const lg = 50 + ((i * 41) % 70);
      g.fillStyle = i % 2 ? "#7a4228" : "#8a5233";
      g.fillRect(px, y + 4, 5 + (i % 3) * 3, lg);
      g.fillRect(px + 1, y + 4 + lg, 3, 6);
    }
  }
  // Les hublots : allumés (jaune chaud) ou éteints (bleu nuit), toujours les mêmes
  {
    const [x, y] = R.fenetres;
    const allumes = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];
    for (let i = 0; i < 12; i++) {
      const cx = x + 20 + i * 41;
      const on = allumes[i];
      const d = g.createRadialGradient(cx + 10, y + 30, 1, cx + 10, y + 30, 26);
      d.addColorStop(0, on ? "rgba(255,214,140,1)" : "rgba(60,80,110,0.9)");
      d.addColorStop(0.45, on ? "rgba(255,170,80,0.9)" : "rgba(30,40,60,0.9)");
      d.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = d;
      g.fillRect(cx - 14, y + 4, 48, 52);
      g.fillStyle = on ? "rgba(255,236,190,1)" : "rgba(40,55,80,1)";
      g.fillRect(cx, y + 18, 20, 24);
    }
  }
  // La passerelle : de grandes vitres, la lueur verte et bleue des écrans
  {
    const [x, y] = R.passerelle;
    for (let i = 0; i < 8; i++) {
      const cx = x + 8 + i * 63;
      g.fillStyle = "rgba(30,60,70,1)";
      g.fillRect(cx, y + 10, 56, 44);
      const d = g.createLinearGradient(0, y + 10, 0, y + 54);
      d.addColorStop(0, "rgba(40,90,90,1)");
      d.addColorStop(1, i % 3 === 1 ? "rgba(140,255,200,1)" : "rgba(80,190,170,1)");
      g.fillStyle = d;
      g.fillRect(cx + 2, y + 30, 52, 22);
    }
  }
  return c;
}

// ---------- Outils ----------

/** Un panneau de l'atlas, face vers +z local. */
function panneau(ch, mat, r, pose, l, h, couleur = 0xffffff) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AL);
  ch.poser(g, mat, couleur, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Des triangles bruts (tableau plat de positions), dans le repère courant du chantier. */
function triangles(ch, mat, couleur, pos) {
  if (!pos.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  ch.poser(g, mat, couleur, {}, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Ajoute le triangle (a, b, c) à `pos`, retourné s'il le faut pour que sa face regarde vers `dehors`. */
function tri(pos, a, b, c, dehors) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  if (n[0] * dehors[0] + n[1] * dehors[1] + n[2] * dehors[2] < 0) pos.push(...a, ...c, ...b);
  else pos.push(...a, ...b, ...c);
}

/** Un ruban le long de la coque, entre deux courbes P1(s) et P2(s), tourné vers `dehors`. */
function ruban(pos, stations, P1, P2, dehors) {
  for (let n = 0; n < stations.length - 1; n++) {
    const a = P1(stations[n]);
    const b = P2(stations[n]);
    const c = P1(stations[n + 1]);
    const d = P2(stations[n + 1]);
    tri(pos, a, c, b, dehors);
    tri(pos, b, c, d, dehors);
  }
}

// ---------- La coque ----------

function coque(ch, M) {
  const rouge = [];
  const bleu = [];
  const pavois = [];
  for (const cote of [-1, 1]) {
    for (let n = 0; n < STATIONS.length - 1; n++) {
      const A = profil(STATIONS[n], cote);
      const B = profil(STATIONS[n + 1], cote);
      const sm = (STATIONS[n] + STATIONS[n + 1]) / 2;
      const ym = (quille(sm) + pont(sm)) / 2;
      for (let i = 0; i < 5; i++) {
        const q = [A[i], A[i + 1], B[i], B[i + 1]];
        const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
        const cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
        const dehors = [cx, cy - ym, 0];
        const cible = i < 3 ? rouge : i < 4 ? bleu : pavois;
        tri(cible, q[0], q[2], q[1], dehors);
        tri(cible, q[1], q[2], q[3], dehors);
        // Le pavois se voit aussi de l'intérieur (la caméra est haute)
        if (i === 4) {
          const dedans = [-dehors[0], 0, 0];
          tri(cible, q[0], q[2], q[1], dedans);
          tri(cible, q[1], q[2], q[3], dedans);
        }
      }
    }
  }
  // Le tableau arrière : un éventail sur le profil, tourné vers l'arrière
  {
    const s = S_POUPE;
    const c = [0, (quille(s) + pont(s)) / 2, s];
    for (const cote of [-1, 1]) {
      const P = profil(s, cote);
      for (let i = 0; i < P.length - 1; i++) tri(i < 4 ? bleu : pavois, c, P[i], P[i + 1], [0, 0, -1]);
    }
  }
  triangles(ch, M.tole, 0x7a3328, rouge); // les œuvres vives, rouge antifouling
  triangles(ch, M.tole, 0x34506a, bleu); // les œuvres mortes, bleu marine (comme l'épave)
  triangles(ch, M.tole, 0x30495f, pavois);
  // Le pont, rouge brique passé (comme l'épave)
  {
    const pos = [];
    const P = (s, cote) => [largeur(s) * cote * 0.98, pont(s), s];
    ruban(pos, STATIONS, (s) => P(s, -1), (s) => P(s, 1), [0, 1, 0]);
    triangles(ch, M.tole, 0x8a5646, pos);
  }
  // La lisse blanche du pavois, le liston, la ligne de flottaison (des rubans, pas des poutres : peu de triangles)
  {
    const blanc = [];
    const ligne = [];
    for (const cote of [-1, 1]) {
      const x = (s, e) => (largeur(s) + e) * cote;
      ruban(blanc, STATIONS, (s) => [x(s, -0.1), pont(s) + 1.04, s], (s) => [x(s, 0.05), pont(s) + 1.04, s], [0, 1, 0]);
      ruban(blanc, STATIONS, (s) => [x(s, 0.05), pont(s) + 1.04, s], (s) => [x(s, 0.05), pont(s) + 0.93, s], [cote, 0, 0]);
      ruban(blanc, STATIONS, (s) => [x(s, 0.03), pont(s) - 0.08, s], (s) => [x(s, 0.03), pont(s) - 0.2, s], [cote, 0, 0]);
      const fl = (s, dy) => {
        const p = profil(s, cote)[3];
        return [p[0] * 1.01 + cote * 0.02, p[1] + dy, s];
      };
      ruban(ligne, STATIONS, (s) => fl(s, 0.16), (s) => fl(s, 0.02), [cote, 0, 0]);
    }
    triangles(ch, M.peint, 0xd8d4c8, blanc);
    triangles(ch, M.peint, 0xb2402f, ligne);
  }
}

// ---------- Un conteneur fermé (long axe suivant x de la pose) ----------

const CL = 6.06;
const CW = 2.44;
const CH = 2.59;
function conteneur(ch, M, couleur, long, pose, logo = 0) {
  ch.repere(pose, () => {
    ch.boite(long, CH, CW, couleur, {}, M.tole, { crasse: false, nuance: 0.05 });
    for (const sz of [-1, 1]) {
      const ry = sz > 0 ? 0 : Math.PI;
      panneau(ch, M.panneaux, R.flanc, { z: sz * (CW / 2 + 0.006), ry }, long - 0.04, CH - 0.04, couleur);
      if (logo) panneau(ch, M.panneaux, logo > 0 ? R.logo : R.logoBleu, { z: sz * (CW / 2 + 0.012), ry, y: 0.2 }, Math.min(long - 0.6, 4.4), 1.1);
    }
    for (const sx of [-1, 1]) panneau(ch, M.panneaux, R.portes, { x: sx * (long / 2 + 0.006), ry: sx * Math.PI / 2 }, CW - 0.04, CH - 0.04, couleur);
  });
}

// ---------- Le cargo ----------

const LONG_FAISCEAU = 55;
// Le château : quatre niveaux blancs (trois ponts et la passerelle), la cheminée, le mât radar
const C0 = -20.2; // milieu du château
const YB = pont(C0);
const YP = YB + 7.2; // le plancher de la passerelle
const ZP = C0 + 0.5; // le milieu de la passerelle
const PL = 3.4; // sa profondeur
const ZF = C0 - 1.3; // la cheminée
const BLANC = 0xe4e0d6;

/**
 * Le cargo « Prime Abondance » en marche. Renvoie un THREE.Group nommé cargo_en_marche, dans le repère du lot du phare,
 * posé à la place de l'échouage (là où sera epave_apres), tourné à son cap. Objets nommés : feux_cargo, projecteur_cargo,
 * sillage_cargo. userData : route, lumieres (2), objets, houle.
 */
export function creerCargo({ usure = 0.7 } = {}) {
  usure = Math.min(1, Math.max(0.1, usure));
  const M = matieres();
  const racine = new THREE.Group();
  racine.name = "cargo_en_marche";
  racine.userData.nom = "cargo_en_marche";
  racine.position.set(EPAVE.x, 0, EPAVE.z);
  racine.rotation.y = EPAVE.ry;
  // L'assiette : ce qui roule et tangue doucement sur la houle (tout sauf le sillage, qui reste à fleur d'eau)
  const assiette = new THREE.Group();
  assiette.name = "assiette du cargo";
  racine.add(assiette);

  const ch = new Chantier(1907);
  coque(ch, M);

  // --- L'avant, comme l'épave : le guindeau et ses chaînes, le portique de la cloche, le mât de misaine, les ancres
  {
    const sG = 5.4;
    const yG = pont(sG);
    ch.boite(1.5, 0.5, 0.7, 0x3d4a3e, { y: yG + 0.25, z: sG }, M.tole);
    for (const cote of [-1, 1]) {
      ch.tube([cote * 0.48, yG + 0.55, sG], [cote * 0.76, yG + 0.55, sG], 0.32, 0x2c2b29, M.tole, 8);
      for (let i = 0; i < 4; i++) ch.boite(0.1, 0.06, 0.26, 0x4a3a30, { x: cote * 0.62 * (1 - i * 0.06), y: yG + 0.05, z: sG + 0.42 + i * 0.26, ry: (i % 2) * 1.57 }, M.tole, { crasse: false });
    }
    const sC = 6.7;
    const yC = pont(sC);
    for (const cote of [-1, 1]) ch.poutre([cote * 0.55, yC, sC], [cote * 0.45, yC + 1.75, sC], 0.08, 0xc9c3b6, M.peint);
    ch.poutre([-0.6, yC + 1.72, sC], [0.6, yC + 1.72, sC], 0.08, 0xc9c3b6, M.peint);
    ch.tube([0, yC + 1.0, sC], [0, yC + 1.42, sC], 0.2, 0xa98238, M.peint, 8); // la cloche
    ch.tube([0, yC, sC + 0.3], [0, yC + 4.2, sC + 0.25], 0.07, 0xc9c3b6, M.peint, 6); // le mât de misaine
    ch.boite(0.9, 0.06, 0.06, 0xc9c3b6, { y: yC + 3.6, z: sC + 0.25 }, M.peint, { crasse: false });
    ch.boite(0.2, 0.2, 0.2, 0xd8d4c8, { y: yC + 4.25, z: sC + 0.25 }, M.peint, { crasse: false }); // la lanterne de tête de mât
    for (const cote of [-1, 1]) {
      const sa = 7.0;
      const xa = cote * (largeur(sa) + 0.1);
      const ya = pont(sa) - 1.1;
      ch.boite(0.14, 1.2, 0.14, 0x2c2b29, { x: xa, y: ya - 0.45, z: sa }, M.tole, { crasse: false });
      for (const d of [-1, 1]) ch.boite(0.12, 0.5, 0.14, 0x2c2b29, { x: xa, y: ya - 1.0, z: sa + d * 0.25, rx: d * 0.9 }, M.tole, { crasse: false });
    }
    // Les bittes d'amarrage de la plage avant
    for (const cote of [-1, 1]) for (const dz of [0, 0.45]) ch.tube([cote * 1.3, pont(4.2), 4.0 + dz], [cote * 1.3, pont(4.2) + 0.45, 4.0 + dz], 0.13, 0x2c2b29, M.tole, 6);
    // La bouée couronne au pavois (comme l'épave)
    ch.boite(0.12, 0.6, 0.6, 0xd0562e, { x: -largeur(3.4) + 0.12, y: pont(3.4) + 0.5, z: 3.4 }, M.peint, { crasse: false });
  }
  // Le nom sur les deux joues de la proue (le même panneau, à la même place que sur l'épave)
  for (const cote of [-1, 1]) {
    const sa = 4.5;
    const sb = 6.7;
    const wa = cote * (largeur(sa) + 0.14);
    const wb = cote * (largeur(sb) + 0.14);
    const ry = cote < 0 ? Math.atan2(-(sb - sa), wb - wa) : Math.atan2(sb - sa, -(wb - wa));
    panneau(ch, M.panneaux, R.nom, { x: (wa + wb) / 2, y: pont(6) - 0.3, z: (sa + sb) / 2, ry }, Math.hypot(sb - sa, wb - wa) * 0.98, 0.55);
  }
  // Le conteneur d'outillage de 10 pieds sur le pont avant (celui de l'épave : vert, s = 2,2, côté large)
  conteneur(ch, M, 0x3f6a5a, 2.99, { x: -1.5, y: pont(2.2) + 0.02 + CH / 2, z: 2.2, ry: Math.PI / 2 }, 0);

  // --- Les panneaux de cale et les conteneurs en pontée (Abondance Express)
  const baies = [
    { s: -14.6, piles: [[0x9a4a32, 0x2f5a7a, 0xc27a2e], [0x3f6a5a, 0xd8cfb8, 0x9a4a32]] },
    { s: -8.5, piles: [[0x2f6f73, 0x8a8d88, 0xc8362b], [0x5a4a6a, 0x2f5a7a]] },
    // La baie de la cassure : dessous, les deux qui glisseront dans la cale ; dessus, ceux de la grève
    { s: -2.4, piles: [[0x8a3a2a, 0x9a4a32, 0x8a5a3a], [0x2f5a7a, 0x2f5a7a]] },
  ];
  let k = 0;
  for (const b of baies) {
    const y0 = pont(b.s);
    ch.boite(5.9, 0.4, 6.15, 0x4a5a4c, { y: y0 + 0.2, z: b.s }, M.tole);
    for (const cote of [-1, 1]) ch.boite(0.2, 0.55, 6.25, 0x3e4c40, { x: cote * 2.95, y: y0 + 0.2, z: b.s }, M.tole, { crasse: false });
    b.piles.forEach((pile, r) => {
      const lx = r === 0 ? 1.27 : -1.27;
      pile.forEach((couleur, e) => {
        const clair = couleur === 0xd8cfb8 || couleur === 0x8a8d88;
        const logo = (k + e) % 2 === 0 || e === pile.length - 1 ? (clair ? -1 : 1) : 0;
        conteneur(ch, M, couleur, CL, { x: lx, y: y0 + 0.42 + CH / 2 + e * (CH + 0.02), z: b.s, ry: Math.PI / 2 }, logo);
      });
      k++;
    });
    // Les saisines : deux barres croisées sur la face des piles, côté château
    for (const cote of [-1, 1]) ch.poutre([cote * 2.4, y0 + 0.45, b.s - 3.06], [cote * 0.2, y0 + 0.45 + CH * 1.6, b.s - 3.06], 0.04, 0x8d8a82, M.tole, { crasse: false });
  }

  // « LIVRAISON DU JOUR » sur les deux flancs, entre la flottaison et le pont
  for (const cote of [-1, 1]) panneau(ch, M.panneaux, R.livraison, { x: cote * (W + 0.035), y: -6.15, z: -8.6, ry: cote * Math.PI / 2 }, 13, 1.6);
  // La rouille qui coule des dalots, dosée par l'usure
  {
    const n = Math.round(4 + 10 * usure);
    for (let i = 0; i < n; i++) {
      const cote = i % 2 ? 1 : -1;
      const s = -17 + ((i * 7.3) % 24);
      panneau(ch, M.panneaux, R.rouille, { x: cote * (largeur(s) + 0.04), y: pont(s) - 1.0 - (i % 3) * 0.3, z: s, ry: cote * Math.PI / 2 }, 0.9, 1.5);
    }
  }

  // --- Le château
  const etages = [[YB, 2.4, 5.4, 4.4], [YB + 2.4, 2.4, 5.0, 4.2], [YB + 4.8, 2.4, 4.6, 4.0]];
  for (const [y0, h, l, p] of etages) {
    ch.boite(l, h, p, BLANC, { y: y0 + h / 2, z: C0 }, M.peint, { nuance: 0.02, crasse: false });
    ch.boite(l + 0.16, 0.1, p + 0.16, 0xb9b4a8, { y: y0 + h, z: C0 }, M.peint, { crasse: false });
    panneau(ch, M.vitres, R.fenetres, { y: y0 + h * 0.55, z: C0 + p / 2 + 0.02 }, l * 0.9, 0.62);
    panneau(ch, M.vitres, R.fenetres, { y: y0 + h * 0.55, z: C0 - p / 2 - 0.02, ry: Math.PI }, l * 0.9, 0.62);
    for (const cote of [-1, 1]) panneau(ch, M.vitres, R.fenetres, { x: cote * (l / 2 + 0.02), y: y0 + h * 0.55, z: C0, ry: cote * Math.PI / 2 }, p * 0.9, 0.62);
  }
  // Les garde-corps des coursives (sur le rebord de chaque niveau, devant et sur les côtés)
  for (const [y0, h, l, p] of etages.slice(0, 2)) {
    const y = y0 + h + 0.55;
    panneau(ch, M.panneaux, R.gardeCorps, { y, z: C0 + p / 2 + 0.06 }, l + 0.1, 0.9);
    for (const cote of [-1, 1]) panneau(ch, M.panneaux, R.gardeCorps, { x: cote * (l / 2 + 0.06), y, z: C0, ry: cote * Math.PI / 2 }, p + 0.1, 0.9);
  }
  // L'échelle extérieure, du pont principal à la première coursive (côté large)
  ch.poutre([-2.4, YB, C0 + 2.9], [-2.4, YB + 2.4, C0 + 2.25], 0.08, 0xc9c3b6, M.peint, { crasse: false });
  ch.poutre([-1.8, YB, C0 + 2.9], [-1.8, YB + 2.4, C0 + 2.25], 0.08, 0xc9c3b6, M.peint, { crasse: false });
  // La passerelle et ses ailerons, plus larges que la coque
  ch.boite(4.2, 2.3, PL, BLANC, { y: YP + 1.15, z: ZP }, M.peint, { crasse: false, nuance: 0.02 });
  ch.boite(2 * W + 1.0, 0.2, 1.5, BLANC, { y: YP + 0.1, z: ZP + 0.9 }, M.peint, { crasse: false });
  for (const cote of [-1, 1]) {
    ch.boite(0.1, 1.05, 1.5, BLANC, { x: cote * (W + 0.45), y: YP + 0.72, z: ZP + 0.9 }, M.peint, { crasse: false });
    ch.boite(W + 0.5 - 2.1, 1.05, 0.1, BLANC, { x: cote * ((W + 0.5 + 2.1) / 2), y: YP + 0.72, z: ZP + 1.62 }, M.peint, { crasse: false });
    // les boîtes des feux de côté, au bout des ailerons
    ch.boite(0.22, 0.3, 0.3, cote > 0 ? 0x8a2a20 : 0x206a3a, { x: cote * (W + 0.45), y: YP + 1.4, z: ZP + 1.3 }, M.peint, { crasse: false });
  }
  panneau(ch, M.vitres, R.passerelle, { y: YP + 1.45, z: ZP + PL / 2 + 0.02 }, 4.0, 0.85);
  for (const cote of [-1, 1]) panneau(ch, M.vitres, R.passerelle, { x: cote * 2.12, y: YP + 1.45, z: ZP, ry: cote * Math.PI / 2 }, 3.0, 0.8);
  ch.boite(4.6, 0.18, 3.8, 0xc9c4b8, { y: YP + 2.39, z: ZP }, M.peint, { crasse: false });
  ch.boite(4.4, 0.05, 0.55, 0xc9c4b8, { y: YP + 2.05, z: ZP + PL / 2 + 0.25, rx: 0.25 }, M.peint, { crasse: false }); // la visière
  panneau(ch, M.panneaux, R.gardeCorps, { y: YP + 2.9, z: ZP + 1.85 }, 4.4, 0.8);
  // Le mât radar, ses vergues, l'antenne
  const zMat = ZP - 0.3;
  ch.tube([0, YP + 2.45, zMat], [0, YP + 6.3, zMat], 0.09, 0xd8d4c8, M.peint, 6);
  ch.boite(2.4, 0.08, 0.08, 0xd8d4c8, { y: YP + 5.1, z: zMat }, M.peint, { crasse: false });
  ch.boite(1.9, 0.12, 0.28, 0x2a2a2a, { y: YP + 3.5, z: zMat, ry: 0.6 }, M.tole, { crasse: false });
  ch.tube([0, YP + 3.3, zMat], [0, YP + 3.5, zMat], 0.15, 0x2a2a2a, M.tole, 6);
  ch.tube([0.9, YP + 2.45, zMat - 0.8], [0.9, YP + 4.6, zMat - 0.8], 0.03, 0xd8d4c8, M.peint, 4);
  // Le corps du projecteur, à l'avant du toit
  ch.tube([0, YP + 2.5, ZP + 1.45], [0, YP + 2.72, ZP + 1.62], 0.26, 0x3a3a3a, M.tole, 8);
  // La cheminée : bleu canard, bande rouge, coiffe noire, la flèche de l'Abondance
  {
    const yF = YB + 7.2;
    ch.boite(1.6, 3.4, 1.3, 0x2f6f73, { y: yF + 1.7, z: ZF }, M.peint, { crasse: false });
    ch.boite(1.66, 0.35, 1.36, 0xc8362b, { y: yF + 2.75, z: ZF }, M.peint, { crasse: false });
    ch.boite(1.7, 0.2, 1.4, 0x1c1c1c, { y: yF + 3.45, z: ZF }, M.tole, { crasse: false });
    for (const cote of [-1, 1]) panneau(ch, M.panneaux, R.cheminee, { x: cote * 0.81, y: yF + 1.6, z: ZF, ry: cote * Math.PI / 2 }, 1.2, 0.6);
  }
  // Les embarcations de sauvetage, orange, sur leurs bossoirs
  for (const cote of [-1, 1]) {
    const x = cote * 2.95;
    ch.boite(0.9, 0.6, 3.2, 0xd8622a, { x, y: YB + 3.15, z: C0 - 0.2 }, M.peint, { crasse: false });
    ch.boite(0.7, 0.35, 2.6, 0xe08040, { x, y: YB + 3.6, z: C0 - 0.2 }, M.peint, { crasse: false });
    ch.boite(0.92, 0.1, 3.22, 0xe9e5db, { x, y: YB + 2.9, z: C0 - 0.2 }, M.peint, { crasse: false });
    for (const dz of [-1.3, 0.9]) ch.poutre([cote * 2.45, YB + 2.4, C0 + dz], [x, YB + 4.0, C0 + dz], 0.09, 0xd8d4c8, M.peint, { crasse: false });
  }
  // La plage arrière : les bittes, le mât du pavillon et son pavillon
  for (const cote of [-1, 1]) for (const dz of [0, 0.45]) ch.tube([cote * 1.6, pont(-23), -23.1 + dz], [cote * 1.6, pont(-23) + 0.45, -23.1 + dz], 0.13, 0x2c2b29, M.tole, 6);
  ch.tube([0, pont(S_POUPE) + 1, S_POUPE + 0.35], [0, pont(S_POUPE) + 3.4, S_POUPE + 0.35], 0.04, 0xd8d4c8, M.peint, 5);
  panneau(ch, M.panneaux, R.pavillon, { x: 0, y: pont(S_POUPE) + 3.0, z: S_POUPE - 0.2, ry: Math.PI / 2 + 0.25 }, 1.1, 0.55);
  // Le nom au tableau arrière
  panneau(ch, M.panneaux, R.poupe, { y: pont(S_POUPE) - 1.25, z: S_POUPE - 0.03, ry: Math.PI }, 4.4, 1.0);

  const corps = ch.construire();
  corps.name = "coque et château du cargo";
  assiette.add(corps);

  // --- Les feux : de côté (rouge à bâbord, vert à tribord), de tête de mât, de poupe ; les lueurs du château
  const feux = creerFeux(
    [
      [W + 0.62, YP + 1.4, ZP + 1.3, 0xff2a1a, 2.4], // bâbord, rouge
      [-(W + 0.62), YP + 1.4, ZP + 1.3, 0x28ff70, 2.4], // tribord, vert
      [0, YP + 6.45, zMat, 0xfff4dc, 2.2], // tête du grand mât
      [0, pont(6.7) + 4.35, 6.95, 0xfff4dc, 2.0], // tête du mât de misaine
      [0, pont(S_POUPE) + 1.35, S_POUPE - 0.15, 0xfff4dc, 1.8], // poupe
      [0, YB + 4.2, C0 + 2.8, 0x5a3416, 10], // la lueur chaude des hublots du château
      [1.7, YB + 7.0, C0 + 2.1, 0xffd9a0, 1.3], // les projecteurs de pont, sur la façade du château
      [-1.7, YB + 7.0, C0 + 2.1, 0xffd9a0, 1.3],
    ],
    M.feux,
  );
  feux.name = "feux_cargo";
  feux.userData.nom = "feux_cargo";
  assiette.add(feux);

  // --- Le projecteur : un cône qui éclaire la mer devant l'étrave, et sa source
  const projecteur = new THREE.Group();
  projecteur.name = "projecteur_cargo";
  projecteur.userData.nom = "projecteur_cargo";
  const source = new THREE.Vector3(0, YP + 2.65, ZP + 1.75);
  const cible = new THREE.Vector3(0, MER_Y + 1.5, 30);
  projecteur.position.copy(source);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(5.0, LONG_FAISCEAU, 14, 1, true).translate(0, -LONG_FAISCEAU / 2, 0).rotateX(-Math.PI / 2), M.faisceau);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cible.clone().sub(source).normalize());
  cone.renderOrder = 6;
  cone.name = "faisceau du projecteur";
  const halo = creerFeux([[0, 0, 0.12, 0xeaf2ff, 3.6]], M.feux);
  halo.name = "source du projecteur";
  projecteur.add(cone, halo);
  projecteur.userData.cible = { x: cible.x, y: cible.y, z: cible.z }; // dans le repère de la coque
  assiette.add(projecteur);

  // --- Le sillage : la moustache d'étrave et la traînée derrière la poupe, à fleur d'eau
  const sillage = new THREE.Mesh(geoSillage(), M.sillage);
  sillage.name = "sillage_cargo";
  sillage.userData.nom = "sillage_cargo";
  sillage.position.y = MER_Y + 0.03;
  sillage.renderOrder = 3;
  sillage.castShadow = false;
  sillage.userData.animer = (t) => {
    M.sillage.map.offset.y = -t * 0.35;
  };
  racine.add(sillage);

  // --- La houle (une assiette qui roule et tangue un peu) : le jeu peut la couper (userData.houle = 0)
  racine.userData.houle = 1;
  racine.userData.animer = (t) => {
    const h = racine.userData.houle ?? 1;
    assiette.position.y = 0.12 * h * Math.sin(1.3 * t);
    assiette.rotation.x = -0.012 * h * Math.sin(1.1 * t + 1);
    assiette.rotation.z = 0.018 * h * Math.sin(0.9 * t);
  };

  // --- Ce que le jeu reprend
  const versLot = (lx, y, lz) => {
    const c = Math.cos(EPAVE.ry);
    const s = Math.sin(EPAVE.ry);
    return { x: r2(EPAVE.x + lx * c + lz * s), y: r2(y), z: r2(EPAVE.z - lx * s + lz * c) };
  };
  const dir = { x: Math.sin(EPAVE.ry), z: Math.cos(EPAVE.ry) }; // vers la proue
  const D = 90; // la distance conseillée du départ, au large
  racine.userData.route = {
    depart: { x: r2(EPAVE.x - dir.x * D), z: r2(EPAVE.z - dir.z * D) },
    arrivee: { x: EPAVE.x, z: EPAVE.z },
    cap: EPAVE.ry, // rotation.y du groupe (0 : la proue vers +z) ; le cargo avance tout droit, la proue devant
    direction: { x: r3(dir.x), z: r3(dir.z) },
    choc: { x: r2(EPAVE.x - dir.x * 2.5), z: r2(EPAVE.z - dir.z * 2.5) }, // l'étrave touche les rochers (maquette : U_CHOC = −2,5)
    note: "Le groupe se déplace en x et z du départ à l'arrivée, à rotation constante (cap) ; y reste 0. À l'arrivée, l'avant coïncide avec epave_apres.",
  };
  racine.userData.lumieres = [
    { ...versLot(source.x, source.y, source.z), couleur: 0xe8f0ff, intensite: 30, portee: 60, nature: "projecteur du cargo (projecteur_cargo), braqué sur la mer devant l'étrave", local: { x: source.x, y: r2(source.y), z: source.z }, cible: versLot(cible.x, cible.y, cible.z) },
    { ...versLot(0, YB + 4.2, C0 + 3.2), couleur: 0xffb060, intensite: 8, portee: 18, nature: "les hublots et les feux du château (feux_cargo)", local: { x: 0, y: r2(YB + 4.2), z: r2(C0 + 3.2) } },
  ];
  racine.userData.objets = { feux_cargo: feux, projecteur_cargo: projecteur, sillage_cargo: sillage };
  racine.userData.toits = [];
  racine.userData.obstacles = [];
  return racine;
}

const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

/** Des halos : [x, y, z, couleur, taille] fondus en un seul maillage (un appel de dessin). */
function creerFeux(liste, mat) {
  const n = liste.length;
  const pos = new Float32Array(n * 18);
  const coin = new Float32Array(n * 12);
  const taille = new Float32Array(n * 6);
  const teinte = new Float32Array(n * 18);
  const coins = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
  const c = new THREE.Color();
  let rayon = 0;
  liste.forEach(([x, y, z, couleur, t], i) => {
    c.setHex(couleur);
    rayon = Math.max(rayon, t);
    coins.forEach(([u, v], j) => {
      const k = i * 6 + j;
      pos.set([x, y, z], k * 3);
      coin.set([u, v], k * 2);
      taille[k] = t;
      teinte.set([c.r, c.g, c.b], k * 3);
    });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("coin", new THREE.BufferAttribute(coin, 2));
  g.setAttribute("taille", new THREE.BufferAttribute(taille, 1));
  g.setAttribute("teinte", new THREE.BufferAttribute(teinte, 3));
  g.computeBoundingSphere();
  g.boundingSphere.radius += rayon;
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 5;
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

/** Le sillage : la moustache en V depuis l'étrave, la traînée qui s'élargit derrière la poupe (u en travers, v le long). */
function geoSillage() {
  const pos = [];
  const uv = [];
  const col = [];
  // Un morceau de bande, de a-b (devant, alpha alA) à c-d (derrière, alpha alB), en deux moitiés : l'écume est dense au
  // milieu de la bande et s'efface sur ses deux bords.
  const quad = (a, b, c, d, ua, ub, va, vb, alA, alB) => {
    const mi = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const um = (ua + ub) / 2;
    for (const [p0, p1, q0, q1, u0, u1, k0, k1] of [[a, mi(a, b), c, mi(c, d), ua, um, 0, 1], [mi(a, b), b, mi(c, d), d, um, ub, 1, 0]]) {
      for (const [p, u, v, al] of [[p0, u0, va, alA * k0], [q0, u0, vb, alB * k0], [p1, u1, va, alA * k1], [p1, u1, va, alA * k1], [q0, u0, vb, alB * k0], [q1, u1, vb, alB * k1]]) {
        pos.push(p[0], 0, p[1]);
        uv.push(u, v);
        col.push(1, 1, 1, al);
      }
    }
  };
  // La moustache : deux bandes de chaque bord, de l'étrave vers l'arrière, qui s'écartent et s'effacent
  for (const cote of [-1, 1]) {
    const pts = [[0, 8.9], [cote * 3.0, 4.0], [cote * 5.2, -2.0], [cote * 7.4, -9.0]];
    const larg = [0.5, 1.6, 2.4, 3.2];
    const al = [0.9, 0.85, 0.5, 0];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[i + 1];
      quad([x0 - cote * 0.2, z0], [x0 + cote * larg[i], z0], [x1 - cote * 0.2, z1], [x1 + cote * larg[i + 1], z1], 0, 1, z0 / 6, z1 / 6, al[i], al[i + 1]);
    }
  }
  // La traînée : du tableau arrière jusqu'à 45 m derrière
  const T = [[S_POUPE + 0.5, 5.4, 0.85], [S_POUPE - 8, 7.5, 0.7], [S_POUPE - 22, 10.5, 0.35], [S_POUPE - 45, 15, 0]];
  for (let i = 0; i < T.length - 1; i++) {
    const [z0, w0, a0] = T[i];
    const [z1, w1, a1] = T[i + 1];
    quad([-w0 / 2, z0], [w0 / 2, z0], [-w1 / 2, z1], [w1 / 2, z1], 0, 1.5, z0 / 6, z1 / 6, a0, a1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 4));
  g.computeVertexNormals();
  return g;
}
