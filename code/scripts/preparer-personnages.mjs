// Prépare les personnages pour le jeu (Book 21 §5.2.1, §5.7) à partir des packs CC0 de Quaternius
// (Universal Base Characters, Universal Animation Library 1 et 2), déposés dans ../download/ par le porteur du projet.
//
//   node scripts/preparer-personnages.mjs      (depuis code/)
//
// Ce que fait la chaîne :
// - corps (femme, homme) : maillage simplifié (≈ 12 500 → ≈ 7 500 triangles), textures réduites en JPEG 1024²,
//   cartes de relief et de rugosité retirées (style lisse, Book 18) ;
// - cheveux : simplifiés, texture 512² ;
// - animations : seulement celles du jeu ; seules les rotations sont gardées (plus la position du bassin),
//   pour que les proportions retouchées dans le jeu (tête plus grosse) ne soient pas écrasées ;
// - compression meshopt et quantification : le client les lit avec le décodeur meshopt de three.js.
// Les fichiers bruts restent dans .claude-travail/ (jamais dans le client).

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, quantize, resample, simplify, weld } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

const code = join(dirname(fileURLToPath(import.meta.url)), "..");
const racine = join(code, "..");
const travail = join(racine, ".claude-travail", "personnages");
const sortie = join(code, "client", "public", "assets", "personnages");

// ---------- 1. Dézipper les packs (dans .claude-travail/) ----------

const PACKS = {
  corps: "Universal Base Characters[Standard].zip",
  anim1: "Universal Animation Library[Standard].zip",
  anim2: "Universal Animation Library 2[Standard].zip",
};
mkdirSync(travail, { recursive: true });
for (const [nom, zip] of Object.entries(PACKS)) {
  const dossier = join(travail, nom);
  if (existsSync(dossier)) continue;
  const source = join(racine, "download", zip);
  if (!existsSync(source)) throw new Error(`Pack manquant : download/${zip}`);
  mkdirSync(dossier, { recursive: true });
  execFileSync("unzip", ["-q", "-o", source, "-d", dossier]);
}
const trouver = (dossier, nom) => {
  for (const f of readdirSync(dossier, { recursive: true })) if (basename(String(f)) === nom) return join(dossier, String(f));
  throw new Error(`Introuvable : ${nom}`);
};
const dossierCorps = dirname(trouver(join(travail, "corps"), "Superhero_Female_FullBody.gltf"));
// Les cheveux « Origin at 0 » : posés à leur place sur la tête, sans squelette (on les accroche à l'os de la tête).
const dossierGltfCheveux = dirname(
  join(travail, "corps", String(readdirSync(join(travail, "corps"), { recursive: true }).find((f) => String(f).includes("Origin at 0") && String(f).endsWith("Hair_Buns.gltf")))),
);

/** Une texture réduite et convertie en JPEG par `sips` (outil de macOS), gardée dans .claude-travail/. */
function texture(png, taille) {
  const jpg = join(travail, "textures", `${basename(png, ".png")}_${taille}.jpg`);
  mkdirSync(dirname(jpg), { recursive: true });
  if (!existsSync(jpg)) execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", "-Z", String(taille), png, "--out", jpg], { stdio: "ignore" });
  return readFileSync(jpg);
}

/**
 * Certains glTF du pack pointent vers des images absentes (cartes de relief en double, « _png.png »).
 * Ces cartes sont retirées de toute façon : on pose une petite image bouche-trou à leur place (dans .claude-travail/).
 */
function boucherImages(gltf) {
  const json = JSON.parse(readFileSync(gltf, "utf8"));
  const dossier = dirname(gltf);
  const bouche = readdirSync(dossier).find((f) => f.endsWith(".png"));
  for (const im of json.images ?? []) {
    if (!im.uri) continue;
    const chemin = join(dossier, decodeURIComponent(im.uri));
    if (!existsSync(chemin) && bouche) copyFileSync(join(dossier, bouche), chemin);
  }
  return gltf;
}

// ---------- 2. Outils gltf-transform ----------

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });

/** Ne garde que la couleur de base, réduite ; retire relief et rugosité (style lisse). */
function alleger(doc, dossierTextures, taille) {
  for (const m of doc.getRoot().listMaterials()) {
    m.setNormalTexture(null);
    m.setMetallicRoughnessTexture(null);
    m.setMetallicFactor(0);
    m.setRoughnessFactor(0.85);
    const t = m.getBaseColorTexture();
    if (!t) continue;
    const nom = t.getURI() ? basename(t.getURI()) : `${t.getName()}.png`;
    const png = join(dossierTextures, nom);
    if (!existsSync(png)) continue;
    t.setImage(texture(png, taille)).setMimeType("image/jpeg").setURI(nom.replace(/\.png$/, ".jpg"));
  }
}

async function ecrire(doc, nom) {
  await doc.transform(prune(), dedup(), quantize({ quantizeNormal: 10, quantizeTexcoord: 12, quantizePosition: 14 }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  const chemin = join(sortie, nom);
  await io.write(chemin, doc);
  return `${nom} : ${(statSync(chemin).size / 1024).toFixed(0)} Ko`;
}

const triangles = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);

rmSync(sortie, { recursive: true, force: true });
mkdirSync(sortie, { recursive: true });
const rapport = [];

// ---------- 3. Les corps ----------

for (const [genre, fichier] of [
  ["femme", "Superhero_Female_FullBody.gltf"],
  ["homme", "Superhero_Male_FullBody.gltf"],
]) {
  const doc = await io.read(boucherImages(join(dossierCorps, fichier)));
  alleger(doc, dossierCorps, 1024);
  const avant = triangles(doc);
  await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.6, error: 0.002, lockBorder: true }));
  rapport.push(`${await ecrire(doc, `corps_${genre}.glb`)} (${Math.round(avant)} → ${Math.round(triangles(doc))} triangles)`);
}

// ---------- 4. Les cheveux (rigides, accrochés à l'os de la tête dans le jeu) ----------

for (const nom of ["Hair_Buns", "Hair_Long", "Hair_SimpleParted", "Hair_Buzzed", "Hair_BuzzedFemale", "Hair_Beard"]) {
  const doc = await io.read(boucherImages(join(dossierGltfCheveux, `${nom}.gltf`)));
  alleger(doc, dossierGltfCheveux, 512);
  await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.6, error: 0.003 }));
  rapport.push(`${await ecrire(doc, `cheveux_${nom.replace("Hair_", "").toLowerCase()}.glb`)} (${Math.round(triangles(doc))} triangles)`);
}

// ---------- 5. Les animations ----------

/** Les animations du jeu, par bibliothèque (noms d'origine). */
const ANIMATIONS = {
  anim1: [
    "Idle_Loop", "Walk_Loop", "Jog_Fwd_Loop", "Sprint_Loop", "Crouch_Fwd_Loop", "Crouch_Idle_Loop", "Idle_Torch_Loop",
    "Interact", "PickUp_Table", "Fixing_Kneeling", "Punch_Jab", "Punch_Cross", "Sword_Attack", "Roll",
    "Hit_Chest", "Hit_Head", "Death01", "Sitting_Idle_Loop", "Idle_Talking_Loop", "Driving_Loop",
  ],
  anim2: [
    "Zombie_Idle_Loop", "Zombie_Walk_Fwd_Loop", "Zombie_Scratch", "Chest_Open", "Consume", "Farm_Harvest",
    "TreeChopping_Loop", "Walk_Carry_Loop", "LayToIdle", "Hit_Knockback", "Sword_Regular_A", "Melee_Hook",
    "Idle_Lantern_Loop", "Idle_FoldArms_Loop",
  ],
};
for (const [pack, garder] of Object.entries(ANIMATIONS)) {
  const fichier = trouver(join(travail, pack), pack === "anim1" ? "UAL1_Standard.glb" : "UAL2_Standard.glb");
  const doc = await io.read(fichier);
  const root = doc.getRoot();
  for (const a of root.listAnimations()) {
    if (!garder.includes(a.getName())) {
      a.dispose();
      continue;
    }
    for (const c of a.listChannels()) {
      const chemin = c.getTargetPath();
      const os = c.getTargetNode()?.getName();
      // Rotations seulement, plus la position du bassin (le poids qui bascule pendant la marche).
      if (chemin === "scale" || (chemin === "translation" && os !== "pelvis")) {
        c.getSampler()?.dispose();
        c.dispose();
      }
    }
  }
  // Le mannequin ne sert à rien : on ne garde que le squelette (les noms des os suffisent au jeu).
  for (const n of root.listNodes()) if (n.getMesh()) n.getMesh().dispose(), n.setMesh(null).setSkin(null);
  for (const s of root.listSkins()) s.dispose();
  await doc.transform(resample({ tolerance: 1e-4 }));
  const manquantes = garder.filter((g) => !root.listAnimations().some((a) => a.getName() === g));
  rapport.push(`${await ecrire(doc, `animations_${pack === "anim1" ? 1 : 2}.glb`)} (${root.listAnimations().length} animations${manquantes.length ? ", manquantes : " + manquantes.join(", ") : ""})`);
}

let total = 0;
for (const f of readdirSync(sortie)) total += statSync(join(sortie, f)).size;
console.log(rapport.join("\n"));
console.log(`Total : ${(total / 1024 / 1024).toFixed(2)} Mo dans client/public/assets/personnages/`);
