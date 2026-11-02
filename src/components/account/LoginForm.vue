<template>
  <account-card labelledby="login-title">
    <template #default>
      <origam-title
        id="login-title"
        tag="h2"
        font-size="4xl"
        line-height="none"
        class="font-display neon--sm"
        :text="title"
      />
      <p class="login-form__intro">
        {{ intro }}
      </p>
      <origam-form
        class="login-form__form"
        validate-on="submit"
        :aria-label="title"
        data-cy="login-form"
        @submit="handleSubmit"
      >
        <div class="login-form__fields">
          <form-field
            field-id="login-email"
            :label="emailLabel"
          >
            <template #default>
              <origam-text-field
                id="login-email"
                v-model="email"
                type="email"
                name="email"
                autocomplete="email"
                single-line
                hide-details="auto"
                :rules="emailRules"
                :disabled="pending"
                data-cy="login-email"
              />
            </template>
          </form-field>
          <form-field
            field-id="login-password"
            :label="passwordLabel"
          >
            <template #default>
              <origam-password-field
                id="login-password"
                v-model="password"
                :min-length="fieldMinLength"
                name="password"
                autocomplete="current-password"
                single-line
                hide-details="auto"
                :rules="passwordRules"
                :disabled="pending"
                data-cy="login-password"
              />
            </template>
          </form-field>
          <origam-alert
            v-if="errorText"
            status="error"
            density="compact"
            rounded="lg"
            :text="errorText"
            data-cy="login-error"
          />
          <origam-btn
            type="submit"
            variant="flat"
            bg-color="primary"
            elevation="lg"
            :hover="submitHover"
            size="x-large"
            font-size="md"
            class="login-form__submit"
            :loading="pending"
            :disabled="pending"
            :text="submitLabel"
            data-cy="login-submit"
          />
        </div>
      </origam-form>
    </template>
  </account-card>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamForm, OrigamPasswordField, OrigamTextField, OrigamTitle } from 'origam/components'
import AccountCard from '~/components/account/AccountCard.vue'
import FormField from '~/components/common/FormField.vue'
import { useAccountError } from '~/composables/useAccountError'
import { useAccountRules } from '~/composables/useAccountRules'
import { useT } from '~/composables/useT'
import { ACCOUNT_PASSWORD_FIELD_MIN_LENGTH, ACCOUNT_SUBMIT_HOVER } from '~/consts/account.const'
import type { IFormSubmitEvent, ILoginFormEmits, ILoginFormProps } from '~/interfaces/account.interface'

/*********************************************************
 * Global
 *
 * @description
 * Formulaire de connexion (`POST /auth/login`) : email et mot de passe, validés à l'envoi. L'erreur du serveur (identifiants
 * invalides, ralentissement) s'affiche dans une alerte annoncée ; le message reste volontairement le même pour un email inconnu
 * et un mauvais mot de passe. Le composant ne connaît ni l'API ni la navigation : il émet `submit` et le parent agit.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<ILoginFormProps>(), {
  pending: false,
  error: null
})
const emits = defineEmits<ILoginFormEmits>()
defineSlots<{}>()
const submitHover = ACCOUNT_SUBMIT_HOVER
const fieldMinLength = ACCOUNT_PASSWORD_FIELD_MIN_LENGTH
const title = computed(() => t('account.login.title', 'Connexion'))
const intro = computed(() => t('account.login.intro', 'Pour les participants et l’organisation.'))
const emailLabel = { key: 'account.login.email', fallback: 'Email' }
const passwordLabel = { key: 'account.login.password', fallback: 'Mot de passe' }
const submitLabel = computed(() => t('account.login.submit', 'Se connecter'))

/*********************************************************
 * Saisie
 *
 * @description
 * Les règles de la connexion ne contrôlent que la présence et la forme de l'email : la force du mot de passe se juge à sa
 * création, jamais à la connexion (un ancien mot de passe doit rester utilisable).
 * `handleSubmit` appelle `preventDefault` avant tout `await` : sinon `origam-form` soumet le formulaire nativement après la validation,
 * ce qui recharge la page et abandonne l'appel en cours.
 ********************************************************/
const rules = useAccountRules()
const email = ref('')
const password = ref('')
const emailRules = [rules.required, rules.email]
const passwordRules = [rules.required]
const errorText = useAccountError(toRef(props, 'error'))
const handleSubmit = async (event: IFormSubmitEvent) => {
  event.preventDefault()
  const { valid } = await event
  if (valid) {
    emits('submit', { email: email.value.trim(), password: password.value })
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
.login-form {
  &__intro {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }

  &__form {
    margin-top: var(--origam-space---2);
  }

  &__fields {
    display: grid;
    gap: var(--login-form---gap, var(--origam-space---4));
  }

  &__submit {
    justify-self: start;
  }
}
</style>

<style>
:root {
  --login-form---gap: var(--origam-space---4);
}
</style>
