<template>
  <origam-dialog
    v-if="match"
    :model-value="open"
    :title="title"
    :max-width="maxWidth"
    scrim
    class="score-validation-confirm"
    data-cy="admin-validate-dialog"
    @update:model-value="handleOpen"
  >
    <template #[dialogSlot.text]>
      <p
        class="score-validation-confirm__text"
        data-cy="admin-validate-text"
      >
        {{ text }}
      </p>
      <origam-alert
        v-if="failureMessage"
        status="error"
        density="compact"
        rounded="lg"
        :text="failureMessage"
        role="alert"
        data-cy="admin-validate-failure"
      />
    </template>
    <template #[dialogSlot.footer]>
      <div class="score-validation-confirm__actions">
        <origam-btn
          ref="cancelRef"
          variant="outlined"
          :disabled="isBusy"
          :text="cancelLabel"
          data-cy="admin-validate-cancel"
          @click="handleCancel"
        />
        <origam-btn
          variant="flat"
          :bg-color="buttonColor"
          :elevation="buttonElevation"
          :hover="ctaHover"
          :disabled="isBlocked"
          :loading="isBusy"
          :text="validateLabel"
          data-cy="admin-validate-confirm"
          @click="handleConfirm"
        />
      </div>
    </template>
  </origam-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamDialog } from 'origam/components'
import { useFocusReturn } from '~/composables/useFocusReturn'
import { useScoreEntry } from '~/composables/useScoreEntry'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import { SIDES_MULTI_MIN } from '~/consts/domain-rules.const'
import { DIALOG_SLOT, SCORE_CTA_HOVER, SCORE_CONFIRM_MAX_WIDTH, SCORE_FAILURE_TEXT } from '~/consts/score-entry.const'
import type { IScoreValidationConfirmEmits, IScoreValidationConfirmProps } from '~/interfaces/score-entry.interface'

/*********************************************************
 * Global
 *
 * @description
 * Confirmation de la validation d'un score déjà saisi (bouton « Valider » d'une carte). Valider rend le score opposable et
 * recalcule le classement : on le dit avant. Le focus initial est sur « Annuler », l'action la moins destructive.
 * Échap, focus piégé et retour du focus au déclencheur viennent d'`origam-dialog`. Emplacements `text` et `footer` en dynamique :
 * `defineSlots()` d'`origam-dialog` perd son typage (Origam #1332), vue-tsc refuserait un emplacement nommé.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IScoreValidationConfirmProps>(), {})
const emits = defineEmits<IScoreValidationConfirmEmits>()
defineSlots<{}>()
const maxWidth = SCORE_CONFIRM_MAX_WIDTH
useFocusReturn(() => props.open)
const dialogSlot = DIALOG_SLOT
const ctaHover = SCORE_CTA_HOVER
const cancelRef = ref<{ $el?: HTMLElement } | null>(null)

/*********************************************************
 * Validation
 *
 * @description
 * Les scores validés sont ceux déjà saisis : `useScoreEntry` les relit du match, et n'enregistre rien de plus.
 ********************************************************/
const entry = useScoreEntry(() => props.match, {
  onWritten: (updated, outcome) => emits('written', updated, outcome),
  onStale: () => emits('stale')
})
const isBusy = entry.isBusy
const canValidate = entry.canValidate
const handleOpen = (value: boolean) => {
  emits('update:open', value)
}
const handleCancel = () => {
  emits('update:open', false)
}
const handleConfirm = async () => {
  if (await entry.validate()) {
    emits('update:open', false)
  }
}

/*********************************************************
 * Focus initial
 *
 * @description
 * À l'ouverture, le focus va sur « Annuler » (l'action la moins destructive), une fois le contenu monté.
 ********************************************************/
watch(() => props.open, async (open) => {
  if (!open) {
    return
  }
  await nextTick()
  const element = cancelRef.value?.$el
  const button = element?.tagName === 'BUTTON' ? element : element?.querySelector('button')
  button?.focus()
})

/*********************************************************
 * Textes
 *
 * @description
 * Le score à valider est rappelé en toutes lettres avec les deux noms.
 ********************************************************/
const title = computed(() => t('admin.matches.confirm_title', 'Valider ce score ?'))
const text = computed(() => {
  const sides = props.match?.sides ?? []
  if (sides.length >= SIDES_MULTI_MIN) {
    const scores = sides.map(side => `${side.displayName} ${side.recordedScore ?? 0}`).join(', ')
    return t('admin.matches.confirm_text_multi', '{scores}. Une fois validé, le score devient public et le classement est recalculé.', { scores })
  }
  const [first, second] = sides
  return t('admin.matches.confirm_text', '{first} {firstScore} – {secondScore} {second}. Une fois validé, le score devient public et le classement est recalculé.', {
    first: first?.displayName ?? '',
    firstScore: first?.recordedScore ?? 0,
    secondScore: second?.recordedScore ?? 0,
    second: second?.displayName ?? ''
  })
})
const cancelLabel = computed(() => t('admin.matches.confirm_cancel', 'Annuler'))
const validateLabel = computed(() => t('admin.matches.action_validate', 'Valider'))
const failureMessage = computed(() => entry.failure.value
  ? t(SCORE_FAILURE_TEXT[entry.failure.value].key, SCORE_FAILURE_TEXT[entry.failure.value].label)
  : null)

const isBlocked = computed(() => !canValidate.value)
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
.score-validation-confirm {
  &__text {
    margin: 0 0 var(--score-validation-confirm---gap, var(--origam-space---4));
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--score-validation-confirm__actions---gap, var(--origam-space---3));
    width: 100%;
  }
}
</style>

<style>
:root {
  --score-validation-confirm---gap: var(--origam-space---4);
  --score-validation-confirm__actions---gap: var(--origam-space---3);
}
</style>
