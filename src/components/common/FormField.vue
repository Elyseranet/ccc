<template>
  <div class="form-field">
    <origam-label
      class="form-field__label"
      :for="fieldId"
      :text="labelText"
    />
    <slot name="default" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamLabel } from 'origam/components'
import { useT } from '~/composables/useT'
import type { IFormFieldProps, IFormFieldSlots } from '~/interfaces/account.interface'

/*********************************************************
 * Global
 *
 * @description
 * Un champ de formulaire avec son libellé visible au-dessus, comme dans les maquettes (capitales, petit corps, teinte
 * tertiaire). Le libellé est lié au champ par `for` : le champ porte l'`id` correspondant. Le placeholder n'est jamais un libellé.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IFormFieldProps>(), {})
const emits = defineEmits<{}>()
defineSlots<IFormFieldSlots>()
const labelText = computed(() => t(props.label.key, props.label.fallback, props.label.params))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.form-field {
  display: grid;
  gap: var(--origam-space---1);

  &__label {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }
}
</style>
