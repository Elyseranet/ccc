# ds(btn) : la bordure d'un bouton `outlined` s'ajoute au padding, sans variable propre à la variante

## Constat

Un `origam-btn` `variant="outlined"` dessine son filet en `border` (OrigamBtn.vue, `&--variant-outlined { border-width: var(--origam-btn---border-width-outlined) }`) : la bordure s'ajoute à la largeur du bouton, alors que le padding est le même pour toutes les variantes (`padding-inline: calc(var(--origam-btn---padding-xl) + …)`). Avec un filet de 2 px, un bouton outlined est donc 4 px plus large qu'un bouton `flat` de même taille et de même texte.

La maquette Happy Hour (joueurs.html, `.btn--outlined`) dessine le filet en `box-shadow: inset 0 0 0 2px` : il ne prend aucune place.

## Mesure (CCC, F-04)

« Comparer deux joueurs », `size="x-large"`, filet de 2 px : 217,66 px dans l'application, 213,66 px dans la maquette. Les deux colonnes suivantes de la grille de recherche en sont décalées.

## Ce qu'il faudrait

Une variable de padding propre à la variante (par exemple `--origam-btn---padding-xl-outlined`), ou un padding qui retranche `--origam-btn---border-width-outlined` pour cette variante.

## Contournement CCC

`src/assets/css/main.css` : une règle sur `.origam-btn.origam-btn--variant-outlined.origam-btn--size-x-large` retranche la largeur du filet du `padding-inline` (limitée à `x-large`, la taille des appels à l'action de formulaire ; les autres tailles outlined de la coque ont leur propre padding). À retirer quand Origam livre la variable.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)
