<template>
  <account-state
    :tone="tone"
    :title="title"
    :text="text"
    title-id="invitation-state-title"
  >
    <template #default>
      <p
        v-if="avatarErrorText"
        class="invitation-state__error"
        role="alert"
        data-cy="invitation-avatar-error"
      >
        {{ avatarErrorText }}
      </p>
      <origam-btn
        v-if="isFailed"
        variant="outlined"
        font-size="sm"
        padding-inline="4"
        :text="retryLabel"
        data-cy="invitation-retry"
        @click="handleRetry"
      />
      <origam-btn
        v-else-if="isActivated"
        variant="flat"
        bg-color="primary"
        elevation="lg"
        :hover="actionHover"
        font-size="sm"
        padding-inline="4"
        :to="profileTo"
        :text="profileLabel"
        data-cy="invitation-profile"
      />
      <origam-btn
        v-else
        variant="outlined"
        font-size="sm"
        padding-inline="4"
        :to="homeTo"
        :text="backLabel"
        data-cy="invitation-back"
      />
    </template>
  </account-state>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { OrigamBtn } from 'origam/components'
import AccountState from '~/components/account/AccountState.vue'
import { useAccountError } from '~/composables/useAccountError'
import { useT } from '~/composables/useT'
import { ACCOUNT_SUBMIT_HOVER } from '~/consts/account.const'
import { ROUTES } from '~/consts/routes.const'
import { ACCOUNT_STATE_TONE, INVITATION_STATE } from '~/enums/account.enum'
import type { IInvitationStateEmits, IInvitationStateProps } from '~/interfaces/account.interface'

/*********************************************************
 * Global
 *
 * @description
 * Ce que voit une personne dont l'invitation ne s'affiche pas en formulaire : lien expiré ou déjà utilisé (410), lien inconnu
 * (404), vérification impossible (réseau, serveur : on peut réessayer), ou compte activé dont l'avatar n'a pas pu partir.
 * Dans ce dernier cas le jeton est consommé : on ne peut plus rien renvoyer, la carte mène au profil.
 ********************************************************/
const { t } = useT()
const props = withDefaults(defineProps<IInvitationStateProps>(), {
  activated: false,
  avatarError: null
})
const emits = defineEmits<IInvitationStateEmits>()
defineSlots<{}>()
const actionHover = ACCOUNT_SUBMIT_HOVER
const homeTo = ROUTES.HOME
const profileTo = ROUTES.PROFILE
const isFailed = computed(() => !props.activated && props.state === INVITATION_STATE.FAILED)
const isActivated = computed(() => props.activated)
const tone = computed(() => props.activated ? ACCOUNT_STATE_TONE.SUCCESS : ACCOUNT_STATE_TONE.DANGER)

/*********************************************************
 * Textes
 *
 * @description
 * Un titre et un texte par cas, pris dans les locales. L'erreur d'avatar vient s'ajouter au texte du compte activé.
 ********************************************************/
const title = computed(() => {
  if (props.activated) {
    return t('account.invitation.done_title', 'Compte activé')
  }
  if (props.state === INVITATION_STATE.GONE) {
    return t('account.invitation.gone_title', 'Lien expiré ou déjà utilisé')
  }
  if (props.state === INVITATION_STATE.UNKNOWN) {
    return t('account.invitation.unknown_title', 'Lien d’invitation inconnu')
  }
  return t('account.invitation.failed_title', 'Impossible de vérifier l’invitation')
})
const text = computed(() => {
  if (props.activated) {
    return t('account.invitation.done_text', 'Votre compte est actif. Votre avatar n’a pas pu être envoyé : vous pourrez le changer depuis votre profil.')
  }
  if (props.state === INVITATION_STATE.GONE) {
    return t('account.invitation.gone_text', 'Une invitation est valable 7 jours. Demandez à l’organisation de vous en renvoyer une : l’ancien lien ne fonctionnera plus.')
  }
  if (props.state === INVITATION_STATE.UNKNOWN) {
    return t('account.invitation.unknown_text', 'Ce lien ne correspond à aucune invitation. Vérifiez l’adresse reçue par email ou demandez-en une nouvelle à l’organisation.')
  }
  return t('account.invitation.failed_text', 'Le service ne répond pas pour le moment. Réessayez dans un instant.')
})
const avatarErrorText = useAccountError(toRef(props, 'avatarError'))
const retryLabel = computed(() => t('account.invitation.retry', 'Réessayer'))
const backLabel = computed(() => t('account.invitation.back', 'Retour au site'))
const profileLabel = computed(() => t('account.invitation.done_cta', 'Aller à mon profil'))
const handleRetry = () => {
  emits('retry')
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
.invitation-state {
  &__error {
    margin: 0;
    font-size: var(--origam-font__size---sm);
    font-weight: var(--origam-font__weight---semibold);
    color: var(--origam-color__feedback--danger---fgSubtle);
  }
}
</style>
