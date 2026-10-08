// Types du moteur audio livré par la session musique (musique/moteur/moteur-couches.js, copié par scripts/copier-musique.mjs).
// Seule l'API publique décrite dans musique/LIVRAISON.md §3 est déclarée.

export type BusEffet = "menaces" | "joueur" | "environnement" | "interface";
export type Couche = "fond" | "vie" | "tension" | "danger";
export type NiveauMenace = "aucune" | "attire" | "poursuite" | "saisie";
export type Reglage = "general" | "musique" | "effets" | "ambiance" | "voix";

export interface OptionsEffet {
  bus?: BusEffet;
  priorite?: 1 | 2 | 3;
  gain?: number;
  /** En mètres : x à droite, y devant, auditeur sur le personnage. */
  position?: { x: number; y: number } | null;
  /** Portée de signature (m) : au-delà, l'effet est inaudible. */
  portee?: number;
  varier?: boolean;
  boucle?: boolean;
  fondu?: number;
}

/** Une voix d'effet en cours (pour l'arrêter, ou la suivre en boucle). */
export interface VoixEffet {
  src: AudioBufferSourceNode;
  gain: GainNode;
  priorite: number;
  fin: number;
}

export interface OptionsMoteur {
  bpm?: number;
  voixMax?: number;
  directeur?: { lieu?: "terrain" | "halte" | "comptoir"; attendreFeu?: boolean };
}

export class MoteurAudio {
  constructor(ctx: BaseAudioContext, options?: OptionsMoteur);
  readonly ctx: AudioContext;
  readonly maitre: GainNode;
  readonly limiteur: DynamicsCompressorNode;
  pieces: Record<string, unknown>;
  signaux: Record<string, unknown>;
  mobile?: boolean;
  chargerPiece(id: string, piece: unknown): void;
  chargerSignal(nom: string, entree: unknown): void;
  chargerProduction(base: string, famille: string, progres?: (fait: number, total: number) => void, mobile?: boolean): Promise<{ format: string; fichiers: number; compresseMo: number }>;
  attribuer(couche: Couche, idPiece: string): void;
  demarrer(): Promise<void>;
  arreter(): void;
  jouerTitre(base: string): Promise<{ dureeIntro: number; dureeBoucle: number }>;
  quitterTitre(fondu?: number): void;
  signalerMenace(niveau: NiveauMenace): void;
  dormir(): void;
  reveiller(): void;
  premierFeu(): void;
  installerAtelier(): void;
  changerMoment(moment: "jour" | "nuit"): void;
  jouerSignal(nom: string, quand?: "maintenant" | "temps" | "tempsFort" | "mesure"): void;
  radio(actif: boolean, fondu?: number): void;
  regler(nom: Reglage, valeur: number): void;
  jouerEffet(buffer: AudioBuffer, o?: OptionsEffet): VoixEffet | null;
  arreterEffet(v: VoixEffet | null, fondu?: number): void;
  memoire(): number;
  etat(): { phase?: string; moment?: string; menace?: string; couches: unknown; duck: number; memoire: number; journal: unknown[] };
}
