// Pas de zoom de la page sur iPhone (0.10.1, A6). Safari ne respecte plus `user-scalable=no` (index.html) : deux appuis
// rapides sur un bouton grisé (qui ne reçoit pas le toucher) ou sur un fond du HUD agrandissaient la page, et l'on restait
// coincé dans la vue agrandie. Trois gardes :
// - le CSS : `touch-action: manipulation` sur html, body et #hud (style.css ; le canevas et le joystick gardent `none`) ;
// - ici : le geste de zoom à deux doigts (`gesturestart`) retenu, et le second appui rapide retenu là où il ne sert à
//   rien (un bouton grisé, un fond) ; jamais sur un bouton actif, un champ de saisie, le canevas ou le joystick, qui
//   ont leurs propres appuis (le double appui du coffre, les appuis longs de A : jauge-coup.ts) ;
// - si le zoom arrive quand même : au prochain changement d'orientation, la page revient à l'échelle normale.

/** Deux appuis plus rapprochés que ça (ms), et à moins de tant de pixels l'un de l'autre, font un double appui pour Safari. */
export const DOUBLE_APPUI_MS = 300;
export const DOUBLE_APPUI_PX = 40;

/** Ce qui garde ses appuis : un contrôle actif, un champ de saisie, le canevas du monde et le joystick. */
const GARDE_SES_APPUIS = "button:not(:disabled), a[href], input, textarea, select, label, [contenteditable], #monde, #joystick";

/** Ce qu'il faut d'une cible pour en juger (un élément de la page ; un objet factice dans les tests). */
interface CibleAppui {
  closest?(selecteur: string): unknown;
}

/**
 * Faut-il retenir ce second appui (`ecartMs` après le précédent, `ecartPx` plus loin) ? Oui s'il est rapide, au même
 * endroit, et tombe là où il ne sert à rien.
 */
export function retenirDoubleAppui(cible: CibleAppui | null, ecartMs: number, ecartPx: number): boolean {
  if (ecartMs > DOUBLE_APPUI_MS || ecartPx > DOUBLE_APPUI_PX) return false;
  if (!cible || typeof cible.closest !== "function") return true;
  return cible.closest(GARDE_SES_APPUIS) === null;
}

/** Brancher les gardes sur la page (une fois, au démarrage). */
export function empecherLeZoom(doc: Document = document, fenetre: Window = window): void {
  const retenir = (e: Event) => e.preventDefault();
  // Le zoom à deux doigts de Safari (ses évènements propres) : les gestes du jeu passent par les pointeurs, pas par eux.
  for (const geste of ["gesturestart", "gesturechange"]) doc.addEventListener(geste, retenir, { passive: false });
  let dernier = { t: -Infinity, x: 0, y: 0 };
  doc.addEventListener(
    "touchend",
    (e) => {
      const doigt = e.changedTouches[0];
      if (!doigt || e.touches.length > 0) return;
      const ici = { t: e.timeStamp || performance.now(), x: doigt.clientX, y: doigt.clientY };
      if (retenirDoubleAppui(e.target as CibleAppui | null, ici.t - dernier.t, Math.hypot(ici.x - dernier.x, ici.y - dernier.y))) e.preventDefault();
      dernier = ici;
    },
    { passive: false },
  );
  // Si la page s'est agrandie quand même : au changement d'orientation, on réécrit la consigne de la fenêtre (Safari
  // revient alors à l'échelle 1), seulement si elle est agrandie.
  const meta = doc.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) return;
  const consigne = meta.content;
  const remettre = () => {
    if ((fenetre.visualViewport?.scale ?? 1) <= 1.01) return;
    meta.content = `${consigne}, minimum-scale=1`;
    fenetre.requestAnimationFrame(() => (meta.content = consigne));
  };
  fenetre.addEventListener("orientationchange", remettre);
  fenetre.screen?.orientation?.addEventListener?.("change", remettre);
}
