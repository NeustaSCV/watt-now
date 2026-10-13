// Tests du chantier 1 de la 0.8 (le moteur des constructions) : le lieu de chaque recette, les outils en portes dures,
// les objets de fortune, la carte des installations qui distingue les formes du feu, « plus tard ».

import { test } from "node:test";
import assert from "node:assert/strict";
import { NOMS_INSTALLATIONS, QUALITES_OBJETS, RECETTES, multiplicateurQualites, niveauQualite, recette } from "./recettes.ts";
import { VOIE_CREUSEE, VOIE_SURFACE, lignee, refusAVenir, type FormeFeu } from "./lignees.ts";
import { carteInstallations, lieuPossede, refusLieu, texteLieu, type Alentours } from "./lieu-recette.ts";
import { OBJETS } from "./objets.ts";

const FORMES = new Set<string>([...VOIE_SURFACE, ...VOIE_CREUSEE].map((e) => e.id));

test("chaque recette a un lieu : à la main, posée (elle pose une installation), ou à une construction qui existe", () => {
  for (const r of RECETTES) {
    assert.ok(r.lieu, `${r.id} : un lieu`);
    assert.equal(r.lieu.genre === "posee", "installation" in r.produit, `${r.id} : posée si et seulement si elle pose une installation`);
    if (r.lieu.genre !== "construction") continue;
    const l = r.lieu;
    if (l.construction === "feu") {
      assert.ok(l.formes && l.formes.length > 0, `${r.id} : les formes du feu`);
      for (const f of l.formes) assert.ok(FORMES.has(f), `${r.id} : forme ${f}`);
    } else {
      assert.ok(Object.hasOwn(NOMS_INSTALLATIONS, l.construction), `${r.id} : ${l.construction}`);
      assert.equal(r.installation, l.construction, `${r.id} : le champ dérivé suit le lieu`);
    }
  }
});

test("les listes cachées de la forge passent dans le lieu : la hache à la forge ventilée, le ressort retrempé à l'huile, l'acier au bac", () => {
  for (const id of ["hache_forgee", "hache_forgee_soc", "glaive"]) assert.deepEqual(recette(id)!.lieu, { genre: "construction", construction: "forge", niveau: 2, accessoire: "bac" }, id);
  assert.deepEqual(recette("ressort_retrempe")!.lieu, { genre: "construction", construction: "forge", accessoire: "huile" });
  assert.deepEqual(recette("machette_forgee_fer")!.lieu, { genre: "construction", construction: "forge" }, "le fer doux : au foyer, sans bac");
  assert.deepEqual(recette("machette_forgee")!.lieu, { genre: "construction", construction: "forge", accessoire: "bac" }, "l'acier : au bac");
  // Q-0.8-2 : la hachette au foyer de forge.
  assert.equal((recette("hachette")!.lieu as { niveau?: number }).niveau, undefined);
});

test("les outils sont des portes dures : Marteler 1 ne suffit plus pour Marteler 2", () => {
  assert.equal(multiplicateurQualites({ pierre: 1 }, { marteler: 2 }), null);
  assert.equal(multiplicateurQualites({ pierre: 1 }, { marteler: 1 }), 1);
  assert.equal(multiplicateurQualites({ couteau: 1 }, { couper: 2 }), null, "Couper 1 ne vaut plus Couper 2");
  assert.equal(multiplicateurQualites({ couteau_aiguise: 1, marteau: 1 }, { couper: 2, marteler: 2 }), 1);
});

test("la pierre donne Marteler 1, le couteau Visser 1 ; les objets de fortune existants donnent le niveau 1", () => {
  assert.equal(niveauQualite({ pierre: 1 }, "marteler"), 1);
  assert.equal(niveauQualite({ couteau: 1 }, "visser"), 1);
  const fortune: [keyof typeof QUALITES_OBJETS, Parameters<typeof niveauQualite>[1]][] = [
    ["cle_plate", "marteler"],
    ["cric", "marteler"],
    ["ferraille_tordue", "marteler"],
    ["verre", "couper"],
    ["lame_ebrechee", "couper"],
    ["boite_vide", "couper"],
    ["secateur", "couper"],
    ["lame_ebrechee", "visser"],
    ["enjoliveur", "creuser"],
    ["casserole", "creuser"],
    ["lime_usee", "trancher_metal"],
  ];
  for (const [objet, q] of fortune) {
    assert.ok(OBJETS[objet], objet);
    assert.equal(niveauQualite({ [objet]: 1 }, q), 1, `${objet} : ${q} 1`);
  }
  assert.equal(niveauQualite({ cle_plate: 1 }, "serrer"), 2, "la clé plate serre toujours à 2");
});

// ---------- Le lieu, jugé ----------

/** Des alentours : le joueur en (0, 0), des feux et des installations autour. */
function autour(feux: { forme: FormeFeu; x?: number; allume?: boolean; couvert?: boolean }[], installations: Alentours["installations"] = []): Alentours {
  return {
    x: 0,
    z: 0,
    feux: feux.map((f) => {
      const dakota = f.forme === "dakota" || f.forme === "poele_fusee";
      const niveau = (dakota ? VOIE_CREUSEE : VOIE_SURFACE).findIndex((e) => e.id === f.forme) + 1;
      return { x: f.x ?? 1, z: 0, allume: f.allume ?? true, bois: 2, couvert: f.couvert, niveau, dakota };
    }),
    installations,
    inventaire: {},
  };
}

test("une recette « au foyer de pierres » est refusée près d'un feu de camp, et le refus nomme ce qui manque", () => {
  const epieu = recette("epieu")!.lieu;
  assert.equal(refusLieu(epieu, autour([{ forme: "feu_camp" }])), "Il te faut un foyer de pierres.");
  assert.equal(refusLieu(epieu, autour([{ forme: "foyer_pierres" }])), null);
  assert.equal(refusLieu(epieu, autour([{ forme: "foyer_cuisine" }])), null, "le foyer de cuisine garde ce que faisait le foyer de pierres");
  assert.equal(refusLieu(epieu, autour([{ forme: "dakota" }])), "Il te faut un foyer de pierres.", "le Dakota ne durcit rien");
  assert.match(refusLieu(epieu, autour([{ forme: "foyer_pierres", x: 6 }]))!, /Approche-toi de ton foyer de pierres/);
  assert.match(refusLieu(epieu, autour([{ forme: "foyer_pierres", allume: false }]))!, /allume ton foyer de pierres/);
  // La poêlée : au foyer de pierres, ou au Dakota.
  const poelee = recette("cepes_poeles")!.lieu;
  assert.equal(refusLieu(poelee, autour([{ forme: "feu_camp" }])), "Il te faut un foyer de pierres ou un foyer Dakota.");
  assert.equal(refusLieu(poelee, autour([{ forme: "dakota" }])), null);
  // Les pommes cuites : tout feu de camp.
  assert.equal(refusLieu(recette("pommes_cuites")!.lieu, autour([{ forme: "feu_camp" }])), null);
  assert.equal(texteLieu(recette("epieu")!), "Sur un foyer de pierres, allumé. ");
});

test("à une construction : la bonne, à son niveau, à 3 m, avec son accessoire", () => {
  const forge = (niveau: number, etat = {}, x = 2) => [{ type: "forge", x, z: 0, niveau, etat }];
  const hache = recette("hache_forgee")!.lieu;
  assert.equal(refusLieu(hache, autour([])), "Il te faut une forge ventilée.");
  assert.equal(refusLieu(hache, autour([], forge(1))), "Il te faut une forge ventilée : améliore ton foyer de forge (Examiner).");
  assert.equal(refusLieu(hache, autour([], forge(2, {}, 5))), "Approche-toi de ta forge ventilée.");
  assert.equal(refusLieu(hache, autour([], forge(2))), "Il te faut un bac de trempe à ta forge ventilée.");
  assert.equal(refusLieu(hache, autour([], forge(2, { bac: true }))), null);
  // L'huile : celle du bac, ou la graisse du sac.
  const ressort = recette("ressort_retrempe")!.lieu;
  assert.match(refusLieu(ressort, autour([], forge(1, { bac: true })))!, /à l'huile/);
  assert.equal(refusLieu(ressort, autour([], forge(1, { bac: true, huile: 3 }))), null);
  assert.equal(refusLieu(ressort, { ...autour([], forge(1)), inventaire: { graisse: 1 } }), null);
  // À la main et posée : rien à juger.
  assert.equal(refusLieu(recette("corde")!.lieu, autour([])), null);
  assert.equal(refusLieu(recette("abri")!.lieu, autour([])), null);
  // Le métier se fait à l'atelier : la matraque de fortune au banc.
  assert.equal(refusLieu(recette("matraque_fortune")!.lieu, autour([])), "Il te faut un banc solaire.");
});

test("la carte des installations distingue les formes du feu et les accessoires ; elle dit si un lieu est à portée", () => {
  const carte = carteInstallations(
    [{ type: "forge", niveau: 1, etat: { bac: true } }, { type: "etabli", etat: {} }],
    [{ niveau: 1, dakota: true }, { niveau: 1, accessoires: { broche: {} } }],
  );
  const m = new Map<string, number>();
  for (const c of carte) m.set(c.type, Math.max(m.get(c.type) ?? 0, c.niveau));
  assert.ok(m.has("feu:dakota") && m.has("feu:feu_camp") && !m.has("feu:foyer_pierres"));
  assert.equal(m.get("feu"), 1);
  assert.ok(m.has("forge+bac") && m.has("feu+broche"));
  assert.equal(lieuPossede(recette("cepes_poeles")!.lieu, m), true, "la poêlée au Dakota");
  assert.equal(lieuPossede(recette("epieu")!.lieu, m), false, "pas de foyer de pierres");
  assert.equal(lieuPossede(recette("machette_forgee")!.lieu, m), true, "le bac est posé");
  assert.equal(lieuPossede(recette("hache_forgee")!.lieu, m), false, "pas de forge ventilée");
  assert.equal(lieuPossede(recette("ebauche_arc")!.lieu, m), true);
  assert.equal(lieuPossede(recette("corde")!.lieu, m), true);
});

test("« plus tard » remplace la phase 0b : le four de terre et le poêle attendent, la hutte aussi", () => {
  const four = VOIE_SURFACE.find((e) => e.id === "four_terre")!;
  // Plan 0.8 (chantier 5) : le four attend sa porte de fonte, au niveau 2 ; le poêle et la hutte, la phase 0b.
  assert.equal(four.aVenir, "niveau 2");
  assert.equal(refusAVenir(four), "Four de terre : plus tard. Ce qui lui manque est à trouver plus loin.");
  assert.equal(VOIE_SURFACE.find((e) => e.id === "poele")!.aVenir, "0b");
  assert.equal(lignee("abri")!.find((e) => e.id === "hutte")!.aVenir, "0b");
  assert.equal(refusAVenir({ nom: "Coffre cerclé", aVenir: "niveau 2" }), "Coffre cerclé : plus tard. Ce qui lui manque est à trouver plus loin.");
  assert.equal(refusAVenir(VOIE_SURFACE[1]!), null);
  for (const e of [...VOIE_SURFACE, ...VOIE_CREUSEE]) assert.equal("phase" in e, false, e.id);
});
