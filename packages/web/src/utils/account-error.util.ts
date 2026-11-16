import { ACCOUNT_ERROR_BY_CODE } from '../consts/account.const.js'
import { ACCOUNT_ERROR } from '../enums/account.enum.js'
import { toApiRequestError } from './api-request-error.util.js'

/*********************************************************
 * Échec d'une action du compte
 *
 * @description
 * Traduit une erreur d'API en cause affichable. On lit le code d'erreur avant le statut : 401 veut dire « identifiants »
 * à la connexion mais « session expirée » ailleurs, et 413 vaut `AVATAR_TOO_LARGE` pour l'avatar mais corps JSON trop gros
 * sinon (M2). Les 400 (Content-Type absent) et 413 (corps de plus de 16 Kio) du contrat M2 ne peuvent pas venir d'un envoi
 * normal : ils reçoivent un message de rechargement. Le message brut du serveur n'est jamais affiché.
 ********************************************************/
export const toAccountError = (cause: unknown): ACCOUNT_ERROR => {
  const failure = toApiRequestError(cause)
  if (failure.isOffline) {
    return ACCOUNT_ERROR.OFFLINE
  }
  return ACCOUNT_ERROR_BY_CODE[failure.error.code] ?? ACCOUNT_ERROR.UNKNOWN
}
