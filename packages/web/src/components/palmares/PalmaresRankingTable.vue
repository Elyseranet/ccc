<template>
  <section
    class="palmares-ranking-table"
    :aria-label="caption"
    tabindex="0"
    :data-cy="dataCy"
  >
    <app-data-table
      hide-default-footer
      :caption="caption"
      caption-visible
      :headers="headers"
      :items="items"
      :items-per-page="-1"
      :sort-by="sortBy"
      :mobile-breakpoint="PALMARES_TABLE_BREAKPOINT"
      class="palmares-ranking-table__table"
    >
      <template #[`item.rank`]="{ item }">
        <span class="palmares-ranking-table__num">{{ item.rank }}</span>
      </template>
      <template #[`item.player`]="{ item }">
        <player-link
          inline
          flow
          :competitor="item.competitor"
          :titles="item.titles"
        />
      </template>
      <template #[`item.points`]="{ item }">
        <b class="palmares-ranking-table__num">{{ formatPoints(item.points) }}</b>
      </template>
      <template #[`item.otherPoints`]="{ item }">
        <span class="palmares-ranking-table__num">{{ formatPoints(item.otherPoints) }}</span>
      </template>
      <template #[`item.participations`]="{ item }">
        <span class="palmares-ranking-table__num">{{ item.participations }}</span>
      </template>
      <template #[`item.average`]="{ item }">
        <span class="palmares-ranking-table__num">{{ formatPoints(item.average) }}</span>
      </template>
    </app-data-table>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import AppDataTable from '~/components/common/AppDataTable.vue'
import PlayerLink from '~/components/common/PlayerLink.vue'
import { useT } from '~/composables/useT'
import { PALMARES_COLUMNS, PALMARES_POINTS_DIGITS, PALMARES_TABLE_BREAKPOINT } from '~/consts/palmares.const'
import { PALMARES_COLUMN } from '~/enums/palmares.enum'
import type { RANKING_KIND } from '~/enums/ranking-kind.enum'
import type { IPalmaresRankingTableProps } from '~/interfaces/palmares.interface'

/*********************************************************
 * Global
 *
 * @description
 * Un classement (ACP ou All Time) : légende visible, en-têtes de colonne, tri par colonne (`aria-sort` posé par la table).
 * Le rang est celui de l'API (les ex aequo le partagent déjà) ; les titres sont des étoiles dans la cellule du joueur (RG6).
 * La colonne du joueur n'est pas triable : trier des noms n'a pas de sens pour un classement.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPalmaresRankingTableProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const headers = computed<IDataTableHeader[]>(() => PALMARES_COLUMNS.map((column) => {
  const title = column.titles[props.kind as RANKING_KIND]
  return {
    key: column.key,
    value: column.key === PALMARES_COLUMN.PLAYER ? 'competitor.displayName' : column.key,
    title: t(title.key, title.fallback),
    align: column.align === 'end' ? ALIGN.END : ALIGN.START,
    nowrap: true,
    sortable: column.sortable
  }
}))
const items = computed(() => props.rows)
const sortBy = [{ key: PALMARES_COLUMN.RANK, order: 'asc' as const }]
const formatPoints = (value: number): string => value.toFixed(PALMARES_POINTS_DIGITS)

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.palmares-ranking-table {
  overflow-x: auto;

  &__num {
    font-variant-numeric: tabular-nums;
  }
}
</style>
