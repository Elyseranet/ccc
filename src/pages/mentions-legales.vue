<template>
  <legal-page :content="content" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LegalPage from '~/components/legal/LegalPage.vue'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { LEGAL_NOTICE_CONTENT } from '~/consts/legal-notice.const'

/*********************************************************
 * Page
 *
 * @description
 * Mentions légales : contenu statique traduit, sans endpoint. Les informations de l'éditeur que l'utilisateur n'a pas
 * fournies sont des marqueurs `[À FOURNIR : …]`.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const content = LEGAL_NOTICE_CONTENT
useHead({ title: computed(() => t(content.title.key, content.title.fallback)) })
useSeo({ noindex: true })

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
