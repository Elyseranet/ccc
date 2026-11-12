<template>
  <legal-page :content="content" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LegalPage from '~/components/legal/LegalPage.vue'
import { useT } from '~/composables/useT'
import { LEGAL_TERMS_CONTENT } from '~/consts/legal-terms.const'

/*********************************************************
 * Page
 *
 * @description
 * Conditions d'utilisation : structure de l'audit (§4), à faire relire par un juriste. Les paragraphes à rédiger sont
 * des marqueurs `[À FOURNIR : …]`, jamais un texte juridique écrit sans relecture.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const content = LEGAL_TERMS_CONTENT
useHead({ title: computed(() => t(content.title.key, content.title.fallback)) })

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
