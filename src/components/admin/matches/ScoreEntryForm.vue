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
        <div
          class="score-entry-form__player"
          :class="{ 'score-entry-form__player--second': index > 0 }"
        >
          <origam-label
            :for="fieldIds[index]"
            class="score-entry-form__name"
            :text="name"
          />
          <origam-text-field
            :id="fieldIds[index]"
            :model-value="values[index]"
            :label="name"
            single-line
            :error-messages="fieldMessages[index]"
            :autofocus="focusOnMount && index === 0"
            :disabled="busy"
            inputmode="numeric"
            :maxlength="maxLength"
            autocomplete="off"
            rounded="lg"
            class="score-entry-form__field"
            :data-cy="`admin-score-input-${index}`"
            :aria-describedby="ruleId"
            @update:model-value="handleInput(index, $event)"
          />
        </div>
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
      font-size="sm"
      class="score-entry-form__rule"
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
        bg-color="primary"
        elevation="lg"
        :hover="ctaHover"
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
import { OrigamAlert, OrigamBtn, OrigamForm, OrigamLabel, OrigamTextField } from 'origam/components'
import { useT } from '~/composables/useT'
import { SCORE_CTA_HOVER, SCORE_INPUT_MAX_LENGTH } from '~/consts/score-entry.const'
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
const fieldBaseId = useId()
const fieldIds = computed(() => props.names.map((_name, index) => `${fieldBaseId}-${index}`))
const maxLength = SCORE_INPUT_MAX_LENGTH
const ctaHover = SCORE_CTA_HOVER

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
  :deep(.origam-form__content) {
    display: grid;
    gap: var(--score-entry-form---gap, var(--origam-space---5));
  }

  &__duel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: start;
    gap: var(--score-entry-form__duel---gap, var(--origam-space---3));
  }

  &__player {
    display: grid;
    gap: var(--score-entry-form__player---gap, var(--origam-space---2));

    &--second {
      text-align: end;
    }
  }

  &__name {
    font-weight: var(--origam-font__weight---bold);
  }

  &__vs {
    padding-top: var(--origam-space---8);
    color: var(--origam-color__text---tertiary);
    font-size: var(--origam-font__size---3xl);
  }

  &__field {
    --origam-input__control---height: var(--score-entry-form__field---height, 5rem);

    :deep(input) {
      font-family: var(--score-entry-form__field---font-family, var(--origam-font__family---display, inherit));
      color: var(--origam-color__bar---amber);
      font-size: var(--origam-font__size---4xl);
      font-variant-numeric: tabular-nums;
      text-align: center;
    }
  }

  &__rule.origam-alert {
    --origam-color__feedback--info---bgHover: var(--score-entry-form__rule---bg, var(--origam-color__feedback--info---bgSubtle));
    --origam-color__feedback--info---bgActive: var(--score-entry-form__rule---bg, var(--origam-color__feedback--info---bgSubtle));

    background-color: var(--score-entry-form__rule---bg, var(--origam-color__feedback--info---bgSubtle));
    color: var(--score-entry-form__rule---fg, var(--origam-color__text---primary));
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
  --score-entry-form__field---height: 5rem;
  --score-entry-form__player---gap: var(--origam-space---2);
  --score-entry-form__rule---bg: var(--origam-color__feedback--info---bgSubtle);
  --score-entry-form__rule---fg: var(--origam-color__text---primary);
  --score-entry-form__actions---gap: var(--origam-space---3);
}
</style>
