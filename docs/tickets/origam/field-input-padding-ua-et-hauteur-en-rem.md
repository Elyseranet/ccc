# ds(field) : le retrait de 2 px de l'`<input>` n'est jamais remis à zéro, et la hauteur minimale compte l'interligne en `1.5rem`

## Constat

Mesuré sur `/joueurs` (F-04, F-15), contre `.input` de `docs/design/ui/happy-hour/hh.css` (l. 117-121).

1. **Retrait de l'`<input>`** : `OrigamField.vue` ne remet jamais à zéro le `padding` de l'élément `input` (valeur du navigateur : `1px 2px`). Le texte d'un champ texte démarre donc 2 px après le retrait du champ (`--origam-field---padding-start`), alors que le texte d'un `select` (`<div class="origam-select__selection">`, sans retrait propre) démarre au retrait du champ. Avec un même `padding-start`, un champ texte et un sélecteur n'ont pas le même retrait (écart de 2 px entre les deux).
2. **Hauteur minimale en `rem`** : `.origam-field__input { min-height: max(calc(var(--origam-input__control---height) + var(--origam-input---density)), 1.5rem + padding-top + padding-bottom) }` compte une ligne de `1.5rem` (24 px) quel que soit `--origam-input---line-height`. Dès que l'interligne dépasse 24 px (1,55 × 16 = 24,8 px, celui du texte courant de la maquette), un champ dont la hauteur est dictée par ses retraits (cas de `AdminEditionSelect`, 44 px = 9 + 24 + 11) grandit de 0,8 px (44,8 px).

Les trois autres écarts constatés sont des jetons qui existent déjà et se règlent par le thème, sans CCC-contournement :
- `--origam-input---line-height` (défaut 1,5) ;
- `--origam-field---letter-spacing` (défaut 0,009375 em = 0,15 px) ;
- `--origam-field__input---opacity` (défaut 0,7, posé sur `.origam-field__input`, qui assombrit la valeur et le placeholder, et dont l'opacité du placeholder de F-00s se multiplie).

## Mesure (CCC, F-15, base develop 6f31524)

Champ « Nom ou pseudo » et sélecteur « Édition jouée » de `/joueurs`, contre `#q` et `select.input` de `joueurs.html`. Centroïde vertical de l'encre du texte (moyenne des pixels de l'écart de luminance, clip de 140 px à 16 px du bord du champ), puis zone `joueurs-recherche` du test visuel :

| | maquette | application avant | application après |
|---|---|---|---|
| interligne calculé de l'input | 24,8 px | 24 px | 24,8 px |
| interlettrage | normal | 0,15 px | normal |
| opacité du conteneur de saisie | 1 | 0,7 | 1 |
| début de l'encre du placeholder (x) | 59 @390 | 60 | 59 |
| début de l'encre de la valeur du sélecteur (x) | 58 @390 | 57 | 58 |
| centroïde y du placeholder @390 | 457,08 | 458,08 | 457,08 |
| centroïde y de la valeur du sélecteur @390 | 540,97 | 541,96 | 540,96 |
| masse d'encre du placeholder @390 | 232 283 | 159 580 | 232 283 |
| `joueurs-recherche` @1440 / @390 | | 0,548 % / 0,795 % | 0,039 % / 0,052 % |

À 1440 px les ordonnées sont identiques avant (475,08) : le décalage d'1 px n'apparaît que lorsque la position fractionnaire du champ fait basculer l'arrondi (champ à y = 433,88 @390, 451,06 @1440), parce que les lignes de 24 et de 24,8 px ne se centrent pas au même sous-pixel.

## Ce qu'il faudrait

- Un `padding: 0` (ou un jeton `--origam-field__input---padding-inline`) sur l'élément `input`.
- Une hauteur minimale calculée avec `--origam-input---line-height` (`calc(1rem * var(--origam-input---line-height))`) à la place de `1.5rem`.

## Contournement CCC

Par le thème (`src/themes/ccc.theme.ts`, `cssVars`) : `--origam-input---line-height` = `font.lineHeight.normal` (1,55), `--origam-field---letter-spacing` = `normal`, `--origam-field__input---opacity` = `1`, `--origam-field---padding-start` / `---padding-end` = `space.5` + `border.width.thin` (le texte de la maquette est à 20 px + le filet de 1 px).

Dans `src/assets/css/main.css` : `.origam-field.origam-field.origam-field input { padding-inline: 0; }` (trois classes pour battre le sélecteur à `[data-v]`). Dans `src/components/admin/AdminEditionSelect.vue`, le calcul des retraits verticaux part de l'interligne (`--admin-edition-select---line-height`) et non de `1.5rem`. À retirer quand Origam livre les deux points ci-dessus.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)
