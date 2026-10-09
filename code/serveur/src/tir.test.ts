// Le moteur des projectiles (Book 23 §5, Book 25 §3.4 et §10.3, chantier 1 · 0.6) : la trajectoire s'arrête au premier
// mur, on ne lance pas par-dessus un rayonnage, la cadence, la portée maximale, saisi pas de tir, la munition tombe et se
// ramasse, la casse suit sa probabilité (graine fixe).
//
// L'arc et l'arbalète n'existent pas encore (chantiers 4 et 7) : les tests du tir se servent d'une table de test, avec
// des objets d'aujourd'hui qui jouent leur rôle (une corde fait l'arc, des branches font les flèches).

import { test } from "node:test";
import assert from "node:assert/strict";
import { nouvelEteint, type Eteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, ZONE_STATION, ZONE_TERRAIN, type Zone } from "../../commun/src/lieux.ts";
import { ZONE_COOP } from "../../commun/src/lieux.ts";
import type { MessageServeur, ProjectileVu } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { MARE } from "../../commun/src/terrain.ts";
import { OBJETS_LANCES, premierMur, pretALancer, type ArmeTir, type Munition, type ObjetLance, type TablesTir } from "../../commun/src/tir.ts";
import type { Arme } from "../../commun/src/combat.ts";
import { messageValide } from "./controle.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { Tir, toucher, type ContexteTir } from "./tir.ts";

/** Un tirage reproductible (graine fixe). */
function graine(n: number): () => number {
  let x = n;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

// Une table de test : un « arc » (la corde) qui tire des « flèches » (les branches), et une « arbalète » (la scie)
// armée d'avance qui tire des « carreaux » (les pierres à feu). Valeurs de l'arc simple du Book 25 §8.3.
const ARC: ArmeTir = { objet: "corde", nom: "l'arc", type: "percant", porteeUtile: 12, porteeMax: 25, porteeTete: 6, degatsRapide: 0.6, degatsPlein: 1.2, pleinMs: 1500, rechargeMs: 1000, endurance: 6, bruit: 3, solidite: 150 };
const ARBALETE: ArmeTir = { objet: "scie", nom: "l'arbalète", type: "percant", porteeUtile: 15, porteeMax: 30, porteeTete: 12, degatsRapide: null, degatsPlein: 1.5, pleinMs: 300, rechargeMs: 3000, endurance: 10, bruit: 6, solidite: 200, armeeDAvance: true };
const FLECHE: Munition = { objet: "branche", pour: ["corde"], casse: 1 / 3, tueALaTete: true };
const CARREAU: Munition = { objet: "pierre_a_feu", pour: ["scie"], casse: 1 / 5, tueALaTete: true };
// La hachette n'existe pas encore (chantiers 3 et 5) : le marteau joue son rôle de test.
const HACHETTE: ObjetLance = { ...OBJETS_LANCES.find((o) => o.objet === "hachette")!, objet: "marteau" };
const TABLES: TablesTir = { lances: [...OBJETS_LANCES, HACHETTE], armes: [ARC, ARBALETE], munitions: [FLECHE, CARREAU] };

/** Un joueur de test, tout en mémoire : position, sac, Éteints, et tout ce qu'il reçoit. */
function banc(o: { inventaire: Inventaire; eteints?: Eteint[]; zone?: Zone; lieu?: "terrain" | "station" | "cooperative"; x?: number; z?: number; alea?: () => number; tables?: TablesTir }) {
  let instant = 1_000_000;
  const etat = {
    position: { x: o.x ?? 40, z: o.z ?? 30, o: 0 },
    inventaire: { ...o.inventaire } as Inventaire,
    eteints: o.eteints ?? [],
    endurance: 100,
    saisi: false,
    sol: [] as { objets: Inventaire; x: number; z: number }[],
    recus: [] as MessageServeur[],
    textes: [] as string[],
    uses: [] as Arme[],
    detruits: [] as Eteint[],
    mesures: [] as string[],
    gestes: [] as { libelle: string; appliquer: () => void }[],
  };
  const ctx: ContexteTir = {
    id: 7,
    maintenant: () => instant,
    alea: o.alea ?? (() => 0.5),
    position: () => etat.position,
    orienter: (a) => {
      etat.position = { ...etat.position, o: a };
    },
    lieu: () => o.lieu ?? "station",
    zone: () => o.zone ?? ZONE_STATION,
    eteints: () => etat.eteints,
    inventaire: () => etat.inventaire,
    retirer: (cle, n) => {
      etat.inventaire[cle] = (etat.inventaire[cle] ?? 0) - n;
      if (!etat.inventaire[cle]) delete etat.inventaire[cle];
    },
    poserAuSol: (objets, ou) => etat.sol.push({ objets, ...ou }),
    saisi: () => etat.saisi,
    empeche: () => null,
    endurance: () => etat.endurance,
    depenser: (n) => {
      etat.endurance -= n;
    },
    info: (t) => etat.textes.push(t),
    indice: (_s, t) => etat.textes.push(t),
    envoyer: (m) => etat.recus.push(m),
    diffuser: (m) => etat.recus.push(m),
    user: (a) => etat.uses.push(a),
    apresDestruction: (e, comment) => {
      etat.detruits.push(e);
      if (comment) etat.mesures.push(`detruit:${comment}`);
    },
    noterTir: (objet) => etat.mesures.push(`tir:${objet}`),
    commencer: (libelle, _d, appliquer) => etat.gestes.push({ libelle, appliquer }),
  };
  const tir = new Tir(ctx, o.tables ?? TABLES);
  const projectiles = () => etat.recus.filter((m) => m.t === "projectile").map((m) => (m as { projectile: ProjectileVu }).projectile);
  const attendre = (ms: number) => {
    instant += ms;
  };
  return { tir, etat, projectiles, attendre, instant: () => instant };
}

test("tir : la trajectoire s'arrête au premier mur ; un rayonnage de 4 m arrête, une caisse basse non", () => {
  // Le rayonnage du hangar (x 37 → 51, z 19,4 → 20,6) : lancé du sud vers le nord, on le heurte à z ≈ 20,6.
  const t = premierMur(ZONE_COOP, 44, 22.5, 44, 17.5);
  assert.ok(t < 1);
  assert.ok(Math.abs(22.5 - 5 * t - 20.6) < 0.1, `heurté à z = ${22.5 - 5 * t}`);
  // Le long de l'allée, rien ne l'arrête.
  assert.equal(premierMur(ZONE_COOP, 40, 22.2, 48, 22.2), 1);
  // La caisse du libre-service (basse) : on lance par-dessus.
  assert.equal(premierMur(ZONE_COOP, 38, 36.5, 38, 39.5), 1);
  // Le bord du terrain arrête aussi.
  assert.ok(premierMur(ZONE_TERRAIN, 5, 5, -10, 5) < 1);
});

test("tir : on ne lance pas par-dessus un rayonnage — la pierre tombe au pied, l'Éteint de l'autre côté n'a rien", () => {
  const e = nouvelEteint(1, 44, 17.5, "errant");
  const b = banc({ inventaire: { pierre: 2 }, eteints: [e], zone: ZONE_COOP, lieu: "cooperative", x: 44, z: 22.5 });
  b.tir.lancer(0, -1, 1);
  const [p] = b.projectiles();
  assert.equal(p!.impact, "mur");
  assert.equal(p!.coup, undefined);
  assert.equal(e.etourdi, 0);
  assert.ok(p!.z1 > 20.6, "la pierre reste de ce côté-ci");
  // Elle est par terre, ramassable.
  assert.deepEqual(b.etat.sol.map((s) => s.objets), [{ pierre: 1 }]);
  assert.equal(b.etat.inventaire.pierre, 1);
});

test("tir : la pierre touche l'Éteint accroché, l'étourdit 1 s, et retombe à ses pieds ; elle fait du bruit", () => {
  const e = nouvelEteint(1, 40, 35, "poursuivant");
  const b = banc({ inventaire: { pierre: 3 }, eteints: [e] });
  b.tir.lancer(0, 1, 1);
  const [p] = b.projectiles();
  assert.equal(p!.impact, "eteint");
  assert.equal(p!.coup?.id, 1);
  assert.equal(p!.coup?.resultat, "vacille");
  assert.equal(e.etourdi, 1);
  assert.equal(b.etat.inventaire.pierre, 2);
  assert.equal(b.etat.sol.length, 1);
  assert.ok(Math.hypot(b.etat.sol[0]!.x - 40, b.etat.sol[0]!.z - 35) < 1);
  assert.ok(b.tir.stimuli().some((s) => s.portee === 8), "l'impact s'entend à 8 m");
  assert.equal(b.etat.endurance, 100 - 4);
});

test("tir : le premier Éteint sur la ligne prend le coup, pas celui de derrière", () => {
  const loin = nouvelEteint(1, 40, 36, "poursuivant");
  const devant = nouvelEteint(2, 40.2, 33, "poursuivant");
  const b = banc({ inventaire: { pierre: 1 }, eteints: [loin, devant] });
  b.tir.lancer(0, 1, 1);
  assert.equal(b.projectiles()[0]!.coup?.id, 2);
  assert.equal(loin.etourdi, 0);
});

test("tir : cadence trop rapide refusée ; une seconde plus tard, ça repart", () => {
  const b = banc({ inventaire: { pierre: 3 } });
  b.tir.lancer(0, 1);
  b.attendre(400);
  b.tir.lancer(0, 1);
  assert.equal(b.projectiles().length, 1);
  assert.equal(b.etat.inventaire.pierre, 2);
  b.attendre(700);
  b.tir.lancer(0, 1);
  assert.equal(b.projectiles().length, 2);
});

test("tir : au-delà de la portée maximale, aucun impact — la pierre retombe à 8 m", () => {
  const e = nouvelEteint(1, 40, 42, "poursuivant");
  const b = banc({ inventaire: { pierre: 1 }, eteints: [e] });
  b.tir.lancer(0, 1, 1);
  const [p] = b.projectiles();
  assert.equal(p!.impact, "sol");
  assert.equal(e.etourdi, 0);
  assert.ok(Math.abs(p!.z1 - 38) < 0.01, `tombée à z = ${p!.z1}`);
  // Une distance demandée plus grande que la portée est ramenée à la portée.
  const b2 = banc({ inventaire: { pierre: 1 } });
  b2.tir.lancer(1, 0, undefined, 50);
  assert.ok(Math.abs(b2.projectiles()[0]!.x1 - 48) < 0.01);
});

test("tir : saisi, pas de tir ; sans rien à lancer, on le dit", () => {
  const b = banc({ inventaire: { pierre: 1 } });
  b.etat.saisi = true;
  b.tir.lancer(0, 1);
  assert.equal(b.projectiles().length, 0);
  assert.equal(b.etat.inventaire.pierre, 1);
  assert.ok(b.etat.textes.some((t) => /égage-toi/.test(t)));
  const vide = banc({ inventaire: {} });
  vide.tir.lancer(0, 1);
  assert.equal(vide.projectiles().length, 0);
  assert.ok(vide.etat.textes.some((t) => /Rien à lancer/.test(t)));
});

test("tir : le réveil vise un point à 8 m, passe au-dessus des Éteints et sonne 20 s (18 m)", () => {
  const e = nouvelEteint(1, 40, 34, "errant");
  const b = banc({ inventaire: { reveil: 1, pierre: 4 }, eteints: [e] });
  b.tir.preparer("reveil");
  b.tir.lancer(0, 1);
  const [p] = b.projectiles();
  assert.equal(p!.objet, "reveil");
  assert.equal(p!.impact, "sol");
  assert.ok(Math.abs(p!.z1 - 38) < 0.01);
  assert.equal(e.etourdi, 0);
  assert.ok(b.tir.stimuli().some((s) => s.portee === 18));
  b.attendre(19_000);
  assert.ok(b.tir.stimuli().some((s) => s.portee === 18), "il sonne encore");
  b.attendre(2_000);
  assert.ok(!b.tir.stimuli().some((s) => s.portee === 18), "il s'est tu");
  // Il se reprend : il est par terre.
  assert.deepEqual(b.etat.sol[0]!.objets, { reveil: 1 });
  // Plus de réveil : le bouton reprend la pierre.
  assert.equal(b.tir.pretActuel()?.cle, "pierre");
});

test("tir : dans la mare, la pierre est perdue", () => {
  const b = banc({ inventaire: { pierre: 1 }, lieu: "terrain", zone: ZONE_TERRAIN, x: MARE.x, z: MARE.z - 6 });
  b.tir.lancer(0, 1, undefined, 6);
  assert.equal(b.projectiles()[0]!.impact, "eau");
  assert.equal(b.etat.sol.length, 0);
});

test("tir : la hachette lancée — au torse, ou sur un coup heureux à la tête ; le casque l'arrête", () => {
  const errant = nouvelEteint(1, 40, 35, "poursuivant");
  const heureux = banc({ inventaire: { marteau: 1 }, eteints: [errant], alea: () => 0.1 });
  heureux.tir.preparer("marteau");
  heureux.tir.lancer(0, 1, 1);
  assert.equal(heureux.projectiles()[0]!.coup?.resultat, "detruit");
  assert.equal(heureux.etat.detruits.length, 1);
  // Il faut aller la reprendre.
  assert.deepEqual(heureux.etat.sol[0]!.objets, { marteau: 1 });
  const casque = Object.assign(nouvelEteint(2, 40, 35, "poursuivant"), { variante: "equipe" as const });
  const b = banc({ inventaire: { marteau: 1 }, eteints: [casque], alea: () => 0.1 });
  b.tir.preparer("marteau");
  b.tir.lancer(0, 1, 2);
  assert.notEqual(b.projectiles()[0]!.coup?.resultat, "detruit");
  // Pas de coup heureux : le torse.
  const torse = nouvelEteint(3, 40, 35, "poursuivant");
  const b2 = banc({ inventaire: { marteau: 1 }, eteints: [torse], alea: () => 0.9 });
  b2.tir.preparer("marteau");
  b2.tir.lancer(0, 1, 3);
  assert.equal(b2.projectiles()[0]!.coup?.resultat, "vacille");
  assert.ok(Math.abs(torse.degats - 1.3) < 1e-9);
});

test("tir : une pierre n'achève pas un Éteint à terre (il faut une vraie arme)", () => {
  const e = Object.assign(nouvelEteint(1, 0, 3, "poursuivant"), { etat: "a_terre" as const, aTerre: 4 });
  assert.equal(toucher(e, { genre: "lancer", def: OBJETS_LANCES[0]!, heureux: false }, { x: 0, z: 0 }, ZONE_STATION), "vacille");
  assert.equal(e.etat, "a_terre");
});

test("tir : l'arc — tir plein à portée de tête, il est détruit ; plus loin, le torse ; tir rapide, le torse", () => {
  const tirer = (distance: number, tenuMs: number, e = nouvelEteint(1, 40, 30 + distance, "poursuivant")) => {
    const b = banc({ inventaire: { corde: 1, branche: 5 }, eteints: [e], alea: () => 0.99 });
    b.tir.preparer("corde");
    b.tir.bander();
    b.attendre(tenuMs);
    b.tir.lancer(0, 1, e.id);
    return { b, e, resultat: b.projectiles()[0]?.coup?.resultat };
  };
  assert.equal(tirer(6, 1600).resultat, "detruit");
  assert.equal(tirer(7, 1600).resultat, "vacille");
  const rapide = tirer(4, 500);
  assert.equal(rapide.resultat, "vacille");
  assert.ok(Math.abs(rapide.e.degats - 0.6) < 1e-9, "tir rapide : 0,6 au torse");
  // Bander coûte 6 d'endurance ; chaque tir use l'arc ; la flèche part du sac.
  assert.equal(rapide.b.etat.endurance, 94);
  assert.equal(rapide.b.etat.uses.length, 1);
  assert.equal(rapide.b.etat.inventaire.branche, 4);
  // Encocher : pas de second tir avant 1 s.
  rapide.b.tir.bander();
  rapide.b.tir.lancer(0, 1, 1);
  assert.equal(rapide.b.projectiles().length, 1);
});

test("tir : les mesures du métier — chaque tir, et l'Éteint détruit d'un tir plein (Book 25 §10.1)", () => {
  const e = nouvelEteint(1, 40, 35, "poursuivant");
  const b = banc({ inventaire: { corde: 1, branche: 5 }, eteints: [e], alea: () => 0.99 });
  b.tir.preparer("corde");
  b.tir.bander();
  b.attendre(1600);
  b.tir.lancer(0, 1, e.id);
  assert.deepEqual(b.etat.mesures, ["tir:corde", "detruit:tir_plein"]);
});

test("tir : contre un Équipé, la flèche passe la visière de face, à la moitié de la portée de tête ; de dos, non", () => {
  const equipe = (o: number) => Object.assign(nouvelEteint(1, 40, 33, "poursuivant", o), { variante: "equipe" as const });
  const tirer = (e: Eteint) => {
    const b = banc({ inventaire: { corde: 1, branche: 2 }, eteints: [e], alea: () => 0.99 });
    b.tir.preparer("corde");
    b.tir.bander();
    b.attendre(1600);
    b.tir.lancer(0, 1, e.id);
    return b.projectiles()[0]?.coup?.resultat;
  };
  // À 3 m (la moitié de 6), de face (il regarde vers le tireur, au sud) : détruit.
  assert.equal(tirer(equipe(Math.PI)), "detruit");
  // De dos : la flèche frappe le blouson.
  assert.notEqual(tirer(equipe(0)), "detruit");
});

test("tir : la flèche qui touche casse une fois sur trois (graine fixe) ; sinon elle se reprend sur le corps", () => {
  let cassees = 0;
  const n = 300;
  const alea = graine(42);
  for (let i = 0; i < n; i++) {
    const e = nouvelEteint(1, 40, 34, "poursuivant");
    const b = banc({ inventaire: { corde: 1, branche: 1 }, eteints: [e], alea });
    b.tir.preparer("corde");
    b.tir.lancer(0, 1, 1);
    assert.equal(b.projectiles()[0]!.impact, "eteint");
    if (b.etat.sol.length === 0) cassees++;
    else assert.deepEqual(b.etat.sol[0]!.objets, { branche: 1 });
  }
  assert.ok(Math.abs(cassees / n - 1 / 3) < 0.07, `${cassees} cassées sur ${n}`);
});

test("tir : au-delà de la portée utile, la chance de toucher baisse ; à côté, la flèche file et tombe au sol", () => {
  // À 24 m (utile 12, max 25), la chance est faible : un tirage haut manque.
  const e = nouvelEteint(1, 40, 54, "poursuivant");
  const b = banc({ inventaire: { corde: 1, branche: 1 }, eteints: [e], alea: () => 0.95 });
  b.tir.preparer("corde");
  b.tir.lancer(0, 1, 1);
  const [p] = b.projectiles();
  assert.notEqual(p!.impact, "eteint");
  assert.equal(e.degats, 0);
  assert.deepEqual(b.etat.sol[0]!.objets, { branche: 1 }, "elle se ramasse");
});

test("tir : l'arbalète armée d'avance tire tout de suite ; désarmée, Lancer la réarme (un geste), puis elle retire", () => {
  const e = nouvelEteint(1, 40, 40, "poursuivant");
  const b = banc({ inventaire: { scie: 1, pierre_a_feu: 3 }, eteints: [e], alea: () => 0.99 });
  b.tir.preparer("scie");
  b.tir.lancer(0, 1, 1);
  assert.equal(b.projectiles()[0]!.coup?.resultat, "detruit", "armée, à 10 m (portée de tête 12 m)");
  b.attendre(5000);
  b.tir.lancer(0, 1);
  assert.equal(b.projectiles().length, 1, "désarmée : rien ne part");
  b.tir.bander();
  assert.equal(b.etat.gestes.length, 1);
  assert.match(b.etat.gestes[0]!.libelle, /Réarmer/);
  b.etat.gestes[0]!.appliquer();
  assert.ok(b.etat.recus.some((m) => m.t === "pret" && m.armee === true));
  b.tir.lancer(0, 1);
  assert.equal(b.projectiles().length, 2);
});

test("tir : l'objet prêt — l'arc choisi sans flèches le dit ; sans choix, la pierre", () => {
  assert.equal(pretALancer({ pierre: 1, corde: 1 }, null, TABLES)?.cle, "pierre");
  assert.equal(pretALancer({ pierre: 1, corde: 1 }, "corde", TABLES)?.genre, "tir");
  assert.equal(pretALancer({ couteau: 1 }, null, TABLES), null);
  const b = banc({ inventaire: { corde: 1 } });
  b.tir.preparer("corde");
  b.tir.lancer(0, 1);
  assert.equal(b.projectiles().length, 0);
  assert.ok(b.etat.textes.some((t) => /Plus rien à tirer/.test(t)));
  // On ne prépare pas ce qui ne se lance pas.
  b.tir.preparer("couteau");
  assert.equal(b.tir.pret, "corde");
});

test("tir : les messages du client sont contrôlés", () => {
  assert.ok(messageValide({ t: "lancer", dx: 0, dz: 1 }));
  assert.ok(messageValide({ t: "lancer", dx: 0.3, dz: -1, cible: 4, distance: 8 }));
  assert.ok(!messageValide({ t: "lancer", dx: Number.NaN, dz: 1 }));
  assert.ok(!messageValide({ t: "lancer", dx: 0, dz: 1, cible: 1.5 }));
  assert.ok(!messageValide({ t: "lancer", dx: 0, dz: 1, distance: 1e9 }));
  assert.ok(messageValide({ t: "bander" }));
  assert.ok(messageValide({ t: "rearmer" }));
  assert.ok(messageValide({ t: "preparer", objet: "pierre" }));
  assert.ok(messageValide({ t: "preparer", objet: null }));
  assert.ok(!messageValide({ t: "preparer", objet: "toString" }));
});

test("tir : dans le jeu — à la halte, une pierre lancée touche l'Éteint, tombe au sol et se ramasse", () => {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, pierre: 2 });
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5);
  const attendre = (secondes: number, pas = 0.05) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  joueur.recevoir({ t: "voyager", vers: "station" });
  attendre(DUREE_VOYAGE_S + 0.1, 0.5);
  const e = nouvelEteint(9, 40, 39, "poursuivant");
  halte.eteints = [e];
  joueur.position = { x: 40, z: 34.6, o: 0 };
  joueur.recevoir({ t: "bander" });
  joueur.recevoir({ t: "lancer", dx: 0, dz: 1, cible: 9 });
  const p = recus.find((m) => m.t === "projectile") as Extract<MessageServeur, { t: "projectile" }> | undefined;
  assert.ok(p, "un projectile part");
  assert.equal(p.projectile.coup?.id, 9);
  assert.ok(e.etourdi > 0);
  const inventaire = () => (recus.findLast((m) => m.t === "inventaire") as Extract<MessageServeur, { t: "inventaire" }>).inventaire;
  assert.equal(inventaire().pierre, 1);
  // Elle est au sol, près de l'Éteint : on va la reprendre.
  const tas = halte.sacs.find((s) => s.contenu.jete && s.contenu.inventaire.pierre === 1);
  assert.ok(tas, "la pierre est par terre");
  halte.eteints = [];
  joueur.position = { x: tas.x, z: tas.z - 0.5, o: 0 };
  joueur.recevoir({ t: "interagir", cible: { genre: "sac", id: tas.id }, verbe: "reprendre" });
  attendre(2);
  assert.equal(inventaire().pierre, 2);
});

test("tir (0.7.1) : plaqué contre un mur, on ne lance ni ne tire à travers ; l'Éteint de l'autre côté n'a rien", () => {
  // Dans la boutique de la halte, contre son mur est (x 109,7 → 110) ; l'Éteint dehors, à un mètre, accroché.
  for (const arc of [false, true]) {
    const e = nouvelEteint(1, 110.36, 14.5, "errant");
    const b = banc({ inventaire: arc ? { corde: 1, branche: 3 } : { pierre: 2 }, eteints: [e], x: 109.36, z: 14.5, alea: () => 0.99 });
    if (arc) {
      b.tir.preparer("corde");
      b.tir.bander();
      b.attendre(1600);
    }
    b.tir.lancer(1, 0, e.id);
    const [p] = b.projectiles();
    assert.ok(p, "il part");
    assert.equal(p!.impact, "mur");
    assert.equal(p!.coup, undefined);
    assert.equal(e.etourdi, 0);
    assert.equal(e.degats, 0);
    assert.ok(p!.x1 < 109.7, `il reste de ce côté-ci (x = ${p!.x1})`);
  }
});

test("tir (0.7.1) : un Éteint derrière un mur, frôlé par la trajectoire, n'est pas touché", () => {
  // On lance le long du mur nord de la boutique, de l'intérieur : l'Éteint est dehors, à 0,4 m de la ligne.
  const e = nouvelEteint(1, 103, 11.2, "errant");
  const b = banc({ inventaire: { pierre: 2 }, eteints: [e], x: 100, z: 11.95 });
  b.tir.lancer(1, 0, undefined, 6);
  const [p] = b.projectiles();
  assert.ok(p, "il part");
  assert.notEqual(p!.impact, "eteint");
  assert.equal(e.etourdi, 0);
});
