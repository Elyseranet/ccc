<template>
  <canvas
    ref="canvasRef"
    class="bubbles-backdrop"
    aria-hidden="true"
    data-cy="bubbles-backdrop"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useBubbles } from '~/composables/useBubbles'

/*********************************************************
 * Global
 *
 * @description
 * Décor animé des vitrines (accueil, palmarès) : bulles qui montent dans la bière. Purement décoratif (`aria-hidden`),
 * rien n'est dessiné sous `prefers-reduced-motion: reduce`. Les écrans denses et l'admin n'en ont pas (règle CSS seul).
 ********************************************************/
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { start, stop } = useBubbles(canvasRef)

onMounted(start)
onBeforeUnmount(stop)

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.bubbles-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: var(--bubbles-backdrop---z-index, 0);
}

@media (prefers-reduced-motion: reduce) {
  .bubbles-backdrop {
    display: none;
  }
}
</style>

<style>
:root {
  --bubbles-backdrop---z-index: 0;
}
</style>
