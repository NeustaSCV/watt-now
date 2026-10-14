// Plan 0.10, chantier D : les meubles nouveaux du niveau 2 (S-22 à S-30). Le banc solaire suit le soleil (rien la nuit
// ni sous la pluie, 80 Wh par beau jour) ; le cuiseur solaire ne cuit pas la nuit ; le moulin de jerricans produit sous
// la pluie et rien au soleil, + 50 % avec la poulie ; la batterie de cellules ne dépasse pas 120 Wh ; la rampe de LED
// s'éteint batterie vide ; l'arbalète de garde ne tire pas sur un joueur, et abat un Errant ; la charrette porte 100 kg de
// plus ; les bacs de tri doublent la vitesse à 3 m ; les meubles communs n'apparaissent qu'après la visite d'un lieu du
// niveau 2.

import { test } from "node:test";
import assert from "node:assert/strict";
import { CAPACITES, MS_JOUR_CALENDRIER, msDeNuit, productionMoulin, productionPanneau, stocker, whDePuissance } from "../../commun/src/energie.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import type { InstallationVue, MessageServeur, Verbe } from "../../commun/src/messages.ts";
import { vent, type Temps } from "../../commun/src/meteo.ts";
import { capaciteDe, type Inventaire } from "../../commun/src/objets.ts";
import { aDevoiler, devoileesAuDepart, toutDevoile, type EtatPourDevoilement } from "../../commun/src/progression.ts";
import { dureeReelle, recette } from "../../commun/src/recettes.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { MS_PAR_HEURE_JEU, MS_PAR_JOUR_JEU } from "../../commun/src/temps.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { MeublesNeufs, type ContexteMeublesNeufs } from "./meubles-neufs.ts";

const toujours = (t: Temps) => () => t;
/** Une heure de jeu, depuis le début du monde (il commence à 6 h). */
const aHeure = (h: number) => ((h - 6 + 24) % 24) * MS_PAR_HEURE_JEU;

// ---------- Le banc qui suit le soleil (S-30) ----------

test("☀️ le banc ne charge rien la nuit ni sous la pluie, et donne ses 80 Wh par beau jour", () => {
  // La nuit, de 21 h à 5 h 30 : rien, même par grand soleil.
  assert.equal(productionPanneau(aHeure(21), aHeure(21) + 8.5 * MS_PAR_HEURE_JEU, 0, toujours("soleil")), 0);
  // Sous la pluie, un jour entier : rien.
  assert.equal(productionPanneau(0, MS_JOUR_CALENDRIER, 0, toujours("pluie")), 0);
  // Par beau temps : 80 Wh par jour de calendrier (73 jours de calendrier = 336 jours de jeu, sans reste).
  assert.ok(Math.abs(productionPanneau(0, 73 * MS_JOUR_CALENDRIER, 0, toujours("soleil")) / 73 - REGLAGES.panneau_wh_jour) < 1e-6);
  // Voilé, couvert : 0,6 et 0,3 du beau temps.
  const jours = (t: Temps) => productionPanneau(0, 10 * MS_PAR_JOUR_JEU, 0, toujours(t));
  assert.ok(Math.abs(jours("voile") / jours("soleil") - 0.6) < 1e-9);
  assert.ok(Math.abs(jours("couvert") / jours("soleil") - 0.3) < 1e-9);
  // Le plus fort, au milieu du jour (13 h 15), et rien au lever.
  assert.ok(productionPanneau(aHeure(13), aHeure(13.5), 0, toujours("soleil")) > productionPanneau(aHeure(6), aHeure(6.5), 0, toujours("soleil")) * 5);
});

// ---------- Le moulin de jerricans (S-28) ----------

test("⚙️ le moulin de jerricans produit sous la pluie, rien au soleil, et la poulie donne 50 % de plus", () => {
  assert.equal(vent("pluie"), "fort");
  assert.equal(vent("couvert"), "fort");
  assert.equal(vent("voile"), "faible");
  assert.equal(vent("soleil"), "calme");
  // 15 W tout un jour de calendrier sous la pluie : 360 Wh ; 5 W par temps voilé ; rien au soleil.
  assert.ok(Math.abs(productionMoulin(0, MS_JOUR_CALENDRIER, 0, false, toujours("pluie")) - 360) < 1e-6);
  assert.ok(Math.abs(productionMoulin(0, MS_JOUR_CALENDRIER, 0, false, toujours("voile")) - 120) < 1e-6);
  assert.equal(productionMoulin(0, MS_JOUR_CALENDRIER, 0, false, toujours("soleil")), 0);
  // La nuit aussi : le vent ne dort pas.
  assert.ok(productionMoulin(aHeure(22), aHeure(23), 0, false, toujours("pluie")) > 0);
  assert.ok(Math.abs(productionMoulin(0, MS_JOUR_CALENDRIER, 0, true, toujours("pluie")) - 540) < 1e-6);
});

// ---------- La batterie de cellules (S-26) ----------

test("⚡ la batterie de cellules garde 120 Wh, pas un de plus", () => {
  assert.equal(CAPACITES.batterie_cellules, 120);
  const r = stocker({ batteries: { batterie_cellules: 1 }, charges: { batterie_cellules: 100 } }, 50);
  assert.equal(r.stockage.charges.batterie_cellules, 120);
  assert.equal(r.perdu, 30);
});

// ---------- La charrette à bras (S-27) ----------

test("⚙️ la charrette à bras porte 100 kg de plus (la brouette : 60)", () => {
  const sac = { sac_a_dos: 1 };
  assert.equal(capaciteDe({ ...sac, charrette_bras: 1 }) - capaciteDe(sac), 100);
  assert.equal(capaciteDe({ ...sac, brouette: 1 }) - capaciteDe(sac), 60);
  // La meilleure seule compte : on ne pousse pas l'une en tirant l'autre.
  assert.equal(capaciteDe({ ...sac, brouette: 1, charrette_bras: 1 }) - capaciteDe(sac), 100);
});

// ---------- L'apparition des meubles communs (N2-Q3) ----------

test("les deux meubles communs n'apparaissent qu'après la visite d'un lieu du niveau 2", () => {
  const etat = (faits: Record<string, number>): EtatPourDevoilement => ({
    famille: "voltaiques",
    vus: new Set(),
    faits,
    installations: new Map(),
    quetes: new Set(),
    tuto: null,
    minutes: 600,
    sansSac: false,
    devoilees: new Set(devoileesAuDepart()),
  });
  const avant = aDevoiler(etat({ "visite:cooperative": 1, "visite:moulin": 1, "visite:comptoir": 1 }));
  assert.ok(!avant.includes("cuiseur_solaire") && !avant.includes("bacs_tri"), avant.join(", "));
  for (const lieu of ["route_pont", "grand_hotel", "corniche", "phare"]) {
    const apres = aDevoiler(etat({ [`visite:${lieu}`]: 1 }));
    assert.ok(apres.includes("cuiseur_solaire") && apres.includes("bacs_tri"), `${lieu} : ${apres.join(", ")}`);
  }
});

// ---------- Dans le jeu ----------

/** Un joueur sur son terrain, à l'heure dite (heure de jeu, le monde commence à 6 h), avec ses installations posées. */
function monter(famille: Famille, depart: Inventaire, poses: { type: InstallationVue["type"]; x: number; z: number; o?: number; niveau?: number; etat?: InstallationVue["etat"] }[] = [], heure = 7, alea = () => 1) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Hélène", "soleil123", famille);
  base.sauverProgression(compte.id, toutDevoile(famille));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...depart });
  const debut = base.debutMonde();
  let instant = debut + aHeure(heure);
  const ids: number[] = [];
  for (const i of poses) {
    const v = base.ajouterInstallation(compte.id, i.type, i.x, i.z, i.o ?? 0);
    base.sauverEtatInstallation(compte.id, v.id, { majLe: instant, ...(i.etat ?? {}) });
    if (i.niveau) base.sauverNiveauInstallation(compte.id, v.id, i.niveau);
    ids.push(v.id);
  }
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), alea);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.1) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const sac = () => base.chargerInventaire(compte.id);
  const installation = (id: number) => base.chargerInstallations(compte.id).find((i) => i.id === id)!;
  const utiliser = (id: number, verbe: Verbe) => joueur.recevoir({ t: "interagir", cible: { genre: "installation", id }, verbe });
  const duree = () => (dernier("action") as { duree?: number } | undefined)?.duree;
  return { base, debut, joueur, attendre, dernier, infos, sac, installation, utiliser, ids, duree, instant: () => instant };
}

test("☀️ le cuiseur solaire ne cuit pas la nuit ; au soleil, il cuit sans feu, deux fois plus lentement", () => {
  const nuit = monter("voltaiques", { pomme: 3 }, [{ type: "cuiseur_solaire", x: 21, z: 20 }], 22);
  nuit.joueur.recevoir({ t: "fabriquer", recette: "pommes_cuites" });
  nuit.attendre(5);
  assert.equal(nuit.sac().pommes_cuites, undefined);
  assert.match(nuit.infos().at(-1)!, /La nuit, le cuiseur solaire ne chauffe pas/);
  // L'eau non plus.
  nuit.joueur["gourde"] = { contenu: "brute", litres: 1 };
  nuit.utiliser(nuit.ids[0]!, "bouillir");
  assert.match(nuit.infos().at(-1)!, /La nuit/);
  assert.equal(nuit.joueur["gourde"].contenu, "brute");

  // À 7 h, au soleil de la première tranche du monde : sans feu ni bois, en deux fois le temps.
  const jour = monter("voltaiques", { pomme: 3 }, [{ type: "cuiseur_solaire", x: 21, z: 20 }], 7);
  jour.joueur.recevoir({ t: "fabriquer", recette: "pommes_cuites" });
  assert.equal(jour.duree(), dureeReelle(recette("pommes_cuites")!) * 2);
  jour.attendre(jour.duree()! + 0.5);
  assert.equal(jour.sac().pommes_cuites, 1);
  jour.joueur["gourde"] = { contenu: "brute", litres: 1 };
  jour.utiliser(jour.ids[0]!, "bouillir");
  jour.attendre(jour.duree()! + 0.5);
  assert.equal(jour.joueur["gourde"].contenu, "potable");
  // Loin du cuiseur et sans feu : il faut un feu.
  const loin = monter("voltaiques", { pomme: 3 }, [{ type: "cuiseur_solaire", x: 30, z: 20 }], 7);
  loin.joueur.recevoir({ t: "fabriquer", recette: "pommes_cuites" });
  assert.match(loin.infos().at(-1)!, /feu/);
});

test("⚙️ les bacs de tri à 3 m : on démonte deux fois plus vite, et une fois sur trois une matière de plus", () => {
  // Sans bacs : le temps ordinaire, rien de plus (le tirage serait bon : il n'y a pas de bacs).
  const sans = monter("mecanistes", { carton: 1 }, [], 7, () => 0.1);
  sans.joueur.recevoir({ t: "demonter", objet: "carton" });
  const ordinaire = sans.duree()!;
  sans.attendre(ordinaire + 0.5);
  assert.equal(sans.sac().papier, 3);
  // Les bacs à 2 m : moitié moins de temps ; le tirage (0,1 < 1/3) donne une matière de plus.
  const avec = monter("mecanistes", { carton: 1 }, [{ type: "bacs_tri", x: 22, z: 20 }], 7, () => 0.1);
  avec.joueur.recevoir({ t: "demonter", objet: "carton" });
  assert.ok(Math.abs(avec.duree()! - ordinaire / 2) < 1e-9, `${avec.duree()} pour ${ordinaire}`);
  avec.attendre(avec.duree()! + 0.5);
  assert.equal(avec.sac().papier, 4);
  assert.match(avec.infos().join(" "), /Aux bacs de tri, rien ne se perd : une matière de plus \(liasse de papier\)/);
  // Le tirage manqué (0,9) : la vitesse, mais rien de plus. À 4 m, plus rien.
  const rate = monter("mecanistes", { carton: 1 }, [{ type: "bacs_tri", x: 22, z: 20 }], 7, () => 0.9);
  rate.joueur.recevoir({ t: "demonter", objet: "carton" });
  rate.attendre(rate.duree()! + 0.5);
  assert.equal(rate.sac().papier, 3);
  const loin = monter("mecanistes", { carton: 1 }, [{ type: "bacs_tri", x: 24, z: 20 }], 7, () => 0.1);
  loin.joueur.recevoir({ t: "demonter", objet: "carton" });
  assert.equal(loin.duree(), ordinaire);
});

test("⚙️ l'arbalète de garde ne tire pas sur un joueur, abat un Errant, et se réarme (2 s au cranequin léger, 3 s sinon)", () => {
  const t = monter("mecanistes", { "arbalete#2": 1, tube_aluminium: 1, rouleau_fil_fer: 1, petit_ressort: 1, cle_plate: 1 } as Inventaire);
  // Posée en (20 ; 22), tournée vers +z : son fil passe à 1 m devant, en z = 23.
  t.joueur.recevoir({ t: "fabriquer", recette: "arbalete_garde", x: 20, z: 22, o: 0 });
  t.attendre(dureeReelle(recette("arbalete_garde")!) + 0.5);
  const a = t.dernier("installation")!.installation;
  assert.equal(a.type, "arbalete_garde");
  assert.equal(a.etat.etoiles, 2, "elle garde les étoiles de l'arbalète posée");
  assert.equal(a.etat.declencheur?.arme, true);
  assert.equal(t.sac()["arbalete#2" as "arbalete"], undefined, "l'arbalète est partie dans le piège");
  // Le joueur passe le fil : rien.
  t.joueur.position = { x: 20, z: 23, o: 0 };
  t.attendre(1);
  assert.equal(t.installation(a.id).etat.declencheur?.arme, true, "jamais sur un joueur");
  // Un Errant passe le fil : un carreau, il est abattu ; l'arbalète est à réarmer.
  t.joueur.position = { x: 15, z: 20, o: 0 };
  const e = nouvelEteint(1, 20.4, 23, "poursuivant");
  t.joueur["eteints"] = [e];
  t.attendre(0.3);
  assert.equal(e.etat, "detruit");
  assert.equal(t.installation(a.id).etat.declencheur?.arme, false);
  assert.match(t.infos().join(" "), /arbalète de garde a tiré/);
  // Un second ne prend rien : elle est désarmée.
  const f = nouvelEteint(2, 20, 23, "poursuivant");
  t.joueur["eteints"] = [f];
  t.attendre(0.3);
  assert.notEqual(f.etat, "detruit");
  // Réarmer à la main : 3 s ; avec le cranequin léger dans le sac : 2 s.
  t.joueur["eteints"] = [];
  t.joueur.position = { x: 20, z: 21, o: 0 };
  t.utiliser(a.id, "rearmer_piege");
  assert.equal(t.duree(), 3);
  t.attendre(3.5);
  assert.equal(t.installation(a.id).etat.declencheur?.arme, true);
  const c = monter("mecanistes", { cranequin_leger: 1 }, [{ type: "arbalete_garde", x: 20, z: 22, etat: { etoiles: 3, declencheur: { arme: false, prises: 1 } } }]);
  c.joueur.position = { x: 20, z: 21, o: 0 };
  c.utiliser(c.ids[0]!, "rearmer_piege");
  assert.equal(c.duree(), 2);
});

test("⚙️ le moulin remplit la batterie de la base au vent, même hors ligne ; la batterie de cellules s'arrête à 120 Wh", () => {
  // Une absence d'un demi-jour de calendrier : le moulin pousse le vent du monde dans la batterie de cellules du banc.
  const t = monter("mecanistes", {}, [
    { type: "moulin_jerricans", x: 25, z: 20 },
    { type: "banc_recharge", x: 22, z: 20, etat: { batteries: { batterie_cellules: 1 }, charges: { batterie_cellules: 10 } } },
  ]);
  const [moulin, banc] = t.ids as [number, number];
  const depuis = t.instant();
  t.attendre(30, 1);
  const vent = productionMoulin(depuis, t.instant(), t.debut);
  const wh = t.installation(banc).etat.charges!.batterie_cellules!;
  assert.ok(Math.abs(wh - Math.min(120, 10 + vent)) < 0.5, `${wh} pour ${vent}`);
  // Très longtemps (quatre heures réelles, plus de deux jours de calendrier) : jamais plus de 120 Wh.
  t.attendre(4 * 3600, 60);
  assert.ok(t.installation(banc).etat.charges!.batterie_cellules! <= 120 + 1e-9);
  assert.ok(productionMoulin(depuis, t.instant(), t.debut) > 120, "le vent du monde a soufflé plus qu'elle n'en tient");
  assert.equal(t.installation(moulin).etat.poulie, undefined);
  // La poulie d'aluminium des Charbonniers, posée sur l'axe (un autre joueur, frais).
  const p = monter("mecanistes", { poulie_aluminium: 1 }, [{ type: "moulin_jerricans", x: 25, z: 20 }]);
  p.joueur.position = { x: 25, z: 19, o: 0 };
  p.utiliser(p.ids[0]!, "poser_poulie");
  p.attendre(9);
  assert.equal(p.installation(p.ids[0]!).etat.poulie, true);
  assert.equal(p.sac().poulie_aluminium, undefined);
});

// ---------- La rampe de LED (S-25), au calcul de la base ----------

/** Les meubles nouveaux, seuls, au début d'un monde qui commence à l'instant 0. */
function meubles(): MeublesNeufs {
  const ctx = { debutMonde: () => 0, maintenant: () => 0, alea: () => 0.5 } as unknown as ContexteMeublesNeufs;
  return new MeublesNeufs(ctx);
}

test("⚡ la rampe de LED tire 3 W la nuit sur la batterie de la base, rien le jour ; batterie vide, elle s'éteint", () => {
  const m = meubles();
  const nuit = aHeure(21);
  const unenuit = 8.5 * MS_PAR_HEURE_JEU;
  const besoin = whDePuissance(3, unenuit);
  assert.ok(Math.abs(msDeNuit(nuit, nuit + unenuit, 0) - unenuit) < 1e-6);
  const poses = (wh: number): InstallationVue[] => [
    { id: 1, type: "rampe_led", x: 0, z: 0, o: 0, etat: { majLe: nuit } },
    { id: 2, type: "banc_recharge", x: 3, z: 0, o: 0, etat: { batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: wh } } },
  ];
  // Une batterie chargée : une nuit lui coûte ≈ 5,5 Wh (3 W pendant 8 h 30 de jeu, au calendrier), la rampe éclaire.
  const pleine = poses(100);
  const b1 = m.majBase(pleine, nuit + unenuit);
  assert.ok(Math.abs(pleine[1]!.etat.charges!.batterie_voiture! - (100 - besoin)) < 1e-9);
  assert.equal(pleine[0]!.etat.courant, true);
  assert.equal(b1.bascules.length, 1, "elle s'allume");
  // Le jour : rien ne part.
  m.majBase(pleine, nuit + unenuit + 10 * MS_PAR_HEURE_JEU);
  assert.ok(Math.abs(pleine[1]!.etat.charges!.batterie_voiture! - (100 - besoin)) < 1e-9);
  // Une batterie presque vide : elle se vide, la rampe s'éteint.
  const vide = poses(1);
  m.majBase(vide, nuit + unenuit);
  assert.equal(vide[1]!.etat.charges!.batterie_voiture, 0);
  assert.equal(vide[0]!.etat.courant, false);
  // Sans batterie à la base : éteinte.
  const seule: InstallationVue[] = [{ id: 1, type: "rampe_led", x: 0, z: 0, o: 0, etat: { majLe: nuit } }];
  m.majBase(seule, nuit + 60_000);
  assert.equal(seule[0]!.etat.courant, false);
});

test("🔥 le creuset se pose sur la forge ventilée, pas sur le foyer de forge ; quatre chutes font une poulie ou un lingot", () => {
  const cout = { glaise: 4, pierre: 2, aluminium: 8 };
  // Sur le foyer de forge (niveau 1) : refusé.
  const foyer = monter("charbonniers", cout, [{ type: "forge", x: 21, z: 20, etat: { enclume: "depanneur" } }]);
  foyer.utiliser(foyer.ids[0]!, "poser_creuset");
  assert.match(foyer.infos().at(-1)!, /forge ventilée/);
  // Sur la forge ventilée (niveau 2) : posé, puis la poulie et le lingot.
  const t = monter("charbonniers", cout, [{ type: "forge", x: 21, z: 20, niveau: 2, etat: { enclume: "depanneur" } }]);
  t.utiliser(t.ids[0]!, "poser_creuset");
  t.attendre(20.5);
  assert.equal(t.installation(t.ids[0]!).etat.creuset, true);
  assert.equal(t.sac().glaise, undefined);
  t.joueur.recevoir({ t: "fabriquer", recette: "poulie_aluminium" });
  t.attendre(t.duree()! + 0.5);
  t.joueur.recevoir({ t: "fabriquer", recette: "lingot_aluminium" });
  t.attendre(t.duree()! + 0.5);
  assert.equal(t.sac().poulie_aluminium, 1);
  assert.equal(t.sac().lingot_aluminium, 1);
  assert.equal(t.sac().aluminium, undefined);
});
