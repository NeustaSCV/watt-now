/* Watt Now? — intro : le minutage de la cinématique, calé sur le thème principal (musique/theme-principal/theme.js).
   Le thème : 84 BPM, 4/4. Mesures 0-3 jingle Watty et coupure, 4-11 naissance, 12-19 Charbonniers,
   20-27 Voltaïques, 28-35 Mécanistes, 36-43 les trois ensemble, puis une queue de 8 mesures qui boucle. */

export const MESURE = (60 / 84) * 4;          // 2,857 s
export const TELE_FIN = 33;                   // fin du zapping : le thème (et la pub Watty) commence ici
export const THEME = TELE_FIN;
export const COUPURE = THEME + 4.95;          // le « Now? » s'étrangle : coupure de courant
export const NAISSANCE = THEME + 4 * MESURE;  // la radio, la Grande Panne
export const CHARBONNIERS = THEME + 12 * MESURE;
export const VOLTAIQUES = THEME + 20 * MESURE;
export const MECANISTES = THEME + 28 * MESURE;
export const ENSEMBLE = THEME + 36 * MESURE;
export const TITRE = THEME + 44 * MESURE;     // ≈ 2 min 39 : la boucle commence, le titre arrive
export const BOUCLE = 8 * MESURE;             // durée d'un tour de boucle
export const FIN_CINEMATIQUE = TITRE + 6;     // le bouton « Continuer » est là
export const ACCUEIL = 1e6;                   // les écrans d'accueil (src3d/accueil.js) : des plans loin après la cinématique
