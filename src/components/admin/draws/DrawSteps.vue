<template>
  <origam-stepper
    :items="items"
    :model-value="activeIndex"
    :orientation="mobile ? 'vertical' : 'horizontal'"
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
import { useDisplay } from 'origam/composables'
import { useT } from '~/composables/useT'
import { POOL_DRAW_STEPPER_MOBILE_BREAKPOINT } from '~/consts/pool-draw.const'
import { POOL_DRAW_STEP_STATE } from '~/enums/pool-draw.enum'
import type { IDrawStepsProps } from '~/interfaces/pool-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * Les cinq étapes du tirage (paramètres, têtes de série, saisie, récapitulatif, validation) : `origam-stepper` non cliquable,
 * horizontal sur grand écran, vertical sous le seuil `md` d'Origam (`useDisplay`, réutilisé : aucun point de rupture maison, un seul
 * stepper dans le DOM dont seule la prop `orientation` change).
 * L'étape courante est portée par `modelValue`, l'état de chaque étape (faite, active, à venir) par son `status`.
 ********************************************************/
const { t } = useT()
const { mobile } = useDisplay({ mobileBreakpoint: POOL_DRAW_STEPPER_MOBILE_BREAKPOINT })
const props = withDefaults(defineProps<IDrawStepsProps>(), {})
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
