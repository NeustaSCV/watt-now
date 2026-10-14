// Plan 0.10, chantier K : le phare du cap, « le feu et le cargo » (S-12 à S-18). La lanterne ne s'allume que la nuit ;
// sans elle, pas de cargo ; deux minutes après l'allumage, l'épave est là, une fois par retour du phare (24 h) ; la corne
// de brume détourne un Errant ; on ne remonte pas la rampe du canot ; les objets-clés sont dans l'épave ; un phare gardé
// avant le chantier se relit.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { avancer, type Position } from "../../commun/src/deplacement.ts";
import { penser, type Eteint } from "../../commun/src/eteints.ts";
import { heurte, sortiesDe, entreesDe } from "../../commun/src/lieux.ts";
import type { Cible, MessageServeur } from "../../commun/src/messages.ts";
import {
  CARGO_MS,
  ENDROITS_PHARE,
  TEXTES_PHARE,
  auModele,
  dansLaCoque,
  etatPhareNeuf,
  lireEtatPhare,
  nuitDe,
  zonePhare,
  type ElementPhare,
} from "../../commun/src/phare.ts";
import { PIECES_MODELE } from "../../commun/src/phare-modele.ts";
import { PLACES_ETEINTS_PHARE, butinPhare, eteintsPhare } from "../../commun/src/phare-vivant.ts";
import { OBJETS_DE_L_EPAVE, REPOUSSE_PHARE, USAGES_PHARE } from "../../commun/src/ressources-phare.ts";
import { REINITIALISATION_LIEU_MS, ficheLieu } from "../../commun/src/registre-lieux.ts";
import { MS_PAR_HEURE_JEU, estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import { USAGES } from "../../commun/src/terrain.ts";
import { Base } from "./base.ts";
import { rendreSilencieux } from "./journal.ts";
import type { ContexteLieu, Voyageur } from "./lieu-vivant.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { LieuPhare, Phares } from "./phare.ts";

rendreSilencieux(true);

const COMPTE = 7;

/** Un phare en mémoire, son horloge, un joueur posé dedans (sa position, ce qu'il reçoit), et ses gestes. */
function phare() {
  const base = new Base(":memory:");
  const debut = base.debutMonde();
  // Le matin du premier jour (8 h) : on prépare.
  let instant = debut + 2 * MS_PAR_HEURE_JEU;
  const phares = new Phares(base, () => 0.5, () => instant);
  let lieu = phares.de(COMPTE);
  const recus: MessageServeur[] = [];
  let position: Position = { ...entreesDe("phare")[0]!.arrivee };
  const voyageur: Voyageur = {
    envoyer: (m) => recus.push(m),
    stimuli: () => [],
    humain: () => ({ id: COMPTE, x: position.x, z: position.z, discret: false, eclaire: false }),
  };
  const ctx: ContexteLieu = {
    id: COMPTE,
    maintenant: () => instant,
    position: () => position,
    deplacer: (p) => (position = p),
    info: (texte) => recus.push({ t: "info", texte }),
    envoyer: (m) => recus.push(m),
    inventaire: () => ({}),
    ajouter: () => {},
    retirer: () => true,
    donner: () => {},
    // Un geste qui dure va au bout tout de suite (on ne teste pas ici l'attente).
    commencer: (_libelle, _duree, appliquer) => appliquer(),
    annuler: () => {},
  };
  lieu.entrer(voyageur);
  const aller = (o: { x: number; z: number }) => (position = { x: o.x, z: o.z, o: 0 });
  const faire = (id: ElementPhare, verbe: string) => lieu.geste(ctx, { genre: "phare", id } as Cible, verbe);
  const passer = (ms: number, pas = 500) => {
    for (let t = 0; t < ms; t += pas) {
      instant += pas;
      phares.tick(instant, pas / 1000);
    }
  };
  /** Jusqu'à la tombée de la nuit (22 h). */
  const nuit = () => {
    const viser = debut + 16 * MS_PAR_HEURE_JEU;
    while (instant < viser) passer(5000, 5000);
  };
  /** Tout ce qu'il faut pour allumer : l'escabeau sous l'escalier, le pétrole versé, le prisme remis. */
  const preparer = () => {
    aller(ENDROITS_PHARE.hangar);
    faire("escabeau", "porter");
    aller(ENDROITS_PHARE.marque);
    faire("escabeau", "poser");
    aller(ENDROITS_PHARE.cuve);
    faire("cuve", "remplir");
    aller(ENDROITS_PHARE.prisme);
    faire("prisme", "ramasser");
    aller(ENDROITS_PHARE.marque);
    faire("escalier", "remplir");
    faire("escalier", "remettre");
  };
  return {
    base,
    phares,
    get lieu() {
      return lieu;
    },
    recharger: () => {
      lieu.sortir(voyageur);
      lieu = phares.de(COMPTE);
      lieu.entrer(voyageur);
    },
    recus,
    ctx,
    voyageur,
    aller,
    faire,
    passer,
    nuit,
    preparer,
    instant: () => instant,
    avancerHorloge: (ms: number) => (instant += ms),
    debut,
    position: () => position,
    infos: () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte),
  };
}

test("les données tirées du modèle sont à jour (scripts/extraire-phare.mjs)", async () => {
  // @ts-ignore — le script est en JavaScript.
  const { extraire, ecrire } = (await import("../../scripts/extraire-phare.mjs")) as { extraire(): Promise<unknown>; ecrire(d: unknown): string };
  const attendu = ecrire(await extraire());
  assert.equal(readFileSync(new URL("../../commun/src/phare-modele.ts", import.meta.url), "utf8"), attendu, "relancer node scripts/extraire-phare.mjs");
});

test("le phare est au registre : un lieu à soi, ses obstacles, sa vue par pièce, ses Éteints, sa fabrique", () => {
  const f = ficheLieu("phare");
  assert.equal(f.nature, "personnel");
  assert.ok(f.plan, "la vue par pièce");
  assert.ok(f.portes, "l'épave est un état, comme une porte");
  assert.ok(f.sombre!(ENDROITS_PHARE.marque.x, ENDROITS_PHARE.marque.z), "le pied de la tour est sombre");
  assert.ok(zonePhare({ epave: false }).obstacles.length > 300);
  // 14 Éteints (la fiche) : 9 dormeurs le long du chemin des douaniers, 3 Noyés au bord de l'eau.
  const eteints = eteintsPhare();
  assert.equal(eteints.length, 14);
  assert.equal(eteints.filter((e) => e.etat === "dormant").length, 9);
  assert.equal(eteints.filter((e) => e.variante === "noye").length, 3);
  assert.equal(PLACES_ETEINTS_PHARE.filter((p) => p.variante === "rampant").length, 1);
  // Aucun n'est dans un obstacle.
  for (const e of eteints) assert.ok(!heurte(zonePhare({ epave: false }), e.x, e.z, 0.3), `Éteint ${e.id}`);
  const base = new Base(":memory:");
  assert.ok(new LieuxVivants(base).vivant("phare", 3) instanceof LieuPhare);
});

test("on porte l'escabeau du hangar à la marque : les bras pris, on ne court pas ; frapper le pose", () => {
  const p = phare();
  assert.equal(p.lieu.dansLesBras(COMPTE), null);
  p.aller(ENDROITS_PHARE.marque);
  p.faire("escabeau", "porter");
  assert.equal(p.lieu.dansLesBras(COMPTE), null, "trop loin du hangar");
  p.aller(ENDROITS_PHARE.hangar);
  p.faire("escabeau", "porter");
  assert.ok(p.lieu.dansLesBras(COMPTE));
  // Les bras pris : ni prisme, ni cuve.
  p.aller(ENDROITS_PHARE.prisme);
  p.faire("prisme", "ramasser");
  assert.equal(p.lieu.etat.prisme, "tombe");
  assert.ok(p.infos().at(-1)!.includes("bras pris"));
  // Le poser : il reste là où l'on est.
  assert.ok(p.lieu.poser(p.ctx));
  assert.equal(p.lieu.dansLesBras(COMPTE), null);
  assert.equal(typeof p.lieu.etat.escabeau, "object");
  // On le reprend, on le pose à la marque : on peut monter.
  p.faire("escabeau", "porter");
  p.aller(ENDROITS_PHARE.marque);
  p.faire("escabeau", "poser");
  assert.equal(p.lieu.etat.escabeau, "marque");
  // Parti l'escabeau dans les bras : il reste là où on l'a quitté.
  p.faire("escabeau", "porter");
  p.lieu.sortir(p.voyageur);
  const pose = p.lieu.etat.escabeau as unknown as { x: number; z: number };
  assert.ok(Math.hypot(pose.x - ENDROITS_PHARE.marque.x, pose.z - ENDROITS_PHARE.marque.z) < 0.01);
});

test("la lanterne ne s'allume pas de jour : un message fermé par un bouton ; la nuit, elle s'allume", () => {
  const p = phare();
  // Sans escabeau, on ne monte pas ; sans pétrole ni prisme, on n'allume pas.
  p.aller(ENDROITS_PHARE.marque);
  p.faire("escalier", "allumer");
  assert.equal(p.lieu.etat.allumeLe, null);
  p.preparer();
  assert.deepEqual([p.lieu.etat.bidon, p.lieu.etat.prisme, p.lieu.etat.escabeau], ["verse", "remis", "marque"]);
  assert.ok(!estNuit(heureDeJeu(p.instant(), p.debut)));
  p.faire("escalier", "allumer");
  assert.equal(p.lieu.etat.allumeLe, null, "de jour, on prépare");
  const avertissement = p.recus.findLast((m) => m.t === "phare") as Extract<MessageServeur, { t: "phare" }>;
  assert.equal(avertissement.avertissement, TEXTES_PHARE.jour);
  assert.equal(TEXTES_PHARE.jour, "Le feu ne sert qu'à la nuit tombée.");
  p.nuit();
  p.faire("escalier", "allumer");
  assert.equal(p.lieu.etat.allumeLe, p.instant());
  assert.ok((p.recus.findLast((m) => m.t === "phare") as Extract<MessageServeur, { t: "phare" }>).etat.lanterne);
});

test("sans lanterne allumée, pas de cargo ; deux minutes après l'allumage, l'épave est là", () => {
  const p = phare();
  p.preparer();
  p.nuit();
  p.passer(10 * 60_000, 5000);
  assert.equal(p.lieu.portes.epave, false, "rien n'arrive sans le feu");
  // La nuit dure 8,5 min : on attend la suivante.
  while (!estNuit(heureDeJeu(p.instant(), p.debut))) p.passer(30_000, 5000);
  p.aller(ENDROITS_PHARE.marque);
  p.faire("escalier", "allumer");
  const allume = p.instant();
  assert.ok(allume > 0 && p.lieu.etat.allumeLe === allume);
  p.passer(CARGO_MS - 1000);
  assert.equal(p.lieu.portes.epave, false, "pas encore");
  p.recus.length = 0;
  p.passer(1500);
  assert.equal(p.lieu.portes.epave, true, "le cargo s'est échoué");
  const cargo = p.recus.find((m) => m.t === "phare" && m.cargo) as Extract<MessageServeur, { t: "phare" }> | undefined;
  assert.ok(cargo, "le client joue la scène");
  assert.ok(p.recus.some((m) => m.t === "portes" && m.portes.epave === true));
  // La zone a changé : la coque et les conteneurs arrêtent, le bord de l'eau ne passe plus sous le pont.
  assert.notEqual(p.lieu.zone, zonePhare({ epave: false }));
  assert.equal(p.lieu.zone, zonePhare({ epave: true }));
});

test("allumé puis parti : celui qui revient trouve l'épave échouée, sans la scène", () => {
  const p = phare();
  p.preparer();
  p.nuit();
  p.faire("escalier", "allumer");
  p.lieu.sortir(p.voyageur);
  // Le lieu se sauve au tic suivant ; vide depuis 5 minutes, il quitte la mémoire.
  p.passer(1000);
  p.phares.oublier(COMPTE);
  p.avancerHorloge(CARGO_MS + 60_000);
  p.recus.length = 0;
  p.recharger();
  assert.equal(p.lieu.portes.epave, true);
  assert.ok(!p.recus.some((m) => m.t === "phare" && m.cargo));
});

test("l'épave s'ouvre une fois par 24 h : relancer le feu ne fait pas venir un autre cargo ; tout revient au bout de 24 h", () => {
  const p = phare();
  p.preparer();
  p.nuit();
  p.faire("escalier", "allumer");
  p.passer(CARGO_MS + 1000);
  assert.equal(p.lieu.portes.epave, true);
  p.faire("escalier", "allumer");
  assert.ok(p.infos().at(-1) === TEXTES_PHARE.dejaAllume);
  // Encore là le lendemain (S-18), même déchargé et rechargé.
  p.lieu.sortir(p.voyageur);
  p.passer(1000);
  p.phares.oublier(COMPTE);
  p.avancerHorloge(REINITIALISATION_LIEU_MS / 2);
  p.recharger();
  assert.equal(p.lieu.portes.epave, true);
  // Au bout de 24 h, à l'entrée : la crique est vide, l'escabeau au hangar, la lanterne éteinte, le prisme tombé.
  p.lieu.sortir(p.voyageur);
  p.avancerHorloge(REINITIALISATION_LIEU_MS);
  p.recharger();
  assert.equal(p.lieu.portes.epave, false);
  assert.deepEqual(p.lieu.etat, etatPhareNeuf());
  // Un nouvel allumage, la nuit suivante, ramène un cargo.
  p.preparer();
  while (!estNuit(heureDeJeu(p.instant(), p.debut))) p.passer(30_000, 5000);
  p.aller(ENDROITS_PHARE.marque);
  p.faire("escalier", "allumer");
  p.passer(CARGO_MS + 1000);
  assert.equal(p.lieu.portes.epave, true);
});

test("la lanterne réveille les dormeurs du chemin des douaniers, et les fait monter vers la tour", () => {
  const p = phare();
  p.preparer();
  p.nuit();
  p.aller(ENDROITS_PHARE.marque);
  const dormeurs = () => p.lieu.eteints.filter((e) => e.dormeur);
  assert.ok(dormeurs().every((e) => e.etat === "dormant"));
  // Sans lumière, ils dorment.
  p.passer(10_000, 100);
  assert.ok(dormeurs().every((e) => e.etat === "dormant"));
  p.faire("escalier", "allumer");
  p.passer(15_000, 100);
  const debout = dormeurs().filter((e) => e.etat !== "dormant");
  assert.ok(debout.length >= 8, `${debout.length} dormeurs debout`);
});

test("la corne de brume détourne un Errant vers la falaise, une fois par nuit ; il faut d'abord réparer le compresseur", () => {
  const p = phare();
  p.preparer();
  p.nuit();
  p.faire("escalier", "allumer");
  // Un seul Errant, entre le chemin et la tour : la lumière l'attire.
  const e = p.lieu.eteints.find((x) => x.dormeur)!;
  p.lieu.eteints = [e];
  e.etat = "errant";
  e.x = ENDROITS_PHARE.lumiere.x + 6;
  e.z = ENDROITS_PHARE.lumiere.z + 6;
  // Le joueur loin, derrière les murs (il ne le voit pas) : dans la salle des machines.
  p.aller({ x: 39.9, z: 18 });
  p.passer(3000, 100);
  assert.ok(e.but && Math.hypot(e.but.x - ENDROITS_PHARE.lumiere.x, e.but.z - ENDROITS_PHARE.lumiere.z) < 1, "attiré par la lanterne");
  // Le compresseur n'est pas réparé : la corne ne sonne pas.
  p.aller(ENDROITS_PHARE.compresseur);
  p.faire("corne", "sonner_corne");
  assert.ok(p.infos().at(-1)!.includes("courroie"));
  const compresseur = [...p.lieu.ressources.values()].find((r) => r.type === "phare_compresseur")!;
  assert.deepEqual(USAGES.phare_compresseur.qualites, { serrer: 1 }, "Serrer 1, sans pièce");
  assert.equal(USAGES.phare_compresseur.duree, 10);
  p.lieu.prendrePar(compresseur, COMPTE, p.instant());
  assert.ok(p.lieu.etat.compresseur);
  p.recus.length = 0;
  p.faire("corne", "sonner_corne");
  assert.ok(p.recus.some((m) => m.t === "phare" && m.corne));
  p.aller({ x: 39.9, z: 18 });
  p.passer(2000, 100);
  assert.ok(e.but && Math.hypot(e.but.x - ENDROITS_PHARE.pavillons.x, e.but.z - ENDROITS_PHARE.pavillons.z) < 1, "la corne l'emporte sur la lumière");
  // Une fois par nuit.
  p.aller(ENDROITS_PHARE.compresseur);
  p.faire("corne", "sonner_corne");
  assert.equal(p.infos().at(-1), TEXTES_PHARE.corneSonnee);
  assert.equal(nuitDe(p.instant(), p.debut), p.lieu.etat.corneNuit);
});

test("on ne remonte pas la rampe du canot : on saute le tronçon effondré, et l'on ressort par la grève", () => {
  const zone = zonePhare({ epave: false });
  // Du hangar, on descend la partie haute jusqu'au tronçon effondré ; on n'y passe pas à pied.
  let pos: Position = { x: ENDROITS_PHARE.sautDe.x, z: ENDROITS_PHARE.hangar.z + 2, o: 0 };
  for (let i = 0; i < 200; i++) pos = avancer(pos, { dx: 0, dz: 1, allure: "marche" }, 0.05, zone);
  assert.ok(pos.z < ENDROITS_PHARE.sautVers.z - 1, "le trou arrête");
  assert.ok(Math.hypot(pos.x - ENDROITS_PHARE.sautDe.x, pos.z - ENDROITS_PHARE.sautDe.z) < 1.6, "au bord du trou, on peut sauter");
  // D'en bas, on ne remonte pas.
  let bas: Position = { ...ENDROITS_PHARE.sautVers, o: 0 };
  for (let i = 0; i < 200; i++) bas = avancer(bas, { dx: 0, dz: -1, allure: "course" }, 0.05, zone);
  assert.ok(bas.z > ENDROITS_PHARE.sautDe.z + 0.5, "on ne remonte pas la rampe");
  // Le saut, au serveur.
  const p = phare();
  p.aller({ x: pos.x, z: pos.z });
  p.faire("rampe", "sauter");
  assert.deepEqual([p.position().x, p.position().z], [ENDROITS_PHARE.sautVers.x, ENDROITS_PHARE.sautVers.z]);
  // On ressort par la grève, à l'ouest : une sortie sans arrivée ; on arrive toujours par la route, au nord.
  const greve = sortiesDe("phare").find((s) => s.sansArrivee)!;
  assert.ok(greve);
  assert.ok(!entreesDe("phare").includes(greve));
  assert.equal(entreesDe("phare").length, 1);
});

test("les objets-clés sont dans l'épave : on ne les prend qu'échouée ; le harpon est dans la cuisine du gardien", () => {
  const butin = butinPhare();
  const types = new Set(butin.map((r) => r.type));
  for (const t of OBJETS_DE_L_EPAVE) assert.ok(types.has(t), t);
  const donne = OBJETS_DE_L_EPAVE.map((t) => Object.keys(USAGES_PHARE[t].donne)[0]);
  assert.deepEqual(donne.sort(), ["cloche_bronze", "jerrican_20l", "porte_four", "rabot", "soufflet_forge"]);
  // Chacun revient à son délai (S-03) : 4 jours, le jerrican 24 h.
  assert.equal(REPOUSSE_PHARE.phare_jerrican, 24 * 3_600_000);
  for (const t of ["phare_cloche", "phare_porte_four", "phare_soufflet", "phare_rabot"] as const) assert.equal(REPOUSSE_PHARE[t], 4 * 24 * 3_600_000);
  // À leur place : dans un conteneur de la grève, ou sur le pont du cargo.
  const conteneurs = Object.values(PIECES_MODELE).filter((pc) => pc.apresEpave).flatMap((pc) => pc.boites);
  for (const r of butin.filter((x) => OBJETS_DE_L_EPAVE.includes(x.type as never))) {
    const m = auModele(r.x, r.z);
    const dedans = conteneurs.some((b) => Math.abs(m.x - b.x) <= b.l / 2 + 0.3 && Math.abs(m.z - b.z) <= b.p / 2 + 0.3) || dansLaCoque(m.x, m.z);
    assert.ok(dedans, r.type);
  }
  // Le harpon : la cuisine du gardien, une fois par personnage.
  const harpon = butin.find((r) => r.type === "phare_harpon")!;
  assert.deepEqual(USAGES.phare_harpon.donne, { harpon: 1 });
  assert.equal(REPOUSSE_PHARE.phare_harpon, null);
  const p = phare();
  assert.equal(p.lieu.definition.plan!.pieceDe(harpon.x, harpon.z), "cuisine");
  // Sans l'épave, ils ne se prennent pas ; avec, si.
  const cloche = [...p.lieu.ressources.values()].find((r) => r.type === "phare_cloche")!;
  assert.equal(p.lieu.disponiblePour(cloche, COMPTE, p.instant()), false);
  assert.equal(p.lieu.vuePour(COMPTE, "mecanistes", p.instant()).find((r) => r.id === cloche.id)!.disponible, false);
  p.preparer();
  p.nuit();
  p.faire("escalier", "allumer");
  p.recus.length = 0;
  p.passer(CARGO_MS + 1000);
  assert.equal(p.lieu.disponiblePour(cloche, COMPTE, p.instant()), true);
  assert.ok(p.recus.some((m) => m.t === "ressource" && m.id === cloche.id && m.disponible));
  // Pris, puis le phare revient à 24 h : la cloche (4 jours) n'est pas encore revenue.
  p.lieu.prendrePar(cloche, COMPTE, p.instant());
  p.lieu.sortir(p.voyageur);
  p.avancerHorloge(REINITIALISATION_LIEU_MS + 1000);
  p.recharger();
  assert.ok(cloche.disponibleLe > p.instant(), "la cloche revient à son délai");
  const jerrican = [...p.lieu.ressources.values()].find((r) => r.type === "phare_jerrican")!;
  assert.equal(jerrican.disponibleLe, 0);
});

test("un phare gardé avant ce chantier se relit : ce qui manque prend sa valeur de départ", () => {
  // Rien de gardé (une partie 0.9 n'a jamais vu le phare), ou un état abîmé.
  assert.deepEqual(lireEtatPhare({}), etatPhareNeuf());
  assert.deepEqual(lireEtatPhare({ escabeau: "nulle_part", bidon: 3, prisme: null, allumeLe: "hier", compresseur: "oui" }), etatPhareNeuf());
  assert.deepEqual(lireEtatPhare({ escabeau: { x: 3, z: 4 } }).escabeau, { x: 3, z: 4 });
  // L'instance gardée par le chantier A (le phare branché vide) : sans `epave` ni `propre`.
  const base = new Base(":memory:");
  const instant = base.debutMonde() + 1000;
  base.sauverInstance(`phare:${COMPTE}`, { detruits: [], portes: {}, pleineLe: instant }, instant);
  const phares = new Phares(base, Math.random, () => instant);
  const lieu = phares.de(COMPTE);
  assert.equal(lieu.portes.epave, false);
  assert.deepEqual(lieu.etat, etatPhareNeuf());
  assert.equal(lieu.zone, zonePhare({ epave: false }));
  // Un Éteint de la fiche est bien vivant.
  assert.equal(lieu.eteints.length, 14);
});

test("la nuit va de 21 h à 21 h le lendemain pour la corne : le numéro change à la tombée de la nuit", () => {
  const debut = 0;
  const a = 15 * MS_PAR_HEURE_JEU - 1; // 20 h 59
  const b = 15 * MS_PAR_HEURE_JEU + 1; // 21 h 00
  const c = 15 * MS_PAR_HEURE_JEU + 8 * MS_PAR_HEURE_JEU; // 5 h du matin
  assert.equal(nuitDe(b, debut), nuitDe(a, debut) + 1);
  assert.equal(nuitDe(c, debut), nuitDe(b, debut));
});

// Le simulateur de perception (eteints.ts) sans lieu : la corne (son, 60 m, 1,3) l'emporte sur la lanterne (lumière, 45 m,
// 0,5) pour un Errant à mi-chemin des deux.
test("le leurre de la corne est plus fort que la lumière de la lanterne, à distance égale", () => {
  const e: Eteint = eteintsPhare().find((x) => x.etat === "errant" && !x.variante)!;
  e.x = (ENDROITS_PHARE.lumiere.x + ENDROITS_PHARE.pavillons.x) / 2;
  e.z = (ENDROITS_PHARE.lumiere.z + ENDROITS_PHARE.pavillons.z) / 2;
  penser(
    e,
    2,
    [
      { genre: "lumiere", x: ENDROITS_PHARE.lumiere.x, z: ENDROITS_PHARE.lumiere.z, portee: 45, intensite: 0.5 },
      { genre: "son", x: ENDROITS_PHARE.pavillons.x, z: ENDROITS_PHARE.pavillons.z, portee: 60, intensite: 1.3 },
    ],
    [],
    [],
    true,
    zonePhare({ epave: false }),
    () => 0.5,
  );
  assert.deepEqual(e.but, { x: ENDROITS_PHARE.pavillons.x, z: ENDROITS_PHARE.pavillons.z });
});

// ---------- Avec un vrai joueur : le message du phare, les bras pris, la sortie par la grève ----------

test("au phare, le joueur reçoit l'état du lieu ; l'escabeau dans les bras, il marche, ne frappe pas, le pose ; il repart par la grève", async () => {
  const { DUREE_VOYAGE_S, SORTIE_TERRAIN, etapeVers } = await import("../../commun/src/lieux.ts");
  const { Comptoir } = await import("./comptoir.ts");
  const { Cooperatives } = await import("./cooperative.ts");
  const { Gue } = await import("./gue.ts");
  const { Halte } = await import("./halte.ts");
  const { Joueur } = await import("./joueur.ts");
  const { Moulins } = await import("./moulin.ts");
  const base = new Base(":memory:");
  let instant = base.debutMonde() + 2 * MS_PAR_HEURE_JEU;
  const maintenant = () => instant;
  const halte = new Halte(base);
  const gue = new Gue(base);
  const cooperatives = new Cooperatives(base, Math.random, maintenant);
  const moulins = new Moulins(base, Math.random, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, Math.random, maintenant);
  const c = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(c.id, { sac_a_dos: 1 });
  const recus: MessageServeur[] = [];
  const joueur = new Joueur({ id: c.id, pseudo: "Rose", famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, Math.random, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
      lieux.tick(instant, pas);
    }
  };
  const voyager = (vers: "corniche" | "phare") => {
    const etape = etapeVers(joueur.lieu, vers);
    const s = joueur.lieu === "terrain" ? SORTIE_TERRAIN : sortiesDe(joueur.lieu).find((x) => x.vers === etape || x.aussi?.includes(etape))!;
    joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers });
    attendre(DUREE_VOYAGE_S + 0.5);
  };
  voyager("corniche");
  voyager("phare");
  assert.equal(joueur.lieu, "phare");
  const bienvenue = joueur.bienvenue(0);
  assert.deepEqual(bienvenue.portes, { epave: false });
  attendre(0.5);
  const iBienvenue = recus.findLastIndex((m) => m.t === "bienvenue");
  const etat = recus.slice(iBienvenue).find((m) => m.t === "phare") as Extract<MessageServeur, { t: "phare" }> | undefined;
  assert.ok(etat, "l'état du phare arrive après la bienvenue, au premier tic");
  assert.equal(etat.etat.escabeau, "hangar");
  // L'escabeau dans les bras : on ne court pas.
  joueur.position = { ...ENDROITS_PHARE.hangar, o: 0 };
  joueur.recevoir({ t: "interagir", cible: { genre: "phare", id: "escabeau" }, verbe: "porter" });
  const phareDeRose = lieux.vivant("phare", c.id) as LieuPhare;
  assert.ok(phareDeRose.dansLesBras(c.id));
  // (La vue d'ensemble de l'arrivée attend le premier geste.)
  joueur.recevoir({ t: "arrivee" });
  const avant = { ...joueur.position };
  joueur.recevoir({ t: "intention", dx: 0, dz: -1, allure: "course", seq: 1 });
  attendre(1, 0.1);
  const parcouru = Math.hypot(joueur.position.x - avant.x, joueur.position.z - avant.z);
  assert.ok(parcouru > 1.5 && parcouru < 3.5, `on marche, on ne court pas (${parcouru.toFixed(2)} m en 1 s)`);
  joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 });
  // Les bras pris, on ne frappe pas (S-08, la règle commune aux lieux) ; on pose l'escabeau là où l'on est.
  joueur.recevoir({ t: "frapper", appuye: false });
  assert.ok(phareDeRose.dansLesBras(c.id));
  joueur.recevoir({ t: "poser" });
  assert.ok(!phareDeRose.dansLesBras(c.id));
  // On repart par la grève, à l'ouest (une sortie sans arrivée) : on revient par la route, au nord.
  const greve = sortiesDe("phare").find((s) => s.sansArrivee)!;
  joueur.position = { x: greve.boite.x, z: greve.boite.z, o: 0 };
  joueur.recevoir({ t: "voyager", vers: "corniche" });
  attendre(DUREE_VOYAGE_S + 0.5);
  assert.equal(joueur.lieu, "corniche");
  voyager("phare");
  assert.deepEqual(joueur.position, entreesDe("phare")[0]!.arrivee);
});
