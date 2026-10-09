/* Watt Now? — intro : la fiche d'accueil des Compteurs, en trois pages, après la cinématique.
   Le ton des Compteurs (Book 15 §3) : pointilleux, honnêtes, ils tamponnent tout ; et dans la marge,
   une note au feutre d'un survivant. Comme l'aide du jeu (Book 14 §4.3), la fiche explique les mécanismes,
   jamais les solutions : pas de recette, pas de lieu, pas de chiffre fin. Rien sur la grande quête ni sur l'argent réel. */

import { C, VISAGES } from './dessins.js';
import { echappe } from './outils.js';

const E = C.encre;
const ICONES = {
  energie: `<circle cx="22" cy="22" r="19" fill="${C.jaune}" stroke="${E}" stroke-width="3"/><path d="M24 7 L13 25 H21 L18 37 L31 18 H23 Z" fill="${C.creme}" stroke="${E}" stroke-width="2.5" stroke-linejoin="round"/>`,
  wott: `<rect x="4" y="10" width="36" height="24" rx="3" fill="${C.creme}" stroke="${E}" stroke-width="3"/><path d="M10 17 H28 M10 23 H22" stroke="${C.canard}" stroke-width="3"/><circle cx="32" cy="27" r="6" fill="none" stroke="${C.rouge}" stroke-width="2.5"/>`,
  decharge: `<rect x="6" y="12" width="28" height="22" rx="3" fill="${C.creme}" stroke="${E}" stroke-width="3"/><rect x="34" y="18" width="5" height="10" fill="${E}"/><rect x="10" y="16" width="8" height="14" fill="${C.rouge}"/>`,
  comptoir: `<path d="M6 20 L22 8 L38 20 Z" fill="${C.canard}" stroke="${E}" stroke-width="3" stroke-linejoin="round"/><rect x="9" y="20" width="26" height="17" fill="#b9a07e" stroke="${E}" stroke-width="3"/><rect x="18" y="26" width="8" height="11" fill="${E}"/>`,
  besoins: `<path d="M22 38 C8 28 4 20 8 13 C12 6 20 8 22 14 C24 8 32 6 36 13 C40 20 36 28 22 38 Z" fill="${C.rouge}" stroke="${E}" stroke-width="3" stroke-linejoin="round"/>`,
  eau: `<path d="M22 5 C30 16 34 22 34 28 A12 12 0 0 1 10 28 C10 22 14 16 22 5 Z" fill="#7fc1cf" stroke="${E}" stroke-width="3"/><path d="M16 28 a6 6 0 0 0 6 6" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
  signature: `<circle cx="22" cy="22" r="18" fill="none" stroke="${E}" stroke-width="3" stroke-dasharray="5 4"/><circle cx="22" cy="22" r="9" fill="none" stroke="${C.ocre}" stroke-width="3"/><circle cx="22" cy="22" r="3.5" fill="${E}"/>`,
  eteint: `<circle cx="22" cy="14" r="9" fill="${C.eteint}" stroke="${E}" stroke-width="3"/><circle cx="19" cy="13" r="2.4" fill="#fff"/><circle cx="26" cy="13" r="2.4" fill="#fff"/><path d="M14 24 H40 M14 30 H38" stroke="${E}" stroke-width="5" stroke-linecap="round"/><path d="M14 22 V40" stroke="${E}" stroke-width="5" stroke-linecap="round"/>`,
  nuit: `<path d="M28 6 A16 16 0 1 0 38 30 A13 13 0 0 1 28 6 Z" fill="#2a3a5a" stroke="${E}" stroke-width="3" stroke-linejoin="round"/><path d="M10 38 C10 32 14 30 14 26 C17 30 20 32 18 38 Z" fill="${C.feu}" stroke="${E}" stroke-width="2"/>`,
  terrain: `<rect x="5" y="5" width="34" height="34" fill="#a8cf7a" stroke="${E}" stroke-width="3"/><path d="M5 16 H39 M5 28 H39 M16 5 V39 M28 5 V39" stroke="#7aa356" stroke-width="1.5"/><path d="M14 30 L22 20 L30 30 Z" fill="${C.bois}" stroke="${E}" stroke-width="2.5" stroke-linejoin="round"/>`,
  carte: `<path d="M5 10 L16 6 L28 10 L39 6 V34 L28 38 L16 34 L5 38 Z" fill="${C.creme}" stroke="${E}" stroke-width="3" stroke-linejoin="round"/><path d="M16 6 V34 M28 10 V38" stroke="${E}" stroke-width="2"/><path d="M10 26 C16 20 24 28 33 16" fill="none" stroke="${C.rouge}" stroke-width="2.5" stroke-dasharray="3 3"/>`,
  familles: `<circle cx="13" cy="15" r="7" fill="${C.charbonniers}" stroke="${E}" stroke-width="2.5"/><circle cx="31" cy="15" r="7" fill="${C.voltaiques}" stroke="${E}" stroke-width="2.5"/><circle cx="22" cy="30" r="7" fill="${C.mecanistes}" stroke="${E}" stroke-width="2.5"/>`,
  temps: `<circle cx="22" cy="22" r="18" fill="${C.creme}" stroke="${E}" stroke-width="3"/><path d="M22 10 V22 L30 27" fill="none" stroke="${E}" stroke-width="3" stroke-linecap="round"/>`,
  repos: `<path d="M6 30 H38 V36 H6 Z M8 30 V20 H18 V30" fill="#b9a07e" stroke="${E}" stroke-width="2.5" stroke-linejoin="round"/><text x="26" y="18" font-family="Futura, sans-serif" font-weight="900" font-size="13" fill="${C.canard}">z z</text>`,
};

const icone = (nom) => `<svg viewBox="0 0 44 44" aria-hidden="true">${ICONES[nom] || ''}</svg>`;

const FAMILLES = {
  charbonniers: {
    nom: 'Les Charbonniers', emoji: '🔥', devise: 'Le feu ne trahit pas.', couleur: C.charbonniers,
    texte: 'Ton énergie, c\'est le <b>feu</b> : le bois, le charbon, la forge. Il chauffe, il cuit, il forge… mais sa <b>fumée</b> et son <b>bruit</b> se repèrent de loin.',
  },
  voltaiques: {
    nom: 'Les Voltaïques', emoji: '⚡', devise: 'Le silence est une arme.', couleur: C.voltaiques,
    texte: 'Ton énergie, c\'est le <b>courant</b> : les batteries, le soleil, les vieux moteurs. Propre et <b>silencieux</b>… mais les pièces sont <b>rares</b>.',
  },
  mecanistes: {
    nom: 'Les Mécanistes', emoji: '⚙️', devise: 'Ce qui tourne ne meurt pas.', couleur: C.mecanistes,
    texte: 'Ton énergie, c\'est le <b>muscle</b>, l\'eau et le vent : le pédalier, la roue, le moulin. Rien ne s\'épuise… mais tout se paie en <b>efforts</b> et en <b>calories</b>.',
  },
};

function pages(famille) {
  const f = FAMILLES[famille] || FAMILLES.charbonniers;
  const Visage = VISAGES[famille] || VISAGES.charbonniers;
  return [
    {
      titre: 'Le monde d\'aujourd\'hui',
      chapeau: 'Bienvenue. Le réseau ne reviendra pas. Ici, l\'énergie se compte, se gagne et s\'échange.',
      points: [
        ['energie', 'L\'énergie se compte en Wh', 'Chaque feu, chaque lampe, chaque machine en dépense. Ce que tes mains savent faire, en revanche, ne coûte rien.'],
        ['wott', 'Le wott, notre monnaie', 'Les Compteurs gardent les dernières réserves. Dépose de l\'électricité au Comptoir : tu reçois des <b>wotts</b>, des bons d\'énergie qui servent à échanger.'],
        ['decharge', 'Un wott se décharge', 'Comme une pile, un bon perd un peu de sa valeur chaque semaine. On l\'échange, on ne l\'entasse pas.'],
        ['comptoir', 'Le Comptoir est neutre', 'On y dépose, on y troque, on y rencontre les autres survivants. En paix.'],
      ],
      note: 'Watty ment. Les Compteurs comptent.',
    },
    {
      titre: 'Rester en vie',
      chapeau: 'Pas de potion, pas de jauge magique. Le froid, la soif ou une plaie mal soignée suffisent à t\'emporter.',
      points: [
        ['besoins', 'Faim, soif, chaleur, sommeil', 'Garde un œil sur tes jauges. Un plat cuit au feu nourrit mieux que du cru.'],
        ['eau', 'L\'eau brute rend malade', 'Fais-la bouillir avant de la boire. L\'eau de pluie, elle, se boit telle quelle.'],
        ['signature', 'Tout ce que tu fais se remarque', 'Le <b>bruit</b>, la <b>fumée</b> et la <b>lumière</b> attirent les Éteints. Le cercle au sol autour de toi montre jusqu\'où porte ton bruit.'],
        ['eteint', 'Les Éteints', 'Lents, sans la moindre pensée. Un seul ne fait pas peur : c\'est le <b>nombre</b> qui tue. Ne te laisse jamais encercler. S\'il t\'attrape, dégage-toi vite.'],
        ['nuit', 'La nuit', 'Seul le feu éclaire, et il se voit de très loin. C\'est l\'heure de dormir dans ton abri.'],
      ],
      note: 'La lumière est belle. Les Éteints sont d\'accord.',
    },
    {
      titre: 'Ta place',
      famille: { ...f, portrait: `<svg viewBox="-70 -320 140 330" aria-hidden="true">${Visage('fiche', { regard: 0 })}</svg>` },
      points: [
        ['terrain', 'Ton terrain', 'Un carré de 50 mètres de côté, rien qu\'à toi. Aucun joueur ne peut t\'y attaquer. Les Éteints, eux, peuvent y venir.'],
        ['carte', 'La carte', 'Pas de monde ouvert : des lieux, sur une carte. Plus un lieu est riche, plus il est loin et dangereux.'],
        ['familles', 'Les trois familles', 'Aucune n\'est meilleure que les autres. Chacune paie son énergie à sa façon : vous aurez besoin les unes des autres.'],
        ['temps', 'Le temps', 'Une journée entière, jour et nuit, passe en 24 minutes.'],
        ['repos', 'Quand tu pars', 'Ton personnage se repose : hors ligne, il ne mange pas, ne boit pas et ne risque rien. Dors dans ton abri avant de partir.'],
      ],
      note: 'Ton carnet te guidera. Lui, au moins, n\'a pas besoin de batterie.',
    },
  ];
}

/**
 * Affiche la fiche, page après page.
 * @param {HTMLElement} conteneur
 * @param {{ famille?: string, page?: number }} o
 * @returns {Promise<void>} résolue quand le joueur a tourné la dernière page
 */
export function afficherFiche(conteneur, o = {}) {
  const liste = pages(o.famille);
  const numero = String(1000 + Math.floor(Math.random() * 9000));
  const fond = document.createElement('div');
  fond.className = 'wi-fiche-fond';
  conteneur.append(fond);

  return new Promise((fini) => {
    let i = Math.max(0, Math.min(liste.length - 1, o.page || 0));
    function montrer() {
      const p = liste[i];
      const derniere = i === liste.length - 1;
      fond.innerHTML = `
        <article class="wi-fiche" role="dialog" aria-modal="true" aria-labelledby="wi-titre-fiche">
          <header class="wi-fiche-entete"><span>Les Compteurs · Fiche d'accueil n° ${numero}</span><span>${i + 1} / ${liste.length}</span></header>
          <h2 id="wi-titre-fiche">${echappe(p.titre)}</h2>
          ${p.chapeau ? `<p class="wi-chapeau">${echappe(p.chapeau)}</p>` : ''}
          ${p.famille ? `<div class="wi-famille-bandeau" style="background:${p.famille.couleur}">${p.famille.portrait}<div><strong>${p.famille.emoji} ${p.famille.nom}</strong><em>« ${p.famille.devise} »</em><p style="margin:6px 0 0;font-size:14px;line-height:1.4">${p.famille.texte}</p></div></div>` : ''}
          <ul class="wi-points">
            ${p.points.map(([ic, titre, texte]) => `<li>${icone(ic)}<span><strong>${titre}</strong>${texte}</span></li>`).join('')}
          </ul>
          ${p.note ? `<p class="wi-note">${echappe(p.note)}</p>` : ''}
          <footer class="wi-fiche-pied">
            <div class="wi-pages" aria-hidden="true">${liste.map((_, k) => `<span class="${k === i ? 'wi-ici' : ''}"></span>`).join('')}</div>
            <button type="button" class="wi-continuer">${derniere ? 'Entrer dans le monde' : 'Continuer'}</button>
          </footer>
          <span class="wi-tampon">${derniere ? 'Dossier ouvert' : 'Vérifié par les Compteurs'}</span>
        </article>`;
      const bouton = fond.querySelector('.wi-continuer');
      bouton.focus({ preventScroll: true });
      bouton.addEventListener('click', () => {
        if (derniere) {
          fond.style.transition = 'opacity 1.2s';
          fond.style.opacity = '0';
          setTimeout(() => { fond.remove(); fini(); }, 1200);
        } else {
          i++;
          montrer();
        }
      }, { once: true });
    }
    montrer();
  });
}
