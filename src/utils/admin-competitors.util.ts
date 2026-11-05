import { ADMIN_COMPETITOR_FAILURE_MESSAGES, ADMIN_COMPETITORS_PAGE_SIZE, ADMIN_COMPETITORS_QUERY_KEYS } from '../consts/admin-competitors.const.js'
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

/** 412 : la fiche a changé depuis sa lecture, l'écran la recharge. */
export const isVersionConflict = (failure: IAdminFailure | null): boolean => failure?.code === API_ERROR_CODE.VERSION_CONFLICT
