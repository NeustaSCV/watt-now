// Journal du serveur : une ligne horodatée par événement (mesures dès la phase 0, Book 17 §6).

let silencieux = false;

export function rendreSilencieux(valeur: boolean): void {
  silencieux = valeur;
}

export function journal(texte: string): void {
  if (silencieux) return;
  const heure = new Date().toISOString().slice(11, 19);
  console.log(`[${heure}] ${texte}`);
}
