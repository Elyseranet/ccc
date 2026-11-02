<template>
  <account-layout :narrow="isState">
    <template #main>
      <invitation-form
        v-if="!isState"
        :pending="pending"
        :error="error"
        :initials="initials"
        @submit="handleSubmit"
      />
      <invitation-state
        v-else
        :state="state"
        :activated="activated"
        :avatar-error="avatarError"
        @retry="retry"
      />
    </template>
  </account-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AccountLayout from '~/components/account/AccountLayout.vue'
import InvitationForm from '~/components/account/InvitationForm.vue'
import InvitationState from '~/components/account/InvitationState.vue'
import { useInvitation } from '~/composables/useInvitation'
import { useT } from '~/composables/useT'
import { INVITATION_STATE } from '~/enums/account.enum'
import { getInitials } from '~/utils/player.util'

/*********************************************************
 * Page
 *
 * @description
 * Première connexion par invitation (F-10) : le lien est vérifié avant tout. Valide, il affiche le formulaire ; expiré ou
 * consommé (410), inconnu (404) ou invérifiable, il affiche une carte d'état. Le jeton vient de l'URL, il n'est ni journalisé
 * ni stocké dans le navigateur. La page est rendue côté serveur : le visiteur n'a jamais un formulaire qui s'ouvre sur un lien mort.
 ********************************************************/
definePageMeta({ layout: 'default' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const title = computed(() => t('pages.invitation.title', 'Invitation'))
useHead({ title })

/*********************************************************
 * Invitation
 *
 * @description
 * Le jeton est lu une fois, au montage de la page : la route ne change pas de jeton sans recharger la page.
 ********************************************************/
const route = useRoute()
const { state, preview, pending, error, activated, avatarError, activate, retry } = await useInvitation(String(route.params.jeton))
const isReady = computed(() => state.value === INVITATION_STATE.READY)
const isState = computed(() => !isReady.value || activated.value)
const initials = computed(() => getInitials(preview.value?.nickname ?? preview.value?.firstName ?? ''))
const handleSubmit = (values: { password: string, phone: string | null, avatar: File | null }) => {
  activate(values)
}

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>
