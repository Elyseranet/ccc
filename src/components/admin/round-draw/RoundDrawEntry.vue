<template>
  <section
    class="round-draw-entry"
    :aria-labelledby="titleId"
    data-cy="round-draw-entry"
  >
    <header class="round-draw-entry__head">
      <h2
        :id="titleId"
        class="round-draw-entry__title"
      >
        {{ title }}
      </h2>
      <span
        class="round-draw-entry__count"
        data-cy="round-draw-count"
      >{{ countText }}</span>
    </header>
    <p
      v-if="changeable"
      class="round-draw-entry__round"
      data-cy="round-draw-round"
    >
      {{ roundPrefix }} <b>{{ roundLabel }}</b> · {{ roundDetail }}
      <origam-btn
        v-if="!readOnly"
        variant="text"
        size="small"
        aria-haspopup="dialog"
        :text="changeRoundLabel"
        data-cy="round-draw-change-round"
        @click="handleChangeRound"
      />
    </p>
    <p
      v-else
      class="round-draw-entry__round"
      role="status"
      data-cy="round-draw-round"
    >
      {{ roundToDrawPrefix }} <b>{{ roundLabel }}</b>, {{ roundToDrawDetail }}
    </p>
    <p
      v-if="waitText"
      class="round-draw-entry__muted"
      data-cy="round-draw-playoff-wait"
    >
      {{ waitText }}
    </p>
    <origam-progress
      :model-value="progress.percent"
      color="primary"
      :bg-color="trackColor"
      :thickness="thickness"
      rounded="full"
      class="round-draw-entry__progress"
      :aria-label="progressLabel"
      data-cy="round-draw-progress"
    />
    <ol class="round-draw-entry__list">
      <li
        v-for="item in items"
        :key="item.index"
        class="round-draw-entry__item"
        :class="item.itemClass"
        :data-cy="item.dataCy"
      >
        <template v-if="item.state === pairingState.FULL">
          <origam-card
            rounded="xl"
            border
            elevation="md"
            padding="0"
            class="round-draw-entry__card"
          >
            <template #default>
              <p class="round-draw-entry__eyebrow">
                {{ item.eyebrow }}
              </p>
              <div class="round-draw-entry__row">
                <b>{{ item.firstName }}</b>
                <span class="round-draw-entry__vs">{{ versus }}</span>
                <b>{{ item.secondName }}</b>
              </div>
              <origam-btn
                v-if="!readOnly"
                variant="text"
                size="small"
                class="round-draw-entry__change"
                :text="changeLabel"
                :aria-label="item.changeAriaLabel"
                :data-cy="item.changeDataCy"
                @click="handleChange(item.index)"
              />
            </template>
          </origam-card>
        </template>
        <template v-else-if="item.state === pairingState.CURRENT">
          <origam-card
            rounded="xl"
            border
            border-color="var(--origam-color__action--secondary---bg)"
            elevation="md"
            padding="0"
            class="round-draw-entry__card round-draw-entry__card--next"
          >
            <template #default>
              <p class="round-draw-entry__eyebrow">
                {{ item.eyebrow }}
              </p>
              <div class="round-draw-entry__row">
                <template
                  v-for="side in item.sides"
                  :key="side.position"
                >
                  <span
                    v-if="side.position === 2"
                    class="round-draw-entry__vs"
                  >{{ versus }}</span>
                  <b v-if="side.name">{{ side.name }}</b>
                  <origam-select
                    v-else
                    :model-value="null"
                    :items="selectItems"
                    :label="side.label"
                    autocomplete
                    rounded="full"
                    density="compact"
                    hide-details
                    :disabled="readOnly"
                    :data-cy="side.dataCy"
                    @update:model-value="handlePlace(item.index, side.position, $event)"
                  />
                </template>
              </div>
            </template>
          </origam-card>
        </template>
        <template v-else>
          <span class="round-draw-entry__slot-number">{{ item.index }}</span>
          <span class="round-draw-entry__free">{{ freeLabel }}</span>
        </template>
      </li>
    </ol>
    <p class="round-draw-entry__note">
      {{ note }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamBtn, OrigamCard, OrigamProgress, OrigamSelect } from 'origam/components'
import { useT } from '~/composables/useT'
import { HOME_PROGRESS_THICKNESS, HOME_PROGRESS_TRACK_COLOR } from '~/consts/home.const'
import { ROUND_KIND_BY_POOL_SIZE } from '~/consts/qualification.const'
import { ROUND_DRAW_PLAYOFF_WAIT_TEXTS, ROUND_DRAW_SIDES, ROUND_DRAW_TARGET_SCORE, ROUND_DRAW_TEXTS, ROUND_DRAW_WAIT_ROUND_TEXTS } from '~/consts/round-draw.const'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import { ROUND_DRAW_PAIRING_STATE } from '~/enums/round-draw.enum'
import type { IRoundDrawEntryEmits, IRoundDrawEntryProps } from '~/interfaces/round-draw.interface'
import type { TSidePosition } from '~/types/draw.type'
import { currentPairingIndex, isPairingFull, unplacedPlayers } from '~/utils/round-draw.util'

/*********************************************************
 * Global
 *
 * @description
 * Saisie du tirage affiche par affiche (c9790abd (5)) : les affiches tirées en cartes (« Changer »), UNE affiche en cours avec ses deux sélecteurs (le côté déjà tiré s'écrit en
 * clair), les suivantes en emplacements passifs « Affiche à tirer ». Un joueur placé disparaît de la liste ; l'ordre de saisie est l'ordre du tirage ; la cible du tour (10) est
 * affichée, non éditable. Le brouillon est enregistré à chaque joueur placé (le parent s'en charge).
 * Les deux sélecteurs sont actifs : l'un ou l'autre côté peut être tiré en premier (le brouillon accepte une affiche partielle, `checkRoundDrawAssignments` avec `complete: false`).
 * Contournements Origam : bordure de l'affiche en cours par la prop `border-color` en `var(...)` (`docs/tickets/origam/card-couleur-bordure-variable-sans-effet.md`) ; étiquette des sélecteurs
 * sur une ligne (`docs/tickets/origam/field-etiquette-retour-ligne-max-width.md`).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IRoundDrawEntryProps>(), {})
const emits = defineEmits<IRoundDrawEntryEmits>()
defineSlots<{}>()
const titleId = useId()
const pairingState = ROUND_DRAW_PAIRING_STATE
const thickness = HOME_PROGRESS_THICKNESS
const trackColor = HOME_PROGRESS_TRACK_COLOR
const roundText = computed(() => ROUND_DRAW_TEXTS[props.roundKind])
const ofText = computed(() => t(roundText.value.of.key, roundText.value.of.fallback))
const title = computed(() => t('admin.round_draw.entry_title', 'Saisir le tirage {round}, affiche par affiche', { round: ofText.value }))
const roundLabel = computed(() => t(ROUND_LABELS[props.roundKind].key, ROUND_LABELS[props.roundKind].label))
const playerTotal = computed(() => props.progress.placed + props.progress.remaining)
const countText = computed(() => t('admin.round_draw.entry_count', '{done} / {total} affiches · {remaining} joueurs restants', { done: props.progress.pairings, total: props.progress.total, remaining: props.progress.remaining }))
const roundPrefix = computed(() => t('admin.round_draw.round_prefix', 'Tour :'))
const roundDetail = computed(() => t('admin.round_draw.round_detail', '{players} joueurs · {pairings} affiches', { players: playerTotal.value, pairings: props.progress.total }))
const roundToDrawPrefix = computed(() => t('admin.round_draw.round_to_draw_prefix', 'Tour à tirer :'))
const waitText = computed(() => {
  const next = ROUND_DRAW_WAIT_ROUND_TEXTS[ROUND_KIND_BY_POOL_SIZE[props.waitingLeaders + props.players.length / 2]!]
  if (!props.waitingLeaders || !next) {
    return ''
  }
  const texts = props.waitingLeaders === 1 ? ROUND_DRAW_PLAYOFF_WAIT_TEXTS.one : ROUND_DRAW_PLAYOFF_WAIT_TEXTS.other
  return t(texts.key, texts.fallback, { count: props.waitingLeaders, round: t(next.key, next.fallback) })
})
const roundToDrawDetail = computed(() => t('admin.round_draw.round_to_draw_detail', '{players} joueurs.', { players: playerTotal.value }))
const changeRoundLabel = computed(() => t('admin.round_draw.change_round', 'Changer de tour'))
const progressLabel = computed(() => t('admin.round_draw.progress_label', '{done} affiches saisies sur {total}', { done: props.progress.pairings, total: props.progress.total }))
const versus = computed(() => t('admin.round_draw.versus', 'contre'))
const changeLabel = computed(() => t('admin.round_draw.change', 'Changer'))
const freeLabel = computed(() => t('admin.round_draw.free', 'Affiche à tirer'))
const note = computed(() => t('admin.round_draw.entry_note', 'Un joueur placé disparaît des autres listes. Cible du tour : {target} points.', { target: ROUND_DRAW_TARGET_SCORE }))

/*********************************************************
 * Affiches
 *
 * @description
 * Les textes sont calculés ici ; le gabarit ne fait que les afficher.
 ********************************************************/
const nameOf = (participationId: string | undefined): string => props.players.find(player => player.participationId === participationId)?.competitor.displayName ?? ''
const selectItems = computed(() => unplacedPlayers(props.players, props.pairings).map(player => ({ title: player.competitor.displayName, value: player.participationId })))
const items = computed(() => {
  const current = currentPairingIndex(props.pairings)
  return props.pairings.map((pairing) => {
    const state = isPairingFull(pairing) ? ROUND_DRAW_PAIRING_STATE.FULL : (pairing.index === current ? ROUND_DRAW_PAIRING_STATE.CURRENT : ROUND_DRAW_PAIRING_STATE.FREE)
    return {
      index: pairing.index,
      state,
      dataCy: `round-draw-pairing-${pairing.index}`,
      itemClass: { 'round-draw-entry__item--free': state === ROUND_DRAW_PAIRING_STATE.FREE },
      eyebrow: state === ROUND_DRAW_PAIRING_STATE.CURRENT
        ? t('admin.round_draw.eyebrow_current', 'Affiche {index} / {total} · en cours', { index: pairing.index, total: props.pairings.length })
        : t('admin.round_draw.eyebrow', 'Affiche {index}', { index: pairing.index }),
      firstName: nameOf(pairing.first?.participationId),
      secondName: nameOf(pairing.second?.participationId),
      changeAriaLabel: t('admin.round_draw.change_aria', 'Changer l’affiche {index}', { index: pairing.index }),
      changeDataCy: `round-draw-change-${pairing.index}`,
      sides: ROUND_DRAW_SIDES.map(position => ({
        position,
        name: nameOf((position === 1 ? pairing.first : pairing.second)?.participationId),
        label: position === 1
          ? t('admin.round_draw.select_first', 'Affiche {index} : premier joueur tiré', { index: pairing.index })
          : t('admin.round_draw.select_second', 'Affiche {index} : second joueur tiré', { index: pairing.index }),
        dataCy: `round-draw-select-${pairing.index}-${position}`
      }))
    }
  })
})
const handlePlace = (pairingIndex: number, position: TSidePosition, value: string | null) => {
  if (value) {
    emits('place', pairingIndex, value, position)
  }
}
const handleChange = (pairingIndex: number) => {
  emits('change', pairingIndex)
}
const handleChangeRound = () => {
  emits('change-round')
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
.round-draw-entry {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--round-draw-entry---gap, var(--origam-space---3));
    margin-bottom: var(--origam-space---4);
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

  &__round {
    margin: 0 0 var(--origam-space---3);
  }

  &__muted {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__progress {
    --origam-progress-linear__background---opacity: 1;
    margin-bottom: var(--origam-space---5);
  }

  &__list {
    display: grid;
    gap: var(--origam-space---2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__card :deep(.origam-card__content) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--origam-space---2) var(--origam-space---4);
    padding: var(--round-draw-entry__card---padding-block, var(--origam-space---4)) var(--round-draw-entry__card---padding-inline, var(--origam-space---5));
  }

  &__card--next &__row {
    grid-column: 1 / -1;
  }

  &__card--next &__row :deep(.origam-label) {
  }

  &__card--next &__row :deep(.origam-label) {
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__card--next &__row :deep(.origam-select) {
    flex: 1 1 14rem;
    min-width: 0;
  }

  &__change {
    --origam-btn---height: var(--origam-space---11);
    --origam-btn---padding-sm: var(--origam-space---4);
    --origam-btn---font-size: var(--origam-font__size---sm);
  }

  &__eyebrow {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--origam-space---3);
    min-width: 0;
  }

  &__vs {
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }

  &__item--free {
    display: grid;
    grid-template-columns: var(--origam-space---8) minmax(0, 1fr);
    gap: var(--origam-space---2) var(--origam-space---4);
    align-items: center;
    min-height: var(--origam-space---11);
    padding: 0 var(--origam-space---3);
    border: 1px dashed var(--origam-color__border---strong);
    border-radius: var(--origam-radius---lg);
  }

  &__free {
    color: var(--origam-color__text---tertiary);
  }

  &__slot-number {
    color: var(--origam-color__text---tertiary);
    font-variant-numeric: tabular-nums;
    font-weight: var(--origam-font__weight---bold);
  }

  &__note {
    margin: var(--origam-space---3) 0 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }
}
</style>

<style>
:root {
  --round-draw-entry---gap: var(--origam-space---3);
  --round-draw-entry__card---padding-block: var(--origam-space---4);
  --round-draw-entry__card---padding-inline: var(--origam-space---5);
}
</style>
