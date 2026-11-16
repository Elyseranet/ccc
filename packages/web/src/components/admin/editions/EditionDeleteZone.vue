<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    class="edition-delete"
    data-cy="edition-delete-zone"
  >
    <header class="edition-delete__head">
      <h2
        :id="titleId"
        class="edition-delete__title"
      >
        {{ title }}
      </h2>
    </header>
    <div class="edition-delete__action">
      <p class="edition-delete__text">
        {{ zoneText }}
      </p>
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
        data-cy="edition-delete-error"
      />
      <origam-btn
        variant="flat"
        bg-color="danger"
        size="x-large"
        font-size="md"
        aria-haspopup="dialog"
        :disabled="busy"
        :aria-busy="busy ? 'true' : undefined"
        :text="buttonLabel"
        data-cy="edition-delete-open"
        @click="handleOpen"
      />
    </div>
    <confirm-dialog
      :open="dialogOpen"
      :busy="busy"
      :title="dialogTitle"
      :text="dialogText"
      :warning="dialogWarning"
      :cancel-label="cancelLabel"
      :confirm-label="confirmLabel"
      cy-prefix="edition-delete"
      confirm-color="danger"
      :confirm-disabled="!confirmed"
      :focus-cancel="false"
      @cancel="handleCancel"
      @confirm="handleConfirm"
    >
      <div class="edition-delete__field">
        <origam-label
          :for="fieldId"
          class="edition-delete__label"
          :text="fieldLabel"
        />
        <origam-text-field
          :id="fieldId"
          v-model="typed"
          autocomplete="off"
          autofocus
          single-line
          hide-details
          rounded="full"
          class="edition-delete__code"
          data-cy="edition-delete-code"
        />
      </div>
    </confirm-dialog>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard, OrigamLabel, OrigamTextField } from 'origam/components'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { useFocusReturn } from '~/composables/useFocusReturn'
import { useT } from '~/composables/useT'
import { EDITION_STATUS } from '~/enums/edition.enum'
import type { IEditionDeleteZoneEmits, IEditionDeleteZoneProps } from '~/interfaces/admin-editions.interface'
import { isClosingCodeConfirmed } from '~/utils/edition-closing-view.util'

/*********************************************************
 * Global
 *
 * @description
 * Zone « danger » de la fiche d'une édition (F-60) : « Supprimer l'édition… » ouvre une confirmation qui dit ce qui part (participants, poules,
 * tirages, matchs ; pour une clôturée, ses points quittent les classements) et demande de saisir le code de l'édition, comme la clôture (F-26).
 * Le champ a un libellé visible ; focus initial sur lui, Échap et le clic extérieur annulent hors envoi. Le champ est vidé à chaque ouverture ;
 * le focus revient au bouton à la fermeture (`useFocusReturn`, `origam-dialog` le laisse sur `<body>`) ; le dialogue se ferme à la fin de l'envoi, et un refus s'affiche sous le bouton.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionDeleteZoneProps>(), { busy: false, failure: null })
const emits = defineEmits<IEditionDeleteZoneEmits>()
defineSlots<{}>()
const titleId = useId()
const fieldId = useId()
const dialogOpen = ref(false)
useFocusReturn(dialogOpen)
const typed = ref('')
const confirmed = computed(() => isClosingCodeConfirmed(typed.value, props.edition.code))
const isClosed = computed(() => props.edition.status === EDITION_STATUS.CLOSED)
const title = computed(() => t('admin.editions.delete_title', 'Zone de danger'))
const zoneText = computed(() => t('admin.editions.delete_text', 'Supprimer l’édition efface définitivement ses participations, ses poules, ses tirages et ses matchs. Les profils des compétiteurs sont conservés.'))
const buttonLabel = computed(() => props.busy
  ? t('admin.editions.delete_button_busy', 'Suppression en cours…')
  : t('admin.editions.delete_button', 'Supprimer l’édition…'))
const dialogTitle = computed(() => t('admin.editions.delete_dialog_title', 'Supprimer l’édition {code} ?', { code: props.edition.code }))
const dialogText = computed(() => isClosed.value
  ? t('admin.editions.delete_dialog_text_closed', 'Seront supprimés : les participants inscrits, les poules, les tirages et les matchs de l’édition {code}. Les profils des compétiteurs sont conservés. Cette édition est clôturée : ses points disparaîtront des classements.', { code: props.edition.code })
  : t('admin.editions.delete_dialog_text', 'Seront supprimés : les participants inscrits, les poules, les tirages et les matchs de l’édition {code}. Les profils des compétiteurs sont conservés.', { code: props.edition.code }))
const dialogWarning = computed(() => t('admin.editions.delete_dialog_warning', 'Cette action est définitive : il n’est pas possible de revenir en arrière.'))
const fieldLabel = computed(() => t('admin.editions.delete_dialog_field', 'Pour confirmer, saisissez le code de l’édition : {code}', { code: props.edition.code }))
const cancelLabel = computed(() => t('admin.editions.delete_dialog_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.editions.delete_dialog_confirm', 'Supprimer définitivement'))
const failureTitle = computed(() => props.failure ? t(props.failure.title.key, props.failure.title.fallback, props.failure.title.params) : '')
const failureText = computed(() => props.failure ? t(props.failure.text.key, props.failure.text.fallback, props.failure.text.params) : '')
const handleOpen = () => {
  typed.value = ''
  dialogOpen.value = true
}
const handleCancel = () => {
  dialogOpen.value = false
}
const handleConfirm = () => {
  if (confirmed.value) {
    emits('confirm')
  }
}
watch(() => props.busy, (now, was) => {
  if (was && !now) {
    dialogOpen.value = false
  }
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
.edition-delete {
  padding: var(--edition-delete---padding, var(--origam-space---6));
  margin-top: var(--edition-delete---margin-top, var(--origam-space---6));

  @media (max-width: 760px) {
    padding: var(--origam-space---5);
  }

  &__head {
    margin-bottom: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__action {
    display: grid;
    justify-items: start;
    gap: var(--origam-space---3);
  }

  &__text {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__field {
    display: grid;
    gap: var(--origam-space---1);
    margin-top: var(--origam-space---3);
  }

  &__label {
    font-size: var(--origam-font__size---sm);
    font-weight: var(--origam-font__weight---bold);
    color: var(--origam-color__text---secondary);
  }

  &__code {
    max-width: var(--edition-delete__code---max-width, 22rem);
  }
}
</style>

<style>
:root {
  --edition-delete---padding: var(--origam-space---6);
  --edition-delete---margin-top: var(--origam-space---6);
  --edition-delete__code---max-width: 22rem;
}
</style>
