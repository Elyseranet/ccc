<template>
  <account-card labelledby="invitation-title">
    <template #default>
      <origam-chip
        color="secondary"
        bg-color="secondary"
        size="small"
        pill
        class="invitation-form__chip"
        :text="chipText"
        data-cy="invitation-chip"
      />
      <origam-title
        id="invitation-title"
        tag="h2"
        font-size="4xl"
        line-height="none"
        class="font-display neon--sm"
        :text="title"
      />
      <p class="invitation-form__intro">
        {{ intro }}
      </p>
      <origam-form
        class="invitation-form__form"
        validate-on="submit"
        :aria-label="title"
        data-cy="invitation-form"
        @submit="handleSubmit"
      >
        <div class="invitation-form__fields">
          <form-field
            field-id="invitation-password"
            :label="passwordLabel"
          >
            <template #default>
              <origam-password-field
                id="invitation-password"
                v-model="password"
                name="new-password"
                autocomplete="new-password"
                aria-describedby="invitation-hint"
                single-line
                hide-details="auto"
                strength-bar
                :requirement-rules="requirements"
                requirements-layout="list"
                :min-length="fieldMinLength"
                :maxlength="maxLength"
                :rules="passwordRules"
                :disabled="pending"
                data-cy="invitation-password"
              />
            </template>
          </form-field>
          <form-field
            field-id="invitation-confirm"
            :label="confirmLabel"
          >
            <template #default>
              <origam-password-field
                id="invitation-confirm"
                v-model="confirmation"
                name="confirm-password"
                autocomplete="new-password"
                single-line
                hide-details="auto"
                :min-length="fieldMinLength"
                :rules="confirmRules"
                :disabled="pending"
                data-cy="invitation-confirm"
              />
            </template>
          </form-field>
          <p
            id="invitation-hint"
            class="invitation-form__hint"
          >
            {{ hint }}
          </p>
          <avatar-field
            field-id="invitation-avatar"
            :label="avatarLabel"
            :initials="initials"
            :error="localAvatarError"
            :pending="pending"
            @select="handleAvatar"
            @invalid="handleAvatarInvalid"
          />
          <form-field
            field-id="invitation-phone"
            :label="phoneLabel"
          >
            <template #default>
              <origam-text-field
                id="invitation-phone"
                v-model="phone"
                type="tel"
                name="phone"
                autocomplete="tel"
                single-line
                hide-details="auto"
                :disabled="pending"
                data-cy="invitation-phone"
              />
            </template>
          </form-field>
          <origam-alert
            v-if="errorText"
            status="error"
            density="compact"
            rounded="lg"
            :text="errorText"
            data-cy="invitation-error"
          />
          <p
            v-if="hasLegalLinks"
            class="invitation-form__legal"
            data-cy="invitation-legal"
          >
            <template
              v-for="link in legalLinks"
              :key="link.to"
            >
              <span
                v-if="link.separated"
                aria-hidden="true"
              >{{ separator }}</span>
              <nuxt-link
                :to="link.to"
                class="invitation-form__legal-link"
                :data-cy="`invitation-legal-${link.to}`"
              >
                {{ link.text }}
              </nuxt-link>
            </template>
          </p>
          <origam-btn
            type="submit"
            variant="flat"
            bg-color="primary"
            elevation="lg"
            :hover="submitHover"
            size="x-large"
            font-size="md"
            class="invitation-form__submit"
            :loading="pending"
            :disabled="pending"
            :text="submitLabel"
            data-cy="invitation-submit"
          />
        </div>
      </origam-form>
    </template>
  </account-card>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamChip, OrigamForm, OrigamPasswordField, OrigamTextField, OrigamTitle } from 'origam/components'
import AccountCard from '~/components/account/AccountCard.vue'
import AvatarField from '~/components/account/AvatarField.vue'
import FormField from '~/components/common/FormField.vue'
import { useAccountError } from '~/composables/useAccountError'
import { useAccountRules } from '~/composables/useAccountRules'
import { usePasswordRequirements } from '~/composables/usePasswordRequirements'
import { useT } from '~/composables/useT'
import { ACCOUNT_PASSWORD_FIELD_MIN_LENGTH, ACCOUNT_SUBMIT_HOVER } from '~/consts/account.const'
import { PASSWORD_MAX_LENGTH } from '~/consts/auth.const'
import { LEGAL_LINKS_SEPARATOR } from '~/consts/legal.const'
import { INVITATION_LEGAL_NAVIGATION } from '~/consts/public-navigation.const'
import type { ACCOUNT_ERROR } from '~/enums/account.enum'
import type { IFormSubmitEvent, IInvitationFormEmits, IInvitationFormProps } from '~/interfaces/account.interface'

/*********************************************************
 * Global
 *
 * @description
 * Première connexion depuis l'invitation (A14, B-09) : mot de passe (15 caractères au moins, avec barre de force et exigences
 * toujours visibles), confirmation, avatar et téléphone facultatifs. Le lien ne sert qu'une fois. L'avatar choisi n'est pas
 * envoyé ici : il part avec l'activation, par le parent, une fois le compte ouvert. Le composant émet `submit` et ne connaît
 * ni l'API ni la navigation.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IInvitationFormProps>(), {
  pending: false,
  error: null
})
const emits = defineEmits<IInvitationFormEmits>()
defineSlots<{}>()
const submitHover = ACCOUNT_SUBMIT_HOVER
const requirements = usePasswordRequirements()
const fieldMinLength = ACCOUNT_PASSWORD_FIELD_MIN_LENGTH
const maxLength = PASSWORD_MAX_LENGTH
const chipText = computed(() => t('account.invitation.chip', 'Invitation · valable 7 jours'))
const title = computed(() => t('account.invitation.title', 'Bienvenue au CCC'))
const intro = computed(() => t('account.invitation.intro', 'L’organisation vous a inscrit·e. Choisissez votre mot de passe, ajoutez une photo et votre téléphone si vous le souhaitez.'))
const hint = computed(() => t('account.invitation.hint', 'Le lien ne sert qu’une fois.'))
const submitLabel = computed(() => t('account.invitation.submit', 'Activer mon compte'))
const separator = ` ${LEGAL_LINKS_SEPARATOR} `
const legalLinks = computed(() => INVITATION_LEGAL_NAVIGATION.map((item, index) => ({
  to: item.to,
  text: t(item.key, item.label),
  separated: index > 0
})))
const hasLegalLinks = computed(() => legalLinks.value.length > 0)
const passwordLabel = { key: 'account.invitation.password', fallback: 'Mot de passe' }
const confirmLabel = { key: 'account.invitation.confirm', fallback: 'Confirmer le mot de passe' }
const avatarLabel = { key: 'account.invitation.avatar', fallback: 'Avatar' }
const phoneLabel = { key: 'account.invitation.phone', fallback: 'Téléphone · facultatif, jamais public' }

/*********************************************************
 * Saisie
 *
 * @description
 * Le mot de passe est obligatoire à l'activation ; la confirmation doit lui être identique. Le serveur revalide la longueur
 * (B-08) et reste l'autorité. L'erreur de validation d'un avatar refusé localement (taille, type) est locale ; celle du
 * serveur arrive par `error`.
 * `handleSubmit` appelle `preventDefault` avant tout `await` : sinon `origam-form` soumet le formulaire nativement après la validation,
 * ce qui recharge la page et abandonne l'appel en cours.
 ********************************************************/
const rules = useAccountRules()
const password = ref('')
const confirmation = ref('')
const phone = ref('')
const avatar = ref<File | null>(null)
const localAvatarError = ref<ACCOUNT_ERROR | null>(null)
const passwordRules = [rules.required, rules.passwordLength]
const confirmRules = [rules.required, rules.sameAs(() => password.value)]
const errorText = useAccountError(toRef(props, 'error'))
const handleAvatar = (file: File) => {
  avatar.value = file
  localAvatarError.value = null
}
const handleAvatarInvalid = (reason: ACCOUNT_ERROR) => {
  avatar.value = null
  localAvatarError.value = reason
}
const handleSubmit = async (event: IFormSubmitEvent) => {
  event.preventDefault()
  const { valid } = await event
  if (valid) {
    emits('submit', { password: password.value, phone: phone.value.trim() || null, avatar: avatar.value })
  }
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
.invitation-form {
  &__chip {
    justify-self: start;
  }

  &__intro {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__form {
    margin-top: var(--origam-space---2);
  }

  &__fields {
    display: grid;
    gap: var(--invitation-form---gap, var(--origam-space---4));
  }

  &__hint {
    margin: calc(-1 * var(--origam-space---2)) 0 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  &__legal {
    margin: calc(-1 * var(--origam-space---2)) 0 0;
    font-size: var(--origam-font__size---sm);
    color: var(--origam-color__text---secondary);
  }

  &__legal-link {
    color: inherit;
    text-decoration: underline;
  }

  &__submit {
    justify-self: start;
  }
}
</style>

<style>
:root {
  --invitation-form---gap: var(--origam-space---4);
}
</style>
