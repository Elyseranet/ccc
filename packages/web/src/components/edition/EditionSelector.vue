<template>
  <div class="edition-selector">
    <origam-label
      :for="fieldId"
      :text="label"
      class="edition-selector__label"
    />
    <origam-select
      :id="fieldId"
      :model-value="current"
      :items="items"
      :label="label"
      single-line
      hide-details
      rounded="full"
      :menu-icon="CaretDown"
      class="edition-selector__select"
      data-cy="edition-selector"
      @update:model-value="handleSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamLabel, OrigamSelect } from 'origam/components'
import CaretDown from '~/components/icons/CaretDown.vue'
import { useT } from '~/composables/useT'
import type { IEditionSelectorProps } from '~/interfaces/edition-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Sélecteur d'édition de l'en-tête. La valeur est le `code` de l'édition (R-9 : 2012a et 2012b sont deux éditions), le
 * libellé l'année, suivie de « 1re » ou « 2e » pour deux éditions d'une même année. Le parent change la route en
 * gardant l'onglet.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionSelectorProps>(), {})
const emits = defineEmits<{ (event: 'select', code: string): void }>()
defineSlots<{}>()
const fieldId = useId()
const label = computed(() => t('edition.selector_label', 'Changer d’édition'))
const items = computed(() => props.options.map((option) => {
  const year = t('edition.selector_year', '{year}', { year: option.year })
  const title = option.ordinal
    ? t('edition.selector_with_ordinal', '{year} · {ordinal}', { year: option.year, ordinal: t(option.ordinal.key, option.ordinal.fallback, option.ordinal.params) })
    : year
  return { title, value: option.code }
}))
const handleSelect = (code: string | null) => {
  if (code && code !== props.current) {
    emits('select', code)
  }
}

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.edition-selector {
  display: grid;
  gap: var(--origam-space---1);
  min-width: var(--edition-selector---min-width, 14rem);

  &__label {
    display: block;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }
}
</style>

<style>
:root {
  --edition-selector---min-width: 14rem;
}
</style>
