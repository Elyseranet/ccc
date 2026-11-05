<template>
  <header class="reference-head">
    <p class="reference-head__eyebrow">
      {{ eyebrow }}
    </p>
    <origam-title
      tag="h1"
      class="reference-head__title font-display neon--sm"
      data-cy="page-title"
      :text="title"
    />
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import type { IReferenceHeadProps } from '~/interfaces/admin-competitors.interface'

/*********************************************************
 * Global
 *
 * @description
 * En-tête des pages du référentiel de l'admin (éditions, compétiteurs) : le surtitre « Référentiel » et le titre de la page (h1 unique).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IReferenceHeadProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const eyebrow = computed(() => t('admin.reference.eyebrow', 'Référentiel'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.reference-head {
  display: grid;
  gap: var(--reference-head---gap, var(--origam-space---2));

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__title {
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
  }
}
</style>

<style>
:root {
  --reference-head---gap: var(--origam-space---2);
}
</style>
