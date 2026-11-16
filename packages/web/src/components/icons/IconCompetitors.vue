<template>
  <svg
    class="stroke-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6M19 8v6M16 11h6" />
  </svg>
</template>

<script setup lang="ts">
/*********************************************************
 * Global
 *
 * @description
 * Icône de navigation à trait « Compétiteurs », reprise de la maquette admin-editions (même tracé, même viewBox, trait en
 * currentColor). Décorative : elle accompagne toujours un libellé visible, donc masquée des lecteurs d'écran.
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
