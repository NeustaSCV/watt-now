// Le son du jeu : la musique livrée par la session musique (musique/LIVRAISON.md) et les effets du catalogue,
// tous joués par le même moteur (client/src/audio/moteur-couches.js, Book 21 §6.4).
// Un seul AudioContext, débloqué au premier geste du joueur (iOS l'exige, Book 21 §6.4.3).

import { MoteurAudio, type NiveauMenace, type VoixEffet, type ZoneMusique } from "../audio/moteur-couches.js";
import type { MusiqueLieu } from "../../../commun/src/registre-lieux.ts";
import { ecrire, lire } from "../stockage.ts";
import { SONS, fabriquer, type DefSon, type IdSon } from "./catalogue.ts";
import { FE } from "./dsp.ts";

const BASE = "/assets/musique/";
/** Les effets enregistrés de la session « son » (son/LIVRAISON.md) : ils remplacent les recettes synthétisées. */
const BASE_EFFETS = "/assets/effets/";
/**
 * Les effets dont on garde la recette synthétisée, même si un fichier existe (son/LIVRAISON.md §7 : à écouter).
 * Ajouter ici l'identifiant d'un son enregistré qui ne convient pas.
 */
const RECETTE_PREFEREE = new Set<string>([]);
/**
 * Les effets que le jeu ajoute lui-même à la livraison de la session « son » (0.10, K2 : la corne grave du cargo, un
 * enregistrement CC0) : rangés dans /assets/effets-jeu/<id>/<id>_<n>.opus et .m4a (client/public/assets/effets-jeu/),
 * hors du dossier que scripts/copier-effets.mjs efface et recopie. Tant que le fichier manque, la recette synthétisée
 * reste ; la livraison de la session « son », si elle a un jour le même identifiant, passe avant.
 */
const BASE_EFFETS_JEU = "/assets/effets-jeu/";
const EFFETS_DU_JEU: Partial<Record<IdSon, string[]>> = {
  // Kinoton, « Cruise Ship Horn, 3x » (CC0, Freesound 352374) : un coup par variante, avec l'écho du port (licences.csv).
  corne_cargo: ["corne_cargo/corne_cargo_0", "corne_cargo/corne_cargo_1", "corne_cargo/corne_cargo_2"],
};

interface ManifesteEffets {
  sons: Record<string, { boucle: boolean; variantes: string[] }>;
}
const CLE_SON = "watt.son";

/** La musique d'un lieu (sa fiche du registre des lieux, commun/src/registre-lieux.ts : `musique`). */
export type LieuMusique = MusiqueLieu;

/** Les lieux dont la musique est livrée (leurs pièces, et leur conduite par le directeur). */
type LieuJoue = "terrain" | "halte" | "comptoir" | "cooperative";

/**
 * 0.8 : le gué et le Moulin ont leur nom, pas encore leur ambiance (l'eau courante, le bief et la roue arrêtée : à la
 * session musique). En attendant, le gué joue la halte, le Moulin la Coopérative. Retirer la ligne quand les pièces
 * du lieu sont livrées (et les ajouter à PIECES et au directeur).
 */
const EN_ATTENDANT: Record<Exclude<LieuMusique, LieuJoue>, LieuJoue> = {
  gue: "halte",
  moulin: "cooperative",
  // 0.10 : le niveau 2, de même ; les haltes jouent la halte, les lieux à soi la Coopérative.
  route_pont: "halte",
  corniche: "halte",
  grand_hotel: "cooperative",
  phare: "cooperative",
};

/** Le lieu dont on joue la musique. */
function lieuJoue(lieu: LieuMusique): LieuJoue {
  return lieu in EN_ATTENDANT ? EN_ATTENDANT[lieu as keyof typeof EN_ATTENDANT] : (lieu as LieuJoue);
}

/** Les pièces de chaque lieu (musique/LIVRAISON.md §3). */
const PIECES: Record<LieuJoue, { bpm: number; fond?: string; vie: string; tension?: string; danger?: string }> = {
  terrain: { bpm: 84, fond: "fond-jour", vie: "vie-jour", tension: "tension", danger: "danger" },
  halte: { bpm: 84, fond: "fond-halte", vie: "explo-halte", tension: "tension-halte", danger: "danger-halte" },
  comptoir: { bpm: 96, vie: "comptoir" },
  // La Coopérative du Plateau (musique/LIVRAISON.md §3 bis) : le Fond a un stem par zone.
  cooperative: { bpm: 84, fond: "fond-coop", vie: "explo-coop", tension: "tension-coop", danger: "danger-coop" },
};

/** Ce que le jeu veut entendre ; appliqué dès que le son est débloqué. */
interface Voulu {
  famille: string;
  lieu: LieuMusique;
  nuit: boolean;
  atelier: boolean;
  attendreFeu: boolean;
}

interface Boucle {
  id: IdSon;
  voix: VoixEffet | null;
  moteur: MoteurAudio;
  depuis: number;
  gain: number;
}

export interface Ou {
  x: number;
  z: number;
}

export class Sonorisation {
  private ctx: AudioContext | null = null;
  private moteur: MoteurAudio | null = null;
  private titre: MoteurAudio | null = null;
  /** Le moteur qui a chargé la production : il garde les fichiers compressés, les moteurs de lieu les empruntent. */
  private production: Promise<MoteurAudio | null> | null = null;
  private voulu: Voulu | null = null;
  private jeton = 0;
  private readonly mobile: boolean;
  private readonly tampons = new Map<IdSon, AudioBuffer[]>();
  /** Les effets enregistrés déjà décodés (ils priment sur les recettes). */
  private readonly enregistres = new Map<IdSon, AudioBuffer[]>();
  private readonly enChargement = new Set<IdSon>();
  /** Les effets du jeu dont le fichier manque (on ne le redemande pas à chaque fois). */
  private readonly introuvables = new Set<IdSon>();
  /** Le manifeste des effets enregistrés, et l'extension que ce navigateur sait lire. */
  private manifesteEffets: Promise<ManifesteEffets | null> | null = null;
  private extensionEffets = ".opus";
  private readonly dernieres = new Map<IdSon, number>();
  private readonly boucles = new Map<string, Boucle>();
  private ecoute = { x: 0, z: 0, lacet: Math.PI / 4 };
  private menaceActuelle: NiveauMenace = "aucune";
  private radioActuelle: boolean | null = null;
  private nuitActuelle = false;
  /** La zone de la Coopérative où se trouve le personnage (le directeur part de « dehors »). */
  private zoneActuelle: ZoneMusique = "dehors";
  private enAccueil = true;
  /** La musique du lieu a démarré : le directeur existe, on peut lui parler. */
  private pret = false;
  /** Sons à fabriquer d'avance dès que le son sera débloqué. */
  private aPrechauffer: IdSon[] = [];
  /** Le joueur a coupé le son (préférence gardée sur l'appareil). */
  coupe = lire(CLE_SON) === "coupe";

  constructor(mobile: boolean) {
    this.mobile = mobile;
    const debloquer = () => {
      void this.debloquer();
      for (const e of ["pointerdown", "keydown", "touchend"]) window.removeEventListener(e, debloquer, true);
    };
    for (const e of ["pointerdown", "keydown", "touchend"]) window.addEventListener(e, debloquer, true);
    // Onglet caché : on suspend le son (batterie), on le reprend au retour (Book 21 §6.4.3).
    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
    // iOS : après un appel ou une mise en veille, le contexte est « interrompu » ; on le reprend au toucher suivant.
    window.addEventListener("pointerdown", () => {
      if (this.ctx && this.ctx.state !== "running" && !document.hidden) void this.ctx.resume();
    });
  }

  get debloque(): boolean {
    return this.ctx !== null;
  }

  private async debloquer(): Promise<void> {
    if (this.ctx) return;
    const ctx = new AudioContext({ latencyHint: "playback" });
    this.ctx = ctx;
    await ctx.resume().catch(() => undefined);
    const muet = ctx.createBufferSource();
    muet.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    muet.connect(ctx.destination);
    muet.start();
    if (this.enAccueil) void this.jouerTitre();
    if (this.voulu) void this.demarrerLieu();
    // Les effets enregistrés (son/LIVRAISON.md §5) : Opus si le navigateur le lit, sinon AAC.
    this.extensionEffets = new Audio().canPlayType('audio/ogg; codecs="opus"') ? ".opus" : ".m4a";
    this.manifesteEffets = fetch(`${BASE_EFFETS}manifeste.json`)
      .then((r) => (r.ok ? (r.json() as Promise<ManifesteEffets>) : null))
      .catch(() => null);
    // Les effets du jeu (la corne du cargo) se chargent d'avance : le premier coup est déjà le bon.
    for (const id of Object.keys(EFFETS_DU_JEU) as IdSon[]) this.chargerEnregistre(id);
    this.prechauffer(this.aPrechauffer.splice(0));
  }

  // ---------- L'écran titre (moment-vitrine 1) ----------

  private async jouerTitre(): Promise<void> {
    if (!this.ctx || this.titre) return;
    const titre = new MoteurAudio(this.ctx);
    titre.regler("general", this.coupe ? 0 : 1);
    this.titre = titre;
    await titre.jouerTitre(BASE).catch(() => undefined);
    // Le joueur est déjà entré pendant le chargement : on n'attend pas.
    if (!this.enAccueil) this.quitterTitre();
  }

  private quitterTitre(): void {
    const t = this.titre;
    if (!t) return;
    this.titre = null;
    t.quitterTitre(5);
    window.setTimeout(() => t.limiteur.disconnect(), 6000);
  }

  // ---------- La musique du lieu ----------

  /** Le joueur entre dans un lieu (à la connexion, ou au bout d'un voyage). */
  entrer(v: Voulu): void {
    this.enAccueil = false;
    this.quitterTitre();
    const change = !this.voulu || this.voulu.lieu !== v.lieu || this.voulu.famille !== v.famille || !this.moteur;
    this.voulu = { ...v };
    this.nuitActuelle = v.nuit;
    if (change && this.ctx) void this.demarrerLieu();
  }

  private chargerProduction(famille: string): Promise<MoteurAudio | null> {
    if (this.production) return this.production;
    const ctx = this.ctx!;
    this.production = (async () => {
      const m = new MoteurAudio(ctx);
      m.limiteur.disconnect();
      try {
        await m.chargerProduction(BASE, famille, undefined, this.mobile);
        return m;
      } catch (e) {
        console.warn("Musique indisponible :", e);
        return null;
      }
    })();
    return this.production;
  }

  private async demarrerLieu(): Promise<void> {
    const ctx = this.ctx;
    const v = this.voulu;
    if (!ctx || !v) return;
    const jeton = ++this.jeton;
    // L'ancien lieu s'efface ; ses boucles s'arrêtent avec lui.
    const ancien = this.moteur;
    if (ancien) {
      ancien.arreter();
      for (const b of this.boucles.values()) ancien.arreterEffet(b.voix, 0.8);
      window.setTimeout(() => ancien.limiteur.disconnect(), 3000);
    }
    this.boucles.clear();
    this.radioActuelle = null;
    this.pret = false;
    // Le directeur part de « dehors » ; la boucle du jeu redonne la zone réelle dès que la musique joue.
    this.zoneActuelle = "dehors";
    const joue = lieuJoue(v.lieu);
    const p = PIECES[joue];
    const m = new MoteurAudio(ctx, {
      bpm: p.bpm,
      voixMax: this.mobile ? 24 : 48,
      directeur: { lieu: joue, attendreFeu: v.attendreFeu && v.lieu === "terrain" },
    });
    m.regler("general", this.coupe ? 0 : 1);
    // Les effets passent tout de suite par ce moteur, même si la musique n'est pas encore chargée.
    this.moteur = m;
    const production = await this.chargerProduction(v.famille);
    if (jeton !== this.jeton || !production) return;
    for (const [id, piece] of Object.entries(production.pieces)) m.chargerPiece(id, piece);
    for (const [nom, entree] of Object.entries(production.signaux)) m.chargerSignal(nom, entree);
    m.mobile = production.mobile;
    const nuit = v.nuit && v.lieu === "terrain";
    if (p.fond) m.attribuer("fond", nuit ? "fond-nuit" : p.fond);
    m.attribuer("vie", nuit ? "vie-nuit" : p.vie);
    if (p.tension) m.attribuer("tension", p.tension);
    if (p.danger) m.attribuer("danger", p.danger);
    await m.demarrer();
    if (jeton !== this.jeton) return m.arreter();
    // (Le signal d'arrivée à la halte, à la Coopérative et au Comptoir est joué par le directeur lui-même.)
    this.pret = true;
    if (nuit) m.changerMoment("nuit");
    if (v.atelier && v.lieu === "terrain") m.installerAtelier();
    if (this.menaceActuelle !== "aucune") m.signalerMenace(this.menaceActuelle);
  }

  /** Le moteur du lieu, s'il joue déjà sa musique (sinon les ordres attendent le démarrage). */
  private get directeur(): MoteurAudio | null {
    return this.pret ? this.moteur : null;
  }

  /** Le niveau de menace : l'état le plus grave parmi les Éteints qui ciblent le joueur. */
  menace(niveau: NiveauMenace): void {
    if (niveau === this.menaceActuelle) return;
    this.menaceActuelle = niveau;
    this.directeur?.signalerMenace(niveau);
  }

  /**
   * À la Coopérative : la zone où est le personnage (dehors, dedans, chambre froide). Appelé à chaque image,
   * ne parle au moteur qu'au changement.
   */
  zone(zone: ZoneMusique): void {
    if (this.voulu?.lieu !== "cooperative" || zone === this.zoneActuelle) return;
    const d = this.directeur;
    if (!d) return; // la musique démarre encore : on redira la zone à l'image suivante
    this.zoneActuelle = zone;
    d.changerZone(zone);
  }

  /** Le joueur repart de la Coopérative par le portail, vivant : signal tout de suite, avant le voyage. */
  sortieCoop(): void {
    if (this.voulu?.lieu === "cooperative") this.directeur?.jouerSignal("sortieCoop", "maintenant");
  }

  /** Un butin rare trouvé (chambre froide, coffre) : signal au temps suivant. À brancher avec le butin. */
  butin(): void {
    if (this.voulu?.lieu === "cooperative") this.directeur?.jouerSignal("butin", "temps");
  }

  /** Crépuscule et aube : sur le terrain seulement (la halte et le Comptoir n'ont pas de musique de nuit). */
  moment(nuit: boolean): void {
    if (nuit === this.nuitActuelle) return;
    this.nuitActuelle = nuit;
    if (this.voulu) this.voulu.nuit = nuit;
    if (this.voulu?.lieu === "terrain") this.directeur?.changerMoment(nuit ? "nuit" : "jour");
  }

  dormir(dort: boolean): void {
    if (dort) this.directeur?.dormir();
    else this.directeur?.reveiller();
  }

  premierFeu(): void {
    if (this.voulu?.attendreFeu) {
      this.voulu.attendreFeu = false;
      this.directeur?.premierFeu();
    }
  }

  /** L'atelier de la famille est installé : le thème joue au complet (moment-vitrine 4). */
  atelier(): void {
    if (!this.voulu || this.voulu.atelier) return;
    this.voulu.atelier = true;
    if (this.voulu.lieu === "terrain") this.directeur?.installerAtelier();
  }

  /** Recette réussie, découverte, échange conclu, premier Éteint repéré, mort. */
  signal(nom: "recette" | "decouverte" | "echange" | "eteintRepere" | "mort"): void {
    this.directeur?.jouerSignal(nom, nom === "mort" ? "maintenant" : "temps");
  }

  /** Au Comptoir : la musique sort d'un petit poste dehors, s'ouvre en grand près du guichet. */
  radio(actif: boolean): void {
    if (actif === this.radioActuelle) return;
    this.radioActuelle = actif;
    this.moteur?.radio(actif);
  }

  /**
   * La radio à piles de la Coopérative (Book 23 §4.7) : la réclame de la Compagnie pour l'« engrais Watty », en boucle,
   * à sa place (un son diégétique livré par la session musique, LIVRAISON §3 bis). Les Éteints l'entendent aussi.
   */
  radioCompagnie(actif: boolean, ou: Ou | null = null): void {
    if (!actif) {
      if (this.voixRadio && this.moteur) this.moteur.arreterEffet(this.voixRadio, 0.3);
      this.voixRadio = null;
      return;
    }
    if (this.voixRadio || !this.ctx || !this.moteur) return;
    const ctx = this.ctx;
    const moteur = this.moteur;
    this.tamponRadio ??= fetch(`${BASE}manifeste${this.mobile ? "-mobile" : ""}.json`)
      .then((r) => r.json() as Promise<{ diegetiques?: Record<string, { fichier: string }> }>)
      .then(async (m) => {
        const d = m.diegetiques?.["radio-compagnie"];
        if (!d) return null;
        const r = await fetch(`${BASE}${this.mobile ? "mobile" : "jeu"}/${d.fichier}${this.extensionEffets}`);
        return r.ok ? ctx.decodeAudioData(await r.arrayBuffer()) : null;
      })
      .catch(() => null);
    void this.tamponRadio.then((tampon) => {
      if (!tampon || this.voixRadio || this.moteur !== moteur) return;
      this.voixRadio = moteur.jouerEffet(tampon, { bus: "environnement", priorite: 3, position: ou ? this.relatif(ou) : null, portee: ou ? 25 : 0, boucle: true, varier: false });
    });
  }
  private voixRadio: VoixEffet | null = null;
  private tamponRadio: Promise<AudioBuffer | null> | null = null;

  /** Couper ou remettre le son (préférence gardée). */
  basculer(): boolean {
    this.coupe = !this.coupe;
    ecrire(CLE_SON, this.coupe ? "coupe" : null);
    this.moteur?.regler("general", this.coupe ? 0 : 1);
    this.titre?.regler("general", this.coupe ? 0 : 1);
    return !this.coupe;
  }

  /** Pour le développement : l'état du son. */
  diagnostic(): unknown {
    return {
      contexte: this.ctx?.state ?? "bloqué",
      titre: this.titre !== null,
      lieu: this.voulu?.lieu,
      zone: this.voulu?.lieu === "cooperative" ? this.zoneActuelle : undefined,
      moteur: this.moteur ? this.moteur.etat() : null,
      boucles: [...this.boucles.keys()],
      tampons: this.tampons.size,
    };
  }

  // ---------- Les effets ----------

  /** L'auditeur est sur le personnage, orienté comme l'écran (Book 21 §6.4.1). */
  ecouter(x: number, z: number, lacet: number): void {
    this.ecoute = { x, z, lacet };
  }

  /** Position relative à l'auditeur : x à droite de l'écran, y vers le haut de l'écran (« devant »). */
  private relatif(ou: Ou): { x: number; y: number } {
    const avantX = -Math.cos(this.ecoute.lacet);
    const avantZ = -Math.sin(this.ecoute.lacet);
    const dx = ou.x - this.ecoute.x;
    const dz = ou.z - this.ecoute.z;
    return { x: dx * -avantZ + dz * avantX, y: dx * avantX + dz * avantZ };
  }

  distance(ou: Ou): number {
    return Math.hypot(ou.x - this.ecoute.x, ou.z - this.ecoute.z);
  }

  /** Charge et décode, en tâche de fond, les fichiers d'un effet enregistré (s'il existe). */
  private chargerEnregistre(id: IdSon): void {
    if (!this.ctx || !this.manifesteEffets || this.enregistres.has(id) || this.enChargement.has(id) || this.introuvables.has(id) || RECETTE_PREFEREE.has(id)) return;
    this.enChargement.add(id);
    const ctx = this.ctx;
    void this.manifesteEffets
      .then(async (m) => {
        const entree = m?.sons[id];
        const chemins = entree ? entree.variantes.map((c) => BASE_EFFETS + c) : EFFETS_DU_JEU[id]?.map((c) => BASE_EFFETS_JEU + c);
        if (!chemins) return;
        const liste = await Promise.all(
          chemins.map(async (chemin) => {
            const r = await fetch(`${chemin}${this.extensionEffets}`);
            if (!r.ok) throw new Error(`${chemin} : ${r.status}`);
            return ctx.decodeAudioData(await r.arrayBuffer());
          }),
        );
        this.enregistres.set(id, liste);
      })
      // Un fichier manque ou ne se décode pas : la recette reste (rien ne casse) ; un effet du jeu n'est pas redemandé.
      .catch(() => {
        if (EFFETS_DU_JEU[id]) this.introuvables.add(id);
      })
      .finally(() => this.enChargement.delete(id));
  }

  /**
   * Les tampons d'un effet : le fichier enregistré s'il est déjà décodé ; sinon la recette synthétisée (le fichier
   * se charge pendant ce temps et servira la fois suivante).
   */
  private tamponsDe(id: IdSon): AudioBuffer[] {
    const enregistre = this.enregistres.get(id);
    if (enregistre) return enregistre;
    this.chargerEnregistre(id);
    const deja = this.tampons.get(id);
    if (deja) return deja;
    const def: DefSon = SONS[id];
    const liste: AudioBuffer[] = [];
    for (let v = 0; v < def.variantes; v++) {
      const s = fabriquer(id, v);
      const b = this.ctx!.createBuffer(1, s.length, FE);
      b.getChannelData(0).set(s);
      liste.push(b);
    }
    this.tampons.set(id, liste);
    return liste;
  }

  /** Fabrique d'avance quelques sons, un par moment libre (pour ne pas saccader au premier coup). */
  prechauffer(ids: IdSon[]): void {
    if (!this.ctx) {
      this.aPrechauffer.push(...ids);
      return;
    }
    // Les fichiers enregistrés se chargent d'avance, à côté des recettes de secours.
    for (const id of ids) this.chargerEnregistre(id);
    const file = ids.filter((id) => !this.tampons.has(id));
    const suivant = () => {
      const id = file.shift();
      if (!id) return;
      this.tamponsDe(id);
      const ric = (window as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback;
      if (ric) ric(suivant);
      else window.setTimeout(suivant, 30);
    };
    window.setTimeout(suivant, 200);
  }

  /** Joue un effet. `ou` : sa source dans le monde (sinon : sur le personnage). */
  jouer(id: IdSon, ou: Ou | null = null, o: { gain?: number; portee?: number } = {}): void {
    if (!this.moteur || !this.ctx || this.ctx.state !== "running") return;
    const def: DefSon = SONS[id];
    const portee = o.portee ?? def.portee;
    if (ou && portee > 0 && this.distance(ou) >= portee) return;
    const liste = this.tamponsDe(id);
    // Tirage sans répétition immédiate.
    let v = Math.floor(Math.random() * liste.length);
    if (liste.length > 1 && v === this.dernieres.get(id)) v = (v + 1) % liste.length;
    this.dernieres.set(id, v);
    this.moteur.jouerEffet(liste[v]!, {
      bus: def.bus,
      priorite: def.priorite,
      gain: def.gain * (o.gain ?? 1),
      position: ou && portee > 0 ? this.relatif(ou) : null,
      portee: ou && portee > 0 ? portee : 0,
    });
  }

  /** Les sons étouffés (passés derrière un mur), fabriqués à la demande et gardés. */
  private readonly etouffes = new WeakMap<AudioBuffer, AudioBuffer | "en cours">();

  /**
   * Un son entendu à travers un mur ou une porte (0.7.2, message « bruits ») : joué depuis le point de passage, étouffé
   * (un filtre passe-bas, appliqué une fois au tampon) et aussi faible que la force reçue (0 à 1) le dit.
   */
  jouerEtouffe(id: IdSon, ou: Ou, force: number, o: { gain?: number } = {}): void {
    if (!this.moteur || !this.ctx || this.ctx.state !== "running") return;
    const def: DefSon = SONS[id];
    const liste = this.tamponsDe(id);
    let v = Math.floor(Math.random() * liste.length);
    if (liste.length > 1 && v === this.dernieres.get(id)) v = (v + 1) % liste.length;
    this.dernieres.set(id, v);
    const brut = liste[v]!;
    const pret = this.etouffes.get(brut);
    if (pret === undefined) {
      // La première fois, on le fabrique (en tâche de fond) ; en attendant, le son brut, plus bas.
      this.etouffes.set(brut, "en cours");
      const hors = new OfflineAudioContext(1, brut.length, brut.sampleRate);
      const src = hors.createBufferSource();
      src.buffer = brut;
      const filtre = hors.createBiquadFilter();
      filtre.type = "lowpass";
      filtre.frequency.value = 650;
      filtre.Q.value = 0.4;
      src.connect(filtre);
      filtre.connect(hors.destination);
      src.start();
      void hors.startRendering().then((t) => this.etouffes.set(brut, t));
    }
    const tampon = pret instanceof AudioBuffer ? pret : brut;
    // Le moteur éteint un son à sa portée selon (1 − d / portée)^1,6 : on choisit la portée pour qu'il reste `force`.
    const d = this.distance(ou);
    const f = Math.max(0.02, Math.min(0.98, force));
    this.moteur.jouerEffet(tampon, {
      bus: def.bus,
      priorite: def.priorite,
      gain: def.gain * (o.gain ?? 1) * (tampon === brut ? 0.5 : 1.4),
      position: this.relatif(ou),
      portee: Math.max(0.3, d) / (1 - f),
    });
  }

  /**
   * Les sons continus voulus à cet instant (feu, pluie, pédalier…) : on lance ceux qui manquent, on règle
   * le volume des autres selon la distance, on arrête ceux qui ne sont plus voulus.
   */
  continus(voulus: { cle: string; id: IdSon; ou?: Ou; gain?: number }[]): void {
    const m = this.moteur;
    const ctx = this.ctx;
    if (!m || !ctx || ctx.state !== "running") return;
    const vus = new Set<string>();
    for (const v of voulus) {
      const def: DefSon = SONS[v.id];
      let g = def.gain * (v.gain ?? 1);
      if (v.ou && def.portee > 0) {
        const d = this.distance(v.ou);
        g *= d >= def.portee ? 0 : Math.pow(1 - d / def.portee, 1.6);
      }
      if (g < 0.003) continue;
      vus.add(v.cle);
      const b = this.boucles.get(v.cle);
      if (!b || b.moteur !== m) {
        const voix = m.jouerEffet(this.tamponsDe(v.id)[0]!, { bus: def.bus, priorite: def.priorite, gain: g, boucle: true, fondu: 0.8, varier: false });
        this.boucles.set(v.cle, { id: v.id, voix, moteur: m, depuis: ctx.currentTime, gain: g });
      } else if (b.voix && ctx.currentTime - b.depuis > 0.8 && Math.abs(b.gain - g) > 0.005) {
        b.voix.gain.gain.setTargetAtTime(g, ctx.currentTime, 0.15);
        b.gain = g;
      }
    }
    for (const [cle, b] of this.boucles) {
      if (vus.has(cle)) continue;
      b.moteur.arreterEffet(b.voix, 0.8);
      this.boucles.delete(cle);
    }
  }
}
