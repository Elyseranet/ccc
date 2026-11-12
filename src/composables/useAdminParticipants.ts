import { computed, ref } from 'vue'
import { useAdminEditionStore } from '~/composables/useAdminEditionStore'
import { useEditions } from '~/composables/useEditions'
import { useT } from '~/composables/useT'
import { ADMIN_PARTICIPANTS_CACHE_KEY } from '~/consts/admin-participants.const'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import { PARTICIPANT_EDITABLE_STATUSES } from '~/consts/edition.const'
import { FEEDBACK_STATUS } from '~/enums/feedback.enum'
import type { IParticipantFeedback, IParticipantFormValues, IPendingAvatar } from '~/interfaces/admin-participants.interface'
import type { ITranslatableText } from '~/interfaces/common-components.interface'
import { CompetitorService } from '~/services/competitor.service'
import { EditionService } from '~/services/edition.service'
import { hasErrorCode, toNewCompetitor, toParticipantError } from '~/utils/admin-participants.util'

/*********************************************************
 * useAdminParticipants
 *
 * @description
 * Inscrits de l'édition active de l'admin et actions du ticket F-09 : rattacher un profil existant, créer un participant
 * (deux appels : `POST /editions/{id}/participants` avec `newCompetitor`, puis `PUT /competiteurs/{id}/avatar`), retirer un
 * inscrit, renvoyer une invitation. Les actions sont masquées d'après un état connu de l'API : une édition
 * au-delà de l'inscription (`PARTICIPANT_EDITABLE_STATUSES`, le jeu que le serveur applique). Un tirage validé pendant l'inscription, ou une
 * course, reste arbitré par le serveur (409 `REGISTRATION_CLOSED`, `EDITION_CLOSED`), traduit en message.
 * Aucun `await` en tête : les composables de Nuxt (`useAsyncData`…) doivent être appelés avant tout point d'attente. L'édition
 * active par défaut est posée par `useAdminEdition` (le sélecteur de la coque, que la page attend en premier).
 * `invitationSent` est affiché tel quel : `true` (envoyée), `false` (non envoyée, le compte existe), `null` (profil
 * existant, aucune invitation).
 ********************************************************/
export const useAdminParticipants = () => {
  const { t } = useT()
  const editionService = new EditionService({ fetcher: useRequestFetch() })
  const competitorService = new CompetitorService({ fetcher: useRequestFetch() })
  const store = useAdminEditionStore()
  const { data: editions } = useEditions()

  const editionId = computed(() => store.editionId)
  const edition = computed(() => (editions.value ?? []).find(item => item.id === editionId.value) ?? null)
  const isReadOnly = computed(() => edition.value !== null && !PARTICIPANT_EDITABLE_STATUSES.includes(edition.value.status))

  const { data, pending, error, refresh } = useAsyncData(
    ADMIN_PARTICIPANTS_CACHE_KEY,
    async () => editionId.value ? editionService.adminParticipants(editionId.value) : [],
    { watch: [editionId], default: () => [] }
  )
  const participants = computed(() => data.value ?? [])
  const registeredIds = computed<ReadonlySet<string>>(() => new Set(participants.value.map(participant => participant.competitor.id)))

  /*********************************************************
   * État des actions
   *
   * @description
   * Un seul retour à la fois (snackbar), un seul envoi en cours. `emailTaken` marque le champ email refusé (409) ;
   * `pendingAvatar` garde la photo d'un participant déjà créé dont l'envoi a échoué.
   ********************************************************/
  const feedback = ref<IParticipantFeedback | null>(null)
  const busy = ref(false)
  const busyParticipationId = ref<string | null>(null)
  const emailTaken = ref(false)
  const pendingAvatar = ref<IPendingAvatar | null>(null)

  const notify = (status: FEEDBACK_STATUS, message: ITranslatableText) => {
    feedback.value = { status, message }
  }
  const dismissFeedback = () => {
    feedback.value = null
  }
  const reload = async () => {
    await Promise.all([refresh(), refreshNuxtData('editions')])
  }
  /** Un refus « inscriptions closes » ou « édition close » apprend à l'écran l'état de l'édition : on la recharge, les actions se masquent. */
  const fail = async (cause: unknown) => {
    notify(FEEDBACK_STATUS.ERROR, toParticipantError(cause))
    if (hasErrorCode(cause, API_ERROR_CODE.REGISTRATION_CLOSED) || hasErrorCode(cause, API_ERROR_CODE.EDITION_CLOSED)) {
      await reload()
    }
  }

  const attach = async (competitorId: string): Promise<boolean> => {
    if (!editionId.value || busy.value) {
      return false
    }
    busy.value = true
    try {
      await editionService.addParticipant(editionId.value, { competitorId })
      notify(FEEDBACK_STATUS.SUCCESS, {
        key: 'admin.participants.feedback_attached',
        fallback: 'Profil rattaché à l’édition {year}',
        params: { year: edition.value?.year ?? '' }
      })
      await reload()
      return true
    } catch (cause) {
      await fail(cause)
      return false
    } finally {
      busy.value = false
    }
  }

  const uploadAvatar = async (pending: IPendingAvatar): Promise<boolean> => {
    try {
      await competitorService.uploadAvatar(pending.competitorId, pending.file)
      pendingAvatar.value = null
      return true
    } catch (cause) {
      pendingAvatar.value = pending
      const reason = toParticipantError(cause)
      notify(FEEDBACK_STATUS.ERROR, {
        key: 'admin.participants.feedback_avatar_failed',
        fallback: '{name} est créé, mais sa photo n’a pas été envoyée : {reason}',
        params: { name: pending.displayName, reason: t(reason.key, reason.fallback, reason.params) }
      })
      return false
    }
  }

  const create = async (values: IParticipantFormValues): Promise<boolean> => {
    if (!editionId.value || busy.value) {
      return false
    }
    busy.value = true
    emailTaken.value = false
    try {
      const result = await editionService.addParticipant(editionId.value, { newCompetitor: toNewCompetitor(values) })
      const sent = result.invitationSent === true
      notify(sent ? FEEDBACK_STATUS.SUCCESS : FEEDBACK_STATUS.WARNING, sent
        ? { key: 'admin.participants.feedback_invitation_sent', fallback: 'Invitation envoyée' }
        : { key: 'admin.participants.feedback_invitation_failed', fallback: 'Participant créé, mais l’invitation n’a pas pu être envoyée : renvoyez-la depuis la liste.' })
      if (values.avatar) {
        await uploadAvatar({ competitorId: result.competitor.id, displayName: result.competitor.displayName, file: values.avatar })
      }
      await reload()
      return true
    } catch (cause) {
      if (hasErrorCode(cause, API_ERROR_CODE.EMAIL_ALREADY_USED)) {
        emailTaken.value = true
        dismissFeedback()
      } else {
        await fail(cause)
      }
      return false
    } finally {
      busy.value = false
    }
  }

  const retryAvatar = async (): Promise<boolean> => {
    if (!pendingAvatar.value || busy.value) {
      return false
    }
    busy.value = true
    try {
      const done = await uploadAvatar(pendingAvatar.value)
      if (done) {
        notify(FEEDBACK_STATUS.SUCCESS, { key: 'admin.participants.feedback_avatar_sent', fallback: 'Photo envoyée' })
        await reload()
      }
      return done
    } finally {
      busy.value = false
    }
  }

  const remove = async (participationId: string): Promise<boolean> => {
    if (!editionId.value || busy.value) {
      return false
    }
    busy.value = true
    busyParticipationId.value = participationId
    try {
      await editionService.removeParticipant(editionId.value, participationId)
      notify(FEEDBACK_STATUS.SUCCESS, { key: 'admin.participants.feedback_removed', fallback: 'Participant retiré de l’édition' })
      await reload()
      return true
    } catch (cause) {
      await fail(cause)
      return false
    } finally {
      busy.value = false
      busyParticipationId.value = null
    }
  }

  const resend = async (competitorId: string): Promise<boolean> => {
    if (busy.value) {
      return false
    }
    busy.value = true
    try {
      const result = await competitorService.resendInvitation(competitorId)
      notify(result.invitationSent ? FEEDBACK_STATUS.SUCCESS : FEEDBACK_STATUS.WARNING, result.invitationSent
        ? { key: 'admin.participants.feedback_resent', fallback: 'Invitation renvoyée : l’ancien lien est annulé' }
        : { key: 'admin.participants.feedback_resend_failed', fallback: 'L’invitation n’a pas pu être envoyée : réessayez.' })
      await reload()
      return true
    } catch (cause) {
      await fail(cause)
      return false
    } finally {
      busy.value = false
    }
  }

  return {
    edition,
    participants,
    registeredIds,
    pending,
    error,
    refresh,
    isReadOnly,
    feedback,
    busy,
    busyParticipationId,
    emailTaken,
    pendingAvatar,
    attach,
    create,
    retryAvatar,
    remove,
    resend,
    dismissFeedback
  }
}
