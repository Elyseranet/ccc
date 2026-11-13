<template>
  <div />
</template>

<script setup lang="ts">
import { useSeo } from '~/composables/useSeo'
import { ROUTES } from '~/consts/routes.const'

/*********************************************************
 * Page
 *
 * @description
 * `/admin/phase-finale` n'a pas de contenu propre : la « Phase finale » est une entrée de tiroir qui ouvre sa première page, la qualification
 * (décision c9790abd (1) : trois pages liées par un stepper). Redirection côté serveur comme côté client, sans entrée d'historique.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useSeo({ noindex: true })
await navigateTo(ROUTES.ADMIN_FINAL_PHASE_QUALIFICATION, { replace: true })

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
