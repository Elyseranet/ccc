<template>
  <div class="motion-toggle">
    <origam-btn
      :variant="variant"
      size="small"
      :bg-color="bgColor"
      :color="color"
      :prepend-icon="IconPause"
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
import IconPause from '~/components/icons/IconPause.vue'
import { useMotionPreference } from '~/composables/useMotionPreference'
import { useT } from '~/composables/useT'

/*********************************************************
 * Global
 *
 * @description
 * Bouton « Mettre en pause les animations » (WCAG 2.2.2, RGAA 13.8 ; T-A11Y-01, M5) : bouton à bascule (`aria-pressed`), visible pour tous, dans le flux,
 * en bas de la zone animée (sous le hero de l'accueil, sous le podium du palmarès), aligné à droite. Libellé constant dans les deux états ; en pause la
 * pastille est pleine (action secondaire), donc l'état ne passe pas par la couleur seule. Masqué sous `prefers-reduced-motion: reduce` (rien ne bouge).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { paused, toggle } = useMotionPreference()
const variant = computed(() => paused.value ? 'flat' : 'text')
const bgColor = computed(() => paused.value ? 'secondary' : undefined)
const color = computed(() => paused.value ? 'secondary' : 'var(--origam-color__text---secondary)')
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
  display: flex;
  justify-content: flex-end;
  margin-top: var(--motion-toggle---margin-top, var(--origam-space---6));
}

@media (prefers-reduced-motion: reduce) {
  .motion-toggle {
    display: none;
  }
}
</style>

<style>
:root {
  --motion-toggle---margin-top: var(--origam-space---6);
}
</style>
