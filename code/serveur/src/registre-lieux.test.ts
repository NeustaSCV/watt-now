// Plan 0.10, chantier A : le registre des lieux, côté serveur. On voyage du terrain à l'hôtel par la route du pont, et
// au phare par la corniche, en autant de temps sur les deux routes ; les haltes du niveau 2 sont partagées, l'hôtel et
// le phare à chacun ; un lieu à soi nouveau revient au bout de 24 h, même vide.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, arriveeDans, distanceKm, etapeVers, sortiesDe, type LieuId } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { REINITIALISATION_LIEU_MS } from "../../commun/src/registre-lieux.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { LieuxPersonnels } from "./lieux-personnels.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { Moulins } from "./moulin.ts";

rendreSilencieux(true);

/** Un monde en mémoire, comme celui du serveur : tous les lieux vivants partagés entre les joueurs qu'on y ouvre. */
function monde() {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const maintenant = () => instant;
  const halte = new Halte(base);
  const gue = new Gue(base);
  const cooperatives = new Cooperatives(base, Math.random, maintenant);
  const moulins = new Moulins(base, Math.random, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, Math.random, maintenant);
  const ouvrir = (compteId: number, pseudo: string) => {
    const recus: MessageServeur[] = [];
    const joueur = new Joueur({ id: compteId, pseudo, famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, Math.random, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
    const attendre = (secondes: number, pas = 0.5) => {
      for (let s = 0; s < secondes; s += pas) {
        instant += pas * 1000;
        joueur.tick(pas);
        lieux.tick(instant, pas);
      }
    };
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    /** Se poster à la sortie qui mène vers `vers` (au terrain, n'importe où), prendre la route, et arriver. */
    const voyager = (vers: LieuId) => {
      const etape = etapeVers(joueur.lieu, vers);
      const s = joueur.lieu === "terrain" ? SORTIE_TERRAIN : sortiesDe(joueur.lieu).find((x) => x.vers === etape || x.aussi?.includes(etape))!;
      joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
      const avant = joueur.bienvenue(0).besoins;
      joueur.recevoir({ t: "voyager", vers });
      const apres = joueur.bienvenue(0).besoins;
      attendre(DUREE_VOYAGE_S + 0.5);
      return { kcal: avant.kcal - apres.kcal, eau: avant.eau - apres.eau };
    };
    return { joueur, recus, attendre, dernier, infos, voyager };
  };
  const nouveau = (pseudo: string) => {
    const c = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverInventaire(c.id, { sac_a_dos: 1 });
    return ouvrir(c.id, pseudo);
  };
  return { base, lieux, ouvrir, nouveau, avancer: (ms: number) => (instant += ms), instant: () => instant };
}

test("on voyage du terrain au Grand Hôtel par la route du pont, et au phare par la corniche, au même prix", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  const malo = m.nouveau("Malo");
  const coutA: { kcal: number; eau: number }[] = [];
  const coutB: { kcal: number; eau: number }[] = [];
  const routeA: LieuId[] = ["route_pont", "grand_hotel"];
  const routeB: LieuId[] = ["corniche", "phare"];
  let de: LieuId = "terrain";
  for (const vers of routeA) {
    coutA.push(rose.voyager(vers));
    assert.equal(rose.joueur.lieu, vers);
    const b = rose.dernier("bienvenue")!;
    assert.equal(b.lieu, vers);
    assert.deepEqual(b.position, arriveeDans(vers, de), `on arrive ${vers} du côté de ${de}`);
    de = vers;
  }
  de = "terrain";
  for (const vers of routeB) {
    coutB.push(malo.voyager(vers));
    assert.equal(malo.joueur.lieu, vers);
    assert.deepEqual(malo.dernier("bienvenue")!.position, arriveeDans(vers, de));
    de = vers;
  }
  // Étape par étape, les deux routes coûtent la même chose (B16).
  assert.deepEqual(coutA, coutB);
  assert.equal(distanceKm("terrain", "grand_hotel"), distanceKm("terrain", "phare"));
  // Les lieux du niveau 2 ont maintenant tous leur contenu (hotel.test.ts, phare.test.ts, route-pont.test.ts, corniche.test.ts).
  for (const j of [] as (typeof rose)[]) {
    const b = j.dernier("bienvenue")!;
    assert.deepEqual(b.ressources, []);
    assert.deepEqual(b.eteints, []);
  }

  // Et l'on rentre, par les mêmes routes.
  for (const vers of ["route_pont", "terrain"] as const) rose.voyager(vers);
  for (const vers of ["corniche", "terrain"] as const) malo.voyager(vers);
  assert.equal(rose.joueur.lieu, "terrain");
  assert.equal(malo.joueur.lieu, "terrain");
});

test("du terrain, la route de l'hôtel passe par la route du pont : on s'y arrête, il faut la traverser", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  rose.voyager("grand_hotel");
  assert.equal(rose.joueur.lieu, "route_pont");
  assert.ok(rose.infos().some((t) => /La route du Grand Hôtel des Flots passe par la route du pont : il faudra la traverser à pied/.test(t)));
});

test("les haltes du niveau 2 sont partagées, comme la station ; l'hôtel et le phare sont à chacun", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  const malo = m.nouveau("Malo");
  for (const j of [rose, malo]) j.voyager("corniche");
  assert.equal(m.lieux.vivant("corniche", 0)!.nombrePresents, 2);
  assert.equal(m.lieux.vivant("corniche", rose.joueur.compte.id), m.lieux.vivant("corniche", malo.joueur.compte.id));
  assert.ok(rose.joueur.enLieuPublic);
  rose.joueur.recevoir({ t: "pause", oui: true });
  assert.ok(!rose.joueur.enPause(), "pas de pause dans une halte");
  for (const j of [rose, malo]) j.voyager("phare");
  assert.equal(m.lieux.vivant("corniche", 0)!.nombrePresents, 0);
  const aRose = m.lieux.vivant("phare", rose.joueur.compte.id)!;
  assert.notEqual(aRose, m.lieux.vivant("phare", malo.joueur.compte.id));
  assert.equal(aRose.nombrePresents, 1);
  assert.ok(!rose.joueur.enLieuPublic);
  // Au phare, on est seul : la pause est permise.
  rose.joueur.recevoir({ t: "pause", oui: true });
  assert.ok(rose.joueur.enPause());
});

test("une reconnexion à l'hôtel ramène à son entrée ; dans une halte du niveau 2, à l'entrée la plus proche", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  for (const vers of ["route_pont", "grand_hotel"] as const) rose.voyager(vers);
  rose.joueur.position = { x: 20, z: 20, o: 0 };
  rose.joueur.sauvegarder();
  rose.joueur.partir();
  let retour = m.ouvrir(rose.joueur.compte.id, "Rose");
  assert.equal(retour.joueur.lieu, "grand_hotel");
  assert.deepEqual(retour.joueur.position, arriveeDans("grand_hotel", "route_pont"));
  assert.equal(m.lieux.vivant("grand_hotel", rose.joueur.compte.id)!.nombrePresents, 1);
  retour.voyager("route_pont");
  // Près du bout est de la route du pont (côté hôtel, comme sur la carte : chantier H) : on y revient.
  retour.joueur.position = { x: 170, z: 35, o: 0 };
  retour.joueur.sauvegarder();
  retour.joueur.partir();
  assert.equal(m.lieux.vivant("route_pont", 0)!.nombrePresents, 0, "en partant, on quitte la halte");
  retour = m.ouvrir(rose.joueur.compte.id, "Rose");
  assert.equal(retour.joueur.lieu, "route_pont");
  assert.deepEqual(retour.joueur.position, arriveeDans("route_pont", "grand_hotel"));
});

test("un lieu à soi nouveau (le phare, vide) revient au bout de 24 h, à l'entrée ; il est gardé en base entre-temps", () => {
  const base = new Base(":memory:");
  let instant = 5_000_000;
  const phares = new LieuxPersonnels(base, "phare", Math.random, () => instant);
  const lieu = phares.de(7);
  const pleine = phares.etat(7)!.pleineLe;
  assert.equal(pleine, instant);
  // Le chantier du lieu range ce qu'il garde dans `propre` (ici, une marque) : il survit au déchargement.
  phares.etat(7)!.propre.marque = 1;
  phares.sauverEtat(7);
  phares.oublier(7);
  instant += REINITIALISATION_LIEU_MS - 1000;
  assert.notEqual(phares.de(7), lieu, "rechargé de la base");
  assert.equal(phares.etat(7)!.propre.marque, 1, "pas encore 24 h : rien n'a bougé");
  assert.equal(phares.etat(7)!.pleineLe, pleine);
  // Au bout de 24 h, à l'entrée, lieu vide : tout revient.
  instant += 1000;
  phares.de(7);
  assert.deepEqual(phares.etat(7)!.propre, {});
  assert.equal(phares.etat(7)!.pleineLe, instant);
  // Rechargé de la base : l'état neuf y a été écrit.
  phares.oublier(7);
  phares.de(7);
  assert.equal(phares.etat(7)!.pleineLe, instant);
  assert.deepEqual(phares.etat(7)!.propre, {});
  // Chacun le sien.
  assert.notEqual(phares.de(8), phares.de(7));
  assert.equal(phares.nombre, 2);
});

test("un lieu à soi occupé ne revient pas sous les pieds de son joueur : seulement à l'entrée suivante", () => {
  const base = new Base(":memory:");
  let instant = 5_000_000;
  const hotels = new LieuxPersonnels(base, "grand_hotel", Math.random, () => instant);
  const lieu = hotels.de(3);
  const voyageur = { envoyer: () => {}, stimuli: () => [], humain: () => ({ id: 3, x: 60, z: 53, discret: false }) } as unknown as Parameters<typeof lieu.entrer>[0];
  lieu.entrer(voyageur);
  hotels.etat(3)!.propre.marque = 1;
  instant += REINITIALISATION_LIEU_MS + 1;
  hotels.de(3);
  assert.equal(hotels.etat(3)!.propre.marque, 1, "il y est encore : rien ne bouge");
  lieu.sortir(voyageur);
  hotels.de(3);
  assert.deepEqual(hotels.etat(3)!.propre, {}, "à l'entrée suivante, tout est revenu");
});
