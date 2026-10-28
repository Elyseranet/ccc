<template>
  <section
    class="edition-matches"
    aria-labelledby="edition-matches-title"
    data-cy="edition-matches"
  >
    <h2
      id="edition-matches-title"
      class="sr-only"
    >
      {{ title }}
    </h2>
    <async-state
      :empty="isEmpty"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
    >
      <template #default>
        <origam-chip-group
          v-model="filter"
          mandatory
          filter
          :aria-label="filtersLabel"
          class="edition-matches__filters"
          data-cy="edition-matches-filters"
        >
          <origam-chip
            v-for="entry in filterViews"
            :key="entry.value"
            :value="entry.value"
            size="large"
            border
            border-color="var(--origam-color__border---default)"
            pill
            filter-icon=""
            :color="entry.color"
            :bg-color="entry.bgColor"
            :data-cy="entry.dataCy"
          >
            <template #filter />
            <template #default>
              <span class="edition-matches__label">
                {{ entry.label }}
                <span
                  class="edition-matches__count"
                  :class="{ 'edition-matches__count--selected': entry.selected }"
                >{{ entry.count }}</span>
              </span>
            </template>
          </origam-chip>
        </origam-chip-group>
        <section
          class="edition-matches__scroll"
          :aria-label="caption"
          tabindex="0"
          data-cy="edition-matches-scroll"
        >
          <app-data-table
            :headers="headers"
            :items="pageRows"
            :caption="caption"
            :items-per-page="pageSize"
            :mobile-breakpoint="tableBreakpoint"
            hide-default-footer
            class="edition-matches__table"
            data-cy="edition-matches-table"
          >
            <template #item.first="{ item }">
              <span
                class="edition-matches__side"
                :class="{ 'edition-matches__side--win': item.hasWinner }"
              >
                <common-player-link
                  v-if="item.first"
                  :competitor="item.first"
                  inline
                />
              </span>
            </template>
            <template #item.second="{ item }">
              <span
                class="edition-matches__side"
                :class="{ 'edition-matches__side--lose': item.hasWinner }"
              >
                <common-player-link
                  v-if="item.second"
                  :competitor="item.second"
                  inline
                />
              </span>
            </template>
            <template #item.score="{ item }">
              <span class="edition-matches__score font-display">{{ item.score }}</span>
            </template>
            <template #item.status="{ item }">
              <edition-chip
                :family="item.family"
                :text="item.statusText"
              />
            </template>
          </app-data-table>
        </section>
        <div
          v-if="total > 0"
          class="edition-matches__pager"
          data-cy="edition-matches-pagination"
        >
          <span
            class="edition-matches__range"
            data-cy="edition-matches-range"
          >{{ rangeText }}</span>
          <origam-pagination
            :model-value="page"
            :length="pageCount"
            :total-visible="paginationVisible"
            :aria-label="paginationLabel"
            @update:model-value="handlePage"
          />
        </div>
      </template>
    </async-state>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import { OrigamChip, OrigamChipGroup, OrigamPagination } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import CommonPlayerLink from '~/components/common/PlayerLink.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import { EDITION_MATCH_FILTERS, EDITION_MATCH_STATUS_VIEW, EDITION_MATCHES_PAGE_SIZE, EDITION_MATCHES_PAGINATION_VISIBLE, EDITION_TABLE_BREAKPOINT } from '~/consts/edition-view.const'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import { EDITION_MATCH_COLUMN, EDITION_MATCH_FILTER } from '~/enums/edition-tab.enum'
import { ROUND_KIND } from '~/enums/round.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IEditionMatchesProps } from '~/interfaces/edition-view.interface'
import { editionMatchFilterCounts, filterEditionMatchRows, pageSlice } from '~/utils/edition-view.util'

/*********************************************************
 * Global
 *
 * @description
 * Matchs de l'édition, du plus récent au plus ancien, avec filtre (Tous, Poules, Phase finale) et pagination. L'édition
 * publie tous ses matchs publics : filtre et pagination se font ici, sans nouvelle requête (« Phase finale » regroupe plusieurs
 * tours, ce que `?tour=` d'une seule valeur ne sait pas faire). N° = `{édition}-{rang}` (RG24). Aucun score non validé
 * n'est affiché : sans vainqueur, ni vainqueur ni score ne sont montrés, les deux joueurs restent dans l'ordre de l'API.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionMatchesProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const pageSize = EDITION_MATCHES_PAGE_SIZE
const paginationVisible = EDITION_MATCHES_PAGINATION_VISIBLE
const tableBreakpoint = EDITION_TABLE_BREAKPOINT
const filter = ref<EDITION_MATCH_FILTER>(EDITION_MATCH_FILTER.ALL)
const page = ref(1)
watch(filter, () => {
  page.value = 1
})

/*********************************************************
 * Textes
 *
 * @description
 * Libellés et en-têtes : clés de traduction.
 ********************************************************/
const title = computed(() => t('edition.matches_title', 'Matchs'))
const caption = computed(() => t('edition.matches_caption', 'Matchs de l’édition {code}', { code: props.code }))
const filtersLabel = computed(() => t('edition.matches_filters_label', 'Filtrer les matchs'))
const paginationLabel = computed(() => t('edition.matches_pagination_label', 'Pagination des matchs'))
const isEmpty = computed(() => props.rows.length === 0)
const emptyTitle: ITranslatableText = { key: 'edition.matches_empty_title', fallback: 'Aucun match' }
const emptyDescription: ITranslatableText = { key: 'edition.matches_empty_text', fallback: 'Aucun match n’est encore publié pour cette édition.' }
const filterViews = computed(() => {
  const counts = editionMatchFilterCounts(props.rows)
  return EDITION_MATCH_FILTERS.map(entry => ({
    value: entry.value,
    dataCy: entry.dataCy,
    color: filter.value === entry.value ? 'secondary' : 'var(--origam-color__text---secondary)',
    bgColor: filter.value === entry.value ? 'secondary' : 'transparent',
    selected: filter.value === entry.value,
    label: t(entry.label.key, entry.label.fallback),
    count: counts[entry.value === EDITION_MATCH_FILTER.ALL ? 'all' : entry.value]
  }))
})
const headers = computed<IDataTableHeader[]>(() => [
  { key: EDITION_MATCH_COLUMN.NUMBER, title: t('edition.matches_col_number', 'N°'), sortable: false, nowrap: true },
  { key: EDITION_MATCH_COLUMN.ROUND, title: t('edition.matches_col_round', 'Tour'), sortable: false, nowrap: true },
  { key: EDITION_MATCH_COLUMN.FIRST, title: t('edition.matches_col_winner', 'Vainqueur'), sortable: false, nowrap: true },
  { key: EDITION_MATCH_COLUMN.SCORE, title: t('edition.matches_col_score', 'Score'), sortable: false, nowrap: true, align: ALIGN.END },
  { key: EDITION_MATCH_COLUMN.SECOND, title: t('edition.matches_col_opponent', 'Adversaire'), sortable: false, nowrap: true },
  { key: EDITION_MATCH_COLUMN.STATUS, title: t('edition.matches_col_status', 'Statut'), sortable: false, nowrap: true }
])

/*********************************************************
 * Lignes et pagination
 *
 * @description
 * La colonne « Vainqueur » devient « premier joueur » tant que le match n'a pas de vainqueur public.
 ********************************************************/
const filtered = computed(() => filterEditionMatchRows(props.rows, filter.value))
const total = computed(() => filtered.value.length)
const slice = computed(() => pageSlice(filtered.value, page.value, pageSize))
const pageCount = computed(() => slice.value.pageCount)
const roundLabel = (row: IEditionMatchesProps['rows'][number]): string => {
  const base = row.roundKind === ROUND_KIND.POOLS && row.poolRank !== null
    ? t('edition.matches_round_pool', 'Poule {rank}', { rank: row.poolRank })
    : t(ROUND_LABELS[row.roundKind].match.key, ROUND_LABELS[row.roundKind].match.label)
  return row.isTiebreak ? t('edition.matches_round_tiebreak', '{round} · départage', { round: base }) : base
}
const pageRows = computed(() => slice.value.items.map((row) => {
  const status = EDITION_MATCH_STATUS_VIEW[row.status]
  return {
    ...row,
    round: roundLabel(row),
    score: row.firstScore !== null && row.secondScore !== null ? t('edition.matches_score', '{first} – {second}', { first: row.firstScore, second: row.secondScore }) : t('edition.matches_no_score', '–'),
    family: status.family,
    statusText: t(status.label.key, status.label.fallback)
  }
}))
const from = computed(() => (slice.value.page - 1) * pageSize + 1)
const to = computed(() => Math.min(slice.value.page * pageSize, total.value))
const rangeText = computed(() => t('edition.matches_range', '{from}–{to} sur {total}', { from: from.value, to: to.value, total: total.value }))
const handlePage = (value: number) => {
  page.value = value
}

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.edition-matches {
  &__filters {
    --origam-chip---height-lg: calc(var(--origam-space---11) - 2 * var(--origam-border__width---thin));
    --origam-chip---padding-lg: var(--origam-space---4);
    --origam-chip---font-size-lg: var(--origam-font__size---md);

    margin-bottom: var(--origam-space---4);
  }

  &__scroll {
    overflow-x: auto;
  }

  &__filters {
    overflow: visible;
  }

  &__filters :deep(.origam-slide-group__container),
  &__filters :deep(.origam-slide-group__content) {
    flex-wrap: wrap;
    overflow: visible;
  }

  &__filters :deep(.origam-slide-group__content) {
    flex: 1 1 auto;
    min-width: 0;
    gap: var(--origam-space---2);
  }

  &__label {
    display: inline-flex;
    align-items: center;
    gap: var(--origam-space---2);
  }

  &__count {
    padding-inline: var(--origam-space---2);
    border-radius: var(--origam-radius---full);
    background: var(--origam-color__surface---overlay);
    font-size: var(--origam-font__size---xs);
    line-height: var(--origam-font__lineHeight---normal);
    font-variant-numeric: tabular-nums;

    &--selected {
      background: var(--origam-color__surface---default);
      color: var(--origam-color__text---primary);
    }
  }

  &__score {
    display: block;
    font-size: var(--origam-font__size---lg);
    line-height: var(--origam-font__lineHeight---normal);
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__bar---amber);
  }

  &__side {
    &--win {
      font-weight: var(--origam-font__weight---bold);
      color: var(--origam-color__text---primary);
    }

    &--lose {
      color: var(--origam-color__text---secondary);
    }
  }

  &__pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--edition-matches---gap, var(--origam-space---3));
    margin-top: var(--origam-space---5);
  }

  &__range {
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__text---secondary);
  }
}
</style>

<style>
:root {
  --edition-matches---gap: var(--origam-space---3);
}
</style>
