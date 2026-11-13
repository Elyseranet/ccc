<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    padding="6"
    :aria-labelledby="titleId"
    class="draw-recap"
    data-cy="draw-recap"
  >
    <div class="draw-recap__content">
      <header class="draw-recap__head">
        <h2
          :id="titleId"
          class="draw-recap__title"
        >
          {{ title }}
        </h2>
        <span
          class="draw-recap__count"
          data-cy="draw-recap-summary"
        >{{ summary }}</span>
      </header>
      <div class="draw-recap__pools">
        <section
          v-for="pool in poolViews"
          :key="pool.number"
          class="draw-recap__pool"
          :aria-label="pool.title"
          :data-cy="`draw-recap-pool-${pool.number}`"
        >
          <h3 class="draw-recap__pool-title">
            {{ pool.title }}
          </h3>
          <ol class="draw-recap__members">
            <li
              v-for="member in pool.members"
              :key="member.id"
            >
              <span class="draw-recap__place">{{ member.place }}</span>
              <span>{{ member.name }}</span>
              <origam-chip
                v-if="member.isSeed"
                color="secondary"
                bg-color="secondary"
                size="small"
                pill
                :text="seedLabel"
              />
            </li>
          </ol>
        </section>
      </div>
      <div
        v-if="!readOnly"
        class="draw-recap__actions"
      >
        <origam-btn
          variant="outlined"
          size="large"
          :text="backLabel"
          data-cy="draw-recap-back"
          @click="emits('back')"
        />
        <origam-btn
          variant="flat"
          :bg-color="buttonColor"
          :elevation="buttonElevation"
          size="large"
          :disabled="isBlocked"
          :text="nextLabel"
          data-cy="draw-recap-next"
          @click="emits('next')"
        />
      </div>
    </div>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamBtn, OrigamCard, OrigamChip } from 'origam/components'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import type { IDrawRecapProps } from '~/interfaces/pool-draw.interface'
import { poolSlots } from '~/utils/pool-draw.util'

/*********************************************************
 * Global
 *
 * @description
 * Étape 4 : récapitulatif des poules avant la validation, ou lecture seule d'un tirage validé. Une poule par bloc, les joueurs dans
 * l'ordre d'arrivée, la tête de série en premier.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawRecapProps>(), {})
const emits = defineEmits<{ (event: 'back'): void, (event: 'next'): void }>()
defineSlots<{}>()
const titleId = useId()
const title = computed(() => t('admin.draws.recap_title', '4 · Récapitulatif'))
const summary = computed(() => t('admin.draws.recap_summary', '{total} joueurs, {pools} poules, {matches} matchs de poule', { total: props.total, pools: props.pools.length, matches: props.matchCount }))
const seedLabel = computed(() => t('admin.draws.seed_chip', 'Tête de série'))
const backLabel = computed(() => t('admin.draws.recap_back', 'Modifier la saisie'))
const nextLabel = computed(() => t('admin.draws.recap_next', 'Passer à la validation'))
const names = computed(() => new Map(props.players.map(player => [player.participationId, player.competitor.displayName])))
const poolViews = computed(() => props.pools.map(pool => ({
  number: pool.number,
  title: t('admin.draws.pool_title', 'Poule {number}', { number: pool.number }),
  members: poolSlots(pool).flatMap(slot => (slot.member
    ? [{ id: slot.member.participationId, place: slot.place, name: names.value.get(slot.member.participationId) ?? '', isSeed: slot.member.isSeed }]
    : []))
})))

const isBlocked = computed(() => !props.canValidate)
const { buttonColor, buttonElevation } = usePrimaryActionButton(isBlocked)

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.draw-recap {
  &__content {
    display: grid;
    gap: var(--origam-space---4);
  }

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---2);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__count {
    color: var(--origam-color__text---secondary);
    font-variant-numeric: tabular-nums;
  }

  &__pools {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: var(--origam-space---3);
  }

  &__pool {
    display: grid;
    gap: var(--origam-space---2);
    padding: var(--origam-space---4);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__surface---sunken);
  }

  &__pool-title {
    margin: 0;
    font-size: var(--origam-font__size---md);
    font-weight: var(--origam-font__weight---bold);
  }

  &__members {
    display: grid;
    gap: var(--origam-space---1);
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--origam-space---1) var(--origam-space---2);
    }
  }

  &__place {
    min-width: var(--origam-space---5);
    color: var(--origam-color__text---tertiary);
    font-variant-numeric: tabular-nums;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--origam-space---3);
  }
}
</style>
