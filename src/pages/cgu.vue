<template>
  <legal-page :content="content" />
</template>

<script setup lang="ts">
import LegalPage from '~/components/legal/LegalPage.vue'
import { useSeo } from '~/composables/useSeo'
import { LEGAL_TERMS_CONTENT } from '~/consts/legal-terms.const'
import { SEO_PAGE } from '~/enums/seo.enum'

/*********************************************************
 * Page
 *
 * @description
 * Conditions d'utilisation : structure de l'audit (§4), à faire relire par un juriste. Les paragraphes à rédiger sont
 * des marqueurs `[À FOURNIR : …]`, jamais un texte juridique écrit sans relecture.
 ********************************************************/
definePageMeta({ layout: 'default' })
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const content = LEGAL_TERMS_CONTENT
useSeo({ page: SEO_PAGE.TERMS })

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
