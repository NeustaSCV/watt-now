// La fiche « Examiner » courte dans le HUD (0.10.1, chantier E, variante V3) : les lignes utiles avant la phrase
// d'ambiance, le bandeau « Ne marche pas » en tête de la fiche, la raison en tête du message d'Examiner.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { InstallationVue } from "../../commun/src/messages.ts";
import { proposer } from "./interaction.ts";

const hud = readFileSync(new URL("./hud.ts", import.meta.url), "utf8");
const corps = (nom: string) => {
  const debut = hud.indexOf(`  private ${nom}(`);
  assert.ok(debut > 0, nom);
  return hud.slice(debut, hud.indexOf("\n  }\n", debut));
};

test("le sac : les lignes courtes avant la description", () => {
  const sac = corps("dessinerSac");
  const lignes = sac.indexOf("${htmlExamenCourt(lignesObjet(t, this.famille, this.savoir, this.vueProgression))}");
  assert.ok(lignes > 0);
  assert.ok(lignes < sac.indexOf(`<p class="description">`));
});

test("la fiche d'une installation : le bandeau, juste sous le titre", () => {
  const fiche = corps("ficheInstallation");
  const tete = fiche.indexOf("${enteteFiche(nom)}");
  const bandeau = fiche.indexOf(`\${raison ? htmlNeMarchePas(raison) : ""}`);
  assert.ok(tete > 0 && bandeau > tete && bandeau < fiche.indexOf(`<p class="examen">`));
});

test("le message d'Examiner : la raison en texte, jamais en HTML", () => {
  const m = corps("messageAvecRaison");
  assert.match(m, /tete\.textContent = raison;/);
  assert.ok(!/innerHTML/.test(m));
});

test("la clôture sans courant : la raison à part, en tête ; avec courant, le texte d'avant", () => {
  const GOURDE = { litres: 0, contenu: "vide" } as never;
  const cloture = (arme: boolean) => ({ id: 7, type: "cloture_electrique", x: 20, z: 21, o: 0, etat: { declencheur: { arme, prises: 0 } } }) as unknown as InstallationVue;
  const B = (arme: boolean) => proposer({ x: 20, z: 20, o: 0 }, "terrain", "voltaiques", [], [], [cloture(arme)], {}, GOURDE, {}, 0).B;
  const sans = B(false);
  assert.ok(sans && "examiner" in sans);
  assert.equal(sans.raison, "Le courant ne passe pas : il lui faut un banc chargé à moins de 6 m.");
  assert.match(sans.examiner, /^Six mètres de fil sous tension/);
  const avec = B(true);
  assert.ok(avec && "examiner" in avec);
  assert.equal(avec.raison, undefined);
  assert.match(avec.examiner, /Le courant passe\.$/);
});
