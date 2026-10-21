<template>
  <a
    class="skip"
    href="#contenu"
    data-cy="skip-link"
  >{{ label }}</a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useT } from '~/composables/useT'

/*********************************************************
 * Global
 *
 * @description
 * Lien d'évitement : premier élément focalisable de chaque layout, il mène au `main` (#contenu).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const label = computed(() => t('layout.skip_link', 'Aller au contenu'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>
