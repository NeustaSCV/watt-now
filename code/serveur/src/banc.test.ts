// 0.8.2, chantier C (R17) : le banc fait passer l'énergie de la batterie posée dedans vers ce qu'on porte. La batterie
// du banc se remplit au soleil et par un pédalier générateur à moins de 3 m (pas à 4) ; l'échanger rend l'ancienne au
// sac ; la petite batterie de la frontale, puis une matraque, se chargent depuis la batterie du banc, à 85 % ; rien ne
// se charge si elle est vide (le refus le dit) ; une partie 0.8.1 avec des batteries posées sur le banc ou le pédalier
// se relit sans rien perdre.

import { test } from "node:test";
import assert from "node:assert/strict";
import { chosesACharger } from "../../commun/src/banc.ts";
import { MS_JOUR_CALENDRIER, NOM_BATTERIE_DE_LA_RUINE, RENDEMENT_BANC, batterieDuBanc, dureeCharge, productionPanneau, whEDePedalage } from "../../commun/src/energie.ts";
import type { InstallationVue, MessageServeur } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { toutDevoile } from "../../commun/src/progression.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { SAVOIR_VIDE, type Savoir } from "../../commun/src/savoir.ts";
import { Base } from "./base.ts";
import { messageValide } from "./controle.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

type Recu<T extends MessageServeur["t"]> = Extract<MessageServeur, { t: T }>;

/** Un joueur sur son terrain, avec son sac, ses charges et ses installations posées d'avance (comme une partie relue). */
function surLeTerrain(
  famille: Famille,
  inventaire: Inventaire,
  installations: { type: InstallationVue["type"]; x: number; z: number; etat?: InstallationVue["etat"] }[] = [],
  charges?: Record<string, number>,
  armes?: Record<string, number>,
  savoir?: Savoir,
) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Ampère", "volts1234", famille);
  if (savoir) base.sauverSavoir(compte.id, savoir);
  base.sauverProgression(compte.id, toutDevoile(famille));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  if (armes) base.sauverChargeArmes(compte.id, armes);
  let instant = base.debutMonde() + 60_000;
  if (charges) base.sauverCharges(compte.id, charges, instant);
  const ids: number[] = [];
  for (const i of installations) {
    const v = base.ajouterInstallation(compte.id, i.type, i.x, i.z, 0);
    if (i.etat) base.sauverEtatInstallation(compte.id, v.id, { majLe: instant, ...i.etat });
    ids.push(v.id);
  }
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Recu<T> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as Recu<"info">).texte);
  const installation = (id: number) => base.chargerInstallations(compte.id).find((i) => i.id === id)!;
  const sac = () => base.chargerInventaire(compte.id);
  const chargesPortees = () => base.chargerCharges(compte.id).charges;
  return { base, compte, joueur, attendre, dernier, infos, installation, sac, chargesPortees, ids };
}

const banc = (wh: number, x = 20.5, etat: InstallationVue["etat"] = {}) => ({ type: "banc_recharge" as const, x, z: 20, etat: { batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: wh }, ...etat } });

// ---------- Remplir la batterie du banc ----------

test("0.8.2 banc : le panneau posé dessus remplit la batterie du banc au soleil (le soleil du monde, plan 0.10 S-30)", () => {
  const t = surLeTerrain("voltaiques", {}, [banc(100, 20.5, { panneau: true })]);
  const id = t.ids[0]!;
  // Un jour de calendrier (≈ 1 h 50 réelle), par pas de 30 s ; le panneau suit le soleil et le temps du monde.
  const debut = t.base.debutMonde();
  const secondes = 30 * Math.ceil(MS_JOUR_CALENDRIER / 30_000);
  t.attendre(secondes, 30);
  // On repasse par le banc (la base se met à jour au geste) : le soleil de ce jour-là, moins la décharge spontanée.
  t.joueur.recevoir({ t: "banc", id, op: "echanger" });
  const wh = batterieDuBanc(t.installation(id).etat)!.wh;
  const soleil = productionPanneau(debut + 60_000, debut + 60_000 + secondes * 1000, debut);
  assert.ok(soleil > 10 && soleil < 90, `${soleil}`);
  assert.ok(Math.abs(wh - 100 - soleil) < 1.5, `${wh} pour ${soleil}`);
});

test("0.8.2 banc : un pédalier générateur à 3 m charge directement la batterie du banc ; à 4 m, non", () => {
  const pedalier = (x: number) => ({ type: "pedalier" as const, x, z: 20, etat: { alternateur: true } });
  // Le pédalier à 3 m du banc (le banc en 20,5 ; le pédalier en 23,5).
  const t = surLeTerrain("mecanistes", {}, [banc(100), pedalier(23.5)]);
  const [idBanc, idPedalier] = t.ids as [number, number];
  t.joueur.position = { x: 23.5, z: 21, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: idPedalier }, verbe: "pedaler" });
  t.attendre(61);
  const apres = batterieDuBanc(t.installation(idBanc).etat)!;
  assert.ok(Math.abs(apres.wh - 100 - whEDePedalage("mecanistes")) < 0.5, `${apres.wh}`);
  assert.match(t.infos().at(-1)!, new RegExp(`\\+60 Wh dans ${NOM_BATTERIE_DE_LA_RUINE}, dans le banc`));
  // À 4 m, le banc est trop loin : sans batterie sur le pédalier ni dans le sac, rien à charger.
  const u = surLeTerrain("mecanistes", {}, [banc(100), pedalier(24.5)]);
  u.joueur.position = { x: 24.5, z: 21, o: 0 };
  u.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: u.ids[1]! }, verbe: "pedaler" });
  u.attendre(61);
  assert.ok(Math.abs(batterieDuBanc(u.installation(u.ids[0]!).etat)!.wh - 100) < 0.01, "rien n'est entré (la décharge spontanée seule)");
  assert.match(u.infos().at(-1)!, /moins de 3 m du banc/);
});

test("0.8.2 §7.3 : un Voltaïque qui a lu le manuel des Mécanistes pédale et remplit son banc à 3 m, sans le bonus ; sans l'avoir lu, refusé", () => {
  const pedalier = { type: "pedalier" as const, x: 23.5, z: 20, etat: { alternateur: true } };
  const t = surLeTerrain("voltaiques", {}, [banc(100), pedalier], undefined, undefined, { ...SAVOIR_VIDE, manuels: ["mecanistes"] });
  const [idBanc, idPedalier] = t.ids as [number, number];
  t.joueur.position = { x: 23.5, z: 21, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: idPedalier }, verbe: "pedaler" });
  t.attendre(61);
  const wh = batterieDuBanc(t.installation(idBanc).etat)!.wh;
  // La production d'un Voltaïque : sans le bonus des jambes de Mécaniste (×1,3).
  assert.ok(whEDePedalage("voltaiques") < whEDePedalage("mecanistes"));
  assert.ok(Math.abs(wh - 100 - whEDePedalage("voltaiques")) < 0.5, `${wh} ; ${t.infos().join(" | ")}`);
  // Sans rien avoir appris : le pédalier reste le savoir d'une autre famille.
  const u = surLeTerrain("voltaiques", {}, [banc(100), pedalier]);
  u.joueur.position = { x: 23.5, z: 21, o: 0 };
  u.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: u.ids[1]! }, verbe: "pedaler" });
  u.attendre(61);
  assert.match(u.infos().at(-1)!, /savoir d'une autre famille/);
  assert.ok(Math.abs(batterieDuBanc(u.installation(u.ids[0]!).etat)!.wh - 100) < 0.01);
});

// ---------- Échanger la batterie ----------

test("0.8.2 banc : échanger la batterie du banc rend l'ancienne au sac, avec sa charge", () => {
  const t = surLeTerrain("voltaiques", { batterie_voiture: 1 }, [banc(100)], { batterie_voiture: 300 });
  const id = t.ids[0]!;
  t.joueur.recevoir({ t: "banc", id, op: "echanger" });
  t.attendre(7);
  const b = batterieDuBanc(t.installation(id).etat)!;
  assert.ok(Math.abs(b.wh - 300) < 0.5, `dans le banc : ${b.wh}`);
  assert.equal(t.installation(id).etat.batteries?.batterie_voiture, 1, "une seule batterie dans le banc");
  assert.equal(b.nom, "la batterie de voiture", "ce n'est plus celle de la ruine");
  assert.equal(t.sac().batterie_voiture, 1, "l'ancienne est dans le sac");
  assert.ok(Math.abs((t.dernier("charges")!.charges.batterie_voiture ?? 0) - 100) < 0.5, `dans le sac : ${t.dernier("charges")!.charges.batterie_voiture}`);
  assert.match(t.infos().at(-1)!, new RegExp(`^Échangée : ${NOM_BATTERIE_DE_LA_RUINE} revient dans ton sac`));
  // Sans autre batterie dans le sac, l'échange est refusé (et rien ne bouge).
  const u = surLeTerrain("voltaiques", {}, [banc(100)]);
  u.joueur.recevoir({ t: "banc", id: u.ids[0]!, op: "echanger" });
  assert.match(u.infos().at(-1)!, /il t'en faut une autre dans ton sac/);
});

test("0.8.2 banc : la batterie de la ruine se branche à demeure ; le banc n'en prend qu'une", () => {
  const t = surLeTerrain("voltaiques", { batterie_voiture: 1, petite_batterie: 1, lampe_frontale: 1 }, [{ type: "banc_recharge", x: 20.5, z: 20 }], { batterie_voiture: 180, petite_batterie: 40 });
  const id = t.ids[0]!;
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id }, verbe: "poser_batteries" });
  t.attendre(5);
  assert.deepEqual(t.installation(id).etat.batteries, { batterie_voiture: 1 });
  assert.equal(batterieDuBanc(t.installation(id).etat)!.nom, NOM_BATTERIE_DE_LA_RUINE);
  assert.equal(t.sac().petite_batterie, 1, "la petite batterie reste à la frontale");
  // « Reprendre » ne la sort plus : la batterie du banc s'échange.
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id }, verbe: "reprendre_batteries" });
  t.attendre(7);
  assert.equal(t.installation(id).etat.batteries?.batterie_voiture, 1);
});

// ---------- Charger ce qu'on porte ----------

test("0.8.2 banc : la petite batterie de la frontale, puis une matraque, se chargent depuis la batterie du banc à 85 %", () => {
  const t = surLeTerrain("voltaiques", { petite_batterie: 1, lampe_frontale: 1, matraque_electrique: 1 }, [banc(100)], { petite_batterie: 20 }, { matraque_electrique: 0 });
  const id = t.ids[0]!;
  // La fiche du banc : une ligne par chose qui se charge, nommée.
  const lignes = chosesACharger(t.sac(), t.chargesPortees(), { matraque_electrique: 0 });
  assert.deepEqual(lignes.map((c) => [c.nom, c.source]), [["La petite batterie de la frontale", undefined], ["Matraque électrique", "son pack de cellules"]]);
  // 30 Wh manquent à la petite batterie : une minute réelle (30 Wh par heure de jeu).
  assert.equal(dureeCharge(30), 60);
  t.joueur.recevoir({ t: "banc", id, op: "charger", cible: "petite_batterie" });
  t.attendre(55);
  assert.ok(Math.abs((t.chargesPortees().petite_batterie ?? 0) - 20) < 0.5, "pas avant la fin du geste");
  t.attendre(6);
  assert.ok(Math.abs((t.dernier("charges")!.charges.petite_batterie ?? 0) - 50) < 0.1, `${t.dernier("charges")!.charges.petite_batterie}`);
  const apresFrontale = batterieDuBanc(t.installation(id).etat)!.wh;
  assert.ok(Math.abs(apresFrontale - (100 - 30 / RENDEMENT_BANC)) < 0.5, `${apresFrontale}`);
  assert.equal(t.infos().at(-1), "+30 Wh dans la petite batterie de la frontale. Il reste 64,7 Wh dans la batterie de voiture de la ruine.");
  // Puis la matraque, vidée au combat : 12 Wh, ≈ 24 s.
  t.joueur.recevoir({ t: "banc", id, op: "charger", cible: "matraque_electrique" });
  t.attendre(26);
  assert.equal(t.dernier("usure")?.charge?.matraque_electrique, undefined, "pleine (absente : pleine)");
  const apresMatraque = batterieDuBanc(t.installation(id).etat)!.wh;
  assert.ok(Math.abs(apresMatraque - (apresFrontale - 12 / RENDEMENT_BANC)) < 0.5, `${apresMatraque}`);
});

test("0.8.2 banc : rien ne se charge si la batterie du banc est vide, et le refus le dit", () => {
  const t = surLeTerrain("voltaiques", { petite_batterie: 1, lampe_frontale: 1 }, [banc(0)], { petite_batterie: 10 });
  t.joueur.recevoir({ t: "banc", id: t.ids[0]!, op: "charger", cible: "petite_batterie" });
  t.attendre(5);
  assert.match(t.infos().at(-1)!, /^La batterie de voiture de la ruine, dans le banc, est vide : rien à charger\./);
  assert.ok(Math.abs((t.chargesPortees().petite_batterie ?? 0) - 10) < 0.1);
  // Pleine, elle le dit aussi.
  const u = surLeTerrain("voltaiques", { petite_batterie: 1 }, [banc(100)], { petite_batterie: 50 });
  u.joueur.recevoir({ t: "banc", id: u.ids[0]!, op: "charger", cible: "petite_batterie" });
  assert.match(u.infos().at(-1)!, /est déjà pleine/);
});

test("0.8.2 banc : le message « charger » a une cible ; un client modifié ne passe pas", () => {
  assert.ok(messageValide({ t: "banc", id: 3, op: "charger", cible: "petite_batterie" }));
  assert.ok(messageValide({ t: "banc", id: 3, op: "charger", cible: "matraque_electrique#2" }));
  assert.ok(messageValide({ t: "banc", id: 3, op: "echanger" }));
  assert.ok(!messageValide({ t: "banc", id: 3, op: "charger", cible: "toString" }));
  assert.ok(!messageValide({ t: "banc", id: "3", op: "echanger" }));
  assert.ok(!messageValide({ t: "banc", id: 3, op: "vider" }));
});

// ---------- Une partie 0.8.1 se relit ----------

test("0.8.2 banc : une partie 0.8.1 avec des batteries posées sur le banc et le pédalier se relit sans rien perdre", () => {
  const t = surLeTerrain(
    "voltaiques",
    { lampe_frontale: 1 },
    [
      // Le banc de la 0.8.1 : la batterie de la ruine et la petite batterie du kit, posées ensemble.
      { type: "banc_recharge", x: 20.5, z: 20, etat: { panneau: true, batteries: { batterie_voiture: 1, petite_batterie: 1 }, charges: { batterie_voiture: 200, petite_batterie: 30 } } },
      // Un pédalier qui portait sa batterie : il la garde.
      { type: "pedalier", x: 30, z: 20, etat: { alternateur: true, batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: 50 } } },
    ],
  );
  const [idBanc, idPedalier] = t.ids as [number, number];
  const b = t.installation(idBanc);
  assert.deepEqual(b.etat.batteries, { batterie_voiture: 1 }, "le banc garde la batterie de la ruine");
  assert.ok(Math.abs(b.etat.charges!.batterie_voiture! - 200) < 0.5);
  assert.equal(b.etat.panneau, true);
  assert.equal(t.sac().petite_batterie, 1, "la petite batterie revient au sac");
  assert.ok(Math.abs((t.chargesPortees().petite_batterie ?? 0) - 30) < 0.5, "avec sa charge");
  assert.equal(t.sac().lampe_frontale, 1);
  const p = t.installation(idPedalier);
  assert.deepEqual(p.etat.batteries, { batterie_voiture: 1 }, "le pédalier garde la sienne");
  assert.ok(Math.abs(p.etat.charges!.batterie_voiture! - 50) < 0.5);
  // Deux batteries de voiture sur un banc : l'une reste, l'autre revient au sac, chacune avec sa moitié.
  const u = surLeTerrain("voltaiques", {}, [{ type: "banc_recharge", x: 20.5, z: 20, etat: { batteries: { batterie_voiture: 2 }, charges: { batterie_voiture: 400 } } }]);
  assert.deepEqual(u.installation(u.ids[0]!).etat.batteries, { batterie_voiture: 1 });
  assert.ok(Math.abs(u.installation(u.ids[0]!).etat.charges!.batterie_voiture! - 200) < 0.5);
  assert.equal(u.sac().batterie_voiture, 1);
  assert.ok(Math.abs((u.chargesPortees().batterie_voiture ?? 0) - 200) < 0.5);
});
