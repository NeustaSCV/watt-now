// Plan 0.10 (V4-19, décision du porteur du 2026-10-15) : l'accès au niveau 2. La côte s'ouvre avec un objet-clé pris à
// sa place dans la Coopérative et un dans le Moulin ; achetés, trouvés ailleurs ou échangés, ils ne comptent pas. Fermée,
// la route est refusée avec son message ; l'ouverture se dit une fois ; l'administrateur va partout ; une partie 0.9
// relue ne perd rien, mais sa côte est fermée.

import { test } from "node:test";
import assert from "node:assert/strict";
import { LIEUX_PREUVES, TEXTE_COTE_FERMEE, TEXTE_COTE_OUVERTE, coteOuverte, faitPreuve, preuveDuLieu, routeFermee } from "../../commun/src/acces-cote.ts";
import { butinCoop } from "../../commun/src/cooperative.ts";
import { DUREE_VOYAGE_S, LIEUX_NIVEAU_2, SORTIE_TERRAIN, etapeVers, sortiesDe, type LieuId } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { butinMoulin } from "../../commun/src/moulin.ts";
import { USAGES, type TypeRessource } from "../../commun/src/terrain.ts";
import { CLES_L1A, CLES_L1B, CLES_RARES } from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { Moulins } from "./moulin.ts";

rendreSilencieux(true);

/** Un monde en mémoire : des joueurs qu'on connecte là où leur position est gardée, et qu'on fait voyager. */
function monde() {
  const base = new Base(":memory:");
  let instant = base.debutMonde() + 60_000;
  const maintenant = () => instant;
  const halte = new Halte(base);
  halte.eteints = [];
  const gue = new Gue(base);
  const cooperatives = new Cooperatives(base, () => 0.99, maintenant);
  const moulins = new Moulins(base, () => 0.99, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, () => 0.99, maintenant);
  const joueurs: Joueur[] = [];
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      for (const j of joueurs) j.tick(pas);
      lieux.tick(instant, pas);
    }
  };
  /** Connecter le compte `id` (il arrive là où sa position est gardée). */
  const connecter = (id: number, pseudo: string) => {
    const recus: MessageServeur[] = [];
    // Un aléa haut : aucune clé rare ne sort des fouilles.
    const joueur = new Joueur({ id, pseudo, famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, () => 0.99, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
    joueurs.push(joueur);
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    const voyager = (vers: LieuId) => {
      const etape = etapeVers(joueur.lieu, vers);
      const s = joueur.lieu === "terrain" ? SORTIE_TERRAIN : sortiesDe(joueur.lieu).find((x) => x.vers === etape || x.aussi?.includes(etape))!;
      joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
      joueur.recevoir({ t: "voyager", vers });
      attendre(DUREE_VOYAGE_S + 0.5);
    };
    /** Prendre la ressource de ce type dans le lieu où l'on est (téléporté à côté, Éteints couchés). */
    const prendre = (type: TypeRessource) => {
      const lieu = joueur.lieu === "cooperative" ? cooperatives.de(id) : moulins.de(id);
      for (const e of lieu.eteints) e.etat = "detruit";
      const r = [...lieu.ressources.values()].find((x) => x.type === type)!;
      joueur.position = { x: r.x, z: r.z + 0.8, o: Math.PI };
      joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: r.id }, verbe: USAGES[type].verbe });
      attendre(USAGES[type].duree + 1);
    };
    const partir = () => {
      joueur.sauvegarder();
      joueur.partir();
      joueurs.splice(joueurs.indexOf(joueur), 1);
    };
    return { joueur, recus, dernier, infos, voyager, prendre, partir };
  };
  /** Un compte neuf, `ou` sa position gardée (le terrain par défaut). */
  const nouveau = (pseudo: string, ou?: LieuId, sac: Record<string, number> = {}) => {
    const c = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverInventaire(c.id, { sac_a_dos: 1, cle_plate: 1, couteau: 1, ...sac });
    if (ou) base.sauverPosition(c.id, { x: 10, z: 10, o: 0 }, ou, instant);
    return { id: c.id, ...connecter(c.id, pseudo) };
  };
  return { base, nouveau, connecter, attendre, maintenant };
}

// ---------- La règle (commun/src/acces-cote.ts) ----------

test("la côte s'ouvre avec une preuve de la Coopérative et une du Moulin, pas avec une seule", () => {
  assert.equal(coteOuverte({}), false);
  assert.equal(coteOuverte({ [faitPreuve("cooperative")]: 3 }), false);
  assert.equal(coteOuverte({ [faitPreuve("moulin")]: 1 }), false);
  assert.equal(coteOuverte({ [faitPreuve("cooperative")]: 1, [faitPreuve("moulin")]: 1 }), true);
  // Fermée : vers la côte depuis l'intérieur, non ; de la côte, on circule et on rentre ; ouverte, partout.
  for (const l of LIEUX_NIVEAU_2) assert.equal(routeFermee("terrain", l, false), true, l);
  assert.equal(routeFermee("terrain", "station", false), false);
  assert.equal(routeFermee("route_pont", "terrain", false), false);
  assert.equal(routeFermee("route_pont", "grand_hotel", false), false);
  assert.equal(routeFermee("terrain", "route_pont", true), false);
});

test("seul un objet-clé du lieu, pris dans le lieu, est sa preuve : ni au Comptoir, ni par chance dans l'autre lieu, ni ailleurs", () => {
  assert.equal(preuveDuLieu("cooperative", { cocotte_fonte: 1 }), faitPreuve("cooperative"));
  assert.equal(preuveDuLieu("moulin", { feuillards: 1 }), faitPreuve("moulin"));
  // Acheté au Comptoir, trouvé à la station, au gué, sur la côte : rien.
  for (const lieu of ["comptoir", "station", "gue", "terrain", "grand_hotel", "route_pont"] as const) {
    for (const t of [...CLES_L1A, ...CLES_L1B]) assert.equal(preuveDuLieu(lieu, { [t]: 1 }), null, `${t} à ${lieu}`);
  }
  // La chance d'une fouille de la Coopérative ne donne que des objets-clés du Moulin (et inversement) : ils ne comptent pas.
  for (const t of CLES_RARES.L1A.cles) assert.equal(preuveDuLieu("cooperative", { [t]: 1 }), null, t);
  for (const t of CLES_RARES.L1B.cles) assert.equal(preuveDuLieu("moulin", { [t]: 1 }), null, t);
  // Chaque objet-clé des deux lieux a sa place fixe dans le lieu (une ressource qui le donne).
  const places = (butin: { type: TypeRessource }[]) => butin.flatMap((r) => Object.keys(USAGES[r.type]?.donne ?? {}));
  for (const t of LIEUX_PREUVES.cooperative!) assert.ok(places(butinCoop()).includes(t), `${t} à sa place dans la Coopérative`);
  for (const t of LIEUX_PREUVES.moulin!) assert.ok(places(butinMoulin()).includes(t), `${t} à sa place dans le Moulin`);
});

test("les textes de la côte sont courts, sans le mot « clé »", () => {
  for (const texte of [TEXTE_COTE_FERMEE, TEXTE_COTE_OUVERTE]) {
    assert.ok(!/cl[ée]/i.test(texte), texte);
    assert.ok(texte.length <= 110, texte);
  }
});

// ---------- En jeu ----------

test("au départ, la côte est fermée : la route du pont, la corniche et l'hôtel sont refusés, avec le message", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  assert.equal(rose.joueur.bienvenue(0).coteOuverte, false);
  for (const vers of ["route_pont", "corniche", "grand_hotel", "phare"] as const) {
    const avant = rose.infos().length;
    rose.voyager(vers);
    assert.equal(rose.joueur.lieu, "terrain", vers);
    assert.equal(rose.infos().at(-1), TEXTE_COTE_FERMEE, vers);
    assert.ok(rose.infos().length > avant);
  }
  assert.equal(rose.dernier("voyage"), undefined, "aucun départ");
  // Le niveau 1 reste ouvert.
  rose.voyager("station");
  assert.equal(rose.joueur.lieu, "station");
});

test("un objet-clé pris dans la Coopérative, puis un dans le Moulin : la côte s'ouvre, son message une seule fois", () => {
  const m = monde();
  const rose = m.nouveau("Rose", "cooperative");
  assert.equal(rose.joueur.lieu, "cooperative");
  rose.prendre("coop_cocotte");
  assert.equal(rose.dernier("inventaire")?.inventaire.cocotte_fonte, 1);
  assert.equal(rose.joueur.bienvenue(0).coteOuverte, false, "la Coopérative seule ne suffit pas");
  assert.equal(rose.dernier("cote"), undefined);
  assert.ok(!rose.infos().includes(TEXTE_COTE_OUVERTE));
  rose.partir();
  // Au Moulin : les feuillards tombés au magasin.
  m.base.sauverPosition(rose.id, { x: 10, z: 10, o: 0 }, "moulin", m.maintenant());
  const auMoulin = m.connecter(rose.id, "Rose");
  assert.equal(auMoulin.joueur.lieu, "moulin");
  assert.equal(auMoulin.joueur.bienvenue(0).coteOuverte, false);
  auMoulin.prendre("moulin_feuillards");
  assert.deepEqual(auMoulin.dernier("cote"), { t: "cote", ouverte: true });
  assert.equal(auMoulin.infos().filter((t) => t === TEXTE_COTE_OUVERTE).length, 1);
  assert.equal(auMoulin.joueur.bienvenue(0).coteOuverte, true);
  // Un autre objet-clé du Moulin : pas de second message.
  auMoulin.prendre("moulin_jute");
  assert.equal(auMoulin.recus.filter((x) => x.t === "cote").length, 1);
  assert.equal(auMoulin.infos().filter((t) => t === TEXTE_COTE_OUVERTE).length, 1);
  auMoulin.partir();
  // C'est gardé en base : de retour chez soi, la route du pont s'ouvre.
  m.base.sauverPosition(rose.id, { x: 10, z: 10, o: 0 }, "terrain", m.maintenant());
  const chezSoi = m.connecter(rose.id, "Rose");
  assert.equal(chezSoi.joueur.bienvenue(0).coteOuverte, true);
  chezSoi.voyager("route_pont");
  assert.equal(chezSoi.joueur.lieu, "route_pont");
  assert.ok(!chezSoi.infos().includes(TEXTE_COTE_FERMEE));
});

test("les six objets-clés achetés, échangés ou trouvés ailleurs, dans le sac : la côte reste fermée", () => {
  const m = monde();
  const sac = Object.fromEntries([...CLES_L1A, ...CLES_L1B].map((t) => [t, 1]));
  const rose = m.nouveau("Rose", undefined, sac);
  assert.equal(rose.joueur.bienvenue(0).coteOuverte, false);
  rose.voyager("corniche");
  assert.equal(rose.joueur.lieu, "terrain");
  assert.equal(rose.infos().at(-1), TEXTE_COTE_FERMEE);
});

test("un objet-clé pris dans la Coopérative ne compte que pour elle : le Moulin reste à prouver", () => {
  const m = monde();
  const rose = m.nouveau("Rose", "cooperative");
  rose.prendre("coop_grillage");
  rose.partir();
  const faits = m.base.chargerQuetes(rose.id).faits;
  assert.equal(faits[faitPreuve("cooperative")], 1);
  assert.equal(faits[faitPreuve("moulin")], undefined);
});

test("le menu « Aller à… » de l'administrateur va sur la côte, même fermée", () => {
  const m = monde();
  const god = m.nouveau("Zeus");
  m.base.designerAdmin(god.id);
  god.joueur.recevoir({ t: "admin", op: { genre: "aller", vers: "route_pont" } });
  assert.equal(god.joueur.lieu, "route_pont");
  god.joueur.recevoir({ t: "admin", op: { genre: "aller", vers: "phare" } });
  assert.equal(god.joueur.lieu, "phare");
});

test("qui est déjà sur la côte à la mise à jour n'en est pas chassé : il rentre chez lui", () => {
  const m = monde();
  const rose = m.nouveau("Rose", "route_pont");
  assert.equal(rose.joueur.lieu, "route_pont");
  assert.equal(rose.joueur.bienvenue(0).coteOuverte, false);
  rose.voyager("terrain");
  assert.equal(rose.joueur.lieu, "terrain");
  rose.voyager("route_pont");
  assert.equal(rose.joueur.lieu, "terrain", "mais il n'y retourne pas");
});

test("une partie 0.9 relue : rien de perdu (faits, quêtes, sac), et la côte fermée", () => {
  const m = monde();
  const c = m.base.creerCompte("Rose", "potager42", "mecanistes");
  // Ce qu'une 0.9 gardait : les visites, les objets-clés déjà pris (comptés en fabriques, en ventes), les quêtes finies.
  const faits09 = { "visite:cooperative": 4, "visite:moulin": 3, "fabrique:grille_cuisine": 2, "vente:cocotte_fonte": 1, wotts_gagnes: 120, nuit: 9 };
  const etat09 = { faits: faits09, finies: ["comptoir", "grille"], primes: 0 };
  m.base.sauverQuetes(c.id, etat09);
  const sac = { sac_a_dos: 1, cocotte_fonte: 1, etau: 1, buche: 6 };
  m.base.sauverInventaire(c.id, sac);
  const rose = m.connecter(c.id, "Rose");
  const b = rose.joueur.bienvenue(0);
  assert.equal(b.coteOuverte, false);
  assert.deepEqual(b.inventaire, sac);
  rose.voyager("route_pont");
  assert.equal(rose.joueur.lieu, "terrain");
  assert.equal(rose.infos().at(-1), TEXTE_COTE_FERMEE);
  rose.partir();
  const relu = m.base.chargerQuetes(c.id);
  for (const [f, n] of Object.entries(faits09)) assert.ok((relu.faits[f] ?? 0) >= n, f);
  assert.deepEqual(relu.finies.slice(0, 2), ["comptoir", "grille"]);
  assert.ok(!coteOuverte(relu.faits));
});
