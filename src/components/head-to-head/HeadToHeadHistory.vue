<template>
  <section
    class="head-to-head-history"
    aria-labelledby="head-to-head-history-title"
    data-cy="head-to-head-history"
  >
    <div class="head-to-head-history__head">
      <origam-title
        id="head-to-head-history-title"
        tag="h2"
        font-size="4xl"
        line-height="none"
        class="font-display neon--sm"
        :text="title"
      />
      <p class="head-to-head-history__hint">
        {{ hint }}
      </p>
    </div>
    <section
      v-if="hasRows"
      class="head-to-head-history__scroll"
      :aria-label="caption"
      tabindex="0"
      data-cy="head-to-head-scroll"
    >
      <app-data-table
        :headers="headers"
        :items="rows"
        :caption="caption"
        density="compact"
        :mobile-breakpoint="tableBreakpoint"
        hide-default-footer
        class="head-to-head-history__table"
        data-cy="head-to-head-table"
      >
        <template #item.edition="{ value }">
          <span class="head-to-head-history__edition">{{ value }}</span>
        </template>
        <template #item.score="{ value }">
          <span class="head-to-head-history__score">{{ value }}</span>
        </template>
        <template #item.winner="{ item }">
          <player-link
            :competitor="item.winner"
            :titles="item.winnerTitles"
          />
        </template>
      </app-data-table>
    </section>
    <p
      v-else
      class="head-to-head-history__empty"
      data-cy="head-to-head-history-empty"
    >
      {{ emptyText }}
    </p>
    <p
      class="head-to-head-history__note"
      data-cy="head-to-head-note"
    >
      {{ note }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamTitle } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import PlayerLink from '~/components/common/PlayerLink.vue'
import { useT } from '~/composables/useT'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import { HEAD_TO_HEAD_SCORE_SEPARATOR, HEAD_TO_HEAD_TABLE_BREAKPOINT } from '~/consts/head-to-head.const'
import { HEAD_TO_HEAD_COLUMN } from '~/enums/head-to-head.enum'
import type { IHeadToHeadHistoryProps, IHeadToHeadRow } from '~/interfaces/head-to-head-page.interface'

/*********************************************************
 * Global
 *
 * @description
 * Historique des rencontres de la paire (RG36). Seuls les matchs avec score sont listés : les rencontres sans score
 * connu sont comptées à part, jamais comme des nuls (R-5). Le score s'affiche du vainqueur au perdant.
 ********************************************************/
const { t } = useT()
const tableBreakpoint = HEAD_TO_HEAD_TABLE_BREAKPOINT
const props = withDefaults(defineProps<IHeadToHeadHistoryProps>(), {
  detailA: null,
  detailB: null
})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Tableau
 *
 * @description
 * Une ligne par match. Le vainqueur est un lien vers sa fiche, avec ses étoiles de titres (RG6).
 ********************************************************/
const title = computed(() => t('head_to_head.history.title', 'Rencontres'))
const hint = computed(() => t('head_to_head.history.hint', 'RG36 · {count} ({first}/{second})', {
  count: props.comparison.played,
  first: props.comparison.wins,
  second: props.comparison.losses
}))
const caption = computed(() => t('head_to_head.history.caption', 'Historique des rencontres'))
const headers = computed<IDataTableHeader[]>(() => [
  { key: HEAD_TO_HEAD_COLUMN.EDITION, title: t('head_to_head.history.col_edition', 'Édition'), sortable: false, nowrap: true },
  { key: HEAD_TO_HEAD_COLUMN.ROUND, title: t('head_to_head.history.col_round', 'Tour'), sortable: false, nowrap: true },
  { key: HEAD_TO_HEAD_COLUMN.SCORE, title: t('head_to_head.history.col_score', 'Score'), sortable: false, nowrap: true, align: ALIGN.END },
  { key: HEAD_TO_HEAD_COLUMN.WINNER, title: t('head_to_head.history.col_winner', 'Vainqueur'), sortable: false, nowrap: true }
])
const rows = computed<IHeadToHeadRow[]>(() => props.comparison.matches.map((match) => {
  const firstWon = match.winnerCompetitorId === props.comparison.competitor.id
  const high = Math.max(match.competitorScore, match.opponentScore)
  const low = Math.min(match.competitorScore, match.opponentScore)
  const round = ROUND_LABELS[match.roundKind].match
  return {
    id: match.matchId,
    edition: match.editionCode,
    round: t(round.key, round.label),
    score: `${high} ${HEAD_TO_HEAD_SCORE_SEPARATOR} ${low}`,
    winner: firstWon ? props.comparison.competitor : props.comparison.opponent,
    winnerTitles: (firstWon ? props.detailA : props.detailB)?.stats.titles ?? 0
  }
}))
const hasRows = computed(() => rows.value.length > 0)
const emptyText = computed(() => t('head_to_head.history.empty', 'Aucune rencontre avec un score connu pour cette paire.'))

/*********************************************************
 * Résultats inconnus
 *
 * @description
 * R-5 exige le nombre de matchs sans score DE LA PAIRE, que `IHeadToHead` ne fournit pas (écart de contrat transmis
 * au back). Rien n'est affiché à la place : un compteur par joueur, toutes éditions confondues, serait trompeur ici.
 ********************************************************/
const note = computed(() => t('head_to_head.history.note', 'Les rencontres sans score connu sont comptées à part, jamais comme des nuls.'))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.head-to-head-history {
  padding-top: var(--head-to-head-history---padding-top, var(--origam-space---8));

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: var(--origam-space---4);
    margin-bottom: var(--origam-space---8);
  }

  &__hint {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__table {
    --origam-table__cell---padding-block: var(--origam-space---3);
    --origam-table__cell---padding-inline: var(--origam-space---4);
    --origam-table__header-cell---padding-block: var(--origam-space---3);
    --origam-table__header-cell---padding-inline: var(--origam-space---4);
  }

  &__scroll {
    overflow-x: auto;
  }

  &__edition {
    font-variant-numeric: tabular-nums;
  }

  &__score {
    font-family: var(--origam-font__family---display);
    font-size: var(--origam-font__size---lg);
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__bar---amber);
  }

  &__empty {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__note {
    margin: var(--origam-space---3) 0 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }
}
</style>

<style>
:root {
  --head-to-head-history---padding-top: var(--origam-space---8);
}
</style>
