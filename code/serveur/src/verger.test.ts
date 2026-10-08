// Le verger et le sous-bois (2026-10-08) : fruitiers cueillis depuis l'escabeau, qu'on porte et qu'on pose ;
// champignons, dont les amanites qui empoisonnent.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { ARBRES_FRUITIERS, RAYON_ESCABEAU, genererRessources } from "../../commun/src/terrain.ts";
import { instantDuJour } from "../../commun/src/calendrier.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  // Le 28 août : les pommes sont mûres.
  let instant = instantDuJour(240, base.debutMonde()) + 1000;
  const halte = new Halte(base);
  const comptoir = new Comptoir(base, instant);
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 1, comptoir);
  // Le kit de départ est donné à la création : on le remplace par celui du test.
  base.sauverInventaire(compte.id, inventaire);
  (joueur as unknown as { inventaire: Record<string, number> }).inventaire = inventaire;
  const attendre = (secondes: number) => {
    for (let s = 0; s < secondes * 10; s++) {
      instant += 100;
      joueur.tick(0.1);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  return { base, compte, joueur, attendre, dernier, infos };
}

test("un terrain neuf a six fruitiers (les cinq espèces) et des champignons, cèpes et amanites", () => {
  const r = genererRessources(42);
  const arbres = r.filter((x) => ARBRES_FRUITIERS.includes(x.type));
  assert.equal(arbres.length, 6);
  assert.equal(new Set(arbres.map((a) => a.type)).size, 5);
  for (const a of arbres) for (const b of arbres) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.z - b.z) > 6, "les arbres sont espacés");
  assert.ok(r.filter((x) => x.type === "cepe").length >= 5);
  assert.ok(r.some((x) => x.type === "amanite_phalloide") && r.some((x) => x.type === "amanite_tue_mouches"));
  assert.equal(new Set(r.map((x) => x.id)).size, r.length, "des identifiants uniques");
});

test("sans escabeau on ne cueille pas ; on le porte (en marchant), on le pose dans le cercle, on cueille", () => {
  const t = monter({ buche: 2, branche: 6, corde: 1, couteau: 1, marteau: 1 });
  const pommier = t.joueur.bienvenue(0).ressources.find((r) => r.type === "pommier")!;
  t.joueur.position = { x: pommier.x + 1.2, z: pommier.z, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: pommier.id }, verbe: "ramasser" });
  assert.match(t.infos().at(-1)!, /escabeau/);

  // Fabriqué un peu plus loin, hors du cercle.
  t.joueur.position = { x: pommier.x + 6, z: pommier.z, o: 0 };
  t.joueur.recevoir({ t: "fabriquer", recette: "escabeau", x: pommier.x + 6, z: pommier.z + 1.5, o: 0 });
  t.attendre(5);
  const escabeau = t.joueur.bienvenue(0).installations.find((i) => i.type === "escabeau")!;
  assert.ok(escabeau, "l'escabeau est posé");

  // Le porter : immédiat ; on ne court plus.
  t.joueur.position = { x: escabeau.x, z: escabeau.z - 1, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: escabeau.id }, verbe: "porter" });
  assert.equal(t.dernier("installation")!.installation.etat.portee, true);
  t.joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "course", seq: 1 });
  const x0 = t.joueur.position.x;
  t.attendre(1);
  const parcouru = x0 - t.joueur.position.x;
  assert.ok(parcouru > 1.5 && parcouru < 3, `on marche (${parcouru.toFixed(2)} m en 1 s)`);
  t.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 });

  // Bras pris : pas de cueillette ni de route.
  t.joueur.position = { x: pommier.x + 1.5, z: pommier.z, o: -Math.PI / 2 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: pommier.id }, verbe: "ramasser" });
  assert.match(t.infos().at(-1)!, /bras pris|escabeau/);

  // Le poser devant soi, dans le cercle : immédiat.
  t.joueur.recevoir({ t: "poser" });
  const pose = t.dernier("installation")!.installation;
  assert.equal(pose.etat.portee, false);
  assert.ok(Math.hypot(pose.x - pommier.x, pose.z - pommier.z) <= RAYON_ESCABEAU);

  t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: pommier.id }, verbe: "ramasser" });
  t.attendre(5);
  assert.equal(t.dernier("inventaire")!.inventaire.pomme, 4);
  assert.equal(t.dernier("ressource")!.disponible, false, "l'arbre est cueilli, il se recharge");
});

test("l'escabeau emporté à la déconnexion reste là où l'on était", () => {
  const t = monter({ buche: 2, branche: 6, corde: 1, couteau: 1, marteau: 1 });
  t.joueur.position = { x: 20, z: 20, o: 0 };
  t.joueur.recevoir({ t: "fabriquer", recette: "escabeau", x: 20, z: 21.5, o: 0 });
  t.attendre(5);
  const e = t.joueur.bienvenue(0).installations.find((i) => i.type === "escabeau")!;
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: e.id }, verbe: "porter" });
  t.joueur.position = { x: 30, z: 18, o: 0 };
  t.joueur.sauvegarder();
  t.joueur.partir();
  const revenu = new Joueur(t.compte, t.base, () => {}, () => Date.now(), new Halte(t.base), () => 1, new Comptoir(t.base, Date.now()));
  const apres = revenu.bienvenue(0).installations.find((i) => i.id === e.id)!;
  assert.equal(apres.etat.portee, false);
  assert.deepEqual([apres.x, apres.z], [30, 18]);
});

test("l'amanite phalloïde ne se sent pas tout de suite ; des minutes plus tard, la santé fond", () => {
  const t = monter({ amanite_phalloide: 1, cepe: 1 });
  // Un peu de faim (rassasié, on ne mange plus).
  const j = t.joueur as unknown as { besoins: { kcal: number } };
  j.besoins = { ...j.besoins, kcal: 1200 };
  t.joueur.recevoir({ t: "manger", objet: "cepe" });
  t.attendre(3);
  t.joueur.recevoir({ t: "manger", objet: "amanite_phalloide" });
  t.attendre(3);
  assert.equal(t.dernier("sante")!.sante.points, 100, "rien sur le moment");
  t.attendre(8 * 60);
  assert.match(t.infos().join(" "), /phalloïde/);
  t.attendre(60);
  const s = t.dernier("sante")!.sante;
  assert.ok(s.points < 80, `la santé baisse (${s.points})`);
  assert.equal(s.intoxique, true);
});

test("hors saison, on ne cueille pas ; on dit quand ce sera mûr", () => {
  const t = monter({});
  const cerisier = t.joueur.bienvenue(0).ressources.find((r) => r.type === "cerisier")!;
  (t.joueur as unknown as { escabeauAuPied: () => boolean }).escabeauAuPied = () => true;
  t.joueur.position = { x: cerisier.x + 1, z: cerisier.z, o: 0 };
  // Le 28 août, les cerises sont finies depuis la mi-juillet.
  t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: cerisier.id }, verbe: "ramasser" });
  assert.match(t.infos().at(-1)!, /Plus de fruits cette année.*5 juin/);
});
