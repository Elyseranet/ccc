<template>
  <cap-badge
    class="icon-capsule"
    aria-hidden="true"
    focusable="false"
  />
</template>

<script setup lang="ts">
import CapBadge from '~/components/common/CapBadge.vue'

/*********************************************************
 * Global
 *
 * @description
 * Capsule du bouton « Tirer au sort » (F-52, maquette : coque en `currentColor`, rond intérieur de la couleur du bouton).
 * Dessinée par `CapBadge` ; décorative, elle accompagne toujours le libellé visible du bouton.
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
.icon-capsule {
  --cap-badge__inner---fill: var(--icon-capsule__inner---fill, var(--origam-color__action--primary---bg));

  flex: none;
  width: var(--icon-capsule---size, var(--origam-space---6));
  height: var(--icon-capsule---size, var(--origam-space---6));
  transition: rotate var(--origam-motion__duration---medium) var(--origam-motion__easing---standard);

  // La teinte de `CapBadge` est posée en ligne : la coque suit ici la couleur du texte du bouton.
  :deep(.cap-badge__shape) {
    fill: currentColor;
  }
}
</style>

<style>
:root {
  --icon-capsule---size: var(--origam-space---6);
}
</style>
