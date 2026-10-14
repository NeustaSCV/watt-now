// Le semis au hasard (plan 0.9, chantiers G et I) : jamais dans l'eau, un bâtiment, sur une route ou un obstacle
// (pour chaque lieu, sur 1 000 tirages) ; les lignes nouvelles se posent après le contenu d'avant ; la table à l'état
// « actuel » ne change rien aux lieux (pas de version à changer) ; une quantité changée demande une version nouvelle.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ATELIER, BATIMENT, VERSION_COOP, butinCoop, pieceDe } from "./cooperative.ts";
import { DEMI_ROUTE, VERSION_GUE, dansLaRiviere, genererGue, surLeBanc, zRoute } from "./gue.ts";
import { VERSION_HALTE, genererHalte } from "./halte.ts";
import { BOUTIQUE, ROUTE, dansBoite, zoneDe } from "./lieux.ts";
import { VERSION_MOULIN, butinMoulin, pieceMoulin } from "./moulin.ts";
import { SEMIS, placeLibre, semisDe, vracDuSemis, type LieuSemis } from "./semis.ts";
import { ETENDUES, semerLieu } from "./semis-lieux.ts";
import { VRAC_MAX, aleatoire } from "./terrain.ts";

const LIEUX: readonly LieuSemis[] = ["station", "gue", "moulin", "cooperative"];

/** Ce qu'on vérifie sans passer par les étendues : dans le lieu, hors des obstacles, de l'eau, des routes, des bâtiments. */
function horsDeTout(lieu: LieuSemis, x: number, z: number): string | null {
  const zone = zoneDe(lieu);
  if (x < zone.xMin || x > zone.xMax || z < zone.zMin || z > zone.zMax) return "hors du lieu";
  if (zone.obstacles.some((b) => dansBoite(x, z, b))) return "sur un obstacle";
  switch (lieu) {
    case "station":
      if (Math.abs(z - ROUTE.z) <= ROUTE.demiLargeur) return "sur la route";
      if (dansBoite(x, z, BOUTIQUE.interieur)) return "dans la boutique";
      return null;
    case "gue":
      // Le banc de galets est au milieu de l'eau : on y marche.
      if (dansLaRiviere(x, z) && !surLeBanc(x, z)) return "dans la rivière";
      if (Math.abs(z - zRoute(x)) <= DEMI_ROUTE) return "sur la route";
      return null;
    case "moulin": {
      const piece = pieceMoulin(x, z);
      if (piece !== "dehors" && piece !== "jardin") return `dans ${piece}`;
      // Le bief, la levée et la rivière (repère du modèle : x de 9,5 à 25).
      if (x - 32 > 9.5 && x - 32 < 25) return "dans l'eau ou sur le halage";
      return null;
    }
    case "cooperative":
      if (pieceDe(x, z) !== "dehors" || dansBoite(x, z, BATIMENT) || dansBoite(x, z, ATELIER)) return "dans un bâtiment";
      return null;
  }
}

/** Les étendues dont la table se sert, lieu par lieu. */
const etenduesServies = (lieu: LieuSemis) => [...new Set(Object.values(SEMIS[lieu].lignes).map((l) => l.ou))].filter((ou) => ou !== "tas");

test("chaque étendue : 1 000 tirages, jamais dans l'eau, un bâtiment, sur une route ou un obstacle", () => {
  for (const lieu of LIEUX) {
    for (const ou of etenduesServies(lieu)) {
      const e = ETENDUES[lieu][ou];
      assert.ok(e, `${lieu} : l'étendue « ${ou} » existe`);
      const alea = aleatoire(31 + ou.length);
      let trouves = 0;
      for (let i = 0; i < 1000; i++) {
        const p = placeLibre(e, alea, [], 0, 400);
        if (!p) continue;
        trouves++;
        const faute = horsDeTout(lieu, p.x, p.z);
        assert.equal(faute, null, `${lieu}, ${ou} : (${p.x} ; ${p.z}) ${faute}`);
      }
      assert.ok(trouves >= 990, `${lieu}, ${ou} : l'étendue n'est pas vide (${trouves} sur 1 000)`);
    }
  }
});

test("la table à l'état actuel ne change rien aux lieux : mêmes points, mêmes places (pas de version nouvelle)", () => {
  assert.deepEqual(semerLieu("station").ressources, genererHalte());
  assert.deepEqual(semerLieu("gue").ressources, genererGue());
  assert.deepEqual(semerLieu("moulin").ressources, butinMoulin());
  assert.deepEqual(semerLieu("cooperative").ressources, butinCoop());
  // Les quantités d'avant (0.8.2 : B2 à B8, Q1).
  assert.deepEqual(vracDuSemis("station"), { buche: 12, pierre: 13 });
  assert.deepEqual(vracDuSemis("gue"), { pierre: 21, buche: 4 });
  assert.equal(semisDe("station", "branche"), 26);
  assert.equal(semisDe("gue", "branche"), 8);
  // Pas de bois en plus à la station (porteur, 2026-10-13) ; pas de nourriture au Moulin ni à la Coopérative.
  for (const l of Object.values(SEMIS.station.lignes)) if (l.nouvelle) assert.ok(l.type !== "buche" && l.type !== "branche");
  for (const lieu of ["moulin", "cooperative"] as const) for (const l of Object.values(SEMIS[lieu].lignes)) assert.ok(["branche", "buche", "pierre"].includes(l.type));
});

/**
 * Le garde-fou des versions : le nombre de points de chaque lieu, à sa version. Une quantité changée dans la table
 * change ce nombre : il faut alors augmenter la version du lieu (sinon la base garde l'ancien semis), puis ce tableau.
 */
const POINTS_A_LA_VERSION: Record<LieuSemis, [version: number, points: number]> = {
  station: [6, 11 + 26 + 3 * (12 + 8 + 5) + 5],
  gue: [5, 2 + 6 + 6 + 5 + 15 + 6 + 2 * 21 + 3 + 3 * 4],
  moulin: [2, 14],
  cooperative: [3, 17],
};

test("une quantité changée demande une version nouvelle du lieu (garde-fou)", () => {
  const versions: Record<LieuSemis, number> = { station: VERSION_HALTE, gue: VERSION_GUE, moulin: VERSION_MOULIN, cooperative: VERSION_COOP };
  for (const lieu of LIEUX) {
    const [version, points] = POINTS_A_LA_VERSION[lieu];
    if (versions[lieu] !== version) continue;
    assert.equal(semerLieu(lieu).ressources.length, points, `${lieu} : le contenu a changé ; augmente sa version (et ce tableau)`);
  }
});

test("des quantités nouvelles : posées après le contenu d'avant, dans leurs étendues, par tournées pour le vrac", () => {
  const avant = structuredClone(SEMIS);
  try {
    for (const lieu of LIEUX) for (const l of Object.values(SEMIS[lieu].lignes)) if (l.nouvelle) l.n = 6;
    for (const lieu of LIEUX) {
      const ancien = { station: genererHalte, gue: genererGue, moulin: butinMoulin, cooperative: butinCoop }[lieu]();
      const { ressources, semes } = semerLieu(lieu);
      // Les points d'avant gardent leur identifiant et leur place.
      assert.deepEqual(ressources.slice(0, ancien.length), ancien);
      const nouveaux = ressources.slice(ancien.length);
      let attendus = 0;
      for (const l of Object.values(SEMIS[lieu].lignes)) if (l.nouvelle) attendus += l.n * (SEMIS[lieu].vrac[l.type] ? VRAC_MAX : 1);
      assert.ok(nouveaux.length >= attendus * 0.95, `${lieu} : ${nouveaux.length} points posés sur ${attendus}`);
      for (const r of nouveaux) {
        assert.equal(horsDeTout(lieu, r.x, r.z), null, `${lieu} : ${r.type} (${r.x} ; ${r.z})`);
        const seme = semes.get(r.id)!;
        assert.equal(SEMIS[lieu].lignes[seme.ligne]!.type, r.type);
        // Personne ne se marche dessus : l'écart de la ligne est tenu.
        const ecart = SEMIS[lieu].lignes[seme.ligne]!.ecart;
        for (const o of ressources) if (o.id !== r.id) assert.ok(Math.hypot(o.x - r.x, o.z - r.z) >= ecart - 0.02, `${lieu} : ${r.type} ${r.id} trop près de ${o.type} ${o.id}`);
      }
      // Le vrac : autant de points à chaque tournée.
      for (const [nom, l] of Object.entries(SEMIS[lieu].lignes)) {
        if (!l.nouvelle || !SEMIS[lieu].vrac[l.type]) continue;
        for (let tour = 0; tour < VRAC_MAX; tour++) assert.equal([...semes.values()].filter((s) => s.ligne === nom && s.tour === tour).length, l.n, `${lieu}, ${nom}, tournée ${tour}`);
      }
    }
  } finally {
    for (const lieu of LIEUX) SEMIS[lieu] = avant[lieu];
  }
});
