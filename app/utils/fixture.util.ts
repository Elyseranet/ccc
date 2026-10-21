import { USER_ROLE } from '#shared/enums/user.enum'
import { API_SOURCES } from '~/consts/api-sources.const'
import { FIXTURE_SESSION_ADMIN, FIXTURE_SESSION_PARTICIPANT } from '~/consts/api.const'
import { API_SOURCE } from '~/enums/api-source.enum'
import { FIXTURE_VARIANT } from '~/enums/fixture-variant.enum'

export const findFixtureEndpoints = (table: Record<string, API_SOURCE> = API_SOURCES): string[] =>
  Object.entries(table).filter(([, source]) => source === API_SOURCE.FIXTURE).map(([endpoint]) => endpoint)

export const isFixtureSelectionAllowed = (): boolean =>
  import.meta.dev || process.env.NODE_ENV === 'test'

export const parseFixtureVariant = (raw: unknown, allowed: boolean): FIXTURE_VARIANT => {
  if (!allowed) {
    return FIXTURE_VARIANT.DEFAULT
  }
  const value = Array.isArray(raw) ? raw[0] : raw
  return Object.values(FIXTURE_VARIANT).includes(value as FIXTURE_VARIANT) ? (value as FIXTURE_VARIANT) : FIXTURE_VARIANT.DEFAULT
}

export const parseFixtureRole = (raw: unknown, allowed: boolean): USER_ROLE | null => {
  if (!allowed) {
    return null
  }
  if (raw === FIXTURE_SESSION_ADMIN) {
    return USER_ROLE.ADMIN
  }
  if (raw === FIXTURE_SESSION_PARTICIPANT) {
    return USER_ROLE.PARTICIPANT
  }
  return null
}
