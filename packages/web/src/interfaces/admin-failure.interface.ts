import type { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { ITranslatableText } from './common-components.interface.js'

/** Texte d'une alerte d'erreur : un titre et un texte traduisibles. */
export interface IAdminFailureText {
  title: ITranslatableText
  text: ITranslatableText
}

/** Message d'alerte d'une écriture refusée, avec le statut HTTP de l'erreur (404, 409, 412…). */
export interface IAdminFailure extends IAdminFailureText {
  statusCode: number
  /** Code d'erreur de l'API, quand la réponse en porte un (VERSION_CONFLICT…). */
  code: API_ERROR_CODE | null
}

/** Les messages d'un écran : un par code d'erreur connu, plus ceux d'un échec sans réponse et d'un échec inconnu. */
export interface IAdminFailureMessages {
  byCode: Partial<Record<API_ERROR_CODE, IAdminFailureText>>
  offline: IAdminFailureText
  unknown: IAdminFailureText
}
