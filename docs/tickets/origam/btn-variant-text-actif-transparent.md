# ds(btn) : la variante `text` force `background-color: transparent !important`, même à l'état actif

Lié à **Elyseranet/origam#1106** (même règle, symptôme différent : `bg-color` ignoré au repos).

## Constat

Un `origam-btn variant="text"` actif (`origam-btn--active`) garde un fond transparent. Aucun jeton ne permet de
lui donner un fond actif, et une classe du consommateur est écrasée par l'`!important`. Le seul signal actif est
l'overlay `__overlay` à 0,2 d'opacité, dont la couleur est `--origam-color__overlay---scrim` : blanc en clair,
noir en sombre. Sur un fond clair, l'état actif est donc quasi invisible.

Les variantes `tonal` et `outlined` ont, elles, un jeton dédié à l'état actif.

## Reproduction minimale

Nuxt 4.6.1 + `origam/nuxt` (thème par défaut, mode clair), Chromium :

```vue
<origam-btn id="b-text" variant="text" active>Text actif</origam-btn>
<origam-btn id="b-text-cls" variant="text" active class="my-active">Text actif + classe</origam-btn>
<style>.my-active { background-color: rgb(255, 0, 0); }</style>
```

`getComputedStyle` mesuré :
- `#b-text` : `background-color: rgba(0, 0, 0, 0)`, overlay `rgb(255, 255, 255)` à `opacity: 0.2` ;
- `#b-text-cls` : `background-color: rgba(0, 0, 0, 0)`, la classe `.my-active` est ignorée.

## Cause

- `packages/ds/src/components/Btn/OrigamBtn.vue:887-890` :
  ```scss
  &--variant-text {
      background-color: transparent !important;
      box-shadow: none;
  }
  ```
  pas de bloc `&#{$this}--active` pour cette variante.
- Comparer `OrigamBtn.vue:911-921` (`tonal` → `--origam-btn---background-color-tonal-active`) et
  `OrigamBtn.vue:954-958` (`outlined` → `--origam-btn---background-color-active`).
- Signal actif restant : `OrigamBtn.vue:838-842` et `1299-1302` (overlay à `0.2`, couleur
  `--origam-color__overlay---scrim`), défini à `assets/scss/tokens/_light.scss:136` (blanc) et
  `assets/scss/tokens/_dark.scss:236` (noir).

## Impact

Une navigation en boutons `text` ne peut pas marquer l'entrée courante par un fond. Le projet CCC contourne en
passant l'entrée active en `variant="flat"` (`app/layouts/default.vue:157`, `app/layouts/admin.vue:157`).

## Critère d'acceptation

1. Un jeton dédié (par ex. `--origam-btn---background-color-text-active`), non déclaré par défaut comme pour
   `outlined`, est lu par `.origam-btn--variant-text.origam-btn--active`.
2. Avec ce jeton posé par un thème, `#b-text` actif a un `background-color` calculé égal à la valeur du jeton.
3. Sans jeton, le rendu par défaut reste celui d'aujourd'hui (pas de régression VRT).

## Version

2.37.3
