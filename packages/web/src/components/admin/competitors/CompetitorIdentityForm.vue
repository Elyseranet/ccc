<template>
  <origam-card
    tag="section"
    class="identity-form"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    data-cy="competitor-form-card"
  >
    <header class="identity-form__head">
      <p class="identity-form__eyebrow">
        {{ eyebrow }}
      </p>
      <origam-title
        :id="titleId"
        tag="h2"
        class="identity-form__title"
        font-size="xl"
        font-weight="bold"
        line-height="tight"
        letter-spacing="normal"
        :text="competitor.displayName"
        data-cy="competitor-form-title"
      />
    </header>
    <slot name="photo" />
    <origam-form
      class="identity-form__form"
      validate-on="submit"
      :aria-labelledby="titleId"
      data-cy="competitor-form"
      @submit="handleSubmit"
      @reset="handleReset"
    >
      <div class="identity-form__grid">
        <div class="identity-form__field identity-form__field--full">
          <origam-label
            :for="displayNameId"
            class="identity-form__label"
          >
            <template #default>
              {{ displayNameLabel }} <span aria-hidden="true">{{ requiredMark }}</span>
            </template>
          </origam-label>
          <origam-text-field
            :id="displayNameId"
            v-model="draft.displayName"
            single-line
            required
            rounded="full"
            autocomplete="off"
            :hint="displayNameHint"
            persistent-hint
            hide-details="auto"
            :rules="displayNameRules"
            data-cy="competitor-form-display-name"
          />
        </div>
        <div class="identity-form__field">
          <origam-label
            :for="firstNameId"
            class="identity-form__label"
            :text="firstNameLabel"
          />
          <origam-text-field
            :id="firstNameId"
            v-model="draft.firstName"
            single-line
            rounded="full"
            autocomplete="off"
            hide-details="auto"
            :rules="partRules"
            data-cy="competitor-form-first-name"
          />
        </div>
        <div class="identity-form__field">
          <origam-label
            :for="lastNameId"
            class="identity-form__label"
            :text="lastNameLabel"
          />
          <origam-text-field
            :id="lastNameId"
            v-model="draft.lastName"
            single-line
            rounded="full"
            autocomplete="off"
            hide-details="auto"
            :rules="partRules"
            data-cy="competitor-form-last-name"
          />
        </div>
        <div class="identity-form__field identity-form__field--full">
          <origam-label
            :for="nicknameId"
            class="identity-form__label"
            :text="nicknameLabel"
          />
          <origam-text-field
            :id="nicknameId"
            v-model="draft.nickname"
            single-line
            rounded="full"
            autocomplete="off"
            hide-details="auto"
            :rules="partRules"
            data-cy="competitor-form-nickname"
          />
        </div>
      </div>
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
        data-cy="competitor-form-error"
      />
      <div class="identity-form__cta">
        <origam-btn
          type="reset"
          variant="outlined"
          size="x-large"
          font-size="md"
          :disabled="pending"
          :text="cancelLabel"
          data-cy="competitor-form-cancel"
        />
        <origam-btn
          type="submit"
          class="identity-form__submit"
          variant="flat"
          :bg-color="buttonColor"
          :elevation="buttonElevation"
          size="x-large"
          font-size="md"
          :loading="pending"
          :text="submitLabel"
          data-cy="competitor-form-submit"
        />
      </div>
    </origam-form>
    <origam-snackbar
      :model-value="savedOpen"
      status="success"
      location="bottom"
      :timeout="snackbarTimeout"
      :text="savedText"
      data-cy="competitor-form-saved"
      @update:model-value="handleSavedOpen"
    />
  </origam-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard, OrigamForm, OrigamLabel, OrigamSnackbar, OrigamTextField, OrigamTitle } from 'origam/components'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import { ADMIN_SNACKBAR_TIMEOUT_MS } from '~/consts/admin-feedback.const'
import { ADMIN_REQUIRED_MARK } from '~/consts/admin-form.const'
import { COMPETITOR_DISPLAY_NAME_MAX_LENGTH, COMPETITOR_NAME_PART_MAX_LENGTH } from '~/consts/competitor.const'
import type { ICompetitorFormValues, ICompetitorIdentityFormEmits, ICompetitorIdentityFormProps } from '~/interfaces/admin-competitors.interface'

/*********************************************************
 * Global
 *
 * @description
 * Correction de l'identité d'un compétiteur (B-10) : nom affiché (obligatoire), prénom, nom et pseudo. La photo se place dans le
 * slot `photo` : elle a son propre flux (B-16) et ne fait pas avancer la version de l'identité. La validation se fait à
 * l'envoi ; le serveur reste l'autorité. La version (`If-Match`) n'est pas un champ : elle est lue sur la fiche par le composable.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<ICompetitorIdentityFormProps>(), { pending: false, failure: null, saved: false })
const emits = defineEmits<ICompetitorIdentityFormEmits>()
defineSlots<{ photo?: () => unknown }>()
const titleId = useId()
const displayNameId = useId()
const firstNameId = useId()
const lastNameId = useId()
const nicknameId = useId()
const snackbarTimeout = ADMIN_SNACKBAR_TIMEOUT_MS
const requiredMark = ADMIN_REQUIRED_MARK

/*********************************************************
 * Saisie
 *
 * @description
 * Copie locale des valeurs reçues, rechargée quand la fiche change (autre compétiteur, enregistrement, 412).
 ********************************************************/
const draft = reactive<ICompetitorFormValues>({ ...props.values })
watch(() => props.values, (values) => {
  Object.assign(draft, values)
})

/*********************************************************
 * Confirmation
 *
 * @description
 * Un enregistrement réussi s'annonce dans un snackbar (role status) qui se ferme seul.
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
const eyebrow = computed(() => t('admin.competitors.form_eyebrow', 'Correction d’identité'))
const displayNameLabel = computed(() => t('admin.competitors.field_display_name', 'Nom affiché'))
const displayNameHint = computed(() => t('admin.competitors.field_display_name_hint', 'Utilisé partout sur le site public.'))
const firstNameLabel = computed(() => t('admin.competitors.field_first_name', 'Prénom'))
const lastNameLabel = computed(() => t('admin.competitors.field_last_name', 'Nom'))
const nicknameLabel = computed(() => t('admin.competitors.field_nickname', 'Pseudo'))
const cancelLabel = computed(() => t('admin.competitors.form_cancel', 'Annuler'))
const submitLabel = computed(() => t('admin.competitors.form_submit', 'Enregistrer'))
const savedText = computed(() => t('admin.competitors.saved', 'Identité enregistrée'))
const failureTitle = computed(() => props.failure ? t(props.failure.title.key, props.failure.title.fallback, props.failure.title.params) : '')
const failureText = computed(() => props.failure ? t(props.failure.text.key, props.failure.text.fallback, props.failure.text.params) : '')

/*********************************************************
 * Règles
 *
 * @description
 * Mêmes bornes que le schéma serveur (nom affiché, parties du nom). Le retour est immédiat, mais c'est le serveur qui décide.
 ********************************************************/
const requiredText = computed(() => t('admin.competitors.rule_required', 'Champ obligatoire'))
const tooLongText = computed(() => t('admin.competitors.rule_too_long', 'Trop long'))
const displayNameRules = computed(() => [
  (value: string) => (value ?? '').trim() !== '' || requiredText.value,
  (value: string) => (value ?? '').trim().length <= COMPETITOR_DISPLAY_NAME_MAX_LENGTH || tooLongText.value
])
const partRules = computed(() => [
  (value: string) => (value ?? '').trim().length <= COMPETITOR_NAME_PART_MAX_LENGTH || tooLongText.value
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

const isBlocked = computed(() => props.pending)
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
.identity-form {
  display: grid;
  gap: var(--identity-form---gap, var(--origam-space---5));
  padding: var(--identity-form---padding, var(--origam-space---6));

  &__head {
    display: grid;
    gap: 0;
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
    gap: var(--identity-form---gap, var(--origam-space---5));
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: var(--identity-form__grid---gap, var(--origam-space---4));
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
  --identity-form---gap: var(--origam-space---5);
  --identity-form---padding: var(--origam-space---6);
  --identity-form__grid---gap: var(--origam-space---4);
}
</style>
