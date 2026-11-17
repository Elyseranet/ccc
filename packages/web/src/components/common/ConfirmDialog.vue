<template>
  <origam-dialog
    :model-value="open"
    :persistent="busy"
    :max-width="560"
    scrim
    :padding="padding"
    :class="dialogClass"
    :title="title"
    role="alertdialog"
    :aria-describedby="hasText ? descriptionId : undefined"
    :data-cy="`${cyPrefix}-dialog`"
    @update:model-value="handleOpen"
  >
    <template #[textSlot]>
      <div class="confirm-dialog__body">
        <p
          v-if="hasText"
          :id="descriptionId"
          class="confirm-dialog__text"
        >
          {{ text }} <strong v-if="warning">{{ warning }}</strong>
        </p>
        <slot name="default" />
      </div>
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
          :bg-color="buttonColor"
          :size="confirmSize"
          :elevation="buttonElevation"
          :loading="busy"
          :disabled="busy || confirmDisabled"
          :text="confirmLabel"
          :data-cy="`${cyPrefix}-confirm`"
          @click="emits('confirm')"
        />
      </div>
    </template>
  </origam-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { OrigamBtn, OrigamDialog } from 'origam/components'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import type { IConfirmDialogEmits, IConfirmDialogProps } from '~/interfaces/common-components.interface'

/*********************************************************
 * Global
 *
 * @description
 * Confirmation d'une action définitive (validation du tirage F-11, arrêt de la liste des qualifiés F-24, puis F-25 et F-26) : Échap et le clic
 * extérieur l'annulent (décision ux 0ea5092e), sauf pendant l'envoi (`persistent`) ; le texte dit la conséquence, et que l'action n'est pas annulable ;
 * focus initial sur « Annuler », bouton de confirmation inactif pendant l'envoi. `origam-dialog` piège le focus et le rend au déclencheur à la fermeture.
 * Les `data-cy` partent de `cyPrefix` (`{préfixe}-dialog`, `-cancel`, `-confirm`).
 * shortcut: `.confirm-dialog__body` porte le `gap` entre le texte et le slot, que le contenu de carte d'`origam-dialog` n'a pas (F-63) ;
 * à retirer quand origam expose `--origam-card__content---gap` (version non publiée au 2026-11-17).
 ********************************************************/
const props = withDefaults(defineProps<IConfirmDialogProps>(), {
  warning: '',
  confirmColor: 'danger',
  confirmSize: 'large',
  confirmElevation: undefined,
  confirmDisabled: false,
  focusCancel: true,
  appearance: CONFIRM_DIALOG_APPEARANCE.DEFAULT
})
const emits = defineEmits<IConfirmDialogEmits>()
defineSlots<{ default?: () => unknown }>()
const descriptionId = useId()
const hasText = computed(() => Boolean(props.text || props.warning))
const isBlocked = computed(() => props.busy)
const { buttonColor, buttonElevation } = usePrimaryActionButton(isBlocked, { color: () => props.confirmColor, elevation: () => props.confirmElevation })
const isMockup = computed(() => props.appearance === CONFIRM_DIALOG_APPEARANCE.MOCKUP)
const padding = computed(() => isMockup.value ? '2' : '6')
const dialogClass = computed(() => ({ 'confirm-dialog': true, 'confirm-dialog--mockup': isMockup.value }))
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
  if (open && props.focusCancel) {
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
  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--confirm-dialog__body---gap, var(--origam-space---3));
  }

  &__text {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--origam-space---3);
  }

  // Apparence « maquette » (F-24, motif `.odlg` : carte à 8 px, en-tête à 16 px, texte à 24 px, pied à 16 px). Réservée à l'appel qui la demande : le dialogue de validation du tirage (F-11) garde son rendu tant que F-30 n'a pas tranché.
  &--mockup &__text {
    color: var(--origam-color__text---primary);
    font-size: var(--origam-font__size---md);
    line-height: var(--origam-font__lineHeight---normal);
  }

  &--mockup :deep(.origam-card-header__title) {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
    letter-spacing: normal;
    white-space: normal;
  }

  &--mockup :deep(.origam-card__content) {
    display: grid;
    gap: var(--origam-space---3);
    padding: 0 var(--origam-space---6) var(--origam-space---6);
  }

  // origam-dialog ajoute un `div` vide après le slot texte : dans la grille il coûte une rangée de plus (gap 12 px), soit 36 px au lieu des 24 px de la maquette entre le dernier contenu et le pied.
  &--mockup :deep(.origam-card__content > :empty) {
    display: none;
  }

  &--mockup &__actions {
    margin: 0 var(--confirm-dialog__actions---margin-inline, var(--origam-space---4)) var(--confirm-dialog__actions---margin-bottom, var(--origam-space---4));
  }
}
</style>

<style>
:root {
  --confirm-dialog__actions---margin-inline: var(--origam-space---4);
  --confirm-dialog__actions---margin-bottom: var(--origam-space---4);
  --confirm-dialog__body---gap: var(--origam-space---3);
}
</style>
