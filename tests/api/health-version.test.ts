import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { HEALTH_STATUS } from '../../src/enums/health-status.enum'
import type { IHealth } from '../../src/interfaces/health.interface'
import { resetTestDatabase } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

// Un SHA court valable que Nitro lit comme le nombre 1.234e+59 : la sonde doit le rendre tel quel.
const SHA = '1234e56'

describe('GET /api/v1/health (version and migrations, T-OPS-03)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()
  const shipped = dataSource.migrations.length

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_APP_VERSION: SHA }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const health = async (): Promise<{ status: number, text: string, body: IHealth }> => {
    const response = await fetch('/api/v1/health')
    const text = await response.text()
    return { status: response.status, text, body: JSON.parse(text) as IHealth }
  }

  it('returns the version injected through NUXT_APP_VERSION', async () => {
    const { status, body } = await health()
    expect(status).toBe(200)
    expect(body).toEqual({ status: HEALTH_STATUS.OK, version: SHA, migrations: { upToDate: true, pendingCount: 0 } })
  })

  it('counts the shipped migrations that are missing from the tracking table', async () => {
    await dataSource.undoLastMigration()
    expect((await health()).body.migrations).toEqual({ upToDate: false, pendingCount: 1 })
    await dataSource.undoLastMigration()
    expect((await health()).body.migrations).toEqual({ upToDate: false, pendingCount: 2 })
    await dataSource.runMigrations()
    expect((await health()).body.migrations).toEqual({ upToDate: true, pendingCount: 0 })
  })

  it('counts every shipped migration as pending when the tracking table does not exist, without creating it', async () => {
    await dataSource.query('DROP TABLE "migrations"')
    const { status, body } = await health()
    expect(status).toBe(200)
    expect(body.migrations).toEqual({ upToDate: false, pendingCount: shipped })
    const exists = await dataSource.query(`SELECT to_regclass('migrations') AS name`) as Array<{ name: string | null }>
    expect(exists[0]!.name).toBeNull()
    // La sonde est en lecture seule : la base est rétablie par le test, pas par elle.
    await resetTestDatabase()
  })

  it('exposes no migration name, host, user or driver message', async () => {
    const { text } = await health()
    expect(text).not.toMatch(/Create|Add|Invitation|Avatar|Draw|Login|Identity|Domain|Throttle/)
    expect(text).not.toContain(env.NUXT_DATABASE_HOST)
    expect(text).not.toContain(env.NUXT_DATABASE_USERNAME)
    expect(text).not.toContain(env.NUXT_DATABASE_PASSWORD)
  })
})
