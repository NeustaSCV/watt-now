// Le corps qui reste à la déconnexion (0.11, chantier E ; D-13 et D-18) : là où il y a des Éteints, le corps reste une
// minute, exposé ; reconnecté avant, on reprend la main là où il est ; ailleurs, on part tout de suite, comme avant.

import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import type { LieuJouable } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base, type Compte } from "./base.ts";
import { DUREE_CORPS_ABSENT_MS, corpsResteIci } from "./corps-absent.ts";
import type { Joueur } from "./joueur.ts";
import { Monde } from "./monde.ts";

test("où le corps reste : les quatre haltes et les lieux à soi ; ni le terrain, ni le Comptoir, ni en route, ni en pause", () => {
  for (const lieu of ["station", "gue", "route_pont", "corniche", "cooperative", "moulin", "grand_hotel", "phare"] as const) {
    assert.equal(corpsResteIci({ lieu, enRoute: false, enPause: false }), true, lieu);
  }
  assert.equal(corpsResteIci({ lieu: "terrain", enRoute: false, enPause: false }), false);
  assert.equal(corpsResteIci({ lieu: "comptoir", enRoute: false, enPause: false }), false);
  assert.equal(corpsResteIci({ lieu: "station", enRoute: true, enPause: false }), false);
  assert.equal(corpsResteIci({ lieu: "cooperative", enRoute: false, enPause: true }), false);
});

/** Un monde à l'heure simulée, et des joueurs branchés sur de fausses sockets. */
function monter() {
  mock.timers.enable({ apis: ["Date"], now: 1_000_000_000 });
  const base = new Base(":memory:");
  const monde = new Monde(base);
  const brancher = (pseudo: string, lieu: LieuJouable = "station", existant?: Compte) => {
    const compte = existant ?? base.creerCompte(pseudo, "motdepasse1", "mecanistes");
    if (!existant) base.sauverPosition(compte.id, { x: 40, z: 34.6, o: 0 }, lieu, Date.now() - 1000);
    const recus: MessageServeur[] = [];
    const ecouteurs: Record<string, () => void> = {};
    const socket = {
      readyState: 1,
      OPEN: 1,
      send: (t: string) => recus.push(JSON.parse(t) as MessageServeur),
      on: (ev: string, f: () => void) => (ecouteurs[ev] = f),
      close() {
        this.readyState = 3;
        ecouteurs.close?.();
      },
    };
    monde.rejoindre(compte, socket as never);
    return { compte, recus, fermer: () => socket.close() };
  };
  const connexions = monde["connexions"] as Map<number, { joueur: Joueur }>;
  const joueurDe = (id: number) => connexions.get(id)?.joueur;
  const corps = () => monde["corps"] as { get(id: number): { joueur: Joueur } | undefined; nombre: number };
  const halte = monde["halte"] as unknown as { eteints: ReturnType<typeof nouvelEteint>[]; nombrePresents: number };
  /** Le monde avance, par tics de 50 ms. */
  const attendre = (secondes: number) => {
    for (let s = 0; s < secondes - 1e-9; s += 0.05) {
      mock.timers.tick(50);
      monde["dernierTick"] = performance.now() - 50;
      monde["tick"]();
    }
  };
  const finir = () => {
    monde.arreter();
    mock.timers.reset();
  };
  return { base, monde, brancher, joueurDe, corps, halte, attendre, finir };
}

const santeDe = (j: Joueur) => (j["sante"] as { points: number }).points;

test("déconnecté dans une halte : le corps reste, les autres le voient, un Éteint le mord, la santé baisse", () => {
  const t = monter();
  try {
    const rose = t.brancher("Rose");
    const paul = t.brancher("Paul");
    const corpsRose = t.joueurDe(rose.compte.id)!;
    corpsRose.position = { x: 40, z: 34.6, o: 0 };
    t.joueurDe(paul.compte.id)!.position = { x: 44, z: 34.6, o: 0 };
    t.attendre(0.5);
    const santeAvant = santeDe(corpsRose);
    rose.fermer();
    // Plus connectée, mais son corps est là, dans la halte.
    assert.equal(t.joueurDe(rose.compte.id), undefined);
    assert.equal(t.corps().get(rose.compte.id)?.joueur, corpsRose);
    assert.equal(t.halte.nombrePresents, 2);
    assert.equal(corpsRose.corpsAbsent, true);
    // Paul la voit toujours, debout.
    paul.recus.length = 0;
    t.attendre(0.3);
    const autres = paul.recus.findLast((m) => m.t === "autres");
    assert.ok(!autres || autres.joueurs.some((a) => a.id === rose.compte.id), "elle n'est pas retirée de la vue de Paul");
    // Un Éteint au contact : il la saisit et la mord.
    t.halte.eteints = [nouvelEteint(99, 40, 35.5, "poursuivant")];
    t.attendre(8);
    assert.ok(santeDe(corpsRose) < santeAvant, "la morsure a porté");
    assert.deepEqual(corpsRose.position, { x: 40, z: 34.6, o: 0 }, "immobile");
  } finally {
    t.finir();
  }
});

test("reconnecté pendant la minute : le même corps, au même endroit, même santé, sans doublon dans la halte", () => {
  const t = monter();
  try {
    const rose = t.brancher("Rose");
    const corpsRose = t.joueurDe(rose.compte.id)!;
    corpsRose.position = { x: 41.5, z: 33, o: 1 };
    corpsRose["sante"] = { ...corpsRose["sante"], points: 61 };
    rose.fermer();
    t.attendre(20);
    const sante = santeDe(corpsRose);
    const retour = t.brancher("Rose", "station", rose.compte);
    assert.equal(t.joueurDe(rose.compte.id), corpsRose, "le même joueur, pas un nouveau relu en base");
    assert.equal(t.corps().nombre, 0);
    assert.equal(t.halte.nombrePresents, 1, "pas de doublon");
    assert.equal(corpsRose.corpsAbsent, false);
    const b = retour.recus.find((m) => m.t === "bienvenue");
    assert.ok(b && b.t === "bienvenue");
    assert.equal(b.lieu, "station");
    assert.deepEqual(b.position, { x: 41.5, z: 33, o: 1 }, "là où est son corps, pas à l'entrée");
    assert.equal(santeDe(corpsRose), sante);
    assert.ok(retour.recus.some((m) => m.t === "sante"), "la santé (et la saisie) renvoyée");
    // Il rejoue : ses messages lui arrivent.
    retour.recus.length = 0;
    t.attendre(0.5);
    assert.ok(retour.recus.length > 0);
  } finally {
    t.finir();
  }
});

test("une connexion depuis ailleurs pendant qu'on joue : la nouvelle reprend le même corps", () => {
  const t = monter();
  try {
    const rose = t.brancher("Rose");
    const corpsRose = t.joueurDe(rose.compte.id)!;
    t.brancher("Rose", "station", rose.compte);
    assert.equal(t.joueurDe(rose.compte.id), corpsRose);
    assert.equal(t.halte.nombrePresents, 1);
    assert.equal(t.corps().nombre, 0);
  } finally {
    t.finir();
  }
});

test("au bout d'une minute, le corps s'en va et la sauvegarde est à jour", () => {
  const t = monter();
  try {
    const rose = t.brancher("Rose");
    const corpsRose = t.joueurDe(rose.compte.id)!;
    corpsRose.position = { x: 41.5, z: 33, o: 0 };
    rose.fermer();
    corpsRose["sante"] = { ...corpsRose["sante"], points: 55 };
    t.attendre(DUREE_CORPS_ABSENT_MS / 1000 - 1);
    assert.equal(t.corps().nombre, 1);
    t.attendre(1.1);
    assert.equal(t.corps().nombre, 0);
    assert.equal(t.halte.nombrePresents, 0);
    const perso = t.base.chargerPersonnage(rose.compte.id)!;
    assert.equal(perso.lieu, "station");
    assert.deepEqual(perso.position, { x: 41.5, z: 33, o: 0 });
    assert.ok(Math.abs(t.base.chargerSante(rose.compte.id).sante.points - santeDe(corpsRose)) < 1e-6);
    // Il revient ensuite comme aujourd'hui : relu en base, à l'entrée la plus proche.
    t.brancher("Rose", "station", rose.compte);
    assert.notEqual(t.joueurDe(rose.compte.id), corpsRose);
    assert.equal(t.halte.nombrePresents, 1);
  } finally {
    t.finir();
  }
});

test("effondré pendant la minute : l'effondrement habituel, le sac reste dans la halte, le corps s'en va ; il le lit à son retour", () => {
  const t = monter();
  try {
    const rose = t.brancher("Rose");
    const corpsRose = t.joueurDe(rose.compte.id)!;
    corpsRose["inventaire"] = { pierre: 2 };
    rose.fermer();
    corpsRose["sante"] = { ...corpsRose["sante"], points: 0.01, saignement: "fort" };
    t.attendre(0.2);
    assert.equal(t.corps().nombre, 0);
    assert.equal(t.halte.nombrePresents, 0);
    const perso = t.base.chargerPersonnage(rose.compte.id)!;
    assert.equal(perso.lieu, "terrain");
    assert.equal(t.base.chargerSacs("station", 0).length, 1, "le sac est resté sur place");
    // À son retour, il lit ce qui lui est arrivé (une seule fois).
    const retour = t.brancher("Rose", "station", rose.compte);
    const infos = retour.recus.filter((m) => m.t === "info").map((m) => (m.t === "info" ? m.texte : ""));
    assert.ok(infos.some((x) => x.includes("Des inconnus t'ont ramené chez toi, sans ton sac.")), infos.join(" | "));
    retour.fermer();
    t.attendre(61);
    const encore = t.brancher("Rose", "terrain", rose.compte);
    assert.ok(!encore.recus.some((m) => m.t === "info" && m.texte.includes("Des inconnus")), "pas une seconde fois");
  } finally {
    t.finir();
  }
});

test("l'admin invincible ne meurt pas non plus pendant la minute", () => {
  const t = monter();
  try {
    const rose = t.brancher("Rose");
    const corpsRose = t.joueurDe(rose.compte.id)!;
    corpsRose["invincible"] = true;
    rose.fermer();
    corpsRose["sante"] = { ...corpsRose["sante"], points: 0.01, saignement: "fort" };
    t.attendre(0.5);
    assert.equal(t.corps().nombre, 1);
    assert.equal(corpsRose.lieu, "station");
  } finally {
    t.finir();
  }
});

test("au terrain et au Comptoir : il disparaît tout de suite, comme avant", () => {
  const t = monter();
  try {
    for (const lieu of ["terrain", "comptoir"] as const) {
      const j = t.brancher(`Gens-${lieu}`, lieu);
      assert.equal(t.joueurDe(j.compte.id)!.lieu, lieu);
      j.fermer();
      assert.equal(t.corps().nombre, 0, lieu);
    }
  } finally {
    t.finir();
  }
});

test("dans un lieu à soi : le corps reste ; en pause, il part tout de suite (le monde l'attendait)", () => {
  const t = monter();
  try {
    const rose = t.brancher("Rose", "cooperative");
    rose.fermer();
    assert.equal(t.corps().nombre, 1);
    assert.equal(t.corps().get(rose.compte.id)!.joueur.lieu, "cooperative");
    const paul = t.brancher("Paul", "cooperative");
    t.joueurDe(paul.compte.id)!["pause"] = true;
    paul.fermer();
    assert.equal(t.corps().nombre, 1, "Paul, en pause, est parti");
    assert.equal(t.corps().get(paul.compte.id), undefined);
  } finally {
    t.finir();
  }
});

test("la page d'administration déconnecte : le corps part tout de suite, même celui déjà resté", () => {
  const t = monter();
  try {
    const rose = t.brancher("Rose");
    assert.equal(t.monde.deconnecter(rose.compte.id), true);
    assert.equal(t.corps().nombre, 0);
    const paul = t.brancher("Paul");
    paul.fermer();
    assert.equal(t.corps().nombre, 1);
    assert.equal(t.monde.deconnecter(paul.compte.id), true);
    assert.equal(t.corps().nombre, 0);
    assert.equal(t.halte.nombrePresents, 0);
  } finally {
    t.finir();
  }
});
