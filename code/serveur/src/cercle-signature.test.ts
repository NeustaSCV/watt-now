// La règle du cercle (bug du 2026-10-09, « les zombies ne se réveillent pas quand mon cercle de signature les
// touche ») : si le cercle de signature affiché touche un Éteint, il réagit. Les dormants n'entendaient qu'à moitié de
// la portée : le cercle les touchait sans effet. Vérifié avec un vrai joueur, au terrain, à la halte et à la
// Coopérative, pour un joueur ordinaire et pour god (invincible, mais sa signature compte comme celle d'un autre).

import { test } from "node:test";
import assert from "node:assert/strict";
import { SEUIL_REVEIL, nouvelEteint, penser, vue, type Eteint } from "../../commun/src/eteints.ts";
import { ZONE_STATION } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { cerclesSignature, stimuliJoueur, type EtatSignature } from "../../commun/src/signature.ts";
import { preparerGod } from "./admin.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import type { LieuVivant } from "./lieu-vivant.ts";

rendreSilencieux(true);

type Lieu = "terrain" | "station" | "cooperative";

/**
 * Un joueur (ordinaire ou god) posé dans un lieu, qui marche sur place à côté d'un dormant placé à `facteur` fois le
 * rayon de son cercle de signature. Renvoie le dormant après `secondes`.
 */
function scene(lieu: Lieu, god: boolean, facteur: number, secondes = 30) {
  const base = new Base(":memory:");
  let instant = 10_000_000;
  const compte = god ? preparerGod(base, "olympe42", undefined, 1000).compte : base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(compte.id, { sac_a_dos: 1 });
  const halte = new Halte(base, () => 0.5);
  const cooperatives = new Cooperatives(base, () => 0.5, () => instant);
  // Un endroit dégagé de chaque lieu, où l'on peut marcher vers l'ouest.
  const depart = { terrain: { x: 30, z: 52 }, station: { x: 150, z: 40 }, cooperative: { x: 20, z: 52 } }[lieu];
  base.sauverPosition(compte.id, { ...depart, o: 0 }, lieu, instant);
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5, new Comptoir(base, instant), cooperatives);
  const prive = joueur as unknown as { eteints: Eteint[]; invincible: boolean };
  assert.equal(prive.invincible, god, "god est invincible, Rose non");
  const vivant: LieuVivant | null = lieu === "station" ? halte : lieu === "cooperative" ? cooperatives.de(compte.id) : null;
  // On marche : le rayon du cercle, tel que le client le dessine (même calcul, pluie comprise).
  const ici = () => joueur.position;
  joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "marche", seq: 1 });
  const avancer = (dt: number) => {
    instant += dt * 1000;
    // Il marche sur place : on le ramène à son point de départ à chaque pas (il fait le bruit de la marche).
    joueur.position = { ...depart, o: 0 };
    joueur.tick(dt);
    vivant?.tick(instant, dt);
  };
  avancer(0.1);
  const son = joueur.stimuli(false).find((s) => s.genre === "son")!;
  const rayon = cerclesSignature({ x: 0, z: 0, allure: "marche", bouge: true, action: "aucun", lumiere: null, nuit: false }).son;
  assert.ok(Math.abs(son.portee - rayon) < 2.2, `le bruit des pas porte ${son.portee} m, le cercle en montre ${rayon}`);
  // Le dormant, à l'est (on s'éloigne de lui en marchant : il reste à facteur × rayon, ou un peu plus).
  const dormant = nouvelEteint(99, ici().x + son.portee * facteur, ici().z, "dormant");
  if (vivant) vivant.eteints = [dormant];
  else prive.eteints = [dormant];
  let eveilVu = false;
  for (let t = 0; t < secondes && dormant.etat === "dormant"; t += 0.1) {
    avancer(0.1);
    if (vue(dormant).eveil) eveilVu = true;
  }
  return { dormant, eveilVu };
}

for (const lieu of ["terrain", "station", "cooperative"] as const) {
  for (const god of [false, true]) {
    const qui = god ? "god" : "un joueur";
    test(`cercle de signature, ${lieu}, ${qui} : le cercle touche le dormant, il remue puis se réveille`, () => {
      const { dormant, eveilVu } = scene(lieu, god, 0.85);
      assert.notEqual(dormant.etat, "dormant", `toujours endormi (attention ${dormant.attention.toFixed(2)})`);
      assert.ok(eveilVu, "on l'a vu remuer avant qu'il se réveille");
    });
    test(`cercle de signature, ${lieu}, ${qui} : le cercle ne le touche pas, il dort`, () => {
      const { dormant, eveilVu } = scene(lieu, god, 1.15);
      assert.equal(dormant.etat, "dormant");
      assert.equal(dormant.attention, 0);
      assert.ok(!eveilVu);
    });
  }
}

const marche: EtatSignature = { x: 100, z: 30, allure: "marche", bouge: true, action: "aucun", lumiere: null, nuit: false };

/** Fait vivre un Éteint seul, à ciel ouvert, `secondes` durant, sous la signature `e`. */
function vivre(eteint: Eteint, e: EtatSignature, secondes: number, nuit = e.nuit) {
  for (let t = 0; t < secondes; t += 0.1) penser(eteint, 0.1, stimuliJoueur(e), [], [eteint], nuit, ZONE_STATION, () => 0.5);
}

test("cercle de signature : au bord même du cercle, le dormant se réveille (un peu plus lentement)", () => {
  const r = cerclesSignature(marche).son;
  const loin = nouvelEteint(1, 100 + r * 0.97, 30, "dormant");
  vivre(loin, marche, 4);
  assert.equal(loin.etat, "dormant", "pas tout de suite");
  assert.ok(loin.attention > 0 && loin.attention < SEUIL_REVEIL);
  vivre(loin, marche, 8);
  assert.notEqual(loin.etat, "dormant");
});

test("cercle de signature : un errant que le cercle touche, même au bord, est attiré vers la source", () => {
  const r = cerclesSignature(marche).son;
  const errant = nouvelEteint(1, 100 + r * 0.95, 30, "errant");
  // Sans flâner ailleurs : on regarde s'il se tourne vers le bruit.
  errant.flane = 100;
  errant.but = { x: errant.x, z: errant.z };
  vivre(errant, marche, 1);
  assert.deepEqual(errant.but, { x: 100, z: 30 }, "il se tourne vers la source");
  vivre(errant, marche, 10);
  assert.ok(errant.etat === "attire" || errant.etat === "poursuivant", errant.etat);
  // Hors du cercle : rien.
  const dehors = nouvelEteint(2, 100 + r * 1.1, 30, "errant");
  dehors.flane = 100;
  dehors.but = { x: dehors.x, z: dehors.z };
  vivre(dehors, marche, 10);
  assert.equal(dehors.attention, 0);
});

test("cercle de signature : la nuit, le cercle ambre de la lampe réveille aussi le dormant qu'il touche", () => {
  const nuit: EtatSignature = { ...marche, bouge: false, lumiere: "torche", nuit: true };
  const c = cerclesSignature(nuit);
  const dormant = nouvelEteint(1, 100 + c.lumiere * 0.8, 30, "dormant");
  vivre(dormant, nuit, 20);
  assert.notEqual(dormant.etat, "dormant");
  const dehors = nouvelEteint(2, 100 + c.lumiere * 1.1, 30, "dormant");
  vivre(dehors, nuit, 20);
  assert.equal(dehors.etat, "dormant");
});
