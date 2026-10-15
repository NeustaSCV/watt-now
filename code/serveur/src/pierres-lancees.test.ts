// Les pierres lancées (0.10.1, A2) : de bout en bout, une pierre lancée tombe en tas, le tas est proposé au bouton A
// (la même fonction que l'écran, client/src/interaction.ts), et le ramasser rend la pierre au sac. Sur l'Éteint touché
// (qui reste debout, puis détruit, son corps au même endroit), dans le vide à la portée maximale, contre un mur, sur le
// terrain, dans une halte, au phare (où le tas se dessine à la hauteur du vrai sol).

import { test } from "node:test";
import assert from "node:assert/strict";
import { nouvelEteint, type Eteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, etapeVers, sortiesDe } from "../../commun/src/lieux.ts";
import type { MessageServeur, SacVu } from "../../commun/src/messages.ts";
import { MS_PAR_HEURE_JEU } from "../../commun/src/temps.ts";
import { avecCoteOuverte } from "../../commun/src/acces-cote.ts";
import { ENDROITS_PHARE } from "../../commun/src/phare.ts";
import { solPhare } from "../../client/src/rendu/phare.ts";
import { hauteurSolLieu } from "../../client/src/sol-lieu.ts";
import { proposer } from "../../client/src/interaction.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { Moulins } from "./moulin.ts";
import { rendreSilencieux } from "./journal.ts";

rendreSilencieux(true);

/** Un monde complet en mémoire, un joueur (Rose) et ses trois pierres ; de jour, sans Éteint venu de la lisière. */
function monde() {
  const base = new Base(":memory:");
  let instant = base.debutMonde() + 2 * MS_PAR_HEURE_JEU;
  const maintenant = () => instant;
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const gue = new Gue(base, () => 0.5);
  const cooperatives = new Cooperatives(base, () => 0.5, maintenant);
  const moulins = new Moulins(base, () => 0.5, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, () => 0.5, maintenant);
  const c = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(c.id, { sac_a_dos: 1, pierre: 3 });
  base.sauverQuetes(c.id, avecCoteOuverte(base.chargerQuetes(c.id)));
  const recus: MessageServeur[] = [];
  // Un aléa à 1 : aucun Éteint ne sort de la lisière, et le lancer ne rate pas.
  const joueur = new Joueur({ id: c.id, pseudo: "Rose", famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, () => 0.999, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
      lieux.tick(instant, pas);
    }
  };
  const j = joueur as unknown as { eteints: Eteint[]; sacsVus(): SacVu[]; inventaire: Record<string, number>; vivant: { eteints: Eteint[] } | null };
  const voyager = (vers: "station" | "corniche" | "phare") => {
    const etape = etapeVers(joueur.lieu, vers);
    const s = joueur.lieu === "terrain" ? SORTIE_TERRAIN : sortiesDe(joueur.lieu).find((x) => x.vers === etape || x.aussi?.includes(etape))!;
    joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers });
    attendre(DUREE_VOYAGE_S + 0.5, 0.5);
    joueur.recevoir({ t: "arrivee" });
    if (j.vivant) j.vivant.eteints = [];
  };
  /** Lancer une pierre, debout en (x, z), vers (dx, dz) ; le tas qui en résulte (le seul tas de pierre du lieu). */
  const lancer = (x: number, z: number, dx: number, dz: number, cible?: number, distance = 8) => {
    joueur.position = { x, z, o: 0 };
    attendre(1.5);
    const avant = j.inventaire.pierre ?? 0;
    joueur.recevoir({ t: "lancer", dx, dz, distance, ...(cible !== undefined ? { cible } : {}) });
    const p = recus.findLast((m) => m.t === "projectile") as Extract<MessageServeur, { t: "projectile" }>;
    assert.equal(j.inventaire.pierre ?? 0, avant - 1, "la pierre est partie");
    const tas = j.sacsVus().filter((s) => s.jete && s.contenu?.pierre);
    assert.equal(tas.length, 1, "un tas de pierre au sol");
    return { projectile: p.projectile, tas: tas[0]! };
  };
  /** Debout près du tas : A le propose (comme l'écran), et le ramasser rend la pierre au sac. */
  const ramasser = (tas: SacVu, depuis: { x: number; z: number }) => {
    joueur.position = { ...depuis, o: 0 };
    const vus = j.sacsVus();
    const A = proposer(joueur.position, joueur.lieu as never, "mecanistes", [], [], [], j.inventaire as never, { litres: 0, contenu: "vide" } as never, {}, instant, vus).A;
    assert.equal(A?.libelle, "Ramasser : pierre", `A propose le tas (${A?.libelle})`);
    assert.ok(A && "message" in A && A.message.t === "interagir" && A.message.cible.genre === "sac" && A.message.cible.id === tas.id);
    const avant = j.inventaire.pierre ?? 0;
    joueur.recevoir(A.message);
    attendre(2);
    assert.equal(j.inventaire.pierre ?? 0, avant + 1, "la pierre revient au sac");
    assert.equal(j.sacsVus().filter((s) => s.jete).length, 0, "le tas a disparu");
  };
  return { base, joueur, j, attendre, voyager, lancer, ramasser, recus };
}

test("sur le terrain, dans le vide : la pierre tombe à 8 m, en tas, et se reprend", () => {
  const m = monde();
  assert.equal(m.joueur.lieu, "terrain");
  const { projectile, tas } = m.lancer(40, 30, 0, 1);
  assert.equal(projectile.impact, "sol");
  assert.ok(Math.abs(Math.hypot(tas.x - 40, tas.z - 30) - 8) < 0.2, `à la portée maximale (${tas.x}, ${tas.z})`);
  m.ramasser(tas, { x: tas.x, z: tas.z - 1 });
});

test("sur le terrain, sur un Éteint : la pierre tombe à ses pieds ; debout puis détruit, le tas se reprend", () => {
  const m = monde();
  // Loin de la mare (38, 33), où une pierre est perdue.
  const e = nouvelEteint(9, 20, 25, "poursuivant");
  m.j.eteints = [e];
  const { projectile, tas } = m.lancer(20, 20, 0, 1, 9);
  assert.equal(projectile.impact, "eteint");
  assert.equal(projectile.coup?.id, 9);
  assert.notEqual(e.etat, "detruit", "une pierre ne détruit pas : il reste debout");
  assert.ok(Math.hypot(tas.x - e.x, tas.z - e.z) < 1, "au pied de l'Éteint");
  // Détruit, son corps reste au même endroit : le tas se propose quand même au bouton A.
  e.etat = "detruit";
  m.ramasser(tas, { x: tas.x, z: tas.z - 0.8 });
});

test("dans une halte, contre un mur : la pierre tombe au pied du mur, du côté du lanceur, et se reprend", () => {
  const m = monde();
  m.voyager("station");
  assert.equal(m.joueur.lieu, "station");
  // Dans la boutique de la station, vers son mur est (x 109,7) : la pierre s'arrête au mur.
  const { projectile, tas } = m.lancer(106, 14.5, 1, 0);
  assert.equal(projectile.impact, "mur");
  assert.ok(tas.x < 109.7 && tas.x > 108, `au pied du mur, dedans (${tas.x})`);
  m.ramasser(tas, { x: tas.x - 0.8, z: tas.z });
});

test("au phare : sur le plateau et sur la grève, la pierre tombe en tas et se reprend ; le tas se dessine sur le vrai sol", () => {
  const m = monde();
  m.voyager("corniche");
  m.voyager("phare");
  assert.equal(m.joueur.lieu, "phare");
  const de = { x: ENDROITS_PHARE.hangar.x, z: ENDROITS_PHARE.hangar.z + 2 };
  const plateau = m.lancer(de.x, de.z, 0, 1).tas;
  m.ramasser(plateau, { x: plateau.x, z: plateau.z - 0.8 });
  // Sur la grève, près de la sortie de l'ouest, 8,7 m sous le plateau : avant la 0.10.1, le tas restait dessiné à 0,
  // en l'air au-dessus des galets. Il se pose désormais à la hauteur du sol du modèle (client/src/main.ts, majSacs).
  const greve = sortiesDe("phare").find((s) => s.sansArrivee)!.boite;
  const tas = m.lancer(greve.x + 3, greve.z, -1, 0, undefined, 1.5).tas;
  const sol = hauteurSolLieu("phare", tas.x, tas.z, { epave: false });
  assert.ok(sol < -8, `le sol de la grève (${sol.toFixed(2)} m)`);
  assert.equal(sol, solPhare(tas.x, tas.z, false));
  m.ramasser(tas, { x: tas.x + 0.8, z: tas.z });
});
