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
 * Les étapes avant la page courante sont faites (coche, mockup F-25). Le nom accessible d'une étape est son numéro puis son titre, comme le texte visible : `origam-stepper-item` pose sinon « Step 2: Titre » (anglais, sans le texte visible), que axe refuse sur une étape cliquable (`label-content-name-mismatch`, WCAG 2.5.3).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPhaseStepsProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const label = computed(() => t('admin.phase.steps_label', 'Phase finale'))
const activeIndex = computed(() => Math.max(0, ADMIN_PHASE_STEPS.findIndex(entry => entry.step === props.current)))
const stateOf = (index: number): POOL_DRAW_STEP_STATE => {
  if (index < activeIndex.value) {
    return POOL_DRAW_STEP_STATE.DONE
  }
  return index === activeIndex.value ? POOL_DRAW_STEP_STATE.ACTIVE : POOL_DRAW_STEP_STATE.PENDING
}
const items = computed(() => ADMIN_PHASE_STEPS.map((entry, index) => {
  const title = t(entry.label.key, entry.label.fallback)
  const state = stateOf(index)
  return {
    title,
    // Une étape faite montre une coche (pas de numéro) : son nom accessible est son titre ; sinon numéro puis titre, comme le texte visible.
    'aria-label': state === POOL_DRAW_STEP_STATE.DONE ? title : `${index + 1}${title}`,
    status: state,
    clickable: entry.to !== null && index !== activeIndex.value
  }
}))

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
