// La saisie au clavier des commandes d'administration (admin.ts, admin-web.ts) : un secret se tape sans écho, comme
// avec sudo ; il ne passe jamais en argument ni dans un fichier.

export function arreter(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

/** Lit une ligne au clavier sans rien afficher (comme sudo). Ctrl-C annule. */
export function lireSecret(invite: string): Promise<string> {
  const entree = process.stdin;
  if (!entree.isTTY) arreter("Il faut un terminal pour taper le mot de passe (avec docker : « docker exec -it »).");
  process.stdout.write(invite);
  entree.setRawMode(true);
  entree.resume();
  entree.setEncoding("utf8");
  return new Promise((resoudre) => {
    let saisi = "";
    const finir = () => {
      entree.setRawMode(false);
      entree.pause();
      entree.removeListener("data", lire);
      process.stdout.write("\n");
    };
    const lire = (morceau: string) => {
      for (const c of morceau) {
        if (c === "\u0003") {
          finir();
          arreter("Annulé.");
        } else if (c === "\r" || c === "\n" || c === "\u0004") {
          finir();
          return resoudre(saisi);
        } else if (c === "\u007f" || c === "\b") {
          saisi = saisi.slice(0, -1);
        } else if (c >= " ") {
          saisi += c;
        }
      }
    };
    entree.on("data", lire);
  });
}
