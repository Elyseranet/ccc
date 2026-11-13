<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    padding="6"
    :aria-labelledby="titleId"
    class="qualification-ranking"
    data-cy="qualification-ranking"
  >
    <template #default>
      <header class="qualification-ranking__head">
        <h2
          :id="titleId"
          class="qualification-ranking__title"
        >
          {{ title }}
        </h2>
        <div class="qualification-ranking__field">
          <origam-label
            :for="selectId"
            class="qualification-ranking__label"
            :text="poolLabel"
          />
          <origam-select
            :id="selectId"
            :model-value="selected"
            :items="poolItems"
            :label="poolLabel"
            single-line
            rounded="full"
            hide-details
            :menu-icon="CaretDown"
            class="qualification-ranking__select"
            data-cy="qualification-pool-select"
            @update:model-value="handleSelect"
          />
        </div>
      </header>
      <div
        v-for="table in views"
        :key="table.key"
        class="qualification-ranking__scroll"
        :data-cy="table.dataCy"
      >
        <app-data-table
          :headers="headers"
          :items="table.rows"
          :caption="table.caption"
          :caption-visible="table.captionVisible"
          hide-default-footer
          class="qualification-ranking__table"
        >
          <template #item.player="{ item }">
            <strong>{{ item.competitor.displayName }}</strong>
          </template>
          <template #item.status="{ item }">
            <edition-chip
              :family="item.family"
              :text="item.statusText"
            />
          </template>
        </app-data-table>
      </div>
      <p class="qualification-ranking__note">
        {{ note }}
      </p>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import { OrigamCard, OrigamLabel, OrigamSelect } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import CaretDown from '~/components/icons/CaretDown.vue'
import { useT } from '~/composables/useT'
import { QUALIFICATION_RANK_STATUS_VIEW } from '~/consts/qualification-view.const'
import { ADMIN_MATCH_ALL_POOLS_VALUE } from '~/consts/admin-match-filters.const'
import { QUALIFICATION_RANK_COLUMN } from '~/enums/qualification.enum'
import type { IQualificationRankingProps } from '~/interfaces/qualification-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Classement des poules, une table par poule (le sélecteur « Poule » en montre une ou toutes) : l'ordre et le rang sont ceux de l'API (victoires, cap's average,
 * confrontation directe : A10). Le statut est provisoire tant que la liste n'est pas arrêtée et s'écrit en toutes lettres (pastille avec texte).
 * Les cellules reviennent à la ligne et le tableau ne défile pas (décision front-lead, mapping F-24).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IQualificationRankingProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const titleId = useId()
const selectId = useId()
const selected = ref<string | number>(ADMIN_MATCH_ALL_POOLS_VALUE)
const title = computed(() => t('admin.qualification.ranking_title', 'Classement des poules'))
const poolLabel = computed(() => t('admin.qualification.ranking_pool', 'Poule'))
const note = computed(() => t('admin.qualification.ranking_note', 'Ordre : victoires, puis cap’s average, puis confrontation directe. Le statut reste provisoire tant que la liste n’est pas arrêtée.'))
const poolItems = computed(() => [
  { title: t('admin.qualification.ranking_all_pools', 'Toutes les poules'), value: ADMIN_MATCH_ALL_POOLS_VALUE },
  ...props.tables.map(table => ({ title: t('admin.qualification.ranking_pool_n', 'Poule {rank}', { rank: table.poolRank }), value: table.poolRank }))
])
const headers = computed<IDataTableHeader[]>(() => [
  { key: QUALIFICATION_RANK_COLUMN.RANK, title: t('admin.qualification.ranking_col_rank', '#'), sortable: false },
  { key: QUALIFICATION_RANK_COLUMN.PLAYER, title: t('admin.qualification.ranking_col_player', 'Joueur'), sortable: false },
  { key: QUALIFICATION_RANK_COLUMN.WINS, title: t('admin.qualification.ranking_col_wins', 'V'), sortable: false, align: ALIGN.END },
  { key: QUALIFICATION_RANK_COLUMN.DIFFERENCE, title: t('admin.qualification.ranking_col_difference', 'Diff.'), sortable: false, align: ALIGN.END },
  { key: QUALIFICATION_RANK_COLUMN.STATUS, title: t('admin.qualification.ranking_col_status', 'Statut'), sortable: false }
])
const shown = computed(() => selected.value === ADMIN_MATCH_ALL_POOLS_VALUE ? props.tables : props.tables.filter(table => table.poolRank === selected.value))
const views = computed(() => shown.value.map(table => ({
  key: table.key,
  dataCy: `qualification-pool-${table.poolRank}`,
  caption: t('admin.qualification.ranking_caption', 'Classement de la poule {rank}', { rank: table.poolRank }),
  captionVisible: shown.value.length > 1,
  rows: table.rows.map(row => ({
    ...row,
    family: QUALIFICATION_RANK_STATUS_VIEW[row.status].family,
    statusText: t(QUALIFICATION_RANK_STATUS_VIEW[row.status].label.key, QUALIFICATION_RANK_STATUS_VIEW[row.status].label.fallback)
  }))
})))
const handleSelect = (value: string | number | null) => {
  selected.value = value ?? ADMIN_MATCH_ALL_POOLS_VALUE
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
.qualification-ranking {
  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--qualification-ranking---gap, var(--origam-space---3));
    margin-bottom: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__field {
    display: flex;
    align-items: center;
    gap: var(--origam-space---3);
    min-width: 0;
  }

  &__label {
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
  }

  &__select {
    width: var(--qualification-ranking__select---width, 12rem);
    max-width: 100%;
  }

  &__scroll + &__scroll {
    margin-top: var(--origam-space---5);
  }

  &__table :deep(th),
  &__table :deep(td) {
    white-space: normal;
  }

  &__note {
    margin: var(--origam-space---3) 0 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }
}
</style>

<style>
:root {
  --qualification-ranking---gap: var(--origam-space---3);
  --qualification-ranking__select---width: 12rem;
}
</style>
