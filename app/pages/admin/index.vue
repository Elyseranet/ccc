<template>
  <section class="page-wrap page-skeleton">
    <origam-title
      tag="h1"
      class="font-display neon--sm"
      data-cy="page-title"
      :text="title"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'

/*********************************************************
 * Page
 *
 * @description
 * Squelette du lot 0 : titre de page unique et layout. Le ticket de l'écran remplit cette page.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const title = computed(() => t('pages.admin_dashboard.title', 'Tableau de bord'))
useHead({ title })

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.page-skeleton {
  padding-block: var(--page-skeleton---padding-block, var(--origam-space---12) var(--origam-space---10));
}
</style>

<style>
:root {
  --page-skeleton---padding-block: var(--origam-space---12) var(--origam-space---10);
}
</style>
