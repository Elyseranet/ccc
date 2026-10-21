<template>
  <svg
    class="stroke-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z" />
  </svg>
</template>

<script setup lang="ts">
/*********************************************************
 * Global
 *
 * @description
 * Icône de navigation à trait, reprise des maquettes Happy Hour (même tracé, même viewBox, même trait en currentColor).
 * Décorative : elle accompagne toujours un libellé visible, donc masquée des lecteurs d'écran.
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
.stroke-icon {
  flex: none;
  max-width: none;
  width: var(--stroke-icon---size, var(--origam-space---5));
  height: var(--stroke-icon---size, var(--origam-space---5));
  fill: none;
  stroke: currentColor;
  stroke-width: var(--stroke-icon---stroke-width, 2);
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>

<style>
:root {
  --stroke-icon---size: var(--origam-space---5);
  --stroke-icon---stroke-width: 2;
}
</style>
