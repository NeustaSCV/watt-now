// La page d'écoute des effets (développement) : chaque son du catalogue, chaque variante, au niveau du mélange.

import { SONS, fabriquer, type DefSon, type IdSon } from "./catalogue.ts";
import { FE } from "./dsp.ts";

const GROUPES: [string, (id: string) => boolean][] = [
  ["Éteints", (id) => id.startsWith("eteint_")],
  ["Contact et combat", (id) => ["saisie", "morsure", "morsure_manquee", "impact", "impact_appuye", "coup_tete", "chute_corps", "sifflement", "sifflement_lourd", "esquive", "degagement", "coeur", "effondrement"].includes(id)],
  ["Pas du joueur", (id) => id.startsWith("pas_")],
  ["Feu et installations", (id) => ["buche_tombe", "extinction", "feu_crepite", "forge_attisee", "braises", "trempe", "chaine_velo", "roue_libre", "meule", "pinces", "bourdonnement", "interrupteur", "briquet", "pierre_a_feu"].includes(id)],
  ["Météo", (id) => id === "pluie" || id === "tonnerre"],
  ["Interface", (id) => id.startsWith("ui_")],
  ["Gestes et outils", () => true],
];

let ctx: AudioContext | null = null;
const enCours = new Map<string, AudioBufferSourceNode>();

function jouer(id: IdSon, v: number, bouton: HTMLButtonElement): void {
  ctx ??= new AudioContext();
  const cle = `${id}#${v}`;
  const deja = enCours.get(cle);
  if (deja) {
    deja.stop();
    return;
  }
  const def: DefSon = SONS[id];
  const s = fabriquer(id, v);
  const b = ctx.createBuffer(1, s.length, FE);
  b.getChannelData(0).set(s);
  const src = ctx.createBufferSource();
  src.buffer = b;
  src.loop = Boolean(def.boucle);
  const g = ctx.createGain();
  g.gain.value = def.gain;
  src.connect(g).connect(ctx.destination);
  src.start();
  enCours.set(cle, src);
  bouton.classList.add("joue");
  src.onended = () => {
    enCours.delete(cle);
    bouton.classList.remove("joue");
  };
}

const racine = document.getElementById("sons")!;
const restants = new Set(Object.keys(SONS) as IdSon[]);
for (const [titre, filtre] of GROUPES) {
  const ids = [...restants].filter(filtre);
  if (ids.length === 0) continue;
  const section = document.createElement("section");
  section.innerHTML = `<h2>${titre}</h2><div class="grille"></div>`;
  const grille = section.querySelector(".grille")!;
  for (const id of ids) {
    restants.delete(id);
    const def: DefSon = SONS[id];
    const carte = document.createElement("div");
    carte.className = "son";
    const portee = def.portee > 0 ? `portée ${def.portee} m` : "sur soi";
    carte.innerHTML = `<strong>${id}</strong><small>${def.bus} · P${def.priorite} · ${portee}${def.boucle ? " · en boucle" : ""}</small><div class="variantes"></div>`;
    const variantes = carte.querySelector(".variantes")!;
    for (let v = 0; v < def.variantes; v++) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = String(v + 1);
      b.title = `Variante ${v + 1}`;
      b.addEventListener("click", () => jouer(id, v, b));
      variantes.append(b);
    }
    grille.append(carte);
  }
  racine.append(section);
}
