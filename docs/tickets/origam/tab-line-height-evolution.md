# ds(tabs) : `line-height: 1` en dur sur `.origam-tab`, aucun token pour la hauteur de ligne des onglets — demande d'évolution

> Ce n'est pas un défaut : c'est une demande d'évolution.

## Constat

`OrigamTab` impose `line-height: 1` sur sa racine, sans token. Toutes les autres propriétés typographiques de l'onglet passent par des tokens (`--origam-tabs__item---font-size`, `---font-weight`, `---letter-spacing`, `---text-transform`). Un thème ne peut donc pas donner à ses onglets la hauteur de ligne de sa typographie (par exemple 1,55, soit 24,8 px pour 16 px). Le texte et sa boîte diffèrent alors d'une maquette réalisée avec la hauteur de ligne courante.

Constaté dans CCC (F-06, onglets de /regles à 390 px : 1,79 % d'écart sur la zone, uniquement sur le rendu du texte) en 2.37.3.

## Cause

`packages/ds/src/components/Tabs/OrigamTab.vue:301` : `line-height: 1;`, valeur en dur dans la règle racine `.origam-tab`.

## Contournement côté CCC

Une règle à spécificité nulle sur l'enfant `.origam-tab__label` (`OrigamTab.vue:34`), qui n'a pas de `line-height` propre : `:where(.origam-tab__label) { line-height: var(--origam-font__lineHeight---normal) }`. Cette règle dépend du DOM interne du composant.

## Proposition

Ajouter un token `--origam-tabs__item---line-height`, avec un repli à `1` pour garder le rendu actuel. Il serait lu par `.origam-tab` et thémable par `cssVars`, voire exposé en prop (`lineHeight`, via `Pick<ITypographyProps, …>` sur `ITabProps`).

## Critère d'acceptation

1. Avec `--origam-tabs__item---line-height: 1.55` posé par un thème, le libellé de l'onglet a une hauteur de ligne calculée de 1,55 × la taille de police.
2. Sans le token, le rendu reste inchangé (`line-height: 1`).

## Version

2.37.3
