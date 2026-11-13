<template>
  <origam-alert
    :status="status"
    rounded="lg"
    :title="title"
    :text="text"
    font-size="md"
    font-weight="bold"
    letter-spacing="normal"
    line-height="normal"
    role="status"
    :data-cy="dataCy"
  >
    <template #default>
      <origam-btn
        v-if="link"
        variant="text"
        size="small"
        :to="link.to"
        :text="link.label"
        :data-cy="`${dataCy}-link`"
      />
    </template>
  </origam-alert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamAlert, OrigamBtn } from 'origam/components'
import { useT } from '~/composables/useT'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import { ROUND_DRAW_STATE_STATUS, ROUND_DRAW_TEXTS } from '~/consts/round-draw.const'
import { ADMIN_MATCH_ROUND_QUERY_PARAM } from '~/consts/admin-match-filters.const'
import { ROUTES } from '~/consts/routes.const'
import { ROUND_DRAW_VIEW } from '~/enums/round-draw.enum'
import type { IRoundDrawStatePanelProps } from '~/interfaces/round-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * Les états de la page où il n'y a rien à saisir, dits en toutes lettres avec ce qu'il faut faire : liste non arrêtée (lien vers la qualification), tour précédent inachevé et tour
 * tiré aux matchs à jouer (lien vers « Poules et matchs », filtre par tour : le filtre `?tour=` est géré côté application, décision du chef de projet), vivier qui ne se tire pas, tous les tours
 * validés. Le lien « Clôturer l'édition » mène à la page de clôture (F-26) : tous les tours sont validés.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IRoundDrawStatePanelProps>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const scoresLink = computed(() => props.roundKind
  ? { to: `${ROUTES.ADMIN_MATCHES}?${ADMIN_MATCH_ROUND_QUERY_PARAM}=${props.roundKind}`, label: t('admin.round_draw.state_scores_link', 'Aller aux scores') }
  : null)
const roundBare = computed(() => props.roundKind ? t(ROUND_DRAW_TEXTS[props.roundKind].bare.key, ROUND_DRAW_TEXTS[props.roundKind].bare.fallback) : '')
const roundLabel = computed(() => props.roundKind ? t(ROUND_LABELS[props.roundKind].key, ROUND_LABELS[props.roundKind].label) : '')
const dataCy = computed(() => `round-draw-state-${props.view}`)
const status = computed(() => ROUND_DRAW_STATE_STATUS[props.view])
const roundOf = computed(() => props.roundKind ? t(ROUND_DRAW_TEXTS[props.roundKind].of.key, ROUND_DRAW_TEXTS[props.roundKind].of.fallback) : '')
const title = computed(() => {
  switch (props.view) {
    case ROUND_DRAW_VIEW.QUALIFICATION_PENDING:
      return t('admin.round_draw.state_qualification_title', 'Liste des qualifiés non arrêtée')
    case ROUND_DRAW_VIEW.PREVIOUS_INCOMPLETE:
      return t('admin.round_draw.state_previous_title', 'Tour précédent incomplet')
    case ROUND_DRAW_VIEW.UNDRAWABLE:
      return t('admin.round_draw.state_undrawable_title', 'Le tour ne peut pas être tiré.')
    case ROUND_DRAW_VIEW.DRAWN:
      return t('admin.round_draw.state_drawn_title', 'Tirage {round} validé', { round: roundOf.value })
    default:
      return t('admin.round_draw.state_finished_title', 'Tous les tours sont validés.')
  }
})
const text = computed(() => {
  switch (props.view) {
    case ROUND_DRAW_VIEW.QUALIFICATION_PENDING:
      return t('admin.round_draw.state_qualification_text', 'Arrêtez d’abord la liste des qualifiés.')
    case ROUND_DRAW_VIEW.PREVIOUS_INCOMPLETE:
      return t('admin.round_draw.state_previous_text', 'Le tirage du tour suivant n’est possible qu’après validation de tous les matchs des {round} ({count} restants).', { round: roundBare.value, count: props.remainingMatches })
    case ROUND_DRAW_VIEW.UNDRAWABLE:
      return t('admin.round_draw.state_undrawable_text', 'Le vivier compte {count} joueurs : il ne peut pas être tiré. Vérifiez la qualification.', { count: props.playerCount })
    case ROUND_DRAW_VIEW.DRAWN:
      return props.validatedOn
        ? t('admin.round_draw.state_drawn_text', 'Validé le {date} : {count} matchs créés, à jouer ({round}).', { date: props.validatedOn, count: props.matchCount, round: roundLabel.value })
        : t('admin.round_draw.state_drawn_text_no_date', '{count} matchs créés, à jouer ({round}).', { count: props.matchCount, round: roundLabel.value })
    default:
      return t('admin.round_draw.state_finished_text', 'La phase finale est jouée : l’édition peut être clôturée.')
  }
})
const link = computed(() => {
  if (props.view === ROUND_DRAW_VIEW.QUALIFICATION_PENDING) {
    return { to: ROUTES.ADMIN_FINAL_PHASE_QUALIFICATION, label: t('admin.round_draw.state_qualification_link', 'Aller à la qualification') }
  }
  if (props.view === ROUND_DRAW_VIEW.FINISHED) {
    return { to: ROUTES.ADMIN_FINAL_PHASE_CLOSING, label: t('admin.round_draw.state_closing_link', 'Clôturer l’édition') }
  }
  return props.view === ROUND_DRAW_VIEW.PREVIOUS_INCOMPLETE || props.view === ROUND_DRAW_VIEW.DRAWN ? scoresLink.value : null
})

/*********************************************************
 * Expose
 *
 * @description
 * Rien à piloter depuis l'extérieur.
 ********************************************************/
defineExpose({})
</script>
