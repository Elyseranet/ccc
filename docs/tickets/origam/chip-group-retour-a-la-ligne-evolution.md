# ds(chip-group) : les puces ne passent pas à la ligne, la prop `column` est sans effet — demande d'évolution

> Ce n'est pas un défaut : c'est une demande d'évolution.

## Constat

`OrigamChipGroup` repose sur `OrigamSlideGroup` : les puces sont dans `.origam-slide-group__container`, un conteneur flex qui défile sur une seule ligne. Un groupe de filtres qui doit passer à la ligne sur mobile (comme la maquette de l'édition à 390 px) n'a aucun moyen de le demander. La prop `column` ajoute la classe `origam-chip-group--column` (`OrigamChipGroup.vue:154`), mais aucune règle CSS ne la lit : elle est inerte. Il n'existe aucune variable pour `flex-wrap`, `overflow` ou l'écart entre puces.

Constaté dans CCC (F-03b, filtres de l'onglet Matchs) en 2.37.3.

## Contournement côté CCC

`:deep(.origam-slide-group__container) { flex-wrap: wrap; overflow: visible }` dans `EditionMatches.vue`, plus une marge sur chaque puce pour l'écart. Il dépend du DOM interne du composant.

## Proposition

Soit donner un effet à `column`/`wrap` (retour à la ligne), soit exposer `--origam-slide-group__container---flex-wrap`, `---overflow` et `---gap` avec un repli sur le comportement actuel.

## Critère d'acceptation

1. Avec le réglage de retour à la ligne, trois puces trop larges pour la ligne passent sur la ligne suivante, sans défilement horizontal.
2. Sans le réglage, le rendu reste inchangé.

## Version

2.37.3
