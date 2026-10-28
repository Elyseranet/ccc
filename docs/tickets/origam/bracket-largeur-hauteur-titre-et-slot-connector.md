# ds(bracket) : largeur et hauteur de tour en style en ligne, titre centré en dur, slot `connector` vide sans effet — demande d'évolution

> Ce n'est pas un défaut : c'est une demande d'évolution.

## Constat

`OrigamBracket` ne permet pas d'obtenir une disposition fluide (colonnes qui se partagent la largeur, hauteur imposée par le contenu) ni un titre de tour aligné à gauche, et le slot `connector` ne permet pas de supprimer les connecteurs quand on le laisse vide.

Mesuré dans CCC (F-03b, onglet Bracket de l'édition 2025, `origam-bracket` + slot `competitor` + variables au thème, branche de référence `wip/F-03b-origam-bracket`, adf07fa) : zone **23,2 % à 1440 px, 41,0 % à 390 px** contre la maquette (1248 x 814 px, app 1248 x 850 px). Colonnes à 1440 px : x = 21 / 331 / 640 / 949 px dans la maquette, 21 / 309 / 597 / 885 px dans l'app.

## Causes (Origam 2.37.3, `node_modules/origam/dist/src/components/Bracket/`)

1. **Largeur de tour en style en ligne.** `OrigamBracket.vue:611-621` : `roundStyleFor` pose `width: 240px; flex: 0 0 auto` sur chaque tour, depuis la constante `BRACKET_DEFAULT_MATCH_WIDTH` (ligne 435). Aucune variable. La maquette a `repeat(4, minmax(13rem, 1fr))`.
2. **Hauteur minimale en style en ligne.** `OrigamBracket.vue:452` (`totalHeight` = max de matchs par tour x (72 + 24) px) et `:612` (`minHeight`). Aucune variable : 850 px de haut au lieu de 814.
3. **Titre de tour centré en dur.** `OrigamBracketRound.vue:137` : `text-align: center` sans variable.
4. **Slot `connector` vide.** `OrigamBracket.vue:83-92` et `179-186` : le slot enveloppe chaque `<path>` comme contenu de repli. `<template #connector />` ne produit aucun nœud ; Vue 3 rend alors le contenu de repli et les lignes restent dessinées (vérifié à l'écran). Il faut un nœud : `<template #connector><g /></template>`. Le `<svg aria-hidden>` vide reste en place.

## Contournement côté CCC

Aucun : le tableau de l'édition est écrit à la main (`src/components/edition/EditionBracket.vue`). La migration vers `origam-bracket` est suivie par F-03-BRK.

## Proposition

- Lire la largeur de tour dans `var(--origam-bracket-round---width, 240px)` et la hauteur minimale dans `var(--origam-bracket-round---min-height, …)`, sans style en ligne (ou en acceptant `auto` / `1fr` pour une disposition fluide).
- `text-align: var(--origam-bracket-round-title---text-align, center)`.
- Soit une prop pour masquer les connecteurs, soit documenter que le slot `connector` doit contenir un nœud.

## Critère d'acceptation

1. Avec la largeur de tour à `1fr` (ou `auto`) et une hauteur minimale nulle, quatre tours se partagent la largeur du conteneur et la hauteur suit le contenu.
2. Avec `--origam-bracket-round-title---text-align: start`, le titre est aligné à gauche.
3. Avec le slot `connector` vide (ou la prop dédiée), aucun `<path>` n'est rendu.
4. Sans réglage, le rendu reste inchangé.

## Version

2.37.3
