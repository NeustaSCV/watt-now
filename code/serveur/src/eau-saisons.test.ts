// Plan 0.10.1, chantier A : l'eau et les saisons, sur le joueur. Plusieurs gourdes, une seule réserve (A5) ; la
// bouteille d'eau bue d'un trait (A4) ; la jauge de 1,5 L et une partie 0.10 relue (A8) ; l'hiver et l'été sur la faim
// et la soif, le feu et l'abri qui annulent l'hiver (A7).

import { test } from "node:test";
import assert from "node:assert/strict";
import { MS_JOUR_CALENDRIER } from "../../commun/src/energie.ts";
import { JOUR_DEPART } from "../../commun/src/calendrier.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { appliquerReglages } from "../../commun/src/reglages.ts";
import { MARE } from "../../commun/src/terrain.ts";
import type { Besoins, Gourde } from "../../commun/src/survie.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";

appliquerReglages({ faim_rythme: 1, soif_rythme: 1, sommeil_rythme: 1, gestes_vitesse: 1 });

interface Montage {
  inventaire?: Record<string, number>;
  besoins?: Besoins;
  gourde?: Gourde;
  /** Le jour du calendrier où l'on joue (le 1er juin par défaut). */
  jour?: number;
  avant?: (base: Base, id: number, instant: number) => void;
}

function monter(m: Montage = {}) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...(m.inventaire ?? {}) });
  const decalage = ((((m.jour ?? JOUR_DEPART) - JOUR_DEPART) % 365) + 365) % 365;
  let instant = base.debutMonde() + decalage * MS_JOUR_CALENDRIER + 60_000;
  base.sauverEtat(compte.id, m.besoins ?? { kcal: 2000, eau: 1, repos: 1 }, m.gourde ?? { contenu: "potable", litres: 0 });
  m.avant?.(base, compte.id, instant);
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (msg) => recus.push(msg), () => instant, undefined, () => 0.9);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.1) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const prive = joueur as unknown as { besoins: Besoins; gourde: Gourde; inventaire: Record<string, number>; sommeil: unknown };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((x) => x.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((x) => x.t === "info").map((x) => (x as { texte: string }).texte);
  return { base, compte, joueur, prive, attendre, dernier, infos };
}

// ---------- A5 : plusieurs gourdes, une seule réserve ----------

test("A5 : deux gourdes → 2 L à la mare, 2 L bouillis d'un coup", () => {
  const t = monter({
    inventaire: { gourde: 2 },
    avant: (b, id, instant) => b.sauverFeu(id, { id: 1, x: MARE.x + 2.5, z: MARE.z, bois: 5, allume: true, majLe: instant }),
  });
  t.joueur.position = { x: MARE.x + 0.4, z: MARE.z - 0.3, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "mare" }, verbe: "remplir" });
  t.attendre(3);
  assert.deepEqual(t.dernier("besoins")?.gourde, { contenu: "brute", litres: 2 });
  // Pleines : on ne puise plus.
  t.joueur.recevoir({ t: "interagir", cible: { genre: "mare" }, verbe: "remplir" });
  assert.equal(t.infos().at(-1), "Tes gourdes sont déjà pleines.");
  // Le feu, tout près : toute la réserve bout d'un coup (deux fois le bois et le temps d'un litre).
  t.joueur.position = { x: MARE.x + 1.6, z: MARE.z, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "bouillir" });
  t.attendre(21);
  assert.deepEqual(t.dernier("besoins")?.gourde, { contenu: "potable", litres: 2 });
});

test("A5 : le récupérateur de pluie ne donne que ce qui manque pour remplir toutes les gourdes", () => {
  const t = monter({
    inventaire: { gourde: 2 },
    gourde: { contenu: "potable", litres: 0.5 },
    avant: (b, id, instant) => {
      const r = b.ajouterInstallation(id, "recuperateur_pluie", 21, 20, 0);
      b.sauverEtatInstallation(id, r.id, { litres: 5, majLe: instant });
    },
  });
  const r = t.joueur.bienvenue(0).installations.find((i) => i.type === "recuperateur_pluie")!;
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: r.id }, verbe: "remplir_pluie" });
  t.attendre(3);
  assert.deepEqual(t.dernier("besoins")?.gourde, { contenu: "potable", litres: 2 });
  const apres = t.dernier("installation")!.installation.etat.litres!;
  assert.ok(apres >= 3.49 && apres <= 3.6, `il reste ${apres} L dans le récupérateur`);
  // Pleines : il ne donne plus rien.
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: r.id }, verbe: "remplir_pluie" });
  assert.equal(t.infos().at(-1), "Tes gourdes sont déjà pleines.");
});

test("A5 : jeter ou donner une gourde perd l'eau au-delà de ce que tiennent les autres", () => {
  const t = monter({ inventaire: { gourde: 3 }, gourde: { contenu: "brute", litres: 2.5 } });
  assert.equal(t.prive.gourde.litres, 2.5);
  t.joueur.recevoir({ t: "jeter", objet: "gourde", quantite: 1 });
  t.attendre(2);
  assert.equal(t.prive.inventaire.gourde, 2);
  assert.deepEqual(t.dernier("besoins")?.gourde, { contenu: "brute", litres: 2 });
  // L'échange : on en donne une encore.
  t.joueur.appliquerEchange({ objets: { gourde: 1 }, wotts: 0 }, { objets: {}, wotts: 0 }, {});
  assert.deepEqual(t.dernier("besoins")?.gourde, { contenu: "brute", litres: 1 });
  // La dernière partie : plus de réserve du tout.
  t.joueur.appliquerEchange({ objets: { gourde: 1 }, wotts: 0 }, { objets: {}, wotts: 0 }, {});
  assert.deepEqual(t.dernier("besoins")?.gourde, { contenu: "potable", litres: 0 });
});

// ---------- A4 : la bouteille d'eau ----------

test("A4 : boire une bouteille d'eau : 1 L au plus dans la jauge, une bouteille vide dans le sac, refusée sans soif", () => {
  const t = monter({ inventaire: { bouteille_eau: 2, gourde: 1 }, besoins: { kcal: 2000, eau: 0.2, repos: 1 }, gourde: { contenu: "potable", litres: 1 } });
  t.joueur.recevoir({ t: "boire_bouteille" });
  t.attendre(1.2);
  assert.ok(Math.abs(t.prive.besoins.eau - 1.2) < 0.02, `eau : ${t.prive.besoins.eau}`);
  assert.equal(t.prive.inventaire.bouteille_eau, 1);
  assert.equal(t.prive.inventaire.bouteille_plastique, 1);
  // La gourde n'a pas bougé.
  assert.deepEqual(t.prive.gourde, { contenu: "potable", litres: 1 });
  // La seconde : la jauge est pleine (1,5 L), le reste est perdu.
  t.joueur.recevoir({ t: "boire_bouteille" });
  t.attendre(1.2);
  assert.ok(t.prive.besoins.eau > 1.49 && t.prive.besoins.eau <= 1.5);
  assert.equal(t.prive.inventaire.bouteille_eau, undefined);
  assert.equal(t.prive.inventaire.bouteille_plastique, 2);

  // Sans soif : refusée, la bouteille reste pleine.
  const u = monter({ inventaire: { bouteille_eau: 1 }, besoins: { kcal: 2000, eau: 1.5, repos: 1 } });
  u.joueur.recevoir({ t: "boire_bouteille" });
  u.attendre(1.2);
  assert.equal(u.infos().at(-1), "Tu n'as plus soif : garde-la pour plus tard.");
  assert.equal(u.prive.inventaire.bouteille_eau, 1);
  assert.equal(u.prive.inventaire.bouteille_plastique, undefined);
});

// ---------- A8 : une partie 0.10 se relit ----------

test("A8 : une partie 0.10 avec 2,4 L dans la jauge de soif se relit à 1,5 L ; le reste ne change pas", () => {
  const t = monter({ inventaire: { gourde: 1 }, besoins: { kcal: 1800, eau: 2.4, repos: 0.7 }, gourde: { contenu: "brute", litres: 0.6 } });
  assert.deepEqual(t.prive.besoins, { kcal: 1800, eau: 1.5, repos: 0.7 });
  assert.deepEqual(t.prive.gourde, { contenu: "brute", litres: 0.6 });
  assert.equal(t.base.chargerPersonnage(t.compte.id)!.besoins.eau, 1.5);
});

// ---------- A7 : les saisons ----------

/** Ce que coûtent 6 s réelles (0,1 h de jeu) au repos, en kcal et en litres. */
function cout(m: Montage, preparer?: (t: ReturnType<typeof monter>) => void): { kcal: number; eau: number } {
  const t = monter(m);
  preparer?.(t);
  const avant = { ...t.prive.besoins };
  t.attendre(6);
  return { kcal: avant.kcal - t.prive.besoins.kcal, eau: avant.eau - t.prive.besoins.eau };
}

test("A7 : au milieu de l'hiver, + 25 % de faim ; au milieu de l'été, + 25 % de soif ; rien au printemps", () => {
  const printemps = cout({ jour: 152 });
  const hiver = cout({ jour: 34 });
  const ete = cout({ jour: 218 });
  assert.ok(Math.abs(hiver.kcal / printemps.kcal - 1.25) < 0.005, `hiver : ×${hiver.kcal / printemps.kcal}`);
  assert.ok(Math.abs(hiver.eau / printemps.eau - 1) < 1e-6);
  assert.ok(Math.abs(ete.eau / printemps.eau - 1.25) < 0.005, `été : ×${ete.eau / printemps.eau}`);
  assert.ok(Math.abs(ete.kcal / printemps.kcal - 1) < 1e-6);
});

test("A7 : à 3 m d'un feu allumé ou endormi dans un abri, l'hiver ne coûte rien de plus ; loin du feu, si", () => {
  const printemps = cout({ jour: 152 });
  const feu = (allume: boolean) => (b: Base, id: number, instant: number) => b.sauverFeu(id, { id: 1, x: 22, z: 20, bois: 5, allume, majLe: instant });
  const auFeu = cout({ jour: 34, avant: feu(true) });
  assert.ok(Math.abs(auFeu.kcal / printemps.kcal - 1) < 1e-6, `au feu : ×${auFeu.kcal / printemps.kcal}`);
  const loin = cout({ jour: 34, avant: feu(true) }, (t) => (t.joueur.position = { x: 26, z: 20, o: 0 }));
  assert.ok(Math.abs(loin.kcal / printemps.kcal - 1.25) < 0.005, "à 6 m du feu, l'hiver pèse");
  const eteint = cout({ jour: 34, avant: feu(false) });
  assert.ok(Math.abs(eteint.kcal / printemps.kcal - 1.25) < 0.005, "un feu éteint ne réchauffe pas");
  // Fatigué, pour ne pas se réveiller reposé pendant la mesure.
  const fatigue = { kcal: 2000, eau: 1, repos: 0.2 };
  const abri = cout({ jour: 34, besoins: fatigue }, (t) => (t.prive.sommeil = { dansUnAbri: true, surUnLit: false }));
  const abriPrintemps = cout({ jour: 152, besoins: fatigue }, (t) => (t.prive.sommeil = { dansUnAbri: true, surUnLit: false }));
  assert.ok(Math.abs(abri.kcal / abriPrintemps.kcal - 1) < 1e-6, "endormi dans un abri");
  const dehors = cout({ jour: 34, besoins: fatigue }, (t) => (t.prive.sommeil = { dansUnAbri: false, surUnLit: false }));
  assert.ok(dehors.kcal > abri.kcal * 1.2, "endormi à la belle étoile, l'hiver pèse");
  // L'été, le feu n'atténue pas la soif.
  const eteAuFeu = cout({ jour: 218, avant: feu(true) });
  const ete = cout({ jour: 218 });
  assert.ok(Math.abs(eteAuFeu.eau / ete.eau - 1) < 1e-6);
});
