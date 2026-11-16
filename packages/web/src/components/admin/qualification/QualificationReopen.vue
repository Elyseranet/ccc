<template>
  <div
    class="qualification-reopen"
    data-cy="qualification-reopen"
  >
    <origam-btn
      variant="outlined"
      size="x-large"
      font-size="md"
      padding-inline="calc(var(--origam-space---6) - var(--origam-border__width---2))"
      aria-haspopup="dialog"
      :disabled="isBlocked"
      :loading="preparing"
      :text="buttonLabel"
      data-cy="qualification-reopen-open"
      @click="handleOpen"
    />
    <p
      class="qualification-reopen__why"
      data-cy="qualification-reopen-why"
    >
      {{ reasonText }}
    </p>
    <confirm-dialog
      :open="open"
      :busy="busy"
      :title="dialogTitle"
      :text="dialogText"
      :cancel-label="cancelLabel"
      :confirm-label="confirmLabel"
      cy-prefix="qualification-reopen"
      :confirm-color="confirmColor"
      confirm-elevation="lg"
      :appearance="dialogAppearance"
      @cancel="handleCancel"
      @confirm="handleConfirm"
    >
      <template #default>
        <p
          v-if="draft"
          class="qualification-reopen__effect"
          data-cy="qualification-reopen-draft"
        >
          <strong>{{ draftLost }}</strong> {{ draftRest }}
        </p>
        <p
          v-else
          class="qualification-reopen__effect"
          data-cy="qualification-reopen-again"
        >
          {{ againText }}
        </p>
      </template>
    </confirm-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrigamBtn } from 'origam/components'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { useT } from '~/composables/useT'
import { QUALIFICATION_REOPEN_BLOCKER_TEXT } from '~/consts/qualification-view.const'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import type { IQualificationReopenEmits, IQualificationReopenProps } from '~/interfaces/qualification-view.interface'
import { firstRoundText } from '~/utils/qualification-text.util'

/*********************************************************
 * Global
 *
 * @description
 * « Rouvrir les qualifications… » (F-51, B-25) : bouton secondaire (outlined) sous la liste arrêtée, avec sa raison dessous. Inactif quand le tirage du premier tour est validé ou l'édition
 * clôturée ; la raison écrite reste visible, active comme inactive. La boîte de confirmation n'est pas `persistent` hors envoi (Échap et clic extérieur annulent, ux 0ea5092e), focus initial
 * sur « Annuler ». Sans brouillon de tirage : bouton principal ; avec un brouillon : bouton danger « Rouvrir et effacer le brouillon » et le tour réel du brouillon, pas un tour codé en dur.
 * L'état d'ouverture et la lecture du brouillon vivent dans `useQualification`.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IQualificationReopenProps>(), {})
const emits = defineEmits<IQualificationReopenEmits>()
defineSlots<{}>()
const dialogAppearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP
const isBlocked = computed(() => props.blocker !== null)
const roundOf = computed(() => firstRoundText(t, props.roundKind))
const buttonLabel = computed(() => t('admin.qualification.reopen_button', 'Rouvrir les qualifications…'))
const reasonText = computed(() => {
  if (props.blocker === null) {
    return t('admin.qualification.reopen_possible', 'Possible tant que le tirage {round} n’est pas validé.', { round: roundOf.value })
  }
  const text = QUALIFICATION_REOPEN_BLOCKER_TEXT[props.blocker]
  return t(text.key, text.fallback, { round: roundOf.value })
})

/*********************************************************
 * Confirmation
 *
 * @description
 * Le texte dit la conséquence : liste annulée, retour aux paramètres, scores de poule corrigeables de nouveau. Deuxième paragraphe selon le cas : il faudra arrêter la liste à nouveau,
 * ou (brouillon) la phrase de perte en gras avec le nombre d'affiches saisies. Le tour du brouillon vient du brouillon lui-même (le serveur l'efface dans la même transaction).
 ********************************************************/
const draftRound = computed(() => firstRoundText(t, props.draft?.roundKind ?? props.roundKind))
const dialogTitle = computed(() => t('admin.qualification.reopen_dialog_title', 'Rouvrir les qualifications ?'))
const dialogText = computed(() => t('admin.qualification.reopen_dialog_text', 'La liste des {count} qualifiés est annulée et la page revient aux paramètres de qualification. Les scores de poule pourront de nouveau être corrigés.', { count: props.qualifiedCount }))
const againText = computed(() => t('admin.qualification.reopen_dialog_again', 'Il faudra arrêter la liste à nouveau avant le tirage {round}.', { round: roundOf.value }))
const draftLost = computed(() => t('admin.qualification.reopen_dialog_draft_lost', 'Le brouillon du tirage {round} sera effacé', { round: draftRound.value }))
const draftRest = computed(() => {
  const count = props.draft?.pairingCount ?? 0
  if (count === 0) {
    return t('admin.qualification.reopen_dialog_draft_rest_none', 'et ne pourra pas être récupéré.')
  }
  return count === 1
    ? t('admin.qualification.reopen_dialog_draft_rest_one', '(1 affiche saisie) et ne pourra pas être récupéré.')
    : t('admin.qualification.reopen_dialog_draft_rest_other', '({count} affiches saisies) et ne pourra pas être récupéré.', { count })
})
const cancelLabel = computed(() => t('admin.qualification.dialog_cancel', 'Annuler'))
const confirmLabel = computed(() => props.draft
  ? t('admin.qualification.reopen_confirm_draft', 'Rouvrir et effacer le brouillon')
  : t('admin.qualification.reopen_confirm', 'Rouvrir les qualifications'))
const confirmColor = computed(() => props.draft ? 'danger' : 'primary')
const handleOpen = () => {
  emits('open')
}
const handleCancel = () => {
  emits('cancel')
}
const handleConfirm = () => {
  emits('confirm')
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
.qualification-reopen {
  display: grid;
  justify-items: start;
  margin-top: var(--qualification-reopen---margin-top, var(--origam-space---4));

  &__why {
    margin: var(--origam-space---3) 0 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }

  &__effect {
    margin: 0;
  }
}
</style>

<style>
:root {
  --qualification-reopen---margin-top: var(--origam-space---4);
}
</style>
