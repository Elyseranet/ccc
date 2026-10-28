<template>
  <section
    class="edition-groups"
    aria-labelledby="edition-groups-title"
    data-cy="edition-groups"
  >
    <h2
      id="edition-groups-title"
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
        <p class="edition-groups__note">
          {{ note }}
        </p>
        <div class="edition-groups__grid">
          <section
            v-for="table in tableViews"
            :key="table.id"
            class="edition-groups__scroll"
            :aria-label="table.caption"
            tabindex="0"
            :data-cy="table.dataCy"
          >
            <app-data-table
              :headers="headers"
              :items="table.rows"
              :caption="table.caption"
              caption-visible
              :mobile-breakpoint="tableBreakpoint"
              hide-default-footer
              class="edition-groups__table"
            >
              <template #item.player="{ item }">
                <span class="edition-groups__player">
                  <common-player-link
                    :competitor="item.competitor"
                    inline
                  />
                  <edition-chip
                    v-if="item.qualified"
                    :family="qualifiedFamily"
                    :text="qualifiedText"
                    :aria-label="qualifiedLabel"
                  />
                </span>
              </template>
            </app-data-table>
          </section>
        </div>
      </template>
    </async-state>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import AsyncState from '~/components/common/AsyncState.vue'
import CommonPlayerLink from '~/components/common/PlayerLink.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import AppDataTable from '~/components/common/AppDataTable.vue'
import { useT } from '~/composables/useT'
import { EDITION_TABLE_BREAKPOINT } from '~/consts/edition-view.const'
import { EDITION_CHIP_FAMILY, EDITION_POOL_COLUMN } from '~/enums/edition-tab.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IEditionGroupsProps } from '~/interfaces/edition-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Un classement par poule (RG19 : victoires, puis cap's average, puis confrontation directe). L'ordre et le rang sont
 * ceux de l'API ; la pastille Q vient des données (RG18 : le nombre de qualifiés n'est pas codé en dur). Chaque tableau a un
 * titre visible (`caption`), des en-têtes de colonne (`th scope`) et défile horizontalement au clavier sur mobile.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionGroupsProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const tableBreakpoint = EDITION_TABLE_BREAKPOINT
const qualifiedFamily = EDITION_CHIP_FAMILY.TINTED_SUCCESS
const title = computed(() => t('edition.groups_title', 'Poules'))
const note = computed(() => t('edition.groups_note', 'Classement : victoires, puis cap’s average (RG19). Q = qualifié·e pour la phase finale (RG18 : selon la configuration retenue).'))
const qualifiedText = computed(() => t('edition.groups_qualified', 'Q'))
const qualifiedLabel = computed(() => t('edition.groups_qualified_label', 'Qualifié·e'))
const isEmpty = computed(() => props.tables.length === 0)
const emptyTitle: ITranslatableText = { key: 'edition.groups_empty_title', fallback: 'Aucune poule' }
const emptyDescription: ITranslatableText = { key: 'edition.groups_empty_text', fallback: 'Les poules de cette édition ne sont pas encore tirées.' }
const headers = computed<IDataTableHeader[]>(() => [
  { key: EDITION_POOL_COLUMN.RANK, title: t('edition.groups_col_rank', '#'), sortable: false, nowrap: true },
  { key: EDITION_POOL_COLUMN.PLAYER, title: t('edition.groups_col_player', 'Joueur'), sortable: false, nowrap: true },
  { key: EDITION_POOL_COLUMN.PLAYED, title: t('edition.groups_col_played', 'J'), sortable: false, nowrap: true, align: ALIGN.END },
  { key: EDITION_POOL_COLUMN.WINS, title: t('edition.groups_col_wins', 'V'), sortable: false, nowrap: true, align: ALIGN.END },
  { key: EDITION_POOL_COLUMN.LOSSES, title: t('edition.groups_col_losses', 'D'), sortable: false, nowrap: true, align: ALIGN.END },
  { key: EDITION_POOL_COLUMN.POINTS, title: t('edition.groups_col_points', 'Points'), sortable: false, nowrap: true, align: ALIGN.END },
  { key: EDITION_POOL_COLUMN.DIFFERENCE, title: t('edition.groups_col_difference', 'Diff.'), sortable: false, nowrap: true, align: ALIGN.END }
])
const tableViews = computed(() => props.tables.map(table => ({
  id: table.id,
  dataCy: `edition-pool-${table.rank}`,
  caption: t('edition.groups_caption', 'Poule {rank}', { rank: table.rank }),
  rows: table.rows.map(row => ({
    ...row,
    points: `${row.pointsFor}–${row.pointsAgainst}`,
    difference: row.capsAverage > 0 ? `+${row.capsAverage}` : String(row.capsAverage)
  }))
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
.edition-groups {
  &__note {
    margin: 0 0 var(--origam-space---5);
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--edition-groups---gap, var(--origam-space---4));
  }

  &__scroll {
    overflow-x: auto;
  }

  &__player {
    display: inline-flex;
    align-items: center;
    gap: var(--origam-space---2);
  }
}

@media (max-width: 760px) {
  .edition-groups__grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
:root {
  --edition-groups---gap: var(--origam-space---4);
}
</style>
