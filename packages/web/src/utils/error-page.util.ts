import { HTTP_STATUS_NOT_FOUND } from '../consts/http-status.const.js'
import { ERROR_PAGE_KIND } from '../enums/error-page-kind.enum.js'

/** Une page introuvable a son propre texte ; toute autre erreur reçoit le texte générique. */
export const resolveErrorPageKind = (statusCode: number | undefined): ERROR_PAGE_KIND =>
  statusCode === HTTP_STATUS_NOT_FOUND ? ERROR_PAGE_KIND.NOT_FOUND : ERROR_PAGE_KIND.GENERIC

/** Un code HTTP affichable : entier de 100 à 599. Tout le reste (absent, 0 d'une erreur réseau, NaN) est « inconnu ». */
export const isKnownStatusCode = (statusCode: number | undefined): statusCode is number =>
  Number.isInteger(statusCode) && (statusCode as number) >= 100 && (statusCode as number) <= 599
