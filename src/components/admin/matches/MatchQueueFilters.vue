<template>
  <div class="match-queue-filters">
    <filter-chips
      :model-value="filter"
      :items="views"
      :label="filtersLabel"
      data-cy="admin-matches-filters"
      @update:model-value="handleFilter"
    />
    <div class="match-queue-filters__selects">
      <div class="match-queue-filters__field">
        <origam-label
          :for="roundId"
          class="match-queue-filters__field-label"
          :text="roundLabel"
        />
        <origam-select
          :id="roundId"
          :model-value="round"
          :items="roundItems"
          :label="roundLabel"
          single-line
          rounded="full"
          hide-details
          :menu-icon="CaretDown"
          class="match-queue-filters__select"
          data-cy="admin-matches-round"
          @update:model-value="handleRound"
        />
      </div>
      <div
        v-if="hasPoolFilter"
        class="match-queue-filters__field"
      >
        <origam-label
          :for="poolId"
          class="match-queue-filters__field-label"
          :text="poolLabel"
        />
        <origam-select
          :id="poolId"
          :model-value="poolValue"
          :items="poolItems"
          :label="poolLabel"
          single-line
          rounded="full"
          hide-details
          :menu-icon="CaretDown"
          class="match-queue-filters__select"
          data-cy="admin-matches-pool"
          @update:model-value="handlePool"
        />
      </div>
      <div class="match-queue-filters__field match-queue-filters__field--switch">
        <origam-label
          :for="tiebreakId"
          class="match-queue-filters__field-label"
          :text="tiebreakLabel"
        />
        <origam-switch
          :id="tiebreakId"
          :model-value="tiebreakOnly"
          :disabled="!canTiebreakFilter"
          :hint="tiebreakHint"
          :persistent-hint="!canTiebreakFilter"
          hide-details
          class="match-queue-filters__switch"
          data-cy="admin-matches-tiebreak-only"
          @update:model-value="handleTiebreak"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamLabel, OrigamSelect, OrigamSwitch } from 'origam/components'
import FilterChips from '~/components/common/FilterChips.vue'
import CaretDown from '~/components/icons/CaretDown.vue'
import { useT } from '~/composables/useT'
import { ADMIN_MATCH_ALL_POOLS_VALUE, ADMIN_MATCH_ALL_ROUNDS_VALUE } from '~/consts/admin-match-filters.const'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import type { TAdminMatchRound } from '~/types/admin-match-round.type'
import type { IMatchQueueFiltersEmits, IMatchQueueFiltersProps } from '~/interfaces/admin-match-queue.interface'

/*********************************************************
 * Global
 *
 * @description
 * Les quatre filtres de la file (À traiter, Saisis, Sans score, Validés ; A1) et le sélecteur de poule. Un seul filtre est
 * toujours actif (`mandatory`). Le parent porte l'état dans l'URL ; ce composant ne fait qu'afficher et émettre.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IMatchQueueFiltersProps>(), {})
const emits = defineEmits<IMatchQueueFiltersEmits>()
defineSlots<{}>()
const roundId = useId()
const poolId = useId()
const tiebreakId = useId()

/*********************************************************
 * Filtres
 *
 * @description
 * Les puces sont le composant commun `FilterChips` (F-20) ; ce composant lui donne ses libellés, compteurs et `data-cy`, et le libellé qui dit la portée des compteurs.
 ********************************************************/
const filtersLabel = computed(() => {
  const round = props.round === ADMIN_MATCH_ALL_ROUNDS_VALUE
    ? t('admin.matches.round_all', 'Tous les tours')
    : t(ROUND_LABELS[props.round].key, ROUND_LABELS[props.round].label)
  const scope = props.hasPoolFilter && props.pool !== null
    ? t('admin.matches.scope_pool', '{round}, poule {rank}', { round, rank: props.pool })
    : round
  return t('admin.matches.filters_label', 'Filtrer les matchs · compteurs pour : {scope}', { scope })
})
const views = computed(() => props.filters.map(entry => ({ ...entry, dataCy: `admin-matches-filter-${entry.value}` })))
const handleFilter = (value: string) => {
  const entry = props.filters.find(candidate => candidate.value === value)
  if (entry) {
    emits('update:filter', entry.value)
  }
}

/*********************************************************
 * Tour
 *
 * @description
 * « Tous les tours », puis les seuls tours qui existent dans l'édition, dans l'ordre de `ROUND_KIND`, avec les libellés de
 * `ROUND_LABELS` (pas de seconde table). Le tour par défaut (le tour en cours) est choisi par le parent.
 ********************************************************/
const roundLabel = computed(() => t('admin.matches.round_label', 'Tour'))
const roundItems = computed(() => [
  { title: t('admin.matches.round_all', 'Tous les tours'), value: ADMIN_MATCH_ALL_ROUNDS_VALUE },
  ...props.rounds.map(kind => ({ title: t(ROUND_LABELS[kind].key, ROUND_LABELS[kind].label), value: kind }))
])
const handleRound = (value: TAdminMatchRound) => {
  emits('update:round', value)
}

/*********************************************************
 * Départages seulement
 *
 * @description
 * Interrupteur indépendant du tour et de la poule (ET), désactivé hors « Tous les tours » et « Poules » avec sa raison (un départage
 * est un match de poule). Un départage entre poules n'apparaît que sous « Toutes les poules ».
 ********************************************************/
const tiebreakLabel = computed(() => t('admin.matches.tiebreak_only_label', 'Départages seulement'))
const tiebreakHint = computed(() => props.canTiebreakFilter ? undefined : t('admin.matches.tiebreak_only_disabled', 'Aucun départage hors des poules'))
const handleTiebreak = (value: boolean | null) => {
  emits('update:tiebreakOnly', value === true)
}

/*********************************************************
 * Poule
 *
 * @description
 * « Toutes les poules » est une valeur de texte (`all`) : Origam ne distingue pas `null` d'une absence de sélection.
 ********************************************************/
const poolLabel = computed(() => t('admin.matches.pool_label', 'Poule'))
const poolItems = computed(() => [
  { title: t('admin.matches.pool_all', 'Toutes les poules'), value: ADMIN_MATCH_ALL_POOLS_VALUE },
  ...props.pools.map(rank => ({ title: t('admin.matches.pool_n', 'Poule {rank}', { rank }), value: String(rank) }))
])
const poolValue = computed(() => props.pool === null ? ADMIN_MATCH_ALL_POOLS_VALUE : String(props.pool))
const handlePool = (value: string | null) => {
  emits('update:pool', value === null || value === ADMIN_MATCH_ALL_POOLS_VALUE ? null : Number(value))
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
.match-queue-filters {
  display: grid;
  gap: var(--match-queue-filters---gap, var(--origam-space---4));
  margin-bottom: var(--match-queue-filters---margin-bottom, var(--origam-space---5));

  &__selects {
    display: flex;
    flex-wrap: wrap;
    gap: var(--match-queue-filters__selects---gap, var(--origam-space---3));
  }

  &__field {
    display: grid;
    gap: var(--match-queue-filters__field---gap, var(--origam-space---1));
    flex: 1 1 var(--match-queue-filters__field---basis, 12rem);
    max-width: var(--match-queue-filters__field---max-width, 16rem);
    min-width: 0;
  }

  &__field--switch {
    flex: 0 0 auto;
  }

  &__field-label {
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    line-height: var(--origam-font__lineHeight---normal);
    text-transform: uppercase;
  }

  &__select {
    grid-template-rows: 1fr 0;
    min-width: 0;

    :deep(.origam-input__control) {
      height: 100%;
    }

    :deep(.origam-field__field) {
      align-items: stretch;
    }
  }

  &__switch {
    margin-inline-start: var(--match-queue-filters__switch---margin-start, var(--origam-space---1));
  }
}
</style>

<style>
:root {
  --match-queue-filters---gap: var(--origam-space---4);
  --match-queue-filters---margin-bottom: var(--origam-space---5);
  --match-queue-filters__selects---gap: var(--origam-space---3);
  --match-queue-filters__field---basis: 12rem;
  --match-queue-filters__field---max-width: 16rem;
  --match-queue-filters__field---gap: var(--origam-space---1);
  --match-queue-filters__switch---margin-start: var(--origam-space---1);
}
</style>
