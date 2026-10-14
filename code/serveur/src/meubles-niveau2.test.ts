// Plan 0.10, chantier C : les dix meubles du niveau 2. Chaque évolution se bâtit avec son objet-clé, le niveau d'avant
// posé et l'outil ; sans l'un des trois, elle est refusée, et aucun repli ne la remplace. Puis leurs effets, mesurés :
// le sommeil, les kilos, la portée de la lumière et de la cloche, le bois du four, les Wh et l'effort des roulements.

import { test } from "node:test";
import assert from "node:assert/strict";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import { LIGNEES_INSTALLATIONS, VOIE_SURFACE, capaciteCoffre, contenanceRecuperateur, effetsFeu, type Etape } from "../../commun/src/lignees.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { CLOCHE_ALARME, PORTEE_LANTERNE, ROULEMENTS } from "../../commun/src/meubles-niveau2.ts";
import { etapesAvecCle, toutDevoile } from "../../commun/src/progression.ts";
import { recette, type TypeInstallation } from "../../commun/src/recettes.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { LUMIERE_NUIT } from "../../commun/src/signature.ts";
import { bruler } from "../../commun/src/survie.ts";
import { stimuliTorches } from "../../commun/src/torche.ts";
import { KCAL_POMPER } from "../../commun/src/forge.ts";
import { Base } from "./base.ts";
import { Forge, type ContexteForge } from "./forge.ts";
import { Joueur } from "./joueur.ts";

/** Un joueur sur son terrain, une installation (ou un feu) posée à 1 m, au niveau dit. */
function monter(famille: Famille, inventaire: Record<string, number>, pose: { type: TypeInstallation | "feu"; niveau: number; etat?: Record<string, unknown> } | null) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", famille);
  base.sauverProgression(compte.id, toutDevoile(famille));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  let id = 0;
  if (pose?.type === "feu") base.sauverFeu(compte.id, { id: 1, x: 21, z: 20, bois: 2, allume: false, majLe: base.debutMonde() + 60_000, niveau: pose.niveau });
  else if (pose) {
    id = base.ajouterInstallation(compte.id, pose.type, 21, 20, 0).id;
    if (pose.niveau > 1) base.sauverNiveauInstallation(compte.id, id, pose.niveau);
    if (pose.etat) base.sauverEtatInstallation(compte.id, id, pose.etat as never);
  }
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.9);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const sac = () => base.chargerInventaire(compte.id);
  const niveau = () => (pose?.type === "feu" ? (base.chargerFeux(compte.id)[0]?.niveau ?? 1) : (base.chargerInstallations(compte.id).find((i) => i.id === id)?.niveau ?? 1));
  const installation = () => base.chargerInstallations(compte.id).find((i) => i.id === id)!;
  const agir = (verbe: string, secondes = 15) => {
    joueur.recevoir({ t: "interagir", cible: pose?.type === "feu" ? { genre: "feu", id: 1 } : { genre: "installation", id }, verbe: verbe as never });
    attendre(secondes);
  };
  return { base, compte, joueur, attendre, infos, sac, niveau, installation, agir, recus, id, maintenant: () => instant };
}

/** S'endormir sur place (fatigué : sinon on n'a pas sommeil). */
function endormir(j: Joueur): void {
  const x = j as unknown as { besoins: { repos: number }; endormir(abri: boolean): void };
  x.besoins = { ...x.besoins, repos: 0.2 };
  x.endormir(false);
}

/** Les dix évolutions : leur lignée, le niveau d'avant, les matériaux, l'objet-clé (ou l'outil-clé), l'outil. */
const DIX: readonly { id: string; type: TypeInstallation | "feu"; avant: number; famille: Famille; couts: Record<string, number>; cle: string; outil: Record<string, number> }[] = [
  { id: "reserve_couverte", type: "coffre", avant: 2, famille: "mecanistes", couts: { tube_aluminium: 4, rouleau_fil_fer: 1, poignee_clous: 1, toles_ondulees: 1 }, cle: "toles_ondulees", outil: { marteau: 1, couteau: 1 } },
  { id: "abri_double", type: "abri", avant: 3, famille: "mecanistes", couts: { bache: 1, chiffons: 4, couvertures_laine: 1 }, cle: "couvertures_laine", outil: { couteau: 1 } },
  { id: "lanterne_fixe", type: "torche_plantee", avant: 1, famille: "mecanistes", couts: { tube_aluminium: 1, aluminium: 2, bidon_huile: 1, lanterne_tempete: 1 }, cle: "lanterne_tempete", outil: { couteau: 1 } },
  { id: "poste_montage", type: "banc_recharge", avant: 1, famille: "voltaiques", couts: { fil_cuivre: 1, resistance: 1, aimant: 1, plastique: 2 }, cle: "fer_souder", outil: { fer_souder: 1 } },
  { id: "roulements_montes", type: "pedalier", avant: 1, famille: "mecanistes", couts: { roulements: 1 }, cle: "roulements", outil: { cle_plate: 1 } },
  { id: "four_terre", type: "feu", avant: 3, famille: "mecanistes", couts: { glaise: 4, pierre: 2, bouteille_verre: 6, porte_four: 1 }, cle: "porte_four", outil: { marteau: 1 } },
  { id: "recuperateur_jerrican", type: "recuperateur_pluie", avant: 2, famille: "mecanistes", couts: { caoutchouc: 2, plastique: 1, jerrican_20l: 1 }, cle: "jerrican_20l", outil: { couteau: 1 } },
  { id: "etabli_menuisier", type: "etabli", avant: 2, famille: "mecanistes", couts: { buche: 2, barre_metal: 1, poignee_clous: 1 }, cle: "rabot", outil: { rabot: 1 } },
  { id: "cloche_alarme", type: "alarme_boites", avant: 1, famille: "mecanistes", couts: { tube_aluminium: 2, rouleau_fil_fer: 1, petit_ressort: 1, cloche_bronze: 1 }, cle: "cloche_bronze", outil: { marteau: 1 } },
  { id: "forge_ventilee", type: "forge", avant: 1, famille: "charbonniers", couts: { pierre: 3, glaise: 2, barre_metal: 1, soufflet_forge: 1 }, cle: "soufflet_forge", outil: { marteau: 1 } },
];

function etapeDe(id: string): Etape {
  return [...VOIE_SURFACE, ...Object.values(LIGNEES_INSTALLATIONS).flatMap((l) => l ?? [])].find((e) => e.id === id)!;
}

test("les dix évolutions du niveau 2 sont jouables, aux coûts du plan (§3.1), chacune avec son objet-clé et sans repli", () => {
  for (const d of DIX) {
    const e = etapeDe(d.id);
    assert.ok(e, d.id);
    assert.equal(e.aVenir, undefined, `${d.id} : jouable`);
    assert.equal(e.niveau, d.avant + 1, `${d.id} : au-dessus du niveau d'avant`);
    assert.equal(e.etapeLieu, "L2", d.id);
    assert.equal(e.couts.length, 1, `${d.id} : une seule façon`);
    const outilCle = e.cle?.qualite !== undefined;
    assert.deepEqual(e.couts[0], d.couts, d.id);
    assert.ok(e.cle, `${d.id} : un objet-clé`);
    assert.equal("replis" in e.cle!, false, `${d.id} : aucun repli`);
    if (!outilCle) assert.equal(e.cle!.objet, d.cle, d.id);
    // Les textes : jamais « clé » ; l'indice dit le type de lieu, puis le lieu (jamais « pas encore sur ta carte »).
    for (const t of [e.apporte, e.examen, e.cle!.idee, e.cle!.ideePlusTard, ...e.cle!.indice]) assert.ok(!/\bclés?\b/i.test(t), `${d.id} : ${t}`);
    assert.match(e.cle!.indice[1], e.cle!.ou === "L2A" ? /Grand Hôtel des Flots/ : /phare du cap/, d.id);
  }
  // Les étapes à clé du niveau 2 sont bien celles-là, toutes : l'idée « tu y penses » et l'indice suivent.
  const duNiveau2 = etapesAvecCle().filter((x) => x.etape.etapeLieu === "L2").map((x) => x.etape.id).sort();
  assert.deepEqual(duNiveau2, DIX.map((d) => d.id).sort());
});

test("chaque évolution se bâtit avec son objet-clé, le niveau d'avant posé et l'outil ; refusée sans l'un des trois", () => {
  for (const d of DIX) {
    const cible = d.avant + 1;
    // Tout est là : elle se bâtit, et l'objet-clé est posé (il quitte le sac).
    const t = monter(d.famille, { ...d.couts, ...d.outil }, { type: d.type, niveau: d.avant });
    t.agir("ameliorer");
    assert.equal(t.niveau(), cible, `${d.id} : ${t.infos().slice(-2).join(" | ")}`);
    if (!(d.cle in d.outil)) assert.equal(t.sac()[d.cle as never] ?? 0, 0, `${d.id} : l'objet-clé est posé`);
    // Sans l'objet-clé (ou l'outil-clé) : refusée, ce qui manque est dit, aucun repli n'est proposé.
    const sansCle: Record<string, number> = { ...d.couts, ...d.outil };
    delete sansCle[d.cle];
    const u = monter(d.famille, sansCle, { type: d.type, niveau: d.avant });
    u.agir("ameliorer");
    assert.equal(u.niveau(), d.avant, `${d.id} : sans objet-clé`);
    assert.ok(!u.infos().some((i) => /\bOu\b/.test(i)), `${d.id} : aucun repli dans « ${u.infos().at(-1)} »`);
    // Sans l'outil (quand il n'est pas lui-même l'objet-clé ; au four, la pierre du coût martèle déjà) : refusée.
    if (!(d.cle in d.outil) && d.type !== "feu") {
      const v = monter(d.famille, { ...d.couts }, { type: d.type, niveau: d.avant });
      v.agir("ameliorer");
      assert.equal(v.niveau(), d.avant, `${d.id} : sans outil`);
      assert.ok((v.sac()[d.cle as never] ?? 0) > 0, `${d.id} : l'objet-clé reste dans le sac`);
    }
    // Sans le niveau d'avant (un cran plus bas) : on ne saute pas d'étape, l'objet-clé reste dans le sac.
    if (d.avant > 1) {
      const w = monter(d.famille, { ...d.couts, ...d.outil }, { type: d.type, niveau: d.avant - 1 });
      w.agir("ameliorer");
      assert.ok(w.niveau() < cible, `${d.id} : sans le niveau d'avant`);
      if (!(d.cle in d.outil)) assert.ok((w.sac()[d.cle as never] ?? 0) > 0, `${d.id} : l'objet-clé reste dans le sac`);
    }
  }
});

// ---------- Les effets ----------

test("la réserve couverte garde 400 kg ; l'abri doublé donne un sommeil ×1,6 ; le jerrican tient 20 L", () => {
  const r = monter("mecanistes", { tube_aluminium: 4, rouleau_fil_fer: 1, poignee_clous: 1, toles_ondulees: 1, marteau: 1, couteau: 1 }, { type: "coffre", niveau: 2 });
  r.agir("ameliorer");
  assert.equal(capaciteCoffre(r.installation()), 400);
  const a = monter("mecanistes", { bache: 1, chiffons: 4, couvertures_laine: 1, couteau: 1 }, { type: "abri", niveau: 3 });
  a.agir("ameliorer");
  const confort = (a.joueur as unknown as { confortDuSommeil(i: unknown): number }).confortDuSommeil(a.installation());
  assert.ok(Math.abs(confort - 1.6) < 1e-9, `sommeil ×${confort}`);
  const j = monter("mecanistes", { caoutchouc: 2, plastique: 1, jerrican_20l: 1, couteau: 1 }, { type: "recuperateur_pluie", niveau: 2 });
  j.agir("ameliorer");
  assert.equal(contenanceRecuperateur(j.installation()), 20);
});

test("la lanterne fixe : 14 m de lumière chaque nuit, d'elle-même, sans flamme nue ; rien le jour ; rien à allumer", () => {
  const t = monter("mecanistes", { tube_aluminium: 1, aluminium: 2, bidon_huile: 1, lanterne_tempete: 1, couteau: 1, briquet: 1 }, { type: "torche_plantee", niveau: 1 });
  t.agir("ameliorer");
  const l = t.installation();
  assert.equal(l.niveau, 2);
  const nuit = stimuliTorches([l], t.maintenant(), true);
  assert.equal(nuit.length, 1);
  assert.equal(nuit[0]!.genre, "lumiere");
  // Sans flamme nue : elle se voit comme une lanterne portée (14 m), pas comme une torche (30 m).
  assert.equal(nuit[0]!.portee, LUMIERE_NUIT.lanterne.portee);
  assert.equal(PORTEE_LANTERNE, 14);
  assert.equal(stimuliTorches([l], t.maintenant(), false).length, 0, "le jour, rien");
  // Une nuit plus tard (et toutes les autres), elle brille encore : elle ne se consume pas.
  assert.equal(stimuliTorches([l], t.maintenant() + 10 * 24 * 60_000, true).length, 1);
  t.agir("allumer", 5);
  assert.match(t.infos().at(-1)!, /d'elle-même/);
  assert.equal(t.sac().briquet, 1);
});

test("la cloche d'alarme : un Éteint qui passe la fait sonner, on l'entend à 40 m, et elle réveille le dormeur", () => {
  const t = monter("mecanistes", { tube_aluminium: 2, rouleau_fil_fer: 1, petit_ressort: 1, cloche_bronze: 1, marteau: 1 }, { type: "alarme_boites", niveau: 1 });
  t.agir("ameliorer");
  assert.equal(t.niveau(), 2);
  // Endormi sur place : la cloche le réveille.
  endormir(t.joueur);
  assert.ok((t.joueur as unknown as { sommeil: unknown }).sommeil, "il dort");
  (t.joueur as unknown as { eteints: unknown[] }).eteints = [nouvelEteint(1, 21.5, 20.5, "errant")];
  t.attendre(1);
  const alarme = t.recus.find((m) => m.t === "alarme") as Extract<MessageServeur, { t: "alarme" }> | undefined;
  assert.equal(alarme?.cloche, true);
  assert.equal((t.joueur as unknown as { sommeil: unknown }).sommeil, null, "réveillé");
  assert.ok(t.infos().some((i) => /La cloche sonne/.test(i)));
  // Le son porte à 40 m (les boîtes : 14 m).
  const sons = (t.joueur as unknown as { sourcesTerrain(nuit: boolean): { genre: string; portee: number }[] }).sourcesTerrain(false).filter((s) => s.genre === "son");
  assert.ok(sons.some((s) => s.portee === CLOCHE_ALARME.portee), JSON.stringify(sons));
  assert.equal(CLOCHE_ALARME.portee, 40);
});

test("l'alarme à boîtes ne réveille pas le dormeur (elle prévient qui est éveillé)", () => {
  const t = monter("mecanistes", {}, { type: "alarme_boites", niveau: 1 });
  endormir(t.joueur);
  (t.joueur as unknown as { eteints: unknown[] }).eteints = [nouvelEteint(1, 21.5, 20.5, "errant")];
  t.attendre(1);
  assert.ok(t.recus.some((m) => m.t === "alarme" && !m.cloche));
  assert.ok((t.joueur as unknown as { sommeil: unknown }).sommeil, "il dort encore");
});

test("le four de terre brûle deux fois moins de bois qu'un feu de camp", () => {
  const t = monter("mecanistes", { glaise: 4, pierre: 2, bouteille_verre: 6, porte_four: 1, marteau: 1 }, { type: "feu", niveau: 3 });
  t.agir("ameliorer");
  assert.equal(t.niveau(), 4);
  assert.equal(effetsFeu({ niveau: 4 }).bois, 0.5);
  const camp = 10 - bruler({ bois: 10, allume: true, niveau: 1 }, 2).bois;
  const four = 10 - bruler({ bois: 10, allume: true, niveau: 4 }, 2).bois;
  assert.ok(Math.abs(four / camp - 0.5) < 1e-9, `${four} kg contre ${camp}`);
});

test("🔥 la forge ventilée, avec son soufflet de forge : on ne pompe plus", () => {
  const t = monter("charbonniers", { pierre: 3, glaise: 2, barre_metal: 1, soufflet_forge: 1, marteau: 1 }, { type: "forge", niveau: 1, etat: { enclume: "depanneur" } });
  t.agir("ameliorer");
  assert.equal(t.niveau(), 2);
  const forge = t.installation();
  const ctx = { installationsProches: () => [forge] } as unknown as ContexteForge;
  const lame = recette("machette_forgee")!;
  assert.equal(new Forge(ctx).kcalEnPlus(lame), 0);
  // Une forge ventilée sans soufflet de forge (impossible en jeu depuis la 0.10) pomperait.
  const sans = { ...forge, etat: { ...forge.etat, payes: [] } };
  assert.equal(new Forge({ installationsProches: () => [sans] } as unknown as ContexteForge).kcalEnPlus(lame), KCAL_POMPER);
});

test("⚙️ les roulements montés : 30 % de Wh en plus pour 30 % d'effort en moins", () => {
  const etat = { alternateur: true, batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: 0 } };
  const mesurer = (niveau: number) => {
    const t = monter("mecanistes", {}, { type: "pedalier", niveau, etat });
    t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: t.id }, verbe: "pedaler" });
    t.attendre(1);
    const kcal = (t.joueur as unknown as { action: { kcalEnPlus: number } | null }).action?.kcalEnPlus ?? 0;
    t.attendre(61);
    return { wh: t.installation().etat.charges?.batterie_voiture ?? 0, kcal };
  };
  const sans = mesurer(1);
  const avec = mesurer(2);
  assert.ok(sans.wh > 50, `sans : ${sans.wh} Wh`);
  assert.ok(Math.abs(avec.wh / sans.wh - ROULEMENTS.wh) < 0.01, `${avec.wh} Wh contre ${sans.wh}`);
  assert.ok(Math.abs(avec.kcal / sans.kcal - ROULEMENTS.effort) < 0.01, `${avec.kcal} kcal contre ${sans.kcal}`);
});

test("⚡ le poste de montage : le pack soudé de 24 Wh s'y soude au fer ; au banc solaire seul, non", () => {
  const ingredients = { cellule_lithium: 6, led: 1, fil_cuivre: 1, fer_souder: 1 };
  const banc = monter("voltaiques", ingredients, { type: "banc_recharge", niveau: 1 });
  banc.joueur.recevoir({ t: "fabriquer", recette: "pack_soude" });
  banc.attendre(5);
  assert.equal(banc.sac().pack_soude, undefined);
  assert.match(banc.infos().at(-1)!, /poste de montage/);
  const poste = monter("voltaiques", ingredients, { type: "banc_recharge", niveau: 2 });
  poste.joueur.recevoir({ t: "fabriquer", recette: "pack_soude" });
  poste.attendre(5);
  assert.equal(poste.sac().pack_soude, 1, poste.infos().slice(-2).join(" | "));
  assert.equal(poste.sac().cellule_lithium ?? 0, 0);
  // Sans le fer à souder, non plus.
  const sansFer = monter("voltaiques", { cellule_lithium: 6, led: 1, fil_cuivre: 1 }, { type: "banc_recharge", niveau: 2 });
  sansFer.joueur.recevoir({ t: "fabriquer", recette: "pack_soude" });
  sansFer.attendre(5);
  assert.equal(sansFer.sac().pack_soude, undefined);
});
