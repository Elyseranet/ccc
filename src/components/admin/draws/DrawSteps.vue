<template>
  <origam-stepper
    :items="items"
    :model-value="activeIndex"
    :orientation="orientation"
    :clickable="false"
    show-connectors
    :aria-label="label"
    class="draw-steps"
    data-cy="draw-steps"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamStepper } from 'origam/components'
import { useT } from '~/composables/useT'
import { POOL_DRAW_STEP_STATE } from '~/enums/pool-draw.enum'
import type { IDrawStepsProps } from '~/interfaces/pool-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * Les cinq étapes du tirage (paramètres, têtes de série, saisie, récapitulatif, validation) : `origam-stepper` non cliquable,
 * horizontal sur grand écran et vertical sur mobile (mapping.md). L'étape courante est portée par `modelValue`, l'état de chaque
 * étape (faite, active, à venir) par son `status`.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawStepsProps>(), { orientation: 'horizontal' })
const emits = defineEmits<{}>()
defineSlots<{}>()
const label = computed(() => t('admin.draws.steps_label', 'Étapes du tirage'))
const items = computed(() => props.steps.map(entry => ({ title: t(entry.label.key, entry.label.fallback), status: entry.state })))
const activeIndex = computed(() => Math.max(0, props.steps.findIndex(entry => entry.state === POOL_DRAW_STEP_STATE.ACTIVE)))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.draw-steps {
  margin-bottom: var(--origam-space---6);
}
</style>
