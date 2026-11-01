import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DataSource } from 'typeorm'
import { LOG_EVENT } from '../../src/consts/log-event.const.js'
import { runMigrationsCommand } from '../../src/utils/run-migrations.util.js'
import { logger } from '../../src/utils/logger.util.js'

const fakeDataSource = (overrides: Record<string, unknown>): DataSource => overrides as unknown as DataSource

afterEach(() => {
  vi.restoreAllMocks()
})

describe('runMigrationsCommand', () => {
  it('up : journalise migrations_applied avec la liste des noms et renvoie 0', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const dataSource = fakeDataSource({ runMigrations: vi.fn().mockResolvedValue([{ name: 'A1' }, { name: 'B2' }]) })

    expect(await runMigrationsCommand(dataSource, 'up')).toBe(0)
    expect(info).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_APPLIED, { count: 2, migrations: ['A1', 'B2'] })
  })

  it('up : journalise migrations_up_to_date quand rien n\'est à appliquer', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const dataSource = fakeDataSource({ runMigrations: vi.fn().mockResolvedValue([]) })

    expect(await runMigrationsCommand(dataSource, 'up')).toBe(0)
    expect(info).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_UP_TO_DATE)
  })

  it('up : journalise migrations_failed et renvoie 1 si une migration échoue', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const dataSource = fakeDataSource({ runMigrations: vi.fn().mockRejectedValue(new Error('relation already exists')) })

    expect(await runMigrationsCommand(dataSource, 'up')).toBe(1)
    expect(error).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_FAILED, { errorName: 'Error', errorCode: null })
    expect(info).not.toHaveBeenCalled()
  })

  it('revert : annule la dernière migration, journalise son nom et renvoie 0', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const undoLastMigration = vi.fn().mockResolvedValue(undefined)
    const dataSource = fakeDataSource({ query: vi.fn().mockResolvedValue([{ name: 'B2' }]), undoLastMigration })

    expect(await runMigrationsCommand(dataSource, 'revert')).toBe(0)
    expect(undoLastMigration).toHaveBeenCalledOnce()
    expect(info).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_REVERTED, { migrations: ['B2'] })
  })

  it('revert : renvoie 1 et journalise migrations_failed si l\'annulation échoue', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const dataSource = fakeDataSource({
      query: vi.fn().mockResolvedValue([]),
      undoLastMigration: vi.fn().mockRejectedValue(new Error('down failed'))
    })

    expect(await runMigrationsCommand(dataSource, 'revert')).toBe(1)
    expect(error).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_FAILED, { errorName: 'Error', errorCode: null })
  })

  it('refuse une sous-commande inconnue sans toucher à la base', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const runMigrations = vi.fn()

    expect(await runMigrationsCommand(fakeDataSource({ runMigrations }), 'drop')).toBe(1)
    expect(runMigrations).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledOnce()
  })

  it('T-SEC-09 L5 : n\'écrit jamais le message de l\'erreur pg (utilisateur, base, hôte), seulement son type et son code SQLSTATE', async () => {
    const lines: string[] = []
    const sink = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => { lines.push(String(chunk)); return true })
    const pgError = Object.assign(new Error('password authentication failed for user=ccc database=ccc_prod host=db.internal.example'), { name: 'error', code: '28P01' })
    const dataSource = fakeDataSource({ runMigrations: vi.fn().mockRejectedValue(pgError) })

    expect(await runMigrationsCommand(dataSource, 'up')).toBe(1)
    sink.mockRestore()
    const output = lines.join('')
    expect(output).toContain('migrations_failed')
    expect(output).toContain('28P01')
    expect(output).not.toMatch(/user=|database=|host=|ccc_prod|internal\.example/)
  })

  it('une sous-commande inconnue journalise l\'usage, pas l\'entrée de l\'utilisateur', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    await runMigrationsCommand(fakeDataSource({}), 'drop-everything')
    expect(error).toHaveBeenCalledExactlyOnceWith(LOG_EVENT.MIGRATIONS_FAILED, { errorName: 'UsageError', usage: 'run-migrations {up|revert}' })
  })
})
