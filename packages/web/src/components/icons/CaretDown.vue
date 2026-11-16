<template>
  <svg
    class="caret-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M4.8 10h14.4L12 17.2z" />
  </svg>
</template>

<script setup lang="ts">
/*********************************************************
 * Global
 *
 * @description
 * Caret plein du sélecteur (menu-icon d'origam-select), décoratif : le champ porte son propre nom accessible.
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
.caret-icon {
  flex: none;
  max-width: none;
  width: var(--caret-icon---size, var(--origam-space---5));
  height: var(--caret-icon---size, var(--origam-space---5));
  fill: currentColor;
}
</style>

<style>
:root {
  --caret-icon---size: var(--origam-space---5);
}
</style>
