<template>
  <div class="motion-toggle">
    <origam-btn
      variant="flat"
      size="small"
      :aria-pressed="paused"
      :text="label"
      data-cy="motion-toggle"
      @click="handleToggle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn } from 'origam/components'
import { useMotionPreference } from '~/composables/useMotionPreference'
import { useT } from '~/composables/useT'

/*********************************************************
 * Global
 *
 * @description
 * Bouton « Mettre en pause les animations » (WCAG 2.2.2, RGAA 13.8 ; T-A11Y-01, M5) : bouton à bascule (`aria-pressed`), qui garde
 * le même libellé dans les deux états. Placé juste après le lien d'évitement, comme lui masqué hors écran tant qu'il n'a pas le focus (aucun
 * changement de la maquette) : accessible au clavier dès la première tabulation.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { paused, toggle } = useMotionPreference()
const label = computed(() => t('layout.motion_toggle', 'Mettre en pause les animations'))
const handleToggle = () => {
  toggle()
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
.motion-toggle {
  position: absolute;
  inset-inline-start: var(--motion-toggle---inset-inline-start, var(--origam-space---4));
  top: calc(-1 * var(--origam-space---16));
  z-index: var(--motion-toggle---z-index, 50);

  &:focus-within {
    top: var(--origam-space---3);
  }
}
</style>

<style>
:root {
  --motion-toggle---inset-inline-start: var(--origam-space---4);
  --motion-toggle---z-index: 50;
}
</style>
