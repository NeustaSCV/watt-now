// Tests du chantier 9 de la 0.8 : faire évoluer et réparer une arme sur son meuble (R-ARMES-4, R-ARMES-5). Le même
// exemplaire monte d'une étoile, sans nouvel objet, si le meuble et la pièce le permettent, jamais au-delà de la grille
// du niveau 1 ; le manche se refait à l'établi à étau, sans forge ; loin d'un meuble, le geste est refusé. Et l'ordre
// des armes sans arme équipée : les dégâts décidés d'abord.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ATELIER_REPARATION, MATIERE_ARME, armeEnMain, lieuAtelier, meilleureArme } from "../../commun/src/combat.ts";
import { compter, exemplaireUneEtoileDePlus } from "../../commun/src/etoiles.ts";
import { MONTEES_ARMES, reprise } from "../../commun/src/evolution-armes.ts";
import type { EtatInstallation, MessageServeur } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import type { TypeInstallation } from "../../commun/src/recettes.ts";
import { LIEU_REPARER_MANCHE } from "../../commun/src/recettes/communes.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

/** Les Éteints ne viennent jamais (alea à 1) : ces tests portent sur le métier. */
const JAMAIS = () => 1;

/**
 * Un joueur sur son terrain, son sac, son usure, et un meuble posé à 1 m (à son niveau, avec son état). `loin` : le
 * joueur est à 20 m du meuble.
 */
function chezSoi(famille: Famille, inventaire: Inventaire, meuble: { type: TypeInstallation; niveau?: number; etat?: EtatInstallation } | null, usure: Partial<Record<string, number>> = {}, loin = false) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", famille);
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  base.sauverUsure(compte.id, usure);
  if (meuble) {
    const i = base.ajouterInstallation(compte.id, meuble.type, 21, 20, 0);
    if (meuble.niveau) base.sauverNiveauInstallation(compte.id, i.id, meuble.niveau);
    if (meuble.etat) base.sauverEtatInstallation(compte.id, i.id, meuble.etat);
  }
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), JAMAIS);
  joueur.position = loin ? { x: 40, z: 20, o: 0 } : { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  return { base, compte, joueur, attendre, infos, dernier, recus, sac: () => base.chargerInventaire(compte.id), usure: () => base.chargerUsure(compte.id) };
}

// ---------- Monter d'une étoile ----------

test("une arbalète ★ rapportée à l'établi avec un arc en ressort devient ★★, sans nouvel objet", () => {
  const t = chezSoi("mecanistes", { "arbalete#1": 1, "arc_arbalete#2": 1, carreau: 4 }, { type: "etabli" }, { "arbalete#1": 12 });
  t.joueur.recevoir({ t: "reprendre_arme", objet: "arbalete#1", geste: "monter" });
  assert.equal(t.dernier("action")?.etat, "debut");
  t.attendre(40);
  const sac = t.sac();
  assert.equal(sac["arbalete#2"], 1, "le même exemplaire, à ★★");
  assert.equal(sac["arbalete#1"], undefined);
  assert.equal(compter(sac, "arbalete"), 1, "aucune seconde arbalète");
  assert.equal(compter(sac, "arc_arbalete"), 0, "l'arc en ressort est monté dessus");
  assert.equal(sac.carreau, 4);
  // Son usure revient à neuf, et le client fait briller l'étoile qui s'ajoute.
  assert.equal(t.usure()["arbalete#1"], undefined);
  assert.equal(t.usure()["arbalete#2"], undefined);
  assert.deepEqual(t.dernier("arme_reprise"), { t: "arme_reprise", avant: "arbalete#1", apres: "arbalete#2", geste: "monter" });
});

test("sans la pièce qui fait l'étoile, l'arbalète ne monte pas ; une arbalète ★★ ne passe pas ★★★ à l'établi (l'if attend le niveau 2)", () => {
  const sansArc = chezSoi("mecanistes", { "arbalete#1": 1, "arc_arbalete#1": 1 }, { type: "etabli" });
  sansArc.joueur.recevoir({ t: "reprendre_arme", objet: "arbalete#1", geste: "monter" });
  assert.match(sansArc.infos().at(-1)!, /arc d'arbalète ★★ ou mieux/);
  assert.equal(sansArc.dernier("action"), undefined);

  const r = reprise("arbalete#2", { x: 20, z: 20, feux: [], installations: [{ type: "etabli", x: 21, z: 20, etat: {} }], inventaire: { "arbalete#2": 1, "arc_arbalete#3": 1 } }, {});
  assert.equal(r.monter?.possible, false);
  assert.match(r.monter!.raison!, /seule la maîtrise/);
});

test("une machette ★★ ne monte pas à ★★★ sur le foyer de forge (le meuble ne le permet pas) : seulement la maîtrise", () => {
  const t = chezSoi("charbonniers", { "machette_forgee#2": 1, charbon_bois: 3 }, { type: "forge", etat: { enclume: "depanneur" } });
  t.joueur.recevoir({ t: "reprendre_arme", objet: "machette_forgee#2", geste: "monter" });
  assert.match(t.infos().at(-1)!, /foyer de forge ne la monte pas à ★★★ : seule la maîtrise/);
  assert.equal(t.dernier("action"), undefined);
  t.attendre(40);
  assert.equal(t.sac()["machette_forgee#2"], 1);
  assert.equal(t.sac().charbon_bois, 3);
});

test("une machette ★ forgée sur la pierre plate monte à ★★ sur l'enclume du foyer (un charbon) ; sur la pierre plate, non", () => {
  const plate = chezSoi("charbonniers", { "machette_forgee#1": 1, charbon_bois: 1 }, { type: "forge" });
  plate.joueur.recevoir({ t: "reprendre_arme", objet: "machette_forgee#1", geste: "monter" });
  assert.match(plate.infos().at(-1)!, /pierre plate/);

  const t = chezSoi("charbonniers", { "machette_forgee#1": 1, charbon_bois: 1 }, { type: "forge", etat: { enclume: "depanneur" } }, { "machette_forgee#1": 20 });
  t.joueur.recevoir({ t: "reprendre_arme", objet: "machette_forgee#1", geste: "monter" });
  // La pose « lourd » de la forge.
  assert.equal((t.dernier("action") as { bruit?: string } | undefined)?.bruit, "lourd");
  t.attendre(40);
  assert.equal(t.sac()["machette_forgee#2"], 1);
  assert.equal(t.sac().charbon_bois, undefined);
  assert.equal(t.usure()["machette_forgee#2"], undefined, "à neuf");
});

test("l'arme équipée et la charge suivent la matraque qui monte au banc solaire (module de raquette)", () => {
  const t = chezSoi("voltaiques", { "matraque_electrique#1": 1, "module_decharge#2": 1 }, { type: "banc_recharge" });
  t.joueur.recevoir({ t: "equiper", objet: "matraque_electrique#1" });
  t.joueur.majChargeArme("matraque_electrique#1", 5);
  t.joueur.recevoir({ t: "reprendre_arme", objet: "matraque_electrique#1", geste: "monter" });
  t.attendre(40);
  assert.equal(t.sac()["matraque_electrique#2"], 1);
  assert.equal(compter(t.sac(), "module_decharge"), 0);
  assert.equal(t.dernier("arme")?.arme, "matraque_electrique#2");
  assert.equal(t.base.chargerChargeArmes(t.compte.id)["matraque_electrique#2"], 5);
});

// ---------- Réparer ----------

test("un marteau abîmé retrouve son manche à l'établi à étau, sans forge (une branche) ; à l'établi simple, non", () => {
  assert.deepEqual(lieuAtelier(ATELIER_REPARATION.manche[0]!), LIEU_REPARER_MANCHE);
  assert.equal(MATIERE_ARME.marteau, "manche");
  const simple = chezSoi("voltaiques", { marteau: 1, branche: 1 }, { type: "etabli" }, { marteau: 6 });
  simple.joueur.recevoir({ t: "reprendre_arme", objet: "marteau", geste: "reparer" });
  assert.match(simple.infos().at(-1)!, /établi à étau/);
  assert.equal(simple.dernier("action"), undefined);

  for (const famille of ["voltaiques", "mecanistes", "charbonniers"] as const) {
    const t = chezSoi(famille, { marteau: 1, branche: 1 }, { type: "etabli", niveau: 2 }, { marteau: 6 });
    t.joueur.recevoir({ t: "reprendre_arme", objet: "marteau", geste: "reparer" });
    assert.equal((t.dernier("action") as { bruit?: string } | undefined)?.bruit, "outil", famille);
    t.attendre(20);
    assert.equal(t.usure().marteau, undefined, `${famille} : à neuf`);
    assert.equal(t.sac().branche, undefined, "la branche fait le manche neuf");
    assert.equal(t.sac().marteau, 1, "la même tête");
  }
});

test("une matraque se répare au banc solaire ; une arbalète à l'établi (les armes de tir aussi s'usent)", () => {
  const m = chezSoi("voltaiques", { matraque_fortune: 1 }, { type: "banc_recharge" }, { matraque_fortune: 10 });
  m.joueur.recevoir({ t: "reprendre_arme", objet: "matraque_fortune", geste: "reparer" });
  m.attendre(20);
  assert.equal(m.usure().matraque_fortune, undefined);
  const a = chezSoi("mecanistes", { "arbalete#1": 1 }, { type: "etabli" }, { "arbalete#1": 10 });
  a.joueur.recevoir({ t: "reprendre_arme", objet: "arbalete#1", geste: "reparer" });
  a.attendre(20);
  assert.equal(a.usure()["arbalete#1"], undefined);
  assert.equal(a.sac()["arbalete#1"], 1, "réparée, elle garde ses étoiles");
});

test("loin d'un meuble, le geste est refusé (réparer comme monter) ; ailleurs que chez soi aussi", () => {
  const t = chezSoi("mecanistes", { "arbalete#1": 1, "arc_arbalete#2": 1 }, { type: "etabli" }, { "arbalete#1": 10 }, true);
  t.joueur.recevoir({ t: "reprendre_arme", objet: "arbalete#1", geste: "monter" });
  assert.match(t.infos().at(-1)!, /se fait près de son meuble : l'établi/);
  t.joueur.recevoir({ t: "reprendre_arme", objet: "arbalete#1", geste: "reparer" });
  assert.match(t.infos().at(-1)!, /se fait près de son meuble/);
  assert.equal(t.dernier("action"), undefined);
  t.attendre(40);
  assert.equal(t.sac()["arbalete#1"], 1);
  assert.equal(t.usure()["arbalete#1"], 10);
  // Le message d'avant la 0.8 (« Réparer » pour de bon) passe par le même geste.
  t.joueur.recevoir({ t: "reparer", objet: "arbalete#1", fortune: false });
  assert.match(t.infos().at(-1)!, /se fait près de son meuble/);
});

test("les montées ne dépassent jamais la grille du niveau 1, et la clé change d'étoile sur le même exemplaire", () => {
  assert.equal(exemplaireUneEtoileDePlus("arbalete#1"), "arbalete#2");
  assert.equal(exemplaireUneEtoileDePlus("arbalete#2"), "arbalete", "★★★ : la clé nue de l'arbalète");
  assert.equal(exemplaireUneEtoileDePlus("arbalete#5"), null);
  assert.equal(exemplaireUneEtoileDePlus("pierre"), null);
  // Chaque arme qui monte a un plafond, et son meuble l'atteint (aucune montée orpheline).
  for (const type of Object.keys(MONTEES_ARMES)) assert.ok(MATIERE_ARME[type as keyof typeof MATIERE_ARME], `${type} se répare aussi`);
});

// ---------- Sans arme équipée : la meilleure du sac, aux dégâts décidés ----------

test("sans arme équipée, on frappe avec l'arme aux meilleurs dégâts décidés, pas au premier rang", () => {
  // La hache (1,0) passait avant le pied-de-biche (1,5).
  assert.equal(meilleureArme({ hache: 1, pied_de_biche: 1 }).objet, "pied_de_biche");
  // Le marteau (0,8) passait avant la lance à pointe forgée (1,15) et la barre (1,5).
  assert.equal(meilleureArme({ marteau: 1, lance_forgee: 1 }).objet, "lance_forgee");
  assert.equal(meilleureArme({ marteau: 1, barre_metal: 1 }).objet, "barre_metal");
  // Le marteau (0,8) reste avant la lance commune (0,7).
  assert.equal(meilleureArme({ marteau: 1, lance: 1 }).objet, "marteau");
  // Les étoiles comptent : une machette forgée ★★ (1,2) passe la hache (1,0), une ★★★ (2,5) passe le pied-de-biche.
  assert.equal(meilleureArme({ hache: 1, "machette_forgee#2": 1 }).cle, "machette_forgee#2");
  assert.equal(meilleureArme({ pied_de_biche: 1, machette_forgee: 1 }).objet, "machette_forgee");
  // À dégâts égaux, le rang départage : la masse (2,5) avant la machette forgée ★★★ (2,5).
  assert.equal(meilleureArme({ machette_forgee: 1, masse: 1 }).objet, "masse");
  assert.equal(armeEnMain({ hache: 1, pied_de_biche: 1 }, "hache").objet, "hache", "l'arme équipée reste la sienne");
  assert.equal(meilleureArme({}).objet, null);
});
