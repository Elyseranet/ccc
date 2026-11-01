# ds(btn) : alignement du contenu (`justify-content: center`, `text-align: center` avec `wrap`) en dur, aucun token — demande d'évolution

> Ce n'est pas un défaut : c'est une demande d'évolution. Numéro de ticket Origam à attribuer à l'ouverture.

## Constat

`OrigamBtn` aligne toujours son contenu au centre. La prop `wrap` laisse le libellé passer à la ligne, mais les lignes sont alors centrées (`text-align: center`), et le contenu reste centré dans le bouton (`justify-content: center`). Aucune variable ne permet un alignement au début : un bouton de variante `text` utilisé comme lien dans une phrase (nom de joueur dans une ligne de score) ne peut pas couler comme du texte aligné à gauche.

Mesure dans CCC (F-01, tuile « derniers scores », 390 px, `player-link` en mode `inline` + `wrap`) : sans correction, un nom sur deux lignes (« Guillaume / Boutin ») est centré dans sa cellule alors que la maquette l'aligne au début.

## Cause

`packages/ds/src/components/Btn/OrigamBtn.vue` : `&__content { justify-content: center; white-space: nowrap }` (lignes 1185-1188) et `&--wrap { __content { white-space: normal; text-align: center } }` (lignes 1105-1112). Aucune de ces trois valeurs ne lit une variable.

## Contournement côté CCC

Dans `src/components/common/PlayerLink.vue` (mode `inline`) : `:deep(.origam-btn__content) { justify-content: flex-start; text-align: start }`. Il dépend du DOM interne du composant. Le `:deep` est justifié car la valeur est en dur, sans variable.

## Proposition

Lire `var(--origam-btn__content---justify-content, center)` et `var(--origam-btn__content---text-align, center)`, ou une prop `align` (`start` | `center` | `end`).

## Critère d'acceptation

1. Avec `--origam-btn__content---justify-content: flex-start` et `--origam-btn__content---text-align: start`, un bouton `wrap` sur deux lignes aligne ses deux lignes au début.
2. Sans variable, le rendu reste inchangé (centré).

## Version

2.37.4 installée (déclarée `^2.37.3`)
