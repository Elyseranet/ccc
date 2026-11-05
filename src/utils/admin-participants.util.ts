import { PARTICIPANT_CREATE_VALUE, PARTICIPANT_ERROR_MESSAGES, PARTICIPANT_ERROR_OFFLINE, PARTICIPANT_ERROR_UNKNOWN } from '../consts/admin-participants.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { IParticipantFormValues, IParticipantRow, IParticipantSuggestion } from '../interfaces/admin-participants.interface.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import type { ICompetitorListItem } from '../interfaces/competitor.interface.js'
import type { INewCompetitor } from '../interfaces/competitor-creation.interface.js'
import type { IAdminParticipant } from '../interfaces/edition.interface.js'
import { ApiRequestError } from './api-request-error.util.js'
import { getInitials } from './player.util.js'

/*********************************************************
 * Inscrits de l'admin (F-09)
 *
 * @description
 * Fonctions pures : traduction des erreurs de l'API en texte traduisible (une clé par code), préparation du corps
 * `newCompetitor`, lignes de la table et suggestions de la recherche.
 ********************************************************/

/** Texte traduisible d'une erreur d'API ; un échec sans réponse (réseau, délai) est distingué d'une réponse en erreur. */
export const toParticipantError = (error: unknown): ITranslatableText => {
  if (!(error instanceof ApiRequestError)) {
    return PARTICIPANT_ERROR_UNKNOWN
  }
  if (error.isOffline) {
    return PARTICIPANT_ERROR_OFFLINE
  }
  return PARTICIPANT_ERROR_MESSAGES[error.error.code as API_ERROR_CODE] ?? PARTICIPANT_ERROR_UNKNOWN
}

export const hasErrorCode = (error: unknown, code: API_ERROR_CODE): boolean =>
  error instanceof ApiRequestError && error.error.code === code

/** Corps `newCompetitor` : valeurs rognées, pseudo et téléphone omis quand ils sont vides (le serveur refuse une chaîne vide). */
export const toNewCompetitor = (values: IParticipantFormValues): INewCompetitor => {
  const nickname = values.nickname.trim()
  const phone = values.phone.trim()
  return {
    email: values.email.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    ...(nickname === '' ? {} : { nickname }),
    ...(phone === '' ? {} : { phone })
  }
}

export const toParticipantRow = (participant: IAdminParticipant): IParticipantRow => ({
  participationId: participant.participationId,
  competitorId: participant.competitor.id,
  displayName: participant.competitor.displayName,
  initials: getInitials(participant.competitor.displayName),
  avatarUrl: participant.competitor.avatarUrl,
  nickname: participant.competitor.nickname ?? '',
  editionsPlayed: participant.editionsPlayed,
  accountState: participant.account?.state ?? null
})

const toSuggestion = (item: ICompetitorListItem): IParticipantSuggestion => ({
  value: item.id,
  title: item.displayName,
  subtitle: item.editionsPlayed === 1
    ? { key: 'admin.participants.suggestion_one', fallback: '1 édition' }
    : { key: 'admin.participants.suggestion_other', fallback: '{count} éditions', params: { count: item.editionsPlayed } },
  initials: getInitials(item.displayName),
  avatarUrl: item.avatarUrl,
  isCreate: false
})

/** Profils proposés (déjà inscrits exclus), puis, toujours en dernier, « Créer un nouveau participant ». */
export const buildSuggestions = (items: ICompetitorListItem[], registeredIds: ReadonlySet<string>, query: string): IParticipantSuggestion[] => [
  ...items.filter(item => !registeredIds.has(item.id)).map(toSuggestion),
  {
    value: PARTICIPANT_CREATE_VALUE,
    title: query,
    subtitle: { key: 'admin.participants.create_hint', fallback: 'Aucun de ces profils ? Créez-le et envoyez l’invitation' },
    initials: '+',
    avatarUrl: null,
    isCreate: true
  }
]
