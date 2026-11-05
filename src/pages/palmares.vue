<template>
  <div
    class="palmares-page"
    data-cy="palmares-page"
  >
    <div class="palmares-page__hero">
      <bubbles-backdrop />
      <page-hero
        :title="heroTitle"
        :subtitle="heroSubtitle"
        class="palmares-page__hero-content"
      >
        <template #eyebrow>
          <p class="palmares-page__eyebrow">
            {{ eyebrow }}
          </p>
        </template>
        <template #after-lead>
          <palmares-most-titled :most-titled="mostTitled" />
        </template>
      </page-hero>
    </div>
    <div class="page-wrap">
      <async-state
        :pending="pending"
        :error="pageError"
        :empty="isEmpty"
        :empty-title="emptyTitle"
        :empty-description="emptyDescription"
        @retry="refresh"
      >
        <template #default>
          <palmares-titles
            class="palmares-page__section palmares-page__section--tight"
            :titles="titles"
          />
          <palmares-rankings
            class="palmares-page__section"
            :scope="scope"
            :acp="acp"
            :all-time="allTime"
            :evolution="evolution"
          />
        </template>
      </async-state>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AsyncState from '~/components/common/AsyncState.vue'
import BubblesBackdrop from '~/components/common/BubblesBackdrop.vue'
import PageHero from '~/components/common/PageHero.vue'
import PalmaresMostTitled from '~/components/palmares/PalmaresMostTitled.vue'
import PalmaresRankings from '~/components/palmares/PalmaresRankings.vue'
import PalmaresTitles from '~/components/palmares/PalmaresTitles.vue'
import { usePalmares } from '~/composables/usePalmares'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { SEO_PAGE } from '~/enums/seo.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'

/*********************************************************
 * Page
 *
 * @description
 * Palmarès (vitrine publique) : titres, classements ACP et All Time, évolution. La page reste fine : la mise en forme est dans
 * `usePalmares` et `palmares.util`. Les classements restent sobres (CSS seul) ; seul le décor de l'en-tête s'anime, et
 * rien ne bouge sous `prefers-reduced-motion`.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useSeo({ page: SEO_PAGE.HALL_OF_FAME })

/*********************************************************
 * Données
 *
 * @description
 * Les requêtes sont attendues : le HTML rendu côté serveur contient déjà les données.
 ********************************************************/
const { pending, pageError, refresh, titles, acp, allTime, mostTitled, evolution, scope } = await usePalmares()
const eyebrow = computed(() => t('palmares.eyebrow', 'Titres · classements · évolution'))
const heroTitle: ITranslatableText = { key: 'pages.hall_of_fame.title', fallback: 'Palmarès' }
const firstYear = computed(() => titles.value[titles.value.length - 1]?.option.year ?? null)
const heroSubtitle = computed<ITranslatableText | undefined>(() => firstYear.value === null
  ? undefined
  : { key: 'palmares.lead', fallback: 'Un titre par édition depuis {year}. Les classements ACP et All Time additionnent les points du barème, pondérés par la taille de chaque édition.', params: { year: firstYear.value } })

/*********************************************************
 * États
 *
 * @description
 * Aucune édition publiée : état vide, jamais un palmarès inventé.
 ********************************************************/
const isEmpty = computed(() => !pending.value && pageError.value === null && titles.value.length === 0)
const emptyTitle: ITranslatableText = { key: 'palmares.empty_title', fallback: 'Aucune édition publiée' }
const emptyDescription: ITranslatableText = { key: 'palmares.empty_text', fallback: 'Le palmarès s’affiche dès la première édition publiée.' }

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.palmares-page {
  &__hero {
    position: relative;
    isolation: isolate;
    overflow: hidden;
  }

  &__hero-content {
    position: relative;
    z-index: 1;
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__section {
    padding-top: var(--palmares-page__section---padding-top, var(--origam-space---20));
  }

  &__section--tight {
    padding-top: var(--palmares-page__section--tight---padding-top, var(--origam-space---8));
  }
}

@media (max-width: 760px) {
  .palmares-page__section {
    padding-top: var(--origam-space---14);
  }
}
</style>

<style>
:root {
  --palmares-page__section---padding-top: var(--origam-space---20);
  --palmares-page__section--tight---padding-top: var(--origam-space---8);
}
</style>
