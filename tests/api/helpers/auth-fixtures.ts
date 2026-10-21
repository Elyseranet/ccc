import 'reflect-metadata'
import type { DataSource } from 'typeorm'
import { fetch } from '@nuxt/test-utils/e2e'
import { USER_ROLE, USER_STATUS } from '../../../shared/enums/user.enum'
import { TEST_DEVICE_COOKIE_SECRET } from './test-database'
import { CompetitorEntity } from '../../../server/database/entities/competitor.entity'
import { UserEntity } from '../../../server/database/entities/user.entity'
import { hashPassword } from '../../../server/utils/auth/password.util'

export const SESSION_COOKIE = '__Host-ccc_session'

export interface ISeededUser {
  id: string
  email: string
  password: string
  competitorId: string | null
}

/** Repart d'une base `_test` vierge, migrations M0 à M2 appliquées. Le nom `_test` est vérifié par `requireTestDatabaseEnv`. */
export const resetTestDatabase = async (): Promise<DataSource> => {
  const dataSource = (await import('../../../server/database/data-source')).default
  if (!dataSource.isInitialized) {
    await dataSource.initialize()
  }
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
  return dataSource
}

export const seedUser = async (
  dataSource: DataSource,
  options: { email: string, password: string, role: USER_ROLE, withCompetitor?: boolean, status?: USER_STATUS }
): Promise<ISeededUser> => {
  const competitor = options.withCompetitor
    ? await dataSource.getRepository(CompetitorEntity).save({ displayName: `Joueur ${options.email}`, phone: '+33 6 00 00 00 00' })
    : null
  const user = await dataSource.getRepository(UserEntity).save({
    email: options.email,
    role: options.role,
    status: options.status ?? USER_STATUS.ACTIVE,
    passwordHash: await hashPassword(options.password),
    competitorId: competitor?.id ?? null
  })
  return { id: user.id, email: options.email, password: options.password, competitorId: competitor?.id ?? null }
}

export const jsonPost = (path: string, body: unknown, headers: Record<string, string> = {}): Promise<Response> =>
  fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  })

export const jsonPatch = (path: string, body: unknown, cookie?: string): Promise<Response> =>
  fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body)
  })

/** `Set-Cookie` brut de la réponse. */
export const setCookieOf = (response: Response): string | undefined =>
  response.headers.getSetCookie().find((entry) => entry.startsWith(`${SESSION_COOKIE}=`) || entry.startsWith('ccc_session='))

/** Valeur à renvoyer dans `Cookie:` à partir d'un `Set-Cookie`. */
export const cookieHeaderOf = (response: Response): string => {
  const raw = setCookieOf(response)
  if (!raw) {
    throw new Error('No session cookie in response')
  }
  return raw.split(';')[0]!
}

export const login = (email: string, password: string, cookie?: string): Promise<Response> =>
  jsonPost('/api/v1/auth/login', { email, password }, cookie ? { Cookie: cookie } : {})

export const getWith = (path: string, cookie?: string): Promise<Response> =>
  fetch(path, { headers: cookie ? { Cookie: cookie } : {} })

export const DEVICE_COOKIE = '__Host-ccc_device'

/** Secret HMAC de test du cookie d'appareil (ne protège rien : base et serveur jetables). */
export const TEST_DEVICE_SECRET = TEST_DEVICE_COOKIE_SECRET

/** `Set-Cookie` brut du cookie d'appareil. */
export const deviceSetCookieOf = (response: Response): string | undefined =>
  response.headers.getSetCookie().find((entry) => entry.startsWith(`${DEVICE_COOKIE}=`))

/** Valeur `name=value` du cookie d'appareil, à renvoyer dans `Cookie:`. */
export const deviceCookieHeaderOf = (response: Response): string => {
  const raw = deviceSetCookieOf(response)
  if (!raw) {
    throw new Error('No device cookie in response')
  }
  return raw.split(';')[0]!
}
