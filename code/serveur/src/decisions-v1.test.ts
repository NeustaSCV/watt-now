// Plan 0.10, §12 : les décisions du porteur après la vague 1 (V1-01 à V1-17), appliquées au code. Un test par règle
// qui change : la boîte donne trois roulements, et les recettes en comptent un ou deux ; le banc solaire compensé garde
// sa moyenne d'avant sur la vraie météo ; le moulin de jerricans à la moyenne du banc ; les étagères du coffre (+ 50 kg) ;
// la chance « courante » à 4 % ; plus d'échelle dans la caisse de la ruine ; la matraque ★★★ à 24 Wh ; le Noyé à
// 0,4 m/s en poursuite, sans vaciller ; un charbon à la poulie et au lingot ; le moulin et la rampe sans batterie à 15 m.
// Et ce que le porteur a gardé tel quel (V1-05, V1-06, V1-11 à V1-13), vérifié.

import { test } from "node:test";
import assert from "node:assert/strict";
import { CAPACITE_PACK_CELLULES_WH, CAPACITE_PACK_SOUDE_WH } from "../../commun/src/armes/voltaiques.ts";
import { chosesACharger } from "../../commun/src/banc.ts";
import { ARMES, CAPACITE_PACK_WH, armeDeCle, capaciteChargeArme } from "../../commun/src/combat.ts";
import {
  COMPENSATION_METEO,
  MS_JOUR_CALENDRIER,
  PORTEE_BATTERIE_BASE,
  WATTS_MOULIN,
  meubleABatterieProche,
  productionMoulin,
  productionPanneau,
  whParBeauJour,
} from "../../commun/src/energie.ts";
import { VITESSE_NOYE, encaisser, nouvelEteint, penser, type Eteint, type Humain } from "../../commun/src/eteints.ts";
import { LIGNEES_INSTALLATIONS, capaciteCoffre } from "../../commun/src/lignees.ts";
import { ZONE_STATION } from "../../commun/src/lieux.ts";
import type { InstallationVue, MessageServeur, Verbe } from "../../commun/src/messages.ts";
import { PARTS_DU_TEMPS } from "../../commun/src/meteo.ts";
import { ETAGERES_KG } from "../../commun/src/meubles-niveau2.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { toutDevoile } from "../../commun/src/progression.ts";
import { recette } from "../../commun/src/recettes.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { MS_PAR_HEURE_JEU } from "../../commun/src/temps.ts";
import { CHANCE_CLE_COURANTE, CHANCE_CLE_RARE, CLES_RARES, DEMONTAGE, EN_PLUS_PAR_LIEU, LIEU_DE_FOUILLE, tableDeFouille, tirerCleRare } from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { MeublesNeufs, rendusMeublesNeufs, type ContexteMeublesNeufs } from "./meubles-neufs.ts";

/** Un joueur sur son terrain, ses meubles posés, au début d'un monde (à 7 h). */
function monter(famille: Famille, depart: Inventaire, poses: { type: InstallationVue["type"]; x: number; z: number; niveau?: number; etat?: InstallationVue["etat"] }[] = []) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Hélène", "soleil123", famille);
  base.sauverProgression(compte.id, toutDevoile(famille));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...depart });
  let instant = base.debutMonde() + MS_PAR_HEURE_JEU;
  const ids: number[] = [];
  for (const i of poses) {
    const v = base.ajouterInstallation(compte.id, i.type, i.x, i.z, 0);
    base.sauverEtatInstallation(compte.id, v.id, { majLe: instant, ...(i.etat ?? {}) });
    if (i.niveau) base.sauverNiveauInstallation(compte.id, v.id, i.niveau);
    ids.push(v.id);
  }
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.1) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const sac = () => base.chargerInventaire(compte.id);
  const installation = (id: number) => base.chargerInstallations(compte.id).find((i) => i.id === id)!;
  const utiliser = (id: number, verbe: Verbe) => joueur.recevoir({ t: "interagir", cible: { genre: "installation", id }, verbe });
  return { joueur, attendre, infos, sac, installation, utiliser, ids };
}

// ---------- V1-01 : une boîte = trois roulements ----------

test("V1-01 : la boîte de roulements s'ouvre en trois roulements ; les recettes en comptent un, la charrette deux", () => {
  assert.deepEqual(DEMONTAGE.roulements?.donne, { roulement: 3 });
  assert.deepEqual(DEMONTAGE.roulements?.qualites, {}, "sans outil");
  // Chaque recette compte ses roulements (des objets), plus jamais la boîte.
  const roulementsMontes = LIGNEES_INSTALLATIONS.pedalier!.find((e) => e.id === "roulements_montes")!;
  assert.deepEqual(roulementsMontes.couts, [{ roulement: 1 }]);
  assert.equal(roulementsMontes.cle?.objet, "roulements", "l'idée et l'indice suivent toujours la boîte");
  for (const [id, n] of [["cranequin_leger", 1], ["moulin_jerricans", 1], ["charrette_bras", 2], ["cranequin", 1]] as const) {
    const r = recette(id)!;
    assert.equal(r.ingredients.roulement, n, id);
    assert.equal(r.ingredients.roulements, undefined, `${id} : plus la boîte entière`);
  }
  // Un Mécaniste : 1 + 1 + 1 + 2 = 5 roulements, deux boîtes (le plan).
  assert.equal(Math.ceil((1 + 1 + 1 + 2) / DEMONTAGE.roulements!.donne.roulement!), 2);
});

test("V1-01 : une boîte gardée dans le sac (une partie d'avant) s'ouvre, et ses roulements servent", () => {
  const t = monter("mecanistes", { roulements: 1 });
  t.joueur.recevoir({ t: "demonter", objet: "roulements" });
  t.attendre(4);
  assert.equal(t.sac().roulements, undefined);
  assert.equal(t.sac().roulement, 3);
  assert.match(t.infos().at(-1)!, /3 roulements à billes/);
});

// ---------- V1-02 : le banc solaire compensé ----------

test("V1-02 : le banc compensé garde sur la vraie météo la moyenne d'avant le soleil (80 Wh par jour), à 2 % près", () => {
  // Avant le chantier D : 80 Wh par jour de calendrier, quel que soit le temps. Aujourd'hui, sur 1 000 jours du monde.
  const jours = 1000;
  const moyenne = productionPanneau(0, jours * MS_JOUR_CALENDRIER, 0) / jours;
  assert.ok(Math.abs(moyenne / REGLAGES.panneau_wh_jour - 1) < 0.02, `${moyenne.toFixed(1)} Wh par jour`);
  // La compensation : ≈ × 2 (les facteurs de temps n'en laissaient que 49 %) ; un beau jour : ≈ 162 Wh.
  assert.ok(COMPENSATION_METEO > 1.9 && COMPENSATION_METEO < 2.1, `${COMPENSATION_METEO}`);
  assert.ok(Math.abs(whParBeauJour() - REGLAGES.panneau_wh_jour * COMPENSATION_METEO) < 1e-9);
  // La distribution du temps : une vraie distribution.
  assert.ok(Math.abs(Object.values(PARTS_DU_TEMPS).reduce((s, p) => s + p, 0) - 1) < 1e-9);
});

// ---------- V1-03 : le moulin de jerricans à la moyenne du banc ----------

test("V1-03 : le moulin de jerricans donne en moyenne ce que donne le banc (≈ 6 W au vent, 2 W voilé, rien au soleil)", () => {
  assert.ok(Math.abs(WATTS_MOULIN.fort - 6) < 0.2 && Math.abs(WATTS_MOULIN.faible - 2) < 0.1 && WATTS_MOULIN.calme === 0, JSON.stringify(WATTS_MOULIN));
  assert.ok(Math.abs(WATTS_MOULIN.fort / WATTS_MOULIN.faible - 3) < 1e-9);
  const jours = 1000;
  const moulin = productionMoulin(0, jours * MS_JOUR_CALENDRIER, 0) / jours;
  const banc = productionPanneau(0, jours * MS_JOUR_CALENDRIER, 0) / jours;
  assert.ok(Math.abs(moulin / banc - 1) < 0.02, `moulin ${moulin.toFixed(1)}, banc ${banc.toFixed(1)} Wh par jour`);
  // La poulie garde ses + 50 %.
  assert.ok(Math.abs(productionMoulin(0, jours * MS_JOUR_CALENDRIER, 0, true) / jours / moulin - 1.5) < 1e-9);
});

// ---------- V1-04 : les étagères de l'établi de menuisier ----------

test("V1-04 : les étagères (2 planches rabotées, des clous, à l'établi de menuisier) donnent 50 kg de plus au coffre", () => {
  const r = recette("etageres")!;
  assert.deepEqual([r.ingredients, r.qualites, r.lieu, r.aVenir], [{ planche_fendue: 2, poignee_clous: 1 }, { raboter: 1 }, { genre: "construction", construction: "etabli", niveau: 3 }, undefined]);
  assert.equal(ETAGERES_KG, 50);
  for (const niveau of [1, 2, 3]) assert.equal(capaciteCoffre({ type: "coffre", niveau, etat: { etageres: true } }) - capaciteCoffre({ type: "coffre", niveau }), 50, `niveau ${niveau}`);
  // Les manches + 25 % et la porte de planches : rien ne les propose.
  assert.equal(recette("manches"), undefined);
  assert.equal(recette("porte_planches"), undefined);
  assert.doesNotMatch(LIGNEES_INSTALLATIONS.etabli!.find((e) => e.id === "etabli_menuisier")!.apporte, /manche/i);

  // En jeu : à l'établi de menuisier, le rabot dans le sac.
  const t = monter("mecanistes", { planche_fendue: 2, poignee_clous: 1, rabot: 1, pierre: 10 }, [
    { type: "etabli", x: 20, z: 21.8, niveau: 3 },
    { type: "coffre", x: 21.5, z: 20, etat: { contenu: { pierre: 75 } } },
  ]);
  const [, coffre] = t.ids as [number, number];
  t.joueur.recevoir({ t: "fabriquer", recette: "etageres" });
  t.attendre(30);
  assert.equal(t.sac().etageres, 1, t.infos().slice(-2).join(" | "));
  // Le coffre est plein (150 kg) : une pierre de plus ne rentre pas.
  t.joueur.recevoir({ t: "coffre", id: coffre, sens: "deposer", objet: "pierre", quantite: 1 });
  assert.equal(t.sac().pierre, 10);
  // Les étagères posées : 50 kg de plus, dix pierres (20 kg) rentrent.
  t.utiliser(coffre, "poser_etageres");
  t.attendre(11);
  assert.equal(t.installation(coffre).etat.etageres, true);
  assert.equal(t.sac().etageres, undefined);
  assert.equal(capaciteCoffre(t.installation(coffre)), 200);
  t.joueur.recevoir({ t: "coffre", id: coffre, sens: "deposer", objet: "pierre", quantite: 10 });
  assert.equal(t.sac().pierre, undefined);
  // Une seule fois par coffre ; démonté, il les rend.
  assert.deepEqual(rendusMeublesNeufs(t.installation(coffre)), { etageres: 1 });
});

// ---------- V1-07 : la chance « courante » à 4 % ----------

test("V1-07 : au niveau 2, un objet-clé du niveau 1 sort à 4 % par fouille (le rare : 2 %)", () => {
  assert.equal(CHANCE_CLE_COURANTE, 0.04);
  for (const etape of ["H2A", "H2B", "L2A", "L2B"] as const) assert.equal(CLES_RARES[etape].courantes?.chance, 0.04, etape);
  // Le tirage : le rare d'abord (raté), puis le courant, juste sous 4 % et juste au-dessus.
  const suite = (...v: number[]) => () => v.shift() ?? 0.99;
  assert.ok(tirerCleRare("L2A", suite(0.5, 0.039, 0)) !== null);
  assert.equal(tirerCleRare("L2A", suite(0.5, 0.041, 0)), null);
  assert.equal(CHANCE_CLE_RARE, 0.02);
});

// ---------- V1-10 : plus d'échelle dans la caisse à outils de la ruine ----------

test("V1-10 : l'échelle en aluminium sort des ateliers, plus de la caisse à outils de la ruine", () => {
  assert.equal(LIEU_DE_FOUILLE.caisse_outils, "caisse_ruine");
  const objets = (l: Parameters<typeof tableDeFouille>[0]) => tableDeFouille(l).map(([t]) => t);
  assert.ok(!objets("caisse_ruine").includes("echelle_aluminium"));
  assert.ok(objets("atelier").includes("echelle_aluminium"), "la station et le Moulin la gardent");
  assert.ok(objets("atelier_coop").includes("echelle_aluminium"));
  // Pour le reste, la caisse garde le bric-à-brac de l'atelier.
  assert.deepEqual(objets("caisse_ruine"), objets("atelier").filter((t) => !(t in (EN_PLUS_PAR_LIEU.atelier ?? {}))));
});

// ---------- V1-14 : la matraque ★★★ à 24 Wh ----------

test("V1-14 : la matraque ★★★ tient 24 Wh, son pack soudé (la ★★, sa petite batterie : 50 ; le pack de cellules : 12)", () => {
  assert.equal(CAPACITE_PACK_SOUDE_WH, 24);
  assert.equal(capaciteChargeArme(armeDeCle("matraque_electrique#3")!), 24);
  assert.equal(capaciteChargeArme(armeDeCle("matraque_electrique")!), 24, "la ★★★ est l'arme déclarée");
  assert.equal(capaciteChargeArme(armeDeCle("matraque_electrique#2")!), 50);
  assert.equal(CAPACITE_PACK_CELLULES_WH, CAPACITE_PACK_WH);
  for (const n of [1, 4, 5]) assert.equal(capaciteChargeArme(armeDeCle(`matraque_electrique#${n}`)!), 12, `★${n}`);
  assert.equal(chosesACharger({ "matraque_electrique#1": 1 }, {}, {})[0]!.source, "son pack de cellules");
  assert.equal(chosesACharger({ "matraque_electrique#2": 1 }, {}, {})[0]!.source, "sa petite batterie");
  // La fiche du banc nomme la source.
  const [ligne] = chosesACharger({ "matraque_electrique#3": 1 }, {}, {});
  assert.equal(ligne!.source, "son pack soudé");
  assert.equal(ligne!.capacite, 24);
  // La recette : le pack soudé ou la petite batterie (V1-05 : le pack, tel quel).
  assert.deepEqual(recette("matraque_contacts_soudes")!.auChoix, [{ pack_soude: 1 }, { petite_batterie: 1 }]);
});

// ---------- V1-15 : le Noyé ----------

test("V1-15 : le Noyé va à 0,4 m/s même en poursuite, et ne vacille pas sous les coups au torse", () => {
  const noye = (etat: Eteint["etat"]): Eteint => Object.assign(nouvelEteint(1, 10, 10, etat), { variante: "noye" as const });
  const n = noye("errant");
  const h: Humain = { id: 1, x: 18, z: 10, discret: false, eclaire: false };
  for (let i = 0; i < 20; i++) penser(n, 0.05, [], [h], [n], false, ZONE_STATION, () => 0.5);
  assert.equal(n.etat, "poursuivant");
  const x0 = n.x;
  for (let i = 0; i < 60; i++) penser(n, 0.05, [], [h], [n], false, ZONE_STATION, () => 0.5);
  assert.ok(Math.abs((n.x - x0) / 3 - VITESSE_NOYE) < 0.02, `${((n.x - x0) / 3).toFixed(2)} m/s`);
  // Au torse : ni chute, ni vacillement, ni recul (comme l'Équipé qui encaisse) ; un Errant, lui, vacille.
  const marteau = ARMES.find((a) => a.objet === "marteau")!;
  const de = { x: 9, z: 10 };
  const m = noye("poursuivant");
  for (let i = 0; i < 6; i++) {
    assert.equal(encaisser(m, marteau, false, 1, de, ZONE_STATION), "encaisse", `coup ${i + 1}`);
    assert.equal(m.etourdi, 0);
    assert.equal(m.x, 10, "pas de recul");
  }
  assert.equal(encaisser(nouvelEteint(2, 10, 10, "poursuivant"), marteau, false, 1, de, ZONE_STATION), "vacille");
});

// ---------- V1-16 : un charbon à la poulie et au lingot ----------

test("V1-16 : la poulie et le lingot demandent un charbon, comme les autres recettes de forge", () => {
  assert.deepEqual(recette("poulie_aluminium")!.ingredients, { aluminium: 4, charbon_bois: 1 });
  assert.deepEqual(recette("lingot_aluminium")!.ingredients, { aluminium: 4, charbon_bois: 1 });
});

// ---------- V1-17 : le moulin et la rampe, sur une batterie à 15 m au plus ----------

test("V1-17 : sans batterie de la base à 15 m, le moulin ne charge rien et la rampe reste éteinte ; à 14 m, si", () => {
  assert.equal(PORTEE_BATTERIE_BASE, 15);
  const m = new MeublesNeufs({ debutMonde: () => 0, maintenant: () => 0, alea: () => 0.5 } as unknown as ContexteMeublesNeufs);
  const banc = (x: number): InstallationVue => ({ id: 3, type: "banc_recharge", x, z: 0, o: 0, etat: { batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: 100 } } });
  // Un jour de calendrier de pluie et de nuit, depuis l'instant 0 : le monde commence au soleil, on prend un long temps.
  const fin = 3 * MS_JOUR_CALENDRIER;
  for (const [x, branche] of [[16, false], [14, true]] as const) {
    const poses: InstallationVue[] = [
      { id: 1, type: "moulin_jerricans", x: 0, z: 0, o: 0, etat: { majLe: 0 } },
      { id: 2, type: "rampe_led", x: 0, z: 0, o: 0, etat: { majLe: 0 } },
      banc(x),
    ];
    assert.equal(meubleABatterieProche(poses[0]!, poses) !== null, branche, `banc à ${x} m`);
    const bilan = m.majBase(poses, fin);
    assert.ok(bilan.produit > 0, "le vent a soufflé");
    if (branche) {
      assert.ok(bilan.stocke > 0, "à 14 m, le moulin charge");
      assert.equal(poses[1]!.etat.courant, true, "à 14 m, la rampe s'allume");
    } else {
      assert.equal(bilan.stocke, 0, "à 16 m, le moulin ne charge rien");
      assert.equal(bilan.perdu, bilan.produit);
      assert.equal(poses[2]!.etat.charges!.batterie_voiture, 100, "la batterie n'a pas bougé");
      assert.equal(poses[1]!.etat.courant, false, "à 16 m, la rampe reste éteinte");
    }
  }
});

// ---------- Gardés tels quels (V1-05, V1-06, V1-11, V1-12, V1-13) ----------

test("V1-05, V1-06, V1-11 à V1-13 : le pack soudé, l'huile de la lanterne, la machette ficelée, la hache, l'empennage", () => {
  const pack = recette("pack_soude")!;
  assert.deepEqual([pack.ingredients, pack.qualites, pack.duree], [{ cellule_lithium: 6, led: 1, fil_cuivre: 1 }, { souder: 1 }, 30]);
  // L'huile de la lanterne fixe : un bidon, payé une fois à la construction.
  const lanterne = LIGNEES_INSTALLATIONS.torche_plantee!.find((e) => e.id === "lanterne_fixe")!;
  assert.equal(lanterne.couts[0]!.bidon_huile, 1);
  // La machette au manche ficelé : un maillon ★★ (le ★★★ demande le manche de caoutchouc, à la forge ventilée).
  const machette = recette("machette_forgee")!;
  assert.ok(machette.facteursEtoiles!({ ressort_lames: 2 }, undefined as never, undefined).includes(2));
  assert.equal(recette("machette_forgee_caoutchouc")!.ingredients.caoutchouc, 2);
  // La hache forgée : deux caoutchoucs à la place de la bûche du manche.
  assert.equal(recette("hache_forgee")!.ingredients.caoutchouc, 2);
  assert.equal(recette("hache_forgee")!.ingredients.buche, undefined);
  // L'empennage de plastique, au choix sur les carreaux à plumes.
  for (const id of ["carreaux_os", "carreaux_clou", "carreaux_acier"]) assert.ok(recette(id)!.auChoix?.some((c) => "plastique" in c), id);
});
