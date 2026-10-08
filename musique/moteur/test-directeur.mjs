/* Tests du directeur musical : node musique/moteur/test-directeur.mjs */
import assert from 'node:assert/strict';
import { Directeur, creerHorloge } from './directeur.js';

const h = creerHorloge(0, 84);
const B = h.dureeBloc, T = h.dureeTemps;
let ok = 0;
function test(nom, fn) { fn(); ok++; console.log('ok  ' + nom); }

/* Simule le jeu : avance par pas de 50 ms, appelle avantBloc aux frontières, collecte les commandes */
function simuler(d, debut, fin, evenements) {
  const cmds = [];
  let prochainBloc = h.suivant(debut, 'bloc');
  for (let t = debut; t <= fin + 1e-9; t += 0.05) {
    (evenements[t.toFixed(2)] || []).forEach((e) => cmds.push(...e(t)));
    if (t + 0.3 >= prochainBloc) { cmds.push(...d.avantBloc(prochainBloc)); prochainBloc += B; }
    cmds.push(...d.mettreAJour(t));
  }
  return cmds;
}
const gains = (cmds, couche, stem) => cmds.filter((c) => c.type === 'gain' && c.couche === couche && (stem === undefined || c.stem === stem));

test('horloge : temps, temps fort, bloc', () => {
  assert.equal(h.suivant(0.1, 'temps').toFixed(4), T.toFixed(4));
  assert.equal(h.suivant(T * 2.5, 'tempsFort').toFixed(4), (T * 4).toFixed(4));
  assert.equal(h.suivant(1, 'bloc').toFixed(4), B.toFixed(4));
  assert.equal(h.suivant(B, 'bloc').toFixed(4), B.toFixed(4));
  assert.ok(T <= 0.715, 'un temps à 84 BPM tient sous 0,72 s');
});

test('démarrage : Fond seul, la Vie entre au premier bloc après 20 s de calme, instrument par instrument', () => {
  const d = new Directeur(h, { alea: () => 0 });
  const c = d.demarrer(0).concat(simuler(d, 0, 2 * B + 1, {}));
  assert.equal(gains(c, 'fond')[0].gain, 1);
  const vie = gains(c, 'vie').filter((x) => x.stem && x.gain > 0);
  assert.equal(vie.length, 4);
  assert.equal(vie[0].at.toFixed(3), B.toFixed(3), 'premier bloc après 20 s (22,9 s)');
  const ecarts = vie.map((x) => (x.at - B) / h.dureeMesure);
  assert.deepEqual(ecarts.map(Math.round), [0, 4, 8, 12], 'un instrument toutes les 4 mesures');
});

test('fenêtre de silence après 3 blocs de Vie, puis retour', () => {
  const d = new Directeur(h, { alea: () => 0 });   // quota 3 blocs, fenêtre 30 s
  const c = d.demarrer(0).concat(simuler(d, 0, 7 * B, {}));
  const coupe = gains(c, 'vie', 'harmonie').find((x) => x.gain === 0);
  assert.equal(coupe.at.toFixed(3), (4 * B).toFixed(3), 'Vie de B1 à B4 (3 blocs), coupée à B4');
  const retour = gains(c, 'vie', 'rythmique').filter((x) => x.gain > 0)[1];
  assert.equal(retour.at.toFixed(3), (6 * B).toFixed(3), '30 s de fenêtre : retour au bloc 6 (B4 + 45,7 s ≥ 30 s)');
});

test('menace brève (< 2 s) : rien ne bouge (hystérésis)', () => {
  const d = new Directeur(h, { alea: () => 0 });
  d.demarrer(0);
  const c = simuler(d, 0, 10, { '3.00': [(t) => d.signalerMenace('attire', t)], '4.50': [(t) => d.signalerMenace('aucune', t)] });
  assert.equal(gains(c, 'tension').length, 0);
});

test('Attiré ≥ 2 s : Tension au temps fort suivant, la Vie perd harmonie et effets', () => {
  const d = new Directeur(h, { alea: () => 0 });
  d.demarrer(0);
  simuler(d, 0, 30, {});                     // la Vie joue (entrée au bloc 1)
  const c = simuler(d, 30.05, 40, { '30.05': [(t) => d.signalerMenace('attire', t)] });
  const ten = gains(c, 'tension')[0];
  assert.ok(ten.at >= 32.05 && ten.at - 32.05 <= 2 * T + 0.06, 'temps fort suivant après 2 s');
  assert.equal(((ten.at / (2 * T)) % 1).toFixed(3), '0.000', 'tombe sur un temps fort');
  assert.equal(gains(c, 'vie', 'harmonie')[0].gain, 0);
  assert.equal(gains(c, 'vie', 'basse')[0].gain, 0.6);
});

test('Saisie : Danger au temps suivant, ≤ 0,72 s', () => {
  const d = new Directeur(h, { alea: () => 0 });
  d.demarrer(0);
  const c = simuler(d, 0, 20, { '10.00': [(t) => d.signalerMenace('saisie', t)] });
  const dg = gains(c, 'danger')[0];
  assert.ok(dg.at - 10 <= 0.72 && dg.at >= 10);
  assert.ok(c.some((x) => x.type === 'signal' && x.nom === 'saisie'));
});

test('dégagement : Silence 4 à 8 s, puis Fond ; la Vie revient après 20 s de calme, à un bloc', () => {
  const d = new Directeur(h, { alea: () => 0.5 });  // silence 6 s
  d.demarrer(0);
  const c = simuler(d, 0, 6 * B, { '10.00': [(t) => d.signalerMenace('saisie', t)], '15.00': [(t) => d.signalerMenace('aucune', t)] });
  const fond = gains(c, 'fond');
  const coupe = fond.find((x) => x.gain === 0), retour = fond.filter((x) => x.gain === 1).pop();
  assert.ok(coupe.at >= 15 && coupe.at <= 15.72);
  assert.equal((retour.at - coupe.at).toFixed(2), '6.00');
  const vie = gains(c, 'vie', 'rythmique').filter((x) => x.gain > 0);
  assert.equal(vie.length, 1);
  assert.ok(vie[0].at >= 35 && Math.abs(vie[0].at / B - Math.round(vie[0].at / B)) < 1e-6, 'à une frontière de bloc, ≥ 20 s après la fin de la menace');
});

test('Tension : sort seulement après 10 s sans menace (pas de va-et-vient)', () => {
  const d = new Directeur(h, { alea: () => 0 });
  d.demarrer(0);
  const c = simuler(d, 0, 40, {
    '5.00': [(t) => d.signalerMenace('poursuite', t)],
    '12.00': [(t) => d.signalerMenace('aucune', t)],
    '18.00': [(t) => d.signalerMenace('attire', t)],      // revient avant 10 s : on reste en Tension
    '20.00': [(t) => d.signalerMenace('aucune', t)]
  });
  const ten = gains(c, 'tension');
  assert.equal(ten.filter((x) => x.gain === 1).length, 1, 'une seule entrée');
  const sortie = ten.find((x) => x.gain === 0);
  assert.ok(sortie.at >= 30 && sortie.at <= 30.72, 'sortie 10 s après la dernière menace');
});

test('nuit : signal à la mesure, Fond et Vie de nuit au bloc ; basse, harmonie, mélodie', () => {
  const d = new Directeur(h, { alea: () => 0 });
  d.demarrer(0);
  simuler(d, 0, B + 1, {});
  const c = simuler(d, B + 1.05, 2 * B + 1, { [(B + 1.05).toFixed(2)]: [(t) => d.changerMoment('nuit', t)] });
  assert.ok(c.some((x) => x.type === 'signal' && x.nom === 'crepuscule'));
  const p = c.filter((x) => x.type === 'piece');
  assert.deepEqual(p.map((x) => x.piece), ['fond-nuit', 'vie-nuit']); assert.equal(p[0].at.toFixed(3), (2 * B).toFixed(3));
  assert.equal(gains(c, 'vie', 'rythmique').pop().gain, 0);
  assert.equal(gains(c, 'vie', 'melodie').pop().gain, 1);
});

test('endormissement : motif à la mesure, puis silence ; un Éteint attiré réveille la Tension ; aube au réveil', () => {
  const d = new Directeur(h, { alea: () => 0 });
  d.demarrer(0);
  simuler(d, 0, 30, {});
  let c = d.dormir(30);
  const sig = c.find((x) => x.type === 'signal');
  assert.equal(sig.nom, 'endormissement'); assert.equal(((sig.at / h.dureeMesure) % 1).toFixed(3), '0.000');
  assert.ok(gains(c, 'fond').every((x) => x.gain === 0));
  c = simuler(d, 30.05, 40, { '32.00': [(t) => d.signalerMenace('attire', t)] });
  assert.equal(gains(c, 'tension')[0].gain, 1);
  d.signalerMenace('aucune', 40);
  c = d.reveiller(41);
  assert.equal(c.find((x) => x.type === 'signal').nom, 'aube');
  assert.equal(d.phase, 'calme');
});

test('premier feu (tutoriel) : pas de Vie avant le feu ; au feu, souffle à la mesure puis la Vie entre sur 16 mesures', () => {
  const d = new Directeur(h, { alea: () => 0, attendreFeu: true });
  let c = d.demarrer(0).concat(simuler(d, 0, 3 * B, {}));
  assert.equal(gains(c, 'vie').filter((x) => x.gain > 0).length, 0, 'aucune Vie sans feu');
  c = d.premierFeu(70);
  const sig = c.find((x) => x.type === 'signal');
  assert.equal(sig.nom, 'feu'); assert.ok(sig.at >= 70 && sig.at - 70 <= h.dureeMesure + 1e-6);
  const vie = gains(c, 'vie').filter((x) => x.stem && x.gain > 0);
  assert.deepEqual(vie.map((x) => x.stem), ['rythmique', 'basse', 'harmonie', 'effets'], 'la matière de la famille d\'abord');
  assert.ok(Math.abs((vie[3].at - vie[0].at) / h.dureeMesure - 12) < 1e-6, 'dernier instrument 12 mesures après le premier : complet sur 16');
  assert.equal(d.premierFeu(80).length, 0, 'un second feu ne relance rien');
});

test('installation de famille : à la mesure, le thème entre au complet d\'un coup, avec la percussion de l\'atelier', () => {
  const d = new Directeur(h, { alea: () => 0 });
  d.demarrer(0);
  const c = d.installerAtelier(10);
  const vie = gains(c, 'vie').filter((x) => x.stem && x.gain > 0);
  assert.deepEqual(vie.map((x) => x.stem), ['rythmique', 'basse', 'harmonie', 'effets', 'outil']);
  const tm = vie[0].at;
  assert.ok(vie.every((x) => x.at === tm), 'tout entre ensemble');
  assert.equal(((tm / h.dureeMesure) % 1).toFixed(3), '0.000');
  const c2 = simuler(d, 10.05, 60, { '30.00': [(t) => d.signalerMenace('attire', t)] });
  assert.equal(gains(c2, 'vie', 'outil').find((x) => x.at > 30).gain, 0, 'la percussion se tait en Tension');
});

test('halte : signal d\'arrivée à la mesure, l\'Exploration entre d\'un coup ; en Tension elle perd sa texture', () => {
  const d = new Directeur(h, { alea: () => 0, lieu: 'halte' });
  const c = d.demarrer(0.1);
  assert.equal(c.find((x) => x.type === 'signal').nom, 'arriveeHalte');
  const vie = gains(c, 'vie').filter((x) => x.stem && x.gain > 0);
  assert.deepEqual(vie.map((x) => x.stem), ['pulsation', 'basse', 'texture']);
  const c2 = simuler(d, 0.15, 20, { '5.00': [(t) => d.signalerMenace('poursuite', t)] });
  assert.equal(gains(c2, 'vie', 'texture')[0].gain, 0);
  assert.equal(gains(c2, 'vie', 'pulsation')[0].gain, 0.6);
  assert.equal(c2.filter((x) => x.type === 'piece').length, 0, 'pas de jour ni de nuit à la halte');
});

test('comptoir : zone sûre, groove au complet sans fenêtre de silence, aucune Tension', () => {
  const H96 = creerHorloge(0, 96), d = new Directeur(H96, { alea: () => 0, lieu: 'comptoir' });
  let c = d.demarrer(0.1);
  assert.equal(c.find((x) => x.type === 'signal').nom, 'comptoir');
  assert.deepEqual(gains(c, 'vie').filter((x) => x.stem && x.gain > 0).map((x) => x.stem), ['rythmique', 'basse', 'harmonie', 'melodie']);
  d.signalerMenace('poursuite', 5); d.signalerMenace('saisie', 6);
  c = [];
  for (let t = 6; t < 200; t += 0.05) c.push(...d.mettreAJour(t));
  for (let k = 1; k < 10; k++) c.push(...d.avantBloc(k * H96.dureeBloc));
  assert.equal(gains(c, 'tension').length + gains(c, 'danger').length, 0, 'jamais de menace au Comptoir');
  assert.equal(gains(c, 'vie').filter((x) => x.gain === 0).length, 0, 'pas de fenêtre de silence');
});

console.log('\n' + ok + ' tests réussis.');
