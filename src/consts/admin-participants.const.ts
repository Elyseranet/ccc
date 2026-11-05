import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { ACCOUNT_STATE } from '../enums/user.enum.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import { AVATAR_MAX_BYTES } from './avatar.const.js'

/** Largeur de chaque colonne de la table des inscrits, en pourcentage : celles de la maquette à 1440 px (648 px : 170, 94, 89, 156 et 139 px), pour que la mise en page ne dépende pas des noms affichés. */
export const PARTICIPANT_COLUMN_WIDTHS = { displayName: '26%', nickname: '14.5%', editionsPlayed: '13.5%', accountState: '24%', actions: '22%' } as const

/** Largeur minimale de chaque colonne : celle de la maquette à 390 px, où la table défile dans son conteneur (170, 94, 89, 156 et 117 px, soit 626 px). */
export const PARTICIPANT_COLUMN_MIN_WIDTHS = { displayName: '170px', nickname: '94px', editionsPlayed: '89px', accountState: '156px', actions: '117px' } as const

/** Inscrits par page de la table (maquette : « 1–8 sur 44 »). */
export const ADMIN_PARTICIPANTS_PAGE_SIZE = 8

/** La recherche attend le minimum de `GET /competiteurs?q=` (`COMPETITOR_SEARCH_MIN_LENGTH`, 400 en dessous). */
export const PARTICIPANT_SEARCH_PAGE_SIZE = 8
export const PARTICIPANT_SEARCH_DEBOUNCE_MS = 300

/** Valeur de l'entrée « Créer un nouveau participant » du menu : jamais un identifiant de profil. */
export const PARTICIPANT_CREATE_VALUE = '__create__'

export const PARTICIPANT_SNACKBAR_TIMEOUT_MS = 4000

/** Types acceptés par le champ photo (B-16) ; le serveur reste seul juge, par la signature du fichier. */
export const PARTICIPANT_AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'
export const PARTICIPANT_AVATAR_MAX_BYTES = AVATAR_MAX_BYTES

/** Clé de cache de la liste admin des inscrits. */
export const ADMIN_PARTICIPANTS_CACHE_KEY = 'admin-participants'

export const PARTICIPANT_ACCOUNT_CHIPS: Record<ACCOUNT_STATE, { text: ITranslatableText, color: string, bgColor: string }> = {
  [ACCOUNT_STATE.ACTIVE]: { text: { key: 'admin.participants.account_active', fallback: 'Actif' }, color: 'success', bgColor: 'var(--origam-color__feedback--success---bgSubtle)' },
  [ACCOUNT_STATE.INVITED]: { text: { key: 'admin.participants.account_invited', fallback: 'Invité' }, color: 'warning', bgColor: 'var(--origam-color__feedback--warning---bgSubtle)' },
  [ACCOUNT_STATE.INVITATION_EXPIRED]: { text: { key: 'admin.participants.account_expired', fallback: 'Invitation expirée' }, color: 'error', bgColor: 'var(--origam-color__feedback--danger---bgSubtle)' }
}

/** Texte d'un compétiteur d'archive, sans compte : il ne peut pas être invité depuis cet écran. */
export const PARTICIPANT_NO_ACCOUNT_TEXT: ITranslatableText = { key: 'admin.participants.account_none', fallback: 'Sans compte' }

/** Une clé de traduction par code d'erreur de l'API (B-10, B-16, B-09). */
export const PARTICIPANT_ERROR_MESSAGES: Partial<Record<API_ERROR_CODE, ITranslatableText>> = {
  [API_ERROR_CODE.PARTICIPANT_ALREADY_REGISTERED]: { key: 'admin.participants.error_already_registered', fallback: 'Ce joueur est déjà inscrit à cette édition.' },
  [API_ERROR_CODE.REGISTRATION_CLOSED]: { key: 'admin.participants.error_registration_closed', fallback: 'Les inscriptions sont closes : le tirage des poules est validé.' },
  [API_ERROR_CODE.EDITION_CLOSED]: { key: 'admin.participants.error_edition_closed', fallback: 'Cette édition est clôturée : elle est en lecture seule.' },
  [API_ERROR_CODE.EMAIL_ALREADY_USED]: { key: 'admin.participants.error_email_used', fallback: 'Cet email est déjà rattaché à un autre compte. Rattachez le profil existant ou corrigez l’email.' },
  [API_ERROR_CODE.COMPETITOR_NOT_FOUND]: { key: 'admin.participants.error_competitor_not_found', fallback: 'Ce profil n’existe plus.' },
  [API_ERROR_CODE.VALIDATION_FAILED]: { key: 'admin.participants.error_validation', fallback: 'Certaines informations sont invalides ou trop longues : corrigez-les puis réessayez.' },
  [API_ERROR_CODE.UNAUTHORIZED]: { key: 'admin.participants.error_unauthorized', fallback: 'Votre session a expiré : reconnectez-vous.' },
  [API_ERROR_CODE.FORBIDDEN]: { key: 'admin.participants.error_forbidden', fallback: 'Cette action est réservée aux administrateurs.' },
  [API_ERROR_CODE.AVATAR_TOO_LARGE]: { key: 'admin.participants.error_avatar_too_large', fallback: 'La photo dépasse 2 Mo.' },
  [API_ERROR_CODE.AVATAR_UNSUPPORTED_TYPE]: { key: 'admin.participants.error_avatar_type', fallback: 'La photo doit être au format JPEG, PNG ou WebP.' },
  [API_ERROR_CODE.AVATAR_UNREADABLE]: { key: 'admin.participants.error_avatar_unreadable', fallback: 'La photo est illisible : choisissez une autre image.' },
  [API_ERROR_CODE.REQUEST_TIMEOUT]: { key: 'admin.participants.error_timeout', fallback: 'L’envoi a pris trop de temps : réessayez.' },
  [API_ERROR_CODE.RATE_LIMITED]: { key: 'admin.participants.error_rate_limited', fallback: 'Trop de demandes : patientez un instant puis réessayez.' }
}

export const PARTICIPANT_ERROR_OFFLINE: ITranslatableText = { key: 'admin.participants.error_offline', fallback: 'Hors ligne : vérifiez votre connexion puis réessayez.' }
export const PARTICIPANT_ERROR_UNKNOWN: ITranslatableText = { key: 'admin.participants.error_unknown', fallback: 'Une erreur est survenue : réessayez.' }
