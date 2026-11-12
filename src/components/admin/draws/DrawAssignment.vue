<template>
  <div
    class="draw-assignment"
    data-cy="draw-assignment"
  >
    <section
      class="draw-assignment__main"
      :aria-labelledby="titleId"
    >
      <header class="draw-assignment__head">
        <h2
          :id="titleId"
          class="draw-assignment__title"
        >
          {{ title }}
        </h2>
        <span
          class="draw-assignment__count"
          data-cy="draw-progress-text"
        >{{ progressText }}</span>
      </header>
      <origam-progress
        :model-value="progress.percent"
        color="primary"
        :bg-color="trackColor"
        :thickness="thickness"
        rounded="full"
        class="draw-assignment__progress"
        :aria-label="progressLabel"
        data-cy="draw-progress"
      />
      <origam-alert
        v-if="saveState === POOL_DRAW_SAVE_STATE.FAILED"
        status="error"
        rounded="lg"
        :text="unsavedText"
        class="draw-assignment__unsaved"
        data-cy="draw-unsaved"
      >
        <template #close>
          <origam-btn
            variant="outlined"
            size="small"
            :text="retryLabel"
            data-cy="draw-retry-save"
            @click="emits('retry')"
          />
        </template>
      </origam-alert>
      <div class="draw-assignment__pools">
        <origam-card
          v-for="pool in poolViews"
          :key="pool.number"
          tag="article"
          rounded="xl"
          border
          elevation="md"
          padding="5"
          class="draw-assignment__pool"
          :data-cy="`draw-pool-${pool.number}`"
        >
          <div class="draw-assignment__pool-content">
            <header class="draw-assignment__pool-head">
              <h3 class="draw-assignment__pool-title">
                {{ pool.title }}
              </h3>
              <origam-chip
                :color="pool.chip.color"
                :bg-color="pool.chip.bgColor"
                size="small"
                pill
                :text="pool.fill"
                :data-cy="pool.current ? `draw-pool-current-${pool.number}` : undefined"
              />
            </header>
            <ol class="draw-assignment__slots">
              <li
                v-for="slot in pool.slots"
                :key="slot.place"
                class="draw-assignment__slot"
                :class="{ 'draw-assignment__slot--seed': slot.isSeed, 'draw-assignment__slot--empty': slot.empty }"
                :data-cy="`draw-slot-${pool.number}-${slot.place}`"
              >
                <span class="draw-assignment__place">{{ slot.place }}</span>
                <template v-if="slot.active">
                  <origam-select
                    :model-value="null"
                    :items="selectItems"
                    :label="slot.label"
                    autocomplete
                    rounded="full"
                    density="compact"
                    hide-details
                    :disabled="readOnly"
                    :data-cy="`draw-select-${pool.number}-${slot.place}`"
                    @update:model-value="handleAssign(pool.number, $event)"
                  />
                </template>
                <span
                  v-else-if="slot.empty"
                  class="draw-assignment__free"
                  :data-cy="`draw-free-${pool.number}-${slot.place}`"
                >{{ freeLabel }}</span>
                <template v-else-if="editing === slot.key">
                  <origam-select
                    :model-value="null"
                    :items="selectItems"
                    :label="slot.changeLabel"
                    autocomplete
                    rounded="full"
                    density="compact"
                    hide-details
                    :data-cy="`draw-select-${pool.number}-${slot.place}`"
                    @update:model-value="handleChange(pool.number, slot.place, $event)"
                  />
                </template>
                <template v-else>
                  <b class="draw-assignment__name">{{ slot.name }}</b>
                  <origam-chip
                    v-if="slot.isSeed"
                    color="secondary"
                    bg-color="secondary"
                    size="small"
                    pill
                    :text="seedLabel"
                  />
                  <origam-btn
                    v-else-if="!readOnly"
                    class="draw-assignment__change"
                    variant="text"
                    size="small"
                    :text="changeLabel"
                    :aria-label="slot.changeLabel"
                    :data-cy="`draw-change-${pool.number}-${slot.place}`"
                    @click="editing = slot.key"
                  />
                </template>
              </li>
            </ol>
          </div>
        </origam-card>
      </div>
    </section>
    <aside class="draw-assignment__side">
      <origam-card
        tag="section"
        rounded="xl"
        border
        elevation="md"
        padding="6"
        class="draw-assignment__side-card"
        :aria-labelledby="`${titleId}-params`"
        data-cy="draw-side-params"
      >
        <h2
          :id="`${titleId}-params`"
          class="draw-assignment__pool-title"
        >
          {{ paramsTitle }}
        </h2>
        <dl class="draw-assignment__params">
          <div>
            <dt>{{ paramsPoolsLabel }}</dt>
            <dd class="font-display">
              {{ poolCount }}
            </dd>
          </div>
          <div>
            <dt>{{ paramsSeedsLabel }}</dt>
            <dd class="font-display">
              {{ poolCount }}
            </dd>
          </div>
        </dl>
        <p class="draw-assignment__muted">
          {{ paramsNote }}
        </p>
      </origam-card>
      <origam-card
        tag="section"
        rounded="xl"
        border
        elevation="md"
        padding="6"
        class="draw-assignment__side-card"
        :aria-labelledby="`${titleId}-rest`"
        data-cy="draw-rest"
      >
        <header class="draw-assignment__card-head">
          <h2
            :id="`${titleId}-rest`"
            class="draw-assignment__pool-title"
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
          class="draw-assignment__rest"
          tabindex="0"
          :aria-label="restLabel"
        >
          <li
            v-for="player in unplaced"
            :key="player.participationId"
            class="draw-assignment__rest-item"
            data-cy="draw-rest-item"
          >
            <player-avatar :display-name="player.competitor.displayName" />
            {{ player.competitor.displayName }}
          </li>
        </ul>
        <p
          v-if="unplaced.length === 0"
          class="draw-assignment__muted"
        >
          {{ restEmpty }}
        </p>
      </origam-card>
      <origam-card
        tag="section"
        rounded="xl"
        border
        elevation="md"
        padding="6"
        class="draw-assignment__side-card"
        :aria-labelledby="`${titleId}-seeds`"
        data-cy="draw-seeds-list"
      >
        <h2
          :id="`${titleId}-seeds`"
          class="draw-assignment__pool-title"
        >
          {{ seedsTitle }}
        </h2>
        <p class="draw-assignment__muted">
          {{ seedsLead }}
        </p>
        <ol class="draw-assignment__seeds">
          <li
            v-for="seed in seedRows"
            :key="seed.participationId"
          >
            <span class="draw-assignment__seed-rank font-display">{{ seed.rank }}</span>
            <span>{{ seed.competitor.displayName }}</span>
            <span class="draw-assignment__seed-acp">{{ seed.acp.toFixed(2) }}</span>
          </li>
        </ol>
      </origam-card>
    </aside>
    <div class="draw-assignment__next">
      <origam-btn
        variant="flat"
        bg-color="primary"
        elevation="lg"
        size="large"
        :disabled="!complete || saveState === POOL_DRAW_SAVE_STATE.FAILED || saveState === POOL_DRAW_SAVE_STATE.SAVING"
        :text="nextLabel"
        data-cy="draw-entry-next"
        @click="emits('next')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard, OrigamChip, OrigamProgress, OrigamSelect } from 'origam/components'
import PlayerAvatar from '~/components/players/PlayerAvatar.vue'
import { useT } from '~/composables/useT'
import { HOME_PROGRESS_THICKNESS, HOME_PROGRESS_TRACK_COLOR } from '~/consts/home.const'
import { EDITION_CHIP_PROPS } from '~/consts/edition-view.const'
import { POOL_DRAW_CHIP_CURRENT } from '~/consts/pool-draw.const'
import { EDITION_CHIP_FAMILY } from '~/enums/edition-tab.enum'
import { POOL_DRAW_SAVE_STATE } from '~/enums/pool-draw.enum'
import type { IDrawAssignmentProps, IPoolDrawPool } from '~/interfaces/pool-draw.interface'
import { currentPoolNumber, poolSlots } from '~/utils/pool-draw.util'

/*********************************************************
 * Global
 *
 * @description
 * Étape 3 : saisie du tirage physique, poule après poule (RG11). La tête de série est la première de chaque poule (RG9). Chaque place
 * vide propose les joueurs non placés (un joueur placé disparaît des autres listes) ; « Changer » remplace un joueur par un autre.
 * Un joueur choisi arrive à la première place libre de sa poule : la place est le rang d'arrivée (le serveur ne connaît que la poule et
 * l'ordre du tirage). Chaque affectation est enregistrée aussitôt dans le brouillon ; un échec est signalé et se renvoie.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawAssignmentProps>(), {})
const emits = defineEmits<{
  (event: 'assign', poolNumber: number, participationId: string): void
  (event: 'change', poolNumber: number, place: number, participationId: string): void
  (event: 'retry'): void
  (event: 'next'): void
}>()
defineSlots<{}>()
const titleId = useId()
const thickness = HOME_PROGRESS_THICKNESS
const trackColor = HOME_PROGRESS_TRACK_COLOR
const editing = ref<string | null>(null)
const title = computed(() => t('admin.draws.entry_title', '3 · Saisie du tirage'))
const progressText = computed(() => t('admin.draws.progress', '{placed} / {total} joueurs placés', { placed: props.progress.placed, total: props.progress.total }))
const progressLabel = computed(() => t('admin.draws.progress_label', '{placed} joueurs placés sur {total}', { placed: props.progress.placed, total: props.progress.total }))
const unsavedText = computed(() => t('admin.draws.unsaved', 'La dernière affectation n’est pas enregistrée : le brouillon du serveur n’est pas à jour.'))
const retryLabel = computed(() => t('admin.draws.retry_save', 'Réessayer'))
const seedLabel = computed(() => t('admin.draws.seed_chip', 'Tête de série'))
const changeLabel = computed(() => t('admin.draws.change', 'Changer'))
const freeLabel = computed(() => t('admin.draws.slot_free', 'Libre'))
const paramsTitle = computed(() => t('admin.draws.side_params_title', 'Paramètres'))
const paramsPoolsLabel = computed(() => t('admin.draws.parameters_pools', 'Poules'))
const paramsSeedsLabel = computed(() => t('admin.draws.parameters_seeds', 'Têtes de série'))
const paramsNote = computed(() => t('admin.draws.side_params_note', 'Autant de têtes de série que de poules (RG9). Les joueurs des plus petites poules boivent une bière avant les matchs (RG17).'))
const restTitle = computed(() => t('admin.draws.rest_title', 'À placer'))
const restLabel = computed(() => t('admin.draws.rest_label', 'Joueurs à placer'))
const restEmpty = computed(() => t('admin.draws.rest_empty', 'Tous les joueurs sont placés.'))
const seedsTitle = computed(() => t('admin.draws.seeds_side_title', 'Têtes de série'))
const seedsLead = computed(() => t('admin.draws.seeds_side_lead', 'Les {count} meilleurs du classement ACP sur les 5 dernières éditions clôturées (A8).', { count: props.poolCount }))
const nextLabel = computed(() => t('admin.draws.entry_next', 'Voir le récapitulatif'))
const names = computed(() => new Map(props.players.map(player => [player.participationId, player.competitor.displayName])))
const selectItems = computed(() => props.unplaced.map(player => ({ title: player.competitor.displayName, value: player.participationId })))
const currentPool = computed(() => currentPoolNumber(props.pools))
const poolFill = (pool: IPoolDrawPool): string => {
  const params = { placed: pool.members.length, size: pool.size }
  if (pool.members.length >= pool.size) {
    return t('admin.draws.pool_fill', '{placed}/{size}', params)
  }
  return pool.number === currentPool.value
    ? t('admin.draws.pool_current', 'En cours · {placed}/{size}', params)
    : t('admin.draws.pool_next', 'À suivre · {placed}/{size}', params)
}
// Recette des chips (mapping.md) : pleine = en cours, teintée success = poule pleine, neutre = à suivre (défaut du thème).
const poolChip = (pool: IPoolDrawPool): { color?: string, bgColor?: string } => {
  if (pool.members.length >= pool.size) {
    return EDITION_CHIP_PROPS[EDITION_CHIP_FAMILY.TINTED_SUCCESS]
  }
  return pool.number === currentPool.value ? POOL_DRAW_CHIP_CURRENT : EDITION_CHIP_PROPS[EDITION_CHIP_FAMILY.NEUTRAL]
}
const poolViews = computed(() => props.pools.map(pool => ({
  number: pool.number,
  current: pool.number === currentPool.value,
  chip: poolChip(pool),
  title: t('admin.draws.pool_title', 'Poule {number}', { number: pool.number }),
  fill: poolFill(pool),
  full: pool.members.length >= pool.size,
  slots: poolSlots(pool).map(slot => ({
    place: slot.place,
    key: `${pool.number}-${slot.place}`,
    empty: slot.member === null,
    // Un seul choix actif : la première place libre de la poule en cours (RG11), les autres places libres restent passives.
    active: slot.member === null && pool.number === currentPool.value && slot.place === pool.members.length + 1,
    isSeed: slot.member?.isSeed ?? false,
    name: slot.member ? (names.value.get(slot.member.participationId) ?? '') : '',
    label: t('admin.draws.slot_label', 'Poule {pool} : joueur tiré', { pool: pool.number }),
    changeLabel: t('admin.draws.change_label', 'Changer {name}, poule {pool}', { name: slot.member ? (names.value.get(slot.member.participationId) ?? '') : '', pool: pool.number })
  }))
})))
const handleAssign = (poolNumber: number, value: string | null) => {
  if (value) {
    emits('assign', poolNumber, value)
  }
}
const handleChange = (poolNumber: number, place: number, value: string | null) => {
  editing.value = null
  if (value) {
    emits('change', poolNumber, place, value)
  }
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
.draw-assignment {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20rem;
  gap: var(--origam-space---5);
  align-items: start;

  > * {
    min-width: 0;
  }

  &__main {
    display: grid;
    gap: 0;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
    margin-bottom: var(--origam-space---4);
  }

  &__progress {
    --origam-progress-linear__background---opacity: 1;
    margin-bottom: var(--origam-space---5);
  }

  &__unsaved {
    margin-bottom: var(--origam-space---4);
  }

  &__change {
    --origam-btn---height: var(--origam-space---11);
    --origam-btn---padding-sm: var(--origam-space---4);
    --origam-btn---font-size: var(--origam-font__size---sm);
  }

  &__pool-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---2);
  }

  &__title,
  &__pool-title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__count,
  &__seed-acp {
    color: var(--origam-color__text---secondary);
    font-variant-numeric: tabular-nums;
  }

  &__params {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--origam-space---2);
    margin: var(--origam-space---3) 0;

    div {
      padding: var(--origam-space---3);
      border-radius: var(--origam-radius---lg);
      background: var(--origam-color__surface---sunken);
    }

    dt {
      font-size: var(--origam-font__size---xs);
      font-weight: var(--origam-font__weight---bold);
      letter-spacing: var(--origam-font__letterSpacing---wide);
      text-transform: uppercase;
      color: var(--origam-color__text---tertiary);
    }

    dd {
      margin: 0;
      font-size: var(--origam-font__size---2xl);
      line-height: var(--origam-font__lineHeight---normal);
      color: var(--origam-color__bar---amber);
      font-variant-numeric: tabular-nums;
    }
  }

  &__muted {
    margin: 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  &__pools {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--origam-space---3);
  }

  &__pool-content {
    display: grid;
    gap: var(--origam-space---3);
  }

  &__slots {
    display: grid;
    gap: var(--origam-space---1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__slot {
    display: grid;
    grid-template-columns: var(--origam-space---8) minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---2);
    min-height: var(--origam-space---11);
    padding-inline: var(--origam-space---3);
    border-radius: var(--origam-radius---md);
    background: var(--origam-color__surface---sunken);
    font-size: var(--origam-font__size---sm);

    &--seed {
      background: var(--origam-color__action--secondary---bgSubtle);
    }

    &--empty {
      color: var(--origam-color__text---tertiary);
      grid-template-columns: var(--origam-space---8) minmax(0, 1fr);
      padding: var(--origam-space---1) var(--origam-space---1) var(--origam-space---1) var(--origam-space---3);
      background: none;
      border: var(--origam-border__width---thin) dashed var(--origam-color__border---strong);
    }
  }

  &__place {
    color: var(--origam-color__text---tertiary);
    font-weight: var(--origam-font__weight---bold);
    font-variant-numeric: tabular-nums;
  }

  &__side {
    display: grid;
    gap: var(--origam-space---4);
  }

  &__card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---3);
    margin-bottom: var(--origam-space---4);
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

  &__seeds {
    display: grid;
    gap: var(--origam-space---1);
    margin: var(--origam-space---3) 0 0;
    padding: 0;
    list-style: none;
  }

  &__seeds li {
    display: grid;
    grid-template-columns: var(--origam-space---8) minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---2);
    padding: var(--origam-space---2) var(--origam-space---3);
    border-radius: var(--origam-radius---md);
    background: var(--origam-color__surface---sunken);
    font-size: var(--origam-font__size---sm);
  }

  &__seed-rank {
    color: var(--origam-color__action--secondary---fgSubtle);
    font-size: var(--origam-font__size---lg);
  }

  &__next {
    display: flex;
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (max-width: 1200px) {
  .draw-assignment {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .draw-assignment__side-card {
    padding: var(--origam-space---5);
  }

  .draw-assignment__pools {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
