<template>
  <section
    class="round-draw-entry"
    :aria-labelledby="titleId"
    data-cy="round-draw-entry"
  >
    <round-draw-head
      v-if="!headless"
      :round-kind="roundKind"
      :progress="progress"
      :read-only="readOnly"
      :changeable="changeable"
      :waiting-leaders="waitingLeaders"
      :drawable-count="players.length"
      :complete="complete"
      @change-round="handleChangeRound"
    />
    <draw-random-band
      v-if="showBand"
      :kind="kind"
      :complete="complete"
      :restartable="complete || arrival !== null"
      :total="progress.total"
      :drawing="drawing"
      :started="started"
      :disabled="false"
      @draw="emits('draw')"
      @restart="emits('restart')"
    />
    <p
      v-if="showBand && !complete"
      class="round-draw-entry__or"
    >
      {{ orLabel }}
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
            :class="{ 'round-draw-entry__card--new': item.arrived }"
            :data-arrived="item.arrived || undefined"
          >
            <template #default>
              <cap-badge
                v-if="item.arrived"
                class="round-draw-entry__cap"
                :text="String(item.index)"
              />
              <p class="round-draw-entry__eyebrow">
                {{ item.eyebrow }}
                <origam-chip
                  v-if="item.arrived"
                  color="primary"
                  bg-color="primary"
                  size="small"
                  pill
                  :text="arrivedLabel"
                  data-cy="round-draw-arrived"
                />
              </p>
              <div class="round-draw-entry__row">
                <b>{{ item.firstName }}</b>
                <span class="round-draw-entry__vs">{{ versus }}</span>
                <b>{{ item.secondName }}</b>
              </div>
              <origam-btn
                v-if="!readOnly"
                variant="text"
                font-size="sm"
                padding-inline="4"
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
    <div
      v-if="showBand && complete"
      class="round-draw-entry__next"
    >
      <origam-btn
        variant="text"
        size="small"
        href="#round-draw-recap"
        :text="recapLink"
        data-cy="round-draw-recap-link"
      />
    </div>
    <p class="round-draw-entry__note">
      {{ note }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn, OrigamCard, OrigamChip, OrigamProgress, OrigamSelect } from 'origam/components'
import CapBadge from '~/components/common/CapBadge.vue'
import DrawRandomBand from '~/components/admin/draws/DrawRandomBand.vue'
import RoundDrawHead from '~/components/admin/round-draw/RoundDrawHead.vue'
import { useT } from '~/composables/useT'
import { HOME_PROGRESS_THICKNESS, HOME_PROGRESS_TRACK_COLOR } from '~/consts/home.const'
import { ROUND_DRAW_SIDES, ROUND_DRAW_TARGET_SCORE, ROUND_DRAW_TITLE_ID } from '~/consts/round-draw.const'
import { DRAW_KIND } from '~/enums/draw.enum'
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
const props = withDefaults(defineProps<IRoundDrawEntryProps>(), {
  drawing: false,
  started: false,
  arrival: null
})
const emits = defineEmits<IRoundDrawEntryEmits>()
defineSlots<{}>()
const titleId = ROUND_DRAW_TITLE_ID
const pairingState = ROUND_DRAW_PAIRING_STATE
const kind = DRAW_KIND.ROUND
const thickness = HOME_PROGRESS_THICKNESS
const trackColor = HOME_PROGRESS_TRACK_COLOR
const progressLabel = computed(() => t('admin.round_draw.progress_label', '{done} affiches saisies sur {total}', { done: props.progress.pairings, total: props.progress.total }))
const showBand = computed(() => !props.readOnly)
const complete = computed(() => props.progress.total > 0 && props.progress.pairings >= props.progress.total)
const recapLink = computed(() => t('admin.random_draw.recap_link', 'Relire le récapitulatif et valider ↓'))
const orLabel = computed(() => t('admin.random_draw.or_manual_round', 'ou saisir le tirage physique, affiche par affiche'))
const arrivedLabel = computed(() => t('admin.random_draw.arrived_pairing', 'Vient d’être tirée'))
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
      arrived: props.arrival?.pairingIndex === pairing.index,
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
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__card--next &__row :deep(.origam-select) {
    flex: 1 1 14rem;
    min-width: 0;
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

  &__card--new {
    position: relative;
    overflow: hidden;
    border-color: var(--origam-color__bar---amber);
    animation: round-draw-entry-slot var(--origam-motion__duration---xslow) var(--origam-motion__easing---decelerate) both;
  }

  &__card--new :deep(.origam-card__content) > :not(.round-draw-entry__cap) {
    animation: round-draw-entry-in var(--origam-motion__duration---xslow) var(--origam-motion__easing---decelerate) both;
  }

  &__card--new::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--origam-color__bar---foam) 55%, transparent), color-mix(in srgb, var(--origam-color__bar---amber) 30%, transparent) 35%, transparent 65%);
    opacity: 0;
    pointer-events: none;
    animation: round-draw-entry-foam var(--origam-motion__duration---xslow) var(--origam-motion__easing---decelerate) both;
  }

  &__card--new &__vs {
    color: var(--origam-color__bar---amber);
    font-weight: var(--origam-font__weight---bold);
  }

  &__cap {
    position: absolute;
    z-index: 1;
    left: 50%;
    top: 50%;
    width: var(--origam-space---16);
    aspect-ratio: 1;
    margin: calc(var(--origam-space---16) / -2) 0 0 calc(var(--origam-space---16) / -2);
    opacity: 0;
    pointer-events: none;
    filter: drop-shadow(0 6px 0 var(--origam-color__bar---neon));
    animation: round-draw-entry-cap var(--origam-motion__duration---xslow) var(--origam-motion__easing---decelerate) both;
  }

  &__next {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--origam-space---2) var(--origam-space---4);
    margin-top: var(--origam-space---4);
  }

  &__or {
    display: flex;
    align-items: center;
    gap: var(--origam-space---3);
    margin: 0 0 var(--origam-space---3);
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--origam-color__border---default);
    }
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

@keyframes round-draw-entry-slot {
  0% { background: var(--origam-color__surface---sunken); box-shadow: none; transform: scale(0.97); }
  50% { box-shadow: 0 0 0 2px var(--origam-color__bar---amber), 0 0 var(--origam-space---10) color-mix(in srgb, var(--origam-color__bar---neon) 70%, transparent); transform: scale(1.03); }
}

@keyframes round-draw-entry-in {
  0%, 52% { opacity: 0; visibility: hidden; translate: 0 var(--origam-space---2); }
}

@keyframes round-draw-entry-foam {
  0%, 40% { opacity: 0; transform: scale(0.2); }
  58% { opacity: 1; }
  90%, 100% { opacity: 0; transform: scale(1.6); }
}

@keyframes round-draw-entry-cap {
  0% { opacity: 0; transform: translateY(-160%) rotate(-540deg) scale(0.5); }
  12% { opacity: 1; }
  40% { opacity: 1; transform: translateY(0) rotate(0) scale(1.12); }
  50% { opacity: 1; transform: scale(1); }
  70%, 100% { opacity: 0; transform: scale(1.8) rotate(20deg); }
}
</style>

<style>
:root {
  --round-draw-entry---gap: var(--origam-space---3);
  --round-draw-entry__card---padding-block: var(--origam-space---4);
  --round-draw-entry__card---padding-inline: var(--origam-space---5);
}
</style>
