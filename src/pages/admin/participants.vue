<template>
  <div
    class="admin-participants"
    data-cy="admin-participants"
  >
    <header class="admin-participants__head">
      <div class="admin-participants__heading">
        <p class="admin-participants__eyebrow">
          {{ eyebrow }}
        </p>
        <origam-title
          tag="h1"
          class="admin-participants__title font-display neon--sm"
          data-cy="page-title"
          :text="title"
        />
      </div>
      <p
        class="admin-participants__count"
        data-cy="participant-summary"
      >
        {{ summary }}
      </p>
    </header>
    <origam-alert
      v-if="listError"
      status="error"
      :text="listErrorText"
      data-cy="participant-list-error"
    >
      <template #close>
        <origam-btn
          variant="outlined"
          size="small"
          :text="retryLabel"
          data-cy="participant-list-retry"
          @click="handleReload"
        />
      </template>
    </origam-alert>
    <div class="admin-participants__grid">
      <origam-card
        class="admin-participants__add"
        rounded="xl"
        border
        elevation="md"
        :aria-labelledby="addTitleId"
        data-cy="participant-add"
      >
        <template #default>
          <origam-title
            :id="addTitleId"
            tag="h2"
            class="admin-participants__card-title"
            :text="addTitle"
          />
          <p class="admin-participants__lead">
            {{ addLead }}
          </p>
          <origam-alert
            v-if="isReadOnly"
            status="info"
            rounded="lg"
            :text="readOnlyText"
            data-cy="participant-read-only"
          />
          <participant-search
            :query="query"
            :suggestions="suggestions"
            :loading="searching"
            :disabled="isReadOnly || busy"
            @update:query="handleQuery"
            @attach="handleAttach"
            @create="handleCreate"
          />
          <participant-create-form
            v-if="creating"
            :initial-last-name="createName"
            :pending="busy"
            :email-taken="emailTaken"
            @submit="handleSubmit"
            @cancel="handleCancel"
            @update:email="handleEmailEdited"
          />
          <origam-alert
            v-if="pendingAvatar"
            status="warning"
            rounded="lg"
            :text="avatarPendingText"
            data-cy="participant-avatar-pending"
          >
            <template #close>
              <origam-btn
                variant="outlined"
                size="small"
                :loading="busy"
                :text="avatarRetryLabel"
                data-cy="participant-avatar-retry"
                @click="handleRetryAvatar"
              />
            </template>
          </origam-alert>
        </template>
      </origam-card>
      <participant-list
        :participants="participants"
        :editable="!isReadOnly"
        :pending="pending"
        :busy-participation-id="busyParticipationId"
        @remove="handleRemove"
        @resend="handleResend"
      />
    </div>
    <origam-snackbar
      :model-value="feedbackOpen"
      :text="feedbackText"
      :status="feedbackStatus"
      location="bottom"
      :timeout="snackbarTimeout"
      data-cy="participant-feedback"
      @update:model-value="handleFeedbackOpen"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { OrigamAlert, OrigamBtn, OrigamCard, OrigamSnackbar, OrigamTitle } from 'origam/components'
import ParticipantCreateForm from '~/components/admin/participants/ParticipantCreateForm.vue'
import ParticipantList from '~/components/admin/participants/ParticipantList.vue'
import ParticipantSearch from '~/components/admin/participants/ParticipantSearch.vue'
import { useAdminEdition } from '~/composables/useAdminEdition'
import { useAdminParticipants } from '~/composables/useAdminParticipants'
import { useParticipantSearch } from '~/composables/useParticipantSearch'
import { useT } from '~/composables/useT'
import { PARTICIPANT_SNACKBAR_TIMEOUT_MS } from '~/consts/admin-participants.const'
import { EDITION_STATUS_LABELS } from '~/consts/edition-status.const'
import type { IParticipantFormValues } from '~/interfaces/admin-participants.interface'

/*********************************************************
 * Page
 *
 * @description
 * Participants de l'édition active (F-09) : un seul flux, chercher, rattacher ou créer, inviter. La page assemble la
 * recherche, le formulaire de création et la liste des inscrits ; toute la logique (appels, retours, erreurs) est
 * dans les composables. L'édition active est celle du sélecteur de la coque.
 ********************************************************/
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useT()
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const addTitleId = useId()
const title = computed(() => t('pages.admin_participants.title', 'Participants'))
useHead({ title })

await useAdminEdition()
const {
  edition, participants, registeredIds, pending, error, refresh, isReadOnly, feedback, busy, busyParticipationId,
  emailTaken, pendingAvatar, attach, create, retryAvatar, remove, resend, dismissFeedback
} = useAdminParticipants()
const { query, suggestions, pending: searching } = useParticipantSearch(registeredIds)

/*********************************************************
 * Libellés
 *
 * @description
 * Tout texte passe par `t()`. Le résumé annonce le nombre d'inscrits et ce que l'édition permet.
 ********************************************************/
const eyebrow = computed(() => {
  if (!edition.value) {
    return t('admin.participants.eyebrow_none', 'Aucune édition')
  }
  const status = EDITION_STATUS_LABELS[edition.value.status]
  return t('layout.admin.edition_current', 'Édition {year} · {status}', { year: edition.value.year, status: t(status.key, status.label) })
})
const summary = computed(() => {
  const count = participants.value.length
  const base = count === 1
    ? t('admin.participants.summary_one', '1 inscrit')
    : t('admin.participants.summary_other', '{count} inscrits', { count })
  const rule = isReadOnly.value
    ? t('admin.participants.summary_read_only', 'édition clôturée, lecture seule')
    : t('admin.participants.summary_rule', 'ajout et retrait possibles jusqu’à la validation du tirage')
  return `${base} · ${rule}`
})
const addTitle = computed(() => t('admin.participants.add_title', 'Ajouter un participant'))
const addLead = computed(() => t('admin.participants.add_lead', 'Un seul flux : chercher un profil, le rattacher, ou créer et inviter.'))
const readOnlyText = computed(() => t('admin.participants.read_only', 'Cette édition est clôturée : les inscrits ne peuvent plus changer.'))
const listError = computed(() => error.value !== undefined && error.value !== null)
const listErrorText = computed(() => t('admin.participants.list_error', 'La liste des inscrits n’a pas pu être chargée.'))
const retryLabel = computed(() => t('components.async_state.retry', 'Réessayer'))
const avatarPendingText = computed(() => t('admin.participants.avatar_pending', '{name} est créé sans photo : son envoi a échoué.', { name: pendingAvatar.value?.displayName ?? '' }))
const avatarRetryLabel = computed(() => t('admin.participants.avatar_retry', 'Réessayer l’envoi de la photo'))
const snackbarTimeout = PARTICIPANT_SNACKBAR_TIMEOUT_MS

/*********************************************************
 * Retour des actions
 *
 * @description
 * Un retour à la fois, dans un snackbar (succès, avertissement ou erreur) ; il se ferme seul après quelques secondes.
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
 * Création
 *
 * @description
 * « Créer un nouveau participant » ouvre le formulaire avec la saisie de la recherche comme nom. Une création réussie
 * le referme et vide la recherche ; un email refusé le laisse ouvert avec son message.
 ********************************************************/
const creating = ref(false)
const createName = ref('')
watch(isReadOnly, (readOnly) => {
  if (readOnly) {
    creating.value = false
  }
})
const handleQuery = (value: string) => {
  query.value = value
}
const handleCreate = (name: string) => {
  createName.value = name
  creating.value = true
}
const handleCancel = () => {
  creating.value = false
}
const handleEmailEdited = () => {
  emailTaken.value = false
}
const handleSubmit = async (values: IParticipantFormValues) => {
  if (await create(values)) {
    creating.value = false
    query.value = ''
  }
}
const handleAttach = async (competitorId: string) => {
  if (await attach(competitorId)) {
    query.value = ''
  }
}
const handleRetryAvatar = () => {
  retryAvatar()
}

/*********************************************************
 * Liste
 *
 * @description
 * Retrait et renvoi d'invitation : le serveur arbitre, le retour dit pourquoi un retrait est refusé.
 ********************************************************/
const handleRemove = (participationId: string) => {
  remove(participationId)
}
const handleResend = (competitorId: string) => {
  resend(competitorId)
}
const handleReload = () => {
  refresh()
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
.admin-participants {
  display: grid;
  gap: var(--admin-participants---gap, var(--origam-space---6));

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

  &__count {
    margin: 0;
    font-variant-numeric: tabular-nums;
    color: var(--origam-color__text---secondary);
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
    gap: var(--admin-participants__grid---gap, var(--origam-space---5));
    align-items: start;

    > * {
      min-width: 0;
    }

    @media (max-width: 1200px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__add {
    display: grid;
    gap: var(--origam-space---4);
    padding: var(--origam-space---6);
  }

  &__card-title {
    font-size: var(--origam-font__size---xl);
    font-weight: var(--origam-font__weight---bold);
    line-height: var(--origam-font__lineHeight---tight);
  }

  &__lead {
    margin: 0;
    color: var(--origam-color__text---secondary);
  }
}
</style>

<style>
:root {
  --admin-participants---gap: var(--origam-space---6);
  --admin-participants__grid---gap: var(--origam-space---5);
}
</style>
