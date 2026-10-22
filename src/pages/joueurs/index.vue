<template>
  <div
    class="players-page"
    data-cy="players-page"
  >
    <page-hero
      :title="heroTitle"
      :subtitle="heroSubtitle"
    >
      <template #eyebrow>
        <p class="players-page__eyebrow">{{ eyebrow }}</p>
      </template>
    </page-hero>
    <div class="page-wrap">
      <players-search
        :q="draft"
        :edition="state.edition"
        :edition-options="editionOptions"
        @update:q="setQuery"
        @update:edition="setEdition"
        @submit="applyDraft"
      />
      <p
        class="players-page__count"
        role="status"
        aria-live="polite"
        data-cy="players-count"
      >{{ countText }}</p>
      <async-state
        :pending="isLoading"
        :error="error"
        :empty="isEmpty"
        :empty-title="emptyTitle"
        :empty-description="emptyDescription"
        @retry="refresh"
      >
        <players-directory
          :items="items"
          :total="total"
          :page="state.page"
          :page-size="pageSize"
          :sort="state.sort"
          :order="state.order"
          :edition-filtered="isEditionFiltered"
          @update:page="setPage"
          @update:sort="setSort"
        />
      </async-state>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AsyncState from '~/components/common/AsyncState.vue'
import PageHero from '~/components/common/PageHero.vue'
import PlayersDirectory from '~/components/players/PlayersDirectory.vue'
import PlayersSearch from '~/components/players/PlayersSearch.vue'
import { useArchiveStats } from '~/composables/useEditions'
import { usePlayerSearch } from '~/composables/usePlayerSearch'
import { useT } from '~/composables/useT'
import type { ITranslatableText } from '~/interfaces/common-components.interface'

/*********************************************************
 * Page
 *
 * @description
 * Annuaire public des joueurs (`/joueurs`). L'état de la recherche vit dans l'URL ; la page reste fine,
 * la logique est dans `usePlayerSearch`.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
useHead({ title: computed(() => t('pages.players.title', 'Joueurs')) })

/*********************************************************
 * Données
 *
 * @description
 * Le sous-titre affiche le nombre de compétiteurs de l'archive, indépendamment des filtres.
 ********************************************************/
const { state, draft, items, total, pageSize, pending, error, refresh, editionOptions, countText, isEditionFiltered, setQuery, applyDraft, setEdition, setSort, setPage } = usePlayerSearch()
const { data: stats } = useArchiveStats()
const eyebrow = computed(() => t('players.eyebrow', 'Annuaire'))
const heroTitle: ITranslatableText = { key: 'players.title', fallback: 'Joueurs' }
const heroSubtitle = computed<ITranslatableText | undefined>(() => stats.value
  ? { key: 'players.lead', fallback: '{count} compétiteurs ont joué au moins une édition depuis 2012.', params: { count: stats.value.competitors } }
  : undefined)

/*********************************************************
 * États
 *
 * @description
 * Le squelette ne remplace la table qu'au premier chargement : pas de clignotement à chaque frappe.
 ********************************************************/
const isLoading = computed(() => pending.value && items.value.length === 0)
const isEmpty = computed(() => !pending.value && error.value === null && total.value === 0)
const emptyTitle: ITranslatableText = { key: 'players.empty.title', fallback: 'Aucun joueur ne correspond' }
const emptyDescription: ITranslatableText = { key: 'players.empty.description', fallback: 'Essayez un autre nom ou pseudo, ou choisissez toutes les éditions.' }

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.players-page {
  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__count {
    font-variant-numeric: tabular-nums;
    margin: var(--origam-space---5) 0 var(--origam-space---3);
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }
}
</style>
