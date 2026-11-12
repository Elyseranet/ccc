<template>
  <svg
    class="icon-pause"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
  </svg>
</template>

<script setup lang="ts">
/*********************************************************
 * Global
 *
 * @description
 * Icône « pause » pleine (tracé de la maquette de la pause des animations, T-A11Y-01 M5), en `currentColor`. Décorative : elle accompagne
 * toujours le libellé visible du bouton.
 ********************************************************/
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.icon-pause {
  flex: none;
  width: var(--icon-pause---size, var(--origam-space---4));
  height: var(--icon-pause---size, var(--origam-space---4));
  fill: currentColor;
}
</style>

<style>
:root {
  --icon-pause---size: var(--origam-space---4);
}
</style>
