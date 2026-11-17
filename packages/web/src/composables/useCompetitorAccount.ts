import { computed, ref } from 'vue'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import type { IAdminFailure } from '~/interfaces/admin-failure.interface'
import type { IParticipantFeedback } from '~/interfaces/admin-participants.interface'
import { CompetitorService } from '~/services/competitor.service'
import { toAccountFailure, toAccountFeedback } from '~/utils/admin-competitors.util'

/*********************************************************
 * useCompetitorAccount
 *
 * @description
 * Pose ou corrige l'email d'un compétiteur et envoie l'invitation (`PUT /competiteurs/{id}/compte`, B-29 ; F-62). Un seul appel pour
 * les deux points d'entrée (fiche compétiteur, liste des inscrits). Succès : `feedback` (envoyée, ou avertissement si le mail n'est pas
 * parti : le compte existe quand même). Refus (email pris, compte actif, 404…) : `failure`, `emailTaken` marque le champ. Rien n'est
 * rechargé ici : l'appelant recharge sa fiche ou sa liste quand `submit` répond `true`, ou quand `failure.code` vaut `ACCOUNT_ACTIVE`.
 ********************************************************/
export const useCompetitorAccount = () => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  const pending = ref(false)
  const failure = ref<IAdminFailure | null>(null)
  const feedback = ref<IParticipantFeedback | null>(null)
  const emailTaken = computed(() => failure.value?.code === API_ERROR_CODE.EMAIL_ALREADY_USED)

  const reset = () => {
    failure.value = null
    feedback.value = null
  }

  const submit = async (competitorId: string, email: string): Promise<boolean> => {
    if (pending.value) {
      return false
    }
    pending.value = true
    reset()
    const trimmed = email.trim()
    try {
      feedback.value = toAccountFeedback(await service.setAccountEmail(competitorId, trimmed), trimmed)
      return true
    } catch (cause) {
      failure.value = toAccountFailure(cause)
      return false
    } finally {
      pending.value = false
    }
  }

  return { submit, reset, pending, failure, feedback, emailTaken }
}
