# ds(data-list) : la ligne `kv` (grille, fond, rayon, écart, filet) et la casse de la clé ne sont pas thémables — demande d'évolution

> Ce n'est pas un défaut : c'est une demande d'évolution.

## Constat

`OrigamDataList` en mode `kv` expose des variables pour la taille, la graisse et la couleur de la clé, la taille de la valeur, le padding vertical de la ligne, la largeur de la clé et l'écart clé/valeur (`--origam-data-list__kv---*`, `OrigamDataList.vue:387-413`). Plusieurs propriétés d'une « tuile de chiffre » (libellé au-dessus de la valeur, fond sunken, coin arrondi, trois colonnes de tuiles) n'ont aucune variable. CCC doit les poser avec `:deep` sur le DOM interne.

Constaté dans CCC (F-05, bilans du face-à-face, `HeadToHeadSummary.vue`), 2.37.4.

## Propriétés sans variable (posées en `:deep`)

- Ligne (`.origam-data-list__kv-row`) : `grid-template-columns` (clé de 160 px + `1fr` en dur, impossible d'avoir une colonne), `row-gap` (la variable `---gap-key-value` ne règle que `column-gap`), `border-bottom` (1 px transparent, la variable `---row-divider` ne change que la couleur), `padding-inline`, `border-radius`, `background`.
- Clé (`.origam-data-list__kv-key`) : `letter-spacing`, `text-transform`.
- Valeur (`.origam-data-list__kv-value`) : `font-weight`, `font-variant-numeric`.

## Contournement côté CCC

Des règles `:deep(.origam-data-list__kv-row|-key|-value)` dans `src/components/head-to-head/HeadToHeadSummary.vue`, qui dépendent du DOM interne du composant. Tout ce qui a une variable (taille, graisse, couleur de la clé, taille de la valeur, padding vertical) passe par elle.

## Proposition

Ajouter des variables `--origam-data-list__kv---row-columns`, `---row-gap`, `---row-padding-inline`, `---row-radius`, `---row-background`, `---row-border-width`, `---key-letter-spacing`, `---key-text-transform`, `---value-font-weight`, `---value-font-variant-numeric`, avec des replis qui gardent le rendu actuel.

## Critère d'acceptation

1. Avec ces variables posées sur `.origam-data-list`, une ligne devient une tuile (une colonne, fond, rayon, écart de 2 px, clé en capitales) sans `:deep`.
2. Sans les variables, le rendu reste inchangé.

## Version

2.37.4 installée (déclarée `^2.37.3`)
