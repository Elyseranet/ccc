# ds(drawer) : en SSR, `origam-drawer` sans `attach` perd son contenu et l'hydratation tombe en erreur 500

## Constat

Dans une `origam-layout`, un `origam-drawer` sans `attach` se téléporte vers
`#<layoutId> .origam-layout__wrapper`. Le rendu serveur ne contient pas le contenu du tiroir, et l'hydratation
client échoue : `Hydration node mismatch`, puis `TypeError: Cannot read properties of null (reading 'nodeType')`,
`[NUXT_E1005] Error caught during app initialization`, et Nuxt affiche la page `Error500`. Le tiroir n'est jamais
monté côté client.

Avec `:attach="true"` (pas de téléportation), la même page rend le tiroir en SSR et s'hydrate sans erreur.

## Reproduction minimale

Nuxt 4.6.1, `modules: ['origam/nuxt']`, `origam@2.37.3`, `nuxi dev`, Chromium (Playwright) :

```vue
<!-- pages/drawer.vue -->
<template>
  <origam-layout>
    <origam-drawer permanent><p id="drawer-content">DRAWER-CONTENT</p></origam-drawer>
    <origam-main><p>MAIN</p></origam-main>
  </origam-layout>
</template>
<script setup lang="ts">
import { OrigamLayout, OrigamDrawer, OrigamMain } from 'origam/components'
</script>
```

Mesures :

| page | HTML SSR contient `DRAWER-CONTENT` | `#drawer-content` après hydratation | console |
|---|---|---|---|
| sans `attach` | non | 0 | mismatches, `TypeError … 'nodeType'`, `NUXT_E1005`, `Error500` |
| `:attach="true"` | oui | 1 (`nav.origam-drawer` dans `.origam-layout__wrapper`) | aucune erreur d'hydratation |

## Cause

- `packages/ds/src/components/Drawer/OrigamDrawer.vue:2-5` : racine `<teleport :disabled :to defer>`.
- `packages/ds/src/components/Drawer/OrigamDrawer.vue:380-384` et `403-408` : sans `attach`, la cible est la
  chaîne `#${layoutId} .origam-layout__wrapper` et `teleportDisabled` vaut `isLayoutOrphan` ; rien ne retarde la
  téléportation jusqu'à la fin de l'hydratation.
- À comparer avec `packages/ds/src/composables/Commons/teleport.composable.ts:87-89` : la branche `attach` passe
  par `useTeleport`, qui renvoie `undefined` tant que `isHydrated` est faux, ce qui aligne le rendu client sur le
  rendu serveur. La branche par défaut du Drawer n'a pas cette garde.

## Impact

Le tiroir de navigation, usage nominal d'`origam-layout`, est inutilisable dans une app Nuxt en SSR : la page
entière bascule en erreur 500 côté client. Contournement constaté : `:attach="true"`.

## Critère d'acceptation

La page ci-dessus, servie par Nuxt en SSR :
1. contient `DRAWER-CONTENT` dans le HTML serveur, ou le rend sans erreur après montage ;
2. ne produit aucun `Hydration … mismatch` ni `NUXT_E1005` dans la console ;
3. affiche `#drawer-content` dans `.origam-layout__wrapper` après hydratation.
Un test e2e SSR (Nuxt) couvre ce cas, `permanent` et `temporary`.

## Version

2.37.3
