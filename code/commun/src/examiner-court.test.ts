// La fiche « Examiner » courte (0.10.1, chantier E, D1) : « Sert à », « Se monte sur », « Outil », et pourquoi une
// installation ne marche pas.

import { test } from "node:test";
import assert from "node:assert/strict";
import { OBJETS, type TypeObjet } from "./objets.ts";
import { RECETTES, recettesConnues } from "./recettes.ts";
import { devoileesDEmblee } from "./progression.ts";
import { estOrdure } from "./vestiges.ts";
import { RECETTE_FEU } from "./survie.ts";
import type { EtatInstallation } from "./messages.ts";
import { RAISON_PEDALIER_SANS_ORGANE } from "./mecanique.ts";
import { MAX_SERT_A, RAISON_PEDALIER_SANS_BATTERIE, RIEN_POUR_L_INSTANT, fabricationsDe, lignesObjet, pedalierChargeLeBanc, raisonArret, seMonteSur, sertA, verbesOutil } from "./examiner-court.ts";

const TYPES = Object.keys(OBJETS) as TypeObjet[];
const prend = (r: (typeof RECETTES)[number], t: TypeObjet) => (r.ingredients[t] ?? 0) > 0 || (r.auChoix ?? []).some((c) => (c[t] ?? 0) > 0);
const nomCourt = (nom: string) => nom.replace(/\s*\(.*\)\s*$/, "");

test("« Sert à » ne cite jamais une recette cachée", () => {
  // Un Mécaniste au tout début : les gestes de base seulement.
  const vue = { devoilees: [...devoileesDEmblee("mecanistes")] };
  const visibles = recettesConnues("mecanistes", {}).filter((r) => vue.devoilees.includes(r.id) && !r.aVenir);
  for (const t of TYPES) {
    for (const nom of fabricationsDe(t, "mecanistes", {}, vue)) {
      if (nom === "Feu de camp") {
        assert.ok(vue.devoilees.includes("feu_de_camp") && RECETTE_FEU[t], t);
        continue;
      }
      assert.ok(
        visibles.some((r) => nomCourt(r.nom) === nom && prend(r, t)),
        `${t} : « ${nom} » n'est pas dévoilée`,
      );
    }
  }
  // La corde entre dans des recettes cachées au début (le coffre, le travois…) : elles ne se montrent pas.
  const cachees = RECETTES.filter((r) => prend(r, "corde") && !vue.devoilees.includes(r.id)).map((r) => nomCourt(r.nom));
  assert.ok(cachees.length > 0);
  for (const nom of cachees) assert.ok(!fabricationsDe("corde", "mecanistes", {}, vue).includes(nom), nom);
  // Rien de dévoilé : le feu de camp non plus.
  assert.deepEqual(fabricationsDe("pierre", "mecanistes", {}, { devoilees: [] }), []);
  // Une recette d'une autre famille, dévoilée mais pas apprise, reste cachée.
  const autre = RECETTES.find((r) => r.famille === "charbonniers" && !r.aVenir && Object.keys(r.ingredients).length > 0)!;
  const ingredient = Object.keys(autre.ingredients)[0] as TypeObjet;
  assert.ok(!fabricationsDe(ingredient, "mecanistes", {}, { devoilees: [autre.id] }).includes(nomCourt(autre.nom)));
});

test("« Sert à » : le feu de camp compte, les variantes une fois, 4 au plus puis « et N autres »", () => {
  assert.equal(sertA("pierre", "mecanistes", {}, { devoilees: ["feu_de_camp"] }), "feu de camp.");
  // Les trois cordes d'arc (fil dentaire, boyau, ficelle) : une seule « corde d'arc ».
  const arcs = RECETTES.filter((r) => nomCourt(r.nom) === "Corde d'arc").map((r) => r.id);
  assert.ok(arcs.length >= 2);
  const ficelle = fabricationsDe("ficelle", "mecanistes", {}, { devoilees: arcs });
  assert.equal(ficelle.filter((n) => n === "Corde d'arc").length, ficelle.includes("Corde d'arc") ? 1 : 0);
  // Les branches entrent dans beaucoup de choses : 4 noms, puis le reste compté.
  const tout = { devoilees: RECETTES.map((r) => r.id).concat("feu_de_camp") };
  const n = fabricationsDe("branche", "mecanistes", {}, tout).length;
  assert.ok(n > MAX_SERT_A + 1);
  const texte = sertA("branche", "mecanistes", {}, tout)!;
  assert.match(texte, new RegExp(`^feu de camp, .+ et ${n - MAX_SERT_A} autres\\.$`));
  assert.equal(texte.split(", ").length, MAX_SERT_A);
  // Sans état de progression (un vieux serveur) : ce qu'on connaît.
  assert.ok(sertA("branche", "mecanistes", {}, null));
});

test("une ordure n'a pas de ligne ; « Rien que tu saches faire » seulement pour un objet utile aux recettes toutes cachées", () => {
  const rien = { devoilees: [] as string[] };
  for (const t of TYPES) {
    const s = sertA(t, "mecanistes", {}, rien);
    const entre = RECETTES.some((r) => prend(r, t)) || (RECETTE_FEU[t] ?? 0) > 0;
    if (estOrdure(t)) assert.equal(s, null, `${t} : une ordure, pas de ligne`);
    else assert.equal(s, entre ? RIEN_POUR_L_INSTANT : null, t);
  }
  // Le sac plastique, une ordure qui entre pourtant dans une recette : sa recette cachée, pas de phrase d'attente.
  assert.ok(estOrdure("sac_plastique"));
  assert.equal(sertA("sac_plastique", "mecanistes", {}, rien), null);
  // La gourde n'entre dans aucune recette : pas de ligne.
  assert.equal(sertA("gourde", "mecanistes", {}, rien), null);
  assert.equal(sertA("corde", "mecanistes", {}, rien), RIEN_POUR_L_INSTANT);
  // Une fois une recette dévoilée, la phrase d'attente s'en va.
  const coffre = { devoilees: ["coffre"] };
  assert.equal(sertA("corde", "mecanistes", {}, coffre), "coffre de rangement.");
});

test("« Outil » : les verbes du couteau, rien pour une corde", () => {
  assert.equal(verbesOutil("couteau"), "couper, visser.");
  assert.equal(verbesOutil("cle_plate"), "serrer, marteler.");
  assert.equal(verbesOutil("corde"), null);
  const lignes = lignesObjet("couteau", "mecanistes", {}, { devoilees: [] });
  assert.deepEqual(lignes.at(-1), { titre: "Outil", texte: "couper, visser." });
});

test("« Se monte sur » : l'alternateur et la dynamo sur le pédalier, s'il est dévoilé ; sinon rien", () => {
  const avec = { devoilees: ["pedalier"] };
  assert.equal(seMonteSur("petit_alternateur", "mecanistes", {}, avec), "le pédalier générateur.");
  assert.equal(seMonteSur("dynamo_velo", "mecanistes", {}, avec), "le pédalier générateur.");
  assert.deepEqual(lignesObjet("petit_alternateur", "mecanistes", {}, avec), [{ titre: "Se monte sur", texte: "le pédalier générateur." }]);
  // Le pédalier n'est pas dévoilé (ou c'est celui d'une autre famille) : aucune ligne, pas même la phrase d'attente.
  assert.deepEqual(lignesObjet("petit_alternateur", "mecanistes", {}, { devoilees: [] }), []);
  assert.deepEqual(lignesObjet("petit_alternateur", "charbonniers", {}, avec), []);
  // Un outil ou un ingrédient n'est pas une pièce à monter.
  assert.equal(seMonteSur("masse", "charbonniers", {}, null), null);
  assert.equal(seMonteSur("corde", "mecanistes", {}, null), null);
});

test("le pédalier sans batterie dit pourquoi ; avec une batterie, rien", () => {
  const sansBatterie: EtatInstallation = { alternateur: true };
  assert.equal(raisonArret({ type: "pedalier", etat: sansBatterie }, {}), RAISON_PEDALIER_SANS_BATTERIE);
  assert.equal(RAISON_PEDALIER_SANS_BATTERIE, "Il lui faut une batterie : dans ton sac, ou un banc à moins de 3 m.");
  // Une batterie dans le sac, posée dessus, ou un banc tout près : il marche.
  assert.equal(raisonArret({ type: "pedalier", etat: sansBatterie }, { petite_batterie: 1 }), null);
  assert.equal(raisonArret({ type: "pedalier", etat: { alternateur: true, batteries: { petite_batterie: 1 } } }, {}), null);
  assert.equal(raisonArret({ type: "pedalier", etat: { dynamo: true } }, {}, true), null);
  assert.equal(raisonArret({ type: "pedalier", etat: { dynamo: true } }, {}), RAISON_PEDALIER_SANS_BATTERIE);
  // Sans alternateur ni dynamo : la phrase du serveur quand on pédale (R-06), qu'on ait une batterie ou non.
  assert.equal(raisonArret({ type: "pedalier", etat: {} }, {}), RAISON_PEDALIER_SANS_ORGANE);
  assert.equal(raisonArret({ type: "pedalier", etat: {} }, { petite_batterie: 1 }, true), RAISON_PEDALIER_SANS_ORGANE);
  assert.equal(RAISON_PEDALIER_SANS_ORGANE, "Rien à entraîner : monte l'alternateur de la station (ou, à défaut, la dynamo du vélo).");
  // Le banc à moins de 3 m, sa batterie pas pleine.
  const banc = { type: "banc_recharge", x: 2, z: 0, etat: { batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: 10 } } as EtatInstallation };
  assert.equal(pedalierChargeLeBanc({ x: 0, z: 0 }, [banc]), true);
  assert.equal(pedalierChargeLeBanc({ x: 6, z: 0 }, [banc]), false);
});

test("les autres raisons sont celles que le jeu disait déjà ; une installation qui marche n'en a pas", () => {
  assert.equal(raisonArret({ type: "cloture_electrique", etat: { declencheur: { arme: false, prises: 0 } } }, {}), "Le courant ne passe pas : il lui faut un banc chargé à moins de 6 m.");
  assert.equal(raisonArret({ type: "cloture_fortune", etat: { declencheur: { arme: true, prises: 0 } } }, {}), null);
  assert.equal(raisonArret({ type: "rampe_led", etat: { courant: false } }, {}), "Pas de batterie chargée à moins de 15 m : elle reste éteinte.");
  assert.equal(raisonArret({ type: "rampe_led", etat: { courant: true } }, {}), null);
  assert.equal(raisonArret({ type: "coffre", etat: {} }, {}), null);
});
