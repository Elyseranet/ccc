<template>
  <competitors-screen :competitor-id="competitorId" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CompetitorsScreen from '~/components/admin/competitors/CompetitorsScreen.vue'

/*********************************************************
 * Page
 *
 * @description
 * Correction d'identité d'un compétiteur de l'admin (F-13), l'annuaire restant visible à côté. L'identifiant est celui de l'URL.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const route = useRoute()
const competitorId = computed(() => String(route.params.id ?? '') || null)

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
