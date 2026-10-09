// Bug du 2026-10-09 (0.7.1) : « à la Coopérative, j'en ai fouillé 10, aucun ne contenait quelque chose ». La cause
// était côté client (la liste de la fouille, détachée de la page, ne s'affichait jamais) ; ici, de bout en bout côté
// serveur : un nouveau joueur va à sa Coopérative et fouille dix sacs-poubelle ; au moins sept ont quelque chose dedans.

import { test } from "node:test";
import assert from "node:assert/strict";
import { cleCouche, dispositionLieu, refConteneur } from "../../commun/src/couche-dechets.ts";
import { DUREE_VOYAGE_S, SORTIES_COMPTOIR, arriveeDans } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

test("un nouveau joueur fouille dix sacs-poubelle de sa Coopérative : au moins sept ont quelque chose dedans", () => {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const halte = new Halte(base);
  const comptoir = new Comptoir(base);
  const cooperatives = new Cooperatives(base, () => 0.5, () => instant);
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(compte.id, { sac_a_dos: 1 });
  base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
  base.sauverPosition(compte.id, arriveeDans("comptoir", "station"), "comptoir", instant);
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5, comptoir, cooperatives);
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
      cooperatives.tick(instant, pas);
    }
  };
  const sortie = SORTIES_COMPTOIR.find((s) => s.vers === "cooperative")!;
  joueur.position = { x: sortie.boite.x, z: sortie.boite.z, o: 0 };
  joueur.recevoir({ t: "voyager", vers: "cooperative" });
  attendre(DUREE_VOYAGE_S + 1);
  const bienvenue = recus.findLast((m) => m.t === "bienvenue") as Extract<MessageServeur, { t: "bienvenue" }>;
  assert.equal(bienvenue.lieu, "cooperative");
  const cle = cleCouche("cooperative", compte.id);
  assert.equal(bienvenue.dechets?.cle, cle);
  // Personne n'y a touché : aucun carreau entamé.
  assert.deepEqual(bienvenue.dechets?.carreaux, []);
  // Les Éteints de la Coopérative ne sont pas le sujet : ils ne viennent pas interrompre la fouille.
  for (const e of cooperatives.de(compte.id).eteints) e.etat = "detruit";

  const sacs: { ref: string; x: number; z: number }[] = [];
  for (const [k, liste] of dispositionLieu(cle)) {
    const [cx, cz] = k.split(",").map(Number) as [number, number];
    for (const em of liste) if (em.genre === "sac_poubelle") sacs.push({ ref: refConteneur(cx, cz, em.e), x: em.x, z: em.z });
  }
  assert.ok(sacs.length >= 10, `${sacs.length} sacs`);
  let pleins = 0;
  const journal: string[] = [];
  for (const sac of sacs.slice(0, 10)) {
    joueur.position = { x: sac.x, z: sac.z + 0.8, o: 0 };
    const avant = recus.length;
    joueur.recevoir({ t: "dechets", op: { genre: "fouiller", ref: sac.ref } });
    attendre(10);
    const nouveaux = recus.slice(avant);
    const liste = (nouveaux.findLast((m) => m.t === "fouille") as Extract<MessageServeur, { t: "fouille" }> | undefined)?.fouille;
    const objets = liste?.objets ?? [];
    if (objets.length > 0) pleins++;
    const infos = nouveaux.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    journal.push(`${sac.ref} : ${objets.map((o) => o.objet).join(", ") || "rien"} ${infos.join(" | ")}`);
    joueur.recevoir({ t: "dechets", op: { genre: "fermer" } });
  }
  assert.ok(pleins >= 7, journal.join("\n"));
});
