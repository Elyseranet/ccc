import { SCORE_FAILURE_BY_CODE, SCORE_FAILURE_BY_STATUS } from '../consts/score-entry.const.js'
import { SCORE_FAILURE } from '../enums/score-entry.enum.js'
import { toApiRequestError } from './api-request-error.util.js'

/*********************************************************
 * Échec d'écriture de score -> cas à traduire
 *
 * @description
 * Le code d'erreur du contrat prime ; à défaut, le statut HTTP. Une absence de réponse (réseau coupé, délai dépassé) est
 * « hors ligne » : le score n'est pas parti, l'organisateur peut réessayer. 428 et 409 `SCORE_MISMATCH` sont des défauts du
 * front (en-tête ou scores non renvoyés), jamais un cas d'usage : message générique.
 ********************************************************/
export const toScoreFailure = (cause: unknown): SCORE_FAILURE => {
  const failure = toApiRequestError(cause)
  if (failure.isOffline) {
    return SCORE_FAILURE.OFFLINE
  }
  return SCORE_FAILURE_BY_CODE[failure.error.code]
    ?? SCORE_FAILURE_BY_STATUS[failure.error.statusCode]
    ?? SCORE_FAILURE.UNKNOWN
}
