import { QUALIFICATION_FAILURE_BY_CODE, QUALIFICATION_FAILURE_BY_STATUS } from '../consts/qualification-view.const.js'
import { QUALIFICATION_FAILURE } from '../enums/qualification.enum.js'
import { toApiRequestError } from './api-request-error.util.js'

/*********************************************************
 * Échec d'écriture de la qualification -> cas à traduire
 *
 * @description
 * Le code d'erreur du contrat prime ; à défaut, le statut HTTP. Une absence de réponse (réseau coupé, délai dépassé) est « hors ligne » :
 * rien n'est parti, l'organisateur peut réessayer. Ces routes ne portent pas `If-Match` : il n'y a ni 412 ni 428 à traiter.
 ********************************************************/
export const toQualificationFailure = (cause: unknown): QUALIFICATION_FAILURE => {
  const failure = toApiRequestError(cause)
  if (failure.isOffline) {
    return QUALIFICATION_FAILURE.OFFLINE
  }
  return QUALIFICATION_FAILURE_BY_CODE[failure.error.code]
    ?? QUALIFICATION_FAILURE_BY_STATUS[failure.error.statusCode]
    ?? QUALIFICATION_FAILURE.UNKNOWN
}
