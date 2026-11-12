<template>
  <span
    class="edition-readonly-value"
    :data-cy="`edition-readonly-${row.id}`"
  >
    <edition-chip
      v-if="row.chip"
      :text="row.text"
      :family="row.chip"
    />
    <span
      v-else
      class="edition-readonly-value__text"
      :class="{ 'edition-readonly-value__text--missing': row.missing }"
    >{{ row.text }}</span>
    <small
      v-if="row.hint"
      class="edition-readonly-value__hint"
    >{{ row.hint }}</small>
  </span>
</template>

<script setup lang="ts">
import EditionChip from '~/components/edition/EditionChip.vue'
import type { IEditionReadonlyValueProps } from '~/interfaces/admin-editions.interface'

/*********************************************************
 * Global
 *
 * @description
 * Valeur d'un champ en lecture seule : texte (ou pastille de statut) et sa précision. Une valeur absente est atténuée.
 ********************************************************/
const props = withDefaults(defineProps<IEditionReadonlyValueProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.edition-readonly-value {
  display: block;

  &__text {
    font-weight: var(--origam-font__weight---bold);
    font-variant-numeric: tabular-nums;

    &--missing {
      font-weight: var(--origam-font__weight---regular);
      color: var(--edition-readonly-value__missing---color, var(--origam-color__text---secondary));
    }
  }

  &__hint {
    display: block;
    margin-block-start: var(--edition-readonly-value---gap, calc(var(--origam-space---1) / 2));
    font-size: var(--origam-font__size---sm);
    font-weight: var(--origam-font__weight---regular);
    color: var(--edition-readonly-value__hint---color, var(--origam-color__text---secondary));
  }
}
</style>

<style>
:root {
  --edition-readonly-value---gap: calc(var(--origam-space---1) / 2);
  --edition-readonly-value__missing---color: var(--origam-color__text---secondary);
  --edition-readonly-value__hint---color: var(--origam-color__text---secondary);
}
</style>
