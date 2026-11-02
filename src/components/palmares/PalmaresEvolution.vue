<template>
  <div
    class="palmares-evolution"
    data-cy="palmares-evolution"
  >
    <async-state
      :empty="isEmpty"
      :empty-title="emptyTitle"
      :empty-description="emptyDescription"
    >
      <template #default>
        <origam-card
          tag="figure"
          rounded="xl"
          border
          elevation="md"
          padding="6"
          class="palmares-evolution__card"
        >
          <figcaption class="palmares-evolution__head">
            <span class="palmares-evolution__title">{{ chartTitle }}</span>
            <span class="palmares-evolution__note">{{ chartNote }}</span>
          </figcaption>
          <origam-chart
            type="line"
            :series="chartSeries"
            :categories="chartCategories"
            show-legend
            legend-position="top"
            :height="360"
            bg-color="transparent"
            show-grid
            show-tooltip
            :animated="false"
            class="palmares-evolution__chart"
            data-cy="palmares-evolution-chart"
          />
        </origam-card>
        <div
          class="palmares-evolution__details"
          data-cy="palmares-evolution-table"
        >
          <origam-btn
            variant="text"
            color="primary"
            padding-inline="3"
            :text="tableSummary"
            :aria-expanded="isTableOpen"
            :aria-controls="tableId"
            class="palmares-evolution__summary"
            data-cy="palmares-evolution-toggle"
            @click="isTableOpen = !isTableOpen"
          />
          <section
            v-show="isTableOpen"
            :id="tableId"
            class="palmares-evolution__scroll"
            :aria-label="tableCaption"
            tabindex="0"
          >
            <app-data-table
              hide-default-footer
              :headers="headers"
              :items="rows"
              :items-per-page="-1"
              :caption="tableCaption"
              :mobile-breakpoint="PALMARES_TABLE_BREAKPOINT"
            >
              <template #[`item.${PALMARES_COLUMN.PLAYER}`]="{ item }">
                <player-link
                  inline
                  :competitor="item.competitor"
                />
              </template>
              <template
                v-for="category in categoryViews"
                :key="category.code"
                #[`item.${category.code}`]="{ item }"
              >
                <span class="palmares-evolution__num">{{ item[category.code] }}</span>
              </template>
            </app-data-table>
          </section>
        </div>
      </template>
    </async-state>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import { OrigamBtn, OrigamCard, OrigamChart } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import PlayerLink from '~/components/common/PlayerLink.vue'
import { useT } from '~/composables/useT'
import { PALMARES_POINTS_DIGITS, PALMARES_SERIES_COLORS, PALMARES_TABLE_BREAKPOINT } from '~/consts/palmares.const'
import { PALMARES_COLUMN } from '~/enums/palmares.enum'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import type { IPalmaresEvolutionProps } from '~/interfaces/palmares.interface'

/*********************************************************
 * Global
 *
 * @description
 * Évolution des points ACP en fin d'édition pour les premiers du classement actuel (RG8), une seule échelle. Le graphique
 * est doublé d'un tableau équivalent (« Voir en tableau ») : aucune information n'est portée par la seule couleur, chaque
 * courbe est nommée dans la légende et le tableau donne toutes les valeurs. Une édition où un joueur n'a pas de valeur
 * n'est jamais remplacée par un zéro : le point est absent du graphique et « — » dans le tableau. Le tableau se déplie par un bouton
 * (`aria-expanded`, `aria-controls`) : la maquette le veut avec l'allure d'un bouton, qu'un `<summary>` natif ne donne pas.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPalmaresEvolutionProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const tableId = useId()
const isTableOpen = ref(false)
const isEmpty = computed(() => props.evolution.series.length === 0 || props.evolution.categories.length === 0)
const emptyTitle: ITranslatableText = { key: 'palmares.evolution_empty_title', fallback: 'Pas encore d’évolution' }
const emptyDescription: ITranslatableText = { key: 'palmares.evolution_empty_text', fallback: 'L’évolution s’affiche dès qu’une édition est close.' }
const chartTitle = computed(() => t('palmares.evolution_title', 'Points ACP en fin d’édition'))
const chartNote = computed(() => t('palmares.evolution_note', 'Les {count} premiers du classement actuel · RG8', { count: props.evolution.series.length }))
const chartLabel = computed(() => t('palmares.evolution_chart_label', 'Évolution des points ACP de {from} à {to} pour les {count} premiers du classement ; valeurs dans le tableau ci-dessous', {
  from: categoryLabel(0),
  to: categoryLabel(props.evolution.categories.length - 1),
  count: props.evolution.series.length
}))
const tableSummary = computed(() => t('palmares.evolution_table_summary', 'Voir en tableau'))
const tableCaption = computed(() => t('palmares.evolution_table_caption', 'Évolution des points ACP, tableau équivalent'))
const noValue = computed(() => t('palmares.no_value', '—'))

function categoryLabel (index: number): string {
  const option = props.evolution.categories[index]?.option
  if (!option) {
    return ''
  }
  return option.ordinal
    ? t('edition.selector_with_ordinal', '{year} · {ordinal}', { year: option.year, ordinal: t(option.ordinal.key, option.ordinal.fallback, option.ordinal.params) })
    : t('edition.selector_year', '{year}', { year: option.year })
}

/*********************************************************
 * Graphique
 *
 * @description
 * Une couleur du thème par courbe, dans l'ordre du classement.
 ********************************************************/
const categoryViews = computed(() => props.evolution.categories.map((category, index) => ({ code: category.code, label: categoryLabel(index) })))
const chartCategories = computed(() => categoryViews.value.map(category => category.label))
const chartSeries = computed(() => props.evolution.series.map((entry, index) => ({
  name: entry.competitor.displayName,
  color: PALMARES_SERIES_COLORS[index % PALMARES_SERIES_COLORS.length],
  data: entry.values.flatMap((value, position) => (value === null ? [] : [{ x: chartCategories.value[position] as string, y: value }]))
})))

/*********************************************************
 * Tableau équivalent
 *
 * @description
 * Une ligne par joueur, une colonne par édition.
 ********************************************************/
const headers = computed<IDataTableHeader[]>(() => [
  { key: PALMARES_COLUMN.PLAYER, title: t('palmares.evolution_col_player', 'Joueur'), sortable: false, nowrap: true },
  ...categoryViews.value.map((category): IDataTableHeader => ({ key: category.code, title: category.label, sortable: false, nowrap: true, align: ALIGN.END }))
])
const rows = computed(() => props.evolution.series.map(entry => ({
  competitor: entry.competitor,
  ...Object.fromEntries(props.evolution.categories.map((category, position) => {
    const value = entry.values[position] ?? null
    return [category.code, value === null ? noValue.value : value.toFixed(PALMARES_POINTS_DIGITS)]
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
.palmares-evolution {
  &__card {
    margin: 0;
  }

  &__head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--origam-space---2);
  }

  &__title {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__note {
    color: var(--origam-color__text---secondary);
  }

  &__details {
    margin-top: var(--origam-space---4);
  }

  &__scroll {
    overflow-x: auto;
    margin-top: var(--origam-space---3);
  }

  &__num {
    font-variant-numeric: tabular-nums;
  }
}
</style>
