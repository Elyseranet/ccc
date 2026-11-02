import { HTTP_STATUS_UNAUTHORIZED } from '~/consts/http-status.const'
import { LOGGED_OUT_STATE_KEY, ME_STATE_KEY } from '~/consts/auth-session.const'
import { ROUTES } from '~/consts/routes.const'
import { AuthService } from '~/services/auth.service'
import { useAuthStore } from '~/composables/useAuthStore'
import { ApiRequestError } from '~/utils/api-request-error.util'

/*********************************************************
 * useLogout
 *
 * @description
 * Déconnexion : `POST /auth/logout`, puis la session locale est vidée et l'utilisateur est renvoyé vers l'espace public.
 * Le message « Vous êtes déconnecté·e » est annoncé sur l'accueil (région `role="status"` du layout public) par un état partagé, quel que soit le rôle : même arrivée pour le participant et l'administrateur, sans page intermédiaire.
 * Un 401 veut dire que la session serveur n'existe plus : l'utilisateur est déjà déconnecté, on traite comme un succès.
 * Sur toute autre erreur (réseau, 5xx, autre 4xx), la session serveur est peut-être encore valide : on garde la session locale
 * et `failed` passe à vrai, pour que l'écran le dise au lieu de laisser croire à une déconnexion.
 ********************************************************/
export const useLogout = () => {
  const auth = useAuthStore()
  const service = new AuthService({ fetcher: useRequestFetch() })
  const pending = ref(false)
  const failed = ref(false)
  const loggedOut = useState<boolean>(LOGGED_OUT_STATE_KEY, () => false)

  const isAlreadyLoggedOut = (cause: unknown): boolean =>
    cause instanceof ApiRequestError && cause.error.statusCode === HTTP_STATUS_UNAUTHORIZED

  const logout = async () => {
    pending.value = true
    failed.value = false
    try {
      await service.logout()
    } catch (cause) {
      if (!isAlreadyLoggedOut(cause)) {
        failed.value = true
        pending.value = false
        return
      }
    }
    auth.clear()
    clearNuxtData(ME_STATE_KEY)
    loggedOut.value = true
    pending.value = false
    await navigateTo(ROUTES.HOME)
  }

  return { logout, pending, failed }
}
