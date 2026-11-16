<template>
  <fieldset
    class="round-kind-radios"
    :data-cy="dataCy"
  >
    <legend class="round-kind-radios__legend">
      <slot name="default">
        {{ legend }}
      </slot>
    </legend>
    <origam-radio-group
      :model-value="modelValue"
      :items="items"
      hide-details
      class="round-kind-radios__group"
      @update:model-value="handleUpdate"
    />
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamRadioGroup } from 'origam/components'
import { useT } from '~/composables/useT'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import type { IRoundKindRadiosEmits, IRoundKindRadiosProps } from '~/interfaces/round-draw.interface'
import type { ROUND_KIND } from '~/enums/round.enum'

/*********************************************************
 * Global
 *
 * @description
 * Choix d'un tour parmi ceux que le serveur autorise (`allowedRoundKinds`, décision 673e5b4b) : un groupe `origam-radio-group` dans un `fieldset` natif avec sa `legend`, parce que
 * `origam-radio-group` (2.37.4) ne pose ni `role="radiogroup"` ni `fieldset` (mapping F-25). Partagé par « Quel tour tirez-vous… » et « Changer de tour ».
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IRoundKindRadiosProps>(), {})
const emits = defineEmits<IRoundKindRadiosEmits>()
defineSlots<{ default?: () => unknown }>()
const items = computed(() => props.kinds.map(kind => ({ label: t(ROUND_LABELS[kind].key, ROUND_LABELS[kind].label), value: kind })))
const handleUpdate = (value: ROUND_KIND | null) => {
  if (value) {
    emits('update:modelValue', value)
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
.round-kind-radios {
  display: grid;
  gap: var(--round-kind-radios---gap, var(--origam-space---2));
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;

  &__legend {
    float: left;
    width: 100%;
    margin-bottom: var(--origam-space---2);
    padding: 0;
    font-weight: var(--origam-font__weight---bold);
  }

  &__group {
    clear: both;
  }
}
</style>

<style>
:root {
  --round-kind-radios---gap: var(--origam-space---2);
}
</style>
