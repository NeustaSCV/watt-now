// Plan 0.8, chantier 12 : L1B, le Moulin du Gué. Un lieu à soi (un Moulin par joueur), son parcours (M1 à M35), son
// butin à place fixe et sa réinitialisation à 24 h (§9.1, N1), sa vue par pièce, la fosse du rouet.

import { test } from "node:test";
import assert from "node:assert/strict";
import { avancer } from "../../commun/src/deplacement.ts";
import { eteintsMoulin } from "../../commun/src/eteints-moulin.ts";
import { lignee } from "../../commun/src/lignees.ts";
import { MOULIN, SORTIES_MOULIN, ZONE_MOULIN, arriveeDans, dansBoite, entreesDe, heurte, sortieIci, zoneMoulin, type Zone } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import {
  CARNET_DU_MEUNIER,
  ORIGINE_MODELE_MOULIN,
  PIECES_MOULIN,
  PORTES_MOULIN,
  TEXTE_GRANDE_PORTE_FERMEE,
  dansLaFosse,
  jeu,
  pieceMoulin,
  portesInitialesMoulin,
  sombreMoulin,
} from "../../commun/src/moulin.ts";
import { toutDevoile } from "../../commun/src/progression.ts";
import { USAGES } from "../../commun/src/terrain.ts";
import { PLAN_VUE_MOULIN } from "../../commun/src/vue-lieux.ts";
import { obstaclesVue, voit } from "../../commun/src/vue.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { Moulins, aReinitialiser, type EtatMoulin } from "./moulin.ts";

rendreSilencieux(true);

const H = 3_600_000;

/** Un monde en mémoire, et des joueurs qui se connectent dans leur Moulin (au pont). */
function monter() {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const moulins = new Moulins(base, () => 0.5, () => instant);
  const lieux = { halte: new Halte(base), gue: new Gue(base), cooperatives: new Cooperatives(base) };
  const joueurs: Joueur[] = [];
  const connecter = (compte: { id: number; pseudo: string; famille: "voltaiques" }) => {
    const recus: MessageServeur[] = [];
    const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, lieux.halte, () => 0.5, new Comptoir(base, instant), lieux.cooperatives, lieux.gue, moulins);
    joueurs.push(joueur);
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    const sac = () => dernier("inventaire")?.inventaire ?? base.chargerInventaire(compte.id);
    return { compte, joueur, recus, dernier, infos, sac };
  };
  const nouveau = (pseudo: string, inventaire: Record<string, number> = {}) => {
    const compte = base.creerCompte(pseudo, "potager42", "voltaiques");
    base.sauverProgression(compte.id, toutDevoile("voltaiques"));
    base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
    // Il était dans son Moulin : il y revient, au pont (M19).
    base.sauverPosition(compte.id, { x: 10, z: 10, o: 0 }, "moulin", instant);
    return connecter({ id: compte.id, pseudo, famille: "voltaiques" });
  };
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      for (const j of joueurs) j.tick(pas);
      moulins.tick(instant, pas);
    }
  };
  const partir = (j: Joueur) => {
    j.partir();
    joueurs.splice(joueurs.indexOf(j), 1);
  };
  return { base, moulins, nouveau, connecter, attendre, partir, sauter: (ms: number) => (instant += ms), maintenant: () => instant };
}

/** Un point du modèle (repère du jeu), tourné vers un autre. */
const ici = (x: number, z: number, o = 0) => ({ ...jeu(x, z), o });
const point = (type: string, moulin: ReturnType<Moulins["de"]>) => [...moulin.ressources.values()].find((r) => r.type === type)!;

/** Le joueur va prendre ce point de butin (téléporté à 0,8 m) et attend la fin du geste. */
function prendre(t: ReturnType<typeof monter>, j: Joueur, moulin: ReturnType<Moulins["de"]>, type: string) {
  const r = point(type, moulin);
  j.position = { x: r.x, z: r.z + 0.8, o: Math.PI };
  j.recevoir({ t: "interagir", cible: { genre: "ressource", id: r.id }, verbe: "fouiller" });
  t.attendre(USAGES[r.type].duree + 1);
}

/** Les Éteints ne gênent pas un test de butin : on les couche tous. */
function calmer(moulin: ReturnType<Moulins["de"]>) {
  for (const e of moulin.eteints) e.etat = "detruit";
}

test("les dimensions du lot sont celles de lieux.ts", () => {
  assert.deepEqual(ORIGINE_MODELE_MOULIN, MOULIN.origineModele);
  assert.equal(MOULIN.largeur, 64);
  assert.equal(MOULIN.profondeur, 54);
});

test("M19 : on arrive toujours au pont, et une reconnexion y ramène ; on ne peut pas entrer par le halage (M18)", () => {
  const pont = arriveeDans("moulin", "gue");
  assert.deepEqual({ x: pont.x, z: pont.z }, jeu(28.5, 20.5));
  assert.deepEqual(arriveeDans("moulin", "terrain"), pont);
  assert.equal(entreesDe("moulin").length, 1, "une seule entrée : le pont");
  const halage = SORTIES_MOULIN.find((s) => s.sansArrivee)!;
  assert.equal(halage.vers, "gue");
  assert.ok(dansBoite(jeu(15, -26).x, jeu(15, -26).z, halage.boite), "au bout de la levée");
  const t = monter();
  const a = t.nouveau("Rose");
  assert.deepEqual({ x: a.joueur.position.x, z: a.joueur.position.z }, { x: pont.x, z: pont.z });
  assert.equal(a.joueur.lieu, "moulin");
});

test("M32 : 22 Éteints dont 9 dormants à l'entrée d'un Moulin neuf, aucun à moins de 15 m du pont", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const moulin = t.moulins.de(a.compte.id);
  assert.equal(moulin.eteints.length, 22);
  assert.equal(moulin.eteints.filter((e) => e.etat === "dormant").length, 9);
  assert.equal(moulin.eteints.filter((e) => e.variante === "rampant").length, 4);
  assert.equal(moulin.eteints.filter((e) => e.variante === "equipe").length, 2);
  assert.equal(moulin.eteints.filter((e) => e.groupe === 1).length, 3, "les garçons meuniers");
  const pont = arriveeDans("moulin", "gue");
  for (const e of moulin.eteints) assert.ok(Math.hypot(e.x - pont.x, e.z - pont.z) >= 15, `E${e.id} trop près du pont`);
  // Chacun dans la pièce que dit la fiche.
  const piece = (n: number) => pieceMoulin(moulin.eteints.find((e) => e.id === n)!.x, moulin.eteints.find((e) => e.id === n)!.z);
  assert.equal(piece(6), "atelier");
  assert.equal(piece(8), "meules_sud");
  assert.equal(piece(12), "meules_nord");
  assert.equal(piece(15), "magasin");
  assert.equal(piece(20), "jardin");
  assert.ok(dansLaFosse(moulin.eteints.find((e) => e.id === 11)!.x, moulin.eteints.find((e) => e.id === 11)!.z), "E11 au fond de la fosse");
});

test("M30 : les pièces sombres sont la salle de la roue, les meules nord et le magasin", () => {
  const sombres = Object.entries(PIECES_MOULIN).filter(([, p]) => p.sombre).map(([n]) => n).sort();
  assert.deepEqual(sombres, ["magasin", "meules_nord", "roue"]);
  assert.ok(sombreMoulin(jeu(-11, -8).x, jeu(-11, -8).z));
  assert.ok(!sombreMoulin(jeu(1, -2).x, jeu(1, -2).z), "les meules sud sont éclairées par leurs fenêtres");
  assert.equal(PLAN_VUE_MOULIN.pieces.length, 11);
});

test("un autre joueur ne voit pas mon Moulin : chacun le sien, ses Éteints, son butin", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const b = t.nouveau("Basile");
  const ma = t.moulins.de(a.compte.id);
  const mb = t.moulins.de(b.compte.id);
  assert.notEqual(ma, mb);
  ma.eteints.find((e) => e.id === 2)!.etat = "detruit";
  assert.equal(mb.eteints.find((e) => e.id === 2)!.etat, "errant");
  calmer(ma);
  prendre(t, a.joueur, ma, "moulin_cle");
  assert.equal(a.sac().cle_moulin, 1);
  assert.ok(mb.disponiblePour(point("moulin_cle", mb), b.compte.id, t.maintenant()), "la clé de Basile est toujours au tableau");
  // Les messages de l'un ne vont pas à l'autre : Basile ne reçoit rien de ce qui se passe chez Rose.
  assert.ok(!b.recus.some((m) => m.t === "ressource" && m.id === point("moulin_cle", ma).id && !m.disponible));
});

test("à la première visite, les trois clés, la grosse clé, la fourche, l'if et les 2 bûches sont là ; le carnet est dans la malle", () => {
  const t = monter();
  const a = t.nouveau("Rose", { couteau: 1, cle_plate: 1 });
  const moulin = t.moulins.de(a.compte.id);
  calmer(moulin);
  for (const type of ["moulin_cle", "moulin_fourche", "moulin_jute", "moulin_feuillards", "moulin_etau", "if_bief", "poutres_chene"]) {
    assert.ok(moulin.disponiblePour(point(type, moulin), a.compte.id, t.maintenant()), type);
    prendre(t, a.joueur, moulin, type);
  }
  const sac = a.sac();
  assert.equal(sac.cle_moulin, 1);
  assert.equal(sac.fourche_foin, 1);
  assert.equal(sac.toile_jute, 1);
  assert.equal(sac.feuillards, 1);
  assert.equal(sac.etau, 1);
  assert.equal(sac.baton_if, 1);
  assert.equal(sac.buche, 2, "les poutres de rechange : 2 bûches garanties (B11)");
  // Les points sont là où le dit le plan : les clés au nord, la grosse clé et la fourche dans les dépendances.
  const ou = (type: string) => pieceMoulin(point(type, moulin).x, point(type, moulin).z);
  assert.equal(ou("moulin_cle"), "atelier");
  assert.equal(ou("moulin_fourche"), "etable");
  assert.equal(ou("moulin_etau"), "meules_nord");
  assert.equal(ou("poutres_chene"), "roue");
  assert.equal(ou("moulin_jute"), "magasin");
  assert.equal(ou("moulin_feuillards"), "magasin");
  assert.equal(ou("if_bief"), "jardin");
  // M28 : la malle du meunier livre son carnet (il dit où est la clé, et que l'étau est monté au moulin).
  prendre(t, a.joueur, moulin, "moulin_malle");
  assert.ok(a.infos().includes(CARNET_DU_MEUNIER));
  assert.match(CARNET_DU_MEUNIER, /tableau de l'atelier/);
  assert.match(CARNET_DU_MEUNIER, /étau/);
});

test("M3 : décrocher la grosse clé est un geste silencieux d'une seconde", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const moulin = t.moulins.de(a.compte.id);
  const r = point("moulin_cle", moulin);
  a.joueur.position = { x: r.x, z: r.z + 0.8, o: Math.PI };
  a.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: r.id }, verbe: "ramasser" });
  const debut = a.dernier("action")!;
  assert.equal(debut.etat, "debut");
  assert.equal(debut.bruit, "aucun");
  assert.equal(debut.duree, 1);
  // Les deux dormants de l'atelier sont à 3,5 m : immobile, on la décroche sans les réveiller.
  t.attendre(1.5);
  assert.equal(a.sac().cle_moulin, 1);
  for (const n of [6, 7]) assert.equal(moulin.eteints.find((e) => e.id === n)!.etat, "dormant");
});

test("M5, M4, M6 : la grande porte refuse sans la clé ; avec, elle s'ouvre en grinçant, et reste déverrouillée", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const moulin = t.moulins.de(a.compte.id);
  const devant = ici(1, 2.2, Math.PI);
  const ouvrir = (oui = true) => a.joueur.recevoir({ t: "interagir", cible: { genre: "porte", id: "grande_porte" }, verbe: oui ? "ouvrir_porte" : "fermer_porte" });
  a.joueur.position = devant;
  ouvrir();
  assert.equal(moulin.portes.grande_porte, false);
  assert.equal(a.infos().at(-1), TEXTE_GRANDE_PORTE_FERMEE, "une ligne de message, jamais une fenêtre");
  assert.ok(heurte(moulin.zone, jeu(1, 1).x, jeu(1, 1).z, 0.35), "fermée, on ne passe pas");
  // La clé au tableau ; puis la porte.
  calmer(moulin);
  prendre(t, a.joueur, moulin, "moulin_cle");
  a.joueur.position = devant;
  ouvrir();
  assert.equal(moulin.portes.grande_porte, true);
  assert.equal(a.sac().cle_moulin ?? 0, 0, "la clé reste dans la serrure");
  assert.ok(moulin.bruitEnCours("porte:grande_porte", t.maintenant()), "elle grince");
  assert.ok(!heurte(moulin.zone, jeu(1, 1).x, jeu(1, 1).z, 0.35), "ouverte, on passe");
  // On la referme derrière soi, on la rouvre sans clé : elle n'est plus verrouillée.
  t.attendre(2);
  ouvrir(false);
  assert.equal(moulin.portes.grande_porte, false);
  ouvrir();
  assert.equal(moulin.portes.grande_porte, true);
  // Elle le reste d'une visite à l'autre.
  t.attendre(1);
  t.partir(a.joueur);
  t.attendre(6 * 60, 5);
  assert.equal(t.moulins.nombre, 0);
  t.sauter(H);
  const autre = new Moulins(t.base, () => 0.5, t.maintenant).de(a.compte.id);
  assert.equal(autre.portes.grande_porte, true);
});

test("les garçons meuniers, derrière la grande porte fermée : on ne les voit pas, on les entend (onde)", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const moulin = t.moulins.de(a.compte.id);
  // Devant la porte, dans la cour : les trois sont à 3 m, derrière le mur et la porte fermée.
  a.joueur.position = ici(1.3, 2.5, Math.PI);
  const meuniers = moulin.eteints.filter((e) => e.groupe === 1);
  // Seuls les garçons meuniers : on n'entend qu'eux.
  for (const e of moulin.eteints) if (e.groupe !== 1) e.etat = "detruit";
  const vus = () => moulin.eteintsVus(a.joueur.position).map((e) => e.id);
  assert.ok(meuniers.every((e) => !vus().includes(e.id)));
  for (let i = 0; i < 40; i++) {
    for (const e of meuniers) {
      e.x = jeu(1 + Math.sin(i / 3), -1).x;
      e.z = jeu(0, -1).z;
    }
    t.attendre(0.25);
  }
  const eteintsRecus = a.recus.filter((m) => m.t === "eteints").flatMap((m) => (m as { eteints: { id: number }[] }).eteints);
  assert.ok(!eteintsRecus.some((e) => meuniers.some((m) => m.id === e.id)), "jamais envoyés");
  const bruits = a.recus.filter((m) => m.t === "bruits").flatMap((m) => (m as { bruits: { x: number; z: number }[] }).bruits);
  assert.ok(bruits.length > 0, "on les entend");
  for (const b of bruits) assert.equal(pieceMoulin(b.x, b.z), "dehors", "le point de passage est de notre côté");
  // La porte ouverte : on les voit.
  moulin.basculerPorte("grande_porte", true);
  a.joueur.position = ici(1, 1.6, Math.PI);
  assert.ok(meuniers.some((e) => moulin.eteintsVus(a.joueur.position).some((v) => v.id === e.id)));
});

test("M9 : la claire-voie du beffroi laisse passer la vue, pas les corps ; le couloir du rouet relie les meules", () => {
  const ov = obstaclesVue(PLAN_VUE_MOULIN, { grande_porte: true });
  const sud = jeu(1, -3);
  const nord = jeu(1, -10);
  assert.ok(voit(ov, sud.x, sud.z, nord.x, nord.z), "des meules sud, on voit les meules nord");
  // Mais on ne passe pas : à pied, du sud au nord, il faut faire le tour par la salle de la roue.
  const zone = zoneMoulin({ grande_porte: true });
  assert.ok(!atteignable(zone, jeu(1, -3), jeu(1, -10), (x, z) => pieceMoulin(x, z) !== "roue"), "pas à travers le beffroi");
  assert.ok(atteignable(zone, jeu(1, -3), jeu(1, -10)), "par le couloir du rouet");
  // Le mur du jardin arrête la vue ; la fenêtre nord des meules nord donne sur l'if (M34).
  const ifBief = jeu(8.4, -16.3);
  const fenetre = jeu(-0.5, -10.6);
  assert.ok(voit(ov, fenetre.x, fenetre.z, ifBief.x, ifBief.z), "on voit l'if avant d'y être");
  assert.ok(!voit(ov, jeu(-19.5, -4).x, jeu(-19.5, -4).z, jeu(-19.5, -9).x, jeu(-19.5, -9).z), "le mur du jardin arrête la vue");
});

/** Peut-on aller à pied de a à b (un personnage de 0,35 m de rayon), en restant où `permis` le dit ? Grille de 0,25 m. */
function atteignable(zone: Zone, a: { x: number; z: number }, b: { x: number; z: number }, permis: (x: number, z: number) => boolean = () => true): boolean {
  const pas = 0.25;
  const nx = Math.round((zone.xMax - zone.xMin) / pas);
  const nz = Math.round((zone.zMax - zone.zMin) / pas);
  const libre = (i: number, j: number) => {
    const x = zone.xMin + i * pas;
    const z = zone.zMin + j * pas;
    return permis(x, z) && !heurte(zone, x, z, 0.35);
  };
  const vu = new Uint8Array((nx + 1) * (nz + 1));
  const debut = [Math.round((a.x - zone.xMin) / pas), Math.round((a.z - zone.zMin) / pas)] as const;
  const fin = [Math.round((b.x - zone.xMin) / pas), Math.round((b.z - zone.zMin) / pas)] as const;
  const pile: number[] = [debut[0], debut[1]];
  vu[debut[1] * (nx + 1) + debut[0]] = 1;
  while (pile.length) {
    const j = pile.pop()!;
    const i = pile.pop()!;
    if (Math.abs(i - fin[0]) <= 1 && Math.abs(j - fin[1]) <= 1) return true;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ii = i + di;
      const jj = j + dj;
      if (ii < 0 || jj < 0 || ii > nx || jj > nz || vu[jj * (nx + 1) + ii]) continue;
      vu[jj * (nx + 1) + ii] = 1;
      if (libre(ii, jj)) pile.push(ii, jj);
    }
  }
  return false;
}

test("le parcours (M1 à M20) : du pont, la grande porte fermée, le nord est inaccessible ; ouverte, on va jusqu'au halage", () => {
  const pont = arriveeDans("moulin", "gue");
  const halage = SORTIES_MOULIN.find((s) => s.sansArrivee)!.boite;
  const jardin = jeu(-5, -18);
  const fermee = zoneMoulin(portesInitialesMoulin());
  for (const [nom, x, z] of [["l'atelier (la clé)", -17, 10.5], ["l'étable (la fourche)", -7.5, 11], ["la boutique (cul-de-sac)", -12, 1.5], ["le logis", -23, 2.6]] as const) {
    assert.ok(atteignable(fermee, pont, jeu(x, z)), `du pont à ${nom}`);
  }
  assert.ok(!atteignable(fermee, pont, jeu(1, -2)), "les meules sud : derrière la grande porte");
  assert.ok(!atteignable(fermee, pont, jardin), "le jardin est clos (M16)");
  assert.ok(!atteignable(fermee, pont, { x: halage.x, z: halage.z }), "on n'atteint pas le halage par la cour");
  assert.ok(!atteignable(fermee, pont, jeu(-11, -8)), "le magasin : la porte de la boutique est condamnée");
  assert.ok(!atteignable(fermee, pont, jeu(5.2, -3)), "la porte de la roue est bouchée (M7)");
  const ouverte = zoneMoulin({ grande_porte: true });
  for (const [nom, x, z] of [["les meules sud", 1, -2], ["le couloir du rouet", 5.1, -3], ["les meules nord", 1, -10], ["le magasin", -11, -8], ["le jardin", -5, -18], ["l'if", 8, -15.5]] as const) {
    assert.ok(atteignable(ouverte, pont, jeu(x, z)), `du pont à ${nom}`);
  }
  assert.ok(atteignable(ouverte, pont, { x: halage.x, z: halage.z }), "par la planche du bief et la levée, jusqu'au halage");
  assert.ok(sortieIci("moulin", halage.x, halage.z)?.sansArrivee);
});

/** On marche droit de a vers b (repère du modèle) : arrive-t-on, sans rien contourner ? */
function toutDroit(zone: Zone, a: readonly [number, number], b: readonly [number, number]): boolean {
  let p = ici(a[0], a[1]);
  const cible = jeu(b[0], b[1]);
  for (let i = 0; i < 600 && Math.hypot(cible.x - p.x, cible.z - p.z) > 0.1; i++) {
    const d = Math.hypot(cible.x - p.x, cible.z - p.z);
    p = avancer(p, { dx: (cible.x - p.x) / d, dz: (cible.z - p.z) / d, allure: "marche" }, Math.min(0.05, d / 1.4), zone);
  }
  return Math.hypot(cible.x - p.x, cible.z - p.z) <= 0.1;
}

test("0.8.3 : les retouches du modèle — la porte de derrière du magasin, la planche de 1,2 m, les passages de 1,2 m se passent tout droit", () => {
  const zone = zoneMoulin({ grande_porte: true });
  // La porte de derrière du magasin (x −16,15 → −14,85) : la pile de sacs est reculée contre le mur ouest.
  assert.ok(toutDroit(zone, [-15.5, -11], [-15.5, -15]), "du magasin au jardin");
  // Tout le battant de la porte se passe, du côté des sacs (on les frôle) comme de l'autre.
  for (const x of [-15.75, -15.25]) assert.ok(toutDroit(zone, [x, -11.5], [x, -14.5]), `contre la porte, x ${x}`);
  // La planche du bief (z −21,6 → −20,4), du jardin à la levée, sur toute sa largeur utile.
  for (const z of [-21.15, -21, -20.85]) assert.ok(toutDroit(zone, [8.5, z], [14, z]), `la planche à z ${z}`);
  // La cloison des dépendances (à x −15) et celle du logis (à z −1).
  for (const z of [10.3, 10.5, 10.7]) assert.ok(toutDroit(zone, [-13.5, z], [-16.5, z]), `de l'étable à l'atelier (z ${z})`);
  for (const x of [-26.2, -26, -25.8]) assert.ok(toutDroit(zone, [x, 0.5], [x, -2.5]), `de la cuisine à la chambre (x ${x})`);
  // La fosse du rouet est fermée à l'est (sous le rouet) : on n'y entre pas depuis le palier.
  assert.ok(!toutDroit(zone, [7.4, -4.2], [6.4, -4.2]), "pas d'entrée dans la fosse par l'est");
});

test("on ne marche pas dans le bief ni dans la rivière", () => {
  const zone = ZONE_MOULIN;
  // Du jardin vers l'est, droit sur le bief : on bute sur la berge.
  let p = ici(8.9, -12, Math.PI / 2);
  for (let i = 0; i < 40; i++) p = avancer(p, { dx: 1, dz: 0, allure: "marche" }, 0.1, zone);
  assert.ok(p.x - ORIGINE_MODELE_MOULIN.x < 9.5, `arrêté à la berge (x ${p.x - ORIGINE_MODELE_MOULIN.x})`);
  // De la berge est vers l'ouest, droit sur la rivière : pareil.
  p = ici(27, -5, -Math.PI / 2);
  for (let i = 0; i < 40; i++) p = avancer(p, { dx: -1, dz: 0, allure: "marche" }, 0.1, zone);
  assert.ok(p.x - ORIGINE_MODELE_MOULIN.x > 25, "arrêté à la berge de la rivière");
  // On ne rejoint pas le bief depuis la cour, ni la rive gauche depuis la berge est (seul le pont passe).
  assert.ok(!atteignable(zone, jeu(27, -5), jeu(11.25, -10)));
  assert.ok(!atteignable(zone, jeu(27, -5), jeu(15, -20)), "la levée, de l'autre côté de la rivière");
});

test("M14 : repoussé par le garde-corps brisé, un Éteint tombe dans la fosse, y reste, et s'achève d'en haut à la fourche", () => {
  const t = monter();
  const a = t.nouveau("Rose", { hache: 1 });
  const moulin = t.moulins.de(a.compte.id);
  moulin.basculerPorte("grande_porte", true);
  for (const e of moulin.eteints) if (e.id !== 8) e.etat = "detruit";
  const e = moulin.eteints.find((x) => x.id === 8)!;
  // Dans le couloir du rouet, face au garde-corps brisé ; on est à l'ouest, contre la cloison.
  Object.assign(e, { ...jeu(5.35, -3), etat: "poursuivant", but: null });
  a.joueur.position = ici(4.55, -3, Math.PI / 2);
  a.joueur.recevoir({ t: "repousser" });
  assert.ok(dansLaFosse(e.x, e.z), "il est au fond");
  // Il y reste : il ne remonte pas, même en voulant nous rejoindre.
  t.attendre(8);
  assert.ok(dansLaFosse(e.x, e.z), "toujours au fond");
  assert.equal(e.saisit, null, "il ne saisit personne d'en bas");
  // La hache (1,7 m) n'y descend pas ; la fourche (2 m), si.
  a.joueur.position = ici(5.4, -3, Math.PI / 2);
  e.etat = "a_terre";
  e.aTerre = 30;
  const degats = e.degats;
  a.joueur.recevoir({ t: "frapper", appuye: false });
  assert.equal(e.degats, degats, "la hache ne l'atteint pas");
  t.base.sauverInventaire(a.compte.id, { sac_a_dos: 1, fourche_foin: 1 });
  const b = t.connecter({ id: a.compte.id, pseudo: "Rose", famille: "voltaiques" });
  t.partir(a.joueur);
  b.joueur.position = ici(5.4, -3, Math.PI / 2);
  t.attendre(1);
  b.joueur.recevoir({ t: "frapper", appuye: true });
  assert.ok((e.etat as string) === "detruit" || e.degats > degats, "la fourche l'atteint d'en haut");
  // Ailleurs, repousser fait seulement reculer.
  const f = { ...e, ...jeu(2, -3), etat: "poursuivant" as const };
  moulin.eteints.push(f);
  f.id = 99;
  b.joueur.position = ici(1.2, -3, Math.PI / 2);
  b.joueur.recevoir({ t: "repousser" });
  assert.ok(!dansLaFosse(f.x, f.z));
});

test("M15 : le rampant de la fosse gémit quand on passe en marchant, pas en allure discrète", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const moulin = t.moulins.de(a.compte.id);
  moulin.basculerPorte("grande_porte", true);
  a.joueur.position = ici(5.1, -3.5, Math.PI);
  a.joueur.recevoir({ t: "intention", dx: 0, dz: -0.2, allure: "discrete", seq: 1 });
  t.attendre(1);
  assert.ok(!moulin.bruitEnCours("fosse:11", t.maintenant()), "en allure discrète : rien");
  a.joueur.position = ici(5.1, -3.5, Math.PI);
  a.joueur.recevoir({ t: "intention", dx: 0, dz: -0.2, allure: "marche", seq: 2 });
  t.attendre(0.5);
  assert.ok(moulin.bruitEnCours("fosse:11", t.maintenant()), "en marchant : il gémit");
});

test("M31 : les trois leurres — le monte-sacs une fois par visite, le babillard à volonté, la borne trois fois", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const moulin = t.moulins.de(a.compte.id);
  calmer(moulin);
  const actionner = (id: string, x: number, z: number) => {
    a.joueur.position = ici(x, z);
    a.joueur.recevoir({ t: "interagir", cible: { genre: "leurre", id }, verbe: "actionner" });
  };
  actionner("monte_sacs", -11, 6);
  assert.ok(moulin.bruitEnCours("monte_sacs", t.maintenant()));
  assert.ok(a.recus.some((m) => m.t === "leurre" && m.id === "monte_sacs" && m.actif));
  t.attendre(3);
  actionner("monte_sacs", -11, 6);
  assert.ok(!moulin.bruitEnCours("monte_sacs", t.maintenant()), "un seul sac par visite");
  assert.match(a.infos().at(-1)!, /déjà en bas/);
  // La borne : trois jingles, puis plus rien (jusqu'au retour du Moulin).
  for (let i = 0; i < 3; i++) {
    actionner("borne", -14, 2.6);
    assert.ok(moulin.bruitEnCours("borne", t.maintenant()), `jingle ${i + 1}`);
    t.attendre(21, 1);
  }
  actionner("borne", -14, 2.6);
  assert.ok(!moulin.bruitEnCours("borne", t.maintenant()));
  assert.match(a.infos().at(-1)!, /batterie est à plat/);
  // Le babillard, aux meules sud : autant qu'on veut.
  moulin.basculerPorte("grande_porte", true);
  for (let i = 0; i < 3; i++) {
    actionner("babillard", -0.3, -2.8);
    assert.ok(moulin.bruitEnCours("babillard", t.maintenant()));
    t.attendre(3);
  }
  // Une autre visite : un sac pend de nouveau.
  t.partir(a.joueur);
  t.attendre(1);
  const b = t.connecter({ id: a.compte.id, pseudo: "Rose", famille: "voltaiques" });
  b.joueur.position = ici(-11, 6);
  b.joueur.recevoir({ t: "interagir", cible: { genre: "leurre", id: "monte_sacs" }, verbe: "actionner" });
  assert.ok(moulin.bruitEnCours("monte_sacs", t.maintenant()));
});

test("N1 : au bout de 24 h, tout revient (Éteints, butin, grosse clé, grande porte refermée, borne) ; la fourche, jamais", () => {
  const debut = 5_000_000;
  const etat: EtatMoulin = { detruits: [1], tombes: [], portes: { grande_porte: true }, deverrouillee: true, borne: 0, fourche: true, pleineLe: debut };
  assert.equal(aReinitialiser(etat, debut + 23.9 * H), false);
  assert.equal(aReinitialiser(etat, debut + 24 * H), true);
  const t = monter();
  const a = t.nouveau("Rose", { couteau: 1, cle_plate: 1 });
  const moulin = t.moulins.de(a.compte.id);
  calmer(moulin);
  for (const type of ["moulin_cle", "moulin_fourche", "moulin_jute", "moulin_feuillards", "moulin_etau", "if_bief", "poutres_chene", "moulin_etable"]) prendre(t, a.joueur, moulin, type);
  a.joueur.position = ici(1, 2.2, Math.PI);
  a.joueur.recevoir({ t: "interagir", cible: { genre: "porte", id: "grande_porte" }, verbe: "ouvrir_porte" });
  assert.equal(moulin.portes.grande_porte, true);
  t.attendre(1);
  t.partir(a.joueur);
  t.attendre(6 * 60, 5);
  // 12 h après : rien n'est revenu (ni Éteints, ni clés).
  t.sauter(12 * H);
  const m12 = new Moulins(t.base, () => 0.5, t.maintenant).de(a.compte.id);
  assert.equal(m12.eteints.filter((e) => e.etat !== "detruit").length, 0);
  assert.ok(!m12.disponiblePour(point("moulin_jute", m12), a.compte.id, t.maintenant()));
  assert.equal(m12.portes.grande_porte, true);
  // 24 h après : tout est revenu, la grande porte refermée à clé, la grosse clé au tableau ; pas la fourche.
  t.sauter(12.1 * H);
  const moulins = new Moulins(t.base, () => 0.5, t.maintenant);
  const m24 = moulins.de(a.compte.id);
  assert.equal(m24.eteints.filter((e) => e.etat !== "detruit").length, 22);
  assert.equal(m24.portes.grande_porte, false);
  for (const type of ["moulin_cle", "moulin_jute", "moulin_feuillards", "moulin_etau", "if_bief", "poutres_chene", "moulin_etable"]) {
    assert.ok(m24.disponiblePour(point(type, m24), a.compte.id, t.maintenant()), `${type} revenu`);
  }
  assert.ok(!m24.disponiblePour(point("moulin_fourche", m24), a.compte.id, t.maintenant()), "la fourche : une fois par personnage");
  // La porte refuse de nouveau sans la clé.
  const qui = { ...jeu(1, 2.2), aLaCle: false, laisserLaCle: () => {} };
  assert.equal(moulins.actionnerPorte(a.compte.id, "grande_porte", true, qui, t.maintenant()), TEXTE_GRANDE_PORTE_FERMEE);
  // Encore 24 h plus tard (et un contenu régénéré) : la fourche ne revient toujours pas.
  t.sauter(25 * H);
  const m48 = new Moulins(t.base, () => 0.5, t.maintenant).de(a.compte.id);
  assert.ok(!m48.disponiblePour(point("moulin_fourche", m48), a.compte.id, t.maintenant()));
});

test("le coffre cerclé se fait avec les seules bûches du Moulin (les poutres de rechange, B11)", () => {
  const t = monter();
  const a = t.nouveau("Rose", { couteau: 1 });
  const moulin = t.moulins.de(a.compte.id);
  calmer(moulin);
  prendre(t, a.joueur, moulin, "poutres_chene");
  prendre(t, a.joueur, moulin, "moulin_feuillards");
  const rapporte = a.sac();
  assert.equal(rapporte.buche, 2);
  const cercle = lignee("coffre")!.find((e) => e.id === "coffre_cercle")!;
  assert.equal(cercle.couts[0]!.buche, 2, "le coffre cerclé demande 2 bûches");
  // Rentrée chez elle avec ce qu'elle rapporte, des clous et le marteau remmanché (Marteler 2) : pas d'autre bûche.
  t.partir(a.joueur);
  t.base.sauverInventaire(a.compte.id, { sac_a_dos: 1, buche: rapporte.buche!, feuillards: rapporte.feuillards!, poignee_clous: 1, marteau: 1 });
  t.base.sauverPosition(a.compte.id, { x: 20, z: 20, o: 0 }, "terrain", t.maintenant());
  const coffre = t.base.ajouterInstallation(a.compte.id, "coffre", 21, 20, 0);
  const chez = t.connecter({ id: a.compte.id, pseudo: "Rose", famille: "voltaiques" });
  chez.joueur.position = { x: 20, z: 20, o: 0 };
  chez.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: coffre.id }, verbe: "ameliorer" });
  t.attendre(cercle.duree + 2);
  assert.equal(t.base.chargerInstallations(a.compte.id).find((i) => i.id === coffre.id)!.niveau, 2, "cerclé");
  assert.equal(chez.sac().buche ?? 0, 0, "les deux bûches du Moulin sont dans le coffre");
});

test("un compte supprimé ne laisse rien de son Moulin", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const moulin = t.moulins.de(a.compte.id);
  calmer(moulin);
  prendre(t, a.joueur, moulin, "moulin_cle");
  t.attendre(1);
  t.partir(a.joueur);
  t.attendre(1);
  assert.notEqual(t.base.chargerInstance(`moulin:${a.compte.id}`), null);
  t.moulins.oublier(a.compte.id);
  assert.ok(t.base.supprimerCompte(a.compte.id));
  assert.equal(t.base.chargerInstance(`moulin:${a.compte.id}`), null);
  // Ses ressources de lieu non plus : un Moulin rechargé pour ce numéro repart plein (rien n'est resté en base).
  const neuf = new Moulins(t.base, () => 0.5, t.maintenant).de(a.compte.id);
  assert.ok(neuf.disponiblePour(point("moulin_cle", neuf), a.compte.id, t.maintenant()));
  assert.equal(neuf.portes.grande_porte, false);
});

test("les portes du plan : seule la grande porte se ferme, au départ verrouillée ; les Éteints n'en connaissent pas d'autre", () => {
  assert.deepEqual(portesInitialesMoulin(), { grande_porte: false });
  assert.deepEqual(
    PORTES_MOULIN.filter((p) => p.fermable).map((p) => p.id),
    ["grande_porte"],
  );
  assert.equal(eteintsMoulin().length, 22);
});
