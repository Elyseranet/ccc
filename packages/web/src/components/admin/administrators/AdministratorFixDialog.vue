<template>
  <confirm-dialog
    :open="open"
    :busy="pending"
    :title="title"
    :text="text"
    :cancel-label="cancelLabel"
    :confirm-label="confirmLabel"
    cy-prefix="administrator-fix"
    confirm-color="primary"
    :focus-cancel="false"
    :appearance="appearance"
    @cancel="emits('cancel')"
    @confirm="handleConfirm"
  >
    <account-email-field
      ref="fieldRef"
      v-model="email"
      cy-prefix="administrator-fix"
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
      class="administrator-fix__error"
      :title="failureTitle"
      :text="failureText"
      data-cy="administrator-fix-error"
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
import type { IAdministratorFixDialogEmits, IAdministratorFixDialogProps } from '~/interfaces/administrator.interface'
import { formatInvitationExpiry } from '~/utils/admin-competitors.util'

/*********************************************************
 * Global
 *
 * @description
 * Boîte « Corriger l'invitation » (F-68, B-31) : le même champ d'email que F-62 (`AccountEmailField`), pré-rempli avec l'email du compte non
 * activé ; « Corriger et renvoyer » annule l'ancien lien. Le focus initial est sur le champ ; Échap et « Annuler » ferment hors envoi. Le parent
 * rend le focus au déclencheur (`useFocusReturn`) et ferme la boîte quand la correction a réussi.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAdministratorFixDialogProps>(), {})
const emits = defineEmits<IAdministratorFixDialogEmits>()
defineSlots<{}>()
const fieldRef = ref<{ validate: () => boolean } | null>(null)
const email = ref('')
const appearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP
watch(() => props.open, (open) => {
  if (open) {
    email.value = props.account?.email ?? ''
  }
}, { immediate: true })
const emailTaken = computed(() => props.failure?.code === API_ERROR_CODE.EMAIL_ALREADY_USED)
const title = computed(() => t('admin.administrators.fix_title', 'Corriger l’invitation'))
const text = computed(() => {
  const account = props.account
  if (!account?.invitationExpiresAt) {
    return ''
  }
  const params = { email: account.email, date: formatInvitationExpiry(account.invitationExpiresAt) }
  return account.invitationExpired
    ? t('admin.account.state_expired', 'Invitation envoyée à {email}, expirée le {date}.', params)
    : t('admin.account.state_invited', 'Invitation envoyée à {email}, valable jusqu’au {date}.', params)
})
const cancelLabel = computed(() => t('admin.account.dialog_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.account.submit_correct', 'Corriger et renvoyer'))
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
.administrator-fix__error {
  margin-block-start: var(--origam-space---3);
}
</style>
