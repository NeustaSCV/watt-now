// Plan 0.8, chantier 13 : « S'installer » en portes successives, côté serveur. Chaque porte se valide seule, dès que son
// meuble est monté au bon niveau sur le terrain ; deux sont ouvertes à la fois, une par route ; au départ d'une sortie,
// le carnet les nomme. Les règles (l'ordre, les routes) sont testées dans commun/src/quetes.test.ts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { toutDevoile } from "../../commun/src/progression.ts";
import { QUETES } from "../../commun/src/quetes.ts";
import type { TypeInstallation } from "../../commun/src/recettes.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

/** La tête de « S'installer », déjà faite : les portes sont ouvertes. */
const TETE = ["foyer_pierres", "repas", "eau_du_ciel", "coffre"];
const PORTES = QUETES.filter((q) => q.route).map((q) => q.id);

function monter(avant?: (base: Base, id: number) => void, finies: string[] = TETE, inventaire: Record<string, number> = {}) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverProgression(compte.id, toutDevoile("mecanistes"));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  // Le métier et « Les autres » finis : seul « S'installer » bouge.
  const ailleurs = QUETES.filter((q) => q.ligne !== "installer" && (!q.famille || q.famille === "mecanistes")).map((q) => q.id);
  base.sauverQuetes(compte.id, { faits: {}, finies: [...ailleurs, ...finies], primes: 0 });
  avant?.(base, compte.id);
  let instant = base.debutMonde() + 60_000;
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.99, new Comptoir(base, instant));
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const carnet = () => (recus.findLast((m) => m.t === "quetes") as Extract<MessageServeur, { t: "quetes" }> | undefined)?.quetes;
  const reussies = () => recus.flatMap((m) => (m.t === "quetes" ? (m.quetes?.reussies ?? []).map((r) => r.titre) : []));
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  return { base, compte, joueur, attendre, carnet, reussies, infos };
}

/** Un meuble déjà posé, à son niveau. */
function poser(type: TypeInstallation, niveau: number) {
  return (base: Base, id: number) => {
    const i = base.ajouterInstallation(id, type, 24, 24, 0);
    base.sauverNiveauInstallation(id, i.id, niveau);
  };
}

test("le carnet montre deux portes à la fois, une par route, avec leur route", () => {
  const t = monter();
  t.attendre(1);
  const installer = t.carnet()!.quetes.filter((q) => q.ligne === "installer");
  assert.deepEqual(installer.map((q) => [q.titre, q.route]), [
    ["Une vraie cuisine", "A"],
    ["Un abri fermé", "B"],
  ]);
});

test("chaque porte de « S'installer » se valide seule, son meuble monté au bon niveau", () => {
  const cas: Record<string, (base: Base, id: number) => void> = {
    abri_ferme: poser("abri", 3),
    coffre_cercle: poser("coffre", 2),
    dix_litres: poser("recuperateur_pluie", 2),
    etabli_etau: poser("etabli", 2),
    // Le foyer de cuisine et la marmite se notent quand on les monte (le feu n'est pas une installation).
    foyer_cuisine: (base, id) => base.sauverQuetes(id, { ...base.chargerQuetes(id), faits: { "foyer:foyer_cuisine": 1 } }),
    marmite: (base, id) => base.sauverQuetes(id, { ...base.chargerQuetes(id), faits: { "accessoire:marmite": 1 } }),
  };
  assert.deepEqual(Object.keys(cas).sort(), [...PORTES].sort());
  for (const porte of PORTES) {
    // Toutes les autres portes déjà finies : celle-ci est ouverte, et rien d'autre ne la valide.
    const autres = PORTES.filter((p) => p !== porte);
    const vide = monter(undefined, [...TETE, ...autres]);
    vide.attendre(1);
    const titre = QUETES.find((q) => q.id === porte)!.titre;
    assert.ok(vide.carnet()!.quetes.some((q) => q.titre === titre), `${porte} est ouverte`);
    assert.ok(!vide.reussies().includes(titre), `${porte} ne se valide pas d'elle-même`);
    const t = monter((base, id) => cas[porte]!(base, id), [...TETE, ...autres]);
    t.attendre(1);
    assert.ok(t.reussies().includes(titre), `${porte} se valide seule`);
  }
});

test("monter la marmite norvégienne sur le foyer de cuisine valide « La soupe qui cuit seule »", () => {
  const t = monter(
    (base, id) => base.sauverFeu(id, { id: 1, x: 21, z: 20, bois: 2, allume: false, majLe: base.debutMonde() + 60_000, niveau: 3 }),
    [...TETE, "foyer_cuisine"],
    { branche: 4, chiffons: 4, cocotte_fonte: 1 },
  );
  t.joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "monter_marmite" });
  t.attendre(25);
  assert.ok(t.reussies().includes("La soupe qui cuit seule"));
});

test("au départ d'une sortie, le carnet nomme les portes ouvertes ; pas en arrivant ailleurs", () => {
  const t = monter();
  t.attendre(1);
  t.joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  t.joueur.recevoir({ t: "voyager", vers: "station" });
  assert.ok(t.infos().includes("Une vraie cuisine : il te faut une grille. Un abri fermé : il te faut de la grosse toile."));
  t.attendre(DUREE_VOYAGE_S + 1);
  // Avant les portes (la tête de la ligne), rien à nommer.
  const u = monter(undefined, []);
  u.attendre(1);
  u.joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  u.joueur.recevoir({ t: "voyager", vers: "station" });
  assert.ok(!u.infos().some((i) => i.includes("il te faut")));
});
