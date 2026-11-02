import { useAuthStore } from '~/composables/useAuthStore'
import { ME_STATE_KEY } from '~/consts/auth-session.const'
import { HTTP_STATUS_UNAUTHORIZED } from '~/consts/http-status.const'
import { ROUTES } from '~/consts/routes.const'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import { toApiRequestError } from '~/utils/api-request-error.util'

/*********************************************************
 * useSessionGuard
 *
 * @description
 * Session expirée ou révoquée côté serveur : un appel authentifié répond 401 `UNAUTHORIZED`. Le store et le cache de `GET /moi`
 * disent encore « connecté » ; sans remise à zéro, la page reste affichée comme si de rien n'était (revue de sécurité M2). Ce
 * garde, utilisé par tous les composables d'écriture, vide le compte et renvoie vers `/connexion`. Les 401 de la connexion
 * (`INVALID_CREDENTIALS`) et du changement de mot de passe (`INVALID_CURRENT_PASSWORD`) ne sont pas des sessions expirées : seul le
 * code `UNAUTHORIZED` compte.
 ********************************************************/
export const useSessionGuard = () => {
  const auth = useAuthStore()

  const isSessionExpired = (cause: unknown): boolean => {
    const failure = toApiRequestError(cause)
    return failure.error.statusCode === HTTP_STATUS_UNAUTHORIZED && failure.error.code === API_ERROR_CODE.UNAUTHORIZED
  }

  /** `true` si l'échec était une session expirée : l'état est alors remis à zéro et la navigation vers `/connexion` lancée. */
  const expireOn = (cause: unknown): boolean => {
    if (!isSessionExpired(cause)) {
      return false
    }
    auth.clear()
    clearNuxtData(ME_STATE_KEY)
    navigateTo(ROUTES.LOGIN)
    return true
  }

  return { expireOn, isSessionExpired }
}
