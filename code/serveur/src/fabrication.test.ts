// Tests du lot 1 de l'É2 : vestiges, démontage, qualités d'outil, recettes, installations, énergie grise.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { energieGrise, multiplicateurQualites, objetsSansEnergieGrise, recette } from "../../commun/src/recettes.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

/** Ces tests ne portent pas sur les Éteints : aucun ne vient de la lisière. */
const JAMAIS_D_ETEINT = () => 1;

function monter(inventaire?: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  if (inventaire) base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), JAMAIS_D_ETEINT);
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const vestige = (type: string) => joueur.bienvenue(0).ressources.find((r) => r.type === type)!;
  const allerA = (x: number, z: number) => (joueur.position = { x, z: z + 0.6, o: 0 });
  return { base, compte, joueur, attendre, dernier, infos, vestige, allerA };
}

test("la ruine de ferme et ses six vestiges sont sur le terrain", () => {
  const { vestige } = monter();
  for (const type of ["velo", "caisse_outils", "batterie_voiture", "ressort", "bache", "barre_metal"]) assert.ok(vestige(type), type);
});

test("sans clé, le vélo ne se démonte pas ; la caisse à outils en donne une", () => {
  // Avec un sac : la caisse rapporte aussi du bric-à-brac (Vestiges, lot 1), et 10 kg de poches n'y suffiraient pas.
  const { joueur, attendre, dernier, infos, vestige, allerA } = monter({ couteau: 1, sac_a_dos: 1 });
  const velo = vestige("velo");
  allerA(velo.x, velo.z);
  joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: velo.id }, verbe: "demonter" });
  assert.match(infos().at(-1)!, /serrer \(niveau 1\), il te faut clé plate.*caisse à outils/);

  const caisse = vestige("caisse_outils");
  allerA(caisse.x, caisse.z);
  joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: caisse.id }, verbe: "fouiller" });
  attendre(4.5);
  const inv = dernier("inventaire")!.inventaire;
  assert.equal(inv.cle_plate, 1);
  assert.equal(inv.tete_hache, 1);

  allerA(velo.x, velo.z);
  joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: velo.id }, verbe: "demonter" });
  attendre(46);
  const apres = dernier("inventaire")!.inventaire;
  assert.equal(apres.roue_velo, 2);
  assert.equal(apres.cadre_velo, 1);
  assert.equal(apres.dynamo_velo, 1);
  assert.deepEqual(dernier("ressource"), { t: "ressource", id: velo.id, disponible: false });
});

test("un outil d'un niveau en dessous ralentit, deux niveaux en dessous empêchent", () => {
  assert.equal(multiplicateurQualites({ couteau: 1 }, { couper: 1 }), 1);
  assert.equal(multiplicateurQualites({ pierre: 1 }, { marteler: 2 }), 1.5);
  assert.equal(multiplicateurQualites({}, { marteler: 2 }), null);
});

test("remmancher la hache : la tête, une branche, de quoi couper et de quoi marteler (une pierre suffit)", () => {
  const sansPierre = monter({ tete_hache: 1, branche: 1, couteau: 1 });
  sansPierre.joueur.recevoir({ t: "fabriquer", recette: "hache" });
  assert.match(sansPierre.infos().at(-1)!, /marteler \(niveau 1\), il te faut pierre ou marteau/);

  const t = monter({ tete_hache: 1, branche: 1, couteau: 1, pierre: 1 });
  t.joueur.recevoir({ t: "fabriquer", recette: "hache" });
  t.attendre(5);
  assert.equal(t.dernier("inventaire")!.inventaire.hache, 1);
  assert.equal(t.dernier("inventaire")!.inventaire.tete_hache, undefined);
});

test("construire un établi devant soi, pas dans la ruine ni trop loin", () => {
  const { joueur, attendre, dernier, infos } = monter({ buche: 4, branche: 6, couteau: 1, pierre: 1 });
  joueur.position = { x: 20, z: 20, o: 0 };
  joueur.recevoir({ t: "fabriquer", recette: "etabli", x: 30, z: 30, o: 0 });
  assert.match(infos().at(-1)!, /trop loin/);
  joueur.recevoir({ t: "fabriquer", recette: "etabli", x: 20, z: 21.8, o: Math.PI });
  attendre(91);
  const i = dernier("installation")!.installation;
  assert.equal(i.type, "etabli");
  assert.equal(dernier("inventaire")!.inventaire.buche, undefined);
  // La décharge du terrain (P-001) est toujours là ; on ne compte que ce qu'on a bâti.
  assert.equal(joueur.bienvenue(0).installations.filter((x) => x.type !== "decharge").length, 1);
});

test("une recette inconnue de la famille est refusée", () => {
  const { joueur, infos } = monter();
  joueur.recevoir({ t: "fabriquer", recette: "fusil-laser" });
  assert.match(infos().at(-1)!, /ne connais pas/);
});

test("chaque objet a une énergie grise ; celle de la hache = matières + travail", () => {
  assert.deepEqual(objetsSansEnergieGrise(), []);
  const r = recette("hache")!;
  // tête (50) + branche (4) + 30 min de travail moyen (250 kcal/h × 0,5 × 0,2 = 25)
  assert.equal(Math.round(energieGrise("hache")), 79);
  assert.ok(r);
});
