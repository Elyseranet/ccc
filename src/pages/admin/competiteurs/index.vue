<template>
  <competitors-screen />
</template>

<script setup lang="ts">
import CompetitorsScreen from '~/components/admin/competitors/CompetitorsScreen.vue'

/*********************************************************
 * Page
 *
 * @description
 * Annuaire des compétiteurs de l'admin (F-13), sans compétiteur choisi. L'écran est partagé avec `/admin/competiteurs/{id}`.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
