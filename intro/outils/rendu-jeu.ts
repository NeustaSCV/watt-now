// Watt Now? — intro : le pont vers le rendu du jeu (code/client/src/rendu), empaqueté avec three.js
// dans intro/vendor/rendu-jeu.js par outils/empaqueter.sh. Le jeu n'est pas modifié : on lit ses modules.
export * as THREE from "three";
export { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
export { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
export { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
export { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
export { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
export { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
export { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
export { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
export { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
export { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
export { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
export { clone as clonerSquelette } from "three/examples/jsm/utils/SkeletonUtils.js";
export { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
export { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
export { Personnage, creerArme } from "../../code/client/src/rendu/personnage.ts";
export { Humanoide, chargerHumanoides, humanoidesPrets } from "../../code/client/src/rendu/humanoides.ts";
export { VueEteint } from "../../code/client/src/rendu/eteint.ts";
export { FeuDeCamp, creerFoyer, modeleFoyer, formeDuFeu } from "../../code/client/src/rendu/feu.ts";
export { VueInstallation, creerEscabeau } from "../../code/client/src/rendu/installations.ts";
export { VueRessource, creerMare } from "../../code/client/src/rendu/ressources.ts";
export { creerComptoir, animerComptoir, lumieresComptoir } from "../../code/client/src/rendu/comptoir.ts";
export { creerHalte } from "../../code/client/src/rendu/halte.ts";
export { creerRuine, textureAffiche, textureEnduit, dessiner } from "../../code/client/src/rendu/ruine.ts";
export { decharge } from "../../code/client/src/rendu/decharge.ts";
export { creerTerrain, creerArbres, bruit } from "../../code/client/src/rendu/terrain.ts";
export { Panache } from "../../code/client/src/rendu/panache.ts";
export { FauneAmbiante, creerLapin, poserLapin, creerCanard, creerHeron, poserOiseau } from "../../code/client/src/rendu/faune.ts";
export { PALETTE, materiau, aleatoire } from "../../code/client/src/rendu/materiaux.ts";
export { Assemblage } from "../../code/client/src/rendu/assemblage.ts";
export { APPARENCES_DE_REFERENCE, CARNATIONS, COULEURS_CHEVEUX } from "../../code/commun/src/apparence.ts";
// Le Grand Hôtel des Flots, de la bibliothèque de bâtiments (batiment/, lu sans être modifié) : l'écran d'accueil des lieux lointains
export { FICHE as FICHE_GRAND_HOTEL, creer as creerGrandHotel } from "../../batiment/grand-hotel/modele.js";
