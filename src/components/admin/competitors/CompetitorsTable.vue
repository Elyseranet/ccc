<template>
  <div class="competitors-table">
    <app-data-table
      hide-default-footer
      hover
      :caption="caption"
      :headers="headers"
      :items="competitors"
      :items-per-page="pageSize"
      :row-props="rowProps"
      data-cy="competitors-table"
    >
      <template #[`item.displayName`]="{ item }">
        <span class="competitors-table__cell">
          <player-avatar
            :display-name="item.displayName"
            :avatar-url="item.avatarUrl"
          />
          <b>{{ item.displayName }}</b>
        </span>
      </template>
      <template #[`item.firstName`]="{ item }">
        <span>{{ item.firstName ?? noValue }}</span>
      </template>
      <template #[`item.lastName`]="{ item }">
        <span>{{ item.lastName ?? noValue }}</span>
      </template>
      <template #[`item.nickname`]="{ item }">
        <span class="competitors-table__nickname">{{ nicknameOf(item) }}</span>
      </template>
      <template #[`item.editionsPlayed`]="{ item }">
        <span class="competitors-table__num">{{ item.editionsPlayed }}</span>
      </template>
      <template #[`item.actions`]="{ item }">
        <origam-btn
          class="competitors-table__action"
          variant="text"
          color="primary"
          size="small"
          :to="linkOf(item)"
          :text="actionLabel"
          :aria-label="actionLabelOf(item)"
          :data-cy="`competitors-action-${item.id}`"
        />
      </template>
    </app-data-table>
    <div
      v-if="total > 0"
      class="competitors-table__pager"
      data-cy="competitors-pagination"
    >
      <span
        class="competitors-table__range"
        data-cy="competitors-pager-range"
      >{{ rangeText }}</span>
      <origam-pagination
        v-if="pageCount > 1"
        :model-value="page"
        :length="pageCount"
        :total-visible="visiblePages"
        :aria-label="paginationLabel"
        @update:model-value="handlePage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamPagination } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import PlayerAvatar from '~/components/players/PlayerAvatar.vue'
import { useT } from '~/composables/useT'
import { ADMIN_COMPETITOR_COLUMNS, ADMIN_COMPETITORS_PAGINATION_VISIBLE } from '~/consts/admin-competitors.const'
import type { ICompetitorsTableEmits, ICompetitorsTableProps } from '~/interfaces/admin-competitors.interface'
import type { ICompetitorListItem } from '~/interfaces/competitor.interface'
import { buildAdminCompetitorLink } from '~/utils/admin-competitors.util'

/*********************************************************
 * Global
 *
 * @description
 * Annuaire des compétiteurs (nom affiché, prénom, nom, pseudo, éditions, action « Corriger »). La liste et la pagination sont
 * celles de l'API : la table n'affiche que la page reçue. La ligne du compétiteur en cours de correction est marquée. Le lien
 * « Corriger » garde la recherche et la page de l'URL.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<ICompetitorsTableProps>(), {})
const emits = defineEmits<ICompetitorsTableEmits>()
defineSlots<{}>()
const visiblePages = ADMIN_COMPETITORS_PAGINATION_VISIBLE
const route = useRoute()
const noValue = computed(() => t('admin.competitors.no_value', '—'))
const actionLabel = computed(() => t('admin.competitors.action_fix', 'Corriger'))
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const caption = computed(() => t('admin.competitors.table_caption', 'Annuaire des compétiteurs, page {page} sur {pages}', { page: props.page, pages: pageCount.value }))
const paginationLabel = computed(() => t('admin.competitors.pagination_label', 'Pagination des compétiteurs'))
const rangeText = computed(() => t('admin.competitors.pagination_range', '{from}–{to} sur {total}', {
  from: (props.page - 1) * props.pageSize + 1,
  to: Math.min(props.page * props.pageSize, props.total),
  total: props.total
}))

/*********************************************************
 * En-têtes et cellules
 *
 * @description
 * Pas de tri : l'annuaire est classé par nom affiché. Les pseudos s'affichent entre guillemets, « — » sans pseudo.
 ********************************************************/
const headers = computed(() => ADMIN_COMPETITOR_COLUMNS.map(column => ({
  key: column.field,
  title: t(column.title.key, column.title.fallback),
  ...(column.align ? { align: column.align } : {}),
  sortable: false,
  width: column.width,
  minWidth: column.minWidth,
  nowrap: true
})))
const nicknameOf = (item: ICompetitorListItem): string => item.nickname
  ? t('admin.competitors.nickname_quoted', '« {nickname} »', { nickname: item.nickname })
  : noValue.value
const linkOf = (item: ICompetitorListItem) => ({ path: buildAdminCompetitorLink(item.id), query: route.query })
const actionLabelOf = (item: ICompetitorListItem): string => t('admin.competitors.action_fix_label', 'Corriger l’identité de {name}', { name: item.displayName })
const rowProps = ({ item }: { item: ICompetitorListItem }) => item.id === props.selectedId
  ? { class: 'competitors-table__row--selected', 'aria-current': 'true' }
  : {}

/*********************************************************
 * Pagination
 *
 * @description
 * Le parent possède la page (l'URL).
 ********************************************************/
const handlePage = (value: number) => {
  emits('update:page', value)
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
.competitors-table {
  &__cell {
    display: flex;
    align-items: center;
    gap: var(--competitors-table__cell---gap, var(--origam-space---3));
  }

  &__action {
    --origam-btn---height: var(--origam-space---11);
    --origam-btn---padding-sm: var(--origam-space---4);
    --origam-btn---font-size: var(--origam-font__size---sm);
  }

  &__num {
    font-variant-numeric: tabular-nums;
  }

  &__nickname {
    color: var(--competitors-table__nickname---color, var(--origam-color__text---secondary));
  }

  &__pager {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
    margin-top: var(--origam-space---5);
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  &__range {
    font-variant-numeric: tabular-nums;
  }

  :deep(.competitors-table__row--selected > td) {
    background: var(--competitors-table__selected---background, var(--origam-color__action--primary---bgSubtle));
  }

  :deep(.competitors-table__row--selected > td:first-child) {
    box-shadow: inset 3px 0 0 var(--competitors-table__selected---marker, var(--origam-color__action--primary---bg));
  }
}
</style>

<style>
:root {
  --competitors-table__cell---gap: var(--origam-space---3);
  --competitors-table__nickname---color: var(--origam-color__text---secondary);
  --competitors-table__selected---background: var(--origam-color__action--primary---bgSubtle);
  --competitors-table__selected---marker: var(--origam-color__action--primary---bg);
}
</style>
