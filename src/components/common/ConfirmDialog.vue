<template>
  <origam-dialog
    :model-value="open"
    :persistent="busy"
    :max-width="560"
    scrim
    padding="2"
    class="confirm-dialog"
    :title="title"
    role="alertdialog"
    :aria-describedby="descriptionId"
    :data-cy="`${cyPrefix}-dialog`"
    @update:model-value="handleOpen"
  >
    <template #[textSlot]>
      <p
        :id="descriptionId"
        class="confirm-dialog__text"
      >
        {{ text }} <strong v-if="warning">{{ warning }}</strong>
      </p>
    </template>
    <template #[footerSlot]>
      <div class="confirm-dialog__actions">
        <origam-btn
          ref="cancelRef"
          variant="outlined"
          :disabled="busy"
          :text="cancelLabel"
          :data-cy="`${cyPrefix}-cancel`"
          @click="emits('cancel')"
        />
        <origam-btn
          variant="flat"
          :bg-color="confirmColor"
          :size="confirmSize"
          :elevation="confirmElevation"
          :loading="busy"
          :disabled="busy"
          :text="confirmLabel"
          :data-cy="`${cyPrefix}-confirm`"
          @click="emits('confirm')"
        />
      </div>
    </template>
  </origam-dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import { OrigamBtn, OrigamDialog } from 'origam/components'
import type { IConfirmDialogEmits, IConfirmDialogProps } from '~/interfaces/common-components.interface'

/*********************************************************
 * Global
 *
 * @description
 * Confirmation d'une action définitive (validation du tirage F-11, arrêt de la liste des qualifiés F-24, puis F-25 et F-26) : Échap et le clic
 * extérieur l'annulent (décision ux 0ea5092e), sauf pendant l'envoi (`persistent`) ; le texte dit la conséquence, et que l'action n'est pas annulable ;
 * focus initial sur « Annuler », bouton de confirmation inactif pendant l'envoi. `origam-dialog` piège le focus et le rend au déclencheur à la fermeture.
 * Les `data-cy` partent de `cyPrefix` (`{préfixe}-dialog`, `-cancel`, `-confirm`).
 ********************************************************/
const props = withDefaults(defineProps<IConfirmDialogProps>(), {
  warning: '',
  confirmColor: 'danger',
  confirmSize: 'large',
  confirmElevation: undefined
})
const emits = defineEmits<IConfirmDialogEmits>()
defineSlots<{}>()
const descriptionId = useId()
// Contournement de typage : `<template #text>` et `<template #footer>` sur `origam-dialog` donnent, en 2.37.4,
// « TS2339: Property 'text' does not exist on type '{}' » alors que les slots existent à l'exécution. Origam #1332 (composants à `forwardRefs`),
// fiche docs/tickets/origam/dialog-slots-non-types.md.
const textSlot = 'text'
const footerSlot = 'footer'
const cancelRef = ref<{ $el?: HTMLElement } | null>(null)
const handleOpen = (value: boolean) => {
  if (!value) {
    emits('cancel')
  }
}
watch(() => props.open, async (open) => {
  if (open) {
    await nextTick()
    const element = cancelRef.value?.$el
    const target = element?.matches?.('button') ? element : element?.querySelector?.('button')
    target?.focus()
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
.confirm-dialog {
  // Gabarit de la maquette (`.odlg`, motif `.confirm` des tirages) : carte à 8 px, en-tête à 16 px, texte à 24 px, pied à 16 px, boutons de 44 px.
  &__text {
    margin: 0;
    color: var(--origam-color__text---primary);
    font-size: var(--origam-font__size---md);
    line-height: var(--origam-font__lineHeight---normal);
  }

  :deep(.origam-card-header__title) {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
    letter-spacing: normal;
    white-space: normal;
  }

  :deep(.origam-card__content) {
    padding: 0 var(--origam-space---6) var(--origam-space---6);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--origam-space---3);
    margin: 0 var(--confirm-dialog__actions---margin-inline, var(--origam-space---4)) var(--confirm-dialog__actions---margin-bottom, var(--origam-space---4));
  }
}
</style>

<style>
:root {
  --confirm-dialog__actions---margin-inline: var(--origam-space---4);
  --confirm-dialog__actions---margin-bottom: var(--origam-space---4);
}
</style>
