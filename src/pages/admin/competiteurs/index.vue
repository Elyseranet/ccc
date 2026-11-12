<template>
  <competitors-screen />
</template>

<script setup lang="ts">
import CompetitorsScreen from '~/components/admin/competitors/CompetitorsScreen.vue'
import { useSeo } from '~/composables/useSeo'

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
useSeo({ noindex: true })

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
