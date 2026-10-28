# ds(table) : la légende visible n'a pas de variable de graisse — demande d'évolution

> Ce n'est pas un défaut : c'est une demande d'évolution.

## Constat

`OrigamTable` rend la légende visible (`caption-visible`) avec des variables pour le remplissage, la taille, la couleur et l'alignement (`--origam-table__caption---padding`, `---font-size`, `---color`, `---text-align`, `OrigamTable.vue:214-221`), mais aucune pour la graisse : la règle `&--visible` ne pose pas `font-weight`, la légende hérite donc de la graisse du tableau (400). Poser `--origam-table__caption---font-weight` n'a aucun effet.

Mesuré dans CCC (F-03b, légende « Poule N » des classements, édition 2025) : la maquette (`.table caption`, `hh.css:103`) la veut en 700. Écart de pixels de la zone poules-tableau : 0,936 % à 1440 px et 0,946 % à 390 px, dont la quasi-totalité vient de la graisse.

## Contournement côté CCC

Aucun : l'écart est laissé en l'état (sous le seuil de 1 %), sans règle locale.

## Proposition

Lire `var(--origam-table__caption---font-weight, inherit)` dans `&--visible`, comme la taille et la couleur.

## Critère d'acceptation

1. Avec `--origam-table__caption---font-weight: 700` posé par un thème, la légende visible est en 700.
2. Sans la variable, le rendu reste inchangé.

## Version

2.37.3
