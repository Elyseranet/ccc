import { computed, ref } from 'vue'
import { useAuthStore } from '~/composables/useAuthStore'
import { useAvatarUpload } from '~/composables/useAvatarUpload'
import { useSessionGuard } from '~/composables/useSessionGuard'
import type { ACCOUNT_ERROR } from '~/enums/account.enum'
import { MeService } from '~/services/me.service'
import { toAccountError } from '~/utils/account-error.util'
import { buildProfileChanges } from '~/utils/profile-form.util'

/*********************************************************
 * useProfile
 *
 * @description
 * « Mon profil » (A4) : le participant modifie son téléphone, son mot de passe et son avatar ; le nom, le prénom, le pseudo et
 * l'email sont en lecture seule. Le compte vient du store, alimenté par `GET /moi` (seule source de l'état connecté) ; chaque
 * écriture le remplace par la réponse du serveur. `saved` annonce l'enregistrement jusqu'à la prochaine modification, y compris quand rien n'a changé : la personne qui clique sur « Enregistrer » reçoit toujours une réponse, sans requête inutile.
 ********************************************************/
export const useProfile = () => {
  const auth = useAuthStore()
  const service = new MeService({ fetcher: useRequestFetch() })
  const avatar = useAvatarUpload()
  const guard = useSessionGuard()
  const pending = ref(false)
  const error = ref<ACCOUNT_ERROR | null>(null)
  const saved = ref(false)
  const me = computed(() => auth.me)

  const save = async (values: { phone: string | null, currentPassword: string, newPassword: string }): Promise<boolean> => {
    if (!auth.me) {
      return false
    }
    const changes = buildProfileChanges(auth.me, values)
    saved.value = false
    error.value = null
    if (!changes) {
      saved.value = true
      return true
    }
    pending.value = true
    try {
      auth.setMe(await service.updateProfile(changes))
      saved.value = true
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

  const uploadAvatar = async (file: File) => {
    saved.value = false
    return avatar.upload(file)
  }

  const rejectAvatar = (reason: ACCOUNT_ERROR) => {
    avatar.reject(reason)
  }

  const removeAvatar = async () => {
    saved.value = false
    return avatar.remove()
  }

  return { me, save, saved, pending, error, uploadAvatar, removeAvatar, rejectAvatar, avatarPending: avatar.pending, avatarError: avatar.error }
}
