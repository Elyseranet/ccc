<template>
  <cap-badge class="brand-mark" />
</template>

<script setup lang="ts">
import CapBadge from '~/components/common/CapBadge.vue'

/*********************************************************
 * Global
 *
 * @description
 * Capsule de la marque CCC, décorative : le nom accessible est porté par le lien parent. Elle est dessinée par `CapBadge` (F-23) ; seule sa taille est réglée ici.
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
.brand-mark {
  width: var(--brand-mark---size, var(--origam-space---8));
  height: var(--brand-mark---size, var(--origam-space---8));
}
</style>

<style>
:root {
  --brand-mark---size: var(--origam-space---8);
}
</style>
