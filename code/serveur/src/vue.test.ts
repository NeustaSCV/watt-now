// La vue par pièce (0.7.2) : le serveur n'envoie à chacun que ce qu'il voit, contre les murs et les portes fermées,
// à travers les fenêtres ; ce qu'il entend sans le voir lui arrive en « bruits », sans la position de la source.

import { test } from "node:test";
import assert from "node:assert/strict";
import { PIECES, pieceDe, portesInitiales } from "../../commun/src/cooperative.ts";
import { nouvelEteint, type Eteint, type Humain } from "../../commun/src/eteints.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { PLAN_VUE_COOP, PLAN_VUE_HALTE } from "../../commun/src/vue-lieux.ts";
import { SON_FENETRE, SON_MUR, SON_PORTE_FERMEE, SON_PORTE_OUVERTE, facteurSon, obstaclesVue, passageSon, polygoneVue, voit } from "../../commun/src/vue.ts";
import { Base } from "./base.ts";
import { definitionCoop } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { LieuVivant, type Voyageur } from "./lieu-vivant.ts";
import { diffuserPresences, type MemoirePresences } from "./presences.ts";

/** Un joueur présent, immobile, qui garde ce qu'il reçoit. */
function voyageur(id: number, x: number, z: number) {
  const recus: MessageServeur[] = [];
  const h: Humain = { id, x, z, discret: false, eclaire: false };
  const v: Voyageur & { recus: MessageServeur[]; h: Humain } = { recus, h, envoyer: (m) => recus.push(m), stimuli: () => [], humain: () => h };
  return v;
}
const de = <T extends MessageServeur["t"]>(v: { recus: MessageServeur[] }, t: T) => v.recus.filter((m) => m.t === t) as Extract<MessageServeur, { t: T }>[];

/** Une Coopérative vide de ses Éteints : on pose ceux du test. */
function coop(eteints: Eteint[], portes: Record<string, boolean> = {}) {
  const lieu = new LieuVivant(new Base(":memory:"), definitionCoop(1), () => 0.5);
  lieu.eteints = eteints;
  Object.assign(lieu.portes, portes);
  return lieu;
}
const vus = (lieu: LieuVivant, x: number, z: number) => lieu.eteintsVus({ x, z }).map((e) => e.id);

test("vue par pièce : dans le hangar, on ne voit pas le libre-service à travers la cloison ; dans sa pièce, tout", () => {
  const lieu = coop([nouvelEteint(1, 48, 36, "dormant"), nouvelEteint(2, 60, 26, "dormant"), nouvelEteint(3, 45, 22, "dormant")], { libre_service_hangar: false });
  // Au milieu du hangar : l'Éteint du hangar, derrière un rayonnage (ils n'arrêtent pas la vue) ; pas celui du libre-service.
  assert.deepEqual(vus(lieu, 52, 24), [2, 3]);
  // Dans le libre-service : celui du libre-service seulement.
  assert.deepEqual(vus(lieu, 46, 37), [1]);
});

test("porte fermée : rien de l'autre côté ; ouverte : on voit dans le prolongement de l'ouverture (le cône)", () => {
  // La porte du libre-service vers le hangar (x 40, z 32, 1,6 m). Un Éteint juste en face, un autre de biais.
  const enFace = nouvelEteint(1, 40.2, 27, "dormant");
  const deBiais = nouvelEteint(2, 46, 26, "dormant");
  const fermee = coop([enFace, deBiais], { libre_service_hangar: false });
  assert.deepEqual(vus(fermee, 40, 37), [], "porte fermée : on ne voit rien du hangar");
  const ouverte = coop([enFace, deBiais], { libre_service_hangar: true });
  assert.deepEqual(vus(ouverte, 40, 37), [1], "de loin : seulement dans l'axe de la porte");
  // Sur le seuil, le cône s'ouvre presque à toute la pièce.
  assert.deepEqual(vus(ouverte, 40.3, 32), [1, 2], "sur le seuil : les deux");
});

test("deux portes alignées : de la cour, on voit dans le hangar à travers le libre-service", () => {
  // Les portes cour (x 44, z 40) et hangar (x 40, z 32) : une ligne de la cour au hangar passe par les deux.
  const lieu = coop([nouvelEteint(1, 37.5, 27, "dormant")], { libre_service_cour: true, libre_service_hangar: true });
  const ov = obstaclesVue(PLAN_VUE_COOP, lieu.portes);
  assert.ok(voit(ov, 46, 44, 37.5, 27) || voit(ov, 45, 43, 37.8, 26.5), "une ligne passe par les deux portes");
});

test("fenêtres : du libre-service, on voit la cour à travers les vitrines ; le store baissé des bureaux arrête la vue", () => {
  const ov = obstaclesVue(PLAN_VUE_COOP, portesInitiales());
  // Du fond du libre-service vers la cour, droit devant, à travers une vitrine (pas par la porte, en x 44).
  assert.ok(voit(ov, 37, 36, 37, 46), "à travers la vitrine ouest");
  assert.ok(voit(ov, 53, 36, 53, 46), "à travers la vitrine est");
  // Des bureaux : par la fenêtre à barreaux (x 62), oui ; par celle au store baissé (x 66), non.
  assert.ok(voit(ov, 62, 37, 62, 46));
  assert.ok(!voit(ov, 66, 37, 66, 46));
  // Le serveur suit la même règle : l'Éteint de la cour est envoyé au joueur du libre-service qui le voit à travers la vitre.
  const lieu = coop([nouvelEteint(1, 50, 47, "dormant")]);
  assert.deepEqual(vus(lieu, 50, 36), [1]);
  // À la halte : la vitrine aux planches arrête la vue, les vitrines brisées non.
  const halte = obstaclesVue(PLAN_VUE_HALTE, {});
  assert.ok(voit(halte, 98, 14, 98, 25), "par la vitrine ouest, brisée");
  assert.ok(!voit(halte, 102, 14, 102, 25), "pas par les planches");
  assert.ok(!voit(halte, 97, 14, 97, 5), "pas à travers le mur du fond");
});

test("le polygone de vue de l'écran et la vue du serveur disent la même chose", () => {
  const ov = obstaclesVue(PLAN_VUE_COOP, { ...portesInitiales(), libre_service_hangar: true });
  const p = { x: 41, z: 36 };
  const poly = polygoneVue(ov, p.x, p.z, 48, 0);
  // Un point est dans le polygone s'il est plus près que le bord du polygone, dans sa direction.
  const dedans = (x: number, z: number) => {
    const a = Math.atan2(z - p.z, x - p.x);
    let meilleur = 0;
    let ecart = Infinity;
    for (let i = 0; i < poly.length; i += 2) {
      const b = Math.atan2(poly[i + 1]! - p.z, poly[i]! - p.x);
      const e = Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
      if (e < ecart) {
        ecart = e;
        meilleur = Math.hypot(poly[i]! - p.x, poly[i + 1]! - p.z);
      }
    }
    return Math.hypot(x - p.x, z - p.z) < meilleur;
  };
  let accords = 0;
  let essais = 0;
  for (let x = 30; x < 70; x += 1.7) {
    for (let z = 10; z < 50; z += 1.3) {
      essais++;
      if (dedans(x, z) === voit(ov, p.x, p.z, x, z)) accords++;
    }
  }
  assert.ok(accords / essais > 0.97, `${accords} / ${essais}`);
});

test("le son d'une pièce à l'autre : porte ouverte ×0,5, fermée ×0,15, vitrine ×0,3, mur ×0,05", () => {
  const p = portesInitiales();
  assert.equal(facteurSon(PLAN_VUE_COOP, { ...p, libre_service_hangar: true }, "hangar", "libre_service"), SON_PORTE_OUVERTE);
  assert.equal(facteurSon(PLAN_VUE_COOP, { ...p, bureaux: false }, "hangar", "bureaux"), SON_PORTE_FERMEE);
  // La cour et le libre-service, porte de la cour fermée : le son passe par les vitrines.
  assert.equal(facteurSon(PLAN_VUE_COOP, { ...p, libre_service_cour: false, libre_service_hangar: false, quai: false, atelier_sud: false, atelier_est: false }, "dehors", "libre_service"), SON_FENETRE);
  // La chambre froide et le libre-service, tout fermé : au plus le mur.
  const tout = Object.fromEntries(Object.keys(p).map((k) => [k, false]));
  assert.ok(facteurSon(PLAN_VUE_COOP, tout, "chambre_froide", "libre_service") >= SON_MUR);
});

test("bruit sans position : un Éteint caché derrière la cloison s'entend, au point de passage de notre côté, sans son numéro", () => {
  // Un errant dans le hangar, juste derrière la cloison du libre-service (porte fermée) ; on est dans le libre-service.
  const errant = nouvelEteint(7, 46, 30.5, "errant");
  const lieu = coop([errant], { libre_service_hangar: false });
  const moi = voyageur(1, 46, 34);
  lieu.entrer(moi);
  let instant = 1_000_000;
  for (let i = 0; i < 60; i++) {
    instant += 200;
    // Il fait les cent pas derrière le mur.
    errant.x = 46 + Math.sin(i / 3) * 1.5;
    errant.but = null;
    lieu.tick(instant, 0.2);
  }
  assert.deepEqual(de(moi, "eteints").flatMap((m) => m.eteints), [], "on ne le reçoit pas");
  const bruits = de(moi, "bruits").flatMap((m) => m.bruits);
  assert.ok(bruits.length > 0, "mais on l'entend");
  for (const b of bruits) {
    assert.ok(!("id" in b), "jamais son numéro");
    assert.equal(pieceDe(b.x, b.z), "libre_service", "le point de passage est de notre côté");
    assert.ok(b.f > 0 && b.f <= 1);
    assert.ok(Math.hypot(b.x - errant.x, b.z - errant.z) > 0.5, "ce n'est pas sa position");
  }
  assert.ok(bruits.some((b) => b.g === "pas" || b.g === "rale"));
});

test("le point de passage : par la porte ouverte qui mène à la source, sinon sur le mur", () => {
  const p = { ...portesInitiales(), libre_service_hangar: true };
  // De la cour au hangar, le son passe par le quai (ouvert).
  const point = passageSon(PLAN_VUE_COOP, p, { x: 30, z: 26 }, { x: 45, z: 20 });
  assert.equal(pieceDe(point.x, point.z), "dehors");
  assert.ok(Math.abs(point.z - 26) < 2 && point.x < 34, `près du quai : ${point.x}, ${point.z}`);
});

test("je le sens : un Éteint à moins de 3 m derrière un mur n'est pas envoyé, mais se sent (« presence »)", () => {
  const dormant = nouvelEteint(3, 46, 30.2, "dormant");
  const lieu = coop([dormant], { libre_service_hangar: false });
  const moi = voyageur(1, 46, 32.6);
  lieu.entrer(moi);
  let instant = 1_000_000;
  for (let i = 0; i < 10; i++) lieu.tick((instant += 200), 0.2);
  assert.deepEqual(de(moi, "eteints").flatMap((m) => m.eteints), []);
  const sentis = de(moi, "bruits").flatMap((m) => m.bruits).filter((b) => b.g === "presence");
  assert.ok(sentis.length >= 1, "on le sent");
  assert.ok(sentis.length <= 2, "pas à chaque envoi : toutes les 1,2 s");
  assert.equal(pieceDe(sentis[0]!.x, sentis[0]!.z), "libre_service");
});

test("un Éteint qui pousse une porte fermée cogne : on l'entend, la porte tremble", () => {
  // Un poursuivant colle à la porte des bureaux (fermée), côté hangar ; on est dans les bureaux.
  const e = nouvelEteint(5, 61, 31.4, "poursuivant");
  const lieu = coop([e], { bureaux: false });
  const moi = voyageur(1, 61, 34.5);
  lieu.entrer(moi);
  let instant = 1_000_000;
  for (let i = 0; i < 20; i++) {
    e.x = 61;
    e.z = 31.4;
    e.but = { x: 61, z: 34.5 };
    lieu.tick((instant += 200), 0.2);
  }
  const coups = de(moi, "bruits").flatMap((m) => m.bruits).filter((b) => b.g === "coups");
  assert.ok(coups.length >= 2, `il cogne (${coups.length})`);
  assert.equal(coups[0]!.porte, "bureaux");
  assert.equal(pieceDe(coups[0]!.x, coups[0]!.z), "bureaux");
});

test("une porte qui s'ouvre envoie tout de suite ce qu'on voit par elle", () => {
  const e = nouvelEteint(1, 40, 27, "dormant");
  const lieu = coop([e], { libre_service_hangar: false });
  const moi = voyageur(1, 40, 35);
  lieu.entrer(moi);
  let instant = 1_000_000;
  lieu.tick((instant += 200), 0.2);
  moi.recus.length = 0;
  lieu.basculerPorte("libre_service_hangar", true);
  lieu.tick((instant += 50), 0.05);
  assert.deepEqual(de(moi, "eteints").at(-1)?.eteints.map((x) => x.id), [1], "sans attendre l'envoi suivant (200 ms)");
});

test("à plusieurs : chacun sa vue ; on ne reçoit pas un joueur caché derrière le mur de la boutique", () => {
  const halte = new Halte(new Base(":memory:"));
  const vueDuLieu = (lieu: string, a: { x: number; z: number }, b: { x: number; z: number }) => lieu !== "station" || halte.voitEntre(a, b);
  const vu = (id: number, x: number, z: number) => ({ id, pseudo: `J${id}`, famille: "voltaiques" as const, x, z, o: 0, lumiere: false, apparence: { genre: "homme" } as never });
  const observateur = (id: number, x: number, z: number) => {
    const recus: MessageServeur[] = [];
    return { id, lieu: "station", vu: vu(id, x, z), envoyer: (m: MessageServeur) => recus.push(m), recus };
  };
  const dedans = observateur(1, 100, 13);
  // Derrière la boutique, contre le mur nord, puis devant la vitrine brisée.
  const derriere = observateur(2, 100, 10.5);
  const memoire: MemoirePresences = new Map();
  diffuserPresences([dedans, derriere], memoire, vueDuLieu);
  assert.equal(de(dedans, "autres").length, 0, "à travers le mur : rien");
  derriere.vu = vu(2, 98, 22);
  diffuserPresences([dedans, derriere], memoire, vueDuLieu);
  assert.deepEqual(de(dedans, "autres").at(-1)?.joueurs.map((j) => j.id), [2], "par la vitrine : on le voit");
  assert.deepEqual(de(derriere, "autres").at(-1)?.joueurs.map((j) => j.id), [1], "et lui nous voit");
});

test("à plusieurs : un coup ne part qu'à ceux qui le voient ; un butin pris hors de vue disparaît tout de suite pour tous", () => {
  const halte = new Halte(new Base(":memory:"));
  const dedans = voyageur(1, 100, 13);
  const loin = voyageur(2, 100, 10.2);
  halte.entrer(dedans);
  halte.entrer(loin);
  halte.diffuserVu({ t: "coup", id: 1, x: 101, z: 13, resultat: "vacille" }, [{ x: 100, z: 13 }, { x: 101, z: 13 }]);
  assert.equal(de(dedans, "coup").length, 1);
  assert.equal(de(loin, "coup").length, 0, "derrière le mur du fond, on ne voit pas le coup");
  // Le rayonnage du fond de la boutique : pris par celui de l'intérieur, il disparaît aussi chez l'autre (décision 8).
  const r = [...halte.ressources.values()].find((x) => x.type === "rayonnage" && x.x > 106)!;
  halte.prendre(r, Date.now() + 60_000);
  assert.deepEqual(de(loin, "ressource").at(-1), { t: "ressource", id: r.id, disponible: false });
});

test("le plan de la Coopérative : chaque pièce est d'un seul tenant pour la vue (on se voit d'un bout à l'autre)", () => {
  const ov = obstaclesVue(PLAN_VUE_COOP, portesInitiales());
  for (const nom of ["libre_service", "bureaux", "chambre_froide", "atelier"] as const) {
    const b = PIECES[nom].boite;
    // D'un coin à l'autre (à 1 m des murs), en diagonale : rien n'arrête la vue dans une pièce (le mobilier est bas).
    assert.ok(voit(ov, b.x - b.l / 2 + 1, b.z - b.p / 2 + 1, b.x + b.l / 2 - 1, b.z + b.p / 2 - 1), nom);
  }
});
