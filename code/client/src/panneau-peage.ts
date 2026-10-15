// La caisse du péage à l'écran (plan 0.10, S-19, chantier H) : on touche la caisse, le sac s'ouvre en mode « donner ».
// C'est l'écran du coffre (le panneau `.panneau.coffre`, son en-tête et ses gestes : panneau-coffre.ts), avec à gauche
// ce qu'on porte et à droite ce qu'on met dans la caisse ; un toucher fait passer un objet d'un côté à l'autre. Le
// compteur monte jusqu'à 12 wotts (au prix de rachat du Comptoir ; ce qu'il ne reprend pas, 0 : commun/src/peage.ts) ; « Payer » envoie
// `payer_passage`. Rien ne quitte le sac avant « Payer » : le serveur décide, et la voix d'en haut répond en message.
//
// Ce module ne connaît pas le HUD : il dessine dans le panneau qu'on lui donne (hud.ts, `ouvrirCaisse`).

import { PRIX_PASSAGE, donnablePeage, valeurObjets, valeurPeage, type Passage } from "../../commun/src/peage.ts";
import { OBJETS, nommer, type Inventaire } from "../../commun/src/objets.ts";
import { typeDe, type CleObjet } from "../../commun/src/etoiles.ts";
import { brancherCoffre, enteteCoffre } from "./panneau-coffre.ts";
import { icone } from "./icones.ts";

const dixieme = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

/** Ce qu'on a mis dans la caisse, borné par ce qu'on porte encore (le sac a pu changer entre-temps). */
export function borner(caisse: Inventaire, sac: Readonly<Inventaire>): Inventaire {
  const r: Inventaire = {};
  for (const [cle, n] of Object.entries(caisse) as [CleObjet, number][]) {
    const k = Math.min(n ?? 0, sac[cle] ?? 0);
    if (k > 0) r[cle] = k;
  }
  return r;
}

/** Le contenu du panneau, en HTML (pur, pour les tests). */
export function htmlCaisse(passage: Passage, sac: Readonly<Inventaire>, caisse: Readonly<Inventaire>, attente: boolean): string {
  const reste: Inventaire = {};
  for (const [cle, n] of Object.entries(sac) as [CleObjet, number][]) {
    const k = (n ?? 0) - (caisse[cle] ?? 0);
    if (k > 0 && donnablePeage(cle)) reste[cle] = k;
  }
  const cases = (inv: Inventaire, sens: "deposer" | "prendre") =>
    (Object.keys(inv) as CleObjet[])
      .filter((c) => (inv[c] ?? 0) > 0)
      .map((c) => {
        const n = inv[c] ?? 0;
        const v = valeurPeage(c);
        const nom = OBJETS[typeDe(c)].nom;
        return `<button type="button" class="case${v <= 0 ? " sans-valeur" : ""}" data-sens="${sens}" data-objet="${c}" title="${nom} : ${v > 0 ? `${dixieme(v)} wotts` : "ne compte pas"}" aria-label="${nom}">${icone(typeDe(c))}${n > 1 ? `<span class="badge">×${n}</span>` : ""}</button>`;
      })
      .join("") || `<p class="indice">${sens === "deposer" ? "Rien à donner." : "Touche un objet de ton sac pour le mettre dans la caisse."}</p>`;
  const total = valeurObjets(caisse);
  const assez = total >= PRIX_PASSAGE;
  const compte = `<span class="nom"><strong>${dixieme(Math.min(total, 99))} / ${PRIX_PASSAGE} wotts</strong><small>${
    assez ? (total > PRIX_PASSAGE ? "Le compte y est. Rien ne sera rendu." : "Le compte y est.") : `Encore ${dixieme(PRIX_PASSAGE - total)}. Au prix du Comptoir : ce qu'il ne reprend pas ne compte pas.`
  }</small></span>`;
  const bouton = `<span class="boutons"><button type="button" class="principal" data-payer ${assez && !attente ? "" : "disabled"}>${attente ? "…" : "Payer"}</button></span>`;
  const titre = passage === "pont" ? "Caisse du péage" : "Caisse du tunnel";
  return `
    ${enteteCoffre(titre)}
    <div class="colonnes">
      <section><h3>Sur toi</h3><div class="grille">${cases(reste, "deposer")}</div></section>
      <section><h3>Dans la caisse <small>${nommerCaisse(caisse)}</small></h3><div class="grille">${cases(caisse, "prendre")}</div></section>
    </div>
    <div class="bande-objet caisse-peage" aria-live="polite">${ICONE_CAISSE}${compte}${bouton}</div>`;
}

/** La caisse cerclée, sa fente et son cadenas (le dessin de l'objet « caisse_peage »). */
const ICONE_CAISSE = `<svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true">
  <rect x="7" y="17" width="34" height="22" rx="2" fill="#6a5038" stroke="#3a2a1c" stroke-width="2"/>
  <rect x="5" y="13" width="38" height="6" rx="1.5" fill="#5a4430" stroke="#3a2a1c" stroke-width="2"/>
  <rect x="11" y="15" width="3" height="24" fill="#2e2c2a"/><rect x="34" y="15" width="3" height="24" fill="#2e2c2a"/>
  <rect x="19" y="14.6" width="10" height="1.8" fill="#141414"/>
  <rect x="21.5" y="25" width="5" height="6" rx="1" fill="#b89a4a" stroke="#3a2a1c" stroke-width="1"/>
</svg>`;

/** Ce qu'il y a dans la caisse, en quelques mots (« 4 branches »). */
function nommerCaisse(caisse: Readonly<Inventaire>): string {
  const n = Object.values(caisse).reduce((s, k) => s + (k ?? 0), 0);
  if (n === 0) return "vide";
  const [cle, k] = Object.entries(caisse)[0] as [CleObjet, number];
  return Object.keys(caisse).length === 1 ? nommer(cle, k) : `${n} objets`;
}

/** Le panneau ouvert de la caisse : ce qu'on y a mis, et les gestes. */
export class CaissePeage {
  private caisse: Inventaire = {};
  /** « Payer » envoyé : on attend la réponse du serveur (le bouton est grisé). */
  private attente = false;
  private dernier = "";
  private readonly panneau: HTMLElement;
  readonly passage: Passage;
  private readonly sac: () => Readonly<Inventaire>;
  private readonly payer: (objets: Inventaire) => void;
  private readonly fermer: () => void;

  constructor(panneau: HTMLElement, passage: Passage, sac: () => Readonly<Inventaire>, payer: (objets: Inventaire) => void, fermer: () => void) {
    this.panneau = panneau;
    this.passage = passage;
    this.sac = sac;
    this.payer = payer;
    this.fermer = fermer;
  }

  /** La réponse du serveur : refusé, on garde ce qu'on avait choisi ; payé, le panneau se ferme. */
  reponse(ouvert: boolean): void {
    this.attente = false;
    if (ouvert) {
      this.caisse = {};
      this.fermer();
      return;
    }
    this.dessiner();
  }

  dessiner(): void {
    this.caisse = borner(this.caisse, this.sac());
    const html = htmlCaisse(this.passage, this.sac(), this.caisse, this.attente);
    if (html === this.dernier) return;
    this.dernier = html;
    const defil = [...this.panneau.querySelectorAll<HTMLElement>(".grille")].map((g) => g.scrollTop);
    this.panneau.innerHTML = html;
    this.panneau.querySelectorAll<HTMLElement>(".grille").forEach((g, i) => (g.scrollTop = defil[i] ?? 0));
    brancherCoffre(this.panneau, {
      fermer: () => this.fermer(),
      // Un toucher : un objet passe de l'autre côté.
      toucherCase: (sens, objet) => {
        const cle = objet as CleObjet;
        if (sens === "deposer") this.caisse[cle] = (this.caisse[cle] ?? 0) + 1;
        else if ((this.caisse[cle] ?? 0) > 1) this.caisse[cle] = this.caisse[cle]! - 1;
        else delete this.caisse[cle];
        this.dessiner();
      },
      deplacer: () => {},
    });
    this.panneau.querySelector<HTMLElement>("[data-payer]")?.addEventListener("click", () => {
      if (this.attente || valeurObjets(this.caisse) < PRIX_PASSAGE) return;
      this.attente = true;
      this.payer({ ...this.caisse });
      this.dessiner();
    });
  }
}
