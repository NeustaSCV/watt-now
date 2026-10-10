// Plan 0.8, chantier 6 : le couchage, le stockage, l'établi, la lumière. L'abri fermé, le coffre cerclé, le râtelier à
// outils, l'établi à étau (Serrer 3), la torche plantée, les outils de fortune et le marteau remmanché.

import { test } from "node:test";
import assert from "node:assert/strict";
import { toutDevoile } from "../../commun/src/progression.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { SOMMEIL_ABRI, SOMMEIL_ABRI_FERME_REPLI, capaciteCoffre, lignee } from "../../commun/src/lignees.ts";
import { POSTE_ETABLI_ETAU, etauMonte, outilsAPortee } from "../../commun/src/outils-a-portee.ts";
import { QUALITES_OBJETS, niveauQualite, recette } from "../../commun/src/recettes.ts";
import { MS_PAR_HEURE_JEU, heureDeJeu } from "../../commun/src/temps.ts";
import { extinctionTorche, stimuliTorches, torcheAllumee, torcheConsumee } from "../../commun/src/torche.ts";
import { outilsManquants } from "../../commun/src/aide-fabrication.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>, avant?: (base: Base, id: number) => void) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "voltaiques");
  base.sauverProgression(compte.id, toutDevoile("voltaiques"));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  avant?.(base, compte.id);
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.9);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const sac = () => dernier("inventaire")?.inventaire ?? base.chargerInventaire(compte.id);
  const agir = (id: number, verbe: string, secondes = 6) => {
    joueur.recevoir({ t: "interagir", cible: { genre: "installation", id }, verbe: verbe as never });
    attendre(secondes);
  };
  const installation = (id: number) => base.chargerInstallations(compte.id).find((i) => i.id === id)!;
  const confort = (id: number) => (joueur as unknown as { confortDuSommeil(i: unknown): number }).confortDuSommeil(installation(id));
  return { base, compte, joueur, attendre, dernier, infos, sac, agir, installation, confort, maintenant: () => instant };
}

test("l'abri fermé : la toile de jute du Moulin, des clous, Couper 1 et Marteler 1 ; sommeil ×1,45 (×1,35 sans la toile)", () => {
  const t = monter({ toile_jute: 1, branche: 10, corde: 1, poignee_clous: 1, couteau: 1, pierre: 1 }, (b, id) => {
    b.ajouterInstallation(id, "abri", 21, 20, 0);
    b.sauverNiveauInstallation(id, 1, 2);
  });
  t.agir(1, "ameliorer");
  assert.equal(t.installation(1).niveau, 3);
  assert.deepEqual(t.sac(), { sac_a_dos: 1, couteau: 1, pierre: 1 }, "la toile, les branches, la corde et les clous sont posés");
  assert.ok(Math.abs(t.confort(1) - 1.45) < 1e-9);
  assert.equal(SOMMEIL_ABRI[2], 1.45);
  // Le repli : 4 chiffons et 2 sacs plastique cousus.
  const u = monter({ chiffons: 4, sac_plastique: 2, branche: 10, corde: 1, poignee_clous: 1, couteau: 1, pierre: 1 }, (b, id) => {
    b.ajouterInstallation(id, "abri", 21, 20, 0);
    b.sauverNiveauInstallation(id, 1, 2);
  });
  u.agir(1, "ameliorer");
  assert.equal(u.installation(1).niveau, 3);
  assert.deepEqual(u.installation(1).etat.payes?.at(-1), { branche: 10, corde: 1, poignee_clous: 1, chiffons: 4, sac_plastique: 2 }, "fermé par le repli");
  // Plan 0.8 §9.2 : sans la toile de jute, l'abri fermé est moins chaud.
  assert.ok(Math.abs(u.confort(1) - 1.35) < 1e-9, `repli : ×1,35 (et non ${u.confort(1)})`);
  assert.equal(SOMMEIL_ABRI_FERME_REPLI, 1.35);
  // Redescendu, c'est de nouveau l'abri garni (×1,3).
  u.agir(1, "redescendre", 30);
  assert.equal(u.installation(1).niveau, 2);
  assert.ok(Math.abs(u.confort(1) - 1.3) < 1e-9);
  // La clé, avec son idée et son indice, écrits avec le nom du lieu.
  const ferme = lignee("abri")!.find((e) => e.id === "abri_ferme")!;
  assert.equal(ferme.cle?.objet, "toile_jute");
  assert.equal(ferme.cle?.ou, "L1B");
  assert.match(ferme.cle!.indice[1], /Moulin du Gué/);
  assert.equal(ferme.etapeLieu, "L1");
});

test("l'abri garni absorbe un lit de branchages posé à côté ; le lit ne se pose plus à part", () => {
  const t = monter({}, (b, id) => {
    b.ajouterInstallation(id, "abri", 21, 20, 0);
    b.ajouterInstallation(id, "lit_branchages", 22, 21, 0);
  });
  t.agir(1, "ameliorer");
  assert.equal(t.installation(1).niveau, 2);
  assert.equal(t.base.chargerInstallations(t.compte.id).some((i) => i.type === "lit_branchages"), false);
  assert.deepEqual(t.installation(1).etat.payes, [{ branche: 6 }], "le lit absorbé sera rendu au démontage");
  assert.equal(recette("lit_branchages"), undefined, "plus de recette du lit (I25)");
});

test("le coffre cerclé tient 250 kg et demande Marteler 2 : le marteau remmanché suffit, la pierre non", () => {
  const cout = { feuillards: 1, poignee_clous: 1, buche: 2 };
  const pierre = monter({ ...cout, pierre: 1 }, (b, id) => b.ajouterInstallation(id, "coffre", 21, 20, 0));
  pierre.agir(1, "ameliorer");
  assert.equal(pierre.installation(1).niveau ?? 1, 1, "la pierre ne martèle qu'à 1");
  assert.match(pierre.infos().at(-1)!, /marteler \(niveau 2\)/);

  // Le marteau remmanché, à la main : la tête de marteau de la caisse et une branche.
  const t = monter({ ...cout, tete_marteau: 1, branche: 1, couteau: 1, pierre: 1 }, (b, id) => b.ajouterInstallation(id, "coffre", 21, 20, 0));
  t.joueur.recevoir({ t: "fabriquer", recette: "marteau" });
  t.attendre(4);
  assert.equal(t.sac().marteau, 1);
  assert.equal(QUALITES_OBJETS.marteau?.marteler, 2);
  t.agir(1, "ameliorer");
  assert.equal(t.installation(1).niveau, 2);
  assert.equal(capaciteCoffre(t.installation(1)), 250);
  // Le repli : la barre de la ruine, martelée en bandes.
  const u = monter({ barre_metal: 1, poignee_clous: 1, buche: 2, marteau: 1 }, (b, id) => b.ajouterInstallation(id, "coffre", 21, 20, 0));
  u.agir(1, "ameliorer");
  assert.equal(u.installation(1).niveau, 2);
  // La réserve couverte attend le niveau 2 (les tôles ondulées).
  const reserve = lignee("coffre")![2]!;
  assert.equal(reserve.aVenir, "niveau 2");
  u.agir(1, "ameliorer");
  assert.match(u.infos().at(-1)!, /plus tard/i);
});

test("une hache rangée au râtelier, à 3 m, donne Fendre au coffre ; plus loin, non", () => {
  const t = monter({ buche: 6, branche: 10, corde: 2, couteau: 1, pierre: 1, hache: 1 });
  t.joueur.recevoir({ t: "fabriquer", recette: "ratelier_outils", x: 20, z: 21.8, o: 0 });
  t.attendre(4);
  const ratelier = t.base.chargerInstallations(t.compte.id).find((i) => i.type === "ratelier_outils")!;
  assert.ok(ratelier, "le râtelier est posé");
  // Il ne prend que les outils.
  t.joueur.recevoir({ t: "coffre", id: ratelier.id, sens: "deposer", objet: "buche", quantite: 1 });
  assert.match(t.infos().at(-1)!, /que les outils/);
  t.joueur.recevoir({ t: "coffre", id: ratelier.id, sens: "deposer", objet: "hache", quantite: 1 });
  assert.equal(t.sac().hache, undefined, "la hache est au râtelier");
  assert.equal(t.installation(ratelier.id).etat.contenu?.hache, 1);
  // Loin du râtelier : il manque Fendre.
  t.joueur.position = { x: 30, z: 30, o: 0 };
  t.joueur.recevoir({ t: "fabriquer", recette: "coffre", x: 30, z: 31.8, o: 0 });
  assert.match(t.infos().at(-1)!, /fendre \(niveau 1\)/);
  // À côté : le coffre se bâtit.
  t.joueur.position = { x: 20, z: 20, o: 0 };
  t.joueur.recevoir({ t: "fabriquer", recette: "coffre", x: 18.2, z: 20, o: 0 });
  t.attendre(4);
  assert.ok(t.base.chargerInstallations(t.compte.id).some((i) => i.type === "coffre"), "le coffre est posé");
  // Plein d'outils, il ne se démonte pas.
  t.agir(ratelier.id, "demonter_installation");
  assert.match(t.infos().at(-1)!, /outils du râtelier/);
});

test("l'établi à étau donne Serrer 3 à 3 m ; l'étau dans le sac ne serre pas ; monté au serre-joint, pas de serrage fort", () => {
  // L'étau porté : rien (décision du porteur, 2026-10-10).
  assert.equal(niveauQualite({ etau: 1 }, "serrer"), 0);
  const t = monter({ etau: 1, cle_plate: 1 }, (b, id) => b.ajouterInstallation(id, "etabli", 21, 20, 0));
  t.agir(1, "ameliorer");
  const etabli = t.installation(1);
  assert.equal(etabli.niveau, 2);
  assert.equal(t.sac().etau, undefined, "l'étau est boulonné sur l'établi");
  assert.ok(etauMonte(etabli));
  const pres = outilsAPortee({ x: 20, z: 20, installations: [etabli], inventaire: {} });
  assert.equal(pres[POSTE_ETABLI_ETAU as never], 1);
  assert.equal(niveauQualite(pres, "serrer"), 3);
  assert.equal(niveauQualite(outilsAPortee({ x: 30, z: 30, installations: [etabli], inventaire: {} }), "serrer"), 0, "à plus de 3 m, rien");
  // L'aide nomme l'établi à étau quand Serrer 3 manque.
  assert.match(outilsManquants({ serrer: 3 }, {}).join(" "), /établi à étau/);
  // Ses recettes : le maillet se fait à côté.
  const u = monter({ buche: 1, branche: 1, couteau: 1 }, (b, id) => {
    b.ajouterInstallation(id, "etabli", 21, 20, 0);
    b.sauverNiveauInstallation(id, 1, 2);
    b.sauverEtatInstallation(id, 1, { payes: [{ etau: 1 }] });
  });
  u.joueur.recevoir({ t: "fabriquer", recette: "maillet" });
  u.attendre(4);
  assert.equal(u.sac().maillet, 1);
  // Le repli : le serre-joint de fortune. L'établi monte, mais ne serre pas fort : pas de maillet.
  const v = monter({ serre_joint_fortune: 1, cle_plate: 1, buche: 1, branche: 1, couteau: 1 }, (b, id) => b.ajouterInstallation(id, "etabli", 21, 20, 0));
  v.agir(1, "ameliorer");
  assert.equal(v.installation(1).niveau, 2);
  assert.equal(etauMonte(v.installation(1)), false);
  v.joueur.recevoir({ t: "fabriquer", recette: "maillet" });
  assert.match(v.infos().at(-1)!, /serrer \(niveau 3\).*établi à étau/);
});

test("les planches fendues : le coin y reste, le maillet revient", () => {
  const t = monter({ buche: 1, coin_bois: 1, maillet: 1 }, (b, id) => {
    b.ajouterInstallation(id, "etabli", 21, 20, 0);
    b.sauverNiveauInstallation(id, 1, 2);
    b.sauverEtatInstallation(id, 1, { payes: [{ etau: 1 }] });
  });
  t.joueur.recevoir({ t: "fabriquer", recette: "planches_fendues" });
  t.attendre(4);
  assert.deepEqual(t.sac(), { sac_a_dos: 1, planche_fendue: 2, maillet: 1 });
});

test("les outils de fortune se font à la main : serre-joint, scie, marteau, coin", () => {
  const t = monter({ branche: 3, corde: 1, disque_scie: 1, barre_metal: 1, couteau: 1, pierre: 1 });
  t.joueur.position = { x: 40, z: 40, o: 0 };
  for (const id of ["serre_joint_fortune", "scie_fortune", "marteau_fortune", "coin_bois"]) {
    assert.equal(recette(id)!.lieu.genre, "main", id);
    t.joueur.recevoir({ t: "fabriquer", recette: id });
    t.attendre(4);
  }
  const sac = t.sac();
  assert.equal(sac.serre_joint_fortune, 1);
  assert.equal(sac.scie_fortune, 1);
  assert.equal(sac.marteau_fortune, 1);
  assert.equal(sac.coin_bois, 1);
  assert.equal(niveauQualite(sac, "marteler"), 2, "le marteau de fortune martèle à 2");
});

test("la torche plantée : on l'allume, elle éclaire jusqu'au matin suivant, se voit la nuit, puis s'éteint", () => {
  const t = monter({ branche: 1, chiffons: 1, graisse: 1, couteau: 1, briquet: 1 });
  t.joueur.recevoir({ t: "fabriquer", recette: "torche_plantee", x: 20, z: 21.2, o: 0 });
  t.attendre(3);
  const torche = t.base.chargerInstallations(t.compte.id).find((i) => i.type === "torche_plantee")!;
  assert.ok(torche, "la torche est plantée");
  assert.equal(torcheAllumee(torche, t.maintenant()), false, "plantée, elle n'est pas encore allumée");
  t.agir(torche.id, "allumer", 4);
  const allumee = t.installation(torche.id);
  assert.ok(torcheAllumee(allumee, t.maintenant()));
  assert.equal(stimuliTorches([allumee], t.maintenant(), true)[0]?.genre, "lumiere", "la nuit, elle compte dans la signature");
  assert.equal(stimuliTorches([allumee], t.maintenant(), false).length, 0, "le jour, non");
  // Plan 0.8 §9.2 (chantier 13) : allumée le matin (vers 6 h), elle brûle jusqu'au lendemain 5 h 30.
  const debut = t.base.debutMonde();
  assert.equal(heureDeJeu(allumee.etat.eteinteLe!, debut), 5.5, "elle s'éteint à 5 h 30");
  const reste = allumee.etat.eteinteLe! - t.maintenant();
  assert.ok(reste > 20 * MS_PAR_HEURE_JEU && reste < 24 * MS_PAR_HEURE_JEU, `jusqu'au matin suivant : ${reste / MS_PAR_HEURE_JEU} h`);
  t.attendre(reste / 1000 - 10, 2);
  assert.ok(torcheAllumee(t.installation(torche.id), t.maintenant()), "à 5 h 29, elle brûle encore");
  t.attendre(12, 1);
  const apres = t.installation(torche.id);
  assert.ok(torcheConsumee(apres, t.maintenant()));
  assert.equal(stimuliTorches([apres], t.maintenant(), true).length, 0);
  t.agir(torche.id, "allumer", 1);
  assert.match(t.infos().at(-1)!, /consumée/);
});

test("la torche plantée brûle jusqu'au matin suivant, quelle que soit l'heure où on l'allume", () => {
  // Le monde part à 6 h : une heure de jeu par minute réelle.
  const a = (heure: number) => ((heure - 6 + 24) % 24) * MS_PAR_HEURE_JEU;
  const duree = (heure: number) => (extinctionTorche(a(heure), 0) - a(heure)) / MS_PAR_HEURE_JEU;
  assert.equal(duree(21), 8.5, "à 21 h : toute la nuit");
  assert.equal(duree(3), 2.5, "à 3 h : jusqu'à 5 h 30");
  assert.equal(duree(12), 17.5, "à midi : jusqu'au lendemain matin");
  assert.equal(duree(5.5), 24, "pile à 5 h 30 : jusqu'au matin d'après");
  for (const h of [0, 4, 7, 15, 20, 22.75]) assert.equal(heureDeJeu(extinctionTorche(a(h), 0), 0), 5.5, `${h} h`);
});