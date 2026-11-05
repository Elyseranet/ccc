import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { SCORE_FAILURE, SCORE_FIELD_ERROR, SCORE_FORM_ERROR } from '../enums/score-entry.enum.js'
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_PAYLOAD_TOO_LARGE,
  HTTP_STATUS_PRECONDITION_FAILED,
  HTTP_STATUS_PRECONDITION_REQUIRED,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_UNPROCESSABLE
} from './http-status.const.js'

/** Échec par code d'erreur du contrat : le code prime sur le statut. */
export const SCORE_FAILURE_BY_CODE: Partial<Record<API_ERROR_CODE, SCORE_FAILURE>> = {
  [API_ERROR_CODE.VERSION_CONFLICT]: SCORE_FAILURE.VERSION_CONFLICT,
  [API_ERROR_CODE.MATCH_ALREADY_VALIDATED]: SCORE_FAILURE.ALREADY_VALIDATED,
  [API_ERROR_CODE.NEXT_ROUND_ENGAGED]: SCORE_FAILURE.NEXT_ROUND_ENGAGED,
  [API_ERROR_CODE.SCORE_INCONSISTENT]: SCORE_FAILURE.INCONSISTENT,
  [API_ERROR_CODE.CONFLICT]: SCORE_FAILURE.CONFLICT,
  [API_ERROR_CODE.PRECONDITION_REQUIRED]: SCORE_FAILURE.FRONT_DEFECT,
  [API_ERROR_CODE.SCORE_MISMATCH]: SCORE_FAILURE.FRONT_DEFECT,
  [API_ERROR_CODE.PAYLOAD_TOO_LARGE]: SCORE_FAILURE.PAYLOAD_TOO_LARGE
}

/** Échec par statut HTTP, quand le code n'est pas dans la table. 400 (Content-Type absent, corps mal formé) est un défaut du front. */
export const SCORE_FAILURE_BY_STATUS: Record<number, SCORE_FAILURE> = {
  [HTTP_STATUS_BAD_REQUEST]: SCORE_FAILURE.FRONT_DEFECT,
  [HTTP_STATUS_UNAUTHORIZED]: SCORE_FAILURE.UNAUTHORIZED,
  [HTTP_STATUS_FORBIDDEN]: SCORE_FAILURE.FORBIDDEN,
  [HTTP_STATUS_PRECONDITION_FAILED]: SCORE_FAILURE.VERSION_CONFLICT,
  [HTTP_STATUS_PAYLOAD_TOO_LARGE]: SCORE_FAILURE.PAYLOAD_TOO_LARGE,
  [HTTP_STATUS_UNPROCESSABLE]: SCORE_FAILURE.INCONSISTENT,
  [HTTP_STATUS_PRECONDITION_REQUIRED]: SCORE_FAILURE.FRONT_DEFECT
}

/** Un échec qui rend la ligne périmée : on la recharge. */
export const SCORE_FAILURES_RELOADING: readonly SCORE_FAILURE[] = [
  SCORE_FAILURE.VERSION_CONFLICT,
  SCORE_FAILURE.ALREADY_VALIDATED,
  SCORE_FAILURE.CONFLICT
]

export const SCORE_FAILURE_TEXT: Record<SCORE_FAILURE, { key: string, label: string }> = {
  [SCORE_FAILURE.VERSION_CONFLICT]: { key: 'admin.matches.failure_version_conflict', label: 'Ce match a été modifié, rechargez.' },
  [SCORE_FAILURE.ALREADY_VALIDATED]: { key: 'admin.matches.failure_already_validated', label: 'Ce match est déjà validé avec un autre score.' },
  [SCORE_FAILURE.NEXT_ROUND_ENGAGED]: { key: 'admin.matches.failure_next_round_engaged', label: 'Le tour suivant est engagé : le score ne peut plus être corrigé.' },
  [SCORE_FAILURE.INCONSISTENT]: { key: 'admin.matches.failure_inconsistent', label: 'Le score n’est pas valable : le vainqueur doit atteindre exactement la cible.' },
  [SCORE_FAILURE.CONFLICT]: { key: 'admin.matches.failure_conflict', label: 'Ce match ne peut plus être modifié (édition archivée, tour fermé ou score non saisi). Rechargez.' },
  [SCORE_FAILURE.FORBIDDEN]: { key: 'admin.matches.failure_forbidden', label: 'Vous n’avez pas le droit de saisir ce score.' },
  [SCORE_FAILURE.UNAUTHORIZED]: { key: 'admin.matches.failure_unauthorized', label: 'Votre session a expiré. Reconnectez-vous.' },
  [SCORE_FAILURE.PAYLOAD_TOO_LARGE]: { key: 'admin.matches.failure_payload_too_large', label: 'La requête est trop volumineuse.' },
  [SCORE_FAILURE.OFFLINE]: { key: 'admin.matches.failure_offline', label: 'Pas de connexion : le score n’est pas parti. Réessayez.' },
  [SCORE_FAILURE.FRONT_DEFECT]: { key: 'admin.matches.failure_front_defect', label: 'Une erreur interne empêche l’envoi du score. Rechargez la page.' },
  [SCORE_FAILURE.UNKNOWN]: { key: 'admin.matches.failure_unknown', label: 'L’enregistrement a échoué. Réessayez dans un instant.' }
}

export const SCORE_FIELD_ERROR_TEXT: Record<SCORE_FIELD_ERROR, { key: string, label: string }> = {
  [SCORE_FIELD_ERROR.MISSING]: { key: 'admin.matches.error_missing', label: 'Saisissez un score.' },
  [SCORE_FIELD_ERROR.NOT_INTEGER]: { key: 'admin.matches.error_not_integer', label: 'Le score est un nombre entier, sans signe.' },
  [SCORE_FIELD_ERROR.ABOVE_TARGET]: { key: 'admin.matches.error_above_target', label: 'Le score ne dépasse pas {target}.' }
}

export const SCORE_FORM_ERROR_TEXT: Record<SCORE_FORM_ERROR, { key: string, label: string }> = {
  [SCORE_FORM_ERROR.NO_WINNER]: { key: 'admin.matches.error_no_winner', label: 'Un joueur doit marquer exactement {target}.' },
  [SCORE_FORM_ERROR.SEVERAL_WINNERS]: { key: 'admin.matches.error_several_winners', label: 'Un seul joueur peut atteindre {target}.' },
  [SCORE_FORM_ERROR.INCONSISTENT]: { key: 'admin.matches.error_inconsistent', label: 'Le score n’est pas valable pour ce format de match.' }
}

/** Longueur maximale d'un champ de score : « 10 » est le plus long. */
export const SCORE_INPUT_MAX_LENGTH = 2

/** Un champ de score est un entier sans signe. */
export const SCORE_INPUT_PATTERN = /^\d+$/

/** Largeur d'écran (px) sous laquelle la saisie s'ouvre en tiroir bas plutôt qu'en dialogue (bascule de la maquette). */
export const SCORE_SHEET_BREAKPOINT_PX = 1000

/** Largeur maximale (px) de la confirmation de validation. */
export const SCORE_CONFIRM_MAX_WIDTH = 440

/** Durée d'affichage (ms) du message de confirmation (« classement recalculé »). */
export const SCORE_SNACKBAR_TIMEOUT_MS = 5000
