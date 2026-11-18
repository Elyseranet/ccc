<template>
  <svg
    class="stroke-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" />
  </svg>
</template>

<script setup lang="ts">
/*********************************************************
 * Global
 *
 * @description
 * Icône de navigation à trait « Administrateurs » (bouclier coché), reprise de la maquette admin-administrateurs (même tracé, même viewBox,
 * trait en currentColor). Décorative : elle accompagne toujours un libellé visible, donc masquée des lecteurs d'écran.
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
