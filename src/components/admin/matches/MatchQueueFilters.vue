<template>
  <div class="match-queue-filters">
    <origam-chip-group
      :model-value="filter"
      mandatory
      filter
      :aria-label="filtersLabel"
      class="match-queue-filters__chips"
      data-cy="admin-matches-filters"
      @update:model-value="handleFilter"
    >
      <origam-chip
        v-for="entry in views"
        :key="entry.value"
        :value="entry.value"
        size="large"
        border
        border-color="var(--origam-color__border---default)"
        pill
        filter-icon=""
        :color="entry.color"
        :bg-color="entry.bgColor"
        :data-cy="entry.dataCy"
      >
        <template #filter />
        <template #default>
          <span class="match-queue-filters__label">
            {{ entry.label }}
            <span
              class="match-queue-filters__count"
              :class="{ 'match-queue-filters__count--selected': entry.selected }"
            >{{ entry.count }}</span>
          </span>
        </template>
      </origam-chip>
    </origam-chip-group>
    <origam-select
      :model-value="poolValue"
      :items="poolItems"
      :label="poolLabel"
      rounded="full"
      hide-details
      class="match-queue-filters__pool"
      data-cy="admin-matches-pool"
      @update:model-value="handlePool"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamChip, OrigamChipGroup, OrigamSelect } from 'origam/components'
import { useT } from '~/composables/useT'
import { ADMIN_MATCH_ALL_POOLS_VALUE } from '~/consts/admin-match-filters.const'
import type { ADMIN_MATCH_FILTER } from '~/enums/admin-match-filter.enum'
import type { IMatchQueueFiltersEmits, IMatchQueueFiltersProps } from '~/interfaces/admin-match-queue.interface'

/*********************************************************
 * Global
 *
 * @description
 * Les quatre filtres de la file (À traiter, Saisis, Sans score, Validés ; A1) et le sélecteur de poule. Un seul filtre est
 * toujours actif (`mandatory`). Le parent porte l'état dans l'URL ; ce composant ne fait qu'afficher et émettre.
 * Retour à la ligne des chips : même recette que `EditionMatches` (`origam-chip-group` défile sur une ligne, Elyseranet/origam#1284).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IMatchQueueFiltersProps>(), {})
const emits = defineEmits<IMatchQueueFiltersEmits>()
defineSlots<{}>()

/*********************************************************
 * Filtres
 *
 * @description
 * Le chip actif prend la couleur secondaire ; le compteur porte aussi le sens (jamais la couleur seule).
 ********************************************************/
const filtersLabel = computed(() => t('admin.matches.filters_label', 'Filtrer les matchs'))
const views = computed(() => props.filters.map(entry => {
  const selected = entry.value === props.filter
  return {
    ...entry,
    selected,
    color: selected ? 'secondary' : 'var(--origam-color__text---secondary)',
    bgColor: selected ? 'secondary' : 'transparent',
    dataCy: `admin-matches-filter-${entry.value}`
  }
}))
const handleFilter = (value: ADMIN_MATCH_FILTER) => {
  emits('update:filter', value)
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

  &__chips {
    --origam-chip---height-lg: calc(var(--origam-space---11) - 2 * var(--origam-border__width---thin));
    --origam-chip---padding-lg: var(--origam-space---4);
    --origam-chip---font-size-lg: var(--origam-font__size---md);

    overflow: visible;
  }

  &__chips :deep(.origam-slide-group__container),
  &__chips :deep(.origam-slide-group__content) {
    flex-wrap: wrap;
    overflow: visible;
  }

  &__chips :deep(.origam-slide-group__content) {
    flex: 1 1 auto;
    min-width: 0;
    gap: var(--origam-space---2);
  }

  &__pool {
    max-width: var(--match-queue-filters__pool---max-width, 16rem);
  }

  &__label {
    display: inline-flex;
    align-items: center;
    gap: var(--origam-space---2);
  }

  &__count {
    padding-inline: var(--origam-space---2);
    border-radius: var(--origam-radius---full);
    background: var(--origam-color__surface---overlay);
    font-size: var(--origam-font__size---xs);
    line-height: var(--origam-font__lineHeight---normal);
    font-variant-numeric: tabular-nums;

    &--selected {
      background: var(--origam-color__surface---default);
      color: var(--origam-color__text---primary);
    }
  }
}
</style>

<style>
:root {
  --match-queue-filters---gap: var(--origam-space---4);
  --match-queue-filters---margin-bottom: var(--origam-space---5);
  --match-queue-filters__pool---max-width: 16rem;
}
</style>
