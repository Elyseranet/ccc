# ds(table) : tokens de typographie des en-têtes (casse, interlettrage) — demande d'évolution

> Ce n'est pas un défaut : c'est une demande d'évolution.

## Constat

Les en-têtes d'`origam-table` et d'`origam-data-table` n'exposent aucun token, aucune prop et aucune variable pour `text-transform` ni pour `letter-spacing`. Un thème ne peut donc pas obtenir des en-têtes en capitales avec un interlettrage élargi, un motif courant pour les tableaux de données.

Vérifié dans 2.37.3 : `grep -n "text-transform\|letter-spacing"` sur `packages/ds/src/components/Table/OrigamTable.vue` et `packages/ds/src/components/DataTable/*.vue` ne renvoie aucune ligne.

## Reproduction

Un thème qui veut des en-têtes en capitales et en interlettrage `wide` n'a pas d'entrée dans `components` ni dans `vars`. Le projet CCC doit ajouter une règle CSS globale, `.origam-table th { text-transform: uppercase; letter-spacing: var(--origam-font__letterSpacing---wide) }`, en dehors du thème.

## Impact

La règle PROPS-FIRST est contournée par une règle CSS globale côté consommateur, qui dépend du DOM interne (`th`) du composant.

## Proposition

Ajouter les tokens `--origam-table__header-cell---text-transform` et `--origam-table__header-cell---letter-spacing`, avec pour replis `inherit` et `normal` (rendu inchangé). Ils seraient lus par les cellules d'en-tête des deux composants, et thémables. Une prop de typographie d'en-tête serait éventuellement exposée sur le modèle de `ITypographyProps`.

## Critère d'acceptation

1. Avec les deux tokens posés dans un thème, les `th` d'`origam-table` et d'`origam-data-table` sont rendus en capitales, avec l'interlettrage demandé (styles calculés).
2. Sans les tokens, le rendu reste inchangé (pas de régression visuelle).

## Version

2.37.3
