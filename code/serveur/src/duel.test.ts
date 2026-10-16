// Le duel entre joueurs, côté serveur (0.11 ; plan-duel.md §3, chantiers B et C) : deux ou trois vrais joueurs à la
// station, le registre des duels branché comme dans le monde, l'heure tenue à la main.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DELAI_MORSURE, armeEnMain } from "../../commun/src/combat.ts";
import { JAUGE_DUEL, MORSURE_DUEL, PROTECTION_DUEL_MS, partDuCoup } from "../../commun/src/duel.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Duels, TamponPositions } from "./duel.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { diffuserPresences, type MemoirePresences } from "./presences.ts";

/** Une place libre de la station, sur la route (sans mur entre les joueurs). */
const X = 40;
const Z = 34.6;

function monter(sacs: Record<string, number>[], options: { alea?: number; admin?: number } = {}) {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const halte = new Halte(base, () => 0.5);
  const comptoir = new Comptoir(base, instant);
  const joueurs = new Map<number, Joueur>();
  const duels = new Duels({
    trouver: (id) => joueurs.get(id)?.duelliste,
    tous: () => [...joueurs.values()].map((j) => j.duelliste),
    maintenant: () => instant,
    alea: () => options.alea ?? 0,
  });
  const familles: Famille[] = ["charbonniers", "mecanistes", "voltaiques"];
  const tous = sacs.map((sac, i) => {
    const compte = base.creerCompte(["Rose", "Paul", "Malo"][i]!, "potager42", familles[i]!);
    base.sauverInventaire(compte.id, sac);
    base.sauverPosition(compte.id, { x: X, z: Z, o: 0 }, "station", instant);
    if (options.admin === i) base.designerAdmin(compte.id);
    const recus: MessageServeur[] = [];
    const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.99, comptoir);
    j.duels = duels;
    joueurs.set(compte.id, j);
    const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    return { j, id: compte.id, recus, infos, dernier };
  });
  halte.eteints = [];
  // Rose à l'ouest, tournée vers l'est (o = π/2 : vers +x) ; Paul 1 m devant elle, tourné vers elle ; Malo plus loin.
  tous[0]!.j.position = { x: X, z: Z, o: Math.PI / 2 };
  if (tous[1]) tous[1].j.position = { x: X + 1, z: Z, o: -Math.PI / 2 };
  if (tous[2]) tous[2].j.position = { x: X + 1, z: Z + 0.6, o: -Math.PI / 2 };
  /** Le temps passe : le registre relève les positions à chaque tour (20 par seconde), comme dans le monde. */
  const attendre = (secondes: number, pas = 0.05) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      for (const j of joueurs.values()) j.tick(pas);
      duels.tick();
    }
  };
  /** Un coup, puis le temps de finir le geste. */
  const frapper = (qui: Joueur, appuye = false) => {
    qui.recevoir({ t: "frapper", appuye });
    attendre(1.5, 0.25);
  };
  const mode = (qui: Joueur, combat: boolean) => qui.recevoir({ t: "mode", combat });
  return { base, halte, duels, tous, attendre, frapper, mode, maintenant: () => instant };
}

/** La jauge de ce joueur (0 à 1) dans le dernier `duels` qu'il a reçu ; undefined : pas de duel. */
function jauge(t: ReturnType<typeof monter>, qui: number, vu: number): number | undefined {
  const voisins = new Map(t.tous.map((x) => [x.id, new Set(t.tous.filter((y) => y !== x).map((y) => y.id))]));
  t.duels.diffuser(voisins);
  const m = t.tous.find((x) => x.id === qui)!.dernier("duels");
  const d = m?.d.find((x) => x.a === vu || x.b === vu);
  return d ? (d.a === vu ? d.ja : d.jb) : undefined;
}

test("en vert, on ne frappe jamais un joueur ; en rouge, le premier coup lance le duel et retire déjà sa part", () => {
  const t = monter([{ machette: 1 }, { machette: 1 }]);
  const [rose, paul] = t.tous;
  t.frapper(rose!.j);
  assert.equal(t.duels.enDuel(rose!.id), false, "vert : le coup part dans le vide");
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  assert.equal(t.duels.enDuel(rose!.id), true);
  assert.ok(rose!.infos().includes("Duel avec Paul !"));
  assert.ok(paul!.infos().includes("Duel avec Rose !"));
  const part = partDuCoup(armeEnMain({ machette: 1 }, null), false);
  assert.ok(Math.abs(jauge(t, paul!.id, paul!.id)! - (JAUGE_DUEL - part) / JAUGE_DUEL) < 0.011);
  assert.equal(jauge(t, paul!.id, rose!.id), 1);
  // Pas d'étourdissement ni de recul : il tressaille, à la même place ; sa santé n'a pas bougé.
  assert.deepEqual([paul!.j.position.x, paul!.j.position.z], [X + 1, Z]);
  assert.equal(paul!.j.bienvenue(0).sante.points, 100);
});

test("D-20 : le joueur vert frappé passe en Combat (rouge chez les autres) ; le halo fait partie de l'identité vue", () => {
  const t = monter([{ machette: 1 }, {}]);
  const [rose, paul] = t.tous;
  assert.equal(paul!.j.vu.rouge, undefined);
  t.mode(rose!.j, true);
  assert.equal(rose!.j.vu.rouge, true);
  t.frapper(rose!.j);
  assert.equal(paul!.j.vu.rouge, true, "Paul est passé en Combat");
  // Il peut riposter tout de suite : il est rouge.
  const avant = jauge(t, rose!.id, rose!.id);
  t.frapper(paul!.j);
  assert.ok(jauge(t, rose!.id, rose!.id)! < avant!);
});

test("le coup reçu d'un joueur se montre par le geste « tressaille »", () => {
  const t = monter([{ machette: 1 }, {}]);
  const [rose, paul] = t.tous;
  t.mode(rose!.j, true);
  rose!.j.recevoir({ t: "frapper", appuye: false });
  assert.ok(paul!.j.gestesRecents.some((g) => g.geste === "tressaille"));
});

test("un troisième ne touche pas un duelliste : « Ils sont en duel. » ; un duelliste ne frappe que son adversaire", () => {
  const t = monter([{ machette: 1 }, { machette: 1 }, { machette: 1 }]);
  const [rose, paul, malo] = t.tous;
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  const jaugePaul = jauge(t, paul!.id, paul!.id);
  // Malo, tourné vers Paul, en rouge.
  malo!.j.position = { x: X + 1, z: Z + 1, o: Math.PI };
  t.mode(malo!.j, true);
  t.frapper(malo!.j);
  assert.ok(malo!.infos().includes("Ils sont en duel."));
  assert.equal(t.duels.enDuel(malo!.id), false);
  assert.equal(jauge(t, paul!.id, paul!.id), jaugePaul);
});

test("l'esquive protège d'un coup ; l'endurance se dépense comme d'habitude", () => {
  const t = monter([{ machette: 1 }, {}]);
  const [rose, paul] = t.tous;
  t.mode(rose!.j, true);
  paul!.j.recevoir({ t: "esquiver", dx: 0, dz: 1 });
  const endurance = rose!.j.bienvenue(0).endurance;
  rose!.j.recevoir({ t: "frapper", appuye: false });
  assert.equal(t.duels.enDuel(rose!.id), false, "esquivé : pas de duel");
  assert.ok(rose!.j.bienvenue(0).endurance < endurance);
});

test("pendant un duel, la morsure va à la jauge (ni santé ni blessure) ; la saisie à trois la vide, sans effondrement", () => {
  const t = monter([{ machette: 1 }, { conserve: 2 }]);
  const [rose, paul] = t.tous;
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  const avant = jauge(t, paul!.id, paul!.id)!;
  const e = nouvelEteint(50, X + 1.5, Z, "poursuivant");
  e.saisit = paul!.id;
  e.tenue = DELAI_MORSURE;
  t.halte.eteints = [e];
  t.attendre(0.05);
  assert.ok(Math.abs(jauge(t, paul!.id, paul!.id)! - (avant - MORSURE_DUEL / JAUGE_DUEL)) < 0.011);
  const sante = paul!.j.bienvenue(0).sante;
  assert.equal(sante.points, 100);
  assert.deepEqual(sante.blessures, []);
  // Trois le tiennent : la jauge se vide, Paul perd (D-3), il reste dans la halte, ils lâchent.
  t.halte.eteints = [50, 51, 52].map((id, i) => Object.assign(nouvelEteint(id, X + 1.5, Z + i * 0.3 - 0.3, "poursuivant"), { saisit: paul!.id }));
  t.attendre(0.05);
  assert.equal(t.duels.enDuel(paul!.id), false);
  assert.equal(paul!.j.lieu, "station", "pas d'effondrement");
  assert.ok(t.halte.eteints.every((x) => x.saisit !== paul!.id));
  assert.ok(rose!.infos().includes("Duel gagné : tu prends sa conserve."));
  assert.ok(paul!.infos().includes("Duel perdu : Rose prend ta conserve."));
});

test("D-2 : l'Éteint qui vide la jauge fait perdre le duel, comme un coup de l'autre", () => {
  const t = monter([{ machette: 1 }, { marteau: 1 }]);
  const [rose, paul] = t.tous;
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  // Six morsures (18 points chacune) suffisent largement.
  for (let i = 0; i < 6 && t.duels.enDuel(paul!.id); i++) {
    const e = Object.assign(nouvelEteint(60 + i, X + 1.5, Z, "poursuivant"), { saisit: paul!.id, tenue: DELAI_MORSURE });
    t.halte.eteints = [e];
    t.attendre(0.05);
  }
  assert.equal(t.duels.enDuel(paul!.id), false);
  assert.ok(rose!.infos().includes("Duel gagné : tu prends son marteau."));
  assert.equal(rose!.dernier("inventaire")!.inventaire.marteau, 1);
});

test("pendant le duel, les coups d'un duelliste ne font rien aux Éteints", () => {
  const t = monter([{ machette: 1 }, {}]);
  const [rose, paul] = t.tous;
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  // Paul s'écarte ; un Éteint se met juste devant Rose.
  paul!.j.position = { x: X + 5, z: Z, o: 0 };
  const e = nouvelEteint(70, X + 0.9, Z, "poursuivant");
  t.halte.eteints = [e];
  t.frapper(rose!.j);
  assert.equal(e.degats, 0);
  assert.equal(e.etat, "poursuivant");
});

/** Battre Paul à coups de machette (le temps de chaque geste, assez près). */
function gagner(t: ReturnType<typeof monter>, frappeur: Joueur, perdant: number): void {
  t.mode(frappeur, true);
  for (let i = 0; i < 80 && (i === 0 || t.duels.enDuel(perdant)); i++) t.frapper(frappeur);
  assert.equal(t.duels.enDuel(perdant), false);
}

test("la fin : un objet tiré au hasard (jamais un objet exclu), avec sa charge ; le perdant protégé 45 s mais peut attaquer", () => {
  // Le tirage tombe sur la batterie de voiture ; le reste est exclu (sac, objet-clé, clef, pièce de famille).
  const t = monter([{ sac_a_dos: 1, machette: 1 }, { sac_a_dos: 1, batterie_voiture: 1, seau_10l: 1, cle_coffre: 1, enclume_depanneur: 1 }], { alea: 0.5 });
  const [rose, paul] = t.tous;
  const chargePaul = paul!.dernier("charges")?.charges.batterie_voiture ?? paul!.j.bienvenue(0).charges.batterie_voiture;
  gagner(t, rose!.j, paul!.id);
  assert.equal(rose!.dernier("inventaire")!.inventaire.batterie_voiture, 1);
  assert.equal(paul!.dernier("inventaire")!.inventaire.batterie_voiture, undefined);
  assert.equal(rose!.j.bienvenue(0).charges.batterie_voiture, chargePaul);
  for (const k of ["sac_a_dos", "seau_10l", "cle_coffre", "enclume_depanneur"] as const) assert.equal(paul!.dernier("inventaire")!.inventaire[k], 1, k);
  // Protégé 45 s : son anneau est blanc (vu de tous) ; on ne peut pas le provoquer…
  const protege = paul!.j.vu.protegeJusqua!;
  assert.ok(protege > t.maintenant() && protege <= t.maintenant() + PROTECTION_DUEL_MS);
  t.frapper(rose!.j);
  assert.ok(rose!.infos().includes("Il vient de perdre : laisse-le."));
  assert.equal(t.duels.enDuel(paul!.id), false);
  // … mais lui peut lancer un duel, pour reprendre son butin ; il garde l'anneau blanc jusqu'au bout.
  t.mode(paul!.j, true);
  t.frapper(paul!.j);
  assert.equal(t.duels.enDuel(paul!.id), true);
  assert.equal(paul!.j.vu.protegeJusqua, protege);
  // Au bout des 45 s, plus de protection.
  t.attendre(PROTECTION_DUEL_MS / 1000, 0.5);
  assert.equal(paul!.j.vu.protegeJusqua, undefined);
});

test("le témoin reçoit les jauges, puis « duel_fin » avec l'objet ; « sac vide » quand le perdant n'a rien", () => {
  const t = monter([{ machette: 1 }, { sac_a_dos: 1 }, {}]);
  const [rose, paul, malo] = t.tous;
  malo!.j.position = { x: X + 10, z: Z, o: 0 };
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  assert.ok(jauge(t, malo!.id, paul!.id)! < 1, "Malo, témoin, voit la jauge de Paul");
  gagner(t, rose!.j, paul!.id);
  const fin = malo!.dernier("duel_fin")!;
  assert.deepEqual(fin, { t: "duel_fin", a: rose!.id, b: paul!.id, issue: "gagne", gagnant: rose!.id, sacVide: true });
  assert.ok(rose!.infos().includes("Duel gagné, mais son sac est vide."));
  assert.ok(paul!.infos().includes("Duel perdu. Ton sac était vide."));
  // La liste suivante efface le duel.
  jauge(t, malo!.id, paul!.id);
  assert.deepEqual(malo!.dernier("duels")!.d, []);
});

test("sac du gagnant trop lourd : l'objet tombe à ses pieds, en tas ramassable", () => {
  const t = monter([{ machette: 1, buche: 40 }, { sac_a_dos: 1, masse: 1 }]);
  const [rose, paul] = t.tous;
  gagner(t, rose!.j, paul!.id);
  assert.ok(rose!.infos().includes("Duel gagné : sa masse est à tes pieds."));
  assert.equal(rose!.dernier("inventaire")!.inventaire.masse, undefined);
  const tas = t.halte.sacs.find((s) => s.contenu.jete && s.contenu.inventaire.masse === 1);
  assert.ok(tas, "un tas avec la masse");
  assert.ok(Math.hypot(tas!.x - rose!.j.position.x, tas!.z - rose!.j.position.z) < 0.01, "à ses pieds");
  assert.equal(paul!.dernier("duel_fin")?.auSol, true);
});

test("fuir : à plus de 25 m pendant 10 s, le duel est annulé, sans objet ; partir de la halte est refusé", () => {
  const t = monter([{ machette: 1 }, { conserve: 1 }]);
  const [rose, paul] = t.tous;
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  paul!.j.recevoir({ t: "voyager", vers: "terrain" });
  assert.ok(paul!.infos().includes("Pas pendant un duel."));
  assert.equal(paul!.j.enVoyage, false);
  paul!.j.position = { x: X + 30, z: Z, o: 0 };
  t.attendre(5);
  assert.equal(t.duels.enDuel(paul!.id), true);
  t.attendre(5.1);
  assert.equal(t.duels.enDuel(paul!.id), false);
  assert.ok(rose!.infos().includes("Trop loin : duel annulé."));
  assert.deepEqual(paul!.dernier("duel_fin"), { t: "duel_fin", a: rose!.id, b: paul!.id, issue: "annule" });
  assert.equal(paul!.dernier("inventaire")?.inventaire.conserve ?? 1, 1);
  // Revenir près d'elle avant les 10 s remet le compte à zéro.
  paul!.j.position = { x: X + 1, z: Z, o: -Math.PI / 2 };
  // (Le temps que l'écran de Rose le montre revenu : le coup est jugé 150 ms plus tôt.)
  t.attendre(0.3);
  t.frapper(rose!.j);
  assert.equal(t.duels.enDuel(paul!.id), true);
  paul!.j.position = { x: X + 30, z: Z, o: 0 };
  t.attendre(6);
  paul!.j.position = { x: X + 2, z: Z, o: 0 };
  t.attendre(6);
  assert.equal(t.duels.enDuel(paul!.id), true);
});

test("se déconnecter en duel, c'est perdre tout de suite (`abandonner`, appelé par le monde)", () => {
  const t = monter([{ machette: 1 }, { conserve: 1 }]);
  const [rose, paul] = t.tous;
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  t.duels.abandonner(paul!.id);
  assert.equal(t.duels.enDuel(rose!.id), false);
  assert.ok(rose!.infos().includes("Duel gagné : tu prends sa conserve."));
});

test("D-9 : on ne provoque pas god (« On ne se bat pas avec Dieu. ») ; il ne provoque pas non plus", () => {
  const t = monter([{ machette: 1 }, { machette: 1 }], { admin: 1 });
  const [rose, paul] = t.tous;
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  assert.ok(rose!.infos().includes("On ne se bat pas avec Dieu."));
  assert.equal(t.duels.enDuel(rose!.id), false);
  t.mode(paul!.j, true);
  t.frapper(paul!.j);
  assert.equal(t.duels.enDuel(paul!.id), false);
});

test("un tir ne lance pas de duel ; pendant un duel, le tireur ne voit plus les Éteints", () => {
  const t = monter([{ machette: 1 }, {}]);
  const [rose] = t.tous;
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  assert.equal(t.duels.enDuel(rose!.id), true);
  // Le contexte du tir ne lui donne plus d'Éteints à toucher.
  t.halte.eteints = [nouvelEteint(80, X - 3, Z, "poursuivant")];
  const ctx = (rose!.j as unknown as { contexteTir(): { eteints(): unknown[] } }).contexteTir();
  assert.deepEqual(ctx.eteints(), []);
});

test("une action de travail s'arrête au premier coup", () => {
  const t = monter([{ machette: 1 }, {}]);
  const [rose, paul] = t.tous;
  (paul!.j as unknown as { commencer(l: string, d: number, f: () => void): void }).commencer("Fouiller", 10, () => {});
  assert.equal(paul!.dernier("action")?.etat, "debut");
  t.mode(rose!.j, true);
  rose!.j.recevoir({ t: "frapper", appuye: false });
  assert.equal(paul!.dernier("action")?.etat, "annulee");
});

test("aucun duel hors des haltes : au Comptoir, le coup ne vise personne", () => {
  const t = monter([{ machette: 1 }, {}]);
  const [rose, paul] = t.tous;
  for (const x of [rose!, paul!]) x.j.lieu = "comptoir";
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  assert.equal(t.duels.enDuel(rose!.id), false);
});

test("chantier C : la cible qui court est jugée là où elle était 150 ms (plus un demi-ping) plus tôt, jamais plus de 300 ms", () => {
  const tampon = new TamponPositions();
  for (let h = 0; h <= 1000; h += 50) tampon.ajouter(h, h / 100, 0);
  assert.deepEqual(tampon.positionA(850), { x: 8.5, z: 0 });
  assert.deepEqual(tampon.positionA(875), { x: 8.75, z: 0 });
  // Plus vieux que le tampon : le plus ancien relevé ; plus récent : le dernier.
  tampon.ajouter(2000, 20, 0);
  assert.deepEqual(tampon.positionA(5000), { x: 20, z: 0 });

  const t = monter([{ machette: 1 }, {}]);
  const [rose, paul] = t.tous;
  t.mode(rose!.j, true);
  // Paul court vers l'est, de 2,6 m à 4,4 m de Rose (6 m/s) : à la fin, il est hors de portée (machette : 1,6 m).
  paul!.j.position = { x: X + 0.8, z: Z, o: 0 };
  for (let i = 0; i < 6; i++) {
    paul!.j.position = { ...paul!.j.position, x: paul!.j.position.x + 0.3 };
    t.attendre(0.05);
  }
  assert.ok(paul!.j.position.x - X > 2.5);
  // Sans ping : 150 ms plus tôt, il était à 1,7 m, à portée de machette (1,6 m, plus la marge de 0,35 m).
  rose!.j.recevoir({ t: "frapper", appuye: false });
  assert.equal(t.duels.enDuel(rose!.id), true, "touché là où il était 150 ms plus tôt");

  // Avec un ping énorme, le rembobinage plafonne à 300 ms : la cible d'il y a 600 ms ne compte pas.
  const u = monter([{ machette: 1 }, {}]);
  const [r2, p2] = u.tous;
  u.mode(r2!.j, true);
  u.duels.noterPing(r2!.id, 2000);
  p2!.j.position = { x: X + 1, z: Z, o: 0 };
  u.attendre(0.3);
  // Il part d'un coup très loin, et y reste plus de 300 ms.
  p2!.j.position = { x: X + 6, z: Z, o: 0 };
  u.attendre(0.35);
  r2!.j.recevoir({ t: "frapper", appuye: false });
  assert.equal(u.duels.enDuel(r2!.id), false, "300 ms au plus : il était déjà loin");
});

test("la diffusion : les jauges partent aux mêmes observateurs que les présences, et seulement quand elles changent", () => {
  const t = monter([{ machette: 1 }, {}, {}]);
  const [rose, paul, malo] = t.tous;
  // Malo très loin : il ne voit ni l'un ni l'autre.
  malo!.j.position = { x: X + 100, z: Z, o: 0 };
  t.mode(rose!.j, true);
  t.frapper(rose!.j);
  const memoire: MemoirePresences = new Map();
  const obs = () => t.tous.map((x) => ({ id: x.id, lieu: "station", vu: x.j.vu, envoyer: (m: MessageServeur) => x.recus.push(m) }));
  const voisins = diffuserPresences(obs(), memoire, undefined, t.maintenant());
  t.duels.diffuser(voisins);
  assert.equal(rose!.dernier("duels")!.d.length, 1);
  assert.equal(paul!.dernier("duels")!.d.length, 1);
  assert.equal(malo!.dernier("duels"), undefined);
  const n = rose!.recus.length;
  t.duels.diffuser(voisins);
  assert.equal(rose!.recus.length, n, "rien n'a changé : rien ne part");
  // `rouge` entre dans l'identité : il ne repart que quand il change.
  const autres = () => malo!.recus.filter((m) => m.t === "autres").length;
  malo!.j.position = { x: X + 3, z: Z, o: 0 };
  diffuserPresences(obs(), memoire, undefined, t.maintenant());
  const n1 = autres();
  diffuserPresences(obs(), memoire, undefined, t.maintenant());
  assert.equal(autres(), n1, "rien n'a changé");
  t.mode(rose!.j, false);
  diffuserPresences(obs(), memoire, undefined, t.maintenant());
  assert.equal(autres(), n1 + 1, "Rose repasse au vert : son identité repart");
  const vue = malo!.recus.findLast((m) => m.t === "autres") as Extract<MessageServeur, { t: "autres" }>;
  assert.equal(vue.joueurs.find((o) => o.id === rose!.id)!.rouge, undefined);
  assert.equal(vue.joueurs.find((o) => o.id === paul!.id)!.rouge, true);
});
