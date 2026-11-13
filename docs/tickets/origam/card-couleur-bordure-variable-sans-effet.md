# ds(card) : `--origam-card---border-color` posée sur le composant n'a aucun effet ; la prop `border-color` ne résout pas un nom d'intention

> À déposer chez Origam (pas de numéro tant que la fiche n'est pas ouverte).

## Constat

Mesuré dans CCC (F-25, affiche en cours, carte `border`) en 2.37.4, pixel de la bordure en haut de la carte :

- `--origam-card---border-color: var(--origam-color__action--secondary---bg)` posée sur la carte par une classe : la bordure reste celle par défaut (100, 133, 150), pas de changement ;
- `border-color="secondary"` : la bordure devient (59, 88, 104), pas la couleur de `action.secondary.bg` (243, 238, 221) attendue ;
- `border-color="var(--origam-color__action--secondary---bg)"` : (243, 238, 221), conforme à la maquette.

La cause n'est pas établie (le fichier `OrigamCard.vue` lit `--origam-card---border-color` l.514 mais une valeur posée en ligne par les props de bordure semble prendre le pas).

## Reproduction minimale

```vue
<origam-card border class="c" /> <!-- .c { --origam-card---border-color: red } : bordure inchangée -->
```

## Impact

Colorer la bordure d'une carte par un token d'intention n'est possible qu'avec une chaîne `var(...)` dans la prop.

## Proposition

Faire lire la variable `--origam-card---border-color` posée par le consommateur, ou résoudre les noms d'intention dans `border-color`.

## Contournement CCC

`border-color="var(--origam-color__action--secondary---bg)"` (`RoundDrawEntry.vue`, affiche en cours).

## Version

2.37.4
