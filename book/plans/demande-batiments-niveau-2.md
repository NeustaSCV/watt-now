# Demande à la session « bâtiments » : les quatre lieux du niveau 2 (0.10)

> De la session du jeu, le 2026-10-14. Source : [`plan-0.10.md`](plan-0.10.md) (§1.3, §3.3, §10) et [`niveau-2.md`](niveau-2.md) (§9, §10).
> **Quatre modèles existants** sont à compléter pour entrer dans le jeu : `grand-hotel` (L2A), `phare` (L2B), `halte-route-pont` (H2A), `halte-corniche` (H2B).
> **Le principe de cette demande : simplifier le travail du jeu.** Tout ce qui change d'état (une porte, une épave, la marée) est **un objet nommé à part** que le jeu montre ou cache ; aucun mécanisme n'est animé dans le modèle ; un lieu tient dans **un seul repère**.

---

## 0. Ce qui vaut pour les quatre modèles

| # | Règle | Pourquoi |
|---|---|---|
| T1 | **Un seul repère par lieu** : tout ce que le joueur visite tient dans le lot du jeu, même ce qui est « ailleurs » (l'étage de l'hôtel est posé **à côté** du rez-de-chaussée, au sol, hors de vue ; le jeu y téléporte le joueur avec un fondu au noir) | Le jeu ne sait pas gérer deux niveaux superposés ni plusieurs cartes pour un lieu personnel ; une téléportation dans le même repère ne coûte presque rien |
| T2 | **Les objets qui changent d'état sont à part et nommés** (`userData.nom`), chacun dans ses deux états si besoin (`…_avant`, `…_apres`) : le jeu cache l'un, montre l'autre | Comme les battants de la grande porte du Moulin (demande du 2026-10-10, n° 5) : le jeu ne doit plus aplatir de triangles |
| T3 | **Les objets qu'on prend** sont à part et nommés : le jeu les efface quand on les ramasse | Idem |
| T4 | **Passages : 1,2 m au moins** (le personnage fait 0,7 m) ; un passage à **sens unique** est visible et crédible (saut, éboulis, échelle tombée) et noté dans la `FICHE` | Leçons du Moulin (passages de 0,58 et 0,74 m) |
| T5 | **Les bords du lot** sont visibles (clôture, haie, talus, rive, falaise) là où l'on bute | Leçon du Moulin (sept bords invisibles, 0.8.2) |
| T6 | **Pièces et portes** nommées pour la vision par pièce ; **points de fouille** et **places d'Éteints** dans la `FICHE`, avec leur nature (errant, dormeur, rampant, Noyé, Ensablé) | Le jeu les reprend tels quels |
| T7 | **Budgets** (Book 17) : ≤ 60 000 triangles, ≤ 40 appels de dessin, ≤ 8 lumières **par carte** ; les gros éléments qui cachent le joueur (toits, coupoles, épave) dans une **couche qui s'efface** | iPhone 13 mini à 60 images par seconde |
| T8 | **Aucun objet-clé d'un autre niveau visible** dans le décor (R15) : pas de lampe-tempête, de couverture de laine, de cloche, de rabot, de jerrican **en dehors des places demandées** ci-dessous ; les couvertures du décor des haltes sont des **couvertures polaires** | Une clé ne traîne pas avant son lieu |
| T9 | **Aucune arme à feu** prenable ; un fusil reste du décor (Book 15) | Le ton |

---

## 1. Le Grand Hôtel des Flots (L2A) — « le check-in »

**Le parcours que le modèle doit porter** : on arrive par la promenade ; on prend la **batterie du panneau « Zéro-Effort »** et on la porte à la **borne** du hall ; on **dégage le robot-serveur** ensablé dans la salle à manger et on porte **sa tête** à la borne ; la borne remet la **carte de la chambre 7** ; on prend **l'ascenseur** ; à l'étage, les chambres, la lingerie, la suite et leurs objets-clés ; on ressort par le **balcon effondré** sur la dune (on saute, on ne remonte pas).

| # | Demande |
|---|---|
| H1 | **Un seul lot** pour le jeu : la façade, la terrasse, la piscine et l'intérieur (réception, salle à manger, cuisines) **assemblés**, au lieu de deux cartes |
| H2 | **L'étage**, posé **à côté** du rez-de-chaussée dans le même lot, hors de vue (derrière un mur aveugle ou une dune haute) : le couloir, **4 à 6 chambres** dont la **chambre 7**, **la lingerie** (draps qui pendent), **la suite** (lit à baldaquin), le palier de l'ascenseur, la **chambre au balcon effondré** |
| H3 | **L'ascenseur à grille** : la cabine en bas (hall) et en haut (palier), chacune avec sa **grille nommée** (`grille_ascenseur_bas`, `grille_ascenseur_haut`) ; pas de cabine qui bouge |
| H4 | **La borne « Check-in par sourire »** dans le hall, nommée (`borne_checkin`), avec son **écran éteint** et son **écran allumé** à part |
| H5 | **Le robot-serveur ensablé** dans la salle à manger : le corps dans le sable, et **la tête à part** (`tete_robot`), qu'on emporte ; un petit monticule de sable à part (`sable_robot`) que le jeu efface quand on a creusé |
| H6 | **Le panneau « Zéro-Effort »** de la promenade et **sa batterie à part** (`batterie_panneau`) |
| H7 | **Le balcon effondré** : de la chambre au balcon (à l'étage, côté mer) **jusqu'à la dune** devant la façade. Le jeu fera le saut ; le modèle montre l'endroit d'où l'on saute (garde-corps tordu) et celui où l'on retombe (le balcon tombé sur la dune) |
| H8 | **Places des objets-clés, toutes à l'étage** (la partie du fond, R49), à part et nommées : les **couvertures de laine** à la lingerie ; la **lanterne-tempête** dans la suite ; la **boîte de roulements** et le **fer à souder** dans la **machinerie de l'ascenseur** (une petite salle d'entretien sur le palier) ; les **tôles ondulées** empilées dans la **chambre au balcon effondré** (on rapiéçait le toit) |
| H9 | **Le pied de guéridon en fonte** sur la terrasse : un guéridon renversé dont le pied se démonte (le pied à part, `pied_gueridon`) |
| H10 | **Points d'Éteints** : des clients couchés dans les transats et dans les chambres (dormeurs), **l'Ensablé** dans la dune de la salle à manger (une silhouette à moitié sous le sable), **des Noyés** dans la piscine ; le groom, le maître-nageur, le marchand de glaces (déjà prévus) |
| H11 | **Fouilles** : les salles de bains des chambres (fil dentaire, savon, serviettes), la lingerie, les cuisines (déjà prévues) |

---

## 2. Le phare du cap (L2B) — « le feu et le cargo »

**Le parcours** : on arrive par la grille du sud ; on prend **l'escabeau** du hangar et on le porte au pied de la tour (l'escalier s'arrête à 3 m) ; on monte ; on remplit **le bidon de pétrole** à la cuve et on ramasse **un prisme** tombé, qu'on remonte à la lanterne ; **la nuit**, on allume ; les Éteints montent du chemin des douaniers ; on peut **sonner la corne de brume** pour les attirer vers la falaise ; **le cargo** s'échoue dans la crique ; on descend par **la rampe du canot** (un tronçon effondré : on ne remonte pas) jusqu'à l'épave et ses **conteneurs ouverts** ; on ressort par la grève de galets.

| # | Demande |
|---|---|
| P1 | **La crique et l'épave dans le lot** (déjà en partie : la rampe, la grève) : **l'épave du cargo** en deux états — **avant** : rien (la mer) ; **après** : un porte-conteneurs éventré sur les rochers (`epave_apres`), dans une **couche qui s'efface** |
| P2 | **Trois ou quatre conteneurs ouverts** où l'on marche (au pied de l'épave, sur la grève ou sur les rochers plats), avec une **passerelle** ou un éboulis praticable ; ils n'apparaissent qu'avec l'épave (dans `epave_apres`) |
| P3 | **Places des objets-clés, toutes dans l'épave** (la partie du fond, R49), dans l'état « après » : **la cloche du cargo** (sur la proue, accessible) ; dans les conteneurs (une « livraison du jour » éventrée : cartons, palettes) : **la porte de four en fonte**, **le soufflet de forge**, **le rabot** (un conteneur d'outillage) et **le jerrican de 20 L** (les bidons du bord) |
| P4 | **L'escalier coupé à 3 m** au pied de la tour, et **l'endroit où l'on pose l'escabeau** (une marque au sol) ; **l'escabeau du gardien** dans le hangar, à part (`escabeau_phare`) |
| P5 | **La lanterne** en deux états : **éteinte** et **allumée** (`lanterne_eteinte`, `lanterne_allumee` : le verre éclairé, un halo) ; **le prisme manquant** de la lentille, à part (`prisme_manquant`, caché tant qu'on ne l'a pas remis) et **un prisme tombé** au pied de la tour, à part (`prisme_tombe`) |
| P6 | **La cuve à pompe** et **un bidon** à côté (`bidon_petrole`) |
| P7 | **La corne de brume** et son **compresseur** (déjà là) : une **courroie cassée** à part (`courroie_compresseur`) que le jeu remplace par une courroie neuve quand on répare |
| P8 | **La rampe du canot** : le tronçon effondré **franchissable dans un seul sens** (de la plateforme vers la grève : on saute ~1,5 m) |
| P9 | **Le chemin des douaniers** du sud jusqu'à la grille : de la place pour **8 à 10 Éteints dormeurs** couchés le long du chemin (ils se lèveront quand la lanterne s'allume) |
| P10 | **Le harpon du gardien**, accroché au-dessus de la cuisinière, à part (`harpon`) |
| P11 | **Des Noyés** dans la crique (au bord de l'eau, sur la grève) |

---

## 3. La route du pont (H2A)

| # | Demande |
|---|---|
| R1 | **La marée** : les **bancs de vase** du quai en deux états — **découverts** (`maree_basse` : vase, trottinettes et caddies échoués, la mobylette) et **sous l'eau** (`maree_haute` : l'eau plus haute, les bancs cachés) ; l'**échelle de marée** peinte du quai, lisible |
| R2 | **Points de fouille sur les bancs** (visibles seulement à marée basse) : des **trottinettes d'enfant**, des **caddies**, une **mobylette** (la bobine), une **débroussailleuse** |
| R3 | **Le péage** au portique du pylône ouest : une **caisse** au pied du poste de guet (`caisse_peage`), où l'on dépose son dû, et **la chicane** avec un passage qui s'ouvre (`chicane_ouverte`, `chicane_fermee`) |
| R4 | **La brèche** (goulet existant) : 1,2 m de planches au moins |
| R5 | **Le hangar des canotiers** : le **moteur hors-bord** sur l'établi (la bobine), fouillable |
| R6 | **Le vrac** : un tas de ferraille au pied de la grue de quai (barres, lames de ressort), des câbles de cuivre au portique « connecté », un bidon d'huile ; et **des pierres** (le quai éboulé) |
| R7 | **Des Noyés** dans la vase, et quelques Éteints aux goulets |

---

## 4. La corniche du Cap Rouge (H2B)

| # | Demande |
|---|---|
| C1 | **Le pin d'Alep tombé** en travers d'un dégagement (pas sur la route) : le **tas de bois personnel** du joueur ; un tronc débité à part (`pin_debite`) que le jeu montre quand on a pris le bois |
| C2 | **Le péage du tunnel** : la même **caisse** au pied de la barricade (`caisse_peage`) et le passage de 2 m qui s'ouvre (`barricade_ouverte`, `barricade_fermee`) |
| C3 | **Le vrac de pierres** : l'éboulement (des blocs au pied, qu'on ramasse) et les murets écroulés |
| C4 | **L'éboulement** (goulet existant) : le ruban de 2,5 m, bien lisible |
| C5 | **Les chambres du Panoramique** fouillables (fil dentaire, couvertures **polaires**, literie) |

---

## 5. Après la livraison

La session du jeu importera les modèles (`npm run batiments:importer`, liste `A_COPIER`), reprendra les points de la `FICHE` et signalera dans une **réponse** (comme `reponse-batiment-moulin.md`) ce qui reste à retoucher.

---

## 6. Complément (2026-10-14), après la livraison

> Merci pour la livraison (`.claude-travail/propositions/reponse-batiments-niveau-2.md`). Le porteur a tranché les trois points de la réponse ; deux demandent une retouche.

| # | Demande | Pourquoi |
|---|---|---|
| K1 | **Route du pont : ramener le banc de vase fouillable au niveau d'une cale basse** (comme vous le proposiez), à peu près à hauteur du quai bas, avec un accès praticable (rampe douce ou quelques marches) ; garder `maree_basse` / `maree_haute` et `obstaclesMareeHaute`. Indiquer dans la `FICHE` **le point en haut de l'escalier** où le jeu remettra un joueur resté sur le banc quand la mer monte | Le jeu fait marcher tout le monde à plat : un banc 8 m plus bas demanderait de gérer le relief partout pour une halte |
| K2 | **Phare : exporter une fonction `hauteurSol(x, z)`** (dans le repère du jeu, ou avec la conversion écrite dans la `FICHE`) qui donne la hauteur du sol où l'on marche : la tour et l'enclos (0), la rampe du canot (la pente), la grève (≈ − 8,8), le pont de l'épave et les conteneurs (≈ − 4,1, seulement quand `epave_apres` est visible : un second paramètre ou une seconde fonction). Hors des endroits où l'on marche, n'importe quelle valeur | Le relief du phare est gardé (le scénario en a besoin) ; le client posera les personnages sur cette hauteur, le serveur reste en 2D. Au gué, le jeu a dû recopier la fonction `hauteur` du modèle faute d'export |
| — | **L'étage de l'hôtel** : rien à faire, le jeu cache le groupe `etage` ou `rez_de_chaussee` | — |
| — | **Les deux caisses de péage** : rien à faire, on les garde | — |
