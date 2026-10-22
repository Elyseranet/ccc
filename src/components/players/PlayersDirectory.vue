<template>
  <div
    class="players-directory"
    data-cy="players-directory"
  >
    <app-data-table
      class="players-directory__table"
      hide-default-footer
      :caption="caption"
      :headers="headers"
      :items="items"
      :items-per-page="pageSize"
      :sort-by="sortBy"
      data-cy="players-table"
      @update:sort-by="handleSortBy"
    >
      <template #[`item.displayName`]="{ item }">
        <span class="players-directory__cell">
          <player-avatar
            :display-name="item.displayName"
            :avatar-url="item.avatarUrl"
          />
          <span class="players-directory__identity">
            <player-link
              :competitor="item"
              :titles="item.titles"
            />
            <small
              v-if="item.nickname"
              class="players-directory__nickname"
            >{{ nicknameOf(item) }}</small>
          </span>
        </span>
      </template>
      <template #[`item.editionsPlayed`]="{ item }">
        <span class="players-directory__num">{{ item.editionsPlayed }}</span>
      </template>
      <template #[`item.matchesPlayed`]="{ item }">
        <span class="players-directory__num">{{ item.matchesPlayed }}</span>
        <small
          v-if="item.unknownResults > 0"
          class="players-directory__unknown"
          data-cy="players-unknown-results"
        >{{ unknownText(item.unknownResults) }}</small>
      </template>
      <template #[`item.wins`]="{ item }">
        <span class="players-directory__num">{{ item.wins }}</span>
      </template>
      <template #[`item.titles`]="{ item }">
        <span class="players-directory__num">{{ item.titles > 0 ? item.titles : noValue }}</span>
      </template>
      <template #[`item.firstEdition`]="{ item }">
        <span class="players-directory__num">{{ firstEditionOf(item) }}</span>
      </template>
    </app-data-table>
    <p
      v-if="editionFiltered"
      class="players-directory__note"
      data-cy="players-career-note"
    >{{ careerNote }}</p>
    <players-pager
      v-if="total > 0"
      :page="page"
      :total="total"
      :page-size="pageSize"
      @update:page="handlePage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppDataTable from '~/components/common/AppDataTable.vue'
import type { ICompetitorListItem } from '~/interfaces/competitor.interface'
import PlayerLink from '~/components/common/PlayerLink.vue'
import PlayerAvatar from '~/components/players/PlayerAvatar.vue'
import PlayersPager from '~/components/players/PlayersPager.vue'
import { usePlayerFormat } from '~/composables/usePlayerFormat'
import { useT } from '~/composables/useT'
import { PLAYERS_COLUMN_VALUES, PLAYERS_COLUMNS, PLAYERS_KEEP_SERVER_ORDER, PLAYERS_SORT_DEFAULT_ORDER } from '~/consts/players.const'
import { COMPETITOR_SORT, SORT_ORDER } from '~/enums/competitor-sort.enum'
import type { IPlayersDirectoryEmits, IPlayersDirectoryProps } from '~/interfaces/players.interface'

/*********************************************************
 * Global
 *
 * @description
 * Annuaire des joueurs. Le tri et la pagination sont faits par l'API (la table n'affiche que la page reçue) :
 * chaque en-tête déclare un comparateur neutre pour que la table ne réordonne pas la page localement.
 * R-5 : « Matchs » et « Victoires » ne comptent que les matchs avec score ; les matchs au résultat inconnu
 * sont annoncés à côté. Les statistiques sont celles de la carrière, quel que soit le filtre d'édition.
 ********************************************************/
const { t } = useT()
const { editionLabel } = usePlayerFormat()
const props = withDefaults(defineProps<IPlayersDirectoryProps>(), {})
const emits = defineEmits<IPlayersDirectoryEmits>()
defineSlots<{}>()

/*********************************************************
 * En-têtes et tri
 *
 * @description
 * La clé de colonne est la clé de tri de l'API ; `firstEdition` lit `firstEditionCode`.
 ********************************************************/
const headers = computed(() => PLAYERS_COLUMNS.map(column => ({
  key: column.key,
  value: PLAYERS_COLUMN_VALUES[column.key],
  title: t(column.title.key, column.title.fallback),
  align: column.align,
  width: column.width,
  nowrap: true,
  sortable: true,
  sort: PLAYERS_KEEP_SERVER_ORDER
})))
const sortBy = computed(() => [{ key: props.sort, order: props.order }])
const handleSortBy = (value: Array<{ key: string, order?: boolean | string }>) => {
  const [first] = value
  if (!first) {
    emits('update:sort', { sort: props.sort, order: props.order === SORT_ORDER.ASC ? SORT_ORDER.DESC : SORT_ORDER.ASC })
    return
  }
  const sort = first.key as COMPETITOR_SORT
  emits('update:sort', { sort, order: first.order === 'desc' ? SORT_ORDER.DESC : (first.order === 'asc' ? SORT_ORDER.ASC : PLAYERS_SORT_DEFAULT_ORDER[sort]) })
}

/*********************************************************
 * Cellules
 *
 * @description
 * L'avatar est décoratif (le nom est à côté) ; sans photo, les initiales.
 ********************************************************/
const noValue = computed(() => t('players.no_value', '—'))
const nicknameOf = (item: ICompetitorListItem): string => t('players.nickname', ' « {nickname} »', { nickname: item.nickname ?? '' })
const firstEditionOf = (item: ICompetitorListItem): string => item.firstEditionCode ? editionLabel(item.firstEditionCode) : noValue.value
const unknownText = (count: number): string => count === 1
  ? t('players.unknown_results_one', '1 match au résultat inconnu')
  : t('players.unknown_results_other', '{count} matchs au résultat inconnu', { count })

/*********************************************************
 * Libellés et pagination
 *
 * @description
 * La légende du tableau annonce la page courante aux lecteurs d'écran.
 ********************************************************/
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const caption = computed(() => t('players.table.caption', 'Liste des compétiteurs, page {page} sur {pages}', { page: props.page, pages: pageCount.value }))
const careerNote = computed(() => t('players.career_note', 'Les statistiques sont celles de toute la carrière, quelle que soit l’édition choisie.'))
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
.players-directory {
  &__cell {
    display: flex;
    align-items: center;
    gap: var(--players-directory__cell---gap, var(--origam-space---3));
  }

  &__identity {
    display: flex;
    align-items: baseline;

    :deep(.player-link) {
      --origam-btn---height: auto;
      --origam-btn---min-height: 0;
      --origam-btn---min-width: 0;
      --origam-btn---padding-sm: 0;
      --origam-btn---font-size: var(--origam-font__size---sm);
      --origam-btn---line-height: var(--origam-font__lineHeight---normal);
      padding-inline: 0;
    }
  }

  &__nickname {
    white-space: pre;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  &__num {
    font-variant-numeric: tabular-nums;
  }

  &__unknown {
    display: block;
    font-size: var(--origam-font__size---xs);
    color: var(--origam-color__text---tertiary);
  }

  &__note {
    margin: var(--origam-space---3) 0 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---tertiary);
  }

}
</style>

<style>
:root {
  --players-directory__cell---gap: var(--origam-space---3);
}
</style>
