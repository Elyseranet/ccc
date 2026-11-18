import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { ADMIN_REVOKE_CASE } from '../enums/administrator.enum.js'
import type { IAdminFailureMessages } from '../interfaces/admin-failure.interface.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import { ADMIN_ACCOUNT_FAILURE_MESSAGES } from './admin-competitors.const.js'

/** Mots de la partie locale d'un email (« maya.bonnet »), dont l'avatar tire ses initiales quand le compte n'a pas de fiche. */
export const ADMINISTRATOR_EMAIL_WORD_SEPARATOR = /[._-]+/

/** Largeur des colonnes « Administrateur » et « Compte » : celles de la maquette (277,8 et 155,5 px, mesurées à 1440 et à 390 px) ; « Action » prend le reste. */
export const ADMINISTRATOR_COLUMN_WIDTHS = { email: '277.8px', state: '155.5px' } as const

/** Largeur minimale de chaque colonne : celle de la maquette à 390 px, où la table défile dans son conteneur (« Action » : 143,9 px). */
export const ADMINISTRATOR_COLUMN_MIN_WIDTHS = { email: '277.8px', state: '155.5px', actions: '143.9px' } as const

/** Texte de confirmation du retrait, selon ce que le serveur fait du compte (décisions utilisateur 2026-11-18, B-31 Q1 et Q2). */
export const ADMIN_REVOKE_TEXTS: Record<ADMIN_REVOKE_CASE, ITranslatableText> = {
  [ADMIN_REVOKE_CASE.ACTIVE_WITH_COMPETITOR]: {
    key: 'admin.administrators.revoke_text_active_with_competitor',
    fallback: 'Ce compte perd l’accès à l’espace d’organisation et redevient un compte joueur. Il garde sa fiche et ses statistiques.'
  },
  [ADMIN_REVOKE_CASE.ACTIVE_WITHOUT_COMPETITOR]: {
    key: 'admin.administrators.revoke_text_active_without_competitor',
    fallback: 'Ce compte perd l’accès à l’espace d’organisation et redevient un compte joueur, sans fiche reliée.'
  },
  [ADMIN_REVOKE_CASE.INVITED_WITH_COMPETITOR]: {
    key: 'admin.administrators.revoke_text_invited_with_competitor',
    fallback: 'Ce compte perd l’accès à l’espace d’organisation et redevient un compte joueur invité : il garde sa fiche et son invitation en cours.'
  },
  [ADMIN_REVOKE_CASE.INVITED_WITHOUT_COMPETITOR]: {
    key: 'admin.administrators.revoke_text_invited_without_competitor',
    fallback: 'Cette invitation n’a jamais été activée : elle est annulée et le lien envoyé ne fonctionnera plus.'
  }
}

/** Retour du retrait : « Invitation annulée » pour un compte supprimé (invité sans fiche), « Accès retiré » sinon (le compte demeure, joueur). */
export const ADMIN_REVOKE_FEEDBACK: Record<ADMIN_REVOKE_CASE, ITranslatableText> = {
  [ADMIN_REVOKE_CASE.ACTIVE_WITH_COMPETITOR]: { key: 'admin.administrators.feedback_revoked', fallback: 'Accès retiré pour {email}' },
  [ADMIN_REVOKE_CASE.ACTIVE_WITHOUT_COMPETITOR]: { key: 'admin.administrators.feedback_revoked', fallback: 'Accès retiré pour {email}' },
  [ADMIN_REVOKE_CASE.INVITED_WITH_COMPETITOR]: { key: 'admin.administrators.feedback_revoked', fallback: 'Accès retiré pour {email}' },
  [ADMIN_REVOKE_CASE.INVITED_WITHOUT_COMPETITOR]: { key: 'admin.administrators.feedback_cancelled', fallback: 'Invitation annulée pour {email}' }
}

/** Messages d'alerte des écritures sur les administrateurs : ceux de la saisie d'email (F-62) plus les refus propres à B-31. */
export const ADMINISTRATOR_FAILURE_MESSAGES: IAdminFailureMessages = {
  byCode: {
    ...ADMIN_ACCOUNT_FAILURE_MESSAGES.byCode,
    [API_ERROR_CODE.ALREADY_ADMIN]: {
      title: { key: 'admin.account.error_email_used_title', fallback: 'Email déjà utilisé.' },
      text: { key: 'admin.administrators.error_already_admin_text', fallback: 'Cet email est déjà celui d’un administrateur : saisissez-en un autre.' }
    },
    [API_ERROR_CODE.ACCOUNT_ACTIVE]: {
      title: { key: 'admin.administrators.error_active_title', fallback: 'Compte déjà actif.' },
      text: { key: 'admin.administrators.error_active_text', fallback: 'Cet administrateur a activé son compte : c’est lui qui gère son email.' }
    },
    [API_ERROR_CODE.LAST_ADMIN]: {
      title: { key: 'admin.administrators.error_last_admin_title', fallback: 'Retrait refusé.' },
      text: { key: 'admin.administrators.error_last_admin_text', fallback: 'Retrait refusé : c’est le dernier administrateur actif.' }
    },
    [API_ERROR_CODE.CANNOT_REVOKE_SELF]: {
      title: { key: 'admin.administrators.error_self_title', fallback: 'Retrait refusé.' },
      text: { key: 'admin.administrators.error_self_text', fallback: 'Retrait refusé : vous ne pouvez pas retirer votre propre accès.' }
    },
    [API_ERROR_CODE.NOT_FOUND]: {
      title: { key: 'admin.administrators.error_not_found_title', fallback: 'Compte introuvable.' },
      text: { key: 'admin.administrators.error_not_found_text', fallback: 'Ce compte n’est plus administrateur : rechargez la liste.' }
    }
  },
  offline: ADMIN_ACCOUNT_FAILURE_MESSAGES.offline,
  unknown: {
    title: { key: 'admin.account.error_unknown_title', fallback: 'Une erreur est survenue.' },
    text: { key: 'admin.administrators.error_unknown_text', fallback: 'L’action n’a pas pu aboutir : réessayez.' }
  }
}
