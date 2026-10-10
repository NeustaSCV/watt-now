// Tests du chantier 3 de la 0.6 (Book 25 §10.3) : les recettes des autres familles (grisées, apprises par une leçon ou
// un manuel, ×1,5, ★★ au plus), les matières nouvelles (frêne, if, plumes, os), les vestiges nouveaux.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS, kitDeDepart, type TypeObjet } from "../../commun/src/objets.ts";
import { OBJETS_METIER } from "../../commun/src/objets-metier.ts";
import {
  RECETTES,
  energieGrise,
  etoilesDuProduit,
  multiplicateurQualites,
  objetsSansEnergieGrise,
  recette,
  recetteHorsFamille,
  recettesAutresFamilles,
  recettesConnues,
} from "../../commun/src/recettes.ts";
import { RECETTES_CHARBONNIERS } from "../../commun/src/recettes/charbonniers.ts";
import { RECETTES_COMMUNES } from "../../commun/src/recettes/communes.ts";
import { RECETTES_MECANISTES } from "../../commun/src/recettes/mecanistes.ts";
import { RECETTES_VOLTAIQUES } from "../../commun/src/recettes/voltaiques.ts";
import { FAMILLES, type Famille } from "../../commun/src/regles.ts";
import { DUREE_LECON_S, SAVOIR_VIDE, savoirValide, type Savoir } from "../../commun/src/savoir.ts";
import { REPOUSSE_MS, USAGES, genererRessources, ressourceVisible } from "../../commun/src/terrain.ts";
import { FAMILLES_PAR_LIEU, VESTIGES, tableDeFouille, type LieuFouille, type TypeVestige } from "../../commun/src/vestiges.ts";
import { butinCoop } from "../../commun/src/cooperative.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { Lecons, apprendre, enseigner, lireManuel, type ParticipantLecon } from "./lecon.ts";
import { messageValide } from "./controle.ts";

const JAMAIS_D_ETEINT = () => 1;

function monter(famille: Famille, inventaire: Record<string, number>, base = new Base(":memory:"), pseudo = "Rose") {
  const compte = base.creerCompte(pseudo, "potager42", famille);
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const nouveau = () => new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), JAMAIS_D_ETEINT);
  const joueur = nouveau();
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const sauter = (ms: number) => (instant += ms);
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  return { base, compte, joueur, attendre, sauter, dernier, infos, nouveau };
}

// ---------- Le catalogue ----------

test("tous les objets de la 0.6 sont déclarés, nommés, pesés, et ont une valeur", () => {
  for (const [t, d] of Object.entries(OBJETS_METIER)) {
    assert.ok(t in OBJETS, t);
    assert.ok(d.nom.length > 0 && d.description.length > 0 && d.pluriel.length > 0, t);
    assert.ok(d.poids > 0, t);
  }
  assert.deepEqual(objetsSansEnergieGrise(), []);
  // Les identifiants que les chantiers 4 à 7 fabriqueront (Book 25 §10.3) : rien à ajouter au catalogue.
  for (const t of ["arc_simple", "fleche_os", "machette_forgee", "glaive", "ressort_retrempe", "matraque_electrique", "pack_cellules", "arbalete", "carreau", "manche_tourne"]) {
    assert.ok(t in OBJETS, t);
  }
});

test("la lance n'est plus un vestige : elle vaut ce que vaut sa recette ; masse et pied-de-biche valent leur remplacement", () => {
  assert.equal("lance" in VESTIGES, false);
  assert.ok(energieGrise("lance") > 40, `lance : ${energieGrise("lance")}`);
  assert.equal(energieGrise("masse"), 200);
  assert.equal(energieGrise("pied_de_biche"), 150);
});

test("les recettes sont rangées par famille, et chaque fichier ne tient que la sienne", () => {
  assert.equal(RECETTES.length, RECETTES_COMMUNES.length + RECETTES_CHARBONNIERS.length + RECETTES_MECANISTES.length + RECETTES_VOLTAIQUES.length);
  assert.ok(RECETTES_COMMUNES.every((r) => r.famille === "tous"));
  assert.ok(RECETTES_CHARBONNIERS.every((r) => r.famille === "charbonniers"));
  assert.ok(RECETTES_MECANISTES.every((r) => r.famille === "mecanistes"));
  assert.ok(RECETTES_VOLTAIQUES.every((r) => r.famille === "voltaiques"));
  assert.equal(new Set(RECETTES.map((r) => r.id)).size, RECETTES.length, "identifiants uniques");
});

test("la clé plate (Serrer 2) est dans le kit des Mécanistes", () => {
  assert.equal(kitDeDepart("mecanistes").cle_plate, 1);
  assert.equal(kitDeDepart("voltaiques").cle_plate, undefined);
});

test("chaque vestige nouveau peut sortir au tirage de son lieu", () => {
  // La bobine d'allumage n'y est plus : elle quitte les épaves de la station (plan 0.8, I12 ; catalogue-niveau1.test.ts).
  const nouveaux: TypeVestige[] = ["fil_dentaire", "appareil_photo_jetable", "raquette_moustiques", "lime_usee", "soc_charrue", "bidon_huile", "troncon_rail", "arc_sportif", "fleche_carbone", "manuel_forgeron", "manuel_electricien", "manuel_arbalete"];
  const lieux = Object.keys(FAMILLES_PAR_LIEU) as LieuFouille[];
  for (const v of nouveaux) {
    const ou = lieux.filter((l) => tableDeFouille(l).some(([t, p]) => t === v && p > 0));
    assert.ok(ou.length > 0, `${v} ne sort nulle part`);
  }
  // Et, pour le joueur seul, un manuel de chaque famille au coffre du directeur.
  const coffre = USAGES.coop_coffre.donne;
  assert.equal(coffre.manuel_forgeron, 1);
  assert.equal(coffre.manuel_electricien, 1);
  assert.equal(coffre.manuel_arbalete, 1);
});

// ---------- Les matières ----------

test("plumer une poule rend quatre portions, une poignée de plumes et un os", () => {
  const t = monter("charbonniers", { poule: 1, couteau: 1 });
  t.joueur.recevoir({ t: "fabriquer", recette: "volaille" });
  t.attendre(5);
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.volaille_crue, 4);
  assert.equal(inv.plumes, 1);
  assert.equal(inv.os, 1);
  assert.equal(inv.poule, undefined);
});

test("chaque terrain a deux frênes à la lisière et un if au fond du bois", () => {
  for (const graine of [1, 7, 42, 1234]) {
    const r = genererRessources(graine);
    const frenes = r.filter((x) => x.type === "frene");
    const ifs = r.filter((x) => x.type === "if_bois");
    assert.equal(frenes.length, 2);
    assert.equal(ifs.length, 1);
    for (const f of [...frenes, ...ifs]) {
      const bord = Math.min(f.x, f.z, 50 - f.x, 50 - f.z);
      assert.ok(bord <= 4.5, `${f.type} à ${bord} m du bord`);
    }
    assert.equal(new Set(r.map((x) => x.id)).size, r.length);
  }
});

test("le couteau du kit coupe une perche de frêne (Couper 1, plan 0.8), comme le couteau aiguisé et la serpe", () => {
  assert.equal(multiplicateurQualites({ couteau: 1 }, USAGES.frene.qualites), 1);
  assert.equal(multiplicateurQualites({ couteau_aiguise: 1 }, USAGES.frene.qualites), 1);
  assert.equal(multiplicateurQualites({ serpe: 1 }, USAGES.frene.qualites), 1);
  assert.equal(multiplicateurQualites({ pierre: 1 }, USAGES.frene.qualites), null);
});

test("un frêne coupé repousse en 6 h, même hors ligne", () => {
  const t = monter("voltaiques", { couteau: 1 });
  const frene = t.joueur.bienvenue(0).ressources.find((r) => r.type === "frene")!;
  t.joueur.position = { x: frene.x + 0.5, z: frene.z, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: frene.id }, verbe: "ramasser" });
  // Couper 1 avec le couteau du kit : 6 s.
  t.attendre(10);
  assert.equal(t.dernier("inventaire")!.inventaire.perche_frene, 1);
  assert.equal(t.joueur.bienvenue(0).ressources.find((r) => r.id === frene.id)!.disponible, false);
  // Le joueur se déconnecte ; 6 h plus tard, il revient.
  t.joueur.sauvegarder();
  t.sauter(REPOUSSE_MS.frene! / REGLAGES.repousse_rythme + 1000);
  const revenu = t.nouveau();
  assert.equal(revenu.bienvenue(0).ressources.find((r) => r.id === frene.id)!.disponible, true);
});

test("un Voltaïque ne voit pas l'if du fond du bois, un Mécaniste si", () => {
  assert.equal(ressourceVisible("if_bois", "voltaiques"), false);
  assert.equal(ressourceVisible("if_bois", "mecanistes"), true);
  assert.equal(ressourceVisible("frene", "voltaiques"), true);
  const base = new Base(":memory:");
  const v = monter("voltaiques", { couteau_aiguise: 1 }, base, "Volt");
  const m = monter("mecanistes", { couteau_aiguise: 1 }, base, "Meca");
  assert.equal(v.joueur.bienvenue(0).ressources.some((r) => r.type === "if_bois"), false);
  const ifM = m.joueur.bienvenue(0).ressources.find((r) => r.type === "if_bois")!;
  assert.ok(ifM);
  m.joueur.position = { x: ifM.x + 0.5, z: ifM.z, o: 0 };
  m.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: ifM.id }, verbe: "ramasser" });
  m.attendre(9);
  assert.equal(m.dernier("inventaire")!.inventaire.baton_if, 1);
  // Le Voltaïque, même devant son if (il existe sur son terrain), n'en tire rien : il ne le reconnaît pas.
  const ifV = genererRessources(v.compte.id).find((r) => r.type === "if_bois")!;
  v.joueur.position = { x: ifV.x + 0.5, z: ifV.z, o: 0 };
  v.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: ifV.id }, verbe: "ramasser" });
  v.attendre(9);
  assert.equal(v.dernier("inventaire")?.inventaire.baton_if, undefined);
});

test("la haie d'ifs de la Coopérative est dans le butin, devant les bureaux", () => {
  const haie = butinCoop().find((p) => p.type === "coop_ifs");
  assert.ok(haie);
  assert.equal(USAGES.coop_ifs.donne.baton_if, 1);
});

// ---------- Les recettes des autres familles ----------

test("une recette d'une autre famille est grisée, s'ouvre par une leçon, coûte ×1,5 et plafonne à ★★", () => {
  const lame = recette("lame_forgee")!;
  // Grisée : le Mécaniste la voit chez les autres, ne la connaît pas.
  assert.ok(recettesAutresFamilles("mecanistes").includes(lame));
  assert.ok(!recettesConnues("mecanistes").includes(lame));
  // Ouverte par une leçon.
  const savoir = apprendre(savoirValide({}), "lame_forgee");
  assert.ok(recettesConnues("mecanistes", savoir).includes(lame));
  assert.ok(!recettesAutresFamilles("mecanistes", savoir).includes(lame));
  // ×1,5 en matières (arrondi au-dessus) et en temps.
  const h = recetteHorsFamille(lame);
  assert.deepEqual(h.ingredients, { ressort_lames: 2, charbon_bois: 2, branche: 2 });
  assert.equal(h.duree, lame.duree * 1.5);
  // ★★ au plus, même maîtrisée ; dans sa famille, à la forge ventilée avec pinces et graisse, ★★★★ (★★★★★ maîtrisée).
  const sac = { pinces_forge: 1, graisse: 1 };
  const contexte = { installations: [{ type: "forge" as const, niveau: 2, etat: {} }] };
  assert.equal(etoilesDuProduit(lame, sac, { horsFamille: true, contexte }), 2);
  assert.equal(etoilesDuProduit(lame, sac, { horsFamille: true, maitrise: true, contexte }), 2);
  assert.equal(etoilesDuProduit(lame, sac, { contexte }), 4);
  assert.equal(etoilesDuProduit(lame, sac, { maitrise: true, contexte }), 5);
  // Un objet sans étoiles n'en reçoit pas.
  assert.equal(etoilesDuProduit(recette("gourdin")!, {}), null);
});

/** Deux joueurs pour une leçon : ce que voit le moteur des leçons. */
function participant(id: number, famille: Famille, x = 0): ParticipantLecon & { recus: MessageServeur[]; position: { x: number; z: number }; savoir: Savoir; faits: string[] } {
  const p = {
    compte: { id, pseudo: `J${id}`, famille },
    position: { x, z: 0 },
    lieu: "station",
    enLieuPublic: true,
    savoir: { ...SAVOIR_VIDE, apprises: [], manuels: [], enseignees: [] } as Savoir,
    recus: [] as MessageServeur[],
    faits: [] as string[],
    envoyer(m: MessageServeur) {
      p.recus.push(m);
    },
    majSavoir(s: Savoir, fait?: string) {
      p.savoir = s;
      if (fait) p.faits.push(fait);
    },
  };
  return p;
}

test("la leçon : deux minutes côte à côte, puis l'élève sait ; le maître gagne du rayonnement une seule fois", () => {
  let instant = 0;
  const maitre = participant(1, "charbonniers");
  const eleve = participant(2, "mecanistes", 1.5);
  const joueurs = new Map([[1, maitre], [2, eleve]]);
  const lecons = new Lecons((id) => joueurs.get(id), () => instant);

  // Le maître demande ce qu'il peut enseigner : les recettes de son métier.
  lecons.traiter(maitre, { genre: "choisir", a: 2 });
  const possibles = maitre.recus.findLast((m) => m.t === "lecons_possibles") as Extract<MessageServeur, { t: "lecons_possibles" }>;
  assert.deepEqual(possibles.recettes, RECETTES_CHARBONNIERS.map((r) => r.id));

  // On n'enseigne pas une recette d'une autre famille que la sienne.
  lecons.traiter(maitre, { genre: "proposer", a: 2, recette: "pedalier" });
  assert.equal(eleve.recus.some((m) => m.t === "demande_lecon"), false);

  lecons.traiter(maitre, { genre: "proposer", a: 2, recette: "lame_forgee" });
  assert.ok(eleve.recus.some((m) => m.t === "demande_lecon"));
  lecons.traiter(eleve, { genre: "repondre", accepte: true });
  assert.ok(lecons.enLecon(maitre) && lecons.enLecon(eleve));

  // Une minute : rien encore.
  instant += 60_000;
  lecons.verifier();
  assert.equal(eleve.savoir.apprises.length, 0);
  // Deux minutes : il sait.
  instant += DUREE_LECON_S * 1000;
  lecons.verifier();
  assert.deepEqual(eleve.savoir.apprises, ["lame_forgee"]);
  assert.equal(maitre.savoir.rayonnement, 1);
  assert.deepEqual(maitre.faits, ["lecon_donnee"]);
  assert.equal(lecons.enLecon(maitre), false);

  // Enseigner la même chose au même élève ne rapporte plus rien (et il la sait déjà : refusé).
  assert.deepEqual(enseigner(maitre.savoir, 2, "lame_forgee").gagne, false);
  lecons.traiter(maitre, { genre: "proposer", a: 2, recette: "lame_forgee" });
  assert.match((maitre.recus.findLast((m) => m.t === "info") as { texte: string }).texte, /connaît déjà/);
});

test("la leçon s'interrompt si l'on s'éloigne ; elle ne se donne pas de loin, ni dans sa propre famille", () => {
  let instant = 0;
  const maitre = participant(1, "voltaiques");
  const loin = participant(2, "mecanistes", 10);
  const cousin = participant(3, "voltaiques", 1);
  const joueurs = new Map([[1, maitre], [2, loin], [3, cousin]]);
  const lecons = new Lecons((id) => joueurs.get(id), () => instant);

  lecons.traiter(maitre, { genre: "proposer", a: 2, recette: "banc_recharge" });
  assert.match((maitre.recus.at(-1) as { texte: string }).texte, /Approche-toi/);
  lecons.traiter(maitre, { genre: "choisir", a: 3 });
  assert.match((maitre.recus.at(-1) as { texte: string }).texte, /de ta famille/);

  loin.position.x = 2;
  lecons.traiter(maitre, { genre: "proposer", a: 2, recette: "banc_recharge" });
  lecons.traiter(loin, { genre: "repondre", accepte: true });
  assert.ok(lecons.enLecon(loin));
  loin.position.x = 12;
  instant += 1000;
  lecons.verifier();
  assert.equal(lecons.enLecon(loin), false);
  assert.match((loin.recus.findLast((m) => m.t === "info") as { texte: string }).texte, /éloignés/);
  instant += DUREE_LECON_S * 1000;
  lecons.verifier();
  assert.equal(loin.savoir.apprises.length, 0);
});

test("lire un manuel ouvre les recettes d'une famille ; dans la sienne, rien ; une seule fois", () => {
  const vide = savoirValide({});
  const lu = lireManuel(vide, "mecanistes", "manuel_forgeron");
  assert.ok(!("refus" in lu));
  if ("refus" in lu) return;
  assert.deepEqual(lu.savoir.manuels, ["charbonniers"]);
  assert.match(lu.message, /chez les Charbonniers/);
  assert.ok(lu.message.length <= 110, lu.message);
  for (const r of RECETTES_CHARBONNIERS) assert.ok(recettesConnues("mecanistes", lu.savoir).includes(r), r.id);
  assert.ok("refus" in lireManuel(lu.savoir, "mecanistes", "manuel_forgeron"));
  assert.ok("refus" in lireManuel(vide, "charbonniers", "manuel_forgeron"));
  assert.ok("refus" in lireManuel(vide, "charbonniers", "pierre" as TypeObjet));
});

test("un Mécaniste lit le Manuel du forgeron, monte une forge et forge une lame : ×1,5, et ★★", () => {
  const t = monter("mecanistes", { manuel_forgeron: 1, pierre: 12, barre_metal: 4, branche: 5, marteau: 1, charbon_bois: 2 });
  // Sans l'avoir lu : grisée.
  t.joueur.recevoir({ t: "fabriquer", recette: "forge", x: 20, z: 21.8, o: 0 });
  assert.match(t.infos().at(-1)!, /chez les Charbonniers/);
  t.joueur.recevoir({ t: "lire", objet: "manuel_forgeron" });
  t.attendre(9);
  assert.deepEqual(t.dernier("savoir")!.savoir.manuels, ["charbonniers"]);
  assert.equal(t.dernier("inventaire")?.inventaire.manuel_forgeron ?? 1, 1, "le livre reste dans le sac");
  // La forge : 8 pierres ×1,5 = 12, 1 barre → 2, 2 branches → 3.
  t.joueur.recevoir({ t: "fabriquer", recette: "forge", x: 20, z: 21.8, o: 0 });
  t.attendre(10);
  assert.ok(t.dernier("installation"));
  // Le couteau de fer doux : il se forge au foyer, sans bac de trempe (plan 0.8 : l'acier, lui, demande le bac).
  t.joueur.recevoir({ t: "fabriquer", recette: "lame_forgee_fer" });
  t.attendre(10);
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv["lame_forgee#2"], 1, t.infos().join(" | "));
  assert.equal(inv.lame_forgee, undefined);
  assert.equal(inv.barre_metal, undefined, "1 barre ×1,5 = 2");
  assert.equal(inv.charbon_bois, undefined);
  // Le savoir est gardé avec le personnage.
  assert.deepEqual(t.base.chargerSavoir(t.compte.id).manuels, ["charbonniers"]);
});

test("le contrôle des messages accepte la leçon et la lecture bien formées, et refuse le reste", () => {
  assert.equal(messageValide({ t: "lecon", op: { genre: "choisir", a: 3 } }), true);
  assert.equal(messageValide({ t: "lecon", op: { genre: "proposer", a: 3, recette: "lame_forgee" } }), true);
  assert.equal(messageValide({ t: "lecon", op: { genre: "repondre", accepte: true } }), true);
  assert.equal(messageValide({ t: "lecon", op: { genre: "annuler" } }), true);
  assert.equal(messageValide({ t: "lecon", op: { genre: "proposer", a: "3", recette: "x" } }), false);
  assert.equal(messageValide({ t: "lecon", op: { genre: "proposer", a: 3, recette: "x".repeat(100) } }), false);
  assert.equal(messageValide({ t: "lecon", op: { genre: "voler" } }), false);
  assert.equal(messageValide({ t: "lire", objet: "manuel_forgeron" }), true);
  assert.equal(messageValide({ t: "lire", objet: "toString" }), false);
});

test("un savoir illisible ou d'une autre version se lit sans planter", () => {
  assert.deepEqual(savoirValide(null), { apprises: [], manuels: [], enseignees: [], rayonnement: 0 });
  const s = savoirValide({ apprises: ["lame_forgee", "recette-disparue", 4], manuels: ["charbonniers", "pirates"], rayonnement: -3 });
  assert.deepEqual(s.apprises, ["lame_forgee"]);
  assert.deepEqual(s.manuels, ["charbonniers"]);
  assert.equal(s.rayonnement, 0);
  for (const f of FAMILLES) assert.ok(recettesConnues(f, s).length >= RECETTES_COMMUNES.length);
});
