# ds(form) : `<template #default>` sur `origam-form` lève TS2339 (`default` absent du type des slots)

## Constat

Dans un template Vue (vue-tsc, `nuxi typecheck`), placer le contenu d'un `origam-form` dans un slot nommé explicitement :

```vue
<origam-form class="players-search__form" role="search" validate-on="submit" :aria-label="searchLabel" @submit="handleSubmit">
  <template #default>
    <div class="players-search__grid">…</div>
  </template>
</origam-form>
```

produit :

```
src/components/players/PlayersSearch.vue(17,20): error TS2339: Property 'default' does not exist on type '{}'.
```

(colonne 20 = `#default`). Le même contenu posé directement dans `origam-form`, sans `<template #default>`, compile. D'autres composants (`origam-card`, `origam-list`…) acceptent `<template #default>` sans erreur dans le même projet.

## Ce qui est vérifié

- `IFormSlots` (`dist/src/interfaces/Form/form.interface.d.ts:52`) étend `ICommonsComponentSlots`, qui déclare bien `default?: () => any` (`dist/src/interfaces/Commons/commons.interface.d.ts:110`).
- `OrigamForm.vue` rend bien `<slot name="default" v-bind="form"/>`.
- Le fichier publié `dist/src/components/Form/OrigamForm.vue:88` appelle `defineSlots()` **sans argument de type** : le type des slots déclaré par le composant publié serait donc `{}`, ce qui correspond au message.
- `dist/src/components/Card/OrigamCard.vue:321` appelle aussi `defineSlots()` sans argument de type, alors que `#default` y est accepté. Pourquoi l'un passe et l'autre non : **je ne sais pas** (non vérifié dans le code de génération des types d'Origam).

## Ce qu'il faudrait

Que le type des slots publié pour `OrigamForm` contienne `default` (avec ses props : l'objet `form` lié par `v-bind`), comme `IFormSlots` le décrit.

## Contournement CCC

Contenu posé directement dans `origam-form`, sans `<template #default>` (F-04, `src/components/players/PlayersSearch.vue`). C'est une dérogation à la règle « toujours envelopper le slot par défaut dans `<template #default>` » (skill `vue-conventions`), limitée à `origam-form` et à retirer quand le type est corrigé.

## Version

2.37.4 (installée ; ^2.37.3 déclarée).
