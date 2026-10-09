// L'arc pour tous (Book 25 §3 et §10.3, chantier 4 · 0.6) : l'ébauche sèche en 2 h, même déconnecté ; un tir plein à la
// tête à 6 m (★★★) détruit, à 7 m il touche le torse ; la pointe durcie ne tue pas à la tête ; la casse 1/2, 1/3, 1/5 ;
// un Équipé de dos ne meurt pas d'une flèche ; la qualité d'un arc monté ; le redresseur de fûts.

import { test } from "node:test";
import assert from "node:assert/strict";
import { nouvelEteint, type Eteint } from "../../commun/src/eteints.ts";
import { ZONE_STATION } from "../../commun/src/lieux.ts";
import type { MessageServeur, ProjectileVu } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { ARMES_TIR, MUNITIONS, TABLES_TIR, armeTirDe, armeTirExemplaire, pretALancer } from "../../commun/src/tir.ts";
import { OBJETS_DE_METIER, etoilesDe } from "../../commun/src/etoiles.ts";
import { etoilesDuProduit, recette, recettesConnues } from "../../commun/src/recettes.ts";
import { SECHAGE_MS, avancerSechage, sechageValide } from "../../commun/src/arc.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";
import { Tir, type ContexteTir } from "./tir.ts";

// ---------- Un tireur de test, tout en mémoire (comme tir.test.ts), avec les vraies tables ----------

function tireur(o: { inventaire: Inventaire; eteints: Eteint[]; alea?: () => number }) {
  let instant = 1_000_000;
  const etat = { position: { x: 40, z: 30, o: 0 }, inventaire: { ...o.inventaire } as Inventaire, endurance: 100, sol: [] as Inventaire[], recus: [] as MessageServeur[], textes: [] as string[] };
  const ctx: ContexteTir = {
    id: 7,
    maintenant: () => instant,
    alea: o.alea ?? (() => 0.99),
    position: () => etat.position,
    orienter: (a) => {
      etat.position = { ...etat.position, o: a };
    },
    lieu: () => "station",
    zone: () => ZONE_STATION,
    eteints: () => o.eteints,
    inventaire: () => etat.inventaire,
    retirer: (cle, n) => {
      etat.inventaire[cle] = (etat.inventaire[cle] ?? 0) - n;
      if (!etat.inventaire[cle]) delete etat.inventaire[cle];
    },
    poserAuSol: (objets) => etat.sol.push(objets),
    saisi: () => false,
    empeche: () => null,
    endurance: () => etat.endurance,
    depenser: (n) => {
      etat.endurance -= n;
    },
    info: (t) => etat.textes.push(t),
    indice: (_s, t) => etat.textes.push(t),
    envoyer: (m) => etat.recus.push(m),
    diffuser: (m) => etat.recus.push(m),
    user: () => undefined,
    apresDestruction: () => undefined,
    commencer: () => undefined,
  };
  const tir = new Tir(ctx, TABLES_TIR);
  /** Bander l'arc `ms`, puis lâcher vers le nord, sur l'Éteint n° 1. */
  const tirer = (ms = 1600) => {
    tir.bander();
    instant += ms;
    tir.lancer(0, 1, 1);
    instant += 2000;
  };
  const projectiles = () => etat.recus.filter((m) => m.t === "projectile").map((m) => (m as { projectile: ProjectileVu }).projectile);
  return { tir, etat, tirer, projectiles };
}

/** Un Éteint au nord du tireur, à `d` m ; il regarde vers lui (de face) ou lui tourne le dos. */
function eteintA(d: number, variante: "errant" | "equipe" = "errant", deDos = false): Eteint {
  const e = nouvelEteint(1, 40, 30 + d, "errant");
  if (variante === "equipe") e.variante = "equipe";
  e.o = deDos ? 0 : Math.PI;
  return e;
}

test("arc : l'arc et les flèches sont dans les tables du tir ; chaque arc a ses étoiles de base", () => {
  for (const objet of ["arc_fortune", "arc_simple", "arc_if", "arc_sportif"]) {
    const a = armeTirDe(objet);
    assert.ok(a, objet);
    assert.equal(a!.metier, true);
    assert.ok(objet in OBJETS_DE_METIER, `${objet} porte des étoiles`);
    // Bander 1,5 s, encocher 1 s (réglage du porteur, 2026-10-09) ; la corde claque à 3 m.
    assert.equal(a!.pleinMs, 1500);
    assert.equal(a!.rechargeMs, 1000);
    assert.equal(a!.bruit, 3);
  }
  assert.equal(OBJETS_DE_METIER.arc_fortune, 1);
  assert.equal(OBJETS_DE_METIER.arc_simple, 3);
  assert.equal(OBJETS_DE_METIER.arc_if, 4);
  // L'arc simple, à ★★★ : utile 12 m, max 25 m, tête 6 m (Book 25 §8.3).
  const simple = armeTirDe("arc_simple")!;
  assert.deepEqual([simple.porteeUtile, simple.porteeMax, simple.porteeTete], [12, 25, 6]);
  // Les étoiles règlent la portée de tête : ★ 4 m, ★★ 5 m, ★★★ 6 m, if ★★★★ 7 m.
  assert.ok(Math.abs(armeTirExemplaire("arc_simple#2", simple).porteeTete - 5) < 1e-9);
  assert.ok(Math.abs(armeTirExemplaire("arc_fortune", armeTirDe("arc_fortune")!).porteeTete - 4) < 1e-9);
  assert.equal(armeTirExemplaire("arc_if", armeTirDe("arc_if")!).porteeTete, 7);
  // Toutes les flèches vont à tous les arcs ; aucune arme de tir ne se glisse parmi les armes de contact.
  for (const m of MUNITIONS.filter((x) => x.objet.startsWith("fleche"))) assert.equal(m.pour.length, 4, m.objet);
  assert.equal(ARMES_TIR.filter((a) => a.objet.startsWith("arc")).length, 4);
});

test("arc : un tir plein à la tête à 6 m (★★★) détruit ; à 7 m, il touche le torse", () => {
  const e6 = eteintA(6);
  const a = tireur({ inventaire: { arc_simple: 1, fleche_os: 2 }, eteints: [e6] });
  a.tir.preparer("arc_simple");
  a.tirer();
  assert.equal(a.projectiles()[0]!.coup?.resultat, "detruit");

  const e7 = eteintA(7);
  const b = tireur({ inventaire: { arc_simple: 1, fleche_os: 2 }, eteints: [e7] });
  b.tir.preparer("arc_simple");
  b.tirer();
  const coup = b.projectiles()[0]!.coup;
  assert.equal(coup?.id, 1);
  assert.notEqual(coup?.resultat, "detruit");
  assert.notEqual(e7.etat, "detruit");
});

test("arc : un arc ★★ (corde de ficelle) ne détruit qu'à 5 m ; un tir rapide touche le torse", () => {
  const a = tireur({ inventaire: { "arc_simple#2": 1, fleche_os: 2 }, eteints: [eteintA(4.9)] });
  a.tir.preparer("arc_simple#2");
  a.tirer();
  assert.equal(a.projectiles()[0]!.coup?.resultat, "detruit");
  const b = tireur({ inventaire: { "arc_simple#2": 1, fleche_os: 2 }, eteints: [eteintA(5.6)] });
  b.tir.preparer("arc_simple#2");
  b.tirer();
  assert.notEqual(b.projectiles()[0]!.coup?.resultat, "detruit");
  // Tir rapide (relâché avant 1,5 s), à bout portant : le torse, pas la tête.
  const c = tireur({ inventaire: { arc_simple: 1, fleche_os: 2 }, eteints: [eteintA(3)] });
  c.tir.preparer("arc_simple");
  c.tirer(600);
  assert.notEqual(c.projectiles()[0]!.coup?.resultat, "detruit");
});

test("arc : la pointe durcie au feu ne tue pas à la tête, même en tir plein à 3 m", () => {
  const e = eteintA(3);
  const a = tireur({ inventaire: { arc_simple: 1, fleche_durcie: 3 }, eteints: [e] });
  a.tir.preparer("arc_simple");
  a.tirer();
  assert.equal(a.projectiles()[0]!.coup?.id, 1);
  assert.notEqual(a.projectiles()[0]!.coup?.resultat, "detruit");
});

test("arc : un Équipé de dos ne meurt pas d'une flèche ; de face, la visière s'ouvre à 3 m (la moitié de 6)", () => {
  const dos = eteintA(2, "equipe", true);
  const a = tireur({ inventaire: { arc_simple: 1, fleche_acier: 3 }, eteints: [dos] });
  a.tir.preparer("arc_simple");
  a.tirer();
  assert.notEqual(a.projectiles()[0]!.coup?.resultat, "detruit");
  const face = eteintA(2.8, "equipe");
  const b = tireur({ inventaire: { arc_simple: 1, fleche_acier: 3 }, eteints: [face] });
  b.tir.preparer("arc_simple");
  b.tirer();
  assert.equal(b.projectiles()[0]!.coup?.resultat, "detruit");
  const loin = eteintA(3.5, "equipe");
  const c = tireur({ inventaire: { arc_simple: 1, fleche_acier: 3 }, eteints: [loin] });
  c.tir.preparer("arc_simple");
  c.tirer();
  assert.notEqual(c.projectiles()[0]!.coup?.resultat, "detruit");
});

test("arc : la casse — une durcie sur deux, une d'os ou de clou sur trois, une d'acier sur cinq, jamais le carbone", () => {
  const casse = Object.fromEntries(MUNITIONS.map((m) => [m.objet, m.casse]));
  assert.equal(casse.fleche_durcie, 1 / 2);
  assert.equal(casse.fleche_os, 1 / 3);
  assert.equal(casse.fleche_clou, 1 / 3);
  assert.equal(casse.fleche_acier, 1 / 5);
  assert.equal(casse.fleche_carbone, 0);
  // Sur 300 tirs au torse (graine fixe), la part cassée suit sa probabilité.
  for (const [fleche, p] of [["fleche_durcie", 1 / 2], ["fleche_os", 1 / 3], ["fleche_acier", 1 / 5]] as const) {
    let x = 12345;
    const alea = () => {
      x = (x * 1103515245 + 12345) % 2147483648;
      return x / 2147483648;
    };
    let cassees = 0;
    const N = 300;
    for (let i = 0; i < N; i++) {
      const t = tireur({ inventaire: { arc_simple: 1, [fleche]: 1 }, eteints: [eteintA(9)], alea });
      t.tir.preparer("arc_simple");
      t.tirer();
      if (t.etat.sol.length === 0) cassees++;
    }
    assert.ok(Math.abs(cassees / N - p) < 0.08, `${fleche} : ${cassees}/${N}`);
  }
});

test("arc : la meilleure flèche part d'abord, et l'arc choisi sans flèches le dit", () => {
  const p = pretALancer({ arc_simple: 1, fleche_durcie: 3, fleche_os: 3 }, "arc_simple");
  assert.equal(p?.genre, "tir");
  assert.equal(p?.genre === "tir" ? p.munition?.objet : null, "fleche_os");
  const t = tireur({ inventaire: { arc_simple: 1 }, eteints: [eteintA(5)] });
  t.tir.preparer("arc_simple");
  t.tirer();
  assert.ok(t.etat.textes.some((x) => x.includes("flèches")));
  assert.equal(t.projectiles().length, 0);
});

// ---------- Les recettes ----------

test("arc : toutes les recettes de l'arc sont communes ; un arc monté vaut sa corde (maillon faible)", () => {
  for (const famille of ["charbonniers", "voltaiques", "mecanistes"] as const) {
    const ids = recettesConnues(famille).map((r) => r.id);
    for (const id of ["arc_fortune", "arc_fortune_branche", "ebauche_arc", "ebauche_if", "corde_arc_ficelle", "arc_simple", "arc_if", "fleches_durcies", "fleches_os", "fleches_clou", "fleches_acier"]) assert.ok(ids.includes(id), `${famille} : ${id}`);
  }
  // L'arc de fortune : ★, quoi qu'on fasse.
  assert.equal(etoilesDuProduit(recette("arc_fortune")!, { perche_frene: 1, ficelle: 1 }), 1);
  // Les cordes : ficelle ★★, corde ★★★, fil dentaire ★★★★.
  assert.equal(etoilesDuProduit(recette("corde_arc_ficelle")!, { ficelle: 3 }), 2);
  assert.equal(etoilesDuProduit(recette("corde_arc_corde")!, { corde: 1 }), 3);
  assert.equal(etoilesDuProduit(recette("corde_arc_dentaire")!, { fil_dentaire: 1 }), 4);
  // Le frêne fait ★★★ ; avec une corde de ficelle, ★★. L'if fait ★★★★ avec une corde de fil dentaire, ★★★ avec la corde.
  const frene = recette("arc_simple")!;
  assert.equal(etoilesDuProduit(frene, { ebauche_arc_seche: 1, "corde_arc#2": 1 }), 2);
  assert.equal(etoilesDuProduit(frene, { ebauche_arc_seche: 1, corde_arc: 1 }), 3);
  assert.equal(etoilesDuProduit(frene, { ebauche_arc_seche: 1, "corde_arc#4": 1 }), 3);
  const arcIf = recette("arc_if")!;
  assert.equal(etoilesDuProduit(arcIf, { ebauche_if_seche: 1, "corde_arc#4": 1 }), 4);
  assert.equal(etoilesDuProduit(arcIf, { ebauche_if_seche: 1, corde_arc: 1 }), 3);
  // La recette prend la moins bonne corde du sac : c'est elle qui compte.
  assert.equal(etoilesDuProduit(arcIf, { ebauche_if_seche: 1, "corde_arc#4": 1, "corde_arc#2": 1 }), 2);
  // La maîtrise (dix arcs de frêne) : une étoile de plus.
  assert.equal(etoilesDuProduit(frene, { ebauche_arc_seche: 1, corde_arc: 1 }, { maitrise: true }), 4);
  assert.equal(etoilesDe("arc_simple#4"), 4);
});

// ---------- Le séchage ----------

test("arc : le séchage pur — deux heures, les plus avancées d'abord ; une ébauche reprise au coffre repart de zéro", () => {
  const t0 = 1_000_000;
  let r = avancerSechage({ ebauche_arc: 1 }, {}, t0);
  assert.deepEqual(r.etat, { ebauche_arc: [t0] });
  assert.equal(r.change, true);
  r = avancerSechage({ ebauche_arc: 2 }, r.etat, t0 + 3_600_000);
  assert.deepEqual(r.etat, { ebauche_arc: [t0, t0 + 3_600_000] });
  r = avancerSechage({ ebauche_arc: 2 }, r.etat, t0 + SECHAGE_MS);
  assert.deepEqual(r.seches, { ebauche_arc_seche: 1 });
  assert.deepEqual(r.vertes, { ebauche_arc: 1 });
  assert.deepEqual(r.etat, { ebauche_arc: [t0 + 3_600_000] });
  // Une ébauche sortie du sac est oubliée.
  assert.deepEqual(avancerSechage({}, r.etat, t0 + SECHAGE_MS + 1).etat, {});
  // Ce qui vient de la base est relu prudemment.
  assert.deepEqual(sechageValide({ ebauche_if: [3, "x", 1], autre: [1] }), { ebauche_if: [1, 3] });
  assert.deepEqual(sechageValide("n'importe quoi"), {});
});

function monter(inventaire: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "voltaiques");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  const etabli = base.ajouterInstallation(compte.id, "etabli", 21.5, 20, 0);
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const ouvrir = () => {
    const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.9);
    j.position = { x: 20, z: 20, o: 0 };
    return j;
  };
  let joueur = ouvrir();
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const sac = () => (recus.findLast((m) => m.t === "inventaire") as { inventaire: Inventaire } | undefined)?.inventaire ?? {};
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const absence = (ms: number) => {
    joueur.sauvegarder();
    joueur.partir();
    instant += ms;
    recus.length = 0;
    joueur = ouvrir();
  };
  return { base, compte, etabli, joueur: () => joueur, attendre, sac, infos, absence };
}

test("arc : l'ébauche taillée à l'établi sèche en 2 h, même déconnecté", () => {
  const t = monter({ couteau: 1, perche_frene: 1 });
  t.joueur().recevoir({ t: "fabriquer", recette: "ebauche_arc" });
  t.attendre(10);
  assert.equal(t.sac().ebauche_arc, 1);
  // Une heure plus tard, rien encore.
  t.absence(3_600_000);
  t.attendre(6);
  assert.equal(t.sac().ebauche_arc_seche ?? 0, 0);
  // Deux heures après la taille (déconnecté entre-temps) : elle est sèche, et on le dit.
  t.absence(3_600_000);
  t.attendre(6);
  assert.equal(t.sac().ebauche_arc_seche, 1);
  assert.equal(t.sac().ebauche_arc ?? 0, 0);
  assert.ok(t.infos().some((x) => x.includes("séché")));
  assert.deepEqual(t.base.chargerSechage(t.compte.id), {});
});

test("arc : le redresseur de fûts se monte sur l'établi, et les flèches y vont deux fois plus vite", () => {
  const sans = monter({ couteau: 1, branche: 2, plumes: 2, ficelle: 2, os: 2, pierre: 1 });
  sans.joueur().recevoir({ t: "fabriquer", recette: "fleches_os" });
  sans.attendre(1.5);
  assert.equal(sans.sac().fleche_os ?? 0, 0, "sans redresseur, il faut 2 s");

  const avec = monter({ couteau: 1, branche: 4, plumes: 2, ficelle: 2, os: 2, pierre: 1 });
  avec.joueur().recevoir({ t: "interagir", cible: { genre: "installation", id: avec.etabli.id }, verbe: "monter_redresseur" });
  avec.attendre(20);
  const etabli = avec.joueur().bienvenue(0).installations.find((i) => i.type === "etabli");
  assert.equal(etabli?.etat.redresseur, true);
  assert.equal(avec.sac().pierre ?? 0, 0);
  avec.joueur().recevoir({ t: "fabriquer", recette: "fleches_os" });
  avec.attendre(1.5);
  assert.equal(avec.sac().fleche_os, 3);
});
