import { HTTP_STATUS_NOT_FOUND } from '../consts/http-status.const.js'
import { ERROR_PAGE_KIND } from '../enums/error-page-kind.enum.js'

/** Une page introuvable a son propre texte ; toute autre erreur reçoit le texte générique. */
export const resolveErrorPageKind = (statusCode: number): ERROR_PAGE_KIND =>
  statusCode === HTTP_STATUS_NOT_FOUND ? ERROR_PAGE_KIND.NOT_FOUND : ERROR_PAGE_KIND.GENERIC
