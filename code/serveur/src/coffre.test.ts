// Le coffre de rangement et les objets jetés par terre (quand le sac est trop lourd).

import { test } from "node:test";
import assert from "node:assert/strict";
import { toutDevoile } from "../../commun/src/progression.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>, charges: Record<string, number> = {}) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  // Ces tests portent sur autre chose que l'arbre de progression : tout est dévoilé (plan 0.8 : le vétéran
  // n'a plus d'emblée que les recettes à la main).
  base.sauverProgression(compte.id, toutDevoile("mecanistes"));
  // Un sac à dos, comme dans le kit de départ (sans lui, on ne porte que 10 kg).
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  if (Object.keys(charges).length) base.sauverCharges(compte.id, charges, 10_000_000);
  let instant = 10_000_000;
  const halte = new Halte(base);
  const comptoir = new Comptoir(base, instant);
  const recus: MessageServeur[] = [];
  const ouvrir = () => new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 1, comptoir);
  let joueur = ouvrir();
  const attendre = (secondes: number) => {
    for (let s = 0; s < secondes; s++) {
      instant += 1000;
      joueur.tick(1);
    }
  };
  joueur.position = { x: 20, z: 20, o: 0 };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const reouvrir = () => {
    joueur.sauvegarder();
    joueur.partir();
    joueur = ouvrir();
    joueur.position = { x: 20, z: 20, o: 0 };
    return joueur;
  };
  return { base, attendre, dernier, joueur: () => joueur, reouvrir };
}

const KIT_COFFRE = { buche: 4, branche: 4, corde: 1, couteau: 1, marteau: 1 };

test("on fabrique un coffre, on y range, on en sort ; il garde tout, même après déconnexion", () => {
  const t = monter({ ...KIT_COFFRE, pierre: 12, conserve: 2 });
  t.joueur().recevoir({ t: "fabriquer", recette: "coffre", x: 20, z: 21.6, o: 0 });
  t.attendre(70);
  const coffre = t.joueur().bienvenue(0).installations.find((i) => i.type === "coffre");
  assert.ok(coffre, "le coffre est posé");
  t.joueur().recevoir({ t: "coffre", id: coffre.id, sens: "deposer", objet: "pierre", quantite: 10 });
  assert.equal(t.dernier("inventaire")!.inventaire.pierre, 2);
  assert.equal(t.dernier("installation")!.installation.etat.contenu?.pierre, 10);
  t.reouvrir();
  const apres = t.joueur().bienvenue(0).installations.find((i) => i.id === coffre.id)!;
  assert.equal(apres.etat.contenu?.pierre, 10, "le contenu est sauvegardé");
  t.joueur().recevoir({ t: "coffre", id: coffre.id, sens: "prendre", objet: "pierre", quantite: 4 });
  assert.equal(t.dernier("inventaire")!.inventaire.pierre, 6);
  // Trop loin : rien ne bouge.
  t.joueur().position = { x: 30, z: 30, o: 0 };
  t.joueur().recevoir({ t: "coffre", id: coffre.id, sens: "prendre", objet: "pierre", quantite: 1 });
  assert.equal(t.dernier("inventaire")!.inventaire.pierre, 6);
});

test("la charge d'une batterie la suit dans le coffre et en ressort", () => {
  const t = monter({ ...KIT_COFFRE, petite_batterie: 1 }, { petite_batterie: 30 });
  t.joueur().recevoir({ t: "fabriquer", recette: "coffre", x: 20, z: 21.6, o: 0 });
  t.attendre(70);
  const coffre = t.joueur().bienvenue(0).installations.find((i) => i.type === "coffre")!;
  t.joueur().recevoir({ t: "coffre", id: coffre.id, sens: "deposer", objet: "petite_batterie", quantite: 1 });
  assert.equal(t.dernier("installation")!.installation.etat.charges?.petite_batterie, 30);
  t.joueur().recevoir({ t: "coffre", id: coffre.id, sens: "prendre", objet: "petite_batterie", quantite: 1 });
  assert.equal(Math.round(t.dernier("charges")!.charges.petite_batterie ?? 0), 30);
});

test("jeter un objet le pose au sol ; on peut le ramasser, autant que le sac peut porter", () => {
  const t = monter({ pierre: 10, buche: 3 });
  t.joueur().recevoir({ t: "jeter", objet: "pierre", quantite: 6 });
  t.joueur().recevoir({ t: "jeter", objet: "buche", quantite: 1 });
  assert.equal(t.dernier("inventaire")!.inventaire.pierre, 4);
  const sacs = t.dernier("sacs")!.sacs;
  assert.equal(sacs.length, 1, "les objets jetés au même endroit font un seul tas");
  assert.equal(sacs[0]!.jete, true);
  assert.deepEqual(sacs[0]!.contenu, { pierre: 6, buche: 1 });
  t.joueur().recevoir({ t: "interagir", cible: { genre: "sac", id: sacs[0]!.id }, verbe: "reprendre" });
  t.attendre(3);
  assert.equal(t.dernier("inventaire")!.inventaire.pierre, 10);
  assert.equal(t.dernier("sacs")!.sacs.length, 0, "le tas a disparu");
});

test("on ne jette pas son sac à dos, ni au Comptoir", () => {
  const t = monter({ sac_a_dos: 1, pierre: 2 });
  t.joueur().recevoir({ t: "jeter", objet: "sac_a_dos", quantite: 1 });
  assert.equal(t.dernier("inventaire"), undefined);
  assert.match(t.dernier("info")!.texte, /sur le dos/);
});
