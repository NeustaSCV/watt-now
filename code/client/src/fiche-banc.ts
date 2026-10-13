// La fiche du banc de recharge (0.8.2, chantier C : R17) : le banc fait passer l'énergie de sa batterie vers ce qu'on
// porte. Dans la fiche (jamais une fenêtre à part) : la batterie du banc, nommée, son niveau, ce qui la remplit, et le
// bouton pour l'échanger ; puis une ligne par chose qu'on porte et qui se charge, nommée, avec son niveau et « Charger ».
// hud.ts n'en fait qu'un appel (le html) et un branchement (les boutons) ; le serveur juge tout (serveur/src/electricite.ts).

import { chosesACharger, pleine, type CibleCharge } from "../../commun/src/banc.ts";
import { BATTERIES_DE_BANC, PORTEE_PEDALIER_BANC, RENDEMENT_BANC, WH_RECHARGE_PAR_HEURE, batterieDuBanc, type Charges } from "../../commun/src/energie.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";
import type { InstallationVue } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";

/** Ce que la fiche du banc envoie : charger une chose, échanger la batterie, la remplir à la manivelle. */
export type GesteBanc = { op: "charger"; cible: CibleCharge } | { op: "echanger" } | { op: "manivelle" };

function nb(x: number): string {
  return String(Math.round(x * 10) / 10).replace(".", ",");
}

function majuscule(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Une barre de niveau, comme celle du sac. */
function niveau(wh: number, capacite: number): string {
  const pct = capacite > 0 ? Math.max(0, Math.min(100, Math.round((wh / capacite) * 100))) : 0;
  return `<span class="charge-batterie"><span class="charge-barre"><span style="width:${pct}%"></span></span> ${nb(wh)} / ${nb(capacite)} Wh</span>`;
}

/** Le bloc du banc dans sa fiche : sa batterie, puis ce qu'on porte et qui se charge. */
export function htmlFicheBanc(i: InstallationVue, inventaire: Inventaire, charges: Charges, chargeArmes: Partial<Record<CleObjet, number>>): string {
  const bat = batterieDuBanc(i.etat);
  const aEchanger = BATTERIES_DE_BANC.some((b) => (inventaire[b] ?? 0) > 0);
  const remplir = [
    i.etat.panneau ? `le panneau, au soleil (${REGLAGES.panneau_wh_jour} Wh par jour)` : "le panneau, une fois posé dessus",
    `un pédalier générateur à moins de ${PORTEE_PEDALIER_BANC} m, quand on pédale`,
    "la manivelle de la lampe à dynamo, lentement",
  ].join(" ; ");
  // La manivelle (le secours lent, R17) : avec la lampe à dynamo du kit, tant que la batterie du banc n'est pas pleine.
  const manivelle = (inventaire.lampe_dynamo ?? 0) > 0;

  // La batterie du banc, à demeure.
  const batterie = bat
    ? `<article class="etape banc-batterie">
        <div class="corps"><strong>${majuscule(bat.nom)}</strong>
          ${niveau(bat.wh, bat.capacite)}
          <small>La remplissent : ${remplir}.</small>
          ${aEchanger ? "" : `<small>Pour l'échanger, il te faut une autre batterie de voiture dans ton sac.</small>`}
        </div>
        <span class="boutons-banc">
          <button type="button" class="secondaire" data-banc="echanger" ${aEchanger ? "" : "disabled"}>Échanger</button>
          ${manivelle ? `<button type="button" class="secondaire" data-banc="manivelle" ${bat.wh >= bat.capacite - 0.05 ? "disabled" : ""} title="1 Wh par minute, à la force du bras">Manivelle</button>` : ""}
        </span>
      </article>`
    : `<article class="etape banc-batterie">
        <div class="corps"><strong>Pas de batterie dans le banc</strong>
          <small>Branche la batterie de voiture de la ruine : le banc la garde, à demeure.</small>
        </div>
        <button type="button" data-verbe="poser_batteries" ${aEchanger ? "" : "disabled"}>Brancher</button>
      </article>`;

  // Ce qu'on porte et qui se charge : une ligne par chose, nommée.
  const vide = bat !== null && bat.wh * RENDEMENT_BANC < 0.25;
  const choses = chosesACharger(inventaire, charges, chargeArmes);
  const lignes = choses
    .map((c) => {
      const plein = pleine(c);
      const etat = plein ? "Pleine" : !bat ? "Pas de batterie" : vide ? "Batterie du banc vide" : "";
      return `<article class="etape banc-chose">
        <div class="corps"><strong>${c.nom}</strong>
          ${niveau(c.wh, c.capacite)}
          ${c.source ? `<small>Le courant va dans ${c.source}.</small>` : ""}
          ${etat && !plein ? `<small class="bloque">${etat}.</small>` : ""}
        </div>
        <button type="button" data-charger="${c.cible}" ${plein || !bat || vide ? "disabled" : ""}>${plein ? "Pleine" : "Charger"}</button>
      </article>`;
    })
    .join("");
  const rien = `<p class="indice">Rien sur toi ne se charge ici : la petite batterie de la frontale, une arme électrique ou une batterie de voiture, oui.</p>`;
  const rendement = `<p class="indice">${Math.round(RENDEMENT_BANC * 100)} % du courant arrive au bout des pinces ; ${WH_RECHARGE_PAR_HEURE} Wh par heure de jeu, deux minutes au plus à la fois. Ne bouge pas pendant la charge.</p>`;

  return `
    <h3>La batterie du banc</h3>
    ${batterie}
    <h3>Charger ce que tu portes</h3>
    ${choses.length ? lignes : rien}
    ${choses.length ? rendement : ""}`;
}

/** Branche les boutons du bloc du banc (les autres boutons de la fiche, `data-verbe`, sont branchés par hud.ts). */
export function brancherFicheBanc(p: HTMLElement, envoyer: (geste: GesteBanc) => void): void {
  for (const b of p.querySelectorAll<HTMLButtonElement>("[data-charger]")) b.addEventListener("click", () => envoyer({ op: "charger", cible: b.dataset.charger as CibleCharge }));
  for (const b of p.querySelectorAll<HTMLButtonElement>('[data-banc="echanger"]')) b.addEventListener("click", () => envoyer({ op: "echanger" }));
  for (const b of p.querySelectorAll<HTMLButtonElement>('[data-banc="manivelle"]')) b.addEventListener("click", () => envoyer({ op: "manivelle" }));
}
