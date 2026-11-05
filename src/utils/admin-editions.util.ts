import {
  ADMIN_DATE_LOCALE,
  ADMIN_EDITION_FAILURE_MESSAGES,
  EDITION_YEAR_PATTERN,
  ISO_DATE_PATTERN
} from '../consts/admin-editions.const.js'
import { EDITION_YEAR_MAX, EDITION_YEAR_MIN } from '../consts/edition.const.js'
import { ROUTES } from '../consts/routes.const.js'
import { EDITION_YEAR_ISSUE } from '../enums/admin-editions.enum.js'
import { EDITION_STATUS } from '../enums/edition.enum.js'
import type { IEditionFormValues } from '../interfaces/admin-editions.interface.js'
import type { IAdminFailure } from '../interfaces/admin-failure.interface.js'
import type { ICreateEditionRequest, IEditionSummary, IUpdateEditionRequest } from '../interfaces/edition.interface.js'
import { toAdminFailure } from './admin-failure.util.js'
import { normalizeSearchText } from './player.util.js'

/*********************************************************
 * Éditions de l'admin (F-13)
 *
 * @description
 * Fonctions pures : valeurs du formulaire, corps des requêtes `POST /editions` et `PATCH /editions/{id}`, règle de l'année,
 * recherche dans la liste, affichage des dates, et traduction des erreurs d'API en message d'alerte. Le serveur reste
 * l'autorité : ces règles ne servent qu'à un retour immédiat.
 ********************************************************/

/** Adresse de la fiche d'une édition de l'admin (par son code, immuable). */
export const buildAdminEditionLink = (code: string): string => `${ROUTES.ADMIN_EDITIONS}/${encodeURIComponent(code)}`

export const emptyEditionFormValues = (): IEditionFormValues => ({ year: '', name: '', heldOn: null, location: '', description: '' })

export const toEditionFormValues = (edition: Pick<IEditionSummary, 'year' | 'name' | 'heldOn' | 'location'> & { description?: string | null }): IEditionFormValues => ({
  year: String(edition.year),
  name: edition.name ?? '',
  heldOn: edition.heldOn,
  location: edition.location ?? '',
  description: edition.description ?? ''
})

/** Le sélecteur de date renvoie une `Date` locale ou un texte ISO : on garde `YYYY-MM-DD`, ou `null` si le champ est vide. */
export const toIsoDate = (value: unknown): string | null => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null
    }
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${value.getFullYear()}-${month}-${day}`
  }
  return typeof value === 'string' ? (ISO_DATE_PATTERN.exec(value)?.[1] ?? null) : null
}

/** Date `YYYY-MM-DD` de l'édition affichée dans la langue de l'application ; `null` quand elle n'est pas renseignée. */
export const formatEditionDate = (isoDate: string | null): string | null => {
  const iso = isoDate ? ISO_DATE_PATTERN.exec(isoDate)?.[1] : undefined
  if (!iso) {
    return null
  }
  return new Intl.DateTimeFormat(ADMIN_DATE_LOCALE, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
}

/** Règle de l'année : obligatoire, 4 chiffres, entre 2000 et 2100 (`EDITION_YEAR_MIN` et `EDITION_YEAR_MAX`, schéma serveur de B-10). */
export const checkEditionYear = (value: string | null | undefined): EDITION_YEAR_ISSUE | null => {
  const year = (value ?? '').trim()
  if (year === '') {
    return EDITION_YEAR_ISSUE.REQUIRED
  }
  if (!EDITION_YEAR_PATTERN.test(year)) {
    return EDITION_YEAR_ISSUE.FORMAT
  }
  const numeric = Number(year)
  return numeric < EDITION_YEAR_MIN || numeric > EDITION_YEAR_MAX ? EDITION_YEAR_ISSUE.RANGE : null
}

const blankToUndefined = (value: string): string | undefined => value.trim() === '' ? undefined : value.trim()

/** Création : le serveur refuse une chaîne vide, les champs facultatifs vides sont donc omis. Le code n'est jamais envoyé (CE-1). */
export const toCreateEditionRequest = (values: IEditionFormValues): ICreateEditionRequest => {
  const location = blankToUndefined(values.location)
  const description = blankToUndefined(values.description)
  return {
    year: Number(values.year.trim()),
    name: values.name.trim(),
    ...(values.heldOn ? { heldOn: values.heldOn } : {}),
    ...(location === undefined ? {} : { location }),
    ...(description === undefined ? {} : { description })
  }
}

/**
 * Modification : ni le code, ni l'année, ni le statut (R-9). Un champ vidé part en `null` pour l'effacer ; le nom, que le
 * serveur ne laisse pas vide, n'est envoyé que renseigné.
 */
export const toUpdateEditionRequest = (values: IEditionFormValues): IUpdateEditionRequest => {
  const name = blankToUndefined(values.name)
  return {
    ...(name === undefined ? {} : { name }),
    heldOn: values.heldOn ?? null,
    location: blankToUndefined(values.location) ?? null,
    description: blankToUndefined(values.description) ?? null
  }
}

/** Édition clôturée : lecture seule, le serveur répond 409 `EDITION_CLOSED` à toute écriture. */
export const isEditionClosed = (edition: Pick<IEditionSummary, 'status'>): boolean => edition.status === EDITION_STATUS.CLOSED

/** Recherche par code ou par année, sans accent ni casse. */
export const filterEditions = (editions: IEditionSummary[], query: string): IEditionSummary[] => {
  const needle = normalizeSearchText(query)
  if (needle === '') {
    return editions
  }
  return editions.filter(edition => normalizeSearchText(edition.code).includes(needle) || String(edition.year).includes(needle))
}

/** Message d'alerte d'une erreur d'API. `code` est le code de l'édition, repris dans le texte de `EDITION_CLOSED`. */
export const toEditionFailure = (cause: unknown, code = ''): IAdminFailure =>
  toAdminFailure(cause, ADMIN_EDITION_FAILURE_MESSAGES, { code })
