<template>
  <origam-card
    tag="section"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    class="qualification-parameters"
    data-cy="qualification-parameters"
  >
    <template #default>
      <header class="qualification-parameters__head">
        <h2
          :id="titleId"
          class="qualification-parameters__title"
        >
          {{ title }}
        </h2>
      </header>
      <origam-form
        class="qualification-parameters__form"
        data-cy="qualification-form"
      >
        <div class="qualification-parameters__fields">
          <div class="qualification-parameters__field">
            <origam-label
              :for="topId"
              class="qualification-parameters__label"
              :text="topLabel"
            />
            <origam-text-field
              :id="topId"
              :model-value="inputs.topPerPool"
              :label="topLabel"
              single-line
              hide-details="auto"
              :error-messages="topMessages"
              :disabled="readonly"
              inputmode="numeric"
              autocomplete="off"
              rounded="lg"
              color="primary"
              data-cy="qualification-top-per-pool"
              @update:model-value="handleTop"
            />
          </div>
          <div class="qualification-parameters__field">
            <origam-label
              :for="bestId"
              class="qualification-parameters__label"
            >
              <template #default>
                {{ bestLabelStart }}<sup>{{ bestLabelEnd }}</sup>
              </template>
            </origam-label>
            <origam-text-field
              :id="bestId"
              :model-value="inputs.bestNextCount"
              :label="bestLabel"
              single-line
              hide-details="auto"
              :error-messages="bestMessages"
              :disabled="readonly"
              inputmode="numeric"
              autocomplete="off"
              rounded="lg"
              color="primary"
              data-cy="qualification-best-next"
              @update:model-value="handleBest"
            />
          </div>
          <div class="qualification-parameters__field">
            <origam-label
              :for="playoffId"
              class="qualification-parameters__label"
              :text="playoffLabel"
            />
            <origam-switch
              :id="playoffId"
              :model-value="inputs.withPlayoff"
              :disabled="readonly"
              hide-details
              data-cy="qualification-with-playoff"
              @update:model-value="handlePlayoff"
            />
          </div>
        </div>
      </origam-form>
      <p
        v-if="previewText"
        class="qualification-parameters__preview"
        role="status"
        data-cy="qualification-preview"
      >
        <strong>{{ previewText }}</strong> <span class="qualification-parameters__muted">{{ previewDetail }}</span>
      </p>
      <p class="qualification-parameters__note">
        {{ note }}
      </p>
    </template>
  </origam-card>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamCard, OrigamForm, OrigamLabel, OrigamSwitch, OrigamTextField } from 'origam/components'
import { useT } from '~/composables/useT'
import { QUALIFICATION_PARAMETER_ERROR_TEXT } from '~/consts/qualification-view.const'
import { QUALIFICATION_PARAMETER_ERROR } from '~/enums/qualification.enum'
import type { IQualificationParametersEmits, IQualificationParametersProps } from '~/interfaces/qualification-view.interface'

/*********************************************************
 * Global
 *
 * @description
 * Les paramètres de qualification (RG18) : « n premiers de chaque poule + m meilleurs (n+1)es », avec ou sans barrages. Champs en `origam-text-field`
 * `inputmode="numeric"` et non `origam-number-field` (qui borne en silence une valeur hors bornes : décision 87eea8e) ; les erreurs sont écrites,
 * aucune valeur n'est corrigée. Aucun contrôle « puissance de 2 » (décision c9790abd (6)). Avec barrages la liste est la même, seul le premier tour change
 * (PLAYOFF-DRAW : les barrages se tirent avec les autres tours, F-25). Aperçu en `role="status"` : « N qualifiés (n × poules + m) ».
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IQualificationParametersProps>(), {})
const emits = defineEmits<IQualificationParametersEmits>()
defineSlots<{}>()
const titleId = useId()
const topId = useId()
const bestId = useId()
const playoffId = useId()
const title = computed(() => t('admin.qualification.parameters_title', '3 · Paramètres de qualification'))
const topLabel = computed(() => t('admin.qualification.parameters_top', 'Premiers de chaque poule'))
const bestLabelStart = computed(() => t('admin.qualification.parameters_best_start', 'Meilleurs (n+1)'))
const bestLabelEnd = computed(() => t('admin.qualification.parameters_best_end', 'es'))
const bestLabel = computed(() => `${bestLabelStart.value}${bestLabelEnd.value}`)
const playoffLabel = computed(() => t('admin.qualification.parameters_playoff', 'Avec barrages'))
const note = computed(() => t('admin.qualification.parameters_note', 'Avec barrages, la liste des qualifiés est la même ; seul le premier tour change : « Premier tour à tirer : Barrages ».'))
const messageOf = (error: QUALIFICATION_PARAMETER_ERROR | null, min: number, max: number): string[] => error === null
  ? []
  : [t(QUALIFICATION_PARAMETER_ERROR_TEXT[error].key, QUALIFICATION_PARAMETER_ERROR_TEXT[error].fallback, { min, max })]
const topMessages = computed(() => messageOf(props.check.topPerPoolError, 1, props.bounds.largestPool))
const bestMessages = computed(() => messageOf(props.check.bestNextCountError, 0, props.bounds.poolCount))
const previewText = computed(() => props.preview === null ? '' : t('admin.qualification.parameters_preview', 'Aperçu : {count} qualifiés', { count: props.preview }))
const previewDetail = computed(() => props.check.parameters === null
  ? ''
  : t('admin.qualification.parameters_preview_detail', '({top} × {pools} poules + {best})', { top: props.check.parameters.topPerPool, pools: props.bounds.poolCount, best: props.check.parameters.bestNextCount }))

/*********************************************************
 * Saisie
 *
 * @description
 * Le parent porte les champs et relance la simulation après une pause.
 ********************************************************/
const handleTop = (value: string | null) => {
  emits('update:topPerPool', value ?? '')
}
const handleBest = (value: string | null) => {
  emits('update:bestNextCount', value ?? '')
}
const handlePlayoff = (value: boolean | null) => {
  emits('update:withPlayoff', value === true)
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
.qualification-parameters {
  padding: var(--qualification-parameters---padding, var(--origam-space---6));

  @media (max-width: 760px) {
    padding: var(--origam-space---5);
  }

  margin-top: var(--qualification-parameters---margin-top, var(--origam-space---6));

  &__head {
    margin-bottom: var(--origam-space---4);
  }

  &__title {
    margin: 0;
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
    gap: var(--qualification-parameters__fields---gap, var(--origam-space---4));

    @media (max-width: 1000px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__field {
    display: grid;
    align-content: start;
    gap: var(--origam-space---1);
    min-width: 0;
  }

  &__label {
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    line-height: var(--origam-font__lineHeight---normal);
    text-transform: uppercase;
  }

  &__preview {
    margin: var(--origam-space---4) 0 0;
  }

  &__muted {
    color: var(--origam-color__text---secondary);
  }

  &__note {
    margin: var(--origam-space---3) 0 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }
}
</style>

<style>
:root {
  --qualification-parameters---padding: var(--origam-space---6);
  --qualification-parameters---margin-top: var(--origam-space---6);
  --qualification-parameters__fields---gap: var(--origam-space---4);
}
</style>
