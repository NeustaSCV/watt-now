// Tests du chantier 7 de la 0.8 : les meubles de famille. Chaque famille, seule, bâtit son premier meuble avec la pièce
// de la station et ce que la ruine lui donne (plan 0.8 §2.3) : 🔥 le foyer de forge et son enclume de dépanneur, ⚡ le
// banc solaire et son panneau, ⚙️ le pédalier générateur et son petit alternateur ; la charbonnette (B9).

import { test } from "node:test";
import assert from "node:assert/strict";
import { CHARGE_TROUVEE, DUREE_CHARBONNIERE_MS, MS_JOUR_CALENDRIER, productionPanneau, whEDePedalage } from "../../commun/src/energie.ts";
import { etoilesForge, forgeProche } from "../../commun/src/forge.ts";
import { LIGNEES_INSTALLATIONS } from "../../commun/src/lignees.ts";
import type { MessageServeur, Verbe } from "../../commun/src/messages.ts";
import { kitDeDepart, type Inventaire } from "../../commun/src/objets.ts";
import { toutDevoile } from "../../commun/src/progression.ts";
import { RECETTES, recette } from "../../commun/src/recettes.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

/** Les Éteints ne viennent jamais (alea à 1) : ces tests portent sur le métier. */
const JAMAIS = () => 1;

/** Ce que la ruine et sa caisse à outils donnent à tous (plan 0.8 §2.5) ; le vélo, déjà démonté. */
const RUINE: Inventaire = { bache: 1, barre_metal: 1, ressort_lames: 2, batterie_voiture: 1, cadre_velo: 1, chaine_velo: 1, roue_velo: 2, dynamo_velo: 1, tete_hache: 1, cle_plate: 1, tournevis: 1 };
/** Ce que le terrain donne autour de la maison. */
const TERRAIN: Inventaire = { pierre: 8, branche: 6, buche: 4 };

/**
 * Un joueur seul sur son terrain, avec son kit, la ruine, le terrain, et la pièce de sa famille. `laisses` : ce qu'il a
 * laissé au coffre (le sac ne porte que 55 kg : la batterie de la ruine en pèse 18).
 */
function seul(famille: Famille, piece: Inventaire, laisses: readonly (keyof Inventaire)[] = []) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", famille);
  base.sauverProgression(compte.id, toutDevoile(famille));
  const inventaire: Inventaire = { ...kitDeDepart(famille) };
  for (const source of [RUINE, TERRAIN, piece]) for (const [t, n] of Object.entries(source)) inventaire[t as keyof Inventaire] = (inventaire[t as keyof Inventaire] ?? 0) + (n ?? 0);
  for (const t of laisses) delete inventaire[t];
  base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  let joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), JAMAIS);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const sac = () => base.chargerInventaire(compte.id);
  const construire = (r: string) => {
    joueur.recevoir({ t: "fabriquer", recette: r, x: 20, z: 21.8, o: 0 });
    attendre(recette(r)!.duree / 2 + 5);
    return dernier("installation")!.installation.id;
  };
  const meuble = (id: number) => base.chargerInstallations(compte.id).find((i) => i.id === id)!;
  const utiliser = (id: number, verbe: Verbe, secondes: number) => {
    joueur.recevoir({ t: "interagir", cible: { genre: "installation", id }, verbe });
    attendre(secondes);
  };
  /** Le soleil de la dernière absence (Wh) : depuis la 0.10 (chantier D, S-30), le panneau suit le soleil du monde. */
  let soleil = 0;
  /** Se déconnecter, s'absenter, revenir. */
  const absence = (ms: number) => {
    joueur.sauvegarder();
    joueur.partir();
    soleil = productionPanneau(instant, instant + ms, base.debutMonde());
    instant += ms;
    joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), JAMAIS);
    joueur.position = { x: 20, z: 20, o: 0 };
    return joueur;
  };
  return { base, compte, joueur: () => joueur, attendre, dernier, infos, sac, construire, meuble, utiliser, absence, soleil: () => soleil };
}

// ---------- Les lignées et leurs clés ----------

test("chaque meuble de famille a sa lignée et sa clé de la station, sans repli (plan 0.10), avec des textes au nom affiché du lieu", () => {
  const attendu = { forge: ["enclume_depanneur", "charbonniers"], banc_recharge: ["panneau_solaire", "voltaiques"], pedalier: ["petit_alternateur", "mecanistes"] } as const;
  for (const [type, [cle, famille]] of Object.entries(attendu)) {
    const premier = LIGNEES_INSTALLATIONS[type as keyof typeof attendu]![0]!;
    assert.equal(premier.cle?.objet, cle, type);
    assert.equal(premier.cle?.ou, "H1A", type);
    assert.equal(premier.etapeLieu, "H1", type);
    assert.equal(premier.famille, famille, type);
    assert.equal("replis" in premier.cle!, false, `${type} : pas de repli`);
    // Le niveau 1 coûte ce que coûte sa recette (la pièce se monte ensuite, sur le meuble posé).
    assert.deepEqual(premier.couts[0], recette(type)!.ingredients, type);
    // On écrit le nom du lieu (« la station »), jamais le code de l'étape.
    for (const t of [premier.cle!.idee, premier.cle!.ideePlusTard, ...premier.cle!.indice]) assert.ok(!/\b[HL][12][AB]\b/.test(t), t);
    assert.ok(/station/.test(premier.cle!.indice[1]), premier.cle!.indice[1]);
  }
  assert.equal(LIGNEES_INSTALLATIONS.banc_recharge![0]!.nom, "Banc solaire");
  assert.equal(LIGNEES_INSTALLATIONS.pedalier![0]!.nom, "Pédalier générateur");
  // Le banc et son panneau ne font plus qu'un meuble : plus de panneau posé à part.
  assert.ok(!RECETTES.some((r) => "installation" in r.produit && r.produit.installation === "panneau_solaire"));
});

test("ce qui attend le niveau 2 ou 3 est grisé « plus tard » ; la clôture de fortune et l'alarme électrique restent", () => {
  // Plan 0.10 (chantier F) : les armes du niveau 2 sont jouables ; le cranequin suit l'arbalète lourde au niveau 3.
  const plusTard = {
    electrificateur: "niveau 2",
    cloture_electrique: "niveau 2",
    ventilateur_forge: "niveau 2",
    cranequin: "niveau 3",
    arbalete_lourde: "niveau 3",
    arc_arbalete_retrempe: "niveau 3",
    noix_forgee: "niveau 3",
    ressort_retrempe: "niveau 3",
  } as const;
  for (const [id, a] of Object.entries(plusTard)) assert.equal(recette(id)?.aVenir, a, id);
  for (const id of ["module_bobine", "matraque_electrodes", "matraque_manche_tourne", "matraque_contacts_soudes", "aiguillon", "cranequin_leger", "arc_arbalete_if", "hache_forgee", "glaive", "machette_forgee_caoutchouc"]) {
    assert.equal(recette(id)?.aVenir, undefined, id);
  }
  for (const id of ["banc_recharge", "pack_cellules", "module_decharge", "matraque_fortune", "matraque_electrique", "lampe_bricolee", "cloture_fortune", "alarme_electrique", "pedalier", "arbalete", "arc_arbalete_frene", "arc_arbalete_ressort", "forge", "pinces_forge", "rivet", "pointe_acier", "lame_forgee_fer", "machette_forgee_fer", "hachette", "charbonniere", "charbonniere_charbonnette"]) {
    assert.equal(recette(id)?.aVenir, undefined, id);
  }
});

// ---------- 🔥 Le foyer de forge ----------

test("🔥 un Charbonnier seul : le foyer de forge, l'enclume de dépanneur calée sur le billot, des lames à ★★", () => {
  const t = seul("charbonniers", { enclume_depanneur: 1, charbon_bois: 4 });
  const id = t.construire("forge");
  assert.equal(t.meuble(id).type, "forge");
  // Sur sa pierre plate, le foyer ne donne que ★.
  assert.equal(etoilesForge({}, forgeProche({ installations: [t.meuble(id)] })), 1);
  t.utiliser(id, "poser_enclume", 9);
  assert.equal(t.meuble(id).etat.enclume, "depanneur");
  assert.equal(t.sac().enclume_depanneur, undefined);
  assert.equal(etoilesForge({}, forgeProche({ installations: [t.meuble(id)] })), 2);
});

test("🔥 la charbonnette : 5 bûches et 20 branches font la meule, qui rend 4 charbons", () => {
  const t = seul("charbonniers", { buche: 1, branche: 14 }, ["batterie_voiture", "cadre_velo", "roue_velo", "pierre", "bache"]);
  assert.deepEqual(recette("charbonniere_charbonnette")!.ingredients, { buche: 5, branche: 20 });
  const id = t.construire("charbonniere_charbonnette");
  assert.equal(t.meuble(id).type, "charbonniere");
  assert.equal(t.sac().buche, undefined, "4 + 1 = 5 bûches prises");
  assert.equal(t.sac().branche, undefined, "6 + 14 = 20 branches prises");
  t.utiliser(id, "allumer_meule", 4);
  t.absence(DUREE_CHARBONNIERE_MS + 1000);
  t.joueur().position = { x: 20, z: 20, o: 0 };
  t.utiliser(id, "defourner", 11);
  assert.equal(t.sac().charbon_bois, 4, t.infos().slice(-3).join(" | "));
});

// ---------- ⚡ Le banc solaire ----------

test("⚡ un Voltaïque seul : le banc solaire, le panneau posé dessus, la batterie de la ruine ; le soleil d'un jour", () => {
  const t = seul("voltaiques", { panneau_solaire: 1 }, ["pierre", "bache", "ressort_lames", "cadre_velo", "roue_velo", "chaine_velo"]);
  const id = t.construire("banc_recharge");
  t.utiliser(id, "poser_panneau", 21);
  assert.equal(t.meuble(id).etat.panneau, true);
  assert.equal(t.sac().panneau_solaire, undefined);
  t.utiliser(id, "poser_batteries", 5);
  assert.equal(t.meuble(id).etat.batteries?.batterie_voiture, 1);
  // 0.8.2 (R17) : le banc ne garde qu'une batterie ; la petite reste à la frontale.
  assert.equal(t.meuble(id).etat.batteries?.petite_batterie, undefined, "la petite batterie du kit reste au sac");
  assert.equal(t.sac().petite_batterie, 1);
  const total = () => Object.values(t.meuble(id).etat.charges ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  const avant = total();
  assert.equal(Math.round(t.meuble(id).etat.charges!.batterie_voiture!), CHARGE_TROUVEE.batterie_voiture);
  t.absence(MS_JOUR_CALENDRIER);
  // Le soleil du jour entré (80 Wh par beau jour, rien la nuit ni sous la pluie), moins la décharge spontanée (≈ 0,3 Wh).
  const apres = total();
  assert.ok(t.soleil() > 0, `soleil : ${t.soleil()}`);
  assert.ok(Math.abs(apres - avant - t.soleil()) < 1.5, `${avant} → ${apres} pour ${t.soleil()}`);
  // Démonté, le banc rend son panneau entier, et sa batterie (à demeure : elle ne se reprend pas avant).
  t.utiliser(id, "demonter_installation", 40);
  assert.equal(t.sac().panneau_solaire, 1);
  assert.equal(t.sac().batterie_voiture, 1, t.infos().slice(-3).join(" | "));
});

// ---------- ⚙️ Le pédalier générateur ----------

test("⚙️ un Mécaniste seul : le pédalier générateur, l'alternateur monté ; une heure de pédalage ≈ 60 Wh dans la batterie", () => {
  const t = seul("mecanistes", { petit_alternateur: 1 }, ["pierre", "bache", "ressort_lames", "barre_metal", "tete_hache"]);
  const id = t.construire("pedalier");
  t.utiliser(id, "monter_alternateur", 21);
  assert.equal(t.meuble(id).etat.alternateur, true);
  assert.equal(t.sac().petit_alternateur, undefined);
  t.utiliser(id, "poser_batteries", 5);
  assert.equal(t.meuble(id).etat.batteries?.batterie_voiture, 1, t.infos().join(" | "));
  const avant = t.meuble(id).etat.charges!.batterie_voiture!;
  t.utiliser(id, "pedaler", 61);
  const apres = t.meuble(id).etat.charges!.batterie_voiture!;
  assert.ok(Math.abs(apres - avant - 60) <= 1, `${avant} → ${apres}`);
  assert.match(t.infos().at(-1)!, /\+60 Wh dans la batterie du pédalier/);
  assert.ok(Math.abs(whEDePedalage("mecanistes") - 60) < 1);
  // La dynamo du vélo, le repli, ne donne presque rien ; avec l'alternateur monté, on ne la propose plus.
  assert.equal(whEDePedalage("mecanistes", 1, "dynamo"), 5);
  // On reprend la batterie pleine de ce qu'on a pédalé ; démonté, le pédalier rend l'alternateur.
  t.utiliser(id, "reprendre_batteries", 5);
  assert.equal(t.sac().batterie_voiture, 1, t.infos().slice(-3).join(" | "));
  assert.equal(Math.round(t.dernier("charges")!.charges.batterie_voiture!), Math.round(apres));
  t.utiliser(id, "demonter_installation", 50);
  assert.equal(t.sac().petit_alternateur, 1);
});

test("⚙️ sans alternateur ni dynamo, on pédale dans le vide ; sans batterie, on ne charge rien", () => {
  const t = seul("mecanistes", {});
  const id = t.construire("pedalier");
  t.utiliser(id, "pedaler", 2);
  assert.match(t.infos().at(-1)!, /alternateur/);
  t.utiliser(id, "monter_dynamo", 21);
  // La batterie de la ruine, dans le sac : la dynamo la charge à peine (5 Wh par heure).
  t.utiliser(id, "pedaler", 61);
  assert.match(t.infos().at(-1)!, /\+5 Wh dans/);
});
