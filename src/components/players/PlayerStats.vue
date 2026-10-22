<template>
  <section
    class="player-stats"
    aria-labelledby="player-stats-title"
    data-cy="player-stats"
  >
    <origam-title
      id="player-stats-title"
      tag="h2"
      class="sr-only"
      :text="title"
    />
    <ul class="player-stats__grid">
      <li
        v-for="stat in stats"
        :key="stat.id"
        class="player-stats__cell"
        :class="`player-stats__cell--${stat.id}`"
      >
        <origam-card
          class="player-stats__item"
          :class="`player-stats__item--${stat.id}`"
          content-display="flex"
          rounded="xl"
          border
          elevation="md"
        >
          <template #default>
            <p class="player-stats__label">{{ stat.label }}</p>
            <p
              class="player-stats__value font-display"
              :data-cy="`player-stat-${stat.id}`"
            >{{ stat.value }}</p>
          </template>
        </origam-card>
      </li>
    </ul>
    <p
      v-if="hasUnknown"
      class="player-stats__unknown"
      data-cy="player-unknown-results"
    >{{ unknownText }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamCard, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import type { IPlayerStatsProps } from '~/interfaces/players.interface'

/*********************************************************
 * Global
 *
 * @description
 * Statistiques de carrière : joués, victoires, défaites, rien d'autre (FA-12 : aucun ratio sur la fiche).
 * R-5 : seuls les matchs avec score comptent ; les matchs au résultat inconnu sont annoncés à côté.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IPlayerStatsProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Libellés
 *
 * @description
 * Singulier et pluriel ont chacun leur clé.
 ********************************************************/
const title = computed(() => t('player.stats.title', 'Statistiques'))
const playedLabel = computed(() => t('player.stats.played', 'Matchs joués'))
const winsLabel = computed(() => t('player.stats.wins', 'Victoires'))
const lossesLabel = computed(() => t('player.stats.losses', 'Défaites'))
const stats = computed(() => [
  { id: 'played', label: playedLabel.value, value: props.played },
  { id: 'wins', label: winsLabel.value, value: props.wins },
  { id: 'losses', label: lossesLabel.value, value: props.losses }
])
const hasUnknown = computed(() => props.unknownResults > 0)
const unknownText = computed(() => props.unknownResults === 1
  ? t('player.stats.unknown_one', '1 match au résultat inconnu')
  : t('player.stats.unknown_other', '{count} matchs au résultat inconnu', { count: props.unknownResults }))

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.player-stats {
  padding-top: var(--origam-space---8);

  &__grid {
    display: grid;
    grid-template-columns: 1.4fr repeat(2, minmax(0, 1fr));
    gap: var(--origam-space---4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    height: 100%;
    padding: var(--player-stats__item---padding, var(--origam-space---6));

    :deep(.origam-card__content) {
      flex-direction: column-reverse;
      justify-content: flex-end;
      gap: var(--origam-space---2);
      height: 100%;
    }
  }

  &__label {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__value {
    margin: 0;
    font-size: var(--origam-font__size---4xl);
    line-height: 0.9;
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__bar---amber);
  }

  &__item--played &__value {
    font-size: var(--origam-font__size---5xl);
    color: var(--origam-color__text---primary);
  }

  &__unknown {
    margin: var(--origam-space---3) 0 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  @media (max-width: 1100px) {
    &__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__cell--played {
      grid-column: 1 / -1;
    }
  }
}
</style>

<style>
:root {
  --player-stats__item---padding: var(--origam-space---6);
}
</style>
