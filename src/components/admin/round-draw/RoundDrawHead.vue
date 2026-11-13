<template>
  <div class="round-draw-head">
  <header class="round-draw-head__head">
    <h2
      :id="titleId"
      class="round-draw-head__title"
    >
      {{ title }}
    </h2>
    <span
      class="round-draw-head__count"
      data-cy="round-draw-count"
    >{{ countText }}</span>
  </header>
  <p
    v-if="changeable"
    class="round-draw-head__round"
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
    class="round-draw-head__round"
    role="status"
    data-cy="round-draw-round"
  >
    {{ roundToDrawPrefix }} <b>{{ roundLabel }}</b>, {{ roundToDrawDetail }}
  </p>
  <p
    v-if="waitText"
    class="round-draw-head__muted"
    data-cy="round-draw-playoff-wait"
  >
    {{ waitText }}
  </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn } from 'origam/components'
import { useT } from '~/composables/useT'
import { ROUND_KIND_BY_POOL_SIZE } from '~/consts/qualification.const'
import { ROUND_DRAW_PLAYOFF_WAIT_TEXTS, ROUND_DRAW_TEXTS, ROUND_DRAW_TITLE_ID, ROUND_DRAW_WAIT_ROUND_TEXTS } from '~/consts/round-draw.const'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import { ROUND_KIND } from '~/enums/round.enum'
import type { IRoundDrawHeadEmits, IRoundDrawHeadProps } from '~/interfaces/round-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * En-tête de la saisie : titre, compteur, ligne du tour et, aux barrages, la phrase qui dit que les premiers de poule attendent (maquette : carte « Tirage des barrages »,
 * posée par la page ; aux autres tours l'en-tête est dans la colonne de saisie). Les textes sont calculés ici ; le gabarit ne fait que les afficher.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IRoundDrawHeadProps>(), {})
const emits = defineEmits<IRoundDrawHeadEmits>()
defineSlots<{}>()
const titleId = ROUND_DRAW_TITLE_ID
const roundText = computed(() => ROUND_DRAW_TEXTS[props.roundKind])
const ofText = computed(() => t(roundText.value.of.key, roundText.value.of.fallback))
const title = computed(() => props.roundKind === ROUND_KIND.PLAYOFF
  ? t('admin.round_draw.playoff_title', 'Tirage des barrages')
  : t('admin.round_draw.entry_title', 'Saisir le tirage {round}, affiche par affiche', { round: ofText.value }))
const roundLabel = computed(() => t(ROUND_LABELS[props.roundKind].key, ROUND_LABELS[props.roundKind].label))
const playerTotal = computed(() => props.progress.placed + props.progress.remaining)
const countText = computed(() => t('admin.round_draw.entry_count', '{done} / {total} affiches · {remaining} joueurs restants', { done: props.progress.pairings, total: props.progress.total, remaining: props.progress.remaining }))
const roundPrefix = computed(() => t('admin.round_draw.round_prefix', 'Tour :'))
const roundDetail = computed(() => t('admin.round_draw.round_detail', '{players} joueurs · {pairings} affiches', { players: playerTotal.value, pairings: props.progress.total }))
const roundToDrawPrefix = computed(() => t('admin.round_draw.round_to_draw_prefix', 'Tour à tirer :'))
const roundToDrawDetail = computed(() => t('admin.round_draw.round_to_draw_detail', '{players} joueurs.', { players: playerTotal.value }))
const changeRoundLabel = computed(() => t('admin.round_draw.change_round', 'Changer de tour'))
const waitText = computed(() => {
  const next = ROUND_DRAW_WAIT_ROUND_TEXTS[ROUND_KIND_BY_POOL_SIZE[props.waitingLeaders + props.drawableCount / 2]!]
  if (!props.waitingLeaders || !next) {
    return ''
  }
  const texts = props.waitingLeaders === 1 ? ROUND_DRAW_PLAYOFF_WAIT_TEXTS.one : ROUND_DRAW_PLAYOFF_WAIT_TEXTS.other
  return t(texts.key, texts.fallback, { count: props.waitingLeaders, round: t(next.key, next.fallback) })
})
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
.round-draw-head {
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
}
</style>
