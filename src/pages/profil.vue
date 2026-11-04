<template>
  <account-layout>
    <template #main>
      <profile-form
        v-if="me"
        ref="form"
        :me="me"
        :pending="pending"
        :error="error"
        :avatar-error="avatarError"
        :avatar-pending="avatarPending"
        :logout-pending="logoutPending"
        :logout-failed="logoutFailed"
        @submit="handleSubmit"
        @avatar="handleAvatar"
        @avatar-invalid="handleAvatarInvalid"
        @remove-avatar="handleRemoveAvatar"
        @logout="handleLogout"
      />
    </template>
    <template #side>
      <div
        class="profile-page__side"
        aria-live="polite"
        data-cy="profile-side"
      >
        <account-state
          v-if="saved"
          :tone="successTone"
          :title="savedTitle"
          :text="savedText"
          title-id="profile-saved-title"
        />
      </div>
    </template>
  </account-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AccountLayout from '~/components/account/AccountLayout.vue'
import AccountState from '~/components/account/AccountState.vue'
import ProfileForm from '~/components/account/ProfileForm.vue'
import { useLogout } from '~/composables/useLogout'
import { useProfile } from '~/composables/useProfile'
import { useT } from '~/composables/useT'
import { ACCOUNT_STATE_TONE } from '~/enums/account.enum'
import type { ACCOUNT_ERROR } from '~/enums/account.enum'

/*********************************************************
 * Page
 *
 * @description
 * « Mon profil » (F-10, FA-06) : réservé à un compte connecté (middleware `authenticated`, l'état connecté venant de `GET /moi`).
 * Toute la logique est dans `useProfile`. La déconnexion est aussi dans l'en-tête public (décision UX) ; ici elle est répétée
 * en bas de la carte, hors du formulaire.
 ********************************************************/
definePageMeta({ layout: 'default', middleware: 'authenticated' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const title = computed(() => t('pages.profile.title', 'Mon profil'))
useHead({ title })
const successTone = ACCOUNT_STATE_TONE.SUCCESS
const savedTitle = computed(() => t('account.profile.saved_title', 'Profil enregistré'))
const savedText = computed(() => t('account.profile.saved_text', 'Votre fiche publique n’affiche jamais votre email ni votre téléphone.'))

/*********************************************************
 * Profil
 *
 * @description
 * La page branche le composable sur le formulaire. Les champs de mot de passe se vident après un enregistrement réussi.
 ********************************************************/
const { me, save, saved, pending, error, uploadAvatar, removeAvatar, rejectAvatar, avatarPending, avatarError } = useProfile()
const form = ref<InstanceType<typeof ProfileForm> | null>(null)
const handleSubmit = async (values: { phone: string | null, currentPassword: string, newPassword: string }) => {
  if (await save(values)) {
    form.value?.clearPasswords()
  }
}
const handleAvatar = (file: File) => {
  uploadAvatar(file)
}
const handleAvatarInvalid = (reason: ACCOUNT_ERROR) => {
  rejectAvatar(reason)
}
const handleRemoveAvatar = () => {
  removeAvatar()
}

/*********************************************************
 * Déconnexion
 *
 * @description
 * `useLogout` renvoie vers l'accueil. En cas d'échec réseau ou serveur, la session locale reste et l'écran le dit.
 ********************************************************/
const { logout, pending: logoutPending, failed: logoutFailed } = useLogout()
const handleLogout = () => {
  logout()
}

/*********************************************************
 * Expose
 *
 * @description
 * Une page n'expose rien à un parent.
 ********************************************************/
defineExpose({})
</script>

<style scoped lang="scss">
.profile-page {
  &__side {
    display: grid;
    gap: var(--profile-page---gap, var(--origam-space---4));
    justify-items: start;
  }
}
</style>

<style>
:root {
  --profile-page---gap: var(--origam-space---4);
}
</style>
