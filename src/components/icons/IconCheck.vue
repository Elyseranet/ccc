<template>
  <svg
    class="icon-check"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
  </svg>
</template>

<script setup lang="ts">
/*********************************************************
 * Global
 *
 * @description
 * Coche pleine de la maquette de clôture (F-26), en `currentColor`. Décorative : la ligne qu'elle accompagne dit déjà « oui » en toutes lettres.
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
.icon-check {
  width: var(--icon-check---size, var(--origam-space---4));
  height: var(--icon-check---size, var(--origam-space---4));
  fill: currentColor;
}
</style>

<style>
:root {
  --icon-check---size: var(--origam-space---4);
}
</style>
