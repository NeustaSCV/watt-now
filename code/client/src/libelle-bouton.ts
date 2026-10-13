// Le libellé du bouton rond B sur téléphone (plan 0.8.2 §7.6) : 68 px de diamètre, il ne tient que deux ou trois mots
// courts. Un libellé long (« Ramasser : 2 conserves », « Enseigner à Ampoulee2ff ») passe au verbe seul sur le bouton ;
// le libellé entier reste dans son nom accessible et son infobulle.

/** Le plus long libellé qui tient sur le bouton B, et le plus long mot (un mot ne se coupe pas). */
export const LONGUEUR_MAX_B = 14;
export const MOT_MAX_B = 9;

function tient(t: string): boolean {
  return t.length <= LONGUEUR_MAX_B && t.split(/\s+/).every((m) => m.length <= MOT_MAX_B);
}

/** Au-delà de ce nombre de lettres, un mot du bouton B prend un corps plus petit (la classe `mot-long`). */
export const MOT_LONG_B = 7;

/** Le libellé du bouton B a-t-il un mot long ? */
export function motLongB(court: string): boolean {
  return court.split(/\s+/).some((m) => m.length > MOT_LONG_B);
}

/** Ce qu'on écrit sur le bouton B : le libellé s'il tient, sinon sans son détail, sinon le verbe seul. */
export function libelleBoutonB(libelle: string): string {
  if (tient(libelle)) return libelle;
  // Le détail d'abord : « Ramasser : 2 conserves », « Prendre la radio (2 kg) ».
  const sansDetail = libelle.split(" : ")[0]!.replace(/\s*\(.*\)\s*$/, "").trim();
  if (tient(sansDetail)) return sansDetail;
  const verbe = sansDetail.split(/\s+/)[0] ?? sansDetail;
  return verbe.length <= MOT_MAX_B + 1 ? verbe : `${verbe.slice(0, MOT_MAX_B)}…`;
}
