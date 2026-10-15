// Le guidage du niveau 2 (0.10 ; .claude-travail/guidage-0.10.md) : chaque phrase se dit au bon endroit, dans le bon
// état, une seule fois par visite (et de nouveau à la visite suivante) ; chaque écriteau propose « Lire » et montre son
// texte ; aucun texte ne dit « clé ».

import { test } from "node:test";
import assert from "node:assert/strict";
import { ECART_LIGNES_MS, Guidage } from "./guidage.ts";
import { DECLENCHEURS, ECRITEAUX, PORTEE_ECRITEAU, arriveeDuCoteDuLieu, type GenreGuidage } from "../../commun/src/guidage.ts";
import { BARRICADE, PIN_TOMBE, RUBAN, SORTIES_CORNICHE, aLaCorniche } from "../../commun/src/corniche.ts";
import { ASCENSEUR, BALCON, BORNE, CARTE, PANNEAU, etatHotelNeuf, jeuHotel, type EtatHotel } from "../../commun/src/hotel.ts";
import { heurte, zoneDe, type LieuId } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { TEXTES_PEAGE } from "../../commun/src/peage.ts";
import { ENDROITS_PHARE, jeu as auPhare, type EtatPhareVu } from "../../commun/src/phare.ts";
import { DUREE_MAREE_MS, ECHELLE_MAREE, PORTE_PEAGE, SORTIES_ROUTE_PONT, auPont } from "../../commun/src/route-pont.ts";
import type { Propositions } from "./interaction.ts";

type Point = { x: number; z: number };

/** Un écran factice : ce que le guidage a dit, l'heure qui avance. */
function ecran() {
  const dits: { texte: string; genre: GenreGuidage }[] = [];
  const g = new Guidage((texte, genre) => dits.push({ texte, genre }));
  let instant = 1_000_000;
  let lieu: LieuId = "terrain";
  const inventaire: Inventaire = {};
  return {
    g,
    dits,
    inventaire,
    /** On arrive dans ce lieu, à cette place (une nouvelle visite). */
    arriver(l: LieuId, p: Point) {
      lieu = l;
      g.recevoir({ t: "bienvenue", lieu: l, position: { ...p, o: 0 } } as MessageServeur);
    },
    recevoir(m: MessageServeur) {
      g.recevoir(m);
    },
    /** On se tient là `ms` millisecondes (une image toutes les 100 ms), avec ce début du monde (la marée). */
    rester(p: Point, ms = ECART_LIGNES_MS * 4, debutMonde = 0) {
      for (let t = 0; t <= ms; t += 100) {
        g.suivre(lieu, p, instant, debutMonde, inventaire);
        instant += 100;
      }
    },
    get instant() {
      return instant;
    },
    /** Les textes dits jusqu'ici. */
    textes(): string[] {
      return dits.map((d) => d.texte);
    },
  };
}

const ligne = (id: string, i = 0) => DECLENCHEURS.find((d) => d.id === id)!.lignes[i]!.texte;
const loin: Point = { x: 1, z: 1 };

// Les arrivées du terrain et du lieu, à la route du pont et à la corniche.
const arriveePont = SORTIES_ROUTE_PONT[0]!.arrivee;
const arriveePontRetour = SORTIES_ROUTE_PONT[1]!.arrivee;
const arriveeCorniche = SORTIES_CORNICHE[0]!.arrivee;
const arriveeCornicheRetour = SORTIES_CORNICHE[1]!.arrivee;

/** Une marée basse, une marée haute (un début du monde qui les donne à l'instant de l'écran). */
const debutPour = (instant: number, haute: boolean) => instant - (haute ? DUREE_MAREE_MS : 0) - 1000;

test("guidage : on sait d'où l'on arrive dans une halte (le retour : du côté du lieu)", () => {
  assert.equal(arriveeDuCoteDuLieu("route_pont", arriveePont.x, arriveePont.z), false);
  assert.equal(arriveeDuCoteDuLieu("route_pont", arriveePontRetour.x, arriveePontRetour.z), true);
  assert.equal(arriveeDuCoteDuLieu("corniche", arriveeCorniche.x, arriveeCorniche.z), false);
  assert.equal(arriveeDuCoteDuLieu("corniche", arriveeCornicheRetour.x, arriveeCornicheRetour.z), true);
  assert.equal(arriveeDuCoteDuLieu("grand_hotel", 0, 0), false);
});

test("P-01 : à 8 m de la chicane, à l'aller, pas encore payé ; une fois par visite, de nouveau à la suivante", () => {
  const e = ecran();
  const chicane = { x: PORTE_PEAGE.x, z: PORTE_PEAGE.z };
  e.arriver("route_pont", arriveePont);
  e.recevoir({ t: "passage", passage: "pont", ouvert: false, du: 12 });
  e.rester({ x: chicane.x - 9, z: chicane.z });
  assert.ok(!e.textes().includes(TEXTES_PEAGE.pont.approche), "à 9 m, rien");
  e.rester({ x: chicane.x - 7.5, z: chicane.z });
  assert.deepEqual(e.dits.filter((d) => d.texte === TEXTES_PEAGE.pont.approche), [{ texte: TEXTES_PEAGE.pont.approche, genre: "voix" }]);
  assert.equal(TEXTES_PEAGE.pont.approche, "La voix d'en haut : « Halte ! Douze wotts d'objets dans la caisse, et tu passes. »");
  // On s'éloigne, on revient : rien de plus.
  e.rester(loin);
  e.rester({ x: chicane.x - 7.5, z: chicane.z });
  assert.equal(e.textes().filter((t) => t === TEXTES_PEAGE.pont.approche).length, 1);
  // Une nouvelle visite : de nouveau.
  e.arriver("route_pont", arriveePont);
  e.rester({ x: chicane.x - 7.5, z: chicane.z });
  assert.equal(e.textes().filter((t) => t === TEXTES_PEAGE.pont.approche).length, 2);
});

test("P-01 ne se dit pas au retour (P-03 à sa place) ni après paiement", () => {
  const chicane = { x: PORTE_PEAGE.x, z: PORTE_PEAGE.z };
  const retour = ecran();
  retour.arriver("route_pont", arriveePontRetour);
  retour.recevoir({ t: "passage", passage: "pont", ouvert: true, du: 0 });
  retour.rester({ x: chicane.x + 6, z: chicane.z });
  assert.ok(!retour.textes().includes(TEXTES_PEAGE.pont.approche));
  assert.deepEqual(retour.textes(), [TEXTES_PEAGE.pont.dejaPaye], "P-03 : « C'est bon pour toi. Passe. »");
  // Même si le serveur dit la porte fermée (l'heure passée), le retour reste libre : pas de « Halte ! ».
  const retour2 = ecran();
  retour2.arriver("route_pont", arriveePontRetour);
  retour2.recevoir({ t: "passage", passage: "pont", ouvert: false, du: 12 });
  retour2.rester({ x: chicane.x + 6, z: chicane.z });
  assert.ok(!retour2.textes().includes(TEXTES_PEAGE.pont.approche));

  const paye = ecran();
  paye.arriver("route_pont", arriveePont);
  paye.recevoir({ t: "passage", passage: "pont", ouvert: true, du: 0 });
  paye.rester({ x: chicane.x - 6, z: chicane.z }, 30_000);
  assert.deepEqual(paye.textes(), [], "payé dans l'heure, à l'aller : ni « Halte ! », ni l'attente, ni le retour");
});

test("P-02 : vingt secondes devant la chicane fermée, sans payer ; pas avant", () => {
  const e = ecran();
  const devant = { x: PORTE_PEAGE.x - 3, z: PORTE_PEAGE.z };
  e.arriver("route_pont", arriveePont);
  e.recevoir({ t: "passage", passage: "pont", ouvert: false, du: 12 });
  e.rester(devant, 19_000);
  assert.ok(!e.textes().includes(TEXTES_PEAGE.pont.attente), "19 s : pas encore");
  // On s'écarte un instant : l'attente repart de zéro.
  e.rester(loin, 200);
  e.rester(devant, 15_000);
  assert.ok(!e.textes().includes(TEXTES_PEAGE.pont.attente), "l'attente recommence quand on s'en va");
  e.rester(devant, 8000);
  assert.ok(e.textes().includes(TEXTES_PEAGE.pont.attente));
  assert.equal(TEXTES_PEAGE.pont.attente, "La voix : « Mets les objets dans la caisse, au pied du poste. »");
  // Payé entre-temps : plus rien.
  const p = ecran();
  p.arriver("route_pont", arriveePont);
  p.recevoir({ t: "passage", passage: "pont", ouvert: false, du: 12 });
  p.rester(devant, 10_000);
  p.recevoir({ t: "passage", passage: "pont", ouvert: true, du: 0 });
  p.rester(devant, 30_000);
  assert.ok(!p.textes().includes(TEXTES_PEAGE.pont.attente));
});

test("P-04 : au bord de la brèche, d'un côté comme de l'autre", () => {
  for (const bord of [auPont(1.6, -4.75), auPont(8.4, -4.75)]) {
    const e = ecran();
    e.arriver("route_pont", arriveePont);
    e.rester({ x: bord.x + (bord.x < 105 ? -2.5 : 2.5), z: bord.z });
    assert.deepEqual(e.dits, [{ texte: "Des planches au-dessus du vide. Allons-y doucement.", genre: "pensee" }]);
  }
});

test("P-05 et P-06 suivent la marée, près de l'échelle", () => {
  // L'échelle est à quelques mètres du péage : on ne regarde que les pensées de la marée.
  const maree = (e: ReturnType<typeof ecran>) => e.textes().filter((t) => t === ligne("P-05") || t === ligne("P-06"));
  const pres = { x: ECHELLE_MAREE.x, z: ECHELLE_MAREE.z - 4 };
  const haute = ecran();
  haute.arriver("route_pont", arriveePont);
  haute.rester(pres, 3000, debutPour(haute.instant, true));
  assert.deepEqual(maree(haute), [ligne("P-05")]);
  assert.equal(ligne("P-05"), "La mer est haute. À marée basse, la vase doit se découvrir.");
  const basse = ecran();
  basse.arriver("route_pont", arriveePont);
  basse.rester(pres, 3000, debutPour(basse.instant, false));
  assert.deepEqual(maree(basse), [ligne("P-06")]);
  assert.equal(ligne("P-06"), "La vase est découverte : des caddies, des trottinettes… de quoi récupérer.");
  // Loin de l'échelle : rien.
  const loinE = ecran();
  loinE.arriver("route_pont", arriveePont);
  loinE.rester({ x: ECHELLE_MAREE.x, z: ECHELLE_MAREE.z - 7 }, 3000, debutPour(loinE.instant, true));
  assert.deepEqual(maree(loinE), []);
});

test("P-07 et P-08 : la barricade du tunnel, à l'aller, sans payer (20 s pour la seconde voix)", () => {
  const e = ecran();
  e.arriver("corniche", arriveeCorniche);
  e.recevoir({ t: "passage", passage: "tunnel", ouvert: false, du: 12 });
  e.rester({ x: BARRICADE.x - 7, z: BARRICADE.z }, 3000);
  assert.deepEqual(e.dits, [{ texte: TEXTES_PEAGE.tunnel.approche, genre: "voix" }]);
  assert.equal(TEXTES_PEAGE.tunnel.approche, "Une voix derrière les sacs de sable : « Douze wotts d'objets dans la caisse, ou demi-tour. »");
  e.rester({ x: BARRICADE.x - 3, z: BARRICADE.z }, 18_000);
  assert.ok(!e.textes().includes(TEXTES_PEAGE.tunnel.attente));
  e.rester({ x: BARRICADE.x - 3, z: BARRICADE.z }, 3000);
  assert.ok(e.textes().includes(TEXTES_PEAGE.tunnel.attente));
  assert.equal(TEXTES_PEAGE.tunnel.attente, "La voix : « La caisse est là, à tes pieds. On n'a pas toute la nuit. »");
  // Sur le retour (du phare) : rien.
  const r = ecran();
  r.arriver("corniche", arriveeCornicheRetour);
  r.recevoir({ t: "passage", passage: "tunnel", ouvert: false, du: 12 });
  r.rester({ x: BARRICADE.x + 3, z: BARRICADE.z }, 25_000);
  assert.deepEqual(r.textes(), []);
});

test("P-09 et P-10 : le pin tombé, l'éboulement (par un bout ou par l'autre)", () => {
  const e = ecran();
  e.arriver("corniche", arriveeCorniche);
  e.rester({ x: PIN_TOMBE.x + 8, z: PIN_TOMBE.z });
  assert.deepEqual(e.textes(), ["Un pin d'Alep couché en travers de la route. De quoi faire du bois."]);
  for (const x of [RUBAN.x0 - 3, RUBAN.x1 + 3]) {
    const f = ecran();
    f.arriver("corniche", arriveeCorniche);
    f.rester({ x, z: aLaCorniche(0, -3.6).z });
    assert.deepEqual(f.textes(), ["La route s'est effondrée. Il reste un ruban le long de la paroi."]);
  }
});

const hotel = (e: Partial<EtatHotel> = {}): MessageServeur => ({ t: "hotel", hotel: { ...etatHotelNeuf(), ...e } });

test("Le Grand Hôtel : le hall, l'ascenseur sans carte, la borne éteinte, la batterie, la salle à manger, l'étage, le balcon", () => {
  const cas: [string, Point, Partial<EtatHotel>?][] = [
    ["P-11", jeuHotel(2, -12)],
    ["P-12", { x: ASCENSEUR.bas.grille.x, z: ASCENSEUR.bas.grille.z + 1.5 }],
    ["P-13", { x: BORNE.x + 1, z: BORNE.z + 1 }],
    ["P-14", { x: PANNEAU.x - 2, z: PANNEAU.z + 2 }],
    ["P-16", jeuHotel(-9.2, -7)],
    ["P-17", jeuHotel(-8, -26.3)],
    ["P-18", { x: BALCON.boite.x, z: BALCON.boite.z - 2 }],
  ];
  for (const [id, p] of cas) {
    const e = ecran();
    e.recevoir(hotel());
    e.arriver("grand_hotel", jeuHotel(0, 15));
    e.rester(p);
    assert.ok(e.g.dejaJoues.has(id), `${id} à sa place`);
    assert.ok(e.textes().includes(ligne(id)), id);
    assert.equal(e.dits.find((d) => d.texte === ligne(id))!.genre, "pensee");
  }
});

test("Le Grand Hôtel : chaque pensée suit l'état du check-in", () => {
  // La carte en poche : l'ascenseur ne fait pas penser au lecteur.
  const carte = ecran();
  carte.recevoir(hotel());
  carte.arriver("grand_hotel", jeuHotel(0, 15));
  carte.inventaire[CARTE] = 1;
  carte.rester({ x: ASCENSEUR.bas.grille.x, z: ASCENSEUR.bas.grille.z + 1.5 });
  assert.ok(!carte.g.dejaJoues.has("P-12"));
  // La batterie partie du panneau : pas de « Une batterie au pied du panneau ».
  const partie = ecran();
  partie.recevoir(hotel({ batterie: "borne" }));
  partie.arriver("grand_hotel", jeuHotel(0, 15));
  partie.rester({ x: PANNEAU.x - 2, z: PANNEAU.z + 2 });
  assert.ok(!partie.g.dejaJoues.has("P-14"));
  // La borne allumée, sans la tête : la voix de la borne, puis la pensée (P-15), et plus « pas de courant » (P-13).
  const allumee = ecran();
  allumee.recevoir(hotel({ batterie: "borne" }));
  allumee.arriver("grand_hotel", jeuHotel(0, 15));
  allumee.rester({ x: BORNE.x + 1, z: BORNE.z + 1 }, ECART_LIGNES_MS * 3);
  assert.ok(!allumee.g.dejaJoues.has("P-13"));
  const fin = allumee.dits.slice(-2);
  assert.deepEqual(fin, [
    { texte: "La borne : « Sourire non reconnu. Veuillez sourire davantage. »", genre: "voix" },
    { texte: "Elle ne reconnaît que le personnel, on dirait.", genre: "pensee" },
  ]);
  // La tête déjà sur la borne : plus de P-15.
  const tete = ecran();
  tete.recevoir(hotel({ batterie: "borne", tete: "borne", degage: true }));
  tete.arriver("grand_hotel", jeuHotel(0, 15));
  tete.rester({ x: BORNE.x + 1, z: BORNE.z + 1 });
  assert.ok(!tete.g.dejaJoues.has("P-15") && !tete.g.dejaJoues.has("P-13"));
});

const phare = (e: Partial<EtatPhareVu> = {}, plus: { cargo?: true } = {}): MessageServeur => ({
  t: "phare",
  etat: { escabeau: "hangar", bidon: "cuve", prisme: "tombe", lanterne: false, compresseur: false, corneSonnee: false, ...e },
  ...plus,
});
const arriveePhare = { x: auPhare(-1.5, -12).x, z: auPhare(-1.5, -12).z };

test("Le phare : l'arrivée, l'escalier coupé, la cuve, le compresseur, le haut de la rampe", () => {
  const e = ecran();
  e.recevoir(phare());
  e.arriver("phare", arriveePhare);
  e.rester(arriveePhare, 3000);
  assert.deepEqual(e.textes(), ["Le phare du Cap. La lanterne est éteinte depuis longtemps."]);
  const cas: [string, Point][] = [
    ["P-20", { x: ENDROITS_PHARE.marque.x + 1, z: ENDROITS_PHARE.marque.z }],
    ["P-22", { x: ENDROITS_PHARE.cuve.x + 1.5, z: ENDROITS_PHARE.cuve.z }],
    ["P-25", { x: ENDROITS_PHARE.compresseur.x - 2, z: ENDROITS_PHARE.compresseur.z }],
    ["P-27", auPhare(-24, 13.6)],
  ];
  for (const [id, p] of cas) {
    const f = ecran();
    f.recevoir(phare());
    f.arriver("phare", arriveePhare);
    f.rester(p);
    assert.ok(f.textes().includes(ligne(id)), id);
  }
  // Dehors, contre le mur de la tour, à 2,4 m de la marque : on ne voit pas l'escalier, on n'y pense pas.
  const dehors = ecran();
  dehors.recevoir(phare());
  dehors.arriver("phare", arriveePhare);
  dehors.rester({ x: 18.25, z: 14.35 });
  assert.ok(!dehors.g.dejaJoues.has("P-20"));
  // L'escabeau sous l'escalier, le compresseur réparé : plus de pensée.
  const fait = ecran();
  fait.recevoir(phare({ escabeau: "marque", compresseur: true }));
  fait.arriver("phare", arriveePhare);
  fait.rester({ x: ENDROITS_PHARE.marque.x + 1, z: ENDROITS_PHARE.marque.z });
  fait.rester({ x: ENDROITS_PHARE.compresseur.x - 2, z: ENDROITS_PHARE.compresseur.z });
  assert.ok(!fait.g.dejaJoues.has("P-20") && !fait.g.dejaJoues.has("P-25"));
  // Une lanterne déjà allumée à l'arrivée : pas de « éteinte depuis longtemps ».
  const allume = ecran();
  allume.recevoir(phare({ lanterne: true }));
  allume.arriver("phare", arriveePhare);
  allume.rester(arriveePhare, 3000);
  assert.ok(!allume.g.dejaJoues.has("P-19"));
});

test("P-21 : à 6 m du prisme, seulement tant qu'il est tombé", () => {
  const pres = { x: ENDROITS_PHARE.prisme.x + 5, z: ENDROITS_PHARE.prisme.z };
  const tombe = ecran();
  tombe.recevoir(phare());
  tombe.arriver("phare", arriveePhare);
  tombe.rester({ x: ENDROITS_PHARE.prisme.x + 7, z: ENDROITS_PHARE.prisme.z });
  assert.ok(!tombe.g.dejaJoues.has("P-21"), "à 7 m, rien");
  tombe.rester(pres);
  assert.ok(tombe.textes().includes("Quelque chose brille dans l'herbe, au pied de la tour."));
  for (const prisme of ["main", "remis"] as const) {
    const ramasse = ecran();
    ramasse.recevoir(phare({ prisme }));
    ramasse.arriver("phare", arriveePhare);
    ramasse.rester(pres);
    assert.ok(!ramasse.g.dejaJoues.has("P-21"), prisme);
  }
});

test("P-24 et P-26 : l'allumage pendant qu'on est là, l'arrivée du cargo ; une fois par visite", () => {
  const e = ecran();
  e.recevoir(phare());
  e.arriver("phare", arriveePhare);
  e.rester(arriveePhare, 3000);
  e.recevoir(phare({ bidon: "verse", prisme: "remis", lanterne: true }));
  e.recevoir(phare({ bidon: "verse", prisme: "remis", lanterne: true }));
  e.rester(arriveePhare, 3000);
  assert.equal(e.textes().filter((t) => t === ligne("P-24")).length, 1);
  e.recevoir(phare({ bidon: "verse", prisme: "remis", lanterne: true }, { cargo: true }));
  e.rester(arriveePhare, 3000);
  assert.ok(e.textes().includes("Une corne grave, au large. Un cargo… droit sur les rochers !"));
  // Arrivé la lanterne déjà allumée : pas d'« allumage ».
  const f = ecran();
  f.recevoir(phare({ lanterne: true }));
  f.arriver("phare", arriveePhare);
  f.recevoir(phare({ lanterne: true }));
  f.rester(arriveePhare, 3000);
  assert.ok(!f.g.dejaJoues.has("P-24"));
});

test("Les lignes attendent leur tour : une toutes les 2,5 s, dans l'ordre", () => {
  const e = ecran();
  e.recevoir(hotel({ batterie: "borne" }));
  e.arriver("grand_hotel", jeuHotel(0, 15));
  e.rester({ x: BORNE.x + 1, z: BORNE.z + 1 }, 100);
  assert.equal(e.dits.length, 1, "la première ligne tout de suite (le hall, ou la borne)");
  e.rester({ x: BORNE.x + 1, z: BORNE.z + 1 }, ECART_LIGNES_MS - 300);
  assert.equal(e.dits.length, 1, "la suivante attend");
  e.rester({ x: BORNE.x + 1, z: BORNE.z + 1 }, ECART_LIGNES_MS * 3);
  assert.ok(e.dits.length >= 3);
});

const rien: Propositions = { A: null, B: null, cible: null };

test("Chaque écriteau propose « Lire » sur B et montre son texte ; A reste ce qu'il était", () => {
  const g = new Guidage(() => {});
  for (const ec of ECRITEAUX) {
    for (const p of ec.points) {
      const prop = g.proposer(ec.lieu, { x: p.x + ec.rayon + 0.5, z: p.z }, rien);
      assert.ok(prop.B && "examiner" in prop.B, ec.id);
      assert.equal(prop.B.libelle, "Lire", ec.id);
      assert.equal(prop.B.examiner, ec.texte, ec.id);
      assert.equal(prop.B.lire, true, ec.id);
      assert.ok(prop.cible, `${ec.id} : le cercle sur l'écriteau`);
    }
    // Trop loin : rien.
    const p = ec.points[0]!;
    assert.equal(g.proposer(ec.lieu, { x: p.x + ec.rayon + PORTEE_ECRITEAU + 0.5, z: p.z + 30 }, rien), rien, ec.id);
  }
  // Ailleurs que dans son lieu : rien.
  const e1 = ECRITEAUX.find((e) => e.id === "E-01")!;
  assert.equal(g.proposer("corniche", e1.points[0]!, rien), rien);
  // Devant la porte du péage : A paie toujours, B lit le panneau (le même geste qu'Examiner, un autre libellé).
  const payer: Propositions = { A: { libelle: "Payer le péage", ouvrirCaisse: "pont" }, B: { libelle: "Examiner", examiner: TEXTES_PEAGE.pont.ferme }, cible: { x: PORTE_PEAGE.x, z: PORTE_PEAGE.z, rayon: 0.9 } };
  const devant = g.proposer("route_pont", { x: PORTE_PEAGE.x - 1.2, z: PORTE_PEAGE.z }, payer);
  assert.equal(devant.A, payer.A);
  assert.ok(devant.B && "examiner" in devant.B);
  assert.equal(devant.B.examiner, "« PÉAGE · 12 WOTTS / TÊTE · DANS LA CAISSE ↓ · UN À LA FOIS ! »");
  // Quelque chose de nettement plus près (la batterie, au pied du panneau Zéro-Effort) garde son Examiner.
  const batterie: Propositions = { A: { libelle: "Prendre la batterie", examiner: "" }, B: { libelle: "Examiner", examiner: "batterie" }, cible: { x: PANNEAU.x, z: PANNEAU.z, rayon: 0.4 } };
  assert.equal(g.proposer("grand_hotel", { x: PANNEAU.x + 0.3, z: PANNEAU.z - 0.3 }, batterie), batterie);
});

test("Les textes exacts des écriteaux (G-2)", () => {
  const t = Object.fromEntries(ECRITEAUX.map((e) => [e.id, e.texte]));
  assert.deepEqual(t, {
    "E-01": "« PÉAGE · 12 WOTTS / TÊTE · DANS LA CAISSE ↓ · UN À LA FOIS ! »",
    "E-02": "« PONT CONNECTÉ · votre passage est optimisé en temps réel · trafic : 0 véhicule · attente : 0 min »",
    // 0.10 (R52) : les panneaux de sortie disent la vraie destination (E-04 ne dit plus « Port de pêche » ; textes à valider).
    "E-04": "« ← Ton terrain · 3 km · Phare du cap, par le tunnel → »",
    "E-13": "« Phare du cap · 2 km → · ← La corniche, ton terrain »",
    "E-14": "« ← Ton terrain · 3 km · Grand Hôtel des Flots, par le pont → »",
    "E-15": "« Grand Hôtel des Flots · 2 km → · ← Le pont, ton terrain »",
    "E-16": "« Route du pont → · Ton terrain, par le pont · 5 km »",
    "E-17": "« ← La corniche · Ton terrain »",
    "E-05": "« CORNICHE PANORAMIQUE · VUE CERTIFIÉE 5 ÉTOILES · Selfie-points tous les 200 m »",
    "E-06": "« CHECK-IN PAR SOURIRE »",
    "E-07": "« SÉJOUR ZÉRO-EFFORT · On respire pour vous. · Repas mâchés · Bronzage par abonnement »",
    "E-08": "« Baignade interdite aux chiens ET AUX ÉTEINTS »",
    "E-09": "« Journal de bord · Rallumé quand même. »",
    "E-10": "« ÉTEINS LA LANTERNE ! ILS VOIENT LA LUMIÈRE »",
    "E-11": "« PHARE DU CAP · allumé en 1883 »",
    // 0.10 (essai sur l'iPhone du 2026-10-15) : le panneau du sentier côtier, à la sortie de la grève.
    "E-12": "« Sentier côtier · ← Port · 6 km »",
  });
});

test("Toutes les phrases P-01 à P-28 sont là (sauf P-23, déjà en jeu), et aucune ne dit « clé »", () => {
  const ids = DECLENCHEURS.map((d) => d.id);
  // P-28 (0.10, essai sur l'iPhone du 2026-10-15) : sur les galets, par où l'on ressort.
  const attendus = Array.from({ length: 28 }, (_, i) => `P-${String(i + 1).padStart(2, "0")}`).filter((id) => id !== "P-23");
  assert.deepEqual([...ids].sort(), attendus);
  const tous = [...DECLENCHEURS.flatMap((d) => d.lignes.map((l) => l.texte)), ...ECRITEAUX.map((e) => e.texte)];
  for (const t of tous) assert.doesNotMatch(t, /\bcl[ée]s?\b/i, t);
  // Les pensées n'ont ni guillemets ni astérisques ; les voix et les écriteaux ont leurs guillemets.
  for (const d of DECLENCHEURS) for (const l of d.lignes) if (l.genre === "voix") assert.match(l.texte, /«.*»/, d.id);
  for (const d of DECLENCHEURS) for (const l of d.lignes) assert.doesNotMatch(l.texte, /\*/, d.id);
});

test("Chaque écriteau et chaque endroit du guidage se rejoignent à pied (au moins un point libre à portée)", () => {
  const libreAutour = (lieu: LieuId, p: Point, portee: number) => {
    const zone = zoneDe(lieu);
    for (let r = 0; r <= portee; r += 0.25)
      for (let a = 0; a < 2 * Math.PI; a += Math.PI / 12) {
        const x = p.x + r * Math.cos(a);
        const z = p.z + r * Math.sin(a);
        if (x > zone.xMin && x < zone.xMax && z > zone.zMin && z < zone.zMax && !heurte(zone, x, z, 0.3)) return true;
      }
    return false;
  };
  for (const e of ECRITEAUX) for (const p of e.points) assert.ok(libreAutour(e.lieu, p, e.rayon + PORTEE_ECRITEAU), e.id);
  for (const d of DECLENCHEURS) for (const p of d.points ?? []) assert.ok(libreAutour(d.lieu, p, d.rayon ?? 0), d.id);
});
