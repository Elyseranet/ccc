# ds(table) : le séparateur de ligne est un `border-bottom` des `td`, sans variable pour le côté

## Constat

`OrigamTable.vue` (`&__wrapper :deep(td)`) dessine le filet entre deux lignes en `border-bottom` de chaque `td` :

```scss
:deep(td) {
  padding-block: …;
  border-bottom: var(--origam-table__cell---border-width, 1px) solid var(--origam-table__cell---border-color, …);
}
```

Seuls la couleur et l'épaisseur sont thémables ; le CÔTÉ du filet ne l'est pas. Dans un tableau en `border-collapse: collapse` dont l'en-tête (`th`) porte son filet en bas et dont les lignes portent le leur en bas, la première ligne ne reçoit que la moitié du filet de l'en-tête. La maquette Happy Hour (hh.css:106) dessine le séparateur en `border-top` de chaque ligne : le filet de l'en-tête et celui de la première ligne se confondent, et aucune ligne ne porte de filet bas (pas de filet sous la dernière ligne).

## Mesure (CCC, F-04, joueurs.html, 1440 px)

| | application | maquette |
|---|---|---|
| `th` | 44,33 px | 44,33 px |
| filet d'en-tête | 1 px | 1 px |
| haut de la 1re ligne, depuis le haut de l'en-tête | +44,83 px | +45,33 px |
| hauteur de la 1re ligne | 64,5 px | 65 px |
| hauteur des lignes suivantes | 65 px | 65 px |
| hauteur du tableau | 1347,83 px | 1346,83 px |

Toutes les lignes sont décalées d'1 px par rapport à la maquette. Zone annuaire (pixelmatch 0,1) : 0,757 % avant correction, 0,431 % après.

## Ce qu'il faudrait

Une variable ou un token pour le côté du séparateur (par exemple `--origam-table__cell---border-side: top | bottom`), ou une règle de ligne exprimée en `:where()` pour qu'un thème puisse la surcharger.

## Contournement CCC

`src/assets/css/main.css` : `.origam-table .origam-table__wrapper.origam-table__wrapper td { border-top: … ; border-bottom: 0 }`, avec la couleur et l'épaisseur lues dans les tokens d'Origam. Triple classe (0,3,1) pour passer devant le `:deep(td)` d'Origam (0,2,1), comme pour `.origam-field.origam-field.origam-field` (#1254). À retirer quand Origam expose le côté.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)
