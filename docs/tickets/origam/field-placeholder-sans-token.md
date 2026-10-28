# ds(field) : la couleur du placeholder est figée à `currentColor` à 50 %, sans variable

## Constat

`OrigamField.vue` (lignes 999-1003, `&__input input::placeholder, textarea::placeholder`) peint le placeholder de tous les champs ainsi :

```scss
&::placeholder {
  color: currentColor;
  opacity: 0.5;
}
```

Aucune variable ne permet de le régler pour le champ. Le composant `OrigamCommandPalette` en expose une (`--origam-command-palette__input---placeholder-color`, repli `--origam-color__text---tertiary`) : le même besoin existe donc déjà, résolu pour la palette de commandes seulement.

La maquette Happy Hour (hh.css:119) donne au placeholder la couleur `text.tertiary` pleine :

```css
.input::placeholder { color: var(--origam-color__text---tertiary); }
```

## Mesure (CCC, F-04, champ « Nom ou pseudo », `::placeholder` calculé, 1440 px)

| | application | maquette |
|---|---|---|
| couleur | rgb(255, 244, 220) | rgb(169, 154, 208) |
| opacité | 0,5 | 1 |
| rendu (sur le fond sunken rgb(14, 6, 32)) | ≈ rgb(134, 125, 126) | rgb(169, 154, 208) |

Le placeholder de chaque champ de l'application est donc plus gris et plus sombre que dans la maquette, et la teinte est différente (crème atténué contre lilas).

## Ce qu'il faudrait

Une variable de couleur du placeholder pour le champ, par exemple `--origam-field---placeholder-color` (repli `currentColor`), et une variable d'opacité (`--origam-field---placeholder-opacity`, repli 0,5), lues par les deux règles ci-dessus.

## Contournement CCC

`src/assets/css/main.css` : `.origam-field.origam-field.origam-field.origam-field input::placeholder { color: var(--origam-color__text---tertiary); opacity: 1 }`. Quatre classes : le sélecteur d'Origam vaut (0,3,2) (`.origam-field[data-v] .origam-field__input input::placeholder`), trois classes seulement ne suffisent pas (égalité, l'ordre des feuilles décide). Comme pour `.origam-field.origam-field.origam-field` (#1254). À retirer quand Origam expose la variable.

## Version

2.37.4 (installée ; ^2.37.3 déclarée)
