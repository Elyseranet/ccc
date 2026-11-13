<template>
  <origam-stepper
    :items="items"
    :model-value="activeIndex"
    orientation="horizontal"
    show-connectors
    :aria-label="label"
    class="phase-steps-nav"
    data-cy="phase-steps"
    @update:model-value="handleStep"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamStepper } from 'origam/components'
import { useT } from '~/composables/useT'
import { ADMIN_PHASE_STEPS } from '~/consts/admin-phase.const'
import { POOL_DRAW_STEP_STATE } from '~/enums/pool-draw.enum'
import type { IPhaseStepsProps } from '~/interfaces/phase.interface'

/*********************************************************
 * Global
 *
 * @description
 * Navigation de la « Phase finale » : une seule entrée de tiroir, trois pages liées par ce stepper (décision c9790abd (1)). Une étape
 * dont la route n'existe pas encore (`to` nul : tirage de tour, clôture) n'est pas cliquable ; l'étape courante est inerte (`aria-current="step"`).
 * Les autres étapes mènent à leur page : une étape dont les conditions ne sont pas remplies reste atteignable, l'écran dit ce qui manque.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPhaseStepsProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const label = computed(() => t('admin.phase.steps_label', 'Phase finale'))
const activeIndex = computed(() => Math.max(0, ADMIN_PHASE_STEPS.findIndex(entry => entry.step === props.current)))
const items = computed(() => ADMIN_PHASE_STEPS.map((entry, index) => ({
  title: t(entry.label.key, entry.label.fallback),
  status: index === activeIndex.value ? POOL_DRAW_STEP_STATE.ACTIVE : POOL_DRAW_STEP_STATE.PENDING,
  clickable: entry.to !== null && index !== activeIndex.value
})))

/*********************************************************
 * Navigation
 *
 * @description
 * Le stepper rend un bouton par étape cliquable et émet son index : la route vient de la table des étapes.
 ********************************************************/
const handleStep = async (index: number) => {
  const to = ADMIN_PHASE_STEPS[index]?.to
  if (to) {
    await navigateTo(to)
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
.phase-steps-nav {
  margin-bottom: var(--phase-steps-nav---margin-bottom, var(--origam-space---4));

  :deep(.origam-stepper-item__title) {
    white-space: normal;
  }
}
</style>

<style>
:root {
  --phase-steps-nav---margin-bottom: var(--origam-space---4);
}
</style>
