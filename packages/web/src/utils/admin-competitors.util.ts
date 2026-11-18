import { ADMIN_ACCOUNT_FAILURE_MESSAGES, ADMIN_COMPETITOR_FAILURE_MESSAGES, ADMIN_COMPETITORS_PAGE_SIZE, ADMIN_COMPETITORS_QUERY_KEYS } from '../consts/admin-competitors.const.js'
import { ADMIN_DATE_LOCALE } from '../consts/admin-editions.const.js'
import { EMAIL_MAX_LENGTH } from '../consts/auth.const.js'
import { FEEDBACK_STATUS } from '../enums/feedback.enum.js'
import type { IParticipantFeedback } from '../interfaces/admin-participants.interface.js'
import type { IAdminAccount } from '../interfaces/administrator.interface.js'
import type { IAccountEmailSet } from '../interfaces/invitation.interface.js'
import { COMPETITOR_DEFAULT_SORT, COMPETITOR_SEARCH_MAX_LENGTH, COMPETITOR_SEARCH_MIN_LENGTH } from '../consts/competitor.const.js'
import { ROUTES } from '../consts/routes.const.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import type { ICompetitorFormValues } from '../interfaces/admin-competitors.interface.js'
import type { IAdminFailure } from '../interfaces/admin-failure.interface.js'
import type { ICompetitorsQuery } from '../interfaces/api-client.interface.js'
import type { ICompetitorPublic, IUpdateCompetitorRequest } from '../interfaces/competitor.interface.js'
import type { TQueryValue } from '../types/query-value.type.js'
import { toAdminFailure } from './admin-failure.util.js'

/*********************************************************
 * Compétiteurs de l'admin (F-13)
 *
 * @description
 * Fonctions pures : valeurs du formulaire d'identité, corps de `PATCH /competiteurs/{id}`, requête de l'annuaire et message
 * d'alerte d'une erreur d'API. La version de l'identité (`If-Match`) n'est pas gérée ici : elle part du service, jamais d'un
 * champ du formulaire.
 ********************************************************/

export const toCompetitorFormValues = (competitor: Pick<ICompetitorPublic, 'displayName' | 'firstName' | 'lastName' | 'nickname'>): ICompetitorFormValues => ({
  displayName: competitor.displayName,
  firstName: competitor.firstName ?? '',
  lastName: competitor.lastName ?? '',
  nickname: competitor.nickname ?? ''
})

/** Les quatre champs de l'identité, rognés ; un champ vidé part en `null` pour l'effacer, le nom affiché ne peut pas l'être. */
export const toUpdateCompetitorRequest = (values: ICompetitorFormValues): IUpdateCompetitorRequest => ({
  displayName: values.displayName.trim(),
  firstName: values.firstName.trim() || null,
  lastName: values.lastName.trim() || null,
  nickname: values.nickname.trim() || null
})

/** Requête de l'annuaire : la recherche n'est envoyée qu'à partir de deux caractères (en dessous le serveur répond 400). */
export const toAdminCompetitorsQuery = (search: string, page: number): ICompetitorsQuery => {
  const q = search.trim().slice(0, COMPETITOR_SEARCH_MAX_LENGTH)
  return {
    ...(q.length >= COMPETITOR_SEARCH_MIN_LENGTH ? { q } : {}),
    page,
    pageSize: ADMIN_COMPETITORS_PAGE_SIZE,
    sort: COMPETITOR_DEFAULT_SORT
  }
}

const firstQueryValue = (raw: TQueryValue): string => (Array.isArray(raw) ? raw[0] : raw) ?? ''

/** Recherche de l'URL : texte rogné, limité à la longueur que le serveur accepte. */
export const toAdminSearch = (raw: TQueryValue): string => firstQueryValue(raw).trim().slice(0, COMPETITOR_SEARCH_MAX_LENGTH)

/** Page de l'URL : un entier positif, sinon la première. */
export const toAdminPage = (raw: TQueryValue): number => {
  const page = Number(firstQueryValue(raw))
  return Number.isInteger(page) && page > 1 ? page : 1
}

/** Query de l'URL après un changement de recherche ou de page : une valeur par défaut (recherche vide, page 1) disparaît. */
export const buildAdminCompetitorsLocationQuery = (
  current: Record<string, TQueryValue>,
  patch: { q?: string, page?: number }
): Record<string, string> => {
  const q = toAdminSearch(patch.q ?? current[ADMIN_COMPETITORS_QUERY_KEYS.SEARCH])
  const page = patch.page ?? toAdminPage(current[ADMIN_COMPETITORS_QUERY_KEYS.PAGE])
  return {
    ...(q === '' ? {} : { [ADMIN_COMPETITORS_QUERY_KEYS.SEARCH]: q }),
    ...(page > 1 ? { [ADMIN_COMPETITORS_QUERY_KEYS.PAGE]: String(page) } : {})
  }
}

/** Adresse de la correction d'un compétiteur dans l'admin. */
export const buildAdminCompetitorLink = (id: string): string => `${ROUTES.ADMIN_COMPETITORS}/${encodeURIComponent(id)}`

export const toCompetitorFailure = (cause: unknown): IAdminFailure => toAdminFailure(cause, ADMIN_COMPETITOR_FAILURE_MESSAGES)

export const toAccountFailure = (cause: unknown): IAdminFailure => toAdminFailure(cause, ADMIN_ACCOUNT_FAILURE_MESSAGES)

/** Même contrôle que le formulaire de création (F-09) ; le serveur reste l'autorité. */
export const isAccountEmailValid = (value: string | null | undefined): boolean => {
  const email = (value ?? '').trim()
  return email.length > 0 && email.length <= EMAIL_MAX_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Date d'expiration d'une invitation, en toutes lettres (« 24 novembre 2026 »). */
export const formatInvitationExpiry = (iso: string): string =>
  new Intl.DateTimeFormat(ADMIN_DATE_LOCALE, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso))

/** Administrateurs qu'on peut encore relier à une fiche (un compte ↔ une fiche) : ceux qui n'en ont pas. */
export const listLinkCandidates = (administrators: IAdminAccount[]): IAdminAccount[] =>
  administrators.filter(administrator => administrator.competitor === null)

/** Retour d'un envoi d'invitation, ou d'une liaison à un administrateur : succès, ou avertissement quand le compte existe mais que le mail n'est pas parti. */
export const toAccountFeedback = (result: Partial<IAccountEmailSet> & Pick<IAccountEmailSet, 'invitationSent'>, email: string): IParticipantFeedback => result.linked
  ? { status: FEEDBACK_STATUS.SUCCESS, message: { key: 'admin.account.feedback_linked', fallback: 'Fiche reliée au compte {email}', params: { email } } }
  : result.invitationSent
  ? { status: FEEDBACK_STATUS.SUCCESS, message: { key: 'admin.account.feedback_sent', fallback: 'Invitation envoyée à {email}', params: { email } } }
  : { status: FEEDBACK_STATUS.WARNING, message: { key: 'admin.account.feedback_not_sent', fallback: 'Compte créé pour {email}, mais l’invitation n’a pas pu être envoyée : renvoyez-la.', params: { email } } }

/** 412 : la fiche a changé depuis sa lecture, l'écran la recharge. */
export const isVersionConflict = (failure: IAdminFailure | null): boolean => failure?.code === API_ERROR_CODE.VERSION_CONFLICT
