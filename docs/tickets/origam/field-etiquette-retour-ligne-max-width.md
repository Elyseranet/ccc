# ds(field) : l'étiquette d'un `origam-select` passe à la ligne quand la maquette la tient sur une seule

> À déposer chez Origam (pas de numéro tant que la fiche n'est pas ouverte).

## Constat

`OrigamField.vue` (l.826-830) donne à `.origam-field__label` `max-width: calc(100% - padding-start - padding-end)` sans `white-space: nowrap`. Dans CCC (F-25, sélecteur « Affiche 2 : premier joueur tiré », 358 px de large à 390), l'étiquette passe sur deux lignes (la deuxième coupée par `contain: layout paint`) alors que la maquette l'écrit sur une ligne, à gauche de la flèche. Zone `ti-affiche-en-cours` à 390 : 1,9 % tant que l'étiquette passe à la ligne, 0,14 % avec une seule ligne.

## Reproduction minimale

```vue
<origam-select label="Affiche 2 : premier joueur tiré" rounded="full" density="compact" style="width: 268px" />
```

## Impact

Une étiquette longue est coupée sur deux lignes dans un champ étroit au lieu d'être tronquée proprement.

## Proposition

`white-space: nowrap` et `text-overflow: ellipsis` sur l'étiquette posée (non flottante).

## Contournement CCC

`:deep(.origam-label) { white-space: nowrap; text-overflow: ellipsis }` dans `RoundDrawEntry.vue`.

## Version

2.37.4
