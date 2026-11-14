# Quatre musiques de niveau, à piocher — proposition

> Session musique, 2026-10-09. **Idées validées par le porteur le 2026-10-09** (« C'est parfait »), avec une règle en plus : voir §1 bis. Feu vert le 2026-10-09 : **les quatre kits sont faits et produits** (`niveaux/<kit>/`), avec leurs sons du lieu. Écoute : `niveaux/?kit=chateau` (ou `villa`, `hopital`, `industriel`).
> Demande : quatre ambiances « un peu génériques » où piocher pour les niveaux : **château, villa, hôpital, industriel**.

## 1. Le principe commun : le même gabarit que la Coopérative

Chaque ambiance est un **kit de niveau** qui se branche exactement comme la Coopérative (aucun travail de plus pour le code : `lieu`, `changerZone`, menace `nombre` existent déjà) :

| Pièce | Rôle |
|---|---|
| **Fond** à 3 stems de zone : `dehors`, `dedans`, `profond` | La musique **se retire avec la profondeur** (validé pour la Coopérative) |
| **Exploration** (4 blocs) | Seulement dans la zone la plus sûre |
| **Tension**, **Danger** (+ stem « nombre ») | Propres au lieu, faits de sa matière |
| 3 **signaux** : arrivée, butin rare, sortie | — |
| 1 **son diégétique** (facultatif) | Un objet du lieu qui joue encore |

« Générique » : rien ne nomme un lieu précis ; un kit sert à **tous** les niveaux de ce type (château fort ou abbaye, villa ou manoir du milliardaire, hôpital ou clinique, usine automobile ou chimique). Même grille partout : 84 BPM, blocs de 8 mesures.

## 1 bis. Règle du porteur (2026-10-09) : une musique de base + les sons du lieu, séparés

Les musiques doivent **resservir**. Donc, dans chaque kit :

- **La musique de base** (harmonie, basse, rythme, mélodie) n'est faite que d'instruments et de timbres **neutres** : elle convient à tout niveau du même type.
- **Les sons du lieu** (cloche, piscine, moniteur, pistons…) sont dans un **stem à part, « matière »**, dans chaque pièce où ils jouent (Fond, Exploration, Tension, Danger). Ils restent **accordés et calés** sur la musique, mais on peut les **remplacer** sans toucher au reste.
- **Personnaliser un niveau** = livrer une autre « matière » (par exemple une abbaye au lieu d'un château fort : cloches et chants au lieu des chaînes du pont-levis). Même musique, même poids, autre lieu.
- Sans « matière », la base doit **tenir seule** : c'est vérifié à l'écoute pour chaque kit.

Conséquence pour le moteur (petit ajout, fait avec le premier kit) : choisir la variante de « matière » au chargement du niveau, par exemple `chargerProduction(…, { matiere: 'abbaye' })`. Le directeur ne change pas : « matière » se règle comme les autres stems.

## 2. Les toniques : deux côtés de la carte

On a déjà, côté **dièses**, les lieux de plein air et de survie : terrain **ré**, halte **la**, coopérative **mi**, et le Comptoir en sol.
Proposition : les lieux **construits, du monde d'avant**, passent du côté des **bémols**, et l'usine continue la chaîne des quintes, au plus loin de la maison.

| Kit | Tonique | Pourquoi |
|---|---|---|
| Château | **do** | Le premier bémol à côté de la maison : ancien, solide |
| Villa | **fa** | Un cran plus loin : le luxe, un autre monde |
| Hôpital | **si♭** | Les néons ramenés au si♭ (≈ 58 Hz), comme le ronflement secteur des Voltaïques ramené au la |
| Industriel | **si** | La suite de ré → la → mi → si : le plus loin, le plus mécanique |

## 3. Les quatre ambiances

### 🏰 Château — « la chapelle sans prêtre »
- **Couleur** : pierre, froid, immense réverbération (7 s), le temps arrêté.
- **Mode** : **do mineur harmonique**, la couleur « fantaisie » commune aux familles, avec l'**accord napolitain** (ré♭ majeur) : ancien, presque baroque, jamais « film d'horreur ». Les voix en **quintes parallèles** (organum) : du chant d'église sans paroles.
- **Matière** : cloche lointaine, chaînes du pont-levis, vent dans les meurtrières, horloge de la grande salle, gouttes dans la crypte.
- **Instruments** : violoncelles et violons très doux (sons harmoniques), flûte grave, gong frotté, harpe.
- **Profondeur** : cour et remparts (Exploration) → grande salle → crypte (un bourdon et la cloche, presque rien).
- **Danger** : percussions de bois et de fer, lourdes, lentes, en 3 contre 2.
- **Son diégétique** : l'**horloge** qui sonne encore les heures : un leurre qu'on n'a pas choisi.

### 🏖️ Villa — « le luxe qui tourne à vide »
- **Couleur** : la piscine verte, les baies vitrées, la domotique qui croit encore que Monsieur va rentrer. Le ton Idiocracy (Book 15) : beau et absurde.
- **Mode** : **fa dorien** en accords de neuvième, façon lounge (Khruangbin, la bossa des années 70), qui glisse vers **fa mineur mélodique** quand on s'enfonce.
- **Matière** : eau de la piscine qui clapote, verres en cristal, carillon de la porte, fontaine du hall, volets roulants électriques.
- **Instruments** : onde douce façon piano électrique (la synthèse des Voltaïques), harpe, flûte, balais sur caisse claire (souffle), basse ronde du Comptoir en plus feutrée.
- **Profondeur** : jardin et piscine (Exploration) → salons → cave et bunker en panne (presque rien).
- **Danger** : le groove se casse : verre, métal, la basse qui sature.
- **Son diégétique** : l'**enceinte de la domotique** qui joue encore son lounge, en boucle, sur une seule enceinte qui grésille.

### 🏥 Hôpital — « le cœur de la machine »
- **Couleur** : propre, froid, blanc ; ce qu'on a perdu de plus précieux (Book 20 : le lieu le plus dangereux, ●●●●●).
- **Idée maîtresse** : **84 BPM, c'est un pouls.** Le **bip d'un moniteur cardiaque** donne le tempo, et c'est lui qui accélère avec la Tension.
- **Mode** : **si♭ en quartes empilées**, sans tierce (stérile, ni majeur ni mineur) ; la tierce n'arrive qu'en profondeur, en **si♭ mineur harmonique**.
- **Matière** : bip du moniteur, néon accordé, roulettes de chariot, portes battantes, souffle de la ventilation, goutte-à-goutte d'une perfusion.
- **Instruments** : onde douce, verre, violons en sons harmoniques très aigus, glockenspiel lointain ; presque pas de grave.
- **Profondeur** : hall d'accueil (Exploration) → couloirs et chambres → bloc opératoire et pharmacie (le moniteur seul, puis plus rien).
- **Danger** : le bip s'emballe en rythme irrégulier, les néons claquent.
- **Son diégétique** : l'**appel d'infirmière** qui sonne dans le vide.

### 🏭 Industriel — « la machine qui joue seule »
- **Couleur** : Amon Tobin (Book 16) : le rythme et la matière d'abord. Énorme, métallique, mais pas agressif tant qu'on ne se bat pas.
- **Mode** : **si mineur mélodique** (la♯ et sol♯) : sombre et moderne, sans le cliché « phrygien = danger ».
- **Rythme** : des **machines en polyrythmie** : un piston en 3, un convoyeur en 4, un marteau-pilon en 5, qui ne retombent ensemble qu'une fois par bloc.
- **Matière** : pistons, chaînes de convoyeur, vapeur qui fuit, tôle, sirène lointaine, ronflement électrique.
- **Instruments** : percussions de métal (échantillons VSCO), basse saturée sobre, trombones graves, souffle « métal » des Charbonniers.
- **Profondeur** : parking et quais (Exploration) → ateliers → salle des machines (un seul piston, puis le souffle).
- **Danger** : toutes les machines repartent en même temps.
- **Son diégétique** : la **sirène de fin de poste** qu'un interrupteur relance : un leurre très puissant.

## 4. Ce que ça coûte

- **Par kit** : ≈ 7 Mo sur ordinateur et ≈ 2,5 Mo sur mobile, comme la Coopérative ; on ne charge que le kit du niveau en cours.
- **Ordre proposé** : un kit à la fois, chacun avec sa page d'écoute ; le passage au test iPhone se fait avec la page existante.

## 5. Questions pour le porteur (toutes tranchées le 2026-10-09 : on commence par le château, avec les sons du lieu)

1. Le **principe** (même gabarit que la Coopérative, trois zones de profondeur) : d'accord ?
2. Les **toniques** (do, fa, si♭, si) et l'idée « dièses = dehors, bémols = monde d'avant » : d'accord ?
3. Les **quatre ambiances** : à garder, à changer ? En particulier la **villa lounge** (ironique) et l'**hôpital au pouls de 84 BPM**.
4. Les **sons diégétiques** (horloge, enceinte, appel d'infirmière, sirène) : à faire avec la musique, ou plus tard ?
5. Par quel kit **commencer** ?
