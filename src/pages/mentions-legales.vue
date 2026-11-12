<template>
  <legal-page :content="content" />
</template>

<script setup lang="ts">
import LegalPage from '~/components/legal/LegalPage.vue'
import { useSeo } from '~/composables/useSeo'
import { LEGAL_NOTICE_CONTENT } from '~/consts/legal-notice.const'
import { SEO_PAGE } from '~/enums/seo.enum'

/*********************************************************
 * Page
 *
 * @description
 * Mentions légales : contenu statique traduit, sans endpoint. Les informations de l'éditeur que l'utilisateur n'a pas
 * fournies sont des marqueurs `[À FOURNIR : …]`.
 ********************************************************/
definePageMeta({ layout: 'default' })
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const content = LEGAL_NOTICE_CONTENT
useSeo({ page: SEO_PAGE.LEGAL_NOTICE })

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
