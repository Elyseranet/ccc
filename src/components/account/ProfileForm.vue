<template>
  <account-card labelledby="profile-title">
    <template #default>
      <div class="profile-form__header">
        <account-avatar
          :initials="initials"
          :avatar-url="avatarUrl"
        />
        <div>
          <p class="profile-form__eyebrow">
            {{ eyebrow }}
          </p>
          <origam-title
            id="profile-title"
            tag="h2"
            font-size="4xl"
            line-height="none"
            class="font-display neon--sm"
            :text="displayName"
          />
          <p
            v-if="nicknameText"
            class="profile-form__nickname"
          >
            {{ nicknameText }}
          </p>
        </div>
      </div>
      <origam-alert
        v-if="incompleteText"
        status="info"
        density="compact"
        rounded="lg"
        :text="incompleteText"
        data-cy="profile-incomplete"
      />
      <profile-readonly :me="me" />
      <p
        v-if="!hasCompetitor"
        class="profile-form__no-competitor"
        data-cy="profile-no-competitor"
      >
        <strong>{{ noCompetitorTitle }}</strong>
        {{ noCompetitorText }}
      </p>
      <origam-form
        class="profile-form__form"
        validate-on="submit"
        :aria-label="formLabel"
        data-cy="profile-form"
        @submit="handleSubmit"
      >
        <div class="profile-form__fields">
          <avatar-field
            v-if="hasCompetitor"
            field-id="profile-avatar"
            :label="avatarLabel"
            :initials="initials"
            :avatar-url="avatarUrl"
            :error="avatarError"
            :pending="avatarPending"
            removable
            @select="handleAvatar"
            @invalid="handleAvatarInvalid"
            @remove="handleRemoveAvatar"
          />
          <form-field
            v-if="hasCompetitor"
            field-id="profile-phone"
            :label="phoneLabel"
          >
            <template #default>
              <origam-text-field
                id="profile-phone"
                v-model="phone"
                type="tel"
                name="phone"
                autocomplete="tel"
                single-line
                hide-details="auto"
                :hint="phoneHint"
                :disabled="pending"
                data-cy="profile-phone"
              />
            </template>
          </form-field>
          <form-field
            field-id="profile-current-password"
            :label="currentPasswordLabel"
          >
            <template #default>
              <origam-password-field
                id="profile-current-password"
                v-model="currentPassword"
                :min-length="fieldMinLength"
                name="current-password"
                autocomplete="current-password"
                single-line
                hide-details="auto"
                :error-messages="currentPasswordMessages"
                :rules="currentPasswordRules"
                :disabled="pending"
                data-cy="profile-current-password"
              />
            </template>
          </form-field>
          <form-field
            field-id="profile-new-password"
            :label="newPasswordLabel"
          >
            <template #default>
              <origam-password-field
                id="profile-new-password"
                v-model="newPassword"
                strength-bar
                :requirement-rules="requirements"
                requirements-layout="list"
                :min-length="fieldMinLength"
                name="new-password"
                autocomplete="new-password"
                single-line
                hide-details="auto"
                :maxlength="maxLength"
                :rules="newPasswordRules"
                :disabled="pending"
                data-cy="profile-new-password"
              />
            </template>
          </form-field>
          <form-field
            field-id="profile-confirm-password"
            :label="confirmPasswordLabel"
          >
            <template #default>
              <origam-password-field
                id="profile-confirm-password"
                v-model="confirmPassword"
                :min-length="fieldMinLength"
                name="confirm-password"
                autocomplete="new-password"
                single-line
                hide-details="auto"
                :maxlength="maxLength"
                :rules="confirmPasswordRules"
                :disabled="pending"
                data-cy="profile-confirm-password"
              />
            </template>
          </form-field>
          <origam-alert
            v-if="alertText"
            status="error"
            density="compact"
            rounded="lg"
            :text="alertText"
            data-cy="profile-error"
          />
          <div class="profile-form__actions">
            <origam-btn
              type="submit"
              variant="flat"
              bg-color="primary"
              elevation="lg"
              :hover="submitHover"
              size="x-large"
              font-size="md"
              :loading="pending"
              :disabled="pending"
              :text="submitLabel"
              data-cy="profile-submit"
            />
            <origam-btn
              v-if="hasCompetitor"
              variant="outlined"
              size="x-large"
              font-size="md"
              :to="publicTo"
              :text="publicLabel"
              data-cy="profile-public"
            />
          </div>
        </div>
      </origam-form>
      <origam-divider />
      <div class="profile-form__session">
        <origam-btn
          variant="outlined"
          size="large"
          :loading="logoutPending"
          :disabled="logoutPending"
          :text="logoutLabel"
          data-cy="profile-logout"
          @click="handleLogout"
        />
        <p
          v-if="logoutFailed"
          class="profile-form__logout-error"
          role="alert"
          data-cy="profile-logout-error"
        >
          {{ logoutFailedText }}
        </p>
      </div>
    </template>
  </account-card>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamDivider, OrigamForm, OrigamPasswordField, OrigamTextField, OrigamTitle } from 'origam/components'
import AccountAvatar from '~/components/account/AccountAvatar.vue'
import AccountCard from '~/components/account/AccountCard.vue'
import AvatarField from '~/components/account/AvatarField.vue'
import ProfileReadonly from '~/components/account/ProfileReadonly.vue'
import FormField from '~/components/common/FormField.vue'
import { useAccountError } from '~/composables/useAccountError'
import { useAccountRules } from '~/composables/useAccountRules'
import { usePasswordRequirements } from '~/composables/usePasswordRequirements'
import { useT } from '~/composables/useT'
import { ACCOUNT_PASSWORD_FIELD_MIN_LENGTH, ACCOUNT_SUBMIT_HOVER, PROFILE_FIELD_MESSAGES } from '~/consts/account.const'
import { PASSWORD_MAX_LENGTH } from '~/consts/auth.const'
import { ROUTES } from '~/consts/routes.const'
import { ACCOUNT_ERROR } from '~/enums/account.enum'
import type { IFormSubmitEvent, IProfileFormEmits, IProfileFormProps } from '~/interfaces/account.interface'
import { getInitials } from '~/utils/player.util'
import { missingProfileFields } from '~/utils/profile-form.util'

/*********************************************************
 * Global
 *
 * @description
 * « Mon profil » (A4, F-10) : l'identité en lecture seule, puis ce que le participant modifie lui-même, c'est-à-dire l'avatar,
 * le téléphone et le mot de passe. L'avatar part dès qu'il est choisi (`PUT /moi/avatar`), le téléphone et le mot de passe avec
 * le bouton « Enregistrer » (`PATCH /moi`). Une bannière non bloquante dit ce qui manque au profil (pseudo, téléphone, photo), lu sur l'`IMe`. Changer le mot de passe demande l'actuel. Un compte sans fiche de joueur (un
 * administrateur) ne voit ni avatar, ni téléphone, ni lien vers une fiche publique : seul le mot de passe se change. Les champs de mot
 * de passe sont des `origam-password-field` à `min-length` 0 : Origam impose sinon sa propre longueur minimale, même à vide
 * (docs/tickets/origam/password-field-regle-longueur-forcee.md) ; la longueur passe par nos `rules`, et le mot de passe reste facultatif. Le composant
 * ne connaît ni l'API ni la navigation.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IProfileFormProps>(), {
  pending: false,
  error: null,
  avatarError: null,
  avatarPending: false
})
const emits = defineEmits<IProfileFormEmits>()
defineSlots<{}>()
const submitHover = ACCOUNT_SUBMIT_HOVER
const fieldMinLength = ACCOUNT_PASSWORD_FIELD_MIN_LENGTH
const requirements = usePasswordRequirements()
const maxLength = PASSWORD_MAX_LENGTH
const competitor = computed(() => props.me.competitor)
const hasCompetitor = computed(() => competitor.value !== null)
const displayName = computed(() => competitor.value?.displayName ?? props.me.email)
const initials = computed(() => getInitials(displayName.value))
const avatarUrl = computed(() => competitor.value?.avatarUrl ?? null)
const publicTo = computed(() => competitor.value ? `${ROUTES.PLAYERS}/${encodeURIComponent(competitor.value.id)}` : ROUTES.PLAYERS)
const missing = computed(() => missingProfileFields(props.me))
const incompleteText = computed(() => missing.value.length === 0
  ? ''
  : t('account.profile.incomplete', 'Profil incomplet : il manque {fields}.', {
    fields: missing.value.map(field => t(PROFILE_FIELD_MESSAGES[field].key, PROFILE_FIELD_MESSAGES[field].label)).join(', ')
  }))
const eyebrow = computed(() => t('account.profile.eyebrow', 'Mon profil'))
const nicknameText = computed(() => competitor.value?.nickname ? t('account.profile.nickname_value', '« {nickname} »', { nickname: competitor.value.nickname }) : '')
const noCompetitorTitle = computed(() => t('account.profile.no_competitor_title', 'Compte sans fiche de joueur'))
const noCompetitorText = computed(() => t('account.profile.no_competitor_text', 'Ce compte n’est lié à aucune fiche de joueur : seul le mot de passe peut être modifié ici.'))
const formLabel = computed(() => t('account.profile.form_label', 'Modifier mon profil'))
const submitLabel = computed(() => t('account.profile.submit', 'Enregistrer'))
const publicLabel = computed(() => t('account.profile.public_page', 'Voir ma fiche publique'))
const phoneHint = computed(() => t('account.profile.phone_hint', 'Privé, jamais public'))
const avatarLabel = { key: 'account.avatar.change', fallback: 'Changer d’avatar' }
const phoneLabel = { key: 'account.profile.phone', fallback: 'Téléphone · privé' }
const newPasswordLabel = { key: 'account.profile.new_password', fallback: 'Nouveau mot de passe' }
const currentPasswordLabel = { key: 'account.profile.current_password', fallback: 'Mot de passe actuel' }
const confirmPasswordLabel = { key: 'account.profile.confirm_password', fallback: 'Confirmer le nouveau mot de passe' }
const logoutLabel = computed(() => t('account.profile.logout', 'Se déconnecter'))
const logoutFailedText = computed(() => t('account.profile.logout_failed', 'La déconnexion a échoué. Vous êtes peut-être toujours connecté·e : réessayez.'))

/*********************************************************
 * Saisie
 *
 * @description
 * Le téléphone part du compte et suit ses mises à jour (l'enregistrement le remplace par la réponse du serveur). Les mots de passe
 * se vident après un enregistrement réussi, jamais en cas d'échec : on ne fait pas retaper un mot de passe refusé.
 * `handleSubmit` appelle `preventDefault` avant tout `await` : sinon `origam-form` soumet le formulaire nativement après la validation,
 * ce qui recharge la page et abandonne l'appel en cours.
 ********************************************************/
const rules = useAccountRules()
const phone = ref(competitor.value?.phone ?? '')
const newPassword = ref('')
const confirmPassword = ref('')
const currentPassword = ref('')
const newPasswordRules = [rules.passwordLength]
const currentPasswordRules = [rules.currentPasswordRequired(() => newPassword.value)]
const confirmPasswordRules = [rules.sameAs(() => newPassword.value)]
const errorText = useAccountError(toRef(props, 'error'))
const isCurrentPasswordError = computed(() => props.error === ACCOUNT_ERROR.INVALID_CURRENT_PASSWORD)
const currentPasswordMessages = computed(() => isCurrentPasswordError.value && errorText.value ? [errorText.value] : [])
const alertText = computed(() => isCurrentPasswordError.value ? null : errorText.value)
watch(() => competitor.value?.phone, (value) => {
  phone.value = value ?? ''
})
const handleSubmit = async (event: IFormSubmitEvent) => {
  event.preventDefault()
  const { valid } = await event
  if (valid) {
    emits('submit', { phone: phone.value.trim() || null, currentPassword: currentPassword.value, newPassword: newPassword.value })
  }
}

/*********************************************************
 * Avatar
 *
 * @description
 * Relais vers le parent : il envoie le fichier ou retire l'avatar, puis relit le compte.
 ********************************************************/
const handleAvatar = (file: File) => {
  emits('avatar', file)
}
const handleAvatarInvalid = (reason: ACCOUNT_ERROR) => {
  emits('avatar-invalid', reason)
}
const handleRemoveAvatar = () => {
  emits('remove-avatar')
}
const handleLogout = () => {
  emits('logout')
}

/*********************************************************
 * Expose
 *
 * @description
 * `clearPasswords` vide les deux champs de mot de passe, à appeler par le parent après un enregistrement réussi.
 ********************************************************/
const clearPasswords = () => {
  newPassword.value = ''
  confirmPassword.value = ''
  currentPassword.value = ''
}
defineExpose({ clearPasswords })
</script>

<style scoped lang="scss">
.profile-form {
  &__header {
    display: flex;
    align-items: center;
    gap: var(--profile-form---header-gap, var(--origam-space---5));
  }

  &__eyebrow {
    margin: 0;
    font-size: var(--origam-font__size---xs);
    font-weight: var(--origam-font__weight---bold);
    letter-spacing: var(--origam-font__letterSpacing---wider);
    text-transform: uppercase;
    color: var(--origam-color__text---tertiary);
  }

  &__nickname {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__no-competitor {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__form {
    margin-top: var(--origam-space---2);
  }

  &__fields {
    display: grid;
    gap: var(--profile-form---gap, var(--origam-space---4));
  }

  &__session {
    display: grid;
    justify-items: start;
    gap: var(--profile-form__session---gap, var(--origam-space---3));
  }

  &__logout-error {
    margin: 0;
    font-size: var(--origam-font__size---sm);
    font-weight: var(--origam-font__weight---semibold);
    color: var(--origam-color__feedback--danger---fgSubtle);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--profile-form__actions---gap, var(--origam-space---3));
  }
}
</style>

<style>
:root {
  --profile-form---header-gap: var(--origam-space---5);
  --profile-form---gap: var(--origam-space---4);
  --profile-form__actions---gap: var(--origam-space---3);
}
</style>
