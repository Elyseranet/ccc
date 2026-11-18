<template>
  <confirm-dialog
    :open="open"
    :busy="pending"
    :title="title"
    :text="text"
    :cancel-label="cancelLabel"
    :confirm-label="confirmLabel"
    :confirm-disabled="selected === ''"
    cy-prefix="admin-link"
    :appearance="appearance"
    confirm-color="primary"
    :focus-cancel="false"
    @cancel="emits('cancel')"
    @confirm="handleConfirm"
  >
    <origam-alert
      v-if="invitedPlayerEmail"
      id="admin-link-warning"
      status="warning"
      density="compact"
      rounded="lg"
      font-size="md"
      letter-spacing="normal"
      line-height="normal"
      :text="warningText"
      data-cy="admin-link-warning"
    />
    <div class="admin-link-dialog__field">
      <origam-label
        :for="fieldId"
        class="admin-link-dialog__label"
        :text="fieldLabel"
      />
      <origam-select
        :id="fieldId"
        v-model="selected"
        single-line
        rounded="full"
        hide-details
        autofocus
        :items="items"
        :loading="loading"
        :open-text="fieldLabel"
        :close-text="fieldLabel"
        :disabled="unavailable"
        :menu-icon="CaretDown"
        data-cy="admin-link-select"
      />
    </div>
    <origam-alert
      v-if="unavailable"
      status="error"
      rounded="lg"
      font-size="md"
      letter-spacing="normal"
      line-height="normal"
      :text="unavailableText"
      data-cy="admin-link-unavailable"
    />
    <origam-alert
      v-if="failure"
      status="error"
      rounded="lg"
      font-size="md"
      font-weight="bold"
      letter-spacing="normal"
      line-height="normal"
      :title="failureTitle"
      :text="failureText"
      data-cy="admin-link-error"
    />
  </confirm-dialog>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamAlert, OrigamLabel, OrigamSelect } from 'origam/components'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import CaretDown from '~/components/icons/CaretDown.vue'
import { useT } from '~/composables/useT'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import { USER_STATUS } from '~/enums/user.enum'
import type { IAdminLinkDialogEmits, IAdminLinkDialogProps } from '~/interfaces/admin-competitors.interface'

/*********************************************************
 * Global
 *
 * @description
 * Boîte « Relier à un administrateur » de la fiche compétiteur (F-69, B-32) : un choix parmi les administrateurs sans fiche (un administrateur
 * invité y figure, suffixé « invité »), libellé visible lié au champ. Le premier est présélectionné à l'ouverture. `open-text` / `close-text` portent le libellé du champ : `origam-select` en fait l'`aria-label` de sa saisie (« Ouvrir » par défaut), qui l'emporte sur le `<label for>` et laisserait le champ sans nom. Si la fiche a un compte
 * joueur invité jamais activé, l'avertissement dit qu'il sera supprimé (le serveur le fait). Le parent rend le focus au déclencheur
 * (`useFocusReturn`) et ferme la boîte quand la liaison a réussi.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IAdminLinkDialogProps>(), { unavailable: false, loading: false, invitedPlayerEmail: null, pending: false, failure: null })
const emits = defineEmits<IAdminLinkDialogEmits>()
defineSlots<{}>()
const fieldId = useId()
const appearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP
const selected = ref('')
const selectFirst = () => {
  selected.value = props.candidates[0]?.email ?? ''
}
watch(() => props.open, (open) => {
  if (open) {
    selectFirst()
  }
}, { immediate: true })
watch(() => props.candidates, () => {
  if (!props.candidates.some(candidate => candidate.email === selected.value)) {
    selectFirst()
  }
})
const invitedSuffix = computed(() => t('admin.account.link_invited_suffix', 'invité'))
const items = computed(() => props.candidates.map(candidate => ({
  value: candidate.email,
  title: candidate.status === USER_STATUS.INVITED ? `${candidate.email} · ${invitedSuffix.value}` : candidate.email
})))

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()`.
 ********************************************************/
const title = computed(() => t('admin.account.link_title', 'Relier {name} à un administrateur', { name: props.name }))
const text = computed(() => t('admin.account.link_text', 'Le compte choisi retrouve les statistiques de {name}. Aucune invitation n’est envoyée.', { name: props.name }))
const warningText = computed(() => t('admin.account.link_warning', '{name} a une invitation de joueur en attente ({email}). Son compte invité est supprimé et le lien envoyé ne fonctionnera plus.', { name: props.name, email: props.invitedPlayerEmail ?? '' }))
const unavailableText = computed(() => t('admin.account.link_unavailable', 'La liste des administrateurs n’a pas pu être chargée : fermez la boîte et réessayez.'))
const fieldLabel = computed(() => t('admin.account.link_field', 'Compte administrateur'))
const cancelLabel = computed(() => t('admin.account.dialog_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.account.link_confirm', 'Relier'))
const failureTitle = computed(() => props.failure ? t(props.failure.title.key, props.failure.title.fallback, props.failure.title.params) : '')
const failureText = computed(() => props.failure ? t(props.failure.text.key, props.failure.text.fallback, props.failure.text.params) : '')
const handleConfirm = () => {
  if (selected.value !== '') {
    emits('submit', selected.value)
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
.admin-link-dialog {
  &__field {
    display: grid;
    gap: var(--origam-space---1);
  }

  &__label {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }
}
</style>
