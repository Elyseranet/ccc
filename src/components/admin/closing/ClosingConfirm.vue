<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    class="closing-confirm"
    data-cy="closing-section"
  >
    <template #default>
      <header class="closing-confirm__head">
        <h2
          :id="titleId"
          class="closing-confirm__title"
        >
          {{ title }}
        </h2>
      </header>
      <div class="closing-confirm__action">
        <origam-btn
          variant="flat"
          bg-color="danger"
          size="x-large"
          aria-haspopup="dialog"
          :disabled="disabled || busy"
          :aria-busy="busy ? 'true' : undefined"
          :text="buttonLabel"
          data-cy="closing-open"
          @click="handleOpen"
        />
        <p
          v-if="reason"
          class="closing-confirm__why"
          data-cy="closing-why"
        >
          {{ reason }}
        </p>
      </div>
      <confirm-dialog
        :open="dialogOpen"
        :busy="busy"
        :title="dialogTitle"
        :text="dialogText"
        :warning="dialogWarning"
        :cancel-label="cancelLabel"
        :confirm-label="confirmLabel"
        cy-prefix="closing"
        confirm-color="danger"
        :confirm-disabled="!confirmed"
        :focus-cancel="false"
        @cancel="handleCancel"
        @confirm="handleConfirm"
      >
        <origam-text-field
          v-model="typed"
          :label="fieldLabel"
          autocomplete="off"
          inputmode="numeric"
          autofocus
          single-line
          hide-details
          rounded="full"
          class="closing-confirm__code"
          data-cy="closing-code"
        />
      </confirm-dialog>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamBtn, OrigamCard, OrigamTextField } from 'origam/components'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { useT } from '~/composables/useT'
import type { IClosingConfirmEmits, IClosingConfirmProps } from '~/interfaces/edition-closing-view.interface'
import { isClosingCodeConfirmed } from '~/utils/edition-closing-view.util'

/*********************************************************
 * Global
 *
 * @description
 * « Confirmer la clôture » : le bouton « Clôturer l'édition… » ouvre une confirmation qui demande de saisir le code de l'édition (décision du 2026-11-05) ;
 * « Clôturer définitivement » reste inactif tant que le code saisi n'est pas le bon. Définitif, et le dialogue le dit (aucune réouverture, c9790abd (3)).
 * Focus initial sur le champ, Échap et le clic extérieur annulent hors envoi (ux 0ea5092e), double clôture sans erreur côté serveur (idempotent).
 * Le champ est vidé à chaque ouverture ; le dialogue se ferme à la fin de l'envoi, succès ou échec (le message d'échec est celui de la page).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IClosingConfirmProps>(), {})
const emits = defineEmits<IClosingConfirmEmits>()
defineSlots<{}>()
const titleId = useId()
const dialogOpen = ref(false)
const typed = ref('')
const confirmed = computed(() => isClosingCodeConfirmed(typed.value, props.code))
const title = computed(() => t('admin.closing.confirm_title', 'Confirmer la clôture'))
const buttonLabel = computed(() => props.busy
  ? t('admin.closing.button_busy', 'Clôture en cours…')
  : t('admin.closing.button', 'Clôturer l’édition…'))
const dialogTitle = computed(() => t('admin.closing.dialog_title', 'Clôturer l’édition {year} ?', { year: props.year }))
const dialogText = computed(() => t('admin.closing.dialog_text', 'Les points seront figés et l’édition passera en lecture seule.'))
const dialogWarning = computed(() => t('admin.closing.dialog_warning', 'Cette action est définitive : il n’est pas possible de revenir en arrière, l’édition ne pourra pas être rouverte.'))
const fieldLabel = computed(() => t('admin.closing.dialog_field', 'Pour confirmer, saisissez le code de l’édition : {code}', { code: props.code }))
const cancelLabel = computed(() => t('admin.closing.dialog_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.closing.dialog_confirm', 'Clôturer définitivement'))
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
.closing-confirm {
  padding: var(--closing-confirm---padding, var(--origam-space---6));
  margin-top: var(--closing-confirm---margin-top, var(--origam-space---6));

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
    gap: var(--origam-space---2);
  }

  &__why {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__code {
    max-width: var(--closing-confirm__code---max-width, 22rem);
  }
}
</style>

<style>
:root {
  --closing-confirm---padding: var(--origam-space---6);
  --closing-confirm---margin-top: var(--origam-space---6);
  --closing-confirm__code---max-width: 22rem;
}
</style>
