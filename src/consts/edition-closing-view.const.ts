import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { CLOSING_FAILURE, CLOSING_NOTICE } from '../enums/edition-closing-view.enum.js'
import { FINAL_STAGE } from '../enums/participation.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import { FINAL_STAGE_ORDER } from './edition-closing.const.js'
import { HTTP_STATUS_FORBIDDEN, HTTP_STATUS_NOT_FOUND, HTTP_STATUS_UNAUTHORIZED } from './http-status.const.js'

/** Clé de cache fixe de la page : le changement d'édition relance la requête (même raison que `useMatchQueue`). */
export const ADMIN_CLOSING_ASYNC_KEY = 'admin-edition-closing'

export const CLOSING_FAILURE_BY_CODE: Partial<Record<API_ERROR_CODE, CLOSING_FAILURE>> = {
  [API_ERROR_CODE.FINAL_NOT_VALIDATED]: CLOSING_FAILURE.FINAL_NOT_VALIDATED
}

export const CLOSING_FAILURE_BY_STATUS: Record<number, CLOSING_FAILURE> = {
  [HTTP_STATUS_UNAUTHORIZED]: CLOSING_FAILURE.UNAUTHORIZED,
  [HTTP_STATUS_FORBIDDEN]: CLOSING_FAILURE.FORBIDDEN,
  [HTTP_STATUS_NOT_FOUND]: CLOSING_FAILURE.NOT_FOUND
}

/** Un échec dont l'état affiché peut être périmé : le bouton « Vérifier l'état » relit l'édition. */
export const CLOSING_VERIFIABLE_FAILURES: readonly CLOSING_FAILURE[] = [
  CLOSING_FAILURE.FINAL_NOT_VALIDATED,
  CLOSING_FAILURE.OFFLINE,
  CLOSING_FAILURE.UNKNOWN
]

export const CLOSING_FAILURE_TEXT: Record<CLOSING_FAILURE, { title: ITranslatableText, body: ITranslatableText }> = {
  [CLOSING_FAILURE.FINAL_NOT_VALIDATED]: {
    title: { key: 'admin.closing.failure_final_title', fallback: 'La finale n’est pas validée.' },
    body: { key: 'admin.closing.failure_final_body', fallback: 'La clôture n’est possible qu’après validation de la finale. Vérifiez l’état de l’édition.' }
  },
  [CLOSING_FAILURE.UNAUTHORIZED]: {
    title: { key: 'admin.closing.failure_unauthorized_title', fallback: 'Votre session a expiré.' },
    body: { key: 'admin.closing.failure_unauthorized_body', fallback: 'Reconnectez-vous pour clôturer l’édition.' }
  },
  [CLOSING_FAILURE.FORBIDDEN]: {
    title: { key: 'admin.closing.failure_forbidden_title', fallback: 'Action réservée aux organisateurs.' },
    body: { key: 'admin.closing.failure_forbidden_body', fallback: 'Votre compte ne peut pas clôturer une édition.' }
  },
  [CLOSING_FAILURE.NOT_FOUND]: {
    title: { key: 'admin.closing.failure_not_found_title', fallback: 'Cette édition n’existe plus.' },
    body: { key: 'admin.closing.failure_not_found_body', fallback: 'Choisissez une édition dans le sélecteur de la barre haute.' }
  },
  [CLOSING_FAILURE.OFFLINE]: {
    title: { key: 'admin.closing.failure_offline_title', fallback: 'La clôture n’a pas pu être confirmée.' },
    body: { key: 'admin.closing.failure_offline_body', fallback: 'Vérifiez l’état de l’édition avant de réessayer.' }
  },
  [CLOSING_FAILURE.UNKNOWN]: {
    title: { key: 'admin.closing.failure_unknown_title', fallback: 'La clôture n’a pas pu être confirmée.' },
    body: { key: 'admin.closing.failure_unknown_body', fallback: 'Vérifiez l’état de l’édition avant de réessayer.' }
  }
}

/** Libellé de chaque résultat du tableau d'aperçu (RG1), du plus haut au plus bas dans `CLOSING_STAGES_DESC`. */
export const CLOSING_STAGE_TEXT: Record<FINAL_STAGE, ITranslatableText> = {
  [FINAL_STAGE.CHAMPION]: { key: 'admin.closing.stage_champion', fallback: 'Champion·ne' },
  [FINAL_STAGE.FINALIST]: { key: 'admin.closing.stage_finalist', fallback: 'Finaliste' },
  [FINAL_STAGE.SEMI]: { key: 'admin.closing.stage_semi', fallback: 'Demi-finaliste' },
  [FINAL_STAGE.QUARTER]: { key: 'admin.closing.stage_quarter', fallback: 'Quart de finaliste' },
  [FINAL_STAGE.ROUND_OF_16]: { key: 'admin.closing.stage_round_of_16', fallback: 'Huitième de finaliste' },
  [FINAL_STAGE.PLAYOFF]: { key: 'admin.closing.stage_playoff', fallback: 'Barragiste' },
  [FINAL_STAGE.POOL_ELIMINATED]: { key: 'admin.closing.stage_pool_eliminated', fallback: 'Éliminé·e en poule' }
}

export const CLOSING_STAGES_DESC: readonly FINAL_STAGE[] = [...FINAL_STAGE_ORDER].reverse()

/** Statut `origam-alert` de chaque message d'état. */
export const CLOSING_STATE_STATUS: Record<CLOSING_NOTICE, 'info' | 'success'> = {
  [CLOSING_NOTICE.BLOCKED]: 'info',
  [CLOSING_NOTICE.CLOSED]: 'info',
  [CLOSING_NOTICE.SUCCESS]: 'success'
}

/** Tour qui doit exister dans l'édition pour que le résultat soit possible (RG3) ; `null` : une élimination en poule est toujours possible. */
export const CLOSING_ROUND_KIND_BY_STAGE: Readonly<Record<FINAL_STAGE, ROUND_KIND | null>> = {
  [FINAL_STAGE.CHAMPION]: ROUND_KIND.FINAL,
  [FINAL_STAGE.FINALIST]: ROUND_KIND.FINAL,
  [FINAL_STAGE.SEMI]: ROUND_KIND.SEMI,
  [FINAL_STAGE.QUARTER]: ROUND_KIND.QUARTER,
  [FINAL_STAGE.ROUND_OF_16]: ROUND_KIND.ROUND_OF_16,
  [FINAL_STAGE.PLAYOFF]: ROUND_KIND.PLAYOFF,
  [FINAL_STAGE.POOL_ELIMINATED]: null
}
