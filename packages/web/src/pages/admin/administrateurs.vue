<template>
  <div
    class="admin-administrators"
    data-cy="admin-administrators"
  >
    <header class="admin-administrators__head">
      <div class="admin-administrators__heading">
        <p class="admin-administrators__eyebrow">
          {{ eyebrow }}
        </p>
        <origam-title
          tag="h1"
          class="admin-administrators__title font-display neon--sm"
          data-cy="page-title"
          :text="title"
        />
      </div>
    </header>
    <div class="admin-administrators__grid">
      <div class="admin-administrators__main">
        <async-state
          v-if="showState"
          :pending="isLoading"
          :error="listError"
          @retry="handleReload"
        />
        <administrator-list
          v-else
          :administrators="administrators"
          :pending="pending"
          :busy="busy"
          @resend="handleResend"
          @fix="handleFix"
          @revoke="handleRevoke"
        />
        <origam-alert
          v-if="actionFailure"
          status="error"
          rounded="lg"
          density="compact"
          :text="actionFailureText"
          data-cy="administrator-action-error"
        >
          <template #close>
            <origam-btn
              variant="outlined"
              size="small"
              :text="reloadLabel"
              data-cy="administrator-reload"
              @click="handleActionReload"
            />
          </template>
        </origam-alert>
      </div>
      <administrator-invite-card
        v-model="inviteEmail"
        :pending="busy"
        :failure="inviteFailure"
        @submit="handleInvite"
      />
    </div>
    <administrator-fix-dialog
      :open="fixOpen"
      :account="fixAccount"
      :pending="busy"
      :failure="fixFailure"
      @cancel="handleFixCancel"
      @submit="handleFixSubmit"
    />
    <confirm-dialog
      :open="revokeOpen"
      :busy="busy"
      :title="revokeTitle"
      :text="revokeText"
      :cancel-label="cancelLabel"
      :confirm-label="revokeLabel"
      :appearance="dialogAppearance"
      cy-prefix="administrator-revoke"
      @cancel="handleRevokeCancel"
      @confirm="handleRevokeConfirm"
    />
    <origam-snackbar
      :model-value="feedbackOpen"
      :text="feedbackText"
      :status="feedbackStatus"
      location="bottom"
      :timeout="snackbarTimeout"
      data-cy="administrator-feedback"
      @update:model-value="handleFeedbackOpen"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamSnackbar, OrigamTitle } from 'origam/components'
import AdministratorFixDialog from '~/components/admin/administrators/AdministratorFixDialog.vue'
import AdministratorInviteCard from '~/components/admin/administrators/AdministratorInviteCard.vue'
import AdministratorList from '~/components/admin/administrators/AdministratorList.vue'
import AsyncState from '~/components/common/AsyncState.vue'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'
import { useAdminAdministrators } from '~/composables/useAdminAdministrators'
import { useFocusReturn } from '~/composables/useFocusReturn'
import { useSeo } from '~/composables/useSeo'
import { useT } from '~/composables/useT'
import { ADMIN_REVOKE_TEXTS } from '~/consts/admin-administrators.const'
import { ADMIN_SNACKBAR_TIMEOUT_MS } from '~/consts/admin-feedback.const'
import { CONFIRM_DIALOG_APPEARANCE } from '~/enums/confirm-dialog.enum'
import { toRevokeCase } from '~/utils/admin-administrators.util'

/*********************************************************
 * Page
 *
 * @description
 * Administrateurs (F-68, B-31) : la liste des comptes, la carte « Inviter », la correction d'une invitation et le retrait d'un accès. Toute
 * la logique (appels, retours, refus) est dans `useAdminAdministrators` ; la page ne tient que les boîtes ouvertes. Pas d'édition active :
 * les administrateurs ne dépendent pas d'une édition.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const title = computed(() => t('pages.admin_administrators.title', 'Administrateurs'))
useHead({ title })
useSeo({ noindex: true })

const {
  administrators, pending, listError, refresh, feedback, busy, inviteFailure, fixFailure, actionFailure,
  invite, correct, resend, revoke, resetInvite, resetFix, dismissAction, dismissFeedback
} = useAdminAdministrators()
const snackbarTimeout = ADMIN_SNACKBAR_TIMEOUT_MS
const dialogAppearance = CONFIRM_DIALOG_APPEARANCE.MOCKUP

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()`.
 ********************************************************/
const eyebrow = computed(() => t('admin.administrators.eyebrow', 'Organisation'))
const cancelLabel = computed(() => t('admin.account.dialog_cancel', 'Annuler'))
const revokeLabel = computed(() => t('admin.administrators.revoke', 'Retirer l’accès'))
const reloadLabel = computed(() => t('admin.administrators.reload', 'Recharger'))
const actionFailureText = computed(() => actionFailure.value ? t(actionFailure.value.text.key, actionFailure.value.text.fallback, actionFailure.value.text.params) : '')

/*********************************************************
 * Chargement et erreur de liste
 *
 * @description
 * Le squelette ne remplace la liste qu'au premier chargement : un rechargement après une action la laisse affichée.
 ********************************************************/
const isLoading = computed(() => pending.value && administrators.value.length === 0)
const showState = computed(() => isLoading.value || listError.value !== null)
const handleReload = () => {
  refresh()
}
const handleActionReload = () => {
  dismissAction()
  refresh()
}

/*********************************************************
 * Retour des actions
 *
 * @description
 * Un retour à la fois, dans un snackbar ; il se ferme seul après quelques secondes.
 ********************************************************/
const feedbackOpen = computed(() => feedback.value !== null)
const feedbackStatus = computed(() => feedback.value?.status)
const feedbackText = computed(() => feedback.value
  ? t(feedback.value.message.key, feedback.value.message.fallback, feedback.value.message.params)
  : '')
const handleFeedbackOpen = (open: boolean) => {
  if (!open) {
    dismissFeedback()
  }
}

/*********************************************************
 * Inviter
 *
 * @description
 * L'email est vidé après un envoi réussi ; un refus le garde, avec son message.
 ********************************************************/
const inviteEmail = ref('')
const handleInvite = async () => {
  resetInvite()
  if (await invite(inviteEmail.value)) {
    inviteEmail.value = ''
  }
}

/*********************************************************
 * Renvoyer
 *
 * @description
 * Nouvelle invitation, l'ancien lien est annulé.
 ********************************************************/
const handleResend = (id: string) => {
  resend(id)
}

/*********************************************************
 * Corriger
 *
 * @description
 * La boîte s'ouvre sur un compte non activé et se ferme à la réussite ; le focus revient au bouton, ou à la liste si la ligne a changé d'état
 * (`useFocusReturn`).
 ********************************************************/
const fixId = ref<string | null>(null)
const fixOpen = computed(() => fixId.value !== null)
const fixAccount = computed(() => administrators.value.find(account => account.id === fixId.value) ?? null)
const listScroll = (): HTMLElement | null => document.querySelector<HTMLElement>('[data-cy="administrator-scroll"]')
useFocusReturn(fixOpen, listScroll)
const handleFix = (id: string) => {
  resetFix()
  fixId.value = id
}
const handleFixCancel = () => {
  fixId.value = null
}
const handleFixSubmit = async (email: string) => {
  if (fixId.value && await correct(fixId.value, email)) {
    fixId.value = null
  }
}

/*********************************************************
 * Retirer l'accès
 *
 * @description
 * Confirmation dont le texte dit ce qui arrive au compte (actif avec ou sans fiche, invité). Focus initial sur « Annuler ». La ligne disparaît ou
 * change à la réussite : le focus revient à la liste.
 ********************************************************/
const revokeId = ref<string | null>(null)
const revokeOpen = computed(() => revokeId.value !== null)
const revokeAccount = computed(() => administrators.value.find(account => account.id === revokeId.value) ?? null)
const revokeTitle = computed(() => t('admin.administrators.revoke_title', 'Retirer l’accès de {email} ?', { email: revokeAccount.value?.email ?? '' }))
const revokeText = computed(() => {
  const text = revokeAccount.value ? ADMIN_REVOKE_TEXTS[toRevokeCase(revokeAccount.value)] : null
  return text ? t(text.key, text.fallback) : ''
})
useFocusReturn(revokeOpen, listScroll)
const handleRevoke = (id: string) => {
  dismissAction()
  revokeId.value = id
}
const handleRevokeCancel = () => {
  revokeId.value = null
}
const handleRevokeConfirm = async () => {
  if (revokeId.value) {
    await revoke(revokeId.value)
    revokeId.value = null
  }
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
.admin-administrators {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--admin-administrators---gap, var(--origam-space---6));

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--origam-space---4);
  }

  &__heading {
    display: grid;
    gap: var(--origam-space---2);
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
    font-size: var(--origam-font__size---4xl);
    line-height: 1;
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    gap: var(--admin-administrators__grid---gap, var(--origam-space---5));
    align-items: start;

    > * {
      min-width: 0;
    }

    @media (max-width: 1200px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__main {
    display: grid;
    gap: var(--admin-administrators__grid---gap, var(--origam-space---4));
  }
}
</style>

<style>
:root {
  --admin-administrators---gap: var(--origam-space---6);
  --admin-administrators__grid---gap: var(--origam-space---5);
}
</style>
