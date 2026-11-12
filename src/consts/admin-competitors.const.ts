import { ALIGN } from 'origam/enums'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { IAdminCompetitorColumn } from '../interfaces/admin-competitors.interface.js'
import type { IAdminFailureMessages } from '../interfaces/admin-failure.interface.js'

/** Compétiteurs par page de l'annuaire admin (maquette : « 1–10 sur 145 »). */
export const ADMIN_COMPETITORS_PAGE_SIZE = 10

/** La recherche attend la frappe avant de requêter (la recherche est limitée en débit). */
export const ADMIN_COMPETITORS_SEARCH_DEBOUNCE_MS = 300

/** Portée de la clé de cache de l'annuaire admin (`competitors:admin`), distincte de celle de l'annuaire public. */
export const ADMIN_COMPETITORS_CACHE_SCOPE = 'admin'

/** Paramètres d'URL de l'annuaire admin. */
export const ADMIN_COMPETITORS_QUERY_KEYS = { SEARCH: 'q', PAGE: 'page' } as const

/** Côté de l'avatar de la fiche (maquette : 5,5 rem, soit 88 px). */
export const ADMIN_COMPETITOR_PHOTO_SIZE = 88

/** Pastilles de page visibles dans la pagination. */
export const ADMIN_COMPETITORS_PAGINATION_VISIBLE = 5

export const ADMIN_COMPETITOR_COLUMNS: IAdminCompetitorColumn[] = [
  { field: 'displayName', title: { key: 'admin.competitors.column_display_name', fallback: 'Nom affiché' }, width: '191px', minWidth: '191px' },
  { field: 'firstName', title: { key: 'admin.competitors.column_first_name', fallback: 'Prénom' }, width: '85px', minWidth: '85px' },
  { field: 'lastName', title: { key: 'admin.competitors.column_last_name', fallback: 'Nom' }, width: '88px', minWidth: '88px' },
  { field: 'nickname', title: { key: 'admin.competitors.column_nickname', fallback: 'Pseudo' }, width: '119px', minWidth: '119px' },
  { field: 'editionsPlayed', title: { key: 'admin.competitors.column_editions', fallback: 'Éditions' }, align: ALIGN.END, width: '89px', minWidth: '89px' },
  { field: 'actions', title: { key: 'admin.competitors.column_action', fallback: 'Action' }, align: ALIGN.END, width: '111px', minWidth: '111px' }
]

/** Messages d'alerte des écritures d'identité (B-10, T-SEC-10 : 428 sans `If-Match`, 412 si la version est périmée). */
export const ADMIN_COMPETITOR_FAILURE_MESSAGES: IAdminFailureMessages = {
  byCode: {
    [API_ERROR_CODE.VERSION_CONFLICT]: {
      title: { key: 'admin.competitors.error_version_title', fallback: 'Ce compétiteur a été modifié, rechargez.' },
      text: { key: 'admin.competitors.error_version_text', fallback: 'La fiche a été rechargée avec ses valeurs actuelles : vérifiez-les puis enregistrez de nouveau.' }
    },
    [API_ERROR_CODE.PRECONDITION_REQUIRED]: {
      title: { key: 'admin.competitors.error_precondition_title', fallback: 'Enregistrement impossible.' },
      text: { key: 'admin.competitors.error_precondition_text', fallback: 'La version de la fiche est inconnue : rechargez la page puis réessayez.' }
    },
    [API_ERROR_CODE.VALIDATION_FAILED]: {
      title: { key: 'admin.competitors.error_validation_title', fallback: 'Le formulaire contient une erreur.' },
      text: { key: 'admin.competitors.error_validation_text', fallback: 'Le nom affiché est obligatoire ; les noms et le pseudo sont limités en longueur.' }
    },
    [API_ERROR_CODE.COMPETITOR_NOT_FOUND]: {
      title: { key: 'admin.competitors.error_not_found_title', fallback: 'Compétiteur introuvable.' },
      text: { key: 'admin.competitors.error_not_found_text', fallback: 'Ce profil n’existe plus : revenez à l’annuaire.' }
    },
    [API_ERROR_CODE.UNAUTHORIZED]: {
      title: { key: 'admin.competitors.error_unauthorized_title', fallback: 'Session expirée.' },
      text: { key: 'admin.competitors.error_unauthorized_text', fallback: 'Votre session a expiré : reconnectez-vous.' }
    },
    [API_ERROR_CODE.FORBIDDEN]: {
      title: { key: 'admin.competitors.error_forbidden_title', fallback: 'Action refusée.' },
      text: { key: 'admin.competitors.error_forbidden_text', fallback: 'Cette action est réservée aux administrateurs.' }
    },
    [API_ERROR_CODE.RATE_LIMITED]: {
      title: { key: 'admin.competitors.error_rate_limited_title', fallback: 'Trop de demandes.' },
      text: { key: 'admin.competitors.error_rate_limited_text', fallback: 'Patientez un instant puis réessayez.' }
    },
    [API_ERROR_CODE.REQUEST_TIMEOUT]: {
      title: { key: 'admin.competitors.error_timeout_title', fallback: 'Délai dépassé.' },
      text: { key: 'admin.competitors.error_timeout_text', fallback: 'L’envoi a pris trop de temps : réessayez.' }
    }
  },
  offline: {
    title: { key: 'admin.competitors.error_offline_title', fallback: 'Hors ligne.' },
    text: { key: 'admin.competitors.error_offline_text', fallback: 'Vérifiez votre connexion puis réessayez.' }
  },
  unknown: {
    title: { key: 'admin.competitors.error_unknown_title', fallback: 'Une erreur est survenue.' },
    text: { key: 'admin.competitors.error_unknown_text', fallback: 'L’enregistrement a échoué : réessayez.' }
  }
}
