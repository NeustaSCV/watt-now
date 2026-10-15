// 0.10 : la jauge du coup appuyé autour du bouton A. Elle suit la charge de A : 0 au repos, à moitié à 175 ms, pleine
// (« coup à la tête prêt ») à DUREE_APPUI_MS, vide dès qu'on lâche, et aussi quand le système reprend le doigt
// (`pointercancel` sur iPhone). Le jugement court / long au relâchement ne change pas.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_APPUI_MS } from "../../commun/src/combat.ts";
import { AppuiTenu, brancherBoutonTenu, etatJaugeCoup } from "./jauge-coup.ts";

/** Un bouton factice (une cible d'évènements), branché comme le bouton A du HUD, sur une horloge qu'on avance à la main. */
function boutonA() {
  let t = 1000;
  const appui = new AppuiTenu(() => t);
  const jugements: string[] = [];
  const bouton = Object.assign(new EventTarget(), { captures: [] as number[], setPointerCapture(id: number) { this.captures.push(id); } });
  brancherBoutonTenu(bouton, {
    appuyer: () => void appui.appuyer(),
    relacher: () => {
      const j = appui.relacher();
      if (j) jugements.push(j);
    },
  });
  const pointeur = (type: string) => {
    const e = new Event(type, { cancelable: true });
    Object.assign(e, { pointerId: 7 });
    bouton.dispatchEvent(e);
    return e;
  };
  return { appui, bouton, jugements, pointeur, avancer: (ms: number) => void (t += ms), jauge: () => etatJaugeCoup(appui.charge) };
}

test("au repos, la jauge est vide ; à moitié à 175 ms ; pleine et « prête » à 350 ms, pas au-delà", () => {
  const a = boutonA();
  assert.deepEqual(a.jauge(), { part: 0, pret: false });
  const bas = a.pointeur("pointerdown");
  assert.ok(bas.defaultPrevented, "l'appui ne fait rien d'autre (ni sélection ni défilement)");
  assert.deepEqual(a.bouton.captures, [7], "le pointeur est capturé : le relâchement revient au bouton");
  assert.deepEqual(a.jauge(), { part: 0, pret: false });
  a.avancer(DUREE_APPUI_MS / 2);
  assert.deepEqual(a.jauge(), { part: 0.5, pret: false });
  a.avancer(DUREE_APPUI_MS / 2 - 1);
  assert.equal(a.jauge().pret, false, "pas encore : à 349 ms");
  a.avancer(1);
  assert.deepEqual(a.jauge(), { part: 1, pret: true });
  a.avancer(2000);
  assert.deepEqual(a.jauge(), { part: 1, pret: true });
});

test("relâchée, la jauge se vide aussitôt ; le coup se juge comme avant (court, appuyé)", () => {
  const a = boutonA();
  a.pointeur("pointerdown");
  a.avancer(200);
  a.pointeur("pointerup");
  assert.deepEqual(a.jauge(), { part: 0, pret: false });
  a.pointeur("pointerdown");
  a.avancer(DUREE_APPUI_MS);
  a.pointeur("pointerup");
  // La capture perdue qui suit le relâchement ne juge pas une seconde fois.
  a.pointeur("lostpointercapture");
  assert.deepEqual(a.jauge(), { part: 0, pret: false });
  assert.deepEqual(a.jugements, ["court", "long"]);
});

test("le système reprend le doigt (pointercancel, capture perdue) : la jauge se vide, rien ne reste enfoncé", () => {
  const a = boutonA();
  a.pointeur("pointerdown");
  a.avancer(120);
  a.pointeur("pointercancel");
  assert.deepEqual(a.jauge(), { part: 0, pret: false });
  assert.equal(a.appui.tenu, false);
  // L'appui suivant recommence la charge de zéro (avant, un relâchement perdu aurait bloqué A).
  a.pointeur("pointerdown");
  assert.equal(a.jauge().part, 0);
  a.avancer(DUREE_APPUI_MS);
  a.pointeur("lostpointercapture");
  assert.deepEqual(a.jauge(), { part: 0, pret: false });
  assert.deepEqual(a.jugements, ["court", "long"]);
});

test("sur iPhone, l'appui long n'ouvre ni loupe ni menu : le touchstart et le menu du bouton sont retenus", () => {
  const a = boutonA();
  assert.ok(a.pointeur("touchstart").defaultPrevented);
  assert.ok(a.pointeur("contextmenu").defaultPrevented);
});

test("un second appui pendant le premier ne recommence pas la charge", () => {
  const a = boutonA();
  a.pointeur("pointerdown");
  a.avancer(300);
  a.pointeur("pointerdown");
  a.avancer(DUREE_APPUI_MS - 300);
  assert.equal(a.jauge().pret, true);
});
