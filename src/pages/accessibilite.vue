<template>
  <legal-page :content="content" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LegalPage from '~/components/legal/LegalPage.vue'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { LEGAL_ACCESSIBILITY_CONTENT } from '~/consts/legal-accessibility.const'

/*********************************************************
 * Page
 *
 * @description
 * Déclaration d'accessibilité honnête (décision d8d4137) : aucun audit RGAA complet, donc jamais « conforme ».
 * Ce qui est dit « fait » doit rester vrai ; les défauts listés viennent de T-A11Y-01 et des issues Origam.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const content = LEGAL_ACCESSIBILITY_CONTENT
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
