<template>
  <div />
</template>

<script setup lang="ts">
import { useSeo } from '~/composables/useSeo'
import { ROUTES } from '~/consts/routes.const'
import { useAdminDashboard } from '~/composables/useAdminDashboard'
import { useAdminEdition } from '~/composables/useAdminEdition'
import { resolveFinalPhaseEntry } from '~/utils/admin-dashboard.util'

/*********************************************************
 * Page
 *
 * @description
 * `/admin/phase-finale` n'a pas de contenu propre : la « Phase finale » est une entrée de tiroir qui ouvre l'étape en cours (F-55) : qualification, tirage de tour ou clôture
 * (décision c9790abd (1) : trois pages liées par un stepper). Sans édition lisible, elle ouvre la qualification. Redirection côté serveur comme côté client, sans entrée d'historique.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useSeo({ noindex: true })
await useAdminEdition()
const { view } = await useAdminDashboard()
await navigateTo(view.value ? resolveFinalPhaseEntry(view.value.activeStep) : ROUTES.ADMIN_FINAL_PHASE_QUALIFICATION, { replace: true })

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
