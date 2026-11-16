import { CLOSING_FAILURE_BY_CODE, CLOSING_FAILURE_BY_STATUS } from '../consts/edition-closing-view.const.js'
import { CLOSING_FAILURE } from '../enums/edition-closing-view.enum.js'
import { toApiRequestError } from './api-request-error.util.js'

/*********************************************************
 * Échec de la clôture -> cas à traduire
 *
 * @description
 * Le code d'erreur du contrat prime (`FINAL_NOT_VALIDATED`), à défaut le statut HTTP. Une absence de réponse (réseau coupé, délai dépassé) est
 * « hors ligne » : on ne sait pas si l'écriture est partie, d'où le bouton « Vérifier l'état ». Cette route ne porte pas `If-Match`
 * et est idempotente : il n'y a ni 412 ni 409 de conflit à traiter en dehors de la finale non validée.
 ********************************************************/
export const toClosingFailure = (cause: unknown): CLOSING_FAILURE => {
  const failure = toApiRequestError(cause)
  if (failure.isOffline) {
    return CLOSING_FAILURE.OFFLINE
  }
  return CLOSING_FAILURE_BY_CODE[failure.error.code]
    ?? CLOSING_FAILURE_BY_STATUS[failure.error.statusCode]
    ?? CLOSING_FAILURE.UNKNOWN
}
