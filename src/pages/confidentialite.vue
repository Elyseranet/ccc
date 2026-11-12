<template>
  <legal-page :content="content" />
</template>

<script setup lang="ts">
import LegalPage from '~/components/legal/LegalPage.vue'
import { useSeo } from '~/composables/useSeo'
import { LEGAL_PRIVACY_CONTENT } from '~/consts/legal-privacy.const'
import { SEO_PAGE } from '~/enums/seo.enum'

/*********************************************************
 * Page
 *
 * @description
 * Politique de confidentialité, cookies compris (sans bandeau : décision d18aa80). Contenu statique traduit, sans
 * endpoint ; les valeurs que l'utilisateur n'a pas fournies sont des marqueurs `[À FOURNIR : …]`.
 ********************************************************/
definePageMeta({ layout: 'default' })
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const content = LEGAL_PRIVACY_CONTENT
useSeo({ page: SEO_PAGE.PRIVACY })

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
