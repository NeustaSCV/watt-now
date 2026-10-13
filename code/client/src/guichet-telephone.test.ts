// Le guichet du Comptoir sur téléphone (plan 0.8.2, chantier H ; recette 0.8 : une seule ligne d'étal visible).
// Sans moteur de mise en page dans les tests : on vérifie la règle du style, puis la place qu'elle laisse aux lignes.
// (Mesuré dans Chrome à 375 × 630 : 7 lignes entières, 432 px de guichet.)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
const bloc = css.slice(css.indexOf("/* Le guichet du Comptoir sur téléphone"));

test("sur téléphone, le guichet est un volet jusqu'en bas ; seule la liste défile", () => {
  assert.match(bloc, /#hud \.panneau\.comptoir \{\s*bottom: max\(8px, env\(safe-area-inset-bottom\)\) !important;\s*max-height: none !important;/);
  assert.match(bloc, /#hud \.panneau\.comptoir \.contenu \{[^}]*overflow-y: auto;/);
  // Les commandes tactiles et le joystick se cachent tant qu'il est ouvert (comme pour le sac et le coffre).
  assert.match(bloc, /body:has\(#hud \.panneau\.comptoir:not\(\[hidden\]\)\) #hud \.tactile/);
  assert.match(bloc, /body:has\(#hud \.panneau\.comptoir:not\(\[hidden\]\)\) #joystick/);
});

test("à 375 × 630, il reste la place d'au moins quatre lignes d'étal", () => {
  // Le haut des panneaux sur téléphone (sous les tuiles), le bas du volet.
  const haut = Number(/max-height: calc\(100dvh - max\((\d+)px/.exec(css.slice(css.indexOf("@media (max-width: 560px) {\n  #hud .raccourcis")))![1]);
  const bas = 8;
  // L'en-tête resserré (bandeau, bons, onglets) : au plus 110 px ; une ligne d'étal : au plus 44 px (bouton de 32 px).
  const enTete = 110;
  const ligne = 44;
  assert.match(bloc, /\.contenu button \{[^}]*min-height: 32px;/);
  assert.ok(Math.floor((630 - haut - bas - enTete) / ligne) >= 4, `${630 - haut - bas - enTete} px pour les lignes`);
});
