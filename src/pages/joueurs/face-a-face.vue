<template>
  <div class="head-to-head-page">
    <page-hero
      class="head-to-head-page__hero"
      :title="heroTitle"
      :subtitle="heroSubtitle"
      :breadcrumb="breadcrumb"
    />
    <div class="page-wrap head-to-head-page__body">
      <head-to-head-picker
        :player-a="playerAId"
        :player-b="playerBId"
        :search-a="searchA"
        :search-b="searchB"
        :options-a="optionsA"
        :options-b="optionsB"
        :error-a="errorA"
        :error-b="errorB"
        @update:player-a="selectPlayerA"
        @update:player-b="selectPlayerB"
        @update:search-a="handleSearchA"
        @update:search-b="handleSearchB"
        @swap="swapPlayers"
      />
      <async-state
        v-if="showState"
        :pending="isPending"
        :error="pageError"
        :empty="isIdle"
        :empty-title="idleTitle"
        :empty-description="idleDescription"
        @retry="retry"
      >
        <template #default>
          <template v-if="comparison">
            <head-to-head-summary
              :comparison="comparison"
              :detail-a="detailA"
              :detail-b="detailB"
            />
            <head-to-head-history
              :comparison="comparison"
              :detail-a="detailA"
              :detail-b="detailB"
            />
          </template>
        </template>
      </async-state>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AsyncState from '~/components/common/AsyncState.vue'
import PageHero from '~/components/common/PageHero.vue'
import HeadToHeadHistory from '~/components/head-to-head/HeadToHeadHistory.vue'
import HeadToHeadPicker from '~/components/head-to-head/HeadToHeadPicker.vue'
import HeadToHeadSummary from '~/components/head-to-head/HeadToHeadSummary.vue'
import { useHeadToHeadComparison } from '~/composables/useHeadToHeadComparison'
import { useT } from '~/composables/useT'
import { ROUTES } from '~/consts/routes.const'
import type { IBreadcrumbEntry, ITranslatableText } from '~/interfaces/common-components.interface'

/*********************************************************
 * Page
 *
 * @description
 * Face-à-face : deux joueurs, leurs rencontres (RG36) et leurs bilans globaux (RG37). La paire vit dans l'URL
 * (`?a=&b=`) pour être partageable ; toute la logique est dans `useHeadToHeadComparison`.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const title = computed(() => t('pages.head_to_head.title', 'Face-à-face'))
useHead({ title })

/*********************************************************
 * Logique de l'écran
 *
 * @description
 * La page ne fait que brancher le composable sur les composants.
 ********************************************************/
const {
  playerAId,
  playerBId,
  searchA,
  searchB,
  optionsA,
  optionsB,
  errorA,
  errorB,
  detailA,
  detailB,
  comparison,
  pageError,
  isIdle,
  isPending,
  selectPlayerA,
  selectPlayerB,
  swapPlayers,
  retry
} = useHeadToHeadComparison()
const showState = computed(() => isIdle.value || isPending.value || pageError.value !== null || comparison.value !== null)
const handleSearchA = (value: string) => {
  searchA.value = value
}
const handleSearchB = (value: string) => {
  searchB.value = value
}

/*********************************************************
 * Textes
 *
 * @description
 * Titre, chapeau, fil d'Ariane et état d'attente sont des clés de traduction, traduites par les composants communs.
 ********************************************************/
const heroTitle: ITranslatableText = { key: 'pages.head_to_head.title', fallback: 'Face-à-face' }
const heroSubtitle: ITranslatableText = {
  key: 'head_to_head.hero.lead',
  fallback: 'Deux joueurs, leur historique de rencontres et leur bilan global. Les matchs de départage ne comptent pas.'
}
const breadcrumb: IBreadcrumbEntry[] = [
  { text: { key: 'head_to_head.hero.crumb_home', fallback: 'Accueil' }, to: ROUTES.HOME },
  { text: { key: 'layout.header.nav_players', fallback: 'Joueurs' }, to: ROUTES.PLAYERS },
  { text: { key: 'pages.head_to_head.title', fallback: 'Face-à-face' } }
]
const idleTitle: ITranslatableText = { key: 'head_to_head.idle.title', fallback: 'Choisissez deux joueurs' }
const idleDescription: ITranslatableText = { key: 'head_to_head.idle.description', fallback: 'Sélectionnez deux joueurs pour comparer leurs rencontres et leurs bilans.' }

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.head-to-head-page {
  &__hero {
    --page-hero---padding-block: var(--head-to-head-page__hero---padding-block, var(--origam-space---6) var(--origam-space---8));
  }

  &__body {
    padding-bottom: var(--origam-space---16);
  }
}
</style>

<style>
:root {
  --head-to-head-page__hero---padding-block: var(--origam-space---6) var(--origam-space---8);
}
</style>
