<template>
  <aside
    class="round-draw-side"
    data-cy="round-draw-side"
  >
    <origam-card
      tag="section"
      rounded="xl"
      border
      elevation="md"
      :aria-labelledby="poolTitleId"
      class="round-draw-side__card"
      data-cy="round-draw-pool"
    >
      <template #default>
        <h2
          :id="poolTitleId"
          class="round-draw-side__title"
        >
          {{ poolTitle }}
        </h2>
        <p
          role="status"
          class="round-draw-side__status"
        >
          {{ poolCount }}, {{ pairingsToDraw }}
        </p>
        <app-data-table
          :headers="headers"
          :items="rows"
          :caption="caption"
          hide-default-footer
          class="round-draw-side__table"
        />
      </template>
    </origam-card>
    <origam-card
      tag="section"
      rounded="xl"
      border
      elevation="md"
      :aria-labelledby="restTitleId"
      class="round-draw-side__card"
      data-cy="round-draw-rest"
    >
      <template #default>
        <header class="round-draw-side__head">
          <h2
            :id="restTitleId"
            class="round-draw-side__title"
          >
            {{ restTitle }}
          </h2>
          <origam-chip
            color="secondary"
            bg-color="secondary"
            size="small"
            pill
            :text="String(unplaced.length)"
          />
        </header>
        <ul
          class="round-draw-side__rest"
          tabindex="0"
          :aria-label="restLabel"
        >
          <li
            v-for="player in unplaced"
            :key="player.participationId"
            class="round-draw-side__rest-item"
            data-cy="round-draw-rest-item"
          >
            <player-avatar :display-name="player.competitor.displayName" />
            {{ player.competitor.displayName }}
          </li>
        </ul>
        <p
          v-if="unplaced.length === 0"
          class="round-draw-side__muted"
        >
          {{ restEmpty }}
        </p>
      </template>
    </origam-card>
  </aside>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { ALIGN } from 'origam/enums'
import type { IDataTableHeader } from 'origam/interfaces'
import { OrigamCard, OrigamChip } from 'origam/components'
import AppDataTable from '~/components/common/AppDataTable.vue'
import PlayerAvatar from '~/components/players/PlayerAvatar.vue'
import { useT } from '~/composables/useT'
import { ROUND_DRAW_TEXTS } from '~/consts/round-draw.const'
import { ROUND_DRAW_POOL_COLUMN } from '~/enums/round-draw.enum'
import { ROUND_KIND } from '~/enums/round.enum'
import type { IRoundDrawSideProps } from '~/interfaces/round-draw.interface'
import { pairingTotal } from '~/utils/round-draw.util'

/*********************************************************
 * Global
 *
 * @description
 * Colonne latérale : la composition du vivier (origine et nombre : premiers de poule en direct, vainqueurs des barrages ; sans barrages le vivier est la liste des qualifiés) et les
 * joueurs « À placer », qui disparaissent de la liste dès qu'ils sont placés. Pour les barrages, les premiers de poule attendent sans jouer (RG14) : leur ligne le dit, la phrase
 * d'attente est dans l'en-tête de saisie.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IRoundDrawSideProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const poolTitleId = useId()
const restTitleId = useId()
const bare = computed(() => t(ROUND_DRAW_TEXTS[props.roundKind].bare.key, ROUND_DRAW_TEXTS[props.roundKind].bare.fallback))
const poolTitle = computed(() => t('admin.round_draw.pool_title', 'Vivier · {round}', { round: bare.value }))
const poolCount = computed(() => t('admin.round_draw.pool_count', '{count} joueurs', { count: props.playerCount }))
const pairingsToDraw = computed(() => t('admin.round_draw.pool_pairings', '{count} affiches à tirer.', { count: pairingTotal(props.playerCount - (props.roundKind === ROUND_KIND.PLAYOFF ? props.leaderCount : 0)) }))
const caption = computed(() => t('admin.round_draw.pool_caption', 'Composition du vivier'))
const restTitle = computed(() => t('admin.round_draw.rest_title', 'À placer'))
const restLabel = computed(() => t('admin.round_draw.rest_label', 'Joueurs à placer'))
const restEmpty = computed(() => t('admin.round_draw.rest_empty', 'Tous les joueurs sont placés.'))
const headers = computed<IDataTableHeader[]>(() => [
  { key: ROUND_DRAW_POOL_COLUMN.ORIGIN, title: t('admin.round_draw.pool_col_origin', 'Origine'), sortable: false },
  { key: ROUND_DRAW_POOL_COLUMN.COUNT, title: t('admin.round_draw.pool_col_count', 'Joueurs'), sortable: false, align: ALIGN.END }
])
const rows = computed(() => {
  const others = props.playerCount - props.leaderCount
  if (props.roundKind === ROUND_KIND.PLAYOFF) {
    return [
      { origin: t('admin.round_draw.origin_leaders_wait', 'Premiers de poule (en attente)'), count: props.leaderCount },
      { origin: t('admin.round_draw.origin_drawable', 'Joueurs à tirer'), count: others }
    ]
  }
  return props.leaderCount > 0 && props.leaderCount < props.playerCount && props.hasPlayoff
    ? [
      { origin: t('admin.round_draw.origin_leaders', 'Premiers de poule (direct)'), count: props.leaderCount },
      { origin: t('admin.round_draw.origin_playoff_winners', 'Vainqueurs des barrages'), count: others }
    ]
    : [{ origin: t('admin.round_draw.origin_qualified', 'Qualifiés'), count: props.playerCount }]
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
.round-draw-side {
  display: grid;
  gap: var(--round-draw-side---gap, var(--origam-space---4));
  align-content: start;

  &__card {
    padding: var(--round-draw-side__card---padding, var(--origam-space---6));

    @media (max-width: 760px) {
      padding: var(--origam-space---5);
    }
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
    margin-bottom: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__status {
    margin: 0 0 var(--origam-space---3);
  }

  &__muted {
    margin: var(--origam-space---3) 0 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }

  &__table :deep(th),
  &__table :deep(td) {
    white-space: normal;
  }

  &__rest {
    display: grid;
    gap: var(--origam-space---1);
    max-height: 16rem;
    margin: 0;
    padding: 0;
    overflow: auto;
    list-style: none;
  }

  &__rest-item {
    display: flex;
    align-items: center;
    gap: var(--origam-space---3);
    padding: var(--origam-space---1) 0;
    font-size: var(--origam-font__size---sm);
    font-weight: var(--origam-font__weight---semibold);
  }
}
</style>

<style>
:root {
  --round-draw-side---gap: var(--origam-space---4);
  --round-draw-side__card---padding: var(--origam-space---6);
}
</style>
