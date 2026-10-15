// Types du son de la scène du cargo (son.js : le code de la maquette validée, gardé en JavaScript).

import type { EvenementsCargo } from "./scene-cargo.js";

export class Son {
  constructor(ctx: AudioContext, sortie: AudioNode);
  readonly pret: boolean;
  preparer(): Promise<boolean>;
  /** Joue la scène depuis `depuis` (secondes de scène). */
  jouer(depuis: number, evts: EvenementsCargo): void;
  arreter(): void;
}
