<template>
  <origam-dialog
    :model-value="open"
    persistent
    :max-width="560"
    scrim
    :title="title"
    role="alertdialog"
    :aria-describedby="descriptionId"
    data-cy="draw-validate-dialog"
    @update:model-value="handleOpen"
  >
    <template #[textSlot]>
      <p
        :id="descriptionId"
        class="draw-validate-dialog__text"
      >
        {{ text }} <strong>{{ warning }}</strong>
      </p>
    </template>
    <template #[footerSlot]>
      <div class="draw-validate-dialog__actions">
        <origam-btn
          ref="cancelRef"
          variant="outlined"
          :disabled="busy"
          :text="cancelLabel"
          data-cy="draw-validate-cancel"
          @click="emits('cancel')"
        />
        <origam-btn
          variant="flat"
          bg-color="danger"
          size="large"
          :loading="busy"
          :disabled="busy"
          :text="confirmLabel"
          data-cy="draw-validate-confirm"
          @click="emits('confirm')"
        />
      </div>
    </template>
  </origam-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { OrigamBtn, OrigamDialog } from 'origam/components'
import { useT } from '~/composables/useT'
import type { IDrawValidateDialogProps } from '~/interfaces/pool-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * Confirmation de la validation du tirage : persistante (ni Échap ni clic extérieur ne la ferme sans « Annuler »), non annulable
 * (le texte le dit), focus initial sur « Annuler », bouton « Valider définitivement » inactif pendant l'envoi. `origam-dialog` piège
 * le focus et le rend à l'élément déclencheur à la fermeture.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawValidateDialogProps>(), {})
const emits = defineEmits<{ (event: 'cancel'): void, (event: 'confirm'): void }>()
defineSlots<{}>()
const descriptionId = useId()
// Origam ne type pas les slots de `origam-dialog` (`defineSlots()` vide, IDialogSlots non relié) : noms de slot dynamiques, vérifiés à l'exécution.
const textSlot = 'text'
const footerSlot = 'footer'
const cancelRef = ref<{ $el?: HTMLElement } | null>(null)
const title = computed(() => t('admin.draws.validate_title', 'Valider le tirage des poules ?'))
const text = computed(() => t('admin.draws.validate_text', '{total} joueurs, {pools} poules. Les affectations seront figées et les {matches} matchs de poule générés.', { total: props.total, pools: props.poolCount, matches: props.matchCount }))
const warning = computed(() => t('admin.draws.validate_warning', 'Cette action n’est pas annulable.'))
const cancelLabel = computed(() => t('admin.draws.validate_cancel', 'Annuler'))
const confirmLabel = computed(() => t('admin.draws.validate_confirm', 'Valider définitivement'))
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
.draw-validate-dialog {
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
}
</style>
