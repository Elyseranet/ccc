# ds(stepper) : une étape cliquable pose `aria-label="Step N: Titre"` (anglais), refusé par axe `label-content-name-mismatch`

> À déposer chez Origam (pas de numéro tant que la fiche n'est pas ouverte).

## Constat

Un `origam-stepper` `clickable` rend chaque étape avec un nom accessible `Step N: Titre`. Ce nom ne contient pas le texte visible (le numéro puis le titre, « 2Tirage ») et il est en anglais : axe signale `label-content-name-mismatch` (WCAG 2.5.3, Label in Name), constaté dans CCC sur le stepper de phase (F-24, F-25) en 2.37.4.

## Reproduction minimale

```vue
<origam-stepper clickable :items="[{ title: 'Qualification', value: 1, to: '/a' }, { title: 'Tirage', value: 2, to: '/b' }]" :model-value="1" />
```

Axe (`wcag22aa`) : `label-content-name-mismatch` sur les étapes.

## Impact

Une étape cliquable ne peut pas être nommée par son texte visible sans surcharge, et le nom par défaut n'est pas traduit.

## Proposition

Ne pas poser d'`aria-label` par défaut (le texte visible suffit), ou le construire à partir du texte visible et d'une clé de traduction.

## Contournement CCC

`aria-label` explicite dans l'objet de chaque étape (`PhaseSteps.vue` : numéro puis titre pour une étape à venir ou courante, titre seul pour une étape faite). Mesuré : avec un espace entre le numéro et le titre, axe refuse encore ; sans espace, il accepte.

## Critère d'acceptation

Un stepper cliquable sans surcharge passe axe `wcag22aa`.

## Version

2.37.4
