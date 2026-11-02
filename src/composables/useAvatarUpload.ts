import { ref } from 'vue'
import { useAuthStore } from '~/composables/useAuthStore'
import type { ACCOUNT_ERROR } from '~/enums/account.enum'
import { useSessionGuard } from '~/composables/useSessionGuard'
import { MeService } from '~/services/me.service'
import { toAccountError } from '~/utils/account-error.util'
import { validateAvatarFile } from '~/utils/avatar-file.util'

/*********************************************************
 * useAvatarUpload
 *
 * @description
 * Envoi et retrait de l'avatar du compte connecté (B-16, AV-1). Le contrôle de taille et de type du front ne sert qu'au retour
 * immédiat : le serveur fait foi (413, 415, 422). Une fois posé ou retiré, on relit `GET /moi` pour que le store porte
 * l'`avatarUrl` à jour (empreinte `?v=` comprise). `upload` et `remove` renvoient `true` en cas de succès.
 ********************************************************/
export const useAvatarUpload = () => {
  const auth = useAuthStore()
  const service = new MeService({ fetcher: useRequestFetch() })
  const guard = useSessionGuard()
  const pending = ref(false)
  const error = ref<ACCOUNT_ERROR | null>(null)

  const refresh = async () => {
    auth.setMe(await service.me())
  }

  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    pending.value = true
    error.value = null
    try {
      await action()
      await refresh()
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

  const upload = async (file: File): Promise<boolean> => {
    const rejected = validateAvatarFile(file)
    if (rejected) {
      error.value = rejected
      return false
    }
    return run(() => service.uploadAvatar(file))
  }

  const remove = (): Promise<boolean> => run(() => service.removeAvatar())

  /** Pose une raison de refus venue d'ailleurs (le champ a déjà contrôlé le fichier). */
  const reject = (reason: ACCOUNT_ERROR) => {
    error.value = reason
  }

  return { upload, remove, reject, pending, error }
}
