// ⚙️ Les Mécanistes (Book 25 §6 et §10.3, chantier 7 · 0.6) : un Mécaniste seul monte une arbalète ★ avec son kit et
// une perche ; armée, elle tire tout de suite ; réarmer immobilise 3 s ; saisi, pas de tir ; la lourde met à terre en un
// carreau ; les mâchoires font un Rampant, celles de fortune se faussent en 5 prises. Et le reste du métier : les
// étoiles de l'arbalète, l'assommoir et la fosse, le tour, les accessoires du pédalier, la brouette.

import { test } from "node:test";
import { toutDevoile } from "../../commun/src/progression.ts";
import assert from "node:assert/strict";
import { nouvelEteint, type Eteint } from "../../commun/src/eteints.ts";
import type { Zone } from "../../commun/src/lieux.ts";
import type { InstallationVue, MessageServeur, ProjectileVu, Verbe } from "../../commun/src/messages.ts";
import { capaciteDe, traineTravois, type Inventaire } from "../../commun/src/objets.ts";
import { etoilesDuProduit, recette, recettePour } from "../../commun/src/recettes.ts";
import { ARMES_TIR, MUNITIONS, armeTirDe, armeTirExemplaire } from "../../commun/src/tir.ts";
import { rearmement, souffletSur } from "../../commun/src/mecanique.ts";
import type { Famille } from "../../commun/src/regles.ts";
import type { Arme } from "../../commun/src/combat.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { Tir, type ContexteTir } from "./tir.ts";
import { DECLENCHEURS_MECANIQUES, FilsDeRasoir } from "./mecanique.ts";
import { declencher, declencheurNeuf, type DeclencheurPose } from "./declencheurs.ts";
import { messageValide } from "./controle.ts";

/** Un terrain dégagé, sans obstacle : on n'y teste que le tir. */
const OUVERT: Zone = { xMin: 0, xMax: 100, zMin: 0, zMax: 100, obstacles: [] };

/** Un tireur de test, tout en mémoire (comme dans tir.test.ts), avec les vraies tables du tir. */
function tireur(inventaire: Inventaire, eteints: Eteint[] = []) {
  let instant = 1_000_000;
  const etat = {
    position: { x: 50, z: 30, o: 0 },
    inventaire: { ...inventaire } as Inventaire,
    endurance: 100,
    saisi: false,
    textes: [] as string[],
    recus: [] as MessageServeur[],
    uses: [] as Arme[],
    gestes: [] as { libelle: string; duree: number; appliquer: () => void }[],
  };
  const ctx: ContexteTir = {
    id: 3,
    maintenant: () => instant,
    alea: () => 0.9,
    position: () => etat.position,
    orienter: (o) => {
      etat.position = { ...etat.position, o };
    },
    lieu: () => "station",
    zone: () => OUVERT,
    eteints: () => eteints,
    inventaire: () => etat.inventaire,
    retirer: (cle, n) => {
      etat.inventaire[cle] = (etat.inventaire[cle] ?? 0) - n;
      if (!etat.inventaire[cle]) delete etat.inventaire[cle];
    },
    poserAuSol: () => {},
    saisi: () => etat.saisi,
    empeche: () => null,
    endurance: () => etat.endurance,
    depenser: (n) => {
      etat.endurance -= n;
    },
    info: (t) => etat.textes.push(t),
    indice: (_s, t) => etat.textes.push(t),
    envoyer: (m) => etat.recus.push(m),
    diffuser: (m) => etat.recus.push(m),
    user: (a) => etat.uses.push(a),
    apresDestruction: () => {},
    commencer: (libelle, duree, appliquer) => etat.gestes.push({ libelle, duree, appliquer }),
  };
  const tir = new Tir(ctx);
  const projectiles = () => etat.recus.filter((m) => m.t === "projectile").map((m) => (m as { projectile: ProjectileVu }).projectile);
  return { tir, etat, projectiles, attendre: (ms: number) => (instant += ms) };
}

/** Un Errant à `d` mètres devant le tireur (vers +z), qui le regarde. */
function devant(id: number, d: number, variante?: Eteint["variante"]): Eteint {
  const e = nouvelEteint(id, 50, 30 + d, "poursuivant", Math.PI);
  if (variante) e.variante = variante;
  return e;
}

// ---------- L'arbalète, ses valeurs ----------

test("⚙️ arbalète : dans ARMES_TIR (bloc « arbalète »), armée d'avance ; les carreaux en munitions, l'acier d'abord", () => {
  const a = armeTirDe("arbalete")!;
  assert.equal(a.armeeDAvance, true);
  assert.equal(a.porteeTete, 12, "réglage accepté : 12 m à ★★★");
  assert.equal(a.rechargeMs, 3000);
  const l = armeTirDe("arbalete_lourde")!;
  assert.equal(l.degatsPlein, 4, "★★★★ au niveau 3 : 4,0 (K48)");
  assert.deepEqual(MUNITIONS.filter((m) => m.pour.includes("arbalete")).map((m) => [m.objet, m.casse]), [["carreau_acier", 1 / 5], ["carreau", 1 / 3]]);
  assert.ok(ARMES_TIR.every((x) => x.metier));
  // Les étoiles règlent dégâts et portées (Book 25 §8.4 ; dégâts décidés, plan 0.8 §2.4) : ★ 1,1 et 8 m de tête,
  // ★★ 1,2 et 10 m.
  const une = armeTirExemplaire("arbalete#1", a);
  assert.ok(Math.abs(une.degatsPlein - 1.1) < 1e-9 && Math.abs(une.porteeTete - 8) < 1e-9 && Math.abs(une.porteeUtile - 10) < 1e-9);
  const deux = armeTirExemplaire("arbalete#2", a);
  assert.ok(Math.abs(deux.degatsPlein - 1.2) < 1e-9 && Math.abs(deux.porteeTete - 10) < 1e-9);
  // La lourde est déclarée à ★★★★ : sa clé nue a ses valeurs telles quelles.
  assert.equal(armeTirExemplaire("arbalete_lourde", l).degatsPlein, 4);
});

test("⚙️ arbalète armée : le tir part tout de suite et détruit à la tête à 11 m ; puis il faut la réarmer, 3 s, immobile", () => {
  const e = devant(1, 11);
  const t = tireur({ arbalete: 1, carreau: 3 }, [e]);
  t.tir.preparer("arbalete");
  // Aucun temps de bandage : on appuie, on relâche, le carreau part.
  t.tir.bander();
  t.tir.lancer(0, 1, 1);
  assert.equal(t.projectiles().length, 1);
  assert.equal(t.projectiles()[0]!.coup?.resultat, "detruit");
  assert.equal(t.etat.inventaire.carreau, 2);
  assert.equal(t.etat.endurance, 100, "l'arbalète armée ne coûte rien à tirer");
  // Désarmée : relâcher ne tire rien ; appuyer lance le geste « Réarmer », 3 s.
  t.attendre(1000);
  t.tir.lancer(0, 1);
  assert.equal(t.projectiles().length, 1);
  t.tir.bander();
  assert.equal(t.etat.gestes.length, 1);
  assert.equal(t.etat.gestes[0]!.duree, 3);
  assert.match(t.etat.gestes[0]!.libelle, /Réarmer l'arbalète/);
  t.etat.gestes[0]!.appliquer();
  assert.equal(t.etat.endurance, 90, "réarmer : 10 d'endurance");
  t.tir.lancer(0, 1, 1);
  assert.equal(t.projectiles().length, 2);
});

test("⚙️ arbalète : au-delà de la portée de tête, le carreau touche le torse ; ★ : 8 m de tête seulement", () => {
  const loin = devant(1, 13);
  const t = tireur({ arbalete: 1, carreau: 2 }, [loin]);
  t.tir.preparer("arbalete");
  t.tir.lancer(0, 1, 1);
  assert.equal(t.projectiles()[0]!.coup?.resultat, "vacille");
  const e = devant(2, 9);
  const u = tireur({ "arbalete#1": 1, carreau: 2 }, [e]);
  u.tir.preparer("arbalete#1");
  u.tir.lancer(0, 1, 2);
  assert.notEqual(u.projectiles()[0]!.coup?.resultat, "detruit", "★ : la tête à 8 m, pas à 9");
});

test("⚙️ arbalète : saisi, pas de tir ; sans carreau, rien ; l'Équipé, de face, à la moitié de la portée de tête", () => {
  const t = tireur({ arbalete: 1, carreau: 2 }, [devant(1, 4)]);
  t.tir.preparer("arbalete");
  t.etat.saisi = true;
  t.tir.lancer(0, 1, 1);
  assert.equal(t.projectiles().length, 0);
  assert.match(t.etat.textes.at(-1)!, /Il te tient/);
  const vide = tireur({ arbalete: 1 }, [devant(1, 4)]);
  vide.tir.preparer("arbalete");
  vide.tir.lancer(0, 1, 1);
  assert.equal(vide.projectiles().length, 0);
  assert.match(vide.etat.textes.at(-1)!, /carreaux/);
  // Un Équipé de face à 5 m : détruit (5 ≤ 6) ; à 8 m, non.
  const pres = tireur({ arbalete: 1, carreau: 1 }, [devant(1, 5, "equipe")]);
  pres.tir.preparer("arbalete");
  pres.tir.lancer(0, 1, 1);
  assert.equal(pres.projectiles()[0]!.coup?.resultat, "detruit");
  const loin = tireur({ arbalete: 1, carreau: 1 }, [devant(1, 8, "equipe")]);
  loin.tir.preparer("arbalete");
  loin.tir.lancer(0, 1, 1);
  assert.notEqual(loin.projectiles()[0]!.coup?.resultat, "detruit");
});

test("⚙️ arbalète lourde : un carreau au torse met à terre ; on la réarme au cranequin (4 s) ou au pied-de-biche (6 s), pas au pied", () => {
  const e = devant(1, 18);
  const t = tireur({ arbalete_lourde: 1, carreau: 3 }, [e]);
  t.tir.preparer("arbalete_lourde");
  t.tir.lancer(0, 1, 1);
  assert.equal(t.projectiles()[0]!.coup?.resultat, "a_terre");
  t.attendre(1000);
  t.tir.rearmer();
  assert.equal(t.etat.gestes.length, 0);
  assert.match(t.etat.textes.at(-1)!, /Trop raide pour le pied : il faut un cranequin ou un pied-de-biche/);
  t.etat.inventaire.pied_de_biche = 1;
  t.tir.rearmer();
  assert.equal(t.etat.gestes.at(-1)!.duree, 6);
  t.etat.inventaire.cranequin = 1;
  t.tir.rearmer();
  assert.equal(t.etat.gestes.at(-1)!.duree, 4);
  assert.match(t.etat.gestes.at(-1)!.libelle, /cranequin/);
  const l = armeTirDe("arbalete_lourde")!;
  assert.deepEqual(rearmement(l, {}), null);
  assert.deepEqual(rearmement(armeTirDe("arbalete")!, {}), { ms: 3000, outil: null });
});

// ---------- Les étoiles de l'arbalète (Book 25 §6.1 : le maillon faible) ----------

test("⚙️ étoiles de l'arbalète : frêne et noix de bois ★ ; lame brute ★★ ; if et noix d'os ★★★ ; ressort retrempé et noix forgée ★★★★ ; hors famille ★★", () => {
  const r = recette("arbalete")!;
  const sac = (arc: number, noix: number, arbrier = 4): Inventaire => ({ [`arbrier${arbrier === 4 ? "" : `#${arbrier}`}`]: 1, [`noix_detente#${noix}`]: 1, [`arc_arbalete${arc === 3 ? "" : `#${arc}`}`]: 1, corde_arbalete: 1 }) as Inventaire;
  assert.equal(etoilesDuProduit(r, sac(1, 2)), 1);
  assert.equal(etoilesDuProduit(r, sac(2, 2)), 2);
  assert.equal(etoilesDuProduit(r, sac(3, 3)), 3);
  assert.equal(etoilesDuProduit(r, sac(4, 4)), 4);
  assert.equal(etoilesDuProduit(r, sac(4, 4), { horsFamille: true }), 2);
  assert.equal(etoilesDuProduit(r, sac(4, 4), { maitrise: true }), 5);
  // La lourde : deux ressorts retrempés (★★★★) ; une noix d'os la tient à ★★★.
  const l = recette("arbalete_lourde")!;
  assert.equal(etoilesDuProduit(l, { arbrier: 1, "noix_detente#4": 1, ressort_retrempe: 2, corde_arbalete: 1 } as Inventaire), 4);
  assert.equal(etoilesDuProduit(l, { arbrier: 1, noix_detente: 1, ressort_retrempe: 2, corde_arbalete: 1 }), 3);
  // Le ciseau à bois d'un Charbonnier : l'arbrier gagne une étoile.
  assert.equal(etoilesDuProduit(recette("arbrier")!, { buche: 1, scie: 1 }), 4);
  assert.equal(etoilesDuProduit(recette("arbrier")!, { buche: 1, scie: 1, ciseau_bois: 1 }), 5);
  // Hors famille : ×1,5 en matières.
  assert.deepEqual(recettePour(recette("carreaux_os")!, "charbonniers").ingredients, { branche: 2, plumes: 2, os: 3 });
});

// ---------- Dans le jeu : un Mécaniste seul ----------

/** Ces tests ne portent pas sur les Éteints de la lisière : aucun n'en vient. */
const JAMAIS_D_ETEINT = () => 1;

function monter(famille: Famille, depart: Record<string, number>, poses: { type: InstallationVue["type"]; x: number; z: number; etat: InstallationVue["etat"] }[] = []) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Lucien", "manivelle7", famille);
  // Ces tests portent sur le métier, pas sur l'arbre de progression : tout est dévoilé.
  base.sauverProgression(compte.id, toutDevoile(famille));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...depart });
  for (const i of poses) base.sauverEtatInstallation(compte.id, base.ajouterInstallation(compte.id, i.type, i.x, i.z, 0).id, i.etat);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), JAMAIS_D_ETEINT);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const inventaire = () => dernier("inventaire")?.inventaire ?? {};
  const fabriquer = (recette: string, secondes: number) => {
    joueur.recevoir({ t: "fabriquer", recette });
    attendre(secondes + 0.5);
  };
  const construire = (recette: string, secondes: number, x = 20, z = 21.8) => {
    joueur.recevoir({ t: "fabriquer", recette, x, z, o: 0 });
    attendre(secondes + 0.5);
    return dernier("installation")!.installation;
  };
  const utiliser = (id: number, verbe: Verbe) => joueur.recevoir({ t: "interagir", cible: { genre: "installation", id }, verbe });
  return { joueur, attendre, dernier, infos, inventaire, fabriquer, construire, utiliser };
}

test("⚙️ un Mécaniste seul monte une arbalète ★ avec son kit et une perche de frêne (règle d'or du Book 25 §2.5)", () => {
  // Le kit mécaniste (scie, clé plate, couteau), une pierre et la tête de hache de la caisse pour l'établi (plan 0.8 :
  // Fendre 1), ce qu'on trouve au terrain et dans une épave. R26 (0.8.2) : le pédalier générateur et son petit
  // alternateur sont posés plus loin (l'arbalète attend le meuble de famille complet, même avec l'établi).
  const pedalier = [{ type: "pedalier" as const, x: 30, z: 30, etat: { alternateur: true } }];
  const t = monter("mecanistes", { scie: 1, cle_plate: 1, couteau: 1, tete_hache: 1, corde: 1, pierre: 1, buche: 5, branche: 7, petit_ressort: 1, perche_frene: 1, ceinture_securite: 1 }, pedalier);
  t.construire("etabli", 4.5);
  t.fabriquer("arbrier", 4.5);
  t.fabriquer("noix_bois", 2);
  t.fabriquer("arc_arbalete_frene", 2);
  t.fabriquer("corde_arbalete_ceinture", 2);
  const avant = t.inventaire();
  assert.equal(avant.arbrier, 1, "l'arbrier à la scie : ★★★★, sa clé nue");
  assert.equal(avant["noix_detente#2" as "arbrier"], 1);
  assert.equal(avant["arc_arbalete#1" as "arbrier"], 1);
  t.fabriquer("arbalete", 2);
  const inv = t.inventaire();
  assert.equal(inv["arbalete#1" as "arbalete"], 1, `une arbalète ★ : ${JSON.stringify(inv)}`);
  assert.equal(inv.arbrier, undefined);
  assert.equal(inv.corde_arbalete, undefined);
});

test("⚙️ un Voltaïque ne voit pas l'arbalète dans ses recettes tant qu'il ne l'a pas apprise", () => {
  const t = monter("voltaiques", { arbrier: 1, noix_detente: 1, arc_arbalete: 1, corde_arbalete: 1 });
  t.fabriquer("arbalete", 2);
  assert.equal(t.inventaire().arbalete, undefined);
});

test("⚙️ les mâchoires de fortune font un Rampant tenu sur place ; on les réarme (10 s, 15 d'endurance) ; faussées en 5 prises", () => {
  const t = monter("mecanistes", { cle_plate: 1, pierre: 1, ressort_lames: 2, barre_metal: 1, corde: 1, bocal_clous: 1 });
  const piege = t.construire("machoires_fortune", 2, 20, 23);
  assert.equal(piege.type, "machoires_fortune");
  // Un Éteint passe dessus.
  const e = nouvelEteint(1, 20, 23, "poursuivant");
  t.joueur["eteints"] = [e];
  t.attendre(0.3, 0.1);
  assert.equal(e.variante, "rampant");
  assert.ok((e.retenu ?? 0) > 0, "tenu sur place");
  assert.notEqual(e.etat, "detruit", "un piège ne détruit pas");
  assert.match(t.infos().join(" "), /mâchoires ont pris un Éteint/);
  let vue = t.dernier("installation")!.installation;
  assert.equal(vue.etat.declencheur?.arme, false);
  // Réarmer : il faut s'approcher, et le geste dure 10 s.
  t.joueur["eteints"] = [];
  t.joueur.position = { x: 20, z: 22, o: 0 };
  t.utiliser(piege.id, "rearmer_piege");
  t.attendre(10.5);
  vue = t.dernier("installation")!.installation;
  assert.equal(vue.etat.declencheur?.arme, true);
  // Quatre prises de plus : à la cinquième, elles se faussent et ne se réarment plus.
  for (let i = 2; i <= 5; i++) {
    t.joueur["eteints"] = [nouvelEteint(i, 20, 23, "poursuivant")];
    t.joueur.position = { x: 20, z: 20, o: 0 };
    t.attendre(0.3, 0.1);
    t.joueur["eteints"] = [];
    t.joueur.position = { x: 20, z: 22, o: 0 };
    if (i < 5) {
      t.utiliser(piege.id, "rearmer_piege");
      t.attendre(10.5);
    }
  }
  vue = t.dernier("installation")!.installation;
  assert.equal(vue.etat.declencheur?.fausse, true);
  t.utiliser(piege.id, "rearmer_piege");
  assert.match(t.infos().at(-1)!, /Faussées/);
});

test("⚙️ pièges : l'assommoir met à terre, la fosse tient 20 s ; le vrai piège à mâchoires tient 20 s et ne se fausse pas", () => {
  const terrain: Zone = { xMin: 0, xMax: 60, zMin: 0, zMax: 60, obstacles: [] };
  const pose = (id: number, type: string): DeclencheurPose => ({ id, type, x: 10, z: 10, o: 0, etat: declencheurNeuf() });
  const types = DECLENCHEURS_MECANIQUES.map((d) => d.type);
  assert.deepEqual(types, ["assommoir", "machoires_fortune", "piege_machoires", "fosse_pieux"]);
  const a = nouvelEteint(1, 10, 10.3, "poursuivant");
  declencher([pose(1, "assommoir")], [a], 0, terrain);
  assert.equal(a.etat, "a_terre");
  assert.equal(a.aTerre, 5);
  const f = nouvelEteint(2, 10.4, 10, "poursuivant");
  declencher([pose(2, "fosse_pieux")], [f], 0, terrain);
  assert.equal(f.etat, "a_terre");
  assert.equal(f.aTerre, 20);
  const p = pose(3, "piege_machoires");
  for (let i = 0; i < 8; i++) {
    const e = nouvelEteint(10 + i, 10, 10, "poursuivant");
    declencher([p], [e], i * 10_000, terrain);
    assert.equal(e.variante, "rampant");
    assert.equal(e.retenu, 20);
    p.etat.arme = true;
  }
  assert.equal(p.etat.fausse, undefined, "le ressort retrempé ne se fausse pas");
});

test("⚙️ le tour à perche se construit ; on y tourne un manche ; sans tour, non", () => {
  const t = monter("mecanistes", { couteau: 1, cle_plate: 1, perche_frene: 1, corde: 1, buche: 4, branche: 4 });
  t.fabriquer("manche_tourne", 2);
  assert.match(t.infos().at(-1)!, /tour à perche/);
  const tour = t.construire("tour_perche", 3);
  assert.equal(tour.type, "tour_perche");
  t.fabriquer("manche_tourne", 2);
  assert.equal(t.inventaire().manche_tourne, 1);
});

test("⚙️ pédalier : le ventilateur à manivelle et la meule fine se montent, se rendent au démontage ; le ventilateur souffle sur une forge à 3 m", () => {
  const t = monter("mecanistes", { cle_plate: 1, couteau: 1, cadre_velo: 1, chaine_velo: 1, roue_velo: 2, buche: 2, pierre: 4, chiffons: 1, bache: 1, branche: 4, marteau: 1, tournevis: 1 });
  const p = t.construire("pedalier", 4.5);
  t.utiliser(p.id, "monter_meule_fine");
  assert.match(t.infos().at(-1)!, /Monte d'abord la meule/);
  t.utiliser(p.id, "monter_meule");
  t.attendre(20.5);
  t.utiliser(p.id, "monter_meule_fine");
  t.attendre(15.5);
  t.utiliser(p.id, "monter_soufflet");
  t.attendre(30.5);
  const vue = t.dernier("installation")!.installation;
  assert.equal(vue.etat.meuleFine, true);
  assert.equal(vue.etat.soufflet, true);
  assert.equal(t.inventaire().bache, undefined);
  assert.ok(souffletSur({ x: vue.x + 2, z: vue.z }, [vue]));
  assert.ok(!souffletSur({ x: vue.x + 4, z: vue.z }, [vue]));
  // Démonté, le pédalier rend ses accessoires (le soufflet entier : roue, bâche ; la moitié des branches).
  t.utiliser(p.id, "demonter_installation");
  t.attendre(3);
  const inv = t.inventaire();
  assert.equal(inv.bache, 1);
  assert.ok((inv.roue_velo ?? 0) >= 2);
  assert.ok((inv.chiffons ?? 0) >= 1);
});

test("⚙️ meule fine : une lame affûtée y gagne un fil de rasoir (+10 %) jusqu'à ce qu'elle casse", () => {
  const f = new FilsDeRasoir();
  const machette: Arme = { objet: "machette", nom: "la machette", type: "tranchant", solidite: 40, degatsTorse: 1.2, tueALaTete: true, allonge: 1.6, coup: 500, coupAppuye: 750 };
  assert.equal(f.affile(machette, "machette").degatsTorse, 1.2);
  f.affuter("machette");
  assert.ok(Math.abs(f.affile(machette, "machette").degatsTorse - 1.32) < 1e-9);
  f.casse("machette");
  assert.equal(f.affile(machette, "machette").degatsTorse, 1.2);
});

test("⚙️ brouette : 60 kg roulés de plus que le sac, et l'on court encore", () => {
  assert.equal(capaciteDe({ sac_a_dos: 1, brouette: 1 }) - capaciteDe({ sac_a_dos: 1 }), 60);
  assert.equal(capaciteDe({ sac_a_dos: 1, brouette: 1, travois: 1 }) - capaciteDe({ sac_a_dos: 1 }), 60, "la meilleure des deux");
  assert.equal(traineTravois({ sac_a_dos: 1, travois: 1, brouette: 1, buche: 30 }), false);
  assert.equal(traineTravois({ sac_a_dos: 1, travois: 1, buche: 30 }), true);
});

test("⚙️ contrôle : réarmer un piège, monter un accessoire ne visent qu'une installation désignée par son numéro", () => {
  for (const verbe of ["rearmer_piege", "monter_soufflet", "monter_meule_fine"]) {
    assert.ok(messageValide({ t: "interagir", cible: { genre: "installation", id: 4 }, verbe }));
    assert.ok(!messageValide({ t: "interagir", cible: { genre: "feu", id: 4 }, verbe }));
    assert.ok(!messageValide({ t: "interagir", cible: { genre: "installation", id: 4.5 }, verbe }));
  }
});
