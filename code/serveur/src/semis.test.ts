// Le semis au hasard dans un lieu vivant (plan 0.9, chantiers G et I) : un point pris revient ailleurs (et le dit), un
// buisson reste où il pousse, le nombre en jeu suit toujours `vracEnJeu` (la première tournée d'abord), et la place
// nouvelle est gardée en base. Le gué, avec des quantités d'essai dans la table (remise ensuite).

import { test } from "node:test";
import assert from "node:assert/strict";
import { dansLaRiviere, surLeBanc } from "../../commun/src/gue.ts";
import { ZONE_GUE, dansBoite } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { SEMIS, vracDuSemis } from "../../commun/src/semis.ts";
import { semerLieu } from "../../commun/src/semis-lieux.ts";
import { vracEnJeu } from "../../commun/src/terrain.ts";
import { Base } from "./base.ts";
import { definitionGue } from "./gue.ts";
import { LieuVivant, type Voyageur } from "./lieu-vivant.ts";

const MIN = 60_000;

/** Le gué avec des quantités d'essai : des branches, des pierres et des cèpes sur la pelouse, des buissons. */
function avecQuantites<T>(f: () => T): T {
  const avant = structuredClone(SEMIS.gue);
  const L = SEMIS.gue.lignes;
  L.branches_pelouse!.n = 6;
  L.pierres_pelouse!.n = 5;
  L.cepes!.n = 4;
  L.buissons!.n = 3;
  try {
    return f();
  } finally {
    SEMIS.gue = avant;
  }
}

function voyageur(id: number) {
  const recus: MessageServeur[] = [];
  const v: Voyageur & { recus: MessageServeur[] } = {
    recus,
    envoyer: (m) => recus.push(m),
    stimuli: () => [],
    humain: () => ({ id, x: 100, z: 35, discret: true, eclaire: false, intouchable: false }),
  };
  return v;
}

/** Un lieu du gué, avec son butin (le vrac des pierres compris, selon la table du moment). */
function gue(base = new Base(":memory:")) {
  const definition = { ...definitionGue(), butin: { ...definitionGue().butin!, vrac: vracDuSemis("gue") } };
  let n = 0;
  return { base, lieu: new LieuVivant(base, definition, () => ((n = (n * 9301 + 49297) % 233280) / 233280)) };
}

const libre = (x: number, z: number) => !ZONE_GUE.obstacles.some((b) => dansBoite(x, z, b)) && (!dansLaRiviere(x, z) || surLeBanc(x, z));

test("un point pris revient ailleurs, dans son étendue ; le retour dit sa place ; la base la garde", () =>
  avecQuantites(() => {
    const { base, lieu } = gue();
    const a = voyageur(1);
    lieu.entrer(a);
    const { semes } = semerLieu("gue");
    const t0 = 1_000_000;
    const ids = [...semes].filter(([, s]) => s.ligne === "branches_pelouse" || s.ligne === "cepes").map(([id]) => id);
    assert.ok(ids.length >= 8);
    for (const id of ids) {
      const r = lieu.ressources.get(id)!;
      const avant = { x: r.x, z: r.z };
      lieu.prendrePar(r, 1, t0);
      assert.ok(Math.hypot(r.x - avant.x, r.z - avant.z) > 0.01, `${r.type} ${id} : ailleurs`);
      assert.ok(libre(r.x, r.z), `${r.type} ${id} : (${r.x} ; ${r.z}) libre`);
    }
    // Il reparaît à son délai, avec sa place nouvelle.
    lieu.tick(t0 + 50 * MIN, 0.1);
    for (const id of ids) {
      const r = lieu.ressources.get(id)!;
      const m = a.recus.find((x) => x.t === "ressource" && x.id === id && x.disponible);
      assert.ok(m && m.t === "ressource" && m.x === r.x && m.z === r.z, `${r.type} ${id} : le retour porte sa place`);
    }
    // Relu de la base (un redémarrage du serveur) : la place nouvelle est gardée.
    const relu = gue(base).lieu;
    for (const id of ids) assert.deepEqual([relu.ressources.get(id)!.x, relu.ressources.get(id)!.z], [lieu.ressources.get(id)!.x, lieu.ressources.get(id)!.z]);
  }));

test("un buisson cueilli reste où il pousse ; le tas de bois flotté aussi", () =>
  avecQuantites(() => {
    const { lieu } = gue();
    const { semes } = semerLieu("gue");
    for (const [id, s] of semes) {
      if (s.ligne !== "buissons" && s.ligne !== "branches_tas") continue;
      const r = lieu.ressources.get(id)!;
      const avant = { x: r.x, z: r.z };
      lieu.prendrePar(r, 1, 1_000_000);
      assert.deepEqual({ x: r.x, z: r.z }, avant);
    }
  }));

test("le nombre en jeu suit toujours vracEnJeu, la première tournée d'abord, même après des prises", () =>
  avecQuantites(() => {
    const { lieu } = gue();
    const { semes } = semerLieu("gue");
    const base = vracDuSemis("gue").pierre!;
    assert.equal(base, 21 + 5);
    const pierres = [...lieu.ressources.values()].filter((r) => r.type === "pierre");
    const presents = [voyageur(1), voyageur(2), voyageur(3), voyageur(4), voyageur(5)];
    for (let k = 1; k <= presents.length; k++) {
      lieu.entrer(presents[k - 1]!);
      assert.equal(pierres.filter((r) => lieu.enJeu(r)).length, vracEnJeu(base, k), `${k} voyageurs`);
    }
    for (const v of presents.slice(1)) lieu.sortir(v);
    // Seul : la première tournée, les pierres de la pelouse comprises.
    const enJeu = pierres.filter((r) => lieu.enJeu(r));
    assert.ok(enJeu.every((r) => semes.get(r.id)!.tour === 0));
    assert.equal(enJeu.filter((r) => semes.get(r.id)!.ligne === "pierres_pelouse").length, 5);
    // Des prises (et des points partis ailleurs) ne changent rien au compte.
    for (const r of enJeu.slice(0, 10)) lieu.prendrePar(r, 1, 1_000_000);
    assert.equal(pierres.filter((r) => lieu.enJeu(r)).length, vracEnJeu(base, 1));
  }));
