<template>
  <origam-form
    class="participant-form"
    validate-on="submit"
    :aria-labelledby="titleId"
    data-cy="participant-form"
    @submit="handleSubmit"
  >
    <div class="participant-form__body">
    <origam-title
      :id="titleId"
      tag="h3"
      font-size="xl"
      font-weight="bold"
      line-height="tight"
      letter-spacing="normal"
      class="participant-form__title"
      :text="title"
    />
    <div class="participant-form__grid">
      <div class="participant-form__field">
        <origam-label
          :for="lastNameId"
          class="participant-form__label"
          :text="lastNameLabel"
        />
        <origam-text-field
          :id="lastNameId"
          v-model="values.lastName"
          single-line
          hide-details="auto"
          autocomplete="family-name"
          :rules="nameRules"
          data-cy="participant-form-last-name"
        />
      </div>
      <div class="participant-form__field">
        <origam-label
          :for="firstNameId"
          class="participant-form__label"
          :text="firstNameLabel"
        />
        <origam-text-field
          :id="firstNameId"
          v-model="values.firstName"
          single-line
          hide-details="auto"
          autocomplete="given-name"
          :rules="nameRules"
          data-cy="participant-form-first-name"
        />
      </div>
      <div class="participant-form__field">
        <origam-label
          :for="nicknameId"
          class="participant-form__label"
          :text="nicknameLabel"
        />
        <origam-text-field
          :id="nicknameId"
          v-model="values.nickname"
          single-line
          hide-details="auto"
          :rules="nicknameRules"
          data-cy="participant-form-nickname"
        />
      </div>
      <div class="participant-form__field">
        <origam-label
          :for="avatarId"
          class="participant-form__label"
          :text="avatarLabel"
        />
        <origam-file-field
          :id="avatarId"
          v-model="avatar"
          single-line
          hide-details="auto"
          show-size
          :max-file-size="maxFileSize"
          :accept="avatarAccept"
          :placeholder="avatarHint"
          :prepend-inner-aria-label="avatarLabel"
          data-cy="participant-form-avatar"
        />
      </div>
      <div class="participant-form__field">
        <origam-label
          :for="emailId"
          class="participant-form__label"
          :text="emailLabel"
        />
        <origam-text-field
          :id="emailId"
          v-model="values.email"
          type="email"
          single-line
          hide-details="auto"
          autocomplete="off"
          :error="emailTaken"
          :aria-describedby="emailTaken ? emailErrorId : undefined"
          :rules="emailRules"
          data-cy="participant-form-email"
          @update:model-value="handleEmail"
        />
      </div>
      <div class="participant-form__field">
        <origam-label
          :for="phoneId"
          class="participant-form__label"
          :text="phoneLabel"
        />
        <origam-text-field
          :id="phoneId"
          v-model="values.phone"
          type="tel"
          single-line
          hide-details="auto"
          autocomplete="off"
          :rules="phoneRules"
          data-cy="participant-form-phone"
        />
      </div>
    </div>
    <p
      v-if="emailTaken"
      :id="emailErrorId"
      class="participant-form__error"
      role="alert"
      data-cy="participant-form-email-taken"
    >
      <origam-chip
        size="small"
        color="danger"
        bg-color="var(--origam-color__feedback--danger---bgSubtle)"
        :text="refusedLabel"
      />
      {{ emailTakenText }}
    </p>
    <p
      class="participant-form__rule"
      data-cy="participant-form-invitation-info"
    >
      <origam-chip
        size="small"
        color="info"
        bg-color="var(--origam-color__feedback--info---bgSubtle)"
        :text="invitationTitle"
      />
      {{ invitationText }}
    </p>
    <div class="participant-form__cta">
      <origam-btn
        variant="outlined"
        size="x-large"
        font-size="md"
        :disabled="pending"
        :text="cancelLabel"
        data-cy="participant-form-cancel"
        @click="handleCancel"
      />
      <origam-btn
        type="submit"
        class="participant-form__submit"
        variant="flat"
        bg-color="primary"
        elevation="lg"
        size="x-large"
        font-size="md"
        :loading="pending"
        :text="submitLabel"
        data-cy="participant-form-submit"
      />
    </div>
    </div>
  </origam-form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from 'vue'
import { OrigamBtn, OrigamChip, OrigamFileField, OrigamForm, OrigamLabel, OrigamTextField, OrigamTitle } from 'origam/components'
import { useT } from '~/composables/useT'
import { PARTICIPANT_AVATAR_ACCEPT, PARTICIPANT_AVATAR_MAX_BYTES } from '~/consts/admin-participants.const'
import { EMAIL_MAX_LENGTH, PHONE_PATTERN } from '~/consts/auth.const'
import { COMPETITOR_NAME_PART_MAX_LENGTH } from '~/consts/competitor.const'
import type { IParticipantCreateFormEmits, IParticipantCreateFormProps, IParticipantFormValues } from '~/interfaces/admin-participants.interface'

/*********************************************************
 * Global
 *
 * @description
 * Formulaire « Nouveau participant » (SF P1) : nom, prénom, pseudo, photo, email et téléphone (privés). La validation se
 * fait à l'envoi. La photo ne part pas dans ce formulaire : le parent la téléverse dans un second appel, une fois
 * le compétiteur créé (B-16). Le contrôle de taille et de type ne sert qu'au retour immédiat, le serveur fait foi.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IParticipantCreateFormProps>(), {})
const emits = defineEmits<IParticipantCreateFormEmits>()
defineSlots<{}>()
const titleId = useId()
const lastNameId = useId()
const firstNameId = useId()
const nicknameId = useId()
const avatarId = useId()
const emailErrorId = useId()
const emailId = useId()
const phoneId = useId()
const maxFileSize = PARTICIPANT_AVATAR_MAX_BYTES
const avatarAccept = PARTICIPANT_AVATAR_ACCEPT

/*********************************************************
 * Saisie
 *
 * @description
 * Le nom saisi dans la recherche sert de point de départ au nom de famille.
 ********************************************************/
const values = reactive<IParticipantFormValues>({
  lastName: props.initialLastName,
  firstName: '',
  nickname: '',
  email: '',
  phone: '',
  avatar: null
})
const avatar = ref<File | File[] | null>(null)
watch(() => props.initialLastName, (value) => {
  if (values.lastName.trim() === '') {
    values.lastName = value
  }
})

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()`. L'email et le téléphone sont annoncés comme privés.
 ********************************************************/
const title = computed(() => t('admin.participants.form_title', 'Nouveau participant'))
const lastNameLabel = computed(() => t('admin.participants.field_last_name', 'Nom'))
const firstNameLabel = computed(() => t('admin.participants.field_first_name', 'Prénom'))
const nicknameLabel = computed(() => t('admin.participants.field_nickname', 'Pseudo'))
const avatarLabel = computed(() => t('admin.participants.field_avatar', 'Avatar'))
const avatarHint = computed(() => t('admin.participants.field_avatar_hint', 'JPEG, PNG ou WebP, 2 Mo au plus. Facultatif.'))
const emailLabel = computed(() => t('admin.participants.field_email', 'Email · privé'))
const phoneLabel = computed(() => t('admin.participants.field_phone', 'Téléphone · privé'))
const invitationTitle = computed(() => t('admin.participants.invitation_title', 'Invitation'))
const invitationText = computed(() => t('admin.participants.invitation_text', 'Un compte est créé et un email d’invitation part aussitôt. Le lien est valable 7 jours ; un renvoi annule l’ancien.'))
const emailTakenText = computed(() => t('admin.participants.error_email_used', 'Cet email est déjà rattaché à un autre compte. Rattachez le profil existant ou corrigez l’email.'))
const cancelLabel = computed(() => t('admin.participants.form_cancel', 'Annuler'))
const submitLabel = computed(() => t('admin.participants.form_submit', 'Créer, rattacher et inviter'))
const refusedLabel = computed(() => t('admin.participants.refused', 'Refusé'))

/*********************************************************
 * Règles
 *
 * @description
 * Mêmes bornes que le serveur (nom 80 caractères, email 254, téléphone selon son motif) : le retour est immédiat, mais
 * c'est le serveur qui décide. Les messages passent par `t()`.
 ********************************************************/
const requiredText = computed(() => t('admin.participants.rule_required', 'Champ obligatoire'))
const tooLongText = computed(() => t('admin.participants.rule_too_long', 'Trop long'))
const emailText = computed(() => t('admin.participants.rule_email', 'Adresse email invalide'))
const phoneText = computed(() => t('admin.participants.rule_phone', 'Numéro de téléphone invalide'))
const nameRules = computed(() => [
  (value: string) => (value ?? '').trim() !== '' || requiredText.value,
  (value: string) => (value ?? '').trim().length <= COMPETITOR_NAME_PART_MAX_LENGTH || tooLongText.value
])
const nicknameRules = computed(() => [
  (value: string) => (value ?? '').trim().length <= COMPETITOR_NAME_PART_MAX_LENGTH || tooLongText.value
])
const emailRules = computed(() => [
  (value: string) => (value ?? '').trim() !== '' || requiredText.value,
  (value: string) => (value ?? '').trim().length <= EMAIL_MAX_LENGTH || tooLongText.value,
  (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? '').trim()) || emailText.value
])
const phoneRules = computed(() => [
  (value: string) => (value ?? '').trim() === '' || PHONE_PATTERN.test(value.trim()) || phoneText.value
])

/*********************************************************
 * Actions
 *
 * @description
 * L'événement `submit` d'`origam-form` se résout en `{ valid }` ; rien ne part tant qu'une règle échoue.
 ********************************************************/
const handleEmail = () => {
  if (props.emailTaken) {
    emits('update:email')
  }
}
const handleSubmit = async (event: Event) => {
  event.preventDefault()
  const { valid } = await (event as unknown as Promise<{ valid: boolean }>)
  if (!valid) {
    return
  }
  emits('submit', { ...values, avatar: Array.isArray(avatar.value) ? (avatar.value[0] ?? null) : avatar.value })
}
const handleCancel = () => {
  emits('cancel')
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
.participant-form {
  padding-top: var(--origam-space---4);
  border-top: var(--origam-border__width---thin) solid var(--origam-color__border---subtle);

  &__body {
    display: grid;
    gap: var(--participant-form---gap, var(--origam-space---4));
  }

  &__error {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--origam-space---2);
    margin: 0;
    font-size: var(--origam-font__size---sm);
    font-weight: var(--origam-font__weight---semibold);
    color: var(--origam-color__feedback--danger---fgSubtle);
  }

  &__rule {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--origam-space---2);
    margin: 0;
    padding: var(--origam-space---3) var(--origam-space---4);
    border-radius: var(--origam-radius---lg);
    background: var(--origam-color__feedback--info---bgSubtle);
    font-size: var(--origam-font__size---sm);
  }

  &__title {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--participant-form__grid---gap, var(--origam-space---3));
  }

  &__field {
    display: grid;
    align-content: start;
    gap: var(--origam-space---1);
    min-width: 0;
  }

  &__label {
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wide);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__cta {
    display: grid;
    grid-template-columns: 1fr minmax(max-content, 1.6fr);
    gap: var(--origam-space---3);
  }

  @media (max-width: 760px) {
    &__grid {
      grid-template-columns: 1fr;
    }

  }

  @media (max-width: 1000px) {
    &__cta {
      grid-template-columns: minmax(0, 1fr);
    }

    &__submit {
      order: -1;
    }
  }
}
</style>

<style>
:root {
  --participant-form---gap: var(--origam-space---4);
  --participant-form__grid---gap: var(--origam-space---3);
}
</style>
