# Consigne des agents : les quatre lieux du niveau 2 (0.10)

Cette consigne **complète** `CONSIGNE-AGENTS.md` (et `CONSIGNE-HALTES.md` pour les haltes) : lis-les d'abord. La demande
du jeu est `book/plans/demande-batiments-niveau-2.md` (lecture seule) : **lis sa section 0 et la section de ton lieu**.
Tu ne retouches **qu'un modèle existant**, dans son dossier `batiment/<id>/`. Une sauvegarde de l'état d'avant est
déjà faite par la session principale : tu n'as rien à copier.

## Les formats communs (pour que le jeu reprenne tout de la même façon)

### Les objets nommés (T2, T3)

- Chaque objet qui change d'état ou qu'on prend est **un `THREE.Object3D` à part** (un groupe ou un maillage, de
  préférence **une seule matière**), ajouté par `b.ajouter(...)`, avec `name` **et** `userData.nom` égaux à
  l'identifiant demandé (`tete_robot`, `epave_apres`…).
- `FICHE.objets` : `{ identifiant: "ce que c'est, en français" }`, pour tous ces objets.
- `creer()` range les objets dans `groupe.userData.objets = { identifiant: Object3D }`, comme le moulin
  (`batiment/moulin/modele.js`, fin de `creer`).
- **État de départ visible, l'autre caché** (`visible = false`) : `…_fermee`, `…_eteinte`, `…_avant`, `maree_basse`
  sont visibles ; `…_ouverte`, `…_allumee`, `epave_apres` (et tout ce qu'elle contient), `maree_haute`,
  `prisme_manquant`, `pin_debite`, l'écran allumé de la borne, sont cachés.
- Un objet d'un état « après » qui contient des objets qu'on prend : ces objets sont **ses enfants** nommés, et aussi
  listés dans `userData.objets`.
- Les **objets-clés** (couvertures de laine, lanterne-tempête, roulements, fer à souder, tôles, cloche, porte de four,
  soufflet, rabot, jerrican) sont des objets nommés aussi (par ex. `couvertures_laine`, `lanterne_tempete`,
  `roulements`, `fer_a_souder`, `toles`, `cloche_cargo`, `porte_four`, `soufflet`, `rabot`, `jerrican`), avec un point
  de fouille dans la `FICHE` à leur place.
- Aucun mécanisme animé pour ces objets : le jeu montre, cache ou efface.

### Les pièces et les portes (T6), pour la vision par pièce

```js
pieces: { hall: { nom: "le hall", sombre: false, boites: [{ x, z, l, p }] }, … },   // boîtes centrées, l en x, p en z
portes: [{ id: "hall_salle", x, z, largeur: 1.4, axe: "x", entre: ["hall", "salle"] }, …], // axe = sens du mur
```

`dehors` est la pièce par défaut (sans boîte). Toute porte fait **1,2 m au moins entre ses morceaux d'obstacle**
(vérifie au calcul : `mur()` découpe en colonnes d'environ 0,4 m et n'ouvre une colonne que si son milieu tombe dans
l'ouverture ; prends une largeur qui ouvre trois colonnes entières).

### Les passages à sens unique et les téléportations

```js
sensUnique: [{ id, de: { x, z }, vers: { x, z }, nature: "on saute du balcon sur la dune" }],
teleports:  [{ id: "ascenseur", bas: { x, z }, haut: { x, z }, nature: "…" }],   // hôtel seulement
```

### Les Éteints et les fouilles

`eteints: [{ x, z, type }]` avec `type` parmi `errant`, `dormeur`, `rampant`, `Noyé`, `Ensablé` (on peut préciser :
« dormeur (client du transat) »). `fouille: [{ x, z, quoi }]`.

## Les règles

- **T1 un seul repère** ; **T4 passages ≥ 1,2 m** ; **T5 bords du lot visibles** là où l'on bute ; **T7 budgets** ;
  **T8 aucun objet-clé d'un autre niveau** : cherche dans ton modèle et enlève (ou change en autre chose) toute
  lampe-tempête, couverture de laine, cloche, rabot, jerrican, porte de four, soufflet hors des places demandées ; les
  couvertures du décor deviennent des **couvertures polaires** (couleurs vives synthétiques) ; **T9** aucun fusil
  prenable.
- **Budget mesuré le pire cas** : tous les états visibles à la fois (avant **et** après), à l'usure 1. ≤ 60 000
  triangles, ≤ 40 appels, ≤ 8 lumières **par carte / tronçon**. Si ça déborde, allège le décor lointain (arbres,
  touffes, gravats) plutôt que les endroits où l'on joue.
- Garde le **soin visuel** : c'est un jeu qui doit faire rêver. Ce qu'on ajoute (épave, étage) doit être aussi beau que
  le reste.
- Mets à jour la `FICHE` (`reperes`, `entrees`, `fouille`, `eteints`) pour qu'elle décrive le nouveau parcours.
- **Périmètre** : tu n'écris **que** dans `batiment/<ton-id>/`. Pas de `/tmp`, pas de commit, pas de serveur à lancer
  (le serveur tourne déjà sur le port 8792). Ne touche ni à `commun/`, ni à `catalogue.js`, ni aux `README.md` /
  `CONSIGNE-*.md` : la session principale s'en charge à partir de ton rapport.
- Navigateur : **ton propre onglet** (`tabs_create`, puis `navigate` avec ce `tabId`), fermé à la fin. Avant de
  recharger, force le cache : `await fetch('/<id>/modele.js', { cache: 'reload' })` (et tes autres fichiers).
- Pour mesurer les passages, tu peux lire `groupe.userData.obstacles` dans la page (`import()` du module) et calculer
  les écarts entre segments.

## Rapport final (court, en français)

- ce qui est fait, demande par demande (H1… / P1… / R1… / C1…), avec les coordonnées utiles au jeu ;
- les budgets mesurés (pire cas, usure 0,1 et 1) par carte ou tronçon ;
- les identifiants des objets nommés et leur état de départ ;
- ce qui n'a pas pu être fait, et pourquoi ;
- les objets d'autres niveaux retirés du décor (T8).
