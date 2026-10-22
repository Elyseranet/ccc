import { HTTP_STATUS_UNAUTHORIZED } from '~/consts/async-state.const'
import { ROUTES } from '~/consts/routes.const'
import { AuthService } from '~/services/auth.service'
import { useAuthStore } from '~/stores/auth.store'
import { ApiRequestError } from '~/utils/api-request-error.util'

/*********************************************************
 * useLogout
 *
 * @description
 * Déconnexion : `POST /auth/logout`, puis la session locale est vidée et l'utilisateur est renvoyé vers l'espace public.
 * Un 401 veut dire que la session serveur n'existe plus : l'utilisateur est déjà déconnecté, on traite comme un succès.
 * Sur toute autre erreur (réseau, 5xx, autre 4xx), la session serveur est peut-être encore valide : on garde la session locale
 * et `failed` passe à vrai, pour que l'écran le dise au lieu de laisser croire à une déconnexion.
 ********************************************************/
export const useLogout = () => {
  const auth = useAuthStore()
  const service = new AuthService({ fetcher: useRequestFetch() })
  const pending = ref(false)
  const failed = ref(false)

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
    pending.value = false
    await navigateTo(ROUTES.HOME)
  }

  return { logout, pending, failed }
}
