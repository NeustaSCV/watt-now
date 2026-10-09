// Le mode « obstacles » (0.7.1) : `?obstacles=1` dans l'adresse, et seulement alors (ce fichier n'est même pas
// chargé sinon). Il dessine en surimpression ce qui bloque le déplacement dans le lieu où l'on est, et dit si l'on
// voit quelque chose à cet endroit (rendu/controle-obstacles.ts) :
// - obstacles en vert (un mur, une haie, une épave… le matérialise) ou en rouge (rien de visible : barrière invisible) ;
// - sorties en bleu, bornes de la zone en jaune, bords qu'on touche à pied en orange (matérialisés) ou rouge.
// Un petit panneau résume le contrôle. La molette dézoome plus loin que d'habitude ; `?obstacles=ensemble` centre la
// caméra sur le lieu (et non sur le personnage), dézoomée pour le voir en entier.

import * as THREE from "three";
import type { Sortie, Zone } from "../../../commun/src/lieux.ts";
import { controlerLieu, dessinControle, resumeControle } from "../rendu/controle-obstacles.ts";
import type { Scene } from "../rendu/scene.ts";

export interface SourcesObstacles {
  scene: Scene;
  /** Le lieu, sa zone (à la Coopérative, selon les portes) et ses sorties. */
  lieu: () => string;
  zone: () => Zone;
  sorties: () => readonly Sortie[];
  /** Ce qu'on voit du lieu : le décor, les vestiges et ressources posés par le serveur, les installations. */
  visibles: () => THREE.Object3D[];
}

export interface ControleEnDirect {
  /** À chaque image : redessine si le lieu, la zone ou ce qu'on voit a changé. */
  maj(): void;
}

export function demarrerObstacles(s: SourcesObstacles, ensemble = false): ControleEnDirect {
  s.scene.zoomMax = 4;
  const panneau = document.createElement("div");
  panneau.style.cssText =
    "position:fixed;left:8px;bottom:8px;z-index:50;max-width:min(92vw,520px);padding:6px 9px;border-radius:6px;background:rgba(10,12,16,.82);color:#f2f2f2;font:12px/1.4 ui-monospace,Menlo,monospace;pointer-events:none;white-space:pre-wrap";
  document.body.append(panneau);
  let dessin: THREE.Group | null = null;
  let cle = "";
  return {
    maj() {
      const zone = s.zone();
      const visibles = s.visibles();
      // Ce qu'on voit change quand des ressources arrivent, se regroupent (lots), disparaissent : on compte ce qui se dessine.
      let dessines = 0;
      for (const v of visibles) {
        v.traverseVisible((o) => {
          dessines += o instanceof THREE.BatchedMesh ? o.instanceCount : o instanceof THREE.InstancedMesh ? o.count : 1;
        });
      }
      const nouvelle = `${s.lieu()}|${zone.obstacles.length}|${zone.xMin},${zone.xMax},${zone.zMin},${zone.zMax}|${dessines}`;
      if (nouvelle === cle) return;
      cle = nouvelle;
      if (dessin) {
        s.scene.scene.remove(dessin);
        dessin.traverse((o) => {
          if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
            o.geometry.dispose();
            (o.material as THREE.Material).dispose();
          }
        });
      }
      if (ensemble) {
        // Vue d'ensemble : la caméra au centre du lieu, dézoomée pour le voir en entier (dans la limite du zoom).
        s.scene.cibleForcee = { x: (zone.xMin + zone.xMax) / 2, z: (zone.zMin + zone.zMax) / 2 };
        s.scene.reglerZoom(Math.max(zone.xMax - zone.xMin, zone.zMax - zone.zMin) / 13);
      }
      const controle = controlerLieu(zone, s.sorties(), visibles);
      dessin = dessinControle(zone, s.sorties(), controle);
      s.scene.scene.add(dessin);
      const rouges = controle.obstacles.filter((o) => o.trous.length).map((o) => `  obstacle sans rien de visible : x ${o.boite.x.toFixed(1)}, z ${o.boite.z.toFixed(1)} (${Math.round(o.couverture * 100)} % couvert)`);
      const bords = controle.bords.filter((b) => b.trous.length).map((b) => `  bord invisible : (${b.morceau.x1.toFixed(1)}, ${b.morceau.z1.toFixed(1)}) → (${b.morceau.x2.toFixed(1)}, ${b.morceau.z2.toFixed(1)})`);
      panneau.textContent = [`Obstacles · ${s.lieu()} · ${resumeControle(controle)}`, ...rouges, ...bords].join("\n");
      console.info(panneau.textContent);
    },
  };
}
