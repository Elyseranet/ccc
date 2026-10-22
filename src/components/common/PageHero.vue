<template>
  <header class="page-hero page-wrap">
    <origam-breadcrumb
      v-if="hasBreadcrumb"
      :items="breadcrumbItems"
      density="compact"
      :aria-label="breadcrumbLabel"
      data-cy="page-hero-breadcrumb"
    />
    <slot name="eyebrow" />
    <origam-title
      tag="h1"
      font-size="5xl"
      line-height="none"
      class="page-hero__title font-display neon"
      data-cy="page-title"
      :text="titleText"
    />
    <p
      v-if="subtitleText"
      class="page-hero__lead"
      data-cy="page-hero-lead"
    >
      {{ subtitleText }}
    </p>
    <slot name="after-lead" />
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBreadcrumb, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import type { IPageHeroProps, IPageHeroSlots } from '~/interfaces/common-components.interface'

/*********************************************************
 * Global
 *
 * @description
 * Titre de page display avec extrusion néon, sous-titre et fil d'Ariane optionnels.
 * Les textes sont des clés de traduction (avec repli et paramètres), jamais des chaînes finales.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPageHeroProps>(), {
  subtitle: undefined,
  breadcrumb: () => []
})
const emits = defineEmits<{}>()
defineSlots<IPageHeroSlots>()

/*********************************************************
 * Textes
 *
 * @description
 * `useHead({ title })` reste dans la page : le titre du document est porté par la route, pas par ce composant.
 ********************************************************/
const titleText = computed(() => t(props.title.key, props.title.fallback, props.title.params))
const subtitleText = computed(() => props.subtitle ? t(props.subtitle.key, props.subtitle.fallback, props.subtitle.params) : '')
const breadcrumbLabel = computed(() => t('components.page_hero.breadcrumb_label', 'Fil d’Ariane'))
const hasBreadcrumb = computed(() => props.breadcrumb.length > 0)
const breadcrumbItems = computed(() => props.breadcrumb.map(entry => ({
  title: t(entry.text.key, entry.text.fallback, entry.text.params),
  to: entry.to,
  disabled: entry.to === undefined
})))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.page-hero {
  position: relative;
  padding-block: var(--page-hero---padding-block, var(--origam-space---12) var(--origam-space---10));

  &__title {
    margin-top: var(--origam-space---4);
  }

  &__lead {
    max-width: 40rem;
    margin: var(--origam-space---6) 0 0;
    font-size: var(--origam-font__size---xl);
    color: var(--origam-color__text---secondary);
  }
}
</style>

<style>
:root {
  --page-hero---padding-block: var(--origam-space---12) var(--origam-space---10);
}
</style>
