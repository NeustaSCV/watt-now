// Plan 0.10, chantier J : L2A, le Grand Hôtel des Flots. Un lieu à soi, « le check-in » (§3.3, S-07 à S-11) : la
// batterie portée et branchée à la borne, le robot dégagé, sa tête portée à deux mains et présentée, la carte de la
// chambre 7, l'ascenseur, le balcon à sens unique, les objets-clés à l'étage, le retour à 24 h.

import { test } from "node:test";
import assert from "node:assert/strict";
import { eteintsHotel } from "../../commun/src/eteints-hotel.ts";
import { ClientHotel } from "../../client/src/hotel.ts";
import { ASCENSEUR, BALCON, BORNE, CARTE, ECART_ASCENSEUR, PANNEAU, PORTEE_HOTEL, ROBOT, TEXTES_HOTEL, ZONE_HOTEL, butinHotel, horsDeLAscenseur, lireEtatHotel, niveauHotel, pieceHotel, type EtatHotel } from "../../commun/src/hotel.ts";
import { DUREE_VOYAGE_S, arriveeDans, entreesDe, heurte, sortiesDe } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { milieuHotel } from "../../commun/src/milieu-hotel.ts";
import { REINITIALISATION_LIEU_MS } from "../../commun/src/registre-lieux.ts";
import { USAGES } from "../../commun/src/terrain.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue } from "./gue.ts";
import { Halte } from "./halte.ts";
import type { LieuHotel } from "./hotel.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { Moulins } from "./moulin.ts";

rendreSilencieux(true);

const H = 3_600_000;

/** Un monde en mémoire, et des joueurs qui se connectent dans leur hôtel (sur la promenade). */
function monter() {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const maintenant = () => instant;
  const halte = new Halte(base);
  const gue = new Gue(base);
  const cooperatives = new Cooperatives(base, () => 0.5, maintenant);
  const moulins = new Moulins(base, () => 0.5, maintenant);
  const lieux = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }, () => 0.5, maintenant);
  const joueurs: Joueur[] = [];
  const connecter = (id: number, pseudo: string) => {
    const recus: MessageServeur[] = [];
    const joueur = new Joueur({ id, pseudo, famille: "mecanistes" }, base, (m) => recus.push(m), maintenant, halte, () => 0.5, new Comptoir(base, instant), cooperatives, gue, moulins, lieux);
    joueurs.push(joueur);
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    const sac = () => dernier("inventaire")?.inventaire ?? base.chargerInventaire(id);
    const hotel = () => lieux.vivant("grand_hotel", id) as LieuHotel;
    /** Se poster en (x, z), tourné vers o, et faire un geste sur un objet du lieu. */
    const geste = (id2: string, verbe: string, ou?: { x: number; z: number }, o = 0) => {
      if (ou) joueur.position = { x: ou.x, z: ou.z, o };
      joueur.recevoir({ t: "interagir", cible: { genre: "lieu", id: id2 }, verbe: verbe as never });
    };
    return { id, joueur, recus, dernier, infos, sac, hotel, geste };
  };
  const nouveau = (pseudo: string, inventaire: Record<string, number> = {}) => {
    const c = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverInventaire(c.id, { sac_a_dos: 1, ...inventaire });
    base.sauverPosition(c.id, { x: 10, z: 10, o: 0 }, "grand_hotel", instant);
    return connecter(c.id, pseudo);
  };
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      for (const j of joueurs) j.tick(pas);
      lieux.tick(instant, pas);
    }
  };
  const partir = (j: Joueur) => {
    j.partir();
    joueurs.splice(joueurs.indexOf(j), 1);
  };
  return { base, lieux, nouveau, connecter, attendre, partir, sauter: (ms: number) => (instant += ms), maintenant };
}

/** Juste à côté d'un point (0,8 m au sud), tourné vers lui. */
const pres = (p: { x: number; z: number }) => ({ x: p.x, z: p.z + 0.8 });

/** Les Éteints ne gênent pas un test du check-in : on les couche tous. */
function calmer(h: LieuHotel) {
  for (const e of h.eteints) e.etat = "detruit";
}

/** Tout le check-in jusqu'à la carte : la batterie branchée, le robot dégagé (à la pelle), sa tête présentée. */
function jusquALaCarte(t: ReturnType<typeof monter>, a: ReturnType<ReturnType<typeof monter>["connecter"]>) {
  a.geste("batterie", "porter", pres(PANNEAU), Math.PI);
  a.geste("borne", "brancher", pres(BORNE), Math.PI);
  a.geste("robot", "degager", pres(ROBOT), Math.PI);
  t.attendre(11);
  a.geste("tete", "porter", pres(ROBOT), Math.PI);
  a.geste("borne", "presenter", pres(BORNE), Math.PI);
}

test("on arrive sur la promenade, à l'est ; 18 Éteints placés par la fiche, dont l'Ensablé et les deux Noyés de la piscine", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  assert.equal(a.joueur.lieu, "grand_hotel");
  assert.deepEqual({ x: a.joueur.position.x, z: a.joueur.position.z }, { x: arriveeDans("grand_hotel", "route_pont").x, z: arriveeDans("grand_hotel", "route_pont").z });
  assert.equal(entreesDe("grand_hotel").length, 1, "une seule entrée : la promenade");
  const e = a.hotel().eteints;
  assert.equal(e.length, 18);
  assert.equal(e.filter((x) => x.variante === "noye").length, 2);
  assert.equal(e.filter((x) => x.variante === "ensable").length, 1);
  // Les clients couchés : trois dans les transats, trois dans leurs lits à l'étage (des dormeurs, qui se relèvent).
  assert.equal(e.filter((x) => x.etat === "dormant" && x.variante !== "ensable").length, 6);
  assert.equal(e.filter((x) => x.dormeur && niveauHotel(x.x, x.z) === "etage").length, 3);
  assert.ok(e.filter((x) => x.variante === "noye").every((x) => x.x > PANNEAU.x - 25 && pieceHotel(x.x, x.z) === "dehors"), "les Noyés, dans la piscine");
});

test("les objets-clés sont tous à l'étage, à leur place (la lingerie, la suite, la machinerie, la chambre 8) ; le pied de guéridon sur la terrasse", () => {
  const places = Object.fromEntries(butinHotel().map((r) => [r.type, { niveau: niveauHotel(r.x, r.z), piece: pieceHotel(r.x, r.z) }]));
  assert.deepEqual(places.hotel_couvertures, { niveau: "etage", piece: "lingerie" });
  assert.deepEqual(places.hotel_lanterne, { niveau: "etage", piece: "suite" });
  assert.deepEqual(places.hotel_roulements, { niveau: "etage", piece: "machinerie" });
  assert.deepEqual(places.hotel_fer, { niveau: "etage", piece: "machinerie" });
  assert.deepEqual(places.hotel_toles, { niveau: "etage", piece: "chambre_8" });
  assert.deepEqual(places.hotel_gueridon, { niveau: "rez_de_chaussee", piece: "dehors" });
  const donne = (type: string) => USAGES[type as keyof typeof USAGES].donne;
  assert.deepEqual(donne("hotel_couvertures"), { couvertures_laine: 1 });
  assert.deepEqual(donne("hotel_lanterne"), { lanterne_tempete: 1 });
  assert.deepEqual(donne("hotel_fer"), { fer_souder: 1 });
  assert.deepEqual(donne("hotel_toles"), { toles_ondulees: 1 });
  assert.deepEqual(donne("hotel_gueridon"), { pied_gueridon: 1 });
  // Le fil dentaire des salles de bains (N2-61).
  assert.deepEqual(donne("hotel_bain_suite"), { fil_dentaire: 1 });
  assert.deepEqual(donne("hotel_bain_7"), { fil_dentaire: 1 });
});

test("l'étage ne se voit ni ne s'entend du rez-de-chaussée, et inversement ; aucun Éteint n'y passe", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const h = a.hotel();
  const hall = ASCENSEUR.bas.arrivee;
  const palier = ASCENSEUR.haut.arrivee;
  assert.equal(niveauHotel(hall.x, hall.z), "rez_de_chaussee");
  assert.equal(niveauHotel(palier.x, palier.z), "etage");
  // Du balcon (au plus près de l'hôtel) à la façade nord, et du palier au hall : jamais.
  assert.equal(h.voitEntre(hall, palier), false);
  assert.equal(h.voitEntre({ x: BALCON.boite.x, z: BALCON.boite.z - 0.6 }, { x: BALCON.boite.x, z: BALCON.boite.z + 4 }), false);
  const m = milieuHotel();
  assert.equal(m.son(hall.x, hall.z, palier.x, palier.z), 0);
  assert.equal(m.vue(palier.x, palier.z, hall.x, hall.z), false);
  assert.deepEqual(m.passage(palier.x, palier.z, hall.x, hall.z), { x: palier.x, z: palier.z });
});

test("sans courant, la borne ne répond pas ; le joueur seul n'est pas reconnu ; la batterie branchée y reste", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  calmer(a.hotel());
  a.geste("borne", "presenter", pres(BORNE), Math.PI);
  assert.equal(a.infos().at(-1), TEXTES_HOTEL.borneSansCourant);
  // La batterie se porte dans les bras, se branche, et reste branchée.
  a.geste("batterie", "porter", pres(PANNEAU), Math.PI);
  assert.equal(a.hotel().checkIn.batterie, "bras");
  assert.equal(a.dernier("hotel")?.hotel.batterie, "bras");
  a.geste("borne", "brancher", pres(BORNE), Math.PI);
  assert.equal(a.hotel().checkIn.batterie, "borne");
  assert.equal(a.infos().at(-1), TEXTES_HOTEL.brancher);
  a.geste("batterie", "porter", pres(BORNE), Math.PI);
  assert.equal(a.hotel().checkIn.batterie, "borne", "on ne la reprend pas");
  // Avec du courant, le joueur seul n'est pas reconnu.
  a.geste("borne", "presenter", pres(BORNE), Math.PI);
  assert.equal(a.infos().at(-1), TEXTES_HOTEL.sourireNonReconnu);
  assert.equal(a.sac()[CARTE], undefined);
});

test("les bras pris : on ne court pas, on ne frappe pas, on ne fouille pas ; on pose devant soi", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const h = a.hotel();
  calmer(h);
  a.geste("robot", "degager", pres(ROBOT), Math.PI);
  t.attendre(31);
  a.geste("tete", "porter", pres(ROBOT), Math.PI);
  assert.equal(h.checkIn.tete, "bras");
  assert.equal(h.dansLesBras(a.id), "la tête du robot");
  // On ne frappe pas.
  const coups = a.recus.length;
  a.joueur.recevoir({ t: "frapper", appuye: false });
  assert.match(a.infos().at(-1)!, /on ne frappe pas/);
  assert.ok(!a.recus.slice(coups).some((m) => m.t === "gestes" || (m.t === "action" && m.etat === "debut")), "aucun coup");
  // On ne court pas.
  a.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "course", seq: 1 });
  const x0 = a.joueur.position.x;
  t.attendre(1);
  const vitesse = a.joueur.position.x - x0;
  assert.ok(vitesse > 1 && vitesse < 3, `il marche (${vitesse.toFixed(2)} m/s)`);
  a.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 });
  // On pose la tête devant soi ; elle se reprend là.
  a.joueur.position = { ...a.joueur.position, o: 0 };
  a.joueur.recevoir({ t: "poser" });
  const posee = h.checkIn.tete as unknown as { x: number; z: number };
  assert.ok(typeof posee === "object" && Math.abs(posee.z - (a.joueur.position.z + 0.9)) < 0.01);
  assert.equal(h.dansLesBras(a.id), null);
  a.geste("tete", "porter");
  assert.equal(h.checkIn.tete, "bras");
});

test("le robot se dégage en 10 s avec Creuser 1, en 30 s à mains nues ; ensablé, sa tête ne se dévisse pas", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const h = a.hotel();
  calmer(h);
  a.geste("tete", "porter", pres(ROBOT), Math.PI);
  assert.equal(h.checkIn.tete, "robot");
  assert.equal(a.infos().at(-1), TEXTES_HOTEL.robotEnsable);
  a.geste("robot", "degager", pres(ROBOT), Math.PI);
  assert.equal(a.infos().at(-1), TEXTES_HOTEL.aMainsNues);
  t.attendre(20);
  assert.equal(h.checkIn.degage, false, "à mains nues, pas en 20 s");
  t.attendre(11);
  assert.equal(h.checkIn.degage, true);
  const b = t.nouveau("Malo", { beche: 1 });
  calmer(b.hotel());
  b.geste("robot", "degager", pres(ROBOT), Math.PI);
  t.attendre(10.5);
  assert.equal(b.hotel().checkIn.degage, true, "à la bêche, en 10 s");
});

test("le check-in jusqu'au bout : la carte de la chambre 7, l'ascenseur (fondu d'une seconde), sans carte il ne monte pas", () => {
  const t = monter();
  const a = t.nouveau("Rose", { beche: 1 });
  calmer(a.hotel());
  // Sans carte, l'ascenseur ne monte pas.
  a.geste("ascenseur", "appeler_ascenseur", ASCENSEUR.bas.arrivee, Math.PI);
  assert.equal(a.infos().at(-1), TEXTES_HOTEL.sansCarte);
  t.attendre(1);
  assert.equal(niveauHotel(a.joueur.position.x, a.joueur.position.z), "rez_de_chaussee");
  jusquALaCarte(t, a);
  assert.equal(a.sac()[CARTE], 1, "la carte de la chambre 7");
  assert.equal(a.infos().at(-1), TEXTES_HOTEL.carteRemise);
  assert.equal(a.hotel().checkIn.tete, "borne", "la tête reste sur la borne");
  // Une seconde présentation ne donne pas une deuxième carte.
  a.geste("borne", "presenter", pres(BORNE), Math.PI);
  assert.equal(a.sac()[CARTE], 1);
  // La carte en sac : la cabine monte ; le fondu, puis l'étage, au milieu du fondu.
  a.geste("ascenseur", "appeler_ascenseur", ASCENSEUR.bas.arrivee, Math.PI);
  const scene = a.dernier("scene")!;
  assert.deepEqual({ lieu: scene.lieu, scene: scene.scene, etape: scene.etape }, { lieu: "grand_hotel", scene: "ascenseur", etape: "monter" });
  assert.equal(niveauHotel(a.joueur.position.x, a.joueur.position.z), "rez_de_chaussee");
  t.attendre(0.75);
  assert.deepEqual(a.joueur.position, ASCENSEUR.haut.arrivee);
  assert.equal(niveauHotel(a.joueur.position.x, a.joueur.position.z), "etage");
  // On redescend tant qu'on est à l'étage.
  a.geste("ascenseur", "appeler_ascenseur");
  t.attendre(0.75);
  assert.deepEqual(a.joueur.position, ASCENSEUR.bas.arrivee);
});

test("on sort par le balcon (sens unique) : on retombe sur la dune, et l'on ne rentre pas par là", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  calmer(a.hotel());
  // Dans la chambre 8, on marche vers le balcon : on saute.
  a.joueur.position = { x: BALCON.boite.x, z: BALCON.boite.z - 1.6, o: 0 };
  assert.equal(pieceHotel(a.joueur.position.x, a.joueur.position.z), "chambre_8");
  a.joueur.recevoir({ t: "intention", dx: 0, dz: 1, allure: "marche", seq: 1 });
  for (let i = 0; i < 8 && !a.dernier("scene"); i++) t.attendre(0.25);
  a.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 });
  assert.equal(a.dernier("scene")?.scene, "balcon");
  assert.ok(a.infos().includes(TEXTES_HOTEL.balcon));
  t.attendre(1);
  assert.equal(niveauHotel(a.joueur.position.x, a.joueur.position.z), "rez_de_chaussee");
  assert.ok(Math.hypot(a.joueur.position.x - BALCON.arrivee.x, a.joueur.position.z - BALCON.arrivee.z) < 1, "sur la dune");
  // De la dune, on a beau marcher vers le nord, on bute sur la façade : rien ne ramène à l'étage.
  a.joueur.recevoir({ t: "intention", dx: 0, dz: -1, allure: "marche", seq: 3 });
  t.attendre(30);
  assert.equal(niveauHotel(a.joueur.position.x, a.joueur.position.z), "rez_de_chaussee");
  assert.equal(a.recus.filter((m) => m.t === "scene").length, 1);
  // L'ascenseur d'en bas, sans carte, ne monte toujours pas.
  a.geste("ascenseur", "appeler_ascenseur", ASCENSEUR.bas.arrivee, Math.PI);
  assert.equal(a.infos().at(-1), TEXTES_HOTEL.sansCarte);
});

test("la carte de la chambre 7 disparaît du sac quand on quitte l'hôtel ; ce qu'on porte reste là", () => {
  const t = monter();
  const a = t.nouveau("Rose", { beche: 1 });
  calmer(a.hotel());
  jusquALaCarte(t, a);
  assert.equal(a.sac()[CARTE], 1);
  const s = sortiesDe("grand_hotel")[0]!;
  a.joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
  a.joueur.recevoir({ t: "voyager", vers: "route_pont" });
  assert.equal(a.sac()[CARTE], undefined, "la carte reste à l'hôtel");
  assert.equal(t.base.chargerInventaire(a.id)[CARTE], undefined);
  assert.ok(a.infos().includes(TEXTES_HOTEL.carteLaissee));
  t.attendre(DUREE_VOYAGE_S + 0.5);
  assert.equal(a.joueur.lieu, "route_pont");
  // La batterie lâchée en partant reste sur la promenade (une deuxième visite).
  const b = t.nouveau("Malo");
  calmer(b.hotel());
  b.geste("batterie", "porter", pres(PANNEAU), Math.PI);
  b.joueur.position = { x: s.boite.x, z: s.boite.z, o: 0 };
  b.joueur.recevoir({ t: "voyager", vers: "route_pont" });
  const posee = t.base.chargerInstance(`grand_hotel:${b.id}`) as { propre: { hotel: EtatHotel } };
  assert.deepEqual(posee.propre.hotel.batterie, { x: s.boite.x, z: s.boite.z });
});

test("au bout de 24 h, tout revient : la batterie au panneau, le robot ensablé, sa tête ; les objets-clés de 4 jours gardent leur délai", () => {
  const t = monter();
  const a = t.nouveau("Rose", { beche: 1 });
  const h = a.hotel();
  calmer(h);
  jusquALaCarte(t, a);
  // On prend la lanterne-tempête (4 jours) et les couvertures (24 h), à l'étage.
  const prendre = (type: string) => {
    const r = [...h.ressources.values()].find((x) => x.type === type)!;
    a.joueur.position = { x: r.x + 0.8, z: r.z, o: -Math.PI / 2 };
    a.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: r.id }, verbe: "ramasser" });
    t.attendre(USAGES[r.type].duree + 1);
    return r;
  };
  const lanterne = prendre("hotel_lanterne");
  const couvertures = prendre("hotel_couvertures");
  assert.equal(a.sac().lanterne_tempete, 1);
  assert.equal(a.sac().couvertures_laine, 1);
  t.partir(a.joueur);
  t.sauter(REINITIALISATION_LIEU_MS + H);
  const b = t.connecter(a.id, "Rose");
  const h2 = b.hotel();
  assert.deepEqual(h2.checkIn, { batterie: "panneau", tete: "robot", degage: false });
  assert.equal(h2.eteints.filter((e) => e.etat !== "detruit").length, eteintsHotel().length, "les Éteints sont revenus");
  assert.ok(h2.disponiblePour(couvertures, a.id, t.maintenant()), "les couvertures (24 h) sont revenues");
  assert.ok(!h2.disponiblePour(lanterne, a.id, t.maintenant()), "la lanterne (4 jours) pas encore");
  t.sauter(3 * 24 * H);
  assert.ok(h2.disponiblePour(lanterne, a.id, t.maintenant()), "au bout de 4 jours, la lanterne");
  t.attendre(0.5);
  assert.deepEqual(b.dernier("hotel")?.hotel, { batterie: "panneau", tete: "robot", degage: false });
});

test("une partie d'avant la 0.10 se relit : un hôtel sans état du check-in est neuf ; ce qui était dans les bras revient à sa place", () => {
  assert.deepEqual(lireEtatHotel(undefined), { batterie: "panneau", tete: "robot", degage: false });
  assert.deepEqual(lireEtatHotel({}), { batterie: "panneau", tete: "robot", degage: false });
  assert.deepEqual(lireEtatHotel({ batterie: "bras", tete: "bras", degage: true }), { batterie: "panneau", tete: "robot", degage: true });
  assert.deepEqual(lireEtatHotel({ batterie: { x: 3, z: 4 }, tete: "borne" }), { batterie: { x: 3, z: 4 }, tete: "borne", degage: true });
  // Un hôtel gardé en base par la 0.10 d'avant le chantier J (sans `propre.hotel`) : il se charge, neuf.
  const t = monter();
  const c = t.base.creerCompte("Rose", "potager42", "mecanistes");
  t.base.sauverInventaire(c.id, { sac_a_dos: 1 });
  t.base.sauverPosition(c.id, { x: 10, z: 10, o: 0 }, "grand_hotel", t.maintenant());
  t.base.sauverInstance(`grand_hotel:${c.id}`, { detruits: [], portes: {}, pleineLe: t.maintenant(), propre: {} }, t.maintenant());
  const a = t.connecter(c.id, "Rose");
  assert.deepEqual(a.hotel().checkIn, { batterie: "panneau", tete: "robot", degage: false });
  t.attendre(0.5);
  assert.deepEqual(a.dernier("hotel")?.hotel, { batterie: "panneau", tete: "robot", degage: false });
});

/** Ce que le client propose, debout sur ce point, avec l'état du check-in que le serveur a dit. */
function proposeIci(etat: EtatHotel, p: { x: number; z: number }): string | undefined {
  const client = new ClientHotel();
  client.recevoir({ t: "hotel", hotel: etat });
  return client.proposer(p, { A: null, B: null, cible: null }, {}).A?.libelle;
}

const loin = (o: unknown, g: { x: number; z: number }) => Math.hypot((o as { x: number }).x - g.x, (o as { z: number }).z - g.z);

test("la tête posée devant la grille de l'ascenseur en est écartée, de notre côté : « Prendre la tête » est proposé là", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const h = a.hotel();
  calmer(h);
  a.geste("robot", "degager", pres(ROBOT), Math.PI);
  t.attendre(31);
  a.geste("tete", "porter", pres(ROBOT), Math.PI);
  // Devant la grille du bas, tourné vers elle : posée à 0,9 m, elle serait contre la grille.
  a.joueur.position = { ...ASCENSEUR.bas.arrivee, o: Math.PI };
  a.joueur.recevoir({ t: "poser" });
  const posee = h.checkIn.tete as { x: number; z: number };
  assert.equal(typeof posee, "object");
  assert.ok(loin(posee, ASCENSEUR.bas.grille) >= ECART_ASCENSEUR, `écartée (${loin(posee, ASCENSEUR.bas.grille).toFixed(2)} m)`);
  assert.ok(loin(posee, ASCENSEUR.bas.grille) > PORTEE_HOTEL, "hors de portée de l'appel");
  assert.ok(posee.z > ASCENSEUR.bas.grille.z, "de notre côté (le hall)");
  assert.equal(pieceHotel(posee.x, posee.z), "hall");
  assert.ok(!heurte(ZONE_HOTEL, posee.x, posee.z, 0.35), "sur un point libre");
  assert.equal(proposeIci(h.checkIn, posee), "Prendre la tête du robot");
  a.geste("tete", "porter", posee);
  assert.equal(h.checkIn.tete, "bras");
  // Ailleurs, rien ne change : à 0,9 m devant soi.
  a.joueur.position = { ...pres(BORNE), x: BORNE.x + 3, o: 0 };
  a.joueur.recevoir({ t: "poser" });
  assert.deepEqual(h.checkIn.tete, { x: BORNE.x + 3, z: Math.round((BORNE.z + 0.8 + 0.9) * 100) / 100 });
  // Lâchée devant la grille en partant (une déconnexion) : écartée de même.
  a.geste("tete", "porter", h.checkIn.tete as { x: number; z: number });
  a.joueur.position = { ...ASCENSEUR.bas.arrivee, o: Math.PI };
  t.partir(a.joueur);
  const gardee = (t.base.chargerInstance(`grand_hotel:${a.id}`) as { propre: { hotel: EtatHotel } }).propre.hotel.tete;
  assert.ok(loin(gardee, ASCENSEUR.bas.grille) >= ECART_ASCENSEUR, `lâchée, écartée (${loin(gardee, ASCENSEUR.bas.grille).toFixed(2)} m)`);
});

test("en haut aussi, ce qu'on pose devant la grille en est écarté, sur le palier, sur un point libre", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const h = a.hotel();
  calmer(h);
  a.geste("batterie", "porter", pres(PANNEAU), Math.PI);
  a.joueur.position = { ...ASCENSEUR.haut.arrivee, o: Math.PI / 2 };
  a.joueur.recevoir({ t: "poser" });
  const posee = h.checkIn.batterie as { x: number; z: number };
  assert.ok(loin(posee, ASCENSEUR.haut.grille) >= ECART_ASCENSEUR, `écartée (${loin(posee, ASCENSEUR.haut.grille).toFixed(2)} m)`);
  assert.equal(pieceHotel(posee.x, posee.z), "palier");
  assert.ok(!heurte(ZONE_HOTEL, posee.x, posee.z, 0.35), "sur un point libre");
  // Relue, elle ne bouge plus.
  assert.deepEqual(horsDeLAscenseur(posee), posee);
});

test("la tête déjà posée contre la grille dans une partie gardée (la base de l'essai du porteur) en est écartée à l'entrée", () => {
  const t = monter();
  const c = t.base.creerCompte("Rose", "potager42", "mecanistes");
  t.base.sauverInventaire(c.id, { sac_a_dos: 1 });
  t.base.sauverPosition(c.id, { x: 29.5, z: 21, o: Math.PI }, "grand_hotel", t.maintenant());
  // L'état tel qu'il est dans la base de l'essai sur l'iPhone : la tête à 0,64 m de la grille du bas.
  const tete = { x: 30.02, z: 17.95 };
  t.base.sauverInstance(`grand_hotel:${c.id}`, { detruits: [], portes: {}, pleineLe: t.maintenant(), propre: { hotel: { batterie: "panneau", tete, degage: true } } }, t.maintenant());
  const a = t.connecter(c.id, "Rose");
  calmer(a.hotel());
  t.attendre(0.5);
  const dite = a.dernier("hotel")!.hotel;
  const posee = dite.tete as { x: number; z: number };
  assert.ok(loin(posee, ASCENSEUR.bas.grille) >= ECART_ASCENSEUR, `écartée (${loin(posee, ASCENSEUR.bas.grille).toFixed(2)} m)`);
  assert.equal(pieceHotel(posee.x, posee.z), "hall");
  assert.equal(proposeIci(dite, posee), "Prendre la tête du robot");
  a.geste("tete", "porter", posee);
  assert.equal(a.hotel().checkIn.tete, "bras");
});
