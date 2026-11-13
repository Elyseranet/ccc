<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    padding="6"
    :aria-labelledby="titleId"
    class="draw-validation"
    data-cy="draw-validation"
  >
    <div class="draw-validation__row">
      <div class="draw-validation__body">
        <h2
          :id="titleId"
          class="draw-validation__title"
        >
          {{ title }}
        </h2>
        <p class="draw-validation__text">
          {{ validated ? doneText : text }} <strong v-if="!validated">{{ warning }}</strong>
        </p>
      </div>
      <origam-btn
        v-if="!validated"
        variant="flat"
        :bg-color="buttonColor"
        :elevation="buttonElevation"
        size="x-large"
        :disabled="isBlocked"
        :text="openLabel"
        data-cy="draw-validate-open"
        @click="confirming = true"
      />
    </div>
    <draw-validate-dialog
      :open="confirming"
      :total="total"
      :pool-count="poolCount"
      :match-count="matchCount"
      :busy="busy"
      @cancel="confirming = false"
      @confirm="handleConfirm"
    />
  </origam-card>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamBtn, OrigamCard } from 'origam/components'
import DrawValidateDialog from '~/components/admin/draws/DrawValidateDialog.vue'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import type { IDrawValidationProps } from '~/interfaces/pool-draw.interface'

/*********************************************************
 * Global
 *
 * @description
 * Étape 5 : validation. Disponible quand tous les inscrits sont placés ; la validation fige les poules et génère les matchs, elle n'est
 * pas annulable. Le bouton ouvre la confirmation (focus initial sur « Annuler ») ; une fois le tirage validé, l'étape est en lecture seule.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IDrawValidationProps>(), {})
const emits = defineEmits<{ (event: 'confirm'): void }>()
defineSlots<{}>()
const titleId = useId()
const confirming = ref(false)
const title = computed(() => t('admin.draws.validation_title', '5 · Validation'))
const text = computed(() => t('admin.draws.validation_text', 'Disponible quand les {total} joueurs sont placés. La validation fige les poules et génère les matchs :', { total: props.total }))
const warning = computed(() => t('admin.draws.validation_warning', 'elle n’est pas annulable.'))
const doneText = computed(() => t('admin.draws.validation_done', 'Le tirage est validé : les poules et leurs matchs sont créés. Il ne peut plus changer.'))
const openLabel = computed(() => t('admin.draws.validation_open', 'Valider le tirage…'))
const handleConfirm = () => {
  emits('confirm')
}
watch(() => props.validated, (done) => {
  if (done) {
    confirming.value = false
  }
})

const isBlocked = computed(() => !props.canValidate || props.busy)
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
.draw-validation {
  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--origam-space---4);
  }

  &__body {
    display: grid;
    gap: var(--origam-space---1);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__text {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }
}
</style>
