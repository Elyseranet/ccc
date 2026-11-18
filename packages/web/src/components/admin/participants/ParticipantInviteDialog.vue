<template>
  <confirm-dialog
    :open="open"
    :busy="pending"
    :title="title"
    :text="text"
    :cancel-label="cancelLabel"
    :confirm-label="confirmLabel"
    cy-prefix="participant-invite"
    confirm-color="primary"
    :focus-cancel="false"
    :appearance="appearance"
    @cancel="emits('cancel')"
    @confirm="handleConfirm"
  >
    <account-email-field
      ref="fieldRef"
      v-model="email"
      cy-prefix="participant-invite"
      autofocus
      :taken="emailTaken"
    />
    <origam-alert
      v-if="failure"
      status="error"
      rounded="lg"
      font-size="md"
      font-weight="bold"
      letter-spacing="normal"
      line-height="normal"
      class="invite-dialog__error"
      :title="failureTitle"
      :text="failureText"
      data-cy="participant-invite-error"
    />
  </confirm-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { OrigamAlert } from 'origam/components'
import AccountEmailField from '~/components/admin/competitors/AccountEmailField.vue'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { useT } from '~/composables/useT'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import type { IParticipantInviteDialogEmits, IParticipantInviteDialogProps } from '~/interfaces/admin-competitors.interface'

/*********************************************************
 * Global
 *
 * @description
 * Boîte « Inviter » de la liste des inscrits (F-62) : la même saisie d'email que la fiche compétiteur (`AccountEmailField`), pour un
 * joueur sans compte. Le champ est vidé à chaque ouverture et reçoit le focus ; Échap et « Annuler » ferment hors envoi. Le parent
 * rend le focus au déclencheur (`useFocusReturn`) et ferme la boîte quand l'envoi a réussi.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IParticipantInviteDialogProps>(), { pending: false, failure: null })
const emits = defineEmits<IParticipantInviteDialogEmits>()
defineSlots<{}>()
const appearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP
const fieldRef = ref<{ validate: () => boolean } | null>(null)
const email = ref('')
watch(() => props.open, (open) => {
  if (open) {
    email.value = ''
  }
})
const emailTaken = computed(() => props.failure?.code === API_ERROR_CODE.EMAIL_ALREADY_USED)
const title = computed(() => t('admin.account.dialog_title', 'Inviter {name}', { name: props.name }))
const text = computed(() => t('admin.account.dialog_text', 'Un compte est créé pour {name} et un email d’invitation part aussitôt, pour qu’il récupère ses statistiques. Le lien est valable 7 jours.', { name: props.name }))
const cancelLabel = computed(() => t('admin.account.dialog_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.account.submit_invite', 'Envoyer l’invitation'))
const failureTitle = computed(() => props.failure ? t(props.failure.title.key, props.failure.title.fallback, props.failure.title.params) : '')
const failureText = computed(() => props.failure ? t(props.failure.text.key, props.failure.text.fallback, props.failure.text.params) : '')
const handleConfirm = () => {
  if (fieldRef.value?.validate()) {
    emits('submit', email.value)
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
.invite-dialog__error {
  margin-block-start: var(--origam-space---3);
}
</style>
