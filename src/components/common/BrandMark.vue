<template>
  <svg
    class="brand-mark"
    viewBox="0 0 100 100"
    aria-hidden="true"
    focusable="false"
  >
    <polygon
      class="brand-mark__cap"
      :points="capPoints"
    />
    <circle
      class="brand-mark__hole"
      cx="50"
      cy="50"
      r="31"
    />
  </svg>
</template>

<script setup lang="ts">
import { BRAND_CAP_POINTS } from '~/consts/brand.const'

/*********************************************************
 * Global
 *
 * @description
 * Capsule de la marque CCC, décorative : le nom accessible est porté par le lien parent.
 ********************************************************/
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const capPoints = BRAND_CAP_POINTS

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.brand-mark {
  width: var(--brand-mark---size, var(--origam-space---8));
  height: var(--brand-mark---size, var(--origam-space---8));

  &__cap {
    fill: var(--origam-color__bar---amber);
  }

  &__hole {
    fill: var(--origam-color__surface---default);
  }
}
</style>

<style>
:root {
  --brand-mark---size: var(--origam-space---8);
}
</style>
