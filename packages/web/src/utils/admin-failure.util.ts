import type { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { IAdminFailure, IAdminFailureMessages } from '../interfaces/admin-failure.interface.js'
import { ApiRequestError } from './api-request-error.util.js'

/*********************************************************
 * Erreurs d'écriture de l'admin
 *
 * @description
 * Traduit une erreur d'API en message d'alerte (titre et texte traduisibles) : un message par code d'erreur connu de l'écran,
 * un autre pour un échec sans réponse (réseau, délai), un dernier pour tout le reste. `params` complète le texte
 * (`{code}` d'une édition). Le message brut du serveur n'est jamais affiché.
 ********************************************************/
export const toAdminFailure = (
  cause: unknown,
  messages: IAdminFailureMessages,
  params: Record<string, string | number> = {}
): IAdminFailure => {
  if (!(cause instanceof ApiRequestError)) {
    return { ...messages.unknown, statusCode: 0, code: null }
  }
  const { statusCode, code } = cause.error
  if (cause.isOffline) {
    return { ...messages.offline, statusCode, code: null }
  }
  const known = messages.byCode[code as API_ERROR_CODE]
  const picked = known ?? messages.unknown
  return { title: picked.title, text: { ...picked.text, params }, statusCode, code: code as API_ERROR_CODE }
}
