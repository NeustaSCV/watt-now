# Inventaire des effets sonores à remplacer

Source : `code/client/src/son/catalogue.ts` (identifiants, variantes, boucles) et `code/client/src/son/recettes.ts`
(contenu de chaque son synthétisé). Relevé du 2026-10-08.

**Règle : un fichier = un événement.** Le jeu répète lui-même les sons (un pas par foulée, un coup de marteau
toutes les ~1 s, un battement de cœur…). Le fichier proposé doit contenir exactement ce que contient le son actuel.
Les sons 🔁 sont des boucles : un fichier qui se raccorde sans couture.

Hors périmètre : ambiances jour/nuit, halte, Comptoir (moteur de musique, `musique/LIVRAISON.md`).

## 1. Pas du joueur — 12 sons × 4 variantes

`pas_{herbe|terre|beton|gravats}_{discrete|marche|course}` : **un seul pas** (talon puis plante), 0,3–0,4 s.

## 2. Éteints

| Identifiant | Contenu d'un fichier | Durée | Var. |
|---|---|---|---|
| `eteint_souffle` | une respiration (inspiration + expiration rauque) | 2,4–3,2 s | 4 |
| `eteint_machoire` | 2–3 claquements d'os de mâchoire | 0,3 s | 3 |
| `eteint_rale` | un râle long dont la hauteur retombe | 1,3–2,3 s | 6 |
| `eteint_rale_coupe` | un râle coupé net + clic de glotte | 0,4–0,6 s | 4 |
| `eteint_tete_craque` | la nuque qui craque (3–5 craquements) | 0,45 s | 3 |
| `eteint_pas` | un pas traînant qui racle | 0,4–0,5 s | 4 |
| `eteint_pas_presse` | un pas lourd et pressé | 0,25 s | 4 |
| `eteint_rale_rapide` | un râle court et rauque (poursuite) | 0,5–0,9 s | 6 |
| `eteint_halete` | 3 halètements courts | 0,9 s | 3 |

## 3. Contact et combat

| Identifiant | Contenu d'un fichier | Durée | Var. |
|---|---|---|---|
| `saisie` | choc mou + tissu agrippé | 0,7 s | 3 |
| `morsure_manquee` | dents qui claquent dans le vide | 0,35 s | 3 |
| `morsure` | tissu qui cède puis chair | 0,7 s | 3 |
| `impact` | coup sourd sur un corps | 0,45 s | 4 |
| `impact_appuye` | le même, plus fort | 0,45 s | 3 |
| `coup_tete` | choc + os qui craque | 0,6 s | 3 |
| `chute_corps` | corps qui tombe (genoux puis buste) | 0,9 s | 3 |
| `sifflement` | arme légère qui fend l'air | 0,2 s | 4 |
| `sifflement_lourd` | arme lourde qui fend l'air | 0,35 s | 3 |
| `esquive` | souffle d'air + 2 appuis rapides sur terre | 0,45 s | 3 |
| `degagement` | on se débat : froissement + coup de coude | 0,35 s | 4 |
| `coeur` | **un seul battement** (deux temps, très grave) | 0,9 s | 2 |
| `effondrement` | chute de corps + 2 battements qui faiblissent | 2,4 s | 1 |

## 4. Gestes et outils

| Identifiant | Contenu d'un fichier | Durée | Var. |
|---|---|---|---|
| `geste_bois` | deux branches qui s'entrechoquent | 0,5 s | 3 |
| `geste_pierre` | un ou deux chocs de pierre | 0,35 s | 3 |
| `geste_feuillage` | froissement de feuilles | 0,8 s | 3 |
| `fouille` | on écarte, 3 petits chocs bois/métal | 1,2 s | 3 |
| `demonter` | clics de clé à cliquet, grincement, écrou | 1 s | 3 |
| `visser` | 3 tours de tournevis | 0,9 s | 3 |
| `marteau_bois` | un coup de marteau sur planche | 0,4 s | 3 |
| `marteau_metal` | un coup de marteau sur métal | 0,8 s | 3 |
| `enclume` | un coup sur ressort à lames, clair et long | 1,6 s | 3 |
| `scie` | 2 allers-retours de scie | 1,2 s | 3 |
| `hache_coupe` | un coup de hache dans le bois | 0,5 s | 3 |
| `aiguiser` | 2 passes de lame sur pierre | 1 s | 3 |
| `tissu` | tissu qu'on déchire | 0,8 s | 3 |
| `bache` | bâche dépliée qui claque | 1 s | 3 |
| `remplir_eau` 🔁 | gourde qui se remplit | boucle 4 s | 1 |
| `bouillir` 🔁 | eau qui frémit | boucle 4 s | 1 |
| `manger` | 4 bouchées croquantes | 1,6 s | 3 |
| `boire` | 3 gorgées | 1,6 s | 3 |
| `briquet` | molette, étincelle, flamme | 1 s | 2 |
| `pierre_a_feu` | 3 frottements de silex | 1,1 s | 2 |
| `pose_pierres` | 3 pierres posées | 1,2 s | 3 |
| `charbon` | morceaux de charbon de bois qui s'entrechoquent | 1,2 s | 3 |

## 5. Feu de camp

| Identifiant | Contenu d'un fichier | Durée | Var. |
|---|---|---|---|
| `buche_tombe` | bûche posée + crépitements | 1 s | 3 |
| `extinction` | dernier souffle, cendres qui sifflent | 1,6 s | 2 |
| `feu_crepite` 🔁 | feu qui crépite | boucle 6 s | 1 |

## 6. Installations

| Identifiant | Contenu d'un fichier | Durée | Var. |
|---|---|---|---|
| `soufflet` | coup de soufflet + braises qui ronflent | 1,4 s | 3 |
| `braises` 🔁 | ronflement grave de forge | boucle 5 s | 1 |
| `trempe` | fer chaud plongé dans l'eau | 1,6 s | 2 |
| `chaine_velo` 🔁 | chaîne de pédalier | boucle 4 s | 1 |
| `roue_libre` | roue libre qui ralentit | 2 s | 2 |
| `meule` 🔁 | meule sur fer + étincelles | boucle 4 s | 1 |
| `pinces` | 2 pinces crocodile sur des bornes | 0,5 s | 3 |
| `bourdonnement` 🔁 | bourdonnement électrique | boucle 3 s | 1 |
| `interrupteur` | un clic | 0,15 s | 2 |

## 7. Faune — 3 variantes chacun

| Identifiant | Contenu d'un fichier | Durée |
|---|---|---|
| `envol` | envol de canards (~12 battements qui s'espacent) | 1,3 s |
| `caquet` | poule : 2–4 « cot » puis « codêêt » | 1,1 s |
| `cancan` | colvert : 2–3 « coin » | 1 s |

## 8. Météo

| Identifiant | Contenu d'un fichier | Durée | Var. |
|---|---|---|---|
| `pluie` 🔁 | pluie sur feuillage | boucle 6 s | 1 |
| `tonnerre` | roulement lointain (2–4 salves) | 6 s | 3 |

## 9. Interface — 9 sons × 2 variantes, 0,3–0,45 s

`ui_{charbonniers|voltaiques|mecanistes}_{ouvrir|fermer|valider}` :
charbonniers = rivet, tôle (2 coups pour valider) ; voltaïques = bips de terminal (2 notes pour valider) ;
mécanistes = crayon, page tournée (2 traits pour valider).

## Sons définis mais pas encore déclenchés par le jeu

`soufflet`, `braises`, `trempe`, `scie`, `hache_coupe`, `aiguiser`.
