import { computed, ref } from 'vue'
import { ADMIN_ADMINISTRATORS_CACHE_KEY, ADMIN_REVOKE_FEEDBACK } from '~/consts/admin-administrators.const'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import { FEEDBACK_STATUS } from '~/enums/feedback.enum'
import type { IAdminFailure } from '~/interfaces/admin-failure.interface'
import type { IAdministratorPromotion } from '~/interfaces/administrator.interface'
import type { IParticipantFeedback } from '~/interfaces/admin-participants.interface'
import { AdministratorService } from '~/services/administrator.service'
import { toAccountFeedback } from '~/utils/admin-competitors.util'
import { toAdministratorFailure, toInviteFeedback, toPromotionDisplayName, toRevokeCase } from '~/utils/admin-administrators.util'
import { fromAsyncDataError } from '~/utils/async-data-error.util'

/*********************************************************
 * useAdminAdministrators
 *
 * @description
 * Comptes administrateurs de l'écran F-68 (B-31) : liste, invitation (ou promotion d'un compte joueur), correction de l'email d'un compte
 * non activé, renvoi, retrait de l'accès. Un seul envoi à la fois. Le refus d'une écriture se range selon l'endroit où l'écran l'affiche :
 * `inviteFailure` (carte ; `promotion` : confirmation d'un compte joueur, B-33), `fixFailure` (boîte « Corriger »), `actionFailure` (sous la table : renvoi, retrait). Succès : `feedback` (snackbar)
 * et liste rechargée. `ACCOUNT_ACTIVE` apprend à l'écran que le compte a changé d'état : la liste est rechargée. Les autres refus (dernier administrateur,
 * auto-retrait, compte disparu) laissent la liste telle quelle, avec « Recharger ».
 ********************************************************/
export const useAdminAdministrators = () => {
  const service = new AdministratorService({ fetcher: useRequestFetch() })
  const { data, pending, error, refresh } = useAsyncData(ADMIN_ADMINISTRATORS_CACHE_KEY, () => service.list(), { default: () => [] })
  const administrators = computed(() => data.value ?? [])
  const listError = computed(() => error.value ? fromAsyncDataError(error.value) : null)

  const feedback = ref<IParticipantFeedback | null>(null)
  const busy = ref(false)
  const inviteFailure = ref<IAdminFailure | null>(null)
  const fixFailure = ref<IAdminFailure | null>(null)
  const actionFailure = ref<IAdminFailure | null>(null)

  const dismissFeedback = () => {
    feedback.value = null
  }
  const resetInvite = () => {
    inviteFailure.value = null
  }
  const resetFix = () => {
    fixFailure.value = null
  }
  const dismissAction = () => {
    actionFailure.value = null
  }

  /** Un envoi à la fois : l'appel part, la liste est rechargée, puis `toFeedback` compose le retour (il peut donc lire la liste à jour) ; un refus va dans `failure`. */
  const run = async <T>(failure: typeof inviteFailure, call: () => Promise<T>, toFeedback: (result: T) => IParticipantFeedback | null): Promise<boolean> => {
    if (busy.value) {
      return false
    }
    busy.value = true
    inviteFailure.value = null
    fixFailure.value = null
    actionFailure.value = null
    feedback.value = null
    try {
      const result = await call()
      // Rien n'a changé quand l'appel rend `null` (promotion à confirmer) : pas de rechargement, `busy` ne doit pas bloquer la boîte qui s'ouvre.
      if (result !== null) {
        await refresh()
      }
      feedback.value = toFeedback(result)
      return true
    } catch (cause) {
      failure.value = toAdministratorFailure(cause)
      if (failure.value.code === API_ERROR_CODE.ACCOUNT_ACTIVE) {
        await refresh()
      }
      return false
    } finally {
      busy.value = false
    }
  }

  /**
   * Invitation. L'email d'un compte joueur n'est pas promu d'emblée : le 409 `PROMOTION_CONFIRMATION_REQUIRED` (B-33) met la promotion en attente
   * (`promotion`, avec le nom du joueur) pour que l'écran la confirme, puis `confirmPromotion` renvoie le même email avec `confirmPromotion: true`.
   * Rend `true` seulement quand un compte a été créé ou promu.
   */
  const promotion = ref<IAdministratorPromotion | null>(null)
  const invite = async (email: string, confirm = false): Promise<boolean> => {
    const trimmed = email.trim()
    let awaiting = false
    const done = await run(inviteFailure, async () => {
      try {
        return await service.invite(trimmed, confirm)
      } catch (cause) {
        const displayName = toPromotionDisplayName(cause)
        if (displayName === null) {
          throw cause
        }
        promotion.value = { email: trimmed, displayName: displayName || trimmed }
        awaiting = true
        return null
      }
    }, (result) => {
      if (result === null) {
        return null
      }
      const account = administrators.value.find(item => item.id === result.id)
      return toInviteFeedback(result, trimmed, account?.competitor?.displayName ?? promotion.value?.displayName ?? trimmed)
    })
    if (done && !awaiting) {
      promotion.value = null
    }
    return done && !awaiting
  }
  const confirmPromotion = (): Promise<boolean> => promotion.value ? invite(promotion.value.email, true) : Promise.resolve(false)
  const cancelPromotion = () => {
    promotion.value = null
  }

  const correct = (id: string, email: string): Promise<boolean> => {
    const trimmed = email.trim()
    return run(fixFailure, () => service.correctEmail(id, trimmed), result => toAccountFeedback(result, trimmed))
  }

  const resend = (id: string): Promise<boolean> => run(actionFailure, () => service.resendInvitation(id), result => result.invitationSent
    ? { status: FEEDBACK_STATUS.SUCCESS, message: { key: 'admin.participants.feedback_resent', fallback: 'Invitation renvoyée : l’ancien lien est annulé' } }
    : { status: FEEDBACK_STATUS.WARNING, message: { key: 'admin.participants.feedback_resend_failed', fallback: 'L’invitation n’a pas pu être envoyée : réessayez.' } })

  const revoke = (id: string): Promise<boolean> => {
    const account = administrators.value.find(item => item.id === id)
    if (!account) {
      return Promise.resolve(false)
    }
    return run(actionFailure, () => service.revoke(id), () => ({
      status: FEEDBACK_STATUS.SUCCESS,
      message: { ...ADMIN_REVOKE_FEEDBACK[toRevokeCase(account)], params: { email: account.email } }
    }))
  }

  return {
    administrators,
    pending,
    listError,
    refresh,
    feedback,
    busy,
    inviteFailure,
    fixFailure,
    actionFailure,
    invite,
    promotion,
    confirmPromotion,
    cancelPromotion,
    correct,
    resend,
    revoke,
    resetInvite,
    resetFix,
    dismissAction,
    dismissFeedback
  }
}
