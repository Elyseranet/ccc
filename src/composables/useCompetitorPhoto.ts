import type { MaybeRefOrGetter } from 'vue'
import { ref } from 'vue'
import { useSessionGuard } from '~/composables/useSessionGuard'
import type { ACCOUNT_ERROR } from '~/enums/account.enum'
import { CompetitorService } from '~/services/competitor.service'
import { toAccountError } from '~/utils/account-error.util'
import { validateAvatarFile } from '~/utils/avatar-file.util'

/*********************************************************
 * useCompetitorPhoto
 *
 * @description
 * Photo d'un compétiteur (administrateur, B-16) : envoi (`PUT /competiteurs/{id}/avatar`, multipart) et retrait (`DELETE`). C'est un
 * second appel, indépendant de l'identité : la photo ne fait pas avancer la version de l'identité, les deux s'enchaînent dans
 * n'importe quel ordre sans 412. Le contrôle de taille et de type du front ne sert qu'au retour immédiat : le serveur fait foi
 * (413, 415, 422). Une fois la photo posée ou retirée, `onChanged` recharge la fiche et l'annuaire. Une session expirée renvoie
 * vers la connexion. `upload` et `remove` renvoient `true` en cas de succès.
 ********************************************************/
export const useCompetitorPhoto = (id: MaybeRefOrGetter<string | null>, onChanged: () => Promise<void>) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  const guard = useSessionGuard()
  const pending = ref(false)
  const error = ref<ACCOUNT_ERROR | null>(null)

  const run = async (action: (competitorId: string) => Promise<unknown>): Promise<boolean> => {
    const competitorId = toValue(id)
    if (!competitorId || pending.value) {
      return false
    }
    pending.value = true
    error.value = null
    try {
      await action(competitorId)
      await onChanged()
      return true
    } catch (cause) {
      if (!guard.expireOn(cause)) {
        error.value = toAccountError(cause)
      }
      return false
    } finally {
      pending.value = false
    }
  }

  const upload = (file: File): Promise<boolean> => {
    const rejected = validateAvatarFile(file)
    if (rejected) {
      error.value = rejected
      return Promise.resolve(false)
    }
    return run(competitorId => service.uploadAvatar(competitorId, file))
  }

  const remove = (): Promise<boolean> => run(competitorId => service.deleteAvatar(competitorId))

  /** Pose une raison de refus venue d'ailleurs (le champ a déjà contrôlé le fichier). */
  const reject = (reason: ACCOUNT_ERROR) => {
    error.value = reason
  }

  const clear = () => {
    error.value = null
  }

  return { upload, remove, reject, clear, pending, error }
}
