<template>
  <origam-dialog
    v-if="match"
    :model-value="open"
    :title="title"
    :subtitle="eyebrow"
    :location="location"
    :max-width="maxWidth"
    scrim
    border
    border-color="var(--origam-color__border---strong)"
    class="score-entry-dialog"
    :class="{ 'score-entry-dialog--sheet': isSheet }"
    data-cy="admin-score-dialog"
    @update:model-value="handleOpen"
  >
    <template #[dialogSlot.text]>
      <score-entry-form
        :names="names"
        :values="entry.values.value"
        :field-messages="fieldMessages"
        :form-message="formMessage"
        :failure-message="failureMessage"
        :rule-title="ruleTitle"
        :rule-text="ruleText"
        :meta="meta"
        :validate-label="validateLabel"
        :phase="entry.phase.value"
        :can-validate="entry.canValidate.value"
        focus-on-mount
        @update:value="handleValue"
        @save="handleSave"
        @validate="handleValidate"
      />
    </template>
  </origam-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamDialog } from 'origam/components'
import ScoreEntryForm from '~/components/admin/matches/ScoreEntryForm.vue'
import { useBelowWidth } from '~/composables/useBelowWidth'
import { useFocusReturn } from '~/composables/useFocusReturn'
import { useScoreEntry } from '~/composables/useScoreEntry'
import { useT } from '~/composables/useT'
import { DIALOG_SLOT, SCORE_FAILURE_TEXT, SCORE_FIELD_ERROR_TEXT, SCORE_FORM_ERROR_TEXT, SCORE_SHEET_BREAKPOINT_PX } from '~/consts/score-entry.const'
import { ROUND_LABELS } from '~/consts/round-labels.const'
import { MATCH_PURPOSE, MATCH_STATUS } from '~/enums/match.enum'
import { ROUND_KIND } from '~/enums/round.enum'
import type { IScoreEntryDialogEmits, IScoreEntryDialogProps } from '~/interfaces/score-entry.interface'

/*********************************************************
 * Global
 *
 * @description
 * Saisie d'un score en dialogue modal (bureau) ou en tiroir bas (mobile, sous 1000 px). Un seul composant : `origam-dialog` donne le
 * focus piégé, Échap, le retour du focus au déclencheur et le voile, ce que `origam-sheet` ne fournit pas (c'est une boîte
 * positionnée, sans overlay ni piège de focus) ; en mobile le dialogue est simplement ancré en bas.
 * Les emplacements `text` et `footer` d'`origam-dialog` s'écrivent en dynamique (`#[…]`) : le composant déclare `defineSlots()` sans type,
 * donc vue-tsc refuse tout emplacement nommé (Origam #1332 : les composants à `forwardRefs` perdent le typage de leurs emplacements).
 * L'eyebrow (tour et numéro) s'affiche au-dessus du titre sans changer l'ordre du DOM : le titre reste lu en premier (`column-reverse`).
 * Le focus revient au déclencheur à la fermeture (`useFocusReturn`) : mesuré, `origam-dialog` le laisse sur `<body>`.
 * La saisie ne ferme le dialogue que sur un succès. Un échec (412, réseau) le laisse ouvert avec son message.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IScoreEntryDialogProps>(), {})
const emits = defineEmits<IScoreEntryDialogEmits>()
defineSlots<{}>()
const dialogSlot = DIALOG_SLOT
const isSheet = useBelowWidth(SCORE_SHEET_BREAKPOINT_PX)
useFocusReturn(() => props.open)
const location = computed(() => isSheet.value ? 'bottom' : undefined)
const maxWidth = computed(() => isSheet.value ? '100%' : 560)

/*********************************************************
 * Saisie
 *
 * @description
 * Les règles, la version et les appels vivent dans `useScoreEntry`.
 ********************************************************/
const entry = useScoreEntry(() => props.match, {
  onWritten: (updated, outcome) => emits('written', updated, outcome),
  onStale: () => emits('stale')
})
const handleOpen = (value: boolean) => {
  emits('update:open', value)
}
const handleValue = (index: number, value: string) => {
  entry.setValue(index, value)
}
const handleSave = async () => {
  if (await entry.save()) {
    emits('update:open', false)
  }
}
const handleValidate = async () => {
  if (await entry.validate()) {
    emits('update:open', false)
  }
}

/*********************************************************
 * Textes
 *
 * @description
 * Le rappel de règle dépend du tour (poule : cible 5 ; phase finale : cible 10). Les erreurs de champ et du formulaire
 * portent la cible. Le libellé de « Valider » rappelle le score qui sera validé.
 ********************************************************/
const names = computed(() => props.match?.sides.map(side => side.displayName) ?? [])
const isPool = computed(() => props.match?.roundKind === ROUND_KIND.POOLS)
const title = computed(() => props.match?.status === MATCH_STATUS.RECORDED
  ? t('admin.matches.dialog_title_edit', 'Modifier le score')
  : t('admin.matches.dialog_title', 'Saisir le score'))
const eyebrow = computed(() => {
  const match = props.match
  if (!match) {
    return ''
  }
  const number = `${props.editionCode}-${match.sequence}`
  if (match.purpose === MATCH_PURPOSE.TIEBREAK) {
    return match.poolRank === null
      ? t('admin.matches.dialog_eyebrow_tiebreak_inter', 'Départage entre poules · match {number}', { number })
      : t('admin.matches.dialog_eyebrow_tiebreak_pool', 'Poule {rank} · départage · match {number}', { rank: match.poolRank, number })
  }
  const label = ROUND_LABELS[match.roundKind].match
  const round = match.poolRank === null
    ? t(label.key, label.label)
    : t('admin.matches.pool_n', 'Poule {rank}', { rank: match.poolRank })
  return t('admin.matches.dialog_eyebrow', '{round} · match {number}', { round, number })
})
const ruleTitle = computed(() => t('admin.matches.rule_title', 'Cible {target}', { target: entry.target.value }))
const ruleText = computed(() => {
  if (props.match?.purpose === MATCH_PURPOSE.TIEBREAK) {
    return t('admin.matches.rule_tiebreak', 'Départage : le vainqueur marque exactement {target} (RG22). Saisir n’est pas valider : le classement ne bouge qu’à la validation.', { target: entry.target.value })
  }
  return isPool.value
    ? t('admin.matches.rule_pool', 'En poule, le vainqueur marque exactement {target} (RG22). Saisir n’est pas valider : le classement ne bouge qu’à la validation.', { target: entry.target.value })
    : t('admin.matches.rule_knockout', 'En phase finale, le vainqueur marque exactement {target} (RG22). Saisir n’est pas valider : le tableau ne bouge qu’à la validation.', { target: entry.target.value })
})
const meta = computed(() => props.match?.status === MATCH_STATUS.RECORDED
  ? t('admin.matches.meta_recorded', 'Score saisi · en attente de validation')
  : t('admin.matches.meta_scheduled', 'Aucun score saisi pour ce match'))
const fieldMessages = computed(() => entry.fieldErrors.value.map(error => error
  ? [t(SCORE_FIELD_ERROR_TEXT[error].key, SCORE_FIELD_ERROR_TEXT[error].label, { target: entry.target.value })]
  : []))
const formMessage = computed(() => entry.formError.value
  ? t(SCORE_FORM_ERROR_TEXT[entry.formError.value].key, SCORE_FORM_ERROR_TEXT[entry.formError.value].label, { target: entry.target.value })
  : null)
const failureMessage = computed(() => entry.failure.value
  ? t(SCORE_FAILURE_TEXT[entry.failure.value].key, SCORE_FAILURE_TEXT[entry.failure.value].label)
  : null)
const validateLabel = computed(() => {
  const [first, second] = entry.values.value
  return first && second
    ? t('admin.matches.validate_with_score', 'Valider {first}–{second}', { first, second })
    : t('admin.matches.action_validate', 'Valider')
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
.score-entry-dialog {
  :deep(.origam-card) {
    padding: 0;
  }

  :deep(.origam-card-header) {
    align-items: start;
    height: auto;
    padding: var(--score-entry-dialog---padding, var(--origam-space---6)) var(--score-entry-dialog---padding, var(--origam-space---6)) 0;
  }

  :deep(.origam-card__content) {
    padding: var(--score-entry-dialog__content---padding-top, var(--origam-space---5)) var(--score-entry-dialog---padding, var(--origam-space---6)) var(--score-entry-dialog---padding, var(--origam-space---6));
  }

  :deep(.origam-card-header__content) {
    display: flex;
    flex-direction: column-reverse;
  }

  :deep(.origam-card-header__subtitle) {
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    line-height: var(--origam-font__lineHeight---normal);
    text-transform: uppercase;
  }

  :deep(.origam-card-header__title) {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: normal;
    line-height: var(--origam-font__lineHeight---tight);
  }

  &--sheet {
    :deep(.origam-overlay__content) {
      inset: auto 0 0;
      width: 100%;
      margin: 0;
    }

    :deep(.origam-card)::before {
      content: '';
      position: absolute;
      inset-block-start: calc(var(--origam-space---6) - var(--origam-space---2) - var(--origam-border__width---thin));
      inset-inline: 0;
      width: var(--score-entry-dialog__grip---width, var(--origam-space---12));
      height: var(--score-entry-dialog__grip---height, 5px);
      margin-inline: auto;
      border-radius: var(--origam-radius---full);
      background: var(--origam-color__border---strong);
    }

    :deep(.origam-card-header) {
      padding-block-start: calc(var(--score-entry-dialog---padding, var(--origam-space---6)) + var(--score-entry-dialog__grip---height, 5px) + var(--origam-space---4) - var(--origam-space---2));
    }
  }
}
</style>

<style>
:root {
  --score-entry-dialog---padding: var(--origam-space---6);
  --score-entry-dialog__content---padding-top: var(--origam-space---5);
  --score-entry-dialog__grip---width: var(--origam-space---12);
  --score-entry-dialog__grip---height: 5px;
}
</style>
