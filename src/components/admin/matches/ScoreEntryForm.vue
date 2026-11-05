<template>
  <origam-form
    validate-on="submit"
    class="score-entry-form"
    data-cy="admin-score-form"
    @submit="handleSubmit"
  >
    <div class="score-entry-form__duel">
      <template
        v-for="(name, index) in names"
        :key="index"
      >
        <span
          v-if="index > 0"
          class="score-entry-form__vs font-display"
          aria-hidden="true"
        >–</span>
        <origam-text-field
          :model-value="values[index]"
          :label="name"
          :error-messages="fieldMessages[index]"
          :autofocus="focusOnMount && index === 0"
          :disabled="busy"
          inputmode="numeric"
          :maxlength="maxLength"
          autocomplete="off"
          rounded="lg"
          class="score-entry-form__field font-display"
          :class="{ 'score-entry-form__field--second': index > 0 }"
          :data-cy="`admin-score-input-${index}`"
          :aria-describedby="ruleId"
          @update:model-value="handleInput(index, $event)"
        />
      </template>
    </div>
    <origam-alert
      v-if="formMessage"
      status="error"
      density="compact"
      rounded="lg"
      :text="formMessage"
      role="alert"
      data-cy="admin-score-form-error"
    />
    <origam-alert
      :id="ruleId"
      status="info"
      density="compact"
      rounded="lg"
      :title="ruleTitle"
      :text="ruleText"
      data-cy="admin-score-rule"
    />
    <p
      class="score-entry-form__meta"
      data-cy="admin-score-meta"
    >
      {{ meta }}
    </p>
    <origam-alert
      v-if="failureMessage"
      status="error"
      density="compact"
      rounded="lg"
      :text="failureMessage"
      role="alert"
      data-cy="admin-score-failure"
    />
    <div class="score-entry-form__actions">
      <origam-btn
        variant="outlined"
        :disabled="busy"
        :loading="saving"
        :text="saveLabel"
        data-cy="admin-score-save"
        @click="handleSave"
      />
      <origam-btn
        type="submit"
        variant="flat"
        color="primary"
        :disabled="!canValidate"
        :loading="validating"
        :text="validateLabel"
        data-cy="admin-score-validate"
      />
    </div>
  </origam-form>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamForm, OrigamTextField } from 'origam/components'
import { useT } from '~/composables/useT'
import { SCORE_INPUT_MAX_LENGTH } from '~/consts/score-entry.const'
import { SCORE_ENTRY_PHASE } from '~/enums/score-entry.enum'
import type { IScoreEntryFormEmits, IScoreEntryFormProps } from '~/interfaces/score-entry.interface'

/*********************************************************
 * Global
 *
 * @description
 * Formulaire de saisie d'un score : un champ par joueur (le nom du joueur est le libellé), le rappel de règle, puis deux actions
 * distinctes, « Enregistrer » (n'a aucun effet public) et « Valider » (rend le score opposable). Composant sans état métier :
 * tout vient des props (déjà traduites) et part en événements ; `useScoreEntry` porte les règles et les appels.
 * Les champs sont des `origam-text-field` en `inputmode="numeric"` et non des `origam-number-field` : ce dernier borne en
 * silence une valeur hors bornes (« 7 » deviendrait « 5 »), ce qui enverrait un score faux au serveur (Origam #1327, décision 87eea8e).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IScoreEntryFormProps>(), {
  focusOnMount: false
})
const emits = defineEmits<IScoreEntryFormEmits>()
defineSlots<{}>()
const ruleId = useId()
const maxLength = SCORE_INPUT_MAX_LENGTH

/*********************************************************
 * Actions
 *
 * @description
 * Seul le bouton de la phase en cours (enregistrement ou validation) affiche le chargement ; les deux sont désactivés pendant l'appel (double envoi).
 * « Valider » est le bouton de soumission du formulaire (touche Entrée dans un champ).
 ********************************************************/
const saveLabel = computed(() => t('admin.matches.save', 'Enregistrer'))
const busy = computed(() => props.phase !== SCORE_ENTRY_PHASE.IDLE)
const saving = computed(() => props.phase === SCORE_ENTRY_PHASE.SAVING)
const validating = computed(() => props.phase === SCORE_ENTRY_PHASE.VALIDATING)
const handleInput = (index: number, value: string | null) => {
  emits('update:value', index, value ?? '')
}
const handleSave = () => {
  emits('save')
}
const handleSubmit = (event: Event) => {
  event.preventDefault()
  emits('validate')
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
.score-entry-form {
  display: grid;
  gap: var(--score-entry-form---gap, var(--origam-space---5));

  &__duel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: start;
    gap: var(--score-entry-form__duel---gap, var(--origam-space---3));
  }

  &__vs {
    padding-top: var(--origam-space---5);
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---3xl);
  }

  &__field {
    :deep(input) {
      color: var(--origam-color__bar---amber);
      font-size: var(--origam-font__size---4xl);
      font-variant-numeric: tabular-nums;
      text-align: center;
    }
  }

  &__meta {
    margin: 0;
    color: var(--origam-color__text---secondary);
    font-size: var(--origam-font__size---sm);
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: var(--score-entry-form__actions---gap, var(--origam-space---3));
  }
}
</style>

<style>
:root {
  --score-entry-form---gap: var(--origam-space---5);
  --score-entry-form__duel---gap: var(--origam-space---3);
  --score-entry-form__actions---gap: var(--origam-space---3);
}
</style>
