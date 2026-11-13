import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_FORBIDDEN, HTTP_STATUS_UNAUTHORIZED, HTTP_STATUS_UNPROCESSABLE } from './http-status.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { QUALIFICATION_BLOCKER, QUALIFICATION_FAILURE, QUALIFICATION_PARAMETER_ERROR, QUALIFICATION_RANK_STATUS, QUALIFICATION_ROUTE, QUALIFICATION_STEP } from '../enums/qualification.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import { EDITION_CHIP_FAMILY } from '../enums/edition-tab.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'

/** Un champ de paramètre est un entier de 1 à 3 chiffres (les bornes liées à l'édition sont contrôlées à part). */
export const QUALIFICATION_INTEGER_PATTERN = /^\d{1,3}$/

export const QUALIFICATION_PERCENT_BASE = 100

/** Un départage créé dont le score n'est pas validé : il attend d'être joué et saisi dans « Poules et matchs ». */
export const OPEN_TIEBREAK_STATUSES: readonly MATCH_STATUS[] = [MATCH_STATUS.SCHEDULED, MATCH_STATUS.RECORDED]

/** Délai avant de relancer la simulation après une frappe : une requête par pause, pas une par touche. */
export const QUALIFICATION_SIMULATION_DELAY_MS = 400

/** Clé de cache de l'état de la qualification : fixe, comme celle de la file des matchs (l'édition active n'est connue qu'après son chargement). */
export const ADMIN_QUALIFICATION_ASYNC_KEY = 'admin-qualification'

/** Durée du message « Liste arrêtée », comme les autres confirmations de l'admin. */
export const QUALIFICATION_SNACKBAR_TIMEOUT_MS = 4000

/** Statut d'une ligne du classement : texte et famille de pastille (le statut ne tient jamais à la couleur seule). */
export const QUALIFICATION_RANK_STATUS_VIEW: Record<QUALIFICATION_RANK_STATUS, { label: ITranslatableText, family: EDITION_CHIP_FAMILY }> = {
  [QUALIFICATION_RANK_STATUS.QUALIFIED]: { label: { key: 'admin.qualification.rank_qualified', fallback: 'Qualifié (provisoire)' }, family: EDITION_CHIP_FAMILY.TINTED_SUCCESS },
  [QUALIFICATION_RANK_STATUS.TIE]: { label: { key: 'admin.qualification.rank_tie', fallback: 'Égalité à départager' }, family: EDITION_CHIP_FAMILY.TINTED_WARNING },
  [QUALIFICATION_RANK_STATUS.ELIMINATED]: { label: { key: 'admin.qualification.rank_eliminated', fallback: 'Éliminé' }, family: EDITION_CHIP_FAMILY.NEUTRAL }
}

/** Voie d'un qualifié dans l'aperçu : « Direct » pour un des n premiers, « Meilleur (n+1)e » pour un repêché entre poules. */
export const QUALIFICATION_ROUTE_VIEW: Record<QUALIFICATION_ROUTE, { label: ITranslatableText, family: EDITION_CHIP_FAMILY }> = {
  [QUALIFICATION_ROUTE.TOP_OF_POOL]: { label: { key: 'admin.qualification.route_direct', fallback: 'Direct' }, family: EDITION_CHIP_FAMILY.TINTED_SUCCESS },
  [QUALIFICATION_ROUTE.BEST_NEXT]: { label: { key: 'admin.qualification.route_best_next', fallback: 'Meilleur (n+1)e' }, family: EDITION_CHIP_FAMILY.TINTED_INFO }
}

/** Libellé des étapes de la page (le stepper les écrit en toutes lettres). */
export const QUALIFICATION_STEP_LABELS: Record<QUALIFICATION_STEP, ITranslatableText> = {
  [QUALIFICATION_STEP.PREREQUISITES]: { key: 'admin.qualification.step_prerequisites', fallback: 'Poules validées' },
  [QUALIFICATION_STEP.TIES]: { key: 'admin.qualification.step_ties', fallback: 'Égalités' },
  [QUALIFICATION_STEP.PARAMETERS]: { key: 'admin.qualification.step_parameters', fallback: 'Paramètres' },
  [QUALIFICATION_STEP.FINALIZE]: { key: 'admin.qualification.step_finalize', fallback: 'Arrêter la liste' }
}

/** Raison écrite sous un bouton inactif (`{pending}` matchs à valider, `{ties}` égalités restantes). */
export const QUALIFICATION_BLOCKER_TEXT: Record<QUALIFICATION_BLOCKER, ITranslatableText> = {
  [QUALIFICATION_BLOCKER.PENDING_MATCHES]: { key: 'admin.qualification.blocker_pending', fallback: 'Indisponible : {pending} matchs de poule à valider.' },
  [QUALIFICATION_BLOCKER.TIES_LEFT]: { key: 'admin.qualification.blocker_ties', fallback: 'Indisponible : {ties} égalités restantes.' },
  [QUALIFICATION_BLOCKER.PENDING_AND_TIES]: { key: 'admin.qualification.blocker_pending_and_ties', fallback: 'Indisponible : {ties} égalités restantes et {pending} matchs de poule à valider.' },
  [QUALIFICATION_BLOCKER.TIEBREAK_OPEN]: { key: 'admin.qualification.blocker_tiebreak_open', fallback: 'Départage créé : saisissez son score dans « Poules et matchs ».' },
  [QUALIFICATION_BLOCKER.INVALID_PARAMETERS]: { key: 'admin.qualification.blocker_invalid_parameters', fallback: 'Indisponible : corrigez les paramètres de qualification.' },
  [QUALIFICATION_BLOCKER.CLOSED]: { key: 'admin.qualification.blocker_closed', fallback: 'Indisponible : l’édition est clôturée.' }
}

export const QUALIFICATION_PARAMETER_ERROR_TEXT: Record<QUALIFICATION_PARAMETER_ERROR, ITranslatableText> = {
  [QUALIFICATION_PARAMETER_ERROR.NOT_INTEGER]: { key: 'admin.qualification.error_not_integer', fallback: 'Saisissez un nombre entier.' },
  [QUALIFICATION_PARAMETER_ERROR.TOO_LOW]: { key: 'admin.qualification.error_too_low', fallback: 'Valeur trop basse : minimum {min}.' },
  [QUALIFICATION_PARAMETER_ERROR.TOO_HIGH]: { key: 'admin.qualification.error_too_high', fallback: 'Valeur trop haute : maximum {max}.' }
}

/** Échec d'écriture par code d'erreur du contrat (B-13), puis par statut HTTP quand le code n'est pas dans la table. */
export const QUALIFICATION_FAILURE_BY_CODE: Partial<Record<API_ERROR_CODE, QUALIFICATION_FAILURE>> = {
  [API_ERROR_CODE.QUALIFICATION_NOT_READY]: QUALIFICATION_FAILURE.NOT_READY,
  [API_ERROR_CODE.TIEBREAK_NOT_REQUIRED]: QUALIFICATION_FAILURE.TIEBREAK_NOT_REQUIRED,
  [API_ERROR_CODE.QUALIFICATION_ALREADY_DONE]: QUALIFICATION_FAILURE.ALREADY_DONE,
  [API_ERROR_CODE.EDITION_CLOSED]: QUALIFICATION_FAILURE.CLOSED,
  [API_ERROR_CODE.VALIDATION_FAILED]: QUALIFICATION_FAILURE.INVALID
}

export const QUALIFICATION_FAILURE_BY_STATUS: Record<number, QUALIFICATION_FAILURE> = {
  [HTTP_STATUS_BAD_REQUEST]: QUALIFICATION_FAILURE.INVALID,
  [HTTP_STATUS_UNPROCESSABLE]: QUALIFICATION_FAILURE.INVALID,
  [HTTP_STATUS_UNAUTHORIZED]: QUALIFICATION_FAILURE.UNAUTHORIZED,
  [HTTP_STATUS_FORBIDDEN]: QUALIFICATION_FAILURE.FORBIDDEN
}

/** Un échec qui rend l'état affiché périmé : on invite à recharger (bouton « Recharger »). */
export const QUALIFICATION_STALE_FAILURES: readonly QUALIFICATION_FAILURE[] = [
  QUALIFICATION_FAILURE.NOT_READY,
  QUALIFICATION_FAILURE.TIEBREAK_NOT_REQUIRED,
  QUALIFICATION_FAILURE.ALREADY_DONE
]

export const QUALIFICATION_FAILURE_TEXT: Record<QUALIFICATION_FAILURE, { title: ITranslatableText, body: ITranslatableText }> = {
  [QUALIFICATION_FAILURE.NOT_READY]: {
    title: { key: 'admin.qualification.failure_not_ready_title', fallback: 'La liste ne peut pas être arrêtée.' },
    body: { key: 'admin.qualification.failure_not_ready_body', fallback: 'Un match de poule ou un départage reste à valider. Rechargez pour voir l’état actuel.' }
  },
  [QUALIFICATION_FAILURE.TIEBREAK_NOT_REQUIRED]: {
    title: { key: 'admin.qualification.failure_tiebreak_title', fallback: 'Les données de l’édition ont changé depuis votre dernière lecture.' },
    body: { key: 'admin.qualification.failure_tiebreak_body', fallback: 'Cette égalité n’existe plus. Rechargez pour voir l’état actuel.' }
  },
  [QUALIFICATION_FAILURE.ALREADY_DONE]: {
    title: { key: 'admin.qualification.failure_already_done_title', fallback: 'La liste est déjà arrêtée.' },
    body: { key: 'admin.qualification.failure_already_done_body', fallback: 'Rechargez pour voir l’état actuel.' }
  },
  [QUALIFICATION_FAILURE.INVALID]: {
    title: { key: 'admin.qualification.failure_invalid_title', fallback: 'Ces paramètres ne sont pas valables.' },
    body: { key: 'admin.qualification.failure_invalid_body', fallback: 'Corrigez les champs puis réessayez.' }
  },
  [QUALIFICATION_FAILURE.CLOSED]: {
    title: { key: 'admin.qualification.failure_closed_title', fallback: 'L’édition est clôturée.' },
    body: { key: 'admin.qualification.failure_closed_body', fallback: 'Ses résultats sont figés : la qualification ne se modifie plus.' }
  },
  [QUALIFICATION_FAILURE.FORBIDDEN]: {
    title: { key: 'admin.qualification.failure_forbidden_title', fallback: 'Vous n’avez pas le droit de faire cela.' },
    body: { key: 'admin.qualification.failure_forbidden_body', fallback: 'Seul un administrateur peut arrêter la liste.' }
  },
  [QUALIFICATION_FAILURE.UNAUTHORIZED]: {
    title: { key: 'admin.qualification.failure_unauthorized_title', fallback: 'Votre session a expiré.' },
    body: { key: 'admin.qualification.failure_unauthorized_body', fallback: 'Reconnectez-vous, puis recommencez.' }
  },
  [QUALIFICATION_FAILURE.OFFLINE]: {
    title: { key: 'admin.qualification.failure_offline_title', fallback: 'Pas de connexion.' },
    body: { key: 'admin.qualification.failure_offline_body', fallback: 'Rien n’est parti. Réessayez dans un instant.' }
  },
  [QUALIFICATION_FAILURE.UNKNOWN]: {
    title: { key: 'admin.qualification.failure_unknown_title', fallback: 'L’opération a échoué.' },
    body: { key: 'admin.qualification.failure_unknown_body', fallback: 'Réessayez dans un instant.' }
  }
}
