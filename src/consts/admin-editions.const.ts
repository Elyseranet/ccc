import { ALIGN } from 'origam/enums'
import { EDITION_READONLY_FIELD } from '../enums/admin-editions.enum.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { EDITION_ORIGIN } from '../enums/edition.enum.js'
import type { IAdminFailureMessages, IAdminFailureText } from '../interfaces/admin-failure.interface.js'
import type { IAdminEditionColumn, IEditionReadonlyEntry } from '../interfaces/admin-editions.interface.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'

/** Quatre chiffres, ni signe ni espace : l'`<input>` reste un champ texte au clavier numérique (décision 87eea8e). */
export const EDITION_YEAR_PATTERN = /^\d{4}$/
export const EDITION_YEAR_LENGTH = 4

/** Locale de l'affichage des dates : l'application n'a qu'une langue. */
export const ADMIN_DATE_LOCALE = 'fr-FR'

/** Le sélecteur de date d'Origam renvoie une date locale ou un texte ISO : seuls ces dix premiers caractères comptent. */
export const ISO_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})/

/** Clé de cache de la liste des éditions, la même que celle du sélecteur d'édition de la coque admin. */
export const ADMIN_EDITIONS_CACHE_KEY = 'editions'


export const ADMIN_EDITION_COLUMNS: IAdminEditionColumn[] = [
  { field: 'code', title: { key: 'admin.editions.column_code', fallback: 'Code' }, sortable: true, width: '7.77%', minWidth: '68px' },
  { field: 'year', title: { key: 'admin.editions.column_year', fallback: 'Année' }, sortable: true, width: '8.38%', minWidth: '73px' },
  { field: 'name', title: { key: 'admin.editions.column_name', fallback: 'Nom' }, sortable: false, width: '12.98%', minWidth: '114px' },
  { field: 'heldOn', title: { key: 'admin.editions.column_date', fallback: 'Date' }, sortable: false, width: '12.98%', minWidth: '114px' },
  { field: 'status', title: { key: 'admin.editions.column_status', fallback: 'Statut' }, sortable: false, width: '16.87%', minWidth: '148px' },
  { field: 'origin', title: { key: 'admin.editions.column_origin', fallback: 'Origine' }, sortable: false, width: '13.82%', minWidth: '121px' },
  { field: 'participantCount', title: { key: 'admin.editions.column_participants', fallback: 'Participants' }, sortable: false, align: ALIGN.END, width: '13.55%', minWidth: '119px' },
  { field: 'actions', title: { key: 'admin.editions.column_action', fallback: 'Action' }, sortable: false, align: ALIGN.END, width: '13.64%', minWidth: '119px' }
]

/** Titre et texte du message d'alerte de chaque erreur d'API connue (B-10) ; `{code}` est le code de l'édition. */
const ADMIN_EDITION_FAILURES: IAdminFailureMessages['byCode'] = {
  [API_ERROR_CODE.VALIDATION_FAILED]: {
    title: { key: 'admin.editions.error_validation_title', fallback: 'Le formulaire contient une erreur.' },
    text: { key: 'admin.editions.error_validation_text', fallback: 'Vérifiez les champs puis réessayez : l’année doit compter 4 chiffres, le nom est obligatoire.' }
  },
  [API_ERROR_CODE.EDITION_CODE_EXHAUSTED]: {
    title: { key: 'admin.editions.error_code_exhausted_title', fallback: 'Plus aucun code disponible pour cette année.' },
    text: { key: 'admin.editions.error_code_exhausted_text', fallback: 'Toutes les lettres ont déjà servi : choisissez une autre année ou modifiez une édition existante.' }
  },
  [API_ERROR_CODE.EDITION_CONFLICT]: {
    title: { key: 'admin.editions.error_conflict_title', fallback: 'Création en conflit avec une autre.' },
    text: { key: 'admin.editions.error_conflict_text', fallback: 'Une autre édition vient d’être créée en même temps : réessayez.' }
  },
  [API_ERROR_CODE.EDITION_CLOSED]: {
    title: { key: 'admin.editions.error_closed_title', fallback: 'Modification refusée.' },
    text: { key: 'admin.editions.error_closed_text', fallback: 'L’édition {code} est clôturée. Rechargez la page pour afficher son état actuel.' }
  },
  [API_ERROR_CODE.NOT_FOUND]: {
    title: { key: 'admin.editions.error_not_found_title', fallback: 'Édition introuvable.' },
    text: { key: 'admin.editions.error_not_found_text', fallback: 'Cette édition n’existe plus : revenez à la liste.' }
  },
  [API_ERROR_CODE.UNAUTHORIZED]: {
    title: { key: 'admin.editions.error_unauthorized_title', fallback: 'Session expirée.' },
    text: { key: 'admin.editions.error_unauthorized_text', fallback: 'Votre session a expiré : reconnectez-vous.' }
  },
  [API_ERROR_CODE.FORBIDDEN]: {
    title: { key: 'admin.editions.error_forbidden_title', fallback: 'Action refusée.' },
    text: { key: 'admin.editions.error_forbidden_text', fallback: 'Cette action est réservée aux administrateurs.' }
  },
  [API_ERROR_CODE.RATE_LIMITED]: {
    title: { key: 'admin.editions.error_rate_limited_title', fallback: 'Trop de demandes.' },
    text: { key: 'admin.editions.error_rate_limited_text', fallback: 'Patientez un instant puis réessayez.' }
  },
  [API_ERROR_CODE.REQUEST_TIMEOUT]: {
    title: { key: 'admin.editions.error_timeout_title', fallback: 'Délai dépassé.' },
    text: { key: 'admin.editions.error_timeout_text', fallback: 'L’envoi a pris trop de temps : réessayez.' }
  }
}

const ADMIN_EDITION_FAILURE_OFFLINE: IAdminFailureText = {
  title: { key: 'admin.editions.error_offline_title', fallback: 'Hors ligne.' },
  text: { key: 'admin.editions.error_offline_text', fallback: 'Vérifiez votre connexion puis réessayez.' }
}

const ADMIN_EDITION_FAILURE_UNKNOWN: IAdminFailureText = {
  title: { key: 'admin.editions.error_unknown_title', fallback: 'Une erreur est survenue.' },
  text: { key: 'admin.editions.error_unknown_text', fallback: 'L’enregistrement a échoué : réessayez.' }
}

/** Messages d'alerte des écritures d'édition (B-10). */
export const ADMIN_EDITION_FAILURE_MESSAGES: IAdminFailureMessages = {
  byCode: ADMIN_EDITION_FAILURES,
  offline: ADMIN_EDITION_FAILURE_OFFLINE,
  unknown: ADMIN_EDITION_FAILURE_UNKNOWN
}

/** Un champ en lecture seule et la précision écrite sous sa valeur (`null` : aucune). */
export const EDITION_READONLY_EDIT_FIELDS: IEditionReadonlyEntry[] = [
  { field: EDITION_READONLY_FIELD.CODE, hint: { key: 'admin.editions.readonly_code_hint', fallback: 'Immuable : adresse publique' } },
  { field: EDITION_READONLY_FIELD.YEAR, hint: { key: 'admin.editions.readonly_year_hint', fallback: 'Non modifiable' } },
  { field: EDITION_READONLY_FIELD.STATUS, hint: { key: 'admin.editions.readonly_status_hint', fallback: 'Suit le déroulé du tournoi' } }
]

/** Édition clôturée : tout est en lecture seule. */
export const EDITION_READONLY_CLOSED_FIELDS: IEditionReadonlyEntry[] = [
  { field: EDITION_READONLY_FIELD.CODE, hint: { key: 'admin.editions.readonly_code_hint_closed', fallback: 'Immuable' } },
  { field: EDITION_READONLY_FIELD.YEAR, hint: null },
  { field: EDITION_READONLY_FIELD.NAME, hint: null },
  { field: EDITION_READONLY_FIELD.DATE, hint: null },
  { field: EDITION_READONLY_FIELD.LOCATION, hint: null },
  { field: EDITION_READONLY_FIELD.PARTICIPANTS, hint: { key: 'admin.editions.readonly_participants_hint', fallback: 'N figé à la clôture' } }
]

/** Libellé de chaque champ en lecture seule. */
export const EDITION_READONLY_LABELS: Record<EDITION_READONLY_FIELD, ITranslatableText> = {
  [EDITION_READONLY_FIELD.CODE]: { key: 'admin.editions.readonly_code', fallback: 'Code' },
  [EDITION_READONLY_FIELD.YEAR]: { key: 'admin.editions.readonly_year', fallback: 'Année' },
  [EDITION_READONLY_FIELD.STATUS]: { key: 'admin.editions.readonly_status', fallback: 'Statut' },
  [EDITION_READONLY_FIELD.NAME]: { key: 'admin.editions.readonly_name', fallback: 'Nom' },
  [EDITION_READONLY_FIELD.DATE]: { key: 'admin.editions.readonly_date', fallback: 'Date' },
  [EDITION_READONLY_FIELD.LOCATION]: { key: 'admin.editions.readonly_location', fallback: 'Lieu' },
  [EDITION_READONLY_FIELD.PARTICIPANTS]: { key: 'admin.editions.readonly_participants', fallback: 'Participants' }
}

/** Origine d'une édition (EDITION_ORIGIN) : libellé et props d'origam-chip (pleine primaire pour l'application, neutre pour l'archive). */
export const EDITION_ORIGIN_CHIPS: Record<EDITION_ORIGIN, { label: ITranslatableText, props: { color?: string, bgColor?: string } }> = {
  [EDITION_ORIGIN.APP]: { label: { key: 'admin.editions.origin_app', fallback: 'Application' }, props: { color: 'primary', bgColor: 'primary' } },
  [EDITION_ORIGIN.LEGACY_IMPORT]: { label: { key: 'admin.editions.origin_legacy', fallback: 'Archive' }, props: {} }
}

/** Survol du bouton « Créer une édition » : même recette que le CTA de l'accueil (mapping.md). */
export const ADMIN_EDITIONS_CTA_HOVER = { elevation: 'xl' }

/** Tri initial de la liste : code décroissant (2026, 2025b, 2025…). */
export const ADMIN_EDITIONS_SORT_FIELD = 'code'
export const ADMIN_EDITIONS_DEFAULT_SORT = [{ key: ADMIN_EDITIONS_SORT_FIELD, order: 'desc' as const }]
