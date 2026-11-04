import { ACCOUNT_ERROR, ACCOUNT_STATE_TONE, PROFILE_FIELD } from '../enums/account.enum.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { IAccountMessage } from '../interfaces/account.interface.js'
import { AVATAR_MAX_BYTES } from './avatar.const.js'

/** La phrase affichée pour chaque cause d'échec. Le serveur fait foi : ces messages ne répètent jamais son texte brut. */
export const ACCOUNT_ERROR_MESSAGES: Record<ACCOUNT_ERROR, IAccountMessage> = {
  [ACCOUNT_ERROR.INVALID_CREDENTIALS]: { key: 'account.error.invalid_credentials', label: 'Email ou mot de passe incorrect.' },
  [ACCOUNT_ERROR.INVALID_CURRENT_PASSWORD]: { key: 'account.error.invalid_current_password', label: 'Le mot de passe actuel est incorrect.' },
  [ACCOUNT_ERROR.RATE_LIMITED]: { key: 'account.error.rate_limited', label: 'Trop de tentatives. Réessayez dans quelques instants.' },
  [ACCOUNT_ERROR.VALIDATION_FAILED]: { key: 'account.error.validation_failed', label: 'Certaines informations sont invalides. Vérifiez les champs puis réessayez.' },
  [ACCOUNT_ERROR.LINK_GONE]: { key: 'account.error.link_gone', label: 'Ce lien d’invitation a expiré ou a déjà été utilisé.' },
  [ACCOUNT_ERROR.LINK_UNKNOWN]: { key: 'account.error.link_unknown', label: 'Ce lien d’invitation n’existe pas.' },
  [ACCOUNT_ERROR.SESSION_EXPIRED]: { key: 'account.error.session_expired', label: 'Votre session a expiré. Reconnectez-vous.' },
  [ACCOUNT_ERROR.FORBIDDEN]: { key: 'account.error.forbidden', label: 'Cette action n’est pas autorisée depuis ce compte.' },
  [ACCOUNT_ERROR.BODY_REJECTED]: { key: 'account.error.body_rejected', label: 'La requête a été refusée (format ou taille). Rechargez la page puis réessayez.' },
  [ACCOUNT_ERROR.AVATAR_TOO_LARGE]: { key: 'account.error.avatar_too_large', label: 'L’image dépasse 2 Mo.' },
  [ACCOUNT_ERROR.AVATAR_UNSUPPORTED_TYPE]: { key: 'account.error.avatar_unsupported_type', label: 'Format d’image non pris en charge : JPEG, PNG ou WebP.' },
  [ACCOUNT_ERROR.AVATAR_UNREADABLE]: { key: 'account.error.avatar_unreadable', label: 'Cette image est illisible. Essayez-en une autre.' },
  [ACCOUNT_ERROR.BUSY]: { key: 'account.error.busy', label: 'Le service est occupé. Réessayez dans un instant.' },
  [ACCOUNT_ERROR.OFFLINE]: { key: 'account.error.offline', label: 'Vous semblez hors ligne. Vérifiez votre connexion puis réessayez.' },
  [ACCOUNT_ERROR.UNKNOWN]: { key: 'account.error.unknown', label: 'Une erreur est survenue. Réessayez.' }
}

/** Plafond d'avatar du front (retour immédiat) : le même que le serveur, qui fait foi (B-16, 413 `AVATAR_TOO_LARGE`). */
export const ACCOUNT_AVATAR_MAX_BYTES = AVATAR_MAX_BYTES

/** Types d'image acceptés par le champ d'avatar : JPEG, PNG, WebP (B-16). Le serveur vérifie la signature du fichier. */
export const ACCOUNT_AVATAR_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']
export const ACCOUNT_AVATAR_ACCEPT = ACCOUNT_AVATAR_TYPES.join(',')

/** Corps JSON maximal accepté par le serveur (M2) : 16 Kio. Les corps du compte sont bien en deçà. */
export const ACCOUNT_BODY_MAX_BYTES = 16 * 1024

/** Même recette que le CTA de l'accueil : bouton d'action principal des formulaires (48 px). */
export const ACCOUNT_SUBMIT_HOVER = { elevation: 'xl' } as const

/** Contrôle d'adresse de retour immédiat ; le serveur valide à son tour (`loginSchema`). */
export const ACCOUNT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Côté (px) de l'avatar affiché dans les formulaires du compte : `--origam-space---16` des maquettes. */
export const ACCOUNT_AVATAR_PREVIEW_SIZE = 64

/** Le glyphe de l'icône d'une carte d'état : point d'exclamation pour un échec, coche pour une réussite. */
export const ACCOUNT_STATE_GLYPHS: Record<ACCOUNT_STATE_TONE, string> = {
  [ACCOUNT_STATE_TONE.DANGER]: '!',
  [ACCOUNT_STATE_TONE.SUCCESS]: '✓'
}

/** Valeur affichée quand une information du profil est absente. */
export const PROFILE_EMPTY_GLYPH = '—'

/** La cause affichée pour chaque code d'erreur de l'API : on lit le code avant le statut (401 : identifiants ou session, 413 : avatar ou corps). */
export const ACCOUNT_ERROR_BY_CODE: Partial<Record<API_ERROR_CODE, ACCOUNT_ERROR>> = {
  [API_ERROR_CODE.INVALID_CREDENTIALS]: ACCOUNT_ERROR.INVALID_CREDENTIALS,
  [API_ERROR_CODE.INVALID_CURRENT_PASSWORD]: ACCOUNT_ERROR.INVALID_CURRENT_PASSWORD,
  [API_ERROR_CODE.RATE_LIMITED]: ACCOUNT_ERROR.RATE_LIMITED,
  [API_ERROR_CODE.VALIDATION_FAILED]: ACCOUNT_ERROR.VALIDATION_FAILED,
  [API_ERROR_CODE.UNPROCESSABLE]: ACCOUNT_ERROR.VALIDATION_FAILED,
  [API_ERROR_CODE.GONE]: ACCOUNT_ERROR.LINK_GONE,
  [API_ERROR_CODE.NOT_FOUND]: ACCOUNT_ERROR.LINK_UNKNOWN,
  [API_ERROR_CODE.UNAUTHORIZED]: ACCOUNT_ERROR.SESSION_EXPIRED,
  [API_ERROR_CODE.FORBIDDEN]: ACCOUNT_ERROR.FORBIDDEN,
  [API_ERROR_CODE.FORBIDDEN_ORIGIN]: ACCOUNT_ERROR.FORBIDDEN,
  [API_ERROR_CODE.BAD_REQUEST]: ACCOUNT_ERROR.BODY_REJECTED,
  [API_ERROR_CODE.PAYLOAD_TOO_LARGE]: ACCOUNT_ERROR.BODY_REJECTED,
  [API_ERROR_CODE.AVATAR_TOO_LARGE]: ACCOUNT_ERROR.AVATAR_TOO_LARGE,
  [API_ERROR_CODE.AVATAR_UNSUPPORTED_TYPE]: ACCOUNT_ERROR.AVATAR_UNSUPPORTED_TYPE,
  [API_ERROR_CODE.AVATAR_UNREADABLE]: ACCOUNT_ERROR.AVATAR_UNREADABLE,
  [API_ERROR_CODE.SERVICE_BUSY]: ACCOUNT_ERROR.BUSY,
  [API_ERROR_CODE.SERVICE_UNAVAILABLE]: ACCOUNT_ERROR.BUSY,
  [API_ERROR_CODE.REQUEST_TIMEOUT]: ACCOUNT_ERROR.BUSY
}

/** Ce qui manque à un profil incomplet, dit à la personne : le pseudo ne se saisit pas ici (A4), l'organisation le renseigne. */
export const PROFILE_FIELD_MESSAGES: Record<PROFILE_FIELD, IAccountMessage> = {
  [PROFILE_FIELD.NICKNAME]: { key: 'account.profile.missing_nickname', label: 'pseudo (renseigné par l’organisation)' },
  [PROFILE_FIELD.PHONE]: { key: 'account.profile.missing_phone', label: 'téléphone' },
  [PROFILE_FIELD.AVATAR]: { key: 'account.profile.missing_avatar', label: 'photo' }
}

/**
 * Longueur minimale passée à `origam-password-field` : 0. Origam construit toujours une règle de longueur (8 par défaut), même champ
 * vide et sans `requirements` (docs/tickets/origam/password-field-regle-longueur-forcee.md) ; 0 la neutralise, et la longueur
 * (15 à 128, B-08) passe alors uniquement par nos `rules` (`useAccountRules`), avec des messages traduits.
 */
export const ACCOUNT_PASSWORD_FIELD_MIN_LENGTH = 0
