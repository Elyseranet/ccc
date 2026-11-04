import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import type { DataSource } from 'typeorm'
import {
  countPendingMigrations,
  loadMigrationsHealth,
  normalizeAppVersion,
  resolveAppVersion,
  parseMigrationTimestamps,
  toHealthMigrations
} from '../../src/utils/health.util'

const SHA = 'a3f9c2d41b7e4c6f8a0d5e1b2c3d4e5f60718293'

describe('normalizeAppVersion', () => {
  it.each([SHA, 'a3f9c2d', 'v1.2.3', '2026.11.04-rc1'])('keeps %s', (value) => {
    expect(normalizeAppVersion(value)).toBe(value)
  })

  it('trims spaces around the value', () => {
    expect(normalizeAppVersion(`  ${SHA}\n`)).toBe(SHA)
  })

  it.each([undefined, null, '', '   ', 42, {}, 'a b', 'sha;rm -rf', 'https://x.test', '<script>', 'é', 'a'.repeat(65)])(
    'answers null for %j (never an invented or unsafe value)', (value) => {
      expect(normalizeAppVersion(value)).toBeNull()
    }
  )
})

describe('resolveAppVersion', () => {
  it('reads the raw environment string first, so a numeric-looking short SHA survives Nitro\'s value parsing', () => {
    // runtimeConfig rend 3555796 comme nombre et 1234e56 comme 1.234e+59 : seule la variable brute est fidèle.
    expect(resolveAppVersion('3555796', 3555796)).toBe('3555796')
    expect(resolveAppVersion('1234e56', 1.234e+59)).toBe('1234e56')
  })

  it('falls back on runtimeConfig when the environment variable is absent, and refuses a non-text value there', () => {
    expect(resolveAppVersion(undefined, SHA)).toBe(SHA)
    expect(resolveAppVersion(undefined, 3555796)).toBeNull()
    expect(resolveAppVersion(undefined, '')).toBeNull()
    expect(resolveAppVersion(undefined, undefined)).toBeNull()
  })
})

describe('migrations state', () => {
  it('reads the timestamps from migration file names and ignores other files', () => {
    expect(parseMigrationTimestamps([
      '1793180000000-AddDrawAssignmentPoolNumber.ts',
      '1760131200000-CreateLegacyWorkbookImportTables.js',
      'README.md',
      'index.ts',
      '12-Short.ts',
      'assets:migrations:1792574200566-CreateInvitations.ts'
    ])).toEqual([1793180000000, 1760131200000, 1792574200566])
  })

  it('recognises every real migration file of the repository', () => {
    const files = readdirSync('src/server/db/migrations')
    expect(files.length).toBeGreaterThan(0)
    expect(parseMigrationTimestamps(files)).toHaveLength(files.length)
  })

  it('counts the shipped migrations that are not recorded yet', () => {
    expect(countPendingMigrations([1, 2, 3], [1, 2, 3])).toBe(0)
    expect(countPendingMigrations([1, 2, 3], [1])).toBe(2)
    expect(countPendingMigrations([1, 2], [])).toBe(2)
    // Une migration enregistrée mais absente du build (retour arrière de version) n'est pas « en attente ».
    expect(countPendingMigrations([1, 2], [1, 2, 9])).toBe(0)
  })

  it('maps the count to upToDate and pendingCount, with no other field', () => {
    expect(toHealthMigrations(0)).toEqual({ upToDate: true, pendingCount: 0 })
    expect(toHealthMigrations(3)).toEqual({ upToDate: false, pendingCount: 3 })
  })
})

describe('loadMigrationsHealth', () => {
  const dataSourceWith = (query: () => Promise<unknown>): DataSource => ({ query: vi.fn(query) }) as unknown as DataSource

  it('reads the tracking table once, in read-only mode', async () => {
    const dataSource = dataSourceWith(async () => [{ timestamp: '1' }, { timestamp: '2' }])
    expect(await loadMigrationsHealth(dataSource, [1, 2, 3])).toEqual({ upToDate: false, pendingCount: 1 })
    expect(dataSource.query).toHaveBeenCalledTimes(1)
    expect(vi.mocked(dataSource.query).mock.calls[0]![0]).toMatch(/^SELECT /)
  })

  it('treats a missing tracking table as everything pending', async () => {
    const dataSource = dataSourceWith(async () => { throw Object.assign(new Error('relation "migrations" does not exist'), { code: '42P01' }) })
    expect(await loadMigrationsHealth(dataSource, [1, 2])).toEqual({ upToDate: false, pendingCount: 2 })
  })

  it('lets any other database error through (the route then answers 503)', async () => {
    const dataSource = dataSourceWith(async () => { throw Object.assign(new Error('boom'), { code: '08006' }) })
    await expect(loadMigrationsHealth(dataSource, [1])).rejects.toThrow('boom')
  })

  it('answers null, not "up to date", when no shipped migration is known', async () => {
    const dataSource = dataSourceWith(async () => [])
    expect(await loadMigrationsHealth(dataSource, [])).toBeNull()
    expect(dataSource.query).not.toHaveBeenCalled()
  })
})

describe('Dockerfile and configuration (T-OPS-03)', () => {
  const dockerfile = readFileSync('Dockerfile', 'utf8')

  it('declares the build arguments in the runner stage and maps them to NUXT_APP_VERSION', () => {
    const runner = dockerfile.slice(dockerfile.indexOf('AS runner'))
    expect(runner).toMatch(/^ARG APP_VERSION=""$/m)
    expect(runner).toMatch(/^ARG SOURCE_COMMIT=""$/m)
    expect(runner).toContain('NUXT_APP_VERSION=${APP_VERSION:-${SOURCE_COMMIT}}')
  })

  it('hard-codes no version', () => {
    expect(dockerfile).not.toMatch(/NUXT_APP_VERSION=[0-9a-f]{7,}/)
    expect(dockerfile).not.toMatch(/ARG (APP_VERSION|SOURCE_COMMIT)=["']?[0-9A-Za-z]/)
  })

  it('reads the version from runtimeConfig and embeds the migrations list as server assets', () => {
    const config = readFileSync('nuxt.config.ts', 'utf8')
    expect(config).toMatch(/appVersion: ''/)
    expect(config).toMatch(/serverAssets: \[\{ baseName: 'migrations', dir: '\.\/src\/server\/db\/migrations' \}\]/)
  })
})
