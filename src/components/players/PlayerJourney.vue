<template>
  <section
    class="player-journey"
    aria-labelledby="player-journey-title"
    data-cy="player-journey"
  >
    <div class="player-journey__head">
      <origam-title
        id="player-journey-title"
        tag="h2"
        class="player-journey__title font-display neon--sm"
        :text="title"
      />
      <p class="player-journey__lead">{{ lead }}</p>
    </div>
    <origam-card
      class="player-journey__card"
      rounded="xl"
      border
      elevation="md"
    >
      <template #default>
        <ol
          class="player-journey__chart"
          aria-hidden="true"
          data-cy="player-journey-chart"
        >
          <li
            v-for="row in rows"
            :key="row.editionId"
            class="player-journey__bar"
            :class="barClasses(row)"
            :style="barStyle(row)"
          >
            <span class="player-journey__fill" />
            <b>{{ row.chartLabel }}</b>
            <i>{{ row.editionLabel }}</i>
          </li>
        </ol>
        <p class="sr-only">{{ chartNote }}</p>
        <app-data-table
          class="player-journey__table"
          hide-default-footer
          :border="false"
          :caption="tableCaption"
          :headers="headers"
          :items="tableRows"
          :items-per-page="-1"
          :row-props="rowProps"
          data-cy="player-journey-table"
        >
          <template #[`item.result`]="{ item }">
            <origam-chip
              v-if="isChip(item)"
              :color="chipColor(item)"
              :bg-color="chipColor(item)"
            >
              <template #default>
                {{ item.resultLabel }}
              </template>
            </origam-chip>
            <span v-else>{{ item.resultLabel }}</span>
          </template>
        </app-data-table>
      </template>
    </origam-card>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard, OrigamChip, OrigamTitle } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import { useT } from '~/composables/useT'
import { PLAYER_JOURNEY_COLUMNS, PLAYER_JOURNEY_LEVEL_STEP } from '~/consts/players.const'
import { PLAYER_JOURNEY_KIND } from '~/enums/player-journey-kind.enum'
import type { IPlayerJourneyProps, IPlayerJourneyRow } from '~/interfaces/players.interface'

/*********************************************************
 * Global
 *
 * @description
 * Parcours par édition : barres CSS (une série ordinale, tour atteint) et tableau équivalent, qui porte
 * toute l'information. Le graphique est décoratif pour les lecteurs d'écran. Aucun JS ne pilote l'animation :
 * la montée des barres est une animation CSS coupée sous `prefers-reduced-motion`.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPlayerJourneyProps>(), {
  bestLabel: null
})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Textes
 *
 * @description
 * Le sous-titre rappelle le meilleur résultat quand il existe.
 ********************************************************/
const title = computed(() => t('player.journey.title', 'Parcours'))
const lead = computed(() => props.bestLabel
  ? t('player.journey.lead_best', 'Tour atteint à chaque édition · meilleur : {best}', { best: props.bestLabel })
  : t('player.journey.lead', 'Tour atteint à chaque édition'))
const chartNote = computed(() => t('player.journey.chart_note', 'Le tableau ci-dessous donne les mêmes données.'))
const tableCaption = computed(() => t('player.journey.table_caption', 'Parcours par édition'))

/*********************************************************
 * Graphique
 *
 * @description
 * La hauteur d'une barre dépend du niveau atteint ; la variable CSS porte la valeur, le style reste dans la feuille.
 ********************************************************/
const barStyle = (row: IPlayerJourneyRow) => ({ '--player-journey__bar---level': row.level * PLAYER_JOURNEY_LEVEL_STEP })
const barClasses = (row: IPlayerJourneyRow) => ({
  'player-journey__bar--top': row.kind === PLAYER_JOURNEY_KIND.CHAMPION,
  'player-journey__bar--now': row.kind === PLAYER_JOURNEY_KIND.ONGOING
})

/*********************************************************
 * Tableau
 *
 * @description
 * Du plus récent au plus ancien, comme la maquette. Le titre est mis en valeur par une pastille et une ligne teintée.
 ********************************************************/
const headers = computed(() => PLAYER_JOURNEY_COLUMNS.map(column => ({
  key: column.field,
  title: t(column.title.key, column.title.fallback),
  align: column.align,
  nowrap: true,
  sortable: false
})))
const isChip = (row: IPlayerJourneyRow): boolean => row.kind !== PLAYER_JOURNEY_KIND.REACHED
const chipColor = (row: IPlayerJourneyRow): string => row.kind === PLAYER_JOURNEY_KIND.CHAMPION ? 'primary' : 'secondary'
const rowProps = ({ item }: { item: IPlayerJourneyRow }) => ({
  class: item.kind === PLAYER_JOURNEY_KIND.CHAMPION ? 'player-journey__row--top' : undefined
})

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
@keyframes player-journey-lift {
  from {
    transform: scaleY(0);
  }
}

.player-journey {
  padding-top: var(--origam-space---8);

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--origam-space---4);
    margin-bottom: var(--origam-space---8);
  }

  &__title {
    font-size: var(--origam-font__size---4xl);
    line-height: var(--origam-font__lineHeight---none);
  }

  &__lead {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__card {
    padding: var(--player-journey---padding, var(--origam-space---6));
  }

  &__chart {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    align-items: end;
    gap: var(--origam-space---2);
    height: var(--player-journey__chart---height, 16rem);
    margin: 0 0 var(--origam-space---6);
    padding: 0 0 var(--origam-space---2);
    list-style: none;
    border-bottom: 1px solid var(--origam-color__border---default);
  }

  &__bar {
    display: grid;
    grid-template-rows: 1fr auto auto;
    justify-items: center;
    height: 100%;
    gap: var(--origam-space---1);
    font-size: var(--origam-font__size---xs);

    b {
      white-space: nowrap;
      font-weight: var(--origam-font__weight---bold);
    }

    i {
      font-style: normal;
      color: var(--origam-color__text---tertiary);
    }
  }

  &__fill {
    align-self: end;
    width: min(100%, 2.75rem);
    height: calc(10% + var(--player-journey__bar---level, 0) * 1%);
    border-radius: var(--origam-radius---sm) var(--origam-radius---sm) 4px 4px;
    background: linear-gradient(to top, color-mix(in srgb, var(--origam-color__bar---neon) 70%, transparent), var(--origam-color__bar---neon));
    transform-origin: bottom;
    animation: player-journey-lift var(--origam-motion__duration---xslow) var(--origam-motion__easing---decelerate) both;
  }

  &__bar--top &__fill {
    background: var(--origam-color__bar---amber);
    box-shadow: 0 0 24px color-mix(in srgb, var(--origam-color__bar---amber) 60%, transparent);
  }

  &__bar--now &__fill {
    background: repeating-linear-gradient(-45deg, var(--origam-color__border---strong) 0 3px, transparent 3px 7px);
  }

  &__table :deep(.player-journey__row--top td) {
    background: var(--origam-color__action--primary---bgSubtle);
  }

  @media (max-width: 760px) {
    &__chart {
      height: var(--player-journey__chart---height-mobile, 12rem);
      gap: var(--origam-space---1);
    }

    &__bar b {
      display: none;
    }

    &__bar i {
      writing-mode: vertical-rl;
      rotate: 180deg;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__fill {
      animation: none;
    }
  }
}
</style>

<style>
:root {
  --player-journey---padding: var(--origam-space---6);
  --player-journey__chart---height: 16rem;
  --player-journey__chart---height-mobile: 12rem;
}
</style>
