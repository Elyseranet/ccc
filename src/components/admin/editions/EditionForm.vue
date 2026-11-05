<template>
  <origam-card
    tag="section"
    class="edition-form"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    data-cy="edition-form-card"
  >
    <header class="edition-form__head">
      <div class="edition-form__heading">
        <p class="edition-form__eyebrow">
          {{ eyebrow }}
        </p>
        <origam-title
          :id="titleId"
          tag="h2"
          class="edition-form__title"
          :text="title"
        />
      </div>
      <edition-chip
        v-if="statusChip"
        :text="statusChip.text"
        :family="statusChip.family"
        data-cy="edition-form-status"
      />
      <origam-chip
        v-else
        size="small"
        pill
        :text="codeChipText"
        data-cy="edition-form-code-chip"
      />
    </header>
    <edition-readonly-fields
      v-if="isEdit && edition"
      :edition="edition"
      :fields="readonlyFields"
    />
    <origam-form
      class="edition-form__form"
      validate-on="submit"
      :aria-labelledby="titleId"
      data-cy="edition-form"
      @submit="handleSubmit"
      @reset="handleReset"
    >
      <div class="edition-form__grid">
        <div
          v-if="!isEdit"
          class="edition-form__field"
        >
          <origam-label
            :for="yearId"
            class="edition-form__label"
            required
            :text="yearLabel"
          />
          <origam-text-field
            :id="yearId"
            v-model="draft.year"
            single-line
            required
            rounded="full"
            inputmode="numeric"
            :maxlength="yearLength"
            autocomplete="off"
            hide-details="auto"
            :rules="yearRules"
            data-cy="edition-form-year"
          />
        </div>
        <div class="edition-form__field">
          <origam-label
            :for="nameId"
            class="edition-form__label"
            :required="!isEdit"
            :text="nameLabel"
          />
          <origam-text-field
            :id="nameId"
            v-model="draft.name"
            single-line
            rounded="full"
            autocomplete="off"
            hide-details="auto"
            :required="!isEdit"
            :rules="nameRules"
            :placeholder="namePlaceholder"
            data-cy="edition-form-name"
          />
        </div>
        <div class="edition-form__field">
          <origam-label
            :for="dateId"
            class="edition-form__label"
            :text="dateLabel"
          />
          <origam-date-picker-field
            :id="dateId"
            v-model="heldOn"
            single-line
            clearable
            rounded="full"
            hide-details="auto"
            data-cy="edition-form-date"
          />
        </div>
        <div class="edition-form__field">
          <origam-label
            :for="locationId"
            class="edition-form__label"
            :text="locationLabel"
          />
          <origam-text-field
            :id="locationId"
            v-model="draft.location"
            single-line
            rounded="full"
            autocomplete="off"
            hide-details="auto"
            :rules="locationRules"
            :placeholder="locationPlaceholder"
            data-cy="edition-form-location"
          />
        </div>
        <div class="edition-form__field edition-form__field--full">
          <origam-label
            :for="descriptionId"
            class="edition-form__label"
            :text="descriptionLabel"
          />
          <origam-textarea-field
            :id="descriptionId"
            v-model="draft.description"
            single-line
            auto-grow
            rounded="lg"
            :rows="3"
            hide-details="auto"
            :rules="descriptionRules"
            :placeholder="descriptionPlaceholder"
            data-cy="edition-form-description"
          />
        </div>
      </div>
      <origam-alert
        v-if="!isEdit"
        status="info"
        density="compact"
        rounded="lg"
        font-size="md"
        font-weight="bold"
        letter-spacing="normal"
        line-height="normal"
        :title="codeAlertTitle"
        :text="codeAlertText"
        data-cy="edition-form-code-info"
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
        data-cy="edition-form-error"
      />
      <div class="edition-form__cta">
        <origam-btn
          type="reset"
          variant="outlined"
          size="x-large"
          font-size="md"
          :disabled="pending"
          :text="cancelLabel"
          data-cy="edition-form-cancel"
        />
        <origam-btn
          type="submit"
          class="edition-form__submit"
          variant="flat"
          bg-color="primary"
          elevation="lg"
          size="x-large"
          font-size="md"
          :loading="pending"
          :text="submitLabel"
          data-cy="edition-form-submit"
        />
      </div>
    </origam-form>
    <origam-snackbar
      :model-value="savedOpen"
      status="success"
      location="bottom"
      :timeout="snackbarTimeout"
      :text="savedTitle"
      data-cy="edition-form-saved"
      @update:model-value="handleSavedOpen"
    />
  </origam-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard, OrigamChip, OrigamDatePickerField, OrigamForm, OrigamLabel, OrigamSnackbar, OrigamTextareaField, OrigamTextField, OrigamTitle } from 'origam/components'
import EditionReadonlyFields from '~/components/admin/editions/EditionReadonlyFields.vue'
import EditionChip from '~/components/edition/EditionChip.vue'
import { useT } from '~/composables/useT'
import { EDITION_READONLY_EDIT_FIELDS, EDITION_YEAR_LENGTH } from '~/consts/admin-editions.const'
import { ADMIN_SNACKBAR_TIMEOUT_MS } from '~/consts/admin-feedback.const'
import { EDITION_HERO_STATUS } from '~/consts/edition-view.const'
import { EDITION_DESCRIPTION_MAX_LENGTH, EDITION_LOCATION_MAX_LENGTH, EDITION_NAME_MAX_LENGTH } from '~/consts/edition.const'
import { EDITION_FORM_MODE, EDITION_YEAR_ISSUE } from '~/enums/admin-editions.enum'
import type { IEditionFormEmits, IEditionFormProps, IEditionFormValues } from '~/interfaces/admin-editions.interface'
import { checkEditionYear, toIsoDate } from '~/utils/admin-editions.util'

/*********************************************************
 * Global
 *
 * @description
 * Formulaire d'une édition, en création (année, nom, date, lieu, description) ou en modification (nom, date, lieu,
 * description ; code, année et statut en lecture seule, R-9). Le code n'est jamais saisi (CE-1). La validation se fait à
 * l'envoi ; le serveur reste l'autorité. L'année est un champ texte au clavier numérique (décision 87eea8e).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IEditionFormProps>(), { pending: false, failure: null, edition: null, saved: false })
const emits = defineEmits<IEditionFormEmits>()
defineSlots<{}>()
const titleId = useId()
const yearId = useId()
const nameId = useId()
const dateId = useId()
const locationId = useId()
const descriptionId = useId()
const yearLength = EDITION_YEAR_LENGTH
const readonlyFields = EDITION_READONLY_EDIT_FIELDS
const snackbarTimeout = ADMIN_SNACKBAR_TIMEOUT_MS
const isEdit = computed(() => props.mode === EDITION_FORM_MODE.EDIT)

/*********************************************************
 * Saisie
 *
 * @description
 * Copie locale des valeurs reçues : elle est rechargée quand la fiche change (chargement, enregistrement). Le sélecteur de date
 * renvoie une `Date` ou un texte ISO, ramené à `YYYY-MM-DD`.
 ********************************************************/
const draft = reactive<IEditionFormValues>({ ...props.values })
watch(() => props.values, (values) => {
  Object.assign(draft, values)
})
const heldOn = computed({
  get: () => draft.heldOn,
  set: (value: unknown) => {
    draft.heldOn = toIsoDate(value)
  }
})

/*********************************************************
 * Confirmation
 *
 * @description
 * Un enregistrement réussi s'annonce dans un snackbar (role status) qui se ferme seul après quelques secondes, comme F-09.
 ********************************************************/
const savedOpen = ref(false)
watch(() => props.saved, (value) => {
  savedOpen.value = value
}, { immediate: true })
const handleSavedOpen = (value: boolean) => {
  savedOpen.value = value
}

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()`.
 ********************************************************/
const eyebrow = computed(() => isEdit.value
  ? t('admin.editions.form_eyebrow_edit', 'Édition {code}', { code: props.edition?.code ?? '' })
  : t('admin.editions.form_eyebrow_create', 'Nouvelle édition'))
const title = computed(() => isEdit.value
  ? t('admin.editions.form_title_edit', 'Modifier les informations')
  : t('admin.editions.form_title_create', 'Créer une édition'))
const codeChipText = computed(() => t('admin.editions.form_code_chip', 'Code attribué à la création'))
const statusChip = computed(() => {
  const status = isEdit.value && props.edition ? EDITION_HERO_STATUS[props.edition.status] : null
  return status ? { text: t(status.label.key, status.label.fallback), family: status.family } : null
})
const yearLabel = computed(() => t('admin.editions.field_year', 'Année'))
const nameLabel = computed(() => t('admin.editions.field_name', 'Nom'))
const dateLabel = computed(() => t('admin.editions.field_date', 'Date'))
const locationLabel = computed(() => t('admin.editions.field_location', 'Lieu'))
const descriptionLabel = computed(() => t('admin.editions.field_description', 'Description'))
const namePlaceholder = computed(() => t('admin.editions.placeholder_name', 'Ex. Championnat de Caps {year}', { year: props.edition?.year ?? new Date().getFullYear() }))
const locationPlaceholder = computed(() => t('admin.editions.placeholder_location', 'Ville, bar ou salle'))
const descriptionPlaceholder = computed(() => t('admin.editions.placeholder_description', 'Ce que les joueurs doivent savoir sur cette édition'))
const codeAlertTitle = computed(() => t('admin.editions.code_info_title', 'Code'))
const codeAlertText = computed(() => t('admin.editions.code_info_text', 'Vous ne saisissez pas le code : le serveur le génère à la création. 2027 pour la première édition de l’année, puis 2027b, 2027c…'))
const failureTitle = computed(() => props.failure ? t(props.failure.title.key, props.failure.title.fallback, props.failure.title.params) : '')
const failureText = computed(() => props.failure ? t(props.failure.text.key, props.failure.text.fallback, props.failure.text.params) : '')
const savedTitle = computed(() => t('admin.editions.saved_title', 'Modifications enregistrées'))
const cancelLabel = computed(() => t('admin.editions.form_cancel', 'Annuler'))
const submitLabel = computed(() => isEdit.value
  ? t('admin.editions.form_submit_edit', 'Enregistrer')
  : t('admin.editions.form_submit_create', 'Créer l’édition'))

/*********************************************************
 * Règles
 *
 * @description
 * Mêmes bornes que le schéma serveur de B-10 (année 2000 à 2100, nom 160, lieu 160, description 5000). Le retour est
 * immédiat, mais c'est le serveur qui décide.
 ********************************************************/
const yearMessages = computed<Record<EDITION_YEAR_ISSUE, string>>(() => ({
  [EDITION_YEAR_ISSUE.REQUIRED]: t('admin.editions.rule_year_required', 'Indiquez une année sur 4 chiffres, par exemple 2027.'),
  [EDITION_YEAR_ISSUE.FORMAT]: t('admin.editions.rule_year_format', 'Indiquez une année sur 4 chiffres, par exemple 2027.'),
  [EDITION_YEAR_ISSUE.RANGE]: t('admin.editions.rule_year_range', 'L’année doit être comprise entre 2000 et 2100.')
}))
const requiredText = computed(() => t('admin.editions.rule_required', 'Champ obligatoire'))
const tooLongText = computed(() => t('admin.editions.rule_too_long', 'Trop long'))
const yearRules = computed(() => [
  (value: string) => {
    const issue = checkEditionYear(value)
    return issue === null || yearMessages.value[issue]
  }
])
const nameRules = computed(() => [
  (value: string) => isEdit.value || (value ?? '').trim() !== '' || requiredText.value,
  (value: string) => (value ?? '').trim().length <= EDITION_NAME_MAX_LENGTH || tooLongText.value
])
const locationRules = computed(() => [
  (value: string) => (value ?? '').trim().length <= EDITION_LOCATION_MAX_LENGTH || tooLongText.value
])
const descriptionRules = computed(() => [
  (value: string) => (value ?? '').trim().length <= EDITION_DESCRIPTION_MAX_LENGTH || tooLongText.value
])

/*********************************************************
 * Actions
 *
 * @description
 * L'événement `submit` d'`origam-form` se résout en `{ valid }` ; rien ne part tant qu'une règle échoue.
 ********************************************************/
const handleSubmit = async (event: Event) => {
  event.preventDefault()
  const { valid } = await (event as unknown as Promise<{ valid: boolean }>)
  if (!valid) {
    return
  }
  emits('submit', { ...draft })
}
const handleReset = () => {
  Object.assign(draft, props.values)
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
.edition-form {
  display: grid;
  gap: var(--edition-form---gap, var(--origam-space---5));
  padding: var(--edition-form---padding, var(--origam-space---6));

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    justify-content: space-between;
    gap: var(--origam-space---3);
  }

  &__heading {
    display: grid;
    gap: var(--origam-space---1);
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__title {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: normal;
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__form {
    display: grid;
    gap: var(--edition-form---gap, var(--origam-space---5));
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: var(--edition-form__grid---gap, var(--origam-space---4));
  }

  &__field {
    display: grid;
    align-content: start;
    gap: var(--origam-space---1);
    min-width: 0;

    &--full {
      grid-column: 1 / -1;
    }
  }

  &__label {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__cta {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--origam-space---3);
  }

  @media (max-width: 760px) {
    padding: var(--origam-space---5);

    &__grid {
      grid-template-columns: minmax(0, 1fr);
    }

    &__cta {
      display: grid;
      grid-template-columns: 1fr 1.4fr;
    }
  }
}
</style>

<style>
:root {
  --edition-form---gap: var(--origam-space---5);
  --edition-form---padding: var(--origam-space---6);
  --edition-form__grid---gap: var(--origam-space---4);
}
</style>
