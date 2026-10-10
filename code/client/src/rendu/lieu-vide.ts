// Un lieu branché vide (plan 0.8, chantier 4) : le gué et le Moulin, en attendant leur rendu (chantiers 11 et 12,
// `client/src/rendu/gue.ts` et `client/src/rendu/moulin.ts`, depuis les modèles de `batiment/`). On y arrive, on en
// repart : un sol, un chemin de terre d'une sortie à l'autre, et à chaque sortie un panneau qui dit où elle mène.

import * as THREE from "three";
import { LIEUX, distanceKm, sortiesDe, zoneDe, type LieuJouable } from "../../../commun/src/lieux.ts";
import { PALETTE, materiau, nommer } from "./materiaux.ts";
import { creerPanneauRoute } from "./terrain.ts";

export function creerLieuVide(lieu: LieuJouable): THREE.Group {
  const groupe = new THREE.Group();
  const zone = zoneDe(lieu);
  const cx = (zone.xMin + zone.xMax) / 2;
  const cz = (zone.zMin + zone.zMax) / 2;
  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry(zone.xMax - zone.xMin + 40, zone.zMax - zone.zMin + 40).rotateX(-Math.PI / 2).translate(cx, 0, cz),
    materiau(PALETTE.herbeSeche),
  );
  sol.receiveShadow = true;
  groupe.add(sol);
  const noms = ["sol"];

  // Un chemin de terre de chaque sortie jusqu'au milieu du lieu.
  const terre = materiau(PALETTE.terre);
  for (const s of sortiesDe(lieu)) {
    const dx = cx - s.boite.x;
    const dz = cz - s.boite.z;
    const long = Math.hypot(dx, dz);
    const chemin = new THREE.Mesh(new THREE.PlaneGeometry(3, long).rotateX(-Math.PI / 2), terre);
    chemin.rotation.y = Math.atan2(dx, dz);
    chemin.position.set(s.boite.x + dx / 2, 0.02, s.boite.z + dz / 2);
    chemin.receiveShadow = true;
    groupe.add(chemin);
    noms.push("chemin");
  }

  // Le panneau de chaque sortie, un peu en retrait, tourné vers qui arrive du milieu du lieu.
  for (const s of sortiesDe(lieu)) {
    const vers = LIEUX[s.vers];
    const km = String(distanceKm(lieu, s.vers)).replace(".", ",");
    const titre = s.sansArrivee ? s.libelle.replace(/^Prendre le /, "") : vers.nom;
    const sousTitre = s.sansArrivee ? `${vers.nom.replace(/^Le /, "")} · ${km} km` : `${km} km`;
    const ox = Math.sign(cx - s.boite.x) * 3;
    const oz = Math.sign(cz - s.boite.z) * 3;
    groupe.add(creerPanneauRoute(titre, sousTitre, s.boite.x + ox + 2.5, s.boite.z + oz - 2.5, Math.atan2(cx - s.boite.x, cz - s.boite.z)));
    noms.push("panneau");
  }
  nommer(groupe, noms);
  return groupe;
}
