<template>
  <origam-card
    tag="section"
    class="account-block"
    rounded="xl"
    border
    elevation="md"
    :aria-labelledby="titleId"
    data-cy="competitor-account"
  >
    <header class="account-block__head">
      <p class="account-block__eyebrow">
        {{ eyebrow }}
      </p>
      <origam-title
        :id="titleId"
        tag="h2"
        class="account-block__title"
        font-size="xl"
        font-weight="bold"
        line-height="tight"
        letter-spacing="normal"
        :text="title"
      />
    </header>
    <div
      class="account-block__state"
      data-cy="competitor-account-state"
      :data-status="status"
    >
      <origam-chip
        size="small"
        :color="chip.color"
        :bg-color="chip.bgColor"
        :text="chip.label"
      />
      <span>{{ stateText }}</span>
    </div>
    <origam-form
      v-if="!isActive"
      class="account-block__form"
      validate-on="submit"
      :aria-labelledby="titleId"
      data-cy="competitor-account-form"
      @submit="handleSubmit"
    >
      <div class="account-block__fields">
        <account-email-field
          ref="fieldRef"
          v-model="email"
          cy-prefix="competitor-account"
          :taken="emailTaken"
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
          data-cy="competitor-account-error"
        />
        <div class="account-block__cta">
          <origam-btn
            type="submit"
            variant="flat"
            :bg-color="buttonColor"
            :elevation="buttonElevation"
            size="x-large"
            font-size="md"
            :loading="pending"
            :text="submitLabel"
            data-cy="competitor-account-submit"
          />
        </div>
      </div>
    </origam-form>
    <p
      v-else
      class="account-block__readonly"
      data-cy="competitor-account-readonly"
    >
      {{ readOnlyText }}
    </p>
    <origam-snackbar
      :model-value="feedback !== null"
      :status="feedback?.status"
      location="bottom"
      :timeout="snackbarTimeout"
      :text="feedbackText"
      data-cy="competitor-account-feedback"
      @update:model-value="handleFeedbackOpen"
    />
  </origam-card>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard, OrigamChip, OrigamForm, OrigamSnackbar, OrigamTitle } from 'origam/components'
import AccountEmailField from '~/components/admin/competitors/AccountEmailField.vue'
import { usePrimaryActionButton } from '~/composables/usePrimaryActionButton'
import { useT } from '~/composables/useT'
import { ADMIN_SNACKBAR_TIMEOUT_MS } from '~/consts/admin-feedback.const'
import { PARTICIPANT_ACCOUNT_CHIPS, PARTICIPANT_NO_ACCOUNT_TEXT } from '~/consts/admin-participants.const'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import { ACCOUNT_STATE, COMPETITOR_ACCOUNT_STATUS } from '~/enums/user.enum'
import type { ICompetitorAccountBlockEmits, ICompetitorAccountBlockProps } from '~/interfaces/admin-competitors.interface'
import { formatInvitationExpiry } from '~/utils/admin-competitors.util'

/*********************************************************
 * Global
 *
 * @description
 * Bloc « Compte » de la fiche compétiteur admin (F-62, B-29) : l'état (aucun compte, invitation envoyée avec sa date d'expiration, actif),
 * la saisie de l'email et « Envoyer l'invitation » (sans compte) ou « Corriger et renvoyer » (invité ; l'ancien lien est annulé).
 * Un compte actif est en lecture seule : c'est le joueur qui gère son email (409 côté serveur). Retours : snackbar (envoyée, ou compte créé
 * mais mail non parti) et alerte sous le champ (email pris, compte actif…).
 * shortcut: `.account-block__fields` porte le `gap` (16 px, celui du reste de la carte) que `origam-form` ne transmet pas à son
 * enveloppe `__content` (F-63b) ; à retirer quand origam expose `contentDisplay` sur Form (version non publiée au 2026-11-18).
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<ICompetitorAccountBlockProps>(), { pending: false, failure: null, feedback: null })
const emits = defineEmits<ICompetitorAccountBlockEmits>()
defineSlots<{}>()
const titleId = useId()
const snackbarTimeout = ADMIN_SNACKBAR_TIMEOUT_MS
const fieldRef = ref<{ validate: () => boolean } | null>(null)

/*********************************************************
 * État du compte
 *
 * @description
 * Sans détail de compte (lecture non administrateur), la fiche est traitée comme « aucun compte ». Une invitation échue est dite expirée.
 ********************************************************/
const status = computed(() => props.account?.status ?? COMPETITOR_ACCOUNT_STATUS.NONE)
const isActive = computed(() => status.value === COMPETITOR_ACCOUNT_STATUS.ACTIVE)
const isInvited = computed(() => status.value === COMPETITOR_ACCOUNT_STATUS.INVITED)
const expiry = computed(() => props.account?.invitationExpiresAt ?? null)
const isExpired = computed(() => isInvited.value && expiry.value !== null && new Date(expiry.value).getTime() < Date.now())
const chip = computed(() => {
  if (status.value === COMPETITOR_ACCOUNT_STATUS.NONE) {
    return { color: 'secondary', bgColor: 'secondary', label: t(PARTICIPANT_NO_ACCOUNT_TEXT.key, PARTICIPANT_NO_ACCOUNT_TEXT.fallback) }
  }
  const known = PARTICIPANT_ACCOUNT_CHIPS[isExpired.value ? ACCOUNT_STATE.INVITATION_EXPIRED : (isActive.value ? ACCOUNT_STATE.ACTIVE : ACCOUNT_STATE.INVITED)]
  return { color: known.color, bgColor: known.bgColor, label: t(known.text.key, known.text.fallback) }
})
const emailText = computed(() => props.account?.email ?? '')
const stateText = computed(() => {
  if (isActive.value) {
    return t('admin.account.state_active', 'Le joueur a activé son compte.')
  }
  if (isInvited.value && expiry.value) {
    return isExpired.value
      ? t('admin.account.state_expired', 'Invitation envoyée à {email}, expirée le {date}.', { email: emailText.value, date: formatInvitationExpiry(expiry.value) })
      : t('admin.account.state_invited', 'Invitation envoyée à {email}, valable jusqu’au {date}.', { email: emailText.value, date: formatInvitationExpiry(expiry.value) })
  }
  return t('admin.account.state_none', 'Ce joueur n’a pas de compte : saisissez son email pour lui envoyer une invitation.')
})
const readOnlyText = computed(() => t('admin.account.readonly', 'Email du compte : {email}. Le joueur le gère lui-même, il n’est pas modifiable ici.', { email: emailText.value }))

/*********************************************************
 * Saisie
 *
 * @description
 * L'email d'un invité est pré-rempli pour être corrigé ; il suit la fiche quand elle se recharge.
 ********************************************************/
const email = ref(props.account?.email ?? '')
watch(() => props.account?.email, (value) => {
  email.value = value ?? ''
})
const emailTaken = computed(() => props.failure?.code === API_ERROR_CODE.EMAIL_ALREADY_USED)
const handleSubmit = async (event: Event) => {
  event.preventDefault()
  if (props.pending || !fieldRef.value?.validate()) {
    return
  }
  emits('submit', email.value)
}

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()`.
 ********************************************************/
const eyebrow = computed(() => t('admin.account.eyebrow', 'Compte'))
const title = computed(() => t('admin.account.title', 'Compte et invitation'))
const submitLabel = computed(() => isInvited.value
  ? t('admin.account.submit_correct', 'Corriger et renvoyer')
  : t('admin.account.submit_invite', 'Envoyer l’invitation'))
const failureTitle = computed(() => props.failure ? t(props.failure.title.key, props.failure.title.fallback, props.failure.title.params) : '')
const failureText = computed(() => props.failure ? t(props.failure.text.key, props.failure.text.fallback, props.failure.text.params) : '')
const feedbackText = computed(() => props.feedback ? t(props.feedback.message.key, props.feedback.message.fallback, props.feedback.message.params) : '')
const handleFeedbackOpen = (open: boolean) => {
  if (!open) {
    emits('dismiss')
  }
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
.account-block {
  display: grid;
  gap: var(--account-block---gap, var(--origam-space---4));
  padding: var(--account-block---padding, var(--origam-space---6));

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

  &__state {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--origam-space---2);
    margin: 0;
  }

  &__readonly {
    margin: 0;
    color: var(--origam-color__text---secondary);
    overflow-wrap: anywhere;
  }

  &__form,
  &__fields {
    display: grid;
    gap: var(--account-block---gap, var(--origam-space---4));
  }

  &__cta {
    display: flex;
    justify-content: flex-end;
  }

  @media (max-width: 760px) {
    padding: var(--origam-space---5);
  }
}
</style>

<style>
:root {
  --account-block---gap: var(--origam-space---4);
  --account-block---padding: var(--origam-space---6);
}
</style>
